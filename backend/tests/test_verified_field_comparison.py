# -*- coding: utf-8 -*-
"""Verified-field comparison reply controls (L2 narration defect).

The served comparison reply claimed a wrong approved date twice while the
retrieved excerpt carried the correct typed value. These controls pin the
typed-field adapter + deterministic renderer + reply guard:

* equal values -> a match line with both verified values;
* different values -> a difference line with both verified values;
* missing source value -> a specific "cannot claim a match" limitation;
* two subjects with different values -> both outcomes, no collapse;
* the guard replaces a reply that does not carry the verified source
  value and appends the comparison when it does.
"""
from __future__ import annotations

import os

os.environ.setdefault("TESTING", "1")

from core.workbook_read_artifact import (
    observations_from_field_associations,
    observations_from_key_value_text,
    verified_comparison_reply,
)

CANVAS = {
    "canvas_id": "canvas-q114",
    "title": "Quotation Q-2026-114 (DRAFT)",
    "content": (
        "# Quotation Q-2026-114 (DRAFT)\n\n"
        "Client: Dunmore Fabrication LLC\n"
        "Unit price: $48,000.00\n"
        "Terms: Net 45\n"
        "Valid until: 2026-12-31\n"),
}

SOURCE_EQUAL = [{
    "source": "ingested",
    "file_name": "approved_records_q2026_114.txt",
    "content_hash": "hash-a",
    "field_associations": {
        "expiration_date": {
            "value": "2026-12-31",
            "span": "Approved valid until: 2026-12-31",
        },
        "price": {
            "value": "$48,000.00",
            "span": "Approved unit price: $48,000.00",
        },
    },
}]

SOURCE_DIFFERENT = [{
    "source": "ingested",
    "file_name": "approved_records_q2026_114.txt",
    "content_hash": "hash-b",
    "field_associations": {
        "expiration_date": {"value": "2026-11-30"},
    },
}]

SOURCE_MISSING = [{
    "source": "ingested",
    "file_name": "approved_records_q2026_114.txt",
    "content_hash": "hash-c",
    "field_associations": {},
}]


def _requirement(fields=("expiration_date",)):
    return {"required": True, "sources": ["document"],
            "fields": list(fields), "subjects": [],
            "identity": {"state": "kind_only", "candidates": []},
            "artifact_attached": True}


def test_equal_values_render_a_verified_match():
    out = verified_comparison_reply(
        message="compare the draft with the approved record",
        reply="The draft's Valid until date is 2026-12-31, which matches.",
        canvas=CANVAS, source_observations=SOURCE_EQUAL,
        requirement=_requirement())
    assert out is not None
    assert out["replaced"] is False, out
    assert "2026-12-31 = approved_records_q2026_114.txt 2026-12-31" in (
        out["reply"]), out["reply"]
    assert "(match)" in out["reply"]


def test_different_values_render_a_verified_difference():
    out = verified_comparison_reply(
        message="compare the draft with the approved record",
        reply="The dates are 2026-12-31 and 2026-11-30, so they differ.",
        canvas=CANVAS, source_observations=SOURCE_DIFFERENT,
        requirement=_requirement())
    assert out is not None
    assert out["replaced"] is False, out
    assert "2026-12-31 vs approved_records_q2026_114.txt 2026-11-30" in (
        out["reply"]), out["reply"]
    assert "(difference)" in out["reply"]


def test_missing_source_value_is_a_specific_limitation():
    out = verified_comparison_reply(
        message="compare the draft with the approved record",
        reply="I could not find the approved date.",
        canvas=CANVAS, source_observations=SOURCE_MISSING,
        requirement=_requirement())
    assert out is not None
    # No verified source value -> the reply is replaced by the specific
    # limitation rather than letting an unverifiable prose claim stand.
    assert out["replaced"] is True, out
    assert "no verified value from approved_records_q2026_114.txt" in (
        out["reply"]), out["reply"]
    assert "cannot be claimed" in out["reply"]


def test_actual_defect_shape_is_replaced():
    """The served reply carried the correct draft/source value AND a
    wrong source value; presence of the correct value alone must not
    bless the contradiction."""
    out = verified_comparison_reply(
        message="Compare the draft with the approved record",
        reply=("The draft's Valid until date is 2026-12-31. The Approved "
               "Record specifies 2023-01-01, so the dates do not match."),
        canvas=CANVAS, source_observations=SOURCE_EQUAL,
        requirement=_requirement())
    assert out is not None
    assert out["replaced"] is True, out
    assert out["contradiction"] is True, out
    assert "2023-01-01" not in out["reply"], out["reply"]
    assert "2026-12-31 = approved_records_q2026_114.txt 2026-12-31" in (
        out["reply"]), out["reply"]


def test_same_sentence_correct_then_wrong_is_a_contradiction():
    out = verified_comparison_reply(
        message="Compare the draft with the approved record",
        reply=("The draft says 2026-12-31 and the approved record says "
               "2023-01-01, so they differ."),
        canvas=CANVAS, source_observations=SOURCE_EQUAL,
        requirement=_requirement())
    assert out is not None
    assert out["replaced"] is True, out
    assert out["contradiction"] is True, out
    assert "2023-01-01" not in out["reply"]


def test_non_extractable_text_field_does_not_trigger_the_guard():
    out = verified_comparison_reply(
        message="Compare the draft with the approved record",
        reply="The draft says Net 30.",
        canvas={"canvas_id": "c", "title": "draft",
                "content": "Warranty: Net 30\n"},
        source_observations=[{
            "file_name": "approved.txt",
            "field_associations": {"warranty": {"value": "Net 30"}},
        }],
        requirement={"required": True, "fields": ["warranty"],
                     "sources": ["document"]})
    assert out is None


def test_wrong_source_observation_cannot_supply_values():
    requirement = _requirement()
    requirement["identity"] = {
        "state": "resolved",
        "file_name": "approved_records_q2026_114.txt",
    }
    wrong = [{
        "source": "ingested",
        "file_name": "unapproved_records.txt",
        "field_associations": {
            "expiration_date": {"value": "2026-12-31"},
        },
    }]
    out = verified_comparison_reply(
        message="Compare the draft with the approved record",
        reply="The approved record says 2026-12-31.",
        canvas=CANVAS, source_observations=wrong,
        requirement=requirement)
    assert out is None


def test_partial_coverage_remains_partial_with_a_named_gap():
    requirement = _requirement(fields=("expiration_date", "price"))
    source = [{
        "source": "ingested",
        "file_name": "approved_records_q2026_114.txt",
        "content_hash": "hash-p",
        "field_associations": {
            "expiration_date": {"value": "2026-12-31"},
        },
    }]
    out = verified_comparison_reply(
        message="Compare the draft with the approved record",
        reply="The draft valid until is 2026-12-31.",
        canvas=CANVAS, source_observations=source,
        requirement=requirement)
    assert out is not None
    assert out["comparison"]["coverage"]["complete"] is False, out
    lowered = out["reply"].casefold()
    assert "price" in lowered and "no verified value" in lowered, out["reply"]


def test_deterministic_reply_makes_no_search_claim():
    out = verified_comparison_reply(
        message="Compare the draft with the approved record",
        reply="",
        canvas=CANVAS, source_observations=SOURCE_EQUAL,
        requirement=_requirement())
    assert out is not None
    lowered = out["reply"].casefold()
    assert "documents.search" not in lowered
    assert "i searched" not in lowered
    assert "i couldn't search" not in lowered


def test_draft_only_question_is_not_replaced():
    """A typed-field question that is not a comparison must not be
    converted into a source limitation."""
    out = verified_comparison_reply(
        message="What is the valid until date on the draft?",
        reply="The draft's valid until date is 2026-12-31.",
        canvas=CANVAS, source_observations=SOURCE_EQUAL,
        requirement=_requirement())
    assert out is None


def test_no_source_observations_is_not_replaced():
    out = verified_comparison_reply(
        message="Compare the draft with the approved record",
        reply="The draft's valid until date is 2026-12-31.",
        canvas=CANVAS, source_observations=[],
        requirement=_requirement())
    assert out is None


def test_two_subjects_with_different_values_are_both_present():
    body = (
        "Machine A valid until: 2026-12-31\n"
        "Machine B valid until: 2027-01-31\n")
    draft = observations_from_key_value_text(
        body, entity_id="draft", requested_fields=["expiration_date"],
        source={"source_id": "canvas-two"})
    assert len(draft) == 2, draft
    assert {o["entity_id"] for o in draft} == {"Machine A", "Machine B"}
    assert {o["raw_value"] for o in draft} == {"2026-12-31", "2027-01-31"}
    source_two = [{
        "source": "ingested",
        "file_name": "approved_records_q2026_114.txt",
        "content_hash": "hash-d",
        "field_associations": {
            "expiration_date": {"value": "2026-12-31",
                                 "subject": "Machine A"},
        },
    }]
    out = verified_comparison_reply(
        message="Compare the draft with the approved record",
        reply="",
        canvas={"canvas_id": "canvas-two", "title": "draft",
                "content": body},
        source_observations=source_two,
        requirement=_requirement())
    assert out is not None
    lowered = out["reply"].casefold()
    assert "machine a" in lowered and "(match)" in lowered, out["reply"]
    assert "machine b" in lowered and "no verified value" in lowered, (
        out["reply"])


def test_guard_replaces_a_reply_that_lacks_the_verified_value():
    out = verified_comparison_reply(
        message="compare the draft with the approved record",
        reply="The approved record says the Valid until date is 2023-01-01.",
        canvas=CANVAS, source_observations=SOURCE_EQUAL,
        requirement=_requirement())
    assert out is not None
    assert out["replaced"] is True, out
    assert "2023-01-01" not in out["reply"], out["reply"]
    assert "2026-12-31 = approved_records_q2026_114.txt 2026-12-31" in (
        out["reply"]), out["reply"]


def test_guard_does_not_apply_without_a_typed_field_requirement():
    assert verified_comparison_reply(
        message="hello", reply="hi", canvas=CANVAS,
        source_observations=SOURCE_EQUAL,
        requirement={"required": False, "fields": []}) is None
