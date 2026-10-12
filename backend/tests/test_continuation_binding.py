"""Continuation binding (owner order 2026-10-11): the resume turn must
bind the existing job — not mint a new one, not sweep message tokens,
not re-search satisfied sources, and evidence must reconstruct despite
a newer empty job.

Setup: an evidence-rich job (run A: findings + eligible/exhausted/
owner questions + mailbox evidence) and a newer EMPTY job (run B) on
the same canvas. A bare "continue" from a FRESH session drives the
REAL process_chat_message with controlled planner/narration and a
real in-memory lifecycle. Currently RED on all four counts.
"""
import asyncio
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from integrations import chat_orchestrator as co
import core.chat_canvas_editor as cce

CANVAS = {
    "canvas_id": "cv-cont",
    "canvas_type": "email",
    "title": "Supplier quote",
    "content": {"body": (
        "<p>Hi Steve,</p><table><tr><th>#</th><th>Description</th>"
        "<th>Unit Price</th><th>Delivery</th></tr>"
        "<tr><td>2</td><td>Linmac Bead Roller 22 Gauge, U-22</td>"
        "<td>$1,777.00</td><td>In Stock</td></tr>"
        "<tr><td>4</td><td>Roper Whitney No. 622 Rotary</td>"
        "<td>$2,421.00</td><td>In Stock</td></tr>"
        "<tr><td>5</td><td>Tennsmith Slitter SLE24-16</td>"
        "<td>$8,984.00</td><td>11-12 weeks</td></tr></table>")},
}

TAUGHT_FILE = "taught-2019.xlsx"
TAUGHT_HASH = "hash-taught-A"
SUPPLEMENTARY_FILE = "other-2015.xlsx"

LESSONS = [
    {"lesson": ("price list 2019 in zoho workdrive has the most common "
                "formulas for list price")},
    {"lesson": ("inspect the relevant vendor quote email and its "
                "attachments before giving up")},
]


def _store():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from core.database import Base
    from core.goals.goal_run_service import GoalRunService
    from core.goals.goal_service import GoalService
    from core.models import GoalObjective, GoalRun, TaskOperationRecord
    from core.task_lifecycle import TaskLifecycle

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine, tables=[
        GoalObjective.__table__, GoalRun.__table__,
        TaskOperationRecord.__table__])
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    tl = TaskLifecycle(
        GoalRunService(workspace_id="default", tenant_id="default",
                       session_factory=factory),
        GoalService(workspace_id="default", tenant_id="default",
                    session_factory=factory))
    return tl, factory


def _seed_jobs(tl):
    """Run A (rich, older) + run B (empty, newer) on the same canvas.
    Returns (run_a, run_b). All through the REAL lifecycle helpers."""
    from core.task_lifecycle import (
        begin_retrieval_turn, finish_retrieval_turn, record_read_outcome,
        bump_question_attempts, open_unresolved_questions,
        next_unfinished_work,
    )
    from integrations.chat_orchestrator import _apply_read_receipt_facts

    sess_a = {"id": "sess-A", "history": []}
    run_a, op_a = begin_retrieval_turn(
        tl, sess_a, "sess-A", "research: quote rows", "e-seed",
        items=["U-22", "622", "SLE24-16"], requested_fields=["price"],
        agent_id="agent-taught", canvas_id="cv-cont")
    execution = {"invoked": True, "outcome": "read_succeeded",
                 "served_basis": "live", "source_version": TAUGHT_HASH,
                 "items": {"U-22": "matched"}}
    _apply_read_receipt_facts(execution, {
        "source_identity": {"file_name": TAUGHT_FILE,
                            "content_hash": TAUGHT_HASH},
        "requested_fields": ["price"],
        "requested_items": ["U-22"],
        "targets": [{
            "item": "U-22",
            "identity": {"status": "single", "sheet": "Tennsmith",
                         "row": 26},
            "field": {"status": "single", "values": [{
                "col": "U.S. LIST", "basis": "U.S. LIST",
                "value": 1799.0, "display": "1,799"}]}}],
        "coverage": {"read_status": "success"}}, {"content_hash": TAUGHT_HASH})
    finish_retrieval_turn(
        tl, run_a, op_a,
        {"source_identity": {"file_name": TAUGHT_FILE,
                             "content_hash": TAUGHT_HASH}},
        "e-seed", True, execution=execution)
    # eligible row-read question (structured inputs) + owner decision
    # + mailbox evidence on the same job
    q_eligible = {
        "item": "622", "kind": "verification",
        "question": "622: read row 268 of Tennsmith in taught-2019.xlsx",
        "evidence": "value_trace coverage",
        "next_action": f"read {TAUGHT_FILE} for 622",
        "inputs": {"item": "622", "file": TAUGHT_FILE,
                   "sheet": "Tennsmith", "row": 268,
                   "service": "datasets",
                   "requested_fields": ["price"]},
    }
    q_owner = {
        "item": "622", "kind": "business_decision",
        "question": "which price basis applies to 622",
        "evidence": "two monetary columns",
        "next_action": "owner picks the basis for 622",
    }
    q_exhausted = {
        "item": "U-22", "kind": "verification",
        "question": "U-22: read row 99 of other-2015.xlsx",
        "evidence": "value_trace coverage",
        "next_action": f"read {SUPPLEMENTARY_FILE} for U-22",
        "inputs": {"item": "U-22", "file": SUPPLEMENTARY_FILE,
                   "sheet": "Sheet1", "row": 99,
                   "requested_fields": ["price"]},
    }
    record_read_outcome(
        tl, run_a, op_a, structured_result=None, freshness=None,
        execution=None,
        extra_questions=[q_eligible, q_owner, q_exhausted])
    # exhaust the decoy in the shape the live job actually carries:
    # the one-time budget migration runs FIRST (it would otherwise
    # reset a fresh exhaustion on the next settle), then the decoy
    # exhausts and STAYS exhausted.
    rec = tl.get_task(run_a)
    qid = next(
        q.get("question_id") for q in
        open_unresolved_questions(rec)
        if q.get("item") == "U-22" and q.get("kind") == "verification")
    for _ in range(3):
        bump_question_attempts(tl, run_a, [qid])
    record_read_outcome(
        tl, run_a, op_a, structured_result=None, freshness=None,
        execution=None)
    for _ in range(3):
        bump_question_attempts(tl, run_a, [qid])
    # mailbox evidence: retrieved outlook op with thread evidence
    run_m, op_m = begin_retrieval_turn(
        tl, sess_a, "sess-A", "mailbox: vendor threads", "e-mail",
        items=["SLE24-16", "U-22", "622"], agent_id="agent-taught",
        canvas_id="cv-cont")
    finish_retrieval_turn(
        tl, run_m, op_m, {}, "e-mail", True, execution={
            "invoked": True, "outcome": "search_succeeded",
            "served_basis": "live",
            "items": {"SLE24-16": "", "U-22": "", "622": ""},
            "evidence": ["thread Chandrakant->Steve 2026-09-18 quote"]})
    record_read_outcome(tl, run_m, op_m, structured_result=None,
                        freshness=None, execution=None)
    _ = run_m
    # run B: newer, empty, same canvas (the shadowing job)
    run_b, _op_b = begin_retrieval_turn(
        tl, {"id": "sess-B", "history": []}, "sess-B",
        "other ask", "e-b", items=[], agent_id="agent-taught",
        canvas_id="cv-cont")
    return run_a, run_b


def _run_continuation(tl, factory, message=None):
    """The REAL turn from a FRESH session against the canvas holding
    runs A (rich) and B (empty). Models the live drift shape: a
    served research plan whose query carries a LOCATOR token (the
    literal row number) and a non-empty executed block — the exact
    t1r7 branch that swept junk and re-searched the mailbox."""
    message = message or (
        "Please continue the workbook half of this investigation on "
        "this fork: read the open rows for the five requested items — "
        "the taught Tennsmith row 338 for No. 381 and the located "
        "rows for the others — and report each value with its source "
        "file, sheet and version. Don't change the draft; do not "
        "re-search the mailbox, use the correspondence evidence "
        "already on record.")
    orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
    orch.tenant_id = "default"
    orch._cancelled_sessions = set()
    orch._budget_exceeded_runs = set()
    session = {"id": "sess-A", "history": [
        {"role": "user", "message": "investigate the five rows"},
        {"role": "assistant",
         "message": "Investigation: 381 $2,902 vs sources; workbook "
                    "reads still open"}]}
    spy = {"edit_planner": 0, "mail": [], "rows": [], "scans": []}

    async def _plan_ce(*a, **k):
        spy["edit_planner"] += 1

        class _P:
            wants_edit = False
            reply = "declined"
        return _P()

    from core.chat_tool_planner import ToolPlan
    # THE LIVE DRIFT PLAN: served, research-shaped, query = the
    # continuation message's locator words (the '338' sweep shape).
    live_plan = ToolPlan(
        use_tool=True, service="datasets", intent="search",
        query=("Roper Whitney No. 381 Linmac U-22 bead roller "
               "Tennsmith row 338"),
        reason="supervisor asked about the quote")

    class _StreamAgen:
        def __init__(self, text):
            self._text = text

        def __aiter__(self):
            return self

        async def __anext__(self):
            if self._text is None:
                raise StopAsyncIteration
            text, self._text = self._text, None
            return {"content": text}

    class _StreamResult:
        def __init__(self, text):
            self._text = text

        def __aiter__(self):
            return _StreamAgen(self._text).__aiter__()

    llm = MagicMock(name="llm")
    llm.stream_completion.side_effect = (
        lambda *a, **k: _StreamResult("reply text"))
    llm.generate_completion.side_effect = (
        lambda *a, **k: {"content": "reply text", "model": "test",
                         "provider": "test"})
    orch.llm_service = llm

    async def _no_mail(*a, **k):
        spy["mail"].append((str(a[1] if len(a) > 1 else "")[:60]
                            if a else "read"))
        return []

    def _scan(item, user_id=None, workspace_id=None, file_name=None,
              max_matches=8):
        spy["scans"].append((str(item), file_name))
        return {"matches": [], "per_file": {}, "total_matches": 0,
                "source_identity": {}}

    def _row_reader(fname, sheet, row_number, *a, **k):
        spy["rows"].append((fname, sheet, row_number))
        if (fname == TAUGHT_FILE and sheet == "Tennsmith"
                and row_number == 268):
            return {"headers": ["MODEL NO.", "DESCRIPTION",
                                "U.S. LIST"],
                    "row": {"MODEL NO.": "622",
                            "DESCRIPTION":
                                "Roper Whitney No. 622 Rotary Machine",
                            "U.S. LIST": "$2,421.00"},
                    "source": {"file_name": fname,
                               "content_hash": TAUGHT_HASH}}
        return None

    async def _exec_plan(plan, *a, **k):
        # a served locator sweep: non-empty block, zero structured
        # receipt (the live junk-sweep shape)
        spy.setdefault("exec_queries", []).append(
            (plan.service, plan.intent, str(plan.query)[:120]))
        return ("LIVE TOOL RESULTS (datasets.search) — 11 rows matched "
                "part numbers starting 338-…; values blank")

    import os as _os
    _os.environ.setdefault("ATOM_TASK_LIFECYCLE_ENABLED", "1")
    _os.environ.setdefault("CHAT_FINALIZATION_M2", "1")
    _cms = [
        patch.object(orch, "_get_or_create_session",
                     return_value=session),
        patch.object(orch, "_resolve_canvas_ctx",
                     new=AsyncMock(return_value=dict(CANVAS))),
        patch.object(orch, "_start_chat_execution",
                     return_value="exec-cont"),
        patch.object(orch, "_record_chat_step", new=AsyncMock()),
        patch.object(orch, "_emit_agent_status", new=AsyncMock()),
        patch.object(orch, "_update_session", new=MagicMock()),
        patch.object(orch, "_finish_chat_execution", new=MagicMock()),
        patch.object(orch, "_load_conversation_mail_handles",
                     return_value=([], [])),
        patch.object(orch, "_route_to_features",
                     new=AsyncMock(return_value={})),
        patch("core.chat_tool_planner.plan_tool_use",
              new=AsyncMock(return_value=live_plan)),
        patch("core.chat_tool_planner.execute_tool_plan",
              new=AsyncMock(side_effect=_exec_plan)),
        patch("core.turn_decision.interpret_turn_request",
              new=AsyncMock(return_value={
                  "subjects": [], "scope_change": "unresolved",
                  "origin": "model", "request_id": "req-c"})),
        patch("core.memory_context_assembler.assembly_enabled",
              return_value=False),
        patch("core.chat_mini_app_authoring.try_handle",
              new=AsyncMock(return_value=None)),
        patch("core.chat_tool_planner._provenance_menu",
              new=AsyncMock(return_value="")),
        patch("integrations.chat_orchestrator._verbatim_mail_evidence",
              new=AsyncMock(return_value=[])),
        patch.object(cce, "plan_canvas_edit",
                     new=AsyncMock(side_effect=_plan_ce)),
        patch.object(cce, "fetch_fresh_data_section",
                     new=AsyncMock(return_value=cce.FreshDataResult(
                         "", False, True))),
        patch("integrations.chat_orchestrator._begin_task_edit",
              return_value={"status": "legacy"}),
        patch("integrations.chat_orchestrator._task_lifecycle_for",
              return_value=tl),
        patch.object(co.ChatOrchestrator, "_agent_lessons",
                     return_value=[dict(L) for L in LESSONS]),
        patch("core.sheet_dataset_service.find_all_occurrences_sync",
              side_effect=_scan),
        patch("core.sheet_dataset_service.read_sheet_row_sync",
              side_effect=_row_reader),
        patch("core.sheet_dataset_service.find_entries_sync",
              # matches the live t1r7 turn: an empty-query read (the
              # lesson-designated resolver's lookup) resolves nothing,
              # so the file-ask lane does not claim the continuation.
              side_effect=lambda query="", *a, **k: (
                  [] if not str(query).strip() else
                  [{"file_name": TAUGHT_FILE,
                    "content_hash": TAUGHT_HASH}])),
        patch("integrations.outlook_service.outlook_service."
              "search_emails",
              new=AsyncMock(side_effect=_no_mail)),
        patch("integrations.outlook_service.outlook_service."
              "list_recent_emails",
              new=AsyncMock(side_effect=_no_mail)),
    ]
    with ExitStack() as _stack:
        for _cm in _cms:
            _stack.enter_context(_cm)
        result = asyncio.run(orch.process_chat_message(
            "user-1", message, "sess-A",
            context={"canvas": dict(CANVAS),
                     "agent_id": "agent-taught"}))
    return result, spy, orch, tl, factory


def _ops_by_run(tl):
    out = {}
    for run in tl.runs.list_runs(include_terminal=True, limit=20):
        rec = tl.get_task(run["id"])
        out[run["id"]] = rec.get("operations") or []
    return out


class TestContinuationBinding:
    def test_resume_retains_the_original_job_identity(self):
        tl, factory = _store()
        run_a, run_b = _seed_jobs(tl)
        before = _ops_by_run(tl)
        result, spy, orch, tl, factory = _run_continuation(tl, factory)
        after = _ops_by_run(tl)
        assert set(after) == set(before), (
            "the resumed job stays the execution target — no fresh "
            f"run may be minted (runs before={len(before)}, "
            f"after={len(after)})")
        assert len(after[run_a]) > len(before[run_a]), (
            "the turn's work lands on the resumed job")

    def test_only_eligible_actions_dispatch_structured_reads(self):
        tl, factory = _store()
        run_a, run_b = _seed_jobs(tl)
        result, spy, orch, tl, factory = _run_continuation(tl, factory)
        assert (TAUGHT_FILE, "Tennsmith", 268) in spy["rows"], (
            "the eligible open row-read executes from its structured "
            f"inputs: {spy['rows']}")
        assert not any(f == SUPPLEMENTARY_FILE for f, _s, _r in
                       spy["rows"]), (
            "the exhausted location is never re-read")
        # the locator sweep must not drive the CHAIN either: no
        # value_trace over a row number
        for _svc, _intent, query in spy.get("exec_queries", []):
            if _intent == "value_trace":
                assert "338" not in query and "268" not in query, (
                    f"the chain may not sweep locator tokens: {query!r}")
        assert spy["edit_planner"] == 0, "read-only continuation"

    def test_satisfied_mailbox_obligation_is_not_researched(self):
        tl, factory = _store()
        run_a, run_b = _seed_jobs(tl)
        result, spy, orch, tl, factory = _run_continuation(tl, factory)
        outlook_execs = [q for svc, _i, q in
                         spy.get("exec_queries", []) if svc == "outlook"]
        assert not outlook_execs, (
            "mailbox evidence already on the record must be reused, "
            f"never re-searched: {outlook_execs}")
        assert spy["mail"] == []

    def test_evidence_reconstructs_despite_newer_empty_job(self):
        from core.goals.goal_run_service import GoalRunService
        from core.goals.goal_service import GoalService
        from core.task_lifecycle import TaskLifecycle

        tl, factory = _store()
        run_a, run_b = _seed_jobs(tl)
        result, spy, orch, tl, factory = _run_continuation(tl, factory)
        fresh = TaskLifecycle(
            GoalRunService(workspace_id="default", tenant_id="default",
                           session_factory=factory),
            GoalService(workspace_id="default", tenant_id="default",
                        session_factory=factory))
        with patch("integrations.chat_orchestrator._task_lifecycle_for",
                    return_value=fresh):
            contract = orch._canvas_job_evidence_contract(
                {"canvas_id": "cv-cont", "content": CANVAS["content"]})
        assert contract is not None and contract.get("evidence"), (
            "the newer empty job must not shadow the applicable "
            "record's evidence")
        items = {e.get("entity_id") for e in contract["evidence"]}
        assert "U-22" in items and "622" in items, (
            f"seeded + resumed findings reconstruct: {sorted(items)}")


class TestLeaseSemantics:
    """F3 (owner order 2026-10-11): the claim's expiry is PERSISTED and
    every reader — acquisition, renewal, execution dedupe, settlement
    — uses THE SAME lease. A caller's new ttl never reinterprets
    another worker's existing lease."""

    def _lease_setup(self):
        from core.task_lifecycle import (
            begin_retrieval_turn, record_read_outcome,
            open_unresolved_questions,
        )
        tl, factory = _store()
        run_id, op_id = begin_retrieval_turn(
            tl, {"id": "s-l", "history": []}, "sess-l",
            "verify 622", "e-l", items=["622"])
        record_read_outcome(
            tl, run_id, op_id, structured_result=None, freshness=None,
            execution=None,
            extra_questions=[{
                "item": "622", "kind": "verification",
                "question": "622: read row 268",
                "evidence": "vt",
                "next_action": f"read {TAUGHT_FILE} for 622",
                "inputs": {"item": "622", "file": TAUGHT_FILE}}])
        qid = next(q.get("question_id") for q in
                   open_unresolved_questions(tl.get_task(run_id)))
        return tl, factory, run_id, qid

    def test_lease_expiry_is_persisted_on_the_claim(self):
        from core.task_lifecycle import claim_questions_for_execution

        tl, factory, run_id, qid = self._lease_setup()
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-a", ttl_seconds=90.0)
        from core.task_lifecycle import open_unresolved_questions
        claim = next(
            (q.get("exec_claim") or {}) for q in
            open_unresolved_questions(tl.get_task(run_id)))
        assert float(claim.get("ttl")) == 90.0, (
            f"the acquired lease carries its own expiry: {claim}")

    def test_fresh_owner_excludes_another_worker(self):
        from core.task_lifecycle import claim_questions_for_execution

        tl, factory, run_id, qid = self._lease_setup()
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-a", ttl_seconds=300.0)
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-b", ttl_seconds=300.0) == [], (
            "a fresh lease excludes another worker regardless of the "
            "caller's ttl")

    def test_expired_lease_allows_takeover(self):
        from core.task_lifecycle import claim_questions_for_execution

        tl, factory, run_id, qid = self._lease_setup()
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-a", ttl_seconds=0.02)
        import time as _t
        _t.sleep(0.05)
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-b", ttl_seconds=300.0) == [qid], (
            "an expired lease lets another worker take over")

    def test_renewal_refreshes_the_lease(self):
        from core.task_lifecycle import claim_questions_for_execution

        tl, factory, run_id, qid = self._lease_setup()
        claim_questions_for_execution(
            tl, run_id, [qid], by="worker-a", ttl_seconds=0.05)
        import time as _t
        _t.sleep(0.03)
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-a", ttl_seconds=5.0), (
            "the same holder renews before expiry")
        from core.task_lifecycle import open_unresolved_questions
        claim = next(
            (q.get("exec_claim") or {}) for q in
            open_unresolved_questions(tl.get_task(run_id)))
        assert float(claim.get("ttl")) == 5.0, (
            "renewal persists the new lease")

    def test_former_owner_cannot_settle_after_takeover(self):
        from core.task_lifecycle import (
            claim_questions_for_execution,
            resolve_unresolved_questions_fenced,
            TaskLifecycleConcurrencyError,
        )

        tl, factory, run_id, qid = self._lease_setup()
        claim_questions_for_execution(
            tl, run_id, [qid], by="worker-a", ttl_seconds=0.02)
        import time as _t
        _t.sleep(0.05)
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-b", ttl_seconds=300.0) == [qid]
        with pytest.raises(TaskLifecycleConcurrencyError):
            resolve_unresolved_questions_fenced(
                tl, run_id, question_ids=[qid], by="worker-a",
                ttl_seconds=300.0,
                resolution={"how": "stale holder settles"})
        from core.task_lifecycle import open_unresolved_questions
        still_open = any(
            str(q.get("question_id")) == str(qid)
            for q in open_unresolved_questions(tl.get_task(run_id)))
        assert still_open, (
            "the former owner's settlement is rejected — the question "
            "stays open for the new holder")


class TestSourceCallIdempotency:
    """F1 (owner order 2026-10-11): the eligibility/idempotency decision
    runs BEFORE any source call. Counts are of ACTUAL source calls
    (the row reader), never operation counts."""

    def _drive(self, tl, second_fields=None, n_times=2):
        from core.research_continuation import _execute_row_read

        calls = []

        def _reader(fname, sheet, row_number, *a, **k):
            calls.append((fname, sheet, row_number))
            return {"headers": ["MODEL NO.", "U.S. LIST"],
                    "row": {"MODEL NO.": "622",
                            "U.S. LIST": "$2,421.00"},
                    "source": {"file_name": fname,
                               "content_hash": "hash-v1"}}

        act = {"item": "622", "requested_fields": ["price"],
               "identity_context": "Roper Whitney No. 622",
               "file": TAUGHT_FILE,
               "candidates": [{"sheet": "Tennsmith", "row": 268,
                               "identity_column": "MODEL NO.",
                               "identity_cell": "622"}]}
        results = []
        with patch("core.sheet_dataset_service.read_sheet_row_sync",
                   side_effect=_reader):
            for i in range(n_times):
                a = dict(act)
                if i > 0 and second_fields:
                    a["requested_fields"] = list(second_fields)
                results.append(asyncio.run(_execute_row_read(
                    tl, self._job(tl), "u", "default", a, [])))
        return calls, results

    def _job(self, tl):
        from core.task_lifecycle import begin_retrieval_turn
        run_id, _op = begin_retrieval_turn(
            tl, {"id": "s-f1", "history": []}, "sess-f1",
            "verify 622", "e-f1", items=["622"],
            requested_fields=["price"])
        return run_id

    def test_second_identical_read_makes_zero_source_calls(self):
        tl, factory = _store()
        calls, results = self._drive(tl, n_times=2)
        assert len(calls) == 1, (
            f"the duplicate read made a second source call: {calls}")
        assert results[1].get("source_calls") == 0, (
            "the reuse path reports zero source calls")
        assert any("0 source calls" in e
                   for e in (results[1].get("evidence") or [])), (
            f"the claim is counter-proven: {results[1].get('evidence')}")

    def test_different_fields_are_not_suppressed(self):
        tl, factory = _store()
        calls, results = self._drive(
            tl, second_fields=["price", "delivery"], n_times=2)
        assert len(calls) == 2, (
            "a price+delivery read is a DIFFERENT logical identity — "
            f"it must read again: {calls}")
        assert results[1].get("source_calls") == 1

    def test_failed_read_stays_retryable(self):
        from core.task_lifecycle import begin_retrieval_turn
        from core.research_continuation import _execute_row_read

        tl, factory = _store()
        run_id, _op = begin_retrieval_turn(
            tl, {"id": "s-f1b", "history": []}, "sess-f1b",
            "verify 622", "e-f1b", items=["622"],
            requested_fields=["price"])
        calls = []

        def _reader(fname, sheet, row_number, *a, **k):
            calls.append(1)
            return None  # receipt-less failure

        act = {"item": "622", "requested_fields": ["price"],
               "identity_context": "Roper Whitney No. 622",
               "file": TAUGHT_FILE,
               "candidates": [{"sheet": "Tennsmith", "row": 268,
                               "identity_column": "MODEL NO.",
                               "identity_cell": "622"}]}
        with patch("core.sheet_dataset_service.read_sheet_row_sync",
                   side_effect=_reader):
            asyncio.run(_execute_row_read(
                tl, run_id, "u", "default", dict(act), []))
            r2 = asyncio.run(_execute_row_read(
                tl, run_id, "u", "default", dict(act), []))
        assert len(calls) == 2, (
            "a FAILED read is retryable — the second attempt reads again")
        assert r2.get("source_calls") == 1

    def test_fresh_claim_blocks_execution_with_zero_calls(self):
        from core.task_lifecycle import (
            begin_retrieval_turn, record_read_outcome,
            claim_questions_for_execution, open_unresolved_questions,
        )
        from core.research_continuation import _execute_row_read

        tl, factory = _store()
        run_id, op_id = begin_retrieval_turn(
            tl, {"id": "s-f1c", "history": []}, "sess-f1c",
            "verify 622", "e-f1c", items=["622"],
            requested_fields=["price"])
        record_read_outcome(
            tl, run_id, op_id, structured_result=None, freshness=None,
            execution=None,
            extra_questions=[{
                "item": "622", "kind": "verification",
                "question": "622: read row 268",
                "evidence": "vt",
                "next_action": f"read {TAUGHT_FILE} for 622",
                "inputs": {"item": "622", "file": TAUGHT_FILE,
                           "sheet": "Tennsmith", "row": 268,
                           "requested_fields": ["price"]}}])
        qid = next(q.get("question_id") for q in
                   open_unresolved_questions(tl.get_task(run_id)))
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-other", ttl_seconds=300.0), (
            "the peer claim is active")
        calls = []
        with patch("core.sheet_dataset_service.read_sheet_row_sync",
                   side_effect=lambda *a, **k: calls.append(1)):
            asyncio.run(_execute_row_read(
                tl, run_id, "u", "default",
                {"item": "622", "requested_fields": ["price"],
                 "identity_context": "Roper Whitney No. 622",
                 "file": TAUGHT_FILE,
                 "candidates": [{"sheet": "Tennsmith", "row": 268,
                                 "identity_column": "MODEL NO.",
                                 "identity_cell": "622"}]},
                [qid]))
        assert calls == [], (
            "a fresh peer claim blocks execution — zero source calls "
            "even though the act is otherwise eligible")
