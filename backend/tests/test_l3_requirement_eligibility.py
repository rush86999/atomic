"""L3 (F-R1) — requirement-driven tool eligibility for document asks.

Finding (repeatability run `repeatability_20261017_224802`, deployed
pilot `8c593e57031e`): the sourced-answer ask

    "search my uploaded documents for the launch code for project
     Zephyr-9 and tell me the code"

selected the **memory** lane in 2/3 repetitions — the answer content was
correct, but the turn's saved status resolved failed/unconfirmed (memory
carries no verified source records) — and **documents.search** in 1/3,
which validated. Root cause: the source-ask floor offered `memory` as a
candidate for an unnamed document ask, so a memory proposal counted as
"already served" and was never corrected.

Contract pinned here (source-ask floor: `core.chat_tool_planner.plan_tool_use`
+ `_source_service_candidates`):

* a document/sheet ask that REQUIRES source evidence is served only by
  lanes whose RESULT CONTRACT yields source records (documents /
  datasets) — the recollection lane is not a candidate for it;
* when the caller carries the ACCEPTED request's evidence requirement
  (``evidence_requirement``), its source kinds and obligation drive
  eligibility: an identical message with a different accepted requirement
  changes the eligible set, and an obligation the message does not spell
  out lexically is still an obligation;
* memory remains supported: it is the correspondence store for
  email/chat kinds, and the recollection lane for asks whose accepted
  requirement carries no evidence obligation.

Layer map: these tests pin the planner's eligibility decision
deterministically (the structured LLM proposal is the controlled external
response). The full planner→executor→settlement chain, including the
saved outcome, is driven in ``test_source_ask_tool_execution.py``.
"""

import asyncio
from unittest.mock import patch

import pytest

from core.chat_tool_planner import ToolPlan

DOC_ASK = ("Search my documents for anything about quarterly revenue "
           "and tell me what you find.")
ZEPHYR_ASK = ("search my uploaded documents for the launch code for "
              "project Zephyr-9 and tell me the code")
ZEPHYR_BARE = "Find the launch code for project Zephyr-9."
MEMORY_ASK = "What did we discuss last week about the supplier?"
EMAIL_ASK = "Search my emails for the Acme quote"


def _plan(service=None, intent="search", query="quarterly revenue"):
    return ToolPlan(use_tool=bool(service), service=service, intent=intent,
                    query=query, reason="test proposal")


def _requirement(sources, required=True, **overrides):
    req = {
        "required": required,
        "sources": list(sources),
        "file": None,
        "fields": [],
        "subjects": [],
        "identity": {"state": "kind_only", "candidates": []},
        "artifact_attached": False,
    }
    req.update(overrides)
    return req


def _run(message, proposed, requirement=None, platform=None, connected=()):
    """plan_tool_use with the structured proposal pinned and the service
    availability gates pinned to the test's own world."""
    import core.chat_tool_planner as ctp

    async def _structured(llm_service, *, prompt, response_model,
                          system_instruction, **_kw):
        return proposed

    def _platform():
        return list(platform) if platform is not None else [
            "memory", "documents", "datasets"]

    kwargs = {}
    if requirement is not None:
        kwargs["evidence_requirement"] = requirement

    async def _call():
        return await ctp.plan_tool_use(
            message, [], "user-x", object(), provenance="", **kwargs)

    with patch.object(ctp, "_structured_with_fallback", new=_structured), \
            patch.object(ctp, "get_connected_services",
                         return_value=list(connected)), \
            patch.object(ctp, "_available_platform_services",
                         side_effect=_platform), \
            patch.object(ctp, "_datasets_service_available",
                         return_value=True):
        return asyncio.run(_call())


def _service(plan):
    return plan.service if plan is not None else None


class TestEligibilityContract:
    """The F-R1 defect and the lanes memory must keep serving.

    These call ``plan_tool_use`` with the same signature the immutable
    parent has — they are the parent-failing regressions (the parent
    returns ``memory`` for an unnamed document ask)."""

    def test_memory_proposal_rejected_for_an_unnamed_document_ask(self):
        plan = _run(DOC_ASK, _plan("memory"))
        assert _service(plan) == "documents", (
            "a document evidence ask must execute a source-reading lane; "
            f"got {_service(plan)!r}")

    def test_zephyr_ask_memory_proposal_rejected(self):
        # THE preserved F-R1 request, verbatim.
        plan = _run(ZEPHYR_ASK, _plan("memory"))
        assert _service(plan) == "documents", (
            "the F-R1 sunk lane: memory must not substitute recollection "
            f"for the required document evidence; got {_service(plan)!r}")

    def test_valid_document_proposal_retained_without_a_repair_call(self):
        calls = []

        async def _repair(*a, **k):
            calls.append((a, k))
            return None

        import core.chat_tool_planner as ctp

        with patch.object(ctp, "_repair_plan_via_llm", new=_repair):
            plan = _run(DOC_ASK, _plan("documents", query="quarterly revenue"))
        assert _service(plan) == "documents"
        assert _service(plan) is not None and plan.use_tool is True
        assert calls == [], (
            "a valid document plan is served as-is — no extra planning pass")

    def test_legitimate_memory_ask_remains_supported(self):
        plan = _run(MEMORY_ASK, _plan("memory", query="supplier discussion"))
        assert _service(plan) == "memory", (
            "a recollection ask with no source obligation keeps the "
            f"memory lane; got {_service(plan)!r}")

    def test_correspondence_ask_keeps_memory(self):
        plan = _run(EMAIL_ASK, _plan("memory", query="Acme quote"))
        assert _service(plan) == "memory", (
            "the ingested mailbox IS the correspondence store — memory "
            f"stays a valid rung; got {_service(plan)!r}")

    def test_candidates_exclude_memory_for_required_document_evidence(self):
        import core.chat_tool_planner as ctp

        with patch.object(ctp, "_available_platform_services",
                          return_value=["memory", "documents", "datasets"]), \
                patch.object(ctp, "_datasets_service_available",
                             return_value=True):
            cands = ctp._source_service_candidates(["document"], [], DOC_ASK)
        assert "memory" not in cands, (
            f"memory has no document-source result contract; got {cands!r}")
        assert cands == ["documents", "datasets"] or cands == ["documents"]


class TestAcceptedRequirementAuthority:
    """When the accepted request's evidence requirement is carried, IT
    governs eligibility — the message is not re-interpreted beside the
    decision that was already accepted."""

    def test_document_requirement_corrects_memory_proposal(self):
        plan = _run(
            DOC_ASK, _plan("memory"),
            requirement=_requirement(["document"]))
        assert _service(plan) == "documents"

    def test_identical_message_requirement_changes_eligibility(self):
        # ONE message, three accepted requirements.
        doc = _run(DOC_ASK, _plan("memory"),
                   requirement=_requirement(["document"]))
        no_obligation = _run(
            DOC_ASK, _plan("memory"),
            requirement=_requirement([], required=False))
        comms = _run(DOC_ASK, _plan("memory"),
                     requirement=_requirement(["email"]))
        assert _service(doc) == "documents", (
            "a document-evidence obligation is served by a source-reading "
            f"lane; got {_service(doc)!r}")
        assert _service(no_obligation) == "memory", (
            "a requirement that carries no evidence obligation does not "
            f"conjure one; got {_service(no_obligation)!r}")
        assert _service(comms) == "memory", (
            "an accepted correspondence requirement is served by the "
            f"correspondence store; got {_service(comms)!r}")

    def test_requirement_obligation_without_message_nouns(self):
        # The message carries no source noun at all; the accepted
        # requirement does. The message-derived read alone would never
        # fire the floor here.
        plain = _run(ZEPHYR_BARE, _plan("memory"))
        required = _run(
            ZEPHYR_BARE, _plan("memory"),
            requirement=_requirement(["document"], fields=["launch code"]))
        assert _service(plain) == "memory", (
            "without an accepted obligation there is nothing to correct; "
            f"got {_service(plain)!r}")
        assert _service(required) == "documents", (
            "the accepted requirement's obligation must drive eligibility "
            f"even when the message names no source; got "
            f"{_service(required)!r}")

    def test_no_eligible_action_keeps_the_obligation_unresolved(self):
        # A world where only recollection is registered: nothing can
        # serve the requirement — the floor must not invent an action,
        # and the obligation stays recorded for settlement (honest
        # unresolved), never "satisfied" by the lookalike lane.
        import core.chat_tool_planner as ctp

        with patch.object(ctp, "_available_platform_services",
                          return_value=["memory"]):
            cands = ctp._source_service_candidates(
                ["document"], [], DOC_ASK, source_evidence_required=True)
        assert cands == [], (
            f"memory must not serve required document evidence; {cands!r}")
        plan = _run(DOC_ASK, _plan("memory"),
                    requirement=_requirement(["document"]),
                    platform=["memory"])
        assert _service(plan) == "memory", (
            "no eligible action exists: the floor stays out of the way "
            "(the obligation is settled as unresolved), it never invents "
            f"a service; got {_service(plan)!r}")

    def test_required_comms_requirement_keeps_memory(self):
        plan = _run(
            EMAIL_ASK, _plan("memory", query="Acme quote"),
            requirement=_requirement(["email"]))
        assert _service(plan) == "memory"

    def test_sheet_requirement_excludes_recollection(self):
        plan = _run(
            "Search my spreadsheets for the Q3 totals.",
            _plan("memory", query="Q3 totals"),
            requirement=_requirement(["spreadsheet"]))
        assert _service(plan) == "datasets", (
            "a required sheet-evidence obligation is served by the "
            f"dataset lane; got {_service(plan)!r}")

    def test_planner_and_stash_share_one_requirement_authority(self):
        """The planner's eligibility input and the outcome resolver's
        stash are BUILT from the same accepted decision — one authority,
        two consumers (a divergence would let eligibility and settlement
        disagree about the obligation)."""
        from integrations.chat_orchestrator import (
            _build_evidence_requirement,
            _stash_evidence_requirement,
        )

        decision = {
            "message": ZEPHYR_ASK,
            "requested_actions": [{"kind": "research"}],
            "references": {"sources": ["document"], "file": None},
        }
        session = {}
        stashed = _stash_evidence_requirement(
            session, "exec-l3", decision, ZEPHYR_ASK, True)
        built = _build_evidence_requirement(decision, ZEPHYR_ASK, True)
        assert stashed == built, (
            "the planner's requirement and the resolver's stash must be "
            "the same record")
        assert session["_evidence_requirement_exec-l3"] == built
        assert built["required"] is True
        assert built["sources"] == ["document"]
