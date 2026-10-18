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
| 43 | **SPINE — composed user job** — draft-vs-approved-records revision, deliberate interruption, continuation, reload | **verified (supported workflow) — 3 named exclusions** | browser + public API + SIGKILL crash/restart | run 4 `9c9e5c76e` (runtime `dad8f9fce` lineage); runs 1–3 preserved | `journey_matrix/composed_job_20261017/` (4 run JSONs, harness, screenshots, CHECKSUMS); protocol `63de9aa8e` | supported workflow PASSED (36/39): setup/provider/upload/sourced answer (`partial`, truthful)/edit exactly-once/calculation `completed`/crash convergence/reload; **exclusions (not certified):** idempotent re-ask settlement (named follow-up w/ exact criterion), continuation settlement (source-noun exclusion), their `no-failed-requests` aggregate | pilot deployment (controlled restart + identity + beyond-navigation smoke); re-ask follow-up as next bounded slice |

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
