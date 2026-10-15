# -*- coding: utf-8 -*-
"""The no-invention fence's probe matrix (verifier round 19), driven
through the owner's obligation-level module
(core/factual_change_validation.py, validate_factual_changes).

The retired token-presence helper was probed around on all four axes;
these pins hold the SAME probe matrix against the obligation-level
validator:

  ordinary wording ........ no new facts — passes
  unsupported digit run ... REFUSED (grounded nowhere)
  grounded digit run ...... passes (user instruction carries it)
  evidence-backed value ... passes (evidence class)
"""
import os
os.environ.setdefault("TESTING", "1")

from core.factual_change_validation import validate_factual_changes


def _probe(inserted: str, message: str, evidence: str = ""):
    op = type("O", (), {"find": "Unit price: 48,000.00 EUR",
                        "replace": "Unit price: 48,000.00 EUR " + inserted,
                        "field": None})()
    return validate_factual_changes(
        ops=[op],
        current_text="Unit price: 48,000.00 EUR\n",
        request_message=message,
        evidence_contract=(
            {"evidence": [{"field_selection": "Unit price",
                           "source": {"source_id": "s1"},
                           "value": evidence,
                           "verification": "verified"}]}
            if evidence else None),
        calculations=[])


def test_probe_ordinary_wording_passes():
    r = _probe("please note", "update the price and please note the change")
    assert r["grounded"] is True


def test_probe_unsupported_digit_run_is_refused():
    r = _probe("confirm 12346", "update the price")
    assert r["grounded"] is False
    assert any("12346" in str(x.get("value"))
               for x in r.get("refusals") or []), (
        f"the unsupported run must be refused; {r}")


def test_probe_grounded_digit_run_passes():
    r = _probe("confirm 12346", "the identifier is 12346")
    assert r["grounded"] is True


def test_probe_evidence_backed_value_passes():
    r = _probe("confirm 45,000.00 EUR", "confirm the unit price",
               evidence="45,000.00 EUR")
    assert r["grounded"] is True
