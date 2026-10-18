"""SUBJECT ADMISSION — the request-to-job boundary (owner work order
2026-10-10).

A request becomes durable work at ONE seam: the orchestrator mined the
message with ``extract_targets`` and handed whatever came back to
``TaskLifecycle``, which turns every nonempty item into an entity
(``_entities_from_items``). For the owner's captured request —

    "What's our quoted price for the Roper Whitney No. 381 roll bender,
     and what's the list price in our workbook that it's based on?"

— the accepted structured interpretation proposes ONE subject
(``Roper Whitney No. 381 roll bender``), while the miner returned FOUR:
``381``, the whole clause ``'s our quoted price for the Roper Whitney
No. 381 roll bender, and what'``, ``Roper Whitney No`` and ``Roper
Whitney``. All four pass ``identity_shaped_item``, so all four became
entities, then read obligations — three of them still open at attempts=3
on the live runs, blocking completion of a job whose real subject (381)
had already been fully resolved.

This module admits subjects ONCE, from the accepted interpretation:

  1. ACCEPTED INTERPRETATION is the authority when it is valid. Its
     subjects ARE the requested targets; independent text-mining
     fragments are never appended. Deterministic authorization stays
     separate from model interpretation (the floor is untouched).
  2. FALLBACK (interpretation unavailable/unresolved) keeps only
     DEFENSIBLE EXPLICIT IDENTIFIERS — a bare clause is not one. When
     the request's remaining meaning is unresolved prose, the job gets
     ONE scope-clarification obligation, never a read obligation per
     fragment. Nothing is fabricated.
  3. ALIASES ARE ONE SUBJECT. ``Roper Whitney No. 381 roll bender``,
     ``No. 381`` and ``381`` collapse to one subject; a manufacturer
     name alone is not a product unless the user asked for
     manufacturer-wide work.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

#: A subject is admitted only when the smallest name it carries can be
#: recovered — one code-shaped token (digit-bearing) is the anchor.
_CODE_TOKEN_RE = re.compile(r"\b[A-Za-z]*\d[A-Za-z0-9-]*\b|\b\d{2,}\b")

#: Clause-shaped text is never a subject: a sentence fragment carries
#: verbs, trailing conjunctions, or an unbounded word run. Bounded to
#: the same 200-char subject cap the interpretation record uses.
_MAX_SUBJECT_WORDS = 8
_CLAUSE_MARKERS = re.compile(
    r"\b(?:what|which|and|that|it's|its|is|are|was|were|please|give|"
    r"show|tell|find|get|need|want|based on|for the|from the)\b",
    re.IGNORECASE)

#: Manufacturer-wide phrasing — the ONE case a manufacturer name alone
#: may be the subject.
_MANUFACTURER_WIDE_RE = re.compile(
    r"\b(?:everything|anything|all of it|all)\b[^.]{0,60}?\bfrom\b|"
    r"\b(?:everything|anything)\b[^.]{0,40}?\b(?:they|he|she)\s+"
    r"(?:make|makes|made|manufacture|sell|sells|carry|carries|list|"
    r"lists|stock|stocks)\b|"
    r"\b(?:every|all)\s+(?:\w+\s+){0,3}?"
    r"(?:machine|item|product|part|model|row|entry|entries)s?\b|"
    r"\bmanufacturer[-\s]wide\b|\byour\s+full\s+(?:catalog|catalogue|"
    r"range|line)\b",
    re.IGNORECASE)


def code_tokens(text: str) -> List[str]:
    """The code-shaped tokens of a subject, normalized."""
    out: List[str] = []
    for tok in str(text or "").split():
        m = _CODE_TOKEN_RE.findall(tok)
        if m:
            out.append(re.sub(r"[^A-Za-z0-9-]", "", tok).lower())
    return out


def _wordish(text: str) -> List[str]:
    return [w for w in re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]*", str(text or ""))
            if w]


def looks_like_clause(text: str) -> bool:
    """Whether mined text is a sentence fragment rather than a name."""
    words = _wordish(text)
    if not words:
        return True
    if len(words) > _MAX_SUBJECT_WORDS:
        return True
    # a leading conjunction/possessive tail ("'s our quoted price ...")
    if text.lstrip().startswith(("'s ", "s ", "and ", "that ", "which ")):
        return True
    hits = _CLAUSE_MARKERS.findall(text)
    return len(hits) >= 2


def is_defensible_identifier(text: str,
                             manufacturer_wide: bool = False) -> bool:
    """Whether mined text may stand as an EXPLICIT identifier in the
    fallback: not a clause, and either code-anchored or (on a
    manufacturer-wide request) a plain name."""
    if not str(text or "").strip():
        return False
    if looks_like_clause(text):
        return False
    return bool(code_tokens(text)) or bool(manufacturer_wide)


def _same_subject_family(a: str, b: str) -> bool:
    """Whether two names address the same subject — a shared code
    token, or one being a strict token-subset of the other."""
    ca, cb = set(code_tokens(a)), set(code_tokens(b))
    if ca and ca & cb:
        return True
    wa = {w.lower() for w in _wordish(a)}
    wb = {w.lower() for w in _wordish(b)}
    if not wa or not wb:
        return False
    return wa <= wb or wb <= wa


def group_subject_aliases(subjects: List[str],
                          ) -> List[Dict[str, Any]]:
    """Collapse aliases of ONE subject into one canonical subject.

    Canonical is the most complete name (most words, then longest), so
    'Roper Whitney No. 381 roll bender' keeps its aliases 'No. 381' and
    '381' rather than becoming three products. Order-stable.
    """
    groups: List[List[str]] = []
    for raw in subjects:
        name = " ".join(str(raw or "").split())
        if not name:
            continue
        for group in groups:
            if _same_subject_family(name, group[0]):
                group.append(name)
                break
        else:
            groups.append([name])
    out: List[Dict[str, Any]] = []
    for group in groups:
        canonical = sorted(
            group, key=lambda s: (len(_wordish(s)), len(s)), reverse=True)[0]
        aliases = [a for a in dict.fromkeys(group) if a != canonical]
        out.append({"subject": canonical, "aliases": aliases})
    return out


def _is_manufacturer_wide(message: str) -> bool:
    return bool(_MANUFACTURER_WIDE_RE.search(message or ""))


def admit_subjects(
        message: str,
        interpretation: Optional[Dict[str, Any]],
        canvas_context: Any = None,
        deterministic_targets: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """The subjects admitted for THIS request, and why.

    Returns ``{"subjects": [...], "aliases": {canonical: [aliases]},
    "origin": "interpretation" | "fallback" | "canvas" | "unresolved",
    "clarification": bool}``. ``origin="unresolved"`` with
    ``clarification=True`` means: no defensible subject could be
    established — the caller records ONE scope-clarification obligation.
    """
    message = str(message or "")
    interp = interpretation if isinstance(interpretation, dict) else {}
    scope_change = str(interp.get("scope_change") or "").strip().lower()
    usable = bool(interp.get("subjects")) and scope_change not in (
        "", "unresolved")

    if usable:
        names = [s for s in (interp.get("subjects") or [])
                 if str(s or "").strip()]
        # aliases inside the accepted interpretation collapse too
        groups = group_subject_aliases(names)
        return {
            "subjects": [g["subject"] for g in groups],
            "aliases": {g["subject"]: g["aliases"] for g in groups},
            "origin": "interpretation",
            "clarification": False,
        }

    # ---- FALLBACK: deterministic, defensible identifiers only ----
    mined = [str(t).strip() for t in (deterministic_targets or [])
             if str(t).strip()]
    kept: List[str] = []
    wide = _is_manufacturer_wide(message)
    for candidate in mined:
        if not is_defensible_identifier(candidate, manufacturer_wide=wide):
            continue
        # a bare code is always admissible; a NAME-ONLY fragment only
        # when the request is manufacturer-wide (otherwise a brand alone
        # is not a product).
        if not code_tokens(candidate) and not wide:
            continue
        kept.append(candidate)
    if kept:
        groups = group_subject_aliases(kept)
        return {
            "subjects": [g["subject"] for g in groups],
            "aliases": {g["subject"]: g["aliases"] for g in groups},
            "origin": "fallback",
            "clarification": False,
        }

    # ---- CANVAS SCOPE: the request resolves against an open artifact ----
    if isinstance(canvas_context, dict) and canvas_context.get("content") \
            is not None:
        return {"subjects": [], "aliases": {}, "origin": "canvas",
                "clarification": False}

    return {"subjects": [], "aliases": {}, "origin": "unresolved",
            "clarification": True}
