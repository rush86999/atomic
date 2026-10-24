# Clean-export / startup / browser verification — 2026-10-23

This verifies the shipping content (tracked tree at `4d6aaffb1`, product
`910bf85a6`) independently of the working tree: export, backend startup,
frontend production build, and a real Chromium registration/dashboard
loop. It does not use the pilot `:8001` runtime or its data.

## Export

```
git archive HEAD | tar -x -C <new empty dir>
```

- 11,173 files; no `.git`; no dirty main-tree files.
- `EXPORT_HEAD` = `4d6aaffb14d24655311df4d42b67be4859f1799b`
- Product = `910bf85a6dd32f7026f28df2e4380110bd463c50`
- `backend/core/answer_boundary.py` = `2c6a7a04…`
- `backend/core/workbook_read_artifact.py` = `db23d667…`
- `backend/integrations/chat_orchestrator.py` = `8a44f874…`

## Backend startup

Started from the export on `127.0.0.1:8118` with fresh scratch SQLite,
LanceDB, BYOK, and data paths; local Ollama/fastembed configuration; no
DeepSeek key in this smoke. `/api/health` returned 200:

```json
{"status":"healthy","version":"8.0.0","deployed_sha":"unknown",
 "identity":{"cwd":"…/atom-release-910bf85a6/backend", ...}}
```

The export has no `.git`, so runtime identity is `unknown`; the product
hashes above bind it to the verified tree. Live DB and pilot were not
used. `backend_health.json` is the capture.

## Frontend build

- Next.js `16.2.2`, `next build --webpack` (Turbopack rejects a
  `node_modules` symlink outside the export root; a real copy was used).
- `NEXT_PUBLIC_API_URL=http://127.0.0.1:8118` and the explicit
  `NEXT_PUBLIC_ALLOW_LOOPBACK=1` opt-in (the config refuses silent
  loopback baking).
- Build succeeded: 139 static pages generated; `next start -p 3010`
  served `/login` 200. Full log: `frontend-build.log`.

## Browser loop

Real headless Chromium against `:3010` and the export backend:

1. `/login` → “Sign up” form.
2. Filled first/last name, email, password/confirmation; created the
   account through the real UI.
3. Registration POST returned 200; redirected to `/dashboard`.
4. Dashboard rendered the signed-in user, onboarding welcome, connected
   integrations, and the sidebar; no page errors.
5. Screenshot: `browser-smoke.png`.

The first attempts correctly failed with a CORS preflight 400 until
`ALLOWED_ORIGINS` included `http://127.0.0.1:3010`; the final run used
that explicit origin. This is local-build configuration, not a product
change.

## Scope of this verification

This proves clean export → startup → production frontend build → browser
sign-in/dashboard on the verified shipping content. The full provider/
upload/edit/compare/reply workflow is proven by attempt 7's 59/59 served
run (same product); this browser smoke does not re-spend provider
budget. A fresh `npm ci` was not run; the export used the existing
dependency cache copied into the clean tree, so build parity is proven
but network dependency resolution is not.

## Artifacts

`EXPORT_HEAD`, `clean_export_product_hashes.txt`,
`backend_health.json`, `frontend-build.log`, `frontend_login.txt`,
`browser-smoke.png`, `pilot_health_before.json`,
`pilot_frontend.txt`, `main_head.txt`, `worktree_head.txt`,
`product_commit.txt`.
