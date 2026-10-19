# L2 continuation-evidence — served acceptance ATTEMPT 2 (2026-10-19) — NOT PASSED (interpretation timeout)

**What this is.** The repeat of the same S3→S7 served job on the
producer-corrected candidate
**`51628b925deb64c4e8226be8546ef475b74b8e87`** (branch
`codex/l2-continuation-evidence`; parent `a6cd2c8ba`, the approved
continuation-reference successor; worktree clean at launch) in the
predeclared configuration (`PREDECLARED_CONFIG_ATTEMPT2.md`, written
before the attempt; sha256 in `attempt2_config.json`). One attempt; no
mid-run repairs.

**Result: NOT PASSED at the first failed gate
`real_interpretation_dispatched`.** Both interpretation calls for the job
timed out at the product's 12-second bound, so the producer correction
was **never exercised**; the S7 evidence requirement was therefore not
captured (`required=false`), and the fallback reply lane answered from an
unverified basis (S3 reported the approved date as `2026-12-30`; S7
settled `unconfirmed`). No promotion; the producer correction remains
unverified by served evidence.

## Candidate (frozen, producer-corrected)

- Commit `51628b925deb64c4e8226be8546ef475b74b8e87`, parent `a6cd2c8ba`;
  `backend/core/turn_decision.py`
  `05751e005140be93fa35b18029d0ed366b78fe38c1719315ed582f63f91747b3`;
  `backend/integrations/chat_orchestrator.py`
  `4e860e7950cf13149772c95c391428a44db46931034c16d75af53dccb30e2287`
  (composer/consumer unchanged from attempt 1).
- Producer correction: `sources` keeps `List[str]` with an explicit field
  description; the prompt emits a structured `SOURCE REFERENCES` JSON
  block separating observed evidence, requested sources and the attached
  artifact; supported source kinds come from `SOURCE_KINDS`; named sources
  copy their complete filename/name exactly; generic kind asks prefer the
  kind shown on the matching observed entry; several observed matches
  preserve the wording; the attached draft/canvas is never an external
  source; no parenthesis stripping/substring salvage/ambiguity or
  unresolved relaxation; malformed output fails closed. Local verification:
  L2 battery 41 passed; neighbors 277 passed + 2 pre-existing
  `TestEditPlanRungKnob` (identical on parent).

## Configuration (identical to attempt 1 except the isolation port/world)

```text
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
isolation:                  fresh port 8096; scratch SQLite / LanceDB
                            (LANCEDB_URI + LANCEDB_URI_BASE) / BYOK stores;
                            live dev DB hash+mtime guarded; pilot
                            :8001/:3000 untouched
observation harness:        external, behavior-preserving hooks (same as
                            attempt 1)
```

Runtime identity from the served process: cwd = the candidate worktree
backend, `git_commit=51628b925deb`, `dirty=false`.

## The job — observed

1. Fresh user; fixture `approved_records_q2026_114.txt` uploaded through
   `POST /api/documents/upload`; draft created through the product in the
   original S7 state (`Terms: Net 45`, `Valid until: 2026-12-31`).
2. **S3:** the first interpretation call dispatched
   `opencode-go/glm-5.3-flash` and hit the 12-second bound
   (`[turn-interpretation] timeout`); origin `unresolved`. The floor
   still captured `document` (`required=true`). The reply stated the
   approved date as `2026-12-30` (wrong; the fixture says `2026-12-31`)
   and settled `partial`/`success=true`; zero canvas writes and draft
   unchanged. `s3_truthful_comparison` false.
3. **S7:** the second interpretation call dispatched
   `opencode-go/glm-5.3-flash` (and a `qwen3.8-flash` structured attempt)
   and also hit the 12-second bound; origin `unresolved`. Composition did
   not run (`sources=[]`), so the requirement was **not captured**
   (`required=false`, `sources=[]`, identity `kind_only`). The reply
   claimed the dates aligned and settled `unconfirmed`/`success=false`
   (`outcome_unconfirmed`); zero new writes and draft unchanged.

## First failed gate — `real_interpretation_dispatched`

The predeclared gate requires a real LLM interpretation origin and a
structured dispatch. The served log shows the dispatches were attempted
(`opencode-go/glm-5.3-flash`, `opencode-go/qwen3.8-flash`; 8 Zen posts,
0 Go-inference posts) but both calls exceeded
`ATOM_TURN_INTERPRET_TIMEOUT_S` (default 12 s; attempt 1's calls completed
at 9.6 s and 9.2 s). Because the interpretation was degraded, the
producer contract was never exercised: the S7 requirement stayed
uncaptured and the reply lane answered from an unverified basis. This
attempt therefore neither verifies nor refutes the producer correction.

## Disclosed guard result — live dev DB changed during the window

`live_db_unchanged` is false: the live dev DB sha256+mtime differ from
the pre-run values (mtime moved to 2026-10-19T13:30:27Z). The served
attempt used only scratch stores (`DATABASE_URL`, `ATOM_DATA_DIR`,
`LANCEDB_URI`, `LANCEDB_URI_BASE`, `BYOK_*` all under the attempt-2
scratch dir); the server log contains no live dev DB path. The live DB is
also served by the running pilot (`:8001`), so external pilot traffic is
the likely writer. The pilot identity is unchanged
(`8c593e57031e-dirty.4f091b0e6ee2.81067.1792291183`, same pid/started_at;
`:8001`/`:3000` listening). The gate failed regardless of origin, so this
attempt is not a clean isolated run; it is preserved as such.

## Checks (22 predeclared; 15 pass, 7 fail)

Failed: `real_interpretation_dispatched`, `s3_truthful_comparison`,
`s7_requirement_captured`, `s7_resolved_source_identity`,
`s7_settlement_basis`, `s7_truthful_comparison`, `live_db_unchanged`.

Passed (among others): `runtime_identity`, fixture upload, draft create,
`prior_evidence_observed`, replies received, zero writes and draft
unchanged for both turns, S3 requirement captured, S3 settlement basis,
both response/persisted-row/fresh-history agreements, `pilot_untouched`.

## What this attempt does not claim

- It does **not** promote L2 or certify the producer correction.
- It does **not** reopen L1/L3.
- It does **not** authorize a retry, a longer interpretation timeout, a
  model change, or any tokenizer/composer change. A further run is an
  owner decision.

## Files

- `PREDECLARED_CONFIG_ATTEMPT2.md` — the declaration (written before the
  attempt).
- `run_l2_served_attempt2.py` — the attempt-2 wrapper (reuses the
  attempt-1 runner unchanged, overriding candidate/port/scratch/names).
- `attempt2_config.json`, `attempt2_result.json`,
  `attempt2_observation.jsonl`, `attempt2_server.log`,
  `attempt2_interpreter_freeze.txt` — the preserved attempt.
- `summary_attempt2.json` — machine-readable identity/checks/result.
- `CHECKSUMS_ATTEMPT2.sha256` — all attempt-2 files.
- Attempt 1 (`attempt1_*`, `PREDECLARED_CONFIG.md`, `run_l2_served.py`,
  `CHECKSUMS.sha256`) remains byte-identical and checksum-valid.
