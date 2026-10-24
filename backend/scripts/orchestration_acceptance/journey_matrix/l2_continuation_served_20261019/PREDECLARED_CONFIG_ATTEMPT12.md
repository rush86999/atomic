# L2 continuation evidence — served acceptance ATTEMPT 12 (2026-10-19)

**Declared BEFORE the attempt. One attempt. No mid-run repairs.**
Field-scope repair successor on the DeepSeek direct API (declared provider
substitution; candidate unchanged).

## Why the provider changed

Attempt 11 (`c0cbea9f1`) was environment-blocked before the field-scope
repair could be exercised at S7: every opencode-go interpretation call
returned HTTP 429 `GoUsageLimitError` (monthly workspace quota). Operator
direction: run the successor on the DeepSeek direct API. The candidate
code is unchanged; only the declared provider route changes.

Pre-run dispatch probe (NOT an acceptance attempt; evidence
`probe_deepseek_dispatch.json`): product key registration HTTP 200 for
provider `deepseek` (operator vault row
`tenant_default_deepseek_default_production`, direct route
`https://api.deepseek.com/v1`); the discovered DeepSeek catalogue serves
2 identifiers (`deepseek-flash`, `deepseek-v4-pro`); the interpretation
dispatch reached `deepseek/deepseek-v4-pro` and produced a schema-valid
record (`origin=llm:deepseek-v4-pro`, `scope_change=continue`, one
`research` action, `confidence=0.8`). Interpretation is declared pinned
to `deepseek:deepseek-v4-pro` (preference; the wrapper still retries
unpinned if the pin fails).

## Candidate

`c0cbea9f1` (parent
`b70f9fa65`; tree clean). Required five-value `scope_change` Literal;
required `actions` with a required action `kind` from the authoritative
six-kind vocabulary; at least one action for a resolved scope; explicit
`unresolved` valid without an invented action. Rejection reasons
`missing_scope`/`invalid_scope`/`scope_unresolved`/`no_actions_proposed`/
`missing_action_kind`/`invalid_action_kind` are classified even when
archival capture is off. Capture is content-free and enabled for this
run (`ATOM_TURN_INTERPRET_CAPTURE=1`). Schema/decode failures cannot
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
Independent review of the candidate change (attempt-11 cycle) returned
PASS with no HIGH findings; served-contract controls cover attempt-10 S7
(narrow) and S3 (broad). The pre-run DeepSeek probe above is the only
new configuration evidence.

## Configuration / job

Fresh port **8108**, fresh scratch world
`l2-continuation-served-attempt12`; declared provider **DeepSeek direct**
(`https://api.deepseek.com/v1`), interpretation pin
`deepseek:deepseek-v4-pro`; same fixture, draft in the original S7 state,
original S3 comparison then original S7 continuation. Pilot/live DB
guarded. No L1/L3 changes, no pilot deployment.

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
