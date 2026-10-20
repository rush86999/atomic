# L2 continuation acceptance — ATTEMPT 12 (2026-10-19)

**Status: PASSED — PROMOTED.** The complete S3→S7 chain passed all 29
predeclared checks on candidate `c0cbea9f1` in the declared DeepSeek-direct
configuration. The request-bound comparison-scope + settlement repair is
verified through the served API.

## Lineage

- `495099362` — delivery validation separated from request-bound
  obligations.
- `b70f9fa65` — request-bound completeness (attempt 10): S3 passed
  (broader obligation open, truthful deterministic narration, zero
  writes), S7 failed `s7_date_only_not_completed` — the accepted S7
  interpretation inherited the prior turn's generic constraint
  ("Flag anything that differs") and the adapter expanded the date
  contract to `payment_terms`/`price`, so the date-only follow-up
  settled partial.
- `c0cbea9f1` — field-scope repair: a comparison is broad only when the
  accepted **requested-fields contract** names OTHER fields ("any
  differing fields", "all comparable quotation fields"); a generic
  difference constraint about the requested date stays narrow; explicit
  narrowing/negation still wins; degraded/unresolved interpretations
  fall back to message-shaped scope so broad obligations are not lost.
- Attempt 11 (same candidate) was environment-blocked: every
  opencode-go interpretation call returned HTTP 429
  `GoUsageLimitError` (monthly workspace quota). Preserved, not promoted.
- Attempt 12 (this record) ran the unchanged job on the **declared
  DeepSeek direct API** after operator direction. Pre-run dispatch probe
  (`probe_deepseek_dispatch.json`): product registration HTTP 200,
  discovered catalogue (`deepseek-flash`, `deepseek-v4-pro`),
  interpretation reached `deepseek/deepseek-v4-pro` with a schema-valid
  record.

## Configuration

- Candidate `c0cbea9f1` (parent `b70f9fa65`; branch
  `codex/l2-continuation-evidence`; tree clean; runtime identity
  `c0cbea9f191a`, `dirty=false`).
- Provider substitution declared before the run: **DeepSeek direct**
  (`https://api.deepseek.com/v1`), operator vault row
  `tenant_default_deepseek_default_production` registered through the
  product (`store_http=200`, `active=true`; no credential value
  recorded); `ATOM_TURN_INTERPRET_PIN=deepseek:deepseek-v4-pro`;
  content-free capture enabled (`ATOM_TURN_INTERPRET_CAPTURE=1`).
- Fresh scratch world `l2-continuation-served-attempt12`, port 8108;
  65 s interpretation bound (code default); same fixture, draft in the
  original S7 state, original S3 comparison then original S7
  continuation. Pilot `:8001`/`:3000` and the live DB guarded before and
  after.

## Result — 29/29 predeclared checks true

Both turns interpreted on the real pinned model (`origin=llm:deepseek-v4-pro`).

**S3 (63.55 s)** — outcome `partial`, `success=true`, deterministic
renderer alone:
`expiration date: draft 2026-12-31 = approved_records_q2026_114.txt
2026-12-31 (match)`; `payment terms`/`price` explicitly named as
unverified gaps ("a match or difference cannot be claimed"); no global
consistency claim; `Broader comparison obligation: OPEN — the unassessed
fields above remain to be verified`; zero canvas writes; draft
unchanged; requirement captured; agreement true.

**S7 (49.41 s)** — outcome `completed`, `success=true`:
interpretation `scope_change=continue` with a resolved read-only action;
requirement resolved to `approved_records_q2026_114.txt`
(`doc_3abaf0d03badbc965b0f2770`); accepted comparison scope stayed
**narrow** (`broader_comparison=false`, fields `[expiration_date]`);
`context_fulfillment=completed` (`supplied_fields=[expiration_date]`);
verified reply carries the date match; zero new writes; draft
unchanged; capture archived; fresh-history agreement true.

Guards: `live_db_unchanged=true`, `pilot_untouched=true`,
`total_turn_latency_within_budget=true`.

## Disclosures (not promoted)

- **S3's broader obligation remains OPEN by design** and is named in the
  reply — the promoted claim is the request-bound scope + settlement
  repair, not the whole-document "flag anything that differs" comparison.
- **Provider substitution:** the declared route for this run is DeepSeek
  direct because the opencode-go monthly quota was exhausted (attempt
  11). The claim is bound to this declared configuration, not to the
  pilot's opencode-go route; pilot deployment and restart durability are
  not claimed.
- The prior typed-field continuation/guard-order claim on `d0b707333`
  remains as lineage evidence.

## Evidence

`PREDECLARED_CONFIG_ATTEMPT12.md`, `run_l2_served_attempt12.py`,
`attempt12_config.json`, `attempt12_interpreter_freeze.txt`,
`attempt12_observation.jsonl`, `attempt12_result.json`,
`attempt12_runner_stdout.log`, `attempt12_server.log`,
`summary_attempt12.json`, `probe_deepseek_dispatch.py` /
`probe_deepseek_dispatch.json` / `probe_deepseek_observation.jsonl` /
`probe_deepseek_server.log`, `CHECKSUMS_ATTEMPT12.sha256`.
