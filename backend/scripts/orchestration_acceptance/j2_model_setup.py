#!/usr/bin/env python3
"""Journey J2 — Model setup (acceptance contract, first wave).

Two isolated scratch worlds, because routing interference is itself a
finding: with a BYOK key stored AND ATOM_LOCAL_ONLY=true, the chat router
still ranked the cloud candidate and skipped it on cooldown — the local
model never received the turn (observed live 2026-10-11, recorded as a
routing finding, not worked around inside one world).

  WORLD A — LOCAL INFERENCE (quickstart's advertised no-key path):
    ATOM_LOCAL_ONLY=true + Ollama (the documented fresh-user setup step),
    then the COUNTED FIRST authenticated chat request, a tool-shaped turn,
    a REAL restart (same run dir/DB, new process), and a second real
    reply. The restart leg is exercised even when an earlier turn failed.

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

ROUND-10 EVIDENCE INTEGRITY (owner review 2026-10-12):

  * Aggregate PASS requires an explicit True on EVERY mandatory assertion
    of BOTH worlds. A world that raises leaves its assertion map at None
    (untested) instead of silently vanishing — the round-9 evidence
    reported `pass: true` on world B alone while world A had refused.
  * Tool evidence is ATTRIBUTABLE execution records: the turn's
    execution id -> agent_executions -> task_outcome.tool_outcomes
    (receipts with `verified`), read from the scratch DB. Substring
    matching over response/prompt echoes is gone.
  * Client-window failure and later server delivery are preserved
    SEPARATELY: a timeout is a failed user request (the client gets the
    request_id back for the server-side lookup), and the server-side
    record is extra evidence, never a retroactive pass.
  * Every evidence file embeds the archived commit, the effective-config
    digest and the actual scratch-storage paths.
  * A world that crashes the harness process itself (scratch-world
    construction, teardown) is still recorded — every mandatory
    assertion UNTESTED — so the run keeps its partial record, still
    executes the other world, still writes evidence, and exits nonzero.
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

PROVIDER = "openrouter"
CRED_NAME = "OPENROUTER_API_KEY"
OLLAMA_BASE = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1"
MOCK_MARKERS = ("[mock", "mock response", "canned", "lorem ipsum")

#: Mandatory per world — the aggregate can only pass on explicit Trues.
EXPECTED_A = (
    "J2.local-provider-product-path",
    "J2.real-reply",
    "J2.tool-planning",
    "J2.survive-restart",
)
EXPECTED_B = (
    "J2.byok-add-product-path",
    "J2.byok-survive-restart",
)

#: Which demonstrated criterion each mandatory assertion stands for —
#: emitted into the evidence so an UNTESTED entry names exactly what was
#: NOT demonstrated. "persisted-outcome" folds into J2.tool-planning: the
#: receipts are read from the PERSISTED agent_executions/task_outcome
#: records, so one id covers both the tool-execution and the
#: persisted-outcome criteria.
CRITERIA = {
    "J2.local-provider-product-path": "provider-config",
    "J2.real-reply": "real-reply",
    "J2.tool-planning": "tool-execution + persisted-outcome",
    "J2.survive-restart": "restart-durability",
    "J2.byok-add-product-path": "byok-store-readback",
    "J2.byok-survive-restart": "byok-restart-durability",
}


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


def _turn(server, token, uid, text, timeout_s=300.0, settle_poll_s=120.0):
    """One public chat turn with a CLIENT-MINTED request id. The client
    window and any later server delivery are recorded separately — a
    timeout is a failed user request, never repaired by the server
    finishing afterwards."""
    request_id = str(uuid.uuid4())
    t0 = time.monotonic()
    try:
        r = JR.auth_post(server.base, token, "/api/chat/message",
                         {"message": text, "user_id": uid,
                          "request_id": request_id},
                         timeout_s=timeout_s)
        return {
            "client": {"request_id": request_id, "window_s": timeout_s,
                       "outcome": "response", "http": r["http"],
                       "elapsed_s": round(time.monotonic() - t0, 3)},
            "response": r,
        }
    except Exception as exc:  # noqa: BLE001 — includes httpx.ReadTimeout
        client = {"request_id": request_id, "window_s": timeout_s,
                  "outcome": f"client_timeout:{type(exc).__name__}",
                  "http": None,
                  "elapsed_s": round(time.monotonic() - t0, 3)}
        return {
            "client": client,
            "server": JR.server_delivery(server.db_path, request_id,
                                         poll_s=settle_poll_s),
        }


def _reply_verdict(checked: dict) -> dict:
    r = checked.get("response")
    if not r:
        return {"http": None, "success": None, "provider": None,
                "model": None, "content_len": 0, "error_code": None,
                "outcome": None, "looks_mock": False, "content_head": ""}
    rj = r["json"] or {}
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
    out: dict = {"world": "A_local_inference", "model": ollama_model,
                 "assertions": {k: None for k in EXPECTED_A}}
    try:
        boot = server.up()
        out["boot"] = boot
        out["identity"] = server.evidence_identity()
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
        out["assertions"]["J2.local-provider-product-path"] = bool(
            out["register_provider"]["registered"]
            and models["http"] == 200 and caps["http"] == 200)

        # --- the COUNTED FIRST authenticated chat request ----------------
        first = _turn(server, token, uid, "Reply with exactly: PONG")
        r1 = _reply_verdict(first)
        out["first_reply"] = {"client": first["client"], **r1}
        if "server" in first:
            out["first_reply"]["server"] = first["server"]
        out["real_reply"] = out["first_reply"]  # back-compat pointer
        first_ok = first["client"]["outcome"] == "response" and _real(r1)
        out["assertions"]["J2.real-reply"] = first_ok

        # --- tool-shaped ask: attributable receipts, not substrings ------
        tool = _turn(server, token, uid,
                     "Search my documents for anything about quarterly "
                     "revenue and tell me what you find.")
        tj = (tool.get("response") or {}).get("json") or {}
        tool_sid = tj.get("session_id")
        server_exec = (tool.get("server") or {}).get("execution_id")
        receipts: dict = {}
        if tool_sid and server.db_path.exists():
            receipts = JR.turn_tool_receipts(server.db_path, tool_sid)
        elif server_exec and server.db_path.exists():
            receipts = JR.execution_tool_receipts(server.db_path, server_exec)
        out["tool_shaped"] = {
            "client": tool["client"],
            "server": tool.get("server"),
            "http": (tool.get("response") or {}).get("http"),
            "success": tj.get("success"),
            "provider": tj.get("provider"),
            "model": tj.get("model"),
            "content_head": str(tj.get("message") or "")[:200],
            "receipts": receipts.get("receipts", []),
            "receipt_count": receipts.get("receipt_count", 0),
            "evidence_ref_count": receipts.get("evidence_ref_count", 0),
            "tool_success": receipts.get("tool_success"),
            "receipt_source": "agent_executions.task_outcome "
                              "(read-only sqlite)",
        }
        out["assertions"]["J2.tool-planning"] = bool(
            tool["client"]["outcome"] == "response"
            and (tool.get("response") or {}).get("http") == 200
            and receipts.get("tool_success") is True)

        # --- restart durability (exercised even after a failed turn) -----
        restart = server.restart()
        out["restart"] = {k: restart[k] for k in
                          ("booted", "seconds", "restart_number")
                          if k in restart}
        lst = JR.auth_get(server.base, token, "/api/local-models")
        out["providers_after_restart"] = {
            "http": lst["http"],
            "count": len(lst["json"] if isinstance(lst["json"], list)
                         else (lst["json"] or {}).get("data") or [])}
        second = _turn(server, token, uid, "Reply with exactly: PONG2")
        r2 = _reply_verdict(second)
        out["second_reply"] = {"client": second["client"], **r2}
        if "server" in second:
            out["second_reply"]["server"] = second["server"]
        out["assertions"]["J2.survive-restart"] = bool(
            restart.get("booted")
            and out["providers_after_restart"]["count"] >= 1
            and second["client"]["outcome"] == "response" and _real(r2))
    except Exception as exc:  # noqa: BLE001
        out["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        # A teardown failure must neither mask the leg's own error nor
        # discard the partial record: an earlier J2.real-reply pass stays
        # recordable even if log/stopping the scratch world blows up.
        try:
            out["uvicorn_log_tail"] = server.log_tail()
            server.stop()
        except Exception as teardown_exc:  # noqa: BLE001
            out["teardown_error"] = (
                f"{type(teardown_exc).__name__}: {teardown_exc}")
        out["assertion_states"] = {
            k: ("verified" if v is True else "failed" if v is False
                else "untested")
            for k, v in out["assertions"].items()}
    return out


def world_b_byok(plain_key: str,
                 server_kwargs: Optional[dict] = None) -> dict:
    server = JR.ScratchServer("j2_world_b_byok", **(server_kwargs or {}))
    out: dict = {"world": "B_byok_product_path",
                 "assertions": {k: None for k in EXPECTED_B}}
    try:
        boot = server.up()
        out["boot"] = boot
        out["identity"] = server.evidence_identity()
        if not boot.get("booted"):
            out["error"] = "boot failed"
            return out
        out["resolved_db_path"] = server.resolved_db_path
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
                            "success": (stored["json"] or {}).get("success"),
                            "key_id_present": bool(
                                ((stored["json"] or {}).get("data") or {})
                                .get("key_id"))}
        keys1 = JR.auth_get(server.base, token, "/api/ai/keys")
        k1 = [k for k in (((keys1["json"] or {}).get("data") or {})
                          .get("keys") or [])
              if k.get("provider") == PROVIDER]
        decrypts_before = any(_masked(plain_key, k.get("masked_key") or "")
                              for k in k1)
        out["before_restart"] = {"keys_http": keys1["http"],
                                 "openrouter_keys": len(k1),
                                 "decrypts": decrypts_before}
        out["assertions"]["J2.byok-add-product-path"] = bool(
            out["store_key"]["http"] == 200
            and out["store_key"]["success"] and decrypts_before)
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
        k2 = [k for k in (((keys2["json"] or {}).get("data") or {})
                          .get("keys") or [])
              if k.get("provider") == PROVIDER]
        decrypts_after = any(_masked(plain_key, k.get("masked_key") or "")
                             for k in k2)
        out["after_restart"] = {"keys_http": keys2["http"],
                                "openrouter_keys": len(k2),
                                "decrypts": decrypts_after}
        out["assertions"]["J2.byok-survive-restart"] = bool(
            restart.get("booted") and k2 and decrypts_after)
    except Exception as exc:  # noqa: BLE001
        out["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        # Same teardown guard as world A: record, never mask or discard.
        try:
            out["uvicorn_log_tail"] = server.log_tail()
            server.stop()
        except Exception as teardown_exc:  # noqa: BLE001
            out["teardown_error"] = (
                f"{type(teardown_exc).__name__}: {teardown_exc}")
        out["assertion_states"] = {
            k: ("verified" if v is True else "failed" if v is False
                else "untested")
            for k, v in out["assertions"].items()}
    return out


def _crashed_world(name: str, expected, error: str) -> dict:
    """A world whose harness crashed BEFORE/OUTSIDE its own try block
    (ScratchServer construction, export materialization, teardown that
    escaped the guarded finally) is recorded with EVERY mandatory
    assertion UNTESTED: the crash fails the verdict and the record names
    what was never demonstrated — it never vanishes from the evidence."""
    return {"world": name, "error": error,
            "assertions": {k: None for k in expected},
            "assertion_states": {k: "untested" for k in expected}}


def combine_verdict(world_a: dict, world_b: dict) -> dict:
    """The run's combined verdict over BOTH worlds (pure — no I/O).

    Mandatory = every expected id of both worlds PLUS anything either
    world actually produced (a produced assertion dropped from the
    mandatory set could never be allowed to silently de-gate). Delegates
    the fail-closed aggregate to journey_runtime.aggregate_verdict: only
    an explicit True on EVERY mandatory id passes; missing/None read as
    untested, False as failed — silence never reads as success.
    """
    assertions: dict = {}
    for block, expected in ((world_a, EXPECTED_A), (world_b, EXPECTED_B)):
        block_assertions = block.get("assertions") or {}
        for key in expected:
            assertions[key] = block_assertions.get(key)
        for key, val in block_assertions.items():
            assertions.setdefault(key, val)
    mandatory = list(dict.fromkeys(
        list(EXPECTED_A) + list(EXPECTED_B) + list(assertions)))
    verdict = JR.aggregate_verdict(mandatory, assertions)
    return {"assertions": assertions, **verdict}


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
    try:
        a = world_a_local(args.model, server_kwargs=server_kwargs)
    except Exception as exc:  # noqa: BLE001 — a harness crash is a failed
        # world, never a dead run: world B still executes and evidence
        # still lands, with every world-A criterion UNTESTED.
        a = _crashed_world("A_local_inference", EXPECTED_A,
                           f"harness crash: {type(exc).__name__}: {exc}")
    ev["world_a"] = a
    try:
        b = world_b_byok(creds[CRED_NAME], server_kwargs=server_kwargs)
    except Exception as exc:  # noqa: BLE001
        b = _crashed_world("B_byok_product_path", EXPECTED_B,
                           f"harness crash: {type(exc).__name__}: {exc}")
    ev["world_b"] = b
    ev["identity"] = a.get("identity") or b.get("identity")

    combined = combine_verdict(a, b)
    ev["criteria"] = dict(CRITERIA)
    ev["assertions"] = combined["assertions"]
    ev["assertion_states"] = combined["states"]
    ev["mandatory_unmet"] = combined["unmet"]
    ev["pass"] = combined["pass"]
    ev["uvicorn_log_tail"] = None  # per-world tails already recorded
    if ollama_proc is not None:
        ollama_proc.terminate()
    out = JR.save_result("j2_model_setup", ev)
    print(json.dumps({"assertions": combined["assertions"],
                      "assertion_states": combined["states"],
                      "mandatory_unmet": combined["unmet"],
                      "pass": combined["pass"]}, indent=1))
    print(f"evidence: {out}")
    return 0 if combined["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
