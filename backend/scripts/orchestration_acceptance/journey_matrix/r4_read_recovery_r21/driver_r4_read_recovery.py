"""R4 — recovered read delivery: the interrupted retrieved-not-delivered
attempt, inspected durable state, and the recovery turn.

THE BARRIER (owner item 1): poll the attributable source-executor
counter for the read_completed event - the read has RUN and its receipt
is keyed to the plan execution - and SIGKILL the process IMMEDIATELY.
The findings are settled into the lifecycle op by the completing turn
before delivery renders, so the kill lands at the proven
retrieved-not-delivered boundary. If the assistant delivery row appears
first, delivery won the race and the attempt is diagnostic-INVALID
(retained). No timed sleeps; no cwd fallbacks (explicit ATOM_DATA_DIR
or the counter is skipped).

THE DRIVER INDEPENDENTLY READS THE COMMITTED RESULT (owner item 3):
the durable findings in goal_runs - asserting the requested payload,
source attribution, and version. Nonempty findings are insufficient;
the payload must match.

Diagnostic-only: counted=false."""
from __future__ import annotations

import io
import json
import os
import sqlite3
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path

WORKTREE = Path("/Users/rushiparikh/projects/atom")
WORKTREE_BACKEND = WORKTREE / "backend"
EVIDENCE_DIR = Path("/tmp/r4_read_recovery_evidence")
TURN_TIMEOUT_S = 600.0
SUBJECT = "6180d83d3"

PIN_PROVIDER = "deepseek"
PIN_MODEL = "deepseek-v4-pro"
PIN_SPEC = f"{PIN_PROVIDER}/{PIN_MODEL}"
DEV_VAULT = WORKTREE_BACKEND / "data" / "byok_keys.json"
DEV_VAULT_KEY = WORKTREE_BACKEND / "data" / "byok_encryption_key"
DEV_VAULT_ENTRY = f"tenant_default_{PIN_PROVIDER}_default_production"

CANVAS_TITLE = "Dunmore quotation (R4 recovery)"
CANVAS_CONTENT = (
    "# Quotation Q-2026-771\n\n"
    "Client: Harlow Mill Robotics\n"
    "Terms: Net 30\n")

WORKBOOK_NAME = "Consolidated Price List 2019.xlsx"
WORKBOOK_ROWS = [
    ("Machine", "Unit price"),
    ("Haas VF-2", 48000.00),
    ("DMG Mori NVX 5100", 96400.00),
    ("Okuma Genos L250", 71250.50),
    ("Mazak QT-250", 63180.00),
    ("Doosan Puma 2100", 58900.00),
    ("Hirobo SST-8", 122750.00),
    ("Chiron FZ16", 88410.25),
    ("Emco HyperTurn 665", 104300.00),
]


def _workbook_bytes() -> bytes:
    import openpyxl

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Prices"
    for row in WORKBOOK_ROWS:
        ws.append(list(row))
    ws.cell(row=14, column=1, value="R4-RECOVERY-771")
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


READ_ASK = (
    "Find the prices for the Haas VF-2, the Mazak QT-250 and the Chiron "
    f"FZ16 in {WORKBOOK_NAME} and list them for me.")

RECOVERY_ASK = (
    "Show me the machine prices you found earlier from the price list.")


def sha_guard() -> dict:
    head = subprocess.run(
        ["git", "-C", str(WORKTREE), "rev-parse", "HEAD"],
        capture_output=True, text=True, timeout=15).stdout.strip()
    dirty = subprocess.run(
        ["git", "-C", str(WORKTREE), "status", "--porcelain",
         "--", "backend/core", "backend/integrations", "backend/api",
         "backend/workers", "backend/tools"],
        capture_output=True, text=True, timeout=15).stdout.splitlines()
    dirty = [l for l in dirty if not l.startswith("??")]
    runtime_ok = not dirty
    # THE INVARIANT on a busy shared tree: the served runtime content
    # must be byte-identical to the pinned commit's runtime paths.
    runtime_identical = not subprocess.run(
        ["git", "-C", str(WORKTREE), "diff", "--stat", SUBJECT, head,
         "--", "backend/core", "backend/integrations", "backend/api",
         "backend/workers", "backend/tools"],
        capture_output=True, text=True, timeout=15).stdout.strip()
    ok = runtime_identical and runtime_ok
    return {"pinned_runtime": SUBJECT, "worktree": str(WORKTREE),
            "worktree_head": head,
            "runtime_dirty_entries": dirty,
            "runtime_identical": runtime_identical,
            "guard_ok": ok}


_GUARD = sha_guard()
if not _GUARD["guard_ok"]:
    print(json.dumps({"fatal": "SHA GUARD FAILED", "guard": _GUARD},
                     indent=1))
    sys.exit(3)

sys.path.insert(0, str(WORKTREE_BACKEND))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402
from scripts.orchestration_acceptance.j4_research import (  # noqa: E402
    _register_local_provider,
)

CRED_SCRUB = {name: "" for name in JR.CREDENTIAL_ENV_NAMES}

OLLAMA_NATIVE = "http://localhost:11434"


def ollama_model_capabilities(model: str) -> dict:
    import httpx

    try:
        r = httpx.post(f"{OLLAMA_NATIVE}/api/show",
                       json={"model": model}, timeout=10,
                       trust_env=False)
        d = r.json() or {}
        caps = d.get("capabilities") or []
        return {"supports_tools": "tools" in caps,
                "context_length": int(d.get("context_length") or 8192)}
    except Exception as exc:  # noqa: BLE001
        return {"reported_error": str(exc), "supports_tools": False,
                "context_length": 8192}


def _dev_pin_key() -> str:
    from cryptography.fernet import Fernet

    store = json.loads(DEV_VAULT.read_text())
    entry = (store.get("keys") or {}).get(DEV_VAULT_ENTRY) or {}
    enc = entry.get("encrypted_key")
    if not enc:
        raise RuntimeError(f"vault entry {DEV_VAULT_ENTRY!r} missing")
    fernet = Fernet(DEV_VAULT_KEY.read_text().strip().encode())
    return fernet.decrypt(enc.encode()).decode()


def _mask_matches(plain: str, masked: str) -> bool:
    masked = str(masked or "")
    if not masked or len(plain) < 8:
        return False
    return plain[:4] in masked and plain[-4:] in masked


def mount_pin_provider(base: str, token: str) -> dict:
    out: dict = {"pin_spec": PIN_SPEC, "cloud_backed": True}
    try:
        plain = _dev_pin_key()
    except Exception as exc:  # noqa: BLE001
        out["error"] = f"pin key unavailable: {type(exc).__name__}: {exc}"
        return out
    stored = JR.auth_post(
        base, token, f"/api/ai/providers/{PIN_PROVIDER}/keys",
        {"api_key": plain, "key_name": "default",
         "environment": "production"})
    out["store_http"] = stored.get("http")
    keys = JR.auth_get(base, token, "/api/ai/keys")
    entries = [k for k in (
        ((keys.get("json") or {}).get("data") or {}).get("keys") or [])
        if str((k or {}).get("provider")) == PIN_PROVIDER]
    out["keys_visible"] = len(entries)
    out["decrypts"] = any(
        _mask_matches(plain, (k or {}).get("masked_key") or "")
        for k in entries)
    return out


def canvas_setup(base: str, token: str) -> dict:
    import httpx

    up = httpx.post(
        f"{base}/api/canvas",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": CANVAS_TITLE, "canvas_type": "document"},
        timeout=60, trust_env=False)
    try:
        upj = up.json()
    except Exception:  # noqa: BLE001
        upj = {}
    out = {"create_http": up.status_code, "canvas_id": upj.get("canvas_id")}
    if not out["canvas_id"]:
        return out
    put = httpx.put(
        f"{base}/api/canvas/{out['canvas_id']}",
        headers={"Authorization": f"Bearer {token}"},
        json=CANVAS_CONTENT, timeout=60, trust_env=False)
    out["seed_http"] = put.status_code
    return out


def read_canvas(base: str, token: str, canvas_id: str) -> dict:
    import httpx

    got = httpx.get(
        f"{base}/api/canvas/{canvas_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=60, trust_env=False)
    try:
        gotj = got.json()
    except Exception:  # noqa: BLE001
        gotj = {}
    content = gotj.get("content") if isinstance(gotj, dict) else None
    body = content.get("content") if isinstance(content, dict) else content
    return {"http": got.status_code, "content": body if isinstance(
        body, str) else json.dumps(body, default=str)[:4000]}


def audit_rows(db_path: Path, canvas_id: str) -> list:
    rows = JR._sqlite_rows(
        db_path,
        "SELECT action_type, created_at FROM canvas_audit "
        "WHERE canvas_id=? ORDER BY created_at, rowid", (canvas_id,))
    return [{"action_type": r[0], "created_at": r[1]} for r in rows]


def _assistant_count(db_path: Path) -> int:
    """ANY assistant row in a fresh world is this turn's delivery (a
    conversation-scoped query with an empty id matches nothing)."""
    rows = JR._sqlite_rows(
        db_path,
        "SELECT COUNT(*) FROM chat_messages WHERE role='assistant'", ())
    return int(rows[0][0] or 0) if rows else 0


def assistant_rows(db_path: Path, session_id: str) -> list:
    rows = JR._sqlite_rows(
        db_path,
        "SELECT content FROM chat_messages WHERE conversation_id=? "
        "AND role='assistant' ORDER BY created_at, rowid", (session_id,))
    return [str(r[0] or "") for r in rows]


def retrieve_operations(db_path: Path) -> list:
    import sqlite3

    try:
        con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        rows = con.execute(
            "SELECT parameters FROM goal_runs ORDER BY created_at"
        ).fetchall()
        con.close()
    except Exception as exc:  # noqa: BLE001
        return [{"read_error": str(exc)}]
    ops: list = []
    for (params,) in rows:
        try:
            tl = (json.loads(params or "{}").get("task_lifecycle") or {})
        except Exception:  # noqa: BLE001
            continue
        for op in tl.get("operations") or []:
            op = op or {}
            if str(op.get("operation_type") or "") != "retrieve":
                continue
            ex = op.get("execution") or {}
            ops.append({
                "operation_id": op.get("operation_id"),
                "status": op.get("status"),
                "invoked": ex.get("invoked"),
                "outcome": ex.get("outcome"),
                "source_version": ex.get("source_version"),
                "findings_count": len(ex.get("findings") or []),
                "requested_head": str(
                    op.get("requested_change") or "")[:100],
            })
    return ops


def source_invocation_events(scratch: Path) -> list:
    """The scratch source-executor counter (owner item 3): every file
    read invocation and completion, keyed to the plan execution."""
    out = []
    f = scratch / "data" / "r4_source_invocations.jsonl"
    if f.exists():
        for line in f.read_text().splitlines():
            try:
                out.append(json.loads(line))
            except Exception:  # noqa: BLE001
                out.append({"raw": line[:120]})
    return out


def session_store_probe(scratch: Path, needle: str) -> list:
    """WHERE did the result survive? File-level grep of the scratch
    world for the marker value (owner item 4)."""
    hits: list = []
    for path in scratch.rglob("*"):
        if path.is_file() and path.suffix in (".json", ".db", ".md",
                                              ".txt"):
            try:
                blob = path.read_bytes()
            except Exception:  # noqa: BLE001
                continue
            if needle.encode() in blob:
                hits.append(str(path))
    return hits


def run_r4() -> dict:
    ev: dict = {"journey": "R4-read-recovery", "subject": SUBJECT,
                "mode": "integrated_main_head",
                "diagnostic_only": True, "counted": False,
                "guard": _GUARD,
                "started_at": time.strftime(
                    "%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())}
    ev["runtime_config"] = {
        "provider_mode": "hybrid (cloud edit-plan rung + local reply lane)",
        "edit_plan_pin": PIN_SPEC,
        "local_only": "false",
        "reply_lane": "product-registered local ollama llama3.1:8b",
        "scratch_instrumentation": (
            "ATOM_R4_DIAG=1 counter (read_invoked/read_completed); "
            "delivery-latch arm removed - the kill-at-completion barrier "
            "replaces it"),
    }
    _extra_env = {"ATOM_LOCAL_ONLY": "false",
                  "OLLAMA_BASE_URL": "http://localhost:11434/v1",
                  "OLLAMA_MODEL": "llama3.1:8b",
                  "ATOM_ASYNC_EDIT_PLAN_MODEL": PIN_SPEC,
                  "ATOM_R4_DIAG": "1",
                  **CRED_SCRUB}
    server = JR.ScratchServer(
        "r4_read_recovery", allowlisted=True, code_export=None,
        extra_env=_extra_env)
    ev["identity"] = server.evidence_identity()
    failed_requests = 0
    try:
        boot = server.up()
        ev["boot"] = {k: boot.get(k) for k in
                      ("booted", "seconds", "git_commit")}
        if not boot.get("booted"):
            raise RuntimeError("server failed to boot")
        user = JR.new_user(server.base)
        ev["user"] = {k: user.get(k) for k in
                      ("registered", "email", "id", "workspace_id")}
        token, uid = user.get("token"), user.get("id")
        if not token:
            raise RuntimeError("register/login failed")
        ev["provider_setup"] = _register_local_provider(
            server.base, token, "llama3.1:8b")
        if not ev["provider_setup"].get("provider_id"):
            raise RuntimeError("local provider registration failed")
        _caps = ollama_model_capabilities("llama3.1:8b")
        ev["ollama_capability_report"] = _caps
        JR.auth_post(
            server.base, token,
            f"/api/local-models/{ev['provider_setup']['provider_id']}"
            f"/capabilities",
            {"model_id": "llama3.1:8b",
             "supports_tools": bool(_caps.get("supports_tools")),
             "supports_vision": False, "supports_reasoning": False,
             "quality_score": 0.9, "speed_score": 0.8,
             "context_window": int(_caps.get("context_length") or 8192)})
        ev["pin_provider_setup"] = mount_pin_provider(server.base, token)
        if not ev["pin_provider_setup"].get("decrypts"):
            raise RuntimeError("pin provider mount failed")
        r1 = server.restart()
        ev["restart_after_pin_store"] = {
            k: r1.get(k) for k in ("booted", "seconds", "restart_number")}
        if not r1.get("booted"):
            raise RuntimeError("restart after pin store failed")

        setup = canvas_setup(server.base, token)
        ev["setup"] = setup
        canvas_id = setup.get("canvas_id")
        if not canvas_id:
            raise RuntimeError("canvas setup failed")

        # THE WORKBOOK through /api/documents/upload (the surface whose
        # ingestion materializes DatasetEntry rows - the planner's
        # named-file resolution catalog).
        import httpx
        up = httpx.post(
            f"{server.base}/api/documents/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (WORKBOOK_NAME, io.BytesIO(
                _workbook_bytes()), "application/vnd.openxmlformats-"
                "officedocument.spreadsheetml.sheet")},
            timeout=120, trust_env=False)
        ev["upload"] = {"http": up.status_code, "name": WORKBOOK_NAME}
        if up.status_code != 200:
            raise RuntimeError(f"upload failed: {up.status_code}")
        # OBSERVABLE CATALOG BARRIER: wait for the DatasetEntry row.
        _cat_deadline = time.monotonic() + 90
        _cat_ok = False
        while time.monotonic() < _cat_deadline:
            _ops = retrieve_operations(server.db_path)
            time.sleep(1)
            _sq = sqlite3.connect(f"file:{server.db_path}?mode=ro",
                                  uri=True)
            try:
                _n = _sq.execute(
                    "SELECT COUNT(*) FROM dataset_entries "
                    "WHERE file_name=? AND status='active'",
                    (WORKBOOK_NAME,)).fetchone()[0]
            except Exception:  # noqa: BLE001
                _n = 0
            finally:
                _sq.close()
            if _n:
                _cat_ok = True
                break
        ev["dataset_catalog"] = {
            "entry_materialized": _cat_ok,
            "entries": _n if _cat_ok else 0,
        }
        if not _cat_ok:
            ev["invalid_reason"] = (
                "workbook ingestion never materialized a DatasetEntry "
                "within 90s - the named-file resolution had no catalog "
                "candidate; attempt diagnostic-invalid")
            ev["pass"] = False
            return ev

        # ---- TURN 1: the read ask, INTERRUPTED AT THE COUNTER EVENT ----
        t0 = time.monotonic()
        result_holder: dict = {}

        def _post_turn1():
            try:
                result_holder["response"] = _hx_post_read(
                    server, token, uid, canvas_id)
            except Exception as exc:  # noqa: BLE001 — the kill ends it
                result_holder["error"] = f"{type(exc).__name__}"

        poster = threading.Thread(target=_post_turn1, daemon=True)
        poster.start()

        # THE BARRIER: poll the attributable source-executor counter for
        # read_completed - the read has RUN - and SIGKILL IMMEDIATELY.
        barrier_deadline = time.monotonic() + 600
        read_completed_seen = False
        delivery_won = False
        completed_event = None
        while time.monotonic() < barrier_deadline:
            events = source_invocation_events(server.scratch)
            completed = [e for e in events
                         if e.get("event") == "read_completed"]
            if completed:
                read_completed_seen = True
                completed_event = completed[-1]
                break
            if _assistant_count(server.db_path) > 0:
                delivery_won = True
                break
            time.sleep(0.05)
        wait_s = round(time.monotonic() - t0, 1)
        ev["barrier"] = {
            "read_completed_seen": read_completed_seen,
            "delivery_won": delivery_won,
            "wait_s": wait_s,
        }
        if delivery_won and not read_completed_seen:
            assistants_won = assistant_rows(server.db_path, "")
            ev["turn1_delivered_reply"] = assistants_won[-1][:400] if \
                assistants_won else None
            ev["invalid_reason"] = (
                "delivery won the race before the read completed - attempt "
                "diagnostic-invalid, retained")
            ev["pass"] = False
            return ev
        if not read_completed_seen:
            ev["invalid_reason"] = (
                "neither the read completion nor a delivery appeared "
                "within the barrier window - attempt diagnostic-invalid, "
                "retained")
            ev["pass"] = False
            return ev
        # SIGKILL IMMEDIATELY: the findings are settled into the
        # lifecycle op by the completing turn before delivery renders -
        # the kill lands at the proven retrieved-not-delivered boundary.
        server.proc.kill()
        server.proc.wait(timeout=15)
        kill_s = round(time.monotonic() - t0, 1)
        ev["kill"] = {"signal": "SIGKILL", "at_s": kill_s,
                      "after_read_completed": True}
        try:
            ev["world_log_at_kill"] = server.log_tail()[-4000:]
        except Exception:  # noqa: BLE001
            pass

        # POST-KILL: no assistant delivery persisted; the durable
        # findings in goal_runs carry the payload + attribution +
        # version (verified, not assumed).
        assistants_after = assistant_rows(server.db_path, "")
        ev["post_kill"] = {
            "assistant_rows": len(assistants_after),
            "no_delivery_persisted": len(assistants_after) == 0,
            "retrieve_ops": retrieve_operations(server.db_path),
        }
        findings_committed = [op for op in ev["post_kill"]["retrieve_ops"]
                              if op.get("findings_count")]
        ev["initial_read_proven"] = bool(
            read_completed_seen
            and ev["post_kill"]["no_delivery_persisted"]
            and findings_committed)

        # ---- RECOVERY TURN (after restart) ----
        r2 = server.restart()
        ev["restart_before_recovery"] = {
            k: r2.get(k) for k in ("booted", "seconds", "restart_number")}
        if not r2.get("booted"):
            raise RuntimeError("the recovery restart failed")
        ev["durable_after_restart"] = {
            "retrieve_ops": retrieve_operations(server.db_path),
            "assistant_rows": _assistant_count(server.db_path),
        }

        rec = JR.auth_post(
            server.base, token, "/api/chat/message",
            {"message": RECOVERY_ASK, "user_id": uid,
             "request_id": str(uuid.uuid4()), "session_id": sid,
             "context": {"canvas": {"id": canvas_id,
                                    "canvas_type": "document",
                                    "name": CANVAS_TITLE}}},
            timeout_s=TURN_TIMEOUT_S)
        recj = rec.get("json") or {}
        recovery_reply = str(recj.get("message") or "")
        failed = bool(rec["http"] >= 400 or recj.get("success") is False)
        if failed:
            failed_requests += 1
        time.sleep(5)
        ops_after = retrieve_operations(server.db_path)
        invocations_after = source_invocation_events(server.scratch)
        facts = ("48,000.00" in recovery_reply
                 or "Haas VF-2" in recovery_reply
                 or "96,400.00" in recovery_reply)
        artifact_after = read_canvas(server.base, token, canvas_id)
        ev["recovery_turn"] = {
            "success": recj.get("success"),
            "outcome": recj.get("outcome"),
            "error_code": recj.get("error_code"),
            "message_head": recovery_reply[:300],
            "failed_request": failed,
            "facts_rendered": facts,
        }
        recovery_checks = {
            "turn_success": recj.get("success") is True,
            "stored_facts_rendered": facts,
            "no_new_source_invocations": len(invocations_after) == 0,
            "no_second_retrieve_op": len(ops_after) == len(
                ev["post_kill"]["retrieve_ops"]),
            "artifact_untouched": (artifact_after.get("content")
                                   == CANVAS_CONTENT),
        }
        ev["recovery_checks"] = recovery_checks

        # ---- REPEATED RECOVERY (idempotency) ----
        again = JR.auth_post(
            server.base, token, "/api/chat/message",
            {"message": "Show me that price list result again.",
             "user_id": uid, "request_id": str(uuid.uuid4()),
             "session_id": sid,
             "context": {"canvas": {"id": canvas_id,
                                    "canvas_type": "document",
                                    "name": CANVAS_TITLE}}},
            timeout_s=TURN_TIMEOUT_S)
        againj = again.get("json") or {}
        time.sleep(5)
        invocations_final = source_invocation_events(server.scratch)
        assistants_final = _assistant_count(server.db_path)
        ev["idempotency"] = {
            "assistant_rows_final": assistants_final,
            "assistant_rows_after_recovery": _assistant_count(
                server.db_path),
            "source_invocations_final": len(invocations_final),
            "no_new_source_invocations": (
                len(invocations_final) == 0),
        }

        ev["failed_request_count"] = failed_requests
        ev["assertions"] = {
            "R4.read_completed_then_killed": bool(
                read_completed_seen
                and ev["post_kill"]["no_delivery_persisted"]
                and findings_committed),
            "R4.recovery_renders_stored_facts_no_new_source": all(
                recovery_checks.values()),
            "R4.repeated_recovery_idempotent": all(
                ev["idempotency"].values()),
        }
        ev["pass"] = all(ev["assertions"].values())
        return ev
    except Exception as exc:  # noqa: BLE001 — the evidence IS the record
        ev["error"] = f"{type(exc).__name__}: {exc}"
        try:
            ev.setdefault("log_tails", {})["fatal"] = "\n".join(
                (server.log_tail() or "").splitlines()[-400:])
        except Exception:  # noqa: BLE001
            pass
        ev["pass"] = False
        return ev
    finally:
        try:
            server.down()
        except Exception:  # noqa: BLE001
            pass


def _hx_post_read(server, token, uid, canvas_id):
    import httpx

    return httpx.post(
        f"{server.base}/api/chat/message",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": READ_ASK, "user_id": uid,
              "request_id": str(uuid.uuid4()),
              "context": {"canvas": {"id": canvas_id,
                                     "canvas_type": "document",
                                     "name": CANVAS_TITLE}}},
        timeout=600.0, trust_env=False)


def main() -> int:
    ev = run_r4()
    EVIDENCE_DIR.mkdir(exist_ok=True)
    out = EVIDENCE_DIR / (
        f"r4_read_recovery_{time.strftime('%Y%m%d_%H%M%S')}_"
        f"{uuid.uuid4().hex[:6]}.json")
    out.write_text(json.dumps(ev, indent=2, default=str))
    print(f"evidence: {out}")
    print(json.dumps({
        "journey": ev.get("journey"),
        "pass": ev.get("pass"),
        "error": ev.get("error"),
        "assertions": ev.get("assertions"),
        "barrier": ev.get("barrier"),
        "failed_request_count": ev.get("failed_request_count"),
    }, indent=1, default=str))
    return 0 if ev.get("pass") else 1


if __name__ == "__main__":
    sys.exit(main())
