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
| 3 | **J1.signin** — sign in works (real login form + API session) | verified | browser + public API | `d6fbcd846` (browser chain carried from 2026-10-11) | parity JSON + `browser_j2_chain_20261012_112631_9258b4.json` | first-run onboarding completion is row 6 (verified on `cca1fb13d`, Phase C); this row's own chain keeps its Oct-12-era binding | carry into the unified-candidate browser re-run (Phase E) |
| 4 | **J1.workspace** — workspace created/used through the product | verified | public API | `d6fbcd846` | parity JSON | not re-run on any later lineage | Phase D/E |
| 5 | **J1.quickstart-install** — clean install from scratch (venv, deps, generated env) | **untested** | mechanism partial (env gen + boot proven) | `d6fbcd846`-era | contract note (deliberate) | clean dependency installation never exercised | Phase D: quickstart on fresh venv/machine (acceptance) |
| 6 | **J1.onboarding-completion** *(registered 2026-10-17)* — "Start Automating" persists, wizard closes, reload/sign-in does not reopen | **verified** | browser | `cca1fb13d` (clean worktree tree `4e8329d4…`), fresh product-created user + fresh browser context, scratch boot, local Ollama; harness sha256 `43c1dc43…` | `journey_matrix/browser_onboarding_completion_20261017_093641_af322b.json` (sha256 `657943f3…`; 13/13 checks, `first_failed_transition=null`) | Oct-12 failure does not reproduce (reproduce-first outcome; no repair required); historical failure preserved in `browser_j2_chain_20261012_112631_9258b4.json`, cause unestablished on this lineage | none — Phase C closed; clean-state install carries with row 5 (Phase D) |
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
2. **Prove pristine installation + the browser loop on a fresh install** (row 5 untested;
   rows 3–4 carry Oct-12 browser evidence). Quickstart on a clean venv/machine, then
   login → configure/connect → request → result/approval → reload in the browser.
   Owner: acceptance. *(Phase D.)*
3. **Prove the remaining advertised stages** — J7 background/continuation (rows 32–34),
   J8 automation (35–36), J9 failure recovery (37–39), all untested; R3/R4 cover slices
   only. Phase E composed job (reload + interruption) first, then bounded campaigns.
   Owner: acceptance.
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

## Gate status (computed 2026-10-17 rev 3, after Phase C verified row 6)

- `journey_contract.py --check --release` → **rc=0** — no failing journeys in
  release scope (J1–J3); `J1.onboarding-completion` verified on `cca1fb13d`
  (Phase C). The setup gate is green again in release scope.
- `journey_contract.py --check --strict --release` → **rc=1** — UNTESTED:
  J1 (`quickstart-install`), J2 (`tool-planning`,
  `model-native-tool-calling`); untested items still block the strict gate.
- `journey_contract.py --check` (all journeys) → **rc=0** — no failing
  journeys anywhere; untested: J1 (`quickstart-install`), J2 (2 items),
  J7, J8, J9.

Journey-level registry state: **J3, J4, J5, J6 = VERIFIED; J1 = UNTESTED**
(5/6 verified — only `quickstart-install` untested); J2 = UNTESTED (9/11
verified); J7, J8, J9 = UNTESTED.

Nothing in this document claims whole-app certification, pristine-install proof, or
deployment readiness.
