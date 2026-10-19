#!/usr/bin/env python3
"""Attempt-9 provenance diagnostic (no model run).

Reads the preserved attempt-9 scratch DB, observation log, and result to
record:

* which branch first set ``validated=True`` in the S7 resolver;
* where S7's requested fields entered the requirement/comparison contract;
* why the comparison carrier expanded to terms/price;
* the observed gap-suppression in ``_fallback_turn_outcome``.

It also evaluates the repaired narrow/broad comparison contract on the
same recorded request and source. No network/model call is made.
"""
from __future__ import annotations

import json
import os
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CAND_BACKEND = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-continuation-evidence/backend")
SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-fix/scratch/l2-continuation-served-attempt9")
DB = SCRATCH / "atom.db"
S7_EXEC = "68b506fb-4407-4fe7-b9b1-21c9bd121084"
S3_EXEC = "9be6b444-41aa-4cfe-92cc-3cdb7c6bd85d"

os.environ.setdefault("DATABASE_URL", f"sqlite:///{DB}")
os.environ.setdefault("ATOM_DATA_DIR", str(SCRATCH / "data"))
sys.path.insert(0, str(CAND_BACKEND))
sys.path.insert(0, str(HERE))


def _events():
    out = []
    path = HERE / "attempt9_observation.jsonl"
    for line in path.read_text(errors="replace").splitlines():
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out


def _run_record():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    row = con.execute(
        "SELECT parameters FROM goal_runs "
        "WHERE id='a5c4bf20-f66c-4c80-a5c6-e7a4ee2252d1'").fetchone()
    con.close()
    params = json.loads(row["parameters"] or "{}")
    return (params.get("task_lifecycle") or {})


def _execution_outcome(execution_id):
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    row = con.execute(
        "SELECT metadata_json FROM agent_executions WHERE id=?",
        (execution_id,)).fetchone()
    con.close()
    meta = json.loads(row["metadata_json"] or "{}") if row else {}
    return meta.get("task_outcome") or {}


def _receipt_is_complete(receipt):
    if not isinstance(receipt, dict) or receipt.get("verified") is not True:
        return False
    for ref in receipt.get("evidence_refs") or []:
        if not isinstance(ref, dict):
            continue
        count = ref.get("match_count")
        if (ref.get("coverage") == "complete"
                and isinstance(count, int) and not isinstance(count, bool)
                and count >= 0):
            return True
    count = receipt.get("match_count")
    return (receipt.get("coverage") == "complete"
            and isinstance(count, int) and not isinstance(count, bool)
            and count >= 0)


def main():
    from core.workbook_read_artifact import (
        comparison_request_shaped,
        extract_field_requests,
        verified_comparison_reply,
    )
    from integrations.chat_orchestrator import (
        _execution_verified_complete_search,
        _operation_carries_verified_complete_search,
        _operation_has_values,
    )

    events = _events()
    req_event = next(
        e for e in events
        if e.get("event") == "stash_evidence_requirement"
        and e.get("execution_id") == S7_EXEC)
    cf_event = next(
        e for e in events
        if e.get("event") == "context_backed_fulfillment"
        and e.get("execution_id") == S7_EXEC)
    fb_event = next(
        e for e in events
        if e.get("event") == "fallback_turn_outcome"
        and e.get("execution_id") == S7_EXEC)
    interp_event = next(
        e for e in events
        if e.get("event") == "apply_interpretation_references"
        and str(((e.get("interpretation") or {}).get("request_id")
                 or "")).startswith("l2-s7-"))
    interp = (interp_event.get("interpretation") or {})
    requirement = req_event.get("requirement") or {}

    message = req_event.get("message") or ""
    constraints = [str(c) for c in (interp.get("constraints") or [])]
    fields = extract_field_requests([message])
    broad_by_message = comparison_request_shaped(message)
    broad_by_accepted_constraints = any(
        comparison_request_shaped(c) for c in constraints if c.strip())

    run = _run_record()
    s7_op = next(
        op for op in (run.get("operations") or [])
        if str(op.get("execution_id") or "") == S7_EXEC)
    action_program_comparison = True
    search_receipts = [
        r for r in (_execution_outcome(S7_EXEC).get("tool_outcomes") or [])
        if _receipt_is_complete(r)]
    first_branch = "unconfirmed"
    branch_results = {
        "operation_has_values": bool(_operation_has_values(s7_op)),
        "operation_carries_verified_complete_search": bool(
            _operation_carries_verified_complete_search(s7_op)),
        "execution_verified_complete_search": bool(
            _execution_verified_complete_search(S7_EXEC)),
        "planner_receipts": None,
        "comparison_carrier_complete": None,
    }
    if branch_results["operation_has_values"]:
        first_branch = "operation_has_values"
    elif branch_results["operation_carries_verified_complete_search"]:
        first_branch = "operation_carries_verified_complete_search"
    elif branch_results["execution_verified_complete_search"]:
        first_branch = "execution_verified_complete_search"

    from integrations.chat_orchestrator import _comparison_carrier_complete
    branch_results["comparison_carrier_complete"] = bool(
        _comparison_carrier_complete(
            req_event.get("carriers", {}).get(
                f"_objective_evidence_{S7_EXEC}") or {}))

    # Compare the recorded (attempt-9) contract with the repaired
    # accepted-constraint contract on the same request/source.
    source = [{
        "source": "ingested",
        "file_name": "approved_records_q2026_114.txt",
        "content_hash": "",
        "excerpt": (
            "APPROVED RECORDS — Quotation Q-2026-114\n"
            "Approved unit price: $48,000.00\n"
            "Approved payment terms: Net 30\n"
            "Approved valid until: 2026-12-31\n"),
        "field_associations": {
            "expiration_date": {"value": "2026-12-31"},
        },
    }]
    canvas = {
        "canvas_id": "d2bc5eb2-af78-4417-a930-cc0363f33399",
        "title": "Quotation Q-2026-114 (DRAFT)",
        "content": (
            "# Quotation Q-2026-114 (DRAFT)\n"
            "Client: Dunmore Fabrication LLC\n"
            "Unit price: $48,000.00\n"
            "Terms: Net 45\n"
            "Valid until: 2026-12-31\n"),
    }

    def _coverage(broad):
        req = dict(requirement)
        req["fields"] = fields
        req["broader_comparison"] = broad
        out = verified_comparison_reply(
            message=message, reply="", canvas=canvas,
            source_observations=source, requirement=req)
        cov = ((out or {}).get("comparison") or {}).get("coverage") or {}
        return {
            "requested_fields": cov.get("requested_fields"),
            "request_complete": cov.get("request_complete"),
            "outcomes": [
                {"field": o.get("field"), "status": o.get("status")}
                for o in (cov.get("outcomes") or [])
                if isinstance(o, dict)],
        }

    out = {
        "attempt": 9,
        "candidate": "a3875d6bb",
        "s7_execution_id": S7_EXEC,
        "s3_execution_id": S3_EXEC,
        "request": message,
        "first_successful_validation_branch": first_branch,
        "branch_results": branch_results,
        "complete_search_receipts": [
            {"tool": r.get("tool"), "verified": r.get("verified"),
             "outcome": r.get("outcome")}
            for r in search_receipts],
        "field_provenance": {
            "canonical_fields_from_message": fields,
            "requirement_fields": requirement.get("fields"),
            "requirement_broader_comparison_attempt9": requirement.get(
                "broader_comparison"),
            "comparison_request_shaped_by_message": broad_by_message,
            "accepted_constraints": constraints,
            "broader_by_accepted_constraints": (
                broad_by_accepted_constraints),
            "interpretation_requested_fields": interp.get(
                "requested_fields"),
            "attempt9_comparison": _coverage(
                bool(requirement.get("broader_comparison"))),
            "repaired_narrow_comparison": _coverage(False),
            "repaired_broad_comparison": _coverage(True),
        },
        "settlement_observed": {
            "context_fulfillment": cf_event.get("verdict"),
            "resolver_state": fb_event.get("state"),
        },
        "why_extra_fields_applied": (
            "requirement.broader_comparison was set from the raw message's "
            "generic comparison shape ('does it still match'); "
            "verified_comparison_reply then ORed the same shape and expanded "
            "explicit_fields with every typed draft field. The accepted "
            "constraints carry no broad request, so the repaired contract "
            "keeps the S7 comparison to expiration_date."),
        "why_search_receipt_suppressed_gaps": (
            "The execution's documents.grep receipt is verified with "
            "coverage=complete and match_count=1, so validated=True before "
            "the context-fulfillment block. The old "
            "'if context_fulfillment and not validated' skipped the partial "
            "missing_comparison gap; the resolver then mapped "
            "validated + empty open_work to completed."),
    }
    (HERE / "diagnostic_s7_obligation_provenance.json").write_text(
        json.dumps(out, indent=2, sort_keys=True, default=str) + "\n")
    print(json.dumps(out, indent=2, sort_keys=True, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
