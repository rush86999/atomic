#!/usr/bin/env python3
"""Phase E — unified-candidate browser loop.

One frozen candidate (see FROZEN_SHA), two world configurations:

  cloud (ports 18300/18301): ``ATOM_LOCAL_ONLY=false``, NO OPENCODE_API_KEY in
    the backend environment — the operator's Go key is configured ONCE in the
    onboarding wizard (Card B). The first useful request must use that stored
    provider without any Settings→AI re-save (F4's required regression), and
    the answer must be useful + attributed + durable (F6 fix exercised when
    the narration model wraps its reply).
  local (ports 18400/18401): ``ATOM_LOCAL_ONLY=true`` + ollama — the wizard
    Card A path (canonical key identity) and the F5 planning leg: a grounded
    turn must answer from the local runtime (previously the no_llm_provider
    sentinel), attributed to ollama, durable across reload.

Machinery (Capture, overlay handling, page_api, ownership checks, DB reads)
is carried from ``browser_phase_d_quickstart_loop``; its world constants are
rebound here per mode.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata as md
import json
import os
import re
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parent))          # sibling machinery + journey_runtime
sys.path.insert(0, str(HERE.parents[2]))      # backend root

import browser_phase_d_quickstart_loop as qs  # noqa: E402
import journey_runtime as JR                  # noqa: E402

FROZEN_SHA = "382cb2eec"  # overridden by --sha
PROVIDERS = {"cloud": "opencode-go", "local": "ollama"}
NON_ANSWER_MARKERS = (
    "unusable output",
    "you need an ai provider",
    "no eligible llm provider",
    "could not complete the request",
)
OPENCODE_KEY_STORE = Path.home() / ".local/share/opencode/auth.json"
MAIN_ENV = Path("/Users/rushiparikh/projects/atom/backend/.env")


def _load_go_key() -> str:
    """Operator OpenCode Go key (never printed / never written to evidence).

    Resolution order: the session-provided env key (ATOM_E2E_GO_KEY — the
    operator handed a FRESH key after the prior one expired mid-campaign),
    then the opencode auth store, then the dev backend env file. The key is
    only ever typed into the onboarding wizard (Card B); it is scrubbed from
    every recorded string.
    """
    key = (os.environ.get("ATOM_E2E_GO_KEY") or "").strip()
    if len(key) >= 10:
        return key
    try:
        doc = json.loads(OPENCODE_KEY_STORE.read_text())
        key = (doc.get("opencode-go") or {}).get("key") or ""
        if isinstance(key, str) and len(key) >= 10:
            return key
    except Exception:  # noqa: BLE001
        pass
    try:
        for line in MAIN_ENV.read_text().splitlines():
            line = line.strip()
            if line.startswith("OPENCODE_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    except Exception:  # noqa: BLE001
        pass
    return ""


def _provider_fields(prov_payload: dict, provider_id: str) -> dict:
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
    return str(((m.get("response") or {}).get("message"))
               or m.get("content") or "")


def walk_wizard_card_b(page, leg: dict, key: str) -> dict:
    """Wizard walk with the provider step taken via Card B (cloud BYOK)."""
    node, kind = qs.wait_for_overlay(page, 180)
    leg["overlay_discovered"] = {"found": node is not None, "kind": kind}
    if node is None:
        leg["path_after_login"] = qs.body_text(page)[:300]
        return leg
    leg["overlay_text_head"] = qs.overlay_text(node)

    node.get_by_role("button", name="Next").first.click(timeout=20000)
    page.wait_for_timeout(700)
    role_input = node.locator("#role")
    goal_input = node.locator("#goal")
    if role_input.count():
        role_input.fill("acceptance")
    if goal_input.count():
        goal_input.fill("phase e unified candidate loop")
    node.get_by_role("button", name="Next").first.click(timeout=20000)
    page.wait_for_timeout(1500)

    connect: dict = {"card_b_found": False, "provider_selected": None,
                     "save_clicked": False, "save_result": None,
                     "advanced_to_ready": False}
    sel = node.locator("select")
    if sel.count():
        connect["card_b_found"] = True
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            try:
                opts = sel.first.locator("option").evaluate_all(
                    "els => els.map(e => e.value)")
            except Exception:  # noqa: BLE001
                opts = []
            if PROVIDERS["cloud"] in opts:
                break
            page.wait_for_timeout(1000)
        try:
            sel.first.select_option(PROVIDERS["cloud"])
            connect["provider_selected"] = PROVIDERS["cloud"]
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
        txt = qs.body_text(page)
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
            "You're Ready" in qs.body_text(page)
            or node.get_by_role("button", name="Start Automating").count() > 0)
    leg["connect"] = connect
    leg["overlay_text_at_ready"] = qs.overlay_text(node)
    return leg


def _run_chat_turn(page, cap: qs.Capture, uid, message: str) -> dict:
    leg: dict = {"prompt": message, "sent_at": qs._now()}
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
        st = qs.storage_snapshot(page)
        sid = st.get("chat_session") or sid
        if not sid:
            for r in cap.requests_to("/api/chat/message", "POST"):
                m = re.search(r'"session_id"\s*:\s*"(sess[^"]+)"',
                              str(r.get("post_data") or ""))
                if m:
                    sid = m.group(1)
                    break
        if sid:
            h = qs.page_api(page, f"/api/chat/history/{sid}"
                            + (f"?user_id={uid}" if uid else ""))
            leg["last_history_status"] = h.get("status")
            body = h.get("body") or {}
            history_msgs = (body.get("messages")
                            if isinstance(body, dict) else body) or []
            assistant = [m for m in history_msgs
                         if str(m.get("role")) == "assistant"]
            content = _msg_text(assistant[-1]) if assistant else ""
            dom = qs.latest_assistant_text(page)
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
            if (not content.strip() and dom_stable >= 2
                    and _non_answer_reason(dom)):
                break
        page.wait_for_timeout(4000)
    page.wait_for_timeout(6000)
    if sid:
        h2 = qs.page_api(page, f"/api/chat/history/{sid}"
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
    dom_text = qs.latest_assistant_text(page)
    leg["session_id"] = sid
    leg["history_msgs_count"] = len(history_msgs)
    leg["answer_text"] = qs._truncate(content, 1500)
    leg["dom_text"] = qs._truncate(dom_text, 800)
    leg["non_answer_reason"] = (_non_answer_reason(content)
                                or _non_answer_reason(dom_text))
    leg["history_contains_fact"] = "quartz-77" in delivered.lower()
    leg["waited_seconds"] = round(qs._now() - leg["sent_at"], 1)
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
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=("cloud", "local"), required=True)
    ap.add_argument("--wt", required=True, help="candidate worktree root")
    ap.add_argument("--sha", default=FROZEN_SHA)
    args = ap.parse_args()

    wt = Path(args.wt).resolve()
    # Worlds run sequentially on the same ports (cloud then local).
    be_port = 18300
    fe_port = be_port + 1
    evid = wt / "evidence" / f"phase_e_{args.mode}"
    evid.mkdir(parents=True, exist_ok=True)

    # Rebind the carried machinery to THIS world.
    qs.WT_ROOT = wt
    qs.BACKEND = wt / "backend"
    qs.FRONTEND = wt / "frontend-nextjs"
    qs.EVID_DIR = evid
    qs.PINNED_BE_PORT = be_port
    qs.PINNED_FE_PORT = fe_port
    qs.BE_BASE = f"http://127.0.0.1:{be_port}"
    qs.FE_BASE = f"http://localhost:{fe_port}"
    qs.FIXTURE = evid / "fixtures" / "phase_e_zephyr_notes.txt"
    qs.FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    qs.FIXTURE.write_text(qs.FIXTURE_TEXT)
    qs.PASSWORD_FILE = wt / "backend" / "logs" / "bootstrap_admin_password.txt"
    provider = PROVIDERS[args.mode]

    from playwright.sync_api import sync_playwright

    go_key = _load_go_key() if args.mode == "cloud" else ""
    ev: dict = {
        "journey": "phase-e-unified-candidate-loop",
        "phase": "E",
        "mode": args.mode,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "harness": {"file": str(HERE),
                    "sha256": hashlib.sha256(HERE.read_bytes()).hexdigest(),
                    "carries": "browser_phase_d_quickstart_loop.py machinery"},
        "frozen_candidate": args.sha,
        "worktree": str(wt),
        "effective_config": {
            "atom_local_only": args.mode == "local",
            "provider_under_test": provider,
            "opencode_api_key_env": (
                "absent (cloud world: the wizard-stored key must activate "
                "the provider)" if args.mode == "cloud" else "n/a"),
            "byok_store": (
                "wizard Card B, canonical key_name=default + label"
                if args.mode == "cloud" else
                "wizard Card A (ollama), canonical key_name=default + label"),
        },
        "go_key_loaded": bool(go_key),
        "versions": {},
    }
    for pkg in ("pyarrow", "numpy", "lancedb", "playwright", "cryptography"):
        try:
            ev["versions"][pkg] = md.version(pkg)
        except Exception:  # noqa: BLE001
            ev["versions"][pkg] = None

    browser = None
    passed = False
    try:
        if args.mode == "cloud" and not go_key:
            raise RuntimeError("OpenCode Go key not loadable")
        if not qs._wait_http(f"{qs.BE_BASE}/health", 60):
            raise RuntimeError("backend did not answer /health")
        health = qs._http_json(f"{qs.BE_BASE}/health")
        ident = (health.get("body") or {}).get("identity") or {}
        ev["backend_health_identity"] = ident
        ev["backend_ownership"] = qs.ownership_check(
            be_port, str(qs.BACKEND), "attach")
        if not qs._wait_http(qs.FE_BASE, 240):
            raise RuntimeError("frontend did not come up")
        ev["frontend_ownership"] = qs.ownership_check(
            fe_port, str(qs.FRONTEND), "attach")
        db_path_raw = str(ident.get("database") or "")
        db_path = (db_path_raw if db_path_raw.startswith("/")
                   else str(Path(str(ident.get("cwd") or qs.BACKEND))
                            / db_path_raw))
        ev["db_path"] = db_path
        ev["db_path_inside_worktree"] = db_path.startswith(str(wt))
        ev["db_before"] = qs.db_read(db_path)

        user = JR.new_user(qs.BE_BASE)
        ev["product_user"] = {"registered": bool(user.get("registered")),
                              "register_http": user.get("register_http"),
                              "email": user.get("email"),
                              "id": user.get("id")}
        if not ev["product_user"]["registered"]:
            raise RuntimeError(f"product user registration failed: {user}")
        uid = user.get("id")

        admin_password = qs.PASSWORD_FILE.read_text().strip()
        ev["admin_credentials"] = {"email": qs.ADMIN_EMAIL,
                                   "password_present": bool(admin_password),
                                   "password": "<redacted>"}

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ev["browser_version"] = browser.version

            a: dict = {}
            ctxA = browser.new_context(viewport={"width": 1440, "height": 960})
            pageA = ctxA.new_page()
            capA = qs.Capture(pageA, qs.BE_BASE)
            a["login"] = qs.do_login(pageA, {"email": qs.ADMIN_EMAIL,
                                             "password": admin_password})
            a["login_200"] = any(r.get("status") == 200
                                 for r in capA.responses_to("/api/auth/login"))
            try:
                pageA.screenshot(path=str(evid / "phase_e_admin_signed_in.png"))
            except Exception:  # noqa: BLE001
                pass
            ev["admin_signin"] = a

            ctxB = browser.new_context(viewport={"width": 1440, "height": 960})
            page = ctxB.new_page()
            cap = qs.Capture(page, qs.BE_BASE)
            s: dict = {}
            s["login"] = qs.do_login(page, {"email": user["email"],
                                            "password": user["password"]})
            s["login_200"] = any(r.get("status") == 200
                                 for r in cap.responses_to("/api/auth/login"))
            try:
                page.screenshot(path=str(evid / "phase_e_user_signed_in.png"))
            except Exception:  # noqa: BLE001
                pass
            s["provider_before_wizard"] = _provider_fields(
                qs.page_api(page, "/api/ai/providers"), provider)
            if args.mode == "cloud":
                s["wizard"] = walk_wizard_card_b(page, {}, go_key)
            else:
                s["wizard"] = qs.walk_wizard(page, {})

            deadline = time.monotonic() + 30
            while time.monotonic() < deadline:
                if any(r.get("status") == 200 for r in
                       cap.responses_to(f"/api/ai/providers/{provider}/keys")):
                    break
                page.wait_for_timeout(500)
            store_posts = cap.requests_to(
                f"/api/ai/providers/{provider}/keys", "POST")
            store_responses = cap.responses_to(
                f"/api/ai/providers/{provider}/keys")
            s["wizard_store_posts"] = store_posts
            s["wizard_store_responses"] = store_responses
            s["wizard_store_status_200"] = any(
                r.get("status") == 200 for r in store_responses)

            def _canonical_store_payload(raw: str) -> bool:
                try:
                    body = json.loads(raw)
                except Exception:  # noqa: BLE001
                    return False
                return (str(body.get("key_name")) == "default"
                        and bool(body.get("label")))

            payloads = [str(r.get("post_data") or "") for r in store_posts]
            s["wizard_payload_canonical"] = any(
                _canonical_store_payload(p) for p in payloads)
            provider_after_wizard = _provider_fields(
                qs.page_api(page, "/api/ai/providers"), provider)
            s["provider_after_wizard"] = provider_after_wizard
            s["wizard_activated_provider"] = bool(
                provider_after_wizard
                and provider_after_wizard.get("has_tenant_key")
                and provider_after_wizard.get("status") == "active")
            # Exactly ONE store POST by now (the wizard's own): a second one
            # would mean a Settings→AI re-save was needed.
            s["store_post_count_before_chat"] = len(store_posts)

            ready_node, _kind = qs.overlay_of(page)
            s["completion"] = qs.completion_click(page, ready_node, cap, {})
            s["post_click"] = {
                "status_api": qs.page_api(page, "/api/onboarding/status"),
                "db": qs.db_read(db_path, email=user["email"]),
                "storage": qs.storage_snapshot(page)}

            up: dict = {}
            page.goto(f"{qs.FE_BASE}/documents", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(4000)
            up["file_input_found"] = page.locator("#file-upload").count() > 0
            if up["file_input_found"]:
                page.set_input_files("#file-upload", str(qs.FIXTURE))
                deadline = time.monotonic() + 240
                while time.monotonic() < deadline:
                    text = qs.body_text(page)
                    if "Successfully uploaded" in text or \
                            "uploaded successfully" in text.lower():
                        up["success_text_seen"] = True
                        break
                    if any(r.get("status", 0) >= 400
                           for r in cap.responses_to("/api/documents/upload")):
                        break
                    page.wait_for_timeout(1000)
            up["upload_responses"] = cap.responses_to("/api/documents/upload")
            up["documents_list"] = qs.page_api(page, "/api/documents")
            try:
                body = up["documents_list"].get("body")
                items = body.get("data") if isinstance(body, dict) else body
                up["fixture_in_list"] = any(
                    "zephyr" in json.dumps(it).lower() for it in (items or []))
            except Exception:  # noqa: BLE001
                up["fixture_in_list"] = None
            try:
                page.screenshot(path=str(evid / "phase_e_documents_uploaded.png"))
            except Exception:  # noqa: BLE001
                pass
            s["upload"] = up

            ch: dict = {}
            page.goto(f"{qs.FE_BASE}/chat", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(3000)
            input_box = page.locator('[data-testid="agent-chat-input"]')
            deadline = time.monotonic() + 240
            while time.monotonic() < deadline and not input_box.count():
                page.wait_for_timeout(1000)
            ch["input_found"] = input_box.count() > 0
            chat_leg_start_iso = time.strftime(
                "%Y-%m-%dT%H:%M:%S", time.gmtime(time.time() - 30))
            attempts: list = []
            if ch["input_found"]:
                attempts.append(_run_chat_turn(page, cap, uid, qs.CHAT_PROMPT))
                if attempts[-1].get("non_answer_reason"):
                    attempts.append(_run_chat_turn(
                        page, cap, uid,
                        "Please search my uploaded documents again for the "
                        "launch code for project Zephyr-9 and tell me the code."))
            ch["attempts"] = attempts
            ch["retried"] = len(attempts) > 1
            final = attempts[-1] if attempts else {}
            ch["first_attempt_clean"] = bool(
                attempts and not attempts[0].get("non_answer_reason"))
            ch["final_answer_text"] = final.get("answer_text")
            ch["history_msgs_count"] = final.get("history_msgs_count")
            ch["assistant_text_dom"] = qs._truncate(
                qs.latest_assistant_text(page), 1500)
            ch["answer_contains_fact"] = bool(
                "quartz-77" in str(final.get("answer_text") or "").lower()
                or "quartz-77" in str(ch["assistant_text_dom"] or "").lower())
            ch["history_contains_fact"] = bool(
                final.get("history_contains_fact"))
            ch["non_answer_reason"] = final.get("non_answer_reason")
            ch["message_responses"] = cap.responses_to("/api/chat/message")
            ch["no_llm_provider_seen"] = any(
                "no_llm_provider" in str(r.get("body_head") or "")
                for r in ch["message_responses"])
            ch["answer_says_provider_needed"] = bool(
                "you need an ai provider"
                in str(final.get("answer_text") or "").lower())
            uc = qs.page_api(
                page, f"/api/ai/usage/calls?provider={provider}&limit=50")
            calls = (((uc.get("body") or {}).get("data") or {})
                     .get("calls") or [])
            recent = [c for c in calls
                      if str(c.get("timestamp") or "")[:19] >= chat_leg_start_iso]
            ch["usage_calls_recent"] = recent[:6]
            ch["provider_used_under_test"] = bool(recent)
            ch["ws_tail"] = cap.websockets[-3:]
            try:
                page.screenshot(path=str(evid / "phase_e_chat_answer.png"))
            except Exception:  # noqa: BLE001
                pass
            s["chat"] = ch

            rl: dict = {}
            page.reload(wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(9000)
            rl["chat_text_after_reload"] = qs._truncate(
                qs.latest_assistant_text(page), 800)
            rl["fact_persists_after_reload"] = (
                "quartz-77" in str(rl["chat_text_after_reload"] or "").lower()
                or "quartz-77" in qs.body_text(page).lower())
            rl["wizard_present_after_reload"] = qs.overlay_of(page)[0] is not None
            try:
                page.screenshot(path=str(evid / "phase_e_after_reload.png"))
            except Exception:  # noqa: BLE001
                pass
            cap2 = qs.Capture(page, qs.BE_BASE)
            page.goto(f"{qs.FE_BASE}/dashboard", wait_until="domcontentloaded",
                      timeout=240000)
            page.wait_for_timeout(9000)
            rl["wizard_present_after_dashboard_load"] = \
                qs.overlay_of(page)[0] is not None
            rl["status_api"] = qs.page_api(page, "/api/onboarding/status")
            rl["db"] = qs.db_read(db_path, email=user["email"])
            sak = rl["status_api"].get("body") or {}
            rl["status_api_completed"] = bool(
                sak.get("onboarding_completed")
                or ((sak.get("data") or {}).get("onboarding_completed")))
            rl["db_completed"] = bool((rl["db"] or {}).get("completed"))
            rl["frontend_ownership_end"] = qs.ownership_check(
                fe_port, str(qs.FRONTEND), "end")
            rl["backend_ownership_end"] = qs.ownership_check(
                be_port, str(qs.BACKEND), "end")
            rl["console_tail"] = cap2.summary(since=0)["console"][-15:]
            s["reload"] = rl

            ev["session"] = s
            ev["console_tail"] = cap.summary(since=0)["console"][-25:]
            ev["page_errors"] = cap.summary(since=0)["page_errors"]
            ctxA.close()
            ctxB.close()

        s = ev.get("session") or {}
        completion = s.get("completion") or {}
        post_click = s.get("post_click") or {}
        upload = s.get("upload") or {}
        chat = s.get("chat") or {}
        reload_leg = s.get("reload") or {}
        served_commit_ok = str(ident.get("git_commit") or "").startswith(
            args.sha[:12])

        checks = {
            "candidate-identity-served": bool(served_commit_ok),
            "backend-owned-by-worktree": bool(
                (ev.get("backend_ownership") or {}).get("owned_by_worktree")
                and str(ident.get("cwd") or "").startswith(str(qs.BACKEND))),
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
            "wizard-store-200": bool(s.get("wizard_store_status_200")),
            "wizard-store-canonical-payload": bool(
                s.get("wizard_payload_canonical")),
            "wizard-activates-provider": bool(
                s.get("wizard_activated_provider")),
            "no-settings-resave-needed": bool(
                int(s.get("store_post_count_before_chat") or 0) == 1),
            "completion-request-emitted": bool(
                completion.get("update_requests_after_click")),
            "completion-persisted": bool(
                (post_click.get("db") or {}).get("completed")),
            "completion-overlay-closed": bool(
                completion.get("overlay_closed_at")),
            "upload-succeeded": bool(any(
                r.get("status") == 200
                for r in (upload.get("upload_responses") or []))),
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
            "answer-provider-attributed": bool(
                chat.get("provider_used_under_test")),
            "reload-chat-persists": bool(
                reload_leg.get("fact_persists_after_reload")),
            "reload-no-wizard": bool(
                not reload_leg.get("wizard_present_after_dashboard_load")
                and reload_leg.get("status_api_completed")
                and reload_leg.get("db_completed")),
        }
        ev["assertions"] = checks
        ev["pass"] = all(checks.values())
        passed = ev["pass"]
        print(json.dumps({"mode": args.mode, "assertions": checks}, indent=1))
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
        passed = False
        print(f"ERROR: {ev['error']}")
    finally:
        ev["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                          time.gmtime())
        if browser is not None:
            try:
                browser.close()
            except Exception:  # noqa: BLE001
                pass
        out = evid / (f"browser_phase_e_{args.mode}_"
                      f"{time.strftime('%Y%m%d_%H%M%S')}.json")
        out.write_text(_scrub_text(json.dumps(ev, indent=1), go_key))
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
