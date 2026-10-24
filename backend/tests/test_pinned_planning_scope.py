# -*- coding: utf-8 -*-
"""Scope-correct pin gating (owner-approved repair 2026-10-18).

The pin gate must resolve the SAME (workspace, tenant) handler the
structured dispatch will use. Providers registered through BYOK live in
scoped handlers; gating against the service's unscoped constructor
handler silently dropped the declared pin in live attempt 7, and the
unpinned fallback dispatched a different model to a different gateway.

Fakes only — no provider calls, no network.
"""
from __future__ import annotations

import asyncio

from core.llm import pinned_planning as pp


class _FakeHandler:
    def __init__(self, clients):
        self.clients = dict(clients)


class _FakeService:
    """Models LLMService._get_handler semantics for these tests:

    - no scope named -> the service's own (startup) handler;
    - a named scope -> its scoped handler, or ``None`` when unresolved
      (never the startup handler — a named scope cannot borrow another).
    """

    def __init__(self, startup=None, scoped=None, unresolved=()):
        self._startup = startup
        self._scoped = dict(scoped or {})
        self._unresolved = set(unresolved)
        self.scope_calls = []

    def _get_handler(self, workspace_id=None, tenant_id=None):
        self.scope_calls.append((workspace_id, tenant_id))
        if workspace_id is None and tenant_id is None:
            return self._startup
        key = (workspace_id, tenant_id)
        if key in self._unresolved:
            return None
        return self._scoped.get(key)


def _stub():
    return object()


def test_startup_lacks_provider_requested_workspace_has_it_pin_retained():
    service = _FakeService(
        startup=_FakeHandler({}),
        scoped={("ws-a", "t1"): _FakeHandler({"opencode-go": _stub()})})
    pin = pp.build_provider_model_pin(
        service, "opencode-go", "deepseek-v4-pro",
        workspace_id="ws-a", tenant_id="t1")
    assert pin == {"provider_model": ("opencode-go", "deepseek-v4-pro")}
    assert service.scope_calls[-1] == ("ws-a", "t1")


def test_startup_has_provider_requested_workspace_lacks_it_pin_refused():
    service = _FakeService(
        startup=_FakeHandler({"opencode-go": _stub()}),
        scoped={("ws-b", "t1"): _FakeHandler({})})
    assert pp.build_provider_model_pin(
        service, "opencode-go", "deepseek-v4-pro",
        workspace_id="ws-b", tenant_id="t1") == {}
    # Callers WITHOUT request scope keep the established behavior
    # byte-identically (the unscoped startup handler still decides).
    assert pp.build_provider_model_pin(
        service, "opencode-go", "deepseek-v4-pro") == {
            "provider_model": ("opencode-go", "deepseek-v4-pro")}
    assert service.scope_calls == [("ws-b", "t1"), (None, None)]


def test_two_overlapping_workspaces_retain_their_respective_scopes():
    service = _FakeService(
        startup=_FakeHandler({}),
        scoped={("ws-a", "t1"): _FakeHandler({"opencode-go": _stub()}),
                ("ws-b", "t1"): _FakeHandler({})})
    assert pp.build_provider_model_pin(
        service, "opencode-go", "deepseek-v4-pro",
        workspace_id="ws-a", tenant_id="t1") != {}
    assert pp.build_provider_model_pin(
        service, "opencode-go", "deepseek-v4-pro",
        workspace_id="ws-b", tenant_id="t1") == {}
    assert service.scope_calls == [("ws-a", "t1"), ("ws-b", "t1")]


def test_unresolved_scope_cannot_borrow_another_handler():
    service = _FakeService(
        startup=_FakeHandler({"opencode-go": _stub()}),
        unresolved=[("ws-gone", "t1")])
    assert pp.build_provider_model_pin(
        service, "opencode-go", "deepseek-v4-pro",
        workspace_id="ws-gone", tenant_id="t1") == {}
    # The gate consulted ONLY the named scope — never the startup handler.
    assert service.scope_calls == [("ws-gone", "t1")]


def test_local_only_policy_still_blocks_cloud_pins(monkeypatch):
    service = _FakeService(
        startup=_FakeHandler({}),
        scoped={("ws-a", "t1"): _FakeHandler({"opencode-go": _stub()})})
    import core.llm.byok_handler as byok

    monkeypatch.setattr(byok, "_local_only_blocks_provider",
                        lambda provider, *a, **k: True)
    assert pp.build_provider_model_pin(
        service, "opencode-go", "deepseek-v4-pro",
        workspace_id="ws-a", tenant_id="t1") == {}
    monkeypatch.setattr(byok, "_local_only_blocks_provider",
                        lambda provider, *a, **k: False)
    assert pp.build_provider_model_pin(
        service, "opencode-go", "deepseek-v4-pro",
        workspace_id="ws-a", tenant_id="t1") != {}


def test_unpinned_fallback_behavior_unchanged():
    class _Service:
        def __init__(self):
            self.calls = []

        async def generate_structured_response(self, **kwargs):
            self.calls.append(dict(kwargs))
            if kwargs.get("provider_model"):
                return None  # pinned attempt yields nothing
            return {"ok": True}

    # No pin -> exactly one unpinned call, scope forwarded.
    svc = _Service()
    result = asyncio.run(pp.pinned_structured_call(
        svc, prompt="p", response_model=dict,
        system_instruction="s", log_label="test",
        call_kwargs={}, workspace_id="ws-a", tenant_id="t1"))
    assert result == {"ok": True}
    assert len(svc.calls) == 1
    assert "provider_model" not in svc.calls[0]
    assert svc.calls[0]["workspace_id"] == "ws-a"
    assert svc.calls[0]["tenant_id"] == "t1"

    # Failed pin -> one unpinned retry that EXCLUDES the failed pin.
    svc2 = _Service()
    result2 = asyncio.run(pp.pinned_structured_call(
        svc2, prompt="p", response_model=dict,
        system_instruction="s", log_label="test",
        call_kwargs={"provider_model": ("opencode-go", "deepseek-v4-pro")},
        workspace_id="ws-a", tenant_id="t1"))
    assert result2 == {"ok": True}
    assert len(svc2.calls) == 2
    assert svc2.calls[0]["provider_model"] == (
        "opencode-go", "deepseek-v4-pro")
    assert "provider_model" not in svc2.calls[1]
    assert svc2.calls[1]["exclude_provider_model"] == (
        "opencode-go", "deepseek-v4-pro")
    assert svc2.calls[1]["workspace_id"] == "ws-a"


def test_resolve_pinned_provider_model_threads_scope(monkeypatch):
    service = _FakeService(
        startup=_FakeHandler({}),
        scoped={("ws-a", "t1"): _FakeHandler({"opencode-go": _stub()})})
    # Expired legacy "provider:model" form, scoped.
    monkeypatch.setenv("ATOM_TEST_PIN", "opencode-go:deepseek-v4-pro")
    assert pp.resolve_pinned_provider_model(
        service, "ATOM_TEST_PIN", "",
        workspace_id="ws-a", tenant_id="t1") == {
            "provider_model": ("opencode-go", "deepseek-v4-pro")}
    assert pp.resolve_pinned_provider_model(
        service, "ATOM_TEST_PIN", "",
        workspace_id="ws-other", tenant_id="t1") == {}
    # Bare model with a fallback provider, scoped.
    monkeypatch.setenv("ATOM_TEST_PIN2", "deepseek-v4-pro")
    assert pp.resolve_pinned_provider_model(
        service, "ATOM_TEST_PIN2", "", provider="opencode-go",
        workspace_id="ws-a", tenant_id="t1") == {
            "provider_model": ("opencode-go", "deepseek-v4-pro")}
    assert pp.resolve_pinned_provider_model(
        service, "ATOM_TEST_PIN2", "", provider="opencode-go") == {}


def test_plan_structured_threads_turn_scope_into_the_gate(monkeypatch):
    """The canvas planner's pin gate receives the turn's workspace/tenant
    (the same scope the dispatch receives)."""
    from core import chat_canvas_editor as cce

    monkeypatch.setenv("ATOM_ASYNC_EDIT_PLAN_MODEL",
                       "opencode-go/deepseek-v4-pro")
    recorded = {}

    def _gate(llm_service, provider, model, **kwargs):
        recorded["call"] = (provider, model, kwargs)
        return {}

    monkeypatch.setattr(pp, "build_provider_model_pin", _gate)

    class _Svc:
        async def generate_structured_response(self, **kwargs):
            return None

    asyncio.run(cce._plan_structured(
        _Svc(), prompt="x", response_model=dict,
        system_instruction="s", message="m",
        workspace_id="ws-a", tenant_id="t1"))
    assert recorded["call"] == (
        "opencode-go", "deepseek-v4-pro",
        {"workspace_id": "ws-a", "tenant_id": "t1"})
