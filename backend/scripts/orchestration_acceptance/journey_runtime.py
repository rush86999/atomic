#!/usr/bin/env python3
"""Shared scratch-stack runtime for acceptance journeys.

ONE implementation of "launch the real app against a scratch world" —
fresh_install_parity (J1 gate) and the journey scripts (J2, J3, browser
smoke) all launch through this module so their isolation semantics cannot
drift apart:

  * DATABASE_URL / ATOM_DATA_DIR are applied AFTER the generated env and
    asserted to resolve inside the scratch directory (the probe bug class
    the 2026-10-11 review caught: cenv.update(env) restoring the generated
    relative DATABASE_URL after the scratch override).
  * ADMIN_PASSWORD is pinned so the scratch world never reads or writes
    the repo's shared backend/logs/*password* files.
  * Required gates come from the generated quickstart env (post-fix) and
    are pinned in the child env like every other gate key.
  * Provider credentials travel BY NAME from the repo's own .env to the
    caller in-process; values are never logged, never written to results.

This is still a DIRTY-CHECKOUT boot: main_api_app.py loads the repo's
backend/.env unconditionally, so this is configuration parity + public
API smoke, NOT a pristine-install proof. A pristine run needs the
run_isolated code export (excludes .env). Every result records this mode.

KNOWN UNREDIRECTED SURFACES (verifier audit 2026-10-11): a few sidecar
files anchor to backend/data via __file__ with no env override and are
NOT isolated here — data/ai_pricing_cache.json, data/
pricing_staleness_stats.json, data/provider_model_catalog.json, data/
llm_pair_memos.json, data/turn_learning/, and cwd-anchored backend/
jobs.sqlite (written only when a schedule is created). Journeys that
trigger pricing refreshes or pair-memo writes would touch dev files;
today's runs did not (content scans clean). Redirecting them is product
work (new env hooks), not harness work.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import shutil
import socket
import collections
import threading
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

BACKEND = Path(__file__).resolve().parents[2]
REPO = BACKEND.parent
sys.path.insert(0, str(BACKEND))

from scripts.orchestration_acceptance.fresh_install_parity import (  # noqa: E402
    REQUIRED_GATES,
    _dotenv_parse_text,
    parse_quickstart_env,
)

VENV_PY_CANDIDATES = (BACKEND / "venv314" / "bin" / "python",
                      BACKEND / "venv" / "bin" / "python")

BOOT_MODE = "configuration_parity_plus_public_api_smoke"

# Provider credentials MUST NOT leak into a journey's child env: with e.g.
# OPENROUTER_API_KEY inherited, the BYOK test endpoint and chat routing
# silently serve from the ENV key and the product path under test proves
# nothing (observed live 2026-10-11: provider_test returned ok=true with NO
# key stored through the product). These names are scrubbed unless the
# journey passes them explicitly via extra_env.
CREDENTIAL_ENV_NAMES = (
    "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY",
    "OPENROUTER_API_KEY", "DEEPSEEK_API_KEY", "GROQ_API_KEY",
    "TOGETHER_API_KEY", "GLM_API_KEY", "MOONSHOT_API_KEY",
    "OPENCODE_API_KEY", "TAVILY_API_KEY", "BRAVE_SEARCH_API_KEY",
)


def venv_py() -> Path:
    for p in VENV_PY_CANDIDATES:
        if p.exists():
            return p
    raise SystemExit("no backend venv python found (venv314/venv)")


def free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def source_identity(ref: str = "HEAD",
                    repo: Optional[Path] = None) -> Dict[str, str]:
    """The SOURCE revision being exported/booted, captured from the real
    repo. A code export carries no `.git`, so the identity must be
    captured AT EXPORT TIME and embedded in the evidence (round-10
    review: the r1/r2 evidence recorded `git_commit: unknown` and lost
    the candidate binding)."""
    cwd = str(repo or REPO)

    def _run(*argv: str) -> str:
        try:
            out = subprocess.run(list(argv), cwd=cwd, capture_output=True,
                                 text=True, timeout=15).stdout.strip()
            return out or "unknown"
        except Exception:  # noqa: BLE001
            return "unknown"

    return {
        "ref": ref,
        "commit": _run("git", "rev-parse", ref),
        "tree": _run("git", "rev-parse", f"{ref}^{{tree}}"),
        "source_repo": cwd,
        "dirty_tracked": _run("git", "status", "--short",
                              "--untracked-files=no"),
    }


def load_export_identity(code_export: Optional[Path]) -> Dict[str, Any]:
    """Read the identity manifest written beside a code export."""
    if not code_export:
        return {}
    manifest = Path(code_export).parent / "EXPORT_IDENTITY.json"
    if not manifest.exists():
        return {"manifest": str(manifest), "error": "missing"}
    try:
        return json.loads(manifest.read_text())
    except Exception as exc:  # noqa: BLE001
        return {"manifest": str(manifest), "error": str(exc)}


_SECRET_MARKERS = ("KEY", "SECRET", "PASSWORD", "TOKEN")


def config_digest(allowlisted: bool, generated_env: Dict[str, str],
                  extra_env: Optional[Dict[str, str]] = None) -> str:
    """Stable digest of the EFFECTIVE configuration (the names/values that
    decide behavior), excluding generated secrets and per-run scratch
    paths. Gate values and extra-env names are the meaningful inputs."""
    stable = {k: v for k, v in (generated_env or {}).items()
              if not any(m in k.upper() for m in _SECRET_MARKERS)}
    payload = {"allowlisted": bool(allowlisted),
               "generated": stable,
               "extra_env_names": sorted((extra_env or {}).keys())}
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def read_repo_env_names(names: List[str]) -> Dict[str, str]:
    """Read the repo's backend/.env BY NAME. Values go to the caller only —
    never logged, never written into results or the scratch world."""
    out: Dict[str, str] = {}
    env_file = BACKEND / ".env"
    if not env_file.exists():
        return out
    parsed = _dotenv_parse_text(env_file.read_text())
    for n in names:
        v = parsed.get(n, "")
        if v:
            out[n] = v
    return out


def materialize_code_export(ref: str = "HEAD",
                            dest: Optional[Path] = None) -> Path:
    """Export the COMMITTED backend code to a bare tree with no developer
    configuration. `git archive` of the pinned revision: backend/.env,
    backend/data/, backend/logs/ and venvs are gitignored, so they are
    excluded BY CONSTRUCTION (asserted below). The app's dotenv loads
    (main_api_app.py backend/.env + project .env/.env.local) therefore find
    NOTHING — this is what makes a run from this tree a pristine-install
    candidate rather than configuration parity in a dirty checkout.
    """
    if dest is None:
        dest = Path(tempfile.mkdtemp(prefix="atom_pristine_export_"))
    dest.mkdir(parents=True, exist_ok=True)
    identity = source_identity(ref)
    tar = subprocess.Popen(["tar", "-x", "-C", str(dest)], stdin=subprocess.PIPE)
    subprocess.run(["git", "archive", ref, "backend"], cwd=str(REPO),
                   check=True, stdout=tar.stdin)
    tar.stdin.close()
    if tar.wait() != 0:
        raise RuntimeError(f"tar extraction failed rc={tar.returncode}")
    export = dest / "backend"
    # Tracked-but-not-code stragglers (e.g. backend/data/acceptance_results/
    # *.json from earlier campaigns) are removed: the export carries CODE.
    shutil.rmtree(export / "data", ignore_errors=True)
    for forbidden in (".env", ".env.local", "logs", "venv", "venv314"):
        if (export / forbidden).exists():
            raise RuntimeError(
                f"pristine export leak: {export / forbidden} exists — the "
                f"export must carry code only (review round 3, item 2)")
    if not (export / "main_api_app.py").exists():
        raise RuntimeError("pristine export missing main_api_app.py")
    # The archived commit must survive the export (a git-archive tree has
    # no .git): write the identity manifest BESIDE the backend tree so
    # every evidence file can embed it (round-10 review).
    (dest / "EXPORT_IDENTITY.json").write_text(
        json.dumps(identity, indent=2) + "\n")
    return export


class ScratchServer:
    """The real uvicorn app on a free port against a scratch DB.

    `restart()` is a REAL restart: same run directory, same database, same
    env, new process — the durable-state question, not the fresh-dir one.
    """

    def __init__(self, label: str, extra_env: Optional[Dict[str, str]] = None,
                 health_timeout_s: float = 150.0,
                 preferred_port: Optional[int] = None,
                 allowlisted: bool = False,
                 code_export: Optional[Path] = None):
        self.label = label
        self.health_timeout_s = health_timeout_s
        self.preferred_port = preferred_port
        self.allowlisted = allowlisted
        self.code_export = code_export
        # cwd of the server process: a pristine run launches from the
        # exported tree (no developer .env exists there); everything else
        # launches from the repo backend.
        self.cwd = code_export or BACKEND
        self.scratch = Path(tempfile.mkdtemp(prefix=f"atom_journey_{label}_"))
        (self.scratch / "data").mkdir()
        self.run_dir = self.scratch / "run"
        self.run_dir.mkdir()
        self.db_path = self.run_dir / "atom.db"
        self.admin_password = secrets.token_urlsafe(18)

        parsed = parse_quickstart_env()
        self.generated_env = _dotenv_parse_text(parsed["block"])
        env = dict(self.generated_env)

        if allowlisted:
            # ALLOWLISTED PROCESS ENVIRONMENT (review round 3, item 2):
            # nothing is inherited from the developer shell. Only process
            # plumbing (PATH/HOME/locale/tmp) plus the generated quickstart
            # configuration and the scratch overrides below. With no
            # developer .env in an exported tree, dotenv finds nothing —
            # no empty-string pinning is needed because there is nothing
            # to pin against.
            self.base_env: Dict[str, str] = {
                k: os.environ[k] for k in
                ("PATH", "HOME", "LANG", "LC_CTYPE", "TMPDIR")
                if os.environ.get(k)}
        else:
            self.base_env: Dict[str, str] = dict(os.environ)
            # Provider credentials MUST be pinned to "" rather than merely
            # removed: main_api_app.py loads the repo's backend/.env with
            # override=False, so a REMOVED var is re-filled from the dev's
            # .env (dotenv only respects vars that are already SET). An
            # empty value survives dotenv and is refused by every consumer
            # (_is_usable_api_key: falsy / <12 chars). Observed live
            # 2026-10-11: a scrubbed-but-reminded OPENROUTER_API_KEY kept
            # ranking a phantom cloud candidate in a local-only world.
            for name in CREDENTIAL_ENV_NAMES:
                self.base_env[name] = ""
            # The repo's local-model wiring is likewise pinned only when
            # the journey doesn't set it (extra_env applies after).
            for name in ("ATOM_LOCAL_ONLY", "OLLAMA_HOST", "OLLAMA_BASE_URL",
                         "OLLAMA_MODEL"):
                self.base_env.pop(name, None)

        self.base_env.update(env)  # generated env, as a fresh install gets it
        if extra_env:
            self.base_env.update(extra_env)
        # Scratch storage wins LAST — the generated DATABASE_URL is relative
        # and must never resolve outside the scratch directory.
        self.base_env["DATABASE_URL"] = f"sqlite:///{self.db_path}"
        self.base_env["ATOM_DATA_DIR"] = str(self.scratch / "data")
        # LanceDB: the handler defaults to ./data/atom_memory anchored to
        # backend/ (core/lancedb_handler.py) — without this override every
        # scratch world reads AND WRITES the dev's real memory store
        # (observed live 2026-10-11: scratch uploads landed in the dev's
        # default_shared documents table). Both env spellings the code
        # reads are pinned; factory paths are relative to LANCEDB_URI_BASE.
        _lance = str(self.scratch / "data" / "atom_memory")
        self.base_env["LANCEDB_URI"] = _lance
        self.base_env["LANCEDB_URI_BASE"] = _lance
        # The BYOK vault anchors to backend/data REGARDLESS of
        # DATABASE_URL/ATOM_DATA_DIR (api/byok_routes.py _BYOK_DATA_DIR) —
        # without these overrides every scratch world shares the dev's
        # vault and worlds leak stored keys into each other (observed live
        # 2026-10-11: world A saw a key world B had stored). The product
        # documents these env overrides for exactly this ("tests/isolated
        # installs rely on them").
        self.base_env["BYOK_CONFIG_FILE"] = str(self.scratch / "byok_config.json")
        self.base_env["BYOK_KEYS_FILE"] = str(self.scratch / "byok_keys.json")
        self.base_env["BYOK_ENC_KEY_FILE"] = str(
            self.scratch / "byok_encryption_key")
        self.byok_vault_isolated = True
        # Gate keys pinned to the generated values (fresh-install outcome
        # even when the dev's backend/.env carries different ones).
        for name, spec in REQUIRED_GATES.items():
            self.base_env[name] = self.generated_env.get(name, "")
        self.base_env["ADMIN_PASSWORD"] = self.admin_password
        self.base_env["PYTHONDONTWRITEBYTECODE"] = "1"

        # Round-10 evidence identity: the archived commit (captured before
        # the export lost .git), the effective-config digest and the real
        # scratch storage paths — embedded in every evidence file.
        self.is_pristine = bool(code_export and allowlisted)
        self.export_identity = load_export_identity(code_export)
        self.config_digest = config_digest(allowlisted, self.generated_env,
                                           extra_env)
        self._storage = {
            "scratch_root": str(self.scratch),
            "run_dir": str(self.run_dir),
            "database": str(self.db_path),
            "lancedb": self.base_env.get("LANCEDB_URI", ""),
            "byok_config": self.base_env.get("BYOK_CONFIG_FILE", ""),
            "byok_keys": self.base_env.get("BYOK_KEYS_FILE", ""),
            "byok_enc_key": self.base_env.get("BYOK_ENC_KEY_FILE", ""),
        }

        self._assert_storage_isolated()
        self.port = free_port()
        self.proc: Optional[subprocess.Popen] = None
        self.restarts = 0
        self.boot_seconds: Optional[float] = None

    def _assert_storage_isolated(self) -> None:
        raw = self.base_env["DATABASE_URL"]
        resolved = Path(raw.split("sqlite:///", 1)[-1])
        if not resolved.is_absolute():
            resolved = Path(os.path.abspath(resolved))
        scratch_str = str(self.scratch)
        if not str(resolved).startswith(scratch_str):
            raise RuntimeError(
                f"scratch isolation violated: DATABASE_URL resolves to "
                f"{resolved}, outside {scratch_str}")
        self.resolved_db_path = str(resolved)

    def storage_paths(self) -> Dict[str, str]:
        """The ACTUAL scratch storage this world reads/writes (round-10)."""
        return dict(self._storage)

    def evidence_identity(self) -> Dict[str, Any]:
        """The identity block every evidence file embeds: source revision,
        effective-config digest, scratch storage. An export lacking .git
        never loses its source identity."""
        return {
            "mode": ("pristine_code_export" if self.is_pristine
                     else BOOT_MODE),
            "source": self.export_identity or {
                "note": "no code export — configuration-parity checkout boot",
                "commit": source_identity().get("commit"),
            },
            "config_digest": self.config_digest,
            "storage": self.storage_paths(),
        }

    # ------------------------------------------------------------------
    def _launch(self) -> None:
        # honor preferred_port (e.g. pre-announced to a frontend bundle via
        # NEXT_PUBLIC_API_URL); restarts keep the SAME port so the browser
        # origin never moves mid-journey.
        self.port = self.preferred_port or free_port()
        self.proc = subprocess.Popen(
            [str(venv_py()), "-m", "uvicorn", "main_api_app:app",
             "--host", "127.0.0.1", "--port", str(self.port),
             "--log-level", "warning"],
            cwd=str(self.cwd), env=self.base_env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        # DRAIN THE LOG PIPE (pristine-J2 runs 3/4 root cause, diagnosed
        # 2026-10-12): an undrained PIPE fills at ~64KB — a fresh world
        # emits that much by the first tool turn — and the server's next
        # log write then blocks FOREVER inside StreamHandler.emit while
        # holding the logging lock. The event loop freezes on the same
        # lock; the turn clock's wait_for never fires; the client times
        # out at 300s with the request stuck in_progress. The drain
        # thread keeps the pipe empty (ring buffer for log_tail evidence).
        self._log_buffer: "collections.deque[str]" = collections.deque(
            maxlen=2000)
        self._drain = threading.Thread(
            target=self._drain_logs, daemon=True)
        self._drain.start()

    def _drain_logs(self) -> None:
        """Consume the server's stdout forever (daemon). Lines land in a
        bounded ring so log_tail() keeps returning evidence after the
        process is stopped."""
        try:
            for line in self.proc.stdout:
                self._log_buffer.append(line.rstrip("\n"))
        except Exception:  # noqa: BLE001 — process gone; drain is done
            pass

    def log_tail(self, limit: int = 1500) -> str:
        lines = list(self._log_buffer)
        return "\n".join(lines[-limit:])

    def _wait_health(self) -> Dict[str, Any]:
        import httpx
        t0 = time.monotonic()
        while time.monotonic() - t0 < self.health_timeout_s:
            if self.proc is not None and self.proc.poll() is not None:
                return {"booted": False,
                        "error": f"uvicorn exited rc={self.proc.returncode}"}
            try:
                r = httpx.get(f"http://127.0.0.1:{self.port}/api/health",
                              timeout=3, trust_env=False)
                if r.status_code == 200:
                    doc = r.json()
                    ident = doc.get("identity") or {}
                    return {"booted": True,
                            "seconds": round(time.monotonic() - t0, 1),
                            "status": doc.get("status"),
                            "pid": ident.get("pid"),
                            "git_commit": ident.get("git_commit")}
            except Exception:  # noqa: BLE001 — not up yet
                time.sleep(1.0)
        return {"booted": False, "error": "health timeout"}

    def up(self) -> Dict[str, Any]:
        self._launch()
        out = self._wait_health()
        if out.get("booted"):
            self.boot_seconds = out["seconds"]
        return out

    def restart(self) -> Dict[str, Any]:
        self.stop()
        self.restarts += 1
        out = self.up()
        out["restart_number"] = self.restarts
        return out

    def stop(self) -> None:
        if self.proc is None:
            return
        try:
            self.proc.terminate()
            self.proc.wait(timeout=20)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            self.proc.wait(timeout=5)
        # The drain thread exits when the pipe closes; join briefly so
        # the ring holds every final line before teardown moves on.
        drain = getattr(self, "_drain", None)
        if drain is not None and drain.is_alive():
            drain.join(timeout=5)
        self.proc = None

    @property
    def base(self) -> str:
        return f"http://127.0.0.1:{self.port}"

    def __enter__(self) -> "ScratchServer":
        self.up()
        return self

    def __exit__(self, *exc) -> None:
        self.stop()


# ----------------------------------------------------------------------
# Public auth-boundary helpers (the same calls the browser makes)
# ----------------------------------------------------------------------
def register_user(base: str, email: str, password: str,
                  first_name: str = "Journey", last_name: str = "Probe",
                  timeout_s: float = 30.0) -> Dict[str, Any]:
    import httpx
    r = httpx.post(f"{base}/api/auth/register",
                   json={"email": email, "password": password,
                         "first_name": first_name, "last_name": last_name},
                   timeout=timeout_s, trust_env=False)
    doc = r.json() if r.status_code == 200 else {}
    return {"http": r.status_code,
            "token": doc.get("access_token"),
            "email": email, "password": password}


def login(base: str, email: str, password: str,
          timeout_s: float = 30.0) -> Dict[str, Any]:
    import httpx
    r = httpx.post(f"{base}/api/auth/login",
                   json={"email": email, "username": email,
                         "password": password},
                   timeout=timeout_s, trust_env=False)
    doc = r.json() if r.status_code == 200 else {}
    return {"http": r.status_code, "token": doc.get("access_token")}


def auth_get(base: str, token: str, path: str,
             timeout_s: float = 30.0) -> Dict[str, Any]:
    import httpx
    r = httpx.get(f"{base}{path}",
                  headers={"Authorization": f"Bearer {token}"},
                  timeout=timeout_s, trust_env=False)
    try:
        return {"http": r.status_code, "json": r.json()}
    except Exception:  # noqa: BLE001
        return {"http": r.status_code, "json": {}}


def auth_post(base: str, token: str, path: str, payload: Dict[str, Any],
              timeout_s: float = 30.0) -> Dict[str, Any]:
    import httpx
    r = httpx.post(f"{base}{path}",
                   headers={"Authorization": f"Bearer {token}"},
                   json=payload, timeout=timeout_s, trust_env=False)
    try:
        return {"http": r.status_code, "json": r.json()}
    except Exception:  # noqa: BLE001
        return {"http": r.status_code, "json": {}}


def new_user(base: str) -> Dict[str, Any]:
    """Register + login a fresh product user (workspace is created by the
    product's own register flow, core/auth_endpoints.py)."""
    email = f"jprobe_{uuid.uuid4().hex[:10]}@example.com"
    password = secrets.token_urlsafe(12) + "A1"
    reg = register_user(base, email, password)
    if not reg.get("token"):
        return {"registered": False, **reg}
    lg = login(base, email, password)
    me = auth_get(base, lg["token"], "/api/auth/me") if lg.get("token") else {}
    mej = me.get("json") or {}
    return {"registered": reg["http"] == 200, **lg,
            "email": email, "password": password,
            "id": mej.get("id"),
            "workspace_id": mej.get("workspace_id"),
            "register_http": reg["http"]}


def save_result(label: str, payload: Dict[str, Any]) -> Path:
    results = Path(__file__).resolve().parent / "journey_matrix"
    results.mkdir(exist_ok=True)
    out = results / (f"{label}_{time.strftime('%Y%m%d_%H%M%S')}"
                     f"_{uuid.uuid4().hex[:6]}.json")
    out.write_text(json.dumps(payload, indent=2, default=str))
    return out


# ----------------------------------------------------------------------
# Round-10 evidence readers: attributable records and receipts, never
# substrings; a failed client window is never repaired by a late server
# delivery.
# ----------------------------------------------------------------------
def _sqlite_rows(db: Path, sql: str, params: tuple = ()) -> List[tuple]:
    import sqlite3
    con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    try:
        return con.execute(sql, params).fetchall()
    finally:
        con.close()


def aggregate_verdict(mandatory: List[str],
                      assertions: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Strict aggregate: only an explicit True on EVERY mandatory
    assertion passes. Missing/None read as untested and never as success
    (the round-9 vacuous-pass defect: a world that raised left no
    assertion block, and the aggregate passed on the surviving world's
    booleans alone). False reads as failed."""
    assertions = assertions or {}
    unmet: List[str] = []
    failed: List[str] = []
    untested: List[str] = []
    states: Dict[str, str] = {}
    for key in mandatory:
        value = assertions.get(key)
        if value is True:
            states[key] = "verified"
            continue
        unmet.append(key)
        if value is None:
            untested.append(key)
            states[key] = "untested"
        else:
            failed.append(key)
            states[key] = "failed"
    return {"pass": not unmet, "unmet": unmet, "failed": failed,
            "untested": untested, "states": states}


def server_delivery(db: Path, request_id: str, poll_s: float = 0.0,
                    cadence_s: float = 3.0) -> Dict[str, Any]:
    """Server-side record of a client-minted request_id, observed AFTER a
    client-window failure. Preserved SEPARATELY — it documents what the
    server did later and never converts the failed client call into a
    pass."""
    deadline = time.monotonic() + max(0.0, poll_s)
    last: Dict[str, Any] = {"found": False, "state": None}
    while True:
        rows = _sqlite_rows(
            db, "SELECT state, updated_at, execution_id, finalized_response, "
                "error FROM chat_request_records WHERE request_id=? "
                "ORDER BY updated_at DESC LIMIT 1", (request_id,))
        if rows:
            state, updated_at, execution_id, finalized, error = rows[0]
            try:
                head = str((json.loads(finalized or "{}") or {})
                           .get("message") or "")[:160]
            except Exception:  # noqa: BLE001
                head = str(finalized or "")[:160]
            last = {"found": True, "state": state, "updated_at": updated_at,
                    "execution_id": execution_id, "response_head": head,
                    "error": error}
            if state in ("completed", "failed", "error", "cancelled") \
                    or time.monotonic() >= deadline:
                last["delivered_after_client_window"] = state == "completed"
                return last
        elif time.monotonic() >= deadline:
            return last
        time.sleep(cadence_s)


def execution_tool_receipts(db: Path, execution_id: str) -> Dict[str, Any]:
    """Attributable receipts for ONE execution id (e.g. recovered from a
    request record after the client window failed)."""
    return _collect_receipts(db, [str(execution_id)])


def request_execution_id(db: Path, request_id: str) -> Optional[str]:
    """The execution THIS request record linked (current-request
    linkage, verifier check 1): client-minted request_id ->
    chat_request_records.execution_id. None when the record or the link
    is absent — never a session-wide fallback."""
    if not request_id:
        return None
    rows = _sqlite_rows(
        db, "SELECT execution_id FROM chat_request_records WHERE "
            "request_id=? ORDER BY updated_at DESC LIMIT 1",
        (str(request_id),))
    if not rows or rows[0][0] in (None, ""):
        return None
    return str(rows[0][0])


def turn_tool_receipts(db: Path, session_id: str) -> Dict[str, Any]:
    """Attributable tool-execution records for one chat session: the
    assistant turns' execution ids -> agent_executions -> task_outcome
    (tool_outcomes / evidence_refs / actions / delivery). Replaces
    substring matching over prompt echoes (round-10 review)."""
    exec_ids: List[str] = []
    for (meta,) in _sqlite_rows(
            db, "SELECT metadata_json FROM chat_messages WHERE "
                "conversation_id=? AND role='assistant' "
                "ORDER BY created_at, rowid", (session_id,)):
        try:
            eid = (json.loads(meta or "{}") or {}).get("execution_id")
        except Exception:  # noqa: BLE001
            eid = None
        if eid:
            exec_ids.append(str(eid))
    return _collect_receipts(db, exec_ids, session_id=session_id)


def _collect_receipts(db: Path, exec_ids: List[str],
                      session_id: Optional[str] = None) -> Dict[str, Any]:
    receipts: List[Dict[str, Any]] = []
    executions: List[Dict[str, Any]] = []
    evidence_ref_count = 0
    for eid in exec_ids:
        rows = _sqlite_rows(db, "SELECT metadata_json FROM agent_executions "
                                "WHERE id=?", (eid,))
        if not rows:
            continue
        try:
            meta = json.loads(rows[0][0] or "{}")
        except Exception:  # noqa: BLE001
            meta = {}
        outcome = meta.get("task_outcome") or {}
        tools = [t for t in (outcome.get("tool_outcomes") or [])
                 if isinstance(t, dict)]
        refs = [r for r in (outcome.get("evidence_refs") or [])
                if isinstance(r, dict)]
        evidence_ref_count += len(refs)
        executions.append({
            "execution_id": eid,
            "objective_met": outcome.get("objective_met"),
            "delivery": (outcome.get("delivery") or {}).get("delivered"),
            "latency_s": outcome.get("latency_s"),
            "tool_outcomes": tools,
            "evidence_refs": len(refs),
            "actions": [a for a in (outcome.get("actions") or [])
                        if isinstance(a, dict)],
        })
        for tool in tools:
            refs = [r for r in (tool.get("evidence_refs") or [])
                    if isinstance(r, dict)]
            evidence = []
            for ref in refs[:4]:
                entry = {
                    key: ref.get(key)
                    for key in ("kind", "action", "query", "service",
                                "coverage")
                    if ref.get(key) is not None
                }
                mc = ref.get("match_count")
                if isinstance(mc, int) and not isinstance(mc, bool):
                    entry["match_count"] = mc
                if isinstance(ref.get("paths"), list):
                    entry["paths"] = len(ref["paths"])
                evidence.append(entry)
            receipts.append({
                "execution_id": eid,
                "tool": tool.get("tool"),
                "verified": tool.get("verified"),
                "outcome": tool.get("outcome"),
                "required": tool.get("required"),
                "evidence_refs": len(refs),
                "evidence": evidence,
            })
    verified = [r["verified"] for r in receipts]
    if not receipts:
        tool_success: Optional[bool] = False  # nothing executed, nothing claimed
    elif any(v is False for v in verified):
        tool_success = False
    elif all(v is True for v in verified):
        tool_success = True
    else:
        tool_success = None  # executed but not verified
    return {
        "session_id": session_id,
        "execution_ids": exec_ids,
        "executions": executions,
        "receipts": receipts,
        "receipt_count": len(receipts),
        "evidence_ref_count": evidence_ref_count,
        "tool_success": tool_success,
        "attributable": bool(exec_ids),
    }


# ----------------------------------------------------------------------
# Owner-mandated tool-planning gate (round-10 verifier REJECT, checks
# 1-2): the verified boolean is replaced by five checks evaluated on the
# CURRENT request's durable execution record — request linkage, an
# attributable executed action, evidence/bounded-absence, relevance to
# the requested read obligation, and narration agreement with the
# delivered result. Pure function: the J2 script passes exactly what it
# read from the scratch DB; tests pin every negative control here.
# ----------------------------------------------------------------------
#: Mutation verbs can never serve a READ obligation — a verified
#: mutation receipt is not evidence that the requested read ran.
_READ_MUTATION_MARKERS = (
    "delete", "remove", "destroy", "create", "update", "write", "send",
    "post", "append", "edit", "move", "rename", "trash", "purge",
)

_POSITIVE_COUNT_RE = re.compile(
    r"\b(\d[\d,]*)\s+(?:records?|results?|matches|rows|files|documents|"
    r"emails?|messages|items|entries)\b", re.IGNORECASE)

_ABSENCE_WORDING_RE = re.compile(
    r"no (?:matches|results|hits|documents|records|files|entries)\b|"
    r"\bnothing (?:was )?found\b|\bfound nothing\b|\bdidn'?t find\b|"
    r"\bdid not find\b|\bnone\b|\b0 match", re.IGNORECASE)


def _ref_count(row: Dict[str, Any]) -> int:
    value = row.get("evidence_refs")
    if isinstance(value, list):
        return len([r for r in value if isinstance(r, dict)])
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _structured_match_count(row: Dict[str, Any]) -> Optional[int]:
    """The receipt's structured match count: top-level when a producer
    stamps it, otherwise the first evidence ref that carries one (the
    planner lane's scope ref). None means no structured count exists —
    never guessed from prose."""
    value = row.get("match_count")
    if isinstance(value, int) and not isinstance(value, bool):
        return value
    for ref in row.get("evidence") or []:
        if not isinstance(ref, dict):
            continue
        value = ref.get("match_count")
        if isinstance(value, int) and not isinstance(value, bool):
            return value
    return None


def _row_source(row: Dict[str, Any]) -> str:
    source = str(row.get("source") or "").strip()
    if not source:
        tool = str(row.get("tool") or "")
        source = tool.split(".", 1)[0]
        if source in ("", "unknown"):
            for ref in row.get("evidence") or []:
                if isinstance(ref, dict) and ref.get("service"):
                    source = str(ref["service"])
                    break
    return source.lower()


def _row_is_read(row: Dict[str, Any]) -> bool:
    text = f"{row.get('tool') or ''} {row.get('operation') or ''}".lower()
    return not any(marker in text for marker in _READ_MUTATION_MARKERS)


def evaluate_read_obligation(
    receipts: Dict[str, Any],
    delivered_content: str,
    *,
    linked_execution_id: Optional[str],
    requested_source: str,
) -> Dict[str, Any]:
    """The five owner-mandated checks for a read-shaped ask, evaluated
    on the CURRENT request's durable record (pure — no I/O):

    1. request_linked — the receipts read belong to the execution id
       linked to THIS request (response execution_id or the request
       record); a prior turn's receipt can never license this turn.
    2. executed_action — at least one VERIFIED row that actually
       dispatched (not "not_dispatched"/"not_executed").
    3. evidence_or_bounded_absence — every obligation-relevant executed
       row carries evidence references OR a structured zero-match
       record (bounded absence); an unexplained verified row with no
       references is not a receipt.
    4. obligation_relevant — the executed row serves the REQUESTED
       source's READ family (never a mutation, never another
       integration).
    5. narration_agrees — the delivered result is checked against the
       receipt: no search claims the relevant execution cannot cover
       (the runtime's own truthfulness contract), no positive count
       against a zero-match receipt, and a bounded-absence-only receipt
       requires honest scoped wording from the delivered result.
    """
    rows = [r for r in (receipts.get("receipts") or []) if isinstance(r, dict)]
    executions = [e for e in (receipts.get("executions") or [])
                  if isinstance(e, dict)]
    execution_ids = [str(e) for e in (receipts.get("execution_ids") or [])]
    linked = str(linked_execution_id or "").strip()

    request_linked = bool(
        linked
        and linked in execution_ids
        and any(str(e.get("execution_id") or "") == linked
                for e in executions)
        and all(str(r.get("execution_id") or "") == linked for r in rows))

    serving = [r for r in rows
               if str(r.get("execution_id") or "") == linked]
    executed = [
        r for r in serving
        if r.get("verified") is True
        and str(r.get("tool") or "").strip()
        and "not_dispatched" not in str(r.get("outcome") or "").lower()
        and "not_executed" not in str(r.get("outcome") or "").lower()
    ]
    executed_action = bool(executed)

    requested = str(requested_source or "").strip().lower()
    relevant = [r for r in executed
                if _row_source(r) == requested and _row_is_read(r)]
    obligation_relevant = bool(relevant)

    hits = [r for r in relevant if _ref_count(r) > 0
            and (_structured_match_count(r) or 0) > 0]
    bounded = [r for r in relevant
               if _structured_match_count(r) == 0]

    def _has_row_evidence(row: Dict[str, Any]) -> bool:
        # A structured zero count IS the bounded-absence record; a
        # positive count needs a real row reference (paths / count); a
        # reference that names an actual evidence kind counts too.
        if _structured_match_count(row) == 0:
            return True
        for ref in row.get("evidence") or []:
            if not isinstance(ref, dict):
                continue
            if ref.get("paths") or ref.get("match_count") is not None:
                return True
            if ref.get("kind") not in (None, "", "search_scope"):
                return True
        return False

    evidence_or_bounded_absence = bool(relevant) and all(
        _has_row_evidence(r) for r in relevant)

    content = str(delivered_content or "")
    unbacked_claims: List[str] = []
    counts: List[str] = []
    narration_agrees = True
    if not content.strip():
        narration_agrees = False
    else:
        relevant_tools = [str(r.get("tool") or "") for r in relevant]
        try:
            from core.chat_tool_planner import unbacked_search_claims

            unbacked_claims = list(
                unbacked_search_claims(content, relevant_tools))
        except Exception:  # noqa: BLE001 — fail closed, never silent
            unbacked_claims = ["<agreement helper unavailable>"]
        if unbacked_claims:
            narration_agrees = False
        counts = [
            m.group(0) for m in _POSITIVE_COUNT_RE.finditer(content)
            if int(m.group(1).replace(",", "")) > 0]
        if counts and not hits:
            narration_agrees = False
        if relevant and not hits and not _ABSENCE_WORDING_RE.search(content):
            narration_agrees = False

    checks = {
        "request_linked": request_linked,
        "executed_action": executed_action,
        "evidence_or_bounded_absence": evidence_or_bounded_absence,
        "obligation_relevant": obligation_relevant,
        "narration_agrees": narration_agrees,
    }
    return {
        "pass": all(checks.values()),
        "checks": checks,
        "linked_execution_id": linked or None,
        "serving_tools": [str(r.get("tool") or "") for r in executed],
        "relevant_tools": [str(r.get("tool") or "") for r in relevant],
        "hits": len(hits),
        "bounded_absence": len(bounded),
        "positive_count_claims": counts,
        "unbacked_claims": unbacked_claims[:4],
    }
