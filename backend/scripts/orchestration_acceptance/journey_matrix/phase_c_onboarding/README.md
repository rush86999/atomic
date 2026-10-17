# Phase C — onboarding-completion capture (second stream, independent replication)

Reproduce-first capture per the 2026-10-17 owner directive: freeze the build →
fresh product-created user + fresh browser state → capture ONE ordinary "Start
Automating" click (console, outgoing request, authentication, response,
persistence, parent-state update, reload) → repair only the first demonstrated
failed transition (or record "already works") → verify persistence across
reload and sign-out/sign-in; an unsuccessful update must stay visible and never
falsely mark completion.

**Verdict: pass — `first_failed_transition = null`, 14/14 assertions true,
no repair required.** This is the **second, independent** Phase C capture on
the same candidate; the first (concurrent stream, harness sha256 `43c1dc43…`)
is the evidence cited by the registry record in commit `8a6dd183f`. This run
used a separately hardened harness (sha256 `406f1fdd…`, tracked at
`backend/scripts/orchestration_acceptance/browser_onboarding_completion.py`)
and adds checks the first harness did not carry — see "Independent hardening"
below. Both harnesses derive from the same 09:28 base and agree on the outcome.

## Served identities (recorded inside the evidence)

- Candidate **`cca1fb13d59536de3137bd07a382b185ba47152c`** — frozen detached
  worktree, tracked-clean; frontend and backend both compiled/booted from that
  checkout (backend health reports the same `git_commit`).
- Frontend: `next dev` (Turbopack, Next 16.2.2). **Pinned port 17800** —
  banner port == pinned port, and the listening pid's cwd verified (lsof)
  to be this checkout at start and again per leg (`frontend-owned-by-checkout`).
- Backend: ScratchServer uvicorn on an OS-assigned free port (scratch
  DB/LanceDB/BYOK); local Ollama (`llama3.1:8b`) detected and connected via
  the product's Card A path.
- Browser: headless Chromium 141, fresh context, storage never preseeded.

## What the trace shows (scenario 1 — fresh product-created user)

1. Real login form → `POST /api/auth/login` **observed at the scratch
   backend**, 200; session lands on `/dashboard`.
2. Wizard (`role=dialog`): Welcome → Profile → Connect ("Enable Ollama" —
   local daemon detected) → Ready.
3. **One** "Start Automating" click → exactly one
   `POST /api/onboarding/update`, `authorization_present: true` (Bearer) →
   **200** (`onboarding_step: completed`) → overlay closed **1.05 s** later →
   toast "You're all set!" → three independent readbacks agree:
   page-session status read, token API read, direct SQLite read
   (`onboarding_completed=1`, `step=completed`).
4. Reload leg: the session-dismiss key is **cleared** first (a fresh browser
   session has none), so the host must consult the server — the host's own
   `GET /api/onboarding/status` → **200 with `"onboarding_completed":true`**
   is recorded, and the wizard does **not** reopen; DB still completed.
5. Sign-out/sign-in leg: real sidebar logout (redirect stays on this origin —
   `NEXTAUTH_URL` pinned), product login again, dismiss key cleared, host
   status fetch recorded → wizard does **not** reopen; DB still completed.

## Failure-visibility control (scenario 2 — INJECTED, not a product bug)

Same walk, then `POST /api/onboarding/update` answered **500 by route
interception** (CORS preflight served healthy so the app sees a real rejected
update): the "Could not complete onboarding / Please try again." toast is
visible **0.34 s** after the click (sub-second polling; a single late scan
misses the ~5 s toast), the wizard stays **open**, nothing is marked completed
anywhere (`failure-not-marked-completed`); after removing the injection a
second click completes (recovery, DB completed). Screenshots `*_early`/`*_mid`
capture the failed state.

## Independent hardening (relative to the first stream's harness)

1. **Frontend ownership verification** — pinned port + banner equality +
   lsof pid/cwd checks per leg. (Motivated by an observed cross-checkout
   port takeover that invalidated a precursor run of this harness.)
2. **Server-driven non-reopen proof** — dismiss key cleared before the
   reload/relogin checks and the host's status fetch required, so "no reopen"
   is established from server state, not from session suppression.
3. **Origin hygiene** — `NEXTAUTH_URL` pinned to the capture origin; the
   sign-out redirect staying on-origin is asserted, not assumed.
4. **CORS-clean injected failure** — preflight answered, so the 500 is a
   product-visible failure rather than a transport accident; sub-second
   toast polling instead of one late text scan.

## Precursor runs of this harness (NOT evidence)

- Run 1 (09:34): contaminated — the worktree dev server died, another
  checkout's server took the port, and the port-only wait accepted it.
  Discarded as diagnostic-invalid; kept in `/tmp` only.
- Run 2 (09:37): caught a Turbopack FATAL (`symlinked node_modules points out
  of the filesystem root`) — motivated the APFS-copied real `node_modules`.
- Run 3 (09:40): precursor for the failure-visibility scan; single 6 s scan
  missed the toast window; fixed by sub-second polling.

## Historical failure — preserved, superseded

The Oct-12 failing chain
(`../browser_j2_chain_20261012_112631_9258b4.json`, candidate `d6fbcd846`)
is unchanged in the repo. The completion-path code (wizard, host, Layout,
backendAuth, login, onboarding routes) is byte-identical between `d6fbcd846`
and `cca1fb13d`; both Phase C captures show no failing transition on this
lineage, so the historical observation's cause remains unestablished here —
no repair was invented, and the registry record was flipped to verified on
the first stream's evidence (`8a6dd183f`).

## Redaction + checksums

One scratch-user WebSocket console line contained a scratch JWT
(`ws://…?token=eyJ…`); it is stored here as `<redacted-scratch-jwt>`.
Passwords were never recorded (`"<scratch password redacted>"`); bearer
tokens are recorded as presence only. `checksums.sha256` covers every file in
this directory (computed after redaction).
