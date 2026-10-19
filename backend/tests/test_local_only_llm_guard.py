# -*- coding: utf-8 -*-
"""Local-only provider boundary (owner directive 2026-10-15).

The documented local-only policy blocks cloud services (DeepSeek
included); the LLM layer previously never consulted the guard, so a
mounted cloud key, an operator pin, or the static fallback rotation
dispatched cloud calls under ATOM_LOCAL_ONLY=true. These tests pin the
seams without any model calls:

  1. classification is conservative (unknown providers are cloud);
  2. build_provider_model_pin refuses a cloud pin under local-only and
     still pins local providers;
  3. get_ranked_providers excludes cloud providers from the candidate
     pool under local-only;
  4. the handler's own provider_model consumption refuses a cloud pin
     that arrived by a path that skipped the pin gate (zero cloud
     dispatches).
"""
import os

os.environ.setdefault("TESTING", "1")

import pytest

from core.llm.byok_handler import (
    _local_only_blocks_provider,
    _provider_is_cloud,
)
from core.privsec.local_only_guard import LocalOnlyGuard


@pytest.fixture()
def local_only(monkeypatch):
    monkeypatch.setenv("ATOM_LOCAL_ONLY", "true")
    LocalOnlyGuard.reset_cache()
    yield
    monkeypatch.delenv("ATOM_LOCAL_ONLY", raising=False)
    LocalOnlyGuard.reset_cache()


@pytest.fixture()
def hybrid(monkeypatch):
    monkeypatch.setenv("ATOM_LOCAL_ONLY", "false")
    LocalOnlyGuard.reset_cache()
    yield
    monkeypatch.delenv("ATOM_LOCAL_ONLY", raising=False)
    LocalOnlyGuard.reset_cache()


def test_provider_classification_is_conservative():
    assert _provider_is_cloud("deepseek") is True
    assert _provider_is_cloud("openrouter") is True
    # unknown providers are NOT trusted to be local
    assert _provider_is_cloud("some-new-provider") is True
    assert _provider_is_cloud("ollama") is False
    assert _provider_is_cloud("local_259461a7") is False
    assert _provider_is_cloud(
        "journey-ollama",
        {"llama3.1:8b": {"provider_id": "journey-ollama"}}) is False


def test_pin_gate_refuses_cloud_under_local_only(local_only):
    from core.llm.pinned_planning import build_provider_model_pin

    class _H:
        clients = {"deepseek": object(), "local_x": object()}

    class _S:
        def _get_handler(self):
            return _H()

    assert build_provider_model_pin(
        _S(), "deepseek", "deepseek-v4-pro") == {}
    assert build_provider_model_pin(
        _S(), "local_x", "llama3.1:8b") == {
        "provider_model": ("local_x", "llama3.1:8b")}


def test_pin_gate_allows_cloud_without_local_only(hybrid):
    from core.llm.pinned_planning import build_provider_model_pin

    class _H:
        clients = {"deepseek": object()}

    class _S:
        def _get_handler(self):
            return _H()

    assert build_provider_model_pin(
        _S(), "deepseek", "deepseek-v4-pro") == {
        "provider_model": ("deepseek", "deepseek-v4-pro")}


@pytest.mark.asyncio
async def test_ranking_excludes_cloud_under_local_only(local_only, monkeypatch):
    from core.llm.byok_handler import BYOKHandler
    from core.llm import byok_handler

    handler = BYOKHandler(workspace_id="ws-lo", tenant_id="default",
                          provider_id="auto")
    handler.clients = {"deepseek": object(), "ollama": object(),
                       "local_abc": object()}

    # HERMETIC CANDIDATE SOURCE (integration finding, 2026-10-16): the
    # ranking loop iterates the pricing fetcher's cache, so this test's
    # outcome depended on the AMBIENT dev cache file — a stale partial
    # fetch (73 entries, no ollama models) emptied the local pool and
    # failed this test on a correctly-merged tree. Seed the cache here:
    # one cloud entry (the exclusion must be observable, not vacuous)
    # and two local entries (ollama + a registered-style local route).
    # No ambient file, no network refresh.
    class _Seeded:
        pricing_cache = {
            "deepseek/deepseek-v4-pro": {
                "litellm_provider": "deepseek",
                "max_input_tokens": 131072, "mode": "chat",
                "input_cost_per_token": 0.0000003,
                "output_cost_per_token": 0.0000012,
            },
            "ollama/llama3.1:8b": {
                "litellm_provider": "ollama",
                "max_input_tokens": 32768, "mode": "chat",
                "input_cost_per_token": 0.0,
                "output_cost_per_token": 0.0,
            },
            "local_abc/llama3.1:8b": {
                "litellm_provider": "local_abc",
                "max_input_tokens": 32768, "mode": "chat",
                "input_cost_per_token": 0.0,
                "output_cost_per_token": 0.0,
            },
        }

    def _no_refresh(*a, **k):
        return _Seeded()

    monkeypatch.setattr(
        byok_handler, "get_pricing_fetcher_initialized_sync",
        _no_refresh)
    ranked = await handler.get_ranked_providers(
        complexity="moderate", task_type="planning")
    providers = {str(p) for p, _m in (ranked or [])}
    assert "deepseek" not in providers, ranked
    assert providers, (
        "the local route must survive the exclusion")
    # STRENGTHENED (integration finding, 2026-10-16): the pool must be
    # local through and through — no ranked provider may classify as
    # cloud under local-only mode, whatever the candidate source.
    for p in providers:
        assert not _provider_is_cloud(p), (p, ranked)


@pytest.mark.asyncio
async def test_handler_refuses_a_cloud_pin_arriving_directly(local_only):
    """The handler's own consumption is the last seam: a cloud pin that
    skipped the pin gate must not dispatch — zero cloud calls."""
    from core.llm.byok_handler import BYOKHandler

    calls = {"cloud": 0, "local": 0}

    class _Client:
        def __init__(self, name):
            self.name = name

        async def create(self, *a, **k):
            calls[self.name] += 1
            raise RuntimeError(f"{self.name} was called")

    handler = BYOKHandler(workspace_id="ws-lo", tenant_id="default",
                          provider_id="auto")
    handler.clients = {"deepseek": _Client("cloud"),
                       "local_abc": _Client("local")}
    handler.async_clients = {"deepseek": _Client("cloud"),
                             "local_abc": _Client("local")}

    class _Model:
        pass

    try:
        await handler.generate_structured_response(
            prompt="{}", system_instruction="return {}",
            response_model=_Model,
            provider_model=("deepseek", "deepseek-v4-pro"),
        )
    except Exception:  # noqa: BLE001 — the call may raise; the PIN is the pin
        pass
    assert calls["cloud"] == 0, (
        "a cloud pin under local-only must never dispatch")
