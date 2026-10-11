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
    """The original single-workbook shape (older tests): delegate to
    the two-workbook scanner's 2019 book."""
    base = _two_workbook_scanner()

    def _fn(item, *a, **k):
        k["file_name"] = "Consolidated Price List 2019.xlsx"
        return base(item, *a, **k)
    return _fn


def _two_workbook_scanner():
    """The owner acceptance shape (2026-10-11): TWO workbooks with
    different hashes. The OLDER 2015 ingest appears FIRST in broad
    scans; the DESIGNATED 2019 list is taught. find_all matches the
    NEEDLE inside cell values; the file_name filter (taught-first
    scans) restricts the search."""
    def _fn(item, user_id=None, workspace_id=None, file_name=None,
            max_matches=8):
        needle = str(item).strip().lower()
        # (file, sheet, cell, cells) — the 2015 row FIRST in broad scans
        books = [
            ("Consolidated Price List 2015.xlsx", "Sheet1", "B9", {
                "MODEL NO.": "SLE24-16", "DESCRIPTION":
                    "Single Wheel Slitter (2015)",
                "PRICE": "8659"}),
            ("Consolidated Price List 2019.xlsx", "Tennsmith", "C101", {
                "MODEL NO.": "SLE24-16",
                "DESCRIPTION": "Single Wheel Slitter",
                "LIST PRICE": "8984", "DEALER": "7100",
                "US NET": "8400", "LEAD TIME": ""}),
            ("Consolidated Price List 2019.xlsx", "Roper", "A12", {
                "PART NO.": "SCOTCH PART 003810",
                "DESCRIPTION": "Abrasive roll"}),  # 381 inside 003810
        ]
        out = []
        for fname, sheet, cell, cells in books:
            if file_name and fname != file_name:
                continue
            for col, v in cells.items():
                if needle and needle in str(v).lower():
                    out.append({"file": fname, "sheet": sheet,
                                "cell": cell, "column": col,
                                "value": str(v)})
        return {"matches": out[:max_matches], "per_file": {},
                "total_matches": len(out),
                "source_identity": {
                    "file_name": (out[0]["file"] if out
                                  else (file_name or "x.xlsx")),
                    "content_hash": {
                        "Consolidated Price List 2015.xlsx":
                            "hash-2015",
                        "Consolidated Price List 2019.xlsx":
                            "hash-2019"}.get(
                        out[0]["file"] if out else "",
                        "hash-unknown")}}
    return _fn


_DESIGNATED_LESSON = [{
    "id": "L-taught",
    "lesson": ("Always price quotes from the Consolidated Price List "
               "2019.xlsx — the 2015 list is outdated."),
}]


def _row_reader_two_books():
    def _fn(fname, sheet, row_number, *a, **k):
        if fname == "Consolidated Price List 2019.xlsx" and \
                sheet == "Tennsmith" and row_number == 101:
            return {"headers": ["MODEL NO.", "DESCRIPTION",
                                "LIST PRICE", "DEALER", "US NET",
                                "LEAD TIME"],
                    "row": {"MODEL NO.": "SLE24-16",
                            "DESCRIPTION": "Single Wheel Slitter",
                            "LIST PRICE": "8984", "DEALER": "7100",
                            "US NET": "8400", "LEAD TIME": ""},
                    "source": {"file_name": fname,
                               "content_hash": "hash-2019"}}
        if fname == "Consolidated Price List 2015.xlsx" and \
                row_number == 9:
            return {"headers": ["MODEL NO.", "DESCRIPTION", "PRICE"],
                    "row": {"MODEL NO.": "SLE24-16",
                            "DESCRIPTION":
                                "Single Wheel Slitter (2015)",
                            "PRICE": "8659"},
                    "source": {"file_name": fname,
                               "content_hash": "hash-2015"}}
        return None
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
            plan_service="outlook", row_reader=None, lessons=None,
            scanner_tracks_files=False):
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
            patch("core.student_learning_service.get_agent_lessons",
                  return_value=lessons or []),
            # the catalog's sheet resolution (the worker's own
            # mechanism): the taught sheet resolves to the materialized
            # 2015 copy
            patch("core.sheet_dataset_service.find_entries_sync",
                  side_effect=lambda sheet, *a, **k: (
                      [{"file_name": "Consolidated Price List 2015.xlsx"}]
                      if "tennsmith" in str(sheet).lower() else [])),
            patch("core.sheet_dataset_service."
                  "find_all_occurrences_sync",
                  side_effect=lambda item, *a, **k: (
                      spy["scans"].append(item),
                      scanner(item, *a, **k))[1] if scanner_tracks_files
                  else (spy["scans"].append(item), scanner(item))[1]),
            # the LIVE catalog holds the full row — the row reader
            # returns headers+values for the bound row (row 101)
            patch("core.sheet_dataset_service.read_sheet_row_sync",
                  side_effect=(row_reader or
                               (lambda fn, sh, rn, *a, **k: (
                                   {"headers": ["MODEL NO.",
                                                "DESCRIPTION",
                                                "PRICE", "LEAD TIME"],
                                    "row": {"MODEL NO.": "SLE24-16",
                                            "DESCRIPTION":
                                                "Single Wheel Slitter",
                                            "PRICE": "8984",
                                            "LEAD TIME": "11-12 weeks"},
                                    "source": {"file_name":
                                               "quote-workbook.xlsx",
                                               "content_hash":
                                               "hash-read-A"}}
                                   if rn == 101
                                   and "Tennsmith" in str(sh) else None)))),
        ]:
            st.enter_context(cm)
        result = asyncio.run(orch.process_chat_message(
            "user-1",
            "What are the approved prices and delivery times for rows 1 "
            "through 5 of the draft?",
            "sess-e2e", context={"canvas": dict(CANVAS),
                                 "agent_id": "agent-taught"}))
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
        assert "hash-read-A" in versions, (
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
        assert found and "hash-read-A" in versions, (
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


class TestSourceCorrectAssociations:
    """The owner's four corrections (2026-10-11): taught sources before
    broad discovery; per-finding source identity; the existing field
    binder + taught policy; identity corroboration. The acceptance
    shape: the OLDER workbook appears first, the DESIGNATED workbook
    is taught, multiple price columns, and an unrelated
    code-containing row."""

    def test_designated_source_selected_despite_older_first(self):
        result, spy, orch, tl, factory = _run_t1(
            _two_workbook_scanner(), row_reader=_row_reader_two_books(),
            lessons=_DESIGNATED_LESSON, scanner_tracks_files=True)
        found, versions, statuses = _durable(tl)
        sle = [f for f in found
               if "SLE24-16" in str(f.get("item") or "")]
        assert sle, "SLE24-16 evidenced"
        designated = [f for f in sle
                      if "2019" in str(f.get("source") or "")]
        assert designated and all(
            f.get("raw") == "8984" for f in designated), (
            "the DESIGNATED workbook's value wins even though the "
            f"2015 ingest appears first: "
            f"{[(f.get('source'), f.get('raw')) for f in sle]}")
        assert all(f.get("source_version") == "hash-2019"
                   for f in designated), (
            "each finding carries ITS OWN row-read's version")
        assert statuses.get("Tennsmith Slitter SLE24-16") == "matched", (
            "the designated-source binding certifies the subject")

    def test_price_candidates_preserved_until_policy_resolves(self):
        result, spy, orch, tl, factory = _run_t1(
            _two_workbook_scanner(), row_reader=_row_reader_two_books(),
            lessons=[], scanner_tracks_files=True)
        found, versions, statuses = _durable(tl)
        # CANDIDATE PRESERVATION (the worker's own policy record): the
        # narrowing evidence names the excluded cost-side columns —
        # they survive as recorded candidates, never silently picked
        all_evidence = []
        for run in tl.runs.list_runs(include_terminal=True, limit=20):
            for o in tl.get_task(run["id"]).get("operations") or []:
                all_evidence.extend(
                    str(e) for e in
                    (o.get("execution") or {}).get("evidence") or [])
        narrowed = [e for e in all_evidence
                    if "policy narrowed" in e or "cost-side" in e]
        assert narrowed, (
            "the multi-column price decision is RECORDED, not silently "
            "picked")
        sle_prices = [f for f in found
                      if "SLE24-16" in str(f.get("item") or "")
                      and f.get("field") == "price"]
        assert all(f.get("column") == "LIST PRICE"
                   for f in sle_prices if "2019" in str(
                       f.get("source") or "")), (
            "the selling-price scope excludes cost/net columns — the "
            f"first column is never blindly picked: "
            f"{[f.get('column') for f in sle_prices]}")

    def test_taught_basis_resolves_the_price_column(self):
        lessons = _DESIGNATED_LESSON + [{
            "id": "L-basis",
            "lesson": ("for quote prices always use the list price "
                       "column, never dealer or net"),
        }]
        result, spy, orch, tl, factory = _run_t1(
            _two_workbook_scanner(), row_reader=_row_reader_two_books(),
            lessons=lessons, scanner_tracks_files=True)
        found, versions, statuses = _durable(tl)
        sle_prices = [f for f in found
                      if "SLE24-16" in str(f.get("item") or "")
                      and f.get("field") == "price"
                      and "2019" in str(f.get("source") or "")]
        assert [f.get("column") for f in sle_prices] == ["LIST PRICE"], (
            "the taught basis selects the column")

    def test_code_inside_longer_part_number_never_certifies(self):
        result, spy, orch, tl, factory = _run_t1(
            _two_workbook_scanner(), row_reader=_row_reader_two_books(),
            lessons=_DESIGNATED_LESSON, scanner_tracks_files=True)
        found, versions, statuses = _durable(tl)
        # the canvas subject carries "No. 381"; the 2019 Roper sheet's
        # PART NO. is "SCOTCH PART 003810" — containment must not bind
        roper = [f for f in found
                 if "Roper" in str(f.get("item") or "")]
        assert not roper or all(
            "Roper" in str(f.get("source") or "")
            and "003810" not in str(f.get("raw") or "")
            for f in roper), (
            "a code inside a longer part number never certifies the "
            "subject")

    def test_missing_delivery_is_explicit_after_fresh_reload(self):
        result, spy, orch, tl, factory = _run_t1(
            _two_workbook_scanner(), row_reader=_row_reader_two_books(),
            lessons=_DESIGNATED_LESSON, scanner_tracks_files=True)
        found, versions, statuses = _durable(tl)
        sle = [f for f in found
               if "SLE24-16" in str(f.get("item") or "")]
        has_delivery = [f for f in sle if f.get("field") == "delivery"]
        # the designated row's LEAD TIME is EMPTY: the delivery
        # obligation stays explicitly unresolved — a price finding
        # alone never satisfies a price-and-delivery request
        assert not has_delivery or all(
            not str(f.get("raw") or "").strip() for f in has_delivery)
        assert statuses, "statuses recorded"
        with patch("integrations.chat_orchestrator."
                   "_task_lifecycle_for", return_value=tl):
            contract = orch._canvas_job_evidence_contract(
                {"canvas_id": "cv-t1e2e",
                 "content": CANVAS["content"]})
        if contract and contract.get("evidence"):
            delivery_rows = [e for e in contract["evidence"]
                             if e.get("field") == "delivery"
                             and "SLE24-16" in str(e.get("entity_id"))]
            assert not delivery_rows or all(
                not str(e.get("raw_value") or "").strip()
                for e in delivery_rows), (
                "no delivery value is invented for the empty cell")


class TestTaughtSheetResolution:
    """The CAPTURED live divergence (t1r6 replay, 2026-10-11): the
    teaching designates the source by WORKBOOK NAME + SHEET with no
    file extension ('the approved price basis is the Consolidated
    Price List 2019 workbook in Zoho WorkDrive, Tennsmith sheet'), the
    extension-keyed extractor found nothing, and the 2019 workbook is
    NOT in the catalog — only the 2015 copy (which carries the taught
    Tennsmith sheet). Faithful shape: lessons without extensions, the
    materialized 2015 copy, an ambiguous same-sheet copy, and a
    supplementary workbook containing the item."""

    def _lessons(self):
        return [
            {"id": "L-designate",
             "lesson": ("For Tennsmith machinery, the approved price "
                        "basis is the Consolidated Price List 2019 "
                        "workbook in Zoho WorkDrive, Tennsmith sheet — "
                        "read prices from that sheet.")},
        ]

    def _catalog_scanner(self):
        """The materialized catalog: the 2019 workbook is ABSENT; the
        2015 copy carries the taught Tennsmith sheet (whose row holds
        the subject); a second copy carries the same sheet name
        (ambiguity); a supplementary workbook contains the item."""
        def _fn(item, user_id=None, workspace_id=None, file_name=None,
                max_matches=8):
            needle = str(item).strip().lower()
            books = [
                ("Consolidated Price List 2015.xlsx", "Tennsmith",
                 "C338", {"MODEL NO.": "SLE24-16",
                          "DESCRIPTION": "Single Wheel Slitter",
                          "LIST PRICE": "8984"}),
                ("Roper Quote 2024.xlsx", "Tennsmith",
                 "D5", {"MODEL NO.": "SLE24-16",
                        "DESCRIPTION": "Slitter (quote draft)",
                        "PRICE": "7000"}),
            ]
            out = []
            for fname, sheet, cell, cells in books:
                if file_name and fname != file_name:
                    continue
                for col, v in cells.items():
                    if needle and needle in str(v).lower():
                        out.append({"file": fname, "sheet": sheet,
                                    "cell": cell, "column": col,
                                    "value": str(v)})
            return {"matches": out[:max_matches], "per_file": {},
                    "total_matches": len(out),
                    "source_identity": {
                        "file_name": (out[0]["file"] if out
                                      else (file_name or "x.xlsx")),
                        "content_hash": {
                            "Consolidated Price List 2015.xlsx":
                                "hash-materialized-2015",
                            "Roper Quote 2024.xlsx":
                                "hash-supplementary"}.get(
                            out[0]["file"] if out else "",
                            "hash-unknown")}}
        return _fn

    def _row_reader(self):
        def _fn(fname, sheet, row_number, *a, **k):
            if (fname == "Consolidated Price List 2015.xlsx"
                    and sheet == "Tennsmith" and row_number == 338):
                return {"headers": ["MODEL NO.", "DESCRIPTION",
                                    "LIST PRICE"],
                        "row": {"MODEL NO.": "SLE24-16",
                                "DESCRIPTION": "Single Wheel Slitter",
                                "LIST PRICE": "8984"},
                        "source": {"file_name": fname,
                                   "content_hash":
                                       "hash-materialized-2015"}}
            if (fname == "Roper Quote 2024.xlsx"
                    and row_number == 5):
                return {"headers": ["MODEL NO.", "DESCRIPTION",
                                    "PRICE"],
                        "row": {"MODEL NO.": "SLE24-16",
                                "DESCRIPTION": "Slitter (quote draft)",
                                "PRICE": "7000"},
                        "source": {"file_name": fname,
                                   "content_hash": "hash-supplementary"}}
            return None
        return _fn

    def _run(self):
        return _run_t1(
            self._catalog_scanner(), row_reader=self._row_reader(),
            lessons=self._lessons(), scanner_tracks_files=True)

    def test_taught_sheet_resolves_through_the_materialized_copy(self):
        result, spy, orch, tl, factory = self._run()
        found, versions, statuses = _durable(tl)
        sle = [f for f in found
               if "SLE24-16" in str(f.get("item") or "")]
        # the taught SHEET resolves to the materialized 2015 copy —
        # the workbook the teaching names (2019) is NOT in the catalog,
        # and that mismatch must be EXPLICIT on the record
        assert sle, "the subject binds through the taught sheet"
        assert all("2015" in str(f.get("source") or "")
                   for f in sle), (
            f"the served copy is the materialized one: "
            f"{[f.get('source') for f in sle]}")
        assert all(f.get("source_version") == "hash-materialized-2015"
                   for f in sle), (
            "each finding carries its own read's version")
        # the supplementary workbook's cheaper value must NOT satisfy:
        # its 7000 price never becomes the designated finding
        assert not any(f.get("raw") == "7000" for f in sle), (
            "supplementary evidence cannot satisfy the designated "
            "obligation")

    def test_the_taught_name_mismatch_is_explicit(self):
        result, spy, orch, tl, factory = self._run()
        found, versions, statuses = _durable(tl)
        sle = [f for f in found
               if "SLE24-16" in str(f.get("item") or "")]
        assert sle and all(
            f.get("taught_source_mismatch") for f in sle), (
            "serving the 2015 copy for a 2019-designated obligation is "
            "RECORDED as a mismatch, never silent")
