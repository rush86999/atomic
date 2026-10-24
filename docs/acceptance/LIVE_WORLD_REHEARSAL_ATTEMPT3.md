# Live-world composed rehearsal — attempt 3 PASSED

**Result: 59/59 checks passed on the isolated live-world copy. No
cutover has been performed; the pilot remains the restored
`8c593e57031e` build and the deployment hold is still in force until one
new explicit approval.**

## Identity and world

- Product tree: `f09766d5c578d3d299a3b5c020f627ee53bfb32d`
- Runtime/launch HEAD: `1e8b5698fb0f` (clean, `dirty=false`)
- Gate: `successor_gates_live.py`
  `6d66d0b8b3b2c9a24efbe111a750c477f623a207d34692dcd4fa07cfceb88dd2`
  (frozen `successor_gates.py` unchanged for attempts 3–7)
- World: verified pre-cutover 786 MB SQLite snapshot; fresh isolated
  LanceDB/atom-memory; scheduler/ingestion/Telegram/org-sharing disabled;
  port 8121. The live pilot DB was never opened by the scratch process.
- Provider: authorized DeepSeek credential through the product; declared
  env. Observed structured route: `deepseek/deepseek-v4-pro`; streamed
  reply route: **`ollama/llama3.1:8b`** (declared parity achieved in this
  run).

## Measured legs (95 s deadline unchanged)

| Leg | Latency | Outcome |
|---|---:|---|
| L3 sourced answer | 59.16 s | correct `QUARTZ-77`, verified `documents.search` receipt, no decoy |
| Edit once | 29.70 s | one audit write, postcondition verified |
| Identical re-ask | 37.14 s | no-op `already_satisfied`, zero writes |
| S3 comparison | 79.03 s | honest partial; broad obligation OPEN; draft date 2026-12-31; delivery/settlement truthful |
| S7 date-only continuation | 79.01 s | completed scope/settlement; restart agreement passed |
| Restart | — | history/execution/canvas/write/persistence agreement |

All 59 declared checks are true, including L3 receipt/objective/
settlement, S3 truthful date/no false date/broader open/settlement/
requirement captured, S7 date-only completed/source/actions/capture/
settlement, restart agreement, `live_db_isolated`, and `pilot_untouched`.

The top-level `live_db_unchanged=false` is the pilot's own background
writes (pid 50500 held the live DB); the scratch process tree held no
live DB/WAL/SHM handle and every store path was under the isolated
scratch. `pilot_untouched=true`.

## Changes that made this pass

- The answer-scope prompt rule: direct factual answers state only the
  requested subject/value/source and do not enumerate unrelated entries,
  decoy values, or alternatives. The L3 answer no longer volunteered the
  decoy.
- The live gate accepts an honest prior text only when it equals the
  exact `next_action` captured from THIS run's durable record before S7;
  the frozen old gate and its evidence remain byte-identical.
- Earlier authority/delivery fixes (catalog-bound document requirement,
  document-only read ownership, bounded sync search, delivery ledger
  scope, required-read query/lane) are all present.

## Browser

The isolated live-world backend/frontend pair was already exercised with
a real Chromium sign-in to `/dashboard` with no page errors
(`live-world-browser.png` in the diagnosis evidence); the only later
product change is the backend answer-scope prompt, so the frontend path
is unchanged.

## Decision

This is a verified live-world rehearsal, not a cutover. The pilot is
untouched and the rollback remains in place. The new backup/rollback
package and one explicit cutover approval are the next gate.

## Evidence

`release_evidence_20261023/live_world_rehearsal_attempt3/`
(`live_rehearsal_result.json`, summary, config, run log, preflight,
checksums).
