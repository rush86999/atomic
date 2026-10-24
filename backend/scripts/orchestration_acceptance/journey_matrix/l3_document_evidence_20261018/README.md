# L3 — requirement-driven tool eligibility for uploaded-document asks

**Finding under repair (F-R1, repeatability run `repeatability_20261017_224802`,
deployed pilot `8c593e57031e`):** the preserved sourced-answer request

```text
T3  "search my uploaded documents for the launch code for project Zephyr-9
     and tell me the code"
```

selected the **memory** lane in 2/3 repetitions (answer content correct; the
turn's saved status resolved failed/unconfirmed — memory carries no verified
source records) and **documents.search** in 1/3 (which validated).

- **Parent (immutable):** `aaa1169d7dc1a2e511bce9b81c33ee85f58982eb`
  (branch `codex/l3-document-evidence` is cut from it; the L1 successor
  `aaa1169d7` and its evidence are untouched by this slice).
- **Candidate:** `8f881fd6c67b8d6e3a3031a755f521ae6792c414`
  (`fix(l3): requirement-driven tool eligibility for document-evidence
  asks`) plus this evidence commit on `codex/l3-document-evidence`; see
  `CHECKSUMS.sha256` for artifact hashes.
- **Status when frozen:** locally verified on scratch stores (parent-failing /
  successor-passing, mutation-checked). **Served acceptance NOT run.** No
  promotion; the support statement's L3 limitation stands until a served run
  demonstrates otherwise. L1 and L2 are out of scope; no prompts, models,
  deadlines, billing, or no-op-checker behavior was changed.

## Diagnosis — the seven transitions, traced

1. **Accepted interpretation** — `build_turn_decision(message, …)` records
   `references.sources: ["documents"]` and a research action;
   `turn_evidence_required` ⇒ `True`.
2. **Execution-bound evidence requirement** — `_stash_evidence_requirement`
   (chat_orchestrator:5918 pre-repair) records
   `{"required": True, "sources": ["documents"], …}` in
   `session["_evidence_requirement_<eid>"]`, consumed by the outcome resolver
   (`_context_backed_fulfillment`). **The record itself was correct.**
3. **Initial tool proposal** — the cloud planner proposed `memory` in 2/3 live
   runs (`ToolPlan(use_tool=True, service="memory", …)`).
4. **Eligibility / source-ask floor** — **FIRST BROKEN TRANSITION.** The floor
   in `plan_tool_use` re-derived kinds from the message
   (`_td_sources(message)`) and asked `_source_service_candidates` which
   registered services could serve them. For an UNNAMED document ask the
   candidate list was `['documents', 'memory']` — the recollection lane was
   treated as able to serve a document-evidence obligation — so `memory`
   counted as `_already_served` and **no correction fired**. Captured inputs
   (parent, planner layer, `logs/parent_planner.log`): candidates
   `['documents', 'memory']`; proposal `memory` → returned `memory`.
   The accepted requirement was **ignored by tool eligibility** (it reached
   the outcome resolver but never the planner).
5. **Actual action / retrieval result** — the memory lane ran (context
   excerpts / mailbox scans), not a document-store read.
6. **Receipts / source identities** — the durable planner row for memory is
   `{"tool": "memory", "verified": None,
   "outcome": "executed_no_verifiable_evidence", "required": true,
   "evidence_refs": [{"kind": "search_scope", "service": "memory"}]}`
   (captured on the parent, `logs/parent_chain.log`) — no source records, so
   it cannot certify a completed search; the documents lane stamps
   `documents.<action>` rows with `match_count` + `coverage: complete`
   (zero matches included) which the outcome contract accepts.
7. **Public outcome + fresh durable outcome** — with no certifiable search the
   saved status resolved `objective_met: False` / failed while the reply text
   was correct (the live F-R1 shape).

**Root cause:** tool eligibility treated the service NAME list as the
capability list. Memory has no result contract that yields uploaded-document
source records (its registered conversation action returns message records),
yet it was a candidate for document/sheet evidence asks whenever no file was
named. The fix makes eligibility consume (a) the accepted requirement's kinds
and obligation, and (b) the lanes' actual result contracts.

## The repair (bounded, existing mechanism)

- `core/chat_tool_planner.py`
  - `plan_tool_use(..., evidence_requirement=None)`: the source-ask floor now
    consumes the ACCEPTED requirement when carried — its normalised source
    kinds and its obligation flag — instead of re-reading the message nouns.
    `None` keeps the message-derived read (no accepted decision present);
    a required obligation with no recorded kinds falls back to the message's
    own nouns; a requirement with no obligation does not conjure one.
  - `_source_service_candidates(..., source_evidence_required=True)`:
    for document/sheet kinds the recollection lane is NOT a candidate when
    the requirement demands source evidence — the registered document-reading
    actions (`documents.search` / `documents.grep`, dataset rows citing
    file+sheet+cell) are the ones whose contract carries identity, path, and
    scope. Memory remains a candidate for correspondence kinds (the ingested
    mailbox IS that store) and for asks with no evidence obligation.
    No global memory ban: the memory rung, provenance floor, and memory-only
    asks are unchanged.
- `integrations/chat_orchestrator.py`
  - `_build_evidence_requirement` extracted from
    `_stash_evidence_requirement` (same body, pure) — planner eligibility and
    the outcome resolver are built from ONE accepted decision.
  - The three `plan_tool_use` call sites carry it: the edit-lane prefetch task
    builds it from `_td_decision` (it starts before the stash records); the
    reply-leg plan and the recovery replan read the execution-keyed stash.
    The canvas editor's fallback planner keeps the message-derived read (it is
    not on the sourced-answer path) — noted as a boundary.

Nothing else changed: no prompts, models, deadlines, billing, no-op checker,
settlement predicates, or success-flag behavior. On the corrected route the
EXISTING settlement validates (`_receipts_carry_verified_complete_search`
accepts an executed complete search, zero matches included) — F-R1's 1/3
documents run already proved that path.

## Controls (each required control → where it is pinned)

Planner layer (`tests/test_l3_requirement_eligibility.py`, proposal is the
controlled external response):

| Required control | Test | Parent | Successor |
|---|---|---|---|
| Document requirement + memory proposal → eligible source-reading action | `TestEligibilityContract::test_memory_proposal_rejected_for_an_unnamed_document_ask`, `test_zephyr_ask_memory_proposal_rejected` | FAIL (memory) | PASS (documents) |
| Valid document proposal retained, no extra planning | `test_valid_document_proposal_retained_without_a_repair_call` | PASS | PASS |
| Identical message + different accepted requirement → eligibility changes | `TestAcceptedRequirementAuthority::test_identical_message_requirement_changes_eligibility` (document → documents; no obligation → memory; email → memory) | n/a (capability absent) | PASS |
| Obligation not spelled lexically | `test_requirement_obligation_without_message_nouns` | n/a | PASS |
| Legitimate memory request remains supported | `test_legitimate_memory_ask_remains_supported` | PASS | PASS |
| Correspondence keeps memory | `test_correspondence_ask_keeps_memory`, `test_required_comms_requirement_keeps_memory` | PASS | PASS |
| Missing/unsupported capability → no invented action, obligation preserved | `test_no_eligible_action_keeps_the_obligation_unresolved` | n/a | PASS |
| Sheet evidence obligation excludes recollection | `test_sheet_requirement_excludes_recollection` | n/a | PASS |
| One requirement authority for planner + stash | `test_planner_and_stash_share_one_requirement_authority` | n/a | PASS |

Full chain (`tests/test_source_ask_tool_execution.py::TestL3DocumentEvidence`
— real `process_chat_message`, scripted provider, scratch DB/LanceDB; the
planner proposal is pinned to the OBSERVED memory proposal; no receipt is
seeded):

| Required control | Test | Parent | Successor |
|---|---|---|---|
| Positive document case through planner→executor→settlement (real retrieval of a world-state document row; saved outcome validates) | `test_uploaded_document_answer_settles_successfully` | FAIL (memory lane) | PASS (documents.search match_count ≥ 1; `success` true; `objective_met` true) |
| Empty search → honest bounded result under the coverage contract | `test_memory_proposal_is_corrected_to_the_documents_lane` | FAIL (memory lane) | PASS (documents row: `coverage: complete`, `match_count: 0`, `empty_in_scope`; settled truth) |
| Wrong workspace → cannot complete | `test_document_in_another_workspace_cannot_complete_the_ask` | FAIL (memory lane) | PASS (zero hits, answer carries no code) |
| Response / persisted outcome / turn-record agreement | same tests incl. session-update payload capture | FAIL | PASS |
| Requirement actually reaches the planner during the turn | `test_turn_carries_the_accepted_requirement_into_the_planner` | FAIL (`evidence_requirement=None`) | PASS (`sources=['documents']`, `required=True`) |

Wrong document / subject / stale identity cannot complete: pinned by the
existing F-C2 battery `tests/test_context_backed_fulfillment.py` (green on the
successor; unchanged) — identity/scope/association rules were not touched.

## Verification records

Commands (from the candidate worktree's `backend/`, `TESTING=1` + scratch
`DATABASE_URL`; parent runs from a pristine `aaa1169d7` worktree with the same
test files copied in):

- Successor focused battery: `pytest tests/test_l3_requirement_eligibility.py
  tests/test_source_ask_tool_execution.py tests/test_source_ask_acceptance_cases.py`
  → **55 passed** (`logs/final_focused.log`).
- Successor planner-layer alone → **13 passed** (`logs/final_l3_planner.log`).
- Successor L3 chain alone → **4 passed** (`logs/l3chain_final.log`).
- Parent planner-layer (`-k TestEligibilityContract`) → **3 failed**
  (memory accepted; candidates include memory) (`logs/parent_planner.log`).
- Parent L3 chain → **4 failed**, including the captured memory row
  `verified: None / executed_no_verifiable_evidence` (`logs/parent_chain.log`).
- Neighbor batteries (successor): planner/VFS/outcome/F-C2/L1-pin sets →
  **461 passed, 3 failed, 1 skipped** (`logs/neighbor2.log`);
  `test_local_provider_dispatch_scope.py` + `test_chat_canvas_editor.py` →
  **128 passed, 14 failed** (`logs/neighbor3.log`). **Both failure sets are
  pre-existing: identical on the pristine parent** (`logs/parent3.log`,
  `logs/parent_neighbor3.log` — same test ids, same assertion lines), and
  untouched by this slice.

Mutation controls (throwaway edits, restored + checksum-verified after each):

- **A — requirement dropped** (`_req = None` in the floor): the two
  requirement-consumption tests fail; the rest stay green
  (`logs/mutation_a_requirement_dropped.log`).
- **B — memory candidate restored** for document kinds: the three eligibility
  regressions + the chain correction test fail
  (`logs/mutation_b_memory_candidate_restored.log`,
  `logs/mutation_b_chain.log`).
- **C — durable documents receipt marked unverified**: the two
  durable-evidence chain tests fail (the receipt assertions are load-bearing;
  the scope control is unaffected) (`logs/mutation_c_receipt_unverified.log`).

## Verification limits (state them with any claim)

- All evidence is **scratch**: in-memory SQLite + scratch LanceDB, a scripted
  OpenAI-compatible provider, `ATOM_CHAT_STREAMING=false` and the OPTIONAL
  vector leg disabled (`ATOM_HYBRID_VECTOR_LEG_ENABLED=false`) — no embedding
  provider exists in this shape; the REQUIRED lexical leg is the retrieval
  exercised. No served process, browser, or live world was touched; the pilot
  (`:8001`/`:3000`, `8c593e57031e`) is untouched.
- The positive case seeds the uploaded-document WORLD STATE with the same
  `IngestedDocument` row the product's `POST /api/documents/upload` route
  writes (content-hash id, preview, freshness) — the HTTP upload route itself
  is not driven here. Retrieval and every receipt are produced by the real
  planner/executor/settlement chain; nothing final is seeded.
- The planner's structured proposal is pinned to the observed F-R1 choice
  (that is the controlled external seam); interpretation, validation,
  dispatch, receipts, narration gating, and settlement all run for real.
- The grounding of "memory carries no verifiable source records" is the
  durable receipt shape recorded in `logs/parent_chain.log` and unchanged by
  this slice (not a model-quality claim).
- Pre-existing harness gaps inherited from the J2/L1 harnesses (session
  persistence stubbed; SQLite-only) apply.

## Exact next acceptance action

The sole acceptance owner runs the ORIGINAL supported request —

```text
"search my uploaded documents for the launch code for project Zephyr-9 and
 tell me the code"
```

— under the PRE-DECLARED configuration (served build = frozen candidate +
L1 successor ancestry; the declared Go endpoint/model pin; pilot-matching
flags; one authorized credential; scratch stores; one fresh user + one
uploaded fixture), against a SERVED process, and reads the authoritative
record: the turn must show `documents.*` executed with a verified complete
receipt, `objective_met=True` / success, and fresh history agreeing with the
response. No mid-run repairs; every attempt preserved. Only after that served
pass may the matrix/support statement move; the pilot remains `8c593e57031e`
until a separately frozen integration.
