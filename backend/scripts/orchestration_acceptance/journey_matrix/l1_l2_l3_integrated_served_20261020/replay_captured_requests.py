#!/usr/bin/env python3
"""One correctly-configured replay of the captured L3 and S3 requests.

Reuses the successful live-world harness's launch, product registration and
declared environment. It does not run the composed workflow: it registers a
scratch user, activates the authorized DeepSeek credential through the
product, uploads the captured fixtures, replays L3 once and S3 once, and
records every HTTP destination/model plus the transport/validation events
under the request IDs.

A wrong provider (e.g. OpenRouter) invalidates the replay and stops it before
the next request. The earlier wrong-route result is preserved separately as
diagnostic-invalid.
"""
from __future__ import annotations

import gzip
import json
import os
import shutil
import sys
import time
import uuid
from pathlib import Path

import httpx

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import run_composed_served_live_rehearsal as R  # noqa: E402

from cryptography.fernet import Fernet  # noqa: E402

OUT = HERE / "replay_captured_20261024"
OUT.mkdir(exist_ok=True)


def write(name, data):
    (OUT / name).write_text(
        data if isinstance(data, str) else json.dumps(data, indent=2,
                                                     default=str))


def log_transport(log_path: Path) -> dict:
    text = log_path.read_text(errors="replace")
    lines = [ln for ln in text.splitlines()
             if "HTTP Request:" in ln or "structured-dispatch" in ln
             or "structured-trace" in ln
             or "Structured attempt failed" in ln
             or "structured-cancelled" in ln
             or "verify-panel" in ln or "turn-interpretation" in ln
             or "deadline" in ln and "chat-request" in ln]
    destinations = sorted(set(
        ln.split("HTTP Request:", 1)[1].strip()
        for ln in lines if "HTTP Request:" in ln))
    wrong = [d for d in destinations
             if "openrouter" in d.lower() or "opencode" in d.lower()]
    return {
        "lines": lines,
        "destinations": destinations,
        "wrong_provider_destination": wrong,
        "invalid": bool(wrong),
    }


def main() -> int:
    if R.SCRATCH.exists():
        raise SystemExit(f"refusing existing scratch: {R.SCRATCH}")
    # Isolated copy of the same verified live-world snapshot used by the
    # successful composed rehearsal; all auxiliary stores stay fresh.
    R.SCRATCH.mkdir(parents=True)
    snapshot = Path(
        "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/"
        "opencode/atom-cutover-20261023/"
        "atom-pre-cutover-20261023-214450.db.gz")
    if not snapshot.exists():
        raise SystemExit("snapshot missing")
    db_file = R.SCRATCH / "atom.db"
    with gzip.open(snapshot, "rb") as src, db_file.open("wb") as dst:
        shutil.copyfileobj(src, dst, length=1024 * 1024)

    result = {
        "replay": "captured-l3-s3-20261024",
        "product_head": R.run(["git", "-C", str(R.CAND), "rev-parse",
                               "HEAD"]).stdout.strip(),
        "declared": {
            "pin": "deepseek:deepseek-v4-pro",
            "structured_endpoint": R.CREDENTIAL_ROUTE,
            "reply_provider": "ollama",
            "reply_model": "llama3.1:8b",
            "fallback": "deepseek",
            "source": "verified live-world snapshot",
        },
        "stores": {
            "scratch": str(R.SCRATCH),
            "database": str(db_file),
            "live_db": str(R.LIVE_DB),
            "byok_config": str(R.SCRATCH / "byok_config.json"),
            "byok_keys": str(R.SCRATCH / "byok_keys.json"),
            "byok_enc": str(R.SCRATCH / "byok_encryption_key"),
        },
        "requests": {},
    }

    proc = log = None
    try:
        proc, log, obs, log_path = R.launch("replay")
        health = R.wait_health(proc)
        if not health:
            raise RuntimeError("scratch server not healthy")
        result["health"] = health
        if health.get("identity", {}).get("database") != str(db_file):
            raise RuntimeError("health identity does not point at scratch DB")

        # Product registration + scoped token (same sequence as the
        # successful live-world harness).
        email = f"replay_{uuid.uuid4().hex[:10]}@example.com"
        password = "Replay-" + uuid.uuid4().hex[:12] + "A1"
        reg = httpx.post(f"{R.BASE}/api/auth/register",
                         json={"email": email, "password": password,
                               "first_name": "Replay",
                               "last_name": "Captured"},
                         timeout=60, trust_env=False)
        tok = (reg.json().get("access_token")
               if reg.status_code == 200 else None)
        if not tok:
            lg = httpx.post(f"{R.BASE}/api/auth/login",
                            json={"email": email, "username": email,
                                  "password": password},
                            timeout=60, trust_env=False)
            tok = (lg.json().get("access_token")
                   if lg.status_code == 200 else None)
        if not tok:
            raise RuntimeError(f"auth failed: {reg.status_code}")
        auth = {"Authorization": f"Bearer {tok}"}
        me = httpx.get(f"{R.BASE}/api/auth/me", headers=auth,
                       timeout=30, trust_env=False).json()
        uid = me.get("id")
        workspace_id = str(me.get("workspace_id") or "")
        result["user"] = {"id": uid, "workspace_id": workspace_id,
                          "email_recorded": False}
        if not uid or not workspace_id:
            raise RuntimeError("scratch user/workspace unresolved")

        # Authorized DeepSeek credential, decrypted from the operator vault
        # exactly as in the successful harness and registered THROUGH the
        # product. The value is never recorded.
        vault = R.MAIN / "backend/data/byok_keys.json"
        enc = R.MAIN / "backend/data/byok_encryption_key"
        row = json.loads(vault.read_text())["keys"][R.CREDENTIAL_VAULT_KEY]
        assert row.get("provider_id") == R.CREDENTIAL_PROVIDER
        assert row.get("is_active", True) is True
        key = Fernet(enc.read_bytes().strip()).decrypt(
            row["encrypted_key"].encode()).decode()
        post = httpx.post(
            f"{R.BASE}/api/ai/providers/{R.CREDENTIAL_PROVIDER}/keys",
            headers=auth,
            json={"api_key": key, "key_name": R.CREDENTIAL_KEY_NAME,
                  "environment": R.CREDENTIAL_ENVIRONMENT,
                  "label": "Captured replay DeepSeek"},
            timeout=60, trust_env=False)
        del key, row
        providers = httpx.get(f"{R.BASE}/api/ai/providers", headers=auth,
                              timeout=60, trust_env=False).json()
        state = next(
            (p for p in ((providers.get("data") or {}).get("providers") or [])
             if (p.get("provider") or {}).get("id")
             == R.CREDENTIAL_PROVIDER), None)
        active = bool(state and (state.get("status") == "active"
                                 or state.get("is_active")
                                 or state.get("has_api_key")
                                 or state.get("has_keys")))
        result["credential"] = {
            "store_http": post.status_code,
            "provider": R.CREDENTIAL_PROVIDER,
            "active": active,
            "value_recorded": False,
        }
        if post.status_code != 200 or not active:
            raise RuntimeError("authorized DeepSeek registration inactive")

        # Fixtures through the product.
        for name, text in ((R.FIXTURE_NAME, R.FIXTURE_TEXT),
                           (R.L3_FIXTURE_NAME, R.L3_FIXTURE_TEXT)):
            up = httpx.post(
                f"{R.BASE}/api/documents/upload", headers=auth,
                files={"file": (name, text.encode(), "text/plain")},
                timeout=300, trust_env=False)
            if up.status_code != 200:
                raise RuntimeError(f"upload failed: {name} {up.status_code}")
        result["source_identity"] = {
            "l3_fixture": R.L3_FIXTURE_NAME,
            "approved_fixture": R.FIXTURE_NAME,
            "workspace_id": workspace_id,
        }

        def ask(label, ask_text, session_id, cid):
            rid = f"replay-{label}-{uuid.uuid4().hex}"
            context = {"request_id": rid}
            if cid:
                context["canvas_id"] = cid
            t0 = time.monotonic()
            r = httpx.post(
                f"{R.BASE}/api/chat/message", headers=auth,
                json={"message": ask_text, "session_id": session_id,
                      "user_id": uid, "context": context},
                timeout=300, trust_env=False)
            try:
                data = r.json()
            except Exception:
                data = {"_raw": r.text[:4000]}
            return {
                "request_id": rid,
                "http": r.status_code,
                "latency_s": round(time.monotonic() - t0, 2),
                "response": data,
                "answer": str(data.get("message") or ""),
                "provider": data.get("provider"),
                "model": data.get("model"),
            }

        # L3 replay: one real-model response to the captured request.
        l3 = ask("l3", R.L3_ASK, str(uuid.uuid4()), None)
        transport = log_transport(log_path)
        result["requests"]["l3"] = l3
        result["transport_l3"] = transport
        if transport["invalid"]:
            result["classification"] = "diagnostic_invalid_wrong_provider"
            result["pass"] = False
            write("replay_result.json", result)
            write("replay_transport.jsonl",
                  "\n".join(transport["lines"]))
            return 2
        if (l3["http"] != 200 or R.L3_EXPECTED_CODE not in l3["answer"]
                or R.L3_DECOY_CODE in l3["answer"]
                or "Owner:" in l3["answer"]
                or "Team:" in l3["answer"]):
            result["classification"] = "l3_replay_failed"
            result["pass"] = False
            write("replay_result.json", result)
            return 3

        # S3 replay: create/seed the draft through the product and compare
        # it with the uploaded approved record. This is the captured schema
        # and input; no workflow stages are asserted.
        ccreate = httpx.post(f"{R.BASE}/api/canvas", headers=auth,
                             json={"title": R.CANVAS_TITLE,
                                   "canvas_type": "document"},
                             timeout=60, trust_env=False).json()
        cid = ccreate.get("canvas_id")
        if not cid:
            raise RuntimeError("canvas create failed")
        cput = httpx.put(f"{R.BASE}/api/canvas/{cid}", headers=auth,
                         json=R.CANVAS_BODY, timeout=60, trust_env=False)
        if cput.status_code != 200:
            raise RuntimeError(f"canvas seed failed: {cput.status_code}")
        session_b = str(uuid.uuid4())
        s3 = ask("s3", R.S3_ASK, session_b, cid)
        result["requests"]["s3"] = s3
        result["transport_all"] = log_transport(log_path)
        result["canvas_id"] = cid
        result["classification"] = "replay_passed"
        result["pass"] = bool(
            l3["http"] == 200 and s3["http"] == 200
            and not result["transport_all"]["invalid"])
        write("replay_result.json", result)
        write("replay_transport.jsonl",
              "\n".join(result["transport_all"]["lines"]))
        return 0 if result["pass"] else 4
    except Exception as exc:  # noqa: BLE001
        result["classification"] = "replay_error"
        result["error"] = type(exc).__name__
        result["detail"] = str(exc)[:500]
        result["pass"] = False
        write("replay_result.json", result)
        return 5
    finally:
        if log is not None:
            try:
                log.close()
            except Exception:
                pass
        R.stop_proc(proc)
        try:
            if "log_path" in locals():
                write("replay_server.log", Path(log_path).read_text(
                    errors="replace"))
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
