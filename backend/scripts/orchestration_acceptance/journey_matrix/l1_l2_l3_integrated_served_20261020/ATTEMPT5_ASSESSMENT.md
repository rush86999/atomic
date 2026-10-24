# Attempt-5 successor assessment (executed)

**Status: NOT PASSED. 57/59 declared checks; first failure
`comparison_broader_not_open`. One launch; no retry, provider switch,
deadline increase, or gate relaxation. Deployment remains held.**

The repaired S7/restart gates passed: the per-run prior obligation was
captured from this run's durable record, the S7 honest partial was
accepted, and restart agreement reproduced it exactly. The simplified
L3 boundary passed the declared answer contract (no decoy) but the grep
header `LIVE TOOL RESULTS — regex scan...` is still a user-facing
internal-envelope leak. S3 failed the broader-obligation/scope gates and
reported the approved valid-until date as `2027-03-31` although the
approved record says `2026-12-31`; the current wrong-date gate does not
recognise that value. See `ATTEMPT5_RESULT.md`.

Attempt 4 is preserved unchanged: `attempt4_result.json`,
`attempt4_summary.json`, server/observation logs, and
`ATTEMPT4_RESULT.md` still verify against `CHECKSUMS_ATTEMPT4.sha256`.

## Corrections

### S7 prior obligation — per run, not historical UUIDs

The old gate pinned the attempt-3 `question_id` / `source_operation`.
Those identities are generated per run, so attempt 4's honest partial
(correct date, delivered, objective_met, only the prior S3 verification
open) was rejected. The successor captures the durable open obligations
from **this run between S3 and S7** and passes them as `expected_prior`;
actual S7 open questions must match that captured identity. An obligation
created only by S7 cannot bootstrap itself; the bounded text fallback is
unchanged and disclosed. Cross-run tests use two different generated UUID
sets.

### Restart agreement — exact, partial-aware

The old runner required `outcome == "completed"`, so the reviewed honest
partial failed `restart_history_agreement` even though the reload
reproduced it. The successor requires exact agreement with the accepted
pre-restart outcome, success, content, execution identity, status, and
delivery record. `completed` and the reviewed `partial` are both
legitimate; an arbitrary partial fails because the S7 gate must have
accepted it. Tests cover completed, reviewed partial, arbitrary partial,
and each mismatched field.

### L3 answer boundary (simplified after the wrong-subject reproduction)

The preserved attempt-4 response proves served == persisted == reloaded:
the internal `LIVE TOOL RESULTS` echo came from reply generation and
passed through finalization unchanged. `core.answer_boundary` now does
only envelope removal plus a structured fallback: substantive prose is
preserved unchanged; a fallback renders only a unique structured
subject → field → value → source association, otherwise an explicit
limitation. Word-overlap ranking and token presence were removed as
authority after the wrong-subject reproduction. Controls cover the
wrong-subject fallback, captured envelope-only limitation, prose with
both codes (preserved but rejected by the real L3 contract), changed
identifiers, two subjects/explicit both, ordinary quotations, the real
final-return path, and the canvas empty/conflicting-context cases.

### S3 figure grounding

The preserved log shows `$48,000.00` flagged at 92.1 s with only 2.9 s
left, followed by the time-budget reply. The route had resolved the
canvas and passed it as `canvas_context`; the guard read only the local
`_canvas_ctx`, which is empty for a fresh comparison conversation. The
successor serializes both contexts, skips empty serializations (an empty
local content no longer shadows the resolved route context), refuses to
silently choose between conflicting canvas identities/revisions, and
checks attribution: the draft-supported figure passes, while a
source-unsupported or misattributed figure still triggers correction.
The 95-second turn budget is unchanged.

## Local verification (no campaign)

- `test_successor_s7_gates.py`: 37 passed (cross-run UUIDs, S7-created
  obligation rejection, honest partial, arbitrary partial, restart
  exactness, captured pre-fix rejection).
- `test_attempt4_repairs.py`: 28 passed (captured L3 boundaries/envelope,
  changed subject/code, multiple subjects, both-request, wrong decoy,
  ordinary quotation, captured S3 canvas replay, source attribution,
  unsupported figure, normalization, 95 s budget, zero-write controls,
  boundary wiring).
- `test_s3_s7_captured_replay.py`: 9 passed (product replay).
- Combined focused run: **74 passed**.
- `preflight_attempt5.py`: **42/42 checks passed** at harness HEAD
  `d3dec19a5` (product `22af424a0`, gate harness `f2f832997`, gate module
  `a0b2f748…`): intended pin accepted, obsolete attempt-4 hash rejected,
  product tree equal to the pin, source/gate hashes match, attempt 3/4
  evidence checksums preserved, fresh scratch/artifact paths, pilot and
  credential checks pass, and the three focused suites pass.

## Pre-launch guard rejection (not a campaign)

The first launch attempt was rejected by the product source-hash guard
before any server started or turn ran: the expected set included the new
`answer_boundary` file but the cfg builder omitted it. The hash builder
is now centralized and preflight asserts every expected key is present;
the rejected-launch log is preserved outside the worktree. No user turn,
provider call, or acceptance result was produced by that launch.

## Attempt-5 outcome

The run used product `22af424a0` and harness/launch HEAD `8528ad03c`;
preflight was 42/42 and 74 focused tests passed. 57 of 59 gates passed:

- **Passed:** L3 answer contract, edit, re-ask, S7 date/source/settlement
  (dynamic expected prior), restart agreement/zero-write/persistence.
- **Failed:** `comparison_broader_obligation_open`,
  `comparison_requirement_captured` (first failure
  `comparison_broader_not_open`).
- **Product finding:** S3 fabricated `2027-03-31` as the approved date;
  `comparison_truthful_date` and `comparison_no_false_date` are a gate
  false positive because the predeclared wrong-date set does not contain
  it.
- **Boundary residual:** the em-dash grep envelope is not removed by the
  parenthesis-only header match; no decoy leaked and the L3 contract
  passed.

No retry was performed. The next correction batch is S3 scope/date
grounding plus the grep-header boundary shape; deployment and the
integrated workflow remain held.
