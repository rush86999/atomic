#!/usr/bin/env python3
"""L2 served acceptance ATTEMPT 2 — the producer-corrected candidate
`51628b925deb64c4e8226be8546ef475b74b8e87`.

Same S3→S7 job, same declared configuration as attempt 1; only the
candidate, the scratch world, the port and the deliverable names change.
The attempt-1 runner (`run_l2_served.py`) is reused UNCHANGED by
overriding its module constants; attempt 1's files stay byte-identical.
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import run_l2_served as base  # noqa: E402

base.ATTEMPT = "2"
base.CANDIDATE_SHA = "51628b925deb64c4e8226be8546ef475b74b8e87"
base.SCRATCH = Path(
    "/private/var/folders/sq/kf_272b520nc5wnsp27hq1h00000gn/T/opencode/"
    "l2-fix/scratch/l2-continuation-served-attempt2")
base.PORT = 8096
base.BASE = f"http://127.0.0.1:{base.PORT}"
base.PRE_DECL = HERE / "PREDECLARED_CONFIG_ATTEMPT2.md"
base.HERE = HERE


if __name__ == "__main__":
    sys.exit(base.main())
