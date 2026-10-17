#!/usr/bin/env python3
"""F6 odds probe (Phase D, run-3 era): repeat the grounded acceptance ask on
the live cloud-BiYOK world (backend the browser loop uses) and measure how
often a narration is DELIVERED vs QUARANTINED.

Uses probe user U5 (opencode-go key already stored via the product endpoint).
Reads the backend boot log to count '[narration-reject]' deltas per attempt.
Prints one JSON line per attempt + a summary; no secrets in output.
"""
import json
import sys
import time
import uuid

import httpx

BASE = "http://127.0.0.1:18100"
EMAIL = "jprobe_ocgo_1792249973@example.com"
PASSWORD = "<scratch-user-password>"
LOG = ("/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/"
       "opencode/phase-d-pristine/logs_phase_d/backend_boot_run3.log")
CHAT_PROMPT = ("Search my uploaded documents for the launch code for project "
               "Zephyr-9 and tell me the code.")
SHORT_ASK = "What is the launch code for project Zephyr-9?"
REPEAT = ("Please search my uploaded documents again for the launch code for "
          "project Zephyr-9 and tell me the code.")


def reject_count() -> int:
    try:
        with open(LOG, errors="replace") as fh:
            return sum(1 for line in fh if "narration-reject" in line)
    except Exception:  # noqa: BLE001
        return -1


def main() -> int:
    client = httpx.Client(timeout=300, trust_env=False)
    lg = client.post(f"{BASE}/api/auth/login", json={
        "email": EMAIL, "username": EMAIL, "password": PASSWORD})
    tok = lg.json().get("access_token")
    me = client.get(f"{BASE}/api/auth/me",
                    headers={"Authorization": f"Bearer {tok}"}).json()
    user_id = me.get("id")
    h = {"Authorization": f"Bearer {tok}"}
    out = {"probe": "narration_odds", "started": time.strftime("%H:%M:%S"),
           "login": lg.status_code, "user_id": user_id, "attempts": []}
    sid = f"session_odds_{uuid.uuid4().hex[:8]}"
    prompts = [CHAT_PROMPT, SHORT_ASK, REPEAT]
    for i, msg in enumerate(prompts, 1):
        before = reject_count()
        t0 = time.monotonic()
        r = client.post(f"{BASE}/api/chat/message", headers=h,
                        json={"message": msg, "session_id": sid,
                              "user_id": user_id})
        dt = round(time.monotonic() - t0, 1)
        try:
            doc = r.json()
        except Exception:  # noqa: BLE001
            doc = {"_raw": r.text[:300]}
        time.sleep(6)
        hist = client.get(f"{BASE}/api/chat/history/{sid}?user_id={user_id}",
                          headers=h)
        delivered, delivered_model = "", None
        try:
            msgs = (hist.json().get("messages") or [])
            assistants = [m for m in msgs
                          if str(m.get("role")) == "assistant"]
            if assistants:
                last = assistants[-1]
                delivered = str(((last.get("response") or {}).get("message"))
                                or last.get("content") or "")
                delivered_model = ((last.get("response") or {}).get("model")
                                   or last.get("model"))
        except Exception as exc:  # noqa: BLE001
            delivered = f"<history parse error: {exc}>"
        meta = doc.get("metadata") or {}
        rec = {"i": i, "at": time.strftime("%H:%M:%S"), "latency_s": dt,
               "http": r.status_code, "success": doc.get("success"),
               "error_code": doc.get("error_code"),
               "provider": doc.get("provider") or meta.get("provider"),
               "model": doc.get("model") or meta.get("model"),
               "response_head": str(doc.get("message"))[:200],
               "delivered_head": delivered[:220],
               "delivered_model": delivered_model,
               "delivered_has_quartz": "quartz-77" in delivered.lower(),
               "narration_rejects_during": reject_count() - before}
        out["attempts"].append(rec)
        print(json.dumps(rec), flush=True)
        if i < len(prompts):
            time.sleep(45)
    out["finished"] = time.strftime("%H:%M:%S")
    print(json.dumps({"summary": [
        {"i": a["i"], "model": a["model"] or a["delivered_model"],
         "quartz": a["delivered_has_quartz"],
         "rejects": a["narration_rejects_during"]}
        for a in out["attempts"]]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
