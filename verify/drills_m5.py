"""Re-derives every number stated in the Module 5 practice questions (D5-01 ... D5-30).

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
S09 = WaveSet([qam_wave(2 * m - 5, 2 * n - 5, 2000, amp=1.0) for n in range(1, 5) for m in range(1, 5)], 2, 2000)
S10 = WaveSet([cosw(math.sqrt(2) if k % 2 else 4.0, 1000, (k - 1) * PI / 4) for k in range(1, 9)], 1, 1000)
S11 = WaveSet([lambda t: 0 * t, lambda t: math.sqrt(2) * np.cos(4 * PI * t),
               lambda t: -math.sqrt(2) * np.sin(4 * PI * t), lambda t: 2 * np.cos(4 * PI * t + PI / 4)], 1, 2)
S12 = WaveSet([cosw(2 * math.sqrt(3), 1000, PI / 6 + (k - 1) * PI / 2) for k in range(1, 5)], 1, 1000)
S13 = WaveSet([cosw(math.sqrt(2) * (2 * k - 9), 1000) for k in range(1, 9)], 1, 1000)
S14 = WaveSet([cosw(5 * math.sqrt(2), 1500, 2 * PI * k / 5 - PI / 10) for k in range(1, 6)], 1, 1500)
S15 = WaveSet([lambda t: 0 * t] + [cosw(2, 1000, (k - 2) * PI / 3) for k in range(2, 8)], 1, 1000)
S16 = WaveSet([cosw(math.sqrt(2), 1000, (k - 1) * PI / 2) for k in range(1, 5)]
              + [cosw(2 * math.sqrt(2), 1000, (k - 5) * PI / 2) for k in range(5, 9)], 1, 1000)
S17 = WaveSet([cosw(3, 2500), cosw(3, 2500, 2 * PI / 3)], 2, 2500)
S18 = WaveSet([cosw(2, 1000), cosw(-2, 1000), cosw(2, 1500), cosw(-2, 1500)], 1, 1500)
S19 = WaveSet([lambda t: 0 * t, cosw(3, 2000), cosw(3, 2500)], 2, 2500)
S20 = WaveSet([qam_wave(2 * (m - 2), 2 * n - 3, 1000) for n in (1, 2) for m in range(1, 4)], 1, 1000)
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
    # D5-09
    {"name": "D5-09 E_s,avg", "stated": 10, "derive": S09.e_avg},
    {"name": "D5-09 E_b", "stated": 2.5, "derive": lambda: S09.e_avg() / 4},
    {"name": "D5-09 d_min", "stated": 2, "derive": S09.dmin},
    {"name": "D5-09 N_min", "stated": 3, "derive": S09.nmin},
    {"name": "D5-09 P_e at Eb/N0 11.25", "stated": 4.05e-3, "derive": lambda: nn_pe(S09, 4 * 11.25)},
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
    # D5-14
    {"name": "D5-14 E_s,avg", "stated": 25, "derive": S14.e_avg},
    {"name": "D5-14 d_min^2", "stated": 34.55, "derive": lambda: S14.dmin() ** 2},
    {"name": "D5-14 d_min", "stated": 5.878, "derive": S14.dmin},
    {"name": "D5-14 coefficient", "stated": 0.6910, "derive": lambda: S14.coef() / 2},
    {"name": "D5-14 argument at 13", "stated": 2.997, "derive": lambda: math.sqrt(S14.coef() / 2 * 13)},
    {"name": "D5-14 P_e at 13", "stated": 2.70e-3, "derive": lambda: nn_pe(S14, 13), "tol": T2},
    {"name": "D5-14 s4 on psi2", "stated": -5,
     "derive": lambda: _proj(S14, 3, lambda t: -math.sqrt(2) * np.sin(3000 * PI * t))},
    # D5-15
    {"name": "D5-15 E_s,avg", "stated": 1.714, "derive": S15.e_avg},
    {"name": "D5-15 d_min", "stated": math.sqrt(2), "derive": S15.dmin},
    {"name": "D5-15 N_min", "stated": 3.429, "derive": S15.nmin},
    {"name": "D5-15 argument at 12", "stated": 2.646, "derive": lambda: math.sqrt(S15.coef() / 2 * 12)},
    {"name": "D5-15 table Q(2.65)", "stated": 0.004025, "derive": lambda: Q(2.65)},
    {"name": "D5-15 centre conditional", "stated": 0.0242, "derive": lambda: 6 * Q(math.sqrt(S15.coef() / 2 * 12)), "tol": T2},
    {"name": "D5-15 ring conditional", "stated": 0.0121, "derive": lambda: 3 * Q(math.sqrt(S15.coef() / 2 * 12)), "tol": T2},
    {"name": "D5-15 average", "stated": 0.0138, "derive": lambda: nn_pe(S15, 12), "tol": T2},
    # D5-16
    {"name": "D5-16 E_s,avg", "stated": 2.5, "derive": S16.e_avg},
    {"name": "D5-16 d_min", "stated": 1, "derive": S16.dmin},
    {"name": "D5-16 N_min", "stated": 1, "derive": S16.nmin},
    {"name": "D5-16 8-PSK advantage dB", "stated": 1.66,
     "derive": lambda: db(WaveSet([cosw(2, 1000, k * PI / 4) for k in range(8)], 1, 1000).coef() / S16.coef())},
    # D5-17
    {"name": "D5-17 E_s,avg", "stated": 9, "derive": S17.e_avg},
    {"name": "D5-17 d^2", "stated": 27, "derive": lambda: S17.dmin() ** 2},
    {"name": "D5-17 s2 on psi2", "stated": 2.598,
     "derive": lambda: _proj(S17, 1, lambda t: -np.sin(5000 * PI * t))},
    {"name": "D5-17 loss dB", "stated": 1.25,
     "derive": lambda: db(WaveSet([cosw(3, 2500), cosw(-3, 2500)], 2, 2500).coef() / S17.coef())},
    {"name": "D5-17 P_e at 6", "stated": 1.35e-3, "derive": lambda: nn_pe(S17, 6)},
    {"name": "D5-17 BPSK table Q(3.46)", "stated": 2.70e-4, "derive": lambda: Q(3.46)},
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
    # D5-20
    {"name": "D5-20 E_s,avg", "stated": 3.667, "derive": S20.e_avg},
    {"name": "D5-20 d_min", "stated": 2, "derive": S20.dmin},
    {"name": "D5-20 N_min", "stated": 7 / 3, "derive": S20.nmin},
    {"name": "D5-20 bits", "stated": 2.585, "derive": lambda: math.log2(6)},
    {"name": "D5-20 P_e at 16.5", "stated": 3.15e-3, "derive": lambda: nn_pe(S20, 16.5)},
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
