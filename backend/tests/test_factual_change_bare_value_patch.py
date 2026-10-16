# -*- coding: utf-8 -*-
"""Bare-value patch grounding (owner directive 2026-10-15; the J6 T1
evidence).

The editor's patch contract replaces the FIRST match of the op's find
text, and the find may carry the full labeled line or only the changed
span. Both forms are the SAME factual change and must validate
identically. The unlabeled form used to reach validation as
"(unlabelled)" — its value ("2026-12-31", plainly assigned by "update
the Valid Until date to 2026-12-31") had no target for the request's
own assignment to bind, so it was refused with
"the value for '' is not available from the instruction, records, or a
calculation" (live T1 apply failure, 2026-10-15). The change's target is
readable from the artifact line its find matches; these tests pin the
equivalence and the refusals that must survive it.
"""
import os

os.environ.setdefault("TESTING", "1")

from core.factual_change_validation import validate_factual_changes

QUOTE = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")
ASK = ("On this quotation, update the Valid Until date to "
       "2026-12-31. Change nothing else.")
RECORDS_ASK = ("Add the client's tax registration number to this "
               "quotation. Use the exact number from our records.")


class _Op:
    def __init__(self, find, replace, field=None, origin=None):
        self.find = find
        self.replace = replace
        self.field = field
        self.origin = origin


def test_bare_value_patch_grounds_from_the_artifacts_own_label():
    verdict = validate_factual_changes(
        ops=[_Op("2026-11-30", "2026-12-31")],
        current_text=QUOTE, request_message=ASK)
    assert verdict["grounded"] is True, verdict.get("refusals")
    assert not verdict.get("refusals")
    change = (verdict.get("changes") or [{}])[0]
    # the target the artifact line supplies — never the empty label
    assert change.get("field") == "Valid until", change
    assert change.get("value") == "2026-12-31", change


def test_labeled_and_bare_forms_of_the_same_change_validate_equivalently():
    labeled = validate_factual_changes(
        ops=[_Op("Valid until: 2026-11-30", "Valid until: 2026-12-31")],
        current_text=QUOTE, request_message=ASK)
    bare = validate_factual_changes(
        ops=[_Op("2026-11-30", "2026-12-31")],
        current_text=QUOTE, request_message=ASK)
    assert labeled["grounded"] is True
    assert bare["grounded"] is True
    assert not (labeled.get("refusals") or bare.get("refusals"))


def test_value_the_request_never_assigns_still_refuses():
    verdict = validate_factual_changes(
        ops=[_Op("2026-11-30", "2027-01-15")],
        current_text=QUOTE, request_message=ASK)
    assert verdict["grounded"] is False
    assert [r.get("reason") for r in verdict.get("refusals") or []] == [
        "unresolved_requirement"]
    # the refusal NAMES the target the artifact line supplies
    assert verdict["refusals"][0].get("target") == "Valid until"


def test_reference_valued_patch_still_refuses_with_its_named_target():
    verdict = validate_factual_changes(
        ops=[_Op("Terms: Net 30",
                 "Terms: Net 30\nTax number: the exact number from "
                 "our records", origin="source_reference")],
        current_text=QUOTE, request_message=RECORDS_ASK)
    assert verdict["grounded"] is False
    assert (verdict["refusals"][0].get("reason")
            == "unresolved_requirement")
    assert verdict["refusals"][0].get("target") == "Tax number"


def test_unlabeled_patch_on_an_unlabeled_line_stays_unlabeled():
    """No label on the artifact line → no invented target: a label-less
    line keeps the previous (refusing) behavior, so the label recovery
    cannot manufacture a subject for a change that has none."""
    text = "some free-form body copy\nold figure 100\n"
    verdict = validate_factual_changes(
        ops=[_Op("old figure 100", "old figure 250")],
        current_text=text,
        request_message="change the figure to 250")
    assert verdict["grounded"] is False
    assert (verdict["refusals"][0].get("reason")
            == "unresolved_requirement")
    assert verdict["refusals"][0].get("target") == ""
