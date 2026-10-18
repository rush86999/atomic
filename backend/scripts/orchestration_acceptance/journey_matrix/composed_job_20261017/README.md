# Composed user job (product spine) — evidence archive, 2026-10-17

**Scenario (predeclared):** `docs/acceptance/COMPOSED_JOB_PROTOCOL_2026-10-17.md`
(commit `63de9aa8e`, committed BEFORE any run) — "compare a draft with
approved source records and prepare an authorized revision": wizard setup →
approved-records doc upload → draft canvas → comparison (zero writes) →
authorized edit exactly-once + readback → calculation → **deliberate
interruption** (SIGKILL mid-turn) + restart + convergence → continuation
without repeats → reload readback.

**Configuration (hybrid, disclosed):** reply lane = product-registered local
ollama `llama3.1:8b` (wizard Card A); edit-plan structured call pinned to
`deepseek/deepseek-v4-pro` via the product-mounted credential (dev BYOK vault,
read-only). `ATOM_LOCAL_ONLY=false` (a pin run under local-only is blocked by
design). Fresh allowlisted scratch world per run (ports 18500/18501).

## Runs

| run | candidate | evidence | failing checks (of 38) |
|---|---|---|---|
| 1 | `e207494af4c7` | `evidence/browser_composed_job_20261017_185026_6a0dd2.json` | s3/s5/s7 reply received; s6 resend; no-failed-requests |
| 2 | `6e740fc39` (run 1 + the retrieval repair below) | `evidence/browser_composed_job_20261017_190745_72d700.json` | s3/s5/s7 reply received; s5 total; s6 resend; no-failed-requests |

Both runs executed the whole spine end-to-end; the failing checks are the
findings below, not harness stalls. `s4-canvas-updated-readback`,
`s4-exactly-one-audit-write`, `s6-audit-converged`,
`s6-terms-converged-exactly-once`, `s6-valid-until-intact`,
`s6-restart-healthy`, `final-reload-agrees` are **true in both runs**.

## Findings

### F-C1 (FIXED `6e740fc39`) — a small document's later fields never reached the model

Run 1: the 270-char approved-records upload's key line ("Approved valid until:
2026-12-31") starts at ~char 232. `content_preview` stores 500 chars, but the
lexical search cut ingested hits to 200, the fusion carried no body text for
lexical hits, and the knowledge leg capped excerpts at 220 — so the reply
honestly reported the record's own field ABSENT ("I couldn't find a matching
Valid Until date") while it sat six characters past the cut; settled
`success=false/outcome_unconfirmed`.

Repair (commit `6e740fc39`): lexical hits carry bounded body text
(`text`/`content`, mirroring the vector lane's Phase E `text[:4000]`); the
knowledge leg prefers `content` over the 200-char preview
(`KNOWLEDGE_PREVIEW_CHAR_CAP=500`). Regression:
`backend/tests/test_retrieval_body_text_visibility.py` (fails on pristine,
passes after; negative controls pin preview-only behavior unchanged).
Neighbor suites: failing sets byte-identical on pristine `e207494af`
(pre-existing, zero regressions).

Run 2 verification of the repair, in the browser: the comparison reply now
reads "Flag: the Valid Until date is the only discrepancy I can confirm — the
draft expires a month earlier than the approved terms allow (2026-11-30 vs.
approved 2026-12-31). Everything else line-for-line matches." and the
continuation reply "The draft's current Valid until date is 2026-12-31. Yes,
it still matches the approved record."

### F-C2 (REPAIRED `f0dc266c0` + follow-up `b4c7a310e`; run 3 verifies) — source-named read turns settled `outcome_unconfirmed` even when correct

Repair (owner assignment, two bounded gaps): named-source identity through
the existing catalog mechanism; association-grade fulfillment evidence
(source→subject→field→value→span) with per-observation completeness; the
comparison-result gate when an artifact is attached; one resolver decision
consumed by the durable builder; a registered contract verifier; unsupported
associations map to `partial` with the specific explanation (never
completion). 36 controls; on the true parent the positive fails for the
reason below. The demonstrated failure (runs 1/2) remains preserved:

Across both runs (6 turns), every source-named read ask (compare / calculate /
confirm) settled `success=false, error_code=outcome_unconfirmed`, delivered a
⚠️-flagged message (the canvas page renders non-success replies as system
warnings), and recorded `delivery.delivered=false` — while the delivered
content was, after F-C1's fix, CORRECT and drawn from this turn's VERIFIED
context retrieval of the named ingested source (`context_assembly` verified,
source = the uploaded file, keyed to the execution). No read tool
(`documents.search`) ran on these turns: the planner answered from the
assembled context.

The adjacent shapes already have owner-directed validation carve-outs
(presentation-only + canvas-read; verified-complete search receipt; delivered
result carrier). The uncovered shape is: **request names an ingested source,
the source was retrieved and verified THIS turn, the answer presents over it
and claims nothing beyond it** — settled unconfirmed. 6/6 occurrences; no
false success anywhere (the strictness never blessed a wrong answer — run 1's
answer was wrong and also unconfirmed; after the fix the correct answer is
still unconfirmed).

**Next slice:** bounded design at the shared settlement boundary (reuse the
context-source observations keyed by execution id; do not bless an answer just
because *some* context was retrieved — the retrieval must satisfy the named
source; narration agreement stays in the fabrication layer). Owner-visible
lane; not repaired in this archive.

### F-C3 (recorded decision for the next run) — the calculation leg's ask shape

The plain-arithmetic ask ("two units at $48,000 — total?") is not the
demonstrated calculation contract; run 1 answered `$96,000` correctly, run 2's
reply lane declined ("I can't confirm a two-unit total…"). The J5-demonstrated
supported shape is the structured ask (`calculate expression QTY * UNIT_PRICE
with QTY=7 UNIT_PRICE=25` → J5 r18). The next composed run uses that shape for
S5 (the plain ask remains preserved as the first attempt per the protocol's
one predeclared re-phrase allowance).

### Crash leg (green, both runs)

SIGKILL while the second authorized edit was in flight (run 1: killed 2.59 s
after durable acceptance — pre-write; run 2: 14.77 s — after the write, before
the response). Both times: restart healthy (same world/db), canvas in an
honest 0-or-1 state, and the re-sent instruction converged to **exactly one**
terms change; the earlier Valid-Until edit stayed exactly once and intact;
audit totals `+1` per authorized change, never duplicated. The post-restart
re-send reported the editor declined the (already applied) change honestly.

## Run 3 (planned) — candidate `dad8f9fce`, same protocol/config; predeclared expectations

Predeclared BEFORE the run. Candidate = `dad8f9fce` (run 2's `6e740fc39` +
the F-C1 excerpt repair lineage + the F-C2 context-backed-fulfillment repair
`f0dc266c0`, its reviewer follow-up `b4c7a310e`, and the narrowed
subject-filter BLOCK fix `dad8f9fce` + the subject-admission dependency
commit). Configuration unchanged from runs 1/2 (fresh allowlisted scratch
world, ports 18500/18501; wizard ollama reply lane + deepseek edit-plan pin
mounted through the product; `ATOM_LOCAL_ONLY=false`). F-C3 recorded change:
the S5 plain ask runs first; one predeclared re-phrase uses the J5 structured
shape only if the plain attempt fails to supply the total.

Expected settlements under the repaired resolver, stated in advance:

- **S3 (compare, canvas page → `artifact_attached=True`)** — the association
  evidence should be available, but with no recorded comparison carrier for
  the execution the turn is expected to settle **`partial` with "the
  comparison itself was not recorded this turn"** named (reviewer F9):
  success stays truthful (`success=true`, `outcome=partial`) and completion
  is NOT certified. The harness's `s3-reply-received` check passes on
  `success=true`.
- **S4 (authorized edit)** — unchanged: exactly-once + readback + audit +1.
- **S5 (calculation)** — the calc lane is expected to supply the total
  (possibly via the F-C3 re-phrase); the turn validates through the existing
  calculation evidence path, independent of the cf verdict.
- **S6 (crash/restart/convergence)** — unchanged invariants (exactly one
  terms change, valid-until intact, audit totals).
- **S7 (continuation, "…match the approved record?")** — **explicitly
  unsupported shape**: the current source-noun vocabulary does not capture
  "record" as a source noun, no evidence requirement is formed, and the
  turn is expected to settle `unconfirmed` (success=false) exactly as in run
  2. Deliberately NOT widened to green (owner rule: no regex broadening
  merely to turn the run green). Recorded as a known release exclusion: the
  continuation question's saved status remains non-certified until a future
  bounded vocabulary change with its own controls.

Pass criteria for this run, predeclared: all 38 harness checks **except**
`s7-reply-received` / the S7 contribution to `no-failed-requests`, which are
excluded as the documented unsupported shape. Failures elsewhere are
findings; the first failed transition is repaired before the deployment
step; no second campaign until then.

## Provenance

- Harness: `browser_composed_job.py` (this copy; sha256 recorded inside each
  run JSON). Run 1 recorded its harness sha; run 2's harness is byte-identical.
- Screenshots: `screenshots/` = run 2 (run 1's were overwritten by run 2; run 1
  facts live in its JSON).
- Credential scans: both run JSONs clean (no key-shaped strings; the deepseek
  pin key and all JWTs/Bearers are scrubbed).
- Worlds: fresh scratch per run (`atom_journey_composed_*` temp dirs; DB paths
  recorded in the JSONs). The phase-e world's 18300/18301 servers were stopped
  before the composed runs and are untouched by them.
