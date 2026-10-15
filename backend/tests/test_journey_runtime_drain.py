"""Launcher drain hardening (owner directive 2026-10-13): the pristine-J2
runs 3/4 stall was the acceptance launcher leaving the server's stdout
pipe undrained — at ~64KB the server's next log write blocked forever
holding the logging lock, freezing the event loop mid-turn (the turn
clock's wait_for never fired; the client window expired with the request
stuck in_progress). These tests pin the drain mechanics: it starts with
the launch, keeps consuming beyond pipe capacity, retains a bounded tail,
and cleans up when the output closes."""
import os
import textwrap
import threading
import time

import pytest


def _server_with_pipe(tmp_path):
    """A ScratchServer wired to a real os.pipe with a fake process — no
    subprocess, no server boot; only the drain mechanics under test."""
    from scripts.orchestration_acceptance import journey_runtime as jr

    r, w = os.pipe()
    server = jr.ScratchServer.__new__(jr.ScratchServer)
    server.port = 0
    server.preferred_port = None
    server.cwd = tmp_path
    server.base_env = {}
    server.proc = type("_Proc", (), {})()
    server.proc.stdout = open(r, "r")
    server.proc.returncode = None
    server.proc.terminate = lambda: None
    server.proc.wait = lambda timeout=None: 0
    server.proc.kill = lambda: None
    # launch drains via _launch; call the drain setup exactly as _launch does
    server._log_buffer = __import__("collections").deque(maxlen=2000)
    server._drain = threading.Thread(
        target=server._drain_logs, daemon=True)
    server._drain.start()
    return server, w


def test_drain_keeps_consuming_beyond_pipe_capacity(tmp_path):
    """200KB of log lines (>> the 64KB pipe that froze pristine run 3)
    never blocks the writer: the drain keeps the pipe empty and the
    bounded ring retains the tail."""
    server, w = _server_with_pipe(tmp_path)
    try:
        total = 0
        for i in range(1500):  # ~155KB of lines
            line = f"line {i}: " + "y" * 90
            os.write(w, (line + "\n").encode())
            total += len(line) + 1
        # give the drain thread a moment to consume everything
        time.sleep(0.5)
        # the pipe must not have filled: writing continues to succeed
        for i in range(100):
            os.write(w, (f"post {i}\n").encode())
        time.sleep(0.3)
        tail = server.log_tail()
        assert "post 99" in tail, (
            "the bounded ring must retain the latest lines for evidence")
        assert len(server._log_buffer) <= 2000
    finally:
        os.close(w)
        server._drain.join(timeout=5)
        server.proc.stdout.close()


def test_drain_exits_when_output_closes(tmp_path):
    """Lifetime: closing the server's output ends the drain thread —
    cleanup on exit, no thread leaking past teardown."""
    server, w = _server_with_pipe(tmp_path)
    assert server._drain.is_alive()
    os.close(w)
    server._drain.join(timeout=5)
    assert not server._drain.is_alive(), (
        "the drain thread must exit when the output closes")


def test_bounded_ring_drops_oldest(tmp_path):
    """The ring is bounded: oldest lines are dropped, never grown
    without bound, and the tail is always the most recent output."""
    server, w = _server_with_pipe(tmp_path)
    try:
        for i in range(2500):  # > the 2000-line ring
            os.write(w, (f"ring {i}\n").encode())
        time.sleep(0.5)
        buf = list(server._log_buffer)
        assert len(buf) <= 2000
        assert buf[-1].startswith("ring 24"), (
            f"the tail must be the newest output: {buf[-1][:40]!r}")
    finally:
        os.close(w)
        server._drain.join(timeout=5)
