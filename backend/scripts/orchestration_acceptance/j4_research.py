#!/usr/bin/env python3
"""Journey J4 — Research (acceptance contract).

Boundaries (docs/acceptance/ACCEPTANCE_CONTRACT.md), on a PRISTINE code
export with an allowlisted environment:

  J4.source-bound     upload a document through the product (marker +
                      distinctive facts), then a research ask must produce
                      findings BOUND to that source.
  J4.uncertainty      an ask the sources CANNOT answer must preserve
                      uncertainty (honest miss), never fabricate closure.
  J4.survives-reload  the history API after the turns must return what was
                      delivered.

Provider setup is a parameter: today the only reachable chat provider in a
pristine world is an ENVIRONMENT-KEY credential (OPENROUTER_API_KEY via
process env) — separately labeled per the contract: it proves the
research machinery, NOT Settings->AI provider scope (that is J2.real-reply,
blocked on the shared-runtime repair; see the coordination HANDOFF: the
fallback walker skips local_* clients entirely, byok_handler.py:3735).
Runs are recorded with their provider mode; when the repair lands, the
same script re-runs with the product-registered Ollama provider to green.
"""
from __future__ import annotations

import io
import json
import secrets
import sys
import time
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402

MARKER = f"RESEARCH-MARKER-{secrets.token_hex(6)}"
FACT = ("The Solvency II filing deadline for the Hartwell account was "
        "moved to March 14, 2027.")
# Deliberately NOT in any source — the uncertainty probe asks about it.
ABSENT_TOPIC = "the quarterly revenue of the moon colony"


def _doc_text() -> str:
    return (f"# Hartwell compliance memo\n\nMarker: {MARKER}\n\n{FACT}\n\n"
            "Prepared by the compliance desk. Internal use only.\n")


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--pristine", action="store_true", default=True)
    ap.add_argument("--provider", choices=("env-key", "local-product"),
                    default="env-key",
                    help="env-key = OPENROUTER_API_KEY via process env "
                         "(separately-labeled evidence); local-product = "
                         "product-registered Ollama (requires the chat-leg "
                         "provider-scope repair)")
    args = ap.parse_args()

    extra_env: dict = {}
    creds = JR.read_repo_env_names(["OPENROUTER_API_KEY"])
    if args.provider == "env-key":
        if not creds.get("OPENROUTER_API_KEY"):
            print("BLOCKED: no OPENROUTER_API_KEY in repo backend/.env")
            return 2
        extra_env["OPENROUTER_API_KEY"] = creds["OPENROUTER_API_KEY"]

    export = JR.materialize_code_export()
    server = JR.ScratchServer("j4_research", allowlisted=True,
                              code_export=export, extra_env=extra_env)
    ev: dict = {"journey": "J4", "mode": "pristine_code_export",
                "provider_mode": args.provider,
                "provider_scope_label": (
                    "environment-key configuration — separately-labeled "
                    "evidence; does NOT prove Settings->AI provider scope"
                    if args.provider == "env-key" else
                    "product-registered local provider (requires the "
                    "chat-leg repair)"),
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    passed = False
    try:
        boot = server.up()
        ev["boot"] = boot
        if not boot.get("booted"):
            raise RuntimeError("pristine server failed to boot")
        ev["resolved_db_path"] = server.resolved_db_path

        user = JR.new_user(server.base)
        token, uid = user.get("token"), user.get("id")
        if not token:
            raise RuntimeError("register/login failed")

        # SOURCE through the product (same pipeline as J3).
        import httpx
        up = httpx.post(
            f"{server.base}/api/document-ingestion/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (f"hartwell_{MARKER[-6:]}.md",
                            io.BytesIO(_doc_text().encode()),
                            "text/markdown")},
            timeout=120, trust_env=False)
        ev["upload"] = {"http": up.status_code}
        if up.status_code != 200:
            raise RuntimeError(f"upload failed: {up.status_code}")
        time.sleep(2)

        def turn(text: str, timeout_s: float = 300.0) -> dict:
            return JR.auth_post(
                server.base, token, "/api/chat/message",
                {"message": text, "user_id": uid,
                 "request_id": str(uuid.uuid4())},
                timeout_s=timeout_s)

        # --- J4.source-bound ------------------------------------------------
        research = turn("Search my documents for the Hartwell compliance "
                        "memo and tell me its filing deadline.")
        rj = research["json"]
        content = str(rj.get("message") or "")
        ev["research_turn"] = {
            "http": research["http"], "success": rj.get("success"),
            "provider": rj.get("provider"), "model": rj.get("model"),
            "error_code": rj.get("error_code"), "outcome": rj.get("outcome"),
            "content_head": content[:260], "content_len": len(content)}
        # source-bound: the reply must carry the FACT (from the uploaded
        # doc) — marker text itself may be summarized away, the fact binds.
        source_bound = bool(
            rj.get("success") and rj.get("model")
            and ("March 14, 2027" in content or "14 March 2027" in content))

        # --- J4.uncertainty -------------------------------------------------
        absent = turn(f"What does my documentation say about {ABSENT_TOPIC}?")
        aj = absent["json"]
        acontent = str(aj.get("message") or "")
        ev["absent_topic_turn"] = {
            "http": absent["http"], "success": aj.get("success"),
            "provider": aj.get("provider"), "model": aj.get("model"),
            "content_head": acontent[:260]}
        low = acontent.lower()
        hedged = any(h in low for h in ("no ", "not ", "don't", "cannot",
                                        "couldn't", "nothing", "no information",
                                        "no mention", "no documentation"))
        fabricates = ("million" in low and "moon" in low and "billion" in low)
        uncertainty = bool(aj.get("success") and aj.get("model")
                           and hedged and not fabricates)

        # --- J4.survives-reload ---------------------------------------------
        sid = rj.get("session_id")
        reload_texts: list = []
        if sid:
            hist = JR.auth_get(server.base, token,
                               f"/api/chat/history/{sid}", timeout_s=60.0)
            for m in ((hist.get("json") or {}).get("messages") or []):
                if m.get("role") == "assistant":
                    reload_texts.append(str((m.get("response") or {})
                                            .get("message")
                                            or m.get("content") or ""))
        survives = bool(reload_texts) and any(
            "March 14, 2027" in t for t in reload_texts)
        ev["reload"] = {"session_id": sid, "assistant_turns": len(reload_texts),
                        "fact_in_history": survives}

        checks = {
            "J4.source-bound": source_bound,
            "J4.uncertainty": uncertainty,
            "J4.survives-reload": survives,
        }
        ev["assertions"] = checks
        passed = all(checks.values())
        ev["pass"] = passed
        print(json.dumps(checks, indent=1))
    except Exception as exc:  # noqa: BLE001
        ev["pass"] = False
        ev["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        ev["uvicorn_log_tail"] = server.log_tail()
        server.stop()
        out = JR.save_result("j4_research", ev)
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
