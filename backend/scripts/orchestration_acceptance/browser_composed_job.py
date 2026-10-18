#!/usr/bin/env python3
"""Composed user job (product spine) — browser-driven acceptance on the frozen
unified candidate.

Predeclared protocol: docs/acceptance/COMPOSED_JOB_PROTOCOL_2026-10-17.md
(committed BEFORE any run; this harness implements that document).

Scenario — "compare a draft with approved source records and prepare an
authorized revision":

  S1  setup (wizard Card A, ollama) + completion            [browser]
  S2  approved-records doc upload (Documents UI) + draft canvas seed (API)
      + edit-plan pin credential mounted through the product
  S3  compare ask: mismatch identified, ZERO writes         [browser, canvas page]
  S4  authorized edit: exactly ONE applied change + readback [browser]
  S5  calculation on the approved price                      [browser]
  S6  deliberate interruption: SIGKILL the backend while a second authorized
      edit is in flight; restart; re-send; converge to EXACTLY ONE change
  S7  continue without repeating completed work; final reload readback

Run FROM the candidate worktree (ScratchServer cwd anchors there); fresh
allowlisted scratch world per the protocol; hybrid config disclosed:
reply lane = product-registered ollama llama3.1:8b (wizard), edit-plan pin =
deepseek/deepseek-v4-pro via the product-mounted credential (dev BYOK vault,
read-only; never recorded).
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata as md
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parent))          # sibling machinery + journey_runtime
sys.path.insert(0, str(HERE.parents[2]))      # candidate backend root

import browser_phase_d_quickstart_loop as qs  # noqa: E402
import journey_runtime as JR                  # noqa: E402

SUBJECT = "e207494af4c7"
BE_PORT = 18500
FE_PORT = 18501
PIN_PROVIDER = "deepseek"
PIN_MODEL = "deepseek-v4-pro"
PIN_SPEC = f"{PIN_PROVIDER}/{PIN_MODEL}"
DEV_VAULT = Path(
    "/Users/rushiparikh/projects/atom/backend/data/byok_keys.json")
DEV_VAULT_KEY = Path(
    "/Users/rushiparikh/projects/atom/backend/data/byok_encryption_key")
DEV_VAULT_ENTRY = f"tenant_default_{PIN_PROVIDER}_default_production"
DEEPSEEK_MODELS_URL = "https://api.deepseek.com/v1/models"

APPROVED_DOC = (
    "APPROVED RECORDS \u2014 Quotation Q-2026-114\n"
    "Source: Sales Operations approved-terms register\n"
    "Client: Dunmore Fabrication LLC\n"
    "Item: CNC press brake, 50-ton\n"
    "Approved unit price: $48,000.00\n"
    "Approved payment terms: Net 30\n"
    "Approved valid until: 2026-12-31\n"
    "Approved by: Sales Operations\n")

DRAFT_TITLE = "Quotation Q-2026-114 (draft)"
DRAFT_CONTENT = (
    "# Quotation Q-2026-114 (DRAFT)\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")

ASK_COMPARE = (
    "Compare the draft quotation with my uploaded Approved Records document. "
    "Does the Valid Until date in the draft match the approved record? "
    "Flag anything that differs. Do not change anything yet.")
ASK_EDIT = (
    "Please update the draft quotation's Valid Until date to 2026-12-31 "
    "to match the approved record.")
ASK_CALC = (
    "If we order two units at the approved unit price of $48,000.00, "
    "what is the total before tax?")
# F-C3 (recorded decision, owner instruction 2026-10-17): the plain
# arithmetic ask above is preserved as the FIRST attempt; when it does not
# supply the total (refusal/non-answer), ONE predeclared re-phrase uses the
# J5-demonstrated structured shape.
ASK_CALC_STRUCTURED = (
    "calculate expression QTY * UNIT_PRICE with QTY=2 UNIT_PRICE=48000")
ASK_EDIT2 = (
    "Please also update the payment terms in the draft to Net 45.")
ASK_CONTINUE = (
    "What is the current Valid until date on the draft, and does it still "
    "match the approved record?")

TURN_TIMEOUT_MS = 300_000


def _now() -> float:
    return time.time()


def _truncate(value, limit: int = 600):
    value = "" if value is None else str(value)
    return value if len(value) <= limit else value[:limit] + "\u2026"


def _scrub(text: str, *secrets: str) -> str:
    text = str(text or "")
    for s in secrets:
        if s and len(s) >= 8:
            text = text.replace(s, "<redacted>")
    text = re.sub(
        r"eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{4,}",
        "<jwt-redacted>", text)
    text = re.sub(r"(?i)(bearer\s+)[A-Za-z0-9._\-]{10,}",
                  r"\1<redacted>", text)
    text = re.sub(r'(?i)("api_key"\s*:\s*")[^"]{8,}(")',
                  r"\1<redacted>\2", text)
    text = re.sub(r"\boc_sk_[A-Za-z0-9_\-]{8,}", "<redacted-key>", text)
    text = re.sub(r"\bsk-[A-Za-z0-9]{16,}", "<redacted-key>", text)
    return text


# ---------------------------------------------------------------------------
# Pin credential (J6 r21 pattern — dev BYOK vault, read-only, never recorded)
# ---------------------------------------------------------------------------
def _dev_pin_key() -> str:
    from cryptography.fernet import Fernet

    store = json.loads(DEV_VAULT.read_text())
    entry = (store.get("keys") or {}).get(DEV_VAULT_ENTRY) or {}
    enc = entry.get("encrypted_key") or entry.get("enc")
    if not enc:
        raise RuntimeError(f"vault entry {DEV_VAULT_ENTRY!r} missing")
    fernet = Fernet(DEV_VAULT_KEY.read_text().strip().encode())
    return fernet.decrypt(enc.encode()).decode()


def mount_pin_provider(base: str, token: str, plain: str) -> dict:
    """Store the pin key through the PRODUCT (the exact call Settings>AI
    sends) and verify the product masks it. Recorded facts only."""
    stored = JR.auth_post(
        base, token, f"/api/ai/providers/{PIN_PROVIDER}/keys",
        {"api_key": plain, "key_name": "default",
         "environment": "production"})
    keys = JR.auth_get(base, token, "/api/ai/keys")
    entries = [k for k in
               (((keys.get("json") or {}).get("data") or {}).get("keys") or [])
               if str((k or {}).get("provider")) == PIN_PROVIDER]
    masked = [(k or {}).get("masked_key") or "" for k in entries]
    return {"pin_spec": PIN_SPEC,
            "credential_source": (
                f"dev BYOK vault entry {DEV_VAULT_ENTRY!r} (read-only), "
                "stored via POST /api/ai/providers/deepseek/keys"),
            "store_http": stored.get("http"),
            "stored": bool((stored.get("json") or {}).get("success")),
            "keys_visible": len(entries),
            "decrypts": any(plain[:4] in m or plain[-4:] in m
                            for m in masked if m)}


def pin_live_probe(plain: str) -> dict:
    """Cheap provider liveness probe (status only; never recorded with key)."""
    import httpx
    try:
        r = httpx.get(DEEPSEEK_MODELS_URL,
                      headers={"Authorization": f"Bearer {plain}"},
                      timeout=10, trust_env=False)
        return {"http": r.status_code, "ok": r.status_code == 200}
    except Exception as exc:  # noqa: BLE001
        return {"http": None, "ok": False,
                "error": f"{type(exc).__name__}"}


# ---------------------------------------------------------------------------
# Canvas (product API; the UI-facing context shape is the canvas page's)
# ---------------------------------------------------------------------------
def canvas_seed(base: str, token: str, title: str, content: str) -> dict:
    up = JR.auth_post(base, token, "/api/canvas",
                      {"title": title, "canvas_type": "document"})
    cid = (up.get("json") or {}).get("canvas_id")
    out = {"create_http": up.get("http"), "canvas_id": cid}
    if not cid:
        return out
    import httpx
    put = httpx.put(f"{base}/api/canvas/{cid}",
                    headers={"Authorization": f"Bearer {token}"},
                    json=content, timeout=60, trust_env=False)
    out["seed_http"] = put.status_code
    got = httpx.get(f"{base}/api/canvas/{cid}",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=60, trust_env=False)
    try:
        gj = got.json()
    except Exception:  # noqa: BLE001
        gj = {}
    body = ((gj.get("content") or {}).get("content")
            if isinstance(gj.get("content"), dict) else gj.get("content"))
    out["seeded_matches"] = isinstance(body, str) and (
        content[:40] in body or "Valid until: 2026-11-30" in body)
    return out


def canvas_read(base: str, token: str, cid: str) -> str:
    import httpx
    r = httpx.get(f"{base}/api/canvas/{cid}",
                  headers={"Authorization": f"Bearer {token}"},
                  timeout=60, trust_env=False)
    try:
        j = r.json()
    except Exception:  # noqa: BLE001
        return ""
    body = ((j.get("content") or {}).get("content")
            if isinstance(j.get("content"), dict) else j.get("content"))
    return body if isinstance(body, str) else json.dumps(body)[:2000]


def audit_rows(db_path: str, cid: str) -> list:
    try:
        con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        rows = con.execute(
            "SELECT id, action_type, created_at, details_json "
            "FROM canvas_audit WHERE canvas_id=? ORDER BY created_at, rowid",
            (cid,)).fetchall()
        con.close()
        return [{"id": str(r[0])[:12], "action_type": r[1],
                 "created_at": r[2],
                 "details": _truncate(r[3], 200)} for r in rows]
    except Exception as exc:  # noqa: BLE001
        return [{"error": f"{type(exc).__name__}: {exc}"}]


def user_msg_count(db_path: str, like: str) -> int:
    try:
        con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        n = con.execute(
            "SELECT COUNT(*) FROM chat_messages WHERE role='user' "
            "AND content LIKE ?", (f"%{like}%",)).fetchone()[0]
        con.close()
        return int(n)
    except Exception:  # noqa: BLE001
        return 0


def digits_only(text: str) -> str:
    return re.sub(r"[^0-9]", "", str(text or ""))


# ---------------------------------------------------------------------------
# Frontend (candidate worktree next dev, pinned at the scratch backend)
# ---------------------------------------------------------------------------
def start_frontend(wt: Path, fe_port: int, api_url: str) -> dict:
    fe_dir = wt / "frontend-nextjs"
    env_local = fe_dir / ".env.local"
    backup = fe_dir / ".env.local.composed_backup"
    out: dict = {"dir": str(fe_dir), "port": fe_port, "api_url": api_url,
                 "env_local_rewritten": False, "env_local_backup": None}
    try:
        if env_local.exists() and not backup.exists():
            shutil.copy2(env_local, backup)
            out["env_local_backup"] = str(backup)
        env_local.write_text(
            f"NEXT_PUBLIC_API_URL={api_url}\n"
            f"NEXTAUTH_URL=http://localhost:{fe_port}\n")
        out["env_local_rewritten"] = True
    except Exception as exc:  # noqa: BLE001
        out["env_local_error"] = f"{type(exc).__name__}: {exc}"
    env = dict(os.environ)
    env["NEXT_PUBLIC_API_URL"] = api_url
    env["NEXTAUTH_URL"] = f"http://localhost:{fe_port}"
    env["NODE_OPTIONS"] = "--max-old-space-size=4096"
    fe_log = open(fe_dir.parent / "evidence" / "composed_job"
                  / "frontend_dev.log", "w")
    proc = subprocess.Popen(
        [str(fe_dir / "node_modules" / ".bin" / "next"), "dev",
         "-p", str(fe_port)],
        cwd=str(fe_dir), env=env,
        stdout=fe_log, stderr=subprocess.STDOUT)
    out["pid"] = proc.pid
    out["log"] = str(getattr(fe_log, "name", ""))
    up = qs._wait_http(f"http://localhost:{fe_port}", 300)
    out["up"] = up
    return out


# ---------------------------------------------------------------------------
# Canvas-page turn driver (browser chat bound to the canvas context)
# ---------------------------------------------------------------------------
def _canvas_input(page, timeout_s: float = 120):
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        box = page.get_by_placeholder("Ask the agent to edit")
        if box.count():
            return box.first
        page.wait_for_timeout(1000)
    return None


def canvas_send(page, text: str) -> dict:
    box = _canvas_input(page)
    if box is None:
        return {"sent": False, "error": "chat input not found"}
    box.click()
    box.fill(text)
    page.wait_for_timeout(300)
    btn = page.locator('button[aria-label="Send message"]')
    if btn.count() and btn.first.is_enabled():
        btn.first.click()
    else:
        page.keyboard.press("Enter")
    return {"sent": True, "sent_at": _now()}


def canvas_turn(page, cap: qs.Capture, text: str,
                timeout_ms: int = TURN_TIMEOUT_MS) -> dict:
    """One canvas-page chat turn; the FULL response JSON via expect_response."""
    before = len(cap.responses_to("/api/chat/message"))
    t0 = _now()
    out: dict = {"ask": text, "sent_at": t0}
    try:
        with page.expect_response(
                lambda r: "/api/chat/message" in r.url
                and r.request.method == "POST",
                timeout=timeout_ms) as resp_info:
            sent = canvas_send(page, text)
            out.update(sent)
        resp = resp_info.value
        out["http"] = resp.status
        try:
            doc = resp.json()
        except Exception:  # noqa: BLE001
            doc = {}
        out["success"] = doc.get("success")
        out["message"] = _truncate(doc.get("message"), 2500)
        out["session_id"] = doc.get("session_id")
        out["execution_id"] = doc.get("execution_id")
        out["outcome"] = doc.get("outcome")
        out["error_code"] = doc.get("error_code")
        out["provider"] = doc.get("provider")
        out["model"] = doc.get("model")
        out["latency_s"] = round(_now() - t0, 2)
        out["failed_request"] = bool(doc.get("success") is not True
                                     or resp.status != 200)
    except Exception as exc:  # noqa: BLE001
        out["error"] = f"{type(exc).__name__}: {_truncate(exc, 300)}"
        out["failed_request"] = True
        out["latency_s"] = round(_now() - t0, 2)
    out["responses_after"] = len(cap.responses_to("/api/chat/message")) - before
    page.wait_for_timeout(1500)
    return out


def panel_tail(page, limit: int = 1200) -> str:
    try:
        panel = page.locator('[data-testid="canvas-side-panel"]')
        if panel.count():
            return _truncate(panel.first.inner_text(timeout=5000), limit)
    except Exception:  # noqa: BLE001
        pass
    return ""


# ---------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wt", required=True, help="candidate worktree root")
    ap.add_argument("--sha", default=SUBJECT)
    args = ap.parse_args()

    wt = Path(args.wt).resolve()
    evid = wt / "evidence" / "composed_job"
    evid.mkdir(parents=True, exist_ok=True)

    qs.WT_ROOT = wt
    qs.BACKEND = wt / "backend"
    qs.FRONTEND = wt / "frontend-nextjs"
    qs.EVID_DIR = evid
    qs.PINNED_BE_PORT = BE_PORT
    qs.PINNED_FE_PORT = FE_PORT
    qs.BE_BASE = f"http://127.0.0.1:{BE_PORT}"
    qs.FE_BASE = f"http://localhost:{FE_PORT}"
    qs.FIXTURE = evid / "fixtures" / "approved_records_q2026_114.txt"
    qs.FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    qs.FIXTURE.write_text(APPROVED_DOC)

    from playwright.sync_api import sync_playwright

    ev: dict = {
        "journey": "composed-user-job-spine",
        "phase": "E-composed",
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "harness": {"file": str(HERE),
                    "sha256": hashlib.sha256(HERE.read_bytes()).hexdigest(),
                    "protocol": "docs/acceptance/"
                                "COMPOSED_JOB_PROTOCOL_2026-10-17.md"},
        "frozen_candidate": args.sha,
        "worktree": str(wt),
        "effective_config": {
            "provider_mode": "hybrid (cloud edit-plan rung + local reply lane)",
            "local_only": "false",
            "reply_lane": "product-registered local ollama llama3.1:8b "
                          "(wizard Card A)",
            "planning_lane_cloud_backed": True,
            "edit_plan_pin": PIN_SPEC,
        },
        "versions": {},
    }
    for pkg in ("pyarrow", "numpy", "lancedb", "playwright", "cryptography"):
        try:
            ev["versions"][pkg] = md.version(pkg)
        except Exception:  # noqa: BLE001
            ev["versions"][pkg] = None

    checks: dict = {}
    pin_key = ""
    error = None
    try:
        # ---------------- S0 preflight -------------------------------------
        head = subprocess.run(["git", "-C", str(wt), "rev-parse", "HEAD"],
                              capture_output=True, text=True,
                              timeout=15).stdout.strip()
        dirt = subprocess.run(["git", "-C", str(wt), "status", "--porcelain"],
                              capture_output=True,
                              text=True, timeout=15).stdout.splitlines()
        tracked_dirt = [l for l in dirt if not l.startswith("??")]
        checks["s0-sha-guard"] = head.startswith(args.sha) and not tracked_dirt
        ev["sha_guard"] = {"head": head, "tracked_dirt": tracked_dirt[:10]}
        pin_probe: dict = {}
        try:
            pin_key = _dev_pin_key()
            pin_probe = pin_live_probe(pin_key)
        except Exception as exc:  # noqa: BLE001
            pin_probe = {"ok": False, "error": f"{type(exc).__name__}"}
        ev["pin_credential"] = {"decrypts": bool(pin_key),
                                "live_probe": pin_probe}
        checks["s0-pin-key-live"] = bool(pin_probe.get("ok"))

        # ---------------- scratch world ------------------------------------
        extra_env = {
            "ATOM_LOCAL_ONLY": "false",
            "OLLAMA_BASE_URL": "http://localhost:11434/v1",
            "OLLAMA_HOST": "http://localhost:11434",
            "OLLAMA_MODEL": "llama3.1:8b",
            "ATOM_ASYNC_EDIT_PLAN_MODEL": PIN_SPEC,
            "ADDITIONAL_ALLOWED_ORIGINS":
                f"http://localhost:{FE_PORT},http://127.0.0.1:{FE_PORT}",
            **{name: "" for name in JR.CREDENTIAL_ENV_NAMES},
        }
        server = JR.ScratchServer("composed", allowlisted=True,
                                  preferred_port=BE_PORT, extra_env=extra_env)
        ev["world"] = server.evidence_identity()
        boot = server.up()
        ev["boot"] = boot
        checks["s0-scratch-world-booted"] = bool(boot.get("booted"))

        fe = start_frontend(wt, FE_PORT, f"http://127.0.0.1:{BE_PORT}")
        ev["frontend"] = {k: v for k, v in fe.items() if k != "pid"}
        checks["s0-frontend-up"] = bool(fe.get("up"))

        user = JR.new_user(server.base)
        token, uid = user.get("token"), user.get("id")
        ev["product_user"] = {"registered": bool(user.get("registered")),
                              "email": user.get("email"), "id": uid}
        checks["s1-fresh-user-registered"] = bool(user.get("registered"))

        ev["pin_mount"] = mount_pin_provider(server.base, token, pin_key)
        checks["s2-pin-mounted"] = bool(ev["pin_mount"].get("stored")
                                        and ev["pin_mount"].get("decrypts"))

        seed = canvas_seed(server.base, token, DRAFT_TITLE, DRAFT_CONTENT)
        cid = seed.get("canvas_id")
        ev["canvas"] = {"seed": seed, "id": cid}
        checks["s2-canvas-seeded"] = bool(cid and seed.get("seeded_matches"))

        audit0 = audit_rows(server.resolved_db_path, cid)
        ev["canvas"]["audit_after_seed"] = len(audit0)

        # ---------------- browser -------------------------------------------
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ev["browser_version"] = browser.version
            ctx = browser.new_context(viewport={"width": 1440, "height": 960})
            page = ctx.new_page()
            cap = qs.Capture(page, qs.BE_BASE)

            s1: dict = {}
            s1["login"] = qs.do_login(page, user)
            s1["login_200"] = any(r.get("status") == 200 for r in
                                  cap.responses_to("/api/auth/login"))
            checks["s1-fresh-user-signin"] = bool(s1["login_200"])
            s1["wizard"] = qs.walk_wizard(page, {})
            checks["s1-wizard-present"] = bool(
                (s1["wizard"].get("overlay_discovered") or {}).get("found"))
            readiness, _kind = qs.wait_for_overlay(page, 120)
            s1["completion"] = qs.completion_click(page, readiness, cap, {})
            checks["s1-completion-overlay-closed"] = bool(
                s1["completion"].get("overlay_closed_at")
                and not s1["completion"].get("overlay_still_open"))
            s1["onboarding_status"] = qs.page_api(
                page, "/api/onboarding/status")
            status_body = s1["onboarding_status"].get("body") or {}
            s1["onboarding_completed"] = bool(
                status_body.get("onboarding_completed")
                or ((status_body.get("data") or {})
                    .get("onboarding_completed")))
            checks["s1-completion-persisted"] = s1["onboarding_completed"]

            store_posts = cap.requests_to("/api/ai/providers/ollama/keys",
                                          "POST")
            store_responses = cap.responses_to("/api/ai/providers/ollama/keys")
            s1["ollama_store_posts"] = len(store_posts)
            s1["ollama_store_200"] = any(
                r.get("status") == 200 for r in store_responses)
            try:
                payload = json.loads(
                    str((store_posts[0] if store_posts else {}).get(
                        "post_data") or "{}"))
            except Exception:  # noqa: BLE001
                payload = {}
            s1["store_payload"] = payload
            s1["canonical_payload"] = (str(payload.get("key_name")) == "default"
                                       and bool(payload.get("label")))
            s1["store_post_count_before_chat"] = len(store_posts)
            checks["s1-no-settings-resave-needed"] = (
                s1["ollama_store_posts"] == 1 and s1["ollama_store_200"]
                and s1["canonical_payload"])
            providers = qs.page_api(page, "/api/ai/providers")
            prov = {}
            try:
                for p in (((providers.get("body") or {}).get("data") or {})
                          .get("providers") or []):
                    if (p.get("provider") or {}).get("id") == "ollama":
                        prov = {"has_tenant_key": p.get("has_tenant_key"),
                                "status": p.get("status")}
            except Exception:  # noqa: BLE001
                pass
            s1["ollama_provider"] = prov
            checks["s1-provider-active"] = bool(
                prov.get("has_tenant_key") and prov.get("status") == "active")
            try:
                page.screenshot(path=str(evid / "spine_s1_setup_done.png"))
            except Exception:  # noqa: BLE001
                pass
            ev["s1_setup"] = s1

            # S2 — upload approved records through the Documents UI
            s2: dict = {}
            page.goto(f"{qs.FE_BASE}/documents",
                      wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(4000)
            s2["file_input_found"] = page.locator("#file-upload").count() > 0
            if s2["file_input_found"]:
                page.set_input_files("#file-upload", str(qs.FIXTURE))
                deadline = time.monotonic() + 240
                while time.monotonic() < deadline:
                    text = qs.body_text(page)
                    if "Successfully uploaded" in text or \
                            "uploaded successfully" in text.lower():
                        s2["success_text_seen"] = True
                        break
                    if any(r.get("status", 0) >= 400 for r in
                           cap.responses_to("/api/documents/upload")):
                        break
                    page.wait_for_timeout(1000)
            ups = cap.responses_to("/api/documents/upload")
            s2["upload_responses"] = ups
            s2["upload_200"] = any(r.get("status") == 200 for r in ups)
            doclist = qs.page_api(page, "/api/documents")
            try:
                body = doclist.get("body")
                items = body.get("data") if isinstance(body, dict) else body
                s2["fixture_in_list"] = any(
                    "approved_records" in json.dumps(it).lower()
                    for it in (items or []))
            except Exception:  # noqa: BLE001
                s2["fixture_in_list"] = None
            checks["s2-document-uploaded-durable"] = bool(
                s2["upload_200"] and s2["fixture_in_list"])
            try:
                page.screenshot(
                    path=str(evid / "spine_s2_documents_uploaded.png"))
            except Exception:  # noqa: BLE001
                pass
            ev["s2_upload"] = s2

            # S3 — compare on the canvas page (zero writes)
            page.goto(f"{qs.FE_BASE}/canvas/{cid}",
                      wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(3000)
            ev["s3_input_found"] = _canvas_input(page, 120) is not None
            canvas_before3 = canvas_read(server.base, token, cid)
            s3 = canvas_turn(page, cap, ASK_COMPARE)
            s3["panel_tail"] = panel_tail(page)
            s3_canvas = canvas_read(server.base, token, cid)
            audit3 = audit_rows(server.resolved_db_path, cid)
            s3["canvas_after"] = _truncate(s3_canvas, 800)
            s3["audit_after"] = len(audit3)
            txt3 = (str(s3.get("message") or "") + " " + s3["panel_tail"]).lower()
            s3["mismatch_identified"] = (
                "2026-12-31" in txt3 or "12-31" in txt3) and (
                "2026-11-30" in txt3 or "11-30" in txt3
                or "mismatch" in txt3 or "does not match" in txt3
                or "differ" in txt3 or "discrepan" in txt3)
            checks["s3-reply-received"] = bool(s3.get("success") is True)
            checks["s3-mismatch-identified"] = bool(s3.get("mismatch_identified"))
            checks["s3-zero-writes"] = (
                len(audit3) == len(audit0)
                and s3_canvas.strip() == canvas_before3.strip())
            try:
                page.screenshot(path=str(evid / "spine_s3_compare.png"))
            except Exception:  # noqa: BLE001
                pass
            ev["s3_compare"] = {k: v for k, v in s3.items()
                                if k not in ("message",)}

            # S4 — authorized edit: exactly once + readback
            s4 = canvas_turn(page, cap, ASK_EDIT)
            s4["panel_tail"] = panel_tail(page)
            canvas4 = canvas_read(server.base, token, cid)
            audit4 = audit_rows(server.resolved_db_path, cid)
            s4["audit_after"] = len(audit4)
            s4["canvas_after"] = _truncate(canvas4, 800)
            s4["canvas_updated"] = ("2026-12-31" in canvas4
                                    and "2026-11-30" not in canvas4)
            s4["one_audit_write"] = len(audit4) == len(audit3) + 1
            s4["reply_truthful"] = bool(
                s4.get("success") is True
                and "2026-12-31" in str(s4.get("message") or ""))
            checks["s4-reply-received"] = bool(s4.get("success") is True)
            checks["s4-canvas-updated-readback"] = bool(s4["canvas_updated"])
            checks["s4-exactly-one-audit-write"] = bool(s4["one_audit_write"])
            checks["s4-reply-truthful-update"] = bool(s4["reply_truthful"])
            try:
                page.screenshot(path=str(evid / "spine_s4_edit_readback.png"))
            except Exception:  # noqa: BLE001
                pass
            ev["s4_edit"] = {k: v for k, v in s4.items()
                             if k not in ("message",)}
            ev["s4_reply_message"] = s4.get("message")

            # S5 — calculation on the approved price (zero writes).
            # F-C3: the plain ask runs first (preserved); a single
            # predeclared re-phrase with the J5 structured shape runs only
            # when the plain attempt failed to supply the total.
            s5: dict = {}
            s5["attempt_plain"] = canvas_turn(page, cap, ASK_CALC)
            txt5a = digits_only(str(s5["attempt_plain"].get("message") or "")
                                + " " + panel_tail(page))
            s5["plain_total_correct"] = "96000" in txt5a
            attempts5 = [s5["attempt_plain"]]
            if not s5["plain_total_correct"]:
                s5["attempt_structured"] = canvas_turn(
                    page, cap, ASK_CALC_STRUCTURED)
                attempts5.append(s5["attempt_structured"])
            s5["retried"] = len(attempts5) > 1
            s5["attempts_recorded"] = len(attempts5)
            final5 = attempts5[-1]
            s5.update({k: v for k, v in final5.items()
                       if k in ("success", "http", "outcome", "error_code",
                                "model", "provider", "latency_s",
                                "failed_request", "session_id",
                                "execution_id")})
            s5["panel_tail"] = panel_tail(page)
            audit5 = audit_rows(server.resolved_db_path, cid)
            s5["audit_after"] = len(audit5)
            txt5 = digits_only(str(final5.get("message") or "") + " "
                               + s5["panel_tail"])
            s5["total_correct"] = "96000" in txt5
            checks["s5-reply-received"] = bool(final5.get("success") is True)
            checks["s5-total-correct"] = bool(s5["total_correct"])
            checks["s5-zero-writes"] = len(audit5) == len(audit4)
            ev["s5_calc"] = {k: v for k, v in s5.items()
                             if k not in ("panel_tail",)}
            ev["s5_attempt_messages"] = [
                _truncate(a.get("message"), 800) for a in attempts5]
            ev["s5_reply_message"] = final5.get("message")

            # S6 — deliberate interruption during a second authorized edit
            s6: dict = {}
            user_row0 = user_msg_count(server.resolved_db_path, "Net 45")
            send6 = canvas_send(page, ASK_EDIT2)
            s6["send"] = send6
            accepted = False
            poll_t0 = _now()
            deadline = poll_t0 + 25
            while time.monotonic() < deadline:
                if user_msg_count(server.resolved_db_path, "Net 45") > user_row0:
                    accepted = True
                    break
                page.wait_for_timeout(250)
            s6["turn_accepted_before_kill"] = accepted
            s6["accepted_after_s"] = round(_now() - poll_t0, 2)
            killed_at = None
            if accepted:
                killed_at = _now()
                server.proc.kill()  # SIGKILL — deliberate crash
                s6["killed_at_delta_s"] = round(killed_at - poll_t0, 2)
            page.wait_for_timeout(3000)
            s6["page_text_after_crash"] = qs._truncate(qs.body_text(page), 800)
            try:
                page.screenshot(path=str(evid / "spine_s6_crash_state.png"))
            except Exception:  # noqa: BLE001
                pass
            crash_resp = [r for r in cap.responses_to("/api/chat/message")
                          if r.get("t", 0) >= send6.get("sent_at", 0)]
            s6["response_arrived_before_kill"] = len(crash_resp) > 0
            audit_crash: list = []
            try:
                # server is dead; read the DB directly
                audit_crash = audit_rows(server.resolved_db_path, cid)
            except Exception:  # noqa: BLE001
                pass
            s6["audit_after_crash"] = len(audit_crash)
            s6["crash_state_honest"] = len(audit_crash) in (
                len(audit4), len(audit4) + 1)
            checks["s6-turn-accepted-before-kill"] = bool(accepted)
            checks["s6-killed-in-flight"] = bool(
                killed_at and not s6["response_arrived_before_kill"])
            checks["s6-crash-state-honest"] = bool(s6["crash_state_honest"])

            restart = server.restart()
            s6["restart"] = restart
            checks["s6-restart-healthy"] = bool(restart.get("booted"))
            page.reload(wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(8000)
            _canvas_input(page, 180)
            canvas_after_restart = canvas_read(server.base, token, cid)
            s6["canvas_after_restart_terms"] = (
                "Net 45" if "Net 45" in canvas_after_restart
                else ("Net 30" if "Net 30" in canvas_after_restart
                      else "unexpected"))
            s6["canvas_after_restart"] = _truncate(canvas_after_restart, 800)

            re_send = canvas_turn(page, cap, ASK_EDIT2)
            s6["resend"] = {k: v for k, v in re_send.items()
                            if k not in ("message",)}
            s6["resend_message"] = re_send.get("message")
            canvas_final6 = canvas_read(server.base, token, cid)
            audit_final6 = audit_rows(server.resolved_db_path, cid)
            low6 = canvas_final6.lower()
            s6["terms_converged"] = (
                low6.count("net 45") == 1 and "net 30" not in low6)
            s6["valid_until_intact"] = ("2026-12-31" in canvas_final6
                                        and "2026-11-30" not in canvas_final6)
            s6["final_audit"] = len(audit_final6)
            s6["audit_converged"] = len(audit_final6) == len(audit4) + 1
            checks["s6-resend-reply-received"] = bool(
                re_send.get("success") is True)
            checks["s6-terms-converged-exactly-once"] = bool(
                s6["terms_converged"])
            checks["s6-valid-until-intact"] = bool(s6["valid_until_intact"])
            checks["s6-audit-converged"] = bool(s6["audit_converged"])
            try:
                page.screenshot(path=str(evid / "spine_s6_converged.png"))
            except Exception:  # noqa: BLE001
                pass
            ev["s6_interruption"] = s6

            # S7 — continue without repeating completed work
            s7 = canvas_turn(page, cap, ASK_CONTINUE)
            s7["panel_tail"] = panel_tail(page)
            canvas7 = canvas_read(server.base, token, cid)
            audit7 = audit_rows(server.resolved_db_path, cid)
            s7["audit_after"] = len(audit7)
            txt7 = str(s7.get("message") or "").lower()
            s7["current_matches"] = "2026-12-31" in txt7 and any(
                w in txt7 for w in ("match", "consistent", "same",
                                    "confirm", "yes", "agrees"))
            checks["s7-reply-received"] = bool(s7.get("success") is True)
            checks["s7-current-value-matches"] = bool(s7["current_matches"])
            checks["s7-zero-new-work"] = (
                len(audit7) == len(audit_final6)
                and canvas7.strip() == canvas_final6.strip())
            ev["s7_continue"] = {k: v for k, v in s7.items()
                                 if k not in ("message",)}
            ev["s7_reply_message"] = s7.get("message")

            # Final reload readback
            page.reload(wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(8000)
            canvas_reload = canvas_read(server.base, token, cid)
            ev["final_reload"] = {
                "canvas": _truncate(canvas_reload, 800),
                "wizard_present": qs.overlay_of(page)[0] is not None,
            }
            checks["final-reload-agrees"] = (
                "2026-12-31" in canvas_reload and "Net 45" in canvas_reload
                and "2026-11-30" not in canvas_reload)
            checks["final-no-wizard"] = not ev["final_reload"]["wizard_present"]
            try:
                page.screenshot(
                    path=str(evid / "spine_final_reload.png"))
            except Exception:  # noqa: BLE001
                pass

            failed_turns = [s.get("ask") for s in
                            (s3, s4, s5, re_send, s7)
                            if s.get("failed_request")]
            checks["no-failed-requests"] = len(failed_turns) == 0
            ev["failed_turns"] = failed_turns
            ev["console_tail"] = cap.summary(since=0)["console"][-15:]
            ev["page_errors"] = cap.summary(since=0)["page_errors"]
            ctx.close()
            browser.close()

        # tear down the scratch world after evidence capture
        ev["world_final"] = {"db": server.resolved_db_path,
                             "audit_total": len(audit_rows(
                                 server.resolved_db_path, cid)),
                             "log_tail": _truncate(server.log_tail(60), 3000)}
        server.stop()
    except Exception as exc:  # noqa: BLE001 — evidence is written either way
        error = f"{type(exc).__name__}: {exc}"
        import traceback
        ev["traceback"] = traceback.format_exc()[-2500:]
        try:
            server.stop()  # noqa: F821 — best-effort teardown
        except Exception:  # noqa: BLE001
            pass
    finally:
        if pin_key:
            ev = json.loads(_scrub(json.dumps(ev, default=str), pin_key))

    if error:
        ev["error"] = error
    ev["checks"] = checks
    ev["pass"] = all(checks.values())
    ev["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                      time.gmtime())
    out = evid / (f"browser_composed_job_{time.strftime('%Y%m%d_%H%M%S')}_"
                  f"{os.urandom(3).hex()}.json")
    out.write_text(json.dumps(ev, indent=1, default=str))
    print(json.dumps({"pass": ev["pass"],
                      "failing": {k: v for k, v in checks.items()
                                  if v is False},
                      "checks_total": len(checks)}, indent=1))
    print("evidence:", out)
    return 0 if ev["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
