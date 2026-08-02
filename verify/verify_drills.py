"""Re-derives every number in the `Check` step of a worked solution.

A worked solution ends with a step that checks its own answer. That step is
where a wrong answer is most likely to survive, because a solution that
miscalculates in the middle usually miscalculates in the check as well and
agrees with itself. Each entry below reaches the same number by a route the
solution does not take.

The structure is deliberately the same as verify_scenes.py: one dict per claim,
a `derive` callable that computes it independently, and a relative tolerance.
The two files are separate because they answer to different sources -- one to
the teaching scenes, one to the worked solutions -- and a run should say which
of the two is red.

An error probability stated in a solution does not belong here. It goes into
ber_claims.py with a trial count sized so that a factor-of-two slip falls
outside the interval.

Adding a check is adding a dict to CHECKS. The runner does not change.
"""

import sys

# Each entry:
#   name    -- the question and the part, as the reader sees them numbered
#   stated  -- the number the worked solution prints
#   derive  -- a callable of no arguments returning the same quantity,
#              computed independently of how the solution computes it
#   tol     -- relative tolerance
CHECKS: list[dict] = [
]

DEFAULT_TOL = 5e-3


def main() -> int:
    passed = failed = 0
    for c in CHECKS:
        stated = c["stated"]
        tol = c.get("tol", DEFAULT_TOL)
        try:
            got = float(c["derive"]())
        except Exception as exc:                      # a check that cannot run has failed
            print(f"FAIL  {c['name']}: re-derivation raised {type(exc).__name__}: {exc}")
            failed += 1
            continue
        scale = max(abs(stated), 1e-300)
        rel = abs(got - stated) / scale
        ok = rel <= tol
        status = "PASS" if ok else "FAIL"
        print(f"{status}  {c['name']}: solution states {stated:.6g}, "
              f"re-derived {got:.6g}, relative difference {rel:.2e}")
        if ok:
            passed += 1
        else:
            failed += 1
    print(f"{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
