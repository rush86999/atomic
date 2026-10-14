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
    assert observations == [
        {"source": "knowledge/spec.md", "title": "Spec",
         "file_name": "spec.md", "content_hash": "hash-1"},
        {"source": "knowledge/notes.md", "title": "Notes",
         "file_name": "Notes", "content_hash": ""},
    ]


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
