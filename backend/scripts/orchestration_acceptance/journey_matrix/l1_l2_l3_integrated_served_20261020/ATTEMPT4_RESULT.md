# Attempt 4 — corrected runtime (b0bee5dbf + frozen gates)

**Verdict: NOT PASSED. 50/59 declared checks; first failure
`l3_untruthful_answer`. No promotion, no deployment. One launch; no
retry, no provider switch, no deadline increase, no gate relaxation.**

Attempt 3 and its evidence are unchanged. This run used the pinned
product fix `b0bee5dbf` and the reviewed successor gates
`fa45176f6`; the experiment (provider configuration, requests,
fixtures, distractor, deadlines, and gate set) is otherwise the same as
attempt 3.

## Run identity

- Product commit: `b0bee5dbfd608103bd8875bbc35066c28959ae1e`
  (`fix(outcome): an undispatched lookup never negates a validated
  delivery`) — the attempt-3 pin `2a113d1a3` plus the reviewed S7
  settlement correction.
- Harness / launch HEAD: `b4303bf5e8b77bd132605a3c7babbfe0ef0b0d4c`
  (`acceptance: predeclare composed attempt 4 on the corrected runtime`).
- Frozen gate commit: `fa45176f619402157264c01c40d3c328aced74f1`
  (tag `successor/s7-gates-frozen-20261023`).
- Product tree check: `git diff b0bee5dbf..HEAD -- backend/core
  backend/integrations` empty; all five source hashes match the
  declaration. `chat_orchestrator.py` is
  `59f1c550cf51a434631d6202b61b5aa8eefc2de0735edacbdee184cc53e152ed`.
  The obsolete `2a113d1a3`/`a72e20a3…` pair was rejected by the runner
  and the preflight.
- Predeclaration: `PREDECLARED_CONFIG_ATTEMPT4.md`, sha256
  `28ec05c4c5f46e02e28fae7b6f1fbfb81fa5f37c35a225a35a5cf1e0367c7f82`.
- Runtime identity: cwd
  `.../l3-required-read-timeout/backend`, `git_commit=b4303bf5e8b7`,
  `dirty=false`, candidate commit/cwd true.
- Scratch world: `.../l2-fix/scratch/l1-l2-l3-composed-attempt4`
  (port `8114`). Pilot `:8001` stayed at instance
  `8c593e57031e-dirty.4f091b0e6ee2.81067.1792291183`
  (PID `81067`); `pilot_untouched=true`.
- Configuration: same DeepSeek-direct structured route and
  `deepseek:deepseek-v4-pro` pin, same Ollama `llama3.1:8b` reply,
  same fastembed embeddings, same requests/fixtures/distractor and
  deadlines. No harness runtime change or mid-attempt repair.
- Preflight: 40/40 checks passed before launch
  (`attempt4_preflight.json`); intended pin accepted, obsolete
  product/hash rejected, frozen gate tests + captured replays 40
  passed, fresh artifact/scratch paths, explicit scratch stores,
  pilot/credential checks, and the original S3 gates present.

## First broken transition — L3 answer truthfulness

The L3 sourced read itself passed: `documents.search` executed with a
verified complete receipt, bound to the execution and workspace;
`objective_met=true`, settlement `completed`, history agreement true;
the reply's conclusion is `QUARTZ-77` (the L3 fixture's launch code).

The predeclared answer gate nevertheless fails because the reply echoed
the retrieved fixture's unrelated distractor line:

```
Decoy: the archive key for project Halcyon-2 is BASALT-13.
```

`l3_answer_correct` requires the expected code and **no** `BASALT-13`;
with the decoy present, it is false and the declared classification is
`l3_untruthful_answer`. This is the first false check in the declared
order. The gate is unchanged and was not relaxed. It is an echo/diff
behavior, not a wrong-code selection, but under the declared contract
it is the first broken transition and the run cannot pass.

## S3 comparison — still time-budgeted

The S3 turn returned the time-budget message after **95.04 s**:
"This turn ran past its time budget before a reply could be generated."
There is no truthful comparison, no broader-obligation carrier, and no
bound requirement capture. The failing gates are
`comparison_truthful_date`, `comparison_broader_obligation_open`,
`comparison_settlement_basis`, `comparison_requirement_captured`, and
`comparison_history_agreement`.

The declared structured pin is `deepseek:deepseek-v4-pro`; the
interpretation dispatch line shows an attempt on
`deepseek/deepseek-v4-pro` followed by `deepseek/deepseek-flash`, and
the recorded interpretation origin is `llm:deepseek-flash`. This is a
product-side dispatch/fallback observation, not a harness configuration
change. The provider-latency finding from attempt 3 remains open under
this configuration.

## S7 continuation — correct honest partial, rejected by a gate constant

The S7 turn settled `partial` / `success=true` in **65.56 s**, with:

- the correct verified date comparison
  (`2026-12-31` = `2026-12-31 (match)`), zero writes, unchanged draft;
- `context_fulfillment.state=completed`,
  `supplied_fields=["expiration_date"]`, fixture matched;
- `delivery.delivered=true`, `objective_met=true`;
- the only `open_work` entry is the prior S3 obligation
  (`re-run the workbook verification for the quote's items`);
- source resolved to `approved_records_q2026_114.txt`,
  `continuation_source_resolved=true`,
  `continuation_requirement_captured=true`.

The reviewed `continuation_date_only_completed` and
`continuation_settlement_basis` gates are nevertheless false. The cause
is a concrete gate false negative, not the turn: the structured task
record for this run carries **new per-run UUIDs** for the prior S3
question:

```
question_id      71153968-b255-4dd4-936e-16e40b79489e
source_operation 79390c9b-4d2b-4aa8-a2ab-ba412de11bc5
next_action      re-run the workbook verification for the quote's items
kind             verification
status           open
```

The frozen gate compares structured obligations to the attempt-3 UUIDs
`2ff5c959…` / `a6413371…`. The same gate accepts the bounded text
snapshot (`open_work=[prior]`), and accepts the structured record when
only the UUID fields are replaced with the attempt-3 values. The
identities are per-run; the reviewed implementation treated them as
stable fixture constants. The honest partial should have passed this
gate under the stated prior-obligation rule; it did not. This is a
correction needed for a successor, but it did not cause the first
failure (L3 already blocked the run, and S3 also failed).

`gate_basis.open_work_source` records `structured`,
`structured_open_count=1`, `fallback_open_count=1`, so the limitation is
visible in the result rather than inferred.

## Restart — partial-aware agreement missing

The restart reload preserved both sessions, the canvas, zero new
writes, and the durable S7 execution (`restart_execution_persists=true`,
`restart_zero_new_writes=true`, `restart_canvas_unchanged=true`).
`restart_history_agreement` is false because that gate still hardcodes
`last_b2.outcome == "completed"`; the reviewed honest partial is
`outcome=partial`, `success=true`. This is a second concrete
partial-aware gate correction, downstream of the first failure.

## Live database and pilot

- `live_db_isolated=true`; the scratch process tree held no live
  DB/WAL/SHM handle, and all configured stores resolved under the
  scratch root.
- The live content/WAL hash and mtime changed during the run
  (`live_db_unchanged=false`), consistent with the pilot's own
  checkpoint activity; row counts are unchanged (users 48, chat
  sessions 1022, chat messages 5426, canvases 197, canvas audits 1116,
  documents 2443, executions 4254, task records 269). The change is
  recorded as an observation, not attributed to the scratch run.
- `pilot_untouched=true`; pilot `8c593e57031e` remains served.

## Failed checks (9 of 59)

`l3_answer_correct`, `comparison_truthful_date`,
`comparison_broader_obligation_open`, `comparison_settlement_basis`,
`comparison_requirement_captured`, `comparison_history_agreement`,
`continuation_date_only_completed`, `continuation_settlement_basis`,
`restart_history_agreement`.

## Decision

No retry was performed. No provider was switched, no deadline was
increased, no gate was relaxed, and no mid-attempt repair was made. The
first broken transition is the L3 decoy echo; S3 remains time-budgeted;
the S7 structured-identity constant and the restart completed-only
assertion are concrete gate false negatives to correct in a future
successor. Deployment remains held; no promotion, merge, or evidence
publication to `main`.

## Evidence

`attempt4_preflight.json`, `attempt4_config.json`,
`attempt4_result.json`, `attempt4_summary.json`, `attempt4_run.log`,
`attempt4_server_pre.log`, `attempt4_server_restart.log`,
`attempt4_observation_pre.jsonl`,
`attempt4_observation_restart.jsonl`,
`attempt4_interpreter_freeze.txt`, `ATTEMPT4_RESULT.md`,
`CHECKSUMS_ATTEMPT4.sha256`, `PREDECLARED_CONFIG_ATTEMPT4.md`,
`run_composed_served_attempt4.py`, `preflight_attempt4.py`,
`successor_gates.py`, `server_observe.py`.

Attempt-3 evidence remains unchanged; its result JSON and run log still
match `CHECKSUMS_ATTEMPT3.sha256`.
