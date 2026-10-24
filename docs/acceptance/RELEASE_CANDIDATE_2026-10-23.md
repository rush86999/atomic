# Release candidate — 2026-10-23 (product 910bf85a6)

**Status: verified local release candidate; not deployed. The live pilot
cutover still requires one explicit approval under the standing hold.**

## Exact identity

| Item | Value |
|---|---|
| Product commit | `910bf85a6dd32f7026f28df2e4380110bd463c50` |
| Clean export / verified-record HEAD | `4d6aaffb14d24655311df4d42b67be4859f1799b` |
| Docs/evidence HEAD | `99350c53d` (product tree unchanged from `910bf85a6`) |
| Gate harness | `f2f8329971129bc14e9f107aa234b98db7f18379` |
| Verified run HEAD | `c2f8994956a488fbe399e80177d3755703847846` |
| Attempt 7 result | `59/59`; `verified_l1_l2_l3_composed_workflow` |
| Preflight | 44/44 checks; 80 focused tests |
| Clean export | 11,173 files; backend health 200; frontend production build; Chromium sign-in/dashboard |
| Pilot before cutover | `8c593e57031e` dirty, pid 81067, cwd `main/backend`; frontend `:3000`; untouched |

Evidence: `backend/scripts/orchestration_acceptance/journey_matrix/l1_l2_l3_integrated_served_20261020/ATTEMPT7_RESULT.md`,
`CHECKSUMS_ATTEMPT7.sha256`, `journey_status.json`, and
`docs/acceptance/release_evidence_20261023/`.

## Declared configuration

Single-tenant local pilot, one integrated build:

- TypeScript/Python backend on `127.0.0.1:8001` at cutover; Next.js
  frontend on `127.0.0.1:3000` (loopback build with the explicit
  `NEXT_PUBLIC_ALLOW_LOOPBACK=1`).
- `ATOM_TURN_INTERPRETATION=1`;
  `ATOM_TURN_INTERPRET_PIN=deepseek:deepseek-v4-pro`; DeepSeek operator
  credential registered through the product; local Ollama reply;
  local fastembed `BAAI/bge-small-en-v1.5`; SQLite/LanceDB/BYOK stores.
- Same requests, fixtures, distractor document, and deadlines as the
  predeclared acceptance. No provider switching, no deadline increase,
  no gate relaxation.

## What is verified

- **59/59 composed served checks** on the declared configuration:
  L3 sourced answer (verified grep receipt, `QUARTZ-77`, no
  `BASALT-13`, no full-text leak), draft edit once, identical re-ask
  with no second write, S3 comparison with a truthful
  missing-comparison limitation and broad obligation OPEN, S7
  continuation with per-run prior capture and honest partial, and
  restart partial-aware agreement/zero-write/persistence.
- **Live DB unchanged/isolated; pilot untouched** during acceptance.
- **Clean export**: `git archive` → backend health 200 → Next.js 16.2.2
  production build (webpack) → `next start` → real Chromium
  registration/dashboard with zero page errors (screenshot preserved).
- Historical attempts 3–6 remain preserved and non-passing; attempt 7
  does not rewrite them.

## Deploy on approval (reversible, narrow)

Do not execute while the hold is in force. On explicit approval:

1. **Freeze and back up** (the existing `scripts/restart_backend.sh`
   already snapshots the SQLite DB; take an explicit copy too):
   ```bash
   cd /Users/rushiparikh/projects/atom
   sqlite3 backend/data/atom.db ".backup '/tmp/atom-pre-910bf85a6.db'"
   cp -p backend/data/byok_keys.json /tmp/byok_keys.pre-910bf85a6.json
   cp -p backend/data/byok_config.json /tmp/byok_config.pre-910bf85a6.json
   curl -s http://127.0.0.1:8001/api/health > /tmp/pilot-health-before.json
   ```
   Record the pilot identity (`8c593e57031e`) and keep the old backend
   process/checkout recoverable.

2. **Stage the verified tree** in a new release directory (do not edit
   the dirty main checkout):
   ```bash
   git archive 4d6aaffb14d24655311df4d42b67be4859f1799b |
     tar -x -C /path/to/atom-release-910bf85a6
   cd /path/to/atom-release-910bf85a6/frontend-nextjs
   # build with the pilot API origin; loopback is explicit
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 NEXT_PUBLIC_ALLOW_LOOPBACK=1 \
     npm ci && npm run build -- --webpack
   ```
   Use the existing venv for the backend; no schema migration is
   required by this candidate (product changes are core/integration and
   answer-boundary only).

3. **Point the candidate at the pilot data**, not a new scratch store:
   `DATABASE_URL=sqlite:////Users/rushiparikh/projects/atom/backend/data/atom.db`,
   `ATOM_DATA_DIR=/Users/rushiparikh/projects/atom/backend/data`,
   `LANCEDB_URI=/Users/rushiparikh/projects/atom/backend/data/atom_memory`,
   and the existing BYOK files/keys. Keep `ALLOWED_ORIGINS` including
   `http://127.0.0.1:3000` and `http://localhost:3000`.

4. **Cut over**: stop the old backend on `:8001` (one process; the
   restart script kills stragglers), start the candidate with the same
   documented args, stop the old frontend on `:3000`, start the
   candidate frontend on `:3000`. Verify:
   ```bash
   curl -sf http://127.0.0.1:8001/api/health
   curl -sf -o /dev/null http://127.0.0.1:3000/login
   ```
   Then run the browser sign-in and one ordinary sourced question
   through the UI; confirm history/draft persistence and no error.

5. **Rollback** on any failure: stop the candidate; restore the previous
   backend/frontend processes from the unchanged main checkout and
   `:8001`/`:3000`; restore the pre-cutover SQLite/BYOK files if the
   candidate wrote anything; verify the pre-cutover health identity.
   The old pilot remains the source of truth until the candidate passes.

## Hold

The previous explicit deployment hold is still in force. This package
does not silently revoke it. Approve only the exact identity above and
the smoke artifacts in `release_evidence_20261023/`; do not approve a
different build or an unverified configuration.

Support statement: `docs/acceptance/SUPPORT_STATEMENT_2026-10-23.md`.
