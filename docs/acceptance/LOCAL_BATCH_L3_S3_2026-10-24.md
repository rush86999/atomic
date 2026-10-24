# Local batch — L3 answer scope and S3 transport (2026-10-24)

**Status: code/controls landed; no new rehearsal or cutover. The pilot is
untouched and the previous cutover approval was NOT executed (attempt-4
reply-route parity block).**

## Managed checkout restored

The candidate worktree's `.git` link had been lost while its branch/objects
remained in the main repository. I recreated a managed worktree from the
main repository (`git worktree prune` + `git worktree add
fix/l3-required-read-timeout`); `git rev-parse`/`status` now work and no
Git metadata was hand-edited. The broken directory is preserved at
`…/l3-required-read-timeout-broken-20261024`.

## L3 answer contract at generation

The previous static scope sentence was replaced by an instruction derived
from the **accepted request's** subjects/fields, carried on the evidence
requirement as `scope`:

- Single requested subject: answer only that subject/field, include the
  source, do not volunteer unrelated facts or decoy explanations.
- Changed subjects/codes: the instruction contains only the accepted
  values (tests use Vega-4/Lyra-8; no fixture literals).
- Two explicitly requested subjects: both are named as in-scope.
- Explicit conflict/decoy/difference request (`broader_comparison` or
  conflict vocabulary in the accepted scope): the comparison variant is
  used, so the user can ask for the conflicting material.
- The instruction is appended to the actual generation system prompt from
  the execution-keyed requirement; a test calls `_get_qwen_response` with a
  mocked LLM and inspects the constructed system message.
- No `BASALT-13` blacklist, no “Note” stripping, no lexical sentence
  selection.

Tests: `test_document_scope_authority.py` (15 passed) plus the 102-test
focused suite; no gate/deadline changes. Product commit `64fd750bc`;
successor re-pinned in the rehearsal harness.

A bounded **real-model** replay of the captured L3 input was not completed:
the manual scratch replay selected the wrong provider route (OpenRouter
GLM 402) because the isolated BYOK/pin setup was not the declared one; its
result is not counted. The prompt/message construction is covered; the
next isolated replay must run with the declared DeepSeek BYOK and pin.

## S3 transport diagnosis

From the preserved attempt-4 trace (one successful S3):

- pin/route: one `deepseek/deepseek-v4-pro` structured dispatch;
- one successful `structured-trace` at 50.7 s, valid `_Interpretation`;
- no structured retry, compatibility recovery, or fallback before the
  reply; S3 total 83.95 s; reply fallback to DeepSeek because Ollama
  produced no tokens.
- The earlier attempt-2 S3 timeout preserved only the summary (v4-pro
  dispatch, cascade exhaustion, a `deepseek-flash` attempt canceled after
  8.4 s); individual HTTP statuses were not preserved. A new instrumented
  replay is required; the manual replay above was invalid.

A turn-stage control is now in place: `_interpretation_wait_seconds`
caps interpretation at
`min(ATOM_INTERPRETATION_MAX_SECONDS=75,
deadline.remaining() - 35 s reply/finish reserve)`.
The 35 s reserve is measured from the live-world S3 (interpretation 50.7 s,
total 83.95 s) and L3/S7 traces. The cap prevents interpretation from
starving reply/finalization; it does not make a slow route adequate and
does not extend the 95 s deadline. The outer wait bounds **waiting only**;
synchronous HTTP workers may continue after cancellation (the logs record
`worker_may_still_run=true`). It does not establish that workers stop or
that every nested retry is budgeted.

## Configuration parity — unresolved blocker

Attempt 4 showed L3/S3 reply routes fell back from local Ollama to DeepSeek
(no Ollama tokens), while S7 used Ollama. This is the same parity blocker
that stopped the cutover; it is **not** fixed by this batch. No new
rehearsal is being run and no cutover package is being promoted until the
declared reply route is either made reliable or explicitly re-declared and
re-verified.

## Next gate

1. Instrument/replay the captured S3 request with the declared DeepSeek BYOK
   and pin; record per-attempt HTTP status, compatibility/schema/cancel,
   and validate the new reserve.
2. Resolve Ollama reply parity (or predeclare an actual fallback profile)
   and record intended vs actual interpretation/planning/reply routes.
3. Re-run the bounded L3 prompt replay with the declared model.
4. Freeze/review, then one live-world rehearsal; no cutover until it passes.
