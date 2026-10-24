# Predeclared configuration — live-world composed rehearsal

Frozen: 2026-10-23, before launch. This file is the declaration; the
runner records its sha256 and refuses to launch without it. **This
successor has not been launched.** Attempt 5 is the last campaign and
remains non-passing (57/59; S3 broader scope/date). Attempts 3–5 are
preserved.

## Candidate and runtime pin

- Worktree: `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/l3-required-read-timeout`
- Branch: `fix/l3-required-read-timeout`
- Frozen product commit: `f09766d5c578d3d299a3b5c020f627ee53bfb32d`
  (`fix(chat): treat line-numbered VFS full text as internal evidence`), built
  on `b0bee5dbf` (the attempt-3 pin `2a113d1a3` plus the reviewed S7
  settlement correction).
- Frozen successor gate harness: `f2f8329971129bc14e9f107aa234b98db7f18379`
  (`acceptance: capture S7 prior identity per run and accept honest
  restarts`), with the gate module hash
  `6d66d0b8b3b2c9a24efbe111a750c477f623a207d34692dcd4fa07cfceb88dd2`
  (dynamic captured-prior text; fixture wording remains accepted).
- Database: the verified pre-cutover 786 MB snapshot restored into the
  isolated scratch. Auxiliary LanceDB/atom-memory stores are fresh;
  scheduler, ingestion sync, Telegram polling and org sharing are
  disabled. The live pilot DB is never opened by the rehearsal server.
- Provider/config parity: the acceptance declared env (DeepSeek
  structured interpretation + local Ollama reply, fastembed, scratch
  BYOK). The authorized DeepSeek operator credential is registered
  through the product before the first ask. The local Ollama model is
  warmed before the first turn, and a new `provider_reply_parity` check
  requires L3/S3/S7 replies and all streamed reply routes to use Ollama;
  a DeepSeek fallback is a parity failure, not a pass (the attempt-3
  trace exposed cold-start fallback).
- Launch HEAD: the harness commit that contains this declaration; the
  runner records the actual `head_at_launch` and `harness_commit`.
- Product source hashes (the runner aborts on any mismatch):
  - `backend/core/chat_tool_planner.py`
    `807dd65eb83fe7676ac29fba475ef188cac6ad82146c02321d66564a023414c5`
  - `backend/integrations/chat_orchestrator.py`
    `8a44f874a5e51efb310652671cd86db0c3034633ba05436598f414caa75d4a97`
  - `backend/core/answer_boundary.py`
    `2c6a7a044b246da7398c00d5c456626a31f6fdec819d923778f8ec0acbd42ffd`
  - `backend/integrations/chat_routes.py`
    `d86d0be9334e8927c6811b998a5cc8c28a3b535d03cace57e8f9529679ffa0e0`
  - `backend/core/chat_canvas_editor.py`
    `5f724ceb645cff36718c13a5c6a3cb3de2417f63f9b2e04cc5be84c55170dece`
  - `backend/core/workbook_read_artifact.py`
    `db23d66749eb79ed37f0011b96b0096ad0e746cc0c981fd5f5f6edb89889da67`
  - `backend/core/turn_decision.py`
    `79940f7b460dedd53f8d1c3fb26dbd7f153a46f078f0fae411d23473b7e5d42a`
- The runner verifies `git diff 561907d4f..HEAD -- backend/core
  backend/integrations` is empty, every source hash matches, the gate
  module hash matches the reviewed harness, and the worktree is clean.
  It aborts on any unexplained difference.

## What changed from attempt 4

The experiment is unchanged: same DeepSeek-direct structured route,
DeepSeek edit planning, local Ollama reply, local fastembed embeddings,
same requests, fixtures, distractor document, and deadlines. The live
rehearsal now has a 60th check for reply-route parity plus an Ollama
warm-up before the first turn. The
successor adds only the reviewed repairs from attempt 5:

- **S7 prior identity is captured per run.** Between S3 and S7 the runner
  captures the durable open obligations from THIS run and passes them as
  `expected_prior`; the gate matches actual S7 open questions by
  question_id + source_operation + next_action + kind. It never derives
  the expected identity from S7's own list. Cross-run tests use different
  generated UUIDs.
- **Restart agreement is partial-aware but exact.** The reload must
  reproduce the accepted pre-restart outcome, success, content, execution
  identity, status, and delivery record. Completed and the reviewed
  partial are legitimate; an arbitrary partial fails because the S7 gate
  must have accepted it.
- **Comparison scope and truthfulness.** An explicit "flag anything
  that differs" recovers the broad comparison obligation even when the
  interpretation named only the primary field; explicit narrowing still
  wins. When the comparison itself was not recorded, a reply asserting a
  match/difference is replaced by a draft-grounded limitation naming the
  retrieved source and leaving the broader comparison OPEN. No fabricated
  source value ships.
- **L3 answer boundary.** All internal carriers are removed: the
  `LIVE TOOL RESULTS` header shapes (parenthesis, em-dash grep, colon)
  and a run of line-numbered VFS full-text lines (`L1:`/`L2:`), which the
  reply model may echo as prose. A single-line citation is left alone.
  Substantive prose is preserved; a fallback uses only a unique structured
  association or an explicit limitation.
- **S3 figure grounding.** The guard reads the passed canvas context as
  well as the local one; empty local serializations are skipped, and
  conflicting canvas identities/revisions are not silently chosen. The
  figure check is attribution-aware (canvas vs tool source), and a
  source-unsupported or misattributed figure still triggers correction.
  The 95-second turn budget is unchanged.

## Sequence (unchanged; all legs, no skipping)

1. Upload `approved_records_q2026_114.txt` and
   `l3_zephyr9_fixture.txt`; the L3 fixture carries the distractor
   `BASALT-13`.
2. L3 sourced answer in session A:
   `search my uploaded documents for the launch code for project Zephyr-9 and tell me the code`.
3. Create the draft; seed `Terms: Net 45`, `Valid until: 2026-12-31`,
   unit price `$48,000.00`.
4. Edit in session A: `Please update the payment terms in the draft to Net 30.`
5. Identical re-ask in session A (no-op, zero additional writes).
6. Comparison in fresh session B:
   `Compare the draft quotation with my uploaded Approved Records document. Does the Valid Until date in the draft match the approved record? Flag anything that differs. Do not change anything yet.`
7. Date-only continuation in session B:
   `What is the current Valid until date on the draft, and does it still match the approved record?`
8. Restart/reload both conversations, canvas, audits, and durable rows.

The S3/S7 legs are not optional and are not replaced by another
configuration. An honest S7 partial passes only under the reviewed
prior-obligation rules and cannot compensate for S3 timing out or failing
its comparison gates.

## Isolation

- Scratch root:
  `.../l2-fix/scratch/l1-l2-l3-live-rehearsal-20261023`
- Port: `8121` (pilot stays on `:8001`; no frontend process).
- New artifact names: `live_rehearsal_config.json`, `live_rehearsal_result.json`,
  `live_rehearsal_summary.json`, `live_rehearsal_run.log`,
  `live_rehearsal_server_pre.log`, `live_rehearsal_server_restart.log`,
  `live_rehearsal_observation_pre.jsonl`,
  `live_rehearsal_observation_restart.jsonl`,
  `live_rehearsal_interpreter_freeze.txt`, `live_rehearsal_preflight.json`.
- All stores resolve under the scratch root; the live DB is never a
  configured store. Pilot `:8001` must keep the same instance/PID;
  `pilot_untouched` is a gate.

## Pre-campaign requirements

A future launch is allowed only after `preflight_attempt5.py` passes and
the focused suites cover:

- cross-run S7 gate tests with different generated UUIDs;
- captured L3 output replay (served == persisted == reloaded; envelope
  stripped; supported fact/source present; changed subject/code,
  multiple subjects, explicit-both controls);
- captured S3 grounding replay (draft-supported figure does not trigger
  regeneration; source-unsupported/misattributed still does);
- persistence/restart agreement for completed and reviewed partial;
- zero-write controls from the captured attempt-4 result.

The preflight must also prove the intended product pin is accepted, the
obsolete attempt-4 pin/hash is rejected, artifact/scratch paths are fresh,
the gate module hash is the reviewed one, and the pilot/credential checks
pass. No campaign is launched by this declaration.

## Assessment

The last fresh-scratch attempt (7) passed 59/59 on product 910bf85a6.
This rehearsal is deliberately on the live-world shape, not fresh
scratch, and is not a cutover. Deployment remains held until this
passes, focused review passes, and a new explicit cutover approval is
given.

## Evidence to record when/if launched

`live_rehearsal_preflight.json`, `live_rehearsal_config.json`,
`live_rehearsal_result.json`, `live_rehearsal_summary.json`, `live_rehearsal_run.log`,
server/observation files, interpreter freeze, live-DB fingerprint/holders,
and `CHECKSUMS_ATTEMPT5.sha256`. Attempt-4 evidence is not rewritten.
