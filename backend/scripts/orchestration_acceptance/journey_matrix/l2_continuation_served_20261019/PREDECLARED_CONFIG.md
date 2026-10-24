# L2 continuation evidence — served acceptance PREDECLARED configuration (2026-10-19)

**Declared BEFORE the attempt. One attempt. No mid-run repairs.** This
document is the declaration; the attempt record (`attempt1_config.json`,
`attempt1_result.json`, `attempt1_observation.jsonl`, `attempt1_server.log`)
is written after it and carries this file's sha256.

## Candidate (unchanged, approved for served acceptance)

- Branch `codex/l2-continuation-evidence`, commit
  `a6cd2c8baecc2976d3c8021861f804117d1aa036` (the approved successor;
  parent `ddab120c43333efdc219098cba35fdecd9a0988f`, the L3 promotion
  commit — untouched).
- Worktree:
  `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/l2-continuation-evidence`
  — tree clean at declaration (the driver refuses otherwise). Runtime
  identity is read from the served process's health endpoint.
- Source hashes at declaration:
  - `backend/core/turn_decision.py`
    `0096a26bc2a140de9f1fbeca2ff9d4cdc468a0e0ea82f3c5bb231c13ae045fd0`
  - `backend/integrations/chat_orchestrator.py`
    `4e860e7950cf13149772c95c391428a44db46931034c16d75af53dccb30e2287`
- Scope of the claim: **the tested continuation-reference mechanism on this
  exact candidate + configuration**. NOT general natural-language reference
  resolution, NOT restart durability, NOT pilot deployment.

## Configuration (pilot-matching cloud route, scratch isolation)

```text
OPENCODE_BASE_URL:          https://opencode.ai/zen/go/v1
                            (THE PILOT'S OWN CLOUD ROUTE; no global
                            endpoint change)
provider set:               opencode-go ONLY — real cloud interpretation
                            and reply; one authorized operator/global vault
                            entry (opencode-go_default_production)
                            registered through the scratch product API;
                            the value is never logged or recorded
EMBEDDING_PROVIDER:         fastembed          (pilot parity, local)
FASTEMBED_MODEL:            BAAI/bge-small-en-v1.5
EMBEDDING_DIM:              384
CHAT_FINALIZATION_M1:       1  (same as pilot)
CHAT_FINALIZATION_M2:       1  (same as pilot)
ATOM_TASK_LIFECYCLE_ENABLED: 1 (same as pilot)
ATOM_TURN_DECISION_ROUTING: 1  (the production decision seam)
ATOM_TURN_INTERPRETATION:   1  (the production interpretation seam)
ENABLE_SCHEDULER:           false
ENABLE_INGESTION_SYNC:      false
ENVIRONMENT:                development
ALLOW_DEV_TEMP_USERS:       true
interpreter:                /Users/rushiparikh/projects/atom/backend/venv314/bin/python
isolation:                  fresh port 8095; scratch SQLite / LanceDB
                            (LANCEDB_URI + LANCEDB_URI_BASE) / BYOK stores
                            only; no .env/vault wholesale copy; live dev DB
                            hash+mtime guarded; pilot :8001/:3000 untouched;
                            L1/L3 worktrees and evidence untouched
```

**Real, unpinned interpretation.** The interpretation model is the
product's own `fast`/planning choice (BPC-ranked, no pin). The actual
origin/model and structured dispatch are recorded from the served process,
whatever they are. The reply route is likewise whatever the product
selects; the actual route/model is recorded and no gate depends on it.

**Observation harness (behavior-preserving, external).** The candidate
source is not edited. The server launcher installs read-only hooks around
five production seams — `interpret_turn_request`,
`apply_interpretation_references`, `_stash_evidence_requirement`,
`_context_backed_fulfillment`, and `_fallback_turn_outcome` — and appends
their inputs/outputs to `attempt1_observation.jsonl`. The hooks call the
original functions and return their results unchanged; they exist because
the interpretation record and the execution-keyed requirement carrier are
session-scoped and are not otherwise persisted. The durable execution row
and the product responses remain the authoritative record for settlement.

## The job (original asks, unchanged)

1. Register a FRESH user through the product.
2. Upload the exact approved-records fixture through the product's own
   `POST /api/documents/upload` route:

   ```text
   APPROVED RECORDS — Quotation Q-2026-114
   Source: Sales Operations approved-terms register
   Client: Dunmore Fabrication LLC
   Item: CNC press brake, 50-ton
   Approved unit price: $48,000.00
   Approved payment terms: Net 30
   Approved valid until: 2026-12-31
   Approved by: Sales Operations
   ```

   file name `approved_records_q2026_114.txt` (279 bytes).
3. Create the draft through the product (`POST /api/canvas`, then
   `PUT /api/canvas/{id}`) in the exact state the original S7 read
   (the post-revision draft): `Terms: Net 45`, `Valid until: 2026-12-31`.
   S4/S5/S6 are **not** re-run: the draft is seeded in their durable
   result state, and no edit claim is made by this slice.
4. **S3 first** — the original comparison ask, unchanged:

   ```text
   Compare the draft quotation with my uploaded Approved Records document.
   Does the Valid Until date in the draft match the approved record?
   Flag anything that differs. Do not change anything yet.
   ```

5. **Then the original S7 continuation**, unchanged:

   ```text
   What is the current Valid until date on the draft, and does it still
   match the approved record?
   ```

Both turns are sent on the same conversation with the draft attached as
the canvas context. S3 is the prior-evidence/contrast turn; S7 is the
certification target. The S3 retrieval observation is what the S7
interpretation must resolve "the approved record" against.

## Predeclared settlement rule — completion vs partial

The outcome is **not** selected by this declaration; the recorded F-C2
basis decides. Either token is accepted only with the evidence named here:

- **completed** is justified only when all hold:
  `success=true`, `outcome=completed`, `objective_met=true`,
  `delivery.delivered=true`, the persisted F-C2 criterion
  (`context_source_fulfillment`) carries the matched source
  `approved_records_q2026_114.txt`, the resolver's recorded
  `context_fulfillment.state` is `completed`, the requested date field is
  in `supplied_fields`, and (because the canvas is attached) the recorded
  comparison carrier for that execution is complete.
- **partial** is justified only when all hold:
  `success=true`, `outcome=partial`, `delivery.delivered=true`, the
  resolver's `context_fulfillment.state` is `partial` with the matched
  source `approved_records_q2026_114.txt`, the requested date field is in
  `supplied_fields`, the specific gap is recorded
  (`missing_comparison=true` and/or `missing_fields`), and `open_work`
  names that gap; the reply must not claim the turn completed the gap.
- **unconfirmed / failed / error / success=false is NOT accepted** — that
  is the original S7 defect still present.

S3 is expected to resolve `partial` if the comparison carrier is absent
(the pre-fix run-3/run-4 shape); S7 is the certification target. A
completed S3 is accepted only with the complete-carrier evidence above.
The promoted claim will name exactly which token the served run
demonstrated.

## Gates (all must hold; first failure names the broken transition)

1. `runtime_identity` — served cwd = candidate backend, commit =
   `a6cd2c8baecc`, dirty=false.
2. `fixture_uploaded_through_product` — HTTP 200, ingested row with the
   exact file name and the approved date in its preview.
3. `draft_created_through_product` — canvas create/seed through the
   product; GET body carries `Terms: Net 45` and `Valid until: 2026-12-31`.
4. `real_interpretation_dispatched` — the interpretation record is a real
   LLM origin (not unresolved), with a real structured dispatch recorded
   in the served log; S7's actual interpretation proposes the approved
   record antecedent (by name or the observed document kind).
5. `prior_evidence_observed` — S7's composition runs against the
   conversation's observed pool containing
   `approved_records_q2026_114.txt` from the **S3** execution (not the
   current turn).
6. `s3_reply_received` + `s3_truthful_comparison` — valid-until match
   stated truthfully; the Net 45 vs approved Net 30 difference flagged
   (or explicitly not compared); no false "terms match"; no change claim.
7. `s3_zero_canvas_writes` + `s3_draft_unchanged` — audit delta 0; GET
   body byte-identical.
8. `s3_settlement_basis` — the predeclared completed/partial rule with the
   recorded basis; explicit `success`/`outcome`.
9. `s3_requirement_captured` — `required=true`, sources include
   `document`, `artifact_attached=true`, execution-keyed to the S3
   response's execution id.
10. `s7_reply_received` + `s7_truthful_comparison` — current draft
    valid-until `2026-12-31`, still matching the approved record; no
    fabricated change.
11. `s7_zero_new_writes` + `s7_draft_unchanged` — audit delta 0; GET body
    byte-identical (`s7-zero-new-work` preserved).
12. `s7_requirement_captured` — `required=true`, sources include
    `document`, `file.file_name=approved_records_q2026_114.txt`,
    `identity.state=resolved` with the catalog `file_id`, requested date
    field present, execution-keyed to the S7 response's execution id.
13. `s7_resolved_source_identity` — composition marker state `resolved`,
    `resolved_file=approved_records_q2026_114.txt`; no ambiguous /
    unresolved marker; observed antecedent execution id = S3's.
14. `s7_settlement_basis` — the predeclared completed/partial rule with
    the recorded F-C2 basis and `success=true`.
15. `response_persisted_fresh_history_agreement` — explicit non-null
    outcome/success in the response, the persisted assistant row, and a
    fresh history reload; all agree; the response execution id selects the
    exact execution row (same session/user/workspace).
16. `live_db_unchanged` — live dev DB sha256+mtime unchanged.
17. `pilot_untouched` — pilot `:8001`/`:3000` identities unchanged before
    and after; no restart.

## Failure discipline

Every attempt is preserved. On the first failed gate the attempt is
reported with the actual records; there is no mid-run repair, retry, model
campaign, or tokenizer expansion. Promotion is only the demonstrated
candidate/configuration-bound claim.
