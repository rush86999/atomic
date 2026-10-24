# Live-world latency diagnosis — 2026-10-23

**Status: diagnosis and authority-boundary repair complete; composed
live-world rehearsal is the next gate. The pilot remains rolled back and
untouched.**

## Isolated reproduction

- Database: verified pre-cutover snapshot (786 MB) restored into an
  isolated data directory; integrity `ok`.
- Auxiliary stores: fresh isolated LanceDB/atom-memory directories (the
  live 32 GB vector store was not copied or opened).
- Writers disabled: `ENABLE_SCHEDULER=false`,
  `ENABLE_INGESTION_SYNC=false`, `TELEGRAM_POLLING_ENABLED=false`,
  `ATOM_ORG_SHARING_ENABLED=false`; no outbound pollers.
- Server: instrumented FastAPI app on `127.0.0.1:8120`, runtime identity
  `324a85637054` (worktree with the diagnosis edits; product tree based
  on `910bf85a6`); health 200.
- Provider registered before the first measured request: authorized
  DeepSeek operator credential through the product.
- Pilot `:8001`/`:3000` was not used or changed.

The cutover record's two smoke requests are preserved: the first was
configuration-incomplete (no declared DeepSeek key/pin; 43.6 s
OpenCode-Go failure), the second was after the credential (77.8 s
DeepSeek/legacy failure). The diagnosis below reproduces the second
request's shape with the intended provider registered before the first
request.

## Measured before the repair

First instrumented run (pilot routing; OpenCode-Go reply):

| Event | Time |
|---|---|
| turn interpretation (DeepSeek) | 42.96 s (structured call 34.2 s) |
| reply leg | 29.99 s |
| legacy intent | 2.93 s |
| feature routing (SEARCH + AI_ANALYTICS) | 0.20 s |
| synchronous entity search | 0.0 ms; entity registry count **0** |
| total | **77.7 s** |

The accepted requirement was:

```json
{"required": false, "sources": [], "file": null,
 "fields": ["version"], "subjects": [],
 "identity": {"state": "kind_only", "candidates": []}}
```

It did not bind the uploaded record. `enforce_required_read` therefore
selected `memory.search` (or was never required), not `documents`.
The reply reported that the scan was unavailable; it did not read the
uploaded document.

A second run with the declared turn pin showed the same requirement gap:
interpretation 53.9 s, requirement still `required=false / sources=[]`,
reply 8.6 s, total 62.9 s. The **53 s interval was turn interpretation
plus reply/tool work**, not entity search: `_handle_search_request`
returned in 0.0 ms with an empty registry and AI_ANALYTICS is a
placeholder. Event-loop heartbeat max lag was ~0.8 s, not 53 s.

## Root cause

The accepted interpretation classified the document-scoped request as
generic conversation (`requested_actions: conversation`,
`references.sources: []`). The requirement builder is faithful to that
decision, so no required document read fired. The optional tool planner
then spent up to 20 s and the reply leg/guards consumed the remaining
budget; the model answered from unavailable evidence.

The legacy `SEARCH_REQUEST` fan-out (`SEARCH` + `AI_ANALYTICS`, then an
`AGENT` fallback) is a real design defect but **not** the measured 53 s
cause. It is removed for a document-only requirement below.

## Repair

1. **Catalog-backed source identity.** When the accepted decision carries
   no source/file and no filename-shaped mention, a phrase that matches
   the ACTUAL uploaded catalog title (extension/separators normalized,
   exactly one distinct row) becomes `sources=["document"]`,
   `required=true`, with the resolved file identity. No filename rule,
   business-noun regex, or blanket switch. Ambiguous/no match changes
   nothing.
2. **Document-only authority.** When the accepted requirement is required
   and document-only, the legacy feature fan-out is skipped entirely
   (no entity scan, placeholder analytics, or agent fallback). Its
   required authorized document read owns the turn. Cross-source
   requirements keep their mapped features.
3. **Bounded synchronous search.** The legacy `_handle_search_request`
   now runs the synchronous registry/attribute scan off the event loop
   with a 5 s wait bound. Timeout returns a visible `search_timeout`; the
   request does not stall. The worker thread may outlive the timeout
   (resource behavior is explicit, not hidden).

## Measured after the repair

With the same isolated live-world copy and the intended provider
registered before the request:

| Event | Time |
|---|---|
| turn interpretation (DeepSeek) | 46.96 s |
| required read enforced | `documents.read` at 51.95 s |
| reply leg | 5.72 s |
| feature routing | 0.1 s (skipped) |
| total | **53.7 s** |

Answer: `SMOKE-42` from the uploaded document, with the correct source;
no decoy. A prior run with OpenCode-Go reply took 41.7 s and also
returned the correct sourced answer. The requirement is now
`required=true, sources=["document"], identity=resolved` with
`file_name=release_smoke_record.txt`.

The event-loop heartbeat showed no 53 s block; the dominant remaining
cost is the DeepSeek turn-interpretation call (28–47 s). The 95 s budget
is not widened.

## Provider/config parity finding

The declared release configuration is DeepSeek structured interpretation
plus local Ollama reply. The live-world copy's provider catalog/`.env`
kept OpenCode/OpenRouter credentials, and the reply leg selected
OpenCode-Go/GLM (or OpenRouter DeepSeek) rather than Ollama. The
structured interpretation and required read are correct, but reply-engine
parity is **not yet proven** for the live world. The next rehearsal must
either pin the reply route to the declared Ollama engine or use a
restricted BYOK matching the declared configuration; the effective route
must be recorded. This is a configuration issue, not a reason to disable
integrations for a green result.

## Browser behavior

The production frontend was built against the isolated live-world API
and a real Chromium sign-in reached `/dashboard` with no page errors
(`live-world-browser.png`). The pilot frontend/backend were untouched.

## Next gate

Freeze this successor, obtain focused review, and run the full composed
workflow on the isolated live-world copy (not fresh scratch), including
provider/config parity and browser. Only then prepare a new backup/
rollback package and request one explicit cutover approval.
