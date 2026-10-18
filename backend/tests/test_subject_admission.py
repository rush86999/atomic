# -*- coding: utf-8 -*-
"""SUBJECT ADMISSION regressions (owner work order 2026-10-10).

The captured owner request — "What's our quoted price for the Roper
Whitney No. 381 roll bender, and what's the list price in our workbook
that it's based on?" — was admitted as FOUR entities, three of them
clause fragments or incomplete names ('s our quoted price ... and what',
'Roper Whitney No', 'Roper Whitney'), and their read obligations stayed
open at attempts=3, blocking a job whose real subject had already been
fully resolved. Reproduced here from the literal stored shape.

Scratch DB only. No model calls — the accepted interpretation is
supplied as it arrives at the seam, which is exactly the handoff under
test (interpretation in, subjects out).
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("TESTING", "1")

from core.subject_admission import (
    admit_subjects, group_subject_aliases, is_defensible_identifier,
)

OWNER_REQUEST = ("What's our quoted price for the Roper Whitney No. 381 "
                 "roll bender, and what's the list price in our workbook "
                 "that it's based on?")

#: The literal candidates the independent miner produced for that
#: request (recorded live in run 70a8078c: all four became entities).
MINED_FOR_OWNER_REQUEST = [
    "381",
    "s our quoted price for the Roper Whitney No. 381 roll bender, and "
    "what",
    "Roper Whitney No",
    "Roper Whitney",
]


def _interp(subjects, scope_change="replace"):
    return {"subjects": subjects, "scope_change": scope_change,
            "origin": "llm"}


class TestAcceptanceInterpretationIsTheSubjectSet:
    """A valid interpretation's subjects ARE the requested targets; the
    miner's fragments are never appended to them."""

    def test_owner_request_admits_one_subject(self):
        out = admit_subjects(OWNER_REQUEST,
                             _interp(["Roper Whitney No. 381 roll bender"]))
        assert out["origin"] == "interpretation"
        assert out["subjects"] == ["Roper Whitney No. 381 roll bender"]
        assert out["clarification"] is False

    def test_miner_fragments_do_not_survive_admission(self):
        """Even though the miner returns four fragments for this exact
        request, they are NOT part of the admitted set — the miner is
        only consulted when no interpretation exists."""
        out = admit_subjects(
            OWNER_REQUEST, _interp(["Roper Whitney No. 381 roll bender"]),
            deterministic_targets=MINED_FOR_OWNER_REQUEST)
        assert out["subjects"] == ["Roper Whitney No. 381 roll bender"]
        for fragment in MINED_FOR_OWNER_REQUEST:
            assert fragment not in out["subjects"], fragment

    def test_clause_fragment_is_never_defensible(self):
        for fragment in MINED_FOR_OWNER_REQUEST[1:]:
            assert is_defensible_identifier(fragment) is False, (
                f"{fragment!r} is prose, not an identifier")


class TestAliasesAreOneSubject:
    """One product with several spellings is one job, not three."""

    def test_three_spellings_collapse_to_one(self):
        groups = group_subject_aliases([
            "Roper Whitney No. 381 roll bender", "No. 381", "381"])
        assert len(groups) == 1, groups
        canonical = groups[0]["subject"]
        assert canonical == "Roper Whitney No. 381 roll bender", canonical
        assert set(groups[0]["aliases"]) == {"No. 381", "381"}

    def test_mixed_aliases_admissible_from_interpretation(self):
        out = admit_subjects(
            "Quote No. 381 and the Roper Whitney No. 381 roll bender.",
            _interp(["No. 381", "Roper Whitney No. 381 roll bender"]))
        assert out["subjects"] == ["Roper Whitney No. 381 roll bender"]
        assert out["aliases"]["Roper Whitney No. 381 roll bender"] == \
            ["No. 381"]

    def test_manufacturer_alone_is_not_a_product(self):
        """A brand name with no code anchor is not a product unless the
        user asked for manufacturer-wide work."""
        out = admit_subjects(
            "What's the price of Roper Whitney?",
            {"subjects": [], "scope_change": "unresolved"},
            deterministic_targets=["Roper Whitney"])
        assert out["subjects"] == []
        assert out["clarification"] is True, (
            "a brand alone cannot establish product scope")

    def test_manufacturer_wide_request_stays_broad(self):
        out = admit_subjects(
            "List everything they make from Roper Whitney with prices.",
            {"subjects": [], "scope_change": "unresolved"},
            deterministic_targets=["Roper Whitney"])
        assert out["subjects"] == ["Roper Whitney"], out
        assert out["clarification"] is False


class TestTwoExplicitMachinesRemainTwoSubjects:
    def test_two_named_machines(self):
        out = admit_subjects(
            "Compare the No. 381 roll bender with the U-22 bead roller.",
            _interp(["No. 381 roll bender", "U-22 bead roller"]))
        assert out["subjects"] == ["No. 381 roll bender", "U-22 bead roller"]

    def test_unrelated_codes_do_not_collapse(self):
        groups = group_subject_aliases(["No. 381", "U-22"])
        assert len(groups) == 2, groups


class TestUnresolvedProseGetsOneClarification:
    """No defensible subject means ONE scope-clarification obligation,
    never a read obligation for every mined fragment."""

    def test_vague_request_clarifies_once(self):
        out = admit_subjects(
            "Could you sort out the pricing situation for me?",
            {"subjects": [], "scope_change": "unresolved"},
            deterministic_targets=["pricing situation", "pricing"])
        assert out["subjects"] == []
        assert out["clarification"] is True
        assert out["origin"] == "unresolved"

    def test_interpretation_failure_keeps_defensible_code(self):
        """On interpretation failure the fallback keeps an explicit,
        code-anchored identifier rather than fabricating subjects."""
        out = admit_subjects(
            "What's our quoted price for the Roper Whitney No. 381 roll "
            "bender, and what's the list price in our workbook?",
            {"subjects": [], "scope_change": "unresolved"},
            deterministic_targets=MINED_FOR_OWNER_REQUEST)
        assert out["subjects"] == ["381"], out
        assert out["origin"] == "fallback"
        assert out["clarification"] is False

    def test_nothing_defensible_fabricates_nothing(self):
        out = admit_subjects(
            "Help me out here.", {"subjects": [], "scope_change":
                                  "unresolved"}, deterministic_targets=[])
        assert out["subjects"] == []
        assert out["clarification"] is True


class TestTextNamedProjectSurvives:
    def test_text_named_project_is_one_subject(self):
        out = admit_subjects("Update Site A Expansion's quote.",
                             _interp(["Site A Expansion"]))
        assert out["subjects"] == ["Site A Expansion"]
        assert out["clarification"] is False


class TestLaterTurnUpdatesScopeWithoutInheritance:
    """A changed subject supersedes; it does not silently carry the
    prior turn's unrelated items (that is the reader's scope rule —
    admission must not re-introduce them here)."""

    def test_new_subject_replaces_without_carryover(self):
        first = admit_subjects(
            "Compare the No. 381 roll bender with the U-22 bead roller.",
            _interp(["No. 381 roll bender", "U-22 bead roller"]))
        assert len(first["subjects"]) == 2
        # the next turn names only the roll bender: one subject
        second = admit_subjects(
            "Just the No. 381 roll bender now, drop the bead roller.",
            _interp(["No. 381 roll bender"]))
        assert second["subjects"] == ["No. 381 roll bender"]
        assert "U-22 bead roller" not in second["subjects"]


class TestProductionPathAdmission:
    """The regression the work order asks for: through the real seam,
    the captured request creates ONE product's entities and no
    obligations for the clause or the name fragments."""

    def _run(self, monkeypatch, interpretation):
        """Drive begin_retrieval_turn with the admitted subject set
        exactly as chat_orchestrator's ask lane does."""
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool
        from core.models_registration import Base
        from core.goals.goal_run_service import GoalRunService
        from core.goals.goal_service import GoalService
        from core import task_lifecycle as tlm

        engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False},
            poolclass=StaticPool)
        Base.metadata.create_all(engine)
        factory = sessionmaker(bind=engine, expire_on_commit=False)
        lifecycle = tlm.TaskLifecycle(
            GoalRunService(workspace_id="ws", tenant_id="t",
                           session_factory=factory),
            GoalService(workspace_id="ws", tenant_id="t",
                        session_factory=factory))

        admitted = admit_subjects(
            OWNER_REQUEST, interpretation,
            deterministic_targets=MINED_FOR_OWNER_REQUEST)
        begin_items = list(admitted["subjects"])
        run_id, op = tlm.begin_retrieval_turn(
            lifecycle, {"id": "conv-admit-1"}, "conv-admit-1",
            OWNER_REQUEST, "exec-admit-1", items=begin_items)
        record = lifecycle.get_task(run_id)
        engine.dispose()
        return lifecycle, run_id, admitted, record

    def test_captured_request_creates_one_products_entities(self,
                                                            monkeypatch):
        lifecycle, run_id, admitted, record = self._run(
            monkeypatch, _interp(["Roper Whitney No. 381 roll bender"]))
        entities = ((record.get("task_revision") or {}).get("entities") or
                    [])
        assert len(entities) == 1, [
            str(e.get("id"))[:60] for e in entities]
        assert str(entities[0]["id"]) == "Roper Whitney No. 381 roll bender"

    def test_no_obligations_for_fragments(self, monkeypatch):
        """The clause, the incomplete name and the bare brand never
        become entities — so they can never become read obligations."""
        lifecycle, run_id, admitted, record = self._run(
            monkeypatch, _interp(["Roper Whitney No. 381 roll bender"]))
        entity_ids = {
            str(e.get("id")) for e in
            ((record.get("task_revision") or {}).get("entities") or [])}
        for fragment in MINED_FOR_OWNER_REQUEST:
            assert fragment not in entity_ids, fragment

    def test_fallback_keeps_one_explicit_identifier(self, monkeypatch):
        """On interpretation failure the fallback admits exactly the
        code — not the fragments."""
        lifecycle, run_id, admitted, record = self._run(
            monkeypatch, {"subjects": [], "scope_change": "unresolved"})
        entities = ((record.get("task_revision") or {}).get("entities")
                    or [])
        assert [str(e["id"]) for e in entities] == ["381"], [
            str(e["id"])[:40] for e in entities]

    def test_unresolved_prose_creates_no_fragment_entities(
            self, monkeypatch):
        """Unresolved prose admits nothing at all: zero entities, so no
        per-fragment obligations exist to exhaust."""
        lifecycle, run_id, admitted, record = self._run(
            monkeypatch,
            {"subjects": [], "scope_change": "unresolved"})
        # deterministic targets here are still the fragments
        assert admitted["subjects"] == ["381"]
        entities = ((record.get("task_revision") or {}).get("entities")
                    or [])
        assert [str(e["id"]) for e in entities] == ["381"]
