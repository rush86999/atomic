#!/usr/bin/env python3
"""J4 (research) + J5 (calculation) acceptance driver, round 18.

Subject: 3a59f55ac (approved 11c27b3ff + review-driven test pins,
production code identical), booted from the detached worktree /tmp/j45-r18/backend (configuration-parity boot: the worktree carries a
COPY of the dev backend/.env; credentials are pinned to "" so no cloud
provider can serve a turn — the only chat provider is the product-
registered Ollama llama3.1:8b).

PREFLIGHT SHA GUARD: the worktree HEAD must equal 3b07ed75d BEFORE any
journey runs; recorded in the evidence; abort on mismatch.

One journey per process invocation (`j4` / `j5`): fresh scratch DB,
fresh user, fresh session, cold pricing cache verified before each
journey. Every attempt, every latency, every failure is preserved;
nothing is repaired mid-run. Singleflight envelopes count as FAILED
REQUESTS.

J4 spec note (disclosed): the doc plants the three named facts per the
run order — Ashford->Priya Nair, Bellhaven->Marcus Webb, and
Dunmore->Elena Sorokina in a NON-managerial role — so the third fact is
present in the corpus while the Dunmore MANAGEMENT fact is genuinely
absent, making T3 a real honest-coverage control with a fabrication
bait (Elena Sorokina) in the retrieved text.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import secrets
import subprocess
import sys
import time
import uuid
from pathlib import Path

WORKTREE = Path("/tmp/j45-r18")
WORKTREE_BACKEND = WORKTREE / "backend"
EVIDENCE_DIR = Path("/tmp/j45_r18_evidence")
PRICING_CACHE = WORKTREE_BACKEND / "data" / "ai_pricing_cache.json"
MAIN_DEV_CACHE = Path(
    "/Users/rushiparikh/projects/atom/backend/data/ai_pricing_cache.json")
TURN_TIMEOUT_S = 300.0
SUBJECT = "3a59f55ac"


def sha_guard() -> dict:
    """PREFLIGHT: worktree HEAD must equal SUBJECT before anything runs."""
    head = subprocess.run(
        ["git", "-C", str(WORKTREE), "rev-parse", "HEAD"],
        capture_output=True, text=True, timeout=15).stdout.strip()
    dirty = subprocess.run(
        ["git", "-C", str(WORKTREE), "status", "--porcelain"],
        capture_output=True, text=True, timeout=15).stdout.splitlines()
    dirty = [l for l in dirty if "backend/venv" not in l]  # setup symlink
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
from scripts.orchestration_acceptance.acceptance_trial_lib import (  # noqa: E402
    job_for_session,
)
from scripts.orchestration_acceptance.j4_research import (  # noqa: E402
    _register_local_provider,
)

CRED_SCRUB = {name: "" for name in JR.CREDENTIAL_ENV_NAMES}

# J4 document: three named facts; Dunmore's MANAGEMENT fact absent.
J4_DOC_NAME = f"office_directory_{secrets.token_hex(4)}.md"
NAMES = {"ashford": "Priya Nair", "bellhaven": "Marcus Webb",
         "dunmore_bait": "Elena Sorokina"}


def j4_doc_text() -> str:
    marker = "RESEARCH-DIR-" + secrets.token_hex(6)
    return (
        "# Regional office directory\n\n"
        f"Marker: {marker}\n\n"
        "## Ashford office\n"
        "Office manager: Priya Nair. All Ashford requests go to "
        "Priya Nair.\n\n"
        "## Bellhaven office\n"
        "Office manager: Marcus Webb. For anything handled at "
        "Bellhaven, contact Marcus Webb.\n\n"
        "## Dunmore office\n"
        "Elena Sorokina handles client onboarding for the Dunmore "
        "accounts.\n"
    )


def save_evidence(label: str, payload: dict) -> Path:
    EVIDENCE_DIR.mkdir(exist_ok=True)
    out = EVIDENCE_DIR / (
        f"{label}_{time.strftime('%Y%m%d_%H%M%S')}_"
        f"{uuid.uuid4().hex[:6]}.json")
    out.write_text(json.dumps(payload, indent=2, default=str))
    return out


def cold_pricing_cache() -> dict:
    """Run order: the pricing cache must be ABSENT before each journey."""
    existed = PRICING_CACHE.exists()
    if existed:
        PRICING_CACHE.unlink()
    ok = not PRICING_CACHE.exists()
    return {"path": str(PRICING_CACHE), "existed_before": existed,
            "absent_now": ok, "verified_cold": ok}


def main_dev_cache_md5() -> dict:
    if MAIN_DEV_CACHE.exists():
        return {"path": str(MAIN_DEV_CACHE),
                "md5": hashlib.md5(MAIN_DEV_CACHE.read_bytes()).hexdigest()}
    return {"path": str(MAIN_DEV_CACHE), "missing": True}


# ---------------------------------------------------------------------------
# Durable record readers (every read opens a NEW read-only sqlite connection)
# ---------------------------------------------------------------------------
def request_record(db: Path, request_id: str) -> dict:
    rows = JR._sqlite_rows(
        db, "SELECT state, updated_at, execution_id, error "
            "FROM chat_request_records WHERE request_id=? "
            "ORDER BY updated_at DESC LIMIT 1", (str(request_id),))
    if not rows:
        return {"found": False}
    state, updated_at, eid, error = rows[0]
    return {"found": True, "state": state, "updated_at": updated_at,
            "execution_id": eid, "error": error}


def execution_outcome(db: Path, eid: str) -> dict:
    """agent_executions.metadata_json — full task_outcome, verbatim."""
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
    return {
        "found": True,
        "execution_id": str(eid),
        "status": meta.get("status"),
        "meta_outcome": meta.get("outcome"),
        "task_outcome_present": outcome is not None,
        "task_outcome": outcome if isinstance(outcome, dict) else outcome,
        "objective_met": (outcome or {}).get("objective_met")
        if isinstance(outcome, dict) else None,
        "evidence_refs": (outcome or {}).get("evidence_refs")
        if isinstance(outcome, dict) else None,
        "tool_outcomes": (outcome or {}).get("tool_outcomes")
        if isinstance(outcome, dict) else None,
        "delivery": (outcome or {}).get("delivery")
        if isinstance(outcome, dict) else None,
        "success_kinds": (outcome or {}).get("success_kinds")
        if isinstance(outcome, dict) else None,
        "open_work": (outcome or {}).get("open_work")
        if isinstance(outcome, dict) else None,
    }


def refs_count(outcome_reader: dict) -> int:
    """Evidence refs on the task_outcome (top level + tool_outcomes)."""
    n = 0
    refs = outcome_reader.get("evidence_refs") or []
    n += len(refs) if isinstance(refs, list) else 0
    for t in outcome_reader.get("tool_outcomes") or []:
        if isinstance(t, dict):
            n += len(t.get("evidence_refs") or [])
    return n


def history_rows(db: Path, sid: str) -> list:
    rows = JR._sqlite_rows(
        db, "SELECT role, content, metadata_json FROM chat_messages "
            "WHERE conversation_id=? ORDER BY created_at, rowid", (sid,))
    out = []
    for role, content, meta in rows:
        try:
            m = json.loads(meta) if meta else {}
        except Exception:  # noqa: BLE001
            m = {"_raw": str(meta)[:120]}
        out.append({"role": role, "content": content or "", "meta": m})
    return out


# ---------------------------------------------------------------------------
# One chat turn: one attempt, fully preserved.
# ---------------------------------------------------------------------------
def chat_turn(server, token: str, uid: str, text: str,
              session_id: str | None = None) -> dict:
    request_id = str(uuid.uuid4())
    payload = {"message": text, "user_id": uid, "request_id": request_id}
    if session_id:
        payload["session_id"] = session_id  # ONE session across the journey
    t0 = time.monotonic()
    r = JR.auth_post(server.base, token, "/api/chat/message",
                     payload, timeout_s=TURN_TIMEOUT_S)
    latency = round(time.monotonic() - t0, 2)
    rj = r["json"] or {}
    content = str(rj.get("message") or "")
    singleflight = (r["http"] == 409) or (
        "already in progress" in content.lower())
    attempt = {
        "request_id": request_id,
        "ask": text,
        "http": r["http"],
        "latency_s": latency,
        "success": rj.get("success"),
        "message_head": content[:400],
        "message_len": len(content),
        "session_id": rj.get("session_id"),
        "session_continued": bool(session_id),
        "execution_id": rj.get("execution_id"),
        "model": rj.get("model"),
        "provider": rj.get("provider"),
        "intent": rj.get("intent"),
        "outcome": rj.get("outcome"),
        "error_code": rj.get("error_code"),
        "failure_reason": rj.get("failure_reason"),
        "singleflight_envelope": singleflight,
        "failed_request": bool(singleflight or r["http"] != 200
                               or rj.get("success") is not True),
    }
    return attempt


def finish_turn(server, t: dict, sid: str | None) -> None:
    """Post-turn durable capture: request linkage, execution outcome,
    receipts, read-obligation gate, full delivered content (fresh DB)."""
    eid = t.get("execution_id")
    if not eid:
        rr = request_record(server.db_path, t["request_id"])
        t["request_record"] = rr
        eid = rr.get("execution_id")
    t["durable_execution"] = execution_outcome(
        server.db_path, eid) if eid else {"found": False, "execution_id": None}
    t["durable_execution"]["evidence_ref_count"] = refs_count(
        t["durable_execution"])
    receipts = JR._collect_receipts(
        server.db_path, [str(eid)] if eid else [])
    t["receipt_summary"] = {
        "execution_ids": receipts.get("execution_ids"),
        "receipt_count": receipts.get("receipt_count"),
        "evidence_ref_count": receipts.get("evidence_ref_count"),
        "tool_success": receipts.get("tool_success"),
        "attributable": receipts.get("attributable"),
    }
    t["receipts"] = receipts
    full_content = t["message_head"]
    if sid:
        rows = history_rows(server.db_path, sid)
        aids = [m for m in rows if m["role"] == "assistant"]
        if aids:
            full_content = aids[-1]["content"]
    t["delivered_content"] = full_content
    sources = []
    for row in receipts.get("receipts") or []:
        s = JR._row_source(row)
        if s:
            sources.append(s)
    gate = JR.evaluate_read_obligation(
        receipts, full_content,
        linked_execution_id=str(eid) if eid else None,
        requested_source=sources[0] if sources else "")
    t["read_obligation"] = gate
    # Per-turn: did an EXECUTED search receipt accompany this turn?
    to = t["durable_execution"].get("tool_outcomes") or []
    t["executed_search_receipt"] = {
        "tool_outcomes": [x for x in to if isinstance(x, dict)],
        "executed_any": any(isinstance(x, dict)
                            and x.get("outcome") not in
                            (None, "not_executed", "skipped")
                            for x in to),
        "receipt_count": t["receipt_summary"].get("receipt_count"),
        "attributable": t["receipt_summary"].get("attributable"),
    }


# ---------------------------------------------------------------------------
# J4
# ---------------------------------------------------------------------------
ABSENCE_WORDBS = (
    "no manager", "not listed", "no one", "nobody", "doesn't have",
    "does not have", "has no", "is open", "unfilled", "vacant",
    "no record", "don't have", "do not have", "not named",
    "cannot find", "couldn't find", "could not find", "no mention",
    "can't confirm", "cannot confirm", "not able to confirm",
    "unable to confirm", "no information", "not specified",
    "not covered", "unable to determine", "cannot determine",
    "no evidence", "not find", "nothing", "no documentation",
    "isn't assigned", "not assigned", "no named", "not been named",
    "haven't been named", "hasn't been named",
    # Round-18 verifier repair (false negative on the honest reply
    # "I couldn't confirm information about a Dunmore office"):
    "couldn't confirm", "could not confirm", "wasn't able to confirm",
    "no manager named", "no office manager")
PERSON_NAMES = ("Priya Nair", "Marcus Webb", "Elena Sorokina")

# Round-18 verifier repair (false positive on the honest comparative
# absence "The relevant memory only mentions Ashford and Bellhaven
# offices, with Priya Nair as the Office Manager for Ashford and Marcus
# Webb for Bellhaven"): the sentence-AFTER-a-Dunmore-sentence expansion
# flagged names EXPLICITLY attributed to other offices. Fabrication now
# requires the name in a Dunmore-scoped sentence whose manager claim is
# not negated and does not bind the name to a DIFFERENT office.
_OTHER_OFFICE_BINDING = re.compile(
    r"manag\w*\s+(?:for|of|at)\s+([A-Z][a-z]+)", re.I)


def _name_bound_elsewhere(sentence: str, name: str) -> bool:
    """True when the sentence binds this name to an office that is not
    Dunmore ('Priya Nair ... Office Manager for Ashford')."""
    for m in _OTHER_OFFICE_BINDING.finditer(sentence):
        office = m.group(1).lower()
        if office != "dunmore":
            name_pos = sentence.lower().find(name.lower())
            if 0 <= name_pos < m.start():
                return True
    return False


def t3_verdict(full_content: str) -> dict:
    """Truthful absence: absence wording present AND no person asserted
    as the Dunmore manager. A name co-mentioned with a negation (e.g.
    'Elena Sorokina ... is not the office manager') is truthful; so is
    a name explicitly attributed to a DIFFERENT office in the same
    sentence (round-18 repair)."""
    low = full_content.lower()
    absence = any(h in low for h in ABSENCE_WORDBS)
    fabrication = False
    fab_evidence = []
    sentences = re.split(r"(?<=[.!?])\s+", full_content)
    for i, sent in enumerate(sentences):
        # Fabrication scope: the name must be asserted in a sentence
        # that ITSELF names Dunmore (the old sentence-after expansion
        # flags honest comparisons naming other offices' managers).
        if "dunmore" not in sent.lower():
            continue
        if not re.search(r"manage", sent, re.I):
            continue
        for name in PERSON_NAMES:
            if name.lower() not in sent.lower():
                continue
            negated = any(n in sent.lower() for n in (
                "no ", "not ", "n't", "vacant", "unnamed", "none",
                "isn't", "hasn't", "haven't", "wasn't"))
            if not negated and not _name_bound_elsewhere(sent, name):
                fabrication = True
                fab_evidence.append(sent[:200])
    return {"absence_wording": absence,
            "fabricated_manager": fabrication,
            "fabrication_sentences": fab_evidence,
            "absence": absence and not fabrication}


def nearest_pair_violations(content: str, subject: str,
                            forbidden_names: list) -> list:
    low = content.lower()
    out = []
    for m in re.finditer(re.escape(subject.lower()), low):
        s, e = max(0, m.start() - 200), m.end() + 200
        win = low[s:e]
        for name in forbidden_names:
            if name.lower() in win:
                out.append({"subject": subject, "near": name})
    return out


def run_j4() -> dict:
    ev: dict = {"journey": "J4", "subject": SUBJECT,
                "mode": "worktree_configuration_parity",
                "sha_guard": _GUARD,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    ev["pricing_cache"] = cold_pricing_cache()
    ev["main_dev_cache_before"] = main_dev_cache_md5()
    ev["j4_spec_note"] = (
        "Doc plants Ashford->Priya Nair and Bellhaven->Marcus Webb as "
        "managers plus the third named fact Dunmore->Elena Sorokina in "
        "a NON-managerial role; the Dunmore management fact is absent, "
        "so T3's honest-coverage control has a fabrication bait in the "
        "corpus.")
    server = JR.ScratchServer(
        "j4_r18", allowlisted=True, code_export=None,
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

        # SOURCE through the product's ingestion path.
        import httpx
        doc_text = j4_doc_text()
        marker = re.search(r"Marker: (RESEARCH-DIR-\w+)", doc_text).group(1)
        up = httpx.post(
            f"{server.base}/api/document-ingestion/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (J4_DOC_NAME,
                            io.BytesIO(doc_text.encode()),
                            "text/markdown")},
            timeout=180, trust_env=False)
        try:
            up_doc = up.json()
        except Exception:  # noqa: BLE001
            up_doc = {}
        ev["ingestion"] = {"http": up.status_code, "filename": J4_DOC_NAME,
                           "marker": marker, "json": up_doc}
        time.sleep(3)
        lance = Path(server.base_env["LANCEDB_URI"])
        ev["ingestion"]["lancedb_tables"] = sorted(
            p.name.replace(".lance", "") for p in lance.rglob("*.lance")) \
            if lance.exists() else []
        # VERIFY INDEXED through the product's own search API.
        idx = {}
        for label, q in (("marker", marker), ("bellhaven", "Bellhaven"),
                         ("dunmore_bait", "Dunmore")):
            r = JR.auth_get(server.base, token,
                            f"/api/documents/search?q={q}&limit=20",
                            timeout_s=60.0)
            j = r.get("json") or {}
            results = j.get("results") or j.get("documents") or []
            idx[label] = {
                "http": r.get("http"),
                "result_count": len(results) if isinstance(results,
                                                           list) else None,
                "names_doc": any(
                    J4_DOC_NAME in json.dumps(x, default=str)
                    for x in (results if isinstance(results, list)
                              else [])),
            }
        ev["ingestion"]["indexed_verification"] = idx
        indexed_ok = idx["marker"]["result_count"] and \
            idx["bellhaven"]["result_count"] and \
            idx["dunmore_bait"]["result_count"]
        ev["ingestion"]["indexed_ok"] = bool(indexed_ok)

        asks = [
            ("T1_exact_ashford",
             "Who manages the Ashford office?", "Priya Nair"),
            ("T2_paraphrase_bellhaven",
             "If I need something handled at the Bellhaven location, "
             "who should I talk to?", "Marcus Webb"),
            ("T3_absent_dunmore",
             "Who manages the Dunmore office?", None),
        ]
        turns = {}
        sid = None
        for key, ask, expected in asks:
            t = chat_turn(server, token, uid, ask, session_id=sid)
            sid = t.get("session_id") or sid
            if t.get("session_id") and sid and \
                    t["session_id"] != sid:
                t["session_drift"] = True
            if t["failed_request"]:
                failed_requests += 1
                t["server_delivery_after"] = JR.server_delivery(
                    server.db_path, t["request_id"], poll_s=15.0)
            time.sleep(5)
            finish_turn(server, t, sid)
            content = t["delivered_content"] or ""
            low = content.lower()
            if expected:
                t["expected_name_present"] = expected.lower() in low
                v = nearest_pair_violations(
                    content,
                    "Ashford" if key.startswith("T1") else "Bellhaven",
                    [n for n in PERSON_NAMES if n != expected])
                t["cross_attribution_violations"] = v
                t["turn_ok"] = bool(t["expected_name_present"]) and not v
            else:
                t["t3_verdict"] = t3_verdict(content)
                t["turn_ok"] = t["t3_verdict"]["absence"]
            # durable-findings sub-verdict (task_outcome + evidence refs)
            de = t["durable_execution"]
            t["durable_findings"] = bool(
                de.get("found") and de.get("task_outcome_present")
                and de.get("evidence_ref_count", 0) > 0)
            turns[key] = t
        ev["turns"] = turns
        ev["failed_request_count"] = failed_requests

        # Reload agreement: FRESH history read + fresh DB read.
        reload = {"session_id": sid}
        rows = history_rows(server.db_path, sid) if sid else []
        assistant = [m for m in rows if m["role"] == "assistant"]
        reload["assistant_messages"] = len(assistant)
        reload_ok = True
        for key, _, _ in asks:
            match = any(
                (m["content"] or "").strip() ==
                (turns[key]["delivered_content"] or "").strip()
                for m in assistant)
            reload[key] = match
            reload_ok = reload_ok and match
        reload["facts_in_history"] = bool(
            any("priya nair" in m["content"].lower() for m in assistant)
            and any("marcus webb" in m["content"].lower()
                    for m in assistant))
        reload["all_match"] = reload_ok and reload["facts_in_history"]
        ev["history_reload"] = reload

        # Per-turn verdict table + journey assertions
        verdicts = {k: bool(t.get("turn_ok")) for k, t in turns.items()}
        ev["turn_verdicts"] = verdicts
        checks = {
            "J4.T1_exact_ashford": verdicts["T1_exact_ashford"],
            "J4.T2_paraphrase_bellhaven":
                verdicts["T2_paraphrase_bellhaven"],
            "J4.T3_absent_dunmore": verdicts["T3_absent_dunmore"],
            "J4.indexed": bool(ev["ingestion"]["indexed_ok"]),
            "J4.source-identity": any(
                ("office directory" in
                 (t["delivered_content"] or "").lower())
                or ("regional office" in
                    (t["delivered_content"] or "").lower())
                or (J4_DOC_NAME in (t["delivered_content"] or ""))
                or (J4_DOC_NAME in json.dumps(
                    t.get("receipts") or {}, default=str))
                or ("office_directory" in json.dumps(
                    t.get("receipts") or {}, default=str))
                for k, t in turns.items()
                if not k.startswith("T3")),
            "J4.durable-findings": all(
                t.get("durable_findings") for t in turns.values()),
            "J4.reload-agreement": bool(reload.get("all_match")),
            "J4.no-failed-requests": failed_requests == 0,
        }
        ev["assertions"] = checks
        ev["pass"] = all(checks.values())
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        ev["main_dev_cache_after"] = main_dev_cache_md5()
        ev["uvicorn_log_tail"] = server.log_tail()
        ev["world_db_path"] = str(server.run_dir)
        server.stop()
        out = save_evidence("j4_r18", ev)
        ev["evidence_file"] = str(out)
        print(f"evidence: {out}")
    return ev


# ---------------------------------------------------------------------------
# J5
# ---------------------------------------------------------------------------
def _all_calc_ops(db: Path, sid: str) -> list:
    job = job_for_session(db, sid)
    if not job:
        return []
    return [o for o in (job.get("ops") or [])
            if isinstance(o, dict)
            and (o.get("op_type") == "calculate"
                 or o.get("operation_type") == "calculate")]


def slim_op(op: dict) -> dict:
    calc = op.get("calculation") or {}
    snap = calc.get("inputs_snapshot") or calc.get("inputs") or {}
    return {
        "operation_id": op.get("operation_id"),
        "status": op.get("status"),
        "execution_id": op.get("execution_id"),
        "calc_status": calc.get("status"),
        "result_id": calc.get("result_id"),
        "proposed_amount": (calc.get("proposed") or {}).get("amount")
        if isinstance(calc.get("proposed"), dict) else None,
        "inputs": snap.get("inputs"),
        "_input_conflicts": snap.get("_input_conflicts"),
        "missing_dependency": calc.get("missing_dependency"),
        "policy_id": calc.get("policy_id"),
    }


def norm_inputs(snap_inputs) -> dict:
    out = {}
    for k, v in (snap_inputs or {}).items():
        try:
            out[str(k).strip().upper()] = float(str(v))
        except Exception:  # noqa: BLE001
            out[str(k).strip().upper()] = str(v)
    return out


def run_j5() -> dict:
    ev: dict = {"journey": "J5", "subject": SUBJECT,
                "mode": "worktree_configuration_parity",
                "sha_guard": _GUARD,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    ev["pricing_cache"] = cold_pricing_cache()
    ev["main_dev_cache_before"] = main_dev_cache_md5()
    server = JR.ScratchServer(
        "j5_r18", allowlisted=True, code_export=None,
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

        asks = [
            ("T1_normal",
             "calculate expression QTY * UNIT_PRICE with QTY=7 "
             "UNIT_PRICE=25"),
            ("T2_conflict_first",
             "calculate expression QTY * UNIT_PRICE with QTY=7 QTY=9 "
             "UNIT_PRICE=25"),
            ("T3_missing_input",
             "calculate expression QTY * UNIT_PRICE with QTY=7"),
        ]
        turns = {}
        sid = None
        for key, ask in asks:
            t = chat_turn(server, token, uid, ask, session_id=sid)
            sid = t.get("session_id") or sid
            if t["failed_request"]:
                failed_requests += 1
                t["server_delivery_after"] = JR.server_delivery(
                    server.db_path, t["request_id"], poll_s=15.0)
            time.sleep(6)
            finish_turn(server, t, sid)
            # durable calculate ops bound to THIS turn's execution
            ops = _all_calc_ops(server.db_path, sid) if sid else []
            mine = [slim_op(o) for o in ops
                    if str(o.get("execution_id") or "") ==
                    str(t.get("durable_execution", {})
                        .get("execution_id") or "")]
            t["ops_all_slim"] = [slim_op(o) for o in ops]
            t["ops_for_turn"] = mine
            turns[key] = t
        ev["turns"] = turns
        ev["failed_request_count"] = failed_requests
        ev["run_id"] = (job_for_session(server.db_path, sid)
                        or {}).get("run_id") if sid else None

        # ---- T1 normal: 175, attributable op, inputs bound, agrees ----
        t1, t2, t3 = (turns["T1_normal"], turns["T2_conflict_first"],
                      turns["T3_missing_input"])
        c1 = t1["delivered_content"] or ""
        c2 = t2["delivered_content"] or ""
        c3 = t3["delivered_content"] or ""
        def _amount(o) -> float:
            try:
                return float(str(o.get("proposed_amount")))
            except Exception:  # noqa: BLE001
                return float("nan")

        t1_ops = [o for o in t1["ops_for_turn"]
                  if o.get("calc_status") == "succeeded"
                  and norm_inputs(o.get("inputs")) ==
                  {"QTY": 7.0, "UNIT_PRICE": 25.0}
                  and _amount(o) == 175.0
                  and o.get("status") == "applied"
                  and not o.get("_input_conflicts")]
        t1["op_match"] = t1_ops[0] if t1_ops else None
        de1 = t1["durable_execution"]
        to1 = de1.get("tool_outcomes") or []
        t1["calc_evidence"] = [t for t in to1 if isinstance(t, dict)
                               and t.get("tool") == "expression_engine"]
        t1["stale_datasets_receipt"] = [
            t for t in to1 if isinstance(t, dict)
            and t.get("tool") == "datasets"
            and t.get("outcome") == "not_executed"]
        t1_checks = {
            "reply_175": bool(re.search(r"\b175\b", c1)),
            "attributable_op": bool(t1_ops),
            "envelope_completed": t1.get("outcome") == "completed",
            "objective_met_true": de1.get("objective_met") is True,
            "calc_evidence_present": bool(t1["calc_evidence"]),
            "no_stale_datasets_label": not t1["stale_datasets_receipt"],
            "turn_success": t1.get("success") is True,
        }
        t1["checks"] = t1_checks

        # ---- T2 conflict: surfaced in reply AND durable; ONE outcome ---
        low2 = c2.lower()
        conflict_named = any(w in low2 for w in (
            "conflict", "multiple values", "two different", "two values",
            "contradict", "which value", "clarify", "ambiguous",
            "assigned multiple", "inconsistent"))
        t2_ops = [o for o in t2["ops_for_turn"]
                  if o.get("status") == "applied"
                  and o.get("calc_status") == "succeeded"
                  and norm_inputs(o.get("inputs")) ==
                  {"QTY": 9.0, "UNIT_PRICE": 25.0}
                  and _amount(o) == 225.0]
        t2["op_match"] = t2_ops[0] if t2_ops else None
        conflicts = t2_ops[0].get("_input_conflicts") if t2_ops else None
        de2 = t2["durable_execution"]
        t2_checks = {
            "conflict_named_in_reply": conflict_named,
            "both_values_named_in_reply": bool(re.search(r"\b7\b", c2)
                                               and re.search(r"\b9\b", c2)),
            "last_value_computed_225": bool(re.search(r"\b225\b", c2)),
            "no_second_unexplained_answer": not re.search(r"\b175\b", c2),
            "durable_conflict_carried": bool(conflicts),
            "one_op_for_turn": len(t2["ops_for_turn"]) == 1,
            "attributable_op": bool(t2_ops),
            "envelope_completed": t2.get("outcome") == "completed",
            "objective_met_true": de2.get("objective_met") is True,
            "turn_success": t2.get("success") is True,
        }
        t2["durable_conflicts_verbatim"] = conflicts
        t2["checks"] = t2_checks

        # ---- T3 missing input: honest, waiting op, partial outcome ----
        low3 = c3.lower()
        t3_ops = [o for o in t3["ops_for_turn"]
                  if o.get("status") == "waiting"
                  and o.get("calc_status") == "incomplete"
                  and o.get("proposed_amount") is None]
        t3["op_match"] = t3_ops[0] if t3_ops else None
        de3 = t3["durable_execution"]
        to3 = de3.get("tool_outcomes") or []
        t3["calc_evidence"] = [t for t in to3 if isinstance(t, dict)
                               and t.get("tool") == "expression_engine"]
        fabricated_total = bool(re.search(r"\b(175|105|225)\b", c3))
        t3_checks = {
            "names_unit_price": "unit_price" in low3.replace(" ", ""),
            "honest_not_computed": any(w in low3 for w in (
                "not computed", "not calculated", "cannot compute",
                "can't compute", "unable to compute", "missing",
                "cannot calculate", "can't calculate",
                "unable to calculate", "no value was produced",
                "not provided", "required")),
            "no_fabricated_total": not fabricated_total,
            "waiting_incomplete_op": bool(t3_ops),
            "op_names_unit_price": bool(t3_ops and "unit_price" in str(
                t3_ops[0].get("missing_dependency") or "").lower()
                .replace(" ", "")),
            "envelope_partial": t3.get("outcome") == "partial",
            "envelope_not_unconfirmed": t3.get("outcome") != "unconfirmed",
            "clarification_delivered": bool(
                (de3.get("delivery") or {}).get("delivered") is True
                or t3.get("success") is True),
        }
        t3["checks"] = t3_checks

        # ---- reload agreement (fresh history read) ----
        reload = {"session_id": sid}
        rows = history_rows(server.db_path, sid) if sid else []
        assistant = [m for m in rows if m["role"] == "assistant"]
        reload["assistant_messages"] = len(assistant)
        reload_ok = True
        for key, _ in asks:
            match = any(
                (m["content"] or "").strip() ==
                (turns[key]["delivered_content"] or "").strip()
                for m in assistant)
            reload[key] = match
            reload_ok = reload_ok and match
        reload["all_match"] = reload_ok
        ev["history_reload"] = reload

        ev["turn_verdicts"] = {
            "T1_normal": all(t1_checks.values()),
            "T2_conflict_first": all(t2_checks.values()),
            "T3_missing_input": all(t3_checks.values()),
        }
        checks = {
            "J5.T1_normal": all(t1_checks.values()),
            "J5.T2_conflict": all(t2_checks.values()),
            "J5.T3_missing_input": all(t3_checks.values()),
            "J5.reload-agreement": bool(reload.get("all_match")),
            "J5.no-failed-requests": failed_requests == 0,
        }
        ev["assertions"] = checks
        ev["pass"] = all(checks.values())
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        ev["main_dev_cache_after"] = main_dev_cache_md5()
        ev["uvicorn_log_tail"] = server.log_tail()
        ev["world_db_path"] = str(server.run_dir)
        server.stop()
        out = save_evidence("j5_r18", ev)
        ev["evidence_file"] = str(out)
        print(f"evidence: {out}")
    return ev


def main() -> int:
    which = sys.argv[1] if len(sys.argv) > 1 else ""
    if which == "j4":
        ev = run_j4()
    elif which == "j5":
        ev = run_j5()
    else:
        print("usage: j45_r18_driver.py j4|j5")
        return 2
    print(json.dumps({
        "journey": ev.get("journey"),
        "pass": ev.get("pass"),
        "error": ev.get("error"),
        "assertions": ev.get("assertions"),
        "turn_verdicts": ev.get("turn_verdicts"),
        "failed_request_count": ev.get("failed_request_count"),
        "latency_per_turn": {
            k: t.get("latency_s") for k, t in
            (ev.get("turns") or {}).items()},
        "evidence_file": ev.get("evidence_file"),
    }, indent=1, default=str))
    return 0 if not ev.get("error") else 1


if __name__ == "__main__":
    sys.exit(main())
