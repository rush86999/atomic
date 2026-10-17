# Phase D — INSTALLATION FINDINGS (chronological, first failure preserved)

Candidate: `68729ebe4425c689832f012c3d5da23f3effc491` · Host: macOS 26.5.2 (25F84), x86_64
Procedure: `bash scripts/quickstart.sh` (== `make setup`), run unchanged from the worktree root.

## F1 — quickstart.sh accepts Python 3.14 but the dependency set cannot install on it

**Status: FIRST FAILURE — PRESERVED. rc=1. Raw log: `logs/quickstart.log`.**

What happened, in order (from the raw log):

1. The script's prerequisite guard PASSES on this host's default `python3`:
   `✅ Node v20.19.6` · `✅ Python 3.14`.
   (Guard: `python3 -c 'assert sys.version_info >= (3,11)'` — 3.14.7 satisfies it.)
2. `python3 -m venv backend/venv` creates a **Python 3.14.7** venv.
3. `pip install -q -r backend/requirements.txt` fails:

   ```
   ERROR: Could not find a version that satisfies the requirement torch<3.0.0,>=2.0.0 (from versions: none)
   ERROR: No matching distribution found for torch<3.0.0,>=2.0.0
   ```

   (pip's "Ignored … Requires-Python >=3.8.0,<3.12 / <3.13" list confirms it matched
   candidates by Python version and found no distribution for 3.14.)
4. `set -e` stops the script: frontend `npm install`, `backend/.env` generation, and
   `frontend-nextjs/.env.local` generation never ran. `rc=1`.

**What the repo itself targets (evidence, not preference):**

- `.github/workflows/ci.yml` pins `python-version: "3.11"` on every job, with the
  comment: *"must COMPILE under Python 3.11 — the published floor (pyproject
  requires-python ">=3.11"; CI and both Dockerfiles run 3.11 images)"*.
- `docs/getting_started/quick-start.md` §1's **manual path** prescribes exactly:
  `python3.11 -m venv venv` + `./venv/bin/pip install -r requirements.txt`.

So the script's `>= 3.11` guard is wider than the dependency set actually supports;
on any host whose default `python3` is 3.14 (like this one), the documented one-shot
bootstrap dead-ends. The documented manual path (python3.11) is the sanctioned route.

**Required + applied intervention (documented, recorded, not hidden):**

```bash
rm -rf backend/venv                 # discard the 3.14 venv the failed attempt created
python3.11 -m venv backend/venv     # docs/getting_started/quick-start.md §1 (manual path)
backend/venv/bin/python --version   # 3.11.16
bash scripts/quickstart.sh          # documented setup, unchanged — run 2
```

Run 2 raw log: `logs/quickstart_run2.log`. F1 itself remains a finding
regardless of run 2's outcome (recommended follow-up outside this frozen candidate:
tighten quickstart.sh's guard or document the bounded Python range — e.g. `3.11–3.13`
— since torch<3.0.0 has no cp314 builds).

Frozen-candidate discipline: the candidate was NOT modified to work around F1.

## F2 — `cryptography` resolves to an sdist (49.0.0 has no wheel for Intel macOS) and the host's default rustc is broken

**Status: SECOND FAILURE — PRESERVED. rc=1. Raw log: `logs/quickstart_run2.log`.**
(Diagnostic logs: `logs/pip_dryrun_onlybin.log`.)

After the F1 intervention (Python 3.11.16 venv), quickstart.sh got past the venv step and
died inside `pip install -q -r backend/requirements.txt`:

```
× Preparing metadata (pyproject.toml) did not run successfully.
╰─> ... error: process didn't exit successfully: `rustc -vV` (signal: 6, SIGABRT)
    dyld: Library not loaded: /usr/local/opt/z3/lib/libz3.4.15.dylib
      Referenced from: .../Cellar/llvm/21.1.5/lib/libLLVM.dylib
💥 maturin failed ...
× Encountered error while generating package metadata. ╰─> cryptography
```

**Mechanics (established by direct probes, in-cache, no installs):**

- `requirements.txt` line 55: `cryptography>=41.0.0,<50.0.0`. Plain pip resolves the
  NEWEST candidate first: **cryptography 49.0.0**.
- `pip download --only-binary=:all: 'cryptography==49.0.0'` → *no matching
  distribution*: **49.0.0 publishes no binary wheel this platform can use**
  (macOS x86_64 / cp311-abi3). Newest wheel-bearing in-range version:
  **48.0.1** (`cryptography-48.0.1-cp311-abi3-macosx_10_9_universal2.whl`,
  downloads and installs fine).
- With no usable wheel, pip falls back to the 49.0.0 sdist and runs its PEP 517
  metadata build (maturin → cargo → rustc). The host's default `rustc`
  (`/usr/local/bin/rustc`, Homebrew) is BROKEN: Homebrew llvm 21.1.5's libLLVM
  references `libz3.4.15.dylib` but z3 5.1.0 is installed → rustc aborts with
  signal 6. (A working rustup toolchain `rustc 1.98.1` exists at `~/.cargo/bin`
  but is not first on PATH.) => `metadata-generation-failed`.
- Whole-set `--only-binary=:all:` is NOT a viable blanket fix: it fails on
  `python-docx<1.0.0,>=0.8.11` (no wheel in that range; it is a pure-Python
  sdist and builds fine without rust — it is only the NATIVE builds that break).

**Root-cause layers:** (a) dependency range admits a version whose only
distribution for this platform is an sdist; (b) the host's default Rust
toolchain is broken (a host condition — the Homebrew tree is shared with other
agents on this machine and is NOT modified); (c) pip's newest-first preference
turns (a)+(b) into a hard stop.

**Required + applied intervention (recorded, minimal, no candidate change):**

```bash
backend/venv/bin/pip install --only-binary=:all: 'cryptography>=41.0.0,<50.0.0'  # → 48.0.1 wheel
# then re-run the documented setup unchanged (run 3)
```

The installed 48.0.1 satisfies the requirement range, so the unchanged
`pip install -r requirements.txt` leaves it in place and no sdist metadata
build is attempted for it. Recommendation (outside this frozen candidate):
constrain the range to wheel-bearing releases for Intel macOS (e.g. allow <49
or add a documented platform note / `--prefer-binary` guidance).

**RESOLUTION — run 3 reached `rc=0`.** `logs/quickstart_run3.log`:
`pip install -q -r backend/requirements.txt` completed (308 packages,
`pip check`: no broken requirements), `backend/.env` generated,
`npm install --legacy-peer-deps` completed (node_modules 2.1G; the standard
npm audit summary — 172 advisories — is in the log, informational),
`frontend-nextjs/.env.local` generated, "✅ Setup complete!".
Key installed versions: torch 2.2.2 · transformers 4.57.6 · lancedb 0.25.3 ·
fastapi 0.143.3 · uvicorn 0.54.0 · playwright 1.58.0 ·
cryptography 48.0.1 (wheel) · venv 2.6G.

## F3 — fresh install resolves pyarrow 26.0.0, unusable with the pinned numpy 1.26.4 → LanceDB dead → document upload HTTP 500

**Status: THIRD FINDING — runtime blocker on an rc=0 install.** Evidence:
`logs/backend_boot.log` (first boot), the run-1 browser-loop evidence JSON,
the live probes below, and `logs/backend_restart_f3.log` (the fix).

At the first fresh boot the app logged:

```
ERROR:core.lancedb_handler:Failed to initialize LanceDB at .../backend/data/atom_memory/default:
      pyarrow requires NumPy 2.0 or newer, found 1.26.4
```

`requirements.txt` pins `numpy>=1.24.0,<2.0.0` (line 61) but does not pin
`pyarrow` (transitive via `lancedb>=0.5.3,<1.0.0`, line 22). The fresh resolver
picked **pyarrow 26.0.0**, whose runtime enforces numpy>=2.0 — invisible to pip
(`pip check` stayed green). The pre-existing dev venv runs pyarrow **25.0.1**
and shows no such error (verified: no matching line in the main dev logs).

Observed impact on the browser loop (run 1): every Documents upload returned
**HTTP 500**; backend log shows `ERROR:api.document_routes:File upload failed:
LanceDB add_document returned False` — so no source could be ingested (agent
memory stores were down for the same reason).

**Required + applied intervention (recorded, from `logs/backend_restart_f3.log`):**

```bash
backend/venv/bin/pip install --only-binary=:all: 'pyarrow==25.0.1'   # same as the working dev venv
# backend stopped (own tree only) and restarted via the documented boot: make backend PORT=18100
```

**Post-fix verification:** new boot log shows `✓ LanceDB connection warmed`
and no pyarrow/numpy error; a live API upload probe returned the full document
record (`doc_7a80ffcf15499e6d14f7630a`, HTTP 200). Recommendation (outside this
frozen candidate): bound pyarrow (`pyarrow>=14,<26`) or move numpy to 2.x —
as installed, document ingestion dead-ends on Intel-mac fresh installs.

## F4 — PRODUCT FINDING (not an install failure): the onboarding wizard's "Enable Ollama" stores a key the app's own resolver can never read, so the first chat turn answers "No eligible LLM providers found for your current plan."

**Status: reproduced deterministically on the frozen candidate.** The install
is healthy; the wizard path and the key resolver disagree.

Traced end-to-end (run-1 evidence + live probes):

1. Wizard Card A "Enable Ollama" POSTs
   `{api_key: "ollama-local-no-key-required", key_name: "Ollama (local)",
   environment: "production"}` to `/api/ai/providers/ollama/keys`
   (`frontend-nextjs/components/Onboarding/OnboardingWizard.tsx` lines 160-168;
   Card B posts `"<provider> (onboarding)"` at line 216 — same defect class).
2. Backend stores it (HTTP 200); the entry is present in
   `backend/data/byok_keys.json` as `tenant_default_ollama_Ollama (local)_production`.
3. Every status/eligibility lookup resolves with the **default**
   `key_name="default"` (`byok_routes.get_tenant_api_key`, ~998-1033) and
   `_find_stored_key` (~709-763) matches by exact identity fields — the stored
   entry can never match.
4. Result: `GET /api/ai/providers` → ollama `has_api_keys:false,
   has_tenant_key:false, status:"inactive"`; the first chat turn persisted
   `assistant: "No eligible LLM providers found for your current plan."`
   (chat_messages row, 2026-10-17 14:17:40 — in the run-1 evidence).

Live pair proving the mechanism: the same key value stored with
`key_name="default"` → `has_tenant_key:true, status:"active"` immediately.

**Required product fix (out of scope for the frozen install run):** the wizard
should POST `key_name: "default"` — matching the settings UI, which already
posts `?key_name=default` (`frontend-nextjs/src/components/AIProviders/
AIProviderSettings.tsx` ~202-208) — or the resolver must treat
tenant+provider+environment as identity and stop keying on display names.

**Phase D loop continuation (recorded workaround, in-browser):** configure the
model via **Settings → AI** (the resolver-compatible UI path), then the loop
proceeds: upload → answer that uses the source → reload persistence.

## F5 — PRODUCT FINDING: on the documented local path (`ATOM_LOCAL_ONLY=true`), chat turns return the `no_llm_provider` sentinel while the local model is healthy and streaming in the same window

**Status: deterministic — 4/4 probe turns (`f5_repro.log`: baseline, daemon
frozen, immediately after resume, +70 s) and the run-2 browser-loop turn all
returned the sentinel while the local model was healthy and serving; root cause
traced in code.** Evidence: `logs/f5_repro.log`
(U2 probe, 4 turns, latencies 0.7–10.6 s — ALL `success:false,
error_code:"no_llm_provider"`, message "You need an AI provider to use chat…"),
`logs/f5_sentinel_trace_excerpt.txt` (verbatim backend-log slice of the
same window), run-2 evidence JSON (`chat` leg), and the contrasting cloud path
`logs/byok_probe_ocgo.log`.

Context: `scripts/quickstart.sh` generates `backend/.env` with the provider
entries commented out (secure defaults) and prints *"set ATOM_LOCAL_ONLY=true for
Ollama"* — the declared Phase D isolation settings appended exactly that
(`logs/isolation_applied.md`). The ollama daemon was running with
`llama3.1:8b`; `GET http://localhost:11434/api/tags` answered HTTP 200 *inside*
the failing window.

Same-window log sequence of one failing turn (excerpt file, in order):

1. `WARNING core.llm.byok_handler: BPC cost-priority: NO candidate clears
   quality floor 85 (task_type=planning) — ranking all 0 candidates by cost`
   (repeated every turn).
2. `INFO … Attempting stream with provider: ollama (requested: ollama)
   model=llama3.1:8b` → `POST /v1/chat/completions 200` →
   `[inflight] ollama/llama3.1:8b released by 'structured:chat' after 7.2s`
   — the **chat leg uses ollama fine**.
3. `WARNING integrations.chat_orchestrator: streamed reply is a generic
   non-answer despite tool results — grounded regeneration`.
4. An agent leg runs (`Handler FeatureType.AGENT succeeded`).
5. The tenant-plan/route check repeatedly logs `Failed to get tenant plan: No
   dispatchable LLM route: every configured provider's default model is either
   not served by its discovered catalogue or on cooldown.`
6. Externally: the sentinel (`no_llm_provider`).

Mechanism (pinned by code reads):

- Planning/route candidates are built by `ModelRouteRegistry.evaluate_route`
  (`core/llm/model_route_registry.py:753`), which needs `local_runtime_models`
  for non-catalog providers; a catalogueless local provider resolves to
  `provider_catalog_unknown` → **0 candidates** (the BPC warning above).
- The agent/planning fallback order drops ollama when the cached availability
  probe is not `"up"` (`core/llm/byok_handler.py:1858`); probe results are
  memoized (UP 300 s / DOWN 60 s / memo 300 s, ~`:2939`) — one flap starves the
  leg for minutes while the stream leg keeps working (this replaces the earlier
  "intermittent probe flap" theory — the failure is deterministic for
  agent/grounded turns).
- Under `ATOM_LOCAL_ONLY=true` cloud providers are excluded **by design**
  (`core/privsec/local_only_guard`), so there is no second route: planning-leg
  starvation becomes the user-visible sentinel.

Required product fix (outside this frozen install): planning/agent routing should
be able to dispatch to a healthy local runtime even without catalogue
identifiers — e.g. admit non-catalog providers in `evaluate_route` (using the
live stream/probe as liveness evidence), or surface the conversational path
instead of `no_llm_provider`.

**Contrast (cloud route, run-3 pre-flight):** `logs/byok_probe_ocgo.log`
— the same grounded question shape against the OpenCode Go gateway (stored via
the product BYOK endpoint, `key_name=default`) answers normally
(`provider=opencode-go`; the durable answer delivered `QUARTZ-77` with source
attribution). The run-3 boot log shows
`provider catalogue: opencode-go serves 37 identifier(s)` — i.e. the discovery
layer works when the provider HAS a catalogue; the gap is local providers
without one.

## F6 — PRODUCT FINDING (cloud/BYOK path): grounded answers become the "unusable output" placeholder whenever the narration leg runs on MiniMax — its reasoning-tag residue is quarantined instead of stripped

**Status: deterministic per model. Every quarantined narration observed ran on
`minimax-m3` (7/7 in this window); the one clean cloud delivery ran
`glm-5.3-flash`.** Reproduced in the browser loop (run 3a once, run 3b twice) and
by an API odds probe — see the evidence files below.

Evidence:
`browser_complete_loop_r3_20261017_113139.json` and
`browser_complete_loop_r3_20261017_113656.json` (run-3 chat legs: delivered texts
are the placeholder; `answer-not-unusable-output` false), `logs/backend_boot_run3.log`
(call lifecycle for every turn + the `[narration-reject]` warnings),
`logs/byok_probe_ocgo.log` (the clean repeat: `model=glm-5.3-flash`,
delivered `QUARTZ-77`), `logs/narration_odds_probe.log` (API odds probe),
`logs/browser_run3_loop.log`, `logs/browser_run3b_loop.log`.

Chain, per failing turn (run-3b turn 1 as the example):

1. The tool/search leg runs (structured records retrieved; `[settle-probe]`
   shows the coverage keys and the verify panel runs).
2. The text that gets validated and PERSISTED comes from the **non-streaming
   narration call** (`completion:general`). The router picked `minimax-m3` for
   it (`BYOK Logic: complexity=complex, provider=opencode-go, model=minimax-m3`
   immediately before each reject; the persisted row's metadata carries
   `"model": "minimax-m3"`).
3. The final-text validator (`core/response_validation.py`) matches MiniMax's
   reasoning wrappers —
   `_REASONING_TAG_RE = re.compile(r"<think\b|</(?:mm:)?think>|</?(?:mm:)?thinking>")`
   — reason **"reasoning tag residue"**.
4. The orchestrator quarantines the whole output
   (`[narration-reject] malformed model output quarantined (reasoning tag
   residue) — honest status delivered instead`,
   `integrations/chat_orchestrator.py:~24800`) and delivers the placeholder
   "The answer model produced unusable output this turn…" — the retrieved facts
   are never shown.
5. A retry in the same session re-runs the same leg; the router picks
   `minimax-m3` again → same placeholder (run 3b: 2/2 turns; the API odds
   probe: **3/3 attempts over ~3 minutes**, one of them additionally returning
   `error_code: "outcome_unconfirmed"` with the same placeholder text).

Why the residue survives:

- The non-streaming reply path deliberately does **not** clean protocol
  fragments before validation — pinned by the code comment at
  `chat_orchestrator.py:23647-23650`: *"The final response validator rejects
  residue before persistence or display; only stream assembly may clean partial
  fragments."*
- The existing cleaner (`core/response_validation.py:strip_protocol_fragments`)
  would not fully cover MiniMax's wrappers anyway: it removes only the
  `think`-suffixed variants (`</?mm:think>|</?think>`) while the validator also
  flags the `thinking`-suffixed ones. (One product path does strip
  `</?mm:think>|</?think>` — `core/chat_canvas_editor.py:5919` — so the intent
  exists elsewhere.)
- On the streaming assembly the cleaner's cleaned return value is not what gets
  assigned (`chat_orchestrator.py:23045` discards it; `_streamed = _full`).

Why it surfaced now: the clean probe delivery (15:14) predates the
LearningRouter flip to re-ranking (`[LearningRouter] auto-mode readiness: 35
verdict row(s) … -> re-ranking ENABLED`, `logs/backend_boot_run3.log`
line ~3132); afterward every complex narration pick was `minimax-m3`, before it
the pick alternated (`glm-5.3-flash` / `deepseek-v4.1-flash` / `minimax-m3`).

Required product fix (outside this frozen install): strip/normalize known
reasoning wrappers (`<mm:thinking>`, `<thinking>`, `<mm:think>`, `<think>`) from
narration content before final-text validation — run `strip_protocol_fragments`
on the non-streaming path too, on its return value — and/or treat a validation
reject as a fallback trigger (re-narrate with the next ranked model) instead of
ending the turn with the placeholder. Document-search turns have no
deterministic-render fallback either (only workbook/structured-record turns do,
`chat_orchestrator.py:~24700`), so the retrieved answer is lost entirely.

Loop impact: with F5 (local-only path starves the planning leg) and F6 (cloud
narration quarantined), the browser loop's "useful attributed answer" leg cannot
complete on either provider path in this install; the one clean probe delivery
documents that the same pipeline delivers when the narration model is clean.
