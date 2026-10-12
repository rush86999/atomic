#!/usr/bin/env python3
"""One-shot attribution probe for the J2 world-A `no_llm_provider` refusal.

Registers the local provider through the product EXACTLY like world A,
fires the same PONG turn, and keeps a FULL server log at DEBUG so the
ranking path shows why the registered route does or does not rank.
Evidence-only: no assertions, no registry writes.
"""
from __future__ import annotations

import json
import sys
import time
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402

MODEL = "llama3.1:8b"


def main() -> int:
    export = JR.materialize_code_export()
    server = JR.ScratchServer(
        "probe_j2_ranking", allowlisted=True, code_export=export,
        extra_env={"ATOM_LOCAL_ONLY": "true",
                   "OLLAMA_BASE_URL": "http://localhost:11434/v1",
                   "OLLAMA_MODEL": MODEL,
                   "LOG_LEVEL": "DEBUG"})
    out: dict = {"probe": "j2_ranking", "model": MODEL}
    try:
        boot = server.up()
        out["boot"] = boot
        if not boot.get("booted"):
            return 2
        user = JR.new_user(server.base)
        token, uid = user.get("token"), user.get("id")
        reg = JR.auth_post(server.base, token, "/api/local-models",
                           {"name": "probe-ollama", "provider_type": "ollama",
                            "base_url": "http://localhost:11434/v1"})
        provider_id = (reg["json"] or {}).get("id")
        out["register"] = {"http": reg["http"], "id": provider_id}
        caps = JR.auth_post(server.base, token,
                            f"/api/local-models/{provider_id}/capabilities",
                            {"model_id": MODEL, "supports_tools": True,
                             "supports_vision": False,
                             "supports_reasoning": False,
                             "quality_score": 0.9, "speed_score": 0.8,
                             "context_window": 8192})
        out["capabilities"] = {"http": caps["http"]}

        t0 = time.monotonic()
        r = JR.auth_post(server.base, token, "/api/chat/message",
                         {"message": "Reply with exactly: PONG",
                          "user_id": uid, "request_id": str(uuid.uuid4())},
                         timeout_s=420.0)
        out["turn_seconds"] = round(time.monotonic() - t0, 1)
        rj = r["json"]
        out["turn"] = {"http": r["http"], "success": rj.get("success"),
                       "provider": rj.get("provider"),
                       "model": rj.get("model"),
                       "error_code": rj.get("error_code"),
                       "content_head": str(rj.get("message") or "")[:200]}
    except Exception as exc:  # noqa: BLE001
        out["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        log = server.log_tail(limit=200000)
        server.stop()
        keep = []
        for line in log.splitlines():
            low = line.lower()
            if any(k in low for k in (
                    "rank", "candidate", "cooldown", "quality", "floor",
                    "bpc", "local_", "eligible", "no_llm", "plan",
                    "fallback", "tier", "options", "provider")):
                keep.append(line)
        out["log_filtered_lines"] = keep[-160:]
        from scripts.orchestration_acceptance import journey_runtime as JR2
        p = JR2.save_result("probe_j2_ranking", out)
        print(f"evidence: {p}")
    print(json.dumps({k: v for k, v in out.items()
                      if k != "log_filtered_lines"}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
