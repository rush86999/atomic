#!/usr/bin/env python3
"""Journey J5 — Calculation (acceptance contract).

Boundaries, on a PRISTINE code export with an allowlisted environment:

  J5.binding            inputs bind to the record (the workbook is uploaded
                        through the product; the calculate ask names its
                        rows).
  J5.persist            the engine operation persists as a calculate
                        operation on the task lifecycle record (read-only
                        sqlite verification — the contract's permitted
                        read path).
  J5.readback-agreement the reply agrees with the durable record.

The workbook is a FIXTURE THE JOURNEY UPLOADS (the source under test) —
no connector/source rows are seeded. Provider setup mirrors J4: today
only an environment-key credential can dispatch at all, and it fails on
credits ("All LLM providers failed", see the capability probes); the
turn therefore fails at the provider boundary until the chat-leg repair
(Agent 2) lands. The script re-runs to green afterwards.
"""
from __future__ import annotations

import json
import sys
import time
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402
from scripts.orchestration_acceptance.acceptance_trial_lib import (  # noqa: E402
    job_for_session,
    sqlite_select,
)

ITEM = f"hartwell-retainer-{uuid.uuid4().hex[:6]}"
ROWS = [("item", "qty", "unit_price"),
        (ITEM, "3", "1250"),
        ("other-line", "1", "999")]
EXPECTED_TOTAL = 3 * 1250


def _build_xlsx(path: Path) -> None:
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "billing"
    for row in ROWS:
        ws.append(list(row))
    wb.save(path)


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--turn-timeout", type=float, default=90.0,
                    help="per-turn timeout; the provider-blocked cascade "
                         "takes minutes to fail — keep probes short")
    args = ap.parse_args()

    creds = JR.read_repo_env_names(["OPENROUTER_API_KEY"])
    extra_env = ({"OPENROUTER_API_KEY": creds["OPENROUTER_API_KEY"]}
                 if creds.get("OPENROUTER_API_KEY") else {})
    export = JR.materialize_code_export()
    server = JR.ScratchServer("j5_calculation", allowlisted=True,
                              code_export=export, extra_env=extra_env)
    ev: dict = {"journey": "J5", "mode": "pristine_code_export",
                "provider_mode": "env-key (separately-labeled evidence)",
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    passed = False
    try:
        boot = server.up()
        ev["boot"] = boot
        if not boot.get("booted"):
            raise RuntimeError("pristine server failed to boot")
        user = JR.new_user(server.base)
        token, uid = user.get("token"), user.get("id")
        if not token:
            raise RuntimeError("register/login failed")

        # The workbook SOURCE, uploaded through the product.
        xlsx = server.scratch / "billing.xlsx"
        _build_xlsx(xlsx)
        import httpx
        up = httpx.post(
            f"{server.base}/api/document-ingestion/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("billing.xlsx", xlsx.open("rb"),
                            "application/vnd.openxmlformats-officedocument"
                            ".spreadsheetml.sheet")},
            timeout=180, trust_env=False)
        ev["upload"] = {"http": up.status_code}
        if up.status_code != 200:
            raise RuntimeError(f"workbook upload failed: {up.status_code}")
        time.sleep(2)

        r = JR.auth_post(
            server.base, token, "/api/chat/message",
            {"message": f"Using my uploaded billing workbook, calculate "
                        f"the total cost for {ITEM} (qty times unit_price) "
                        f"and give me the number.",
             "user_id": uid, "request_id": str(uuid.uuid4())},
            timeout_s=args.turn_timeout)
        rj = r["json"]
        content = str(rj.get("message") or "")
        ev["calc_turn"] = {
            "http": r["http"], "success": rj.get("success"),
            "provider": rj.get("provider"), "model": rj.get("model"),
            "error_code": rj.get("error_code"), "outcome": rj.get("outcome"),
            "content_head": content[:260]}
        sid = rj.get("session_id")

        # Durable record: the task lifecycle's operations on this session
        # (read-only sqlite — contract-permitted verification path).
        ops: list = []
        run_id = None
        if sid and server.db_path.exists():
            job = job_for_session(server.db_path, sid)
            if job:
                run_id = job.get("run_id")
                ops = [o.get("operation_type") for o in (job.get("ops") or [])
                       if isinstance(o, dict)]
        ev["record"] = {"run_id": run_id, "operation_types": ops}

        has_calc_op = "calculate" in ops
        agrees = bool(
            rj.get("success") and rj.get("model")
            and (f"{EXPECTED_TOTAL:,}" in content
                 or str(EXPECTED_TOTAL) in content))

        checks = {
            "J5.binding": bool(up.status_code == 200 and sid),
            "J5.persist": has_calc_op,
            "J5.readback-agreement": agrees,
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
        out = JR.save_result("j5_calculation", ev)
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
