#!/usr/bin/env python3
"""DEPLOYMENT SMOKE — beyond-navigation checks on the SERVED app (:8001).

Run after the controlled restart of the live backend. Establishes, through
the actual product surfaces, that the deployed build works beyond
navigation:

  1. login page -> product sign-in -> dashboard (the app shell loads);
  2. onboarding wizard Card A activates the local runtime through the UI
     (one store POST; provider active);
  3. one USEFUL SOURCED ANSWER: upload a fixture document via the Documents
     UI, ask a grounded question on the chat page, verify the answer uses
     the document and is attributed;
  4. one SAVED EDIT/READBACK: seed a draft canvas through the product API,
     ask for an authorized edit from the canvas page, verify the edit
     applied (readback) with exactly one audit write.

Artifacts created in the live world (documented): one smoke user, one
uploaded document, one canvas, its audit row. The evidence JSON +
screenshots are written under journey_matrix/deployment_smoke_<ts>/ and
committed as the deployment record.

Reads the phase-D browser machinery + the composed-job canvas helpers
(imported read-only; no product code is modified).
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

MAIN = Path("/Users/rushiparikh/projects/atom")
HERE = MAIN / "backend" / "scripts" / "orchestration_acceptance"
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(MAIN / "backend"))

import browser_phase_d_quickstart_loop as qs          # noqa: E402
import browser_phase_e_loop as pe                     # noqa: E402
import browser_composed_job as bcj                    # noqa: E402
import journey_runtime as JR                          # noqa: E402

BE_PORT = 8001
# The live backend's CORS allow-list is localhost:3000/3001 (the user's
# real frontend origins) — the smoke runs on 3000, the actual origin.
FE_PORT = 3000
ASK = ("Search my uploaded documents for the launch code for project "
       "Zephyr-9 and tell me the code.")
CANVAS_TITLE = "Deployment smoke draft"
CANVAS_TEXT = (
    "# Deployment smoke draft\n\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")
EDIT_ASK = ("Please update the Valid Until date in this draft to "
            "2026-12-31.")


def _scrub(text: str) -> str:
    text = str(text or "")
    text = re.sub(
        r"eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{4,}",
        "<jwt-redacted>", text)
    text = re.sub(r"(?i)(bearer\s+)[A-Za-z0-9._\-]{10,}",
                  r"\1<redacted>", text)
    text = re.sub(r'(?i)("api_key"\s*:\s*")[^"]{8,}(")',
                  r'\1<redacted>\2', text)
    return re.sub(r"\boc_sk_[A-Za-z0-9_\-]{8,}|\bsk-[A-Za-z0-9]{16,}",
                  "<redacted-key>", text)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--expect-commit", required=True)
    args = ap.parse_args()

    stamp = time.strftime("%Y%m%d_%H%M%S")
    evid = (MAIN / "backend" / "scripts" / "orchestration_acceptance" /
            "journey_matrix" / f"deployment_smoke_{stamp}")
    evid.mkdir(parents=True, exist_ok=True)

    qs.WT_ROOT = MAIN
    qs.BACKEND = MAIN / "backend"
    qs.FRONTEND = MAIN / "frontend-nextjs"
    qs.EVID_DIR = evid
    qs.PINNED_BE_PORT = BE_PORT
    qs.PINNED_FE_PORT = FE_PORT
    qs.BE_BASE = f"http://127.0.0.1:{BE_PORT}"
    qs.FE_BASE = f"http://localhost:{FE_PORT}"
    qs.FIXTURE = evid / "deployment_smoke_fixture.txt"
    qs.FIXTURE.write_text(qs.FIXTURE_TEXT)

    from playwright.sync_api import sync_playwright

    ev: dict = {
        "journey": "deployment-smoke",
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                    time.gmtime()),
        "harness": {"file": str(Path(__file__).resolve()),
                    "sha256": hashlib.sha256(
                        Path(__file__).resolve().read_bytes()).hexdigest()},
        "expected_commit": args.expect_commit,
    }
    checks: dict = {}
    try:
        health = qs._http_json(f"{qs.BE_BASE}/api/health")
        ident = (health.get("body") or {}).get("identity") or {}
        ev["served_identity"] = ident
        checks["served-commit-matches"] = str(
            ident.get("git_commit") or "").startswith(args.expect_commit)

        user = JR.new_user(qs.BE_BASE)
        ev["smoke_user"] = {"email": user.get("email"), "id": user.get("id"),
                            "registered": bool(user.get("registered"))}
        checks["smoke-user-provisioned"] = bool(user.get("registered"))
        token, uid = user.get("token"), user.get("id")

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_context(
                viewport={"width": 1440, "height": 960}).new_page()
            cap = qs.Capture(page, qs.BE_BASE)

            # 1. login -> wizard (Card A) -> dashboard
            s1: dict = {}
            s1["login"] = qs.do_login(page, user)
            s1["login_200"] = any(r.get("status") == 200 for r in
                                  cap.responses_to("/api/auth/login"))
            ev["s1_login_wizard"] = s1
            if not s1["login_200"]:
                # FAIL FAST with the page state: a smoke that cannot sign
                # in must not continue into misleading locator timeouts.
                s1["page_text_head"] = qs._truncate(qs.body_text(page), 300)
                raise RuntimeError(
                    "smoke sign-in failed (frontend API base reachable? "
                    f"page: {s1['page_text_head'][:160]!r})")
            s1["wizard"] = qs.walk_wizard(page, {})
            ready, _ = qs.wait_for_overlay(page, 120)
            s1["completion"] = qs.completion_click(page, ready, cap, {})
            checks["login-dashboard"] = bool(s1["login_200"]) and bool(
                s1["completion"].get("overlay_closed_at"))
            store_posts = cap.requests_to("/api/ai/providers/ollama/keys",
                                          "POST")
            s1["store_posts"] = len(store_posts)
            providers = qs.page_api(page, "/api/ai/providers")
            prov = {}
            for p in (((providers.get("body") or {}).get("data") or {})
                      .get("providers") or []):
                if (p.get("provider") or {}).get("id") == "ollama":
                    prov = {"has_tenant_key": p.get("has_tenant_key"),
                            "status": p.get("status")}
            s1["ollama_provider"] = prov
            checks["provider-active-via-ui"] = bool(
                prov.get("has_tenant_key") and prov.get("status") == "active"
                and len(store_posts) == 1)
            ev["s1_login_wizard"] = s1

            # 2. useful sourced answer (upload via UI, ask on chat)
            up: dict = {}
            page.goto(f"{qs.FE_BASE}/documents",
                      wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(3000)
            up["file_input_found"] = page.locator("#file-upload").count() > 0
            if up["file_input_found"]:
                page.set_input_files("#file-upload", str(qs.FIXTURE))
                deadline = time.monotonic() + 240
                while time.monotonic() < deadline:
                    if any(r.get("status") == 200 for r in
                           cap.responses_to("/api/documents/upload")):
                        up["upload_200"] = True
                        break
                    page.wait_for_timeout(1000)
            ev["upload"] = up
            page.goto(f"{qs.FE_BASE}/chat",
                      wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(3000)
            turn = pe._run_chat_turn(page, cap, uid, ASK)
            ev["sourced_answer"] = {
                k: turn.get(k) for k in
                ("answer_text", "non_answer_reason", "waited_seconds",
                 "history_msgs_count")}
            low = str(turn.get("answer_text") or "").lower()
            checks["useful-sourced-answer"] = (
                bool(up.get("upload_200"))
                and "quartz-77" in low
                and not turn.get("non_answer_reason"))
            try:
                page.screenshot(path=str(evid / "smoke_sourced_answer.png"))
            except Exception:  # noqa: BLE001
                pass

            # 3. saved edit/readback (seed through product API, edit from
            #    the canvas page, authoritative readback + audit count)
            seed = bcj.canvas_seed(qs.BE_BASE, token, CANVAS_TITLE,
                                   CANVAS_TEXT)
            cid = seed.get("canvas_id")
            ev["canvas_seed"] = {k: v for k, v in seed.items()}
            _live_db = str(MAIN / "backend" / "data" / "atom.db")
            audit_before = bcj.audit_rows(_live_db, cid)
            page.goto(f"{qs.FE_BASE}/canvas/{cid}",
                      wait_until="domcontentloaded", timeout=240000)
            page.wait_for_timeout(3000)
            edit: dict = {}
            edit["input_found"] = bcj._canvas_input(page, 120) is not None
            if edit["input_found"]:
                edit.update(bcj.canvas_turn(page, cap, EDIT_ASK))
            canvas_after = bcj.canvas_read(qs.BE_BASE, token, cid)
            audit_after = bcj.audit_rows(_live_db, cid)
            edit["canvas_has_new_value"] = (
                "2026-12-31" in canvas_after
                and "2026-11-30" not in canvas_after)
            edit["audit_delta"] = len(audit_after) - len(audit_before)
            ev["saved_edit"] = {k: v for k, v in edit.items()
                                if k != "message"}
            ev["saved_edit_reply"] = edit.get("message")
            checks["saved-edit-readback"] = (
                bool(edit.get("input_found"))
                and bool(edit.get("canvas_has_new_value"))
                and edit.get("audit_delta") == 1)
            try:
                page.screenshot(
                    path=str(evid / "smoke_saved_edit.png"))
            except Exception:  # noqa: BLE001
                pass
            browser.close()

        ev["versions"] = {}
        for pkg in ("pyarrow", "playwright", "cryptography"):
            try:
                ev["versions"][pkg] = md.version(pkg)
            except Exception:  # noqa: BLE001
                ev["versions"][pkg] = None
    except Exception as exc:  # noqa: BLE001 — evidence either way
        import traceback
        ev["error"] = f"{type(exc).__name__}: {exc}"
        ev["traceback"] = traceback.format_exc()[-2000:]

    ev["checks"] = checks
    _required = ("served-commit-matches", "smoke-user-provisioned",
                 "login-dashboard", "provider-active-via-ui",
                 "useful-sourced-answer", "saved-edit-readback")
    ev["pass"] = (
        all(checks.get(k) is True for k in _required))
    ev["required_checks"] = list(_required)
    ev["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                      time.gmtime())
    out = evid / f"deployment_smoke_{stamp}.json"
    out.write_text(json.dumps(json.loads(_scrub(json.dumps(ev,
                                                           default=str))),
                              indent=1))
    print(json.dumps({"pass": ev["pass"], "checks": checks,
                      "evidence": str(out)}, indent=1))
    return 0 if ev["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
