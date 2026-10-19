#!/usr/bin/env python3
"""Phase D — fresh-install quickstart loop (J1.quickstart-install + browser assertions).

Runs against an ALREADY-BOOTED fresh installation of the frozen candidate
(git worktree checkout, fresh venv + fresh node_modules, documented boot
commands, declared isolation: backend :18100, frontend :18101). Does NOT boot
or own the servers — it VERIFIES ownership of both ports (lsof pid + cwd,
health identity like Phase C hardening) and then drives the browser loop:

  sign in (documented admin@example.com) -> onboard (wizard, Card A uses the
  local Ollama daemon) -> configure model (provider readback) -> upload a
  source (real Documents UI) -> chat: obtain an answer that USES the uploaded
  source (fact QUARTZ-77) -> reload: answer + completion persist.

Carried forward from the Phase C hardened harness
(browser_onboarding_completion.py): Capture (console/network/request
failures), overlay discovery for both wizard shells, the ordinary completion
click with full post-click capture, fresh-session readbacks (no dismiss
marker), pinned-port ownership assertions, sub-second toast polling lessons.

NOT in scope (per owner directive): model-native tool planning campaigns,
broader automation, interruption suites. Failure-path injection stays in
Phase C; this slice is the happy-path loop plus honest per-leg assertions.

The harness runs with the FRESH venv's python; browsers come from the shared
Playwright browser cache (disclosed in the archive README).
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve()
BACKEND = HERE.parents[2]                    # .../backend
WT_ROOT = HERE.parents[3]                    # worktree root
FRONTEND = WT_ROOT / "frontend-nextjs"
EVID_DIR = HERE.parent / "journey_matrix" / "phase_d_fresh_install"
FIXTURE = EVID_DIR / "fixtures" / "phase_d_zephyr_notes.txt"

FROZEN_SHA = "68729ebe4425c689832f012c3d5da23f3effc491"
PINNED_FE_PORT = 18101
PINNED_BE_PORT = 18100
FE_BASE = f"http://localhost:{PINNED_FE_PORT}"
BE_BASE = f"http://127.0.0.1:{PINNED_BE_PORT}"
ADMIN_EMAIL = "admin@example.com"
PASSWORD_FILE = BACKEND / "logs" / "bootstrap_admin_password.txt"

FIXTURE_TEXT = (
    "ATOM PHASE D FIXTURE — internal notes.\n"
    "Project Zephyr-9 launch planning.\n"
    "The launch code for project Zephyr-9 is QUARTZ-77.\n"
    "Owner: R. Parikh. Team: acceptance.\n"
    "Decoy: the archive key for project Halcyon-2 is BASALT-13.\n"
)
CHAT_PROMPT = ("Search my uploaded documents for the launch code for project "
               "Zephyr-9 and tell me the code.")

T0 = time.time()


def _now() -> float:
    return round(time.time() - T0, 2)


def _truncate(value, limit: int = 600):
    if value is None:
        return None
    text = str(value)
    return text if len(text) <= limit else text[:limit] + f"…(+{len(text) - limit})"


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


def _proc_cmd(pid: int) -> str:
    try:
        return subprocess.run(["ps", "-p", str(pid), "-o", "command="],
                              capture_output=True, text=True,
                              timeout=10).stdout.strip()[:300]
    except Exception:  # noqa: BLE001
        return ""


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


def _http_json(url: str) -> dict:
    import httpx
    try:
        r = httpx.get(url, timeout=10, trust_env=False)
        return {"status": r.status_code, "body": r.json()}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def ownership_check(port: int, expected_prefix: str, tag: str) -> dict:
    pid = _listener_pid(port)
    cwd = _proc_cwd(pid) if pid else None
    return {
        "tag": tag, "port": port, "listener_pid": pid, "listener_cwd": cwd,
        "listener_cmd": _proc_cmd(pid) if pid else None,
        "owned_by_worktree": bool(cwd and cwd.startswith(expected_prefix)),
    }


def db_read(db_path: str, email: str = ADMIN_EMAIL) -> dict:
    try:
        con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}
    try:
        row = con.execute(
            "SELECT id, onboarding_completed, onboarding_step FROM users "
            "WHERE email=?", (email,)).fetchone()
        users = con.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        try:
            workspaces = con.execute(
                "SELECT COUNT(*) FROM workspaces").fetchone()[0]
        except Exception:  # noqa: BLE001
            workspaces = None
        return {"found": bool(row), "id": row[0] if row else None,
                "completed": bool(row[1]) if row else None,
                "step": row[2] if row else None,
                "users_total": users, "workspaces_total": workspaces}
    finally:
        con.close()


class Capture:
    """Console/network/WS recorder for one page (Phase C machinery + WS)."""

    MARKERS = ("/api/auth", "/api/onboarding", "/api/ai/providers",
               "/api/users/me", "/api/documents", "/api/chat")

    def __init__(self, page, backend_base: str):
        self.page = page
        self.backend_tag = backend_base.split("//")[1]
        self.console: list = []
        self.page_errors: list = []
        self.requests: list = []
        self.responses: list = []
        self.failed: list = []
        self.websockets: list = []
        page.on("console", self._console)
        page.on("pageerror", self._pageerror)
        page.on("request", self._request)
        page.on("response", self._response)
        page.on("requestfailed", self._failed)
        page.on("websocket", self._ws_open)

    def _is_interesting(self, url: str) -> bool:
        return self.backend_tag in url or any(m in url for m in self.MARKERS)

    def _console(self, msg):
        self.console.append({"t": _now(), "type": msg.type,
                             "text": _truncate(msg.text, 400)})

    def _pageerror(self, err):
        self.page_errors.append({"t": _now(),
                                 "error": _truncate(str(err), 600)})

    def _request(self, req):
        try:
            if not self._is_interesting(req.url):
                return
            headers = {k.lower(): v for k, v in (req.headers or {}).items()}
            auth = headers.get("authorization", "")
            entry = {"t": _now(), "method": req.method, "url": req.url,
                     "authorization_present": bool(auth),
                     "content_type": headers.get("content-type"),
                     "post_data": None}
            if "documents/upload" not in req.url:  # never record file bodies
                entry["post_data"] = _truncate(req.post_data, 400)
            self.requests.append(entry)
        except Exception as exc:  # noqa: BLE001
            self.requests.append({"t": _now(), "error": str(exc)})

    def _response(self, resp):
        try:
            if not self._is_interesting(resp.url):
                return
            entry = {"t": _now(), "status": resp.status, "url": resp.url}
            if any(m in resp.url for m in ("/api/onboarding", "/api/auth/login",
                                           "/api/ai/providers", "/api/users/me",
                                           "/api/documents", "/api/chat")):
                try:
                    entry["body_head"] = _truncate(resp.text(), 500)
                except Exception as exc:  # noqa: BLE001
                    entry["body_error"] = f"{type(exc).__name__}"
            self.responses.append(entry)
        except Exception as exc:  # noqa: BLE001
            self.responses.append({"t": _now(), "error": str(exc)})

    def _failed(self, req):
        self.failed.append({"t": _now(), "url": req.url,
                            "failure": _truncate(req.failure, 300)})

    def _ws_open(self, ws):
        entry: dict = {"url": ws.url, "frames_sent": [],
                       "frames_received": []}
        try:
            ws.on("framesent",
                  lambda payload: entry["frames_sent"].append(
                      _truncate(payload, 300)))
            ws.on("framereceived",
                  lambda payload: entry["frames_received"].append(
                      _truncate(payload, 300)))
        except Exception:  # noqa: BLE001
            pass
        self.websockets.append(entry)

    def requests_to(self, needle: str, method=None) -> list:
        return [r for r in self.requests
                if needle in str(r.get("url"))
                and (method is None or r.get("method") == method)]

    def responses_to(self, needle: str) -> list:
        return [r for r in self.responses if needle in str(r.get("url"))]

    def summary(self, since: float = 0.0) -> dict:
        return {
            "console": [c for c in self.console if c["t"] >= since][-80:],
            "page_errors": [p for p in self.page_errors if p["t"] >= since],
            "requests": [r for r in self.requests
                         if r.get("t", 0) >= since][-80:],
            "responses": [r for r in self.responses
                          if r.get("t", 0) >= since][-60:],
            "request_failures": [f for f in self.failed
                                 if f.get("t", 0) >= since],
            "websockets": self.websockets[-4:],
        }


def page_token(page):
    try:
        return page.evaluate(
            "() => localStorage.getItem('token') || "
            "localStorage.getItem('auth_token')")
    except Exception:  # noqa: BLE001
        return None


def page_api(page, path: str) -> dict:
    """GET {BE_BASE}{path} from inside the page session (its own token)."""
    try:
        return page.evaluate(
            """async ({base, path}) => {
                const t = localStorage.getItem('token')
                       || localStorage.getItem('auth_token');
                const r = await fetch(base + path, {
                    headers: t ? {Authorization: 'Bearer ' + t} : {},
                });
                let body = null;
                try { body = await r.json(); } catch (e) {}
                return {status: r.status, auth_header_present: !!t,
                        body};
            }""", {"base": BE_BASE, "path": path})
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
                    ls[k] = k.toLowerCase().includes('token')
                        ? `<len ${v.length}>` : v.slice(0, 80);
                }
                return {localStorage: ls,
                        dismiss_key: sessionStorage.getItem(
                            'atom.onboarding.dismissed'),
                        chat_session: localStorage.getItem(
                            'atom_chat_session_id')};
            }""")
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def overlay_of(page, timeout_ms: int = 2000):
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


def do_login(page, user: dict, timeout_s: float = 180) -> dict:
    page.goto(f"{FE_BASE}/login", wait_until="domcontentloaded",
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
    node, kind = wait_for_overlay(page, 180)
    leg["overlay_discovered"] = {"found": node is not None, "kind": kind}
    if node is None:
        leg["path_after_login"] = body_text(page)[:300]
        return leg
    leg["overlay_text_head"] = overlay_text(node)

    node.get_by_role("button", name="Next").first.click(timeout=20000)
    page.wait_for_timeout(700)

    role_input = node.locator("#role")
    goal_input = node.locator("#goal")
    if role_input.count():
        role_input.fill("acceptance")
    if goal_input.count():
        goal_input.fill("phase d fresh-install loop")
    node.get_by_role("button", name="Next").first.click(timeout=20000)
    page.wait_for_timeout(700)

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
        try:
            node.get_by_role("button", name="Next").first.click(timeout=15000)
            connect["skipped_via_next"] = True
        except Exception as exc:  # noqa: BLE001
            connect["skip_error"] = f"{type(exc).__name__}: {exc}"
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


def completion_click(page, node, cap: Capture, leg: dict) -> dict:
    if node is None:
        leg["start_button_found"] = False
        leg["error"] = "wizard overlay not present before the completion click"
        return leg
    start = node.get_by_role("button", name="Start Automating")
    leg["start_button_found"] = bool(start.count())
    if not start.count():
        return leg
    leg["start_button_enabled"] = start.first.is_enabled()
    try:
        page.screenshot(path=str(EVID_DIR / "phase_d_ready_before_click.png"))
    except Exception:  # noqa: BLE001
        pass
    click_t = _now()
    leg["click_t"] = click_t
    start.first.click(timeout=20000)

    closed_at = None
    toasts_seen: list = []
    toasts_wanted = ("You're all set", "Could not complete onboarding",
                     "Ollama connected", "Error")
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if closed_at is None and overlay_of(page)[0] is None:
            closed_at = _now()
        text = body_text(page)
        for want in toasts_wanted:
            if want in text and want not in toasts_seen:
                toasts_seen.append(want)
        page.wait_for_timeout(1000)
    leg["overlay_closed_at"] = closed_at
    leg["overlay_closed_seconds_after_click"] = (
        round(closed_at - click_t, 2) if closed_at else None)
    leg["toasts_seen"] = toasts_seen
    leg["overlay_still_open"] = overlay_of(page)[0] is not None
    try:
        page.screenshot(path=str(EVID_DIR / "phase_d_after_click.png"))
    except Exception:  # noqa: BLE001
        pass
    leg["update_requests_after_click"] = [
        r for r in cap.requests_to("/api/onboarding/update", "POST")
        if r.get("t", 0) >= click_t]
    leg["update_responses_after_click"] = [
        r for r in cap.responses_to("/api/onboarding/update")
        if r.get("t", 0) >= click_t]
    leg["post_click_capture"] = cap.summary(since=click_t)
    return leg


def latest_assistant_text(page) -> str:
    """All text of the assistant bubbles in the message list (last first)."""
    for sel in ('[data-testid="agent-response"]',
                '[data-testid="message-list"]'):
        try:
            nodes = page.locator(sel)
            n = nodes.count()
            if n:
                texts = [nodes.nth(i).inner_text(timeout=2000)
                         for i in range(n)]
                texts = [t for t in texts if t.strip()]
                if texts:
                    return texts[-1]
        except Exception:  # noqa: BLE001
            continue
    return ""


def main() -> int:
    from playwright.sync_api import sync_playwright

    EVID_DIR.mkdir(parents=True, exist_ok=True)
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE.write_text(FIXTURE_TEXT)

    ev: dict = {
        "journey": "phase-d-fresh-install-quickstart-loop",
        "phase": "D-pristine-install",
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                    time.gmtime()),
        "harness": {
            "file": str(HERE),
            "sha256": hashlib.sha256(HERE.read_bytes()).hexdigest(),
        },
        "frozen_candidate": FROZEN_SHA,
        "worktree": str(WT_ROOT),
        "isolation": {
            "backend_port": PINNED_BE_PORT, "frontend_port": PINNED_FE_PORT,
            "fresh_venv": str(BACKEND / "venv"),
            "fresh_node_modules": str(FRONTEND / "node_modules"),
            "venv_is_symlink": (BACKEND / "venv").is_symlink(),
            "node_modules_is_symlink": (FRONTEND / "node_modules").is_symlink(),
        },
    }
    browser = None
    passed = False
    try:
        # ---------------- attach + identity verification ----------------
        if not _wait_http(f"{BE_BASE}/health", 60):
            raise RuntimeError("backend did not answer /health")
        health = _http_json(f"{BE_BASE}/health")
        ident = (health.get("body") or {}).get("identity") or {}
        ev["backend_health"] = {"status": health.get("status"),
                                "identity": ident}
        ev["backend_ownership"] = ownership_check(
            PINNED_BE_PORT, str(BACKEND), "attach")
        if not _wait_http(FE_BASE, 240):
            raise RuntimeError("frontend did not come up")
        ev["frontend_ownership_start"] = ownership_check(
            PINNED_FE_PORT, str(FRONTEND), "attach")
        ev["frontend_env_local"] = (FRONTEND / ".env.local").read_text() \
            if (FRONTEND / ".env.local").exists() else None

        db_path_raw = str(ident.get("database") or "")
        db_path = db_path_raw if db_path_raw.startswith("/") else \
            str(Path(str(ident.get("cwd") or BACKEND)) / db_path_raw)
        ev["db_path"] = db_path
        ev["db_path_inside_worktree"] = db_path.startswith(str(WT_ROOT))
        ev["db_before"] = db_read(db_path)
        ev["db_exists_before_run"] = Path(db_path).exists()

        if not PASSWORD_FILE.exists():
            raise RuntimeError(f"admin password file missing: {PASSWORD_FILE}")
        admin_password = PASSWORD_FILE.read_text().strip()
        ev["admin_credentials"] = {
            "email": ADMIN_EMAIL,
            "password_file": str(PASSWORD_FILE),
            "password_present": bool(admin_password),
            "password": "<redacted — read from the documented bootstrap file>",
        }

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ev["browser_version"] = browser.version
            ctx = browser.new_context(viewport={"width": 1440, "height": 960})
            page = ctx.new_page()
            cap = Capture(page, BE_BASE)

            # ---------------- 1. sign in (documented admin) ----------------
            s: dict = {}
            s["login"] = do_login(page, {"email": ADMIN_EMAIL,
                                         "password": admin_password})
            s["login"]["login_observed_at_backend"] = bool(
                cap.requests_to("/api/auth/login", "POST"))
            s["login"]["login_200_at_backend"] = any(
                r.get("status") == 200
                for r in cap.responses_to("/api/auth/login"))
            s["frontend_liveness_after_login"] = ownership_check(
                PINNED_FE_PORT, str(FRONTEND), "after_login")
            try:
                page.screenshot(path=str(EVID_DIR / "phase_d_signed_in.png"))
            except Exception:  # noqa: BLE001
                pass

            # ---------------- 2. onboarding wizard -------------------------
            s["wizard"] = walk_wizard(page, {})

            # ------------- 3. configure provider via wizard Card A ---------
            s["provider_after_wizard"] = page_api(page, "/api/ai/providers")
            s["status_api_mid"] = page_api(page, "/api/onboarding/status")

            # ---------------- 4. completion click --------------------------
            ready_node, _k = overlay_of(page)
            s["frontend_liveness_before_click"] = ownership_check(
                PINNED_FE_PORT, str(FRONTEND), "before_click")
            s["completion"] = completion_click(page, ready_node, cap, {})
            s["post_click"] = {
                "status_api": page_api(page, "/api/onboarding/status"),
                "db": db_read(db_path),
                "storage": storage_snapshot(page),
            }

            # ---------------- 5. upload a source (Documents UI) ------------
            up: dict = {}
            s["upload"] = up
            page.goto(f"{FE_BASE}/documents", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(4000)
            up["page_loaded"] = True
            try:
                up["file_input_found"] = page.locator(
                    "#file-upload").count() > 0
                if up["file_input_found"]:
                    page.set_input_files("#file-upload", str(FIXTURE))
                deadline = time.monotonic() + 180
                while time.monotonic() < deadline:
                    text = body_text(page)
                    if "Successfully uploaded" in text or \
                            "uploaded successfully" in text.lower():
                        up["success_text_seen"] = True
                        break
                    if any(r.get("status", 0) >= 400
                           for r in cap.responses_to("/api/documents/upload")):
                        break
                    page.wait_for_timeout(1000)
            except Exception as exc:  # noqa: BLE001
                up["error"] = f"{type(exc).__name__}: {exc}"
            up["upload_requests"] = cap.requests_to("/api/documents/upload",
                                                    "POST")
            up["upload_responses"] = cap.responses_to("/api/documents/upload")
            up["documents_list"] = page_api(page, "/api/documents")
            try:
                doc_body = up["documents_list"].get("body")
                items = doc_body.get("documents") if isinstance(
                    doc_body, dict) else doc_body
                up["fixture_in_list"] = any(
                    "zephyr" in json.dumps(i).lower()
                    for i in (items or []))
            except Exception:  # noqa: BLE001
                up["fixture_in_list"] = None
            try:
                page.screenshot(
                    path=str(EVID_DIR / "phase_d_documents_uploaded.png"))
            except Exception:  # noqa: BLE001
                pass

            # ---------------- 6. chat: useful attributed answer ------------
            ch: dict = {}
            s["chat"] = ch
            page.goto(f"{FE_BASE}/chat", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(3000)
            try:
                input_box = page.locator('[data-testid="agent-chat-input"]')
                deadline = time.monotonic() + 240
                while time.monotonic() < deadline and not input_box.count():
                    page.wait_for_timeout(1000)
                ch["input_found"] = input_box.count() > 0
                if ch["input_found"]:
                    input_box.first.fill(CHAT_PROMPT)
                    page.click('[data-testid="send-message-button"]')
                    ch["sent_at"] = _now()
                    settle_deadline = time.monotonic() + 360
                    last_text = ""
                    stable_since = None
                    while time.monotonic() < settle_deadline:
                        text = latest_assistant_text(page)
                        if text and text == last_text:
                            if stable_since is None:
                                stable_since = time.monotonic()
                            elif time.monotonic() - stable_since > 6:
                                break
                        else:
                            stable_since = None
                            last_text = text
                        page.wait_for_timeout(1000)
                    ch["assistant_text"] = _truncate(last_text, 1500)
                    ch["answer_contains_fact"] = (
                        "quartz-77" in (last_text or "").lower())
                    ch["waited_seconds"] = round(_now() - ch["sent_at"], 1)
            except Exception as exc:  # noqa: BLE001
                ch["error"] = f"{type(exc).__name__}: {exc}"
            ch["message_requests"] = cap.requests_to(
                "/api/chat/message", "POST")
            ch["message_responses"] = cap.responses_to("/api/chat/message")
            ch["ws_tail"] = cap.websockets[-3:]
            ch["storage"] = storage_snapshot(page)
            try:
                page.screenshot(
                    path=str(EVID_DIR / "phase_d_chat_answer.png"))
            except Exception:  # noqa: BLE001
                pass

            # ---------------- 7. durable readback of the answer ------------
            cd: dict = {}
            s["chat_durable"] = cd
            session_id = ch.get("storage", {}).get("chat_session")
            cd["session_id_from_storage"] = session_id
            if not session_id:
                for r in (ch.get("message_responses") or []):
                    m = re.search(r'"session_id"\s*:\s*"([^"]+)"',
                                  str(r.get("body_head") or ""))
                    if m:
                        session_id = m.group(1)
                        cd["session_id_from_response_body"] = session_id
                        break
            if session_id:
                me = page_api(page, "/api/users/me")
                uid = None
                try:
                    mb = me.get("body") or {}
                    uid = mb.get("id") or (mb.get("user") or {}).get("id")
                except Exception:  # noqa: BLE001
                    uid = None
                cd["user_id_present"] = bool(uid)
                q = f"?user_id={uid}" if uid else ""
                cd["history"] = page_api(
                    page, f"/api/chat/history/{session_id}{q}")
                try:
                    body = cd["history"].get("body") or {}
                    msgs = body.get("messages") if isinstance(
                        body, dict) else body
                    cd["history_contains_fact"] = any(
                        "quartz-77" in json.dumps(m).lower()
                        for m in (msgs or []))
                except Exception:  # noqa: BLE001
                    cd["history_contains_fact"] = None

            # ---------------- 8. reload: persistence ------------------------
            rl: dict = {}
            s["reload"] = rl
            page.evaluate(
                "() => sessionStorage.removeItem('atom.onboarding.dismissed')")
            page.reload(wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(9000)
            try:
                rl["chat_text_after_reload"] = _truncate(
                    latest_assistant_text(page), 700)
            except Exception:  # noqa: BLE001
                rl["chat_text_after_reload"] = ""
            rl["fact_persists_after_reload"] = (
                "quartz-77" in (rl.get("chat_text_after_reload")
                                or "").lower())
            rl["wizard_present_after_reload"] = overlay_of(page)[0] is not None
            try:
                page.screenshot(
                    path=str(EVID_DIR / "phase_d_after_reload.png"))
            except Exception:  # noqa: BLE001
                pass

            # fresh app load (server-state check, no dismiss marker)
            cap2 = Capture(page, BE_BASE)
            page.evaluate(
                "() => sessionStorage.removeItem('atom.onboarding.dismissed')")
            page.goto(f"{FE_BASE}/dashboard", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(9000)
            rl["wizard_present_after_dashboard_load"] = (
                overlay_of(page)[0] is not None)
            host_fetches = [r for r in cap2.responses
                            if "/api/onboarding/status" in str(r["url"])]
            rl["host_status_fetches"] = host_fetches
            rl["host_fetch_shows_completed"] = any(
                r.get("status") == 200
                and '"onboarding_completed":true' in str(
                    r.get("body_head") or "")
                for r in host_fetches)
            rl["status_api"] = page_api(page, "/api/onboarding/status")
            rl["db"] = db_read(db_path)
            rl["frontend_liveness_at_end"] = ownership_check(
                PINNED_FE_PORT, str(FRONTEND), "end")
            rl["backend_ownership_at_end"] = ownership_check(
                PINNED_BE_PORT, str(BACKEND), "end")

            ev["session"] = s

            ev["console_tail"] = cap.summary(since=0)["console"][-25:]
            ev["page_errors"] = cap.summary(since=0)["page_errors"]
            ctx.close()

        # ---------------- assertions ----------------
        ident = (ev.get("backend_health") or {}).get("identity") or {}
        s = ev.get("session") or {}
        completion = s.get("completion") or {}
        post_click = s.get("post_click") or {}
        upload = s.get("upload") or {}
        chat = s.get("chat") or {}
        durable = s.get("chat_durable") or {}
        reload_leg = s.get("reload") or {}
        prov = s.get("provider_after_wizard") or {}

        served_commit_ok = str(ident.get("git_commit") or "").startswith(
            FROZEN_SHA[:12]) or str(ident.get("revision") or "").startswith(
            FROZEN_SHA[:12])

        checks = {
            "candidate-identity-served": bool(served_commit_ok),
            "backend-owned-by-worktree": bool(
                (ev.get("backend_ownership") or {}).get("owned_by_worktree")
                and str(ident.get("cwd") or "").startswith(str(BACKEND))),
            "frontend-owned-by-worktree": bool(
                (ev.get("frontend_ownership_start") or {})
                .get("owned_by_worktree")
                and (s.get("frontend_liveness_after_login") or {})
                .get("owned_by_worktree")),
            "fresh-isolated-data": bool(
                ev.get("db_path_inside_worktree")
                and not ev["isolation"].get("venv_is_symlink")
                and not ev["isolation"].get("node_modules_is_symlink")),
            "signin": bool(s.get("login", {}).get("signed_in")
                           and s.get("login", {})
                           .get("login_200_at_backend")),
            "wizard-present": bool(
                s.get("wizard", {}).get("overlay_discovered", {}).get("found")),
            "provider-configured-via-wizard": bool(
                s.get("wizard", {}).get("connect", {}).get("enable_clicked")),
            "completion-request-emitted": bool(
                completion.get("update_requests_after_click")),
            "completion-persisted": bool(
                (post_click.get("db") or {}).get("completed")),
            "completion-overlay-closed": bool(
                completion.get("overlay_closed_at")),
            "provider-readback": bool(prov.get("status") == 200),
            "upload-succeeded": bool(
                any(r.get("status") == 200
                    for r in (upload.get("upload_responses") or []))),
            "upload-durable": bool(upload.get("fixture_in_list")),
            "chat-answer-received": bool(
                chat.get("input_found")
                and any(r.get("status") == 200
                        for r in (chat.get("message_responses") or []))),
            "answer-uses-uploaded-source": bool(
                chat.get("answer_contains_fact")),
            "answer-durable-in-history": bool(
                durable.get("history_contains_fact")),
            "reload-chat-persists": bool(
                reload_leg.get("fact_persists_after_reload")),
            "reload-no-wizard": bool(
                not reload_leg.get("wizard_present_after_dashboard_load")
                and reload_leg.get("host_fetch_shows_completed")),
        }
        ev["assertions"] = checks
        ev["pass"] = all(checks.values())
        passed = ev["pass"]
        print(json.dumps({"assertions": checks}, indent=1))
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
        passed = False
    finally:
        ev["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                          time.gmtime())
        if browser is not None:
            try:
                browser.close()
            except Exception:  # noqa: BLE001
                pass
        out = EVID_DIR / (
            f"browser_quickstart_loop_"
            f"{time.strftime('%Y%m%d_%H%M%S')}.json")
        out.write_text(json.dumps(ev, indent=1))
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
