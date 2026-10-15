#!/usr/bin/env python3
"""T1 op-capture reproduction + planning-rung benchmark (owner directive
2026-10-15, deliverables 2-3).

WHY THIS EXISTS
---------------
Two counted J6 campaigns (j6_draft_20261015_082452_10b74a.json,
j6_draft_20261015_084149_8191fc.json) end T1 with the same shape: the
compact planner returns a CanvasEditPlan whose TWO patch ops include ONE
that does not match the canvas verbatim ("1/2 patch op(s) failed to
match"), the replace-mode re-ask is refused, and the plan stage exhausts
("replace fallbacks exhausted"). That establishes an unusable plan — but
the model's raw ops were never persisted (the plan never applied, so no
DB row; the server log is an in-memory ring buffer), so the EXACT rejected
operation cannot be inspected from the trace alone.

This harness reproduces the exact T1 planning workload in isolation with
the SAME lane (core.chat_canvas_editor.plan_canvas_edit), SAME payload
(canvas + ask from driver_j6_draft), SAME post-checks (contract, exact
apply, accepted-assignment validator), and captures EVERY dispatch's raw
plan (find/replace/field) so each rejected op is classified — wrong
field, copied formatting, normalization, stale revision, unnecessary
extra operation — against the authoritative canvas text.

Then it runs the planning alternative through the PRODUCT'S OWN pin
mechanism (ATOM_ASYNC_EDIT_PLAN_MODEL -> build_provider_model_pin ->
provider_model kwarg) on the identical request, guards, deadline, and
artifacts, and counts: effective edits, refusals, unavailability,
latency, and cost (tokens from the provider response; prices from the
app's own ai_pricing_cache.json). Schema-valid plans are NOT success.

NOT an acceptance run: no world, no server, no writes. TESTING=1
(scratch DB). The live byok_keys.json is only READ to build provider
clients (no save path is taken on lookup).

USAGE
-----
  TESTING=1 venv/bin/python benchmark_t1_ops_and_rung.py --probe
  TESTING=1 venv/bin/python benchmark_t1_ops_and_rung.py --reps-a 6 --reps-b 6
  TESTING=1 venv/bin/python benchmark_t1_ops_and_rung.py --pin deepseek/deepseek-v4-pro --reps-b 4
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import sys
import time
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(BACKEND))
os.environ.setdefault("TESTING", "1")

OLLAMA = "http://localhost:11434"
LOCAL_MODEL = "llama3.1:8b"
WORKSPACE = "ws-t1-bench"
# The campaign's canvas-edit leg bound (log: "canvas-edit leg bounded at
# 75s") — identical for both arms.
ATTEMPT_BOUND_S = 75.0
PROBE_BOUND_S = 60.0

# Exact J6 T1 workload (driver_j6_draft.py: QUOTE_TITLE/QUOTE_CONTENT + the
# T1 ask from the counted campaign evidence).
QUOTE_TITLE = "Quotation Q-2026-114 (J6 draft)"
QUOTE_CONTENT = (
    "# Quotation Q-2026-114\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Prepared for: Elena Sorokina, Operations\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Subtotal: $48,000.00\n"
    "Terms: Net 30\n"
    "Valid until: 2026-11-30\n")
EDITED_CONTENT = QUOTE_CONTENT.replace(
    "Valid until: 2026-11-30", "Valid until: 2026-12-31")
T1_ASK = ("On this quotation, update the Valid Until date to 2026-12-31. "
          "Change nothing else.")

# Production T1 inputs beyond message/canvas, captured from the real T1 turn
# (ATOM_PLAN_CAPTURE_DIR, j6_draft_20261015_110156_b02344): the orchestrator
# passes the account identity and the canvas audit-trail versions. The
# rendered prompt's only stored version is the empty initial snapshot; the
# seeded full-content row equals the current content and is dropped.
T1_USER_IDENTITY = {"name": "Journey Probe",
                    "email": "jprobe_bench@example.com"}
T1_VERSIONS_PATH = Path(__file__).parent / "t1_world_versions.json"


def _t1_world_versions() -> list:
    try:
        data = json.loads(T1_VERSIONS_PATH.read_text())
        return list(data.get("versions") or [])
    except Exception:  # noqa: BLE001
        return []

# Probe order: prefer the strong quality rung, then cheaper/subscription
# rungs from the workspace's OWN configured providers (stored keys) — the
# production pin addresses (provider, model) exactly like this.
PROBE_CANDIDATES = [
    ("deepseek", "deepseek-v4-pro"),
    ("openrouter", "deepseek/deepseek-v4-pro"),
    ("opencode-go", "deepseek-v4.1-flash"),
    ("opencode-go", "glm-5.3-flash"),
    ("deepseek", "deepseek-flash"),
]

PRICING_CACHE_PATH = BACKEND / "data" / "ai_pricing_cache.json"


# --------------------------------------------------------------- pricing
def _pricing_seed() -> dict:
    """Prices for the models this harness can dispatch, from the app's own
    cache file (recorded with its hash). Never invents a price."""
    out = {
        LOCAL_MODEL: {"litellm_provider": "ollama",
                      "max_input_tokens": 131072, "supports_tools": True,
                      "input_cost_per_token": 0.0,
                      "output_cost_per_token": 0.0},
    }
    try:
        data = json.loads(PRICING_CACHE_PATH.read_text())
        pricing = data.get("pricing") or {}
        for _prov, model in PROBE_CANDIDATES:
            entry = pricing.get(model)
            if isinstance(entry, dict):
                out[model] = entry
    except Exception:  # noqa: BLE001 — cost stays "unknown", never guessed
        pass
    return out


def _price_for(model: str, pricing: dict) -> dict:
    entry = pricing.get(model) or {}
    return {
        "input_cost_per_token": entry.get("input_cost_per_token"),
        "output_cost_per_token": entry.get("output_cost_per_token"),
    }


def _cost_usd(model: str, usage: dict, pricing: dict) -> float | None:
    if not usage:
        return None
    price = _price_for(model, pricing)
    in_p, out_p = (price.get("input_cost_per_token"),
                   price.get("output_cost_per_token"))
    pt, ct = usage.get("prompt_tokens"), usage.get("completion_tokens")
    if in_p is None or out_p is None or pt is None or ct is None:
        return None
    return round(pt * in_p + ct * out_p, 8)


# ------------------------------------------------------------- handler
def build_handler():
    """The campaign's world shape (local ollama route) PLUS, when present,
    the workspace's configured providers, so the production pin has a real
    client to reach. Read-only against the live key store."""
    import openai

    from core.llm.byok_handler import BYOKHandler

    handler = BYOKHandler(workspace_id=WORKSPACE, tenant_id="default",
                          provider_id="auto")
    handler.clients["local_diag"] = openai.OpenAI(
        base_url=f"{OLLAMA}/v1", api_key="ollama")
    handler._local_routes[LOCAL_MODEL] = {
        "provider_key": "local_diag",
        "workspace_id": WORKSPACE,
        "provider_id": "journey-ollama",
        "provider_type": "ollama",
        "supports_tools": True,
        "supports_vision": False,
        "supports_reasoning": False,
        "quality_score": 0.9,
        "context_window": 131072,
    }
    handler._load_local_providers = lambda: None

    from core.dynamic_pricing_fetcher import get_pricing_fetcher
    import core.dynamic_pricing_fetcher as dpf

    fetcher = get_pricing_fetcher()

    async def _empty():
        return {}

    fetcher.fetch_litellm_pricing = _empty
    fetcher.fetch_openrouter_pricing = _empty
    fetcher.fetch_opencode_pricing = _empty
    seed = _pricing_seed()
    if not isinstance(getattr(fetcher, "pricing_cache", None), dict):
        fetcher.pricing_cache = {}
    for model, entry in seed.items():
        fetcher.pricing_cache.setdefault(model, entry)
    dpf._pricing_initialized = True
    return handler


def _provider_clients(handler) -> dict:
    return {k: v for k, v in handler.clients.items() if k != "local_diag"}


# --------------------------------------------------- op classification
def _norm_ws(s: str) -> str:
    import re
    return re.sub(r"\s+", " ", s)


def _strip_md(s: str) -> str:
    import re
    return re.sub(r"[*_`#>|]", "", s)


def _why_op_failed(content: str, op) -> str:
    """Classify WHY one patch op's find-text did not match, against the
    authoritative current content. Exact matching is preserved everywhere —
    this ONLY names the reason, it never substitutes text."""
    find = op.find or ""
    repl = op.replace or ""
    field = (op.field or "").strip()
    if not find:
        return ("empty_find"
                + (f" (field={field!r})" if field else ""))
    if find in content:
        return "matched"
    if find.strip() and find.strip() in content:
        return "leading_trailing_whitespace"
    if _norm_ws(find) in _norm_ws(content):
        return "whitespace_mismatch"
    if find.casefold() in content.casefold():
        return "case_mismatch"
    plain = _strip_md(find)
    if plain and (plain in content or plain.strip() in content):
        return "copied_formatting (markdown decoration)"
    if field and field not in content:
        return f"wrong_field ({field!r} not in the canvas text)"
    if find in EDITED_CONTENT:
        return "stale_revision (find matches the EDITED content)"
    for ln in range(len(find) - 1, max(19, len(find) // 2), -1):
        if find[:ln] in content:
            return (f"find_longer_than_target "
                    f"(prefix {ln}/{len(find)} chars matches)")
    for ln in range(len(find) - 1, max(19, len(find) // 2), -1):
        if find[-ln:] in content:
            return (f"find_starts_mid_text "
                    f"(suffix {ln}/{len(find)} chars matches)")
    if "\n" in find:
        return "multiline_find_not_present"
    if repl and len(repl) >= 10 and repl[:40] in find:
        return "find_carries_replacement_text"
    return "value_not_present (paraphrase or invented text)"


def _op_targets_the_change(op) -> bool:
    """Whether this op touches the requested change (the validity line)."""
    blob = f"{op.find or ''} {op.replace or ''} {op.field or ''}"
    return ("2026-11-30" in blob or "2026-12-31" in blob
            or "valid" in blob.lower())


def _classify_plan_ops(content: str, ops) -> dict:
    """Per-op record for a captured plan + plan-level verdicts."""
    from core.chat_canvas_editor import _apply_patch_ops

    records = []
    failed = []
    for i, op in enumerate(ops or []):
        rec = {
            "index": i,
            "field": getattr(op, "field", None),
            "cell": getattr(op, "cell", None),
            "find": (getattr(op, "find", None) or "")[:600],
            "replace": (getattr(op, "replace", None) or "")[:600],
            "find_len": len(getattr(op, "find", None) or ""),
            "targets_requested_change": _op_targets_the_change(op),
        }
        find_text = getattr(op, "find", None) or ""
        rec["match"] = "matched" if (find_text and find_text in content) \
            else "FAILED"
        if rec["match"] == "FAILED":
            rec["why"] = _why_op_failed(content, op)
            failed.append(rec)
        records.append(rec)
    applied, apply_failed = _apply_patch_ops(content, list(ops or []))
    extras = [r for r in records
              if r["match"] == "matched" and not r["targets_requested_change"]]
    return {
        "ops": records,
        "failed_ops": len(failed),
        "failed": failed,
        "apply_clean": not apply_failed,
        "extra_ops_touching_other_text": len(extras),
    }


# ---------------------------------------------------------------- arms
class Recorder:
    """Wraps the handler's dispatch methods and records full artifacts for
    every attempt: pin kwargs, prompt size, timing, result, raw ops, usage."""

    def __init__(self, pricing: dict):
        self.pricing = pricing
        self.dispatches: list = []

    def wrap(self, handler) -> None:
        """Install the recorders; returns nothing — call `unwrap(handler)`
        (with the same saved originals) when the attempt finishes so
        attempts never chain wrappers."""
        orig_structured = handler.generate_structured_response
        orig_completion = getattr(handler, "generate_completion", None)
        self._orig = (orig_structured, orig_completion)

        async def _rec_structured(**kwargs):
            entry = {
                "kind": "structured",
                "provider_model": list(kwargs["provider_model"])
                if kwargs.get("provider_model") else None,
                "exclude_provider_model": list(kwargs["exclude_provider_model"])
                if kwargs.get("exclude_provider_model") else None,
                "prompt_chars": len(str(kwargs.get("prompt") or "")),
                "max_tokens": kwargs.get("max_tokens"),
                "disable_reasoning": kwargs.get("disable_reasoning"),
                "route_trace_id": kwargs.get("route_trace_id"),
                "t0": time.monotonic(),
            }
            try:
                result = await orig_structured(**kwargs)
            except Exception as exc:  # noqa: BLE001
                entry.update(
                    error=f"{type(exc).__name__}: {str(exc)[:240]}",
                    elapsed_s=round(time.monotonic() - entry["t0"], 2))
                self.dispatches.append(entry)
                raise
            entry["elapsed_s"] = round(time.monotonic() - entry["t0"], 2)
            self._describe_result(entry, result)
            self.dispatches.append(entry)
            return result

        handler.generate_structured_response = _rec_structured

        if orig_completion is not None:
            async def _rec_completion(*args, **kwargs):
                entry = {
                    "kind": "completion",
                    "prompt_chars": len(str(
                        kwargs.get("prompt")
                        or (args[0] if args else "") or "")),
                    "max_tokens": kwargs.get("max_tokens"),
                    "provider_model": list(kwargs["provider_model"])
                    if kwargs.get("provider_model") else None,
                    "t0": time.monotonic(),
                }
                try:
                    result = await orig_completion(*args, **kwargs)
                except Exception as exc:  # noqa: BLE001
                    entry.update(
                        error=f"{type(exc).__name__}: {str(exc)[:240]}",
                        elapsed_s=round(time.monotonic() - entry["t0"], 2))
                    self.dispatches.append(entry)
                    raise
                entry["elapsed_s"] = round(
                    time.monotonic() - entry["t0"], 2)
                text = result if isinstance(result, str) else json.dumps(
                    result, default=str)[:4000]
                entry["response_head"] = str(text or "")[:400]
                entry["response_len"] = len(str(text or ""))
                self.dispatches.append(entry)
                return result

            handler.generate_completion = _rec_completion

    def unwrap(self, handler) -> None:
        orig_structured, orig_completion = self._orig
        handler.generate_structured_response = orig_structured
        if orig_completion is not None:
            handler.generate_completion = orig_completion

    def _describe_result(self, entry: dict, result) -> None:
        entry["result_none"] = result is None
        if result is None:
            return
        entry["result_type"] = type(result).__name__
        raw = getattr(result, "_raw_response", None)
        usage = getattr(raw, "usage", None) if raw is not None else None
        if usage is not None:
            entry["usage"] = {
                "prompt_tokens": getattr(usage, "prompt_tokens", None),
                "completion_tokens": getattr(usage, "completion_tokens", None),
                "total_tokens": getattr(usage, "total_tokens", None),
            }
        echo = getattr(raw, "model", None) if raw is not None else None
        if echo:
            entry["model_echo"] = str(echo)
        if entry.get("provider_model"):
            pinned_model = entry["provider_model"][1]
            served = entry.get("model_echo") or ""
            if not served:
                entry["pin_served_by"] = "unknown"
            elif (served == pinned_model
                  or served.endswith("/" + pinned_model)
                  or pinned_model.endswith("/" + served)):
                entry["pin_served_by"] = "requested"
            else:
                entry["pin_served_by"] = f"cascade:{served}"
        if getattr(result, "ops", None) is not None:
            entry["wants_edit"] = getattr(result, "wants_edit", None)
            entry["edit_mode"] = getattr(result, "edit_mode", None)
            entry["ops_count"] = len(result.ops or [])
            entry["op_classification"] = _classify_plan_ops(
                QUOTE_CONTENT, result.ops)
            entry["reply_head"] = str(
                getattr(result, "reply", "") or "")[:200]
            if getattr(result, "updated_content_json", None):
                entry["updated_content_chars"] = len(
                    result.updated_content_json)
        if getattr(result, "wants_edit", None) is False:
            entry["wants_edit"] = False
            entry["reply_head"] = str(
                getattr(result, "reply", "") or "")[:200]


def _post_checks(plan) -> dict:
    """The identical deterministic guards both arms face: contract, exact
    apply / replace content, and the accepted-assignment validator."""
    from core.chat_canvas_editor import (
        _apply_patch_ops,
        plan_contract_violation,
    )

    check: dict = {
        "plan_returned": plan is not None,
        "contract_violation": (plan_contract_violation(plan)
                               if plan is not None else "no-plan"),
        "wants_edit": bool(plan is not None
                           and getattr(plan, "wants_edit", False)),
    }
    if plan is None or not check["wants_edit"]:
        return check
    if getattr(plan, "ops", None):
        new_content, failed = _apply_patch_ops(QUOTE_CONTENT, plan.ops)
        check["apply_failed_ops"] = len(failed or [])
        check["apply_clean"] = not failed
        check["final_matches_intended"] = (new_content == EDITED_CONTENT)
    elif getattr(plan, "updated_content_json", None):
        check["apply_clean"] = True
        check["final_matches_intended"] = (
            plan.updated_content_json == EDITED_CONTENT)
    else:
        check["apply_clean"] = False
        check["final_matches_intended"] = False
    try:
        from core.factual_change_validation import validate_factual_changes
        from core.turn_decision import extract_request_assignments

        accepted = extract_request_assignments(T1_ASK)
        if getattr(plan, "ops", None):
            v = validate_factual_changes(
                ops=list(plan.ops), current_text=QUOTE_CONTENT,
                request_message=T1_ASK, accepted_assignments=accepted)
        else:
            v = validate_factual_changes(
                new_text_for_replace=plan.updated_content_json,
                current_text=QUOTE_CONTENT, request_message=T1_ASK,
                accepted_assignments=accepted)
        check["validator_grounded"] = bool(v.get("grounded"))
        check["validator_refusals"] = [
            r.get("reason") for r in (v.get("refusals") or [])][:4]
    except Exception as exc:  # noqa: BLE001
        check["validator_error"] = f"{type(exc).__name__}: {str(exc)[:160]}"
    return check


async def _one_attempt(handler, label: str, pricing: dict) -> dict:
    import core.chat_canvas_editor as cce
    from core.llm_service import LLMService

    rec = Recorder(pricing)
    rec.wrap(handler)

    svc = LLMService(workspace_id=WORKSPACE, tenant_id="default")
    svc._get_handler = lambda **kwargs: handler

    canvas = {"canvas_id": "cv-t1-bench", "canvas_type": "document",
              "title": QUOTE_TITLE, "content": QUOTE_CONTENT}
    t0 = time.monotonic()
    outcome: dict = {"label": label}
    try:
        plan = await asyncio.wait_for(
            cce.plan_canvas_edit(
                T1_ASK, [], dict(canvas), svc, workspace_id=WORKSPACE,
                execution_id=f"t1bench-{label}",
                user_identity=dict(T1_USER_IDENTITY),
                versions=_t1_world_versions()),
            timeout=ATTEMPT_BOUND_S)
        outcome["timed_out"] = False
    except asyncio.TimeoutError:
        plan = None
        outcome["timed_out"] = True
    except Exception as exc:  # noqa: BLE001
        plan = None
        outcome["plan_error"] = f"{type(exc).__name__}: {str(exc)[:200]}"
    finally:
        rec.unwrap(handler)
    outcome["elapsed_s"] = round(time.monotonic() - t0, 2)
    outcome["dispatches"] = list(rec.dispatches)

    checks = _post_checks(plan)
    outcome.update(checks)
    if outcome.get("timed_out"):
        outcome["result"] = "unavailable (deadline)"
    elif plan is None:
        outcome["result"] = "unavailable (no plan)"
    elif not checks["wants_edit"]:
        outcome["result"] = "refusal (no edit)"
    elif checks.get("contract_violation"):
        outcome["result"] = "invalid (contract violation)"
    elif not checks.get("apply_clean"):
        outcome["result"] = "ineffective (patch did not match)"
    elif not checks.get("final_matches_intended"):
        outcome["result"] = "ineffective (wrong final content)"
    elif checks.get("validator_grounded") is not True:
        outcome["result"] = "ineffective (validator refused)"
    else:
        outcome["result"] = "effective_edit"

    tokens = {"prompt_tokens": 0, "completion_tokens": 0}
    cost = 0.0
    cost_known = True
    for d in rec.dispatches:
        u = d.get("usage") or {}
        if u.get("prompt_tokens") is None and d.get("kind") == "structured":
            cost_known = False
        tokens["prompt_tokens"] += u.get("prompt_tokens") or 0
        tokens["completion_tokens"] += u.get("completion_tokens") or 0
        model = None
        if d.get("provider_model"):
            model = d["provider_model"][1]
        else:
            pm = d.get("model_echo")
            model = pm or LOCAL_MODEL
        c = _cost_usd(model, u, pricing)
        if c is None:
            if u:
                cost_known = False
        else:
            cost += c
    outcome["tokens"] = tokens
    outcome["cost_usd"] = round(cost, 8) if cost_known else None
    outcome["cost_note"] = (None if cost_known
                            else "unknown for one or more dispatches "
                                 "(no usage and/or no price)")
    return outcome


# --------------------------------------------------------------- probe
async def _probe(handler, pricing: dict) -> list:
    import openai  # noqa: F401 — client already built
    from pydantic import BaseModel

    class Ping(BaseModel):
        ok: bool
        echo: str

    results = []
    for prov, model in PROBE_CANDIDATES:
        entry: dict = {"provider": prov, "model": model}
        if prov not in handler.clients:
            entry["error"] = "no client for this provider (no stored key)"
            results.append(entry)
            continue
        orig = handler.generate_structured_response
        t0 = time.monotonic()
        try:
            result = await asyncio.wait_for(
                orig(prompt='Return ok=true and echo="ping".',
                     system_instruction="Return the JSON object.",
                     response_model=Ping, task_type="planning",
                     provider_model=(prov, model),
                     disable_reasoning=True),
                timeout=PROBE_BOUND_S)
            entry["latency_s"] = round(time.monotonic() - t0, 2)
            entry["ok"] = bool(result is not None
                               and getattr(result, "ok", False))
            raw = getattr(result, "_raw_response", None)
            usage = getattr(raw, "usage", None) if raw is not None else None
            if usage is not None:
                entry["tokens"] = {
                    "prompt": getattr(usage, "prompt_tokens", None),
                    "completion": getattr(usage, "completion_tokens", None)}
            entry["model_echo"] = str(getattr(raw, "model", None)) \
                if raw is not None else None
        except Exception as exc:  # noqa: BLE001
            entry["latency_s"] = round(time.monotonic() - t0, 2)
            entry["error"] = f"{type(exc).__name__}: {str(exc)[:200]}"
        results.append(entry)
        print(f"  probe {prov}/{model}: {entry}", flush=True)
    return results


# ---------------------------------------------------------------- main
def _summarize(attempts: list) -> dict:
    results = [a.get("result") for a in attempts]
    effective = sum(1 for r in results if r == "effective_edit")
    refusals = sum(1 for r in results if (r or "").startswith("refusal"))
    unavailable = sum(1 for r in results
                      if (r or "").startswith("unavailable"))
    ineffective = sum(1 for r in results
                      if (r or "").startswith("ineffective")
                      or (r or "").startswith("invalid"))
    lat = [a.get("elapsed_s") for a in attempts if a.get("elapsed_s")]
    costs = [a.get("cost_usd") for a in attempts]
    failed_ops = []
    first_plans = []
    pin_mismatches = []
    for a in attempts:
        for d in a.get("dispatches") or []:
            oc = d.get("op_classification")
            if oc:
                failed_ops.extend([f.get("why") for f in oc["failed"]])
            if d.get("provider_model") and \
                    d.get("pin_served_by") not in (None, "requested"):
                pin_mismatches.append({
                    "label": a.get("label"),
                    "requested": list(d["provider_model"]),
                    "served_by": d.get("pin_served_by"),
                })
            if d.get("kind") == "structured" and oc and not first_plans:
                first_plans.append(oc)
    return {
        "attempts": len(attempts),
        "effective_edits": effective,
        "refusals": refusals,
        "unavailable": unavailable,
        "ineffective_or_invalid": ineffective,
        "results": results,
        "latency_s": lat,
        "latency_mean_s": round(sum(lat) / len(lat), 2) if lat else None,
        "cost_usd_total": (round(sum(c for c in costs if c is not None), 8)
                           if all(c is not None for c in costs) else None),
        "failed_op_whys": failed_ops,
        "pin_mismatches": pin_mismatches,
        "first_plan_classifications": first_plans[:3],
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--reps-a", type=int, default=6)
    ap.add_argument("--reps-b", type=int, default=6)
    ap.add_argument("--pin", default=None,
                    help="provider/model pin for arm B (skips probe)")
    args = ap.parse_args()

    pricing = _pricing_seed()
    handler = build_handler()
    provider_clients = _provider_clients(handler)
    local_clients = {k: v for k, v in handler.clients.items()
                     if k == "local_diag"}

    out: dict = {
        "benchmark": "T1 op-capture + planning-rung (isolated; NOT acceptance)",
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
        "workload": {"title": QUOTE_TITLE, "content": QUOTE_CONTENT,
                     "ask": T1_ASK, "intended": EDITED_CONTENT,
                     "user_identity": T1_USER_IDENTITY,
                     "versions_source": str(T1_VERSIONS_PATH),
                     "production_prompt_capture":
                         "/tmp/j6_r18_draft_evidence/t1_capture/"
                         "plan_capture.jsonl (byte-identical verified)"},
        "attempt_bound_s": ATTEMPT_BOUND_S,
        "pricing_cache": {
            "path": str(PRICING_CACHE_PATH),
            "md5": (hashlib.md5(PRICING_CACHE_PATH.read_bytes()).hexdigest()
                    if PRICING_CACHE_PATH.exists() else None),
            "seeded_models": sorted(pricing),
        },
        "providers_available": sorted(provider_clients),
        "git_head": os.popen(
            f"git -C {BACKEND.parent} rev-parse --short HEAD").read().strip(),
    }
    print(f"providers with clients: {sorted(provider_clients)}", flush=True)

    if args.probe:
        out["probe"] = asyncio.run(_probe(handler, pricing))
        path = Path(__file__).parent / (
            "t1_probe_" + time.strftime("%Y%m%d_%H%M%S") + ".json")
        path.write_text(json.dumps(out, indent=1, default=str))
        print(f"evidence: {path}")
        return 0

    # Arm A: the campaign's compact baseline — local route ONLY, no pin.
    for k in list(handler.clients):
        if k != "local_diag":
            del handler.clients[k]
    os.environ.pop("ATOM_ASYNC_EDIT_PLAN_MODEL", None)
    arm_a = []
    for i in range(args.reps_a):
        r = asyncio.run(_one_attempt(handler, f"A-baseline-{i + 1}", pricing))
        arm_a.append(r)
        print(f"A{i + 1}: {r.get('result')} "
              f"({r.get('elapsed_s')}s) "
              f"dispatches={len(r.get('dispatches') or [])}", flush=True)
    out["arm_A_compact_baseline"] = arm_a
    out["arm_A_summary"] = _summarize(arm_a)

    # Pick arm B's pin (probe first, unless given).
    pin_spec = args.pin
    if not pin_spec:
        handler.clients.update(provider_clients)
        probe = asyncio.run(_probe(handler, pricing))
        out["probe"] = probe
        for entry in probe:
            if entry.get("ok"):
                pin_spec = f"{entry['provider']}/{entry['model']}"
                break
        if not pin_spec:
            out["arm_B_error"] = "no configured provider answered the probe"
            path = Path(__file__).parent / (
                "benchmark_t1_rung_" + time.strftime("%Y%m%d_%H%M%S")
                + ".json")
            path.write_text(json.dumps(out, indent=1, default=str))
            print(json.dumps(out["arm_A_summary"], indent=1, default=str))
            print(f"ARM B SKIPPED (no working provider). evidence: {path}")
            return 2

    prov, model = pin_spec.split("/", 1)
    out["arm_B_pin"] = {"provider": prov, "model": model,
                        "mechanism": "ATOM_ASYNC_EDIT_PLAN_MODEL"}

    # Arm B: same lane/handler, local route + the pinned provider client,
    # pin through the product's own env knob (identical guards/deadline).
    handler.clients.update(provider_clients)
    if prov not in handler.clients:
        out["arm_B_error"] = f"provider {prov!r} has no client"
        path = Path(__file__).parent / (
            "benchmark_t1_rung_" + time.strftime("%Y%m%d_%H%M%S") + ".json")
        path.write_text(json.dumps(out, indent=1, default=str))
        print(f"ARM B SKIPPED ({out['arm_B_error']}). evidence: {path}")
        return 2
    os.environ["ATOM_ASYNC_EDIT_PLAN_MODEL"] = pin_spec
    arm_b = []
    for i in range(args.reps_b):
        r = asyncio.run(_one_attempt(handler, f"B-{prov}-{i + 1}", pricing))
        arm_b.append(r)
        print(f"B{i + 1}: {r.get('result')} ({r.get('elapsed_s')}s) "
              f"dispatches={len(r.get('dispatches') or [])}", flush=True)
    out["arm_B_planning_rung"] = arm_b
    out["arm_B_summary"] = _summarize(arm_b)

    path = Path(__file__).parent / (
        "benchmark_t1_rung_" + time.strftime("%Y%m%d_%H%M%S") + ".json")
    path.write_text(json.dumps(out, indent=1, default=str))
    print(f"evidence: {path}")
    print("== A (compact baseline) ==")
    print(json.dumps(out["arm_A_summary"], indent=1, default=str))
    print("== B (planning rung: %s) ==" % pin_spec)
    print(json.dumps(out["arm_B_summary"], indent=1, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
