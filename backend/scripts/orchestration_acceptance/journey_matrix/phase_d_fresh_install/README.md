# Phase D — Fresh-install acceptance archive (`J1.quickstart-install` + browser loop)

**Candidate (frozen):** `68729ebe4425c689832f012c3d5da23f3effc491` — "acceptance:
Phase C third independent run + unauthenticated failure-path control —
corroboration only".

**Setup:** detached worktree, backend `:18100` / frontend `:18101`, isolated data
(scratch DB inside the worktree). A genuinely NEW venv (Python 3.11.16) and NEW
`node_modules` were installed from public indexes on this host — no symlinked
dependencies. Install caches (pip/Homebrew/ffmpeg) may have been reused; binaries
were built/downloaded fresh into the new venv.

**Procedure:** `bash scripts/quickstart.sh` (== `make setup`), run UNCHANGED from
the worktree root. The first failure is preserved in
`INSTALL_FINDINGS.md`; two documented manual-path interventions followed
(F1 → `python3.11 -m venv`; F2 → pre-install the `cryptography<49` wheel), after
which run 3 reached rc=0.

## Qualification of the claim (read with the evidence)

A fresh venv on this existing host proves **clean-environment installation on
this host**. It does NOT prove installation on a clean machine or another OS.
The F2 failure is partly host-toolchain (broken stock rustc), partly dependency
range; a different host would hit different variants.

## Runs and evidence

| run | evidence | what it established |
|---|---|---|
| 1 | `browser_quickstart_loop_20261017_101746.json` | install-era loop: dead-ends at document upload (F3) and the first chat answer (F4) |
| 2 | `browser_complete_loop_20261017_104117.json` | after the F3 fix: identity/ownership/isolation legs, both sign-ins, wizard walk, completion, Settings→AI green; chat answered with the `no_llm_provider` sentinel (F5) |
| 3a | `browser_complete_loop_r3_20261017_113139.json` | cloud BYOK world (owner directive): wizard Card B stores the operator's OpenCode Go key through the product (F4 re-demonstrated for a cloud provider); Settings→AI (`key_name=default`) activates it; upload durable; chat leg hit the narration quarantine (F6) — first harness pass (its history reader missed `response.message`; superseded by 3b) |
| 3b | `browser_complete_loop_r3_20261017_113656.json` | same flow with fixed readers: **22/25 assertions green**; all identity/ownership/isolation/sign-in/onboarding/settings/upload/reload legs pass; the answer leg is blocked by F6 (both tries quarantined) |
| odds | `logs/narration_odds_probe.log` | API repetition of the grounded ask on the same live backend: **3/3 quarantined** — F6 is deterministic under the current router ordering; no further browser reruns were attempted |

Effective config differs deliberately between runs: run 1/2 ran the documented
local path (`ATOM_LOCAL_ONLY=true`, declared isolation); run 3 runs with
`ATOM_LOCAL_ONLY=false` + `OPENCODE_API_KEY` (the quickstart's recommended
option), per the owner directive "use opencode go keys or deepseek keys for
testing byok". The change and its reason are in
`logs/isolation_applied.md` (addendum); every evidence JSON carries its own
effective-config digest.

## Findings (detail in `INSTALL_FINDINGS.md`; none fixed inside the frozen checkout)

- **F1** — quickstart's Python guard accepts 3.14; torch<3 cannot install there.
  Documented manual path (3.11) is the sanctioned route. (Reproduced
  independently by the second stream.)
- **F2** — `cryptography 49.0.0` publishes no usable wheel for Intel macOS and
  the sdist needs Rust; the host's stock rustc is broken → metadata build
  fails. Pinned to the newest wheel-bearing release (48.0.1).
- **F3** — fresh resolver picks `pyarrow 26.0.0` (enforces numpy≥2) while
  requirements pin numpy<2 → LanceDB dead → document upload 500. Pinned
  pyarrow 25.0.1.
- **F4 (product)** — the onboarding wizard stores API keys under
  `"<provider> (onboarding)"`, but every resolver lookup asks for
  `key_name="default"` → wizard-configured providers stay inactive until
  re-saved via Settings→AI. Demonstrated for Ollama (run 2) and for
  `opencode-go` (run 3a/3b: wizard store → still inactive; Settings→AI → active).
- **F5 (product)** — with `ATOM_LOCAL_ONLY=true`, agent/grounded turns end in
  the `no_llm_provider` sentinel although the local model is healthy and the
  same turn's stream leg serves from it; the planning leg ranks 0 candidates
  for catalogueless local providers. Deterministic; traced in code.
- **F6 (product)** — on the cloud path, the persisted narration comes from the
  non-streaming leg; whenever that leg runs on `minimax-m3`, MiniMax's
  `<mm:thinking>` residue trips the final-text validator and the whole answer is
  replaced by the "unusable output" placeholder (7/7 quarantined narrations in
  this window; the one clean delivery ran `glm-5.3-flash`). Retries re-pick the
  same model → no recovery. Traced in code (validator at
  `core/response_validation.py`, quarantine at `integrations/chat_orchestrator.py`).

## Credentials

The archive contains NO credentials: the operator's OpenCode Go key, JWTs and
`api_key` values were scrubbed (run-3 evidence scrubbed at write time; every
archive copy re-scrubbed by `scrub.py` before checksumming). Probe scripts are
included with the scratch-user password replaced by a placeholder.

## Reproduction

```bash
# from the frozen worktree (candidate 68729ebe4), ports 18100/18101 free:
python3.11 -m venv backend/venv                                    # F1 intervention
backend/venv/bin/pip install --only-binary=:all: 'cryptography>=41,<50'   # F2
bash scripts/quickstart.sh                                         # documented setup
backend/venv/bin/pip install --only-binary=:all: 'pyarrow==25.0.1'        # F3
make backend PORT=18100 &  make frontend PORT=18101 &               # documented boot
backend/venv/bin/python backend/scripts/orchestration_acceptance/browser_phase_d_loop_complete_r3.py
```

Harnesses (also copied to the acceptance directory):
`../../../browser_phase_d_loop_complete_r3.py` (this archive's loop),
`../../../browser_phase_d_quickstart_loop.py` (carried Phase C machinery),
`../../../browser_phase_d_loop_complete.py` (run 2).

## Registry binds recorded from this archive

- `J1.quickstart-install` → **verified on `68729ebe4`** (this archive).
- `J1.signin`, `J1.onboarding-completion` → re-bound to the run-3b browser-loop
  evidence (fresh user + admin through the real sign-in form; completion
  persisted with DB + API readbacks and a reload).
- The answer/attribution capability is **NOT promoted**: it is blocked by F6
  (cloud) and F5 (local). The failing loop assertions stay visible in the
  run-3 evidence JSONs.
- The second independent stream (`atom-phase-d`, ports 18200/18201) reproduced
  the install findings (F1/F2) — its committed evidence should be merged into a
  future two-stream reconciliation (Phase C Y-pattern), per the coordination log.
