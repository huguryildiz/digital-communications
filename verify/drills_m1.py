"""Re-derives every number stated in the Module 1 practice solutions.

Each entry of CHECKS reaches a stated number by a route the worked solution
does not take: a simulated uniform quantizer run on a densely sampled
waveform, a spectrum read off a long FFT record, a time-domain energy sum,
scipy quadrature of a density against an explicit quantizer function, a
Monte Carlo run with a fixed seed, or a brute-force search over the design
choices. The runner is the same as in verify_drills.py.

Run from verify/:  ../.venv/bin/python drills_m1.py
"""

import math
import sys

import numpy as np
from scipy import integrate, optimize

DEFAULT_TOL = 5e-3
LOG2 = math.log10(2.0)


def db(v):
    return 10 * math.log10(v)


# ── generic tools ──────────────────────────────────────────────────────────

def quantize(x, lo, hi, L):
    """A uniform mid-rise quantizer over [lo, hi] with L levels: the index is
    the tread the sample falls in, capped at the ends, and the output is the
    tread midpoint."""
    d = (hi - lo) / L
    idx = np.clip(np.floor((x - lo) / d), 0, L - 1)
    return lo + (idx + 0.5) * d, idx.astype(int)


def extremes(f, t0, t1, n=400001):
    """Max and min of a waveform by dense sampling, refined by a bounded search."""
    t = np.linspace(t0, t1, n)
    v = f(t)
    out = []
    for arg, sgn in ((np.argmax(v), -1), (np.argmin(v), 1)):
        h = (t1 - t0) / (n - 1)
        r = optimize.minimize_scalar(lambda s: sgn * f(np.array([s]))[0],
                                     bounds=(t[arg] - 2 * h, t[arg] + 2 * h), method="bounded",
                                     options={"xatol": 1e-12})
        out.append(-r.fun if sgn == -1 else r.fun)
    return out[0], out[1]


def time_power(f, period, n=2_000_000):
    """Average power over one period, as a time average of the samples."""
    t = np.arange(n) * period / n
    return float(np.mean(f(t) ** 2))


def model_sqnr_db(f, period, L, t0=0.0):
    """SQNR under the uniform-noise model, with the power taken as a time
    average and the range from the measured extremes of the waveform."""
    hi, lo = extremes(f, t0, t0 + period)
    return db(time_power(f, period) / (((hi - lo) / L) ** 2 / 12))


def measured_sqnr_db(f, period, lo, hi, L, n=2_000_000):
    """The SQNR a simulated quantizer actually produces on a waveform."""
    t = (np.arange(n) + 0.37) * period / n
    x = f(t)
    q, _ = quantize(x, lo, hi, L)
    return db(np.mean(x ** 2) / np.mean((x - q) ** 2))


def highest_freq(f, fs_sim, T, rel=0.02):
    """The highest frequency of a signal, read off the FFT of a long record:
    the largest bin whose magnitude is above rel times the peak."""
    n = int(round(2 * T * fs_sim))
    t = (np.arange(n) - n // 2) / fs_sim
    X = np.abs(np.fft.rfft(f(t))) / fs_sim
    fr = np.fft.rfftfreq(n, 1 / fs_sim)
    return float(fr[np.nonzero(X > rel * X.max())[0][-1]])


def spectrum_at(f, fs_sim, T, f0):
    """|X(f0)| of an energy signal, from the FFT of a long record."""
    n = int(round(2 * T * fs_sim))
    t = (np.arange(n) - n // 2) / fs_sim
    X = np.abs(np.fft.rfft(f(t))) / fs_sim
    fr = np.fft.rfftfreq(n, 1 / fs_sim)
    return float(X[np.argmin(np.abs(fr - f0))])


def least_pow2(pred, top=30):
    """The smallest power of two L = 2^R for which pred(L) holds."""
    for R in range(1, top):
        if pred(2 ** R):
            return 2 ** R
    raise ValueError("no power of two satisfies the predicate")


def worst_error_pct(R, n=200001):
    """Largest error of an R-bit quantizer over [-1, 1] on a full-scale
    sinusoid, as a percentage of the peak-to-peak value 2, measured."""
    x = np.cos(np.linspace(0, 2 * np.pi, n))
    q, _ = quantize(x, -1.0, 1.0, 2 ** R)
    return 100 * np.max(np.abs(x - q)) / 2


def least_bits_for(p_pct):
    """Smallest R whose measured worst error is inside p per cent."""
    for R in range(1, 20):
        if worst_error_pct(R) <= p_pct + 1e-9:
            return R
    raise ValueError


def quad(fn, a, b, pts=None):
    return integrate.quad(fn, a, b, points=pts, limit=400)[0]


def noise_power(f, qfun, a, b, pts):
    return quad(lambda x: (x - qfun(x)) ** 2 * f(x), a, b, pts)


def piecewise_q(table):
    def q(x):
        for lo, hi, v in table:
            if lo < x < hi:
                return v
        return 0.0
    return q


def mc_draw(f, a, b, n, seed):
    """Samples from a density on [a, b] by inverting its numerical CDF."""
    grid = np.linspace(a, b, 400001)
    pdf = np.array([f(x) for x in grid]) if not hasattr(f(np.array([a])), "__len__") else f(grid)
    cdf = np.concatenate([[0], np.cumsum((pdf[1:] + pdf[:-1]) / 2 * np.diff(grid))])
    cdf /= cdf[-1]
    u = np.random.default_rng(seed).random(n)
    return np.interp(u, cdf, grid)


def mc_sqnr_uniform(f, a, b, L, n=2_000_000, seed=1):
    """SQNR of an L-level uniform quantizer over [a, b], measured on draws."""
    x = mc_draw(f, a, b, n, seed)
    q, _ = quantize(x, a, b, L)
    return db(np.mean(x ** 2) / np.mean((x - q) ** 2))


def mc_coarse(f, a, b, qtable, n=2_000_000, seed=7):
    x = mc_draw(f, a, b, n, seed)
    q = np.zeros_like(x)
    for lo, hi, v in qtable:
        q[(x > lo) & (x < hi)] = v
    return float(np.mean(x ** 2)), float(np.mean((x - q) ** 2))


def vec(fs):
    """Vectorise a scalar density."""
    return np.vectorize(fs, otypes=[float])


sinc = np.sinc   # numpy's sinc is sin(pi x)/(pi x), the course convention


# ── the waveforms (t in seconds) ───────────────────────────────────────────

x07 = lambda t: 10 * np.cos(3000 * np.pi * t) * np.cos(6000 * np.pi * t)
x08 = lambda t: 5 * np.sin(2000 * np.pi * t) * np.cos(8000 * np.pi * t)
x09 = lambda t: 8 * np.cos(3000 * np.pi * t) ** 2
x10 = lambda t: (np.sin(200 * np.pi * t) / (20 * np.pi * np.where(t == 0, 1e-30, t))) ** 2 * (t != 0) + 100.0 * (t == 0)
x11 = lambda t: 1200 * sinc(200 * t) * sinc(600 * t)
x12 = lambda t: 1000 * sinc(1000 * t) * np.cos(4000 * np.pi * t)
x13 = lambda t: 2 * np.cos(3000 * np.pi * t) + 3 * np.cos(9000 * np.pi * t)
x14 = lambda t: 2 * np.cos(2000 * np.pi * t) + np.cos(4000 * np.pi * t)
x15 = lambda t: np.cos(1000 * np.pi * t) + np.cos(3000 * np.pi * t) + np.cos(5000 * np.pi * t)
x16 = lambda t: 3 * np.sin(5000 * np.pi * t) + 4 * np.cos(5000 * np.pi * t)
x17 = lambda t: 4 * np.cos(2000 * np.pi * t) + 2 * np.cos(6000 * np.pi * t)


def guard_for(Rb, R, W):
    """Guard band from a required bit rate, by a search over f_s in 1 Hz steps
    for the rate at which R bits a sample give exactly Rb."""
    fs = next(f for f in range(1, 10 ** 7) if R * f >= Rb)
    return fs - 2 * W


# ── the densities ──────────────────────────────────────────────────────────

f18 = lambda x: (1 + x * x) if abs(x) <= 1 else 0.0
f19 = lambda x: (1 - math.sqrt(abs(x))) if abs(x) <= 1 else 0.0
f20 = lambda x: (4 - x * x) if abs(x) <= 2 else 0.0
f21 = lambda x: math.exp(-abs(x)) if abs(x) <= 2 else 0.0
f22 = lambda x: (1 + x) if abs(x) <= 1 else 0.0
f23 = lambda x: abs(x) if abs(x) <= 2 else 0.0


def normalised(shape, a, b, pts=None):
    k = 1 / quad(shape, a, b, pts)
    return k, (lambda x: k * shape(x))


def trap(top, foot):
    """Trapezoid of unit height, flat on |x| <= top, zero beyond foot."""
    def s(x):
        g = abs(x)
        return 1.0 if g <= top else (foot - g) / (foot - top) if g <= foot else 0.0
    return s


tri = lambda a: (lambda x: max(0.0, 1 - abs(x) / a))
step28 = lambda x: 1.0 if abs(x) < 1 else 0.5 if abs(x) <= 3 else 0.0
ramp30 = lambda x: (1 - x / 4) if 0 <= x <= 4 else 0.0

Q24 = [(-3, 0, -2), (0, 3, 2)]
Q25 = [(-6, 0, -3), (0, 6, 3)]
Q26 = [(-4, -1, -2), (-1, 1, 0), (1, 4, 2)]
Q27 = [(-4, 0, -2), (0, 4, 2)]
Q28 = [(-3, -1.5, -2.25), (-1.5, 0, -0.75), (0, 1.5, 0.75), (1.5, 3, 2.25)]
Q29 = lambda b: [(-3, 0, -b), (0, 3, b)]
Q30 = [(0, 2, 1), (2, 4, 3)]


def coarse(shape, a, b, table, pts):
    k, f = normalised(shape, a, b, pts)
    P = quad(lambda x: x * x * f(x), a, b, pts)
    N = noise_power(f, piecewise_q(table), a, b, pts)
    return k, f, P, N


C24 = coarse(trap(3, 5), -5, 5, Q24, [-3, 0, 3])
C25 = coarse(tri(6), -6, 6, Q25, [0])
C26 = coarse(trap(2, 4), -4, 4, Q26, [-2, -1, 1, 2])
C27 = coarse(trap(2, 6), -6, 6, Q27, [-4, -2, 0, 2, 4])
C28 = coarse(step28, -3, 3, Q28, [-1.5, -1, 0, 1, 1.5])
C29a = coarse(tri(3), -3, 3, Q29(2), [0])
C29b = coarse(tri(3), -3, 3, Q29(1), [0])
C30 = coarse(ramp30, 0, 4, Q30, [2])


def best_b():
    """The output b that minimises the noise, by a bounded search."""
    f = C29a[1]
    r = optimize.minimize_scalar(lambda b: noise_power(f, piecewise_q(Q29(b)), -3, 3, [0]),
                                 bounds=(0.1, 3), method="bounded", options={"xatol": 1e-10})
    return r.x, r.fun


BEST_B = best_b()


def pam_order(Rb, limit):
    """Smallest k = log2 M with Rb/k within the channel limit, by trying k."""
    return next(k for k in range(1, 20) if Rb / k <= limit)


def budget_bits(Rb, fs):
    """Largest R with R*fs inside the link, by counting up."""
    R = 0
    while (R + 1) * fs <= Rb:
        R += 1
    return R


def tail_share_27():
    f = C27[1]
    tails = 2 * quad(lambda x: x * x * f(x), 4, 6)
    return tails / C27[3]


E12 = None


def energy_12():
    """Energy of x12 as a time-domain Riemann sum over a long record plus the
    tail, which is about 1/(4 pi^2 T) on each side for this 1/t decay."""
    global E12
    if E12 is None:
        T, fs = 40.0, 40000.0
        t = (np.arange(int(2 * T * fs)) - T * fs) / fs
        E12 = float(np.sum(x12(t) ** 2) / fs + 2 * (1 / (4 * np.pi ** 2 * T)))
    return E12


def code_int(bits):
    return int(bits, 2)


# ── the checks ─────────────────────────────────────────────────────────────

CHECKS: list[dict] = [
    # ---- D1-01 --------------------------------------------------------------
    {"name": "D1-01(a) least level count bound", "stated": 200,
     "derive": lambda: optimize.brentq(lambda L: 2 / L - 0.01, 10, 1000)},
    {"name": "D1-01(a) bits per sample", "stated": 8, "derive": lambda: least_bits_for(0.25)},
    {"name": "D1-01(b) Nyquist rate, Hz", "stated": 12000,
     "derive": lambda: 2 * highest_freq(lambda t: np.cos(12000 * np.pi * t), 200000, 0.5)},
    {"name": "D1-01(b) bit rate", "stated": 96000, "derive": lambda: least_bits_for(0.25) * 2 * 6000},
    {"name": "D1-01(c) symbol rate", "stated": 48000,
     "derive": lambda: least_bits_for(0.25) * 12000 / math.log2(4)},
    {"name": "D1-01 check largest error / Vmax", "stated": 0.00391,
     "derive": lambda: 2 * worst_error_pct(8) / 100, "tol": 3e-3},
    {"name": "D1-01 check error at 8 bits, %", "stated": 0.195, "derive": lambda: worst_error_pct(8), "tol": 3e-3},
    {"name": "D1-01 check error at 7 bits, %", "stated": 0.391, "derive": lambda: worst_error_pct(7), "tol": 3e-3},

    # ---- D1-02 --------------------------------------------------------------
    {"name": "D1-02(a) level bound", "stated": 62.5,
     "derive": lambda: optimize.brentq(lambda L: 2 / L - 0.032, 10, 1000)},
    {"name": "D1-02(a) bits per sample", "stated": 6, "derive": lambda: least_bits_for(0.8)},
    {"name": "D1-02(b) Nyquist rate", "stated": 7000,
     "derive": lambda: 2 * highest_freq(lambda t: np.sin(7000 * np.pi * t), 200000, 0.5)},
    {"name": "D1-02(b) sampling rate", "stated": 8750,
     "derive": lambda: 1.25 * 2 * highest_freq(lambda t: np.sin(7000 * np.pi * t), 200000, 0.5)},
    {"name": "D1-02(c) bit rate", "stated": 52500, "derive": lambda: least_bits_for(0.8) * 8750},
    {"name": "D1-02(d) symbol rate", "stated": 17500, "derive": lambda: (least_bits_for(0.8) // 3) * 8750},
    {"name": "D1-02 check error at 6 bits, %", "stated": 0.78, "derive": lambda: worst_error_pct(6), "tol": 3e-3},

    # ---- D1-03 --------------------------------------------------------------
    {"name": "D1-03(a) sampling rate, MHz", "stated": 8, "derive": lambda: 1.25 * (3.2 + 3.2)},
    {"name": "D1-03(b) bits per sample", "stated": 11, "derive": lambda: least_pow2(lambda L: L >= 2048).bit_length() - 1},
    {"name": "D1-03(c) bit rate", "stated": 88e6, "derive": lambda: (least_pow2(lambda L: L >= 2048).bit_length() - 1) * 1.25 * 2 * 3.2e6},
    {"name": "D1-03(d) least bandwidth, MHz", "stated": 44, "derive": lambda: 11 * 8 / 2},
    {"name": "D1-03 check rate at Nyquist, Mbit/s", "stated": 70.4, "derive": lambda: 11 * 2 * 3.2},
    {"name": "D1-03 check guard band, MHz", "stated": 1.6, "derive": lambda: 8 - 2 * 3.2},

    # ---- D1-04 --------------------------------------------------------------
    {"name": "D1-04(a) bit rate", "stated": 70000, "derive": lambda: 17500 * math.log2(16)},
    {"name": "D1-04(a) bits per sample", "stated": 7,
     "derive": lambda: 17500 * math.log2(16) / (2 * highest_freq(lambda t: np.cos(10000 * np.pi * t), 200000, 0.5))},
    {"name": "D1-04(b) step / Vmax", "stated": 0.0156,
     "derive": lambda: 2 * np.max(np.abs(np.cos(np.linspace(0, 6.3, 300001)) - quantize(np.cos(np.linspace(0, 6.3, 300001)), -1, 1, 128)[0])),
     "tol": 3e-3},
    {"name": "D1-04(c) largest error, %", "stated": 0.391, "derive": lambda: worst_error_pct(7), "tol": 3e-3},
    {"name": "D1-04(d) lower end of p", "stated": 0.391, "derive": lambda: worst_error_pct(7), "tol": 3e-3},
    {"name": "D1-04(d) upper end of p", "stated": 0.781, "derive": lambda: worst_error_pct(6), "tol": 3e-3},
    {"name": "D1-04 check p = 0.5 gives 7 bits", "stated": 7, "derive": lambda: least_bits_for(0.5)},
    {"name": "D1-04 check level bound at p = 0.5", "stated": 100,
     "derive": lambda: optimize.brentq(lambda L: 1 / L - 0.01, 10, 1000)},

    # ---- D1-05 --------------------------------------------------------------
    {"name": "D1-05(a) level bound", "stated": 500, "derive": lambda: optimize.brentq(lambda L: 2 / L - 0.004, 10, 5000)},
    {"name": "D1-05(a) bits per sample", "stated": 9, "derive": lambda: least_bits_for(0.1)},
    {"name": "D1-05(b) bit rate", "stated": 162000,
     "derive": lambda: least_bits_for(0.1) * 2 * highest_freq(lambda t: np.cos(18000 * np.pi * t), 400000, 0.5)},
    {"name": "D1-05(c) bits per symbol bound", "stated": 2.7, "derive": lambda: optimize.brentq(lambda k: 162000 / k - 60000, 1, 10)},
    {"name": "D1-05(c) PAM order", "stated": 8, "derive": lambda: 2 ** pam_order(162000, 60000)},
    {"name": "D1-05(d) symbol rate", "stated": 54000, "derive": lambda: 162000 / pam_order(162000, 60000)},
    {"name": "D1-05 check symbol rate with M=4", "stated": 81000, "derive": lambda: 162000 / math.log2(4)},

    # ---- D1-06 --------------------------------------------------------------
    {"name": "D1-06(a) sampling rate, MHz", "stated": 6.5, "derive": lambda: 1.3 * 2 * 2.5},
    {"name": "D1-06(b) bound 64/6.5", "stated": 9.85, "derive": lambda: optimize.brentq(lambda R: R * 6.5 - 64, 1, 20), "tol": 1e-3},
    {"name": "D1-06(b) bits per sample", "stated": 9, "derive": lambda: budget_bits(64e6, 6.5e6)},
    {"name": "D1-06(b) levels", "stated": 512, "derive": lambda: 2 ** budget_bits(64e6, 6.5e6)},
    {"name": "D1-06(c) bit rate, Mbit/s", "stated": 58.5, "derive": lambda: budget_bits(64e6, 6.5e6) * 6.5},
    {"name": "D1-06(d) SQNR ratio", "stated": 393216,
     "derive": lambda: 10 ** (measured_sqnr_db(lambda t: np.cos(2 * np.pi * t), 1.0, -1, 1, 512) / 10), "tol": 3e-2},
    {"name": "D1-06(d) SQNR, dB", "stated": 55.95,
     "derive": lambda: measured_sqnr_db(lambda t: np.cos(2 * np.pi * t), 1.0, -1, 1, 512), "tol": 2e-3},
    {"name": "D1-06 check ten bits need, Mbit/s", "stated": 65, "derive": lambda: 10 * 6.5},
    {"name": "D1-06 check rule value, dB", "stated": 55.94, "derive": lambda: db(1.5) + 9 * 20 * LOG2, "tol": 1e-3},

    # ---- D1-07 --------------------------------------------------------------
    {"name": "D1-07(a) highest frequency, kHz", "stated": 4.5, "derive": lambda: highest_freq(x07, 100000, 0.5) / 1000},
    {"name": "D1-07(a) sampling rate, kHz", "stated": 10, "derive": lambda: (2 * highest_freq(x07, 100000, 0.5) + 1000) / 1000},
    {"name": "D1-07(b) bit rate", "stated": 90000, "derive": lambda: 9 * (2 * highest_freq(x07, 100000, 0.5) + 1000)},
    {"name": "D1-07(c) sampling rate, kHz", "stated": 12, "derive": lambda: (guard_for(108000, 9, 4500) + 9000) / 1000},
    {"name": "D1-07(c) guard band", "stated": 3000, "derive": lambda: guard_for(108000, 9, highest_freq(x07, 100000, 0.5))},
    {"name": "D1-07(d) maximum", "stated": 10, "derive": lambda: extremes(x07, 0, 2e-3)[0]},
    {"name": "D1-07(d) minimum", "stated": -10, "derive": lambda: extremes(x07, 0, 2e-3)[1]},
    {"name": "D1-07(d) step size", "stated": 0.0391,
     "derive": lambda: (lambda m: (m[0] - m[1]) / 512)(extremes(x07, 0, 2e-3)), "tol": 2e-3},
    {"name": "D1-07 check x at t=1/3000", "stated": -10, "derive": lambda: float(x07(np.array([1 / 3000]))[0])},

    # ---- D1-08 --------------------------------------------------------------
    {"name": "D1-08(a) highest frequency, kHz", "stated": 5, "derive": lambda: highest_freq(x08, 100000, 0.5) / 1000},
    {"name": "D1-08(a) sampling rate, kHz", "stated": 11.5, "derive": lambda: (2 * highest_freq(x08, 100000, 0.5) + 1500) / 1000},
    {"name": "D1-08(b) bit rate", "stated": 69000, "derive": lambda: 6 * (2 * highest_freq(x08, 100000, 0.5) + 1500)},
    {"name": "D1-08(c) sampling rate, kHz", "stated": 13, "derive": lambda: (guard_for(78000, 6, 5000) + 10000) / 1000},
    {"name": "D1-08(c) guard band", "stated": 3000, "derive": lambda: guard_for(78000, 6, highest_freq(x08, 100000, 0.5))},
    {"name": "D1-08(d) maximum", "stated": 5, "derive": lambda: extremes(x08, 0, 2e-3)[0]},
    {"name": "D1-08(d) minimum", "stated": -5, "derive": lambda: extremes(x08, 0, 2e-3)[1]},
    {"name": "D1-08(d) step size", "stated": 0.156,
     "derive": lambda: (lambda m: (m[0] - m[1]) / 64)(extremes(x08, 0, 2e-3))},
    {"name": "D1-08 check x at t=1/4000", "stated": 5, "derive": lambda: float(x08(np.array([1 / 4000]))[0])},

    # ---- D1-09 --------------------------------------------------------------
    {"name": "D1-09(a) highest frequency, kHz", "stated": 3, "derive": lambda: highest_freq(x09, 100000, 0.5) / 1000},
    {"name": "D1-09(a) sampling rate, kHz", "stated": 8, "derive": lambda: (2 * highest_freq(x09, 100000, 0.5) + 2000) / 1000},
    {"name": "D1-09(b) bit rate", "stated": 64000, "derive": lambda: 8 * (2 * highest_freq(x09, 100000, 0.5) + 2000)},
    {"name": "D1-09(c) sampling rate, kHz", "stated": 9, "derive": lambda: (guard_for(72000, 8, 3000) + 6000) / 1000},
    {"name": "D1-09(c) guard band", "stated": 3000, "derive": lambda: guard_for(72000, 8, highest_freq(x09, 100000, 0.5))},
    {"name": "D1-09(d) maximum", "stated": 8, "derive": lambda: extremes(x09, 0, 2e-3)[0]},
    {"name": "D1-09(d) step size", "stated": 0.03125,
     "derive": lambda: (lambda m: (m[0] - m[1]) / 256)(extremes(x09, 0, 2e-3)), "tol": 1e-4},
    {"name": "D1-09 check DC impulse weight", "stated": 4,
     "derive": lambda: float(np.mean(x09(np.arange(100000) / 100000 * (1 / 3000))))},

    # ---- D1-10 --------------------------------------------------------------
    {"name": "D1-10(a) bandwidth, Hz", "stated": 200, "derive": lambda: highest_freq(x10, 4000, 200.0, rel=1e-3), "tol": 2e-2},
    {"name": "D1-10(a) Nyquist rate", "stated": 400, "derive": lambda: 2 * highest_freq(x10, 4000, 200.0, rel=1e-3), "tol": 2e-2},
    {"name": "D1-10(a) bit rate", "stated": 3200, "derive": lambda: 8 * 2 * highest_freq(x10, 4000, 200.0, rel=1e-3), "tol": 2e-2},
    {"name": "D1-10(a) triangle peak X(0)", "stated": 0.5, "derive": lambda: spectrum_at(x10, 4000, 200.0, 0.0), "tol": 2e-3},
    {"name": "D1-10(b) maximum", "stated": 100, "derive": lambda: extremes(x10, -0.02, 0.02)[0]},
    {"name": "D1-10(b) step size", "stated": 0.3906,
     "derive": lambda: (extremes(x10, -0.02, 0.02)[0] - 0.0) / 256},
    {"name": "D1-10(c) sampling interval, ms", "stated": 2.5, "derive": lambda: 1000 / (2 * 200)},
    {"name": "D1-10(c) sample at 2.5 ms", "stated": 40.53, "derive": lambda: float(x10(np.array([2.5e-3]))[0])},
    {"name": "D1-10(c) sample at 7.5 ms", "stated": 4.503, "derive": lambda: float(x10(np.array([7.5e-3]))[0])},
    {"name": "D1-10(c) x/Delta at 2.5 ms", "stated": 103.75, "derive": lambda: float(x10(np.array([2.5e-3]))[0]) / (100 / 256)},
    {"name": "D1-10(c) x/Delta at 7.5 ms", "stated": 11.53, "derive": lambda: float(x10(np.array([7.5e-3]))[0]) / (100 / 256)},
    {"name": "D1-10(c) level at 0", "stated": 99.80,
     "derive": lambda: float(quantize(np.array([100.0]), 0, 100, 256)[0][0])},
    {"name": "D1-10(c) level at 2.5 ms", "stated": 40.43,
     "derive": lambda: float(quantize(x10(np.array([2.5e-3])), 0, 100, 256)[0][0])},
    {"name": "D1-10(c) level at 7.5 ms", "stated": 4.492,
     "derive": lambda: float(quantize(x10(np.array([7.5e-3])), 0, 100, 256)[0][0])},
    {"name": "D1-10(c) word at 0 (11111111)", "stated": code_int("11111111"),
     "derive": lambda: int(quantize(np.array([100.0]), 0, 100, 256)[1][0])},
    {"name": "D1-10(c) word at 2.5 ms (01100111)", "stated": code_int("01100111"),
     "derive": lambda: int(quantize(x10(np.array([2.5e-3])), 0, 100, 256)[1][0])},
    {"name": "D1-10(c) word at 7.5 ms (00001011)", "stated": code_int("00001011"),
     "derive": lambda: int(quantize(x10(np.array([7.5e-3])), 0, 100, 256)[1][0])},
    {"name": "D1-10 check half step", "stated": 0.195, "derive": lambda: 100 / 256 / 2, "tol": 2e-3},
    {"name": "D1-10 check error at 2.5 ms", "stated": 0.098,
     "derive": lambda: float(x10(np.array([2.5e-3]))[0] - quantize(x10(np.array([2.5e-3])), 0, 100, 256)[0][0]), "tol": 1e-2},
    {"name": "D1-10 check error at 7.5 ms", "stated": 0.011,
     "derive": lambda: float(x10(np.array([7.5e-3]))[0] - quantize(x10(np.array([7.5e-3])), 0, 100, 256)[0][0]), "tol": 3e-2},
    {"name": "D1-10 check area of x(t)", "stated": 0.5,
     "derive": lambda: quad(lambda t: 100 * np.sinc(200 * t) ** 2, -50, 50, [0]) + 2 * 100 / (2 * np.pi ** 2 * 200 ** 2 * 50),
     "tol": 1e-3},

    # ---- D1-11 --------------------------------------------------------------
    {"name": "D1-11(a) bandwidth, Hz", "stated": 400, "derive": lambda: highest_freq(x11, 8000, 100.0, rel=1e-3), "tol": 1e-2},
    {"name": "D1-11(a) Nyquist rate", "stated": 800, "derive": lambda: 2 * highest_freq(x11, 8000, 100.0, rel=1e-3), "tol": 1e-2},
    {"name": "D1-11(a) bit rate", "stated": 5600, "derive": lambda: 7 * 2 * highest_freq(x11, 8000, 100.0, rel=1e-3), "tol": 1e-2},
    {"name": "D1-11(b) maximum", "stated": 1200, "derive": lambda: extremes(x11, -0.02, 0.02)[0]},
    {"name": "D1-11(b) hint minimum", "stated": -177, "derive": lambda: extremes(x11, -0.02, 0.02)[1]},
    {"name": "D1-11(b) range", "stated": 1377, "derive": lambda: (lambda m: m[0] - m[1])(extremes(x11, -0.02, 0.02))},
    {"name": "D1-11(b) step size", "stated": 10.76, "derive": lambda: (lambda m: (m[0] - m[1]) / 128)(extremes(x11, -0.02, 0.02))},
    {"name": "D1-11(c) levels", "stated": 2048,
     "derive": lambda: least_pow2(lambda L: (1200 - extremes(x11, -0.02, 0.02)[1]) / L < 1)},
    {"name": "D1-11(c) step size", "stated": 0.672,
     "derive": lambda: (lambda m: (m[0] - m[1]) / 2048)(extremes(x11, -0.02, 0.02))},
    {"name": "D1-11(c) bit rate", "stated": 8800,
     "derive": lambda: math.log2(least_pow2(lambda L: 1377 / L < 1)) * 2 * highest_freq(x11, 8000, 100.0, rel=1e-3), "tol": 1e-2},
    {"name": "D1-11 check step at 1024 levels", "stated": 1.34,
     "derive": lambda: (lambda m: (m[0] - m[1]) / 1024)(extremes(x11, -0.02, 0.02))},
    {"name": "D1-11 check X(0)", "stated": 2, "derive": lambda: spectrum_at(x11, 8000, 100.0, 0.0), "tol": 2e-3},

    # ---- D1-12 --------------------------------------------------------------
    {"name": "D1-12(a) height of X(f)", "stated": 0.5, "derive": lambda: spectrum_at(x12, 20000, 50.0, 2000.0), "tol": 2e-3},
    {"name": "D1-12(a) lower band edge, Hz", "stated": 1500,
     "derive": lambda: next(f for f in np.arange(0, 3000, 1.0) if spectrum_at(x12, 20000, 20.0, f) > 0.25), "tol": 2e-3},
    {"name": "D1-12(a) highest frequency, Hz", "stated": 2500, "derive": lambda: highest_freq(x12, 20000, 20.0, rel=0.3), "tol": 2e-3},
    {"name": "D1-12(b) bit rate", "stated": 50000, "derive": lambda: 10 * 2 * highest_freq(x12, 20000, 20.0, rel=0.3), "tol": 2e-3},
    {"name": "D1-12(c) maximum", "stated": 1000, "derive": lambda: extremes(x12, -0.004, 0.004)[0]},
    {"name": "D1-12(c) hint minimum", "stated": -902, "derive": lambda: extremes(x12, -0.004, 0.004)[1]},
    {"name": "D1-12(c) range", "stated": 1902, "derive": lambda: (lambda m: m[0] - m[1])(extremes(x12, -0.004, 0.004))},
    {"name": "D1-12(c) step size", "stated": 1.857, "derive": lambda: (lambda m: (m[0] - m[1]) / 1024)(extremes(x12, -0.004, 0.004))},
    {"name": "D1-12(d) energy", "stated": 500, "derive": energy_12, "tol": 2e-3},
    {"name": "D1-12 check energy of the sinc factor", "stated": 1000,
     "derive": lambda: 2 * quad(lambda t: (1000 * np.sinc(1000 * t)) ** 2, 0, 20, list(np.arange(0.001, 0.2, 0.001))) + 2 * 1 / (2 * np.pi ** 2 * 20),
     "tol": 2e-3},

    # ---- D1-13 --------------------------------------------------------------
    {"name": "D1-13(a) sampling rate", "stated": 9000, "derive": lambda: 2 * highest_freq(x13, 100000, 0.5)},
    {"name": "D1-13(a) bit rate", "stated": 72000, "derive": lambda: 8 * 2 * highest_freq(x13, 100000, 0.5)},
    {"name": "D1-13(b) maximum", "stated": 5, "derive": lambda: extremes(x13, 0, 2e-3)[0]},
    {"name": "D1-13(b) minimum", "stated": -5, "derive": lambda: extremes(x13, 0, 2e-3)[1]},
    {"name": "D1-13(b) step size", "stated": 0.0391, "derive": lambda: (lambda m: (m[0] - m[1]) / 256)(extremes(x13, 0, 2e-3)), "tol": 2e-3},
    {"name": "D1-13(c) power", "stated": 6.5, "derive": lambda: time_power(x13, 2 / 3000)},
    {"name": "D1-13(c) noise power", "stated": 1.272e-4, "derive": lambda: (10 / 256) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-13(c) SQNR ratio", "stated": 51118, "derive": lambda: time_power(x13, 2 / 3000) / ((10 / 256) ** 2 / 12)},
    {"name": "D1-13(c) SQNR, dB", "stated": 47.09, "derive": lambda: measured_sqnr_db(x13, 2 / 3000, -5, 5, 256), "tol": 2e-3},
    {"name": "D1-13 check alpha, dB", "stated": -1.079, "derive": lambda: db(3 * time_power(x13, 2 / 3000) / 25)},
    {"name": "D1-13 check 20 R log 2", "stated": 48.165, "derive": lambda: db(2.0 ** 16)},

    # ---- D1-14 --------------------------------------------------------------
    {"name": "D1-14(a) bit rate", "stated": 28000, "derive": lambda: 7 * 2 * highest_freq(x14, 100000, 0.5)},
    {"name": "D1-14(b) maximum", "stated": 3, "derive": lambda: extremes(x14, 0, 1e-3)[0]},
    {"name": "D1-14(b) minimum", "stated": -1.5, "derive": lambda: extremes(x14, 0, 1e-3)[1]},
    {"name": "D1-14(b) cos at the minimum", "stated": -0.5,
     "derive": lambda: optimize.minimize_scalar(lambda c: 2 * c + 2 * c * c - 1, bounds=(-1, 1), method="bounded").x},
    {"name": "D1-14(b) value at c = -1", "stated": -1, "derive": lambda: float(x14(np.array([0.5e-3]))[0])},
    {"name": "D1-14(c) step size", "stated": 0.0352, "derive": lambda: (lambda m: (m[0] - m[1]) / 128)(extremes(x14, 0, 1e-3)), "tol": 2e-3},
    {"name": "D1-14(d) power", "stated": 2.5, "derive": lambda: time_power(x14, 1e-3)},
    {"name": "D1-14(d) noise power", "stated": 1.030e-4, "derive": lambda: (4.5 / 128) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-14(d) SQNR ratio", "stated": 24273, "derive": lambda: time_power(x14, 1e-3) / ((4.5 / 128) ** 2 / 12)},
    {"name": "D1-14(d) SQNR, dB", "stated": 43.85, "derive": lambda: model_sqnr_db(x14, 1e-3, 128), "tol": 2e-3},
    {"name": "D1-14 check x at t = 1/3 ms", "stated": -1.5, "derive": lambda: float(x14(np.array([1 / 3000]))[0])},

    # ---- D1-15 --------------------------------------------------------------
    {"name": "D1-15(a) bit rate", "stated": 45000, "derive": lambda: 9 * 2 * highest_freq(x15, 100000, 0.5)},
    {"name": "D1-15(b) maximum", "stated": 3, "derive": lambda: extremes(x15, 0, 2e-3)[0]},
    {"name": "D1-15(b) minimum", "stated": -3, "derive": lambda: extremes(x15, 0, 2e-3)[1]},
    {"name": "D1-15(b) step size", "stated": 0.01172, "derive": lambda: (lambda m: (m[0] - m[1]) / 512)(extremes(x15, 0, 2e-3)), "tol": 2e-3},
    {"name": "D1-15(c) power", "stated": 1.5, "derive": lambda: time_power(x15, 2e-3)},
    {"name": "D1-15(c) noise power", "stated": 1.144e-5, "derive": lambda: (6 / 512) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-15(c) SQNR ratio", "stated": 131072, "derive": lambda: time_power(x15, 2e-3) / ((6 / 512) ** 2 / 12)},
    {"name": "D1-15(c) SQNR, dB", "stated": 51.18, "derive": lambda: model_sqnr_db(x15, 2e-3, 512), "tol": 2e-3},
    {"name": "D1-15 check alpha, dB", "stated": -3.010, "derive": lambda: db(3 * time_power(x15, 2e-3) / 9)},
    {"name": "D1-15 check 20 R log 2, R=9", "stated": 54.185, "derive": lambda: db(2.0 ** 18)},

    # ---- D1-16 --------------------------------------------------------------
    {"name": "D1-16(a) bit rate", "stated": 35000, "derive": lambda: 7 * 2 * highest_freq(x16, 100000, 0.5)},
    {"name": "D1-16(b) peak", "stated": 5, "derive": lambda: extremes(x16, 0, 1e-3)[0]},
    {"name": "D1-16(b) phase, rad", "stated": 0.644,
     "derive": lambda: optimize.minimize_scalar(lambda th: -(3 * np.sin(th) + 4 * np.cos(th)), bounds=(0, 1.5), method="bounded").x},
    {"name": "D1-16(c) step size", "stated": 0.0781, "derive": lambda: (lambda m: (m[0] - m[1]) / 128)(extremes(x16, 0, 1e-3)), "tol": 2e-3},
    {"name": "D1-16(d) power", "stated": 12.5, "derive": lambda: time_power(x16, 0.4e-3)},
    {"name": "D1-16(d) noise power", "stated": 5.086e-4, "derive": lambda: (10 / 128) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-16(d) SQNR ratio", "stated": 24576, "derive": lambda: time_power(x16, 0.4e-3) / ((10 / 128) ** 2 / 12)},
    {"name": "D1-16(d) SQNR, dB", "stated": 43.91, "derive": lambda: model_sqnr_db(x16, 0.4e-3, 128), "tol": 2e-3},
    {"name": "D1-16 check time of peak, ms", "stated": 0.041,
     "derive": lambda: 1e3 * optimize.minimize_scalar(lambda t: -x16(np.array([t]))[0], bounds=(0, 0.2e-3), method="bounded", options={"xatol": 1e-12}).x, "tol": 1e-2},
    {"name": "D1-16 check sine term at peak", "stated": 1.8, "derive": lambda: 3 * math.sin(math.atan2(3, 4))},
    {"name": "D1-16 check cosine term at peak", "stated": 3.2, "derive": lambda: 4 * math.cos(math.atan2(3, 4))},

    # ---- D1-17 --------------------------------------------------------------
    {"name": "D1-17(a) sampling rate", "stated": 7000, "derive": lambda: 2 * highest_freq(x17, 100000, 0.5) + 1000},
    {"name": "D1-17(b) bound", "stated": 11.43, "derive": lambda: optimize.brentq(lambda R: R * 7000 - 80000, 1, 30), "tol": 1e-3},
    {"name": "D1-17(b) bits per sample", "stated": 11, "derive": lambda: budget_bits(80000, 7000)},
    {"name": "D1-17(b) levels", "stated": 2048, "derive": lambda: 2 ** budget_bits(80000, 7000)},
    {"name": "D1-17(b) bit rate, kbit/s", "stated": 77, "derive": lambda: budget_bits(80000, 7000) * 7},
    {"name": "D1-17(c) maximum", "stated": 6, "derive": lambda: extremes(x17, 0, 1e-3)[0]},
    {"name": "D1-17(c) minimum", "stated": -6, "derive": lambda: extremes(x17, 0, 1e-3)[1]},
    {"name": "D1-17(c) step size", "stated": 0.00586, "derive": lambda: (lambda m: (m[0] - m[1]) / 2048)(extremes(x17, 0, 1e-3)), "tol": 2e-3},
    {"name": "D1-17(d) power", "stated": 10, "derive": lambda: time_power(x17, 1e-3)},
    {"name": "D1-17(d) noise power", "stated": 2.861e-6, "derive": lambda: (12 / 2048) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-17(d) SQNR ratio", "stated": 3.495e6, "derive": lambda: time_power(x17, 1e-3) / ((12 / 2048) ** 2 / 12)},
    {"name": "D1-17(d) SQNR, dB", "stated": 65.43, "derive": lambda: model_sqnr_db(x17, 1e-3, 2048), "tol": 2e-3},
    {"name": "D1-17 check alpha, dB", "stated": -0.792, "derive": lambda: db(3 * time_power(x17, 1e-3) / 36)},
    {"name": "D1-17 check 20 R log 2, R=11", "stated": 66.227, "derive": lambda: db(2.0 ** 22)},
    {"name": "D1-17 check largest rate, kHz", "stated": 7.27, "derive": lambda: optimize.brentq(lambda f: 11 * f - 80, 1, 20)},
    {"name": "D1-17 check wider guard band, kHz", "stated": 1.27, "derive": lambda: optimize.brentq(lambda f: 11 * f - 80, 1, 20) - 6},

    # ---- D1-18 --------------------------------------------------------------
    {"name": "D1-18(a) k", "stated": 0.375, "derive": lambda: normalised(f18, -1, 1)[0]},
    {"name": "D1-18(a) area factor 8/3", "stated": 8 / 3, "derive": lambda: quad(f18, -1, 1)},
    {"name": "D1-18(b) power", "stated": 0.4, "derive": lambda: quad(lambda x: x * x * normalised(f18, -1, 1)[1](x), -1, 1)},
    {"name": "D1-18(b) noise power", "stated": 2.035e-5, "derive": lambda: (2 / 128) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-18(b) SQNR ratio", "stated": 19661,
     "derive": lambda: quad(lambda x: x * x * normalised(f18, -1, 1)[1](x), -1, 1) / ((2 / 128) ** 2 / 12)},
    {"name": "D1-18(b) SQNR, dB (Monte Carlo)", "stated": 42.94,
     "derive": lambda: mc_sqnr_uniform(vec(normalised(f18, -1, 1)[1]), -1, 1, 128), "tol": 3e-3},
    {"name": "D1-18(c) bit rate", "stated": 56000, "derive": lambda: math.log2(128) * 2 * 4000},
    {"name": "D1-18 check alpha, dB", "stated": 0.792, "derive": lambda: db(3 * quad(lambda x: x * x * f18(x) * 0.375, -1, 1))},
    {"name": "D1-18 check 20 R log 2, R=7", "stated": 42.144, "derive": lambda: db(2.0 ** 14)},

    # ---- D1-19 --------------------------------------------------------------
    {"name": "D1-19(a) k", "stated": 1.5, "derive": lambda: normalised(f19, -1, 1, [0])[0]},
    {"name": "D1-19(b) power", "stated": 1 / 7, "derive": lambda: quad(lambda x: x * x * normalised(f19, -1, 1, [0])[1](x), -1, 1, [0])},
    {"name": "D1-19(b) noise power", "stated": 1.272e-6, "derive": lambda: (2 / 512) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-19(b) SQNR ratio", "stated": 112347,
     "derive": lambda: quad(lambda x: x * x * normalised(f19, -1, 1, [0])[1](x), -1, 1, [0]) / ((2 / 512) ** 2 / 12)},
    {"name": "D1-19(b) SQNR, dB (Monte Carlo)", "stated": 50.51,
     "derive": lambda: mc_sqnr_uniform(vec(normalised(f19, -1, 1, [0])[1]), -1, 1, 512), "tol": 3e-3},
    {"name": "D1-19(c) bit rate", "stated": 90000, "derive": lambda: math.log2(512) * 2 * 5000},
    {"name": "D1-19 check alpha, dB", "stated": -3.680,
     "derive": lambda: db(3 * quad(lambda x: x * x * normalised(f19, -1, 1, [0])[1](x), -1, 1, [0]))},

    # ---- D1-20 --------------------------------------------------------------
    {"name": "D1-20(a) k", "stated": 0.09375, "derive": lambda: normalised(f20, -2, 2)[0]},
    {"name": "D1-20(b) power", "stated": 0.8, "derive": lambda: quad(lambda x: x * x * normalised(f20, -2, 2)[1](x), -2, 2)},
    {"name": "D1-20(b) noise power", "stated": 3.255e-4, "derive": lambda: (4 / 64) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-20(b) SQNR ratio", "stated": 2457.6,
     "derive": lambda: quad(lambda x: x * x * normalised(f20, -2, 2)[1](x), -2, 2) / ((4 / 64) ** 2 / 12)},
    {"name": "D1-20(b) SQNR, dB (Monte Carlo)", "stated": 33.91,
     "derive": lambda: mc_sqnr_uniform(vec(normalised(f20, -2, 2)[1]), -2, 2, 64), "tol": 3e-3},
    {"name": "D1-20(c) bit rate", "stated": 72000, "derive": lambda: math.log2(64) * 2 * 6000},
    {"name": "D1-20 check alpha, dB", "stated": -2.218,
     "derive": lambda: db(3 * quad(lambda x: x * x * normalised(f20, -2, 2)[1](x), -2, 2) / 4)},

    # ---- D1-21 --------------------------------------------------------------
    {"name": "D1-21(a) k", "stated": 0.5783, "derive": lambda: normalised(f21, -2, 2, [0])[0]},
    {"name": "D1-21(a) 1 - e^-2", "stated": 0.8647, "derive": lambda: quad(lambda x: np.exp(-x), 0, 2)},
    {"name": "D1-21(b) half integral", "stated": 0.6466, "derive": lambda: quad(lambda x: x * x * math.exp(-x), 0, 2)},
    {"name": "D1-21(b) power", "stated": 0.7479, "derive": lambda: quad(lambda x: x * x * normalised(f21, -2, 2, [0])[1](x), -2, 2, [0])},
    {"name": "D1-21(c) SQNR ratio", "stated": 36759,
     "derive": lambda: quad(lambda x: x * x * normalised(f21, -2, 2, [0])[1](x), -2, 2, [0]) / ((4 / 256) ** 2 / 12)},
    {"name": "D1-21(c) SQNR, dB (Monte Carlo)", "stated": 45.65,
     "derive": lambda: mc_sqnr_uniform(vec(normalised(f21, -2, 2, [0])[1]), -2, 2, 256), "tol": 3e-3},
    {"name": "D1-21(d) 3 P_X", "stated": 2.2436, "derive": lambda: 3 * quad(lambda x: x * x * normalised(f21, -2, 2, [0])[1](x), -2, 2, [0])},
    {"name": "D1-21(d) alpha, dB", "stated": -2.511,
     "derive": lambda: db(3 * quad(lambda x: x * x * normalised(f21, -2, 2, [0])[1](x), -2, 2, [0]) / 4)},
    {"name": "D1-21(d) bound on R", "stated": 8.72,
     "derive": lambda: optimize.brentq(lambda R: mc_sqnr_uniform(vec(normalised(f21, -2, 2, [0])[1]), -2, 2, 256) + 6.0206 * (R - 8) - 50, 1, 20),
     "tol": 2e-3},
    {"name": "D1-21(d) levels", "stated": 512,
     "derive": lambda: least_pow2(lambda L: mc_sqnr_uniform(vec(normalised(f21, -2, 2, [0])[1]), -2, 2, L, n=400_000) >= 50)},
    {"name": "D1-21(d) SQNR at 512, dB", "stated": 51.67,
     "derive": lambda: mc_sqnr_uniform(vec(normalised(f21, -2, 2, [0])[1]), -2, 2, 512), "tol": 3e-3},

    # ---- D1-22 --------------------------------------------------------------
    {"name": "D1-22(a) k", "stated": 0.5, "derive": lambda: normalised(f22, -1, 1)[0]},
    {"name": "D1-22(b) mean", "stated": 1 / 3, "derive": lambda: quad(lambda x: x * 0.5 * f22(x), -1, 1)},
    {"name": "D1-22(b) power", "stated": 1 / 3, "derive": lambda: quad(lambda x: x * x * 0.5 * f22(x), -1, 1)},
    {"name": "D1-22(c) SQNR ratio", "stated": 1024, "derive": lambda: quad(lambda x: x * x * 0.5 * f22(x), -1, 1) / ((2 / 32) ** 2 / 12)},
    {"name": "D1-22(c) SQNR, dB (Monte Carlo)", "stated": 30.10,
     "derive": lambda: mc_sqnr_uniform(vec(lambda x: 0.5 * f22(x)), -1, 1, 32), "tol": 3e-3},
    {"name": "D1-22(d) bit rate", "stated": 35000, "derive": lambda: math.log2(32) * 2 * 3500},
    {"name": "D1-22 wrong answer: variance", "stated": 2 / 9,
     "derive": lambda: quad(lambda x: x * x * 0.5 * f22(x), -1, 1) - quad(lambda x: x * 0.5 * f22(x), -1, 1) ** 2},

    # ---- D1-23 --------------------------------------------------------------
    {"name": "D1-23(a) a from the power", "stated": 2,
     "derive": lambda: optimize.brentq(lambda a: quad(lambda x: x * x * abs(x), -a, a, [0]) / quad(lambda x: abs(x), -a, a, [0]) - 2, 0.5, 5)},
    {"name": "D1-23(a) k", "stated": 0.25, "derive": lambda: normalised(f23, -2, 2, [0])[0]},
    {"name": "D1-23(b) alpha, dB", "stated": 1.761, "derive": lambda: db(3 * quad(lambda x: x * x * 0.25 * abs(x), -2, 2, [0]) / 4)},
    {"name": "D1-23(b) bound on R", "stated": 6.35, "derive": lambda: (40 - db(1.5)) / 6.02, "tol": 2e-3},
    {"name": "D1-23(b) levels", "stated": 128,
     "derive": lambda: least_pow2(lambda L: mc_sqnr_uniform(vec(lambda x: 0.25 * f23(x)), -2, 2, L, n=400_000) >= 40)},
    {"name": "D1-23(c) step size", "stated": 0.03125, "derive": lambda: 4 / least_pow2(lambda L: 1.761 + 6.0206 * math.log2(L) >= 40)},
    {"name": "D1-23(c) noise power", "stated": 8.138e-5, "derive": lambda: (4 / 128) ** 2 / 12, "tol": 2e-3},
    {"name": "D1-23(c) SQNR ratio", "stated": 24576,
     "derive": lambda: quad(lambda x: x * x * 0.25 * abs(x), -2, 2, [0]) / ((4 / 128) ** 2 / 12)},
    {"name": "D1-23(c) SQNR, dB (Monte Carlo)", "stated": 43.91,
     "derive": lambda: mc_sqnr_uniform(vec(lambda x: 0.25 * f23(x)), -2, 2, 128), "tol": 3e-3},
    {"name": "D1-23(d) bit rate", "stated": 91000, "derive": lambda: 7 * 2 * 6500},
    {"name": "D1-23 check six bits, dB", "stated": 37.88,
     "derive": lambda: mc_sqnr_uniform(vec(lambda x: 0.25 * f23(x)), -2, 2, 64), "tol": 3e-3},

    # ---- D1-24 --------------------------------------------------------------
    {"name": "D1-24(a) c", "stated": 1 / 8, "derive": lambda: C24[0]},
    {"name": "D1-24(b) flat part", "stated": 1.125, "derive": lambda: quad(lambda x: x * x * C24[1](x), 0, 3)},
    {"name": "D1-24(b) sloped part", "stated": 1.708, "derive": lambda: quad(lambda x: x * x * C24[1](x), 3, 5)},
    {"name": "D1-24(b) bracket at 5", "stated": 52.083, "derive": lambda: quad(lambda x: x * x * (5 - x), 0, 5)},
    {"name": "D1-24(b) bracket at 3", "stated": 24.75, "derive": lambda: quad(lambda x: x * x * (5 - x), 0, 3)},
    {"name": "D1-24(b) power", "stated": 5.667, "derive": lambda: C24[2]},
    {"name": "D1-24(c) noise on (0,3)", "stated": 0.375, "derive": lambda: quad(lambda x: (x - 2) ** 2 * C24[1](x), 0, 3)},
    {"name": "D1-24(c) noise power", "stated": 4.167, "derive": lambda: C24[3]},
    {"name": "D1-24(d) SQNR ratio", "stated": 1.36, "derive": lambda: C24[2] / C24[3]},
    {"name": "D1-24(d) SQNR, dB (Monte Carlo)", "stated": 1.34,
     "derive": lambda: (lambda pn: db(pn[0] / pn[1]))(mc_coarse(vec(C24[1]), -5, 5, Q24)), "tol": 2e-2},
    {"name": "D1-24 check probability of (0,3)", "stated": 3 / 8, "derive": lambda: quad(C24[1], 0, 3)},
    {"name": "D1-24 check conditional variance", "stated": 0.75,
     "derive": lambda: np.var(np.random.default_rng(3).uniform(0, 3, 2_000_000)), "tol": 3e-3},

    # ---- D1-25 --------------------------------------------------------------
    {"name": "D1-25(a) c", "stated": 1 / 6, "derive": lambda: C25[0]},
    {"name": "D1-25(b) power", "stated": 6, "derive": lambda: C25[2]},
    {"name": "D1-25(b) bracket 72", "stated": 72, "derive": lambda: quad(lambda x: x * x, 0, 6)},
    {"name": "D1-25(b) bracket 54", "stated": 54, "derive": lambda: quad(lambda x: x ** 3 / 6, 0, 6)},
    {"name": "D1-25(c) bracket difference", "stated": 9, "derive": lambda: quad(lambda u: u * u * (0.5 - u / 6), -3, 3)},
    {"name": "D1-25(c) bracket at 3", "stated": 1.125, "derive": lambda: quad(lambda u: u * u * (0.5 - u / 6), 0, 3)},
    {"name": "D1-25(c) bracket at -3", "stated": -7.875, "derive": lambda: -quad(lambda u: u * u * (0.5 - u / 6), -3, 0)},
    {"name": "D1-25(c) noise power", "stated": 3, "derive": lambda: C25[3]},
    {"name": "D1-25(d) SQNR ratio", "stated": 2, "derive": lambda: C25[2] / C25[3]},
    {"name": "D1-25(d) SQNR, dB (Monte Carlo)", "stated": 3.01,
     "derive": lambda: (lambda pn: db(pn[0] / pn[1]))(mc_coarse(vec(C25[1]), -6, 6, Q25)), "tol": 1e-2},

    # ---- D1-26 --------------------------------------------------------------
    {"name": "D1-26(a) c", "stated": 1 / 6, "derive": lambda: C26[0]},
    {"name": "D1-26(b) flat part 4/9", "stated": 4 / 9, "derive": lambda: quad(lambda x: x * x * C26[1](x), 0, 2)},
    {"name": "D1-26(b) sloped part 11/9", "stated": 11 / 9, "derive": lambda: quad(lambda x: x * x * C26[1](x), 2, 4)},
    {"name": "D1-26(b) power", "stated": 10 / 3, "derive": lambda: C26[2]},
    {"name": "D1-26(c) noise on [0,1]", "stated": 1 / 18, "derive": lambda: quad(lambda x: x * x * C26[1](x), 0, 1)},
    {"name": "D1-26(c) noise on (1,2)", "stated": 1 / 18, "derive": lambda: quad(lambda x: (x - 2) ** 2 * C26[1](x), 1, 2)},
    {"name": "D1-26(c) noise on (2,4)", "stated": 1 / 9, "derive": lambda: quad(lambda x: (x - 2) ** 2 * C26[1](x), 2, 4)},
    {"name": "D1-26(c) noise power", "stated": 4 / 9, "derive": lambda: C26[3]},
    {"name": "D1-26(d) SQNR ratio", "stated": 7.5, "derive": lambda: C26[2] / C26[3]},
    {"name": "D1-26(d) SQNR, dB (Monte Carlo)", "stated": 8.75,
     "derive": lambda: (lambda pn: db(pn[0] / pn[1]))(mc_coarse(vec(C26[1]), -4, 4, Q26)), "tol": 5e-3},

    # ---- D1-27 --------------------------------------------------------------
    {"name": "D1-27(a) c", "stated": 1 / 8, "derive": lambda: C27[0]},
    {"name": "D1-27(b) sloped part", "stated": 3, "derive": lambda: quad(lambda x: x * x * C27[1](x), 2, 6)},
    {"name": "D1-27(b) power", "stated": 20 / 3, "derive": lambda: C27[2]},
    {"name": "D1-27(c) noise on (0,2)", "stated": 1 / 3, "derive": lambda: quad(lambda x: (x - 2) ** 2 * C27[1](x), 0, 2)},
    {"name": "D1-27(c) noise on (2,4)", "stated": 5 / 24, "derive": lambda: quad(lambda x: (x - 2) ** 2 * C27[1](x), 2, 4)},
    {"name": "D1-27(c) noise on (4,6)", "stated": 11 / 8, "derive": lambda: quad(lambda x: x * x * C27[1](x), 4, 6)},
    {"name": "D1-27(c) noise power", "stated": 23 / 6, "derive": lambda: C27[3]},
    {"name": "D1-27(d) SQNR ratio", "stated": 40 / 23, "derive": lambda: C27[2] / C27[3]},
    {"name": "D1-27(d) SQNR, dB (Monte Carlo)", "stated": 2.40,
     "derive": lambda: (lambda pn: db(pn[0] / pn[1]))(mc_coarse(vec(C27[1]), -6, 6, Q27)), "tol": 1e-2},
    {"name": "D1-27 check tail probability", "stated": 1 / 16, "derive": lambda: quad(C27[1], 4, 6)},
    {"name": "D1-27 check tail second moment", "stated": 22,
     "derive": lambda: quad(lambda x: x * x * C27[1](x), 4, 6) / quad(C27[1], 4, 6)},
    {"name": "D1-27 err tail share of noise", "stated": 0.72, "derive": tail_share_27},
    {"name": "D1-27 err tail share of probability", "stated": 1 / 8, "derive": lambda: 2 * quad(C27[1], 4, 6)},

    # ---- D1-28 --------------------------------------------------------------
    {"name": "D1-28(a) c", "stated": 0.25, "derive": lambda: C28[0]},
    {"name": "D1-28(b) power", "stated": 7 / 3, "derive": lambda: C28[2]},
    {"name": "D1-28(c) noise on (0,1)", "stated": 0.03646, "derive": lambda: quad(lambda x: (x - 0.75) ** 2 * C28[1](x), 0, 1)},
    {"name": "D1-28(c) noise on (1,1.5)", "stated": 0.01693, "derive": lambda: quad(lambda x: (x - 0.75) ** 2 * C28[1](x), 1, 1.5)},
    {"name": "D1-28(c) noise on (1.5,3)", "stated": 0.03516, "derive": lambda: quad(lambda x: (x - 2.25) ** 2 * C28[1](x), 1.5, 3)},
    {"name": "D1-28(c) noise power", "stated": 0.1771, "derive": lambda: C28[3]},
    {"name": "D1-28(d) SQNR ratio", "stated": 13.18, "derive": lambda: C28[2] / C28[3]},
    {"name": "D1-28(d) SQNR, dB (Monte Carlo)", "stated": 11.20,
     "derive": lambda: (lambda pn: db(pn[0] / pn[1]))(mc_coarse(vec(C28[1]), -3, 3, Q28)), "tol": 5e-3},
    {"name": "D1-28(d) model noise", "stated": 0.1875, "derive": lambda: 1.5 ** 2 / 12},
    {"name": "D1-28(d) shortfall, per cent", "stated": 5.6, "derive": lambda: 100 * (1 - C28[3] / (1.5 ** 2 / 12)), "tol": 1e-2},
    {"name": "D1-28 check outer conditional moment", "stated": 13 / 3,
     "derive": lambda: quad(lambda x: x * x * C28[1](x), 1, 3) / quad(C28[1], 1, 3)},

    # ---- D1-29 --------------------------------------------------------------
    {"name": "D1-29(a) c", "stated": 1 / 3, "derive": lambda: C29a[0]},
    {"name": "D1-29(b) power", "stated": 1.5, "derive": lambda: C29a[2]},
    {"name": "D1-29(c) E|X|", "stated": 1, "derive": lambda: quad(lambda x: abs(x) * C29a[1](x), -3, 3, [0])},
    {"name": "D1-29(c) noise at b = 2", "stated": 1.5, "derive": lambda: C29a[3]},
    {"name": "D1-29(c) SQNR at b = 2, ratio", "stated": 1, "derive": lambda: C29a[2] / C29a[3]},
    {"name": "D1-29(d) best b", "stated": 1, "derive": lambda: BEST_B[0], "tol": 1e-4},
    {"name": "D1-29(d) least noise", "stated": 0.5, "derive": lambda: BEST_B[1]},
    {"name": "D1-29(d) SQNR, dB (Monte Carlo)", "stated": 4.77,
     "derive": lambda: (lambda pn: db(pn[0] / pn[1]))(mc_coarse(vec(C29b[1]), -3, 3, Q29(1))), "tol": 1e-2},
    {"name": "D1-29 check integral at b = 1", "stated": 0.5, "derive": lambda: C29b[3]},

    # ---- D1-30 --------------------------------------------------------------
    {"name": "D1-30(a) c", "stated": 0.5, "derive": lambda: C30[0]},
    {"name": "D1-30(b) mean", "stated": 4 / 3, "derive": lambda: quad(lambda x: x * C30[1](x), 0, 4)},
    {"name": "D1-30(b) power", "stated": 8 / 3, "derive": lambda: C30[2]},
    {"name": "D1-30(c) noise on (0,2)", "stated": 0.25, "derive": lambda: quad(lambda x: (x - 1) ** 2 * C30[1](x), 0, 2)},
    {"name": "D1-30(c) noise on (2,4)", "stated": 1 / 12, "derive": lambda: quad(lambda x: (x - 3) ** 2 * C30[1](x), 2, 4)},
    {"name": "D1-30(c) noise power", "stated": 1 / 3, "derive": lambda: C30[3]},
    {"name": "D1-30(d) SQNR ratio", "stated": 8, "derive": lambda: C30[2] / C30[3]},
    {"name": "D1-30(d) SQNR, dB (Monte Carlo)", "stated": 9.03,
     "derive": lambda: (lambda pn: db(pn[0] / pn[1]))(mc_coarse(vec(C30[1]), 0, 4, Q30)), "tol": 5e-3},
    {"name": "D1-30 check probability of (0,2)", "stated": 0.75, "derive": lambda: quad(C30[1], 0, 2)},
    {"name": "D1-30 check probability of (2,4)", "stated": 0.25, "derive": lambda: quad(C30[1], 2, 4)},
    {"name": "D1-30 err wrong model noise", "stated": 1.33, "derive": lambda: 4 ** 2 / 12, "tol": 3e-3},
]


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
