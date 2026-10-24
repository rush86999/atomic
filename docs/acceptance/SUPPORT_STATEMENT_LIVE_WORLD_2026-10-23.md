# Atom live-world pilot support statement — 2026-10-23 (refreshed 2026-10-24)

**Build:** `cc813aeeb90b84fcb36d128fda0a3b32b255742e`
**Launch/runtime:** `b682d017e60ffb0f872fddba9bcf9fb648034775`
(`b682d017e60f`, clean)
**Scope:** single-tenant local Atom pilot on the declared configuration
**Status:** local live-world rehearsal passed 60/60 (attempt 8); cutover is
held and **not executed**. The old pilot `8c593e57031e` is serving until the
owner approves `CUTOVER_APPROVAL_2026-10-24.md`.

## Supported (on this exact candidate)

On the declared configuration (DeepSeek structured interpretation and edit
planning, local Ollama reply, local fastembed, SQLite/LanceDB/BYOK):

- sign in, upload records, get a concise sourced answer;
- edit a draft once and repeat without another write;
- compare a draft with its source, including an honest partial/open
  comparison instead of a fabricated match;
- ask a follow-up and reload/restart without losing or contradicting the
  saved result.

The live-world composed rehearsal passed 60/60 on the verified pre-cutover
786 MB snapshot with isolated auxiliary stores and writers disabled. Actual
replies for L3/S3/S7 were all `ollama/llama3.1:8b`; structured interpretation
was `deepseek/deepseek-v4-pro`. The declared fallback was not needed in that
run. L3 59.1 s, edit 33.99 s, re-ask 31.04 s, S3 87.53 s, S7 67.46 s.

Evidence: `LIVE_WORLD_REHEARSAL_ATTEMPT8.md`,
`RELEASE_CANDIDATE_LIVE_WORLD_2026-10-23.md`, and
`release_evidence_20261023/live_world_rehearsal_attempt8/`.

## Not claimed

- No claim that every integration/background agent/automation/marketplace/
  mobile/installation platform works.
- Not a SaaS/multi-tenant certification, security audit, or
  high-availability deployment.
- Only the declared provider/model/fixture/live-world configuration is
  verified. Changing providers, models, embeddings, deadlines, or corpus
  invalidates this statement until re-measured.
- The S3 comparison may remain partial with the broader obligation OPEN;
  that is the intended truthful behavior.
- One rehearsal is not a reliability or latency-tail estimate; S3 took
  87.53 s.
- **Known defect in this exact product commit:** the answer boundary drops
  the first paragraph of a multi-paragraph reply when that paragraph contains
  the literal `[ingested]`. Ordinary user quotations can therefore lose
  their first paragraph. See `DELTA_REVIEW_CC813AEEB_2026-10-24.md`. This is
  accepted only if the cutover approval explicitly accepts it.
- The live pilot preserves all existing BYOK providers, while attempt 8 used
  an isolated store containing only DeepSeek and local Ollama. Broader live
  fallback routes were not exercised by the rehearsal; the cutover smoke
  records the actual route.

## Operation / recovery

- Exact cutover, smoke, and rollback instructions: `CUTOVER_2026-10-24.md`.
- Candidate identity/configuration:
  `RELEASE_CANDIDATE_LIVE_WORLD_2026-10-23.md` and
  `release_evidence_20261024/cutover_cc813aeeb/release_config.json`.
- The historical 09:19 SQLite backup restores cleanly but is stale (48 users
  vs 49 live). A fresh quiescent snapshot is mandatory at cutover; the
  procedure takes it before any candidate write.
- Preserve the pilot BYOK files in place. Do not use the historical
  `candidate-byok/` filtered store.
- One backend on `:8001`, one frontend on `:3000`; no `--reload`.
- On smoke failure, restore the fresh snapshot and unchanged BYOK/env,
  restart `8c593e57031e`, and preserve evidence. Do not retry in the same
  window.

## Support boundary

Report the build identity, request text, observed answer/draft/history, and
`/api/health` identity. Do not send credentials or full private documents.
This statement is revised to “deployed” only after a successful cutover
smoke on the served identity.
