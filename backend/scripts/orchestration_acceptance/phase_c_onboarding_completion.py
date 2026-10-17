#!/usr/bin/env python3
"""Phase C — first-run onboarding completion: bounded reproduce-first run.

Owner directive 2026-10-17 (review): reproduce BEFORE choosing a repair
boundary. One fresh product-created user, one ordinary "Start Automating"
click in the real wizard (real frontend, real backend, scratch world), every
transition captured and the FIRST failed transition named from the fixed
taxonomy:

    click_handling -> request_construction -> transport_auth
    -> persistence -> parent_state -> reload

If every transition is observed, the run records positive evidence and no
speculative fix is added. If a boundary fails, that boundary (only) is the
repair target.

Scope notes:
  * configuration-parity scratch-world boot of the FROZEN checkout (the
    `freeze` block records HEAD, relevant dirty files and file hashes);
  * fresh product-created user (register + login through the product APIs);
  * fresh browser state (new context; no reuse of prior storage);
  * failure visibility is part of the observed record: a failed update must
    show a toast and must NOT read back as completed;
  * fresh-install certification is Phase D, not this run.

No credentials or tokens are recorded: the Authorization header is reduced
to presence/scheme/length.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import signal
import socket
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402

FRONTEND = JR.REPO / "frontend-nextjs"
MODEL = "llama3.1:8b"
LABEL = "phase_c_onboarding_completion"

# Modes:
#   ordinary               — one ordinary completion click (capability claim).
#   negative_auth_missing  — controlled failure path: storage tokens removed
#                            before the click (unauthenticated request; the
#                            backend's CSRF/auth boundary rejects it);
#                            verifies the failure contract (visible toast, no
#                            false completion, wizard stays open and reappears
#                            after reload with the session restored).
MODE = os.environ.get("PHASE_C_MODE", "ordinary")

_JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}"
                     r"\.[A-Za-z0-9_-]{4,}")
_TOKEN_PARAM_RE = re.compile(r"(?i)(token=)[A-Za-z0-9._~+/=-]{8,}")
_BEARER_RE = re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._~+/=-]{8,}")


def _redact(text: str) -> str:
    """Strip token-shaped strings from anything that lands in evidence."""
    if not isinstance(text, str):
        return text
    text = _JWT_RE.sub("<redacted-jwt>", text)
    text = _TOKEN_PARAM_RE.sub(r"\1<redacted>", text)
    text = _BEARER_RE.sub(r"\1<redacted>", text)
    return text


def _redact_deep(obj):
    if isinstance(obj, str):
        return _redact(obj)
    if isinstance(obj, list):
        return [_redact_deep(v) for v in obj]
    if isinstance(obj, dict):
        return {k: _redact_deep(v) for k, v in obj.items()}
    return obj

FROZEN_FILES = (
    "frontend-nextjs/components/Onboarding/OnboardingWizard.tsx",
    "frontend-nextjs/components/Onboarding/OnboardingWizardHost.tsx",
    "frontend-nextjs/lib/backendAuth.ts",
    "frontend-nextjs/pages/login.tsx",
    "frontend-nextjs/next.config.js",
    "backend/api/onboarding_routes.py",
    "backend/core/auth.py",
    "backend/core/models.py",
)


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _git(*argv: str) -> str:
    try:
        out = subprocess.run(["git", *argv], cwd=str(JR.REPO),
                             capture_output=True, text=True, timeout=20)
        return out.stdout.strip()
    except Exception:  # noqa: BLE001
        return "unknown"


def _freeze_block() -> dict:
    relevant = ("frontend-nextjs/components/Onboarding", "frontend-nextjs/lib",
                "frontend-nextjs/pages/login.tsx", "backend/api",
                "backend/core", "frontend-nextjs/next.config.js")
    return {
        "repo_head": _git("rev-parse", "HEAD"),
        "repo_head_subject": _git("log", "-1", "--format=%s"),
        "repo_tree": _git("rev-parse", "HEAD^{tree}"),
        "dirty_tracked_relevant": _git(
            "status", "--short", "--untracked-files=no", "--", *relevant),
        "file_sha256": {
            rel: (_sha256(JR.REPO / rel) if (JR.REPO / rel).exists()
                  else "missing")
            for rel in FROZEN_FILES
        },
    }


def _free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def _wait_http(url: str, timeout_s: float) -> bool:
    import httpx
    t0 = time.monotonic()
    while time.monotonic() - t0 < timeout_s:
        try:
            if httpx.get(url, timeout=5, trust_env=False,
                         follow_redirects=True).status_code < 500:
                return True
        except Exception:  # noqa: BLE001
            time.sleep(2)
    return False


def _start_frontend(npm_env: dict):
    proc = subprocess.Popen(["npm", "run", "dev"], cwd=str(FRONTEND),
                            env=npm_env, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True,
                            start_new_session=True)
    t0 = time.monotonic()
    while time.monotonic() - t0 < 300:
        line = proc.stdout.readline()
        if not line:
            if proc.poll() is not None:
                break
            continue
        m = re.search(r"Local:\s*http://localhost:(\d+)", line)
        if m:
            return proc, int(m.group(1))
    raise RuntimeError("frontend dev server did not report its port")


def _sanitize_headers(headers: dict) -> dict:
    out: dict = {}
    for k, v in headers.items():
        kl = k.lower()
        if kl == "authorization":
            scheme, _, tok = (v or "").partition(" ")
            out["authorization"] = "present" if v else "absent"
            out["authorization_scheme"] = scheme
            out["authorization_token_length"] = len(tok)
        elif kl == "cookie":
            out["cookie"] = "present" if v else "absent"
        else:
            out[k] = v
    return out


def _db_row(db_path: Path, email: str) -> dict:
    try:
        con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        try:
            con.row_factory = sqlite3.Row
            row = con.execute(
                "SELECT onboarding_completed, onboarding_step FROM users "
                "WHERE email = ?", (email,)).fetchone()
            if row is None:
                return {"found": False}
            return {"found": True,
                    "onboarding_completed": bool(row["onboarding_completed"]),
                    "onboarding_step": row["onboarding_step"]}
        finally:
            con.close()
    except Exception as exc:  # noqa: BLE001
        return {"found": False, "error": f"{type(exc).__name__}: {exc}"}


def _overlay_state(page) -> dict:
    overlay = page.locator("div.fixed.inset-0.z-50")
    count = overlay.count()
    state: dict = {"present": bool(count)}
    if count:
        try:
            state["text"] = overlay.first.inner_text()[:400]
        except Exception as exc:  # noqa: BLE001
            state["text_error"] = f"{type(exc).__name__}: {exc}"
    return state


def _login(page, fe_port: int, user: dict) -> dict:
    login_responses: list = []
    page.on("response", lambda r: login_responses.append(
        f"{r.status} {r.url}") if "/api/auth/login" in r.url else None)
    page.goto(f"http://localhost:{fe_port}/login",
              wait_until="domcontentloaded", timeout=180000)
    page.wait_for_selector(
        'input[type="email"], input[name="email"]', timeout=120000)
    page.fill('input[type="email"], input[name="email"]', user["email"])
    page.fill('input[type="password"], input[name="password"]',
              user["password"])
    page.click('button[type="submit"]')
    for _ in range(60):
        time.sleep(1)
        if not page.url.rstrip("/").endswith("/login"):
            break
    time.sleep(2)
    cookies = {c["name"] for c in page.context.cookies()}
    return {
        "url": page.url,
        "signed_in": not page.url.rstrip("/").endswith("/login"),
        "login_http": login_responses[-1] if login_responses else None,
        "auth_cookie": "auth_token" in cookies,
        "local_storage_keys": page.evaluate(
            "Object.keys(window.localStorage)"),
    }


def _drive_wizard_to_ready(page, overlay) -> dict:
    wiz: dict = {"present": False}
    if not overlay.count() or "Welcome to Atom" not in overlay.first.inner_text():
        return wiz
    wiz["present"] = True

    def _click(name, timeout=30000):
        overlay.first.get_by_role("button", name=name).first.click(
            timeout=timeout)

    try:
        _click("Next")                              # Welcome → Profile
        page.wait_for_timeout(800)
        role = overlay.first.locator("#role")
        if role.count():
            role.fill("acceptance")
        goal = overlay.first.locator("#goal")
        if goal.count():
            goal.fill("phase c onboarding reproduction")
        _click("Next")                              # Profile → Connect
        enable = overlay.first.get_by_role("button", name="Enable Ollama")
        for _ in range(30):
            if enable.count():
                break
            time.sleep(1)
        wiz["ollama_detected"] = enable.count() > 0
        if wiz["ollama_detected"]:
            enable.click()
            page.wait_for_timeout(2500)
            wiz["enable_clicked"] = True
        start = overlay.first.get_by_role("button", name="Start Automating")
        for _ in range(20):
            if start.count():
                break
            time.sleep(1)
        wiz["start_button_present"] = start.count() > 0
    except Exception as exc:  # noqa: BLE001
        wiz["error"] = f"{type(exc).__name__}: {exc}"
        try:
            wiz["overlay_text"] = overlay.first.inner_text()[:400]
        except Exception:  # noqa: BLE001
            pass
    return wiz


def main() -> int:
    from playwright.sync_api import sync_playwright

    ev: dict = {"journey": LABEL, "model": MODEL, "mode": MODE,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime()),
                "freeze": _freeze_block()}

    backend_port = _free_port()
    fe_env = dict(os.environ)
    fe_env.update({"NEXT_PUBLIC_API_URL": f"http://127.0.0.1:{backend_port}",
                   "NODE_ENV": "development"})
    fe_proc, fe_port = _start_frontend(fe_env)
    ev["ports"] = {"backend": backend_port, "frontend": fe_port}

    backend = JR.ScratchServer(
        LABEL, preferred_port=backend_port,
        extra_env={"ATOM_LOCAL_ONLY": "true",
                   "OLLAMA_BASE_URL": "http://localhost:11434/v1",
                   "OLLAMA_MODEL": MODEL,
                   "ADDITIONAL_ALLOWED_ORIGINS":
                       f"http://localhost:{fe_port},"
                       f"http://127.0.0.1:{fe_port}"})
    passed = False
    try:
        boot = backend.up()
        ev["backend_boot"] = boot
        ev["backend_identity"] = backend.evidence_identity()
        if not boot.get("booted"):
            raise RuntimeError("backend failed to boot")

        user = JR.new_user(backend.base)
        if not user.get("token"):
            raise RuntimeError("fresh user registration failed")
        ev["fresh_user"] = {"email": user["email"], "id": user.get("id"),
                            "workspace_id": user.get("workspace_id"),
                            "register_http": user.get("register_http")}

        if not _wait_http(f"http://localhost:{fe_port}/login", 300):
            raise RuntimeError("frontend did not come up")

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ev["browser"] = {"version": browser.version,
                             "channel": "bundled-chromium"}
            context = browser.new_context(
                viewport={"width": 1440, "height": 960})
            page = context.new_page()

            console: list = []
            page_errors: list = []
            failed_requests: list = []
            update_hits: list = []
            status_reads: list = []
            api_calls: list = []

            btag = backend.base.split("//")[1]

            def _is_update_request(r) -> bool:
                return "/api/onboarding/update" in r.url and r.method == "POST"

            def _is_update_response(r) -> bool:
                return ("/api/onboarding/update" in r.url
                        and r.request.method == "POST")

            page.on("console", lambda m: console.append(
                {"type": m.type, "text": _redact((m.text or "")[:600])}))
            page.on("pageerror", lambda e: page_errors.append(
                _redact(str(e)[:600])))
            page.on("requestfailed", lambda r: failed_requests.append(
                {"method": r.method, "url": _redact(r.url),
                 "failure": (r.failure or "")[:200]}))
            page.on("request", lambda r: update_hits.append(
                f"{r.method} {_redact(r.url)}") if _is_update_request(r)
                else None)
            page.on("response", lambda r: status_reads.append(
                f"{r.status} {_redact(r.url)}")
                if "/api/onboarding/status" in r.url else None)
            page.on("request", lambda r: api_calls.append(
                f"{r.method} {_redact(r.url)}")
                if btag in r.url and len(api_calls) < 300 else None)

            # ---- leg 1: sign in (fresh browser state, fresh product user)
            ev["leg_login"] = _login(page, fe_port, user)

            # ---- leg 2: the wizard must appear for this incomplete user
            overlay = page.locator("div.fixed.inset-0.z-50")
            for _ in range(30):
                if overlay.count():
                    break
                time.sleep(1)
            time.sleep(1)
            wiz = _drive_wizard_to_ready(page, overlay)
            ev["leg_wizard"] = wiz

            if MODE == "negative_auth_missing":
                page.evaluate(
                    "() => { localStorage.removeItem('token'); "
                    "localStorage.removeItem('auth_token'); }")
                ev["negative_control"] = {
                    "tokens_removed_before_click": True,
                    "intent": "controlled 401 path — the failure must stay "
                              "visible and must not mark completion",
                }

            # ---- leg 3: ONE ordinary completion click, fully instrumented
            click: dict = {"found": bool(wiz.get("start_button_present"))}
            request: dict = {"seen": False}
            response: dict = {}
            start = overlay.first.get_by_role("button", name="Start Automating")
            resp = None
            try:
                with page.expect_response(
                        _is_update_response, timeout=25000) as resp_info:
                    start.first.click(timeout=15000)
                    click["clicked"] = True
                resp = resp_info.value
            except Exception as exc:  # noqa: BLE001
                click["clicked"] = click.get("clicked", False)
                click["error"] = f"{type(exc).__name__}: {exc}"
            ev["leg_click"] = click
            if update_hits:
                request["seen"] = True
                request["hits"] = update_hits
            if resp is not None:
                try:
                    req = resp.request
                    request["seen"] = True
                    request["method"] = req.method
                    request["url"] = req.url
                    request["headers"] = _sanitize_headers(req.headers)
                    request["post_data"] = req.post_data
                    request["authorization_present"] = (
                        req.headers.get("authorization") is not None)
                except Exception as exc:  # noqa: BLE001
                    request["detail_error"] = f"{type(exc).__name__}: {exc}"
                try:
                    body = resp.text()
                except Exception as exc:  # noqa: BLE001
                    body = f"<unreadable: {type(exc).__name__}>"
                response["status"] = resp.status
                response["body"] = body[:2000]
            ev["leg_request"] = request
            ev["leg_response"] = response or None

            page.wait_for_timeout(2500)
            body_text = page.locator("body").inner_text()
            ev["leg_toast_after_click"] = {
                "success_visible": "You're all set!" in body_text,
                "failure_visible": ("Could not complete onboarding"
                                    in body_text
                                    or "Something went wrong" in body_text),
            }
            ev["leg_overlay_after_click"] = _overlay_state(page)

            # ---- leg 4: subsequent status read (API + durable row)
            status = JR.auth_get(backend.base, user["token"],
                                 "/api/onboarding/status")
            data = (status.get("json") or {}).get("data") or {}
            ev["leg_status_read"] = {
                "http": status.get("http"),
                "onboarding_completed": data.get("onboarding_completed"),
                "onboarding_step": data.get("onboarding_step"),
            }
            ev["leg_db_row"] = _db_row(backend.db_path, user["email"])

            if MODE == "negative_auth_missing":
                # Restore the session (the user signs in again / refreshes
                # with a valid session) so the reload reads status as an
                # authenticated user: completion must STILL be false and the
                # wizard must reappear.
                page.evaluate(
                    "(t) => { localStorage.setItem('token', t); "
                    "localStorage.setItem('auth_token', t); }",
                    user["token"])
                ev["negative_control"]["session_restored_before_reload"] = True

            # ---- leg 5: reload in the SAME browser session
            reload_obs: dict = {}
            try:
                page.reload(wait_until="domcontentloaded", timeout=120000)
                time.sleep(6)
                reload_obs["overlay"] = _overlay_state(page)
                reload_obs["wizard_reopened"] = bool(
                    reload_obs["overlay"]["present"]
                    and "Welcome to Atom" in reload_obs["overlay"].get("text", ""))
            except Exception as exc:  # noqa: BLE001
                reload_obs["error"] = f"{type(exc).__name__}: {exc}"
                reload_obs["wizard_reopened"] = None
            ev["leg_reload"] = reload_obs

            # ---- leg 6: fresh sign-in in a NEW context (fresh session)
            signin_obs: dict = {}
            try:
                context2 = browser.new_context(
                    viewport={"width": 1440, "height": 960})
                page2 = context2.new_page()
                signin_obs["login"] = _login(page2, fe_port, user)
                time.sleep(6)
                signin_obs["overlay"] = _overlay_state(page2)
                signin_obs["wizard_reopened"] = bool(
                    signin_obs["overlay"]["present"]
                    and "Welcome to Atom"
                    in signin_obs["overlay"].get("text", ""))
                context2.close()
            except Exception as exc:  # noqa: BLE001
                signin_obs["error"] = f"{type(exc).__name__}: {exc}"
                signin_obs["wizard_reopened"] = None
            ev["leg_fresh_signin"] = signin_obs

            ev["console"] = console[-300:]
            ev["page_errors"] = page_errors
            ev["failed_requests"] = failed_requests
            ev["browser_status_reads"] = status_reads
            ev["api_calls_sample"] = api_calls[-120:]

            # ---- first failed transition (fixed taxonomy, in order)
            def _first_failure(e: dict) -> str:
                if not e["leg_click"].get("clicked"):
                    return "click_handling"
                if not e["leg_request"].get("seen"):
                    return "request_construction"
                if not e["leg_request"].get("authorization_present"):
                    return "transport_auth"
                if not e.get("leg_response"):
                    return "transport_auth"
                if e["leg_response"].get("status") != 200:
                    return "transport_auth"
                sr = e["leg_status_read"]
                if not (sr.get("onboarding_completed")
                        and e["leg_db_row"].get("onboarding_completed")):
                    return "persistence"
                if e["leg_overlay_after_click"]["present"]:
                    return "parent_state"
                if e["leg_reload"].get("wizard_reopened"):
                    return "reload"
                if e["leg_fresh_signin"].get("wizard_reopened"):
                    return "reload"
                return "none"

            first = _first_failure(ev)
            ev["first_failed_transition"] = first
            works = (first == "none")
            ev["observed"] = {
                "completion_works": works,
                "failure_visible": ev["leg_toast_after_click"]["failure_visible"],
                "falsely_marked_completed": (
                    ev["leg_toast_after_click"]["failure_visible"]
                    and bool(ev["leg_status_read"].get("onboarding_completed"))),
            }
            checks = {
                "browser.onboarding-button-clicked": bool(click.get("clicked")),
                "browser.onboarding-request-authorized": bool(
                    request.get("authorization_present")),
                "browser.onboarding-response-200": bool(
                    response and response.get("status") == 200),
                "browser.onboarding-persisted": bool(
                    ev["leg_status_read"].get("onboarding_completed")
                    and ev["leg_db_row"].get("onboarding_completed")),
                "browser.onboarding-closes": not ev[
                    "leg_overlay_after_click"]["present"],
                "browser.onboarding-reload-stable": not ev[
                    "leg_reload"].get("wizard_reopened"),
                "browser.onboarding-signin-stable": not ev[
                    "leg_fresh_signin"].get("wizard_reopened"),
            }
            if MODE == "negative_auth_missing":
                checks = {
                    # An unauthenticated cross-site POST is rejected before
                    # auth by the CSRF middleware (observed 403
                    # csrf_token_invalid) — record any 4xx rejection, not
                    # one specific status.
                    "failure.response-non2xx": bool(
                        response and response.get("status", 0) >= 400),
                    "failure.toast-visible": ev[
                        "leg_toast_after_click"]["failure_visible"],
                    "failure.not-persisted": not bool(
                        ev["leg_status_read"].get("onboarding_completed")
                        or ev["leg_db_row"].get("onboarding_completed")),
                    "failure.wizard-stays-open": bool(
                        ev["leg_overlay_after_click"]["present"]),
                    "failure.visible-after-reload": bool(
                        ev["leg_reload"].get("wizard_reopened")),
                    "failure.no-false-completion": not ev["observed"][
                        "falsely_marked_completed"],
                }
                ev["observed"]["failure_contract_holds"] = all(checks.values())
            ev["assertions"] = checks
            passed = all(checks.values())
            ev["pass"] = passed
            print(json.dumps({"assertions": checks,
                              "first_failed_transition": first,
                              "observed": ev["observed"]}, indent=1))

            context.close()
            browser.close()
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        ev["backend_log_tail"] = _redact(backend.log_tail())
        ev["backend_storage"] = backend.storage_paths()
        backend.stop()
        try:
            os.killpg(os.getpgid(fe_proc.pid), signal.SIGTERM)
        except Exception:  # noqa: BLE001
            fe_proc.terminate()
        out = JR.save_result(LABEL, ev)
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
