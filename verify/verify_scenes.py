"""Re-derives every number a teaching scene states.

A scene that says "the signal-to-quantization-noise ratio is 49.8 dB" is making
a claim, and a claim nobody re-derives is a claim nobody has checked. Each entry
below names the scene, records the number as the scene prints it, and computes
the same quantity independently -- symbolically with SymPy where the result has
a closed form, numerically where it does not.

The one thing a check may not do is restate the scene's own arithmetic. Copying
the expression out of the scene and evaluating it verifies that Python and
JavaScript agree about multiplication, which was never in doubt. A check earns
its place by reaching the number by a different route: from the definition, from
a different identity, or by simulation.

A closed-form error probability is not checked here. Re-deriving one is how the
original error would be reproduced, so those live in verify_ber.py and are
checked against a simulation of the system instead.

Adding a check is adding a dict to CHECKS. The runner does not change.
"""

import sys

# Each entry:
#   name    -- the scene and the quantity, as a reader would name them
#   stated  -- the number the scene prints
#   derive  -- a callable of no arguments returning the same quantity,
#              computed independently of how the scene computes it
#   tol     -- relative tolerance; the default is what a figure printed to
#              three significant digits can be trusted to
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
        print(f"{status}  {c['name']}: scene states {stated:.6g}, "
              f"re-derived {got:.6g}, relative difference {rel:.2e}")
        if ok:
            passed += 1
        else:
            failed += 1
    print(f"{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
