# Live-world release candidate — 2026-10-23

**Status: LOCAL REHEARSAL PASSED 60/60 (attempt 8, product
`cc813aeeb`). Deployment remains held; the old pilot `8c593e57031e` is
serving. No cutover was performed after the rollback.**

This supersedes the fresh-scratch release candidate identity for the
live pilot. The prior `910bf85a6` candidate and its evidence remain
preserved as history.

## Exact identity

| Item | Value |
|---|---|
| Product tree | `cc813aeeb90b84fcb36d128fda0a3b32b255742e` |
| Rehearsal runtime | `b682d017e60f` clean (`dirty=false`) |
| Serving pilot | `8c593e57031e` on `:8001` (hold) |
| Clean export HEAD | `06b213c79b66` (product tree above); backend health 200 on `:8124` |
| Live gate | `successor_gates_live.py` `6d66d0b8b3b2c9a24efbe111a750c477f623a207d34692dcd4fa07cfceb88dd2` |
| Frozen old gate | `successor_gates.py` `a0b2f748…` unchanged for attempts 3–7 |
| Pilot before cutover | `8c593e57031e`, backend `:8001`, frontend `:3000` (restorable) |
| Backup package | `…/opencode/atom-cutover-final-20261024/` (fresh 09:19 SQLite/BYOK/env snapshot, integrity `ok`) |

## Verification

- **Live-world composed rehearsal: 60/60** on the verified pre-cutover
  786 MB snapshot with fresh isolated auxiliary stores and writers
  disabled; port 8121.
  - L3 59.16 s: correct `QUARTZ-77`, verified `documents.search` receipt,
    no decoy.
  - Edit 29.70 s: one write, postcondition verified.
  - Re-ask 37.14 s: no-op `already_satisfied`, zero writes.
  - S3 79.03 s: honest partial, broad obligation OPEN, truthful date,
    delivery recorded.
  - S7 79.01 s: date-only completed, settlement basis, restart agreement.
  - Structured route `deepseek/deepseek-v4-pro`; L3/S3 reply fell back
    to DeepSeek, S7 used Ollama — declared provider parity **failed**.
  - `live_db_isolated=true`, `pilot_untouched=true`; the pilot's own
    background writes account for the live DB fingerprint change.
- **Clean export** at `1508955bf`: `git archive` → backend import/startup
  on `:8122` health 200; product source hashes pinned. (The frontend
  source is unchanged from the previously built/browser-verified
  clean-export frontend; the live-world browser sign-in/dashboard was
  also verified.)
- **Preflight**: pin/source/gate hashes, snapshot, fresh paths, clean
  worktree, pilot health, and focused tests passed.

Evidence: `docs/acceptance/LIVE_WORLD_REHEARSAL_ATTEMPT3.md` and
`release_evidence_20261023/live_world_rehearsal_attempt3/`.

## Cutover (deployed)

1. **Fresh backup** is already staged. Re-verify integrity and record
   pilot health (`pilot_health_before.json`) immediately before the
   switch. Keep the old backend/frontend processes recoverable.
2. **Stage** the clean export:
   ```bash
   git archive 1508955bf | tar -x -C /path/to/atom-live-release
   ```
   Use the existing venv. Build the frontend with
   `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001` and
   `NEXT_PUBLIC_ALLOW_LOOPBACK=1` (webpack build; the frontend source is
   unchanged from the verified build).
3. **Point at pilot data** with absolute paths:
   `DATABASE_URL=sqlite:////Users/rushiparikh/projects/atom/backend/data/atom.db`,
   `ATOM_DATA_DIR=/Users/rushiparikh/projects/atom/backend/data`,
   `LANCEDB_URI=/Users/rushiparikh/projects/atom/backend/data/atom_memory`,
   `BYOK_*` to the pilot files. Keep `ALLOWED_ORIGINS` including
   `http://127.0.0.1:3000`.
4. **Cutover** backend first (stop old `:8001`, start release on `:8001`),
   verify health and browser sign-in, then swap frontend (`:3000`).
   Do one ordinary sourced question and confirm answer/source/delivery/
   persistence history.
5. **Rollback** on any failure: stop the release, restart the old
   backend/frontend from the unchanged main checkout/old worktree,
   restore the fresh SQLite/BYOK snapshot and verify the old identity.
   The old pilot remains the source of truth until the release passes.

## Hold

The earlier candidate cutover was rolled back and the hold re-engaged.
After the budget-edge and replay work, the isolated live-world rehearsal
passed 60/60 on product `cc813aeeb` / runtime `b682d017e`. No new cutover
has been performed. The serving pilot is the old `8c593e57031e` with its
original DB/BYOK; the final backup remains available.

Support statement: `SUPPORT_STATEMENT_LIVE_WORLD_2026-10-23.md`.
