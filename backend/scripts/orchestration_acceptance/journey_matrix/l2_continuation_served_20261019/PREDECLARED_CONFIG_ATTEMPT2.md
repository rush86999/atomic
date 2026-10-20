# L2 continuation evidence — served acceptance ATTEMPT 2 (2026-10-19)

**Declared BEFORE the attempt. One attempt. No mid-run repairs.** This is
the repeat of the same S3→S7 served job after the bounded producer
correction; attempt 1 (candidate `a6cd2c8ba`, NOT PASSED) is preserved
unchanged in the same directory.

## Candidate (frozen, producer-corrected)

- Branch `codex/l2-continuation-evidence`, commit
  `51628b925deb64c4e8226be8546ef475b74b8e87` (parent `a6cd2c8ba`, the
  approved continuation-reference successor; worktree tree clean at
  declaration).
- Source hashes at declaration:
  - `backend/core/turn_decision.py`
    `05751e005140be93fa35b18029d0ed366b78fe38c1719315ed582f63f91747b3`
  - `backend/integrations/chat_orchestrator.py`
    `4e860e7950cf13149772c95c391428a44db46931034c16d75af53dccb30e2287`
    (unchanged from attempt 1: the composer/consumer is untouched)
- Producer correction in this candidate (see the candidate evidence
  README): `sources` keeps `List[str]` with an explicit field description;
  the prompt emits a structured `SOURCE REFERENCES` JSON block separating
  observed evidence, requested sources and the attached artifact; the
  supported source kinds are emitted from `SOURCE_KINDS`; named sources
  copy their complete filename/name exactly, generic kind asks prefer the
  kind shown on the matching observed entry, several observed matches
  preserve the wording, the attached draft/canvas is never an external
  source; no parenthesis stripping / substring salvage / ambiguity or
  unresolved relaxation; malformed output fails closed.
- Scope of the claim: **the tested continuation-reference mechanism with
  the corrected producer contract on this exact candidate +
  configuration**. NOT general natural-language reference resolution,
  NOT restart durability, NOT pilot deployment.

## Configuration (identical to attempt 1)

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
ATOM_TURN_DECISION_ROUTING: 1  (the production decision seam)
ATOM_TURN_INTERPRETATION:   1  (the production interpretation seam)
ENABLE_SCHEDULER:           false
ENABLE_INGESTION_SYNC:      false
ENVIRONMENT:                development
ALLOW_DEV_TEMP_USERS:       true
interpreter:                /Users/rushiparikh/projects/atom/backend/venv314/bin/python
isolation:                  fresh port 8096; scratch SQLite / LanceDB
                            (LANCEDB_URI + LANCEDB_URI_BASE) / BYOK stores
                            only; no .env/vault wholesale copy; live dev DB
                            hash+mtime guarded; pilot :8001/:3000 untouched;
                            L1/L3 worktrees and evidence untouched
observation harness:        external, behavior-preserving hooks around
                            interpret_turn_request,
                            apply_interpretation_references,
                            _stash_evidence_requirement,
                            _context_backed_fulfillment,
                            _fallback_turn_outcome
```

## The job (the SAME asks as attempt 1, unchanged)

1. Fresh user through the product.
2. Upload the exact approved-records fixture through
   `POST /api/documents/upload` (file `approved_records_q2026_114.txt`).
3. Create the draft through the product in the exact original S7 state
   (`Terms: Net 45`, `Valid until: 2026-12-31`).
4. **S3 first** — the original comparison ask, unchanged.
5. **Then the original S7 continuation**, unchanged:

   ```text
   What is the current Valid until date on the draft, and does it still
   match the approved record?
   ```

## Predeclared acceptance rule (attempt 2)

The producer correction is expected to make the S7 interpretation name the
observed source identity. The gates are the same as attempt 1, with the
reporting distinction explicit:

- S7 requirement **captured**: `required=true`, `sources` includes
  `document`, execution-keyed to the S7 response execution id.
- S7 source identity **resolved**: composition marker
  `state="resolved"`, `resolved_file=approved_records_q2026_114.txt`, and
  requirement `identity.state="resolved"` with the catalog `file_id`.
- S7 settlement **validated**: `success=true`; `outcome=completed` with
  `context_fulfillment.state=completed`, the matched source and the
  requested date field in `supplied_fields`; or `outcome=partial` with
  `context_fulfillment.state=partial`, the matched source, the date field
  supplied, and the specific gap (`missing_comparison` and/or
  `missing_fields`) named in `open_work`. Unconfirmed/failed/error is not
  accepted.
- The reply is truthful (`2026-12-31` still matches; no change claim),
  zero new canvas writes, draft unchanged, explicit
  response/persisted-row/fresh-history agreement, live dev DB unchanged,
  pilot untouched.
- If the identity remains unresolved (the attempt-1 failure), attempt 2
  is preserved and reported NOT PASSED; no promotion.

## Failure discipline

One attempt. Every attempt is preserved. On the first failed gate the
attempt is reported with the actual records; there is no mid-run repair,
retry, model campaign, or tokenizer expansion. Promotion is only the
demonstrated candidate/configuration-bound claim.

## Files

- `PREDECLARED_CONFIG_ATTEMPT2.md` — this declaration (written before the
  attempt).
- `run_l2_served_attempt2.py` — the attempt-2 wrapper (overrides the
  attempt-1 runner's candidate/port/scratch/deliverable names only).
- `attempt2_config.json`, `attempt2_result.json`,
  `attempt2_observation.jsonl`, `attempt2_server.log`,
  `attempt2_interpreter_freeze.txt` — the attempt record.
- `summary_attempt2.json`, `CHECKSUMS_ATTEMPT2.sha256` — machine record.
