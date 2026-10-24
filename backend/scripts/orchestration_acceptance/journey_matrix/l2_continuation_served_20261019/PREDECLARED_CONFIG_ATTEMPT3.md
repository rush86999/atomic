# L2 continuation evidence — served acceptance ATTEMPT 3 (2026-10-19)

**Declared BEFORE the attempt. One attempt. No mid-run repairs.** This is
the predeclared S3→S7 repeat on the bounded execution-policy successor
(producer correction + reasoning-off/budget/trace/MoA-opt-out). Attempts
1 and 2 are preserved unchanged in this directory.

## Candidate (frozen)

- Branch `codex/l2-continuation-evidence`, commit
  `10982e8390815ee394c853284d5accfd3e3ddee7` (parent `2604dea2d`, the
  review-corrected execution policy; tree clean at declaration).
- Source hashes at declaration:
  - `backend/core/turn_decision.py`
    `ed9ec40b9a6d0c413bcce5ba13ce027483663b8500abe8b19f4d423400ab2596`
  - `backend/integrations/chat_orchestrator.py`
    `4e860e7950cf13149772c95c391428a44db46931034c16d75af53dccb30e2287`
    (composer unchanged)
  - `backend/tests/test_l2_interpretation_transport.py`
    (transport/seam controls; see the candidate evidence README)
- The interpretation call now sends `task_type="planning"`,
  `disable_reasoning=True`, `max_tokens=5500` (derived budget with ~1.6x
  headroom), `route_trace_id=f"turn_interpretation:{request_id}"`,
  `allow_moa=False`; the 12-second deadline, BPC routing, authenticated
  scope and the source-resolution contract are unchanged.

## Configuration (identical to attempts 1/2 except the fresh port/world)

```text
OPENCODE_BASE_URL:          https://opencode.ai/zen/go/v1
provider set:               opencode-go ONLY — real cloud interpretation
                            and reply; one authorized operator/global
                            vault entry (opencode-go_default_production)
                            registered through the scratch product API;
                            the value is never logged or recorded
EMBEDDING_PROVIDER:         fastembed          (pilot parity, local)
FASTEMBED_MODEL:            BAAI/bge-small-en-v1.5
EMBEDDING_DIM:              384
CHAT_FINALIZATION_M1:       1  (same as pilot)
CHAT_FINALIZATION_M2:       1  (same as pilot)
ATOM_TASK_LIFECYCLE_ENABLED: 1 (same as pilot)
ATOM_TURN_DECISION_ROUTING: 1
ATOM_TURN_INTERPRETATION:   1
ENABLE_SCHEDULER:           false
ENABLE_INGESTION_SYNC:      false
ENVIRONMENT:                development
ALLOW_DEV_TEMP_USERS:       true
interpreter:                /Users/rushiparikh/projects/atom/backend/venv314/bin/python
isolation:                  fresh port 8097; scratch SQLite / LanceDB
                            (LANCEDB_URI + LANCEDB_URI_BASE) / BYOK stores
                            only; live dev DB hash+mtime guarded; pilot
                            :8001/:3000 untouched
observation harness:        external, behavior-preserving hooks (same as
                            attempts 1/2)
```

## The job (the SAME asks as attempts 1/2, unchanged)

1. Fresh user through the product.
2. Upload the exact approved-records fixture through
   `POST /api/documents/upload` (`approved_records_q2026_114.txt`).
3. Create the draft through the product in the exact original S7 state
   (`Terms: Net 45`, `Valid until: 2026-12-31`).
4. **S3 first** — the original comparison ask, unchanged.
5. **Then the original S7 continuation**, unchanged.

## Predeclared stage record (separate labels)

For each turn the attempt reports:

- `dispatch_attempted` — a `[structured-dispatch]` line with
  `route=turn_interpretation:<request_id>` in the served log.
- `completed_within_deadline` — the interpretation record's `origin`
  starts with `llm:` (the caller received it inside the 12-second
  `asyncio.wait_for` deadline).
- `producer_output_valid` — the interpretation record is resolved
  (`origin` starts `llm:`, `unresolved_reason` empty).
- `source_identity_resolved` — for S7: the composition marker state is
  `resolved` with `resolved_file=approved_records_q2026_114.txt`, and the
  requirement identity is `resolved` with the catalog `file_id`.

## Predeclared acceptance rule

Attempt 3 passes only if all hold:

- both turns `dispatch_attempted` and `completed_within_deadline` and
  `producer_output_valid`;
- S7 `source_identity_resolved` (identity + composition resolved to the
  fixture file);
- S7 settlement validated: `success=true`, `outcome=completed` with the
  matched source and date field, or `outcome=partial` with the matched
  source, the date field and the specific gap named in `open_work`;
- S3 truthful comparison (valid-until `2026-12-31` match; Net 45 vs
  Net 30 difference flagged or explicitly not compared; no false claim)
  and zero canvas writes / unchanged draft;
- S7 truthful content (`2026-12-31`, still matches; no change claim),
  zero new canvas writes, draft unchanged, explicit
  response/persisted-row/fresh-history agreement;
- `live_db_unchanged` and `pilot_untouched`.

The wrong-date failure from attempt 2 is a separate correctness gate:
if S3 emits a wrong approved date again, the truthful-content gate fails
and the attempt is preserved — no date regex and no retrieval-success
certification.

## Failure discipline

One attempt. Every attempt is preserved. On the first failed gate the
attempt is reported with the actual records; there is no mid-run repair,
retry, model campaign, or tokenizer expansion. Promotion is only the
demonstrated candidate/configuration-bound claim.

## Files

- `PREDECLARED_CONFIG_ATTEMPT3.md` — this declaration.
- `run_l2_served_attempt3.py` — the attempt-3 wrapper (reuses the
  attempt-1 runner and adds the stage record).
- `attempt3_config.json`, `attempt3_result.json`,
  `attempt3_observation.jsonl`, `attempt3_server.log`,
  `attempt3_interpreter_freeze.txt` — the attempt record.
- `summary_attempt3.json`, `CHECKSUMS_ATTEMPT3.sha256` — machine record.
