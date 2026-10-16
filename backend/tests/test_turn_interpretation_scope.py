# -*- coding: utf-8 -*-
"""The interpretation leg rides the REQUEST's scoped service — the public
topology, not the constructor's.

Verifier correction (2026-10-16): the public chat route serves EVERY
user through ONE module-level, default-scoped orchestrator
(``chat_routes.py:37`` — ``chat_orchestrator = ChatOrchestrator()``).
``self.llm_service`` therefore carries CONSTRUCTOR scope (default),
never the authenticated request's workspace/tenant. And
``get_llm_service()`` is a FACTORY returning a new default-scoped
instance (``llm_service.py:1852``) — so an omitted service argument
silently downgrades interpretation to the default scope while ordinary
chat dispatches from the user's own providers (J2 user-boundary).

Pinned here against the PUBLIC topology:
- ONE shared orchestrator serves user A (workspace ws-alpha) and user B
  (workspace ws-beta); each turn's interpretation call receives a
  service whose workspace AND tenant match THAT request, resolved
  through the real ``_request_llm_scope`` seam against scratch-DB user
  rows (TESTING=1; no provider, no live database);
- sequential and OVERLAPPING turns never adopt each other's scope;
- both default consultation routes are SENTRY-POISONED: the
  orchestrator's constructor-scoped ``generate_structured_response``
  and the ``get_llm_service`` factory raise if interpretation touches
  them;
- the floor is unchanged: an unavailable default factory yields the
  EXPLICIT unresolved record (never a crash, never a scope guess).
"""
import asyncio
import contextlib
import os
import sys
from unittest.mock import AsyncMock, patch

os.environ.setdefault("TESTING", "1")

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(
    __file__))))

import core.chat_canvas_editor as cce
from core import turn_decision as td
from integrations import chat_orchestrator as chat


class _FakeInterpretationService:
    """Counts structured-generation calls; never touches a provider."""

    def __init__(self, tag):
        self.tag = tag
        self.calls = []

    async def generate_structured_response(self, **kwargs):
        self.calls.append(kwargs)
        return {"actions": [{"kind": "conversation", "subjects": ["x"]}],
                "subjects": ["x"], "sources": [], "requested_fields": [],
                "output_format": "", "constraints": [],
                "scope_change": "continue", "confidence": 0.9}


@pytest.fixture(autouse=True)
def _fresh_interpretation_state():
    td.reset_interpretation_for_tests()
    yield
    td.reset_interpretation_for_tests()


# ---------------------------------------------------------------------------
# Contract: the supplied service is the consulted service
# ---------------------------------------------------------------------------

class TestSuppliedServiceIsTheConsultedService:
    @pytest.mark.asyncio
    async def test_two_workspaces_consult_their_own_instance(self):
        ws_a = _FakeInterpretationService("ws-a")
        ws_b = _FakeInterpretationService("ws-b")
        await td.interpret_turn_request(
            "Add the tax number to the quote", llm_service=ws_a)
        await td.interpret_turn_request(
            "Add the tax number to the quote", llm_service=ws_b)
        assert len(ws_a.calls) == 1 and len(ws_b.calls) == 1, (
            "each request's interpretation call must consult its own "
            "scoped service, never a default-scoped factory product")

    @pytest.mark.asyncio
    async def test_omitted_service_falls_back_and_unavailable_is_explicit(
            self):
        with patch("core.llm_service.get_llm_service",
                   side_effect=RuntimeError("factory unavailable")):
            record = await td.interpret_turn_request(
                "Add the tax number to the quote")
        assert record["scope_change"] == "unresolved"
        assert record["unresolved_reason"] == "llm_service_unavailable", (
            "an unavailable fallback is an EXPLICIT unresolved record — "
            "the deterministic floor stays in charge")


# ---------------------------------------------------------------------------
# Seam: the PUBLIC topology — one default orchestrator, request-scoped legs
# ---------------------------------------------------------------------------

_CANVAS_ID = "cv-interp-scope"
_QUOTE = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Unit price: $48,000.00\n")
_REQUEST_MSG = (
    "Add the client's tax registration number to this quotation. "
    "Use the exact number from our records.")
_USERS = {
    "user-interp-alpha": ("ws-alpha", "tenant-alpha"),
    "user-interp-beta": ("ws-beta", "tenant-beta"),
}


@pytest.fixture
def scoped_users():
    """Two users in DIFFERENT workspaces, seeded into the TESTING=1
    scratch database so ``_request_llm_scope`` resolves each request's
    scope through the real user rows."""
    from core.database import get_db_session
    from core.models import User

    with get_db_session() as db:
        for uid, (ws, tn) in _USERS.items():
            if db.query(User).filter(User.id == uid).first() is None:
                db.add(User(
                    id=uid, email=f"{uid}@interp-scope.test",
                    first_name="Interp", last_name="Scope",
                    role="member", status="active",
                    workspace_id=ws, tenant_id=tn))
        db.commit()
    yield _USERS
    with get_db_session() as db:
        db.query(User).filter(User.id.in_(list(_USERS))).delete(
            synchronize_session=False)
        db.commit()


class TestPublicTopologyRequestScope:
    @staticmethod
    async def _run_two_turns(overlap: bool):
        """ONE shared orchestrator (the chat_routes.py shape) serves both
        workspace users. The interpretation call is replaced by a
        recorder keyed on session id; both default consultation routes
        are poisoned."""
        orch = chat.ChatOrchestrator()
        recorded = {}

        async def _recording_interpret(*args, **kwargs):
            recorded[kwargs.get("session_id")] = kwargs.get("llm_service")
            return None  # unresolved-shaped: the deterministic floor runs

        sessions = {}

        def _session_for(user_id, session_id, context=None):
            return sessions.setdefault(
                str(session_id), {"id": str(session_id), "history": []})

        canvas = {"canvas_id": _CANVAS_ID, "canvas_type": "document",
                  "title": "Quotation Q-2026-114", "content": _QUOTE}

        with contextlib.ExitStack() as stack:
            for cm in (
                patch.object(orch, "_get_or_create_session",
                             side_effect=_session_for),
                patch.object(orch, "_resolve_canvas_ctx",
                             new=AsyncMock(return_value=dict(canvas))),
                patch.object(orch, "_record_chat_step", new=AsyncMock()),
                patch.object(orch, "_emit_agent_status", new=AsyncMock()),
                patch.object(orch, "_try_canvas_action", new=AsyncMock()),
                patch.object(orch, "_get_qwen_response",
                             new=AsyncMock(return_value={
                                 "content": "controlled reply",
                                 "success": True})),
                patch("core.chat_tool_planner.plan_tool_use",
                      new=AsyncMock(return_value=None)),
                patch("core.chat_tool_planner._provenance_menu",
                      new=AsyncMock(return_value="")),
                patch.object(cce, "fetch_fresh_data_section",
                             new=AsyncMock(return_value="")),
                patch.object(cce, "plan_canvas_edit",
                             new=AsyncMock(return_value=None)),
                # SENTRY 1: the CONSTRUCTOR-scoped service must never be
                # consulted by interpretation.
                patch.object(orch.llm_service,
                             "generate_structured_response",
                             side_effect=AssertionError(
                                 "interpretation consulted the "
                                 "constructor-scoped default service")),
                # SENTRY 2: the default factory must never be consulted —
                # a passed-None argument lands here.
                patch("core.llm_service.get_llm_service",
                      side_effect=AssertionError(
                          "interpretation consulted the default factory "
                          "(service argument was lost)")),
                patch("core.turn_decision.interpret_turn_request",
                      new=_recording_interpret),
            ):
                stack.enter_context(cm)
            if overlap:
                await asyncio.gather(
                    orch.process_chat_message(
                        "user-interp-alpha", _REQUEST_MSG,
                        "sess-interp-alpha",
                        context={"canvas_id": _CANVAS_ID}),
                    orch.process_chat_message(
                        "user-interp-beta", _REQUEST_MSG,
                        "sess-interp-beta",
                        context={"canvas_id": _CANVAS_ID}))
            else:
                await orch.process_chat_message(
                    "user-interp-alpha", _REQUEST_MSG, "sess-interp-alpha",
                    context={"canvas_id": _CANVAS_ID})
                await orch.process_chat_message(
                    "user-interp-beta", _REQUEST_MSG, "sess-interp-beta",
                    context={"canvas_id": _CANVAS_ID})
        return orch, recorded

    @staticmethod
    def _assert_own_scope(recorded):
        svc_a = recorded.get("sess-interp-alpha")
        svc_b = recorded.get("sess-interp-beta")
        assert svc_a is not None and svc_b is not None, (
            "both turns must reach the interpretation seam — a None "
            "record means the service argument was lost to a default "
            "route")
        assert svc_a.workspace_id == "ws-alpha", (
            f"user alpha's interpretation rode workspace "
            f"{svc_a.workspace_id!r}, not the request's own")
        assert svc_a.tenant_id == "tenant-alpha"
        assert svc_b.workspace_id == "ws-beta", (
            f"user beta's interpretation rode workspace "
            f"{svc_b.workspace_id!r}, not the request's own")
        assert svc_b.tenant_id == "tenant-beta"
        assert svc_a is not svc_b, (
            "two requests must never share one interpretation service")

    @pytest.mark.asyncio
    async def test_sequential_turns_each_use_their_own_request_scope(
            self, scoped_users):
        orch, recorded = await self._run_two_turns(overlap=False)
        self._assert_own_scope(recorded)
        assert recorded["sess-interp-alpha"] is not orch.llm_service, (
            "constructor scope (default) is not authenticated request "
            "scope")
        assert recorded["sess-interp-beta"] is not orch.llm_service

    @pytest.mark.asyncio
    async def test_overlapping_turns_never_adopt_each_others_scope(
            self, scoped_users):
        orch, recorded = await self._run_two_turns(overlap=True)
        self._assert_own_scope(recorded)
        assert recorded["sess-interp-alpha"] is not orch.llm_service
        assert recorded["sess-interp-beta"] is not orch.llm_service


# ---------------------------------------------------------------------------
# Composition: the REAL interpreter under a forced generation barrier
# ---------------------------------------------------------------------------

class TestRealInterpretationOverlapBarrier:
    """The REAL ``interpret_turn_request`` runs end-to-end; only
    structured GENERATION is replaced — by a controlled response behind
    an EVENT BARRIER. Both requests must be inside generation before
    either returns, so scope retention is proven ACROSS a suspension at
    the real boundary (``asyncio.gather`` alone only schedules
    concurrency — the barrier forces the overlap). The factory and the
    constructor-scope service stay poisoned: neither default
    consultation route may fire when the wiring forwards ``_scope_llm``.
    Providers and live storage stay out: generation returns a controlled
    record, and everything after it in the interpreter is in-memory."""

    @pytest.mark.asyncio
    async def test_both_requests_enter_generation_and_retain_their_scope(
            self, scoped_users):
        orch = chat.ChatOrchestrator()
        generation = []
        both_entered = asyncio.Event()
        arrived = {"n": 0}

        async def _controlled_generation(self, **kwargs):
            record = {
                "is_constructor_service": self is orch.llm_service,
                "workspace_at_entry": self.workspace_id,
                "tenant_at_entry": self.tenant_id,
            }
            generation.append(record)
            arrived["n"] += 1
            if arrived["n"] >= 2:
                both_entered.set()
            # THE BARRIER: hold every call inside generation until both
            # requests have entered — a real overlap at the boundary.
            await asyncio.wait_for(both_entered.wait(), timeout=10.0)
            # Re-read the scope AFTER the suspension: a service that
            # adopted the other request's scope would now differ.
            record["workspace_at_exit"] = self.workspace_id
            record["tenant_at_exit"] = self.tenant_id
            return {"actions": [{"kind": "conversation",
                                 "subjects": ["x"]}],
                    "subjects": ["x"], "sources": [],
                    "requested_fields": [], "output_format": "",
                    "constraints": [], "scope_change": "continue",
                    "confidence": 0.9}

        sessions = {}

        def _session_for(user_id, session_id, context=None):
            return sessions.setdefault(
                str(session_id), {"id": str(session_id), "history": []})

        canvas = {"canvas_id": _CANVAS_ID, "canvas_type": "document",
                  "title": "Quotation Q-2026-114", "content": _QUOTE}

        with contextlib.ExitStack() as stack:
            for cm in (
                patch.object(orch, "_get_or_create_session",
                             side_effect=_session_for),
                patch.object(orch, "_resolve_canvas_ctx",
                             new=AsyncMock(return_value=dict(canvas))),
                patch.object(orch, "_record_chat_step", new=AsyncMock()),
                patch.object(orch, "_emit_agent_status", new=AsyncMock()),
                patch.object(orch, "_try_canvas_action", new=AsyncMock()),
                patch.object(orch, "_get_qwen_response",
                             new=AsyncMock(return_value={
                                 "content": "controlled reply",
                                 "success": True})),
                patch("core.chat_tool_planner.plan_tool_use",
                      new=AsyncMock(return_value=None)),
                patch("core.chat_tool_planner._provenance_menu",
                      new=AsyncMock(return_value="")),
                patch.object(cce, "fetch_fresh_data_section",
                             new=AsyncMock(return_value="")),
                patch.object(cce, "plan_canvas_edit",
                             new=AsyncMock(return_value=None)),
                # SENTRY 1: the CONSTRUCTOR-scoped service instance never
                # serves structured generation.
                patch.object(orch.llm_service,
                             "generate_structured_response",
                             side_effect=AssertionError(
                                 "interpretation consulted the "
                                 "constructor-scoped default service")),
                # SENTRY 2: the default factory never answers — a lost
                # service argument lands here and fails the count below.
                patch("core.llm_service.get_llm_service",
                      side_effect=AssertionError(
                          "interpretation consulted the default factory "
                          "(service argument was lost)")),
                # THE ONLY REPLACED SEAM: class-level structured
                # generation behind the barrier. Parsing, validation,
                # metrics and the floor in interpret_turn_request are
                # REAL.
                patch("core.llm_service.LLMService."
                      "generate_structured_response",
                      new=_controlled_generation),
            ):
                stack.enter_context(cm)
            await asyncio.gather(
                orch.process_chat_message(
                    "user-interp-alpha", _REQUEST_MSG, "sess-interp-alpha",
                    context={"canvas_id": _CANVAS_ID}),
                orch.process_chat_message(
                    "user-interp-beta", _REQUEST_MSG, "sess-interp-beta",
                    context={"canvas_id": _CANVAS_ID}))

        assert arrived["n"] == 2 and len(generation) == 2, (
            "BOTH requests must reach real structured generation — a "
            "count below 2 means a service argument was lost to a "
            "default consultation route (poisoned: it would raise)")
        assert all(not r["is_constructor_service"] for r in generation), (
            "no generation may ride the constructor-scoped service")
        scopes = {(r["workspace_at_entry"], r["tenant_at_entry"])
                  for r in generation}
        assert scopes == {("ws-alpha", "tenant-alpha"),
                          ("ws-beta", "tenant-beta")}, (
            f"the two generations must carry the two requests' own "
            f"scopes, got {sorted(scopes)}")
        for r in generation:
            assert (r["workspace_at_entry"], r["tenant_at_entry"]) == (
                r["workspace_at_exit"], r["tenant_at_exit"]), (
                "scope must be retained ACROSS the generation barrier — "
                "entry and exit scopes differ, which is cross-request "
                "adoption")
        # The REAL interpreter parsed and accepted both records (the
        # per-test fixture reset these metrics; only a full ok path
        # increments "ok").
        assert td._interpret_metrics["ok"] == 2, (
            "the real interpretation path must complete for both "
            "requests, not just reach generation")
