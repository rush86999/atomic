# Repeatability & value evaluation — deployed pilot `8c593e57031e` (2026-10-17)

Predeclared protocol: `docs/acceptance/REPEATABILITY_EVALUATION_PROTOCOL_2026-10-17.md`
(committed `18b0dc2a2` BEFORE the run). Harness:
`backend/scripts/orchestration_acceptance/deployment_repeatability.py`.
Run JSON: `repeatability_20261017_224802.json` (+ per-rep screenshots and
fixtures). Served identity verified in-run.

## What the run established (3 fresh ordinary users, live world)

| repetition | sign-in | wizard | upload | **sourced answer** | **draft edit** | wall |
|---|---|---|---|---|---|---|
| r1 | 3.3 s ✓ | 34.2 s ✓ (1 store POST) | 4.1 s ✓ | **QUARTZ-77 from the file** — 82.4 s | ✓ readback + exactly +1 audit — 21.0 s | 151.8 s |
| r2 | 3.3 s ✓ | 34.2 s ✓ | 4.1 s ✓ | **QUARTZ-77 from the file** — 60.6 s | ✓ +1 audit — 21.4 s | 130.2 s |
| r3 | 3.3 s ✓ | 34.2 s ✓ | 4.1 s ✓ | **QUARTZ-77 from the file** — 47.8 s | ✓ +1 audit — 20.5 s | 116.4 s |

Content correctness and the edit lane: **3/3, zero forced extra actions**
(the minimal 5-action interaction set sufficed; no clarifications, no
retries). Median whole-job wall-clock: **130.2 s** per new user.

## The finding the DB cross-check surfaced (and the harness missed)

The harness's `green` criterion scored the answer CONTENT, not the SAVED
STATUS; the captured responses in the run JSON already showed
`success:false` on r1/r2 answers — and the live DB (authoritative) records:

| turn | exec | planner-lane tools | objective_met | status |
|---|---|---|---|---|
| r1 T3 | `8339f868` | **memory** (no verifiable evidence) + context_assembly | False | failed (answer correct) |
| r2 T3 | `5061c2aa` | **memory** (no verifiable evidence) + context_assembly | False | failed (answer correct) |
| r3 T3 | `5a6818b1` | **documents.search** (match_count=4) + context_assembly | **True** | success |
| r1/r2/r3 T5 | `e0e26f63`/`ac35ab0f`/`33508346` | canvas edit lane | **True** | success |

**F-R1 (finding, not certified):** for a document source-ask, the deployed
world's CLOUD planner chose the `memory` lane in 2/3 repetitions — the
answer was correct from the assembled context, but the turn's saved status
resolved failed/unconfirmed. Validated saved status for this ask shape is
planner-dependent (1/3 here; the same variance class as composed run-6 vs
run-7 and the earlier `glm` memory-pick). **F-R2 (harness gap):** the
repeatability `green` criterion must include the settled state
(`objective_met`/`status` from the authoritative record) — it did not, so
the computed `"pass": true` in the run JSON must be read with this README;
the raw responses in the JSON carry the truth. Neither F-R1 nor F-R2 is a
content defect; both are recorded, neither is smoothed over.

## Verdict, precisely

- Supported workflow mechanics on the deployed pilot: **working**
  (setup/provider/upload/edit exactly-once+readback; 3/3; 130 s median;
  zero friction interactions).
- Sourced-answer **content**: 3/3 correct, attributed, from the uploaded
  file. Sourced-answer **saved status**: **1/3 validated** — a named
  limitation of this pilot (repair candidate: requirement-driven tool
  choice for document asks; separate frozen slice).
- Value: 5 required user actions per job, 0 forced extras; waits ≈ 2 min
  total; the source-backed answer and the audit-verified edit reduce the
  manual work while keeping review with the user.

## Artifacts created in the live world (documented)

Three fresh users (`jprobe_*`), three uploaded fixtures (111 bytes each),
three draft canvases (titles "Repeatability draft r1/r2/r3", one audit row
each after the edit).
