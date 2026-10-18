# L1/S6 authorized-route attempt 7 — preserved failure

Candidate: `b96dec60a46dea72af73fd1cdcd4a7a1ff94fe01`, unchanged.
User explicitly authorized only the existing operator/global opencode-go credential
for one declared isolated preview attempt including existing continuation retries.
The credential was decrypted in memory and registered through the scratch product
API. No live vault copy or mutation; no pilot restart. An explicit scratch
BYOK encryption-key path was added to the harness. No runtime/model-prompt changes.

## Result

The authenticated original S6 request reached the served app. Provider registration
returned 200. A real opencode-go/qwen3.8-flash structured call reached
`https://opencode.ai/zen/v1/chat/completions` and returned 402:
`Upstream request failed: Insufficient account funds`. The provider then entered
its existing cooldown. The continuation exhausted its existing three attempts;
no verified no-op was reached. No second acceptance run was launched.
The intended pin was `opencode-go/deepseek-v4-pro`; it did NOT appear in the
observed dispatch log. Intended routing is not recorded as actual attribution.

The harness keeps its original fixed settlement observation window. Its
`noop_receipt_evidenced` predicate includes a reply-text fallback; because it
was false here it establishes no receipt claim. A future green run must inspect
actual structured receipt evidence as well as public/persisted outcomes.

## Diagnosis and limits

The frozen handler defaults to `/zen/v1`. Current OpenCode documentation lists
DeepSeek Go at `/inference/go/openai/v1/chat/completions`:
https://opencode.ai/v2/docs/console/go/#endpoints
This is a configuration mismatch, not a proven endpoint A/B diagnosis. Do not
infer that funding the account or rotating the key is necessary from this alone.
No endpoint, pin, credential, or runtime adjustment was made mid-attempt.

L1 remains unverified. Matrix and support statement unchanged. Earlier attempts
1–6 remain in their original archive. The product failure and harness observations
are recorded separately in summary.json and attempt7_result.json.

## Preservation

Configuration, dependency freeze, result, driver, guard snapshots, and checksums
are retained here. Raw logs are gitignored; their hashes remain in CHECKSUMS.sha256.
Exact authorized-key and JWT-like scans passed before archival. All writable
product stores used a new scratch world; server teardown belongs only to the
launched child process. Live DB/vault/encryption-file hash and mtime guards are
recorded in live_store_guards_after.json.

## Independent harness qualifications

The reported `persisted_matches=true` compares absent/null final outcome and
success fields. It is not accepted as proof of explicit persisted-state agreement.
The terminal assistant row and served history lack those fields in this failure
path. Poll `t` mixes wall-clock and monotonic clocks, so it is not elapsed time.
Neither predicate was changed mid-attempt; raw results are preserved, with these
qualifications recorded in summary.json. The overall run remains failed.
