"""Re-derives every number stated in the Module 4 practice questions.

Each check reaches the stated number by a route the worked solution does not
take: coordinates by projecting sampled waveforms with numpy (Gram-Schmidt),
Q values by numerical integration of the Gaussian density, MAP thresholds by
root-finding on P0 f0 = P1 f1, error probabilities by integrating the weighted
densities over the error regions or by a seeded Monte Carlo run, and
nearest-neighbour counts by brute force over every pair of points.

Same shape as verify_drills.py: a CHECKS list of dicts and the same runner.
"""

import math
import sys

import numpy as np
from scipy import integrate, optimize

DEFAULT_TOL = 2e-3
NT = 200001            # samples per waveform


# ── independent tools ───────────────────────────────────────────────────────

def phi(x, m=0.0, s=1.0):
    return math.exp(-(x - m) ** 2 / (2 * s * s)) / (s * math.sqrt(2 * math.pi))


def Qint(x):
    """Gaussian tail by quadrature of the density, not by erfc."""
    if x < 0:
        return 1 - Qint(-x)
    v, _ = integrate.quad(lambda u: phi(u), x, np.inf, epsabs=1e-14, epsrel=1e-12)
    return v


def tail(m, s, lo, hi):
    """P(lo < Y < hi) for Y ~ N(m, s^2), by quadrature."""
    v, _ = integrate.quad(lambda y: phi(y, m, s), lo, hi, epsabs=1e-14, epsrel=1e-12,
                          limit=200)
    return v


def grid(T):
    return np.linspace(0.0, T, NT)


def inner(f, g, t):
    return float(np.trapezoid(f * g, t))


def gram_schmidt(sigs, t):
    basis = []
    for s in sigs:
        r = s.copy()
        for b in basis:
            r = r - inner(r, b, t) * b
        e = inner(r, r, t)
        if e > 1e-9:
            basis.append(r / math.sqrt(e))
    return basis


def coords(sigs, T):
    t = grid(T)
    S = [s(t) for s in sigs]
    B = gram_schmidt(S, t)
    return [np.array([inner(s, b, t) for b in B]) for s in S], t, S


def map_threshold(m0, m1, s, p0, p1):
    """Root of p0 f0 - p1 f1 between the two means (or beyond, bracketed wide)."""
    g = lambda y: p0 * phi(y, m0, s) - p1 * phi(y, m1, s)
    lo, hi = min(m0, m1) - 10 * s, max(m0, m1) + 10 * s
    return optimize.brentq(lambda y: math.log(p0 * phi(y, m0, s) + 1e-300)
                           - math.log(p1 * phi(y, m1, s) + 1e-300), lo, hi, xtol=1e-13)


def pb_threshold(m0, m1, s, p0, p1, lam):
    """Average bit error of a threshold detector; the symbol whose mean is on
    the upper side of lam is decided above it."""
    if m1 > m0:
        return p0 * tail(m0, s, lam, np.inf) + p1 * tail(m1, s, -np.inf, lam)
    return p0 * tail(m0, s, -np.inf, lam) + p1 * tail(m1, s, lam, np.inf)


def mc_2d_map(pts, priors, N0, n=2_000_000, seed=1, ml=False):
    """Symbol error of the MAP rule (or the ML rule, ml=True) by Monte Carlo."""
    rng = np.random.default_rng(seed)
    pts = np.asarray(pts, float)
    pr = np.asarray(priors, float)
    idx = rng.choice(len(pts), size=n, p=pr)
    r = pts[idx] + rng.normal(0, math.sqrt(N0 / 2), size=(n, pts.shape[1]))
    d = ((r[:, None, :] - pts[None, :, :]) ** 2).sum(-1) - (0.0 if ml else N0) * np.log(pr)[None, :]
    return float(np.mean(d.argmin(1) != idx))


def dmin_nmin(pts):
    P = np.asarray(pts, float)
    D = np.sqrt(((P[:, None, :] - P[None, :, :]) ** 2).sum(-1))
    np.fill_diagonal(D, np.inf)
    dm = D.min()
    nm = float(np.mean((np.abs(D - dm) < 1e-6).sum(1)))
    return float(dm), nm


def carrier(A, f, th, T=1.0):
    return lambda t: A * np.cos(2 * np.pi * f * t + th) * (t <= T)


def es_avg(pts):
    return float(np.mean([np.dot(p, p) for p in np.asarray(pts, float)]))


CHECKS = []


def add(name, stated, derive, tol=DEFAULT_TOL):
    """The derivation runs here, while the names it reads (c, t, S, ...) still
    hold this question's values; the runner reports the stored result."""
    try:
        v = float(derive())
        fn = lambda v=v: v
    except Exception as exc:                            # reported by the runner
        fn = lambda exc=exc: (_ for _ in ()).throw(exc)
    CHECKS.append({"name": name, "stated": stated, "derive": fn, "tol": tol})


# A value read from a Q table uses the argument rounded to two decimals, so it
# can differ from the exact tail by up to about 1.5% at these arguments.
TABLE_TOL = 1.5e-2


# ── the Q table values quoted in the solutions ──────────────────────────────

QTAB = {1.00: 0.1587, 1.06: 0.1446, 1.09: 0.1379, 1.13: 0.1292, 1.17: 0.1210,
        1.18: 0.1190, 1.25: 0.1056, 1.33: 0.09176, 1.36: 0.08691, 1.41: 0.07927,
        1.49: 0.06811, 1.50: 0.06681, 1.64: 0.05050, 1.66: 0.04846, 1.67: 0.04746,
        1.73: 0.04182, 1.77: 0.03836, 1.79: 0.03673, 1.83: 0.03362, 1.87: 0.03074,
        2.00: 0.02275, 2.10: 0.01786, 2.17: 0.01500, 2.21: 0.01355, 2.24: 0.01255,
        2.27: 0.01160, 2.42: 0.007760, 2.50: 0.006210, 2.58: 0.004940, 2.77: 2.803e-3,
        2.86: 0.002118, 3.00: 1.350e-3, 3.09: 1.001e-3, 3.10: 0.968e-3, 3.23: 6.190e-4,
        3.61: 1.531e-4, 0.10: 0.4602, 0.65: 0.2578, 1.35: 0.08851}
for x, q in QTAB.items():
    add(f"Q table Q({x:.2f})", q, lambda x=x: Qint(x), tol=1.5e-3)

# ── D4-01 ───────────────────────────────────────────────────────────────────
c, t, S = coords([lambda t: -3.0 * ((t >= 1) & (t < 3)), lambda t: 1.0 * ((t >= 1) & (t < 3))], 3)
sgn = np.sign(c[1][0])        # orient the basis as the solution does (s1 > 0)
add("D4-01 s0", -4.243, lambda: sgn * c[0][0])
add("D4-01 s1", 1.414, lambda: sgn * c[1][0])
add("D4-01 lambda", -1.414, lambda: sgn * (c[0][0] + c[1][0]) / 2)
add("D4-01 Pb", 0.02275, lambda: pb_threshold(-4.2426, 1.4142, math.sqrt(2), .5, .5, -1.4142))
add("D4-01 d^2 in time", 32, lambda: inner(S[1] - S[0], S[1] - S[0], t))

# ── D4-02 ───────────────────────────────────────────────────────────────────
c, t, S = coords([lambda t: 2 * t, lambda t: -t], 3)
sgn = np.sign(c[0][0])
add("D4-02 E_p of t on [0,3]", 9, lambda: integrate.quad(lambda u: u * u, 0, 3)[0])
add("D4-02 s0", 6, lambda: sgn * c[0][0])
add("D4-02 s1", -3, lambda: sgn * c[1][0])
add("D4-02 lambda", 1.5, lambda: sgn * (c[0][0] + c[1][0]) / 2)
add("D4-02 Pb", 0.06681, lambda: pb_threshold(6, -3, 3, .5, .5, 1.5))
add("D4-02 d^2", 81, lambda: inner(S[0] - S[1], S[0] - S[1], t))

# ── D4-03 ───────────────────────────────────────────────────────────────────
tri = lambda t: np.where(t <= 1.5, 8 / 3 * t, 8 / 3 * (3 - t)) * (t <= 3)
t = grid(3)
add("D4-03 E1", 16, lambda: inner(tri(t), tri(t), t))
add("D4-03 s1", 4, lambda: math.sqrt(inner(tri(t), tri(t), t)))
add("D4-03 Pb", 0.006210, lambda: pb_threshold(0, 4, 0.8, .5, .5, 2))
add("D4-03 Q argument", 2.50, lambda: math.sqrt(16 / (2 * 1.28)))

# ── D4-04 ───────────────────────────────────────────────────────────────────
c, t, S = coords([lambda t: 3.0 * (t < 1), lambda t: 3.0 * ((t >= 1) & (t < 2))], 2)
add("D4-04 d", 4.243, lambda: float(np.linalg.norm(c[0] - c[1])))
add("D4-04 Pb (Monte Carlo)", 1.350e-3, lambda: mc_2d_map(c, [.5, .5], 1.0, n=4_000_000, seed=4), tol=0.06)
add("D4-04 single-coordinate error", 0.0170, lambda: Qint(1.5 / math.sqrt(.5)), tol=5e-3)

# ── D4-05 ───────────────────────────────────────────────────────────────────
add("D4-05 lambda", -0.2118, lambda: map_threshold(-2, 2, 1, .3, .7))
add("D4-05 Pb", 0.02050, lambda: pb_threshold(-2, 2, 1, .3, .7, map_threshold(-2, 2, 1, .3, .7)), tol=3e-3)
add("D4-05 ln(0.3/0.7)", -0.8473, lambda: math.log(.3) - math.log(.7))
add("D4-05 0.3 phi(1.788)", 0.02420, lambda: .3 * phi(1.7882), tol=3e-3)
add("D4-05 0.7 phi(2.212)", 0.02420, lambda: .7 * phi(2.2118), tol=3e-3)
add("D4-05 phi(1.788)", 0.08067, lambda: phi(1.7882), tol=3e-3)
add("D4-05 phi(2.212)", 0.03457, lambda: phi(2.2118), tol=3e-3)

# ── D4-06 ───────────────────────────────────────────────────────────────────
c, t, S = coords([lambda t: np.sin(np.pi * t), lambda t: 3 * np.sin(np.pi * t)], 2)
sgn = np.sign(c[0][0])
add("D4-06 energy of sin(pi t)", 1, lambda: inner(S[0], S[0], t))
add("D4-06 s1", 3, lambda: sgn * c[1][0])
add("D4-06 Pb", 0.04746, lambda: pb_threshold(1, 3, .6, .5, .5, 2), tol=TABLE_TOL)
add("D4-06 P(e|0) no energy term", 0.9525, lambda: tail(1, .6, 0, np.inf), tol=2e-3)
add("D4-06 Pb no energy term", 0.4763, lambda: pb_threshold(1, 3, .6, .5, .5, 0), tol=2e-3)
add("D4-06 Q(5)", 2.9e-7, lambda: Qint(5), tol=0.02)
add("D4-06 Q argument", 1.667, lambda: math.sqrt(4 / 1.44))

# ── D4-07 ───────────────────────────────────────────────────────────────────
c, t, S = coords([lambda t: math.sqrt(2) * np.cos(4 * np.pi * t), lambda t: -3 * math.sqrt(2) * np.cos(4 * np.pi * t)], 1)
sgn = np.sign(c[0][0])
add("D4-07 s0", 1, lambda: sgn * c[0][0])
add("D4-07 s1", -3, lambda: sgn * c[1][0])
add("D4-07 Pb", 0.002118, lambda: pb_threshold(1, -3, .7, .5, .5, -1), tol=TABLE_TOL)
add("D4-07 d^2", 16, lambda: inner(S[0] - S[1], S[0] - S[1], t))

# ── D4-08 ───────────────────────────────────────────────────────────────────
c, t, S = coords([lambda t: 4 / 3 * (3 - t), lambda t: -2 / 3 * (3 - t)], 3)
sgn = np.sign(c[0][0])
add("D4-08 s0", 4, lambda: sgn * c[0][0])
add("D4-08 s1", -2, lambda: sgn * c[1][0])
lam8 = lambda: map_threshold(-2, 4, 2, .4, .6)
add("D4-08 lambda", 0.7297, lam8)
add("D4-08 Pb", 0.06506, lambda: pb_threshold(4, -2, 2, .6, .4, lam8()), tol=2e-3)
add("D4-08 ln(0.4/0.6)", -0.4055, lambda: math.log(.4 / .6))

# ── D4-09 ───────────────────────────────────────────────────────────────────
c, t, S = coords([lambda t: 2.0 * (t < 1), lambda t: 2.0 * (t < 2)], 2)   # s1 first, then s0
add("D4-09 s0 first coordinate", 2, lambda: abs(c[1][0]))
add("D4-09 s0 second coordinate", 2, lambda: abs(c[1][1]))
add("D4-09 d", 2, lambda: float(np.linalg.norm(c[0] - c[1])))
add("D4-09 Pb (Monte Carlo)", 0.01255, lambda: mc_2d_map([c[1], c[0]], [.5, .5], 0.4, seed=9), tol=0.02)
add("D4-09 Q argument", 2.236, lambda: math.sqrt(4 / 0.8))
add("D4-09 |s0|-|s1|", 0.83, lambda: np.linalg.norm(c[1]) - np.linalg.norm(c[0]), tol=0.01)

# ── D4-10 ───────────────────────────────────────────────────────────────────
s0_10 = lambda t: np.where(t < 2, 1.0, -1.0) * (t < 4)
c, t, S = coords([s0_10, lambda t: -2 * s0_10(t)], 4)
sgn = np.sign(c[0][0])
add("D4-10 s0", 2, lambda: sgn * c[0][0])
add("D4-10 s1", -4, lambda: sgn * c[1][0])
add("D4-10 Pb", 0.1587, lambda: pb_threshold(2, -4, 3, .5, .5, -1), tol=2e-3)
add("D4-10 d^2", 36, lambda: inner(S[0] - S[1], S[0] - S[1], t))

# ── D4-11 ───────────────────────────────────────────────────────────────────
xq = lambda: optimize.brentq(lambda x: Qint(x) - 1e-3, 2, 4)
add("D4-11 s1", 2.828, lambda: math.sqrt(integrate.quad(lambda u: 4.0, 0, 2)[0]))
add("D4-11 max sigma", 0.9153, lambda: 2 * math.sqrt(2) / xq(), tol=1e-3)
add("D4-11 max N0/2", 0.8378, lambda: (2 * math.sqrt(2) / xq()) ** 2, tol=1e-3)
add("D4-11 on-off max sigma", 0.6472, lambda: 2 / xq(), tol=1e-3)
add("D4-11 on-off max N0/2", 0.4189, lambda: (2 / xq()) ** 2, tol=1e-3)
add("D4-11 loss dB", 3.01, lambda: 10 * math.log10(32 / 16), tol=2e-3)

# ── D4-12 ───────────────────────────────────────────────────────────────────
lam12 = lambda: map_threshold(-2, 2, 1.5, .4, .6)
add("D4-12 lambda", -0.2281, lam12)
add("D4-12 Pb", 0.08847, lambda: pb_threshold(-2, 2, 1.5, .4, .6, lam12()), tol=4e-3)
add("D4-12 Pb midpoint", 0.09176, lambda: pb_threshold(-2, 2, 1.5, .4, .6, 0), tol=TABLE_TOL)

# ── D4-13 ───────────────────────────────────────────────────────────────────
lam13 = lambda: map_threshold(0, 5, 2, .6, .4)
add("D4-13 lambda", 2.8244, lam13)
add("D4-13 Pb", 0.1027, lambda: pb_threshold(0, 5, 2, .6, .4, lam13()), tol=2e-3)
add("D4-13 Pb midpoint", 0.1056, lambda: pb_threshold(0, 5, 2, .6, .4, 2.5), tol=2e-3)
add("D4-13 saving", 0.0029, lambda: pb_threshold(0, 5, 2, .6, .4, 2.5) - pb_threshold(0, 5, 2, .6, .4, lam13()), tol=0.05)
add("D4-13 wrong-sign threshold", 2.18, lambda: 2.5 - (map_threshold(0, 5, 2, .6, .4) - 2.5), tol=3e-3)
add("D4-13 Pb wrong-sign", 0.115, lambda: pb_threshold(0, 5, 2, .6, .4, 2.5 - (lam13() - 2.5)), tol=5e-3)
add("D4-13 weighted density at lambda (0)", 0.2213, lambda: .6 * math.exp(-lam13() ** 2 / 8), tol=2e-3)
add("D4-13 weighted density at lambda (1)", 0.2213, lambda: .4 * math.exp(-(5 - lam13()) ** 2 / 8), tol=2e-3)

# ── D4-14 ───────────────────────────────────────────────────────────────────
lam14 = lambda: map_threshold(-2, 1, 1, .75, .25)
add("D4-14 ML Pb", 0.06681, lambda: pb_threshold(-2, 1, 1, .75, .25, -0.5), tol=2e-3)
add("D4-14 lambda", -0.1338, lam14)
add("D4-14 Pb", 0.05537, lambda: pb_threshold(-2, 1, 1, .75, .25, lam14()), tol=2e-3)
add("D4-14 ln3/3", 0.3662, lambda: math.log(3) / 3)

# ── D4-15 ───────────────────────────────────────────────────────────────────
lam15 = lambda: map_threshold(-1.5, 1.5, .5, .8, .2)
add("D4-15 ML Pb", 1.350e-3, lambda: pb_threshold(-1.5, 1.5, .5, .8, .2, 0), tol=2e-3)
add("D4-15 mu", 1.6155, lambda: lam15() + 1.5)
add("D4-15 lambda", 0.1155, lam15, tol=3e-3)
add("D4-15 P(e|0)", 6.190e-4, lambda: tail(-1.5, .5, lam15(), np.inf), tol=6e-3)
add("D4-15 P(e|1)", 2.803e-3, lambda: tail(1.5, .5, -np.inf, lam15()), tol=6e-3)
add("D4-15 Pb", 1.056e-3, lambda: pb_threshold(-1.5, 1.5, .5, .8, .2, lam15()), tol=3e-3)

# ── D4-16 ───────────────────────────────────────────────────────────────────
s16 = math.sqrt(.5)
lam16 = lambda: map_threshold(0, 2, s16, .5, .25)
def pe16(l):
    return 0.25 * tail(-2, s16, -l, np.inf) + 0.5 * (1 - tail(0, s16, -l, l)) + 0.25 * tail(2, s16, -np.inf, l)
add("D4-16 lambda2", 1.1733, lam16)
add("D4-16 P(e|2)", 0.1210, lambda: tail(2, s16, -np.inf, lam16()), tol=4e-3)
add("D4-16 P(e|0)", 0.09691, lambda: 1 - tail(0, s16, -lam16(), lam16()), tol=4e-3)
add("D4-16 Pe", 0.1090, lambda: pe16(lam16()), tol=3e-3)
add("D4-16 Pe ML", 0.1189, lambda: pe16(1.0), tol=TABLE_TOL)
add("D4-16 Pe (Monte Carlo)", 0.1090, lambda: mc_2d_map([[-2], [0], [2]], [.25, .5, .25], 1.0, seed=16), tol=0.01)

# ── D4-17 ───────────────────────────────────────────────────────────────────
lam17 = lambda: map_threshold(-1, 1, .5, 1 / 3, 2 / 3)
lam17c = lambda: map_threshold(-1, 1, 1, 1 / 3, 2 / 3)
add("D4-17 lambda", -0.0866, lam17, tol=3e-3)
add("D4-17 Pb", 0.02121, lambda: pb_threshold(-1, 1, .5, 1 / 3, 2 / 3, lam17()), tol=3e-3)
add("D4-17 lambda (var 1)", -0.3466, lam17c)
add("D4-17 Pb (var 1)", 0.1450, lambda: pb_threshold(-1, 1, 1, 1 / 3, 2 / 3, lam17c()), tol=3e-3)
add("D4-17 ML Pb (var 1)", 0.1587, lambda: pb_threshold(-1, 1, 1, 1 / 3, 2 / 3, 0), tol=2e-3)

# ── D4-18 ───────────────────────────────────────────────────────────────────
lam18 = lambda: map_threshold(-2, 2, 2, .9, .1)
add("D4-18 f(0.5|0)", 0.09132, lambda: phi(.5, -2, 2), tol=2e-3)
add("D4-18 f(0.5|1)", 0.1506, lambda: phi(.5, 2, 2), tol=2e-3)
add("D4-18 0.9 f(0.5|0)", 0.08219, lambda: .9 * phi(.5, -2, 2), tol=2e-3)
add("D4-18 0.1 f(0.5|1)", 0.01506, lambda: .1 * phi(.5, 2, 2), tol=2e-3)
add("D4-18 lambda", 2.197, lam18)
add("D4-18 P(e|1)", 0.5398, lambda: tail(2, 2, -np.inf, lam18()), tol=2e-3)
add("D4-18 Pb", 0.07005, lambda: pb_threshold(-2, 2, 2, .9, .1, lam18()), tol=2e-3)
add("D4-18 1/sqrt(8 pi)", 0.1995, lambda: phi(0, 0, 2), tol=1e-3)

# ── D4-19 ───────────────────────────────────────────────────────────────────
P1_19 = lambda: optimize.brentq(lambda p: map_threshold(-1, 1, s16, 1 - p, p) + 0.25, 0.51, 0.99)
add("D4-19 P1", 0.7311, P1_19)
add("D4-19 P0", 0.2689, lambda: 1 - P1_19())
add("D4-19 Pb", 0.06693, lambda: pb_threshold(-1, 1, s16, 1 - P1_19(), P1_19(), -0.25), tol=3e-3)
add("D4-19 ML Pb", 0.07927, lambda: Qint(1 / s16), tol=TABLE_TOL)

# ── D4-20 ───────────────────────────────────────────────────────────────────
c, t, S = coords([lambda t: 2 * math.sqrt(2) * np.cos(2 * np.pi * t), lambda t: 2 * math.sqrt(2) * np.sin(2 * np.pi * t)], 1)
pts20 = [np.array([2.0, 0.0]), np.array([0.0, 2.0])]
add("D4-20 |s0|", 2, lambda: float(np.linalg.norm(c[0])))
add("D4-20 s0.s1 + 1 (orthogonal)", 1, lambda: float(np.dot(c[0], c[1])) + 1.0, tol=1e-6)
add("D4-20 boundary offset", 0.2747, lambda: optimize.brentq(
    lambda k: (np.sum((np.array([0, k]) - pts20[0]) ** 2) - math.log(.75))
            - (np.sum((np.array([0, k]) - pts20[1]) ** 2) - math.log(.25)), -2, 2))
add("D4-20 D0 at r", 2.708, lambda: float(np.sum((np.array([.9, 1.1]) - pts20[0]) ** 2) - math.log(.75)), tol=1e-3)
add("D4-20 D1 at r", 3.006, lambda: float(np.sum((np.array([.9, 1.1]) - pts20[1]) ** 2) - math.log(.25)), tol=1e-3)
add("D4-20 mu", 1.6084, lambda: (2 + 0.25 * math.log(3)) / math.sqrt(2), tol=1e-3)
add("D4-20 Pb (Monte Carlo)", 0.01916, lambda: mc_2d_map(pts20, [.75, .25], 1.0, seed=20), tol=0.02)
add("D4-20 ML Pb (Monte Carlo)", 0.02275, lambda: mc_2d_map(pts20, [.75, .25], 1.0, seed=21, ml=True), tol=0.02)

# ── M-ary: points by projecting the sampled waveforms ───────────────────────
def mary(sigs, T):
    c, t, S = coords(sigs, T)
    return c

p21 = mary([carrier(math.sqrt(6), 1000, (2 * k - 1) * math.pi / 6) for k in range(1, 7)], 1)
add("D4-21 Es,avg", 3, lambda: es_avg(p21))
add("D4-21 dmin", 1.732, lambda: dmin_nmin(p21)[0])
add("D4-21 Nmin", 2, lambda: dmin_nmin(p21)[1])
add("D4-21 dmin^2 / Es", 1, lambda: dmin_nmin(p21)[0] ** 2 / es_avg(p21))

p22 = mary([lambda t: 0 * t + 1e-12 * np.cos(2000 * np.pi * t), carrier(2 * math.sqrt(2), 1000, 0),
            carrier(4, 1000, math.pi / 4), carrier(2 * math.sqrt(2), 1000, math.pi / 2)], 1)
add("D4-22 Es,avg", 4, lambda: es_avg(p22))
add("D4-22 dmin", 2, lambda: dmin_nmin(p22)[0])
add("D4-22 Nmin", 2, lambda: dmin_nmin(p22)[1])
add("D4-22 centred Es,avg", 2, lambda: es_avg(np.asarray(p22) - np.mean(p22, 0)))
add("D4-22 saving dB", 3.01, lambda: 10 * math.log10(es_avg(p22) / es_avg(np.asarray(p22) - np.mean(p22, 0))), tol=2e-3)

p23 = mary([carrier((2 * k - 5) * math.sqrt(2), 2000, 0) for k in range(1, 5)], 1)
add("D4-23 Es,avg", 5, lambda: es_avg(p23))
add("D4-23 dmin", 2, lambda: dmin_nmin(p23)[0])
add("D4-23 Nmin", 1.5, lambda: dmin_nmin(p23)[1])
add("D4-23 dmin^2/Es", 0.8, lambda: dmin_nmin(p23)[0] ** 2 / es_avg(p23))

p24 = mary([carrier(2, 500, (2 * k - 1) * math.pi / 8, T=2) for k in range(1, 9)], 2)
add("D4-24 Es,avg", 4, lambda: es_avg(p24))
add("D4-24 dmin", 1.531, lambda: dmin_nmin(p24)[0])
add("D4-24 Nmin", 2, lambda: dmin_nmin(p24)[1])
add("D4-24 argument factor", 0.5412, lambda: math.sqrt(dmin_nmin(p24)[0] ** 2 / (2 * es_avg(p24))))
add("D4-24 argument at 20", 2.420, lambda: math.sqrt(dmin_nmin(p24)[0] ** 2 / (2 * es_avg(p24)) * 20), tol=1e-3)
add("D4-24 Pe at 20", 0.01552, lambda: 2 * Qint(math.sqrt(dmin_nmin(p24)[0] ** 2 / (2 * es_avg(p24)) * 20)), tol=4e-3)
add("D4-24 dmin^2 check", 2.343, lambda: dmin_nmin(p24)[0] ** 2, tol=1e-3)

p25 = mary([(lambda a, b: (lambda t: a * math.sqrt(2) * np.cos(2000 * np.pi * t) - b * math.sqrt(2) * np.sin(2000 * np.pi * t)))(a, b)
            for b in (-1, 1) for a in (-3, -1, 1, 3)], 1)
add("D4-25 Es,avg", 6, lambda: es_avg(p25))
add("D4-25 dmin", 2, lambda: dmin_nmin(p25)[0])
add("D4-25 Nmin", 2.5, lambda: dmin_nmin(p25)[1])
add("D4-25 dmin^2/Es", 2 / 3, lambda: dmin_nmin(p25)[0] ** 2 / es_avg(p25))

p26 = mary([lambda t: 1e-12 * np.cos(2000 * np.pi * t)] +
           [carrier(2 * math.sqrt(2), 1000, (k - 2) * math.pi / 2) for k in range(2, 6)], 1)
add("D4-26 Es,avg", 3.2, lambda: es_avg(p26))
add("D4-26 dmin", 2, lambda: dmin_nmin(p26)[0])
add("D4-26 Nmin", 1.6, lambda: dmin_nmin(p26)[1])
add("D4-26 dmin^2/Es", 1.25, lambda: dmin_nmin(p26)[0] ** 2 / es_avg(p26))

p27 = mary([carrier(2, 1000, 2 * math.pi * k / 3 + math.pi / 2) for k in range(3)], 1)
add("D4-27 Es,avg", 2, lambda: es_avg(p27))
add("D4-27 dmin", 2.449, lambda: dmin_nmin(p27)[0])
add("D4-27 Nmin", 2, lambda: dmin_nmin(p27)[1])
add("D4-27 point s1 on sqrt2 cos", -1.225, lambda: inner(carrier(2, 1000, 2 * math.pi / 3 + math.pi / 2)(grid(1)), math.sqrt(2) * np.cos(2000 * np.pi * grid(1)), grid(1)), tol=1e-3)
add("D4-27 Pe at 6", 2.700e-3, lambda: 2 * Qint(math.sqrt(dmin_nmin(p27)[0] ** 2 / (2 * es_avg(p27)) * 6)), tol=2e-3)

p28 = mary([lambda t: 1e-12 * np.cos(2000 * np.pi * t)] +
           [carrier(2 * math.sqrt(2), 1000, (k - 2) * math.pi / 3) for k in range(2, 8)], 1)
add("D4-28 Es,avg", 24 / 7, lambda: es_avg(p28))
add("D4-28 dmin", 2, lambda: dmin_nmin(p28)[0])
add("D4-28 Nmin", 24 / 7, lambda: dmin_nmin(p28)[1])
add("D4-28 dmin^2/Es", 7 / 6, lambda: dmin_nmin(p28)[0] ** 2 / es_avg(p28))

# ── D4-29 ───────────────────────────────────────────────────────────────────
pskA = [(math.cos(k * math.pi / 4), math.sin(k * math.pi / 4)) for k in range(8)]
rectB = [(a, b) for b in (-1, 1) for a in (-3, -1, 1, 3)]
dA = lambda: dmin_nmin(pskA)[0] ** 2 / es_avg(pskA)
dB = lambda: dmin_nmin(rectB)[0] ** 2 / es_avg(rectB)
add("D4-29 dA^2/Es", 0.5858, dA)
add("D4-29 dB^2/Es", 0.6667, dB)
add("D4-29 NA", 2, lambda: dmin_nmin(pskA)[1])
add("D4-29 NB", 2.5, lambda: dmin_nmin(rectB)[1])
add("D4-29 Pe A at 20", 0.01552, lambda: 2 * Qint(math.sqrt(dA() * 10)), tol=4e-3)
add("D4-29 Pe B at 20", 0.01235, lambda: 2.5 * Qint(math.sqrt(dB() * 10)), tol=TABLE_TOL)
add("D4-29 gain dB", 0.56, lambda: 10 * math.log10(dB() / dA()), tol=5e-3)

# ── D4-30 ───────────────────────────────────────────────────────────────────
c30, t, S = coords([lambda t: 1e-12 * (t < 2), lambda t: 2.0 * (t < 1), lambda t: 3.0 * ((t >= 1) & (t < 2))], 2)
p30 = np.array([[0, 0], [2, 0], [0, 3]], float)
def union30():
    tot = 0.0
    for k in range(3):
        for j in range(3):
            if j != k:
                d = np.linalg.norm(p30[k] - p30[j])
                tot += Qint(d / (2 * 0.5))
    return tot / 3
add("D4-30 d23", 3.606, lambda: float(np.linalg.norm(p30[1] - p30[2])))
add("D4-30 |s3| from waveform", 3, lambda: float(np.max(np.abs(c30[2]))))
add("D4-30 union bound", 0.01617, union30, tol=3e-3)
add("D4-30 NN", 0.01517, lambda: dmin_nmin(p30)[1] * Qint(2), tol=2e-3)
add("D4-30 min-distance bound", 0.04550, lambda: 2 * Qint(2), tol=2e-3)
add("D4-30 exact P(e|s1)", 0.02407, lambda: 1 - (1 - Qint(2)) * (1 - Qint(3)), tol=2e-3)
add("D4-30 union for s1", 0.02410, lambda: Qint(2) + Qint(3), tol=2e-3)
add("D4-30 exact Pe below union (MC)", 1.0, lambda: 1.0 if mc_2d_map(p30, [1/3]*3, 0.5, seed=30) < union30() else 0.0)


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
