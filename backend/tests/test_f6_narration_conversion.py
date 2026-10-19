# -*- coding: utf-8 -*-
"""F6 — narration conversion and delivery (Phase D finding, repaired).

Failing shape (candidate 68729ebe4, cloud path): whenever the non-streaming
narration leg ran on MiniMax, its ``<mm:thinking>`` residue tripped the
final-text validator and the WHOLE answer was replaced by the "unusable
output" placeholder (7/7 quarantined narrations). Two code defects:

1. the cleaner did not fully cover the wrapper variants (it removed only
   ``think``-suffixed tags, not ``thinking``-suffixed ones), and
2. both production call sites called the cleaner but DISCARDED its return
   value, so validation and every consumer saw raw residue.

Repair contract pinned here (the response boundary):

* complete reasoning wrappers of every variant convert to final-answer
  content; contents are captured as reasoning and never re-exposed;
* quoted/code examples that legitimately SHOW a marker are preserved;
* unpaired/partial markers are NOT stripped (that would promote reasoning
  text into an apparent answer) — they are rejected as incomplete/malformed;
* a non-empty reply that converts to empty (reasoning-only) is rejected, not
  delivered as an empty success;
* the same normalization applies to streaming assembly and the non-streaming
  final content, so streamed, persisted and public text agree.
"""
import pytest

from core.response_validation import (
    normalize_final_text,
    split_safe_prefix,
    strip_protocol_fragments,
    validate_response_payload,
)


class TestCompleteWrapperVariants:
    @pytest.mark.parametrize("raw,expected", [
        (
            "<mm:thinking>plan the steps</mm:thinking>"
            "Final answer: QUARTZ-77.",
            "Final answer: QUARTZ-77.",
        ),
        ("<thinking>internal</thinking>The answer is 42.", "The answer is 42."),
        ("<mm:think>internal</mm:think>The answer is 42.", "The answer is 42."),
        (
            '<think time="5s">internal</think>The answer is 42.',
            "The answer is 42.",
        ),
    ])
    def test_complete_wrappers_convert_to_final_answer(self, raw, expected):
        assert strip_protocol_fragments(raw) == expected

    def test_wrapper_contents_are_captured_not_exposed(self):
        captured: list = []
        out = strip_protocol_fragments(
            "<mm:thinking>the reasoning text</mm:thinking>"
            "The final answer.",
            captured=captured,
        )
        assert out == "The final answer."
        assert captured == ["the reasoning text"]
        assert "reasoning text" not in out

    def test_multiple_wrappers_convert_and_capture_in_order(self):
        captured: list = []
        out = strip_protocol_fragments(
            "<thinking>first</thinking>mid"
            "<mm:thinking>second</mm:thinking>end",
            captured=captured,
        )
        assert "first" not in out and "second" not in out
        assert "mid" in out and "end" in out
        assert captured == ["first", "second"]

    def test_wrapper_around_the_whole_reply(self):
        out = strip_protocol_fragments(
            "<mm:thinking>I should answer with QUARTZ-77</mm:thinking>"
        )
        assert out == ""

    def test_complete_tool_call_block_is_removed(self):
        out = strip_protocol_fragments(
            '<function_call>{"name": "search"}</function_call>Done.'
        )
        assert out == "Done."


class TestExamplePreservation:
    def test_quoted_marker_survives(self):
        raw = 'Use "<mm:thinking>" carefully in prompts.'
        assert strip_protocol_fragments(raw) == raw

    def test_code_fence_marker_survives(self):
        raw = "Example:\n```xml\n<mm:thinking>demo</mm:thinking>\n```\nDone."
        out = strip_protocol_fragments(raw)
        assert "<mm:thinking>" in out and "demo" in out
        assert out.endswith("Done.")

    def test_inline_code_marker_survives(self):
        raw = "The literal `<thinking>` tag is documented here."
        assert strip_protocol_fragments(raw) == raw


class TestIncompleteRejection:
    def test_unpaired_open_marker_is_not_stripped_and_is_rejected(self):
        raw = "<mm:thinking>secret reasoning that must not become the answer"
        # The marker survives conversion — its contents are NOT exposed.
        out = strip_protocol_fragments(raw)
        assert "<mm:thinking>" in out
        normalized, reject = normalize_final_text(raw)
        assert reject is not None
        assert "reasoning" in reject.lower()

    def test_unpaired_close_marker_is_rejected(self):
        raw = "An apparent answer</mm:thinking>"
        normalized, reject = normalize_final_text(raw)
        assert reject is not None

    def test_unpaired_marker_with_attributes_is_rejected(self):
        """Attribute-bearing variants must not slip through as 'not a
        marker' (review finding 11) — the block regex already treats them
        as protocol, so the unpaired form is incomplete protocol."""
        raw = 'Final answer. <mm:thinking attr="x">I should check the notes first.'
        normalized, reject = normalize_final_text(raw)
        assert reject is not None
        assert "reasoning" in reject.lower()

    def test_unpaired_namespaced_think_with_attributes_is_rejected(self):
        raw = 'Final answer. <mm:think reasoning="deep">secret chain of thought'
        _, reject = normalize_final_text(raw)
        assert reject is not None

    def test_streaming_holds_attribute_variant_residue(self):
        safe, held, residue = split_safe_prefix('hello <mm:thinking attr="x">')
        assert safe == "hello " and residue is True

    def test_reasoning_only_reply_is_rejected_not_empty_success(self):
        normalized, reject = normalize_final_text(
            "<mm:thinking>only reasoning</mm:thinking>")
        assert normalized == ""
        assert reject == "reasoning-only output (no final answer content)"

    def test_dangling_partial_marker_is_a_fragment_not_content(self):
        assert strip_protocol_fragments("The answer is <mm:thi") == "The answer is"
        normalized, reject = normalize_final_text("The answer is <mm:thi")
        assert normalized == "The answer is"
        assert reject is None

    def test_validator_rejects_still_malformed_after_conversion(self):
        validation = validate_response_payload(
            "<mm:thinking>unclosed", channel="final_text",
            content_type="text/markdown")
        assert validation.valid is False
        assert validation.reason == "reasoning tag residue"


class TestBoundaryConsistency:
    def test_non_streaming_shape_normalizes_then_validates(self):
        raw = (
            "<mm:thinking>The user asked for the marker. "
            "I found it in the document.</mm:thinking>\n"
            "The document states QUARTZ-77 (source: zephyr notes)."
        )
        normalized, reject = normalize_final_text(raw, content_type="text/plain")
        assert reject is None
        assert normalized.startswith("The document states QUARTZ-77")
        assert "<mm:thinking>" not in normalized
        assert validate_response_payload(
            normalized, channel="final_text",
            content_type="text/plain").valid

    def test_normalization_is_idempotent_for_persist_and_public(self):
        raw = "<thinking>a</thinking>Answer"
        once, _ = normalize_final_text(raw)
        twice, _ = normalize_final_text(once)
        assert once == twice == "Answer"

    def test_streaming_assembly_holds_residue_then_converts(self):
        safe, held, residue = split_safe_prefix("Hello <mm:think")
        assert safe == "Hello " and held == "<mm:think" and residue is False
        safe, held, residue = split_safe_prefix("Hello <mm:thinking>")
        assert safe == "Hello " and held == "" and residue is True
        assert strip_protocol_fragments(
            "Hello <mm:thinking>reason</mm:thinking>world"
        ) == "Hello world"

    def test_zero_width_characters_removed(self):
        raw = "<mm:thinking>a</mm:thinking>An\u200bswer"
        assert strip_protocol_fragments(raw) == "Answer"
