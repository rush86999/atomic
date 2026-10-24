"""User-facing answer boundary for tool-backed replies.

The reply model receives internal ``LIVE TOOL RESULTS`` evidence. Some
models echo that envelope back as the first paragraph of their answer
(attempt 4's L3 turn did exactly that). The envelope is an internal
evidence carrier, not user-facing prose.

This module deliberately does only two things:

1. remove the exact internal envelope from the answer;
2. if the answer consisted only of that envelope, either render a fact
   supplied by **existing structured evidence** or return an explicit
   limitation.

It does NOT rank source sentences by word overlap and does NOT treat the
presence of a code-like token as proof that the token belongs to the
requested subject. A candidate sentence is not a supported answer: the
subject → field → value → source association must come from structured
evidence, and a fallback is allowed only when that association is unique.
"""
from __future__ import annotations

import re
from typing import Iterable, Optional

_INTERNAL_HEADER = "LIVE TOOL RESULTS"

EXPLICIT_LIMITATION = (
    "I found retrieved evidence for this request, but I could not "
    "establish the requested subject and value from it without guessing. "
    "Please ask me to open the specific source, or name the subject and "
    "field you want checked.")

_FACT_KEYS = ("subject", "field", "value", "source")


def _strip_exact(content: str, tool_block: Optional[str]) -> str:
    if not tool_block:
        return content
    block = str(tool_block).strip()
    if not block:
        return content
    idx = content.find(block)
    if idx < 0:
        return content
    return (content[:idx] + content[idx + len(block):]).strip()


def strip_internal_tool_envelope(
        content: str, tool_block: Optional[str] = None) -> str:
    """Remove an echoed internal evidence envelope from user-facing text.

    The exact tool block is removed first. If a truncated/rewritten echo
    still starts with the internal header, the header paragraph (up to the
    first blank line) is removed. Anything after that paragraph is kept.
    """
    text = str(content or "").strip()
    if not text:
        return text
    text = _strip_exact(text, tool_block)
    # The planner emits several carrier header shapes: ``LIVE TOOL
    # RESULTS (documents.search)``, ``LIVE TOOL RESULTS — regex scan ...``,
    # ``LIVE TOOL RESULTS:``. They are all the same internal envelope; the
    # answer starts after the first blank line. A sentence that merely
    # mentions the phrase mid-answer is not a carrier.
    if text.upper().startswith(_INTERNAL_HEADER):
        paragraphs = re.split(r"\n\s*\n", text, maxsplit=1)
        text = paragraphs[1].strip() if len(paragraphs) == 2 else ""
    return text.strip()


def _unique_fact(facts: Optional[Iterable[dict]]) -> Optional[dict]:
    """The one fully specified structured association, or None.

    The caller supplies facts already bound to the requested subject. A
    fallback is not allowed to choose among candidates: zero or more than
    one association means the boundary cannot construct an answer.
    """
    valid = []
    for fact in facts or []:
        if not isinstance(fact, dict):
            continue
        if all(str(fact.get(key) or "").strip() for key in _FACT_KEYS):
            valid.append(fact)
    return valid[0] if len(valid) == 1 else None


def present_answer(content: str, tool_block: Optional[str],
                   message: str,
                   supported_facts: Optional[Iterable[dict]] = None) -> str:
    """Return the user-facing answer without the internal envelope.

    A substantive answer after envelope removal is preserved unchanged;
    the boundary does not rewrite or certify it from token presence. If
    the envelope consumed the whole answer, a unique structured
    ``subject``/``field``/``value``/``source`` association may be rendered;
    otherwise the explicit limitation is returned. ``message`` is kept for
    call-site compatibility and future subject binding; it is not used to
    rank source sentences.
    """
    del message  # intentionally not used to rank or certify answers
    stripped = strip_internal_tool_envelope(content, tool_block)
    if stripped:
        return stripped
    fact = _unique_fact(supported_facts)
    if fact is None:
        return EXPLICIT_LIMITATION
    return (
        f"{str(fact['subject']).strip()} {str(fact['field']).strip()}: "
        f"{str(fact['value']).strip()} "
        f"(Source: {str(fact['source']).strip()})")
