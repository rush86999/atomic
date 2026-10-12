"""J2 provider-scope work order (owner, 2026-10-12): TWO authorized
workspaces register the SAME model name at DIFFERENT endpoints with
DIFFERENT capabilities. Registration rides the REAL product path
(``POST /api/local-models`` + ``/capabilities`` with each user's own
token); the external endpoints are controlled HTTP servers that count
and attribute every completion call. No routing result is seeded and
the handler under test is never patched — dispatch runs through
``LLMService.generate_completion`` and the real ``BYOKHandler``.

The demonstrated defects this file pins (each control names the class):

- scope loss: the chat path builds ``LLMService`` without the user's
  workspace and ``generate_completion``/``generate`` collapse the
  tenant into the workspace (and drop tenant at ``_get_handler``);
- identity split: a registered local client is keyed ``local_<id>``
  while its model metadata lands in the GLOBAL pricing cache keyed by
  model name only — two workspaces overwrite each other's capabilities
  and the ranker attributes the model to a provider type, never to the
  client that holds the endpoint;
- absolute fallback: ``COST_EFFICIENT_MODELS`` has no entry for a
  dynamically registered provider id, so a healthy local route is
  skipped and the turn renders "no provider configured".
"""
import asyncio
import json
import threading
import time
import uuid
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest


MODEL_NAME = "shared-model"


class _CountingEndpoint:
    """A controlled OpenAI-compatible endpoint. Counts and attributes
    every /chat/completions call; identifies itself in the reply body so
    the test can tell WHICH endpoint answered."""

    def __init__(self, tag: str, model: str = MODEL_NAME):
        self.tag = tag
        self.model = model
        self.calls = []          # [{'model':…, 'messages':…, 'auth': bool}]
        self._lock = threading.Lock()
        outer = self

        class _Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):  # silence the per-request stderr
                pass

            def do_GET(self):
                if self.path.rstrip("/").endswith("/models"):
                    body = json.dumps({
                        "object": "list",
                        "data": [{"id": outer.model,
                                  "object": "model",
                                  "owned_by": outer.tag}],
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
                        "auth": bool(self.headers.get("Authorization")),
                    })
                body = json.dumps({
                    "id": f"chatcmpl-{outer.tag}",
                    "object": "chat.completion",
                    "model": payload.get("model") or outer.model,
                    "choices": [{
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {"role": "assistant",
                                    "content": f"pong-{outer.tag}"},
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
    """Scratch database + scratch credentials. Repoints core.database at
    an in-memory engine (the BYOK/local-provider loaders read through
    ``core.database.get_db_session``, not an injected session) and gives
    the process a FRESH key store, so the only configured providers are
    the ones the test registers — the fresh-install shape the J2 work
    order targets. Snapshots every process-global the dispatch path
    touches and restores them after."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    import core.database as db_module
    import core.byok_endpoints as be
    import main_api_app as main_module
    from core.database import get_db
    from core.models import Base

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
    db_module.get_db = override_get_db

    import api.enterprise_auth_endpoints as ent_auth
    original_ent = getattr(ent_auth, "get_db", None)
    if hasattr(ent_auth, "get_db"):
        ent_auth.get_db = override_get_db

    # SCRATCH CREDENTIAL STORE: the runtime resolves keys env-first, then
    # BYOK-file. Point both at the test's own empty store so no machine
    # credential can serve (or be billed by) a dispatch under test.
    keys_file = tmp_path / "byok_keys.json"
    keys_file.write_text('{"keys": {}}')
    monkeypatch.setenv("BYOK_KEYS_FILE", str(keys_file))
    monkeypatch.setenv("BYOK_CONFIG_FILE",
                       str(tmp_path / "byok_config.json"))
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

    Base.metadata.create_all(bind=engine)

    # Process-globals the routing path mutates: snapshot for restore.
    from core.dynamic_pricing_fetcher import get_pricing_fetcher
    from core.llm import byok_handler as bh
    from core.llm import model_route_registry as mrr

    fetcher = get_pricing_fetcher()
    pricing_keys_before = set(fetcher.pricing_cache.keys())
    cooldown_before = dict(bh._PROVIDER_COOLDOWN_UNTIL)
    cooldown_reason_before = dict(bh._PROVIDER_COOLDOWN_REASON)
    auth_failed_before = set(bh._AUTH_FAILED)

    yield {"Session": TestSession, "engine": engine,
           "override": override_get_db}

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
def world_app(scoped_world):
    """The REAL FastAPI app over the scratch DB (real auth + the real
    /api/local-models registration path)."""
    from fastapi.testclient import TestClient

    import main_api_app as main_module
    from core.database import get_db

    app = main_module.app
    app.dependency_overrides[get_db] = scoped_world["override"]
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.pop(get_db, None)


def _authorized_workspace(app, scoped_world) -> dict:
    """One authorized workspace through the REAL register/login path.
    Each registered user gets its own tenant + workspace (the product's
    own registration creates them)."""
    email = f"scope_{uuid.uuid4().hex[:10]}@test.example.com"
    password = "TestPass123!"
    resp = app.post("/api/auth/register", json={
        "email": email, "password": password,
        "first_name": "Scope", "last_name": "Tester"})
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
        return {"email": email, "token": token,
                "user_id": user.id,
                "workspace_id": user.workspace_id,
                "tenant_id": user.tenant_id}
    finally:
        db.close()


def _register_local_route(app, ws: dict, base_url: str, *, tools: bool,
                          quality: float) -> str:
    """Register provider + capabilities through the PRODUCT path."""
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
                        "supports_tools": tools,
                        "supports_vision": False,
                        "supports_reasoning": False,
                        "quality_score": quality,
                        "speed_score": 0.8,
                        "context_window": 8192})
    assert caps.status_code == 200, caps.text
    return provider_id


def _completion(service, ws: dict, prompt: str = "Reply with PONG") -> dict:
    return asyncio.run(service.generate_completion(
        messages=[{"role": "user", "content": prompt}],
        workspace_id=ws["workspace_id"], tenant_id=ws["tenant_id"]))


class TestSequentialIsolation:
    """Control row 1-4 of the work order: each workspace reaches ONLY
    its authorized endpoint, with ITS OWN capabilities."""

    def test_each_workspace_reaches_only_its_own_endpoint(
            self, scoped_world, world_app):
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a, _CountingEndpoint("B") as ep_b:
            ws_a = _authorized_workspace(world_app, scoped_world)
            ws_b = _authorized_workspace(world_app, scoped_world)
            prov_a = _register_local_route(
                world_app, ws_a, ep_a.base_url, tools=True, quality=0.9)
            # B's registration differs in CAPABILITY (no tools), not in
            # viability: quality stays above the simple-tier floor so a
            # plain turn must reach B's own endpoint.
            prov_b = _register_local_route(
                world_app, ws_b, ep_b.base_url, tools=False, quality=0.85)

            # Workspace A's turn — dispatch through the REAL service and
            # handler. The reply must come from endpoint A.
            svc_a = LLMService(workspace_id=ws_a["workspace_id"],
                               tenant_id=ws_a["tenant_id"])
            out_a = _completion(svc_a, ws_a)
            assert ep_a.hit_count >= 1, (
                "workspace A's request never reached endpoint A; "
                f"provider={out_a.get('provider')} model={out_a.get('model')} "
                f"content={str(out_a.get('content'))[:200]}")
            assert ep_b.hit_count == 0, (
                "workspace A's request LEAKED to workspace B's endpoint")
            assert out_a.get("content") == "pong-A", (
                f"endpoint identity mismatch: {out_a.get('content')!r}")
            assert str(out_a.get("provider") or "").startswith(
                f"local_{prov_a[:8]}"), (
                "the route must keep the registered provider identity "
                f"(local_{prov_a[:8]}), got {out_a.get('provider')!r}")

            # Workspace B's turn — same model name, different endpoint.
            svc_b = LLMService(workspace_id=ws_b["workspace_id"],
                               tenant_id=ws_b["tenant_id"])
            out_b = _completion(svc_b, ws_b)
            assert ep_b.hit_count >= 1, (
                "workspace B's request never reached endpoint B")
            assert out_b.get("content") == "pong-B", (
                f"endpoint identity mismatch: {out_b.get('content')!r}")

    def test_capability_association_follows_the_owning_workspace(
            self, scoped_world, world_app):
        """A registers shared-model WITH tools; B registers shared-model
        WITHOUT tools. A's handler must see A's registration, B's must
        see B's — the shared pricing cache must not collapse them."""
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a, _CountingEndpoint("B") as ep_b:
            ws_a = _authorized_workspace(world_app, scoped_world)
            ws_b = _authorized_workspace(world_app, scoped_world)
            prov_a = _register_local_route(world_app, ws_a, ep_a.base_url,
                                           tools=True, quality=0.9)
            prov_b = _register_local_route(world_app, ws_b, ep_b.base_url,
                                           tools=False, quality=0.85)

            # A tool-requiring task must rank workspace A's OWN
            # registration (supports_tools=True), never B's record of
            # the same model name.
            svc_a = LLMService(workspace_id=ws_a["workspace_id"],
                               tenant_id=ws_a["tenant_id"])
            handler_a = svc_a.handler
            own_key = f"local_{prov_a[:8]}"
            assert own_key in handler_a.clients, (
                "the workspace's registered client must load; clients="
                f"{sorted(handler_a.clients)}")
            ranked = handler_a.get_ranked_providers(
                handler_a.analyze_query_complexity("Reply with PONG"),
                requires_tools=True)
            ranked_pairs = [(p, m) for p, m in ranked]
            assert (own_key, MODEL_NAME) in ranked_pairs, (
                "the owning workspace's registered route must rank for a "
                f"tool task; ranked={ranked_pairs[:8]}")


class TestChatShapedScope:
    """The boundary the owner added: ``generate_completion`` accepts
    tenant_id, and the chat path calls it with tenant only. The handler
    it selects must still be the USER's workspace — tenant and workspace
    stay separate identifiers."""

    def test_tenant_only_dispatch_resolves_the_user_workspace(
            self, scoped_world, world_app):
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)

            # THE CHAT SHAPE: service built with tenant only; the call
            # passes tenant only (ChatOrchestrator.__init__ +
            # generate_completion(tenant_id=…) today).
            svc = LLMService(tenant_id=ws_a["tenant_id"])
            out = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply with PONG"}],
                tenant_id=ws_a["tenant_id"]))
            assert ep_a.hit_count >= 1, (
                "a tenant-scoped (chat-shaped) request never reached the "
                f"user's own endpoint; provider={out.get('provider')} "
                f"content={str(out.get('content'))[:200]}")
            assert out.get("content") == "pong-A"
            assert svc.handler.workspace_id == ws_a["workspace_id"], (
                "the selected handler must carry the user's workspace, "
                f"got {svc.handler.workspace_id!r}")


class TestDispatchControls:
    """The work order's production-dispatch controls (rows 2 and 4-9).
    Row 1 (sequential) and row 5 (ranking discovery) are covered in
    TestSequentialIsolation."""

    def test_concurrent_requests_do_not_contaminate(
            self, scoped_world, world_app):
        """A and B, concurrent requests: no handler or route
        contamination — each reply names its own endpoint."""
        import concurrent.futures

        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a, _CountingEndpoint("B") as ep_b:
            ws_a = _authorized_workspace(world_app, scoped_world)
            ws_b = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)
            _register_local_route(world_app, ws_b, ep_b.base_url,
                                  tools=False, quality=0.85)
            svc_a = LLMService(workspace_id=ws_a["workspace_id"],
                               tenant_id=ws_a["tenant_id"])
            svc_b = LLMService(workspace_id=ws_b["workspace_id"],
                               tenant_id=ws_b["tenant_id"])

            def _turn(service, ws):
                return asyncio.run(service.generate_completion(
                    messages=[{"role": "user", "content": "Reply PONG"}],
                    workspace_id=ws["workspace_id"],
                    tenant_id=ws["tenant_id"]))

            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
                futures = [ex.submit(_turn, svc_a, ws_a),
                           ex.submit(_turn, svc_b, ws_b),
                           ex.submit(_turn, svc_a, ws_a),
                           ex.submit(_turn, svc_b, ws_b)]
                outs = [f.result(timeout=90) for f in futures]

            contents = [str(o.get("content")) for o in outs]
            assert sum(c == "pong-A" for c in contents) == 2, (
                f"endpoint A identity corrupted under concurrency: "
                f"{contents}")
            assert sum(c == "pong-B" for c in contents) == 2, (
                f"endpoint B identity corrupted under concurrency: "
                f"{contents}")
            assert ep_a.hit_count >= 2 and ep_b.hit_count >= 2

    def test_capability_gap_is_truthful_per_workspace(
            self, scoped_world, world_app):
        """Same model, different capabilities: a tool-requiring ranking
        uses the CAPABLE authorized route (A) and truthfully refuses the
        incapable one (B) — each from its own registration record."""
        from core.llm.byok_handler import QueryComplexity
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a, _CountingEndpoint("B") as ep_b:
            ws_a = _authorized_workspace(world_app, scoped_world)
            ws_b = _authorized_workspace(world_app, scoped_world)
            prov_a = _register_local_route(world_app, ws_a, ep_a.base_url,
                                           tools=True, quality=0.9)
            prov_b = _register_local_route(world_app, ws_b, ep_b.base_url,
                                           tools=False, quality=0.85)

            ranked_a = LLMService(
                workspace_id=ws_a["workspace_id"],
                tenant_id=ws_a["tenant_id"]).handler
            ranked_b = LLMService(
                workspace_id=ws_b["workspace_id"],
                tenant_id=ws_b["tenant_id"]).handler
            tools_rank_a = ranked_a.get_ranked_providers(
                QueryComplexity.SIMPLE, requires_tools=True)
            tools_rank_b = ranked_b.get_ranked_providers(
                QueryComplexity.SIMPLE, requires_tools=True)
            assert (f"local_{prov_a[:8]}", MODEL_NAME) in [
                (p, m) for p, m in tools_rank_a], (
                f"A's capable route must rank for a tool task: "
                f"{[(p, m) for p, m in tools_rank_a][:6]}")
            assert (f"local_{prov_b[:8]}", MODEL_NAME) not in [
                (p, m) for p, m in tools_rank_b], (
                "B's registration says supports_tools=False — its route "
                "must NOT rank for a tool task")

    def test_updating_b_does_not_change_a(
            self, scoped_world, world_app):
        """Update B's registration: A's endpoint and capabilities remain
        unchanged (the shared cache entry is rewritten by B — A's own
        route record drives A's routing)."""
        from core.llm.byok_handler import QueryComplexity
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a, _CountingEndpoint("B") as ep_b:
            ws_a = _authorized_workspace(world_app, scoped_world)
            ws_b = _authorized_workspace(world_app, scoped_world)
            prov_a = _register_local_route(world_app, ws_a, ep_a.base_url,
                                           tools=True, quality=0.9)
            prov_b = _register_local_route(world_app, ws_b, ep_b.base_url,
                                           tools=False, quality=0.85)

            svc_a = LLMService(workspace_id=ws_a["workspace_id"],
                               tenant_id=ws_a["tenant_id"])
            out_before = _completion(svc_a, ws_a)
            assert out_before.get("content") == "pong-A"
            first_provider = str(svc_a.handler._last_used_provider)

            # B re-declares its model THROUGH THE PRODUCT: different
            # window and tools.
            headers = {"Authorization": f"Bearer {ws_b['token']}"}
            caps = world_app.post(
                f"/api/local-models/{prov_b}/capabilities", headers=headers,
                json={"model_id": MODEL_NAME, "supports_tools": True,
                      "supports_vision": True, "supports_reasoning": True,
                      "quality_score": 0.95, "speed_score": 0.8,
                      "context_window": 4096})
            assert caps.status_code == 200, caps.text

            # A's route is untouched: same endpoint identity, same
            # declared capability row.
            out_a = _completion(svc_a, ws_a)
            assert out_a.get("content") == "pong-A", (
                f"A's endpoint identity changed after B's update: "
                f"{out_a.get('content')!r}")
            assert str(out_a.get("provider")) == first_provider
            route_a = svc_a.handler._local_routes.get(MODEL_NAME)
            assert route_a["provider_key"] == f"local_{prov_a[:8]}"
            assert route_a["supports_tools"] is True
            assert route_a["context_window"] == 8192, (
                "A's declared context window must not adopt B's rewrite")

    def test_absolute_fallback_serves_a_registered_local_route(
            self, scoped_world, world_app):
        """Absolute fallback: a provider with NO static default entry —
        a dynamically registered local route — is eligible through its
        OWN registered model, and the dispatch lands on its endpoint."""
        from core.llm.byok_handler import QueryComplexity
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.85)
            svc = LLMService(workspace_id=ws_a["workspace_id"],
                             tenant_id=ws_a["tenant_id"])
            handler = svc.handler
            # An ADVANCED ask outruns the registration's declared quality
            # (85 < the 90 advanced floor), so BPC ranking returns no
            # candidate and get_optimal_provider walks the absolute
            # fallback — where the registered route must qualify WITHOUT
            # a static provider default.
            provider, model = handler.get_optimal_provider(
                QueryComplexity.ADVANCED)
            assert provider.startswith("local_") and model == MODEL_NAME, (
                "the absolute fallback must select the registered local "
                f"route, got {provider}/{model}")
            out = _completion(svc, ws_a)
            assert out.get("content") == "pong-A"
            assert ep_a.hit_count >= 1

    def test_no_configuration_is_truthful(self, scoped_world, world_app):
        """No configuration: a workspace with no registered provider and
        no keys gets a truthful no-provider result — nothing dispatched,
        nothing invented."""
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            svc = LLMService(workspace_id=ws_a["workspace_id"],
                             tenant_id=ws_a["tenant_id"])
            out = _completion(svc, ws_a)
            content = str(out.get("content") or "")
            assert ep_a.hit_count == 0, (
                "an unconfigured workspace must not dispatch anywhere")
            assert ("no api key" in content.lower()
                    or "no provider" in content.lower()
                    or "no eligible" in content.lower()
                    or "no dispatchable" in content.lower()), (
                f"the no-configuration result must be truthful, got "
                f"{content[:200]!r}")

    def test_configuration_without_qualifying_route_is_truthful(
            self, scoped_world, world_app):
        """Configuration exists but no route qualifies: a provider
        registered WITHOUT a capability record names no servable model —
        the result is a truthful no-eligible-route, never an invented
        model name."""
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            headers = {"Authorization": f"Bearer {ws_a['token']}"}
            reg = world_app.post("/api/local-models", headers=headers, json={
                "name": "bare-provider",
                "provider_type": "ollama",
                "base_url": ep_a.base_url})
            assert reg.status_code == 200, reg.text
            # NO capabilities declared — nothing defines a servable model.
            svc = LLMService(workspace_id=ws_a["workspace_id"],
                             tenant_id=ws_a["tenant_id"])
            out = _completion(svc, ws_a)
            content = str(out.get("content") or "")
            assert ep_a.hit_count == 0, (
                "a capability-less registration must not dispatch")
            assert ("no eligible" in content.lower()
                    or "no dispatchable" in content.lower()
                    or "not initialized" in content.lower()
                    or "no provider" in content.lower()), (
                f"the no-qualifying-route result must be truthful, got "
                f"{content[:200]!r}")
            assert MODEL_NAME not in content, (
                "no model may be invented into a route")

    def test_registration_and_identity_survive_restart(
            self, scoped_world, world_app):
        """Restart: a NEW LLMService (fresh handler, fresh DB load)
        against the same store rediscovers the registration and the
        same route identity serves again."""
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            prov_a = _register_local_route(world_app, ws_a, ep_a.base_url,
                                           tools=True, quality=0.9)
            first = _completion(
                LLMService(workspace_id=ws_a["workspace_id"],
                           tenant_id=ws_a["tenant_id"]), ws_a)
            assert first.get("content") == "pong-A"

            # THE RESTART: a brand-new service over the same persisted
            # registration (the process did not keep the old handler).
            reborn = LLMService(workspace_id=ws_a["workspace_id"],
                                tenant_id=ws_a["tenant_id"])
            second = _completion(reborn, ws_a)
            assert second.get("content") == "pong-A", (
                f"the route identity did not survive the restart: "
                f"{second.get('content')!r}")
            assert str(second.get("provider")).startswith(
                f"local_{prov_a[:8]}")
            assert ep_a.hit_count >= 2


class TestScopeResolutionFailures:
    """Owner correction 2026-10-12: an unresolved scope is NEVER
    substituted with another workspace. An explicitly named tenant with
    missing, ambiguous or failed resolution produces an explicit
    unresolved-scope result and ZERO provider calls — every negative
    here asserts the existing workspace's endpoint saw nothing."""

    def test_unknown_tenant_is_refused_without_calls(
            self, scoped_world, world_app):
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)
            svc = LLMService(workspace_id=ws_a["workspace_id"],
                             tenant_id=ws_a["tenant_id"])
            out = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=f"tenant-{uuid.uuid4().hex}"))
            assert out.get("success") is False, (
                "an unknown tenant must not fake success")
            assert out.get("provider") is None and \
                not (out.get("usage") or {}).get("total_tokens"), (
                "no provider was consulted")
            assert "unresolved" in str(out.get("content")).lower()
            assert ep_a.hit_count == 0, (
                "the existing workspace's endpoint must see ZERO calls "
                "from an unresolved tenant's dispatch")

    def test_lookup_failure_is_refused_and_not_cached(
            self, scoped_world, world_app, monkeypatch):
        from core import database as db_module
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)
            svc = LLMService(workspace_id=ws_a["workspace_id"],
                             tenant_id=ws_a["tenant_id"])

            def _broken_session():
                raise RuntimeError("database unavailable (simulated)")

            monkeypatch.setattr(db_module, "get_db_session",
                                _broken_session)
            out = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=f"tenant-{uuid.uuid4().hex}"))
            assert out.get("success") is False
            assert ep_a.hit_count == 0, (
                "a failed scope lookup must not dispatch to the existing "
                "workspace's endpoint")

    def test_multiple_workspaces_under_one_tenant_stay_unresolved(
            self, scoped_world, world_app):
        """A tenant binding MULTIPLE workspaces is ambiguous: tenant-only
        resolution refuses (registration creating one workspace does not
        establish that a tenant always has exactly one)."""
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a, _CountingEndpoint("B") as ep_b:
            ws_a = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)
            # A SECOND workspace under the SAME tenant (data-layer
            # setup: the ambiguity itself is what's under test).
            from core.models import Workspace

            db = scoped_world["Session"]()
            try:
                db.add(Workspace(id=str(uuid.uuid4()), name="Second",
                                 tenant_id=ws_a["tenant_id"]))
                db.commit()
            finally:
                db.close()

            # TENANT-ONLY: ambiguous -> refused, zero calls.
            svc = LLMService(tenant_id=ws_a["tenant_id"])
            assert svc.scope_is_unresolved(), (
                "a multi-workspace tenant is ambiguous for tenant-only "
                "resolution")
            out = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=ws_a["tenant_id"]))
            assert out.get("success") is False
            assert ep_a.hit_count == 0 and ep_b.hit_count == 0, (
                "an ambiguous tenant must not reach EITHER endpoint")

            # EXPLICIT AUTHENTICATED WORKSPACE selection under the same
            # ambiguous tenant still routes to ITS OWN endpoint.
            explicit = LLMService(workspace_id=ws_a["workspace_id"],
                                  tenant_id=ws_a["tenant_id"])
            out_a = asyncio.run(explicit.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                workspace_id=ws_a["workspace_id"],
                tenant_id=ws_a["tenant_id"]))
            assert out_a.get("content") == "pong-A", (
                "explicit workspace selection routes to its own endpoint "
                f"(got {out_a.get('content')!r})")
            assert ep_b.hit_count == 0

    def test_service_recovers_after_binding_repair(
            self, scoped_world, world_app):
        """Item 3: a failed/missing resolution must not leave the
        long-lived service stuck. After the workspace binding is
        repaired, the SAME service instance resolves its own scope and
        dispatches to the recovered workspace's endpoint."""
        from core.llm_service import LLMService
        from core.models import Workspace

        with _CountingEndpoint("A") as ep_a:
            ws_c = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_c, ep_a.base_url,
                                  tools=True, quality=0.9)
            # BREAK the binding (the workspace row disappears).
            db = scoped_world["Session"]()
            try:
                bound = (db.query(Workspace)
                         .filter(Workspace.id == ws_c["workspace_id"])
                         .first())
                assert bound is not None
                db.delete(bound)
                db.commit()
            finally:
                db.close()

            svc = LLMService(tenant_id=ws_c["tenant_id"])
            assert svc.scope_is_unresolved(), (
                "a missing binding leaves the service unresolved")
            out = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=ws_c["tenant_id"]))
            assert out.get("success") is False and ep_a.hit_count == 0

            # REPAIR the binding — the SAME workspace row returns.
            db = scoped_world["Session"]()
            try:
                db.add(Workspace(id=ws_c["workspace_id"], name="Default",
                                 tenant_id=ws_c["tenant_id"]))
                db.commit()
            finally:
                db.close()

            # The SAME (long-lived) service instance: the next dispatch
            # adopts the repaired binding — never stuck on the failure.
            out2 = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=ws_c["tenant_id"]))
            assert out2.get("content") == "pong-A", (
                f"the service must recover after the binding repair, got "
                f"{out2.get('content')!r}")
            assert not svc.scope_is_unresolved()
            assert ep_a.hit_count == 1

    def test_revoked_binding_never_serves_from_the_stale_resolution(
            self, scoped_world, world_app):
        """Verifier finding P3 on 316317f3b: a POSITIVE resolution must
        not outlive its binding. After the tenant's workspace is
        revoked, the SAME long-lived service refuses — zero calls to
        the revoked workspace's endpoint."""
        from core.llm_service import LLMService
        from core.models import Workspace

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)
            svc = LLMService(tenant_id=ws_a["tenant_id"])
            out = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=ws_a["tenant_id"]))
            assert out.get("content") == "pong-A", (
                "the resolved route serves before the revocation")
            assert ep_a.hit_count == 1

            # REVOKE: the tenant's binding is removed.
            db = scoped_world["Session"]()
            try:
                bound = (db.query(Workspace)
                         .filter(Workspace.id == ws_a["workspace_id"])
                         .first())
                db.delete(bound)
                db.commit()
            finally:
                db.close()

            out2 = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=ws_a["tenant_id"]))
            assert out2.get("success") is False, (
                "a revoked binding must not serve from the stale "
                f"resolution: {out2.get('content')!r}")
            assert out2.get("unresolved_scope"), (
                "the refusal names the unresolved scope")
            assert ep_a.hit_count == 1, (
                "ZERO calls to the revoked workspace's endpoint after "
                "the binding was removed")

    def test_changed_binding_routes_to_the_new_workspace(
            self, scoped_world, world_app):
        """Verifier finding P3 on 316317f3b: a binding CHANGED to a
        different workspace must not serve the old endpoint — the same
        long-lived service adopts the new scope and its handler is
        rebuilt for it."""
        from core.llm_service import LLMService
        from core.models import Workspace

        with _CountingEndpoint("A") as ep_a, _CountingEndpoint("B") as ep_b:
            ws_a = _authorized_workspace(world_app, scoped_world)
            ws_b = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)
            _register_local_route(world_app, ws_b, ep_b.base_url,
                                  tools=False, quality=0.85)
            svc = LLMService(tenant_id=ws_a["tenant_id"])
            out = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=ws_a["tenant_id"]))
            assert out.get("content") == "pong-A"

            # CHANGED: ws_a's binding is replaced by ws_b under the
            # SAME tenant (ws_a's row deleted, ws_b re-bound).
            db = scoped_world["Session"]()
            try:
                db.query(Workspace).filter(
                    Workspace.id == ws_a["workspace_id"]).delete()
                bound_b = (db.query(Workspace)
                           .filter(Workspace.id == ws_b["workspace_id"])
                           .first())
                bound_b.tenant_id = ws_a["tenant_id"]
                db.commit()
            finally:
                db.close()

            out2 = asyncio.run(svc.generate_completion(
                messages=[{"role": "user", "content": "Reply PONG"}],
                tenant_id=ws_a["tenant_id"]))
            assert out2.get("content") == "pong-B", (
                f"the changed binding must route to the NEW workspace's "
                f"endpoint, got {out2.get('content')!r}")
            assert ep_a.hit_count == 1, (
                "ZERO calls to the old workspace's endpoint after the "
                "binding changed")
            assert ep_b.hit_count >= 1
            assert svc.handler.workspace_id == ws_b["workspace_id"], (
                "the shared handler was rebuilt for the adopted scope")

    def test_scope_adoption_never_hands_out_the_stale_handler(
            self, scoped_world, world_app, monkeypatch):
        """Agent 3 finding 1 on d6fbcd846: adoption swapped the service
        workspace BEFORE the (slow) handler rebuild, so a concurrent
        reader paired the NEW scope with the OLD handler and dispatched
        to the old endpoint. Selection is serialized: a reader entering
        during an adoption blocks, then sees the adopted handler —
        never the stale one."""
        from core import llm_service as lsm
        from core.llm_service import LLMService
        from core.models import Workspace

        with _CountingEndpoint("A") as ep_a, _CountingEndpoint("B") as ep_b:
            ws_a = _authorized_workspace(world_app, scoped_world)
            ws_b = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)
            _register_local_route(world_app, ws_b, ep_b.base_url,
                                  tools=False, quality=0.85)
            # A lightweight stand-in replaces BYOKHandler for this
            # whole test BEFORE any construction — the defect is the
            # SERVICE-level pairing of (workspace, handler), and a real
            # handler's held DB session deadlocks the single-connection
            # in-memory fixture under threads. The constructor's first
            # scope resolution (W1) and every later adoption therefore
            # build stand-ins, and construction is SLOW to widen the
            # mid-swap window a concurrent reader would (unlocked) trip.
            class _SlowStandIn:
                def __init__(self, workspace_id=None, tenant_id=None,
                             db_session=None):
                    time.sleep(0.2)
                    self.workspace_id = workspace_id
                    self.tenant_id = tenant_id
                    self.clients = {}

            monkeypatch.setattr(lsm, "BYOKHandler", _SlowStandIn)
            svc = LLMService(tenant_id=ws_a["tenant_id"])
            first = svc._get_handler(tenant_id=ws_a["tenant_id"])
            assert first.workspace_id == ws_a["workspace_id"]

            # CHANGED binding: ws_a revoked, ws_b re-bound to the tenant.
            db = scoped_world["Session"]()
            try:
                db.query(Workspace).filter(
                    Workspace.id == ws_a["workspace_id"]).delete()
                bound_b = (db.query(Workspace)
                           .filter(Workspace.id == ws_b["workspace_id"])
                           .first())
                bound_b.tenant_id = ws_a["tenant_id"]
                db.commit()
            finally:
                db.close()

            adopted_box = {}

            def _adopting_reader():
                adopted_box["handler"] = svc._get_handler(
                    tenant_id=ws_a["tenant_id"])

            adopter = threading.Thread(target=_adopting_reader)
            adopter.start()
            time.sleep(0.05)          # the adopter is inside construction
            concurrent = svc._get_handler(tenant_id=ws_a["tenant_id"])
            adopter.join(timeout=10)

            new_ws = ws_b["workspace_id"]
            assert concurrent.workspace_id == new_ws, (
                "a reader entering mid-adoption must receive the ADOPTED "
                f"handler, got the handler for "
                f"{concurrent.workspace_id}")
            assert adopted_box["handler"].workspace_id == new_ws
            # and the shared state is coherent afterwards
            after = svc._get_handler(tenant_id=ws_a["tenant_id"])
            assert after.workspace_id == new_ws and after is concurrent

    def test_cold_pricing_refresh_never_hides_the_registered_route(
            self, scoped_world, world_app, monkeypatch):
        """Agent 3 finding 2 on d6fbcd846: on a cold pricing cache the
        auto-refresh REPLACES the public cache dict before the first
        ranking, dropping the just-stamped registration route — the
        fresh user got a false 'No eligible LLM providers' (8/8 cold).
        The route's availability is independent of public cache
        replacement: the very first dispatch reaches its endpoint."""
        from core.dynamic_pricing_fetcher import get_pricing_fetcher
        from core.llm_service import LLMService

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)
            svc = LLMService(workspace_id=ws_a["workspace_id"],
                             tenant_id=ws_a["tenant_id"])
            assert svc.handler._local_routes, "the registration loaded"

            # FORCE the public-cache replacement a cold start performs:
            # cache invalid -> the ranking initializer refreshes and
            # REBINDS pricing_cache from its sources (offline stubs; the
            # rebind itself is the mechanism under test).
            fetcher = get_pricing_fetcher()

            async def _empty():
                return {}

            monkeypatch.setattr(fetcher, "fetch_litellm_pricing", _empty)
            monkeypatch.setattr(fetcher, "fetch_openrouter_pricing",
                                _empty)
            monkeypatch.setattr(fetcher, "fetch_opencode_pricing", _empty)
            fetcher.last_fetch = None
            fetcher.pricing_cache = {}

            # THE FRESH-USER SHAPE: first dispatch in the process.
            out = _completion(svc, ws_a)
            assert out.get("content") == "pong-A", (
                "the first dispatch must reach the registered route even "
                f"when the pricing refresh replaced the public cache; "
                f"got {str(out.get('content'))[:160]!r}")
            assert ep_a.hit_count == 1


class TestChatPublicRouteScope:
    """The PUBLIC-ROUTE user boundary (pristine-J2 first-request failure,
    2026-10-12): the chat orchestrator singleton is constructed
    default-scoped at import, and the reply dispatch rode that scope —
    a fresh user's own registered provider was invisible ("No eligible
    LLM providers found for your current plan") even though the rows
    were durably theirs. The counted first authenticated chat message
    must dispatch in the REQUEST's scope and reach the user's own
    endpoint."""

    def test_first_chat_message_dispatches_in_the_user_scope(
            self, scoped_world, world_app):
        import asyncio
        import json
        from contextlib import ExitStack
        from unittest.mock import AsyncMock, MagicMock, patch

        import integrations.chat_orchestrator as co
        from core.llm_service import LLMService
        from core.chat_tool_planner import ToolPlan

        with _CountingEndpoint("A") as ep_a:
            ws_a = _authorized_workspace(world_app, scoped_world)
            _register_local_route(world_app, ws_a, ep_a.base_url,
                                  tools=True, quality=0.9)

            # THE PUBLIC-ROUTE SHAPE: a default-scoped orchestrator
            # singleton with the default-scoped service — exactly what
            # the module-level construction produces at import.
            orch = co.ChatOrchestrator.__new__(co.ChatOrchestrator)
            orch.tenant_id = "default"
            orch._cancelled_sessions = set()
            orch._budget_exceeded_runs = set()
            orch.llm_service = LLMService(tenant_id="default")

            session = {"id": "sess-scope", "history": []}

            async def _plan_ce(*a, **k):
                class _P:
                    wants_edit = False
                return _P()

            no_tool_plan = ToolPlan(use_tool=False, service="datasets",
                                    intent="search", query="unused",
                                    reason="no tool for a plain reply")

            with ExitStack() as st:
                for cm in [
                    patch.object(orch, "_get_or_create_session",
                                 return_value=session),
                    patch.object(orch, "_resolve_canvas_ctx",
                                 new=AsyncMock(return_value=dict({
                                     "canvas_id": "cv-scope",
                                     "canvas_type": "email",
                                     "title": "Scope",
                                     "content": {"body": "<p>quote table</p>"}}))),
                    patch.object(orch, "_start_chat_execution",
                                 return_value="exec-scope"),
                    patch.object(orch, "_record_chat_step", new=AsyncMock()),
                    patch.object(orch, "_emit_agent_status",
                                 new=AsyncMock()),
                    patch.object(orch, "_update_session",
                                 new=MagicMock()),
                    patch.object(orch, "_finish_chat_execution",
                                 new=MagicMock()),
                    patch.object(orch, "_load_conversation_mail_handles",
                                 return_value=([], [])),
                    patch.object(orch, "_route_to_features",
                                 new=AsyncMock(return_value={})),
                    patch("core.chat_tool_planner.plan_tool_use",
                          new=AsyncMock(return_value=no_tool_plan)),
                    patch("core.chat_tool_planner.execute_tool_plan",
                          new=AsyncMock(return_value="")),
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
                    patch("integrations.chat_orchestrator."
                          "_task_lifecycle_for",
                          return_value=None),
                ]:
                    st.enter_context(cm)
                out = asyncio.run(orch.process_chat_message(
                    ws_a["user_id"],
                    "What are the approved prices and delivery times "
                    "for rows 1 through 5 of the draft?",
                    "sess-scope",
                    context={"workspace_id": ws_a["workspace_id"],
                             "canvas": dict({
                                 "canvas_id": "cv-scope",
                                 "canvas_type": "email",
                                 "title": "Supplier quote",
                                 "content": {"body":
                                             "<p>quote table</p>"}}),
                             "agent_id": "agent-scope"}))

            # ONE counted USER request; internal same-request fallbacks
            # (streaming attempt -> non-streaming) may add HTTP calls to
            # the SAME endpoint — that is one user request served.
            assert ep_a.hit_count >= 1, (
                "the counted FIRST authenticated chat message must reach "
                f"the user's own registered endpoint; got {ep_a.hit_count} "
                f"calls; response={json.dumps(out, default=str)[:300]}")
            assert out.get("message") == "pong-A", (
                "the reply must come from the user's own provider: "
                f"{json.dumps(out, default=str)[:300]}")
