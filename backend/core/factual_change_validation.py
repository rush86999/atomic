# -*- coding: utf-8 -*-
"""Domain-independent factual-change validation at the apply boundary.

The compact planner interprets the request and proposes structured changes.
THIS module deterministically validates those proposals against the accepted
record — the evidence contract and the current artifact. No business
vocabulary lives here: subjects, fields, values, sources, and authorization
all arrive as data, so adding a new business field is a schema/config change
and never a new code branch.

A FACTUAL CHANGE is a patch op, empty-field assignment, or replacement whose
proposed content introduces or alters a fact: a named field's value, a
digit-bearing value, or a value the contract tracks. Each such change must
identify (per the owner's requirement), and this module checks:

  target artifact + revision ..... the caller's artifact id and expected
                                   revision ride the verdict; an action may
                                   only ground an edit that starts from the
                                   previous value it recorded (a stale
                                   action is refused, never reapplied)
  subject/entity + field ......... the contract's entity must be resolvable
                                   at the op's location and the action or
                                   observation field must match the op's
                                   target field. A value appearing elsewhere
                                   in the artifact is never support for
                                   assigning it to another subject or field.
  previous + proposed value ...... computed from the op pair / replace diff
  support ........................ one of, recorded with its provenance:
      USER         the value appears in the user's explicit instruction;
                   it authorizes the edit but is NOT independently verified
      EVIDENCE     a ready, authorized contract action, or a verified
                   observation the contract binds to the requested
                   subject and field
      CALC         a recorded calculation with its operation and inputs
  source meaning .................. an observation's source identity/version
                                   and its currency/unit travel into the
                                   reported provenance; an explicit unit or
                                   currency conflict refuses
  authorization + constraints ..... only ready+authorized actions may ground;
                                   the contract's open gaps refuse with the
                                   record's own named requirement, so an
                                   unresolved fact is never manufactured
  prose ........................... rewording that introduces no factual
                                   value needs no grounding

An LLM's assertion that a change is grounded is not its evidence: the plan's
own reply is never a source. When neither a request message nor an accepted
contract is present there is no record to validate against — a direct
programmatic apply — and validation is skipped; the caller owns authorization
in that case, and refusing would dead-end callers that legitimately have no
conversational context.
"""
import re
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple


class Provenance:
    """How a factual value is grounded (reported, never guessed)."""

    USER = "user_supplied"
    EVIDENCE = "evidence"
    CALC = "calculation"
    PROSE = "prose"


class Refusal:
    """Why a factual change may not be applied."""

    UNSUPPORTED = "unsupported_value"
    UNRESOLVED = "unresolved_requirement"
    STALE = "stale_revision"
    UNAUTHORIZED = "unauthorized_change"


_LABEL = re.compile(r"^\s*([A-Za-z][A-Za-z0-9 /_-]{0,48}?)\s*:\s*(\S[^\n]*)$")
_RUN = re.compile(r"[A-Za-z0-9$€£¥][A-Za-z0-9$€£¥.,%:/-]*")
_NUMERIC = re.compile(r"^[+-]?\d[\d,]*(?:\.\d+)?$")
_CURRENCY_SYMBOLS = ("$", "€", "£", "¥", "₹", "₩", "₽", "₺")
_UNIT_ADJACENT = re.compile(
    r"([A-Za-z]{1,12})\s*[$€£¥₹₩₽₺]?\d[\d,]*(?:\.\d+)?"
    r"|[$€£¥₹₩₽₺]?\d[\d,]*(?:\.\d+)?\s*([A-Za-z]{1,12})")
_AUTHORIZED_ACTION_TYPES = {"edit_artifact", "update_artifact"}


# ---------------------------------------------------------------------------
# value handling
# ---------------------------------------------------------------------------

def _norm(text: Any) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip()).casefold()


def _words(text: Any) -> List[str]:
    return re.findall(r"[a-z0-9][a-z0-9'._-]*", _norm(text))


def _decimal(text: Any) -> Optional[Decimal]:
    """The value as an exact number when the WHOLE token is numeric, so a
    short number can never match as a substring of a longer one."""
    raw = str(text or "")
    for symbol in _CURRENCY_SYMBOLS:
        raw = raw.replace(symbol, "")
    raw = raw.replace(" ", "").strip()
    if not _NUMERIC.match(raw or ""):
        return None
    try:
        return Decimal(raw.replace(",", ""))
    except InvalidOperation:
        return None


def _value_runs(text: Any) -> List[str]:
    """Digit-bearing runs: the numeric values a text carries."""
    return [run for run in _RUN.findall(str(text or ""))
            if any(ch.isdigit() for ch in run)]


def _value_pair_match(a: Any, b: Any) -> bool:
    """Whether two value strings denote the same value: exact numeric
    equality for numbers (never substring), word-bounded containment for
    text ("Engineering" in "Engineering Department", not "18" in "180")."""
    da, db = _decimal(a), _decimal(b)
    if da is not None and db is not None:
        return da == db
    na, nb = _norm(a), _norm(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    return bool(re.search(rf"(?<![a-z0-9]){re.escape(na)}(?![a-z0-9])", nb)
                or re.search(rf"(?<![a-z0-9]){re.escape(nb)}(?![a-z0-9])", na))


def _value_in_text(value: Any, text: Any) -> bool:
    """Whether ``text`` carries ``value``: numeric runs compare exactly,
    text compares word-bounded."""
    value, text = str(value or ""), str(text or "")
    if not value.strip() or not text.strip():
        return False
    number = _decimal(value)
    if number is not None:
        return any(_decimal(run) == number for run in _value_runs(text))
    return _value_pair_match(value, text)


def _unit_tokens_near_numbers(text: Any) -> Set[str]:
    """Alpha tokens written against a number ("45,000.00 EUR", "12 months")
    — the meaning-bearing tokens of a proposed value."""
    tokens: Set[str] = set()
    for match in _UNIT_ADJACENT.finditer(str(text or "")):
        for group in match.groups():
            if group:
                tokens.add(group.casefold())
    return tokens


# ---------------------------------------------------------------------------
# request assignments: the accepted request's OWN assignment of a value to
# a target. This — not the planner's origin tag — is what makes a value
# user_supplied. An occurrence of the value somewhere in the request is
# not an assignment: it must sit in an assignment position bound to the
# change's target. A value that is itself a reference to where a value
# lives ("the department in the personnel record") is a lookup, not a
# supplied literal, even in an assignment position.
# ---------------------------------------------------------------------------

#: The connective that binds an assigned value to its target. The value
#: must follow it immediately ("... to V", "... = V").
_ASSIGNMENT_CONNECTIVE = re.compile(
    r"(?:\b(?:to|as|into|with|is|are|becomes?|set\s+at)\b|[:=])"
    r"\s*[\"'“”]?\s*(?:the\s+|a\s+|an\s+)?$")

#: The mirror construction: the value first, then the target ("V as the
#: owner"). Only the connective+target immediately after the value counts.
_ASSIGNMENT_AFTER = re.compile(
    r"\s*(?:as|to|into)\s+(?:the\s+|a\s+|an\s+)?")

#: A prepositional phrase headed by a determiner names WHERE a value
#: lives, not what it is. Independent review of 5abf89c0e (2026-10-15):
#: verb-headed pointers ("see the attached schedule", "refer to the
#: schedule") and possessive-source participials ("the supplier's quoted
#: date") are references too, and were being certified. Keep this phrase
#: set in sync with core/turn_decision.py::_SOURCE_REF_PHRASE, and keep
#: the widest-over-refusal direction: a value that cites a source is an
#: obligation to resolve/verify, never a certification of the literal.
_REFERENCE_PHRASE = re.compile(
    r"\b(?:from|in|on|at|per|according\s+to|based\s+on|taken\s+from|"
    r"stated\s+in|shown\s+in|listed\s+in|recorded\s+in|found\s+in|"
    r"as\s+per)\s+"
    r"(?:the|our|your|my|his|her|its|their|this|that|these|those)\b"
    r"|\b(?:see|refer\s+to|consult|check|look\s+(?:at|in)|"
    r"read\s+(?:from|in))\s+"
    r"(?:the|our|your|my|his|her|its|their|this|that|these|those)?\s*"
    r"(?:attached\s+|enclosed\s+)?"
    r"(?:schedules?|attachments?|documents?|files?|docs?|quotes?|"
    r"quotations?|invoices?|annex(?:es)?|appendi(?:x|ces)|tables?|"
    r"spreadsheets?|workbook|records?|minutes|contracts?|"
    r"agreements?|emails?|crm|database|notes?)\b"
    r"|[A-Za-z]+['’]s\s+(?:quoted|stated|listed|recorded|shown|"
    r"specified|given|provided|supplied|documented|captured|filed)\b")

_FIELDISH_CONTEXT = re.compile(
    r"\s*(?:[:=]|\b(?:field|line|row|column|header|cell)\b)")

_STOPWORDS = {"the", "a", "an", "of", "and", "for", "in", "on", "at",
              "to", "is", "are", "be", "it", "its", "this", "that",
              "with", "as"}


def _value_spans_in_text(value: Any, text: str) -> List[Tuple[int, int]]:
    """Every occurrence of ``value`` in normalized ``text``: numeric runs
    compare by decimal equality, text compares word-bounded."""
    spans: List[Tuple[int, int]] = []
    number = _decimal(value)
    if number is not None:
        for match in _RUN.finditer(text):
            if _decimal(match.group(0)) == number:
                spans.append(match.span())
        return spans
    needle = _norm(value)
    if not needle:
        return spans
    for match in re.finditer(
            rf"(?<![a-z0-9]){re.escape(needle)}(?![a-z0-9])", text):
        spans.append(match.span())
    return spans


def _target_mentioned(target: str, window: str) -> bool:
    """Whether the clause window names the change's target field. The
    full label counts, or any distinctive word of it; a very short name
    ("To", "CC") must sit against its field context to count."""
    joined = _norm(target)
    if not joined:
        return False
    if _value_pair_match(joined, window):
        return True
    for token in _words(target):
        if token in _STOPWORDS:
            continue
        token_re = rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])"
        if len(token) >= 4:
            if re.search(token_re, window):
                return True
        elif re.search(token_re, window) and _FIELDISH_CONTEXT.search(
                window[re.search(token_re, window).end():]):
            return True
    return False


def _is_reference_span(value: Any, tail: str) -> bool:
    """A value whose own words — or the words immediately after it —
    point at a source is a reference to be resolved, never a supplied
    literal."""
    return bool(_REFERENCE_PHRASE.search(_norm(value))
                or _REFERENCE_PHRASE.search(tail))


def _request_assigns_value(
    value: Any, target: str, request_message: str,
) -> bool:
    """Whether the request itself explicitly assigns ``value`` to
    ``target``. Presence elsewhere in the request is not an assignment:
    the value must follow an assignment connective whose window names
    the target, or precede "as/to ... the target". References to sources
    are not supplied values."""
    text = _norm(request_message)
    if not text or not str(value or "").strip():
        return False
    for start, end in _value_spans_in_text(value, text):
        left = text[max(0, start - 120):start]
        connective = _ASSIGNMENT_CONNECTIVE.search(left)
        if connective and _target_mentioned(
                target, left[:connective.start()]):
            if not _is_reference_span(value, text[end:end + 120]):
                return True
        right = text[end:end + 120]
        after = _ASSIGNMENT_AFTER.match(right)
        if after and _target_mentioned(target, right[after.end():]):
            if not _is_reference_span(value, right):
                return True
    return False


def _value_present_in_request(value: Any, request_message: str) -> bool:
    """Whether the request carries the value's text at all — the
    reference-echo shape (present, but assigned to nothing)."""
    return _value_in_text(value, request_message)


# ---------------------------------------------------------------------------
# accepted-record indexes (every key is data; missing keys are tolerated)
# ---------------------------------------------------------------------------

def _source_of(item: Dict[str, Any]) -> Dict[str, Any]:
    source = item.get("source")
    if not isinstance(source, dict):
        source = {}
    return {
        "source_id": str(source.get("source_id") or item.get("source_id")
                         or ""),
        "source_type": str(source.get("source_type")
                           or item.get("source_type") or ""),
        "version": str(source.get("version") or item.get("version")
                       or item.get("source_version") or ""),
        "content_hash": str(source.get("content_hash")
                            or item.get("content_hash") or ""),
        "temporal_role": str(source.get("temporal_role")
                             or item.get("temporal_role") or ""),
    }


def _observation_entry(observation: Dict[str, Any]) -> Dict[str, Any]:
    raw_value = observation.get("raw_value")
    if raw_value in (None, ""):
        raw_value = observation.get("value")
    return {
        "observation_id": str(observation.get("observation_id") or ""),
        "subject": str(observation.get("entity_id")
                       or observation.get("subject") or ""),
        "field": _norm(observation.get("field")
                       or observation.get("field_selection") or ""),
        "value": str(raw_value or ""),
        "currency": str(observation.get("currency") or ""),
        "unit": str(observation.get("unit") or ""),
        "meaning": str(observation.get("field_meaning")
                       or observation.get("basis") or ""),
        "verification": str(observation.get("verification") or "").lower(),
        "source": _source_of(observation),
    }


def _contract_observations(contract: Dict[str, Any]) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    seen: Set[str] = set()

    def _add(candidate: Any) -> None:
        if not isinstance(candidate, dict):
            return
        entry = _observation_entry(candidate)
        key = entry["observation_id"] or (
            entry["subject"], entry["field"], entry["value"])
        if key in seen:
            return
        if not entry["value"] and not entry["field"]:
            return
        seen.add(key)
        entries.append(entry)

    for observation in contract.get("evidence") or []:
        _add(observation)
    coverage = contract.get("coverage")
    if isinstance(coverage, dict):
        for outcome in coverage.get("outcomes") or []:
            if not isinstance(outcome, dict):
                continue
            for observation in outcome.get("evidence") or []:
                _add(observation)
    return entries


def _contract_actions(contract: Dict[str, Any]) -> List[Dict[str, Any]]:
    actions: List[Dict[str, Any]] = []
    for action in contract.get("actions") or []:
        if not isinstance(action, dict):
            continue
        action_type = str(action.get("action_type") or "")
        if action_type and action_type not in _AUTHORIZED_ACTION_TYPES:
            continue
        expected = action.get("expected")
        if not isinstance(expected, dict):
            expected = {}
        proposed = action.get("proposed_value")
        if proposed in (None, ""):
            proposed = expected.get("raw_value")
        actions.append({
            "entity": str(action.get("entity_id") or ""),
            "field": _norm(action.get("field") or ""),
            "previous": str(action.get("current_value") or ""),
            "proposed": str(proposed or ""),
            "authorized": action.get("authorized") is True,
            "status": str(action.get("status") or ""),
            "evidence_ids": [str(i) for i in action.get("evidence_ids") or []
                             if i],
            "source": _source_of(action),
            "meaning": str(expected.get("field_meaning")
                           or expected.get("destination_field_meaning")
                           or ""),
        })
    return actions


def _contract_gaps(contract: Dict[str, Any]) -> List[Dict[str, Any]]:
    gaps: List[Dict[str, Any]] = []
    for gap in contract.get("gaps") or []:
        if not isinstance(gap, dict):
            continue
        gaps.append({
            "entity": str(gap.get("entity_id") or gap.get("item") or ""),
            "field": _norm(gap.get("field")
                           or gap.get("field_selection") or ""),
            "status": str(gap.get("status") or ""),
            "requirement": str(gap.get("next_evidence_needed")
                               or gap.get("requirement") or ""),
        })
    return gaps


def _contract_tracked_values(contract: Dict[str, Any]) -> List[str]:
    """Values the accepted record binds to a subject/field: touching one of
    these is touching a tracked fact, whichever field label it sits under."""
    values: List[str] = []
    seen: Set[str] = set()

    def _add(value: Any) -> None:
        text = str(value or "").strip()
        key = _norm(text)
        if not text or key in seen or len(text) > 120:
            return
        seen.add(key)
        values.append(text)

    for observation in _contract_observations(contract):
        _add(observation["value"])
    for action in _contract_actions(contract):
        _add(action["previous"])
        _add(action["proposed"])
    coverage = contract.get("coverage")
    if isinstance(coverage, dict):
        for outcome in coverage.get("outcomes") or []:
            if not isinstance(outcome, dict):
                continue
            _add(outcome.get("source_value"))
            _add(outcome.get("draft_value"))
    return values


def _calculation_value(calc: Dict[str, Any]) -> str:
    proposed = calc.get("proposed")
    if isinstance(proposed, dict):
        amount = str(proposed.get("amount") or "")
        currency = str(proposed.get("currency") or "")
        unit = str(proposed.get("unit") or "")
        return " ".join(part for part in (amount, currency, unit) if part)
    return str(calc.get("value") or calc.get("result") or "")


def _calculation_is_recorded(calc: Dict[str, Any]) -> bool:
    """A calculation grounds a value only when its operation and inputs
    were both recorded. Statuses that publish a value (succeeded,
    computed_substituted) qualify; a stored literal is an observation, not
    a calculation."""
    status = str(calc.get("status") or "").lower()
    if status and status not in {"succeeded", "computed_substituted"}:
        return False
    operation = (calc.get("policy_id") or calc.get("operation")
                 or calc.get("formula") or calc.get("steps"))
    inputs = calc.get("inputs") or calc.get("inputs_snapshot")
    if not operation:
        return False
    if not isinstance(inputs, dict) or not inputs:
        return False
    return bool(_calculation_value(calc))


# ---------------------------------------------------------------------------
# change extraction
# ---------------------------------------------------------------------------

class _Change:
    __slots__ = ("value", "previous", "field", "field_kind", "raw",
                 "context", "label", "origin")

    def __init__(self, *, value: str, previous: str = "", field: str = "",
                 field_kind: str = "field", raw: str = "", context: str = "",
                 label: str = "", origin: str = ""):
        self.value = value
        self.previous = previous
        self.field = _norm(field)
        self.field_kind = field_kind
        self.raw = raw or value
        self.origin = origin
        self.context = context
        self.label = label or field

    def identity(self) -> Tuple[str, str, str, str]:
        # The SUBJECT context participates in identity: two milestones can
        # both carry "Owner: unassigned" and change to the same name —
        # those are two changes, never one (a shared field label must not
        # collapse different subjects).
        return (self.field_kind, self.field, _norm(self.value),
                _norm(self.context))


def _label_values(text: Any) -> List[Tuple[str, str]]:
    """Every "Label: value" line of a patch's text, in order."""
    out: List[Tuple[str, str]] = []
    for line in str(text or "").splitlines():
        match = _LABEL.match(line)
        if match:
            out.append((match.group(1).strip(), match.group(2).strip()))
    return out


def _label_value(text: Any) -> Tuple[str, str]:
    values = _label_values(text)
    return values[0] if values else ("", "")


def _target_context(text: Any, find: str, label: str) -> str:
    """The text preceding the op's target since the previous occurrence of
    the SAME field label — the local block the subject must name. This is
    structural, not vocabulary: the anchor is the op's own field, so a
    neighbouring item's subject can never leak into this op's binding."""
    text = str(text or "")
    if not find:
        return text
    low, needle = text.casefold(), find.casefold()
    index = low.find(needle)
    if index < 0:
        return text[:400]
    start = 0
    if label:
        anchor = (label.rstrip(" :") + ":").casefold()
        previous = low.rfind(anchor, 0, index)
        if previous >= 0:
            start = previous + len(anchor)
    return text[max(start, index - 400):index]


def _op_field(op: Any) -> str:
    if isinstance(op, dict):
        return str(op.get("field") or "")
    return str(getattr(op, "field", None) or "")


def _op_text(op: Any, attr: str) -> str:
    if isinstance(op, dict):
        return str(op.get(attr) or "")
    return str(getattr(op, attr, "") or "")


def _op_origin(op: Any) -> str:
    if isinstance(op, dict):
        return str(op.get("origin") or "")
    return str(getattr(op, "origin", "") or "")


def _op_text_source(op: Any, content: Any, fallback: str) -> str:
    """The op's own container text: the named field's text for dict-shaped
    content, else the serialized artifact."""
    field = _op_field(op)
    if field and isinstance(content, dict) and isinstance(content.get(field), str):
        return content[field]
    return fallback


def _changes_from_ops(
    ops: Sequence[Any],
    content: Any,
    current_text: str,
    tracked: Sequence[str],
) -> List[_Change]:
    content_keys = set(content.keys()) if isinstance(content, dict) else set()
    changes: List[_Change] = []
    for op in ops or []:
        find = _op_text(op, "find")
        replace = _op_text(op, "replace")
        if find == replace:
            continue
        op_field = _op_field(op)
        field_kind = "location" if op_field in content_keys else "field"
        label_find_values = {_norm(label): value
                             for label, value in _label_values(find)}
        label_replace_values = _label_values(replace)
        if label_replace_values:
            default_label = label_replace_values[0][0]
        elif label_find_values:
            default_label = next(iter(label_find_values))
        else:
            default_label = ""
        if field_kind == "location":
            fact_field = ""  # the op named a container, not a fact field
        else:
            fact_field = op_field or default_label
        text = _op_text_source(op, content, current_text)
        context = _target_context(
            text, find,
            default_label or (op_field if field_kind == "field" else ""))
        covered_values: List[str] = []
        origin = _op_origin(op)
        # A named field's VALUE changed: the field change is the factual
        # change (its digit runs are part of it, not separate changes).
        for label_name, value_replace in label_replace_values:
            value_find = label_find_values.get(_norm(label_name), "")
            if value_find and _value_pair_match(value_find, value_replace):
                continue
            if not value_find and _value_pair_match(value_replace, find):
                continue
            changes.append(_Change(
                value=value_replace, previous=value_find,
                origin=origin, field_kind=field_kind,
                raw=replace, context=context, label=label_name))
            covered_values.append(value_replace)
        # EMPTY-FIELD (set-field) ops: find is empty; the set value IS the
        # assignment. Same representation as a labeled line — target
        # field, no previous value, proposed value — so every edit mode
        # reaches validation with equivalent subject/field/value data.
        if not find and str(replace or "").strip() \
                and not label_replace_values:
            changes.append(_Change(
                value=replace, previous="", origin=origin,
                field_kind="field", raw=replace, context=context,
                label=op_field or default_label))
            covered_values.append(replace)
        # NEW digit-bearing values introduced by an unlabeled or
        # value-only patch: unchanged runs ride along and carry no duty.
        find_runs = {_norm(run) for run in _value_runs(find)}
        for run in _value_runs(replace):
            if _norm(run) in find_runs:
                continue
            if any(_value_in_text(run, covered) for covered in covered_values):
                continue
            changes.append(_Change(
                value=run, origin=origin, field_kind=field_kind,
                raw=replace, context=context, label=fact_field))
        # Text facts the contract TRACKS that entered this op (an entity
        # identity swap carries no digits): changing a tracked value is a
        # factual change even without a label or a number.
        for tracked_value in tracked:
            if not _value_in_text(tracked_value, replace) \
                    or _value_in_text(tracked_value, find):
                continue
            if any(_value_in_text(tracked_value, covered)
                   for covered in covered_values):
                continue
            if any(_value_pair_match(tracked_value, change.value)
                   for change in changes):
                continue
            changes.append(_Change(
                value=tracked_value, origin=origin, label=fact_field))
    return _dedupe_changes(changes)


def _dedupe_changes(changes: List[_Change]) -> List[_Change]:
    deduped: List[_Change] = []
    seen: Set[Tuple[str, ...]] = set()
    for change in changes:
        key = change.identity()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(change)
    return deduped


def _labeled_lines_with_context(
    text: Any,
) -> List[Tuple[str, str, str, str]]:
    """[(label, value, context, line)] per "Label: value" line, in order.
    The context is the block since the previous occurrence of the SAME
    label (bounded 400 chars): two subjects that share a field label stay
    distinguishable, and a neighbouring item's subject never leaks in."""
    full = str(text or "")
    out: List[Tuple[str, str, str, str]] = []
    anchor: Dict[str, int] = {}
    offset = 0
    for line in full.splitlines(keepends=True):
        label, value = _label_value(line)
        if label:
            key = _norm(label)
            start = anchor.get(key, max(0, offset - 400))
            out.append((label, value,
                        full[max(start, offset - 400):offset],
                        line.rstrip("\n")))
            anchor[key] = offset + len(line)
        offset += len(line)
    return out


def _changes_from_replace(
    current_text: str,
    new_text: str,
    tracked: Sequence[str],
) -> List[_Change]:
    """Replace-mode changes in the SAME canonical representation as patch
    ops: one assignment per moved or new labeled field (target label,
    actual previous value, actual proposed value — never the whole line),
    tracked values that entered, and new digit-bearing runs not already
    represented by an assignment. Reordering or reformatting an existing
    value is not a change; a NEW labeled field is, alphabetic or not.
    Occurrences pair per label in order, so different subjects sharing a
    field label stay separate changes."""
    changes: List[_Change] = []
    covered: List[str] = []
    old_by_label: Dict[str, List[str]] = {}
    for label, value, _context, _line in _labeled_lines_with_context(
            current_text):
        old_by_label.setdefault(_norm(label), []).append(value)
    new_lines = _labeled_lines_with_context(new_text)
    new_counts: Dict[str, int] = {}
    for label, _value, _context, _line in new_lines:
        key = _norm(label)
        new_counts[key] = new_counts.get(key, 0) + 1
    old_counts: Dict[str, int] = {}
    for label, _values in old_by_label.items():
        old_counts[label] = len(_values)
    used: Dict[str, Set[int]] = {}
    # LINES INSERTED/REMOVED for a label: consume the UNCHANGED
    # occurrences first, so a shifted existing value is never misread as
    # a change and a new occurrence is never paired with the wrong
    # subject's previous value.
    mismatch_labels = {
        key for key in new_counts
        if new_counts.get(key, 0) != old_counts.get(key, 0)}
    skip: Set[int] = set()
    for index, (label, value, _context, _line) in enumerate(new_lines):
        key = _norm(label)
        if key not in mismatch_labels or not str(value or "").strip():
            continue
        pool = old_by_label.get(key, [])
        used_indexes = used.setdefault(key, set())
        unchanged_at = next(
            (old_index for old_index in range(len(pool))
             if old_index not in used_indexes
             and _value_pair_match(pool[old_index], value)), None)
        if unchanged_at is not None:
            used_indexes.add(unchanged_at)
            skip.add(index)
    for index, (label, value, context, line) in enumerate(new_lines):
        if index in skip or not str(value or "").strip():
            continue
        key = _norm(label)
        pool = old_by_label.get(key, [])
        used_indexes = used.setdefault(key, set())
        previous = ""
        if new_counts.get(key, 0) == old_counts.get(key, 0):
            # SAME OCCURRENCE COUNT: pair positionally. A value swapped
            # from another subject's field changes THIS subject's fact —
            # never "unchanged" just because the text exists elsewhere.
            position = min(len(used_indexes), max(0, len(pool) - 1))
            previous = pool[position] if pool else ""
            used_indexes.add(position)
            if pool and _value_pair_match(previous, value):
                continue
        else:
            for old_index in range(len(pool)):
                if old_index not in used_indexes:
                    previous = pool[old_index]
                    used_indexes.add(old_index)
                    break
            if pool and _value_pair_match(previous, value):
                continue
        changes.append(_Change(
            value=value, previous=previous, raw=line,
            context=context, label=label))
        covered.append(value)
    for value in tracked:
        if not _value_in_text(value, new_text) \
                or _value_in_text(value, current_text):
            continue
        if any(_value_in_text(value, done)
               or _value_pair_match(value, done) for done in covered):
            continue
        changes.append(_Change(
            value=value, raw=new_text, context=current_text[-400:]))
    for run in _value_runs(new_text):
        if _value_in_text(run, current_text):
            continue
        if any(_value_in_text(run, done) for done in covered):
            continue
        changes.append(_Change(
            value=run, raw=new_text, context=current_text[-400:]))
    return _dedupe_changes(changes)


# ---------------------------------------------------------------------------
# grounding
# ---------------------------------------------------------------------------

def _entity_visible(entity: str, change: _Change,
                    request_message: str) -> bool:
    entity = str(entity or "")
    if not str(entity).strip():
        return True
    haystack = _norm(change.context) + " " + _norm(request_message)
    if _norm(entity) in haystack:
        return True
    tokens = set(_words(entity))
    return bool(tokens) and tokens <= set(_words(haystack))


def _field_compatible(recorded: str, change: _Change) -> bool:
    if not recorded:
        return True
    if change.field_kind == "location":
        # The op named a CONTENT LOCATION (a dict key like "body"), not a
        # fact field; the contract field cannot be compared to it.
        return True
    if not change.field:
        return True
    return _value_pair_match(recorded, change.field)


def _observation_grounds(
    observation: Dict[str, Any],
    change: _Change,
    request_message: str,
) -> Optional[Tuple[str, str]]:
    """Whether a verified observation grounds this change. Returns
    (provenance_class, refusal_reason_or_empty)."""
    if observation["verification"] not in {"verified", "stored", "calculated"}:
        return None
    if not _value_pair_match(observation["value"], change.value):
        # The value may be split: amount in `raw_value`, meaning in
        # currency/unit ("45000" + "EUR" vs "45,000.00 EUR").
        composed = " ".join(part for part in (
            observation["value"], observation["currency"],
            observation["unit"]) if part)
        if not composed or not _value_pair_match(composed, change.value):
            return None
    if not _field_compatible(observation["field"], change):
        return None
    if not _entity_visible(observation["subject"], change, request_message):
        return None
    declared = {observation["currency"].casefold(),
                observation["unit"].casefold()} - {""}
    if declared:
        proposed_tokens = _unit_tokens_near_numbers(change.raw or change.value)
        conflicts = proposed_tokens - declared
        if conflicts:
            return (None, "unit_mismatch")
    return (Provenance.EVIDENCE, "")


def _action_grounds(
    action: Dict[str, Any],
    change: _Change,
    request_message: str,
    observation_ids: Set[str],
) -> Tuple[Optional[str], str]:
    """Whether a contract action grounds this change. Returns
    (provenance_class_or_None, refusal_reason_or_empty)."""
    if not _value_pair_match(action["proposed"], change.value):
        return None, ""
    if not _field_compatible(action["field"], change):
        return None, ""
    if action["entity"] \
            and not _entity_visible(action["entity"], change, request_message):
        return None, ""
    # REVISION ANCHOR: the action recorded the value it replaces. An edit
    # that no longer starts from that value is applying a stale action.
    if action["previous"]:
        if change.previous:
            if not _value_in_text(action["previous"], change.previous):
                return None, ""
        elif not _value_in_text(action["previous"], change.raw):
            return None, ""
    if not action["authorized"] or action["status"] != "ready":
        if not action["status"] and action["authorized"]:
            return Provenance.EVIDENCE, ""
        return None, Refusal.UNAUTHORIZED
    # REFERENCES: when the contract carries its observations, every id the
    # action cites must resolve (when it carries none, the older contract
    # shape is tolerated and the postcondition gate stays authoritative).
    if action["evidence_ids"] and observation_ids:
        if any(identifier not in observation_ids
               for identifier in action["evidence_ids"]):
            return None, Refusal.UNRESOLVED
    return Provenance.EVIDENCE, ""


def _calculation_grounds(calculation: Dict[str, Any],
                         change: _Change) -> bool:
    if not _calculation_is_recorded(calculation):
        return False
    return _value_pair_match(_calculation_value(calculation), change.value)


def _requirement_naming(
    change: _Change,
    gaps: Sequence[Dict[str, Any]],
    request_message: str,
) -> Optional[Dict[str, Any]]:
    for gap in gaps:
        field_matches = _field_compatible(gap["field"], change)
        if gap["field"] and not field_matches:
            continue
        if gap["entity"] and not _entity_visible(
                gap["entity"], change, request_message):
            continue
        if not gap["field"] and not gap["entity"]:
            continue
        return gap
    return None


def _unsupported_detail(change: _Change) -> str:
    target = change.label or change.field or "(unlabelled)"
    return f"{change.value} for {target}"


# ---------------------------------------------------------------------------
# the validator
# ---------------------------------------------------------------------------

def validate_factual_changes(
    *,
    ops: Optional[Sequence[Any]] = None,
    current_text: str = "",
    new_text_for_replace: Optional[str] = None,
    request_message: str = "",
    evidence_contract: Optional[Dict[str, Any]] = None,
    calculations: Optional[Sequence[Dict[str, Any]]] = None,
    accepted_assignments: Optional[Dict[str, Any]] = None,
    content: Any = None,
    artifact_id: Optional[str] = None,
    expected_revision: Optional[str] = None,
) -> Dict[str, Any]:
    """Validate every factual change against the accepted record.

    Returns a verdict dict:

      {"grounded": bool,
       "artifact": {"id": ..., "expected_revision": ...},
       "changes":  [... every factual change, grounded or refused ...],
       "provenance": [... class + source identity/version/meaning ...],
       "refusals": [... reason/value/target + the record's own requirement ...],
       "skipped": <only when there is no accepted record>}

    The provenance class is REPORTED so the durable outcome states its
    grounding truthfully: user-supplied is not independently verified,
    a calculation is not a source observation.
    """
    verdict: Dict[str, Any] = {
        "grounded": True,
        "artifact": {"id": artifact_id, "expected_revision": expected_revision},
        "changes": [],
        "provenance": [],
        "refusals": [],
    }
    request_message = str(request_message or "")
    if not request_message.strip() and not evidence_contract:
        verdict["skipped"] = "no_accepted_record"
        return verdict

    contract = evidence_contract if isinstance(evidence_contract, dict) else {}
    current_text = str(current_text or "")
    observations = _contract_observations(contract)
    observation_ids = {entry["observation_id"] for entry in observations
                       if entry["observation_id"]}
    actions = _contract_actions(contract)
    gaps = _contract_gaps(contract)
    tracked = _contract_tracked_values(contract)

    if new_text_for_replace is not None:
        changes = _changes_from_replace(
            current_text, str(new_text_for_replace), tracked)
    else:
        changes = _changes_from_ops(
            ops or [], content, current_text, tracked)
    accepted_assignments_entries = [
        entry for entry in (accepted_assignments or {}).get("assignments") or []
        if isinstance(entry, dict) and str(entry.get("value") or "")
    ]

    for change in changes:
        # THE PLANNER'S RECORDED ORIGIN (verifier corrected work order
        # 1-2): the interpretation contract tags each proposed
        # assignment — user_supplied, source_reference, calculation,
        # unresolved. The tag decides the duty; deterministic checks
        # verify consistency (an LLM's assertion is not its evidence).
        origin = (change.origin or "").strip().lower()
        record: Dict[str, Any] = {
            "field": change.label or change.field,
            "subject_context": change.field_kind,
            "previous": change.previous,
            "value": change.value,
        }
        requirement = _requirement_naming(change, gaps, request_message)
        if requirement is not None:
            record["grounding"] = Refusal.UNRESOLVED
            verdict["changes"].append(record)
            verdict["refusals"].append({
                "reason": Refusal.UNRESOLVED,
                "value": change.value,
                "target": change.label or change.field,
                "named_requirement": (
                    requirement["requirement"]
                    or f"{requirement['entity']} {requirement['field']} "
                       f"({requirement['status']})".strip()),
            })
            continue
        # 1) THE ACCEPTED REQUEST ASSIGNMENT: the request's own recorded
        # assignments — or, when the record says nothing about this
        # target, the request text's own assignment window — are the
        # authority for user-supplied values. The planner's origin tag is
        # a proposal to check, never a substitute: request-wide text
        # presence blesses an unresolved reference ("the exact number
        # from our records" appears in the request and is not a supplied
        # value). Evidence/calculation elsewhere in the record may still
        # ground the change below.
        target_name = change.label or change.field
        bound_entry = None  # the accepted assignment about this target
        for entry in accepted_assignments_entries:
            entry_target = str(entry.get("target") or "")
            if not entry_target or not target_name:
                continue
            # A CONTRACT ENTRY WHOSE VALUE IS A REFERENCE IS AN
            # OBLIGATION, NOT A LICENCE (owner reproduction 2026-10-15:
            # "set the department to the department from our records").
            # The extractor demotes such values to unresolved; a
            # contract assembled by any other producer must not certify
            # the reference's own words either.
            if _is_reference_span(entry.get("value"), ""):
                continue
            if not (_norm(entry_target) in _norm(target_name)
                    or _norm(target_name) in _norm(entry_target)):
                continue
            bound_entry = entry
            if _value_pair_match(entry["value"], change.value):
                break
        matched = (bound_entry is not None
                   and _value_pair_match(bound_entry["value"], change.value))
        present = _value_present_in_request(change.value, request_message)
        # When the record says nothing about this target, the request
        # text's own assignment still grounds (a phrasing the extractor
        # does not capture must not refuse what the user plainly wrote).
        # A reference phrase is a lookup, not a supplied literal — the
        # text fallback never blesses one.
        text_assigned = (
            bound_entry is None
            and _request_assigns_value(
                change.value, target_name, request_message))
        if matched or text_assigned:
            record["grounding"] = Provenance.USER
            record["request_assignment"] = True
            verdict["changes"].append(record)
            verdict["provenance"].append({
                "value": change.value, "target": target_name,
                "class": Provenance.USER, "source": None,
            })
            continue
        # 2) AN AUTHORIZED CONTRACT ACTION bound to the subject/field.
        action_class, action_refusal = None, ""
        for action in actions:
            grounded, refusal = _action_grounds(
                action, change, request_message, observation_ids)
            if grounded:
                action_class = grounded
                record["grounding"] = grounded
                record["action"] = {
                    "entity": action["entity"], "field": action["field"],
                    "previous": action["previous"],
                    "proposed": action["proposed"],
                    "evidence_ids": action["evidence_ids"],
                }
                break
            if refusal and not action_refusal:
                action_refusal = refusal
        if action_class:
            verdict["changes"].append(record)
            verdict["provenance"].append({
                "value": change.value, "target": change.label or change.field,
                "class": action_class, "source": None,
                "recorded_previous": record.get("action", {}).get("previous"),
            })
            continue
        # 3) A VERIFIED OBSERVATION the contract binds to this field and a
        # subject resolvable at the target location.
        observation_class, observation_refusal = None, ""
        for observation in observations:
            grounded = _observation_grounds(
                observation, change, request_message)
            if grounded:
                observation_class, observation_refusal = grounded
                if observation_class:
                    record["grounding"] = observation_class
                    record["observation_id"] = observation["observation_id"]
                    break
                if observation_refusal:
                    break
        if observation_class:
            entry = {
                "value": change.value, "target": change.label or change.field,
                "class": observation_class, "source": observation["source"],
                "meaning": {
                    "currency": observation["currency"],
                    "unit": observation["unit"],
                    "field_meaning": observation["meaning"],
                },
            }
            verdict["changes"].append(record)
            verdict["provenance"].append(entry)
            continue
        # 4) A RECORDED CALCULATION with its operation and inputs.
        calculation_class = None
        for calculation in calculations or []:
            if _calculation_grounds(calculation, change):
                calculation_class = Provenance.CALC
                record["calculation"] = {
                    "operation": str(calculation.get("policy_id")
                                     or calculation.get("operation")
                                     or calculation.get("formula") or ""),
                    "inputs": calculation.get("inputs")
                    or calculation.get("inputs_snapshot") or {},
                }
                break
        if calculation_class:
            verdict["changes"].append(record)
            verdict["provenance"].append({
                "value": change.value, "target": change.label or change.field,
                "class": calculation_class, "source": None,
            })
            continue
        # Nothing grounds it: the value is refused, named, and never
        # certified. A value that contradicts the accepted assignment for
        # this target is not groundable by raw text presence — the
        # record's own assignment, not the message's incidental words, is
        # the authority (UNSUPPORTED). A reference-tagged or digit-bearing
        # value grounded NOWHERE is an UNRESOLVED factual requirement —
        # named for the user, never manufactured. An explicitly tagged
        # user_supplied value absent from the instruction is a
        # miscategorization (UNSUPPORTED); a bare echo of the request's
        # words assigned to nothing is UNRESOLVED.
        if bound_entry is not None and not matched:
            reason = Refusal.UNSUPPORTED
            record["named_requirement"] = (
                f"the accepted record assigns "
                f"{str(bound_entry['value'])!r} to "
                f"'{str(bound_entry.get('target') or target_name)}'; "
                f"{change.value!r} is not the supplied value")
        elif origin in ("source_reference", "unresolved") \
                or any(ch.isdigit() for ch in change.value):
            reason = Refusal.UNRESOLVED
            record["named_requirement"] = (
                f"the value for '{change.label or change.field}' is not "
                "available from the instruction, records, or a calculation")
        elif origin == Provenance.USER and not present:
            reason = Refusal.UNSUPPORTED
            record["named_requirement"] = (
                "the planner tagged user_supplied but the value does not "
                "appear in the instruction")
        elif present:
            reason = Refusal.UNRESOLVED
            record["named_requirement"] = (
                f"the value for '{change.label or change.field}' is not "
                "available from the instruction, records, or a calculation")
        else:
            reason = observation_refusal or action_refusal \
                or Refusal.UNSUPPORTED
        record["grounding"] = reason
        verdict["changes"].append(record)
        verdict["refusals"].append({
            "reason": reason,
            "value": change.value,
            "target": change.label or change.field,
            "detail": _unsupported_detail(change),
            "named_requirement": record.get("named_requirement", ""),
        })

    verdict["grounded"] = not verdict["refusals"]
    return verdict


__all__ = ["Provenance", "Refusal", "validate_factual_changes"]
