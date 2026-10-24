# Atom live-world pilot support statement — 2026-10-23

**Build:** `264677107d23196fcd77e2ccedf97c511fc6f32f`
(clean export `06b213c79b66`; rehearsal runtime `06b213c79b66`)
**Scope:** single-tenant local Atom pilot on the declared configuration
**Status:** DEPLOYED 2026-10-24; served runtime `3b6a1316f16f`; live-world
rehearsal passed 60/60. The pre-cutover pilot is restorable from the final
backup.

## Supported

On the declared configuration (DeepSeek structured interpretation,
local Ollama reply, local fastembed, SQLite/LanceDB/BYOK):

- sign in, upload records, get a concise sourced answer;
- edit a draft once and repeat without another write;
- compare a draft with its source, including an honest partial/open
  comparison instead of a fabricated match;
- ask a follow-up and reload/restart without losing or contradicting the
  saved result.

The live-world composed rehearsal passed 60/60 on the verified
pre-cutover 786 MB snapshot with isolated auxiliary stores and writers
disabled. Actual replies for L3/S3/S7 were all `ollama/llama3.1:8b`;
structured interpretation was `deepseek/deepseek-v4-pro`. The declared
profile allows a DeepSeek fallback but this run did not need it.

Evidence: `LIVE_WORLD_REHEARSAL_ATTEMPT3.md`,
`RELEASE_CANDIDATE_LIVE_WORLD_2026-10-23.md`, and
`release_evidence_20261023/live_world_rehearsal_attempt3/`.

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
- The clean frontend build/browser was verified on the same unchanged
  frontend source; the latest backend delta is the answer-scope rule.

## Operation / recovery

- Exact cutover and rollback instructions: `CUTOVER_2026-10-24.md` and
  `RELEASE_CANDIDATE_LIVE_WORLD_2026-10-23.md`.
- The candidate BYOK store is filtered to DeepSeek/Ollama; the original
  multi-provider BYOK file is preserved in the final backup.
- Fresh pre-cutover SQLite/BYOK/env backup: `…/opencode/atom-cutover-live-world-20261023/`; integrity `ok`.
- Back up again immediately before any cutover; restore on failure.
- One backend on `:8001`, one frontend on `:3000`; no `--reload`.
- The pilot was not modified during the rehearsal; candidate scratch held
  no live DB handle.

## Support boundary

Report the build identity, request text, observed answer/draft/history,
and `/api/health` identity. Do not send credentials or full private
documents. This statement is revised only after a new measured run on a
new exact identity.
