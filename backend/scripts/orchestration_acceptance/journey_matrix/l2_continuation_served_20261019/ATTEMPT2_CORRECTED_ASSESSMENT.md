# Attempt 2 — corrected assessment (2026-10-19)

**This is a post-hoc correction of the evidence labels. No new request was
issued; the raw attempt record (`attempt2_result.json`,
`attempt2_observation.jsonl`, `attempt2_server.log`, `attempt2_config.json`)
is preserved unchanged.**

## Stage record (corrected)

| Stage | Result | Evidence |
|---|---|---|
| `dispatch_attempted` | **true** | `[structured-dispatch] opencode-go/glm-5.3-flash route=structured-3479572a7576 attempt=1 prompt_chars=2187 ...` and `... structured-f19b24cfd859 ... prompt_chars=11945` (S3/S7); later `qwen3.8-flash`; 8 Zen chat posts, 0 Go-inference posts. |
| `completed_within_deadline` | **false** | `[turn-interpretation] timeout` for both turns; no `[structured-trace]` for those interpretation route ids before the 12 s `asyncio.wait_for` deadline. |
| `producer_output_valid` | **false — not reached** | The interpretation record is `origin="unresolved"`, `unresolved_reason="timeout"`, `sources=[]`; the producer-corrected output contract was never exercised. |
| `source_identity_resolved` | **false — not reached** | S7 requirement `required=false`, `sources=[]`, `identity.state="kind_only"`; no composition marker. |

**Corrected diagnosis.** The interpreter DID dispatch. The failure was
**completion within the 12-second deadline**, not dispatch. Provider
latency is involved (attempt 1's calls completed at 9.6 s / 9.2 s), but
the application request settings also need attention: the call passed
`model="fast"` (which does not select or pin a fast model — the explicit
`task_type="planning"` does), and it omitted `disable_reasoning` and an
explicit `max_tokens`, leaving the handler's reasoning-allowed / 6,000-token
default. The producer correction remains **unverified through the served
path**; attempt 2 is not evidence against it.

The earlier gate label `real_interpretation_dispatched` conflated
"dispatched" with "completed"; it is superseded by the four stages above.
The raw result's boolean is retained for audit, not as the diagnosis.

## Separate correctness failure — the wrong date

The S3 reply said the approved date was `2026-12-30`; the fixture says
`2026-12-31`. Trace through the preserved attempt:

```text
retrieved record        approved_records_q2026_114.txt
                        → content: "Approved valid until: 2026-12-31"  ✔
excerpt supplied to      the same full 279-char record in the turn's
narration                memory_context                              ✔
draft context            "Valid until: 2026-12-31"                    ✔
generated reply          "Approved valid until: 2026-12-30"          ✘
persisted reply          same wrong date                              ✘
```

The first divergence is **narration fidelity**: the reply model received
the correct date and emitted a different one. This is a separate
user-visible correctness failure, not a retrieval/excerpt failure. No
retrieval repair is indicated by this trace, and no date-specific regex
or retrieval-success certification is added. The repeated served job must
pass the truthful-content gate; if the narration error recurs, it is a
separate narration repair.

## Isolation evidence — what is proven, what is not

The attempt process used only scratch stores (config:
`DATABASE_URL`, `ATOM_DATA_DIR`, `LANCEDB_URI`, `LANCEDB_URI_BASE`,
`BYOK_*` under `l2-continuation-served-attempt2`). The attempt's user,
session and execution rows are present in the scratch `atom.db`; the live
dev DB contains none of those attempt identities. The live DB hash/mtime
did change during the window, consistent with unrelated pilot activity on
`:8001` (the pilot was live; its identity was unchanged).

**Classification:** *proven scratch isolation for the attempt's writes;
unrelated live-world activity; no evidence of attempt contamination.*
The guard's boolean remains `false` and is not discarded; this assessment
does not convert it to a green result. A future served run should re-run
the guard and include the resolved open-file check (SQLite DB + `-wal` +
`-shm`) captured at launch.

**Verification (post-hoc, no request issued):**

- The attempt's `chat_messages` (4), `agent_executions` (2) and `users`
  (1) rows are present in the attempt-2 scratch `atom.db` — and the same
  identities are **absent** from the live dev DB (0/0/0).
- The server log resolves the LanceDB stores to the attempt-2 scratch
  `atom_memory/...` paths.
- A same-env diagnostic process (`core.database` engine, no model call)
  resolved `ENGINE_URL=sqlite:///…/l2-fix/scratch/…/atom.db` and held
  `atom.db`, `atom.db-wal` and `atom.db-shm` open under the scratch
  directory (WAL mode, one probe row). This is the resolved-path /
  open-file evidence the guard alone did not provide.

## Scope

No promotion. L2 remains open. L1/L3 and the pilot are untouched. The next
step is the bounded execution-policy successor and its predeclared served
run, not another unchanged retry.
