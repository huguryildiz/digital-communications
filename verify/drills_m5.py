"""Re-derives every number stated in the Module 5 practice questions (D5-01 ... D5-30).

Six questions (D5-09, D5-14, D5-15, D5-16, D5-17, D5-20) take their shape from
textbook problems. Their checks sit in their own section below and use the same idea:
a sampled spectrum, a Simpson integral of the full tone product, a distance
table and label table, a projection of the sampled received waveform, and a
Monte Carlo run, never the closed form the solution writes down.

Each question gives a set of carrier waveforms. The solutions work with trig
identities and signal-space coordinates. The checks here take a different road:
the waveforms are sampled on a dense grid and every energy, inner product and
distance is a numerical integral of the sampled waveforms. The nearest-neighbour
count is counted from that distance table, the regions are found by classifying
grid points to the nearest waveform, and Q values come from the Gaussian tail
in scipy. The one exact error probability (D5-25) is checked by Monte Carlo.

Same shape as verify_drills.py: a CHECKS list of dicts with a `derive` callable
and a relative tolerance, and the same runner.
"""

import functools
import math
import sys

import numpy as np
from scipy import integrate
from scipy.stats import norm

DEFAULT_TOL = 5e-3
Q = norm.sf
PI = math.pi


# ── sampled waveforms ───────────────────────────────────────────────────────

class WaveSet:
    """A set of waveforms on 0 <= t <= T, sampled finely enough for Simpson's
    rule to integrate products of carriers to better than 1e-6."""

    def __init__(self, funcs, T, fmax):
        n = int(max(64 * fmax * T, 4000))
        n += n % 2
        self.t = np.linspace(0.0, T, n + 1)
        self.w = [np.asarray(f(self.t), dtype=float) * np.ones_like(self.t) for f in funcs]
        self.M = len(funcs)

    def ip(self, i, j):
        return integrate.simpson(self.w[i] * self.w[j], x=self.t)

    def energy(self, i):
        return self.ip(i, i)

    def e_avg(self):
        return float(np.mean([self.energy(i) for i in range(self.M)]))

    def dist(self, i, j):
        d = self.w[i] - self.w[j]
        return math.sqrt(max(integrate.simpson(d * d, x=self.t), 0.0))

    def table(self):
        D = np.full((self.M, self.M), np.inf)
        for i in range(self.M):
            for j in range(i + 1, self.M):
                D[i, j] = D[j, i] = self.dist(i, j)
        return D

    def dmin(self):
        return float(self.table().min())

    def nmin(self, rel=1e-4):
        D = self.table()
        d = D.min()
        return float((np.abs(D - d) < rel * d).sum() / self.M)

    def coef(self):
        """d_min^2 / E_s,avg."""
        return self.dmin() ** 2 / self.e_avg()

    def coords(self):
        """Gram-Schmidt on the sampled waveforms, in the order given."""
        basis = []
        for w in self.w:
            r = w.copy()
            for b in basis:
                r = r - integrate.simpson(r * b, x=self.t) * b
            e = integrate.simpson(r * r, x=self.t)
            if e > 1e-8:
                basis.append(r / math.sqrt(e))
        return basis


def cosw(A, f, th=0.0):
    return lambda t: A * np.cos(2 * PI * f * t + th)


def nn_pe(ws, es_n0):
    """N_min Q(sqrt(d^2/2N0)) with N0 = E_avg / (E_avg/N0), from the sampled set."""
    n0 = ws.e_avg() / es_n0
    return ws.nmin() * Q(math.sqrt(ws.dmin() ** 2 / (2 * n0)))


def db(x):
    return 10 * math.log10(x)


def nearest_label(points, x):
    return int(np.argmin([np.hypot(x[0] - p[0], x[1] - p[1]) for p in points]))


def thresholds_1d(points, lo, hi, n=200001):
    """Decision thresholds of a one-dimensional set, found by classifying a grid."""
    xs = np.linspace(lo, hi, n)
    P = np.array(points)[:, None]
    lab = np.argmin(np.abs(xs[None, :] - P), axis=0)
    ch = np.nonzero(np.diff(lab))[0]
    return [(xs[k] + xs[k + 1]) / 2 for k in ch]


# ── the sets, written from the question statements ─────────────────────────

S01 = WaveSet([cosw(math.sqrt(18), 1500, PI * (2 * k + 1) / 6) for k in range(1, 7)], 1, 1500)
S02 = WaveSet([cosw(math.sqrt(24), 1000, PI * (4 * k - 3) / 6) for k in range(1, 4)], 1, 1000)
S03 = WaveSet([cosw(2, 2000, (2 * k - 1) * PI / 8) for k in range(1, 9)], 2, 2000)
S04 = WaveSet([cosw(2 * (2 * k - 5), 2500) for k in range(1, 5)], 1, 2500)
S05 = WaveSet([cosw(3 * math.sqrt(2) * (k - 1), 1500) for k in range(1, 4)], 1, 1500)
S06 = WaveSet([cosw(2 * (k - 3), 2000) for k in range(1, 6)], 0.5, 2000)
S07 = WaveSet([lambda t: 0 * t] + [cosw(2 * math.sqrt(2), 1000, PI / 2 + 2 * PI * (k - 2) / 3) for k in range(2, 5)], 1, 1000)


def qam_wave(a, b, f, amp=math.sqrt(2)):
    return lambda t: amp * (a * np.cos(2 * PI * f * t) - b * np.sin(2 * PI * f * t))


S08 = WaveSet([qam_wave(2 * m - 5, 2 * n - 3, 1500) for n in (1, 2) for m in range(1, 5)], 1, 1500)
S10 = WaveSet([cosw(math.sqrt(2) if k % 2 else 4.0, 1000, (k - 1) * PI / 4) for k in range(1, 9)], 1, 1000)
S11 = WaveSet([lambda t: 0 * t, lambda t: math.sqrt(2) * np.cos(4 * PI * t),
               lambda t: -math.sqrt(2) * np.sin(4 * PI * t), lambda t: 2 * np.cos(4 * PI * t + PI / 4)], 1, 2)
S12 = WaveSet([cosw(2 * math.sqrt(3), 1000, PI / 6 + (k - 1) * PI / 2) for k in range(1, 5)], 1, 1000)
S13 = WaveSet([cosw(math.sqrt(2) * (2 * k - 9), 1000) for k in range(1, 9)], 1, 1000)
S18 = WaveSet([cosw(2, 1000), cosw(-2, 1000), cosw(2, 1500), cosw(-2, 1500)], 1, 1500)
S19 = WaveSet([lambda t: 0 * t, cosw(3, 2000), cosw(3, 2500)], 2, 2500)
S21 = WaveSet([cosw(2, 1000, (k - 1) * PI / 2) for k in range(1, 4)] + [cosw(4, 1000, 3 * PI / 2)], 1, 1000)
S22 = WaveSet([cosw(math.sqrt(2), 1500), cosw(-math.sqrt(2), 1500),
               cosw(2 * math.sqrt(2), 1500, PI / 2), cosw(2 * math.sqrt(2), 1500, -PI / 2)], 1, 1500)
# D5-23: the waveforms written in part (b)
S23 = WaveSet([lambda t: 0 * t] + [cosw(2 * math.sqrt(2), 1000, (k - 2) * PI / 2) for k in range(2, 6)], 1, 1000)
S24 = WaveSet([cosw(c * math.sqrt(2), 1000) for c in (-2, 0, 2, 6)], 1, 1000)
S25 = WaveSet([cosw(c * math.sqrt(2), 1000) for c in (-2, 0, 1, 3)], 1, 1000)
S26A = WaveSet([cosw(2 * math.sqrt(5), 1000, k * PI / 8) for k in range(1, 17)], 1, 1000)
S26B = WaveSet([qam_wave(2 * m - 5, 2 * n - 5, 1000) for n in range(1, 5) for m in range(1, 5)], 1, 1000)
S27 = WaveSet([cosw(2, 1000), cosw(2, 1000.75)], 1, 1001)
S27o = WaveSet([cosw(2, 1000), cosw(2, 1000.5)], 1, 1001)
R28 = 1 + math.sqrt(2)
S28 = WaveSet([cosw(math.sqrt(2), 1000, (k - 1) * PI / 2) for k in range(1, 5)]
              + [cosw(R28 * math.sqrt(2), 1000, (k - 5) * PI / 2) for k in range(5, 9)], 1, 1000)
S29 = WaveSet([qam_wave(a, b, 1000) for b in (-1.5, -0.5, 0.5, 1.5) for a in (-1.5, -0.5, 0.5, 1.5)], 1, 1000)
S30 = WaveSet([lambda t: 0 * t] + [cosw(3, 1500, k * PI / 4) for k in range(1, 9)], 2, 1500)


# ── independent side computations ──────────────────────────────────────────

def _proj(ws, i, psi):
    return integrate.simpson(ws.w[i] * psi(ws.t), x=ws.t)


def _psi1_1000(t):
    return math.sqrt(2) * np.cos(2000 * PI * t)


def _psi2_1000(t):
    return -math.sqrt(2) * np.sin(2000 * PI * t)


def _d10_bisector():
    """2x + 4y = 7 separates s1 and s2 of D5-10: the classified grid flips there."""
    pts = [(1, 0), (2, 2)]
    # walk along the line x = 1.2 and find where the nearer point changes
    ys = np.linspace(-1, 3, 400001)
    lab = [(1.2 - 1) ** 2 + y ** 2 > (1.2 - 2) ** 2 + (y - 2) ** 2 for y in ys]
    k = int(np.argmax(lab))
    y = ys[k]
    return 2 * 1.2 + 4 * y


def _d21_bisector():
    ys = np.linspace(-3, 1, 400001)
    x = 0.3
    p1, p4 = (math.sqrt(2), 0), (0, -2 * math.sqrt(2))
    d1 = (x - p1[0]) ** 2 + (ys - p1[1]) ** 2
    d4 = (x - p4[0]) ** 2 + (ys - p4[1]) ** 2
    k = int(np.argmax(d1 < d4))
    return x + 2 * ys[k]


def _d22_bisector():
    ys = np.linspace(-1, 3, 400001)
    x = 0.4
    d1 = (x - 1) ** 2 + ys ** 2
    d3 = x ** 2 + (ys - 2) ** 2
    k = int(np.argmax(d3 < d1))
    return -2 * x + 4 * ys[k]


def _d23_square_edge():
    """The boundary between the zero signal and s2 = (2,0), found on a grid."""
    pts = [(0, 0), (2, 0), (0, 2), (-2, 0), (0, -2)]
    xs = np.linspace(0, 3, 30001)
    lab = [nearest_label(pts, (x, 0.3)) for x in xs]
    k = next(i for i, v in enumerate(lab) if v != 0)
    return (xs[k - 1] + xs[k]) / 2


def _d23_diagonal():
    """Where s2 and s3 swap along psi1 = 2.5: on the diagonal psi2 = psi1."""
    pts = [(0, 0), (2, 0), (0, 2), (-2, 0), (0, -2)]
    ys = np.linspace(0, 4, 40001)
    lab = [nearest_label(pts, (2.5, y)) for y in ys]
    k = next(i for i, v in enumerate(lab) if v == 2)
    return ys[k]


def _d25_monte_carlo():
    rng = np.random.default_rng(20260924)
    pts = np.array([-2.0, 0.0, 1.0, 3.0])
    e_avg = float(np.mean(pts ** 2))
    n0 = e_avg / 28
    n = 4_000_000
    sent = rng.integers(0, 4, n)
    r = pts[sent] + rng.normal(0, math.sqrt(n0 / 2), n)
    dec = np.argmin(np.abs(r[:, None] - pts[None, :]), axis=1)
    return float(np.mean(dec != sent))


def _d27_rho():
    return S27.ip(0, 1) / S27.energy(0)


def _d27_coords():
    b = S27.coords()
    return (integrate.simpson(S27.w[1] * b[0], x=S27.t), integrate.simpson(S27.w[1] * b[1], x=S27.t))


def _d27_angle():
    rho = _d27_rho()
    return math.degrees(math.acos(rho))


def _ring_ratio(R):
    pts = [(math.cos(a), math.sin(a)) for a in (0, PI / 2, PI, 3 * PI / 2)]
    pts += [(R * math.cos(a), R * math.sin(a)) for a in (0, PI / 2, PI, 3 * PI / 2)]
    P = np.array(pts)
    D = np.sqrt(((P[:, None] - P[None]) ** 2).sum(-1)) + np.eye(8) * 1e9
    return D.min() ** 2 / np.mean((P ** 2).sum(1))


def _d28_best_R():
    Rs = np.linspace(1.01, 5, 399001)
    g = [_ring_ratio(R) for R in Rs[::50]]
    k = int(np.argmax(g))
    lo, hi = Rs[::50][max(k - 1, 0)], Rs[::50][min(k + 1, len(g) - 1)]
    fine = np.linspace(lo, hi, 20001)
    gg = [_ring_ratio(R) for R in fine]
    return float(fine[int(np.argmax(gg))])


def _d28_best_ratio():
    return _ring_ratio(_d28_best_R())


def _d29_M():
    """Search square grids for d_min^2/E = 0.4 and N_min = 3."""
    for L in (2, 4, 8, 16):
        lv = np.arange(L) - (L - 1) / 2
        P = np.array([(a, b) for a in lv for b in lv])
        D = np.sqrt(((P[:, None] - P[None]) ** 2).sum(-1)) + np.eye(L * L) * 1e9
        c = D.min() ** 2 / np.mean((P ** 2).sum(1))
        n = (np.abs(D - D.min()) < 1e-9).sum() / (L * L)
        if abs(c - 0.4) < 1e-9 and abs(n - 3) < 1e-9:
            return L * L
    return -1


def _d24_thresholds():
    return thresholds_1d([-2, 0, 2, 6], -10, 10)


# ── the four textbook-shaped questions (D5-09, D5-14, D5-16, D5-17) ─────────

# D5-09. The occupied band is measured on a sampled raised-cosine spectrum as
# the width where it is nonzero; the distance ratios come from square grids
# built point by point, not from the 6E_s/(M-1) formula the solution uses.

def _rc_band(rs, alpha):
    """Width (MHz) of the support of a raised-cosine spectrum with symbol rate rs."""
    f = np.linspace(-3 * rs, 3 * rs, 600001)
    a = np.abs(f)
    f1, f2 = (1 - alpha) * rs / 2, (1 + alpha) * rs / 2
    s = np.where(a <= f1, 1.0,
                 np.where(a >= f2, 0.0, 0.5 * (1 + np.cos(PI * (a - f1) / (alpha * rs)))))
    on = f[s > 1e-12]
    return float(on.max() - on.min())


def _grid_ratio(M):
    """d_min^2 / E_s of square M-QAM, from its points."""
    L = int(round(math.sqrt(M)))
    lv = np.arange(L) - (L - 1) / 2
    P = np.array([(a, b) for a in lv for b in lv])
    D = np.sqrt(((P[:, None] - P[None]) ** 2).sum(-1)) + np.eye(M) * 1e9
    return D.min() ** 2 / np.mean((P ** 2).sum(1))


def _d09_power(M, rb, p16=250.0):
    """Power for the same d_min as 16-QAM at 48 Mb/s: E_s scales by the ratio of
    d_min^2/E_s, and P = E_s R_s."""
    rs16, rs = 48 / 4, rb / math.log2(M)
    return p16 * (_grid_ratio(16) / _grid_ratio(M)) * (rs / rs16)


# D5-14. The inner products are Simpson integrals of the full sampled product,
# sum-frequency term included; the least spacings are found by scanning.

def _d14_rho(df, dphi, T=0.002, f0=20000.0):
    t = np.linspace(0.0, T, 40001)
    s0 = np.cos(2 * PI * f0 * t)
    s1 = np.cos(2 * PI * (f0 + df) * t + dphi)
    return integrate.simpson(s0 * s1, x=t) / integrate.simpson(s0 * s0, x=t)


def _d14_first_zero(fn, lo=20.0, hi=900.0, step=5.0):
    """The first sign change of fn on a scan, refined by bisection."""
    f = lo
    a = fn(f)
    while f < hi:
        g = f + step
        b = fn(g)
        if a == 0 or a * b < 0:
            x0, x1, fa = f, g, a
            for _ in range(40):
                m = (x0 + x1) / 2
                fm = fn(m)
                if fa * fm <= 0:
                    x1 = m
                else:
                    x0, fa = m, fm
            return (x0 + x1) / 2
        f, a = g, b
    return float("nan")


@functools.lru_cache(maxsize=None)
def _d14_worst(df):
    """Largest |rho| over a grid of phase differences."""
    return max(abs(_d14_rho(df, p)) for p in np.linspace(0, 2 * PI, 73))


@functools.lru_cache(maxsize=None)
def _d14_all_phase_spacing():
    """The least spacing where the worst |rho| over all phases vanishes, found by
    scanning for its first minimum and checking it is (numerically) zero."""
    fs = np.arange(50.0, 800.0, 10.0)
    w = [_d14_worst(f) for f in fs]
    k = next(i for i in range(1, len(w) - 1) if w[i] <= w[i - 1] and w[i] <= w[i + 1])
    fine = np.arange(fs[k] - 10, fs[k] + 10.01, 0.5)
    wf = [_d14_worst(f) for f in fine]
    j = int(np.argmin(wf))
    return float(fine[j]) if wf[j] < 5e-3 else float("nan")


# D5-16. The three sets are built from their statements, scaled numerically to
# E_s = 9, and every count is taken from the distance table and label table.

G3 = [0b000, 0b001, 0b011, 0b010, 0b110, 0b111, 0b101, 0b100]


def _scaled(P, es=9.0):
    P = np.array(P, dtype=float)
    return P * math.sqrt(es / np.mean((P ** 2).sum(1)))


def _pairs(P):
    D = np.sqrt(((P[:, None] - P[None]) ** 2).sum(-1)) + np.eye(len(P)) * 1e9
    d = D.min()
    return d, [(i, j) for i in range(len(P)) for j in range(i + 1, len(P)) if abs(D[i, j] - d) < 1e-9 * (1 + d)]


H = math.sqrt(3) / 2
D16A = _scaled([(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)])
D16B = _scaled([(-1, H), (0, H), (1, H), (-0.5, 0), (0.5, 0), (-1, -H), (0, -H), (1, -H)])
D16C = _scaled([((2 * k - 9) / 2, 0) for k in range(1, 9)])
L16A = G3
L16B = [0b000, 0b001, 0b011, 0b100, 0b101, 0b010, 0b110, 0b111]
L16C = G3


def _w(P, lab):
    d, pr = _pairs(P)
    return 2 * sum(bin(lab[i] ^ lab[j]).count("1") for i, j in pr) / len(P)


def _max_one_bit(P, lab):
    """Largest number of differing bits over the d_min pairs: 1 for a Gray labelling."""
    d, pr = _pairs(P)
    return max(bin(lab[i] ^ lab[j]).count("1") for i, j in pr)


def _d16_max_degree(P):
    d, pr = _pairs(P)
    deg = [0] * len(P)
    for i, j in pr:
        deg[i] += 1
        deg[j] += 1
    return max(deg)


def _d16_best_B():
    """The least total of differing bits over set B's d_min pairs, over all 8!
    labellings. Above 13 means no labelling of B is Gray."""
    import itertools
    d, pr = _pairs(D16B)
    best = 99
    for perm in itertools.permutations(range(8)):
        w = sum(bin(perm[i] ^ perm[j]).count("1") for i, j in pr)
        best = min(best, w)
    return best


def _d16_pb(P, lab, eb_n0, eb=3.0):
    d, _ = _pairs(P)
    n0 = eb / eb_n0
    return _w(P, lab) / 3 * Q(math.sqrt(d * d / (2 * n0)))


def _d16_ratio(P, eb=3.0):
    d, _ = _pairs(P)
    return d * d / eb


# D5-17. The outputs are projections of the sampled received waveform; the
# error at 60 degrees is also measured by Monte Carlo on the psi_1 output.

def _d17_proj(deg, which, eb=1.0, T=1.0, fc=50.0):
    t = np.linspace(0.0, T, 200001)
    r = math.sqrt(2 * eb / T) * np.cos(2 * PI * fc * t + math.radians(deg))
    psi = (math.sqrt(2 / T) * np.cos(2 * PI * fc * t) if which == 1
           else -math.sqrt(2 / T) * np.sin(2 * PI * fc * t))
    return integrate.simpson(r * psi, x=t)


def _d17_pb(deg, eb_n0=8.0):
    """The error from the projected distance to psi_1 = 0 and sigma = sqrt(N0/2)."""
    y = _d17_proj(deg, 1)
    return Q(y / math.sqrt(1.0 / eb_n0 / 2))


def _d17_mc(deg, eb_n0=8.0, n=2_000_000):
    rng = np.random.default_rng(20260925)
    y = _d17_proj(deg, 1)
    r = y + rng.normal(0, math.sqrt(1.0 / eb_n0 / 2), n)
    return float(np.mean(r < 0))


def _d17_loss(deg):
    """The E_b/N_0 factor that brings the error at deg back to the error at 0."""
    from scipy.optimize import brentq
    target = _d17_pb(0)
    k = brentq(lambda g: _d17_pb(deg, 8.0 * g) - target, 1.0, 100.0, xtol=1e-12)
    return db(k)


# D5-15 and D5-20. The budget is computed in watts and metres and taken to
# decibels once: N0 = kT0 F with kT0 at the -174 dBm/Hz the questions state,
# the received power from the linear Friis formula, the range by bisection on
# it, the required E_b/N_0 by root finding on a neighbour count and distance
# taken from each point set, never from the closed forms the solutions use.

KT0_W = 1e-3 * 10 ** (-17.4)


def _dbm(w):
    return 10 * math.log10(w / 1e-3)


def _n0(nf_db):
    return KT0_W * 10 ** (nf_db / 10)


def _sens(ebn0_db, rb, nf_db):
    return _dbm(10 ** (ebn0_db / 10) * rb * _n0(nf_db))


def _friis(pt_dbm, gt_dbi, gr_dbi, f, d):
    lam = 3e8 / f
    return _dbm(1e-3 * 10 ** ((pt_dbm + gt_dbi + gr_dbi) / 10) * (lam / (4 * PI * d)) ** 2)


def _d15_margin():
    return _friis(20, 10, 10, 1.5e9, 5000) - _sens(9.6, 8e6, 4)


def _d15_range(f, g_dbi, rb):
    """Range (km) that keeps the designed margin, by bisection on Friis."""
    need = _sens(9.6, rb, 4) + _d15_margin()
    lo, hi = 1.0, 1e7
    for _ in range(200):
        mid = math.sqrt(lo * hi)
        if _friis(20, g_dbi, g_dbi, f, mid) > need:
            lo = mid
        else:
            hi = mid
    return lo / 1000


def _rs_from_band(b_mhz, alpha):
    """Symbol rate (Msym/s) whose raised-cosine spectrum is b_mhz wide."""
    from scipy.optimize import brentq
    return brentq(lambda rs: _rc_band(rs, alpha) - b_mhz, 0.5, 20, xtol=1e-9)


def _need(pb, target):
    from scipy.optimize import brentq
    return db(brentq(lambda g: pb(g) - target, 1e-3, 1e4, xtol=1e-12))


def _d20_set(name):
    """(d_min^2 / E_b, N_min) of the point set, from its points at E_b = 1."""
    if name == "qpsk":
        P, k = [(math.cos(PI / 4 + j * PI / 2), math.sin(PI / 4 + j * PI / 2)) for j in range(4)], 2
    elif name == "8psk":
        P, k = [(math.cos(j * PI / 4), math.sin(j * PI / 4)) for j in range(8)], 3
    else:
        P, k = [(x, y) for x in (-3, -1, 1, 3) for y in (-3, -1, 1, 3)], 4
    P = _scaled(P, es=float(k))
    d, pr = _pairs(P)
    return d * d, 2 * len(pr) / len(P)


def _d20_need(name):
    """E_b/N_0 (ratio) for P_b = 1e-6 from (N_min / k) Q(sqrt(d^2 E_b / 2N_0))."""
    from scipy.optimize import brentq
    d2, nm = _d20_set(name)
    k = {"qpsk": 2, "8psk": 3, "16qam": 4}[name]
    return brentq(lambda g: nm / k * Q(math.sqrt(d2 * g / 2)) - 1e-6, 1.0, 1e3, xtol=1e-12)


# ── the checks ─────────────────────────────────────────────────────────────

T2 = 0.02   # a value the solution reads from a Q table at two decimals

CHECKS = [
    # D5-01
    {"name": "D5-01 E_s,avg", "stated": 9, "derive": S01.e_avg},
    {"name": "D5-01 d_min", "stated": 3, "derive": S01.dmin},
    {"name": "D5-01 d_min^2/E", "stated": 1.0, "derive": S01.coef},
    {"name": "D5-01 N_min", "stated": 2, "derive": S01.nmin},
    {"name": "D5-01 P_e at 18", "stated": 2.70e-3, "derive": lambda: nn_pe(S01, 18)},
    # D5-02
    {"name": "D5-02 E_s,avg", "stated": 12, "derive": S02.e_avg},
    {"name": "D5-02 d_min", "stated": 6, "derive": S02.dmin},
    {"name": "D5-02 d_min^2/E", "stated": 3, "derive": S02.coef},
    {"name": "D5-02 N_min", "stated": 2, "derive": S02.nmin},
    {"name": "D5-02 bits", "stated": 1.585, "derive": lambda: math.log(3) / math.log(2)},
    {"name": "D5-02 E_b coefficient", "stated": 2.377, "derive": lambda: S02.coef() / 2 * math.log2(3)},
    # D5-03
    {"name": "D5-03 E_s,avg", "stated": 4, "derive": S03.e_avg},
    {"name": "D5-03 E_b", "stated": 1.333, "derive": lambda: S03.e_avg() / 3},
    {"name": "D5-03 d_min^2", "stated": 2.343, "derive": lambda: S03.dmin() ** 2},
    {"name": "D5-03 d_min", "stated": 1.531, "derive": S03.dmin},
    {"name": "D5-03 d_min^2/E", "stated": 0.5858, "derive": S03.coef},
    {"name": "D5-03 Es coefficient", "stated": 0.2929, "derive": lambda: S03.coef() / 2},
    {"name": "D5-03 Eb coefficient", "stated": 0.8787, "derive": lambda: 3 * S03.coef() / 2},
    {"name": "D5-03 N_min", "stated": 2, "derive": S03.nmin},
    # D5-04
    {"name": "D5-04 E_s,avg", "stated": 10, "derive": S04.e_avg},
    {"name": "D5-04 d_min^2", "stated": 8, "derive": lambda: S04.dmin() ** 2},
    {"name": "D5-04 N_min", "stated": 1.5, "derive": S04.nmin},
    {"name": "D5-04 outer energy", "stated": 18, "derive": lambda: S04.energy(0)},
    {"name": "D5-04 P_e at 22.5", "stated": 2.03e-3, "derive": lambda: nn_pe(S04, 22.5)},
    # D5-05
    {"name": "D5-05 E_s,avg", "stated": 15, "derive": S05.e_avg},
    {"name": "D5-05 d_min^2/E", "stated": 0.6, "derive": S05.coef},
    {"name": "D5-05 N_min", "stated": 4 / 3, "derive": S05.nmin},
    {"name": "D5-05 saving dB", "stated": 3.98,
     "derive": lambda: db(S05.e_avg() / WaveSet([cosw(3 * math.sqrt(2) * c, 1500) for c in (-1, 0, 1)], 1, 1500).e_avg())},
    # D5-06
    {"name": "D5-06 E_s,avg", "stated": 2, "derive": S06.e_avg},
    {"name": "D5-06 bits", "stated": 2.322, "derive": lambda: math.log2(5)},
    {"name": "D5-06 d_min", "stated": 1, "derive": S06.dmin},
    {"name": "D5-06 N_min", "stated": 1.6, "derive": S06.nmin},
    {"name": "D5-06 P_e at 36", "stated": 2.16e-3, "derive": lambda: nn_pe(S06, 36)},
    # D5-07
    {"name": "D5-07 E_s,avg", "stated": 3, "derive": S07.e_avg},
    {"name": "D5-07 d_min", "stated": 2, "derive": S07.dmin},
    {"name": "D5-07 outer distance", "stated": 3.464, "derive": lambda: S07.dist(1, 2)},
    {"name": "D5-07 N_min", "stated": 1.5, "derive": S07.nmin},
    {"name": "D5-07 P_e at 6", "stated": 3.41e-2, "derive": lambda: nn_pe(S07, 6)},
    # D5-08
    {"name": "D5-08 E_s,avg", "stated": 6, "derive": S08.e_avg},
    {"name": "D5-08 d_min", "stated": 2, "derive": S08.dmin},
    {"name": "D5-08 N_min", "stated": 2.5, "derive": S08.nmin},
    {"name": "D5-08 P_e at 27", "stated": 3.38e-3, "derive": lambda: nn_pe(S08, 27)},
    # D5-09 (Madhow P4.16 and P4.21)
    {"name": "D5-09 16-QAM R_s", "stated": 12, "derive": lambda: 48 / math.log2(16)},
    {"name": "D5-09 16-QAM band", "stated": 15, "derive": lambda: _rc_band(12, 0.25), "tol": 1e-4},
    {"name": "D5-09 lower edge", "stated": 2392.5, "derive": lambda: 2400 - _rc_band(12, 0.25) / 2, "tol": 1e-6},
    {"name": "D5-09 upper edge", "stated": 2407.5, "derive": lambda: 2400 + _rc_band(12, 0.25) / 2, "tol": 1e-6},
    {"name": "D5-09 QPSK R_b in 15 MHz", "stated": 24, "derive": lambda: 15 / 1.25 * math.log2(4)},
    {"name": "D5-09 16-QAM d^2/E_s", "stated": 0.4, "derive": lambda: _grid_ratio(16)},
    {"name": "D5-09 QPSK d^2/E_s", "stated": 2, "derive": lambda: _grid_ratio(4)},
    {"name": "D5-09 QPSK E_s factor", "stated": 0.2, "derive": lambda: _grid_ratio(16) / _grid_ratio(4)},
    {"name": "D5-09 QPSK power mW", "stated": 50, "derive": lambda: _d09_power(4, 24)},
    {"name": "D5-09 QPSK saving dB", "stated": 6.99, "derive": lambda: db(250 / _d09_power(4, 24))},
    {"name": "D5-09 64-QAM R_s", "stated": 8, "derive": lambda: 48 / math.log2(64)},
    {"name": "D5-09 64-QAM band", "stated": 10, "derive": lambda: _rc_band(8, 0.25), "tol": 1e-4},
    {"name": "D5-09 64-QAM E_s factor", "stated": 4.2, "derive": lambda: _grid_ratio(16) / _grid_ratio(64)},
    {"name": "D5-09 64-QAM power factor", "stated": 2.8, "derive": lambda: _d09_power(64, 48) / 250},
    {"name": "D5-09 64-QAM power mW", "stated": 700, "derive": lambda: _d09_power(64, 48)},
    {"name": "D5-09 64-QAM extra dB", "stated": 4.47, "derive": lambda: db(_d09_power(64, 48) / 250)},
    {"name": "D5-09 R_b/B QPSK", "stated": 1.6, "derive": lambda: 24 / _rc_band(12, 0.25), "tol": 1e-4},
    {"name": "D5-09 R_b/B 16-QAM", "stated": 3.2, "derive": lambda: 48 / _rc_band(12, 0.25), "tol": 1e-4},
    {"name": "D5-09 R_b/B 64-QAM", "stated": 4.8, "derive": lambda: 48 / _rc_band(8, 0.25), "tol": 1e-4},
    {"name": "D5-09 check QPSK d^2/E_b", "stated": 4, "derive": lambda: _grid_ratio(4) * 2},
    {"name": "D5-09 check 16-QAM d^2/E_b", "stated": 1.6, "derive": lambda: _grid_ratio(16) * 4},
    {"name": "D5-09 check per-bit gap dB", "stated": 3.98, "derive": lambda: db(_grid_ratio(4) * 2 / (_grid_ratio(16) * 4))},
    {"name": "D5-09 figure 64-QAM per-bit gap dB", "stated": 8.45,
     "derive": lambda: db(_grid_ratio(4) * 2 / (_grid_ratio(64) * 6))},
    # D5-10
    {"name": "D5-10 E_s,avg", "stated": 4.5, "derive": S10.e_avg},
    {"name": "D5-10 d_min", "stated": 1.414, "derive": S10.dmin},
    {"name": "D5-10 d12", "stated": 2.236, "derive": lambda: S10.dist(0, 1)},
    {"name": "D5-10 d24", "stated": 4, "derive": lambda: S10.dist(1, 3)},
    {"name": "D5-10 N_min", "stated": 1, "derive": S10.nmin},
    {"name": "D5-10 P_e at 40.5", "stated": 1.35e-3, "derive": lambda: nn_pe(S10, 40.5)},
    {"name": "D5-10 bisector 2x+4y", "stated": 7, "derive": _d10_bisector, "tol": 1e-4},
    # D5-11
    {"name": "D5-11 E_s,avg", "stated": 1, "derive": S11.e_avg},
    {"name": "D5-11 energy of s4", "stated": 2, "derive": lambda: S11.energy(3)},
    {"name": "D5-11 s4 on psi1", "stated": 1, "derive": lambda: _proj(S11, 3, lambda t: math.sqrt(2) * np.cos(4 * PI * t))},
    {"name": "D5-11 s4 on psi2", "stated": 1, "derive": lambda: _proj(S11, 3, lambda t: -math.sqrt(2) * np.sin(4 * PI * t))},
    {"name": "D5-11 d_min", "stated": 1, "derive": S11.dmin},
    {"name": "D5-11 N_min", "stated": 2, "derive": S11.nmin},
    {"name": "D5-11 saving dB", "stated": 3.01,
     "derive": lambda: db(S11.e_avg() / np.mean([0.5, 0.5, 0.5, 0.5]))},
    # D5-12
    {"name": "D5-12 E_s,avg", "stated": 6, "derive": S12.e_avg},
    {"name": "D5-12 d_min^2", "stated": 12, "derive": lambda: S12.dmin() ** 2},
    {"name": "D5-12 N_min", "stated": 2, "derive": S12.nmin},
    {"name": "D5-12 s1 on psi1", "stated": 2.121, "derive": lambda: _proj(S12, 0, _psi1_1000)},
    {"name": "D5-12 s1 on psi2", "stated": 1.225, "derive": lambda: _proj(S12, 0, _psi2_1000)},
    {"name": "D5-12 P_e at Eb/N0 4.5", "stated": 2.70e-3, "derive": lambda: nn_pe(S12, 2 * 4.5)},
    {"name": "D5-12 P_b", "stated": 1.35e-3, "derive": lambda: nn_pe(S12, 9) / 2},
    {"name": "D5-12 BPSK P_b", "stated": 1.35e-3, "derive": lambda: Q(math.sqrt(2 * 4.5))},
    # D5-13
    {"name": "D5-13 E_s,avg", "stated": 21, "derive": S13.e_avg},
    {"name": "D5-13 E_b", "stated": 7, "derive": lambda: S13.e_avg() / 3},
    {"name": "D5-13 d_min", "stated": 2, "derive": S13.dmin},
    {"name": "D5-13 N_min", "stated": 1.75, "derive": S13.nmin},
    {"name": "D5-13 Eb/N0 dB for argument 3", "stated": 14.98,
     "derive": lambda: db(9 * 2 * (S13.e_avg() / S13.dmin() ** 2) / 3)},
    {"name": "D5-13 P_e", "stated": 2.36e-3, "derive": lambda: nn_pe(S13, 3 * 31.5)},
    # D5-14 (Madhow P4.18)
    {"name": "D5-14 rho at 125 Hz", "stated": 0.637, "derive": lambda: _d14_rho(125, 0.0), "tol": 1e-2},
    {"name": "D5-14 equal-phase spacing Hz", "stated": 250,
     "derive": lambda: _d14_first_zero(lambda f: _d14_rho(f, 0.0)), "tol": 1e-2},
    {"name": "D5-14 all-phase spacing Hz", "stated": 500, "derive": _d14_all_phase_spacing, "tol": 1e-2},
    {"name": "D5-14 rho at 250 Hz, 90 deg", "stated": -0.637, "derive": lambda: _d14_rho(250, PI / 2), "tol": 1e-2},
    {"name": "D5-14 1 + rho at 500 Hz, 90 deg", "stated": 1.0, "derive": lambda: 1.0 + _d14_rho(500, PI / 2), "tol": 5e-3},
    {"name": "D5-14 worst rho at 250 Hz", "stated": 0.637, "derive": lambda: _d14_worst(250), "tol": 1e-2},
    {"name": "D5-14 8-FSK bit rate", "stated": 1500, "derive": lambda: math.log2(8) / 0.002},
    {"name": "D5-14 coherent band", "stated": 2000, "derive": lambda: 8 * _d14_first_zero(lambda f: _d14_rho(f, 0.0)), "tol": 1e-2},
    {"name": "D5-14 noncoherent band", "stated": 4000, "derive": lambda: 8 * _d14_all_phase_spacing(), "tol": 1e-2},
    {"name": "D5-14 orthogonal band formula", "stated": 2000, "derive": lambda: 8 * 1500 / (2 * math.log2(8))},
    # D5-15 (Madhow P6.38)
    {"name": "D5-15 band (MHz)", "stated": 5, "derive": lambda: _rc_band(8 / 2, 0.25)},
    {"name": "D5-15 noise in 5 MHz (dBm)", "stated": -103.01, "derive": lambda: _dbm(_n0(4) * 5e6), "tol": 1e-4},
    {"name": "D5-15 10 log10 5e6", "stated": 66.99, "derive": lambda: 10 * math.log10(5e6), "tol": 1e-4},
    {"name": "D5-15 10 log10 8e6", "stated": 69.03, "derive": lambda: 10 * math.log10(8e6), "tol": 1e-4},
    {"name": "D5-15 sensitivity (dBm)", "stated": -91.37, "derive": lambda: _sens(9.6, 8e6, 4), "tol": 1e-4},
    {"name": "D5-15 BPSK/QPSK needs 9.6 dB", "stated": 9.6, "derive": lambda: _need(lambda g: Q(math.sqrt(2 * g)), 1e-5), "tol": 5e-3},
    {"name": "D5-15 4 pi d0 / lambda", "stated": 3.142e5, "derive": lambda: 4 * PI * 5000 / 0.2, "tol": 1e-3},
    {"name": "D5-15 path loss at d0 (dB)", "stated": 109.94, "derive": lambda: 40 - _friis(20, 10, 10, 1.5e9, 5000), "tol": 1e-4},
    {"name": "D5-15 P_r at d0 (dBm)", "stated": -69.94, "derive": lambda: _friis(20, 10, 10, 1.5e9, 5000), "tol": 1e-4},
    {"name": "D5-15 margin (dB)", "stated": 21.43, "derive": lambda: _friis(20, 10, 10, 1.5e9, 5000) - _sens(9.6, 8e6, 4), "tol": 5e-4},
    {"name": "D5-15 6 GHz extra loss (dB)", "stated": 12.04,
     "derive": lambda: _friis(20, 10, 10, 1.5e9, 5000) - _friis(20, 10, 10, 6e9, 5000), "tol": 1e-3},
    {"name": "D5-15 6 GHz same gains, range (km)", "stated": 1.25, "derive": lambda: _d15_range(6e9, 10, 8e6), "tol": 1e-3},
    {"name": "D5-15 same size, each gain (dBi)", "stated": 22.04, "derive": lambda: 10 + 10 * math.log10((6e9 / 1.5e9) ** 2), "tol": 1e-3},
    {"name": "D5-15 same size, allowed loss (dB)", "stated": 134.02,
     "derive": lambda: 20 + 2 * (10 + 10 * math.log10(16)) - _sens(9.6, 8e6, 4) - _d15_margin(), "tol": 1e-4},
    {"name": "D5-15 lambda'/4pi (m)", "stated": 3.979e-3, "derive": lambda: 0.05 / (4 * PI), "tol": 1e-3},
    {"name": "D5-15 10^6.701", "stated": 5.023e6, "derive": lambda: 10 ** 6.701, "tol": 1e-3},
    {"name": "D5-15 same size, range (km)", "stated": 20.0, "derive": lambda: _d15_range(6e9, 10 + 10 * math.log10(16), 8e6), "tol": 1e-3},
    {"name": "D5-15 net gain 24.08 - 12.04 -> factor", "stated": 4, "derive": lambda: 10 ** ((24.08 - 12.04) / 20), "tol": 1e-3},
    {"name": "D5-15 32 Mb/s band (MHz)", "stated": 20, "derive": lambda: _rc_band(32 / 2, 0.25)},
    {"name": "D5-15 32 Mb/s rise (dB)", "stated": 6.02, "derive": lambda: _sens(9.6, 32e6, 4) - _sens(9.6, 8e6, 4), "tol": 1e-3},
    {"name": "D5-15 10 log10 3.2e7", "stated": 75.05, "derive": lambda: 10 * math.log10(3.2e7), "tol": 1e-4},
    {"name": "D5-15 32 Mb/s sensitivity (dBm)", "stated": -85.35, "derive": lambda: _sens(9.6, 32e6, 4), "tol": 1e-4},
    {"name": "D5-15 32 Mb/s allowed loss (dB)", "stated": 103.92, "derive": lambda: 40 - _sens(9.6, 32e6, 4) - _d15_margin(), "tol": 1e-4},
    {"name": "D5-15 0.2/4pi", "stated": 1.592e-2, "derive": lambda: 0.2 / (4 * PI), "tol": 1e-3},
    {"name": "D5-15 10^(103.92/20)", "stated": 1.570e5, "derive": lambda: 10 ** (103.92 / 20), "tol": 1e-3},
    {"name": "D5-15 32 Mb/s range (km)", "stated": 2.50, "derive": lambda: _d15_range(1.5e9, 10, 32e6), "tol": 1e-3},
    {"name": "D5-15 noise in 20 MHz (dBm)", "stated": -96.99, "derive": lambda: _dbm(_n0(4) * 20e6), "tol": 1e-4},
    {"name": "D5-15 SNR in band at 8 Mb/s (dB)", "stated": 11.64, "derive": lambda: _sens(9.6, 8e6, 4) - _dbm(_n0(4) * 5e6), "tol": 1e-3},
    {"name": "D5-15 SNR in band at 32 Mb/s (dB)", "stated": 11.64, "derive": lambda: _sens(9.6, 32e6, 4) - _dbm(_n0(4) * 20e6), "tol": 1e-3},
    {"name": "D5-15 wrong 10 log factor", "stated": 16, "derive": lambda: 10 ** (12.04 / 10), "tol": 2e-3},
    # D5-16 (Madhow P6.19)
    {"name": "D5-16 c", "stated": 2.449, "derive": lambda: D16A[0, 0]},
    {"name": "D5-16 b", "stated": 2.828, "derive": lambda: D16B[2, 0]},
    {"name": "D5-16 g", "stated": 1.309, "derive": lambda: D16C[1, 0] - D16C[0, 0]},
    {"name": "D5-16 g^2", "stated": 12 / 7, "derive": lambda: (D16C[1, 0] - D16C[0, 0]) ** 2},
    {"name": "D5-16 A d_min", "stated": 2.449, "derive": lambda: _pairs(D16A)[0]},
    {"name": "D5-16 B d_min", "stated": 2.828, "derive": lambda: _pairs(D16B)[0]},
    {"name": "D5-16 C d_min", "stated": 1.309, "derive": lambda: _pairs(D16C)[0]},
    {"name": "D5-16 B middle-point degree", "stated": 5, "derive": lambda: _d16_max_degree(D16B)},
    {"name": "D5-16 A Gray labels one bit", "stated": 1, "derive": lambda: _max_one_bit(D16A, L16A)},
    {"name": "D5-16 C Gray labels one bit", "stated": 1, "derive": lambda: _max_one_bit(D16C, L16C)},
    {"name": "D5-16 B pairs at d_min", "stated": 13, "derive": lambda: len(_pairs(D16B)[1])},
    {"name": "D5-16 B given-label bit total", "stated": 17,
     "derive": lambda: sum(bin(L16B[i] ^ L16B[j]).count("1") for i, j in _pairs(D16B)[1])},
    {"name": "D5-16 B best labelling above 13", "stated": 17, "derive": _d16_best_B},
    {"name": "D5-16 w_B", "stated": 4.25, "derive": lambda: _w(D16B, L16B)},
    {"name": "D5-16 w_A = N_min", "stated": 2, "derive": lambda: _w(D16A, L16A)},
    {"name": "D5-16 w_C = N_min", "stated": 1.75, "derive": lambda: _w(D16C, L16C)},
    {"name": "D5-16 A d^2/E_b", "stated": 2, "derive": lambda: _d16_ratio(D16A)},
    {"name": "D5-16 B d^2/E_b", "stated": 8 / 3, "derive": lambda: _d16_ratio(D16B)},
    {"name": "D5-16 C d^2/E_b", "stated": 4 / 7, "derive": lambda: _d16_ratio(D16C)},
    {"name": "D5-16 B argument at 9", "stated": 3.46, "derive": lambda: math.sqrt(_d16_ratio(D16B) / 2 * 9), "tol": T2},
    {"name": "D5-16 C argument at 9", "stated": 1.60, "derive": lambda: math.sqrt(_d16_ratio(D16C) / 2 * 9), "tol": T2},
    {"name": "D5-16 P_b A at 9", "stated": 9.00e-4, "derive": lambda: _d16_pb(D16A, L16A, 9)},
    {"name": "D5-16 P_b B at 9", "stated": 3.83e-4, "derive": lambda: _d16_pb(D16B, L16B, 9), "tol": T2},
    {"name": "D5-16 P_b C at 9", "stated": 3.20e-2, "derive": lambda: _d16_pb(D16C, L16C, 9), "tol": T2},
    {"name": "D5-16 B over A dB", "stated": 1.25, "derive": lambda: db(_d16_ratio(D16B) / _d16_ratio(D16A))},
    {"name": "D5-16 A over C dB", "stated": 5.44, "derive": lambda: db(_d16_ratio(D16A) / _d16_ratio(D16C))},
    {"name": "D5-16 table Q(1.60)", "stated": 5.48e-2, "derive": lambda: Q(1.60)},
    {"name": "D5-16 table Q(3.46)", "stated": 2.70e-4, "derive": lambda: Q(3.46)},
    {"name": "D5-16 table Q ratio", "stated": 5.0, "derive": lambda: Q(3.00) / Q(3.46)},
    # D5-17 (Madhow P6.29)
    {"name": "D5-17 psi1 output at 25 deg", "stated": 0.906, "derive": lambda: _d17_proj(25, 1)},
    {"name": "D5-17 psi2 output at 25 deg", "stated": 0.423, "derive": lambda: _d17_proj(25, 2)},
    {"name": "D5-17 P_b at 0", "stated": 3.17e-5, "derive": lambda: _d17_pb(0)},
    {"name": "D5-17 P_b at 25 deg", "stated": 1.42e-4, "derive": lambda: _d17_pb(25), "tol": T2},
    {"name": "D5-17 P_b at 60 deg", "stated": 2.28e-2, "derive": lambda: _d17_pb(60)},
    {"name": "D5-17 P_b at 60 deg, Monte Carlo", "stated": 2.28e-2, "derive": lambda: _d17_mc(60), "tol": T2},
    {"name": "D5-17 loss at 25 deg dB", "stated": 0.85, "derive": lambda: _d17_loss(25), "tol": T2},
    {"name": "D5-17 loss at 60 deg dB", "stated": 6.02, "derive": lambda: _d17_loss(60)},
    {"name": "D5-17 table Q(3.63)", "stated": 1.42e-4, "derive": lambda: Q(3.63)},
    {"name": "D5-17 P_b at 155 deg", "stated": 0.99986, "derive": lambda: _d17_pb(155), "tol": 1e-5},
    {"name": "D5-17 differential pair rule at the table argument", "stated": 2.84e-4,
     "derive": lambda: 2 * Q(3.63) * (1 - Q(3.63)), "tol": T2},
    {"name": "D5-17 P_b at 90 deg", "stated": 0.5, "derive": lambda: _d17_pb(90), "tol": 1e-6},
    # D5-18
    {"name": "D5-18 cross product integral", "stated": 1.0,
     "derive": lambda: 1.0 + integrate.simpson(np.cos(2000 * PI * S18.t) * np.cos(3000 * PI * S18.t), x=S18.t), "tol": 1e-6},
    {"name": "D5-18 E_s,avg", "stated": 2, "derive": S18.e_avg},
    {"name": "D5-18 d_min", "stated": 2, "derive": S18.dmin},
    {"name": "D5-18 N_min", "stated": 2, "derive": S18.nmin},
    {"name": "D5-18 P_e at 9", "stated": 2.70e-3, "derive": lambda: nn_pe(S18, 9)},
    # D5-19
    {"name": "D5-19 E_s,avg", "stated": 6, "derive": S19.e_avg},
    {"name": "D5-19 d_min", "stated": 3, "derive": S19.dmin},
    {"name": "D5-19 d23^2", "stated": 18, "derive": lambda: S19.dist(1, 2) ** 2},
    {"name": "D5-19 N_min", "stated": 4 / 3, "derive": S19.nmin},
    {"name": "D5-19 P_e at 12", "stated": 1.80e-3, "derive": lambda: nn_pe(S19, 12)},
    # D5-20 (Madhow P6.35)
    {"name": "D5-20 R_s (Msym/s)", "stated": 5, "derive": lambda: _rs_from_band(6.0, 0.2), "tol": 1e-4},
    {"name": "D5-20 QPSK R_b (Mb/s)", "stated": 10, "derive": lambda: _rs_from_band(6.0, 0.2) * 2, "tol": 1e-4},
    {"name": "D5-20 8-PSK R_b (Mb/s)", "stated": 15, "derive": lambda: _rs_from_band(6.0, 0.2) * 3, "tol": 1e-4},
    {"name": "D5-20 16-QAM R_b (Mb/s)", "stated": 20, "derive": lambda: _rs_from_band(6.0, 0.2) * 4, "tol": 1e-4},
    {"name": "D5-20 QPSK d^2/E_b", "stated": 4, "derive": lambda: _d20_set("qpsk")[0]},
    {"name": "D5-20 8-PSK d^2/E_b", "stated": 1.757, "derive": lambda: _d20_set("8psk")[0]},
    {"name": "D5-20 8-PSK sin^2(pi/8)", "stated": 0.1464, "derive": lambda: math.sin(PI / 8) ** 2, "tol": 1e-3},
    {"name": "D5-20 16-QAM d^2/E_b", "stated": 1.6, "derive": lambda: _d20_set("16qam")[0]},
    {"name": "D5-20 QPSK N_min", "stated": 2, "derive": lambda: _d20_set("qpsk")[1]},
    {"name": "D5-20 8-PSK N_min", "stated": 2, "derive": lambda: _d20_set("8psk")[1]},
    {"name": "D5-20 16-QAM N_min", "stated": 3, "derive": lambda: _d20_set("16qam")[1]},
    {"name": "D5-20 Q(4.753)", "stated": 1.00e-6, "derive": lambda: Q(4.753), "tol": 3e-3},
    {"name": "D5-20 Q(4.695)", "stated": 1.33e-6, "derive": lambda: Q(4.695), "tol": 3e-3},
    {"name": "D5-20 Q(4.671)", "stated": 1.50e-6, "derive": lambda: Q(4.671), "tol": 3e-3},
    {"name": "D5-20 4.753^2", "stated": 22.59, "derive": lambda: 4.753 ** 2, "tol": 1e-3},
    {"name": "D5-20 4.671^2", "stated": 21.82, "derive": lambda: 4.671 ** 2, "tol": 1e-3},
    {"name": "D5-20 4.695^2", "stated": 22.04, "derive": lambda: 4.695 ** 2, "tol": 1e-3},
    {"name": "D5-20 QPSK Eb/N0", "stated": 11.30, "derive": lambda: _d20_need("qpsk"), "tol": 1e-3},
    {"name": "D5-20 QPSK Eb/N0 dB", "stated": 10.53, "derive": lambda: db(_d20_need("qpsk")), "tol": 5e-4},
    {"name": "D5-20 8-PSK Eb/N0", "stated": 24.83, "derive": lambda: _d20_need("8psk"), "tol": 1e-3},
    {"name": "D5-20 8-PSK Eb/N0 dB", "stated": 13.95, "derive": lambda: db(_d20_need("8psk")), "tol": 5e-4},
    {"name": "D5-20 16-QAM Eb/N0", "stated": 27.55, "derive": lambda: _d20_need("16qam"), "tol": 1e-3},
    {"name": "D5-20 16-QAM Eb/N0 dB", "stated": 14.40, "derive": lambda: db(_d20_need("16qam")), "tol": 5e-4},
    {"name": "D5-20 10 log10 1.5e7", "stated": 71.76, "derive": lambda: 10 * math.log10(1.5e7), "tol": 1e-4},
    {"name": "D5-20 10 log10 2e7", "stated": 73.01, "derive": lambda: 10 * math.log10(2e7), "tol": 1e-4},
    {"name": "D5-20 QPSK sensitivity (dBm)", "stated": -87.47, "derive": lambda: _sens(db(_d20_need("qpsk")), 10e6, 6), "tol": 1e-4},
    {"name": "D5-20 8-PSK sensitivity (dBm)", "stated": -82.29, "derive": lambda: _sens(db(_d20_need("8psk")), 15e6, 6), "tol": 1e-4},
    {"name": "D5-20 16-QAM sensitivity (dBm)", "stated": -80.59, "derive": lambda: _sens(db(_d20_need("16qam")), 20e6, 6), "tol": 1e-4},
    {"name": "D5-20 16-QAM over 8-PSK (dB)", "stated": 1.70,
     "derive": lambda: _sens(db(_d20_need("16qam")), 20e6, 6) - _sens(db(_d20_need("8psk")), 15e6, 6), "tol": 5e-3},
    {"name": "D5-20 10 log10 6e6", "stated": 67.78, "derive": lambda: 10 * math.log10(6e6), "tol": 1e-4},
    {"name": "D5-20 noise in 6 MHz (dBm)", "stated": -100.22, "derive": lambda: _dbm(_n0(6) * 6e6), "tol": 1e-4},
    {"name": "D5-20 QPSK SNR in band (dB)", "stated": 12.75,
     "derive": lambda: _sens(db(_d20_need("qpsk")), 10e6, 6) - _dbm(_n0(6) * 6e6), "tol": 1e-3},
    {"name": "D5-20 10 log10(10/6)", "stated": 2.22, "derive": lambda: db(10 / 6), "tol": 2e-3},
    {"name": "D5-20 bits a second per hertz", "stated": 1.67, "derive": lambda: 10 / 6, "tol": 2e-3},
    {"name": "D5-20 8-PSK SNR in band (dB)", "stated": 17.93,
     "derive": lambda: _sens(db(_d20_need("8psk")), 15e6, 6) - _dbm(_n0(6) * 6e6), "tol": 1e-3},
    {"name": "D5-20 10 log10(15/6)", "stated": 3.98, "derive": lambda: db(15 / 6), "tol": 2e-3},
    {"name": "D5-20 band-for-bit-rate error (dB)", "stated": 2.22,
     "derive": lambda: _sens(10.53, 10e6, 6) - _sens(10.53, 6e6, 6), "tol": 2e-3},
    # D5-21
    {"name": "D5-21 E_s,avg", "stated": 3.5, "derive": S21.e_avg},
    {"name": "D5-21 d_min", "stated": 2, "derive": S21.dmin},
    {"name": "D5-21 d14", "stated": math.sqrt(10), "derive": lambda: S21.dist(0, 3)},
    {"name": "D5-21 d24", "stated": 3 * math.sqrt(2), "derive": lambda: S21.dist(1, 3)},
    {"name": "D5-21 N_min", "stated": 1, "derive": S21.nmin},
    {"name": "D5-21 loss dB", "stated": 2.43,
     "derive": lambda: db(WaveSet([cosw(2, 1000, k * PI / 2) for k in range(4)], 1, 1000).coef() / S21.coef())},
    {"name": "D5-21 bisector x+2y", "stated": -3 / math.sqrt(2), "derive": _d21_bisector, "tol": 1e-4},
    # D5-22
    {"name": "D5-22 E_s,avg", "stated": 2.5, "derive": S22.e_avg},
    {"name": "D5-22 d_min", "stated": 2, "derive": S22.dmin},
    {"name": "D5-22 second distance", "stated": 2.236, "derive": lambda: S22.dist(0, 2)},
    {"name": "D5-22 N_min", "stated": 0.5, "derive": S22.nmin},
    {"name": "D5-22 NN term at 11.25", "stated": 6.75e-4, "derive": lambda: nn_pe(S22, 11.25)},
    {"name": "D5-22 second term at 11.25", "stated": 8.08e-4,
     "derive": lambda: 2 * Q(math.sqrt(S22.dist(0, 2) ** 2 / (2 * S22.e_avg() / 11.25))), "tol": T2},
    {"name": "D5-22 both terms", "stated": 1.48e-3,
     "derive": lambda: nn_pe(S22, 11.25) + 2 * Q(math.sqrt(S22.dist(0, 2) ** 2 / (2 * S22.e_avg() / 11.25))), "tol": T2},
    {"name": "D5-22 bisector -2x+4y", "stated": 3, "derive": _d22_bisector, "tol": 1e-4},
    # D5-23
    {"name": "D5-23 square edge", "stated": 1, "derive": _d23_square_edge, "tol": 1e-3},
    {"name": "D5-23 diagonal boundary", "stated": 2.5, "derive": _d23_diagonal, "tol": 1e-3},
    {"name": "D5-23 E_s,avg", "stated": 3.2, "derive": S23.e_avg},
    {"name": "D5-23 energy of s2", "stated": 4, "derive": lambda: S23.energy(1)},
    {"name": "D5-23 d_min", "stated": 2, "derive": S23.dmin},
    {"name": "D5-23 N_min", "stated": 1.6, "derive": S23.nmin},
    {"name": "D5-23 P_e at 14.4", "stated": 2.16e-3, "derive": lambda: nn_pe(S23, 14.4)},
    # D5-24
    {"name": "D5-24 threshold 1", "stated": -1, "derive": lambda: _d24_thresholds()[0], "tol": 1e-3},
    {"name": "D5-24 threshold 2", "stated": 1, "derive": lambda: _d24_thresholds()[1], "tol": 1e-3},
    {"name": "D5-24 threshold 3", "stated": 4, "derive": lambda: _d24_thresholds()[2], "tol": 1e-3},
    {"name": "D5-24 E_s,avg", "stated": 11, "derive": S24.e_avg},
    {"name": "D5-24 d_min", "stated": 2, "derive": S24.dmin},
    {"name": "D5-24 N_min", "stated": 1, "derive": S24.nmin},
    {"name": "D5-24 saving dB", "stated": 3.42,
     "derive": lambda: db(S24.e_avg() / WaveSet([cosw(c * math.sqrt(2), 1000) for c in (-3, -1, 1, 3)], 1, 1000).e_avg())},
    # D5-25
    {"name": "D5-25 E_s,avg", "stated": 3.5, "derive": S25.e_avg},
    {"name": "D5-25 d_min", "stated": 1, "derive": S25.dmin},
    {"name": "D5-25 N_min", "stated": 0.5, "derive": S25.nmin},
    {"name": "D5-25 P_e approx at 28", "stated": 1.14e-2, "derive": lambda: nn_pe(S25, 28)},
    {"name": "D5-25 table Q(4)", "stated": 3.167e-5, "derive": lambda: Q(4.0)},
    {"name": "D5-25 exact P_e at 28 (Monte Carlo, 4e6 trials)", "stated": 1.141e-2, "derive": _d25_monte_carlo, "tol": 0.02},
    # D5-26
    {"name": "D5-26 E_s,avg A", "stated": 10, "derive": S26A.e_avg},
    {"name": "D5-26 E_s,avg B", "stated": 10, "derive": S26B.e_avg},
    {"name": "D5-26 d_min A", "stated": 1.234, "derive": S26A.dmin},
    {"name": "D5-26 d_min^2/E A", "stated": 0.1522, "derive": S26A.coef},
    {"name": "D5-26 N_min A", "stated": 2, "derive": S26A.nmin},
    {"name": "D5-26 N_min B", "stated": 3, "derive": S26B.nmin},
    {"name": "D5-26 advantage dB", "stated": 4.20, "derive": lambda: db(S26B.coef() / S26A.coef())},
    {"name": "D5-26 argument A at 45", "stated": 1.851, "derive": lambda: math.sqrt(S26A.coef() / 2 * 45)},
    {"name": "D5-26 P_e A at 45", "stated": 6.43e-2, "derive": lambda: nn_pe(S26A, 45), "tol": T2},
    {"name": "D5-26 P_e B at 45", "stated": 4.05e-3, "derive": lambda: nn_pe(S26B, 45)},
    # D5-27
    {"name": "D5-27 E of s2", "stated": 2, "derive": lambda: S27.energy(1)},
    {"name": "D5-27 rho", "stated": -0.2122, "derive": _d27_rho, "tol": 2e-3},
    {"name": "D5-27 s2 on psi1", "stated": -0.300, "derive": lambda: _d27_coords()[0], "tol": 3e-3},
    {"name": "D5-27 s2 on psi2", "stated": 1.382, "derive": lambda: _d27_coords()[1], "tol": 1e-3},
    {"name": "D5-27 angle", "stated": 102.3, "derive": _d27_angle, "tol": 1e-3},
    {"name": "D5-27 d^2", "stated": 4.849, "derive": lambda: S27.dmin() ** 2, "tol": 1e-3},
    {"name": "D5-27 d", "stated": 2.202, "derive": S27.dmin, "tol": 1e-3},
    {"name": "D5-27 P_e at 7.5", "stated": 1.26e-3, "derive": lambda: nn_pe(S27, 7.5), "tol": 0.03},
    {"name": "D5-27 orthogonal P_e at 7.5", "stated": 3.07e-3, "derive": lambda: nn_pe(S27o, 7.5), "tol": T2},
    {"name": "D5-27 gain dB", "stated": 0.84, "derive": lambda: db(S27.coef() / S27o.coef())},
    # D5-28
    {"name": "D5-28 best R", "stated": 2.414, "derive": _d28_best_R, "tol": 1e-3},
    {"name": "D5-28 best ratio", "stated": 0.5858, "derive": _d28_best_ratio},
    {"name": "D5-28 E_s,avg at best R", "stated": 3.414, "derive": S28.e_avg},
    {"name": "D5-28 N_min at best R", "stated": 2, "derive": S28.nmin},
    {"name": "D5-28 ratio at R=2", "stated": 0.40, "derive": lambda: _ring_ratio(2.0)},
    {"name": "D5-28 ratio at R=3", "stated": 0.40, "derive": lambda: _ring_ratio(3.0)},
    {"name": "D5-28 8-PSK ratio", "stated": 0.5858,
     "derive": lambda: WaveSet([cosw(1, 1000, k * PI / 4) for k in range(8)], 1, 1000).coef()},
    # D5-29
    {"name": "D5-29 M", "stated": 16, "derive": _d29_M},
    {"name": "D5-29 E_s,avg", "stated": 2.5, "derive": S29.e_avg},
    {"name": "D5-29 d_min", "stated": 1, "derive": S29.dmin},
    {"name": "D5-29 N_min", "stated": 3, "derive": S29.nmin},
    {"name": "D5-29 E_b", "stated": 0.625, "derive": lambda: S29.e_avg() / 4},
    # D5-30
    {"name": "D5-30 E_s,avg", "stated": 8, "derive": S30.e_avg},
    {"name": "D5-30 d_min", "stated": 2.296, "derive": S30.dmin},
    {"name": "D5-30 d_min^2", "stated": 5.272, "derive": lambda: S30.dmin() ** 2},
    {"name": "D5-30 d_min^2/E", "stated": 0.6590, "derive": S30.coef},
    {"name": "D5-30 N_min", "stated": 16 / 9, "derive": S30.nmin},
    {"name": "D5-30 gain over 8-PSK dB", "stated": 0.51,
     "derive": lambda: db(S30.coef() / WaveSet([cosw(3, 1500, k * PI / 4) for k in range(1, 9)], 2, 1500).coef())},
    {"name": "D5-30 bits", "stated": 3.170, "derive": lambda: math.log2(9)},
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
