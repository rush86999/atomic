# Live-world composed rehearsal — attempt 2

**Result: NOT PASSED (52/59). Deployment remains held; the pilot is
untouched. No cutover package or new approval request is being made.**

## Identity

- Product tree: `241d0f8e62fa5fa3b9aadc0b056c19b07610c3c1`
- Rehearsal HEAD / runtime: `f31dcf8fa0ff` (clean, `dirty=false`)
- Gate: `successor_gates_live.py`, hash
  `6d66d0b8b3b2c9a24efbe111a750c477f623a207d34692dcd4fa07cfceb88dd2`
  (frozen `successor_gates.py` remains unchanged for attempts 3–7)
- World: verified pre-cutover 786 MB snapshot; fresh isolated auxiliary
  stores; scheduler/ingestion/Telegram/org-sharing disabled; port 8121.
- Provider: authorized DeepSeek credential through the product; declared
  env; no provider switch/deadline change.

## What passed

- L3 HTTP/receipt/objective/settlement: `documents.search` executed,
  receipt verified and bound; **only the answer content check failed**.
- Edit, identical re-ask, S7 date-only continuation, and restart:
  - edit one write, postcondition verified;
  - re-ask no-op `already_satisfied`, zero writes;
  - S7 **completed**, date scope supplied, settlement basis and restart
    agreement passed (the new live gate's captured-prior text handling
    fixed the attempt-1 false negative);
  - restart history/execution/canvas/write checks passed.
- `live_db_isolated=true`, `pilot_untouched=true`; no candidate holder of
  the live DB. The top-level `live_db_unchanged=false` reflects the
  pilot's own background writes (pid 50500 held the DB throughout), not
  the rehearsal server; the candidate scratch process held no live DB
  handle.

## Failures

### 1. L3 answer leaked the decoy (first failure)

The answer was:

> The launch code for Project Zephyr-9 is **QUARTZ-77**.
>
> Source: `l3_zephyr9_fixture.txt` (ingested document). Note: the same
> file flags the archive key for Project Halcyon-2 as a decoy — that one
> is `BASALT-13`, not the Zephyr-9 launch code.

`l3_answer_correct=false` because `BASALT-13` appears in the user-facing
answer. The required document read was correct; the model volunteered an
unrequested decoy. No envelope/carrier was involved. This is a
generation/answer-contract issue, not the authority fix.

### 2. S3 comparison timed out before a reply

The S3 turn spent the full budget in interpretation:

- DeepSeek `deepseek-v4-pro` dispatch, then a cascade exhaustion /
  `deepseek-flash` attempt canceled after 8.4 s;
- total S3 85.2 s, answer `"This turn ran past its time budget before a
  reply could be generated."`;
- all six S3 comparison checks false (truthful date, broader open,
  settlement basis, requirement captured, interpretation DeepSeek,
  history agreement).

This is a live provider-cascade/latency failure on the S3 turn, not a
document-read failure. The earlier single-request diagnosis and the S7
turn both completed within budget. No deadline was widened.

## Provider/config parity

Effective structured routes were DeepSeek variants; S7's reply used
`deepseek-v4-pro`; the L3/edit/reask reply routes were not all the
declared local Ollama engine. Reply-engine parity remains unproven for
the live provider catalog.

## Decision

- The live-world composed workflow has **not** passed; do not prepare a
  cutover package or request a new cutover approval.
- Keep the rollback and the pilot as-is.
- Next local work: make a direct single-subject answer omit unrequested
  decoy content at the generation/answer-contract boundary, and add a
  provider-readiness/interpretation-latency control for S3; rerun the
  live-world rehearsal after those changes. Do not widen the deadline,
  prune the corpus, or disable integrations to force a pass.

## Evidence

`release_evidence_20261023/live_world_rehearsal_attempt2/`:
`live_rehearsal_result.json`, `live_rehearsal_summary.json`,
`live_rehearsal_config.json`, `live_rehearsal_run.log`, preflight, and
checksums. Full server logs remain outside the repository (they contain
live provider/integration output).
