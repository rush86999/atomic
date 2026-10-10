"""Completion-authority cases for the served-decline no-op path
(owner work order 2026-10-10: prove whether the S3 no-op certification
is valid BEFORE changing confirmation wording).

Six cases driven through the PRODUCTION decline path — the canvas lane
itself (``_try_canvas_edit``) with a stubbed planner, the same harness
as the round-62 no-op pin. The completion receipt is NEVER seeded:
``shared_tool_state["objective_evidence"]`` carries the authorized
EVIDENCE CONTRACT (input — the same object production feeds drafting);
the receipt (``canvas_edit_decline_noop`` /
``canvas_decline_requirement_check``) must be produced — or refused —
by the production branch.

The fixture: the Brennan S3 draft (5 requested machines + 3 protected
alternatives; the canvas's own prose declares the split) and an
authorized contract whose source-side evidence (workbook rows + the
owner's manual-quote decision) carries the approved values.
"""
import asyncio
import json

import pytest

from core.chat_canvas_editor import (
    artifact_observations,
    requirement_check,
)
from core.workbook_read_artifact import build_source_comparison
from integrations import chat_orchestrator as co
import core.chat_canvas_editor as cce


def _brennan_canvas(row3_price="$1,609.00", row4_price="$2,421.00",
                    row3_deliv="3–4 weeks", row4_deliv="In Stock",
                    row5_deliv="11–12 weeks"):
    rows = [
        ("1", "Roper Whitney 36&quot; Roll Bender", "$2,902.00",
         "10–11 weeks"),
        ("2", "Linmac Bead Roller 22 Gauge", "$1,777.00", "In Stock"),
        ("3", "Manual Flanger", row3_price, row3_deliv),
        ("4", "Roper Whitney No. 622 Rotary", row4_price, row4_deliv),
        ("5", "Tennsmith Slitter SLE24-16", "$8,984.00", row5_deliv),
        ("6", "TK 1624 Slitter", "$8,040.00", "4–6 weeks"),
        ("7", "Tin Knocker Gang Slitter", "$12,838.00", "In Stock"),
        ("8", "Tennsmith GSL48 Slitter", "$14,166.00", "6–8 weeks"),
    ]
    trs = "".join(
        f"<tr><td>{n}</td><td>{d}</td><td>{p}</td><td>{dl}</td></tr>"
        for n, d, p, dl in rows)
    body = (
        "Hi Steve,<br><br>Rows 1–5 are the requested machines; rows 6–8 "
        "are alternative slitters."
        "<table><tr><th>#</th><th>Description</th><th>Unit Price</th>"
        f"<th>Delivery</th></tr>{trs}</table>"
        "<p>Payment Terms: CAD / FOB / TBD</p>")
    return {"canvas_id": "cv-s3-auth", "canvas_type": "email",
            "content": {"body": body}}


_ENTITIES = ["Roper Whitney 36", "Linmac", "Manual Flanger",
             "No. 622", "SLE24-16"]

_APPROVED = {
    # entity: (price, delivery) — the authorized values
    "Roper Whitney 36": ("$2,902.00", "10–11 weeks"),
    "Linmac": ("$1,777.00", "In Stock"),
    "Manual Flanger": ("$1,609.00", "3–4 weeks"),
    "No. 622": ("$2,421.00", "In Stock"),
    "SLE24-16": ("$8,984.00", "11–12 weeks"),
}


def _obs(entity, field, raw, source_id, source_type, **extra):
    return {
        "entity_id": entity, "field": field, "raw_value": raw,
        "source": {"source_id": source_id, "source_type": source_type},
        "verification": "verified",
        "column": "Unit Price" if field == "price" else "Delivery",
        **extra,
    }


def _authorized_contract():
    """The approved-value evidence, production-shaped
    (build_source_comparison's return): workbook rows carry price and
    delivery; the owner's manual-quote decision carries row 1's price.
    authorized_actions=["edit_artifact"] mirrors the drafting call."""
    observations = []
    for entity, (price, deliv) in _APPROVED.items():
        source = ("owner-manual-quote" if entity == "Roper Whitney 36"
                  else "tennsmith-quote-sheet")
        observations.append(
            _obs(entity, "price", price, source,
                 "supplier_quote" if source.startswith("owner")
                 else "workbook"))
        observations.append(
            _obs(entity, "delivery", deliv, "tennsmith-quote-sheet",
                 "workbook"))
    canvas = _brennan_canvas()
    for entity, (price, deliv) in _APPROVED.items():
        observations.append(
            _obs(entity, "price", price, "cv-s3-auth", "artifact"))
        observations.append(
            _obs(entity, "delivery", deliv, "cv-s3-auth", "artifact"))
    return build_source_comparison(
        observations,
        requested_entities=_ENTITIES,
        requested_fields=["Unit Price", "Delivery"],
        artifact_source_ids=["cv-s3-auth"],
        decision_source_ids=["owner-manual-quote"],
        authorized_actions=["edit_artifact"],
    )


class _DeclinedPlan:
    wants_edit = False
    reply = "The draft already reflects the approved values."


def _run_lane(canvas, contract, expected_prior=None):
    """Drive the production decline path. Returns the shared blackboard
    the lane wrote (the receipt must be produced — or refused — there)."""
    async def _plan_ok(*a, **k):
        return _DeclinedPlan()

    import integrations.chat_orchestrator as co_mod
    original = cce.plan_canvas_edit
    cce.plan_canvas_edit = _plan_ok
    shared = {}
    if contract is not None:
        shared["objective_evidence"] = contract
    try:
        asyncio.run(co_mod.chat_orchestrator._try_canvas_edit(
            "Update the draft for rows 1-5 with the approved prices and "
            "delivery times. Don't send.",
            [], canvas, "user_1", "sess-auth", "exec-auth", None,
            shared_tool_state=shared,
            expected_prior_audit_id=expected_prior))
    finally:
        cce.plan_canvas_edit = original
    return shared


def _check(shared):
    return shared.get("canvas_decline_requirement_check")


class TestCompletionAuthority:
    """Case table from the owner work order. 'Completed no-op' at the
    lane = the receipt flags exist; anything else = not completed."""

    def test_1_all_values_match_authorized_contract_completes(self):
        shared = _run_lane(_brennan_canvas(), _authorized_contract())
        check = _check(shared)
        assert shared.get("canvas_edit_decline_noop") is True, (
            f"authorized values all present must complete; check={check}")
        assert check and check.get("satisfied") is True
        value_dispositions = [
            o for o in (check.get("obligations") or [])
            if o.get("kind") == "value_obligations"]
        assert value_dispositions, "the receipt records value obligations"
        assert all(
            o.get("disposition") == "satisfied"
            for o in value_dispositions)

    def test_2_one_price_differs_is_not_completed(self):
        shared = _run_lane(_brennan_canvas(row3_price="$1,999.00"),
                           _authorized_contract())
        assert not shared.get("canvas_edit_decline_noop"), (
            "a changed price must not certify the no-op")
        check = _check(shared)
        assert not (check or {}).get("satisfied")

    def test_3_swapped_prices_not_completed(self):
        shared = _run_lane(
            _brennan_canvas(row3_price="$2,421.00",
                            row4_price="$1,609.00"),
            _authorized_contract())
        assert not shared.get("canvas_edit_decline_noop"), (
            "the same numbers, swapped between rows, are not the "
            "authorized values")
        check = _check(shared)
        assert not (check or {}).get("satisfied")

    def test_4_price_matches_delivery_differs_not_completed(self):
        shared = _run_lane(_brennan_canvas(row5_deliv="3–4 weeks"),
                           _authorized_contract())
        assert not shared.get("canvas_edit_decline_noop"), (
            "a changed delivery time must not certify the no-op")
        check = _check(shared)
        assert not (check or {}).get("satisfied")

    def test_5_missing_evidence_stays_unconfirmed(self):
        shared = _run_lane(_brennan_canvas(), None)
        assert not shared.get("canvas_edit_decline_noop"), (
            "without authorized evidence the decline stays unconfirmed — "
            "table preservation is not satisfaction")
        check = _check(shared)
        assert not (check or {}).get("satisfied"), (
            "a value-shaped request without evidence is never satisfied")

    def test_5b_findings_certify_satisfaction_without_change_actions(self):
        """Findings separate from authorization: the expected values'
        authority lives in the evidence's own sources, not in
        ``actions`` (which authorize CHANGES). A read receipt with
        ``actions: []`` authorizes no change — and needs none to
        certify that the draft already holds the approved values."""
        contract = _authorized_contract()
        contract["actions"] = []
        shared = _run_lane(_brennan_canvas(), contract)
        assert shared.get("canvas_edit_decline_noop") is True, (
            "authorized findings certify the satisfaction claim "
            "without change actions")
        assert "Verified on the current draft" in (
            shared.get("canvas_edit_decline_reply") or "")

    def test_6_canvas_revision_mismatch_stays_unconfirmed(self):
        shared = _run_lane(_brennan_canvas(), _authorized_contract(),
                           expected_prior="audit-A1")
        assert not shared.get("canvas_edit_decline_noop"), (
            "a revision the caller did not expect cannot certify "
            "'already done'")
        assert _check(shared) is None or not (
            _check(shared) or {}).get("satisfied")
