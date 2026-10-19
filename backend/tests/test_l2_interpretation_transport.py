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

import json
import os
import threading
import time

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
    assert len(captured) >= 1, "the dispatch must reach the wire"
    assert all(b.get("max_tokens") == 4321 for b in captured), (
        "every dispatched body must carry the explicit budget")
    assert all(b.get("reasoning") == {
        "enabled": False, "exclude": True} for b in captured), (
        "every dispatched body must carry the reasoning-disable switch, "
        "not just a forwarded kwarg")
    body = captured[0]
    assert body["temperature"] == 0.0, body.get("temperature")
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
    assert len(captured) >= 2, (
        f"expected the mandatory-reasoning 400 to retry at least once; "
        f"got {len(captured)} attempt(s)")
    assert captured[0].get("reasoning") == {
        "enabled": False, "exclude": True}
    assert any("reasoning" not in body for body in captured), (
        "the bounded recovery must drop the disable switch")
    assert "reasoning" not in captured[-1], (
        "the successful attempt must not carry the disabled switch")
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
    assert 2 <= len(calls) <= 12, (
        f"bounded attempt count expected; got {len(calls)}")
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


def _valid_interpretation_content() -> dict:
    return {
        "actions": [{"kind": "research",
                     "subjects": ["draft quotation"], "note": ""}],
        "subjects": ["draft quotation"],
        "sources": ["approved_records_q2026_114.txt"],
        "requested_fields": ["valid until date"],
        "output_format": "",
        "constraints": [],
        "scope_change": "continue",
        "confidence": 0.9,
    }


@pytest.mark.asyncio
async def test_interpret_end_to_end_constructs_bounded_wire_request():
    """interpret_turn_request -> real LLMService -> real handler -> wire."""
    from core.turn_decision import (
        _INTERPRET_OUTPUT_BUDGET_TOKENS,
        interpret_turn_request,
        reset_interpretation_for_tests,
    )
    from tests.test_llm_service_task_type_forwarding import _service

    _clear_pair_memos()
    captured: list[dict] = []

    def _responder(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        captured.append(body)
        return httpx.Response(200, json=_completion_body(
            body, _valid_interpretation_content()))

    handler = _transport_handler(_responder)
    service = _service(handler)
    reset_interpretation_for_tests()
    out = await interpret_turn_request(
        "check the approved record", {}, [], {},
        request_id="req-l2", llm_service=service)

    assert out["origin"].startswith("llm:"), out
    assert out["unresolved_reason"] == ""
    assert out["sources"] == ["approved_records_q2026_114.txt"], out
    assert captured, "the wire request must be constructed"
    body = captured[0]
    assert body["max_tokens"] == _INTERPRET_OUTPUT_BUDGET_TOKENS, (
        "LLMService must forward the derived budget to the wire")
    assert body["reasoning"] == {"enabled": False, "exclude": True}, (
        "LLMService must forward the reasoning-disable switch to the wire")
    assert body["temperature"] == 0.0
    assert LOCAL_MODEL in str(body.get("model"))
    reset_interpretation_for_tests()
    _clear_pair_memos()


@pytest.mark.asyncio
async def test_late_worker_completion_cannot_mutate_returned_interpretation(
        monkeypatch):
    """Cancellation leaves the handler's synchronous worker running (its
    own warning); its eventual valid result must not mutate the already
    returned, unresolved interpretation or adopt a source."""
    from core.turn_decision import (
        interpret_turn_request,
        reset_interpretation_for_tests,
    )
    from tests.test_llm_service_task_type_forwarding import _service

    _clear_pair_memos()
    started = threading.Event()
    release = threading.Event()
    captured: list[dict] = []

    def _responder(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        captured.append(body)
        started.set()
        release.wait(timeout=5)
        return httpx.Response(200, json=_completion_body(
            body, _valid_interpretation_content()))

    handler = _transport_handler(_responder)
    service = _service(handler)
    monkeypatch.setattr("core.turn_decision._INTERPRET_TIMEOUT_S", 0.3)
    reset_interpretation_for_tests()
    try:
        out = await interpret_turn_request(
            "check the approved record", {}, [], {},
            request_id="req-late", llm_service=service)
    finally:
        release.set()

    assert out["origin"] == "unresolved", out
    assert out["unresolved_reason"] == "timeout", out
    assert out["sources"] == []
    # Let the worker eventually finish with its valid result.
    deadline = time.time() + 5.0
    while not started.is_set() and time.time() < deadline:
        time.sleep(0.01)
    assert started.is_set(), "the worker must eventually build the request"
    time.sleep(0.3)
    # The returned interpretation and its sources did not change.
    assert out["origin"] == "unresolved"
    assert out["sources"] == []
    assert out["unresolved_reason"] == "timeout"
    reset_interpretation_for_tests()
    _clear_pair_memos()


@pytest.mark.asyncio
async def test_interpretation_pins_measured_route_with_unpinned_fallback():
    """The diagnostic-selected route is a preference: the pin is tried
    first, and a failed pin retries unpinned while excluding that route."""
    from core.turn_decision import (
        interpret_turn_request,
        reset_interpretation_for_tests,
    )

    class _PinRecordingService:
        def __init__(self):
            self.calls: list[dict] = []
            self._handler = type(
                "H", (), {"clients": {"opencode-go": object()}})()

        def _get_handler(self):
            return self._handler

        async def generate_structured_response(self, **kwargs):
            self.calls.append(kwargs)
            if kwargs.get("provider_model"):
                return None  # the pinned attempt yields nothing
            return _valid_interpretation_content()

    service = _PinRecordingService()
    reset_interpretation_for_tests()
    out = await interpret_turn_request(
        "check the approved record", {}, [], {},
        request_id="req-pin", llm_service=service)

    assert out["origin"].startswith("llm"), out
    assert out["sources"] == ["approved_records_q2026_114.txt"], out
    assert len(service.calls) == 2, service.calls
    first, second = service.calls
    assert first.get("provider_model") == ("opencode-go", "qwen3.8-flash")
    assert second.get("provider_model") is None
    assert second.get("exclude_provider_model") == (
        "opencode-go", "qwen3.8-flash")
    assert second.get("max_tokens") == 5500
    assert second.get("disable_reasoning") is True
    assert second.get("allow_moa") is False
    reset_interpretation_for_tests()


@pytest.mark.asyncio
async def test_real_handler_rejects_empty_actions_then_accepts_valid():
    """The schema is enforced by the real structured path; an empty-action
    first response must not be accepted, and a subsequent valid read-only
    record (if the transport retries) is usable."""
    from core.turn_decision import (
        interpret_turn_request,
        reset_interpretation_for_tests,
    )
    from tests.test_llm_service_task_type_forwarding import _service

    _clear_pair_memos()
    calls: list[dict] = []
    empty = _valid_interpretation_content()
    empty["actions"] = []
    valid = _valid_interpretation_content()

    def _responder(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        calls.append(body)
        content = empty if len(calls) == 1 else valid
        return httpx.Response(200, json=_completion_body(body, content))

    handler = _transport_handler(_responder)
    service = _service(handler)
    reset_interpretation_for_tests()
    out = await interpret_turn_request(
        "check the approved record", {}, [], {},
        request_id="req-actions", llm_service=service)
    # The real structured path must reject the empty-action record and
    # use the subsequent valid read-only interpretation.
    assert out["origin"].startswith("llm"), out
    assert out["scope_change"] == "continue", out
    assert out["actions"], out
    assert len(calls) >= 2, calls
    reset_interpretation_for_tests()
    _clear_pair_memos()


@pytest.mark.asyncio
async def test_real_handler_repeated_empty_actions_exhausts_bound_and_fails():
    from core.turn_decision import (
        interpret_turn_request,
        reset_interpretation_for_tests,
    )
    from tests.test_llm_service_task_type_forwarding import _service

    _clear_pair_memos()
    calls: list[dict] = []
    empty = _valid_interpretation_content()
    empty["actions"] = []

    def _responder(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        calls.append(body)
        return httpx.Response(200, json=_completion_body(body, empty))

    handler = _transport_handler(_responder)
    service = _service(handler)
    reset_interpretation_for_tests()
    out = await interpret_turn_request(
        "check the approved record", {}, [], {},
        request_id="req-actions-exhaust", llm_service=service)
    assert out["origin"] == "unresolved", out
    assert out["actions"] == []
    # The real structured path retries validation failures (observed 8
    # HTTP posts for a persistently empty-action record under the mock
    # transport); assert the bound stays finite, not that it is small.
    assert 2 <= len(calls) <= 12, (
        f"the existing retry bound must stay bounded; calls={len(calls)}")
    reset_interpretation_for_tests()
    _clear_pair_memos()


def test_interpretation_moa_gate_can_fire_but_is_opted_out_by_call():
    from core.llm.byok_handler import QueryComplexity

    assert BYOKHandler._moa_eligible(
        None, QueryComplexity.COMPLEX, "planning") is True
