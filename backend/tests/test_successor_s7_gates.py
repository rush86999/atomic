"""Permanent gates for the composed S7 date-only continuation.

These tests replay the two false positives reproduced on ``636c9c9f9``
(the substring date field and the one-recognized-gap partial), then assert
the frozen successor accepts the honest partial only when the *whole*
recorded obligation set belongs to the prior S3 verification.

Every negative here is built from the captured attempt-3 shapes:
``attempt3_result.json`` supplies the requirement, context fulfillment,
continuation antecedents and the pre-fix failed settlement; the task
record fixture supplies the structured prior obligation identities.

The last classes pin the runner wiring: structured task-record
obligations are preferred, the text fallback is exact/bounded, the
continuation antecedent must resolve to a durable execution in the same
conversation and workspace that actually supplied the fixture, and the
captured S3 timeout still does not pass.

No live campaign is launched here; every assertion is offline.
"""
from __future__ import annotations

import importlib.util
import json
import sqlite3
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
EVIDENCE = (BACKEND / "scripts/orchestration_acceptance/journey_matrix/"
            "l1_l2_l3_integrated_served_20261020")
GATES_PATH = EVIDENCE / "successor_gates.py"
RUNNER_PATH = EVIDENCE / "run_composed_served_attempt3.py"
ATTEMPT3 = EVIDENCE / "attempt3_result.json"
TASK_RECORD = BACKEND / "tests/fixtures/s7_attempt3_task_record.json"

# Import the gate module the same way the runner does (plain module name
# on sys.path) so the wiring assertions below can use identity, not text.
if str(EVIDENCE) not in sys.path:
    sys.path.insert(0, str(EVIDENCE))
import successor_gates as gates  # noqa: E402

CAPTURED = json.loads(ATTEMPT3.read_text())
TASK = json.loads(TASK_RECORD.read_text())
S7 = CAPTURED["steps"]["s7"]
S3 = CAPTURED["steps"]["s3"]

FIXTURE = gates.FIXTURE_NAME
DATE_FIELD = gates.EXPECTED_DATE_FIELD
PRIOR = gates.S7_PRIOR_OBLIGATION
ANTECEDENT_ID = (
    S7["observation"]["apply"]["decision_refs_after"]["continuation_evidence"]
    ["antecedents"][0]["execution_id"])
CONVERSATION = S7["execution"]["row"]["session_id"]
WORKSPACE = CAPTURED["steps"]["user"]["workspace_id"]
ORIGIN = S7["requirement_event"]["accepted_request"]["origin"]
SCOPE_CHANGE = S7["requirement_event"]["accepted_request"]["scope_change"]


def _cf() -> dict:
    return dict(S7["fallback_state"]["context_fulfillment"])


def _requirement() -> dict:
    return dict(S7["requirement_summary"])


def _fallback() -> dict:
    return dict(S7["fallback_state"])


def _task(*, delivered: bool = True,
          objective_met=None) -> dict:
    return {"delivery": {"delivered": delivered},
            "objective_met": objective_met}


def _partial_final() -> dict:
    return {"final_success": True, "final_outcome": "partial"}


def _completed_final() -> dict:
    return {"final_success": True, "final_outcome": "completed"}


def _structured_obligations() -> list:
    return json.loads(json.dumps(
        TASK["task_revision"]["unresolved"]))


def _antecedent_refs() -> dict:
    return json.loads(json.dumps(
        S7["observation"]["apply"]["decision_refs_after"]
        ["continuation_evidence"]))


def _observed() -> list:
    return json.loads(json.dumps(S7["observation"]["apply"]["observed"]))


def _antecedent_record(*, session: str = CONVERSATION,
                       workspace: str = WORKSPACE,
                       fixture: bool = True,
                       verified: bool = True) -> dict:
    refs = ([{"kind": "context_source", "file_name": FIXTURE,
              "content_hash": "", "source": "ingested"}]
            if fixture else [])
    return {
        "row_id": ANTECEDENT_ID,
        "started_at": "2026-10-20 11:00:28",
        "completed_at": "2026-10-20 11:01:00",
        "status": "failed",
        "session_id": session,
        "user_id": CAPTURED["steps"]["user"]["id"],
        "workspace_id": workspace,
        "task_outcome": {
            "tool_outcomes": [{
                "tool": "context_assembly",
                "verified": verified,
                "outcome": "retrieved 2 source(s) into context",
                "evidence_refs": refs,
            }],
            "evidence_refs": [],
        },
    }


def _source_ok(records: dict, **overrides) -> bool:
    kwargs = dict(
        refs=_antecedent_refs(),
        observed=_observed(),
        origin=ORIGIN,
        scope_change=SCOPE_CHANGE,
        expected_conversation_id=CONVERSATION,
        expected_workspace_id=WORKSPACE,
        antecedent_records=records,
    )
    kwargs.update(overrides)
    return gates.continuation_source_ok(**kwargs)


def _load_runner():
    spec = importlib.util.spec_from_file_location(
        "attempt3_successor_runner", RUNNER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


# ---------------------------------------------------------------------------
# The two reproduced false positives (exact inputs from the review)
# ---------------------------------------------------------------------------
def _old_cf_completed_scope(cf: dict) -> bool:
    """The 636c9c9f9 predicate, kept to prove the reproduction."""
    matched = [str(m.get("file_name") or "")
               for m in (cf.get("matched") or [])
               if isinstance(m, dict)]
    supplied = [str(f) for f in (cf.get("supplied_fields") or [])]
    date_field = any(w in " ".join(supplied).casefold()
                     for w in ("expiration", "valid", "date"))
    return bool(
        cf.get("state") == "completed"
        and FIXTURE in matched
        and date_field
        and not cf.get("missing_comparison")
        and not (cf.get("missing_fields") or []))


def _old_s7_settlement_ok(final: dict, cf: dict, task: dict,
                          fallback: dict) -> bool:
    """The 636c9c9f9 partial predicate, kept to prove the reproduction."""
    if final.get("final_success") is not True:
        return False
    outcome = final.get("final_outcome")
    delivered = ((task.get("delivery") or {}).get("delivered") is True)
    if outcome == "completed":
        return _old_cf_completed_scope(cf) and not (
            (fallback or {}).get("open_work") or [])
    if outcome == "partial":
        open_work = [str(w) for w in
                     ((fallback or {}).get("open_work") or [])]
        prior_obligation = any(PRIOR in w for w in open_work)
        own_gap = any(
            "comparison" in w.casefold()
            and ("not recorded" in w.casefold()
                 or "not verified" in w.casefold())
            for w in open_work)
        return bool(
            _old_cf_completed_scope(cf)
            and delivered
            and prior_obligation
            and not own_gap)
    return False


def test_unrelated_date_field_is_rejected():
    """Reproduced: ``supplied_fields=["unrelated_date"]`` passed 636c9c9f9
    because ``"date"`` is a substring of ``"unrelated_date"``."""
    cf = dict(_cf(), supplied_fields=["unrelated_date"])
    assert "date" in "unrelated_date"
    assert _old_cf_completed_scope(cf) is True, (
        "the old predicate must be shown to reproduce the false positive")
    assert gates.cf_completed_scope(cf, _requirement()) is False


@pytest.mark.parametrize("supplied", [
    ["unrelated_date"],
    ["valid_until"],
    ["expiration_date", "unrelated_date"],
    ["expiration_date", "expiration_date"],
    [],
])
def test_supplied_date_coverage_must_be_exact(supplied):
    cf = dict(_cf(), supplied_fields=supplied)
    assert gates.cf_completed_scope(cf, _requirement()) is False


def test_missing_date_coverage_is_rejected():
    cf = dict(_cf(), supplied_fields=[DATE_FIELD],
              missing_fields=[DATE_FIELD])
    assert gates.cf_completed_scope(cf, _requirement()) is False
    cf = dict(_cf(), supplied_fields=[DATE_FIELD], missing_comparison=True)
    assert gates.cf_completed_scope(cf, _requirement()) is False
    cf = dict(_cf(), state="partial")
    assert gates.cf_completed_scope(cf, _requirement()) is False


def test_requested_field_set_must_be_exact():
    req = dict(_requirement(), fields=["valid_until"])
    assert gates.cf_completed_scope(_cf(), req) is False
    req = dict(_requirement(), fields=[DATE_FIELD, "unrelated_date"])
    assert gates.cf_completed_scope(_cf(), req) is False
    req = dict(_requirement(), fields=[])
    assert gates.cf_completed_scope(_cf(), req) is False


def test_current_field_gap_is_rejected_for_a_partial():
    """Reproduced: the prior obligation plus "current requested field could
    not be checked" was accepted because only ONE recognized gap was
    required and the extra gap used no negative "comparison" phrase."""
    fallback = dict(_fallback(), open_work=[
        PRIOR, "current requested field could not be checked"])
    final = _partial_final()
    task = _task()
    assert _old_s7_settlement_ok(final, _cf(), task, fallback) is True, (
        "the old predicate must be shown to reproduce the false positive")
    assert gates.s7_settlement_ok(
        final, _cf(), task, fallback, _requirement(), None) is False


def test_current_field_gap_is_not_hidden_by_structured_obligations():
    """The structured record names only the prior question; the extra text
    gap must still reject. Structured identity is not a licence to ignore
    the recorded open-work text."""
    fallback = dict(_fallback(), open_work=[
        PRIOR, "current requested field could not be checked"])
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(), fallback, _requirement(),
        _structured_obligations()) is False


# ---------------------------------------------------------------------------
# Every open obligation must belong to the prior S3 verification
# ---------------------------------------------------------------------------
def test_honest_partial_with_only_the_prior_obligation_is_accepted():
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(), _fallback(), _requirement(),
        _structured_obligations()) is True


def test_honest_partial_text_fallback_is_accepted():
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(),
        dict(_fallback(), open_work=[PRIOR]), _requirement(), None) is True


def test_partial_without_the_prior_obligation_is_rejected():
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(),
        dict(_fallback(), open_work=[]), _requirement(), None) is False
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(),
        dict(_fallback(), open_work=[]), _requirement(), []) is False


def test_additional_unknown_text_obligation_is_rejected():
    fallback = dict(_fallback(), open_work=[
        PRIOR, "check the payment terms against the approved record"])
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(), fallback, _requirement(),
        None) is False
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(), fallback, _requirement(),
        _structured_obligations()) is False


def test_additional_unknown_structured_obligation_is_rejected():
    obligations = _structured_obligations() + [{
        "question_id": "unknown-question",
        "source_operation": "unknown-operation",
        "kind": "verification",
        "next_action": "check the payment terms",
        "status": "open",
    }]
    assert gates.all_open_work_is_prior_s3(
        dict(_fallback(), open_work=[]), obligations) is False
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(), _fallback(), _requirement(),
        obligations) is False


def test_resolved_structured_obligations_do_not_count_as_open():
    obligations = [dict(q, status="resolved")
                   for q in _structured_obligations()]
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(),
        dict(_fallback(), open_work=[]), _requirement(),
        obligations) is False


def test_partial_scope_still_requires_exact_date_coverage():
    cf = dict(_cf(), state="partial", missing_comparison=True)
    assert gates.s7_settlement_ok(
        _partial_final(), cf, _task(), _fallback(), _requirement(),
        _structured_obligations()) is False


def test_partial_still_requires_a_delivery():
    assert gates.s7_settlement_ok(
        _partial_final(), _cf(), _task(delivered=False), _fallback(),
        _requirement(), _structured_obligations()) is False


# ---------------------------------------------------------------------------
# Completed / captured pre-fix / S3 timeout
# ---------------------------------------------------------------------------
def test_clean_completed_is_accepted_only_with_no_open_work():
    assert gates.s7_settlement_ok(
        _completed_final(), _cf(),
        _task(objective_met=True), dict(_fallback(), open_work=[]),
        _requirement(), []) is True
    assert gates.s7_settlement_ok(
        _completed_final(), _cf(), _task(objective_met=True),
        _fallback(), _requirement(), _structured_obligations()) is False
    assert gates.s7_settlement_ok(
        _completed_final(), _cf(), _task(objective_met=None),
        dict(_fallback(), open_work=[]), _requirement(), []) is False


def test_captured_pre_fix_failed_settlement_is_still_rejected():
    assert S7["settlement"]["final_success"] is False
    assert S7["settlement"]["final_outcome"] == "failed"
    assert gates.s7_settlement_ok(
        S7["settlement"], _cf(), _task(), _fallback(), _requirement(),
        _structured_obligations()) is False


def test_captured_s3_timeout_does_not_pass_the_unchanged_latency_gate():
    """S3's latency gate is not part of this correction. The captured
    timeout has no settlement and no completed date scope, so it must keep
    the composed workflow non-passing."""
    runner = _load_runner()
    assert S3["settlement"]["final_success"] is None
    assert S3["settlement"]["final_outcome"] is None
    assert "time budget" in S3["settlement"]["final_message"]
    assert S3["requirement_summary"]["broader_comparison"] is True
    s3_cf = dict((S3.get("fallback_state") or {}).get(
        "context_fulfillment") or {})
    assert runner.settlement_ok(
        S3["settlement"], s3_cf, {"objective_met": None,
                                  "delivery": {}},
        S3.get("fallback_state") or {}) is False
    assert runner.cf_completed(s3_cf, {"objective_met": None,
                                       "delivery": {}}) is False
    assert gates.cf_completed_scope(s3_cf, S3["requirement_summary"]) is False


# ---------------------------------------------------------------------------
# Continuation antecedent attribution
# ---------------------------------------------------------------------------
def test_captured_antecedent_resolves_in_the_same_conversation_and_workspace():
    records = {ANTECEDENT_ID: _antecedent_record()}
    assert _source_ok(records) is True


def test_wrong_conversation_antecedent_is_rejected():
    records = {ANTECEDENT_ID: _antecedent_record(session="other-conversation")}
    assert _source_ok(records) is False


def test_wrong_workspace_antecedent_is_rejected():
    records = {ANTECEDENT_ID: _antecedent_record(workspace="other-workspace")}
    assert _source_ok(records) is False


def test_missing_antecedent_record_is_rejected():
    """Two carried ids agreeing is not attribution: the durable execution
    row must exist and be scope-bound."""
    assert _antecedent_refs()["antecedents"][0]["execution_id"] == (
        _observed()[1]["execution_id"])
    assert _source_ok({}) is False


def test_antecedent_that_never_supplied_the_fixture_is_rejected():
    records = {ANTECEDENT_ID: _antecedent_record(fixture=False)}
    assert _source_ok(records) is False


def test_unverified_antecedent_evidence_is_rejected():
    records = {ANTECEDENT_ID: _antecedent_record(verified=False)}
    assert _source_ok(records) is False


def test_antecedent_scope_is_still_required():
    assert _source_ok(
        {ANTECEDENT_ID: _antecedent_record()},
        refs=dict(_antecedent_refs(), resolved_file="other.txt")) is False
    assert _source_ok(
        {ANTECEDENT_ID: _antecedent_record()},
        refs=dict(_antecedent_refs(), state="unresolved")) is False
    assert _source_ok(
        {ANTECEDENT_ID: _antecedent_record()},
        origin="fallback") is False
    assert _source_ok(
        {ANTECEDENT_ID: _antecedent_record()},
        scope_change="unresolved") is False


# ---------------------------------------------------------------------------
# Runner wiring: structured obligations are preferred, fallback is bounded
# ---------------------------------------------------------------------------
def test_runner_uses_the_frozen_gate_module():
    runner = _load_runner()
    assert runner.cf_completed_scope is gates.cf_completed_scope
    assert runner.s7_settlement_ok is gates.s7_settlement_ok
    assert runner.continuation_source_ok is gates.continuation_source_ok
    assert runner.all_open_work_is_prior_s3 is (
        gates.all_open_work_is_prior_s3)


def test_runner_reads_structured_obligations_from_the_task_lifecycle(
        tmp_path):
    runner = _load_runner()
    db = tmp_path / "scratch.db"
    con = sqlite3.connect(db)
    try:
        con.execute("CREATE TABLE goal_runs (id TEXT, parameters TEXT)")
        lifecycle = {
            "conversation_id": CONVERSATION,
            "task_revision": {"unresolved": _structured_obligations()},
        }
        con.execute(
            "INSERT INTO goal_runs (id, parameters) VALUES (?, ?)",
            ("run-1", json.dumps({"task_lifecycle": lifecycle})))
        con.commit()
    finally:
        con.close()

    obligations = runner.open_task_obligations(db, CONVERSATION)
    assert obligations == _structured_obligations()
    assert runner.open_task_obligations(db, "other-conversation") is None


def test_runner_returns_none_when_no_task_record_is_available(tmp_path):
    runner = _load_runner()
    db = tmp_path / "empty.db"
    sqlite3.connect(db).close()
    assert runner.open_task_obligations(db, CONVERSATION) is None
