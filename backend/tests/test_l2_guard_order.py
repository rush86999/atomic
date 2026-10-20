# -*- coding: utf-8 -*-
"""Guard-order regression for the L2 S3 comparison.

The served attempt-4 trace: the reply text existed at 64s (31s left), the
search/absence guard chain replaced an unsupported search claim and then
launched a corrective generation, which exhausted the turn clock. This
control drives the REAL reply-processing path with controlled model
responses and asserts the verified comparison is delivered BEFORE any
corrective generation (one reply endpoint call, no budget error).
"""
from __future__ import annotations

import asyncio
import uuid
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.test_source_ask_tool_execution import (
    _ScriptedReplyEndpoint,
    _authorized_workspace,
    _register_local_route,
    scoped_world,  # noqa: F401 — pytest fixture
    world_app,  # noqa: F401 — pytest fixture
)
from tests.test_l2_continuation_evidence import (
    PRIOR_FILE,
    _seed_catalog_document,
    _session_with,
)

S3_ASK = (
    "Compare the draft quotation with my uploaded Approved Records document. "
    "Does the Valid Until date in the draft match the approved record? "
    "Flag anything that differs. Do not change anything yet.")

from core.llm_service import LLMService

S3_DEFECTIVE_REPLY = (
    "I couldn't search anything this turn — no connected system was "
    "queried, so there are no results. The draft's Valid until date is "
    "2026-12-31; the approved record says 2023-01-01, so they differ.")

CANVAS = {
    "canvas_id": "canvas-guard",
    "title": "Quotation Q-2026-114 (DRAFT)",
    "content": (
        "# Quotation Q-2026-114 (DRAFT)\n\n"
        "Client: Dunmore Fabrication LLC\n"
        "Unit price: $48,000.00\n"
        "Terms: Net 45\n"
        "Valid until: 2026-12-31\n"),
}


@pytest.mark.asyncio
async def test_s3_verified_comparison_preempts_corrective_regeneration(
        scoped_world, world_app):
    import integrations.chat_orchestrator as co

    ws = _authorized_workspace(world_app, scoped_world)
    _seed_catalog_document(scoped_world, ws, file_name=PRIOR_FILE)
    endpoint = _ScriptedReplyEndpoint(S3_DEFECTIVE_REPLY)
    endpoint.__enter__()
    try:
        _register_local_route(world_app, ws, endpoint.base_url)
        orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
        orch.tenant_id = "default"
        orch._cancelled_sessions = set()
        orch._budget_exceeded_runs = set()
        orch.llm_service = LLMService(tenant_id="default")
        session = _session_with(observed_files=[PRIOR_FILE])
        session["id"] = "sess-guard-order"
        session["history"] = []

        async def _fake_interpret(message_, session_=None, history=None,
                                  context=None, **kw):
            return {
                "schema": "turn-interpretation-1", "request_id": "",
                "origin": "llm:test-model", "unresolved_reason": "",
                "message": message_, "actions": [
                    {"kind": "research", "subjects": [], "note": "",
                     "authorization": "granted"}],
                "subjects": [], "sources": [PRIOR_FILE],
                "requested_fields": ["expiration_date"],
                "output_format": "", "constraints": [],
                "scope_change": "replace", "confidence": 0.9,
                "deterministic_decision": None,
            }

        async def _fake_assemble(**kwargs):
            out = kwargs.get("source_observations_out")
            if isinstance(out, list):
                out.append({
                    "observation_id": "s3-guard-obs",
                    "source": "ingested",
                    "file_name": PRIOR_FILE,
                    "title": PRIOR_FILE,
                    "workspace_id": ws["workspace_id"],
                    "content_hash": "hash-guard",
                    "excerpt": "Approved valid until: 2026-12-31",
                    "field_associations": {
                        "expiration_date": {
                            "value": "2026-12-31",
                            "span": "Approved valid until: 2026-12-31",
                        },
                    },
                })
            return ("MEMORY CONTEXT: approved record "
                    f"({PRIOR_FILE}) — Approved valid until: 2026-12-31")

        async def _plan_ce(*a, **k):
            class _P:
                wants_edit = False
            return _P()

        async def _structured(llm_service, *, prompt, response_model,
                              system_instruction, **_kw):
            from core.chat_tool_planner import ToolPlan

            return ToolPlan(use_tool=False, service=None, intent="search",
                            query="", reason="conversation turn")

        with ExitStack() as st:
            for cm in [
                patch.object(orch, "_get_or_create_session",
                             return_value=session),
                patch.object(orch, "_resolve_canvas_ctx",
                             new=AsyncMock(return_value=CANVAS)),
                patch.object(orch, "_record_chat_step", new=AsyncMock()),
                patch.object(orch, "_emit_agent_status", new=AsyncMock()),
                patch.object(orch, "_update_session", new=MagicMock()),
                patch.object(orch, "_load_conversation_mail_handles",
                             return_value=([], [])),
                patch.object(orch, "_route_to_features",
                             new=AsyncMock(return_value={})),
                patch("core.memory_context_assembler.assembly_enabled",
                      return_value=True),
                patch("core.memory_context_assembler."
                      "assemble_memory_context", new=_fake_assemble),
                patch("core.turn_decision.interpret_turn_request",
                      new=_fake_interpret),
                patch("core.chat_mini_app_authoring.try_handle",
                      new=AsyncMock(return_value=None)),
                patch("core.chat_tool_planner._provenance_menu",
                      new=AsyncMock(return_value="")),
                patch("integrations.chat_orchestrator."
                      "_verbatim_mail_evidence",
                      new=AsyncMock(return_value=[])),
                patch("integrations.chat_orchestrator._begin_task_edit",
                      return_value={"status": "legacy"}),
                patch("core.chat_canvas_editor.plan_canvas_edit",
                      new=AsyncMock(side_effect=_plan_ce)),
                patch("core.student_learning_service.get_agent_lessons",
                      return_value=[]),
                patch("core.chat_tool_planner._structured_with_fallback",
                      new=AsyncMock(side_effect=_structured)),
            ]:
                st.enter_context(cm)
            out = await orch.process_chat_message(
                ws["user_id"], S3_ASK, "sess-guard-order",
                context={"workspace_id": ws["workspace_id"],
                         "canvas_id": CANVAS["canvas_id"]})
    finally:
        endpoint.__exit__()

    assert out is not None
    content = str(out.get("content") or out.get("message") or "")
    assert "Verified comparison" in content, content
    assert "2026-12-31" in content, content
    assert "2023-01-01" not in content, content
    assert "couldn't search" not in content.casefold(), content
    assert out.get("deterministic_delivery") is True, out
    assert not out.get("error_code"), out.get("error_code")
    assert endpoint.hit_count == 1, (
        "the verified comparison must preempt corrective regeneration; "
        f"reply endpoint calls={endpoint.hit_count}")


def test_provider_failure_content_is_recognized_not_answered():
    """The early guard must not turn a provider-failure envelope into a
    successful deterministic answer."""
    from integrations.chat_orchestrator import _is_llm_error_text

    assert _is_llm_error_text(
        "[Error: all providers failed for this request]")
    assert _is_llm_error_text(
        "No LLM provider is configured. Check your API key configuration.")
