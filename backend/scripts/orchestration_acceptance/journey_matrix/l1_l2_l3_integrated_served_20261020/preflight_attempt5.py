#!/usr/bin/env python3
"""Offline preflight for the composed served attempt 5 (unlaunched).

This script never starts the candidate server and never makes a chat
request. It proves the launch guard accepts the repaired runtime, rejects
the obsolete attempt-4/attempt-3 product hashes, the cross-run gates and
captured L3/S3 replays pass, the new artifact/scratch paths cannot
overwrite attempts 3/4, the scratch stores are explicit, the pilot is
untouched, and the S3 gates remain mandatory.

Run from the worktree with the main venv interpreter:
    /Users/rushiparikh/projects/atom/backend/venv314/bin/python \
        backend/scripts/orchestration_acceptance/journey_matrix/\
l1_l2_l3_integrated_served_20261020/preflight_attempt5.py
"""
from __future__ import annotations

import hashlib
import importlib.util
import inspect
import json
import os
import socket
from fnmatch import fnmatch
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
import successor_gates as gates  # noqa: E402
BACKEND = ROOT / "backend"
MAIN = Path("/Users/rushiparikh/projects/atom")
PY = MAIN / "backend/venv314/bin/python"
PREFLIGHT = HERE / "attempt5_preflight.json"

PRODUCT_SHA = "22af424a07d84a21c62eb7bb97046d98a01d3d14"
OBSOLETE_SHA = "b0bee5dbfd608103bd8875bbc35066c28959ae1e"
OBSOLETE_CHAT_HASH = (
    "59f1c550cf51a434631d6202b61b5aa8eefc2de0735edacbdee184cc53e152ed")
GATE_COMMIT = "f2f8329971129bc14e9f107aa234b98db7f18379"

S3_CHECK_KEYS = (
    "comparison_http_ok",
    "comparison_truthful_date",
    "comparison_no_false_date",
    "comparison_no_global_claim",
    "comparison_broader_obligation_open",
    "comparison_zero_writes",
    "comparison_draft_unchanged",
    "comparison_settlement_basis",
    "comparison_requirement_captured",
    "comparison_interpretation_deepseek",
    "comparison_history_agreement",
)


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True, text=True, check=False)


def port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1.0)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def json_get(url: str, timeout: float = 5.0):
    import httpx

    try:
        response = httpx.get(url, timeout=timeout, trust_env=False)
        return response.status_code, response.json()
    except Exception as exc:  # noqa: BLE001 — preflight records the failure
        return None, {"_error": repr(exc)}


def check(report: dict, name: str, ok: bool, detail=None) -> bool:
    report["checks"][name] = {"ok": bool(ok), "detail": detail}
    if not ok:
        report["failures"].append(name)
    return bool(ok)


def gate_replay(runner, report: dict) -> None:
    captured = json.loads(
        (HERE / "attempt3_result.json").read_text())
    task_record = json.loads(
        (BACKEND / "tests/fixtures/s7_attempt3_task_record.json").read_text())
    s7 = captured["steps"]["s7"]
    cf = s7["fallback_state"]["context_fulfillment"]
    requirement = s7["requirement_summary"]
    fallback = s7["fallback_state"]
    obligations = task_record["task_revision"]["unresolved"]
    task = {"delivery": {"delivered": True}, "objective_met": None}
    partial = {"final_success": True, "final_outcome": "partial"}

    expected_prior = gates.capture_prior_obligation(obligations)
    check(report, "gate_honest_partial",
          runner.s7_settlement_ok(
              partial, cf, task, fallback, requirement, obligations,
              expected_prior=expected_prior),
          "captured S7 shape + structured prior obligation")
    check(report, "gate_pre_fix_failed_rejected",
          runner.s7_settlement_ok(
              s7["settlement"], cf, task, fallback, requirement,
              obligations, expected_prior=expected_prior) is False,
          "captured attempt-3 failed settlement")
    check(report, "gate_unrelated_date_rejected",
          runner.cf_completed_scope(
              dict(cf, supplied_fields=["unrelated_date"]),
              requirement) is False,
          "supplied_fields=[unrelated_date]")
    check(report, "gate_unknown_text_gap_rejected",
          runner.s7_settlement_ok(
              partial, cf, task,
              dict(fallback, open_work=[
                  gates.S7_PRIOR_OBLIGATION,
                  "current requested field could not be checked"]),
              requirement, obligations,
              expected_prior=expected_prior) is False,
          "prior obligation plus current-field gap")

    refs = s7["observation"]["apply"]["decision_refs_after"][
        "continuation_evidence"]
    observed = s7["observation"]["apply"]["observed"]
    conversation = s7["execution"]["row"]["session_id"]
    workspace = captured["steps"]["user"]["workspace_id"]
    antecedent_id = refs["antecedents"][0]["execution_id"]
    record = {
        "row_id": antecedent_id,
        "session_id": conversation,
        "workspace_id": workspace,
        "task_outcome": {
            "tool_outcomes": [{
                "tool": "context_assembly",
                "verified": True,
                "outcome": "retrieved 2 source(s) into context",
                "evidence_refs": [{
                    "kind": "context_source",
                    "file_name": gates.FIXTURE_NAME,
                    "source": "ingested",
                }],
            }],
            "evidence_refs": [],
        },
    }
    kwargs = dict(
        refs=refs, observed=observed,
        origin=s7["requirement_event"]["accepted_request"]["origin"],
        scope_change=s7["requirement_event"]["accepted_request"][
            "scope_change"],
        expected_conversation_id=conversation,
        expected_workspace_id=workspace,
    )
    check(report, "gate_antecedent_scope",
          runner.continuation_source_ok(
              antecedent_records={antecedent_id: record}, **kwargs),
          "same conversation/workspace + verified fixture")
    check(report, "gate_antecedent_ids_alone_rejected",
          runner.continuation_source_ok(
              antecedent_records={}, **kwargs) is False,
          "carried ids agree but no durable record")
    wrong_conv = dict(record, session_id="other-conversation")
    check(report, "gate_wrong_conversation_rejected",
          runner.continuation_source_ok(
              antecedent_records={antecedent_id: wrong_conv},
              **kwargs) is False,
          "wrong conversation")
    wrong_ws = dict(record, workspace_id="other-workspace")
    check(report, "gate_wrong_workspace_rejected",
          runner.continuation_source_ok(
              antecedent_records={antecedent_id: wrong_ws},
              **kwargs) is False,
          "wrong workspace")


def main() -> int:
    report = {
        "attempt": 5,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "cwd": str(ROOT),
        "checks": {},
        "failures": [],
        "identity": {},
    }
    runner = load_module(
        HERE / "run_composed_served_attempt5.py", "attempt5_preflight_runner")
    attempt4 = load_module(
        HERE / "run_composed_served_attempt4.py", "attempt4_preflight_runner")

    # ---- constants and artifact isolation --------------------------------
    check(report, "constant_product_pin",
          runner.PRODUCT_SHA == PRODUCT_SHA,
          {"product": runner.PRODUCT_SHA})
    check(report, "constant_gate_commit",
          runner.HARNESS_GATE_COMMIT == GATE_COMMIT,
          {"gate_commit": runner.HARNESS_GATE_COMMIT})
    check(report, "constant_chat_hash",
          runner.EXPECTED_SOURCE_SHA256.get("chat_orchestrator")
          != OBSOLETE_CHAT_HASH,
          {"new_hash": runner.EXPECTED_SOURCE_SHA256.get(
              "chat_orchestrator")})
    check(report, "constant_port", runner.PORT == 8115, runner.PORT)
    check(report, "constant_scratch",
          str(runner.SCRATCH).endswith(
              "l2-fix/scratch/l1-l2-l3-composed-attempt5"),
          str(runner.SCRATCH))
    check(report, "constant_predecl",
          runner.PRE_DECL.name == "PREDECLARED_CONFIG_ATTEMPT5.md"
          and runner.PRE_DECL.exists(),
          str(runner.PRE_DECL))
    check(report, "predecl_sha",
          runner.PRE_DECL.exists()
          and sha256_file(runner.PRE_DECL) == sha256_file(
              HERE / "PREDECLARED_CONFIG_ATTEMPT5.md"),
          sha256_file(runner.PRE_DECL) if runner.PRE_DECL.exists() else None)

    artifact_names = [
        "attempt5_config.json", "attempt5_result.json",
        "attempt5_summary.json", "attempt5_run.log",
        "attempt5_server_pre.log", "attempt5_server_restart.log",
        "attempt5_observation_pre.jsonl",
        "attempt5_observation_restart.jsonl",
        "attempt5_interpreter_freeze.txt", "attempt5_preflight.json",
    ]
    existing = [n for n in artifact_names if (HERE / n).exists()]
    # attempt5_preflight.json is this script's own output and is expected
    # to appear once the report is written; every other path must be new.
    existing_other = [n for n in existing if n != "attempt5_preflight.json"]
    check(report, "artifact_paths_fresh", not existing_other,
          {"unexpected_existing": existing_other})
    attempt3_names = [
        "attempt3_config.json", "attempt3_result.json",
        "attempt3_summary.json", "attempt3_run.log",
        "attempt3_server_pre.log", "attempt3_server_restart.log",
        "attempt3_observation_pre.jsonl",
        "attempt3_observation_restart.jsonl",
        "attempt3_interpreter_freeze.txt",
    ]
    missing_attempt3 = [
        n for n in attempt3_names if not (HERE / n).exists()]
    check(report, "attempt3_artifacts_preserved", not missing_attempt3,
          {"missing": missing_attempt3})
    manifest = {}
    try:
        for line in (HERE / "CHECKSUMS_ATTEMPT3.sha256").read_text(
        ).splitlines():
            digest, _, name = line.partition("  ")
            if digest and name:
                manifest[name.strip()] = digest.strip()
    except Exception:  # noqa: BLE001 — report the failure, not a crash
        manifest = {}
    preserved_checks = {}
    for name in ("attempt3_result.json", "attempt3_run.log"):
        expected = manifest.get(name)
        actual = sha256_file(HERE / name) if (HERE / name).exists() else None
        preserved_checks[name] = bool(expected and actual == expected)
    check(report, "attempt3_result_checksums", all(
        preserved_checks.values()), preserved_checks)
    manifest4 = {}
    try:
        for line in (HERE / "CHECKSUMS_ATTEMPT4.sha256").read_text(
        ).splitlines():
            digest, _, name = line.partition("  ")
            if digest and name:
                manifest4[name.strip()] = digest.strip()
    except Exception:  # noqa: BLE001 — report the failure, not a crash
        manifest4 = {}
    preserved4 = {}
    for name in ("attempt4_result.json", "attempt4_run.log",
                 "ATTEMPT4_RESULT.md"):
        expected = manifest4.get(name)
        actual = sha256_file(HERE / name) if (HERE / name).exists() else None
        preserved4[name] = bool(expected and actual == expected)
    check(report, "attempt4_result_checksums", all(
        preserved4.values()), preserved4)
    gitignore = (HERE / ".gitignore").read_text()
    ignore_patterns = [
        line.strip() for line in gitignore.splitlines()
        if line.strip() and not line.strip().startswith("#")]
    missing_ignore = [
        n for n in artifact_names
        if not any(fnmatch(n, pattern) for pattern in ignore_patterns)]
    check(report, "gitignore_attempt5_artifacts", not missing_ignore,
          {"missing": missing_ignore})
    check(report, "scratch_world_fresh", not runner.SCRATCH.exists(),
          str(runner.SCRATCH))

    # ---- git guards ------------------------------------------------------
    head = git("rev-parse", "HEAD").stdout.strip()
    report["identity"].update({
        "head": head,
        "product": PRODUCT_SHA,
        "gate_commit": GATE_COMMIT,
    })
    product = git("rev-parse", PRODUCT_SHA)
    check(report, "product_commit_present",
          product.returncode == 0 and product.stdout.strip() == PRODUCT_SHA,
          product.stdout.strip())
    ancestor = git("merge-base", "--is-ancestor", PRODUCT_SHA, "HEAD")
    check(report, "product_commit_is_ancestor", ancestor.returncode == 0)
    gate_ancestor = git(
        "merge-base", "--is-ancestor", GATE_COMMIT, "HEAD")
    check(report, "gate_commit_is_ancestor", gate_ancestor.returncode == 0)
    tree_diff = git(
        "diff", "--name-only", PRODUCT_SHA, "HEAD", "--",
        "backend/core", "backend/integrations")
    tree_names = [
        line.strip() for line in tree_diff.stdout.splitlines()
        if line.strip()]
    check(report, "product_tree_equals_pin", not tree_names,
          {"diff": tree_names})
    obsolete_diff = git(
        "diff", "--name-only", OBSOLETE_SHA, "HEAD", "--",
        "backend/core", "backend/integrations")
    obsolete_names = [
        line.strip() for line in obsolete_diff.stdout.splitlines()
        if line.strip()]
    check(report, "obsolete_pin_rejected",
          bool(obsolete_names)
          and "backend/integrations/chat_orchestrator.py" in obsolete_names,
          {"obsolete_diff": obsolete_names})
    old_hash = sha256_file(
        BACKEND / "integrations" / "chat_orchestrator.py")
    check(report, "obsolete_hash_rejected",
          old_hash != OBSOLETE_CHAT_HASH,
          {"actual": old_hash, "obsolete": OBSOLETE_CHAT_HASH})
    status = git("status", "--porcelain").stdout.strip()
    check(report, "worktree_clean", status == "", status or "clean")
    gate_hash = sha256_file(HERE / "successor_gates.py")
    check(report, "gate_module_frozen",
          gate_hash == runner.EXPECTED_GATES_SHA256,
          {"actual": gate_hash,
           "expected": runner.EXPECTED_GATES_SHA256})
    source_hashes = {
        "chat_tool_planner": sha256_file(
            BACKEND / "core" / "chat_tool_planner.py"),
        "chat_orchestrator": old_hash,
        "answer_boundary": sha256_file(
            BACKEND / "core" / "answer_boundary.py"),
        "chat_canvas_editor": sha256_file(
            BACKEND / "core" / "chat_canvas_editor.py"),
        "workbook_read_artifact": sha256_file(
            BACKEND / "core" / "workbook_read_artifact.py"),
        "turn_decision": sha256_file(
            BACKEND / "core" / "turn_decision.py"),
    }
    hash_mismatch = {
        k: {"expected": runner.EXPECTED_SOURCE_SHA256.get(k),
            "actual": v}
        for k, v in source_hashes.items()
        if v != runner.EXPECTED_SOURCE_SHA256.get(k)}
    check(report, "source_hashes_match", not hash_mismatch, hash_mismatch)

    # ---- environment -----------------------------------------------------
    check(report, "port_free", not port_open(runner.PORT), runner.PORT)
    pilot_status, pilot = json_get("http://127.0.0.1:8001/api/health")
    pilot_identity = (pilot or {}).get("identity") or {}
    check(report, "pilot_healthy", pilot_status == 200,
          {"http": pilot_status, "identity": pilot_identity})
    report["identity"]["pilot_before"] = pilot_identity
    ollama_status, ollama = json_get("http://127.0.0.1:11434/api/tags")
    ollama_models = [
        m.get("name") for m in (ollama or {}).get("models") or []
        if isinstance(m, dict)]
    check(report, "ollama_reply_model",
          ollama_status == 200 and "llama3.1:8b" in ollama_models,
          {"http": ollama_status, "models": ollama_models})

    vault_path = MAIN / "backend/data/byok_keys.json"
    enc_path = MAIN / "backend/data/byok_encryption_key"
    try:
        vault = json.loads(vault_path.read_text())
        row = (vault.get("keys") or {}).get(
            runner.CREDENTIAL_VAULT_KEY) or {}
        from cryptography.fernet import Fernet

        key = Fernet(enc_path.read_bytes().strip()).decrypt(
            row["encrypted_key"].encode()).decode()
        vault_ok = bool(
            row.get("provider_id") == runner.CREDENTIAL_PROVIDER
            and row.get("key_name") == runner.CREDENTIAL_KEY_NAME
            and row.get("environment") == runner.CREDENTIAL_ENVIRONMENT
            and row.get("is_active", True) is True
            and key)
        report["identity"]["credential"] = {
            "provider": row.get("provider_id"),
            "key_name": row.get("key_name"),
            "environment": row.get("environment"),
            "active": row.get("is_active", True),
            "value_recorded": False,
        }
        del key
    except Exception as exc:  # noqa: BLE001 — report without the value
        vault_ok = False
        report["identity"]["credential"] = {"error": repr(exc)}
    check(report, "authorized_credential_available", vault_ok,
          {"value_recorded": False})
    check(report, "venv_python", PY.exists() and os.access(str(PY), os.X_OK),
          str(PY))
    check(report, "live_db_present", runner.LIVE_DB.exists(),
          str(runner.LIVE_DB))

    env = runner.declared_env()
    values = [str(v) for v in env.values()]
    live = str(runner.LIVE_DB)
    scratch = str(runner.SCRATCH)
    isolated = bool(
        scratch in env.get("DATABASE_URL", "")
        and scratch in env.get("ATOM_DATA_DIR", "")
        and scratch in env.get("LANCEDB_URI", "")
        and live not in " ".join(values))
    check(report, "scratch_stores_explicit", isolated,
          {"scratch": scratch, "live_db_in_env": live in " ".join(values)})
    # declared_env() creates the scratch data dir; remove it when empty so
    # the launch really starts from a fresh scratch world.
    data_dir = runner.SCRATCH / "data"
    if data_dir.exists() and not any(data_dir.iterdir()):
        data_dir.rmdir()
    if runner.SCRATCH.exists() and not any(runner.SCRATCH.iterdir()):
        runner.SCRATCH.rmdir()
    check(report, "scratch_world_still_fresh", not runner.SCRATCH.exists(),
          str(runner.SCRATCH))

    # ---- reviewed gates and S3 invariants --------------------------------
    gate_replay(runner, report)
    runner_source = (HERE / "run_composed_served_attempt5.py").read_text()
    missing_s3 = [k for k in S3_CHECK_KEYS if f'"{k}"' not in runner_source]
    check(report, "s3_gates_present", not missing_s3,
          {"missing": missing_s3})
    s3_helpers = {}
    for name in ("settlement_ok", "cf_completed", "cf_partial"):
        left = inspect.getsource(getattr(runner, name))
        right = inspect.getsource(getattr(attempt4, name))
        s3_helpers[name] = left == right
    check(report, "s3_helpers_unchanged",
          all(s3_helpers.values()), s3_helpers)

    test_proc = subprocess.run(
        [sys.executable, "-m", "pytest",
         "backend/tests/test_successor_s7_gates.py",
         "backend/tests/test_attempt4_repairs.py",
         "backend/tests/test_s3_s7_captured_replay.py", "-q"],
        cwd=ROOT, capture_output=True, text=True, timeout=180,
        env={**os.environ, "PYTHONPATH": "backend"})
    summary_line = next(
        (line for line in reversed(test_proc.stdout.splitlines())
         if "passed" in line or "failed" in line), "")
    check(report, "frozen_gate_tests",
          test_proc.returncode == 0, summary_line)
    report["identity"]["source_sha256"] = source_hashes
    report["identity"]["predecl_sha256"] = (
        sha256_file(runner.PRE_DECL) if runner.PRE_DECL.exists() else None)
    report["identity"]["gate_module_sha256"] = gate_hash
    report["identity"]["runner_sha256"] = sha256_file(
        HERE / "run_composed_served_attempt5.py")
    report["identity"]["server_observe_sha256"] = sha256_file(
        HERE / "server_observe.py")
    report["pass"] = not report["failures"]
    PREFLIGHT.write_text(json.dumps(report, indent=2, sort_keys=True))
    print(json.dumps({
        "pass": report["pass"],
        "failures": report["failures"],
        "checks": len(report["checks"]),
        "head": head,
        "product": PRODUCT_SHA,
        "gate_commit": GATE_COMMIT,
        "preflight": str(PREFLIGHT),
    }, indent=2))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
