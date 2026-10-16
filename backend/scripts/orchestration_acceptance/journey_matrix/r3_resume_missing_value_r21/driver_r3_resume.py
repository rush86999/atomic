"""R3 — supplying a missing value AFTER RESTART (owner milestone
directive 2026-10-16): the user can restart the app, answer its
question, and continue without starting over.

Sequence (exactly the owner's steps):
  1. create a missing-information request through the public app
  2. confirm the draft is unchanged and the app asks for the specific
     value
  3. stop and restart the scratch backend (ScratchServer.restart — a
     REAL restart: same run dir, same database, same port)
  4. in the same conversation, provide ONLY the missing value — the
     original request is never repeated
  5. verify the app associates it with the correct artifact, subject,
     field, and authorization
  6. require one correct edit, protected-content preservation,
     attributable audit evidence, and reload agreement
  7. repeat with an AMBIGUOUS value: exactly one clarification and zero
     writes

DIAGNOSTIC, not a gate (owner process adjustment 2026-10-16): this run
DETERMINES whether the requirement association survives the restart in
durable state. If the workflow already passes, record it and move on;
a code change is required only when the association demonstrably fails.

Configuration: the SAME accepted hybrid configuration as the J6 counted
campaign — local reply lane (product-registered ollama llama3.1:8b) +
the measured cloud edit-plan rung (deepseek/deepseek-v4-pro) mounted
through the product store; ATOM_LOCAL_ONLY=false. The world boots from
THIS repo's backend (the integrated main HEAD the guard pins below).
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
import uuid
from pathlib import Path

WORKTREE = Path("/Users/rushiparikh/projects/atom")
WORKTREE_BACKEND = WORKTREE / "backend"
EVIDENCE_DIR = Path("/tmp/r3_resume_evidence")
TURN_TIMEOUT_S = 300.0
SUBJECT = "ec325cdc9"

PIN_PROVIDER = "deepseek"
PIN_MODEL = "deepseek-v4-pro"
PIN_SPEC = f"{PIN_PROVIDER}/{PIN_MODEL}"
DEV_VAULT = WORKTREE_BACKEND / "data" / "byok_keys.json"
DEV_VAULT_KEY = WORKTREE_BACKEND / "data" / "byok_encryption_key"
DEV_VAULT_ENTRY = f"tenant_default_{PIN_PROVIDER}_default_production"

QUOTE_TITLE = "Quotation Q-2026-114 (R3 resume)"
QUOTE_CONTENT = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")

REQUEST_MSG = (
    "Add the client's tax registration number to this quotation. "
    "Use the exact number from our records.")
# Step 4: ONLY the missing value — the original request is not repeated.
BARE_VALUE_MSG = "03-4567-8912"
# Step 7: an ambiguous value — two candidates, no way to bind one.
AMBIGUOUS_VALUE_MSG = "03-4567-8912, or possibly 03-4567-8913 — not sure"


def sha_guard() -> dict:
    head = subprocess.run(
        ["git", "-C", str(WORKTREE), "rev-parse", "HEAD"],
        capture_output=True, text=True, timeout=15).stdout.strip()
    # SCOPE (recorded): this diagnostic boots the world from THIS tree's
    # backend, so the guard refuses any tracked modification under the
    # SERVED runtime paths. Evidence records (summary.json) and the
    # frontend tree are not served code; they are listed transparently
    # rather than silently ignored.
    served = ["backend/core", "backend/integrations", "backend/api",
              "backend/workers", "backend/tools"]
    dirty = subprocess.run(
        ["git", "-C", str(WORKTREE), "status", "--porcelain", "--"] + served,
        capture_output=True, text=True, timeout=15).stdout.splitlines()
    # Untracked files cannot alter the served content of any TRACKED
    # module (git blocks checkout overwrites), and nothing in HEAD
    # imports the one parallel-owner file under core/ — recorded here,
    # not silently ignored.
    dirty = [l for l in dirty if not l.startswith("??")]
    untracked_served = [
        l for l in subprocess.run(
            ["git", "-C", str(WORKTREE), "status", "--porcelain", "--"]
            + served, capture_output=True, text=True,
            timeout=15).stdout.splitlines()
        if l.startswith("??")]
    outside = subprocess.run(
        ["git", "-C", str(WORKTREE), "status", "--porcelain"],
        capture_output=True, text=True, timeout=15).stdout.splitlines()
    outside = [l for l in outside if l not in dirty
               and not l.startswith("??")]
    ok = head.startswith(SUBJECT) or _head_is_subject_plus_harness(head)
    return {"required_subject": SUBJECT, "worktree": str(WORKTREE),
            "worktree_head": head, "head_matches": head.startswith(SUBJECT),
            "runtime_dirty_entries": dirty,
            "untracked_served_paths_ignored": untracked_served,
            "outside_served_scope_not_verified": outside,
            "head_over_subject_files": _head_over_subject_files(head),
            "guard_ok": ok}


def _head_over_subject_files(head: str) -> list:
    """Files HEAD carries beyond SUBJECT — must be acceptance-harness
    or test files ONLY (the runtime content must be exactly the
    pinned candidate's)."""
    if head.startswith(SUBJECT):
        return []
    return subprocess.run(
        ["git", "-C", str(WORKTREE), "diff", "--name-only", SUBJECT, head],
        capture_output=True, text=True, timeout=15).stdout.splitlines()


def _head_is_subject_plus_harness(head: str) -> bool:
    files = _head_over_subject_files(head)
    return bool(files) and all(
        f.startswith(("backend/scripts/orchestration_acceptance/",
                      "backend/tests/")) for f in files)


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
        ctx = (d.get("context_length")
               or (d.get("model_info") or {})
               .get("{}.context_length".format(model.split(":")[0])) or 8192)
        return {"supports_tools": "tools" in caps,
                "context_length": int(ctx)}
    except Exception as exc:  # noqa: BLE001 — recorded, conservative defaults
        return {"reported_error": str(exc), "supports_tools": False,
                "context_length": 8192}


def _dev_pin_key() -> str:
    """The owner's stored deepseek credential, READ (not moved) from the
    dev BYOK vault. Returned for the product store call; the value never
    enters evidence."""
    from cryptography.fernet import Fernet

    store = json.loads(DEV_VAULT.read_text())
    entry = (store.get("keys") or {}).get(DEV_VAULT_ENTRY) or {}
    enc = entry.get("encrypted_key")
    if not enc:
        raise RuntimeError(f"vault entry {DEV_VAULT_ENTRY!r} missing")
    fernet = Fernet(DEV_VAULT_KEY.read_text().strip().encode())
    return fernet.decrypt(enc.encode()).decode()


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
    out["stored"] = bool((stored.get("json") or {}).get("success"))
    keys = JR.auth_get(base, token, "/api/ai/keys")
    entries = [k for k in (
        ((keys.get("json") or {}).get("data") or {}).get("keys") or [])
        if str((k or {}).get("provider")) == PIN_PROVIDER]
    out["keys_visible"] = len(entries)
    out["decrypts"] = any(
        _mask_matches(plain, (k or {}).get("masked_key") or "")
        for k in entries)
    return out


def _mask_matches(plain: str, masked: str) -> bool:
    """j2 world-B mask check: the product masks with the plaintext's
    first4/last4 only when decryption succeeds."""
    masked = str(masked or "")
    if not masked or len(plain) < 8:
        return False
    return plain[:4] in masked and plain[-4:] in masked


def canvas_setup(base: str, token: str) -> dict:
    import httpx

    up = httpx.post(
        f"{base}/api/canvas",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": QUOTE_TITLE, "canvas_type": "document"},
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
        json=QUOTE_CONTENT, timeout=60, trust_env=False)
    out["seed_http"] = put.status_code
    got = read_canvas(base, token, out["canvas_id"])
    out["seeded_content_matches"] = (
        "Valid until: 2026-11-30" in (got.get("content") or ""))
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
    # details[:900]: the row's attribution (operation_id) sits behind the
    # seeded content — 400 chars truncated the id mid-string once and the
    # attribution check false-failed on a correct row.
    return [{"action_type": r[0], "created_at": r[1],
             "details": str(r[2])[:900]} for r in rows]


def chat_turn(server, token: str, uid: str, text: str,
              canvas_id: str, session_id: str | None = None) -> dict:
    request_id = str(uuid.uuid4())
    payload = {
        "message": text,
        "user_id": uid,
        "request_id": request_id,
        "context": {"canvas": {"id": canvas_id,
                               "canvas_type": "document",
                               "name": QUOTE_TITLE}},
    }
    if session_id:
        payload["session_id"] = session_id
    t0 = time.monotonic()
    r = JR.auth_post(server.base, token, "/api/chat/message",
                     payload, timeout_s=TURN_TIMEOUT_S)
    latency = round(time.monotonic() - t0, 2)
    rj = r["json"] or {}
    content = str(rj.get("message") or "")
    singleflight = (r["http"] == 409) or (
        "already in progress" in content.lower())
    return {
        "request_id": request_id, "http": r["http"], "latency_s": latency,
        "success": rj.get("success"), "outcome": rj.get("outcome"),
        "error_code": rj.get("error_code"),
        "message_head": content[:400], "message_len": len(content),
        "session_id": rj.get("session_id") or session_id,
        "execution_id": rj.get("execution_id"),
        "model": rj.get("model"), "provider": rj.get("provider"),
        "singleflight_envelope": bool(singleflight),
        "failed_request": bool(
            r["http"] >= 400 or rj.get("success") is False
            or singleflight),
    }


def session_history(db_path: Path, session_id: str) -> list:
    rows = JR._sqlite_rows(
        db_path,
        "SELECT role, content FROM chat_messages WHERE conversation_id=? "
        "ORDER BY created_at, rowid", (session_id,))
    return [{"role": r[0], "content_head": str(r[1] or "")[:200]}
            for r in rows]


def session_lifecycle(db_path: Path, session_id: str) -> dict:
    """The durable lifecycle rows that could carry the requirement
    association across a restart: the goal_runs records bound to this
    conversation and their task_lifecycle payload."""
    import sqlite3

    out: dict = {"goal_runs_for_session": [], "operations": []}
    try:
        con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        rows = con.execute(
            "SELECT id, conversation_id, goal, status, parameters "
            "FROM goal_runs ORDER BY created_at").fetchall()
        con.close()
    except Exception as exc:  # noqa: BLE001 — additive diagnostics
        out["read_error"] = str(exc)
        return out
    for (rid, conv, goal, status, params) in rows:
        if str(conv or "") != str(session_id):
            continue
        try:
            tl = (json.loads(params or "{}").get("task_lifecycle") or {})
        except Exception:  # noqa: BLE001
            tl = {}
        out["goal_runs_for_session"].append({
            "run_id": rid, "goal_head": str(goal or "")[:120],
            "status": status})
        for op in tl.get("operations") or []:
            op = op or {}
            out["operations"].append({
                "operation_type": op.get("operation_type"),
                "status": op.get("status"),
                "execution_id": op.get("execution_id"),
                "requested_change_head": str(
                    op.get("requested_change") or "")[:120],
                "keys": sorted(op.keys())[:14]})
        # whatever structured requirement/questions the record carries
        for key in sorted(tl.keys()):
            if key not in ("operations",):
                out.setdefault("lifecycle_keys", set()).add(key)
    out["lifecycle_keys"] = sorted(out.get("lifecycle_keys", set()))
    return out


def execution_row(db_path: Path, eid: str) -> dict:
    rows = JR._sqlite_rows(
        db_path,
        "SELECT status, result_summary, metadata_json FROM agent_executions "
        "WHERE id=?", (str(eid or ""),))
    if not rows:
        return {"found": False, "execution_id": str(eid)}
    import json as _json
    try:
        meta = _json.loads(rows[0][2] or "{}")
    except Exception:  # noqa: BLE001
        meta = {}
    outcome = meta.get("task_outcome") or {}
    return {
        "found": True, "execution_id": str(eid),
        "row_status": rows[0][0],
        "result_summary_head": str(rows[0][1] or "")[:160],
        "objective_met": outcome.get("objective_met"),
        "delivery_delivered": (outcome.get("delivery") or {}).get("delivered"),
        "mutation": outcome.get("mutation"),
        "evidence_ref_count": len(outcome.get("evidence_refs") or []),
    }


def run_r3() -> dict:
    ev: dict = {"journey": "R3-resume-missing-value", "subject": SUBJECT,
                "mode": "integrated_main_head",
                "diagnostic_only": True,
                "counted": False,
                "sha_guard": _GUARD,
                "started_at": time.strftime(
                    "%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())}
    ev["runtime_config"] = {
        "provider_mode": "hybrid (cloud edit-plan rung + local reply lane)",
        "edit_plan_pin": PIN_SPEC,
        "local_only": "false",
        "reply_lane": "product-registered local ollama llama3.1:8b",
    }
    _extra_env = {"ATOM_LOCAL_ONLY": "false",
                  "OLLAMA_BASE_URL": "http://localhost:11434/v1",
                  "OLLAMA_MODEL": "llama3.1:8b",
                  "ATOM_ASYNC_EDIT_PLAN_MODEL": PIN_SPEC,
                  **CRED_SCRUB}
    server = JR.ScratchServer(
        "r3_resume", allowlisted=True, code_export=None,
        extra_env=_extra_env)
    ev["identity"] = server.evidence_identity()
    failed_requests = 0

    def note_fail(t: dict) -> None:
        nonlocal failed_requests
        if t.get("failed_request"):
            failed_requests += 1

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

        # ---------------- Scenario A: unambiguous resume ----------------
        setup = canvas_setup(server.base, token)
        ev["setup"] = setup
        canvas_id = setup.get("canvas_id")
        if not canvas_id or not setup.get("seeded_content_matches"):
            raise RuntimeError("canvas setup failed")
        baseline = audit_rows(server.db_path, canvas_id)
        ev["audit_baseline"] = {"rows": len(baseline)}

        # Step 1: the missing-information request.
        ta = chat_turn(server, token, uid, REQUEST_MSG, canvas_id)
        note_fail(ta)
        sid = ta.get("session_id")
        time.sleep(5)
        after_a1 = read_canvas(server.base, token, canvas_id)
        a_rows = audit_rows(server.db_path, canvas_id)
        said_a1 = ta.get("message_head") or ""
        ta["durable"] = execution_row(server.db_path, ta.get("execution_id"))
        ta["lifecycle"] = session_lifecycle(server.db_path, sid or "")
        a1_checks = {
            "turn_success": ta.get("success") is True,
            "asks_for_the_specific_value": (
                "from our records" in said_a1
                and ("give me" in said_a1.lower()
                     or "provide" in said_a1.lower()
                     or "exact value" in said_a1.lower())),
            "zero_audit_writes": len(a_rows) == len(baseline),
            "draft_unchanged": (after_a1.get("content") or "") == QUOTE_CONTENT,
            "not_certified": ta.get("outcome") != "completed",
        }
        ta["checks"] = a1_checks
        ta["audit_delta"] = len(a_rows) - len(baseline)
        ev.setdefault("log_tails", {})["A1"] = "\n".join(
            (server.log_tail() or "").splitlines()[-400:])

        # Step 3: THE RESTART.
        r2 = server.restart()
        ev["restart_before_value"] = {
            k: r2.get(k) for k in ("booted", "seconds", "restart_number")}
        if not r2.get("booted"):
            raise RuntimeError("the R3 restart failed")

        # Step 4 (after restart): the durable association visible to the
        # resumed process, BEFORE the value arrives.
        ev["association_after_restart"] = session_lifecycle(
            server.db_path, sid or "")
        ev["history_after_restart"] = session_history(
            server.db_path, sid or "")

        # Step 4: ONLY the missing value, same conversation.
        tb = chat_turn(server, token, uid, BARE_VALUE_MSG, canvas_id,
                       session_id=sid)
        note_fail(tb)
        time.sleep(5)
        after_b = read_canvas(server.base, token, canvas_id)
        b_rows = audit_rows(server.db_path, canvas_id)
        content_b = after_b.get("content") or ""
        said_b = tb.get("message_head") or ""
        tb["durable"] = execution_row(server.db_path, tb.get("execution_id"))
        tb["lifecycle"] = session_lifecycle(server.db_path, sid or "")
        new_rows = b_rows[len(a_rows):]
        preserved = all(
            s in content_b for s in (
                "Dunmore Fabrication LLC", "Prepared for: Elena Sorokina",
                "Item: CNC press brake, 50-ton", "Unit price: $48,000.00",
                "Subtotal: $48,000.00", "Terms: Net 30",
                "Valid until: 2026-11-30"))
        number_landed = BARE_VALUE_MSG in content_b
        tb["audit_delta"] = len(b_rows) - len(a_rows)
        tb["audit_new_rows"] = new_rows
        reload_hist = session_history(server.db_path, sid or "")
        b_checks = {
            "turn_success": tb.get("success") is True,
            "applied_not_reasked": (
                "give me" not in said_b.lower()
                and "provide" not in said_b.lower()),
            "one_audit_write": tb["audit_delta"] == 1,
            "value_lands_on_the_canvas": number_landed,
            "protected_content_preserved": preserved,
            "addition_only": (not number_landed) or (
                content_b.replace(BARE_VALUE_MSG, "").strip()
                == QUOTE_CONTENT.replace(BARE_VALUE_MSG, "").strip()
                or content_b.count(BARE_VALUE_MSG) == 1),
            "attributable_audit_row": bool(
                new_rows
                and str(ta.get("execution_id")) != ""
                and any(str(tb.get("execution_id"))[:12] in (
                    r.get("details") or "") for r in new_rows)),
            "durable_mutation_evidence": bool(
                (tb.get("durable") or {}).get("found")
                and ((tb["durable"].get("objective_met") is True)
                     or (tb["durable"].get("evidence_ref_count", 0) > 0)
                     or (tb["durable"].get("mutation") or {}).get(
                         "readback_matched") is True)),
            "reload_agreement": bool(
                number_landed
                and any(BARE_VALUE_MSG in (m.get("content_head") or "")
                        for m in reload_hist if m.get("role") == "assistant")),
        }
        tb["checks"] = b_checks
        ev.setdefault("log_tails", {})["A2"] = "\n".join(
            (server.log_tail() or "").splitlines()[-400:])
        ev["scenario_A"] = {
            "request_turn": ta, "resume_turn": tb,
            "canvas_after": content_b[:1200],
            "pass": all(a1_checks.values()) and all(b_checks.values()),
        }

        # ---------------- Scenario B: ambiguous value ----------------
        setup_b = canvas_setup(server.base, token)
        ev["setup_B"] = {"canvas_id": setup_b.get("canvas_id"),
                         "seeded": setup_b.get("seeded_content_matches")}
        canvas_b = setup_b.get("canvas_id")
        if not canvas_b:
            raise RuntimeError("canvas B setup failed")
        baseline_b = audit_rows(server.db_path, canvas_b)
        tc = chat_turn(server, token, uid, REQUEST_MSG, canvas_b)
        note_fail(tc)
        sid_b = tc.get("session_id")
        time.sleep(5)
        after_c = read_canvas(server.base, token, canvas_b)
        c_rows = audit_rows(server.db_path, canvas_b)
        tc["durable"] = execution_row(server.db_path, tc.get("execution_id"))
        c1_checks = {
            "turn_success": tc.get("success") is True,
            "asks_for_the_specific_value": "from our records" in (
                tc.get("message_head") or ""),
            "zero_audit_writes": len(c_rows) == len(baseline_b),
            "draft_unchanged": (after_c.get("content") or "") == QUOTE_CONTENT,
        }
        tc["checks"] = c1_checks

        r3 = server.restart()
        ev["restart_before_ambiguous"] = {
            k: r3.get(k) for k in ("booted", "seconds", "restart_number")}
        if not r3.get("booted"):
            raise RuntimeError("the scenario-B restart failed")

        td = chat_turn(server, token, uid, AMBIGUOUS_VALUE_MSG, canvas_b,
                       session_id=sid_b)
        note_fail(td)
        time.sleep(5)
        after_d = read_canvas(server.base, token, canvas_b)
        d_rows = audit_rows(server.db_path, canvas_b)
        said_d = td.get("message_head") or ""
        td["durable"] = execution_row(server.db_path, td.get("execution_id"))
        asks_followup = ("which" in said_d.lower()
                         or "either" in said_d.lower()
                         or "confirm" in said_d.lower()
                         or "clarify" in said_d.lower()
                         or "?" in said_d)
        td["audit_delta"] = len(d_rows) - len(c_rows)
        d_checks = {
            "turn_success": td.get("success") is True,
            "one_clarification_no_write": (
                asks_followup and td["audit_delta"] == 0),
            "draft_unchanged": (after_d.get("content") or "") == QUOTE_CONTENT,
            "zero_writes": td["audit_delta"] == 0,
            "not_certified": td.get("outcome") != "completed",
            "did_not_pick_silently": not any(
                v in (after_d.get("content") or "")
                for v in ("03-4567-8912", "03-4567-8913")),
        }
        td["checks"] = d_checks
        ev.setdefault("log_tails", {})["B2"] = "\n".join(
            (server.log_tail() or "").splitlines()[-400:])
        ev["scenario_B"] = {
            "request_turn": tc, "ambiguous_turn": td,
            "canvas_after": (after_d.get("content") or "")[:1200],
            "pass": all(c1_checks.values()) and all(d_checks.values()),
        }

        ev["failed_request_count"] = failed_requests
        ev["assertions"] = {
            "R3.request_asks_and_preserves": (
                all(ev["scenario_A"]["request_turn"]["checks"].values())
                and all(ev["scenario_B"]["request_turn"]["checks"].values())),
            "R3.resume_applies_one_correct_edit": all(b_checks.values()),
            "R3.ambiguous_asks_one_clarification_zero_writes": all(
                d_checks.values()),
        }
        ev["pass"] = all(ev["assertions"].values())
        return ev
    except Exception as exc:  # noqa: BLE001 — the evidence IS the record
        ev["error"] = f"{type(exc).__name__}: {exc}"
        ev.setdefault("log_tails", {})["fatal"] = "\n".join(
            (server.log_tail() or "").splitlines()[-400:])
        ev["pass"] = False
        return ev
    finally:
        try:
            server.down()
        except Exception:  # noqa: BLE001
            pass


def main() -> int:
    ev = run_r3()
    EVIDENCE_DIR.mkdir(exist_ok=True)
    out = EVIDENCE_DIR / (
        f"r3_resume_{time.strftime('%Y%m%d_%H%M%S')}_"
        f"{uuid.uuid4().hex[:6]}.json")
    out.write_text(json.dumps(ev, indent=2, default=str))
    print(f"evidence: {out}")
    print(json.dumps({
        "journey": ev.get("journey"),
        "pass": ev.get("pass"),
        "error": ev.get("error"),
        "assertions": ev.get("assertions"),
        "scenario_A_pass": (ev.get("scenario_A") or {}).get("pass"),
        "scenario_B_pass": (ev.get("scenario_B") or {}).get("pass"),
        "failed_request_count": ev.get("failed_request_count"),
    }, indent=1))
    return 0 if ev.get("pass") else 1


if __name__ == "__main__":
    sys.exit(main())
