# Live-world release candidate — 2026-10-23 (refreshed 2026-10-24)

**Status: LOCAL LIVE-WORLD REHEARSAL PASSED 60/60 (attempt 8) on product
`cc813aeeb`; cutover is NOT authorized and NOT executed. The old pilot
`8c593e57031e` is still serving on `:8001`/`:3000`.**

This document supersedes the attempt-3 numbers previously in this file. It
describes the final attempt-8 candidate and the staged release tree. The
one-attempt cutover request is
`CUTOVER_APPROVAL_2026-10-24.md`; the procedure is
`CUTOVER_2026-10-24.md`.

## Exact identity

| Item | Value |
|---|---|
| Product commit | `cc813aeeb90b84fcb36d128fda0a3b32b255742e` |
| Product tree | `5e324af5297640ee11628fa755bd50c7b7307302` |
| Rehearsal/launch commit | `b682d017e60ffb0f872fddba9bcf9fb648034775` |
| Rehearsal runtime | `b682d017e60f`, clean (`dirty=false`) |
| Product diff, launch vs pin | none (`product_tree_equals_pin=true`) |
| Staged release tree | `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/atom-release-cc813aeeb-20261024` |
| Staged tree HEAD | `b682d017e60ffb0f872fddba9bcf9fb648034775`, clean (`git status` empty) |
| Staged backend health | 200; identity `revision=b682d017e60f`, `dirty=false` (`stage_backend_health.json`) |
| Frontend build | Next.js 16.2.2 (webpack), Node 20.19.6, npm 10.8.2, `BUILD_ID=tCcJqyp6jX99CjA0eySjZ` |
| Frontend API base | `http://127.0.0.1:8001`, loopback opt-in (`NEXT_PUBLIC_ALLOW_LOOPBACK=1`) |
| Frontend source tree | `0d48f0b863ba3069526006ed29441099df435c71` (same in product and launch) |
| Interpreter | `/Users/rushiparikh/projects/atom/backend/venv314/bin/python`, Python 3.14.7; `pip freeze` sha256 `70aedee4…` |
| Live gate | `successor_gates_live.py` `6d66d0b8b3b2c9a24efbe111a750c477f623a207d34692dcd4fa07cfceb88dd2` |
| Serving pilot (hold) | `8c593e57031e` clean, backend `:8001` pid 16055; frontend `:3000` pid 16488 |
| Pre-cutover backup | the existing 09:19 snapshot is **stale**; a fresh quiescent snapshot is required at cutover |

The staged tree was converted from a plain `git archive` into a local
repository pinned to `b682d017e` because a tree without `.git` reports
`revision=unknown` on `/api/health`. Pinning did not change product code:
the seven attempt-8 source hashes and the `frontend-nextjs` tree hash are
identical to `cc813aeeb`.

## Verification (attempt 8)

Evidence: `LIVE_WORLD_REHEARSAL_ATTEMPT8.md` and
`release_evidence_20261023/live_world_rehearsal_attempt8/`
(5/5 checksums verified; checksums were not rewritten).

- **60/60 checks true** on the verified 786 MB pre-cutover snapshot with
  isolated auxiliary stores and writers disabled; port 8121.
- L3 59.1 s: `QUARTZ-77`, verified `documents.search` receipt, no decoy.
- Edit 33.99 s: one write, postcondition verified.
- Re-ask 31.04 s: no-op `already_satisfied`, zero writes.
- S3 87.53 s: honest partial, broader obligation OPEN, truthful date,
  delivery recorded.
- S7 67.46 s: date-only completed, settlement basis, restart agreement.
- Actual replies L3/S3/S7 all `ollama/llama3.1:8b`; structured
  interpretation `deepseek/deepseek-v4-pro`; provider parity passed.
- `live_db_isolated=true`, `pilot_untouched=true`.

## Delta review of the product commit

`DELTA_REVIEW_CC813AEEB_2026-10-24.md` reviewed only `cc813aeeb`:

- `_chain_query` initialization is safe; no unbound-local path remains.
- The inline `[ingested]` strip is **over-broad**: it deletes the first
  paragraph of any multi-paragraph reply when that paragraph contains the
  literal `[ingested]`. The required “ordinary user quotation is preserved”
  check **fails**.
- No product change was made; changing it would break the attempt-8
  identity and require a new rehearsal.

The cutover request is therefore conditional on explicitly accepting this
known limitation. It is not silently treated as passing.

## Configuration the request would run

The live pilot's existing provider files are preserved in place. **Do not
use `atom-cutover-final-20261024/candidate-byok/`**; that historical
filtered store is not part of this candidate.

- Stores (absolute, anchored to the pilot): `DATABASE_URL`,
  `ATOM_DATA_DIR`, `LANCEDB_URI`, `LANCEDB_URI_BASE`, `LANCEDB_PATH`,
  `BYOK_CONFIG_FILE`, `BYOK_KEYS_FILE`, `BYOK_ENC_KEY_FILE`.
- Additive turn flags: `ATOM_TURN_INTERPRETATION=1`,
  `ATOM_TURN_INTERPRET_PIN=deepseek:deepseek-v4-pro`,
  `ATOM_TURN_INTERPRET_CAPTURE=1`, `ATOM_TURN_DECISION_ROUTING=1`,
  `ATOM_ASYNC_EDIT_PLAN_MODEL=deepseek/deepseek-v4-pro`.
- Additive reply preference proposed by the approval:
  `ATOM_PREFERRED_LLM_PROVIDER=ollama`,
  `ATOM_PREFERRED_LLM_MODEL=llama3.1:8b`. This is a routing preference, not
  a credential change; it was not present in the rehearsal's isolated
  environment and is validated by the post-cutover smoke.
- Preserve `CHAT_FINALIZATION_M1=1`, `CHAT_FINALIZATION_M2=1`,
  `ATOM_TASK_LIFECYCLE_ENABLED=1`,
  `ATOM_STREAM_FALLBACK_RESERVE_SECONDS=70`, `ALLOWED_ORIGINS`/
  `CORS_ORIGINS` including `http://127.0.0.1:3000`.
- Intended routes: reply `ollama/llama3.1:8b`; structured interpretation and
  edit planning `deepseek/deepseek-v4-pro`.
- Allowed fallback: the pre-existing global `deepseek`, `opencode-go`, and
  `openrouter` credentials remain active because the pilot BYOK is
  preserved. Attempt 8 did not exercise those routes; only DeepSeek and
  local Ollama were present in its isolated store. The smoke records the
  actual route.

Exact JSON: `release_evidence_20261024/cutover_cc813aeeb/release_config.json`.

## Cutover (prepared, not executed)

1. Quiesce only the owned pilot processes, confirm no DB holders remain,
   and take a fresh `sqlite .backup` snapshot; verify `quick_check`, row
   counts, and hashes. Copy the four existing BYOK/env files unchanged.
2. Start the staged backend on `:8001` against the live stores; require
   health identity `b682d017e60f`, `dirty=false`, live database path, live
   BYOK key-store path.
3. Start the staged frontend on `:3000`; require `/login` 200 and browser
   sign-in.
4. Run the sourced-answer → edit → identical re-ask → reload/restart smoke
   in `CUTOVER_2026-10-24.md`. Dashboard/signup alone is not a pass.
5. On success, record the served `X-Atom-Serving-Instance`/`X-Atom-Source`
   headers and health identity. On failure, restore the fresh snapshot and
   the unchanged BYOK/env files, restart the old pilot, and preserve
   evidence.

## Limits

- One rehearsal is not a reliability or latency-tail estimate. The S3 leg
  took 87.53 s; the reply budget is finite.
- The live provider universe is broader than the rehearsal's isolated
  credential set. Actual live route parity is a smoke criterion, not a
  rehearsal claim.
- The `[ingested]` first-paragraph defect is a known limitation of this
  exact product commit.
- No SaaS/multi-tenant, security, or high-availability certification.

## Hold

The hold remains in force until the owner approves
`CUTOVER_APPROVAL_2026-10-24.md`. No cutover has been executed for
`cc813aeeb`; the serving pilot is still `8c593e57031e`.

Support statement: `SUPPORT_STATEMENT_LIVE_WORLD_2026-10-23.md` (refreshed
for the attempt-8 candidate).
