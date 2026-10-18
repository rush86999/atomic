#!/usr/bin/env python3
"""L3 served acceptance attempt 1 — candidate 6d662abff (L3 document-
evidence repair), PREDECLARED configuration:

  * pilot cloud route: OPENCODE_BASE_URL=https://opencode.ai/zen/go/v1
    (the F-R1 finding's planner class; no Go inference URL needed here),
  * ONE authorized operator/global vault credential (opencode-go) registered
    through the scratch product API — value never logged or recorded,
  * local fastembed embeddings (pilot parity), pilot-matching flags,
  * fresh port 8094; scratch DB/LanceDB/BYOK stores only; live dev DB
    hash+mtime guarded; pilot :8001/:3000 untouched.

The job: fresh user -> fixture uploaded through the product's own
/api/documents/upload -> the ORIGINAL Zephyr-9 request unchanged, with real
planning. Checks (first failure = the first broken transition):
upload_through_product, planner_dispatch_real, documents_receipt_executed,
receipt_verified_complete_coverage, receipt_bound_to_current_request,
objective_met_true, answer_contains_code, successful_response,
history_nonnull_agreement. One attempt; no mid-run repairs.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
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
    "l3-doc-evidence")
CAND_BACKEND = CAND / "backend"
PY = Path("/Users/rushiparikh/projects/atom/backend/venv314/bin/python")
SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l3-fix/scratch/l3-document-evidence-served")
PORT = 8094
BASE = f"http://127.0.0.1:{PORT}"
LIVE_DB = Path("/Users/rushiparikh/projects/atom/backend/data/atom.db")
MAIN_ENV = Path("/Users/rushiparikh/projects/atom/backend/.env")

ATTEMPT = "1"
CANDIDATE_SHA = "6d662abfffc2d9e42ab209cf68521e4933edcf27"

ASK = ("search my uploaded documents for the launch code for project "
       "Zephyr-9 and tell me the code")
FIXTURE_NAME = "l3_zephyr9_fixture.txt"
FIXTURE_TEXT = (
    "ATOM PHASE D FIXTURE — internal notes.\n"
    "Project Zephyr-9 launch planning.\n"
    "The launch code for project Zephyr-9 is QUARTZ-77.\n"
    "Owner: R. Parikh. Team: acceptance.\n"
    "Decoy: the archive key for project Halcyon-2 is BASALT-13.\n")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


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


def declared_env():
    data = SCRATCH / "data"
    data.mkdir(parents=True, exist_ok=True)
    return {
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
        "BYOK_ENC_KEY_FILE": str(SCRATCH / "byok_encryption_key"),
        # --- declared behavior flags (same as pilot) --------------------
        "CHAT_FINALIZATION_M1": "1",
        "CHAT_FINALIZATION_M2": "1",
        "ATOM_TASK_LIFECYCLE_ENABLED": "1",
        "ENABLE_SCHEDULER": "false",
        "ENABLE_INGESTION_SYNC": "false",
        "ENVIRONMENT": "development",
        "ALLOW_DEV_TEMP_USERS": "true",
        # --- embeddings (pilot parity; local, no extra credential) ------
        "EMBEDDING_PROVIDER": "fastembed",
        "FASTEMBED_MODEL": "BAAI/bge-small-en-v1.5",
        "EMBEDDING_DIM": "384",
        # --- declared provider route: THE PILOT'S CLOUD ROUTE -----------
        "OPENCODE_BASE_URL": "https://opencode.ai/zen/go/v1",
    }


def main() -> int:
    stamp = time.strftime("%Y-%m-%dT%H:%M:%S")
    env = declared_env()
    if run(["git", "-C", str(CAND), "rev-parse", "HEAD"]).stdout.strip() \
            != CANDIDATE_SHA:
        raise RuntimeError("candidate identity mismatch; no launch")
    if run(["git", "-C", str(CAND), "status", "--porcelain"]).stdout.strip():
        raise RuntimeError("candidate dirty; no launch")
    import socket
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", PORT)) == 0:
            raise RuntimeError("acceptance port occupied; no launch")

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
            "parent": "aaa1169d7dc1a2e511bce9b81c33ee85f58982eb",
            "source_sha256_chat_tool_planner": sha256_file(
                CAND_BACKEND / "core" / "chat_tool_planner.py"),
            "source_sha256_chat_orchestrator": sha256_file(
                CAND_BACKEND / "integrations" / "chat_orchestrator.py"),
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
        },
        "model": {
            "provider": "opencode-go (only)",
            "cloud_route": "https://opencode.ai/zen/go/v1",
            "planning": "real, unpinned (BPC-ranked); actual dispatch "
                        "recorded from the served log",
            "reply": "real, same provider route",
            "credentials": [{
                "provider": "opencode-go", "key_name": "default",
                "environment": "production",
                "source": "authorized operator/global vault entry",
                "value_recorded": False,
                "vault_copied_wholesale": False,
            }],
        },
        "embeddings": {"provider": "fastembed",
                       "model": "BAAI/bge-small-en-v1.5", "dim": 384},
        "live_db_guard": {
            "path": str(LIVE_DB),
            "sha256_before": sha256_file(LIVE_DB) if LIVE_DB.exists() else None,
            "mtime_before": LIVE_DB.stat().st_mtime if LIVE_DB.exists() else None,
        },
        "job": {"ask": ASK, "fixture": FIXTURE_NAME,
                "upload_route": "POST /api/documents/upload"},
    }
    (HERE / f"attempt{ATTEMPT}_config.json").write_text(
        json.dumps(cfg, indent=2, sort_keys=True))

    SCRATCH.mkdir(parents=True, exist_ok=True)
    freeze = run([str(PY), "-m", "pip", "freeze"])
    (HERE / f"attempt{ATTEMPT}_interpreter_freeze.txt").write_text(freeze.stdout)

    result = {"declared_config": cfg, "steps": {}}
    db_file = SCRATCH / "atom.db"
    if db_file.exists():
        raise RuntimeError("scratch world already exists; refuse reuse")
    server_log_path = HERE / f"attempt{ATTEMPT}_server.log"
    log = server_log_path.open("w")
    os.chmod(server_log_path, 0o600)
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
            "answer_head": (result.get("steps", {}).get("l3_turn") or {}
                            ).get("response", {}).get("message", "")[:220],
            "settled": (result.get("steps", {}).get("settlement") or {}
                        ).get("final_outcome"),
            "settled_message": (result.get("steps", {}).get("settlement") or {}
                                ).get("final_message", "")[:240],
            "receipt": (result.get("steps", {}).get("documents_receipt") or {}
                        ).get("summary"),
            "objective_met": (result.get("steps", {}).get(
                "task_outcome") or {}).get("objective_met"),
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
            "candidate_cwd_ok": str(identity.get("cwd") or "") == str(
                CAND_BACKEND),
            "candidate_commit_ok": str(
                identity.get("git_commit") or "").startswith(
                CANDIDATE_SHA[:12]),
        }
        if not (result["steps"]["runtime_identity"]["candidate_cwd_ok"]
                and result["steps"]["runtime_identity"]["candidate_commit_ok"]):
            result["classification"] = "runtime_identity_mismatch"
            result["pass"] = False
            return finish_result()

        email = f"l3doc_{uuid.uuid4().hex[:10]}@example.com"
        password = "L3doc-" + uuid.uuid4().hex[:12] + "A1"
        reg = httpx.post(f"{BASE}/api/auth/register",
                         json={"email": email, "password": password,
                               "first_name": "L3", "last_name": "Doc"},
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
        ws_id = me.get("workspace_id")
        result["steps"]["user"] = {"id": uid, "workspace_id": ws_id}
        if not uid:
            result["classification"] = "user_resolution_failed"
            result["pass"] = False
            return finish_result()

        # --- ONE authorized operator credential, through the product ----
        from cryptography.fernet import Fernet
        vault = Path(
            "/Users/rushiparikh/projects/atom/backend/data/byok_keys.json")
        enc = Path(
            "/Users/rushiparikh/projects/atom/backend/data/"
            "byok_encryption_key")
        vault_row = json.loads(
            vault.read_text())["keys"]["opencode-go_default_production"]
        assert vault_row.get("provider_id") == "opencode-go"
        assert vault_row.get("key_name") == "default"
        assert vault_row.get("environment") == "production"
        assert vault_row.get("is_active", True) is True
        key = Fernet(enc.read_bytes().strip()).decrypt(
            vault_row["encrypted_key"].encode()).decode()
        assert key, "authorized credential unavailable"
        oact = httpx.post(
            f"{BASE}/api/ai/providers/opencode-go/keys", headers=auth,
            json={"api_key": key, "key_name": "default",
                  "environment": "production",
                  "label": "Authorized L3 acceptance route"},
            timeout=60, trust_env=False)
        result["steps"]["opencode_activation"] = {
            "store_http": oact.status_code,
            "credential_value_recorded": False,
            "route": "https://opencode.ai/zen/go/v1",
        }
        del key, vault_row
        if oact.status_code != 200:
            result["classification"] = (
                "authorized_provider_registration_failed")
            result["pass"] = False
            return finish_result()
        providers = httpx.get(f"{BASE}/api/ai/providers", headers=auth,
                              timeout=60, trust_env=False)
        try:
            pj = providers.json()
        except Exception:
            pj = {}
        state = next(
            (p for p in ((pj.get("data") or {}).get("providers") or [])
             if (p.get("provider") or {}).get("id") == "opencode-go"), None)
        result["steps"]["opencode_activation"]["active"] = bool(
            state and (state.get("status") == "active"
                       or state.get("is_active")
                       or state.get("has_api_key") or state.get("has_keys")))

        # --- the fixture, uploaded through the PRODUCT ------------------
        up = httpx.post(
            f"{BASE}/api/documents/upload", headers=auth,
            files={"file": (FIXTURE_NAME, FIXTURE_TEXT.encode("utf-8"),
                            "text/plain")},
            timeout=300, trust_env=False)
        try:
            up_json = up.json()
        except Exception:
            up_json = {"_raw": up.text[:800]}
        result["steps"]["upload"] = {
            "http": up.status_code,
            "doc_id": up_json.get("id"),
            "title": up_json.get("title"),
            "chunk_count": up_json.get("chunk_count"),
        }

        def ingested_row():
            con = sqlite3.connect(f"file:{db_file}?mode=ro", uri=True)
            try:
                row = con.execute(
                    "SELECT id, file_name, workspace_id, content_preview "
                    "FROM ingested_documents WHERE id=?",
                    (up_json.get("id"),)).fetchone()
            finally:
                con.close()
            return row

        row = ingested_row() if up_json.get("id") else None
        result["steps"]["upload"]["row"] = (
            {"id": row[0], "file_name": row[1], "workspace_id": row[2],
             "preview_has_code": "QUARTZ-77" in str(row[3] or "")}
            if row else None)
        upload_ok = bool(
            up.status_code == 200 and up_json.get("id") and row
            and row[1] == FIXTURE_NAME
            and "QUARTZ-77" in str(row[3] or ""))

        # --- the ORIGINAL request, real planning ------------------------
        session_id = str(uuid.uuid4())
        t0 = time.monotonic()
        chat = httpx.post(f"{BASE}/api/chat/message", headers=auth,
                          json={"message": ASK, "session_id": session_id,
                                "user_id": uid},
                          timeout=900, trust_env=False)
        latency = time.monotonic() - t0
        try:
            chat_json = chat.json()
        except Exception:
            chat_json = {"_raw": chat.text[:4000]}
        result["steps"]["l3_turn"] = {
            "http": chat.status_code, "latency_s": round(latency, 2),
            "response": chat_json,
        }

        # --- settle (async continuation is a designed path) -------------
        polls = []
        final = None
        deadline = time.time() + 600
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

        # --- persisted rows + the authoritative execution record --------
        def read_rows():
            con = sqlite3.connect(f"file:{db_file}?mode=ro", uri=True)
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

        rows_final = read_rows()
        result["steps"]["persisted_rows"] = rows_final
        assistant_rows = [m for m in rows_final if m["role"] == "assistant"]
        last_meta = assistant_rows[-1] if assistant_rows else {}

        def read_task_outcome(execution_id):
            """EXACT lookup (owner harness improvement 2026-10-18): the
            response's own execution_id selects THE row — never a recent
            execution chosen by ordering."""
            if not execution_id:
                return None
            con = sqlite3.connect(f"file:{db_file}?mode=ro", uri=True)
            try:
                row = con.execute(
                    "SELECT id, started_at, metadata_json FROM "
                    "agent_executions WHERE id=?",
                    (str(execution_id),)).fetchone()
            finally:
                con.close()
            if not row:
                return None
            rid, started, meta_raw = row
            try:
                meta = json.loads(meta_raw or "{}")
            except Exception:
                meta = {}
            outcome = meta.get("task_outcome") or {}
            if not isinstance(outcome, dict) or not outcome:
                return None
            return {"execution_row_id": str(rid),
                    "started_at": str(started),
                    "session_id": str(meta.get("session_id") or ""),
                    "user_id": str(meta.get("user_id") or ""),
                    "workspace_id": str(meta.get("workspace_id") or ""),
                    "task_outcome": outcome}

        response_execution_id = str(
            (chat_json or {}).get("execution_id") or "")
        exec_record = read_task_outcome(response_execution_id)
        result["steps"]["task_outcome"] = {
            "response_execution_id": response_execution_id,
            "exact_row_found": bool(exec_record),
            "execution_row_id": (exec_record or {}).get("execution_row_id"),
            "execution_id": ((exec_record or {}).get("task_outcome") or {}
                             ).get("execution_id"),
            "objective_met": ((exec_record or {}).get("task_outcome") or {}
                              ).get("objective_met"),
            "delivery": ((exec_record or {}).get("task_outcome") or {}
                         ).get("delivery"),
        }
        tool_outcomes = ((exec_record or {}).get("task_outcome") or {}
                         ).get("tool_outcomes") or []
        doc_receipts = [t for t in tool_outcomes
                        if str(t.get("tool") or "").startswith("documents")]
        receipt_summary = []
        for t in doc_receipts:
            refs = [r for r in (t.get("evidence_refs") or [])
                    if isinstance(r, dict)]
            receipt_summary.append({
                "tool": t.get("tool"),
                "verified": t.get("verified"),
                "outcome": str(t.get("outcome") or "")[:120],
                "refs": [{"query": str(r.get("query") or "")[:160],
                          "coverage": r.get("coverage"),
                          "match_count": r.get("match_count"),
                          "truncated": r.get("truncated")}
                         for r in refs],
            })
        result["steps"]["documents_receipt"] = {"summary": receipt_summary}

        # --- served-log evidence (real planning + route) ----------------
        try:
            log.flush()
        except Exception:
            pass
        log_text = (HERE / f"attempt{ATTEMPT}_server.log").read_text(
            errors="replace")
        dispatch_models = sorted(set(re.findall(
            r"\[structured-dispatch\] ([^\s]+)", log_text)))
        source_ask_lines = [
            re.sub(r"^\S+\s+\S+\s+", "", ln)[:200]
            for ln in log_text.splitlines()
            if ("source-ask" in ln or "tool planner:" in ln)][-8:]
        zen_posts = log_text.count(
            "POST https://opencode.ai/zen/go/v1/chat/completions")
        go_inference_posts = log_text.count(
            "POST https://opencode.ai/inference/go/openai/v1/chat/completions")
        result["steps"]["intended_vs_actual"] = {
            "declared_route": "https://opencode.ai/zen/go/v1",
            "structured_dispatch_models": dispatch_models,
            "zen_chat_posts": zen_posts,
            "go_inference_chat_posts": go_inference_posts,
            "source_ask_lines": source_ask_lines,
        }

        # --- gates -------------------------------------------------------
        settled_msg = str(final.get("message") or "")
        initial_msg = str(chat_json.get("message") or "")
        settled_outcome = final.get("outcome")
        settled_success = final.get("success")
        initial_resp = chat_json if isinstance(chat_json, dict) else {}
        complete_refs = [
            r for t in doc_receipts
            for r in (t.get("evidence_refs") or [])
            if isinstance(r, dict) and r.get("coverage") == "complete"
            and isinstance(r.get("match_count"), int)
            and not isinstance(r.get("match_count"), bool)
            and r.get("match_count") >= 1]
        exact_row_bound = bool(
            response_execution_id and exec_record
            and str(((exec_record.get("task_outcome") or {})
                     .get("execution_id")) or "") == response_execution_id)
        receipt_queries = [str(r.get("query") or "") for r in complete_refs]
        result["steps"]["documents_receipt"]["exact_binding"] = {
            "response_execution_id": response_execution_id,
            "execution_row_id": (exec_record or {}).get("execution_row_id"),
            "task_outcome_execution_id": (
                (exec_record or {}).get("task_outcome") or {}
            ).get("execution_id"),
            "exact_row_bound": exact_row_bound,
            "receipt_queries": receipt_queries,
        }
        checks = {
            "upload_through_product": upload_ok,
            "planner_dispatch_real": bool(dispatch_models),
            "documents_receipt_executed": bool(
                any(t.get("verified") is True for t in doc_receipts)),
            "receipt_verified_complete_coverage": bool(complete_refs),
            "receipt_bound_to_current_request": exact_row_bound,
            "objective_met_true": (
                ((exec_record or {}).get("task_outcome") or {}
                 ).get("objective_met") is True),
            "answer_contains_code": "quartz-77" in settled_msg.lower()
            or "quartz-77" in initial_msg.lower(),
            "successful_response": bool(
                initial_resp.get("success") is True
                or settled_success is True),
            "history_nonnull_agreement": bool(
                settled_outcome is not None
                and settled_success is not None
                and last_meta.get("meta_outcome") == settled_outcome
                and last_meta.get("meta_success") == settled_success
                and (initial_resp.get("success") in (None, settled_success))),
        }
        result["checks"] = checks
        result["pass"] = all(checks.values())
        order = [
            ("upload_through_product", "upload_failed"),
            ("planner_dispatch_real", "planner_did_not_dispatch"),
            ("documents_receipt_executed", "no_documents_receipt"),
            ("receipt_verified_complete_coverage", "receipt_incomplete"),
            ("receipt_bound_to_current_request", "receipt_not_current_request"),
            ("objective_met_true", "objective_not_met"),
            ("answer_contains_code", "answer_missing_code"),
            ("successful_response", "response_not_success"),
            ("history_nonnull_agreement", "history_disagreement"),
        ]
        if result["pass"]:
            result["classification"] = "verified_document_evidence_completed"
        else:
            result["classification"] = next(
                cls for key, cls in order if not checks.get(key))
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
