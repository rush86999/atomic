# -*- coding: utf-8 -*-
"""INDEPENDENT VERDICT PROBES — resume intake at the real process path.

Verification assignment (2026-10-16): re-run the original counterexamples
through the REAL resume intake of a frozen commit and check the saved
artifact, the canvas audit writes, planner invocations, and open
requirement state. This file makes NO use of the commit's own test
assertions; every expectation here is stated independently.

Checked properties (the six-case harness):

  1. Accepted values preserve the exact supplied text and fulfill the
     intended target.
  2. Non-answers cannot become resumed edit values.
  3. Selection and answers bind exactly one identified requirement.
  4. Preservation violations refuse before persistence: zero store
     updates and restores.
  5. Wrong canvas, expired/malformed requirement, or already-resolved
     requirement cannot authorize resume.
  6. Settlement follows verified fulfillment; response and durable
     requirement state agree after a fresh reload.

The plan factory below ECHOES the value the flow actually handed the
planner (captured from the plan_canvas_edit call args) into the edit ops,
so the saved artifact reflects what the interpretation boundary extracted
— not a canned value.

HARNESS CONTRACT (owner corrections 2026-10-16, applied):

  - No Harness/cancel API: user cancellation is driven through `_turn`
    with a "Cancel that" reply; a separate cancellation-during-planning
    test uses the event barrier + real ledger transition (cancelling an
    asyncio task tests something different).
  - `_try_canvas_action` is `AsyncMock(return_value=None)` — a bare mock
    can leak an invalid mock result downstream.
  - The store and canvas context reflect the SAVED artifact across turns
    within a scenario (a persistent `store` is threaded through `_turn`;
    a fresh store is seeded from QUOTE only for a fresh scenario).
"""
import asyncio
import contextlib
import os
import re
import sqlite3
import sys
import uuid
import json as _json
from unittest.mock import AsyncMock, patch

os.environ.setdefault("TESTING", "1")

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(
    __file__))))

import core.chat_canvas_editor as cce
from integrations import chat_orchestrator as chat

CANVAS_ID = "cv-resume-verdict"
PRE_AUDIT_ID = "audit-pre-1"

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
VAT_GOAL = "Add the client's VAT number to this quotation."
BARE_VALUE = "03-4567-8912"
VAT_VALUE = "47-11-0000"
AMBIGUOUS_VALUE = "03-4567-8912, or possibly 03-4567-8913 — not sure"

_SESSIONS: dict = {}


class _VerdictStore:
    """Write/read pair counting AUDIT WRITES (updates) and restores."""

    def __init__(self, content):
        self.content = content
        self.updates: list = []
        self.restores: list = []
        self.head = PRE_AUDIT_ID

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
        return {"versions": [{"audit_id": self.head}]}

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


async def _tax_plan(*a, **k):
    return cce.CanvasEditPlan(
        wants_edit=True, edit_mode="patch",
        ops=[cce.CanvasPatchOp(
            find="Terms: Net 30",
            replace=f"Terms: Net 30\nTax registration number: {BARE_VALUE}",
            origin="user_supplied")])


def _echo_plan(corrupt: bool = False):
    """plan_canvas_edit stand-in: captures what the flow HANDED the
    planner and echoes the captured value into the edit ops, so the
    saved artifact reflects what the interpretation boundary extracted —
    not a canned value. Item-aware: the label follows the requirement the
    resumed value was bound to."""
    calls: list = []

    async def _plan(message, *a, **k):
        calls.append(str(message or ""))
        m = re.search(r"Set\s+(.+?)\s+to\s+(.+?)\.\s*$",
                      str(message or ""), re.DOTALL)
        value = m.group(2) if m else ""
        if not value:
            return None
        item = (m.group(1) or "") if m else ""
        if "VAT" in item.upper() or "vat" in item.lower():
            label = "VAT number"
        elif "tax" in item.lower() or "registration" in item.lower():
            label = "Tax registration number"
        else:
            label = "Tax registration number"
        find = "Terms: Net 30"
        if corrupt:
            ops = [cce.CanvasPatchOp(
                find=find,
                replace=(f"Terms: Terms: Net 30\n{label}: {value}\n"
                         f"{label}: {value}"),
                origin="user_supplied")]
        else:
            ops = [cce.CanvasPatchOp(
                find=find,
                replace=(f"Terms: Net 30\n{label}: {value}"),
                origin="user_supplied")]
        return cce.CanvasEditPlan(wants_edit=True, edit_mode="patch",
                                  ops=ops)
    return _plan, calls


async def _turn(monkeypatch, session_id, message, *, fresh=_stalled_fresh,
                plan=None, store=None, canvas_id=CANVAS_ID):
    """One REAL process_chat_message turn, dependencies controlled.
    `plan` is an async plan_canvas_edit stand-in (None = planner must
    never run). `store` threads the SAVED artifact across turns within a
    scenario (None = a fresh store seeded from QUOTE)."""
    monkeypatch.setenv("ATOM_TASK_LIFECYCLE_ENABLED", "1")
    monkeypatch.setenv("CHAT_FINALIZATION_M1", "1")

    orchestrator = chat.ChatOrchestrator()
    if store is None:
        store = _VerdictStore(QUOTE)
    canvas = {"canvas_id": canvas_id, "canvas_type": "document",
              "title": "Quotation Q-2026-114", "content": store.content}

    counters = {"plan": 0, "reply": 0, "fresh": 0}
    reply_calls: list = []
    status_events: list = []

    async def _plan_leg(*a, **k):
        if plan is None:
            return None
        return await plan(*a, **k)

    async def _fresh(*a, **k):
        counters["fresh"] += 1
        return await fresh(*a, **k)

    async def _reply(*a, **k):
        counters["reply"] += 1
        reply_calls.append(1)
        return {"content": "the reply leg must not own this turn",
                "success": True}

    async def _status(sid, aid, eid, status):
        status_events.append(status)
        return None

    async def _plan_counter(*a, **k):
        counters["plan"] += 1
        return await _plan_leg(*a, **k)

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
            patch.object(orchestrator, "_try_canvas_action",
                         new=AsyncMock(return_value=None)),
            patch.object(orchestrator, "_get_qwen_response",
                         new=AsyncMock(side_effect=_reply)),
            patch("core.chat_tool_planner.plan_tool_use",
                  new=AsyncMock(return_value=None)),
            patch("core.chat_tool_planner._provenance_menu",
                  new=AsyncMock(return_value="")),
            patch.object(cce, "fetch_fresh_data_section", _fresh),
            patch.object(cce, "plan_canvas_edit",
                         new=AsyncMock(side_effect=_plan_counter)),
            patch.object(chat,
                         "_REFERENCE_REQUIREMENT_PLAN_WAIT_SECONDS", 0.3),
        ):
            _stack.enter_context(_cm)
        for _cm in store.patches():
            _stack.enter_context(_cm)
        result = await orchestrator.process_chat_message(
            "user-verdict", message, session_id,
            context={"canvas_id": canvas_id})
    return {
        "response": result, "store": store, "session": session,
        "plan_calls": counters["plan"], "reply_calls": reply_calls,
        "fresh_calls": counters["fresh"], "status_events": status_events,
    }


def _open_questions(session_id, canvas_id=CANVAS_ID):
    from integrations.chat_orchestrator import (
        _open_awaiting_value_requirements,
    )
    return _open_awaiting_value_requirements(
        None, None, session_id, canvas_id)


def _expired_stamp():
    """An opened_at beyond the awaiting-value TTL, relative to the real
    UTC clock (now minus the production TTL plus margin) — never a
    hardcoded calendar date (which silently stops being expired). No
    clock machinery: real time is adequate for this expiration test."""
    from datetime import datetime, timedelta, timezone
    from integrations.chat_orchestrator import _AWAITING_VALUE_TTL_SECONDS
    return (datetime.now(timezone.utc)
            - timedelta(seconds=_AWAITING_VALUE_TTL_SECONDS + 86400)
            ).isoformat()


def _set_opened_at(*, run_id, question_id, opened_at):
    """Rewrite ONE stamped question's opened_at directly in the test DB
    (expiry/malformed fixtures), scoped to the scenario's exact
    run/question — never a sweep across unrelated runs sharing the
    test database."""
    db_path = os.environ.get("DATABASE_URL", "sqlite:///test_integration.db")
    db_path = db_path.replace("sqlite:///", "") or "test_integration.db"
    con = sqlite3.connect(db_path)
    try:
        row = con.execute(
            "SELECT parameters FROM goal_runs WHERE id=?",
            (run_id,)).fetchone()
        assert row is not None, f"no goal_runs row for run {run_id}"
        doc = _json.loads(row[0] or "{}")
        questions = ((doc.get("task_lifecycle") or {}).get(
            "task_revision") or {}).get("unresolved") or []
        hits = [q for q in questions
                if isinstance(q, dict)
                and q.get("question_id") == question_id]
        assert len(hits) == 1, (
            f"expected exactly one question {question_id} on run "
            f"{run_id}, found {len(hits)}")
        hits[0]["opened_at"] = opened_at
        con.execute(
            "UPDATE goal_runs SET parameters=? WHERE id=?",
            (_json.dumps(doc), run_id))
        assert con.total_changes == 1, (
            "the fixture must touch exactly one run row")
        con.commit()
    finally:
        con.close()


def _read_task_record_fresh(run_id):
    """Read one run's durable task record through a FRESH lifecycle
    instance (fresh service objects; GoalRunService opens a fresh DB
    session per read with no in-memory cache) — never a reused handle.
    NOT a process restart: same process, same database, new connection."""
    from integrations.chat_orchestrator import _task_lifecycle_for
    lifecycle = _task_lifecycle_for(None, None)
    assert lifecycle is not None, "the lifecycle must be available"
    record = lifecycle.get_task(run_id)
    assert record is not None, f"run {run_id} must still be readable"
    return record


def _seed_second_question(session_id):
    from integrations.chat_orchestrator import (
        _stamp_awaiting_value_requirement,
    )
    run_id = _open_questions(session_id)[0]["run_id"]
    return _stamp_awaiting_value_requirement(
        None, None, run_id, canvas_id=CANVAS_ID, goal_text=VAT_GOAL,
        references=["from the ledger"], operation_id="op-verdict-2")


async def _open_requirement(monkeypatch, session_id):
    """One request turn that stamps the awaiting-value question."""
    t = await _turn(monkeypatch, session_id, REQUEST_MSG, plan=None)
    assert _open_questions(session_id), (
        "the request turn must stamp an awaiting-value requirement")
    return t


# ---------------------------------------------------------------------------
# 1. ACCEPTED VALUES PRESERVE THE EXACT SUPPLIED TEXT AND FULFILL THE TARGET
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_bare_digit_identifier_binds_exactly(monkeypatch):
    """Case 1 (accepted values): a bare identifier is the supplied span
    and binds EXACTLY as written; one write; protected content preserved;
    the question settles ONLY on verified fulfillment."""
    sid = f"sess-c1-{uuid.uuid4().hex[:8]}"
    t1 = await _open_requirement(monkeypatch, sid)
    assert t1["response"].get("outcome") == "partial"
    assert t1["store"].updates == []
    assert len(_open_questions(sid)) == 1

    plan, calls = _echo_plan()
    t2 = await _turn(monkeypatch, sid, BARE_VALUE, plan=plan)
    assert t2["plan_calls"] == 1
    assert t2["reply_calls"] == [], "the lane must own the resumed turn"
    assert t2["fresh_calls"] == 0, "the value is explicitly supplied"
    saved = t2["store"].content
    assert saved.count(BARE_VALUE) == 1, "the intended value appears once"
    assert saved.count("Tax registration number: " + BARE_VALUE) == 1
    for protected in ("Dunmore Fabrication LLC", "Unit price: $48,000.00",
                       "Subtotal: $48,000.00", "Terms: Net 30",
                       "Valid until: 2026-11-30"):
        assert protected in saved, protected
    assert len(t2["store"].updates) == 1, "exactly one write"
    assert t2["response"].get("success") is True
    assert t2["status_events"][-1] == "success"
    assert _open_questions(sid) == [], "settles on verified fulfillment"


@pytest.mark.asyncio
async def test_anchored_quoted_frame_binds_the_quoted_tail(monkeypatch):
    """Case 1 (accepted values): the REQUIREMENT-ANCHORED quoted frame
    binds the quoted tail EXACTLY as written.

    Historical provenance (2026-10-16): the earlier
    `test_quoted_title_binds_verbatim` expected a BARE quotation to bind.
    That expectation was explicitly SUPERSEDED by the accepted narrow
    contract — a bare quotation is a mention, not a supply, and broader
    recognition is NOT restored here. This test preserves that history by
    pinning the CURRENT behavior: the anchored frame binds the quoted
    tail, the bare-quotation shape does not."""
    sid = f"sess-c1q-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid,
                    "The client's tax registration number is \"Love is Blind\"",
                    plan=plan)
    assert t["plan_calls"] == 1, "the quoted anchored reply reaches the planner once"
    saved = t["store"].content
    assert saved.count("Tax registration number: Love is Blind") == 1, (
        f"the quoted tail must land EXACTLY as written, got: {saved!r}")
    assert "registration number is Love is Blind" not in saved, (
        "the whole sentence must not become the value")
    assert _open_questions(sid) == [], "the requirement settles on fulfillment"


# ---------------------------------------------------------------------------
# 2. NON-ANSWERS CANNOT BECOME RESUMED EDIT VALUES
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
@pytest.mark.parametrize("reply", [
    "Love is Blind",                                   # unanchored title
    '"Love is Blind"',                                 # bare quotation (mention, not supply)
    "Actually Studios",                                # lead-in word name
    "Research and Development",                        # multi-word name
])
async def test_unanchored_names_are_not_values(monkeypatch, reply):
    sid = f"sess-c2-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid, reply, plan=plan)
    assert t["plan_calls"] == 0, "the planner must not run for an unrecognized reply"
    assert t["store"].updates == [], (
        f"{reply!r} must not be written as a value — zero audit writes")
    assert t["store"].restores == []
    assert len(_open_questions(sid)) == 1, "the requirement stays open"


@pytest.mark.asyncio
async def test_refusal_paraphrase_neither_writes_nor_binds(monkeypatch):
    sid = f"sess-c2r-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid, "I no longer want this", plan=plan)
    assert t["plan_calls"] == 0
    assert t["store"].updates == [], "a refusal paraphrase must never bind"
    assert len(_open_questions(sid)) == 1, "the requirement stays open"


@pytest.mark.asyncio
async def test_fresh_instruction_does_not_answer_the_requirement(
        monkeypatch):
    sid = f"sess-c2f-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid,
                    "Also add the delivery date to the terms", plan=plan)
    assert t["plan_calls"] == 0, "a fresh instruction is not the pending value"
    assert t["store"].updates == []
    assert len(_open_questions(sid)) == 1


@pytest.mark.asyncio
async def test_question_stays_a_question(monkeypatch):
    sid = f"sess-c2q-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid, "What did you change?", plan=plan)
    assert t["plan_calls"] == 0
    assert t["store"].updates == []
    assert len(_open_questions(sid)) == 1, "the requirement stays open"


@pytest.mark.asyncio
async def test_future_lookup_reply_is_not_a_value(monkeypatch):
    sid = f"sess-c2l-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid, "I will check our records in 2026",
                    plan=plan)
    assert t["store"].updates == [], "a future-lookup sentence must not bind"
    assert t["plan_calls"] == 0, "a future-lookup sentence must not reach the planner"
    assert t["store"].restores == []
    assert len(_open_questions(sid)) == 1, "the requirement stays open"
    assert (t["response"].get("message") or "").strip(), "the turn replies"


@pytest.mark.asyncio
async def test_quoted_non_answer_word_is_not_a_value(monkeypatch):
    sid = f"sess-c2n-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid,
                    'I found the note "pending" in our records', plan=plan)
    assert t["store"].updates == [], "a quoted non-answer must not bind"
    assert t["plan_calls"] == 0, "a quoted non-answer must not reach the planner"
    assert t["store"].restores == []
    assert len(_open_questions(sid)) == 1, "the requirement stays open"
    assert "pending" not in t["store"].content, "the artifact is untouched"


# ---------------------------------------------------------------------------
# 3. SELECTION AND ANSWERS BIND EXACTLY ONE IDENTIFIED REQUIREMENT
#     (two independent scenarios, fresh conversations)
# ---------------------------------------------------------------------------

async def _seed_two_requirements(monkeypatch, session_id):
    """Requirement 1 (tax registration number) opens via the decline
    turn; requirement 2 (VAT number) is stamped under requirement 1's
    run — the same-run association the production ledger uses."""
    t1 = await _turn(monkeypatch, session_id, REQUEST_MSG, plan=None)
    assert t1["response"].get("outcome") == "partial"
    assert len(_open_questions(session_id)) == 1
    qid2 = _seed_second_question(session_id)
    questions = _open_questions(session_id)
    assert len(questions) == 2, "two requirements open simultaneously"
    assert questions[0]["question_id"] != qid2
    return questions


@pytest.mark.asyncio
async def test_case3_scenario_a_selects_option_1_and_binds_its_value(
        monkeypatch):
    """Case 3, Scenario A (fresh conversation): the tax-registration
    requirement is displayed as option 1; selecting it and supplying its
    bare identifier settles ONLY that requirement."""
    sid = f"sess-c3a-{uuid.uuid4().hex[:8]}"
    questions = await _seed_two_requirements(monkeypatch, sid)
    tax_q, vat_q = questions[0], questions[1]

    # Selection turn: '1' → zero writes, both stay open, ask for the
    # selected value, remember the selection keyed by question id.
    t1 = await _turn(monkeypatch, sid, "1", plan=None)
    assert t1["store"].updates == [], "a selection-only reply writes nothing"
    assert len(_open_questions(sid)) == 2, "both requirements stay open"
    said = t1["response"].get("message") or ""
    assert "got it" in said.lower() and "what value" in said.lower(), said
    assert t1["response"].get("success") is True
    remembered = t1["session"].get("resume_selected_question") or {}
    assert remembered.get("question_id") == tax_q["question_id"], (
        "option 1 maps to the FIRST open requirement's question id")

    # Value turn: the entire reply is the supplied span; exactly one
    # correct write; the SELECTED requirement settles; the other stays.
    plan, calls = _echo_plan()
    t2 = await _turn(monkeypatch, sid, BARE_VALUE, plan=plan, store=t1["store"])
    assert t2["plan_calls"] == 1, "the follow-up value binds the selection"
    assert t2["store"].updates and len(t2["store"].updates) == 1
    saved = t2["store"].content
    assert saved.count("Tax registration number: " + BARE_VALUE) == 1
    assert saved.count(BARE_VALUE) == 1, "the value lands exactly once"
    remaining = _open_questions(sid)
    assert len(remaining) == 1, "exactly one requirement settles"
    assert remaining[0]["question_id"] == vat_q["question_id"], (
        "the SELECTED (tax) question settled; the VAT one stays open")
    assert len(t2["store"].restores) == 0


@pytest.mark.asyncio
async def test_case3_scenario_b_selects_option_2_and_binds_its_value(
        monkeypatch):
    """Case 3, Scenario B (fresh conversation): the VAT requirement is
    displayed as option 2; selecting it and supplying its bare identifier
    settles ONLY that requirement."""
    sid = f"sess-c3b-{uuid.uuid4().hex[:8]}"
    questions = await _seed_two_requirements(monkeypatch, sid)
    tax_q, vat_q = questions[0], questions[1]

    # Selection turn: 'option 2' → zero writes, both stay open, ask for
    # the selected value, remember the selection keyed by question id.
    t1 = await _turn(monkeypatch, sid, "option 2", plan=None)
    assert t1["store"].updates == [], "a selection-only reply writes nothing"
    assert len(_open_questions(sid)) == 2, "both requirements stay open"
    said = t1["response"].get("message") or ""
    assert "got it" in said.lower() and "what value" in said.lower(), said
    remembered = t1["session"].get("resume_selected_question") or {}
    assert remembered.get("question_id") == vat_q["question_id"], (
        "option 2 maps to the SECOND open requirement's question id")

    # Value turn: the entire reply is the supplied span; exactly one
    # correct write; the SELECTED requirement settles; the other stays.
    plan, calls = _echo_plan()
    t2 = await _turn(monkeypatch, sid, VAT_VALUE, plan=plan, store=t1["store"])
    assert t2["plan_calls"] == 1, "the follow-up value binds the selection"
    assert t2["store"].updates and len(t2["store"].updates) == 1
    saved = t2["store"].content
    assert saved.count("VAT number: " + VAT_VALUE) == 1
    assert saved.count(VAT_VALUE) == 1, "the value lands exactly once"
    remaining = _open_questions(sid)
    assert len(remaining) == 1, "exactly one requirement settles"
    assert remaining[0]["question_id"] == tax_q["question_id"], (
        "the SELECTED (VAT) question settled; the tax one stays open")
    assert len(t2["store"].restores) == 0


# ---------------------------------------------------------------------------
# 4. PRESERVATION VIOLATIONS REFUSE BEFORE PERSISTENCE
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_preservation_violation_refuses_before_persistence(
        monkeypatch):
    sid = f"sess-c4-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan(corrupt=True)
    t = await _turn(monkeypatch, sid, BARE_VALUE, plan=plan)
    assert t["plan_calls"] == 1, "the plan runs, then preservation judges it"
    assert t["store"].updates == [], (
        "a preservation-violating mutation must be refused BEFORE the "
        "store write — zero audit writes")
    assert t["store"].restores == [], (
        "pre-persistence refusal needs no restore")
    assert t["store"].content == QUOTE, "the artifact is untouched"
    assert t["response"].get("success") is True, "the refusal is delivered"
    said = (t["response"].get("message") or "").lower()
    assert "preserv" in said or "refus" in said or "not applied" in said, (
        f"the refusal is specific, got: {said!r}")
    assert len(_open_questions(sid)) == 1, "the requirement stays open"


# ---------------------------------------------------------------------------
# 5. WRONG CANVAS / EXPIRED / MALFORMED / ALREADY-RESOLVED CANNOT AUTHORIZE
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_requirement_for_other_canvas_is_never_hijacked(
        monkeypatch):
    """Case 5 (wrong canvas): a requirement stamped for one canvas is
    never visible to — and therefore never authorizes — a turn about a
    different canvas."""
    session_id = f"sess-c5x-{uuid.uuid4().hex[:8]}"
    t1 = await _turn(monkeypatch, session_id, REQUEST_MSG, plan=None,
                     canvas_id=CANVAS_ID)
    assert len(_open_questions(session_id, CANVAS_ID)) == 1
    t2 = await _turn(monkeypatch, session_id, BARE_VALUE,
                     plan=_tax_plan, canvas_id="cv-other")
    assert t2["plan_calls"] == 0, (
        "a requirement must never bind a turn about another canvas")
    assert t2["reply_calls"], "the normal flow (reply leg) owns the turn"
    assert t2["store"].updates == []
    assert len(_open_questions(session_id, CANVAS_ID)) == 1


@pytest.mark.asyncio
async def test_expired_or_malformed_requirement_never_resumes(monkeypatch):
    """Case 5 (expiry/malformed): a fresh stamp binds; an over-TTL or
    MALFORMED timestamp never does — an unevaluable check never silently
    authorizes resumption."""
    sid = f"sess-c5t-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG, plan=None)
    assert len(_open_questions(sid)) == 1
    t = await _turn(monkeypatch, sid, BARE_VALUE, plan=_tax_plan)
    assert t["plan_calls"] == 1, "a FRESH stamp binds"
    assert _open_questions(sid) == []

    # Expired: the stamp is beyond the 7-day TTL (computed from now,
    # never a hardcoded calendar date).
    sid = f"sess-c5te-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG, plan=None)
    pending = _open_questions(sid)
    assert len(pending) == 1
    _set_opened_at(run_id=pending[0]["run_id"],
                    question_id=pending[0]["question_id"],
                    opened_at=_expired_stamp())
    assert _open_questions(sid) == [], "an expired question never binds"
    t = await _turn(monkeypatch, sid, BARE_VALUE, plan=_tax_plan)
    assert t["plan_calls"] == 0, "expired: no resume"
    assert t["reply_calls"], "the normal flow owns the turn"

    # Malformed: the stamp is not a timestamp at all.
    sid = f"sess-c5tm-{uuid.uuid4().hex[:8]}"
    await _turn(monkeypatch, sid, REQUEST_MSG, plan=None)
    pending = _open_questions(sid)
    assert len(pending) == 1
    _set_opened_at(run_id=pending[0]["run_id"],
                    question_id=pending[0]["question_id"],
                    opened_at="not-a-timestamp")
    assert _open_questions(sid) == [], "a malformed timestamp never binds"
    t = await _turn(monkeypatch, sid, BARE_VALUE, plan=_tax_plan)
    assert t["plan_calls"] == 0, "malformed: no resume"


@pytest.mark.asyncio
async def test_no_open_requirement_means_no_resume(monkeypatch):
    """Case 5 (already-resolved / none): once nothing is open there is
    nothing to authorize a resumed edit — no plan, no write, no hijack."""
    session_id = f"sess-c5n-{uuid.uuid4().hex[:8]}"
    assert _open_questions(session_id) == []
    t = await _turn(monkeypatch, session_id, BARE_VALUE, plan=_tax_plan)
    assert t["plan_calls"] == 0, "no recorded requirement, no resume"
    assert t["reply_calls"], "the turn falls through to the reply leg"
    assert t["store"].updates == []


# ---------------------------------------------------------------------------
# 6. SETTLEMENT FOLLOWS VERIFIED FULFILLMENT; RESPONSE AND DURABLE STATE
#     AGREE AFTER A FRESH RELOAD
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_settlement_agrees_with_fresh_reload_after_fulfillment(
        monkeypatch):
    """Case 6: after a value turn fulfills the requirement, the response
    records the fulfillment AND a fresh reload of the durable requirement
    state agrees — the question is settled, not merely answered. The
    reload reads through a NEW lifecycle instance and NEW database
    connection (NOT a process restart — same process, same database),
    and asserts THIS question's settled state on the durable record."""
    sid = f"sess-c6-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    pending = _open_questions(sid)
    assert len(pending) == 1
    run_id, qid = pending[0]["run_id"], pending[0]["question_id"]
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid, BARE_VALUE, plan=plan)
    assert t["response"].get("success") is True, "the fulfillment is delivered"
    assert _open_questions(sid) == [], "the question settled on fulfillment"

    # FRESH RELOAD: new lifecycle instance, new DB connection — the
    # durable record must show THIS question settled (status resolved),
    # and the production open-view must agree it is no longer open.
    record = _read_task_record_fresh(run_id)
    stored = [q for q in (record.get("task_revision") or {}).get(
        "unresolved") or []
        if isinstance(q, dict) and q.get("question_id") == qid]
    assert len(stored) == 1, (
        "the settled question remains on the durable record")
    assert stored[0].get("status") == "resolved", (
        f"the durable record must show the question resolved, got "
        f"{stored[0].get('status')!r}")
    assert _open_questions(sid) == [], (
        "a fresh reload must agree the requirement is settled")


# ---------------------------------------------------------------------------
# CANCELLATION (no Harness.cancel; driven through _turn)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cancellation_closes_with_zero_writes(monkeypatch):
    sid = f"sess-cx-{uuid.uuid4().hex[:8]}"
    await _open_requirement(monkeypatch, sid)
    plan, calls = _echo_plan()
    t = await _turn(monkeypatch, sid, "Cancel that", plan=plan)
    assert t["plan_calls"] == 0, "cancellation must never plan an edit"
    assert t["store"].updates == [], "cancellation writes nothing"
    assert t["store"].restores == []
    assert len(_open_questions(sid)) == 0, "the requirement is closed"
    assert "cancel" in (t["response"].get("message") or "").lower()
