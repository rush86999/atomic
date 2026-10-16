# -*- coding: utf-8 -*-
"""R3 — supplying a missing value resumes the recorded edit (owner
milestone 2026-10-16; bounded correction 2026-10-16).

Bounded-correction guarantees pinned here:

  interpretation   "Cancel that" cancels (never an edit attempt);
                   "What did you change?" is a question (normal flow,
                   requirement stays open); "12,500" is ONE value;
                   "Research and Development" is carried VERBATIM — no
                   word removal, no numeric-adjacent splitting.
  explicit binding several OPEN requirements -> ask which one; the
                   answer binds to its question id, artifact and
                   recorded authorization.
  expiry           fresh stamps bind; expired and MALFORMED timestamps
                   never do (an unevaluable check never silently
                   authorizes).
  preservation     a plan that duplicates the value or corrupts an
                   existing line is REFUSED as a whole mutation: the
                   pre-edit version is restored and verified, and the
                   question stays open. The question settles only on
                   verified fulfillment (applied + editor readback +
                   resume postcondition), never on a success flag.

Every run drives the REAL process path with REAL lifecycle runs
(``ATOM_TASK_LIFECYCLE_ENABLED=1``) against the isolated test DB — the
same persistence that survives a restart."""
import asyncio
import contextlib
import json
import os
import sqlite3
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
PRE_AUDIT_ID = "audit-pre-1"


class _CanvasStore:
    """The write/read pair with a counter, mutated content persisted,
    and a version head that TRACKS writes (the restore-race guard
    compares the live head against the refused write's own audit id)."""

    def __init__(self, content, raced_versions=False):
        self.content = content
        self.updates: list = []
        self.restores: list = []
        self.head = PRE_AUDIT_ID
        self.raced_versions = raced_versions

    async def _update(self, user_id, canvas_id, content, *a, **k):
        self.updates.append(content)
        self.content = content
        self.head = f"audit-ours-{len(self.updates)}"
        return {"success": True, "audit_id": self.head}

    async def _read(self, user_id, canvas_id, **k):
        return {"success": True, "canvas_id": canvas_id,
                "canvas_type": "document", "title": "Q",
                "content": self.content}

    async def _versions(self, user_id, canvas_id, **k):
        head = self.head
        if self.raced_versions and self.updates:
            # A concurrent write landed during verification: the head is
            # no longer the refused edit.
            head = "audit-concurrent"
        return {"versions": [{"audit_id": head}]}

    async def _restore(self, user_id, canvas_id, audit_id, *a, **k):
        self.restores.append(audit_id)
        self.content = QUOTE
        self.head = audit_id
        return {"success": True}

    def patches(self):
        return (
            patch("tools.canvas_crud_tool.update_canvas_content",
                  new=AsyncMock(side_effect=self._update)),
            patch("tools.canvas_crud_tool.read_canvas",
                  new=AsyncMock(side_effect=self._read)),
            patch("tools.canvas_crud_tool.list_canvas_versions",
                  new=AsyncMock(side_effect=self._versions)),
            patch("tools.canvas_crud_tool.restore_canvas_version",
                  new=AsyncMock(side_effect=self._restore)),
        )


async def _stalled_fresh(*a, **k):
    await asyncio.sleep(30)
    return cce.FreshDataResult("", True, True)


def _tax_plan(value: str = BARE_VALUE) -> cce.CanvasEditPlan:
    return cce.CanvasEditPlan(
        wants_edit=True,
        edit_mode="patch",
        ops=[cce.CanvasPatchOp(
            find="Terms: Net 30",
            replace=f"Terms: Net 30\nTax registration number: {value}",
            origin="user_supplied")],
    )


def _duplicated_label_plan() -> cce.CanvasEditPlan:
    """The captured failing shape (R3 run 074317): the value lands
    TWICE and an existing line's label is duplicated."""
    return cce.CanvasEditPlan(
        wants_edit=True,
        edit_mode="patch",
        ops=[
            cce.CanvasPatchOp(
                find="Terms: Net 30",
                replace="Terms: Terms: Net 30\nTax registration "
                        "number: 03-4567-8912",
                origin="user_supplied"),
            cce.CanvasPatchOp(
                find="Client: Dunmore Fabrication LLC",
                replace="Client: Dunmore Fabrication LLC\nTax "
                        "registration number: 03-4567-8912",
                origin="user_supplied"),
        ],
    )


#: Per-conversation session dicts, REUSED across _turn calls — the
#: production `_get_or_create_session` returns the PERSISTED session (the
#: same dict evolves across turns and restarts), so the harness must not
#: hand every turn a fresh one (a remembered selection would otherwise
#: vanish between turns).
_SESSIONS: dict = {}


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

    session = _SESSIONS.setdefault(
        session_id, {"id": session_id, "history": []})
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


def _open_questions(session_id):
    from integrations.chat_orchestrator import (
        _open_awaiting_value_requirements,
    )

    return _open_awaiting_value_requirements(
        None, None, session_id, CANVAS_ID)


def _set_opened_at(session_id, opened_at):
    """Rewrite the stamped question's opened_at directly in the test DB
    (expiry/malformed fixtures)."""
    db_path = os.environ.get("DATABASE_URL", "sqlite:///test_integration.db")
    db_path = db_path.replace("sqlite:///", "") or "test_integration.db"
    con = sqlite3.connect(db_path)
    try:
        rows = con.execute(
            "SELECT id, parameters FROM goal_runs ORDER BY created_at"
        ).fetchall()
        for rid, params in rows:
            doc = json.loads(params or "{}")
            tl = doc.get("task_lifecycle") or {}
            rev = tl.get("task_revision") or {}
            changed = False
            for q in rev.get("unresolved") or []:
                if q.get("next_action") == "resume_edit_on_user_value":
                    q["opened_at"] = opened_at
                    changed = True
            if changed:
                con.execute(
                    "UPDATE goal_runs SET parameters=? WHERE id=?",
                    (json.dumps(doc), rid))
        con.commit()
    finally:
        con.close()


@pytest.mark.asyncio
async def test_bare_value_after_the_decline_applies_the_recorded_edit(
        monkeypatch):
    """Steps 1-6 of the owner's R3 sequence: the request declines with
    the specific ask; the bare value — same conversation, no repeated
    request — resumes the recorded edit: one write, the value lands,
    protected content preserved, the question settles ONLY on verified
    fulfillment."""
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
    pending = _open_questions(session_id)
    assert len(pending) == 1, "the awaiting-value question must persist"
    assert pending[0]["inputs"].get("goal_text", "").startswith(
        "Add the client's tax registration number")
    assert pending[0]["inputs"].get("canvas_id") == CANVAS_ID

    # Steps 3-4: the restart is covered by the R3 driver; THIS suite pins
    # the binding itself — the durable record is all a fresh process has.
    t2 = await _turn(monkeypatch, session_id, BARE_VALUE,
                     fresh=_stalled_fresh, plan=_tax_plan)
    r2 = t2["response"]
    assert t2["reply_calls"] == [], "the lane must own the resumed turn"
    assert t2["fresh_calls"] == 0, (
        "the value is explicitly supplied — no lookup re-opens")
    assert t2["plan_calls"] == 1, "the recorded edit intent resumed"
    content = t2["store"].content
    assert content.count(BARE_VALUE) == 1, (
        "the intended value appears exactly once")
    assert "Tax registration number: 03-4567-8912" in content
    for protected in ("Dunmore Fabrication LLC", "Unit price: $48,000.00",
                      "Subtotal: $48,000.00", "Terms: Net 30",
                      "Valid until: 2026-11-30"):
        assert protected in content, protected
    assert len(t2["store"].updates) == 1, "exactly one write"
    assert r2.get("success") is True, r2
    assert t2["status_events"][-1] == "success"
    assert (t2["execution_row"] or {}).get("status") == "success"
    assert _open_questions(session_id) == [], (
        "the awaiting-value question settles on VERIFIED fulfillment")
    history = t2["session"]["history"]
    assert history and history[-1]["response"]["message"] == r2.get("message")


@pytest.mark.asyncio
async def test_ambiguous_value_asks_one_clarification_and_writes_nothing(
        monkeypatch):
    """Step 7: two candidate values cannot bind — exactly one
    clarification (candidates named VERBATIM), zero writes, the question
    stays open."""
    session_id = f"sess-r3-amb-{uuid.uuid4().hex[:8]}"
    t1 = await _turn(monkeypatch, session_id, REQUEST_MSG,
                     fresh=_stalled_fresh, plan=None)
    assert t1["response"].get("outcome") == "partial"
    assert len(_open_questions(session_id)) == 1

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
    assert len(_open_questions(session_id)) == 1, (
        "the question stays open until ONE value is chosen")


@pytest.mark.asyncio
async def test_owner_message_table(monkeypatch):
    """The owner's reproduced table plus the round-4 counterexamples, end
    to end on the SAVED ARTIFACT: 'Cancel that' cancels; 'What did you
    change?' is a question; '12,500' binds as one value; unanchored
    free text ('Research and Development', 'Love is Blind', 'Actually
    Studios', cancellation paraphrases) is UNRESOLVED — normal flow,
    zero writes, requirement open."""
    # Cancel that.
    sid = f"sess-r3-c-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, "Cancel that",
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "cancellation must never plan an edit"
    assert t["store"].updates == [], "cancellation writes nothing"
    said = t["response"].get("message") or ""
    assert "Cancelled" in said and "nothing was" in said.lower(), said
    assert t["response"].get("success") is True
    assert t["status_events"][-1] == "success"
    assert _open_questions(sid) == [], "the question closes on cancellation"

    # What did you change?
    sid = f"sess-r3-q-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, "What did you change?",
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "a question is not an answer"
    assert t["reply_calls"], "the normal flow owns the question"
    assert t["store"].updates == []
    assert len(_open_questions(sid)) == 1, "the question stays open"

    # 12,500 — one value, not two; the value lands exactly once.
    sid = f"sess-r3-n-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, "12,500",
                    fresh=_stalled_fresh,
                    plan=lambda *a, **k: _tax_plan("12,500"))
    assert t["plan_calls"] == 1, "12,500 is ONE value and binds"
    assert t["store"].content.count("12,500") == 1

    # 'Research and Development' — UNRECOGNIZED under the narrow supply
    # syntax: no requirement anchor, no digit value, and QUOTING a
    # mention does not make it a supply (owner instruction: distinguish
    # supplying a value from mentioning quoted text). Both forms ask,
    # nothing writes, the requirement stays open.
    sid = f"sess-r3-r-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, "Research and Development",
                    fresh=_stalled_fresh,
                    plan=lambda *a, **k: _tax_plan("Research and Development"))
    assert t["plan_calls"] == 0, (
        "an unanchored free-text reply is not an answer")
    assert t["store"].updates == [], "nothing is written from a guess"
    assert t["reply_calls"], "the normal flow owns the turn"
    assert len(_open_questions(sid)) == 1, "the requirement stays open"
    sid = f"sess-r3-rq-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, '"Research and Development"',
                    fresh=_stalled_fresh,
                    plan=lambda *a, **k: _tax_plan("Research and Development"))
    assert t["plan_calls"] == 0, (
        "quoting a mention does not make it a supply")
    assert t["store"].updates == []
    assert t["reply_calls"], "the normal flow owns the turn"
    assert len(_open_questions(sid)) == 1

    # The owner's counterexamples (round-4): the answer frame and the
    # lead-in stripper must not invent values.
    sid = f"sess-r3-lib-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, "Love is Blind",
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "'Love is Blind' is not a value"
    assert t["store"].content == QUOTE, "the saved artifact is unchanged"
    assert t["store"].updates == []
    assert len(_open_questions(sid)) == 1

    sid = f"sess-r3-as-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, "Actually Studios",
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "'Actually Studios' must not strip to a value"
    assert t["store"].content == QUOTE, "the saved artifact is unchanged"
    assert len(_open_questions(sid)) == 1

    # ITEM-ANCHORED NON-ANSWERS (review round 6, structurally closed):
    # an anchored frame binds ONLY a digit-bearing or QUOTED tail — an
    # unquoted non-digit tail is an open class of non-answers ('is not
    # known yet', 'is pending', 'is unknown at this time', 'is in
    # Germany', 'is confidential') and resolves to unresolved: normal
    # flow, zero writes, the requirement stays open.
    for nonvalue in ("The tax registration number is not known yet",
                     "The tax registration number is pending",
                     "The tax registration number is TBD",
                     "The tax registration number is unknown at this "
                     "time",
                     "The tax registration number is in Germany",
                     "The tax registration number is confidential"):
        sid = f"sess-r3-nv-{uuid.uuid4().hex[:8]}"
        await _turn(monkeypatch, sid, REQUEST_MSG,
                    fresh=_stalled_fresh, plan=None)
        t = await _turn(monkeypatch, sid, nonvalue,
                        fresh=_stalled_fresh, plan=_tax_plan)
        assert t["plan_calls"] == 0, f"{nonvalue!r} is not a value"
        assert t["store"].content == QUOTE, (
            "the saved artifact is unchanged")
        assert len(_open_questions(sid)) == 1

    # The anchored frame still binds REAL values when they are carried
    # explicitly: a digit tail or a QUOTED value (the reviewer's
    # positive pin, re-recorded for the closed contract).
    sid = f"sess-r3-acmecl-{uuid.uuid4().hex[:8]}"
    client_req = ("Add the client to this quotation. "
                  "Use the exact name from our records.")

    def _client_plan(*a, **k):
        return cce.CanvasEditPlan(
            wants_edit=True, edit_mode="patch",
            ops=[cce.CanvasPatchOp(
                find="Client: Dunmore Fabrication LLC",
                replace="Client: Dunmore Fabrication LLC\n"
                        "Client: Acme, Inc",
                origin="user_supplied")],
        )

    await _turn(monkeypatch, sid, client_req,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, 'The client is "Acme, Inc"',
                    fresh=_stalled_fresh, plan=_client_plan)
    assert t["plan_calls"] == 1, "a quoted anchored value binds"
    assert t["store"].content.count("Acme, Inc") == 1

    # A cancellation PARAPHRASE outside the closed class: unresolved —
    # the normal flow owns it, nothing writes, the requirement stays
    # open (the conversational layer can then confirm the intent).
    sid = f"sess-r3-par-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, "let's drop that idea",
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "a paraphrase must not bind or edit"
    assert t["store"].content == QUOTE, "the saved artifact is unchanged"
    assert len(_open_questions(sid)) == 1

    # Compound cancel: the FIRST segment cancels — the value after it
    # has no open requirement to bind to (review round 2, finding 4).
    sid = f"sess-r3-cc-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid,
                    "Cancel that. Actually use 03-4567-8912",
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "a leading cancellation owns the reply"
    assert t["store"].updates == []
    assert _open_questions(sid) == [], "the requirement closes"

    # Politeness-only and meta-only replies never bind (finding 5).
    # 'cancel it please' IS a cancellation: the requirement closes.
    for meta, closes in (("please", False), ("cancel it please", True),
                         ("3 things to know?", False), ("8912?", False)):
        sid = f"sess-r3-meta-{uuid.uuid4().hex[:8]}"
        await _turn(monkeypatch, sid, REQUEST_MSG,
                    fresh=_stalled_fresh, plan=None)
        t = await _turn(monkeypatch, sid, meta,
                        fresh=_stalled_fresh, plan=_tax_plan)
        assert t["plan_calls"] == 0, f"{meta!r} must not bind"
        assert t["store"].updates == [], f"{meta!r} must not write"
        if closes:
            assert _open_questions(sid) == [], (
                f"{meta!r} is a cancellation: the requirement closes")
        else:
            assert len(_open_questions(sid)) == 1, (
                f"{meta!r} leaves the requirement open")

    # "Acme, Inc" — UNRECOGNIZED under the narrow supply syntax (no
    # requirement anchor, no digits): the reply asks, nothing writes.
    # QUOTING does not change that — mentioning quoted text is not
    # supplying it; the ANCHORED quoted form binds (client pin above).
    sid = f"sess-r3-acme-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, "Acme, Inc",
                    fresh=_stalled_fresh,
                    plan=lambda *a, **k: _tax_plan("Acme, Inc"))
    assert t["plan_calls"] == 0, "unanchored text is not an answer"
    assert t["store"].updates == []
    assert len(_open_questions(sid)) == 1
    sid = f"sess-r3-acmeq-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    t = await _turn(monkeypatch, sid, '"Acme, Inc"',
                    fresh=_stalled_fresh,
                    plan=lambda *a, **k: _tax_plan("Acme, Inc"))
    assert t["plan_calls"] == 0, (
        "an unanchored quoted mention is not a supply")
    assert t["store"].updates == []
    assert t["reply_calls"], "the normal flow owns the turn"
    assert len(_open_questions(sid)) == 1


@pytest.mark.asyncio
async def test_several_open_requirements_are_asked_apart(monkeypatch):
    """Two open questions in one conversation: a bare value selects
    NOTHING; a SELECTION-ONLY reply ('1', 'The VAT number') never writes
    — it asks for the selected requirement's value and the selection is
    remembered so the follow-up value binds deterministically (review
    round 3, blocker)."""
    sid = f"sess-r3-multi-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    from integrations.chat_orchestrator import (
        _stamp_awaiting_value_requirement,
    )

    qid2 = _stamp_awaiting_value_requirement(
        None, None, (_open_questions(sid)[0]["run_id"]),
        canvas_id=CANVAS_ID, goal_text="Add the client's VAT number to "
        "this quotation.", references=["from the ledger"],
        operation_id="op-2")
    assert qid2, "the second question stamps"
    assert len(_open_questions(sid)) == 2

    # A bare value with no selection: the numbered ask, zero writes.
    t = await _turn(monkeypatch, sid, BARE_VALUE,
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "never select a requirement silently"
    assert t["store"].updates == []
    assert "more than one open question" in (
        t["response"].get("message") or "")
    assert len(_open_questions(sid)) == 2, "both stay open"

    # SELECTION-ONLY ('1'): the editor is NEVER called, the reply asks
    # for the selected requirement's value, and the question stays open.
    t1 = await _turn(monkeypatch, sid, "1",
                     fresh=_stalled_fresh, plan=_tax_plan)
    assert t1["plan_calls"] == 0, (
        "a selection token is not a value — the editor must not run")
    assert t1["store"].updates == [], "a selection-only reply writes nothing"
    said1 = t1["response"].get("message") or ""
    assert "got it" in said1.lower() and "what value" in said1.lower(), said1
    assert t1["response"].get("success") is True
    assert len(_open_questions(sid)) == 2, "both stay open"

    # The FOLLOW-UP value binds to the remembered selection (the tax
    # question — option 1), settles it, and clears the memory.
    t2 = await _turn(monkeypatch, sid, BARE_VALUE,
                     fresh=_stalled_fresh, plan=_tax_plan)
    assert t2["plan_calls"] == 1, "the follow-up value binds the selection"
    assert t2["store"].content.count(BARE_VALUE) == 1
    assert t2["response"].get("success") is True
    remaining = _open_questions(sid)
    assert len(remaining) == 1 and remaining[0]["question_id"] == qid2, (
        "the SELECTED question settled; the other stays open")
    assert not t2["session"].get("resume_selected_question"), (
        "the selection memory is consumed")

    # A bare item name is also selection-only.
    sid2 = f"sess-r3-selname-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid2, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    _stamp_awaiting_value_requirement(
        None, None, (_open_questions(sid2)[0]["run_id"]),
        canvas_id=CANVAS_ID, goal_text="Add the client's VAT number to "
        "this quotation.", references=["from the ledger"],
        operation_id="op-3")
    t3 = await _turn(monkeypatch, sid2, "The VAT number",
                     fresh=_stalled_fresh, plan=_tax_plan)
    assert t3["plan_calls"] == 0, "'The VAT number' names, no value"
    assert t3["store"].updates == []
    said3 = t3["response"].get("message") or ""
    assert "got it" in said3.lower(), said3
    assert len(_open_questions(sid2)) == 2

    # Selection + value in ONE reply binds directly.
    t4 = await _turn(monkeypatch, sid2, "The VAT number is 47-11",
                     fresh=_stalled_fresh,
                     plan=lambda *a, **k: _tax_plan("47-11"))
    assert t4["plan_calls"] == 1
    assert t4["store"].content.count("47-11") == 1
    remaining2 = _open_questions(sid2)
    assert len(remaining2) == 1, "the VAT question settled"


@pytest.mark.asyncio
async def test_stamp_dedup_one_decline_one_question(monkeypatch):
    """Re-declining the SAME requirement must not accumulate duplicate
    awaiting-value questions (review round 2, finding 2)."""
    sid = f"sess-r3-dedup-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    assert len(_open_questions(sid)) == 1
    t2 = await _turn(monkeypatch, sid, REQUEST_MSG,
                     fresh=_stalled_fresh, plan=None)
    assert t2["response"].get("outcome") == "partial"
    assert len(_open_questions(sid)) == 1, (
        "the same canvas+item stamps exactly one open question")


@pytest.mark.asyncio
async def test_a_fresh_edit_directive_is_never_hijacked(monkeypatch):
    """Review round 2, finding 1 (BLOCKER): while a requirement is
    open, a message that is ITSELF an authorized edit instruction is
    NEW WORK — the normal flow owns it exactly as given, the pending
    value never binds, and the requirement stays open."""
    sid = f"sess-r3-fresh-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    assert len(_open_questions(sid)) == 1

    fresh_msg = ("Set the Valid Until date on this quotation to "
                 "2026-12-31.")
    seen_messages = []

    def _date_plan(*a, **k):
        seen_messages.append("planned")
        return cce.CanvasEditPlan(
            wants_edit=True,
            edit_mode="patch",
            ops=[cce.CanvasPatchOp(
                find="Valid until: 2026-11-30",
                replace="Valid until: 2026-12-31",
                origin="user_supplied")],
        )

    t2 = await _turn(monkeypatch, sid, fresh_msg,
                     fresh=_stalled_fresh, plan=_date_plan)
    assert t2["plan_calls"] == 1, "the fresh directive runs the lane"
    assert "2026-12-31" in t2["store"].content, (
        "the user's actual instruction applies as given")
    assert t2["store"].content.count(BARE_VALUE) == 0, (
        "the pending requirement never injected its synthesized value")
    # The requirement stays open (the fresh directive did not settle it).
    assert len(_open_questions(sid)) == 1


@pytest.mark.asyncio
async def test_post_write_divergence_restores_with_race_guard(monkeypatch):
    """EXCEPTIONAL RECOVERY (owner caveat): the editor's PRE-write check
    sees the proposed artifact, not the durable store. When a write
    LANDS but the durable content diverges (simulated here: the read
    path returns duplicated content after the update), the resume
    preservation layer catches it, restores the pre-edit version under
    the revision guard, and names what happened. With a RACED version
    head the restore is refused — a concurrent edit must not be eaten."""
    sid = f"sess-r3-div-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    assert len(_open_questions(sid)) == 1

    # Clean plan; the store's READ path diverges after the write (store
    # normalization or a concurrent write the editor could not see).
    diverging = {"flag": False}

    class _DivergentStore(_CanvasStore):
        async def _update(self, user_id, canvas_id, content, *a, **k):
            out = await super()._update(user_id, canvas_id, content,
                                        *a, **k)
            if self.updates:
                # The durable content diverged from what was written
                # (store normalization or a concurrent write).
                diverging["flag"] = True
            return out

        async def _restore(self, user_id, canvas_id, audit_id, *a, **k):
            # The restore itself resolves the divergence: reads go back
            # to true content afterwards.
            diverging["flag"] = False
            return await super()._restore(user_id, canvas_id, audit_id,
                                          *a, **k)

        async def _read(self, user_id, canvas_id, **k):
            content = self.content
            if diverging["flag"] and self.updates:
                # The durable content diverged from what was written.
                content = self.content + (
                    "Tax registration number: 03-4567-8912\n")
            return {"success": True, "canvas_id": canvas_id,
                    "canvas_type": "document", "title": "Q",
                    "content": content}

    store = _DivergentStore(QUOTE)

    async def _status(sid_, aid, eid, status):
        return None

    session = _SESSIONS.setdefault(
        sid, {"id": sid, "history": []})

    async def _reply(*a, **k):
        return {"content": "the reply leg must not own this turn",
                "success": True}

    orchestrator = chat.ChatOrchestrator()
    canvas = {"canvas_id": CANVAS_ID, "canvas_type": "document",
              "title": "Quotation Q-2026-114", "content": QUOTE}
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
            patch.object(cce, "fetch_fresh_data_section", _stalled_fresh),
            patch.object(cce, "plan_canvas_edit",
                         new=AsyncMock(side_effect=(
                             lambda *a, **k: _tax_plan()))),
            patch.object(chat,
                         "_REFERENCE_REQUIREMENT_PLAN_WAIT_SECONDS", 0.3),
        ):
            _stack.enter_context(_cm)
        for _cm in (
            patch("tools.canvas_crud_tool.update_canvas_content",
                  new=AsyncMock(side_effect=store._update)),
            patch("tools.canvas_crud_tool.read_canvas",
                  new=AsyncMock(side_effect=store._read)),
            patch("tools.canvas_crud_tool.list_canvas_versions",
                  new=AsyncMock(side_effect=store._versions)),
            patch("tools.canvas_crud_tool.restore_canvas_version",
                  new=AsyncMock(side_effect=store._restore)),
        ):
            _stack.enter_context(_cm)
        r = await orchestrator.process_chat_message(
            "user-r3", BARE_VALUE, sid, context={"canvas_id": CANVAS_ID})

    said = r.get("message") or ""
    # The write landed, the divergence was caught, and the restore ran
    # (the head was ours — no race in this variant).
    assert store.restores == [PRE_AUDIT_ID], (
        "the revision-guarded restore ran for the diverged write")
    assert store.content == QUOTE, "the draft is restored"
    assert "restored" in said.lower() or "refused" in said.lower(), said
    assert len(_open_questions(sid)) == 1, (
        "the requirement is unfulfilled — the question stays open")
@pytest.mark.asyncio
async def test_expiry_fresh_binds_expired_and_malformed_never(monkeypatch):
    """The TTL check: a fresh stamp binds; an over-TTL stamp and a
    MALFORMED timestamp never do — an unevaluable check must not
    silently authorize resumption."""
    sid = f"sess-r3-ttl-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    assert len(_open_questions(sid)) == 1

    # Fresh: binds.
    t = await _turn(monkeypatch, sid, BARE_VALUE,
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 1
    assert _open_questions(sid) == []

    # Expired: the stamp is 8 days old — beyond the 7-day TTL.
    sid = f"sess-r3-ttl-old-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    _set_opened_at(sid, "2026-10-08T00:00:00+00:00")
    assert _open_questions(sid) == [], "an expired question never binds"
    t = await _turn(monkeypatch, sid, BARE_VALUE,
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "expired: no resume"
    assert t["reply_calls"], "the normal flow owns the turn"

    # Malformed: the stamp is not a timestamp at all.
    sid = f"sess-r3-ttl-bad-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    _set_opened_at(sid, "not-a-timestamp")
    assert _open_questions(sid) == [], (
        "a malformed timestamp never binds")
    t = await _turn(monkeypatch, sid, BARE_VALUE,
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "malformed: no resume"


@pytest.mark.asyncio
async def test_duplicated_label_plan_is_refused_before_persistence(
        monkeypatch):
    """The captured failing shape (R3 run 074317): a plan that lands the
    value twice and duplicates an existing line's label. PRESERVATION IS
    PRE-PERSISTENCE now (owner caveat): the editor verifies the PROPOSED
    artifact before the store write, so the violation never reaches the
    canvas at all — zero updates, no restore needed, no intermediate
    revision. The refusal is delivered honestly and the question stays
    open; revision-guarded restoration remains only for exceptional
    recovery."""
    sid = f"sess-r3-dup-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    assert len(_open_questions(sid)) == 1

    t = await _turn(monkeypatch, sid, BARE_VALUE,
                    fresh=_stalled_fresh, plan=_duplicated_label_plan)
    r = t["response"]
    assert t["plan_calls"] == 1
    assert t["store"].updates == [], (
        "the violation refuses BEFORE the store write")
    assert t["store"].restores == [], (
        "prevention means no restoration is needed")
    assert t["store"].content == QUOTE, (
        "the saved artifact is untouched")
    assert r.get("success") is True, "the refusal is a delivered turn"
    said = r.get("message") or ""
    assert (
        "would have altered" in said
        or "did not preserve" in said
        or "refused" in said.lower()
    ), "the refusal names the preservation violation"
    assert (t["execution_row"] or {}).get("status") == "success"
    assert len(_open_questions(sid)) == 1, (
        "the requirement is unfulfilled — the question stays open")


@pytest.mark.asyncio
async def test_settled_lookup_decline_also_asks_and_stamps(monkeypatch):
    """R3 live finding (run 091140): the named-source lookup has TWO
    unhappy endings — timeout AND settle-with-nothing. The settle path
    historically shipped the generic block decline (no specific ask, no
    stamp, an unconfirmed/failed envelope). Both are the SAME unresolved
    requirement: the specific ask ships, the requirement stamps, the
    bare value resumes."""
    sid = f"sess-r3-settle-{uuid.uuid4().hex[:8]}"

    async def _settled_fresh(*a, **k):
        # The lookup RAN and settled — with nothing that grounds the
        # named reference.
        return cce.FreshDataResult(
            "Searched the mailbox and the shared drive; nothing about "
            "tax registrations found.", True, True)

    def _declining_plan(*a, **k):
        return cce.CanvasEditPlan(wants_edit=False, edit_mode="patch",
                                  ops=[])

    t1 = await _turn(monkeypatch, sid, REQUEST_MSG,
                     fresh=_settled_fresh, plan=_declining_plan)
    r1 = t1["response"]
    assert r1.get("success") is True, r1
    assert r1.get("outcome") == "partial", r1
    said = r1.get("message") or ""
    assert "from our records" in said and "nothing was changed" in said, said
    assert t1["store"].updates == [], "zero writes on the decline"
    pending = _open_questions(sid)
    assert len(pending) == 1, "the settled lookup still stamps the ask"

    t2 = await _turn(monkeypatch, sid, BARE_VALUE,
                     fresh=_settled_fresh, plan=_tax_plan)
    assert t2["fresh_calls"] == 0, "the resume never re-opens the lookup"
    assert t2["plan_calls"] == 1
    assert t2["store"].content.count(BARE_VALUE) == 1
    assert t2["response"].get("success") is True
    assert _open_questions(sid) == [], "settles on verified fulfillment"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "reply", ('I found the note "pending" in our records',
              "I will check our records in 2026"))
async def test_the_rejected_controls_never_plan_write_or_settle(
        monkeypatch, reply):
    """THE OWNER'S REJECTED CONTROLS (2026-10-16, permanent): mentioning
    quoted text or a number inside prose is NOT supplying a value. The
    reply must never reach edit planning, never write, and never settle
    the requirement — the saved artifact stays byte-identical and the
    question stays open for the conversational layer to answer."""
    sid = f"sess-r3-ctl-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG,
                fresh=_stalled_fresh, plan=None)
    assert len(_open_questions(sid)) == 1

    def _forbidden_plan(*a, **k):
        raise AssertionError(
            f"edit planning ran for the non-answer {reply!r}")

    t = await _turn(monkeypatch, sid, reply,
                    fresh=_stalled_fresh, plan=_forbidden_plan)
    assert t["plan_calls"] == 0, (
        f"{reply!r} must not reach edit planning")
    assert t["store"].updates == [], (
        f"{reply!r} must not write")
    assert t["store"].content == QUOTE, (
        "the saved artifact is byte-identical")
    assert len(_open_questions(sid)) == 1, (
        "the requirement stays open — nothing settled a non-answer")


@pytest.mark.asyncio
async def test_a_requirement_for_another_canvas_is_never_hijacked(
        monkeypatch):
    """The question binds to ITS recorded canvas only: the same
    conversation pointing at a different canvas is NOT hijacked — the
    normal flow owns the turn."""
    session_id = f"sess-r3-x-{uuid.uuid4().hex[:8]}"
    t1 = await _turn(monkeypatch, session_id, REQUEST_MSG,
                     fresh=_stalled_fresh, plan=None)
    assert len(_open_questions(session_id)) == 1
    t2 = await _turn(monkeypatch, session_id, BARE_VALUE,
                     fresh=_stalled_fresh, plan=_tax_plan,
                     context_canvas_id="cv-other")
    assert t2["plan_calls"] == 0, (
        "a requirement must never bind a turn about another canvas")
    assert t2["reply_calls"], "the normal flow (reply leg) owns the turn"
    assert t2["store"].updates == []
    assert len(_open_questions(session_id)) == 1


@pytest.mark.asyncio
async def test_no_pending_requirement_means_no_hijack(monkeypatch):
    """A bare value with NO recorded requirement follows the normal flow:
    no plan runs, the reply leg owns the turn."""
    session_id = f"sess-r3-none-{uuid.uuid4().hex[:8]}"
    assert _open_questions(session_id) == []
    t = await _turn(monkeypatch, session_id, BARE_VALUE,
                    fresh=_stalled_fresh, plan=_tax_plan)
    assert t["plan_calls"] == 0, "no recorded requirement, no resume"
    assert t["reply_calls"], "the turn falls through to the reply leg"
    assert t["store"].updates == []
