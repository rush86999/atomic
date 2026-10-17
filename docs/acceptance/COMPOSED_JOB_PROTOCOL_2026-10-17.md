# Composed user job (product spine) — predeclared protocol (2026-10-17)

**Status: PREDECLARED — committed BEFORE any run.** This document defines the
composed user job acceptance slice and its assertions. It is committed ahead
of the run; the run JSON records this file's sha and the frozen candidate.

**Authority.** Product-completion owner mandate §15 Phase E ("run the composed
user job, including reload and deliberate interruption"); readiness matrix
Tier-1 #3 ("Phase E composed job (reload + interruption) first"); J6 r21
close-out ("background continuation/restart and failure recovery — next per
the standing directive").

## Candidate and world

- **Candidate (frozen): `/Users/rushiparikh/projects/atom → e207494af4c7de5f4b2ef85618c7eced64c18162` ("fix(retrieval): the hybrid search carries bounded body text for the tool lane").** This is the unified candidate that contains the F4/F5/F6 repairs, the installer fixes, the retrieval-scope repairs, the J6 counted lineage (`c05cfd69b` merged via `3efe6bcbd`), R3 (`853226d79`), the J4/J5 r18 lineage (`d6bfe85f9`), and the local-only provider guard (`02568191b`). `origin/main` HEAD `16c32cef0` is the acceptance-only commit on top of it (archive/registry/matrix docs) — runtime-identical.
- **Frozen checkout:** the existing `phase-e-candidate` worktree at `e207494af4c7` (clean tracked state; the prior phase's untracked `evidence/` retained). SHA guard runs before anything.
- **Fresh scratch world:** `JR.ScratchServer("composed", allowlisted=True, preferred_port=18500, …)` — generated quickstart env, credentials scrubbed (`CREDENTIAL_ENV_NAMES` pinned empty), isolated DB / LanceDB / BYOK vault per world. Worktree-configuration-parity mode (candidate code + its installed venv; not a pristine code export).
- **Frontend:** candidate worktree `next dev` on port 18501, `NEXT_PUBLIC_API_URL` pinned to the scratch backend, `NEXTAUTH_URL` pinned to 18501.
- **Ports 18500/18501 only**; the phase-e world's 18300/18301 are stopped and not reused.

## Configuration (disclosed — hybrid, owner-approved precedent)

- **Reply lane:** product-registered local **ollama `llama3.1:8b`**, configured through the onboarding wizard (Card A) as a fresh user. No Settings re-save.
- **Edit-plan pin:** the canvas-edit-plan structured call is pinned to **`deepseek/deepseek-v4-pro`** via `ATOM_ASYNC_EDIT_PLAN_MODEL` (J6 r21 measured rung; scope: that structured call only). The credential is mounted through the product (`POST /api/ai/providers/deepseek/keys` — the exact call Settings→AI sends), read-only from the dev BYOK vault; **no inherited env key**.
- **`ATOM_LOCAL_ONLY=false` (NOT a local-only run).** Under local-only the product *blocks* cloud dispatches including pins by design (`test_local_only_llm_guard.py`); the hybrid mode matches the counted J6 r21 configuration and is disclosed everywhere. A local-only replay is out of scope for this slice.

## Scenario — "compare a draft with approved source records and prepare an authorized revision"

One coherent job crossing the product boundaries (mandate §4 example 2), in the
browser, on the frozen candidate:

- **S0 — preflight.** SHA guard (checkout HEAD == candidate; tracked dirt empty). Ports free. Pin-credential preflight (vault entry decrypts + live provider probe recorded as a status boolean only). Ollama model present.
- **S1 — setup (browser).** Fresh product-registered user signs in; onboarding wizard Card A (Enable Ollama) stores the canonical identity; "Start Automating" completes; reload shows no wizard; provider `ollama` active with exactly **one** wizard store POST (no Settings→AI re-save). *(F4 regression on the unified candidate.)*
- **S2 — connect source + seed draft.** Upload "Approved Records — Quotation Q-2026-114" through the **Documents UI** (approved Valid Until `2026-12-31`; approved unit price `$48,000.00`; payment terms `Net 30`). Seed the **draft** canvas quotation through the product API (J6 r21 canvas shape: draft Valid until `2026-11-30` — the discrepancy the user will resolve). Mount the pin credential (above).
- **S3 — investigate (browser, canvas page).** Ask to compare the draft against the approved records and flag differences. Expect: the Valid Until mismatch identified (`2026-12-31` approved vs `2026-11-30` draft); **zero canvas writes** (audit delta 0); no claim of a change.
- **S4 — decision + authorized edit (browser).** Explicit authorization: update the draft's Valid Until to match the approved record. Expect: exactly **ONE** applied change; authoritative readback (`GET /api/canvas/{id}`) shows `2026-12-31`; audit delta **+1**; reply truthful; protected content intact.
- **S5 — calculate (browser).** "If we order two units at the approved unit price, what's the total before tax?" Expect: `96,000` (or the honest equivalent on the `$48,000` basis); zero writes. Max ONE predeclared re-phrase on a non-answer (recorded; first attempt preserved).
- **S6 — deliberate interruption (crash injection).** A second authorized change ("also update the payment terms to Net 45") is submitted from the canvas page. Once the turn is **durably accepted** (its user message persisted in the scratch DB), the backend is **SIGKILLed while the turn is in flight**; the backend is restarted (same world/DB); the browser is reloaded and the state recorded. Invariants: the terms-change count after restart is **0 or 1** (disjunction recorded honestly); the re-sent instruction converges to **exactly ONE** total terms change; S4's Valid Until change remains **exactly once** and intact; no false claim and no corrupt canvas at any point.
- **S7 — continue without repeating (browser).** After the restart, a follow-up that depends on the earlier work ("What is the current Valid Until on the draft, and does it match the approved record?") is answered from durable state with **no re-execution** of completed work (zero new writes; audit delta 0 for the turn; no reconstructed-context demand). Final reload: canvas content, chat history, and audit agree.

**Assertion discipline.** Assertions are recorded as boolean checks grouped by stage, plus a failed-request count (any non-200 / `success!=true` turn). The crash leg records the disjunction + convergence pair. Non-answer re-phrase (S5) and crash-timing fields are recorded as facts, not pass/fail gates. Failures, if any, are preserved and reported; the run is not retried to green.

## Evidence and archive

- Run JSON (credential-scrubbed; no key material recorded) + harness sha256 + server log tail + screenshots, in the worktree `evidence/composed_job/`.
- On completion, archived to `backend/scripts/orchestration_acceptance/journey_matrix/composed_job_e207494af/` (run JSON, harness copy, README, CHECKSUMS) and cited in the readiness matrix and contract. Registry: cited as the composed acceptance story; not a new journey ID unless the record tool supports one.

## Not claimed by this slice

- No cloud *reply-lane* claim (reply lane is local ollama; the cloud answer leg stays unpromoted per Phase E) and no local-only claim (hybrid disclosed).
- J7 background-handoff (real job id/status) and J8 automation are NOT covered; J9 is covered only to the extent the crash leg exercises a truthful, recoverable interruption.
- Not a fresh-install claim (reuses the installed candidate venv); not a replacement for the per-journey rows (J1–J6) — it composes them on one candidate.
