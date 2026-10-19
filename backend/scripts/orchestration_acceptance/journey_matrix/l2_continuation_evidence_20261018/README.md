# L2 — continuation evidence requirement (S7 finding) — frozen successor

**Finding under repair (composed job run 4,
`journey_matrix/composed_job_20261017/evidence/browser_composed_job_20261017_221606_5fdbf5.json`):**
the S7 continuation ask

```text
"What is the current Valid until date on the draft, and does it still
 match the approved record?"
```

was answered correctly ("…2026-12-31, which still matches the approved
record…"; `s7-current-value-matches` and `s7-zero-new-work` pass) but
settled `success=false` / `outcome=unconfirmed` / `error_code=outcome_unconfirmed`
(`s7-reply-received` exclusion; execution `1948f252-2a6d-4ac4-9554-de90af17e96f`).

- **Parent (immutable):** `ddab120c43333efdc219098cba35fdecd9a0988f`
  (main HEAD after the L3 promotion; the L3 candidate branch and all
  earlier evidence are untouched).
- **Candidate:** branch `codex/l2-continuation-evidence` — first
  candidate `d36d6ed1f` (superseded), first correction `87a439c8c`
  (superseded), second correction `dae5d72c6` (superseded by the third
  owner review), then this **final corrected successor**
  (identity-constraint + dedupe-identity + `no_antecedent` corrections +
  this evidence record; see `CHECKSUMS.sha256`).
- **Status when frozen:** locally verified on scratch stores
  (parent-failing / successor-passing, boundary mutation-checked).
  **Served acceptance NOT run; no promotion.** Integration/deployment
  remains separate; the L3 repair is not reopened.

## Captured S7 chain (from the preserved run-4 world, read-only)

Accepted decision (chat row metadata `turn_decision`):

```text
requested_actions: [{"kind": "conversation", "authorization": "granted"}]
references: {"sources": [], "file": null}
provenance.signals: []
task_state_view.active_objective: null
```

Requirement (execution-keyed; `required` False — no obligation):
`completion_criteria: []`, `criterion_results: []`,
`source_constraints.comparison_sources: []`, `delivery.delivered: false`,
`objective_met: false`.

Observations: the turn DID retrieve the named source —
`tool_outcomes: [{"tool": "context_assembly", "verified": true,
"outcome": "retrieved 1 source(s) into context", "evidence_refs":
[{"kind": "context_source", "file_name": "approved_records_q2026_114.txt",
"source": "ingested"}]}]`.

Contrast — the S3 comparison turn (same subject, message-named source):
`references.sources: ["document"]` → requirement `required: true` → the
F-C2 verdict decided the turn (`partial`, `success=true`).

## First broken transition

**The accepted interpretation of the continuation ask.** The
deterministic floor reads the message's own nouns; "the approved record"
carries none, the continuation resolver refuses question-shaped turns,
and `task_state_view.active_objective` is null — so the decision carried
only a conversation action. The async interpretation's `sources` (the
semantic layer that names the reference) were **never consumed anywhere**,
so no evidence requirement was captured and the turn's own verified
retrieval could not certify.

## The repair (interpretation chain, structured; no noun regex)

- `core/turn_decision.py`
  - `session_observed_sources(session)`: the conversation's OBSERVED
    evidence — supplied retrieval observations only.
  - `session_requested_sources(session)`: requirement carriers —
    nominations, never evidence.
  - `apply_interpretation_references(decision, interpretation, session)`:
    composes the resolved interpretation's reference into the accepted
    decision under the corrected reference contract (below).
  - `_interpretation_prompt` enrichment: `PRIOR EVIDENCE SOURCES (this
    conversation)` — observed entries plain, nominations labeled
    `requested:`.
- `integrations/chat_orchestrator.py`: one composition call after the
  interpretation; the F-C2 requirement stash carries the composer's
  resolved/ambiguous/unresolved state into the requirement identity
  (a small structured addition at the requirement boundary only).
  The settlement resolver, outcome builder and success/error mappings
  are untouched.

## Owner-review correction (2026-10-18) — the reference contract

Four composition-boundary defects were reproduced against the first
candidate `d36d6ed1f` using its real composition functions:

| Input / state | `d36d6ed1f` (defect) | corrected successor |
|---|---|---|
| "the approved record" + Alpha and Beta approved-record files | silently selected Beta | **ambiguous** — both candidates preserved, no file adopted |
| "the approved record" + only `unapproved_records.txt` | resolved to the **unapproved** file (substring donation) | **unresolved** — the wrong file never adopted; honest non-match preserved |
| Interpreter proposes `document`, no prior evidence | adopted as a resolved continuation source | **unchanged** — a generic kind cannot nominate an antecedent |
| Prior requirement names a file (unresolved identity), no observation | treated the requirement as verified prior evidence | **unchanged** — requirements nominate; they are never evidence |

Corrected contract (implemented in `_reference_candidates` +
`apply_interpretation_references`):

* **Requested ≠ observed**: only retrieval observations establish prior
  evidence; requirement carriers are nominations.
* **No substring donation**: boundary-preserving token equality with
  plural tolerance only ("approved" never matches "unapproved";
  "record" matches "records").
* **Collect all eligible matches first**: zero → unresolved preserved
  (name proposals inside an observed evidence context; kind grounded in
  the observed families); one → the identity is adopted; several →
  **ambiguity preserved** (never insertion-order selection).
* **Generic kinds stay separate**: a kind proposal resolves to the
  observed sources of its family (one → adopt, several → ambiguity, none
  → no obligation).
* **No first-filename collapse**: candidates are unioned across
  proposals; several distinct candidates mean ambiguity.

The decision pattern:

```python
candidates = resolve_against_observed_conversation_sources(reference)
if len(candidates) == 1:
    adopt_resolved_identity(candidates[0])
elif len(candidates) > 1:
    preserve_ambiguity(candidates)
else:
    preserve_unresolved_reference(reference)
```

## Second owner-review correction (2026-10-18) — identity constraints + per-proposal aggregation

Three more composition-boundary defects were reproduced against
`87a439c8c` through its real composer:

| Proposed reference | Observed source | `87a439c8c` (defect) | corrected successor |
|---|---|---|---|
| `approved record 381` | `approved_records_6603.txt` | resolved to **6603** (short token dropped by the length filter) | **unresolved** — the identifier constrains |
| `approved record AB12` | `approved_records_AB12S.txt` | resolved to **AB12S** (`rstrip("s")` stemming) | **unresolved** — identifiers compare exactly |
| Alpha **and** Gamma records | only Alpha observed | resolved to **Alpha** (the unmatched proposal dropped) | **unresolved** — Gamma preserved |

Bounded corrections (only token identity and aggregation):

1. **Preserve every identity constraint.** `_reference_tokens` keeps every
   non-stopword token (short names and numeric/alphanumeric identifiers
   included). `_token_matches` compares identifier tokens (any token
   carrying a digit) EXACTLY; descriptive words compare through an
   explicit equivalence table only (`record`/`records`, plus a small
   documented set) — no stemming, no blanket plural stripping.
2. **Resolve each proposal before aggregating.** Per-proposal states
   (`resolved`/`ambiguous`/`unresolved`/`no_antecedent`); **unresolved
   wins** (a requested source that cannot be matched is never dropped
   because another proposal resolved); otherwise the distinct candidate
   files decide — one → adopt, several → clarify (the downstream contract
   carries one file; nothing collapses to a first filename), none → no
   adoption.

Positive twins (all pinned): `381` vs `approved_records_381.txt` →
resolved; `AB12` vs `approved_records_AB12.txt` → resolved; Alpha+Gamma
both observed → **ambiguous (clarify)**; the same source proposed twice →
resolved. The observed/requested split, ambiguity handling, floor-wins
behavior and the settlement chain are unchanged.

## Third owner-review correction (2026-10-18) — missing proposals, dedupe identity, single-letter identifiers

Three further composition-boundary defects were reproduced against
`dae5d72c6` through its real composer:

| Proposal / observed state | `dae5d72c6` (defect) | corrected successor |
|---|---|---|
| `document` **and** `email` proposed; only a document observed | resolved to the document, **dropping email** | **unresolved** — the missing email antecedent is preserved (names `["email"]`) |
| "the approved record"; `approved_records_AB-12.txt` **and** `approved_records_AB12.txt` observed | silently resolved to **AB12** (alnum dedupe merged the distinct identities) | **ambiguous** — both identities preserved |
| `approved record A`; only `approved_records_B.txt` observed | resolved to **B** ("A" dropped as a stopword) | **unresolved** — "A" constrains |

Bounded corrections (reference authority only):

1. **`no_antecedent` never disappears in aggregation.** A requested kind
   with no observed antecedent (e.g. `email` when only documents were
   observed) now blocks adoption exactly like an unmatched named source;
   the composition preserves the missing obligation (`names` carries the
   missing proposals, `no_antecedent` records the kind class).
2. **Dedupe by stable source identity.** The key is the kind plus the
   COMPLETE filename (case-folded, whitespace-trimmed, separators
   preserved) — never the alphanumeric-concatenated form, so
   `approved_records_AB-12.txt` and `approved_records_AB12.txt` stay
   distinct. An exact full-identity proposal resolves directly.
3. **A word acting as a source identifier is never dropped as a
   stopword.** Identifier-shaped tokens (a digit, or a single character
   such as "A") always constrain and compare exactly; when the
   grammatical role is uncertain the reference stays unresolved.

Positive twins (all pinned): document+email both observed → clarify;
only `AB-12` observed → resolved; the exact full name
`approved_records_AB-12.txt` → resolved; `approved record A` with
`approved_records_A.txt` observed → resolved. The unique-source S7 case,
the observed/requested split, ambiguity handling, floor-wins and the
settlement chain are unchanged.

## Controls

Decision layer (`tests/test_l2_continuation_evidence.py::TestL2ReferenceResolution`):

| Control | Result |
|---|---|
| Unique-source S7 positive (name → resolved identity, `turn_evidence_required` True) | PASS |
| **Short-identifier negative** (381 never matches 6603) + positive twin (381 → 381 resolved) | PASS |
| **Identifier-suffix negative** (AB12 never matches AB12S) + positive twin (AB12 → AB12 resolved) | PASS |
| **Unmatched-proposal negative** (Alpha+Gamma, only Alpha → unresolved with Gamma named) + twins (both observed → clarify; same source twice → resolved) | PASS |
| **Missing-kind negative** (document+email, only document → unresolved with email named) + twin (both observed → clarify) | PASS |
| **Dedupe-identity negative** (AB-12 + AB12 both observed → ambiguous, never merged) + twins (only AB-12 → resolved; exact full name → resolved) | PASS |
| **Single-letter identifier negative** (record A vs B → unresolved) + twin (record A vs A → resolved) | PASS |
| **Ambiguity negative** (two candidates → both preserved, no selection) | PASS |
| **Wrong-name negative** (no substring donation; unresolved, wrong file never adopted) | PASS |
| **Generic-kind negative** (no observed evidence → decision unchanged) | PASS |
| Kind + one observed source → adopts that identity | PASS |
| **Requirement-not-evidence negative** (nomination without observation → unchanged) | PASS |
| Unresolved interpretation / no observed context / floor-wins controls | PASS |
| Collectors split requested from observed; prompt labels both | PASS |
| Stash carries ambiguous/unresolved identities verbatim | PASS |

Real turn chain (`TestL2ContinuationChain`, product entry point;
interpretation, retrieval, planner and reply are the controlled seams;
decision, composition, requirement stash, settlement and the durable row
run real):

| Control | Parent | Successor |
|---|---|---|
| S7 positive: requirement captured (`required: true`, resolved identity) and the turn's own retrieval certifies it | **FAIL** (exact S7 shape `required: False, sources: []`) | **PASS** |
| **Ambiguity negative through the real turn**: two matching sources → requirement identity `ambiguous`, settlement `partial` (validated) with the "which source" clarification; no file adopted | **FAIL** | **PASS** |
| **Identifier-constraint negative/positive through the real turn**: 381 vs 6603 → identity `unresolved`; 381 vs 381 → identity `resolved` and certified | **FAIL** | **PASS** |
| **Unmatched-proposal negative through the real turn**: Alpha resolved + Gamma unmatched → identity `unresolved` with Gamma named; Alpha never adopted | **FAIL** | **PASS** |
| **Missing-kind negative through the real turn**: document resolved + email missing → identity `unresolved` with email named; the document never adopted | **FAIL** | **PASS** |
| **Dedupe-identity negative through the real turn**: AB-12 + AB12 → identity `ambiguous` with both; nothing chosen | **FAIL** | **PASS** |
| **Single-letter identifier negative through the real turn**: record A vs B → identity `unresolved`; B never adopted | **FAIL** | **PASS** |
| **Wrong-name negative through the real turn**: only an unapproved file observed → identity `unresolved`, settlement `partial` (validated) with the honest non-match; the wrong file never adopted | **FAIL** | **PASS** |
| Unresolved interpretation → unobligated (`unconfirmed`) | PASS | PASS |
| Message-named source ask keeps the floor's capture and certifies | PASS | PASS |

Mutation controls (throwaway edits; restored + checksum-verified):

- **A — composition disabled**: the chain capture test fails
  (`logs/mutation_a_composition_disabled.log`).
- **D — substring donation restored**: both wrong-name regressions
  (decision + chain) fail (`logs/mutation_d_substring_donation.log`).
- **E — first-match selection restored**: the ambiguity regressions
  (decision + chain) fail (`logs/mutation_e_first_match.log`).
- **F — requirements admitted to the observed pool**: the
  requirement-not-evidence regression fails
  (`logs/mutation_f_requirement_as_evidence.log`).
- **G — length filter restored** (short tokens dropped): the
  short-identifier regression fails
  (`logs/mutation_g_short_token_dropped.log`).
- **H — blanket plural stripping restored**: the identifier-suffix
  regression fails (`logs/mutation_h_identifier_stemmed.log`).
- **I — resolved proposals suppress the unmatched one**: both
  unmatched-proposal regressions (decision + chain) fail
  (`logs/mutation_i_unmatched_dropped.log`).
- **J — single-letter stopword dropped again**: both single-letter
  regressions (decision + chain) fail
  (`logs/mutation_j_letter_stopword.log`).
- **K — alnum-concat dedupe restored**: both punctuation-identity
  regressions (decision + chain) fail
  (`logs/mutation_k_alnum_dedupe.log`).
- **L — `no_antecedent` excluded from the missing set**: both
  missing-kind regressions (decision + chain) fail
  (`logs/mutation_l_no_antecedent_dropped.log`).

## Producer correction (2026-10-19) — served attempt 1 finding

The served S3→S7 acceptance on `a6cd2c8ba` (predeclared isolated
configuration; evidence archived on main at
`journey_matrix/l2_continuation_served_20261019/`) reached the strict
composer but failed the resolved-identity target: the requirement WAS
captured (`required=true`), yet the real interpreter proposed annotated
descriptions

```text
"approved_records_q2026_114.txt (the user's uploaded Approved Records document)"
"draft quotation (source not yet named by the user)"
```

and the composer preserved the identity `unresolved` (no substring
donation). The reply was correct, zero-write and partially settled; the
resolved source identity / F-C2 basis was not met. The failure is at the
producer contract, not the composer.

Bounded producer correction on this candidate (consumer untouched):

- `_Interpretation.sources` keeps `List[str]` and gains an explicit field
  description: external evidence requiring consultation; a named source
  copies its complete filename/name exactly (a prior observed source
  copies the observed filename exactly); an unnamed kind ask uses a
  supported canonical kind, preferring the kind shown on the matching
  observed entry; several observed matches preserve the wording and never
  choose one; no explanations/parentheses/uncertainty notes; never the
  attached draft/canvas.
- `_interpretation_prompt`: the prose `PRIOR EVIDENCE SOURCES` list is
  replaced by a structured `SOURCE REFERENCES` JSON block separating
  `observed_evidence`, `requested_sources` and `attached_artifact`; the
  supported source-kind vocabulary is emitted from `SOURCE_KINDS`; the
  attached canvas is explicitly the comparison input, never an external
  lookup. The old `ACTIVE DOCUMENT` prose line is folded into the
  structured attached artifact.
- Source normalization cap raised 160 → 512 so a complete observed
  filename can be copied exactly.
- No composer/consumer behavior change: no parenthesis stripping, no
  filename substring salvage, no ambiguity/unresolved relaxation, no
  completion inferred from the reply.

Composed-boundary controls (real `interpret_turn_request` normalization →
real composer → real requirement stash; only generation replaced): a
clean prior filename resolves; the exact attempt-1 annotated payload
stays captured-but-unresolved (including the settlement predicate); the
attached draft is not invented as an external lookup; an unknown external
source stays an open obligation; multiple plausible sources still
clarify; a generic kind ask uses the observed family; first-turn source
requests and deterministic-floor precedence remain supported; malformed
sources fail closed through pydantic; long observed filenames copy
exactly; canvas-only turns invent no external source.

## Execution-policy correction (2026-10-19) — attempt-2 completion diagnosis

The corrected attempt-2 assessment (archived with the served evidence)
established: `dispatch_attempted=true`,
`completed_within_deadline=false` — the interpreter dispatched and both
calls exceeded the 12-second deadline. Provider latency is involved, but
the application request settings also needed attention. Bounded
correction on this candidate (no shared handler defaults changed):

- Removed `model="fast"` (it does not select or pin a model; the explicit
  `task_type="planning"` is what routes the call).
- `disable_reasoning=True` — the handler translates it into the
  transport's reasoning-disable switch; a reasoning-mandatory provider
  keeps the existing bounded recovery (retry once without the switch,
  memoize the pair) and a failure stays unresolved, never a guessed
  interpretation.
- `max_tokens=_INTERPRET_OUTPUT_BUDGET_TOKENS` (5,500), derived from
  representative records: the attempt-1 S7 record ≈1,163 cl100k tokens;
  a multiple-source/long-filename record (8 sources incl. a 512-char
  filename, 8 subjects, 3 actions × 4 subjects, 8 fields, 8 constraints)
  ≈3,385 tokens → ~1.6x headroom.
- `route_trace_id=f"turn_interpretation:{request_id}"` (a log-correlation
  id, with a `session_id`/`-` fallback) for the structured
  dispatch/trace lines.
- `allow_moa=False` per call: the MoA gate can consider a long
  COMPLEX/ADVANCED prompt eligible; one small interpretation must not be
  multiplied into samples plus an aggregator.
- The 12-second deadline, BPC routing, authenticated scope and the
  source-resolution contract are unchanged.

Tests added: the real interpreter forwards the bounded settings and
trace; the real client constructs the intended request over a mock
transport (max_tokens + reasoning switch in the wire body, not just a
forwarded kwarg); reasoning-mandatory 400 → bounded retry without the
switch and success, or no result (never a false success); long
filenames/multiple sources still validate; timeout yields an unresolved
interpretation and adopts no source; a late synchronous worker cannot
mutate the returned decision; the output budget covers representative
records; the MoA eligibility/opt-out boundary.

## Diagnostic slice (2026-10-19) — measured explanation and selected change

A scratch-only diagnostic replayed the ACTUAL attempt-3 S3/S7 inputs
(message, session source context, recent history, canvas context) through
the real candidate code and scoped service with a **90-second diagnostic
window** (measurement only; the unchanged 12-second product deadline was
recorded separately). HTTP attempts were instrumented with one request id;
authorization headers were excluded.

**Measured result (diagnostic_interpretation_results.json on main):**

- **S3 / `glm-5.3-flash`:** 7 HTTP attempts; first `400` with the
  reasoning-disable switch (reasoning-mandatory endpoint), then six
  `200`s (504, 4140, 568, 780, 1782 output tokens), final `length` at the
  5500 ceiling; **never schema-valid within the 90s window**; worker
  total ~158s. This is a transport/capability rejection plus excessive
  generated content, not simple slowness.
- **S7 / `qwen3.8-flash`:** one `200`, `finish=stop`, 3188 output tokens,
  **schema-valid at ~58s**, source identity resolved. The reasoning
  switch was accepted; the valid record is just far beyond 12s.

**Selected execution change (one change, using existing controls):**

- Route the interpretation to the measured compatible model
  (`opencode-go/qwen3.8-flash`) through the existing
  `pinned_structured_call` wrapper: the pin is a preference, and the
  wrapper's existing unpinned fallback excludes the failed pin.
- Bounded interpretation deadline increase **12s → 65s** (the valid S7
  record was ~58s; 65s leaves margin and fits the ordinary 95s turn
  budget with ~30s left for the reply leg). This is an evaluated change,
  not a latency claim: the served attempt measures total turn latency.
- The 5,500-token ceiling is retained (the S3 model exceeded it; the
  selected route produced 3,188 tokens). The reasoning switch, MoA
  opt-out, trace id and source-resolution contract are unchanged.

**Narration defect disposition (separate correctness failure):**

The retrieved excerpt and draft carried `2026-12-31`; the reply claimed
`2023-01-01`/`2026-12-30` in the preserved attempts — a narration
fidelity failure, not retrieval. The existing typed-field comparison
machinery (`build_source_comparison` / `render_source_comparison`,
`observations_from_text`) is now adapted for the document/canvas case:

- `observations_from_key_value_text` reads the attached canvas's typed
  fields with the same canonical vocabulary; `observations_from_field_
  associations` reads the retrieved source's recorded associations.
- `verified_comparison_reply` builds the comparison, renders the exact
  values/source identity/version, and **replaces** a reply that does not
  carry every verified source value (or states a specific limitation when
  the value is missing); a consistent reply gets the deterministic block
  appended. The orchestrator applies it before delivery.
- Controls: equal, different, missing, two subjects with different
  values, reply replacement, and no-op without a typed-field requirement.
  No date-specific regex; no additional broad model call.

## Verification records

Commands from the candidate worktree's `backend/` (`TESTING=1` + scratch
`DATABASE_URL`; the parent runs from a pristine `ddab120c4` worktree with
the same test file copied in):

- Successor L2 battery (post producer correction) → **41 passed**
  (`logs/l2_producer_correction.log`; the prior 28-test battery is
  preserved in `logs/l2_successor.log`).
- Execution-policy successor (2026-10-19) → **52 passed** — the L2
  battery plus the transport controls (`logs/l2_execution_policy.log`).
  Neighbors including the reasoning-mandatory, task-type forwarding and
  structured-dispatch suites → **339 passed, 2 failed** — the two
  pre-existing `TestEditPlanRungKnob` failures, identical on the parent
  (`logs/neighbors_execution_policy.log`).
- Diagnostic/repair successor (2026-10-19, 10982e839 + this commit) →
  **71 passed** across the interpretation, L2, transport and
  verified-field-comparison suites (`logs/l2_diagnostic_repair.log`).
  Neighbors (turn-decision, interpretation, source-ask, continuation,
  F-C2, reasoning-mandatory, task-type forwarding, structured dispatch,
  workbook read/comparison) → **554 passed, 2 failed** — the same two
  pre-existing `TestEditPlanRungKnob` failures
  (`logs/neighbors_diagnostic_repair.log`). `test_chat_canvas_editor.py`
  has 14 pre-existing failures in this environment, byte-identical on
  the frozen 10982e839 worktree (not caused by this change).

  The narration guard is comparison-intent gated, requires a retrieved
  source observation, detects a contradictory value in the reply (not
  only a missing one), preserves display case, uses association subjects
  for multi-subject sources, stores the comparison on the existing
  `_objective_evidence_{execution_id}` carrier, and does not mark
  deterministic delivery for limitation-only output.
- Parent L2 battery (pre-correction 28-test set) → **26 failed, 2
  passed** — the 20 composer capability tests (functions absent) and the
  8 chain regressions (capture, ambiguity, wrong-name, identifier,
  unmatched-proposal, missing-kind, dedupe-identity, single-letter)
  failing for the intended reasons; the two fail-closed controls pass
  (`logs/l2_parent.log`). The producer-boundary additions are
  successor-only capability tests (the producer contract and the composer
  do not exist on the parent).
- Neighbors (turn-decision, F-C2, action-program, source-ask batteries,
  interpretation/continuation sets) → **277 passed, 2 failed** — the two
  pre-existing `TestEditPlanRungKnob` failures, identical on the
  pristine parent (`logs/neighbors_producer_correction.log`; the prior
  run is preserved in `logs/neighbors.log`).

## Verification limits

- All evidence is scratch (in-memory SQLite, scripted provider,
  controlled interpretation/retrieval/planner/reply seams). No served
  process, browser, or live world was touched; the pilot
  (`:8001`/`:3000`) is untouched.
- The run-4 S7 interpretation record was **not persisted** — the slice
  captures the decision/requirement/observations/outcome and scripts the
  interpretation record as the controlled semantic seam; the prompt
  enrichment is what lets a real interpreter name the antecedent.
- The scratch harness has no task run, so the envelope's work-turn gate
  would discard the outcome before attachment; the chain tests therefore
  assert the settlement's single decision function
  (`_context_backed_fulfillment` + `_fallback_turn_outcome`) over the
  turn's OWN session state — the same predicate the served envelope
  consumes. A served run re-establishes the envelope path.
- Interpretation availability is an external dependency: a degraded
  interpretation keeps the old behavior (unconfirmed), never a false
  certification.

## Exact next acceptance action

Frozen successor with the producer correction (this commit). Focused
review completed (producer contract approved; no composer change). The
sole acceptance owner then repeats the SAME predeclared S3→S7 served job
on this frozen candidate under the same isolated configuration as
attempt 1 (uploaded approved-records fixture + draft canvas + the S3
comparison turn first, then the original S7 continuation) and reads the
authoritative record: the requirement captured (`required=true`) **and**
the source identity resolved for S7 (`identity.state="resolved"` with the
catalog `file_id`), settlement validated (`success=true`, outcome
completed/partial with the F-C2 basis), fresh-history agreement, and zero
new writes (`s7-zero-new-work` preserved). No mid-run repairs; every
attempt preserved; promotion only on that served pass. L2 remains open
until then; L1/L3 and the pilot are untouched.
