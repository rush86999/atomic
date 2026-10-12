#!/usr/bin/env python3
"""Journey J3 — Source connection (acceptance contract, first wave).

Boundaries, all at public APIs on a scratch stack (no direct row seeding —
the document enters through the product's own upload pipeline: parse,
embed, per-workspace LanceDB store, PG IngestedDocument row):

  J3.upload           POST /api/document-ingestion/upload (multipart) as a
                      fresh registered user succeeds.
  J3.authorized-read  GET /api/documents/search?q=<marker> in the SAME
                      user's workspace returns the document (marker found).
  J3.isolation        a SECOND fresh user (own workspace, product-created)
                      searching the same marker must NOT see it.

Boot mode: configuration parity + public API smoke (journey_runtime).
"""
from __future__ import annotations

import io
import json
import secrets
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402

MARKER = f"ACCEPTANCE-MARKER-{secrets.token_hex(8)}"
SENTENCE = ("Quarterly revenue for the journey probe was exactly "
            "one million and twenty four thousand dollars.")


def _search(base: str, token: str, q: str) -> dict:
    r = JR.auth_get(base, token, f"/api/documents/search?q={q}&limit=20",
                    timeout_s=60.0)
    data = r.get("json") or {}
    results = data.get("results") if isinstance(data, dict) else None
    if results is None and isinstance(data, dict):
        inner = data.get("data") or {}
        results = (inner.get("results") if isinstance(inner, dict) else None) or []
    if not isinstance(results, list):
        results = []
    # Marker must appear in the RESULTS array — the envelope echoes the
    # query string, so blob-wide matching trivially "finds" the marker in
    # an empty result set (caught by the first isolation run).
    blob = json.dumps(results, default=str)
    return {"http": r["http"], "n_results": len(results),
            "marker_in_results": MARKER in blob,
            "raw_head": json.dumps(data, default=str)[:260]}


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--pristine", action="store_true",
                    help="run against a git-archive CODE EXPORT with an "
                         "ALLOWLISTED environment (pristine-install "
                         "coverage, not checkout smoke)")
    args = ap.parse_args()

    kwargs = {}
    mode = JR.BOOT_MODE
    if args.pristine:
        export = JR.materialize_code_export()
        kwargs = {"allowlisted": True, "code_export": export}
        mode = "pristine_code_export"
    server = JR.ScratchServer("j3_source_connection", **kwargs)
    ev: dict = {"journey": "J3", "mode": mode,
                "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                            time.gmtime())}
    passed = False
    try:
        boot = server.up()
        ev["boot"] = boot
        if not boot.get("booted"):
            raise RuntimeError("scratch server failed to boot")
        ev["resolved_db_path"] = server.resolved_db_path
        ev["byok_vault_isolated"] = server.byok_vault_isolated

        # --- user A: the authorized workspace ---------------------------
        user_a = JR.new_user(server.base)
        token_a = user_a.get("token")
        if not token_a:
            raise RuntimeError("user A register/login failed")
        ev["user_a"] = {"workspace_id": user_a.get("workspace_id")}

        # --- J3.upload through the product ------------------------------
        content = (f"# Journey probe document\n\n{MARKER}\n\n"
                   f"{SENTENCE}\n\nThe quick brown fox analysis follows.\n"
                   ).encode()
        import httpx
        r = httpx.post(
            f"{server.base}/api/document-ingestion/upload",
            headers={"Authorization": f"Bearer {token_a}"},
            files={"file": (f"journey_probe_{MARKER[-6:]}.md", io.BytesIO(content),
                            "text/markdown")},
            timeout=120, trust_env=False)
        try:
            rj = r.json()
        except Exception:  # noqa: BLE001
            rj = {"_raw": r.text[:300]}
        ev["upload"] = {"http": r.status_code,
                        "success": rj.get("success", rj.get("id")),
                        "doc_id": rj.get("doc_id") or rj.get("id"),
                        "raw_head": json.dumps(rj, default=str)[:260]}

        # --- J3.authorized-read (poll: embed+index is async-ish) ---------
        found = None
        for attempt in range(12):
            found = _search(server.base, token_a, MARKER)
            if found["marker_in_results"]:
                break
            time.sleep(2.5)
        ev["authorized_read"] = found

        # --- J3.isolation: another workspace must NOT see it -------------
        user_b = JR.new_user(server.base)
        token_b = user_b.get("token")
        if not token_b:
            raise RuntimeError("user B register/login failed")
        ev["user_b"] = {"workspace_id": user_b.get("workspace_id")}
        same_ws = (user_a.get("workspace_id")
                   and user_a["workspace_id"] == user_b.get("workspace_id"))
        denied = _search(server.base, token_b, MARKER)
        ev["isolation_check"] = denied
        ev["workspaces_distinct"] = not same_ws

        checks = {
            "J3.upload": bool(ev["upload"]["http"] == 200
                              and ev["upload"]["success"]),
            "J3.authorized-read": bool(found["marker_in_results"]),
            "J3.isolation": bool(ev["workspaces_distinct"]
                                 and not denied["marker_in_results"]),
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
        out = JR.save_result("j3_source_connection", ev)
        print(f"evidence: {out}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
