# Cutover approval request — `cc813aeeb`

**Requested:** one reversible cutover of the local Atom pilot (`:8001` /
`:3000`) to the verified attempt-8 candidate.
**Status: NOT APPROVED. The hold remains in force until the owner replies
with the approval line below. No cutover has been executed.**

## What is being approved

| Item | Exact value |
|---|---|
| Product commit | `cc813aeeb90b84fcb36d128fda0a3b32b255742e` |
| Product tree | `5e324af5297640ee11628fa755bd50c7b7307302` |
| Launch/runtime commit | `b682d017e60ffb0f872fddba9bcf9fb648034775` (`b682d017e60f`, clean) |
| Release tree | `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/atom-release-cc813aeeb-20261024` |
| Rehearsal result | attempt 8, **60/60 true**; L3 59.1 s, edit 33.99 s, re-ask 31.04 s, S3 87.53 s, S7 67.46 s |
| Frontend build | Next.js 16.2.2 webpack, Node 20.19.6, npm 10.8.2, `BUILD_ID=tCcJqyp6jX99CjA0eySjZ`, API `http://127.0.0.1:8001`, loopback opt-in |
| Interpreter | `/Users/rushiparikh/projects/atom/backend/venv314/bin/python` 3.14.7; freeze sha256 `70aedee4…` |
| Live gate | `6d66d0b8b3b2c9a24efbe111a750c477f623a207d34692dcd4fa07cfceb88dd2` |
| Current pilot | `8c593e57031e` clean, backend `:8001` pid 16055, frontend `:3000` pid 16488 |

## Maintenance window

**2026-10-24 11:30–12:30 EDT / 15:30–16:30 UTC.**

- Do not start after 11:50 EDT.
- If smoke has not passed by 12:25 EDT, roll back.
- One attempt only; a rollback ends it.
- If this window is not approved and started in time, the request lapses and
  a new window must be proposed. There is no standing authorization.

## Configuration and provider settings

- **Existing BYOK is preserved in place.** All existing key files, all 13
  active keys, and all 37 provider definitions remain. The historical
  filtered `candidate-byok/` store is not used.
- No credential is deleted, added, or re-scoped by this request.
- Additive turn flags: `ATOM_TURN_INTERPRETATION=1`,
  `ATOM_TURN_INTERPRET_PIN=deepseek:deepseek-v4-pro`,
  `ATOM_TURN_INTERPRET_CAPTURE=1`, `ATOM_TURN_DECISION_ROUTING=1`,
  `ATOM_ASYNC_EDIT_PLAN_MODEL=deepseek/deepseek-v4-pro`.
- Additive reply preference: `ATOM_PREFERRED_LLM_PROVIDER=ollama`,
  `ATOM_PREFERRED_LLM_MODEL=llama3.1:8b`. This is a new routing preference,
  not a credential change. It was not present in the isolated rehearsal
  environment and is validated by the live smoke.
- Preserve `CHAT_FINALIZATION_M1=1`, `CHAT_FINALIZATION_M2=1`,
  `ATOM_TASK_LIFECYCLE_ENABLED=1`,
  `ATOM_STREAM_FALLBACK_RESERVE_SECONDS=70`, `ALLOWED_ORIGINS` /
  `CORS_ORIGINS` including `http://127.0.0.1:3000`.
- Stores remain the pilot's absolute paths: SQLite `backend/data/atom.db`,
  `ATOM_DATA_DIR`, LanceDB `atom_memory`/`lancedb`, and the three BYOK files.
- Intended routes: reply `ollama/llama3.1:8b`; structured interpretation and
  edit planning `deepseek/deepseek-v4-pro`.
- Allowed fallback: the pre-existing global `deepseek`, `opencode-go`, and
  `openrouter` credentials remain reachable if Ollama fails. The rehearsal
  did not exercise those routes. The smoke records the actual route; an
  unexplained route is a rollback condition.

Exact JSON: `release_evidence_20261024/cutover_cc813aeeb/release_config.json`.

## Smoke that must pass

This is a served-workflow smoke, not signup/dashboard:

1. Fresh quiescent snapshot; start backend on `:8001`; health identity must
   be `b682d017e60f`, `dirty=false`, with the live DB and live BYOK paths.
2. Frontend `/login` 200 and real browser sign-in.
3. Upload a unique smoke record and ask for its code. Require `CEDAR-42`,
   correct source filename, persisted history, and a recorded actual route.
4. Create a draft, edit `Net 45` → `Net 30`; require exactly one write and
   all other fields unchanged.
5. Send the identical edit again; require zero additional writes and an
   unchanged body.
6. Reload history/canvas; restart the backend once; require the same
   identity and persisted answer/body.
7. Record `post_smoke_db_fingerprint.json`; only smoke fixture rows in the
   user-visible tables may differ. Background agent/scheduler rows may move
   after the snapshot and must be attributable in the logs; unexplained
   changes in users/documents/canvases/audits/chats are rollback.

Artifacts under
`docs/acceptance/release_evidence_20261024/cutover_execution_cc813aeeb/`:
`pre_cutover/` (DB.gz, BYOK/env copies, manifest), `candidate_health.json`,
`candidate_backend.log`, `candidate_frontend.log`, `browser_signin.png`,
`smoke_sourced_*`, `smoke_edit_*`, `smoke_reask_*`, `post_restart_*`,
`post_smoke_db_fingerprint.json`, `cutover_summary.json` (and `rollback/` if
needed).

## Rollback conditions

Any of the following triggers rollback to `8c593e57031e` using the fresh
snapshot and unchanged BYOK/env:

- health non-200, wrong revision/dirty state, or wrong live DB/BYOK path;
- frontend `/login` or browser sign-in failure not fixed in 5 minutes;
- sourced answer missing `CEDAR-42`, wrong source, provider failure, or
  unexplained route after two bounded attempts;
- edit writes zero or more than one time, or changes another field;
- re-ask writes again or changes the body;
- restart loses history/canvas or changes identity;
- DB integrity failure or unexplained row delta;
- owner aborts.

Rollback stops only the candidate PIDs, restores the fresh snapshot and the
four unchanged provider/env files, restarts the old backend/frontend, and
verifies `8c593e57031e` + `/login` 200. Evidence is preserved. No retry in
the same window.

## Known limitation requiring explicit acceptance

`DELTA_REVIEW_CC813AEEB_2026-10-24.md` found that the answer boundary drops
the **first paragraph** of any multi-paragraph reply containing the literal
`[ingested]`, including ordinary user quotations. Reproduced exactly:

- input: `You wrote: "[ingested] is the tag the importer adds."` followed by
  a second paragraph;
- output: the second paragraph only.

No product change was made, because a fix would change the verified runtime
and require a new full rehearsal. **Approval is conditional on accepting
this known limitation for the pilot.** If it is not acceptable, do not
approve; withhold cutover for a separate delta fix.

## What approval authorizes — and what it does not

Approval authorizes only the single cutover described above, in the stated
window, with the stated smoke and rollback. It does not authorize a second
attempt, a product change, provider reconfiguration, deletion of the old
trees, or a broader reliability claim.

## Reply to approve

Reply exactly:

```
APPROVE CUTOVER cc813aeeb, window 2026-10-24 11:30-12:30 EDT,
accept [ingested] limitation, smoke + rollback as written.
```

Any other reply leaves the hold in force.
