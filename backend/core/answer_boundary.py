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
_LINE_NUMBERED = re.compile(r"^\s*L\d+:\s")
_FULL_TEXT_LEAD = re.compile(
    r"(?:full text|top hit|source excerpt|excerpt|stored document)",
    re.IGNORECASE)
_RETRIEVED_PARAGRAPH = re.compile(
    r"^\s*\d+\.\s*\[(?:ingested|vector|communication|memory|"
    r"documents?|knowledge)\]", re.IGNORECASE)


def _strip_retrieved_excerpt(text: str) -> str:
    """Drop a leading retrieved-source paragraph from the answer.

    Some models open with a numbered ``[ingested]`` excerpt (the whole
    document region) and only then answer. That paragraph is an internal
    evidence carrier; the actual answer follows it. Only a paragraph whose
    first line has that numbered source form is removed; ordinary prose and
    a user-requested comparison are untouched.
    """
    paragraphs = re.split(r"\n\s*\n", text)
    if not paragraphs:
        return text
    kept = [p for p in paragraphs if not _RETRIEVED_PARAGRAPH.match(p.strip())]
    return "\n\n".join(kept).strip()


def _strip_line_numbered_excerpt(text: str) -> str:
    """Remove an internal line-numbered VFS excerpt from user-facing text.

    The knowledge VFS renders evidence as consecutive ``L1:``/``L2:``
    lines. That is an internal carrier; the answer is the prose around it.
    A single ``L1:`` line is left alone (it can be a legitimate citation).
    """
    lines = text.splitlines()
    kept = []
    index = 0
    while index < len(lines):
        if _LINE_NUMBERED.match(lines[index]):
            end = index
            while end < len(lines) and _LINE_NUMBERED.match(lines[end]):
                end += 1
            if end - index >= 2:
                if kept and _FULL_TEXT_LEAD.search(kept[-1]):
                    kept.pop()
                index = end
                continue
        kept.append(lines[index])
        index += 1
    return "\n".join(kept).strip()


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
    text = _strip_line_numbered_excerpt(text.strip())
    return _strip_retrieved_excerpt(text)


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
