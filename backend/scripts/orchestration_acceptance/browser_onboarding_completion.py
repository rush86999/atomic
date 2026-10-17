#!/usr/bin/env python3
"""Phase C — onboarding-completion reproduce-first capture (J1.onboarding-completion).

Drives ONE ordinary completion click through a REAL Chromium against a
frozen scratch stack and attributes the first actually failed transition,
if any. The historical Oct-12 failure (wizard never closed, no persistence;
`browser_j2_chain_20261012_112631_9258b4.json`) is NOT assumed to still
reproduce — the trace decides.

Sequence (scenario 1, fresh product-created user + fresh browser context):
  login (real form) -> wizard Welcome -> Profile -> Connect (Card A
  "Enable Ollama" when the local daemon is detected) -> Ready ->
  ONE ordinary "Start Automating" click (no retry, no second chance), with
  full capture of: console messages, page errors, every request to the
  scratch backend (method/url/authorization-present/body), responses
  (status/body head), request failures, toast text, overlay state — then
  independent status readbacks (browser fetch, API with the user token,
  direct SQLite read of the scratch DB). After that: reload leg, then
  sign-out/sign-in leg (only when the first click actually persisted).

Scenario 2 (failure visibility, fresh user + fresh context): the same walk,
then POST /api/onboarding/update is briefly answered 500 by route
interception; the click must surface a visible failure, keep the wizard
open, and NOT mark completion anywhere. Unroute + second click must then
complete (recovery). This is an INJECTED failure, labeled as such.

Evidence identity: served backend = ScratchServer boot from THIS checkout
(commit + health git_commit); served frontend = `next dev` from this
checkout's frontend-nextjs; node_modules/venv are symlinks recorded in the
evidence. The harness file hash is embedded so the driver is attributable.

CONTAMINATION HARDENING (incident 2026-10-17 09:30, run #1): a port-only
wait once accepted ANOTHER checkout's dev server after this run's own
server died. Now: the frontend port is PINNED (`npm run dev -- -p N`), the
banner port must equal it, the listener pid's cwd must be THIS checkout
(lsof), the frontend stdout is drained (ring buffer -> log tail in
evidence), liveness is re-checked per leg, and the login POST must be
OBSERVED at OUR scratch backend before the browser legs can count.
"""
from __future__ import annotations

import collections
import hashlib
import json
import os
import re
import signal
import socket
import sqlite3
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402

FRONTEND = JR.REPO / "frontend-nextjs"
T0 = time.time()


def _now() -> float:
    return round(time.time() - T0, 2)


def _free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def _pick_frontend_port(preferred: int = 17800, tries: int = 20) -> int:
    """A pinned, unlikely-to-be-a-fallback frontend port. Only THIS
    checkout may ever serve it (asserted via lsof ownership)."""
    import httpx
    for candidate in range(preferred, preferred + tries):
        try:
            r = httpx.get(f"http://127.0.0.1:{candidate}/",
                          timeout=1, trust_env=False)
            if r.status_code < 500:  # someone is already serving here
                continue
        except Exception:  # noqa: BLE001 — nothing listening: free for us
            pass
        return candidate
    raise RuntimeError("no free pinned frontend port found")


def _listener_pid(port: int):
    try:
        out = subprocess.run(["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN",
                              "-t"], capture_output=True, text=True,
                             timeout=10).stdout.strip()
        return int(out.splitlines()[0]) if out else None
    except Exception:  # noqa: BLE001
        return None


def _proc_cwd(pid: int):
    try:
        out = subprocess.run(["lsof", "-p", str(pid), "-a", "-d", "cwd"],
                             capture_output=True, text=True,
                             timeout=10).stdout.strip().splitlines()
        return out[-1].split()[-1] if out else None
    except Exception:  # noqa: BLE001
        return None


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


class FrontendProc:
    """Pinned-port `next dev` with a drained stdout ring (no pipe-block
    class bugs) and identity-checkable ownership."""

    def __init__(self, npm_env: dict, pinned_port: int):
        self.pinned_port = pinned_port
        self.expected_cwd = str(FRONTEND)
        self.ring: "collections.deque[str]" = collections.deque(maxlen=800)
        self.proc = subprocess.Popen(
            ["npm", "run", "dev", "--", "-p", str(pinned_port)],
            cwd=str(FRONTEND), env=npm_env, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, text=True, start_new_session=True)
        threading.Thread(target=self._drain, daemon=True).start()

    def _drain(self):
        try:
            for line in self.proc.stdout:
                self.ring.append(line.rstrip("\n"))
        except Exception:  # noqa: BLE001 — stream closed; drain done
            pass

    def wait_banner(self, timeout_s: float = 240) -> int:
        t0 = time.monotonic()
        while time.monotonic() - t0 < timeout_s:
            for line in list(self.ring):
                m = re.search(r"Local:\s*http://localhost:(\d+)", line)
                if m:
                    return int(m.group(1))
            if self.proc.poll() is not None:
                raise RuntimeError(
                    f"frontend exited rc={self.proc.returncode}: "
                    f"{self.log_tail()[-500:]}")
            time.sleep(1.0)
        raise RuntimeError("frontend dev server did not report its port")

    def owner_check(self) -> dict:
        """The listener on the pinned port must be THIS checkout's frontend."""
        pid = _listener_pid(self.pinned_port)
        cwd = _proc_cwd(pid) if pid else None
        return {
            "pinned_port": self.pinned_port,
            "listener_pid": pid,
            "listener_cwd": cwd,
            "is_this_checkout": bool(
                cwd and cwd.startswith(self.expected_cwd)),
            "our_proc_alive": self.proc.poll() is None,
        }

    def assert_owner(self, tag: str) -> dict:
        check = self.owner_check()
        check["tag"] = tag
        if not check["is_this_checkout"] or not check["our_proc_alive"]:
            raise RuntimeError(
                f"frontend ownership lost at '{tag}': {check} — aborting "
                f"instead of tracing a foreign server")
        return check

    def log_tail(self, limit: int = 150) -> str:
        return "\n".join(list(self.ring)[-limit:])

    def stop(self):
        try:
            os.killpg(os.getpgid(self.proc.pid), signal.SIGTERM)
        except Exception:  # noqa: BLE001
            self.proc.terminate()


def _truncate(value, limit: int = 600):
    if value is None:
        return None
    text = str(value)
    return text if len(text) <= limit else text[:limit] + f"…(+{len(text) - limit})"


def db_user(db_path: str, email: str) -> dict:
    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        row = con.execute(
            "SELECT id, onboarding_completed, onboarding_step FROM users "
            "WHERE email=?", (email,)).fetchone()
        return {"found": bool(row),
                "id": row[0] if row else None,
                "completed": bool(row[1]) if row else None,
                "step": row[2] if row else None}
    finally:
        con.close()


def browser_status_read(page, api_base: str) -> dict:
    """Status read from INSIDE the page session (uses the page's own token)."""
    try:
        return page.evaluate(
            """async (base) => {
                const t = localStorage.getItem('token') || localStorage.getItem('auth_token');
                const r = await fetch(base + '/api/onboarding/status', {
                    headers: t ? {Authorization: 'Bearer ' + t} : {},
                });
                let body = null;
                try { body = await r.json(); } catch (e) {}
                return {status: r.status, auth_header_present: !!t, body};
            }""", api_base)
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def storage_snapshot(page) -> dict:
    try:
        return page.evaluate(
            """() => {
                const ls = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    const v = localStorage.getItem(k) || '';
                    ls[k] = k.includes('token') ? `<len ${v.length}>` : v.slice(0, 80);
                }
                return {localStorage: ls,
                        dismiss_key: sessionStorage.getItem('atom.onboarding.dismissed')};
            }""")
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def overlay_of(page, timeout_ms: int = 2000):
    """The wizard dialog if present. Radix renders role=dialog; the older
    shell used a fixed full-screen div. Returns (locator, kind) or (None, None)."""
    dlg = page.locator('[role="dialog"]')
    try:
        n = dlg.count()
    except Exception:  # noqa: BLE001
        n = 0
    for i in range(n):
        node = dlg.nth(i)
        try:
            if "Welcome to Atom" in node.inner_text(timeout=timeout_ms):
                return node, "role_dialog"
        except Exception:  # noqa: BLE001
            continue
    fixed = page.locator("div.fixed.inset-0.z-50")
    try:
        if fixed.count():
            return fixed.first, "fixed_div"
    except Exception:  # noqa: BLE001
        pass
    return None, None


def wait_for_overlay(page, timeout_s: float):
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        node, kind = overlay_of(page)
        if node is not None:
            return node, kind
        time.sleep(1.0)
    return None, None


def overlay_text(node) -> str:
    try:
        return _truncate(node.inner_text(timeout=3000), 400)
    except Exception as exc:  # noqa: BLE001
        return f"<unreadable: {type(exc).__name__}>"


def body_text(page) -> str:
    try:
        return page.locator("body").inner_text(timeout=5000)
    except Exception:  # noqa: BLE001
        return ""


class Capture:
    """Console/network recorder for one page."""

    def __init__(self, page, backend_base: str,
                 api_markers=("/api/auth", "/api/onboarding",
                              "/api/ai/providers", "/api/users/me")):
        self.page = page
        self.backend_tag = backend_base.split("//")[1]
        self.markers = api_markers
        self.console: list = []
        self.page_errors: list = []
        self.requests: list = []
        self.responses: list = []
        self.failed: list = []
        page.on("console", self._console)
        page.on("pageerror", self._pageerror)
        page.on("request", self._request)
        page.on("response", self._response)
        page.on("requestfailed", self._failed)

    def _console(self, msg):
        entry = {"t": _now(), "type": msg.type, "text": _truncate(msg.text, 400)}
        self.console.append(entry)

    def _pageerror(self, err):
        self.page_errors.append({"t": _now(), "error": _truncate(str(err), 600)})

    def _request(self, req):
        try:
            url = req.url
            if self.backend_tag not in url and not any(m in url
                                                       for m in self.markers):
                return
            headers = {k.lower(): v for k, v in (req.headers or {}).items()}
            auth = headers.get("authorization", "")
            self.requests.append({
                "t": _now(), "method": req.method, "url": url,
                "to_scratch_backend": self.backend_tag in url,
                "authorization_present": bool(auth),
                "authorization_scheme": auth.split(" ", 1)[0] if auth else None,
                "content_type": headers.get("content-type"),
                "post_data": _truncate(req.post_data, 400),
            })
        except Exception as exc:  # noqa: BLE001
            self.requests.append({"t": _now(), "error": str(exc)})

    def _response(self, resp):
        try:
            url = resp.url
            if self.backend_tag not in url and not any(m in url
                                                       for m in self.markers):
                return
            entry = {"t": _now(), "status": resp.status, "url": url}
            if any(m in url for m in ("/api/onboarding", "/api/auth/login",
                                      "/api/ai/providers", "/api/users/me")):
                try:
                    entry["body_head"] = _truncate(resp.text(), 500)
                except Exception as exc:  # noqa: BLE001
                    entry["body_error"] = f"{type(exc).__name__}"
            self.responses.append(entry)
        except Exception as exc:  # noqa: BLE001
            self.responses.append({"t": _now(), "error": str(exc)})

    def _failed(self, req):
        self.failed.append({"t": _now(),
                            "url": req.url,
                            "failure": _truncate(req.failure, 300)})

    def at_backend(self, method: str, needle: str, exclude_markers=None):
        out = []
        for r in self.requests:
            if r.get("method") != method:
                continue
            url = str(r.get("url") or "")
            if not r.get("to_scratch_backend") or needle not in url:
                continue
            if exclude_markers and any(m in url for m in exclude_markers):
                continue
            out.append(r)
        return out

    def responses_at_backend(self, needle: str):
        return [r for r in self.responses
                if self.backend_tag in str(r.get("url"))
                and needle in str(r.get("url"))]

    def update_requests_after(self, since: float) -> list:
        return [r for r in self.requests
                if r.get("method") == "POST"
                and "/api/onboarding/update" in str(r.get("url"))
                and r.get("t") is not None and r["t"] >= since]

    def update_responses_after(self, since: float) -> list:
        return [r for r in self.responses
                if "/api/onboarding/update" in str(r.get("url"))
                and r.get("t") is not None and r["t"] >= since]

    def summary(self, since: float = 0.0) -> dict:
        return {
            "console": [c for c in self.console if c["t"] >= since][-80:],
            "page_errors": [p for p in self.page_errors if p["t"] >= since],
            "requests_to_backend": [r for r in self.requests
                                    if r.get("to_scratch_backend")
                                    and r.get("t", 0) >= since][-60:],
            "key_responses": [r for r in self.responses
                              if r.get("t", 0) >= since][-60:],
            "request_failures": [f for f in self.failed
                                 if f.get("t", 0) >= since],
        }


def do_login(page, fe_base: str, user: dict, timeout_s: float = 120) -> dict:
    page.goto(f"{fe_base}/login", wait_until="domcontentloaded",
              timeout=240000)
    page.fill('[data-testid="login-email-input"]', user["email"])
    page.fill('[data-testid="login-password-input"]', user["password"])
    page.click('[data-testid="login-submit-button"]')
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        if not page.url.rstrip("/").endswith("/login"):
            break
        page.wait_for_timeout(1000)
    page.wait_for_timeout(2000)
    cookies = {c["name"] for c in page.context.cookies()}
    return {"url": page.url,
            "signed_in": not page.url.rstrip("/").endswith("/login"),
            "auth_cookie": "auth_token" in cookies,
            "storage": storage_snapshot(page)}


def walk_wizard(page, leg: dict) -> dict:
    """Welcome -> Profile -> Connect -> Ready. Records what it actually did."""
    node, kind = wait_for_overlay(page, 150)
    leg["overlay_discovered"] = {"found": node is not None, "kind": kind}
    if node is None:
        leg["path_after_login"] = body_text(page)[:300]
        return leg
    leg["overlay_text_head"] = overlay_text(node)

    # Step 1 (Welcome) -> Profile
    node.get_by_role("button", name="Next").first.click(timeout=20000)
    page.wait_for_timeout(700)

    # Step 2 (Profile)
    role_input = node.locator("#role")
    goal_input = node.locator("#goal")
    if role_input.count():
        role_input.fill("acceptance")
    if goal_input.count():
        goal_input.fill("onboarding completion trace")
    node.get_by_role("button", name="Next").first.click(timeout=20000)
    page.wait_for_timeout(700)

    # Step 3 (Connect): wait for the Ollama probe to resolve.
    connect = {"enable_ollama_found": False, "enable_clicked": False,
               "advanced_to_ready": False}
    enable = node.get_by_role("button", name="Enable Ollama")
    for _ in range(30):
        if enable.count():
            connect["enable_ollama_found"] = True
            break
        body = ""
        try:
            body = node.inner_text(timeout=2000)
        except Exception:  # noqa: BLE001
            pass
        if "Ollama not detected" in body:
            connect["ollama_not_detected"] = True
            break
        page.wait_for_timeout(1000)
    if connect["enable_ollama_found"]:
        enable.click(timeout=20000)
        connect["enable_clicked"] = True
        page.wait_for_timeout(2500)
    else:
        # Skip the connect step via the footer (a permitted path).
        try:
            node.get_by_role("button", name="Next").first.click(timeout=15000)
            connect["skipped_via_next"] = True
        except Exception as exc:  # noqa: BLE001
            connect["skip_error"] = f"{type(exc).__name__}: {exc}"
    # Wait until the Ready step renders (or record that it never did).
    for _ in range(30):
        if "You're Ready" in body_text(page) or \
                node.get_by_role("button",
                                 name="Start Automating").count():
            connect["advanced_to_ready"] = True
            break
        page.wait_for_timeout(1000)
    leg["connect"] = connect
    leg["overlay_text_at_ready"] = overlay_text(node)
    return leg


def click_start_automating(page, node, cap: Capture, leg: dict) -> dict:
    """The ordinary completion click: exactly once, no retry."""
    if node is None:
        leg["start_button_found"] = False
        leg["error"] = "wizard overlay not present before the completion click"
        return leg
    start = node.get_by_role("button", name="Start Automating")
    leg["start_button_found"] = bool(start.count())
    if not start.count():
        return leg
    leg["start_button_enabled"] = start.first.is_enabled()
    screenshots = Path(JR.__file__).parent / "journey_matrix"
    try:
        page.screenshot(path=str(screenshots /
                                 "phasec_ready_before_click.png"))
    except Exception:  # noqa: BLE001
        pass
    click_t = _now()
    leg["click_t"] = click_t
    start.first.click(timeout=20000)

    # Resolve: overlay close, toast text, status readbacks.
    closed_at = None
    toast_seen: list = []
    toasts_wanted = ("You're all set", "Could not complete onboarding",
                     "Ollama connected", "Error")
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if closed_at is None and overlay_of(page)[0] is None:
            closed_at = _now()
        text = body_text(page)
        for want in toasts_wanted:
            if want in text and want not in toast_seen:
                toast_seen.append(want)
        if closed_at is not None and toast_seen:
            break
        page.wait_for_timeout(1000)
    leg["overlay_closed_at"] = closed_at
    leg["overlay_closed_seconds_after_click"] = (
        round(closed_at - click_t, 2) if closed_at else None)
    leg["toasts_seen"] = toast_seen
    leg["overlay_still_open"] = overlay_of(page)[0] is not None
    try:
        page.screenshot(path=str(screenshots / "phasec_after_click.png"))
    except Exception:  # noqa: BLE001
        pass

    leg["update_requests_after_click"] = cap.update_requests_after(click_t)
    leg["update_responses_after_click"] = cap.update_responses_after(click_t)
    leg["post_click_capture"] = cap.summary(since=click_t)
    return leg


def first_failed_transition(leg: dict):
    """Attribute the FIRST failed transition, in click->persistence order."""
    if not leg.get("start_button_found"):
        return "start_button_not_found"
    reqs = leg.get("update_requests_after_click") or []
    if not reqs:
        return "click_no_request_emitted (click handling / request construction)"
    if reqs and not reqs[0].get("authorization_present"):
        return "request_missing_authorization (request construction)"
    fails = [f for f in (leg.get("post_click_capture") or {})
             .get("request_failures", []) if "/onboarding/update" in f["url"]]
    if fails:
        return f"request_failed_transport ({fails[0]['failure']})"
    resps = leg.get("update_responses_after_click") or []
    if not resps:
        return "request_sent_no_response (transport)"
    if resps[0].get("status", 0) >= 400:
        return f"update_rejected_http_{resps[0]['status']} (auth/backend)"
    return None


def main() -> int:
    from playwright.sync_api import sync_playwright

    ev: dict = {
        "journey": "browser-onboarding-completion",
        "phase": "C-reproduce-first",
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "harness": {
            "file": str(Path(__file__).resolve()),
            "sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "note": ("executed from the frozen worktree checkout; the "
                     "harness file itself is untracked there, served app "
                     "code is the checked-out commit"),
        },
        "boot_mode": JR.BOOT_MODE,
    }
    backend = None
    fe = None
    browser = None
    passed = False
    try:
        pinned_fe_port = _pick_frontend_port()
        backend_port = _free_port()
        fe_env = dict(os.environ)
        fe_env.update(
            {"NEXT_PUBLIC_API_URL": f"http://127.0.0.1:{backend_port}",
             "NODE_ENV": "development",
             "NEXT_TELEMETRY_DISABLED": "1",
             # Keep NextAuth's signOut/redirect base on OUR origin: the
             # default is http://localhost:3000 — on a shared machine that
             # is another session's server (observed 2026-10-17: the
             # sign-out redirect left our origin and landed on :3000).
             "NEXTAUTH_URL": f"http://localhost:{pinned_fe_port}"})
        fe = FrontendProc(fe_env, pinned_fe_port)
        banner_port = fe.wait_banner()
        ev["served"] = {
            "frontend": {
                "origin": f"http://localhost:{pinned_fe_port}",
                "pinned_port": pinned_fe_port,
                "banner_port": banner_port,
                "banner_matches_pinned": banner_port == pinned_fe_port,
                "mode": ("next dev (development build, compiled from this "
                         "checkout)"),
                "source": JR.source_identity(),
                "node_modules": str(FRONTEND / "node_modules"),
                "node_modules_is_symlink":
                    (FRONTEND / "node_modules").is_symlink(),
            },
            "backend_planned": {"port": backend_port, "cwd": str(JR.BACKEND),
                                "backend_env_file_present":
                                    (JR.BACKEND / ".env").exists()},
        }
        if banner_port != pinned_fe_port:
            raise RuntimeError(
                f"frontend banner port {banner_port} != pinned "
                f"{pinned_fe_port} — refusing to trace an unowned server")
        ev["frontend_ownership_start"] = fe.assert_owner("start")

        backend = JR.ScratchServer(
            "browser_onboarding_completion", preferred_port=backend_port,
            extra_env={"ATOM_LOCAL_ONLY": "true",
                       "OLLAMA_BASE_URL": "http://localhost:11434/v1",
                       "OLLAMA_MODEL": "llama3.1:8b",
                       "ADDITIONAL_ALLOWED_ORIGINS":
                           f"http://localhost:{pinned_fe_port},"
                           f"http://127.0.0.1:{pinned_fe_port}"})
        ev["served"]["backend_storage"] = backend.storage_paths()
        db_path = backend.storage_paths()["database"]
        boot = backend.up()
        ev["backend_boot"] = boot
        if not boot.get("booted"):
            raise RuntimeError("backend failed to boot")
        ev["served"]["backend_health_commit"] = boot.get("git_commit")
        ev["served"]["backend_identity"] = JR.source_identity()

        user = JR.new_user(backend.base)
        if not user.get("token"):
            raise RuntimeError("fresh user registration failed")
        ev["user"] = {"email": user["email"], "id": user.get("id"),
                      "workspace_id": user.get("workspace_id"),
                      "register_http": user.get("register_http"),
                      "password": "<scratch password redacted>"}
        fe_base = f"http://localhost:{pinned_fe_port}"
        if not _wait_http(f"{fe_base}/login", 240):
            raise RuntimeError("frontend did not come up")

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ev["browser_version"] = browser.version

            # ---------------- scenario 1: ordinary completion --------------
            ctx = browser.new_context(viewport={"width": 1440, "height": 960})
            page = ctx.new_page()
            cap = Capture(page, backend.base)
            s1: dict = {}

            s1["login"] = do_login(page, fe_base, user)
            login_reqs = cap.at_backend("POST", "/api/auth/login")
            login_resps = [r for r in cap.responses_at_backend("/api/auth")
                           if "/login" in r["url"] and r["status"] == 200]
            s1["login"]["login_observed_at_scratch_backend"] = bool(login_reqs)
            s1["login"]["login_200_at_scratch_backend"] = bool(login_resps)
            s1["frontend_liveness_after_login"] = fe.assert_owner(
                "after_login")
            pre_status = browser_status_read(page, backend.base)
            s1["wizard"] = walk_wizard(page, {})
            s1["pre_click"] = {
                "status_browser": pre_status,
                "status_api": JR.auth_get(backend.base, user["token"],
                                          "/api/onboarding/status"),
                "db": db_user(db_path, user["email"]),
            }
            s1["frontend_liveness_before_click"] = fe.assert_owner(
                "before_click")
            ready_node, _ready_kind = overlay_of(page)
            s1["completion"] = click_start_automating(page, ready_node, cap,
                                                      {})
            post_status = browser_status_read(page, backend.base)
            s1["post_click"] = {
                "status_browser": post_status,
                "status_api": JR.auth_get(backend.base, user["token"],
                                          "/api/onboarding/status"),
                "db": db_user(db_path, user["email"]),
                "storage": storage_snapshot(page),
            }
            fft = first_failed_transition(s1["completion"])
            # A response-OK-but-not-persisted attribution needs the DB read.
            if fft is None and not (s1["post_click"]["db"] or {}).get(
                    "completed"):
                fft = "response_ok_but_db_not_persisted (persistence)"
            if fft is None and s1["completion"].get("overlay_still_open"):
                fft = "persisted_but_overlay_stayed_open (parent-state)"
            s1["first_failed_transition"] = fft
            s1["completed_ok"] = bool(
                fft is None
                and (s1["post_click"]["db"] or {}).get("completed"))

            # ---------------- reload leg (only on a real completion) ------
            if s1["completed_ok"]:
                reload_leg: dict = {}
                # A fresh browser session has NO dismiss marker; clear it so
                # the host MUST consult the server — this is the condition
                # the assertion is about (reopen driven by server state).
                page.evaluate(
                    "() => sessionStorage.removeItem('atom.onboarding.dismissed')")
                cap_reload = Capture(page, backend.base)
                page.reload(wait_until="domcontentloaded", timeout=120000)
                page.wait_for_timeout(8000)
                node_after, kind_after = overlay_of(page)
                reload_leg["wizard_present_after_reload"] = \
                    node_after is not None
                reload_leg["overlay_kind"] = kind_after
                host_fetches = [r for r in cap_reload.responses
                                if "/api/onboarding/status" in str(r["url"])]
                reload_leg["dismiss_key_cleared_before_reload"] = True
                reload_leg["host_status_fetches"] = host_fetches
                reload_leg["host_fetch_shows_completed"] = any(
                    r.get("status") == 200
                    and '"onboarding_completed":true' in str(
                        r.get("body_head") or "")
                    for r in host_fetches)
                reload_leg["status_browser"] = browser_status_read(
                    page, backend.base)
                reload_leg["db"] = db_user(db_path, user["email"])
                reload_leg["console_tail"] = cap_reload.summary()["console"][-20:]
                s1["reload"] = reload_leg
                try:
                    page.screenshot(
                        path=str(Path(JR.__file__).parent / "journey_matrix" /
                                 "phasec_after_reload.png"))
                except Exception:  # noqa: BLE001
                    pass

                # -------------- sign-out / sign-in leg --------------------
                so: dict = {}
                cap_so = Capture(page, backend.base)
                page.goto(f"{fe_base}/dashboard",
                          wait_until="domcontentloaded", timeout=120000)
                page.wait_for_timeout(3000)
                logout = page.locator(
                    '[data-testid="dashboard-logout-button"]')
                so["logout_button_found"] = bool(logout.count())
                if logout.count():
                    logout.first.click(timeout=15000)
                    deadline = time.monotonic() + 30
                    while time.monotonic() < deadline:
                        url = page.url
                        if "/login" in url or "/signin" in url:
                            break
                        page.wait_for_timeout(1000)
                    page.wait_for_timeout(2000)
                    so["after_logout_url"] = page.url
                    so["signout_stayed_on_our_origin"] = (
                        f"localhost:{pinned_fe_port}" in page.url)
                    so["storage_after_logout"] = storage_snapshot(page)
                    so["cookies_after_logout"] = sorted(
                        c["name"] for c in page.context.cookies())
                    # Product sign-in again with the same user.
                    so["relogin"] = do_login(page, fe_base, user)
                    # Fresh-session conditions for the reopen check: no
                    # dismiss marker in this tab, so the host MUST consult
                    # the server before deciding to reopen.
                    page.evaluate(
                        "() => sessionStorage.removeItem("
                        "'atom.onboarding.dismissed')")
                    page.goto(f"{fe_base}/dashboard",
                              wait_until="domcontentloaded",
                              timeout=120000)
                    page.wait_for_timeout(8000)
                    so["wizard_present_after_relogin"] = (
                        overlay_of(page)[0] is not None)
                    relogin_fetches = [r for r in cap_so.responses
                                       if "/api/onboarding/status"
                                       in str(r["url"])]
                    so["host_status_fetches"] = relogin_fetches
                    so["host_fetch_shows_completed"] = any(
                        r.get("status") == 200
                        and '"onboarding_completed":true' in str(
                            r.get("body_head") or "")
                        for r in relogin_fetches)
                    so["status_browser"] = browser_status_read(
                        page, backend.base)
                    so["db"] = db_user(db_path, user["email"])
                s1["signout_signin"] = so
            ev["scenario1"] = s1

            # ------------- scenario 2: failure visibility (injected) ------
            ev["scenario2"] = {"note": ("injected 500 on "
                                        "POST /api/onboarding/update — failure "
                                        "visibility, NOT a product bug")}
            try:
                user2 = JR.new_user(backend.base)
                ctx2 = browser.new_context(
                    viewport={"width": 1440, "height": 960})
                page2 = ctx2.new_page()
                cap2 = Capture(page2, backend.base)
                s2: dict = {}
                s2["login"] = do_login(page2, fe_base, user2)
                s2["wizard"] = walk_wizard(page2, {})

                def _inject(route):
                    # Keep the CORS preflight healthy so the product sees a
                    # REAL rejected update (HTTP 500), not a transport error:
                    req = route.request
                    origin = req.headers.get("origin", "*")
                    if req.method == "OPTIONS":
                        route.fulfill(
                            status=204,
                            headers={
                                "Access-Control-Allow-Origin": origin,
                                "Access-Control-Allow-Methods":
                                    "POST, OPTIONS",
                                "Access-Control-Allow-Headers":
                                    req.headers.get(
                                        "access-control-request-headers",
                                        "authorization, content-type"),
                                "Access-Control-Max-Age": "0"})
                        return
                    route.fulfill(
                        status=500, content_type="application/json",
                        headers={"Access-Control-Allow-Origin": origin,
                                 "Access-Control-Allow-Credentials": "true"},
                        body=json.dumps({
                            "success": False,
                            "detail": "phase-c injected failure "
                                      "(failure-visibility scenario)"}))

                ctx2.route("**/api/onboarding/update", _inject)
                node2, _kind2 = overlay_of(page2)
                click_t2 = _now()
                if node2 is not None:
                    node2.get_by_role(
                        "button", name="Start Automating").first.click(
                        timeout=20000)
                # Sub-second polling: toast dwell is ~5s — one late scan
                # MISSES it (observed in the 2026-10-17 09:40 precursor run).
                patterns = {
                    "could_not_complete": "Could not complete onboarding",
                    "something_went_wrong": "Something went wrong",
                }
                first_seen: dict = {}
                toast_dom_samples: list = []
                shot_dir = Path(JR.__file__).parent / "journey_matrix"
                shot_early = shot_mid = False
                deadline2 = time.monotonic() + 12
                while time.monotonic() < deadline2:
                    text2 = body_text(page2)
                    for key, pat in patterns.items():
                        if pat in text2 and key not in first_seen:
                            first_seen[key] = round(_now() - click_t2, 2)
                    try:
                        dom = page2.locator(
                            '[role="status"], [role="alert"]'
                        ).all_inner_texts()
                        dom = [d for d in dom if d.strip()]
                        if dom and len(toast_dom_samples) < 6:
                            toast_dom_samples.append(
                                {"t": round(_now() - click_t2, 2),
                                 "texts": [_truncate(d, 200) for d in dom]})
                    except Exception:  # noqa: BLE001
                        pass
                    elapsed = _now() - click_t2
                    if not shot_early and elapsed >= 1.2:
                        shot_early = True
                        try:
                            page2.screenshot(path=str(
                                shot_dir /
                                "phasec_scenario2_failure_early.png"))
                        except Exception:  # noqa: BLE001
                            pass
                    if not shot_mid and elapsed >= 4.5:
                        shot_mid = True
                        try:
                            page2.screenshot(path=str(
                                shot_dir /
                                "phasec_scenario2_failure_mid.png"))
                        except Exception:  # noqa: BLE001
                            pass
                    page2.wait_for_timeout(300)
                text2 = body_text(page2)
                toast_dom_hits = [s for s in toast_dom_samples
                                  if any(pat in " ".join(s["texts"])
                                         for pat in patterns.values())]
                s2["failed_click"] = {
                    "failure_visible": bool(first_seen)
                    or bool(toast_dom_hits),
                    "failure_first_seen_offsets": first_seen,
                    "toast_dom_samples": toast_dom_samples,
                    "toast_dom_hits": toast_dom_hits,
                    "failure_text_head": _truncate(text2, 400),
                    "overlay_still_open": overlay_of(page2)[0] is not None,
                    "update_responses": cap2.update_responses_after(click_t2),
                    "post_click_capture": cap2.summary(since=click_t2),
                    "status_api": JR.auth_get(backend.base, user2["token"],
                                              "/api/onboarding/status"),
                    "db": db_user(db_path, user2["email"]),
                }
                s2["failed_click"]["falsely_marked_completed"] = bool(
                    (s2["failed_click"]["db"] or {}).get("completed"))

                # Recovery: remove the injection, click again.
                ctx2.unroute("**/api/onboarding/update", _inject)
                node2b, _k = overlay_of(page2)
                if node2b is not None:
                    node2b.get_by_role(
                        "button", name="Start Automating").first.click(
                        timeout=20000)
                deadline = time.monotonic() + 30
                closed = None
                while time.monotonic() < deadline:
                    if overlay_of(page2)[0] is None:
                        closed = _now()
                        break
                    page2.wait_for_timeout(1000)
                s2["recovery"] = {
                    "overlay_closed": closed is not None,
                    "db": db_user(db_path, user2["email"]),
                    "status_api": JR.auth_get(backend.base, user2["token"],
                                              "/api/onboarding/status"),
                }
                ev["scenario2"] = {**s2, "note": ev["scenario2"]["note"]}
                ctx2.close()
            except Exception as exc:  # noqa: BLE001
                ev["scenario2"]["error"] = f"{type(exc).__name__}: {exc}"

            ctx.close()

        # ------------------------- assertions -----------------------------
        s1 = ev.get("scenario1") or {}
        s2 = ev.get("scenario2") or {}
        checks = {
            "identities-recorded": bool(
                ev["served"]["frontend"]["source"].get("commit")
                and ev["served"].get("backend_health_commit")
                and ev["served"]["frontend"].get("banner_matches_pinned")),
            "frontend-owned-by-checkout": bool(
                ev.get("frontend_ownership_start", {}).get("is_this_checkout")
                and s1.get("frontend_liveness_before_click", {})
                .get("is_this_checkout")),
            "signin": bool(s1.get("login", {}).get("signed_in")
                           and s1.get("login", {})
                           .get("login_200_at_scratch_backend")),
            "wizard-present": bool(
                s1.get("wizard", {}).get("overlay_discovered", {})
                .get("found")),
            "connect-provider": bool(
                s1.get("wizard", {}).get("connect", {}).get("enable_clicked")
                or s1.get("wizard", {}).get("connect", {})
                .get("skipped_via_next")),
            "completion-click-emitted-request": bool(
                s1.get("completion", {}).get("update_requests_after_click")),
            "completion-persisted-db": bool(
                (s1.get("post_click", {}).get("db") or {}).get("completed")),
            "completion-overlay-closed": bool(
                s1.get("completion", {}).get("overlay_closed_at")),
            "reload-no-wizard": bool(
                s1.get("reload")
                and not s1["reload"]["wizard_present_after_reload"]
                and s1["reload"].get("host_fetch_shows_completed")
                and (s1["reload"].get("db") or {}).get("completed")),
            "signout-signin-no-wizard": bool(
                s1.get("signout_signin")
                and s1["signout_signin"].get("logout_button_found")
                and s1["signout_signin"].get("signout_stayed_on_our_origin")
                and not s1["signout_signin"]
                .get("wizard_present_after_relogin")
                and s1["signout_signin"].get("host_fetch_shows_completed")
                and (s1["signout_signin"].get("db") or {}).get("completed")),
            "failure-visible": bool(
                s2.get("failed_click", {}).get("failure_visible")),
            "failure-keeps-wizard-open": bool(
                s2.get("failed_click", {}).get("overlay_still_open")),
            "failure-not-marked-completed": not bool(
                s2.get("failed_click", {}).get("falsely_marked_completed")),
            "failure-recovery-completes": bool(
                s2.get("recovery", {}).get("overlay_closed")
                and (s2.get("recovery", {}).get("db") or {}).get("completed")),
        }
        ev["assertions"] = checks
        pass_now = all(checks.values())
        fft = s1.get("first_failed_transition")
        if fft:
            pass_now = False
        ev["first_failed_transition"] = fft
        ev["pass"] = pass_now
        passed = pass_now
        print(json.dumps({"assertions": checks,
                          "first_failed_transition": fft}, indent=1))
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
        passed = False
    finally:
        ev["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                          time.gmtime())
        if fe is not None:
            ev["frontend_log_tail"] = fe.log_tail()
        if backend is not None:
            ev["backend_log_tail"] = backend.log_tail()
            backend.stop()
        if fe is not None:
            fe.stop()
        if browser is not None:
            try:
                browser.close()
            except Exception:  # noqa: BLE001
                pass
        out = JR.save_result("browser_onboarding_completion", ev)
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
