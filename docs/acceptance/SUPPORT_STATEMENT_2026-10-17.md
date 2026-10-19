# Support statement — Atom pilot release (2026-10-17)

**What this is.** The scoped release description for the current pilot: what
is supported, on which tested configuration, with which measured numbers,
and with which limitations left visible. README ambition is deliberately
distinct from this statement; earlier dated statuses are historical and are
reconciled by the evidence cited here.

## 1. Supported jobs (tested)

1. **Install & run** — the documented quickstart on a supported interpreter
   (manual venv, Python 3.11–3.13): zero-intervention install on the tested
   path; the host-default 3.14 is **refused up front** with the
   supported-range message (F1 fix; the original dead-end failure is
   preserved in the Phase D archive).
2. **First-run setup** — sign-in and onboarding wizard **Card A (local
   runtime)**: one store POST, canonical identity, the provider activates
   with **no Settings re-save**, and completion persists (no wizard after
   reload). Effective on the deployed app (`provider-active-via-ui`, 3/3
   during the evaluation).
3. **Document source** — upload a text document through the Documents UI;
   the authorized workspace retrieves it (workspace-scoped store; J3
   isolation evidence; verified live in the deployment smoke and the
   evaluation).
4. **Source-backed answers** — ask from chat; answers are drawn from the
   uploaded document and attributed (content correct in 3/3 evaluation
   repetitions; "QUARTZ-77 … found in your uploaded file"). **Saved-status
   limitation:** the turn's recorded status is validated only when the
   documents-search lane is chosen — see L3.
5. **Authorized draft edits** — edit a draft canvas with an explicit
   authorization: applied **exactly once**, authoritative readback, exactly
   +1 audit row, reply truthful (3/3 on the deployed pilot; journey
   exactly-once and recovery evidence).
6. **Calculation (structured ask)** — the J5 shape
   (`calculate expression QTY * UNIT_PRICE with QTY=2 UNIT_PRICE=48000`)
   produces a formula-engine result with evidence (`calc:result_id`;
   `outcome=completed`).
7. **Recovery after interruption** — deliberate crash mid-edit, restart,
   and convergence to exactly one change (no duplicates) with reload
   readback (all invariants; runs 1–4).
8. **Compare-without-writing** — a draft-vs-source comparison delivers the
   result with **zero writes** and, when the comparison result is not
   recorded, the saved status is truthfully `partial` with the gap named
   (never a false completion).

## 2. Tested configuration (exact)

- **Candidate**: runtime lineage `dad8f9fce` (composed journey runs 3–4);
  **deployed pilot `8c593e57031e`** — backend `:8001`, pilot frontend
  `:3000`; `journey_matrix/deployment_smoke_20261017_223948/`.
- **Install profile** (fresh venv, this host): Python 3.11.16;
  cryptography 48.0.1 (wheel path), pyarrow 25.0.1 (<26 bound, numpy
  1.26.4), lancedb 0.24.3; frontend `next` from the checkout. Supported
  interpreter range enforced 3.11–3.13.
- **Model profile**: local **ollama `llama3.1:8b`** registered through the
  wizard (the wizard-registered local runtime is the tested local path);
  the deployed world's cloud route (opencode-go, operator key) serves as
  routed for planning/replies — cloud *answer-leg* claims are bound to the
  run-7 cloud evidence and canvas run-4; the tested drafting configuration
  in the journey used a `deepseek/deepseek-v4-pro` edit-plan pin
  (disclosed; edit planning only).
- **Hardware/OS**: this dev host only (no clean-machine or other-OS proof).

## 3. Measured numbers (deployed pilot)

| step | measured |
|---|---|
| fresh user → complete job (set-up + upload + answer + draft edit) | **median 130 s** (151.8 / 130.2 / 116.4) |
| sign-in | 3.3 s |
| onboarding wizard | 34.2 s |
| document upload | 4.1 s |
| sourced answer | 48–82 s |
| draft edit + readback + audit | ~21 s |
| structured calculation (run 4) | ~33 s |
| user actions required per job | **5** (sign-up, wizard, upload, ask, edit-ask); **0 forced extras**; no clarifications, no retries (3/3) |

## 4. Experimental, unavailable, or untested (visible)

- **L1 — idempotent re-ask**: the **deployed pilot (`8c593e57031e`)**
  still declines truthfully without settling as an "Already applied"
  completion. The mechanism is now **verified through the served API on
  successor `aaa1169d7`** (pin-gate scope repair) in a declared isolated
  configuration (Go planning route `opencode-go/deepseek-v4-pro`):
  original S6 re-ask → structured no-op receipt
  (`noop=true`/`noop_reason=already_satisfied`), receipt-derived
  confirmation, zero added writes, `outcome=completed`/`success=true`,
  explicit non-null agreement after fresh history reload — evidence
  `journey_matrix/l1_s6_successor_served_20261018/`, matrix rev 11.
  Deployment to the pilot remains a separate integration step, and this
  pilot limitation stands until the successor is integrated and
  re-verified there.
- **L2 — continuation ask**: "does it still match the approved record?"
  is answered correctly, but the requirement is **not yet certified with a
  resolved source identity** in the served product. Attempt 1 on
  **`a6cd2c8ba`** (2026-10-19, predeclared isolated configuration)
  captured the requirement (`required=true`) but the real interpreter
  proposed annotated source descriptions and the owner-approved composer
  preserved the identity as `unresolved` (no substring donation). The
  bounded **producer correction** on `51628b925` (schema/prompt exact
  identities; structured `SOURCE REFERENCES` separating observed evidence,
  requested sources and the attached artifact; supported source kinds;
  composer untouched; L2 battery 41 passed, neighbors 277 passed + 2
  pre-existing) has **not** been verified in the served product: attempt 2
  (same predeclared job, fresh port/world) failed at the interpretation
  gate — both interpretation calls timed out at the 12 s bound, so the
  producer correction was never exercised, the S7 requirement stayed
  uncaptured (`required=false`), and the fallback reply lane returned a
  wrong approved date in S3 and settled S7 `unconfirmed`; zero writes and
  draft unchanged held. The live-DB guard also flagged a change during the
  attempt-2 window (external pilot activity expected; the attempt used
  only scratch stores). L2 remains open; **no promotion**. Evidence:
  `journey_matrix/l2_continuation_served_20261019/` (attempt 1 record +
  `README_ATTEMPT2.md`/`summary_attempt2.json`/`CHECKSUMS_ATTEMPT2`).
  A further served run, an interpretation-timeout change, or a model
  change is an owner decision; not deployed to the pilot.
- **L3 — sourced-answer saved status is planner-dependent**: on the
  deployed pilot (`8c593e57031e`) the `memory` lane was chosen in 2/3
  evaluation repetitions (no verifiable evidence ⇒ failed/unconfirmed)
  while the answer content was correct; with `documents.search` (1/3) the
  status validated. The repair is now **verified through the served API
  on candidate `6d662abff`** (requirement-driven tool eligibility;
  parent `aaa1169d7`) in a predeclared isolated configuration (pilot
  cloud route, one authorized operator credential registered through the
  product, local fastembed embeddings, scratch stores): the original
  Zephyr-9 ask — fixture uploaded through the product, real cloud
  planning — executed `documents.search` with a verified complete receipt
  (`match_count=1`, `coverage=complete`), `objective_met=true`,
  `success=true`, `outcome=completed`, the answer carrying `QUARTZ-77`
  from the uploaded file, and explicit non-null agreement after a fresh
  history reload — evidence
  `journey_matrix/l3_document_evidence_served_20261018/`, matrix rev 12.
  Deployment to the pilot remains a separate integration step, and this
  pilot limitation stands until the candidate is integrated and
  re-verified there.
- **Untested**: J7 background handoff beyond the tested slices, J8
  automation, J9 broad failure recovery; integrations beyond the one
  document source; other OSes/hardware; R4 coverage/outcome follow-up
  (row 42) open; J2 tool-planning/model-native items untested.
- Local-only operation: claims remain bound to the local-only runs
  (Phase E, 25/25); the deployed pilot is a standard world as configured.

## 5. Deployment identity & rollback

- Served: `8c593e57031e` (single instance; scoped controlled restart; two
  gzip-verified pre-restart DB snapshots, `backend/data/backups/`).
  Off-machine copy: **N/A on this host** (local-only layout — stated).
- Deviation: `scripts/restart_backend.sh` kills every uvicorn; the restart
  was scoped to `:8001` because 38 other instances (other streams' worlds)
  were running.
- **Rollback**: same scoped procedure started from the previous served
  commit's worktree (`df72807b84a1`); snapshots retained; pilot frontend
  `pkill -f 'next dev -p 3000'`.

## 6. Value and remaining user effort

For the supported job: the user performs 5 interactions, waits ≈ 2 minutes
total, receives a source-attributed answer and an audit-verified saved
edit; review and authorization remain with the user (verify the answer,
approve the change). Remaining friction is the three named limitations
above — none of them silently certified.

## Evidence index

- Composed journey (spine): `journey_matrix/composed_job_20261017/` (runs
  1–4; protocol `63de9aa8e`; run-4 = 36/39, supported workflow passed,
  3 named exclusions).
- Deployment smoke: `journey_matrix/deployment_smoke_20261017_223948/`
  (6/6; all attempts preserved).
- Repeatability/value evaluation:
  `journey_matrix/repeatability_20261017_224802/` (protocol `18b0dc2a2`;
  README carries F-R1/F-R2).
- Install/fresh-install: `journey_matrix/phase_d_fresh_install/`,
  `phase_e_candidate/` (F1–F3 findings preserved).
- Registry/matrix: `journey_status.json`,
  `docs/acceptance/READINESS_MATRIX_2026-10-17.md` (rev 10).
