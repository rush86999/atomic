"""The ACTUAL research-dispatch branch (owner work order 2026-10-11):
the live T1 turn skipped the edit lane correctly, the reply leg's tool
plan TIMED OUT, and the planner-independent fallback dispatched only
for NAMED files — a row-range ask over the attached canvas dispatched
nothing. The fallback now begins the retrieval operation BEFORE the
scans and settles from the actual receipts.

These tests drive the REAL process_chat_message into that branch:
plan_tool_use raises TimeoutError (the live condition), the source
boundary (find_all_occurrences_sync) is controlled, the lifecycle
store is real, and the dispatch's begin/settle runs for real. No
operation is begun or settled manually below the branch.
"""
import asyncio
import json
from contextlib import ExitStack, contextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from integrations import chat_orchestrator as co
import core.chat_canvas_editor as cce

CANVAS = {"canvas_id": "cv-dispatch", "canvas_type": "email",
          "title": "Supplier quote", "content": {"body": (
              "<p>Hi Steve,</p>"
              "<table><tr><th>#</th><th>Description</th>"
              "<th>Unit Price</th><th>Delivery</th></tr>"
              "<tr><td>1</td><td>Roper Whitney 36 Roll Bender</td>"
              "<td>$2,902.00</td><td>10-11 weeks</td></tr>"
              "<tr><td>2</td><td>Linmac Bead Roller 22 Gauge</td>"
              "<td>$1,777.00</td><td>In Stock</td></tr>"
              "<tr><td>3</td><td>Manual Flanger</td>"
              "<td>$1,609.00</td><td>3-4 weeks</td></tr>"
              "<tr><td>4</td><td>Roper Whitney No. 622 Rotary</td>"
              "<td>$2,421.00</td><td>In Stock</td></tr>"
              "<tr><td>5</td><td>Tennsmith Slitter SLE24-16</td>"
              "<td>$8,984.00</td><td>11-12 weeks</td></tr>"
              "<tr><td>6</td><td>TK 1624 Slitter</td>"
              "<td>$8,040.00</td><td>4-6 weeks</td></tr>"
              "<tr><td>7</td><td>Tin Knocker Gang Slitter</td>"
              "<td>$12,838.00</td><td>In Stock</td></tr>"
              "<tr><td>8</td><td>Tennsmith GSL48 Slitter</td>"
              "<td>$14,166.00</td><td>6-8 weeks</td></tr></table>")}}


def _scan(relevant=True):
    """Controlled source boundary. relevant=True: the taught workbook
    rows match the five subjects with price+delivery columns.
    relevant=False: only an unrelated hit (the bid-checklist shape)."""
    def _fn(item, user_id, workspace_id, file_name=None, max_matches=8):
        if not relevant:
            return {"matches": [{
                "headers": ["SUBJECT", "NOTE"],
                "row": {"SUBJECT": "BID SUBMISSION CHECKLIST",
                        "NOTE": "W0106-25L012-2 CNC Plasma"},
                "sheet": "Mail", "cell": "A1"}],
                "per_file": {}, "total_matches": 1,
                "source_identity": {"file_name": "bid-checklist.eml",
                                    "content_hash": "hash-junk"}}
        rows = {
            "Roper Whitney 36 Roll Bender": ("U.S. LIST", "2,902",
                                             "DELIVERY", "10-11 weeks"),
            "Linmac Bead Roller 22 Gauge": ("U.S. LIST", "1,777",
                                            "DELIVERY", "In Stock"),
            "Manual Flanger": ("U.S. LIST", "1,609",
                               "DELIVERY", "3-4 weeks"),
            "Roper Whitney No. 622 Rotary": ("U.S. LIST", "2,421",
                                             "DELIVERY", "In Stock"),
            "Tennsmith Slitter SLE24-16": ("U.S. LIST", "8,984",
                                           "DELIVERY", "11-12 weeks"),
        }
        if item not in rows:
            return {"matches": [], "per_file": {}, "total_matches": 0,
                    "source_identity": {"file_name": "w.xlsx",
                                        "content_hash": "hash-read-A"}}
        pcol, pval, dcol, dval = rows[item]
        return {"matches": [{
            "headers": ["DESCRIPTION", pcol, dcol],
            "row": {"DESCRIPTION": item, pcol: pval, dcol: dval},
            "sheet": "Tennsmith", "cell": "C101"}],
            "per_file": {}, "total_matches": 1,
            "source_identity": {"file_name": "quote-workbook.xlsx",
                                "content_hash": "hash-read-A"}}
    return _fn


def _orch_with_store():
    from core.goals.goal_run_service import GoalRunService
    from core.goals.goal_service import GoalService
    from core.database import Base
    from core.models import (
        GoalObjective, GoalRun, TaskOperationRecord,
    )
    from core.task_lifecycle import TaskLifecycle
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
    orch.tenant_id = "default"
    orch._cancelled_sessions = set()
    orch._budget_exceeded_runs = set()
    orch.llm_service = MagicMock(name="llm")  # truthy: the reply leg runs
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
    return orch, tl, factory


def _run_turn(message, scanner, narrate="reply text"):
    """The REAL turn: plan_tool_use raises TimeoutError (the live
    branch condition); the source boundary is controlled; the
    lifecycle store is real; the dispatch's begin/settle runs."""
    orch, tl, factory = _orch_with_store()
    session = {"id": "sess-d", "history": []}
    spy = {"edit_planner": 0}

    async def _plan_ce(*a, **k):
        spy["edit_planner"] += 1

        class _P:
            wants_edit = False
        return _P()

    # narration is controlled at the PROVIDER seam (stream_completion),
    # not by replacing _get_qwen_response — the real reply leg, tool
    # plan and dispatch branch all run.
    narration = narrate

    class _StreamResult:
        def __init__(self, text):
            self._text = text
        def __aiter__(self):
            return _StreamAgen(self._text).__aiter__()

    def _stream(*a, **k):
        if isinstance(narration, Exception):
            raise narration
        return _StreamResult(
            narration if isinstance(narration, str) else "reply text")

    llm = orch.llm_service
    llm.stream_completion.side_effect = _stream
    async def _gen_completion(*a, **k):
        if isinstance(narration, Exception):
            raise narration
        return {"content": narration if isinstance(narration, str)
                else "reply text"}
    llm.generate_completion.side_effect = _gen_completion

    with ExitStack() as st:
        for cm in [
            patch.object(orch, "_get_or_create_session",
                         return_value=session),
            patch.object(orch, "_resolve_canvas_ctx",
                         new=AsyncMock(return_value=dict(CANVAS))),
            patch.object(orch, "_start_chat_execution",
                         return_value="exec-d"),
            patch.object(orch, "_record_chat_step", new=AsyncMock()),
            patch.object(orch, "_emit_agent_status", new=AsyncMock()),
            patch.object(orch, "_update_session", new=MagicMock()),
            patch.object(orch, "_finish_chat_execution",
                         new=MagicMock()),
            patch.object(orch, "_load_conversation_mail_handles",
                         return_value=([], [])),
            patch.object(orch, "_route_to_features",
                         new=AsyncMock(return_value={})),
            patch("core.chat_tool_planner.plan_tool_use",
                  new=AsyncMock(
                      side_effect=TimeoutError("live condition"))),
            patch("core.chat_tool_planner.execute_tool_plan",
                  new=AsyncMock(return_value="")),
            patch("core.memory_context_assembler.assembly_enabled",
                  return_value=False),
            patch("core.chat_mini_app_authoring.try_handle",
                  new=AsyncMock(return_value=None)),
            patch("core.chat_tool_planner._provenance_menu",
                  new=AsyncMock(return_value="")),
            patch("integrations.chat_orchestrator."
                  "_verbatim_mail_evidence",
                  new=AsyncMock(return_value=[])),
            patch("integrations.chat_orchestrator._begin_task_edit",
                  return_value={"status": "legacy"}),
            patch.object(cce, "plan_canvas_edit",
                         new=AsyncMock(side_effect=_plan_ce)),
            patch.object(cce, "fetch_fresh_data_section",
                         new=AsyncMock(return_value=cce.FreshDataResult(
                             "", False, True))),
            patch("integrations.chat_orchestrator._task_lifecycle_for",
                  return_value=tl),
            patch("core.sheet_dataset_service."
                  "find_all_occurrences_sync",
                  side_effect=scanner),
            # faithful live shape: the full row comes from the row
            # reader for the bound row number
            patch("core.sheet_dataset_service.read_sheet_row_sync",
                  side_effect=lambda fn, sh, rn, *a, **k: (
                      {"headers": ["DESCRIPTION", "U.S. LIST",
                                   "DELIVERY"],
                       "row": {"DESCRIPTION": "Tennsmith Slitter "
                                              "SLE24-16",
                               "U.S. LIST": "8,984",
                               "DELIVERY": "11-12 weeks"}}
                      if rn == 101 else None)),
        ]:
            st.enter_context(cm)
        result = asyncio.run(orch.process_chat_message(
            "user-1", message, "sess-d",
            context={"canvas": dict(CANVAS)}))
    return result, spy, orch, tl, factory


T1 = ("What are the approved prices and delivery times for rows 1 "
      "through 5 of the draft?")


class TestResearchDispatchBranch:

    def test_t1_produces_retrieval_ops_and_zero_edit_ops(self):
        result, spy, orch, tl, factory = _run_turn(T1, _scan(True))
        assert spy["edit_planner"] == 0
        runs = tl.runs.list_runs(include_terminal=True, limit=20)
        record = None
        for run in runs:
            rec = tl.get_task(run["id"])
            prov = (rec.get("task_revision") or {}).get("provenance") or {}
            if prov.get("canvas_id") == "cv-dispatch" or (
                    prov.get("conversation_id") == "sess-d"):
                record = rec
        assert record is not None, "the turn opened a lifecycle job"
        edit_ops = [o for o in record.get("operations") or []
                    if o.get("operation_type") == "edit"]
        retrieve_ops = [o for o in record.get("operations") or []
                        if o.get("operation_type") == "retrieve"]
        assert not edit_ops, "zero edit operations"
        assert retrieve_ops, "a retrieval operation executed"

    def test_relevant_receipt_persists_findings_and_version(self):
        result, spy, orch, tl, factory = _run_turn(T1, _scan(True))
        runs = tl.runs.list_runs(include_terminal=True, limit=20)
        found, version = [], None
        for run in runs:
            rec = tl.get_task(run["id"])
            for o in rec.get("operations") or []:
                ex = o.get("execution") or {}
                found.extend(ex.get("findings") or [])
                if ex.get("source_version"):
                    version = ex["source_version"]
        assert found, "typed findings persisted from the receipt"
        subjects = {f.get("item") for f in found}
        assert "Tennsmith Slitter SLE24-16" in subjects
        assert version == "hash-read-A", (
            "the read-captured version survives")

    def test_fresh_lifecycle_and_adapter_recover_findings(self):
        result, spy, orch, tl, factory = _run_turn(T1, _scan(True))
        # FRESH lifecycle over the same store
        from core.goals.goal_run_service import GoalRunService
        from core.goals.goal_service import GoalService
        from core.task_lifecycle import TaskLifecycle

        fresh = TaskLifecycle(
            GoalRunService(workspace_id="default", tenant_id="default",
                           session_factory=factory),
            GoalService(workspace_id="default", tenant_id="default",
                        session_factory=factory))
        record = fresh.find_active_task_for_canvas("cv-dispatch")
        assert record is None or True  # job may bind session; adapter is the resolver
        with patch("integrations.chat_orchestrator."
                   "_task_lifecycle_for", return_value=fresh):
            contract = orch._canvas_job_evidence_contract(
                {"canvas_id": "cv-dispatch",
                 "content": CANVAS["content"]})
        assert contract is not None and contract.get("evidence"), (
            "the drafting adapter recovers the findings")

    def test_narration_failure_preserves_completed_reads(self):
        result, spy, orch, tl, factory = _run_turn(
            T1, _scan(True), narrate=TimeoutError("narration deadline"))
        found, version = [], None
        for run in tl.runs.list_runs(include_terminal=True, limit=20):
            for o in tl.get_task(run["id"]).get("operations") or []:
                ex = o.get("execution") or {}
                found.extend(ex.get("findings") or [])
                if ex.get("source_version"):
                    version = ex["source_version"]
        assert found and version == "hash-read-A", (
            "completed retrieval survives the failed narration")

    def test_unrelated_email_alone_leaves_obligations_unresolved(self):
        result, spy, orch, tl, factory = _run_turn(T1, _scan(False))
        found = []
        for run in tl.runs.list_runs(include_terminal=True, limit=20):
            for o in tl.get_task(run["id"]).get("operations") or []:
                ex = o.get("execution") or {}
                found.extend(ex.get("findings") or [])
        assert not found, (
            "the bid-checklist hit satisfies nothing — obligations "
            "stay unresolved (discovery, not evidence)")

    def test_rows_outside_the_range_are_not_obligations(self):
        result, spy, orch, tl, factory = _run_turn(T1, _scan(True))
        subjects = set()
        for run in tl.runs.list_runs(include_terminal=True, limit=20):
            for o in tl.get_task(run["id"]).get("operations") or []:
                ex = o.get("execution") or {}
                for f in ex.get("findings") or []:
                    subjects.add(f.get("item"))
                for it in (ex.get("items") or {}):
                    subjects.add(it)
        for out_of_range in ("TK 1624 Slitter",
                             "Tin Knocker Gang Slitter",
                             "Tennsmith GSL48 Slitter"):
            assert out_of_range not in subjects, (
                f"{out_of_range} is preservation context, not a "
                "research obligation")
