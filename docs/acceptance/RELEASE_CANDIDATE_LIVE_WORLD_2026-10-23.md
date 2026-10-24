# Live-world release candidate — 2026-10-23

**Status: live-world rehearsal PASSED 59/59; cutover approval pending.
The pilot remains the restored `8c593e57031e` build. No cutover has been
performed.**

This supersedes the fresh-scratch release candidate identity for the
live pilot. The prior `910bf85a6` candidate and its evidence remain
preserved as history.

## Exact identity

| Item | Value |
|---|---|
| Product tree | `f09766d5c578d3d299a3b5c020f627ee53bfb32d` |
| Rehearsal runtime | `1e8b5698fb0f` clean (`dirty=false`) |
| Clean export HEAD | `1508955bf` (product tree above); backend health 200 on `:8122` |
| Live gate | `successor_gates_live.py` `6d66d0b8b3b2c9a24efbe111a750c477f623a207d34692dcd4fa07cfceb88dd2` |
| Frozen old gate | `successor_gates.py` `a0b2f748…` unchanged for attempts 3–7 |
| Pilot before cutover | `8c593e57031e`, backend `:8001`, frontend `:3000` |
| Backup package | `…/opencode/atom-cutover-live-world-20261023/` (fresh SQLite/BYOK/env snapshot, integrity `ok`) |

## Verification

- **Live-world composed rehearsal: 59/59** on the verified pre-cutover
  786 MB snapshot; fresh isolated auxiliary stores; scheduler,
  ingestion sync, Telegram polling and org sharing disabled; port 8121.
  - L3 59.16 s: correct `QUARTZ-77`, verified `documents.search` receipt,
    no decoy.
  - Edit 29.70 s: one write, postcondition verified.
  - Re-ask 37.14 s: no-op `already_satisfied`, zero writes.
  - S3 79.03 s: honest partial, broad obligation OPEN, truthful date,
    delivery recorded.
  - S7 79.01 s: date-only completed, settlement basis, restart agreement.
  - Structured route `deepseek/deepseek-v4-pro`; streamed reply
    `ollama/llama3.1:8b` — declared provider parity observed.
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

## Cutover (only after approval)

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

The prior deployment hold is still in force. This package does not
silently revoke it. Approve only this exact product/clean-export identity
and the evidence above; no other build or configuration.

Support statement: `SUPPORT_STATEMENT_LIVE_WORLD_2026-10-23.md`.
