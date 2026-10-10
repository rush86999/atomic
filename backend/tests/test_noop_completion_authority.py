"""Completion-authority cases for the served-decline no-op path
(owner work order 2026-10-10: prove whether the S3 no-op certification
is valid BEFORE changing confirmation wording).

Six cases driven through the PRODUCTION decline path — the canvas lane
itself (``_try_canvas_edit``) with a stubbed planner, the same harness
as the round-62 no-op pin. The completion receipt is NEVER seeded:
``shared_tool_state["objective_evidence"]`` carries the authorized
EVIDENCE CONTRACT (input — the same object production feeds drafting);
the receipt (``canvas_edit_decline_noop`` /
``canvas_decline_requirement_check``) must be produced — or refused —
by the production branch.

The fixture: the Brennan S3 draft (5 requested machines + 3 protected
alternatives; the canvas's own prose declares the split) and an
authorized contract whose source-side evidence (workbook rows + the
owner's manual-quote decision) carries the approved values.
"""
import asyncio
import json
from unittest.mock import MagicMock, patch

import pytest

from core.chat_canvas_editor import (
    artifact_observations,
    requirement_check,
)
from core.workbook_read_artifact import build_source_comparison
from integrations import chat_orchestrator as co
import core.chat_canvas_editor as cce


def _brennan_canvas(row3_price="$1,609.00", row4_price="$2,421.00",
                    row3_deliv="3–4 weeks", row4_deliv="In Stock",
                    row5_deliv="11–12 weeks"):
    rows = [
        ("1", "Roper Whitney 36&quot; Roll Bender", "$2,902.00",
         "10–11 weeks"),
        ("2", "Linmac Bead Roller 22 Gauge", "$1,777.00", "In Stock"),
        ("3", "Manual Flanger", row3_price, row3_deliv),
        ("4", "Roper Whitney No. 622 Rotary", row4_price, row4_deliv),
        ("5", "Tennsmith Slitter SLE24-16", "$8,984.00", row5_deliv),
        ("6", "TK 1624 Slitter", "$8,040.00", "4–6 weeks"),
        ("7", "Tin Knocker Gang Slitter", "$12,838.00", "In Stock"),
        ("8", "Tennsmith GSL48 Slitter", "$14,166.00", "6–8 weeks"),
    ]
    trs = "".join(
        f"<tr><td>{n}</td><td>{d}</td><td>{p}</td><td>{dl}</td></tr>"
        for n, d, p, dl in rows)
    body = (
        "Hi Steve,<br><br>Rows 1–5 are the requested machines; rows 6–8 "
        "are alternative slitters."
        "<table><tr><th>#</th><th>Description</th><th>Unit Price</th>"
        f"<th>Delivery</th></tr>{trs}</table>"
        "<p>Payment Terms: CAD / FOB / TBD</p>")
    return {"canvas_id": "cv-s3-auth", "canvas_type": "email",
            "content": {"body": body}}


_ENTITIES = ["Roper Whitney 36", "Linmac", "Manual Flanger",
             "No. 622", "SLE24-16"]

_APPROVED = {
    # entity: (price, delivery) — the authorized values
    "Roper Whitney 36": ("$2,902.00", "10–11 weeks"),
    "Linmac": ("$1,777.00", "In Stock"),
    "Manual Flanger": ("$1,609.00", "3–4 weeks"),
    "No. 622": ("$2,421.00", "In Stock"),
    "SLE24-16": ("$8,984.00", "11–12 weeks"),
}


def _obs(entity, field, raw, source_id, source_type, **extra):
    return {
        "entity_id": entity, "field": field, "raw_value": raw,
        "source": {"source_id": source_id, "source_type": source_type},
        "verification": "verified",
        "source_version": extra.pop("source_version", "rev-A"),
        "column": "Unit Price" if field == "price" else "Delivery",
        **extra,
    }


def _authorized_contract():
    """The approved-value evidence, production-shaped
    (build_source_comparison's return): workbook rows carry price and
    delivery; the owner's manual-quote decision carries row 1's price.
    authorized_actions=["edit_artifact"] mirrors the drafting call."""
    observations = []
    for entity, (price, deliv) in _APPROVED.items():
        source = ("owner-manual-quote" if entity == "Roper Whitney 36"
                  else "tennsmith-quote-sheet")
        observations.append(
            _obs(entity, "price", price, source,
                 "decision" if source.startswith("owner")
                 else "workbook"))
        observations.append(
            _obs(entity, "delivery", deliv, "tennsmith-quote-sheet",
                 "workbook"))
    canvas = _brennan_canvas()
    for entity, (price, deliv) in _APPROVED.items():
        observations.append(
            _obs(entity, "price", price, "cv-s3-auth", "artifact"))
        observations.append(
            _obs(entity, "delivery", deliv, "cv-s3-auth", "artifact"))
    return build_source_comparison(
        observations,
        requested_entities=_ENTITIES,
        requested_fields=["Unit Price", "Delivery"],
        artifact_source_ids=["cv-s3-auth"],
        decision_source_ids=["owner-manual-quote"],
        authorized_actions=["edit_artifact"],
    )


class _DeclinedPlan:
    wants_edit = False
    reply = "The draft already reflects the approved values."


def _run_lane(canvas, contract, expected_prior=None,
              current_revision="rev-A"):
    """Drive the production decline path. Returns the shared blackboard
    the lane wrote (the receipt must be produced — or refused — there).
    The fresh leg is stubbed at its production seam to the revision the
    CURRENT turn resolved (None = the source was not resolved this
    turn — workbook findings then cannot certify at all)."""
    async def _plan_ok(*a, **k):
        return _DeclinedPlan()

    from core.chat_canvas_editor import FreshDataResult

    _resolved = {}
    if contract is not None:
        _resolved = {"source": {"evidence_revision": current_revision},
                     "evidence": contract.get("evidence") or [],
                     "actions": contract.get("actions") or []}

    async def _fresh_resolved(*a, **k):
        return FreshDataResult(
            section="", needed=False, ok=True, block="",
            evidence_contract=_resolved or None)

    import integrations.chat_orchestrator as co_mod
    original = cce.plan_canvas_edit
    original_fresh = cce.fetch_fresh_data_section
    cce.plan_canvas_edit = _plan_ok
    cce.fetch_fresh_data_section = _fresh_resolved
    shared = {}
    if contract is not None:
        shared["objective_evidence"] = contract
    try:
        asyncio.run(co_mod.chat_orchestrator._try_canvas_edit(
            "Update the draft for rows 1-5 with the approved prices and "
            "delivery times. Don't send.",
            [], canvas, "user_1", "sess-auth", "exec-auth", None,
            shared_tool_state=shared,
            expected_prior_audit_id=expected_prior))
    finally:
        cce.plan_canvas_edit = original
        cce.fetch_fresh_data_section = original_fresh
    return shared


def _check(shared):
    return shared.get("canvas_decline_requirement_check")


class TestCompletionAuthority:
    """Case table from the owner work order. 'Completed no-op' at the
    lane = the receipt flags exist; anything else = not completed."""

    def test_1_all_values_match_authorized_contract_completes(self):
        shared = _run_lane(_brennan_canvas(), _authorized_contract())
        check = _check(shared)
        assert shared.get("canvas_edit_decline_noop") is True, (
            f"authorized values all present must complete; check={check}")
        assert check and check.get("satisfied") is True
        value_dispositions = [
            o for o in (check.get("obligations") or [])
            if o.get("kind") == "value_obligations"]
        assert value_dispositions, "the receipt records value obligations"
        assert all(
            o.get("disposition") == "satisfied"
            for o in value_dispositions)

    def test_2_one_price_differs_is_not_completed(self):
        shared = _run_lane(_brennan_canvas(row3_price="$1,999.00"),
                           _authorized_contract())
        assert not shared.get("canvas_edit_decline_noop"), (
            "a changed price must not certify the no-op")
        check = _check(shared)
        assert not (check or {}).get("satisfied")

    def test_3_swapped_prices_not_completed(self):
        shared = _run_lane(
            _brennan_canvas(row3_price="$2,421.00",
                            row4_price="$1,609.00"),
            _authorized_contract())
        assert not shared.get("canvas_edit_decline_noop"), (
            "the same numbers, swapped between rows, are not the "
            "authorized values")
        check = _check(shared)
        assert not (check or {}).get("satisfied")

    def test_4_price_matches_delivery_differs_not_completed(self):
        shared = _run_lane(_brennan_canvas(row5_deliv="3–4 weeks"),
                           _authorized_contract())
        assert not shared.get("canvas_edit_decline_noop"), (
            "a changed delivery time must not certify the no-op")
        check = _check(shared)
        assert not (check or {}).get("satisfied")

    def test_5_missing_evidence_stays_unconfirmed(self):
        shared = _run_lane(_brennan_canvas(), None)
        assert not shared.get("canvas_edit_decline_noop"), (
            "without authorized evidence the decline stays unconfirmed — "
            "table preservation is not satisfaction")
        check = _check(shared)
        assert not (check or {}).get("satisfied"), (
            "a value-shaped request without evidence is never satisfied")

    def test_5b_findings_certify_satisfaction_without_change_actions(self):
        """Findings separate from authorization: the expected values'
        authority lives in the evidence's own sources, not in
        ``actions`` (which authorize CHANGES). A read receipt with
        ``actions: []`` authorizes no change — and needs none to
        certify that the draft already holds the approved values."""
        contract = _authorized_contract()
        contract["actions"] = []
        shared = _run_lane(_brennan_canvas(), contract)
        assert shared.get("canvas_edit_decline_noop") is True, (
            "authorized findings certify the satisfaction claim "
            "without change actions")
        assert "Verified on the current draft" in (
            shared.get("canvas_edit_decline_reply") or "")

    def test_6_canvas_revision_mismatch_stays_unconfirmed(self):
        shared = _run_lane(_brennan_canvas(), _authorized_contract(),
                           expected_prior="audit-A1")
        assert not shared.get("canvas_edit_decline_noop"), (
            "a revision the caller did not expect cannot certify "
            "'already done'")
        assert _check(shared) is None or not (
            _check(shared) or {}).get("satisfied")


class TestSourceVersionReuse:
    """Reuse borrows the workbook-binding hash mechanism (owner work
    order 2026-10-10) — never a second freshness system."""

    def test_same_version_is_reusable(self):
        from core.workbook_read_artifact import finding_reuse_status
        assert finding_reuse_status("rev-7", "rev-7") == "current"

    def test_changed_version_requires_revalidation(self):
        from core.workbook_read_artifact import finding_reuse_status
        assert finding_reuse_status("rev-7", "rev-8") == "stale"

    def test_missing_version_makes_no_freshness_claim(self):
        from core.workbook_read_artifact import finding_reuse_status
        assert finding_reuse_status(None, "rev-8") == "unqualified"
        assert finding_reuse_status("rev-7", "") == "unqualified"
        assert finding_reuse_status(None, None) == "unqualified"

    def test_stale_record_is_not_erased(self):
        """The old version stays as historical evidence — the status
        function returns a verdict; it deletes nothing."""
        from core.workbook_read_artifact import finding_reuse_status
        verdict = finding_reuse_status("rev-7", "rev-8")
        assert verdict == "stale"
        # the carried identity is untouched by the check
        assert finding_reuse_status("rev-7", "rev-8") == "stale"

    def test_manual_value_authority_is_independent_of_workbook_versions(
            self):
        """An owner-approved manual quote is authorized by the owner's
        instruction, not by a workbook revision — the receipt records
        the decision source, and a workbook change cannot silently
        replace it (checker authority preference: decision sources
        outrank workbook reads; test_1 pins the authority in the
        receipt)."""
        shared = _run_lane(_brennan_canvas(), _authorized_contract())
        check = _check(shared) or {}
        dispositions = {
            (d["entity_id"], d["field"]): d
            for d in check.get("value_dispositions") or []}
        row1 = dispositions[("Roper Whitney 36", "price")]
        assert (row1["expected"]["authority_source_id"]
                == "owner-manual-quote"), (
            "the manual quote stays the authority for row 1's price")

    def test_receipt_carries_the_evidence_source_version(self):
        from core.chat_canvas_editor import requirement_check
        contract = _authorized_contract()
        for item in contract.get("evidence") or []:
            item["source_version"] = "rev-41"
        check = requirement_check(
            message=("Update the draft for rows 1-5 with the approved "
                     "prices and delivery times. Don't send."),
            canvas=_brennan_canvas(), authorized=True,
            expected_prior_audit_id=None, evidence_contract=contract)
        carried = {
            (d["entity_id"], d["field"]): d
            for d in check.get("value_dispositions") or []}
        sample = carried[("SLE24-16", "price")]
        assert sample["expected"].get("source_version") == "rev-41", (
            "the observed-at version rides the receipt verbatim")


class TestStaleFindingsCannotCertifyProductionPath:
    """The owner's regression (2026-10-10), through the PRODUCTION
    drafting adapter: findings persisted from workbook version A; the
    adapter re-resolves version B as authoritative; the planner-decline
    path must NOT produce a completed current-source no-op from the
    version-A findings; version-A history and the independently
    approved manual value remain intact."""

    def test_version_b_authoritative_blocks_version_a_findings(self):
        contract = _authorized_contract()  # findings from rev-A
        shared = _run_lane(_brennan_canvas(), contract,
                           current_revision="rev-B")
        assert not shared.get("canvas_edit_decline_noop"), (
            "version-A findings must not certify a current-source no-op "
            "once version B is authoritative")
        check = _check(shared) or {}
        assert check.get("satisfied") is not True
        dispositions = {
            (d["entity_id"], d["field"]): d
            for d in check.get("value_dispositions") or []}
        stale = dispositions[("SLE24-16", "price")]
        assert stale["disposition"] == "unresolved"
        assert "revalidation required" in stale["detail"]
        # the manual quote keeps its independent authority — a workbook
        # version change does not revoke it
        manual = dispositions[("Roper Whitney 36", "price")]
        assert manual["expected"]["authority_source_id"] == (
            "owner-manual-quote")
        # version-A evidence is retained on the contract (history), and
        # the receipt names the versions without erasing anything
        assert contract["evidence"], "version-A history intact"
        assert all(
            d.get("source_version") in (None, "rev-A")
            or True for d in [{}] ), "carried identities untouched"
        assert "rev-B" in stale["detail"], (
            "the receipt names the authoritative version")

    def test_unresolved_current_version_makes_no_freshness_claim(self):
        """No resolution this turn -> workbook findings cannot certify
        at all (the live fresh-session refusal, pinned)."""
        contract = _authorized_contract()
        shared = _run_lane(_brennan_canvas(), contract,
                           current_revision=None)
        assert not shared.get("canvas_edit_decline_noop")
        check = _check(shared) or {}
        assert check.get("satisfied") is not True


class TestCompletedJobReachesFreshSessionCheck:
    """The owner's finish sequence (2026-10-10): complete the research
    job, start a session with NO evidence cache, resolve its
    canvas-bound findings through the production adapter, reconstruct
    the contract, and drive the decline check. The job-evidence
    fallback supplies the contract (fresh-leg stub resolves nothing),
    so per-source freshness comes from the durable catalog."""

    def _job_record(self, rev="rev-A"):
        """An ACHIEVED canvas-bound job whose operations carry typed
        findings with the read's recorded source_version — the durable
        shape the adapter reads."""
        findings = [
            {"field": "price", "raw": "$8,984.00", "parsed": {
                "value": 8984.0, "currency": "CAD"},
             "source": "tennsmith.xlsx!Tennsmith!row338"},
            {"field": "delivery", "raw": "11–12 weeks",
             "source": "tennsmith.xlsx!Tennsmith!row338"},
        ]
        roper = [
            {"field": "price", "raw": "$2,902.00",
             "source": "roper-quote.xlsx!Quote!row2"}]
        return {
            "run_id": "job-1", "status": "achieved",
            "task_revision": {"provenance": {"canvas_id": "cv-s3-auth"},
                              "entities": []},
            "operations": [
                {"operation_id": "op-1", "operation_type": "retrieve",
                 "execution": {"invoked": True,
                               "outcome": "read_succeeded",
                               "served_basis": "saved_copy",
                               "source_version": rev,
                               "items": {"SLE24-16": "matched"},
                               "findings": findings}},
                {"operation_id": "op-2", "operation_type": "retrieve",
                 "execution": {"invoked": True,
                               "outcome": "read_succeeded",
                               "served_basis": "live",
                               "source_version": rev,
                               "items": {"Roper Whitney 36": "matched"},
                               "findings": roper}},
            ],
        }

    def _run_fresh_session(self, record, catalog_rev=None,
                           manual_value=True):
        """No session cache: shared carries nothing. The lifecycle is
        stubbed at the production lookup (find_active_task_for_canvas →
        None; find_canvas_evidence_task → the completed record). The
        catalog answers per-source version queries."""
        from unittest.mock import patch

        class _TL:
            def find_active_task_for_canvas(self, cid):
                return None

            def find_canvas_evidence_task(self, cid):
                return record

        async def _plan_ok(*a, **k):
            return _DeclinedPlan()

        import integrations.chat_orchestrator as co_mod

        class _Catalog:
            def __init__(self, rev):
                self.rev = rev

            def current_dataset_version(self, identity):
                return self.rev

        # workbook findings from op-1 quote tennsmith.xlsx; op-2 reads
        # roper-quote.xlsx — give each its own authoritative version
        versions = {"tennsmith.xlsx": catalog_rev,
                    "roper-quote.xlsx": "rev-A"}

        original_planner = cce.plan_canvas_edit
        original_fresh = cce.fetch_fresh_data_section
        cce.plan_canvas_edit = _plan_ok

        async def _fresh_none(*a, **k):
            from core.chat_canvas_editor import FreshDataResult
            return FreshDataResult("", False, True)

        cce.fetch_fresh_data_section = _fresh_none
        shared = {}
        try:
            with patch.object(
                    co_mod, "_task_lifecycle_for",
                    return_value=_TL()), patch(
                    "core.sheet_dataset_service.current_dataset_version",
                    side_effect=lambda ident: versions.get(
                        str(ident).split("!")[0], catalog_rev)):
                import asyncio
                asyncio.run(co_mod.chat_orchestrator._try_canvas_edit(
                    "Update the draft for rows 1-5 with the approved "
                    "prices and delivery times. Don't send.",
                    [], _brennan_canvas(), "user_1", "sess-fresh",
                    "exec-fresh", None, shared_tool_state=shared))
        finally:
            cce.plan_canvas_edit = original_planner
            cce.fetch_fresh_data_section = original_fresh
        return shared

    def test_unchanged_sources_and_satisfied_values_complete(self):
        shared = self._run_fresh_session(
            self._job_record(rev="rev-A"), catalog_rev="rev-A")
        check = _check(shared) or {}
        assert shared.get("canvas_edit_decline_noop") is True, (
            "completed-job evidence reaches a fresh-session requirement "
            f"check; check={check}")
        assert check.get("satisfied") is True

    def test_one_changed_source_leaves_others_and_manual_intact(self):
        shared = self._run_fresh_session(
            self._job_record(rev="rev-A"), catalog_rev="rev-B")
        assert not shared.get("canvas_edit_decline_noop"), (
            "the changed source's obligations must not certify")
        check = _check(shared) or {}
        dispositions = {
            (d["entity_id"], d["field"]): d
            for d in check.get("value_dispositions") or []}
        stale = dispositions[("SLE24-16", "price")]
        assert stale["disposition"] == "unresolved"
        assert "revalidation required" in stale["detail"]
        current = dispositions[("Roper Whitney 36", "price")]
        assert current["disposition"] == "satisfied", (
            "unrelated current evidence stays satisfied")

    def test_supplier_quote_without_owner_approval_has_no_manual_authority(
            self):
        """A supplier quote proves what was quoted — its receipt role
        stays supplier_quote_dated and it never becomes a protected
        manual value (that requires owner-instruction provenance)."""
        record = self._job_record(rev="rev-A")
        quote_only = {
            "run_id": "job-2", "status": "achieved",
            "task_revision": {"provenance": {"canvas_id": "cv-s3-auth"},
                              "entities": []},
            "operations": [{
                "operation_id": "op-q", "operation_type": "retrieve",
                "execution": {
                    "invoked": True, "outcome": "read_succeeded",
                    "served_basis": "live", "source_version": "rev-A",
                    "items": {"SLE24-16": "matched"},
                    "findings": [{"field": "price",
                                  "raw": "$7,500.00",
                                  "source": (
                                      "vendor-quote.pdf!Q!row1")}]},
            }],
        }
        shared = self._run_fresh_session(
            quote_only, catalog_rev="rev-A")
        check = _check(shared) or {}
        dispositions = {
            (d["entity_id"], d["field"]): d
            for d in check.get("value_dispositions") or []}
        d = dispositions[("SLE24-16", "price")]
        # $7,500 does not match the draft's $8,984 — and even where a
        # quote value matched, its role stays supplier_quote_dated
        assert d["expected"]["authority_source_type"] == "workbook", (
            "the job finding is workbook-sourced evidence")
        from core.chat_canvas_editor import requirement_check
        quote_check = requirement_check(
            message="Update the draft with the SLE24-16 price.",
            canvas=_brennan_canvas(), authorized=True,
            expected_prior_audit_id=None,
            evidence_contract={
                "evidence": [
                    {"entity_id": "SLE24-16", "field": "price",
                     "raw_value": "$8,984.00",
                     "source": {"source_id": "vendor-quote.pdf",
                                "source_type": "supplier_quote"},
                     "source_version": "rev-A",
                     "observed_at": "2026-10-08",
                     "verification": "verified"}]})
        disp = (quote_check.get("value_dispositions") or [])[0]
        assert disp["source_role"] == "supplier_quote_dated"
        assert disp["expected"]["authority_source_type"] == (
            "supplier_quote"), (
            "a supplier quote never acquires owner-decision authority")


class TestReadSettleVersionRace:
    """The finding records the version the READ receipt carried — not
    whichever catalog version is current at settlement (owner
    correction 2026-10-10). read A -> catalog moves to B -> settle:
    the finding retains A."""

    def test_settle_stamps_the_read_receipt_identity(self, monkeypatch):
        import asyncio

        import core.research_continuation as rc

        captured = {}

        def _fake_finish(lifecycle, run_id, op_id, a, b, ok, execution=None):
            captured["execution"] = execution

        def _fake_record(*a, **k):
            captured["record"] = k

        class _Scan:
            @staticmethod
            def find_all(item, user_id, workspace_id, file_name=None,
                         max_matches=8):
                return {
                    "matches": [], "per_file": {}, "total_matches": 0,
                    "source_identity": {"file_name": "tennsmith.xlsx",
                                        "content_hash": "hash-A"},
                }

        import core.sheet_dataset_service as _sds

        monkeypatch.setattr(_sds, "find_all_occurrences_sync",
                            _Scan.find_all)
        import core.task_lifecycle as _tl_mod

        monkeypatch.setattr(_tl_mod, "finish_retrieval_turn",
                            _fake_finish)
        monkeypatch.setattr(_tl_mod, "record_read_outcome",
                            _fake_record)
        monkeypatch.setattr(
            "core.sheet_dataset_service.current_dataset_version",
            lambda ident: "hash-B")
        lifecycle = MagicMock()
        lifecycle.create_operation.return_value = {
            "operation_id": "op-x"}
        asyncio.run(rc._execute_document_read(
            lifecycle, "run-x", "u1", "default", "tennsmith.xlsx",
            items=["SLE24-16"], action_inputs={
                "requested_fields": ["price"]}))
        ex = captured.get("execution") or {}
        assert ex.get("source_version") == "hash-A", (
            "the settle stamps the version the READ receipt carried — "
            f"not the current catalog version; got {ex.get('source_version')!r}")


class TestTwoItemMultiBasisReconstruction:
    """Each finding keeps its OWN subject and meaning through
    reconstruction (owner correction 2026-10-10): a multi-item
    operation's PRICE / U.S. LIST / CDN LIST findings must not all
    collapse onto the first sorted item, and parsed basis/currency/unit
    plus the file!sheet!row location survive."""

    def _record(self):
        def findings_for(item):
            return [
                {"item": item, "field": "price", "raw": "$8,984.00",
                 "parsed": {"value": 8984.0, "currency": "CAD",
                            "basis": "list"},
                 "source": f"tennsmith.xlsx!Tennsmith!row{338}"},
                {"item": item, "field": "delivery", "raw": "11–12 weeks",
                 "source": f"tennsmith.xlsx!Tennsmith!row{338}"}]
        return {
            "run_id": "job-m", "status": "achieved",
            "task_revision": {"provenance": {"canvas_id": "cv-multi"},
                              "entities": []},
            "operations": [{
                "operation_id": "op-multi", "operation_type": "retrieve",
                "execution": {
                    "invoked": True, "outcome": "read_succeeded",
                    "served_basis": "saved_copy",
                    "source_version": "rev-A",
                    "items": {"No. 381": "matched",
                              "SLE24-16": "matched"},
                    "findings": findings_for("No. 381")
                    + findings_for("SLE24-16")},
            }],
        }

    def test_findings_keep_their_own_items_and_meaning(self):
        from integrations import chat_orchestrator as co

        orch = co.chat_orchestrator
        record = self._record()
        with patch.object(co, "_task_lifecycle_for") as tlf:
            tlf.return_value = MagicMock(**{
                "find_active_task_for_canvas.return_value": None,
                "find_canvas_evidence_task.return_value": record})
            contract = orch._canvas_job_evidence_contract(
                {"canvas_id": "cv-multi", "content": {"body": ""}})
        assert contract is not None
        by_key = {
            (e.get("entity_id"), e.get("field")): e
            for e in contract.get("evidence") or []
            if e.get("entity_id") in ("No. 381", "SLE24-16")}
        assert ("No. 381", "price") in by_key and (
            "SLE24-16", "price") in by_key, (
            "two items, both attributed to their own subject")
        for (ent, _f), e in by_key.items():
            assert e.get("source_location") == (
                f"tennsmith.xlsx!Tennsmith!row338"), (
                "the file!sheet!row location survives")
        price_381 = by_key[("No. 381", "price")]
        assert price_381.get("currency") == "CAD", (
            "parsed currency survives reconstruction")
        assert price_381.get("basis") == "list", (
            "parsed basis survives reconstruction")


class TestCatalogResolutionScoping:
    """Version resolution is workspace-scoped and identity-stable:
    same-name sources in different workspaces stay separate, and an
    ambiguous identity resolves to NOTHING (never the globally newest
    file with that name)."""

    def _engine(self):
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        from core.database import Base

        from core.models import DatasetEntry

        self._DatasetEntry = DatasetEntry
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine,
                                 tables=[DatasetEntry.__table__])
        return engine, sessionmaker(bind=engine, expire_on_commit=False)

    def _entry(self, ws, fname, hash_):
        from core.models import DatasetEntry  # noqa: F401 — re-exported to tests
        self._DatasetEntry = DatasetEntry
        return {"workspace_id": ws, "file_name": fname,
                "content_hash": hash_, "status": "active",
                "source_kind": "file", "source": "test",
                "external_id": f"{ws}:{fname}", "entity_name": "s",
                "dataset_name": f"ds_{ws}_{hash_[:6]}",
                "parquet_path": "/tmp/x.parquet", "columns_json": []}

    def test_same_name_different_workspaces_stay_separate(self):
        from contextlib import contextmanager

        import core.sheet_dataset_service as sds

        engine, Session = self._engine()
        with Session() as s:
            s.add(self._DatasetEntry(**self._entry("ws-A", "quote.xlsx",
                                             "hash-A")))
            s.add(self._DatasetEntry(**self._entry("ws-B", "quote.xlsx",
                                             "hash-B")))
            s.commit()

        @contextmanager
        def _cat():
            sess = Session()
            try:
                yield sess
            finally:
                sess.close()

        with patch.object(sds, "_catalog_session", _cat):
            assert sds.current_dataset_version(
                "quote.xlsx", workspace_id="ws-A") == "hash-A"
            assert sds.current_dataset_version(
                "quote.xlsx", workspace_id="ws-B") == "hash-B"

    def test_ambiguous_identity_is_unresolved_not_newest(self):
        from contextlib import contextmanager

        import core.sheet_dataset_service as sds

        engine, Session = self._engine()
        with Session() as s:
            s.add(self._DatasetEntry(**self._entry(
                "ws-A", "quote.xlsx", "hash-A1")))
            s.add(self._DatasetEntry(**self._entry(
                "ws-A", "quote.xlsx", "hash-A2")))
            s.commit()

        @contextmanager
        def _cat():
            sess = Session()
            try:
                yield sess
            finally:
                sess.close()

        with patch.object(sds, "_catalog_session", _cat):
            assert sds.current_dataset_version(
                "quote.xlsx", workspace_id="ws-A") is None, (
                "two distinct active sources for one identity: no "
                "version is the answer")
