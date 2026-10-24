#!/usr/bin/env python3
"""L2 served acceptance ATTEMPT 12 — field-scope repair successor on the
DeepSeek direct API (declared provider substitution; candidate unchanged).

Reuses the attempt-1 runner unchanged and adds the predeclared stage
record, per-turn total latency, S3 verified-narration gate, and S7
action/capture evidence.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import run_l2_served as base  # noqa: E402

base.ATTEMPT = "12"
base.CANDIDATE_SHA = "c0cbea9f191a9c41d67db7cddf3446f17318884d"
base.PARENT_SHA = "b70f9fa65ace13b59c8ebadd1ffcd968f2f033a1"
base.SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-fix/scratch/l2-continuation-served-attempt12")
base.PORT = 8108
base.BASE = f"http://127.0.0.1:{base.PORT}"
base.PRE_DECL = HERE / "PREDECLARED_CONFIG_ATTEMPT12.md"
base.HERE = HERE

_original_declared_env = base.declared_env

# Declared provider substitution for this attempt: DeepSeek direct.
base.CREDENTIAL_PROVIDER = "deepseek"
base.CREDENTIAL_VAULT_KEY = "tenant_default_deepseek_default_production"
base.CREDENTIAL_KEY_NAME = "default"
base.CREDENTIAL_ENVIRONMENT = "production"
base.CREDENTIAL_LABEL = "Authorized L2 acceptance route (DeepSeek direct)"
base.CREDENTIAL_ROUTE = "https://api.deepseek.com/v1"
base.CREDENTIAL_STEP = "deepseek_activation"
base.MODEL_PROVIDER_LABEL = "deepseek (only)"
base.INTERPRETATION_MODE_LABEL = (
    "real, pinned deepseek:deepseek-v4-pro (unpinned fallback); "
    "actual origin/model recorded")
DEEPSEEK_PIN = "deepseek:deepseek-v4-pro"


def _deepseek_env():
    env = _original_declared_env()
    env["ATOM_TURN_INTERPRET_CAPTURE"] = "1"
    env["ATOM_TURN_INTERPRET_PIN"] = DEEPSEEK_PIN
    return env


base.declared_env = _deepseek_env

FIXTURE = "approved_records_q2026_114.txt"
WRONG_VALUES = ("2023-01-01", "2026-12-30")


def _stages(result: dict) -> dict:
    events = result.get("observation_events") or []
    log_path = HERE / "attempt12_server.log"
    log_text = log_path.read_text(errors="replace") if log_path.exists() else ""
    lines = log_text.splitlines()

    def _interp(request_id):
        for event in events:
            if event.get("event") != "interpret_turn_request":
                continue
            interp = event.get("interpretation") or {}
            if interp.get("request_id") == request_id:
                return interp
        return {}

    def _dispatch(request_id):
        needle = f"route=turn_interpretation:{request_id}"
        return any("[structured-dispatch]" in ln and needle in ln
                   for ln in lines)

    turns = {}
    for label in ("s3", "s7"):
        step = (result.get("steps") or {}).get(label) or {}
        request_id = str(step.get("request_id") or "")
        interp = _interp(request_id)
        origin = str(interp.get("origin") or "")
        completed = origin.startswith("llm")
        total_s = step.get("latency_s") or 0
        capture_lines = [
            ln for ln in lines
            if "[turn-interpretation-capture]" in ln
            and request_id in ln]
        capture_phases = sorted({
            "pre_validation" if '"pre_validation"' in ln
            else "post_validation"
            for ln in capture_lines
            if '"phase"' in ln})
        turns[label] = {
            "request_id": request_id,
            "dispatch_attempted": _dispatch(request_id),
            "completed_within_deadline": completed,
            "producer_output_valid": bool(
                completed and not interp.get("unresolved_reason")),
            "interpretation_origin": origin,
            "interpretation_unresolved_reason": interp.get(
                "unresolved_reason"),
            "interpretation_sources": interp.get("sources"),
            "scope_change": interp.get("scope_change"),
            "action_count": len(interp.get("actions") or []),
            "action_kinds": [
                str((action or {}).get("kind") or "")
                for action in (interp.get("actions") or [])
                if isinstance(action, dict)],
            "capture_archived": bool(capture_lines),
            "capture_phases": capture_phases,
            "total_turn_latency_s": total_s,
        }
    s7 = (result.get("steps") or {}).get("s7") or {}
    requirement = s7.get("requirement_summary") or {}
    identity = requirement.get("identity") or {}
    apply_event = ((s7.get("observation") or {}).get("apply") or {})
    marker = ((apply_event.get("decision_refs_after") or {})
              .get("continuation_evidence") or {})
    s7_identity = bool(
        identity.get("state") == "resolved"
        and identity.get("file_name") == FIXTURE
        and marker.get("state") == "resolved"
        and marker.get("resolved_file") == FIXTURE)
    s3_step = (result.get("steps") or {}).get("s3") or {}
    s3_cf = (s3_step.get("context_fulfillment")
             or (s3_step.get("fallback_state") or {}).get(
                 "context_fulfillment") or {})
    s3_broader_open = bool(
        s3_cf.get("state") == "partial"
        and (s3_cf.get("missing_comparison")
             or s3_cf.get("missing_fields")))
    s7_cf = (s7.get("context_fulfillment")
             or (s7.get("fallback_state") or {}).get(
                 "context_fulfillment") or {})
    s7_narrow_completed = bool(
        (s7.get("settlement") or {}).get("final_outcome") == "completed"
        and s7_cf.get("state") == "completed"
        and requirement.get("fields") == ["expiration_date"]
        and requirement.get("broader_comparison") is False)
    s3_msg = str(((s3 := (result.get("steps") or {}).get("s3") or {})
                  .get("settlement") or {}).get("final_message") or "")
    s3_low = s3_msg.casefold()
    s3_verified_narration = bool(
        "2026-12-31" in s3_msg
        and not any(value in s3_msg for value in WRONG_VALUES))
    s3_no_global_consistency_claim = (
        "everything appears consistent" not in s3_low
        and "everything matches" not in s3_low
        and "no other differences" not in s3_low)
    s3_terms_recorded = bool(
        ("net 45" in s3_low and "net 30" in s3_low)
        or ("terms" in s3_low and ("differ" in s3_low
                                   or "discrepan" in s3_low)))
    total_ok = bool(
        turns.get("s3", {}).get("total_turn_latency_s", 999) <= 95.0
        and turns.get("s7", {}).get("total_turn_latency_s", 999) <= 95.0)
    return {
        "turns": turns,
        "stage_summary": {
            "dispatch_attempted": bool(
                turns.get("s3", {}).get("dispatch_attempted")
                and turns.get("s7", {}).get("dispatch_attempted")),
            "completed_within_deadline": bool(
                turns.get("s3", {}).get("completed_within_deadline")
                and turns.get("s7", {}).get("completed_within_deadline")),
            "producer_output_valid": bool(
                turns.get("s3", {}).get("producer_output_valid")
                and turns.get("s7", {}).get("producer_output_valid")),
            "source_identity_resolved": s7_identity,
            "s3_broader_obligation_open": s3_broader_open,
            "s7_date_only_completed": s7_narrow_completed,
            "s7_actions_proposed": bool(
                turns.get("s7", {}).get("action_count", 0) > 0
                and all(kind in (
                    "research", "learning", "canvas_edit", "calculation",
                    "presentation", "conversation")
                    for kind in turns.get("s7", {}).get("action_kinds", []))),
            "s7_capture_archived": bool(
                turns.get("s7", {}).get("capture_archived")
                and "pre_validation" in turns.get(
                    "s7", {}).get("capture_phases", [])
                and "post_validation" in turns.get(
                    "s7", {}).get("capture_phases", [])),
        },
        "s3_verified_narration": s3_verified_narration,
        "s3_terms_recorded": s3_terms_recorded,
        "s3_no_global_consistency_claim": s3_no_global_consistency_claim,
        "s3_terms_limitation_named": bool(
            "payment terms" in s3_low
            and ("net 45" in s3_low and "net 30" in s3_low
                 or "no verified value" in s3_low)
            and ("broader comparison obligation: open" in s3_low
                 or s3_terms_recorded)),
        "s3_reply": s3_msg,
        "total_turn_latency_ok": total_ok,
    }


def _write_summary(result: dict) -> None:
    steps = result.get("steps") or {}
    stages = result.get("stages") or {}
    summary = {
        "attempt": "12",
        "status": "PASSED" if result.get("pass") else "NOT_PASSED",
        "pass": bool(result.get("pass")),
        "classification": result.get("classification"),
        "first_failure": result.get("first_failure"),
        "candidate": (result.get("declared_config") or {}).get("candidate"),
        "predeclared_config": (result.get("declared_config") or {}).get(
            "predeclared_config"),
        "stages": stages,
        "checks": result.get("checks"),
        "observed": {
            "s3": {
                "execution_id": ((steps.get("s3") or {}).get("execution")
                                 or {}).get("response_execution_id"),
                "outcome": ((steps.get("s3") or {}).get("settlement")
                            or {}).get("final_outcome"),
                "success": ((steps.get("s3") or {}).get("settlement")
                            or {}).get("final_success"),
                "message": ((steps.get("s3") or {}).get("settlement")
                            or {}).get("final_message"),
                "requirement": (steps.get("s3") or {}).get(
                    "requirement_summary"),
            },
            "s7": {
                "execution_id": ((steps.get("s7") or {}).get("execution")
                                 or {}).get("response_execution_id"),
                "outcome": ((steps.get("s7") or {}).get("settlement")
                            or {}).get("final_outcome"),
                "success": ((steps.get("s7") or {}).get("settlement")
                            or {}).get("final_success"),
                "message": ((steps.get("s7") or {}).get("settlement")
                            or {}).get("final_message"),
                "requirement": (steps.get("s7") or {}).get(
                    "requirement_summary"),
                "context_fulfillment": (steps.get("s7") or {}).get(
                    "context_fulfillment"),
                "interpretation": (
                    ((steps.get("s7") or {}).get("observation") or {})
                    .get("interpretation") or {}).get("interpretation"),
                "capture": (stages.get("turns") or {}).get("s7"),
            },
            "served_log_evidence": steps.get("served_log_evidence"),
            "live_db_unchanged": (result.get("live_db_guard_after") or {}
                                  ).get("unchanged"),
            "pilot_untouched": result.get("pilot_untouched"),
        },
        "scope": (
            "Candidate/configuration-bound served claim only; no pilot "
            "deployment, no general NL reference-resolution claim, no "
            "restart-durability claim."),
    }
    (HERE / "summary_attempt12.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True, default=str) + "\n")


if __name__ == "__main__":
    rc = base.main()
    result_path = HERE / "attempt12_result.json"
    if result_path.exists():
        try:
            payload = json.loads(result_path.read_text())
            stages = _stages(payload)
            payload["stages"] = stages
            checks = payload.get("checks") or {}
            # The typed-field gate replaces the old terms-required check:
            # the verified narration must carry the correct value and no
            # false approved date; the terms difference is recorded.
            checks["s3_verified_narration"] = stages[
                "s3_verified_narration"]
            checks["total_turn_latency_within_budget"] = stages[
                "total_turn_latency_ok"]
            checks["s3_no_global_consistency_claim"] = stages[
                "s3_no_global_consistency_claim"]
            checks["s3_terms_limitation_named"] = stages[
                "s3_terms_limitation_named"]
            checks["s7_actions_proposed"] = stages[
                "stage_summary"]["s7_actions_proposed"]
            checks["s7_capture_archived"] = stages[
                "stage_summary"]["s7_capture_archived"]
            checks["s3_broader_obligation_open"] = stages[
                "stage_summary"]["s3_broader_obligation_open"]
            checks["s7_date_only_completed"] = stages[
                "stage_summary"]["s7_date_only_completed"]
            checks.pop("s3_truthful_comparison", None)
            payload["checks"] = checks
            payload["pass"] = all(checks.values())
            order = [
                ("runtime_identity", "runtime_identity_mismatch"),
                ("fixture_uploaded_through_product", "upload_failed"),
                ("draft_created_through_product", "draft_create_failed"),
                ("real_interpretation_dispatched",
                 "interpretation_not_real_or_not_dispatched"),
                ("prior_evidence_observed", "prior_evidence_missing"),
                ("s3_reply_received", "s3_no_reply"),
                ("s3_verified_narration", "s3_untruthful_comparison"),
                ("s3_zero_canvas_writes", "s3_canvas_write"),
                ("s3_draft_unchanged", "s3_draft_changed"),
                ("s3_settlement_basis", "s3_settlement_not_validated"),
                ("s3_requirement_captured", "s3_requirement_missing"),
                ("s3_broader_obligation_open", "s3_broader_obligation_closed"),
                ("s3_no_global_consistency_claim",
                 "s3_global_consistency_claim"),
                ("s3_terms_limitation_named",
                 "s3_terms_limitation_missing"),
                ("total_turn_latency_within_budget",
                 "total_latency_over_budget"),
                ("s7_reply_received", "s7_no_reply"),
                ("s7_truthful_comparison", "s7_untruthful_comparison"),
                ("s7_zero_new_writes", "s7_canvas_write"),
                ("s7_draft_unchanged", "s7_draft_changed"),
                ("s7_requirement_captured", "s7_requirement_missing"),
                ("s7_resolved_source_identity", "s7_source_not_resolved"),
                ("s7_actions_proposed", "s7_actions_missing"),
                ("s7_capture_archived", "s7_capture_missing"),
                ("s7_date_only_completed", "s7_date_only_not_completed"),
                ("s7_settlement_basis", "s7_settlement_not_validated"),
                ("response_persisted_fresh_history_agreement",
                 "s3_history_disagreement"),
                ("s7_response_persisted_fresh_history_agreement",
                 "s7_history_disagreement"),
                ("live_db_unchanged", "live_db_changed"),
                ("pilot_untouched", "pilot_touched"),
            ]
            payload["first_failure"] = next(
                (cls for key, cls in order if not checks.get(key)), None)
            payload["classification"] = (
                "verified_l2_continuation_evidence"
                if payload["pass"] else (
                    payload.get("first_failure") or "unclassified_failure"))
            result_path.write_text(
                json.dumps(payload, indent=2, sort_keys=True, default=str))
            _write_summary(payload)
            print(json.dumps({
                "attempt": "12",
                "pass": payload["pass"],
                "stages": stages.get("stage_summary"),
                "s3_verified_narration": stages.get("s3_verified_narration"),
                "s3_terms_recorded": stages.get("s3_terms_recorded"),
                "total_turn_latency_ok": stages.get(
                    "total_turn_latency_ok"),
                "first_failure": payload.get("first_failure"),
            }, indent=2, default=str))
        except Exception as exc:  # noqa: BLE001
            print(f"post-processing failed: {exc!r}")
    sys.exit(rc)
