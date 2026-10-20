#!/usr/bin/env python3
"""L1/S6 served-preview verification — unchanged candidate b96dec60a.

Owner work order (2026-10-18): launch the unchanged candidate in an
isolated scratch preview; declare configuration BEFORE the attempt;
exercise the ORIGINAL S6 request through authenticated HTTP with the
real planning configuration (no forced decline); wait for the turn to
SETTLE (including the designed async continuation); inspect the complete
result; preserve every attempt.

Isolation: fresh ports; interpreter by absolute path (the pilot's own
venv, the tested dependency environment) while cwd resolves the
CANDIDATE code; DATABASE_URL/ATOM_DATA_DIR/LANCEDB_URI/BYOK files point
into a fresh scratch dir; the live dev DB is hashed before/after and must
be untouched; the pilot is never contacted. No live .env or vault is
copied wholesale — attempt 2 may reference ONE credential
(DEEPSEEK_API_KEY) by name from the operator env, never logged or
written into the world.

Usage:
  L1_ATTEMPT=2 L1_DEEPSEEK_CRED=1 python3 run_served_preview.py

Writes, next to this script:
  attempt{N}_config.json   (predeclared, before launch)
  attempt{N}_server.log    (server stdout/stderr)
  attempt{N}_result.json   (observed values + classification)
"""
from __future__ import annotations

import hashlib
import json
import os
import signal
import sqlite3
import subprocess
import sys
import time
import uuid
from pathlib import Path

import httpx

HERE = Path(__file__).resolve().parent
CAND = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "reask-current-artifact")
CAND_BACKEND = CAND / "backend"
PY = Path("/Users/rushiparikh/projects/atom/backend/venv314/bin/python")
SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "reask-fix/scratch/l1-s6-preview")
PORT = 8093
BASE = f"http://127.0.0.1:{PORT}"
LIVE_DB = Path("/Users/rushiparikh/projects/atom/backend/data/atom.db")
MAIN_ENV = Path("/Users/rushiparikh/projects/atom/backend/.env")

ATTEMPT = os.environ.get("L1_ATTEMPT", "4")
USE_OPENROUTER = os.environ.get("L1_OPENROUTER_CRED") == "1"
PLAN_PIN = os.environ.get(
    "L1_PLAN_PIN", "openrouter/deepseek/deepseek-v4-pro")

S6_ASK = "Please also update the payment terms in the draft to Net 45."
CANVAS_TITLE = "Quotation Q-2026-114 (DRAFT)"
CANVAS_BODY = (
    "# Quotation Q-2026-114 (DRAFT)\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 45\n"
    "Valid until: 2026-12-31\n")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def env_value_from_main_env(name: str):
    """Read ONE named value from the operator env file without logging it."""
    if not MAIN_ENV.exists():
        return None
    for line in MAIN_ENV.read_text().splitlines():
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip()
    return None


def declared_env():
    data = SCRATCH / "data"
    data.mkdir(parents=True, exist_ok=True)
    env = {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
        "HOME": os.environ.get("HOME", "/tmp"),
        "LANG": "en_US.UTF-8",
        "PYTHONDONTWRITEBYTECODE": "1",
        # --- isolated writable stores -----------------------------------
        "DATABASE_URL": f"sqlite:///{SCRATCH}/atom.db",
        "ATOM_DATA_DIR": str(data),
        "LANCEDB_URI": str(SCRATCH / "atom_memory"),
        "BYOK_CONFIG_FILE": str(SCRATCH / "byok_config.json"),
        "BYOK_KEYS_FILE": str(SCRATCH / "byok_keys.json"),
        # --- declared behavior flags (same as pilot .env) ---------------
        "CHAT_FINALIZATION_M1": "1",
        "CHAT_FINALIZATION_M2": "1",
        "ATOM_TASK_LIFECYCLE_ENABLED": "1",
        "ENABLE_SCHEDULER": "false",
        "ENABLE_INGESTION_SYNC": "false",
        "ENVIRONMENT": "development",
        "ALLOW_DEV_TEMP_USERS": "true",
        # --- declared real planning configuration -----------------------
        "ATOM_PROVIDER": "ollama",
        "ATOM_DEFAULT_MODEL": "llama3.1:8b",
        "PREFERRED_PROVIDER": "ollama",
        "OLLAMA_BASE_URL": "http://127.0.0.1:11434/v1",
        "OLLAMA_MODELS": "llama3.1:8b",
        "OLLAMA_LOAD_TIMEOUT": "15m",
        "ATOM_PROVIDER_MODEL_CATALOG_PATH": "",
    }
    creds_declared = []
    if USE_OPENROUTER:
        key = env_value_from_main_env("OPENROUTER_API_KEY")
        if key:
            env["OPENROUTER_API_KEY"] = key
            env["ATOM_ASYNC_EDIT_PLAN_MODEL"] = PLAN_PIN
            creds_declared.append({
                "name": "OPENROUTER_API_KEY",
                "source": "operator backend/.env, by name at launch",
                "value_recorded": False,
                "scope": "edit planning only "
                         "(ATOM_ASYNC_EDIT_PLAN_MODEL pin, deepseek-v4-pro)",
            })
    return env, creds_declared


def pilot_flags():
    flags = {}
    if MAIN_ENV.exists():
        for line in MAIN_ENV.read_text().splitlines():
            for key in ("CHAT_FINALIZATION_M1", "CHAT_FINALIZATION_M2",
                        "ATOM_TASK_LIFECYCLE_ENABLED"):
                if line.startswith(f"{key}="):
                    flags[key] = line.split("=", 1)[1].strip()
    return flags


def get_history(session_id, auth, uid):
    r = httpx.get(f"{BASE}/api/chat/history/{session_id}", headers=auth,
                  params={"user_id": uid}, timeout=60, trust_env=False)
    try:
        j = r.json()
    except Exception:
        j = {}
    entries = j.get("messages") or []
    served = None
    for entry in entries:
        if entry.get("role") == "assistant":
            served = entry.get("response") or {}
    return {"http": r.status_code, "assistant_response": served}


def main() -> int:
    stamp = time.strftime("%Y-%m-%dT%H:%M:%S")
    env, creds_declared = declared_env()
    cfg = {
        "attempt": ATTEMPT,
        "declared_at": stamp,
        "candidate": {
            "commit": run(["git", "-C", str(CAND), "rev-parse",
                           "HEAD"]).stdout.strip(),
            "branch": run(["git", "-C", str(CAND), "rev-parse",
                           "--abbrev-ref", "HEAD"]).stdout.strip(),
            "tree_clean": not run(["git", "-C", str(CAND), "status",
                                   "--porcelain"]).stdout.strip(),
            "source_sha256_chat_canvas_editor": sha256_file(
                CAND_BACKEND / "core" / "chat_canvas_editor.py"),
        },
        "interpreter": {
            "absolute_path": str(PY),
            "version": run([str(PY), "--version"]).stdout.strip(),
        },
        "ports": {"backend": PORT, "frontend": None},
        "isolation": {
            "cwd": str(CAND_BACKEND),
            "scratch_dir": str(SCRATCH),
            "database_url": f"sqlite:///{SCRATCH}/atom.db",
            "stores": ["DATABASE_URL", "ATOM_DATA_DIR", "LANCEDB_URI",
                       "BYOK_CONFIG_FILE", "BYOK_KEYS_FILE"],
            "live_env_copied_wholesale": False,
            "credential_vault_copied": False,
        },
        "flags": {
            "declared": {
                "CHAT_FINALIZATION_M1": "1",
                "CHAT_FINALIZATION_M2": "1",
                "ATOM_TASK_LIFECYCLE_ENABLED": "1",
            },
            "pilot_effective_from_main_env": pilot_flags(),
        },
        "model": {
            "provider": "ollama",
            "model": "llama3.1:8b",
            "base_url": "http://127.0.0.1:11434/v1",
            "edit_plan_pin": (PLAN_PIN if USE_OPENROUTER else None),
            "forced_decline_seam": False,
            "credentials": creds_declared,
        },
        "live_db_guard": {
            "path": str(LIVE_DB),
            "sha256_before": sha256_file(LIVE_DB) if LIVE_DB.exists() else None,
            "mtime_before": LIVE_DB.stat().st_mtime if LIVE_DB.exists() else None,
        },
    }
    cfg["flags"]["same_as_pilot"] = (
        cfg["flags"]["declared"] == cfg["flags"]["pilot_effective_from_main_env"])
    (HERE / f"attempt{ATTEMPT}_config.json").write_text(
        json.dumps(cfg, indent=2, sort_keys=True))

    SCRATCH.mkdir(parents=True, exist_ok=True)
    freeze = run([str(PY), "-m", "pip", "freeze"])
    (HERE / f"attempt{ATTEMPT}_interpreter_freeze.txt").write_text(freeze.stdout)

    result = {"declared_config": cfg, "steps": {}}
    db_file = SCRATCH / "atom.db"
    if db_file.exists():
        db_file.unlink()
    server_log_path = HERE / f"attempt{ATTEMPT}_server.log"
    log = server_log_path.open("w")
    proc = subprocess.Popen(
        [str(PY), "-m", "uvicorn", "main_api_app:app",
         "--host", "127.0.0.1", "--port", str(PORT),
         "--timeout-keep-alive", "75"],
        cwd=str(CAND_BACKEND), env=env, stdout=log, stderr=subprocess.STDOUT)
    result["steps"]["launch"] = {"pid": proc.pid, "cwd": str(CAND_BACKEND)}

    def finish_result():
        if LIVE_DB.exists() and "live_db_guard_after" not in result:
            mtime_after = LIVE_DB.stat().st_mtime
            hash_after = sha256_file(LIVE_DB)
            result["live_db_guard_after"] = {
                "sha256": hash_after,
                "mtime": mtime_after,
                "unchanged": (
                    hash_after == cfg["live_db_guard"]["sha256_before"]
                    and mtime_after
                    == cfg["live_db_guard"]["mtime_before"]),
            }
        (HERE / f"attempt{ATTEMPT}_result.json").write_text(
            json.dumps(result, indent=2, sort_keys=True, default=str))
        print(json.dumps({
            "attempt": ATTEMPT,
            "classification": result.get("classification"),
            "pass": result.get("pass"),
            "checks": result.get("checks"),
            "initial": (result.get("steps", {}).get("s6_turn") or {}
                        ).get("response", {}).get("message", "")[:200],
            "settled": (result.get("steps", {}).get("settlement") or {}
                        ).get("final_outcome"),
            "settled_message": (result.get("steps", {}).get("settlement") or {}
                                ).get("final_message", "")[:240],
            "runtime_identity": result.get("steps", {}).get(
                "runtime_identity"),
            "live_db_unchanged": (result.get("live_db_guard_after") or {}
                                  ).get("unchanged"),
        }, indent=2))
        return 0 if result.get("pass") else 1

    try:
        health = None
        deadline = time.time() + 240
        while time.time() < deadline:
            if proc.poll() is not None:
                break
            try:
                r = httpx.get(f"{BASE}/api/health", timeout=5,
                              trust_env=False)
                if r.status_code == 200:
                    health = r.json()
                    break
            except Exception:
                pass
            time.sleep(2)
        result["steps"]["health"] = health
        if not health:
            result["classification"] = "server_not_healthy"
            result["pass"] = False
            return finish_result()

        identity = health.get("identity") or {}
        result["steps"]["runtime_identity"] = {
            "cwd": identity.get("cwd"),
            "git_commit": identity.get("git_commit"),
            "dirty": identity.get("dirty"),
            "source_id": identity.get("source_id"),
            "candidate_cwd_ok": str(identity.get("cwd") or "") == str(
                CAND_BACKEND),
            "candidate_commit_ok": str(
                identity.get("git_commit") or "").startswith(
                cfg["candidate"]["commit"][:12]),
        }

        email = f"l1s6_{uuid.uuid4().hex[:10]}@example.com"
        password = "L1s6-" + uuid.uuid4().hex[:12] + "A1"
        reg = httpx.post(f"{BASE}/api/auth/register",
                         json={"email": email, "password": password,
                               "first_name": "L1", "last_name": "S6"},
                         timeout=60, trust_env=False)
        result["steps"]["register"] = {"http": reg.status_code}
        tok = reg.json().get("access_token") if reg.status_code == 200 else None
        if not tok:
            lg = httpx.post(f"{BASE}/api/auth/login",
                            json={"email": email, "username": email,
                                  "password": password},
                            timeout=60, trust_env=False)
            tok = lg.json().get("access_token") if lg.status_code == 200 else None
            result["steps"]["login_fallback"] = {"http": lg.status_code}
        if not tok:
            result["classification"] = "auth_failed"
            result["pass"] = False
            return finish_result()
        auth = {"Authorization": f"Bearer {tok}"}
        me = httpx.get(f"{BASE}/api/auth/me", headers=auth, timeout=30,
                       trust_env=False).json()
        uid = me.get("id")
        result["steps"]["user"] = {"id": uid,
                                   "workspace_id": me.get("workspace_id")}

        # --- activate the local runtime through the PRODUCT (tested path) --
        act = httpx.post(f"{BASE}/api/ai/providers/ollama/keys", headers=auth,
                         json={"api_key": "ollama-local-runtime",
                               "key_name": "default",
                               "environment": "production",
                               "label": "Ollama (local)"},
                         timeout=60, trust_env=False)
        providers = httpx.get(f"{BASE}/api/ai/providers", headers=auth,
                              timeout=60, trust_env=False)
        try:
            providers_json = providers.json()
        except Exception:
            providers_json = {}
        ollama_state = None
        for p in (((providers_json.get("data") or {}).get("providers"))
                  or []):
            if (p.get("provider") or {}).get("id") == "ollama":
                ollama_state = p
        result["steps"]["local_runtime_activation"] = {
            "store_http": act.status_code,
            "providers_http": providers.status_code,
            "ollama": ollama_state,
        }

        # --- the documented tested EDIT-PLANNING pin, registered as ONE
        # credential through the product (never the vault wholesale) -----
        if USE_OPENROUTER:
            okey = env_value_from_main_env("OPENROUTER_API_KEY")
            openrouter_act = None
            if okey:
                oact = httpx.post(
                    f"{BASE}/api/ai/providers/openrouter/keys", headers=auth,
                    json={"api_key": okey, "key_name": "default",
                          "environment": "production",
                          "label": "OpenRouter (edit-planning pin)"},
                    timeout=60, trust_env=False)
                openrouter_act = {"store_http": oact.status_code}
            providers2 = httpx.get(f"{BASE}/api/ai/providers", headers=auth,
                                   timeout=60, trust_env=False)
            try:
                pj2 = providers2.json()
            except Exception:
                pj2 = {}
            or_state = None
            for p in (((pj2.get("data") or {}).get("providers")) or []):
                if (p.get("provider") or {}).get("id") == "openrouter":
                    or_state = p
            result["steps"]["openrouter_activation"] = {
                "credential_source": "operator backend/.env, by name, "
                                     "value never recorded",
                "pin": PLAN_PIN,
                **(openrouter_act or {}),
                "openrouter": or_state,
            }

        up = httpx.post(f"{BASE}/api/canvas", headers=auth,
                        json={"title": CANVAS_TITLE,
                              "canvas_type": "document"},
                        timeout=60, trust_env=False)
        cid = up.json().get("canvas_id")
        result["steps"]["canvas"] = {"create_http": up.status_code,
                                     "canvas_id": cid}
        if up.status_code != 200 or not cid:
            result["classification"] = "canvas_create_failed"
            result["pass"] = False
            return finish_result()
        put = httpx.put(f"{BASE}/api/canvas/{cid}", headers=auth,
                        json=CANVAS_BODY, timeout=60, trust_env=False)
        result["steps"]["canvas"]["seed_http"] = put.status_code
        got = httpx.get(f"{BASE}/api/canvas/{cid}", headers=auth,
                        timeout=60, trust_env=False).json()
        content = got.get("content")
        body_view = ((content or {}).get("content")
                     if isinstance(content, dict) else content)
        if not isinstance(body_view, str):
            body_view = json.dumps(content)[:4000]
        result["steps"]["canvas"]["seeded_has_terms_net45"] = (
            "Terms: Net 45" in body_view)

        db_path = str(db_file)

        def audits():
            con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
            try:
                rows = con.execute(
                    "SELECT id, action_type, created_at FROM canvas_audit "
                    "WHERE canvas_id=? ORDER BY created_at, rowid",
                    (cid,)).fetchall()
            finally:
                con.close()
            return [(str(r[0])[:12], r[1], r[2]) for r in rows]

        def read_rows(session_id):
            con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
            try:
                rows = con.execute(
                    "SELECT role, content, metadata_json FROM chat_messages "
                    "WHERE conversation_id=? ORDER BY rowid",
                    (session_id,)).fetchall()
            finally:
                con.close()
            out = []
            for role, content_txt, meta_raw in rows:
                try:
                    meta = json.loads(meta_raw or "{}")
                except Exception:
                    meta = {}
                out.append({"role": role, "content": str(content_txt)[:400],
                            "meta_outcome": meta.get("outcome"),
                            "meta_success": meta.get("success")})
            return out

        before = audits()
        result["steps"]["audits_before"] = {"count": len(before),
                                            "rows": before}
        if not result["steps"]["canvas"]["seeded_has_terms_net45"]:
            result["classification"] = "seed_failed"
            result["pass"] = False
            return finish_result()

        # --- the ORIGINAL S6 request through authenticated HTTP ---------
        session_id = str(uuid.uuid4())
        t0 = time.monotonic()
        chat = httpx.post(f"{BASE}/api/chat/message", headers=auth,
                          json={"message": S6_ASK, "session_id": session_id,
                                "user_id": uid,
                                "context": {"canvas_id": cid}},
                          timeout=900, trust_env=False)
        latency = time.monotonic() - t0
        try:
            chat_json = chat.json()
        except Exception:
            chat_json = {"_raw": chat.text[:4000]}
        result["steps"]["s6_turn"] = {
            "http": chat.status_code, "latency_s": round(latency, 2),
            "response": chat_json,
        }

        # --- wait for settlement (async continuation is a designed path)
        polls = []
        final = None
        deadline = time.time() + 460
        while time.time() < deadline:
            hist = get_history(session_id, auth, uid)
            served = hist.get("assistant_response") or {}
            polls.append({"t": round(time.time() - t0, 1),
                          "outcome": served.get("outcome"),
                          "success": served.get("success")})
            if served.get("outcome") not in (None, "unconfirmed"):
                final = served
                break
            if proc.poll() is not None:
                break
            time.sleep(10)
        if final is None:
            hist = get_history(session_id, auth, uid)
            final = hist.get("assistant_response") or {}
        result["steps"]["settlement"] = {
            "polls": polls,
            "final_outcome": final.get("outcome"),
            "final_success": final.get("success"),
            "final_message": str(final.get("message") or "")[:800],
            "final_error_code": final.get("error_code"),
        }

        after = audits()
        result["steps"]["audits_after"] = {"count": len(after),
                                           "rows": after}
        got2 = httpx.get(f"{BASE}/api/canvas/{cid}", headers=auth,
                         timeout=60, trust_env=False).json()
        content2 = got2.get("content")
        body2 = ((content2 or {}).get("content")
                 if isinstance(content2, dict) else content2)
        if not isinstance(body2, str):
            body2 = json.dumps(content2)[:4000]
        result["steps"]["body_after"] = body2[:4000]
        result["steps"]["body_unchanged"] = (body2 == body_view)

        rows_final = read_rows(session_id)
        result["steps"]["persisted_rows"] = rows_final
        assistant_rows = [m for m in rows_final if m["role"] == "assistant"]
        last_meta = assistant_rows[-1] if assistant_rows else {}

        initial_resp = chat_json if isinstance(chat_json, dict) else {}
        initial_edit = ((initial_resp.get("data") or {}).get("canvas_edit")
                        or {})
        settled_msg = str(final.get("message") or "")
        settled_outcome = final.get("outcome")
        checks = {
            "zero_additional_writes": len(after) == len(before),
            "body_unchanged_and_holds_net45": (
                body2 == body_view and "Terms: Net 45" in body2),
            "noop_receipt_evidenced": bool(
                initial_edit.get("noop")
                or (settled_outcome == "completed"
                    and "Verified on the current draft" in settled_msg)),
            "receipt_derived_reply": (
                "Verified on the current draft" in settled_msg
                and "nothing was sent" in settled_msg),
            "success_true": final.get("success") is True,
            "outcome_completed": settled_outcome == "completed",
            "persisted_matches": (
                last_meta.get("meta_outcome") == settled_outcome
                and last_meta.get("meta_success") == final.get("success")),
        }
        result["checks"] = checks
        result["pass"] = all(checks.values())
        if result["pass"]:
            result["classification"] = "verified_noop_completed"
        elif len(after) != len(before) or body2 != body_view:
            result["classification"] = "planner_proposed_redundant_edit"
        elif settled_outcome == "unconfirmed":
            result["classification"] = "turntray_unconfirmed_after_wait"
        else:
            result["classification"] = "settled_non_completed"
        return finish_result()
    finally:
        try:
            if proc.poll() is None:
                proc.send_signal(signal.SIGTERM)
                try:
                    proc.wait(timeout=30)
                except subprocess.TimeoutExpired:
                    proc.kill()
        except Exception:
            pass
        try:
            log.close()
        except Exception:
            pass


if __name__ == "__main__":
    sys.exit(main())
