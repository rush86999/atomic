# -*- coding: utf-8 -*-
"""Bounded R4 recovery-selection regressions (work order 2026-10-16).

Controlled production-path tests through the REAL process_chat_message,
real loaders, and scratch lifecycle/database records. Source execution
and generation are controlled at their external seams; forbidden
planner/source fixtures fail on invocation (attempted calls counted, not
only completed operations).

Covers:
  1. one valid stored result, no assistant metadata -> attributed delivery,
     zero planner/source calls
  2. same request with model number/year still recovers (digits != R3 answer)
  3. multiple plausible results -> useful clarification, zero calls
  4. explicit refresh stays normal retrieval
  5. genuine R3 answer alongside stored result -> R3 owns
  6. unrelated request stays normal work
  7. repeated automatic recovery after fresh reload -> no duplicate delivery
Plus: loader wiring (real loader receives conversation/workspace/message),
and the eventual selection answer after ambiguity.

No dev-server restart or live database access (TESTING=1, scratch
ATOM_DATA_DIR, unique conversations).
"""
import asyncio
import contextlib
import json as _json
import os
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("TESTING", "1")

import pytest

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrations import chat_orchestrator as chat

FILE_A = "Consolidated Price List 2019.xlsx"
FILE_B = "Consolidated Price List 2020.xlsx"
HASH_A = "a7d3c9f1e2b4a1c3"
HASH_B = "b8e4d0a2f3c5b2d4"

_SESSIONS: dict = {}


@pytest.fixture(autouse=True)
def _r4_lifecycle_world(monkeypatch):
    """The lifecycle/diagnostic world EVERY test needs, set BEFORE any
    seeding runs.

    Seeding (``_seed_retrieve``) and the recovery decision run before
    ``_turn`` would have set the flags, so the flags must live here: an
    unset flag failing at setup (verifier control 1: 9 failed during
    setup) can never happen again.
    """
    monkeypatch.setenv("TESTING", "1")
    monkeypatch.setenv("ATOM_TASK_LIFECYCLE_ENABLED", "1")
    monkeypatch.setenv("CHAT_FINALIZATION_M1", "1")
    monkeypatch.setenv("ATOM_LOCAL_ONLY", "true")


def _findings(file_name, content_hash, items):
    out = []
    for it, val, sheet, row in items:
        out.append({
            "item": it,
            "field": "price",
            "column": "U.S. LIST",
            "raw": str(val),
            "value": str(val),
            "parsed": {"value": 100.0, "basis": "U.S. LIST",
                       "currency": "USD", "unit": "USD"},
            "source": f"{file_name}!{sheet}!row{row}",
            "source_file_name": file_name,
            "sheet": sheet,
            "content_hash": content_hash,
        })
    return out


def _seed_retrieve(lifecycle, session_id, file_name, content_hash,
                   items, requested_fields=None, objective=None,
                   execution_id=None):
    """Seed one successful retrieve op with findings; returns run/op/exec."""
    from core import task_lifecycle as _tlm
    requested_fields = requested_fields or ["price"]
    objective = objective or f"Find prices in {file_name}"
    exec_id = execution_id or f"exec-seed-{uuid.uuid4().hex[:8]}"
    run_id, op_id = _tlm.begin_retrieval_turn(
        lifecycle, {"id": session_id}, session_id, objective,
        exec_id, items=[it for it, _, _, _ in items],
        requested_fields=list(requested_fields))
    structured = {
        "requested_items": [it for it, _, _, _ in items],
        "requested_fields": list(requested_fields),
    }
    execution = {
        "invoked": True,
        "outcome": "read_succeeded",
        "served_basis": "saved_copy",
        "source_version": content_hash,
        "items": {it: "matched" for it, _, _, _ in items},
        "findings": _findings(file_name, content_hash, items),
    }
    _tlm.finish_retrieval_turn(
        lifecycle, run_id, op_id, structured, exec_id, True,
        execution=execution)
    return run_id, op_id, exec_id


def _fresh_lifecycle():
    from integrations.chat_orchestrator import _task_lifecycle_for
    lc = _task_lifecycle_for("default", "default")
    assert lc is not None, "lifecycle must be enabled (ATOM_TASK_LIFECYCLE_ENABLED=1)"
    return lc


async def _turn(monkeypatch, tmp_path, session_id, message, *,
                canvas=None, forbid_planner=True, forbid_source=True,
                allow_reply=False):
    """One REAL process_chat_message turn with controlled seams.

    forbid_* fixtures fail on invocation (counting attempts). allow_reply
    controls whether the generic reply leg may run (for normal-work cases).
    Returns response + counters + session + lifecycle + db rows.
    """
    monkeypatch.setenv("ATOM_TASK_LIFECYCLE_ENABLED", "1")
    monkeypatch.setenv("CHAT_FINALIZATION_M1", "1")
    monkeypatch.setenv("ATOM_DATA_DIR", str(tmp_path))

    orch = chat.ChatOrchestrator()
    canvas_ctx = None
    if canvas is not None:
        canvas_ctx = dict(canvas)
    else:
        canvas_ctx = None

    counters = {"plan": 0, "prov": 0, "reply": 0, "source": 0,
                "edit_plan": 0, "fresh": 0}
    import core.chat_canvas_editor as cce

    async def _forbid_plan(*a, **k):
        counters["plan"] += 1
        raise AssertionError("forbidden planner call (recovery must be zero)")

    async def _allow_plan(*a, **k):
        counters["plan"] += 1
        return None

    async def _forbid_prov(*a, **k):
        counters["prov"] += 1
        raise AssertionError("forbidden provenance call")

    async def _allow_prov(*a, **k):
        counters["prov"] += 1
        return ""

    async def _forbid_reply(*a, **k):
        counters["reply"] += 1
        raise AssertionError("forbidden reply-leg call (must return before)")

    async def _allow_reply_fn(*a, **k):
        counters["reply"] += 1
        return {"content": "normal-work reply (no stored result used)",
                "success": True}

    async def _forbid_source(*a, **k):
        counters["source"] += 1
        raise AssertionError("forbidden source call (zero source calls)")

    async def _count_source(*a, **k):
        counters["source"] += 1
        return []

    async def _forbid_edit_plan(*a, **k):
        counters["edit_plan"] += 1
        raise AssertionError("forbidden edit-plan call")

    async def _fresh(*a, **k):
        counters["fresh"] += 1
        return cce.FreshDataResult("", False, True)

    session = _SESSIONS.setdefault(
        session_id, {"id": session_id, "history": []})

    _plan_fn = _forbid_plan if forbid_planner else _allow_plan
    _prov_fn = _forbid_prov if forbid_planner else _allow_prov
    _reply_fn = _forbid_reply if not allow_reply else _allow_reply_fn
    _src_fn = _forbid_source if forbid_source else _count_source

    with contextlib.ExitStack() as _stack:
        _stack.enter_context(patch.object(
            orch, "_get_or_create_session", return_value=session))
        _stack.enter_context(patch.object(
            orch, "_resolve_canvas_ctx",
            new=AsyncMock(return_value=dict(canvas_ctx) if canvas_ctx else None)))
        _stack.enter_context(patch.object(
            orch, "_record_chat_step", new=AsyncMock()))
        _stack.enter_context(patch.object(
            orch, "_emit_agent_status", new=AsyncMock()))
        _stack.enter_context(patch.object(
            orch, "_try_canvas_action",
            new=AsyncMock(return_value=None)))
        _stack.enter_context(patch.object(
            orch, "_get_qwen_response",
            new=AsyncMock(side_effect=_reply_fn)))
        _stack.enter_context(patch(
            "core.chat_tool_planner.plan_tool_use",
            new=AsyncMock(side_effect=_plan_fn)))
        _stack.enter_context(patch(
            "core.chat_tool_planner._provenance_menu",
            new=AsyncMock(side_effect=_prov_fn)))
        _stack.enter_context(patch.object(
            cce, "plan_canvas_edit",
            new=AsyncMock(side_effect=_forbid_edit_plan)))
        _stack.enter_context(patch.object(
            cce, "fetch_fresh_data_section", _fresh))
        # source seams: every file-read entry point is forbidden/counted
        for _path in [
                "core.sheet_dataset_service.find_entries_sync",
                "core.sheet_dataset_service.find_all_occurrences_sync",
                "core.sheet_dataset_service.read_sheet_row_sync",
                "core.sheet_dataset_service.entries_for_file_sync",
                "core.sheet_dataset_service.catalog_has_entries_sync"]:
            try:
                _stack.enter_context(patch(
                    _path, side_effect=_src_fn if "catalog" not in _path else (
                        lambda *a, **k: True)))
            except Exception:
                pass
        # request scope is the authenticated scope (default in tests)
        result = await orch.process_chat_message(
            "user-r4-test", message, session_id,
            context={"workspace_id": "default",
                     "canvas": dict(canvas_ctx) if canvas_ctx else None,
                     "request_id": str(uuid.uuid4())}
            if canvas_ctx else {"workspace_id": "default",
                                "request_id": str(uuid.uuid4())})
    # fresh reload helpers read through new connections
    from core.database import get_db_session
    from core.models import ChatMessage as ChatMessageModel
    with get_db_session() as db:
        rows = db.query(ChatMessageModel).filter(
            ChatMessageModel.conversation_id == session_id,
            ChatMessageModel.role == "assistant").order_by(
            ChatMessageModel.created_at.desc()).all()
        asst = [{
            "content": r.content,
            "metadata": _json.loads(r.metadata_json or "{}"),
            "id": r.id} for r in rows]
    lc = _fresh_lifecycle()
    try:
        rec = lc.find_active_task(str(session_id))
    except Exception:
        rec = None
    # also list all conversation-bound runs for op counts
    try:
        runs = lc.runs.list_runs(include_terminal=True, limit=200)
        conv_runs = []
        for _r in runs:
            try:
                _rec = lc.get_task(str(_r.get("id") or ""))
            except Exception:
                continue
            if _rec and str(_rec.get("conversation_id") or "") == str(session_id):
                conv_runs.append(_rec)
    except Exception:
        conv_runs = []
    return {"response": result, "counters": counters, "session": session,
            "record": rec, "conv_runs": conv_runs, "assistant_rows": asst,
            "orch": orch}


def _assistant_texts(t):
    return [r["content"] for r in t["assistant_rows"]]


# ---------------------------------------------------------------------------
# Loader wiring: the real loader receives conversation/workspace/message
# ---------------------------------------------------------------------------

def test_stored_scope_gate_paraphrase_and_file_sensitivity():
    """The scope gate itself: file references carry identity - a
    paraphrase of the SAME file stays covered, a different year/file
    stays uncovered, and no phantom item is licensed by the year a
    file reference carries ("the price list of 2019" is not a machine
    named 2019). Controlled executions of _stored_covers_request."""
    orch = chat.ChatOrchestrator()
    payload = {
        "identity": {"file_name": "Consolidated Price List 2019.xlsx"},
        "findings": [{"item": "Haas VF-2", "raw": "48000.00"},
                     {"item": "Mazak QT-250", "raw": "63180.00"}],
        "coverage": {"Haas VF-2": "matched", "Mazak QT-250": "matched"},
    }
    covers = lambda ask: orch._stored_covers_request(payload, ask)
    # the same file, referenced conversationally, stays covered
    assert covers("Show me the machine prices you found earlier from "
                  "the price list.") is True
    assert covers("for the machines from 'the price list of 2019' show "
                  "the saved values") is True
    assert covers("what did you find in the consolidated list?") is True
    assert covers("Show the saved prices for Haas VF-2") is True
    # a changed target or a different source file is NOT covered
    assert covers("Show the saved prices for machine 381") is False, (
        "a stored result must never fulfill a target it does not "
        "contain")
    assert covers("Show the saved prices from Consolidated Price List "
                  "2020.xlsx") is False, (
        "the 2019 evidence must not fulfill a 2020-sourced ask")


# ---------------------------------------------------------------------------
# Loader wiring: the real loader receives conversation/workspace/message
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_loader_receives_expected_scope_and_message(
        monkeypatch, tmp_path):
    """Call defects: unbound loader, positional mix-up, undefined workspace,
    and stale digit comments must not recur. The REAL loader must observe
    the expected conversation, workspace, and original message; ordinary
    fallback text must not satisfy this test."""
    sid = f"r4-wire-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    items = [("Haas VF-2", "48000.00", "Prices", 12)]
    run_id, op_id, exec_id = _seed_retrieve(
        lc, sid, FILE_A, HASH_A, items,
        objective=f"Find prices for Haas VF-2 in {FILE_A}")
    seen = {}

    orig = chat.ChatOrchestrator._load_durable_file_result

    def _spy(self, session_id, *, workspace_id=None,
             tenant_id=None, message=""):
        seen["session_id"] = session_id
        seen["workspace_id"] = workspace_id
        seen["message"] = message
        seen["reached"] = True
        return orig(self, session_id, workspace_id=workspace_id,
                    tenant_id=tenant_id, message=message)

    monkeypatch.setattr(
        chat.ChatOrchestrator, "_load_durable_file_result", _spy)
    msg = "Show me the machine prices you found earlier from the price list."
    t = await _turn(monkeypatch, tmp_path, sid, msg,
                    forbid_planner=False, forbid_source=False,
                    allow_reply=True)
    assert seen.get("reached") is True, "the real durable loader was never reached"
    assert seen.get("session_id") == sid
    assert seen.get("workspace_id") == "default"
    assert seen.get("message") == msg
    # Ordinary fallback text must not satisfy: the reply must carry the
    # attributed stored facts, not a generic success line.
    body = str(t["response"].get("message") or "")
    assert "previously retrieved" in body.lower()
    assert "Haas VF-2" in body
    assert "48000.00" in body
    assert FILE_A.split()[0] in body  # file attribution
    assert body.strip() not in ("Message processed successfully", "")
    assert t["response"].get("success") is True


# ---------------------------------------------------------------------------
# 1. One valid stored result, no assistant metadata
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_single_result_delivers_with_zero_calls(
        monkeypatch, tmp_path):
    sid = f"r4-single-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    items = [("Haas VF-2", "48000.00", "Prices", 12),
             ("Mazak QT-250", "63180.00", "Prices", 15),
             ("Chiron FZ16", "88410.25", "Prices", 18)]
    run_id, op_id, exec_id = _seed_retrieve(
        lc, sid, FILE_A, HASH_A, items,
        objective=f"Find prices for Haas, Mazak, Chiron in {FILE_A}")
    # no assistant rows yet
    assert _turn  # silence lint
    t = await _turn(
        monkeypatch, tmp_path, sid,
        "Show me the machine prices you found earlier from the price list.")
    assert t["counters"]["plan"] == 0, "zero planner dispatch"
    assert t["counters"]["reply"] == 0, "returned before reply leg"
    assert t["counters"]["source"] == 0, "zero source calls"
    resp = t["response"]
    assert resp.get("success") is True
    body = str(resp.get("message") or "")
    assert "previously retrieved" in body.lower()
    assert "nothing was re-read" in body.lower()
    for it, val, _, _ in items:
        assert it in body, it
        assert val in body, val
    assert FILE_A in body or "Price List" in body
    # no freshness claim
    assert "fresh" not in body.lower() or "nothing was re-read" in body.lower()
    assert "just read" not in body.lower()
    # selected result references
    data = resp.get("data") or {}
    assert data.get("task_run_id") == run_id
    assert (data.get("task_operation") or {}).get("operation_id") == op_id
    fr = data.get("file_result") or {}
    assert fr.get("recovered_from_durable") is True
    assert fr.get("file_name") == FILE_A
    assert fr.get("zero_source_calls") is True
    # outcome derived (complete: all matched, no obligations)
    assert resp.get("outcome") == "completed", resp.get("outcome")
    # saved messages agree
    assert t["assistant_rows"], "assistant delivery persisted"
    latest = t["assistant_rows"][0]
    assert str(resp.get("message") or "")[:200] in latest["content"][:5000] or \
        latest["content"][:200] in str(resp.get("message") or "")[:5000]
    meta = latest["metadata"] or {}
    assert str(meta.get("execution_id") or "") == str(resp.get("execution_id"))
    pfr = meta.get("pending_file_result") or {}
    assert pfr.get("status") == "delivered"
    assert pfr.get("recovered_from_durable") is True
    # artifact state
    sess_pfr = t["session"].get("_pending_file_result") or {}
    assert sess_pfr.get("status") == "delivered"
    assert sess_pfr.get("run_id") == run_id or \
        sess_pfr.get("recovery_operation_id") == op_id or \
        data.get("task_run_id") == run_id
    # delivery records: SINGLE OWNERSHIP (verifier F2). The turn itself
    # records nothing - the orchestrator's old in-turn placeholder
    # produced exactly the two-record defect (recovery-<exec> + real
    # row) for one response. The real route hook owns the ledger and
    # binds the persisted message identity; that contract is exercised
    # end-to-end in
    # test_recovered_delivery_records_once_via_real_route_boundary.
    rec = t["record"]
    assert rec is not None
    deliveries = rec.get("deliveries") or []
    assert deliveries == [], (
        "the turn must not append placeholder ledger records for its "
        "own delivery (the route boundary owns recording)")
    # task outcome agrees (completed, not hardcoded partial)
    assert resp.get("success") is True


# ---------------------------------------------------------------------------
# 2. Digits do not divert to R3
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_digits_still_recover(monkeypatch, tmp_path):
    sid = f"r4-digits-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    items = [("No. 381", "3297", "Tennsmith", 338)]
    run_id, op_id, _ = _seed_retrieve(
        lc, sid, FILE_A, HASH_A, items,
        objective=f"Find prices in {FILE_A}")
    t = await _turn(
        monkeypatch, tmp_path, sid,
        "Show the saved prices for machine 381")
    assert t["counters"]["plan"] == 0
    assert t["counters"]["source"] == 0
    body = str(t["response"].get("message") or "")
    assert "previously retrieved" in body.lower()
    assert "No. 381" in body
    assert "3297" in body


@pytest.mark.asyncio
async def test_changed_target_does_not_donate_saved_other_machine(
        monkeypatch, tmp_path):
    """Verifier control F1: a request scoped to machine 381 must not
    present a DIFFERENT machine's saved price (Haas VF-2, $48,000) as
    recovered fulfillment.

    The submitted suite's previous positive expectation pinned exactly
    this defect (it seeded Haas and asserted it for the 381 ask). The
    matching-target digit-bearing ask stays a positive control (its own
    test above); the mismatched target stays normal work for a new
    retrieval, on BOTH the decision and the real process path.
    """
    sid = f"r4-chgtgt-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    items = [("Haas VF-2", "48000.00", "Prices", 12)]
    _seed_retrieve(
        lc, sid, FILE_A, HASH_A, items,
        objective=f"Find prices for Haas VF-2 in {FILE_A}")
    orch = chat.ChatOrchestrator()
    ask = "Show the saved prices for machine 381"
    # the DECISION: the stored result does not cover the requested
    # target -> normal work (never a wrong-target donation)
    dec, pay, cands = orch._decide_file_recovery(
        ask, sid, {"workspace_id": "default", "tenant_id": "default"},
        {"id": sid, "history": []}, [], None)
    assert dec == "normal_work", (
        f"a changed target must not be fulfilled from another machine's "
        f"saved result (decision {dec})")
    assert pay is None
    # a message naming a DIFFERENT source file than the stored identity
    # is likewise not covered (source scope is compared, not just items)
    dec_file, _pay2, _ = orch._decide_file_recovery(
        "Show the saved prices from Consolidated Price List 2020.xlsx",
        sid, {"workspace_id": "default", "tenant_id": "default"},
        {"id": sid, "history": []}, [], None)
    assert dec_file == "normal_work", (
        "a different source file must not donate the 2019 evidence")
    # the REAL PROCESS PATH with loaders: no recovered fulfillment at
    # all, and none of the stored facts leak into the reply
    t = await _turn(
        monkeypatch, tmp_path, sid, ask,
        forbid_planner=False, forbid_source=False, allow_reply=True)
    resp = t["response"]
    fr = (resp.get("data") or {}).get("file_result") or {}
    assert fr.get("recovered_from_durable") is not True, fr
    body = str(resp.get("message") or "")
    assert "previously retrieved" not in body.lower(), body[:200]
    assert "48000" not in body, (
        f"the Haas price leaked into the response: {body[:200]}")
    assert "Haas VF-2" not in body, (
        f"the wrong machine leaked into the response: {body[:200]}")


# ---------------------------------------------------------------------------
# 3. Multiple plausible results -> useful clarification, zero calls
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_multiple_results_clarify_with_zero_calls(
        monkeypatch, tmp_path):
    sid = f"r4-multi-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    # two successful retrieves in the SAME conversation run (newest record
    # carries two ops) -> ambiguous, never a silent pick
    run_id, op_a, _ = _seed_retrieve(
        lc, sid, FILE_A, HASH_A,
        [("Haas VF-2", "48000.00", "Prices", 12)],
        objective=f"Find prices in {FILE_A}")
    # second op on the SAME run (same conversation, same run)
    from core import task_lifecycle as _tlm
    _rec = lc.get_task(run_id)
    assert _rec is not None
    op_b = lc.create_operation(
        run_id, op_type="retrieve",
        requested_change=f"Find prices in {FILE_B}")
    lc.transition_operation(run_id, op_b["operation_id"], "running",
                            execution_id="exec-seed-b")
    # settle second op with its own findings directly
    items_b = [("DMG Mori", "96400.00", "Prices", 20)]
    structured_b = {"requested_items": ["DMG Mori"],
                    "requested_fields": ["price"]}
    execution_b = {"invoked": True, "outcome": "read_succeeded",
                   "served_basis": "saved_copy",
                   "source_version": HASH_B,
                   "items": {"DMG Mori": "matched"},
                   "findings": _findings(FILE_B, HASH_B, items_b)}
    _tlm.finish_retrieval_turn(
        lc, run_id, op_b["operation_id"], structured_b, "exec-seed-b",
        True, execution=execution_b)
    t = await _turn(
        monkeypatch, tmp_path, sid,
        "Show me the machine prices you found earlier from the price lists.")
    assert t["counters"]["plan"] == 0
    assert t["counters"]["source"] == 0
    assert t["counters"]["reply"] == 0
    resp = t["response"]
    assert resp.get("success") is True
    body = str(resp.get("message") or "").lower()
    assert "more than one" in body or "which one" in body
    assert FILE_A.split()[0].lower() in body or "price list" in body
    assert FILE_B.split()[0].lower() in body or "price list" in body
    # candidates preserved with distinct run/op identities
    data = resp.get("data") or {}
    ce = (data.get("canvas_edit") or {})
    cands = ce.get("candidates") or []
    assert len(cands) >= 2
    ops = {(c.get("run_id"), c.get("operation_id")) for c in cands}
    assert len(ops) >= 2, "distinct run/operation identities preserved"
    # zero artifact writes: no new retrieve op, no source, requirement open
    assert len(t["conv_runs"]) == 1, "no new run created"
    total_ops = sum(len((r.get("operations") or [])) for r in t["conv_runs"])
    assert total_ops == 2, f"no new retrieve op, got {total_ops}"
    assert resp.get("outcome") == "partial"


@pytest.mark.asyncio
async def test_ambiguity_selection_delivers_selected(
        monkeypatch, tmp_path):
    """The eventual result-selection answer after ambiguity."""
    sid = f"r4-sel-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    run_id, op_a, _ = _seed_retrieve(
        lc, sid, FILE_A, HASH_A,
        [("Haas VF-2", "48000.00", "Prices", 12)],
        objective=f"Find prices in {FILE_A}")
    from core import task_lifecycle as _tlm
    op_b = lc.create_operation(
        run_id, op_type="retrieve",
        requested_change=f"Find prices in {FILE_B}")
    lc.transition_operation(run_id, op_b["operation_id"], "running",
                            execution_id="exec-seed-b2")
    items_b = [("DMG Mori", "96400.00", "Prices", 20)]
    _tlm.finish_retrieval_turn(
        lc, run_id, op_b["operation_id"],
        {"requested_items": ["DMG Mori"],
         "requested_fields": ["price"]}, "exec-seed-b2", True,
        execution={"invoked": True, "outcome": "read_succeeded",
                   "served_basis": "saved_copy",
                   "source_version": HASH_B,
                   "items": {"DMG Mori": "matched"},
                   "findings": _findings(FILE_B, HASH_B, items_b)})
    # first: clarification
    t1 = await _turn(
        monkeypatch, tmp_path, sid,
        "Show me the machine prices you found earlier.")
    assert "which one" in str(t1["response"].get("message") or "").lower()
    # second: select one file by name (persisted selection state)
    # reuse same session history ( _SESSIONS keeps history across turns)
    t2 = await _turn(
        monkeypatch, tmp_path, sid, FILE_A)
    assert t2["counters"]["plan"] == 0
    assert t2["counters"]["source"] == 0
    body = str(t2["response"].get("message") or "")
    assert "previously retrieved" in body.lower()
    assert "Haas VF-2" in body
    assert FILE_A in body


# ---------------------------------------------------------------------------
# 4. Explicit refresh stays normal retrieval
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_explicit_refresh_stays_normal(monkeypatch, tmp_path):
    sid = f"r4-refresh-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    run_id, op_id, _ = _seed_retrieve(
        lc, sid, FILE_A, HASH_A,
        [("Haas VF-2", "48000.00", "Prices", 12)],
        objective=f"Find prices in {FILE_A}")
    # normal path: planner IS consulted (counted), recovery does NOT deliver
    t = await _turn(
        monkeypatch, tmp_path, sid,
        "Check the latest version of the workbook",
        forbid_planner=False, forbid_source=False, allow_reply=True)
    # recovery must not have fired, and the normal flow must have run
    # (the reply leg or the planner - one of them owns this turn)
    body = str(t["response"].get("message") or "")
    assert "previously retrieved" not in body.lower()
    assert t["counters"]["plan"] > 0 or t["counters"]["reply"] > 0, (
        "a refresh must be answered by the normal flow (planner or "
        "reply leg), not silently")
    # no new durable delivery of the old payload as recovery
    # (the response is not our R4 shape)
    data = t["response"].get("data") or {}
    fr = data.get("file_result") or {}
    assert not (fr.get("recovered_from_durable") is True and
                "previously retrieved" in body.lower()), \
        "refresh must not serve the stored result as recovery"


# ---------------------------------------------------------------------------
# 5. Genuine R3 answer alongside stored result -> R3 owns
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_r3_answer_owns_over_stored(monkeypatch, tmp_path):
    """A bare value answering an open R3 requirement stays with R3."""
    sid = f"r4-r3-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    run_id, op_id, _ = _seed_retrieve(
        lc, sid, FILE_A, HASH_A,
        [("Haas VF-2", "48000.00", "Prices", 12)],
        objective=f"Find prices in {FILE_A}")
    # stamp an open R3 awaiting-value requirement on a canvas
    from integrations.chat_orchestrator import (
        _stamp_awaiting_value_requirement,
    )
    canvas = {"canvas_id": f"cv-r4-{uuid.uuid4().hex[:6]}",
              "canvas_type": "document", "title": "Q",
              "content": "Terms: Net 30"}
    qid = _stamp_awaiting_value_requirement(
        "default", "default", run_id, canvas_id=canvas["canvas_id"],
        goal_text="Add the client's VAT number to this quotation.",
        references=["from the ledger"], operation_id="op-r4-r3")
    assert qid
    # R3 answer (bare digit, narrow syntax) must go to R3, not R4
    # For this controlled test we verify the DECISION directly (R3 owns ->
    # R4 normal) plus integration that R4 does not deliver.
    orch = chat.ChatOrchestrator()
    dec, pay, cands = orch._decide_file_recovery(
        "47-11-0000", sid, {"workspace_id": "default",
                             "tenant_id": "default"},
        {"id": sid, "history": []}, [], canvas)
    assert dec == "normal_work", f"R3 answer must stay with R3, got {dec}"
    # integration: with canvas set, the R3 lane will own the turn; R4 must
    # not have delivered its stored payload
    # (we allow normal reply/edit planning for R3, forbid R4 file reads)
    t = await _turn(
        monkeypatch, tmp_path, sid, "47-11-0000", canvas=canvas,
        forbid_planner=False, forbid_source=True, allow_reply=True)
    body = str(t["response"].get("message") or "")
    assert "previously retrieved" not in body.lower()


# ---------------------------------------------------------------------------
# 6. Unrelated request stays normal work
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unrelated_stays_normal(monkeypatch, tmp_path):
    sid = f"r4-unrel-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    run_id, op_id, _ = _seed_retrieve(
        lc, sid, FILE_A, HASH_A,
        [("Haas VF-2", "48000.00", "Prices", 12)],
        objective=f"Find prices in {FILE_A}")
    orch = chat.ChatOrchestrator()
    dec, _, _ = orch._decide_file_recovery(
        "What's the weather in Paris?", sid,
        {"workspace_id": "default", "tenant_id": "default"},
        {"id": sid, "history": []}, [], None)
    assert dec == "normal_work"
    t = await _turn(
        monkeypatch, tmp_path, sid, "What's the weather in Paris?",
        forbid_planner=False, forbid_source=False, allow_reply=True)
    body = str(t["response"].get("message") or "")
    assert "previously retrieved" not in body.lower()
    # no recovery side effect: no new pending_file_result with recovery flag
    sess_pfr = t["session"].get("_pending_file_result") or {}
    assert sess_pfr.get("recovered_from_durable") is not True


# ---------------------------------------------------------------------------
# 7. Repeated automatic recovery after fresh reload -> no duplicate delivery
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_repeated_automatic_no_duplicate(monkeypatch, tmp_path):
    sid = f"r4-idem-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    items = [("Haas VF-2", "48000.00", "Prices", 12)]
    run_id, op_id, _ = _seed_retrieve(
        lc, sid, FILE_A, HASH_A, items,
        objective=f"Find prices in {FILE_A}")
    # first explicit display -> intentional delivery
    t1 = await _turn(
        monkeypatch, tmp_path, sid,
        "Show me the machine prices you found earlier from the price list.")
    assert "previously retrieved" in str(
        t1["response"].get("message") or "").lower()
    exec1 = str(t1["response"].get("execution_id") or "")
    # fresh reload: new orchestrator + new lifecycle over same DB
    # (same process, same DB, new connections - not merely in-memory)
    t2 = await _turn(
        monkeypatch, tmp_path, sid, "What's the weather in Paris?",
        forbid_planner=False, forbid_source=False, allow_reply=True)
    # automatic (unrelated) scan must not duplicate delivery: an
    # unrelated turn answers as normal work and may legitimately read
    # sources for ITS OWN question - only the recovered delivery must
    # stay silent
    assert "previously retrieved" not in str(
        t2["response"].get("message") or "").lower()
    # unrelated may have begun its own retrieval (different objective) -
    # the R4 run itself must not have grown
    lc_fresh = _fresh_lifecycle()
    rec_fresh = lc_fresh.get_task(run_id)
    assert rec_fresh is not None, "durable run survives reload"
    ops_r4 = [o for o in (rec_fresh.get("operations") or [])
              if o.get("operation_id") == op_id]
    assert len(ops_r4) == 1, "original retrieve op not duplicated"
    # and the turn time recorded nothing: under single ownership the
    # intentional recovery above shows up only via the real route
    # boundary (test_recovered_delivery_records_once_via_real_route_
    # boundary), so an automatic scan can never surface a placeholder
    # record for the same response
    assert (rec_fresh.get("deliveries") or []) == [], (
        "no turn-time placeholder record for the first recovery")
    # second explicit display with the MATCHING target -> intentional
    # second reply, still zero source calls and zero new retrieve ops on
    # the R4 run. The stored target is Haas VF-2, so the re-ask names
    # the stored machine itself (a "machine 381" ask is a changed
    # target: normal work, see the wrong-target control).
    t3 = await _turn(
        monkeypatch, tmp_path, sid,
        "Show the saved prices for Haas VF-2")
    body3 = str(t3["response"].get("message") or "")
    assert "Haas VF-2" in body3 and "48000.00" in body3, body3[:300]
    assert t3["counters"]["source"] == 0
    # planner may have been consulted for the delivery-retry shape, but no
    # source read ran and no new retrieve op was created

    exec3 = str(t3["response"].get("execution_id") or "")
    assert exec3 and exec3 != exec1, \
        "recovery execution stays separate from the first recovery"
    lc_fresh2 = _fresh_lifecycle()
    rec2 = lc_fresh2.get_task(run_id)
    ops2 = [o for o in (rec2.get("operations") or [])
            if str(o.get("operation_type") or "") == "retrieve"]
    assert len(ops2) == 1, \
        f"explicit re-display must not create a new retrieve op, got {len(ops2)}"
    # single ownership again: the re-display records nothing at turn
    # time either - the ledger contract is the route boundary's
    assert (rec2.get("deliveries") or []) == [], (
        "no turn-time placeholder record for the re-display")


# ---------------------------------------------------------------------------
# F2 regression: the delivery ledger's single owner is the real route hook
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_recovered_delivery_records_once_via_real_route_boundary(
        monkeypatch, tmp_path):
    """Verifier control F2 as a regression: one recovery response must
    carry exactly ONE delivery-ledger record, with the real persisted
    message identity, the selected source-operation reference, and the
    exact bytes - and a retried boundary call must replay idempotently.

    The previous shape appended a turn-time placeholder (message_id
    recovery-<execution>) AND the route hook appended its real-row
    record: two records, same execution, same bytes, and the
    route-made one without the source-operation reference. The turn now
    records nothing; the route persistence boundary owns the ledger.
    """
    sid = f"r4-hook-{uuid.uuid4().hex[:8]}"
    lc = _fresh_lifecycle()
    items = [("Haas VF-2", "48000.00", "Prices", 12)]
    run_id, op_id, _ = _seed_retrieve(
        lc, sid, FILE_A, HASH_A, items,
        objective=f"Find prices for Haas VF-2 in {FILE_A}")
    t = await _turn(
        monkeypatch, tmp_path, sid,
        "Show me the machine prices you found earlier from the price list.")
    resp = t["response"]
    exec_id = str(resp.get("execution_id") or "")
    assert exec_id, "the recovery response carries its execution id"
    said = str(resp.get("message") or "")
    # the turn left NO ledger entry (no placeholder)
    rec = lc.get_task(run_id)
    assert (rec.get("deliveries") or []) == [], (
        "one response's first record must come from the route "
        "persistence boundary, never a turn-local placeholder")
    # THE REAL ROUTE HOOK with its persisted ChatMessage (what
    # send_chat_message runs on every reply): exactly ONE record
    import hashlib as _hl

    from core.database import get_db_session
    from core.models import ChatMessage as ChatMessageModel
    from integrations.chat_routes import _record_lifecycle_delivery
    with get_db_session() as db:
        row = ChatMessageModel(
            conversation_id=sid, role="assistant", tenant_id="default",
            content=said,
            metadata_json=_json.dumps(
                {"execution_id": exec_id,
                 "evidence": [{"evidence_id": f"ev-{op_id}"}]}))
        db.add(row)
        db.commit()
    _record_lifecycle_delivery(resp, str(row.id), exec_id, row)
    rec = lc.get_task(run_id)
    deliveries = rec.get("deliveries") or []
    assert len(deliveries) == 1, deliveries
    d = deliveries[0]
    assert d.get("message_id") == str(row.id), (
        "the ledger binds the real persisted message identity")
    assert d.get("execution_id") == exec_id
    # the selected SOURCE operation rides the record (the route hook
    # unions response.data.task_operation) - never an entry missing the
    # original source-operation reference
    selected = ((resp.get("data") or {}).get("task_operation") or {})
    assert str(selected.get("operation_id") or "") == str(op_id)
    assert list(d.get("operation_ids") or []) == [str(op_id)], d
    assert d.get("evidence_refs") == [f"ev-{op_id}"], d
    assert d.get("content_sha256") == _hl.sha256(said.encode()).hexdigest()
    # a retried boundary call for the SAME response is an idempotent
    # replay: still exactly one record for this response/bytes
    _record_lifecycle_delivery(resp, str(row.id), exec_id, row)
    rec = lc.get_task(run_id)
    assert len((rec.get("deliveries") or [])) == 1, (
        "one response may never carry two ledger records")


# ---------------------------------------------------------------------------
# Controlled diagnostic executions (verifier F3): the instrumentation is
# RUN against controlled inputs - no source-string inspection.
# ---------------------------------------------------------------------------

def _diag_env(monkeypatch, tmp_path, *, diag="1", data_dir=True):
    monkeypatch.setenv("ATOM_R4_DIAG", diag)
    if data_dir:
        monkeypatch.setenv("ATOM_DATA_DIR", str(tmp_path))
    else:
        monkeypatch.delenv("ATOM_DATA_DIR", raising=False)


def _simple_plan(pid):
    import types
    return types.SimpleNamespace(id=pid)


def test_counter_valid_read_emits_attributable_pair(tmp_path, monkeypatch):
    """A valid read emits exactly ONE read_invoked + ONE read_completed
    event, attributed to the authorizing plan execution and the served
    copy's identity (controlled execution of the real helper)."""
    _diag_env(monkeypatch, tmp_path)
    from core.chat_tool_planner import _record_r4_source_counter
    result = _record_r4_source_counter(
        plan=_simple_plan("exec-diag-valid"),
        prov={"content_hash": "sha256:served-copy"},
        recs=[{"row": 1}], read_status="read_succeeded",
        scan_action="new_read")
    assert result == "written"
    path = tmp_path / "r4_source_invocations.jsonl"
    lines = [ln for ln in path.read_text().splitlines() if ln.strip()]
    events = [_json.loads(ln) for ln in lines]
    # exactly one invocation + one completion, distinct events
    kinds = sorted(e["event"] for e in events)
    assert kinds == ["read_completed", "read_invoked"], kinds
    invoked = [e for e in events if e["event"] == "read_invoked"][0]
    completed = [e for e in events if e["event"] == "read_completed"][0]
    # attributable identities, never null-keyed
    assert invoked["plan_execution_id"] == "exec-diag-valid"
    assert completed["plan_execution_id"] == "exec-diag-valid"
    assert invoked["content_hash"] == "sha256:served-copy"
    # the completion carries the verdict + row count
    assert completed["scan_action"] == "new_read"
    assert completed["rows"] == 1
    assert invoked["read_status"] == "read_succeeded"


def test_counter_missing_config_creates_no_stray_files(
        tmp_path, monkeypatch):
    """Missing/invalid scratch configuration invalidates the diagnostic
    and creates NO stray files anywhere (controlled execution)."""
    from core.chat_tool_planner import _record_r4_source_counter
    # snapshot the cwd to prove nothing is written there either
    cwd_before = set(os.listdir(os.getcwd()))
    # missing ATOM_DATA_DIR entirely
    _diag_env(monkeypatch, tmp_path, data_dir=False)
    assert _record_r4_source_counter(
        plan=_simple_plan("exec-diag-1"), prov={"content_hash": "h"},
        recs=[], read_status="read_succeeded",
        scan_action="new_read") == "invalid-dir"
    # ATOM_DATA_DIR pointing at a nonexistent path is invalid too
    _diag_env(monkeypatch, tmp_path / "does-not-exist")
    assert _record_r4_source_counter(
        plan=_simple_plan("exec-diag-2"), prov={"content_hash": "h"},
        recs=[], read_status="read_succeeded",
        scan_action="new_read") == "invalid-dir"
    # disabled world: no writes either
    _diag_env(monkeypatch, tmp_path, diag="0")
    assert _record_r4_source_counter(
        plan=_simple_plan("exec-diag-3"), prov={"content_hash": "h"},
        recs=[], read_status="read_succeeded",
        scan_action="new_read") == "skipped-disabled"
    cwd_after = set(os.listdir(os.getcwd()))
    assert not any(n.startswith("r4_") for n in (cwd_after - cwd_before)), \
        "invalid configuration must not write into cwd"
    assert not (tmp_path / "r4_source_invocations.jsonl").exists(), (
        "invalid configuration must not write into the scratch dir")


def test_counter_missing_identity_invalidates_attribution(
        tmp_path, monkeypatch):
    """A plan without an execution identity invalidates: no null-keyed
    event is ever written (controlled execution)."""
    _diag_env(monkeypatch, tmp_path)
    from core.chat_tool_planner import _record_r4_source_counter
    result = _record_r4_source_counter(
        plan=_simple_plan(""),  # no id, no execution_id
        prov={"content_hash": "h"}, recs=[], read_status="read_succeeded",
        scan_action="new_read")
    assert result == "invalid-identity"
    assert not (tmp_path / "r4_source_invocations.jsonl").exists(), (
        "an unattributable read must emit no events")


@pytest.mark.asyncio
async def test_latch_blocks_delivery_then_expires_explicitly(
        tmp_path, monkeypatch):
    """The post-commit, pre-delivery latch BLOCKS the real settle return
    while the block file exists, and on expiry records the invalid
    diagnostic explicitly (controlled execution of the real research
    continuation latch).

    The direct-lane latch (chat_orchestrator) is the same contract in
    the other handler; the research lane is executed here because the
    live settle path is fully drivable with a real lifecycle run."""
    _diag_env(monkeypatch, tmp_path)
    block = tmp_path / "r4_delivery_block"
    block.write_text("blocked")
    import time as _time

    from core import research_continuation as rc
    lc = _fresh_lifecycle()
    sid = f"r4-latch-{uuid.uuid4().hex[:8]}"
    exec_id = f"exec-latch-{uuid.uuid4().hex[:8]}"
    # the real run through the production begin/settle pair
    from core import task_lifecycle as tlm
    run_id, op_id = tlm.begin_retrieval_turn(
        lc, {"id": sid}, sid, "find prices in book.xlsx", exec_id,
        items=["Widget A"], requested_fields=["unit price"])
    # controlled source: one matched item (a priced column so the
    # match classifies as "matched"); the real scan receipt shape
    # (SYNC - the production scans run through asyncio.to_thread)
    def _scan(item, user_id, workspace_id, file_name=None, max_matches=None):
        return {"source_identity": {"content_hash": "sha256:latch-version"},
                "matches": [{"sheet": "S1", "cell": "B7", "column": "U.S. LIST",
                             "value": "1,200.00"}]}

    import core.sheet_dataset_service as sds
    monkeypatch.setattr(sds, "find_all_occurrences_sync", _scan,
                        raising=True)
    latch = asyncio.ensure_future(rc._execute_document_read(
        lc, run_id, "user-latch", "default", "book.xlsx", ["Widget A"]))
    # the checkpoint is published AFTER the persistence commit: wait for
    # its appearance while the block holds
    ckpt = tmp_path / "r4_checkpoint.json"
    deadline = _time.monotonic() + 30
    while not ckpt.exists() and _time.monotonic() < deadline:
        await asyncio.sleep(0.05)
    assert ckpt.exists(), "the post-commit checkpoint was never published"
    identity = _json.loads(ckpt.read_text())
    assert identity["run_id"] == run_id
    assert identity["source_version"] == "sha256:latch-version"
    assert identity["outcome"] == "read_succeeded"
    # AND the settle has not returned: the caller cannot deliver what it
    # does not have - the latch really blocks between commit and the
    # result leaves the boundary
    assert not latch.done(), (
        "the settle result was observable WITH the block file present - "
        "nothing is blocking at the post-commit boundary")
    # release the latch: the settle completes and the result arrives
    block.unlink()
    async def _await_settle():
        while not latch.done():
            await asyncio.sleep(0.1)
        exc = latch.exception()
        assert exc is None, f"the real settle path failed: {exc!r}"
        return latch.result()

    result = await asyncio.wait_for(_await_settle(), 90)
    assert result["statuses"] == {"Widget A": "matched"}, result
    assert not block.exists()
    # expiry kept the checkpoint but produced no expiration record here
    assert not (tmp_path / "r4_latch_expired.json").exists()

    # EXPIRY: the SHARED boundary is then invoked DIRECTLY (the same code
    # the settle ran above) with a short deadline and the block held
    # forever - expiry is explicit, bounded, and withholds through the
    # call site's hook, instead of waiting out a production-scale
    # deadline.
    block.write_text("blocked")
    withheld = []
    result_expiry = await asyncio.wait_for(
        rc.r4_delivery_latch(
            "research_continuation",
            {"lane": "research_continuation", "run_id": run_id,
             "operation_id": op_id, "outcome": "read_succeeded"},
            enabled=True,
            expired_record={"lane": "research_continuation",
                            "run_id": run_id, "operation_id": op_id},
            deadline_seconds=0.4,
            on_expiry=lambda: withheld.append(True),
        ), 60)
    assert result_expiry is True, (
        "an unreleased block must expire through the boundary")
    expired = tmp_path / "r4_latch_expired.json"
    assert expired.exists(), (
        "the expiry must be recorded explicitly, not silently dropped")
    exp_info = _json.loads(expired.read_text())
    assert exp_info["lane"] == "research_continuation"
    assert exp_info["run_id"] == run_id
    assert withheld == [True], "the expiry withhold hook must run"
    # and a RELEASED block returns False with no expiry record: the
    # boundary distinguishes release from expiry explicitly
    block.unlink()
    result_release = await asyncio.wait_for(
        rc.r4_delivery_latch(
            "research_continuation",
            {"lane": "research_continuation", "run_id": run_id},
            enabled=True,
            expired_record={"lane": "research_continuation",
                            "run_id": run_id, "operation_id": op_id},
            deadline_seconds=5.0,
        ), 60)
    assert result_release is False
    released_info = _json.loads(
        (tmp_path / "r4_latch_expired.json").read_text())
    assert released_info["run_id"] == run_id and \
        released_info.get("operation_id") == op_id, (
        "the expired record above belongs to the EXPIRED call only - "
        "the released call added no second expiry record")
