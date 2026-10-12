#!/usr/bin/env python3
"""J2 signed-in browser chain — configure/connect → request → result → reload.

Extends the J1 login-only browser evidence with the smallest chain the
acceptance contract requires for a setup journey, driven through the REAL
frontend against the scratch backend:

  1. login through the real form (carried over from browser_signed_in.py);
  2. CONFIGURE/CONNECT: /settings/local-models → Add Provider → Register
     (the UI's own calls), then Discover (live model list rendered);
  3. REQUEST: /chat composer → send a provider-shaped ask;
  4. RESULT: whichever outcome actually renders (a provider-served reply
     or the product's refusal text) is recorded — a refusal is NOT a
     result and the chain reports it as such;
  5. RELOAD: page reload, then record whether the conversation survives.

Each leg's observed outcome is recorded separately so a partial chain is
scoreable. Network requests to the backend are captured per leg.
"""
from __future__ import annotations

import json
import os
import re
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402

FRONTEND = JR.REPO / "frontend-nextjs"
MODEL = "llama3.1:8b"


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

    ev: dict = {"journey": "browser-j2-chain", "model": MODEL,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    backend_port = _free_port()
    fe_env = dict(os.environ)
    fe_env.update({"NEXT_PUBLIC_API_URL": f"http://127.0.0.1:{backend_port}",
                   "NODE_ENV": "development"})
    fe_proc, fe_port = _start_frontend(fe_env)
    ev["ports"] = {"backend_chosen": backend_port, "frontend": fe_port}

    backend = JR.ScratchServer(
        "browser_j2_chain", preferred_port=backend_port,
        extra_env={"ATOM_LOCAL_ONLY": "true",
                   "OLLAMA_BASE_URL": "http://localhost:11434/v1",
                   "OLLAMA_MODEL": MODEL,
                   "ADDITIONAL_ALLOWED_ORIGINS":
                       f"http://localhost:{fe_port},"
                       f"http://127.0.0.1:{fe_port}"})
    shots = Path(JR.__file__).parent / "journey_matrix"
    passed = False
    try:
        boot = backend.up()
        ev["backend_boot"] = boot
        if not boot.get("booted"):
            raise RuntimeError("backend failed to boot")
        user = JR.new_user(backend.base)
        if not user.get("token"):
            raise RuntimeError("fresh user registration failed")

        if not _wait_http(f"http://localhost:{fe_port}/login", 240):
            raise RuntimeError("frontend did not come up")

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1440, "height": 960})
            api_calls: list[str] = []
            btag = backend.base.split("//")[1]
            page.on("request", lambda r: api_calls.append(r.url)
                    if btag in r.url else None)

            # --- leg 1: signed-in -------------------------------------------
            page.goto(f"http://localhost:{fe_port}/login",
                      wait_until="networkidle", timeout=120000)
            login_responses: list[str] = []
            page.on("response", lambda r: login_responses.append(
                f"{r.status} {r.url}") if "/api/auth" in r.url else None)
            page.fill('input[type="email"], input[name="email"]',
                      user["email"])
            page.fill('input[type="password"], input[name="password"]',
                      user["password"])
            page.click('button[type="submit"]')
            # First-visit pages compile on demand; poll up to ~90s.
            for _ in range(45):
                time.sleep(2)
                if not page.url.rstrip("/").endswith("/login"):
                    break
            time.sleep(2)
            cookies = {c["name"] for c in page.context.cookies()}
            login_ok = any(r.startswith("200 ") and "/api/auth/login" in r
                           for r in login_responses)
            signed_in = (not page.url.rstrip("/").endswith("/login")
                         and "auth_token" in cookies and login_ok)
            ev["leg1_signin"] = {"url": page.url, "signed_in": signed_in,
                                 "auth_cookie": "auth_token" in cookies,
                                 "login_ok": login_ok}

            # The product's own first-run configure/connect surface: the
            # onboarding wizard (Welcome → Profile → Connect → Ready).
            # Drive it to completion like a user — its Connect step
            # ("Enable Ollama") is the ADVERTISED no-key provider setup.
            wiz: dict = {}
            overlay = page.locator("div.fixed.inset-0.z-50")
            if overlay.count() and "Welcome to Atom" in overlay.first.inner_text():
                wiz["present"] = True
                def _click(name, timeout=20000):
                    overlay.first.get_by_role("button", name=name).first.click(
                        timeout=timeout)
                try:
                    _click("Next")                       # Welcome → Profile
                    page.wait_for_timeout(800)
                    role = overlay.first.locator("#role")
                    if role.count():
                        role.fill("acceptance")
                    goal = overlay.first.locator("#goal")
                    if goal.count():
                        goal.fill("journey verification")
                    _click("Next")                       # Profile → Connect
                    # Connect step: wait for the Ollama probe to resolve.
                    enable = overlay.first.get_by_role(
                        "button", name="Enable Ollama")
                    for _ in range(30):
                        if enable.count():
                            break
                        time.sleep(1)
                    wiz["ollama_detected"] = enable.count() > 0
                    if wiz["ollama_detected"]:
                        enable.click()
                        page.wait_for_timeout(2500)
                        wiz["enable_clicked"] = True
                    # Enabling auto-advances to Ready: "Next" may no longer
                    # exist (the footer button becomes "Start Automating").
                    page.wait_for_timeout(500)
                    if (overlay.first.get_by_role("button", name="Next")
                            .count()):
                        _click("Next")
                        page.wait_for_timeout(500)
                    start = overlay.first.get_by_role(
                        "button", name="Start Automating")
                    if start.count():
                        start.first.click(timeout=20000)
                        page.wait_for_timeout(6000)
                        if page.locator(
                                "div.fixed.inset-0.z-50").count():
                            # One recorded retry — a silent completion
                            # failure is a product observable, a single
                            # missed click is not; both are kept.
                            wiz["start_click_retried"] = True
                            start.first.click(timeout=20000)
                            page.wait_for_timeout(6000)
                    wiz["completed"] = (
                        page.locator("div.fixed.inset-0.z-50").count() == 0)
                    if not wiz["completed"]:
                        wiz["post_start_overlay_text"] = (
                            overlay.first.inner_text()[:300])
                except Exception as exc:  # noqa: BLE001
                    wiz["error"] = f"{type(exc).__name__}: {exc}"
                    wiz["overlay_text"] = overlay.first.inner_text()[:300]
            else:
                wiz["present"] = False
            ev["leg1b_onboarding_wizard"] = wiz
            page.screenshot(path=str(shots / "j2chain_1_signed_in.png"))

            # --- leg 2: configure/connect — completed by the wizard above --
            leg2: dict = {
                "ok": bool(wiz.get("completed") and wiz.get("enable_clicked")),
                "path": "onboarding wizard Connect step (Enable Ollama) — "
                        "the advertised first-run provider setup",
                "wizard": wiz,
            }
            ev["leg2_configure_connect"] = leg2
            page.screenshot(path=str(shots / "j2chain_2_provider.png"))

            # --- leg 3+4: request and observed result ------------------------
            leg34: dict = {}
            try:
                # domcontentloaded: the app keeps a websocket open, so
                # networkidle never settles (observed: 120s goto timeouts).
                page.goto(f"http://localhost:{fe_port}/chat",
                          wait_until="domcontentloaded", timeout=120000)
                inp = page.locator('[data-testid="agent-chat-input"]')
                inp.wait_for(state="visible", timeout=60000)
                inp.fill("Reply with exactly: PONG")
                page.locator('[data-testid="send-message-button"]').click(
                    timeout=20000)
                refusal_or_reply = None
                for _ in range(90):  # up to 3 min
                    time.sleep(2)
                    body = page.locator("body").inner_text()
                    if "You need an AI provider" in body:
                        refusal_or_reply = "refusal_no_llm_provider"
                        break
                    if "PONG" in body:
                        # the echo of our own message also contains PONG;
                        # require it twice (sent + received) or in a later
                        # element — crude but recorded as observed.
                        if body.count("PONG") >= 2:
                            refusal_or_reply = "reply_rendered"
                            break
                leg34["observed"] = refusal_or_reply or "timeout_no_change"
                leg34["chat_requests_to_backend"] = len(api_calls)
            except Exception as exc:  # noqa: BLE001
                leg34["observed"] = "error"
                leg34["error"] = f"{type(exc).__name__}: {exc}"
            ev["leg3_4_request_result"] = leg34
            page.screenshot(path=str(shots / "j2chain_3_result.png"))

            # --- leg 5: reload ------------------------------------------------
            leg5: dict = {}
            try:
                # domcontentloaded, not networkidle: the chat page holds a
                # websocket, so networkidle never fires (first chain run
                # timed out on it).
                page.reload(wait_until="domcontentloaded", timeout=120000)
                page.wait_for_timeout(6000)
                body = page.locator("body").inner_text()
                leg5["url_after_reload"] = page.url
                leg5["conversation_persisted"] = (
                    "Reply with exactly: PONG" in body
                    or leg34.get("observed") == "reply_rendered"
                    and "PONG" in body)
                leg5["still_signed_in"] = (
                    "auth_token" in {c["name"] for c in
                                     page.context.cookies()})
            except Exception as exc:  # noqa: BLE001
                leg5["error"] = f"{type(exc).__name__}: {exc}"
            ev["leg5_reload"] = leg5
            page.screenshot(path=str(shots / "j2chain_4_reload.png"))
            browser.close()

        checks = {
            "browser.signin": bool(ev["leg1_signin"]["signed_in"]),
            "browser.configure-connect": bool(leg2.get("ok")),
            # A refusal is NOT a result: this check is true only when a
            # provider-served reply actually rendered.
            "browser.request-result": leg34.get("observed") == "reply_rendered",
            "browser.reload": bool(leg5.get("still_signed_in")),
        }
        ev["assertions"] = checks
        ev["observed_outcome"] = {
            "configure_connect": "complete" if checks["browser.configure-connect"] else "failed",
            "request_result": {"reply_rendered": "complete",
                               "refusal_no_llm_provider": "refused",
                               "timeout_no_change": "no_result"}.get(
                                   leg34.get("observed"), "failed"),
        }
        passed = all(checks.values())
        ev["pass"] = passed
        print(json.dumps({"assertions": checks,
                          "outcome": ev["observed_outcome"]}, indent=1))
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        ev["backend_log_tail"] = backend.log_tail()
        backend.stop()
        try:
            os.killpg(os.getpgid(fe_proc.pid), signal.SIGTERM)
        except Exception:  # noqa: BLE001
            fe_proc.terminate()
        out = JR.save_result("browser_j2_chain", ev)
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
