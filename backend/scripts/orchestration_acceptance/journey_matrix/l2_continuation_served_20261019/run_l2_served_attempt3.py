#!/usr/bin/env python3
"""L2 served acceptance ATTEMPT 3 — the bounded execution-policy
successor `10982e8390815ee394c853284d5accfd3e3ddee7`.

Same S3→S7 job and declared configuration as attempts 1/2; only the
candidate, the scratch world, the port and the deliverable names change.
The attempt-1 runner (`run_l2_served.py`) is reused unchanged; this
wrapper adds the predeclared stage record (dispatch_attempted /
completed_within_deadline / producer_output_valid /
source_identity_resolved) and the machine summary after the run.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import run_l2_served as base  # noqa: E402

base.ATTEMPT = "3"
base.CANDIDATE_SHA = "10982e8390815ee394c853284d5accfd3e3ddee7"
base.SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-fix/scratch/l2-continuation-served-attempt3")
base.PORT = 8097
base.BASE = f"http://127.0.0.1:{base.PORT}"
base.PRE_DECL = HERE / "PREDECLARED_CONFIG_ATTEMPT3.md"
base.HERE = HERE

FIXTURE = "approved_records_q2026_114.txt"


def _compute_stages(result: dict) -> dict:
    events = result.get("observation_events") or []
    log_text = ""
    log_path = HERE / "attempt3_server.log"
    if log_path.exists():
        log_text = log_path.read_text(errors="replace")
    log_lines = log_text.splitlines()

    def _interpretation(request_id: str) -> dict:
        for event in events:
            if event.get("event") != "interpret_turn_request":
                continue
            interp = event.get("interpretation") or {}
            if interp.get("request_id") == request_id:
                return interp
        return {}

    def _dispatch(request_id: str) -> bool:
        needle = f"route=turn_interpretation:{request_id}"
        return any("[structured-dispatch]" in ln and needle in ln
                   for ln in log_lines)

    def _trace(request_id: str) -> bool:
        needle = f"route=turn_interpretation:{request_id}"
        return any("[structured-trace]" in ln and needle in ln
                   for ln in log_lines)

    turns: dict = {}
    for label in ("s3", "s7"):
        step = (result.get("steps") or {}).get(label) or {}
        request_id = str(step.get("request_id") or "")
        interp = _interpretation(request_id)
        origin = str(interp.get("origin") or "")
        completed = origin.startswith("llm:")
        turns[label] = {
            "request_id": request_id,
            "dispatch_attempted": _dispatch(request_id),
            "completed_within_deadline": completed,
            "structured_trace_logged": _trace(request_id),
            "producer_output_valid": bool(
                completed and not interp.get("unresolved_reason")),
            "interpretation_origin": origin,
            "interpretation_unresolved_reason": interp.get(
                "unresolved_reason"),
            "interpretation_sources": interp.get("sources"),
        }
    s7_step = (result.get("steps") or {}).get("s7") or {}
    requirement = s7_step.get("requirement_summary") or {}
    identity = requirement.get("identity") or {}
    apply_event = ((s7_step.get("observation") or {}).get("apply") or {})
    marker = ((apply_event.get("decision_refs_after") or {})
              .get("continuation_evidence") or {})
    source_identity_resolved = bool(
        identity.get("state") == "resolved"
        and identity.get("file_name") == FIXTURE
        and marker.get("state") == "resolved"
        and marker.get("resolved_file") == FIXTURE)
    stage_summary = {
        "dispatch_attempted": bool(
            turns.get("s3", {}).get("dispatch_attempted")
            and turns.get("s7", {}).get("dispatch_attempted")),
        "completed_within_deadline": bool(
            turns.get("s3", {}).get("completed_within_deadline")
            and turns.get("s7", {}).get("completed_within_deadline")),
        "producer_output_valid": bool(
            turns.get("s3", {}).get("producer_output_valid")
            and turns.get("s7", {}).get("producer_output_valid")),
        "source_identity_resolved": source_identity_resolved,
    }
    return {"turns": turns, "stage_summary": stage_summary}


def _write_summary(result: dict) -> None:
    stages = result.get("stages") or {}
    steps = result.get("steps") or {}
    summary = {
        "attempt": "3",
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
    (HERE / "summary_attempt3.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True, default=str) + "\n")


if __name__ == "__main__":
    rc = base.main()
    result_path = HERE / "attempt3_result.json"
    if result_path.exists():
        try:
            payload = json.loads(result_path.read_text())
            payload["stages"] = _compute_stages(payload)
            result_path.write_text(
                json.dumps(payload, indent=2, sort_keys=True, default=str))
            _write_summary(payload)
            print(json.dumps({
                "attempt": "3",
                "stages": payload["stages"].get("stage_summary"),
                "pass": payload.get("pass"),
                "first_failure": payload.get("first_failure"),
            }, indent=2, default=str))
        except Exception as exc:  # noqa: BLE001 — never hide the run result
            print(f"stage post-processing failed: {exc!r}")
    sys.exit(rc)
