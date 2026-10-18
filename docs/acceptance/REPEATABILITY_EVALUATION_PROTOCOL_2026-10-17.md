# Repeatability & value evaluation — predeclared protocol (2026-10-17)

**Status: PREDECLARED — committed BEFORE any measurement run.** Owner
directive (2026-10-17 late): "finish the predeclared repeatability/value
evaluation on this exact deployed build. Measure whether ordinary users can
complete useful tasks consistently, how long they take, and where
clarification or recovery creates friction. Then publish the support
statement."

## Build under test (exactly as deployed — read-only, live world)

- **Served backend**: `:8001`, git_commit **`8c593e57031e`** (single
  instance; deployed through the scoped controlled restart, snapshot
  verified). **Pilot frontend**: `:3000` → `:8001`.
- No code changes of any kind are made for this evaluation. The live dev
  world is the test world; artifacts are documented (fresh users, one
  uploaded fixture and one draft canvas per repetition).

## The evaluated job (the supported workflow slice)

Per repetition, a **fresh ordinary product user** (product registration
only — no developer data, no env keys):

```text
T0  sign up / sign in through the product
T1  onboarding wizard Card A (Enable Ollama) -> completion       [once per user]
T2  upload "approved records" fixture via the Documents UI
T3  grounded sourced answer (chat): "search my uploaded documents for
    the launch code for project Zephyr-9 and tell me the code"
T4  draft canvas seeded through the product API (spine scenario), opened
    from the canvas page
T5  authorized edit: "update the Valid Until date in this draft to
    2026-12-31" -> authoritative readback + audit count
```

**N = 3 repetitions** (small, predeclared). The interruption/recovery leg is
NOT re-run here — it is verified in the composed-job run-4 evidence —
but any recovery or clarification interaction that OCCURS is logged.

## Measurements (per repetition, verbatim records)

- Per-step wall-clock (seconds) and per-turn settled state (`success`,
  `outcome`, `error_code`).
- **User-action count** for the minimal correct interaction set (sign-up,
  wizard, upload, ask, edit-ask = 5) and any EXTRA actions forced by
  friction (retries, re-phrasings, re-saves).
- Provider/model that actually served each turn (attribution).
- Clarifications the system asked; non-answers; warnings.
- T3 answer correctness (contains the fact, from the uploaded file);
  T5 readback carries the new value with exactly +1 audit row.

## Pass criteria

- **3/3 repetitions green on T3 and T5**, with every settled state
  recorded; and
- zero forced extra user actions beyond the minimal interaction set
  (any extra action is a finding, recorded, never smoothed over).

Friction observations are REPORTED, not hidden; a repetition that fails any
step marks the evaluation as revealing that friction.

## Explicit limitations carried (never certified here)

- The S6 **idempotent re-ask** (same change already applied) and the S7
  **continuation settlement** remain the composed-run's named exclusions;
  they are outside this evaluated job.
- No claim beyond the tested configuration: personal-edition world, the
  deployed build's provider set (the wizard-local runtime; the deployed
  cloud route as-is), this host, this fixture.

## Outputs

- Run JSON(s) + a short metrics table: `journey_matrix/repeatability_<ts>/`.
- Then the **support statement** (supported jobs, tested configuration,
  latency/resource limits, experimental/unavailable items, the named
  limitations, deployment identity + rollback), citing this evaluation.
