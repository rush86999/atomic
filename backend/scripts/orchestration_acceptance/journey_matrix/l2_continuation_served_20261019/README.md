# L2 continuation evidence — served acceptance attempt 1 (2026-10-19) — NOT PASSED

**What this is.** The served-API acceptance attempt of the L2
continuation-reference repair on candidate
**`a6cd2c8baecc2976d3c8021861f804117d1aa036`** (branch
`codex/l2-continuation-evidence`; parent `ddab120c4`, the L3 promotion
commit — untouched), in the predeclared isolated configuration
(`PREDECLARED_CONFIG.md`, written before the attempt; sha256 recorded in
`attempt1_config.json`). One attempt; no mid-run repairs.

**Result: NOT PASSED at the first failed gate `s7_requirement_captured`.**
The S7 reply was correct, zero-write, and partially settled
(`success=true`, `outcome=partial`), but the requirement's source identity
did **not** resolve: the real interpreter proposed annotated source
descriptions, and the owner-approved composer contract preserved them as
`unresolved` rather than donating a substring. L2 is **not promoted**; the
pilot and L1/L3 are untouched.

## Scope of the claim

This attempt can only speak to the tested continuation-reference
mechanism on this exact candidate + configuration. It does **not** certify
general natural-language reference resolution, restart durability, or
pilot deployment. Because the attempt did not pass its predeclared gates,
**nothing is promoted** from it.

## Frozen configuration (declared before the attempt)

```text
candidate:                  a6cd2c8baecc2976d3c8021861f804117d1aa036
                            (branch codex/l2-continuation-evidence;
                            parent ddab120c4; worktree tree clean)
OPENCODE_BASE_URL:          https://opencode.ai/zen/go/v1
provider set:               opencode-go (one authorized operator vault
                            credential registered through the scratch
                            product API; value never logged)
embeddings:                 fastembed / BAAI/bge-small-en-v1.5 / 384
flags:                      CHAT_FINALIZATION_M1=1, M2=1,
                            ATOM_TASK_LIFECYCLE_ENABLED=1,
                            ATOM_TURN_DECISION_ROUTING=1,
                            ATOM_TURN_INTERPRETATION=1
interpreter:                /Users/rushiparikh/projects/atom/backend/venv314/bin/python
isolation:                  fresh port 8095; scratch SQLite / LanceDB
                            (LANCEDB_URI + LANCEDB_URI_BASE) / BYOK stores;
                            no .env/vault wholesale copy; live dev DB
                            hash+mtime guarded; pilot :8001/:3000 untouched
observation harness:        external, behavior-preserving hooks around
                            interpret_turn_request,
                            apply_interpretation_references,
                            _stash_evidence_requirement,
                            _context_backed_fulfillment,
                            _fallback_turn_outcome
```

Runtime identity from the served process: cwd = the candidate worktree
backend, `git_commit=a6cd2c8baecc`, `dirty=false`.

## The job — observed

1. **Fresh product user** registered; workspace
   `7b26a0d6-e950-4aad-8aad-4ae6e3fa2cfb`.
2. **Fixture uploaded through the product** —
   `POST /api/documents/upload` HTTP 200, doc
   `doc_3abaf0d03badbc965b0f2770`, `chunk_count=1`; the
   `ingested_documents` row carries `approved_records_q2026_114.txt`
   (279 bytes) with `2026-12-31` in its preview.
3. **Draft created through the product** — canvas
   `e50d4a4b-fa2c-4ad4-9b48-dd36726295dd`; the seeded body is byte-exact:
   `Terms: Net 45`, `Valid until: 2026-12-31` (the original S7 state).
4. **S3 first** — the original comparison ask, unchanged. Execution
   `33504f89-0866-4ffa-bf00-5f219ce3a3ae`; interpretation
   `llm:glm-5.3-flash`; reply model `llama3.1:8b` (local ollama
   auto-discovered; the declared cloud route served the interpretation,
   `7` Zen posts, `0` Go-inference posts). Settlement
   `success=true`, `outcome=partial` with the expected F-C2 basis:
   `context_fulfillment.state=partial`, `supplied_fields=[expiration_date]`,
   `matched=[approved_records_q2026_114.txt]`,
   `missing_comparison=true`, `open_work="the comparison itself was not
   recorded this turn — only its inputs were available"`.
   The requirement was captured (`required=true`, `sources=["document"]`,
   `artifact_attached=true`, execution-keyed). Zero canvas writes; draft
   unchanged.
5. **S7 continuation** — the original ask, unchanged. Execution
   `eed57d97-219b-4f32-afed-c6d9b1cb82ee`; interpretation
   `llm:glm-5.3-flash`; reply model `llama3.1:8b`. Settlement
   `success=true`, `outcome=partial`. Zero new canvas writes; draft
   unchanged; response/persisted-row/fresh-history agreement true.

## First broken transition — the S7 requirement identity did not resolve

The actual S7 interpretation proposed **two annotated source
descriptions**, not clean identities:

```text
sources: [
  "approved_records_q2026_114.txt (the user's uploaded Approved Records document)",
  "draft quotation (source not yet named by the user)"
]
```

The conversation's observed pool **did** contain the S3 source:
`approved_records_q2026_114.txt` (execution
`33504f89-0866-4ffa-bf00-5f219ce3a3ae`); the prompt enrichment did its
job. But the composer's owner-approved contract resolves an exact full
identity or boundary-token equality only; the annotated first proposal is
not an exact filename, and the second proposal has no antecedent. It
therefore preserved the honest unresolved state:

```text
continuation_evidence.state = "unresolved"
resolved_file = ""
names = [ both annotated proposals ]
```

The requirement was still captured and execution-bound
(`required=true`, `sources=["document"]`, `file=null`, `fields=["expiration_date"]`),
but its identity is unresolved:

```text
requirement.identity = {
  "state": "unresolved",
  "names": [ both annotated proposals ]
}
```

The F-C2 verdict follows the identity and is `unresolved`, so the
settlement is `partial` with:

```text
open_work = "no ingested document matches approved_records_q2026_114.txt
(the user's uploaded Approved Records document), draft quotation (source
not yet named by the user)"
```

The reply itself is correct and truthful:

> The current "Valid Until" date on the draft is 2026-12-31. This matches
> the "Approved valid until" date in the Approved Records document for
> Quotation Q-2026-114, which is also 2026-12-31. There is no discrepancy
> in this field.

**Why the gates fail.** The predeclared S7 target required a resolved
source identity (`identity.state="resolved"` with the catalog `file_id`)
and an accepted F-C2 basis (`completed` with the source/field, or
`partial` with that resolved source and a named gap). The run produced
neither: `s7_requirement_captured=false`,
`s7_resolved_source_identity=false`, `s7_settlement_basis=false`.
The correct reply and the zero-write/unchanged-draft/agreement checks do
not substitute for the missing identity; accepting them would be the
silent certification the slice exists to prevent.

**Contrast — why S3 passed.** The S3 interpretation also proposed verbose
descriptions (`"my uploaded Approved Records document"`, `"the draft
quotation"`), but the deterministic floor already carried
`references.sources=["document"]`; the composer is floor-wins and left
the decision unchanged. S3's requirement identity is `kind_only`, and
F-C2 matched the observed document by kind + workspace, yielding the
validated partial. S7 had no floor capture (the original defect), so it
depended on the interpretation's proposal — and that proposal was
annotated rather than an identity.

## Checks (22 predeclared; 19 pass, 3 fail)

| Check | Result |
|---|---|
| `runtime_identity` | ✔ candidate cwd/commit, dirty=false |
| `fixture_uploaded_through_product` | ✔ HTTP 200 + row + date preview |
| `draft_created_through_product` | ✔ exact seeded body |
| `real_interpretation_dispatched` | ✔ `llm:glm-5.3-flash`; structured dispatch recorded |
| `prior_evidence_observed` | ✔ S3 source in S7's observed pool |
| `s3_reply_received` | ✔ |
| `s3_truthful_comparison` | ✔ match + Net 45/Net 30 difference |
| `s3_zero_canvas_writes` | ✔ audit 2 → 2 |
| `s3_draft_unchanged` | ✔ |
| `s3_settlement_basis` | ✔ partial, resolved kind-only source, missing comparison named |
| `s3_requirement_captured` | ✔ required, document, artifact, execution-bound |
| `s7_reply_received` | ✔ |
| `s7_truthful_comparison` | ✔ correct date/match, no change claim |
| `s7_zero_new_writes` | ✔ audit 2 → 2 |
| `s7_draft_unchanged` | ✔ |
| **`s7_requirement_captured`** | **✗ FAIL — identity unresolved (annotated proposals)** |
| **`s7_resolved_source_identity`** | **✗ FAIL — composer preserved unresolved** |
| **`s7_settlement_basis`** | **✗ FAIL — F-C2 unresolved, not completed/partial-resolved** |
| `response_persisted_fresh_history_agreement` (S3) | ✔ explicit non-null agreement |
| `s7_response_persisted_fresh_history_agreement` | ✔ explicit non-null agreement |
| `live_db_unchanged` | ✔ sha256+mtime unchanged |
| `pilot_untouched` | ✔ same pid/instance/started_at; :8001/:3000 listening |

## What this attempt does not claim

- It does **not** promote L2. The continuation ask's requirement is still
  not certified with a resolved source identity in the served product.
- It does **not** reopen L1 or L3; their candidates, evidence and
  configurations are untouched.
- It does **not** touch the pilot (`:8001` serving `8c593e57031e`); the
  pilot identity is byte-identical before and after.
- It does **not** authorize a tokenizer expansion. The finding is at the
  semantic layer: the interpreter's source proposals need to be clean
  identities (exact filename or canonical kind), not annotated
  descriptions. That is a prompt/output-contract question, not a reason to
  relax the composer's no-substring-donation contract.

## Files

- `PREDECLARED_CONFIG.md` — the declaration (written before the attempt).
- `run_l2_served.py` — the attempt runner.
- `server_observe.py` — the behavior-preserving observation launcher.
- `attempt1_config.json`, `attempt1_result.json`, `attempt1_server.log`,
  `attempt1_observation.jsonl`, `attempt1_interpreter_freeze.txt` — the
  preserved attempt.
- `summary.json` — machine-readable identity/checks/outcome.
- `CHECKSUMS.sha256` — all files.

**Next bounded question (owner review required):** make the interpreter's
`sources` proposals an exact identity (the prior source's filename or a
canonical kind) rather than an annotated description, then re-run this
same predeclared served job. No composer substring relaxation, no new
tokenizer rules, no promotion from this attempt.
