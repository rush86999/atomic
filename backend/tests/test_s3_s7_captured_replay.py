"""Replay the captured S3/S7 inputs through the real requirement stash
and the real settlement resolver.

These are the exact interpretation records and asks from the proven L2
run (`c0cbea9f1` attempt 12), the composed attempt 2 and composed
attempt 3. No model call is made here: the captured accepted request is
fed to the real `_stash_evidence_requirement`, so a change to the capture
rules is visible before another composed run. The attempt-3 S7 task
record is replayed through `_fallback_turn_outcome` so the settlement
classification is pinned without another campaign.

The attempt-2 S3 record is asserted as recorded (broader capture absent),
not as a pass. The attempt-2 S7 record is the honest timeout outcome:
unresolved/non-obligated, not an invented source. The attempt-3 S7
record is a delivered verified comparison with a declined lookup: it
must settle partial with the pre-existing obligation named, never
failed.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "backend/scripts/orchestration_acceptance/journey_matrix"
L2 = EVIDENCE / "l2_continuation_served_20261019/attempt12_result.json"
COMPOSED = (EVIDENCE /
            "l1_l2_l3_integrated_served_20261019/attempt2_result.json")
ATTEMPT3 = (EVIDENCE /
            "l1_l2_l3_integrated_served_20261020/attempt3_result.json")
ATTEMPT3_TASK = (
    ROOT / "backend/tests/fixtures/s7_attempt3_task_record.json")

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


def test_s3_captured_attempt2_narrower_interpretation_recovers_the_broad_contract(
        monkeypatch):
    """The captured attempt-2 interpretation named only the date field, but
    the user's message explicitly said "Flag anything that differs". The
    historical attempt-2 result remains narrow (preserved evidence); the
    corrected scope rule consumes the message contract and recovers the
    broader obligation instead of recording the gap as intended scope."""
    request = _captured_request(COMPOSED, "s3")
    assert request["message"] == S3_ASK
    assert request["requested_fields"] == ["Valid Until date", "differences"]

    req = _stash(monkeypatch, message=S3_ASK, accepted_request=request)

    assert req["fields"] == ["expiration_date"]
    assert req["broader_comparison"] is True
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


# ---------------------------------------------------------------------------
# Attempt 3 S7 — the captured task record replays to an honest settlement
# ---------------------------------------------------------------------------
S7_EXEC = "f178f3ed-9c2e-4acc-a0a1-2fc657c8ea76"
S7_RUN = "b6afdc1c-769e-427a-a450-001fdc8c9be5"
S7_WS = "c65ba44e-715c-4ce1-8da9-ad6eb197ab2d"
S7_OPEN_WORK = "re-run the workbook verification for the quote's items"
FACT_EXCERPT = (
    "APPROVED RECORDS — Quotation Q-2026-114 Source: Sales Operations "
    "approved-terms register Client: Dunmore Fabrication LLC Item: CNC press "
    "brake Approved unit price: $48,000.00 Approved payment terms: Net 30 "
    "Approved valid until: 2026-12-31 Approved by: Sales Operations")


def _attempt3_s7_record() -> dict:
    return json.loads(ATTEMPT3_TASK.read_text())


def _s7_session(record: dict) -> dict:
    step = _loaded(ATTEMPT3)["steps"]["s7"]
    requirement = step["requirement_summary"]
    assert requirement["fields"] == ["expiration_date"]
    assert requirement["identity"]["state"] == "resolved"
    observation = {
        "source": "ingested",
        "title": "approved_records_q2026_114.txt",
        "file_name": "approved_records_q2026_114.txt",
        "content_hash": "",
        "workspace_id": S7_WS,
        "excerpt": FACT_EXCERPT,
        "requested_fields": ["expiration_date"],
        "subjects": [],
        "field_associations": {
            "expiration_date": {
                "value": "2026-12-31", "span": [176, 186],
                "subject": None}},
        "supplied_fields": ["expiration_date"],
    }
    # The comparison carrier is rebuilt by the REAL producer from the
    # captured requirement, canvas and source excerpt — the same
    # deterministic lane that logged the verified replacement for this
    # execution. No hand-authored coverage fixture.
    from core.workbook_read_artifact import verified_comparison_reply

    produced = verified_comparison_reply(
        message=S7_ASK, reply="",
        canvas={
            "canvas_id": step["canvas_id"],
            "title": "Quotation Q-2026-114 (DRAFT)",
            "content": step["canvas_before"],
        },
        source_observations=[observation],
        requirement=requirement)
    assert produced and produced.get("comparison"), (
        "the captured S7 inputs must reproduce the verified comparison")
    return {
        "id": "a7fde1c5-a41d-40ba-9b19-ed66a6762db9",
        "session_id": "a7fde1c5-a41d-40ba-9b19-ed66a6762db9",
        "user_id": "742d4828-3212-4138-a1b7-fd8afc761b79",
        "_task_run_id": S7_RUN,
        f"_evidence_requirement_{S7_EXEC}": requirement,
        f"_retrieval_source_observations_{S7_EXEC}": [observation],
        f"_objective_evidence_{S7_EXEC}": produced["comparison"],
    }


def _with_stub_lifecycle(monkeypatch, record):
    from integrations import chat_orchestrator as co

    class _StubLifecycle:
        def get_task(self, run_id):
            return record if run_id == S7_RUN else None

        def find_active_task(self, conversation_id):
            return None

    monkeypatch.setattr(
        co, "_task_lifecycle_for", lambda *a, **k: _StubLifecycle())
    return co


def test_s7_attempt3_delivered_comparison_is_partial_not_failed(
        monkeypatch):
    """The captured S7 turn delivered a verified date comparison while
    one lookup was declined (`not_dispatched`) and the earlier S3
    verification question stayed open. A declined lookup is an open
    obligation, not a failed execution: the delivery survives, the
    settlement is partial, and the obligation is named."""
    record = _attempt3_s7_record()
    s7_ops = [
        op for op in record["operations"]
        if str(op.get("execution_id")) == S7_EXEC]
    assert {str(op.get("operation_id")) for op in s7_ops} == {
        "8ebc306e-f1bc-4211-8d1c-49d9dc814e58",
        "923b8cd7-fb0d-4775-ae52-22c5564cc803"}
    assert any(
        (op.get("execution") or {}).get("outcome") == "not_dispatched"
        for op in s7_ops), (
        "the captured record must carry the declined lookup this test "
        "guards")
    assert any(
        str(q.get("next_action")) == S7_OPEN_WORK
        for q in record["task_revision"].get("unresolved") or []
        if q.get("status") == "open")

    co = _with_stub_lifecycle(monkeypatch, record)
    state = co._fallback_turn_outcome(
        _s7_session(record), S7_EXEC, [], {}, workspace_id=S7_WS)

    assert state["delivered"] is True, state
    assert state["state"] == "partial", (
        "a validated delivery plus an undispatched lookup is partial; "
        f"got {state}")
    assert S7_OPEN_WORK in state["open_work"], state
    assert state["context_fulfillment"]["state"] == "completed"
    assert state["execution_ids"] == [S7_EXEC]


def test_s7_attempt3_hard_failure_still_settles_failed(monkeypatch):
    """The delivered-comparison escape must not mask a real execution
    failure: a bound operation with status=failed (or a read/search
    failure outcome) still resolves failed."""
    record = _attempt3_s7_record()
    for op in record["operations"]:
        if str(op.get("operation_id")) == (
                "923b8cd7-fb0d-4775-ae52-22c5564cc803"):
            op["status"] = "failed"
    co = _with_stub_lifecycle(monkeypatch, record)
    state = co._fallback_turn_outcome(
        _s7_session(record), S7_EXEC, [], {}, workspace_id=S7_WS)
    assert state["state"] == "failed", state


def test_s7_attempt3_declined_lookup_without_delivery_stays_failed(
        monkeypatch):
    """Contrast: without the verified context delivery, the declined
    lookup is still a recorded failure — the escape is earned by a
    delivered result, never by the mere presence of a task record."""
    record = _attempt3_s7_record()
    session = _s7_session(record)
    session.pop(f"_evidence_requirement_{S7_EXEC}")
    session.pop(f"_retrieval_source_observations_{S7_EXEC}")
    session.pop(f"_objective_evidence_{S7_EXEC}")
    co = _with_stub_lifecycle(monkeypatch, record)
    state = co._fallback_turn_outcome(
        session, S7_EXEC, [], {}, workspace_id=S7_WS)
    assert state["delivered"] is False, state
    assert state["state"] == "failed", state


def test_s7_attempt3_partial_envelope_keeps_success_and_names_open_work():
    """The route-level mapping: partial stays success=true with no error
    code; it never becomes `turn_failed_no_result`."""
    from core.finalization import apply_recorded_outcome

    payload = {
        "success": True,
        "message": (
            "Verified comparison ... draft 2026-12-31 = approved "
            "2026-12-31 (match)"),
        "data": {"task_run_id": S7_RUN},
    }
    finalized = apply_recorded_outcome(payload, {
        "state": "partial", "delivered": True, "work_turn": True,
        "open_work": [S7_OPEN_WORK], "execution_ids": [S7_EXEC]})
    assert finalized["success"] is True
    assert finalized["outcome"] == "partial"
    assert not finalized.get("error_code")


def test_s7_attempt3_durable_outcome_records_delivery(monkeypatch):
    """The durable task outcome must record delivery=true and must not
    diagnose the turn as a delivery failure — the defect that produced
    `failure_layer=delivery` / `basis=delivery_not_confirmed`."""
    from core.task_outcome_contract import diagnose_failure

    record = _attempt3_s7_record()
    co = _with_stub_lifecycle(monkeypatch, record)
    session = _s7_session(record)
    state = co._fallback_turn_outcome(
        session, S7_EXEC, [], {}, workspace_id=S7_WS)
    session["_recorded_outcome"] = state
    orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
    outcome = co.ChatOrchestrator._build_turn_task_outcome(
        orch, session, S7_ASK,
        {
            "success": True,
            "message": (
                "Verified comparison: the draft's Valid until date equals "
                "the approved record's 2026-12-31."),
            "model": "llama3.1:8b",
            "_recorded_outcome": state,
        },
        None, None, execution_id=S7_EXEC, workspace_id=S7_WS)

    assert outcome["delivery"]["delivered"] is True, outcome.get("delivery")
    diagnosis = diagnose_failure(outcome)
    assert diagnosis != {
        "layer": "delivery", "owner": "delivery",
        "basis": "delivery_not_confirmed"}, (
        "a delivered verified comparison must not be diagnosed as a "
        f"delivery failure; got {diagnosis}")

