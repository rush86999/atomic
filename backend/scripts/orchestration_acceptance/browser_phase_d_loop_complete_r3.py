#!/usr/bin/env python3
"""Phase D — complete fresh-install browser loop, run 3 (cloud BYOK world).

Carries the Phase C-derived machinery in ``browser_phase_d_quickstart_loop.py``
(Capture, overlay handling, completion click, page_api, ownership hardening).
Same frozen candidate + same isolated installation as runs 1-2, with the
owner-directed effective-config change (2026-10-17: "use opencode go keys or
deepseek keys for testing byok"):

  * ``ATOM_LOCAL_ONLY=false`` (F5 — with local-only true the agent/planning
    legs starve the ollama route: planning ranks "0 candidates" and the
    fallback walk raises "No dispatchable LLM route", so grounded turns end
    in the ``no_llm_provider`` sentinel even though the plain chat leg streams
    from ollama in the SAME turn; see INSTALL_FINDINGS F5).
  * ``OPENCODE_API_KEY`` present (the quickstart's RECOMMENDED option) and
    ``OPENCODE_BASE_URL=https://opencode.ai/zen/go/v1``.

Loop, in the browser:
  1. admin sign-in (documented README path), own context
  2. fresh product user (API-registered)
  3. browser sign-in + wizard walk: Card B "Enter an API key" with provider
     ``opencode-go`` and the operator's Go key (BYOK through the product).
     In-trace readback right after the save is expected to show the provider
     still INACTIVE — the wizard stores key_name ``'<provider> (onboarding)'``,
     invisible to the default-name resolver (F4, now shown for a CLOUD
     provider; run 2 showed it for Ollama).
  4. completion click + durable/API readbacks
  5. model configuration via Settings -> AI (``?key_name=default`` — the
     resolver-compatible path, F4 workaround): readback must flip ACTIVE
  6. upload the source via the Documents UI + durable list readback
     (run-2 fix: /api/documents payload is {success, data: [...]})
  7. chat: ask for the fact; settle on the DURABLE history assistant message;
     ONE retry if the turn is a non-answer (sentinel / "unusable output");
     provider attribution via /api/ai/usage/calls (opencode-go call after the
     turn started)
  8. reload: the answer persists; dashboard load keeps onboarding completed
     and shows no wizard (run-2 fix: assert on status API + DB + overlay,
     not on a host-fetch capture window)

Evidence is scrubbed at write time: the Go key, JWTs and Bearer values never
land in the JSON.
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
    overlay_of, overlay_text, ownership_check, page_api, storage_snapshot,
    wait_for_overlay, walk_wizard,
)

import journey_runtime as JR  # noqa: E402

PROVIDER = "opencode-go"
OPENCODE_KEY_STORE = Path.home() / ".local/share/opencode/auth.json"
NON_ANSWER_MARKERS = (
    "unusable output",
    "you need an ai provider",
    "no eligible llm provider",
    "could not complete the request",
)


def _load_go_key() -> str:
    """Operator OpenCode Go key (never printed / never written to evidence)."""
    try:
        doc = json.loads(OPENCODE_KEY_STORE.read_text())
        key = (doc.get(PROVIDER) or {}).get("key") or ""
        return key if isinstance(key, str) else ""
    except Exception:  # noqa: BLE001
        return ""


def _provider_fields(prov_payload: dict, provider_id: str) -> dict:
    """Trim /api/ai/providers to one provider's status fields."""
    try:
        body = (prov_payload or {}).get("body") or {}
        providers = ((body.get("data") or {}).get("providers") or [])
        for p in providers:
            if (p.get("provider") or {}).get("id") == provider_id:
                return {"has_api_keys": p.get("has_api_keys"),
                        "has_tenant_key": p.get("has_tenant_key"),
                        "status": p.get("status")}
        return {"provider_found": False, "count": len(providers)}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}


def _non_answer_reason(text: str) -> str | None:
    low = str(text or "").lower()
    for marker in NON_ANSWER_MARKERS:
        if marker in low:
            return marker
    return None


def _msg_text(m: dict) -> str:
    """Delivered text of one history row (response.message is the field the
    product's own readers use; fall back to content)."""
    return str(((m.get("response") or {}).get("message"))
               or m.get("content") or "")


def walk_wizard_r3(page, leg: dict, key: str) -> dict:
    """Wizard walk with the provider step taken via Card B (cloud BYOK)."""
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
    page.wait_for_timeout(1500)

    connect: dict = {"card_b_found": False, "provider_selected": None,
                     "save_clicked": False, "save_result": None,
                     "advanced_to_ready": False}
    sel = node.locator("select")
    if sel.count():
        connect["card_b_found"] = True
        # the options load from an async /api/ai/providers fetch — wait for id
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            try:
                opts = sel.first.locator("option").evaluate_all(
                    "els => els.map(e => e.value)")
            except Exception:  # noqa: BLE001
                opts = []
            if PROVIDER in opts:
                break
            page.wait_for_timeout(1000)
        try:
            connect["provider_options"] = sel.first.locator(
                "option").all_inner_texts()
        except Exception:  # noqa: BLE001
            connect["provider_options"] = None
        try:
            sel.first.select_option(PROVIDER)
            connect["provider_selected"] = PROVIDER
        except Exception as exc:  # noqa: BLE001
            connect["select_error"] = f"{type(exc).__name__}: {exc}"
    pw = node.locator('input[type="password"]')
    connect["password_input_found"] = pw.count() > 0
    if pw.count() and connect.get("provider_selected"):
        pw.first.fill(key)
        save = node.get_by_role("button", name="Save key & continue")
        connect["save_button_found"] = bool(save.count())
        if save.count():
            save.first.click(timeout=20000)
            connect["save_clicked"] = True

    deadline = time.monotonic() + 120
    while time.monotonic() < deadline:
        txt = body_text(page)
        if connect["save_result"] is None:
            if "API key saved" in txt:
                connect["save_result"] = "saved"
            elif "Failed to save key" in txt:
                connect["save_result"] = "failed"
        if "You're Ready" in txt or \
                node.get_by_role("button", name="Start Automating").count():
            connect["advanced_to_ready"] = True
            if connect["save_result"] is not None:
                break
        page.wait_for_timeout(1000)
    if not connect["advanced_to_ready"]:
        try:
            node.get_by_role("button", name="Next").first.click(timeout=15000)
            connect["advanced_via_next"] = True
            page.wait_for_timeout(1500)
        except Exception as exc:  # noqa: BLE001
            connect["advance_error"] = f"{type(exc).__name__}: {exc}"
        connect["advanced_to_ready"] = (
            "You're Ready" in body_text(page)
            or node.get_by_role("button", name="Start Automating").count() > 0)
    leg["connect"] = connect
    leg["overlay_text_at_ready"] = overlay_text(node)
    return leg


def _settings_configure_r3(page, cap: Capture, shot_name: str, key: str) -> dict:
    """Store the Go key via Settings -> AI (the key_name=default shape)."""
    leg: dict = {}
    leg_start = _now()
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
    card = page.locator(".provider-card").filter(has_text="OpenCode Go")
    leg["card_found"] = card.count() > 0
    if leg["card_found"]:
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
            card.locator("input.key-input").first.fill(key)
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
    leg["save_requests_since"] = [
        r for r in cap.requests_to(f"/api/ai/providers/{PROVIDER}/keys", "POST")
        if r.get("t", 0) >= leg_start]
    leg["save_responses_since"] = [
        r for r in cap.responses_to(f"/api/ai/providers/{PROVIDER}/keys")
        if r.get("t", 0) >= leg_start]
    leg["key_name_default_in_save"] = any(
        "key_name=default" in str(r.get("url"))
        for r in leg["save_requests_since"])
    leg["provider_after"] = _provider_fields(
        page_api(page, "/api/ai/providers"), PROVIDER)
    try:
        page.screenshot(path=str(EVID_DIR / shot_name))
    except Exception:  # noqa: BLE001
        pass
    return leg


def _run_chat_turn(page, cap: Capture, uid, message: str) -> dict:
    leg: dict = {"prompt": message, "sent_at": _now()}
    input_box = page.locator('[data-testid="agent-chat-input"]')
    input_box.first.fill(message)
    page.click('[data-testid="send-message-button"]')
    sid = None
    last_content = ""
    last_dom = ""
    dom_stable = 0
    history_msgs: list = []
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
            leg["last_history_status"] = h.get("status")
            body = h.get("body") or {}
            history_msgs = (body.get("messages")
                            if isinstance(body, dict) else body) or []
            assistant = [m for m in history_msgs
                         if str(m.get("role")) == "assistant"]
            content = _msg_text(assistant[-1]) if assistant else ""
            dom = latest_assistant_text(page)
            if dom == last_dom and dom.strip():
                dom_stable += 1
            else:
                dom_stable = 0
                last_dom = dom
            if content.strip() and content == last_content:
                stable_polls += 1
                if stable_polls >= 2:
                    break
            else:
                stable_polls = 0
                last_content = content
            # early exit: durable row not (yet) readable but the page already
            # shows a terminal outcome (failure narration / sentinel)
            if (not content.strip() and dom_stable >= 2
                    and _non_answer_reason(dom)):
                break
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
    assistant = [m for m in history_msgs
                 if str(m.get("role")) == "assistant"]
    content = _msg_text(assistant[-1]) if assistant else ""
    delivered = " ".join(_msg_text(m) for m in history_msgs)
    dom_text = latest_assistant_text(page)
    leg["session_id"] = sid
    leg["history_msgs_count"] = len(history_msgs)
    leg["answer_text"] = _truncate(content, 1500)
    leg["dom_text"] = _truncate(dom_text, 800)
    leg["non_answer_reason"] = (_non_answer_reason(content)
                                or _non_answer_reason(dom_text))
    leg["history_contains_fact"] = "quartz-77" in delivered.lower()
    leg["waited_seconds"] = round(_now() - leg["sent_at"], 1)
    return leg


def _scrub_text(text: str, key: str) -> str:
    if key:
        text = text.replace(key, "<redacted-opencode-go-key>")
    text = re.sub(
        r"eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{4,}",
        "<jwt-redacted>", text)
    text = re.sub(r'(?i)(bearer\s+)[A-Za-z0-9._\-]{10,}',
                  r"\1<redacted>", text)
    text = re.sub(r'(?i)("api_key"\s*:\s*")[^"]{8,}(")',
                  r"\1<redacted>\2", text)
    return text


def main() -> int:
    from playwright.sync_api import sync_playwright

    EVID_DIR.mkdir(parents=True, exist_ok=True)
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE.write_text(FIXTURE_TEXT)

    go_key = _load_go_key()

    ev: dict = {
        "journey": "phase-d-fresh-install-complete-loop",
        "phase": "D-pristine-install-run3",
        "run": 3,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "harness": {"file": str(HERE),
                    "sha256": hashlib.sha256(HERE.read_bytes()).hexdigest(),
                    "carries": "browser_phase_d_quickstart_loop.py (Phase C machinery)"},
        "frozen_candidate": FROZEN_SHA,
        "worktree": str(WT_ROOT),
        "effective_config": {
            "atom_local_only": False,
            "opencode_base_url": "https://opencode.ai/zen/go/v1",
            "opencode_api_key_env": "present (OPENCODE_API_KEY in backend/.env; value never recorded)",
            "provider_under_test": PROVIDER,
            "byok_store_paths": [
                "wizard Card B: key_name '<provider> (onboarding)' (F4 shape)",
                "Settings->AI: key_name=default (resolver-compatible)",
            ],
            "note": ("run 1/run 2 evidence carries local-only=true; run 3 flips "
                     "per owner directive 2026-10-17 'use opencode go keys or "
                     "deepseek keys for testing byok'. F5: local-only roulette "
                     "starves the planning leg (see INSTALL_FINDINGS F5)"),
        },
        "go_key_loaded": bool(go_key),
        "context": ("F1..F3 install findings; F4 product defect (wizard "
                    "key_name mismatch) reproduced for Ollama in run 2 and "
                    "re-tested here for a CLOUD provider; F5 product defect "
                    "(agent/planning legs starve under ATOM_LOCAL_ONLY=true; "
                    "evidence logs_phase_d/f5_repro.log + "
                    "f5_sentinel_trace_excerpt.txt)."),
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
        if not go_key:
            raise RuntimeError("OpenCode Go key not loadable from the auth store")
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
                pageA.screenshot(path=str(EVID_DIR / "phase_d_run3_admin_signed_in.png"))
            except Exception:  # noqa: BLE001
                pass
            ev["admin_signin"] = a

            # ---- 2..3. fresh user sign-in + wizard (Card B BYOK) ---------
            ctxB = browser.new_context(viewport={"width": 1440, "height": 960})
            page = ctxB.new_page()
            cap = Capture(page, BE_BASE)
            s: dict = {}
            s["login"] = do_login(page, {"email": user["email"],
                                         "password": user["password"]})
            s["login_200"] = any(r.get("status") == 200
                                 for r in cap.responses_to("/api/auth/login"))
            try:
                page.screenshot(path=str(EVID_DIR / "phase_d_run3_user_signed_in.png"))
            except Exception:  # noqa: BLE001
                pass
            s["frontend_ownership_login"] = ownership_check(
                PINNED_FE_PORT, str(FRONTEND), "after_login")
            s["provider_before_wizard"] = _provider_fields(
                page_api(page, "/api/ai/providers"), PROVIDER)
            s["wizard"] = walk_wizard_r3(page, {}, go_key)

            # wait for the wizard's store POST to land, then read back
            deadline = time.monotonic() + 30
            while time.monotonic() < deadline:
                if any(r.get("status") == 200 for r in
                       cap.responses_to(f"/api/ai/providers/{PROVIDER}/keys")):
                    break
                page.wait_for_timeout(500)
            wizard_store_responses = cap.responses_to(
                f"/api/ai/providers/{PROVIDER}/keys")
            s["wizard_store_responses"] = wizard_store_responses
            key_id_match = None
            for r in wizard_store_responses:
                m = re.search(r'"key_id":\s*"([^"]+)"', str(r.get("body_head") or ""))
                if m:
                    key_id_match = m.group(1)
            s["wizard_stored_key_id"] = key_id_match
            provider_after_wizard = _provider_fields(
                page_api(page, "/api/ai/providers"), PROVIDER)
            s["provider_after_wizard"] = provider_after_wizard
            s["wizard_key_left_provider_inactive"] = bool(
                provider_after_wizard
                and not provider_after_wizard.get("has_tenant_key")
                and not provider_after_wizard.get("has_api_keys")
                and provider_after_wizard.get("status") != "active")

            # ---- 4. completion click --------------------------------------
            ready_node, _kind = overlay_of(page)
            s["frontend_ownership_before_click"] = ownership_check(
                PINNED_FE_PORT, str(FRONTEND), "before_click")
            s["completion"] = completion_click(page, ready_node, cap, {})
            s["post_click"] = {"status_api": page_api(page, "/api/onboarding/status"),
                               "db": db_read(db_path, email=user["email"]),
                               "storage": storage_snapshot(page)}

            # ---- 5. model config via Settings -> AI (F4 workaround) -------
            sl: dict = {"fresh_user_attempt": _settings_configure_r3(
                page, cap, "phase_d_run3_settings_ocgo.png", go_key)}
            if (sl["fresh_user_attempt"].get("provider_after") or {}).get(
                    "status") != "active":
                sl["admin_fallback"] = {
                    "admin_login": do_login(pageA, {"email": ADMIN_EMAIL,
                                                    "password": admin_password}),
                    "attempt": _settings_configure_r3(
                        pageA, capA, "phase_d_run3_settings_ocgo_admin.png",
                        go_key),
                }
            sl["final_readback"] = _provider_fields(
                page_api(page, "/api/ai/providers"), PROVIDER)
            if (sl.get("final_readback") or {}).get("status") == "active":
                sl["configured_in"] = (
                    "fresh-user-context"
                    if (sl["fresh_user_attempt"].get("provider_after") or {}).get(
                        "status") == "active"
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
                    if "Successfully uploaded" in text or \
                            "uploaded successfully" in text.lower():
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
                # run-3 fix: /api/documents payload is {success, data: [...]}
                items = body.get("data") if isinstance(body, dict) else body
                up["fixture_in_list"] = any(
                    "zephyr" in json.dumps(it).lower() for it in (items or []))
            except Exception:  # noqa: BLE001
                up["fixture_in_list"] = None
            try:
                page.screenshot(path=str(EVID_DIR / "phase_d_run3_documents_uploaded.png"))
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
            chat_leg_start_iso = time.strftime("%Y-%m-%dT%H:%M:%S",
                                               time.gmtime(time.time() - 30))
            attempts: list = []
            if ch["input_found"]:
                attempts.append(_run_chat_turn(page, cap, uid, CHAT_PROMPT))
                if attempts[-1].get("non_answer_reason"):
                    attempts.append(_run_chat_turn(
                        page, cap, uid,
                        "Please search my uploaded documents again for the "
                        "launch code for project Zephyr-9 and tell me the code."))
            ch["attempts"] = attempts
            ch["retried"] = len(attempts) > 1
            final = attempts[-1] if attempts else {}
            ch["final_answer_text"] = final.get("answer_text")
            ch["history_msgs_count"] = final.get("history_msgs_count")
            ch["assistant_text_dom"] = _truncate(latest_assistant_text(page), 1500)
            ch["answer_contains_fact"] = bool(
                "quartz-77" in str(final.get("answer_text") or "").lower()
                or "quartz-77" in str(ch["assistant_text_dom"] or "").lower())
            ch["history_contains_fact"] = bool(final.get("history_contains_fact"))
            ch["non_answer_reason"] = final.get("non_answer_reason")
            ch["message_requests"] = cap.requests_to("/api/chat/message", "POST")
            ch["message_responses"] = cap.responses_to("/api/chat/message")
            ch["no_llm_provider_seen"] = any(
                "no_llm_provider" in str(r.get("body_head") or "")
                for r in ch["message_responses"])
            ch["answer_says_provider_needed"] = bool(
                "you need an ai provider"
                in str(final.get("answer_text") or "").lower())
            # provider attribution: BYOK per-call tracker (server-side)
            uc = page_api(page, "/api/ai/usage/calls?provider=opencode-go&limit=50")
            calls = (((uc.get("body") or {}).get("data") or {})
                     .get("calls") or [])
            recent = [c for c in calls
                      if str(c.get("timestamp") or "")[:19] >= chat_leg_start_iso]
            ch["usage_calls_window_start"] = chat_leg_start_iso
            ch["usage_calls_total_filtered"] = len(calls)
            ch["usage_calls_recent"] = recent[:6]
            ch["provider_used_opencode_go"] = bool(recent)
            ch["ws_tail"] = cap.websockets[-3:]
            ch["storage"] = storage_snapshot(page)
            try:
                page.screenshot(path=str(EVID_DIR / "phase_d_run3_chat_answer.png"))
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
                page.screenshot(path=str(EVID_DIR / "phase_d_run3_after_reload.png"))
            except Exception:  # noqa: BLE001
                pass
            cap2 = Capture(page, BE_BASE)
            page.goto(f"{FE_BASE}/dashboard", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(9000)
            rl["wizard_present_after_dashboard_load"] = overlay_of(page)[0] is not None
            rl["status_api"] = page_api(page, "/api/onboarding/status")
            rl["db"] = db_read(db_path, email=user["email"])
            sak = rl["status_api"].get("body") or {}
            rl["status_api_completed"] = bool(
                sak.get("onboarding_completed")
                or ((sak.get("data") or {}).get("onboarding_completed")))
            rl["db_completed"] = bool((rl["db"] or {}).get("completed"))
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
            "wizard-api-key-posted": bool(
                s.get("wizard", {}).get("connect", {}).get("save_clicked")
                and any(r.get("status") == 200 for r in
                        (s.get("wizard_store_responses") or []))),
            "wizard-key-left-provider-inactive": bool(
                s.get("wizard_key_left_provider_inactive")),
            "completion-request-emitted": bool(
                completion.get("update_requests_after_click")),
            "completion-persisted": bool((post_click.get("db") or {}).get("completed")),
            "completion-overlay-closed": bool(completion.get("overlay_closed_at")),
            "settings-ai-configured-provider": bool(
                (settings_leg.get("final_readback") or {}).get("status") == "active"
                and (settings_leg.get("final_readback") or {}).get("has_tenant_key")),
            "settings-save-used-default-key-name": bool(
                (settings_leg.get("fresh_user_attempt") or {}).get(
                    "key_name_default_in_save")),
            "upload-succeeded": bool(any(
                r.get("status") == 200 for r in (upload.get("upload_responses") or []))),
            "upload-durable": bool(upload.get("fixture_in_list")),
            "chat-answer-received": bool(
                chat.get("input_found") and chat.get("history_msgs_count")
                and any(r.get("status") == 200
                        for r in (chat.get("message_responses") or []))),
            "chat-no-no-llm-provider": bool(
                not chat.get("no_llm_provider_seen")
                and not chat.get("answer_says_provider_needed")),
            "answer-not-unusable-output": bool(not chat.get("non_answer_reason")),
            "answer-uses-uploaded-source": bool(chat.get("answer_contains_fact")),
            "answer-durable-in-history": bool(chat.get("history_contains_fact")),
            "answer-provider-opencode-go": bool(chat.get("provider_used_opencode_go")),
            "reload-chat-persists": bool(reload_leg.get("fact_persists_after_reload")),
            "reload-no-wizard": bool(
                not reload_leg.get("wizard_present_after_dashboard_load")
                and reload_leg.get("status_api_completed")
                and reload_leg.get("db_completed")),
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
        out = EVID_DIR / f"browser_complete_loop_r3_{time.strftime('%Y%m%d_%H%M%S')}.json"
        out.write_text(_scrub_text(json.dumps(ev, indent=1), go_key))
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
