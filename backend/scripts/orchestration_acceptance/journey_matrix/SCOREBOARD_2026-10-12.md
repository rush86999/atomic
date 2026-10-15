# Acceptance Scoreboard — campaign `2026-10-12-j2-repair`

> **Corrections after owner review (2026-10-12, applied in place):** (1) the four
> first-dispatch failures are a **reproducible public-path scope failure** — the public
> chat route uses a default-scoped orchestrator (`chat_routes.py:37`) and reply paths pass
> `tenant_id=self.tenant_id` / literal `"default"` — NOT the previously suspected
> cold-start/pricing-cache flake, which remains unproven and separate. (2) The
> `quality_score=0.5` world-A attempt is retained as **product-default evidence** (the
> Settings default configures a provider that can never rank), not dismissed as a harness
> input bug; defaults are assessed separately after scope propagation works. (3) Work
> orders for the runtime owner (public-route scope) and a separate frontend owner
> (onboarding completion) are recorded in `docs/acceptance/ACCEPTANCE_CONTRACT.md`
> (round-9 section); next progress is a RED public-route regression going GREEN, then a new
> user's successful first request — **no further model probes**. The pristine J2 rerun will
> count the FIRST attempt.

**Candidate (frozen):** `d6fbcd846` ("verified stale-positive scope resolution") — the
combined J2-repair stream `f3d554357 → 316317f3b → bf0bd94f0 → d6fbcd846`, unit-verified
16/16 by the runtime verifier. Working tree at campaign start: coordination doc + frontend
`next-env.d.ts` + acceptance-harness files only (no shared runtime dirty).
**Date:** 2026-10-12. **Owner:** acceptance (measurement only — zero shared-runtime edits;
harness-only changes listed at the bottom).

**Environment (reproducible):** every journey below ran on a `git archive` CODE EXPORT of
the candidate with an ALLOWLISTED process env (PATH/HOME/locale/TMP + generated quickstart
config + pinned scratch overrides), a per-world scratch SQLite + LanceDB + BYOK vault, and
product-created users/workspaces (register → login). Boot identity asserted per run
(`/api/health`). **Installation coverage stays separately labeled: NO clean-dependency
install was exercised (code export reuses the repo interpreter) — `J1.quickstart-install`
remains untested by design.** Storage paths are per-run temp dirs recorded in each evidence
file (`resolved_db_path`).

**Evidence classes kept separate:**
- *Live capability (actual configured model/source):* J2 worlds A/B, J4, J5 (live Ollama
  `llama3.1:8b`; BYOK key from repo `.env` used only as a stored secret, never dispatched).
- *Deterministic regression:* not extended this campaign (existing F-cases stand).
- *Repetition measurement:* J3 re-run unchanged on a fresh world after capability passed
  (`j3_source_connection_20261012_113053_7d72b5.json`); J2 world B also passed in two
  independent fresh worlds today (`102735`, `103650`).

No failed attempt was replaced by a retry: every attempt JSON in `journey_matrix/` is
preserved and attributed (see per-assertion notes).

## Scoreboard

| Journey | Requested outcome | Observed outcome | Status | Evidence (journey_matrix/) |
|---|---|---|---|---|
| J1 config-parity | Gates EFFECTIVE in running server | Gates effective from export; lifecycle begin→settle→reload idempotent | **verified** | `parity_pristine_20261012_20261012_104240_de7328.json` |
| J1 boot | Healthy boot on generated env | Healthy 6s-class boots, identity asserted | **verified** | same |
| J1 signin | Sign-in via product login | API + real browser form (cookie + 200) | **verified** (onboarding finding escalated, see below) | same + `browser_j2_chain_20261012_112631_9258b4.json` |
| J1 workspace | Product-created workspace persists | /me bound + feed 200 | **verified** | same |
| J1 quickstart-install | Clean install from nothing | NOT EXERCISED (export+existing interpreter proves isolation only) | **untested (deliberate)** | — |
| J2 byok-add-product-path | Key stored via Settings→AI, decrypts | 200 + masked readback proves decryption (allowlisted env: no inherited credential) | **verified** | `j2_model_setup_20261012_103650_283772.json` |
| J2 byok-survive-restart | Key survives REAL restart | Present + decrypts after new process, same DB | **verified** | same |
| J2 local-provider-product-path | Local inference configured via product | register/discover(5 live models)/capabilities 200 | **verified** | same (world A) |
| J2 real-reply | REAL provider-served chat reply | REFUSED `no_llm_provider` — OWNER-CONFIRMED: the public chat route uses a default-scoped orchestrator (`chat_routes.py:37`); reply paths pass `tenant_id=self.tenant_id` / `"default"`, so ranking runs under workspace `default` (0 candidates; "Managed AI blocked for free tier workspace default") while the product-registered route is bound to the user's workspace (DB-verified); 4/4 fresh worlds, deterministic | **failed — escalated with work order** | `probe_j2_ranking_20261012_103859_08fb31.json` + preserved attempts `102735` (product-default evidence, see corrections), `103650` |
| J2 tool-planning | Tool selected for tool-shaped ask | No provider-served reply exists to plan with | **untested (blocked by real-reply)** | probe trace |
| J3 upload / authorized-read / isolation | Source in, authorized read, cross-workspace denial | All three pass on fresh world | **verified ×3** | `j3_source_connection_20261012_104208_fdca1f.json` |
| J3 repetition (unchanged re-run) | Same result on fresh session | All three pass again | **verified (repetition class)** | `j3_source_connection_20261012_113053_7d72b5.json` |
| J4 source-bound | Findings bound to uploaded source | Upload 200; research ask refused at the J2 chat-lane boundary | **failed — same boundary** | `j4_research_20261012_104909_457f41.json` |
| J4 uncertainty / survives-reload | Honest miss / history equality | Unexercised (session turn hung to 300s after the refusal) | **untested (blocked)** | same |
| J5 binding | Workbook bound to record via product | Upload 200; the calculate ask hung past 300s (no session id returned) — binding unproven | **failed (partial by construction)** | `j5_calculation_20261012_105420_fbde25.json` |
| J5 persist / readback-agreement | Calculate op persists; reply agrees | No operation exists (turn never completed) | **untested (blocked)** | same |
| J6 authorized-once / protected-content / survives-reload | Drafting lands once, protected, durable | Drafting flows through the blocked chat lane; privileged harnesses are capability-only | **untested ×3** | — |
| J7 truthful-handoff / same-job-continuation / durable-result | Honest job handoff, continuation, restart-durable | Chat-lane dependent; restart harnesses anchored to older worlds | **untested ×3** | — |
| J8 plain-language-create / approval-rejection | Executable workflow from plain language | Separately exercised journey per owner sequencing; no fresh-install harness yet | **untested ×2** | — |
| J9 truthful-failure / usable-after-failure / recoverable | Truthful failure, usable UI, recoverable work | Privileged capability harnesses not re-run on fresh install | **untested ×3** | — |

## Browser chain (signed-in, real Chromium → real frontend → scratch backend)

Per-leg outcomes (attempt 5, `browser_j2_chain_20261012_112631_9258b4.json`; attempts 1–4
preserved and attributed — harness bugs were fixed between attempts, product behavior
unchanged): signin **pass** (form → 200 → cookie → /dashboard) · configure/connect **pass
through the product** (onboarding wizard "Enable Ollama": probe 200 "Detected" rendered,
click stored the tenant ollama key — present in the world's `byok_keys.json`) · request →
result **fail** (chat refused at the J2 boundary; the chain ended in error only because the
onboarding overlay still intercepted clicks) · reload **pass** (still signed in).

**NEW PRODUCT FINDING (escalated):** first-run onboarding cannot be completed —
"Start Automating" clicked twice on the Ready step leaves the wizard open;
`/api/onboarding/update` never persists (scratch DB after the run:
`onboarding_completed=0`, `onboarding_step='welcome'`). The backend route exists and is
trivially correct, so the defect is client-side (handler never sends, or aborts before
persist). The wizard re-shows (host gates on `onboarding_completed`), so a fresh user is
trapped in it. Trace: `browser_j2_chain_20261012_112631_9258b4.json` +
`j2chain_2_provider.png` (Ready step, overlay up).

## Escalations to the runtime owner (one trace each, no repair streams started)

1. **J2.real-reply / public-route scope loss (release blocker) — owner-confirmed,
   work order issued.** Captured trace: `probe_j2_ranking_20261012_103859_08fb31.json`
   (LOG_LEVEL=DEBUG, pristine export). First demonstrated boundary: `POST /api/chat/message`
   ranks providers under workspace `default` — log: "BPC cost-priority … ranking all 0
   candidates by cost" + "Managed AI blocked for free tier workspace default" — while
   `local_model_providers` binds the route to the user's workspace (read-only DB check) and
   the user-scoped handler loads only after the refusal. Owner code review identifies the
   mechanism: `chat_routes.py:37` builds the module-level `ChatOrchestrator()` default-
   scoped, and reply paths pass `tenant_id=self.tenant_id` (`chat_orchestrator.py:13124`
   passes `workspace_id="default"` explicitly; `:10622/:13204/:14840` pass
   `self.tenant_id or "default"`), so the verified service-level scope resolution never
   receives the authenticated turn context. The bounded repair assignment (capture scope at
   route entry → interpreted request → planner → reply → handler selection → dispatch;
   validated scope through existing interfaces; no singleton mutation, no shared-handler
   replacement, no unvalidated workspace override; two users/two endpoints sequential+
   concurrent through planning, streaming, fallback) is recorded verbatim in
   `docs/acceptance/ACCEPTANCE_CONTRACT.md` (round-9 section). This is a reproducible
   public-path scope failure — not the cold-start flake (unproven, separate). Secondary
   chat-lane observations: post-refusal turns hang to the 300s timeout (2 occurrences);
   the turn_fact_extractor sidecar swallows the same refusal as a parse failure.
2. **Onboarding completion broken (J1-adjacent, browser-found) — frontend owner assigned
   (separate; no shared LLM runtime).** Trace:
   `browser_j2_chain_20261012_112631_9258b4.json` + screenshot. Two "Start Automating"
   clicks on Ready; `/api/onboarding/update` never persists; user trapped in the wizard.
   The assignment (console + network capture of an ordinary click; establish whether the
   handler runs, which URL, what response; fix only that boundary; failure stays visible
   and retryable; no force-clicks as acceptance evidence) is recorded verbatim in the
   contract's round-9 section.
3. **Retained product-default evidence (not a harness bug).** The Settings→local-models
   capabilities UI defaults `quality_score=0.5` while every ranking floor is ≥ 85/100, with
   no floor hint: a user accepting the default registers a route that can never rank.
   World-A attempt `102735` (harness used the product default) is the out-of-box evidence;
   the 0.9 runs prove dispatch capability only. Defaults get their own assessment AFTER
   scope propagation works — do not blindly raise quality or relax floors. Minor additional
   observation: the onboarding Ollama probe renders "not detected" after a transient probe
   failure with no re-probe (attempt `111951`).

## Release check

`journey_contract.py --check --release` → **FAIL (release scope J1, J2, J3): J2** (rc=1).
`--strict` additionally names J1 (quickstart-install deliberately untested). Verified
records all carry candidate-bound evidence + identity (enforced by the recorder).

## Developer interventions & follow-ups

- Zero shared-runtime edits. Harness-only (acceptance-owned): `j2_model_setup.py`
  (+`--pristine`, +`--model`, quality 0.9), `j4_research.py`/`j5_calculation.py`
  (+product-registered local-provider path, +`--model`), new `browser_j2_chain.py`, new
  `probe_j2_ranking.py` (attribution probe), quality-floor fix in registration payloads.
- Owner review time: **unmeasured** (none collected this campaign).
- Follow-ups (owner-set sequence): 1. runtime owner repairs public-route scope loss →
  2. frontend owner independently diagnoses onboarding completion → 3. verifier reviews
  both immutable patches → 4. acceptance owner runs pristine J2 **with the first attempt
  counted** → 5. J4/J5 only after J2 passes. No further model probes in the meantime.
  J8 remains its own campaign; J6/J7/J9 need fresh-install-class harnesses before they can
  be accepted (privileged capability evidence cannot accept them); installation coverage
  (`J1.quickstart-install`) remains open until a clean dependency install is exercised;
  the Settings quality default gets its own assessment after scope propagation works.
