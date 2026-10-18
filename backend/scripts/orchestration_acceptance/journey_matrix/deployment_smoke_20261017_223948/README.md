# Deployment smoke — served app (:8001), 2026-10-17 late

**What this is.** The beyond-navigation verification of the DEPLOYED build:
after the controlled restart, the served app must do real work — not just
render. Executed by `backend/scripts/orchestration_acceptance/deployment_smoke.py`
against the live backend (no scratch world).

**Served identity:** `8c593e57031e` (repo HEAD at deploy), PID 81067, cwd
`/Users/rushiparikh/projects/atom/backend`. The checkout was verified to
contain exactly the committed runtime (empty diff from the tested candidate
`dad8f9fce` across `backend/core|integrations|api|main_api_app.py`; no
tracked runtime dirt).

**Passing run:** `deployment_smoke_20261017_223948.json` — **6/6 checks**:

| check | what it establishes |
|---|---|
| served-commit-matches | the running process is the intended commit |
| smoke-user-provisioned | the product's own registration/login path |
| login-dashboard | sign-in) → wizard → dashboard through the browser |
| provider-active-via-ui | wizard Card A activates the local runtime through the UI (one store POST) |
| useful-sourced-answer | upload via the Documents UI → grounded chat answer: "The launch code for project Zephyr-9 is **QUARTZ-77** — found in your uploaded file `deployment_smoke_fixture.txt`." |
| saved-edit-readback | authorized edit from the canvas page → readback carries `2026-12-31`, exactly +1 audit row, reply "Updated the Valid Until date to 2026-12-31." |

Screenshots: `smoke_sourced_answer.png`, `smoke_saved_edit.png`.

## Attempts preserved (all five, with causes)

1. `221948` — frontend API base `localhost:8001` resolved IPv6 `::1` while
   the backend binds IPv4-only → "Unable to connect". Fix: `127.0.0.1`.
2. `222902` — smoke frontend ran on `:18601`, not in the live CORS
   allow-list (`:3000/:3001`); preflight 400. Fix: run the smoke on `:3000`,
   the real user origin. (Login guard added: fail fast, not silent.)
3. `223251` — login/dashboard/provider green; answer FAILED: the live
   world's stored `opencode-go` key had EXPIRED (401 `api_key_expired`) and
   `openrouter` was quota-exhausted; also the smoke's audit read passed a URL
   instead of the DB path (delta read 0 while the DB showed +1).
4. `223554` — audit delta fixed (green); answer still failed: the provider
   catalog had been discovered at boot with the expired key, and a product
   store call had written a PER-USER-TENANT key entry rather than the
   default/global entry the runtime discovers with.
5. `223948` — **PASS** after rotating the operator-provided fresh key into
   the two default vault entries (the Settings→AI equivalent; vault backup
   `data/backups/byok_keys.pre-rotate-20261017-223924.json` kept) and
   restarting: catalog now serves 37 identifiers.

## Deployment mechanics (recorded)

- **Controlled restart, SCOPED**: snapshots first
  (`atom-pre-restart-20261017-221801.db.gz`, `…223810.db.gz`, gzip-verified),
  then only the `:8001` process was stopped and exactly one instance started
  with the documented args (`venv314/bin/python -m uvicorn main_api_app:app
  --host 0.0.0.0 --port 8001 --timeout-keep-alive 75`). **Deviation from
  `scripts/restart_backend.sh` (documented):** that script kills EVERY
  `uvicorn main_api_app` process — 38 were running, including other
  streams' live acceptance worlds — so its steps were replicated scoped to
  `:8001`.
- **Off-machine copy: N/A on this host** (configured local-only, no external
  drive) — stated, not silently skipped.
- **Pilot frontend left running**: main-repo `next dev` on `:3000` →
  `http://127.0.0.1:8001` (the app is reachable at `http://localhost:3000`;
  stop with `pkill -f 'next dev -p 3000'`).
- **Live-world artifacts created (documented)**: smoke users (`jprobe_*`,
  one per attempt), one fixture upload per attempt, one draft canvas per
  attempt (passing run: title "Deployment smoke draft", +1 audit row), and
  the rotated `opencode-go` key (the operator's expired stored key replaced
  with the fresh one — the app's cloud route works again).
- The per-user tenant key entry written during attempt 3 remains in the
  vault; it is inert for other tenants.
