# L1/S6 served-preview verification attempts — b96dec60a (2026-10-18)

**What this is.** The preserved record of the acceptance owner's served-preview
work order on the frozen candidate `b96dec60a`: launch the unchanged
candidate in an isolated scratch preview, exercise the ORIGINAL S6 request
through authenticated HTTP with a real planning configuration (no forced
decline), inspect the complete result, and preserve every attempt.

**Result: the served path was exercised end-to-end; the S6 no-op could not
complete in any attempt because NO usable real planning route exists under
the declared no-vault configuration. L1 remains held (not promoted).**

## Frozen candidate (unchanged; verified at runtime)

- Commit **`b96dec60a46dea72af73fd1cdcd4a7a1ff94fe01`**, branch
  `codex/reask-current-artifact`, tree clean; `chat_canvas_editor.py`
  sha256 `e08f99b43a0ee3fb2c366ab9e2086150b20b281d5a6c6a6be127f1d5c9cedd0c`.
- Runtime identity from the served process in EVERY attempt
  (`/api/health`): cwd = the candidate worktree's `backend/`,
  `git_commit=b96dec60a46d`, `dirty=false`.

## Isolation (every attempt)

- Fresh port `:8093`; frontend none (API-only).
- Interpreter: `/Users/rushiparikh/projects/atom/backend/venv314/bin/python`
  (absolute path; Python 3.14.7; `pip freeze` captured per attempt).
- cwd = candidate `backend/` (candidate code resolves from the export).
- Writable stores isolated to the fresh scratch dir: `DATABASE_URL`,
  `ATOM_DATA_DIR`, `LANCEDB_URI`, `BYOK_CONFIG_FILE`, `BYOK_KEYS_FILE`.
- No live `.env`/vault copied wholesale; no pilot restart; `:8001/:3000`
  untouched; live dev DB sha256+mtime verified unchanged after every attempt.
- Flags declared and IDENTICAL to the pilot's effective config
  (`backend/.env`): `CHAT_FINALIZATION_M1=1`, `CHAT_FINALIZATION_M2=1`,
  `ATOM_TASK_LIFECYCLE_ENABLED=1`.

## The owner's assertions, as far as the served path reached

| Assertion | Status | Evidence |
|---|---|---|
| Zero additional canvas writes | **PASS in all attempts** | `canvas_audit` count unchanged; body unchanged with `Terms: Net 45` |
| Current body unchanged | **PASS in all attempts** | GET readback identical |
| Existing no-op receipt produced | **NOT REACHED** | no planner result → the served decline branch never ran |
| Receipt-derived confirmation | **NOT REACHED** | settled message is the continuation failure text |
| `success=true`, completed outcome | **NOT REACHED** | turn unconfirmed → continuation `failed` (3 tries) |
| Persisted execution/message + fresh history agree | **PASS in all attempts** | persisted `outcome`/`success` == history reload for the settled (unconfirmed/failed) state |
| Planner NOT forced to decline | **HELD** | no seam, stub, or prompt change; only real provider dispatch |

## Attempts (all preserved; no mid-attempt changes)

| # | Declared planning config | First-failure classification | Exact cause (log) |
|---|---|---|---|
| 1 | Placeholder OpenAI-compatible key only | `provider_unconfigured_placeholder` | BPC selected `openai/gradient_ai/openai-gpt-4o`; `401 Incorrect API key provided: local-ol…cret` |
| 2 | Placeholder + intended deepseek pin (operator env value EMPTY → pin never set) | `planning_credential_empty_env_value` | same 401 pool; no deepseek client existed |
| 3 | Placeholder removed; Ollama activated THROUGH THE PRODUCT (`POST /api/ai/providers/ollama/keys`, status active) | `local_model_below_planning_quality_floor` | `BPC cost-priority: NO candidate clears quality floor 85 (task_type=planning)` — local profile is below the planner's floor by design |
| 4 | Deepseek registration via product (operator env value EMPTY → store skipped; provider `inactive`) + Ollama active | `planning_credential_empty_env_value` | same quality-floor boundary; no planning candidates |
| 5 | `OPENROUTER_API_KEY` (the only non-empty operator env credential) + pin `openrouter/deepseek/deepseek-v4-pro` | `provider_credits_exhausted` | pinned call DISPATCHED → `402 … you requested up to 2000 tokens, but can only afford 0` |
| 6 | Same key + pin `openrouter/google/gemma-4-31b-it:free` | `provider_rate_limited` | pinned call DISPATCHED → `429 … temporarily rate-limited upstream` |

Common observed shape (attempts 1–6): the interactive leg forked to the
designed async continuation ("I'm still applying that edit in the
background…"); the continuation ran 3 attempts and settled `failed`
("I couldn't apply your update…"); zero canvas writes; body intact;
persisted row and history agreement held throughout.

## What this proves and what it does not

- **Proved:** the served product path (HTTP auth → canvas seed → chat →
  edit lane → async continuation → durable settlement → history reload) runs
  the unchanged candidate, isolated, with the pilot untouched, and never
  performed a canvas write.
- **Not proved:** the L1 claim itself — a completed served no-op with the
  receipt-derived confirmation — because no real planning route is callable
  under the declared constraints.

## Blocking decision (owner)

The pilot's working planning route is the **vault** (`opencode-go`,
`deepseek-v4-pro`), which the work order excludes copying. The local profile
cannot clear the planner quality floor, and the only non-vault env
credential (OpenRouter) has **0 credits** (paid) and free models are
upstream rate-limited. To finish the served verification, provide one of:

1. explicit authorization to register ONE vaulted route (e.g. `opencode-go`)
   in the isolated preview, or
2. OpenRouter credits (or another funded key), or
3. any other declared real planning route that clears the floor.

Then the served run can complete and, only if green, record:
"L1 verified through served API on `b96dec60a`, configuration X" — which
still does not mean deployment to the pilot.
