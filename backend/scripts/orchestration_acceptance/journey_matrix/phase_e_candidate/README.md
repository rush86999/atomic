# Phase E — unified-candidate acceptance archive

**Candidate (frozen):** `e207494af4c7de5f4b2ef85618c7eced64c18162` — "fix(retrieval):
the hybrid search carries bounded body text for the tool lane". The candidate
carries the F4/F5/F6 repairs, the review fixes, the installer fixes (F1–F3),
and the retrieval-scope repairs the Phase E loop exposed.

**Setup:** detached worktree, backend `:18300` / frontend `:18301`, isolated
data (scratch DB inside the worktree). A genuinely new venv was created with
the documented manual path (`python3.11 -m venv backend/venv`), then the
documented `bash scripts/quickstart.sh` ran to completion — **intervention-free
on the supported interpreter** (see Installation below).

## Installation — F1–F3 fixes verified, original findings preserved

| step | result | evidence |
|---|---|---|
| `bash scripts/quickstart.sh` with the host default `python3` (3.14.7) | **refused up front** with the supported-range message (rc=1, before any venv/pip) — the old behaviour dead-ended inside pip on `torch<3` | `logs/f1_refusal.log` |
| `python3.11 -m venv backend/venv` then the SAME documented quickstart | **rc=0, zero interventions**: pip resolved `cryptography 48.0.1` (wheel; `--prefer-binary`) and `pyarrow 25.0.1` (`<26` bound, numpy 1.26.4 compatible); frontend deps installed | `logs/install_supported.log` |

The Phase D F1–F3 findings remain recorded verbatim in
`journey_matrix/phase_d_fresh_install/INSTALL_FINDINGS.md`; this archive records
that the installer-side fixes were verified by a clean re-run on the new
candidate. Qualification unchanged: fresh venv on this host, not a clean
machine/other OS.

## Browser loop — wizard configuration → useful attributed answer → reload

**Primary run (local world, `ATOM_LOCAL_ONLY=true`, ollama): 25/25 assertions
green** — `evidence/browser_phase_e_local_20261017_175758.json`.

The loop, in the browser: bootstrap admin sign-in → fresh product user →
onboarding wizard (Card A "Enable Ollama") → completion click → document
upload through the Documents UI → grounded chat ask → reload.

What the run establishes:

- **F4 closed on the local path**: the wizard stored the canonical identity
  (`key_name="default"`, friendly `label` separate), the provider flipped
  `has_tenant_key=true / status=active` immediately, and exactly ONE store POST
  existed before the chat — no Settings→AI re-save. (Cloud-provider F4 evidence:
  see the supplementary cloud run below.)
- **F5 closed on the local path**: the grounded turn dispatched through the
  planning leg to `ollama/llama3.1:8b` (usage attribution), no
  `no_llm_provider` sentinel, first attempt clean.
- **Answer leg**: the reply uses the uploaded source (QUARTZ-77 from the
  fixture), is durable in history, and survives reload; the wizard does not
  reappear.
- **Retrieval scope repair verified live**: the source-ask's zero-match VFS
  grep fell back to the workspace-scoped hybrid search and answered from the
  document body.

**Supplementary cloud run (run 1, before the retrieval repairs):
`evidence/browser_phase_e_cloud_20261017_164154.json`.** The wizard Card B
store (canonical identity) activated `opencode-go` immediately with NO
`OPENCODE_API_KEY` in the backend environment, and the chat turn was attributed
to opencode-go — the cloud F4 leg. Its answer leg then missed the uploaded
source (the retrieval-scope defects later repaired), and the operator's
OpenCode Go key **expired mid-campaign** (verified 401 `api_key_expired`), so
no further cloud runs were attempted. The cloud answer leg is therefore NOT
promoted; the local run is the unified-loop evidence.

## Findings status after this cycle

- **F4 (product)** — repaired (wizard writes the canonical identity; label is
  display-only; runtime sees admin-manager writes without a restart). Local
  loop green; cloud run-1 activation green.
- **F5 (product)** — repaired (healthy local runtime enters ranking through
  the registered-local mechanism under local-only; declared model + live
  probe; explicit registrations keep precedence). Local loop green.
- **F6 (product)** — repaired (complete reasoning wrappers convert on both
  delivery paths; reasoning never re-exposed; incomplete markers rejected;
  streaming falls back rather than shipping a prefix). Verified by 20 boundary
  + 3 orchestrator delivery tests with controlled provider responses; the
  cloud run-1 narration was NOT quarantined (no live reproduction of the
  quarantine after the fix, but also no live MiniMax pick to exercise it — the
  key expired). NOT promoted as a live cloud claim.
- **Retrieval scope (new, exposed by this loop)** — repaired: uploads land in
  the FK workspace store (freshness-stamped), and the chat's documents search
  reads that store (vector + lexical) with a zero-match VFS→hybrid fallback
  that renders bounded body text. Verified live (search API + chat answer).

## Reproduce

```bash
# from the frozen worktree, ports 18300/18301 free:
python3.11 -m venv backend/venv          # documented manual path
bash scripts/quickstart.sh               # rc=0, no interventions
# append isolation: ATOM_LOCAL_ONLY=true (+ OLLAMA_BASE_URL)
make backend PORT=18300 &  make frontend FE_PORT=18301 &
python backend/scripts/orchestration_acceptance/browser_phase_e_loop.py \
    --mode local --wt <worktree> --sha e207494af4c7
```

Harness: `browser_phase_e_loop.py` (copied here; sha256 in the run JSON).
