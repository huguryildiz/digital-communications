"""Checks every closed-form error probability against a fixed-seed simulation.

A closed form cannot be verified by re-deriving it symbolically -- re-deriving
it is how the original error would be reproduced. It is verified by simulating
the system it describes and asking whether the measured error count is
consistent with the claimed probability.

Deterministic: the seed is fixed, the trial count is fixed per claim, and the
decision is a Wilson interval. A claim that is right passes on every machine.

Trial counts are chosen so that a factor-of-two error in the claimed
probability falls outside the interval. Raising a count is fine; lowering one
weakens the gate and must be justified in the commit message.
"""

import sys
import numpy as np
from ber_claims import CLAIMS
from wilson import wilson_interval, consistent

SEED = 20260802

def main() -> int:
    passed = failed = 0
    for claim in CLAIMS:
        rng = np.random.default_rng(SEED)
        n = claim["trials"]
        p = claim["closed_form"](**claim["params"])
        k = claim["simulate"](rng, n, **claim["params"])
        lo, hi = wilson_interval(k, n)
        ok = consistent(p, k, n)
        status = "PASS" if ok else "FAIL"
        print(
            f"{status}  {claim['name']}: claimed {p:.6e}, "
            f"measured {k}/{n} = {k/n:.6e}, interval [{lo:.6e}, {hi:.6e}]"
        )
        if ok:
            passed += 1
        else:
            failed += 1
    print(f"{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
