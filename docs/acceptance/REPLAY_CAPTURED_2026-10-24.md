# Captured L3/S3 replay — 2026-10-24

**Result: PASSED for the declared fallback profile. This is one
correctly-configured replay, not a latency-tail proof.**

## Setup (reused from the successful live-world harness)

- Product `a032164554cb99e927cae71924e17e0f8bc4dff3`; scratch server on
  `:8121`; verified pre-cutover 786 MB snapshot; fresh isolated stores.
- Product registration, request-scoped auth, authorized DeepSeek
  registration through `/api/ai/providers/deepseek/keys`, fixtures through
  `/api/documents/upload`.
- Registered user/workspace resolved; DeepSeek active; declared pin
  `deepseek:deepseek-v4-pro`; `ATOM_PROVIDER=ollama`;
  `ATOM_DEFAULT_MODEL=llama3.1:8b`; declared flags captured.
- HTTP destinations: `https://api.deepseek.com/v1/...` and
  `http://localhost:11434/...` only. **No OpenRouter request.**
- The earlier manual wrong-route attempt (OpenRouter GLM 402) is preserved
  as `diagnostic_invalid_wrong_route.json`; it is a memo from the terminal
  output (raw server log not retained), not evidence counted as a replay.

## L3 replay (real model)

- Request ID `replay-l3-e80e6dd5f48647eea88f21ad0a166f54`; HTTP 200; 67.12 s.
- Actual answer route in this rerun: **Ollama `ollama/llama3.1:8b`**. The
  prior a032 replay used DeepSeek fallback after Ollama produced no tokens;
  both are within the declared profile. The current run did not need the
  fallback.
- Answer: `The launch code for project Zephyr-9 is **QUARTZ-77**.` with the
  uploaded `l3_zephyr9_fixture.txt` source. No `BASALT-13`, no `Owner:`/
  `Team:` volunteered text.
- Interpretation: one structured dispatch, HTTP 200; required-read plan leg
  canceled after 20 s but did not block the answer. Verify panel was skipped
  with 6.6 s remaining (the finalization reserve worked).
- The fallback finished inside the 95 s budget; no duplicated partial tokens
  were observed.

## S3 replay (real model)

- Request ID `replay-s3-ab164f5323d7436a99c5f5f248e55bd9`; HTTP 200; 61.86 s.
- Actual answer route: **Ollama `ollama/llama3.1:8b`**.
- Interpretation: one `[structured-dispatch]` (2949 prompt chars, cap 5500,
  `attempt=1`), one successful `[structured-trace]` (30.5 s,
  `_Interpretation`). A **400 response is present in the slice immediately
  before the 200**, but the slice does not preserve its body and there is no
  second dispatch. We therefore record the 400 without claiming that it was
  a compatibility retry or a second attempt.
- Required-read/plan leg canceled at 20 s (`worker_may_still_run=true`).
- Answer is the honest partial: approved record retrieved, comparison not
  completed, draft expiration 2026-12-31, broader obligation OPEN.
- No OpenRouter destination; no timeout.

## Full-rehearsal finding (attempt 7, after the replay)

The first full rehearsal after the a032 replay failed S3 with
`comparison_untruthful` and the literal reply “I'll manage those tasks for
you.” The log records
`Unified conversational response failed: cannot access local variable
'_chain_query' where it is not associated with a value`; the fallback task
message shipped. `_chain_query` was assigned only on one branch. This is a
latent production bug exposed by the S3 path, not a replay artifact. It is
fixed by initializing `_chain_query = ""` at the response-function scope.
The L3 answer in that attempt also carried an inline `[ingested]` excerpt;
the answer boundary now drops a leading paragraph containing it when a
later answer paragraph exists. These are the only product changes from this
batch; a fresh rehearsal is required and has not yet been counted.

## Budget edges

- `_interpretation_wait_seconds` returns **0** when the 35 s reply/finish
  reserve exhausts the remaining budget.
- The caller skips the provider call and preserves a request-bound
  `stage_budget_exhausted` unresolved record with empty actions/sources and
  the deterministic floor; telemetry `stage_budget_exhausted` increments.
- Tests: enough budget starts; exhausted reserve returns 0; a staged timeout
  returns the explicit record; a late worker's success does not mutate the
  returned decision. 18 focused tests pass.
- **The outer deadline bounds waiting.** It does not establish that
  synchronous HTTP workers stop after cancellation; the trace explicitly
  records `worker_may_still_run=true` for canceled plan calls.

## Limits

- One replay each; S3's 69.25 s success does not establish a latency tail.
  The prior 85 s timeout is represented by the verify-panel/finalization
  reserve control, not by this single success.
- The L3 fallback used DeepSeek (declared); S3 used Ollama. Both are within
  the declared supported profile. Local-only operation would require a
  separate profile and is not claimed.

## Evidence

`release_evidence_20261023/replay_captured/` — result, transport per
request, wrong-route diagnostic-invalid record, checksums.
