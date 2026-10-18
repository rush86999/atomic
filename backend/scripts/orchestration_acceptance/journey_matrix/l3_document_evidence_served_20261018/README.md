# L3 served acceptance on `6d662abff` (2026-10-18) — PASSED, attempt 1

**What this is.** The served-API acceptance of the L3 document-evidence
repair (F-R1) on candidate **`6d662abfffc2d9e42ab209cf68521e4933edcf27`**
(branch `codex/l3-document-evidence`; repair `8f881fd6c` + evidence
`6d662abff`; parent `aaa1169d7`, the L1 successor — untouched), in the
**predeclared isolated configuration** (`PREDECLARED_CONFIG.md`, written
before the attempt; `attempt1_config.json` is the machine record). This is
the evidence behind matrix **rev 12**, the amended L3 bullet in the support
statement, and the `journey_status.json` registry entry.

**Scope of the claim.** L3 is verified **through the served API on
`6d662abff` + the configuration below**. This is NOT pilot deployment: the
pilot (`:8001` serving `8c593e57031e`, frontend `:3000`) does not include
the fix and was never touched (verified listening before and after; live
dev DB hash+mtime unchanged). No funding or extra-usage activation was
performed.

## Frozen configuration (declared before the attempt)

```text
candidate:                  6d662abfffc2d9e42ab209cf68521e4933edcf27
OPENCODE_BASE_URL:          https://opencode.ai/zen/go/v1
                            (THE PILOT'S OWN CLOUD ROUTE — the F-R1
                            finding's planner class; not the Go inference
                            URL; no global endpoint change)
provider set:               opencode-go (one authorized operator vault
                            credential registered through the scratch
                            product API; value never logged or recorded)
EMBEDDING_PROVIDER/FASTEMBED_MODEL/EMBEDDING_DIM: fastembed /
                            BAAI/bge-small-en-v1.5 / 384 (pilot parity)
CHAT_FINALIZATION_M1/M2:    1 (same as pilot)
ATOM_TASK_LIFECYCLE_ENABLED: 1 (same as pilot)
interpreter:                /Users/rushiparikh/projects/atom/backend/venv314/bin/python
isolation:                  fresh port 8094; scratch DB/LanceDB/BYOK
                            stores only; no .env/vault wholesale copy;
                            live dev DB guarded; pilot untouched
```

Runtime identity from the served process: cwd = the candidate worktree
backend, `git_commit=6d662abfffc2`, `dirty=false`.

## The job — observed (attempt 1, one attempt, no mid-run repairs)

1. **Fresh user registered through the product** — `l3doc_*` product user
   (workspace `224d9826-83f6-4b7d-bfda-40d60d9cfb7d`).
2. **Fixture uploaded through the product** —
   `POST /api/documents/upload` → HTTP 200, doc
   `doc_ee4153d4a4ff67b28359e186`, `chunk_count=1`; the
   `ingested_documents` row carries `l3_zephyr9_fixture.txt` with the
   fixture preview (`QUARTZ-77` present).
3. **The ORIGINAL request, unchanged, with REAL planning** —
   `"search my uploaded documents for the launch code for project
   Zephyr-9 and tell me the code"`; HTTP 200 in **43.1 s**. Real planning
   on the pilot cloud route: the tool planner's first pass dispatched
   `opencode-go/glm-5.3-flash` (2 instructor attempts, 11.4k-char prompt)
   and proposed a lane that could not serve the document obligation; the
   floor's bounded corrective pass dispatched
   `opencode-go/deepseek-v4.1-flash` and returned
   `documents.search` (`tool planner: source-ask repair ->
   documents.search`); the executed plan was
   `documents.search:Zephyr-9 launch code` (`4` cloud chat posts on the
   declared route, `0` on the Go inference URL).

## Checks (all nine true — the predeclared gates)

| Check | Result |
|---|---|
| `upload_through_product` | ✔ HTTP 200 + row with fixture preview |
| `planner_dispatch_real` | ✔ `opencode-go/glm-5.3-flash`, `opencode-go/deepseek-v4.1-flash` |
| `documents_receipt_executed` | ✔ `documents.search`, `verified: true`, `status=ok match_count=1` |
| `receipt_verified_complete_coverage` | ✔ `coverage: "complete"`, `match_count: 1` |
| `receipt_bound_to_current_request` | ✔ ref query `"Zephyr-9 launch code"` |
| `objective_met_true` | ✔ persisted `task_outcome.objective_met: true` |
| `answer_contains_code` | ✔ answer carries `QUARTZ-77` from `l3_zephyr9_fixture.txt` |
| `successful_response` | ✔ `success: true`, `outcome: completed` |
| `history_nonnull_agreement` | ✔ fresh history reload `completed/true` == persisted assistant row |

Execution id `f6203e01-9959-4037-b877-ccc44e43bbd0`; settlement resolved
`completed` with no error code; the answer attributes the code to the
uploaded file (`[ingested] l3_zephyr9_fixture.txt: … QUARTZ-77`).

## Recorded discrepancy (disclosed, not smoothed)

The predeclared provider note said the reply would run on the same cloud
route; **actual**: the reply leg streamed from the **local
`ollama/llama3.1:8b` runtime** (12.1 s, 152 chunks; the product
auto-discovers the local runtime on this host; no credential involved) —
`response.model=llama3.1:8b`, `response.provider=ollama`. The PLANNING
(the F-R1 finding's class) was real and cloud on the pilot route, which is
what the repair and its gates concern; no predeclared gate depended on the
reply route. Both facts are recorded in `attempt1_result.json`
(`intended_vs_actual`) and here.

## Files

- `PREDECLARED_CONFIG.md` — the declaration (written before the attempt).
- `run_l3_served.py` — the attempt runner (adapted from the L1 harness).
- `attempt1_config.json`, `attempt1_result.json`, `attempt1_server.log`,
  `attempt1_interpreter_freeze.txt` — the attempt record.
- `summary.json` — machine-readable identity/checks/outcome.
- `CHECKSUMS.sha256` — all files.

**Next:** integration/deployment remains a separately authorized process
on a separately frozen candidate; the pilot's limitation text stands until
re-verification there (row 43's exclusions unchanged).
