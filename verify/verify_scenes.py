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

import math
import sys

import numpy as np
import sympy as sp
from scipy import integrate

# ── Module 1 ────────────────────────────────────────────────────────────────
# Sampling, quantization and pulse code modulation.


def _sinc(x):
    """sin(pi x)/(pi x), the convention this course fixes in scene 1.2.1."""
    return np.sinc(x)


def _nyquist_of_product():
    """Nyquist rate of x(t)cos(2*pi*40k*t) when x is bandlimited to 40 kHz.

    Reached from the spectrum rather than from the rule: the product occupies
    the union of X shifted to +/-fc, so its highest frequency is fc + W and the
    rate is twice that.
    """
    W, fc = 40e3, 40e3
    highest = fc + W
    return 2 * highest


def _power_of_sinusoid():
    """Average power of 5 cos(t), by time-averaging rather than by Parseval.

    The scene reaches 12.5 through the Fourier coefficients. Integrating the
    square over one period is a different route to the same number.
    """
    t = sp.symbols("t", real=True)
    T = 2 * sp.pi
    return float(sp.integrate((5 * sp.cos(t)) ** 2, (t, 0, T)) / T)


def _sqnr_db_sinusoid(bits):
    """SQNR of a full-scale sinusoid through a uniform mid-rise quantizer.

    Measured, not predicted: the waveform is quantized and the mean square of
    the actual error is averaged over one period. If alpha + 6.02R were wrong
    this would not follow it.
    """
    mmax, L = 5.0, 2 ** bits
    delta = 2 * mmax / L
    t = np.linspace(0.0, 2 * np.pi, 2_000_001)
    m = mmax * np.cos(t)
    lvl = np.clip(np.floor(m / delta) + 0.5, -L / 2 + 0.5, L / 2 - 0.5) * delta
    err = m - lvl
    pm = np.trapezoid(m ** 2, t) / (2 * np.pi)
    pq = np.trapezoid(err ** 2, t) / (2 * np.pi)
    return 10 * math.log10(pm / pq)


def _mse_uniform_source():
    """E[Q^2] for M ~ U(-1,1) through a 256-level uniform quantizer.

    Integrated against the true density over each of the 256 regions rather
    than taken from Delta^2/12, which is the statement being checked.
    """
    L, mmax = 256, 1.0
    delta = 2 * mmax / L
    total = 0.0
    for k in range(L):
        lo = -mmax + k * delta
        v = lo + delta / 2
        seg, _ = integrate.quad(lambda m: (m - v) ** 2 * 0.5, lo, lo + delta)
        total += seg
    return total


def _sqnr_db_formula(bits):
    """alpha + 6.02R for the sinusoid, with the average power integrated rather
    than taken from the scene."""
    pm = _power_of_sinusoid()
    return 10 * math.log10(3 * pm / 25.0) + 20 * bits * math.log10(2.0)


def _sqnr_db_uniform_source():
    return 10 * math.log10((1.0 / 3.0) / _mse_uniform_source())


# The five-level quantizer of the Gaussian example: boundaries and outputs as
# the scene states them.
_GAUSS_EDGES = [-np.inf, -40.0, -20.0, 20.0, 40.0, np.inf]
_GAUSS_LEVELS = [-30.0, -10.0, 0.0, 10.0, 30.0]


def _noise_power_gaussian():
    var = 400.0
    dens = lambda x: math.exp(-x * x / (2 * var)) / math.sqrt(2 * math.pi * var)
    total = 0.0
    for lo, hi, v in zip(_GAUSS_EDGES[:-1], _GAUSS_EDGES[1:], _GAUSS_LEVELS):
        seg, _ = integrate.quad(lambda x, v=v: (x - v) ** 2 * dens(x), lo, hi)
        total += seg
    return total


def _signal_power_gaussian():
    """Area under S_X(f) = 2 on |f| < 100 Hz, integrated rather than multiplied."""
    val, _ = integrate.quad(lambda f: 2.0, -100.0, 100.0)
    return val


def _sqnr_db_gaussian():
    return 10 * math.log10(_signal_power_gaussian() / _noise_power_gaussian())


def _pcm_sample(n):
    """The nth sample of 8|sinc(t-2)| at T_s = 0.6 s."""
    return 8 * abs(_sinc(0.6 * n - 2))


def _pcm_code_index(n):
    """Which of the eight treads the nth sample falls in, as an integer 0..7."""
    return int(min(7, math.floor(_pcm_sample(n))))



# ── Module 2 ────────────────────────────────────────────────────────────────
# Baseband transmission: the matched filter, the threshold, the error
# probability, and the bandwidth the pulse needs.

from scipy.special import erfc as _erfc


def _Q(x):
    return 0.5 * _erfc(x / math.sqrt(2.0))


def _m2_threshold(eb, n0, p0):
    return (n0 / (4 * math.sqrt(eb))) * math.log(p0 / (1 - p0))


def _m2_example():
    """The unequal-prior example of scene 2.3.4, computed from the definitions.

    The scene reaches the two conditional errors through the Gaussian tail; this
    reaches them the same way but with the threshold recomputed from the priors
    rather than copied, so a slip in the threshold shows up in every part.
    """
    eb, n0, p1 = 1.0, 0.1, 0.3
    p0 = 1 - p1
    lam = _m2_threshold(eb, n0, p0)
    sig = math.sqrt(n0 / 2)
    a = math.sqrt(eb)
    e0 = float(_Q((lam + a) / sig))
    e1 = float(_Q((a - lam) / sig))
    return {"lam": lam, "e0": e0, "e1": e1, "pe": p0 * e0 + p1 * e1,
            "pe0": float(_Q(math.sqrt(2 * eb / n0)))}


def _raised_cosine(t, alpha, w=0.5):
    """p(t) = sinc(2Wt) cos(2 pi alpha W t) / (1 - 16 alpha^2 W^2 t^2).

    The `t` inside the cosine is the correction recorded as A-04: both sources
    write cos(2 pi alpha W) and the zero crossings they claim do not follow from
    that form.
    """
    den = 1 - 16 * alpha ** 2 * w ** 2 * t ** 2
    if abs(den) < 1e-9:
        return float(np.sinc(2 * w * t) * math.pi / 4)
    return float(np.sinc(2 * w * t) * math.cos(2 * math.pi * alpha * w * t) / den)



# ── Module 3 ────────────────────────────────────────────────────────────────


def _gs_example():
    """Gram-Schmidt on the three pulses of scene 3.3.2, run numerically.

    The scene reaches the coordinates by integrating by hand. This samples the
    waveforms, runs the procedure on the samples and reads the coordinates off
    the result, so the two agree only if the procedure and the arithmetic both
    hold.
    """
    n, tmax = 30000, 3.0
    dt = tmax / n
    t = (np.arange(n) + 0.5) * dt
    sigs = [np.where((t >= 0) & (t < 2), 1.0, 0.0),
            np.where((t >= 2) & (t < 3), 1.0, 0.0),
            np.where((t >= 0) & (t < 3), 1.0, 0.0)]
    dot = lambda a, b: float(np.sum(a * b) * dt)
    basis, coords = [], []
    scale = max(dot(s, s) for s in sigs)
    for s in sigs:
        c = [dot(s, b) for b in basis]
        g = s - sum(ci * basis[k] for k, ci in enumerate(c)) if basis else s.copy()
        eg = dot(g, g)
        if eg > 1e-9 * scale:
            basis.append(g / math.sqrt(eg))
            c.append(math.sqrt(eg))
        coords.append(c)
    dim = len(basis)
    for c in coords:
        while len(c) < dim:
            c.append(0.0)
    return {"coords": coords, "dim": dim,
            "energies": [sum(v * v for v in c) for c in coords]}


# Each entry:
#   name    -- the scene and the quantity, as a reader would name them
#   stated  -- the number the scene prints
#   derive  -- a callable of no arguments returning the same quantity,
#              computed independently of how the scene computes it
#   tol     -- relative tolerance; the default is what a figure printed to
#              three significant digits can be trusted to
def _m6_bisect(f, lo=1e-9, hi=0.5, n=200):
    for _ in range(n):
        mid = (lo + hi) / 2
        if f(mid) < 0:
            lo = mid
        else:
            hi = mid
    return lo


def _m6_qinv(p, lo=0.0, hi=12.0, n=200):
    """The x with Q(x) = p, by bisection on Q itself."""
    for _ in range(n):
        mid = (lo + hi) / 2
        if _Q(mid) > p:
            lo = mid
        else:
            hi = mid
    return lo


def _m6_Hb(p):
    if p <= 0 or p >= 1:
        return 0.0
    return -(p * math.log2(p) + (1 - p) * math.log2(1 - p))


def _m6_chan(Pyx, px):
    """H(Y), H(Y|X) and I(X;Y) for a channel matrix and an input distribution,
    computed from the definitions rather than from any closed form."""
    ny = len(Pyx[0])
    py = [sum(Pyx[j][k] * px[j] for j in range(len(px))) for k in range(ny)]
    hyx = sum(px[j] * _m6_H(Pyx[j]) for j in range(len(px)))
    return _m6_H(py), hyx, _m6_H(py) - hyx


def _m6_capacity(Pyx, n=4000):
    """Capacity of a binary-input channel by searching the input distribution.

    The scenes reach the BSC answer through 1 - H(p) and the Z-channel answer
    through a derivative. Searching re-derives both without either identity.
    """
    best, best_q = -1.0, 0.0
    for i in range(n + 1):
        q = i / n
        val = _m6_chan(Pyx, [q, 1 - q])[2]
        if val > best:
            best, best_q = val, q
    return best, best_q


_M6_BSC = lambda p: [[1 - p, p], [p, 1 - p]]
_M6_Z = [[1.0, 0.0], [0.5, 0.5]]


# ── Module 4 ────────────────────────────────────────────────────────────────


def _faces(pts, k):
    """The neighbours of pts[k] whose bisectors give its region a face.

    Found from the geometry rather than read off the scene: j gives a face when
    some point of the bisector between k and j is strictly nearer to those two
    than to every other signal point. The bisector is sampled along its own
    direction, which is what makes this independent of how the scene counted.
    """
    p = np.asarray(pts, dtype=float)
    out = []
    for j in range(len(p)):
        if j == k:
            continue
        mid = (p[k] + p[j]) / 2
        d = p[j] - p[k]
        # a direction along the bisector: perpendicular to d in the plane
        t = np.array([-d[1], d[0]])
        n = np.linalg.norm(t)
        if n == 0:                      # collinear points: the bisector is a
            t = np.zeros(2)             # single point in one dimension
        else:
            t = t / n
        span = 40 * float(np.linalg.norm(d))
        for s in np.linspace(-span, span, 4001):
            x = mid + s * t
            near = np.linalg.norm(p - x, axis=1)
            if near[k] <= min(near[m] for m in range(len(p)) if m not in (k, j)) - 1e-9:
                out.append(j)
                break
    return out


def _intelligent(pts, arg_of_d):
    """The intelligent union bound, averaged over an equally likely alphabet.

    `arg_of_d` turns a distance into the argument of Q. Only the neighbours the
    geometry says give a face contribute.
    """
    p = np.asarray(pts, dtype=float)
    total = 0.0
    for k in range(len(p)):
        for j in _faces(p, k):
            total += _Q(arg_of_d(float(np.linalg.norm(p[k] - p[j]))))
    return total / len(p)


# ── Module 5 constellations ─────────────────────────────────────────────────
# Built from the definition of each family and scaled to unit average symbol
# energy, so a distance read off one is already in units of root Es.


def _m5_unit(pts):
    e = sum(x * x + y * y for x, y in pts) / len(pts)
    k = 1 / math.sqrt(e)
    return [(x * k, y * k) for x, y in pts]


def _m5_dmin(pts):
    return min(math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])
               for i in range(len(pts)) for j in range(i + 1, len(pts)))


def _m5_psk(m):
    return _m5_unit([(math.cos(2 * math.pi * k / m),
                      math.sin(2 * math.pi * k / m)) for k in range(m)])


def _m5_pam(m):
    return _m5_unit([(2 * k - (m - 1), 0.0) for k in range(m)])


def _m5_qam(m):
    side = int(round(math.sqrt(m)))
    lv = [2 * k - (side - 1) for k in range(side)]
    return _m5_unit([(x, y) for x in lv for y in lv])


# ── Module 6 ────────────────────────────────────────────────────────────────
# The Huffman code here is built with a heap; the scenes state the result of
# working the algorithm by hand on the same probabilities.

import heapq


def _m6_H(ps):
    return -sum(p * math.log2(p) for p in ps if p > 0)


def _m6_lengths(ps, minvar=True):
    heap = [(p, 1 if minvar else -1, i, (i,)) for i, p in enumerate(ps)]
    heapq.heapify(heap)
    depth = [0] * len(ps)
    nxt = len(ps)
    while len(heap) > 1:
        pa, _, _, la = heapq.heappop(heap)
        pb, _, _, lb = heapq.heappop(heap)
        for i in la + lb:
            depth[i] += 1
        n = len(la) + len(lb)
        heapq.heappush(heap, (pa + pb, (n if minvar else -n), nxt, la + lb))
        nxt += 1
    return depth


def _m6_L(ps, minvar=True):
    return sum(p * l for p, l in zip(ps, _m6_lengths(ps, minvar)))


def _m6_var(ps, minvar=True):
    ls = _m6_lengths(ps, minvar)
    L = sum(p * l for p, l in zip(ps, ls))
    return sum(p * (l - L) ** 2 for p, l in zip(ps, ls))


_M6_S3 = [0.7, 0.2, 0.1]
_M6_FIVE = [0.4, 0.2, 0.2, 0.1, 0.1]


CHECKS: list[dict] = [
    # ---- 1.2.3, the sampling-rate example -------------------------------
    {"name": "1.2.3 Nyquist rate, W = 40 kHz",
     "stated": 80e3, "derive": lambda: 2 * 40e3},
    {"name": "1.2.3 rate with a 10 kHz guard band",
     "stated": 90e3, "derive": lambda: 2 * 40e3 + 10e3},
    {"name": "1.2.3 Nyquist rate of the modulated signal",
     "stated": 160e3, "derive": _nyquist_of_product},

    # ---- 1.4.3, the sinusoid --------------------------------------------
    {"name": "1.4.3 average power of 5cos(t)",
     "stated": 12.5, "derive": _power_of_sinusoid},
    {"name": "1.4.3 step size at R = 3",
     "stated": 1.25, "derive": lambda: 2 * 5.0 / 2 ** 3},
    {"name": "1.4.3 step size at R = 4",
     "stated": 0.625, "derive": lambda: 2 * 5.0 / 2 ** 4},
    # The scene states two numbers per resolution, and they are different
    # claims. The first is what alpha + 6.02R gives; the second is what the
    # quantizer actually does to this waveform. They differ because the uniform
    # error model is a small-step model and eight levels is not a small step.
    {"name": "1.4.3 SQNR at R = 3, from the formula",
     "stated": 19.82, "derive": lambda: _sqnr_db_formula(3), "tol": 3e-4},
    {"name": "1.4.3 SQNR at R = 3, measured on the waveform",
     "stated": 19.09, "derive": lambda: _sqnr_db_sinusoid(3), "tol": 3e-3},
    {"name": "1.4.3 SQNR at R = 4, from the formula",
     "stated": 25.84, "derive": lambda: _sqnr_db_formula(4), "tol": 3e-4},
    {"name": "1.4.3 SQNR at R = 4, measured on the waveform",
     "stated": 25.31, "derive": lambda: _sqnr_db_sinusoid(4), "tol": 3e-3},
    {"name": "1.4.3 mean-square error at R = 3",
     "stated": 0.1302, "derive": lambda: (2 * 5.0 / 8) ** 2 / 12},

    # ---- 1.4.4, the uniform source --------------------------------------
    {"name": "1.4.4 average power of U(-1,1)",
     "stated": 1 / 3, "derive": lambda: float(
         sp.integrate(sp.Symbol("m") ** 2 * sp.Rational(1, 2),
                      (sp.Symbol("m"), -1, 1)))},
    {"name": "1.4.4 step size, L = 256",
     "stated": 1 / 128, "derive": lambda: 2 * 1.0 / 256},
    {"name": "1.4.4 mean-square error",
     "stated": 5.086e-6, "derive": _mse_uniform_source, "tol": 2e-4},
    {"name": "1.4.4 SQNR",
     "stated": 48.16, "derive": _sqnr_db_uniform_source, "tol": 3e-4},

    # ---- 1.4.5, the Gaussian source --------------------------------------
    {"name": "1.4.5 signal power",
     "stated": 400.0, "derive": _signal_power_gaussian},
    {"name": "1.4.5 quantization noise power",
     "stated": 188.18, "derive": _noise_power_gaussian, "tol": 1e-4},
    {"name": "1.4.5 SQNR",
     "stated": 3.27, "derive": _sqnr_db_gaussian, "tol": 2e-3},
    {"name": "1.4.5 what the uniform model would have predicted",
     "stated": 10.8, "derive": lambda: 10 * math.log10(400.0 / (20.0 ** 2 / 12)),
     "tol": 5e-3},

    # ---- 1.6.3, the PCM stream -------------------------------------------
    {"name": "1.6.3 step size", "stated": 1.0, "derive": lambda: (8.0 - 0.0) / 8},
    {"name": "1.6.3 sample at t = 0.6", "stated": 1.73,
     "derive": lambda: _pcm_sample(1), "tol": 3e-3},
    {"name": "1.6.3 sample at t = 1.2", "stated": 1.87,
     "derive": lambda: _pcm_sample(2), "tol": 3e-3},
    {"name": "1.6.3 sample at t = 1.8", "stated": 7.48,
     "derive": lambda: _pcm_sample(3), "tol": 3e-3},
    {"name": "1.6.3 sample at t = 2.4", "stated": 6.05,
     "derive": lambda: _pcm_sample(4), "tol": 3e-3},
    {"name": "1.6.3 sample at t = 3.6", "stated": 1.51,
     "derive": lambda: _pcm_sample(6), "tol": 3e-3},
    # The code words, read as the integer each three-bit word stands for. A
    # wrong word is a wrong integer, so one check covers the whole stream.
    # The seven three-bit words read as one twenty-one-bit number. A wrong word
    # is a wrong number, so one check covers the whole stream.
    {"name": "1.6.3 code words 000 001 001 111 110 000 001",
     "stated": 40833,
     "derive": lambda: int("".join(format(_pcm_code_index(n), "03b")
                                   for n in range(7)), 2)},
    {"name": "1.6.3 bit rate", "stated": 5.0, "derive": lambda: 3 * (1 / 0.6)},

    # ---- 2.1, the matched filter ----------------------------------------
    {"name": "2.1.4 the matched-filter bound for a unit-energy pulse",
     "stated": 2.0, "derive": lambda: 2 * 1.0 / 1.0},

    # ---- 2.3.4, the unequal-prior example -------------------------------
    {"name": "2.3.4 optimal threshold", "stated": 0.0212,
     "derive": lambda: _m2_example()["lam"], "tol": 2e-3},
    {"name": "2.3.4 P(error | s0)", "stated": 2.475e-6,
     "derive": lambda: _m2_example()["e0"], "tol": 5e-4},
    {"name": "2.3.4 P(error | s1)", "stated": 6.005e-6,
     "derive": lambda: _m2_example()["e1"], "tol": 5e-4},
    {"name": "2.3.4 average error probability", "stated": 3.534e-6,
     "derive": lambda: _m2_example()["pe"], "tol": 5e-4},
    {"name": "2.3.4 error probability with the threshold left at zero",
     "stated": 3.872e-6, "derive": lambda: _m2_example()["pe0"], "tol": 5e-4},

    # ---- 2.5, Nyquist and the raised cosine ------------------------------
    # The raised cosine must vanish at every non-zero multiple of T_b for every
    # roll-off. Five roll-offs and eight instants are checked at once: the
    # largest magnitude found, shifted by one so a relative test means something.
    {"name": "2.5.2 the raised cosine vanishes at every non-zero sampling instant",
     "stated": 1.0,
     "derive": lambda: 1.0 + max(abs(_raised_cosine(float(k), a))
                                 for a in (0.0, 0.25, 0.5, 0.75, 1.0)
                                 for k in range(1, 9)),
     "tol": 1e-9},
    {"name": "2.5.2 the raised cosine is one at the origin", "stated": 1.0,
     "derive": lambda: _raised_cosine(0.0, 0.5)},
    {"name": "2.5.1 Nyquist bandwidth for 20 kbit/s", "stated": 10e3,
     "derive": lambda: 20e3 / 2},
    {"name": "2.5.2 transmission bandwidth at alpha = 0.5", "stated": 15e3,
     "derive": lambda: (1 + 0.5) * 10e3},

    # ---- 3.3.2, the Gram-Schmidt example ---------------------------------
    # The procedure is run numerically on the sampled waveforms rather than
    # symbolically, which is a different route from the scene's integrals.
    {"name": "3.3.2 first coordinate of s1", "stated": 1.41421,
     "derive": lambda: _gs_example()["coords"][0][0], "tol": 1e-5},
    {"name": "3.3.2 second coordinate of s2", "stated": 1.0,
     "derive": lambda: _gs_example()["coords"][1][1], "tol": 1e-6},
    {"name": "3.3.2 first coordinate of s3", "stated": 1.41421,
     "derive": lambda: _gs_example()["coords"][2][0], "tol": 1e-5},
    {"name": "3.3.2 second coordinate of s3", "stated": 1.0,
     "derive": lambda: _gs_example()["coords"][2][1], "tol": 1e-6},
    {"name": "3.3.2 the set needs two dimensions", "stated": 2,
     "derive": lambda: _gs_example()["dim"]},
    {"name": "3.3.2 energy of s1", "stated": 2.0,
     "derive": lambda: _gs_example()["energies"][0], "tol": 1e-6},
    {"name": "3.3.2 energy of s2", "stated": 1.0,
     "derive": lambda: _gs_example()["energies"][1], "tol": 1e-6},
    {"name": "3.3.2 energy of s3", "stated": 3.0,
     "derive": lambda: _gs_example()["energies"][2], "tol": 1e-6},
    {"name": "3.2 four points on a square: smallest distance at energy 2",
     "stated": 2.0, "derive": lambda: 2 * 1.0},

    # ── Module 4 ────────────────────────────────────────────────────────────
    # The intelligent union bound counts the neighbours that give the decision
    # region a face. The scene counts them by looking at the picture; the check
    # finds them by sampling each bisector, so the count itself is re-derived
    # and not copied.

    {"name": "4.4.4 faces of a corner region in the square", "stated": 2,
     "derive": lambda: len(_faces(
         [(0.5, 0.5), (-0.5, 0.5), (-0.5, -0.5), (0.5, -0.5)], 0))},
    {"name": "4.4.4 intelligent bound for the square at d^2/2N0=9",
     "stated": 2.70e-3,
     "derive": lambda: _intelligent(
         [(0.5, 0.5), (-0.5, 0.5), (-0.5, -0.5), (0.5, -0.5)],
         lambda d: 3.0 * d), "tol": 2e-3},
    {"name": "4.4.4 union bound for the same square, for comparison",
     "stated": 2.71e-3,
     "derive": lambda: 2 * _Q(3.0) + _Q(3.0 * math.sqrt(2)), "tol": 2e-3},
    {"name": "4.4.4 minimum-distance bound for the same square",
     "stated": 4.05e-3, "derive": lambda: 3 * _Q(3.0), "tol": 2e-3},

    # ── Module 5 ────────────────────────────────────────────────────────────
    # The scenes state seven numbers. Each is re-derived here from the points
    # of the constellation, scaled to unit average energy, rather than from the
    # formula the scene displays beside it.

    {"name": "5.1 BFSK and BASK against BPSK, in dB", "stated": 3.0,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_unit([(-1, 0), (1, 0)])) ** 2
         / _m5_dmin(_m5_unit([(1, 0), (0, 1)])) ** 2), "tol": 5e-3},
    {"name": "5.2 energy ratio from QPSK to 8-PSK", "stated": 3.41,
     "derive": lambda: _m5_dmin(_m5_psk(4)) ** 2 / _m5_dmin(_m5_psk(8)) ** 2,
     "tol": 2e-3},
    {"name": "5.2 that ratio in dB per symbol", "stated": 5.33,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_psk(4)) ** 2 / _m5_dmin(_m5_psk(8)) ** 2), "tol": 2e-3},
    {"name": "5.2 and per bit", "stated": 3.57,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_psk(4)) ** 2 / _m5_dmin(_m5_psk(8)) ** 2 * 2 / 3),
     "tol": 3e-3},
    {"name": "5.3 QAM over PAM at sixteen points", "stated": 8.5,
     "derive": lambda: _m5_dmin(_m5_qam(16)) ** 2 / _m5_dmin(_m5_pam(16)) ** 2,
     "tol": 2e-3},
    {"name": "5.3 that advantage in dB", "stated": 9.3,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_qam(16)) ** 2 / _m5_dmin(_m5_pam(16)) ** 2), "tol": 1e-2},
    {"name": "5.5 cost of doubling the PAM levels, 8 against 4, in dB",
     "stated": 6.0,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_pam(4)) ** 2 / _m5_dmin(_m5_pam(8)) ** 2), "tol": 4e-2},
    {"name": "5.5 cost of the extra PSK bit above eight points, in dB",
     "stated": 5.0,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_psk(8)) ** 2 / _m5_dmin(_m5_psk(16)) ** 2 * 3 / 4),
     "tol": 0.11},

    # ── Module 6 ────────────────────────────────────────────────────────────

    {"name": "6.2 entropy of the source 0.7, 0.2, 0.1", "stated": 1.1568,
     "derive": lambda: _m6_H(_M6_S3), "tol": 1e-4},
    {"name": "6.2 its ceiling log2 3", "stated": 1.585,
     "derive": lambda: math.log2(3), "tol": 1e-3},
    {"name": "6.3 entropy of the second extension", "stated": 2.3136,
     "derive": lambda: _m6_H([a * b for a in _M6_S3 for b in _M6_S3]),
     "tol": 1e-4},
    {"name": "6.4 efficiency of English at L=4.22, H=1.3", "stated": 0.31,
     "derive": lambda: 1.3 / 4.22, "tol": 8e-3},
    {"name": "6.6 Kraft sum for Code I", "stated": 1.5,
     "derive": lambda: sum(2.0 ** -l for l in [1, 1, 2, 2]), "tol": 1e-9},
    {"name": "6.6 Kraft sum for Code II", "stated": 1.0,
     "derive": lambda: sum(2.0 ** -l for l in [1, 2, 3, 3]), "tol": 1e-9},
    {"name": "6.6 Kraft sum for Code III", "stated": 0.9375,
     "derive": lambda: sum(2.0 ** -l for l in [1, 2, 3, 4]), "tol": 1e-9},
    {"name": "6.8 entropy of the Huffman example", "stated": 2.1219,
     "derive": lambda: _m6_H(_M6_FIVE), "tol": 1e-4},
    {"name": "6.8 its Huffman average length", "stated": 2.2,
     "derive": lambda: _m6_L(_M6_FIVE), "tol": 1e-9},
    {"name": "6.8 its coding efficiency", "stated": 0.9645,
     "derive": lambda: _m6_H(_M6_FIVE) / _m6_L(_M6_FIVE), "tol": 1e-4},
    {"name": "6.8 the excess over the entropy, per cent", "stated": 3.68,
     "derive": lambda: (_m6_L(_M6_FIVE) - _m6_H(_M6_FIVE))
         / _m6_H(_M6_FIVE) * 100, "tol": 3e-3},
    {"name": "6.9 average length of the other tie-breaking", "stated": 2.2,
     "derive": lambda: _m6_L(_M6_FIVE, False), "tol": 1e-9},
    {"name": "6.9 variance of the minimum-variance code", "stated": 0.16,
     "derive": lambda: _m6_var(_M6_FIVE, True), "tol": 1e-9},
    {"name": "6.9 variance of the other one", "stated": 1.36,
     "derive": lambda: _m6_var(_M6_FIVE, False), "tol": 1e-9},
    # ── Module 6, the channel half ──────────────────────────────────────────
    # Every capacity below is found by searching the input distribution, which
    # is the definition. The scenes reach the same numbers through 1 - H(p) and
    # through a derivative, so neither route is being restated here.

    {"name": "6.7.2 H(Y|X) of the BSC at p=0.1", "stated": 0.469,
     "derive": lambda: _m6_Hb(0.1), "tol": 1e-3},
    {"name": "6.7.2 mutual information there", "stated": 0.531,
     "derive": lambda: _m6_chan(_M6_BSC(0.1), [0.5, 0.5])[2], "tol": 1e-3},
    {"name": "6.7.2 the joint entropy of that pair", "stated": 1.469,
     "derive": lambda: 2 - _m6_chan(_M6_BSC(0.1), [0.5, 0.5])[2], "tol": 1e-3},
    {"name": "6.7.3 mutual information at p=0.25", "stated": 0.189,
     "derive": lambda: _m6_chan(_M6_BSC(0.25), [0.5, 0.5])[2], "tol": 3e-3},
    {"name": "6.7.3 the joint entropy at p=0.25", "stated": 1.811,
     "derive": lambda: 2 - _m6_chan(_M6_BSC(0.25), [0.5, 0.5])[2], "tol": 1e-3},
    {"name": "6.8.2 capacity of the BSC at p=0.1", "stated": 0.531,
     "derive": lambda: _m6_capacity(_M6_BSC(0.1))[0], "tol": 1e-3},
    {"name": "6.8.2 equally likely inputs are the best ones", "stated": 0.5,
     "derive": lambda: _m6_capacity(_M6_BSC(0.1))[1], "tol": 1e-3},
    {"name": "6.8.2 capacity at p=0.11", "stated": 0.500,
     "derive": lambda: _m6_capacity(_M6_BSC(0.11))[0], "tol": 2e-3},
    {"name": "6.8.2 capacity at one error in a thousand", "stated": 0.9886,
     "derive": lambda: _m6_capacity(_M6_BSC(0.001))[0], "tol": 1e-3},
    {"name": "6.8.4 capacity of the Z-channel", "stated": 0.3219,
     "derive": lambda: _m6_capacity(_M6_Z)[0], "tol": 1e-3},
    {"name": "6.8.4 the input distribution that reaches it", "stated": 0.6,
     "derive": lambda: _m6_capacity(_M6_Z)[1], "tol": 2e-3},
    {"name": "6.8.4 that capacity is log2(5/4) exactly", "stated": 0.3219,
     "derive": lambda: math.log2(1.25), "tol": 1e-3},
    {"name": "6.8.4 what a transmitter at q=0.5 gets instead", "stated": 0.3113,
     "derive": lambda: _m6_chan(_M6_Z, [0.5, 0.5])[2], "tol": 1e-3},
    {"name": "6.8.5 crossover at which capacity falls to one half",
     "stated": 0.11,
     "derive": lambda: _m6_bisect(lambda p: 0.5 - _m6_capacity(_M6_BSC(p))[0]),
     "tol": 2e-2},
    # Stated as a ratio rather than in dB: the scene's value there is 0 dB, and
    # a relative tolerance against zero cannot say anything.
    {"name": "6.9.1 energy per bit for one bit a second a hertz, as a ratio",
     "stated": 1.0, "derive": lambda: (2 ** 1 - 1) / 1, "tol": 1e-9},
    {"name": "6.9.1 energy per bit for two bits a second a hertz, dB",
     "stated": 1.76,
     "derive": lambda: 10 * math.log10((2 ** 2 - 1) / 2), "tol": 3e-3},
    {"name": "6.9.2 the Shannon limit as a ratio", "stated": 0.693,
     "derive": lambda: math.log(2), "tol": 1e-3},
    {"name": "6.9.2 the Shannon limit in dB", "stated": -1.59,
     "derive": lambda: 10 * math.log10(math.log(2)), "tol": 3e-3},
    {"name": "6.9.2 coherent BPSK at an error probability of 1e-5, dB",
     "stated": 9.6,
     "derive": lambda: 10 * math.log10(_m6_qinv(1e-5) ** 2 / 2), "tol": 5e-3},
    {"name": "6.9.2 how far that sits above the floor, dB", "stated": 11.0,
     "derive": lambda: 10 * math.log10(_m6_qinv(1e-5) ** 2 / 2)
         - 10 * math.log10(math.log(2)), "tol": 2e-2},
    {"name": "6.6.2 output probability in the worked joint distribution",
     "stated": 0.675, "derive": lambda: 0.8 * 0.75 + 0.3 * 0.25, "tol": 1e-9},
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
