"""L2 — the continuation ask's evidence requirement (S7 finding).

Preserved finding (composed job run 4,
``browser_composed_job_20261017_221606_5fdbf5.json``): the S7 continuation
ask

    "What is the current Valid until date on the draft, and does it still
     match the approved record?"

was answered correctly but settled ``unconfirmed`` (``s7-reply-received``
exclusion): the accepted decision carried only a conversation action
(``references.sources: []``, ``provenance.signals: []``,
``task_state_view.active_objective: null``), so no evidence requirement was
captured and the turn's own VERIFIED retrieval of the named source
(``context_assembly`` carried ``approved_records_q2026_114.txt``) could not
certify. The S3 comparison turn — the same subject with a message-named
source — captured ``references.sources: ["document"]`` and validated.

Repair (L2, 2026-10-18): the async interpretation's resolved source
reference is composed into the accepted decision
(``apply_interpretation_references``) — fail-closed against the
conversation's OBSERVED evidence. Corrected after owner review: the
reference authority must not be permissive.

Reference-resolution contract (owner review, 2026-10-18):

* **Requested sources nominate; observed sources are evidence.**
  ``session_requested_sources`` (requirement carriers) never resolve a
  reference; only ``session_observed_sources`` (supplied retrieval
  observations) do.
* **No substring donation.** Token-boundary matching with plural
  tolerance only: "approved" never matches "unapproved"; "record" matches
  "records".
* **All eligible matches are collected before deciding.** Zero -> the
  unresolved reference is preserved (name proposals inside an observed
  evidence context); one -> the identity is adopted; several -> the
  AMBIGUITY is preserved (never insertion-order selection).
* **Generic kinds cannot prove an antecedent.** A kind proposal resolves
  to the observed sources of its family (one -> adopt, several ->
  ambiguity, none -> no obligation).
* **Several proposed files never collapse into the first filename** — the
  candidate set is unioned; several distinct candidates mean ambiguity.

Layer map:

* decision layer — the composer, the split collectors, and the
  interpretation-prompt enrichment (successor-only capability tests);
* real turn chain — ``_drive_continuation_turn`` drives the product entry
  point (``process_chat_message``) with controlled external seams (the
  interpretation record, the retrieval assembler, the planner/reply
  endpoints); decision, composition, requirement stash, settlement and
  the durable row run REAL. Parent-compatible: on the parent (no
  composition) the capture test fails for the intended reason.
"""

import asyncio
import json
import uuid
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Shared product-boundary harness (fixtures + helpers).
from tests.test_source_ask_tool_execution import (
    _ScriptedReplyEndpoint,
    _authorized_workspace,
    _register_local_route,
    scoped_world,  # noqa: F401 — pytest fixture
    world_app,  # noqa: F401 — pytest fixture
)

S7_ASK = ("What is the current Valid until date on the draft, and does it "
          "still match the approved record?")
PRIOR_FILE = "approved_records_q2026_114.txt"
PRIOR_REQ_KEY = "_evidence_requirement_l2prior0001"
PRIOR_OBS_KEY = "_retrieval_source_observations_l2prior0001"
S7_REPLY = ("The draft’s Valid until date is 2026-12-31, which still "
            "matches the approved record’s Approved valid until: "
            "2026-12-31.")


def _resolved_interpretation(sources=None, scope_change="continue"):
    """The semantic layer's record for the S7 ask (the controlled seam)."""
    return {
        "schema": "turn-interpretation-1",
        "request_id": "",
        "origin": "llm:test-model",
        "unresolved_reason": "",
        "message": S7_ASK,
        "actions": [{"kind": "research", "subjects": [],
                     "note": "", "authorization": "granted"}],
        "subjects": [],
        "sources": list(sources if sources is not None
                        else ["the approved record"]),
        "requested_fields": ["valid until date"],
        "output_format": "",
        "constraints": [],
        "scope_change": scope_change,
        "confidence": 0.9,
        "deterministic_decision": None,
    }


def _observed(*names):
    return [{
        "observation_id": f"l2-prior-{i}",
        "source": "ingested",
        "file_name": name,
        "title": name,
        "workspace_id": "ws-1",
        "content_hash": "",
    } for i, name in enumerate(names)]


def _session_with(observed_files=None, requested=None):
    """A conversation state: observed retrieval observations (+ optional
    requirement nominations)."""
    session = {}
    if observed_files:
        session[PRIOR_OBS_KEY] = _observed(*observed_files)
    if requested:
        session[PRIOR_REQ_KEY] = requested
    return session


def _seed_conversation_evidence(session, workspace_id, observed_files=None):
    """The conversation's prior verified evidence (the S3 turn's carriers,
    reconstructed from the preserved run-4 records)."""
    files = list(observed_files or [PRIOR_FILE])
    session[PRIOR_REQ_KEY] = {
        "required": True,
        "sources": ["document"],
        "file": None,
        "fields": ["expiration_date"],
        "subjects": [],
        "identity": {"state": "kind_only", "candidates": []},
        "artifact_attached": True,
    }
    session[PRIOR_OBS_KEY] = [
        {"observation_id": f"l2-prior-{i}",
         "source": "ingested",
         "file_name": name,
         "title": name,
         "workspace_id": workspace_id,
         "content_hash": ""}
        for i, name in enumerate(files)]


def _seed_catalog_document(scoped_world, ws, file_name=PRIOR_FILE):
    """The uploaded document as catalog identity (world state — the same
    IngestedDocument row the product upload route writes; no receipt)."""
    from datetime import datetime, timezone

    from core.models import IngestedDocument

    db = scoped_world["Session"]()
    try:
        db.add(IngestedDocument(
            id=f"doc_l2_{uuid.uuid4().hex[:8]}",
            workspace_id=ws["workspace_id"],
            tenant_id=ws["tenant_id"],
            external_id=f"upload_l2_{uuid.uuid4().hex[:8]}",
            integration_id="manual_upload",
            file_name=file_name,
            file_path=f"upload:{file_name}",
            file_type="txt",
            file_size_bytes=111,
            content_preview=("ATOM PHASE D FIXTURE — internal notes.\n"
                             "Approved valid until: 2026-12-31\n"),
            ingested_at=datetime.now(timezone.utc),
            freshness_status="fresh",
        ))
        db.commit()
    finally:
        db.close()


def _turn_outcome(scoped_world) -> dict:
    """The latest execution row's full task_outcome (fresh ORM read)."""
    db = scoped_world["Session"]()
    try:
        from core.models import AgentExecution

        row = (db.query(AgentExecution)
               .order_by(AgentExecution.started_at.desc(),
                         AgentExecution.id.desc())
               .first())
        if row is None:
            return {}
        meta = row.metadata_json if isinstance(row.metadata_json, dict) else {}
        return meta.get("task_outcome") or {}
    finally:
        db.close()


def _settlement_from_turn(session, execution_id, workspace_id):
    """The settlement decision over the turn's OWN session state.

    ``_context_backed_fulfillment`` is the resolver's single certification
    predicate (consumed by ``_fallback_turn_outcome`` and the durable
    builder); calling it with the real session carriers asserts the
    certification the served turn would resolve. The scratch harness has
    no task run, so the response envelope's work-turn gate would discard
    the outcome before it is attached — this reads the same decision one
    layer earlier, on the state the turn actually produced."""
    from integrations.chat_orchestrator import (
        _context_backed_fulfillment, _fallback_turn_outcome,
    )

    verdict = _context_backed_fulfillment(session, execution_id,
                                          workspace_id)
    settled = _fallback_turn_outcome(
        session, execution_id, {}, {}, workspace_id=workspace_id)
    return verdict, settled


def _turn_requirement(session, out):
    eid = str(out.get("execution_id") or "")
    return eid, (session.get(f"_evidence_requirement_{eid}") or {})


def _drive_continuation_turn(
        scoped_world, world_app, *, interpretation,
        session_id="sess-l2", reply_text=S7_REPLY,
        message=S7_ASK, session_out=None, seed_evidence=True,
        observed_files=None):
    """One real product turn for the continuation ask.

    Controlled external seams: the interpretation record, the
    memory-context assembler (retrieval), the planner structured call and
    the reply endpoint. Decision, composition, requirement stash,
    settlement and the durable row run for real."""
    import integrations.chat_orchestrator as co
    from core.llm_service import LLMService

    files = list(observed_files or [PRIOR_FILE])
    ep = _ScriptedReplyEndpoint(reply_text)
    ep.__enter__()
    try:
        ws = _authorized_workspace(world_app, scoped_world)
        for name in files:
            _seed_catalog_document(scoped_world, ws, file_name=name)
        _register_local_route(world_app, ws, ep.base_url)
        orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
        orch.tenant_id = "default"
        orch._cancelled_sessions = set()
        orch._budget_exceeded_runs = set()
        orch.llm_service = LLMService(tenant_id="default")
        session = {"id": session_id, "history": []}
        if seed_evidence:
            _seed_conversation_evidence(session, ws["workspace_id"],
                                        observed_files=files)
        if session_out is not None:
            session_out["session"] = session
            session_out["workspace_id"] = ws["workspace_id"]

        async def _fake_interpret(message_, session_=None, history=None,
                                  context=None, **kw):
            return dict(interpretation)

        async def _fake_assemble(**kwargs):
            out = kwargs.get("source_observations_out")
            if isinstance(out, list):
                out.append({
                    "observation_id": "l2-turn-obs",
                    "source": "ingested",
                    "file_name": files[0],
                    "title": files[0],
                    "workspace_id": ws["workspace_id"],
                    "content_hash": "",
                    "excerpt": "Approved valid until: 2026-12-31",
                    "field_associations": {
                        "expiration_date": {
                            "value": "2026-12-31",
                            "subject": "",
                            "span": "Approved valid until: 2026-12-31",
                        },
                    },
                })
            return ("MEMORY CONTEXT: the record "
                    f"({files[0]}) — Approved valid until: 2026-12-31")

        async def _plan_ce(*a, **k):
            class _P:
                wants_edit = False
            return _P()

        async def _structured(llm_service, *, prompt, response_model,
                              system_instruction, **_kw):
            from core.chat_tool_planner import ToolPlan

            return ToolPlan(use_tool=False, service=None, intent="search",
                            query="", reason="conversation turn")

        with ExitStack() as st:
            for cm in [
                patch.object(orch, "_get_or_create_session",
                             return_value=session),
                patch.object(orch, "_resolve_canvas_ctx",
                             new=AsyncMock(return_value=None)),
                patch.object(orch, "_record_chat_step", new=AsyncMock()),
                patch.object(orch, "_emit_agent_status", new=AsyncMock()),
                patch.object(orch, "_update_session", new=MagicMock()),
                patch.object(orch, "_load_conversation_mail_handles",
                             return_value=([], [])),
                patch.object(orch, "_route_to_features",
                             new=AsyncMock(return_value={})),
                patch("core.memory_context_assembler.assembly_enabled",
                      return_value=True),
                patch("core.memory_context_assembler."
                      "assemble_memory_context", new=_fake_assemble),
                patch("core.turn_decision.interpret_turn_request",
                      new=_fake_interpret),
                patch("core.chat_mini_app_authoring.try_handle",
                      new=AsyncMock(return_value=None)),
                patch("core.chat_tool_planner._provenance_menu",
                      new=AsyncMock(return_value="")),
                patch("integrations.chat_orchestrator."
                      "_verbatim_mail_evidence",
                      new=AsyncMock(return_value=[])),
                patch("integrations.chat_orchestrator._begin_task_edit",
                      return_value={"status": "legacy"}),
                patch("core.chat_canvas_editor.plan_canvas_edit",
                      new=AsyncMock(side_effect=_plan_ce)),
                patch("core.student_learning_service.get_agent_lessons",
                      return_value=[]),
                patch("core.chat_tool_planner._structured_with_fallback",
                      new=AsyncMock(side_effect=_structured)),
            ]:
                st.enter_context(cm)
            out = asyncio.run(orch.process_chat_message(
                ws["user_id"], message, session_id,
                context={"workspace_id": ws["workspace_id"]}))
        return out, session, ep
    finally:
        ep.__exit__()


class TestL2ReferenceResolution:
    """The composer's reference contract (owner-review corrections).

    Successor-only capability tests (the composer does not exist on the
    parent)."""

    def test_unique_name_reference_resolves_to_the_conversation_source(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
            turn_evidence_required,
        )

        session = _session_with(observed_files=[PRIOR_FILE])
        decision = build_turn_decision(S7_ASK, session, [])
        assert decision["references"]["sources"] == []
        assert turn_evidence_required(decision) is False
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(), session)
        assert composed["references"]["sources"] == ["document"]
        assert composed["references"]["file"] == {"file_name": PRIOR_FILE}
        marker = composed["references"]["continuation_evidence"]
        assert marker["state"] == "resolved"
        assert marker["resolved_file"] == PRIOR_FILE
        assert turn_evidence_required(composed) is True

    def test_two_candidates_preserve_ambiguity(self):
        """Owner regression: Alpha and Beta approved-record files must
        never be silently reduced to one."""
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        session = _session_with(observed_files=[
            "alpha_approved_records.txt", "beta_approved_records.txt"])
        decision = build_turn_decision(S7_ASK, session, [])
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(), session)
        refs = composed["references"]
        marker = refs["continuation_evidence"]
        assert marker["state"] == "ambiguous"
        assert refs.get("file") is None, (
            "no candidate may be silently selected; got "
            f"{refs.get('file')!r}")
        names = sorted(c["file_name"] for c in marker["candidates"])
        assert names == ["alpha_approved_records.txt",
                         "beta_approved_records.txt"]
        assert refs["sources"] == ["document"]

    def test_wrong_name_does_not_resolve_by_substring(self):
        """Owner regression: 'the approved record' must never resolve to
        `unapproved_records.txt` (no substring donation)."""
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        session = _session_with(observed_files=["unapproved_records.txt"])
        decision = build_turn_decision(S7_ASK, session, [])
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(), session)
        refs = composed["references"]
        marker = refs["continuation_evidence"]
        assert marker["state"] == "unresolved"
        assert refs.get("file") is None
        assert marker["names"] == ["the approved record"]
        assert "unapproved_records.txt" not in json.dumps(refs)

    def test_generic_kind_without_observed_evidence_is_not_adopted(self):
        """Owner regression: `document` describes a proposed lookup; with
        no observed evidence it cannot nominate an antecedent."""
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        session = _session_with()
        decision = build_turn_decision(S7_ASK, session, [])
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(["document"]), session)
        assert composed["references"] == decision["references"], (
            "no observed evidence context -> the decision is unchanged")

    def test_kind_with_one_observed_source_adopts_that_identity(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        session = _session_with(observed_files=[PRIOR_FILE])
        decision = build_turn_decision(S7_ASK, session, [])
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(["document"]), session)
        assert composed["references"]["file"] == {"file_name": PRIOR_FILE}
        assert (composed["references"]["continuation_evidence"]["state"]
                == "resolved")

    def test_requirement_named_file_without_observation_is_not_evidence(self):
        """Owner regression: a requirement carrier nominates; it is never
        prior evidence."""
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
            session_observed_sources,
        )

        session = _session_with(requested={
            "required": True, "sources": ["document"],
            "identity": {"state": "unresolved",
                         "names": [PRIOR_FILE],
                         "file_name": PRIOR_FILE},
        })
        assert session_observed_sources(session) == [], (
            "requirement carriers must not appear in the observed pool")
        decision = build_turn_decision(S7_ASK, session, [])
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(), session)
        assert composed["references"] == decision["references"]

    def test_unresolved_interpretation_changes_nothing(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        session = _session_with(observed_files=[PRIOR_FILE])
        decision = build_turn_decision(S7_ASK, session, [])
        degraded = dict(_resolved_interpretation())
        degraded["origin"] = "unresolved"
        degraded["scope_change"] = "unresolved"
        composed = apply_interpretation_references(
            decision, degraded, session)
        assert composed["references"] == decision["references"]

    def test_no_observed_context_leaves_the_decision_unchanged(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        session = _session_with()
        decision = build_turn_decision(S7_ASK, session, [])
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(), session)
        assert composed["references"] == decision["references"]

    def test_floor_captured_references_always_win(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        named = ("Search my documents for the valid until date and does it "
                 "still match the approved record?")
        session = _session_with(observed_files=[PRIOR_FILE])
        decision = build_turn_decision(named, session, [])
        assert decision["references"]["sources"] == ["documents"]
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(["email"]), session)
        assert composed["references"] == decision["references"]

    def test_collectors_split_requested_from_observed(self):
        from core.turn_decision import (
            session_evidence_sources, session_observed_sources,
            session_requested_sources,
        )

        session = _session_with(
            observed_files=[PRIOR_FILE],
            requested={"required": True, "sources": ["document"],
                       "identity": {"state": "resolved",
                                    "file_name": "nominated_other.txt"}})
        observed = session_observed_sources(session)
        requested = session_requested_sources(session)
        assert [e["file_name"] for e in observed] == [PRIOR_FILE]
        assert all(e["observed"] is True for e in
                   session_evidence_sources(session)
                   if e["file_name"] == PRIOR_FILE)
        assert any(e["file_name"] == "nominated_other.txt"
                   for e in requested)
        assert any(e["observed"] is False for e in
                   session_evidence_sources(session)
                   if e["file_name"] == "nominated_other.txt")

    def test_interpretation_prompt_carries_prior_evidence_sources(self):
        from core.turn_decision import _interpretation_prompt

        session = _session_with(
            observed_files=[PRIOR_FILE],
            requested={"required": True, "sources": ["document"],
                       "identity": {"state": "resolved",
                                    "file_name": "nominated_other.txt"}})
        prompt = _interpretation_prompt(S7_ASK, [], session, {})
        assert "PRIOR EVIDENCE SOURCES (this conversation)" in prompt
        assert PRIOR_FILE in prompt
        assert "requested: document: nominated_other.txt" in prompt

    def test_stash_carries_ambiguous_and_unresolved_identities(self):
        """The requirement builder carries the composer's ambiguity /
        unresolved states into the requirement identity verbatim."""
        from integrations.chat_orchestrator import (
            _stash_evidence_requirement,
        )

        for state, expected in (
            ("ambiguous", "ambiguous"), ("unresolved", "unresolved")):
            marker = {"origin": "interpretation", "state": state,
                      "proposed": ["the approved record"],
                      "resolved_kinds": ["document"],
                      "resolved_file": "",
                      "candidates": [{"file_name": "a.txt"},
                                     {"file_name": "b.txt"}],
                      "names": ["the approved record"]}
            decision = {"references": {"sources": ["document"], "file": None,
                                       "continuation_evidence": marker}}
            session = {}
            req = _stash_evidence_requirement(
                session, f"exec-{state}", decision, S7_ASK, True)
            assert req["identity"]["state"] == expected, req["identity"]
            if state == "ambiguous":
                assert len(req["identity"]["candidates"]) == 2
            else:
                assert req["identity"]["names"] == ["the approved record"]


class TestL2ContinuationChain:
    """The real turn chain (parent-compatible; parent fails the capture)."""

    def test_continuation_ask_captures_the_evidence_requirement(
            self, scoped_world, world_app):
        session_out = {}
        out, session, ep = _drive_continuation_turn(
            scoped_world, world_app,
            interpretation=_resolved_interpretation(),
            session_out=session_out)

        eid, req = _turn_requirement(session, out)
        assert eid, "the turn must bind an execution id"
        assert req.get("required") is True, (
            "the continuation ask must carry the evidence obligation "
            f"(parent: no composition -> required False); got {req!r}")
        assert "document" in (req.get("sources") or [])
        identity = req.get("identity") or {}
        assert identity.get("file_name") == PRIOR_FILE, (
            f"the resolved antecedent identity must ride the requirement; "
            f"got {identity!r}")

        verdict, settled = _settlement_from_turn(
            session, eid, session_out["workspace_id"])
        assert verdict and verdict.get("state") in (
            "completed", "partial", "unsupplied"), (
            "the turn's own verified retrieval must certify the "
            f"continuation ask; got {verdict!r}")
        assert settled.get("state") == "completed"
        assert settled.get("delivered") is True

        outcome = _turn_outcome(scoped_world)
        assert outcome.get("execution_id") == eid

    def test_ambiguous_reference_never_selects_a_source(
            self, scoped_world, world_app, monkeypatch):
        """Owner regression through the real turn: two matching sources ->
        the requirement carries the ambiguity and the settlement asks
        which one — no file is silently adopted."""
        session_out = {}
        out, session, ep = _drive_continuation_turn(
            scoped_world, world_app,
            interpretation=_resolved_interpretation(),
            observed_files=["alpha_approved_records.txt",
                            "beta_approved_records.txt"],
            session_out=session_out)
        eid, req = _turn_requirement(session, out)
        identity = req.get("identity") or {}
        assert req.get("required") is True
        assert identity.get("state") == "ambiguous", (
            f"ambiguity must be preserved; got {identity!r}")
        names = sorted(str(c.get("file_name") or "")
                       for c in (identity.get("candidates") or []))
        assert names == ["alpha_approved_records.txt",
                         "beta_approved_records.txt"]
        verdict, settled = _settlement_from_turn(
            session, eid, session_out["workspace_id"])
        assert verdict and verdict.get("state") == "ambiguous"
        assert settled.get("state") == "partial", (
            "a validated delivery whose open work is the source "
            f"clarification; got {settled!r}")
        assert settled.get("delivered") is True
        assert any("which source" in str(w)
                   for w in (settled.get("open_work") or []))

    def test_wrong_name_never_resolves_to_the_unapproved_file(
            self, scoped_world, world_app, monkeypatch):
        """Owner regression through the real turn: only an unapproved file
        is observed -> the reference stays unresolved; the wrong file is
        never adopted and the settlement reports the honest non-match."""
        session_out = {}
        out, session, ep = _drive_continuation_turn(
            scoped_world, world_app,
            interpretation=_resolved_interpretation(),
            observed_files=["unapproved_records.txt"],
            session_out=session_out)
        eid, req = _turn_requirement(session, out)
        identity = req.get("identity") or {}
        assert req.get("required") is True
        assert identity.get("state") == "unresolved", (
            f"the wrong name must stay unresolved; got {identity!r}")
        assert "unapproved_records.txt" not in json.dumps(identity)
        verdict, settled = _settlement_from_turn(
            session, eid, session_out["workspace_id"])
        assert verdict and verdict.get("state") == "unresolved"
        assert settled.get("state") == "partial", (
            "a validated delivery whose open work is the honest "
            f"non-match; got {settled!r}")
        assert settled.get("delivered") is True
        assert any("no ingested document matches" in str(w)
                   for w in (settled.get("open_work") or []))

    def test_unresolved_interpretation_keeps_the_turn_unobligated(
            self, scoped_world, world_app, monkeypatch):
        degraded = dict(_resolved_interpretation())
        degraded["origin"] = "unresolved"
        degraded["scope_change"] = "unresolved"
        session_out = {}
        out, session, ep = _drive_continuation_turn(
            scoped_world, world_app, interpretation=degraded,
            session_out=session_out)
        eid, req = _turn_requirement(session, out)
        assert req.get("required") is not True, (
            "a degraded interpretation never invents an obligation")
        verdict, settled = _settlement_from_turn(
            session, eid, session_out["workspace_id"])
        assert verdict is None
        assert settled.get("state") == "unconfirmed"

    def test_message_named_source_ask_keeps_its_capture(
            self, scoped_world, world_app, monkeypatch):
        named = ("Search my documents for the valid until date and does it "
                 "still match the approved record?")
        session_out = {}
        out, session, ep = _drive_continuation_turn(
            scoped_world, world_app,
            interpretation=_resolved_interpretation(["email"]),
            message=named, session_out=session_out)
        eid, req = _turn_requirement(session, out)
        assert req.get("required") is True
        assert req.get("sources") == ["documents"], (
            "the floor's own capture (the decision's raw nouns) is not "
            f"overridden by the interpretation; got {req.get('sources')!r}")
        verdict, settled = _settlement_from_turn(
            session, eid, session_out["workspace_id"])
        assert verdict is not None
        assert settled.get("state") == "completed"
