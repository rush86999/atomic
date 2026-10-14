#!/usr/bin/env python3
"""ISOLATED DIAGNOSTIC BENCHMARK (verifier round 19, steps 4-5).

Not an acceptance run: no world, no server, no competing requests. The
acceptance timeout stands as failed; nothing here retroactively passes
it. This script answers, with the SAME planning payload the J6
authorized-edit lane builds:

  1. does the planning call complete at all, given a bounded DIAGNOSTIC
     window far wider than the acceptance bound?
  2. where does the time go — what is observable of model load, prompt
     evaluation, and generation (Ollama /api/ps and a raw /api/generate
     with identical prompt provide the internal breakdown)?
  3. does a REDUCED prompt (authorization, canvas identity, the edited
     field and its current value preserved) complete faster within the
     SAME bound — the comparison a timed-out baseline CAN support?

Evidence: JSON in this directory. No production change is made here.
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
DIAGNOSTIC_WINDOW_S = 600.0
COMPARISON_BOUND_S = 180.0

FULL_CANVAS = {
    "canvas_id": "cv-diag",
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
# REDUCED: authorization context (the quote), the edited field and its
# current value preserved; nothing else. The plan must still be usable
# against the FULL canvas (the ops name exact text that survives).
REDUCED_CANVAS = {
    "canvas_id": "cv-diag",
    "canvas_type": "document",
    "title": "Quotation Q-2026-114",
    "content": (
        "# Quotation Q-2026-114\n\n"
        "Client: Dunmore Fabrication LLC\n"
        "Unit price: $48,000.00\n"
        "Terms: Net 30\n"
        "Valid until: 2026-11-30\n"),
}
MESSAGE = ("On this quotation, update the Valid Until date to "
           "2026-12-31. Change nothing else.")


def ollama_ps() -> dict:
    try:
        r = httpx.post(f"{OLLAMA}/api/ps", timeout=10, trust_env=False)
        return {"loaded": r.json()}
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc)}


def raw_generate_timing(prompt: str, timeout_s: float) -> dict:
    """The SAME payload through Ollama's native API: its response
    carries prompt_eval_count / eval_count / eval durations — the
    load/eval/generation breakdown the OpenAI-compatible endpoint does
    not expose."""
    try:
        t0 = time.monotonic()
        r = httpx.post(
            f"{OLLAMA}/api/generate",
            json={"model": MODEL, "prompt": prompt, "stream": False,
                  "format": "json",
                  "options": {"num_predict": 2000}},
            timeout=timeout_s, trust_env=False)
        wall = time.monotonic() - t0
        d = r.json() or {}
        return {
            "wall_s": round(wall, 2),
            "prompt_eval_count": d.get("prompt_eval_count"),
            "prompt_eval_duration_ns": d.get("prompt_eval_duration"),
            "eval_count": d.get("eval_count"),
            "eval_duration_ns": d.get("eval_duration"),
            "load_duration_ns": d.get("load_duration"),
            "done_reason": d.get("done_reason"),
            "response_head": str(d.get("response") or "")[:200],
        }
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc)[:200]}


async def plan_once(canvas: dict, label: str, bound_s: float,
                    captured: dict) -> dict:
    """The REAL plan_canvas_edit against a REAL endpoint-bound handler."""
    import integrations.chat_orchestrator as co
    import core.chat_canvas_editor as cce
    from core.llm import pinned_planning as pp
    from core.llm.byok_handler import BYOKHandler
    from core.llm_service import LLMService

    handler = BYOKHandler(workspace_id="ws-diag", tenant_id="tenant-diag",
                          provider_id="auto")
    import openai

    handler.clients["local_diag"] = openai.OpenAI(
        base_url=f"{OLLAMA}/v1", api_key="ollama")
    handler._local_routes[MODEL] = {
        "provider_key": "local_diag",
        "workspace_id": "ws-diag",
        "provider_id": "prov-diag",
        "provider_type": "ollama",
        "supports_tools": True,
        "supports_vision": False,
        "supports_reasoning": False,
        "quality_score": 0.9,
        "context_window": 131072,
    }
    # Offline pricing pool: the local route + no refresh.
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
    handler._load_local_providers = lambda: None  # keep the seeded route

    svc = LLMService(workspace_id="ws-diag", tenant_id="tenant-diag")
    svc._get_handler = lambda **kwargs: handler

    # Capture the EXACT payload the lane builds.
    orig = handler.generate_structured_response

    async def _capture(**kwargs):
        captured["prompt"] = str(kwargs.get("prompt") or "")
        captured["cap"] = kwargs.get("max_tokens")
        captured["dispatches"] = captured.get("dispatches", 0) + 1
        return await orig(**kwargs)

    handler.generate_structured_response = _capture

    t0 = time.monotonic()
    try:
        plan = await asyncio.wait_for(
            cce.plan_canvas_edit(
                MESSAGE, [], dict(canvas), svc,
                workspace_id="ws-diag", tenant_id="tenant-diag",
                execution_id=f"diag-{label}"),
            timeout=bound_s)
    except asyncio.TimeoutError:
        return {"label": label, "completed": False,
                "reason": "diagnostic window expired",
                "bound_s": bound_s,
                "elapsed_s": round(time.monotonic() - t0, 2)}
    except Exception as exc:  # noqa: BLE001
        return {"label": label, "completed": False,
                "reason": f"{type(exc).__name__}: {str(exc)[:160]}",
                "bound_s": bound_s,
                "elapsed_s": round(time.monotonic() - t0, 2)}
    elapsed = round(time.monotonic() - t0, 2)
    from core.chat_canvas_editor import plan_contract_violation
    return {
        "label": label, "completed": True,
        "time_to_valid_plan_s": elapsed,
        "bound_s": bound_s,
        "wants_edit": bool(plan is not None and getattr(
            plan, "wants_edit", False)),
        "contract_violation": plan_contract_violation(plan)
        if plan is not None else "no-plan",
        "prompt_chars": len(captured.get("prompt") or ""),
        "cap": captured.get("cap"),
        "dispatches": captured.get("dispatches"),
    }


def main() -> int:
    out: dict = {
        "diagnostic": "j6 planning benchmark (isolated; NOT acceptance)",
        "model": MODEL,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                    time.gmtime()),
        "ollama_ps_before": ollama_ps(),
    }
    captured: dict = {}
    # 1. The ORIGINAL workload, diagnostic window.
    out["original"] = asyncio.run(
        plan_once(FULL_CANVAS, "original", DIAGNOSTIC_WINDOW_S, captured))
    original_prompt = captured.get("prompt") or ""
    out["original"]["payload_prompt_chars"] = len(original_prompt)
    out["original"]["payload_cap"] = captured.get("cap")

    # 2. The internal breakdown for the SAME payload (native API).
    out["raw_generate_original"] = raw_generate_timing(
        original_prompt, timeout_s=DIAGNOSTIC_WINDOW_S)

    # 3. The REDUCED prompt, SAME comparison bound for both.
    reduced_captured: dict = {}
    out["reduced"] = asyncio.run(
        plan_once(REDUCED_CANVAS, "reduced", COMPARISON_BOUND_S,
                  reduced_captured))
    reduced_prompt = reduced_captured.get("prompt") or ""
    out["reduced"]["payload_prompt_chars"] = len(reduced_prompt)

    # 4. Raw breakdown of the reduced payload.
    out["raw_generate_reduced"] = raw_generate_timing(
        reduced_prompt, timeout_s=COMPARISON_BOUND_S)

    out["ollama_ps_after"] = ollama_ps()
    out_path = Path(__file__).parent / (
        "diagnostic_benchmark_"
        + time.strftime("%Y%m%d_%H%M%S") + ".json")
    out_path.write_text(json.dumps(out, indent=1, default=str))
    print(f"evidence: {out_path}")
    print(json.dumps({
        "original_completed": out["original"].get("completed"),
        "original_elapsed_s": out["original"].get(
            "elapsed_s") or out["original"].get("time_to_valid_plan_s"),
        "original_prompt_chars": out["original"].get(
            "payload_prompt_chars"),
        "raw_original_wall_s": (out["raw_generate_original"] or {}).get(
            "wall_s"),
        "raw_original_prompt_eval": (out["raw_generate_original"] or {}).get(
            "prompt_eval_count"),
        "raw_original_eval": (out["raw_generate_original"] or {}).get(
            "eval_count"),
        "reduced_completed": out["reduced"].get("completed"),
        "reduced_time_to_valid_plan_s": out["reduced"].get(
            "time_to_valid_plan_s"),
        "reduced_prompt_chars": out["reduced"].get("payload_prompt_chars"),
        "raw_reduced_wall_s": (out["raw_generate_reduced"] or {}).get(
            "wall_s"),
    }, indent=1, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
