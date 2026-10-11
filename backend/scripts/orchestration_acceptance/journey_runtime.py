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

import json
import os
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


class ScratchServer:
    """The real uvicorn app on a free port against a scratch DB.

    `restart()` is a REAL restart: same run directory, same database, same
    env, new process — the durable-state question, not the fresh-dir one.
    """

    def __init__(self, label: str, extra_env: Optional[Dict[str, str]] = None,
                 health_timeout_s: float = 150.0,
                 preferred_port: Optional[int] = None):
        self.label = label
        self.health_timeout_s = health_timeout_s
        self.preferred_port = preferred_port
        self.scratch = Path(tempfile.mkdtemp(prefix=f"atom_journey_{label}_"))
        (self.scratch / "data").mkdir()
        self.run_dir = self.scratch / "run"
        self.run_dir.mkdir()
        self.db_path = self.run_dir / "atom.db"
        self.admin_password = secrets.token_urlsafe(18)

        parsed = parse_quickstart_env()
        self.generated_env = _dotenv_parse_text(parsed["block"])
        env = dict(self.generated_env)

        self.base_env: Dict[str, str] = dict(os.environ)
        # Provider credentials MUST be pinned to "" rather than merely
        # removed: main_api_app.py loads the repo's backend/.env with
        # override=False, so a REMOVED var is re-filled from the dev's
        # .env (dotenv only respects vars that are already SET). An empty
        # value survives dotenv and is refused by every consumer
        # (_is_usable_api_key: falsy / <12 chars). Observed live
        # 2026-10-11: a scrubbed-but-reminded OPENROUTER_API_KEY kept
        # ranking a phantom cloud candidate in a local-only world.
        for name in CREDENTIAL_ENV_NAMES:
            self.base_env[name] = ""
        # The repo's local-model wiring is likewise pinned only when the
        # journey doesn't set it (extra_env applies after).
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
            cwd=str(BACKEND), env=self.base_env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

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
        self.proc = None

    @property
    def base(self) -> str:
        return f"http://127.0.0.1:{self.port}"

    def log_tail(self, limit: int = 1500) -> str:
        if self.proc is None or self.proc.stdout is None:
            return ""
        try:
            self.proc.terminate()
            log = self.proc.stdout.read() or ""
            self.proc.wait(timeout=10)
        except Exception:  # noqa: BLE001
            log = ""
        self.proc = None
        return log[-limit:]

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
