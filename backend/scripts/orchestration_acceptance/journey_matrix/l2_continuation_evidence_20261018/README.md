# L2 — continuation evidence requirement (S7 finding) — frozen candidate

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
- **Candidate:** branch `codex/l2-continuation-evidence` — the repair
  commit + this evidence commit (see `CHECKSUMS.sha256`).
- **Status when frozen:** locally verified on scratch stores
  (parent-failing / successor-passing, mutation-checked). **Served
  acceptance NOT run; no promotion.** Integration/deployment remains
  separate; the L3 repair is not reopened.

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
carries none (`_requested_sources` → []), the continuation resolver
returns None for question-shaped turns (`if "?" in t: return None`), and
`task_state_view.active_objective` is null — so `provenance.signals: []`
and the decision carries a bare conversation action. The async
interpretation's `sources` (the semantic layer that names the reference)
were **never consumed anywhere** (grep: no reader), so no evidence
requirement was captured and the turn's own verified retrieval of
`approved_records_q2026_114.txt` could not certify. The S7 settlement
stayed non-certified despite correct content.

## The repair (interpretation chain, structured; no noun regex)

- `core/turn_decision.py`
  - `session_evidence_sources(session)`: the conversation's own verified
    evidence sources from the F-C2 execution-keyed carriers (accepted
    requirements' kinds/identities + retrieval observations' source
    families/file identities), bounded and deduped.
  - `apply_interpretation_references(decision, interpretation, session)`:
    composes the RESOLVED interpretation's proposed source references into
    the accepted decision's `references` — only when the floor found none,
    and only when the reference resolves against the conversation's own
    evidence (exact kind via the program vocabulary, or a name resolved by
    bounded token containment against the observed source identities).
    A provenance marker (`references.continuation_evidence`) records what
    was proposed and what resolved. Degraded interpretations and
    unresolvable references change nothing (fail-closed).
  - `_interpretation_prompt` enrichment: a
    `PRIOR EVIDENCE SOURCES (this conversation)` line so the interpreter
    can name the antecedent by the identity the conversation already
    verified.
- `integrations/chat_orchestrator.py`: right after the interpretation is
  obtained, `_td = apply_interpretation_references(_td,
  _td_interpretation, session)` — every downstream consumer (the F-C2
  requirement stash, `turn_evidence_required`, the planner, settlement)
  sees one composed decision. Nothing else changed: the F-C2 resolver,
  the outcome builder, and every success/error mapping are untouched.

## Controls

Decision layer (`tests/test_l2_continuation_evidence.py`,
successor-only capability tests — the composer does not exist on the
parent):

| Control | Result |
|---|---|
| Name reference resolves to the conversation source (`document` + file identity + `turn_evidence_required` True) | PASS |
| Kind-word reference resolves via the program vocabulary | PASS |
| Unresolved interpretation changes nothing | PASS |
| Unresolvable reference never invents an obligation | PASS |
| Floor-captured references always win | PASS |
| Session collector + prompt enrichment carry the prior sources | PASS |

Real turn chain (product entry point; interpretation, retrieval, planner
and reply endpoints are the controlled seams; decision, composition,
requirement stash, settlement and durable row run real):

| Control | Parent | Successor |
|---|---|---|
| Continuation ask captures the requirement (`required: true`, sources `["document"]`, resolved identity) and the turn's own retrieval certifies it (verdict `completed/partial/unsupplied`, settled `completed`, delivered) | **FAIL** (captured `required: False, sources: []` — the exact S7 shape) | **PASS** |
| Unresolved interpretation keeps the turn unobligated (`unconfirmed`) | PASS | PASS |
| Unresolvable reference does not obligate the turn | PASS | PASS |
| Message-named source ask keeps the floor's capture (not overridden) and certifies | PASS | PASS |

Mutation controls (throwaway edits; restored + checksum-verified):

- **A — composition disabled** in the orchestrator: the chain capture
  test fails (`logs/mutation_a_composition_disabled.log`).
- **B — fail-closed broken** (unresolvable references default to a
  kind): the two unresolvable-reference controls fail
  (`logs/mutation_b_failclosed_broken.log`).
- **C — floor override** (existing references no longer protected): the
  two floor-wins controls fail (`logs/mutation_c_floor_override.log`).

## Verification records

Commands from the candidate worktree's `backend/` (`TESTING=1` + scratch
`DATABASE_URL`; the parent runs from a pristine `ddab120c4` worktree with
the same test file copied in):

- Successor L2 battery → **11 passed** (`logs/l2_successor.log`).
- Parent L2 battery → **8 failed, 3 passed** — the 7 composer capability
  tests (function absent) and the chain capture test failing for the
  intended reason; the fail-closed/floor controls pass
  (`logs/l2_parent.log`).
- Focused neighbors (turn-decision, F-C2, action-program, source-ask
  batteries) → **143 passed** (`logs/neighbors_a.log`).
- Interpretation/continuation neighbors → **145 passed, 2 failed** —
  `TestEditPlanRungKnob` (pre-existing; the identical 2 failures
  reproduce on the pristine parent, `logs/neighbors_b_parent.log`).

## Verification limits

- All evidence is scratch (in-memory SQLite, scripted provider,
  controlled interpretation/retrieval/planner/reply seams). No served
  process, browser, or live world was touched; the pilot
  (`:8001`/`:3000`) is untouched.
- The run-4 S7 interpretation record was **not persisted** (no
  `interpret`/`sources` string in the world DB) — the slice captures the
  decision/requirement/observations/outcome and scripts the
  interpretation record as the controlled semantic seam; the prompt
  enrichment is what lets a real interpreter name the antecedent.
- The scratch harness has no task run, so the envelope's work-turn gate
  would discard the outcome before attachment; the chain tests therefore
  assert the settlement's single decision function
  (`_context_backed_fulfillment` + `_fallback_turn_outcome`) over the
  turn's OWN session state — the same predicate the served envelope
  consumes (run-4 S7: `work_turn` True via the conversation's active task
  run; the served acceptance re-establishes the envelope path).
- Interpretation availability is an external dependency (the diagnostic
  itself hit the recorded credit-dead-route class): a degraded
  interpretation keeps the old behavior (unconfirmed), never a false
  certification.

## Exact next acceptance action

Independent review of this candidate; then the sole acceptance owner runs
the ORIGINAL S7 continuation ask on a served build of the frozen
candidate under a predeclared configuration (same world shape: uploaded
approved-records fixture + draft canvas + the S3 comparison turn first,
then S7), and reads the authoritative record: the requirement captured
(`required: true` with the resolved source), the settlement validated
(`success=true`, outcome `completed`/`partial` with the F-C2 basis
recorded), fresh-history agreement, and zero new writes
(`s7-zero-new-work` preserved). No mid-run repairs; every attempt
preserved; promotion only on that served pass.
