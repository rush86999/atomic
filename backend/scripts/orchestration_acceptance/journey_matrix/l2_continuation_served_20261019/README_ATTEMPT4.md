# L2 continuation-evidence — served acceptance ATTEMPT 4 (2026-10-19) — NOT PASSED (S3 turn budget; S7 target demonstrated)

**What this is.** The predeclared S3→S7 repeat on the
diagnostic-selected successor
**`491afa936e90f493061c929e06bb9e248deb9b79`** (parent `ef4b8ccf6`):
interpretation pinned to the measured `opencode-go/qwen3.8-flash` route
via the existing pinned-planning wrapper (unpinned fallback), bounded
**65s** deadline; verified-field narration guard; 5,500-token ceiling,
reasoning-off, MoA opt-out, trace id and source-resolution contract
unchanged.

**Result: NOT PASSED.** The interpretation bottleneck is fixed — both
calls dispatched, completed within the 65s bound (S3 25.8s, S7 35.2s),
produced valid records, and resolved the source identity. **S7 completed
truthfully with a resolved source identity.** **S3 then failed on the
turn's reply-leg clock** (budget error, no reply), so the S3
truthful-narration gate and prior-evidence carrier were never produced.
No promotion; L2 remains open.

## Stage record

| Stage | S3 | S7 |
|---|---|---|
| `dispatch_attempted` | ✔ `opencode-go/qwen3.8-flash` cap=5500 | ✔ same |
| `completed_within_deadline` | ✔ 25.8s (`[structured-trace]` valid) | ✔ 35.2s (valid) |
| `producer_output_valid` | ✔ `llm:qwen3.8-flash`, sources `["Approved Records document"]` | ✔ sources `["approved_records_q2026_114.txt"]` |
| `source_identity_resolved` | n/a | ✔ requirement identity resolved to `approved_records_q2026_114.txt` (`doc_3abaf0d03badbc965b0f2770`), composition resolved |

## S7 — the certification target

- Execution `5d9e5093-6ed0-4a03-a407-78137368d099`; settlement
  `success=true`, `outcome=completed`; `context_fulfillment.state=completed`,
  `supplied_fields=["expiration_date"]`, matched
  `approved_records_q2026_114.txt`.
- Reply carries `2026-12-31` and the live `documents.search` receipt for
  the fixture; zero new canvas writes, draft unchanged, explicit
  response/persisted-row/fresh-history agreement.
- `s7_truthful_comparison`, `s7_requirement_captured`,
  `s7_settlement_basis` and `s7_response_persisted_fresh_history_agreement`
  all true. The base `s7_resolved_source_identity` check is false only
  because it requires the **prior S3** observation execution id; S3
  produced no such carrier. The requirement's own identity and the
  composition marker are resolved.

## S3 — first failed transition (turn clock)

- Interpretation completed valid in 25.8s; the reply leg started at
  27.6s and ran 36.4s (elapsed 64.0s), then the turn clock (68s reply-leg
  cap) enforced an honest timeout: **"This turn ran past its time budget
  before a reply could be generated."**
- Raw turn POST latencies (preserved result): **S3 95.07s**, **S7
  73.21s**. The first post-processing pass recorded poll timestamps as
  latency; this was corrected post-hoc to the POST latency. The raw poll
  list remains in `attempt4_result.json`. S3 crossed the ordinary 95s
  turn budget; S7 fit.
- Consequences: no S3 assistant reply content, no S3 evidence
  requirement/observation carrier, `s3_verified_narration=false`,
  `prior_evidence_observed=false`, S3 settlement/agreement unset.
- The verified-field narration guard was **not exercised on S3** because
  no model reply existed to guard. The interpretation route/deadline is
  no longer the bottleneck; the remaining reply/planning leg is.

## Guards

- `pilot_untouched` true; zero canvas writes/draft unchanged; S7
  agreement true.
- `live_db_unchanged` false again: the attempt's user/session/S7
  execution rows are present in the scratch DB and **absent from the live
  DB** (0/0/0). The live change is external pilot activity; the guard
  boolean remains false and is not discarded.

## Disposition

L2 remains open; no promotion. The measured execution change did what it
was selected for (interpretation completes and resolves), and the S7
target is demonstrated. The next repair is the **S3 reply/planning leg's
share of the turn budget** (or a faster reply route), not another
interpretation change. The verified-field narration guard remains
unproven on the served S3 shape until a reply exists.

## Files

- `PREDECLARED_CONFIG_ATTEMPT4.md`, `run_l2_served_attempt4.py`.
- `attempt4_config.json`, `attempt4_result.json`,
  `attempt4_observation.jsonl`, `attempt4_server.log`,
  `attempt4_interpreter_freeze.txt`.
- `summary_attempt4.json` (stages + latency + narration record).
- `CHECKSUMS_ATTEMPT4.sha256`.
- Attempts 1–3 and the corrected attempt-2 assessment remain
  byte-identical and checksum-valid.
