# -*- coding: utf-8 -*-
"""The canvas planning calls carry the turn's own scope (J6 draft finding).

The orchestrator builds ONE LLMService with the tenant alone; its
tenant→workspace resolution freezes at construction. The chat reply lane
passes the request's workspace explicitly, but the canvas edit/action
planning calls passed NOTHING — so on a deployment where the user
registered their local provider in their own workspace, the planner's
structured pool was EMPTY ("canvas edit planning LLM returned no plan
(provider failure)") while the same registration served the reply lane.
Evidence: j6_draft_20261014_110156/110843/111238 runs on 33f54ba75.

These tests pin the seam: both planning entrypoints must forward the
caller's workspace/tenant into generate_structured_response, and the
shared planning call must carry them into the service call.
"""
import os
os.environ.setdefault("TESTING", "1")

import pytest
from unittest.mock import AsyncMock, MagicMock

from core.chat_canvas_editor import (
    CanvasActionPlan,
    CanvasEditPlan,
    plan_canvas_action,
    plan_canvas_edit,
)
from core.llm.pinned_planning import pinned_structured_call


def _canvas():
    return {
        "canvas_id": "c-123",
        "canvas_type": "document",
        "title": "Quotation Q-2026-114",
        "content": "Unit price: $48,000.00\nValid until: 2026-11-30\n",
    }


def _scoped_llm(plan):
    llm = MagicMock()
    llm.generate_structured_response = AsyncMock(return_value=plan)
    return llm


@pytest.mark.asyncio
async def test_edit_plan_forwards_the_turn_scope():
    llm = _scoped_llm(CanvasEditPlan(
        wants_edit=True, updated_content_json='"x"'))
    await plan_canvas_edit(
        "update the valid until date", [], _canvas(), llm,
        workspace_id="ws-user", tenant_id="tenant-1")
    kwargs = llm.generate_structured_response.await_args.kwargs
    assert kwargs.get("workspace_id") == "ws-user"
    assert kwargs.get("tenant_id") == "tenant-1"


@pytest.mark.asyncio
async def test_action_plan_forwards_the_turn_scope():
    llm = _scoped_llm(CanvasActionPlan(wants_action=False))
    # The action lane has a deterministic gate: the message must carry a
    # send imperative for the LLM to be consulted at all.
    await plan_canvas_action(
        "send this quote to the client", [], _canvas(), llm,
        workspace_id="ws-user", tenant_id="tenant-1")
    kwargs = llm.generate_structured_response.await_args.kwargs
    assert kwargs.get("workspace_id") == "ws-user"
    assert kwargs.get("tenant_id") == "tenant-1"


@pytest.mark.asyncio
async def test_shared_planning_call_carries_scope():
    llm = _scoped_llm("ok")
    await pinned_structured_call(
        llm, prompt="p", response_model=None,
        system_instruction="s", task_type="planning",
        workspace_id="ws-user", tenant_id="tenant-1")
    kwargs = llm.generate_structured_response.await_args.kwargs
    assert kwargs.get("workspace_id") == "ws-user"
    assert kwargs.get("tenant_id") == "tenant-1"


@pytest.mark.asyncio
async def test_no_scope_kwargs_stay_absent():
    """Callers with no scope keep today's behaviour byte-identically —
    the service resolves its own scope as before."""
    llm = _scoped_llm("ok")
    await pinned_structured_call(
        llm, prompt="p", response_model=None,
        system_instruction="s", task_type="planning")
    kwargs = llm.generate_structured_response.await_args.kwargs
    assert "workspace_id" not in kwargs
    assert "tenant_id" not in kwargs
