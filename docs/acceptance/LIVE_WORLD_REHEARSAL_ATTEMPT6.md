# Live-world composed rehearsal — attempt 6 PASSED 60/60

**Result: PASSED on the frozen successor. No cutover has been performed;
the pilot remains the restored `8c593e57031e` build. The new backup/rollback
package is prepared for one explicit approval.**

## Identity

- Product tree: `264677107d23196fcd77e2ccedf97c511fc6f32f`
- Runtime/launch HEAD: `06b213c79b66` (clean, `dirty=false`)
- Live gate: `successor_gates_live.py`
  `6d66d0b8b3b2c9a24efbe111a750c477f623a207d34692dcd4fa07cfceb88dd2`
- Frozen old gate `successor_gates.py` remains byte-identical for attempts
  3–7.
- World: verified pre-cutover 786 MB SQLite snapshot; fresh isolated
  auxiliary stores; scheduler/ingestion/Telegram/org-sharing disabled;
  port 8121. The scratch process held no live DB handle.

## Provider parity

- Declared profile: **local Ollama preferred; DeepSeek fallback** (explicit
  predeclaration, no silent switch).
- Actual routes in this run:
  - L3: `ollama`
  - S3: `ollama`
  - S7: `ollama`
  - streamed: `ollama/llama3.1:8b`
- Structured interpretation: `deepseek/deepseek-v4-pro`.
- The 60th check, `provider_reply_parity`, passed; no fallback was needed
  in this run.

## Results (95 s deadline unchanged)

| Leg | Time | Outcome |
|---|---:|---|
| L3 sourced answer | 74.07 s | `QUARTZ-77`, verified documents receipt, **no decoy**, no leading source excerpt |
| Edit once | 38.60 s | one audit write, postcondition verified |
| Identical re-ask | 42.39 s | no-op `already_satisfied`, zero writes |
| S3 comparison | 76.14 s | honest partial, broad obligation OPEN, truthful date, delivery recorded |
| S7 date-only | 55.77 s | completed scope/settlement; restart agreement |
| Restart | — | history/execution/canvas/write/persistence agreement |

All 60 checks true, including required read/receipt, answer correctness,
edit/re-ask, S3, S7, restart, provider parity, `live_db_isolated`, and
`pilot_untouched`.

The L3 answer is now exactly:

> The launch code for project Zephyr-9 is **QUARTZ-77**.
>
> Source: your uploaded document `l3_zephyr9_fixture.txt` (“ATOM PHASE D
> FIXTURE — internal notes”).

The leading `[ingested]` source excerpt was removed as an internal carrier;
the answer-scope instruction is derived from the accepted subjects/fields.
S3's optional planning timed out at 20 s but the required-read floor
executed; the verify panel and interpretation reserve kept the turn within
budget. The earlier S3 85 s starvation is not reproduced.

## Decision

- The live-world rehearsal has passed on the frozen product/config.
- The pilot is untouched; the prior cutover approval was **not** executed
  (it named the earlier parity-blocked build).
- Prepare the new package and request one explicit cutover approval for
  this exact identity.

## Evidence

`release_evidence_20261023/live_world_rehearsal_attempt6/` (result,
summary, config, run log, preflight, checksums). Full server logs remain
outside the repository.
