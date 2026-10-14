# -*- coding: utf-8 -*-
"""Cancellation semantics of the structured dispatch (verifier round 19,
step 3): the structured attempt runs a SYNCHRONOUS Instructor client in
a worker thread. Cancelling the awaiting task does not cancel the
worker — and the dispatch's `finally` releases the model-attempt
reservation immediately, so another request can claim the endpoint
while the original still occupies it.

This test DEMONSTRATES that mechanism with a controlled blocking client
(model-independent) — it is the code-supported risk the review flagged,
now pinned:

  1. cancellation is logged as its own event
     ([structured-cancelled], reservation_released=true);
  2. the worker is STILL RUNNING after the awaiter is cancelled;
  3. the reservation is released while the worker runs — a second
     dispatch claims the same model and reaches the endpoint: the
     overlap.
"""
import os
os.environ.setdefault("TESTING", "1")

import asyncio
import logging
import threading
import pytest
from unittest.mock import MagicMock, patch
from types import SimpleNamespace as NS

import core.llm.byok_handler as bh
from core.chat_canvas_editor import CanvasEditPlan
from tests.test_structured_dispatch_policy import (
    LOCAL_MODEL,
    LOCAL_PROVIDER,
    _handler,
    _seed_pool,
)

# ISOLATION CAVEAT: the pricing-fetcher singleton is module-global; run
# this file STANDALONE (pytest tests/test_structured_cancellation.py).
# Combined with files that reseed the shared fetcher, the seeded pool
# can be replaced before this test's ranking runs — a test-infra
# artifact, not product behavior.


class _BlockingWrapper:
    """The Instructor stand-in: create() blocks until the test releases
    it, counting every entry — the worker's liveness is observable."""

    def __init__(self):
        self.lock = threading.Lock()
        self.started = 0
        self.finished = 0
        self.release = threading.Event()
        self.results = []

    def make(self):
        wrapper = self

        def create(**kwargs):
            with wrapper.lock:
                wrapper.started += 1
            wrapper.release.wait(timeout=30)
            plan = CanvasEditPlan(
                wants_edit=True,
                updated_content_json='"Valid until: 2026-12-31"')
            with wrapper.lock:
                wrapper.finished += 1
                wrapper.results.append(plan)
            return plan

        return create

    def as_instructor(self):
        return NS(chat=NS(completions=NS(create=self.make())))


@pytest.mark.asyncio
async def test_cancellation_leaves_worker_running_and_releases_the_reservation(
        monkeypatch, caplog):
    handler = _handler()
    _seed_pool(handler, monkeypatch, with_local=True)

    wrapper = _BlockingWrapper()
    with patch.object(bh.instructor, "from_openai",
                      lambda client, **k: wrapper.as_instructor()), \
         caplog.at_level(logging.WARNING, logger="core.llm.byok_handler"):
        first = asyncio.create_task(handler.generate_structured_response(
            prompt="update the valid until date",
            system_instruction="You return only the requested JSON object.",
            response_model=CanvasEditPlan,
            task_type="planning",
            route_trace_id=f"canvas_edit_plan:exec-cancel",
        ))
        # The worker is inside create() — the dispatch happened.
        for _ in range(3000):
            with wrapper.lock:
                if wrapper.started:
                    break
            await asyncio.sleep(0.01)
        assert wrapper.started == 1, "the first dispatch must reach the client"

        first.cancel()
        try:
            await first
        except asyncio.CancelledError:
            pass
        # The cancellation event is logged, separately from completion.
        cancelled = [r for r in caplog.records
                     if "[structured-cancelled]" in r.getMessage()
                     and "route=canvas_edit_plan:exec-cancel" in r.getMessage()]
        assert cancelled, "cancellation must be its own logged event"
        assert "reservation_released=true" in cancelled[0].getMessage()

        # The WORKER IS STILL RUNNING: started but not finished.
        with wrapper.lock:
            assert wrapper.started == 1 and wrapper.finished == 0, (
                "the synchronous request keeps running after the "
                "awaiter is cancelled")

        # THE RESERVATION IS ALREADY RELEASED: a fresh claim succeeds
        # while the original worker still occupies the endpoint.
        assert handler._claim_model_attempt(
            LOCAL_PROVIDER, LOCAL_MODEL, holder="probe"), (
            "the reservation was released while the worker still runs")
        handler._release_model_attempt(LOCAL_PROVIDER, LOCAL_MODEL)

        # THE OVERLAP: a second dispatch claims the same model and
        # reaches the client while the first worker still runs.
        second = asyncio.create_task(handler.generate_structured_response(
            prompt="update the valid until date",
            system_instruction="You return only the requested JSON object.",
            response_model=CanvasEditPlan,
            task_type="planning",
            route_trace_id="canvas_edit_plan:exec-second",
        ))
        for _ in range(3000):
            with wrapper.lock:
                if wrapper.started >= 2:
                    break
            await asyncio.sleep(0.01)
        with wrapper.lock:
            assert wrapper.started == 2, (
                "a second request dispatched while the first worker was "
                f"still running (started={wrapper.started}, "
                f"finished={wrapper.finished}) — the overlap is real")
        # Release everything; both workers complete with valid plans.
        wrapper.release.set()
        r1 = await first if False else None  # first was cancelled
        out2 = await second
        assert isinstance(out2, CanvasEditPlan)
        # Give the orphaned worker a moment to finish so the test does
        # not leak a thread mid-write.
        for _ in range(3000):
            with wrapper.lock:
                if wrapper.finished >= 2:
                    break
            await asyncio.sleep(0.01)
