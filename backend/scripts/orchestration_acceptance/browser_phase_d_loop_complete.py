#!/usr/bin/env python3
"""Phase D — complete fresh-install browser loop (run 2, after the F3 fix).

Carries the Phase C-derived machinery in ``browser_phase_d_quickstart_loop.py``
(Capture, overlay handling, wizard walk, completion click, page_api, ownership
hardening) and drives the complete loop on the SAME fresh installation run 1
characterized (worktree at 68729ebe4, backend :18100 / frontend :18101,
isolated data):

  1. admin sign-in (documented README path) in its own context
  2. fresh product user (API-registered, mirroring the Phase C user creation)
  3. browser sign-in as that user, full onboarding wizard walk
     — with an in-trace readback right after "Enable Ollama" showing the
     provider left INACTIVE (finding F4, reproduced inside the loop trace)
  4. completion click ("Start Automating") + durable/API readbacks
  5. model configuration via Settings -> AI (the resolver-compatible UI path;
     F4 workaround, recorded) -> provider flips ACTIVE, verified in-page + API;
     falls back to an admin context if the fresh user is refused (recorded)
  6. upload the source through the real Documents UI + durable list readback
  7. chat: ask for the fact; settle on the DURABLE history assistant message
     (run-1 lesson: DOM text alone settled on a placeholder), verify the
     answer uses the uploaded source, capture the POST response + WS tail
  8. reload: the answer persists; a fresh dashboard load keeps onboarding
     completed and shows no wizard

Findings context: F1..F3 are install findings (INSTALL_FINDINGS.md); F4 is a
product defect (wizard key_name mismatch) reproduced here and worked around
via the settings UI — recorded, not hidden.
"""
from __future__ import annotations

import hashlib
import importlib.metadata as md
import json
import re
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parent))          # sibling machinery + journey_runtime
sys.path.insert(0, str(HERE.parents[2]))      # backend root

from browser_phase_d_quickstart_loop import (  # noqa: E402
    ADMIN_EMAIL, BACKEND, BE_BASE, CHAT_PROMPT,
    Capture, EVID_DIR, FE_BASE, FIXTURE, FIXTURE_TEXT, FRONTEND, FROZEN_SHA,
    PASSWORD_FILE, PINNED_BE_PORT, PINNED_FE_PORT, WT_ROOT,
    _http_json, _now, _truncate, _wait_http,
    body_text, completion_click, db_read, do_login, latest_assistant_text,
    overlay_of, ownership_check, page_api, storage_snapshot, walk_wizard,
)

import journey_runtime as JR  # noqa: E402


def _ollama_fields(prov_payload: dict):
    """Trim the /api/ai/providers payload to the ollama status fields."""
    try:
        body = (prov_payload or {}).get("body") or {}
        providers = ((body.get("data") or {}).get("providers") or [])
        for p in providers:
            if (p.get("provider") or {}).get("id") == "ollama":
                return {"has_api_keys": p.get("has_api_keys"),
                        "has_tenant_key": p.get("has_tenant_key"),
                        "status": p.get("status")}
        return {"provider_found": False, "count": len(providers)}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def _settings_configure(page, cap: Capture, shot_name: str) -> dict:
    """Configure the Ollama key via the Settings -> AI UI (browser-only)."""
    leg: dict = {}
    page.goto(f"{FE_BASE}/settings/ai", wait_until="domcontentloaded",
              timeout=240000)
    page.wait_for_timeout(4000)
    try:
        page.wait_for_selector("h2:has-text('AI Provider Settings')",
                               timeout=120000)
        leg["settings_page_loaded"] = True
    except Exception as exc:  # noqa: BLE001
        leg["settings_page_loaded"] = False
        leg["settings_page_error"] = f"{type(exc).__name__}"
    card = page.locator(".provider-card").filter(has_text="Ollama")
    leg["ollama_card_found"] = card.count() > 0
    if leg["ollama_card_found"]:
        card = card.first
        try:
            leg["badge_before"] = card.locator(".status-badge").first.inner_text(
                timeout=5000).strip()
        except Exception:  # noqa: BLE001
            leg["badge_before"] = None
        try:
            card.get_by_role("button", name="Update Key").click(timeout=8000)
            page.wait_for_timeout(600)
        except Exception:  # noqa: BLE001
            pass
        try:
            card.locator("input.key-input").first.fill("ollama-local-no-key-required")
            card.get_by_role("button", name="Save Key").click(timeout=15000)
        except Exception as exc:  # noqa: BLE001
            leg["save_error"] = f"{type(exc).__name__}: {exc}"
        badge = ""
        deadline = time.monotonic() + 90
        while time.monotonic() < deadline:
            try:
                badge = card.locator(".status-badge").first.inner_text(
                    timeout=3000).strip()
            except Exception:  # noqa: BLE001
                badge = ""
            if "Working" in badge or "Failed" in badge:
                break
            page.wait_for_timeout(2000)
        leg["badge_after"] = badge
        try:
            leg["card_class_after"] = card.get_attribute("class", timeout=3000)
        except Exception:  # noqa: BLE001
            pass
    leg["save_requests"] = cap.requests_to("/api/ai/providers/ollama/keys", "POST")
    leg["save_responses"] = cap.responses_to("/api/ai/providers/ollama/keys")
    leg["ollama_after"] = _ollama_fields(page_api(page, "/api/ai/providers"))
    try:
        page.screenshot(path=str(EVID_DIR / shot_name))
    except Exception:  # noqa: BLE001
        pass
    return leg


def main() -> int:
    from playwright.sync_api import sync_playwright

    EVID_DIR.mkdir(parents=True, exist_ok=True)
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE.write_text(FIXTURE_TEXT)

    ev: dict = {
        "journey": "phase-d-fresh-install-complete-loop",
        "phase": "D-pristine-install-run2",
        "run": 2,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "harness": {"file": str(HERE),
                    "sha256": hashlib.sha256(HERE.read_bytes()).hexdigest(),
                    "carries": "browser_phase_d_quickstart_loop.py (Phase C machinery)"},
        "frozen_candidate": FROZEN_SHA,
        "worktree": str(WT_ROOT),
        "context": ("run 1 (browser_quickstart_loop_20261017_101746.json) failed the "
                    "loop at upload (F3, fixed: pyarrow==25.0.1) and at the first "
                    "chat answer (F4, product defect: wizard stores key_name "
                    "'Ollama (local)' which the resolver cannot read; workaround "
                    "shown here via Settings -> AI, which posts key_name=default)."),
        "versions": {},
    }
    for pkg in ("pyarrow", "numpy", "lancedb", "playwright"):
        try:
            ev["versions"][pkg] = md.version(pkg)
        except Exception:  # noqa: BLE001
            ev["versions"][pkg] = None

    browser = None
    passed = False
    try:
        # ---- preflight ---------------------------------------------------
        if not _wait_http(f"{BE_BASE}/health", 60):
            raise RuntimeError("backend did not answer /health")
        health = _http_json(f"{BE_BASE}/health")
        ident = (health.get("body") or {}).get("identity") or {}
        ev["backend_health_identity"] = ident
        ev["backend_ownership"] = ownership_check(PINNED_BE_PORT, str(BACKEND), "attach")
        if not _wait_http(FE_BASE, 240):
            raise RuntimeError("frontend did not come up")
        ev["frontend_ownership"] = ownership_check(PINNED_FE_PORT, str(FRONTEND), "attach")
        db_path_raw = str(ident.get("database") or "")
        db_path = (db_path_raw if db_path_raw.startswith("/")
                   else str(Path(str(ident.get("cwd") or BACKEND)) / db_path_raw))
        ev["db_path"] = db_path
        ev["db_path_inside_worktree"] = db_path.startswith(str(WT_ROOT))
        ev["db_before"] = db_read(db_path)

        user = JR.new_user(BE_BASE)
        ev["product_user"] = {"registered": bool(user.get("registered")),
                              "register_http": user.get("register_http"),
                              "email": user.get("email"),
                              "id": user.get("id")}
        if not ev["product_user"]["registered"]:
            raise RuntimeError(f"product user registration failed: {user}")
        uid = user.get("id")

        admin_password = PASSWORD_FILE.read_text().strip()
        ev["admin_credentials"] = {"email": ADMIN_EMAIL,
                                   "password_file": str(PASSWORD_FILE),
                                   "password_present": bool(admin_password),
                                   "password": "<redacted>"}

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ev["browser_version"] = browser.version

            # ---- 1. documented admin sign-in -----------------------------
            a: dict = {}
            ctxA = browser.new_context(viewport={"width": 1440, "height": 960})
            pageA = ctxA.new_page()
            capA = Capture(pageA, BE_BASE)
            a["login"] = do_login(pageA, {"email": ADMIN_EMAIL,
                                          "password": admin_password})
            a["login_observed"] = bool(capA.requests_to("/api/auth/login", "POST"))
            a["login_200"] = any(r.get("status") == 200
                                 for r in capA.responses_to("/api/auth/login"))
            a["overlay_present_after_login"] = overlay_of(pageA)[0] is not None
            a["onboarding_status"] = page_api(pageA, "/api/onboarding/status")
            try:
                pageA.screenshot(path=str(EVID_DIR / "phase_d_run2_admin_signed_in.png"))
            except Exception:  # noqa: BLE001
                pass
            ev["admin_signin"] = a

            # ---- 2..3. fresh user sign-in + wizard -----------------------
            ctxB = browser.new_context(viewport={"width": 1440, "height": 960})
            page = ctxB.new_page()
            cap = Capture(page, BE_BASE)
            s: dict = {}
            s["login"] = do_login(page, {"email": user["email"],
                                         "password": user["password"]})
            s["login_200"] = any(r.get("status") == 200
                                 for r in cap.responses_to("/api/auth/login"))
            try:
                page.screenshot(path=str(EVID_DIR / "phase_d_run2_user_signed_in.png"))
            except Exception:  # noqa: BLE001
                pass
            s["frontend_ownership_login"] = ownership_check(
                PINNED_FE_PORT, str(FRONTEND), "after_login")
            s["wizard"] = walk_wizard(page, {})

            # F4 in-trace: what did "Enable Ollama" actually leave behind?
            ollama_after_wizard = _ollama_fields(page_api(page, "/api/ai/providers"))
            s["provider_after_wizard_enable"] = {"ollama": ollama_after_wizard}
            s["wizard_enable_left_provider_inactive"] = bool(
                ollama_after_wizard
                and not ollama_after_wizard.get("has_tenant_key")
                and not ollama_after_wizard.get("has_api_keys")
                and ollama_after_wizard.get("status") != "active")

            # ---- 4. completion click --------------------------------------
            ready_node, _kind = overlay_of(page)
            s["frontend_ownership_before_click"] = ownership_check(
                PINNED_FE_PORT, str(FRONTEND), "before_click")
            s["completion"] = completion_click(page, ready_node, cap, {})
            s["post_click"] = {"status_api": page_api(page, "/api/onboarding/status"),
                               "db": db_read(db_path, email=user["email"]),
                               "storage": storage_snapshot(page)}

            # ---- 5. model config via Settings -> AI (F4 workaround) -------
            sl: dict = {"fresh_user_attempt": _settings_configure(
                page, cap, "phase_d_run2_settings_ollama.png")}
            if (sl["fresh_user_attempt"].get("ollama_after") or {}).get("status") != "active":
                sl["admin_fallback"] = {
                    "admin_login": do_login(pageA, {"email": ADMIN_EMAIL,
                                                    "password": admin_password}),
                    "attempt": _settings_configure(
                        pageA, capA, "phase_d_run2_settings_ollama_admin.png"),
                }
            sl["final_readback"] = _ollama_fields(page_api(page, "/api/ai/providers"))
            if (sl.get("final_readback") or {}).get("status") == "active":
                sl["configured_in"] = (
                    "fresh-user-context"
                    if (sl["fresh_user_attempt"].get("ollama_after") or {}).get("status") == "active"
                    else "admin-context")
            s["settings_model_config"] = sl

            # ---- 6. upload the source via the Documents UI ----------------
            up: dict = {}
            page.goto(f"{FE_BASE}/documents", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(4000)
            up["file_input_found"] = page.locator("#file-upload").count() > 0
            if up["file_input_found"]:
                page.set_input_files("#file-upload", str(FIXTURE))
                deadline = time.monotonic() + 240
                while time.monotonic() < deadline:
                    text = body_text(page)
                    if "Successfully uploaded" in text or "uploaded successfully" in text.lower():
                        up["success_text_seen"] = True
                        break
                    if any(r.get("status", 0) >= 400
                           for r in cap.responses_to("/api/documents/upload")):
                        break
                    page.wait_for_timeout(1000)
            up["upload_requests"] = cap.requests_to("/api/documents/upload", "POST")
            up["upload_responses"] = cap.responses_to("/api/documents/upload")
            up["documents_list"] = page_api(page, "/api/documents")
            try:
                body = up["documents_list"].get("body")
                items = body.get("documents") if isinstance(body, dict) else body
                up["fixture_in_list"] = any(
                    "zephyr" in json.dumps(it).lower() for it in (items or []))
            except Exception:  # noqa: BLE001
                up["fixture_in_list"] = None
            try:
                page.screenshot(path=str(EVID_DIR / "phase_d_run2_documents_uploaded.png"))
            except Exception:  # noqa: BLE001
                pass
            s["upload"] = up

            # ---- 7. chat: durable settle + attributed answer --------------
            ch: dict = {}
            page.goto(f"{FE_BASE}/chat", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(3000)
            input_box = page.locator('[data-testid="agent-chat-input"]')
            deadline = time.monotonic() + 240
            while time.monotonic() < deadline and not input_box.count():
                page.wait_for_timeout(1000)
            ch["input_found"] = input_box.count() > 0
            ch["answer_contains_fact"] = False
            ch["history_contains_fact"] = False
            last_content = ""
            history_msgs: list = []
            sid = None
            if ch["input_found"]:
                input_box.first.fill(CHAT_PROMPT)
                page.click('[data-testid="send-message-button"]')
                ch["sent_at"] = _now()
                deadline = time.monotonic() + 420
                stable_polls = 0
                while time.monotonic() < deadline:
                    st = storage_snapshot(page)
                    sid = st.get("chat_session") or sid
                    if not sid:
                        for r in cap.requests_to("/api/chat/message", "POST"):
                            m = re.search(r'"session_id"\s*:\s*"(sess[^"]+)"',
                                          str(r.get("post_data") or ""))
                            if m:
                                sid = m.group(1)
                                break
                    if sid:
                        h = page_api(page, f"/api/chat/history/{sid}"
                                     + (f"?user_id={uid}" if uid else ""))
                        ch["last_history_status"] = h.get("status")
                        body = h.get("body") or {}
                        history_msgs = (body.get("messages")
                                        if isinstance(body, dict) else body) or []
                        assistant = [m for m in history_msgs
                                     if str(m.get("role")) == "assistant"]
                        content = str(assistant[-1].get("content") or "") if assistant else ""
                        if len(content.strip()) >= 8 and content == last_content:
                            stable_polls += 1
                            if stable_polls >= 2:
                                break
                        else:
                            stable_polls = 0
                            last_content = content
                    page.wait_for_timeout(4000)
                # one settling re-read: prefer the newest durable content
                page.wait_for_timeout(6000)
                if sid:
                    h2 = page_api(page, f"/api/chat/history/{sid}"
                                  + (f"?user_id={uid}" if uid else ""))
                    body2 = h2.get("body") or {}
                    msgs2 = (body2.get("messages")
                             if isinstance(body2, dict) else body2) or []
                    if msgs2:
                        history_msgs = msgs2
                        assistant2 = [m for m in history_msgs
                                      if str(m.get("role")) == "assistant"]
                        if assistant2:
                            last_content = str(assistant2[-1].get("content") or "")
                ch["session_id"] = sid
                ch["history_msgs_count"] = len(history_msgs)
                ch["assistant_text_dom"] = _truncate(latest_assistant_text(page), 1500)
                ch["answer_text_from_history"] = _truncate(last_content, 1500)
                blob = (last_content + " " + str(ch.get("assistant_text_dom") or "")).lower()
                ch["answer_contains_fact"] = "quartz-77" in blob
                ch["history_contains_fact"] = any(
                    "quartz-77" in json.dumps(m).lower() for m in history_msgs)
                ch["waited_seconds"] = round(_now() - ch["sent_at"], 1)
            ch["message_requests"] = cap.requests_to("/api/chat/message", "POST")
            ch["message_responses"] = cap.responses_to("/api/chat/message")
            ch["ws_tail"] = cap.websockets[-3:]
            ch["storage"] = storage_snapshot(page)
            try:
                page.screenshot(path=str(EVID_DIR / "phase_d_run2_chat_answer.png"))
            except Exception:  # noqa: BLE001
                pass
            s["chat"] = ch

            # ---- 8. reload persistence ------------------------------------
            rl: dict = {}
            page.reload(wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(9000)
            rl["chat_text_after_reload"] = _truncate(latest_assistant_text(page), 800)
            rl["fact_persists_after_reload"] = (
                "quartz-77" in str(rl["chat_text_after_reload"] or "").lower()
                or "quartz-77" in body_text(page).lower())
            rl["wizard_present_after_reload"] = overlay_of(page)[0] is not None
            try:
                page.screenshot(path=str(EVID_DIR / "phase_d_run2_after_reload.png"))
            except Exception:  # noqa: BLE001
                pass
            cap2 = Capture(page, BE_BASE)
            page.goto(f"{FE_BASE}/dashboard", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(9000)
            rl["wizard_present_after_dashboard_load"] = overlay_of(page)[0] is not None
            host_fetches = [r for r in cap2.responses
                            if "/api/onboarding/status" in str(r.get("url"))]
            rl["host_status_fetches"] = host_fetches
            rl["host_fetch_shows_completed"] = any(
                r.get("status") == 200
                and '"onboarding_completed":true' in str(r.get("body_head") or "")
                for r in host_fetches)
            rl["status_api"] = page_api(page, "/api/onboarding/status")
            rl["db"] = db_read(db_path, email=user["email"])
            rl["frontend_ownership_end"] = ownership_check(
                PINNED_FE_PORT, str(FRONTEND), "end")
            rl["backend_ownership_end"] = ownership_check(
                PINNED_BE_PORT, str(BACKEND), "end")
            rl["console_tail"] = cap2.summary(since=0)["console"][-15:]
            s["reload"] = rl

            ev["session"] = s
            ev["console_tail"] = cap.summary(since=0)["console"][-25:]
            ev["page_errors"] = cap.summary(since=0)["page_errors"]
            ctxA.close()
            ctxB.close()

        # ---- assertions ---------------------------------------------------
        s = ev.get("session") or {}
        completion = s.get("completion") or {}
        post_click = s.get("post_click") or {}
        upload = s.get("upload") or {}
        chat = s.get("chat") or {}
        settings_leg = s.get("settings_model_config") or {}
        reload_leg = s.get("reload") or {}
        served_commit_ok = str(ident.get("git_commit") or "").startswith(FROZEN_SHA[:12])

        checks = {
            "candidate-identity-served": bool(served_commit_ok),
            "backend-owned-by-worktree": bool(
                (ev.get("backend_ownership") or {}).get("owned_by_worktree")
                and str(ident.get("cwd") or "").startswith(str(BACKEND))),
            "frontend-owned-by-worktree": bool(
                (ev.get("frontend_ownership") or {}).get("owned_by_worktree")),
            "fresh-isolated-data": bool(ev.get("db_path_inside_worktree")),
            "admin-signin": bool(
                (ev.get("admin_signin") or {}).get("login", {}).get("signed_in")
                and (ev.get("admin_signin") or {}).get("login_200")),
            "product-user-registered": bool(
                (ev.get("product_user") or {}).get("registered")),
            "fresh-user-signin": bool(s.get("login", {}).get("signed_in")
                                      and s.get("login_200")),
            "wizard-present": bool(
                s.get("wizard", {}).get("overlay_discovered", {}).get("found")),
            "wizard-enable-clicked": bool(
                s.get("wizard", {}).get("connect", {}).get("enable_clicked")),
            "wizard-enable-left-provider-inactive": bool(
                s.get("wizard_enable_left_provider_inactive")),
            "completion-request-emitted": bool(
                completion.get("update_requests_after_click")),
            "completion-persisted": bool((post_click.get("db") or {}).get("completed")),
            "completion-overlay-closed": bool(completion.get("overlay_closed_at")),
            "settings-ai-configured-provider": bool(
                (settings_leg.get("final_readback") or {}).get("status") == "active"
                and (settings_leg.get("final_readback") or {}).get("has_tenant_key")),
            "upload-succeeded": bool(any(
                r.get("status") == 200 for r in (upload.get("upload_responses") or []))),
            "upload-durable": bool(upload.get("fixture_in_list")),
            "chat-answer-received": bool(
                chat.get("input_found") and chat.get("history_msgs_count")
                and any(r.get("status") == 200
                        for r in (chat.get("message_responses") or []))),
            "answer-uses-uploaded-source": bool(chat.get("answer_contains_fact")),
            "answer-durable-in-history": bool(chat.get("history_contains_fact")),
            "reload-chat-persists": bool(reload_leg.get("fact_persists_after_reload")),
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
        print(f"ERROR: {ev['error']}")
    finally:
        ev["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())
        if browser is not None:
            try:
                browser.close()
            except Exception:  # noqa: BLE001
                pass
        out = EVID_DIR / f"browser_complete_loop_{time.strftime('%Y%m%d_%H%M%S')}.json"
        out.write_text(json.dumps(ev, indent=1))
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
