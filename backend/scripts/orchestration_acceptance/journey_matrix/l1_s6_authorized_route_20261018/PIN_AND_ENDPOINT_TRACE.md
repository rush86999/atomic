# L1/S6 authorized-route attempt 7 — pin + endpoint trace (2026-10-18)

Investigation only, per owner guidance: verify the Go endpoint and trace
why the declared pin did not reach dispatch **before another acceptance
attempt**. No provider funded; no change to the no-op repair; the frozen
candidate `b96dec60a` is untouched; no acceptance attempt was re-run.

## What attempt 7 did (committed evidence, `bfb4898b8`)

- Unchanged candidate `b96dec60a` served in isolation; credential
  registration `POST /api/ai/providers/opencode-go/keys` → 200.
- Harness declared `ATOM_ASYNC_EDIT_PLAN_MODEL=opencode-go/deepseek-v4-pro`
  (`attempt7_config.json`, `run_authorized_preview.py:122`; the process
  env is used for the server Popen, line 237).
- Actual dispatch: `opencode-go/qwen3.8-flash`, **unpinned** BPC ranking →
  `POST https://opencode.ai/zen/v1/chat/completions` → **402
  "Insufficient account funds"**. Zero canvas writes; body unchanged.

## Trace 1 — why the declared pin did not reach dispatch

**The pin gate resolves a different handler scope than the dispatch.**

1. `_plan_structured` (candidate `chat_canvas_editor.py`, lines 462-466)
   reads the env pin and calls
   `build_provider_model_pin(llm_service, "opencode-go", "deepseek-v4-pro")`.
2. `build_provider_model_pin` (`core/llm/pinned_planning.py:76-100`)
   returns the pin ONLY when
   `provider in llm_service._get_handler().clients` — note the
   **no-argument** `_get_handler()`.
3. The orchestrator's `LLMService` is constructed at app startup with
   **tenant `default`** — log line 297:
   `ChatOrchestrator initialized with LLMService for tenant: default`.
   Its handler ran `_initialize_clients()` in `BYOKHandler.__init__`
   (`byok_handler.py:1507`) at construction, before the attempt's BYOK
   registration existed. Its `clients` therefore lacks `opencode-go`.
4. The DISPATCH uses the turn's scope:
   `plan_canvas_edit(..., workspace_id=resolve_user_workspace(user_id),
   tenant_id=self.tenant_id, ...)` (`chat_orchestrator.py:27583-27590`),
   forwarded by `_plan_structured` to `pinned_structured_call`
   (`workspace_id`/`tenant_id`), which resolves
   `_get_handler(workspace_id=<user ws>, tenant_id=<turn tenant>)` — a
   NEW scoped handler (cached in `_scoped_handlers`), constructed AFTER
   the BYOK key was stored, so its `_initialize_clients()` DID create the
   client: log `Initialized opencode-go client using BYOK credential` (4×).
5. The gate returned `{}` **silently**: `pinned_structured_call` receives
   no `provider_model`, so no pinned call is attempted and no handler-side
   unpin warning can fire. This matches the log exactly: no
   `canvas edit planning pinned call` line, no `Unpinning …` warning,
   while the unpinned BPC ranking sees the provider (catalogue fetched,
   BPC ranked `qwen3.8-flash`).

This is the same class the J6 comment in `_plan_structured` already fixed
for the CALL ("the frozen constructor scope never sees the
workspace-registered local provider"); the GATE was not given the scope.

### Proposed minimal fix (not applied)

- `build_provider_model_pin(llm_service, provider, model, *,
  workspace_id=None, tenant_id=None)` → use
  `llm_service._get_handler(workspace_id=..., tenant_id=...)` for the
  membership check.
- Pass the already-available scope ids at the `_plan_structured` call
  site. `resolve_pinned_provider_model` callers have the same gap; worth
  auditing together.
- This is provider plumbing, NOT the no-op repair; applying it would
  change the runtime beyond `b96dec60a` (new successor/patch decision).

## Trace 2 — the Go endpoint (verified against the official docs + live probes)

Official docs (fetched): `https://opencode.ai/v2/docs/console/go/#endpoints`

| Fact | Evidence |
|---|---|
| Go models endpoint | `GET https://opencode.ai/inference/go/v1/models` → **200**, 37 ids, incl. `deepseek-v4-pro` (the intended pin model) |
| DeepSeek V4 Pro chat | `https://opencode.ai/inference/go/openai/v1/chat/completions` (OpenAI-compatible) |
| Go endpoint session requirement | unauthenticated probe → **400 `MissingSessionID`**: “Request is missing x-opencode-session” (docs: clients should send it + a custom user-agent) |
| Atom's configured base | `https://opencode.ai/zen/v1` (`byok_handler.py:3080`, `OPENCODE_BASE_URL`; stored in `byok_config.json`; `settings_catalog.py:114`) |
| Zen gateway identity | `GET /zen/v1/models` → **200**, 85 ids (big-pickle, beam-free, claude-opus-5\*…), a DIFFERENT catalogue from Go's 37; `POST /zen/v1/chat/completions` reachable (401 without key) |
| Attempt 7 call | `POST https://opencode.ai/zen/v1/chat/completions` → 402 `Insufficient account funds` |

Interpretation (consistent with the owner's caution — not A/B-proven):
Atom called the **Zen balance gateway**, not the Go subscription
endpoint; the 402 is Zen's balance response. Atom's handler already adds
`x-opencode-session: atom-<workspace>` for `opencode-go`/`opencode`
(`byok_handler.py` ~3240), so the Go endpoint session requirement is
already satisfied by the client code. Notes:
- Per-model Go endpoints differ: `qwen3.8-flash` is served on the
  **Anthropic-style** `…/inference/go/anthropic/v1/messages`; the
  OpenAI-compatible base can only serve the OpenAI-family Go models
  (`deepseek-v4-pro` is one). Pinning DeepSeek V4 Pro therefore pairs
  with the Go OpenAI-compatible endpoint.
- Catalogue/pricing fetchers (`core/llm/opencode_catalog.py`,
  `core/dynamic_pricing_fetcher.py`) read `/zen/v1/models`; a base-URL
  migration decision must include them (separate slice).
- Operator billing state on the Go plan is worth checking in the
  OpenCode console; per owner guidance, do not fund anything.

## Decision requested before the next acceptance attempt

1. Approve the pin-gate scope fix (new patch/successor) so the declared
   pin actually dispatches.
2. Approve the Go base URL for the opencode-go provider used by the
   attempt (`https://opencode.ai/inference/go/openai/v1`), with the
   already-present session header and a documented user-agent (verify
   Atom's UA).
3. Confirm the Go plan/billing state (no funding implied).

No L1 implementation change is warranted by this result; L1 stays held.
