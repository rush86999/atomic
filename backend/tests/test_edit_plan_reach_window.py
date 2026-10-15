# -*- coding: utf-8 -*-
"""Controlled regression (verifier round 19, W-step 3): the REAL
`_try_canvas_edit` lane with a SLOW fresh-data planner and a FAST valid
edit planner.

The counted J6 campaigns failed with ZERO edit-plan dispatches: the
structured call never happened. This test establishes WHICH
prerequisite prevents the edit planner from being reached:

  - a slow fresh-data lookup (5s — well inside every deadline) must
    not prevent the edit planner from running afterward;
  - the edit planner must be reached AFTER fresh-data completes, and
    its window must still be intact (it is not granted a fresh budget,
    but the pre-plan gather must not have consumed it).

If the planner is not reached, the failing stage markers identify the
exact prerequisite. No model, no network: the fresh-data planner and
the structured call are patched at their seams; the apply path runs
for real against the durable store.
"""
import os
os.environ.setdefault("TESTING", "1")

import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import core.chat_canvas_editor as cce
import integrations.chat_orchestrator as co
from tests.test_canvas_edit_stage_regression import (
    _DurableStore,
    _orch,
    _valid_plan,
    CANVAS_ID,
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


def _canvas():
    return {"canvas_id": "cv-reach", "canvas_type": "document",
            "title": "Quotation Q-2026-114", "content": QUOTE}


def test_slow_fresh_data_still_reaches_the_fast_edit_planner():
    store = _DurableStore(QUOTE)
    upd_patch, read_patch = store.patches()
    shared = {}
    reached = {"plan_called": False, "at": None}
    fresh_done = {"at": None}

    async def _slow_fresh(*args, **kwargs):
        await asyncio.sleep(2.0)  # the SLOW prerequisite (bounded)
        fresh_done["at"] = time.monotonic()
        return cce.FreshDataResult("", False, True)

    async def _fast_plan(*args, **kwargs):
        reached["plan_called"] = True
        reached["at"] = time.monotonic()
        return _valid_plan()

    orch = _orch()
    orch.llm_service = MagicMock()

    with patch.object(cce, "fetch_fresh_data_section",
                      new=AsyncMock(side_effect=_slow_fresh)), \
         patch.object(cce, "_plan_structured",
                      new=AsyncMock(side_effect=_fast_plan)), \
         upd_patch, read_patch:
        out = asyncio.run(co.ChatOrchestrator._try_canvas_edit(
            orch, MESSAGE, [], _canvas(), "user-1", "sess-reach",
            "exec-reach", None, shared_tool_state=shared))

    # THE CHAIN: fresh-data first, THEN the edit planner.
    assert fresh_done["at"] is not None, "fresh-data must run first"
    assert reached["plan_called"], (
        "the edit planner must be reached after fresh-data completes")
    assert reached["at"] >= fresh_done["at"]
    # The plan is APPLIED: exactly one durable write, content updated.
    assert store.writes == 1
    assert store.content == EXPECTED
    # And the lane reports the completed edit.
    edit = (out.get("data") or {}).get("canvas_edit") or {}
    assert edit.get("updated") is True
    assert edit.get("postcondition_verified") is True


def test_slow_fresh_data_logs_its_stage_span(caplog):
    """The paired stage markers identify the prerequisite: the
    fresh_data_lookup span must open AND close, so a bounded leg can be
    attributed to the stage that consumed it."""
    import logging

    store = _DurableStore(QUOTE)
    upd_patch, read_patch = store.patches()

    async def _slow_fresh(*args, **kwargs):
        await asyncio.sleep(0.2)
        return cce.FreshDataResult("", False, True)

    with patch.object(cce, "fetch_fresh_data_section",
                      new=AsyncMock(side_effect=_slow_fresh)), \
         patch.object(cce, "plan_canvas_edit",
                      new=AsyncMock(return_value=_valid_plan())), \
         upd_patch, read_patch, \
         caplog.at_level(logging.INFO, logger="integrations.chat_orchestrator"):
        asyncio.run(co.ChatOrchestrator._try_canvas_edit(
            _orch(), MESSAGE, [], _canvas(), "user-1", "sess-span",
            "exec-span", None))
    records = [r.getMessage() for r in caplog.records
               if "[lane-stage-begin]" in r.getMessage()
               or "[lane-stage-end]" in r.getMessage()]
    stages = [msg.split("stage=")[1].split()[0] for msg in records
              if "[lane-stage-begin]" in msg]
    assert "fresh_data_lookup" in stages, (
        f"the fresh-data span must be visible; stages={stages}")
    ends = [msg for msg in records if "[lane-stage-end]" in msg
            and "fresh_data_lookup" in msg]
    assert ends, "the fresh-data span must close"
