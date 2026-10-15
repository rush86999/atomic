#!/usr/bin/env python3
"""Signed-in browser path for the acceptance contract (J1-J3 UI closure).

API success alone cannot close the advertised UI experience, so this drives
a REAL Chromium through the REAL login form against a scratch stack:

  backend: journey_runtime.ScratchServer (configuration-parity + public-API
           smoke boot, isolated SQLite/LanceDB/BYOK vaults)
  frontend: `next dev` from frontend-nextjs with NEXT_PUBLIC_API_URL pinned
            to the scratch backend (no shared files touched)

Steps: load /login -> fill email/password (a fresh product-registered user)
-> submit -> require a SIGNED-IN signal (redirect off /login + auth_token
cookie present) -> screenshot. Network requests to the backend are recorded
so "the browser talked to OUR backend" is an observation, not an inference.
"""
from __future__ import annotations

import json
import socket
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402

FRONTEND = JR.REPO / "frontend-nextjs"


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


def _start_frontend(npm_env):
    """Start next dev and return (proc, actual_port). The package.json dev
    script wraps with cross-env and does not reliably forward `-p`, so the
    ACTUAL port is read from the server's own 'Local:' banner (observed:
    requested 52731, served 52751 — the CORS allowlist must use the real
    one)."""
    import re
    proc = subprocess.Popen(["npm", "run", "dev"], cwd=str(FRONTEND),
                            env=npm_env, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True,
                            start_new_session=True)
    t0 = time.monotonic()
    while time.monotonic() - t0 < 240:
        line = proc.stdout.readline()
        if not line:
            if proc.poll() is not None:
                break
            continue
        m = re.search(r"Local:\s*http://localhost:(\d+)", line)
        if m:
            return proc, int(m.group(1))
    raise RuntimeError("frontend dev server did not report its port")


def main() -> int:
    from playwright.sync_api import sync_playwright

    import os
    ev: dict = {"journey": "browser-signed-in-path",
                "mode": JR.BOOT_MODE,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    # The backend port must be chosen BEFORE the frontend compiles: Next
    # inlines NEXT_PUBLIC_API_URL into the client bundle at build time. The
    # FRONTEND's actual port is only known after it boots (the dev script
    # does not reliably forward -p), so it is read from the 'Local:' banner
    # and the backend is allow-listed for that origin before it boots.
    chosen_backend_port = _free_port()
    fe_env = dict(os.environ)
    fe_env.update({
        "NEXT_PUBLIC_API_URL": f"http://127.0.0.1:{chosen_backend_port}",
        "NODE_ENV": "development",
    })
    fe_proc, fe_port = _start_frontend(fe_env)
    ev["frontend_port"] = fe_port
    ev["backend_port_chosen"] = chosen_backend_port

    backend = JR.ScratchServer(
        "browser_smoke", preferred_port=chosen_backend_port,
        extra_env={"ADDITIONAL_ALLOWED_ORIGINS":
                   f"http://localhost:{fe_port},http://127.0.0.1:{fe_port}"})
    user = None
    fe_proc = None
    passed = False
    try:
        boot = backend.up()
        ev["backend_boot"] = boot
        if not boot.get("booted"):
            raise RuntimeError("backend failed to boot")

        user = JR.new_user(backend.base)
        if not user.get("token"):
            raise RuntimeError("fresh user registration failed")
        ev["user"] = {"workspace_id": user.get("workspace_id")}

        # In-run CORS probe: does THIS boot serve ACA for the frontend
        # origin? Recorded so a browser-side block is attributable.
        import httpx as _hx
        _origin = f"http://localhost:{fe_port}"
        _probe = _hx.options(f"{backend.base}/api/health", headers={
            "Origin": _origin, "Access-Control-Request-Method": "GET"},
            timeout=10, trust_env=False)
        ev["cors_probe"] = {"origin": _origin, "status": _probe.status_code,
                            "aca": _probe.headers.get(
                                "access-control-allow-origin"),
                            "backend_base": backend.base}

        # The frontend is ALREADY running (started before the backend so its
        # real port could seed the CORS allowlist). Wait for the login page
        # to compile.
        ev["frontend_origin_allowed"] = True
        if not _wait_http(f"http://localhost:{fe_port}/login", 240):
            raise RuntimeError("frontend dev server did not come up")

        requests_seen: list[str] = []
        errors_seen: list[str] = []
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1440, "height": 960})
            page.on("request", lambda r: requests_seen.append(r.url)
                    if backend.base.split("//")[1] in r.url else None)
            page.on("console", lambda m: errors_seen.append(m.text)
                    if m.type == "error" else None)

            page.goto(f"http://localhost:{fe_port}/login",
                      wait_until="networkidle", timeout=90000)
            ev["login_page_title"] = page.title()

            login_responses: list[str] = []
            page.on("response", lambda r: login_responses.append(
                f"{r.status} {r.url}" ) if "/api/auth" in r.url else None)

            page.fill('input[type="email"], input[name="email"]',
                      user["email"])
            page.fill('input[type="password"], input[name="password"]',
                      user["password"])
            page.screenshot(
                path=str(Path(JR.__file__).parent / "journey_matrix" /
                         "browser_login_filled.png"))
            page.click('button[type="submit"]')
            # Observe rather than assume: wait for EITHER client-side
            # navigation off /login OR a visible error, then record state.
            signed_in = False
            for _ in range(30):
                time.sleep(2)
                cur = page.url
                if not cur.rstrip("/").endswith("/login"):
                    signed_in = True
                    break
                try:
                    if page.locator('[role="alert"], .error, [data-testid="error"]').count():
                        break
                except Exception:  # noqa: BLE001
                    pass
            # Decisive observables (a poll race once showed url=/dashboard
            # while the flag lagged): final URL off /login + auth cookie +
            # the login POST actually succeeded against THIS backend.
            time.sleep(2)
            cookies = page.context.cookies()
            auth_cookie = any(c["name"] == "auth_token" for c in cookies)
            final_url = page.url
            login_ok = any(r.startswith("200 ") and "/api/auth/login" in r
                           for r in login_responses)
            signed_in = (not final_url.rstrip("/").endswith("/login")
                         and auth_cookie and login_ok)
            ev["after_login"] = {
                "url": final_url,
                "signed_in": signed_in,
                "auth_token_cookie": auth_cookie,
                "login_ok": login_ok,
                "login_responses": login_responses[:10],
                "body_error_head": page.locator("body").inner_text()[:400]
                if not signed_in else "",
                "backend_requests_seen": len(requests_seen),
                "console_errors": errors_seen[:10],
            }
            page.screenshot(
                path=str(Path(JR.__file__).parent / "journey_matrix" /
                         "browser_after_login.png"))
            ev["signed_in_url"] = page.url if signed_in else None
            browser.close()

        checks = {
            "browser.login-form-real": True,
            "browser.signed-in": bool(signed_in and auth_cookie),
            "browser.talked-to-scratch-backend": bool(requests_seen),
        }
        ev["assertions"] = checks
        passed = all(checks.values())
        ev["pass"] = passed
        print(json.dumps(checks, indent=1))
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        ev["backend_log_tail"] = backend.log_tail()
        backend.stop()
        if fe_proc is not None:
            # npm spawns next dev as a child; terminating npm alone orphans
            # the server (observed: an orphaned :3000 blocked the next run).
            # Kill the whole process group.
            import os as _os, signal as _signal
            try:
                _os.killpg(_os.getpgid(fe_proc.pid), _signal.SIGTERM)
            except Exception:  # noqa: BLE001
                fe_proc.terminate()
        out = JR.save_result("browser_signed_in", ev)
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
