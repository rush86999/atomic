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

    def identity(self) -> Tuple[str, str, str]:
        return (self.field_kind, self.field, _norm(self.value))


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
                origin=str(getattr(op, 'origin', '') or ''),
                field_kind=field_kind,
                raw=replace, context=context, label=label_name))
            covered_values.append(value_replace)
        # NEW digit-bearing values introduced by an unlabeled or
        # value-only patch: unchanged runs ride along and carry no duty.
        find_runs = {_norm(run) for run in _value_runs(find)}
        for run in _value_runs(replace):
            if _norm(run) in find_runs:
                continue
            if any(_value_in_text(run, covered) for covered in covered_values):
                continue
            changes.append(_Change(
                value=run, origin=str(getattr(op, 'origin', '') or ''),
                field_kind=field_kind,
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
                value=tracked_value, origin=str(getattr(op, 'origin', '') or ''),
                label=fact_field))
    return _dedupe_changes(changes)


def _dedupe_changes(changes: List[_Change]) -> List[_Change]:
    deduped: List[_Change] = []
    seen: Set[Tuple[str, str, str]] = set()
    for change in changes:
        key = change.identity()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(change)
    return deduped


def _changes_from_replace(
    current_text: str,
    new_text: str,
    tracked: Sequence[str],
) -> List[_Change]:
    """Replace-mode changes: labeled field values that moved, tracked
    values that entered, and new digit-bearing runs."""
    changes: List[_Change] = []
    old_labels = {_norm(label): (label, value)
                  for line in str(current_text or "").splitlines()
                  for label, value in [_label_value(line)] if label}
    for line in str(new_text or "").splitlines():
        label, value = _label_value(line)
        if not label:
            continue
        previous_entry = old_labels.get(_norm(label))
        if previous_entry and not _value_pair_match(previous_entry[1], value):
            changes.append(_Change(
                value=line,
                raw=line, context=current_text[-400:], label=label))
    for value in tracked:
        if _value_in_text(value, new_text) \
                and not _value_in_text(value, current_text):
            changes.append(_Change(
                value=value, raw=new_text, context=current_text[-400:]))
    for run in _value_runs(new_text):
        if _value_in_text(run, current_text):
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
        # 1) EXPLICIT USER-SUPPLIED VALUE: the PLANNER must have tagged
        # the op user_supplied AND the value span must appear in the
        # instruction. Request-wide substring presence alone is not an
        # explicit assignment — a phrase describing where a value lives
        # ("the exact number from our records") also appears in the
        # request and is an unresolved reference, not a supplied value.
        if origin == "user_supplied" and _value_in_text(
                change.value, request_message):
            record["grounding"] = Provenance.USER
            record["provenance_span"] = True
            verdict["changes"].append(record)
            verdict["provenance"].append({
                "value": change.value, "target": change.label or change.field,
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
        # ORIGIN CONSISTENCY (corrected work order 1-2): a recorded
        # source_reference or unresolved origin means the value must be
        # RESOLVED — it is refused as an unresolved requirement unless
        # the accepted evidence carries the value bound to the requested
        # subject/field. A user_supplied origin requires the value span
        # in the instruction (necessary, not sufficient — the span
        # establishes provenance, not the semantic classification).
        if origin in ("source_reference", "unresolved"):
            resolved = any(
                _value_pair_match(e["value"], change.value)
                or (e["value"] and _norm(e["value"]) in _norm(change.value))
                for e in observations)
            if not resolved:
                record["grounding"] = Refusal.UNRESOLVED
                record["named_requirement"] = (
                    f"the value for '{change.label or change.field}' "
                    "must come from records or the user")
                verdict["changes"].append(record)
                verdict["refusals"].append({
                    "reason": Refusal.UNRESOLVED,
                    "value": change.value,
                    "target": change.label or change.field,
                    "detail": record["named_requirement"],
                })
                continue
        if origin == Provenance.USER and \
                _norm(change.value) not in _norm(request_message):
            record["grounding"] = Refusal.UNSUPPORTED
            record["named_requirement"] = (
                "the planner tagged user_supplied but the value does not "
                "appear in the instruction")
            verdict["changes"].append(record)
            verdict["refusals"].append({
                "reason": Refusal.UNSUPPORTED,
                "value": change.value,
                "target": change.label or change.field,
                "detail": record["named_requirement"],
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
        # certified. An unauthorized action for this target is named as
        # such instead of the generic unsupported refusal. A digit-bearing
        # or reference-tagged value grounds NOWHERE is an UNRESOLVED
        # factual requirement — named for the user, never manufactured.
        _digit_bearing = any(ch.isdigit() for ch in change.value)
        if _digit_bearing or origin in ("source_reference", "unresolved"):
            named = (
                f"the value for '{change.label or change.field}' is not "
                "available from the instruction, records, or a calculation")
            record["grounding"] = Refusal.UNRESOLVED
            record["named_requirement"] = named
            verdict["changes"].append(record)
            verdict["refusals"].append({
                "reason": Refusal.UNRESOLVED,
                "value": change.value,
                "target": change.label or change.field,
                "named_requirement": named,
            })
            continue
        reason = observation_refusal or action_refusal or Refusal.UNSUPPORTED
        record["grounding"] = reason
        verdict["changes"].append(record)
        verdict["refusals"].append({
            "reason": reason,
            "value": change.value,
            "target": change.label or change.field,
            "detail": _unsupported_detail(change),
        })

    verdict["grounded"] = not verdict["refusals"]
    return verdict


__all__ = ["Provenance", "Refusal", "validate_factual_changes"]
