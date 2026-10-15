# -*- coding: utf-8 -*-
"""Cross-domain generality (verifier work order): the SAME validator and
contract, varying ONLY test data — sales, HR, operations, project work.

The validator is core/factual_change_validation.py (the implementation
owner's module, driven through its public validate_factual_changes).

Across every fixture:
  unrelated-value reuse .......... REFUSED (an observation bound to a
                                   different subject/field is not support)
  subject swap ................... REFUSED (the observation's subject
                                   must match the requested one)
  missing evidence ............... REFUSED as unsupported/unresolved (the
                                   value is grounded nowhere)
  stale revision ................. REFUSED with the record's named gap
  explicit instruction ........... GROUNDED as user_supplied (authorized;
                                   NOT independently verified — the
                                   provenance class reports it)
  valid calculation .............. GROUNDED as calculation
  ordinary rewording ............. no factual change — passes
"""
import os
os.environ.setdefault("TESTING", "1")

import json
import pytest

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


def _run(ops, current, message, contract=None, calcs=None):
    return validate_factual_changes(
        ops=ops,
        current_text=current,
        request_message=message,
        evidence_contract=contract,
        calculations=calcs or [],
    )


def _contract(observations, gaps=None):
    return {"evidence": observations, "gaps": gaps or []}


# ---------------------------------------------------------------- sales
SALES_CURRENT = ("# Quotation Q-114\n\n"
                 "Line item: CNC press brake\n"
                 "Unit price: 48,000.00 EUR\n"
                 "Line item: Bead roller\n"
                 "Unit price: 2,900.00 EUR\n")

SALES_OBS_PRICE = [{
    "field_selection": "Unit price",
    "source": {"source_id": "price-list-2019", "content_hash": "h1",
               "revision": "rev-2019-11"},
    "value": "45,000.00 EUR",
    "subject": "CNC press brake",
    "verification": "verified",
}]

SALES_MSG_EXPLICIT = "Set the CNC press brake unit price to 45,000.00 EUR."


def _unsupported(r):
    return [x for x in r.get("refusals") or []
            if x.get("reason") == Refusal.UNSUPPORTED]


def test_sales_explicit_user_value_is_allowed_and_classified():
    op = _Op("Unit price: 48,000.00 EUR", "Unit price: 45,000.00 EUR",
        origin="user_supplied")
    r = _run([op], SALES_CURRENT, SALES_MSG_EXPLICIT,
             _contract(SALES_OBS_PRICE))
    assert r["grounded"] is True
    cls = [p.get("class") for p in r.get("provenance") or []
           if "45,000.00" in str(p.get("value"))]
    assert cls and cls[0] == Provenance.USER, (
        "user-supplied is reported as user_supplied — not independently "
        f"verified; provenance={r.get('provenance')}")


def test_sales_evidence_backed_value_is_allowed_as_evidence():
    msg = "Set the CNC press brake unit price from the price list."
    op = _Op("Unit price: 48,000.00 EUR", "Unit price: 45,000.00 EUR",
        origin="source_reference")
    r = _run([op], SALES_CURRENT, msg, _contract(SALES_OBS_PRICE))
    cls = [p.get("class") for p in r.get("provenance") or []
           if "45,000.00" in str(p.get("value"))]
    assert cls and cls[0] == Provenance.EVIDENCE


def test_sales_unrelated_value_reuse_is_rejected():
    # The bead roller's 2,900.00 belongs to a different line item —
    # assigning it to the CNC press brake is a subject/field mismatch.
    op = _Op("Unit price: 48,000.00 EUR", "Unit price: 2,900.00 EUR",
        origin="user_supplied")
    r = _run([op], SALES_CURRENT, "update the press brake price",
             _contract(SALES_OBS_PRICE))
    assert r["grounded"] is False
    assert any("2,900.00" in str(x.get("value"))
               for x in r.get("refusals") or [])


# ------------------------------------------------------------------- hr
HR_CURRENT = ("Employee: J. Okafor\nDepartment: Logistics\n"
              "Start date: 2024-03-01\n")

HR_OBS_DEPT = [{
    "field_selection": "Department",
    "source": {"source_id": "hr-system", "content_hash": "h2"},
    "value": "Engineering",
    "subject": "J. Okafor",
}]

HR_MSG_EXPLICIT = "Update J. Okafor's department to Engineering."


def test_hr_explicit_department_update_is_allowed():
    op = _Op("Department: Logistics", "Department: Engineering",
        origin="user_supplied")
    r = _run([op], HR_CURRENT, HR_MSG_EXPLICIT, _contract(HR_OBS_DEPT))
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.USER
               for p in r.get("provenance") or [])


def test_hr_subject_swap_is_rejected():
    # The evidence carries a DIFFERENT employee's department; the op
    # targets J. Okafor. The subject binding must refuse the swap.
    other_obs = [{
        "field_selection": "Department",
        "source": {"source_id": "hr-system", "content_hash": "h3"},
        "value": "Engineering",
        "subject": "M. Reyes",
    }]
    op = _Op("Department: Logistics", "Department: Engineering",
        origin="user_supplied")
    r = _run([op], HR_CURRENT, "Update the department",
             _contract(other_obs))
    assert r["grounded"] is False
    assert any(x.get("reason") == Refusal.UNSUPPORTED
               for x in r.get("refusals") or [])


# ------------------------------------------------------------ operations
OPS_CURRENT = ("Asset: Forklift L-7\n"
               "Inspection interval: 6 months\n"
               "Last inspection: 2026-09-15\n")

OPS_MSG_EXPLICIT = "Change the Forklift L-7 inspection interval to 12 months."


def test_operations_explicit_interval_is_allowed():
    op = _Op("Inspection interval: 6 months",
             "Inspection interval: 12 months", origin="user_supplied")
    r = _run([op], OPS_CURRENT, OPS_MSG_EXPLICIT, None)
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.USER
               for p in r.get("provenance") or [])


def test_operations_fabricated_interval_is_rejected():
    # "18 months" appears nowhere; the model invented the interval.
    op = _Op("Inspection interval: 6 months",
             "Inspection interval: 18 months", origin="user_supplied")
    r = _run([op], OPS_CURRENT, "Change the inspection interval.",
             _contract([]))
    assert r["grounded"] is False
    assert any("18" in str(x.get("value"))
               for x in r.get("refusals") or [])


# ---------------------------------------------------------- project work
PROJ_CURRENT = ("Milestone: Foundation pour\nOwner: unassigned\n"
                "Target date: TBD\n")

PROJ_OBS = [{
    "field_selection": "Owner",
    "source": {"source_id": "project-plan", "content_hash": "h4"},
    "value": "D. Whitfield",
    "subject": "Foundation pour",
    "verification": "verified",
}]

PROJ_MSG_ASSIGN = ("Assign D. Whitfield as the owner of the "
                   "foundation pour milestone.")


def test_project_owner_assignment_from_instruction_is_user():
    # The instruction carries the name — user_supplied (authorized, but
    # NOT independently verified; the provenance class reports it).
    op = _Op("Owner: unassigned", "Owner: D. Whitfield",
        origin="user_supplied")
    r = _run([op], PROJ_CURRENT, PROJ_MSG_ASSIGN, _contract(PROJ_OBS))
    assert r["grounded"] is True
    assert any("Whitfield" in str(p.get("value"))
               and p.get("class") == Provenance.USER
               for p in r.get("provenance") or [])


def test_project_owner_from_stale_evidence_is_refused():
    # The name comes from the EVIDENCE (not the instruction), and the
    # contract's own record carries an open stale-revision gap naming
    # the subject — the evidence-grounded assignment is refused with
    # the record's named requirement.
    contract = _contract(PROJ_OBS)
    contract["gaps"] = [{
        "entity_id": "Foundation pour",
        "status": "stale_revision",
        "next_evidence_needed": "current foundation pour owner",
    }]
    op = _Op("Owner: unassigned", "Owner: D. Whitfield",
        origin="user_supplied")
    msg = "Assign the owner shown in the project plan."
    r = _run([op], PROJ_CURRENT, msg, contract)
    assert r["grounded"] is False
    named = [x for x in r.get("refusals") or []
             if Refusal.UNRESOLVED in str(x.get("reason"))
             or "stale" in str(x.get("reason")).lower()]
    assert named, (
        "the stale-revision gap must refuse the evidence-grounded "
        f"assignment; refusals={r.get('refusals')}")


# ------------------------------------------------------------- rewording
def test_ordinary_rewording_passes_without_grounding():
    op = _Op("Hello", "Greetings", origin="user_supplied")
    r = _run([op], "Hello\n", "change the greeting to Greetings", None)
    assert r["grounded"] is True


# --------------------------------------------------------------- calc
def test_valid_calculation_is_allowed_as_calculation():
    op = _Op("Subtotal: 0.00", "Subtotal: 300.00", origin="calculation")
    calcs = [{"value": "300.00",
              "policy_id": "QTY*PRICE",
              "inputs": {"QTY": 3, "PRICE": 100}}]
    r = _run([op], "QTY: 3\nPrice: 100.00\nSubtotal: 0.00\n",
             "calculate the subtotal", None, calcs=calcs)
    assert r["grounded"] is True
    assert any(p.get("class") == Provenance.CALC
               for p in r.get("provenance") or [])
