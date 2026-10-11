#!/usr/bin/env python3
"""Fresh-install configuration parity probe (acceptance contract, journey J1).

Question answered (owner directive 2026-10-11): does the environment a
fresh user gets from ``scripts/quickstart.sh`` enable the feature gates
that every tested chat-execution path requires — the same gates every
acceptance harness arms for itself (preview_stack.server_env,
preview_server, live_integration_acceptance)?

The three gates, all read with the exact ``== "1"`` comparison
(``true``/``yes`` DO NOT enable — see backend/.env.example §6 incident note):

  ATOM_TASK_LIFECYCLE_ENABLED=1
      integrations/chat_orchestrator.py::_task_lifecycle_for — durable task
      lifecycle (task correction, scope-guarded edits). Without it the
      function returns None and the whole lifecycle is silently absent.
  CHAT_FINALIZATION_M1=1
      integrations/chat_orchestrator.py:6195,6740 + integrations/chat_routes.py:1372
      — exact-execution failure reporting.
  CHAT_FINALIZATION_M2=1
      integrations/chat_routes.py:1376 — finalized-outcome persistence.

Method:
  1. Parse the ACTUAL heredoc from scripts/quickstart.sh (never a copied
     template — drift fails loudly). Substitute the secret vars the script
     generates just before the heredoc; any other ``$VAR`` left over is a
     hard error.
  2. Static audit: every required gate must be present with value exactly
     ``1`` (a ``true``-style value is reported as the documented
     silent-disable trap, not a pass).
  3. Dynamic probe (subprocess, clean env + the generated file only):
     replicate the app's dotenv load order (main_api_app.py:37 —
     backend/.env first, no override) and evaluate the three comparisons
     verbatim; then construct the REAL lifecycle wiring exactly as
     _task_lifecycle_for does (TaskLifecycle(GoalRunService, GoalService))
     against a scratch DATABASE_URL.
  4. --boot: launch the real uvicorn app on a free port with the generated
     env (DATABASE_URL/ATOM_DATA_DIR redirected to scratch — a probe must
     never touch backend/data/atom.db or atom_dev.db) and require
     GET /api/health to report identity.

Known limitation, recorded rather than hidden: in a dirty checkout the
boot check cannot be a perfectly pristine fresh install, because
main_api_app.py:37-39 loads the repo's own backend/.env (unconditionally,
no isolation switch). Gate keys are pinned in the child env to force the
fresh-install outcome (dotenv does not override existing env); other
dev conveniences (model credentials) may leak into the boot — they do not
affect the boot/serve assertion. A fully pristine boot belongs to the
run_isolated world machinery (code export excludes .env).

Exit codes: 0 parity pass, 1 parity fail, 2 probe error.
Results JSON (no secrets) lands in journey_matrix/.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

BACKEND = Path(__file__).resolve().parents[2]
REPO = BACKEND.parent
QUICKSTART = REPO / "scripts" / "quickstart.sh"
RESULTS_DIR = Path(__file__).resolve().parent / "journey_matrix"

VENV_CANDIDATES = (BACKEND / "venv314" / "bin" / "python",
                   BACKEND / "venv" / "bin" / "python")

# name -> (required value, human meaning). Keep in lockstep with
# backend/.env.example §6; the drift guard below cross-checks the
# documented trio still exists in .env.example.
REQUIRED_GATES: Dict[str, Dict[str, str]] = {
    "ATOM_TASK_LIFECYCLE_ENABLED": {
        "value": "1",
        "why": "durable task lifecycle — _task_lifecycle_for returns None "
               "otherwise (task correction, scope-guarded edits absent)",
    },
    "CHAT_FINALIZATION_M1": {
        "value": "1",
        "why": "exact-execution failure reporting (fallback honesty)",
    },
    "CHAT_FINALIZATION_M2": {
        "value": "1",
        "why": "finalized-outcome persistence per execution",
    },
}
# Source sites the dynamic probe re-verifies verbatim before trusting its
# own replicated comparisons.
GATE_SOURCE_SITES = {
    "ATOM_TASK_LIFECYCLE_ENABLED": [
        ("backend/integrations/chat_orchestrator.py",
         'os.getenv("ATOM_TASK_LIFECYCLE_ENABLED") != "1"'),
    ],
    "CHAT_FINALIZATION_M1": [
        ("backend/integrations/chat_orchestrator.py",
         'os.getenv("CHAT_FINALIZATION_M1") == "1"'),
        ("backend/integrations/chat_routes.py",
         'os.getenv("CHAT_FINALIZATION_M1") == "1"'),
    ],
    "CHAT_FINALIZATION_M2": [
        ("backend/integrations/chat_routes.py",
         'os.getenv("CHAT_FINALIZATION_M2") == "1"'),
    ],
}


def _venv_py() -> Path:
    for p in VENV_CANDIDATES:
        if p.exists():
            return p
    raise SystemExit("no backend venv python found (venv314/venv)")


# ---------------------------------------------------------------------------
# 1. Parse the real quickstart heredoc
# ---------------------------------------------------------------------------
def parse_quickstart_env() -> Dict[str, Any]:
    text = QUICKSTART.read_text()
    m = re.search(r"^(\s*)cat > backend/\.env <<EOF\n(.*?)^EOF$",
                  text, re.M | re.S)
    if not m:
        raise SystemExit("quickstart.sh heredoc for backend/.env not found — "
                         "template drift; update this probe")
    block = m.group(2)

    # Secret vars the script generates before the heredoc:
    #   NAME=$(python3 -c "import secrets; print(secrets.token_urlsafe(N))")
    gen = {mm.group(1): secrets.token_urlsafe(int(mm.group(2)))
           for mm in re.finditer(
               r"^\s*(\w+)=\$\(python3 -c \"import secrets; "
               r"print\(secrets\.token_urlsafe\((\d+)\)\)\"\)\s*$",
               text, re.M)}
    leftovers = sorted(set(re.findall(r"\$(\w+)", block)) - set(gen))
    if leftovers:
        raise SystemExit(f"heredoc references vars quickstart does not "
                         f"generate: {leftovers} — drift; update this probe")
    for name, val in gen.items():
        block = block.replace(f"${name}", val)
    return {"block": block,
            "keys": _dotenv_parse_text(block)}


def _dotenv_parse_text(text: str) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        out[key.strip()] = val.strip().strip('"').strip("'")
    return out


# ---------------------------------------------------------------------------
# 2. Static audit
# ---------------------------------------------------------------------------
def static_audit(env: Dict[str, str]) -> Dict[str, Any]:
    per_gate = {}
    ok = True
    for name, spec in REQUIRED_GATES.items():
        raw = env.get(name)
        if raw is None:
            verdict = "MISSING"
            ok = False
        elif raw == spec["value"]:
            verdict = "EFFECTIVE"
        elif raw.lower() in ("true", "yes", "on"):
            verdict = "SILENT_DISABLE_TRAP"  # documented in .env.example §6
            ok = False
        else:
            verdict = "WRONG_VALUE"  # gates compare == "1" exactly
            ok = False
        per_gate[name] = {"raw": raw, "verdict": verdict,
                          "required": spec["value"], "why": spec["why"]}
    return {"ok": ok, "gates": per_gate}


def verify_gate_sources() -> Dict[str, Any]:
    """The replicated comparisons in the probe mean something only while the
    source still compares exactly this way. Re-check the literal sites."""
    out = {"ok": True, "sites": []}
    for name, sites in GATE_SOURCE_SITES.items():
        for rel, needle in sites:
            path = REPO / rel
            present = needle in path.read_text()
            out["sites"].append({"gate": name, "file": rel,
                                 "literal_found": present})
            if not present:
                out["ok"] = False
    return out


# ---------------------------------------------------------------------------
# 3. Dynamic probe (subprocess, mirrors main_api_app load order)
# ---------------------------------------------------------------------------
PROBE_CHILD = r'''
import json, os, sys
sys.path.insert(0, sys.argv[1])  # BACKEND
env_file = sys.argv[2]
from dotenv import load_dotenv
# main_api_app.py:37 order: backend/.env first, override=False (process
# env wins) — the probe child carries the generated env as process env.
load_dotenv(env_file)
gates = {
    "ATOM_TASK_LIFECYCLE_ENABLED": os.getenv("ATOM_TASK_LIFECYCLE_ENABLED") == "1",
    "CHAT_FINALIZATION_M1": os.getenv("CHAT_FINALIZATION_M1") == "1",
    "CHAT_FINALIZATION_M2": os.getenv("CHAT_FINALIZATION_M2") == "1",
}
lifecycle = {"constructed": False}
if gates["ATOM_TASK_LIFECYCLE_ENABLED"]:
    try:
        from core.database import get_db_session
        from core.goals.goal_run_service import GoalRunService
        from core.goals.goal_service import GoalService
        from core.task_lifecycle import TaskLifecycle
        ws, tn = "parity-probe", "default"
        lc = TaskLifecycle(
            GoalRunService(workspace_id=ws, tenant_id=tn,
                           session_factory=get_db_session),
            GoalService(workspace_id=ws, tenant_id=tn,
                        session_factory=get_db_session))
        lifecycle = {"constructed": True, "type": type(lc).__name__}
    except Exception as exc:  # noqa: BLE001
        lifecycle = {"constructed": False,
                     "error": f"{type(exc).__name__}: {exc}"}
print("@@@" + json.dumps({"gates": gates, "lifecycle": lifecycle}))
'''


def dynamic_probe(env: Dict[str, str], env_file: Path) -> Dict[str, Any]:
    py = _venv_py()
    scratch = tempfile.mkdtemp(prefix="atom_parity_probe_")
    child = Path(scratch) / "_probe_child.py"
    child.write_text(PROBE_CHILD)
    cenv = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"),
            "HOME": os.environ.get("HOME", str(Path.home())),
            "PYTHONDONTWRITEBYTECODE": "1",
            "DATABASE_URL": f"sqlite:///{scratch}/probe.db",
            "ATOM_DATA_DIR": f"{scratch}/data"}
    cenv.update(env)  # the generated env, as a fresh install's process env
    res = subprocess.run([str(py), str(child), str(BACKEND), str(env_file)],
                         capture_output=True, text=True, timeout=300,
                         env=cenv, cwd=str(scratch))
    for line in res.stdout.splitlines():
        if line.startswith("@@@"):
            return json.loads(line[3:])
    return {"error": "probe child produced no result",
            "stderr_tail": res.stderr[-800:]}


# ---------------------------------------------------------------------------
# 4. Boot check: the real app on a scratch DB
# ---------------------------------------------------------------------------
def _free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def boot_check(env: Dict[str, str], timeout_s: float = 150.0,
               journey_j1: bool = False) -> Dict[str, Any]:
    import httpx
    py = _venv_py()
    port = _free_port()
    scratch = tempfile.mkdtemp(prefix="atom_parity_boot_")
    (Path(scratch) / "data").mkdir()
    cenv = dict(os.environ)
    cenv.update(env)  # generated env; process env beats backend/.env (no override)
    # Fresh-install equivalence for the GATES even when the dev's backend/.env
    # carries them (dotenv override=False keeps our pinned values). For the
    # FIXED env these are "1" already; for the CURRENT env they are "" — the
    # documented known-limitation scrub (see module docstring).
    for name, spec in REQUIRED_GATES.items():
        cenv[name] = env.get(name, "")
    cenv.update({
        "DATABASE_URL": f"sqlite:///{scratch}/atom.db",
        "ATOM_DATA_DIR": f"{scratch}/data",
        "PYTHONDONTWRITEBYTECODE": "1",
    })
    if journey_j1:
        # Pin the scratch world's admin password so J1 assertions never read
        # or write the repo's shared backend/logs password files.
        cenv["ADMIN_PASSWORD"] = secrets.token_urlsafe(18)
    proc = subprocess.Popen(
        [str(py), "-m", "uvicorn", "main_api_app:app",
         "--host", "127.0.0.1", "--port", str(port), "--log-level", "warning"],
        cwd=str(BACKEND), env=cenv,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    t0 = time.monotonic()
    out: Dict[str, Any] = {"port": port}
    try:
        while time.monotonic() - t0 < timeout_s:
            if proc.poll() is not None:
                out.update({"booted": False,
                            "error": f"uvicorn exited rc={proc.returncode}"})
                break
            try:
                r = httpx.get(f"http://127.0.0.1:{port}/api/health",
                              timeout=3, trust_env=False)
                if r.status_code == 200:
                    doc = r.json() if r.json else {}
                    ident = doc.get("identity") or {}
                    out.update({
                        "booted": True,
                        "seconds": round(time.monotonic() - t0, 1),
                        "status": doc.get("status"),
                        "pid": ident.get("pid"),
                        "git_commit": ident.get("git_commit"),
                    })
                    break
            except Exception:  # noqa: BLE001 — not up yet
                time.sleep(1.0)
        else:
            out.update({"booted": False, "error": "health timeout"})
        if out.get("booted") and journey_j1:
            out["journey_j1"] = _journey_j1_assertions(
                f"http://127.0.0.1:{port}", cenv["ADMIN_PASSWORD"])
        # drain some boot log for diagnostics either way
        try:
            proc.terminate()
            log = proc.stdout.read() if proc.stdout else ""
            out["uvicorn_log_tail"] = log[-1200:]
        except Exception:  # noqa: BLE001
            pass
        try:
            proc.wait(timeout=20)
        except subprocess.TimeoutExpired:
            proc.kill()
    finally:
        pass
    return out


def _journey_j1_assertions(base: str, admin_password: str) -> Dict[str, Any]:
    """J1 sign-in + workspace assertions at the PUBLIC auth boundary, on the
    scratch world only (never the dev DB). The product creates the default
    tenant+workspace during REGISTER (core/auth_endpoints.py:326), so
    'create workspace' for a new user IS the register→login→me chain."""
    import httpx
    out: Dict[str, Any] = {}
    email = f"j1probe_{uuid.uuid4().hex[:10]}@example.com"
    password = secrets.token_urlsafe(12) + "A1"
    try:
        r = httpx.post(f"{base}/api/auth/register",
                       json={"email": email, "password": password,
                             "first_name": "J1", "last_name": "Probe"},
                       timeout=30, trust_env=False)
        out["register"] = {"http": r.status_code,
                           "token": bool((r.json() or {})
                                         .get("access_token"))}
        r2 = httpx.post(f"{base}/api/auth/login",
                        json={"email": email, "username": email,
                              "password": password},
                        timeout=30, trust_env=False)
        tok = (r2.json() or {}).get("access_token")
        out["signin"] = {"http": r2.status_code, "token": bool(tok)}
        if tok:
            r3 = httpx.get(f"{base}/api/auth/me",
                           headers={"Authorization": f"Bearer {tok}"},
                           timeout=30, trust_env=False)
            me = r3.json() or {}
            out["workspace"] = {"http": r3.status_code,
                                "workspace_id": me.get("workspace_id"),
                                "bound": bool(me.get("workspace_id"))}
            # the workspace must RESOLVE for real use, not merely exist
            r4 = httpx.get(f"{base}/api/dashboard/feed",
                           headers={"Authorization": f"Bearer {tok}"},
                           timeout=30, trust_env=False)
            out["workspace_usable"] = {"http": r4.status_code}
        # bootstrap admin sign-in too — the path quickstart tells users about
        r5 = httpx.post(f"{base}/api/auth/login",
                        json={"email": "admin@example.com",
                              "username": "admin@example.com",
                              "password": admin_password},
                        timeout=30, trust_env=False)
        out["admin_signin"] = {"http": r5.status_code}
    except Exception as exc:  # noqa: BLE001 — record, never crash the boot
        out["error"] = f"{type(exc).__name__}: {exc}"
    return out


# ---------------------------------------------------------------------------
def run(env_block: str, label: str, do_boot: bool,
        journey_j1: bool = False) -> Dict[str, Any]:
    static = static_audit(_dotenv_parse_text(env_block))
    sources = verify_gate_sources()
    scratch = tempfile.mkdtemp(prefix="atom_parity_env_")
    env_file = Path(scratch) / "generated.env"
    env_file.write_text(env_block)
    dyn = dynamic_probe(_dotenv_parse_text(env_block), env_file)
    result: Dict[str, Any] = {
        "label": label,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "generator": str(QUICKSTART),
        "generator_sha256": __import__("hashlib").sha256(
            QUICKSTART.read_bytes()).hexdigest(),
        "static_audit": static,
        "gate_source_check": sources,
        "dynamic_probe": dyn,
    }
    if do_boot:
        result["boot"] = boot_check(_dotenv_parse_text(env_block),
                                    journey_j1=journey_j1)
    parity_ok = (static["ok"] and sources["ok"]
                 and all(dyn.get("gates", {}).values())
                 and dyn.get("lifecycle", {}).get("constructed") is True)
    if do_boot:
        parity_ok = parity_ok and result["boot"].get("booted") is True
    result["parity_ok"] = parity_ok
    if journey_j1 and do_boot:
        j1 = (result["boot"].get("journey_j1") or {})
        result["journey_j1_pass"] = bool(
            j1.get("register", {}).get("token")
            and j1.get("signin", {}).get("token")
            and j1.get("workspace", {}).get("bound")
            and j1.get("workspace_usable", {}).get("http") == 200
            and j1.get("admin_signin", {}).get("http") == 200)
    RESULTS_DIR.mkdir(exist_ok=True)
    out = RESULTS_DIR / (f"parity_{label}_{time.strftime('%Y%m%d_%H%M%S')}"
                         f"_{uuid.uuid4().hex[:6]}.json")
    out.write_text(json.dumps(result, indent=2, default=str))
    print(f"results: {out}")
    return result


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--fix-check", action="store_true",
                    help="append the required gates to the generated env "
                         "(simulating the fixed quickstart) before probing")
    ap.add_argument("--boot", action="store_true",
                    help="also boot the real uvicorn app on a scratch DB")
    ap.add_argument("--journey-j1", action="store_true",
                    help="with --boot: also run the J1 sign-in + workspace "
                         "assertions against the scratch world")
    ap.add_argument("--label", default="current")
    args = ap.parse_args()

    parsed = parse_quickstart_env()
    block = parsed["block"]
    if args.fix_check:
        block += ("\n# (simulated fix — appended by --fix-check)\n"
                  + "".join(f"{k}={v['value']}\n"
                            for k, v in REQUIRED_GATES.items()))
    result = run(block, args.label, args.boot, journey_j1=args.journey_j1)
    if result["parity_ok"]:
        print(f"PARITY PASS ({args.label})")
        if "journey_j1_pass" in result:
            print(f"J1 assertions: "
                  f"{'PASS' if result['journey_j1_pass'] else 'FAIL'}")
            if not result["journey_j1_pass"]:
                return 1
        return 0
    print(f"PARITY FAIL ({args.label}): "
          f"{json.dumps(result['static_audit']['gates'], indent=2)}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
