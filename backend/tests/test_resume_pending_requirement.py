# -*- coding: utf-8 -*-
"""R3 — supplying a missing value resumes the recorded edit (owner
milestone 2026-10-16).

The delivered clarification leaves a STRUCTURED awaiting-value question
on the task lifecycle's own unresolved ledger (kind missing_evidence,
next_action resume_edit_on_user_value, structured inputs). The next
message in the SAME conversation binds to it:

  one value        -> the recorded edit intent resumes (the lane plans
                      the ORIGINAL request plus the explicit assignment),
                      one write, the question settles;
  several values   -> exactly one clarification, zero writes, the
                      question stays open;
  other canvas     -> no hijack — a requirement for one artifact never
                      binds a turn about another;
  no record        -> normal flow, unchanged.

Every run below drives the REAL process path with REAL lifecycle runs
(``ATOM_TASK_LIFECYCLE_ENABLED=1``) against the isolated test DB — the
same persistence that survives a restart."""
import asyncio
import os
import uuid

os.environ.setdefault("TESTING", "1")

import pytest
from unittest.mock import AsyncMock, patch

import core.chat_canvas_editor as cce
from integrations import chat_orchestrator as chat

QUOTE = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")
REQUEST_MSG = (
    "Add the client's tax registration number to this quotation. "
    "Use the exact number from our records.")
BARE_VALUE = "03-4567-8912"
AMBIGUOUS_VALUE = "03-4567-8912, or possibly 03-4567-8913 — not sure"
CANVAS_ID = "cv-resume"


class _CanvasStore:
    """The write/read pair with a counter, mutated content persisted."""

    def __init__(self, content):
        self.content = content
        self.updates: list = []

    async def _update(self, user_id, canvas_id, content, *a, **k):
        self.updates.append(content)
        self.content = content
        return {"success": True, "audit_id": "a1"}

    async def _read(self, user_id, canvas_id, **k):
        return {"success": True, "canvas_id": canvas_id,
                "canvas_type": "document", "title": "Q",
                "content": self.content}

    def patches(self):
        return (
            patch("tools.canvas_crud_tool.update_canvas_content",
                  new=AsyncMock(side_effect=self._update)),
            patch("tools.canvas_crud_tool.read_canvas",
                  new=AsyncMock(side_effect=self._read)),
        )


async def _stalled_fresh(*a, **k):
    await asyncio.sleep(30)
    return cce.FreshDataResult("", True, True)


def _tax_plan() -> cce.CanvasEditPlan:
    return cce.CanvasEditPlan(
        wants_edit=True,
        edit_mode="patch",
        ops=[cce.CanvasPatchOp(
            find="Terms: Net 30",
            replace="Terms: Net 30\nTax registration number: "
                    "03-4567-8912",
            origin="user_supplied")],
    )


async def _turn(monkeypatch, session_id, message, *, fresh, plan,
                context_canvas_id=None):
    """One REAL process_chat_message turn with the dependencies
    controlled. The lifecycle is REAL (flag on) — reservations, the
    awaiting-value stamp, and settlements all hit the isolated DB."""
    monkeypatch.setenv("ATOM_TASK_LIFECYCLE_ENABLED", "1")
    monkeypatch.setenv("CHAT_FINALIZATION_M1", "1")
    from core.database import get_db_session

    orchestrator = chat.ChatOrchestrator()
    ctx_canvas = context_canvas_id or CANVAS_ID
    canvas = {"canvas_id": ctx_canvas, "canvas_type": "document",
              "title": "Quotation Q-2026-114", "content": QUOTE}
    store = _CanvasStore(canvas["content"])
    reply_calls = []
    status_events = []
    plan_calls = {"n": 0}
    fresh_calls = {"n": 0}

    async def _reply(*a, **k):
        reply_calls.append(1)
        return {"content": "the reply leg must not own this turn",
                "success": True}

    async def _plan(*a, **k):
        plan_calls["n"] += 1
        return plan() if plan is not None else None

    async def _fresh(*a, **k):
        fresh_calls["n"] += 1
        return await fresh(*a, **k)

    async def _status(sid, aid, eid, status):
        status_events.append(status)
        return None

    session = {"id": session_id, "history": []}
    import contextlib

    with contextlib.ExitStack() as _stack:
        for _cm in (
            patch.object(orchestrator, "_get_or_create_session",
                         return_value=session),
            patch.object(orchestrator, "_resolve_canvas_ctx",
                         new=AsyncMock(return_value=dict(canvas))),
            patch.object(orchestrator, "_record_chat_step", new=AsyncMock()),
            patch.object(orchestrator, "_emit_agent_status",
                         new=AsyncMock(side_effect=_status)),
            patch.object(orchestrator, "_try_canvas_action", new=AsyncMock()),
            patch.object(orchestrator, "_get_qwen_response",
                         new=AsyncMock(side_effect=_reply)),
            patch("core.chat_tool_planner.plan_tool_use",
                  new=AsyncMock(return_value=None)),
            patch("core.chat_tool_planner._provenance_menu",
                  new=AsyncMock(return_value="")),
            patch.object(cce, "fetch_fresh_data_section", _fresh),
            patch.object(cce, "plan_canvas_edit",
                         new=AsyncMock(side_effect=_plan)),
            patch.object(chat,
                         "_REFERENCE_REQUIREMENT_PLAN_WAIT_SECONDS", 0.3),
        ):
            _stack.enter_context(_cm)
        for _cm in store.patches():
            _stack.enter_context(_cm)
        result = await orchestrator.process_chat_message(
            "user-r3", message, session_id,
            context={"canvas_id": ctx_canvas})
    execution_id = result.get("execution_id")
    row = None
    if execution_id:
        with get_db_session() as db:
            from core.models import AgentExecution as _AE
            r = db.query(_AE).filter(_AE.id == execution_id).first()
            if r is not None:
                row = {"status": r.status,
                       "summary_head": str(r.result_summary or "")[:120]}
    return {
        "response": result, "store": store, "reply_calls": reply_calls,
        "status_events": status_events, "plan_calls": plan_calls["n"],
        "fresh_calls": fresh_calls["n"], "session": session,
        "execution_row": row,
    }


def _open_question(session_id):
    from integrations.chat_orchestrator import _awaiting_value_requirement

    return _awaiting_value_requirement(None, None, session_id, CANVAS_ID)


@pytest.mark.asyncio
async def test_bare_value_after_the_decline_applies_the_recorded_edit(
        monkeypatch):
    """Steps 1-6 of the owner's R3 sequence: the request declines with
    the specific ask; the bare value — same conversation, no repeated
    request — resumes the recorded edit: one write, the value lands,
    protected content preserved, the question settles."""
    session_id = f"sess-r3-{uuid.uuid4().hex[:8]}"

    # Step 1-2: the missing-information request declines with the ask.
    t1 = await _turn(monkeypatch, session_id, REQUEST_MSG,
                     fresh=_stalled_fresh, plan=None)
    r1 = t1["response"]
    assert r1.get("success") is True, r1
    assert r1.get("outcome") == "partial", r1
    assert "from our records" in (r1.get("message") or "")
    assert t1["store"].updates == [], "zero writes on the decline"
    assert t1["plan_calls"] == 0
    # The STRUCTURED requirement is on the lifecycle ledger.
    pending = _open_question(session_id)
    assert pending is not None, "the awaiting-value question must persist"
    assert pending["inputs"].get("goal_text", "").startswith(
        "Add the client's tax registration number")
    assert pending["inputs"].get("canvas_id") == CANVAS_ID
    first_question_id = pending["question_id"]

    # Steps 3-4: the restart is covered by the R3 driver; THIS suite pins
    # the binding itself — the durable record is all a fresh process has.
    # The bare value, no repeated request.
    t2 = await _turn(monkeypatch, session_id, BARE_VALUE,
                     fresh=_stalled_fresh, plan=_tax_plan)
    r2 = t2["response"]
    assert t2["reply_calls"] == [], "the lane must own the resumed turn"
    assert t2["fresh_calls"] == 0, (
        "the value is explicitly supplied — no lookup re-opens")
    assert t2["plan_calls"] == 1, "the recorded edit intent resumed"
    content = t2["store"].content
    assert BARE_VALUE in content, "the value lands on the canvas"
    assert "Tax registration number: 03-4567-8912" in content
    for protected in ("Dunmore Fabrication LLC", "Unit price: $48,000.00",
                      "Subtotal: $48,000.00", "Terms: Net 30",
                      "Valid until: 2026-11-30"):
        assert protected in content, protected
    assert len(t2["store"].updates) == 1, "exactly one write"
    assert r2.get("success") is True, r2
    assert t2["status_events"][-1] == "success"
    assert (t2["execution_row"] or {}).get("status") == "success"
    # Step 5-6: the question settles — it never resurfaces.
    assert _open_question(session_id) is None, (
        "the awaiting-value question must be resolved after the edit")
    history = t2["session"]["history"]
    assert history and history[-1]["response"]["message"] == r2.get("message")


@pytest.mark.asyncio
async def test_ambiguous_value_asks_one_clarification_and_writes_nothing(
        monkeypatch):
    """Step 7: two candidate values cannot bind — exactly one
    clarification, zero writes, the question stays open."""
    session_id = f"sess-r3-amb-{uuid.uuid4().hex[:8]}"
    t1 = await _turn(monkeypatch, session_id, REQUEST_MSG,
                     fresh=_stalled_fresh, plan=None)
    assert t1["response"].get("outcome") == "partial"
    assert _open_question(session_id) is not None

    t2 = await _turn(monkeypatch, session_id, AMBIGUOUS_VALUE,
                     fresh=_stalled_fresh, plan=_tax_plan)
    r2 = t2["response"]
    assert t2["plan_calls"] == 0, "an ambiguous value must not plan"
    assert t2["store"].updates == [], "zero writes"
    said = r2.get("message") or ""
    assert "Which value" in said, said
    assert "03-4567-8912" in said and "03-4567-8913" in said, said
    assert r2.get("success") is True, r2
    assert r2.get("outcome") == "partial", r2
    assert t2["status_events"][-1] == "success"
    assert (t2["execution_row"] or {}).get("status") == "success"
    assert _open_question(session_id) is not None, (
        "the question stays open until ONE value is chosen")


@pytest.mark.asyncio
async def test_a_requirement_for_another_canvas_is_never_hijacked(
        monkeypatch):
    """The question binds to ITS recorded canvas only: the same
    conversation pointing at a different canvas is NOT hijacked — the
    normal flow owns the turn."""
    session_id = f"sess-r3-x-{uuid.uuid4().hex[:8]}"
    t1 = await _turn(monkeypatch, session_id, REQUEST_MSG,
                     fresh=_stalled_fresh, plan=None)
    assert _open_question(session_id) is not None
    t2 = await _turn(monkeypatch, session_id, BARE_VALUE,
                     fresh=_stalled_fresh, plan=_tax_plan,
                     context_canvas_id="cv-other")
    assert t2["plan_calls"] == 0, (
        "a requirement must never bind a turn about another canvas")
    assert t2["reply_calls"], "the normal flow (reply leg) owns the turn"
    assert t2["store"].updates == []
    # The question itself is untouched.
    assert _open_question(session_id) is not None


@pytest.mark.asyncio
async def test_no_pending_requirement_means_no_hijack(monkeypatch):
    """A bare value with NO recorded requirement follows the normal flow:
    no plan runs, the reply leg owns the turn."""
    session_id = f"sess-r3-none-{uuid.uuid4().hex[:8]}"
    assert _open_question(session_id) is None
    t = await _turn(monkeypatch, session_id, BARE_VALUE,
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "no recorded requirement, no resume"
    assert t["reply_calls"], "the turn falls through to the reply leg"
    assert t["store"].updates == []
