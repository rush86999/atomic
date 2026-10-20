# Predeclared configuration — composed served attempt 3 (successor)

Frozen: 2026-10-20, before launch. This file is the declaration; the
runner records its sha256 and refuses to launch without it.

## Candidate

- Worktree: `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/l3-required-read-timeout`
- Branch: `fix/l3-required-read-timeout`
- Frozen product commit: `2a113d1a3ad2f5399f9656a5bc7eda37cda5f1ce`
  (`fix(planner): execute accepted required reads after planning timeouts`)
- Base candidate: `ddcc404ddca2c1ff50b02d510d0d0c3d376cc4ab`
  (L3 `6d662abff` containing L1 `aaa1169d7` + L2 `c0cbea9f1` + main
  `e6308cb54`; merge base `bb8081b288`)
- Product source is frozen by these sha256 values. The runner refuses to
  launch if any differs, or if `backend/core`/`backend/integrations`
  changes after the frozen commit:

```
94f7ec112273513374e3401690e14038eff3c9d83849b88d9527ce9e6ec2dd79  backend/core/chat_tool_planner.py
a72e20a363543b8b38d029fae9a778ea91006db08689d3b9a0ce30d899b833d6  backend/integrations/chat_orchestrator.py
5f724ceb645cff36718c13a5c6a3cb3de2417f63f9b2e04cc5be84c55170dece  backend/core/chat_canvas_editor.py
3158d329cd3fdfbaa69fdda250c403ba9f694a10430f45d1fb42a026d9298a29  backend/core/workbook_read_artifact.py
79940f7b460dedd53f8d1c3fb26dbd7f153a46f078f0fae411d23473b7e5d42a  backend/core/turn_decision.py
```

The acceptance harness and evidence files may be committed after the
product freeze; they are not product code. The run records the actual
launch HEAD and verifies the product diff is empty.

## Why this configuration

This is intentionally the **same declared configuration that failed in
attempt 2**: one DeepSeek-direct structured route, DeepSeek edit planning,
local Ollama reply, local fastembed embeddings, one scratch world, one
backend process. The purpose is to test the control-flow fix under the
configuration that exposed it — not to change models, shrink the
workspace, or switch routes mid-workflow. Provider/configuration
differences from the L3/L2 parent proofs remain observations and separate
findings.

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
- New in the successor: `ATOM_TOOL_PLAN_WAIT_SECONDS=25`,
  `ATOM_REQUIRED_READ_PLAN_RESERVE_SECONDS=5` (defaults; not overridden
  for this run). These bound optional planning and reserve time for
  deterministic enforcement/execution.

## Isolation

- Scratch root:
  `.../l2-fix/scratch/l1-l2-l3-composed-attempt3`
- Port: `8113` (pilot stays on `:8001`; no frontend process).
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
- Pilot `:8001` must keep the same PID/instance/start time; `pilot_untouched`
  is a gate.

## Sequence (all legs, no skipping, no mid-run configuration switch)

1. Upload `approved_records_q2026_114.txt` and `l3_zephyr9_fixture.txt`
   through `POST /api/documents/upload` into the same workspace.
2. L3 sourced answer in session A, no canvas context:
   `search my uploaded documents for the launch code for project Zephyr-9 and tell me the code`.
   Required: `documents.search` executed and verified complete
   (`match_count >= 1`, `coverage=complete`), receipt bound to the
   response execution/workspace, objective met, settlement `completed`,
   reply contains `QUARTZ-77` and not `BASALT-13`, no canvas created.
3. Create the draft through the product API; seed exactly
   `Terms: Net 45`, `Valid until: 2026-12-31`, unit price `$48,000.00`.
4. Edit in session A: `Please update the payment terms in the draft to Net 30.`
   Required: exactly one audit write, body applied, other fields preserved,
   receipt `completed`/`postcondition_verified`/`updated`, durable row
   `objective_met=true`/`mutation.readback_matched=true`.
5. Identical re-ask in session A: zero additional writes, no-op receipt
   (`noop=true`, `already_satisfied`, `updated=false`, `no_apply=true`),
   body unchanged, completed.
6. Comparison in fresh session B against the same draft:
   `Compare the draft quotation with my uploaded Approved Records document. Does the Valid Until date in the draft match the approved record? Flag anything that differs. Do not change anything yet.`
   Required if the model captures it: broader obligation visibly open,
   truthful date, no false date, no global-consistency claim, zero writes.
   `broader_comparison` capture is evaluated honestly; the observed
   attempt-2 narrower capture is not waived or hidden.
7. Date-only continuation in session B:
   `What is the current Valid until date on the draft, and does it still match the approved record?`
   Required if interpretation succeeds: narrow `expiration_date`, source
   resolved to `approved_records_q2026_114.txt`, completed settlement,
   zero writes, truthful date.
8. Restart/reload: stop and relaunch the same scratch process/stores;
   reload both conversations, canvas, audits, and durable execution rows.
   Required: runtime identity, history agreement, zero new writes, canvas
   unchanged, durable executions present.

The S3/S7 legs are not optional and are not replaced by another
configuration. If they fail, they remain separate open findings; the
composed workflow stays unverified and deployment stays held.

## Pass/fail

58 gates total: the attempt-2 gates with the unattributable mtime-only
`live_db_unchanged` gate replaced by `live_db_isolated` (scratch process
tree holds no live DB/WAL/SHM handle; configured paths are under
SCRATCH). The content fingerprint before/after is recorded as an
observation. The run passes only if every gate is true. `first_failure`
is the first false gate in the declared order. A pass must include the L3
receipt chain and the successor's required-read path; an answer that
merely contains `QUARTZ-77` without a `documents.search` receipt is a
failure.

## Stop conditions

- Frozen source hash or product-diff mismatch, dirty worktree, wrong
  branch/commit, occupied port `8113`, existing scratch world, missing
  predeclaration, or a live DB held by the scratch process tree.
- No scratch server may be started on `:8001`; the pilot is untouched.
- No deployment, promotion, or branch push is part of this run.

## Evidence to record

`attempt3_config.json`, `attempt3_result.json`, `attempt3_summary.json`,
`attempt3_run.log`, `attempt3_server_pre.log`,
`attempt3_server_restart.log`, observation JSONL files, interpreter
freeze, live-DB fingerprint/holders, and `CHECKSUMS_ATTEMPT3.sha256`.
