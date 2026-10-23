"""Local replays/controls for the attempt-4 product failures.

These tests do not launch a campaign. They replay the preserved attempt-4
L3 answer and S3 canvas/grounding case through the repaired boundaries,
plus changed-subject/code, multiple-subject, explicit-both, unsupported,
and zero-write controls.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from core.answer_boundary import present_answer, render_supported_fact
from core.chat_tool_planner import (
    figure_issues,
    serialize_canvas_evidence,
)

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = (ROOT / "backend/scripts/orchestration_acceptance/journey_matrix/"
            "l1_l2_l3_integrated_served_20261020")
ATTEMPT4 = EVIDENCE / "attempt4_result.json"
CAPTURED = json.loads(ATTEMPT4.read_text())
L3 = CAPTURED["steps"]["l3"]
S3 = CAPTURED["steps"]["s3"]
L3_ASK = L3["ask"]
S3_ASK = S3["ask"]
CANVAS = S3["canvas_before"]


def _l3_envelope_and_answer() -> tuple[str, str]:
    served = L3["initial_response"]["message"]
    envelope, answer = served.split("\n\n", 1)
    return envelope, answer


def _tool_block(*records: tuple[str, str]) -> str:
    return (
        "LIVE TOOL RESULTS (documents.search) — hybrid search over the "
        "workspace's ingested documents:\n"
        + "\n".join(
            f"- [ingested] {name}: {body}" for name, body in records))


# ---------------------------------------------------------------------------
# L3 boundary capture + repair
# ---------------------------------------------------------------------------
def test_captured_l3_boundaries_are_the_same_echo():
    """served == persisted == reloaded: the finalization/persistence stages
    passed the reply-generation echo through unchanged. The first boundary
    that introduced the internal block is therefore the model output (or
    the prompt/evidence handoff that invited the echo), not persistence."""
    envelope, answer = _l3_envelope_and_answer()
    persisted = [
        row for row in (L3.get("persisted_rows") or [])
        if row.get("role") == "assistant"]
    reloaded = (L3.get("fresh_history") or {}).get(
        "assistant_response") or {}
    assert envelope.startswith("LIVE TOOL RESULTS (documents.search)")
    assert "BASALT-13" in envelope
    assert "QUARTZ-77" in answer
    assert L3["initial_response"]["message"] == persisted[-1]["content"]
    assert L3["initial_response"]["message"] == reloaded["message"]


def test_captured_l3_envelope_is_stripped_and_fact_survives():
    envelope, answer = _l3_envelope_and_answer()
    clean = present_answer(
        L3["initial_response"]["message"], envelope, L3_ASK)
    assert clean == answer
    assert "LIVE TOOL RESULTS" not in clean
    assert "QUARTZ-77" in clean
    assert "BASALT-13" not in clean
    assert "l3_zephyr9_fixture.txt" in clean


def test_l3_changed_subject_and_code_are_not_hardcoded():
    tool = _tool_block(
        ("fixture_b.txt",
         "ATOM fixture for Zephyr-10. The launch code for project "
         "Zephyr-10 is QUARTZ-88. Decoy: the archive key for Halcyon-3 "
         "is BASALT-99."))
    content = tool + "\n\nI found a match. The launch code is QUARTZ-88."
    clean = present_answer(
        content, tool, "what is the launch code for Zephyr-10?")
    assert "LIVE TOOL RESULTS" not in clean
    assert "QUARTZ-88" in clean
    assert "BASALT-99" not in clean
    assert "QUARTZ-77" not in clean


def test_l3_multiple_subjects_select_only_the_requested_one():
    tool = _tool_block(
        ("zephyr.txt",
         "The launch code for project Zephyr-9 is QUARTZ-77."),
        ("halcyon.txt",
         "The archive key for project Halcyon-2 is BASALT-13."))
    rendered = render_supported_fact(
        tool, "what is the launch code for Zephyr-9?")
    assert "QUARTZ-77" in rendered
    assert "BASALT-13" not in rendered
    both = render_supported_fact(
        tool, "tell me both the Zephyr-9 launch code and the Halcyon-2 "
              "archive key")
    assert "QUARTZ-77" in both
    assert "BASALT-13" in both
    assert both.count("(Source:") == 2


def test_l3_wrong_decoy_answer_is_corrected_from_evidence():
    tool = _tool_block(
        ("l3_zephyr9_fixture.txt",
         "The launch code for project Zephyr-9 is QUARTZ-77. "
         "Decoy: the archive key for project Halcyon-2 is BASALT-13."))
    content = tool + "\n\nThe launch code is BASALT-13."
    clean = present_answer(
        content, tool, L3_ASK)
    assert "BASALT-13" not in clean
    assert "QUARTZ-77" in clean
    assert "Source: l3_zephyr9_fixture.txt" in clean


def test_l3_ordinary_quotation_is_not_stripped():
    text = (
        'The draft says "Net 45", and the approved record says "Net 30". '
        "The launch code for project Zephyr-9 is QUARTZ-77 from "
        "l3_zephyr9_fixture.txt.")
    tool = _tool_block(
        ("l3_zephyr9_fixture.txt",
         "The launch code for project Zephyr-9 is QUARTZ-77."))
    clean = present_answer(text, tool, L3_ASK)
    assert 'The draft says "Net 45"' in clean
    assert "QUARTZ-77" in clean


def test_orchestrator_wires_the_repairs_at_the_boundaries():
    from integrations import chat_orchestrator as co

    src = Path(co.__file__).read_text()
    assert "from core.answer_boundary import present_answer" in src
    assert "present_answer(_content, _tool_block, message)" in src
    assert "serialize_canvas_evidence(" in src
    assert "_canvas_ctx, canvas_context" in src
    assert "figure_issues(" in src


# ---------------------------------------------------------------------------
# S3 figure grounding replay
# ---------------------------------------------------------------------------
S3_DRAFT_REPLY = (
    "The draft quotation lists a unit price of $48,000.00. "
    "The Valid Until date is 2026-12-31 in the draft and the approved "
    "record.")
S3_SOURCE_REPLY = (
    "The approved record lists a unit price of $48,000.00.")
S3_UNSUPPORTED_REPLY = "The unit price is $99,000.00."
S3_TOOL = (
    "LIVE TOOL RESULTS (documents.search):\n"
    "- [ingested] approved_records_q2026_114.txt: Approved valid until: "
    "2026-12-31")


def test_captured_s3_canvas_supports_the_challenged_figure():
    evidence = serialize_canvas_evidence(
        None, {"content": CANVAS})
    assert "$48,000.00" in evidence
    assert figure_issues(
        S3_DRAFT_REPLY,
        canvas_text=evidence,
        tool_text=S3_TOOL,
        message=S3_ASK,
    ) == []


def test_s3_without_passed_canvas_reproduces_the_false_positive():
    """The old guard read only the local (empty) canvas. Replaying that
    state flags the draft-supported figure; this is the repair target."""
    assert figure_issues(
        S3_DRAFT_REPLY,
        canvas_text="",
        tool_text=S3_TOOL,
        message=S3_ASK,
    )[0]["kind"] == "unsupported"


def test_s3_source_attribution_still_matters():
    misattributed = figure_issues(
        S3_SOURCE_REPLY,
        canvas_text=CANVAS,
        tool_text=S3_TOOL,
        message=S3_ASK,
    )
    assert misattributed[0]["kind"] == "misattributed_to_source"
    supported_tool = (
        S3_TOOL + "\n- [ingested] approved_records_q2026_114.txt: "
        "Approved unit price: $48,000.00")
    assert figure_issues(
        S3_SOURCE_REPLY,
        canvas_text=CANVAS,
        tool_text=supported_tool,
        message=S3_ASK,
    ) == []


def test_s3_unsupported_figure_is_still_withheld():
    issues = figure_issues(
        S3_UNSUPPORTED_REPLY,
        canvas_text=CANVAS,
        tool_text=S3_TOOL,
        message=S3_ASK,
    )
    assert issues[0]["kind"] == "unsupported"
    assert issues[0]["figure"] == "$99,000.00"


def test_s3_number_normalization_preserves_the_value():
    assert figure_issues(
        "The draft price is $48,000.",
        canvas_text=CANVAS,
        tool_text=S3_TOOL,
        message=S3_ASK,
    ) == []


def test_s3_turn_budget_remains_95_seconds():
    from integrations import chat_orchestrator as co

    assert co.CHAT_TURN_BUDGET_DEFAULT_SECONDS == 95.0


def test_serialize_canvas_evidence_prefers_the_available_context():
    assert "$48,000.00" in serialize_canvas_evidence(
        None, {"content": CANVAS})
    assert "$48,000.00" in serialize_canvas_evidence(
        {"content": CANVAS}, None)
    assert "$48,000.00" in serialize_canvas_evidence(
        {"canvas_content": CANVAS}, None)
    assert serialize_canvas_evidence(None, None) == ""


# ---------------------------------------------------------------------------
# Zero-write controls preserved from attempt 4
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("check", [
    "comparison_zero_writes",
    "comparison_draft_unchanged",
    "continuation_zero_writes",
    "continuation_draft_unchanged",
    "restart_zero_new_writes",
    "restart_canvas_unchanged",
])
def test_attempt4_zero_write_controls(check):
    assert CAPTURED["checks"][check] is True


def test_attempt4_remains_non_passing():
    assert CAPTURED["pass"] is False
    assert CAPTURED["first_failure"] == "l3_untruthful_answer"
    assert CAPTURED["checks"]["comparison_truthful_date"] is False
