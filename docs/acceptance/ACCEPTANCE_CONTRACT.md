# Acceptance Contract — Atom core workflows

**Established 2026-10-11** (owner directive: shift from Brennan-repair
campaign to product acceptance program; Brennan becomes one regression
case, not the definition of product success).

## What this contract measures

**Whether a new user can complete the advertised journeys on a fresh
installation without coding-agent intervention.** Not repair counts, not
test counts. The README promises plain-language workflow creation,
governed execution, BYOK/local models, persistence and verified outcomes;
each promise is accepted only when its journey passes at a boundary the
user actually touches.

## Standing rules

1. **Fresh install, fresh workspace, every campaign.** Journeys run
   against an installation produced by `scripts/quickstart.sh` and a
   workspace created through the product — not the long-lived dev world
   with its accumulated agents, lessons, connectors and canvases.
   Privileged-world runs (the `orchestration_acceptance` harness against
   a seeded fixture) demonstrate *capability*; they never *accept* a
   journey.
2. **Public user boundary only.** An assertion is proven at the UI or the
   public HTTP API — the same surface a browser gets (`POST
   /api/chat/message` with a client-minted request id, `POST
   /api/auth/login`, the canvas/read endpoints). ORM reads against the
   live DB are forbidden (sqlite read-only SELECTs for verification
   only, per `acceptance_trial_lib.py` conventions). A unit test passing
   is not a journey passing.
3. **Status vocabulary.** Every assertion is `verified`, `failing`, or
   `untested`, each with an evidence pointer (results JSON in
   `backend/scripts/orchestration_acceptance/journey_matrix/`, commit,
   and how it was reproduced). Untested claims stay advertised as
   unverified; a failing claim gets an owner and a bounded repair.
4. **One immutable acceptance candidate per campaign.** One production
   owner; record the commit + working-diff identity at campaign start
   (pattern: `notes/WORK_CONTRACT_20261010.md`); no mid-candidate
   changes. One implementation agent edits shared runtime; one
   independent verifier re-proves from a snapshot in its own worktree.
5. **Shared execution contracts absorb fixes.** Repairs must consume the
   existing job / action / claim / receipt / outcome mechanisms. When
   two paths diverge (caller vs worker vs recovery), repair the shared
   boundary — never copy an implementation into chat.
6. **Earliest shared dependency first.** Fix the earliest dependency
   blocking multiple journeys before domain-specific behavior
   (worked example: the 2026-10-11 fresh-install configuration gap —
   quickstart generated an env that silently disabled the entire
   finalized-execution contract every harness had been arming for
   itself).
7. **Capability vs regression.** Capability tests ask what the system
   can do (fresh world, new inputs). Regression tests ask what it must
   keep doing (Brennan teaching/source-authority/research-to-draft
   lineage lives here now). A green regression suite accepts nothing.
8. **Small gating browser suite before broad gating.** Login →
   configure/connect → request → result/approval → reload, stabilized in
   its own environment; the full existing browser suite stays
   non-gating until that core loop is trusted.

## The journeys

Evidence lives in `journey_matrix/`. Registry + runner:
`backend/scripts/orchestration_acceptance/journey_contract.py`
(`--list`, `--record`, `--check`).

| ID | Journey | What must actually work |
|----|---------|--------------------------|
| J1 | Fresh setup | Install via quickstart, start, sign in, create workspace; required configuration is **effective** in the running server (not merely present) |
| J2 | Model setup | Add one BYOK provider or local inference through the product; a real reply comes back; tool planning selects a tool for a tool-shaped ask |
| J3 | Source connection | Connect/ingest one source through the product; the authorized workspace can retrieve it; **another workspace cannot** |
| J4 | Research | A fresh request produces source-bound findings; uncertainty is preserved when sources don't answer; results survive reload |
| J5 | Calculation | Inputs bind to the record; the engine operation persists; the reply agrees with the durable record |
| J6 | Drafting | An explicitly authorized change lands exactly once; protected content is preserved; survives reload |
| J7 | Background work | Truthful handoff (real job id/status); same-job continuation; no repeated completed work; result durable across restart |
| J8 | Workflow automation | A plain-language request creates an executable workflow; approval executes, rejection does not; the record matches what ran |
| J9 | Failure recovery | Provider/source failure is reported truthfully; UI/API stays usable; eligible work remains recoverable |

### First wave scope (do not run every integration yet)

Prove the journeys with a small representative set: **one document
source** (upload or file ingest), **one business-record connector**, and
**one controlled outbound destination**. A connector being *registered*
is not proof that its user workflow works. Extend the same contract to
the advertised connector set only after the first wave holds.

## Current status (2026-10-11, campaign round 3 — first wave J1–J3)

| Journey | Status | Evidence |
|---------|--------|----------|
| J1 | **4/5 verified, now on PRISTINE coverage** — gates effective + lifecycle operation + boot + sign-in + workspace all pass on a git-archive CODE EXPORT (no developer `.env`, data/, logs/ excluded by construction and asserted) with an ALLOWLISTED process environment; clean-state venv creation `untested` | `journey_matrix/parity_pristine_20261011_195843_037677.json` |
| J2 | **3/5 verified, 1 FAILING (root-caused, handed to Agent 2), 1 blocked** — BYOK product path + restart persistence + local-provider registration pass (checkout smoke); **real-reply FAILING**: the chat leg never sees workspace/tenant-scoped providers | `journey_matrix/j2_model_setup_*.json`; root cause + bounded patch sketch in `journey_status.json` record `J2.real-reply` and the coordination log HANDOFF |
| J3 | **3/3 verified, PRISTINE** — upload, authorized read, cross-workspace denial all pass on the code export | `journey_matrix/j3_source_connection_20261011_195910_2d0501.json` (pristine), `..._192442_*.json` (checkout smoke) |

**Modes.** `configuration_parity_plus_public_api_smoke` = dirty-checkout
boot (honest label: developer `.env` loads unconditionally). 
`pristine_code_export` = app runs from a `git archive` export of the
pinned revision with an allowlisted environment (PATH/HOME/locale/tmp +
generated config + scratch overrides only). Only pristine runs may back
pristine-install claims; smoke runs remain recorded as supporting
evidence. J2's pristine rerun is ready (Ollama needs no credentials) and
runs the moment the chat-leg repair lands.

**Release gate** (`journey_contract.py --check --strict --release`): currently
**FAILING — J2** is the bounded repair blocking the first-wave release.

### Product defects this contract has found (all boundary-proven)

1. **Fresh-install config gap** (fixed 2026-10-11): quickstart generated an
   env missing the three `=="1"`-gated execution flags every harness armed
   for itself. `fresh_install_parity.py` now gates it permanently.
2. **BYOK key store broken on fresh installs** (fixed): quickstart's
   `token_urlsafe(32)` secret is 43 chars; Fernet rejects it, so every
   Settings→AI store call 404'd. Fixed in quickstart; parity probe rejects
   malformed keys.
3. **Cross-workspace document leak** (fixed): register never populated the
   `user_workspaces` association, so every registered user's documents
   landed in the shared `default_shared` store — any registered user could
   read any other's uploads. Fixed at registration + FK-first resolution
   at the upload/search boundary. (Found by J3 run 1; before/after runs
   recorded.)
4. **Manual uploads unsearchable** (fixed): the LanceDB row carried
   `freshness_status=None` while search filters `== 'fresh'` — invisible
   on any table carrying the column. Upload now stamps 'fresh' (aligned
   with its own PG mirror).
5. **Workspace-scoped providers invisible to chat** (OPEN — owner repair
   needed in `chat_orchestrator.py`, which carries uncommitted peer work):
   `ChatOrchestrator.__init__` builds `LLMService` without `workspace_id`;
   the handler then looks under literal `"default"` and finds nothing a
   real user registered. Chat returns `no_llm_provider` for every real
   tenant/workspace. Bounded fix recorded in the `J2.real-reply` registry
   record. Also flagged: `ATOM_LOCAL_ONLY=true` does not pin routing while
   a BYOK key is stored, and `GET /api/ai/providers/{id}/keys/{name}`
   cannot see tenant-scoped keys (evidence recorded, not asserted).

Harness-isolation defects found by the campaign's own runs (fixed in
`journey_runtime.py`, each with a live observation recorded in the code):
dotenv refills scrubbed provider credentials (now pinned empty), the BYOK
vault anchors to `backend/data` regardless of `ATOM_DATA_DIR` (now
overridden), and `LANCEDB_URI` was never redirected (scratch worlds were
writing the dev's memory store — dev-store rows/dirs from this session
were surgically removed; backup in `/tmp/byok_keys_backup_20261011.json`).

**The J1 finding this contract opens with:** `scripts/quickstart.sh`
generated an environment without `ATOM_TASK_LIFECYCLE_ENABLED`,
`CHAT_FINALIZATION_M1` and `CHAT_FINALIZATION_M2` — all three are
`== "1"`-gated (`chat_orchestrator.py::_task_lifecycle_for`,
`chat_orchestrator.py` M1 sites, `chat_routes.py` M1/M2 readers) and all
three were armed by every acceptance harness for itself
(`preview_stack.server_env`, `preview_server`,
`live_integration_acceptance`). Every harness therefore passed against a
configuration no fresh user ever received. Fixed 2026-10-11; the parity
probe (`fresh_install_parity.py`) now gates it.

**Probe hygiene notes** (for whoever extends it): the boot stage pins
`ADMIN_PASSWORD` so the scratch world never reads or writes the repo's
shared `backend/logs/*password*` files, and redirects `DATABASE_URL` /
`ATOM_DATA_DIR` to temp dirs — a probe must never touch
`backend/data/atom.db` or `atom_dev.db`. Because `main_api_app.py:37`
loads the repo's own `backend/.env` unconditionally, a boot in a dirty
checkout cannot be perfectly pristine; gate keys are pinned in the child
env to force the fresh-install outcome (documented limitation — a fully
pristine boot belongs to the run_isolated code-export world, which
excludes `.env`).

## References

- Anthropic, *Demystifying evals for AI agents* — evaluate actual
  outcomes, the full execution path, and multi-turn behavior; separate
  capability from regression.
- Google SRE Workbook, *Implementing SLOs* — reliability targets follow
  user journeys, not internal component health.
