# Atom live-world pilot support statement — 2026-10-23

**Build:** `f09766d5c578d3d299a3b5c020f627ee53bfb32d`
(clean export `1508955bf`; rehearsal runtime `1e8b5698fb0f`)
**Scope:** single-tenant local Atom pilot on the declared configuration
**Status:** live-world rehearsal passed 59/59; **cutover approval
pending**. The old pilot `8c593e57031e` remains in service until then.

## Supported

On the declared configuration (DeepSeek structured interpretation,
local Ollama reply, local fastembed, SQLite/LanceDB/BYOK):

- sign in, upload records, get a concise sourced answer;
- edit a draft once and repeat without another write;
- compare a draft with its source, including an honest partial/open
  comparison instead of a fabricated match;
- ask a follow-up and reload/restart without losing or contradicting the
  saved result.

The live-world composed rehearsal passed 59/59 on the verified pre-cutover
786 MB snapshot with isolated auxiliary stores and writers disabled. It
verified L3 answer/read, edit, re-ask, S3 comparison, S7 continuation,
restart persistence/agreement, `live_db_isolated`, and
`pilot_untouched`. Observed routes: `deepseek/deepseek-v4-pro` structured,
`ollama/llama3.1:8b` streamed reply.

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

- Exact cutover and rollback instructions: `RELEASE_CANDIDATE_LIVE_WORLD_2026-10-23.md`.
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
