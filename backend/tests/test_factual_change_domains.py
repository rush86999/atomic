# -*- coding: utf-8 -*-
"""Cross-domain generality (verifier work order): the SAME validator and
accepted-assignment contract, varying ONLY test data — sales, HR,
operations, project work.

Each domain pairs:
  - a genuine supplied value (an accepted assignment; the op matches it)
    ................................................ GROUNDED user_supplied
  - an unresolved source reference ("the department in the personnel
    record"; "the exact number from our records") .. REFUSED unresolved
  - an unrelated value elsewhere ................... REFUSED
  - applicable evidence for the correct subject/field GROUNDED evidence
  - ordinary rewording ............................. no factual change
"""
import os
os.environ.setdefault("TESTING", "1")

from core.factual_change_validation import (
    Provenance,
    Refusal,
    validate_factual_changes,
)


class _Op:
    def __init__(self, find, replace, field=None, origin=None):
        self.find = find
        self.replace = replace
        self.field = field
        self.origin = origin


def _run(ops, current, message, accepted, contract=None):
    return validate_factual_changes(
        ops=ops,
        current_text=current,
        request_message=message,
        evidence_contract=contract,
        accepted_assignments=accepted,
    )


def _unsupported(r):
    return [x for x in r.get("refusals") or []
            if x.get("reason") == Refusal.UNSUPPORTED]


# ---------------------------------------------------------------- sales
SALES_CURRENT = ("# Quotation Q-114\n\n"
                 "Line item: CNC press brake\n"
                 "Unit price: 48,000.00 EUR\n"
                 "Line item: Bead roller\n"
                 "Unit price: 2,900.00 EUR\n")

SALES_ACCEPTED = {"assignments": [
    {"target": "cnc press brake unit price", "value": "45,000.00 EUR"},
]}


def test_sales_supplied_value_grounds():
    op = _Op("Unit price: 48,000.00 EUR", "Unit price: 45,000.00 EUR",
             origin="user_supplied")
    r = _run([op], SALES_CURRENT,
             "Set the CNC press brake unit price to 45,000.00 EUR.",
             SALES_ACCEPTED)
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.USER
               for p in r.get("provenance") or [])


def test_sales_unrelated_value_refused():
    # The bead roller's price assigned to the press brake: the accepted
    # assignment for the press brake carries 45,000.00 — the op's value
    # does not match it.
    op = _Op("Unit price: 48,000.00 EUR", "Unit price: 2,900.00 EUR",
             origin="user_supplied")
    r = _run([op], SALES_CURRENT, "Set the CNC press brake unit price.",
             SALES_ACCEPTED)
    assert r["grounded"] is False
    assert _unsupported(r), "the mismatched value must be refused"


# ------------------------------------------------------------------- hr
HR_CURRENT = "Employee: J. Okafor\nDepartment: Logistics\n"

HR_ACCEPTED = {"assignments": [
    {"target": "j. okafor department", "value": "Engineering"},
]}

HR_MSG_SUPPLIED = "Update J. Okafor's department to Engineering."
HR_MSG_REFERENCE = "Update the department in the personnel record."


def test_hr_supplied_value_grounds():
    op = _Op("Department: Logistics", "Department: Engineering",
             origin="user_supplied")
    r = _run([op], HR_CURRENT, HR_MSG_SUPPLIED, HR_ACCEPTED)
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.USER
               for p in r.get("provenance") or [])


def test_hr_source_reference_is_refused():
    # "the department in the personnel record" — a reference requiring
    # resolution, not a supplied value. The planner tagged it
    # user_supplied; the span check alone must not bless it: no accepted
    # assignment matches, and the value is not in the instruction.
    op = _Op("Department: Logistics", "Department: the department in the "
             "personnel record", origin="source_reference")
    r = _run([op], HR_CURRENT, HR_MSG_REFERENCE, HR_ACCEPTED)
    # The proposed "value" is a reference to where a value lives, and it
    # contradicts the accepted record's own assignment for the target —
    # refused, never certified.
    assert r["grounded"] is False
    assert any(x.get("reason") == Refusal.UNSUPPORTED
               for x in r.get("refusals") or []), (
        "the source reference must refuse as unsupported (grounded "
        f"nowhere); refusals={r.get('refusals')}")


HR_MSG_REFERENCE_VALUE = (
    "Set the department to the department from our records.")


def test_hr_reference_valued_assignment_never_enters_the_contract():
    """Owner reproduction (2026-10-15): the extractor recorded BOTH an
    assignment to the reference's own words AND a source reference — the
    contradiction certified the lookup phrase as user-supplied. The
    contract now carries the distinction; the change refuses, named."""
    from core.turn_decision import extract_request_assignments

    accepted = extract_request_assignments(HR_MSG_REFERENCE_VALUE)
    assert accepted["source_references"], (
        "the request names a source and the obligation must stand")
    assert not any(
        "department" in str(e.get("target") or "")
        for e in accepted["assignments"]), (
        "a reference-bearing value is never a supplied assignment; "
        f"got {accepted['assignments']!r}")
    assert any(
        "department" in str(e.get("target") or "")
        for e in accepted["unresolved_additions"]), (
        "the target stays named as an unresolved obligation; "
        f"got {accepted['unresolved_additions']!r}")

    op = _Op("Department: Logistics",
             "Department: the department from our records",
             origin="user_supplied")
    r = _run([op], HR_CURRENT, HR_MSG_REFERENCE_VALUE, accepted)
    assert r["grounded"] is False
    assert any(x.get("reason") == Refusal.UNRESOLVED
               for x in r.get("refusals") or []), (
        f"the lookup phrase must not certify; refusals={r.get('refusals')}")


def test_hr_reference_valued_contract_entry_never_certifies():
    """Defense through the contract: a hand-built accepted entry whose
    own value is a reference cannot certify the change either — no
    producer's table may bless the reference's words."""
    accepted = {"assignments": [
        {"target": "department",
         "value": "the department from our records"},
    ]}
    op = _Op("Department: Logistics",
             "Department: the department from our records",
             origin="user_supplied")
    r = _run([op], HR_CURRENT, HR_MSG_REFERENCE_VALUE, accepted)
    assert r["grounded"] is False


def test_hr_explicit_department_assignment_grounds_from_the_extractor():
    """The genuine explicit assignment, committed alongside the bypass:
    the real extractor's table grounds the change as user_supplied."""
    from core.turn_decision import extract_request_assignments

    msg = "Set the department to Operations."
    accepted = extract_request_assignments(msg)
    assert accepted["assignments"], "the explicit assignment must bind"
    op = _Op("Department: Logistics", "Department: Operations",
             origin="user_supplied")
    r = _run([op], HR_CURRENT, msg, accepted)
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.USER
               for p in r.get("provenance") or [])


# ------------------------------------------------------------ operations
OPS_CURRENT = "Asset: Forklift L-7\nInspection interval: 6 months\n"

OPS_ACCEPTED = {"assignments": [
    {"target": "forklift l-7 inspection interval", "value": "12 months"},
]}


def test_operations_supplied_interval_grounds():
    op = _Op("Inspection interval: 6 months",
             "Inspection interval: 12 months", origin="user_supplied")
    r = _run([op], OPS_CURRENT,
             "Change the Forklift L-7 inspection interval to 12 months.",
             OPS_ACCEPTED)
    assert r["grounded"] is True


def test_operations_fabricated_interval_refused():
    op = _Op("Inspection interval: 6 months",
             "Inspection interval: 18 months", origin="user_supplied")
    r = _run([op], OPS_CURRENT, "Change the inspection interval.",
             OPS_ACCEPTED)
    assert r["grounded"] is False
    assert _unsupported(r)


# ---------------------------------------------------------- project work
PROJ_CURRENT = "Milestone: Foundation pour\nOwner: unassigned\n"

PROJ_ACCEPTED = {"assignments": [
    {"target": "foundation pour owner", "value": "D. Whitfield"},
]}


def test_project_supplied_owner_grounds():
    op = _Op("Owner: unassigned", "Owner: D. Whitfield", origin="user_supplied")
    r = _run([op], PROJ_CURRENT, PROJ_MSG := (
        "Assign D. Whitfield as the owner of the foundation pour "
        "milestone."), PROJ_ACCEPTED)
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.USER
               for p in r.get("provenance") or [])


def test_project_evidence_backed_owner_grounds():
    contract = {"evidence": [{
        "field_selection": "Owner",
        "source": {"source_id": "project-plan", "content_hash": "h4"},
        "value": "D. Whitfield",
        "subject": "Foundation pour",
        "verification": "verified",
    }], "gaps": []}
    op = _Op("Owner: unassigned", "Owner: D. Whitfield", origin=None)
    # No accepted assignment; the CONTRACT binds the owner to the
    # milestone — the evidence grounds it.
    r = _run([op], PROJ_CURRENT, "Assign the owner from the project plan.",
             None, contract)
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.EVIDENCE
               for p in r.get("provenance") or [])


def test_project_unrelated_owner_refused():
    contract = {"evidence": [{
        "field_selection": "Owner",
        "source": {"source_id": "project-plan", "content_hash": "h4"},
        "value": "D. Whitfield",
        "subject": "Foundation pour",
        "verification": "verified",
    }], "gaps": []}
    op = _Op("Owner: unassigned", "Owner: Someone Else",
             origin="user_supplied")
    r = _run([op], PROJ_CURRENT, "Assign the owner from the project plan.",
             None, contract)
    assert r["grounded"] is False
    assert _unsupported(r)


# --------------------------- reference phrasings (review of 5abf89c0e)
# Independent review (2026-10-15) counterexamples: natural verb-headed
# and possessive source references were certified as supplied values.
# A reference phrased as "see the attached schedule" / "refer to the
# schedule" / "the supplier's quoted date" must be an UNRESOLVED
# obligation in BOTH detectors (extractor AND validator), the same as
# the "from our records" family. Keep in sync with
# factual_change_validation._REFERENCE_PHRASE and
# turn_decision._SOURCE_REF_PHRASE.

REF_CURRENT = "Valid until: 2026-11-30\n"
REF_MSG = "Update the valid until date to {value}."
REFERENCE_PHRASINGS = [
    "see the attached schedule",
    "see attached schedule",
    "refer to the schedule",
    "the supplier's quoted date",
    "the value shown in the table",
    "the exact date from our records",
]


def test_verb_headed_and_possessive_references_are_unresolved():
    from core.turn_decision import extract_request_assignments

    for phrasing in REFERENCE_PHRASINGS:
        msg = REF_MSG.format(value=phrasing)
        accepted = extract_request_assignments(msg)
        assert not any(
            str(a.get("value") or "") == phrasing
            for a in accepted["assignments"]), (
            f"reference {phrasing!r} must not become a supplied value; "
            f"assignments={accepted['assignments']!r}")
        assert any(
            "valid until" in str(u.get("target") or "")
            for u in accepted["unresolved_additions"]), (
            f"the target must stay an unresolved obligation for "
            f"{phrasing!r}; got {accepted['unresolved_additions']!r}")


def test_reference_phrasings_never_certify_a_matching_op():
    from core.turn_decision import extract_request_assignments

    for phrasing in REFERENCE_PHRASINGS:
        msg = REF_MSG.format(value=phrasing)
        accepted = extract_request_assignments(msg)
        op = _Op("Valid until: 2026-11-30",
                 f"Valid until: {phrasing}", origin="user_supplied")
        r = _run([op], REF_CURRENT, msg, accepted)
        assert r["grounded"] is False, (
            f"the reference's own words must not certify for {phrasing!r}")


def test_explicit_value_with_a_source_citation_is_an_obligation():
    """Policy pin (review of 5abf89c0e): "2026-12-31 per the quote"
    cites a source for the value — the obligation to resolve/verify
    stands and the literal is never blindly certified. The prior split
    (extractor accepted it, validator refused it) is closed in the safe
    direction: both detectors agree."""
    from core.turn_decision import extract_request_assignments

    msg = "Update the valid until date to 2026-12-31 per the quote."
    accepted = extract_request_assignments(msg)
    assert not any("2026-12-31" in str(a.get("value") or "")
                   for a in accepted["assignments"]), (
        f"citation-bearing values are obligations; got "
        f"{accepted['assignments']!r}")
    assert any("valid until" in str(u.get("target") or "")
               for u in accepted["unresolved_additions"])
    op = _Op("Valid until: 2026-11-30", "Valid until: 2026-12-31",
             origin="user_supplied")
    r = _run([op], REF_CURRENT, msg, accepted)
    assert r["grounded"] is False, "the cited literal must not certify"
