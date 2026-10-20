# L2 continuation-evidence — served acceptance ATTEMPT 3 (2026-10-19) — NOT PASSED (completion within deadline)

**What this is.** The predeclared S3→S7 repeat on the bounded
execution-policy successor
**`10982e8390815ee394c853284d5accfd3e3ddee7`** (parent `2604dea2d`;
producer correction + `disable_reasoning=True`, explicit
`max_tokens=5500`, `route_trace_id=turn_interpretation:{request_id}`,
`allow_moa=False`; the 12-second deadline, routing, authenticated scope
and source-resolution contract unchanged). Attempts 1 and 2 are preserved
unchanged.

**Result: NOT PASSED.** Both interpretation calls dispatched and were
cancelled at the 12-second deadline; the producer correction was again
never exercised, and the S3 narration error recurred. No promotion.

## Stage record (predeclared)

| Stage | S3 | S7 |
|---|---|---|
| `dispatch_attempted` | ✔ `opencode-go/glm-5.3-flash` route=`turn_interpretation:l2-s3-7cb48b19…` cap=5500 prompt_chars=2187 | ✔ `opencode-go/qwen3.8-flash` route=`turn_interpretation:l2-s7-bd0a4ece…` cap=5500 prompt_chars=2435 |
| `completed_within_deadline` | ✗ `[structured-cancelled] … waited=11.9s worker_may_still_run=true`; `[turn-interpretation] timeout` | ✗ `[structured-cancelled] … waited=12.0s worker_may_still_run=true`; `[turn-interpretation] timeout` |
| `producer_output_valid` | ✗ not reached (`origin=unresolved`, reason `timeout`, sources `[]`) | ✗ not reached |
| `source_identity_resolved` | n/a | ✗ requirement `required=false`, `sources=[]`, identity `kind_only` |

**The policy settings reached the dispatch**: both calls show `cap=5500`
and the `turn_interpretation:<request_id>` route trace, and the served log
contains no reason-mandatory rejection/retry for these pairs. Completion
still exceeded 12 s (both cancels at ~12 s, no `[structured-trace]` for
the interpretation routes). The latency hypothesis was applied and is
**not sufficient on these routes**; the producer correction remains
unverified through the served path. The worker may still have been running
when the caller returned — the attempt did not wait for or consume any
late result.

## Content failures

- **S3 narration fidelity recurred (separate correctness failure).** The
  retrieved excerpt carried `Approved valid until: 2026-12-31`; the reply
  claimed the approved record specifies `2023-01-01` and that the values
  do not match. The first divergence is again narration, not retrieval.
  No date regex or retrieval-success certification is added.
- **S7 content** was correct (`2026-12-31`, matches, no discrepancy), but
  with no requirement captured (`required=false`) and settlement
  `unconfirmed`/`success=false`, it is not certified; the S7 gates fail.

## Guards

- Zero canvas writes / draft unchanged for both turns; S3 and S7
  response/persisted-row/fresh-history agreement true.
- `live_db_unchanged` true this attempt; `pilot_untouched` true
  (`:8001` same pid/instance/started_at; `:3000` listening).
- Runtime identity: candidate cwd/commit `10982e839081`, dirty=false.

## Checks (22; 15 pass, 7 fail)

Failed: `real_interpretation_dispatched`, `s3_truthful_comparison`,
`s7_requirement_captured`, `s7_resolved_source_identity`,
`s7_settlement_basis`, plus the same S3/S7 consequences as attempt 2.
First failure `interpretation_not_real_or_not_dispatched` — corrected by
the stage record to **dispatch succeeded, completion within the deadline
failed**.

## Disposition

L2 remains open; nothing is promoted. The producer correction and the
execution-policy change are both unverified by served evidence. A further
run needs an owner decision on the completion budget/model/route (or a
longer declared deadline), not another unchanged repeat. L1/L3 and the
pilot are untouched.

## Files

- `PREDECLARED_CONFIG_ATTEMPT3.md`, `run_l2_served_attempt3.py`.
- `attempt3_config.json`, `attempt3_result.json`,
  `attempt3_observation.jsonl`, `attempt3_server.log`,
  `attempt3_interpreter_freeze.txt`.
- `summary_attempt3.json` (includes the per-turn stage record).
- `CHECKSUMS_ATTEMPT3.sha256`.
- Attempts 1/2 files remain byte-identical and checksum-valid.
