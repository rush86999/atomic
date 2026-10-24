# Scope-repair successor + declared next-attempt configuration (2026-10-18)

Owner instruction: freeze the approved pin-gate scope repair as a
successor to the no-op candidate; keep the Go endpoint change confined
to the scratch acceptance configuration. No pilot deployment, no broad
endpoint migration, no no-op logic changes.

## Successor (scope repair only)

- **Commit `aaa1169d7dc1a2e511bce9b81c33ee85f58982eb`** on branch
  `codex/reask-current-artifact` (candidate worktree
  `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/
  reask-current-artifact`). Parent **`b96dec60a`** — the approved no-op
  candidate is NOT amended; the two repairs stay distinguishable.
- Files (6): `backend/core/llm/pinned_planning.py`,
  `backend/core/chat_canvas_editor.py`,
  `backend/core/knowledge_extractor.py`,
  `backend/core/sheet_dataset_service.py`,
  `backend/tests/test_pinned_planning_scope.py` (new),
  `backend/tests/test_pinned_planning_transport.py` (new). Tree clean.
- Source hashes: `pinned_planning.py` b58ab3a690f2…;
  `chat_canvas_editor.py` 5f724ceb645c…; scope tests 6cd4f3396013….
- Repair: `build_provider_model_pin` / `resolve_pinned_provider_model`
  gain keyword-only `workspace_id`/`tenant_id` and resolve the SAME
  scoped handler the dispatch uses; no-scope callers keep legacy
  behavior; unresolved named scope refuses; constructor scope never
  mutated. `_plan_structured` passes the turn scope; knowledge_extractor
  passes its workspace; sheet-SQL audited (no request scope at its seam,
  documented in place).
- Tests: 11 new, all green —
  scope: startup-lacks/workspace-has retained; startup-has/workspace-lacks
  refused; two overlapping workspaces keep their scopes; unresolved scope
  cannot borrow; local-only still blocks cloud pins; unpinned fallback
  unchanged; resolver scope threading; gate receives the turn scope.
  transport: constructed-client Go URL + `atom-agent/1.0` +
  `x-opencode-session: atom-<workspace>`; pinned dispatch reaches
  `/inference/go/openai/v1/chat/completions` with `deepseek-v4-pro`;
  failed-pin fallback excludes the pin, dispatches a different model,
  returns None — no disguised success.
- Regression battery (10 files): 302 passed / 3 failed — the same three
  pre-existing failures verified identical on a pristine `b96dec60a`
  worktree (TestEditPlanRungKnob `2000 == 14000` clamp;
  fallback_honesty `test_satisfied_requirement_completes`).
  `test_chat_canvas_editor.py`: 14 failures, set identical to baseline.

## Declared configuration for the next (one) served attempt

Confined to the scratch acceptance configuration — no product code:

```text
candidate:                 aaa1169d7dc1a2e511bce9b81c33ee85f58982eb
OPENCODE_BASE_URL:         https://opencode.ai/inference/go/openai/v1
ATOM_ASYNC_EDIT_PLAN_MODEL: opencode-go/deepseek-v4-pro
CHAT_FINALIZATION_M1:      1   (same as pilot)
CHAT_FINALIZATION_M2:      1   (same as pilot)
ATOM_TASK_LIFECYCLE_ENABLED: 1 (same as pilot)
interpreter:               /Users/rushiparikh/projects/atom/backend/venv314/bin/python
isolation:                 fresh port, scratch DB/stores only,
                           one authorized opencode-go credential registered
                           through the product; no .env/vault wholesale;
                           pilot untouched
```

Required before that attempt (owner, per section 3 of the guidance):
authenticated console check — correct subscribed workspace, active Go
plan, DeepSeek V4 Pro availability and remaining allowance.
No funding or extra-usage activation is required by this instruction.

## Non-goals held

- No L1 promotion; L1 remains unverified until the served pass.
- No pilot deployment; no change to `:8001`/`:3000`.
- No global OpenCode endpoint migration (models use different protocols;
  catalogue/pricing code still reflects Zen — separately recorded).
- No no-op repair changes.
