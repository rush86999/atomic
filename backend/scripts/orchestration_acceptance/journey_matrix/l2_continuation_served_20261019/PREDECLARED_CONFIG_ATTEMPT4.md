# L2 continuation evidence — served acceptance ATTEMPT 4 (2026-10-19)

**Declared BEFORE the attempt. One attempt. No mid-run repairs.** The
diagnostic-selected, narration-guarded successor. Attempts 1–3 are
preserved unchanged in this directory.

## Candidate (frozen)

- Branch `codex/l2-continuation-evidence`, commit
  `491afa936e90f493061c929e06bb9e248deb9b79` (parent `ef4b8ccf6`; tree
  clean at declaration).
- Interpretation: measured route `opencode-go/qwen3.8-flash` via the
  existing `pinned_structured_call` (pin preference + unpinned fallback
  excluding the failed pin), bounded **65s** deadline, 5,500-token
  ceiling, `disable_reasoning=True`, `allow_moa=False`,
  `turn_interpretation:<request_id>` trace.
- Narration: typed-field verified-comparison guard — deterministic
  values replace a contradictory/unsupported reply, are appended when
  the reply is consistent, and state a specific limitation when the
  value is missing. Comparison is stored on the existing
  `_objective_evidence_{execution_id}` carrier; `deterministic_delivery`
  only for a complete replaced comparison.
- Local verification: focused **73 passed**; neighbors **556 passed + 2
  pre-existing `TestEditPlanRungKnob`** (canvas-editor 14 failures are
  byte-identical on the frozen 10982e839 worktree).

## Configuration (same as attempts 1–3, fresh port/world)

`OPENCODE_BASE_URL=https://opencode.ai/zen/go/v1`, opencode-go credential
registered through the scratch product API (value never logged),
fastembed local embeddings, pilot-matching finalization/lifecycle flags,
fresh port **8099**, scratch SQLite/LanceDB/BYOK stores only; live dev DB
guard; pilot `:8001`/`:3000` untouched. Observation harness same as prior
attempts.

## Job (unchanged)

Fresh user → approved-records fixture through `POST /api/documents/upload`
→ draft created through the product in the original S7 state → original
S3 comparison → original S7 continuation.

## Predeclared stages and acceptance rule

Stages: `dispatch_attempted`, `completed_within_deadline`,
`producer_output_valid`, `source_identity_resolved` (per turn where
applicable). Pass requires:

- both interpretation calls complete within the **65s** bounded
  interpretation deadline (the original 12s product deadline is recorded
  separately as not met; the selected change is the 65s experiment);
- S7 source identity resolved (`identity.state="resolved"` to
  `approved_records_q2026_114.txt`, composition marker resolved);
- S7 settlement validated (`success=true`; completed or partial with the
  F-C2 basis), zero new writes, draft unchanged, explicit
  response/persisted-row/fresh-history agreement;
- S3 **verified narration** for the typed field: the delivered reply
  contains the verified `2026-12-31` value and no wrong approved date
  (`2023-01-01`/`2026-12-30`); the terms difference is recorded but is
  not a typed-field gate (the verified comparison covers the requested
  `expiration_date` field);
- S3 zero writes and unchanged draft;
- total turn latency (settlement time per turn) recorded and required to
  be within the ordinary **95s** turn budget;
- `live_db_unchanged` true and `pilot_untouched` true.

The 65s interpretation deadline is an evaluated change: if the total
turn latency is not usable, the attempt fails/reports it and no
promotion is made.

## Failure discipline

One attempt. Every attempt is preserved. On the first failed gate the
attempt is reported with the actual records; no mid-run repair, retry,
model campaign, or tokenizer/composer relaxation. Promotion only on the
demonstrated candidate/configuration-bound claim.
