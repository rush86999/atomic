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
         {"id": "J2.byok-add",
          "check": "one BYOK provider (or ATOM_LOCAL_ONLY + Ollama) added "
                   "through Settings > AI / public API; key encrypted at rest",
          "harness": "preview_stack.seed_byok_store (privileged seeding only)"},
         {"id": "J2.real-reply",
          "check": "a chat turn produces a REAL model reply (not mock, no "
                   "coding-agent intervention)"},
         {"id": "J2.tool-planning",
          "check": "tool planning selects a tool for a tool-shaped ask"},
     ]},
    {"id": "J3", "name": "Source connection",
     "assertions": [
         {"id": "J3.connect",
          "check": "connect/ingest one document source through the normal "
                   "product path"},
         {"id": "J3.authorized-read",
          "check": "the authorized workspace retrieves the source content"},
         {"id": "J3.isolation",
          "check": "a DIFFERENT workspace cannot retrieve it"},
     ]},
    {"id": "J4", "name": "Research",
     "assertions": [
         {"id": "J4.source-bound",
          "check": "a fresh request yields source-bound findings (basis/"
                   "citation present, not free invention)",
          "harness": f"{HARNESS}/case1_quote_trials.py, "
                     f"{HARNESS}/f09_targeted_cases.py (privileged)"},
         {"id": "J4.uncertainty",
          "check": "uncertainty is preserved when sources do not answer "
                   "(no fabricated closure)"},
         {"id": "J4.survives-reload",
          "check": "history API after reload returns what the turns "
                   "delivered",
          "harness": f"{HARNESS}/acceptance_trial_lib.py::history_texts"},
     ]},
    {"id": "J5", "name": "Calculation",
     "assertions": [
         {"id": "J5.binding",
          "check": "inputs bind to the record (resolved bindings captured)",
          "harness": f"{HARNESS}/case3_identity_probe.py (privileged)"},
         {"id": "J5.persist",
          "check": "the engine operation persists (durable record of what ran)",
          "harness": f"{HARNESS}/case3_record_trace.py (privileged)"},
         {"id": "J5.readback-agreement",
          "check": "the reply agrees with the durable record",
          "harness": f"{HARNESS}/case3_calc_trials.py (privileged)"},
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
    records = load_records()
    records[a_id] = {"status": status,
                     "evidence": evidence,
                     "notes": notes,
                     "campaign": campaign,
                     "recorded_at": time.strftime(
                         "%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())}
    save_records(records)
    print(f"recorded {a_id} = {status}")


def cmd_check(strict: bool) -> int:
    m = build_matrix(load_records())
    failing = [j["id"] for j in m["journeys"] if j["status"] == "FAILING"]
    untested = [j["id"] for j in m["journeys"] if j["status"] == "UNTESTED"]
    if failing:
        print(f"FAILING journeys: {', '.join(failing)}")
        return 1
    if strict and untested:
        print(f"UNTESTED journeys (strict): {', '.join(untested)}")
        return 1
    print(f"no failing journeys; untested: "
          f"{', '.join(untested) if untested else 'none'}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--strict", action="store_true")
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
        return cmd_check(args.strict)
    if args.json:
        cmd_json()
        return 0
    cmd_list()
    return 0


if __name__ == "__main__":
    sys.exit(main())
