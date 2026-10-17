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
| J1 | Fresh setup | Install via quickstart, start, sign in, create workspace; required configuration is **effective** in the running server (not merely present); the first-run onboarding wizard **completes and persists** (an ordinary "Start Automating" click; reload/sign-in does not reopen it) |
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

## Current status (2026-10-12, round 10 — J2 verdict split: the first-reply scope blocker is closed; the unsupported tool claim is the blocker)

**Two pristine runs, bound to their candidates** (git-archive code export + allowlisted env +
per-world scratch SQLite/LanceDB/BYOK + product-created users; the JSONs are imported with
candidate-bound names so `527ad61bb` and `3f79345be` can never be conflated):

| Run | Candidate | Counted FIRST authenticated `/api/chat/message` | Preserved evidence |
|-----|-----------|--------------------------------------------------|--------------------|
| r1 | `527ad61bb` (exact) | **REFUSED** `no_llm_provider` (HTTP 200, `success=false`, "You need an AI provider…") — public-route scope failure, explicitly NOT cache-replacement (world B key store/decrypt/restart passed) | `journey_matrix/j2_model_setup_20261012_124316_1d68e5_cand527ad61bb.json` (sha256 e9fcaa09…3cba) |
| r2 | `3f79345be` (= `527ad61bb` + public-route scope repair) | **SERVED** by the user's own registered route: `provider=local_664cd774`, `model=llama3.1:8b`, reply `PONG`; provider row workspace-bound (`434f814f…`), execution under the same workspace, routing feedback `route_provider=local_664cd774`, request record `completed` | `journey_matrix/j2_model_setup_20261012_145647_16695b_cand3f79345be.json` (sha256 3a219451…e5c5) |

**The first-reply scope blocker is CLOSED on `3f79345be`** (the authenticated route carries
the correct scope end to end at the counted first request). J2 as a whole is NOT closed:

- `J2.tool-planning` is **not verified**. The tool-shaped ask exceeded the 300 s client
  window by ~11 s (client gave up at 18:56:16; the server completed at 18:56:27,
  `latency_s=310.93`). The persisted turn carries **no executed lookup**: `tool_outcomes: []`,
  a converse-only action program, no tool markers — while the reply asserts Zoho CRM /
  Google Drive searches with figures the platform's own heuristic flagged
  `unsupported_figures`. A reply claiming executed searches that never ran is a PRODUCT
  CORRECTNESS failure, not merely an acceptance gap.
- `J2.survive-restart` (world A) and the second reply were not exercised (the run aborted on
  the timeout); world B's BYOK restart passed.
- No singleflight refusal occurred in this run (the inflight arm released normally); the one
  failed user request is the over-window tool turn — counted, not excluded.
- Residual scope leak, kept DISTINCT from the fixed reply legs and from the proven
  cache-replacement defect: the turn-fact sidecar is constructed with hardcoded
  `workspace_id="default"` / `tenant_id=self.tenant_id` (`chat_orchestrator.py:13147-13153`)
  and still logged the `no_llm_provider` refusal as a parse failure (r1 and r2 tails).

**Harness-integrity defects this round found and repaired (acceptance owner, this commit):**
a vacuous top-level `pass:true` (a world exception omits its assertion block, so the aggregate
passed on world B alone — same shape in r1 and r2); substring tool-evidence checks that fire
on the prompt's own echo; and evidence that lost the archived commit (`git_commit: unknown`),
the config digest and the scratch-storage paths. The repaired harness: strict aggregate (every
mandatory assertion must be an explicit True; exception/timeout/missing = failed/untested),
attributable tool receipts read from `agent_executions.task_outcome.tool_outcomes`, embedded
source commit (captured before `git archive`), configuration digest and actual scratch paths,
and separate records for a failed client window vs. a later server delivery.
`backend/tests/test_acceptance_harness_integrity.py` pins each guard.

### Round-10 assignments (bounded)

**1. Acceptance owner — harness repair (done in this commit).** Aggregate PASS requires every
mandatory world and assertion to finish successfully; exceptions, timeouts and missing
results fail or remain untested; attributable tool-execution records and receipts replace
substrings; the archived commit, config digest and actual scratch-storage paths are embedded
in every evidence file; client-window failure and later server delivery are preserved
separately. **J2 is NOT recorded verified; restart and second-reply assertions remain
unexercised in the record.**

**2. Runtime owner — the unsupported search claim (product correctness; priority).**
Reproduce the exact tool-shaped request with controlled external responses and trace:
(1) accepted intent and required actions, (2) proposed tool plan, (3) authorization and
executable route selection, (4) actual tool dispatch, (5) receipt, settlement and final
narration. Repair the FIRST missing execution transition. Independently require that a turn
with no executed lookup cannot claim it searched; if execution is unavailable, return a
truthful unresolved or failed outcome. **Do not merely widen the 300-second window**: first
establish where the 310.93 s went and why no tool ran; preserve the existing latency verdict
(any revised performance target must be explicit and separately measured).

**3. Separate scope correction — turn-fact sidecar.** Remove the hardcoded default scope
through the existing authenticated-context mechanism (`_request_llm_scope`, `3f79345be`).
Require correct-workspace access and zero cross-workspace calls. Do not assume this sidecar
caused the missing tool execution without a trace establishing that connection.

**Sequence (owner-set):** harness repair → runtime trace/repair → sidecar correction →
verifier reviews the combined successor → acceptance runs pristine J2 with the FIRST request
counted (real reply + attributable supported tool execution + restart durability) → J4/J5
only when those assertions pass. The immediate finish line is truthful, executed tool use —
not a longer timeout and not a green top-level JSON flag.

**Verifier mandate (owner-set; `f5a174c26` frozen until this review completes).** Review the
harness commit plus the ONE combined successor (committed runtime + sidecar repairs —
uncommitted `request_scope.py` / subject-admission work cannot support certification).
Independently check, falsifying from the rerun evidence where possible:

1. Tool receipts belong to the CURRENT request's linked executions, not earlier work in the
   session (`journey_runtime.turn_tool_receipts` / `execution_tool_receipts`: confirm the
   receipt's execution id is the tool request's own `chat_request_records` row, and that a
   session reused across turns cannot widen attribution).
2. "Verified" receipts establish actual execution AND relevance to the requested task
   (provenance of `agent_executions.task_outcome.tool_outcomes[].verified` + `evidence_refs`,
   not a stamped boolean).
3. Client timeouts remain failed even if the server later delivers (the timeout path in
   `j2_model_setup._turn`; the `server_delivery` record is separate and never flips an
   assertion).
4. Restart assertions prove persisted settings AND a subsequent usable request (world A:
   post-restart `GET /api/local-models` + a second real reply; world B: key present and
   decrypts).
5. Export identity matches the exact combined runtime candidate — not merely the harness's
   earlier dry-run (`EXPORT_IDENTITY.json` captured before `git archive`; compare commit/tree
   to the successor HEAD).

## Previous status (2026-10-12, campaign round 9 — superseded by the round-10 section above)

**Campaign `2026-10-12-j2-repair` measured the frozen candidate `d6fbcd846` pristine**
(git-archive code export + allowlisted env + per-world scratch storage + product-created
users; install coverage still untested). Scoreboard:
`backend/scripts/orchestration_acceptance/journey_matrix/SCOREBOARD_2026-10-12.md`.

| Journey | Status | Evidence |
|---------|--------|----------|
| J1 | 4/5 verified pristine; clean-state install `untested` | `parity_pristine_20261012_20261012_104240_*.json` |
| J2 | 3/5 verified; **`J2.real-reply` FAILING at a NEW, owner-confirmed boundary**; tool-planning blocked | `j2_model_setup_20261012_103650_*.json`, `probe_j2_ranking_20261012_103859_*.json` |
| J3 | 3/3 verified pristine + repetition re-run verified | `j3_source_connection_20261012_104208_*.json`, `…_113053_*.json` |
| J4 | source-bound FAILING at the J2 boundary; 2 blocked | `j4_research_20261012_104909_*.json` |
| J5 | binding FAILING (turn hung); 2 blocked | `j5_calculation_20261012_105420_*.json` |
| J6–J9, J8 | untested with recorded reasons | registry |

**The blocker — owner-confirmed diagnosis (round 9).** The service-level repair
(`f3d554357`→`d6fbcd846`, 16/16 dispatch controls) holds in its tests, but the PUBLIC chat
route never delivers authenticated scope to it: `chat_routes.py:37` builds a module-level
`ChatOrchestrator()` with default scope, and reply paths pass `tenant_id=self.tenant_id`
(e.g. `chat_orchestrator.py:13124` passes `workspace_id="default"` explicitly;
`:10622/:13204/:14840` pass `self.tenant_id or "default"`), so dispatch continues under the
orchestrator's `"default"` identity despite the authenticated turn context. Observed at the
user boundary: `POST /api/chat/message` ranks under workspace `default` ("Managed AI blocked
for free tier workspace default", 0 candidates) while the product-registered route is
DB-verified bound to the user's workspace — **4/4 fresh worlds, never recovered in-session**.

**ATTRIBUTION CORRECTION (owner directive):** the four failures are a REPRODUCIBLE
PUBLIC-PATH SCOPE FAILURE. They must NOT be characterized as the previously suspected
cold-start/pricing-cache flake; that separate cache-refresh hypothesis remains unproven and
is not load-bearing for this repair.

**Work order → runtime owner (bounded; do not start anything else):**

> **Repair authenticated scope propagation through the public chat path.**
>
> Reproduce the first-request failure using the exact pristine J2 payload. Keep the real
> auth route, orchestrator, LLM service and dispatch; control only external endpoints.
>
> Capture scope at route entry, interpreted request, planner call, reply call, handler
> selection and network dispatch. Identify the first place the authenticated scope becomes
> `"default"`.
>
> Pass validated turn scope through the existing interfaces. Do not mutate the singleton
> orchestrator, replace its shared handler, or let unvalidated request-context workspace
> values override authorization.
>
> Require two registered users, distinct workspaces and endpoints, sequential and
> concurrent public `/api/chat/message` calls. Each first request must reach only its
> authorized endpoint. Include planning, streaming and fallback.

**Work order → frontend owner (separate agent; must not touch shared LLM runtime):**

> Capture an ordinary "Start Automating" click with browser console errors and
> request/response events. Establish whether the completion handler runs, which URL it
> calls, and what response arrives.
>
> The unchanged database proves completion did not persist; it does not prove the POST
> never arrived or that the backend is correct.
>
> Reproduce the observed failure, then fix only that boundary. Verify a normal click
> completes onboarding, the overlay closes, and reload does not reopen it. Failure must
> remain visible and retryable. Do not use force-clicks as acceptance evidence.

**Retained product evidence (not a harness bug):** the 2026-10-12 world-A attempt
`j2_model_setup_20261012_102735_*.json` declared `quality_score=0.5` — the Settings→local-
models DEFAULT — and the route could never rank (every floor ≥ 85/100), with no floor hint
in the UI. A normally configured provider is therefore ineligible out of the box. The 0.9
runs establish dispatch capability only. **Defaults are assessed separately AFTER scope
propagation works; do not blindly raise quality or relax routing floors.**

**Sequence (owner-set):** 1. runtime owner repairs public-route scope loss → 2. frontend
owner independently diagnoses onboarding completion → 3. verifier reviews both immutable
patches → 4. acceptance owner runs pristine J2 **with the first attempt counted** →
5. J4/J5 only after J2 passes. **No further model probes until then** — the next progress
is a RED public-route regression going GREEN, then a new user's successful first request.

**Gates**: `--check --release` → rc=1 (J2). `--check --strict --release` → rc=1 (J1
install untested + J2). Whole-app certification not claimed: J6–J9 unexecuted.

## Earlier status (2026-10-11, campaign round 4 — superseded)

**Scope naming (owner-corrected): the release gate covers SETUP READINESS —
fresh install, models, sources — not the advertised core loop.** Research,
drafting, background work and automation remain outside the gate until
their journeys pass. J1's clean-state dependency installation stays
`untested`: a code export reusing an existing interpreter does not prove
installation.

| Journey | Status | Evidence |
|---------|--------|----------|
| J1 | **4/5 verified (pristine)**; clean-state install `untested` | `parity_pristine_20261011_195843_*.json` |
| J2 | **3/5 verified, 1 FAILING (the demonstrated, bounded blocker), 1 blocked** | `j2_model_setup_20261011_191429_*.json`; HANDOFF in the coordination log (owner-corrected: no handler mutation; explicit dispatch scope or request-local service; no cross-workspace fallback) |
| J3 | **3/3 verified (pristine)** | `j3_source_connection_20261011_195910_*.json` |
| J4 | **3/3 FAILING — blocked at the provider boundary** | `j4_research_20261011_202223_*.json`; script complete, re-runs to green post-repair |
| J5 | **3/3 FAILING — same boundary** (workbook fixture uploads 200; the calculate turn never returns) | `j5_calculation_20261011_202453_*.json` |

**The blocker — owner-audited diagnosis (round 5; the round-4 "fixed
fallback list" explanation was WRONG and is retracted).** Two boundaries:
(1) **scope** — workspace/tenant never reaches the chat leg, so providers
a real user registers/stores are invisible (`chat_orchestrator.py:5983` →
`llm_service.py:103` → `byok_handler.py:3266`); (2) **provider/model
identity** — `_get_provider_fallback_order` already starts from configured
client keys (`byok_handler.py:1745`), but the absolute fallback at
`byok_handler.py:3735` requires a `COST_EFFICIENT_MODELS` entry that
`local_<id>` providers have none of (→ skipped), and local registration
writes model metadata keyed by `provider_type` while the client is keyed
`local_<id>` — an identity split under inspection. The global
model_id-keyed pricing cache demonstrates **metadata collision risk**;
cross-workspace **endpoint leakage is unproven** until an actual dispatch
test establishes it. The runtime owner's work order (coordination
HANDOFF, rounds 5–8): reproduce through actual dispatch capturing
scope/client-key/model-ids/ranked-routes/exclusion-reason; scope first
(explicit authenticated context or request-local service — never
shared-handler mutation, no cache-clearing between requests); then the
identity gap with concrete provider identity and actual models (no
hardcoded defaults, no invented `ollama_default`); catalog/capability/
cooldown/authorization checks preserved; no-provider-configured
distinguished from no-eligible-route; the five two-workspace dispatch
tests (sequential + concurrent authorized-endpoint-only, workspace
capabilities in ranking and fallback, B-update does not move A,
completion/streaming/tool-planning keep scope). Genuinely-missing
configuration keeps the truthful `NoProvidersConfiguredError`.
Environmental note: the only currently-credentialed provider (env-key
openrouter) dispatches and fails on credits — recorded as separately-
labeled capability evidence. Agent 1 is paused on live probes; the
verifier approves one immutable combined candidate; pristine J2 reruns
FIRST, then J4/J5.

**Gates**: `--check --strict --release` → rc=1 (J2 only). `--check` (all
journeys) → rc=1 (J2, J4, J5).

**Modes.** `configuration_parity_plus_public_api_smoke` = dirty-checkout
boot (honest label: developer `.env` loads unconditionally). 
`pristine_code_export` = app runs from a `git archive` export of the
pinned revision with an allowlisted environment (PATH/HOME/locale/tmp +
generated config + scratch overrides only). Only pristine runs may back
pristine-install claims; smoke runs remain recorded as supporting
evidence. J2's pristine rerun is ready (Ollama needs no credentials) and
runs the moment the chat-leg repair lands.

**Release gate** (`journey_contract.py --check --strict --release`):
currently **FAILING — J2** is the bounded repair blocking setup-readiness
certification. Whole-app certification is not claimed at any gate: J6–J9
are unexecuted.

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
5. **Workspace-scoped providers invisible to chat** (OPEN — round 9: the service-level
   repair is verified, but the public route loses scope before reaching it.
   `chat_routes.py:37` instantiates the orchestrator default-scoped at import; reply paths
   pass `tenant_id=self.tenant_id` / literal `"default"` (e.g. `chat_orchestrator.py:13124`,
   `:10622`, `:13204`, `:14840`), so dispatch ranks under workspace `default` ("Managed AI
   blocked for free tier workspace default", 0 candidates) while `local_model_providers`
   binds the route to the user's workspace — 4/4 fresh worlds, deterministic at the user
   boundary. Round-9 trace: `probe_j2_ranking_20261012_103859_08fb31.json`. NOT the
   cold-start flake (that hypothesis is unproven and separate). Bounded work order in the
   round-9 section above. Also flagged: `ATOM_LOCAL_ONLY=true` does not pin routing while a
   BYOK key is stored, and `GET /api/ai/providers/{id}/keys/{name}` cannot see tenant-scoped
   keys (evidence recorded, not asserted).
6. **First-run onboarding cannot be completed** (OPEN — frontend owner assigned, round 9):
   "Start Automating" clicked twice on the Ready step leaves the wizard open and
   `/api/onboarding/update` never persists (scratch DB after the run:
   `onboarding_completed=0`, `onboarding_step='welcome'`); the host re-shows the wizard
   because it gates on `onboarding_completed`, trapping a fresh user. The backend route
   exists and is trivially correct; the missing evidence is which client-side step fails
   (handler run? URL? response?). Trace: `browser_j2_chain_20261012_112631_9258b4.json` +
   `j2chain_2_provider.png`. The wizard's "Enable Ollama" connect step DOES store the key
   through the product (round-9 chain, byok_keys.json) — the break is at completion only.
   One transient observation retained: a failed Ollama probe renders "not detected" with no
   re-probe (attempt `111951`).
7. **Settings→local-models default quality makes a normal configuration ineligible**
   (OPEN — retained product-default evidence; assess AFTER scope propagation): the
   capabilities UI defaults `quality_score=0.5` while every ranking floor is ≥ 85/100, so a
   user accepting the default registers a route that can never rank, with no floor hint.
   Round-9 attempt `j2_model_setup_20261012_102735_*.json` is the out-of-box evidence; the
   0.9 runs prove dispatch capability only. Do not blindly raise the default or relax
   floors — assess defaults as their own boundary once scope works.

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
