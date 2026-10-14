# -*- coding: utf-8 -*-
"""Edit-plan prompt assembly: explicit sections, compact variant, and
the discriminative regressions (verifier work order W1/W2/W4).

Pins:
  - job findings ARE interpolated (they were budgeted but never
    inserted into the dispatched prompt);
  - the canvas is serialized in FULL (the 6,000-char silent cap is
    gone from the edit-plan path) — a field beyond character 6,000
    remains available;
  - identity and playbooks are budget-accounted;
  - the compact variant (small-edit-shaped requests) keeps the full
    canvas, protected content, and relevant teaching — it swaps only
    the instruction set — and is never an authorization;
  - a missing live-evidence lookup declines the edit (clarification,
    never invented replacement).
"""
import os
os.environ.setdefault("TESTING", "1")

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import core.chat_canvas_editor as cce
import integrations.chat_orchestrator as co
from tests.test_canvas_edit_stage_regression import (
    MESSAGE as J6_MESSAGE,
    QUOTE as J6_QUOTE,
    _DurableStore,
    _orch,
    _valid_plan,
)

CANVAS_ID = "cv-assembly"
# A canvas whose LAST field sits beyond the old 6,000-char cap.
_PAD = "Filler line that must be preserved byte-for-byte.\n"
BIG_QUOTE = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    + _PAD * 130          # pushes ~7.4k chars
    + "Unit price: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")


def _canvas(content: str) -> dict:
    return {"canvas_id": CANVAS_ID, "canvas_type": "document",
            "title": "Quotation Q-2026-114", "content": content}


def _build(**overrides):
    kwargs = dict(
        message=J6_MESSAGE,
        history=[],
        canvas=_canvas(J6_QUOTE),
        fresh_data=None,
        corrections=None,
        versions=None,
        job_findings=None,
        lessons=None,
        similar_corrections=None,
        correction_patterns=None,
        provenance=None,
        user_identity=None,
        playbooks=None,
        compact=False,
    )
    kwargs.update(overrides)
    return cce._build_edit_plan_prompt(**kwargs)


def test_findings_section_reaches_the_dispatched_prompt():
    """W1 interpolation fix: job findings were budgeted but never
    inserted — the dispatched prompt now carries them."""
    captured = {}

    async def _structured(llm_service, *, prompt, response_model, **kw):
        captured["prompt"] = prompt
        return _valid_plan()

    findings = {"verified": [{"item": "FINDINGS-MARKER-7K1",
        "note": "the manual says torque to 40 Nm",
        "source": "maintenance manual 2024"}]}
    with patch.object(cce, "_plan_structured",
                      new=AsyncMock(side_effect=_structured)):
        asyncio.run(cce.plan_canvas_edit(
            J6_MESSAGE, [], _canvas(J6_QUOTE), MagicMock(),
            job_findings=findings))
    assert "FINDINGS-MARKER-7K1" in captured.get("prompt", ""), (
        "job findings must reach the dispatched prompt")


def test_canvas_beyond_6000_chars_stays_whole():
    """W1 serialization fix: the canvas is authoritative — a field
    beyond the old 6,000-char cap remains available to the planner."""
    prompt, manifest = _build(canvas=_canvas(BIG_QUOTE))
    assert "Valid until: 2026-11-30" in prompt
    assert len(BIG_QUOTE) > 6000, "the fixture must exceed the old cap"
    canvas_entry = next(m for m in manifest
                        if m["section"] == "canvas")
    assert canvas_entry["included"] is True
    assert canvas_entry["truncated"] is False, (
        "the artifact is never silently truncated")
    assert canvas_entry["size"] == len(BIG_QUOTE)


def test_manifest_records_every_section():
    prompt, manifest = _build(
        job_findings={"verified": [{"item": "price",
            "note": "48,000", "source": "price list"}]},
        lessons=[{"lesson": "Always confirm the delivery week.",
                  "confidence": 0.9}],
        user_identity={"name": "Chandrakant Sharma"},
        playbooks=[{"name": "Quoting playbook",
                    "description": "confirm delivery week"}],
    )
    names = {m["section"] for m in manifest}
    assert {"instructions", "app", "canvas", "history", "scope",
            "findings", "lessons", "identity", "playbooks"} <= names
    for m in manifest:
        assert set(m) >= {"section", "size", "included", "truncated"}
    # The instruction set is flagged with its variant.
    instr = next(m for m in manifest if m["section"] == "instructions")
    assert instr.get("compact") is False


def test_compact_assembly_keeps_canvas_teaching_and_constraints():
    """W2: compact swaps ONLY the instruction set — the full canvas,
    relevant teaching, and user constraints travel unchanged."""
    lesson_text = "Always confirm the delivery week before quoting."
    prompt, manifest = _build(
        canvas=_canvas(BIG_QUOTE),
        lessons=[{"lesson": lesson_text, "confidence": 0.9}],
        fresh_data="FRESH-EVIDENCE-MARKER: the price list says 48,000",
        compact=True,
    )
    instr = next(m for m in manifest if m["section"] == "instructions")
    assert instr.get("compact") is True
    # Preservation + verbatim-find + no-invention contract present.
    for marker in ("byte-for-byte", "verbatim", "Do not invent"):
        assert marker in prompt, f"the compact contract keeps {marker!r}"
    # The FULL canvas is in the compact prompt too.
    assert "Valid until: 2026-11-30" in prompt
    assert prompt.count(_PAD.strip()) >= 100, (
        "the compact prompt keeps the protected filler content")
    # Teaching and fresh evidence travel unchanged.
    assert lesson_text in prompt
    assert "FRESH-EVIDENCE-MARKER" in prompt


def test_compact_is_not_an_authorization():
    """W2 guard: compact is a prompt-shape choice. An unauthorized
    request takes the compact assembly and still gets NO plan — the
    authorization gates are upstream of the prompt."""
    # The lane-level authorization tests pin the refusal; here we pin
    # that the compact flag carries no authorization semantics: the
    # helper accepts it for any message and the ORCHESTRATOR's
    # authorization evaluation is a separate lane gate (covered by
    # test_edit_lane_authorization_routing).
    prompt, manifest = _build(message="malicious rewrite of everything",
                              compact=True)
    assert manifest[0].get("compact") is True
    assert "byte-for-byte" in prompt


def test_missing_evidence_declines_instead_of_inventing():
    """W4: a needed live lookup that FAILED declines the edit — the
    lane answers honestly; nothing is written."""
    store = _DurableStore(J6_QUOTE)
    upd, rd = store.patches()
    shared = {}
    with patch.object(cce, "fetch_fresh_data_section",
                      new=AsyncMock(return_value=cce.FreshDataResult(
                          "lookup failed", True, False))), \
         patch.object(cce, "plan_canvas_edit", new=AsyncMock(
             return_value=_valid_plan())), \
         upd, rd:
        out = asyncio.run(co.ChatOrchestrator._try_canvas_edit(
            _orch(), J6_MESSAGE, [], _canvas(J6_QUOTE), "user-1",
            "sess-dec", "exec-dec", None, shared_tool_state=shared))
    assert out is None, "a failed evidence lookup declines the edit"
    assert store.writes == 0, (
        "no write may happen without the evidence the edit depends on")
    assert shared.get("canvas_edit_no_apply") is True


def test_successful_edit_applies_once_reads_back_and_reloads():
    """W4's milestone shape: one authorized write, authoritative
    readback, and a fresh reload agreeing with the applied state."""
    store = _DurableStore(J6_QUOTE)
    upd_patch, read_patch = store.patches()
    with patch.object(cce, "plan_canvas_edit",
                      new=AsyncMock(return_value=_valid_plan())), \
         patch.object(cce, "fetch_fresh_data_section",
                      new=AsyncMock(return_value=cce.FreshDataResult(
                          "", False, True))), \
         upd_patch, read_patch:
        out = asyncio.run(co.ChatOrchestrator._try_canvas_edit(
            _orch(), J6_MESSAGE, [], _canvas(J6_QUOTE), "user-1",
            "sess-j6", "exec-j6", None))
        from tools.canvas_crud_tool import read_canvas
        fresh = asyncio.run(read_canvas("user-1", CANVAS_ID))
    assert store.writes == 1
    assert "Valid until: 2026-12-31" in store.content
    assert "Valid until: 2026-12-31" in (fresh.get("content") or ""), (
        f"the fresh reload must return the applied state; got {fresh!r}")
