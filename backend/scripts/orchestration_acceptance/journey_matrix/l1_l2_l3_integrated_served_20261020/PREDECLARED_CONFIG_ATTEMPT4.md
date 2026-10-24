# Predeclared configuration — composed served attempt 4 (corrected runtime)

Frozen: 2026-10-23, before launch. This file is the declaration; the
runner records its sha256 and refuses to launch without it. One attempt.
No mid-run repairs, provider switches, deadline increases, or gate
relaxations. Attempt 3 and its evidence remain unchanged.

## Candidate and runtime pin

- Worktree: `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/l3-required-read-timeout`
- Branch: `fix/l3-required-read-timeout`
- Frozen product commit: `b0bee5dbfd608103bd8875bbc35066c28959ae1e`
  (`fix(outcome): an undispatched lookup never negates a validated
  delivery`). This is the attempt-3 product pin `2a113d1a3` plus the
  reviewed S7 settlement correction; it changes only
  `backend/integrations/chat_orchestrator.py` (+25 lines) relative to
  `2a113d1a3`.
- Frozen successor gates: `fa45176f619402157264c01c40d3c328aced74f1`,
  tag `successor/s7-gates-frozen-20261023`.
- Launch HEAD: the harness commit that contains this declaration. The
  runner records the actual `head_at_launch` and `harness_commit`.
- Product source is frozen by these sha256 values. The runner refuses to
  launch if any differs, if `backend/core`/`backend/integrations`
  changes after the pinned product commit, if the frozen gate commit is
  not an ancestor, if the successor gate module differs from the
  reviewed freeze, or if the worktree is dirty:

```
94f7ec112273513374e3401690e14038eff3c9d83849b88d9527ce9e6ec2dd79  backend/core/chat_tool_planner.py
59f1c550cf51a434631d6202b61b5aa8eefc2de0735edacbdee184cc53e152ed  backend/integrations/chat_orchestrator.py
5f724ceb645cff36718c13a5c6a3cb3de2417f63f9b2e04cc5be84c55170dece  backend/core/chat_canvas_editor.py
3158d329cd3fdfbaa69fdda250c403ba9f694a10430f45d1fb42a026d9298a29  backend/core/workbook_read_artifact.py
79940f7b460dedd53f8d1c3fb26dbd7f153a46f078f0fae411d23473b7e5d42a  backend/core/turn_decision.py
```

Launching from the later gate commit is allowed only when
`git diff b0bee5dbf..HEAD -- backend/core backend/integrations` is empty
and every source hash above matches; the runner aborts on an unexplained
difference. Harness-only files (runner, declaration, observation
launcher) are committed after the product freeze and are recorded by
sha256 in `attempt4_config.json`.

## Why this configuration

The experiment is unchanged from attempt 3: one DeepSeek-direct
structured route, DeepSeek edit planning, local Ollama reply, local
fastembed embeddings, one scratch world, one backend process, the same
requests, fixtures, distractor document, and deadlines. The only product
change is the already-reviewed S7 settlement correction `b0bee5dbf`
(needed for the honest-partial case) plus the reviewed successor gates.
No model, route, workspace, fixture, deadline, or prompt is changed.

- Structured route: DeepSeek direct (`https://api.deepseek.com/v1`), one
  authorized operator vault entry registered through the product API.
- Interpretation pin: `deepseek:deepseek-v4-pro` (`ATOM_TURN_INTERPRET_PIN`).
- Edit planning: `deepseek/deepseek-v4-pro` (`ATOM_ASYNC_EDIT_PLAN_MODEL`).
- Reply / unpinned legacy route: local Ollama `llama3.1:8b`
  (`ATOM_PROVIDER=ollama`, `ATOM_DEFAULT_MODEL=llama3.1:8b`).
- Embeddings: `fastembed`, `BAAI/bge-small-en-v1.5`, 384 dimensions.
- No per-turn model routing and no user-visible model selection.
- Product flags: `CHAT_FINALIZATION_M1=1`, `CHAT_FINALIZATION_M2=1`,
  `ATOM_TASK_LIFECYCLE_ENABLED=1`, `ATOM_TURN_DECISION_ROUTING=1`,
  `ATOM_TURN_INTERPRETATION=1`, `ATOM_TURN_INTERPRET_CAPTURE=1`.
- Bounded optional planning defaults: `ATOM_TOOL_PLAN_WAIT_SECONDS=25`,
  `ATOM_REQUIRED_READ_PLAN_RESERVE_SECONDS=5` (not overridden).
- Existing deadlines and budgets are unchanged (settlement poll budget
  460 s; interpretation bound 65 s; the same per-turn HTTP timeouts).

## Reviewed S7 gate semantics

The S7 date-only continuation is accepted as `completed` only with the
exact canonical `expiration_date` scope, a met objective, delivery, and
no open obligations. An honest `partial` is accepted only when the exact
date scope was supplied and delivered and **every** open obligation is
the identified prior S3 broader verification (structured task-record
identities preferred; the resolver text snapshot is cross-checked; the
bounded text fallback is disclosed in `gate_basis.open_work_source`).
An additional unknown gap, a turn-own missing field/comparison, a
partial date scope, or a missing delivery still fails.

The continuation source gate requires the antecedent to resolve to a
durable execution in the same conversation/workspace that actually
supplied the fixture. Two carried ids agreeing is insufficient.

The honest partial cannot compensate for S3: the original S3 comparison
and latency gates remain mandatory, unchanged. If S3 times out or fails
its comparison, the composed workflow remains unverified and deployment
remains held.

## Isolation

- Scratch root:
  `.../l2-fix/scratch/l1-l2-l3-composed-attempt4`
- Port: `8114` (pilot stays on `:8001`; no frontend process).
- New artifact names: `attempt4_config.json`, `attempt4_result.json`,
  `attempt4_summary.json`, `attempt4_run.log`,
  `attempt4_server_pre.log`, `attempt4_server_restart.log`,
  `attempt4_observation_pre.jsonl`,
  `attempt4_observation_restart.jsonl`,
  `attempt4_interpreter_freeze.txt`, `attempt4_preflight.json`.
- `DATABASE_URL`, `ATOM_DATA_DIR`, `LANCEDB_URI`, `LANCEDB_URI_BASE`,
  `BYOK_*` all resolve under the scratch root.
- The live database `backend/data/atom.db` is never a configured store.
- One fresh user, one workspace, sessions A and B, the same two uploaded
  fixtures and the same draft for the whole run. No workspace reset or
  context shrink between legs.
- Live-DB guard: content fingerprint before/after (sha256, size, mtime,
  WAL size/hash, `quick_check`, core table row counts), open-holder
  inspection via `lsof` (pilot holders and scratch process tree), plus a
  `live_db_isolated` check that the scratch process tree holds no live
  DB/WAL/SHM handle. An mtime change alone is recorded, not attributed.
- Pilot `:8001` must keep the same PID/instance/start time;
  `pilot_untouched` is a gate.

## Sequence (all legs, no skipping, no mid-run configuration switch)

1. Upload `approved_records_q2026_114.txt` and
   `l3_zephyr9_fixture.txt` through `POST /api/documents/upload` into the
   same workspace. The L3 fixture carries the unrelated distractor
   `BASALT-13`.
2. L3 sourced answer in session A, no canvas context:
   `search my uploaded documents for the launch code for project Zephyr-9 and tell me the code`.
   Required: `documents.search` executed and verified complete, receipt
   bound to the response execution/workspace, objective met, settlement
   `completed`, reply contains `QUARTZ-77` and not `BASALT-13`, no canvas
   created.
3. Create the draft through the product API; seed exactly
   `Terms: Net 45`, `Valid until: 2026-12-31`, unit price `$48,000.00`.
4. Edit in session A: `Please update the payment terms in the draft to Net 30.`
   Required: exactly one audit write, body applied, other fields
   preserved, receipt `completed`/`postcondition_verified`/`updated`,
   durable row `objective_met=true`/`mutation.readback_matched=true`.
5. Identical re-ask in session A: zero additional writes, no-op receipt
   (`noop=true`, `already_satisfied`, `updated=false`, `no_apply=true`),
   body unchanged, completed.
6. Comparison in fresh session B against the same draft:
   `Compare the draft quotation with my uploaded Approved Records document. Does the Valid Until date in the draft match the approved record? Flag anything that differs. Do not change anything yet.`
   Required: broader obligation visibly open, truthful date, no false
   date, no global-consistency claim, zero writes. A narrower capture is
   recorded honestly and is not waived or hidden.
7. Date-only continuation in session B:
   `What is the current Valid until date on the draft, and does it still match the approved record?`
   Required: narrow `expiration_date`, source resolved to
   `approved_records_q2026_114.txt`, the reviewed settlement/source
   gates above, zero writes, truthful date.
8. Restart/reload: stop and relaunch the same scratch process/stores;
   reload both conversations, canvas, audits, and durable execution rows.
   Required: runtime identity, history agreement, zero new writes, canvas
   unchanged, durable executions present.

The S3/S7 legs are not optional and are not replaced by another
configuration. If they fail, they remain separate open findings; the
composed workflow stays unverified and deployment stays held.

## Pass/fail

The same 59 gates as attempt 3, with the reviewed S7 gate predicates.
The run passes only if every gate is true. `first_failure` is the first
false gate in the declared order. A pass must include the L3 receipt
chain, the successor required-read path, S3's comparison/date gates, and
the S7 date/source/settlement gates. An answer that merely contains
`QUARTZ-77` without a `documents.search` receipt is a failure. An honest
S7 partial is not a pass unless every other gate is true, including S3.

## Stop conditions

- Frozen source hash or product-diff mismatch, wrong product/gate commit,
  gate-module hash mismatch, dirty worktree, occupied port `8114`,
  existing scratch world, missing predeclaration, or a live DB held by
  the scratch process tree.
- No scratch server may be started on `:8001`; the pilot is untouched.
- No deployment, promotion, branch push, or merge is part of this run.

## Evidence to record

`attempt4_preflight.json`, `attempt4_config.json`,
`attempt4_result.json`, `attempt4_summary.json`, `attempt4_run.log`,
`attempt4_server_pre.log`, `attempt4_server_restart.log`, observation
JSONL files, interpreter freeze, live-DB fingerprint/holders, and
`CHECKSUMS_ATTEMPT4.sha256`. Attempt-3 artifacts are not rewritten.
