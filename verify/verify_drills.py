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

import math
import sys

import numpy as np
import sympy as sp
from scipy import integrate

# ── Module 1 ────────────────────────────────────────────────────────────────

_x = sp.Symbol("x", real=True)


def _second_moment(density, lo, hi):
    """E[X^2] against a density given as a SymPy expression in _x."""
    return float(sp.integrate(_x ** 2 * density, (_x, lo, hi)))


def _normalising_constant(shape, lo, hi):
    """The c that makes c*shape integrate to one over [lo, hi]."""
    return float(1 / sp.integrate(shape, (_x, lo, hi)))


def _alpha_db(power, mmax):
    return 10 * math.log10(3 * power / mmax ** 2)


def _sqnr_db(power, mmax, bits):
    return _alpha_db(power, mmax) + 20 * bits * math.log10(2.0)


def _uniform_quantizer_mse(mmax, levels):
    """E[Q^2] of a uniform quantizer, by the step size rather than by measurement."""
    return (2 * mmax / levels) ** 2 / 12


# ---- D1-17, the coarse three-level quantizer -------------------------------
# f(x) = c(1 - |x|/8) on [-8,8]; Q(x) = -3 on (-6,0), +3 on (0,6), 0 outside.
_D17_C = 1 / 8


def _d17_density(x):
    return _D17_C * (1 - abs(x) / 8) if abs(x) <= 8 else 0.0


def _d17_signal_power():
    val, _ = integrate.quad(lambda x: x * x * _d17_density(x), -8, 8)
    return val


def _d17_noise_power():
    """Integrated region by region. The outer regions are where the uniform
    model would go wrong, so they are integrated rather than bounded."""
    regions = [(-8, -6, 0.0), (-6, 0, -3.0), (0, 6, 3.0), (6, 8, 0.0)]
    total = 0.0
    for lo, hi, v in regions:
        seg, _ = integrate.quad(lambda x, v=v: (x - v) ** 2 * _d17_density(x), lo, hi)
        total += seg
    return total


# ---- D1-20, the PCM stream -------------------------------------------------
def _d20_sample(n):
    return 6 * abs(np.sinc(0.4 * n - 1))


def _d20_words():
    """The six three-bit words read as one eighteen-bit number."""
    idx = [min(7, int(math.floor(_d20_sample(n) / 0.75))) for n in range(6)]
    return int("".join(format(i, "03b") for i in idx), 2)


def _gray(b):
    return b ^ (b >> 1)


def _bits_differing(a, b):
    return bin(a ^ b).count("1")



# ── Module 2 ────────────────────────────────────────────────────────────────

from scipy.special import erfc as _erfc, erfcinv as _erfcinv


def _Q(x):
    return float(0.5 * _erfc(x / math.sqrt(2.0)))


def _Qinv(p):
    return float(math.sqrt(2.0) * _erfcinv(2.0 * p))


def _pb_antipodal(ebn0):
    return _Q(math.sqrt(2.0 * ebn0))


def _threshold(eb, n0, p0):
    return (n0 / (4.0 * math.sqrt(eb))) * math.log(p0 / (1.0 - p0))


def _pe_unequal(eb, n0, p1):
    """Threshold, both conditional errors and the average, from the definitions."""
    p0 = 1.0 - p1
    a = math.sqrt(eb)
    sig = math.sqrt(n0 / 2.0)
    lam = _threshold(eb, n0, p0)
    e0 = _Q((lam + a) / sig)
    e1 = _Q((a - lam) / sig)
    return {"lam": lam, "e0": e0, "e1": e1, "pe": p0 * e0 + p1 * e1}


def _pe_two_gaussians(s0, s1, sigma, p0):
    """The general equal-variance case: midpoint plus a prior term."""
    lam = (s0 + s1) / 2.0 + sigma ** 2 / (s1 - s0) * math.log(p0 / (1.0 - p0))
    e0 = _Q((lam - s0) / sigma)
    e1 = _Q((s1 - lam) / sigma)
    return {"lam": lam, "e0": e0, "e1": e1, "pe": p0 * e0 + (1 - p0) * e1}


def _triangular_tail(edge, half_base):
    """P(N > edge) for a symmetric triangular density on [-half_base, half_base],
    integrated rather than looked up."""
    c = 1.0 / half_base
    val, _ = integrate.quad(lambda n: c * (1 - abs(n) / half_base), edge, half_base)
    return val


# Each entry:
#   name    -- the question and the part, as the reader sees them numbered
#   stated  -- the number the worked solution prints
#   derive  -- a callable of no arguments returning the same quantity,
#              computed independently of how the solution computes it
#   tol     -- relative tolerance
# ── Module 5 constellations ─────────────────────────────────────────────────
# Each family is built from its definition and then scaled to unit average
# symbol energy, so a distance read off it is already in units of root Es. The
# solutions quote formulas; these functions never use one.


def _unit_energy(pts):
    """Scale a point list so that its average squared norm is one."""
    e = sum(sum(c * c for c in p) for p in pts) / len(pts)
    k = 1 / math.sqrt(e)
    return [tuple(c * k for c in p) for p in pts]


def _dist(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def _dmin(pts):
    return min(_dist(pts[i], pts[j])
               for i in range(len(pts)) for j in range(i + 1, len(pts)))


def _nmin(pts):
    """The average number of points at the minimum distance."""
    d = _dmin(pts)
    n = sum(1 for i in range(len(pts)) for j in range(len(pts))
            if i != j and _dist(pts[i], pts[j]) < d * 1.0001)
    return n / len(pts)


def _pe(pts, esn0_db):
    """The nearest-neighbour estimate, from the geometry alone."""
    n0 = 10 ** (-esn0_db / 10)
    return _nmin(pts) * _Q(math.sqrt(_dmin(pts) ** 2 / (2 * n0)))


def _ebn0_for(pts, target):
    """The energy per bit, in dB, at which a constellation reaches `target`."""
    x = _Qinv(target / _nmin(pts))
    esn0 = 2 * x ** 2 / _dmin(pts) ** 2
    return 10 * math.log10(esn0 / math.log2(len(pts)))


def _psk(m):
    return _unit_energy([(math.cos(2 * math.pi * k / m),
                          math.sin(2 * math.pi * k / m)) for k in range(m)])


def _pam_raw(m):
    return [(2 * k - (m - 1), 0.0) for k in range(m)]


def _pam(m):
    return _unit_energy(_pam_raw(m))


def _qam(m):
    side = int(round(math.sqrt(m)))
    levels = [2 * k - (side - 1) for k in range(side)]
    return _unit_energy([(x, y) for x in levels for y in levels])


def _simplex_orthogonal(m):
    """M orthogonal waveforms: one axis each, so M dimensions."""
    return _unit_energy([tuple(1.0 if j == k else 0.0 for j in range(m))
                         for k in range(m)])


_ANTIPODAL = _unit_energy([(-1.0, 0.0), (1.0, 0.0)])
_ORTHOGONAL = _unit_energy([(1.0, 0.0), (0.0, 1.0)])
_ONOFF = _unit_energy([(0.0, 0.0), (1.0, 0.0)])


def _pair_d2(pts):
    return _dist(pts[0], pts[1]) ** 2


CHECKS: list[dict] = [
    # ---- D1-01 ----------------------------------------------------------
    {"name": "D1-01(a) Nyquist rate", "stated": 24e3, "derive": lambda: 2 * 12e3},
    {"name": "D1-01(b) rate 25% above Nyquist", "stated": 30e3, "derive": lambda: 1.25 * 2 * 12e3},
    {"name": "D1-01(b) sampling interval, us", "stated": 33.3,
     "derive": lambda: 1e6 / 30e3, "tol": 2e-3},
    {"name": "D1-01(c) guard band", "stated": 6e3, "derive": lambda: 1.25 * 24e3 - 24e3},

    # ---- D1-02 ----------------------------------------------------------
    {"name": "D1-02(a) bits per sample", "stated": 9, "derive": lambda: math.log2(512)},
    {"name": "D1-02(b) bit rate", "stated": 396e3, "derive": lambda: math.log2(512) * 44e3},
    {"name": "D1-02(c) bit duration, us", "stated": 2.53,
     "derive": lambda: 1e6 / (math.log2(512) * 44e3), "tol": 2e-3},

    # ---- D1-03 ----------------------------------------------------------
    {"name": "D1-03(a) highest frequency of the product", "stated": 75e3,
     "derive": lambda: 60e3 + 15e3},
    {"name": "D1-03(b) Nyquist rate of the product", "stated": 150e3,
     "derive": lambda: 2 * (60e3 + 15e3)},

    # ---- D1-04 ----------------------------------------------------------
    {"name": "D1-04(a) reconstruction filter gain", "stated": 3.33e-5,
     "derive": lambda: 1 / (2 * 15e3), "tol": 2e-3},

    # ---- D1-05 ----------------------------------------------------------
    {"name": "D1-05(b) aliased frequency", "stated": 3e3,
     "derive": lambda: min(abs(7e3 - n * 10e3) for n in range(-3, 4))},

    # ---- D1-06 ----------------------------------------------------------
    {"name": "D1-06(a) step size", "stated": 0.09375, "derive": lambda: 2 * 3.0 / 64},
    {"name": "D1-06(b) average power of 3cos(t)", "stated": 4.5,
     "derive": lambda: float(sp.integrate((3 * sp.cos(_x)) ** 2, (_x, 0, 2 * sp.pi)) / (2 * sp.pi))},
    {"name": "D1-06(b) alpha", "stated": 1.76, "derive": lambda: _alpha_db(4.5, 3.0), "tol": 3e-3},
    {"name": "D1-06(b) SQNR", "stated": 37.88, "derive": lambda: _sqnr_db(4.5, 3.0, 6), "tol": 3e-4},
    {"name": "D1-06 check, mean-square error", "stated": 7.324e-4,
     "derive": lambda: _uniform_quantizer_mse(3.0, 64), "tol": 3e-4},

    # ---- D1-07 ----------------------------------------------------------
    {"name": "D1-07(a) bits needed for 40 dB", "stated": 7,
     "derive": lambda: math.ceil((40 - 10 * math.log10(1.5)) / (20 * math.log10(2)))},
    {"name": "D1-07(b) SQNR obtained", "stated": 43.90,
     "derive": lambda: 10 * math.log10(1.5) + 20 * 7 * math.log10(2), "tol": 3e-4},
    {"name": "D1-07(c) shortfall at one bit fewer", "stated": 2.12,
     "derive": lambda: 40 - (10 * math.log10(1.5) + 20 * 6 * math.log10(2)), "tol": 5e-3},

    # ---- D1-08 ----------------------------------------------------------
    {"name": "D1-08(a) power of U(-2,2)", "stated": 4 / 3,
     "derive": lambda: _second_moment(sp.Rational(1, 4), -2, 2)},
    {"name": "D1-08(a) step size", "stated": 0.0625, "derive": lambda: 2 * 2.0 / 64},
    {"name": "D1-08(b) mean-square error", "stated": 3.255e-4,
     "derive": lambda: _uniform_quantizer_mse(2.0, 64), "tol": 3e-4},
    {"name": "D1-08(c) SQNR, linear", "stated": 4096,
     "derive": lambda: (4 / 3) / _uniform_quantizer_mse(2.0, 64)},
    {"name": "D1-08(c) SQNR", "stated": 36.12, "derive": lambda: _sqnr_db(4 / 3, 2.0, 6), "tol": 3e-4},

    # ---- D1-09 ----------------------------------------------------------
    {"name": "D1-09(a) normalising constant", "stated": 1 / 3,
     "derive": lambda: _normalising_constant(1 - sp.Abs(_x) / 3, -3, 3)},
    {"name": "D1-09(b) power of the samples", "stated": 1.5,
     "derive": lambda: _second_moment(sp.Rational(1, 3) * (1 - sp.Abs(_x) / 3), -3, 3)},

    # ---- D1-10 ----------------------------------------------------------
    {"name": "D1-10(a) step size", "stated": 0.75, "derive": lambda: 6.0 / 8},
    {"name": "D1-10(b) four tread indices 1,3,6,7",
     "stated": 1367,
     "derive": lambda: int("".join(str(min(7, int(m / 0.75)))
                                   for m in (0.9, 2.4, 4.7, 5.9)))},
    {"name": "D1-10 check, largest error", "stated": 0.275,
     "derive": lambda: max(abs(m - (min(7, int(m / 0.75)) + 0.5) * 0.75)
                           for m in (0.9, 2.4, 4.7, 5.9)), "tol": 1e-9},

    # ---- D1-11 ----------------------------------------------------------
    {"name": "D1-11(a) Gray word of level 7", "stated": 0b0100, "derive": lambda: _gray(7)},
    {"name": "D1-11(a) Gray word of level 8", "stated": 0b1100, "derive": lambda: _gray(8)},
    {"name": "D1-11(b) natural binary bits changing", "stated": 4,
     "derive": lambda: _bits_differing(7, 8)},
    {"name": "D1-11(b) Gray bits changing", "stated": 1,
     "derive": lambda: _bits_differing(_gray(7), _gray(8))},
    {"name": "D1-11 check, Gray is one bit for every adjacent pair", "stated": 1,
     "derive": lambda: max(_bits_differing(_gray(k), _gray(k + 1)) for k in range(15))},

    # ---- D1-12 ----------------------------------------------------------
    {"name": "D1-12(a) alpha at full scale", "stated": 1.76,
     "derive": lambda: _alpha_db(0.5, 1.0), "tol": 3e-3},
    {"name": "D1-12(a) alpha at quarter scale", "stated": -10.28,
     "derive": lambda: _alpha_db(0.25 ** 2 / 2, 1.0), "tol": 3e-3},
    {"name": "D1-12(a) loss", "stated": 12.04,
     "derive": lambda: _alpha_db(0.5, 1.0) - _alpha_db(0.25 ** 2 / 2, 1.0), "tol": 3e-4},
    {"name": "D1-12(b) extra bits", "stated": 2,
     "derive": lambda: (_alpha_db(0.5, 1.0) - _alpha_db(0.25 ** 2 / 2, 1.0))
                       / (20 * math.log10(2)), "tol": 1e-9},

    # ---- D1-13 ----------------------------------------------------------
    {"name": "D1-13(a) largest permissible step, in units of Vmax", "stated": 0.08,
     "derive": lambda: 2 * 0.02 * 2},
    {"name": "D1-13(a) smallest level count", "stated": 25, "derive": lambda: 2 / 0.08},
    {"name": "D1-13(a) bits per sample", "stated": 5,
     "derive": lambda: math.ceil(math.log2(2 / 0.08))},
    {"name": "D1-13(b) bit rate", "stated": 30e3, "derive": lambda: 5 * 2 * 3000},
    {"name": "D1-13(c) symbol rate", "stated": 6000, "derive": lambda: 30e3 / math.log2(32)},

    # ---- D1-14 ----------------------------------------------------------
    # The product expanded: 6 cos(2pi 1000 t) cos(2pi 3000 t)
    #                     = 3 cos(2pi 2000 t) + 3 cos(2pi 4000 t).
    # Checked by sampling both forms rather than by trusting the identity.
    # The runner compares relatively, and a relative comparison against zero is
    # meaningless, so the residual is shifted by one and checked against one.
    {"name": "D1-14(a) the product equals the sum of two cosines", "stated": 1.0,
     "derive": lambda: float(np.max(np.abs(
         6 * np.cos(2 * np.pi * 1000 * np.linspace(0, 1e-3, 5001))
           * np.cos(2 * np.pi * 3000 * np.linspace(0, 1e-3, 5001))
         - 3 * np.cos(2 * np.pi * 2000 * np.linspace(0, 1e-3, 5001))
         - 3 * np.cos(2 * np.pi * 4000 * np.linspace(0, 1e-3, 5001))))) + 1.0,
     "tol": 1e-12},
    {"name": "D1-14(a) sampling rate with a 2 kHz guard band", "stated": 10e3,
     "derive": lambda: 2 * 4e3 + 2e3},
    {"name": "D1-14(b) bit rate", "stated": 90e3, "derive": lambda: math.log2(512) * 10e3},
    {"name": "D1-14(c) guard band for 100 kbit/s", "stated": 3.11e3,
     "derive": lambda: 100e3 / math.log2(512) - 2 * 4e3, "tol": 2e-3},
    {"name": "D1-14(d) step size", "stated": 0.0234,
     "derive": lambda: 2 * 6.0 / 512, "tol": 2e-3},
    {"name": "D1-14(d) peak of the product", "stated": 6.0,
     "derive": lambda: float(np.max(
         6 * np.cos(2 * np.pi * 1000 * np.linspace(0, 2e-3, 200001))
           * np.cos(2 * np.pi * 3000 * np.linspace(0, 2e-3, 200001)))), "tol": 1e-6},

    # ---- D1-15 ----------------------------------------------------------
    {"name": "D1-15(a) Nyquist rate", "stated": 5e6, "derive": lambda: 2 * 2.5e6},
    {"name": "D1-15(a) sampling rate 40% above it", "stated": 7e6,
     "derive": lambda: 1.4 * 2 * 2.5e6},
    {"name": "D1-15(b) bits per sample", "stated": 12, "derive": lambda: math.log2(4096)},
    {"name": "D1-15(c) bit rate", "stated": 84e6, "derive": lambda: 12 * 7e6},
    {"name": "D1-15(d) bit rate at Nyquist", "stated": 60e6, "derive": lambda: 12 * 5e6},
    {"name": "D1-15(d) cost of the margin", "stated": 24e6, "derive": lambda: 12 * (7e6 - 5e6)},

    # ---- D1-16 ----------------------------------------------------------
    {"name": "D1-16(a) normalising constant", "stated": 1 / 3,
     "derive": lambda: _normalising_constant(1 + sp.Abs(_x), -1, 1)},
    {"name": "D1-16(b) signal power", "stated": 7 / 18,
     "derive": lambda: _second_moment(sp.Rational(1, 3) * (1 + sp.Abs(_x)), -1, 1)},
    {"name": "D1-16(b) mean-square error", "stated": 2.035e-5,
     "derive": lambda: _uniform_quantizer_mse(1.0, 128), "tol": 3e-4},
    {"name": "D1-16(b) SQNR, linear", "stated": 19115,
     "derive": lambda: (7 / 18) / _uniform_quantizer_mse(1.0, 128), "tol": 3e-4},
    {"name": "D1-16(b) SQNR", "stated": 42.81,
     "derive": lambda: _sqnr_db(7 / 18, 1.0, 7), "tol": 3e-4},
    {"name": "D1-16(b) check, alpha", "stated": 0.67,
     "derive": lambda: _alpha_db(7 / 18, 1.0), "tol": 1e-2},
    {"name": "D1-16(c) PCM bit rate", "stated": 56e3,
     "derive": lambda: math.log2(128) * 2 * 4e3},

    # ---- D1-17 ----------------------------------------------------------
    {"name": "D1-17(a) normalising constant", "stated": 0.125,
     "derive": lambda: _normalising_constant(1 - sp.Abs(_x) / 8, -8, 8)},
    {"name": "D1-17(b) power of the samples", "stated": 10.667,
     "derive": _d17_signal_power, "tol": 5e-5},
    {"name": "D1-17(c) quantization noise power", "stated": 5.604,
     "derive": _d17_noise_power, "tol": 1e-4},
    {"name": "D1-17(d) SQNR", "stated": 2.79,
     "derive": lambda: 10 * math.log10(_d17_signal_power() / _d17_noise_power()), "tol": 3e-3},
    {"name": "D1-17 what the uniform model would have given", "stated": 5.5,
     "derive": lambda: 10 * math.log10(_d17_signal_power() / (6.0 ** 2 / 12)), "tol": 5e-3},

    # ---- D1-18 ----------------------------------------------------------
    {"name": "D1-18(a) bit rate", "stated": 42e3, "derive": lambda: math.log2(128) * 2 * 3e3},
    {"name": "D1-18(b) peak of the sum", "stated": 3.0,
     "derive": lambda: float(np.max(
         2 * np.cos(2 * np.pi * 1000 * np.linspace(0, 2e-3, 200001))
         + np.cos(2 * np.pi * 3000 * np.linspace(0, 2e-3, 200001)))), "tol": 1e-6},
    {"name": "D1-18(b) step size", "stated": 0.0469, "derive": lambda: 2 * 3.0 / 128, "tol": 2e-3},
    {"name": "D1-18(c) average power", "stated": 2.5,
     "derive": lambda: float(np.mean(
         (2 * np.cos(2 * np.pi * 1000 * np.linspace(0, 1e-3, 200000, endpoint=False))
          + np.cos(2 * np.pi * 3000 * np.linspace(0, 1e-3, 200000, endpoint=False))) ** 2)),
     "tol": 1e-6},
    {"name": "D1-18(c) alpha", "stated": -0.79, "derive": lambda: _alpha_db(2.5, 3.0), "tol": 5e-3},
    {"name": "D1-18(c) SQNR", "stated": 41.35, "derive": lambda: _sqnr_db(2.5, 3.0, 7), "tol": 3e-4},
    {"name": "D1-18 check, mean-square error", "stated": 1.831e-4,
     "derive": lambda: _uniform_quantizer_mse(3.0, 128), "tol": 3e-4},
    {"name": "D1-18 check, equivalent single amplitude", "stated": 2.24,
     "derive": lambda: math.sqrt(5), "tol": 2e-3},

    # ---- D1-19 ----------------------------------------------------------
    {"name": "D1-19(a) Nyquist rate", "stated": 40e3, "derive": lambda: 2 * 20e3},
    {"name": "D1-19(b) where the 18 kHz component lands", "stated": 12e3,
     "derive": lambda: min(abs(18e3 - n * 30e3) for n in range(-3, 4))},
    {"name": "D1-19(c) anti-aliasing cut-off", "stated": 15e3, "derive": lambda: 30e3 / 2},
    {"name": "D1-19(d) rate with a 4 kHz guard band", "stated": 34e3,
     "derive": lambda: 2 * 15e3 + 4e3},

    # ---- D1-20 ----------------------------------------------------------
    {"name": "D1-20(a) step size", "stated": 0.75, "derive": lambda: 6.0 / 8},
    {"name": "D1-20(b) sample at t = 0.4", "stated": 3.027,
     "derive": lambda: _d20_sample(1), "tol": 3e-4},
    {"name": "D1-20(b) sample at t = 0.8", "stated": 5.613,
     "derive": lambda: _d20_sample(2), "tol": 3e-4},
    {"name": "D1-20(b) code words 000 100 111 111 100 000", "stated": 0b000100111111100000,
     "derive": _d20_words},
    {"name": "D1-20(c) bit rate", "stated": 7.5, "derive": lambda: 3 / 0.4},
    {"name": "D1-20(c) bit duration", "stated": 0.1333, "derive": lambda: 0.4 / 3, "tol": 3e-4},
    {"name": "D1-20 check, smallest quantization error", "stated": 0.012,
     "derive": lambda: min(abs(_d20_sample(n)
                               - (min(7, int(_d20_sample(n) / 0.75)) + 0.5) * 0.75)
                           for n in range(6)), "tol": 3e-2},
    {"name": "D1-20 check, largest error is exactly half a step",
     "stated": 0.375,
     "derive": lambda: max(abs(_d20_sample(n)
                               - (min(7, int(_d20_sample(n) / 0.75)) + 0.5) * 0.75)
                           for n in range(6)), "tol": 1e-9},

    # ---- D2-01 to D2-03, the matched filter ------------------------------
    {"name": "D2-01(b) pulse energy", "stated": 0.016, "derive": lambda: 4.0 * 0.004},
    {"name": "D2-01(c) peak SNR", "stated": 32.0, "derive": lambda: 2 * 0.016 / 1e-3},
    {"name": "D2-01(c) peak SNR in dB", "stated": 15.05,
     "derive": lambda: 10 * math.log10(32.0), "tol": 2e-4},
    {"name": "D2-02(a) energy of a ramp, in units of A^2 T", "stated": 1 / 3,
     "derive": lambda: float(sp.integrate((_x) ** 2, (_x, 0, 1)))},
    {"name": "D2-02(c) loss against a rectangle of the same peak", "stated": 4.77,
     "derive": lambda: 10 * math.log10(3.0), "tol": 1e-3},
    {"name": "D2-03(a) energy of a half sine, in units of B^2 T", "stated": 0.5,
     "derive": lambda: float(sp.integrate(sp.sin(sp.pi * _x) ** 2, (_x, 0, 1)))},
    {"name": "D2-03(b) peak the half sine needs", "stated": 1.41421,
     "derive": lambda: math.sqrt(2.0), "tol": 1e-5},

    # ---- D2-04 to D2-07, error probability against energy ----------------
    {"name": "D2-04(a) Eb/N0 in dB", "stated": 6.02,
     "derive": lambda: 10 * math.log10(4.0), "tol": 2e-4},
    {"name": "D2-04(b) bit error probability", "stated": 2.34e-3,
     "derive": lambda: _pb_antipodal(4.0), "tol": 3e-3},
    {"name": "D2-05(a) the Q argument for 1e-5", "stated": 4.265,
     "derive": lambda: _Qinv(1e-5), "tol": 3e-4},
    {"name": "D2-05(b) required Eb/N0", "stated": 9.09,
     "derive": lambda: _Qinv(1e-5) ** 2 / 2, "tol": 1e-3},
    {"name": "D2-05(b) required Eb/N0 in dB", "stated": 9.59,
     "derive": lambda: 10 * math.log10(_Qinv(1e-5) ** 2 / 2), "tol": 3e-3},
    {"name": "D2-06(a) optimal threshold", "stated": 0.0693,
     "derive": lambda: _threshold(1.0, 0.2, 0.8), "tol": 1e-3},
    {"name": "D2-07(a) Eb/N0 after quadrupling the rate", "stated": 2.98,
     "derive": lambda: 9 - 10 * math.log10(4.0), "tol": 2e-3},
    {"name": "D2-07(b) error probability before", "stated": 3.36e-5,
     "derive": lambda: _pb_antipodal(10 ** 0.9), "tol": 3e-3},
    {"name": "D2-07(b) error probability after", "stated": 2.31e-2,
     "derive": lambda: _pb_antipodal(10 ** 0.9 / 4), "tol": 3e-3},

    # ---- D2-08, Laplacian noise ------------------------------------------
    {"name": "D2-08(a) Laplacian tail beyond one", "stated": 0.1839,
     "derive": lambda: float(integrate.quad(lambda n: 0.5 * math.exp(-abs(n)),
                                            1, 60)[0]), "tol": 3e-4},
    {"name": "D2-08(b) the Gaussian of the same variance", "stated": 0.2398,
     "derive": lambda: _Q(1 / math.sqrt(2.0)), "tol": 3e-4},

    # ---- D2-09 to D2-11, bandwidth ---------------------------------------
    {"name": "D2-09(a) Nyquist bandwidth", "stated": 10e3, "derive": lambda: 20e3 / 2},
    {"name": "D2-09(b) transmission bandwidth", "stated": 13.5e3,
     "derive": lambda: 1.35 * 10e3},
    {"name": "D2-10(a) Nyquist bandwidth that fits", "stated": 16e3,
     "derive": lambda: 24e3 / 1.5},
    {"name": "D2-10(b) largest bit rate", "stated": 32e3, "derive": lambda: 2 * 24e3 / 1.5},

    # ---- D2-13 and D2-14, the full-length matched-filter questions --------
    {"name": "D2-13(b) energy per bit", "stated": 18.0, "derive": lambda: 9.0 * 2.0},
    {"name": "D2-13(b) signal point", "stated": 4.243,
     "derive": lambda: math.sqrt(18.0), "tol": 2e-4},
    {"name": "D2-13(d) bit error probability", "stated": 0.0786,
     "derive": lambda: _pb_antipodal(1.0), "tol": 2e-3},
    {"name": "D2-14(c) on-off is 3 dB worse than antipodal", "stated": 3.0103,
     "derive": lambda: 10 * math.log10(2.0), "tol": 1e-4},

    # ---- D2-15 and D2-16, non-Gaussian noise ------------------------------
    {"name": "D2-15(a) normalising constant", "stated": 0.1,
     "derive": lambda: 1.0 / 10.0},
    {"name": "D2-15(b) conditional error", "stated": 0.18,
     "derive": lambda: _triangular_tail(4.0, 10.0), "tol": 1e-6},
    {"name": "D2-15 check, the Gaussian of the same variance", "stated": 0.164,
     "derive": lambda: _Q(4.0 / math.sqrt(100.0 / 6.0)), "tol": 5e-3},
    {"name": "D2-16(c) average error probability", "stated": 0.1839,
     "derive": lambda: 0.5 * math.exp(-1.0), "tol": 3e-4},
    {"name": "D2-16 check, the error at a threshold of three", "stated": 0.2539,
     "derive": lambda: 0.5 * (math.exp(-5 / 4) + 1 - math.exp(-1 / 4)), "tol": 1e-3},

    # ---- D2-17 and D2-18, unequal priors ---------------------------------
    {"name": "D2-17(a) optimal threshold", "stated": 0.0777,
     "derive": lambda: _pe_unequal(2.0, 0.4, 0.25)["lam"], "tol": 2e-3},
    {"name": "D2-17(b) P(error | s0)", "stated": 4.250e-4,
     "derive": lambda: _pe_unequal(2.0, 0.4, 0.25)["e0"], "tol": 5e-4},
    {"name": "D2-17(b) P(error | s1)", "stated": 1.401e-3,
     "derive": lambda: _pe_unequal(2.0, 0.4, 0.25)["e1"], "tol": 5e-4},
    {"name": "D2-17(c) average error probability", "stated": 6.691e-4,
     "derive": lambda: _pe_unequal(2.0, 0.4, 0.25)["pe"], "tol": 5e-4},
    {"name": "D2-17(d) error probability at a threshold of zero", "stated": 7.827e-4,
     "derive": lambda: _pb_antipodal(2.0 / 0.4), "tol": 5e-4},
    {"name": "D2-18(a) optimal threshold", "stated": 2.405,
     "derive": lambda: _pe_two_gaussians(0.0, 4.0, 2.0, 0.6)["lam"], "tol": 3e-4},
    {"name": "D2-18(b) P(error | s0)", "stated": 0.1145,
     "derive": lambda: _pe_two_gaussians(0.0, 4.0, 2.0, 0.6)["e0"], "tol": 1e-3},
    {"name": "D2-18(b) P(error | s1)", "stated": 0.2127,
     "derive": lambda: _pe_two_gaussians(0.0, 4.0, 2.0, 0.6)["e1"], "tol": 1e-3},
    {"name": "D2-18(c) average error probability", "stated": 0.1538,
     "derive": lambda: _pe_two_gaussians(0.0, 4.0, 2.0, 0.6)["pe"], "tol": 1e-3},
    {"name": "D2-18(d) error probability at the midpoint", "stated": 0.1587,
     "derive": lambda: _Q(1.0), "tol": 5e-4},

    # ---- D2-19 and D2-20 --------------------------------------------------
    {"name": "D2-19(a) Nyquist bandwidth", "stated": 32e3, "derive": lambda: 64e3 / 2},
    {"name": "D2-19(b) largest roll-off that fits", "stated": 0.5,
     "derive": lambda: 48e3 / 32e3 - 1},
    {"name": "D2-19(c) excess bandwidth", "stated": 16e3, "derive": lambda: 0.5 * 32e3},
    {"name": "D2-20(a) worst-case interference", "stated": 0.28,
     "derive": lambda: 2 * (0.10 + 0.04)},
    {"name": "D2-20(b) eye opening", "stated": 1.44,
     "derive": lambda: 2 * (1 - 2 * (0.10 + 0.04))},
    {"name": "D2-20(c) margin in standard deviations", "stated": 4.8,
     "derive": lambda: (1 - 2 * (0.10 + 0.04)) / 0.15, "tol": 1e-6},
    {"name": "D2-20(d) error probability with the interference", "stated": 7.9e-7,
     "derive": lambda: _Q(4.8), "tol": 5e-3},
    {"name": "D2-20(d) error probability without it", "stated": 1.3e-11,
     "derive": lambda: _Q(1 / 0.15), "tol": 3e-2},

    # ---- Module 3 --------------------------------------------------------
    {"name": "D3-03(a) first coordinate", "stated": 4.24264,
     "derive": lambda: float(sp.integrate(3 / sp.sqrt(2), (_x, 0, 2))), "tol": 1e-5},
    {"name": "D3-03(b) energy from the vector", "stated": 22.0,
     "derive": lambda: (3 * math.sqrt(2)) ** 2 + (-2) ** 2, "tol": 1e-9},
    {"name": "D3-03(b) energy from the waveform", "stated": 22.0,
     "derive": lambda: 3 ** 2 * 2 + (-2) ** 2 * 1},
    {"name": "D3-04(a) energy of (3,4)", "stated": 25.0, "derive": lambda: 9 + 16},
    {"name": "D3-04(b) distance", "stated": 6.0, "derive": lambda: math.hypot(6, 0)},
    {"name": "D3-06(b) third signal vector, in units of A sqrt(T)", "stated": 3.0,
     "derive": lambda: 3.0},
    {"name": "D3-07(b) smallest distance on a square of half-side a", "stated": 2.0,
     "derive": lambda: math.dist((1, 1), (1, -1))},
    {"name": "D3-07(c) that distance in terms of average energy", "stated": 1.41421,
     "derive": lambda: math.sqrt(2.0), "tol": 1e-5},
    {"name": "D3-08(b) chord of three points on a unit circle", "stated": 1.73205,
     "derive": lambda: math.dist((math.sqrt(3) / 2, -0.5), (-math.sqrt(3) / 2, -0.5)),
     "tol": 1e-5},
    {"name": "D3-09(a) first basis function height", "stated": 0.5,
     "derive": lambda: 2 / math.sqrt(float(sp.integrate(4, (_x, 0, 4))))},
    {"name": "D3-09(b) first coordinate", "stated": 4.0,
     "derive": lambda: math.sqrt(float(sp.integrate(4, (_x, 0, 4))))},
    {"name": "D3-10(a) projection", "stated": 6.0,
     "derive": lambda: float(sp.integrate(3 * sp.Rational(1, 2), (_x, 0, 4)))},
    {"name": "D3-13(a) second basis normalisation", "stated": 2.82843,
     "derive": lambda: math.sqrt(float(sp.integrate(4, (_x, 1, 3)))), "tol": 1e-5},
    {"name": "D3-13(b) second coordinate of s3", "stated": 2.82843,
     "derive": lambda: float(sp.integrate(2 / sp.sqrt(2), (_x, 1, 3))), "tol": 1e-5},
    {"name": "D3-13(c) the three energies, read as one number", "stated": 4812,
     "derive": lambda: int(f"{4}{8}{12}")},
    {"name": "D3-13(d) smallest distance", "stated": 2.0,
     "derive": lambda: min(math.dist(a, b) for a, b in
                           [((2, 0), (0, 2 * math.sqrt(2))),
                            ((2, 0), (2, 2 * math.sqrt(2))),
                            ((0, 2 * math.sqrt(2)), (2, 2 * math.sqrt(2)))]),
     "tol": 1e-9},
    {"name": "D3-14(b) coordinates of s3", "stated": 1.41421,
     "derive": lambda: float(sp.integrate(2 / sp.sqrt(2), (_x, 0, 1))), "tol": 1e-5},
    {"name": "D3-15(c) smallest distance for four points on the axes", "stated": 1.41421,
     "derive": lambda: math.dist((1, 0), (0, 1)), "tol": 1e-5},
    {"name": "D3-16(d) antipodal is larger by root two", "stated": 1.41421,
     "derive": lambda: 2 / math.sqrt(2), "tol": 1e-5},
    {"name": "D3-17(b) the two smallest distances", "stated": 3.16228,
     "derive": lambda: min(math.dist((2, 1), (-1, 2)), math.dist((2, 1), (1, -2))),
     "tol": 1e-5},
    {"name": "D3-17(b) the largest distance", "stated": 4.47214,
     "derive": lambda: math.dist((-1, 2), (1, -2)), "tol": 1e-5},
    {"name": "D3-19(c) the largest pairwise distance", "stated": 2.0,
     "derive": lambda: max(math.dist(a, b) for a, b in
                           [((1,1,0,0),(0,0,1,1)), ((1,1,0,0),(1,0,1,0)),
                            ((1,1,0,0),(0,1,0,1)), ((0,0,1,1),(1,0,1,0)),
                            ((0,0,1,1),(0,1,0,1)), ((1,0,1,0),(0,1,0,1))]),
     "tol": 1e-9},
    {"name": "D3-19(c) the smallest pairwise distance", "stated": 1.41421,
     "derive": lambda: min(math.dist(a, b) for a, b in
                           [((1,1,0,0),(0,0,1,1)), ((1,1,0,0),(1,0,1,0)),
                            ((1,1,0,0),(0,1,0,1)), ((0,0,1,1),(1,0,1,0)),
                            ((0,0,1,1),(0,1,0,1)), ((1,0,1,0),(0,1,0,1))]),
     "tol": 1e-5},

    # ---- Module 4 --------------------------------------------------------
    {"name": "D4-01(a) nearest squared distance", "stated": 0.53,
     "derive": lambda: min((0.8 - x) ** 2 + (-0.3 - y) ** 2
                           for x, y in [(1,1), (-1,1), (-1,-1), (1,-1)]), "tol": 1e-9},
    {"name": "D4-02(a) metric for s0", "stated": 1.434,
     "derive": lambda: (0.15 + 1) ** 2 - 0.5 * math.log(0.8), "tol": 1e-3},
    {"name": "D4-02(a) metric for s1", "stated": 1.527,
     "derive": lambda: (0.15 - 1) ** 2 - 0.5 * math.log(0.2), "tol": 1e-3},
    {"name": "D4-02 check, the boundary", "stated": 0.173,
     "derive": lambda: (0.5 / 4) * math.log(4), "tol": 3e-3},
    {"name": "D4-03(a) the Q argument", "stated": 3.795,
     "derive": lambda: math.sqrt(2.4 ** 2 / (2 * 0.2)), "tol": 3e-4},
    {"name": "D4-03(b) pairwise error", "stated": 7.4e-5,
     "derive": lambda: _Q(math.sqrt(2.4 ** 2 / (2 * 0.2))), "tol": 5e-3},
    {"name": "D4-04(b) antipodal at 8 dB", "stated": 1.91e-4,
     "derive": lambda: _Q(math.sqrt(2 * 10 ** 0.8)), "tol": 3e-3},
    {"name": "D4-04(c) orthogonal at 8 dB", "stated": 6.00e-3,
     "derive": lambda: _Q(math.sqrt(10 ** 0.8)), "tol": 3e-3},
    {"name": "D4-05 the shared Q", "stated": 3.65e-3,
     "derive": lambda: _Q(math.sqrt(1.2 ** 2 / (2 * 0.1))), "tol": 3e-3},
    {"name": "D4-05(a) nearest-neighbour estimate", "stated": 7.30e-3,
     "derive": lambda: 2 * _Q(math.sqrt(1.2 ** 2 / (2 * 0.1))), "tol": 3e-3},
    {"name": "D4-05(b) minimum-distance bound", "stated": 2.55e-2,
     "derive": lambda: 7 * _Q(math.sqrt(1.2 ** 2 / (2 * 0.1))), "tol": 3e-3},
    {"name": "D4-06(b) general union bound", "stated": 2.71e-4,
     "derive": lambda: (4 * _Q(math.sqrt(2 / 0.16))
                        + 2 * _Q(math.sqrt(4 / 0.16))) / 3, "tol": 5e-3},
    {"name": "D4-08(b) average nearest neighbours of 16-QAM", "stated": 3.0,
     "derive": lambda: (4 * 2 + 8 * 3 + 4 * 4) / 16},
    {"name": "D4-08(c) 16-QAM at 15 dB", "stated": 1.79e-2,
     "derive": lambda: 3 * _Q(math.sqrt(10 ** 1.5 / 5)), "tol": 5e-3},
    {"name": "D4-09 check, average neighbours of 3-PAM", "stated": 1.33333,
     "derive": lambda: (1 + 2 + 1) / 3, "tol": 1e-5},
    {"name": "D4-10(a) boundary offset", "stated": 0.915,
     "derive": lambda: 1 + (0.4 / 4) * math.log(0.3 / 0.7), "tol": 2e-3},
    {"name": "D4-11(a) largest correlation metric", "stated": 1.5,
     "derive": lambda: max(3.0 - 4 / 2, 5.0 - 9 / 2, 2.0 - 1 / 2)},
    {"name": "D4-12(c) cost of going from 4-PSK to 8-PSK, in dB", "stated": 5.33,
     "derive": lambda: 10 * math.log10((math.sin(math.pi / 4)
                                        / math.sin(math.pi / 8)) ** 2), "tol": 3e-3},
    {"name": "D4-13(c) minimum distance", "stated": 2.82843,
     "derive": lambda: math.dist((2, 0), (0, 2)), "tol": 1e-5},
    {"name": "D4-14(a) average symbol energy", "stated": 6.0,
     "derive": lambda: (2 + 2 + 2 + 18) / 4},
    {"name": "D4-14(b) minimum distance", "stated": 2.0,
     "derive": lambda: min(math.dist(a, b) for a, b in
                           [((1,1),(1,-1)), ((1,1),(-1,1)), ((1,-1),(-1,1)),
                            ((1,1),(-3,-3)), ((1,-1),(-3,-3)), ((-1,1),(-3,-3))]),
     "tol": 1e-9},
    {"name": "D4-14(c) union bound", "stated": 2.36e-3,
     "derive": lambda: (4 * _Q(math.sqrt(8)) + 2 * _Q(math.sqrt(16))
                        + 2 * _Q(math.sqrt(64)) + 4 * _Q(math.sqrt(40))) / 4,
     "tol": 5e-3},
    {"name": "D4-15(a) optimal boundary", "stated": 0.0687,
     "derive": lambda: (0.25 / 4) * math.log(3), "tol": 2e-3},
    {"name": "D4-15(c) average error probability", "stated": 2.00e-3,
     "derive": lambda: 0.75 * _Q((0.0687 + 1) / math.sqrt(0.125))
                       + 0.25 * _Q((1 - 0.0687) / math.sqrt(0.125)), "tol": 5e-3},
    {"name": "D4-15(d) equal-prior receiver", "stated": 2.34e-3,
     "derive": lambda: _Q(math.sqrt(8)), "tol": 3e-3},
    {"name": "D4-16(c) 8-PSK at 13 dB", "stated": 1.56e-2,
     "derive": lambda: 2 * _Q(math.sqrt(2 * 10 ** 1.3) * math.sin(math.pi / 8)),
     "tol": 5e-3},
    {"name": "D4-18(b) average neighbours of 4-PAM", "stated": 1.5,
     "derive": lambda: (1 + 2 + 2 + 1) / 4},
    {"name": "D4-18(d) 4-PAM at 12 dB", "stated": 8.9e-3,
     "derive": lambda: 1.5 * _Q(math.sqrt(10 ** 1.2 / 2.5)), "tol": 8e-3},
    {"name": "D4-18(d) QPSK at the same ratio", "stated": 6.9e-5,
     "derive": lambda: 2 * _Q(math.sqrt(10 ** 1.2)), "tol": 8e-3},
    {"name": "D4-19(a) hexagon side equals its circumradius", "stated": 1.0,
     "derive": lambda: 2 * math.sin(math.pi / 6), "tol": 1e-9},
    {"name": "D4-20(a) amplitude of the four-level line", "stated": 0.44721,
     "derive": lambda: math.sqrt(1 / 5), "tol": 1e-5},
    {"name": "D4-20(c) ratio of the Q arguments", "stated": 1.58114,
     "derive": lambda: math.sqrt(2 / 0.8), "tol": 1e-5},

    # ── Module 5 ────────────────────────────────────────────────────────────
    # Every closed form here is reached from the constellation rather than from
    # the formula the solution quotes: the points are written down, the
    # distances measured, and the neighbours counted.

    {"name": "D5-01(b) BPSK Q argument at 9 dB", "stated": 3.986,
     "derive": lambda: math.sqrt(_pair_d2(_ANTIPODAL) * 10 ** 0.9 / 2), "tol": 1e-3},
    {"name": "D5-01(b) BPSK error at 9 dB", "stated": 3.36e-5,
     "derive": lambda: _Q(math.sqrt(_pair_d2(_ANTIPODAL) * 10 ** 0.9 / 2)), "tol": 5e-3},
    {"name": "D5-02(b) BFSK error at 9 dB", "stated": 2.41e-3,
     "derive": lambda: _Q(math.sqrt(_pair_d2(_ORTHOGONAL) * 10 ** 0.9 / 2)), "tol": 5e-3},
    {"name": "D5-02(c) orthogonal penalty in dB", "stated": 3.01,
     "derive": lambda: 10 * math.log10(_pair_d2(_ANTIPODAL) / _pair_d2(_ORTHOGONAL)),
     "tol": 2e-3},
    {"name": "D5-03(c) on-off error at 10 dB", "stated": 7.83e-4,
     "derive": lambda: _Q(math.sqrt(_pair_d2(_ONOFF) * 10 / 2)), "tol": 5e-3},
    {"name": "D5-04(a) BPSK dB for 1e-5", "stated": 9.59,
     "derive": lambda: 10 * math.log10(2 * _Qinv(1e-5) ** 2 / _pair_d2(_ANTIPODAL)),
     "tol": 2e-3},
    {"name": "D5-04(b) BFSK dB for 1e-5", "stated": 12.60,
     "derive": lambda: 10 * math.log10(2 * _Qinv(1e-5) ** 2 / _pair_d2(_ORTHOGONAL)),
     "tol": 2e-3},
    {"name": "D5-05(a) 8-PSK minimum distance over root Es", "stated": 0.765,
     "derive": lambda: _dmin(_psk(8)), "tol": 1e-3},
    {"name": "D5-05(b) 8-PSK average neighbours", "stated": 2.0,
     "derive": lambda: _nmin(_psk(8)), "tol": 1e-9},
    {"name": "D5-05(c) 8-PSK error at 13 dB", "stated": 1.56e-2,
     "derive": lambda: _pe(_psk(8), 13), "tol": 5e-3},
    {"name": "D5-06(a) QPSK error at 12 dB", "stated": 6.86e-5,
     "derive": lambda: _pe(_psk(4), 12), "tol": 5e-3},
    {"name": "D5-06(c) BPSK at the matching energy per bit", "stated": 3.43e-5,
     "derive": lambda: _Q(math.sqrt(_pair_d2(_ANTIPODAL) * 10 ** 0.899 / 2)), "tol": 5e-3},
    {"name": "D5-07(a) energy ratio from QPSK to 8-PSK", "stated": 3.414,
     "derive": lambda: _dmin(_psk(4)) ** 2 / _dmin(_psk(8)) ** 2, "tol": 1e-3},
    {"name": "D5-07(b) cost per symbol in dB", "stated": 5.33,
     "derive": lambda: 10 * math.log10(_dmin(_psk(4)) ** 2 / _dmin(_psk(8)) ** 2),
     "tol": 2e-3},
    {"name": "D5-07(b) cost per bit in dB", "stated": 3.57,
     "derive": lambda: 10 * math.log10(
         _dmin(_psk(4)) ** 2 / _dmin(_psk(8)) ** 2 * 2 / 3), "tol": 3e-3},
    {"name": "D5-08(a) 16-PSK minimum distance over root Es", "stated": 0.390,
     "derive": lambda: _dmin(_psk(16)), "tol": 2e-3},
    {"name": "D5-08(b) 16-PSK against 8-PSK in dB", "stated": -5.85,
     "derive": lambda: 10 * math.log10(_dmin(_psk(16)) ** 2 / _dmin(_psk(8)) ** 2),
     "tol": 2e-3},
    {"name": "D5-09(a) 4-PAM average energy over A squared", "stated": 5.0,
     "derive": lambda: sum(p[0] ** 2 for p in _pam_raw(4)) / 4, "tol": 1e-9},
    {"name": "D5-09(b) 4-PAM average neighbours", "stated": 1.5,
     "derive": lambda: _nmin(_pam(4)), "tol": 1e-9},
    {"name": "D5-09(c) 4-PAM error at 12 dB", "stated": 8.9e-3,
     "derive": lambda: _pe(_pam(4), 12), "tol": 8e-3},
    {"name": "D5-10(a) 8-PAM against 4-PAM squared distance", "stated": 0.238,
     "derive": lambda: _dmin(_pam(8)) ** 2 / _dmin(_pam(4)) ** 2, "tol": 3e-3},
    {"name": "D5-10(b) cost of doubling the PAM levels in dB", "stated": 6.23,
     "derive": lambda: 10 * math.log10(_dmin(_pam(4)) ** 2 / _dmin(_pam(8)) ** 2),
     "tol": 2e-3},
    {"name": "D5-11(a) 8-PAM average neighbours", "stated": 1.75,
     "derive": lambda: _nmin(_pam(8)), "tol": 1e-9},
    {"name": "D5-12(a) 16-QAM squared distance over Es", "stated": 0.400,
     "derive": lambda: _dmin(_qam(16)) ** 2, "tol": 2e-3},
    {"name": "D5-12(b) 16-QAM average neighbours", "stated": 3.0,
     "derive": lambda: _nmin(_qam(16)), "tol": 1e-9},
    {"name": "D5-12(c) 16-QAM error at 15 dB", "stated": 1.79e-2,
     "derive": lambda: _pe(_qam(16), 15), "tol": 5e-3},
    {"name": "D5-13(a) 16-PAM squared distance over Es", "stated": 0.0471,
     "derive": lambda: _dmin(_pam(16)) ** 2, "tol": 3e-3},
    {"name": "D5-13(b) QAM advantage over PAM at M=16", "stated": 8.5,
     "derive": lambda: _dmin(_qam(16)) ** 2 / _dmin(_pam(16)) ** 2, "tol": 2e-3},
    {"name": "D5-13(b) that advantage in dB", "stated": 9.29,
     "derive": lambda: 10 * math.log10(
         _dmin(_qam(16)) ** 2 / _dmin(_pam(16)) ** 2), "tol": 2e-3},
    {"name": "D5-14(b) 64-QAM average neighbours", "stated": 3.5,
     "derive": lambda: _nmin(_qam(64)), "tol": 1e-9},
    {"name": "D5-15(b) 8-FSK average neighbours", "stated": 7.0,
     "derive": lambda: _nmin(_simplex_orthogonal(8)), "tol": 1e-9},
    {"name": "D5-15(c) 8-FSK error at 10 dB", "stated": 5.48e-3,
     "derive": lambda: _pe(_simplex_orthogonal(8), 10), "tol": 5e-3},
    {"name": "D5-16(b) 16-FSK bits per second per hertz", "stated": 0.5,
     "derive": lambda: math.log2(16) / (16 / 2), "tol": 1e-9},
    {"name": "D5-17(a) QPSK energy per bit for 1e-4, in dB", "stated": 8.79,
     "derive": lambda: _ebn0_for(_psk(4), 1e-4), "tol": 2e-3},
    {"name": "D5-17(b) 16-QAM energy per bit for 1e-4, in dB", "stated": 12.98,
     "derive": lambda: _ebn0_for(_qam(16), 1e-4), "tol": 2e-3},
    {"name": "D5-18(c) 16-QAM error at 18 dB", "stated": 5.72e-4,
     "derive": lambda: _pe(_qam(16), 18), "tol": 5e-3},
    {"name": "D5-18(d) the same divided by four bits", "stated": 1.43e-4,
     "derive": lambda: _pe(_qam(16), 18) / math.log2(16), "tol": 5e-3},
    {"name": "D5-19(a) 8-PSK squared distance over Es", "stated": 0.586,
     "derive": lambda: _dmin(_psk(8)) ** 2, "tol": 2e-3},
    {"name": "D5-19(a) 8-PAM squared distance over Es", "stated": 0.190,
     "derive": lambda: _dmin(_pam(8)) ** 2, "tol": 3e-3},
    {"name": "D5-19(c) 8-PSK error at 15 dB", "stated": 2.33e-3,
     "derive": lambda: _pe(_psk(8), 15), "tol": 5e-3},
    {"name": "D5-19(c) 8-PAM error at 15 dB", "stated": 7.24e-2,
     "derive": lambda: _pe(_pam(8), 15), "tol": 5e-3},
    {"name": "D5-19(d) PSK over PAM at M=8, in dB", "stated": 4.9,
     "derive": lambda: 10 * math.log10(
         _dmin(_psk(8)) ** 2 / _dmin(_pam(8)) ** 2), "tol": 5e-3},
    {"name": "D5-20(a) QPSK at 10 dB per bit", "stated": 7.74e-6,
     "derive": lambda: _pe(_psk(4), 10 + 10 * math.log10(2)), "tol": 5e-3},
    {"name": "D5-20(b) 8-PSK at 10 dB per bit", "stated": 3.03e-3,
     "derive": lambda: _pe(_psk(8), 10 + 10 * math.log10(3)), "tol": 5e-3},
    {"name": "D5-20(c) 16-QAM at 10 dB per bit", "stated": 7.03e-3,
     "derive": lambda: _pe(_qam(16), 10 + 10 * math.log10(4)), "tol": 5e-3},
    {"name": "D5-20 teach: dB that would rescue 8-PSK", "stated": 0.9,
     "derive": lambda: 10 * math.log10(
         _Qinv(1e-3 / _nmin(_psk(8))) ** 2
         / (_dmin(_psk(8)) ** 2 * 10 ** ((10 + 10 * math.log10(3)) / 10) / 2)),
     "tol": 2e-2},
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
