# L3 served acceptance — PREDECLARED configuration (2026-10-18)

**Declared BEFORE the attempt. One attempt. No mid-run repairs.**

## Candidate (unchanged, approved for served acceptance)

- Branch `codex/l3-document-evidence`, commit
  `6d662abfffc2d9e42ab209cf68521e4933edcf27` (repair `8f881fd6c` +
  evidence `6d662abff`); parent `aaa1169d7` (L1 successor, untouched).
- Worktree: `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/
  opencode/l3-doc-evidence` — tree clean at launch (the driver refuses
  otherwise). Runtime identity read from the served process's health.

## Configuration (pilot-matching cloud route, scratch isolation)

```text
OPENCODE_BASE_URL:          https://opencode.ai/zen/go/v1
                            (THE PILOT'S OWN CLOUD ROUTE — the F-R1
                            finding's planner class; NOT the Go
                            inference URL, which is not needed by this
                            turn; no global endpoint change)
provider set:               opencode-go ONLY — real cloud planning and
                            reply (the pilot's provider shape); no local
                            Ollama runtime registered for this attempt
credential:                 ONE authorized operator/global vault entry
                            (opencode-go_default_production), registered
                            through the scratch product API; value never
                            logged or recorded
EMBEDDING_PROVIDER:         fastembed          (pilot parity, local)
FASTEMBED_MODEL:            BAAI/bge-small-en-v1.5
EMBEDDING_DIM:              384
CHAT_FINALIZATION_M1:       1  (same as pilot)
CHAT_FINALIZATION_M2:       1  (same as pilot)
ATOM_TASK_LIFECYCLE_ENABLED: 1 (same as pilot)
ENABLE_SCHEDULER:           false
ENABLE_INGESTION_SYNC:      false
ENVIRONMENT:                development
ALLOW_DEV_TEMP_USERS:       true
interpreter:                /Users/rushiparikh/projects/atom/backend/venv314/bin/python
isolation:                  fresh port 8094; scratch DB / LanceDB / BYOK
                            stores only; no .env/vault wholesale copy;
                            live dev DB hash+mtime guarded; pilot
                            :8001/:3000 untouched
```

## The job (original request, unchanged)

1. Register a FRESH user through the product.
2. Upload the Zephyr-9 fixture through the product's own
   `POST /api/documents/upload` route (exact bytes of the repeatability
   fixture: contains `QUARTZ-77`, plus the Halcyon-2 decoy).
3. Submit the ORIGINAL request unchanged:

   ```text
   search my uploaded documents for the launch code for project
   Zephyr-9 and tell me the code
   ```

   with real planning (no scripted/pinned structured response; the
   planner's own choice is recorded, whatever it is).

## Required checks (all must hold; first failure names the broken transition)

1. `upload_through_product` — upload HTTP 200 + the `ingested_documents`
   row exists with the fixture preview.
2. `planner_dispatch_real` — at least one real structured planner
   dispatch in the served log (models recorded).
3. `documents_receipt_executed` — a `documents.*` tool_outcome with
   `verified: true`.
4. `receipt_verified_complete_coverage` — its scoped ref carries
   `coverage: "complete"` and a non-negative int `match_count` ≥ 1.
5. `receipt_bound_to_current_request` — the ref's query names the
   Zephyr-9/launch request.
6. `objective_met_true` — the persisted `task_outcome.objective_met`
   is `true`.
7. `answer_contains_code` — the settled answer contains `QUARTZ-77`.
8. `successful_response` — response `success: true` (initial or settled).
9. `history_nonnull_agreement` — explicit non-null outcome/success after
   a fresh history reload, agreeing with the persisted assistant row.

**On pass:** promote L3 bound to this exact candidate + configuration
(matrix rev 12, support statement L3 bullet, registry entry) and archive
the evidence. **On fail:** preserve the attempt and report its first
broken transition; no new planning or approval round.
