# Attempt 3 — composed served successor (2026-10-20)

**Verdict: NOT PASSED. The L3 required-read timeout blocker is fixed and
verified under the same declared configuration; the composed L1+L2+L3
workflow is still unverified because S3 timed out and S7 settled
`failed`. No promotion, no deployment.**

## Run identity

- Product commit: `2a113d1a3` (`fix(planner): execute accepted required
  reads after planning timeouts`)
- Base candidate: `ddcc404dd` (L3 `6d662abff` + L1 `aaa1169d7` + L2
  `c0cbea9f1` + main `e6308cb54`)
- Launch HEAD: `67b9fbc85` (acceptance harness only after the product
  freeze)
- Configuration: the same DeepSeek-direct / Ollama-reply / fastembed
  configuration that failed attempt 2; predeclared in
  `PREDECLARED_CONFIG_ATTEMPT3.md`. No model, route, workspace or
  fixture switch mid-run.
- Runtime identity: `dirty=false`, `candidate_commit_ok=true`,
  `candidate_cwd_ok=true`.
- Scratch world: `.../l2-fix/scratch/l1-l2-l3-composed-attempt3`;
  port `8113`; pilot `:8001` untouched (`pilot_untouched=true`).
- Result: **48/59 checks true**, first failure
  `comparison_untruthful`; classification `comparison_untruthful`.

### Rejected first launch (harness-only, no turn executed)

The first launch was stopped by the declared identity gate with
`runtime_identity_mismatch`: the runner's own `attempt3_run.log` /
config artifacts made the candidate worktree dirty. No user, upload or
chat turn ran. The artifacts were ignored via the committed
`.gitignore`, the scratch world was removed, and the run was repeated
under the same frozen product and configuration. The rejected launch
summary is preserved outside the worktree at
`.../opencode/attempt3-first-run/`; it is not counted as an attempt.

## L3 — required read now survives the planning timeout

The served L3 turn (request
`l1l2l3-l3-40d5ddb6c39840208ca1e8fe46bb7826`) completed in **59.67 s**:

- The optional structured planning call timed out after 20.0 s
  (`attempt3_server_pre.log:1227`:
  `optional structured planning timed out after 20.0s; required-read
  enforcement continues`).
- The source-ask floor selected the documents lane
  (`source-ask floor -> documents.search query='the launch code for
  project Zephyr-9'`), and the executor ran it
  (`attempt3_server_pre.log:1242`:
  `tool plan executed: documents.search:the launch code for project
  Zephyr-9`).
- The durable receipt is a verified complete documents read
  (`documents.grep`, `match_count=1`, `coverage=complete`); the
  executor normalized the action name, but the executed plan is the
  required `documents.search` shown in the log. No receipt was
  fabricated.
- `l3_documents_receipt_executed`, `l3_receipt_verified_complete`,
  `l3_receipt_bound_to_execution` and
  `l3_receipt_bound_to_workspace` are true; `objective_met=true`,
  settlement `completed`, fresh-history agreement true.
- The answer is `QUARTZ-77` from the uploaded fixture and does not
  contain the decoy `BASALT-13`; no canvas was created.

This is the direct successor to the attempt-2 failure: same
configuration, same accepted ask, but the required read now executes
after the planning seam times out.

## Edit and identical re-ask — passed

- Edit: one audit write, body applied, other fields preserved, served
  receipt `completed`/`postcondition_verified`/`updated`, durable row
  `objective_met=true`/`mutation.readback_matched=true` (43.92 s).
- Identical re-ask: `noop=true`, `noop_reason=already_satisfied`,
  `updated=false`, `no_apply=true`, zero additional writes, body
  unchanged, completed (33.22 s).

## S3 comparison — failed independently (interpretation timeout)

The comparison turn returned HTTP 200 after **95.03 s**, but the
response is the time-budget message:

> This turn ran past its time budget before a reply could be generated.
> Please try again.

The structured interpretation was cancelled after 64.9 s
(`waited=64.9s`, `worker_may_still_run=true`); the turn recorded
`interpretation_origin=unresolved`, `unresolved_reason=timeout`,
`scope_change=unresolved`, zero actions. The requirement summary still
shows the accepted broader obligation (`broader_comparison=true`,
`fields=["expiration_date"]`, `sources=["document"]`), but no bound
capture event was recorded (`comparison_requirement_captured=false`),
and there is no comparison or truthful date in the reply.

This is not the L3 control-flow blocker and it is not hidden by changing
models or workspaces. It remains an open S3 interpretation-latency
finding under this configuration.

## S7 date-only continuation — failed settlement

The continuation turn returned the correct typed comparison (draft
`2026-12-31` = approved record `2026-12-31`) with zero writes and an
unchanged draft in **66.88 s**. The captured requirement resolves the
source to `approved_records_q2026_114.txt`
(`doc_3abaf0d03badbc965b0f2770`), and the continuation evidence resolves
the antecedent. Settlement nevertheless recorded
`turn_failed_no_result`, `final_outcome=failed`,
`final_success=false`; the restart reload therefore also fails
`restart_history_agreement` and `restart_execution_persists`.

Harness caveat: the `continuation_source_resolved` gate is false because
it also requires the S7 observation's execution id to equal S3's
execution id — S3 timed out before creating an execution, so that
comparison is impossible. The S7 requirement itself is resolved to the
correct file. This is an over-constrained check, not evidence that S7
used the wrong source; the settlement failure is independently real.

## Live database isolation — actual store access

The run replaced the unattributable mtime-only gate with
`live_db_isolated`, and recorded the content fingerprint as an
observation:

- `live_db_isolated=true`.
- The scratch process tree (PID `17669`) held **no** live
  `atom.db`/WAL/SHM handle (`scratch_holders.holders=[]`).
- Only the pilot (PID `81067`) held the live DB/WAL open.
- All configured stores resolve under the scratch root
  (`scratch_paths_isolated=true`); the live path does not appear in the
  served logs.
- Live row counts are unchanged (users 48, chat sessions 1022, chat
  messages 5426, canvases 197, canvas audits 1116, documents 2443,
  executions 4254, task records 269).
- The live content/WAL hashes did change during the run
  (`live_db_unchanged=false`, recorded as an observation). Because only
  the pilot held the store and no scratch process did, this is
  consistent with pilot checkpoint/maintenance activity, not a scratch
  write. It is not promoted to a row-level attribution.

## Gates that remain false

`comparison_truthful_date`, `comparison_broader_obligation_open`,
`comparison_requirement_captured`, `comparison_interpretation_deepseek`,
`comparison_settlement_basis`, `comparison_history_agreement`,
`continuation_date_only_completed`, `continuation_source_resolved`
(over-constrained harness check, see above), `continuation_settlement_basis`,
`restart_history_agreement`, `restart_execution_persists`.

## What this establishes

- The attempt-2 L3 blocker is fixed at the product level and verified in
  the composed served path under the configuration that exposed it.
- The L1 edit and identical re-ask legs remain green in the same world.
- The composed workflow is **not** verified: S3 interpretation latency
  and S7 settlement remain open. The L2 parser/continuation work stays
  closed; whole-document comparison stays visibly open.
- The live DB was not used by the scratch server; the mtime/hash signal
  is pilot-owned and is not used as a write-attribution gate.
- Deployment remains held. The pilot is still `8c593e57031e`.
