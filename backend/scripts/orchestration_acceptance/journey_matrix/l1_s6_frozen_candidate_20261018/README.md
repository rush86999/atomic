# L1/S6 frozen candidate — verification record (2026-10-18)

**What this is.** The preserved verification record for the owner-approved
L1/S6 candidate `b96dec60a`, ahead of the served/build public re-ask. It
contains the exact tested identity, the **original S6 request** run through
the real route (the four owner-required assertions), the frozen suite's
route test, and the focused-suite state of the frozen candidate.

## Candidate (frozen)

- Branch `codex/reask-current-artifact`; commit
  **`b96dec60a46dea72af73fd1cdcd4a7a1ff94fe01`** (parents
  `b3d4d90d8` → `d8f5269f4` → `f988fb697` → `182bf57e1`).
- Worktree
  `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/reask-current-artifact`;
  tree **clean**; `backend/core/chat_canvas_editor.py` sha256
  `e08f99b43a0ee3fb2c366ab9e2086150b20b281d5a6c6a6be127f1d5c9cedd0c`.

## Verification level in this record (read this first)

This record establishes the S6 request through the **real route handler**
(`chat_routes.send_chat_message`) with the real orchestrator, real
persistence, and the real history handler, on a scratch DB (the planner
decline seam is stubbed — the same seam prior no-op evidence used).

It is **not** the served/deployed HTTP or browser surface. The owner's
public re-ask on a served build (and any L1 promotion / matrix update)
remains the acceptance owner's step per the review.

## Results

| Check | Result | Evidence |
|---|---|---|
| **Original S6 request** ("Please also update the payment terms in the draft to Net 45." over `Terms: Net 45`) through the real route | **completed** (`success=true`), receipt-derived reply (`Verified on the current draft: payment terms in the draft already set to Net 45. No changes were needed, and nothing was sent.`), **zero additional writes** (audit count unchanged, body untouched), persisted row metadata `outcome=completed`/`success=true`, **fresh history reload agrees** | `route_s6_original_result.json` (+ `route_s6_original_run.log`) |
| Frozen suite route test (`TestReaskNoopThroughRoute::test_already_applied_reask_completes_and_persists`) | 1 passed | `route_s6_verification.log` |
| Focused suite (7 files) | **287 passed, 3 failed** — all three pre-existing and identical on `182bf57e1` (listed in `identity.json`) | `focused_suite.log` |
| `tests/test_noop_completion_authority.py` (owner re-ran 64/64) | 64 passed | owner review |

### Attempt history (preserved regardless of result)

The standalone driver's **first attempt** failed only the history-agreement
assertion (persisted metadata had no outcome) because it did not pin
`CHAT_FINALIZATION_M2=1` / `ATOM_TASK_LIFECYCLE_ENABLED=1`, which the pytest
suite pins in an autouse fixture. That attempt is preserved
(`route_s6_original_result_attempt1_missing_m2flag.json`,
`route_s6_original_run_attempt1.log`); with the flags pinned the full run
passes. The candidate was not at fault for attempt 1.

## Files

- `identity.json` — machine-readable identity, assertions, hashes.
- `run_route_s6_original.py` — the evidence driver (imports the frozen
  suite's helpers read-only; no candidate edits).
- `route_s6_original_result.json` — sha256 `959c4b83…`.
- `route_s6_original_run.log` — sha256 `2a553304…`.
- `route_s6_original_result_attempt1_missing_m2flag.json` — sha256 `c1d22c77…`.
- `route_s6_original_run_attempt1.log` — sha256 `fa1b887e…`.
- `route_s6_verification.log` — sha256 `52e7f1f4…`.
- `focused_suite.log` — sha256 `9461358e…`.

## Reproduce

```
cd <candidate worktree>/backend
TESTING=1 DATABASE_URL=sqlite:////<scratch>/l1.db \
  python3 -m pytest tests/test_fallback_honesty.py \
  -k test_already_applied_reask_completes_and_persists -v

# the original S6 inputs through the real route:
TESTING=1 DATABASE_URL=sqlite:////<scratch>/l1-original.db \
  python3 <this dir>/run_route_s6_original.py
```

## Promotion state

- **L1 not promoted; readiness matrix and support statement untouched.**
- Gate: the owner's instruction — promote L1 only if the served/public
  re-ask passes; update the matrix with the exact tested identity at that
  point.
- The pilot (`:8001`, serving `8c593e57031e`) and `:3000` were not
  touched; no live-world writes.
