# -*- coding: utf-8 -*-
"""Production-path controls for document-scoped authority.

A user naming an uploaded record without its extension must resolve to the
existing catalog identity; the accepted required read then owns the turn and
the legacy feature fan-out (entity search, placeholder analytics, agent
fallback) must not run merely because an older intent label said SEARCH.
"""
from __future__ import annotations

import asyncio

import pytest

import integrations.chat_orchestrator as co
from core.chat_tool_planner import enforce_required_read
from integrations.chat_orchestrator import ChatIntent, FeatureType


def test_catalog_resolves_uploaded_record_without_extension():
    rows = [{"id": "doc-1", "file_name": "release_smoke_record.txt",
             "title": None}]
    match = co._catalog_title_match(
        "What is the release smoke code in my uploaded release smoke "
        "record?", rows)
    assert match["state"] == "resolved"
    assert match["file_id"] == "doc-1"
    assert match["file_name"] == "release_smoke_record.txt"


def test_catalog_rejects_unrelated_or_ambiguous_matches():
    rows = [{"id": "doc-1", "file_name": "release_smoke_record.txt",
             "title": None}]
    assert co._catalog_title_match(
        "What is the weather tomorrow?", rows)["state"] == "none"
    ambiguous = rows + [
        {"id": "doc-2", "file_name": "release smoke record.pdf",
         "title": None}]
    assert co._catalog_title_match(
        "my uploaded release smoke record", ambiguous)["state"] == "ambiguous"


def test_requirement_adopts_a_resolved_catalog_mention(monkeypatch):
    monkeypatch.setattr(
        co, "_resolve_catalog_mention",
        lambda message, workspace_id: {
            "state": "resolved", "file_id": "doc-1",
            "file_name": "release_smoke_record.txt"})
    req = co._build_evidence_requirement(
        {"references": {"sources": [], "file": None}},
        "What is the code in my uploaded release smoke record?",
        False, workspace_id="ws-1")
    assert req["required"] is True
    assert req["sources"] == ["document"]
    assert req["file"]["resource_id"] == "doc-1"
    assert req["identity"]["state"] == "resolved"


def test_required_document_read_gets_the_documents_lane():
    plan = enforce_required_read(
        None,
        evidence_requirement={
            "required": True, "sources": ["document"],
            "file": {"file_name": "release_smoke_record.txt"},
            "identity": {"state": "resolved",
                         "file_name": "release_smoke_record.txt"}},
        connected=["documents", "memory"],
        message="What is the release smoke code in my uploaded record?")
    assert plan is not None
    assert plan.service == "documents"
    assert plan.intent == "search"


def _orch_with_handlers(called):
    orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)

    async def _search(*args, **kwargs):
        called.append("search")
        return {"success": True, "data": {}}

    async def _analytics(*args, **kwargs):
        called.append("analytics")
        return {"success": True, "data": {}}

    async def _agent(*args, **kwargs):
        called.append("agent")
        return {"success": True, "data": {}}

    orch.feature_handlers = {
        FeatureType.SEARCH: _search,
        FeatureType.AI_ANALYTICS: _analytics,
        FeatureType.AGENT: _agent,
    }
    return orch


@pytest.mark.asyncio
async def test_document_only_required_read_skips_legacy_fanout():
    called = []
    orch = _orch_with_handlers(called)
    out = await orch._route_to_features(
        "What is the code in my uploaded release smoke record?",
        {"primary_intent": ChatIntent.SEARCH_REQUEST},
        {}, {},
        evidence_requirement={"required": True,
                              "sources": ["document"]})
    assert out == {}
    assert called == []


@pytest.mark.asyncio
async def test_cross_source_request_keeps_its_mapped_features():
    called = []
    orch = _orch_with_handlers(called)
    await orch._route_to_features(
        "Compare the uploaded record with my email.",
        {"primary_intent": ChatIntent.SEARCH_REQUEST},
        {}, {},
        evidence_requirement={"required": True,
                              "sources": ["document", "email"]})
    assert called == ["search", "analytics"]


@pytest.mark.asyncio
async def test_slow_sync_entity_search_is_bounded(monkeypatch):
    import time
    monkeypatch.setattr(co, "_SEARCH_HANDLER_TIMEOUT_SECONDS", 0.05)

    class _SlowEngine:
        def search_unified_entities(self, message):
            time.sleep(0.5)
            return [{"id": "late"}]

    orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
    orch.ai_engines = {"data_intelligence": _SlowEngine()}
    started = time.monotonic()
    out = await orch._handle_search_request("q", {}, {}, {})
    elapsed = time.monotonic() - started
    assert out["success"] is False
    assert out["error"] == "search_timeout"
    assert elapsed < 0.3, elapsed


def test_required_query_drops_unsupported_fields():
    from core.chat_tool_planner import _required_read_query

    query = _required_read_query(
        {"subjects": [], "fields": ["version"],
         "identity": {"state": "resolved",
                      "file_name": "release_smoke_record.txt"}},
        "What is the release smoke code in my uploaded release smoke record?")
    assert "release smoke code" in query.casefold()
    assert "version" not in query.casefold()
    assert "release_smoke_record.txt" in query


def test_delivery_scope_prefers_row_scope():
    from integrations.chat_routes import _lifecycle_scope_for_run

    class _Row:
        tenant_id = "tenant-a"
        workspace_id = "workspace-a"

    assert _lifecycle_scope_for_run(
        "run-1", {"data": {}}, _Row()) == ("tenant-a", "workspace-a")


def test_resolved_document_overrides_a_dataset_proposal():
    from core.chat_tool_planner import ToolPlan, enforce_required_read

    proposal = ToolPlan(use_tool=True, service="datasets",
                        intent="search", query="release smoke code",
                        reason="optional planner")
    plan = enforce_required_read(
        proposal,
        evidence_requirement={
            "required": True, "sources": ["document"],
            "fields": ["version"], "subjects": [],
            "identity": {"state": "resolved", "file_id": "doc-1",
                         "file_name": "release_smoke_record.txt"}},
        connected=["documents", "datasets"],
        message="What is the release smoke code in my uploaded "
                "release smoke record?")
    assert plan is not None
    assert plan.service == "documents"
    assert "release smoke code" in plan.query.casefold()
    assert "version" not in plan.query.casefold()


def test_delivery_scope_falls_back_to_goal_run(monkeypatch):
    import core.database as _db
    from integrations.chat_routes import _lifecycle_scope_for_run

    class _Run:
        tenant_id = "tenant-run"
        workspace_id = "workspace-run"

    class _Query:
        def filter(self, *args, **kwargs):
            return self

        def first(self):
            return _Run()

    class _Session:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def query(self, *args, **kwargs):
            return _Query()

    monkeypatch.setattr(_db, "get_db_session", lambda: _Session())

    class _ChatMessage:
        tenant_id = "tenant-chat"
        # ChatMessage has no workspace_id — the run must supply it.

    assert _lifecycle_scope_for_run(
        "run-1", {"data": {}}, _ChatMessage()) == (
            "tenant-chat", "workspace-run")
