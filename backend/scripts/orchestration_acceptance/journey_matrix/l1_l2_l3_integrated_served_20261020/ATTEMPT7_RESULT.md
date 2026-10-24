# Attempt 7 — verified composed L1+L2+L3 workflow

**Verdict: PASSED. 59/59 declared checks. Classification
`verified_l1_l2_l3_composed_workflow`. No promotion or deployment yet;
the release candidate is frozen and the deployment package follows.**

Attempts 3–6 remain preserved; attempt 6 was 58/59 with only the L3
full-text echo. This run used product `910bf85a6` (line-numbered VFS
excerpts treated as internal evidence) and gate harness `f2f832997`.

## Run identity

- Product: `910bf85a6dd32f7026f28df2e4380110bd463c50`
- Launch HEAD / harness: `c2f8994956a488fbe399e80177d3755703847846`
- Scratch world `:8117`; pilot `:8001` untouched
- Preflight: 44/44 checks; 80 focused tests
- Runtime identity: `git_commit=c2f8994956a4`, `dirty=false`
- Live DB: `live_db_unchanged=true`, `live_db_isolated=true`; pilot
  untouched.

## Verified legs

- **L3** (47.42 s): `documents.grep` receipt verified complete and bound;
  objective met, settlement completed; answer `QUARTZ-77`, no
  `BASALT-13`, no full-text excerpt; no canvas created.
- **Edit** (17.73 s): exactly one audit write, body applied, other fields
  preserved, postcondition verified.
- **Identical re-ask** (23.51 s): no-op `already_satisfied`, zero
  additional writes, body unchanged.
- **S3 comparison** (94.58 s, within the 95 s budget): broad comparison
  requirement captured (`broader_comparison=true`); the comparison was
  not recorded, so the answer is the draft-grounded limitation with
  `Broader comparison obligation: OPEN`. All S3 gates pass: truthful
  date, no false date/global claim, broader open, zero writes, draft
  unchanged, settlement basis, requirement captured, history agreement.
- **S7 continuation** (60.1 s): per-run prior obligation captured before
  S7; honest partial with date `2026-12-31 = 2026-12-31`; source resolved;
  settlement/history agreement.
- **Restart**: exact partial-aware agreement, zero new writes, canvas
  unchanged, durable executions persist.

## Decision

This is a verified local pilot workflow on one integrated build and one
declared configuration. Deployment is still separate: the live pilot
cutover remains subject to the explicit hold and the release package.
No provider was switched, deadline increased, or gate relaxed.

## Evidence

`attempt7_preflight.json`, `attempt7_config.json`,
`attempt7_result.json`, `attempt7_summary.json`, `attempt7_run.log`,
server/observation logs, interpreter freeze, this report, and
`CHECKSUMS_ATTEMPT7.sha256`.
