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

    def __init__(self, reply_text: str, model: str = MODEL_NAME):
        self.reply_text = reply_text
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
                    })
                body = json.dumps({
                    "id": "chatcmpl-scripted",
                    "object": "chat.completion",
                    "model": payload.get("model") or outer.model,
                    "choices": [{
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {"role": "assistant",
                                    "content": outer.reply_text},
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


def _register_local_route(app, ws: dict, base_url: str) -> str:
    headers = {"Authorization": f"Bearer {ws['token']}"}
    reg = app.post("/api/local-models", headers=headers, json={
        "name": f"local-{uuid.uuid4().hex[:6]}",
        "provider_type": "ollama",
        "base_url": base_url})
    assert reg.status_code == 200, reg.text
    provider_id = reg.json().get("id")
    assert provider_id, reg.text
    caps = app.post(f"/api/local-models/{provider_id}/capabilities",
                    headers=headers, json={
                        "model_id": MODEL_NAME,
                        "supports_tools": True,
                        "supports_vision": False,
                        "supports_reasoning": False,
                        "quality_score": 0.9, "speed_score": 0.8,
                        "context_window": 8192})
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
        reply_text=FABRICATED_REPLY, message=SOURCE_ASK):
    """One real orchestrator turn for the preserved source ask, with the
    external responses controlled: the planner's structured proposal is
    ``structured_plan`` and the reply endpoint returns ``reply_text``.
    Interpretation, plan validation, dispatch, receipts, settlement and
    narration gating all run for real. Returns (out, receipts, ep)."""
    from unittest.mock import AsyncMock, MagicMock, patch

    import integrations.chat_orchestrator as co
    from core.llm_service import LLMService

    ep = _ScriptedReplyEndpoint(reply_text)
    ep.__enter__()
    try:
        ws = _authorized_workspace(world_app, scoped_world)
        _register_local_route(world_app, ws, ep.base_url)
        orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
        orch.tenant_id = "default"
        orch._cancelled_sessions = set()
        orch._budget_exceeded_runs = set()
        orch.llm_service = LLMService(tenant_id="default")
        session = {"id": session_id, "history": []}

        async def _plan_ce(*a, **k):
            class _P:
                wants_edit = False
            return _P()

        async def _structured(llm_service, *, prompt, response_model,
                              system_instruction, **_kw):
            return structured_plan

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
