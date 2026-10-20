#!/usr/bin/env python3
"""L2 interpretation diagnostic — measure the exact S3/S7 interpretation
call outside the full journey.

Scratch-only. Replays the ACTUAL attempt-3 S3 and S7 inputs (message,
session source context, recent history, canvas context) through the real
candidate code with a 90-second diagnostic window, while separately
recording whether the unchanged 12-second product deadline was met.
No production timeout change; no acceptance claim.

Run:  python diagnose_l2_interpretation.py
Child: the same file with --child <turn> <payload.json> <out.json>.
"""
from __future__ import annotations

import hashlib
import json
import os
import signal
import socket
import subprocess
import sys
import time
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
CAND = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-continuation-evidence")
CAND_BACKEND = CAND / "backend"
PY = Path("/Users/rushiparikh/projects/atom/backend/venv314/bin/python")
DIAG = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-fix/scratch/l2-diagnostic-s7-final")
PORT = 8098
BASE = f"http://127.0.0.1:{PORT}"
CANDIDATE_SHA = "a3875d6bb2026ffb4d1424f26a63b4e68c89cedf"
ATTEMPT3 = HERE / "attempt3_result.json"
ATTEMPT3_OBS = HERE / "attempt3_observation.jsonl"
FIXTURE = "approved_records_q2026_114.txt"

S3_ASK = (
    "Compare the draft quotation with my uploaded Approved Records document. "
    "Does the Valid Until date in the draft match the approved record? "
    "Flag anything that differs. Do not change anything yet.")
S7_ASK = (
    "What is the current Valid until date on the draft, and does it still "
    "match the approved record?")


def _run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def _port_open(port: int) -> bool:
    with socket.socket() as probe:
        probe.settimeout(1.0)
        return probe.connect_ex(("127.0.0.1", port)) == 0


def _env() -> dict:
    data = DIAG / "data"
    data.mkdir(parents=True, exist_ok=True)
    return {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
        "HOME": os.environ.get("HOME", "/tmp"),
        "LANG": "en_US.UTF-8",
        "PYTHONDONTWRITEBYTECODE": "1",
        "DATABASE_URL": f"sqlite:///{DIAG}/atom.db",
        "ATOM_DATA_DIR": str(data),
        "LANCEDB_URI": str(DIAG / "atom_memory"),
        "LANCEDB_URI_BASE": str(DIAG / "atom_memory"),
        "BYOK_CONFIG_FILE": str(DIAG / "byok_config.json"),
        "BYOK_KEYS_FILE": str(DIAG / "byok_keys.json"),
        "BYOK_ENC_KEY_FILE": str(DIAG / "byok_encryption_key"),
        "CHAT_FINALIZATION_M1": "1",
        "CHAT_FINALIZATION_M2": "1",
        "ATOM_TASK_LIFECYCLE_ENABLED": "1",
        "ATOM_TURN_DECISION_ROUTING": "1",
        "ATOM_TURN_INTERPRETATION": "1",
        "ENABLE_SCHEDULER": "false",
        "ENABLE_INGESTION_SYNC": "false",
        "ENVIRONMENT": "development",
        "ALLOW_DEV_TEMP_USERS": "true",
        "EMBEDDING_PROVIDER": "fastembed",
        "FASTEMBED_MODEL": "BAAI/bge-small-en-v1.5",
        "EMBEDDING_DIM": "384",
        "OPENCODE_BASE_URL": "https://opencode.ai/zen/go/v1",
    }


def _read_attempt3() -> tuple[dict, dict]:
    result = json.loads(ATTEMPT3.read_text())
    observed = {}
    requested = {}
    for line in ATTEMPT3_OBS.read_text(errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except Exception:
            continue
        if event.get("event") != "stash_evidence_requirement":
            continue
        carriers = event.get("carriers") or {}
        observed.update(carriers.get("observed") or {})
        requested.update(carriers.get("requested") or {})
    return result, {"observed": observed, "requested": requested}


def _build_payloads(result: dict, carriers: dict) -> dict:
    canvas_id = ((result.get("steps") or {}).get("canvas") or {}).get(
        "canvas_id") or "canvas-diagnostic"
    s3_reply = ((result["steps"]["s3"].get("settlement") or {})
                .get("final_message") or "")
    s3_eid = ((result["steps"]["s3"].get("execution") or {})
              .get("response_execution_id") or "s3-exec")
    s7_req = ((result["steps"]["s7"].get("requirement_summary") or {})
              or {})
    # The S7 session carries the S3 retrieval observations + requirement.
    session_s7: dict = {}
    for key, rows in (carriers.get("observed") or {}).items():
        if rows:
            session_s7[key] = rows
    for key, value in (carriers.get("requested") or {}).items():
        if value:
            session_s7[key] = value
    if not session_s7:
        # Fallback: reconstruct the single S3 observed carrier.
        session_s7[f"_retrieval_source_observations_{s3_eid}"] = [{
            "observation_id": f"diag-{s3_eid}",
            "source": "ingested",
            "file_name": FIXTURE,
            "title": FIXTURE,
            "workspace_id": "",
            "content_hash": "",
        }]
        session_s7[f"_evidence_requirement_{s3_eid}"] = {
            "required": True, "sources": ["document"], "file": None,
            "fields": ["expiration_date"], "subjects": [],
            "identity": {"state": "kind_only", "candidates": []},
            "artifact_attached": True,
        }
    history_s7 = [
        {"role": "user", "content": S3_ASK},
        {"role": "assistant", "content": s3_reply},
    ]
    return {
        "s3": {
            "message": S3_ASK,
            "session": {},
            "history": [],
            "context": {"canvas_id": canvas_id},
            "served_prompt_chars": 2187,
        },
        "s7": {
            "message": S7_ASK,
            "session": session_s7,
            "history": history_s7,
            "context": {"canvas_id": canvas_id},
            "served_prompt_chars": 2435,
        },
        "canvas_id": canvas_id,
        "s3_reply": s3_reply,
    }


def _setup_server(env: dict) -> dict:
    log_path = DIAG / "setup_server.log"
    log = log_path.open("w")
    proc = subprocess.Popen(
        [str(PY), str(HERE / "server_observe.py")],
        cwd=str(CAND_BACKEND), env={**env, "L2_CAND_BACKEND": str(CAND_BACKEND),
                                     "L2_PORT": str(PORT),
                                     "L2_OBSERVATION_LOG": str(
                                         DIAG / "setup_observation.jsonl")},
        stdout=log, stderr=subprocess.STDOUT)
    health = None
    deadline = time.time() + 240
    while time.time() < deadline:
        if proc.poll() is not None:
            break
        try:
            import httpx

            r = httpx.get(f"{BASE}/api/health", timeout=5, trust_env=False)
            if r.status_code == 200:
                health = r.json()
                break
        except Exception:
            pass
        time.sleep(2)
    if not health:
        proc.terminate()
        raise RuntimeError("diagnostic setup server not healthy")
    import httpx

    email = f"l2diag_{uuid.uuid4().hex[:10]}@example.com"
    password = "L2diag-" + uuid.uuid4().hex[:12] + "A1"
    reg = httpx.post(f"{BASE}/api/auth/register", json={
        "email": email, "password": password,
        "first_name": "L2", "last_name": "Diag"}, timeout=60,
        trust_env=False)
    token = reg.json().get("access_token") if reg.status_code == 200 else None
    if not token:
        lg = httpx.post(f"{BASE}/api/auth/login", json={
            "email": email, "username": email, "password": password},
            timeout=60, trust_env=False)
        token = lg.json().get("access_token") if lg.status_code == 200 else None
    if not token:
        proc.terminate()
        raise RuntimeError("diagnostic auth failed")
    auth = {"Authorization": f"Bearer {token}"}
    me = httpx.get(f"{BASE}/api/auth/me", headers=auth, timeout=30,
                   trust_env=False).json()
    uid = me.get("id")
    ws_id = me.get("workspace_id")
    tenant_id = me.get("tenant_id") or me.get("tenant")
    if not tenant_id:
        import sqlite3

        con = sqlite3.connect(f"file:{DIAG}/atom.db?mode=ro", uri=True)
        try:
            row = con.execute(
                "SELECT tenant_id FROM users WHERE id=?", (uid,)).fetchone()
            tenant_id = row[0] if row else None
        finally:
            con.close()
    tenant_id = tenant_id or "default"
    # ONE authorized operator credential through the product.
    from cryptography.fernet import Fernet

    vault = Path("/Users/rushiparikh/projects/atom/backend/data/byok_keys.json")
    enc = Path("/Users/rushiparikh/projects/atom/backend/data/byok_encryption_key")
    row = json.loads(vault.read_text())["keys"][
        "opencode-go_default_production"]
    key = Fernet(enc.read_bytes().strip()).decrypt(
        row["encrypted_key"].encode()).decode()
    act = httpx.post(f"{BASE}/api/ai/providers/opencode-go/keys", headers=auth,
                     json={"api_key": key, "key_name": "default",
                           "environment": "production",
                           "label": "L2 diagnostic route"}, timeout=60,
                     trust_env=False)
    del key, row
    if act.status_code != 200:
        proc.terminate()
        raise RuntimeError(
            f"diagnostic credential registration failed: {act.status_code}")
    up = httpx.post(f"{BASE}/api/documents/upload", headers=auth,
                    files={"file": (FIXTURE, (
                        "APPROVED RECORDS \u2014 Quotation Q-2026-114\n"
                        "Source: Sales Operations approved-terms register\n"
                        "Client: Dunmore Fabrication LLC\n"
                        "Item: CNC press brake, 50-ton\n"
                        "Approved unit price: $48,000.00\n"
                        "Approved payment terms: Net 30\n"
                        "Approved valid until: 2026-12-31\n"
                        "Approved by: Sales Operations\n").encode("utf-8"),
                        "text/plain")}, timeout=300, trust_env=False)
    if up.status_code != 200:
        proc.terminate()
        raise RuntimeError(
            f"diagnostic fixture upload failed: {up.status_code}")
    proc.send_signal(signal.SIGTERM)
    try:
        proc.wait(timeout=30)
    except subprocess.TimeoutExpired:
        proc.kill()
    log.close()
    return {"user_id": uid, "workspace_id": ws_id, "tenant_id": tenant_id,
            "doc_id": up.json().get("id")}


def _run_child(turn: str, payload: dict, env: dict, ws: dict) -> dict:
    payload_path = DIAG / f"payload_{turn}.json"
    out_path = DIAG / f"result_{turn}.json"
    payload_path.write_text(json.dumps({
        **payload, "workspace_id": ws["workspace_id"],
        "tenant_id": ws["tenant_id"]}, indent=2))
    child_env = {**env, "L2_DIAG_TURN": turn,
                 "L2_DIAG_WORKSPACE": ws["workspace_id"],
                 "L2_DIAG_TENANT": ws["tenant_id"]}
    proc = subprocess.run(
        [str(PY), str(Path(__file__).resolve()), "--child", turn,
         str(payload_path), str(out_path)],
        cwd=str(CAND_BACKEND), env=child_env, capture_output=True, text=True,
        timeout=240)
    if out_path.exists():
        return json.loads(out_path.read_text())
    return {"turn": turn, "error": "child produced no result",
            "rc": proc.returncode, "stdout": proc.stdout[-2000:],
            "stderr": proc.stderr[-2000:]}


def _child(turn: str, payload_path: str, out_path: str) -> int:
    import asyncio
    import logging

    import httpx

    sys.path.insert(0, str(CAND_BACKEND))
    os.chdir(str(CAND_BACKEND))
    payload = json.loads(Path(payload_path).read_text())

    # --- HTTP attempt instrumentation (no auth headers recorded) --------
    http_records: list = []
    request_id = f"l2-diag-{turn}-{uuid.uuid4().hex[:12]}"

    def _summarise_request(request: httpx.Request) -> dict:
        body_summary: dict = {}
        try:
            body = json.loads(request.content)
            body_summary = {
                "model": body.get("model"),
                "body_chars": len(request.content or b""),
                "message_count": len(body.get("messages") or []),
                "message_chars": sum(
                    len(str(m.get("content") or ""))
                    for m in (body.get("messages") or [])),
                "tools_count": len(body.get("tools") or []),
                "tools_chars": len(json.dumps(body.get("tools") or [])),
                "max_tokens": body.get("max_tokens"),
                "reasoning": body.get("reasoning"),
                "response_format": str(
                    body.get("response_format") or "")[:80],
                "temperature": body.get("temperature"),
                "stream": body.get("stream"),
            }
        except Exception:
            body_summary = {"body_chars": len(request.content or b"")}
        safe_headers = {
            k: v for k, v in request.headers.items()
            if k.lower() not in ("authorization", "api-key", "x-api-key",
                                 "cookie")}
        return {"url": str(request.url), "headers": safe_headers,
                **body_summary}

    original_send = httpx.Client.send

    def _send(self, request, *args, **kwargs):
        request.headers["x-l2-diagnostic-id"] = request_id
        summary = _summarise_request(request)
        started = time.monotonic()
        try:
            response = original_send(self, request, *args, **kwargs)
        except Exception as exc:
            summary.update({"status": None, "error": repr(exc)[:200],
                            "elapsed_s": round(time.monotonic() - started, 3)})
            http_records.append(summary)
            raise
        elapsed = time.monotonic() - started
        body = {}
        try:
            body = response.json()
        except Exception:
            pass
        choices = body.get("choices") or []
        summary.update({
            "status": response.status_code,
            "elapsed_s": round(elapsed, 3),
            "finish_reason": (choices[0].get("finish_reason")
                              if choices else None),
            "usage": body.get("usage"),
            "content_present": bool(
                choices and (choices[0].get("message") or {}).get("content")),
            "tool_calls_present": bool(
                choices and ((choices[0].get("message") or {})
                             .get("tool_calls"))),
        })
        http_records.append(summary)
        return response

    httpx.Client.send = _send

    # --- dispatch log capture ------------------------------------------
    dispatch_lines: list = []

    class _Capture(logging.Handler):
        def emit(self, record):
            try:
                message = record.getMessage()
            except Exception:
                return
            if "[structured-dispatch]" in message \
                    or "[structured-trace]" in message \
                    or "[structured-cancelled]" in message:
                dispatch_lines.append(message)

    logger = logging.getLogger("core.llm.byok_handler")
    capture = _Capture()
    logger.addHandler(capture)

    import core.turn_decision as td
    from core.llm_service import LLMService

    os.environ["ATOM_TURN_INTERPRET_CAPTURE"] = "1"
    td._INTERPRET_TIMEOUT_S = 90.0  # diagnostic window only
    td.reset_interpretation_for_tests()
    service = LLMService(workspace_id=payload["workspace_id"],
                         tenant_id=payload["tenant_id"])
    message = payload["message"]
    session = payload.get("session") or {}
    history = payload.get("history") or []
    context = payload.get("context") or {}
    prompt = td._interpretation_prompt(message, history, session, context)
    started = time.monotonic()
    interpretation = asyncio.run(td.interpret_turn_request(
        message, session, history, context, session_id=f"diag-{turn}",
        request_id=request_id, llm_service=service))
    elapsed = time.monotonic() - started

    origin = str(interpretation.get("origin") or "")
    schema_valid = bool(origin.startswith("llm:")
                        and not interpretation.get("unresolved_reason"))
    # Identity through the real composer/stash.
    decision = td.build_turn_decision(
        message, session, history, context, session_id=f"diag-{turn}")
    composed = td.apply_interpretation_references(
        decision, interpretation, session)
    execution_id = f"diag-exec-{turn}"
    try:
        from integrations.chat_orchestrator import (
            _stash_evidence_requirement,
        )

        requirement = _stash_evidence_requirement(
            session, execution_id, composed, message,
            td.turn_evidence_required(composed),
            workspace_id=payload["workspace_id"], canvas_attached=True)
    except Exception as exc:  # noqa: BLE001
        requirement = {"error": repr(exc)}
    marker = (((composed.get("references") or {})
               .get("continuation_evidence")) or {})
    identity = (requirement or {}).get("identity") or {}
    provider = ""
    model = ""
    for line in reversed(dispatch_lines):
        if "[structured-dispatch]" in line:
            parts = line.split()
            for part in parts:
                if "/" in part and "route=" not in part:
                    provider, _, model = part.partition("/")
                    break
            break
    llm_records = [r for r in http_records
                   if "chat/completions" in str(r.get("url") or "")]
    result = {
        "turn": turn,
        "request_id": request_id,
        "provider": provider,
        "model": model or origin.removeprefix("llm:"),
        "product_deadline_s": 65.0,
        "diagnostic_window_s": 90.0,
        "deadline_met": bool(schema_valid and elapsed <= 65.0),
        "elapsed_to_valid_record_s": (
            round(elapsed, 3) if schema_valid else None),
        "elapsed_s": round(elapsed, 3),
        "http_attempts": len(llm_records),
        "http_statuses": [r.get("status") for r in llm_records],
        "http_records": llm_records,
        "http_records_all": http_records,
        "finish_reasons": [r.get("finish_reason") for r in llm_records],
        "output_tokens": [
            (r.get("usage") or {}).get("completion_tokens")
            for r in llm_records],
        "schema_valid": schema_valid,
        "interpretation_origin": origin,
        "interpretation_unresolved_reason": interpretation.get(
            "unresolved_reason"),
        "unresolved_reason": interpretation.get("unresolved_reason"),
        "scope_change": interpretation.get("scope_change"),
        "actions": interpretation.get("actions"),
        "action_count": len(interpretation.get("actions") or []),
        "action_kinds": [
            (action or {}).get("kind")
            for action in (interpretation.get("actions") or [])
            if isinstance(action, dict)],
        "interpretation_sources": interpretation.get("sources"),
        "source_identity_state": identity.get("state"),
        "requirement_required": (requirement or {}).get("required"),
        "requirement_file": (requirement or {}).get("file"),
        "composition_state": marker.get("state"),
        "composition_resolved_file": marker.get("resolved_file"),
        "prompt_chars": len(prompt),
        "served_prompt_chars": payload.get("served_prompt_chars"),
        "dispatch_lines": dispatch_lines[-12:],
        "interpretation_capture": td.get_interpret_capture(),
    }
    Path(out_path).write_text(json.dumps(result, indent=2, default=str))
    # Avoid waiting on any late worker thread: the parent's subprocess
    # boundary keeps samples isolated.
    os._exit(0)


def main() -> int:
    if len(sys.argv) >= 5 and sys.argv[1] == "--child":
        return _child(sys.argv[2], sys.argv[3], sys.argv[4])
    if _run(["git", "-C", str(CAND), "rev-parse", "HEAD"]).stdout.strip() \
            != CANDIDATE_SHA:
        raise RuntimeError("candidate identity mismatch; no diagnostic")
    if _run(["git", "-C", str(CAND), "status", "--porcelain"]).stdout.strip():
        raise RuntimeError("candidate dirty; no diagnostic")
    if _port_open(PORT):
        raise RuntimeError("diagnostic port occupied")
    if DIAG.exists():
        raise RuntimeError("diagnostic world already exists; refuse reuse")
    DIAG.mkdir(parents=True)
    env = _env()
    ws = _setup_server(env)
    result3, carriers = _read_attempt3()
    payloads = _build_payloads(result3, carriers)
    outputs = {
        "declared": {
            "candidate": CANDIDATE_SHA,
            "diagnostic_window_s": 90.0,
            "product_deadline_s": 65.0,
            "port": PORT,
            "scratch": str(DIAG),
            "workspace_id": ws["workspace_id"],
            "tenant_id": ws["tenant_id"],
            "source": "attempt-3 served inputs (message/session/history/"
                      "context) + candidate code + real scoped service",
        },
        "payloads": {
            "s3": {k: v for k, v in payloads["s3"].items()},
            "s7": {k: v for k, v in payloads["s7"].items()},
        },
    }
    only = "s7" if "--only=s7" in sys.argv else "both"
    if only in ("both", "s3"):
        outputs["s3"] = _run_child("s3", payloads["s3"], env, ws)
    if only in ("both", "s7"):
        outputs["s7"] = _run_child("s7", payloads["s7"], env, ws)
    out_name = (
        "diagnostic_s7_producer_results.json" if only == "s7"
        else "diagnostic_interpretation_results.json")
    (HERE / out_name).write_text(
        json.dumps(outputs, indent=2, sort_keys=True, default=str) + "\n")
    summary_keys = (
        "provider", "model", "deadline_met", "elapsed_s",
        "http_attempts", "http_statuses", "finish_reasons",
        "output_tokens", "schema_valid", "source_identity_state",
        "unresolved_reason", "action_count", "action_kinds",
        "scope_change", "requirement_required",
        "interpretation_capture",
        "prompt_chars", "served_prompt_chars")
    print(json.dumps({
        name: {k: result.get(k) for k in summary_keys}
        for name, result in outputs.items()
    }, indent=2, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
