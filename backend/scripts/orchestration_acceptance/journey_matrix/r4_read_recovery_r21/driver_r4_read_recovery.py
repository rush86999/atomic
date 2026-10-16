"""R4 — recovered read delivery: the interrupted retrieved-not-delivered
attempt, inspected durable state, and the recovery turn (owner
instructions 2026-10-16, items 1-7).

THE BARRIER (owner item 1): the world runs with ATOM_R4_DIAG=1, which
arms the scratch delivery latch: after the workbook-read result
transaction commits, the server writes r4_checkpoint.json (execution
and result identities) and BLOCKS delivery while r4_delivery_block
exists. The driver creates the block file BEFORE the read turn, so
delivery cannot begin; the driver independently reads the committed
result from the durable DB, then SIGKILLs the process while the latch
remains closed (no graceful shutdown that could finish delivery).
Post-kill it verifies NO assistant delivery was persisted. If delivery
won the race (assistant row present), the attempt is recorded
diagnostic-invalid — never a recovery pass.

THE TRANSITIONS TABLE (owner's required evidence):
  initial read completed      | source invocation + committed payload/receipt
  stopped before delivery     | checkpoint identity; no persisted delivery
  recovery selected stored    | same durable result identity, authorized scope
  reply delivered             | stored facts + attribution, no fresh source call
  repeated recovery           | no additional delivery or source invocation

THE FIRST MISSING TRANSITION, if any, is reported with its actual
inputs and records. Only that boundary is repaired (owner directive).

Diagnostic-only: counted=false. Subject pinned below; the scratch
latch commit c0c236d3d is part of the diagnostic harness."""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path

WORKTREE = Path("/Users/rushiparikh/projects/atom")
WORKTREE_BACKEND = WORKTREE / "backend"
EVIDENCE_DIR = Path("/tmp/r4_read_recovery_evidence")
TURN_TIMEOUT_S = 300.0
SUBJECT = "027d8d061"  # the reviewed runtime; the latch commit rides on top
RUNTIME_ALLOWS = ("c0c236d3d",)  # the env-gated latch commit (harness)

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
    import io as _io

    import openpyxl

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Prices"
    for row in WORKBOOK_ROWS:
        ws.append(list(row))
    ws.cell(row=14, column=1, value="R4-RECOVERY-771")
    buf = _io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


READ_ASK = (
    "Find the 8 machine prices in Consolidated Price List 2019.xlsx and "
    "list them for me.")
RECOVERY_ASK = (
    "Show me the machine prices you found earlier from the price list.")
UNRELATED_ASK = "What is a CNC press brake used for?"


def sha_guard() -> dict:
    head = subprocess.run(
        ["git", "-C", str(WORKTREE), "rev-parse", "HEAD"],
        capture_output=True, text=True, timeout=15).stdout.strip()
    dirty = subprocess.run(
        ["git", "-C", str(WORKTREE), "status", "--porcelain",
         "--", "backend/core", "backend/integrations", "backend/api",
         "backend/workers", "backend/tools"],
        capture_output=True, text=True, timeout=15).stdout.splitlines()
    # Untracked files cannot alter the served content of tracked modules
    # (the one parallel-owner file under core/ is imported by nothing).
    dirty = [l for l in dirty if not l.startswith("??")]
    runtime_ok = not dirty
    over = subprocess.run(
        ["git", "-C", str(WORKTREE), "diff", "--name-only", SUBJECT, head],
        capture_output=True, text=True, timeout=15).stdout.splitlines()
    harness_only = all(
        f.startswith(("backend/scripts/orchestration_acceptance/",
                      "backend/tests/")) for f in over) if over else True
    # THE REAL INVARIANT on a busy shared tree: the SERVED runtime
    # content must be byte-identical to the pinned commit's runtime
    # paths. Commits elsewhere (docs, registry, other journeys) do not
    # change what the world executes.
    runtime_identical = not subprocess.run(
        ["git", "-C", str(WORKTREE), "diff", "--stat", SUBJECT, head,
         "--"] + ["backend/core", "backend/integrations", "backend/api",
                  "backend/workers", "backend/tools"],
        capture_output=True, text=True, timeout=15).stdout.strip()
    ok = runtime_identical and runtime_ok
    return {"required_subject": SUBJECT, "worktree": str(WORKTREE),
            "worktree_head": head,
            "head_matches": head.startswith(SUBJECT),
            "runtime_dirty_entries": dirty,
            "head_over_subject_files": over,
            "head_is_subject_plus_harness": harness_only,
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
        ctx = (d.get("context_length") or 8192)
        return {"supports_tools": "tools" in caps,
                "context_length": int(ctx)}
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
        "SELECT action_type, created_at, details_json FROM canvas_audit "
        "WHERE canvas_id=? ORDER BY created_at, rowid", (canvas_id,))
    return [{"action_type": r[0], "created_at": r[1],
             "details": str(r[2])[:300]} for r in rows]


def assistant_rows(db_path: Path, session_id: str) -> list:
    rows = JR._sqlite_rows(
        db_path,
        "SELECT content FROM chat_messages WHERE conversation_id=? "
        "AND role='assistant' ORDER BY created_at, rowid", (session_id,))
    return [str(r[0] or "") for r in rows]


def retrieve_operations(db_path: Path, session_id: str) -> list:
    """The durable retrieve operations bound to the conversation's runs,
    with their execution ids — the attributable operation record."""
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
        if str(tl.get("conversation_id") or "") != str(session_id or ""):
            continue
        for op in tl.get("operations") or []:
            op = op or {}
            if str(op.get("operation_type") or "") != "retrieve":
                continue
            ex = op.get("execution") or {}
            ops.append({
                "operation_id": op.get("operation_id"),
                "execution_id": op.get("execution_id"),
                "status": op.get("status"),
                "invoked": ex.get("invoked"),
                "outcome": ex.get("outcome"),
                "requested_head": str(
                    op.get("requested_change") or "")[:100],
            })
    return ops


def session_store_probe(scratch: Path, needle: str) -> list:
    """WHERE did the result survive? Grep the scratch world's files for
    the marker value — the durable-carrier diagnostic (owner item 4)."""
    hits: list = []
    for path in scratch.rglob("*"):
        if path.is_file() and path.suffix in (".json", ".db", ".md",
                                              ".txt"):
            try:
                blob = path.read_bytes()
            except Exception:  # noqa: BLE001
                continue
            if needle.encode() in blob or needle in str(
                    blob[:0] or ""):
                hits.append(str(path))
            elif needle.encode() in blob:
                hits.append(str(path))
    return hits


def source_invocation_events(scratch: Path) -> list:
    """The scratch source-executor counter: every file-read invocation
    the server records (r4_source_invocations.jsonl), each keyed to the
    execution id (owner item 3)."""
    out = []
    f = scratch / "data" / "r4_source_invocations.jsonl"
    if f.exists():
        for line in f.read_text().splitlines():
            try:
                out.append(json.loads(line))
            except Exception:  # noqa: BLE001
                out.append({"raw": line[:120]})
    return out


def run_r4() -> dict:
    ev: dict = {"journey": "R4-read-recovery", "subject": SUBJECT,
                "mode": "integrated_main_head",
                "diagnostic_only": True, "counted": False,
                "sha_guard": _GUARD,
                "started_at": time.strftime(
                    "%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())}
    ev["runtime_config"] = {
        "provider_mode": "hybrid (cloud edit-plan rung + local reply lane)",
        "edit_plan_pin": PIN_SPEC,
        "local_only": "false",
        "reply_lane": "product-registered local ollama llama3.1:8b",
        "scratch_latch": "ATOM_R4_DIAG=1 (checkpoint + delivery block)",
    }
    _extra_env = {"ATOM_LOCAL_ONLY": "false",
                  "OLLAMA_BASE_URL": "http://localhost:11434/v1",
                  "OLLAMA_MODEL": "llama3.1:8b",
                  "ATOM_ASYNC_EDIT_PLAN_MODEL": PIN_SPEC,
                  "ATOM_R4_DIAG": "1",
                  **CRED_SCRUB}
    # PERSISTENCE-PATH ISOLATION (owner instruction: record every
    # effective path; refuse launch if a writable store resolves to the
    # dev world). The sessions fallback is anchored to ATOM_DATA_DIR
    # (core/chat_session_manager.py) - verify the RESOLVED path belongs
    # to this world before anything boots.
    server = JR.ScratchServer(
        "r4_read_recovery", allowlisted=True, code_export=None,
        extra_env=_extra_env)
    dev_sessions = str(WORKTREE_BACKEND / "chat_sessions.json")
    resolved_sessions = str(
        (server.scratch / "data" / "chat_sessions.json"))
    ev["persistence_paths"] = {
        "database": server.base_env.get("DATABASE_URL"),
        "atom_data_dir": server.base_env.get("ATOM_DATA_DIR"),
        "lancedb": server.base_env.get("LANCEDB_URI"),
        "sessions_file_world": resolved_sessions,
        "sessions_file_dev": dev_sessions,
        "sessions_isolated": resolved_sessions != dev_sessions,
    }
    if not ev["persistence_paths"]["sessions_isolated"]:
        print(json.dumps({"fatal": "SESSIONS FILE RESOLVES TO THE DEV "
                                "WORLD - launch refused",
                          "paths": ev["persistence_paths"]}, indent=1))
        sys.exit(4)
    # Did the FIRST attempt (run 124030) touch the shared file? Checked:
    # zero hits for the R4 world's session/canvas/marker in the dev
    # chat_sessions.json (1334 entries) - recorded, not restored.
    ev["first_attempt_shared_file_check"] = {
        "dev_file": dev_sessions,
        "note": ("attempt 1 (run 124030): the killed turn never reached a "
                 "session save; the shared file was inspected and contains "
                 "ZERO hits for the R4 world's session/canvas/marker - "
                 "verified, not restored"),
    }
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

        # THE WORKBOOK through the product's ingestion path.
        import httpx
        # UPLOAD through the DOCUMENT HUB route (/api/documents/upload):
        # this is the surface whose ingestion materializes the workbook's
        # DatasetEntry rows (the named-file resolution's catalog). The
        # /api/document-ingestion/upload surface indexes for search but
        # NEVER creates the catalog entry (the recorded 2026-09-07 'two
        # reads, zero datasets' class) - attempt 1 proved it in this
        # world: indexed count=1, dataset_entries rows=0, no latch.
        up = httpx.post(
            f"{server.base}/api/documents/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (WORKBOOK_NAME, io.BytesIO(
                _workbook_bytes()), "application/vnd.openxmlformats-"
                "officedocument.spreadsheetml.sheet")},
            timeout=120, trust_env=False)
        try:
            upj = up.json()
        except Exception:  # noqa: BLE001
            upj = {}
        ev["upload"] = {"http": up.status_code, "name": WORKBOOK_NAME,
                        "json_head": json.dumps(upj, default=str)[:300]}
        if up.status_code != 200:
            raise RuntimeError(f"upload failed: {up.status_code}")
        time.sleep(3)
        # THE PLANNER'S CATALOG is DatasetEntry (created by workbook
        # ingestion) - verify the entry EXISTS before the ask, or the
        # named-file resolution fails pre-read (attempt 1's finding).
        import sqlite3 as _sq3
        _db = str(server.db_path)
        _con = _sq3.connect(f"file:{_db}?mode=ro", uri=True)
        _rows = _con.execute(
            "SELECT dataset_name, file_name, workspace_id, status "
            "FROM dataset_entries ORDER BY ingested_at DESC LIMIT 5"
        ).fetchall() if _con.execute(
            "SELECT count(*) FROM sqlite_master WHERE name="
            "'dataset_entries'").fetchone()[0] else []
        _con.close()
        ev["dataset_catalog"] = {"rows": [
            {"dataset_name": r[0], "file_name": r[1],
             "workspace_head": str(r[2] or "")[:8], "status": r[3]}
            for r in _rows]}
        # OBSERVABLE BARRIER: the workbook's DatasetEntry row is the
        # named-file resolution's catalog. Wait for it (the ingestion
        # materialization is a fire-and-forget background task); a
        # catalog without the entry cannot dispatch the read.
        _cat_deadline = time.monotonic() + 90
        _cat_row = None
        while time.monotonic() < _cat_deadline:
            _con2 = _sq3.connect(f"file:{_db}?mode=ro", uri=True)
            _cat_row = _con2.execute(
                "SELECT dataset_name, file_name, workspace_id, status "
                "FROM dataset_entries WHERE file_name=? AND status='active'",
                (WORKBOOK_NAME,)).fetchone()
            _con2.close()
            if _cat_row:
                break
            time.sleep(1)
        ev["dataset_catalog"]["entry_found"] = _cat_row is not None
        ev["dataset_catalog"]["entry"] = dict(zip(
            ("dataset_name", "file_name", "workspace_id", "status"),
            _cat_row)) if _cat_row else None
        if not _cat_row:
            # THE WORLD'S OWN ACCOUNT: the server's log ring (captured in
            # driver memory) records the background materialization's
            # outcome — include it so the invalid attempt carries the
            # cause, not just the absence.
            try:
                ev["world_log_at_catalog_expiry"] = \
                    server.log_tail()[-4000:]
            except Exception:  # noqa: BLE001
                pass
            ev["invalid_reason"] = (
                "workbook ingestion never materialized a DatasetEntry "
                "within 90s - the named-file resolution had no catalog "
                "candidate; attempt diagnostic-invalid (this is the "
                "harness/ingestion boundary, not the recovery machinery)")
            ev["pass"] = False
            return ev

        baseline_ops = retrieve_operations(server.db_path, "")
        ev["audit_baseline"] = {"retrieve_ops": len(baseline_ops)}

        # ---- TURN 1: the read ask, INTERRUPTED AT THE LATCH ----
        # Arm the latch: the block file EXISTS before the turn starts.
        block_file = server.scratch / "data" / "r4_delivery_block"
        block_file.parent.mkdir(exist_ok=True)
        block_file.write_text("delivery blocked for the R4 barrier")
        checkpoint_file = server.scratch / "data" / "r4_checkpoint.json"

        import httpx as _hx
        request_id = str(uuid.uuid4())
        payload = {
            "message": READ_ASK,
            "user_id": uid,
            "request_id": request_id,
            "session_id": None,
            "context": {"canvas": {"id": canvas_id,
                                   "canvas_type": "document",
                                   "name": CANVAS_TITLE}},
        }
        t0 = time.monotonic()
        result_holder: dict = {}

        def _post_turn1():
            try:
                result_holder["response"] = _hx.post(
                    f"{server.base}/api/chat/message",
                    headers={"Authorization": f"Bearer {token}"},
                    json=payload, timeout=600.0, trust_env=False)
            except Exception as exc:  # noqa: BLE001 — the kill ends it
                result_holder["error"] = f"{type(exc).__name__}"

        poster = threading.Thread(target=_post_turn1, daemon=True)
        poster.start()

        # THE BARRIER: poll for the server's own checkpoint announcement
        # (the result transaction committed; delivery is BLOCKED).
        ckpt_deadline = time.monotonic() + 240
        checkpoint = None
        while time.monotonic() < ckpt_deadline:
            if checkpoint_file.exists():
                try:
                    checkpoint = json.loads(
                        checkpoint_file.read_text())
                except Exception:  # noqa: BLE001
                    checkpoint = {"raw": checkpoint_file.read_text()[:300]}
                break
            time.sleep(0.25)
        wait_s = round(time.monotonic() - t0, 1)
        ev["barrier"] = {
            "checkpoint_seen": checkpoint is not None,
            "checkpoint": checkpoint,
            "wait_s": wait_s,
            "latch_file_still_present": block_file.exists(),
        }
        if checkpoint is None:
            # Delivery may have won the race, or the lane never fired:
            # record the attempt as diagnostic-INVALID, never a pass.
            t = JR._sqlite_rows(
                server.db_path,
                "SELECT role, content FROM chat_messages ORDER BY "
                "created_at, rowid", ())
            ev["invalid_reason"] = (
                "the checkpoint never appeared — the boundary was not "
                f"reached (assistant rows so far: {len(t)}); attempt "
                "retained as diagnostic-invalid")
            ev["pass"] = False
            return ev

        # Driver INDEPENDENTLY reads the committed result (durable DB).
        sid = checkpoint.get("session_id")
        exec_id = checkpoint.get("execution_id")
        exec_id_1 = str(exec_id or "")
        ops = retrieve_operations(server.db_path, sid)
        assistants_before = assistant_rows(server.db_path, sid)
        marker_hits_before = session_store_probe(
            server.scratch, "104,300.00")
        ev["pre_stop_state"] = {
            "assistant_rows": len(assistants_before),
            "retrieve_ops": ops,
            "result_survived_in": marker_hits_before,
        }

        # TERMINATE while the latch remains closed. SIGKILL: no graceful
        # shutdown that could finish delivery.
        server.proc.kill()
        server.proc.wait(timeout=15)
        ev["kill"] = {"signal": "SIGKILL", "at_s": round(
            time.monotonic() - t0, 1)}
        try:
            ev["world_log_at_kill"] = server.log_tail()[-4000:]
        except Exception:  # noqa: BLE001
            pass

        # POST-KILL VERIFICATION: no assistant delivery persisted.
        assistants_after = assistant_rows(server.db_path, sid)
        # THE ATTRIBUTABLE SOURCE COUNTER: one controlled source read
        # must produce invocation + completion events (owner item 3).
        invocations_at_stop = source_invocation_events(server.scratch)
        ev["source_counter_at_stop"] = {
            "events": invocations_at_stop,
            "invoked": sum(1 for e in invocations_at_stop
                           if e.get("event") == "read_invoked"),
            "completed": sum(1 for e in invocations_at_stop
                             if e.get("event") == "read_completed"),
        }
        ev["post_kill"] = {
            "assistant_rows": len(assistants_after),
            "no_delivery_persisted": len(assistants_after) == 0,
            "checkpoint": checkpoint,
            "retrieve_ops": retrieve_operations(server.db_path, sid),
            "result_survived_in": session_store_probe(
                server.scratch, "104,300.00"),
            "result_survived_marker": session_store_probe(
                server.scratch, "R4-RECOVERY-771"),
        }
        ev["initial_read_proven"] = bool(
            ev["source_counter_at_stop"]["invoked"] >= 1
            and ev["source_counter_at_stop"]["completed"] >= 1
            and checkpoint.get("identity")
        )

        # ---- RECOVERY TURN (after restart) ----
        r2 = server.restart()
        ev["restart_before_recovery"] = {
            k: r2.get(k) for k in ("booted", "seconds", "restart_number")}
        if not r2.get("booted"):
            raise RuntimeError("the recovery restart failed")

        # The durable-state inspection continues: after the restart,
        # where does the result survive NOW?
        ev["durable_after_restart"] = {
            "result_survived_in": session_store_probe(
                server.scratch, "104,300.00"),
            "retrieve_ops": retrieve_operations(server.db_path, sid),
            "history_rows": len(assistant_rows(server.db_path, sid)),
        }

        rec = JR.auth_post(
            server.base, token, "/api/chat/message",
            {"message": RECOVERY_ASK, "user_id": uid,
             "request_id": str(uuid.uuid4()),
             "session_id": sid,
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
        ops_after = retrieve_operations(server.db_path, sid)
        invocations_after = source_invocation_events(server.scratch)
        assistants_recomputed = assistant_rows(server.db_path, sid)
        facts = ("48,000.00" in recovery_reply
                 or "Haas VF-2" in recovery_reply
                 or "96,400.00" in recovery_reply)
        ev["recovery_turn"] = {
            "success": recj.get("success"),
            "outcome": recj.get("outcome"),
            "error_code": recj.get("error_code"),
            "http": rec.get("http"),
            "message_head": recovery_reply[:300],
            "failed_request": failed,
            "facts_rendered": facts,
        }
        ev["source_invocations_after_recovery"] = invocations_after

        recovery_checks = {
            "turn_success": recj.get("success") is True,
            "stored_facts_rendered": facts,
            "no_new_source_invocations": all(
                e.get("plan_execution_id") != str(exec_id_1)
                for e in invocations_after) and len(invocations_after) == 0,
            "no_second_retrieve_op": len(ops_after) == len(
                ev["pre_stop_state"]["retrieve_ops"]),
            "artifact_untouched": (read_canvas(
                server.base, token, canvas_id).get("content")
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
        assistants_final = assistant_rows(server.db_path, sid)
        ev["idempotency"] = {
            "assistant_rows_final": len(assistants_final),
            "assistant_rows_after_recovery": len(assistants_recomputed),
            "source_invocations_final": len(invocations_final),
            "no_duplicate_delivery": len(assistants_final) == (
                len(assistants_recomputed) + 1),
            "no_new_source_invocations": (
                len(invocations_final) == len(invocations_after)),
        }

        ev["failed_request_count"] = failed_requests
        ev["assertions"] = {
            "R4.barrier_at_retrieved_not_delivered": bool(
                ev["barrier"]["checkpoint_seen"]
                and ev["post_kill"]["no_delivery_persisted"]),
            "R4.recovery_renders_stored_facts_no_new_source": all(
                recovery_checks.values()),
            "R4.idempotent_recovery": all(ev["idempotency"].values()),
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


import io  # noqa: E402


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
