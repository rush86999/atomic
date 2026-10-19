# Phase D — declared isolation settings applied (post-install)
Sat Oct 17 10:11:26 EDT 2026

## backend/.env — appended (declared in FREEZE.md §Allowed isolation settings)
ATOM_LOCAL_ONLY=true
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.1:8b
ADDITIONAL_ALLOWED_ORIGINS=http://localhost:18101,http://127.0.0.1:18101

## frontend-nextjs/.env.local — set
NEXT_PUBLIC_API_URL: http://localhost:8001 -> http://localhost:18100
NEXTAUTH_URL=http://localhost:18101 (origin pin, appended)

## install summary (run 3, rc=0)
venv python: Python 3.11.16

## Addendum — owner-directed BYOK leg (Sat Oct 17 ~11:10 EDT, before run 3)
Owner directive: "use opencode go keys or deepseek keys for testing byok".
Applied to backend/.env:
- `ATOM_LOCAL_ONLY` true -> **false** (cloud providers must be eligible; the
  LOCAL-ONLY boundary excludes every cloud provider by design — with only
  ollama eligible, agent-path turns died in the planning leg, F5).
- `OPENCODE_BASE_URL=https://opencode.ai/zen/go/v1` (non-secret).
- `OPENCODE_API_KEY` = the operator's OpenCode Go key (from the harness auth
  store; not echoed anywhere). This is QUICKSTART.md's RECOMMENDED provider
  option; the same key is ALSO exercised through the product BYOK store
  (Settings->AI shape, key_name=default) in the BYOK probe and run 3.
Not a finding: a declared-config change, recorded here + in the run-3
evidence's effective-config digest. run-1/run-2 evidence remains labeled
with its own effective config (local-only=true).
