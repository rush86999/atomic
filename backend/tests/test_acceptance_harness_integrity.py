# -*- coding: utf-8 -*-
"""Acceptance-harness integrity guards (round-10 review, 2026-10-12).

The round-9 J2 evidence produced a vacuous top-level PASS (when a world
raised, its assertion block was absent and the aggregate saw only the
surviving world's booleans) and a tool-evidence check that matched
substrings over the prompt's own echo. These tests pin the replacements:

* aggregate PASS only on an explicit True for every mandatory assertion;
* tool evidence comes from attributable execution records
  (agent_executions.task_outcome.tool_outcomes) — never substrings;
* a failed client window and a later server delivery are separate
  records (the late delivery never repairs the failed user request);
* source identity (commit/tree), config digest and scratch-storage paths
  are embeddable in every evidence file, export or checkout.

No test launches a world, opens a port, or touches backend/data.
"""
import json
import sqlite3
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from scripts.orchestration_acceptance import journey_runtime as JR  # noqa: E402

MANDATORY = ("J2.a", "J2.b", "J2.c")


def _mk_db(tmp_path: Path) -> Path:
    db = tmp_path / "scratch.db"
    con = sqlite3.connect(db)
    con.executescript(
        """
        CREATE TABLE chat_messages (
            id TEXT PRIMARY KEY, conversation_id TEXT, tenant_id TEXT,
            role TEXT, content TEXT, created_at DATETIME, agent_id TEXT,
            metadata_json TEXT);
        CREATE TABLE agent_executions (
            id TEXT PRIMARY KEY, status TEXT, metadata_json JSON);
        CREATE TABLE chat_request_records (
            id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME,
            tenant_id TEXT, user_id TEXT, session_id TEXT, request_id TEXT,
            payload_sha256 TEXT, request_payload TEXT, state TEXT,
            execution_id TEXT, assistant_message_id TEXT,
            finalized_response TEXT, error TEXT);
        """)
    con.commit()
    con.close()
    return db


def _insert_turn(db: Path, sid: str, eid: str, tool_outcomes: list) -> None:
    msg_meta = {"execution_id": eid}
    outcome = {"tool_outcomes": tool_outcomes, "evidence_refs": [],
               "delivery": {"delivered": True}, "objective_met": None,
               "latency_s": 310.93}
    con = sqlite3.connect(db)
    con.execute(
        "INSERT INTO chat_messages VALUES (?,?,?,?,?,?,?,?)",
        (eid, sid, "t", "assistant", "hi", "2026-10-12 18:56:27", None,
         json.dumps(msg_meta)))
    con.execute(
        "INSERT INTO agent_executions VALUES (?,?,?)",
        (eid, "success", json.dumps({"task_outcome": outcome})))
    con.commit()
    con.close()


# ----------------------------------------------------------------------
# Strict aggregation: no vacuous pass
# ----------------------------------------------------------------------
def test_aggregate_all_true_passes():
    verdict = JR.aggregate_verdict(
        MANDATORY, {"J2.a": True, "J2.b": True, "J2.c": True})
    assert verdict["pass"] is True
    assert verdict["unmet"] == []


def test_aggregate_missing_assertions_never_pass():
    # Round-9 defect shape: one world raised, its block vanished, the
    # surviving world was all-True and the aggregate passed.
    verdict = JR.aggregate_verdict(MANDATORY, {"J2.a": True, "J2.b": True})
    assert verdict["pass"] is False
    assert verdict["unmet"] == ["J2.c"]
    assert verdict["untested"] == ["J2.c"]
    assert verdict["states"]["J2.c"] == "untested"


def test_aggregate_timeout_fails_not_untested():
    verdict = JR.aggregate_verdict(
        MANDATORY, {"J2.a": True, "J2.b": False, "J2.c": None})
    assert verdict["pass"] is False
    assert verdict["failed"] == ["J2.b"]
    assert verdict["untested"] == ["J2.c"]


def test_aggregate_empty_world_is_not_a_pass():
    verdict = JR.aggregate_verdict(MANDATORY, {})
    assert verdict["pass"] is False
    assert verdict["unmet"] == list(MANDATORY)


# ----------------------------------------------------------------------
# Identity: commit, config digest, storage — export or checkout
# ----------------------------------------------------------------------
def test_source_identity_captures_commit_and_tree():
    ident = JR.source_identity("HEAD")
    if ident["commit"] == "unknown":
        pytest.skip("not a git checkout")
    assert len(ident["commit"]) >= 7
    assert ident["tree"] != "unknown"
    assert ident["dirty_tracked"] is not None


def test_export_identity_manifest_roundtrip(tmp_path):
    export = tmp_path / "export" / "backend"
    export.mkdir(parents=True)
    (tmp_path / "export" / "EXPORT_IDENTITY.json").write_text(
        json.dumps({"commit": "abc1234", "tree": "def5678"}))
    ident = JR.load_export_identity(export)
    assert ident["commit"] == "abc1234"


def test_missing_identity_manifest_is_explicit(tmp_path):
    ident = JR.load_export_identity(tmp_path / "nope")
    assert ident.get("error") == "missing"


def test_config_digest_stable_and_gate_sensitive():
    env = {"ATOM_TASK_LIFECYCLE_ENABLED": "1",
           "CHAT_FINALIZATION_M1": "1",
           "BYOK_ENCRYPTION_KEY": "generated-secret-not-hashed"}
    d1 = JR.config_digest(True, env, {"ATOM_LOCAL_ONLY": "true"})
    d2 = JR.config_digest(True, dict(env), {"ATOM_LOCAL_ONLY": "true"})
    d3 = JR.config_digest(True, {**env, "CHAT_FINALIZATION_M1": "0"},
                          {"ATOM_LOCAL_ONLY": "true"})
    assert d1 == d2
    assert d1 != d3


# ----------------------------------------------------------------------
# Client window vs later server delivery
# ----------------------------------------------------------------------
def test_server_delivery_preserves_late_completion(tmp_path):
    db = _mk_db(tmp_path)
    con = sqlite3.connect(db)
    con.execute(
        "INSERT INTO chat_request_records VALUES "
        "(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ("r1", "2026-10-12 18:51:16", "2026-10-12 18:56:27", "t", "u",
         "s", "req-1", "sha", "{}", "completed", "exec-1", "msg-1",
         json.dumps({"message": "late reply"}), None))
    con.commit()
    con.close()
    got = JR.server_delivery(db, "req-1")
    assert got["found"] is True
    assert got["state"] == "completed"
    assert got["delivered_after_client_window"] is True
    assert got["response_head"].startswith("late reply")


def test_server_delivery_absent_request_is_honest(tmp_path):
    db = _mk_db(tmp_path)
    assert JR.server_delivery(db, "req-missing") == {
        "found": False, "state": None}


# ----------------------------------------------------------------------
# Attributable tool receipts (no substrings)
# ----------------------------------------------------------------------
def test_empty_tool_outcomes_fail():
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        db = _mk_db(Path(td))
        _insert_turn(db, "s1", "e1", [])
        got = JR.turn_tool_receipts(db, "s1")
        assert got["attributable"] is True
        assert got["receipt_count"] == 0
        assert got["tool_success"] is False


def test_verified_receipt_passes():
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        db = _mk_db(Path(td))
        _insert_turn(db, "s1", "e1", [{
            "tool": "documents.search", "verified": True,
            "evidence_refs": [{"kind": "document"}]}])
        got = JR.turn_tool_receipts(db, "s1")
        assert got["tool_success"] is True
        assert got["receipts"][0]["tool"] == "documents.search"
        assert got["receipts"][0]["evidence_refs"] == 1


def test_unverified_receipt_is_not_success():
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        db = _mk_db(Path(td))
        _insert_turn(db, "s1", "e1", [{
            "tool": "documents.search", "verified": None}])
        got = JR.turn_tool_receipts(db, "s1")
        assert got["tool_success"] is None
        verdict = JR.aggregate_verdict(
            ("J2.tool-planning",),
            {"J2.tool-planning": got["tool_success"] is True})
        assert verdict["pass"] is False


def test_receipts_attribute_through_execution_id():
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        db = _mk_db(Path(td))
        _insert_turn(db, "s1", "e1", [{
            "tool": "documents.search", "verified": True}])
        got = JR.execution_tool_receipts(db, "e1")
        assert got["execution_ids"] == ["e1"]
        assert got["tool_success"] is True


# ----------------------------------------------------------------------
# The J2 script itself declares the full mandatory set
# ----------------------------------------------------------------------
def test_j2_mandatory_assertions_match_the_contract():
    from scripts.orchestration_acceptance import j2_model_setup as J2
    assert set(J2.EXPECTED_A) | set(J2.EXPECTED_B) == {
        "J2.local-provider-product-path", "J2.real-reply",
        "J2.tool-planning", "J2.survive-restart",
        "J2.byok-add-product-path", "J2.byok-survive-restart"}


def test_j2_timeout_verdict_is_not_a_real_reply():
    from scripts.orchestration_acceptance import j2_model_setup as J2
    timed_out = {"http": None, "success": None, "provider": None,
                 "model": None, "content_len": 0, "error_code": None,
                 "outcome": None, "looks_mock": False, "content_head": ""}
    assert J2._real(timed_out) is False
