# Live-world composed rehearsal — attempt 4: reply-route parity failed

**Result: NOT PASSED (59 original checks true; the new
`provider_reply_parity` check false). Cutover approval was received but
was NOT executed. The pilot remains the restored `8c593e57031e` build;
the rollback stays in place.**

## Identity

- Product `f09766d5c578d3d299a3b5c020f627ee53bfb32d`
- Runtime/launch HEAD `9cffe4fcb8db` (clean)
- Live gate `6d66d0b8…`; isolated 786 MB snapshot; writers disabled; port 8121
- Ollama warm-up succeeded (HTTP 200, 5.91 s, response present)

## Result

- L3, edit, re-ask, S3, S7, restart, delivery/settlement, live-DB
  isolation, and pilot isolation all passed (59 checks).
- **`provider_reply_parity=false`**:
  - L3 reply: `deepseek/deepseek-v4-pro`
  - S3 reply: `deepseek/deepseek-flash`
  - S7 reply: `ollama/llama3.1:8b`
  - Two “chat streaming produced no tokens — falling back” events for
    L3/S3; Ollama accepted the stream then produced no tokens, and the
    orchestrator fell back to DeepSeek. The warm-up did not prevent it.
- This means the declared **local Ollama reply** route is not proven for
  L3/S3; the release cannot be certified as the declared configuration.
- All functional checks (including the L3 no-decoy answer and S3/S7
  settlements) passed; this is a provider-parity failure, not an answer
  or read failure.
- `live_db_isolated=true`, `pilot_untouched=true`; pilot DB fingerprint
  drift is its own background writes; candidate scratch held no live DB
  handle.

## Decision

Do not cut over under the current declaration. The prior approval was
based on the attempt-3 report’s inaccurate “reply route Ollama” claim;
the parity check now makes that visible. The next decision is one of:

1. **Keep the hold and repair/declare the Ollama reply route** (warm-up
   alone is insufficient; the local engine produces no first tokens for
   these prompts within the existing guard), then re-rehearse.
2. **Declare a new configuration with DeepSeek as the reply route** and
   re-verify all checks on that exact declaration (this is a provider
   configuration change requiring approval).
3. Keep the old pilot indefinitely.

No deadline was widened, no provider was switched silently, no corpus
was pruned, and no integration was disabled.

## Evidence

`release_evidence_20261023/live_world_rehearsal_attempt4/` (result,
summary, config, run log, preflight, checksums). Full server logs remain
outside the repository.
