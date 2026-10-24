#!/usr/bin/env python3
"""L1/S6 evidence driver — the ORIGINAL S6 request through the REAL route,
on the frozen candidate b96dec60a, without editing it.

Reuses tests/test_fallback_honesty.py's production fixture helpers
(imported read-only from the frozen worktree) with a minimal monkeypatch
shim. TESTING=1 + scratch DB only; no live services.

Writes route_s6_original_result.json next to this script.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from pathlib import Path

CANDIDATE = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "reask-current-artifact")
SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "reask-fix/scratch")
HERE = Path(__file__).resolve().parent

sys.path.insert(0, str(CANDIDATE / "backend"))
os.environ["TESTING"] = "1"
# Pin the same flags the pytest suite's autouse fixture pins
# (test_fallback_honesty._m2_outcome_persistence_enabled): outcome
# persistence and the task lifecycle are flag-gated, and without them
# the persisted row/history carry no outcome (first driver attempt).
os.environ.setdefault("CHAT_FINALIZATION_M2", "1")
os.environ.setdefault("ATOM_TASK_LIFECYCLE_ENABLED", "1")
os.environ.setdefault(
    "DATABASE_URL", f"sqlite:///{SCRATCH}/l1-s6-original-evidence.db")

from sqlalchemy import text as _sql_text  # noqa: E402

import core.chat_canvas_editor as cce  # noqa: E402
from core.chat_canvas_editor import FreshDataResult  # noqa: E402
from core.models import Canvas, CanvasAudit  # noqa: E402
from integrations import chat_routes as cr  # noqa: E402
import tests.test_fallback_honesty as T  # noqa: E402

ASK = os.environ.get(
    "L1_ASK",
    "Please also update the payment terms in the draft to Net 45.")
BODY = (
    "# Quotation Q-2026-114 (DRAFT)\n\n"
    "Client: Dunmore Fabrication LLC\n"
    "Item: CNC press brake, 50-ton\n"
    "Unit price: $48,000.00\n"
    "Terms: Net 45\n"
    "Valid until: 2026-12-31\n"
)


class _MP:
    """Minimal pytest monkeypatch shim (setattr/setenv + undo)."""
    _SENTINEL = object()

    def __init__(self):
        self._undo = []

    def setattr(self, obj, name, value, raising=True):
        old = getattr(obj, name, self._SENTINEL)
        setattr(obj, name, value)
        self._undo.append(("attr", obj, name, old))

    def setenv(self, name, value):
        old = os.environ.get(name, self._SENTINEL)
        os.environ[name] = value
        self._undo.append(("env", None, name, old))

    def undo(self):
        for kind, obj, name, old in reversed(self._undo):
            if kind == "attr":
                if old is self._SENTINEL:
                    try:
                        delattr(obj, name)
                    except AttributeError:
                        pass
                else:
                    setattr(obj, name, old)
            else:
                if old is self._SENTINEL:
                    os.environ.pop(name, None)
                else:
                    os.environ[name] = old


def main() -> int:
    mp = _MP()
    result = {"request": ASK, "artifact_body": BODY}
    try:
        _app, factory, _ = T._mk_app_and_db(mp)
        T._seam_failure(mp)
        T._fixed_execution(mp, "exec-reask-route")

        with factory() as sc:
            sc.add(Canvas(id=T.CANVAS_ID, tenant_id="t1",
                          created_by="user_1",
                          name="Quotation Q-2026-114",
                          canvas_type="document",
                          content={"body": BODY}))
            sc.add(CanvasAudit(canvas_id=T.CANVAS_ID, tenant_id="t1",
                               action_type="fork", user_id="user_1",
                               details_json={"content": {"body": BODY}}))
            sc.commit()

        class _Plan:
            wants_edit = False
            reply = "No changes were needed."

        async def _plan_ok(*a, **k):
            return _Plan()

        mp.setattr(cce, "plan_canvas_edit", _plan_ok)

        async def _fresh_ok(*a, **k):
            return FreshDataResult(section="", needed=False, ok=True,
                                   block="", evidence_contract=None)

        mp.setattr(cce, "fetch_fresh_data_section", _fresh_ok)

        with factory() as sc:
            audits_before = sc.query(CanvasAudit).filter(
                CanvasAudit.canvas_id == T.CANVAS_ID).count()

        resp, user = T._route_call(
            factory, ASK, {"canvas_id": T.CANVAS_ID})

        with factory() as sc:
            audits_after = sc.query(CanvasAudit).filter(
                CanvasAudit.canvas_id == T.CANVAS_ID).count()
            canvas_row = sc.query(Canvas).filter(
                Canvas.id == T.CANVAS_ID).first()
        saved_body = str((canvas_row.content or {}).get("body"))

        with factory() as sc2:
            rows = sc2.execute(_sql_text(
                "SELECT role, metadata_json FROM chat_messages WHERE "
                "conversation_id=:s ORDER BY rowid"),
                {"s": resp.session_id}).fetchall()
        metas = [r[1] for r in rows if r[0] == "assistant"]
        meta = json.loads(metas[-1]) if metas else {}

        history = asyncio.run(
            cr.get_chat_history(session_id=resp.session_id,
                                user_id="user_1", current_user=user))
        served = [m for m in history.messages
                  if m["role"] == "assistant"][-1]["response"]

        result.update({
            "captured_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "candidate_commit": os.popen(
                f"git -C {CANDIDATE} rev-parse HEAD").read().strip(),
            "response": {
                "outcome": resp.outcome,
                "success": resp.success,
                "message": resp.message,
                "session_id": resp.session_id,
            },
            "zero_additional_writes": {
                "audits_before": audits_before,
                "audits_after": audits_after,
                "unchanged": audits_after == audits_before,
                "saved_body_carries_value": "Net 45" in saved_body,
            },
            "persisted": {
                "assistant_row_present": bool(rows),
                "metadata_outcome": meta.get("outcome"),
                "metadata_success": meta.get("success"),
                "metadata_keys": sorted(meta.keys()),
                "raw_assistant_metadata": metas,
                "assistant_row_count": len(metas),
            },
            "history_reload": {
                "served_outcome": served.get("outcome"),
                "served_success": served.get("success"),
                "agrees_with_response": (
                    served.get("outcome") == resp.outcome
                    and served.get("success") == resp.success),
            },
            "assertions": {
                "completed": resp.outcome == "completed"
                and resp.success is True,
                "receipt_derived_reply": (
                    "Verified on the current draft" in (resp.message or "")
                    and "nothing was sent" in (resp.message or "")),
                "zero_writes": audits_after == audits_before,
                "history_agrees": (
                    served.get("outcome") == resp.outcome
                    and served.get("success") == resp.success),
            },
        })
        result["pass"] = all(result["assertions"].values())
    finally:
        mp.undo()

    out = HERE / "route_s6_original_result.json"
    out.write_text(json.dumps(result, indent=2, sort_keys=True))
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result.get("pass") else 1


if __name__ == "__main__":
    raise SystemExit(main())
