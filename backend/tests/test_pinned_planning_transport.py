# -*- coding: utf-8 -*-
"""Controlled transport regression for the pinned canvas planner
(owner-approved verification 2026-10-18).

Proves, at the constructed-client / wire boundary and without network or
real credentials, that:

  1. the CLIENT is constructed against the declared isolated Go base URL
     (``OPENCODE_BASE_URL``) with the required ``User-Agent`` and
     ``x-opencode-session`` headers;
  2. a pinned dispatch sends the INTENDED model (``deepseek-v4-pro``) to
     ``/chat/completions`` on that URL, through the workspace-scoped
     handler (the session header carries the workspace);
  3. a failed pin falls back WITHOUT disguising the fallback as the
     pinned route: the retry excludes the failed pin, dispatches a
     different model, and — when that route is also incompatible — the
     result is ``None`` (no plan is produced or relabelled).

The Go endpoint is confined to this test's configuration; no product
code path hardcodes it.
"""
from __future__ import annotations

import asyncio
import json

import httpx
import pytest
from pydantic import BaseModel

import core.llm.byok_handler as byok
from core.llm.byok_handler import BYOKHandler
from core.llm.pinned_planning import pinned_structured_call

GO_BASE_URL = "https://opencode.ai/inference/go/openai/v1"
PIN = ("opencode-go", "deepseek-v4-pro")
WORKSPACE = "ws-transport"
DUMMY_KEY = "sk-test-opencode-go-not-a-secret-0123456789"


@pytest.fixture(autouse=True)
def _fresh_route_state():
    """Cooldowns/catalogues/backoffs are process-wide; each transport test
    must start from a fresh routing state or a prior test's mock catalogue
    and discovery backoff leak into it."""
    import core.llm.byok_handler as byok_mod

    BYOKHandler.invalidate_provider_failures()
    with byok_mod._DISCOVERY_REFRESH_LOCK:
        byok_mod._DISCOVERY_REFRESH_ATTEMPTED_AT.clear()
    yield
    BYOKHandler.invalidate_provider_failures()
    with byok_mod._DISCOVERY_REFRESH_LOCK:
        byok_mod._DISCOVERY_REFRESH_ATTEMPTED_AT.clear()


class _Out(BaseModel):
    ok: bool


class _StubManager:
    """Credential seam stub: one declared opencode-go test key."""

    def get_api_key(self, provider_id, tenant_id=None):
        if provider_id == "opencode-go":
            return DUMMY_KEY
        return None


def _build_handler(monkeypatch):
    monkeypatch.setenv("OPENCODE_BASE_URL", GO_BASE_URL)
    monkeypatch.setattr(byok, "get_byok_manager", lambda: _StubManager())
    return BYOKHandler(workspace_id=WORKSPACE, tenant_id="default")


def _swap_transport(client, transport):
    inner = client._client
    client._client = httpx.Client(
        transport=transport,
        base_url=inner.base_url,
        headers=dict(inner.headers),
        timeout=inner.timeout,
    )


def _ok_wire(captured):
    def _wire(request: httpx.Request) -> httpx.Response:
        captured.append(request)
        if request.method == "GET" and request.url.path.rstrip("/").endswith(
                "/models"):
            return httpx.Response(200, json={
                "object": "list",
                "data": [{"id": "deepseek-v4-pro", "object": "model"},
                         {"id": "qwen3.8-flash", "object": "model"}]})
        body = json.loads(request.content.decode() or "{}")
        if body.get("tools"):
            name = body["tools"][0]["function"]["name"]
            message = {
                "role": "assistant", "content": None,
                "tool_calls": [{"id": "call_1", "type": "function",
                                "function": {"name": name,
                                             "arguments": json.dumps({"ok": True})}}]}
            finish = "tool_calls"
        else:
            message = {"role": "assistant",
                       "content": json.dumps({"ok": True})}
            finish = "stop"
        return httpx.Response(200, json={
            "id": "c1", "object": "chat.completion", "created": 0,
            "model": body.get("model") or "unknown",
            "choices": [{"index": 0, "message": message,
                         "finish_reason": finish}],
            "usage": {"prompt_tokens": 1, "completion_tokens": 1,
                      "total_tokens": 2}})
    return _wire


def test_constructed_client_carries_go_url_and_required_headers(monkeypatch):
    handler = _build_handler(monkeypatch)
    assert "opencode-go" in handler.clients, sorted(handler.clients)
    client = handler.clients["opencode-go"]
    assert str(client.base_url).rstrip("/") == GO_BASE_URL
    # The OpenAI SDK applies default_headers at request time; the
    # constructed boundary exposes them on the client. Assert only the
    # required identities — never the credential value.
    headers = {k.lower(): v for k, v in dict(client.default_headers).items()}
    assert headers.get("user-agent") == "atom-agent/1.0"
    assert headers.get("x-opencode-session") == f"atom-{WORKSPACE}"


def test_pinned_dispatch_reaches_go_url_with_intended_model(monkeypatch):
    handler = _build_handler(monkeypatch)
    captured = []
    _swap_transport(handler.clients["opencode-go"],
                    httpx.MockTransport(_ok_wire(captured)))
    result = asyncio.run(handler.generate_structured_response(
        prompt="Return ok.", system_instruction="Return JSON.",
        response_model=_Out, task_type="planning",
        provider_model=PIN, disable_reasoning=True, max_tokens=1000))
    assert result is not None and result.ok is True
    posts = [r for r in captured if r.method == "POST"]
    assert posts, captured
    req = posts[0]
    assert str(req.url) == f"{GO_BASE_URL}/chat/completions"
    assert req.headers.get("x-opencode-session") == f"atom-{WORKSPACE}"
    assert req.headers.get("user-agent") == "atom-agent/1.0"
    body = json.loads(req.content.decode())
    assert body.get("model") == "deepseek-v4-pro", body.get("model")


def test_failed_pin_fallback_does_not_disguise_an_incompatible_route(
        monkeypatch):
    handler = _build_handler(monkeypatch)
    # Seed the discovered catalogue through the registry's own API so the
    # UNPINNED fallback can verify and dispatch its route (discovery
    # normally populates this from the provider's /models endpoint).
    from core.llm.model_route_registry import get_provider_model_catalog

    get_provider_model_catalog().record_discovery(
        "opencode-go",
        ["deepseek-v4-pro", "glm-5.3-flash", "minimax-m3",
         "deepseek-v4.1-flash", "minimax-m2.5", "minimax-m2.7",
         "mistral-large-4"])
    captured = []

    def _wire(request: httpx.Request) -> httpx.Response:
        captured.append(request)
        if request.method == "GET" and request.url.path.rstrip("/").endswith(
                "/models"):
            # The discovered catalogue covers the ranked pool, so the
            # fallback CAN dispatch (a different route from the failed
            # pin) — and still fails on the incompatible wire.
            return httpx.Response(200, json={
                "object": "list",
                "data": [{"id": m, "object": "model"} for m in (
                    "deepseek-v4-pro", "qwen3.8-flash", "glm-5.3-flash",
                    "minimax-m3", "minimax-m2.7", "deepseek-v4.1-flash",
                    "minimax-m2.5", "mistral-large-4", "glm-5.1",
                    "gemini-3-flash", "kimi-k2.5", "kimi-k2.7-code")]})
        # The OpenAI-compatible Go route cannot serve this request
        # (simulated protocol incompatibility) — for ANY model.
        return httpx.Response(400, json={"error": {
            "type": "invalid_request_error",
            "message": "model not supported on this route"}})

    _swap_transport(handler.clients["opencode-go"],
                    httpx.MockTransport(_wire))

    class _HandlerService:
        def __init__(self):
            self.calls = []

        async def generate_structured_response(self, **kwargs):
            self.calls.append(dict(kwargs))
            payload = {k: v for k, v in kwargs.items()
                       if k not in ("workspace_id", "tenant_id")}
            return await handler.generate_structured_response(**payload)

    svc = _HandlerService()
    result = asyncio.run(pinned_structured_call(
        svc, prompt="Return ok.", response_model=_Out,
        system_instruction="Return JSON.", log_label="transport-fallback",
        call_kwargs={"provider_model": PIN},
        workspace_id=WORKSPACE, tenant_id="default"))

    # No plan, no disguised success.
    assert result is None
    # The pinned attempt carried the pin; the fallback did NOT retry it and
    # excluded it explicitly — the fallback is a DIFFERENT route.
    assert len(svc.calls) == 2
    assert svc.calls[0]["provider_model"] == PIN
    assert "provider_model" not in svc.calls[1]
    assert svc.calls[1]["exclude_provider_model"] == PIN
    assert svc.calls[1]["workspace_id"] == WORKSPACE
    # Wire truth: pinned posts went to the intended model; the fallback
    # posted a different model to the same URL and also failed — nothing
    # was relabelled as the pinned route's success.
    models = [json.loads(r.content.decode()).get("model")
              for r in captured if r.method == "POST"]
    assert "deepseek-v4-pro" in models
    assert any(m and m != "deepseek-v4-pro" for m in models), models
    assert result is None
