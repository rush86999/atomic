# -*- coding: utf-8 -*-
"""L2 scope-contract controls (S7 producer).

The attempt-7 S7 response passed Pydantic parsing but was rejected after
normalization. The schema now REQUIRES the five-value scope, and the
rejection reasons distinguish missing scope, invalid scope, no actions,
and explicit uncertainty. These controls pin the producer contract; the
composer/source resolution is exercised by the L2 producer-boundary
tests.
"""
from __future__ import annotations

import os

os.environ.setdefault("TESTING", "1")

import pytest

from core.turn_decision import (
    interpret_turn_request,
    reset_interpret_capture,
    reset_interpretation_for_tests,
)

S7_ASK = ("What is the current Valid until date on the draft, and does it "
          "still match the approved record?")


class _ValidatingGeneration:
    def __init__(self, payload: dict):
        self.payload = payload

    async def generate_structured_response(self, *, response_model, **kwargs):
        return response_model(**self.payload)


def _payload(scope=None, actions=None):
    payload = {
        "actions": actions if actions is not None else [{
            "kind": "research",
            "subjects": ["draft quotation"],
            "note": "",
        }],
        "subjects": ["draft quotation"],
        "sources": ["approved_records_q2026_114.txt"],
        "requested_fields": ["valid until date"],
        "output_format": "",
        "constraints": [],
        "confidence": 0.9,
    }
    if scope is not None:
        payload["scope_change"] = scope
    return payload


def _run(payload):
    reset_interpretation_for_tests()
    reset_interpret_capture()
    return interpret_turn_request(
        S7_ASK, {}, [], {}, request_id="req-scope",
        llm_service=_ValidatingGeneration(payload))


@pytest.mark.asyncio
async def test_missing_scope_is_structural_missing_scope(monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    out = await _run(_payload(scope=None))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "missing_scope", out
    assert out["actions"] == []


@pytest.mark.asyncio
async def test_unsupported_scope_is_invalid_scope_not_unresolved(monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    out = await _run(_payload(scope="sideways"))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "invalid_scope", out
    assert out["actions"] == []


@pytest.mark.asyncio
async def test_explicit_unresolved_is_its_own_reason(monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    out = await _run(_payload(scope="unresolved"))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "scope_unresolved", out
    assert out["actions"] == []


@pytest.mark.asyncio
async def test_no_actions_is_its_own_reason(monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    out = await _run(_payload(scope="continue", actions=[]))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "no_actions_proposed", out


@pytest.mark.asyncio
async def test_valid_continue_scope_passes_the_producer():
    out = await _run(_payload(scope="continue"))
    assert out["origin"].startswith("llm"), out
    assert out["scope_change"] == "continue"
    assert out["unresolved_reason"] == ""
    assert out["actions"]


def test_prompt_distinguishes_completed_followup():
    from core.turn_decision import _interpretation_prompt

    prompt = _interpretation_prompt(S7_ASK, [], {}, {})
    assert "FOLLOW UP on an established conversation subject" in prompt
    assert "even when the prior turn completed" in prompt
    assert "do not map uncertainty to 'continue'" in prompt
    assert "genuinely ambiguous" in prompt


@pytest.mark.asyncio
async def test_completed_prior_turn_followup_uses_continue():
    """A follow-up on an established completed conversation is continue,
    not replace/unresolved."""
    out = await _run(_payload(scope="continue"))
    assert out["scope_change"] == "continue"
    assert out["origin"].startswith("llm")
