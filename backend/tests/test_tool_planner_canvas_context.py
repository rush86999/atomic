"""Regression pins for exec_canvas_context — the tool-exec context's
canvas shape (core.chat_tool_planner).

Live defect (J6 draft campaign 2026-10-15, T2 on the reviewed candidate
c7e97a30f): the chat path built the ``execute_tool_plan`` context with

    "canvas": {
        "title": canvas_context.get("title"),
        **((canvas_context.get("content") or {})
           if isinstance(canvas_context, dict) else {}),
    } if isinstance(canvas_context, dict) else None,

— the guard tested the OUTER context dict (always true at that site)
instead of the CONTENT. A document canvas's content is a STRING
(``chat_orchestrator._resolve_canvas_ctx`` returns the store's raw
content), so ``**``-unpacking it raised
``TypeError: 'str' object is not a mapping`` the moment any planned
lookup dispatched on such a turn: the planned memory.search never ran,
its retrieve operation settled ``search_failed`` on the turn's durable
lifecycle, and the envelope resolved ``turn_failed_no_result``
(success=false) although the comparison answer was delivered and
correct.

These tests pin the SHARED construction now used by both dispatch sites
(the chat path and the canvas lane's fresh-data lookup): string content
is never merged (no raise, title-only), mapping content keeps its
previous merge semantics, and a missing/non-mapping canvas yields None
so callers omit the key.
"""
from __future__ import annotations

import pathlib

from core.chat_tool_planner import exec_canvas_context

J6_QUOTE = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")


def test_string_content_never_raises_and_carries_title_only():
    """The exact crash shape: a document canvas's content is a str."""
    canvas = {"title": "Quotation Q-2026-114 (J6 draft)",
              "canvas_id": "028b2088-03c7-4c60-89dd-3466bd5926e5",
              "canvas_type": "document",
              "content": J6_QUOTE}
    out = exec_canvas_context(canvas)
    assert out == {"title": "Quotation Q-2026-114 (J6 draft)"}
    # The dispatch call sites unpack this mapping into the exec
    # context — the operation that used to raise TypeError('str' ...).
    ctx = {**out}
    assert ctx["title"].startswith("Quotation")
    assert "content" not in out


def test_mapping_content_merges_keys_and_content_wins():
    canvas = {"title": "Email draft",
              "content": {"subject": "Re: quote", "body": "hi",
                          "to": "elena@example.com",
                          "title": "content-title"}}
    out = exec_canvas_context(canvas)
    assert out["subject"] == "Re: quote"
    assert out["body"] == "hi"
    assert out["to"] == "elena@example.com"
    # Merge order preserved from the previous inline construction: the
    # content's own keys win over the outer title (documented before).
    assert out["title"] == "content-title"


def test_empty_or_absent_content_is_title_only():
    assert exec_canvas_context(
        {"title": "t", "content": {}}) == {"title": "t"}
    assert exec_canvas_context({"title": "t"}) == {"title": "t"}
    assert exec_canvas_context(
        {"title": "t", "content": None}) == {"title": "t"}


def test_non_mapping_canvas_yields_none():
    for bad in (None, "", "canvas", [], 0, 3.14):
        assert exec_canvas_context(bad) is None


def test_both_dispatch_sites_use_the_shared_helper():
    """The defect came from the same construction existing twice with
    one mistyped guard. Both sites must build from the helper, and the
    raw ``**``-unpack of canvas content must not reappear."""
    root = pathlib.Path(__file__).resolve().parents[1]
    chat = (root / "integrations" / "chat_orchestrator.py").read_text()
    lane = (root / "core" / "chat_canvas_editor.py").read_text()
    assert "exec_canvas_context(canvas_context)" in chat
    assert "exec_canvas_context(canvas)" in lane
    for text in (chat, lane):
        assert '**((canvas_context.get("content") or {})' not in text
        assert '**((canvas.get("content") or {})' not in text
