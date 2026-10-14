# -*- coding: utf-8 -*-
"""Comparison attribution at its producer + delivery classification
(verifier steps 3-4).

The canvas/file comparison producers record the executed comparison on
the execution-keyed session carrier `_objective_evidence_{eid}` — the
authoritative canvas revision (source.source_id), coverage outcomes and
source observations. The outcome builder read only the RESPONSE shapes,
so an executed read-only comparison settled ZERO evidence refs; the
fallback resolver had no branch that treated the recorded comparison as
the requested result. These tests pin:

  attribution   the builder settles comparison evidence refs and
                comparison_complete from the execution-keyed carrier —
                producer records, never reply prose; another turn's
                carrier never donates;
  classification a covered comparison validates the delivery (recorded
                facts); a carrier with unresolved outcomes does not; a
                decline that supplied no comparison is classified by
                what was delivered — unconfirmed, never upgraded.
"""
import os
os.environ.setdefault("TESTING", "1")

import pytest
from unittest.mock import patch

import integrations.chat_orchestrator as chat


def _comparison(outcome_status="comparable_match"):
    """The producer's REAL shape (build_source_comparison): top-level
    evidence observations with source identities, coverage outcomes
    whose statuses are comparable_match / comparable_changed /
    field_missing / ..., and the authoritative canvas revision as
    source.source_id."""
    return {
        "source": {"source_id": "cv-j6", "source_type": "artifact",
                   "version": "cv-j6"},
        "coverage": {
            "outcome_count": 1,
            "complete": outcome_status in (
                "comparable_match", "comparable_changed"),
            "outcomes": [{
                "item": "Unit price",
                "status": outcome_status,
                "draft_value": "$48,000.00",
                "source_value": "$48,000.00",
                "decision": "consistent",
            }],
        },
        "evidence": [{
            "field_selection": "Unit price",
            "source": {"source_id": "src-price-list-2019",
                       "content_hash": "hash-src"},
            "value": 48000.0,
        }],
    }


def _built_outcome(session, execution_id, message="compare the price"):
    orch = chat.ChatOrchestrator.__new__(chat.ChatOrchestrator)
    return chat.ChatOrchestrator._build_turn_task_outcome(
        orch, session, message,
        {"success": True, "message": "Unit price matches the source."},
        None, None, execution_id=execution_id)


def _comparison_rows(outcome):
    return [t for t in (outcome.get("tool_outcomes") or [])
            if isinstance(t, dict)
            and t.get("evidence_refs")
            and any(r.get("source_id") == "cv-j6"
                    or r.get("kind") == "source_comparison"
                    for r in (t.get("evidence_refs") or []))]


def test_builder_settles_comparison_from_the_execution_carrier():
    session = {"_objective_evidence_exec-cmp": _comparison()}
    outcome = _built_outcome(session, "exec-cmp")
    rows = _comparison_rows(outcome)
    assert rows, (
        "the carrier's comparison must settle evidence refs in the "
        f"durable outcome; tool_outcomes={outcome.get('tool_outcomes')}")
    refs = [r for t in rows for r in (t.get("evidence_refs") or [])]
    assert any((r.get("source") or {}).get("source_id") == "cv-j6"
               and r.get("kind") == "source_comparison"
               for r in refs), (
        f"the authoritative canvas revision must be attributed; {refs}")
    assert any((r.get("source") or {}).get("source_id")
               == "src-price-list-2019" for r in refs), (
        f"the comparison-source observation must be attributed; {refs}")


def test_another_turns_carrier_never_donates():
    session = {"_objective_evidence_exec-old": _comparison()}
    outcome = _built_outcome(session, "exec-now")
    assert _comparison_rows(outcome) == []
    assert outcome.get("objective_met") is not True


def test_resolver_validates_a_covered_comparison():
    session = {"_objective_evidence_exec-cmp": _comparison()}
    state = chat._fallback_turn_outcome(
        session, "exec-cmp", [], None, workspace_id=None)
    assert state["delivered"] is True, (
        "the recorded covered comparison IS the requested result")
    assert state["state"] == "completed", (
        "a covered comparison with no recorded obligations completes")


def test_resolver_ignores_an_unresolved_carrier():
    session = {"_objective_evidence_exec-cmp": _comparison(
        outcome_status="field_missing")}
    state = chat._fallback_turn_outcome(
        session, "exec-cmp", [], None, workspace_id=None)
    assert state["delivered"] is False, (
        "a field-missing comparison is not a delivered result (the "
        "builder's own covered-set)")
    assert state["state"] == "unconfirmed"


def test_real_producer_carrier_settles_the_revision_ref():
    """Review defect 2 (84143bdd8): the ref must settle from a REAL
    producer — build_canvas_evidence_comparison's own output (which now
    names the compared canvas at top level), not a hand-fabricated
    fixture."""
    from core.chat_canvas_editor import build_canvas_evidence_comparison

    canvas = {
        "canvas_id": "cv-real",
        "canvas_type": "document",
        "title": "Quotation",
        "content": (
            "# Quotation Q-2026-114\n\n"
            "Client: Dunmore Fabrication LLC\n"
            "Unit price: $48,000.00\n"
            "Subtotal: $48,000.00\n"
            "Valid until: 2026-11-30\n"),
    }
    carrier = build_canvas_evidence_comparison(
        canvas, None, source_observations=[], authorized_actions=[],
        objective_text="compare the unit price on this quotation")
    assert (carrier.get("source") or {}).get("source_id") == "cv-real", (
        f"the producer names the compared revision; got "
        f"{carrier.get('source')!r}")
    session = {"_objective_evidence_exec-real": carrier}
    outcome = _built_outcome(session, "exec-real")
    refs = [r for t in (outcome.get("tool_outcomes") or [])
            for r in (t.get("evidence_refs") or [])]
    assert any(
        (r.get("source") or {}).get("source_id") == "cv-real"
        and r.get("kind") == "source_comparison" for r in refs), (
        f"the compared revision settles from the real producer; {refs}")


def test_builder_field_missing_is_not_covered():
    """Review defect 1 (84143bdd8) — the builder half: a comparison
    whose source field was never found is NOT covered on ANY lane. The
    fallback already excluded it; the builder's covered-set now agrees,
    so the same carrier cannot read completed on one resolver and
    unconfirmed on the other."""
    session = {"_objective_evidence_exec-fm": _comparison(
        outcome_status="field_missing")}
    outcome = _built_outcome(session, "exec-fm")
    assert outcome.get("objective_met") is not True, (
        "a field-missing comparison does not complete the objective")


def test_a_decline_without_a_recorded_result_stays_unconfirmed():
    """The classification rule: not every honest decline upgrades. A
    turn whose records show NO comparison, NO ops and NO delivery
    carrier is unconfirmed regardless of polite wording."""
    session = {"session_id": "conv-x", "id": "conv-x",
               "user_id": "user-1"}
    state = chat._fallback_turn_outcome(
        session, "exec-decline", [], None, workspace_id=None)
    assert state["delivered"] is False
    assert state["state"] == "unconfirmed"
