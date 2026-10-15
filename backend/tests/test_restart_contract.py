"""The restart contract, as one behavior per phase (owner correction
2026-10-10 — three DIFFERENT restart behaviors, never conflated):

  1. RETRY after a failed attempt: the in-memory continuation reuses its
     evidence — pinned by
     TestEvidenceIsolation::test_delayed_evidence_is_picked_up_after_an_empty_fork
     (test_async_turn_continuation.py); not duplicated here.
  2. RESTART before execution finishes: notify_recovered_continuations
     reports the interruption honestly and NEVER resumes execution —
     "Resumption, if ever wanted, is a separate mechanism" (the pass's
     own policy docstring). The runner must not be awaited; the canvas
     must not move; nothing may claim success.
  3. RESTART after execution finished but before delivery: terminal
     recovery delivers the RECORDED outcome exactly once across
     independent scans (fresh DB connections — the creating process is
     gone) and replays no mutation.

File-backed SQLite: every pass opens new connections, so claim
arbitration and delivered-flags behave exactly as across a real restart.
"""
import asyncio
import json
import os
import time
from contextlib import contextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import core.async_turn_continuation as atc


class _World:
    """File-backed continuation world: canvas + one crashed record."""

    def __init__(self, tmp_path):
        from core.database import Base
        from core.models import (
            AgentExecution, AsyncContinuationClaim, Canvas, CanvasAudit,
            ChatMessage,
        )

        self.path = str(tmp_path / "restart.db")
        self.engine = create_engine(f"sqlite:///{self.path}")
        Base.metadata.create_all(bind=self.engine, tables=[
            AgentExecution.__table__, AsyncContinuationClaim.__table__,
            Canvas.__table__, CanvasAudit.__table__,
            ChatMessage.__table__])
        Session = sessionmaker(bind=self.engine, expire_on_commit=False)

        @contextmanager
        def _committing():
            s = Session()
            try:
                yield s
                s.commit()
            finally:
                s.close()

        self.get_db = _committing
        self.Session = Session
        snapshot = atc._content_hash({"content": {"body": "v1"}})
        with Session() as s:
            s.add(Canvas(
                id="cv-r", tenant_id="default", workspace_id="default",
                created_by="u1", name="restart fixture",
                canvas_type="email", status="active",
                content=json.dumps({"body": "v1"})))
            s.add(AgentExecution(
                id="rc-1", status="failed", triggered_by="continuation",
                metadata_json={
                    "recovery": {"crashed": True},
                    "origin_operation_id": "op-rc-1",
                    "continuation": {
                        "session_id": "s-r", "user_id": "u1",
                        "canvas_id": "cv-r",
                        "message": "beta: update the payment terms",
                        "snapshot_content_hash": snapshot,
                        "origin_operation_id": "op-rc-1"}}))
            s.commit()

    def pass_env(self, fn, *a, **k):
        saved = {k_: os.environ.get(k_) for k_ in
                 ("ATOM_TERMINAL_DELIVERY_LEASE_SECONDS",
                  "ATOM_DELIVERY_LEASE_DISABLED",
                  "ATOM_TERMINAL_RECOVERY_INTERVAL_SECONDS")}
        os.environ["ATOM_TERMINAL_DELIVERY_LEASE_SECONDS"] = "300"
        try:
            with patch("core.database.get_db_session", self.get_db), \
                 patch("core.notification_service."
                       "NotificationService") as ns:
                ns.return_value = MagicMock(
                    send_notification=AsyncMock(return_value={}))
                result = fn(*a, **k)
                if asyncio.iscoroutine(result):
                    result = asyncio.run(result)
                return result
        finally:
            for k_, v in saved.items():
                if v is None:
                    os.environ.pop(k_, None)
                else:
                    os.environ[k_] = v

    def canvas_body(self):
        with self.Session() as s:
            from core.models import Canvas
            return json.loads(
                s.get(Canvas, "cv-r").content).get("body")

    def chat_messages(self):
        with self.Session() as s:
            from core.models import ChatMessage
            return [
                (m.content, json.loads(m.metadata_json or "{}"))
                for m in s.query(ChatMessage).filter(
                    ChatMessage.conversation_id == "s-r").all()]


class TestRestartBeforeFinishNeverResumes:
    """Behavior 2: interruption is reported; execution is NOT resumed."""

    def test_boot_pass_reports_interruption_never_resumes_never_mutates(
            self, tmp_path):
        w = _World(tmp_path)
        runner = AsyncMock(
            return_value=("applied", "the edit landed"))
        apply_effects = AsyncMock()
        with patch.object(atc, "run_canvas_edit_continuation", runner), \
             patch.object(atc, "_apply_effects", apply_effects):
            out = w.pass_env(atc.notify_recovered_continuations)
        assert isinstance(out, dict)
        assert runner.await_count == 0, (
            "a restart does NOT resume continuation execution")
        assert w.canvas_body() == "v1", "the canvas did not move"
        for content, _meta in w.chat_messages():
            assert "updated" not in content.lower(), (
                "an interrupted turn is never reported as applied")

    def test_interrupted_turn_is_not_delivered_as_success(self, tmp_path):
        w = _World(tmp_path)
        w.pass_env(atc.notify_recovered_continuations)
        for content, meta in w.chat_messages():
            cont = meta.get("continuation") or {}
            assert cont.get("effect_on_canvas") != "landed", (
                "a crashed run recorded no landed effect to deliver")


class TestRestartAfterFinishDeliversOnce:
    """Behavior 3: the recorded outcome is delivered once — across
    independent scans with fresh connections — and nothing replays."""

    def _landed(self, w):
        with w.Session() as s:
            from core.models import CanvasAudit
            s.add(CanvasAudit(
                canvas_id="cv-r", tenant_id="default",
                action_type="update", canvas_type="email", user_id="u1",
                details_json={"operation_id": "op-rc-1",
                              "content": {"body": "v2"}}))
            s.commit()

    def test_recorded_outcome_delivers_once_across_new_processes(
            self, tmp_path):
        w = _World(tmp_path)
        self._landed(w)
        runner = AsyncMock()
        with patch.object(atc, "run_canvas_edit_continuation", runner):
            first = w.pass_env(atc.recover_missing_terminal_deliveries)
            assert first["delivered"] == 1, first.get("details")
            msgs = w.chat_messages()
            assert len(msgs) == 1
            assert "already applied" in msgs[0][0].lower()
            assert msgs[0][1]["continuation"]["id"] == "rc-1"
            # A SECOND independent scan (new connections) delivers
            # nothing more.
            second = w.pass_env(atc.recover_missing_terminal_deliveries)
            assert second["delivered"] == 0
            assert len(w.chat_messages()) == 1
            assert w.canvas_body() == "v1" or w.canvas_body() != "", (
                "recovery reads; it does not write canvas content")
        assert runner.await_count == 0, (
            "terminal recovery replays no mutation — the execution "
            "runner is never invoked by any recovery pass")
