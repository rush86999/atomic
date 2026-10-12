#!/usr/bin/env python3
"""Journey J2 — Model setup (acceptance contract, first wave).

Two isolated scratch worlds, because routing interference is itself a
finding: with a BYOK key stored AND ATOM_LOCAL_ONLY=true, the chat router
still ranked the cloud candidate and skipped it on cooldown — the local
model never received the turn (observed live 2026-10-11, recorded as a
routing finding, not worked around inside one world).

  WORLD A — LOCAL INFERENCE (quickstart's advertised no-key path):
    ATOM_LOCAL_ONLY=true + Ollama (the documented fresh-user setup step),
    then a REAL reply, a tool-shaped turn, a REAL restart (same run dir/
    DB, new process), and a second real reply.

  WORLD B — BYOK THROUGH THE PRODUCT (Settings -> AI):
    the provider key is stored via POST /api/ai/providers/{id}/keys (the
    exact call the UI sends); after a REAL restart the key must still
    exist AND decrypt (GET /api/ai/keys masks with the plaintext's first4/
    last4 only when decryption succeeds). Inherited provider credentials
    are scrubbed from the child env by journey_runtime — env keys served
    the product paths and proved nothing (observed live 2026-10-11).

First run of this journey (2026-10-11) FOUND a fresh-install product
defect: quickstart's BYOK_ENCRYPTION_KEY (secrets.token_urlsafe(32)) is
43 chars; cryptography's Fernet rejects it, so every Settings->AI store
call 404'd on fresh installs. Fixed in quickstart; the parity probe now
rejects malformed Fernet keys permanently.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.request
import uuid
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402
from scripts.orchestration_acceptance.acceptance_trial_lib import (  # noqa: E402
    chat_rows,
)

PROVIDER = "openrouter"
CRED_NAME = "OPENROUTER_API_KEY"
OLLAMA_BASE = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1"
MOCK_MARKERS = ("[mock", "mock response", "canned", "lorem ipsum")


def _ollama_up() -> bool:
    try:
        with urllib.request.urlopen(f"{OLLAMA_BASE}/api/tags",
                                    timeout=3) as r:
            return r.status == 200
    except Exception:  # noqa: BLE001
        return False


def _ensure_ollama():
    if _ollama_up():
        return True, None
    import shutil
    binary = shutil.which("ollama")
    if not binary:
        return False, None
    proc = subprocess.Popen([binary, "serve"], stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL)
    for _ in range(20):
        if _ollama_up():
            return True, proc
        time.sleep(1)
    proc.terminate()
    return False, None


def _turn(base, token, user_id, text, timeout_s=300.0):
    return JR.auth_post(base, token, "/api/chat/message",
                        {"message": text, "user_id": user_id,
                         "request_id": str(uuid.uuid4())},
                        timeout_s=timeout_s)


def _reply_verdict(r: dict) -> dict:
    rj = r["json"]
    content = str(rj.get("message") or "")
    return {"http": r["http"], "success": rj.get("success"),
            "provider": rj.get("provider"), "model": rj.get("model"),
            "content_len": len(content), "error_code": rj.get("error_code"),
            "outcome": rj.get("outcome"),
            "looks_mock": any(m in content.lower() for m in MOCK_MARKERS),
            "content_head": content[:160]}


def _real(v: dict) -> bool:
    return bool(v["http"] == 200 and v["success"] and v["content_len"]
                and not v["looks_mock"] and v["model"] and v["provider"])


def _masked(plain: str, masked: str) -> bool:
    return masked == f"{plain[:4]}...{plain[-4:]}"


def world_a_local(ollama_model: str,
                  server_kwargs: Optional[dict] = None) -> dict:
    extra = {"ATOM_LOCAL_ONLY": "true",
             "OLLAMA_BASE_URL": f"{OLLAMA_BASE}/v1",
             "OLLAMA_MODEL": ollama_model}
    server = JR.ScratchServer("j2_world_a_local", **(server_kwargs or {}),
                              extra_env=extra)
    out: dict = {"world": "A_local_inference", "model": ollama_model}
    try:
        boot = server.up()
        out["boot"] = boot
        if not boot.get("booted"):
            out["error"] = "boot failed"
            return out
        out["resolved_db_path"] = server.resolved_db_path
        user = JR.new_user(server.base)
        token, uid = user.get("token"), user.get("id")
        if not token:
            out["error"] = "register/login failed"
            return out

        # Configure local inference THROUGH THE PRODUCT (Settings → local
        # models): register the Ollama endpoint, discover models over the
        # live connection, declare the model, test it.
        reg = JR.auth_post(server.base, token, "/api/local-models",
                           {"name": "journey-ollama",
                            "provider_type": "ollama",
                            "base_url": f"{OLLAMA_BASE}/v1"})
        out["register_provider"] = {"http": reg["http"],
                                    "registered": (reg["json"] or {})
                                    .get("registered")}
        provider_id = (reg["json"] or {}).get("id")
        if not provider_id:
            out["error"] = f"provider registration failed: {reg}"
            return out
        models = JR.auth_get(server.base, token,
                             f"/api/local-models/{provider_id}/models")
        out["discover_models"] = {
            "http": models["http"],
            "count": len((models["json"] or {}).get("models")
                         or (models["json"] or {}).get("data") or []),
            "raw_head": json.dumps(models["json"], default=str)[:300]}
        caps = JR.auth_post(
            server.base, token,
            f"/api/local-models/{provider_id}/capabilities",
            {"model_id": ollama_model, "supports_tools": False,
             "supports_vision": False, "supports_reasoning": False,
             # Above the SIMPLE ranking floor (85/100, byok_handler
             # min_quality): the 2026-10-12 run declared 0.5 and the route
             # never ranked ("No eligible LLM providers"), a harness input
             # bug — the UI slider allows the same mistake with no hint.
             "quality_score": 0.9, "speed_score": 0.8,
             "context_window": 8192})
        out["set_capabilities"] = {"http": caps["http"]}
        test = JR.auth_post(server.base, token,
                            f"/api/local-models/{provider_id}/test", {})
        out["test_connection"] = {"http": test["http"],
                                  "ok": (test["json"] or {}).get("ok")
                                  or (test["json"] or {}).get("success")}

        r1 = _reply_verdict(_turn(server.base, token, uid,
                                  "Reply with exactly: PONG"))
        out["real_reply"] = r1

        t = _turn(server.base, token, uid,
                  "Search my documents for anything about quarterly "
                  "revenue and tell me what you find.")
        tj = t["json"]
        tmeta = tj.get("metadata") or {}
        out["tool_shaped"] = {
            "http": t["http"], "success": tj.get("success"),
            "provider": tj.get("provider"), "model": tj.get("model"),
            "content_head": str(tj.get("message") or "")[:200],
            "metadata_keys": sorted(tmeta.keys())[:20]}
        tool_ev = any(k in json.dumps(tmeta).lower()
                      for k in ("tool_plan", "tool", "search", "documents"))
        sid = tj.get("session_id")
        if sid and server.db_path.exists():
            rows = chat_rows(server.db_path, sid)
            blob = json.dumps([r["meta"] for r in rows
                               if r["role"] == "assistant"]).lower()
            out["tool_shaped"]["persisted_meta_keys"] = sorted(
                {k for r in rows if r["role"] == "assistant"
                 for k in (r["meta"] or {}).keys()})[:24]
            tool_ev = tool_ev or any(
                k in blob for k in ("tool_plan", "tool_name", "tool_calls",
                                    "documents.search", 'source": "tool'))
        out["tool_shaped"]["tool_evidence"] = bool(tool_ev)

        restart = server.restart()
        out["restart"] = {k: restart[k] for k in
                          ("booted", "seconds", "restart_number")
                          if k in restart}
        lst = JR.auth_get(server.base, token, "/api/local-models")
        out["providers_after_restart"] = {
            "http": lst["http"],
            "count": len(lst["json"] if isinstance(lst["json"], list)
                         else (lst["json"] or {}).get("data") or [])}
        r2 = _reply_verdict(_turn(server.base, token, uid,
                                  "Reply with exactly: PONG2"))
        out["second_reply"] = r2

        out["assertions"] = {
            "J2.local-provider-product-path": bool(
                out["register_provider"]["registered"]
                and out["discover_models"]["http"] == 200
                and out["set_capabilities"]["http"] == 200),
            "J2.real-reply": _real(r1),
            "J2.tool-planning": bool(tool_ev and t["http"] == 200),
            "J2.survive-restart": bool(
                restart.get("booted")
                and out["providers_after_restart"]["count"] >= 1
                and _real(r2)),
        }
    except Exception as exc:  # noqa: BLE001
        out["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        out["uvicorn_log_tail"] = server.log_tail()
        server.stop()
    return out


def world_b_byok(plain_key: str,
                 server_kwargs: Optional[dict] = None) -> dict:
    server = JR.ScratchServer("j2_world_b_byok", **(server_kwargs or {}))
    out: dict = {"world": "B_byok_product_path"}
    try:
        boot = server.up()
        out["boot"] = boot
        if not boot.get("booted"):
            out["error"] = "boot failed"
            return out
        user = JR.new_user(server.base)
        token = user.get("token")
        if not token:
            out["error"] = "register/login failed"
            return out

        stored = JR.auth_post(
            server.base, token, f"/api/ai/providers/{PROVIDER}/keys",
            {"api_key": plain_key, "key_name": "default",
             "environment": "production"})
        out["store_key"] = {"http": stored["http"],
                            "success": stored["json"].get("success"),
                            "key_id_present": bool(
                                (stored["json"].get("data") or {})
                                .get("key_id"))}
        keys1 = JR.auth_get(server.base, token, "/api/ai/keys")
        k1 = [k for k in ((keys1["json"].get("data") or {}).get("keys")
                          or []) if k.get("provider") == PROVIDER]
        decrypts_before = any(_masked(plain_key, k.get("masked_key") or "")
                              for k in k1)
        out["before_restart"] = {"keys_http": keys1["http"],
                                 "openrouter_keys": len(k1),
                                 "decrypts": decrypts_before}
        # Known inconsistency (evidence, not a gate): the per-key status
        # endpoint looks up the GLOBAL key id and cannot see tenant-scoped
        # keys the product store call just wrote.
        ks = JR.auth_get(server.base, token,
                         f"/api/ai/providers/{PROVIDER}/keys/default")
        out["tenant_key_status_inconsistency"] = {"http": ks["http"]}

        restart = server.restart()
        out["restart"] = {k: restart[k] for k in
                          ("booted", "seconds", "restart_number")
                          if k in restart}
        keys2 = JR.auth_get(server.base, token, "/api/ai/keys")
        k2 = [k for k in ((keys2["json"].get("data") or {}).get("keys")
                          or []) if k.get("provider") == PROVIDER]
        decrypts_after = any(_masked(plain_key, k.get("masked_key") or "")
                             for k in k2)
        out["after_restart"] = {"keys_http": keys2["http"],
                                "openrouter_keys": len(k2),
                                "decrypts": decrypts_after}
        out["assertions"] = {
            "J2.byok-add-product-path": bool(
                out["store_key"]["http"] == 200
                and out["store_key"]["success"] and decrypts_before),
            "J2.byok-survive-restart": bool(
                restart.get("booted") and k2 and decrypts_after),
        }
    except Exception as exc:  # noqa: BLE001
        out["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        out["uvicorn_log_tail"] = server.log_tail()
        server.stop()
    return out


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--pristine", action="store_true",
                    help="run against a git-archive CODE EXPORT with an "
                         "ALLOWLISTED environment (pristine-install "
                         "coverage, not checkout smoke)")
    ap.add_argument("--model", default="llama3.1:8b",
                    help="exact Ollama model tag (bare names without the "
                         "installed tag are rejected by the server: "
                         "'llama3.1' 404s when only llama3.1:8b exists)")
    args = ap.parse_args()

    creds = JR.read_repo_env_names([CRED_NAME])
    if not creds.get(CRED_NAME):
        print(f"BLOCKED: {CRED_NAME} not present in repo backend/.env")
        return 2
    ollama_ok, ollama_proc = _ensure_ollama()
    if not ollama_ok:
        print("BLOCKED: no Ollama at localhost:11434 and no ollama binary")
        return 2

    server_kwargs: dict = {}
    mode = JR.BOOT_MODE
    if args.pristine:
        export = JR.materialize_code_export()
        server_kwargs = {"allowlisted": True, "code_export": export}
        mode = "pristine_code_export"

    ev: dict = {"journey": "J2", "mode": mode,
                "provider": PROVIDER, "local_model": args.model,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    a = world_a_local(args.model, server_kwargs=server_kwargs)
    ev["world_a"] = a
    b = world_b_byok(creds[CRED_NAME], server_kwargs=server_kwargs)
    ev["world_b"] = b

    checks = {}
    for k, v in (a.get("assertions") or {}).items():
        checks[k] = v
    for k, v in (b.get("assertions") or {}).items():
        checks[k] = v
    ev["assertions"] = checks
    ev["pass"] = bool(checks) and all(checks.values())
    ev["uvicorn_log_tail"] = None  # per-world tails already recorded
    if ollama_proc is not None:
        ollama_proc.terminate()
    out = JR.save_result("j2_model_setup", ev)
    print(json.dumps(checks, indent=1))
    print(f"evidence: {out}")
    return 0 if ev["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
