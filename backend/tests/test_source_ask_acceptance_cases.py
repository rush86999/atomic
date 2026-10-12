"""Acceptance-case battery for the source-ask work order (round 10).

Each test maps to one REQUIRED acceptance case of the assignment and
pins it at the layer that can prove it deterministically. The full
production-path demonstration (fresh user, real orchestrator turn,
controlled external responses) lives in
``tests/test_source_ask_tool_execution.py`` — the scenario there is
deliberately NON-pricing (documents/quarterly-revenue, no business
routing involved).

Layer map:
  planner      core.chat_tool_planner.plan_tool_use (validation rungs +
               the source-ask floor)
  receipts     _stamp_documents_receipt / _search_execution_receipt /
               _planner_receipt_rows (durable settlement facts)
  narration    unbacked_search_claims / unbacked_result_counts /
               truthful_search_narration
  program      core.action_program (the decision's executable shadow)
  lifecycle    core.task_lifecycle (durable obligations, follow-up) —
               always over an in-memory scratch engine, never the dev DB
"""
import asyncio
from unittest.mock import patch

import pytest

from core.action_program import normalize_source_kind, program_from_decision
from core.chat_tool_planner import ToolPlan
from core.turn_decision import build_turn_decision

SOURCE_ASK = ("Search my documents for anything about quarterly "
              "revenue and tell me what you find.")


def _plan(service=None, use_tool=None, intent="search", query="",
          reason=""):
    return ToolPlan(
        use_tool=bool(use_tool if use_tool is not None else service),
        service=service, intent=intent, query=query, reason=reason)


def run_plan(message, proposed, connected=(), platform=None):
    """plan_tool_use with the structured LLM pinned to ``proposed`` (the
    external response under test control) and the service availability
    gates pinned to the test's own world."""
    import core.chat_tool_planner as ctp

    async def _structured(llm_service, *, prompt, response_model,
                          system_instruction, **_kw):
        return proposed

    def _platform():
        return list(platform) if platform is not None else [
            "memory", "documents", "datasets"]

    async def _call():
        return await ctp.plan_tool_use(
            message, [], "user-x", object(), provenance="")

    with patch.object(ctp, "_structured_with_fallback", new=_structured), \
            patch.object(ctp, "get_connected_services",
                         return_value=list(connected)), \
            patch.object(ctp, "_available_platform_services",
                         side_effect=_platform), \
            patch.object(ctp, "_datasets_service_available",
                         return_value=True):
        return asyncio.run(_call())


def _lifecycle():
    """TaskLifecycle over a SCRATCH in-memory engine (never the dev DB —
    AGENTS.md live-DB rule)."""
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
    return TaskLifecycle(
        GoalRunService(workspace_id="default", tenant_id="default",
                       session_factory=factory),
        GoalService(workspace_id="default", tenant_id="default",
                    session_factory=factory))


class TestPlannerSourceAskFloor:
    def test_floor_corrects_a_declined_proposal(self):
        """CASE 11 — the planner returns conversation-only output for a
        tool-required job: one bounded corrective pass, then the
        deterministic rung plans the registered service that can serve
        the named source, with the request's subject as the query."""
        plan = run_plan(SOURCE_ASK, _plan())
        assert plan is not None and plan.use_tool
        assert plan.service == "documents"
        assert "quarterly revenue" in (plan.query or "")
        meta = getattr(plan, "_result_meta", {}).get("planning", {})
        assert meta.get("source") == "source_ask_floor"

    def test_a_valid_alternative_strategy_is_accepted(self):
        """CASE 1 — several tools capable of valid solutions: datasets
        can serve a documents ask (the ingested catalog); a proposal
        naming it is NEVER overridden. Multiple valid strategies count."""
        plan = run_plan(SOURCE_ASK, _plan("datasets"))
        assert plan.service == "datasets"
        meta = getattr(plan, "_result_meta", {}).get("planning", {})
        assert meta.get("source") == "structured"

    def test_wrong_source_is_corrected_with_the_contract_named(self):
        """CASE 2 — a plausible but wrong source: a connected record app
        cannot read the named document kind; the floor corrects to the
        registered lane."""
        plan = run_plan(SOURCE_ASK, _plan("zoho_inventory"),
                        connected=("zoho_inventory",))
        assert plan.service == "documents"
        meta = getattr(plan, "_result_meta", {}).get("planning", {})
        assert meta.get("source") in ("source_ask_repair",
                                      "source_ask_floor")

    def test_no_registered_service_leaves_the_decline_honest(self):
        """CASE 7 (planner half) — missing connection: with no VFS, no
        datasets and no memory, nothing registered can serve the ask —
        the floor stays out of the way (the honest decline stands; the
        narration guard keeps the reply truthful)."""
        plan = run_plan(SOURCE_ASK, _plan(), platform=[])
        assert not plan.use_tool


class TestQuerySubjectExtraction:
    def test_subject_survives_scaffold_stripping(self):
        """CASE 4 (floor half) — the query carries the request's
        SUBJECT, not the command scaffolding or a locator noun."""
        from core.chat_tool_planner import _source_ask_query

        assert _source_ask_query(SOURCE_ASK) == "quarterly revenue"
        assert _source_ask_query("Search my emails for the Acme quote") \
            == "the Acme quote"
        # a command the regex cannot strip cleanly yields "" — the
        # caller falls back to the message, never invented terms
        assert _source_ask_query("do the thing") == ""

    def test_row_locator_stays_a_location(self):
        """A locator is a location, never a product identity: the floor's
        query keeps the user's own words verbatim."""
        from core.chat_tool_planner import _source_ask_query

        q = _source_ask_query(
            "Search my documents for Tennsmith row 338 pricing and tell "
            "me what you find.")
        assert "Tennsmith row 338" in q


class TestProgramKinds:
    def test_document_nouns_survive_program_compilation(self):
        """The decision's source ask compiles to a source_read op that
        still KNOWS its kind — the second transition the pristine run
        lost (documents→"" → source_kinds=[])."""
        decision = build_turn_decision(SOURCE_ASK, session={}, history=[],
                                       context={})
        kinds = [a.get("target", {}).get("sources")
                 for a in decision["requested_actions"]
                 if a.get("kind") == "research"]
        assert kinds and kinds[0] == ["documents"]
        program = program_from_decision(decision)
        ops = [a for a in program.actions if getattr(a, "op", "") ==
               "source_read"]
        assert ops and ops[0].source_kinds == ["document"]
        assert normalize_source_kind("documents") == "document"
        assert normalize_source_kind("workbooks") == "spreadsheet"
        assert normalize_source_kind("flurb") == ""

    def test_mutation_is_never_authorized_by_a_search_ask(self):
        """CASE 10 — unauthorized mutation request: a search ask with a
        delete clause proposes READ work only; nothing in the decision,
        the program, or the floor's correction mutates anything."""
        msg = ("Search my documents for quarterly revenue and delete the "
               "ones that are wrong.")
        decision = build_turn_decision(msg, session={}, history=[],
                                       context={})
        kinds = {a["kind"] for a in decision["requested_actions"]}
        assert "research" in kinds
        assert "canvas_edit" not in kinds
        program = program_from_decision(decision)
        assert all(getattr(a, "op", "") != "propose_patch"
                   for a in program.actions)

    def test_explicit_refresh_compiles_to_fresh_read(self):
        """CASE 9 — explicit refresh: 'search again' resolves as a rerun
        whose program mode re-executes (not reuse)."""
        msg = "Search my documents again for quarterly revenue."
        decision = build_turn_decision(msg, session={}, history=[],
                                       context={})
        program = program_from_decision(decision)
        src_ops = [a for a in program.actions
                   if getattr(a, "op", "") == "source_read"]
        assert src_ops, "an explicit refresh is still a source ask"
        assert src_ops[0].mode in ("fresh_read", "rerun", "refresh")


class TestReceipts:
    def test_executed_grep_stamps_an_attributable_receipt(self):
        """CASE 3 (receipt half) — discovery-only results carry their
        paths so a read successor can be chosen from the receipt."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="search",
                     query="quarterly revenue")
        ctp._stamp_documents_receipt(
            plan, action="grep", query="quarterly revenue", executed=True,
            match_count=2,
            paths=["knowledge/documents/a", "knowledge/documents/b"])
        meta = plan._result_meta["documents_read"]
        assert meta["executed"] and meta["match_count"] == 2
        assert len(meta["paths"]) == 2

        receipt = co._search_execution_receipt(
            plan, "LIVE TOOL RESULTS (documents.grep ...) — (2 match "
            "line(s))")
        assert receipt["dispatched"] and receipt["retrieved"]
        assert receipt["receipt"]["documents_read"]["match_count"] == 2

        rows = co._planner_receipt_rows(plan)
        assert rows and rows[0]["tool"] == "documents.grep"
        assert rows[0]["verified"] is True
        assert len(rows[0]["evidence_refs"]) == 1
        assert len(rows[0]["evidence_refs"][0]["paths"]) == 2

    def test_zero_match_executed_search_is_a_bounded_absence(self):
        """A search that provably EXECUTED with zero hits is verified —
        absence scoped to what was searched, never universal absence."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="search",
                     query="quarterly revenue")
        ctp._stamp_documents_receipt(
            plan, action="grep", query="quarterly revenue", executed=True,
            match_count=0, paths=[])
        receipt = co._search_execution_receipt(
            plan, "LIVE TOOL RESULTS (documents.grep ...) — none.")
        assert receipt["bounded_absence"] is True
        assert receipt["retrieved"] is False
        rows = co._planner_receipt_rows(plan)
        assert rows[0]["verified"] is True  # executed + attributable
        assert "empty_in_scope" in rows[0]["outcome"]

    def test_failed_dispatch_is_not_a_receipt(self):
        """CASE 7 (settlement half) — access failure records the precise
        blocker with verified=False; it never counts as retrieval."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="grep")
        ctp._stamp_documents_receipt(
            plan, action="grep", query="x", executed=False,
            error="VPC unreachable")
        rows = co._planner_receipt_rows(plan)
        assert rows[0]["verified"] is False
        assert "VPC unreachable" in rows[0]["outcome"]

    def test_truncated_or_degraded_reads_carry_the_flag(self):
        """CASE 6 — truncated/paginated results: the receipt names the
        gap (degraded reads are NOT verified complete) so follow-up work
        can be chosen from it."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="read")
        ctp._stamp_documents_receipt(
            plan, action="read",
            query="knowledge/documents/a/content.lines",
            executed=True, match_count=200, degraded=True)
        rows = co._planner_receipt_rows(plan)
        assert rows[0]["verified"] is False
        assert "degraded" in rows[0]["outcome"]


class TestNarrationAgreement:
    def test_unbacked_search_claims_detection(self):
        """CASE 12 (detection half) — narration naming sources nothing
        executed, and narration naming a source the executed store is
        not, are both violations; a covered claim is not."""
        from core.chat_tool_planner import unbacked_search_claims

        claims = [
            ("I've searched your Zoho CRM integration and found records.",
             [], True),
            ("I searched the documents and found nothing.", [], True),
            ("I searched the documents.", ["documents.grep"], False),
            ("I checked your Google Drive and found the file.",
             ["documents.grep"], True),
        ]
        for reply, executed, should_flag in claims:
            flagged = unbacked_search_claims(reply, executed)
            assert bool(flagged) is should_flag, (reply, flagged)

    def test_count_contradiction_after_settled_search(self):
        """CASE 12 — a positive result count against a settled
        zero-match receipt is a fabrication; agreeing counts are not.
        (Authority is the structured count — see TestScopedAbsence.)"""
        from core.chat_tool_planner import unbacked_result_counts

        assert unbacked_result_counts(
            "I found 5 records about quarterly revenue.", 0)
        assert not unbacked_result_counts("I found no records.", 0)

    def test_truthful_narration_from_receipts_only(self):
        """The replacement narration is rendered FROM the executed
        evidence — with no execution it says nothing was searched."""
        from core.chat_tool_planner import truthful_search_narration

        none = truthful_search_narration(None)
        assert "no connected system was queried" in none
        block = ("LIVE TOOL RESULTS (documents.grep, pattern='quarterly "
                 "revenue', under 'knowledge') — scan (0 match line(s))")
        honest = truthful_search_narration(block)
        assert "documents.grep" in honest
        assert "0 match line(s)" in honest


class TestAuthorityPreservation:
    """VERIFIER CHECK 1 — the source-ask floor preserves authority: a
    fallback must meet the obligation's evidence requirements, never
    merely read a similar source kind."""

    def test_memory_cannot_satisfy_a_designated_workbook(self):
        from unittest.mock import patch

        import core.chat_tool_planner as ctp

        with patch.object(ctp, "_available_platform_services",
                          return_value=["memory", "documents",
                                        "datasets"]), \
                patch.object(ctp, "_datasets_service_available",
                             return_value=True):
            cands = ctp._source_service_candidates(
                ["document"], [],
                "Search my documents for the q3_review.xlsx revenue "
                "figures.")
        assert "memory" not in cands
        assert cands == ["documents", "datasets"]

    def test_current_inventory_needs_the_system_of_record(self):
        import core.chat_tool_planner as ctp

        # A freshness ask with NOTHING connected: nothing qualifies —
        # the obligation stays unresolved (honest), never answered from
        # an ingested snapshot.
        assert ctp._source_service_candidates(
            ["record"], [],
            "What is the current inventory level for WG-350?") == []
        # With the record system connected, ONLY it qualifies.
        assert ctp._source_service_candidates(
            ["record"], ["zoho_inventory"],
            "What is the current inventory level for WG-350?") \
            == ["zoho_inventory"]

    def test_correspondence_still_reads_the_mailbox_store(self):
        import core.chat_tool_planner as ctp

        # The ingested mailbox IS the correspondence store (design doc:
        # whose-data rule) — memory remains a valid rung here.
        assert "memory" in ctp._source_service_candidates(
            ["email"], [], "Search my emails for the Acme quote")

    def test_floor_declines_when_no_service_meets_the_requirement(self):
        """A fresh-record ask in a world with no connected system: the
        floor produces NO plan rather than a lookalike source."""
        plan = run_plan(
            "What is the current inventory level for WG-350 right now?",
            _plan(), connected=(), platform=["memory", "documents",
                                             "datasets"])
        assert not plan.use_tool


class TestBoundedRepair:
    """VERIFIER CHECK 4 — the planner repair stays bounded."""

    def test_source_ask_floor_issues_at_most_one_repair_pass(self):
        import core.chat_tool_planner as ctp

        calls = {"n": 0}

        async def _repair(*a, **k):
            calls["n"] += 1
            return None  # the corrective pass declines

        plan = run_plan(SOURCE_ASK, _plan())
        # run_plan pins _structured_with_fallback; pin the repair pass
        # separately by re-running with a counting repair:
        from unittest.mock import patch

        async def _structured(llm_service, *, prompt, response_model,
                              system_instruction, **_kw):
            return _plan()

        async def _call():
            with patch.object(ctp, "_structured_with_fallback",
                              new=_structured), \
                    patch.object(ctp, "_repair_plan_via_llm",
                                 new=_repair), \
                    patch.object(ctp, "get_connected_services",
                                 return_value=[]), \
                    patch.object(ctp, "_available_platform_services",
                                 return_value=["memory", "documents",
                                               "datasets"]), \
                    patch.object(ctp, "_datasets_service_available",
                                 return_value=True):
                return await ctp.plan_tool_use(
                    SOURCE_ASK, [], "user-x", object(), provenance="")

        asyncio.run(_call())
        assert calls["n"] == 1, (
            "the source-ask floor runs ONE bounded corrective pass, "
            f"got {calls['n']}")

    def test_valid_repair_is_accepted_without_the_deterministic_rung(self):
        """When the corrective pass produces a serving plan, the plan is
        accepted AS the repair's (planning provenance records which)."""
        import core.chat_tool_planner as ctp
        from unittest.mock import patch

        repaired = _plan("documents", use_tool=True, intent="search",
                         query="quarterly revenue")
        accepted = {}

        async def _repair(*a, **k):
            accepted["called"] = True
            return repaired

        async def _structured(llm_service, *, prompt, response_model,
                              system_instruction, **_kw):
            return _plan()  # declined

        async def _call():
            with patch.object(ctp, "_structured_with_fallback",
                              new=_structured), \
                    patch.object(ctp, "_repair_plan_via_llm",
                                 new=_repair), \
                    patch.object(ctp, "get_connected_services",
                                 return_value=[]), \
                    patch.object(ctp, "_available_platform_services",
                                 return_value=["memory", "documents",
                                               "datasets"]), \
                    patch.object(ctp, "_datasets_service_available",
                                 return_value=True):
                return await ctp.plan_tool_use(
                    SOURCE_ASK, [], "user-x", object(), provenance="")

        result = asyncio.run(_call())
        assert accepted.get("called") and result is repaired
        meta = getattr(result, "_result_meta", {}).get("planning", {})
        assert meta.get("source") == "source_ask_repair"

    def test_the_floor_never_introduces_mutation_authorization(self):
        """The fallback corrects the READ only: no edit/mutation field
        appears on the plan and the compiled program adds no patch op."""
        plan = run_plan(
            "Search my documents for quarterly revenue and delete the "
            "wrong ones.", _plan())
        assert plan.use_tool and plan.service in ("documents", "datasets",
                                                  "memory")
        program = program_from_decision({
            "session_id": "s", "message": SOURCE_ASK,
            "requested_actions": [{"kind": "research",
                                   "reason": "source_ask",
                                   "target": {"kind": "source",
                                              "sources": ["documents"]},
                                   "additional_sources": ["documents"],
                                   "constraints": []}]})
        assert all(getattr(a, "op", "") != "propose_patch"
                   for a in program.actions)

    def test_distinct_planning_execution_and_satisfaction_outcomes(self):
        """Planning, execution and evidence-satisfaction are separate
        recorded facts: planning provenance / verified flag / outcome
        status on the receipt row."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="search")
        plan._result_meta = {"planning": {"source": "source_ask_floor"}}
        ctp._stamp_documents_receipt(
            plan, action="grep", query="x", executed=True, match_count=0)
        row = co._planner_receipt_rows(plan)[0]
        meta = getattr(plan, "_result_meta", {}).get("planning", {})
        # planning: HOW the plan came to be; execution: verified;
        # satisfaction: the outcome status — three distinct fields.
        assert meta.get("source") in ("structured", "source_ask_floor",
                                      "source_ask_repair")
        assert row["verified"] is True
        assert row["outcome"].startswith("status=")


class TestAttribution:
    """VERIFIER CHECK 3 — receipts retain exact attribution."""

    def test_an_earlier_execution_cannot_license_a_later_claim(self):
        import integrations.chat_orchestrator as co

        session = {"_planner_receipt_facts_exec-A": {
            "executed_tools": ["documents.grep"], "documents": {
                "executed": True, "match_count": 0}}}
        # The CURRENT execution is exec-B: exec-A's stamp must be
        # invisible to it.
        assert co._turn_receipt_facts(session, "exec-B") == {}
        assert co._turn_receipt_facts(session, "exec-A") != {}

    def test_missing_facts_mean_nothing_executed(self):
        import integrations.chat_orchestrator as co

        assert co._turn_receipt_facts({}, "exec-A") == {}
        assert co._turn_receipt_facts({"unrelated": 1}, None) == {}

    def test_settlement_reads_durable_rows_not_session_alone(self):
        """Restart/reload reconstruction: the outcome builder must NOT
        conjure receipts when the session lost the stamp — a durable
        receipt exists only where the execution row carries one."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="search")
        ctp._stamp_documents_receipt(
            plan, action="grep", query="x", executed=True, match_count=3)
        rows = co._planner_receipt_rows(plan)
        assert rows and rows[0]["verified"] is True
        # A session WITHOUT this execution's stamp merges nothing —
        # persisted rows, not session state, are the reload authority.


class TestScopedAbsence:
    """VERIFIER CHECK 2 — absence holds only within the receipt's scope."""

    def test_degraded_read_is_not_a_bounded_absence(self):
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="read")
        ctp._stamp_documents_receipt(
            plan, action="read", query="knowledge/documents/a",
            executed=True, match_count=0, degraded=True)
        receipt = co._search_execution_receipt(plan, "LIVE TOOL RESULTS "
                                               "(documents.read ...) — empty")
        assert receipt["bounded_absence"] is False, (
            "a degraded read is inconclusive; it can never license a "
            "complete-absence claim")

    def test_truncated_read_is_not_a_bounded_absence(self):
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="read")
        ctp._stamp_documents_receipt(
            plan, action="read", query="knowledge/documents/a",
            executed=True, match_count=400, truncated=True)
        receipt = co._search_execution_receipt(plan, "LIVE TOOL RESULTS "
                                               "(documents.read ...) — more")
        assert receipt["bounded_absence"] is False

    def test_count_authority_is_the_structured_receipt(self):
        from core.chat_tool_planner import unbacked_result_counts

        fabricated = "I found 5 records about quarterly revenue."
        # structured receipt says 0 → flagged; says 5 → clean; no
        # structured receipt → out of the way (claims detector covers).
        assert unbacked_result_counts(fabricated, 0) \
            == ["5 records"]
        assert unbacked_result_counts(fabricated, 5) == []
        assert unbacked_result_counts(fabricated, None) == []

    def test_partial_read_narration_never_claims_complete_absence(self):
        from core.chat_tool_planner import truthful_search_narration

        block = ("LIVE TOOL RESULTS (documents.read, path='x') — DEGRADED")
        text = truthful_search_narration(
            block, docs_receipt={"executed": True, "match_count": 0,
                                 "degraded": True})
        assert "PARTIAL" in text
        assert "nothing absent from it should be treated as absent" in text


class TestDurableFollowUp:
    def test_satisfied_obligation_is_not_replanned(self):
        """CASE 8 — existing satisfied evidence: a completed retrieval
        leaves no unfinished work (reuse wins; refresh only on request),
        so continuation turns do not re-plan completed work."""
        from core.task_lifecycle import (
            begin_retrieval_turn,
            finish_retrieval_turn,
            next_unfinished_work,
        )

        lifecycle = _lifecycle()
        session = {"id": "sess-sat"}
        run_id, op_id = begin_retrieval_turn(
            lifecycle, session, "sess-sat", SOURCE_ASK, "exec-sat",
            items=["quarterly revenue"])
        finish_retrieval_turn(
            lifecycle, run_id, op_id,
            {"requested_items": ["quarterly revenue"],
             "requested_fields": ["revenue figures"],
             "evidence": [{"item": "quarterly revenue",
                           "source": "documents.grep"}]},
            "exec-sat", True)
        record = lifecycle.get_task(run_id)
        work = next_unfinished_work(record) or {}
        assert not (work.get("actions") or []), (
            "a satisfied obligation must not spawn re-work")

    def test_truncated_read_opens_a_read_successor(self):
        """PHASE 6 / CASE 6 continuation — a degraded (truncated) read
        leaves the obligation OPEN with the read successor named, so the
        next turn's work comes from the gap."""
        from core.task_lifecycle import (
            begin_retrieval_turn,
            finish_retrieval_turn,
            next_unfinished_work,
        )

        lifecycle = _lifecycle()
        session = {"id": "sess-gap"}
        run_id, op_id = begin_retrieval_turn(
            lifecycle, session, "sess-gap", SOURCE_ASK, "exec-gap",
            items=["quarterly revenue"])
        finish_retrieval_turn(
            lifecycle, run_id, op_id,
            {"requested_items": ["quarterly revenue"],
             "evidence": [], "degraded": True},
            "exec-gap", False,
            execution={"invoked": True,
                       "outcome": "status=degraded match_count=200",
                       "served_basis": "live", "failure_stage": None})
        record = lifecycle.get_task(run_id)
        work = next_unfinished_work(record)
        assert work, "a degraded read must leave unfinished work"


class TestDiscoveryToReadSuccessor:
    def test_grep_block_names_its_read_successor(self):
        """CASE 3 — discovery-only results: the executed block itself
        carries the read successor (the bounded-read hint), so the NEXT
        action is chosen from the receipt, not re-planned blind."""
        import core.action_registry as ar
        import core.chat_tool_planner as ctp

        class _StubRegistry:
            async def execute_action(self, name, args, ctx):
                assert name == "documents.grep"
                return {"success": True, "pattern": "quarterly revenue",
                        "matches": [{"path": "knowledge/documents/a",
                                     "line": 12,
                                     "snippet": "revenue up"}]}

        plan = _plan("documents", use_tool=True, intent="search",
                     query="quarterly revenue")

        async def _call():
            with patch.object(ar, "action_registry", _StubRegistry()), \
                    patch("core.knowledge_vfs_config.knowledge_vfs_enabled",
                          return_value=True):
                return await ctp._documents_vfs_block(plan, "u", {})

        block = asyncio.run(_call())
        assert "documents.read(" in block or "documents.cat(" in block, (
            "a discovery result must name its read successor")
        meta = plan._result_meta["documents_read"]
        assert meta["executed"] and meta["match_count"] == 1


class TestOwnerReviewRepairs:
    """NARROW repairs for the owner review of 02ec1c57e — connection is
    not suitability, metadata presence is not verification, and a
    bounded absence carries its scope."""

    def test_crm_connection_cannot_serve_ticket_evidence(self):
        """REPAIR 1 control — CRM connected, obligation needs TICKET
        evidence: the selected tool must have the right result contract.
        No matching service → unresolved (no candidates)."""
        import core.chat_tool_planner as ctp

        assert ctp._source_service_candidates(
            ["ticket"], ["zoho_crm"],
            "Check the support tickets for the Acme order.") == []

    def test_generic_record_kind_requires_the_item_search_family(self):
        import core.chat_tool_planner as ctp

        # a business-record ask with CRM connected: CRM IS in the
        # item-search family — it qualifies.
        assert ctp._source_service_candidates(
            ["record"], ["zoho_crm"], "Check the record for Acme.") \
            == ["zoho_crm"]
        # a connected service OUTSIDE the family does not qualify.
        assert ctp._source_service_candidates(
            ["record"], ["random_app"], "Check the record for Acme.") == []

    def test_inventory_evidence_needs_an_inventory_service(self):
        import core.chat_tool_planner as ctp

        assert ctp._source_service_candidates(
            ["record"], ["zoho_crm"],
            "What is the current inventory position for WG-350?") == []
        assert ctp._source_service_candidates(
            ["record"], ["zoho_crm", "zoho_inventory"],
            "What is the current inventory position for WG-350?") \
            == ["zoho_inventory"]

    def test_latest_supplier_position_cannot_be_satisfied_by_ingested_stores(self):
        """The owner's correspondence rule: ingested copies answer
        historical questions; the LATEST supplier position needs the
        live system — every platform store drops out."""
        from core.chat_tool_planner import _FRESH_RECORD_ASK_RE

        assert _FRESH_RECORD_ASK_RE.search(
            "What is the latest supplier position for WG-350?")
        import core.chat_tool_planner as ctp

        assert ctp._source_service_candidates(
            ["record"], [],
            "What is the latest supplier position for WG-350?") == []

    def test_non_document_receipt_distinguishes_executed_evidence_satisfied(self):
        """REPAIR 2 — a generic service's row separates call executed /
        evidence returned / obligation satisfied, with attributable
        scope references instead of empty ones; a failed response can
        no longer look executed and verified."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        # executed WITH evidence: threads actually retrieved.
        plan = _plan("outlook", use_tool=True, intent="search")
        plan._result_meta = {"searched_threads": [
            {"id": "t1", "subject": "Acme quote"}]}
        row = co._planner_receipt_rows(plan)[0]
        assert row["verified"] is True
        assert "evidence_items=1" in row["outcome"]
        assert row["evidence_refs"] and \
            row["evidence_refs"][0]["kind"] == "search_scope"
        assert row["evidence_refs"][0]["searched_threads"] == 1

        # executed, EMPTY result shape (empty searched_threads, no
        # block): the receipt contract reads that as NOT dispatched —
        # an empty-shaped response can never look executed and verified
        # (the owner's stated hazard). Bounded absence stays a property
        # of REAL executions at the settle arm, where the block exists.
        plan2 = _plan("outlook", use_tool=True, intent="search")
        plan2._result_meta = {"searched_threads": []}
        row2 = co._planner_receipt_rows(plan2)[0]
        assert row2["verified"] is False
        assert row2["outcome"] == "not_executed"
        assert row2["evidence_refs"][0]["bounded_absence"] is False

        # FAILED response (error marker, no evidence): NOT verified.
        plan3 = _plan("zoho_inventory", use_tool=True, intent="search")
        plan3._result_meta = {"zoho_error": "auth denied",
                              "zoho_inventory": []}
        row3 = co._planner_receipt_rows(plan3)[0]
        assert row3["verified"] is False

        # nothing in the meta at all: not executed.
        plan4 = _plan("zoho_crm", use_tool=True, intent="search")
        plan4._result_meta = {}
        row4 = co._planner_receipt_rows(plan4)[0]
        assert row4["verified"] is False
        assert row4["outcome"] == "not_executed"

    def test_unrecognized_shapes_never_read_as_executed(self):
        """Metadata the receipt contract does not recognize (an unknown
        marker key) is not execution evidence: the row reads
        not_executed, verified False — presence alone is never
        verification."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("outlook", use_tool=True, intent="search")
        plan._result_meta = {"search_ran": True}  # no structured keys
        rows = co._planner_receipt_rows(plan)
        assert rows[0]["verified"] is False
        assert rows[0]["outcome"] == "not_executed"
        facts = co._planner_receipt_facts(plan)
        assert "outlook" not in facts["executed_tools"], (
            "an unrecognized shape cannot license a search claim")

    def test_documents_zero_result_receipt_carries_scope(self):
        """REPAIR 3 — a zero-result documents search emits a scope
        receipt (what was searched, coverage, truncation), never an
        unexplained verified=true."""
        import core.chat_tool_planner as ctp
        import integrations.chat_orchestrator as co

        plan = _plan("documents", use_tool=True, intent="search",
                     query="quarterly revenue")
        ctp._stamp_documents_receipt(
            plan, action="grep", query="quarterly revenue", executed=True,
            match_count=0, paths=[])
        row = co._planner_receipt_rows(plan)[0]
        assert row["verified"] is True
        refs = row["evidence_refs"]
        assert refs and refs[0]["kind"] == "documents"
        assert refs[0]["query"] == "quarterly revenue"
        assert refs[0]["match_count"] == 0
        assert refs[0]["coverage"] == "complete"
        # a truncated search records partial coverage:
        ctp._stamp_documents_receipt(
            plan, action="grep", query="q", executed=True, match_count=0,
            truncated=True)
        row2 = co._planner_receipt_rows(plan)[0]
        assert row2["evidence_refs"][0]["coverage"] == "partial"

    def test_source_obligation_reaches_the_job_contract(self):
        """The persisted job contract carries what the selection acted
        on: the retrieval obligation recorded by begin_retrieval_turn
        matches the floor's subject extraction (designated-source and
        freshness requirements persist with the job, not only in message
        detectors)."""
        from core.task_lifecycle import begin_retrieval_turn

        lifecycle = _lifecycle()
        session = {"id": "sess-contract"}
        msg = ("What is the latest supplier position for WG-350 and its "
               "current price?")
        run_id, op_id = begin_retrieval_turn(
            lifecycle, session, "sess-contract", msg, "exec-contract",
            items=["WG-350"], requested_fields=["supplier position",
                                                "current price"])
        record = lifecycle.get_task(run_id)
        rev = record["task_revision"]
        subjects = [str(e.get("id")) for e in (rev.get("entities") or [])]
        assert "WG-350" in subjects
        assert "supplier position" in (
            rev.get("requested_fields") or [])
        assert "current price" in (rev.get("requested_fields") or [])


class TestVerifiedNoneSafety:
    """OWNER MANDATE — verified=None must survive normalization,
    criteria, success derivation and the fail-closed aggregation
    without any truthiness shortcut promoting it to success."""

    def _none_row(self):
        return {"tool": "outlook", "verified": None,
                "outcome": "executed_no_verifiable_evidence",
                "required": True,
                "evidence_refs": [{"kind": "search_scope",
                                   "service": "outlook"}]}

    def test_normalization_preserves_none(self):
        from core.task_outcome_contract import _tri_state

        assert _tri_state(None) is None
        assert _tri_state("true") is None  # a string is not a verdict
        assert _tri_state(1) is None
        assert _tri_state(True) is True
        assert _tri_state(False) is False

    def test_none_verified_never_derives_tool_success(self):
        from core.task_outcome_contract import derive_success_kinds

        outcome = {"tool_outcomes": [self._none_row()],
                   "delivery": {"delivered": True}}
        kinds = derive_success_kinds(outcome)
        assert kinds["tool_success"] is None, (
            "an unverified execution must stay 'executed, not verified'")

    def test_none_verified_is_not_verified_evidence(self):
        """The retrieval criterion requires verified IS True — None
        cannot back 'verified_evidence', so the criterion stays
        unknown/failed, never met."""
        from core.task_outcome_contract import (
            build_task_outcome, derive_success_kinds)

        outcome = build_task_outcome(
            objective="search documents for quarterly revenue",
            objective_met=None,
            completion_criteria=[{"kind": "source_scoped_retrieval"}],
            criterion_results=[],
            requested={"mentions": [], "task_mention": None,
                       "target_entities": ["quarterly revenue"],
                       "requested_attributes": []},
            source_constraints={},
            authorized_actions=["retrieve"],
            tool_outcomes=[self._none_row()],
            evidence_refs=[],
            objective_state={"goal": "search documents",
                             "target_entities": ["quarterly revenue"],
                             "requested_attributes": [],
                             "source_constraints": {},
                             "authorized_actions": ["retrieve"],
                             "deterministic": False},
            limitations=[],
            latency_s=1.0,
            failure_layer=None,
            failure_owner=None,
            scope={"user_id": "u", "workspace_id": "w"},
            execution_id="exec-none",
            turn_id="sess-none",
            policy_version="learning-loop-v1",
        )
        kinds = derive_success_kinds(outcome)
        assert kinds["task_success"] is not True, (
            "a None-verified receipt must never complete the task")
        tools = outcome["tool_outcomes"]
        assert all(t.get("verified") is None for t in tools
                   if t.get("tool") == "outlook"), (
            "normalization must not coerce None to True/False on the "
            "persisted record")

    def test_mixed_none_and_true_stays_unverified(self):
        """all-True is the only promotion path; a None in the mix keeps
        tool_success None (mirrors the harness aggregation)."""
        from core.task_outcome_contract import derive_success_kinds

        row = self._none_row()
        good = dict(row, tool="documents.grep", verified=True)
        kinds = derive_success_kinds({"tool_outcomes": [good, row],
                                      "delivery": {"delivered": True}})
        assert kinds["tool_success"] is None
        kinds2 = derive_success_kinds(
            {"tool_outcomes": [dict(row, verified=False)],
             "delivery": {"delivered": True}})
        assert kinds2["tool_success"] is False
