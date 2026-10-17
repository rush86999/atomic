# -*- coding: utf-8 -*-
"""The execution-keyed retrieval-source carrier (owner corrections C1–C5).

C1: the knowledge leg returns LINES only — the structured source
    observations travel through the explicit ``source_observations_out``
    parameter (the pre-fix leg returned ``lines, source_observations``
    with the name deleted: every successful retrieval raised).
C2: the session carrier is keyed ``_retrieval_source_observations_{eid}``
    — a later empty or skipped retrieval cannot inherit an earlier
    turn's sources, and the unscoped legacy key must not donate either.
C3: the durable outcome builder reads the same execution-keyed carrier
    and settles attributable ``context_source`` evidence refs.
C4: observations are committed only when the assembly produced a memory
    block (writer side; pinned at the seam below by the keying contract).
C5: each observation carries file_name and content_hash, not a
    source-category field.

These tests pin each link at the production seam: the real
``_knowledge_leg`` (with only the hybrid search patched) and the real
``ChatOrchestrator._build_turn_task_outcome``.
"""
import os
os.environ.setdefault("TESTING", "1")

import pytest
from unittest.mock import patch

import core.memory_context_assembler as mca
import integrations.chat_orchestrator as chat


def _hybrid_patch(results):
    class FakeHybrid:
        async def search(self, *args, **kwargs):
            return {"results": results}

    return patch(
        "core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
        FakeHybrid)


@pytest.mark.asyncio
async def test_knowledge_leg_lines_only_observations_via_out_param():
    """C1+C5: a successful retrieval renders lines, never observation
    dicts, and publishes structured identities through the out-param."""
    observations = []
    with _hybrid_patch([
        {"source": "knowledge/spec.md", "title": "Spec",
         "file_name": "spec.md", "content_hash": "hash-1",
         "preview": "rated capacity is 40 tons"},
        {"source": "knowledge/notes.md", "title": "Notes",
         "preview": "no explicit file identity here"},
    ]):
        lines = await mca._knowledge_leg(
            "what is the rated capacity", "ws-1",
            source_observations_out=observations)
    assert lines, "hits with previews must render"
    assert all(isinstance(line, str) for line in lines)
    # C5: file_name falls back to the TITLE (round-18 production
    # evidence: the hybrid search returns source="ingested" — a category
    # — for ingested docs; the title is the real document identity);
    # absent hash stays empty — never a source-category echo.
    identity = [{k: o[k] for k in ("source", "title", "file_name",
                                   "content_hash")}
                for o in observations]
    assert identity == [
        {"source": "knowledge/spec.md", "title": "Spec",
         "file_name": "spec.md", "content_hash": "hash-1"},
        {"source": "knowledge/notes.md", "title": "Notes",
         "file_name": "Notes", "content_hash": ""},
    ]
    # F-C2 extension (2026-10-17): each observation additionally carries
    # the authenticated workspace, the bounded excerpt that reached the
    # answer context, and the requested-field coverage.
    assert all(o["workspace_id"] == "ws-1" for o in observations)
    assert observations[0]["excerpt"].startswith("rated capacity")
    assert observations[0]["requested_fields"] == []
    assert observations[0]["supplied_fields"] == []


@pytest.mark.asyncio
async def test_knowledge_leg_never_echoes_source_category():
    """C5 (round-18 production evidence): ingested docs come back with
    the source CATEGORY in `source` — the file identity must come from
    file_name or title, never the category."""
    observations = []
    with _hybrid_patch([
        {"source": "ingested", "title": "Regional Office Directory",
         "preview": "Office manager: Priya Nair"},
    ]):
        await mca._knowledge_leg(
            "who manages ashford", "ws-1",
            source_observations_out=observations)
    assert observations[0]["file_name"] == "Regional Office Directory"
    assert observations[0]["source"] == "ingested"  # carried verbatim


@pytest.mark.asyncio
async def test_knowledge_leg_failure_yields_no_observations():
    """C1: a failed store must not leave partial observations behind."""
    class Boom:
        async def search(self, *args, **kwargs):
            raise RuntimeError("store down")

    observations = []
    with patch(
        "core.hybrid_search.documents_hybrid.DocumentsHybridSearch", Boom,
    ):
        lines = await mca._knowledge_leg(
            "q", "ws-1", source_observations_out=observations)
    assert lines == []
    assert observations == []


@pytest.mark.asyncio
async def test_knowledge_leg_empty_results_yield_no_observations():
    """C1: an empty result set is returned before any observation is
    published — an empty retrieval can never re-certify old sources."""
    observations = []
    with _hybrid_patch([]):
        lines = await mca._knowledge_leg(
            "q", "ws-1", source_observations_out=observations)
    assert lines == []
    assert observations == []


def _built_outcome(session, execution_id):
    orch = chat.ChatOrchestrator()
    return orch._build_turn_task_outcome(
        session,
        "what does the spec say",
        {"success": True, "message": "Here is what the spec says."},
        None,
        None,
        execution_id=execution_id,
    )


def _context_rows(outcome):
    return [
        t for t in (outcome.get("tool_outcomes") or [])
        if t.get("tool") == "context_assembly"
    ]


def test_builder_settles_context_sources_for_this_execution():
    """C3+C5: the current execution's carrier settles attributable
    context_source evidence refs in the durable outcome."""
    session = {
        "_retrieval_source_observations_exec-now": [
            {"source": "knowledge/spec.md", "title": "Spec",
             "file_name": "spec.md", "content_hash": "hash-1"},
        ],
    }
    outcome = _built_outcome(session, "exec-now")
    rows = _context_rows(outcome)
    assert len(rows) == 1
    assert rows[0]["outcome"] == "retrieved 1 source(s) into context"
    refs = rows[0]["evidence_refs"]
    # The contract normalizer keeps the attributable identities
    # (file_name, content_hash, source); title is display-only.
    assert refs == [{
        "kind": "context_source",
        "file_name": "spec.md",
        "content_hash": "hash-1",
        "source": "knowledge/spec.md",
    }]


def test_builder_ignores_a_stale_execution_carrier():
    """C2 at the consumer: another turn's observations are never this
    turn's evidence — an empty or skipped retrieval stays empty."""
    session = {
        "_retrieval_source_observations_exec-old": [
            {"source": "knowledge/old.md", "title": "Old",
             "file_name": "old.md", "content_hash": "hash-old"},
        ],
    }
    outcome = _built_outcome(session, "exec-now")
    assert _context_rows(outcome) == []


def test_builder_ignores_the_unscoped_legacy_key():
    """C2: the pre-fix unqualified key is dead — a stale session that
    still carries it must not donate sources to a new execution."""
    session = {
        "_retrieval_source_observations": [
            {"source": "knowledge/legacy.md", "title": "Legacy",
             "file_name": "legacy.md", "content_hash": "hash-legacy"},
        ],
    }
    outcome = _built_outcome(session, "exec-now")
    assert _context_rows(outcome) == []


def test_builder_without_execution_id_settles_nothing():
    """The writer never commits without an execution id (C4 gate), so a
    no-execution-id build can only ever see the legacy unscoped key —
    which must settle nothing."""
    session = {
        "_retrieval_source_observations": [
            {"source": "knowledge/x.md", "title": "X",
             "file_name": "x.md", "content_hash": "hash-x"},
        ],
    }
    outcome = _built_outcome(session, None)
    assert _context_rows(outcome) == []


# ---------------------------------------------------------------------------
# CALC-EVIDENCE WORKSPACE SCOPE (J5-r18: the finish lanes pass
# workspace_id=None while the calc lane's run lives in the user's
# resolved workspace — the builder's default-scoped lifecycle saw zero
# runs, so a succeeded calculation shipped with no expression_engine
# evidence, the stale datasets not_executed label survived, and
# objective_met stayed None).
# ---------------------------------------------------------------------------
def test_calc_evidence_resolves_through_the_users_workspace(monkeypatch):
    import integrations.chat_orchestrator as chat

    seen = {}

    class FakeLifecycle:
        def find_active_task(self, conversation_id):
            seen["conversation_id"] = conversation_id
            return {"run_id": "run-1"}

        def get_task(self, run_id):
            return {"operations": [{
                "operation_id": "op-1",
                "execution_id": "exec-calc",
                "calculation": {
                    "status": "succeeded",
                    "proposed": {"amount": 175},
                    "policy_id": "expression:QTY * UNIT_PRICE",
                    "result_id": "res-1",
                },
            }]}

    def fake_lifecycle_for(tenant_id, workspace_id):
        seen["workspace_id"] = workspace_id
        return FakeLifecycle()

    monkeypatch.setattr(chat, "_task_lifecycle_for", fake_lifecycle_for)

    # PRODUCTION SHAPE (J5-r18 second run): the finish lanes pass
    # NEITHER user_id NOR workspace_id — the session is the only carrier
    # of the user identity down to this builder.
    session = {"id": "conv-1", "user_id": "user-7"}
    orch = chat.ChatOrchestrator()
    outcome = orch._build_turn_task_outcome(
        session,
        "calculate expression QTY * UNIT_PRICE with QTY=7 UNIT_PRICE=25",
        {"success": True, "message": "Value (computed): 175"},
        None,
        None,
        execution_id="exec-calc",
        user_id=None,
        workspace_id=None,
    )
    # The scope contract: the lifecycle must be resolved through the
    # USER's workspace (from the session), not the "default" fallback.
    assert seen["workspace_id"] == chat.resolve_user_workspace("user-7")
    rows = outcome.get("tool_outcomes") or []
    calc_rows = [t for t in rows if t.get("tool") == "expression_engine"]
    assert calc_rows and calc_rows[0]["verified"] is True
    refs = calc_rows[0]["evidence_refs"]
    assert refs and refs[0]["kind"] == "calculation"
    assert refs[0]["operation_id"] == "op-1"
    assert refs[0]["result_id"] == "res-1"
    # The stale datasets not_executed label is dropped once real calc
    # evidence exists (owner R3).
    assert not [
        t for t in rows
        if t.get("tool") == "datasets"
        and t.get("outcome") == "not_executed"]
    # A delivered succeeded calculation completes the objective.
    assert outcome.get("objective_met") is True


def test_fallback_resolver_resolves_through_the_users_workspace(
        monkeypatch):
    import integrations.chat_orchestrator as chat

    seen = {}

    class FakeLifecycle:
        def find_active_task(self, conversation_id):
            return None  # no active binding; record stays None

    def fake_lifecycle_for(tenant_id, workspace_id):
        seen["workspace_id"] = workspace_id
        return FakeLifecycle()

    monkeypatch.setattr(chat, "_task_lifecycle_for", fake_lifecycle_for)

    state = chat._fallback_turn_outcome(
        {"session_id": "conv-9", "user_id": "user-7"},
        "exec-x", [], None, workspace_id=None)
    assert seen["workspace_id"] == chat.resolve_user_workspace("user-7")
    assert state["state"] in (
        "unconfirmed", "partial", "completed", "failed",
        "continuation_queued")


def test_canvas_context_source_is_recorded_for_no_live_evidence_turns():
    """The attached artifact as the basis of a no-live-evidence turn
    (owner R4 attribution; the 2026-10-15 J6 T2 evidence): presentation/
    self-contained turns record the canvas revision they were answered
    from on the SAME execution-keyed carrier the builder settles."""
    canvas = {"canvas_id": "cv-77", "canvas_type": "document",
              "title": "Quotation Q-2026-114", "content": "# Quotation ..."}
    session = {}
    chat.record_canvas_context_source(
        session, "exec-cv", canvas, no_live_evidence=True)
    key = "_retrieval_source_observations_exec-cv"
    assert key in session and len(session[key]) == 1
    ref = session[key][0]
    assert ref["source_id"] == "cv-77"
    assert ref["service"] == "canvas"
    assert ref["source_type"] == "artifact"
    assert ref["title"] == "Quotation Q-2026-114"


def test_canvas_context_source_never_replaces_the_assembler():
    """The assembler's own observations are the basis when present — the
    canvas is recorded only when no other source identity did."""
    session = {"_retrieval_source_observations_e2": [
        {"source_id": "file-1", "service": "documents"}]}
    chat.record_canvas_context_source(
        session, "e2", {"canvas_id": "cv-1", "content": "x"},
        no_live_evidence=True)
    assert session["_retrieval_source_observations_e2"] == [
        {"source_id": "file-1", "service": "documents"}]


def test_canvas_context_source_gates():
    """Evidence-required turns keep their lookup receipts; absent
    session/execution or content records nothing."""
    canvas = {"canvas_id": "cv-9", "content": "x"}
    s1 = {}
    chat.record_canvas_context_source(
        s1, "e3", canvas, no_live_evidence=False)
    assert s1 == {}
    s2 = {}
    chat.record_canvas_context_source(
        s2, None, canvas, no_live_evidence=True)
    assert s2 == {}
    s3 = {}
    chat.record_canvas_context_source(
        s3, "e4", {"canvas_id": "cv", "content": None},
        no_live_evidence=True)
    assert s3 == {}
