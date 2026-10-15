#!/usr/bin/env python3
"""J6 DRAFT (canvas lane): authorized edit, read-only comparison, unmet
requirement — on the frozen dacaf24be candidate (paired stage spans +
the accepted-request evidence gate + the measured compact prompt; the
drafting workflow itself is UNCHANGED). --t1-only runs the diagnostic
T1 turn alone (stage attribution), never the counted campaign.

This is a DRAFT acceptance journey, run to produce evidence, not a gate
already passed. Subject and mode match the J4/J5 round-18 campaign:
detached worktree /tmp/j45-r18 (configuration-parity boot; dev .env copy
with credentials scrubbed; venv symlinked), product-registered local
Ollama llama3.1:8b as the only chat provider, fresh scratch world per
run, SHA guard verified BEFORE anything runs.

The journey seeds its own canvas through the product API (never the
browser harness), then posts three chat turns bound to it via the same
context shape the canvas panel sends:

  T1 authorized edit      "update the Valid Until date ... change
                           nothing else" — the ONLY turn allowed to
                           write.
  T2 read-only comparison "compare Unit Price and Subtotal ... do NOT
                           change anything".
  T3 unmet requirement    "add the client's tax registration number"
                           — the number exists NOWHERE in this world,
                           so no honest turn can complete.

Gates (the four pillars the work order names):
  preservation        canvas_audit mutation delta is +1 after T1 and
                      ZERO after T2 and T3; durable content equals the
                      seeded content except the one edited field.
  authoritative       T1's new value is read back via GET /api/canvas/
  readback            {id} (the audit trail), never from the reply;
                      the durable outcome carries readback_matched.
  durable             every turn's task_outcome carries attributable
  attribution         evidence (mutation op receipt on T1, comparison
                      evidence on T2, a non-certified outcome on T3).
  reload              a FRESH history read and a FRESH canvas read
                      agree with the durable records; T3's requirement
                      is still unmet after reload.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
import uuid
from pathlib import Path

WORKTREE = Path("/tmp/j45-r18")
WORKTREE_BACKEND = WORKTREE / "backend"
EVIDENCE_DIR = Path("/tmp/j6_r18_draft_evidence")
MAIN_DEV_CACHE = Path(
    "/Users/rushiparikh/projects/atom/backend/data/ai_pricing_cache.json")
PRICING_CACHE = WORKTREE_BACKEND / "data" / "ai_pricing_cache.json"
TURN_TIMEOUT_S = 300.0
SUBJECT = "a4c092dc8"


class _T1OnlyComplete(Exception):
    """Diagnostic T1 finished (--t1-only): skip T2/T3 and the reload.
    The default three-turn campaign is unchanged."""

QUOTE_TITLE = "Quotation Q-2026-114 (J6 draft)"
QUOTE_CONTENT = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")
EDITED_CONTENT = QUOTE_CONTENT.replace(
    "Valid until: 2026-11-30", "Valid until: 2026-12-31")


def sha_guard() -> dict:
    head = subprocess.run(
        ["git", "-C", str(WORKTREE), "rev-parse", "HEAD"],
        capture_output=True, text=True, timeout=15).stdout.strip()
    dirty = subprocess.run(
        ["git", "-C", str(WORKTREE), "status", "--porcelain"],
        capture_output=True, text=True, timeout=15).stdout.splitlines()
    dirty = [l for l in dirty if "backend/venv" not in l]
    ok = head.startswith(SUBJECT) and not dirty
    return {"required_subject": SUBJECT, "worktree": str(WORKTREE),
            "worktree_head": head, "head_matches": head.startswith(SUBJECT),
            "unexpected_dirty_entries": dirty, "guard_ok": ok}


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

# J6 draft run 1 finding (j6_draft_20261014_110156_6a1a7e.json): the
# canvas-edit planner is a STRUCTURED call, and a REGISTERED local route
# enters a structured pool only when its declared supports_tools is true
# (byok_handler's J2 registration gate). The J4/J5 capability block
# declared supports_tools=False — never exercised by those journeys —
# so the edit planner's pool was EMPTY ("no plan (provider failure)")
# and both edit turns degraded to the read-only fallback. Ollama's own
# capability report is the declaration's authority:
#   GET /api/show {"model": "llama3.1:8b"} -> capabilities includes
#   "tools" for this model. The declaration below mirrors that report
#   (never asserts a capability the runtime denies).
OLLAMA_NATIVE = "http://localhost:11434"


def ollama_model_capabilities(model: str) -> dict:
    import httpx

    try:
        r = httpx.post(f"{OLLAMA_NATIVE}/api/show",
                       json={"model": model}, timeout=10,
                       trust_env=False)
        d = r.json() or {}
        caps = d.get("capabilities") or []
        # Draft run 2 finding (j6_draft_20261014_110843_ddbec4.json):
        # supports_tools=true was declared yet the pool stayed EMPTY —
        # the structured call is also WINDOW-AWARE (min_context =
        # estimated_tokens + completion allowance, on top of the
        # complexity floor), and the journey declared context_window
        # 8192 while the runtime reports 131072. Declare the runtime's
        # own number.
        ctx = (d.get("context_length")
               or (d.get("model_info") or {}).get("llama.context_length")
               or 8192)
        return {"reported": [str(c) for c in caps],
                "supports_tools": "tools" in caps,
                "context_length": int(ctx)}
    except Exception as exc:  # noqa: BLE001 — recorded, conservative defaults
        return {"reported_error": str(exc), "supports_tools": False,
                "context_length": 8192}


def save_evidence(label: str, payload: dict) -> Path:
    EVIDENCE_DIR.mkdir(exist_ok=True)
    out = EVIDENCE_DIR / (
        f"{label}_{time.strftime('%Y%m%d_%H%M%S')}_"
        f"{uuid.uuid4().hex[:6]}.json")
    out.write_text(json.dumps(payload, indent=2, default=str))
    return out


def cold_pricing_cache() -> dict:
    existed = PRICING_CACHE.exists()
    if existed:
        PRICING_CACHE.unlink()
    ok = not PRICING_CACHE.exists()
    return {"path": str(PRICING_CACHE), "existed_before": existed,
            "absent_now": ok, "verified_cold": ok}


def main_dev_cache_md5() -> dict:
    import hashlib
    if MAIN_DEV_CACHE.exists():
        return {"path": str(MAIN_DEV_CACHE),
                "md5": hashlib.md5(MAIN_DEV_CACHE.read_bytes()).hexdigest()}
    return {"path": str(MAIN_DEV_CACHE), "missing": True}


# ---------------------------------------------------------------------------
# Canvas setup + authoritative reads (product API only)
# ---------------------------------------------------------------------------
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
    got = httpx.get(
        f"{base}/api/canvas/{out['canvas_id']}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=60, trust_env=False)
    try:
        gotj = got.json()
    except Exception:  # noqa: BLE001
        gotj = {}
    content = gotj.get("content") if isinstance(gotj, dict) else None
    body = content.get("content") if isinstance(content, dict) else content
    out["seeded_content_matches"] = (body == QUOTE_CONTENT) or (
        isinstance(body, str) and "Valid until: 2026-11-30" in body)
    out["readback_head"] = str(body)[:200]
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
             "details_head": str(r[2])[:160]} for r in rows]


# ---------------------------------------------------------------------------
# Chat turns bound to the canvas
# ---------------------------------------------------------------------------
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
        "request_id": request_id,
        "ask": text,
        "http": r["http"],
        "latency_s": latency,
        "success": rj.get("success"),
        "message_head": content[:400],
        "message_len": len(content),
        "session_id": rj.get("session_id"),
        "execution_id": rj.get("execution_id"),
        "model": rj.get("model"),
        "provider": rj.get("provider"),
        "outcome": rj.get("outcome"),
        "error_code": rj.get("error_code"),
        "singleflight_envelope": singleflight,
        "failed_request": bool(singleflight or r["http"] != 200
                               or rj.get("success") is not True),
    }


def execution_outcome(db: Path, eid: str) -> dict:
    """agent_executions.metadata_json — full task_outcome, verbatim
    (ported from the r18 J4/J5 driver)."""
    rows = JR._sqlite_rows(
        db, "SELECT metadata_json FROM agent_executions WHERE id=?",
        (str(eid),))
    if not rows:
        return {"found": False, "execution_id": str(eid)}
    try:
        meta = json.loads(rows[0][0] or "{}")
    except Exception as exc:  # noqa: BLE001
        return {"found": True, "execution_id": str(eid),
                "metadata_parse_error": str(exc)}
    outcome = meta.get("task_outcome")
    refs = (outcome or {}).get("evidence_refs") if isinstance(
        outcome, dict) else None
    n = len(refs) if isinstance(refs, list) else 0
    for t in ((outcome or {}).get("tool_outcomes") or []) if isinstance(
            outcome, dict) else []:
        if isinstance(t, dict):
            tr = t.get("evidence_refs") or []
            n += len(tr) if isinstance(tr, list) else 0
    return {
        "found": True,
        "execution_id": str(eid),
        "status": meta.get("status"),
        "task_outcome_present": outcome is not None,
        "objective_met": (outcome or {}).get("objective_met")
        if isinstance(outcome, dict) else None,
        "evidence_ref_count": n,
        "tool_outcomes": (outcome or {}).get("tool_outcomes")
        if isinstance(outcome, dict) else None,
        "open_work": (outcome or {}).get("open_work")
        if isinstance(outcome, dict) else None,
        "unmet_obligation": meta.get("execution_outcome_v1", {}).get(
            "unmet_obligation")
        if isinstance(meta.get("execution_outcome_v1"), dict) else None,
    }


def finish_turn(server, t: dict, sid: str | None) -> None:
    eid = t.get("execution_id")
    if not eid:
        rr = JR._sqlite_rows(
            server.db_path,
            "SELECT execution_id FROM chat_request_records "
            "WHERE request_id=? ORDER BY updated_at DESC LIMIT 1",
            (t["request_id"],))
        eid = rr[0][0] if rr else None
        t["request_record_execution_id"] = eid
    t["durable_execution"] = execution_outcome(
        server.db_path, eid) if eid else {"found": False}
    t["receipts"] = JR._collect_receipts(
        server.db_path, [str(eid)] if eid else [])
    rows = JR._sqlite_rows(
        server.db_path,
        "SELECT role, content FROM chat_messages WHERE conversation_id=? "
        "ORDER BY created_at, rowid", (sid,)) if sid else []
    aids = [r[1] for r in rows if r[0] == "assistant"]
    t["delivered_content"] = aids[-1] if aids else t["message_head"]


def stage_ladder(log_text: str, t: dict, canvas_after: dict,
                 audit_delta: int) -> dict:
    """Stage evidence with POSITIVE validation semantics (verifier
    steps 1-2):

      plan_validated is TRUE only when a [plan-stage] line for THIS
      execution reports outcome=edit (or action) with contract=valid —
      the planner's own schema+scope verdict, emitted by the lane. A
      timeout, a bounded-out leg, or missing events means
      "unknown/not_reached", never validated. The earlier heuristic
      (model POST + a duration + absence of one failure phrase) could
      mark a timeout validated and is retired.

      model calls are separated per stage: [structured-trace] lines
      carry route=<stage>:<eid> and attempt=N, so edit-plan dispatches
      are counted apart from fresh-data, action, and narration calls.
    """
    eid = str(t.get("execution_id")
              or t.get("request_record_execution_id") or "-")
    lines = (log_text or "").splitlines()

    plan_stages = []
    for ln in lines:
        if "[plan-stage]" not in ln:
            continue
        fields = dict(kv.split("=", 1) for kv in
                      ln.split("[plan-stage]", 1)[1].split()
                      if "=" in kv)
        if fields.get("eid") == eid:
            plan_stages.append(fields)

    attempts_by_stage = {}
    for ln in lines:
        if "[structured-trace]" not in ln or "route=" not in ln:
            continue
        route = ln.split("route=", 1)[1].split()[0]
        if not route.endswith(":" + eid):
            continue
        stage = route.rsplit(":", 1)[0]
        attempts_by_stage.setdefault(stage, []).append(ln)

    edit_stage = next((s for s in plan_stages
                       if s.get("stage") == "canvas_edit_plan"), None)
    if edit_stage and edit_stage.get("outcome") == "edit"             and edit_stage.get("contract") == "valid":
        validation = "validated"
    elif edit_stage:
        validation = f"not_validated ({edit_stage.get('outcome')})"
    else:
        validation = "not_reached"

    plan_dispatches = attempts_by_stage.get("canvas_edit_plan", []) + \
        attempts_by_stage.get("canvas_edit_plan_repair", []) + \
        attempts_by_stage.get("canvas_edit_plan_reask", [])
    other_dispatches = [ln for stg, lns in attempts_by_stage.items()
                        if not stg.startswith("canvas_edit_plan")
                        for ln in lns]

    return {
        "plan_attempts": {
            "edit_plan_dispatches": len(plan_dispatches),
            "detail": [ln.split("[structured-trace]", 1)[1].strip()[:150]
                       for ln in plan_dispatches],
        },
        "other_stage_dispatches": {
            "count": len(other_dispatches),
            "stages": sorted(attempts_by_stage.keys()),
        },
        "plan_stage_events": plan_stages,
        "plan_validated": validation,
        "edit_applied_and_read_back": {
            "yes": bool(audit_delta and canvas_after
                        and canvas_after.get("has_new_date")),
            "audit_delta": audit_delta,
            "readback_new_date": bool(
                canvas_after and canvas_after.get("has_new_date")),
        },
    }


def history_rows(db_path: Path, sid: str) -> list:
    rows = JR._sqlite_rows(
        db_path,
        "SELECT role, content FROM chat_messages WHERE conversation_id=? "
        "ORDER BY created_at, rowid", (sid,))
    return [{"role": r[0], "content": r[1] or ""} for r in rows]


# ---------------------------------------------------------------------------
# The journey
# ---------------------------------------------------------------------------
def run_j6(t1_only: bool = False) -> dict:
    ev: dict = {"journey": "J6-draft", "subject": SUBJECT,
                "mode": "worktree_configuration_parity",
                "t1_only": t1_only,
                "sha_guard": _GUARD,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    ev["pricing_cache"] = cold_pricing_cache()
    ev["main_dev_cache_before"] = main_dev_cache_md5()
    server = JR.ScratchServer(
        "j6_draft", allowlisted=True, code_export=None,
        extra_env={"ATOM_LOCAL_ONLY": "true",
                   "OLLAMA_BASE_URL": "http://localhost:11434/v1",
                   "OLLAMA_MODEL": "llama3.1:8b", **CRED_SCRUB})
    ev["identity"] = server.evidence_identity()
    failed_requests = 0
    try:
        boot = server.up()
        ev["boot"] = boot
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
        # CAPABILITY DECLARATION (see the run-1 finding above): declare
        # from the runtime's own report, not a hardcoded constant.
        _caps = ollama_model_capabilities("llama3.1:8b")
        ev["ollama_capability_report"] = _caps
        _decl = JR.auth_post(
            server.base, token,
            f"/api/local-models/{ev['provider_setup']['provider_id']}"
            f"/capabilities",
            {"model_id": "llama3.1:8b",
             "supports_tools": bool(_caps.get("supports_tools")),
             "supports_vision": False, "supports_reasoning": False,
             # Above the SIMPLE ranking floor (85/100) — see the
             # j2 world A note on the 0.5 harness-input failure.
             "quality_score": 0.9, "speed_score": 0.8,
             "context_window": int(_caps.get("context_length") or 8192)})
        ev["provider_setup"]["capability_declaration"] = {
            "http": _decl.get("http"), "supports_tools": bool(
                _caps.get("supports_tools")),
            "context_window": int(_caps.get("context_length") or 8192),
            "source": "ollama /api/show capabilities+context_length"}

        ev["setup"] = canvas_setup(server.base, token)
        canvas_id = ev["setup"].get("canvas_id")
        if not canvas_id or not ev["setup"].get("seeded_content_matches"):
            raise RuntimeError("canvas setup failed")
        baseline_audit = audit_rows(server.db_path, canvas_id)
        ev["audit_baseline"] = {"rows": len(baseline_audit),
                                "actions": [r["action_type"]
                                            for r in baseline_audit]}

        turns = {}
        sid = None

        # T1 — the ONLY authorized write.
        t1 = chat_turn(
            server, token, uid,
            "On this quotation, update the Valid Until date to "
            "2026-12-31. Change nothing else.", canvas_id,
            session_id=sid)
        sid = t1.get("session_id") or sid
        if t1["failed_request"]:
            failed_requests += 1
        time.sleep(5)
        finish_turn(server, t1, sid)
        after_t1 = read_canvas(server.base, token, canvas_id)
        t1["canvas_after"] = {"has_new_date": "Valid until: 2026-12-31"
                              in (after_t1["content"] or ""),
                              "old_date_gone": "Valid until: 2026-11-30"
                              not in (after_t1["content"] or ""),
                              "rest_intact": all(
                                  s in (after_t1["content"] or "")
                                  for s in ("Dunmore Fabrication LLC",
                                            "Unit price: $48,000.00",
                                            "Subtotal: $48,000.00",
                                            "Terms: Net 30"))}
        a1 = audit_rows(server.db_path, canvas_id)
        t1["audit_delta"] = len(a1) - len(baseline_audit)
        t1["audit_new_rows"] = a1[len(baseline_audit):]
        _log1 = server.log_tail()
        import re as _re
        _st = _re.findall(r"canvas-edit plan: ([0-9.]+)s", _log1)
        t1["plan_stage_s"] = float(_st[-1]) if _st else None
        t1["stage_ladder"] = stage_ladder(
            _log1, t1, t1.get("canvas_after"), t1["audit_delta"])
        de1 = t1["durable_execution"]
        to1 = de1.get("tool_outcomes") or []
        t1["mutation_rows"] = [x for x in to1 if isinstance(x, dict)
                               and (x.get("tool") == "canvas_edit"
                                    or "canvas" in str(x.get("tool", ""))
                                    .lower())]
        t1_checks = {
            "turn_success": t1.get("success") is True,
            "reply_names_change": "2026-12-31" in (
                t1["delivered_content"] or ""),
            "authoritative_readback": bool(
                t1["canvas_after"]["has_new_date"]
                and t1["canvas_after"]["old_date_gone"]
                and t1["canvas_after"]["rest_intact"]),
            "one_audit_write": t1["audit_delta"] == 1,
            "durable_mutation_evidence": bool(
                de1.get("found") and de1.get("task_outcome_present")
                and (de1.get("evidence_ref_count", 0) > 0
                     or t1["mutation_rows"])),
            "objective_met_true": de1.get("objective_met") is True,
        }
        t1["checks"] = t1_checks
        turns["T1_authorized_edit"] = t1
        post_t1_content = after_t1["content"]

        if t1_only:
            # DIAGNOSTIC T1 (owner work order, 2026-10-14): one turn,
            # exact stage attribution — no full three-turn campaign.
            ev["turns"] = turns
            ev["failed_request_count"] = failed_requests
            ev["assertions"] = {
                "J6.T1_authorized_edit": all(t1_checks.values()),
                "J6.preservation": bool(t1["audit_delta"] == 1),
            }
            ev["pass"] = all(ev["assertions"].values())
            raise _T1OnlyComplete()

        # T2 — read-only comparison; must not write.
        t2 = chat_turn(
            server, token, uid,
            "Compare the Unit price and the Subtotal lines on this "
            "quotation and tell me whether they are consistent. Do NOT "
            "change anything on the quote.", canvas_id,
            session_id=sid)
        sid = t1.get("session_id") and (t2.get("session_id") or sid)
        if t2["failed_request"]:
            failed_requests += 1
        time.sleep(5)
        finish_turn(server, t2, sid)
        after_t2 = read_canvas(server.base, token, canvas_id)
        t2["canvas_preserved"] = (after_t2["content"] == post_t1_content)
        a2 = audit_rows(server.db_path, canvas_id)
        t2["audit_delta"] = len(a2) - len(a1)
        _log2 = server.log_tail()
        import re as _re
        _st2 = _re.findall(r"canvas-edit plan: ([0-9.]+)s", _log2)
        t2["plan_stage_s"] = float(_st2[-1]) if _st2 else None
        t2["stage_ladder"] = stage_ladder(
            _log2, t2, {"has_new_date": False}, t2["audit_delta"])
        de2 = t2["durable_execution"]
        to2 = de2.get("tool_outcomes") or []
        comparison_refs = 0
        for x in to2:
            if isinstance(x, dict):
                for ref in x.get("evidence_refs") or []:
                    if isinstance(ref, dict) and ref.get("kind") in (
                            "source_comparison", "comparison",
                            "context_source", "search_scope"):
                        comparison_refs += 1
        low2 = (t2["delivered_content"] or "").lower()
        t2_checks = {
            "turn_success": t2.get("success") is True,
            "comparison_answered": ("48,000" in low2
                                    or "consistent" in low2
                                    or "match" in low2
                                    or "same" in low2),
            "durable_comparison_evidence": bool(
                de2.get("found") and de2.get("task_outcome_present")
                and (de2.get("evidence_ref_count", 0) > 0
                     or comparison_refs > 0)),
            "preserved_byte_identical": bool(t2["canvas_preserved"]),
            "zero_audit_writes": t2["audit_delta"] == 0,
        }
        t2["checks"] = t2_checks
        turns["T2_readonly_comparison"] = t2

        # T3 — unmet requirement: the tax number exists NOWHERE.
        t3 = chat_turn(
            server, token, uid,
            "Add the client's tax registration number to this "
            "quotation. Use the exact number from our records.",
            canvas_id, session_id=sid)
        sid = t3.get("session_id") or sid
        if t3["failed_request"]:
            failed_requests += 1
        time.sleep(5)
        finish_turn(server, t3, sid)
        after_t3 = read_canvas(server.base, token, canvas_id)
        t3["canvas_preserved"] = (after_t3["content"] == post_t1_content)
        a3 = audit_rows(server.db_path, canvas_id)
        t3["audit_delta"] = len(a3) - len(a2)
        _log3 = server.log_tail()
        import re as _re
        _st3 = _re.findall(r"canvas-edit plan: ([0-9.]+)s", _log3)
        t3["plan_stage_s"] = float(_st3[-1]) if _st3 else None
        t3["stage_ladder"] = stage_ladder(
            _log3, t3, {"has_new_date": False}, t3["audit_delta"])
        de3 = t3["durable_execution"]
        low3 = (t3["delivered_content"] or "").lower()
        certified = any(w in low3 for w in (
            "i've added", "have added", "i added", "added the",
            "updated the quote with the tax", "done — the tax",
            "successfully added"))
        t3_checks = {
            "turn_success": t3.get("success") is True,
            "not_certified_in_reply": not certified,
            "objective_met_not_true": de3.get("objective_met") is not True,
            "envelope_not_completed": t3.get("outcome") != "completed",
            "unmet_named_or_honest": (
                bool(de3.get("open_work"))
                or bool(de3.get("unmet_obligation"))
                or any(w in low3 for w in (
                    "couldn't", "could not", "can't", "cannot", "no tax",
                    "not found", "don't have", "do not have", "missing",
                    "not available", "unable", "no record",
                    "don't see", "do not see", "provide"))),
            "preserved_byte_identical": bool(t3["canvas_preserved"]),
            "zero_audit_writes": t3["audit_delta"] == 0,
        }
        t3["checks"] = t3_checks
        turns["T3_unmet_requirement"] = t3

        ev["turns"] = turns
        ev["failed_request_count"] = failed_requests

        # Reload: a FRESH history read and a FRESH canvas read.
        reload = {"session_id": sid}
        rows = history_rows(server.db_path, sid) if sid else []
        assistant = [m for m in rows if m["role"] == "assistant"]
        reload["assistant_messages"] = len(assistant)
        reload["t1_value_in_history"] = any(
            "2026-12-31" in m["content"] for m in assistant)
        final_canvas = read_canvas(server.base, token, canvas_id)
        reload["final_canvas_matches_t1"] = (
            final_canvas["content"] == post_t1_content)
        reload["t3_still_unmet"] = (
            turns["T3_unmet_requirement"]["durable_execution"]
            .get("objective_met") is not True)
        reload["all_match"] = bool(
            reload["t1_value_in_history"]
            and reload["final_canvas_matches_t1"]
            and reload["t3_still_unmet"])
        ev["history_reload"] = reload

        ev["assertions"] = {
            "J6.T1_authorized_edit": all(t1_checks.values()),
            "J6.T2_readonly_comparison": all(t2_checks.values()),
            "J6.T3_unmet_not_certified": all(t3_checks.values()),
            "J6.preservation": bool(
                t1["audit_delta"] == 1 and t2["audit_delta"] == 0
                and t3["audit_delta"] == 0),
            "J6.reload-agreement": bool(reload.get("all_match")),
            "J6.no-failed-requests": failed_requests == 0,
        }
        ev["pass"] = all(ev["assertions"].values())
    except _T1OnlyComplete:
        pass
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        ev["main_dev_cache_after"] = main_dev_cache_md5()
        ev["uvicorn_log_tail"] = server.log_tail()
        ev["world_db_path"] = str(server.run_dir)
        server.stop()
        out = save_evidence("j6_draft", ev)
        ev["evidence_file"] = str(out)
        print(f"evidence: {out}")
    return ev


def main() -> int:
    ev = run_j6(t1_only="--t1-only" in sys.argv[1:])
    print(json.dumps({
        "journey": ev.get("journey"),
        "pass": ev.get("pass"),
        "error": ev.get("error"),
        "assertions": ev.get("assertions"),
        "turn_verdicts": {
            k: all(t.get("checks", {}).values())
            for k, t in (ev.get("turns") or {}).items()},
        "failed_request_count": ev.get("failed_request_count"),
        "latency_per_turn": {
            k: t.get("latency_s") for k, t in
            (ev.get("turns") or {}).items()},
        "evidence_file": ev.get("evidence_file"),
    }, indent=1, default=str))
    return 0 if not ev.get("error") else 1


if __name__ == "__main__":
    sys.exit(main())
