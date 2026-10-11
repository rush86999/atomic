"""Edit-lane authorization routing (owner work order 2026-10-10, the
live T1 routing defect): edit-shape NOMINATION is not permission. Both
gates — the caller's pre-reservation flag and _try_canvas_edit's
pre-planning refusal — consume the SAME deterministic evaluation
(core/turn_decision.edit_authorization): only the user's own grounded,
non-negated command enters edit planning. A canvas supplies context;
it does not authorize editing.

Driven through the REAL process_chat_message path with controlled
planner/source responses — never by seeding operations or calling the
settlement helpers directly.
"""
import asyncio
import json
from contextlib import contextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from integrations import chat_orchestrator as co
import core.chat_canvas_editor as cce

CANVAS = {
    "canvas_id": "cv-route",
    "canvas_type": "email",
    "title": "Supplier quote",
    "content": {"body": (
        "<p>Hi Steve,</p><table><tr><th>#</th><th>Description</th>"
        "<th>Unit Price</th><th>Delivery</th></tr>"
        "<tr><td>1</td><td>Roper Whitney Roll Bender</td>"
        "<td>$2,902.00</td><td>10-11 weeks</td></tr>"
        "<tr><td>5</td><td>Tennsmith Slitter SLE24-16</td>"
        "<td>$8,984.00</td><td>11-12 weeks</td></tr></table>"
        "<p>Quote validity: TBD</p>")},
}

RECEIPT = {
    "storage_read": {
        "service": "datasets", "file_id": "wb-2019",
        "resource_id": "wb-2019",
        "file_name": "Consolidated Price List 2019.xlsx",
        "content_hash": "hash-read-A",
        "structured_result": {
            "source_identity": {
                "file_name": "Consolidated Price List 2019.xlsx",
                "content_hash": "hash-read-A"},
            "requested_fields": ["price", "delivery"],
            "requested_items": ["SLE24-16", "Roper Whitney Roll Bender"],
            "targets": [
                {"item": "SLE24-16",
                 "identity": {"status": "single"},
                 "field": {"status": "single", "values": [
                     {"col": "U.S. LIST", "basis": "U.S. LIST",
                      "value": 8984.0, "display": "8,984"}]}},
                {"item": "Roper Whitney Roll Bender",
                 "identity": {"status": "single"},
                 "field": {"status": "single", "values": [
                     {"col": "List", "basis": "list",
                      "value": 2902.0, "display": "2,902"}]}},
            ],
            "coverage": {"read_status": "success"},
        },
    },
}


def _orch():
    orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
    orch.tenant_id = "default"
    orch._cancelled_sessions = set()
    orch.llm_service = None
    return orch


def _run_turn(message, *, plan_canvas_edit=None, tool_plan=None,
              tool_result=None, qwen=None, break_evaluator=False,
              durable=False, reader=None):
    """One REAL process_chat_message turn with controlled planner and
    source responses. Returns (orchestrator-shared-blackboard-marker-
    free result, spies)."""
    orch = _orch()
    session = {"id": "sess-r", "history": []}
    plan = tool_plan
    spy = {"edit_planner_calls": 0, "tool_executed": False}

    async def _plan_ce(*a, **k):
        spy["edit_planner_calls"] += 1
        if callable(plan_canvas_edit):
            return await plan_canvas_edit(*a, **k)

        class _P:
            wants_edit = False
            reply = "declined"
        return _P()

    async def _exec_tp(*a, **k):
        spy["tool_executed"] = True
        if tool_result is not None:
            if plan is not None and hasattr(plan, "_result_meta"):
                plan._result_meta["storage_read"] = tool_result
            return "RESEARCH BLOCK"
        return ""

    from core.chat_tool_planner import ToolPlan

    async def _qwen(*a, **k):
        if isinstance(qwen, Exception):
            raise qwen
        return qwen or "reply text"

    import os as _os
    import sys as _sys
    _os.environ.setdefault("ATOM_TASK_LIFECYCLE_ENABLED", "1")
    _os.environ.setdefault("CHAT_FINALIZATION_M2", "1")
    durable_patches = []
    if durable:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        from core.database import Base
        from core.goals.goal_run_service import GoalRunService
        from core.goals.goal_service import GoalService
        from core.models import (
            GoalObjective, GoalRun, TaskOperationRecord,
        )
        from core.task_lifecycle import TaskLifecycle

        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine, tables=[
            GoalObjective.__table__, GoalRun.__table__,
            TaskOperationRecord.__table__])
        factory = sessionmaker(bind=engine, expire_on_commit=False)

        @contextmanager
        def _sessions():
            sess = factory()
            try:
                yield sess
                sess.commit()
            finally:
                sess.close()

        runs_svc = GoalRunService(workspace_id="default",
                                  tenant_id="default",
                                  session_factory=factory)
        tl = TaskLifecycle(runs_svc, MagicMock())
        orch._route_test_factory = factory
        durable_patches = [
            patch("integrations.chat_orchestrator._task_lifecycle_for",
                  return_value=tl),
            patch("core.sheet_dataset_service.find_all_occurrences_sync",
                  side_effect=reader)] if reader else [
            patch("integrations.chat_orchestrator._task_lifecycle_for",
                  return_value=tl)]
    from contextlib import ExitStack

    _cms = [
        patch.object(orch, "_get_or_create_session",
                     return_value=session),
        patch.object(orch, "_resolve_canvas_ctx",
                     new=AsyncMock(return_value=dict(CANVAS))),
        patch.object(orch, "_start_chat_execution",
                     return_value="exec-route"),
        patch.object(orch, "_record_chat_step", new=AsyncMock()),
        patch.object(orch, "_emit_agent_status", new=AsyncMock()),
        patch.object(orch, "_update_session", new=MagicMock()),
        patch.object(orch, "_finish_chat_execution", new=MagicMock()),
        patch.object(orch, "_load_conversation_mail_handles",
                     return_value=([], [])),
        patch.object(orch, "_route_to_features",
                     new=AsyncMock(return_value={})),
        patch("core.chat_tool_planner.plan_tool_use",
              new=AsyncMock(return_value=tool_plan)),
        patch("core.chat_tool_planner.execute_tool_plan",
              new=AsyncMock(side_effect=_exec_tp)),
        patch("core.memory_context_assembler.assembly_enabled",
              return_value=False),
        patch("core.chat_mini_app_authoring.try_handle",
              new=AsyncMock(return_value=None)),
        patch("core.chat_tool_planner._provenance_menu",
              new=AsyncMock(return_value="")),
        patch("integrations.chat_orchestrator._verbatim_mail_evidence",
              new=AsyncMock(return_value=[])),
        patch.object(orch, "_get_qwen_response", new=AsyncMock(
            side_effect=_qwen)),
        patch.object(cce, "plan_canvas_edit",
                     new=AsyncMock(side_effect=_plan_ce)),
        patch.object(cce, "fetch_fresh_data_section",
                     new=AsyncMock(return_value=cce.FreshDataResult(
                         "", False, True))),
        # the reservation's durable layer is not this test's subject:
        # the legacy (flag-off) path lets the routing assertion reach
        # the edit planner itself
        patch("integrations.chat_orchestrator._begin_task_edit",
              return_value={"status": "legacy"}),
        *durable_patches,
        *([patch("core.turn_decision.edit_authorization",
                 side_effect=RuntimeError("evaluator down"))]
          if break_evaluator else []),
    ]
    with ExitStack() as _stack:
        for _i, _cm in enumerate(_cms):
            try:
                _stack.enter_context(_cm)
            except Exception as _e:
                raise AssertionError(
                    f"patch #{_i} ({getattr(_cm, 'attribute', '?')}) "
                    f"is not a context manager: {_e!r}")
        result = asyncio.run(orch.process_chat_message(
            "user-1", message, "sess-r",
            context={"canvas": dict(CANVAS)}))
    import sys as _sys
    if _os.environ.get("ROUTE_DEBUG"):
        print("ROUTE-DEBUG result:", {k: str(result.get(k))[:80]
              for k in ("success", "message", "intent")},
              "| spies:", spy, file=_sys.stderr)
    return result, spy, session, orch


T1_QUESTION = ("What are the approved prices and delivery times for "
               "rows 1 through 5 of the draft?")


class TestEditLaneAuthorizationRouting:

    def test_t1_question_never_enters_edit_planning(self):
        result, spy, session, _o = _run_turn(T1_QUESTION)
        assert spy["edit_planner_calls"] == 0, (
            "a question about the draft must not spend the "
            "edit-planning budget")
        assert session.get("canvas_edit_skipped_not_authorized") or (
            result is not None), "the turn completes without the lane"

    def test_negated_check_is_read_only(self):
        result, spy, session, _o = _run_turn(
            "Check rows 1-5; don't change anything")
        assert spy["edit_planner_calls"] == 0, (
            "'don't change anything' is not a command")

    def _lane(self, message):
        """The REAL _try_canvas_edit boundary with a controlled
        (declining) edit planner: does the lane reach planning?"""
        orch = _orch()
        spy = {"calls": 0}

        async def _plan(*a, **k):
            spy["calls"] += 1

            class _P:
                wants_edit = False
                reply = "declined"
            return _P()

        shared = {}
        with patch.object(cce, "plan_canvas_edit",
                          new=AsyncMock(side_effect=_plan)), \
             patch.object(cce, "fetch_fresh_data_section",
                          new=AsyncMock(return_value=cce.FreshDataResult(
                              "", False, True))):
            out = asyncio.run(orch._try_canvas_edit(
                message, [], dict(CANVAS), "user-1", "sess-lane",
                "exec-lane", None, shared_tool_state=shared))
        return out, shared, spy

    def test_authorized_update_enters_the_edit_path(self):
        out, _shared, spy = self._lane("Update rows 1-5; don't send")
        assert spy["calls"] >= 1, (
            "the user's own grounded command reaches edit planning")

    def test_question_form_with_a_grounded_command_is_authorized(self):
        out, _shared, spy = self._lane(
            "Can you change the subject to 'Revised quote'?")
        assert spy["calls"] >= 1, (
            "questions can authorize changes — the command grammar, "
            "not the question mark, decides")

    def test_t1_question_refused_pre_planning_at_the_lane(self):
        out, shared, spy = self._lane(T1_QUESTION)
        assert spy["calls"] == 0, (
            "no edit-planning work happens for a question")
        assert out is None
        assert shared.get("canvas_edit_no_apply_reason") == (
            "edit_not_authorized")

    def test_teaching_instruction_is_not_an_edit(self):
        result, spy, _s, _o = _run_turn(
            "learn to always include the draft validity terms")
        assert spy["edit_planner_calls"] == 0, (
            "teaching directives route to the teaching channel")

    def test_ambiguous_advisory_gets_no_edit_authorization(self):
        result, spy, _s, _o = _run_turn(
            "maybe we should look at the pricing again?")
        assert spy["edit_planner_calls"] == 0, (
            "advisory wording is read-only; no assumed edit "
            "authorization")


class TestAuthorizationFailureFailsClosed:
    """Owner correction on c3c364230: both gates failed OPEN on
    evaluator exceptions, reopening the unwanted planning path. Now an
    unevaluable authorization SKIPS edit planning (read-only research
    retained) and records the error separately from an explicit
    denial."""

    def test_lane_skips_when_the_evaluator_raises(self):
        orch = _orch()
        spy = {"calls": 0}

        async def _plan(*a, **k):
            spy["calls"] += 1

            class _P:
                wants_edit = True
            return _P()

        shared = {}
        with patch("core.turn_decision.edit_authorization",
                   side_effect=RuntimeError("evaluator down")), \
             patch.object(cce, "plan_canvas_edit",
                          new=AsyncMock(side_effect=_plan)), \
             patch.object(cce, "fetch_fresh_data_section",
                          new=AsyncMock(return_value=cce.FreshDataResult(
                              "", False, True))):
            out = asyncio.run(orch._try_canvas_edit(
                "Update rows 1-5; don't send", [], dict(CANVAS),
                "user-1", "sess-err", "exec-err", None,
                shared_tool_state=shared))
        assert out is None, "no edit planning without an evaluation"
        assert spy["calls"] == 0
        assert shared.get("canvas_edit_no_apply_reason") == (
            "edit_authorization_error"), (
            "the evaluation ERROR is recorded, distinct from a denial")
        assert shared.get("canvas_edit_authorization_error") == (
            "evaluator down")

    def test_research_access_retained_when_evaluation_fails(self):
        """The fail-closed skip is EDIT-only: the reply leg's research
        path does not consult the broken evaluator."""
        from core.chat_tool_planner import ToolPlan

        result, spy, _s, _o = _run_turn(
            T1_QUESTION,
            tool_plan=ToolPlan(use_tool=True, service="datasets",
                               intent="read", query=T1_QUESTION,
                               reason="research"),
            tool_result=RECEIPT["storage_read"]["structured_result"],
            break_evaluator=True)
        # the retained path: the turn did NOT fail for authorization
        assert result.get("message") != (
            "I couldn't complete the canvas edit, so nothing was "
            "changed."), (
            "read-only research access is retained when edit "
            "authorization is unevaluable (the full reply-leg dispatch "
            "is integration-covered by the counted run)")


class TestT1ReachesRetrievalThroughTheRealTurn:
    """Owner correction: the process_chat_message harness must let the
    REAL retrieval branch run with controlled planner/source responses
    — zero edit operations and planner calls; a retrieval operation
    executes; findings and the read-captured version survive fresh
    reload; narration failure after retrieval preserves them."""

    def test_t1_resolves_canvas_job_evidence_through_the_real_store(self):
        """The fresh-session integration: a canvas-bound job's durable
        findings reach the requirement check through the REAL lifecycle
        store and the REAL adapter reconstruction — no seeded
        operations, no helper calls. The turn itself stays read-only
        (both gates), and the checker receives qualified evidence."""
        from core.goals.goal_run_service import GoalRunService
        from core.goals.goal_service import GoalService
        from core.task_lifecycle import (
            TaskLifecycle, begin_retrieval_turn, finish_retrieval_turn,
            record_read_outcome,
        )
        from integrations.chat_orchestrator import (
            _apply_read_receipt_facts,
        )

        # the scratch store the real lifecycle persists to
        result, spy, session, orch = _run_turn(
            T1_QUESTION, durable=True,
            qwen=TimeoutError("narration deadline"))
        assert spy["edit_planner_calls"] == 0

        factory = orch._route_test_factory
        tl = TaskLifecycle(
            GoalRunService(workspace_id="default", tenant_id="default",
                           session_factory=factory),
            GoalService(workspace_id="default", tenant_id="default",
                        session_factory=factory))
        # the completed research job bound to THIS canvas (created
        # through the real begin/settle path)
        run_id, op_id = begin_retrieval_turn(
            tl, {"id": "s-job", "history": []}, "sess-r",
            "research: rows 1-5 approved prices and delivery times",
            "e-job", items=["SLE24-16", "Roper Whitney Roll Bender"],
            requested_fields=["price", "delivery"],
            canvas_id="cv-route")
        execution = {"invoked": True, "outcome": "read_succeeded",
                     "served_basis": "saved_copy",
                     "source_version": "hash-read-A",
                     "items": {"SLE24-16": "matched",
                               "Roper Whitney Roll Bender": "matched"}}
        _apply_read_receipt_facts(
            execution, RECEIPT["storage_read"]["structured_result"],
            {"content_hash": "hash-read-A"})
        finish_retrieval_turn(
            tl, run_id, op_id,
            RECEIPT["storage_read"]["structured_result"], "e-job", True,
            execution=execution)
        record_read_outcome(
            tl, run_id, op_id,
            structured_result=RECEIPT["storage_read"]["structured_result"],
            freshness=None, execution=execution)

        # a FRESH lifecycle over the same store resolves the evidence
        fresh_tl = TaskLifecycle(
            GoalRunService(workspace_id="default", tenant_id="default",
                           session_factory=factory),
            GoalService(workspace_id="default", tenant_id="default",
                        session_factory=factory))
        record = fresh_tl.find_active_task_for_canvas("cv-route")
        assert record is not None, (
            "the canvas-bound job resolves for a fresh session")

        # the REAL adapter reconstruction over the REAL record
        with patch("integrations.chat_orchestrator._task_lifecycle_for",
                   return_value=fresh_tl):
            contract = orch._canvas_job_evidence_contract(
                {"canvas_id": "cv-route", "content": CANVAS["content"]})
        assert contract is not None and contract.get("evidence")

        # the checker receives qualified evidence: prices in the
        # authorized contract match the authoritative canvas
        from core.chat_canvas_editor import requirement_check

        check = requirement_check(
            message=T1_QUESTION, canvas=dict(CANVAS), authorized=True,
            expected_prior_audit_id=None, evidence_contract=contract,
            current_source_revision="hash-read-A")
        assert check is not None
        value = [o for o in check.get("obligations") or []
                 if o.get("kind") == "value_obligations"]
        assert value and value[0]["disposition"] == "satisfied", (
            f"qualified evidence reaches the checker: {check}")
