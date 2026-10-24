# Live-world composed rehearsal — attempt 8 PASSED 60/60

**Result: PASSED on the frozen local successor. The live pilot was NOT
cut over; the hold remains. The old pilot `8c593e57031e` is serving.**

## Identity

- Product `cc813aeeb90b84fcb36d128fda0a3b32b255742e`
- Runtime/launch `b682d017e60f` (clean)
- Live gate `successor_gates_live.py` `6d66d0b8...`
- Isolated 786 MB pre-cutover snapshot; writers disabled; `:8121`

## Result

All 60 checks true: L3, edit, re-ask, S3, S7, restart, provider parity,
live-DB isolation, pilot isolation.

- L3 59.1 s: `QUARTZ-77`, documents receipt, no decoy.
- Edit 33.99 s: one write, postcondition verified.
- Re-ask 31.04 s: no-op `already_satisfied`, zero writes.
- S3 87.53 s: honest partial, broader obligation OPEN, truthful date.
- S7 67.46 s: date-only completed, settlement basis, restart agreement.
- Actual replies L3/S3/S7 all `ollama/llama3.1:8b`; structured
  interpretation `deepseek/deepseek-v4-pro`. Declared fallback not needed
  in this run.
- `live_db_unchanged=true` for the old pilot during this run (the prior
  candidate swap had been rolled back), `pilot_untouched=true`.

## What this run depended on

The preceding attempt 7 failed S3 with `UnboundLocalError: _chain_query`
followed by the literal “I'll manage those tasks for you.” The response
function now initializes `_chain_query` at its own scope. The L3 boundary
also strips a leading inline `[ingested]` carrier when a later answer
paragraph exists. The configured replay after those fixes passed L3
88.61 s (Ollama) and S3 61.86 s (Ollama), with only DeepSeek and local
Ollama HTTP destinations.

## Limits

- One rehearsal, not a latency-tail proof.
- The S3 replay's 400 response is recorded without a preserved body or a
  second dispatch; it is not called a compatibility retry.
- The live-cutover hold is still in force. This is a local pass only.

Evidence: `release_evidence_20261023/live_world_rehearsal_attempt8/`.
