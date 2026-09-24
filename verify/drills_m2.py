"""Re-derives every number stated in the Module 2 practice questions.

Each check reaches a stated number by a route the worked solution does not
take. The matched-filter questions are sampled on a fine time grid and run
through a numerical Gram-Schmidt step; thresholds are found by root search on
the weighted densities, or by minimising the error numerically; error
probabilities are numerical integrals of the given densities, or seeded Monte
Carlo runs. No check retypes the closed form of its solution.

A solution reads each Q value from a table at a two-decimal argument. Where
that rounding moves the number, the check compares against the exact value
with a tolerance that covers the rounding, and says so in its name.

The runner is the one used by verify_drills.py. Adding a check is adding a
dict to CHECKS.
"""

import math
import sys

import numpy as np
from scipy import integrate, optimize, special, stats

DEFAULT_TOL = 5e-3

# ── shared tools ────────────────────────────────────────────────────────────

DT = 1e-4


def _grid(T):
    n = int(round(T / DT))
    return (np.arange(n) + 0.5) * DT          # midpoints of the time cells


def _pw(pieces):
    """Piecewise waveform from (t0, t1, f) with f a number or a function."""
    def s(t):
        t = np.asarray(t, dtype=float)
        out = np.zeros_like(t)
        for a, b, f in pieces:
            m = (t >= a) & (t < b)
            out[m] = f(t[m]) if callable(f) else f
        return out
    return s


def _gs(s0, s1, T):
    """Numerical Gram-Schmidt on sampled waveforms: the unit-energy basis of the
    one-dimensional signal space and the two coordinates."""
    t = _grid(T)
    a0, a1 = s0(t), s1(t)
    base = a1                                  # the solutions normalise s1
    E = np.sum(base ** 2) * DT
    psi = base / math.sqrt(E)
    c0 = np.sum(a0 * psi) * DT
    c1 = np.sum(a1 * psi) * DT
    resid = np.sum((a0 - c0 * psi) ** 2) * DT + np.sum((a1 - c1 * psi) ** 2) * DT
    assert resid < 1e-6, "the two waveforms need more than one basis signal"
    return t, psi, c0, c1


def _energy(s, T):
    t = _grid(T)
    return float(np.sum(s(t) ** 2) * DT)


def _h_at(s0, s1, T, tq):
    """h(t) = psi(T - t), read off the sampled basis signal. psi points along s1."""
    t, psi, c0, c1 = _gs(s0, s1, T)
    k = int((T - tq) / DT)
    return float(psi[min(max(k, 0), len(psi) - 1)])


def _gpdf(y, m, v):
    return math.exp(-(y - m) ** 2 / (2 * v)) / math.sqrt(2 * math.pi * v)


def _tail(m, v, lo, hi):
    """P(lo < Y < hi) for Y ~ N(m, v), by numerical integration of the density."""
    val, _ = integrate.quad(lambda y: _gpdf(y, m, v), lo, hi, epsabs=1e-14, epsrel=1e-11, limit=200)
    return val


def _Qtab(x):
    """A table value Q(x), integrated from the standard normal density."""
    return _tail(0.0, 1.0, x, np.inf)


def _root(f, a, b):
    return optimize.brentq(f, a, b, xtol=1e-12)


def _gauss_case(m0, m1, v, p0):
    """Threshold and error of an equal-variance Gaussian decision, found by a
    root search on the weighted densities and by integration."""
    p1 = 1 - p0
    lam = _root(lambda y: p0 * _gpdf(y, m0, v) - p1 * _gpdf(y, m1, v),
                min(m0, m1), max(m0, m1))
    lo = m0 < m1
    e0 = _tail(m0, v, lam, np.inf) if lo else _tail(m0, v, -np.inf, lam)
    e1 = _tail(m1, v, -np.inf, lam) if lo else _tail(m1, v, lam, np.inf)
    return lam, e0, e1, p0 * e0 + p1 * e1


def _dist(s0, s1, T):
    t = _grid(T)
    return math.sqrt(np.sum((s1(t) - s0(t)) ** 2) * DT)


def _pb_at(f0, f1, p0, lam, lo=-np.inf, hi=np.inf, points=None):
    """P_b for the rule 'decide 1 when y > lam', integrating the densities."""
    def q(f, a, b):
        if points is None:
            return integrate.quad(f, a, b, limit=400)[0]
        a, b = max(a, -300.0), min(b, 300.0)          # break points need finite limits
        inside = [p for p in points if a < p < b] or None
        return integrate.quad(f, a, b, limit=400, points=inside)[0]
    e0, e1 = q(f0, lam, hi), q(f1, lo, lam)
    return p0 * e0 + (1 - p0) * e1, e0, e1


def _argmin(fun, a, b):
    return optimize.minimize_scalar(fun, bounds=(a, b), method="bounded",
                                    options={"xatol": 1e-10}).x


def _tri(a):
    return lambda n: (1 - abs(n) / a) / a if abs(n) <= a else 0.0


def _lap_shape(b):
    return lambda n: math.exp(-abs(n) / b)


def _expo(mu):
    return lambda y: math.exp(-y / mu) / mu if y >= 0 else 0.0


def _mc(seed, n, fn):
    rng = np.random.default_rng(seed)
    return fn(rng, n)


# ── the waveforms of the matched-filter questions ──────────────────────────

W01 = (_pw([(0, 1, -2), (1, 3, -4)]), _pw([(0, 1, 1), (1, 3, 2)]), 3)
W02 = (_pw([(0, 3, lambda t: -t)]), _pw([(0, 3, lambda t: 2 * t)]), 3)
W03 = (_pw([(0, 4, 0)]), _pw([(0, 1, 2), (1, 3, 4), (3, 4, 0)]), 4)
W04 = (_pw([(0, 1, 1), (1, 4, -1)]), _pw([(0, 1, 3), (1, 4, -3)]), 4)
W05 = (_pw([(0, 1.5, lambda t: -4 * t), (1.5, 3, lambda t: -4 * (3 - t))]),
       _pw([(0, 1.5, lambda t: 4 * t), (1.5, 3, lambda t: 4 * (3 - t))]), 3)
W06 = (_pw([(0, 3, lambda t: -5 * (3 - t) / 3)]), _pw([(0, 3, lambda t: 2 * (3 - t) / 3)]), 3)
W07 = (_pw([(0, 2, -2), (2, 3, 1)]), _pw([(0, 2, 2), (2, 3, -1)]), 3)
W08 = (_pw([(0, 2, -3), (2, 4, 3)]), _pw([(0, 2, 1), (2, 4, -1)]), 4)
W09 = (_pw([(0, 1, 0), (1, 3, -4), (3, 4, -2)]), _pw([(0, 1, 0), (1, 3, 2), (3, 4, 1)]), 4)
W10 = (_pw([(0, 4, 0)]), _pw([(0, 3, lambda t: 2 * t), (3, 4, 0)]), 4)
W12 = (_pw([(0, 3, lambda t: t - 1.5)]), _pw([(0, 3, lambda t: 3 * t - 4.5)]), 3)
W28 = (_pw([(0, 2, -2), (2, 3, -1), (3, 4, 0)]), _pw([(0, 2, 2), (2, 3, 1), (3, 4, 0)]), 4)


def _coords(W):
    _, _, c0, c1 = _gs(*W)
    return c0, c1


def _mf_pb(W, v, p0=0.5):
    c0, c1 = _coords(W)
    return _gauss_case(c0, c1, v, p0)


# ── the checks ─────────────────────────────────────────────────────────────

CHECKS = [
    # D2-01
    {"name": "D2-01(a) energy of s1", "stated": 9, "derive": lambda: _energy(W01[1], 3)},
    {"name": "D2-01(a) h(t)=2/3 on [0,2]", "stated": 2 / 3, "derive": lambda: _h_at(*W01, 1.0)},
    {"name": "D2-01(a) h(t)=1/3 on (2,3]", "stated": 1 / 3, "derive": lambda: _h_at(*W01, 2.5)},
    {"name": "D2-01(b) coordinate of s1", "stated": 3, "derive": lambda: _coords(W01)[1]},
    {"name": "D2-01(b) coordinate of s0", "stated": -6, "derive": lambda: _coords(W01)[0]},
    {"name": "D2-01(b) Gaussian factor 1/sqrt(2 pi 2.25)", "stated": 0.2660,
     "derive": lambda: _gpdf(0, 0, 2.25), "tol": 1e-3},
    {"name": "D2-01(c) threshold", "stated": -1.5, "derive": lambda: _mf_pb(W01, 2.25)[0]},
    {"name": "D2-01(c) P_b", "stated": 1.350e-3, "derive": lambda: _mf_pb(W01, 2.25)[3], "tol": 1e-3},
    {"name": "D2-01 check: distance d", "stated": 9, "derive": lambda: _dist(W01[0], W01[1], 3)},
    {"name": "D2-01 err: Q(2.12) with the wrong variance", "stated": 0.0170,
     "derive": lambda: _Qtab(4.5 / math.sqrt(4.5)), "tol": 1e-2},
    # D2-02
    {"name": "D2-02(a) energy of the ramp t", "stated": 9, "derive": lambda: _energy(_pw([(0, 3, lambda t: t)]), 3)},
    {"name": "D2-02(a) h(1)=1-1/3", "stated": 2 / 3, "derive": lambda: _h_at(*W02, 1.0)},
    {"name": "D2-02(b) coordinate of s1", "stated": 6, "derive": lambda: _coords(W02)[1]},
    {"name": "D2-02(b) coordinate of s0", "stated": -3, "derive": lambda: _coords(W02)[0]},
    {"name": "D2-02(b) Gaussian factor", "stated": 0.1995, "derive": lambda: _gpdf(0, 0, 4), "tol": 1e-3},
    {"name": "D2-02(c) threshold", "stated": 1.5, "derive": lambda: _mf_pb(W02, 4)[0]},
    {"name": "D2-02(c) P_b = Q(2.25)", "stated": 0.01222, "derive": lambda: _mf_pb(W02, 4)[3], "tol": 1e-3},
    {"name": "D2-02 check: distance d", "stated": 9, "derive": lambda: _dist(W02[0], W02[1], 3)},
    # D2-03
    {"name": "D2-03(a) energy of s1", "stated": 36, "derive": lambda: _energy(W03[1], 4)},
    {"name": "D2-03(a) h=0 on [0,1)", "stated": 0, "derive": lambda: _h_at(*W03, 0.5), "tol": 1e-9},
    {"name": "D2-03(a) h=2/3 on (1,3]", "stated": 2 / 3, "derive": lambda: _h_at(*W03, 2.0)},
    {"name": "D2-03(a) h=1/3 on (3,4]", "stated": 1 / 3, "derive": lambda: _h_at(*W03, 3.5)},
    {"name": "D2-03(b) coordinate of s1", "stated": 6, "derive": lambda: _coords(W03)[1]},
    {"name": "D2-03(c) threshold", "stated": 3, "derive": lambda: _mf_pb(W03, 4)[0]},
    {"name": "D2-03(c) P_b = Q(1.50)", "stated": 0.06681, "derive": lambda: _mf_pb(W03, 4)[3], "tol": 1e-3},
    {"name": "D2-03 check: sqrt(Eb/N0) with Eb the average energy", "stated": 1.5,
     "derive": lambda: math.sqrt(0.5 * (_energy(W03[0], 4) + _energy(W03[1], 4)) / 8)},
    # D2-04
    {"name": "D2-04(a) energy of s0", "stated": 4, "derive": lambda: _energy(W04[0], 4)},
    {"name": "D2-04(a) h=-1/2 on [0,3]", "stated": -0.5, "derive": lambda: _h_at(*W04, 1.5)},
    {"name": "D2-04(a) h=1/2 on (3,4]", "stated": 0.5, "derive": lambda: _h_at(*W04, 3.5)},
    {"name": "D2-04(b) coordinate of s0", "stated": 2, "derive": lambda: _coords(W04)[0]},
    {"name": "D2-04(b) coordinate of s1", "stated": 6, "derive": lambda: _coords(W04)[1]},
    {"name": "D2-04(c) threshold", "stated": 4, "derive": lambda: _mf_pb(W04, 1)[0]},
    {"name": "D2-04(c) P_b = Q(2.00)", "stated": 0.02275, "derive": lambda: _mf_pb(W04, 1)[3], "tol": 1e-3},
    {"name": "D2-04 check: energy of the difference", "stated": 16, "derive": lambda: _dist(W04[0], W04[1], 4) ** 2},
    # D2-05
    {"name": "D2-05(a) energy of the triangle", "stated": 36, "derive": lambda: _energy(W05[1], 3)},
    {"name": "D2-05(a) h(t)=psi(t) at t=0.9", "stated": 0.6, "derive": lambda: _h_at(*W05, 0.9)},
    {"name": "D2-05(b) Gaussian factor", "stated": 0.1596, "derive": lambda: _gpdf(0, 0, 6.25), "tol": 1e-3},
    {"name": "D2-05(c) P_b = Q(2.40)", "stated": 8.198e-3, "derive": lambda: _mf_pb(W05, 6.25)[3], "tol": 1e-3},
    {"name": "D2-05 check: sqrt(2Eb/N0)", "stated": 2.40, "derive": lambda: math.sqrt(2 * _energy(W05[1], 3) / 12.5)},
    {"name": "D2-05 err: the area rule gives 54", "stated": 54, "derive": lambda: 0.5 * 36 * 3},
    # D2-06
    {"name": "D2-06(a) energy of 3-t", "stated": 9, "derive": lambda: _energy(_pw([(0, 3, lambda t: 3 - t)]), 3)},
    {"name": "D2-06(a) h(1.5)=0.5", "stated": 0.5, "derive": lambda: _h_at(*W06, 1.5)},
    {"name": "D2-06(b) coordinate of s1", "stated": 2, "derive": lambda: _coords(W06)[1]},
    {"name": "D2-06(b) coordinate of s0", "stated": -5, "derive": lambda: _coords(W06)[0]},
    {"name": "D2-06(c) threshold", "stated": -1.5, "derive": lambda: _mf_pb(W06, 4)[0]},
    {"name": "D2-06(c) P_b = Q(1.75)", "stated": 0.04006, "derive": lambda: _mf_pb(W06, 4)[3], "tol": 1e-3},
    # D2-07
    {"name": "D2-07(a) energy of s1", "stated": 9, "derive": lambda: _energy(W07[1], 3)},
    {"name": "D2-07(a) h=-1/3 on [0,1)", "stated": -1 / 3, "derive": lambda: _h_at(*W07, 0.5)},
    {"name": "D2-07(a) h=2/3 on [1,3]", "stated": 2 / 3, "derive": lambda: _h_at(*W07, 2.0)},
    {"name": "D2-07(c) threshold", "stated": 0.5199, "derive": lambda: _mf_pb(W07, 2.25, 0.8)[0], "tol": 1e-3},
    {"name": "D2-07(d) Q(2.35) table value", "stated": 0.009387, "derive": lambda: _Qtab(2.35), "tol": 1e-3},
    {"name": "D2-07(d) Q(1.65) table value", "stated": 0.04947, "derive": lambda: _Qtab(1.65), "tol": 1e-3},
    {"name": "D2-07(d) P_b (table rounding covered)", "stated": 0.01740,
     "derive": lambda: _mf_pb(W07, 2.25, 0.8)[3], "tol": 5e-3},
    {"name": "D2-07(d) P_b at lambda=0", "stated": 0.02275,
     "derive": lambda: 0.8 * _tail(-3, 2.25, 0, np.inf) + 0.2 * _tail(3, 2.25, -np.inf, 0), "tol": 1e-3},
    {"name": "D2-07 check: weighted density at lambda", "stated": 0.01356,
     "derive": lambda: 0.8 * _gpdf(_mf_pb(W07, 2.25, 0.8)[0], -3, 2.25), "tol": 1e-3},
    {"name": "D2-07(d) reduction, per cent (table rounding covered)", "stated": 24,
     "derive": lambda: 100 * (1 - _mf_pb(W07, 2.25, 0.8)[3] / _Qtab(2)), "tol": 3e-2},
    # D2-08
    {"name": "D2-08(a) coordinate of s1", "stated": 2, "derive": lambda: _coords(W08)[1]},
    {"name": "D2-08(a) coordinate of s0", "stated": -6, "derive": lambda: _coords(W08)[0]},
    {"name": "D2-08(b) h=-1/2 on [0,2]", "stated": -0.5, "derive": lambda: _h_at(*W08, 1.0)},
    {"name": "D2-08(c) Gaussian factor", "stated": 0.2493, "derive": lambda: _gpdf(0, 0, 2.56), "tol": 1e-3},
    {"name": "D2-08(d) threshold", "stated": -2, "derive": lambda: _mf_pb(W08, 2.56)[0]},
    {"name": "D2-08(d) P_b = Q(2.50)", "stated": 6.210e-3, "derive": lambda: _mf_pb(W08, 2.56)[3], "tol": 1e-3},
    {"name": "D2-08 check: energy of the difference", "stated": 64, "derive": lambda: _dist(W08[0], W08[1], 4) ** 2},
    {"name": "D2-08 err: correlation of s0 and s1", "stated": -12,
     "derive": lambda: float(np.sum(W08[0](_grid(4)) * W08[1](_grid(4))) * DT)},
    # D2-09
    {"name": "D2-09(a) energy of s1", "stated": 9, "derive": lambda: _energy(W09[1], 4)},
    {"name": "D2-09(a) h=1/3 on [0,1)", "stated": 1 / 3, "derive": lambda: _h_at(*W09, 0.5)},
    {"name": "D2-09(a) h=0 on [3,4]", "stated": 0, "derive": lambda: _h_at(*W09, 3.5), "tol": 1e-9},
    {"name": "D2-09(b) coordinate of s0", "stated": -6, "derive": lambda: _coords(W09)[0]},
    {"name": "D2-09(c) P_b = Q(1.80)", "stated": 0.03593, "derive": lambda: _mf_pb(W09, 6.25)[3], "tol": 1e-3},
    # D2-10
    {"name": "D2-10(a) energy of s1", "stated": 36, "derive": lambda: _energy(W10[1], 4)},
    {"name": "D2-10(a) h=0 on [0,1)", "stated": 0, "derive": lambda: _h_at(*W10, 0.5), "tol": 1e-9},
    {"name": "D2-10(a) h(2.5)=(4-2.5)/3", "stated": 0.5, "derive": lambda: _h_at(*W10, 2.5), "tol": 1e-3},
    {"name": "D2-10(b) Gaussian factor", "stated": 0.1662, "derive": lambda: _gpdf(0, 0, 5.76), "tol": 1e-3},
    {"name": "D2-10(c) P_b = Q(1.25)", "stated": 0.1056, "derive": lambda: _mf_pb(W10, 5.76)[3], "tol": 1e-3},
    # D2-12
    {"name": "D2-12(a) energy of t-1.5", "stated": 2.25, "derive": lambda: _energy(W12[0], 3)},
    {"name": "D2-12(a) h(0)=1", "stated": 1, "derive": lambda: _h_at(*W12, 0.0005), "tol": 2e-3},
    {"name": "D2-12(b) coordinate of s0", "stated": 1.5, "derive": lambda: _coords(W12)[0]},
    {"name": "D2-12(b) coordinate of s1", "stated": 4.5, "derive": lambda: _coords(W12)[1]},
    {"name": "D2-12(c) threshold", "stated": 3.135, "derive": lambda: _mf_pb(W12, 1, 0.6)[0], "tol": 1e-3},
    {"name": "D2-12(c) Q(1.64) table value", "stated": 0.05050, "derive": lambda: _Qtab(1.64), "tol": 1e-3},
    {"name": "D2-12(c) Q(1.36) table value", "stated": 0.08691, "derive": lambda: _Qtab(1.36), "tol": 1e-3},
    {"name": "D2-12(c) P_b (table rounding covered)", "stated": 0.06506, "derive": lambda: _mf_pb(W12, 1, 0.6)[3], "tol": 2e-3},
    {"name": "D2-12 check: weighted density at lambda", "stated": 0.0629,
     "derive": lambda: 0.6 * _gpdf(_mf_pb(W12, 1, 0.6)[0], 1.5, 1), "tol": 2e-3},
]


# ── the non-Gaussian questions ─────────────────────────────────────────────

def _tri_case(a, shift, p0, rule, lam_lo, lam_hi):
    f0 = lambda y: _tri(a)(y)
    f1 = lambda y: _tri(a)(y - shift)
    pts = [-a, 0, a, shift - a, shift, shift + a]
    rule_pb = _pb_at(f0, f1, p0, rule, -a - 1, shift + a + 1, points=pts)
    lam = _argmin(lambda l: _pb_at(f0, f1, p0, l, -a - 1, shift + a + 1, points=pts)[0], lam_lo, lam_hi)
    opt = _pb_at(f0, f1, p0, lam, -a - 1, shift + a + 1, points=pts)
    return rule_pb, lam, opt


def _lap_c(b):
    area, _ = integrate.quad(_lap_shape(b), -np.inf, np.inf)
    return 1 / area


def _lap_case(b, m0, m1, p0, rule):
    c = _lap_c(b)
    f0 = lambda y: c * _lap_shape(b)(y - m0)
    f1 = lambda y: c * _lap_shape(b)(y - m1)
    pts = [m0, m1]
    rule_pb = _pb_at(f0, f1, p0, rule, points=pts + [rule])
    lam = _root(lambda y: p0 * f0(y) - (1 - p0) * f1(y), m0 + 1e-9, m1 - 1e-9)
    opt = _pb_at(f0, f1, p0, lam, points=pts + [lam])
    return c, rule_pb, lam, opt


def _exp_case(mu0, mu1, p0, rule):
    f0, f1 = _expo(mu0), _expo(mu1)
    rule_pb = _pb_at(f0, f1, p0, rule, 0, np.inf)
    lam = _argmin(lambda l: _pb_at(f0, f1, p0, l, 0, np.inf)[0], 1e-6, 10 * mu1)
    opt = _pb_at(f0, f1, p0, lam, 0, np.inf)
    return rule_pb, lam, opt


T13 = _tri_case(8, 5, 0.5, 3, 0.5, 4.5)
T16 = _tri_case(4, 6, 0.5, 5, 2.2, 3.8)
T20 = _tri_case(5, 4, 0.6, 2, 1.0, 3.9)
L14 = _lap_case(2, -2, 2, 0.5, 1)
L17 = _lap_case(5, 0, 8, 0.5, 3)
L19 = _lap_case(1, -3, 3, 0.8, 0)
E15 = _exp_case(2, 6, 0.5, 4)
E18 = _exp_case(3, 12, 0.5, 6)

CHECKS += [
    # D2-13
    {"name": "D2-13(a) P(e|0) for Y>3", "stated": 0.1953, "derive": lambda: T13[0][1], "tol": 1e-3},
    {"name": "D2-13(a) P(e|1) for Y>3", "stated": 0.2813, "derive": lambda: T13[0][2], "tol": 1e-3},
    {"name": "D2-13(a) P_b = 61/256", "stated": 0.2383, "derive": lambda: T13[0][0], "tol": 1e-3},
    {"name": "D2-13(b) threshold by minimising P_b", "stated": 2.5, "derive": lambda: T13[1], "tol": 1e-4},
    {"name": "D2-13(c) P_b at the threshold", "stated": 0.2363, "derive": lambda: T13[2][0], "tol": 1e-3},
    {"name": "D2-13 check: total overlap area", "stated": 0.4727,
     "derive": lambda: integrate.quad(lambda y: min(_tri(8)(y), _tri(8)(y - 5)), -3, 8, points=[0, 2.5, 5])[0], "tol": 1e-3},
    # D2-14
    {"name": "D2-14(a) c", "stated": 0.25, "derive": lambda: L14[0]},
    {"name": "D2-14(a) P(e|0) for Y>1", "stated": 0.1116, "derive": lambda: L14[1][1], "tol": 1e-3},
    {"name": "D2-14(a) P(e|1) for Y>1", "stated": 0.3033, "derive": lambda: L14[1][2], "tol": 1e-3},
    {"name": "D2-14(a) P_b for Y>1", "stated": 0.2074, "derive": lambda: L14[1][0], "tol": 1e-3},
    {"name": "D2-14(b) threshold", "stated": 0, "derive": lambda: L14[2], "tol": 1e-6},
    {"name": "D2-14(c) P_b at the threshold", "stated": 0.1839, "derive": lambda: L14[3][0], "tol": 1e-3},
    # D2-15
    {"name": "D2-15(a) P(e|0) for Y>4", "stated": 0.1353, "derive": lambda: E15[0][1], "tol": 1e-3},
    {"name": "D2-15(a) P(e|1) for Y>4", "stated": 0.4866, "derive": lambda: E15[0][2], "tol": 1e-3},
    {"name": "D2-15(a) P_b for Y>4", "stated": 0.3110, "derive": lambda: E15[0][0], "tol": 1e-3},
    {"name": "D2-15(b) threshold by minimising P_b", "stated": 3.296, "derive": lambda: E15[1], "tol": 1e-3},
    {"name": "D2-15(c) P(e|0)", "stated": 0.1925, "derive": lambda: E15[2][1], "tol": 1e-3},
    {"name": "D2-15(c) P(e|1)", "stated": 0.4226, "derive": lambda: E15[2][2], "tol": 1e-3},
    {"name": "D2-15(c) P_b", "stated": 0.3075, "derive": lambda: E15[2][0], "tol": 1e-3},
    # D2-16
    {"name": "D2-16(a) P(e|1) for Y>5", "stated": 0.2813, "derive": lambda: T16[0][2], "tol": 1e-3},
    {"name": "D2-16(a) P_b for Y>5", "stated": 0.1406, "derive": lambda: T16[0][0], "tol": 1e-3},
    {"name": "D2-16(b) threshold", "stated": 3, "derive": lambda: T16[1], "tol": 1e-4},
    {"name": "D2-16(c) P_b at the threshold", "stated": 0.03125, "derive": lambda: T16[2][0], "tol": 1e-3},
    # D2-17
    {"name": "D2-17(a) c", "stated": 0.1, "derive": lambda: L17[0]},
    {"name": "D2-17(a) P(e|0) for Y>3", "stated": 0.2744, "derive": lambda: L17[1][1], "tol": 1e-3},
    {"name": "D2-17(a) P(e|1) for Y>3", "stated": 0.1839, "derive": lambda: L17[1][2], "tol": 1e-3},
    {"name": "D2-17(a) P_b for Y>3", "stated": 0.2292, "derive": lambda: L17[1][0], "tol": 1e-3},
    {"name": "D2-17(b) threshold", "stated": 4, "derive": lambda: L17[2], "tol": 1e-6},
    {"name": "D2-17(c) P_b", "stated": 0.2247, "derive": lambda: L17[3][0], "tol": 1e-3},
    # D2-18
    {"name": "D2-18(a) P(e|1) for Y>6", "stated": 0.3935, "derive": lambda: E18[0][2], "tol": 1e-3},
    {"name": "D2-18(a) P_b for Y>6", "stated": 0.2644, "derive": lambda: E18[0][0], "tol": 1e-3},
    {"name": "D2-18(b) threshold", "stated": 5.545, "derive": lambda: E18[1], "tol": 1e-3},
    {"name": "D2-18(c) P(e|0)", "stated": 0.1575, "derive": lambda: E18[2][1], "tol": 1e-3},
    {"name": "D2-18(c) P(e|1)", "stated": 0.3700, "derive": lambda: E18[2][2], "tol": 1e-3},
    {"name": "D2-18(c) P_b", "stated": 0.2638, "derive": lambda: E18[2][0], "tol": 1e-3},
    {"name": "D2-18 check: P_b at t=5", "stated": 0.2648,
     "derive": lambda: _pb_at(_expo(3), _expo(12), 0.5, 5, 0, np.inf)[0], "tol": 1e-3},
    # D2-19
    {"name": "D2-19(a) c", "stated": 0.5, "derive": lambda: L19[0]},
    {"name": "D2-19(a) P_b for Y>0", "stated": 0.02489, "derive": lambda: L19[1][0], "tol": 1e-3},
    {"name": "D2-19(b) threshold", "stated": 0.6931, "derive": lambda: L19[2], "tol": 1e-4},
    {"name": "D2-19(c) P(e|0)", "stated": 0.01245, "derive": lambda: L19[3][1], "tol": 1e-3},
    {"name": "D2-19(c) P(e|1)", "stated": 0.04979, "derive": lambda: L19[3][2], "tol": 1e-3},
    {"name": "D2-19(c) P_b", "stated": 0.01991, "derive": lambda: L19[3][0], "tol": 1e-3},
    {"name": "D2-19(c) threshold is the minimiser",
     "stated": 0.6931, "derive": lambda: _argmin(lambda l: _pb_at(
         lambda y: 0.5 * math.exp(-abs(y + 3)), lambda y: 0.5 * math.exp(-abs(y - 3)), 0.8, l,
         points=[-3, 3])[0], -2.5, 2.5), "tol": 1e-4},
    # D2-20
    {"name": "D2-20(a) P_b for Y>2", "stated": 0.18, "derive": lambda: T20[0][0], "tol": 1e-3},
    {"name": "D2-20(b) threshold", "stated": 2.6, "derive": lambda: T20[1], "tol": 1e-4},
    {"name": "D2-20(c) P(e|0)", "stated": 0.1152, "derive": lambda: T20[2][1], "tol": 1e-3},
    {"name": "D2-20(c) P(e|1)", "stated": 0.2592, "derive": lambda: T20[2][2], "tol": 1e-3},
    {"name": "D2-20(c) P_b", "stated": 0.1728, "derive": lambda: T20[2][0], "tol": 1e-3},
]


# ── binary PAM, the reversed and the bandwidth questions ───────────────────

def _folded(v0, v1, p0):
    f0 = lambda y: 2 * _gpdf(y, 0, v0) if y >= 0 else 0.0
    f1 = lambda y: 2 * _gpdf(y, 0, v1) if y >= 0 else 0.0
    lam = _root(lambda y: p0 * f0(y) - (1 - p0) * f1(y), 1e-6, 10)
    pb, e0, e1 = _pb_at(f0, f1, p0, lam, 0, np.inf)
    return lam, e0, e1, pb


def _mc_folded(seed, v0, v1, p0, lam, n=4_000_000):
    rng = np.random.default_rng(seed)
    bits = rng.random(n) >= p0
    y = np.abs(rng.normal(0, np.where(bits, math.sqrt(v1), math.sqrt(v0))))
    return float(np.mean((y > lam) != bits))


def _two_roots(m0, v0, m1, v1, p0):
    g = lambda y: p0 * _gpdf(y, m0, v0) - (1 - p0) * _gpdf(y, m1, v1)
    r1 = _root(g, -10, m0)
    r2 = _root(g, m0, m1)
    return r1, r2


def _two_root_pb(m0, v0, m1, v1, p0):
    r1, r2 = _two_roots(m0, v0, m1, v1, p0)
    e0 = _tail(m0, v0, -np.inf, r1) + _tail(m0, v0, r2, np.inf)
    e1 = _tail(m1, v1, r1, r2)
    return p0 * e0 + (1 - p0) * e1, e0, e1


F22 = _folded(1, 4, 0.5)
G24 = _gauss_case(0, 5, 4, 0.7)
G25 = _gauss_case(-2, 2, 1, 0.25)


def _prior_for(lam_target):
    return _root(lambda p0: _gauss_case(0, 3, 1, p0)[0] - lam_target, 0.51, 0.95)


def _mc_isi(seed, n=4_000_000):
    rng = np.random.default_rng(seed)
    b = rng.random(n) < 0.5
    prev = rng.random(n) < 0.5
    y = np.where(b, 1.8, -1.8) + np.where(prev, 0.6, -0.6) + rng.normal(0, 0.6, n)
    return float(np.mean((y > 0) != b))


CHECKS += [
    # D2-22
    {"name": "D2-22(b) threshold of the folded densities", "stated": 1.360, "derive": lambda: F22[0], "tol": 1e-3},
    {"name": "D2-22(c) P(e|0)", "stated": 0.1738, "derive": lambda: F22[1], "tol": 1e-3},
    {"name": "D2-22(c) P(e|1)", "stated": 0.5034, "derive": lambda: F22[2], "tol": 1e-3},
    {"name": "D2-22(c) P_b by integration", "stated": 0.3386, "derive": lambda: F22[3], "tol": 1e-3},
    {"name": "D2-22(c) P_b by Monte Carlo (4e6 trials, seed 22)", "stated": 0.3386,
     "derive": lambda: _mc_folded(22, 1, 4, 0.5, 1.3596), "tol": 5e-3},
    {"name": "D2-22 check: density value at lambda", "stated": 0.3166,
     "derive": lambda: 2 * _gpdf(F22[0], 0, 1), "tol": 1e-3},
    # D2-23
    {"name": "D2-23(b) left threshold", "stated": -3.632, "derive": lambda: _two_roots(0, 1, 3, 4, 0.6)[0], "tol": 1e-3},
    {"name": "D2-23(b) right threshold", "stated": 1.632, "derive": lambda: _two_roots(0, 1, 3, 4, 0.6)[1], "tol": 1e-3},
    {"name": "D2-23(c) P(e|0) (table rounding covered)", "stated": 0.05169, "derive": lambda: _two_root_pb(0, 1, 3, 4, 0.6)[1], "tol": 1e-2},
    {"name": "D2-23(c) P(e|1) (table rounding covered)", "stated": 0.2478, "derive": lambda: _two_root_pb(0, 1, 3, 4, 0.6)[2], "tol": 1e-2},
    {"name": "D2-23(c) P_b (table rounding covered)", "stated": 0.1301, "derive": lambda: _two_root_pb(0, 1, 3, 4, 0.6)[0], "tol": 1e-2},
    {"name": "D2-23 check: weighted density at the right root", "stated": 0.0632,
     "derive": lambda: 0.6 * _gpdf(_two_roots(0, 1, 3, 4, 0.6)[1], 0, 1), "tol": 2e-3},
    {"name": "D2-23 check: weighted density at the left root", "stated": 3.27e-4,
     "derive": lambda: 0.6 * _gpdf(_two_roots(0, 1, 3, 4, 0.6)[0], 0, 1), "tol": 5e-3},
    # D2-24
    {"name": "D2-24(b) threshold", "stated": 3.178, "derive": lambda: G24[0], "tol": 1e-3},
    {"name": "D2-24(c) Q(1.59) table value", "stated": 0.05592, "derive": lambda: _Qtab(1.59), "tol": 1e-3},
    {"name": "D2-24(c) Q(0.91) table value", "stated": 0.1814, "derive": lambda: _Qtab(0.91), "tol": 1e-3},
    {"name": "D2-24(c) P_b (table rounding covered)", "stated": 0.09356, "derive": lambda: G24[3], "tol": 2e-3},
    {"name": "D2-24 check: weighted density at lambda", "stated": 0.03951,
     "derive": lambda: 0.7 * _gpdf(G24[0], 0, 4), "tol": 1e-3},
    # D2-25
    {"name": "D2-25(b) threshold", "stated": -0.2747, "derive": lambda: G25[0], "tol": 1e-3},
    {"name": "D2-25(c) Q(1.73) table value", "stated": 0.04182, "derive": lambda: _Qtab(1.73), "tol": 1e-3},
    {"name": "D2-25(c) Q(2.27) table value", "stated": 0.01160, "derive": lambda: _Qtab(2.27), "tol": 1e-3},
    {"name": "D2-25(c) P_b (table rounding covered)", "stated": 0.01916, "derive": lambda: G25[3], "tol": 2e-3},
    {"name": "D2-25(d) P_b at lambda=0", "stated": 0.02275,
     "derive": lambda: 0.25 * _tail(-2, 1, 0, np.inf) + 0.75 * _tail(2, 1, -np.inf, 0), "tol": 1e-3},
    {"name": "D2-25(d) reduction, per cent", "stated": 16,
     "derive": lambda: 100 * (1 - G25[3] / _Qtab(2)), "tol": 3e-2},
    {"name": "D2-25 check: weighted density at lambda", "stated": 0.0225,
     "derive": lambda: 0.25 * _gpdf(G25[0], -2, 1), "tol": 2e-3},
    # D2-27
    {"name": "D2-27(a) P_b for equal priors", "stated": 0.06681, "derive": lambda: _gauss_case(0, 3, 1, 0.5)[3], "tol": 1e-3},
    {"name": "D2-27(b) prior that puts the threshold at 2", "stated": 0.8176, "derive": lambda: _prior_for(2.0), "tol": 1e-3},
    {"name": "D2-27(c) P_b at that prior", "stated": 0.04755, "derive": lambda: _gauss_case(0, 3, 1, _prior_for(2.0))[3], "tol": 1e-3},
    {"name": "D2-27(d) P_b with the threshold left at 1.5", "stated": 0.06681,
     "derive": lambda: (lambda p: p * _tail(0, 1, 1.5, np.inf) + (1 - p) * _tail(3, 1, -np.inf, 1.5))(_prior_for(2.0)), "tol": 1e-3},
    {"name": "D2-27(d) reduction, per cent", "stated": 29,
     "derive": lambda: 100 * (1 - _gauss_case(0, 3, 1, _prior_for(2.0))[3] / _Qtab(1.5)), "tol": 2e-2},
    {"name": "D2-27 check: weighted density at 2", "stated": 0.04414,
     "derive": lambda: _prior_for(2.0) * _gpdf(2, 0, 1), "tol": 1e-3},
    # D2-28
    {"name": "D2-28(a) energy of s1", "stated": 9, "derive": lambda: _energy(W28[1], 4)},
    {"name": "D2-28(a) h=1/3 on [1,2)", "stated": 1 / 3, "derive": lambda: _h_at(*W28, 1.5)},
    {"name": "D2-28(a) h=2/3 on [2,4]", "stated": 2 / 3, "derive": lambda: _h_at(*W28, 3.0)},
    {"name": "D2-28 Q(3.09) table value", "stated": 1.00e-3, "derive": lambda: _Qtab(3.09), "tol": 2e-3},
    {"name": "D2-28(c) largest N0/2, antipodal", "stated": 0.9426,
     "derive": lambda: _root(lambda v: _mf_pb(W28, v)[3] - _Qtab(3.09), 0.3, 3), "tol": 1e-3},
    {"name": "D2-28(d) largest N0/2, on-off", "stated": 0.2356,
     "derive": lambda: _root(lambda v: _gauss_case(0, 3, v, 0.5)[3] - _Qtab(3.09), 0.05, 1), "tol": 1e-3},
    {"name": "D2-28(d) loss in dB", "stated": 6.02,
     "derive": lambda: 10 * math.log10(
         _root(lambda v: _mf_pb(W28, v)[3] - _Qtab(3.09), 0.3, 3)
         / _root(lambda v: _gauss_case(0, 3, v, 0.5)[3] - _Qtab(3.09), 0.05, 1)), "tol": 1e-3},
    # D2-29
    {"name": "D2-29(a) B_T from the spectrum edge, kHz", "stated": 7.5,
     "derive": lambda: _root(lambda f: 0.5 * (1 + math.cos(math.pi * (f - 4.5) / 3)) - 1e-12, 4.6, 7.5 + 1e-9), "tol": 1e-4},
    {"name": "D2-29(a) spectrum is half height at W=6 kHz", "stated": 0.5,
     "derive": lambda: 0.5 * (1 + math.cos(math.pi * (6 - 4.5) / 3))},
    {"name": "D2-29(b) E_b", "stated": 3.0e-10, "derive": lambda: 3.6e-6 * (1 / 12000)},
    {"name": "D2-29(b) Gaussian factor", "stated": 7.979e4, "derive": lambda: _gpdf(0, 0, 2.5e-11), "tol": 1e-3},
    {"name": "D2-29(c) P_b by integration (table rounding of 3.464 covered)", "stated": 2.701e-4,
     "derive": lambda: _tail(math.sqrt(3e-10) / 5e-6, 1, -np.inf, 0), "tol": 2e-2},
    {"name": "D2-29(d) new bit rate, kb/s", "stated": 14.4, "derive": lambda: _root(lambda r: r * 1.25 / 2 - 9, 1, 40)},
    {"name": "D2-29(d) P_b by integration (table rounding of 3.162 covered)", "stated": 7.889e-4,
     "derive": lambda: _tail(math.sqrt(3.6e-6 / 14400) / 5e-6, 1, -np.inf, 0), "tol": 1e-2},
    {"name": "D2-29 check: E_b/N0 drop in dB", "stated": 0.79,
     "derive": lambda: 10 * math.log10((3.6e-6 / 12000) / (3.6e-6 / 14400)), "tol": 5e-3},
    # D2-30
    {"name": "D2-30(a) Gaussian factor 1/sqrt(2 pi 0.36)", "stated": 0.6649, "derive": lambda: _gpdf(0, 0, 0.36), "tol": 1e-3},
    {"name": "D2-30(c) P_b with interference, by integration", "stated": 0.01139,
     "derive": lambda: 0.5 * _tail(2.4, 0.36, -np.inf, 0) + 0.5 * _tail(1.2, 0.36, -np.inf, 0), "tol": 1e-3},
    {"name": "D2-30(c) P_b with interference, Monte Carlo (4e6 trials, seed 30)", "stated": 0.01139,
     "derive": lambda: _mc_isi(30), "tol": 3e-2},
    {"name": "D2-30(c) P_b without interference", "stated": 1.350e-3,
     "derive": lambda: _tail(1.8, 0.36, -np.inf, 0), "tol": 1e-3},
    {"name": "D2-30(c) ratio", "stated": 8.4,
     "derive": lambda: (0.5 * _tail(2.4, 0.36, -np.inf, 0) + 0.5 * _tail(1.2, 0.36, -np.inf, 0)) / _tail(1.8, 0.36, -np.inf, 0), "tol": 1e-2},
    {"name": "D2-30 check: the bad pattern alone", "stated": 0.01138,
     "derive": lambda: 0.5 * _tail(1.2, 0.36, -np.inf, 0), "tol": 1e-3},
]


# Intermediate numbers the solutions state along the way.
CHECKS += [
    {"name": "D2-22(b) lambda squared", "stated": 1.848, "derive": lambda: F22[0] ** 2, "tol": 1e-3},
    {"name": "D2-23(b) constant term 9+8ln3 over 3", "stated": 5.930,
     "derive": lambda: -_two_roots(0, 1, 3, 4, 0.6)[0] * _two_roots(0, 1, 3, 4, 0.6)[1], "tol": 1e-3},
    {"name": "D2-23(b) half-distance of the roots", "stated": 2.632,
     "derive": lambda: 0.5 * (_two_roots(0, 1, 3, 4, 0.6)[1] - _two_roots(0, 1, 3, 4, 0.6)[0]), "tol": 1e-3},
    {"name": "D2-24(b) 10 lambda", "stated": 31.78, "derive": lambda: 10 * G24[0], "tol": 1e-3},
    {"name": "D2-27(b) ratio p0/p1", "stated": 4.482,
     "derive": lambda: _prior_for(2.0) / (1 - _prior_for(2.0)), "tol": 1e-3},
    {"name": "D2-19 each weighted error at the optimum", "stated": 0.009957,
     "derive": lambda: 0.8 * L19[3][1], "tol": 1e-3},
    {"name": "D2-12(c) 3 lambda", "stated": 9.4055, "derive": lambda: 3 * _mf_pb(W12, 1, 0.6)[0], "tol": 1e-4},
    {"name": "D2-17 check: P_b(4) from the error curve", "stated": 0.2247,
     "derive": lambda: _pb_at(lambda y: 0.1 * math.exp(-abs(y) / 5), lambda y: 0.1 * math.exp(-abs(y - 8) / 5),
                              0.5, 4, points=[0, 8])[0], "tol": 1e-3},
    {"name": "D2-14 check: P_b(1) from the error curve", "stated": 0.2074,
     "derive": lambda: _pb_at(lambda y: 0.25 * math.exp(-abs(y + 2) / 2), lambda y: 0.25 * math.exp(-abs(y - 2) / 2),
                              0.5, 1, points=[-2, 2])[0], "tol": 1e-3},
    {"name": "D2-16(c) ratio of part (a) to part (c)", "stated": 4.5, "derive": lambda: T16[0][0] / T16[2][0], "tol": 1e-3},
    {"name": "D2-20 check: area under the smaller weighted density, left part", "stated": 0.10368,
     "derive": lambda: integrate.quad(lambda y: min(0.6 * _tri(5)(y), 0.4 * _tri(5)(y - 4)), -1, 2.6, points=[0])[0], "tol": 1e-3},
]

# ── the three textbook-shaped questions ────────────────────────────────────

# D2-11: a filter that is not matched, or a sample at the wrong time. The
# filter outputs are numerical convolution integrals on a fine grid, and the
# best instant is found by scanning the output, not from its pieces.

S11 = _pw([(0, 2, 2), (2, 3, -1)])
H11 = _pw([(0, 1, -1), (1, 3, 2)])                    # s(3 - t), as the solution states
H11b = _pw([(0, 2, 1)])
N0H_11 = 0.5
TAU = (np.arange(int(round(10 / DT))) + 0.5) * DT - 2.0   # midpoints on [-2, 8]


def _out(s, h, t0):
    """Signal part of the filter output at t0: the convolution integral."""
    return float(np.sum(s(TAU) * h(t0 - TAU)) * DT)


def _nvar(h):
    return N0H_11 * float(np.sum(h(TAU) ** 2) * DT)


def _best11():
    ts = np.arange(0, 6, 0.01)
    z = np.array([_out(S11, H11b, t) for t in ts])
    k = int(np.argmax(np.abs(z)))
    return ts[k], z[k]


def _eta(s, h, t0):
    return _out(s, h, t0) ** 2 / _nvar(h)


def _db(x):
    return 10 * math.log10(x)


# D2-21: a binary decision on a Poisson count. The rules are found by testing
# every count against the weighted probabilities; the errors come from the
# Poisson distribution functions of scipy and a seeded Monte Carlo run.

M0_21, M1_21 = 2, 8


def _logpmf(m, k):
    return -m + k * math.log(m) - special.gammaln(k + 1)


def _first_one(p1):
    """Smallest count decided as 1 when 1 has prior p1."""
    return next(k for k in range(60) if p1 * stats.poisson.pmf(k, M1_21) > (1 - p1) * stats.poisson.pmf(k, M0_21))


def _cross21(p1):
    """The real crossing point of the weighted log-probabilities, k as a real number."""
    return _root(lambda k: math.log(p1) + _logpmf(M1_21, k) - math.log(1 - p1) - _logpmf(M0_21, k), 0.5, 20)


def _rule_pb(kmin, p1):
    e0 = stats.poisson.sf(kmin - 1, M0_21)
    e1 = stats.poisson.cdf(kmin - 1, M1_21)
    return (1 - p1) * e0 + p1 * e1, e0, e1


def _mc21(seed, kmin, p1, n=4_000_000):
    rng = np.random.default_rng(seed)
    bits = rng.random(n) < p1
    z = rng.poisson(np.where(bits, M1_21, M0_21))
    return float(np.mean((z >= kmin) != bits))


# D2-26: sinc(at)sinc(bt). The spectrum is a numerical Fourier integral of the
# pulse itself; the design is found by driving the samples s(kT_b) to zero.

TT = (np.arange(-500_000, 500_000) + 0.5) * 1e-6        # t on [-0.5, 0.5] s


def _sinc2(a, b, t):
    return np.sinc(a * t) * np.sinc(b * t)          # numpy's sinc is sin(pi x)/(pi x)


def _S26(f, a=4000, b=1000):
    """S(f) in seconds, as the cosine integral of the even pulse."""
    return float(np.sum(_sinc2(a, b, TT) * np.cos(2 * np.pi * f * TT)) * 1e-6)


def _fold26(f, R):
    return sum(_S26(f - n * R) for n in range(-3, 4))


def _design26(R, B=2500):
    """a that zeroes s(kT_b) for k = 1..20 with the band edge (a+b)/2 = B."""
    k = np.arange(1, 21)
    cost = lambda a: float(np.sum(_sinc2(a, 2 * B - a, k / R) ** 2))
    return optimize.minimize_scalar(cost, bounds=(B, 2 * B - 1), method="bounded",
                                    options={"xatol": 1e-6}).x


def _trap_area(a=4000, b=1000, df=1.0):
    """Area of S(f) from a numerical convolution of the two rectangles."""
    fa = np.arange(-a / 2, a / 2, df) + df / 2
    fb = np.arange(-b / 2, b / 2, df) + df / 2
    S = np.convolve(np.ones(len(fa)) / a, np.ones(len(fb)) / b) * df
    return float(np.sum(S) * df), float(S.max())


CHECKS += [
    # D2-11
    {"name": "D2-11(a) energy of s", "stated": 9, "derive": lambda: _energy(S11, 3)},
    {"name": "D2-11(a) h(t)=s(3-t) is -1 at t=0.5", "stated": -1, "derive": lambda: float(S11(np.array([2.5]))[0])},
    {"name": "D2-11(a) h(t)=s(3-t) is 2 at t=2", "stated": 2, "derive": lambda: float(S11(np.array([1.0]))[0])},
    {"name": "D2-11(a) y_s(3) by convolution", "stated": 9, "derive": lambda: _out(S11, H11, 3.0), "tol": 1e-3},
    {"name": "D2-11(a) noise variance", "stated": 4.5, "derive": lambda: _nvar(H11), "tol": 1e-3},
    {"name": "D2-11(a) eta at T", "stated": 18, "derive": lambda: _eta(S11, H11, 3.0), "tol": 1e-3},
    {"name": "D2-11(a) bound 2E/N0 in dB", "stated": 12.55, "derive": lambda: _db(2 * _energy(S11, 3) / 1.0), "tol": 1e-3},
    {"name": "D2-11(b) y_s(2.5) by convolution", "stated": 5.5, "derive": lambda: _out(S11, H11, 2.5), "tol": 1e-3},
    {"name": "D2-11(b) eta at 2.5 s", "stated": 6.722, "derive": lambda: _eta(S11, H11, 2.5), "tol": 1e-3},
    {"name": "D2-11(c) best instant of h2 by scanning |z_s|", "stated": 2, "derive": lambda: _best11()[0], "tol": 1e-3},
    {"name": "D2-11(c) z_s at the best instant", "stated": 4, "derive": lambda: _best11()[1], "tol": 1e-3},
    {"name": "D2-11(c) z_s(2.5) on the piece 10-3t", "stated": 2.5, "derive": lambda: _out(S11, H11b, 2.5), "tol": 1e-3},
    {"name": "D2-11(c) z_s(3.5) on the piece 7-2t", "stated": 0, "derive": lambda: _out(S11, H11b, 3.5), "tol": 1e-3},
    {"name": "D2-11(c) z_s(4) on the piece t-5", "stated": -1, "derive": lambda: _out(S11, H11b, 4.0), "tol": 1e-3},
    {"name": "D2-11(c) noise variance of h2", "stated": 1, "derive": lambda: _nvar(H11b), "tol": 1e-3},
    {"name": "D2-11(c) eta of h2 at 2 s", "stated": 16, "derive": lambda: _eta(S11, H11b, 2.0), "tol": 1e-3},
    {"name": "D2-11(d) ratio 18/6.722", "stated": 2.678, "derive": lambda: _eta(S11, H11, 3.0) / _eta(S11, H11, 2.5), "tol": 1e-3},
    {"name": "D2-11(d) loss of the early sample, dB", "stated": 4.28,
     "derive": lambda: _db(_eta(S11, H11, 3.0) / _eta(S11, H11, 2.5)), "tol": 2e-3},
    {"name": "D2-11(d) loss of h2 at its best instant, dB", "stated": 0.51,
     "derive": lambda: _db(_eta(S11, H11, 3.0) / _eta(S11, H11b, 2.0)), "tol": 1e-2},
    {"name": "D2-11 check: y_s(2)", "stated": 2, "derive": lambda: _out(S11, H11, 2.0), "tol": 1e-3},
    {"name": "D2-11 err: z_s(3)", "stated": 1, "derive": lambda: _out(S11, H11b, 3.0), "tol": 1e-3},
    {"name": "D2-11 err: eta of h2 sampled at T", "stated": 1, "derive": lambda: _eta(S11, H11b, 3.0), "tol": 1e-3},
    {"name": "D2-11 err: loss of h2 sampled at T, dB", "stated": 12.55,
     "derive": lambda: _db(_eta(S11, H11, 3.0) / _eta(S11, H11b, 3.0)), "tol": 1e-3},
    # D2-21
    {"name": "D2-21(a) crossing point for equal priors", "stated": 4.328, "derive": lambda: _cross21(0.5), "tol": 1e-3},
    {"name": "D2-21(a) ln 4", "stated": 1.3863, "derive": lambda: math.log(M1_21 / M0_21), "tol": 1e-4},
    {"name": "D2-21(a) smallest count decided as 1", "stated": 5, "derive": lambda: _first_one(0.5), "tol": 1e-9},
    {"name": "D2-21(b) P(Z<=4 | 0)", "stated": 0.94735, "derive": lambda: stats.poisson.cdf(4, M0_21), "tol": 1e-4},
    {"name": "D2-21(b) P(e|0)", "stated": 0.05265, "derive": lambda: _rule_pb(5, 0.5)[1], "tol": 1e-3},
    {"name": "D2-21(b) P(Z<=4 | 1) / e^-8", "stated": 297, "derive": lambda: stats.poisson.cdf(4, M1_21) / math.exp(-8), "tol": 1e-6},
    {"name": "D2-21(b) P(e|1)", "stated": 0.09963, "derive": lambda: _rule_pb(5, 0.5)[2], "tol": 1e-3},
    {"name": "D2-21(c) crossing point for p1=0.2", "stated": 5.328, "derive": lambda: _cross21(0.2), "tol": 1e-3},
    {"name": "D2-21(c) smallest count decided as 1", "stated": 6, "derive": lambda: _first_one(0.2), "tol": 1e-9},
    {"name": "D2-21(d) 2^5/120", "stated": 0.26667, "derive": lambda: stats.poisson.pmf(5, 2) / math.exp(-2), "tol": 1e-4},
    {"name": "D2-21(d) 8^5/120", "stated": 273.07, "derive": lambda: stats.poisson.pmf(5, 8) / math.exp(-8), "tol": 1e-4},
    {"name": "D2-21(d) P(Z=5|0)", "stated": 0.03609, "derive": lambda: stats.poisson.pmf(5, 2), "tol": 1e-3},
    {"name": "D2-21(d) P(Z=5|1)", "stated": 0.09160, "derive": lambda: stats.poisson.pmf(5, 8), "tol": 1e-3},
    {"name": "D2-21(d) P(e|0)", "stated": 0.01656, "derive": lambda: _rule_pb(6, 0.2)[1], "tol": 1e-3},
    {"name": "D2-21(d) P(e|1)", "stated": 0.19124, "derive": lambda: _rule_pb(6, 0.2)[2], "tol": 1e-3},
    {"name": "D2-21(d) P_b of the rule for p1=0.2", "stated": 0.05150, "derive": lambda: _rule_pb(6, 0.2)[0], "tol": 1e-3},
    {"name": "D2-21(d) P_b of the rule for p1=0.2, Monte Carlo (4e6 trials, seed 21)", "stated": 0.05150,
     "derive": lambda: _mc21(21, 6, 0.2), "tol": 1e-2},
    {"name": "D2-21(d) P_b of the equal-prior rule at p1=0.2", "stated": 0.06205, "derive": lambda: _rule_pb(5, 0.2)[0], "tol": 1e-3},
    {"name": "D2-21(d) reduction, per cent", "stated": 17,
     "derive": lambda: 100 * (1 - _rule_pb(6, 0.2)[0] / _rule_pb(5, 0.2)[0]), "tol": 2e-2},
    {"name": "D2-21 check: 0.8 P(Z=5|0)", "stated": 0.02887, "derive": lambda: 0.8 * stats.poisson.pmf(5, 2), "tol": 1e-3},
    {"name": "D2-21 check: 0.2 P(Z=5|1)", "stated": 0.01832, "derive": lambda: 0.2 * stats.poisson.pmf(5, 8), "tol": 1e-3},
    {"name": "D2-21 check: P(Z=6|0)", "stated": 0.01203, "derive": lambda: stats.poisson.pmf(6, 2), "tol": 1e-3},
    {"name": "D2-21 check: P(Z=6|1)", "stated": 0.12214, "derive": lambda: stats.poisson.pmf(6, 8), "tol": 1e-3},
    {"name": "D2-21 check: 0.8 P(Z=6|0)", "stated": 0.00962, "derive": lambda: 0.8 * stats.poisson.pmf(6, 2), "tol": 1e-3},
    {"name": "D2-21 check: 0.2 P(Z=6|1)", "stated": 0.02443, "derive": lambda: 0.2 * stats.poisson.pmf(6, 8), "tol": 1e-3},
    # D2-26
    {"name": "D2-26(a) S(0) = 1/a, ms", "stated": 0.25, "derive": lambda: 1e3 * _S26(0), "tol": 2e-3},
    {"name": "D2-26(a) flat top still at full height at 1.4 kHz, ms", "stated": 0.25, "derive": lambda: 1e3 * _S26(1400), "tol": 2e-3},
    {"name": "D2-26(a) half height 1/(2a) at f=a/2=2 kHz, ms", "stated": 0.125, "derive": lambda: 1e3 * _S26(2000), "tol": 4e-3},
    {"name": "D2-26(a) zero at the band edge 2.5 kHz (absolute, ms)", "stated": 0,
     "derive": lambda: 1e3 * _S26(2600), "tol": 2e-3},
    {"name": "D2-26(b) a from zeroing s(kT_b) at 4 kb/s", "stated": 4000, "derive": lambda: _design26(4000), "tol": 1e-4},
    {"name": "D2-26(b) b = 2B - a", "stated": 1000, "derive": lambda: 5000 - _design26(4000), "tol": 1e-3},
    {"name": "D2-26(b) copies add to T_b at 4 kb/s, f=1.8 kHz, ms", "stated": 0.25, "derive": lambda: 1e3 * _fold26(1800, 4000), "tol": 3e-3},
    {"name": "D2-26(c) copies add to T_b at 2 kb/s, f=0.7 kHz, ms", "stated": 0.5, "derive": lambda: 1e3 * _fold26(700, 2000), "tol": 3e-3},
    {"name": "D2-26(c) largest |s(kT_b)| at 2 kb/s, k=1..40", "stated": 0,
     "derive": lambda: float(np.max(np.abs(_sinc2(4000, 1000, np.arange(1, 41) / 2000)))), "tol": 1e-12},
    {"name": "D2-26(c) sum of copies at 5 kb/s, f=0, ms", "stated": 0.25, "derive": lambda: 1e3 * _fold26(0, 5000), "tol": 2e-3},
    {"name": "D2-26(c) sum of copies at 5 kb/s, f=2.5 kHz (absolute, ms)", "stated": 0,
     "derive": lambda: 1e3 * _fold26(2500, 5000), "tol": 3e-3},
    {"name": "D2-26(c) sinc(0.8)", "stated": 0.2339, "derive": lambda: float(np.sinc(0.8)), "tol": 1e-3},
    {"name": "D2-26(c) sinc(0.2)", "stated": 0.9355, "derive": lambda: float(np.sinc(0.2)), "tol": 1e-3},
    {"name": "D2-26(c) s(T_b) at 5 kb/s", "stated": 0.2188, "derive": lambda: float(_sinc2(4000, 1000, 1 / 5000)), "tol": 1e-3},
    {"name": "D2-26(d) alpha at 4 kb/s", "stated": 0.25, "derive": lambda: (2500 - 2000) / 2000},
    {"name": "D2-26(d) a at 4.5 kb/s", "stated": 4500, "derive": lambda: _design26(4500), "tol": 1e-4},
    {"name": "D2-26(d) b at 4.5 kb/s", "stated": 500, "derive": lambda: 5000 - _design26(4500), "tol": 2e-3},
    {"name": "D2-26(d) alpha at 4.5 kb/s", "stated": 0.111, "derive": lambda: (2500 - 4500 / 2) / (4500 / 2), "tol": 2e-3},
    {"name": "D2-26 check: area under S(f) = s(0)", "stated": 1, "derive": lambda: _trap_area()[0], "tol": 1e-4},
    {"name": "D2-26 check: height of the numerical trapezoid, ms", "stated": 0.25, "derive": lambda: 1e3 * _trap_area()[1], "tol": 1e-3},
]


# Every Q value a solution reads from the table, integrated from the density.
for _x, _q in [(3.00, 1.350e-3), (2.25, 0.01222), (1.50, 0.06681), (2.00, 0.02275), (2.40, 8.198e-3),
               (1.75, 0.04006), (2.50, 6.210e-3), (1.80, 0.03593), (1.25, 0.1056),
               (1.36, 0.08691), (0.68, 0.2483), (1.63, 0.05155), (3.63, 1.42e-4), (3.32, 4.50e-4),
               (1.00, 0.1587), (3.46, 2.701e-4), (3.16, 7.889e-4),
               (4.00, 3.167e-5)]:
    CHECKS.append({"name": f"table value Q({_x:.2f})", "stated": _q,
                   "derive": (lambda x=_x: _Qtab(x)), "tol": 5e-4 if _q > 1e-3 else 4e-3})


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
        if stated == 0:                               # a stated zero is compared absolutely
            ok = abs(got) <= tol
            rel = abs(got)
        else:
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
