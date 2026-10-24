#!/usr/bin/env python3
"""Deterministic exact-link rescore of the preserved L3 served attempt.

Owner harness improvement (2026-10-18): ``receipt_bound_to_current_request``
must bind through the RESPONSE's own ``execution_id`` — exact row lookup —
not a query-word check over a recently-ordered execution. This script
re-derives the whole chain from the PRESERVED raw attempt
(``attempt1_result.json``) and the PRESERVED scratch DB (read-only):

    response execution_id -> execution row -> session/conversation ->
    assistant row -> verified documents receipt -> uploaded document id
    and workspace

No model call, no new request, no rewrite of the raw attempt: the raw
``attempt1_result.json`` stays untouched; this writes
``attempt1_result_exactlink.json`` beside it. Exit 0 = chain agrees and
all nine gates (exact-link version) hold.
"""
from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "attempt1_result.json"


def main() -> int:
    raw = json.loads(RAW.read_text())
    st = raw["steps"]
    resp = st["l3_turn"]["response"]
    response_execution_id = str(resp.get("execution_id") or "")
    response_session_id = str(resp.get("session_id") or "")
    upload_doc_id = str((st.get("upload") or {}).get("doc_id") or "")
    user = st.get("user") or {}
    db_url = raw["declared_config"]["isolation"]["database_url"]
    db_path = db_url.replace("sqlite:///", "")
    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    chain: dict = {
        "response_execution_id": response_execution_id,
        "response_session_id": response_session_id,
        "upload_doc_id": upload_doc_id,
    }
    try:
        # 1. execution row BY EXACT ID (never a recent-ordering pick).
        row = con.execute(
            "SELECT id, metadata_json FROM agent_executions WHERE id=?",
            (response_execution_id,)).fetchone()
        chain["execution_row_found"] = row is not None
        if not row:
            raise SystemExit("exact execution row not found")
        rid, meta_raw = row
        meta = json.loads(meta_raw or "{}")
        outcome = meta.get("task_outcome") or {}
        chain["execution_row_id"] = str(rid)
        chain["row_session_id"] = str(meta.get("session_id") or "")
        chain["row_user_id"] = str(meta.get("user_id") or "")
        chain["row_workspace_id"] = str(meta.get("workspace_id") or "")
        chain["task_outcome_execution_id"] = str(
            outcome.get("execution_id") or "")
        chain["task_outcome_turn_id"] = str(outcome.get("turn_id") or "")
        chain["objective_met"] = outcome.get("objective_met")
        chain["delivery"] = outcome.get("delivery")
        tool_outcomes = outcome.get("tool_outcomes") or []
        docs = [t for t in tool_outcomes
                if str(t.get("tool") or "").startswith("documents")]
        chain["tool_outcomes_tools"] = [t.get("tool") for t in tool_outcomes]
        chain["documents_receipts"] = [{
            "tool": t.get("tool"),
            "verified": t.get("verified"),
            "outcome": str(t.get("outcome") or "")[:120],
            "refs": [{"query": str(r.get("query") or ""),
                      "coverage": r.get("coverage"),
                      "match_count": r.get("match_count"),
                      "truncated": r.get("truncated")}
                     for r in (t.get("evidence_refs") or [])
                     if isinstance(r, dict)],
        } for t in docs]

        # 2. session/conversation -> assistant row.
        convs = [c[0] for c in con.execute(
            "SELECT DISTINCT conversation_id FROM chat_messages").fetchall()]
        chain["conversations"] = convs
        arow = con.execute(
            "SELECT content, metadata_json FROM chat_messages "
            "WHERE conversation_id=? AND role='assistant' "
            "ORDER BY rowid DESC LIMIT 1",
            (response_session_id,)).fetchone()
        chain["assistant_row_found"] = arow is not None
        if arow:
            ameta = json.loads(arow[1] or "{}")
            chain["assistant_meta_outcome"] = ameta.get("outcome")
            chain["assistant_meta_success"] = ameta.get("success")
            chain["assistant_content_head"] = str(arow[0])[:200]

        # 3. uploaded document id + workspace.
        drow = con.execute(
            "SELECT file_name, workspace_id, content_preview FROM "
            "ingested_documents WHERE id=?", (upload_doc_id,)).fetchone()
        chain["upload_row_found"] = drow is not None
        if drow:
            chain["upload_file_name"] = drow[0]
            chain["upload_workspace_id"] = drow[1]
            chain["upload_preview_has_code"] = "QUARTZ-77" in str(drow[2] or "")
    finally:
        con.close()

    # 4. exact-link gates (identical to the driver's post-fix checks).
    exact_row_bound = bool(
        chain["execution_row_found"]
        and chain["task_outcome_execution_id"] == response_execution_id)
    complete_refs = [
        r for t in chain.get("documents_receipts", [])
        for r in t.get("refs", [])
        if r.get("coverage") == "complete"
        and isinstance(r.get("match_count"), int)
        and not isinstance(r.get("match_count"), bool)
        and r.get("match_count") >= 1]
    settled = st.get("settlement") or {}
    checks = {
        "upload_through_product": bool(
            (st.get("upload") or {}).get("http") == 200
            and chain.get("upload_row_found")
            and chain.get("upload_preview_has_code")),
        "planner_dispatch_real": bool(
            (st.get("intended_vs_actual") or {}
             ).get("structured_dispatch_models")),
        "documents_receipt_executed": bool(
            any(t.get("verified") is True
                for t in chain.get("documents_receipts", []))),
        "receipt_verified_complete_coverage": bool(complete_refs),
        "receipt_bound_to_current_request": exact_row_bound,
        "objective_met_true": chain.get("objective_met") is True,
        "answer_contains_code": "quartz-77" in str(
            settled.get("final_message") or "").lower()
        or "quartz-77" in str(resp.get("message") or "").lower(),
        "successful_response": bool(
            resp.get("success") is True
            or settled.get("final_success") is True),
        "history_nonnull_agreement": bool(
            settled.get("final_outcome") is not None
            and settled.get("final_success") is not None
            and chain.get("assistant_meta_outcome")
            == settled.get("final_outcome")
            and chain.get("assistant_meta_success")
            == settled.get("final_success")
            and (resp.get("success") in (None, settled.get("final_success")))),
    }
    out = {
        "rescored_from": "attempt1_result.json (raw attempt preserved, "
                         "unmodified; no model call, no new request)",
        "owner_improvement": (
            "receipt_bound_to_current_request now binds through the "
            "response's own execution_id (exact row lookup) instead of a "
            "query-word check over a recently-ordered execution; the "
            "query text is recorded as supporting evidence"),
        "chain": chain,
        "checks": checks,
        "pass": all(checks.values()),
    }
    (HERE / "attempt1_result_exactlink.json").write_text(
        json.dumps(out, indent=2, sort_keys=True, default=str))
    print(json.dumps({"pass": out["pass"], "checks": checks,
                      "chain_summary": {
                          "execution_row_found": chain["execution_row_found"],
                          "task_outcome_execution_id":
                              chain["task_outcome_execution_id"],
                          "assistant_row_found":
                              chain["assistant_row_found"],
                          "upload_row_found": chain["upload_row_found"],
                      }}, indent=2))
    return 0 if out["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
