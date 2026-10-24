# Attempt 2 — edit-result extraction correction (2026-10-20)

The preserved attempt-2 result (`attempt2_result.json`, sha256
`8c9dcf7826ee1ec7bce1c59b1bd701e6f3eaff45ad785af622cc3038ec1349c6`)
was not rewritten. Only the extraction was corrected.

## What was wrong

`task_of(step)` returned `execution.task_summary`, whose projection drops
`mutation`. The edit therefore evaluated `edit_settled_completed=false`
even though the durable row carried the mutation:

```json
"mutation": {"readback_matched": true, "requested": true, "status": true}
```

The served receipt also carried `outcome=completed`,
`postcondition_verified=true`, and `updated=true`.

## Correction

`task_of(step)` now starts from `execution.task_summary` and fills gaps
from the preserved `execution.row.task_outcome` with `setdefault`
(summary values win; the row only supplies fields the summary omitted).
This is additive: no check was weakened and the raw attempt-2 result is
untouched. The restart execution check now reads the flattened
`exec_brief` records that the restart step actually stores; it stays
false only because S7 independently settled `unconfirmed`, and the
edit/re-ask halves are asserted satisfied.

## Verification

Re-extraction from the preserved result:

- `edit_task["objective_met"] == true`
- `edit_task["mutation"]["readback_matched"] == true`
- served receipt `outcome=completed`, `postcondition_verified=true`,
  `updated=true`
- `edit_settled_completed` evaluates **true** with the corrected
  extraction.

Command and result:

```
cd backend
TESTING=1 python3 -m pytest tests/test_attempt2_edit_extraction.py -q
# 1 passed
```

Regression: `backend/tests/test_attempt2_edit_extraction.py`.

Files touched by the correction:

- `run_composed_served_attempt2.py` (`task_of`, restart execution check)
- `backend/tests/test_attempt2_edit_extraction.py`
