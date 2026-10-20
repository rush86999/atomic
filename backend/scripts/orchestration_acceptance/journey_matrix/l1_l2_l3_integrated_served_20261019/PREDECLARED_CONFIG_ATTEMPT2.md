# PREDECLARED CONFIGURATION — L1+L2+L3 integrated composed served acceptance, attempt 2

**Written before attempt 2. Frozen for this run; no mid-run product repairs.**
The candidate is unchanged from attempt 1. This attempt corrects job design and
check definitions only; no product code is edited. If a product defect appears,
the attempt stops and a new candidate/predeclaration is required. Harness-only
defects (paths, parsing, launch) may be corrected only if they do not alter the
candidate or the checks below.

## 0. Relationship to attempt 1 (retained, non-governing)

Attempt 1 ran the exact candidate `ddcc404dd` with a custom L3 ask
(“approved valid-until date for quotation Q-2026-114”). It is retained in
`attempt1_*` as evidence but is **not governing** because its failures were job
design / check extraction, not merge defects:

1. **L3 classification `l3_untruthful_answer`.** The custom ask did not trigger
   the documents lane; the reply asked to connect document storage. The L3
   parent acceptance (`l3_document_evidence_served_20261018/attempt1_result.json`)
   used the original Zephyr-9 ask/fixture with the same candidate lineage and
   the same Ollama reply route, executed `documents.search`, and answered
   `QUARTZ-77`. Attempt 2 therefore uses that proven ask/fixture unchanged.
2. **No-op receipt missed.** The served receipt is under
   `metadata.canvas_edit`; attempt 1 read only `data.canvas_edit`. The product
   behavior (noop=true, already_satisfied, zero writes, receipt reply) passed.
3. **Edit settlement read the wrong field.** A synchronous canvas edit has a
   nullable top-level task outcome; its settlement is the served
   `canvas_edit.outcome=completed` + `postcondition_verified=true` +
   `updated=true`, backed by the durable execution row and the one-audit/body
   delta.
4. **Broader comparison narrowed to the date.** Attempt 1 sent the S3 ask as a
   continuation in the edit session; the interpretation became
   `scope_change=continue`, `requested_fields=["Valid Until date"]`, hence
   `broader_comparison=false`. The L2 attempt-12 evidence is a fresh
   comparison request with `scope_change=replace`,
   `requested_fields=["Valid Until date","any fields that differ"]`, and
   `broader_comparison=true`. Attempt 2 runs the comparison in a fresh
   conversation against the same draft, exactly as the L2 acceptance does.

Attempt 1's candidate, merge topology, and source tree are unchanged.

## 1. Candidate under test

| item | value |
|---|---|
| worktree | `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/l1-l2-l3-integration` |
| branch | `integration/l1-l2-l3` |
| HEAD | `ddcc404ddca2c1ff50b02d510d0d0c3d376cc4ab` |
| status | clean (the runner refuses a dirty worktree) |
| L3 parent | `6d662abff` — contains L1 `aaa1169d7` |
| L2 parent | `c0cbea9f1` (attempt-12 verified, promoted as `e6308cb54`) |
| main parent | `e6308cb54` |
| merge base | `bb8081b288` |

The integration candidate is the L2 merge into the L3 tip, then main merged for
the newer promotion records. The only product-code conflicts were in
`backend/integrations/chat_orchestrator.py` and the support statement. The code
conflict was resolved to the union: L3's extracted
`_build_evidence_requirement` plus L2's `accepted_request`, with
`_stash_evidence_requirement` accepting and forwarding `accepted_request` so the
evidence requirement is not silently disabled by a swallowed `TypeError`. The
support statement takes the L2-lineage served-verification text. See
`PREDECLARED_CONFIG.md` §1 for the attempt-1 record.

## 2. Declared provider configuration — one configuration, explicit legs

This is one declared configuration with per-leg routes; it is **not** a claim
that DeepSeek covers every leg. Each intended route is explicitly exercised and
the actual observed route/model is recorded in `attempt2_result.json` and
`attempt2_summary.json`.

| leg | declared route | how it is controlled/verified |
|---|---|---|
| turn interpretation (comparison + continuation; L3/edit if used) | **DeepSeek direct**, `ATOM_TURN_INTERPRET_PIN=deepseek:deepseek-v4-pro` | one authorized DeepSeek vault entry is registered through the product; the hook records the interpretation `origin`; checks require `llm:` + `deepseek` for the comparison/continuation turns and record the L3 origin |
| edit planning | **DeepSeek direct**, `ATOM_ASYNC_EDIT_PLAN_MODEL=deepseek/deepseek-v4-pro` | configured pin; the deterministic assignment/no-op path may run without an LLM plan; the actual path and edit receipt are recorded |
| L3 document source-read / reply | **local Ollama `llama3.1:8b`** | the L3 parent acceptance's observed reply route (`llama3.1:8b`, `search_request` intent, `documents.search` executed). The scratch env declares `ATOM_PROVIDER=ollama`, `ATOM_DEFAULT_MODEL=llama3.1:8b`, `PREFERRED_PROVIDER=ollama`. DeepSeek is **not** claimed for this leg |
| structured tool dispatch | product-selected; DeepSeek is the only registered structured credential | structured-dispatch models are parsed from the served log; at least one `deepseek/` dispatch is required by `provider_structured_deepseek` |
| comparison/continuation narration | deterministic receipt-derived text | the reply is the comparison/continuation receipt, not a free-form provider claim; the actual message is recorded and checked for truthfulness/open scope |
| embeddings | local fastembed `BAAI/bge-small-en-v1.5`, dim 384 | no cloud embedding key is copied |

Authorized credential: live vault row
`tenant_default_deepseek_default_production` (`provider_id=deepseek`,
`key_name=default`, `environment=production`, active), decrypted and registered
through `POST /api/ai/providers/deepseek/keys`. The value is never logged or
recorded, and the vault is not copied wholesale. The declared route is
`https://api.deepseek.com/v1`.

`OPENCODE_BASE_URL` remains the pilot-class default
`https://opencode.ai/zen/go/v1` for unpinned/legacy paths; no OpenCode-Go
credential is registered in the scratch world. The explicit Ollama defaults
match the L3 parent's observed reply route; they do not change the DeepSeek
structured pins.

## 3. Isolation, flags, and bounds

- Fresh user registered through the product. Two conversations in the same
  scratch world: **session A** carries the L3 sourced answer, edit, and
  identical re-ask; **session B** is a fresh comparison conversation against
  the same draft, carrying the comparison and date-only continuation.
- Scratch SQLite/LanceDB/BYOK stores under
  `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/l2-fix/scratch/l1-l2-l3-composed-attempt2`;
  port 8111; no live environment copied wholesale; publication of `:8001` and
  `:3000` is not touched.
- Live dev DB `backend/data/atom.db`: SHA-256 + mtime captured before and
  after; the run fails if it changes.
- Pilot `:8001`/`:3000`: identity (instance/pid/started_at) and listeners
  captured before and after; the run fails if the pilot is touched.
- Flags: `CHAT_FINALIZATION_M1=1`, `CHAT_FINALIZATION_M2=1`,
  `ATOM_TASK_LIFECYCLE_ENABLED=1`, `ATOM_TURN_DECISION_ROUTING=1`,
  `ATOM_TURN_INTERPRETATION=1`, `ATOM_TURN_INTERPRET_CAPTURE=1`,
  scheduler/ingestion off, `ENVIRONMENT=development`,
  `ALLOW_DEV_TEMP_USERS=true`; `ATOM_PROVIDER=ollama`,
  `ATOM_DEFAULT_MODEL=llama3.1:8b`, `PREFERRED_PROVIDER=ollama`;
  `ATOM_TURN_INTERPRET_PIN=deepseek:deepseek-v4-pro`;
  `ATOM_ASYNC_EDIT_PLAN_MODEL=deepseek/deepseek-v4-pro`.
- The candidate source is not edited. The observation launcher wraps
  production seams outside the candidate and records
  `interpret_turn_request`, `apply_interpretation_references`,
  `_stash_evidence_requirement` (including `accepted_request`),
  `_context_backed_fulfillment`, and `_fallback_turn_outcome`.
- Turn/interpretation bounds are unchanged. Per-turn latency is recorded for
  transparency, **not gated**: 49–64 s turns are accepted functional behavior;
  responsiveness is a separate improvement.

## 4. Composed job

The journey is one composed user workflow across two conversations in the same
user/world/draft. The comparison is deliberately a fresh conversation because
the L2 request-bound comparison scope is a replace-scope request; attempt 1
proved that a continuation narrows the same ask to the date.

1. **Upload** both fixtures through `POST /api/documents/upload`:
   - `approved_records_q2026_114.txt` — approved unit price $48,000.00,
     payment terms Net 30, valid until 2026-12-31;
   - `l3_zephyr9_fixture.txt` — the L3 parent acceptance's exact fixture:
     “The launch code for project Zephyr-9 is QUARTZ-77” plus the decoy
     “the archive key for project Halcyon-2 is BASALT-13”.
2. **Sourced answer (L3, session A)**: ask the original L3 parent ask,
   *“search my uploaded documents for the launch code for project Zephyr-9 and
   tell me the code”*, with no canvas context. Expected: the final message
   contains `QUARTZ-77`, does not contain the decoy `BASALT-13`, and does not
   ask to connect storage; a `documents*` receipt is verified=true with
   complete coverage/match_count ≥ 1, bound to the response execution row;
   objective_met true; delivered; settlement completed/success; no canvas
   created. The interpretation origin is DeepSeek (or at least one DeepSeek
   structured dispatch is recorded); the reply leg is the declared Ollama
   route.
3. **Draft (session A)**: create the quotation canvas through the product and
   seed the declared body (Terms Net 45, Valid until 2026-12-31); capture the
   baseline audits.
4. **Edit (session A)**: ask *“Please update the payment terms in the draft to
   Net 30.”* with the canvas context. Expected: exactly one new canvas audit;
   the body holds `Terms: Net 30` (and not Net 45); the other declared fields
   and the date are preserved. Settlement: the served
   `metadata.canvas_edit` receipt reports `outcome=completed`,
   `postcondition_verified=true`, `updated=true`; the durable execution row
   reports `objective_met=true` and `mutation.readback_matched=true`; the
   top-level task outcome may be null for this synchronous edit.
5. **Identical re-ask (session A)**: send the same EDIT ask in the same
   session/canvas with a new request id. Expected: the served
   `metadata.canvas_edit` receipt reports `noop=true`,
   `noop_reason=already_satisfied`, `no_apply=true`, `updated=false`
   (`outcome=refused`, `planner_outcome=declined` in the observed receipt);
   **zero additional canvas writes** (canvas_audit count unchanged and body
   byte-identical); the receipt-derived reply contains “Verified on the
   current draft” and “nothing was sent”; fresh-history agreement.
6. **Comparison (session B, fresh conversation)**: send the original S3 ask
   (compare the draft with the uploaded Approved Records; does the Valid Until
   date match; flag anything that differs; do not change anything). Because
   this is a fresh conversation, the interpretation must be a replace-scope
   request with `broader_comparison=true`. Expected: the reply contains
   `2026-12-31`, no wrong date, no global-consistency claim, and a visible
   broader-open line (“broader comparison … open”, “not compared”, or
   “unassessed”); context fulfillment is `partial` with a named gap
   (`missing_comparison` or `missing_fields`); zero canvas writes; body
   unchanged; settlement basis partial/success; the requirement is captured
   with a document source, artifact attached, and `broader_comparison=true`,
   bound to the execution; interpretation origin DeepSeek.
7. **Date-only continuation (session B)**: send the original S7 ask (current
   Valid until date; does it still match). Expected: the reply contains
   `2026-12-31`, no false update claim; zero canvas writes; body unchanged;
   context fulfillment completed for the date-only scope; requirement fields
   exactly `["expiration_date"]`, `broader_comparison=false`, identity resolved
   to the approved fixture; at least one allowed action proposed; capture
   archived with pre/post validation; settlement completed/success;
   interpretation origin DeepSeek.
8. **Restart/reload**: stop the scratch server, relaunch it on the same scratch
   DB/stores/port, and verify:
   - runtime identity still the candidate (cwd/commit, dirty=false);
   - both conversations' assistant counts and last responses agree with the
     pre-restart responses; the session B continuation has an explicit
     non-null completed/success outcome;
   - the durable assistant rows, execution ids, and last contents agree;
   - the edit execution row persists with `objective_met=true` and
     `mutation.readback_matched=true`; the no-op execution row and the S7
     execution row persist; the S7 row has `objective_met=true`;
   - zero new canvas writes; body unchanged; audit list unchanged.

## 5. Pass criteria (all 58 must hold)

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

- **edit settlement**: served `metadata.canvas_edit` receipt
  `outcome=completed`, `postcondition_verified=true`, `updated=true`, plus the
  durable execution row `objective_met=true` and
  `mutation.readback_matched=true`, plus exactly one audit delta and the body
  applied. A null top-level task outcome is accepted for a synchronous edit;
  the execution row is the durable settlement.
- **no-op receipt**: served `metadata.canvas_edit` (read first; `data` is a
  compatibility fallback) with `noop=true`, `noop_reason=already_satisfied`,
  `no_apply=true`, `updated=false`; zero additional canvas writes; the reply is
  derived from that receipt. The no-op flag is a turn-time metadata field; the
  durable message/execution/audit evidence is what the restart agreement uses.
- **comparison broader obligation open**: requirement
  `broader_comparison=true`; context fulfillment state `partial` with
  `missing_comparison` or a non-empty `missing_fields`; and the served reply
  visibly says the broader comparison is open (or that fields were not
  compared / remain unassessed). The settlement basis must be consistent with
  the partial state.
- **history/reload agreement**: for session B, the final non-null
  completed/success equals the freshly reloaded last assistant response and
  the persisted last assistant row; for session A, the no-op reply text and
  success equal the reloaded/persisted values, with the durable execution id
  linkage. The edit, no-op, and S7 execution rows persist. A null final is not
  accepted for session B; the no-op's explicit receipt-derived reply and
  success are the session A evidence.
- **zero additional writes**: the `canvas_audit` row count is unchanged and
  the canvas body is byte-identical. The conversation still records the new
  turn, as it must.

## 6. Known inherited unit-suite failures (unchanged candidate)

The wider focused run has no merge-specific failures; the integration
candidate's failure set equals the L2 parent set (25 failures: 14
`test_chat_canvas_editor`, 2 `TestEditPlanRungKnob`, 9
`test_objective_evidence_flow`; the L3 parent has 23). The 11-file focused run
has the documented pre-existing
`test_fallback_honesty.py::TestNoOpAuthorityIsARecord::test_satisfied_requirement_completes`
failure, identical on the L3 parent and documented in
`l1_s6_authorized_route_20261018/SCOPE_REPAIR_SUCCESSOR_AND_CONFIG.md`. These
are inherited unit-suite limitations, not a claim of a clean full suite. The
served composed workflow is the acceptance evidence for the user-facing paths.

## 7. Scope and limitations

- **Supported claim**: the exact candidate + declared configuration above, for
  the composed workflow actually exercised. Not a general natural-language
  claim and not a claim about every provider.
- **Provider legs are explicit**: DeepSeek direct is claimed for structured
  interpretation and edit planning; the L3 document source-read/reply leg is
  the declared local Ollama route; comparison/continuation narration is
  deterministic receipt text. DeepSeek compatibility for the L3 reply leg is
  not claimed.
- **Broader whole-document comparison remains OPEN by design**: the comparison
  stage must not claim global consistency; the date field and the named gap are
  the verified claims. The request-bound requirement carries
  `broader_comparison=true` in the fresh comparison conversation.
- **Date-only continuation is narrow**: date-only fields only; the
  whole-document comparison is not claimed.
- **Served canvas_edit metadata is not rehydrated by the history endpoint**:
  the receipt (including the noop flag) is returned with the turn. After
  reload, the receipt-derived reply, success, execution id, execution row, and
  canvas audit/body persist. The restart agreement uses those durable records;
  it does not claim the `metadata.canvas_edit` object itself is replayed.
- **Latency**: observed per-turn wall time is recorded. 49–64 s turns
  demonstrate functional behavior; responsiveness remains a separate
  improvement. The bounds are not rewritten.
- **Restart**: the claim covers reload agreement after a restart of the same
  scratch stores, not arbitrary crash recovery or multi-instance durability.
- No live DB write, no pilot restart, and no candidate edit are authorized by
  this predeclaration.

## 8. Evidence written by the runner

- `attempt2_config.json` — frozen configuration, candidate/source hashes,
  isolation, flags, live-DB/pilot guards.
- `attempt2_observation_pre.jsonl`, `attempt2_observation_restart.jsonl` —
  behavior-preserving hook records (including `accepted_request`).
- `attempt2_server_pre.log`, `attempt2_server_restart.log` — served log;
  structured dispatch models, interpretation routes, reply routes.
- `attempt2_result.json` — full per-stage captures, checks, route evidence.
- `attempt2_summary.json` — classification, checks, stage summary, routes.
