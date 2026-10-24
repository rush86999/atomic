"""ROUND-10 RUNTIME WORK ORDER — the unsupported search claim (J2).

The preserved fresh-user request (pristine campaign
``j2_model_setup_20261012_145647_cand3f79345be``, counted turn 2):

    "Search my documents for anything about quarterly revenue and tell
    me what you find."

was answered, in a world with NO integrations and NO documents, by a
reply asserting Zoho CRM / Google Drive searches with figures — while
the persisted turn carried ``tool_outcomes: []``, a converse-only action
program and zero executed lookups (latency 310.93 s; the platform's own
figure heuristic flagged ``unsupported_figures``).

This regression drives the REAL chat turn (the orchestrator path the
public ``POST /api/chat/message`` serves) on a scratch world with a
fresh registered user, and controls ONLY the external LLM responses:
the planner's structured proposal is pinned to the DECLINE the live run
produced, and the reply endpoint returns the fabricated narration the
live run shipped. Interpretation, plan validation, dispatch, receipts,
settlement and narration gating all run for real.

Fails on the observed behavior:
  1. no attributable tool execution exists for the requested source
     (the durable ``agent_executions.task_outcome.tool_outcomes`` stays
     empty — the declined proposal stood uncorrected);
  2. the reply narrates searches that no receipt supports (Zoho CRM /
     Google Drive — sources nothing queried) and ships counts/figures
     from nowhere.
"""
import asyncio
import json
import threading
import uuid
from contextlib import ExitStack, contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

MODEL_NAME = "shared-model"

#: The preserved pristine-J2 request, verbatim.
SOURCE_ASK = ("Search my documents for anything about quarterly "
              "revenue and tell me what you find.")

#: The fabricated narration shape the pristine run shipped (claims about
#: sources the world does not even have connected, plus counts/figures).
FABRICATED_REPLY = (
    "I've searched your Zoho CRM integration and your Google Drive for "
    "quarterly revenue. I found 5 records totaling $1,250,000 in "
    "annual recurring revenue.")

#: Sources the turn could NOT have executed (nothing is connected in a
#: fresh world) — a reply must never present these as searched.
UNCONNECTED_SOURCE_CLAIMS = ("zoho crm", "google drive")


class _ScriptedReplyEndpoint:
    """Controlled OpenAI-compatible endpoint. Every completion returns
    the scripted assistant text — the external response under test
    control. Counts attributed calls."""

    def __init__(self, reply_text: str, model: str = MODEL_NAME,
                 reply_fn=None):
        self.reply_text = reply_text
        self.reply_fn = reply_fn
        self.model = model
        self.calls = []
        self._lock = threading.Lock()
        outer = self

        class _Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):  # silence per-request stderr
                pass

            def do_GET(self):
                if self.path.rstrip("/").endswith("/models"):
                    body = json.dumps({
                        "object": "list",
                        "data": [{"id": outer.model,
                                  "object": "model",
                                  "owned_by": "scripted"}],
                    }).encode()
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                else:
                    self.send_response(404)
                    self.end_headers()

            def do_POST(self):
                length = int(self.headers.get("Content-Length") or 0)
                payload = {}
                if length:
                    try:
                        payload = json.loads(
                            self.rfile.read(length).decode() or "{}")
                    except Exception:  # noqa: BLE001 — record shape only
                        payload = {}
                with outer._lock:
                    outer.calls.append({
                        "path": self.path,
                        "model": payload.get("model"),
                        "n_messages": len(payload.get("messages") or []),
                        # Evidence assertions need the delivered context,
                        # not just the count (distractor-source test).
                        "messages": payload.get("messages") or [],
                    })
                content = outer.reply_text
                if outer.reply_fn is not None:
                    try:
                        content = outer.reply_fn(
                            payload.get("messages") or []) or content
                    except Exception:  # noqa: BLE001 — test scripted reply
                        content = outer.reply_text
                body = json.dumps({
                    "id": "chatcmpl-scripted",
                    "object": "chat.completion",
                    "model": payload.get("model") or outer.model,
                    "choices": [{
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {"role": "assistant",
                                    "content": content},
                    }],
                    "usage": {"prompt_tokens": 5, "completion_tokens": 2,
                              "total_tokens": 7},
                }).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

        self._server = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        self.port = self._server.server_address[1]
        self.base_url = f"http://localhost:{self.port}/v1"
        self._thread = threading.Thread(
            target=self._server.serve_forever, daemon=True)

    def __enter__(self):
        self._thread.start()
        return self

    def __exit__(self, *exc):
        self._server.shutdown()
        self._server.server_close()
        return False

    @property
    def hit_count(self) -> int:
        with self._lock:
            return len(self.calls)


@pytest.fixture()
def scoped_world(monkeypatch, tmp_path):
    """Scratch DB + scratch credentials + scratch LanceDB. The ONLY
    configured providers are the ones the test registers; the knowledge
    store the documents lane searches is the test's own empty store."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    import core.database as db_module
    import core.byok_endpoints as be

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestSession = sessionmaker(bind=engine, expire_on_commit=False)

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    original = (db_module.engine, db_module.SessionLocal, db_module.get_db)
    db_module.engine = engine
    db_module.SessionLocal = TestSession
    # NOTE: core.database.get_db is NEVER rebound — the function reads the
    # SessionLocal global at call time, so it follows the swap without the
    # module-attribute mutation. Rebinding it made later
    # ``from core.database import get_db`` imports resolve the OVERRIDE
    # function as the FastAPI dependency key while routes hold the
    # original object — the second fixture cycle in a process served a
    # dead engine (reproduced: cycle B register hit "no such table:
    # users" on cycle A's disposed in-memory store).

    # LIVE-DB ACCESS IMPOSSIBLE BY CONSTRUCTION (verifier reporting
    # correction): every session path the turn can take resolves through
    # the module globals this fixture swapped — the ORIGINAL get_db and
    # get_db_session functions both construct from SessionLocal at call
    # time, which now binds the scratch factory. Nothing is rebound by
    # identity (that broke cross-cycle isolation); the canary proves the
    # construction instead, and the URL guard runs inside the turn's
    # lifetime via the fixture's own scope.
    def _guard_live_db():
        url = str(getattr(db_module, "engine", {}).url) if getattr(
            db_module, "engine", None) is not None else ""
        assert url == "sqlite://" or (
            url.startswith("sqlite://") and ":memory:" in url), (
            "the turn must never touch a file-backed DB; engine url=%r"
            % url)

    _guard_live_db()

    import api.enterprise_auth_endpoints as ent_auth
    original_ent = getattr(ent_auth, "get_db", None)
    if hasattr(ent_auth, "get_db"):
        # monkeypatch (not direct assignment): auto-restored, and the
        # same never-mutate-identity rule as core.database.get_db.
        monkeypatch.setattr(ent_auth, "get_db", override_get_db,
                            raising=False)

    keys_file = tmp_path / "byok_keys.json"
    keys_file.write_text('{"keys": {}}')
    monkeypatch.setenv("BYOK_KEYS_FILE", str(keys_file))
    monkeypatch.setenv("BYOK_CONFIG_FILE", str(tmp_path / "byok_config.json"))
    monkeypatch.setenv("BYOK_ENC_KEY_FILE", str(tmp_path / "byok_enc"))
    monkeypatch.setattr(be, "BYOK_KEYS_FILE", str(keys_file))
    monkeypatch.setattr(be, "BYOK_CONFIG_FILE",
                        str(tmp_path / "byok_config.json"))
    monkeypatch.setattr(be, "BYOK_ENC_KEY_FILE", str(tmp_path / "byok_enc"))
    _original_manager = be._byok_manager
    be._byok_manager = None
    for _prov in ("openai", "anthropic", "deepseek", "moonshot",
                  "deepinfra", "minimax", "qwen", "gemini", "xiaomi",
                  "openrouter", "glm", "mistral", "groq", "xai",
                  "cerebras", "fireworks", "huggingface", "nvidia_nim",
                  "zai", "opencode", "opencode-go", "google"):
        monkeypatch.delenv(f"{_prov.upper()}_API_KEY", raising=False)

    # SCRATCH KNOWLEDGE STORE: the documents lane's searches must scan
    # the test's own empty store — never the dev world's memory.
    monkeypatch.setenv("LANCEDB_URI", str(tmp_path / "atom_memory"))
    monkeypatch.setenv("ATOM_DATA_DIR", str(tmp_path / "data"))
    # The job-work ledger records the operation before dispatch.
    monkeypatch.setenv("ATOM_TASK_LIFECYCLE_ENABLED", "1")

    from core.models import Base
    Base.metadata.create_all(bind=engine)

    # CANARY (AFTER create_all): get_db_session and the scratch session
    # see the SAME store — a row written through one is readable through
    # the other. Live-DB access is prevented BY CONSTRUCTION, not by
    # convention (verifier reporting correction).
    from core.models import AgentExecution as _AE

    _s = TestSession()
    _s.add(_AE(id="canary-scratch-only"))
    _s.commit()
    _s.close()
    with db_module.get_db_session() as _c:
        assert _c.query(_AE).filter(
            _AE.id == "canary-scratch-only").first() is not None, (
            "get_db_session escaped the scratch world — live-DB access "
            "is not prevented by construction")
    _s = TestSession()
    _s.query(_AE).filter(_AE.id == "canary-scratch-only").delete()
    _s.commit()
    _s.close()

    from core.dynamic_pricing_fetcher import get_pricing_fetcher
    from core.llm import byok_handler as bh
    from core.llm import model_route_registry as mrr

    fetcher = get_pricing_fetcher()
    pricing_keys_before = set(fetcher.pricing_cache.keys())
    cooldown_before = dict(bh._PROVIDER_COOLDOWN_UNTIL)
    cooldown_reason_before = dict(bh._PROVIDER_COOLDOWN_REASON)
    auth_failed_before = set(bh._AUTH_FAILED)

    yield {"Session": TestSession, "engine": engine,
           "override": override_get_db, "tmp_path": tmp_path}

    for key in set(fetcher.pricing_cache.keys()) - pricing_keys_before:
        fetcher.pricing_cache.pop(key, None)
    bh._PROVIDER_COOLDOWN_UNTIL.clear()
    bh._PROVIDER_COOLDOWN_UNTIL.update(cooldown_before)
    bh._PROVIDER_COOLDOWN_REASON.clear()
    bh._PROVIDER_COOLDOWN_REASON.update(cooldown_reason_before)
    bh._AUTH_FAILED.clear()
    bh._AUTH_FAILED.update(auth_failed_before)
    cat = mrr.get_provider_model_catalog()
    try:
        cat._catalog.clear()
        cat._observations.clear()
    except Exception:  # noqa: BLE001 — isolation best-effort
        pass

    be._byok_manager = _original_manager
    db_module.engine, db_module.SessionLocal, db_module.get_db = original
    if original_ent is not None:
        ent_auth.get_db = original_ent
    engine.dispose()


@pytest.fixture()
def world_app(scoped_world, monkeypatch):
    from fastapi.testclient import TestClient

    import main_api_app as main_module
    from core.database import get_db

    # FRESH-INSTALL SHAPE (acceptance-contract probe hygiene): importing
    # main_api_app loads the repo's own backend/.env unconditionally, which
    # REFILLS every dev provider credential this fixture deleted. Pin them
    # empty AFTER the import so the only configured provider is the one the
    # test registers — a dev key serving (or failing) inside this turn
    # proves nothing about the product boundary.
    for _prov in ("openai", "anthropic", "deepseek", "moonshot",
                  "deepinfra", "minimax", "qwen", "gemini", "xiaomi",
                  "openrouter", "glm", "mistral", "groq", "xai",
                  "cerebras", "fireworks", "huggingface", "nvidia_nim",
                  "zai", "opencode", "opencode-go", "google"):
        monkeypatch.setenv(f"{_prov.upper()}_API_KEY", "")
    from core.llm import byok_handler as _bh

    _bh._PROVIDER_COOLDOWN_UNTIL.clear()
    _bh._AUTH_FAILED.clear()

    app = main_module.app
    app.dependency_overrides[get_db] = scoped_world["override"]
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.pop(get_db, None)


def _authorized_workspace(app, scoped_world) -> dict:
    email = f"srcask_{uuid.uuid4().hex[:10]}@test.example.com"
    password = "TestPass123!"
    resp = app.post("/api/auth/register", json={
        "email": email, "password": password,
        "first_name": "Source", "last_ask": "Ask", "last_name": "Ask"})
    assert resp.status_code in (200, 201), resp.text
    login = app.post("/api/auth/login", json={
        "username": email, "password": password})
    assert login.status_code == 200, login.text
    token = login.json().get("access_token")
    assert token, "no access token"
    db = scoped_world["Session"]()
    try:
        from core.models import User

        user = db.query(User).filter(User.email == email).first()
        assert user is not None and user.workspace_id and user.tenant_id
        return {"email": email, "token": token, "user_id": user.id,
                "workspace_id": user.workspace_id,
                "tenant_id": user.tenant_id}
    finally:
        db.close()


def _register_local_route(app, ws: dict, base_url: str,
                          model_caps=None) -> str:
    headers = {"Authorization": f"Bearer {ws['token']}"}
    reg = app.post("/api/local-models", headers=headers, json={
        "name": f"local-{uuid.uuid4().hex[:6]}",
        "provider_type": "ollama",
        "base_url": base_url})
    assert reg.status_code == 200, reg.text
    provider_id = reg.json().get("id")
    assert provider_id, reg.text
    caps_override = dict(model_caps or {})
    caps = app.post(f"/api/local-models/{provider_id}/capabilities",
                    headers=headers, json={
                        "model_id": MODEL_NAME,
                        "supports_tools": True,
                        "supports_vision": False,
                        "supports_reasoning": bool(
                            caps_override.get("supports_reasoning", False)),
                        "quality_score": float(
                            caps_override.get("quality_score", 0.9)),
                        "speed_score": float(
                            caps_override.get("speed_score", 0.8)),
                        "context_window": int(
                            caps_override.get("context_window", 8192))})
    assert caps.status_code == 200, caps.text
    # The product's own discovery step (Settings → local models runs it):
    # populates the provider's served-model catalogue from the live
    # endpoint — what the router checks routes against.
    disc = app.get(f"/api/local-models/{provider_id}/models",
                   headers=headers)
    assert disc.status_code == 200, disc.text
    return provider_id


def _turn_tool_receipts(scoped_world, user_id: str) -> list:
    """Durable attributable receipts: the latest execution row's
    task_outcome.tool_outcomes (read-only ORM read over the scratch DB,
    acceptance-trial convention). The scratch DB holds only this test's
    rows."""
    db = scoped_world["Session"]()
    try:
        from core.models import AgentExecution

        row = (db.query(AgentExecution)
               .order_by(AgentExecution.started_at.desc(),
                         AgentExecution.id.desc())
               .first())
        if row is None:
            return []
        meta = row.metadata_json if isinstance(row.metadata_json, dict) \
            else {}
        outcome = meta.get("task_outcome") or {}
        return [t for t in (outcome.get("tool_outcomes") or [])
                if isinstance(t, dict)]
    finally:
        db.close()


def _drive_source_ask_turn(
        scoped_world, world_app, structured_plan, session_id="sess-j2",
        reply_text=FABRICATED_REPLY, message=SOURCE_ASK,
        before_turn=None, history_out=None, session_out=None,
        model_caps=None, structured_delay=0.0, planner_stall=None,
        tool_plan_wait=None, optional_planning_timeout=None,
        disable_required_read=False, reply_fn=None):
    """One real orchestrator turn for the preserved source ask, with the
    external responses controlled: the planner's structured proposal is
    ``structured_plan`` and the reply endpoint returns ``reply_text``.
    Interpretation, plan validation, dispatch, receipts, settlement and
    narration gating all run for real. Returns (out, receipts, ep).

    L3 additions (backwards-compatible): ``before_turn(ws)`` seeds the
    scratch world AFTER the fresh user/workspace exists (e.g. the uploaded
    document row the product's own upload route writes); ``history_out``
    receives the session-update payloads the turn would have persisted;
    ``session_out["session"]`` exposes the live session dict.

    Timeout controls (2026-10-19): ``structured_delay`` stalls the
    OPTIONAL structured proposal; ``planner_stall`` replaces the whole
    planner with a stalled coroutine (the outer-wait case);
    ``tool_plan_wait`` / ``optional_planning_timeout`` shrink the real
    waits for a focused test; ``disable_required_read`` is the mutation
    control that restores the old ordering's outcome.
    """
    from unittest.mock import AsyncMock, MagicMock, patch

    import integrations.chat_orchestrator as co
    import core.chat_tool_planner as ctp
    from core.llm_service import LLMService

    ep = _ScriptedReplyEndpoint(reply_text, reply_fn=reply_fn)
    ep.__enter__()
    try:
        ws = _authorized_workspace(world_app, scoped_world)
        if before_turn is not None:
            before_turn(ws)
        _register_local_route(world_app, ws, ep.base_url,
                              model_caps=model_caps)
        orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
        orch.tenant_id = "default"
        orch._cancelled_sessions = set()
        orch._budget_exceeded_runs = set()
        orch.llm_service = LLMService(tenant_id="default")
        session = {"id": session_id, "history": []}
        if session_out is not None:
            session_out["session"] = session

        def _record_session_update(sess, msg, response, intent):
            if history_out is not None:
                history_out.append({
                    "message": msg, "response": response,
                    "intent": intent})

        async def _plan_ce(*a, **k):
            class _P:
                wants_edit = False
            return _P()

        async def _structured(llm_service, *, prompt, response_model,
                              system_instruction, **_kw):
            if structured_delay:
                await asyncio.sleep(float(structured_delay))
            return structured_plan

        async def _stalled_planner(*a, **k):
            await asyncio.sleep(float(planner_stall))
            return structured_plan

        with ExitStack() as st:
            for cm in [
                patch.object(orch, "_get_or_create_session",
                             return_value=session),
                patch.object(orch, "_resolve_canvas_ctx",
                             new=AsyncMock(return_value=None)),
                patch.object(orch, "_record_chat_step", new=AsyncMock()),
                patch.object(orch, "_emit_agent_status", new=AsyncMock()),
                patch.object(orch, "_update_session",
                             new=MagicMock(
                                 side_effect=_record_session_update)),
                patch.object(orch, "_load_conversation_mail_handles",
                             return_value=([], [])),
                patch.object(orch, "_route_to_features",
                             new=AsyncMock(return_value={})),
                patch("core.memory_context_assembler.assembly_enabled",
                      return_value=False),
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
            if tool_plan_wait is not None:
                st.enter_context(patch.object(
                    co, "_TOOL_PLAN_WAIT_SECONDS", float(tool_plan_wait)))
            if optional_planning_timeout is not None:
                st.enter_context(patch.object(
                    ctp, "_OPTIONAL_PLANNING_TIMEOUT_SECONDS",
                    float(optional_planning_timeout)))
            if planner_stall is not None:
                st.enter_context(patch.object(
                    ctp, "plan_tool_use", new=_stalled_planner))
            if disable_required_read:
                st.enter_context(patch.object(
                    ctp, "enforce_required_read",
                    new=lambda *a, **k: None))
            out = asyncio.run(orch.process_chat_message(
                ws["user_id"], message, session_id,
                context={"workspace_id": ws["workspace_id"]}))
        return out, _turn_tool_receipts(scoped_world, ws["user_id"]), ep
    finally:
        ep.__exit__()


class TestSourceAskExecutesAndNarratesTruthfully:
    """The preserved pristine-J2 request, on the real turn path.

    ``process_chat_message`` is the APPLICATION entry point the public
    route serves — this proves the repaired turn at that boundary; the
    authenticated HTTP wrapper, finalization and the browser remain the
    pristine harness's gate (reporting correction kept honest here)."""

    def test_declined_plan_still_executes_the_requested_search(
            self, scoped_world, world_app):
        from core.chat_tool_planner import ToolPlan

        # THE OBSERVED EXTERNAL RESPONSE: the planner model declines
        # tool use (the live turn's converse-only shape).
        declined_plan = ToolPlan(
            use_tool=False, service=None, intent="search", query="",
            reason="a conversational answer is enough")
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, declined_plan, "sess-j2-srcask")

        reply = str(out.get("message") or "")
        assert ep.hit_count >= 1, (
            "the turn must dispatch the reply through the user's own "
            "registered provider")

        # -- 1. ATTRIBUTABLE EXECUTION -----------------------------
        executed = [r for r in receipts if r.get("verified") is True]
        assert executed, (
            "a source ask must leave at least one attributable "
            "executed-tool receipt; got "
            f"{__import__('json').dumps(receipts, default=str)[:400]}")

        # -- 2. NARRATION AGREEMENT --------------------------------
        low = reply.lower()
        for source in UNCONNECTED_SOURCE_CLAIMS:
            assert source not in low, (
                f"the reply claims a search of {source!r}, which "
                "nothing this turn queried: "
                f"{reply[:300]!r}")
        import re as _re

        if _re.search(
                r"\b(?:i'?ve|we'?ve|i|we)\s+(?:searched|checked|"
                r"scanned|looked|queried|found)\b", low):
            assert _re.search(r"no (?:matches|results)", low) or \
                _re.search(r"nothing was (?:searched|queried|found)",
                           low) or any(
                "documents" in str(r.get("tool") or "")
                for r in executed), (
                "a reply that claims searching must either report the "
                f"executed search's honest outcome or say nothing ran "
                f"(executed: {executed!r}); got {reply[:300]!r}")
        assert not _re.search(r"\$[\d,]+", reply), (
            "the reply ships figures no executed evidence supports: "
            f"{reply[:300]!r}")

    def test_a_valid_plan_passes_through_uncorrected(
            self, scoped_world, world_app):
        """VERIFIER CHECK 5 — a valid alternative executes end to end
        WITHOUT the floor's correction: one documents dispatch, one
        attributable receipt, and the fabricated narration is still
        held to the structured receipt's counts."""
        from core.chat_tool_planner import ToolPlan

        valid = ToolPlan(
            use_tool=True, service="documents", intent="search",
            query="quarterly revenue", reason="the user's documents ask")
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, valid, "sess-j2-valid")
        executed = [r for r in receipts if r.get("verified") is True]
        assert executed and any(
            "documents" in str(r.get("tool") or "") for r in executed), (
            f"a valid plan must execute and settle receipts; got "
            f"{receipts!r}")
        # EXACTLY ONE documents execution for the turn: the floor must
        # not duplicate a plan that already serves the obligation.
        doc_rows = [r for r in receipts
                    if "documents" in str(r.get("tool") or "")]
        assert len(doc_rows) == 1, (
            f"no duplicate source execution; got {doc_rows!r}")
        reply = str(out.get("message") or "").lower()
        assert "zoho crm" not in reply and "google drive" not in reply
        assert "5 records" not in reply, (
            f"count claims must agree with the receipt: {reply[:200]!r}")

    def test_unavailable_source_answers_truthfully(
            self, scoped_world, world_app, monkeypatch):
        """VERIFIER CHECK 5 — a truthful unavailable-source result: with
        NO service that meets the obligation's evidence requirements
        (a DESIGNATED file, VFS off, no datasets, memory excluded for
        designated-file asks), the turn executes nothing, and the reply
        says the work was NOT performed (never a lookalike source,
        never a fabricated result)."""
        from core.chat_tool_planner import ToolPlan

        monkeypatch.setenv("ATOM_KNOWLEDGE_VFS_ENABLED", "false")
        declined_plan = ToolPlan(
            use_tool=False, service=None, intent="search", query="",
            reason="nothing available")
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, declined_plan, "sess-j2-unavail",
            reply_text=(
                "I've searched your Zoho CRM integration and your "
                "Google Drive for the quarterly revenue. I found 5 "
                "records in q3_review.xlsx totaling $1,250,000."),
            message=("Search my documents for the q3_review.xlsx "
                     "quarterly revenue figures and tell me what you "
                     "find."))

        verified = [r for r in receipts if r.get("verified") is True]
        assert not verified, (
            f"an unservable ask must not fabricate an execution; got "
            f"{receipts!r}")
        reply = str(out.get("message") or "").lower()
        for source in UNCONNECTED_SOURCE_CLAIMS:
            assert source not in reply, (
                f"the reply claims a search of {source!r}: "
                f"{reply[:300]!r}")
        assert ("couldn't search" in reply
                or "nothing was searched" in reply
                or "no connected system was queried" in reply
                or "nothing was read" in reply
                or "could not resolve" in reply), (
            "with no servable source the reply must say the work was "
            f"not performed; got {reply[:300]!r}")


# =========================================================================
# L3 (F-R1) — requirement-driven document retrieval, end to end
#
# The preserved finding: the uploaded-documents ask below selected the
# memory lane in 2/3 live repetitions (correct content, saved status
# failed/unconfirmed) and documents.search in 1/3 (validated). These
# tests drive the REAL turn with the planner's structured proposal pinned
# to the observed memory proposal; the source-ask floor must execute the
# documents lane, and the durable outcome must agree with what ran.
# =========================================================================

L3_ASK = ("search my uploaded documents for the launch code for "
          "project Zephyr-9 and tell me the code")
L3_FIXTURE = (
    "ATOM PHASE D FIXTURE — internal notes.\n"
    "Project Zephyr-9 launch planning.\n"
    "The launch code for project Zephyr-9 is QUARTZ-77.\n"
    "Status: approved by the launch office.")


def _turn_outcome(scoped_world) -> dict:
    """The authoritative persisted task_outcome of the latest execution
    (fresh ORM read over the scratch DB — never the in-memory response)."""
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


def _seed_uploaded_document(scoped_world, ws, content=L3_FIXTURE,
                            filename="notes_zephyr9.txt",
                            workspace_id=None):
    """World state: the IngestedDocument mirror row the product's own
    ``POST /api/documents/upload`` route writes (same content-hash
    identity and fields). The REQUIRED lexical retrieval leg reads this
    table; the route's LanceDB vector row is not needed for it (the
    vector leg is optional and may legitimately be skipped without an
    embedding provider). No receipt is seeded — the planner, executor,
    and settlement produce those from the retrieval."""
    from datetime import datetime, timezone

    from api.document_routes import _content_doc_key
    from core.doc_freshness_service import hash_text
    from core.models import IngestedDocument

    doc_id = _content_doc_key(content)
    db = scoped_world["Session"]()
    try:
        db.add(IngestedDocument(
            id=doc_id,
            workspace_id=workspace_id or ws["workspace_id"],
            tenant_id=ws["tenant_id"],
            external_id=f"upload_{doc_id}",
            integration_id="manual_upload",
            file_name=filename,
            file_path=f"upload:{filename}",
            file_type="txt",
            file_size_bytes=len(content.encode("utf-8")),
            content_preview=content[:500],
            ingested_at=datetime.now(timezone.utc),
            source_content_hash=hash_text(content),
            last_verified_at=datetime.now(timezone.utc),
            freshness_status="fresh",
        ))
        db.commit()
    finally:
        db.close()
    return doc_id


def _memory_proposal():
    from core.chat_tool_planner import ToolPlan

    return ToolPlan(
        use_tool=True, service="memory", intent="search",
        query="launch code project Zephyr-9",
        reason="a recollection of the ingested notes answers this")


class TestL3DocumentEvidence:
    # A grounded prompt carrying document content routes to a higher
    # tier; register the scripted model as one that could serve it (a
    # real local model doing this job supports reasoning + context).
    MODEL_CAPS = {"supports_reasoning": True, "quality_score": 1.0,
                  "speed_score": 0.95, "context_window": 32768}
    """F-R1 at the product boundary (process_chat_message)."""

    def test_memory_proposal_is_corrected_to_the_documents_lane(
            self, scoped_world, world_app, monkeypatch):
        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        # The scripted provider serves non-streaming JSON only;
        # the streaming attempt would cool the route down mid-turn.
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        """THE regression: the observed planner choice (memory) must not
        stand for a document-evidence ask. On the immutable parent this
        fails — the memory lane executes and no documents execution
        exists, so the turn's saved status resolves failed/unconfirmed.
        Empty scratch store: the corrected search is a bounded absence
        (executed, complete, zero matches), never a recollection."""
        history_out = []
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-l3-corrected", message=L3_ASK,
            reply_text=("I couldn't find any matching lines in your "
                        "uploaded documents."),
            history_out=history_out,
            model_caps=self.MODEL_CAPS)

        executed = [r for r in receipts if r.get("verified") is True]
        doc_rows = [r for r in executed
                    if "documents" in str(r.get("tool") or "")]
        mem_rows = [r for r in receipts
                    if str(r.get("tool") or "") == "memory"]
        assert doc_rows, (
            "the document ask must execute a source-reading lane; got "
            f"{receipts!r}")
        assert not mem_rows, (
            "recollection must not execute as the source answer; got "
            f"{mem_rows!r}")

        refs = [ref for ref in doc_rows[0].get("evidence_refs") or []
                if isinstance(ref, dict)]
        assert any(ref.get("coverage") == "complete"
                   and isinstance(ref.get("match_count"), int)
                   for ref in refs), (
            "an executed search states its complete coverage and count "
            f"(bounded absence included); got {refs!r}")
        assert "empty_in_scope" in str(doc_rows[0].get("outcome") or "")

        # RESPONSE ⇄ PERSISTED OUTCOME: the saved outcome carries the
        # same documents execution the reply was settled against.
        outcome = _turn_outcome(scoped_world)
        assert any("documents" in str(t.get("tool") or "")
                   for t in (outcome.get("tool_outcomes") or [])), (
            f"durable outcome missing the documents execution: {outcome!r}")
        assert out.get("success") is True, (
            f"a delivered, complete bounded search is settled truth: {out!r}")
        assert outcome.get("objective_met") is True
        # HISTORY: the turn's own persisted-turn payload carries the same
        # delivered answer the response returned.
        if history_out:
            assert any(str((h.get("response") or {}).get("message") or "")
                       in str(out.get("message") or "")
                       or str(out.get("message") or "")
                       in str((h.get("response") or {}).get("message") or "")
                       for h in history_out)

    def test_turn_carries_the_accepted_requirement_into_the_planner(
            self, scoped_world, world_app, monkeypatch):
        """Wiring proof: during the real turn the planner is invoked WITH
        the accepted request's evidence requirement (source kinds +
        obligation) — the execution-keyed stash / the decision-built
        record, not a re-derivation. This is the seam the F-R1 repair
        consumes; without it the floor falls back to message nouns."""
        import core.chat_tool_planner as ctp

        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        calls = []
        real = ctp.plan_tool_use

        async def _spy(*a, **k):
            calls.append(dict(k))
            return await real(*a, **k)

        # The call sites import plan_tool_use from this module at call
        # time — patch the module attribute they resolve.
        monkeypatch.setattr(ctp, "plan_tool_use", _spy)
        _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-l3-carry", message=L3_ASK,
            reply_text=("I couldn't find any matching lines in your "
                        "uploaded documents."),
            model_caps=self.MODEL_CAPS)
        assert calls, "the turn must invoke the tool planner"
        reqs = [c.get("evidence_requirement") for c in calls]
        assert any(isinstance(r, dict)
                   and sorted(r.get("sources") or []) == ["documents"]
                   and r.get("required") is True for r in reqs), (
            "the planner must receive the accepted document requirement; "
            f"got {reqs!r}")

    def test_uploaded_document_answer_settles_successfully(
            self, scoped_world, world_app, monkeypatch):
        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        # The scripted provider serves non-streaming JSON only;
        # the streaming attempt would cool the route down mid-turn.
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        """Positive case through the real planner/executor/settlement
        chain: the document exists in the user's workspace; the corrected
        documents execution finds it (a REAL retrieval — the row is world
        state, no receipt is seeded), the reply carries the fact, and the
        durable outcome validates."""
        seeded = {}

        def _seed(ws):
            seeded["id"] = _seed_uploaded_document(scoped_world, ws)

        history_out = []
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-l3-found", message=L3_ASK,
            reply_text=("The launch code for project Zephyr-9 is QUARTZ-77. "
                        "I found it in your uploaded document."),
            before_turn=_seed, history_out=history_out,
            model_caps=self.MODEL_CAPS)

        doc_rows = [r for r in receipts
                    if "documents" in str(r.get("tool") or "")]
        assert doc_rows, f"no documents execution; got {receipts!r}"
        refs = [ref for ref in doc_rows[0].get("evidence_refs") or []
                if isinstance(ref, dict)]
        assert any(int(ref.get("match_count") or 0) >= 1 for ref in refs), (
            f"the seeded document must be FOUND by the real search; got "
            f"{refs!r}")
        assert "QUARTZ-77" in str(out.get("message") or "")
        assert out.get("success") is True, f"settled turn: {out!r}"

        outcome = _turn_outcome(scoped_world)
        assert outcome.get("objective_met") is True, (
            f"saved status must agree with the completed retrieval: "
            f"{outcome!r}")
        assert any("documents" in str(t.get("tool") or "")
                   for t in (outcome.get("tool_outcomes") or []))
        if history_out:
            assert any("QUARTZ-77" in str(
                (h.get("response") or {}).get("message") or "")
                for h in history_out)

    def test_document_in_another_workspace_cannot_complete_the_ask(
            self, scoped_world, world_app, monkeypatch):
        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        # The scripted provider serves non-streaming JSON only;
        # the streaming attempt would cool the route down mid-turn.
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        """Scope control: the SAME document content in somebody else's
        workspace must not be retrieved — the authenticated workspace
        boundary decides, so the turn settles as an honest bounded
        absence (zero matches), never as the found fact."""
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-l3-otherws", message=L3_ASK,
            reply_text=("I couldn't find any matching lines in your "
                        "uploaded documents."),
            before_turn=lambda ws: _seed_uploaded_document(
                scoped_world, ws, workspace_id="ws-somebody-else"),
            model_caps=self.MODEL_CAPS)
        doc_rows = [r for r in receipts
                    if "documents" in str(r.get("tool") or "")]
        assert doc_rows, f"the source-reading lane must run; {receipts!r}"
        refs = [ref for ref in doc_rows[0].get("evidence_refs") or []
                if isinstance(ref, dict)]
        assert all(int(ref.get("match_count") or 0) == 0 for ref in refs), (
            "a document outside the authenticated workspace never "
            f"donates hits; got {refs!r}")
        assert "QUARTZ-77" not in str(out.get("message") or "")


class TestRequiredReadSurvivesPlannerTimeout:
    """2026-10-19 composed-attempt failure: a `source_read` had already
    been compiled for the accepted document ask, but the tool-planning
    call hit `TimeoutError` and the executor was skipped entirely. These
    tests stall the real planning seam and require the accepted read to
    reach the real executor, receipt and settlement."""

    MODEL_CAPS = {"supports_reasoning": True, "quality_score": 1.0,
                  "speed_score": 0.95, "context_window": 32768}

    @staticmethod
    def _doc_rows(receipts):
        return [r for r in receipts
                if "documents" in str(r.get("tool") or "")]

    @staticmethod
    def _message_blob(ep):
        out = []
        for call in ep.calls:
            for msg in call.get("messages") or []:
                if isinstance(msg, dict):
                    out.append(str(msg.get("content") or ""))
        return "\n".join(out)

    def test_optional_planning_timeout_still_executes_document_read(
            self, scoped_world, world_app, monkeypatch):
        """Plan-layer proof: the optional structured call stalls past its
        own bound, but the accepted requirement's documents read still
        executes through the normal lane and settles complete."""
        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        history_out = []
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-timeout-optional", message=L3_ASK,
            reply_text=("The launch code for project Zephyr-9 is QUARTZ-77. "
                        "I found it in your uploaded document."),
            before_turn=lambda ws: _seed_uploaded_document(scoped_world, ws),
            history_out=history_out, model_caps=self.MODEL_CAPS,
            structured_delay=3.0,
            tool_plan_wait=6.0,
            optional_planning_timeout=1.0,
        )
        doc_rows = self._doc_rows(receipts)
        assert doc_rows, (
            "a planning timeout must not skip the already-accepted "
            f"document read; receipts={receipts!r}")
        refs = [ref for ref in doc_rows[0].get("evidence_refs") or []
                if isinstance(ref, dict)]
        assert any(int(ref.get("match_count") or 0) >= 1 for ref in refs), (
            f"the real documents search must find the seeded fact; {refs!r}")
        assert "QUARTZ-77" in str(out.get("message") or "")
        assert out.get("success") is True, f"settled timeout turn: {out!r}"
        outcome = _turn_outcome(scoped_world)
        assert outcome.get("objective_met") is True, (
            f"persisted outcome must agree with the executed read: {outcome!r}")
        assert any("documents" in str(t.get("tool") or "")
                   for t in (outcome.get("tool_outcomes") or []))
        if history_out:
            assert any("QUARTZ-77" in str(
                (h.get("response") or {}).get("message") or "")
                for h in history_out), (
                "fresh history must carry the same delivered answer")

    def test_outer_plan_wait_timeout_still_executes_document_read(
            self, scoped_world, world_app, monkeypatch):
        """The exact attempt-2 shape: the WHOLE planner task is cancelled
        by the outer wait. The caller fallback rebuilds the accepted
        requirement's deterministic plan and executes it."""
        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        history_out = []
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-timeout-outer", message=L3_ASK,
            reply_text=("The launch code for project Zephyr-9 is QUARTZ-77. "
                        "I found it in your uploaded document."),
            before_turn=lambda ws: _seed_uploaded_document(scoped_world, ws),
            history_out=history_out, model_caps=self.MODEL_CAPS,
            planner_stall=5.0,
            tool_plan_wait=0.2,
        )
        doc_rows = self._doc_rows(receipts)
        assert doc_rows, (
            "outer planner cancellation must not lose the accepted "
            f"document read; receipts={receipts!r}")
        refs = [ref for ref in doc_rows[0].get("evidence_refs") or []
                if isinstance(ref, dict)]
        assert any(int(ref.get("match_count") or 0) >= 1 for ref in refs), (
            f"the fallback read must be a real retrieval; {refs!r}")
        assert "QUARTZ-77" in str(out.get("message") or "")
        assert out.get("success") is True, f"settled timeout turn: {out!r}"
        outcome = _turn_outcome(scoped_world)
        assert outcome.get("objective_met") is True, (
            f"persisted outcome must agree with the fallback read: {outcome!r}")
        if history_out:
            assert any("QUARTZ-77" in str(
                (h.get("response") or {}).get("message") or "")
                for h in history_out)

    def test_outer_timeout_without_enforcement_keeps_no_receipt(
            self, scoped_world, world_app, monkeypatch):
        """Mutation control: restoring the old ordering (no required-read
        enforcement) leaves the exact attempt-2 outcome — the planner is
        cancelled, no executor runs, no documents receipt exists. This
        makes the preceding regression meaningful."""
        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-timeout-mutation", message=L3_ASK,
            reply_text=("I couldn't find any matching lines in your "
                        "uploaded documents."),
            before_turn=lambda ws: _seed_uploaded_document(scoped_world, ws),
            model_caps=self.MODEL_CAPS,
            planner_stall=5.0,
            tool_plan_wait=0.2,
            disable_required_read=True,
        )
        assert not self._doc_rows(receipts), (
            "the mutation control must reproduce the old no-receipt shape; "
            f"got {receipts!r}")
        # The turn still answers, but without an attributable read.
        assert ep.hit_count >= 1
        assert out is not None

    def test_outer_timeout_empty_result_settles_as_bounded_absence(
            self, scoped_world, world_app, monkeypatch):
        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        history_out = []
        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-timeout-empty", message=L3_ASK,
            reply_text=("I couldn't find any matching lines in your "
                        "uploaded documents."),
            history_out=history_out, model_caps=self.MODEL_CAPS,
            planner_stall=5.0,
            tool_plan_wait=0.2,
        )
        doc_rows = self._doc_rows(receipts)
        assert doc_rows, f"the required read must still execute; {receipts!r}"
        refs = [ref for ref in doc_rows[0].get("evidence_refs") or []
                if isinstance(ref, dict)]
        assert any(ref.get("coverage") == "complete"
                   and int(ref.get("match_count") or 0) == 0 for ref in refs), (
            f"an empty real search is a bounded absence; got {refs!r}")
        assert "empty_in_scope" in str(doc_rows[0].get("outcome") or "")
        assert out.get("success") is True, (
            f"a delivered bounded absence is settled truth: {out!r}")
        outcome = _turn_outcome(scoped_world)
        assert any("documents" in str(t.get("tool") or "")
                   for t in (outcome.get("tool_outcomes") or []))

    def test_distractor_document_does_not_replace_the_correct_source(
            self, scoped_world, world_app, monkeypatch):
        """The decoy is in the same workspace and matches the query; the
        executed read must still deliver the approved document, and a
        grounded reply must use it rather than the decoy."""
        monkeypatch.setenv("ATOM_HYBRID_VECTOR_LEG_ENABLED", "false")
        monkeypatch.setenv("ATOM_CHAT_STREAMING", "false")
        decoy = (
            "Project Zephyr-9 launch planning archive (superseded).\n"
            "The launch code for project Zephyr-9 is BASALT-13.\n"
            "Status: draft only, do not use.")

        def _seed(ws):
            _seed_uploaded_document(scoped_world, ws)
            _seed_uploaded_document(
                scoped_world, ws, content=decoy,
                filename="zephyr9_superseded_decoy.txt")

        def _grounded_reply(messages):
            blob = "\n".join(
                str(m.get("content") or "") for m in messages
                if isinstance(m, dict))
            if "QUARTZ-77" in blob:
                return ("The launch code for project Zephyr-9 is QUARTZ-77, "
                        "from the approved document.")
            if "BASALT-13" in blob:
                return "The launch code for project Zephyr-9 is BASALT-13."
            return "I couldn't find the launch code in the sources."

        out, receipts, ep = _drive_source_ask_turn(
            scoped_world, world_app, _memory_proposal(),
            "sess-timeout-distractor", message=L3_ASK,
            reply_text="I couldn't find the launch code in the sources.",
            reply_fn=_grounded_reply,
            before_turn=_seed, model_caps=self.MODEL_CAPS,
            planner_stall=5.0,
            tool_plan_wait=0.2,
        )
        doc_rows = self._doc_rows(receipts)
        assert doc_rows, f"the required read must execute; {receipts!r}"
        blob = self._message_blob(ep)
        assert "QUARTZ-77" in blob, (
            "the correct document's fact must reach the generation context")
        assert "BASALT-13" not in str(out.get("message") or ""), (
            f"the decoy must not win: {out.get('message')!r}")

    def test_ambiguous_identity_and_no_capability_stay_unresolved(self):
        """Honesty at the deterministic seam: ambiguous accepted identity,
        no eligible capability, several equally plausible mailboxes, and
        a no-obligation requirement never produce a fabricated plan."""
        import core.chat_tool_planner as ctp
        from unittest.mock import patch

        ambiguous = {
            "required": True, "sources": ["document"], "fields": [],
            "subjects": ["the approved record"],
            "identity": {"state": "ambiguous",
                         "names": ["record A", "record B"]},
        }
        assert ctp.enforce_required_read(
            None, evidence_requirement=ambiguous,
            connected=["documents"], message=L3_ASK) is None
        assert ctp.eligible_read_capabilities(
            ambiguous, ["documents"], L3_ASK) == []

        no_cap = {
            "required": True, "sources": ["document"], "fields": [],
            "subjects": ["project Zephyr-9"],
            "identity": {"state": "kind_only"},
        }
        with patch.object(ctp, "_available_platform_services",
                          return_value=["memory"]), \
                patch.object(ctp, "_datasets_service_available",
                             return_value=False):
            assert ctp.enforce_required_read(
                None, evidence_requirement=no_cap, connected=[],
                message=L3_ASK) is None

        comms = {
            "required": True, "sources": ["email"], "fields": [],
            "subjects": ["the Acme quote"],
            "identity": {"state": "kind_only"},
        }
        assert ctp.enforce_required_read(
            None, evidence_requirement=comms,
            connected=["outlook", "gmail", "memory"],
            message="Search my emails for the Acme quote") is None

        no_obligation = {
            "required": False, "sources": ["document"], "fields": [],
            "subjects": [],
            "identity": {"state": "kind_only"},
        }
        assert ctp.enforce_required_read(
            None, evidence_requirement=no_obligation,
            connected=["documents"],
            message="Update the draft payment terms to Net 30.") is None
        assert ctp.enforce_required_read(
            None, evidence_requirement=None, connected=["documents"],
            message="Update the draft payment terms to Net 30.") is None
