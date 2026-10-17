# -*- coding: utf-8 -*-
"""Documents search workspace scope — uploads must be visible to chat.

Found during the Phase E cloud loop: the browser uploaded a document through
the Documents UI (and the ingestion route) into the caller's per-workspace
LanceDB store, but the chat's ``documents.search`` vector leg opened the BASE
``atom_memory`` store (hardcoded ``get_lancedb_handler("default")``), so the
grounded turn answered "couldn't find any matching lines" with the document
sitting in the durable store. The lexical leg was similarly unscoped.

Contract pinned here:

* ``DocumentsHybridSearch(workspace_id=...)`` reads the workspace's own store
  in the vector leg (and passes the workspace to the lexical leg);
* the ``documents.search`` action resolves the workspace from the dispatch
  context, else the turn's published request scope — and passes it through;
* the legacy (flag-off) path filters both stores to the caller's workspace
  (knowledge rows may be unscoped/NULL, never another workspace's).
"""
import os

os.environ.setdefault("TESTING", "1")

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_vector_leg_uses_the_workspace_handler(monkeypatch):
    from core.hybrid_search import documents_hybrid as dh

    captured = {}

    def _fake_get_handler(workspace_id=None, **kwargs):
        captured["workspace_id"] = workspace_id
        handler = MagicMock()
        handler.search.return_value = [{"id": "doc_1", "_distance": 0.1}]
        return handler

    monkeypatch.setattr(
        "core.lancedb_handler.get_lancedb_handler", _fake_get_handler)
    monkeypatch.setattr(dh, "_vector_leg_enabled", lambda: True)

    svc = dh.DocumentsHybridSearch(workspace_id="ws-42")
    rows = await svc._vector_leg("zephyr launch code", limit=5)
    assert captured["workspace_id"] == "ws-42"
    assert rows and rows[0]["id"] == "doc_1"


@pytest.mark.asyncio
async def test_documents_search_action_passes_context_workspace(monkeypatch):
    from core import action_registry as ar

    seen = {}

    class _SpySearch:
        def __init__(self, **kwargs):
            seen.update(kwargs)

        async def search(self, **kwargs):
            return {"success": True, "results": [], "hybrid": "lexical_only"}

    monkeypatch.setattr(
        "core.knowledge_vfs_config.knowledge_vfs_enabled", lambda: True)
    with patch("core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
               _SpySearch):
        result = await ar._documents_search(
            {"query": "zephyr"}, {"workspace_id": "ws-ctx"})
    assert result["success"] is True
    assert seen.get("workspace_id") == "ws-ctx"


@pytest.mark.asyncio
async def test_documents_search_falls_back_to_request_scope(monkeypatch):
    from core import action_registry as ar
    from core.request_scope import reset_request_scope, set_request_scope

    seen = {}

    class _SpySearch:
        def __init__(self, **kwargs):
            seen.update(kwargs)

        async def search(self, **kwargs):
            return {"success": True, "results": [], "hybrid": "lexical_only"}

    monkeypatch.setattr(
        "core.knowledge_vfs_config.knowledge_vfs_enabled", lambda: True)
    token = set_request_scope("ws-scope", "t1")
    try:
        with patch("core.hybrid_search.documents_hybrid.DocumentsHybridSearch",
                   _SpySearch):
            await ar._documents_search({"query": "zephyr"}, {})
    finally:
        reset_request_scope(token)
    assert seen.get("workspace_id") == "ws-scope"


@pytest.mark.asyncio
async def test_zero_match_grep_falls_back_to_hybrid_search(monkeypatch):
    """A source-ask that greps the VFS to zero matches must consult the
    ingested-documents hybrid search before concluding nothing exists."""
    from types import SimpleNamespace

    from core import chat_tool_planner as ctp
    from core.action_registry import action_registry as ar

    plan = SimpleNamespace(
        service="documents", intent="search", use_tool=True,
        query="Search my documents for the Zephyr launch code")

    calls = []

    async def fake_execute(name, args, context):
        calls.append(name)
        if name == "documents.grep":
            return {"success": True, "pattern": "zephyr", "matches": []}
        if name == "documents.search":
            return {"success": True, "results": [{
                "source": "ingested", "id": "doc_1",
                "title": "zephyr_notes.md",
                "preview": "The launch code for project Zephyr-9 is "
                           "QUARTZ-77."}]}
        raise AssertionError(f"unexpected action {name}")

    monkeypatch.setattr(
        "core.knowledge_vfs_config.knowledge_vfs_enabled", lambda: True)
    monkeypatch.setattr(ar, "execute_action", fake_execute)

    block = await ctp._documents_vfs_block(plan, "u-1", {"workspace_id": "ws-1"})
    assert block and "QUARTZ-77" in block
    assert "documents.search" in calls
    receipt = (getattr(plan, "_result_meta", {}) or {}).get("documents_read") or {}
    assert receipt.get("executed") is True
    assert receipt.get("match_count") == 1


@pytest.mark.asyncio
async def test_legacy_path_filters_to_the_workspace(monkeypatch):
    from core import action_registry as ar

    ingested_q = MagicMock()
    ingested_q.all.return_value = []
    ingested_q.limit.return_value = ingested_q
    ingested_q.filter.return_value = ingested_q
    knowledge_q = MagicMock()
    knowledge_q.all.return_value = []
    knowledge_q.limit.return_value = knowledge_q
    knowledge_q.filter.return_value = knowledge_q

    db = MagicMock()
    db.query.side_effect = [ingested_q, knowledge_q]
    ctx_manager = MagicMock()
    ctx_manager.return_value.__enter__.return_value = db
    ctx_manager.return_value.__exit__.return_value = False

    monkeypatch.setattr(
        "core.knowledge_vfs_config.knowledge_vfs_enabled", lambda: False)
    with patch("core.database.get_db_session", ctx_manager):
        result = await ar._documents_search(
            {"query": "zephyr"}, {"workspace_id": "ws-legacy"})
    assert result["success"] is True
    # Base filter + workspace filter on each store.
    assert ingested_q.filter.call_count == 2
    assert knowledge_q.filter.call_count == 2


def test_upload_route_resolves_the_fk_first():
    """Documents-UI uploads must land in the user's FK workspace store — the
    relationship is empty for product-registered users, and relationship-only
    resolution wrote to default_shared while search read the user's store."""
    from types import SimpleNamespace

    from api.document_routes import _resolve_ws_id

    fk_user = SimpleNamespace(workspace_id="ws-fk", workspaces=[])
    assert _resolve_ws_id(fk_user) == "ws-fk"
    rel_user = SimpleNamespace(
        workspace_id=None, workspaces=[SimpleNamespace(id="ws-rel")])
    assert _resolve_ws_id(rel_user) == "ws-rel"
    assert _resolve_ws_id(None) is None


@pytest.mark.asyncio
async def test_upsert_document_forwards_the_freshness_stamp(monkeypatch):
    """Without freshness_status=='fresh' the search filter hides the row."""
    from api import document_routes as dr

    captured = {}

    async def fake_upsert(handler, **kwargs):
        captured.update(kwargs)
        return "written"

    monkeypatch.setattr("core.vector_upsert.upsert_document", fake_upsert)
    result = await dr._upsert_document(
        MagicMock(), text="body", doc_key="doc_1", source="upload:f.md",
        metadata={}, user_id="u-1", workspace_id="ws-1",
        extra_columns={"freshness_status": "fresh"},
    )
    assert result == "written"
    assert captured["extra_columns"] == {"freshness_status": "fresh"}
    assert captured["workspace_id"] == "ws-1"
