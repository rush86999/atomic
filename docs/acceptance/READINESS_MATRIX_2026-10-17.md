# Readiness Matrix — 2026-10-17

**What this is.** One reconciliation of every accepted capability claim to its exact
candidate-bound evidence (Phase B deliverable, product-completion owner). Broad journeys
are split into assertion-level rows. **No success is promoted onto a newer candidate than
the one whose evidence is cited.** The machine-readable registry
(`backend/scripts/orchestration_acceptance/journey_matrix/journey_status.json`) was
reconciled to this snapshot on 2026-10-17 (J4/J5 r18 lineage and the J6 counted campaign
recorded; the Oct-12 scoreboard is superseded here for current status).

**Rev 2 (2026-10-17).** Reviewer corrections from `13783eef9` applied: registry records
now store the **tested candidate/configuration separately** from the recording checkout
(`tested_candidate`/`tested_config` vs `identity`); `J1.onboarding-completion` is
**registered** as a failing assertion — the setup gate now fails until it is verified;
evidence dimensions de-laddered (rows 25/28/31 relabeled `reload-readback`); r18 + R4
evidence archived in-repo with checksums.

**Rev 3 (2026-10-17, Phase C).** `J1.onboarding-completion` flips **failing → verified**
(reproduce-first, no repair required): on `cca1fb13d` one ordinary "Start Automating"
click persisted (`onboarding_completed=1`), the wizard closed, reload + sign-out/sign-in
did not reopen it, and a labeled injected-500 scenario stayed visibly failed with no
false completion and a green recovery. Evidence
`journey_matrix/browser_onboarding_completion_20261017_093641_af322b.json`
(sha256 `657943f3…`; harness sha256 `43c1dc43…`). Release gate is green (rc=0;
strict still rc=1 on untested carry items). See "Gate status" below.
**Independent replication (same day, second Phase C stream):** the same
candidate was re-run with a separately hardened harness (sha256 `406f1fdd…`,
tracked at `backend/scripts/orchestration_acceptance/browser_onboarding_completion.py`)
— `journey_matrix/phase_c_onboarding/evidence_browser_onboarding_completion_20261017_094558_3158b2.json`
(sha256 `6b4db92b…`; 14/14, `first_failed_transition=null`), adding
frontend-ownership verification, server-driven re-open legs (dismiss key
cleared; host status fetch recorded), on-origin sign-out, and a CORS-clean
injected 500 with sub-second toast polling. Same outcome, same candidate.

**Rev 4 (2026-10-17, Phase D).** `J1.quickstart-install` flips **untested → verified**
on `68729ebe4`: a genuinely new venv (Python 3.11.16) + new `node_modules` on this host
(no symlinked dependencies; package caches may be reused), the documented
`scripts/quickstart.sh` run **unchanged**, first failure preserved (F1: Python guard
accepts 3.14, `torch<3` has no 3.14 wheel; F2: `cryptography 49.0.0` has no Intel-mac
wheel and the sdist needs a Rust toolchain the host lacks), rc=0 after exactly two
documented manual-path interventions, plus one fresh-install dependency defect found,
fixed and re-verified (F3: `pyarrow 26.0.0` vs `numpy<2` → document upload 500;
`pyarrow 25.0.1`). Browser loop on the installed product reaches sign-in, wizard BYOK,
Settings→AI activation, document upload and reload persistence; the **answer leg is
blocked** by product defects **F5** (local-only: planning leg starves → `no_llm_provider`
sentinel) and **F6** (cloud: `minimax-m3` narration quarantined as reasoning-tag residue
→ "unusable output" placeholder; 3/3 API odds probe) and is **not promoted**.
`J1.signin` and `J1.onboarding-completion` are **re-bound** to the same run-3b evidence.
Claim qualification: a fresh venv on this existing host proves clean-environment
installation **on this host**, not on a clean machine or another OS. Archive:
`journey_matrix/phase_d_fresh_install/` (INSTALL_FINDINGS F1–F6, evidence, logs, probes,
CHECKSUMS). A second independent stream (`atom-phase-d`, ports 18200/18201) reproduced
F1/F2; two-stream reconciliation pending (Phase C Y-pattern).

**Rev 5 (2026-10-17, Phase E).** The unified-candidate cycle closed the
Phase D blockers and re-ran the loop on `e207494af4c7` (F4/F5/F6 repairs +
independent-review fixes + installer fixes + retrieval-scope repairs the loop
exposed). **Local world: 25/25 browser assertions** — wizard Card A stores the
canonical identity (`key_name="default"`, label separate), the provider
activates with **no Settings re-save**, the grounded answer uses the uploaded
source (QUARTZ-77), is attributed to ollama, durable and reload-persistent.
`J1.quickstart-install`, `J1.signin`, `J1.onboarding-completion` re-bound to
this run. **Installation:** with the supported interpreter (documented manual
venv) the unchanged quickstart reaches rc=0 with **zero interventions**;
the same script with the host default python3 3.14 refuses up front (F1 fix).
F1–F3 original failures stay preserved in the Phase D archive. **Cloud
supplementary:** wizard Card B activated `opencode-go` with NO env key (F4
cloud leg); the operator's Go key expired mid-campaign (verified 401), so the
cloud answer leg is **NOT promoted** and no further cloud runs were attempted.
F6 is verified by 23 controlled-response tests (no live quarantine
reproduction; no live MiniMax pick remained). Archive:
`journey_matrix/phase_e_candidate/` (README, evidence, logs, screenshots,
CHECKSUMS).

**Rev 6 (2026-10-17 late, cloud re-attempt).** With an operator-provided
replacement OpenCode Go key, the cloud supplementary loop was re-run on the
same frozen candidate (`e207494af4c7`): **run 7 completes 25/25 green** —
wizard Card B activation (canonical payload, provider active, no re-save),
upload durable, the grounded turn dispatched `documents.search`
(`match_count=1`), the reply uses the uploaded source (QUARTZ-77), is
attributed to `opencode-go`, durable in history and survives reload. **Run 6 is
preserved as a failure**: the same script in a fresh world settled
`success=false` because the planner selected the **memory** service for the
documents ask (no verifiable evidence) and delivered an honest non-retrieval —
no false success. The divergence is planner tool-selection variance on the
cloud lane (`glm-5.3-flash` chose `memory` in run 6, `documents.search` in run
7); it is recorded as a **follow-up** (source-constraint extraction / zero-match
fallback), not repaired here. The cloud answer leg is promoted on
`e207494af4c7` **with this variance disclosed**. Archive:
`journey_matrix/phase_e_candidate/` (run 6 + run 7 JSONs, run-7 screenshots,
updated CHECKSUMS).

**Rev 7 (2026-10-17 late, composed user job — first runs).** The predeclared
composed-job protocol (`docs/acceptance/COMPOSED_JOB_PROTOCOL_2026-10-17.md`,
committed `63de9aa8e` BEFORE any run) executed the spine end-to-end twice —
run 1 on `e207494af4c7`, run 2 on `6e740fc39` (= run 1 + the F-C1 retrieval
repair). Green in both runs: wizard setup, approved-records upload, draft
canvas, **authorized edit exactly-once + readback**, the **deliberate SIGKILL
interruption** mid-second-edit, restart, convergence to exactly one change
(no duplicates; earlier edit intact), continuation, and reload readback.
Run 1 exposed **F-C1** — a small document's later fields never reached the
model (200/220-char cuts vs the key line at char 232 → an honest wrong
negative, "couldn't find the Valid Until date"); repaired in `6e740fc39`
(lexical hits carry bounded body text; the knowledge leg prefers it;
regression `tests/test_retrieval_body_text_visibility.py`), and run 2's
answers use the record correctly (mismatch identified; 2026-12-31 matches).
**Open blocker F-C2:** source-named read turns (compare/calculate/confirm)
settle `success=false`/`outcome_unconfirmed` — ⚠️-surfaced and never a false
success — even when the delivered content is CORRECT and drawn from this
turn's verified retrieval of the named ingested source; 6/6 across both runs;
tracked as the next bounded slice at the settlement boundary (owner-directed
lane; must match the retrieved source to the named one, never bless arbitrary
context). **F-C3 (recorded):** the calculation leg uses the J5-demonstrated
structured ask shape on the next composed run. Archive:
`journey_matrix/composed_job_20261017/` (2 run JSONs, harness, screenshots,
CHECKSUMS).

**Rev 8 (2026-10-17 late, composed run 4 — the release candidate's journey evidence).**
On the release candidate (runtime `dad8f9fce` lineage; harness/docs `9c9e5c76e`),
the composed user job ran once end-to-end: **36/39 checks green with 3 named
exclusions; the SUPPORTED WORKFLOW PASSED** — setup → provider activation
(no re-save, one store POST) → upload durable → sourced answer (S3
`success=true`/`outcome=partial`, mismatch identified, zero writes — the
context-backed fulfillment repair's predeclared shape) → authorized edit
exactly-once + readback + audit → **verified calculation (`outcome=completed`
with formula-engine evidence)** → deliberate SIGKILL + restart + convergence
(all invariants green; exactly one terms change, valid-until intact) →
continuation (content checks pass) → reload readback (`Net 45` +
`2026-12-31`, no wizard). **Named exclusions, never certified:** (1) the
idempotent re-ask settlement (`s6-resend-reply-received`) — exact follow-up
criterion recorded (same change durably satisfied on the CURRENT artifact
revision → "Already applied; nothing changed", zero writes, consistent
outcome; a historical operation alone never establishes it); (2) the
continuation settlement (`s7-reply-received`) — the source-noun vocabulary
exclusion, deliberately not widened; (3) `no-failed-requests`, the aggregate
those two excluded turns contribute to. Configuration identity: the
structured calculation ask is an ACCEPTED INPUT CHANGE (the supported
shape); run 3 preserves the plain ask's correct-but-unverifiable outcome.
Archive: `journey_matrix/composed_job_20261017/` (all four runs preserved).
Next: pilot deployment (controlled restart, identity check,
beyond-navigation smoke), then the repeatability/value evaluation and the
support statement.

**Rev 9 (2026-10-17 late, PILOT DEPLOYMENT verified).** The scoped release
candidate was deployed through a controlled, scoped restart of the live
`:8001` dev service (step 4 of the owner sequence): two pre-restart DB
snapshots (gzip-verified; off-machine copy N/A — this host is local-only),
one backend serving **`8c593e57031e`** (checkout verified against the
tested candidate: empty runtime diff), and the beyond-navigation smoke on
the SERVED app: **6/6 — login/dashboard, provider activation via the UI,
one useful sourced answer ("QUARTZ-77 … found in your uploaded file"), and
one saved edit/readback (2026-12-31 + exactly one audit row)**. Archive:
`journey_matrix/deployment_smoke_20261017_223948/` (README with all five
attempts and causes, passing run JSON, screenshots). Deployment notes: the
blanket `restart_backend.sh` kill was deliberately SCOPED to `:8001` (38
uvicorn instances of other streams' worlds were running); the operator's
expired stored `opencode-go` key was rotated to the operator-provided fresh
key (Settings→AI equivalent; vault backup kept) — the live app's cloud
route works again; a pilot frontend is left running on `:3000` → `:8001`.
Row 43's exclusions are unchanged and remain uncertified. Next: the small
predeclared repeatability/value evaluation and the support statement.

**Rev 10 (2026-10-17 late, repeatability/value evaluation + SUPPORT STATEMENT).**
The predeclared evaluation (protocol `18b0dc2a2`) ran on the deployed pilot:
**3/3 fresh ordinary users completed the job; median 130.2 s; 5 required
actions; zero forced extras; zero clarifications/retries; edits 3/3
exactly-once + readback + audit.** The DB cross-check surfaced **F-R1**: for
the sourced-answer ask the deployed cloud planner chose the `memory` lane in
**2/3** repetitions — content correct from the assembled context, but the
saved status resolved failed/unconfirmed; the `documents.search` lane (1/3)
validated. **F-R2**: the evaluation harness's `green` criterion omitted the
settled state (recorded in the README; run JSON's raw responses carry the
truth). Named limitation **L3** added. The **SUPPORT STATEMENT**
(`docs/acceptance/SUPPORT_STATEMENT_2026-10-17.md`) is published with L1
(re-ask), L2 (continuation) and L3 visible, the exact tested configuration,
measured latency/action numbers, deployment identity and rollback. Next:
the two owner-briefed frozen repair slices (re-ask via the existing no-op
mechanism; continuation via interpretation), then L3's requirement-driven
tool-choice slice. The pilot remains live at `8c593e57031e`.

**Rev 11 (2026-10-18, L1/S6 SERVED VERIFICATION on the scope-repair
successor).** The idempotent re-ask (L1) is **verified through the served
API** on successor **`aaa1169d7`** (pin-gate scope repair; parent
`b96dec60a`, the approved no-op candidate — unchanged) in an isolated
scratch configuration declared before the attempt: Go endpoint
(`OPENCODE_BASE_URL=https://opencode.ai/inference/go/openai/v1`), edit-plan
pin `opencode-go/deepseek-v4-pro`, pilot-matching finalization/lifecycle
flags, one authorized operator credential registered through the product,
scratch stores only; pilot `:8001` untouched. The original S6 re-ask over a
served draft carrying `Terms: Net 45` produced the structured no-op receipt
(`metadata.canvas_edit.noop=true`, `noop_reason="already_satisfied"`,
`background_started=false`, `persistence.status="persisted"`), the
receipt-derived reply ("Verified on the current draft: payment terms in the
draft already set to Net 45… nothing was sent."), **zero added canvas
writes**, `outcome=completed`/`success=true`, and a fresh history reload
serving the same explicit non-null fields as the persisted row. Intended vs
actual: `opencode-go/deepseek-v4-pro` dispatched on the Go endpoint only
(no Zen posts, no unpinned fallback; one JSON-mode adaptation on the Go
route recorded). Evidence:
`journey_matrix/l1_s6_successor_served_20261018/` (README, summary, both
runs, deterministic rescore, CHECKSUMS). **Scope:** this certifies the
served mechanism on `aaa1169d7` + the declared configuration — NOT pilot
deployment; the deployed pilot (`8c593e57031e`) still does not include the
fix, and row 43's exclusions are unchanged until integration +
re-verification there.

**Rev 12 (2026-10-18, L3 document-evidence SERVED VERIFICATION on the
frozen L3 candidate).** The sourced-answer saved-status limitation (L3,
F-R1) is **verified through the served API** on candidate
**`6d662abff`** (L3 repair `8f881fd6c`; parent `aaa1169d7` — the L1
successor, untouched) in the predeclared isolated configuration: the
pilot's cloud route (`OPENCODE_BASE_URL=https://opencode.ai/zen/go/v1`),
one authorized operator credential registered through the product,
fastembed local embeddings, pilot-matching finalization/lifecycle flags,
scratch stores; pilot `:8001` untouched. A fresh product user; the
fixture uploaded through `POST /api/documents/upload`; the ORIGINAL
request ("search my uploaded documents for the launch code for project
Zephyr-9 and tell me the code") with REAL planning: the cloud planner's
first pass proposed a non-eligible lane and the source-ask floor's
corrective pass returned `documents.search`; the executed plan
`documents.search:Zephyr-9 launch code` settled a **verified complete
receipt** (`match_count=1`, `coverage=complete`), `objective_met=true`,
`success=true`, `outcome=completed`, the answer carrying `QUARTZ-77`
from the uploaded file, and a fresh history reload agreeing with the
persisted row (execution `f6203e01-9959-4037-b877-ccc44e43bbd0`; 43.1 s;
9/9 predeclared gates). Disclosed: the reply leg was served by the local
`ollama/llama3.1:8b` runtime (auto-discovered; no credential) while
planning ran on the declared cloud route — no predeclared gate depended
on the reply route. Evidence:
`journey_matrix/l3_document_evidence_served_20261018/` (declaration,
config, result, server log, summary, CHECKSUMS). **Scope:** certifies the
served mechanism on `6d662abff` + the declared configuration — NOT pilot
deployment; the pilot (`8c593e57031e`) still carries the L3 limitation
until integration + re-verification there; row 43's exclusions unchanged.

**Rev 13 (2026-10-19, L2 continuation served attempt 1 — NOT PASSED, no
promotion).** The continuation-reference repair was served on candidate
**`a6cd2c8ba`** (parent `ddab120c4`, the L3 promotion commit) in the
predeclared isolated configuration (pilot cloud route `zen/go/v1`, one
authorized operator credential through the scratch product API, fastembed
local embeddings, pilot-matching finalization/lifecycle flags, scratch
stores; pilot `:8001` untouched). Fresh user; the approved-records fixture
uploaded through `POST /api/documents/upload`; the draft created through
the product in the original S7 state; then the ORIGINAL S3 comparison ask
and the ORIGINAL S7 continuation, in one conversation. **S3 passed**
(validated partial with `context_fulfillment.state=partial`,
`supplied_fields=["expiration_date"]`, matched
`approved_records_q2026_114.txt`, `missing_comparison=true`; zero writes;
truthful comparison). **S7 did NOT pass**: the requirement was captured
and execution-bound (`required=true`, `sources=["document"]`), and the
prior S3 source was in the observed pool, but the real interpreter
(`llm:glm-5.3-flash`) proposed annotated descriptions
("approved_records_q2026_114.txt (the user's uploaded Approved Records
document)", "draft quotation (source not yet named by the user)") rather
than clean identities. The composer preserved `unresolved` (its
owner-approved no-substring-donation contract), so the F-C2 verdict is
`unresolved` and the settlement is `partial` with the honest
no-ingested-document-matches basis — not the resolved-source
certification target. The reply was correct, zero-write, draft unchanged,
and response/persisted-row/fresh-history agreement held; those do not
substitute for the missing identity. 19/22 predeclared gates passed; the
first failure is `s7_requirement_captured`. **No promotion**; L2 remains
open. Evidence:
`journey_matrix/l2_continuation_served_20261019/` (declaration, config,
result, observation log, server log, README, summary, CHECKSUMS). Next
bounded question: clean interpreter source-identity proposals (exact
filename or canonical kind), not tokenizer expansion or composer substring
relaxation.

**Rev 14 (2026-10-19, L2 continuation served attempt 2 — NOT PASSED, no
promotion).** The producer-corrected candidate **`51628b925`** (parent
`a6cd2c8ba`; `sources` keeps `List[str]` with an explicit identity
contract in schema + prompt, structured `SOURCE REFERENCES` separating
observed evidence/requested sources/attached artifact, supported kinds
from `SOURCE_KINDS`; the composer/consumer is untouched; local L2 battery
41 passed, neighbors 277 passed + the 2 pre-existing
`TestEditPlanRungKnob` failures) was served in the same predeclared
configuration on a fresh port/world (8096, scratch stores). **Both**
interpretation calls (S3 and S7) timed out at the product's 12-second
bound (structured dispatch attempted on `opencode-go/glm-5.3-flash` and
`opencode-go/qwen3.8-flash`; 8 Zen posts, 0 Go-inference posts), so the
producer correction was never exercised. The S7 requirement therefore
stayed uncaptured (`required=false`, `sources=[]`), the fallback reply
lane returned a wrong approved date in S3 (`2026-12-30`; the fixture says
`2026-12-31`) and settled S7 `unconfirmed`; zero writes and draft
unchanged held, and the pilot identity was unchanged. The live-DB guard
also flagged a change during the window (external pilot activity
expected; the attempt used only scratch stores and the server log
contains no live dev DB path), so this was not a clean isolated run.
15/22 predeclared gates passed; the first failure is
`real_interpretation_dispatched`. **No promotion**; L2 remains open and
the producer correction is unverified by served evidence. Evidence:
`journey_matrix/l2_continuation_served_20261019/` (attempt 1 record +
`README_ATTEMPT2.md`, `attempt2_*`, `summary_attempt2.json`,
`CHECKSUMS_ATTEMPT2.sha256`). A further served run, an
interpretation-timeout change, or a model change is an owner decision.

**Rev 15 (2026-10-19, L2 served attempt 3 on the execution-policy
successor — NOT PASSED, no promotion).** Candidate **`10982e839`**
(parent `2604dea2d`; producer correction + `disable_reasoning=True`,
derived 5,500-token budget, `turn_interpretation:<request_id>` trace,
`allow_moa=False`; 12 s deadline preserved; composer untouched; local
L2+transport 52 passed, neighbors 339 passed + 2 pre-existing) was served
in the same predeclared configuration on a fresh port/world (8097). Stage
record: `dispatch_attempted=true` for both turns — `opencode-go/glm-5.3-flash`
(S3) and `qwen3.8-flash` (S7), both with `cap=5500` and the
`turn_interpretation:…` route trace; `completed_within_deadline=false`
for both (`[structured-cancelled]` at 11.9 s / 12.0 s, no
`[structured-trace]` for the interpretation routes); `producer_output_valid=false`
and `source_identity_resolved=false` (not reached). The S7 requirement
stayed uncaptured (`required=false`), the settlement `unconfirmed`, and
the S3 narration error recurred (excerpt `2026-12-31`; reply claimed
`2023-01-01`). Zero writes/draft unchanged and both agreements held;
`live_db_unchanged=true`; pilot untouched. **No promotion**; L2 remains
open; the producer correction and the execution-policy change are both
unverified by served evidence. A further run needs an owner decision on
the completion budget/model/route (or the declared deadline). Evidence:
`journey_matrix/l2_continuation_served_20261019/` (attempts 1–3,
corrected assessment, `CHECKSUMS_ATTEMPT3`).

**Rev 16 (2026-10-19, L2 diagnostic-selected successor served attempt 4 —
NOT PASSED, no promotion).** Candidate **`491afa936`** (parent
`ef4b8ccf6`; measured `opencode-go/qwen3.8-flash` interpretation pin via
the existing pinned-planning wrapper with unpinned fallback, bounded
**65 s** interpretation deadline, 5,500-token ceiling, reasoning-off, MoA
opt-out, verified-field narration guard; focused 73 passed, neighbors 556
passed + 2 pre-existing `TestEditPlanRungKnob`) was served on a fresh
port/world (8099). Stage record: `dispatch_attempted=true`,
`completed_within_deadline=true` (S3 25.8 s, S7 35.2 s),
`producer_output_valid=true`, `source_identity_resolved=true` (S7
requirement resolved to `approved_records_q2026_114.txt`, catalog
`doc_3abaf0d03badbc965b0f2770`; composition resolved).
**S7 passed the certification target**: `success=true`,
`outcome=completed`, `context_fulfillment.state=completed`,
`supplied_fields=["expiration_date"]`, matched source, truthful
`2026-12-31` reply, zero writes, draft unchanged, fresh-history
agreement. **S3 failed on the reply-leg turn clock**: interpretation was
valid at 25.8 s, the reply leg started at 27.6 s and ran 36.4 s, the
turn's 68 s reply-leg cap enforced an honest budget error, and the POST
returned at **95.07 s** (S7 73.21 s); no S3 reply/requirement/observation
carrier existed, so the verified-narration guard was not exercised and
prior evidence was absent. `live_db_unchanged` was false again, but the
attempt's user/session/execution identities are present only in scratch
(live 0/0/0) — unrelated pilot activity; the guard boolean is retained.
**No promotion**; L2 remains open. The interpretation bottleneck is
fixed; the next repair is the S3 reply/planning leg's share of the turn
budget (or a faster reply route). Evidence:
`journey_matrix/l2_continuation_served_20261019/` (attempts 1–4,
diagnostic results, corrected assessment, `CHECKSUMS_ATTEMPT4`).

**Rev 17 (2026-10-19, L2 typed-field continuation/guard-order — SERVED
VERIFICATION on `d0b707333`).** The guard-order successor (verified
comparison built before the grounding/absence/search-narration corrective
chain; complete typed-field coverage returns the deterministic comparison
with no corrective model call; provider-failure/edit-shaped turns
excluded; current-execution + resolved-file filtering; no search claim;
65 s interpretation bound on the measured route; focused 78 passed,
neighbors 561 passed + 2 pre-existing `TestEditPlanRungKnob`) was served
on the same S3→S7 job/configuration (port 8100, scratch stores). All
predeclared attempt-5 gates pass after correcting a latency-report bug
(the preserved POST latencies are **S3 54.08 s / S7 59.72 s**, within the
95 s budget): S3's log records `[verified-comparison] deterministic
replacement BEFORE corrective guards`, no corrective model call, the
verified `2026-12-31` reply with no wrong approved date, zero writes,
draft unchanged, requirement captured and agreement true; S7 resolved the
requirement to `approved_records_q2026_114.txt`
(`doc_3abaf0d03badbc965b0f2770`), `context_fulfillment.completed`,
`success=true`, `outcome=completed`, truthful content, zero writes,
draft unchanged, fresh-history agreement; `live_db_unchanged=true`,
`pilot_untouched=true`. **Promoted claim:** the typed-field
continuation/guard-order repair on `d0b707333` + configuration — not
general interpretation reliability, pilot deployment, or restart
durability. **Disclosed residual (not promoted):** the S3 prose also says
"Everything appears consistent for now" while the draft Terms (Net 45)
differ from the approved Net 30; the deterministic scope line says other
differences were not assessed, but the broader whole-document
"flag anything that differs" comparison remains open. Evidence:
`journey_matrix/l2_continuation_served_20261019/` (attempts 1–5,
diagnostic results, corrected assessment, `CHECKSUMS_ATTEMPT5`).

**Rev 18 (2026-10-19, L2 S3 deterministic/request-coverage PASSED;
S7 producer malformed — chain open, no full-chain promotion).** Candidate
**`65b63494e`** (deterministic verified reply alone; reviewed
`payment_terms` mapping and source-excerpt parsing; broader requests
include every typed field the artifact exposes, draft-only fields as
named gaps, `coverage.request_complete=false` keeps the overall result
partial/open; interpretation unchanged; focused 81 passed, neighbors 564
passed + 2 pre-existing `TestEditPlanRungKnob`) was served on the same
S3→S7 job/configuration (port 8102). **S3 passed:** 52.5 s, renderer
output alone, verified `2026-12-31` match, terms mismatch recorded (Net 45
vs Net 30), no global consistency claim, no corrective model call, zero
writes, draft unchanged, agreement true. **S7 did not:** the
interpretation dispatched and completed in 32.9 s but returned
`origin=unresolved`, `reason=malformed_output`, actions/sources empty, so
the requirement stayed `required=false` and source identity/settlement
were not established; the deterministic S7 text was not certified. This is
a producer-output-validity failure, not a timeout or guard-order failure.
No new full-chain promotion; L2 remains open. Evidence:
`journey_matrix/l2_continuation_served_20261019/` (attempt 7,
`CHECKSUMS_ATTEMPT7`).

**Rev 19 (2026-10-19, L2 scope contract PASSED; S7 producer empty
actions — chain open).** Candidate **`23f3455f7`** (required five-value
`scope_change` Literal; distinct `missing_scope`/`invalid_scope`/
`scope_unresolved`/`no_actions_proposed`; scratch capture; prompt
distinguishes established-conversation follow-up/continue from
unfinished-work resume and ambiguous/unresolved; S3 deterministic/
coverage repair unchanged; focused 87 passed, neighbors 570 passed + 2
pre-existing) was served on the same S3→S7 job/configuration (port 8103).
**S3 passed** (renderer alone, verified date, terms/coverage, no global
claim, zero writes). **S7 did not:** the interpretation was schema-valid
in scope but proposed **no actions** (`no_actions_proposed`, 30.5 s), so
the requirement was not captured and source identity/settlement were not
established. This is the producer action-contract gap, not the old silent
scope default or a timeout. No new full-chain promotion; L2 remains open.
Evidence: `journey_matrix/l2_continuation_served_20261019/` (attempt 8,
`CHECKSUMS_ATTEMPT8`).

**Rev 20 (2026-10-19, L2 S7 action contract PASSED; chain reaches
settlement classification mismatch — open).** Candidate
**`a3875d6bb`** (required actions + required six-kind action `kind`; at
least one action for a resolved scope; explicit unresolved allowed
without synthesis; reasons/telemetry independent of capture; content-free
archived capture; schema/decode failures cannot bench a provider; focused
102 passed, neighbors 584 passed + 2 pre-existing) was served on the same
S3→S7 job/configuration (port 8104). The bounded S7 producer diagnostic
first returned `continue`, 2 actions (`research`, `presentation`),
resolved identity, and pre/post capture in 28.2 s (1 HTTP post, 65 s
bound). **S3** passed the typed verified-narration gate (deterministic
renderer alone, `2026-12-31` match, terms/price unverified, broader open,
zero writes). **S7** passed the action contract, requirement capture
(resolved `approved_records_q2026_114.txt`), truthful reply, zero writes,
and fresh-history agreement — but **failed `s7_settlement_basis`**:
`outcome=completed` while `context_fulfillment=partial` (expiration met;
payment terms + price unmet; ledger covered=1/missing=2; broader
comparison open). This is a settlement/outcome classification mismatch,
not a producer or narration failure. No new full-chain promotion; L2
remains open. Evidence:
`journey_matrix/l2_continuation_served_20261019/` (attempt 9,
`README_ATTEMPT9.md`, `summary_attempt9.json`).

**Rev 21 (2026-10-19, L2 request-bound comparison-scope + settlement —
SERVED VERIFICATION on `c0cbea9f1`; chain closed, promoted).** Lineage:
`495099362` (delivery validation vs request-bound obligations) →
`b70f9fa65` (request-bound completeness; attempt 10 passed S3 with the
broader obligation open but failed `s7_date_only_not_completed` — the
accepted S7 interpretation inherited the prior turn's generic constraint
"Flag anything that differs" and the adapter expanded the date contract
to payment terms/price) → **`c0cbea9f1`** (field-scope repair: a
comparison is broad only when the accepted requested-fields contract
names OTHER fields; a generic difference constraint about the requested
date stays narrow; explicit narrowing still wins; degraded/unresolved
interpretations fall back to message-shaped scope; served-contract
controls cover attempt-10 S3 as broad and attempt-10 S7 as narrow; focused
152 passed, neighbors 599 + 2 pre-existing `TestEditPlanRungKnob`;
mutation controls for the gap-suppression and builder-search guards
fail when restored; independent review PASS, no HIGH findings). Attempt
11 on the same candidate was environment-blocked (opencode-go monthly
quota: HTTP 429 `GoUsageLimitError` on every interpretation call;
preserved, not promoted). Attempt 12 ran the unchanged job on the
**declared DeepSeek direct API** (`https://api.deepseek.com/v1`,
operator credential registered through the product, interpretation pin
`deepseek:deepseek-v4-pro`, fresh scratch, port 8108) and passed
**29/29 predeclared checks**: both turns interpreted on
`llm:deepseek-v4-pro` (S3 63.55 s / S7 49.41 s, within the 95 s bound);
S3 deterministic renderer alone with the verified `2026-12-31` match,
payment terms and price named as unverified gaps, the broader comparison
obligation OPEN and named (disclosed, not claimed), no global
consistency claim, zero writes; S7 stayed narrow
(`broader_comparison=false`, `expiration_date`), requirement resolved to
`approved_records_q2026_114.txt` (`doc_3abaf0d03badbc965b0f2770`),
`context_fulfillment=completed`, `outcome=completed`/`success=true`,
truthful verified reply, zero writes, capture archived, fresh-history
agreement; `live_db_unchanged=true`, `pilot_untouched=true`. **Promoted
claim:** the L2 request-bound comparison-scope + settlement repair on
`c0cbea9f1` in the declared DeepSeek-direct configuration — not the
pilot's opencode-go route, general interpretation reliability, pilot
deployment, or restart durability. The prior typed-field
continuation/guard-order claim on `d0b707333` (rev 17) remains as
lineage. Evidence:
`journey_matrix/l2_continuation_served_20261019/` (README_ATTEMPT10/11/12,
`summary_attempt12.json`, `attempt12_result.json`, `attempt12_server.log`,
DeepSeek dispatch probe, `CHECKSUMS_ATTEMPT12.sha256`).

**Rev 22 (2026-10-19; corrected 2026-10-20, integrated L1+L2+L3
candidate — composed served attempt 2 NOT PASSED; required document
retrieval did not execute after tool-planning timeout; no promotion, no
deployment).** Candidate `ddcc404dd` (`integration/l1-l2-l3`) merges L3
`6d662abff` (contains L1 `aaa1169d7`) + L2 `c0cbea9f1` + main
`e6308cb54` (merge base `bb8081b288`); the one code conflict (L3
`_build_evidence_requirement` + L2 `accepted_request`) was resolved as a
union (`_stash_evidence_requirement` forwards `accepted_request`); no
product changes in attempts 1 or 2. Local: the 11-file focused run has
only the pre-existing
`fallback_honesty::test_satisfied_requirement_completes`; the wider
focused run has no merge-specific failures. Attempt 1 (preserved,
non-governing) failed on job design/harness issues only. Attempt 2 was
predeclared (`PREDECLARED_CONFIG_ATTEMPT2.md`, sha256 `66e21151…`;
runner `run_composed_served_attempt2.py`) and ran on a scratch
world/port with the frozen candidate: **40/58 checks**; first failure
`l3_documents_receipt_missing`. The verified blocker is a **control-flow
gap, not a local merge bug and not a demonstrated provider-route
conflict**: the accepted L3 turn compiled a `source_read` for documents
(`mode="fresh_read"`, `sources=["documents"]`) after the interpretation
chose `research`, but the separate 11,434-character tool-planning call
hit `TimeoutError`; the server recorded `tool planning skipped:
TimeoutError()` and `tool plan executed: None`. Required document
retrieval was not executed after tool-planning timeout; the integrated
workflow remains unverified. The answer content was correct
(`QUARTZ-77`, no decoy `BASALT-13`) because `context_assembly` had
retrieved one source, but there was no `documents.search` receipt and no
settled status (`objective_met=null`). Provider/configuration
differences are retained as observations, not as proof that one
configuration is impossible: the L3 parent's proven interpretation route
(default `qwen3.8-flash` via the pilot cloud route, Ollama reply)
executed `documents.search`; the L2-verified DeepSeek pin resolved S7 in
attempt 12. In attempt 2's two-document world S3 captured only the date
(`broader_comparison=false`, `fields=["expiration_date"]`) with
`context_fulfillment=partial`, and S7's interpretation hit the 65 s
stage timeout (`reason=timeout`, turn 94.77 s vs the 95 s bound) leaving
`outcome=unconfirmed`; these are separate findings. `ChatRequest`
exposes no per-turn model/provider/interpretation selection
(`core/atom_agent_endpoints.py`) and `ATOM_TURN_INTERPRET_PIN` is global
(`core/turn_decision.py`); that is a configuration observation, not
evidence that one configuration cannot serve the workflow, and no
routing subsystem is justified before the control-flow gap is fixed.
Harness notes: `edit_settled_completed` false was an extraction gap,
corrected additively from the preserved durable row
(`objective_met=true`/`mutation.readback_matched=true`, served receipt
`outcome=completed`; regression
`backend/tests/test_attempt2_edit_extraction.py`);
`live_db_unchanged` false is not attributable to the scratch server:
only the pilot holds `backend/data/atom.db`/WAL open read/write, the
scratch server's declared database is
`.../l1-l2-l3-composed-attempt2/atom.db`, and a read-only copy of the
live DB+WAL has no application rows timestamped 21:50–21:59 (the live
file mtime is not a row write; row-level attribution remains
incomplete; live-data deployment stays held). Also green in attempt 2:
L3 answer content (`QUARTZ-77`, no `BASALT-13`), draft creation, terms
edit receipt/body/audit/field preservation, the identical re-ask
structured no-op (`noop=true`/`already_satisfied`, `outcome=completed`,
zero added writes, body unchanged), S3 date truthfulness/no false
date/no global claim/zero writes, restart identity/zero-write, and
durable edit/re-ask rows after restart. **No promotion; the integrated
candidate was not deployed; the pilot (`8c593e57031e`) remains the
served build.** Next: fix the control-flow gap (bound the optional
planning call internally; deterministic required-read enforcement; a
caller-side fallback for whole-plan cancellation), add focused
stalled-planning tests including a mutation control, then freeze and
verify **one** successor under **one** declared configuration. Keep the
L2 parser/continuation work closed and the whole-document comparison
visibly open. Evidence:
`journey_matrix/l1_l2_l3_integrated_served_20261019/` (attempt 1/2
evidence, `ATTEMPT2_LIMITATION.md`, `CHECKSUMS_ATTEMPT2.sha256`).

**Rev 23 (2026-10-20, successor attempt 3 — L3 required-read timeout
FIXED and verified; composed workflow still NOT PASSED; no promotion, no
deployment).** Successor `2a113d1a3` on
`fix/l3-required-read-timeout` bounds optional tool planning internally,
enforces the accepted required read deterministically, and adds a
caller-side fallback for whole-plan cancellation. Attempt 3 was
predeclared at product `2a113d1a3` and run at acceptance HEAD
`67b9fbc85` under the **same DeepSeek-direct / Ollama-reply / fastembed
configuration** that failed attempt 2, with one workspace and the full
upload → L3 → edit → identical re-ask → S3 → S7 → restart sequence.
Result: **48/59 checks**, first failure `comparison_untruthful`. **L3
passes:** optional planning timed out at 20.0 s
(`attempt3_server_pre.log:1227`), the server executed
`documents.search:the launch code for project Zephyr-9`
(`:1242`), the durable receipt is verified complete
(`match_count=1`/`coverage=complete`), bound to the turn's execution and
workspace, `objective_met=true`, settlement `completed`, fresh history
agrees, and the answer carries `QUARTZ-77` with no decoy. The L1 edit
and identical re-ask also pass (one audit/write, then a structured no-op
with zero added writes). **S3 and S7 remain open:** S3's structured
interpretation was cancelled after 64.9 s and the 95.03 s turn returned
the time-budget message with no comparison; S7 returned the correct
typed date comparison with zero writes but settled
`turn_failed_no_result`/`final_outcome=failed`, so restart
history/execution agreement fails. The `continuation_source_resolved`
gate is additionally over-constrained: it requires S3's execution id,
which does not exist because S3 timed out, although S7's captured
requirement resolves to `approved_records_q2026_114.txt`; this is
recorded as a harness caveat, not as a source error. **Live DB:** the
unattributable mtime gate was replaced by `live_db_isolated` based on
actual store access — scratch PID `17669` held no live DB/WAL/SHM
handle, only pilot PID `81067` held it, all configured stores were under
scratch, and live row counts were unchanged. The pilot-owned content
hash changed during the run and is recorded as an observation, not
attributed to the scratch server. Mutation evidence: an in-test
behavioral control restores the old no-receipt shape; a temporary
literal `return proposal` in `enforce_required_read` makes the outer
timeout test fail with `receipts=[]` while the restored source passes.
The first launch was rejected by the identity gate because the runner's
own evidence file dirtied the worktree; no turn executed, and the run
was repeated under the same frozen product/configuration after ignoring
runtime artifacts. **No promotion; the successor was not deployed; the
pilot remains `8c593e57031e`.** Evidence:
`journey_matrix/l1_l2_l3_integrated_served_20261020/` (attempt 3
result/summary/logs, `ATTEMPT3_RESULT.md`,
`MUTATION_EVIDENCE_ATTEMPT3.md`, `CHECKSUMS_ATTEMPT3.sha256`).

**How to read the columns.** Evidence dimensions are **independent, not a
ladder** — a row names exactly which dimension(s) its evidence establishes:

`mechanism` / `public API` / `browser` / real process `restart` /
`reload-readback` / `fresh install`. A restart test does not prove browser
behavior; a reload/readback (a fresh re-read of durable state, no process
restart) is not a restart and is labeled separately. A pass at `mechanism`
level only is capability evidence, never user acceptance.

**Global qualifications (stay visible):**

1. **R4 provenance** — the interrupted-read acceptance passed on `c1beb7c0b`
   (branch `r4-successor-candidate`, runtime pin `2070147ee`), **not** the originally
   approved `c6dd2d0e5`/`8615c28b7`. Its provenance includes two post-pin runtime commits
   (`a45da2b78`, `2070147ee`, confined to the re-display lane's response binding/scope)
   and the seven-attempt campaign history. Reviewer-accepted for the scoped claim;
   labels preserved: `diagnostic_only=true`, `counted=false`.
2. **Coverage/outcome consistency is a user-facing correctness issue, tracked
   separately (row 42)** — the recovered render says "Coverage: 0/3 items matched"
   while all three facts are delivered with correct item/value attribution, and the
   first recovery resolves `outcome=partial` on full coverage. The demonstrated recovery
   milestone is not reopened by this item.
3. **Integration state** — at the Phase B snapshot, main HEAD was `b644c2153`
   (contains J4/J5 r18 lineage via `d6bfe85f9`, J6 `c05cfd69b`, R3 `853226d79`, but
   **not** the R4 successor runtime commits `a45da2b78`/`2070147ee`/`c1beb7c0b` —
   branch `r4-successor-candidate` only). After the snapshot, main advanced to
   `ab643062b` — a bounded R4 repair commit (2026-10-17 09:01) that landed through the
   separately authorized process; nothing in this matrix is re-bound to it and no
   journey has been re-verified on it. The successor commits are still not in main;
   no journey has been re-verified on `b644c2153` either. The main working tree
   additionally carries unrelated in-flight edits that belong to no candidate.

**Reconciliation process.** Records were compared against preserved campaign evidence in
`journey_matrix/` and the coordination record, then supersessions were written via
`journey_contract.py --record` (which validates evidence pointers, requires a tested
candidate for verified records, and captures the recording checkout separately as
`identity`). Historical successes and failures stay bound to their own candidates.
No campaign, server, runtime, or harness change was made. The r18 run JSONs and the R4
campaign evidence are now archived in-repo with `checksums.sha256` files (sha256-verified
against the `/tmp` originals; credential scans clean before archiving).

---

## The matrix

| # | User capability (assertion) | Status | Evidence level | Identity (candidate + config) | Evidence | Remaining limitation | Next action |
|---|-----------------------------|--------|----------------|-------------------------------|----------|----------------------|-------------|
| 1 | **J1.config-parity** — required gates (lifecycle, finalization M1/M2) are EFFECTIVE in the serving process after quickstart env generation | verified | mechanism (load-order-faithful subprocess from code export) | `d6fbcd846`, allowlisted export world, 2026-10-12 | `journey_matrix/parity_pristine_20261012_20261012_104240_de7328.json` | dependency installation not exercised (export reuses interpreter) | Phase D fresh-install proof (acceptance) |
| 2 | **J1.boot** — backend boots healthy on the generated env (scratch DB) | verified | mechanism + public API (`/api/health`) | `d6fbcd846` | same as 1 | clean-machine boot unproven | Phase D |
| 3 | **J1.signin** — sign in works (real login form + API session) | verified | browser + public API | `e207494af4c7` (Phase E local run, 25/25; bootstrap admin + freshly registered user) | `journey_matrix/phase_e_candidate/evidence/browser_phase_e_local_20261017_175758.json`; prior lineage `phase_d_fresh_install/browser_complete_loop_r3_20261017_113656.json` (`68729ebe4`) | cloud world supplementary re-run green (run 7 25/25; run 6 preserved — planner tool-selection variance disclosed, rev 6) | none (Phase E) |
| 4 | **J1.workspace** — workspace created/used through the product | verified | public API | `d6fbcd846` | parity JSON | not re-run on any later lineage | Phase D/E |
| 5 | **J1.quickstart-install** — clean install from scratch (venv, deps, generated env) | **verified** | fresh install + browser loop | `e207494af4c7` (detached worktree, isolated data, ports 18300/18301); supported-interpreter path: documented manual venv + unchanged `scripts/quickstart.sh` rc=0 with ZERO interventions; host-default 3.14 refused up front (F1 fix) | `journey_matrix/phase_e_candidate/` — local run `evidence/browser_phase_e_local_20261017_175758.json` (25/25), `logs/f1_refusal.log`, `logs/install_supported.log`, README, CHECKSUMS; prior Phase D archive retained (`phase_d_fresh_install/`) | fresh venv on the EXISTING HOST only; F1–F3 original failures preserved in the Phase D archive; cloud answer leg promoted on this candidate with the rev-6 variance disclosed | none — Phase E closed |
| 6 | **J1.onboarding-completion** *(registered 2026-10-17)* — "Start Automating" persists, wizard closes, reload/sign-in does not reopen | **verified** | browser | `e207494af4c7` (Phase E local run), fresh product-created user, installed product; prior lineage `68729ebe4` (Phase D) and `cca1fb13d` (Phase C, harness `43c1dc43…`) | `journey_matrix/phase_e_candidate/evidence/browser_phase_e_local_20261017_175758.json` (completion persisted: DB `onboarding_completed=1`, `/api/onboarding/status` completed, reload shows no wizard); Phase C/D evidence retained | re-bound to the installed product; the same run records the F4 regression green (configure once → first request uses that provider, no re-save) | none — Phase E closed |
| 7 | **J2.provider-setup-first-reply** — provider added via product; first request served by it | verified | public API (+ Oct-12 browser chain on earlier lineage) | pin `cf6e31e26` (digests `177ef2a1…`/`5945c832…`), r14b, local ollama `llama3.1:8b` | `journey_matrix/j2_model_setup_20261013_182933_e7f609.json` | bound to `cf6e31e26`; not re-run on later lineage | unified-candidate re-run (Phase E) |
| 8 | **J2.real-reply** — counted first request served (no warm-up) | verified | public API | same as 7 | same as 7 (PONG 4.609 s) | same as 7 | Phase E |
| 9 | **J2.byok-add-product-path** — BYOK key stored via product, decrypts | verified | public API | same as 7 | same as 7 | same as 7 | Phase E |
| 10 | **J2.byok-survive-restart** — key survives real restart | verified | public API + restart | same as 7 | same as 7 | same as 7 | Phase E |
| 11 | **J2.local-provider-product-path** — local provider register/discover via product | verified | public API | same as 7 | same as 7 | same as 7 | Phase E |
| 12 | **J2.app-executed-supported-read** — tool turn executes a supported read (documents search) | verified | public API | same as 7 (execution `c8422ecb…`, five checks true) | same as 7 | same as 7 | Phase E |
| 13 | **J2.attributable-durable-receipt** — durable receipt bound to the current request's execution | verified | public API | same as 7 | same as 7 | same as 7 | Phase E |
| 14 | **J2.truthful-result** — truthful narration; zero unbacked claims | verified | public API | same as 7 | same as 7 | same as 7 | Phase E |
| 15 | **J2.restart-durability** — settings persist; second reply after real restart | verified | restart | same as 7 | same as 7 | same as 7 | Phase E |
| 16 | **J2.consistent-machine-outcome** — response / metadata / durable outcome / history agree | verified | public API | same as 7 | `journey_matrix/j2_consistency_r14b_20261013.json` | same as 7 | Phase E |
| 17 | **J2.public-completed-outcome** — `success=true`, `outcome=completed` across surfaces | verified | public API | same as 7 | same as 16 | same as 7 | Phase E |
| 18 | **J2.tool-planning** — a tool-shaped ask selects a tool | **untested** | mechanism (probe only) | `cf6e31e26`-era | `journey_matrix/probe_j2_ranking_20261012_103859_08fb31.json` | model-native planning not exercised; deterministic application read certified separately (row 12) | one bounded diagnostic (tool-shaped ask + turn metadata) or recorded re-scope (acceptance) |
| 19 | **J2.model-native-tool-calling** — model-native planning path demonstrated | **untested** | mechanism | `e8b01dcec`-era two-case run | `j2_model_setup_20261013_072410_09737a.json` (+negative control `072627_fd2193`) | planner declined on the registered configuration; verdict open | same diagnostic as 18 |
| 20 | **J3.upload** — document uploaded through the product | verified | public API | `d6fbcd846`, 2026-10-12 | `journey_matrix/j3_source_connection_20261012_104208_fdca1f.json` | Oct-12 lineage; later campaigns uploaded on newer builds but not recorded as J3 re-verifications | fold re-check into Phase E |
| 21 | **J3.authorized-read** — authorized workspace retrieves it | verified | public API | same as 20 | same as 20 | same as 20 | Phase E |
| 22 | **J3.isolation** — another workspace cannot | verified | public API | same as 20 | same as 20 (second fresh user: zero results) | same as 20 | Phase E |
| 23 | **J4.source-bound** — fresh requests produce source-bound findings | verified (was failing) | public API | r18 lineage `33f54ba75`; re-pinned `d6bfe85f9`; local `llama3.1:8b` | `journey_matrix/j45_campaign_3a59f55ac_r18/summary.json` + `evidence_j4_r18_….json` (9 run JSONs archived in-repo 2026-10-17, `checksums.sha256`) | not re-run on `b644c2153` | registry recorded 2026-10-17; keep as regression (Phase E) |
| 24 | **J4.uncertainty** — uncertainty preserved when sources don't answer | verified | public API | same as 23 | same as 23 (T3 absent-Dunmore honest) | same as 23 | same as 23 |
| 25 | **J4.survives-reload** — results survive reload | verified | reload-readback (fresh durable-store re-read; no process restart in this evidence) | same as 23 | same as 23 (reload-agreement true) | same as 23 | same as 23 |
| 26 | **J5.binding** — calculation inputs bind to the record | verified | public API | same as 23 | same as 23 (175/225; conflict carried durably) | same as 23 | same as 23 |
| 27 | **J5.persist** — engine operation persists with verified evidence | verified (was failing) | public API | same as 23 | same as 23 (objective_met=true; expression_engine identifiers survive settlement) | same as 23 | same as 23 |
| 28 | **J5.readback-agreement** — reply agrees with the durable record | verified | reload-readback (fresh durable-store re-read; no process restart in this evidence) | same as 23 | same as 23 | same as 23 | same as 23 |
| 29 | **J6.authorized-once** — an authorized change lands exactly once | verified (counted) | public API | `c05cfd69b`, hybrid (ollama reply lane + mounted edit-plan credential) | `journey_matrix/j6_draft_c05cfd69b_r21/evidence_j6_draft_20261015_230732_78ddc5.json` (sha256 `5cb71f63…`) | named requirement persists only in prose/envelope (no structured field — disclosed); owner-held items (external-comparison routing, local-only gaps, findings-with-errors) | keep as regression; owner-held items tracked separately |
| 30 | **J6.protected-content** — protected content preserved | verified (counted) | public API | same as 29 | same as 29 (zero writes, byte-identical) | same as 29 | same as 29 |
| 31 | **J6.survives-reload** — survives reload | verified (counted) | reload-readback (fresh history + canvas reads; the same run restarted the process mid-way, but the read itself is not the restart test) | same as 29 | same as 29 (all_match=true) | same as 29 | same as 29 |
| 32 | **J7.truthful-handoff** — real job id/status on handoff | **untested** | — | — | — | background handoff requires a dispatched chat turn; never run as a fresh-install assertion | Phase E composed job (reload + interruption) (acceptance) |
| 33 | **J7.same-job-continuation** — same job continues | **untested** | — | — | — | same dependency as 32 | Phase E |
| 34 | **J7.durable-result** — result durable across restart | **untested** | — | — | — | privileged harnesses target older world layouts; not re-run | Phase E |
| 35 | **J8.plain-language-create** — plain-language request creates an executable workflow | **untested** | — | — | — | no fresh-install harness yet | bounded campaign (acceptance) |
| 36 | **J8.approval-rejection** — approval executes, rejection does not | **untested** | — | — | — | same as 35 | same as 35 |
| 37 | **J9.truthful-failure** — provider/source failure reported truthfully | **untested** | — | — | — | privileged FORCE_TURN_FAILURE case; not re-run fresh | Phase E |
| 38 | **J9.usable-after-failure** — UI/API stays usable after failure | **untested** | — | — | — | harness targets older layout | Phase E |
| 39 | **J9.recoverable** — eligible work remains recoverable | **untested** | — | — | — | unit pins only at journey level | Phase E |
| 40 | **R3 (focused slice)** — supply a missing value after restart; resume without repeating the request | verified (diagnostic, `counted=false`) | public API + restart (3 real restarts) | `853226d79`; narrow supply syntax + interpretation contract | `journey_matrix/r3_resume_missing_value_r21/evidence_r3_resume_20261016_115723_578116.json` (sha256 `f7aaac9c…`) | general NL answer interpretation resolves `unresolved` by contract; planner patch-quality variance open (not reopened) | keep as regression; rides the Phase E chain |
| 41 | **R4 (focused slice)** — interrupted-read recovery: re-render the saved result without re-reading | verified (scoped; `diagnostic_only=true`, `counted=false`) | public API + restart (observed SIGKILL) + configuration-parity | **`c1beb7c0b` / pin `2070147ee` — NOT the approved `c6dd2d0e5`** (provenance: `a45da2b78` + `2070147ee` + 7-attempt history) | `journey_matrix/r4_read_recovery_r21/evidence_r4_read_recovery_20261017_081610_2d2ca7.json` (sha256 `8f62e12d…`; 7-file campaign set archived in-repo 2026-10-17, `checksums.sha256`; `/tmp` originals retained) + preserved scratch world | not counted; counter is post-attempt instrumentation; worker-loop coverage limit; not fresh-install | integration decision separately authorized (Phase G) |
| 42 | **R4 (correctness follow-up)** — recovered render reports coverage/outcome truthfully | **failing** | public API + restart | same as 41 | attempt-7 JSON + persisted rows ("Coverage: 0/3 items matched"; `outcome=partial` on 3/3 delivered) | user-facing contradiction: durable coverage keys don't align with item labels | **one bounded repair + regression at the reconstruction boundary (implementation); tracked separately; R4 milestone not reopened** |
| 43 | **SPINE — composed user job** — draft-vs-approved-records revision, deliberate interruption, continuation, reload | **verified (supported workflow) — 3 named exclusions; DEPLOYED (rev 9)** | browser + public API + SIGKILL crash/restart + deployed smoke | run 4 `9c9e5c76e` (runtime `dad8f9fce` lineage); deployed `8c593e57031e`; runs 1–3 preserved | `journey_matrix/composed_job_20261017/` (4 run JSONs, harness, screenshots, CHECKSUMS); `journey_matrix/deployment_smoke_20261017_223948/`; protocol `63de9aa8e` | supported workflow PASSED (36/39); deployed smoke 6/6; **exclusions (not certified):** idempotent re-ask settlement, continuation settlement, their `no-failed-requests` aggregate | value evaluation (predeclared `18b0dc2a2`, running) → support statement; then two SEPARATE frozen slices (owner briefs): **re-ask** = trace why the recorded S6 request fails to produce/propagate the existing `canvas_decline_requirement_check`/`already_satisfied` receipt (anchors `chat_orchestrator.py:15112/15115/15133`, no new success override; checks bind subject/field/value/artifact/current revision; controls: applied→zero writes, reverted→not satisfied, wrong artifact→not satisfied, unrelated value→not satisfied, fresh reload consistent); **continuation** = fix interpretation, not vocabulary (capture S7's accepted interpretation/requirement/observations/outcome first; preserve structured meaning; no noun regex) |
| 44 | **SPINE — integrated L1+L2+L3 composed served workflow** (L3 sourced answer → L1 edit/no-op → L2 comparison/continuation → restart in one world) | **blocked — L3 required-read timeout fixed in the successor, but composed attempt 3 failed on S3 interpretation timeout + S7 settlement; NOT DEPLOYED (rev 23)** | predeclared served attempt on scratch world + restart | successor `2a113d1a3` (base `ddcc404dd`: L3 `6d662abff` + L1 `aaa1169d7` + L2 `c0cbea9f1` + main `e6308cb54`) | `journey_matrix/l1_l2_l3_integrated_served_20261020/` (attempt 3 result/summary/logs; `ATTEMPT3_RESULT.md`; `MUTATION_EVIDENCE_ATTEMPT3.md`; `CHECKSUMS_ATTEMPT3.sha256`); attempt 2: `journey_matrix/l1_l2_l3_integrated_served_20261019/` (`ATTEMPT2_LIMITATION.md`; `CHECKSUMS_ATTEMPT2.sha256`) | attempt 2 (historical): 40/58, first failure `l3_documents_receipt_missing`; the accepted `source_read` documents/fresh_read did not execute after planner `TimeoutError` (`tool planning skipped` → `tool plan executed: None`); **required document retrieval was not executed after tool-planning timeout; the integrated workflow remains unverified.** Attempt 3: 48/59, first failure `comparison_untruthful`; L3 pass under the same DeepSeek-direct configuration — optional planning timed out at 20.0 s, `documents.search:the launch code for project Zephyr-9` executed, verified complete receipt (`match_count=1`, `coverage=complete`) bound to execution + workspace, `objective_met=true`, settlement `completed`, `QUARTZ-77`/no decoy, fresh-history agreement; edit and identical re-ask pass. S3 interpretation cancelled after 64.9 s; 95.03 s turn returned the time-budget message with no comparison. S7 returned the correct typed date comparison with zero writes but settled `turn_failed_no_result` (`final_outcome=failed`), so restart history/execution agreement fails. `live_db_isolated=true` from actual store access: only pilot PID 81067 held the live DB/WAL, scratch PID tree held none, all stores scratch, row counts unchanged; the pilot-owned content hash change is an observation, not attributed. Whole-document comparison remains open; L2 parser work closed. | keep deployment held; no promotion; S3/S7 are separate open findings; do not switch configuration mid-workflow or shrink the workspace; do not introduce per-turn routing as a substitute for fixing them |

---

## Backlog, prioritized

**Tier 1 — what prevents a new user from completing the supported end-to-end job**

1. ~~**Fix first-run onboarding completion** (row 6 — failing, *registered*)~~ —
   **done 2026-10-17 (Phase C, reproduce-first)**: on `cca1fb13d` the Oct-12
   failure does **not** reproduce — one ordinary "Start Automating" click
   emitted exactly one authorized POST, persisted (`onboarding_completed=1`),
   the wizard closed, and reload + sign-out/sign-in did not reopen it; the
   labeled injected-500 scenario stayed visibly failed with no false
   completion and recovered on a second click; **no repair required**.
   Evidence `journey_matrix/browser_onboarding_completion_20261017_093641_af322b.json`
   (sha256 `657943f3…`; 13/13). Historical Oct-12 failure preserved
   (`browser_j2_chain_20261012_112631_9258b4.json`); its cause stays
   unestablished on this lineage. Owner: frontend + acceptance.
2. ~~**Prove pristine installation + the browser loop on a fresh install** (row 5 untested;
   rows 3–4 carry Oct-12 browser evidence). Quickstart on a clean venv/machine, then
   login → configure/connect → request → result/approval → reload in the browser.
   Owner: acceptance. *(Phase D; re-run and closed by Phase E — see rev 5:
   zero-intervention supported install + 25/25 local loop on `e207494af4c7`.)*~~
3. **Prove the remaining advertised stages** — J7 background/continuation (rows 32–34),
   J8 automation (35–36), J9 failure recovery (37–39), all untested; R3/R4 cover slices
   only. *(Composed job executed 2026-10-17 — row 43; setup/source/edit/crash-convergence/
   reload green; F-C2 settlement slice next, then bounded campaigns.)* Owner: acceptance.
4. **Close or re-scope model-native tool planning** (rows 18–19, untested) — one bounded
   diagnostic (tool-shaped ask + turn metadata capture) or a recorded re-scope decision.
   Owner: acceptance.

**Tier 2 — correctness**

5. **R4 coverage/outcome consistency** (row 42 — failing). One bounded repair + regression
   test at the shared reconstruction boundary (coverage keys vs item labels; outcome
   derivation from coverage). Owner: implementation. Separate from the R4 milestone.
6. ~~**Evidence durability housekeeping**~~ — **done 2026-10-17**: the r18 run JSONs
   (9) and the R4 campaign set (7) archived in-repo with `checksums.sha256`
   (sha256-verified against the `/tmp` originals; credential scans clean before
   archiving). Owner: acceptance.

**Tier 3 — recovery / durability**

7. **R4 successor integration** — `a45da2b78`/`2070147ee` are branch-only; any merge into
   main is a separately authorized process, followed by re-verification of affected
   journeys. Owner: owner directive. *(Phase G.)*
8. **Re-verification on the next unified acceptance candidate** — every row above binds
   to an older candidate; none may be promoted forward without a run on the candidate
   actually being shipped.

---

## Gate status (computed 2026-10-17 rev 5, after Phase E verified the unified candidate)

- `journey_contract.py --check --release` → **rc=0** — no failing journeys in
  release scope (J1–J3); `J1.quickstart-install` verified on `e207494af4c7`
  (Phase E, zero-intervention supported install + 25/25 local browser loop);
  `J1.signin` + `J1.onboarding-completion` re-bound to the same run.
- `journey_contract.py --check --strict --release` → **rc=1** — UNTESTED:
  J2 (`tool-planning`, `model-native-tool-calling`); untested items still
  block the strict gate.
- `journey_contract.py --check` (all journeys) → **rc=0** — no failing
  journeys anywhere; untested: J2, J7, J8, J9.

Journey-level registry state: **J3, J4, J5, J6 = VERIFIED; J1 = VERIFIED**
(6/6 — `quickstart-install` verified on `e207494af4c7`, Phase E); J2 = UNTESTED
(9/11 verified); J7, J8, J9 = UNTESTED.

Nothing in this document claims whole-app certification, pristine-install proof, or
deployment readiness.
