# -*- coding: utf-8 -*-
"""The no-invention fence's obligation-level grounding (verifier probes,
round 19 correction): the fence must reject unsupported factual
insertions while keeping ordinary wording changes possible.

Probes (each reproduces a weakness of the retired token-presence fence):
  rephrase       "Hello" → "Greetings" ............ ALLOWED (wording)
  digit-change   "12345" → "12346" ................ REJECTED (the new
                  value is grounded nowhere; the old common-affix trim
                  left only the last digit and the 4-char minimum
                  skipped it)
  short value    insert "12" ....................... REJECTED (the
                  old regex required four characters)
  cross-copy     an order number from elsewhere in the canvas written
                  into a client tax-ID field ............ REJECTED
                  (canvas presence is not support — substring matching
                  cannot establish the fact belongs to the requested
                  subject and field)
  grounded       the replacement value IS in the user's instruction ... ALLOWED
"""
import os
os.environ.setdefault("TESTING", "1")

import core.chat_canvas_editor as cce


def _probe(inserted, message, evidence=""):
    return cce._invented_insertion(inserted, message, evidence)


def test_probe_rephrase_wording_is_allowed():
    assert _probe("Greetings", "change the greeting to Greetings") is None


def test_probe_digit_change_grounded_nowhere_is_rejected():
    # The inserted residue after common-affix trim is "6" — one digit.
    # The fence grounds value runs of any length; "12346" appears
    # nowhere in the instruction or evidence.
    run = _probe("12346", "fix the identifier")
    assert run is not None and "12346" in run


def test_probe_digit_change_grounded_in_request_is_allowed():
    assert _probe("12346", "change the identifier to 12346") is None


def test_probe_short_value_is_rejected():
    run = _probe("12", "update the count")
    assert run is not None and "12" in run


def test_probe_cross_copy_from_canvas_is_rejected():
    # The order number exists in the CANVAS — but canvas presence is not
    # support: the fence grounds against the REQUEST and the accepted
    # evidence only.
    run = _probe("order 88112 confirmation", "add the confirmation line")
    assert run is not None and "88112" in run


def test_probe_grounded_evidence_value_is_allowed():
    assert _probe(
        "tax id 88112", "add the tax id",
        evidence="the client's tax id is 88112 per the contract") is None
