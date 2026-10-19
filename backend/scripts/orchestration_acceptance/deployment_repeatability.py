#!/usr/bin/env python3
"""REPEATABILITY & VALUE EVALUATION — deployed build (:8001), N=3.

Predeclared protocol: docs/acceptance/REPEATABILITY_EVALUATION_PROTOCOL_2026-10-17.md
(committed BEFORE this run).

Per repetition: a FRESH ordinary product user -> sign-in -> wizard Card A
-> upload fixture -> grounded sourced answer -> fresh draft canvas ->
authorized edit -> readback + audit. Records per-step wall-clock, per-turn
settled states, provider/model attribution, friction (clarifications,
non-answers, forced extra actions). The live world is the test world;
artifacts (users, fixtures, canvases) are documented by the run JSON.

Read-only wrt product code: reuses the phase-D browser machinery, the
phase-E chat turn, and the composed-job canvas helpers.
"""
from __future__ import annotations

import argparse
import hashlib
import json
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
FE_PORT = 3000
LIVE_DB = str(MAIN / "backend" / "data" / "atom.db")
ASK = ("Search my uploaded documents for the launch code for project "
       "Zephyr-9 and tell me the code.")
CANVAS_TEXT = (
    "# Repeatability draft\n\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")
EDIT_ASK = "Please update the Valid Until date in this draft to 2026-12-31."
MINIMAL_USER_ACTIONS = 5     # sign-up, wizard, upload, ask, edit-ask


def _scrub(text: str) -> str:
    text = str(text or "")
    text = re.sub(r"eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\."
                  r"[A-Za-z0-9_\-]{4,}", "<jwt-redacted>", text)
    text = re.sub(r"(?i)(bearer\s+)[A-Za-z0-9._\-]{10,}",
                  r"\1<redacted>", text)
    return re.sub(r"\boc_sk_[A-Za-z0-9_\-]{8,}|\bsk-[A-Za-z0-9]{16,}",
                  "<redacted-key>", text)


def _rep(page, cap, browser_unused, idx: int, evid: Path) -> dict:
    rep: dict = {"repetition": idx, "steps": {}, "friction": []}
    t_rep = time.monotonic()

    qs.FIXTURE = evid / f"repeatability_fixture_r{idx}.txt"
    qs.FIXTURE.write_text(qs.FIXTURE_TEXT)

    user = JR.new_user(qs.BE_BASE)
    rep["user"] = {"email": user.get("email"),
                   "registered": bool(user.get("registered"))}
    token, uid = user.get("token"), user.get("id")
    if not user.get("registered"):
        rep["friction"].append("registration failed")
        return rep

    # T0 sign-in
    t0 = time.monotonic()
    login = qs.do_login(page, user)
    rep["steps"]["T0_signin_s"] = round(time.monotonic() - t0, 1)
    rep["steps"]["T0_login_200"] = any(
        r.get("status") == 200 for r in cap.responses_to("/api/auth/login"))
    if not rep["steps"]["T0_login_200"]:
        rep["friction"].append("sign-in failed")
        return rep

    # T1 wizard Card A + completion
    t0 = time.monotonic()
    wizard = qs.walk_wizard(page, {})
    ready, _ = qs.wait_for_overlay(page, 120)
    completion = qs.completion_click(page, ready, cap, {})
    rep["steps"]["T1_wizard_s"] = round(time.monotonic() - t0, 1)
    rep["steps"]["T1_completed"] = bool(completion.get("overlay_closed_at"))
    store_posts = cap.requests_to("/api/ai/providers/ollama/keys", "POST")
    rep["steps"]["T1_store_posts"] = len(store_posts)
    if not rep["steps"]["T1_completed"]:
        rep["friction"].append("onboarding did not complete")
        return rep

    # T2 upload fixture through the Documents UI
    t0 = time.monotonic()
    page.goto(f"{qs.FE_BASE}/documents", wait_until="domcontentloaded",
              timeout=240000)
    page.wait_for_timeout(3000)
    rep["steps"]["T2_file_input"] = page.locator("#file-upload").count() > 0
    up_ok = False
    if rep["steps"]["T2_file_input"]:
        page.set_input_files("#file-upload", str(qs.FIXTURE))
        deadline = time.monotonic() + 240
        while time.monotonic() < deadline:
            if any(r.get("status") == 200 for r in
                   cap.responses_to("/api/documents/upload")):
                up_ok = True
                break
            page.wait_for_timeout(1000)
    rep["steps"]["T2_upload_s"] = round(time.monotonic() - t0, 1)
    rep["steps"]["T2_upload_200"] = up_ok
    if not up_ok:
        rep["friction"].append("upload did not succeed")

    # T3 grounded sourced answer (one ask — no retries by design)
    page.goto(f"{qs.FE_BASE}/chat", wait_until="domcontentloaded",
              timeout=240000)
    page.wait_for_timeout(3000)
    t0 = time.monotonic()
    turn = pe._run_chat_turn(page, cap, uid, ASK)
    rep["steps"]["T3_ask_s"] = round(time.monotonic() - t0, 1)
    answer = str(turn.get("answer_text") or "")
    low = answer.lower()
    rep["steps"]["T3_answer_head"] = answer[:220]
    rep["steps"]["T3_fact_used"] = "quartz-77" in low
    rep["steps"]["T3_non_answer"] = turn.get("non_answer_reason")
    rep["steps"]["T3_answer_says_provider_needed"] = (
        "you need an ai provider" in low)
    if not rep["steps"]["T3_fact_used"]:
        rep["friction"].append(
            "sourced answer missing the fact"
            + (" (non-answer)" if turn.get("non_answer_reason") else ""))

    # T4/T5 draft canvas + authorized edit + readback + audit
    title = f"Repeatability draft r{idx}"
    seed = bcj.canvas_seed(qs.BE_BASE, token, title, CANVAS_TEXT)
    cid = seed.get("canvas_id")
    rep["steps"]["T4_canvas_seeded"] = bool(seed.get("seeded_matches"))
    audit_before = bcj.audit_rows(LIVE_DB, cid)
    page.goto(f"{qs.FE_BASE}/canvas/{cid}", wait_until="domcontentloaded",
              timeout=240000)
    page.wait_for_timeout(3000)
    t0 = time.monotonic()
    edit: dict = {}
    if bcj._canvas_input(page, 120) is not None:
        edit = bcj.canvas_turn(page, cap, EDIT_ASK)
    rep["steps"]["T5_edit_s"] = round(time.monotonic() - t0, 1)
    canvas_after = bcj.canvas_read(qs.BE_BASE, token, cid)
    audit_after = bcj.audit_rows(LIVE_DB, cid)
    rep["steps"]["T5_edit_success"] = bool(edit.get("success"))
    rep["steps"]["T5_reply"] = str(edit.get("message"))[:200]
    rep["steps"]["T5_readback_updated"] = (
        "2026-12-31" in canvas_after and "2026-11-30" not in canvas_after)
    rep["steps"]["T5_audit_delta"] = len(audit_after) - len(audit_before)
    if not rep["steps"]["T5_readback_updated"]:
        rep["friction"].append("edit readback missing the new value")
    if rep["steps"]["T5_audit_delta"] != 1:
        rep["friction"].append(
            f"audit delta {rep['steps']['T5_audit_delta']} (expected 1)")

    # attribution for the two turns (from captured responses)
    try:
        resp = cap.responses_to("/api/chat/message")
        rep["turn_models"] = [
            (r.get("status"), str(r.get("body_head") or "")[:160])
            for r in resp[-2:]]
    except Exception:  # noqa: BLE001
        rep["turn_models"] = []

    rep["wall_s"] = round(time.monotonic() - t_rep, 1)
    rep["user_actions"] = MINIMAL_USER_ACTIONS
    rep["extra_actions_forced"] = len(rep["friction"])
    rep["green"] = bool(
        rep["steps"].get("T0_login_200")
        and rep["steps"].get("T1_completed")
        and rep["steps"].get("T2_upload_200")
        and rep["steps"].get("T3_fact_used")
        and rep["steps"].get("T4_canvas_seeded")
        and rep["steps"].get("T5_readback_updated")
        and rep["steps"].get("T5_audit_delta") == 1)
    try:
        page.screenshot(path=str(evid / f"repeatability_r{idx}_edit.png"))
    except Exception:  # noqa: BLE001
        pass
    return rep


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--expect-commit", required=True)
    ap.add_argument("--repeats", type=int, default=3)
    args = ap.parse_args()

    stamp = time.strftime("%Y%m%d_%H%M%S")
    evid = (MAIN / "backend" / "scripts" / "orchestration_acceptance" /
            "journey_matrix" / f"repeatability_{stamp}")
    evid.mkdir(parents=True, exist_ok=True)

    qs.WT_ROOT = MAIN
    qs.BACKEND = MAIN / "backend"
    qs.FRONTEND = MAIN / "frontend-nextjs"
    qs.EVID_DIR = evid
    qs.PINNED_BE_PORT = BE_PORT
    qs.PINNED_FE_PORT = FE_PORT
    qs.BE_BASE = f"http://127.0.0.1:{BE_PORT}"
    qs.FE_BASE = f"http://localhost:{FE_PORT}"

    from playwright.sync_api import sync_playwright

    ev: dict = {
        "journey": "repeatability-value-evaluation",
        "protocol": "docs/acceptance/"
                    "REPEATABILITY_EVALUATION_PROTOCOL_2026-10-17.md",
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                    time.gmtime()),
        "harness": {"file": str(Path(__file__).resolve()),
                    "sha256": hashlib.sha256(
                        Path(__file__).resolve().read_bytes()).hexdigest()},
        "expected_commit": args.expect_commit,
        "repeats": args.repeats,
    }
    try:
        health = qs._http_json(f"{qs.BE_BASE}/api/health")
        ident = (health.get("body") or {}).get("identity") or {}
        ev["served_identity"] = ident
        ev["served_commit_matches"] = str(
            ident.get("git_commit") or "").startswith(args.expect_commit)

        reps = []
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            for idx in range(1, args.repeats + 1):
                ctx = browser.new_context(
                    viewport={"width": 1440, "height": 960})
                page = ctx.new_page()
                cap = qs.Capture(page, qs.BE_BASE)
                reps.append(_rep(page, cap, browser, idx, evid))
                ctx.close()
            browser.close()
        ev["repetitions"] = reps
    except Exception as exc:  # noqa: BLE001
        import traceback
        ev["error"] = f"{type(exc).__name__}: {exc}"
        ev["traceback"] = traceback.format_exc()[-2000:]

    reps = ev.get("repetitions") or []
    greens = sum(1 for r in reps if r.get("green"))
    ev["summary"] = {
        "repetitions_run": len(reps),
        "green": greens,
        "median_wall_s": sorted(
            [r.get("wall_s") for r in reps if r.get("wall_s")])[
                len(reps) // 2] if reps else None,
        "total_friction": sum(len(r.get("friction") or []) for r in reps),
        "friction": [f for r in reps for f in (r.get("friction") or [])],
    }
    ev["pass"] = bool(
        ev.get("served_commit_matches")
        and len(reps) == args.repeats
        and greens == args.repeats
        and ev["summary"]["total_friction"] == 0)
    ev["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                      time.gmtime())
    out = evid / f"repeatability_{stamp}.json"
    out.write_text(json.dumps(json.loads(_scrub(json.dumps(ev,
                                                           default=str))),
                              indent=1))
    print(json.dumps({"pass": ev["pass"], "green": f"{greens}/{len(reps)}",
                      "summary": ev["summary"],
                      "evidence": str(out)}, indent=1))
    return 0 if ev["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
