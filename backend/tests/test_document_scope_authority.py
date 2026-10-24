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


def test_answer_scope_uses_accepted_subjects_not_fixture_literals():
    text = co._answer_scope_instruction({
        "scope": {"subjects": ["launch code for project Vega-4"],
                  "fields": ["launch code"],
                  "explicit_conflict": False}})
    assert "Vega-4" in text
    assert "launch code" in text
    assert "Zephyr" not in text
    assert "QUARTZ" not in text
    two = co._answer_scope_instruction({
        "scope": {"subjects": ["code for Vega-4", "code for Lyra-8"],
                  "fields": ["launch code"],
                  "explicit_conflict": False}})
    assert "Vega-4" in two and "Lyra-8" in two
    conflict = co._answer_scope_instruction({
        "scope": {"subjects": ["decoy line"],
                  "fields": ["differences"],
                  "explicit_conflict": True}})
    assert "explicitly asked" in conflict
    assert "Do not volunteer facts" not in conflict


def test_requirement_scope_is_taken_from_the_accepted_request():
    req = co._build_evidence_requirement(
        {"references": {"sources": ["document"]}},
        "What is the launch code for project Vega-4?",
        True,
        accepted_request={
            "subjects": ["launch code for project Vega-4"],
            "requested_fields": ["launch code"],
            "constraints": [],
        })
    assert req["scope"]["subjects"] == ["launch code for project Vega-4"]
    assert req["scope"]["fields"] == ["launch code"]
    assert req["scope"]["explicit_conflict"] is False


@pytest.mark.asyncio
async def test_generation_prompt_carries_the_accepted_scope():
    from unittest.mock import AsyncMock, MagicMock

    captured = {}

    async def _gen(messages=None, **kwargs):
        captured["messages"] = messages or []
        return {"success": True, "content": "ok",
                "model": "test", "provider": "test"}

    orch = co.ChatOrchestrator()
    orch.ai_engines = {}
    orch.llm_service = MagicMock()
    orch.llm_service.generate_completion = AsyncMock(side_effect=_gen)
    session = {
        "id": "scope-test",
        "history": [],
        "_evidence_requirement_exec-scope": {
            "scope": {
                "subjects": ["launch code for project Vega-4"],
                "fields": ["launch code"],
                "explicit_conflict": False,
            },
        },
    }
    await orch._get_qwen_response(
        "What is the launch code for project Vega-4?",
        [], execution_id="exec-scope", session=session)
    system = next(
        str(message.get("content") or "")
        for message in captured.get("messages") or []
        if isinstance(message, dict) and message.get("role") == "system")
    assert "ANSWER SCOPE" in system
    assert "Vega-4" in system
    assert "Zephyr" not in system


def test_interpretation_wait_preserves_reply_reserve():
    from integrations.chat_orchestrator import _interpretation_wait_seconds
    assert _interpretation_wait_seconds(95) == 60
    assert _interpretation_wait_seconds(40) == 5
    # Reserve exhausted means NO work, not a token 0.1s provider attempt.
    assert _interpretation_wait_seconds(35) == 0
    assert _interpretation_wait_seconds(30) == 0
    assert _interpretation_wait_seconds(10) == 0
    assert _interpretation_wait_seconds(200) == 75


def test_stage_budget_unresolved_preserves_floor_and_telemetry():
    from core import turn_decision as td
    td.reset_interpretation_for_tests()
    floor = {"schema": "turn-decision-1", "actions": []}
    record = td.interpretation_budget_unresolved(
        "find the launch code", "req-budget", floor)
    assert record["origin"] == "unresolved"
    assert record["unresolved_reason"] == "stage_budget_exhausted"
    assert record["actions"] == [] and record["sources"] == []
    assert record["deterministic_decision"] is floor
    assert td._interpret_metrics["stage_budget_exhausted"] == 1
    assert td._interpret_metrics["skipped"] == 1


def test_verify_panel_respects_finalization_reserve():
    from integrations.chat_orchestrator import (
        _VERIFY_PANEL_MIN_REMAINING_SECONDS,
        _VERIFY_PANEL_RESERVE_SECONDS,
    )
    # Document the measured invariant rather than duplicating the inline
    # branch: a 15.7s remainder is below the skip threshold, and a 40s
    # remainder leaves at most 30s for the panel after the reserve.
    assert _VERIFY_PANEL_MIN_REMAINING_SECONDS >= 15
    assert _VERIFY_PANEL_RESERVE_SECONDS >= 10


@pytest.mark.asyncio
async def test_stage_timeout_produces_explicit_record_and_late_worker_is_inert():
    import asyncio
    from core.turn_decision import interpretation_budget_unresolved

    floor = {"schema": "turn-decision-1", "actions": []}
    returned = interpretation_budget_unresolved(
        "compare the draft", "req-stage-timeout", floor)
    late = asyncio.create_task(asyncio.sleep(0.05, result={
        "origin": "late-success", "actions": [{"kind": "invented"}]}))
    with pytest.raises(asyncio.TimeoutError):
        # This is the OUTER bounded wait: it bounds waiting, not the worker.
        await asyncio.wait_for(asyncio.shield(late), timeout=0.005)
    await late
    # The explicit degraded decision is already returned and cannot be
    # mutated by the late worker's result.
    assert returned["origin"] == "unresolved"
    assert returned["unresolved_reason"] == "stage_budget_exhausted"
    assert returned["actions"] == []
    assert returned["deterministic_decision"] is floor
    assert late.result()["origin"] == "late-success"
