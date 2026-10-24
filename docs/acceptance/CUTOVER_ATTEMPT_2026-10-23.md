# Cutover attempt — 2026-10-23 (rolled back)

**Outcome: failed live sourced-answer smoke; rolled back to the pre-cutover
pilot. The verified release candidate is unchanged, but it is not
deployed.**

## What was approved

The user approved one reversible cutover of the local pilot
(`:8001`/`:3000`) to product
`910bf85a6dd32f7026f28df2e4380110bd463c50` (verified clean export
`4d6aaffb1`; 59/59 composed checks; clean-export backend/frontend and
Chromium sign-in).

## What happened

1. Built the candidate frontend for the pilot API
   (`NEXT_PUBLIC_API_URL=http://127.0.0.1:8001`, explicit loopback
   opt-in).
2. Backed up the live SQLite DB (786 MB; gzip 125 MB; integrity `ok`),
   BYOK config/keys/encryption key, and `.env`; captured the pilot
   health identity (`8c593e57031e` dirty, pid 81067).
3. Stopped the pilot backend/frontend and started the candidate backend
   from the clean integrated worktree (`git_commit=d7d90648ae8e`,
   `dirty=false`) on the live DB/BYOK paths, with the declared
   DeepSeek structured route. Health 200.
4. Started the candidate frontend on `:3000`; `/login` 200; real Chromium
   registration/dashboard passed.
5. Registered the authorized DeepSeek operator credential through the
   live product (provider state active) and uploaded a small
   `release_smoke_record.txt` through the product.
6. **The live sourced question failed.** First attempt (before credential
   registration) returned an OpenCode-Go provider failure after 43.6 s.
   After registering DeepSeek, the retry returned a `deepseek-v4-pro`
   provider failure after 77.8 s. The turn spent **77.7 s in legacy
   features**, leaving **17.3 s** of the 95 s budget before the reply leg;
   the reply leg returned a provider failure. The sourced answer was not
   verified.

## Turn trace addendum

- The first live attempt ran before the declared DeepSeek credential was
  registered and before the candidate was restarted with the turn pin.
  Its interpretation cascade tried OpenCode-Go/OpenRouter models, emitted
  `missing_scope`, spent 43.5 s before legacy features, and failed.
- After the restart with `ATOM_TURN_INTERPRETATION=1` and
  `ATOM_TURN_INTERPRET_PIN=deepseek:deepseek-v4-pro`, the interpretation
  succeeded on DeepSeek in 23.8 s. Legacy `SEARCH` + `AI_ANALYTICS` then
  ran from 24.6 s to 77.7 s (~53 s), leaving 17.3 s; the reply leg returned
  the provider failure.
- Therefore the remaining live blocker is the legacy feature path /
  live-corpus latency **after** a successful interpretation, not a missing
  turn pin or an unregistered credential. The fresh-scratch attempt 7 had
  the same feature classes but ran them after the reply with 0.0 s.

## Rollback

- Stopped the candidate processes; ports freed.
- Restored the pre-cutover SQLite DB (integrity `ok`) and BYOK files;
  removed the candidate test user/document (residual counts 0/0); checked
  LanceDB document tables for the test id (none).
- Restarted the old backend code at `8c593e57031e` (clean rollback
  worktree) on `:8001`; health 200. Restarted the old frontend from the
  main checkout (`next dev`, `:3000`); `/login` 200.
- The old pilot is back in service. The candidate product tree and
  evidence remain preserved; the deployment hold is re-engaged.

## Diagnosis / next step

This is a **live-scale latency** failure, not a gate relaxation case: the
candidate passed the declared fresh-scratch composed workflow at 47 s
(L3) / 94.6 s (S3), but the live 786 MB corpus plus integration-heavy
legacy features consumed 77.7 s before the reply. No deadline increase,
provider switch, or gate change was attempted. The next work is to
reduce/avoid the legacy feature path on live sourced questions or to
declare a narrower live configuration with measured latency; the
candidate should not be re-cut over without a new local diagnosis and a
new explicit approval.

## Evidence

`release_evidence_20261023/cutover_attempt/`: candidate health, both live
chat failures, upload receipt, cutover browser screenshot, rollback
health/frontend, residual counts, and `cutover_summary.json`. Logs and
credentials are not committed.
