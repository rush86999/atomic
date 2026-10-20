# PREDECLARED CONFIGURATION — L1+L2+L3 integrated composed served acceptance

**Written before the attempt. Frozen for this run; no mid-run product
repairs.** If any product defect appears, the attempt stops and a new
candidate/predeclaration is required. Harness-only defects (paths, parsing,
launch) may be corrected only if they do not alter the candidate or the
checks below.

## 1. Candidate under test

| item | value |
|---|---|
| worktree | `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/l1-l2-l3-integration` |
| branch | `integration/l1-l2-l3` |
| HEAD | `ddcc404ddca2c1ff50b02d510d0d0c3d376cc4ab` |
| status | clean (the runner refuses a dirty worktree) |
| L3 parent | `6d662abff` — contains L1 `aaa1169d7` (verified by ancestry, not assumption) |
| L2 parent | `c0cbea9f1` (attempt-12 verified, promoted as `e6308cb54`) |
| main parent | `e6308cb54` (promotion records / matrix rev 21; no runtime-code drift in the touched packages) |
| merge base | `bb8081b288` |

The integration candidate is the L2 merge into the L3 tip, then main merged
for the newer promotion records. The only product-code conflicts were in
`backend/integrations/chat_orchestrator.py` and the support statement. The
code conflict was resolved to the union:

- `_build_evidence_requirement` keeps L3's extracted requirement builder and
  adds L2's `accepted_request` parameter (the planner eligibility and the
  request-bound comparison scope share one builder).
- `_stash_evidence_requirement` accepts and forwards `accepted_request`. The
  automatic merge had paired L2's caller with L3's older stash signature; the
  resulting `TypeError` would have been swallowed by the caller's
  `except Exception`, silently disabling the evidence requirement. The merge
  restores the parameter and the observation harness records it.

The support statement takes the newer L2-lineage served-verification text.

## 2. Declared provider configuration — one configuration, explicit legs

This is a **mixed declared configuration**, not a claim that one provider
covers every leg. Each intended route is exercised by the workflow; the
actual observed route/model is recorded in `attempt1_result.json` and
`attempt1_summary.json`.

| leg | declared route | how it is controlled/verified |
|---|---|---|
| turn interpretation (comparison + continuation; L3/edit if used) | **DeepSeek direct**, `ATOM_TURN_INTERPRET_PIN=deepseek:deepseek-v4-pro` | one authorized DeepSeek vault entry is registered through the product; the observation hook records the interpretation `origin`; the check requires `llm:` + `deepseek` for the comparison and continuation turns |
| edit planning | **DeepSeek direct**, `ATOM_ASYNC_EDIT_PLAN_MODEL=deepseek/deepseek-v4-pro` | configured pin; if the deterministic assignment/no-op path runs without an LLM plan, the actual path is recorded and the edit still must pass its write/receipt checks |
| tool planning / document evidence (L3) | **product-selected structured dispatch**, with DeepSeek as the only registered structured credential | the structured-dispatch model(s) are parsed from the served log; at least one `deepseek/` structured dispatch is required |
| reply narration | **product-selected**; the L2 attempt-12 observed route was local Ollama `llama3.1:8b` | the reply route/model is parsed from `reply STREAMED` lines when present and recorded; no check depends on the reply being DeepSeek. The reply leg must still produce truthful, receipt-consistent messages |
| embeddings | local fastembed `BAAI/bge-small-en-v1.5`, dim 384 | not a provider leg; no cloud embedding key is copied |

Authorized credential: live vault row
`tenant_default_deepseek_default_production` (`provider_id=deepseek`,
`key_name=default`, `environment=production`, active), decrypted and
registered through `POST /api/ai/providers/deepseek/keys`. The value is never
logged or recorded, and the vault is not copied wholesale. The declared
route is `https://api.deepseek.com/v1`.

`OPENCODE_BASE_URL` remains the pilot-class default
`https://opencode.ai/zen/go/v1` for unpinned/legacy paths, but it is **not**
the structured route for this run; the DeepSeek credential + pins control the
structured legs. No OpenCode-Go credential is registered in the scratch
world.

## 3. Isolation and behavior flags

- Fresh user registered through the product; one session.
- Scratch SQLite/LanceDB/BYOK stores under the attempt scratch directory;
  port 8110; no live environment copied wholesale; publication of `:8001`
  and `:3000` is not touched.
- Live dev DB `backend/data/atom.db`: SHA-256 + mtime captured before and
  after; the run fails if it changes.
- Pilot `:8001`/`:3000`: identity (instance/pid/started_at) and listeners
  captured before and after; the run fails if the pilot is touched.
- Flags: `CHAT_FINALIZATION_M1=1`, `CHAT_FINALIZATION_M2=1`,
  `ATOM_TASK_LIFECYCLE_ENABLED=1`, `ATOM_TURN_DECISION_ROUTING=1`,
  `ATOM_TURN_INTERPRETATION=1`, scheduler/ingestion off,
  `ENVIRONMENT=development`, `ALLOW_DEV_TEMP_USERS=true`,
  `ATOM_TURN_INTERPRET_CAPTURE=1`.
- The candidate source is not edited. The observation launcher wraps
  production seams outside the candidate and records
  `interpret_turn_request`, `apply_interpretation_references`,
  `_stash_evidence_requirement` (including `accepted_request`),
  `_context_backed_fulfillment`, and `_fallback_turn_outcome`.
- Turn/interpretation bounds are unchanged. Per-turn latency is recorded for
  transparency, **not gated**: the 49–64 s turns are functional behavior and
  responsiveness is a separate improvement.

## 4. Composed job (one workflow, one session)

1. **Upload** `approved_records_q2026_114.txt` through
   `POST /api/documents/upload`. The fixture contains the approved unit
   price, payment terms (Net 30), and valid-until date (2026-12-31).
2. **Sourced answer (L3)**: ask
   *“Search my uploaded documents for the approved valid-until date for
   quotation Q-2026-114 and tell me the date.”* with no canvas context.
   Expected: `2026-12-31`, a `documents*` tool receipt with verified=true and
   complete coverage/match_count ≥ 1, bound to the response execution row;
   objective_met true; no canvas created.
3. **Draft**: create the quotation canvas through the product and seed the
   declared body (Terms Net 45, Valid until 2026-12-31); capture the baseline
   audits.
4. **Edit**: ask *“Please update the payment terms in the draft to Net 30.”*
   with the canvas context. Expected: exactly one new canvas audit; the body
   holds `Terms: Net 30` (and not Net 45); the other declared fields and the
   date are preserved; settlement completed/success.
5. **Identical re-ask**: send the same EDIT ask in the same session/canvas
   with a new request id. Expected: a structured
   `canvas_edit.noop=true`, `noop_reason=already_satisfied`; **zero
   additional canvas writes** (canvas_audit count unchanged and body
   unchanged); completed/success; the receipt-derived reply contains
   “Verified on the current draft” and “nothing was sent”; fresh-history
   agreement.
6. **Comparison (L2)**: send the original S3 ask (compare the draft with the
   uploaded Approved Records; does the Valid Until date match; flag anything
   that differs; do not change anything). Expected: the reply contains
   `2026-12-31`, no wrong date, no global-consistency claim; context
   fulfillment is `partial` with a named gap (`missing_comparison` or
   `missing_fields`) and the broader comparison is visibly open; zero canvas
   writes; body unchanged; settlement basis partial/success; the requirement
   is captured with a document source and the artifact attached and is bound
   to the execution; interpretation origin is DeepSeek.
7. **Date-only continuation (L2)**: send the original S7 ask (current Valid
   until date; does it still match). Expected: the reply contains
   `2026-12-31`, no false update claim; zero canvas writes; body unchanged;
   context fulfillment completed for the date-only scope; requirement fields
   exactly `["expiration_date"]`, `broader_comparison=false`, identity
   resolved to the fixture; at least one allowed action proposed; capture
   archived with pre/post validation; settlement completed/success;
   interpretation origin is DeepSeek.
8. **Restart/reload**: stop the scratch server, relaunch it on the same
   scratch DB/stores/port, and verify: runtime identity still the candidate
   (cwd/commit, dirty=false); history assistant count and the last response
   (outcome/success/message/execution_id) are identical; zero new canvas
   writes; body unchanged; the S7 execution row still exists.

## 5. Pass criteria (all must hold)

```text
runtime_identity
auth_user_resolved
deepseek_credential_active
fixture_uploaded_through_product
l3_http_ok
l3_answer_correct
l3_documents_receipt_executed
l3_receipt_verified_complete
l3_receipt_bound_to_execution
l3_objective_met
l3_settlement_completed
l3_no_canvas_created
l3_interpretation_deepseek
l3_history_agreement
draft_created_through_product
edit_http_ok
edit_body_applied
edit_audit_exactly_one
edit_settled_completed
edit_other_fields_preserved
reask_http_ok
reask_noop_receipt
reask_zero_additional_writes
reask_body_unchanged
reask_completed
reask_receipt_reply
reask_history_agreement
comparison_http_ok
comparison_truthful_date
comparison_no_false_date
comparison_no_global_claim
comparison_broader_obligation_open
comparison_zero_writes
comparison_draft_unchanged
comparison_settlement_basis
comparison_requirement_captured
comparison_interpretation_deepseek
comparison_history_agreement
continuation_http_ok
continuation_truthful_date
continuation_zero_writes
continuation_draft_unchanged
continuation_date_only_completed
continuation_source_resolved
continuation_actions_proposed
continuation_capture_archived
continuation_requirement_captured
continuation_settlement_basis
continuation_interpretation_deepseek
continuation_history_agreement
restart_runtime_identity
restart_history_agreement
restart_zero_new_writes
restart_canvas_unchanged
restart_execution_persists
provider_structured_deepseek
live_db_unchanged
pilot_untouched
```

Definitions used by the checks:

- **zero additional writes** (re-ask): the `canvas_audit` row count is
  unchanged and the canvas body is byte-identical. The conversation still
  records the new turn, as it must.
- **comparison broader obligation open**: context fulfillment state
  `partial` with `missing_comparison` or a non-empty `missing_fields`; the
  settlement basis must be consistent with that partial state.
- **date-only completed**: settlement outcome `completed`, context
  fulfillment state `completed`, requirement fields exactly
  `["expiration_date"]`, `broader_comparison` false, fixture identity
  resolved, and task objective_met/delivery true.
- **history agreement**: the final non-null outcome/success equals the
  freshly reloaded last assistant response and the persisted last assistant
  row; for execution-bound turns the response id, execution row id, and
  task-outcome execution id are identical. An initial `unconfirmed`
  placeholder is tolerated; a null final is not.

## 6. Known inherited unit-suite failures (not merge-specific)

The wider focused run (async continuation, objective evidence flow, turn
interpretation, chat history retrieval, history-window preservation, BYOK
fresh-install persistence, chat canvas editor) has **no merge-specific
failures**:

- Integration candidate failure set = the L2 parent set: 25 failures
  (14 `test_chat_canvas_editor`, 2 `TestEditPlanRungKnob`, 9
  `test_objective_evidence_flow`).
- L3 parent set: 23 failures (the same 14 + 2 + 7; it does not include the
  two request-bound comparison/task-outcome tests that fail on L2).
- The two extra L2-lineage failures
  (`test_orchestrator_persists_comparison_as_task_outcome`,
  `test_task_outcome_records_verified_canvas_mutation`) are synthetic
  `_build_turn_task_outcome` fixtures without the execution-keyed
  request-bound carrier; the L3 parent passes them because it lacks the L2
  request-bound gate. They do not add a served failure here; the composed
  run binds every turn to a real execution row.
- The 11-file focused run has one failure:
  `test_fallback_honesty.py::TestNoOpAuthorityIsARecord::test_satisfied_requirement_completes`.
  It is identical on the L3 parent and is documented in
  `l1_s6_authorized_route_20261018/SCOPE_REPAIR_SUCCESSOR_AND_CONFIG.md`
  as a pre-existing failure on the pristine `b96dec60a` baseline (the
  request-named-subject grid includes the numeric `9,900` target with no
  evidence). It is not introduced by this integration and is not repaired
  here (the served no-op path is the governing evidence).
- `test_chat_canvas_editor` 14 failures and the two `TestEditPlanRungKnob`
  failures are pre-existing on the L2 branch and documented in its
  neighbor-suite record.

These are inherited unit-suite limitations, not a claim of a clean full
suite. The composed served workflow is the acceptance evidence for the
user-facing paths.

## 7. Scope and limitations

- **Supported claim**: the exact candidate + declared configuration above,
  for the composed workflow actually exercised. Not a general natural-
  language claim and not a claim about every provider.
- **Broader whole-document comparison remains OPEN by design**: the
  comparison stage must not claim global consistency; the date field and the
  named gap are the verified claims.
- **L2 continuation is narrow**: date-only fields only; the whole-document
  comparison is not claimed.
- **Latency**: observed per-turn wall time is recorded. The 49–64 s turns
  demonstrate functional behavior; responsiveness remains a separate
  improvement. The bounds are not rewritten.
- **Pilot provider mix**: the deployed pilot's provider vault/mix is
  separate from this scratch-world acceptance; the deployment smoke is a
  basic product-surface check, not the DeepSeek support claim.
- **Restart**: the claim covers reload agreement after a restart of the same
  scratch stores, not arbitrary crash recovery or multi-instance durability.
- No live DB write, no pilot restart, and no candidate edit are authorized
  by this predeclaration.

## 8. Evidence written by the runner

- `attempt1_config.json` — frozen configuration, candidate/source hashes,
  isolation, flags, live-DB/pilot guards.
- `attempt1_observation_pre.jsonl`, `attempt1_observation_restart.jsonl` —
  behavior-preserving hook records (including `accepted_request`).
- `attempt1_server_pre.log`, `attempt1_server_restart.log` — served log;
  structured dispatch models, interpretation routes, reply routes.
- `attempt1_result.json` — full per-stage captures, checks, route evidence.
- `attempt1_summary.json` — classification, checks, stage summary, routes.
