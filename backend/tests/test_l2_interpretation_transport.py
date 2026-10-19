# -*- coding: utf-8 -*-
"""L2 interpretation transport controls.

The served attempt-2 diagnosis was "dispatch attempted, completion within
deadline failed". These controls prove the intended request shape over a
REAL client + mock transport (not just a forwarded keyword):

* the constructed transport request carries the explicit ``max_tokens``
  budget and the reasoning-disable switch;
* a reasoning-mandatory 400 follows the existing bounded recovery
  (retry once without the switch, memoize the pair) and can still
  succeed;
* when the recovery also fails, the handler yields no result and the
  interpretation stays unresolved — never a false success.

The handler is the minimal harness used by the reasoning-mandatory
controls; the route is pinned in ``get_ranked_providers`` so the
transport assertions do not depend on the shared pricing singleton.
"""
from __future__ import annotations

import asyncio
import json
import os

os.environ.setdefault("TESTING", "1")

import httpx
import openai
import pytest
from pydantic import BaseModel, Field
from unittest.mock import MagicMock

from core.llm.byok_handler import AwaitableResult, BYOKHandler
from tests.test_reasoning_mandatory_retry import _handler as _minimal_handler

LOCAL_PROVIDER = "local_transport1234"
LOCAL_MODEL = "llama3.1:8b"
_MANDATORY_MSG = (
    "Reasoning is mandatory for this endpoint and cannot be disabled.")


class _Probe(BaseModel):
    sources: list[str] = Field(default_factory=list)
    note: str = ""


def _completion_body(body: dict, content: dict) -> dict:
    """An OpenAI-compatible completion valid for instructor's mode."""
    if body.get("tools"):
        tool_name = (body["tools"][0].get("function") or {}).get(
            "name") or "response"
        message = {
            "role": "assistant", "content": None,
            "tool_calls": [{
                "id": "call_1", "type": "function",
                "function": {"name": tool_name,
                             "arguments": json.dumps(content)},
            }],
        }
        finish = "tool_calls"
    else:
        message = {"role": "assistant", "content": json.dumps(content)}
        finish = "stop"
    return {
        "id": "chatcmpl-l2", "object": "chat.completion", "created": 1,
        "model": LOCAL_MODEL,
        "choices": [{"index": 0, "finish_reason": finish,
                     "message": message}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5,
                  "total_tokens": 15},
    }


def _client(responder) -> openai.OpenAI:
    transport = httpx.MockTransport(responder)
    return openai.OpenAI(
        base_url="http://localhost:11434/v1", api_key="ollama",
        http_client=httpx.Client(transport=transport))


def _transport_handler(responder) -> BYOKHandler:
    handler = _minimal_handler()
    handler.get_ranked_providers = MagicMock(
        return_value=AwaitableResult([(LOCAL_PROVIDER, LOCAL_MODEL)]))
    handler.clients = {LOCAL_PROVIDER: _client(responder)}
    handler.async_clients = {}
    return handler


def _clear_pair_memos() -> None:
    """Reset the process-global per-(provider, model) memos the handler
    learns. Other suites in the same process may have taught them."""
    from core.llm import byok_handler as bh

    pair = f"{LOCAL_PROVIDER}/{LOCAL_MODEL}"
    bh._REASONING_MANDATORY.discard(pair)
    bh._TOOLCHOICE_UNSUPPORTED.discard(pair)
    bh._AUTH_FAILED.discard(pair)
    bh._MODEL_TEMPERATURE.pop(pair, None)
    bh._STRUCTURED_PROTOCOL_UNSUPPORTED.discard(pair)
    bh._PROVIDER_COOLDOWN_UNTIL.pop(LOCAL_PROVIDER, None)
    bh._PROVIDER_COOLDOWN_UNTIL.pop(LOCAL_MODEL, None)


def _settings(**overrides) -> dict:
    base = {
        "task_type": "planning",
        "temperature": 0.0,
        "disable_reasoning": True,
        "max_tokens": 4321,
        "route_trace_id": "turn_interpretation:req-l2",
        "allow_moa": False,
    }
    base.update(overrides)
    return base


@pytest.mark.asyncio
async def test_transport_carries_bounded_settings_and_reasoning_switch():
    _clear_pair_memos()
    captured: list[dict] = []

    def _responder(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        captured.append(body)
        return httpx.Response(200, json=_completion_body(
            body, {"sources": ["approved_records_q2026_114.txt"],
                   "note": "ok"}))

    handler = _transport_handler(_responder)
    out = await handler.generate_structured_response(
        prompt="interpret", system_instruction="json",
        response_model=_Probe, **_settings())

    assert isinstance(out, _Probe), out
    assert out.sources == ["approved_records_q2026_114.txt"]
    assert len(captured) == 1, (
        f"one bounded call expected (no MoA, no retry); got {len(captured)}")
    body = captured[0]
    assert body["max_tokens"] == 4321, body.get("max_tokens")
    assert body["temperature"] == 0.0, body.get("temperature")
    assert body["reasoning"] == {"enabled": False, "exclude": True}, (
        "the transport body must carry the reasoning-disable switch, not "
        f"just a forwarded kwarg; got {body.get('reasoning')!r}")
    assert LOCAL_MODEL in str(body.get("model")), body.get("model")
    _clear_pair_memos()


@pytest.mark.asyncio
async def test_reasoning_mandatory_retry_drops_switch_and_still_succeeds():
    _clear_pair_memos()
    captured: list[dict] = []

    def _responder(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        captured.append(body)
        if body.get("reasoning"):
            return httpx.Response(400, json={
                "error": {"message": _MANDATORY_MSG, "code": 400}})
        return httpx.Response(200, json=_completion_body(
            body, {"sources": ["approved_records_q2026_114.txt"],
                   "note": "ok"}))

    handler = _transport_handler(_responder)
    out = await handler.generate_structured_response(
        prompt="interpret", system_instruction="json",
        response_model=_Probe, **_settings())

    assert isinstance(out, _Probe), out
    assert len(captured) == 2, (
        f"expected the mandatory-reasoning 400 to retry once; got "
        f"{len(captured)} attempt(s)")
    assert captured[0].get("reasoning") == {
        "enabled": False, "exclude": True}
    assert "reasoning" not in captured[1], (
        "the retry must drop the disable switch or it will 400 again")
    _clear_pair_memos()


@pytest.mark.asyncio
async def test_second_mandatory_400_yields_no_result_not_false_success():
    from core.llm import byok_handler as bh

    _clear_pair_memos()
    calls = []

    def _responder(request: httpx.Request) -> httpx.Response:
        calls.append(json.loads(request.content))
        return httpx.Response(400, json={
            "error": {"message": _MANDATORY_MSG, "code": 400}})

    handler = _transport_handler(_responder)
    out = await handler.generate_structured_response(
        prompt="interpret", system_instruction="json",
        response_model=_Probe, **_settings())
    assert out is None, f"no result, never a false success; got {out!r}"
    # Bounded behavior: the switch is dropped once (the pair is memoized);
    # instructor may retry at the HTTP layer, so only assert that both
    # shapes were sent and the total stays small — never a loop.
    assert any(body.get("reasoning") for body in calls), (
        "the first dispatch must carry the disable switch")
    assert any(not body.get("reasoning") for body in calls), (
        "the bounded recovery must drop the disable switch")
    assert len(calls) <= 4, f"bounded attempt count violated: {len(calls)}"
    assert f"{LOCAL_PROVIDER}/{LOCAL_MODEL}" in bh._REASONING_MANDATORY
    _clear_pair_memos()


@pytest.mark.asyncio
async def test_no_handler_result_leaves_interpretation_unresolved():
    from core.turn_decision import (
        interpret_turn_request,
        reset_interpretation_for_tests,
    )

    class _NoneService:
        async def generate_structured_response(self, **kwargs):
            return None

    reset_interpretation_for_tests()
    out = await interpret_turn_request(
        "check the approved record", {}, [], {},
        request_id="req-none", llm_service=_NoneService())
    assert out["origin"] == "unresolved"
    assert out["sources"] == []
    reset_interpretation_for_tests()


def test_interpretation_moa_gate_can_fire_but_is_opted_out_by_call():
    from core.llm.byok_handler import QueryComplexity

    assert BYOKHandler._moa_eligible(
        None, QueryComplexity.COMPLEX, "planning") is True
