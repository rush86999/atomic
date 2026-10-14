#!/usr/bin/env python3
"""A/B benchmark: the planning payload through the structured dispatch
with the NATIVE json_schema constraint (candidate — registered ollama
route) versus the identical payload through the UNCHANGED path
(original — the same route registered without the ollama identity, so
eligibility is off). Identical full-canvas production payload; the SAME
bound for every attempt; >= 3 attempts per side; counts timeouts,
invalid plans, and ACTUAL HTTP requests (httpx hook on the client).

Not an acceptance run. The acceptance timeout stays as failed.
"""
from __future__ import annotations

import asyncio
import json
import sys
import time
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(BACKEND))

import os
os.environ.setdefault("TESTING", "1")

import httpx

OLLAMA = "http://localhost:11434"
MODEL = "llama3.1:8b"
BOUND_S = 180.0
ATTEMPTS = 3

CANVAS = {
    "canvas_id": "cv-ab",
    "canvas_type": "document",
    "title": "Quotation Q-2026-114",
    "content": (
        "# Quotation Q-2026-114\n\n"
        "Client: Dunmore Fabrication LLC\n"
        "Prepared for: Elena Sorokina, Operations\n"
        "Item: CNC press brake, 50-ton\n"
        "Unit price: $48,000.00\n"
        "Subtotal: $48,000.00\n"
        "Terms: Net 30\n"
        "Valid until: 2026-11-30\n"),
}
MESSAGE = ("On this quotation, update the Valid Until date to "
           "2026-12-31. Change nothing else.")


async def attempt(handler, label: str, http_counts: list) -> dict:
    import core.chat_canvas_editor as cce
    from core.llm_service import LLMService

    svc = LLMService(workspace_id="ws-diag", tenant_id="tenant-diag")
    svc._get_handler = lambda **kwargs: handler
    t0 = time.monotonic()
    n0 = len(http_counts)
    try:
        plan = await asyncio.wait_for(
            cce.plan_canvas_edit(
                MESSAGE, [], dict(CANVAS), svc,
                workspace_id="ws-diag", tenant_id="tenant-diag",
                execution_id=f"ab-{label}"),
            timeout=BOUND_S)
    except asyncio.TimeoutError:
        return {"attempt": label, "completed": False,
                "reason": "bound expired (timeout)",
                "elapsed_s": round(time.monotonic() - t0, 2),
                "http_requests": len(http_counts) - n0}
    except Exception as exc:  # noqa: BLE001
        return {"attempt": label, "completed": False,
                "reason": f"{type(exc).__name__}: {str(exc)[:140]}",
                "elapsed_s": round(time.monotonic() - t0, 2),
                "http_requests": len(http_counts) - n0}
    usable = False
    violation = None
    if plan is not None and getattr(plan, "wants_edit", False):
        from core.chat_canvas_editor import (
            plan_contract_violation, _apply_patch_ops)
        violation = plan_contract_violation(plan)
        _, failed = _apply_patch_ops(CANVAS.get("content"), plan.ops or [])
        usable = (violation is None and not failed)
        return {"attempt": label, "completed": usable,
                "time_to_valid_plan_s": round(time.monotonic() - t0, 2),
                "contract": violation, "failed_ops": len(failed or []),
                "http_requests": len(http_counts) - n0}
    return {"attempt": label, "completed": False,
            "reason": "declined or no plan",
            "elapsed_s": round(time.monotonic() - t0, 2),
            "http_requests": len(http_counts) - n0}


def build_handler(provider_type: str):
    import openai
    import core.llm.byok_handler as bh
    from core.dynamic_pricing_fetcher import get_pricing_fetcher

    handler = bh.BYOKHandler(workspace_id="ws-diag",
                             tenant_id="tenant-diag", provider_id="auto")
    client = openai.OpenAI(base_url=f"{OLLAMA}/v1", api_key="ollama")
    handler.clients["local_ab"] = client
    handler._local_routes[MODEL] = {
        "provider_key": "local_ab",
        "workspace_id": "ws-diag",
        "provider_id": "prov-ab",
        # THE ELIGIBILITY SWITCH under test: the route's registered
        # provider identity decides native-schema selection.
        "provider_type": provider_type,
        "supports_tools": True, "supports_vision": False,
        "supports_reasoning": False, "quality_score": 0.9,
        "context_window": 131072,
    }
    handler._load_local_providers = lambda: None
    fetcher = get_pricing_fetcher()

    async def _empty():
        return {}

    fetcher.fetch_litellm_pricing = _empty
    fetcher.fetch_openrouter_pricing = _empty
    fetcher.fetch_opencode_pricing = _empty
    fetcher.last_fetch = None
    fetcher.pricing_cache = {
        MODEL: {"litellm_provider": "ollama",
                "max_input_tokens": 131072, "supports_tools": True},
    }
    import core.dynamic_pricing_fetcher as dpf
    dpf._pricing_initialized = True

    http_counts: list = []
    http_client = getattr(client, "_client", None)
    if http_client is not None:
        http_client.event_hooks["request"] = [
            lambda req: http_counts.append(1)]
    return handler, http_counts


def main() -> int:
    import core.llm.byok_handler as bh
    import core.chat_canvas_editor as cce

    out: dict = {
        "benchmark": "native json_schema vs original (identical "
                     "full-canvas production payload)",
        "model": MODEL, "bound_s": BOUND_S, "attempts_per_side": ATTEMPTS,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                    time.gmtime()),
        "llm_service_scope_patched": True,
    }
    results: dict = {}
    for side, provider_type in (("original", "generic-local"),
                                ("candidate", "ollama")):
        handler, http_counts = build_handler(provider_type)
        # plan_canvas_edit resolves the service's handler; give the
        # service the seeded one via the same seam the lane uses.
        runs = []

        async def _one(i: int):
            import integrations.chat_orchestrator as co
            # LLMService-less: plan via the seeded handler through the
            # REAL plan_canvas_edit (service seam patched below).
            class _Svc:
                llm_service = None

            svc = _Svc()
            from core.llm.byok_handler import BYOKHandler as _B
            assert isinstance(handler, _B)
            svc._get_handler = lambda **kwargs: handler
            t0 = time.monotonic()
            n0 = len(http_counts)
            try:
                plan = await asyncio.wait_for(
                    cce.plan_canvas_edit(
                        MESSAGE, [], dict(CANVAS), svc,
                        workspace_id="ws-diag", tenant_id="tenant-diag",
                        execution_id=f"ab-{side}-{i}"),
                    timeout=BOUND_S)
            except asyncio.TimeoutError:
                return {"attempt": f"{side}-{i}", "completed": False,
                        "reason": "bound expired (timeout)",
                        "elapsed_s": round(time.monotonic() - t0, 2),
                        "http_requests": len(http_counts) - n0}
            except Exception as exc:  # noqa: BLE001
                return {"attempt": f"{side}-{i}", "completed": False,
                        "reason": f"{type(exc).__name__}: "
                                  f"{str(exc)[:140]}",
                        "elapsed_s": round(time.monotonic() - t0, 2),
                        "http_requests": len(http_counts) - n0}
            usable, violation, failed_n = False, None, 0
            if plan is not None and getattr(plan, "wants_edit", False):
                violation = cce.plan_contract_violation(plan)
                _, failed = cce._apply_patch_ops(
                    CANVAS.get("content"), plan.ops or [])
                failed_n = len(failed or [])
                usable = (violation is None and not failed_n)
            return {"attempt": f"{side}-{i}",
                    "completed": bool(usable),
                    "time_to_valid_plan_s": round(time.monotonic() - t0, 2)
                    if usable else None,
                    "contract": violation,
                    "failed_ops": failed_n,
                    "elapsed_s": round(time.monotonic() - t0, 2),
                    "http_requests": len(http_counts) - n0}

        for i in range(1, ATTEMPTS + 1):
            runs.append(asyncio.run(_one(i)))
        results[side] = runs

    out["results"] = results
    for side, runs in results.items():
        completed = [r for r in runs if r.get("completed")]
        out[f"{side}_summary"] = {
            "completions": f"{len(completed)}/{len(runs)}",
            "time_to_valid_plan_s": [r.get("time_to_valid_plan_s")
                                     for r in completed],
            "timeouts": sum(1 for r in runs
                            if "timeout" in str(r.get("reason"))),
            "invalid_or_declined": sum(
                1 for r in runs if not r.get("completed")
                and "timeout" not in str(r.get("reason"))),
            "http_requests_total": sum(r.get("http_requests") or 0
                                       for r in runs),
        }
    out_path = Path(__file__).parent / (
        "ab_native_schema_"
        + time.strftime("%Y%m%d_%H%M%S") + ".json")
    out_path.write_text(json.dumps(out, indent=1, default=str))
    print(f"evidence: {out_path}")
    print(json.dumps({k: out[f"{k}_summary"]
                      for k in ("original", "candidate")},
                     indent=1, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
