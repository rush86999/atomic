# L2 continuation acceptance — ATTEMPT 10 (2026-10-19)

**Status: NOT PROMOTED.** The settlement-gap suppression repair and the
S3/S7 scope distinction worked: S3 stayed partial with its broader
comparison open, and S7's delivered partial reply was truthful with zero
writes. One predeclared acceptance check failed: the date-only S7
follow-up settled `partial` instead of `completed`, because the accepted
interpretation carried the prior turn's generic difference constraint and
the adapter treated it as a broad field contract.

## Candidate

- `b70f9fa65ace13b59c8ebadd1ffcd968f2f033a1` on
  `codex/l2-continuation-evidence` (tree clean).
- Port **8105**, fresh scratch world `l2-continuation-served-attempt10`;
  pilot `:8001`/`:3000` and the live DB were guarded before/after.

## Served result

| Stage | Outcome | Context | Scope | Requirement fields | Broader |
|---|---|---|---|---|---|
| S3 | partial | partial | continue | expiration_date | true |
| S7 | **partial** | **partial** | continue | expiration_date | **true** |

S3: verified deterministic comparison; expiration date matches;
payment terms and price have no verified value; broader comparison
declared open; zero writes; `s3_broader_obligation_open=true`.

S7: verified source identity, truthful partial reply, zero new writes,
draft unchanged, fresh-history agreement true. The new
`s3_broader_obligation_open` and `s7_resolved_source_identity` checks
passed.

## The failing check

`s7_date_only_completed=false` (first failure
`s7_date_only_not_completed`).

The S7 request is date-only:

> What is the current Valid until date on the draft, and does it still
> match the approved record?

The accepted interpretation nevertheless returned:

- constraints: `["Do not change anything yet.", "Flag anything that differs."]`
- requested fields: date-scoped (`current Valid until date`, `approved
  record Valid Until date`, `whether the draft date still matches`,
  `any date difference`)

The stash treated the generic `Flag anything that differs` constraint as
a broad field request. The comparison therefore expanded to
`expiration_date`, `payment_terms`, `price`; terms/price were absent, so
both `requirement.broader_comparison` and the S7 settlement stayed
partial. The missing work was correctly named and not suppressed — the
new gap processing worked — but the obligation should not have applied to
this date-only follow-up.

## Repair after attempt 10

`accepted_comparison_scope` now requires the accepted **requested-fields
contract** to name other fields (`all comparable quotation fields`, `any
differing fields`) before a comparison is broad. A generic difference
constraint about the requested date ("flag anything that differs") is not
by itself a field expansion. Explicit narrowing still wins. Added
served-contract controls for both sides:

- attempt-10 S7 constraints + date-scoped fields -> narrow;
- attempt-10 S3 fields (`any differing fields`) -> broad;
- broad fields + narrowing -> narrow.

Focused **152 passed**; neighbors **599 passed + 2 pre-existing
`TestEditPlanRungKnob`. Mutation controls for the gap-suppression block
and the builder search guard fail when restored.

## Decision

- Attempt 10 is preserved with its specific failure; no promotion.
- No matrix change; L1/L3 and pilot untouched.
- The next successor freezes the field-scope repair and runs the same
  unchanged S3→S7 workflow once.
