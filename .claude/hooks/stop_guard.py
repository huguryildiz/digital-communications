#!/usr/bin/env python3
"""Run shared prose and advisory math checks for both clients' Stop hooks.

Not currently wired to a hook in this repository (see .claude/settings.json and
.codex/hooks.json); run by hand. It also depends on tools/content_guard.py and
tools/derivation_advisor.py, which do not exist in this repository yet — only
tools/rule_check.py does. This file is carried over from the sibling course
unchanged so the two repositories stay in step; it will not run correctly here
until those two tools are ported or written.
"""

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
GUARD = ROOT / "tools" / "content_guard.py"
ADVISOR = ROOT / "tools" / "derivation_advisor.py"


def main():
    if not GUARD.is_file():
        print("Content guard is missing: {}".format(GUARD), file=sys.stderr)
        return 2

    result = subprocess.run(
        [sys.executable, str(GUARD), "--source", "--hook"],
        cwd=str(ROOT),
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode:
        print(result.stderr.strip() or "Content guard failed.", file=sys.stderr)
        return 2

    # A candidate reminder is informational. It never changes the Stop exit code.
    message = None
    if ADVISOR.is_file():
        advisory = subprocess.run(
            [sys.executable, str(ADVISOR)],
            cwd=str(ROOT), input=sys.stdin.read(), text=True,
            capture_output=True, check=False,
        )
        if advisory.returncode == 0:
            try:
                message = json.loads(advisory.stdout).get("systemMessage")
            except (ValueError, TypeError, AttributeError):
                pass

    # Both clients accept JSON output; Codex requires it on a successful Stop.
    print(json.dumps({"systemMessage": message} if message else {}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
