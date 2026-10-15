# -*- coding: utf-8 -*-
"""The accepted-assignment contract (verifier corrected work order,
round 19 follow-up): the request's own recorded assignments are the
authority for user-supplied grounding.

The extractor (turn_decision.extract_request_assignments) records:
  - explicit assignments: "update/set/change X to <value>";
  - source references in the VALUE position ("the department from our
    records") as UNRESOLVED obligations — never as explicit assignments
    (the counted campaign 20261014_230725 bypass: the phrase appeared in
    the request and was grounded as user_supplied, certifying an echo);
  - "add <label>" with no supplied value as an unresolved addition.

The validator consumes this table: a proposed change grounds as
user_supplied ONLY when an accepted assignment for the same target
carries the value; a source_reference/unresolved origin refuses unless
the accepted evidence resolves it; an untagged digit-bearing value with
no grounding is an unresolved requirement — named, never certified.
"""
import os
os.environ.setdefault("TESTING", "1")

from core.factual_change_validation import (
    Provenance,
    Refusal,
    validate_factual_changes,
)


def _unsupported(r):
    return [x for x in r.get("refusals") or []
            if x.get("reason") == Refusal.UNSUPPORTED]


class _Op:
    def __init__(self, find, replace, field=None, origin=None):
        self.find = find
        self.replace = replace
        self.field = field
        self.origin = origin


HR_CURRENT = "Employee: J. Okafor\nDepartment: Logistics\n"


def _run(ops, message, accepted=None, contract=None):
    return validate_factual_changes(
        ops=ops,
        current_text=HR_CURRENT,
        request_message=message,
        evidence_contract=contract,
        accepted_assignments=accepted,
    )


def test_explicit_assignment_grounds_the_op():
    op = _Op("Department: Logistics", "Department: Engineering",
             origin="user_supplied")
    r = _run([op], "Update J. Okafor's department to Engineering.",
             accepted={"assignments": [
                 {"target": "department", "value": "Engineering"}]})
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.USER
               for p in r.get("provenance") or [])


def test_source_reference_echo_is_refused_even_tagged_user_supplied():
    """The corrected rule: an op tagged user_supplied whose value is a
    request echo (grounded nowhere) is refused — request-wide substring
    presence does not bless it."""
    op = _Op("Department: Logistics", "Department: Engineering",
             origin="user_supplied")
    # The request does NOT contain the value "Engineering" — the echo
    # phrase "the department from our records" is the model's
    # invention; the accepted table has no assignment for it.
    r = _run([op], "Update J. Okafor's department to the department "
             "from our records.",
             accepted={"assignments": []})
    assert r["grounded"] is False
    assert _unsupported(r)


def _unsupported(r):
    return [x for x in r.get("refusals") or []
            if x.get("reason") == Refusal.UNSUPPORTED]
