# L2 continuation acceptance — ATTEMPT 9 (2026-10-19)

**Status: NOT PROMOTED.** The S7 action-contract repair worked, and the
full chain finally reached a resolved source identity, requirement
capture, a truthful reply, zero writes, and fresh-history agreement. One
remaining acceptance check failed: S7 reports its task outcome as
`completed` while context-backed fulfillment reports `partial` with two
of three criteria unmet. The chain is preserved, not promoted.

## Candidate

- `a3875d6bb2026ffb4d1424f26a63b4e68c89cedf` on
  `codex/l2-continuation-evidence` (parent `556a7fb4b`; tree clean).
- Failure-event worktree: attempt 8's `23f3455f7` is preserved.
- Port **8104**, fresh scratch world; pilot `:8001`/`:3000` and the live
  DB were guarded before/after.

## What changed since attempt 8

- `actions` is required; every action `kind` is required and constrained
  to the authoritative six-kind vocabulary.
- The schema validator requires at least one action when the scope is
  resolved; explicit `unresolved` remains valid without an invented
  action.
- Rejections distinguish `no_actions_proposed`, `missing_action_kind`,
  and `invalid_action_kind`, even when archival capture is off.
- The prompt tells the producer that follow-up questions are read-only
  actions too and that a resolved scope requires an action; it never
  synthesizes one.
- Capture is content-free and archived (pre/post validation records in
  the served log).
- Schema/decode failures cannot bench a provider as quota exhaustion.

Pre-attempt evidence: focused **102 passed**; neighbors **584 passed + 2
pre-existing `TestEditPlanRungKnob`**; budget/fallback **88 passed + the
same 2 pre-existing BPC failures reproduced on the parent**. The bounded
S7 diagnostic on this candidate returned `continue`, 2 actions
(`research`, `presentation`), resolved identity, pre/post capture, in
28.2 s / 1 HTTP post, within the unchanged 65 s bound.

## Served result

| Stage | Outcome | Context | Latency | Scope | Actions |
|---|---|---|---|---|---|
| S3 | partial | partial | 65.38 s | continue | research, presentation |
| S7 | **completed** | **partial** | 33.33 s | continue | research, presentation |

S3 delivered the deterministic verified comparison alone: `2026-12-31`
matches, terms/price have no verified value, broader obligation open, no
global consistency claim, no writes. The predeclared typed-field gate
(`s3_verified_narration`, `s3_terms_limitation_named`,
`total_turn_latency_within_budget`) passed. The base runner's older
`s3_truthful_comparison` boolean was false because it required literal
`net 45`/`net 30` values; that boolean was replaced by the attempt-8
typed gate for this run (the same replacement used in attempt 8).

S7:

- interpretation: `llm:qwen3.8-flash`, `continue`, actions `research` and
  `presentation`, authorization `granted` for each (read-only policy);
- requirement: `required=true`, source `document`, resolved
  `approved_records_q2026_114.txt` (`file_id` present), field
  `expiration_date`, artifact attached, broader comparison true;
- reply: verified comparison, `2026-12-31` match, terms/price explicitly
  unverified, broader obligation open, no mutation language;
- zero new writes, draft unchanged, fresh-history agreement true;
- capture: **archived**, both `pre_validation` and `post_validation`,
  content-free.

## The failing check

`s7_settlement_basis` is false.

The turn settled as `outcome=completed, success=true`, but
`context_fulfillment.state=partial` with `missing_comparison=true`. The
persisted task outcome has three source-comparison criteria:

- `expiration_date` — met;
- `payment_terms` — **not met**;
- `price` — **not met**.

Evidence ledger: `covered=1, missing=2, total=3`. The reply truthfully
says those fields have no verified value and the broader comparison is
open. The settlement classification does not agree with that partial
evidence state, so the acceptance check cannot pass. This is a new,
specific contract mismatch (outcome classification vs context-backed
fulfillment), not a producer action failure and not an S3 narration
failure.

Post-processing correction: the base runner's pre-replacement
`first_failure` was `s3_untruthful_comparison`. After the predeclared
typed-field gate replaced that boolean, the result was recomputed from
the declared check order; the actual first failure is
`s7_settlement_not_validated`. Product checks and the served artifacts
are unchanged.

## Decision

- Attempt 9 preserved; no promotion, no matrix change, no L1/L3 or pilot
  change.
- The scoped L2 promotion remains as before.
- Next bounded repair: make S7 settlement/outcome classification agree
  with the partial context-backed fulfillment (or make the completion
  verdict require all requested comparison criteria), without weakening
  the truthful partial delivery or authorizing writes.
