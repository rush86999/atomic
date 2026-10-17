# -*- coding: utf-8 -*-
"""F5 — local planning eligibility (Phase D finding, repaired).

Failing shape (candidate 68729ebe4, ``ATOM_LOCAL_ONLY=true``, healthy
``llama3.1:8b``): the structured/planning leg ranked ZERO candidates
("BPC cost-priority: NO candidate clears quality floor 85 ... ranking all
0 candidates by cost") and the turn ended with the ``no_llm_provider``
sentinel — while the SAME turn's explicit stream leg served from ollama in
the same window. Root cause: the auto-initialized local runtime never
entered the BPC candidate pool (the public pricing cache carries no entry
attributable to it).

Repair contract pinned here THROUGH the real ranking/dispatch path:

* healthy runtime (probe UP + the declared model actually pulled) → the
  route enters the pool, survives the quality/capability/plan gates, and
  is returned by ``get_optimal_provider``;
* probe DOWN, model not pulled, unknown model → nothing is admitted; an
  unavailable local runtime stays a truthful no-provider outcome;
* mixed mode (local-only off) → ranking unchanged (no silent admission);
* the LOCAL-ONLY boundary still blocks cloud providers on the fallback path.
"""
import os

os.environ.setdefault("TESTING", "1")

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from core.llm.byok_handler import (
    BYOKHandler,
    NoProvidersConfiguredError,
    QueryComplexity,
)

LOCAL_MODEL = "llama3.1:8b"
LOCAL_PROVIDER = "ollama"


def _handler(workspace_id="ws-f5") -> BYOKHandler:
    return BYOKHandler(
        workspace_id=workspace_id, tenant_id="tenant-f5", provider_id="auto")


def _set_local_only(value: bool) -> None:
    os.environ["ATOM_LOCAL_ONLY"] = "true" if value else "false"
    from core.privsec.local_only_guard import LocalOnlyGuard

    LocalOnlyGuard.reset_cache()


@pytest.fixture(autouse=True)
def _restore_local_only():
    yield
    os.environ.pop("ATOM_LOCAL_ONLY", None)
    from core.privsec.local_only_guard import LocalOnlyGuard

    LocalOnlyGuard.reset_cache()


def _freeze_pool(handler: BYOKHandler, monkeypatch, models=None):
    """Deterministic offline pricing pool (same pattern as
    ``test_structured_dispatch_policy``): no network source, no DB reload."""
    from core.dynamic_pricing_fetcher import get_pricing_fetcher

    fetcher = get_pricing_fetcher()

    async def _empty():
        return {}

    monkeypatch.setattr(fetcher, "fetch_litellm_pricing", _empty)
    monkeypatch.setattr(fetcher, "fetch_openrouter_pricing", _empty)
    monkeypatch.setattr(fetcher, "fetch_opencode_pricing", _empty)
    fetcher.last_fetch = None
    fetcher.pricing_cache = dict(models or {})
    monkeypatch.setattr(
        "core.dynamic_pricing_fetcher._pricing_initialized", True)
    monkeypatch.setattr(
        "core.llm.byok_handler.get_pricing_fetcher_initialized_sync",
        lambda auto_refresh=True, force_refresh=False: fetcher,
    )
    monkeypatch.setattr(handler, "_load_local_providers", lambda: None)
    handler.clients = {}
    handler.async_clients = {}
    return fetcher


def _set_probe(handler: BYOKHandler, monkeypatch, state, pulled):
    monkeypatch.setattr(
        handler, "_ollama_runtime_state", lambda: (state, set(pulled)))


def _plan(handler: BYOKHandler):
    return handler.get_ranked_providers(
        QueryComplexity.SIMPLE,
        task_type="planning",
        tenant_plan="free",
        is_managed_service=True,
        requires_tools=True,
        requires_structured=True,
    )


class TestHealthyLocalPositive:
    def test_local_only_planning_ranks_the_healthy_runtime(self, monkeypatch):
        _set_local_only(True)
        handler = _handler()
        _freeze_pool(handler, monkeypatch)
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        _set_probe(handler, monkeypatch, "up", {LOCAL_MODEL, "llama3.1"})

        pairs = [(p, m) for p, m in _plan(handler)]
        assert (LOCAL_PROVIDER, LOCAL_MODEL) in pairs, (
            "the healthy local runtime's declared, pulled model must reach "
            f"the planning pool; got {pairs}")

    def test_optimal_provider_returns_the_local_route(self, monkeypatch):
        _set_local_only(True)
        handler = _handler()
        _freeze_pool(handler, monkeypatch)
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        _set_probe(handler, monkeypatch, "up", {LOCAL_MODEL, "llama3.1"})

        chosen = handler.get_optimal_provider(
            QueryComplexity.SIMPLE, "planning", True, "free", True,
            requires_tools=True, requires_structured=True,
        )
        assert tuple(chosen) == (LOCAL_PROVIDER, LOCAL_MODEL), (
            f"the planning dispatch must select the local route; got {chosen}")

    def test_provider_serves_model_agrees_with_the_probe(self, monkeypatch):
        _set_local_only(True)
        handler = _handler()
        _freeze_pool(handler, monkeypatch)
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        _set_probe(handler, monkeypatch, "up", {LOCAL_MODEL, "llama3.1"})
        assert handler._provider_serves_model(LOCAL_PROVIDER, LOCAL_MODEL)
        assert not handler._provider_serves_model(
            LOCAL_PROVIDER, "mixtral:8x7b"), (
            "an identifier the runtime does not advertise stays excluded")


class TestUnavailableNegatives:
    def test_probe_down_admits_nothing(self, monkeypatch):
        _set_local_only(True)
        handler = _handler()
        _freeze_pool(handler, monkeypatch)
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        _set_probe(handler, monkeypatch, "down", set())

        pairs = [(p, m) for p, m in _plan(handler)]
        assert (LOCAL_PROVIDER, LOCAL_MODEL) not in pairs
        with pytest.raises(NoProvidersConfiguredError):
            tuple(handler.get_optimal_provider(
                QueryComplexity.SIMPLE, "planning", True, "free", True,
                requires_tools=True, requires_structured=True))

    def test_model_not_pulled_is_not_admitted(self, monkeypatch):
        _set_local_only(True)
        handler = _handler()
        _freeze_pool(handler, monkeypatch)
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        _set_probe(handler, monkeypatch, "up", {"qwen3:4b"})

        pairs = [(p, m) for p, m in _plan(handler)]
        assert (LOCAL_PROVIDER, LOCAL_MODEL) not in pairs, (
            "the declared model is only admitted when the runtime actually "
            f"serves it; got {pairs}")
        assert not handler._provider_serves_model(LOCAL_PROVIDER, LOCAL_MODEL)


class TestDocumentedDefaultModel:
    def test_ollama_model_unset_admits_the_documented_default(self, monkeypatch):
        """The quickstart-generated .env does not set OLLAMA_MODEL; the
        product's documented default for the auto runtime is llama3:8b
        (settings_catalog / byok_endpoints). With that model pulled and
        OLLAMA_MODEL unset, the planning pool must contain it — the exact
        documented configuration the F5 regression covers."""
        _set_local_only(True)
        monkeypatch.delenv("OLLAMA_MODEL", raising=False)
        handler = _handler()
        _freeze_pool(handler, monkeypatch)
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        _set_probe(handler, monkeypatch, "up", {"llama3", "llama3:8b"})

        pairs = [(p, m) for p, m in _plan(handler)]
        assert (LOCAL_PROVIDER, "llama3:8b") in pairs, (
            f"the documented default must be admitted when pulled; got {pairs}")

    def test_fallback_never_returns_an_unserved_local_pair(self, monkeypatch):
        """Probe up but the declared model NOT pulled: the absolute fallback
        must skip the pair (a local probe is authoritative — 'unserved', not
        'unknown'), so the turn reports truthful unavailability."""
        _set_local_only(True)
        monkeypatch.delenv("OLLAMA_MODEL", raising=False)
        handler = _handler()
        _freeze_pool(handler, monkeypatch)
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        _set_probe(handler, monkeypatch, "up", {"qwen3:4b"})

        with pytest.raises(NoProvidersConfiguredError):
            tuple(handler.get_optimal_provider(
                QueryComplexity.SIMPLE, "planning", True, "free", True,
                requires_tools=False, requires_structured=False))


class TestMixedModeUnchanged:
    def test_no_admission_outside_local_only(self, monkeypatch):
        _set_local_only(False)
        handler = _handler()
        _freeze_pool(handler, monkeypatch, models={
            "gpt-4o-mini": {
                "litellm_provider": "openai",
                "max_input_tokens": 128000,
                "supports_tools": True,
            },
        })
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        handler.clients["openai"] = MagicMock()
        _set_probe(handler, monkeypatch, "up", {LOCAL_MODEL, "llama3.1"})

        pairs = [(p, m) for p, m in _plan(handler)]
        assert ("openai", "gpt-4o-mini") in pairs, (
            f"mixed-mode ranking is unchanged; got {pairs}")
        assert (LOCAL_PROVIDER, LOCAL_MODEL) not in pairs, (
            "the runtime stamp is scoped to local-only mode — mixed-mode "
            f"routing must not silently change; got {pairs}")

    def test_cloud_fallback_blocked_under_local_only(self, monkeypatch):
        _set_local_only(True)
        handler = _handler()
        _freeze_pool(handler, monkeypatch, models={
            "gpt-4o-mini": {
                "litellm_provider": "openai",
                "max_input_tokens": 128000,
                "supports_tools": True,
            },
        })
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        handler.clients["openai"] = MagicMock()
        _set_probe(handler, monkeypatch, "down", set())

        with pytest.raises(NoProvidersConfiguredError):
            tuple(handler.get_optimal_provider(
                QueryComplexity.SIMPLE, "planning", True, "free", True,
                requires_tools=False, requires_structured=False)), (
                "with the local runtime down, the fallback path must not "
                "re-admit a cloud provider under local-only policy")

    def test_local_route_is_plan_exempt_in_mixed_mode(self, monkeypatch):
        """Local hardware bills nobody: the free-plan allowlist must not
        hide it — the registered-local rule, applied to the auto runtime
        (pinned; review finding 10)."""
        _set_local_only(False)
        handler = _handler()
        _freeze_pool(handler, monkeypatch, models={
            "llama-3.3-70b-versatile": {
                "litellm_provider": "ollama",
                "max_input_tokens": 128000,
                "supports_tools": True,
            },
        })
        handler.clients[LOCAL_PROVIDER] = MagicMock()
        _set_probe(handler, monkeypatch, "up", {"llama-3.3-70b-versatile"})

        pairs = [(p, m) for p, m in _plan(handler)]
        assert (LOCAL_PROVIDER, "llama-3.3-70b-versatile") in pairs, (
            "the free-plan allowlist must not hide the workspace's own "
            f"local hardware; got {pairs}")
