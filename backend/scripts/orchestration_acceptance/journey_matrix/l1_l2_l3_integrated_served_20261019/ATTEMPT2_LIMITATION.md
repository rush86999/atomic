# Attempt 2 — composed served workflow NOT PASSED; single-configuration composed workflow not supported

Date: 2026-10-19. Candidate: `ddcc404ddca2c1ff50b02d510d0d0c3d376cc4ab`
(`integration/l1-l2-l3`; L3 `6d662abff` containing L1 `aaa1169d7` + L2
`c0cbea9f1` + main `e6308cb54`; merge base `bb8081b288`). No product-code
changes were made in attempt 1 or attempt 2.

## Result

- Predeclared at `PREDECLARED_CONFIG_ATTEMPT2.md` (sha256
  `66e21151af21ae7b9f6fc5d87c44f5266bdd6c7c1e9ff9031c76f14274ad5cdc`);
  runner `run_composed_served_attempt2.py`; scratch world/port (`:8111`),
  DeepSeek credential registered through the product, local fastembed
  embeddings, pilot `:8001` untouched.
- **40/58 checks passed. First failure / classification:
  `l3_documents_receipt_missing`.**
- **This attempt is non-governing.** It does not promote or deploy anything;
  the pilot (`8c593e57031e`) remains the rollback-tested served build.

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

### Failed (18)

`comparison_broader_obligation_open`, `comparison_requirement_captured`,
`continuation_actions_proposed`, `continuation_capture_archived`,
`continuation_date_only_completed`, `continuation_interpretation_deepseek`,
`continuation_requirement_captured`, `continuation_settlement_basis`,
`continuation_source_resolved`, `edit_settled_completed`,
`l3_documents_receipt_executed`, `l3_history_agreement`,
`l3_objective_met`, `l3_receipt_verified_complete`,
`l3_settlement_completed`, `live_db_unchanged`,
`restart_execution_persists`, `restart_history_agreement`.

## The boundary: one server cannot serve both legs

| leg | proven route (parent evidence) | composed attempt 2 under the one DeepSeek pin |
| --- | --- | --- |
| L3 sourced answer | L3 parent `6d662abff`: interpretation default `qwen3.8-flash` via the pilot cloud route (opencode-go), reply `ollama/llama3.1:8b`; intent `search_request` → `documents.search` with verified complete receipt (`match_count=1`, `coverage=complete`), `objective_met=true`, `outcome=completed` | intent `search_request`, interpretation `llm:deepseek-v4-pro` (25.3 s) → action **`research`** resolved by **`context_assembly`** only. Answer content correct (`QUARTZ-77`, no decoy `BASALT-13`) but **no `documents.search`** receipt and no settled saved status (`outcome=null`, `objective_met=null`; requirement `sources=["documents"]`, `artifact_attached=false`, `fields=[]`). Recorded delivery model `deepseek-v4-pro` — also not the declared Ollama reply. |
| L2 comparison (S3) | L2 attempt 12 `c0cbea9f1` (DeepSeek direct, approved-records-only world): interpretation `deepseek-v4-pro`, requested fields include `any fields that differ`, `broader_comparison=true`, deterministic verified reply, broader OPEN, 63.55 s | interpretation `deepseek-v4-pro` (42.1 s), action kinds `research`/`presentation`, requested field only `expiration_date` → `broader_comparison=false`, `context_fulfillment=partial`/`missing_comparison`. The reply stayed truthful and visibly open ("I did not find one in what this turn actually searched, and I can't rule out places that were not searched") but the request-bound broader obligation was not captured. Zero writes, body unchanged, correct date. |
| L2 continuation (S7) | L2 attempt 12: interpretation `deepseek-v4-pro`, `broader_comparison=false`, `expiration_date`, requirement resolved to `approved_records_q2026_114.txt`, `context_fulfillment=completed`, `outcome=completed`, 49.41 s | interpretation timed out at the 65 s stage bound (`reason=timeout`); flash retries timed out/cancelled (`worker_may_still_run=true`); interpreted `unresolved`; `outcome=unconfirmed`/`success=false`; no actions/context fulfillment; turn 94.77 s against the 95 s bound. |
| L1 edit / identical re-ask | L1 parent `aaa1169d7` | Passed: receipt `outcome=completed`, `postcondition_verified=true`, `updated=true`, exactly +1 audit; identical re-ask `noop=true`/`noop_reason=already_satisfied`/`no_apply=true`, zero added writes, body unchanged, served `outcome=completed`; durable edit row `objective_met=true`/`mutation.readback_matched=true`; edit/re-ask rows persisted after restart. |

Product check (no per-turn selection exists):

- `core/atom_agent_endpoints.py` `ChatRequest` exposes `message`, `user_id`,
  `session_id`, `current_page`, `context`, `conversation_history`, `agent_id`,
  `workspace_id` — no model/provider/interpretation field.
- `ATOM_TURN_INTERPRETATION` defaults **on** (`core/turn_decision.py`,
  `interpretation_enabled()`), and the interpretation pin is a single global
  value (`ATOM_TURN_INTERPRET_PIN`, measured default `qwen3.8-flash` via
  `opencode-go`).
- Therefore one server cannot run the L3 route (opencode-go/qwen3.8-flash) and
  the L2 route (DeepSeek direct) at the same time.

## Harness notes (not product behavior)

- `edit_settled_completed` false is a check-extraction bug: `task_of()` reads
  the execution summary task outcome, which drops `mutation`; the durable row
  and the served receipt are both complete (`mutation.readback_matched=true`,
  `objective_met=true`, `outcome=completed`).
- `live_db_unchanged` false is a **concurrent live-world write**: the scratch
  server's identity database was
  `.../l1-l2-l3-composed-attempt2/atom.db` (health identity), while
  `backend/data/atom.db` changed at 2026-10-19 21:53:48 EDT (mid-run; mtime was
  20:09:25 before) with the pilot still identity-identical
  (`pilot_untouched=true`, PID 81067, commit `8c593e57031e`). No scratch write
  to the live DB is evidenced; attribution is incomplete, so live-data
  deployment remains blocked.
- The composed world also exposes a context interaction: the L3 fixture sits in
  the same workspace as the approved records, and the S3 request-scope capture
  narrowed to the date while S7's interpretation prompt (3258 chars) exceeded
  the 65 s bound.

## Decision and next step

Stop. Do not deploy the integrated candidate as supporting the composed
workflow. The composed workflow becomes supportable only with either:

1. **per-turn interpretation routing** (product change; e.g. route
   document-source asks to the opencode-go/qwen route and comparison/
   continuation asks to the DeepSeek route, or a request-level override), or
2. a **declared configuration transition with source-scoped context**
   (two-phase configuration; keep the approved-records world scoped for the
   comparison leg), which has not been designed or tested.

The individual workflows remain supported on their own declared configurations:
L1 re-ask (`aaa1169d7`), L3 sourced answer (`6d662abff`, opencode-go/qwen +
Ollama reply), L2 comparison/continuation (`c0cbea9f1`, DeepSeek direct).

## Evidence

- `PREDECLARED_CONFIG_ATTEMPT2.md`, `run_composed_served_attempt2.py`
- `attempt2_config.json`, `attempt2_result.json`, `attempt2_summary.json`,
  `attempt2_run.log`
- `attempt2_server_pre.log`, `attempt2_server_restart.log`,
  `attempt2_observation_pre.jsonl`, `attempt2_observation_restart.jsonl`,
  `attempt2_interpreter_freeze.txt`
- `CHECKSUMS_ATTEMPT2.sha256`
