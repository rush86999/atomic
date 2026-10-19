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

## Verification records

Commands from the candidate worktree's `backend/` (`TESTING=1` + scratch
`DATABASE_URL`; the parent runs from a pristine `ddab120c4` worktree with
the same test file copied in):

- Successor L2 battery → **28 passed** (`logs/l2_successor.log`).
- Parent L2 battery → **26 failed, 2 passed** — the 20 composer
  capability tests (functions absent) and the 8 chain regressions
  (capture, ambiguity, wrong-name, identifier, unmatched-proposal,
  missing-kind, dedupe-identity, single-letter) failing for the intended
  reasons; the two fail-closed controls pass (`logs/l2_parent.log`).
- Neighbors (turn-decision, F-C2, action-program, source-ask batteries,
  interpretation/continuation sets) → **277 passed, 2 failed** — the two
  pre-existing `TestEditPlanRungKnob` failures, identical on the
  pristine parent (`logs/neighbors.log`).

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

Independent review of this corrected successor; **no served run is
warranted yet** (owner direction). After review, the sole acceptance
owner runs the ORIGINAL S7 continuation ask on a served build of the
frozen successor under a predeclared configuration (uploaded
approved-records fixture + draft canvas + the S3 comparison turn first,
then S7) and reads the authoritative record: requirement captured
(`required: true` with the resolved source), settlement validated
(`success=true`, outcome completed/partial with the F-C2 basis),
fresh-history agreement, and zero new writes (`s7-zero-new-work`
preserved). No mid-run repairs; every attempt preserved; promotion only
on that served pass.
