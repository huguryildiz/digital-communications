"""Wilson score interval, the decision rule for verify_ber.py.

A simulated error count k out of n trials is consistent with a claimed
probability p when p lies inside this interval. The normal approximation to
a binomial proportion is useless here because error probabilities are small
and k is often near zero; the Wilson interval stays correct in that regime.

z defaults to 3.0, roughly a 99.7% interval. A claim that is right passes
with probability ~0.997 per check, and a claim with a factor-of-two slip
fails whenever the trial count is sized as verify_ber.py sizes it.
"""

import math


def wilson_interval(k: int, n: int, z: float = 3.0) -> tuple[float, float]:
    if n <= 0:
        raise ValueError("n must be positive")
    p = k / n
    z2 = z * z
    denom = 1.0 + z2 / n
    centre = (p + z2 / (2 * n)) / denom
    half = (z / denom) * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))
    return (max(0.0, centre - half), min(1.0, centre + half))


def consistent(p_claimed: float, k: int, n: int, z: float = 3.0) -> bool:
    lo, hi = wilson_interval(k, n, z)
    return lo <= p_claimed <= hi
