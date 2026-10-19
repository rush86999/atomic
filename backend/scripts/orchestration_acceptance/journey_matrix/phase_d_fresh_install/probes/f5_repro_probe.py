#!/usr/bin/env python3
"""F5 deterministic reproduction probe (Phase D).

Claim under test: a SINGLE transient failure of the Ollama availability
probe poisons BYOKHandler._OLLAMA_DOWN_MEMO (class attribute, TTL 300s),
and because the isolated world runs ATOM_LOCAL_ONLY=true (Ollama is the
only eligible provider), every chat turn inside the window returns the
"no_llm_provider" sentinel even though the daemon is healthy again.

Method: SIGSTOP the host Ollama daemon (pid passed) just past the probe's
2s read timeout, then SIGCONT. The pause is hard-capped by a timer thread.
Sequence: baseline -> frozen -> after_resume_immediate -> after_70s.

World: Phase D isolated backend http://127.0.0.1:18100, user U2 with a
default-shaped (Settings->AI) ollama key. Read-only wrt product code.
"""
from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import threading
import time
import uuid

import httpx

BASE = "http://127.0.0.1:18100"
EMAIL = "jprobe_exp_1792248280@example.com"
PASSWORD = "<scratch-user-password>"
OLLAMA_TAGS = "http://127.0.0.1:11434/api/tags"
OLLAMA_PID = int(os.environ.get("F5_OLLAMA_PID", "23559"))
PAUSE_CAP_S = 12


def _now() -> str:
    return time.strftime("%H:%M:%S")


def login() -> dict:
    r = httpx.post(f"{BASE}/api/auth/login",
                   json={"email": EMAIL, "username": EMAIL, "password": PASSWORD},
                   timeout=30, trust_env=False)
    if r.status_code != 200:
        return {}
    token = r.json().get("access_token")
    me = httpx.get(f"{BASE}/api/auth/me",
                   headers={"Authorization": f"Bearer {token}"},
                   timeout=30, trust_env=False)
    return {"token": token, "user_id": (me.json() or {}).get("id") if me.status_code == 200 else None}


def chat(auth: dict, tag: str) -> dict:
    sid = f"session_f5repro_{tag}_{uuid.uuid4().hex[:8]}"
    t0 = time.monotonic()
    try:
        r = httpx.post(
            f"{BASE}/api/chat/message",
            headers={"Authorization": f"Bearer {auth['token']}"},
            json={"message": "Reply with exactly: OK", "session_id": sid,
                  "user_id": auth["user_id"]},
            timeout=180, trust_env=False)
        dt = time.monotonic() - t0
        try:
            doc = r.json()
        except Exception:  # noqa: BLE001
            doc = {"_raw": r.text[:200]}
        meta = doc.get("metadata") or {}
        return {
            "tag": tag, "at": _now(), "http": r.status_code,
            "latency_s": round(dt, 1),
            "success": doc.get("success"),
            "error_code": doc.get("error_code"),
            "model": doc.get("model") or meta.get("model")
                     or (meta.get("llm") or {}).get("model"),
            "message_head": str(doc.get("message"))[:220],
        }
    except Exception as exc:  # noqa: BLE001
        return {"tag": tag, "at": _now(), "http": None,
                "latency_s": round(time.monotonic() - t0, 1),
                "error": f"{type(exc).__name__}: {exc}"}


def tags_probe(timeout_s: float = 5.0) -> dict:
    t0 = time.monotonic()
    try:
        r = httpx.get(OLLAMA_TAGS, timeout=timeout_s, trust_env=False)
        return {"http": r.status_code,
                "ms": round((time.monotonic() - t0) * 1000)}
    except Exception as exc:  # noqa: BLE001
        return {"http": None, "error": type(exc).__name__,
                "ms": round((time.monotonic() - t0) * 1000)}


def main() -> int:
    out: dict = {"probe": "f5_repro", "started": _now(),
                 "ollama_pid": OLLAMA_PID, "steps": []}
    ps = subprocess.run(["ps", "-p", str(OLLAMA_PID), "-o", "command="],
                        capture_output=True, text=True).stdout
    out["ollama_process"] = ps.strip() or None
    if "ollama" not in ps:
        out["error"] = "expected ollama pid not found — aborting"
        print(json.dumps(out, indent=2))
        return 2

    auth = login()
    out["login_ok"] = bool(auth.get("token"))
    out["user_id"] = auth.get("user_id")
    if not auth.get("token"):
        out["error"] = "U2 login failed — aborting"
        print(json.dumps(out, indent=2))
        return 2
    token = auth

    out["tags_before"] = tags_probe()
    out["steps"].append({"phase": "0_baseline"})
    out["steps"].append(chat(token, "baseline"))

    # --- freeze the daemon, bounded by a hard-cap resume timer -----------
    state = {"resumed": False}

    def _resume() -> None:
        time.sleep(PAUSE_CAP_S)
        if not state["resumed"]:
            try:
                os.kill(OLLAMA_PID, signal.SIGCONT)
            except ProcessLookupError:
                pass
            state["resumed"] = True
            out.setdefault("resume_events", []).append(
                {"at": _now(), "by": "timer_cap"})

    threading.Thread(target=_resume, daemon=True).start()
    os.kill(OLLAMA_PID, signal.SIGSTOP)
    out["frozen_at"] = _now()
    out["steps"].append({"phase": "1_frozen",
                         "tags_while_frozen": tags_probe(timeout_s=2.0)})
    out["steps"].append(chat(token, "frozen"))
    try:
        os.kill(OLLAMA_PID, signal.SIGCONT)
        state["resumed"] = True
        out.setdefault("resume_events", []).append(
            {"at": _now(), "by": "main"})
    except ProcessLookupError:
        pass
    out["tags_after_resume"] = tags_probe()

    # --- proof: memo/cache must suppress the provider while healthy ------
    out["steps"].append({"phase": "2_after_resume"})
    out["steps"].append(chat(token, "after_resume_immediate"))

    time.sleep(70)
    out["tags_after_70s"] = tags_probe()
    out["steps"].append({"phase": "3_after_70s"})
    out["steps"].append(chat(token, "after_70s"))

    out["finished"] = _now()
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
