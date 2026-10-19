# -*- coding: utf-8 -*-
"""F6 — orchestrator delivery with controlled provider responses.

The Phase D defect lived at the orchestrator's response boundary: the
non-streaming narration was validated RAW (MiniMax's reasoning wrappers
survived), so the whole answer was quarantined into the "unusable output"
placeholder; on the streaming leg the cleaner's return value was discarded.

These tests drive ``_get_qwen_response`` with controlled provider responses:

* non-streaming: a wrapped MiniMax-shaped reply is converted before
  validation and delivered as the final answer (reasoning captured);
* streaming: a clean streamed reply is delivered as-is and never triggers
  the non-streaming leg;
* streaming: a residue-interrupted stream is NOT delivered as a truncated
  answer — the bounded non-streaming fallback runs instead (and, when that
  also has no final content, the honest placeholder is delivered).
"""
import os

os.environ.setdefault("TESTING", "1")

from unittest.mock import AsyncMock, MagicMock

import pytest

import integrations.chat_orchestrator as chat
from core.llm.byok_handler import QueryComplexity


def _orch():
    orch = chat.ChatOrchestrator()
    orch.ai_engines = {}
    return orch


def _stream_llm(tokens, fallback=None):
    llm = MagicMock()
    handler = MagicMock()
    handler.analyze_query_complexity.return_value = QueryComplexity.SIMPLE
    handler.get_optimal_provider = AsyncMock(
        return_value=("ollama", "llama3.1:8b"))
    handler.get_fallback_routes.return_value = []
    llm.handler = handler

    async def fake_stream(**kwargs):
        for tok in tokens:
            yield tok

    llm.stream_completion = fake_stream
    if fallback is None:
        llm.generate_completion = AsyncMock(
            side_effect=AssertionError("non-streaming leg must not run"))
    else:
        llm.generate_completion = AsyncMock(return_value=fallback)
    return llm


@pytest.fixture(autouse=True)
def _silence_ws(monkeypatch):
    import core.websockets as cw

    monkeypatch.setattr(cw.manager, "broadcast", AsyncMock())


@pytest.mark.asyncio
async def test_non_streaming_wrapped_narration_delivered_clean():
    orch = _orch()
    llm = MagicMock()
    llm.generate_completion = AsyncMock(return_value={
        "success": True,
        "content": (
            "<mm:thinking>The notes mention a marker; answer with it."
            "</mm:thinking>\n"
            "The notes state QUARTZ-77 (source: zephyr notes)."
        ),
        "model": "minimax-m3",
        "provider": "opencode-go",
    })
    orch.llm_service = llm

    out = await orch._get_qwen_response("what does the notes say?", [])

    assert out is not None, "the turn must not die into the placeholder"
    assert out["content"] == "The notes state QUARTZ-77 (source: zephyr notes)."
    assert "<mm:thinking>" not in out["content"]
    assert "unusable output" not in out["content"]
    assert "marker; answer with it" in (out.get("reasoning") or ""), (
        "wrapper contents must be captured as reasoning, never as the answer")


@pytest.mark.asyncio
async def test_streaming_clean_reply_delivered_without_fallback():
    orch = _orch()
    orch.llm_service = _stream_llm(["QUARTZ-77 ", "from the notes."])

    out = await orch._get_qwen_response(
        "what does the notes say?", [], user_id="u-1", session_id="s-1")

    assert out is not None
    assert out["content"] == "QUARTZ-77 from the notes."


@pytest.mark.asyncio
async def test_streaming_wrapped_reply_falls_back_and_delivers_clean():
    """A wrapped stream stops on residue; the bounded non-streaming leg
    regenerates, and the final answer is clean (no truncation, no residue)."""
    orch = _orch()
    orch.llm_service = _stream_llm(
        ["<mm:thinking>reasoning", " continues</mm:thinking>", "QUARTZ-77."],
        fallback={
            "success": True,
            "content": "QUARTZ-77 (source: zephyr notes).",
            "model": "minimax-m3",
            "provider": "opencode-go",
        },
    )

    out = await orch._get_qwen_response(
        "what does the notes say?", [], user_id="u-1", session_id="s-1")

    assert out is not None
    assert out["content"] == "QUARTZ-77 (source: zephyr notes)."
    assert "<mm:thinking>" not in out["content"]
