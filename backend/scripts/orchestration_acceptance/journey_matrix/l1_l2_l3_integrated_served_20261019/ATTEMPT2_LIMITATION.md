# Attempt 2 — composed served workflow NOT PASSED; required document retrieval did not execute after a tool-planning timeout

Date: 2026-10-19 (corrected 2026-10-20). Candidate:
`ddcc404ddca2c1ff50b02d510d0d0c3d376cc4ab` (`integration/l1-l2-l3`;
L3 `6d662abff` containing L1 `aaa1169d7` + L2 `c0cbea9f1` + main
`e6308cb54`; merge base `bb8081b288`). No product-code changes were made
in attempt 1 or attempt 2.

## Correction note

The first version of this record said the single-configuration composed
workflow was "not supported" and attributed the L3 failure to the
provider configuration needing to change per turn. That conclusion was
broader than the evidence. The preserved run shows a control-flow gap:
the accepted decision had already compiled a document `source_read`, but
the separate tool-planning call timed out before the executor was
reached. Provider/configuration differences are kept below as
observations, not as a demonstrated causal boundary. The raw attempt-2
artifacts were not modified.

## Result

- Predeclared at `PREDECLARED_CONFIG_ATTEMPT2.md` (sha256
  `66e21151af21ae7b9f6fc5d87c44f5266bdd6c7c1e9ff9031c76f14274ad5cdc`);
  runner `run_composed_served_attempt2.py`; scratch world/port (`:8111`),
  DeepSeek credential registered through the product, local fastembed
  embeddings, pilot `:8001` untouched.
- **40/58 checks passed. First failure / classification:
  `l3_documents_receipt_missing`.**
- **Required document retrieval was not executed after tool-planning
  timeout; the integrated workflow remains unverified.**
- **This attempt is non-governing.** It does not promote or deploy
  anything; the pilot (`8c593e57031e`) remains the rollback-tested served
  build.

### Passed (40)

`auth_user_resolved`, `comparison_draft_unchanged`,
`comparison_history_agreement`, `comparison_http_ok`,
`comparison_interpretation_deepseek`, `comparison_no_false_date`,
`comparison_no_global_claim`, `comparison_settlement_basis`,
`comparison_truthful_date`, `comparison_zero_writes`,
`continuation_draft_unchanged`, `continuation_history_agreement`,
`continuation_http_ok`, `continuation_truthful_date`,
`continuation_zero_writes`, `deepseek_credential_active`,
`draft_created_through_product`, `edit_audit_exactly_one`,
`edit_body_applied`, `edit_http_ok`, `edit_other_fields_preserved`,
`fixture_uploaded_through_product`, `l3_answer_correct`, `l3_http_ok`,
`l3_interpretation_deepseek`, `l3_no_canvas_created`,
`l3_receipt_bound_to_execution`, `pilot_untouched`,
`provider_structured_deepseek`, `reask_body_unchanged`, `reask_completed`,
`reask_history_agreement`, `reask_http_ok`, `reask_noop_receipt`,
`reask_receipt_reply`, `reask_zero_additional_writes`,
`restart_canvas_unchanged`, `restart_runtime_identity`,
`restart_zero_new_writes`, `runtime_identity`.

### Failed (18, as recorded)

`comparison_broader_obligation_open`, `comparison_requirement_captured`,
`continuation_actions_proposed`, `continuation_capture_archived`,
`continuation_date_only_completed`, `continuation_interpretation_deepseek`,
`continuation_requirement_captured`, `continuation_settlement_basis`,
`continuation_source_resolved`, `edit_settled_completed`,
`l3_documents_receipt_executed`, `l3_history_agreement`,
`l3_objective_met`, `l3_receipt_verified_complete`,
`l3_settlement_completed`, `live_db_unchanged`,
`restart_execution_persists`, `restart_history_agreement`.

The raw checks above are preserved. `edit_settled_completed` is a
harness extraction gap, corrected additively from the preserved durable
row on 2026-10-20 (see Harness notes); it is not a product settlement
failure. `restart_execution_persists`/`restart_history_agreement` remain
false because S7 settled `unconfirmed`, an independent continuation
finding.

## The verified L3 blocker: optional planning timed out before enforcement

The accepted L3 turn compiled a `source_read` for documents
(`mode="fresh_read"`, `sources=["documents"]`) after the interpretation
chose the `research` action. A separate tool-planning call for that turn
was 11,434 characters and hit `TimeoutError`; the server recorded:

```
tool planning skipped: TimeoutError()
...
tool plan executed: None
```

Execution then continued with no tool plan. The answer content happened
to be correct (`QUARTZ-77`, no decoy `BASALT-13`) because
`context_assembly` had retrieved one source, but there was **no
`documents.search`** receipt, no verified read, and no settled saved
status (`outcome=null`, `objective_met=null`). This is a control-flow
gap: the source-ask floor exists but ran after the optional structured
planning call, so cancellation prevented it from being reached.

## Observed provider/configuration differences (not a causal boundary)

These are observations from the one tested configuration. They do not
establish that a single configuration is impossible, and they are not the
reason the accepted read was skipped.

| leg | proven route (parent evidence) | composed attempt 2 under the one DeepSeek pin |
| --- | --- | --- |
| L3 sourced answer | L3 parent `6d662abff`: interpretation default `qwen3.8-flash` via the pilot cloud route (opencode-go), reply `ollama/llama3.1:8b`; intent `search_request` → `documents.search` with verified complete receipt (`match_count=1`, `coverage=complete`), `objective_met=true`, `outcome=completed` | intent `search_request`, interpretation `llm:deepseek-v4-pro` (25.3 s) → action **`research`**; `context_assembly` retrieved one source; no `documents.search`, requirement `sources=["documents"]`, `artifact_attached=false`, `fields=[]`; delivery model recorded as `deepseek-v4-pro`. The control-flow timeout above is the verified blocker. |
| L2 comparison (S3) | L2 attempt 12 `c0cbea9f1` (DeepSeek direct, approved-records-only world): interpretation `deepseek-v4-pro`, requested fields include `any fields that differ`/`flag anything that differs`, `broader_comparison=true`, deterministic verified reply, broader OPEN, 63.55 s | interpretation `deepseek-v4-pro` (42.1 s), action kinds `research`/`presentation`, requested field only `expiration_date` → `broader_comparison=false`, `context_fulfillment=partial`/`missing_comparison`. Reply stayed truthful and visibly open; zero writes, body unchanged, correct date. Separate capture-scope finding. |
| L2 continuation (S7) | L2 attempt 12: interpretation `deepseek-v4-pro`, `broader_comparison=false`, `expiration_date`, requirement resolved to `approved_records_q2026_114.txt`, `context_fulfillment=completed`, `outcome=completed`, 49.41 s | interpretation timed out at the 65 s stage bound (`reason=timeout`); flash retries timed out/cancelled (`worker_may_still_run=true`); interpreted `unresolved`; `outcome=unconfirmed`/`success=false`; no actions/context fulfillment; turn 94.77 s against the 95 s bound. Separate provider-latency/continuation finding. |
| L1 edit / identical re-ask | L1 parent `aaa1169d7` | Passed: receipt `outcome=completed`, `postcondition_verified=true`, `updated=true`, exactly +1 audit; identical re-ask `noop=true`/`noop_reason=already_satisfied`/`no_apply=true`, zero added writes, body unchanged, served `outcome=completed`; durable edit row `objective_met=true`/`mutation.readback_matched=true`; edit/re-ask rows persisted after restart. |

Configuration observation (not the demonstrated blocker):

- `core/atom_agent_endpoints.py` `ChatRequest` exposes `message`,
  `user_id`, `session_id`, `current_page`, `context`,
  `conversation_history`, `agent_id`, `workspace_id` — no
  model/provider/interpretation field.
- `ATOM_TURN_INTERPRETATION` defaults **on** (`core/turn_decision.py`,
  `interpretation_enabled()`), and the interpretation pin is a single
  global value (`ATOM_TURN_INTERPRET_PIN`, measured default
  `qwen3.8-flash` via `opencode-go`).
- No per-turn model selection exists. That is a configuration fact, not
  evidence that one configuration cannot serve the workflow. No routing
  subsystem or user-visible model selection is justified by this run
  before the control-flow gap is fixed and the successor is tested.

## Separate findings (keep open; do not fold into the L3 blocker)

- **S3 comparison capture:** the request-bound broader comparison was
  not captured under the tested interpretation; the reply was truthful
  and visibly open, and the world/body were unchanged. Whole-document
  comparison remains visibly open.
- **S7 continuation:** the interpretation stage timed out and the turn
  settled `unconfirmed`. This is a separate continuation/provider
  latency finding; the L2 parser/continuation work is closed, and the
  whole-document comparison is not claimed closed.
- **L3 fixture context interaction:** the L3 fixture sits in the same
  workspace as the approved records; that interaction is noted but is
  not the cause of the planner cancellation.

## Harness notes (not product behavior)

- **Edit extraction (corrected 2026-10-20).** `task_of()` read
  `execution.task_summary`, whose projection drops `mutation`, so
  `edit_settled_completed` was false even though the durable row and
  served receipt were complete (`mutation.readback_matched=true`,
  `objective_met=true`, receipt `outcome=completed`). The corrected
  extraction merges the preserved `execution.row.task_outcome` under the
  summary (summary values win; the row fills gaps). Re-extraction from
  `attempt2_result.json` makes `edit_settled_completed` true. The raw
  result file was not rewritten. Regression:
  `backend/tests/test_attempt2_edit_extraction.py`.
- **Live-DB attribution (checked 2026-10-20 through actual store access,
  not mtime alone).** Only the pilot process (PID 81067, commit
  `8c593e57031e`) holds `backend/data/atom.db` and its WAL open
  read/write; the attempt-2 server's declared `DATABASE_URL`/
  `ATOM_DATA_DIR` resolve to
  `.../l1-l2-l3-composed-attempt2/atom.db` (scratch DB, mtime 21:37),
  and the scratch server logs contain the scratch LanceDB root, not the
  live path. A read-only copy of the live DB+WAL queried for application
  rows timestamped 21:50–21:59 found none; the latest application rows
  are from 2026-10-18. The live `atom.db` file mtime (21:53:48 EDT) is
  therefore not evidence of an attempt-2 row write; it is consistent
  with the pilot's own SQLite checkpoint/maintenance on its open
  connection. The guard's mtime-only signal is insufficient, and the
  live-data deployment remains held because row-level attribution is
  still incomplete. The scratch server did not write the live store.
- **Context interaction:** the composed world exposes the L3 fixture in
  the same workspace as the approved records; S3/S7 remain independent
  findings.

## Decision and next step

Keep deployment held. Do not deploy the integrated candidate as
supporting the composed workflow. The successor action is a product
control-flow fix, not a routing subsystem:

1. Bound the optional structured planning call internally so the
   deterministic required-read enforcement remains reachable when the
   call returns nothing or times out.
2. Add a caller-side fallback when the whole planner task is cancelled,
   while preserving turn cancellation and settlement time.
3. Execute the accepted required read through the existing dispatcher,
   receipt and settlement path; leave a named unmet obligation when
   permission/capability/time is insufficient; never fabricate a
   `documents.search` receipt.
4. Freeze and verify **one** successor under **one** declared
   configuration; replay the S3/S7 captured inputs in focused tests and
   keep the whole-document comparison visibly open. Deployment stays
   held until that composed run passes and live-DB attribution is
   complete.

The individual workflows remain supported on their own declared
configurations: L1 re-ask (`aaa1169d7`), L3 sourced answer (`6d662abff`,
opencode-go/qwen + Ollama reply), L2 comparison/continuation
(`c0cbea9f1`, DeepSeek direct). Those separate proofs do not make the
composed workflow verified.

## Evidence

- `PREDECLARED_CONFIG_ATTEMPT2.md`, `run_composed_served_attempt2.py`
- `attempt2_config.json`, `attempt2_result.json`, `attempt2_summary.json`,
  `attempt2_run.log`
- `attempt2_server_pre.log`, `attempt2_server_restart.log`,
  `attempt2_observation_pre.jsonl`, `attempt2_observation_restart.jsonl`,
  `attempt2_interpreter_freeze.txt`
- `CHECKSUMS_ATTEMPT2.sha256`
