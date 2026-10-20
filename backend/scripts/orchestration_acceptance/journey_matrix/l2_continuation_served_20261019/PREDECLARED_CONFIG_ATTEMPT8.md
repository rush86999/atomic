# L2 continuation evidence — served acceptance ATTEMPT 8 (2026-10-19)

**Declared BEFORE the attempt. One attempt. No mid-run repairs.**
S7 scope-contract successor.

## Candidate

`23f3455f717e479ee3fa4b98a024e07baa212834` (parent `65b63494e`; tree
clean). Required five-value `scope_change` Literal; explicit unresolved
valid; distinct rejection reasons `missing_scope`/`invalid_scope`/
`scope_unresolved`/`no_actions_proposed`; scratch capture enabled for
this run (`ATOM_TURN_INTERPRET_CAPTURE=1`, no message/source/credential
content). Prompt distinguishes established-conversation follow-up
(`continue`, even after a completed prior turn) from unfinished-work
resume and genuinely ambiguous references (`unresolved`), never mapping
uncertainty to continue. S3 deterministic/coverage repair unchanged.
Local: focused 87 passed; neighbors 570 passed + 2 pre-existing
TestEditPlanRungKnob.

## Configuration / job

Same as attempts 1–7, fresh port **8103**, scratch stores; same fixture,
draft in the original S7 state, original S3 comparison then original S7
continuation. Pilot/live DB guarded.

## Predeclared acceptance

- S3: deterministic renderer alone, verified `2026-12-31` match, terms
  mismatch or explicit terms limitation with broader obligation named,
  no global consistency claim, no corrective model call, zero writes,
  draft unchanged, agreement.
- S7: interpretation must return one of the five scopes (expected
  `continue` for the established-conversation follow-up), requirement
  resolved to `approved_records_q2026_114.txt`, settlement validated,
  truthful content, zero writes, draft unchanged, fresh-history
  agreement. If the producer omits/invalidates scope, the attempt is
  preserved with the specific rejection reason and no promotion.
- Total latency within 95 s; live DB unchanged; pilot untouched.
