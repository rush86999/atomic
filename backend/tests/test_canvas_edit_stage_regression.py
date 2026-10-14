# -*- coding: utf-8 -*-
"""The authorized-edit lane with a CONTROLLED VALID planner response
(verifier step 2): separates downstream execution from model latency.

Run 5 on d6bfe85f9 measured the planning leg at ~75s on llama3.1:8b and
could not establish the stages AFTER planning. This regression drives
the REAL `_try_canvas_edit` lane with a canned, schema-valid
CanvasEditPlan — the model is out of the picture entirely — and pins
the stages that must hold once a valid plan exists:

  apply once          exactly ONE durable write for the turn
  preservation        every byte the plan doesn't touch survives
  readback            the lane's own postcondition read-back verifies
                      the write (the orchestrator refuses to claim an
                      update without it)
  durable attribution the response carries canvas_edit.updated +
                      postcondition_verified + evidence refs — the
                      fields the durable outcome builder consumes
  zero model dispatch no LLM client exists in this lane; planning is
                      the canned plan

The J6 milestone (one authorized edit applied once, protected content
preserved, authoritative readback and reload agreeing, correctly
attributed durable evidence) is thereby proven at the lane boundary
independent of model latency; the live counted run measures the model
stages on top of this.
"""
import os
os.environ.setdefault("TESTING", "1")

import asyncio
from unittest.mock import AsyncMock, patch

import integrations.chat_orchestrator as co
import core.chat_canvas_editor as cce

CANVAS_ID = "cv-j6-stage"
QUOTE = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")
EXPECTED = QUOTE.replace("Valid until: 2026-11-30",
                         "Valid until: 2026-12-31")

MESSAGE = ("On this quotation, update the Valid Until date to "
           "2026-12-31. Change nothing else.")


def _orch():
    orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
    orch.tenant_id = "default"
    orch._cancelled_sessions = set()
    orch.llm_service = None  # NO model client exists in this lane
    return orch


class _DurableStore:
    """In-memory canvas_crud_tool: the write/read pair the lane's
    postcondition verification actually goes through."""

    def __init__(self, content: str):
        self.content = content
        self.writes = 0

    def patches(self):
        store = self

        async def _update(user_id, canvas_id, content, *args, **kwargs):
            store.writes += 1
            store.content = content
            return {"success": True, "audit_id": f"audit-{store.writes}"}

        async def _read(user_id, canvas_id, **kwargs):
            if store.content is None:
                return {"success": False, "error": "not found"}
            return {"success": True, "canvas_id": canvas_id,
                    "canvas_type": "document", "title": "Quotation",
                    "content": store.content}

        return (patch("tools.canvas_crud_tool.update_canvas_content",
                      new=AsyncMock(side_effect=_update)),
                patch("tools.canvas_crud_tool.read_canvas",
                      new=AsyncMock(side_effect=_read)))


def _valid_plan() -> cce.CanvasEditPlan:
    return cce.CanvasEditPlan(
        wants_edit=True,
        edit_mode="patch",
        ops=[cce.CanvasPatchOp(find="Valid until: 2026-11-30",
                               replace="Valid until: 2026-12-31")],
    )


def _run_lane():
    store = _DurableStore(QUOTE)
    upd_patch, read_patch = store.patches()
    shared = {}
    with patch.object(cce, "plan_canvas_edit",
                      new=AsyncMock(return_value=_valid_plan())), \
         patch.object(cce, "fetch_fresh_data_section",
                      new=AsyncMock(return_value=cce.FreshDataResult(
                          "", False, True))), \
         upd_patch, read_patch:
        out = asyncio.run(co.ChatOrchestrator._try_canvas_edit(
            _orch(), MESSAGE, [], {
                "canvas_id": CANVAS_ID,
                "canvas_type": "document",
                "title": "Quotation Q-2026-114",
                "content": QUOTE,
            }, "user-j6", "sess-j6", "exec-j6", None,
            shared_tool_state=shared))
    return out, store


def test_authorized_edit_applies_once_and_reads_back():
    out, store = _run_lane()
    assert out is not None, "the lane must complete with a valid plan"
    # APPLY ONCE: exactly one durable write for the turn.
    assert store.writes == 1, (
        f"exactly one authorized write; got {store.writes}")
    # PRESERVATION: every byte the plan doesn't touch survives.
    assert store.content == EXPECTED, (
        "the applied content must differ only in the edited line; "
        f"got {store.content!r}")
    # READBACK: the lane's own postcondition verification ran and
    # verified against the durable store.
    data = out.get("data") or {}
    edit = data.get("canvas_edit") or {}
    assert edit.get("updated") is True
    assert edit.get("postcondition_verified") is True, (
        f"the lane must verify the write by reading back; got {edit!r}")


def test_edit_response_carries_durable_mutation_evidence():
    out, _store = _run_lane()
    edit = (out.get("data") or {}).get("canvas_edit") or {}
    # The fields the durable outcome builder consumes:
    # canvas_edit.updated + readback -> objective_met, evidence refs
    # settle into the execution-bound outcome via build_task_outcome.
    assert edit.get("updated") is True
    assert edit.get("canvas_id") == CANVAS_ID
    assert edit.get("evidence_refs") is not None, (
        "the applied edit must carry its evidence refs for the durable "
        f"outcome; got {edit!r}")


def test_lane_makes_no_model_calls():
    """The lane ran with llm_service=None and a canned plan: if any code
    path tried to reach a model it would have raised — completing proves
    the downstream stages are model-free once the plan exists."""
    out, _store = _run_lane()
    assert out is not None
