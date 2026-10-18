"""L2 — the continuation ask's evidence requirement (S7 finding).

Preserved finding (composed job run 4,
``browser_composed_job_20261017_221606_5fdbf5.json``): the S7 continuation
ask

    "What is the current Valid until date on the draft, and does it still
     match the approved record?"

was answered correctly ("…2026-12-31, which still matches the approved
record…") but settled ``unconfirmed`` (``s7-reply-received`` exclusion):
the accepted decision recorded only a conversation action
(``references.sources: []``, ``provenance.signals: []``,
``task_state_view.active_objective: null``), so no evidence requirement was
captured and the turn's own VERIFIED retrieval of the named source
(``context_assembly`` carried ``approved_records_q2026_114.txt``) could not
certify. The S3 comparison turn — the same subject with a message-named
source ("my uploaded Approved Records document") — captured
``references.sources: ["document"]`` and validated (``partial``).

Repair (L2, 2026-10-18): the async interpretation is the semantic layer
that names the reference; the orchestrator CONSUMES its resolved source
references into the accepted decision
(``apply_interpretation_references``) — fail-closed against the
conversation's own verified evidence state (the execution-keyed
requirement/observation carriers the F-C2 chain maintains). No new
message-noun vocabulary; the structured chain (decision → F-C2 requirement
→ settlement) is preserved.

Layer map:

* decision layer — ``apply_interpretation_references``,
  ``session_evidence_sources`` and the interpretation-prompt enrichment
  (successor-only capability tests: the composer does not exist on the
  parent);
* real turn chain — ``_drive_continuation_turn`` drives the product entry
  point (``process_chat_message``) with controlled external seams: the
  interpretation record, the retrieval (memory-context assembler), and
  the planner/reply endpoints are scripted; the decision, the composition,
  the F-C2 requirement stash, settlement and the durable outcome run REAL.
  These tests are parent-compatible — on the parent (no composition) the
  same calls settle ``unconfirmed`` and the capture assertions fail for
  the intended reason.
"""

import asyncio
import json
import uuid
from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Shared product-boundary harness (fixtures + helpers): the scratch world,
# the authorized workspace, the scripted local provider route.
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


def _seed_conversation_evidence(session, workspace_id):
    """The conversation's prior verified evidence (the S3 turn's carriers,
    reconstructed from the preserved run-4 records): the comparison ask
    captured ``sources: ["document"]`` and its context assembly observed
    ``approved_records_q2026_114.txt``."""
    session[PRIOR_REQ_KEY] = {
        "required": True,
        "sources": ["document"],
        "file": None,
        "fields": ["expiration_date"],
        "subjects": [],
        "identity": {"state": "kind_only", "candidates": []},
        "artifact_attached": True,
    }
    session[PRIOR_OBS_KEY] = [{
        "observation_id": "l2-prior-obs",
        "source": "ingested",
        "file_name": PRIOR_FILE,
        "title": PRIOR_FILE,
        "workspace_id": workspace_id,
        "content_hash": "",
    }]


def _seed_catalog_document(scoped_world, ws):
    """The uploaded document as catalog identity (world state — the same
    IngestedDocument row the product upload route writes; no receipt)."""
    from datetime import datetime, timezone

    from core.models import IngestedDocument

    db = scoped_world["Session"]()
    try:
        db.add(IngestedDocument(
            id="doc_l2_prior",
            workspace_id=ws["workspace_id"],
            tenant_id=ws["tenant_id"],
            external_id="upload_doc_l2_prior",
            integration_id="manual_upload",
            file_name=PRIOR_FILE,
            file_path=f"upload:{PRIOR_FILE}",
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


def _drive_continuation_turn(
        scoped_world, world_app, *, interpretation,
        session_id="sess-l2", reply_text=S7_REPLY,
        message=S7_ASK, session_out=None, seed_evidence=True):
    """One real product turn for the continuation ask.

    Controlled external seams: the interpretation record, the
    memory-context assembler (retrieval), the planner structured call and
    the reply endpoint. Decision, composition, requirement stash,
    settlement and the durable outcome run for real."""
    import integrations.chat_orchestrator as co
    from core.llm_service import LLMService

    ep = _ScriptedReplyEndpoint(reply_text)
    ep.__enter__()
    try:
        ws = _authorized_workspace(world_app, scoped_world)
        _seed_catalog_document(scoped_world, ws)
        _register_local_route(world_app, ws, ep.base_url)
        orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
        orch.tenant_id = "default"
        orch._cancelled_sessions = set()
        orch._budget_exceeded_runs = set()
        orch.llm_service = LLMService(tenant_id="default")
        session = {"id": session_id, "history": []}
        if seed_evidence:
            _seed_conversation_evidence(session, ws["workspace_id"])
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
                    "file_name": PRIOR_FILE,
                    "title": PRIOR_FILE,
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
            return ("MEMORY CONTEXT: the approved record "
                    f"({PRIOR_FILE}) — Approved valid until: 2026-12-31")

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


class TestL2DecisionComposition:
    """The composer + prompt enrichment (successor-only capability tests)."""

    def _session(self):
        return {
            PRIOR_REQ_KEY: {
                "required": True, "sources": ["document"],
                "identity": {"state": "kind_only"},
            },
            PRIOR_OBS_KEY: [{
                "source": "ingested", "file_name": PRIOR_FILE,
                "workspace_id": "ws-1",
            }],
        }

    def test_name_reference_resolves_to_the_conversation_source(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
            turn_evidence_required,
        )

        decision = build_turn_decision(S7_ASK, self._session(), [])
        assert decision["references"]["sources"] == []
        assert turn_evidence_required(decision) is False
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(), self._session())
        assert composed["references"]["sources"] == ["document"]
        assert composed["references"]["file"] == {"file_name": PRIOR_FILE}
        marker = composed["references"]["continuation_evidence"]
        assert marker["origin"] == "interpretation"
        assert marker["resolved_file"] == PRIOR_FILE
        assert turn_evidence_required(composed) is True

    def test_kind_word_reference_resolves_via_the_program_vocabulary(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        decision = build_turn_decision(S7_ASK, self._session(), [])
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(["document"]),
            self._session())
        assert composed["references"]["sources"] == ["document"]

    def test_unresolved_interpretation_changes_nothing(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        decision = build_turn_decision(S7_ASK, self._session(), [])
        degraded = dict(_resolved_interpretation())
        degraded["origin"] = "unresolved"
        degraded["scope_change"] = "unresolved"
        composed = apply_interpretation_references(
            decision, degraded, self._session())
        assert composed["references"] == decision["references"]

    def test_unresolvable_reference_never_invents_an_obligation(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        decision = build_turn_decision(S7_ASK, self._session(), [])
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(["the zeta widget ledger"]),
            self._session())
        assert composed["references"] == decision["references"]

    def test_floor_captured_references_always_win(self):
        from core.turn_decision import (
            apply_interpretation_references, build_turn_decision,
        )

        named = ("Search my documents for the valid until date and does it "
                 "still match the approved record?")
        decision = build_turn_decision(named, self._session(), [])
        assert decision["references"]["sources"] == ["documents"]
        composed = apply_interpretation_references(
            decision, _resolved_interpretation(["email"]), self._session())
        assert composed["references"] == decision["references"]

    def test_session_evidence_sources_collects_kinds_and_identities(self):
        from core.turn_decision import session_evidence_sources

        sources = session_evidence_sources(self._session())
        assert {"kind": "document", "file_name": PRIOR_FILE,
                "execution_id": "l2prior0001"} in sources

    def test_interpretation_prompt_carries_prior_evidence_sources(self):
        from core.turn_decision import _interpretation_prompt

        prompt = _interpretation_prompt(S7_ASK, [], self._session(), {})
        assert "PRIOR EVIDENCE SOURCES (this conversation)" in prompt
        assert PRIOR_FILE in prompt


class TestL2ContinuationChain:
    """The real turn chain (parent-compatible; parent fails the capture)."""

    def test_continuation_ask_captures_the_evidence_requirement(
            self, scoped_world, world_app, monkeypatch):
        # pilot parity: the turn's operation record exists, so
        # the outcome resolution runs (not discarded as a
        # no-work conversational turn).
        monkeypatch.setenv("CHAT_FINALIZATION_M1", "1")
        session_out = {}
        out, session, ep = _drive_continuation_turn(
            scoped_world, world_app,
            interpretation=_resolved_interpretation(),
            session_out=session_out)

        eid = str(out.get("execution_id") or "")
        assert eid, "the turn must bind an execution id"
        req = session.get(f"_evidence_requirement_{eid}") or {}
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
            f"continuation ask (parent: requirement not captured -> no "
            f"verdict); got {verdict!r}")
        assert settled.get("state") == "completed", (
            f"certified settlement, not unconfirmed; got {settled!r}")
        assert settled.get("delivered") is True

        # Durable agreement: the persisted execution row for THIS turn
        # exists and carries the turn's objective.
        outcome = _turn_outcome(scoped_world)
        assert outcome.get("execution_id") == eid

    def test_unresolved_interpretation_keeps_the_turn_unobligated(
            self, scoped_world, world_app, monkeypatch):
        monkeypatch.setenv("CHAT_FINALIZATION_M1", "1")
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

    def test_unresolvable_reference_does_not_obligate_the_turn(
            self, scoped_world, world_app, monkeypatch):
        # pilot parity: the turn's operation record exists, so
        # the outcome resolution runs (not discarded as a
        # no-work conversational turn).
        monkeypatch.setenv("CHAT_FINALIZATION_M1", "1")
        session_out = {}
        out, session, ep = _drive_continuation_turn(
            scoped_world, world_app,
            interpretation=_resolved_interpretation(
                ["the zeta widget ledger"]),
            session_out=session_out)
        eid, req = _turn_requirement(session, out)
        assert req.get("required") is not True
        verdict, settled = _settlement_from_turn(
            session, eid, session_out["workspace_id"])
        assert verdict is None
        assert settled.get("state") == "unconfirmed"

    def test_message_named_source_ask_keeps_its_capture(
            self, scoped_world, world_app, monkeypatch):
        # pilot parity: the turn's operation record exists, so
        # the outcome resolution runs (not discarded as a
        # no-work conversational turn).
        monkeypatch.setenv("CHAT_FINALIZATION_M1", "1")
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
