"""Regression for the attempt-2 edit-result extraction (2026-10-19).

The composed runner's ``task_summary`` projection drops ``mutation``, so
the served edit was reported as unsettled even though the durable row
carried ``mutation.readback_matched=true``. The correction is additive:
merge the preserved ``execution.row.task_outcome`` under the summary.
This test reads the preserved attempt-2 result, never rewrites it.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVID = (ROOT / "backend/scripts/orchestration_acceptance/journey_matrix/"
        "l1_l2_l3_integrated_served_20261019")
RESULT = EVID / "attempt2_result.json"


def _load_runner():
    # The runner inserts its L2 evidence dependency itself; importing it
    # has no side effects (main() is guarded).
    spec = importlib.util.spec_from_file_location(
        "attempt2_composed_runner", EVID / "run_composed_served_attempt2.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_corrected_extraction_recovers_the_preserved_edit_mutation():
    runner = _load_runner()
    result = json.loads(RESULT.read_text())
    edit = result["steps"]["edit"]

    summary = edit["execution"]["task_summary"]
    assert "mutation" not in summary, (
        "the preserved summary is the old projection; this test proves the "
        "additive fallback, not a rewritten artifact")

    task = runner.task_of(edit)
    assert task["objective_met"] is True
    assert task["mutation"]["readback_matched"] is True, (
        "the durable row's mutation must be recovered from preserved "
        f"evidence; got {task.get('mutation')!r}")
    # Fields the summary already had are not overridden.
    assert task["delivery"] == summary["delivery"]
    assert task["execution_id"] == summary["execution_id"]

    ce = runner.canvas_edit_payload(edit)
    assert ce.get("outcome") == "completed"
    assert ce.get("postcondition_verified") is True
    assert ce.get("updated") is True

    edit_settled = bool(
        edit["initial_response"].get("success") is True
        and ce.get("outcome") == "completed"
        and ce.get("postcondition_verified") is True
        and ce.get("updated") is True
        and task.get("objective_met") is True
        and (task.get("mutation") or {}).get("readback_matched") is True)
    assert edit_settled is True, (
        "the corrected extraction must make edit_settled_completed true "
        "from the preserved evidence")
