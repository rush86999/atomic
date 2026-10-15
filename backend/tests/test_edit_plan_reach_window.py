# -*- coding: utf-8 -*-
"""Controlled regression (verifier round 19, W-step 3; strengthened per
the owner's bounded work order, 2026-10-14): the REAL `_try_canvas_edit`
lane with a SLOW fresh-data planner and a FAST valid edit planner,
driven inside an OUTER BOUND that stands in for the lane's leg budget.

Establishes — repeatably, with no model and no network — WHICH
prerequisite prevents the edit planner from being reached:

  RED   a literal edit whose accepted request records NO evidence
        requirement, with a slow fresh-data planner and NO decision
        carrier: the lane awaits the slow lookup, the outer bound
        cancels the lane, the edit planner is NEVER reached.
  GREEN the same literal edit carrying the accepted request's
        `evidence_required=False`: the lookup is not awaited, the edit
        planner runs immediately and the edit applies once.
  PIN   a request with `evidence_required=True` keeps the lookup: with
        a slow lookup the outer bound still cancels (required evidence
        is NOT skipped); with a fast lookup the planner is reached
        after it.
  PIN   optional enrichment (cross-canvas learning) cannot starve
        execution: a hung optional stage is bounded and the planner is
        still reached within the lane budget.
"""
import os
os.environ.setdefault("TESTING", "1")

import asyncio
import logging
import time
from unittest.mock import AsyncMock, MagicMock, patch

import core.chat_canvas_editor as cce
import integrations.chat_orchestrator as co
from tests.test_canvas_edit_stage_regression import (
    _DurableStore,
    _orch,
    _valid_plan,
)

MESSAGE = ("On this quotation, update the Valid Until date to "
           "2026-12-31. Change nothing else.")
QUOTE = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")
EXPECTED = QUOTE.replace("Valid until: 2026-11-30",
                         "Valid until: 2026-12-31")
LANE_BOUND_S = 1.0


def _canvas():
    return {"canvas_id": "cv-reach", "canvas_type": "document",
            "title": "Quotation Q-2026-114", "content": QUOTE}


def _drive_lane(*, shared, fresh_side_effect, bound_s=LANE_BOUND_S,
                lane_budget_s=74.0, orch=None):
    """The REAL lane inside the outer leg bound; returns (out, store,
    reached) where ``reached`` records the edit planner's entry."""
    store = _DurableStore(QUOTE)
    upd_patch, read_patch = store.patches()
    reached = {"plan_called": False}

    async def _fast_plan(*args, **kwargs):
        reached["plan_called"] = True
        return _valid_plan()

    async def _run():
        try:
            return await asyncio.wait_for(
                co.ChatOrchestrator._try_canvas_edit(
                    orch or _orch(), MESSAGE, [], _canvas(), "user-1",
                    "sess-reach", "exec-reach", None,
                    shared_tool_state=shared,
                    lane_budget_s=lane_budget_s),
                timeout=bound_s)
        except asyncio.TimeoutError:
            return None

    with patch.object(cce, "plan_canvas_edit",
                      new=AsyncMock(side_effect=_fast_plan)), \
         patch.object(cce, "fetch_fresh_data_section",
                      new=AsyncMock(side_effect=fresh_side_effect)), \
         upd_patch, read_patch:
        out = asyncio.run(_run())
    return out, store, reached


def _slow_fresh(seconds=10.0):
    async def _fresh(*args, **kwargs):
        await asyncio.sleep(seconds)
        return cce.FreshDataResult("", False, True)
    return _fresh


def _fast_fresh():
    async def _fresh(*args, **kwargs):
        await asyncio.sleep(0.05)
        return cce.FreshDataResult("", False, True)
    return _fresh


def test_red_slow_lookup_without_the_carrier_never_reaches_the_planner():
    """RED: the exact live failure, repeatable. With the decision carrier
    ABSENT (None — the pre-fix live shape is a slow lookup and no
    evidence-requirement consumption), the slow fresh-data lookup holds
    the lane until the outer bound cancels it: zero planner entries,
    zero writes."""
    out, store, reached = _drive_lane(
        shared={}, fresh_side_effect=_slow_fresh())
    assert out is None, "the outer bound must cancel the lane"
    assert reached["plan_called"] is False, (
        "RED control: without the evidence carrier the slow lookup "
        "prevents the edit planner from being reached")
    assert store.writes == 0


def test_green_literal_edit_skips_the_slow_lookup_and_applies():
    """GREEN: the accepted request records no evidence requirement
    (`evidence_required=False` — a directly supplied replacement value):
    the slow lookup is not awaited, the fast edit planner is reached
    inside the same outer bound, and the edit applies exactly once."""
    out, store, reached = _drive_lane(
        shared={"evidence_required": False},
        fresh_side_effect=_slow_fresh())
    assert reached["plan_called"] is True, (
        "the literal edit must reach the edit planner without awaiting "
        "the slow research lookup")
    assert store.writes == 1
    assert store.content == EXPECTED
    edit = ((out or {}).get("data") or {}).get("canvas_edit") or {}
    assert edit.get("updated") is True
    assert edit.get("postcondition_verified") is True


def test_required_evidence_is_never_skipped():
    """PIN: `evidence_required=True` (named sources / research action)
    keeps the lookup. A slow lookup still holds the lane (the planner is
    NOT reached inside the bound); a fast lookup lets the planner run
    AFTER it — required evidence is not skipped generally."""
    _out, _store, reached = _drive_lane(
        shared={"evidence_required": True},
        fresh_side_effect=_slow_fresh())
    assert reached["plan_called"] is False, (
        "a required-evidence request must await its lookup")

    out, store, reached = _drive_lane(
        shared={"evidence_required": True},
        fresh_side_effect=_fast_fresh())
    assert reached["plan_called"] is True
    assert store.writes == 1
    assert ((out or {}).get("data") or {}).get("canvas_edit", {}) \
        .get("updated") is True


def test_optional_enrichment_is_bounded_and_execution_is_reached():
    """PIN: a hung optional enrichment stage (cross-canvas learning) is
    bounded within the lane budget; the edit planner is still reached
    and the edit applies. No fresh budget is granted afterwards."""
    orch = _orch()

    async def _hung_cross(*args, **kwargs):
        await asyncio.sleep(60.0)
        return ([], [])

    orch._cross_canvas_learnings = _hung_cross
    out, store, reached = _drive_lane(
        shared={"evidence_required": False},
        fresh_side_effect=_slow_fresh(),
        bound_s=8.0,
        lane_budget_s=6.0,  # optional cap = max(4, 6*0.15) = 4s
        orch=orch)
    assert reached["plan_called"] is True, (
        "the bounded optional stage must not starve the edit planner")
    assert store.writes == 1
    assert ((out or {}).get("data") or {}).get("canvas_edit", {}) \
        .get("updated") is True


def test_pre_start_gate_uses_the_accepted_decision_not_wording():
    """The pre-start skip consumes the ACCEPTED decision's evidence
    requirement (turn_evidence_required), never a new wording regex:
    a literal edit is self-contained; a workbook/email reference keeps
    its lookup; an absent decision or a non-edit message keeps today's
    behavior."""
    from core.turn_decision import build_turn_decision

    ctx = {"canvas_id": "cv-reach"}

    def _decision(msg):
        return build_turn_decision(msg, {}, [], ctx)

    # Literal edit: no sources, no research action -> self-contained.
    assert co._self_contained_edit_turn(
        MESSAGE, ctx, _decision(MESSAGE)) is True
    # Workbook reference: the accepted request names a source -> keep it.
    assert co._self_contained_edit_turn(
        "update the price to the current workbook price", ctx,
        _decision("update the price to the current workbook price")) is False
    # Email reference: same.
    assert co._self_contained_edit_turn(
        "update the prices that were found in the email", ctx,
        _decision("update the prices that were found in the email")) is False
    # Absent decision: keep today's behavior.
    assert co._self_contained_edit_turn(MESSAGE, ctx, None) is False
    # Non-edit message: the gate is edit-shaped-only.
    assert co._self_contained_edit_turn(
        "compare the Unit price and the Subtotal. Do NOT change anything.",
        ctx, _decision(
            "compare the Unit price and the Subtotal. Do NOT change anything."
        )) is False


def test_stage_spans_identify_the_active_prerequisite(caplog):
    """The paired markers attribute a bounded leg to its stage: the
    fresh_data_lookup span opens AND closes when the lookup runs, and
    the edit_plan span opens when planning starts."""
    store = _DurableStore(QUOTE)
    upd_patch, read_patch = store.patches()

    with patch.object(cce, "plan_canvas_edit",
                      new=AsyncMock(return_value=_valid_plan())), \
         patch.object(cce, "fetch_fresh_data_section",
                      new=AsyncMock(side_effect=_fast_fresh())), \
         upd_patch, read_patch, \
         caplog.at_level(logging.INFO,
                         logger="integrations.chat_orchestrator"):
        asyncio.run(co.ChatOrchestrator._try_canvas_edit(
            _orch(), MESSAGE, [], _canvas(), "user-1", "sess-span",
            "exec-span", None, shared_tool_state={}))
    records = [r.getMessage() for r in caplog.records]
    begins = [msg.split("stage=")[1].split()[0] for msg in records
              if "[lane-stage-begin]" in msg]
    for stage in ("fresh_data_lookup", "edit_plan"):
        assert stage in begins, (
            f"stage {stage} must open; stages={begins}")
        assert any("[lane-stage-end]" in msg and stage in msg
                   for msg in records), (
            f"stage {stage} must close")
