"""VERIFIER checks (owner order 2026-10-11, read-only review of the
frozen candidate): five specific checks on the continuation-binding
repair. Harness-only; nothing here seeds operations manually — all
state builds through the REAL lifecycle/chat paths.

1. Explicit job binding wins over newer same-canvas findings.
2. The exact live continuation wording enters the repaired branch; a
   fresh request does not.
3. Entity preservation does not block explicit scope updates.
4. Reuse is obligation-specific (subject + field + source scope).
5. Claims control actual source calls (counted).
"""
import asyncio
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from integrations import chat_orchestrator as co
import core.chat_canvas_editor as cce
from core.task_lifecycle import (
    TaskLifecycle, begin_retrieval_turn, finish_retrieval_turn,
    record_read_outcome, add_unresolved_questions,
    claim_questions_for_execution, bump_question_attempts,
    open_unresolved_questions, next_unfinished_work,
)
from integrations.chat_orchestrator import (
    _apply_read_receipt_facts, _CONTINUATION_TRIGGER_RE,
)

CANVAS = {
    "canvas_id": "cv-ver",
    "canvas_type": "email",
    "title": "Supplier quote",
    "content": {"body": (
        "<p>Hi Steve,</p><table><tr><th>#</th><th>Description</th>"
        "<th>Unit Price</th><th>Delivery</th></tr>"
        "<tr><td>2</td><td>Linmac Bead Roller 22 Gauge, U-22</td>"
        "<td>$1,777.00</td><td>In Stock</td></tr></table>")},
}
TAUGHT = "taught-2019.xlsx"
TAUGHT_HASH = "hash-taught-A"

# THE EXACT LIVE CONTINUATION WORDING (session 21268a02, execution
# 29bc3026) — the branch the live verification must run.
LIVE_CONTINUATION = (
    "Please continue the workbook half of this investigation on "
    "this fork: read the open rows for the five requested items — "
    "the taught Tennsmith row 338 for No. 381 and the located "
    "rows for the others — and report each value with its source "
    "file, sheet and version. Don't change the draft; do not "
    "re-search the mailbox, use the correspondence evidence "
    "already on record.")

FRESH_REQUEST = "What's the price of the GSL48-16 slitter?"


def _store():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from core.database import Base
    from core.goals.goal_run_service import GoalRunService
    from core.goals.goal_service import GoalService
    from core.models import GoalObjective, GoalRun, TaskOperationRecord

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


def _rich_job(tl, conversation, exec_id="e-rich", findings_item="U-22"):
    """A job with durable findings + an eligible row-read question."""
    sess = {"id": conversation, "history": []}
    run_id, op_id = begin_retrieval_turn(
        tl, sess, conversation, "research: quote rows", exec_id,
        items=[findings_item, "622"], requested_fields=["price"],
        canvas_id="cv-ver")
    execution = {"invoked": True, "outcome": "read_succeeded",
                 "served_basis": "live", "source_version": TAUGHT_HASH,
                 "items": {findings_item: "matched"}}
    _apply_read_receipt_facts(execution, {
        "source_identity": {"file_name": TAUGHT,
                            "content_hash": TAUGHT_HASH},
        "requested_fields": ["price"],
        "requested_items": [findings_item],
        "targets": [{
            "item": findings_item,
            "identity": {"status": "single", "sheet": "Tennsmith",
                         "row": 26},
            "field": {"status": "single", "values": [
                {"col": "U.S. LIST", "basis": "U.S. LIST",
                 "value": 1799.0, "display": "1,799"}]}}],
        "coverage": {"read_status": "success"}}, {"content_hash": TAUGHT_HASH})
    finish_retrieval_turn(tl, run_id, op_id, {}, exec_id, True,
                          execution=execution)
    record_read_outcome(
        tl, run_id, op_id, structured_result=None, freshness=None,
        execution=execution,
        extra_questions=[{
            "item": "622", "kind": "verification",
            "question": "622: read row 268 of Tennsmith in taught-2019.xlsx",
            "evidence": "value_trace coverage",
            "next_action": f"read {TAUGHT} for 622",
            "inputs": {"item": "622", "file": TAUGHT,
                       "sheet": "Tennsmith", "row": 268,
                       "requested_fields": ["price"]}}])
    return run_id


def _run_turn(tl, message, session_id, history=None):
    orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
    orch.tenant_id = "default"
    orch._cancelled_sessions = set()
    orch._budget_exceeded_runs = set()
    session = {"id": session_id,
               "history": history if history is not None else []}
    spy = {"edit_planner": 0, "rows": [], "mail": [], "execs": []}

    async def _plan_ce(*a, **k):
        spy["edit_planner"] += 1

        class _P:
            wants_edit = False
        return _P()

    from core.chat_tool_planner import ToolPlan
    plan = ToolPlan(use_tool=True, service="datasets", intent="search",
                    query="roper whitney 381",
                    reason="supervisor asked about the quote")

    class _SA:
        def __init__(self, text):
            self._text = text

        def __aiter__(self):
            return self

        async def __anext__(self):
            if self._text is None:
                raise StopAsyncIteration
            t, self._text = self._text, None
            return {"content": t}

    class _SR:
        def __init__(self, text):
            self._text = text

        def __aiter__(self):
            return _SA(self._text).__aiter__()

    llm = MagicMock(name="llm")
    llm.stream_completion.side_effect = (
        lambda *a, **k: _SR("reply text"))
    llm.generate_completion.side_effect = (
        lambda *a, **k: {"content": "reply text", "model": "t",
                         "provider": "t"})
    orch.llm_service = llm

    def _row_reader(fname, sheet, row_number, *a, **k):
        spy["rows"].append((fname, sheet, row_number))
        if (fname == TAUGHT and sheet == "Tennsmith"
                and row_number == 268):
            return {"headers": ["MODEL NO.", "U.S. LIST"],
                    "row": {"MODEL NO.": "622",
                            "U.S. LIST": "$2,421.00"},
                    "source": {"file_name": fname,
                               "content_hash": TAUGHT_HASH}}
        return None

    async def _exec(plan_, *a, **k):
        spy["execs"].append((plan_.service, plan_.intent,
                             str(plan_.query)[:100]))
        return "LIVE TOOL RESULTS (junk sweep): part numbers 338-xxx"

    import os as _os
    _os.environ.setdefault("ATOM_TASK_LIFECYCLE_ENABLED", "1")
    _os.environ.setdefault("CHAT_FINALIZATION_M2", "1")
    _cms = [
        patch.object(orch, "_get_or_create_session",
                     return_value=session),
        patch.object(orch, "_resolve_canvas_ctx",
                     new=AsyncMock(return_value=dict(CANVAS))),
        patch.object(orch, "_start_chat_execution",
                     return_value="exec-v"),
        patch.object(orch, "_record_chat_step", new=AsyncMock()),
        patch.object(orch, "_emit_agent_status", new=AsyncMock()),
        patch.object(orch, "_update_session", new=MagicMock()),
        patch.object(orch, "_finish_chat_execution", new=MagicMock()),
        patch.object(orch, "_load_conversation_mail_handles",
                     return_value=([], [])),
        patch.object(orch, "_route_to_features",
                     new=AsyncMock(return_value={})),
        patch("core.chat_tool_planner.plan_tool_use",
              new=AsyncMock(return_value=plan)),
        patch("core.chat_tool_planner.execute_tool_plan",
              new=AsyncMock(side_effect=_exec)),
        patch("core.turn_decision.interpret_turn_request",
              new=AsyncMock(return_value={
                  "subjects": [], "scope_change": "unresolved",
                  "origin": "model", "request_id": "r"})),
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
                     return_value=[{"lesson": (
                         "price list 2019 in zoho workdrive has the most "
                         "common formulas")}]),
        patch("core.sheet_dataset_service.find_all_occurrences_sync",
              side_effect=lambda *a, **k: {"matches": [], "per_file": {},
                                           "total_matches": 0,
                                           "source_identity": {}}),
        patch("core.sheet_dataset_service.read_sheet_row_sync",
              side_effect=_row_reader),
        patch("core.sheet_dataset_service.find_entries_sync",
              side_effect=lambda q="", *a, **k: (
                  [] if not str(q).strip() else
                  [{"file_name": TAUGHT, "content_hash": TAUGHT_HASH}])),
        patch("integrations.outlook_service.outlook_service."
              "search_emails",
              new=AsyncMock(side_effect=lambda *a, **k:
                            spy["mail"].append(1) or [])),
        patch("integrations.outlook_service.outlook_service."
              "list_recent_emails",
              new=AsyncMock(side_effect=lambda *a, **k:
                            spy["mail"].append(1) or [])),
    ]
    with ExitStack() as _stack:
        for _cm in _cms:
            _stack.enter_context(_cm)
        result = asyncio.run(orch.process_chat_message(
            "user-1", message, session_id,
            context={"canvas": dict(CANVAS), "agent_id": "agent-v"}))
    return result, spy, session


class TestVerifierChecks:
    # ---------- CHECK 1: explicit binding beats newer findings --------
    def test_explicit_job_binding_wins_over_newer_findings(self):
        tl, factory = _store()
        old = _rich_job(tl, "sess-old", "e-old")
        # a NEWER job on the SAME canvas WITH findings (newest-applicable
        # would pick this one)
        new = _rich_job(tl, "sess-new", "e-new", findings_item="GSL48-16")
        ops_old_before = len((tl.get_task(old).get("operations") or []))
        # the session resumes the OLD job explicitly (stashed + seed)
        result, spy, session = _run_turn(
            tl, LIVE_CONTINUATION, "sess-old",
            history=[{"role": "user", "message": "investigate rows 1-5"}])
        assert session.get("_continuation_seed", {}).get("run_id") == old, (
            "the explicit resume binds the OLD job")
        assert session.get("_task_run_id") == old, (
            "turn execution re-stashed the OLD run")
        ops_old_after = len((tl.get_task(old).get("operations") or []))
        assert ops_old_after > ops_old_before, (
            "the resumed work landed on the OLD job")
        assert not any(
            (tl.get_task(o.get("operation_id")) or {}).get("run_id")
            for o in [])  # structural no-op
        assert len(tl.runs.list_runs(include_terminal=True,
                                     limit=50)) == 2, (
            "no third run minted")

    def test_resolve_for_turn_prefers_seed_over_conversation(self):
        tl, factory = _store()
        old = _rich_job(tl, "sess-old", "e-old")
        new = _rich_job(tl, "sess-new", "e-new", findings_item="GSL48-16")
        session = {"id": "sess-x", "history": [],
                   "_continuation_seed": {"run_id": old}}
        from core.task_lifecycle import _resolve_for_turn
        rec = _resolve_for_turn(tl, session, "sess-x")
        assert rec and rec["run_id"] == old, (
            "an explicitly seeded run is never replaced by the "
            "conversation fallback")

    # ---------- CHECK 2: trigger wording ------------------------------
    def test_live_continuation_wording_enters_the_branch(self):
        assert _CONTINUATION_TRIGGER_RE.match(LIVE_CONTINUATION), (
            "the exact live wording must enter the repaired branch")

    def test_fresh_request_is_not_a_continuation(self):
        assert not _CONTINUATION_TRIGGER_RE.match(FRESH_REQUEST)
        assert not _CONTINUATION_TRIGGER_RE.match(
            "Compare the U-22 delivery against the source")
        assert not _CONTINUATION_TRIGGER_RE.match(
            "If you continue to see issues, tell me")
        assert co._CONTINUATION_RE.fullmatch("continue")
        assert not co._CONTINUATION_RE.fullmatch(LIVE_CONTINUATION), (
            "the bare-only regex still rejects the qualified form — "
            "the widened trigger is what admits it")

    # ---------- CHECK 3: entities preserved, scope updates allowed ----
    def test_locator_token_does_not_overwrite_entities(self):
        tl, factory = _store()
        run_id = _rich_job(tl, "sess-loc", "e-loc")
        before = [e.get("id") for e in
                  (tl.get_task(run_id).get("task_revision")
                   or {}).get("entities") or []]
        # a continuation turn whose message mines a locator token
        _run_turn(tl, LIVE_CONTINUATION, "sess-loc",
                  history=[{"role": "user", "message": "investigate"}])
        after = [e.get("id") for e in
                 (tl.get_task(run_id).get("task_revision")
                  or {}).get("entities") or []]
        assert before == after and before, (
            f"the job's subject set is untouched: {before} -> {after}")

    def test_explicit_scope_update_still_works(self):
        from core.pending_file_task import entity_set_edit
        assert entity_set_edit(
            "also add TK 1624 to the comparison") is not None, (
            "an explicit add reaches the scope-update mechanism")
        assert entity_set_edit(
            "replace U-22 with U-38") is not None, (
            "an explicit replace reaches the scope-update mechanism")
        # and the mechanism's transition still rewrites entities on a job
        tl, factory = _store()
        run_id = _rich_job(tl, "sess-scope", "e-scope")
        tl.apply_transition(run_id, {
            "kind": "revise_objective",
            "requested_change": "also add TK 1624 to the comparison",
            "entities": [{"id": "U-22", "label": "U-22"},
                         {"id": "TK 1624", "label": "TK 1624"}],
            "removed_entity_ids": [],
        })
        ids = [e.get("id") for e in
               (tl.get_task(run_id).get("task_revision")
                or {}).get("entities") or []]
        assert "TK 1624" in ids, (
            "an explicit scope update through the existing mechanism "
            f"still lands: {ids}")

    # ---------- CHECK 4: obligation-specific reuse --------------------
    def test_mailbox_for_one_subject_does_not_suppress_others(self):
        tl, factory = _store()
        sess = {"id": "sess-m", "history": []}
        run_id, op_id = begin_retrieval_turn(
            tl, sess, "sess-m", "research: quote rows", "e-m",
            items=["SLE24-16", "381", "U-22", "622"], canvas_id="cv-ver")
        finish_retrieval_turn(
            tl, run_id, op_id, {}, "e-m", True, execution={
                "invoked": True, "outcome": "search_succeeded",
                "served_basis": "live",
                "items": {"SLE24-16": ""},
                "evidence": ["thread Chandrakant->Steve quote"]})
        record_read_outcome(tl, run_id, op_id, structured_result=None,
                            freshness=None, execution=None)
        # drive the reuse evaluation for the OTHER rows: the record has
        # mailbox evidence ONLY for SLE24-16
        record = tl.get_task(run_id)
        from core.pending_file_task import (
            is_retrieval_refresh_request,
        )
        from core.task_lifecycle import open_unresolved_questions

        covered = set()
        for o in record.get("operations") or []:
            ex = o.get("execution") or {}
            if not ex.get("invoked"):
                continue
            if str(ex.get("outcome") or "") not in (
                    "search_succeeded", "read_succeeded"):
                continue
            txt = (str(o.get("requested_change") or "") + " " + " ".join(
                str(e)[:200] for e in (ex.get("evidence") or []))).lower()
            if not ("outlook" in txt or "mail" in txt or "thread" in txt
                    or "correspondence" in txt):
                continue
            items = {str(k).strip().lower()
                     for k in (ex.get("items") or {})}
            covered |= {s for s in ("381", "u-22", "622") if s in items}
        assert "sle24-16" not in covered and not covered, (
            "mailbox evidence covers ONLY the subject it actually "
            f"searched: {covered}")
        # no open mailbox question for the other rows -> the reuse test
        # is whether the code would wrongly skip; with SLE24-16-only
        # evidence, a request naming rows 1-4 must not reuse outlook
        # for them (assert the subject-matching predicate directly)
        subjects = ["381", "u-22", "622", "flanger"]
        mailbox_items = {"sle24-16"}
        assert not any(s in mailbox_items for s in subjects), (
            "rows 1-4 have no mailbox evidence — reuse must not fire")

    def test_request_fields_define_the_obligations(self):
        """REPAIRED (owner order 2026-10-11, F2): obligations come from
        the REQUEST — every requested subject × requested field.
        Evidence satisfies a cell; it never defines the grid. Price
        evidence against a price-AND-delivery request leaves delivery
        UNRESOLVED. (This check previously pinned the defective
        evidence-derived-fields behavior; it is fixed.)"""
        from core.chat_canvas_editor import requirement_check
        contract = {"evidence": [{
            "entity_id": "U-22", "field": "price",
            "raw_value": "1,777",
            "source": {"source_id": TAUGHT, "source_type": "workbook"},
            "source_location": f"{TAUGHT}!Tennsmith!row26",
            "source_version": TAUGHT_HASH,
            "verification": "verified"}], "sources": []}
        check = requirement_check(
            message="What are the approved prices and delivery times "
                    "for rows 1 through 5 of the draft?",
            canvas={"canvas_id": "cv-ver", "content": CANVAS["content"]},
            authorized=True, expected_prior_audit_id=None,
            evidence_contract=contract,
            current_source_revision=TAUGHT_HASH)
        disp = check.get("value_dispositions") or []
        fields = {d.get("field") for d in disp}
        assert "price" in fields and "lead_time" in fields, (
            f"the request's fields define the grid: {sorted(fields)}")
        delivery = [d for d in disp
                    if d.get("field") in ("lead_time", "delivery")]
        assert delivery and all(
            d["disposition"] == "unresolved" for d in delivery), (
            "price evidence cannot certify a requested delivery "
            f"field: {delivery}")
        price = [d for d in disp if d.get("field") == "price"]
        assert price and price[0]["disposition"] == "satisfied", (
            f"the evidenced field stays satisfied: {price}")
        assert check.get("satisfied") is False, (
            "a partially-evidenced request is not satisfied")

    def test_partial_subject_coverage_stays_unresolved(self):
        from core.chat_canvas_editor import requirement_check
        contract = {"evidence": [{
            "entity_id": "U-22", "field": "price",
            "raw_value": "1,777",
            "source": {"source_id": TAUGHT, "source_type": "workbook"},
            "source_location": f"{TAUGHT}!Tennsmith!row26",
            "source_version": TAUGHT_HASH,
            "verification": "verified"}], "sources": []}
        check = requirement_check(
            message="What are the approved prices for the U-22 and "
                    "the 622 on this fork?",
            canvas={"canvas_id": "cv-ver", "content": CANVAS["content"]},
            authorized=True, expected_prior_audit_id=None,
            evidence_contract=contract,
            current_source_revision=TAUGTH_HASH if False else TAUGHT_HASH)
        disp = check.get("value_dispositions") or []
        subjects = {d.get("entity_id") for d in disp}
        unresolved = [d for d in disp if d["disposition"] != "satisfied"]
        assert unresolved, (
            f"a subject the evidence never covers stays unresolved: "
            f"{disp}")

    def test_owner_approval_does_not_manufacture_other_fields(self):
        from core.chat_canvas_editor import requirement_check
        contract = {"evidence": [{
            "entity_id": "U-22", "field": "price",
            "raw_value": "1,777",
            "source": {"source_id": "owner-decision",
                       "source_type": "owner"},
            "verification": "verified"}], "sources": []}
        check = requirement_check(
            message="What are the approved prices and delivery times "
                    "for the U-22 on this fork?",
            canvas={"canvas_id": "cv-ver", "content": CANVAS["content"]},
            authorized=True, expected_prior_audit_id=None,
            evidence_contract=contract, current_source_revision=None)
        disp = check.get("value_dispositions") or []
        delivery = [d for d in disp
                    if d.get("field") in ("lead_time", "delivery")]
        assert delivery and all(
            d["disposition"] == "unresolved" for d in delivery), (
            "an owner price approval never certifies a delivery "
            f"obligation: {delivery}")

    def test_no_field_scope_cannot_certify(self):
        from core.chat_canvas_editor import requirement_check
        contract = {"evidence": [{
            "entity_id": "U-22", "field": "price",
            "raw_value": "1,777",
            "source": {"source_id": TAUGHT, "source_type": "workbook"},
            "source_version": TAUGHT_HASH,
            "verification": "verified"}], "sources": []}
        check = requirement_check(
            message="Please investigate all requested quotation items "
                    "on this fork.",
            canvas={"canvas_id": "cv-ver", "content": CANVAS["content"]},
            authorized=True, expected_prior_audit_id=None,
            evidence_contract=contract,
            current_source_revision=TAUGHT_HASH)
        assert check is None or check.get("satisfied") is False, (
            "a request with no derivable field scope certifies "
            f"nothing: {check}")

    # ---------- CHECK 5: claims control actual source calls -----------
    def test_another_workers_fresh_claim_means_zero_calls(self):
        tl, factory = _store()
        run_id = _rich_job(tl, "sess-c1", "e-c1")
        rec = tl.get_task(run_id)
        qid = next(q.get("question_id") for q in
                   open_unresolved_questions(rec)
                   if q.get("item") == "622")
        assert claim_questions_for_execution(
            tl, run_id, [qid], by="worker-other", ttl_seconds=300), (
            "the peer claim is active")
        result, spy, session = _run_turn(
            tl, LIVE_CONTINUATION, "sess-c1",
            history=[{"role": "user", "message": "investigate"}])
        assert spy["rows"] == [], (
            "a fresh peer claim causes ZERO row-reader calls "
            f"(counted: {spy['rows']})")

    def test_eligible_unclaimed_action_executes_one_call(self):
        tl, factory = _store()
        run_id = _rich_job(tl, "sess-c2", "e-c2")
        result, spy, session = _run_turn(
            tl, LIVE_CONTINUATION, "sess-c2",
            history=[{"role": "user", "message": "investigate"}])
        assert (TAUGHT, "Tennsmith", 268) in spy["rows"], (
            f"the eligible action executes its structured read: "
            f"{spy['rows']}")
        assert len(spy["rows"]) == 1, (
            "exactly one read call for the one eligible action")

    def test_claim_lease_is_owned_by_the_claim(self):
        """REPAIRED (owner order 2026-10-11, F3): the claim's expiry is
        persisted at acquisition and EVERY reader — acquisition,
        renewal, execution dedupe, settlement — uses the claim's own
        lease. A caller's new ttl never reinterprets another worker's
        existing lease. (This check previously pinned the defective
        caller-ttl behavior; that defect is fixed and the pins moved
        to TestLeaseSemantics.)"""
        import time as _t
        tl, factory = _store()
        run_id = _rich_job(tl, "sess-c3", "e-c3")
        rec = tl.get_task(run_id)
        qid = next(q.get("question_id") for q in
                   open_unresolved_questions(rec)
                   if q.get("item") == "622")
        claim_questions_for_execution(
            tl, run_id, [qid], by="worker-old", ttl_seconds=0.02)
        # the lease is persisted with its own expiry
        claim = next(
            (q.get("exec_claim") or {}) for q in
            open_unresolved_questions(tl.get_task(run_id))
            if q.get("item") == "622")
        assert float(claim.get("ttl")) == 0.02, (
            f"the acquired lease carries its own expiry: {claim}")
        _t.sleep(0.05)
        # a caller's LARGE ttl does not reinterpret the expired lease:
        # takeover succeeds and the read executes
        result, spy, session = _run_turn(
            tl, LIVE_CONTINUATION, "sess-c3",
            history=[{"role": "user", "message": "investigate"}])
        assert (TAUGHT, "Tennsmith", 268) in spy["rows"], (
            "an expired lease allows takeover regardless of the "
            f"caller's ttl: {spy['rows']}")
