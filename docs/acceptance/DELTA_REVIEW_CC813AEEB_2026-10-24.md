# Delta review — `cc813aeeb` (attempt-8 product commit)

**Reviewed:** 2026-10-24, after the passing attempt-8 rehearsal.
**Scope:** only commit `cc813aeeb90b84fcb36d128fda0a3b32b255742e`
(product fix) and its effect on the attempt-8 runtime. Earlier commits were
reviewed separately; this is the delta review of record because
`cc813aeeb` postdates independent review.

## Identity under review

| Item | Value |
|---|---|
| Product commit | `cc813aeeb90b84fcb36d128fda0a3b32b255742e` |
| Product tree | `5e324af5297640ee11628fa755bd50c7b7307302` |
| Rehearsal/launch commit | `b682d017e60ffb0f872fddba9bcf9fb648034775` |
| Product diff between launch and pin | none (`product_tree_equals_pin=true`) |
| Attempt-8 result | 60/60 true, product pin and launch identity checks true |

`b682d017e` adds only acceptance harness/evidence files after the product
commit; the seven pinned product source hashes in
`release_evidence_20261023/live_world_rehearsal_attempt8/live_rehearsal_config.json`
match the staged release tree.

## What the delta changes

`git show --stat cc813aeeb`:

- `backend/core/answer_boundary.py` (+13/−1)
- `backend/integrations/chat_orchestrator.py` (+5)
- `backend/tests/test_attempt4_repairs.py` (+15)

### 1. `_chain_query` initialization — safe

Attempt 7 failed with `UnboundLocalError: _chain_query`, then shipped the
literal template “I'll manage those tasks for you.” The delta initializes the
request-scoped value before the response `try` block:

- initialization: `backend/integrations/chat_orchestrator.py:18709`
  (`_chain_query = ""`, outside the `try`)
- assignment: `:22683` (resolved-work branch only)
- reads: `:22685`, `:22779`, `:22923`, `:23350`

Every read is guarded (`if _chain_query:` / `if _chain_query`), so the empty
initializer means “no resolved work to chain,” not a fabricated query. The
initialization cannot be skipped by an exception before the `try`; the
previously failing S3 replay reached the reply leg after the fix (attempt 8
S3 87.53 s, all 60 checks true). **No unbound-local path found.**

### 2. Inline `[ingested]` lead strip — over-broad

The new condition in `backend/core/answer_boundary.py:62–64` is:

```python
is_carrier = bool(_RETRIEVED_PARAGRAPH.match(stripped)) or (
    index == 0 and "[ingested]" in stripped.lower()
    and len(paragraphs) > 1)
```

The second clause treats **any** first paragraph containing the literal
`[ingested]` as an internal evidence carrier, provided a later paragraph
exists. It is not limited to a carrier shape (numbered source line, filename,
“Based on the live tool results…” preamble). `present_answer` is called at
`backend/integrations/chat_orchestrator.py:26296` for all non-streaming final
content, not only tool-backed L3 replies.

Exact reproduction on the staged `cc813aeeb` tree:

Input:

```
You wrote: "[ingested] is the tag the importer adds."

In this workspace that tag is metadata, not part of the document body.
```

Output:

```
In this workspace that tag is metadata, not part of the document body.
```

The first paragraph is silently dropped. Other reproductions behave the same
way:

- `Here is my note: [ingested] is just a label.` → dropped when a second
  paragraph exists.
- `Please keep this quote: [ingested] appears in the first line.` → dropped.
- `The tag [ingested] means imported.` → dropped when a second paragraph
  exists.

The single-paragraph guard (`len(paragraphs) > 1`) prevents dropping the
whole answer, but does not protect ordinary multi-paragraph text.

### 3. Test coverage — carrier shapes only

`backend/tests/test_attempt4_repairs.py:488` adds
`test_captured_attempt7_inline_ingested_lead_is_not_shipped`. It asserts the
attempt-7 carrier (`Based on the live tool results ... [ingested]
l3_zephyr9_fixture.txt: ...`) is stripped. It does **not** cover an ordinary
user quotation containing `[ingested]`, and no test asserts that such a
quotation survives. The focused suite passes:

```
backend/tests/test_attempt4_repairs.py -k 'ingested or quotation or wires_the_repairs'
4 passed, 32 deselected
```

A passing test therefore does not satisfy the quotation-preservation check.

## Verdict

**The `_chain_query` fix is accepted. The inline-carrier strip fails the
required “ordinary user quotations containing `[ingested]` are preserved”
criterion.**

- User-visible effect: the first paragraph of a multi-paragraph reply is
  deleted when it contains the literal `[ingested]`. No data is mutated; the
  loss is confined to that rendered reply.
- Blast radius: every non-streaming final answer through
  `present_answer`, not only L3/tool replies.
- Trigger likelihood on the live pilot: low but non-zero — it requires the
  literal token in the first paragraph plus a later paragraph.
- No product change was made for this review. Changing the condition would
  change runtime behavior and therefore requires a new product commit,
  targeted tests, and a new full rehearsal before it can be called verified.

## Disposition required

The attempt-8 identity is preserved only if this defect is accepted as a
known limitation. The cutover approval in
`CUTOVER_APPROVAL_2026-10-24.md` is therefore **conditional on the owner
explicitly accepting it**. If the owner does not accept it, withhold cutover
and perform a separate delta fix + re-verification; do not silently ship the
current behavior as if the quotation check passed.
