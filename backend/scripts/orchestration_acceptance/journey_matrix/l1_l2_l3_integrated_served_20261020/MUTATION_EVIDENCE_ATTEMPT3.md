# Mutation evidence — required read after planning timeout (2026-10-20)

Product commit: `2a113d1a3` on `fix/l3-required-read-timeout`.
Tests: `backend/tests/test_source_ask_tool_execution.py`
(class `TestRequiredReadSurvivesPlannerTimeout`).

## Behavioral control (in-test)

`test_outer_timeout_without_enforcement_keeps_no_receipt` calls the real
orchestrator with `disable_required_read=True`, which replaces
`enforce_required_read` with a no-op. This restores the old ordering's
outcome and **passes only if the required receipt is absent**.

Command:

```
TESTING=1 python3 -m pytest tests/test_source_ask_tool_execution.py -q \
  -k "outer_timeout_without_enforcement"
```

Observed: `1 passed` (part of the 13-test focused run; the mutation
control asserts the old no-receipt shape rather than a green result).

## Literal source mutation

A temporary edit inserted `return proposal` at the start of
`enforce_required_read` in `backend/core/chat_tool_planner.py`, disabling
both the planner-side enforcement and the caller-side fallback. No other
file was changed.

Command:

```
TESTING=1 python3 -m pytest tests/test_source_ask_tool_execution.py -q \
  -k "optional_planning_timeout_still_executes or \
      outer_plan_wait_timeout_still_executes"
```

Observed:

```
FAILED tests/test_source_ask_tool_execution.py::TestRequiredReadSurvivesPlannerTimeout::test_outer_plan_wait_timeout_still_executes_document_read
E   AssertionError: outer planner cancellation must not lose the accepted document read; receipts=[]
    assert []
1 failed, 1 passed
```

The optional-planning test still passes under this mutation because its
path reaches the source-ask floor before enforcement; the outer
whole-plan cancellation test is the exact attempt-2 shape and fails with
no receipt. This locates the fix at the required-read enforcement /
caller fallback, not at the floor alone.

The file was restored and its sha256 re-checked:

```
94f7ec112273513374e3401690e14038eff3c9d83849b88d9527ce9e6ec2dd79  backend/core/chat_tool_planner.py
```

`git diff --stat` was empty after restoration.

## Restored run

```
TESTING=1 python3 -m pytest tests/test_source_ask_tool_execution.py -q \
  -k "optional_planning_timeout_still_executes or \
      outer_plan_wait_timeout_still_executes or \
      outer_timeout_without_enforcement"
```

Observed: `3 passed, 10 deselected`.

## Served evidence

In the governed attempt 3 (`attempt3_result.json`), the L3 turn hit the
same seam and still executed the required read:

- `attempt3_server_pre.log:1227`:
  `tool planner: optional structured planning timed out after 20.0s; required-read enforcement continues`
- `attempt3_server_pre.log:1242`:
  `tool plan executed: documents.search:the launch code for project Zephyr-9`
- Durable receipt: `documents.grep`, `match_count=1`,
  `coverage=complete`, verified; bound to the L3 execution and
  workspace; settlement `completed`.

This is the behavioral proof at the served boundary; the literal
mutation above is the control showing the old ordering loses that read.
