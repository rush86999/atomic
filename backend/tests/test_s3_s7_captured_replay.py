"""Replay the captured S3/S7 inputs through the real requirement stash.

These are the exact interpretation records and asks from the proven L2
run (`c0cbea9f1` attempt 12) and the composed attempt 2. No model call is
made here: the captured accepted request is fed to the real
`_stash_evidence_requirement`, so a change to the capture rules is
visible before another composed run.

The attempt-2 S3 record is asserted as recorded (broader capture absent),
not as a pass. The attempt-2 S7 record is the honest timeout outcome:
unresolved/non-obligated, not an invented source.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "backend/scripts/orchestration_acceptance/journey_matrix"
L2 = EVIDENCE / "l2_continuation_served_20261019/attempt12_result.json"
COMPOSED = (EVIDENCE /
            "l1_l2_l3_integrated_served_20261019/attempt2_result.json")

S3_ASK = (
    "Compare the draft quotation with my uploaded Approved Records document. "
    "Does the Valid Until date in the draft match the approved record? "
    "Flag anything that differs. Do not change anything yet.")
S7_ASK = (
    "What is the current Valid until date on the draft, and does it still "
    "match the approved record?")


def _loaded(path: Path) -> dict:
    return json.loads(path.read_text())


def _captured_request(path: Path, step: str) -> dict:
    return (_loaded(path)["steps"][step]["observation"]["apply"]
            ["interpretation"])


def _captured_requirement(path: Path, step: str) -> dict:
    return _loaded(path)["steps"][step]["requirement_event"]["requirement"]


def _stash(monkeypatch, *, message, accepted_request, decision=None,
           required=True, workspace_id="ws-replay"):
    from integrations import chat_orchestrator as co

    if decision is None:
        decision = {"references": {"sources": ["document"]}}
    return co._stash_evidence_requirement(
        {"id": "s-replay"}, "exec-replay", decision, message, required,
        workspace_id=workspace_id, canvas_attached=True,
        accepted_request=accepted_request)


def test_s3_captured_attempt12_input_keeps_the_broader_obligation(monkeypatch):
    request = _captured_request(L2, "s3")
    assert request["message"] == S3_ASK
    assert "any fields that differ" in request["requested_fields"]

    req = _stash(monkeypatch, message=S3_ASK, accepted_request=request)

    captured = _captured_requirement(L2, "s3")
    assert req["required"] is True
    assert req["sources"] == captured["sources"] == ["document"]
    assert req["fields"] == captured["fields"] == ["expiration_date"]
    assert req["broader_comparison"] is True
    assert captured["broader_comparison"] is True


def test_s3_captured_attempt2_narrower_interpretation_is_recorded(
        monkeypatch):
    """The composed attempt captured only the date. Replaying that exact
    accepted request reproduces the observed gap; it must not be mistaken
    for the broader obligation."""
    request = _captured_request(COMPOSED, "s3")
    assert request["message"] == S3_ASK
    assert request["requested_fields"] == ["Valid Until date", "differences"]

    req = _stash(monkeypatch, message=S3_ASK, accepted_request=request)

    assert req["fields"] == ["expiration_date"]
    assert req["broader_comparison"] is False
    assert req["required"] is True


def test_s7_captured_attempt12_input_stays_narrow_and_resolves(
        monkeypatch):
    from integrations import chat_orchestrator as co

    request = _captured_request(L2, "s7")
    captured = _captured_requirement(L2, "s7")
    assert request["message"] == S7_ASK
    assert request["requested_fields"] == ["Valid until date", "match status"]
    assert request["scope_change"] == "continue"

    identity = dict(captured["identity"])
    monkeypatch.setattr(
        co, "_resolve_requirement_identity",
        lambda names, ws: dict(identity))
    req = _stash(
        monkeypatch, message=S7_ASK, accepted_request=request,
        decision={"references": {
            "sources": ["document"],
            "file": {"file_name": identity["file_name"]}}})

    assert req["required"] is True
    assert req["sources"] == ["document"]
    assert req["fields"] == ["expiration_date"]
    assert req["broader_comparison"] is False
    assert req["identity"]["state"] == "resolved"
    assert req["identity"]["file_name"] == identity["file_name"]


def test_s7_captured_attempt2_timeout_is_honest(monkeypatch):
    request = _captured_request(COMPOSED, "s7")
    assert request["message"] == S7_ASK
    assert request["origin"] == "unresolved"
    assert request["unresolved_reason"] == "timeout"

    req = _stash(
        monkeypatch, message=S7_ASK, accepted_request=request,
        decision={"references": {"sources": []}}, required=False)

    assert req["required"] is False
    assert req["sources"] == []
    assert req["identity"]["state"] == "kind_only"
    assert req["file"] is None
