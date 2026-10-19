#!/usr/bin/env python3
"""L2 continuation-evidence served acceptance — attempt 1.

Candidate a6cd2c8baecc2976d3c8021861f804117d1aa036 (branch
codex/l2-continuation-evidence; parent ddab120c4, the L3 promotion commit),
served UNCHANGED from its worktree in the predeclared isolated configuration
(PREDECLARED_CONFIG.md, written before this attempt).

Job: fresh user -> approved-records fixture through POST
/api/documents/upload -> draft canvas through POST/PUT /api/canvas -> the
ORIGINAL S3 comparison ask -> the ORIGINAL S7 continuation ask, with real
interpretation and retrieval. One attempt; no mid-run repairs.

The observation hooks are installed by server_observe.py outside the
candidate source; they call the production functions and return their
results unchanged.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import signal
import socket
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
    "l2-continuation-evidence")
CAND_BACKEND = CAND / "backend"
PY = Path("/Users/rushiparikh/projects/atom/backend/venv314/bin/python")
SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-fix/scratch/l2-continuation-served")
PORT = 8095
BASE = f"http://127.0.0.1:{PORT}"
LIVE_DB = Path("/Users/rushiparikh/projects/atom/backend/data/atom.db")
MAIN_ENV = Path("/Users/rushiparikh/projects/atom/backend/.env")
PILOT_BACKEND = "http://127.0.0.1:8001"
PILOT_FRONTEND = "http://127.0.0.1:3000"

ATTEMPT = "1"
CANDIDATE_SHA = "a6cd2c8baecc2976d3c8021861f804117d1aa036"
PARENT_SHA = "ddab120c43333efdc219098cba35fdecd9a0988f"
PRE_DECL = HERE / "PREDECLARED_CONFIG.md"

FIXTURE_NAME = "approved_records_q2026_114.txt"
FIXTURE_TEXT = (
    "APPROVED RECORDS \u2014 Quotation Q-2026-114\n"
    "Source: Sales Operations approved-terms register\n"
    "Client: Dunmore Fabrication LLC\n"
    "Item: CNC press brake, 50-ton\n"
    "Approved unit price: $48,000.00\n"
    "Approved payment terms: Net 30\n"
    "Approved valid until: 2026-12-31\n"
    "Approved by: Sales Operations\n")

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

S3_ASK = (
    "Compare the draft quotation with my uploaded Approved Records document. "
    "Does the Valid Until date in the draft match the approved record? "
    "Flag anything that differs. Do not change anything yet.")
S7_ASK = (
    "What is the current Valid until date on the draft, and does it still "
    "match the approved record?")

SETTLE_TIMEOUT_S = 420
POLL_INTERVAL_S = 5


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def port_open(port: int) -> bool:
    with socket.socket() as probe:
        probe.settimeout(1.0)
        return probe.connect_ex(("127.0.0.1", port)) == 0


def pilot_identity() -> dict:
    out = {"backend_8001_listening": port_open(8001),
           "frontend_3000_listening": port_open(3000)}
    try:
        r = httpx.get(f"{PILOT_BACKEND}/api/health", timeout=5,
                      trust_env=False)
        j = r.json()
        ident = j.get("identity") or {}
        out["health_http"] = r.status_code
        out["identity"] = {
            k: ident.get(k) for k in
            ("git_commit", "instance_id", "pid", "started_at", "cwd",
             "database", "source_id", "revision")
        }
    except Exception as exc:  # noqa: BLE001
        out["health_error"] = repr(exc)
    return out


def declared_env() -> dict:
    data = SCRATCH / "data"
    data.mkdir(parents=True, exist_ok=True)
    return {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
        "HOME": os.environ.get("HOME", "/tmp"),
        "LANG": "en_US.UTF-8",
        "PYTHONDONTWRITEBYTECODE": "1",
        # isolated writable stores
        "DATABASE_URL": f"sqlite:///{SCRATCH}/atom.db",
        "ATOM_DATA_DIR": str(data),
        "LANCEDB_URI": str(SCRATCH / "atom_memory"),
        "LANCEDB_URI_BASE": str(SCRATCH / "atom_memory"),
        "BYOK_CONFIG_FILE": str(SCRATCH / "byok_config.json"),
        "BYOK_KEYS_FILE": str(SCRATCH / "byok_keys.json"),
        "BYOK_ENC_KEY_FILE": str(SCRATCH / "byok_encryption_key"),
        # declared behavior flags (same as pilot)
        "CHAT_FINALIZATION_M1": "1",
        "CHAT_FINALIZATION_M2": "1",
        "ATOM_TASK_LIFECYCLE_ENABLED": "1",
        "ATOM_TURN_DECISION_ROUTING": "1",
        "ATOM_TURN_INTERPRETATION": "1",
        "ENABLE_SCHEDULER": "false",
        "ENABLE_INGESTION_SYNC": "false",
        "ENVIRONMENT": "development",
        "ALLOW_DEV_TEMP_USERS": "true",
        # embeddings (pilot parity, local)
        "EMBEDDING_PROVIDER": "fastembed",
        "FASTEMBED_MODEL": "BAAI/bge-small-en-v1.5",
        "EMBEDDING_DIM": "384",
        # declared provider route: THE PILOT'S CLOUD ROUTE
        "OPENCODE_BASE_URL": "https://opencode.ai/zen/go/v1",
        # observation launcher
        "L2_CAND_BACKEND": str(CAND_BACKEND),
        "L2_PORT": str(PORT),
        "L2_OBSERVATION_LOG": str(HERE / f"attempt{ATTEMPT}_observation.jsonl"),
    }


def read_history(session_id: str, auth: dict, uid: str) -> dict:
    r = httpx.get(f"{BASE}/api/chat/history/{session_id}", headers=auth,
                  params={"user_id": uid}, timeout=60, trust_env=False)
    try:
        j = r.json()
    except Exception:
        j = {}
    entries = j.get("messages") or []
    assistants = [e for e in entries if e.get("role") == "assistant"]
    return {
        "http": r.status_code,
        "assistant_count": len(assistants),
        "assistant_entries": [
            {"response": e.get("response") or {},
             "created_at": e.get("created_at") or e.get("timestamp")}
            for e in assistants],
        "assistant_response": (assistants[-1].get("response") or {}
                               if assistants else {}),
    }


def poll_settlement(session_id: str, auth: dict, uid: str, t0: float,
                    proc) -> tuple[dict, list]:
    polls = []
    final = None
    deadline = time.time() + SETTLE_TIMEOUT_S
    while time.time() < deadline:
        hist = read_history(session_id, auth, uid)
        served = hist.get("assistant_response") or {}
        polls.append({
            "t": round(time.time() - t0, 1),
            "http": hist.get("http"),
            "assistant_count": hist.get("assistant_count"),
            "outcome": served.get("outcome"),
            "success": served.get("success"),
            "error_code": served.get("error_code"),
            "execution_id": served.get("execution_id"),
        })
        if served.get("outcome") not in (None, "unconfirmed") \
                and served.get("success") is not None:
            final = served
            break
        if proc.poll() is not None:
            break
        time.sleep(POLL_INTERVAL_S)
    if final is None:
        hist = read_history(session_id, auth, uid)
        final = hist.get("assistant_response") or {}
    return final, polls


def canvas_body(raw: dict) -> str:
    content = (raw or {}).get("content")
    if isinstance(content, dict):
        value = content.get("content")
        return value if isinstance(value, str) else json.dumps(
            content, sort_keys=True)
    if isinstance(content, str):
        return content
    return json.dumps(content, sort_keys=True) if content is not None else ""


def parse_meta(raw):
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw or "{}")
    except Exception:
        return {}


def db_read_rows(db_path: Path, query: str, params=()) -> list:
    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        return con.execute(query, params).fetchall()
    finally:
        con.close()


def audits(db_path: Path, canvas_id: str) -> list:
    rows = db_read_rows(
        db_path,
        "SELECT id, action_type, created_at FROM canvas_audit "
        "WHERE canvas_id=? ORDER BY created_at, rowid", (canvas_id,))
    return [{"id": str(r[0]), "action_type": r[1],
             "created_at": str(r[2])} for r in rows]


def persisted_rows(db_path: Path, session_id: str) -> list:
    rows = db_read_rows(
        db_path,
        "SELECT role, content, metadata_json FROM chat_messages "
        "WHERE conversation_id=? ORDER BY rowid", (session_id,))
    out = []
    for role, content, raw in rows:
        meta = parse_meta(raw)
        out.append({
            "role": role,
            "content": str(content or "")[:1200],
            "meta_outcome": meta.get("outcome"),
            "meta_success": meta.get("success"),
            "meta_error_code": meta.get("error_code"),
            "meta_execution_id": meta.get("execution_id"),
            "meta_keys": sorted(meta.keys()),
            "turn_decision_refs": (
                (meta.get("turn_decision") or {}).get("references")
                if isinstance(meta.get("turn_decision"), dict) else None),
        })
    return out


def execution_record(db_path: Path, execution_id: str) -> dict | None:
    if not execution_id:
        return None
    rows = db_read_rows(
        db_path,
        "SELECT id, started_at, completed_at, status, metadata_json "
        "FROM agent_executions WHERE id=?", (str(execution_id),))
    if not rows:
        return None
    rid, started, completed, status, raw = rows[0]
    meta = parse_meta(raw)
    outcome = meta.get("task_outcome") or {}
    return {
        "row_id": str(rid),
        "started_at": str(started),
        "completed_at": str(completed),
        "status": status,
        "session_id": str(meta.get("session_id") or ""),
        "user_id": str(meta.get("user_id") or ""),
        "workspace_id": str(meta.get("workspace_id") or ""),
        "task_outcome": outcome,
    }


def task_summary(rec: dict | None) -> dict:
    outcome = (rec or {}).get("task_outcome") or {}
    delivery = outcome.get("delivery") or {}
    criteria = outcome.get("criterion_results") or []
    tool_outcomes = outcome.get("tool_outcomes") or []
    context_tools = [t for t in tool_outcomes
                     if str(t.get("tool") or "") == "context_assembly"]
    return {
        "row_id": (rec or {}).get("row_id"),
        "status": (rec or {}).get("status"),
        "session_id": (rec or {}).get("session_id"),
        "user_id": (rec or {}).get("user_id"),
        "workspace_id": (rec or {}).get("workspace_id"),
        "execution_id": outcome.get("execution_id"),
        "objective": outcome.get("objective"),
        "objective_met": outcome.get("objective_met"),
        "delivery": delivery,
        "delivered": delivery.get("delivered"),
        "criterion_results": criteria,
        "context_assembly_tool_outcomes": context_tools,
        "tool_outcomes": tool_outcomes,
        "evidence_refs": outcome.get("evidence_refs"),
        "limitations": outcome.get("limitations"),
        "gaps": outcome.get("gaps"),
        "failure": outcome.get("failure"),
        "success_kinds": outcome.get("success_kinds"),
        "scope": outcome.get("scope"),
        "requested": outcome.get("requested"),
        "source_constraints": outcome.get("source_constraints"),
    }


def load_events(path: Path) -> list:
    events = []
    if not path.exists():
        return events
    for line in path.read_text(errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            events.append(json.loads(line))
        except Exception:
            continue
    return events


def events_for_request(events: list, request_id: str) -> list:
    out = []
    for e in events:
        interp = e.get("interpretation")
        if isinstance(interp, dict) and interp.get("request_id") == request_id:
            out.append(e)
            continue
        if e.get("request_id") == request_id:
            out.append(e)
    return out


def first_event(events: list, kind: str) -> dict | None:
    for e in events:
        if e.get("event") == kind:
            return e
    return None


def last_event(events: list, kind: str) -> dict | None:
    for e in reversed(events):
        if e.get("event") == kind:
            return e
    return None


def contains_any(text: str, words: tuple) -> bool:
    low = text.casefold()
    return any(w in low for w in words)


def main() -> int:
    stamp = time.strftime("%Y-%m-%dT%H:%M:%S")
    env = declared_env()
    obs_path = HERE / f"attempt{ATTEMPT}_observation.jsonl"

    if run(["git", "-C", str(CAND), "rev-parse", "HEAD"]).stdout.strip() \
            != CANDIDATE_SHA:
        raise RuntimeError("candidate identity mismatch; no launch")
    if run(["git", "-C", str(CAND), "status", "--porcelain"]).stdout.strip():
        raise RuntimeError("candidate dirty; no launch")
    if port_open(PORT):
        raise RuntimeError("acceptance port occupied; no launch")
    if not PRE_DECL.exists():
        raise RuntimeError("predeclared configuration missing; no launch")

    predecl_sha = sha256_file(PRE_DECL)
    cfg = {
        "attempt": ATTEMPT,
        "declared_at": stamp,
        "predeclared_config": {
            "path": str(PRE_DECL),
            "sha256": predecl_sha,
        },
        "candidate": {
            "commit": run(["git", "-C", str(CAND), "rev-parse",
                           "HEAD"]).stdout.strip(),
            "branch": run(["git", "-C", str(CAND), "rev-parse",
                           "--abbrev-ref", "HEAD"]).stdout.strip(),
            "parent": PARENT_SHA,
            "tree_clean": not run(["git", "-C", str(CAND), "status",
                                   "--porcelain"]).stdout.strip(),
            "worktree": str(CAND),
            "source_sha256_turn_decision": sha256_file(
                CAND_BACKEND / "core" / "turn_decision.py"),
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
                       "LANCEDB_URI_BASE", "BYOK_CONFIG_FILE",
                       "BYOK_KEYS_FILE", "BYOK_ENC_KEY_FILE"],
            "live_env_copied_wholesale": False,
            "credential_vault_copied": False,
        },
        "flags": {
            "declared": {
                "CHAT_FINALIZATION_M1": "1",
                "CHAT_FINALIZATION_M2": "1",
                "ATOM_TASK_LIFECYCLE_ENABLED": "1",
                "ATOM_TURN_DECISION_ROUTING": "1",
                "ATOM_TURN_INTERPRETATION": "1",
            },
        },
        "model": {
            "provider": "opencode-go (only)",
            "cloud_route": "https://opencode.ai/zen/go/v1",
            "interpretation": "real, unpinned (BPC-ranked fast/planning); "
                              "actual origin/model recorded",
            "reply": "product-selected; actual route/model recorded; "
                     "no gate depends on it",
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
        "observation_harness": {
            "launcher": str(HERE / "server_observe.py"),
            "log": str(obs_path),
            "candidate_source_edited": False,
            "hooks": [
                "interpret_turn_request",
                "apply_interpretation_references",
                "_stash_evidence_requirement",
                "_context_backed_fulfillment",
                "_fallback_turn_outcome",
            ],
        },
        "job": {
            "fixture": FIXTURE_NAME,
            "upload_route": "POST /api/documents/upload",
            "draft_title": CANVAS_TITLE,
            "draft_body": CANVAS_BODY,
            "s3_ask": S3_ASK,
            "s7_ask": S7_ASK,
            "s3_first": True,
            "s7_original_continuation": True,
        },
        "live_db_guard": {
            "path": str(LIVE_DB),
            "sha256_before": sha256_file(LIVE_DB) if LIVE_DB.exists() else None,
            "mtime_before": LIVE_DB.stat().st_mtime if LIVE_DB.exists() else None,
        },
        "pilot_before": pilot_identity(),
    }
    (HERE / f"attempt{ATTEMPT}_config.json").write_text(
        json.dumps(cfg, indent=2, sort_keys=True, default=str))

    SCRATCH.mkdir(parents=True, exist_ok=True)
    freeze = run([str(PY), "-m", "pip", "freeze"])
    (HERE / f"attempt{ATTEMPT}_interpreter_freeze.txt").write_text(freeze.stdout)

    db_file = SCRATCH / "atom.db"
    if db_file.exists():
        raise RuntimeError("scratch world already exists; refuse reuse")
    if obs_path.exists():
        raise RuntimeError("observation log already exists; refuse reuse")

    result = {"declared_config": cfg, "steps": {}}
    server_log_path = HERE / f"attempt{ATTEMPT}_server.log"
    log = server_log_path.open("w")
    os.chmod(server_log_path, 0o600)
    proc = subprocess.Popen(
        [str(PY), str(HERE / "server_observe.py")],
        cwd=str(CAND_BACKEND), env=env, stdout=log, stderr=subprocess.STDOUT)
    result["steps"]["launch"] = {
        "pid": proc.pid, "cwd": str(CAND_BACKEND),
        "launcher": str(HERE / "server_observe.py"),
    }

    def capture_after_guards():
        if "pilot_after" not in result:
            result["pilot_after"] = pilot_identity()
        if "live_db_guard_after" not in result:
            if LIVE_DB.exists():
                hash_after = sha256_file(LIVE_DB)
                mtime_after = LIVE_DB.stat().st_mtime
                result["live_db_guard_after"] = {
                    "sha256": hash_after,
                    "mtime": mtime_after,
                    "unchanged": (
                        hash_after == cfg["live_db_guard"]["sha256_before"]
                        and mtime_after
                        == cfg["live_db_guard"]["mtime_before"]),
                }
            else:
                result["live_db_guard_after"] = {"unchanged": False}

    def finish_result():
        capture_after_guards()
        result["observation_events"] = load_events(obs_path)
        (HERE / f"attempt{ATTEMPT}_result.json").write_text(
            json.dumps(result, indent=2, sort_keys=True, default=str))
        print(json.dumps({
            "attempt": ATTEMPT,
            "classification": result.get("classification"),
            "pass": result.get("pass"),
            "checks": result.get("checks"),
            "first_failure": result.get("first_failure"),
            "runtime_identity": result.get("steps", {}).get(
                "runtime_identity"),
            "s3": {
                "outcome": (result.get("steps", {}).get(
                    "s3", {}).get("settlement") or {}).get(
                    "final_outcome"),
                "success": (result.get("steps", {}).get(
                    "s3", {}).get("settlement") or {}).get(
                    "final_success"),
                "message": (result.get("steps", {}).get(
                    "s3", {}).get("settlement") or {}).get(
                    "final_message", "")[:260],
            },
            "s7": {
                "outcome": (result.get("steps", {}).get(
                    "s7", {}).get("settlement") or {}).get(
                    "final_outcome"),
                "success": (result.get("steps", {}).get(
                    "s7", {}).get("settlement") or {}).get(
                    "final_success"),
                "message": (result.get("steps", {}).get(
                    "s7", {}).get("settlement") or {}).get(
                    "final_message", "")[:320],
            },
            "s7_requirement": result.get("steps", {}).get(
                "s7", {}).get("requirement_summary"),
            "s7_context_fulfillment": result.get("steps", {}).get(
                "s7", {}).get("context_fulfillment"),
            "live_db_unchanged": (result.get("live_db_guard_after") or {}
                                  ).get("unchanged"),
            "pilot_untouched": result.get("pilot_untouched"),
        }, indent=2, default=str))
        return 0 if result.get("pass") else 1

    def api_events_for(request_id: str) -> dict:
        events = load_events(obs_path)
        matched = events_for_request(events, request_id)
        return {
            "interpretation": last_event(matched, "interpret_turn_request"),
            "apply": last_event(matched, "apply_interpretation_references"),
            "events": matched,
        }

    def capture_turn(label: str, ask: str, session_id: str, auth: dict,
                     uid: str, cid: str, canvas_before: str,
                     audit_before: list) -> dict:
        request_id = f"l2-{label}-{uuid.uuid4().hex}"
        t0 = time.monotonic()
        chat = httpx.post(
            f"{BASE}/api/chat/message", headers=auth,
            json={"message": ask, "session_id": session_id,
                  "user_id": uid,
                  "context": {"canvas_id": cid,
                              "request_id": request_id}},
            timeout=900, trust_env=False)
        latency = time.monotonic() - t0
        try:
            chat_json = chat.json()
        except Exception:
            chat_json = {"_raw": chat.text[:4000]}
        step = {
            "request_id": request_id,
            "ask": ask,
            "http": chat.status_code,
            "latency_s": round(latency, 2),
            "initial_response": chat_json,
        }
        final, polls = poll_settlement(session_id, auth, uid, t0, proc)
        time.sleep(1.0)
        fresh = read_history(session_id, auth, uid)
        step["settlement"] = {
            "polls": polls,
            "final_outcome": final.get("outcome"),
            "final_success": final.get("success"),
            "final_error_code": final.get("error_code"),
            "final_message": str(final.get("message") or "")[:2000],
            "final_execution_id": final.get("execution_id"),
        }
        step["fresh_history"] = {
            "http": fresh.get("http"),
            "assistant_count": fresh.get("assistant_count"),
            "assistant_response": fresh.get("assistant_response"),
        }
        step["persisted_rows"] = persisted_rows(db_file, session_id)
        step["canvas_before"] = canvas_before
        got_after = httpx.get(f"{BASE}/api/canvas/{cid}", headers=auth,
                              timeout=60, trust_env=False).json()
        step["canvas_after"] = canvas_body(got_after)
        step["audit_before"] = audit_before
        step["audit_after"] = audits(db_file, cid)

        # exact execution binding: response id -> row -> task_outcome id
        exec_candidates = [
            chat_json.get("execution_id") if isinstance(chat_json, dict)
            else None,
            final.get("execution_id"),
            fresh.get("assistant_response", {}).get("execution_id"),
        ]
        exec_id = next((str(e) for e in exec_candidates if e), "")
        rec = execution_record(db_file, exec_id)
        step["execution"] = {
            "response_execution_id": exec_id,
            "execution_candidates": [str(e) for e in exec_candidates if e],
            "row_found": bool(rec),
            "row": rec,
            "task_summary": task_summary(rec),
        }

        # observation-hook records bound to this request/execution
        obs = api_events_for(request_id)
        step["observation"] = obs
        stash_event = None
        for e in obs.get("events") or []:
            if e.get("event") == "stash_evidence_requirement":
                if not exec_id or str(e.get("execution_id") or "") == exec_id:
                    stash_event = e
        if stash_event is None:
            # the stash hook does not carry the request id; find by message
            # and execution id in the full log
            for e in load_events(obs_path):
                if (e.get("event") == "stash_evidence_requirement"
                        and e.get("message") == ask
                        and (not exec_id
                             or str(e.get("execution_id") or "") == exec_id)):
                    stash_event = e
        step["requirement_event"] = stash_event
        step["requirement_summary"] = (
            stash_event.get("requirement") if stash_event else None)
        cf_event = None
        fb_event = None
        for e in load_events(obs_path):
            if str(e.get("execution_id") or "") != exec_id:
                continue
            if e.get("event") == "context_backed_fulfillment":
                cf_event = e
            if e.get("event") == "fallback_turn_outcome":
                fb_event = e
        step["context_fulfillment"] = (cf_event or {}).get("verdict")
        step["fallback_state"] = (fb_event or {}).get("state")
        return step

    try:
        health = None
        deadline = time.time() + 300
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
                CANDIDATE_SHA[:12]),
        }
        if not (result["steps"]["runtime_identity"]["candidate_cwd_ok"]
                and result["steps"]["runtime_identity"]["candidate_commit_ok"]
                and result["steps"]["runtime_identity"]["dirty"] is False):
            result["classification"] = "runtime_identity_mismatch"
            result["pass"] = False
            return finish_result()

        email = f"l2cont_{uuid.uuid4().hex[:10]}@example.com"
        password = "L2cont-" + uuid.uuid4().hex[:12] + "A1"
        reg = httpx.post(f"{BASE}/api/auth/register",
                         json={"email": email, "password": password,
                               "first_name": "L2", "last_name": "Cont"},
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
                  "label": "Authorized L2 acceptance route"},
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
        row = None
        if up_json.get("id"):
            rows = db_read_rows(
                db_file,
                "SELECT id, file_name, workspace_id, content_preview, "
                "file_size_bytes FROM ingested_documents WHERE id=?",
                (up_json.get("id"),))
            if rows:
                row = rows[0]
        result["steps"]["upload"]["row"] = (
            {"id": row[0], "file_name": row[1], "workspace_id": row[2],
             "preview_has_date": "2026-12-31" in str(row[3] or ""),
             "size": row[4]}
            if row else None)
        upload_ok = bool(
            up.status_code == 200 and up_json.get("id") and row
            and row[1] == FIXTURE_NAME
            and "2026-12-31" in str(row[3] or ""))

        # --- the draft, created through the PRODUCT ---------------------
        ccreate = httpx.post(f"{BASE}/api/canvas", headers=auth,
                             json={"title": CANVAS_TITLE,
                                   "canvas_type": "document"},
                             timeout=60, trust_env=False)
        try:
            ccreate_json = ccreate.json()
        except Exception:
            ccreate_json = {}
        cid = ccreate_json.get("canvas_id")
        result["steps"]["canvas"] = {"create_http": ccreate.status_code,
                                     "canvas_id": cid}
        if ccreate.status_code != 200 or not cid:
            result["classification"] = "canvas_create_failed"
            result["pass"] = False
            return finish_result()
        cput = httpx.put(f"{BASE}/api/canvas/{cid}", headers=auth,
                         json=CANVAS_BODY, timeout=60, trust_env=False)
        got = httpx.get(f"{BASE}/api/canvas/{cid}", headers=auth,
                        timeout=60, trust_env=False).json()
        seeded_body = canvas_body(got)
        result["steps"]["canvas"].update({
            "seed_http": cput.status_code,
            "seeded_body": seeded_body,
            "seed_exact": seeded_body == CANVAS_BODY,
        })
        seed_ok = bool(cput.status_code == 200
                       and seeded_body == CANVAS_BODY)

        baseline_arm = audits(db_file, cid)
        result["steps"]["baseline_audits"] = baseline_arm

        session_id = str(uuid.uuid4())
        result["steps"]["session_id"] = session_id

        s3 = capture_turn("s3", S3_ASK, session_id, auth, uid, cid,
                          seeded_body, baseline_arm)
        result["steps"]["s3"] = s3

        after_s3 = s3["canvas_after"]
        audit_after_s3 = s3["audit_after"]
        s7 = capture_turn("s7", S7_ASK, session_id, auth, uid, cid,
                          after_s3, audit_after_s3)
        result["steps"]["s7"] = s7

        # --- served-log evidence (real interpretation + route) ----------
        try:
            log.flush()
        except Exception:
            pass
        log_text = server_log_path.read_text(errors="replace")
        dispatch_models = sorted(set(re.findall(
            r"\[structured-dispatch\] ([^\s]+)", log_text)))
        zen_posts = log_text.count(
            "POST https://opencode.ai/zen/go/v1/chat/completions")
        go_inference_posts = log_text.count(
            "POST https://opencode.ai/inference/go/openai/v1/chat/completions")
        result["steps"]["served_log_evidence"] = {
            "structured_dispatch_models": dispatch_models,
            "zen_chat_posts": zen_posts,
            "go_inference_chat_posts": go_inference_posts,
            "interpretation_log_lines": [
                line[:220] for line in log_text.splitlines()
                if "[turn-interpretation]" in line][-12:],
        }

        # --- checks ------------------------------------------------------
        s3_obs = s3.get("observation") or {}
        s3_interp_event = s3_obs.get("interpretation") or {}
        s3_interp = s3_interp_event.get("interpretation") or {}
        s3_apply = s3_obs.get("apply") or {}
        s3_req = s3.get("requirement_summary") or {}
        s3_req_identity = s3_req.get("identity") or {}
        s3_exec = s3.get("execution") or {}
        s3_task = s3_exec.get("task_summary") or {}
        s3_final = s3.get("settlement") or {}
        s3_fresh = (s3.get("fresh_history") or {}).get(
            "assistant_response") or {}
        s3_rows = s3.get("persisted_rows") or []
        s3_assistant_rows = [r for r in s3_rows
                             if r.get("role") == "assistant"]
        s3_last_meta = s3_assistant_rows[-1] if s3_assistant_rows else {}
        s3_msg = str(s3_final.get("final_message")
                     or (s3.get("initial_response") or {}).get("message")
                     or "")
        s3_eid = str(s3_exec.get("response_execution_id") or "")

        s7_obs = s7.get("observation") or {}
        s7_interp_event = s7_obs.get("interpretation") or {}
        s7_interp = s7_interp_event.get("interpretation") or {}
        s7_apply = s7_obs.get("apply") or {}
        s7_req = s7.get("requirement_summary") or {}
        s7_req_identity = s7_req.get("identity") or {}
        s7_exec = s7.get("execution") or {}
        s7_task = s7_exec.get("task_summary") or {}
        s7_final = s7.get("settlement") or {}
        s7_fresh = (s7.get("fresh_history") or {}).get(
            "assistant_response") or {}
        s7_rows = s7.get("persisted_rows") or []
        s7_assistant_rows = [r for r in s7_rows
                             if r.get("role") == "assistant"]
        s7_last_meta = s7_assistant_rows[-1] if s7_assistant_rows else {}
        s7_msg = str(s7_final.get("final_message")
                     or (s7.get("initial_response") or {}).get("message")
                     or "")
        s7_eid = str(s7_exec.get("response_execution_id") or "")
        s7_cf = (s7.get("context_fulfillment")
                 or (s7.get("fallback_state") or {}).get(
                     "context_fulfillment") or {})
        s7_fb = s7.get("fallback_state") or {}
        s7_after_refs = ((s7_apply.get("decision_refs_after") or {})
                         .get("continuation_evidence") or {})
        s7_observed = s7_apply.get("observed") or []

        def date_field_present(fields):
            joined = " ".join(str(f).casefold() for f in (fields or []))
            return any(w in joined for w in
                       ("expiration", "valid", "date"))

        def cf_completed(cf, task):
            matched = [str(m.get("file_name") or "")
                       for m in (cf.get("matched") or [])
                       if isinstance(m, dict)]
            supplied = [str(f) for f in (cf.get("supplied_fields") or [])]
            return bool(
                cf.get("state") == "completed"
                and any(FIXTURE_NAME == m for m in matched)
                and date_field_present(supplied)
                and task.get("objective_met") is True
                and (task.get("delivery") or {}).get("delivered") is True)

        def cf_partial(cf, task, fallback):
            matched = [str(m.get("file_name") or "")
                       for m in (cf.get("matched") or [])
                       if isinstance(m, dict)]
            supplied = [str(f) for f in (cf.get("supplied_fields") or [])]
            gap = bool(cf.get("missing_comparison")
                       or (cf.get("missing_fields") or []))
            return bool(
                cf.get("state") == "partial"
                and gap
                and any(FIXTURE_NAME == m for m in matched)
                and date_field_present(supplied)
                and (task.get("delivery") or {}).get("delivered") is True
                and bool((fallback or {}).get("open_work")))

        def settlement_ok(final, cf, task, fallback):
            outcome = final.get("final_outcome")
            success = final.get("final_success")
            if success is not True:
                return False
            if outcome == "completed":
                return cf_completed(cf, task)
            if outcome == "partial":
                return cf_partial(cf, task, fallback)
            return False

        def agreement(initial, final, fresh, last_meta, eid, rec):
            out = final.get("final_outcome")
            succ = final.get("final_success")
            if out is None or succ is None:
                return False
            if last_meta.get("meta_outcome") != out:
                return False
            if last_meta.get("meta_success") != succ:
                return False
            fresh_out = fresh.get("outcome")
            fresh_succ = fresh.get("success")
            if fresh_out is not None and fresh_out != out:
                return False
            if fresh_succ is not None and fresh_succ != succ:
                return False
            if initial.get("success") not in (None, succ):
                return False
            if initial.get("outcome") not in (None, out):
                return False
            task = (rec or {}).get("task_outcome") or {}
            if str(task.get("execution_id") or "") != eid:
                return False
            if str((rec or {}).get("row_id") or "") != eid:
                return False
            return True

        s3_low = s3_msg.casefold()
        s7_low = s7_msg.casefold()
        s3_truthful = bool(
            "2026-12-31" in s3_msg
            and contains_any(s3_low, ("match", "matches", "same",
                                      "identical", "consistent"))
            and "2026-11-30" not in s3_msg
            and not re.search(
                r"valid.?until.{0,90}(does not match|doesn.t match|"
                r"differs|mismatch|not match)", s3_low)
            and (
                (contains_any(s3_low, ("net 45", "net45"))
                 and contains_any(s3_low, ("net 30", "net30"))
                 and contains_any(s3_low, ("differ", "difference",
                                           "discrepan", "mismatch",
                                           "not match", "doesn.t match",
                                           "conflict", "out of sync",
                                           "not aligned")))
                or contains_any(s3_low, ("did not compare", "didn.t compare",
                                         "not compare", "cannot compare",
                                         "can.t compare", "only compared"))
            )
            and not contains_any(s3_low, ("everything else matches",
                                          "all other fields match",
                                          "remaining fields match")))
        s7_truthful = bool(
            "2026-12-31" in s7_msg
            and contains_any(s7_low, ("match", "matches", "same",
                                      "identical", "consistent"))
            and "2026-11-30" not in s7_msg
            and not re.search(
                r"valid.?until.{0,90}(does not match|doesn.t match|"
                r"no longer match|differs|mismatch|not match)", s7_low)
            and not contains_any(s7_low, ("i updated", "i changed",
                                          "updated the draft",
                                          "changed the draft",
                                          "modified the draft",
                                          "set the draft")))

        s3_audit_unchanged = s3.get("audit_after") == baseline_arm
        s7_audit_unchanged = (s7.get("audit_after")
                              == s3.get("audit_after"))
        s3_body_unchanged = s3.get("canvas_after") == seeded_body
        s7_body_unchanged = s7.get("canvas_after") == s3.get("canvas_after")

        s3_req_ok = bool(
            s3_req.get("required") is True
            and "document" in [str(s).lower()
                               for s in (s3_req.get("sources") or [])]
            and s3_req.get("artifact_attached") is True
            and s3_eid
            and str((s3.get("requirement_event") or {}).get(
                "execution_id") or "") == s3_eid
            and (s3.get("requirement_event") or {}).get(
                "bound_to_execution_key") is True)
        s7_req_ok = bool(
            s7_req.get("required") is True
            and "document" in [str(s).lower()
                               for s in (s7_req.get("sources") or [])]
            and (s7_req.get("file") or {}).get("file_name") == FIXTURE_NAME
            and s7_req_identity.get("state") == "resolved"
            and bool(s7_req_identity.get("file_id"))
            and s7_req_identity.get("file_name") == FIXTURE_NAME
            and date_field_present(s7_req.get("fields"))
            and s7_req.get("artifact_attached") is True
            and s7_eid
            and str((s7.get("requirement_event") or {}).get(
                "execution_id") or "") == s7_eid
            and (s7.get("requirement_event") or {}).get(
                "bound_to_execution_key") is True)
        s7_source_ok = bool(
            s7_after_refs.get("state") == "resolved"
            and s7_after_refs.get("resolved_file") == FIXTURE_NAME
            and any(str(o.get("file_name") or "") == FIXTURE_NAME
                    for o in s7_observed)
            and any(str(o.get("execution_id") or "") == s3_eid
                    for o in s7_observed)
            and s7_interp.get("origin", "").startswith("llm:")
            and s7_interp.get("scope_change") != "unresolved")
        real_interp = bool(
            s7_interp.get("origin", "").startswith("llm:")
            and dispatch_models)

        checks = {
            "runtime_identity": bool(
                result["steps"]["runtime_identity"]["candidate_cwd_ok"]
                and result["steps"]["runtime_identity"]["candidate_commit_ok"]
                and result["steps"]["runtime_identity"]["dirty"] is False),
            "fixture_uploaded_through_product": upload_ok,
            "draft_created_through_product": seed_ok,
            "real_interpretation_dispatched": real_interp,
            "prior_evidence_observed": bool(
                any(str(o.get("execution_id") or "") == s3_eid
                    for o in s7_observed)),
            "s3_reply_received": bool(
                s3.get("http") == 200 and s3_msg),
            "s3_truthful_comparison": s3_truthful,
            "s3_zero_canvas_writes": s3_audit_unchanged,
            "s3_draft_unchanged": s3_body_unchanged,
            "s3_settlement_basis": settlement_ok(
                s3_final,
                (s3.get("context_fulfillment")
                 or (s3.get("fallback_state") or {}).get(
                     "context_fulfillment") or {}),
                s3_task, s3.get("fallback_state") or {}),
            "s3_requirement_captured": s3_req_ok,
            "s7_reply_received": bool(
                s7.get("http") == 200 and s7_msg),
            "s7_truthful_comparison": s7_truthful,
            "s7_zero_new_writes": s7_audit_unchanged,
            "s7_draft_unchanged": s7_body_unchanged,
            "s7_requirement_captured": s7_req_ok,
            "s7_resolved_source_identity": s7_source_ok,
            "s7_settlement_basis": settlement_ok(
                s7_final, s7_cf, s7_task, s7_fb),
            "response_persisted_fresh_history_agreement": agreement(
                s3.get("initial_response") or {}, s3_final, s3_fresh,
                s3_last_meta, s3_eid, s3_exec.get("row")),
            "s7_response_persisted_fresh_history_agreement": agreement(
                s7.get("initial_response") or {}, s7_final, s7_fresh,
                s7_last_meta, s7_eid, s7_exec.get("row")),
        }

        # pilot + live DB guards — captured before the pass/fail decision
        capture_after_guards()
        pilot_after = result["pilot_after"]
        pilot_before_ident = (cfg.get("pilot_before") or {}).get(
            "identity") or {}
        pilot_after_ident = pilot_after.get("identity") or {}
        result["pilot_untouched"] = bool(
            pilot_before_ident.get("instance_id")
            == pilot_after_ident.get("instance_id")
            and pilot_before_ident.get("pid") == pilot_after_ident.get("pid")
            and pilot_before_ident.get("started_at")
            == pilot_after_ident.get("started_at")
            and pilot_after.get("backend_8001_listening")
            and pilot_after.get("frontend_3000_listening"))
        checks["live_db_unchanged"] = bool(
            (result.get("live_db_guard_after") or {}).get("unchanged"))
        checks["pilot_untouched"] = result["pilot_untouched"]

        result["checks"] = checks
        result["pass"] = all(checks.values())
        order = [
            ("runtime_identity", "runtime_identity_mismatch"),
            ("fixture_uploaded_through_product", "upload_failed"),
            ("draft_created_through_product", "draft_create_failed"),
            ("real_interpretation_dispatched",
             "interpretation_not_real_or_not_dispatched"),
            ("prior_evidence_observed", "prior_evidence_missing"),
            ("s3_reply_received", "s3_no_reply"),
            ("s3_truthful_comparison", "s3_untruthful_comparison"),
            ("s3_zero_canvas_writes", "s3_canvas_write"),
            ("s3_draft_unchanged", "s3_draft_changed"),
            ("s3_settlement_basis", "s3_settlement_not_validated"),
            ("s3_requirement_captured", "s3_requirement_missing"),
            ("s7_reply_received", "s7_no_reply"),
            ("s7_truthful_comparison", "s7_untruthful_comparison"),
            ("s7_zero_new_writes", "s7_canvas_write"),
            ("s7_draft_unchanged", "s7_draft_changed"),
            ("s7_requirement_captured", "s7_requirement_missing"),
            ("s7_resolved_source_identity", "s7_source_not_resolved"),
            ("s7_settlement_basis", "s7_settlement_not_validated"),
            ("response_persisted_fresh_history_agreement",
             "s3_history_disagreement"),
            ("s7_response_persisted_fresh_history_agreement",
             "s7_history_disagreement"),
            ("live_db_unchanged", "live_db_changed"),
            ("pilot_untouched", "pilot_touched"),
        ]
        result["first_failure"] = next(
            (cls for key, cls in order if not checks.get(key)), None)
        result["classification"] = (
            "verified_l2_continuation_evidence"
            if result["pass"] else (result["first_failure"]
                                    or "unclassified_failure"))
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
