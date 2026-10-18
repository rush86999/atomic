# -*- coding: utf-8 -*-
"""F-C2: context-backed fulfillment controls (2026-10-17, gap-repair rev 2).

Demonstrated failure (composed-job runs 1/2, candidates e207494af /
6e740fc39): a request NAMING an ingested source ("Compare the draft
quotation with my uploaded Approved Records document … does the Valid Until
date match?") was answered from THIS turn's verified context retrieval of
that source with a correct delivered reply — and settled
success=false/outcome_unconfirmed.

Owner gap repairs (rev 2): the evidence feeding the single decision is
strengthened, not guarded downstream —

* NAMED-SOURCE IDENTITY: a named source resolves through catalog identity
  (exact normalized name); wrong document / ambiguous / unresolved never
  complete. Kind-only requests (no name given) match family + scope.
* ASSOCIATION-GRADE FULFILLMENT: per requested field, an association
  (anchor → value → span; subject-tied when the request names a subject).
  Negated/unknown fields stay unknown; unrelated values cannot fill them;
  fragments never combine across observations.
* COMPARISON: an attached artifact + a required source means both inputs
  were available — completion additionally requires the recorded comparison
  carrier for THIS execution with complete coverage.

Mutation guards: losing the writer's association persistence, the identity
check, or the subject binding fails a control below.
"""
import os

os.environ.setdefault("TESTING", "1")

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

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
                 fields=("expiration_date",), identity=None,
                 subjects=None, artifact_attached=False):
    return {"required": required, "sources": list(sources),
            "file": None, "fields": list(fields),
            "identity": identity or {"state": "kind_only", "candidates": []},
            "subjects": list(subjects or []),
            "artifact_attached": artifact_attached}


def _observation(excerpt, associations=None, source="ingested",
                 workspace=WS, file_name="approved_records_q2026_114.txt"):
    assoc = (associations if associations is not None else
             {"expiration_date": {"value": "2026-12-31",
                                  "span": [176, 186], "subject": None}})
    return {"source": source, "title": file_name,
            "file_name": file_name,
            "content_hash": "", "workspace_id": workspace,
            "excerpt": excerpt, "requested_fields": ["expiration_date"],
            "subjects": [], "field_associations": assoc,
            "supplied_fields": sorted(assoc.keys())}


def _complete_carrier():
    return {"coverage": {"outcome_count": 1, "outcomes": [
        {"status": "covered", "reasons": []}]}}


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
# 3. Wrong source family / workspace / scope -> cannot promote
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
# 4. Matching source WITHOUT the finding -> cannot certify
# ---------------------------------------------------------------------------
def test_matching_source_without_the_finding_cannot_certify():
    s = _session(observations=[_observation(NO_FACT_EXCERPT,
                                            associations={})])
    out = _resolve(s)
    # owner rule: unsupported associations remain PARTIAL with the
    # specific explanation — never completion.
    assert out["state"] == "partial", out
    assert any("expiration_date" in w for w in out["open_work"]), out


# ---------------------------------------------------------------------------
# 5. Partial coverage -> partial with the gap named; other obligations -> partial
# ---------------------------------------------------------------------------
def test_partial_coverage_maps_to_partial_and_names_the_gap():
    s = _session(
        requirement=_requirement(fields=("expiration_date", "price")),
        observations=[_observation(FACT_EXCERPT,
                                   associations={"expiration_date": {
                                       "value": "2026-12-31",
                                       "span": [176, 186], "subject": None}})])
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
    assert _resolve(_session(observations=[]))["state"] != "completed"


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
    assert _recorded_context_fulfillment(response, OTHER) is None
    r2 = {"_recorded_outcome": {**_recorded(), "delivered": False}}
    assert _recorded_context_fulfillment(r2, EXEC) is None
    r3 = {"_recorded_outcome": {**_recorded(), "state": "partial"}}
    assert _recorded_context_fulfillment(r3, EXEC) is None
    r4 = {"_recorded_outcome": _recorded(cf_state="partial")}
    assert _recorded_context_fulfillment(r4, EXEC) is None


# ---------------------------------------------------------------------------
# 8. WRONG NAMED DOCUMENT (same workspace + field) -> cannot complete
# ---------------------------------------------------------------------------
def test_wrong_named_document_cannot_complete():
    req = _requirement(identity={"state": "resolved", "file_id": "doc-A",
                                 "file_name": "approved_records_a.txt"})
    obs = _observation(FACT_EXCERPT,
                       file_name="document_b.txt")  # same field content
    assert obs["field_associations"]["expiration_date"]["value"] == "2026-12-31"
    assert _resolve(_session(observations=[obs],
                             requirement=req))["state"] != "completed"


def test_matching_named_document_completes():
    req = _requirement(identity={"state": "resolved", "file_id": "doc-A",
                                 "file_name": "approved_records_a.txt"})
    obs = _observation(FACT_EXCERPT, file_name="approved_records_a.txt")
    assert _resolve(_session(observations=[obs],
                             requirement=req))["state"] == "completed"


def test_ambiguous_and_unresolved_identity_are_partial_with_the_question():
    amb = _requirement(identity={"state": "ambiguous", "candidates": [
        {"file_id": "a", "file_name": "records_a.txt"},
        {"file_id": "b", "file_name": "records_b.txt"}]})
    out = _resolve(_session(requirement=amb))
    assert out["state"] == "partial", out
    assert any("which source" in w for w in out["open_work"]), out["open_work"]

    unr = _requirement(identity={"state": "unresolved",
                                 "names": ["records_z.txt"]})
    out2 = _resolve(_session(requirement=unr))
    assert out2["state"] == "partial", out2
    assert any("records_z" in w for w in out2["open_work"]), out2["open_work"]


def test_mention_filename_token_extraction():
    from integrations.chat_orchestrator import _mentions_to_filename_candidates

    got = _mentions_to_filename_candidates(
        ["draft quotation with the approved_records_q2026_114.txt"])
    assert got == ["approved_records_q2026_114.txt"], got


# ---------------------------------------------------------------------------
# 9. CORRECT DOCUMENT, WRONG SUBJECT -> cannot complete
# ---------------------------------------------------------------------------
def test_wrong_subject_cannot_complete():
    req = _requirement(subjects=["q-2026-114"])
    obs = _observation(FACT_EXCERPT, associations={
        "expiration_date": {"value": "2027-01-15", "span": [10, 20],
                            "subject": "q-2026-099"}})
    assert _resolve(_session(observations=[obs],
                             requirement=req))["state"] != "completed"


def test_correct_subject_completes():
    req = _requirement(subjects=["q-2026-114"])
    obs = _observation(FACT_EXCERPT, associations={
        "expiration_date": {"value": "2026-12-31", "span": [176, 186],
                            "subject": "q-2026-114"}})
    assert _resolve(_session(observations=[obs],
                             requirement=req))["state"] == "completed"


# ---------------------------------------------------------------------------
# 10. Requested field unknown, unrelated compatible value nearby
# ---------------------------------------------------------------------------
def test_unknown_field_with_unrelated_value_cannot_fill():
    from core.memory_context_assembler import (
        field_associations_for_excerpt,
    )

    assert field_associations_for_excerpt(
        "Expiration date: not supplied. Document created 2026-01-01.",
        ["expiration_date"]) == {}
    assert field_associations_for_excerpt(
        "Price: unknown. Quantity: 7.", ["price"]) == {}
    # the pinned positive still associates
    assoc = field_associations_for_excerpt(FACT_EXCERPT, ["expiration_date"])
    assert assoc["expiration_date"]["value"] == "2026-12-31"


# ---------------------------------------------------------------------------
# 11. Two records whose separate fragments would falsely combine
# ---------------------------------------------------------------------------
def test_fragments_never_combine_across_observations():
    obs_a = _observation("APPROVED RECORDS Unit price:", associations={},
                         file_name="a.txt")
    obs_b = _observation("$48,000.00", associations={}, file_name="b.txt")
    req = _requirement(fields=("price",))
    out = _resolve(_session(observations=[obs_a, obs_b],
                            requirement=req))
    # unsupported association -> partial with the named gap, never completed
    assert out["state"] == "partial", out
    assert any("price" in w for w in out["open_work"]), out


def test_association_span_does_not_cross_the_next_field_anchor():
    from core.memory_context_assembler import (
        field_associations_for_excerpt,
    )

    # the number belongs to Quantity's anchor; Price must not take it
    assert field_associations_for_excerpt(
        "Price: Quantity: 7", ["price"]) == {}


# ---------------------------------------------------------------------------
# 12. Both comparison inputs available, no recorded comparison result
# ---------------------------------------------------------------------------
def test_comparison_inputs_available_without_result_stays_partial():
    req = _requirement(artifact_attached=True)
    out = _resolve(_session(requirement=req))   # associations complete,
    assert out["state"] != "completed"          # but no carrier recorded
    assert out["state"] == "partial", out
    assert any("comparison" in w for w in out["open_work"]), out["open_work"]


def test_comparison_with_complete_recorded_result_completes():
    req = _requirement(artifact_attached=True)
    s = _session(requirement=req)
    s[f"_objective_evidence_{EXEC}"] = _complete_carrier()
    assert _resolve(s)["state"] == "completed"


def test_comparison_with_incomplete_carrier_cannot_complete():
    req = _requirement(artifact_attached=True)
    s = _session(requirement=req)
    s[f"_objective_evidence_{EXEC}"] = {"coverage": {
        "outcome_count": 2, "outcomes": [
            {"status": "covered", "reasons": []},
            {"status": "field_missing", "reasons": ["field_missing"]}]}}
    assert _resolve(s)["state"] != "completed"


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


@pytest.mark.asyncio
async def test_knowledge_leg_persists_association_grade_evidence():
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
    assoc = o["field_associations"]["expiration_date"]
    assert assoc["value"] == "2026-12-31"
    assert o["supplied_fields"] == ["expiration_date"], o


@pytest.mark.asyncio
async def test_knowledge_leg_unknown_field_persists_no_association():
    from core import memory_context_assembler as mca

    obs = []
    with patch(
        "core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
        return_value=_fake_search(
            "Expiration date: not supplied. Document created 2026-01-01."),
    ):
        await mca._knowledge_leg(
            "Compare the draft quotation with my uploaded Approved Records "
            "document. Does the Valid Until date in the draft match?",
            WS, source_observations_out=obs)
    assert obs and obs[0]["field_associations"] == {}, obs


def test_subject_extraction_drops_field_like_targets():
    from core.memory_context_assembler import subjects_for_message

    pinned = subjects_for_message(
        "Compare the draft quotation with my uploaded Approved Records "
        "document. Does the Valid Until date in the draft match?",
        ["expiration_date"])
    assert pinned == [], pinned          # "Valid Until" is the FIELD
    named = subjects_for_message(
        "Does Quotation Q-2026-114's valid until date match the approved "
        "record for Q-2026-114?",
        ["expiration_date"])
    assert any("q-2026-114" in s for s in named), named
    # reviewer F5 noise shape: adjective + REQUESTED-field tail is dropped
    assert subjects_for_message(
        "What is the current Valid until date on my uploaded "
        "Approved Records document?", ["expiration_date"]) == []
    assert subjects_for_message(
        "Please confirm the latest price on the draft.", ["price"]) == []
    # DELTA-REVIEW BLOCK regression: a real subject the extractor yields
    # must NEVER be dropped by the filter — the subject gate stays armed.
    from core.workbook_read_artifact import extract_targets

    for ask, keep in (
            ("Does the price for Acme Software match the approved record?",
             "acme software"),
            ("Check the Business Unit figures against the file.", "business unit"),
            ("Use the Tech Lead's order for the comparison.", "tech lead"),
            ("Compare the Front End module with the backend service.", "front end"),
            ("What does the West End branch record show?", "west end"),
            ("Match the Farm Hand equipment against the list.", "farm hand")):
        raw_norms = {str(t or "").strip().casefold()
                     for t in extract_targets([ask])}
        if keep in raw_norms:
            assert keep in subjects_for_message(ask, ["price"]), (
                f"the filter dropped a real subject the extractor yielded: "
                f"{ask!r} -> {subjects_for_message(ask, ['price'])!r}")


def test_anchor_word_boundaries_pinned():
    from core.memory_context_assembler import (
        field_associations_for_excerpt,
    )

    # "Updated" must not match the "date" alias; "listed" not "list"
    assert field_associations_for_excerpt(
        "Updated 2024-01-01", ["date"]) == {}
    assert field_associations_for_excerpt(
        "All items listed, code 7", ["price"]) == {}


def test_assembler_subject_gate_pinned():
    from core.memory_context_assembler import (
        field_associations_for_excerpt,
    )

    right = field_associations_for_excerpt(
        "Quotation Q-2026-114 approved valid until: 2026-12-31",
        ["expiration_date"], subjects=["q-2026-114"])
    assert right["expiration_date"]["subject"] == "q-2026-114"
    # the requested subject is absent -> no association at all
    assert field_associations_for_excerpt(
        "Quotation Q-2026-099 approved valid until: 2027-01-15",
        ["expiration_date"], subjects=["q-2026-114"]) == {}


def test_stash_seeds_identity_from_the_file_reference(monkeypatch):
    from integrations import chat_orchestrator as co

    monkeypatch.setattr(co, "_resolve_requirement_identity",
                        lambda names, ws: {"state": "unresolved",
                                           "names": list(names)})
    decision = {
        "message": "find the prices in the price list",
        "references": {"sources": ["spreadsheet"],
                       "file": {"kind": "spreadsheet",
                                "name": "price list 2019",
                                "resource_id": "doc-B"}},
    }
    session: dict = {"id": "s-fc2"}
    req = co._stash_evidence_requirement(
        session, EXEC, decision, decision["message"], True,
        workspace_id=WS)
    assert req is not None
    identity = req["identity"]
    assert identity["state"] == "resolved", identity
    assert identity["file_id"] == "doc-B", identity


def test_catalog_resolution_against_real_rows():
    from core.models import IngestedDocument
    from integrations.chat_orchestrator import _resolve_requirement_identity

    TestSession, original, db_module, engine = _scratch_db()
    try:
        db = TestSession()
        try:
            db.add(IngestedDocument(
                id="doc-A", workspace_id=WS, tenant_id="t",
                file_name="approved_records_a.txt", file_path="/tmp/a",
                file_type="text/plain", integration_id="upload",
                external_id="ext-a", content_preview="x"))
            db.commit()
        finally:
            db.close()
        got = _resolve_requirement_identity(
            ["approved_records_a.txt"], WS)
        assert got["state"] == "resolved", got
        assert got["file_name"] == "approved_records_a.txt"

        db = TestSession()
        try:
            db.add(IngestedDocument(
                id="doc-B", workspace_id=WS, tenant_id="t",
                file_name="approved_records_a.txt", file_path="/tmp/b",
                file_type="text/plain", integration_id="upload",
                external_id="ext-b", content_preview="y"))
            db.commit()
        finally:
            db.close()
        amb = _resolve_requirement_identity(
            ["approved_records_a.txt"], WS)
        assert amb["state"] == "ambiguous", amb

        # a DIFFERENT workspace's document never resolves for this scope
        miss = _resolve_requirement_identity(
            ["approved_records_a.txt"], "ws-other")
        assert miss["state"] == "unresolved", miss
    finally:
        db_module.engine, db_module.SessionLocal, db_module.get_db = original
        engine.dispose()


def test_understated_carrier_count_cannot_complete():
    req = _requirement(artifact_attached=True)
    s = _session(requirement=req)
    s[f"_objective_evidence_{EXEC}"] = {"coverage": {
        "outcome_count": 1, "outcomes": [
            {"status": "covered", "reasons": []},
            {"status": "field_missing", "reasons": ["field_missing"]}]}}
    assert _resolve(s)["state"] != "completed"


# ---------------------------------------------------------------------------
# F4 — the PRODUCTION stash and the durable BUILDER (not just the helpers)
# ---------------------------------------------------------------------------
PINNED_ASK = (
    "Compare the draft quotation with my uploaded Approved Records "
    "document. Does the Valid Until date in the draft match the approved "
    "record? Flag anything that differs. Do not change anything yet.")


def test_stash_records_the_request_requirement_from_the_real_decision():
    """The production stash, driven by the REAL deterministic decision for
    the pinned composed ask: kind-only identity (no file named, no file
    mention), the typed field, and no subjects (the field is not one)."""
    from core.turn_decision import (build_turn_decision,
                                    turn_evidence_required)
    from integrations.chat_orchestrator import _stash_evidence_requirement

    decision = build_turn_decision(PINNED_ASK, {}, [], {})
    session: dict = {"id": "s-fc2"}
    req = _stash_evidence_requirement(
        session, EXEC, decision, PINNED_ASK,
        turn_evidence_required(decision), workspace_id=WS,
        canvas_attached=True)
    assert req is not None
    assert req["required"] is True, req
    assert req["sources"] == ["document"], req
    assert req["fields"] == ["expiration_date"], req
    assert req["subjects"] == [], req
    assert req["identity"]["state"] == "kind_only", req
    assert req["artifact_attached"] is True
    assert session[f"_evidence_requirement_{EXEC}"] == req


def test_stash_resolves_a_named_source(monkeypatch):
    """A named source (file mention) resolves through the catalog step —
    patched here; the composed world exercises the catalog directly."""
    from core.turn_decision import (build_turn_decision,
                                    turn_evidence_required)
    from integrations import chat_orchestrator as co

    monkeypatch.setattr(co, "_resolve_requirement_identity",
                        lambda names, ws: {"state": "resolved",
                                           "file_id": "doc-A",
                                           "file_name": names[0]})
    ask = ("Compare the draft quotation with the "
           "approved_records_q2026_114.txt file. Does the Valid Until "
           "date match?")
    decision = build_turn_decision(ask, {}, [], {})
    session: dict = {"id": "s-fc2"}
    req = co._stash_evidence_requirement(
        session, EXEC, decision, ask, turn_evidence_required(decision),
        workspace_id=WS)
    assert req is not None
    assert req["identity"]["state"] == "resolved", req
    assert req["identity"]["file_name"].endswith(".txt"), req


def _scratch_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    import core.database as db_module
    from core.models import Base

    engine = create_engine("sqlite://",
                           connect_args={"check_same_thread": False},
                           poolclass=StaticPool)
    TestSession = sessionmaker(bind=engine, expire_on_commit=False)
    original = (db_module.engine, db_module.SessionLocal, db_module.get_db)
    db_module.engine = engine
    db_module.SessionLocal = TestSession
    Base.metadata.create_all(bind=engine)
    return TestSession, original, db_module, engine


def test_builder_carries_the_fulfillment_decision_durably():
    """The REAL builder over a scratch DB: the resolver's completed
    context-backed decision settles objective_met=True, the
    context_source_fulfillment criterion row (registered verifier), and
    the machine success signal derives task_success True instead of
    `no_verifier:`."""
    import integrations.chat_orchestrator as co
    from core.models import AgentExecution
    from core.llm_service import LLMService

    TestSession, original, db_module, engine = _scratch_db()
    try:
        session = _session()
        recorded = co._fallback_turn_outcome(
            session, EXEC, feature_responses=None, context={},
            workspace_id=WS)
        assert recorded["state"] == "completed", recorded
        response = {"_recorded_outcome": recorded,
                    "message": "The dates do not match."}
        db = TestSession()
        try:
            db.add(AgentExecution(id=EXEC, status="success",
                                  triggered_by="chat"))
            db.commit()
        finally:
            db.close()

        orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
        orch.tenant_id = "default"
        orch._cancelled_sessions = set()
        orch._budget_exceeded_runs = set()
        orch.llm_service = LLMService(tenant_id="default")
        orch._finish_chat_execution(
            EXEC, "completed", "summary", task_outcome=None,
            session=session, message=PINNED_ASK, response=response,
            ai_response=None, deadline=None, pending_task=None,
            user_id="u-fc2", workspace_id=WS,
            allow_persisted_evidence=False)

        db = TestSession()
        try:
            row = (db.query(AgentExecution)
                   .filter(AgentExecution.id == EXEC).first())
        finally:
            db.close()
        assert row is not None
        meta = row.metadata_json if isinstance(row.metadata_json, dict) else {}
        oc = meta.get("task_outcome") or {}
        assert oc.get("objective_met") is True, (
            f"the completed context-backed decision must settle "
            f"objective_met=true; got {oc.get('objective_met')!r}")
        kinds = {str((c or {}).get("kind"))
                 for c in (oc.get("completion_criteria") or [])}
        assert "context_source_fulfillment" in kinds, kinds
        rows = oc.get("criterion_results") or []
        mine = [r for r in rows
                if r.get("criterion") == "context_source_fulfillment"]
        assert mine and mine[0].get("met") is True, rows
        refs = mine[0].get("evidence_refs") or []
        assert refs and refs[0].get("kind") == "context_source", refs
        assert refs[0].get("file_name") == "approved_records_q2026_114.txt"
        sk = oc.get("success_kinds") or {}
        assert sk.get("task_success") is True, (
            f"the registered verifier must restore the machine success "
            f"signal; got {sk!r}")
    finally:
        db_module.engine, db_module.SessionLocal, db_module.get_db = original
        engine.dispose()


# ---------------------------------------------------------------------------
# F5 — the small guards, mutation-sensitively
# ---------------------------------------------------------------------------
def test_not_required_requirement_never_completes():
    s = _session(requirement=_requirement(required=False))
    out = _resolve(s)
    assert out["state"] != "completed"
    assert not out.get("context_fulfillment")


def test_fields_empty_is_retrieval_only_never_completed():
    s = _session(requirement=_requirement(fields=()))
    out = _resolve(s)
    assert out["state"] != "completed"
    assert out["context_fulfillment"]["state"] == "retrieval_only"


@pytest.mark.asyncio
async def test_empty_preview_hit_donates_nothing():
    from core import memory_context_assembler as mca

    obs = []
    with patch(
        "core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
        return_value=_fake_search(""),
    ):
        lines = await mca._knowledge_leg(
            "Compare the draft quotation with my uploaded Approved Records "
            "document.", WS, source_observations_out=obs)
    assert obs == [], obs
    assert lines == [] or all(isinstance(l, str) for l in lines)
