#!/usr/bin/env python3
"""Serve the UNCHANGED L2 candidate with behavior-preserving observation
hooks.

The candidate source is not edited. The hooks wrap production seams, call
the originals, return their results unchanged, and append the inputs/outputs
to a JSONL file. They exist because the interpretation record and the
execution-keyed evidence requirement are session-scoped and are not
otherwise persisted; the durable execution row remains authoritative for
settlement.

Environment (set by run_l2_served.py):
  L2_CAND_BACKEND       candidate backend directory (cwd for the process)
  L2_PORT               isolated port
  L2_OBSERVATION_LOG    JSONL path
"""
from __future__ import annotations

import json
import os
import sys
import threading
import time
from pathlib import Path

CAND_BACKEND = Path(os.environ["L2_CAND_BACKEND"]).resolve()
OBS = Path(os.environ["L2_OBSERVATION_LOG"]).resolve()
PORT = int(os.environ["L2_PORT"])

sys.path.insert(0, str(CAND_BACKEND))
os.chdir(str(CAND_BACKEND))

_lock = threading.Lock()


def emit(event: str, payload: dict) -> None:
    record = {"ts": time.time(), "event": event}
    record.update(payload)
    with _lock:
        with OBS.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, default=str) + "\n")


def _safe_observed(session):
    try:
        import core.turn_decision as td

        return td.session_observed_sources(session)
    except Exception:
        return []


def _safe_requested(session):
    try:
        import core.turn_decision as td

        return td.session_requested_sources(session)
    except Exception:
        return []


def _session_carriers(session):
    if not isinstance(session, dict):
        return {"requirement_keys": [], "observation_keys": [],
                "observed": {}, "requested": {}}
    req_keys = sorted(str(k) for k in session
                      if str(k).startswith("_evidence_requirement_"))
    obs_keys = sorted(str(k) for k in session
                      if str(k).startswith("_retrieval_source_observations_"))
    observed = {}
    for key in obs_keys[-8:]:
        rows = session.get(key)
        if not isinstance(rows, list):
            continue
        observed[key] = [
            {k: row.get(k) for k in
             ("observation_id", "source", "file_name", "title",
              "workspace_id", "content_hash")}
            for row in rows if isinstance(row, dict)
        ]
    requested = {}
    for key in req_keys[-8:]:
        row = session.get(key)
        if isinstance(row, dict):
            requested[key] = row
    return {"requirement_keys": req_keys,
            "observation_keys": obs_keys,
            "observed": observed,
            "requested": requested}


def install_hooks() -> None:
    import core.turn_decision as td
    import integrations.chat_orchestrator as co

    orig_interpret = td.interpret_turn_request

    async def interpret_turn_request(*args, **kwargs):
        message = args[0] if args else kwargs.get("message")
        try:
            result = await orig_interpret(*args, **kwargs)
        except Exception as exc:
            emit("interpret_turn_request_error",
                 {"message": message, "error": repr(exc)})
            raise
        try:
            emit("interpret_turn_request",
                 {"message": message, "interpretation": result})
        except Exception:
            pass
        return result

    td.interpret_turn_request = interpret_turn_request

    orig_apply = td.apply_interpretation_references

    def apply_interpretation_references(decision, interpretation, session):
        result = orig_apply(decision, interpretation, session)
        try:
            emit("apply_interpretation_references", {
                "message": (interpretation or {}).get("message")
                if isinstance(interpretation, dict) else "",
                "interpretation": interpretation,
                "observed": _safe_observed(session),
                "requested": _safe_requested(session),
                "decision_refs_before": (
                    (decision or {}).get("references")
                    if isinstance(decision, dict) else None),
                "decision_refs_after": (
                    (result or {}).get("references")
                    if isinstance(result, dict) else None),
            })
        except Exception:
            pass
        return result

    td.apply_interpretation_references = apply_interpretation_references

    orig_stash = co._stash_evidence_requirement

    def stash_evidence_requirement(*args, **kwargs):
        requirement = orig_stash(*args, **kwargs)
        try:
            session = args[0] if args else kwargs.get("session")
            execution_id = args[1] if len(args) > 1 \
                else kwargs.get("execution_id")
            message = args[3] if len(args) > 3 else kwargs.get("message")
            decision = args[2] if len(args) > 2 else kwargs.get("decision")
            carriers = _session_carriers(session)
            bound = (isinstance(session, dict)
                     and execution_id
                     and session.get(
                         f"_evidence_requirement_{execution_id}") is
                     requirement)
            emit("stash_evidence_requirement", {
                "execution_id": execution_id,
                "message": message,
                "decision_refs": (
                    (decision or {}).get("references")
                    if isinstance(decision, dict) else None),
                "requirement": requirement,
                "bound_to_execution_key": bool(bound),
                "carriers": carriers,
            })
        except Exception:
            pass
        return requirement

    co._stash_evidence_requirement = stash_evidence_requirement

    orig_cf = co._context_backed_fulfillment

    def context_backed_fulfillment(*args, **kwargs):
        verdict = orig_cf(*args, **kwargs)
        try:
            execution_id = args[1] if len(args) > 1 \
                else kwargs.get("execution_id")
            emit("context_backed_fulfillment", {
                "execution_id": execution_id,
                "verdict": verdict,
            })
        except Exception:
            pass
        return verdict

    co._context_backed_fulfillment = context_backed_fulfillment

    orig_fallback = co._fallback_turn_outcome

    def fallback_turn_outcome(*args, **kwargs):
        state = orig_fallback(*args, **kwargs)
        try:
            execution_id = args[1] if len(args) > 1 \
                else kwargs.get("execution_id")
            emit("fallback_turn_outcome", {
                "execution_id": execution_id,
                "state": state,
            })
        except Exception:
            pass
        return state

    co._fallback_turn_outcome = fallback_turn_outcome

    emit("hooks_installed", {
        "candidate_backend": str(CAND_BACKEND),
        "hooks": [
            "core.turn_decision.interpret_turn_request",
            "core.turn_decision.apply_interpretation_references",
            "integrations.chat_orchestrator._stash_evidence_requirement",
            "integrations.chat_orchestrator._context_backed_fulfillment",
            "integrations.chat_orchestrator._fallback_turn_outcome",
        ],
    })


def main() -> int:
    install_hooks()
    import uvicorn
    from main_api_app import app

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=PORT,
        log_level="info",
        timeout_keep_alive=75,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
