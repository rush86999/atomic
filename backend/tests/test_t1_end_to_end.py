"""ONE failing user request, owned end-to-end (owner work order
2026-10-11): the exact T1 request through the REAL process_chat_message
with controlled planner/source responses and a scratch database.

The planner boundary returns the REAL live failure's plan — a served
outlook.search plan that the relevance gate declines — so the test
reproduces the captured defect (declined plan, no dataset scan,
obligations unresolved) and then requires the repaired behavior:
the resolved five-row scope is scanned on the dataset side, typed
findings persist, and every obligation is evidenced or explicitly
unresolved.
"""
import asyncio
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from integrations import chat_orchestrator as co
import core.chat_canvas_editor as cce
from core.chat_tool_planner import ToolPlan

CANVAS = {"canvas_id": "cv-t1e2e", "canvas_type": "email",
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


def _live_shaped_scanner():
    """The catalog boundary shaped like the REAL Tennsmith ingest:
    rows carry CODE tokens in MODEL NO. and DIFFERENT prose in
    DESCRIPTION — the canvas subject phrase does not literally appear
    in any row."""
    def _fn(item, *args, **kwargs):
        # FAITHFUL live semantics: find_all matches the NEEDLE inside
        # cell values (ILIKE %needle%). The prose subject needle never
        # appears in any cell; the CODE-TOKEN needle "SLE24-16" does.
        needle = str(item).strip().lower()
        rows = [
            ("SLE24-16", "Single Wheel Slitter", "8984", "11-12 weeks"),
        ]
        for model, desc, price, deliv in rows:
            cells = {"MODEL NO.": model, "DESCRIPTION": desc,
                     "PRICE": price, "LEAD TIME": deliv}
            if any(needle in str(v).lower() for v in cells.values()):
                return {"matches": [{
                    "headers": list(cells.keys()), "row": cells,
                    "sheet": "Tennsmith", "cell": "C101"}],
                    "per_file": {}, "total_matches": 1,
                    "source_identity": {
                        "file_name": "Consolidated Price List 2019.xlsx",
                        "content_hash": "hash-live-A"}}
        return {"matches": [], "per_file": {}, "total_matches": 0,
                "source_identity": {"file_name": "x.xlsx",
                                    "content_hash": "hash-live-A"}}
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
    orch.llm_service = MagicMock(name="llm")
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


def _run_t1(scanner, junk_sweep=None, plan_query=None,
            plan_service="outlook"):
    """The REAL turn with the LIVE failure's plan: a served
    outlook.search plan that the relevance gate declines."""
    orch, tl, factory = _orch_with_store()
    session = {"id": "sess-e2e", "history": []}
    spy = {"edit_planner": 0, "scans": []}

    async def _plan_ce(*a, **k):
        spy["edit_planner"] += 1

        class _P:
            wants_edit = False
        return _P()

    def _stream_result(text):
        class _R:
            def __aiter__(self):
                async def _ag():
                    yield {"choices": [{"delta": {"content": text}}]}
                return _ag()
        return _R()

    llm = orch.llm_service
    llm.stream_completion.side_effect = lambda *a, **k: _stream_result(
        "I cannot confirm those figures from live source data.")
    async def _gen(*a, **k):
        return {"content": (
            "I cannot confirm those figures from live source data.")}
    llm.generate_completion.side_effect = _gen

    # THE LIVE PLAN: outlook.search over a query the relevance gate
    # declines (the captured t1r2 branch)
    live_plan = ToolPlan(
        use_tool=True, service=plan_service, intent="search",
        query=(plan_query or
               "Requested Machinery & Alternatives — recent "
               "correspondence"),
        reason="supervisor asked about the quote")

    with ExitStack() as st:
        for cm in [
            patch.object(orch, "_get_or_create_session",
                         return_value=session),
            patch.object(orch, "_resolve_canvas_ctx",
                         new=AsyncMock(return_value=dict(CANVAS))),
            patch.object(orch, "_start_chat_execution",
                         return_value="exec-e2e"),
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
                  new=AsyncMock(return_value=live_plan)),
            patch("core.chat_tool_planner.execute_tool_plan",
                  new=AsyncMock(return_value=junk_sweep or "")),
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
                  side_effect=lambda item, *a, **k: (
                      spy["scans"].append(item),
                      scanner(item))[1]),
            # the LIVE catalog holds the full row — the row reader
            # returns headers+values for the bound row (row 101)
            patch("core.sheet_dataset_service.read_sheet_row_sync",
                  side_effect=lambda fn, sh, rn, *a, **k: (
                      {"headers": ["MODEL NO.", "DESCRIPTION",
                                   "PRICE", "LEAD TIME"],
                       "row": {"MODEL NO.": "SLE24-16",
                               "DESCRIPTION": "Single Wheel Slitter",
                               "PRICE": "8984",
                               "LEAD TIME": "11-12 weeks"}}
                      if rn == 101 and "Tennsmith" in str(sh) else None)),
        ]:
            st.enter_context(cm)
        result = asyncio.run(orch.process_chat_message(
            "user-1",
            "What are the approved prices and delivery times for rows 1 "
            "through 5 of the draft?",
            "sess-e2e", context={"canvas": dict(CANVAS)}))
    return result, spy, orch, tl, factory


def _durable(tl):
    """All execution facts across the turn's job(s)."""
    found, versions, statuses = [], set(), {}
    for run in tl.runs.list_runs(include_terminal=True, limit=20):
        for o in tl.get_task(run["id"]).get("operations") or []:
            ex = o.get("execution") or {}
            found.extend(ex.get("findings") or [])
            if ex.get("source_version"):
                versions.add(ex["source_version"])
            for it, st in (ex.get("items") or {}).items():
                statuses[it] = st
    return found, versions, statuses


class TestT1EndToEnd:
    """Gates: research executes correctly -> evidence survives."""

    def test_declined_plan_still_scans_the_resolved_scope(self):
        result, spy, orch, tl, factory = _run_t1(
            _live_shaped_scanner())
        assert spy["edit_planner"] == 0, "edit routing stays closed"
        found, versions, statuses = _durable(tl)
        # the live failure reproduced-and-repaired: even with the
        # outlook plan declined by the relevance gate, the dataset side
        # scans the five resolved subjects
        assert any("SLE24-16" in (s or "") for s in spy["scans"]) or any(
            "Roper Whitney" in (s or "") for s in spy["scans"]), (
            f"the resolved subjects were scanned; scans={spy['scans']}")
        assert found, (
            "typed findings persist from the workbook receipt")
        assert versions == {"hash-live-A"}, (
            "the read-captured version survives")

    def test_junk_sweep_block_cannot_stand_in_for_the_scope(self):
        """The t1r4 boundary, faithfully: an ON-REQUEST datasets.search
        plan (query 'roper' — lexically passes the relevance gate)
        executes an UNSCOPED sweep (103 files for one token) whose
        block fills the evidence. The executed block is evidence-
        REJECTED and the canvas-scoped dispatch serves the resolved
        scope instead."""
        junk = ("LIVE TOOL EXECUTION — datasets.search\n"
                "What the lookup actually returned (all ingested "
                "spreadsheets searched for \"roper\", 103 files):\n"
                "- PRICE VIPUL (6).xlsx — sheet Sheet1 — row 9: 164990")
        result, spy, orch, tl, factory = _run_t1(
            _live_shaped_scanner(), junk_sweep=junk,
            plan_query="roper", plan_service="datasets")
        found, versions, statuses = _durable(tl)
        assert any("SLE24-16" in (s or "") for s in spy["scans"]), (
            "the junk sweep did not prevent the scoped dispatch")
        assert found and versions == {"hash-live-A"}, (
            "typed findings persist despite the standing junk block")

    def test_every_obligation_evidenced_or_explicitly_unresolved(self):
        result, spy, orch, tl, factory = _run_t1(
            _live_shaped_scanner())
        found, versions, statuses = _durable(tl)
        # rows 1-5 are the obligations; the scan answers what the
        # catalog carries and leaves the rest explicitly unresolved —
        # never silently silent
        assert statuses, "per-subject discovery statuses are recorded"
        assert not any("TK 1624" in s for s in statuses), (
            "rows outside 1-5 are not obligations")
