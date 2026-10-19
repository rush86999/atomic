# Phase D — FREEZE RECORD (written BEFORE installation)

Recorded 2026-10-17 ~10:00 EDT, before any dependency installation or boot.
Per the owner directive: freeze one candidate and installation procedure;
record OS, versions, prerequisites, source identity, and allowed isolation
BEFORE starting; genuinely new dependency installs only.

## Frozen candidate

- **Source identity: git commit `68729ebe4425c689832f012c3d5da23f3effc491`**
  (main tip at freeze time). Contains the Phase C closures `8a6dd183f` +
  `624f9926c` and `68729ebe4` (Phase C third independent run + UNAUTH
  failure-path control — corroboration only: it adds evidence JSONs and one
  harness file under `backend/scripts/orchestration_acceptance/`, no runtime
  product code).
- Checkout: **fresh `git worktree` (detached) at that commit** —
  `/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/phase-d-pristine`.
  Tracked-clean; no venv, no `node_modules`, no `backend/.env`, no
  `frontend-nextjs/.env.local`, no DB/store files. The only pre-existing
  content is TRACKED source (e.g. `backend/data/acceptance_results/*.json`
  fixtures committed to the repo; no runtime databases or stores).
- Nothing is copied or symlinked from any other checkout. (Both Phase C
  worktree shortcuts — symlinked venv/node_modules — are explicitly NOT used
  here; the Phase C experience showed Turbopack additionally rejects
  symlinked node_modules.)

## Host + prerequisites (as found)

- OS: **macOS 26.5.2 (build 25F84), x86_64** (Intel).
- `python3` (the interpreter quickstart.sh uses): **Python 3.14.7**
  (`/usr/local/bin/python3`) — satisfies the script's ">= 3.11" guard.
  (python3.11 (3.11.16), 3.12, 3.13 also installed; the documented script
  does not select them.)
- `node` **v20.19.6** (script requires >= 20.9) · `npm` **10.8.2** · `make` ·
  `git` — present.
- Local model prerequisite (README-documented local option): **Ollama 0.17.4
  daemon listening on 127.0.0.1:11434**, model `llama3.1:8b` installed.
- Disk: ~43 GiB free at freeze time.

## Installation procedure (run UNCHANGED)

1. `bash scripts/quickstart.sh` (== `make setup`), from the worktree root.
   Documented behavior: `python3 -m venv backend/venv`; `pip install -q -r
   backend/requirements.txt`; generate `backend/.env`
   (SECRET_KEY/JWT_SECRET_KEY/BYOK_ENCRYPTION_KEY, DATABASE_URL=
   `sqlite:///./atom_dev.db`, ENVIRONMENT=development, CHAT_FINALIZATION_M1=1,
   CHAT_FINALIZATION_M2=1, ATOM_TASK_LIFECYCLE_ENABLED=1); `cd frontend-nextjs
   && npm install --legacy-peer-deps`; generate
   `frontend-nextjs/.env.local` (NEXT_PUBLIC_API_URL).
2. Boot (documented commands): `make backend` (-> scripts/start-backend.sh,
   which reads the backend port from `.env.local` and refuses a taken port)
   and `make frontend FE_PORT=<port>` (-> `npm run dev -- -p <port>`).
3. Documented browser outcome: sign in as `admin@example.com` with the
   password generated on first backend startup into
   `backend/logs/bootstrap_admin_password.txt`.

## Allowed isolation settings (declared BEFORE start; NOT findings)

1. **Ports (owned by this install):** backend **18100**, frontend **18101**.
   (Dev backend on :8001 and other sessions' servers are live on this host;
   these ports were chosen free and are verified-owner per leg.)
2. **`frontend-nextjs/.env.local` values:** `NEXT_PUBLIC_API_URL=
   http://localhost:18100` and `NEXTAUTH_URL=http://localhost:18101` (origin
   pin — Phase C lesson: the unpinned NextAuth default sends the sign-out
   redirect to :3000).
3. **Local-model config (README-documented local option):** `backend/.env`
   gains `ATOM_LOCAL_ONLY=true`, `OLLAMA_BASE_URL=http://localhost:11434/v1`,
   `OLLAMA_MODEL=llama3.1:8b`.
4. **Data isolation:** the generated `DATABASE_URL` is relative
   (`sqlite:///./atom_dev.db` -> lands under the worktree's `backend/`);
   all stores/logs land inside the worktree. No developer sessions,
   databases, BYOK/provider stores, or `.env` files are reused.
5. **Download caches (disclosed):** pip and npm may reuse their local
   download caches (`~/Library/Caches/pip`, `~/.npm`). No installed
   dependency trees are reused; venv and node_modules are created from
   scratch.
6. Local shared services (disclosed): the host's Ollama daemon is the model
   backend (external prerequisite, per README's local option).

## Intervention policy

The documented steps run unchanged. **Any undocumented intervention required
to proceed is an installation finding**: it is captured with logs, recorded
as a finding, and then (and only then) documented and continued. The FIRST
failure is preserved, not patched around silently.

## Exact claim this evidence will support (no more)

A fresh-venv / fresh-node_modules installation of `68729ebe4` **on THIS host
(macOS 26.5.2, x86_64, default python3 3.14.7, Node v20.19.6)** with the
documented quickstart procedure, booted in isolation, completing the browser
loop (sign in -> onboard -> configure model -> upload/connect a source ->
useful attributed answer -> reload + persistence). It does NOT establish
installation on a clean machine, another OS, or another toolchain.
