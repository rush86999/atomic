# L1/S6 served verification on the scope-repair successor (2026-10-18)

**What this is.** The served-API verification of the idempotent re-ask
(L1) on successor **`aaa1169d7`** (pin-gate scope repair; parent
`b96dec60a` — the approved no-op candidate, unchanged) in the declared,
isolated scratch configuration. This is the evidence behind matrix
rev 11 and the amended L1 bullet in the support statement.

**Scope of the claim.** L1 is verified **through the served API on
`aaa1169d7` + the configuration below**. This is NOT pilot deployment:
the pilot (`:8001`, serving `8c593e57031e`) does not include the fix, and
row 43's exclusions are unchanged until integration + re-verification
there. No funding and no extra-usage activation were performed.

## Frozen configuration (declared before the attempt)

```text
candidate:                  aaa1169d7dc1a2e511bce9b81c33ee85f58982eb
OPENCODE_BASE_URL:          https://opencode.ai/inference/go/openai/v1
ATOM_ASYNC_EDIT_PLAN_MODEL: opencode-go/deepseek-v4-pro
CHAT_FINALIZATION_M1/M2:    1 (same as pilot)
ATOM_TASK_LIFECYCLE_ENABLED: 1 (same as pilot)
interpreter:                /Users/rushiparikh/projects/atom/backend/venv314/bin/python
isolation:                  scratch DB/LanceDB/BYOK stores; fresh port;
                            ONE authorized operator credential registered
                            through the scratch product API (value never
                            logged or recorded); pilot untouched
```

Runtime identity from the served process: cwd = the candidate worktree
backend, `git_commit=aaa1169d7dc1`, `dirty=false`.

## Runs (both preserved)

1. **Run 1 — aborted evidence assembly.** The served turn itself
   completed (pin dispatched to the Go endpoint; first POST was rejected
   with "Thinking mode does not support this tool_choice", the handler
   retried ONCE in JSON mode and memoized the pair; 200 in 5.9 s; planner
   served decline; assistant row `outcome=completed`, `success=true`).
   The driver aborted afterwards on a missing `import re` in its
   evidence assembly. Preserved as `run1_aborted_driver_*`.
2. **Run 2 — clean attempt (this record).** Same configuration; the pin
   dispatched `opencode-go/deepseek-v4-pro` to the Go endpoint on
   attempt 1 (200 OK, 10.1 s), planner declined, and the full evidence
   was assembled. The verdict was then **re-scored deterministically**
   from the same raw evidence after fixing the scoring path: the route
   carries the lane receipt under `response.metadata.canvas_edit` (the
   first pass read `response.data.canvas_edit`). `attempt8_result.json`
   (raw) and `attempt8_result_rescored.json` (corrected scoring; no new
   request) are both preserved.

## The original S6 request — observed

Request: `Please also update the payment terms in the draft to Net 45.`
over a served draft carrying `Terms: Net 45` (created through the
product API).

| Check | Result |
|---|---|
| Structured no-op receipt | `metadata.canvas_edit.noop=true`, `noop_reason="already_satisfied"`, `background_started=false`, `persistence.status="persisted"` |
| Receipt-derived reply | "Verified on the current draft: payment terms in the draft already set to Net 45. No changes were needed, and nothing was sent." |
| Zero added writes | canvas_audit count unchanged; body unchanged and still holds `Terms: Net 45` |
| Completed response | `outcome=completed`, `success=true` |
| Fresh history reload | served explicit **non-null** `outcome=completed`/`success=true`, agreeing with the persisted assistant row (no null==null shortcut) |
| Intended vs actual | intended `opencode-go/deepseek-v4-pro` on the Go endpoint; actual dispatch models: `opencode-go/deepseek-v4-pro` only; `go_chat_posts=1`, `zen_chat_posts=0`; no unpinned fallback |

## Recorded discrepancies / follow-ups (not blockers)

- The Go base URL's own `/models` discovery path 404s
  (`.../inference/go/openai/v1/models`); the documented models endpoint
  is `https://opencode.ai/inference/go/v1/models`. Catalogue discovery
  stays "unknown" (never assumed) and the pin bypasses ranking, so the
  attempt dispatched correctly. A future integration should point
  catalogue/pricing discovery at the documented models endpoint; no
  global migration is implied here.
- Run 1 showed the Go DeepSeek route rejects instructor `tool_choice` in
  thinking mode; the handler's JSON-mode retry + memo handles it (run 2
  dispatched cleanly). Recorded for the transport notes.

## Files

- `run_successor_served.py` — the attempt runner (attempt-7 harness
  adapted for the successor + Go config + strict checks).
- `attempt8_config.json`, `attempt8_server.log`,
  `attempt8_result.json`, `attempt8_result_rescored.json`,
  `attempt8_interpreter_freeze.txt`.
- `run1_aborted_driver_*` — the first launch, preserved.
- `summary.json` — machine-readable identity/results.
- `CHECKSUMS.sha256` — all files.
