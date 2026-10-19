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


class _DictGeneration:
    """Legacy/dict seam: returns a raw record without Pydantic validation."""

    def __init__(self, payload: dict):
        self.payload = payload

    async def generate_structured_response(self, **_kwargs):
        return dict(self.payload)


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


def _run(payload, generation=None):
    reset_interpretation_for_tests()
    reset_interpret_capture()
    return interpret_turn_request(
        S7_ASK, {}, [], {}, request_id="req-scope",
        llm_service=generation or _ValidatingGeneration(payload))


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
async def test_valid_scope_with_empty_actions_is_rejected(monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    out = await _run(_payload(scope="continue", actions=[]))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "no_actions_proposed", out


@pytest.mark.asyncio
async def test_omitted_actions_is_rejected(monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    payload = _payload(scope="continue")
    payload.pop("actions")
    out = await _run(payload)
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "no_actions_proposed", out


@pytest.mark.asyncio
async def test_schema_rejection_reason_is_independent_of_capture(monkeypatch):
    monkeypatch.delenv("ATOM_TURN_INTERPRET_CAPTURE", raising=False)
    out = await _run(_payload(scope="continue", actions=[]))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "no_actions_proposed", out


@pytest.mark.asyncio
async def test_dict_seam_missing_action_kind_is_rejected():
    payload = _payload(
        scope="continue", actions=[{"subjects": ["draft"]}])
    out = await _run(payload, generation=_DictGeneration(payload))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "missing_action_kind", out


@pytest.mark.asyncio
async def test_dict_seam_unknown_action_kind_is_rejected():
    payload = _payload(
        scope="continue", actions=[{"kind": "write", "subjects": []}])
    out = await _run(payload, generation=_DictGeneration(payload))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "invalid_action_kind", out


@pytest.mark.asyncio
async def test_dict_seam_invalid_ninth_action_is_not_truncated_away():
    actions = [{"kind": "research", "subjects": ["draft"]}] * 8
    actions.append({"kind": "write", "subjects": []})
    payload = _payload(scope="continue", actions=actions)
    out = await _run(payload, generation=_DictGeneration(payload))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "invalid_action_kind", out


@pytest.mark.asyncio
async def test_missing_action_kind_is_rejected(monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    out = await _run(_payload(
        scope="continue", actions=[{"subjects": ["draft"]}]))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "missing_action_kind", out


@pytest.mark.asyncio
async def test_unknown_action_kind_is_rejected(monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    out = await _run(_payload(
        scope="continue", actions=[{"kind": "write", "subjects": []}]))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "invalid_action_kind", out


@pytest.mark.asyncio
async def test_explicit_unresolved_without_action_remains_valid_uncertainty(
        monkeypatch):
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    out = await _run(_payload(scope="unresolved", actions=[]))
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "scope_unresolved", out


@pytest.mark.asyncio
async def test_omitted_actions_with_explicit_unresolved_stays_uncertain():
    payload = _payload(scope="unresolved")
    payload.pop("actions")
    out = await _run(payload)
    assert out["origin"] == "unresolved"
    assert out["unresolved_reason"] == "scope_unresolved", out


@pytest.mark.asyncio
async def test_capture_is_logged_for_archive(monkeypatch, caplog):
    import logging

    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    caplog.set_level(logging.INFO, logger="core.turn_decision")
    out = await _run(_payload(scope="continue", actions=[]))
    assert out["unresolved_reason"] == "no_actions_proposed"
    capture_lines = [
        record.getMessage() for record in caplog.records
        if "[turn-interpretation-capture]" in record.getMessage()]
    assert capture_lines, "capture must be logged for the archived run"
    assert "scope_raw" in capture_lines[-1]
    assert "action_kinds" in capture_lines[-1]
    assert "message" not in capture_lines[-1].lower()
    assert "authorization" not in capture_lines[-1].lower()


@pytest.mark.asyncio
async def test_capture_never_logs_arbitrary_model_text(monkeypatch, caplog):
    import logging

    secret = "SECRET-SUBJECT-QUOTA-TEXT"
    monkeypatch.setenv("ATOM_TURN_INTERPRET_CAPTURE", "1")
    caplog.set_level(logging.INFO, logger="core.turn_decision")
    out = await _run(_payload(
        scope=secret, actions=[{"kind": secret, "subjects": [secret]}]))
    assert out["origin"] == "unresolved"
    capture_lines = [
        record.getMessage() for record in caplog.records
        if "[turn-interpretation-capture]" in record.getMessage()]
    assert capture_lines
    assert secret not in capture_lines[-1]
    assert "<invalid>" in capture_lines[-1]


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
    assert "A resolved scope must include at least one action" in prompt


@pytest.mark.asyncio
async def test_completed_prior_turn_followup_uses_continue():
    """A follow-up on an established completed conversation is continue,
    not replace/unresolved."""
    out = await _run(_payload(scope="continue"))
    assert out["scope_change"] == "continue"
    assert out["origin"].startswith("llm")
