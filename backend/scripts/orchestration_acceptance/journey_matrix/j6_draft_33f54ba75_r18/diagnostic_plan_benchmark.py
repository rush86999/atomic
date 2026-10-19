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
from typing import Optional

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


def _instruction_variant(captured: dict) -> str:
    """Which instruction assembly reached the model — classified from the
    captured prompt text, never inferred from the flag."""
    prompt = str(captured.get("prompt") or "")
    if "You return only the CanvasEditPlan JSON object" in prompt:
        return "compact"
    if "AI co-editing panel" in prompt:
        return "verbose"
    return "unknown"


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
                    captured: dict,
                    compact: Optional[bool] = None) -> dict:
    """The REAL plan_canvas_edit against a REAL endpoint-bound handler.

    ``compact`` None = production AUTO selection; True/False force the
    instruction variant (the in-tree RED/GREEN control). The captured
    prompt is classified by its instruction text so the evidence names
    WHICH assembly reached the model. A completed plan still has to be
    USABLE: valid contract and ops that apply to the canvas text."""
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
                execution_id=f"diag-{label}",
                compact=compact),
            timeout=bound_s)
    except asyncio.TimeoutError:
        return {"label": label, "completed": False,
                "reason": "diagnostic window expired",
                "bound_s": bound_s,
                "elapsed_s": round(time.monotonic() - t0, 2),
                "instruction_variant": _instruction_variant(captured)}
    except Exception as exc:  # noqa: BLE001
        return {"label": label, "completed": False,
                "reason": f"{type(exc).__name__}: {str(exc)[:160]}",
                "bound_s": bound_s,
                "elapsed_s": round(time.monotonic() - t0, 2),
                "instruction_variant": _instruction_variant(captured)}
    elapsed = round(time.monotonic() - t0, 2)
    from core.chat_canvas_editor import (
        _apply_patch_ops,
        plan_contract_violation,
    )
    usable: dict = {}
    if plan is not None and getattr(plan, "wants_edit", False):
        _, failed = _apply_patch_ops(canvas.get("content"), plan.ops or [])
        usable = {"ops_match_current_content": not failed,
                  "failed_ops": len(failed or [])}
    violation = plan_contract_violation(plan) if plan is not None \
        else "no-plan"
    return {
        "label": label, "completed": bool(
            plan is not None and getattr(plan, "wants_edit", False)
            and violation is None
            and usable.get("ops_match_current_content")),
        "plan_returned": plan is not None,
        "time_to_valid_plan_s": elapsed,
        "bound_s": bound_s,
        "wants_edit": bool(plan is not None and getattr(
            plan, "wants_edit", False)),
        "contract_violation": violation,
        **usable,
        "prompt_chars": len(captured.get("prompt") or ""),
        "cap": captured.get("cap"),
        "dispatches": captured.get("dispatches"),
        "instruction_variant": _instruction_variant(captured),
    }


def _write_evidence(out: dict) -> Path:
    out_path = Path(__file__).parent / (
        "diagnostic_benchmark_"
        + time.strftime("%Y%m%d_%H%M%S") + ".json")
    out_path.write_text(json.dumps(out, indent=1, default=str))
    return out_path


def main() -> int:
    out: dict = {
        "diagnostic": "j6 planning benchmark (isolated; NOT acceptance)",
        "model": MODEL,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                                    time.gmtime()),
        "ollama_ps_before": ollama_ps(),
    }
    if "--production-only" in sys.argv[1:]:
        # Fast iteration path: just the production assembly (AUTO), three
        # attempts, full canvas, completion + contract + ops validated.
        runs = []
        for _i in (1, 2, 3):
            _cap: dict = {}
            runs.append(asyncio.run(plan_once(
                FULL_CANVAS, f"production-auto-{_i}",
                COMPARISON_BOUND_S, _cap)))
        out["production_auto"] = runs
        out["production_auto_summary"] = {
            "completions": sum(1 for r in runs if r.get("completed")),
            "attempts": len(runs),
            "times_s": [r.get("time_to_valid_plan_s") for r in runs],
            "instruction_variants": sorted({
                r.get("instruction_variant") for r in runs}),
        }
        out["ollama_ps_after"] = ollama_ps()
        out_path = _write_evidence(out)
        print(f"evidence: {out_path}")
        print(json.dumps(out["production_auto_summary"],
                         indent=1, default=str))
        return 0
    captured: dict = {}
    # 1. The ORIGINAL (verbose) workload, diagnostic window, FORCED so
    # the arm stays the verbose path on any tree (the candidate's AUTO
    # selection would otherwise relabel this arm). On the parent commit
    # this is byte-equivalent to the historical "original" arm.
    out["original_verbose_forced"] = asyncio.run(
        plan_once(FULL_CANVAS, "original-verbose", DIAGNOSTIC_WINDOW_S,
                  captured, compact=False))
    original_prompt = captured.get("prompt") or ""
    out["original_verbose_forced"]["payload_prompt_chars"] = len(
        original_prompt)
    out["original_verbose_forced"]["payload_cap"] = captured.get("cap")

    # 2. The internal breakdown for the SAME payload (native API).
    out["raw_generate_original"] = raw_generate_timing(
        original_prompt, timeout_s=DIAGNOSTIC_WINDOW_S)

    # 2b. THE PRODUCTION ASSEMBLY (owner direction: prompt construction
    # through the existing planner). AUTO selection, full canvas, three
    # attempts at the acceptance-class comparison bound; each attempt
    # must COMPLETE with a valid contract AND ops that apply to the full
    # canvas text. This is the arm a production change is measured on.
    production_auto_runs = []
    for _i in (1, 2, 3):
        _cap: dict = {}
        production_auto_runs.append(asyncio.run(
            plan_once(FULL_CANVAS, f"production-auto-{_i}",
                      COMPARISON_BOUND_S, _cap)))
    out["production_auto"] = production_auto_runs
    out["production_auto_summary"] = {
        "completions": sum(1 for r in production_auto_runs
                           if r.get("completed")),
        "attempts": len(production_auto_runs),
        "times_s": [r.get("time_to_valid_plan_s") for r in
                    production_auto_runs],
        "instruction_variants": sorted({
            r.get("instruction_variant") for r in production_auto_runs}),
    }

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

    # 5. PRESERVATION-PRESERVING REDUCTION (verifier round 19
    # correction): the FULL canvas verbatim — authorization context,
    # protected content, every field — with the SCAFFOLDING reduced to
    # the contract the lane actually enforces. Same dispatch path
    # (instructor -> the same handler), same bound, and the result is
    # held to the SAME post-checks plan_canvas_edit applies (contract
    # violation + ops-match). A completion here is the benchmark a
    # production scaffolding change must beat, on the unchanged
    # workload.
    minimal_sys = (
        "You return only the CanvasEditPlan JSON object: "
        '{\"wants_edit\": bool, \"edit_mode\": \"patch\", '
        '\"ops\": [{"find": <exact current text>, '
        '\"replace\": <new text>}], \"reply\": str}. '
        "ops.find MUST copy the current canvas text verbatim (first "
        "occurrence). Everything the ops do not touch is preserved "
        "byte-for-byte. No markdown fences.")
    minimal_user = (
        f"Canvas title: {FULL_CANVAS['title']}\n"
        f"Canvas type: {FULL_CANVAS['canvas_type']}\n"
        f"Canvas content:\n{FULL_CANVAS['content']}\n\n"
        f"Request: {MESSAGE}")
    from core.chat_canvas_editor import CanvasEditPlan
    from core.llm.byok_handler import BYOKHandler
    import openai as _openai

    diag_handler = BYOKHandler(workspace_id="ws-diag",
                               tenant_id="tenant-diag", provider_id="auto")
    diag_handler.clients["local_diag"] = _openai.OpenAI(
        base_url=f"{OLLAMA}/v1", api_key="ollama")
    diag_handler._local_routes[MODEL] = {
        "provider_key": "local_diag", "workspace_id": "ws-diag",
        "provider_id": "prov-diag", "provider_type": "ollama",
        "supports_tools": True, "supports_vision": False,
        "supports_reasoning": False, "quality_score": 0.9,
        "context_window": 131072,
    }
    diag_handler._load_local_providers = lambda: None

    async def _minimal_once(attempt_label: str) -> dict:
        from core.chat_canvas_editor import (
            CanvasEditPlan as CEP,
            plan_contract_violation,
            _apply_patch_ops,
        )
        t0 = time.monotonic()
        try:
            plan = await asyncio.wait_for(
                diag_handler.generate_structured_response(
                    prompt=f"{minimal_sys}\n\n{minimal_user}",
                    system_instruction=minimal_sys,
                    response_model=CEP,
                    task_type="planning",
                    route_trace_id=f"diagnostic_minimal:{attempt_label}"),
                timeout=COMPARISON_BOUND_S)
        except asyncio.TimeoutError:
            return {"label": attempt_label, "completed": False,
                    "reason": "bound expired",
                    "elapsed_s": round(time.monotonic() - t0, 2)}
        except Exception as exc:  # noqa: BLE001
            return {"label": attempt_label, "completed": False,
                    "reason": f"{type(exc).__name__}: {str(exc)[:140]}",
                    "elapsed_s": round(time.monotonic() - t0, 2)}
        elapsed = round(time.monotonic() - t0, 2)
        usable = {}
        if plan is not None and getattr(plan, "wants_edit", False):
            _, failed = _apply_patch_ops(FULL_CANVAS.get("content"),
                                         plan.ops or [])
            usable = {"ops_match_current_content": not failed,
                      "failed_ops": len(failed or [])}
        violation = plan_contract_violation(plan) if plan is not None \
            else "no-plan"
        completed = bool(
            plan is not None and getattr(plan, "wants_edit", False)
            and violation is None
            and usable.get("ops_match_current_content"))
        return {"label": attempt_label, "completed": completed,
                "time_to_valid_plan_s": elapsed, "contract": violation,
                **usable}

    out["reduced_scaffold_full_canvas"] = [
        asyncio.run(_minimal_once(f"minimal-{i}")) for i in (1, 2, 3)]

    out["ollama_ps_after"] = ollama_ps()
    out_path = Path(__file__).parent / (
        "diagnostic_benchmark_"
        + time.strftime("%Y%m%d_%H%M%S") + ".json")
    out_path.write_text(json.dumps(out, indent=1, default=str))
    print(f"evidence: {out_path}")
    print(json.dumps({
        "original_verbose_completed": out[
            "original_verbose_forced"].get("completed"),
        "original_verbose_elapsed_s": out[
            "original_verbose_forced"].get(
                "elapsed_s") or out["original_verbose_forced"].get(
                    "time_to_valid_plan_s"),
        "original_verbose_prompt_chars": out[
            "original_verbose_forced"].get("payload_prompt_chars"),
        "raw_original_wall_s": (out["raw_generate_original"] or {}).get(
            "wall_s"),
        "raw_original_prompt_eval": (out["raw_generate_original"] or {}).get(
            "prompt_eval_count"),
        "raw_original_eval": (out["raw_generate_original"] or {}).get(
            "eval_count"),
        "production_auto": out["production_auto_summary"],
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
