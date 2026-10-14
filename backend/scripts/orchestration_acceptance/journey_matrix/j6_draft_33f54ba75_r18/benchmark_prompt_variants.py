#!/usr/bin/env python3
"""COMPARABLE BENCHMARK (verifier work order W3): the planning payload
through the REAL plan_canvas_edit — the HEAVYWEIGHT assembly versus the
COMPACT assembly — with identical scope, canvas, history, evidence,
token cap, deadline, provider, and retry policy. Only prompt
construction differs (compact is forced explicitly on both callable
seams). The candidate must produce an EFFECTIVE patch: the applied
state contains the requested change.

3 attempts per side on the identical payload; counts timeouts, invalid
plans, and non-effective patches; reports time-to-valid-plan and HTTP
requests (httpx hook). Not an acceptance run.
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

import logging
import sys as _sys

import httpx
from unittest.mock import patch

# Round-19 W3: capture the ranking/dispatch warnings that explain a
# zero-second "provider failure".
logging.basicConfig(
    level=logging.INFO,
    stream=_sys.stderr,
    format="%(levelname)s:%(name)s:%(message)s")

OLLAMA = "http://localhost:11434"
MODEL = "llama3.1:8b"
BOUND_S = 120.0
ATTEMPTS = 3

FULL_CANVAS = {
    "canvas_id": "cv-ab2",
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


async def run_side(label: str, compact: bool, http_counts: list) -> dict:
    import core.chat_canvas_editor as cce
    import core.llm.byok_handler as bh
    from core.llm.byok_handler import BYOKHandler
    import openai

    from core.dynamic_pricing_fetcher import get_pricing_fetcher
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

    handler = BYOKHandler(workspace_id="ws-ab", tenant_id="tenant-ab",
                          provider_id="auto")
    handler._load_local_providers = lambda: None
    handler.clients["local_ab"] = openai.OpenAI(
        base_url=f"{OLLAMA}/v1", api_key="ollama")
    handler._local_routes[MODEL] = {
        "provider_key": "local_ab", "workspace_id": "ws-ab",
        "provider_id": "prov-ab", "provider_type": "ollama",
        "supports_tools": True, "supports_vision": False,
        "supports_reasoning": False, "quality_score": 0.9,
        "context_window": 131072,
    }

    http_client = getattr(handler.clients["local_ab"], "_client", None)
    if http_client is not None:
        http_client.event_hooks["request"] = [
            lambda req: http_counts.append(1)]

    runs = []
    for i in range(1, ATTEMPTS + 1):
        captured = {}


        t0 = time.monotonic()
        try:
            plan = await asyncio.wait_for(
                cce.plan_canvas_edit(
                    MESSAGE, [], dict(FULL_CANVAS), _Svc(handler, captured),
                    workspace_id="ws-ab", tenant_id="tenant-ab",
                    execution_id=f"ab2-{label}-{i}", compact=compact),
                timeout=BOUND_S)
        except asyncio.TimeoutError:
            runs.append({"attempt": f"{label}-{i}", "completed": False,
                         "reason": "bound expired",
                         "elapsed_s": round(time.monotonic() - t0, 2),
                         "http": len(http_counts) - n0 if
                         (n0 := len(http_counts)) is not None else 0})
            continue
        except Exception as exc:  # noqa: BLE001
            runs.append({"attempt": f"{label}-{i}", "completed": False,
                         "reason": f"{type(exc).__name__}: "
                                   f"{str(exc)[:140]}",
                         "elapsed_s": round(time.monotonic() - t0, 2)})
            continue
        effective = False
        detail = "no plan"
        if plan is not None and getattr(plan, "wants_edit", False):
            from core.chat_canvas_editor import (
                plan_contract_violation, _apply_patch_ops)
            violation = plan_contract_violation(plan)
            new_content, failed = _apply_patch_ops(
                FULL_CANVAS.get("content"), plan.ops or [])
            effective = (
                not failed and violation is None
                and "Valid until: 2026-12-31" in (new_content or "")
                and "Valid until: 2026-11-30" not in (new_content or "")
                and "Unit price: $48,000.00" in (new_content or ""))
            detail = (f"violation={violation} failed_ops={len(failed or [])} "
                      f"effective={effective}")
        runs.append({
            "attempt": f"{label}-{i}",
            "completed": bool(effective),
            "time_to_valid_plan_s": round(time.monotonic() - t0, 2)
            if plan is not None else None,
            "detail": detail,
            "prompt_chars": len(captured.get("prompt") or ""),
            "cap": captured.get("cap"),
            "http": len(http_counts),
        })
    return runs


class _Svc:
    """The service seam: dispatches onto the seeded handler and
    captures the assembled prompt."""

    def __init__(self, handler, captured):
        self.handler = handler
        self.captured = captured

    async def generate_structured_response(self, **kwargs):
        self.captured["prompt"] = kwargs.get("prompt")
        self.captured["cap"] = kwargs.get("max_tokens")
        # plan_canvas_edit forwards workspace_id/tenant_id for the
        # SERVICE seam; the HANDLER IS the scope here.
        kwargs.pop("workspace_id", None)
        kwargs.pop("tenant_id", None)
        return await self.handler.generate_structured_response(**kwargs)


def main() -> int:
    # DIAGNOSTIC: print the full traceback of every recorded planning
    # failure (the warning line carries only str(err)).
    import core.llm.pinned_planning as _pp
    import traceback as _tb
    _orig_pf = _pp._publish_failure

    def _pf_with_tb(label, err):
        _tb.print_exception(type(err), err, err.__traceback__)
        return _orig_pf(label, err)

    _pp._publish_failure = _pf_with_tb
    out: dict = {
        "benchmark": "prompt-construction A/B (heavyweight vs compact) "
                     "through the REAL plan_canvas_edit",
        "model": MODEL, "bound_s": BOUND_S, "attempts_per_side": ATTEMPTS,
        "identical": "scope, canvas (FULL), history, evidence, token cap, "
                     "deadline, provider, retry policy",
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                    time.gmtime()),
    }
    for label, compact in (("heavyweight", False), ("compact", True)):
        counts: list = []
        runs = asyncio.run(run_side(label, compact, counts))
        out[label] = runs
        completions = [r for r in runs if r.get("completed")]
        out[f"{label}_summary"] = {
            "effective_completions": f"{len(completions)}/{len(runs)}",
            "time_to_valid_plan_s": [r.get("time_to_valid_plan_s")
                                     for r in completions],
            "prompt_chars": [r.get("prompt_chars") for r in runs],
            "http_requests_total": counts and len(counts),
        }
    out_path = Path(__file__).parent / (
        "prompt_ab_" + time.strftime("%Y%m%d_%H%M%S") + ".json")
    out_path.write_text(json.dumps(out, indent=1, default=str))
    print(f"evidence: {out_path}")
    print(json.dumps({k: out[f"{k}_summary"]
                      for k in ("heavyweight", "compact")},
                     indent=1, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
