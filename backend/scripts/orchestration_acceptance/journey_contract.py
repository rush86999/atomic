#!/usr/bin/env python3
"""Journey registry + runner for the acceptance contract.

The standing contract is docs/acceptance/ACCEPTANCE_CONTRACT.md; this
module is its executable half. Each journey decomposes into concrete
boundary assertions. Statuses live in journey_matrix/journey_status.json
(assertion_id -> record); assertions without a record are UNTESTED —
silence must never read as success.

Commands:
  --list                     print the matrix (default)
  --record A_ID --status verified|failing|untested
                 [--evidence PATH] [--notes "..."]
                 [--campaign ID]     write one status record
  --check                    exit 1 if any journey is FAILING
                             (--strict: also exit 1 on any UNTESTED)
  --json                     machine-readable matrix on stdout

Evidence pointers point into journey_matrix/ (results JSONs carry no
secrets and are safe to commit). Privileged-world harness files listed
per journey are CAPABILITY evidence — they can never set a journey to
verified; only fresh-install runs can.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

BACKEND = Path(__file__).resolve().parents[2]
RESULTS_DIR = Path(__file__).resolve().parent / "journey_matrix"
STATUS_FILE = RESULTS_DIR / "journey_status.json"

HARNESS = "backend/scripts/orchestration_acceptance"

# ---------------------------------------------------------------------------
# The nine journeys. Assertions are checks a harness case must prove at a
# public boundary on a FRESH INSTALL (quickstart-generated env, fresh
# workspace). `harness` names existing privileged-world cases: capability
# evidence only.
# ---------------------------------------------------------------------------
JOURNEYS: List[Dict[str, Any]] = [
    {"id": "J1", "name": "Fresh setup",
     "assertions": [
         {"id": "J1.quickstart-install",
          "check": "quickstart.sh from a clean state produces a working "
                   "venv, deps, and a generated .env"},
         {"id": "J1.config-parity",
          "check": "required gates (ATOM_TASK_LIFECYCLE_ENABLED, "
                   "CHAT_FINALIZATION_M1/M2) are EFFECTIVE in the running "
                   "server process, not merely present",
          "harness": f"{HARNESS}/fresh_install_parity.py"},
         {"id": "J1.boot",
          "check": "backend boots and /api/health reports healthy identity "
                   "on the generated env (scratch DB)"},
         {"id": "J1.signin",
          "check": "sign in via POST /api/auth/login (bootstrap admin)",
          "harness": f"{HARNESS}/acceptance_trial_lib.py::real_admin_login"},
         {"id": "J1.workspace",
          "check": "create a workspace through the product; it appears "
                   "after reload"},
     ]},
    {"id": "J2", "name": "Model setup",
     "assertions": [
         {"id": "J2.byok-add-product-path",
          "check": "one BYOK provider key stored THROUGH the product "
                   "(POST /api/ai/providers/{id}/keys — the Settings -> AI "
                   "call) and readable back (decrypts)",
          "harness": f"{HARNESS}/j2_model_setup.py world B"},
         {"id": "J2.byok-survive-restart",
          "check": "the product-stored key survives a REAL restart (same "
                   "run dir/DB, new process) and still decrypts",
          "harness": f"{HARNESS}/j2_model_setup.py world B"},
         {"id": "J2.local-provider-product-path",
          "check": "local inference configured through the product "
                   "(POST /api/local-models register/discover/capabilities) "
                   "with a live Ollama",
          "harness": f"{HARNESS}/j2_model_setup.py world A"},
         {"id": "J2.real-reply",
          "check": "a chat turn produces a REAL provider-served reply (not "
                   "mock, no coding-agent intervention)",
          "harness": f"{HARNESS}/j2_model_setup.py world A"},
         {"id": "J2.tool-planning",
          "check": "tool planning selects a tool for a tool-shaped ask AND "
                   "the turn carries an attributable execution receipt "
                   "(agent_executions.task_outcome.tool_outcomes)"},
     ]},
    {"id": "J3", "name": "Source connection",
     "assertions": [
         {"id": "J3.upload",
          "check": "connect/ingest one document source through the normal "
                   "product path (POST /api/document-ingestion/upload)",
          "harness": f"{HARNESS}/j3_source_connection.py"},
         {"id": "J3.authorized-read",
          "check": "the authorized workspace retrieves the source content "
                   "(GET /api/documents/search finds the marker)",
          "harness": f"{HARNESS}/j3_source_connection.py"},
         {"id": "J3.isolation",
          "check": "a DIFFERENT workspace cannot retrieve it (second fresh "
                   "user searches the same marker: zero results)",
          "harness": f"{HARNESS}/j3_source_connection.py"},
     ]},
    {"id": "J4", "name": "Research",
     "assertions": [
         {"id": "J4.source-bound",
          "check": "upload a document through the product, then a research "
                   "ask yields findings BOUND to it (the planted fact "
                   "returns)",
          "harness": f"{HARNESS}/j4_research.py"},
         {"id": "J4.uncertainty",
          "check": "an ask the sources cannot answer preserves uncertainty "
                   "(honest miss, no fabricated closure)",
          "harness": f"{HARNESS}/j4_research.py"},
         {"id": "J4.survives-reload",
          "check": "history API after the turns returns what was delivered",
          "harness": f"{HARNESS}/j4_research.py"},
     ]},
    {"id": "J5", "name": "Calculation",
     "assertions": [
         {"id": "J5.binding",
          "check": "the workbook fixture is uploaded through the product "
                   "and the calculate ask names its rows (no seeded rows)",
          "harness": f"{HARNESS}/j5_calculation.py"},
         {"id": "J5.persist",
          "check": "the engine operation persists as a calculate operation "
                   "on the task lifecycle record (read-only sqlite)",
          "harness": f"{HARNESS}/j5_calculation.py"},
         {"id": "J5.readback-agreement",
          "check": "the reply agrees with the durable record",
          "harness": f"{HARNESS}/j5_calculation.py"},
     ]},
    {"id": "J6", "name": "Drafting",
     "assertions": [
         {"id": "J6.authorized-once",
          "check": "an explicitly authorized change lands exactly once",
          "harness": f"{HARNESS}/canvas_write_verify.py (privileged)"},
         {"id": "J6.protected-content",
          "check": "protected content is preserved"},
         {"id": "J6.survives-reload",
          "check": "the accepted projection equals what was delivered",
          "harness": f"{HARNESS}/task_correction_acceptance.py (privileged)"},
     ]},
    {"id": "J7", "name": "Background work",
     "assertions": [
         {"id": "J7.truthful-handoff",
          "check": "handoff surfaces a real job id and honest status"},
         {"id": "J7.same-job-continuation",
          "check": "a re-ask continues the SAME job (no duplicate work)"},
         {"id": "J7.durable-result",
          "check": "result survives a process restart",
          "harness": f"{HARNESS}/case6_restart_trials.py, "
                     f"{HARNESS}/restart_durability.py (privileged)"},
     ]},
    {"id": "J8", "name": "Workflow automation",
     "assertions": [
         {"id": "J8.plain-language-create",
          "check": "a plain-language request creates an EXECUTABLE workflow "
                   "through the product (README: chat to build, no "
                   "drag-and-drop)"},
         {"id": "J8.approval-rejection",
          "check": "approval executes; rejection does not; the record "
                   "matches what ran"},
     ]},
    {"id": "J9", "name": "Failure recovery",
     "assertions": [
         {"id": "J9.truthful-failure",
          "check": "provider/source failure is reported truthfully "
                   "(exact-execution failure reporting, M1)",
          "harness": f"{HARNESS}/live_integration_acceptance.py "
                     f"(ATOM_TEST_FORCE_TURN_FAILURE case, privileged)"},
         {"id": "J9.usable-after-failure",
          "check": "UI/API remains usable after the failure",
          "harness": f"{HARNESS}/case5_browser_recovery.py (privileged)"},
         {"id": "J9.recoverable",
          "check": "eligible work remains recoverable (claim/continuation)"},
     ]},
]

VALID_STATUSES = ("verified", "failing", "untested")

# Declared release scope: SETUP READINESS (fresh install, models, sources)
# — NOT the advertised core loop. Research, drafting, background work and
# automation (J4-J9) are outside this gate until their journeys are
# executed; passing this scope must never be reported as whole-app
# certification. J1's clean-state dependency installation deliberately
# stays untested here: a code export reusing an existing interpreter does
# not prove installation.
RELEASE_SCOPE = ("J1", "J2", "J3")


def _candidate_identity() -> Dict[str, str]:
    """Commit + dirty-tracked identity captured at record time. A verified
    record without identity is unauditable — rejected, not warned."""
    import subprocess
    def _run(*argv: str) -> str:
        try:
            out = subprocess.run(
                list(argv), cwd=str(BACKEND.parent), capture_output=True,
                text=True, timeout=15).stdout.strip()
            return out or "unknown"
        except Exception:
            return "unknown"
    commit = _run("git", "rev-parse", "HEAD")
    if commit in ("", "unknown"):
        raise SystemExit("cannot capture candidate identity (git rev-parse "
                         "failed) — refusing to record a verified status "
                         "without identity")
    return {"commit": commit,
            "dirty_tracked": _run("git", "status", "--short",
                                  "--untracked-files=no")}


def _validate_evidence(evidence: Optional[str]) -> str:
    if not evidence or not evidence.strip():
        raise SystemExit("verified records require --evidence "
                         "(a path or a precise pointer)")
    first = evidence.split("(", 1)[0].strip().rstrip(")")
    if not first:
        raise SystemExit("--evidence must lead with a file pointer")
    for base in (BACKEND.parent, BACKEND, Path(__file__).resolve().parent):
        cand = (base / first) if not Path(first).is_absolute() else Path(first)
        if cand.exists():
            return str(cand)
    raise SystemExit(f"--evidence pointer does not exist: {first!r} — "
                     f"record the evidence file first, then reference it")


def load_records() -> Dict[str, Dict[str, Any]]:
    if not STATUS_FILE.exists():
        return {}
    return json.loads(STATUS_FILE.read_text())


def save_records(records: Dict[str, Dict[str, Any]]) -> None:
    RESULTS_DIR.mkdir(exist_ok=True)
    STATUS_FILE.write_text(json.dumps(records, indent=2) + "\n")


def journey_status(j: Dict[str, Any],
                   records: Dict[str, Dict[str, Any]]) -> str:
    st = [records.get(a["id"], {}).get("status", "untested")
          for a in j["assertions"]]
    if any(s == "failing" for s in st):
        return "FAILING"
    if all(s == "verified" for s in st):
        return "VERIFIED"
    return "UNTESTED"


def build_matrix(records: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    out = {"generated_at": time.strftime(
               "%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
           "contract": "docs/acceptance/ACCEPTANCE_CONTRACT.md",
           "journeys": []}
    for j in JOURNEYS:
        assertions = []
        for a in j["assertions"]:
            rec = records.get(a["id"], {})
            assertions.append({
                "id": a["id"], "check": a["check"],
                "harness": a.get("harness"),
                "status": rec.get("status", "untested"),
                "evidence": rec.get("evidence"),
                "notes": rec.get("notes"),
                "recorded_at": rec.get("recorded_at"),
                "campaign": rec.get("campaign"),
            })
        out["journeys"].append({"id": j["id"], "name": j["name"],
                                "status": journey_status(j, records),
                                "assertions": assertions})
    return out


def cmd_list() -> None:
    m = build_matrix(load_records())
    for j in m["journeys"]:
        print(f"{j['id']}  {j['name']:<20} {j['status']}")
        for a in j["assertions"]:
            ev = f"  <- {a['evidence']}" if a["evidence"] else ""
            print(f"    {a['id']:<32} {a['status']}{ev}")


def cmd_json() -> None:
    print(json.dumps(build_matrix(load_records()), indent=2))


def cmd_record(a_id: str, status: str, evidence: Optional[str],
               notes: Optional[str], campaign: Optional[str]) -> None:
    known = {a["id"] for j in JOURNEYS for a in j["assertions"]}
    if a_id not in known:
        raise SystemExit(f"unknown assertion id {a_id!r}; "
                         f"known: {sorted(known)}")
    if status not in VALID_STATUSES:
        raise SystemExit(f"status must be one of {VALID_STATUSES}")
    record: Dict[str, Any] = {
        "status": status,
        "evidence": evidence,
        "notes": notes,
        "campaign": campaign,
        "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                     time.gmtime()),
    }
    if status == "verified":
        # Review #3: an unauditable verified record is worse than untested.
        if not campaign or not campaign.strip():
            raise SystemExit("verified records require --campaign "
                             "(candidate/configuration identity context)")
        # Validate the pointer resolves, store the PORTABLE form the caller
        # gave (verifier note: absolute /Users/... paths in the registry are
        # non-portable).
        _validate_evidence(evidence)
        record["evidence_path"] = evidence.split("(")[0].strip()
        record["identity"] = _candidate_identity()
    records = load_records()
    records[a_id] = record
    save_records(records)
    print(f"recorded {a_id} = {status}")


def _in_scope(j: Dict[str, Any], scope: Optional[tuple]) -> bool:
    return scope is None or j["id"] in scope


def cmd_check(strict: bool, release: bool, scope_str: Optional[str]) -> int:
    scope: Optional[tuple] = None
    if release:
        scope = RELEASE_SCOPE
    elif scope_str:
        scope = tuple(s.strip() for s in scope_str.split(",") if s.strip())
    m = build_matrix(load_records())
    journeys = [j for j in m["journeys"] if _in_scope(j, scope)]
    failing = [j["id"] for j in journeys if j["status"] == "FAILING"]
    untested = [j["id"] for j in journeys if j["status"] == "UNTESTED"]
    label = (f"release scope {', '.join(scope)}" if release
             else (f"scope {', '.join(scope)}" if scope
                   else "all journeys"))
    if failing:
        print(f"FAILING ({label}): {', '.join(failing)}")
        return 1
    if strict and untested:
        print(f"UNTESTED in strict {label}: {', '.join(untested)}")
        return 1
    print(f"no failing journeys ({label}); untested: "
          f"{', '.join(untested) if untested else 'none'}"
          f"{' [strict]' if strict else ''}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--strict", action="store_true",
                    help="--check also fails on UNTESTED journeys")
    ap.add_argument("--release", action="store_true",
                    help=f"--check against the declared release scope "
                         f"({', '.join(RELEASE_SCOPE)})")
    ap.add_argument("--scope", help="comma-separated journey ids")
    ap.add_argument("--record", metavar="ASSERTION_ID")
    ap.add_argument("--status", choices=VALID_STATUSES)
    ap.add_argument("--evidence")
    ap.add_argument("--notes")
    ap.add_argument("--campaign")
    args = ap.parse_args()
    if args.record:
        if not args.status:
            raise SystemExit("--record requires --status")
        cmd_record(args.record, args.status, args.evidence, args.notes,
                   args.campaign)
        return 0
    if args.check:
        return cmd_check(args.strict, args.release, args.scope)
    if args.json:
        cmd_json()
        return 0
    cmd_list()
    return 0


if __name__ == "__main__":
    sys.exit(main())
