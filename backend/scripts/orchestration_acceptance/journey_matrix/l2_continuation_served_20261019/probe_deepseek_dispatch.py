#!/usr/bin/env python3
"""DeepSeek dispatch feasibility probe — NOT an acceptance attempt.

Boots the frozen candidate in an isolated scratch world with the DeepSeek
direct API key registered through the product (operator vault row
``tenant_default_deepseek_default_production``), pins turn interpretation
to ``deepseek:deepseek-chat``, issues ONE real chat turn, and records
whether the interpretation dispatch reached a real model with a
schema-valid record. No acceptance claim, no promotion, separate
scratch/port from any attempt.

Run:  python probe_deepseek_dispatch.py
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import uuid
from pathlib import Path

import httpx

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import run_l2_served as base  # noqa: E402

PROBE_SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-fix/scratch/l2-deepseek-dispatch-probe")
PORT = 8107
OBS = HERE / "probe_deepseek_observation.jsonl"
SERVER_LOG = HERE / "probe_deepseek_server.log"
OUT = HERE / "probe_deepseek_dispatch.json"
PIN = "deepseek:deepseek-chat"
ASK = base.S7_ASK
VAULT = Path("/Users/rushiparikh/projects/atom/backend/data/byok_keys.json")
ENC = Path(
    "/Users/rushiparikh/projects/atom/backend/data/byok_encryption_key")

base.SCRATCH = PROBE_SCRATCH
base.PORT = PORT
base.BASE = f"http://127.0.0.1:{PORT}"
base.ATTEMPT = "probe_deepseek"
base.HERE = HERE
base.CANDIDATE_SHA = "c0cbea9f191a9c41d67db7cddf3446f17318884d"


def _guard() -> None:
    out = base.run(["git", "-C", str(base.CAND), "rev-parse", "HEAD"])
    if out.stdout.strip() != base.CANDIDATE_SHA:
        raise RuntimeError("candidate identity mismatch; no launch")
    if base.run(["git", "-C", str(base.CAND),
                 "status", "--porcelain"]).stdout.strip():
        raise RuntimeError("candidate dirty; no launch")
    if base.port_open(PORT):
        raise RuntimeError("probe port occupied; no launch")
    if (PROBE_SCRATCH / "atom.db").exists():
        raise RuntimeError("probe scratch exists; refuse reuse")
    if OBS.exists():
        raise RuntimeError("probe observation log exists; refuse reuse")


def main() -> int:
    _guard()
    PROBE_SCRATCH.mkdir(parents=True, exist_ok=True)
    env = base.declared_env()
    env["ATOM_TURN_INTERPRET_PIN"] = PIN
    env["L2_OBSERVATION_LOG"] = str(OBS)

    payload = {
        "kind": "deepseek-dispatch-probe",
        "candidate": base.CANDIDATE_SHA,
        "pin": PIN,
        "ask": ASK,
        "port": PORT,
        "note": "not an acceptance attempt; no promotion claim",
    }
    log = SERVER_LOG.open("w")
    proc = subprocess.Popen(
        [str(base.PY), str(HERE / "server_observe.py")],
        cwd=str(base.CAND_BACKEND), env=env,
        stdout=log, stderr=subprocess.STDOUT)
    payload["pid"] = proc.pid
    try:
        health = None
        deadline = time.time() + 300
        while time.time() < deadline:
            if proc.poll() is not None:
                break
            try:
                r = httpx.get(f"{base.BASE}/api/health", timeout=5,
                              trust_env=False)
                if r.status_code == 200:
                    health = r.json()
                    break
            except Exception:
                pass
            time.sleep(2)
        payload["health"] = bool(health)
        if not health:
            payload["error"] = "server_not_healthy"
            return 1
        payload["identity"] = health.get("identity") or {}

        email = f"dsprobe_{uuid.uuid4().hex[:10]}@example.com"
        password = "DsProbe-" + uuid.uuid4().hex[:12] + "A1"
        reg = httpx.post(f"{base.BASE}/api/auth/register",
                         json={"email": email, "password": password,
                               "first_name": "DS", "last_name": "Probe"},
                         timeout=60, trust_env=False)
        tok = (reg.json().get("access_token")
               if reg.status_code == 200 else None)
        if not tok:
            lg = httpx.post(f"{base.BASE}/api/auth/login",
                            json={"email": email, "username": email,
                                  "password": password},
                            timeout=60, trust_env=False)
            tok = lg.json().get("access_token") if lg.status_code == 200 \
                else None
        if not tok:
            payload["error"] = "auth_failed"
            return 1
        auth = {"Authorization": f"Bearer {tok}"}
        me = httpx.get(f"{base.BASE}/api/auth/me", headers=auth,
                       timeout=30, trust_env=False).json()
        uid = me.get("id")

        from cryptography.fernet import Fernet
        row = json.loads(VAULT.read_text())["keys"][
            "tenant_default_deepseek_default_production"]
        assert row.get("provider_id") == "deepseek"
        assert row.get("key_name") == "default"
        assert row.get("environment") == "production"
        assert row.get("is_active", True) is True
        key = Fernet(ENC.read_bytes().strip()).decrypt(
            row["encrypted_key"].encode()).decode()
        act = httpx.post(
            f"{base.BASE}/api/ai/providers/deepseek/keys", headers=auth,
            json={"api_key": key, "key_name": "default",
                  "environment": "production",
                  "label": "DeepSeek direct dispatch probe"},
            timeout=60, trust_env=False)
        payload["provider_activation"] = {
            "store_http": act.status_code,
            "credential_value_recorded": False,
            "base_url": "https://api.deepseek.com/v1",
            "credential_value_read_back": False,
        }
        del key, row
        pj = httpx.get(f"{base.BASE}/api/ai/providers", headers=auth,
                       timeout=60, trust_env=False)
        try:
            providers = ((pj.json().get("data") or {}).get("providers")
                         or [])
        except Exception:
            providers = []
        ds = next((p for p in providers
                   if (p.get("provider") or {}).get("id") == "deepseek"),
                  None)
        payload["provider_state"] = ds

        session_id = str(uuid.uuid4())
        request_id = f"l2-probe-{uuid.uuid4().hex}"
        payload["request_id"] = request_id
        t0 = time.monotonic()
        chat = httpx.post(
            f"{base.BASE}/api/chat/message", headers=auth,
            json={"message": ASK, "session_id": session_id, "user_id": uid,
                  "context": {"request_id": request_id}},
            timeout=900, trust_env=False)
        payload["chat_http"] = chat.status_code
        payload["chat_latency_s"] = round(time.monotonic() - t0, 2)
        final, polls = base.poll_settlement(session_id, auth, uid, t0, proc)
        time.sleep(1.0)
        payload["settlement"] = {
            "final_outcome": final.get("outcome"),
            "final_success": final.get("success"),
            "final_error_code": final.get("error_code"),
            "final_message": str(final.get("message") or "")[:1200],
            "polls": len(polls),
        }
        events = base.load_events(OBS)
        matched = base.events_for_request(events, request_id)
        interp_ev = base.last_event(matched, "interpret_turn_request") or {}
        interp = interp_ev.get("interpretation") or {}
        payload["interpretation_event"] = {
            "origin": interp.get("origin"),
            "scope_change": interp.get("scope_change"),
            "unresolved_reason": interp.get("unresolved_reason"),
            "confidence": interp.get("confidence"),
            "action_count": len(interp.get("actions") or []),
            "action_kinds": [
                (a or {}).get("kind")
                for a in (interp.get("actions") or [])
                if isinstance(a, dict)],
            "sources": interp.get("sources"),
            "requested_fields": interp.get("requested_fields"),
            "constraints": interp.get("constraints"),
        }
        log.flush()
        log_text = SERVER_LOG.read_text(errors="replace")
        payload["dispatch_lines"] = [
            line[:200] for line in log_text.splitlines()
            if f"route=turn_interpretation:{request_id}" in line
            and "[structured-dispatch]" in line]
        payload["pinned_lines"] = [
            line[:200] for line in log_text.splitlines()
            if "pinned call" in line or "pinned_planning" in line][-6:]
        payload["deepseek_http_lines"] = [
            line[:200] for line in log_text.splitlines()
            if "api.deepseek.com" in line][:10]
        payload["recent_errors"] = [
            line[:220] for line in log_text.splitlines()
            if "ERROR" in line][-10:]
        payload["dispatch_models"] = sorted(set(re.findall(
            r"\[structured-dispatch\] (\S+)", log_text)))
        payload["cascade_exhausted"] = log_text.count(
            "structured_cascade_exhausted")
    finally:
        try:
            proc.terminate()
            proc.wait(timeout=30)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
        log.close()
    payload["server_exit"] = proc.returncode
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True,
                              default=str) + "\n")
    print(json.dumps({
        "provider_store_http": payload.get(
            "provider_activation", {}).get("store_http"),
        "interpretation_origin": payload.get(
            "interpretation_event", {}).get("origin"),
        "scope_change": payload.get(
            "interpretation_event", {}).get("scope_change"),
        "unresolved_reason": payload.get(
            "interpretation_event", {}).get("unresolved_reason"),
        "action_kinds": payload.get(
            "interpretation_event", {}).get("action_kinds"),
        "dispatch_lines": payload.get("dispatch_lines"),
        "settlement": payload.get("settlement"),
    }, indent=2, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
