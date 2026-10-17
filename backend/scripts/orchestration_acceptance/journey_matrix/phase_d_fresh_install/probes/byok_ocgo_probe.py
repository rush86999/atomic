#!/usr/bin/env python3
"""BYOK probe — OpenCode Go key through the PRODUCT store (Phase D).

Owner directive 2026-10-17: "use opencode go keys or deepseek keys for
testing byok". This probe stores the operator's OpenCode Go key via the
exact endpoint Settings->AI uses (POST /api/ai/providers/opencode-go/keys
with the {api_key, key_name, environment} body the frontend sends), then
verifies: status -> key test -> three real chat turns (greeting, doc-style
question, repeat after a pause). Expected: provider=opencode-go, real
answers, NO 'no_llm_provider' sentinel (the F5 failure mode of the
local-only world).

The key is read at runtime from the operator's auth store and is never
printed or written anywhere by this script.
"""
from __future__ import annotations

import json
import os
import sys
import time
import uuid
from pathlib import Path

import httpx

BASE = "http://127.0.0.1:18100"
AUTH_STORE = Path.home() / ".local/share/opencode/auth.json"
PROVIDER = "opencode-go"


def _now() -> str:
    return time.strftime("%H:%M:%S")


def _find_provider(doc: dict) -> dict:
    try:
        providers = ((doc.get("data") or {}).get("providers") or [])
        for p in providers:
            if (p.get("provider") or {}).get("id") == PROVIDER:
                return {"has_api_keys": p.get("has_api_keys"),
                        "has_tenant_key": p.get("has_tenant_key"),
                        "status": p.get("status"),
                        "env_configured": p.get("env_configured")}
        return {"provider_found": False, "count": len(providers)}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def main() -> int:
    epoch = int(time.time())
    email = f"jprobe_ocgo_{epoch}@example.com"
    password = f"OcGo{epoch}A1"
    out: dict = {"probe": "byok_ocgo", "started": _now(), "base": BASE,
                 "provider": PROVIDER, "user": email, "steps": []}

    key = json.loads(AUTH_STORE.read_text()).get(PROVIDER, {}).get("key")
    out["key_loaded"] = bool(key)
    out["key_len"] = len(key or "")
    if not key:
        print(json.dumps(out, indent=2))
        return 2

    c = httpx.Client(timeout=180, trust_env=False)
    # 1. fresh product user
    r = c.post(f"{BASE}/api/auth/register", json={
        "email": email, "password": password,
        "first_name": "Byok", "last_name": "Probe"})
    out["register_http"] = r.status_code
    token = (r.json() if r.status_code == 200 else {}).get("access_token")
    if not token:
        out["error"] = f"register failed: {r.text[:200]}"
        print(json.dumps(out, indent=2))
        return 2
    h = {"Authorization": f"Bearer {token}"}
    me = c.get(f"{BASE}/api/auth/me", headers=h).json()
    user_id, workspace = me.get("id"), me.get("workspace_id")
    out["user_id"], out["workspace_id"] = user_id, workspace

    # 2. provider status BEFORE store
    before = c.get(f"{BASE}/api/ai/providers", headers=h).json()
    out["providers_before"] = _find_provider(before)
    out["steps"].append({"step": "providers_before", "at": _now()})

    # 3. store key — exact Settings->AI contract (body form)
    r = c.post(f"{BASE}/api/ai/providers/{PROVIDER}/keys", headers=h, json={
        "api_key": key, "key_name": "default", "environment": "production"})
    try:
        doc = r.json()
    except Exception:  # noqa: BLE001
        doc = {"_raw": r.text[:200]}
    out["store_http"] = r.status_code
    out["store_key_id"] = ((doc.get("data") or {}).get("key_id"))
    out["store_message"] = doc.get("message") or (doc.get("data") or {}).get("message")
    out["steps"].append({"step": "store", "at": _now(), "ok": bool(out["store_key_id"])})

    # 4. status AFTER store
    after = c.get(f"{BASE}/api/ai/providers", headers=h).json()
    out["providers_after"] = _find_provider(after)

    # 5. key test (server decrypts and probes the gateway client)
    t0 = time.monotonic()
    r = c.post(f"{BASE}/api/ai/providers/{PROVIDER}/test", headers=h, json={})
    dt = time.monotonic() - t0
    try:
        tdoc = r.json()
    except Exception:  # noqa: BLE001
        tdoc = {"_raw": r.text[:200]}
    out["key_test"] = {"http": r.status_code, "latency_s": round(dt, 1),
                       "success": tdoc.get("success"),
                       "data": tdoc.get("data")}

    # 6. chats
    def chat(tag: str, message: str) -> dict:
        sid = f"session_ocgo_{tag}_{uuid.uuid4().hex[:8]}"
        t0 = time.monotonic()
        try:
            r = c.post(f"{BASE}/api/chat/message", headers=h, json={
                "message": message, "session_id": sid, "user_id": user_id})
            dt = time.monotonic() - t0
            try:
                doc = r.json()
            except Exception:  # noqa: BLE001
                doc = {"_raw": r.text[:200]}
            meta = doc.get("metadata") or {}
            return {"tag": tag, "at": _now(), "http": r.status_code,
                    "latency_s": round(dt, 1),
                    "success": doc.get("success"),
                    "error_code": doc.get("error_code"),
                    "provider": doc.get("provider") or meta.get("provider"),
                    "model": doc.get("model") or meta.get("model"),
                    "message_head": str(doc.get("message"))[:260]}
        except Exception as exc:  # noqa: BLE001
            return {"tag": tag, "at": _now(), "http": None,
                    "latency_s": round(time.monotonic() - t0, 1),
                    "error": f"{type(exc).__name__}: {exc}"}

    out["steps"].append({"step": "chat_1_greeting", "at": _now()})
    out["chats"] = [chat("greeting", "Hello there - reply with one short sentence.")]
    out["steps"].append({"step": "chat_2_question", "at": _now()})
    out["chats"].append(chat("question",
                             "What is the launch code for project Zephyr-9?"))
    time.sleep(45)
    out["steps"].append({"step": "chat_3_repeat_after_45s", "at": _now()})
    out["chats"].append(chat("repeat",
                             "What is the launch code for project Zephyr-9?"))

    out["finished"] = _now()
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
