# Attempt 6 — comparison truthfulness and carrier-shape repairs

**Verdict: NOT PASSED. 58/59 checks; only failure
`l3_answer_correct`. S3, S7, and restart all passed. No promotion, no
deployment. One launch; no retry or gate relaxation.**

Attempt 5 remains preserved and non-passing. This run used product
`e99413843` (broad comparison scope, draft-grounded missing-comparison
limitation, all internal carrier header shapes) and gate harness
`f2f832997`.

## Run identity

- Product: `e994138432164dbec1befbec17306ade21118450`
- Launch HEAD / harness: `d8654cf0093910f5d7ce8ee17d4860eb93ac458c`
- Scratch world `:8116`; pilot `:8001` untouched
- Preflight: 43/43 checks; 78 focused tests
- Runtime identity: `git_commit=d8654cf00939`, `dirty=false`
- Live DB: `live_db_isolated=true`, row counts unchanged; pilot
  untouched.

## Results

- **L3 — only failure.** The reply model echoed the knowledge-VFS
  line-numbered full text:
  `L1: ... L5: Decoy: ... BASALT-13`, then the correct conclusion.
  `l3_answer_correct` is false because the decoy appears in the
  user-facing content; `l3_untruthful_answer` is the classification.
  The internal carrier was not the `LIVE TOOL RESULTS` header, so the
  boundary at this product revision did not remove it.
- **S3 — passed.** Broad comparison scope was recovered from the user's
  "Flag anything that differs"; the missing-comparison limitation was
  draft-grounded:
  "I retrieved the retrieved source, but the comparison itself was not
  recorded this turn ... The draft's expiration date is 2026-12-31.
  Broader comparison obligation: OPEN — the source value was not
  verified this turn."
  All S3 gates (truthful date, broader obligation open, settlement
  basis, requirement captured, no false date, history agreement) passed.
- **S7 — passed.** Per-run prior obligation captured before S7; honest
  partial date 2026-12-31 accepted; source/settlement/history true.
- **Restart — passed.** Partial-aware exact agreement, zero-write,
  canvas unchanged, execution persists.
- Edit and identical re-ask passed.

## Decision

No retry, provider switch, deadline increase, or gate relaxation. The
only remaining defect is the line-numbered VFS excerpt echo, which the
successor treats as an internal evidence carrier. Attempts 3–6 evidence
is preserved. Deployment remains held.

## Evidence

`attempt6_preflight.json`, `attempt6_config.json`,
`attempt6_result.json`, `attempt6_summary.json`, `attempt6_run.log`,
server/observation logs, interpreter freeze, this report, and
`CHECKSUMS_ATTEMPT6.sha256`.
