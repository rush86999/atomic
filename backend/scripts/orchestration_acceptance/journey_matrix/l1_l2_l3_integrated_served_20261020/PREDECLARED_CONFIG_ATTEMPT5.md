# Predeclared configuration — composed served attempt 5 (repaired successor)

Frozen: 2026-10-23, before launch. This file is the declaration; the
runner records its sha256 and refuses to launch without it. **This
successor has not been launched.** Attempt 4 remains the last campaign and
remains non-passing; see `ATTEMPT5_ASSESSMENT.md`.

## Candidate and runtime pin

- Worktree: `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/l3-required-read-timeout`
- Branch: `fix/l3-required-read-timeout`
- Frozen product commit: `22af424a07d84a21c62eb7bb97046d98a01d3d14`
  (`fix(chat): simplify the answer boundary to removal plus structured fallback`), built
  on `b0bee5dbf` (the attempt-3 pin `2a113d1a3` plus the reviewed S7
  settlement correction).
- Frozen successor gate harness: `f2f8329971129bc14e9f107aa234b98db7f18379`
  (`acceptance: capture S7 prior identity per run and accept honest
  restarts`). The gate module is pinned by hash in the runner and
  preflight.
- Launch HEAD: the harness commit that contains this declaration; the
  runner records the actual `head_at_launch` and `harness_commit`.
- Product source hashes (the runner aborts on any mismatch):
  - `backend/core/chat_tool_planner.py`
    `0b6294a6c1e3493e91a94db35af0187126a870297f5e78c144472b270cda7c13`
  - `backend/integrations/chat_orchestrator.py`
    `6e6c51facb8cb5fa34e1e012ed1d1511db69cf27ac5229622c27821c9a387cf4`
  - `backend/core/answer_boundary.py`
    `2d27f369475540013b59ae00cd643fd077fca35a152ad978df7648f6c7994997`
  - `backend/core/chat_canvas_editor.py`
    `5f724ceb645cff36718c13a5c6a3cb3de2417f63f9b2e04cc5be84c55170dece`
  - `backend/core/workbook_read_artifact.py`
    `3158d329cd3fdfbaa69fdda250c403ba9f694a10430f45d1fb42a026d9298a29`
  - `backend/core/turn_decision.py`
    `79940f7b460dedd53f8d1c3fb26dbd7f153a46f078f0fae411d23473b7e5d42a`
- The runner verifies `git diff 22af424a0..HEAD -- backend/core
  backend/integrations` is empty, every source hash matches, the gate
  module hash matches the reviewed harness, and the worktree is clean.
  It aborts on any unexplained difference.

## What changed from attempt 4

The experiment is unchanged: same DeepSeek-direct structured route,
DeepSeek edit planning, local Ollama reply, local fastembed embeddings,
same requests, fixtures, distractor document, and deadlines. The
successor adds only the reviewed repairs:

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
- **L3 answer boundary.** The internal `LIVE TOOL RESULTS` envelope is
  stripped from the user-facing answer. Substantive prose is preserved
  unchanged; a fallback renders only a uniquely supported structured
  subject → field → value → source association, otherwise an explicit
  limitation. Word-overlap ranking and token presence are not authority.
  Full evidence remains on the turn; ordinary quotations are preserved.
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
  `.../l2-fix/scratch/l1-l2-l3-composed-attempt5`
- Port: `8115` (pilot stays on `:8001`; no frontend process).
- New artifact names: `attempt5_config.json`, `attempt5_result.json`,
  `attempt5_summary.json`, `attempt5_run.log`,
  `attempt5_server_pre.log`, `attempt5_server_restart.log`,
  `attempt5_observation_pre.jsonl`,
  `attempt5_observation_restart.jsonl`,
  `attempt5_interpreter_freeze.txt`, `attempt5_preflight.json`.
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

`ATTEMPT5_ASSESSMENT.md` records the corrected harness assessment. It
remains **non-passing** because the last served campaign (attempt 4)
failed L3 and S3; the local repairs/replays do not constitute a served
pass. Deployment remains held.

## Evidence to record when/if launched

`attempt5_preflight.json`, `attempt5_config.json`,
`attempt5_result.json`, `attempt5_summary.json`, `attempt5_run.log`,
server/observation files, interpreter freeze, live-DB fingerprint/holders,
and `CHECKSUMS_ATTEMPT5.sha256`. Attempt-4 evidence is not rewritten.
