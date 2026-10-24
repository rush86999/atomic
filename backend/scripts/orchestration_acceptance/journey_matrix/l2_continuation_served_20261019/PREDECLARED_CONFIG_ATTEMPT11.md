# L2 continuation evidence — served acceptance ATTEMPT 11 (2026-10-19)

**Declared BEFORE the attempt. One attempt. No mid-run repairs.**
S7 request-bound comparison-scope successor (field-scope repair).

## Candidate

`c0cbea9f1` (parent
`b70f9fa65`; tree clean). Required five-value `scope_change` Literal;
required `actions` with a required action `kind` from the authoritative
six-kind vocabulary; at least one action for a resolved scope; explicit
`unresolved` valid without an invented action. Rejection reasons
`missing_scope`/`invalid_scope`/`scope_unresolved`/`no_actions_proposed`/
`missing_action_kind`/`invalid_action_kind` are classified even when
archival capture is off. Capture is content-free and enabled for this
run (`ATOM_TURN_INTERPRET_CAPTURE=1`): request id, phase, scope
presence/value or invalid marker, action count, recognized kinds or
invalid/missing markers, rejection reason. Schema/decode failures cannot
bench a provider as quota exhaustion. S3 deterministic/coverage repair
unchanged.

Field-scope repair on top of attempt 10: `accepted_comparison_scope`
requires the accepted **requested-fields contract** to name OTHER fields
("all comparable quotation fields", "any differing fields") before a
comparison is broad. A generic difference constraint about the requested
date ("flag anything that differs") is not by itself a field expansion.
Explicit narrowing/negation still wins. Attempt 10's served S7
interpretation carried exactly that generic constraint with date-scoped
requested fields; the adapter expanded it to `payment_terms`/`price` and
S7 settled `partial`, failing `s7_date_only_not_completed`. S3's
"any differing fields" remains a broad contract and must stay
partial/open in its own row.

Local evidence before freezing: focused **152 passed**; neighbors
**599 passed + 2 pre-existing TestEditPlanRungKnob**; budget/fallback
**88 passed + the same 2 pre-existing BPC failures reproduced on the
parent**. Mutation controls restoring the gap-suppression
`and not validated` and the builder search guard both fail as expected.
Added served-contract controls for both sides (attempt-10 S7 constraints
+ date-scoped fields -> narrow; attempt-10 S3 fields -> broad; broad
fields + narrowing -> narrow).

## Configuration / job

Same as attempts 1–10: fresh port **8106**, scratch stores; same fixture,
draft in the original S7 state, original S3 comparison then original S7
continuation. Pilot/live DB guarded. No L1/L3 changes, no pilot
deployment.

## Predeclared acceptance

- S3: deterministic renderer alone, verified `2026-12-31` match, terms
  mismatch or explicit terms limitation with broader obligation named,
  no global consistency claim, no corrective model call, zero writes,
  draft unchanged, agreement. S3's accepted contract names differing
  fields, so its broader comparison obligation must remain open/partial
  and must not be copied into S7.
- S7: interpretation must return a resolved scope (expected `continue`)
  with at least one supported read-only action, requirement resolved to
  `approved_records_q2026_114.txt`; the date-only accepted contract must
  stay narrow — including when the accepted interpretation carries a
  generic difference constraint — and yield a completed settlement with
  `context_fulfillment=completed`; the reply must be truthful, zero
  writes, draft unchanged, fresh-history agreement. If the accepted
  requested-fields contract explicitly names other fields, S7 must
  remain partial with the gap named even when the search receipt is
  complete. No synthesis or widened deadline.
- Total latency within 95 s; live DB unchanged; pilot untouched.
