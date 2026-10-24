# Atom pilot support statement — 2026-10-23

**Build:** `910bf85a6dd32f7026f28df2e4380110bd463c50`
(clean export `4d6aaffb14d24655311df4d42b67be4859f1799b`; docs/evidence HEAD `99350c53d`; product tree unchanged)
**Scope:** single-tenant local Atom pilot, one declared configuration
**Status:** verified release candidate; a live cutover was attempted on
2026-10-23 and rolled back after the live sourced-answer smoke failed.
The old pilot (`8c593e57031e`) is back in service; the deployment hold is
re-engaged. This candidate is not certified for live-scale data.

## What this build supports

On the declared configuration (DeepSeek structured interpretation pinned
to `deepseek-v4-pro`, local Ollama reply, local fastembed, SQLite/LanceDB/
BYOK), one ordinary user can:

- sign in and reach the workspace;
- use the supported local/provider configuration;
- upload records and get a concise sourced answer;
- edit a draft once, repeat the instruction without another write;
- compare the draft with its source, including an honest partial/open
  comparison rather than a fabricated match;
- ask a follow-up and reload/restart without losing or contradicting the
  saved result.

The answer, saved status, history, evidence, and artifact agree on the
acceptance fixture. Attempt 7 passed all 59 declared composed checks on
this build; the same tree passed a clean-export backend startup,
production frontend build, and real Chromium registration/dashboard.
Evidence: `backend/scripts/orchestration_acceptance/journey_matrix/l1_l2_l3_integrated_served_20261020/ATTEMPT7_RESULT.md`,
`docs/acceptance/RELEASE_CANDIDATE_2026-10-23.md`, and
`docs/acceptance/release_evidence_20261023/`.

## What is not claimed

- This is not proof that every advertised integration, background agent,
  automation, marketplace item, mobile client, or installation platform
  works. Those are separate programs and are not certified here.
- It is not a SaaS/multi-tenant certification, a security audit, or a
  high-availability deployment. It is a local, single-operator pilot.
- Only the declared provider/model/fixture configuration is verified.
  Changing providers, models, embedding settings, deadlines, or the
  knowledge corpus invalidates this statement until re-measured.
- The S3 comparison may remain **partial with the broader obligation
  OPEN** when the comparison itself was not recorded; that is the
  intended truthful behavior, not a promoted match.
- The clean-export frontend build reused the local dependency cache
  rather than a fresh `npm ci`; startup/build parity is verified, network
  dependency resolution is not.
- Live-scale latency is **not** certified. The cutover candidate passed
  the fresh-scratch workflow but the live 786 MB corpus/integration-heavy
  world spent 77.7 s before the reply, leaving 17.3 s and failing the
  sourced question. No deadline increase or gate relaxation was used.

## Operation

- Run instructions, exact configuration, cutover steps, and rollback are
  in `docs/acceptance/RELEASE_CANDIDATE_2026-10-23.md`.
- Back up the SQLite database and BYOK files before any cutover; restore
  them if the candidate writes anything and then fails.
- The pilot backend is one process on `:8001`; the frontend is on
  `:3000`. Do not run two backends against the same live data.
- The API server does not use `--reload`; restart deliberately and
  verify `/api/health` before trusting a result.

## Recovery

If the candidate misbehaves: stop it, restart the previous pilot
backend/frontend from the unchanged main checkout, restore the
pre-cutover database/BYOK files if needed, and verify the old health
identity. Do not delete user data or run an incompatible migration.
The acceptance scratch worlds and the live DB were isolated; the live DB
was unchanged during attempt 7.

## Support boundary

Report an issue with: the build identity above, the request text, the
observed answer/draft/history, and the `/api/health` identity. Do not
send credentials or full private documents in a report. This statement
is revised only after a new measured run on a new exact identity.
