# Attempt 5 — repaired successor (L3 boundary + S7/restart)

**Verdict: NOT PASSED. 57/59 declared checks; first failure
`comparison_broader_not_open`. No promotion, no deployment. One launch;
no retry, provider switch, deadline increase, or gate relaxation.**

Attempt 4 remains preserved and non-passing. This run used product
`22af424a0` (simplified answer boundary + canvas-evidence fix) and the
successor gate harness `f2f832997` (per-run prior identity + partial-aware
restart).

## Run identity

- Product: `22af424a07d84a21c62eb7bb97046d98a01d3d14`
- Launch HEAD / harness: `8528ad03c8aa49d1d6fac7019d3c12d99099cf71`
- Frozen gate harness: `f2f8329971129bc14e9f107aa234b98db7f18379`
  (product tree equal to the pin; source hashes matched)
- Scratch world: `.../l2-fix/scratch/l1-l2-l3-composed-attempt5`;
  port `8115`; pilot `:8001` untouched
- Preflight before launch: **42/42 checks**, **74 focused tests**
- Runtime identity: cwd candidate backend, `git_commit=8528ad03c8aa`,
  `dirty=false`
- Live DB: `live_db_unchanged=true`, `live_db_isolated=true`, row counts
  unchanged; scratch process held no live DB/WAL/SHM; pilot untouched.

## Results by leg

### L3 — passed the declared answer contract

`l3_answer_correct=true` (`QUARTZ-77` present, `BASALT-13` absent), the
`documents.grep` receipt was verified complete and bound, objective met,
settlement completed. The simplified boundary fixed the wrong-subject
fallback and the decoy leak.

Residual: the reply still begins with an internal
`LIVE TOOL RESULTS — regex scan over the WHOLE stored tree ...` block.
The boundary removes the `LIVE TOOL RESULTS (` header shape but not this
em-dash grep variant; the L3 gate passes because the block contains no
decoy. This is a remaining user-facing envelope leak to correct in the
next small batch.

### Edit and identical re-ask — passed

One audit write, body applied, other fields preserved; re-ask no-op
(`already_satisfied`) with zero additional writes and no body change.

### S3 comparison — first broken transition

The S3 requirement was captured narrow (`broader_comparison=false`), so
`comparison_broader_obligation_open` and `comparison_requirement_captured`
are false; classification `comparison_broader_not_open`. The turn also
says the approved record indicates **2027-03-31**, while the uploaded
approved record says **2026-12-31**. That is a fabricated approved date.

`comparison_truthful_date` and `comparison_no_false_date` are **true**
because the predeclared wrong-date set does not include `2027-03-31`.
This is a gate false positive (new wrong date outside the declared list),
not a pass; the first failure is the broader-obligation gate. No gate was
relaxed; this is recorded for the next correction batch.

### S7 date-only continuation — passed the repaired gates

Settled `partial` / `success=true`, correct verified date
(`2026-12-31 = 2026-12-31`), zero writes, unchanged draft. The dynamic
capture worked:

```
gate_basis:
  open_work_source: structured
  expected_prior_source: durable_task_record_before_s7
  expected_prior_count: 1
  structured_open_count: 1
```

`continuation_date_only_completed`, `continuation_source_resolved`,
`continuation_settlement_basis`, and `continuation_history_agreement` are
all true. The per-run UUIDs were captured from this run, not the
attempt-3 constants.

### Restart — passed partial-aware agreement

`restart_history_agreement`, `restart_zero_new_writes`,
`restart_canvas_unchanged`, and `restart_execution_persists` are true.
The reload reproduced the accepted partial S7 outcome exactly.

## Failed checks (2 of 59)

- `comparison_broader_obligation_open`
- `comparison_requirement_captured`

## Decision

No retry was performed. No provider was switched, deadline increased, or
gate relaxed. The first broken transition is the S3 comparison scope/
capture, with a fabricated approved date that the current truthfulness
gate does not recognise. The L3 grep-header envelope is a residual
boundary leak. Both are recorded for a future small correction batch.
Deployment remains held; no promotion, merge, or publication to `main`.

## Evidence

`attempt5_preflight.json`, `attempt5_config.json`,
`attempt5_result.json`, `attempt5_summary.json`, `attempt5_run.log`,
`attempt5_server_pre.log`, `attempt5_server_restart.log`,
`attempt5_observation_pre.jsonl`,
`attempt5_observation_restart.jsonl`,
`attempt5_interpreter_freeze.txt`, `ATTEMPT5_RESULT.md`,
`CHECKSUMS_ATTEMPT5.sha256`, `PREDECLARED_CONFIG_ATTEMPT5.md`,
`run_composed_served_attempt5.py`, `preflight_attempt5.py`,
`successor_gates.py`, `server_observe.py`.

Attempt 3/4 evidence remains unchanged; the rejected pre-launch guard run
(before any server/turn) is preserved outside the worktree.
