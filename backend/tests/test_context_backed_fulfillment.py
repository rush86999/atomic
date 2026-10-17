# -*- coding: utf-8 -*-
"""F-C2: context-backed fulfillment controls (2026-10-17).

Demonstrated failure (composed-job runs 1/2 on candidates e207494af /
6e740fc39): a request that NAMES an ingested source ("Compare the draft
quotation with my uploaded Approved Records document … does the Valid Until
date match?") was answered from THIS turn's verified context retrieval of
that source, with a correct delivered reply — and settled
success=false/outcome_unconfirmed, because the outcome resolver had no path
for "evidence-required request fulfilled by this turn's verified retrieval".

The repair separates the two facts:

* RETRIEVAL (matching identity + authenticated scope) proves the source was
  available to narration;
* FULFILLMENT requires the requested typed fields to have been supplied by
  the retrieved excerpt (recorded per observation by the assembler).

The resolver computes ONE verdict (carried on the outcome as
``context_fulfillment``); the durable builder CONSUMES it. Controls below:
positive completion; prior-turn observations cannot promote; wrong
source/workspace cannot promote; matching source without the finding cannot
certify; partial coverage maps to partial (with the gap named); assembly
failure donates nothing; the consumption helper binds execution + delivery.
Mutation guards: losing the writer's fulfillment persistence or the
matcher's identity/scope checks fails a control.
"""
import os

os.environ.setdefault("TESTING", "1")

from unittest.mock import AsyncMock, MagicMock, patch

EXEC = "exec-fc2-0001"
OTHER = "exec-fc2-0002"
WS = "ws-fc2"
FACT_EXCERPT = (
    "APPROVED RECORDS — Quotation Q-2026-114 Source: Sales Operations "
    "approved-terms register Client: Dunmore Fabrication LLC Item: CNC press "
    "brake Approved unit price: $48,000.00 Approved payment terms: Net 30 "
    "Approved valid until: 2026-12-31 Approved by: Sales Operations")
NO_FACT_EXCERPT = (
    "APPROVED RECORDS — Quotation Q-2026-114 Source: Sales Operations "
    "approved-terms register Client: Dunmore Fabrication LLC Item: CNC press "
    "brake Approved unit price: $48,000.00 (validity terms attached "
    "separately)")


def _requirement(required=True, sources=("document",),
                 fields=("expiration_date",)):
    return {"required": required, "sources": list(sources),
            "file": None, "fields": list(fields)}


def _observation(excerpt, supplied=("expiration_date",), source="ingested",
                 workspace=WS):
    return {"source": source, "title": "approved_records_q2026_114.txt",
            "file_name": "approved_records_q2026_114.txt",
            "content_hash": "", "workspace_id": workspace,
            "excerpt": excerpt, "requested_fields": ["expiration_date"],
            "supplied_fields": list(supplied)}


def _session(observations=None, requirement=None, **extra):
    s = {
        "id": "session-fc2", "user_id": None,
        f"_evidence_requirement_{EXEC}": (
            requirement if requirement is not None else _requirement()),
        f"_retrieval_source_observations_{EXEC}": (
            observations if observations is not None else [_observation(FACT_EXCERPT)]),
    }
    s.update(extra)
    return s


def _resolve(session, execution_id=EXEC):
    from integrations.chat_orchestrator import _fallback_turn_outcome

    return _fallback_turn_outcome(
        session, execution_id, feature_responses=None, context={},
        workspace_id=WS)


# ---------------------------------------------------------------------------
# 1. Current matching source + supported finding -> completed
# ---------------------------------------------------------------------------
def test_matching_source_with_supported_finding_completes():
    out = _resolve(_session())
    assert out["state"] == "completed", out
    assert out["delivered"] is True
    assert out["context_fulfillment"]["state"] == "completed"
    assert "expiration_date" in out["context_fulfillment"]["supplied_fields"]
    assert EXEC in out["execution_ids"]


# ---------------------------------------------------------------------------
# 2. Prior-turn observations / requirements -> cannot promote
# ---------------------------------------------------------------------------
def test_prior_turn_observations_cannot_promote():
    s = _session()
    s[f"_retrieval_source_observations_{OTHER}"] = [_observation(FACT_EXCERPT)]
    del s[f"_retrieval_source_observations_{EXEC}"]
    assert _resolve(s)["state"] != "completed"

    s2 = _session()
    del s2[f"_evidence_requirement_{EXEC}"]
    s2[f"_evidence_requirement_{OTHER}"] = _requirement()
    assert _resolve(s2)["state"] != "completed"


# ---------------------------------------------------------------------------
# 3. Wrong source or workspace -> cannot promote
# ---------------------------------------------------------------------------
def test_wrong_kind_cannot_promote():
    s = _session(observations=[_observation(FACT_EXCERPT,
                                            source="communication")])
    assert _resolve(s)["state"] != "completed"


def test_wrong_workspace_cannot_promote():
    s = _session(observations=[_observation(FACT_EXCERPT,
                                            workspace="ws-other")])
    assert _resolve(s)["state"] != "completed"


def test_unscoped_observation_cannot_promote():
    obs = _observation(FACT_EXCERPT)
    obs["workspace_id"] = None
    assert _resolve(_session(observations=[obs]))["state"] != "completed"


# ---------------------------------------------------------------------------
# 4. Matching source WITHOUT the requested finding -> cannot certify
# ---------------------------------------------------------------------------
def test_matching_source_without_the_finding_cannot_certify():
    s = _session(observations=[_observation(NO_FACT_EXCERPT, supplied=())])
    out = _resolve(s)
    assert out["state"] not in ("completed", "partial"), out


# ---------------------------------------------------------------------------
# 5. Partial coverage -> partial with the gap named; other obligations -> partial
# ---------------------------------------------------------------------------
def test_partial_coverage_maps_to_partial_and_names_the_gap():
    s = _session(
        requirement=_requirement(fields=("expiration_date", "price")),
        observations=[_observation(FACT_EXCERPT,
                                   supplied=("expiration_date",))])
    out = _resolve(s)
    assert out["state"] == "partial", out
    assert any("price" in w for w in out["open_work"]), out["open_work"]


def test_open_obligation_keeps_partial():
    s = _session()
    s["_last_open_work"] = {"actions": [
        {"next_action": "confirm the shipping address"}]}
    out = _resolve(s)
    assert out["state"] == "partial", out
    assert any("shipping" in w for w in out["open_work"])


# ---------------------------------------------------------------------------
# 6. Assembly failure -> no donated evidence
# ---------------------------------------------------------------------------
def test_assembly_failure_donates_nothing():
    # the writer (chat_orchestrator) only commits observations when the
    # assembled block reaches the answer context — an empty carrier is the
    # recorded shape of a failed assembly.
    s = _session(observations=[])
    assert _resolve(s)["state"] != "completed"


# ---------------------------------------------------------------------------
# 7. Reload consistency: the durable builder consumes the single decision
# ---------------------------------------------------------------------------
def _recorded(cf_state="completed"):
    return {
        "state": "completed", "delivered": True,
        "execution_ids": [EXEC],
        "context_fulfillment": {"state": cf_state,
                                "supplied_fields": ["expiration_date"]},
    }


def test_builder_consumption_binds_execution_and_delivery():
    from integrations.chat_orchestrator import _recorded_context_fulfillment

    response = {"_recorded_outcome": _recorded()}
    assert _recorded_context_fulfillment(response, EXEC) is not None
    # a different execution cannot consume this decision
    assert _recorded_context_fulfillment(response, OTHER) is None
    # an undelivered / non-completed decision cannot promote
    r2 = {"_recorded_outcome": {**_recorded(), "delivered": False}}
    assert _recorded_context_fulfillment(r2, EXEC) is None
    r3 = {"_recorded_outcome": {**_recorded(), "state": "partial"}}
    assert _recorded_context_fulfillment(r3, EXEC) is None
    # the fulfillment basis must itself be completed
    r4 = {"_recorded_outcome": _recorded(cf_state="partial")}
    assert _recorded_context_fulfillment(r4, EXEC) is None


# ---------------------------------------------------------------------------
# Writer persistence (mutation guard: losing these fields fails control 1)
# ---------------------------------------------------------------------------
def _fake_search(excerpt):
    svc = MagicMock()
    svc.search = AsyncMock(return_value={"results": [{
        "source": "ingested",
        "title": "approved_records_q2026_114.txt",
        "file_name": "approved_records_q2026_114.txt",
        "content_hash": "",
        "preview": excerpt,
    }]})
    return svc


import pytest  # noqa: E402


@pytest.mark.asyncio
async def test_knowledge_leg_persists_excerpt_scope_and_supplied_fields():
    from core import memory_context_assembler as mca

    obs = []
    with patch(
        "core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
        return_value=_fake_search(FACT_EXCERPT),
    ):
        await mca._knowledge_leg(
            "Compare the draft quotation with my uploaded Approved Records "
            "document. Does the Valid Until date in the draft match?",
            WS, source_observations_out=obs)
    assert obs, "no observation recorded"
    o = obs[0]
    assert o["workspace_id"] == WS
    assert "2026-12-31" in o["excerpt"]
    assert o["supplied_fields"] == ["expiration_date"], o


@pytest.mark.asyncio
async def test_knowledge_leg_records_no_supplied_field_without_the_value():
    from core import memory_context_assembler as mca

    obs = []
    with patch(
        "core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
        return_value=_fake_search(NO_FACT_EXCERPT),
    ):
        await mca._knowledge_leg(
            "Compare the draft quotation with my uploaded Approved Records "
            "document. Does the Valid Until date in the draft match?",
            WS, source_observations_out=obs)
    assert obs and obs[0]["supplied_fields"] == [], obs


def test_field_presence_shapes():
    from core.memory_context_assembler import field_present_in_excerpt

    assert field_present_in_excerpt(
        "Approved valid until: 2026-12-31", "expiration_date") is True
    assert field_present_in_excerpt(
        "the validity terms are attached separately", "expiration_date") is False
    assert field_present_in_excerpt(
        "Approved unit price: $48,000.00", "price") is True
    assert field_present_in_excerpt(
        "price to be confirmed", "price") is False
