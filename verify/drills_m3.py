"""Re-derives every number stated in the Module 3 practice solutions.

The solutions work in closed form: heights times widths for the drawn
waveforms, and the in-phase/quadrature expansion for the carrier families.
Nothing here reuses those formulas. Each waveform is sampled on a fine grid,
Gram-Schmidt is run numerically on the samples, and every energy, coordinate,
distance, correlation and dimension is read off the numerical result. Distances
are taken from the energy of the sampled difference waveform, not from vectors.

Same shape as verify_drills.py: one dict per claim, a `derive` callable, and a
relative tolerance. A claim whose value is zero is checked as 1 + value, so
that the relative test stays meaningful.
"""

import itertools
import math
import sys

import numpy as np

# ── sampled waveforms ──────────────────────────────────────────────────────

DT = 1e-4                       # drawn waveforms: 10^4 samples per second
NB = 400_000                    # carrier waveforms on [0, 1]: 400 kHz sampling
TB = (np.arange(NB) + 0.5) / NB


def pw(pieces, T):
    """Piecewise-constant waveform on [0, T] from (t0, t1, height) pieces."""
    n = int(round(T / DT))
    t = (np.arange(n) + 0.5) * DT
    x = np.zeros(n)
    for a, b, h in pieces:
        x[(t >= a) & (t < b)] = h
    return x


def U(heights, T=None, w=1.0):
    return pw([(i * w, (i + 1) * w, v) for i, v in enumerate(heights)],
              T if T is not None else len(heights) * w)


def ip(x, y, dt):
    return float(np.sum(x * y) * dt)


def gram_schmidt(sigs, dt):
    """Numerical Gram-Schmidt. Returns the basis and the coordinate matrix."""
    basis, coords, rem = [], [], []
    for s in sigs:
        c = [ip(s, b, dt) for b in basis]
        g = s.copy()
        for ci, b in zip(c, basis):
            g = g - ci * b
        e = ip(g, g, dt)
        rem.append(e)
        if e > 1e-9 * max(1.0, ip(s, s, dt)):
            basis.append(g / math.sqrt(e))
            c.append(math.sqrt(e))
        coords.append(c)
    n = len(basis)
    return basis, np.array([c + [0.0] * (n - len(c)) for c in coords]), rem


def energy(x, dt):
    return ip(x, x, dt)


def dist(x, y, dt):
    """Distance as the square root of the energy of the difference waveform."""
    return math.sqrt(energy(x - y, dt))


def rho(x, y, dt):
    return ip(x, y, dt) / math.sqrt(energy(x, dt) * energy(y, dt))


def all_d(sigs, dt):
    return {(i, j): dist(sigs[i], sigs[j], dt)
            for i, j in itertools.combinations(range(len(sigs)), 2)}


def dmin(sigs, dt):
    return min(all_d(sigs, dt).values())


def nn_counts(sigs, dt):
    d = all_d(sigs, dt)
    m = min(d.values())
    return [sum(1 for k, v in d.items() if i in k and abs(v - m) < 1e-6 * m)
            for i in range(len(sigs))]


def e_av(sigs, dt):
    return sum(energy(s, dt) for s in sigs) / len(sigs)


def dim(sigs, dt):
    return len(gram_schmidt(sigs, dt)[0])


# the in-phase and quadrature functions, sampled, used only to read coordinates
def iq(f):
    return (math.sqrt(2) * np.cos(2 * np.pi * f * TB),
            -math.sqrt(2) * np.sin(2 * np.pi * f * TB))


def coords_iq(s, f):
    p1, p2 = iq(f)
    return ip(s, p1, 1 / NB), ip(s, p2, 1 / NB)


def carrier(A, f, th):
    return A * np.cos(2 * np.pi * f * TB + th)


dB = 1 / NB
PI = math.pi

# ── D3-01 … D3-12: drawn waveforms ─────────────────────────────────────────

q01 = [U([0, 2, 2, 0]), U([1, 1, 1, 1])]
q02 = [U([2, 2, 0]), U([1, 1, -2])]
q03 = [U([2, 2, -4]), U([-1, -1, 2])]
q04 = [U([3, 6, 6]), U([6, 3, -6]), U([6, -6, 3])]
q05 = [U([3, 0, 0]), U([1, 1, 1]), U([0, -2, -2])]
q06 = [U([1, 1, 1]), U([2, 2, -1]), U([-1, -1, 2])]
q07 = [U([2, 2, -2, -2]), U([1, -1, -1, 1]), U([3, 1, -3, -1])]
q08 = [U([1, 1, 1]), U([3, 1, -1]), U([-1, 1, 3])]
q09 = [U([1, 1, 0]), U([1, 0, 1]), U([0, 1, 1])]
q10 = [U([2, 0, 0, 0]), U([0, 2, 0, 0]), U([0, 0, 2, 0]), U([0, 0, 0, 2])]    # set A
q11 = [U([1, 1, 1, 1]), U([1, 1, -1, -1]), U([-1, -1, -1, -1]), U([-1, -1, 1, 1])]
q12 = [pw([(0, 1.5, 2)], 3), pw([(0, 3, 1)], 3)]

G = {k: gram_schmidt(v, DT) for k, v in
     dict(q01=q01, q02=q02, q03=q03, q04=q04, q05=q05, q06=q06, q07=q07,
          q08=q08, q09=q09, q10=q10, q11=q11, q12=q12).items()}


def co(q, i, j):
    return G[q][1][i][j]


def rem(q, i):
    return G[q][2][i]


CHECKS = [
    # D3-01
    {"name": "D3-01 E0", "stated": 8, "derive": lambda: energy(q01[0], DT)},
    {"name": "D3-01 s11", "stated": 1.4142, "derive": lambda: co("q01", 1, 0), "tol": 1e-3},
    {"name": "D3-01 remainder energy", "stated": 2, "derive": lambda: rem("q01", 1)},
    {"name": "D3-01 s12", "stated": 1.4142, "derive": lambda: co("q01", 1, 1), "tol": 1e-3},
    {"name": "D3-01 E1", "stated": 4, "derive": lambda: energy(q01[1], DT)},
    {"name": "D3-01 d01", "stated": 2, "derive": lambda: dist(*q01, DT)},
    {"name": "D3-01 rho01", "stated": 0.7071, "derive": lambda: rho(*q01, DT), "tol": 1e-3},
    {"name": "D3-01 dimensions", "stated": 2, "derive": lambda: dim(q01, DT)},
    # D3-02
    {"name": "D3-02 E0", "stated": 8, "derive": lambda: energy(q02[0], DT)},
    {"name": "D3-02 s11", "stated": 1.4142, "derive": lambda: co("q02", 1, 0), "tol": 1e-3},
    {"name": "D3-02 remainder energy", "stated": 4, "derive": lambda: rem("q02", 1)},
    {"name": "D3-02 s12 (psi2 = -1 on [2,3])", "stated": 2, "derive": lambda: co("q02", 1, 1)},
    {"name": "D3-02 psi2 height on [2,3]", "stated": -1, "derive": lambda: G["q02"][0][1][-1]},
    {"name": "D3-02 E1", "stated": 6, "derive": lambda: energy(q02[1], DT)},
    {"name": "D3-02 d01", "stated": 2.449, "derive": lambda: dist(*q02, DT), "tol": 1e-3},
    {"name": "D3-02 rho01", "stated": 0.5774, "derive": lambda: rho(*q02, DT), "tol": 1e-3},
    {"name": "D3-02 Es,av", "stated": 7, "derive": lambda: e_av(q02, DT)},
    # D3-03
    {"name": "D3-03 E0", "stated": 24, "derive": lambda: energy(q03[0], DT)},
    {"name": "D3-03 s11", "stated": -2.449, "derive": lambda: co("q03", 1, 0), "tol": 1e-3},
    {"name": "D3-03 s01", "stated": 4.899, "derive": lambda: co("q03", 0, 0), "tol": 1e-3},
    {"name": "D3-03 remainder of s1 (1 + value)", "stated": 1, "derive": lambda: 1 + rem("q03", 1)},
    {"name": "D3-03 dimensions", "stated": 1, "derive": lambda: dim(q03, DT)},
    {"name": "D3-03 E1", "stated": 6, "derive": lambda: energy(q03[1], DT)},
    {"name": "D3-03 d01", "stated": 7.348, "derive": lambda: dist(*q03, DT), "tol": 1e-3},
    {"name": "D3-03 d01^2", "stated": 54, "derive": lambda: dist(*q03, DT) ** 2},
    {"name": "D3-03 rho01", "stated": -1, "derive": lambda: rho(*q03, DT)},
    {"name": "D3-03 Es,av", "stated": 15, "derive": lambda: e_av(q03, DT)},
    # D3-05
    {"name": "D3-05 E1", "stated": 9, "derive": lambda: energy(q05[0], DT)},
    {"name": "D3-05 s21", "stated": 1, "derive": lambda: co("q05", 1, 0)},
    {"name": "D3-05 remainder energy of s2", "stated": 2, "derive": lambda: rem("q05", 1)},
    {"name": "D3-05 s22", "stated": 1.4142, "derive": lambda: co("q05", 1, 1), "tol": 1e-3},
    {"name": "D3-05 s31 (1 + value)", "stated": 1, "derive": lambda: 1 + co("q05", 2, 0)},
    {"name": "D3-05 s32", "stated": -2.828, "derive": lambda: co("q05", 2, 1), "tol": 1e-3},
    {"name": "D3-05 dimensions", "stated": 2, "derive": lambda: dim(q05, DT)},
    {"name": "D3-05 E2", "stated": 3, "derive": lambda: energy(q05[1], DT)},
    {"name": "D3-05 E3", "stated": 8, "derive": lambda: energy(q05[2], DT)},
    {"name": "D3-05 d12", "stated": 2.449, "derive": lambda: dist(q05[0], q05[1], DT), "tol": 1e-3},
    {"name": "D3-05 d13", "stated": 4.123, "derive": lambda: dist(q05[0], q05[2], DT), "tol": 1e-3},
    {"name": "D3-05 d23", "stated": 4.359, "derive": lambda: dist(q05[1], q05[2], DT), "tol": 1e-3},
    {"name": "D3-05 dmin", "stated": 2.449, "derive": lambda: dmin(q05, DT), "tol": 1e-3},
    {"name": "D3-05 s3 = (2/3)s1 - 2 s2 (energy of residual, 1 + value)", "stated": 1,
     "derive": lambda: 1 + energy(q05[2] - (2 / 3 * q05[0] - 2 * q05[1]), DT)},
    # D3-06
    {"name": "D3-06 E1", "stated": 3, "derive": lambda: energy(q06[0], DT)},
    {"name": "D3-06 s21", "stated": 1.732, "derive": lambda: co("q06", 1, 0), "tol": 1e-3},
    {"name": "D3-06 remainder energy of s2", "stated": 6, "derive": lambda: rem("q06", 1)},
    {"name": "D3-06 s31 (1 + value)", "stated": 1, "derive": lambda: 1 + co("q06", 2, 0)},
    {"name": "D3-06 s32", "stated": -2.449, "derive": lambda: co("q06", 2, 1), "tol": 1e-3},
    {"name": "D3-06 dimensions", "stated": 2, "derive": lambda: dim(q06, DT)},
    {"name": "D3-06 E2", "stated": 9, "derive": lambda: energy(q06[1], DT)},
    {"name": "D3-06 E3", "stated": 6, "derive": lambda: energy(q06[2], DT)},
    {"name": "D3-06 Es,av", "stated": 6, "derive": lambda: e_av(q06, DT)},
    {"name": "D3-06 d12", "stated": 2.449, "derive": lambda: dist(q06[0], q06[1], DT), "tol": 1e-3},
    {"name": "D3-06 d13", "stated": 3, "derive": lambda: dist(q06[0], q06[2], DT)},
    {"name": "D3-06 d23^2", "stated": 27, "derive": lambda: dist(q06[1], q06[2], DT) ** 2},
    {"name": "D3-06 s3 = s1 - s2 (1 + residual energy)", "stated": 1,
     "derive": lambda: 1 + energy(q06[2] - (q06[0] - q06[1]), DT)},
    # D3-07
    {"name": "D3-07 <s1,s2> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(q07[0], q07[1], DT)},
    {"name": "D3-07 E1", "stated": 16, "derive": lambda: energy(q07[0], DT)},
    {"name": "D3-07 E2", "stated": 4, "derive": lambda: energy(q07[1], DT)},
    {"name": "D3-07 s31", "stated": 4, "derive": lambda: co("q07", 2, 0)},
    {"name": "D3-07 s32", "stated": 2, "derive": lambda: co("q07", 2, 1)},
    {"name": "D3-07 dimensions", "stated": 2, "derive": lambda: dim(q07, DT)},
    {"name": "D3-07 d12", "stated": 4.472, "derive": lambda: dist(q07[0], q07[1], DT), "tol": 1e-3},
    {"name": "D3-07 d13", "stated": 2, "derive": lambda: dist(q07[0], q07[2], DT)},
    {"name": "D3-07 d23", "stated": 4, "derive": lambda: dist(q07[1], q07[2], DT)},
    {"name": "D3-07 E3", "stated": 20, "derive": lambda: energy(q07[2], DT)},
    {"name": "D3-07 Es,av", "stated": 13.33, "derive": lambda: e_av(q07, DT), "tol": 1e-3},
    # D3-08
    {"name": "D3-08 s21", "stated": 1.732, "derive": lambda: co("q08", 1, 0), "tol": 1e-3},
    {"name": "D3-08 remainder energy of s2", "stated": 8, "derive": lambda: rem("q08", 1)},
    {"name": "D3-08 s31", "stated": 1.732, "derive": lambda: co("q08", 2, 0), "tol": 1e-3},
    {"name": "D3-08 s32", "stated": -2.828, "derive": lambda: co("q08", 2, 1), "tol": 1e-3},
    {"name": "D3-08 dimensions", "stated": 2, "derive": lambda: dim(q08, DT)},
    {"name": "D3-08 E2", "stated": 11, "derive": lambda: energy(q08[1], DT)},
    {"name": "D3-08 d12", "stated": 2.828, "derive": lambda: dist(q08[0], q08[1], DT), "tol": 1e-3},
    {"name": "D3-08 d13", "stated": 2.828, "derive": lambda: dist(q08[0], q08[2], DT), "tol": 1e-3},
    {"name": "D3-08 d23", "stated": 5.657, "derive": lambda: dist(q08[1], q08[2], DT), "tol": 1e-3},
    {"name": "D3-08 nearest neighbours of s1", "stated": 2, "derive": lambda: nn_counts(q08, DT)[0]},
    {"name": "D3-08 nearest neighbours of s2", "stated": 1, "derive": lambda: nn_counts(q08, DT)[1]},
    {"name": "D3-08 Es,av", "stated": 8.333, "derive": lambda: e_av(q08, DT), "tol": 1e-3},
    # D3-09
    {"name": "D3-09 E1", "stated": 2, "derive": lambda: energy(q09[0], DT)},
    {"name": "D3-09 remainder energy of s2", "stated": 1.5, "derive": lambda: rem("q09", 1)},
    {"name": "D3-09 s31", "stated": 1 / math.sqrt(2), "derive": lambda: co("q09", 2, 0)},
    {"name": "D3-09 s32", "stated": 1 / math.sqrt(6), "derive": lambda: co("q09", 2, 1)},
    {"name": "D3-09 remainder energy of s3", "stated": 4 / 3, "derive": lambda: rem("q09", 2)},
    {"name": "D3-09 dimensions", "stated": 3, "derive": lambda: dim(q09, DT)},
    {"name": "D3-09 E3", "stated": 2, "derive": lambda: energy(q09[2], DT)},
    {"name": "D3-09 d12", "stated": 1.414, "derive": lambda: dist(q09[0], q09[1], DT), "tol": 1e-3},
    {"name": "D3-09 d13", "stated": 1.414, "derive": lambda: dist(q09[0], q09[2], DT), "tol": 1e-3},
    {"name": "D3-09 d23", "stated": 1.414, "derive": lambda: dist(q09[1], q09[2], DT), "tol": 1e-3},
    # D3-11
    {"name": "D3-11 dimensions", "stated": 2, "derive": lambda: dim(q11, DT)},
    {"name": "D3-11 Es,av", "stated": 4, "derive": lambda: e_av(q11, DT)},
    {"name": "D3-11 dmin", "stated": 2.828, "derive": lambda: dmin(q11, DT), "tol": 1e-3},
    {"name": "D3-11 opposite distance", "stated": 4, "derive": lambda: dist(q11[0], q11[2], DT)},
    {"name": "D3-11 nearest neighbours of s1", "stated": 2, "derive": lambda: nn_counts(q11, DT)[0]},
    {"name": "D3-11 dmin^2/Es,av", "stated": 2, "derive": lambda: dmin(q11, DT) ** 2 / e_av(q11, DT)},
    # D3-12
    {"name": "D3-12 E0", "stated": 6, "derive": lambda: energy(q12[0], DT)},
    {"name": "D3-12 s11", "stated": 1.2247, "derive": lambda: co("q12", 1, 0), "tol": 1e-3},
    {"name": "D3-12 remainder energy", "stated": 1.5, "derive": lambda: rem("q12", 1)},
    {"name": "D3-12 psi heights", "stated": math.sqrt(2 / 3), "derive": lambda: G["q12"][0][1][-1]},
    {"name": "D3-12 E1", "stated": 3, "derive": lambda: energy(q12[1], DT)},
    {"name": "D3-12 d01", "stated": 1.732, "derive": lambda: dist(*q12, DT), "tol": 1e-3},
    {"name": "D3-12 rho01", "stated": 0.7071, "derive": lambda: rho(*q12, DT), "tol": 1e-3},
    {"name": "D3-12 Es,av", "stated": 4.5, "derive": lambda: e_av(q12, DT)},
    {"name": "D3-12 d^2/Es,av", "stated": 0.6667, "derive": lambda: dist(*q12, DT) ** 2 / e_av(q12, DT), "tol": 1e-3},
]

# ── D3-13 … D3-24: carrier families ────────────────────────────────────────

b13 = [carrier(math.sqrt(18), 2000, PI * (2 * k - 1) / 6) for k in range(1, 7)]
b14 = [0 * TB, carrier(3 * math.sqrt(2), 3000, 0), carrier(3 * math.sqrt(2), 3000, PI / 2),
       carrier(6, 3000, PI / 4)]
b15 = [(2 * k - 5) * math.sqrt(2) * np.cos(5000 * PI * TB) for k in range(1, 5)]
b16 = [carrier(2, 1000, k * PI / 4) for k in range(8)]
b17 = [carrier(math.sqrt(10), 3000, (2 * k - 1) * PI / 4) for k in range(1, 5)]
b18 = [math.sqrt(2) * ((2 * m - 5) * np.cos(4000 * PI * TB) - (2 * n - 5) * np.sin(4000 * PI * TB))
       for m in range(1, 5) for n in range(1, 5)]
b19 = ([carrier(2 * math.sqrt(2), 1000, (k - 1) * PI / 2) for k in range(1, 5)]
       + [carrier(4, 1000, (2 * k - 9) * PI / 4) for k in range(5, 9)])
b20 = [0 * TB] + [carrier(2 * math.sqrt(2), 1000, 2 * PI * (k - 2) / 3) for k in (2, 3, 4)]
b21 = [carrier(3 * math.sqrt(2), 1000, 0), carrier(3 * math.sqrt(2), 1500, 0)]
b21 = b21 + [-b21[0], -b21[1]]
b23 = [math.sqrt(2) * ((2 * m - 5) * np.cos(2000 * PI * TB) - (2 * n - 3) * np.sin(2000 * PI * TB))
       for m in range(1, 5) for n in range(1, 3)]
b24 = [carrier(k * math.sqrt(2), 1500, k * PI / 2) for k in range(1, 5)]


def ortho_checks(tag, f):
    p1, p2 = iq(f)
    return [
        {"name": f"{tag} psi1 energy (f={f})", "stated": 1, "derive": lambda: energy(p1, dB), "tol": 1e-6},
        {"name": f"{tag} psi2 energy", "stated": 1, "derive": lambda: energy(p2, dB), "tol": 1e-6},
        {"name": f"{tag} <psi1,psi2> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(p1, p2, dB), "tol": 1e-6},
    ]


CHECKS += ortho_checks("D3-13", 2000) + [
    {"name": "D3-13 s1 first coordinate", "stated": 2.598, "derive": lambda: coords_iq(b13[0], 2000)[0], "tol": 1e-3},
    {"name": "D3-13 s1 second coordinate", "stated": 1.5, "derive": lambda: coords_iq(b13[0], 2000)[1], "tol": 1e-3},
    {"name": "D3-13 s2 second coordinate", "stated": 3, "derive": lambda: coords_iq(b13[1], 2000)[1], "tol": 1e-4},
    {"name": "D3-13 dimensions", "stated": 2, "derive": lambda: dim(b13, dB)},
    {"name": "D3-13 energy of every symbol", "stated": 9, "derive": lambda: max(energy(s, dB) for s in b13), "tol": 1e-5},
    {"name": "D3-13 Es,av", "stated": 9, "derive": lambda: e_av(b13, dB), "tol": 1e-5},
    {"name": "D3-13 dmin", "stated": 3, "derive": lambda: dmin(b13, dB), "tol": 1e-5},
    {"name": "D3-13 two steps apart", "stated": 5.196, "derive": lambda: dist(b13[0], b13[2], dB), "tol": 1e-3},
    {"name": "D3-13 opposite", "stated": 6, "derive": lambda: dist(b13[0], b13[3], dB), "tol": 1e-5},
    {"name": "D3-13 nearest neighbours", "stated": 2, "derive": lambda: min(nn_counts(b13, dB))},
]
CHECKS += ortho_checks("D3-14", 3000) + [
    {"name": "D3-14 s3 second coordinate", "stated": 3, "derive": lambda: coords_iq(b14[2], 3000)[1], "tol": 1e-4},
    {"name": "D3-14 s4 first coordinate", "stated": 3, "derive": lambda: coords_iq(b14[3], 3000)[0], "tol": 1e-4},
    {"name": "D3-14 s4 second coordinate", "stated": 3, "derive": lambda: coords_iq(b14[3], 3000)[1], "tol": 1e-4},
    {"name": "D3-14 E4", "stated": 18, "derive": lambda: energy(b14[3], dB), "tol": 1e-5},
    {"name": "D3-14 Es,av", "stated": 9, "derive": lambda: e_av(b14, dB), "tol": 1e-5},
    {"name": "D3-14 dmin", "stated": 3, "derive": lambda: dmin(b14, dB), "tol": 1e-5},
    {"name": "D3-14 diagonal", "stated": 4.243, "derive": lambda: dist(b14[1], b14[2], dB), "tol": 1e-3},
    {"name": "D3-14 nearest neighbours (each)", "stated": 2, "derive": lambda: max(nn_counts(b14, dB))},
    {"name": "D3-14 nearest neighbours (least)", "stated": 2, "derive": lambda: min(nn_counts(b14, dB))},
    {"name": "D3-14 dmin^2/Es,av", "stated": 1, "derive": lambda: dmin(b14, dB) ** 2 / e_av(b14, dB), "tol": 1e-5},
]
CHECKS += [
    {"name": "D3-15 unit energy of the basis", "stated": 1,
     "derive": lambda: energy(math.sqrt(2) * np.cos(5000 * PI * TB), dB), "tol": 1e-6},
    {"name": "D3-15 dimensions", "stated": 1, "derive": lambda: dim(b15, dB)},
    {"name": "D3-15 coordinate of s1", "stated": -3,
     "derive": lambda: ip(b15[0], math.sqrt(2) * np.cos(5000 * PI * TB), dB), "tol": 1e-5},
    {"name": "D3-15 Es,av", "stated": 5, "derive": lambda: e_av(b15, dB), "tol": 1e-5},
    {"name": "D3-15 dmin", "stated": 2, "derive": lambda: dmin(b15, dB), "tol": 1e-5},
    {"name": "D3-15 average nearest neighbours", "stated": 1.5, "derive": lambda: np.mean(nn_counts(b15, dB))},
]
CHECKS += ortho_checks("D3-16", 1000) + [
    {"name": "D3-16 s1 coordinates (first)", "stated": 1, "derive": lambda: coords_iq(b16[1], 1000)[0], "tol": 1e-4},
    {"name": "D3-16 s1 coordinates (second)", "stated": 1, "derive": lambda: coords_iq(b16[1], 1000)[1], "tol": 1e-4},
    {"name": "D3-16 Es,av", "stated": 2, "derive": lambda: e_av(b16, dB), "tol": 1e-5},
    {"name": "D3-16 dmin^2", "stated": 1.172, "derive": lambda: dmin(b16, dB) ** 2, "tol": 1e-3},
    {"name": "D3-16 dmin", "stated": 1.082, "derive": lambda: dmin(b16, dB), "tol": 1e-3},
    {"name": "D3-16 nearest neighbours", "stated": 2, "derive": lambda: min(nn_counts(b16, dB))},
    {"name": "D3-16 dmin^2/Es,av", "stated": 0.5858, "derive": lambda: dmin(b16, dB) ** 2 / e_av(b16, dB), "tol": 1e-3},
    {"name": "D3-16 arc length (the common error)", "stated": 1.111, "derive": lambda: math.sqrt(2) * PI / 4, "tol": 1e-3},
]
CHECKS += ortho_checks("D3-17", 3000) + [
    {"name": "D3-17 coordinate size", "stated": 1.581, "derive": lambda: coords_iq(b17[0], 3000)[0], "tol": 1e-3},
    {"name": "D3-17 Es,av", "stated": 5, "derive": lambda: e_av(b17, dB), "tol": 1e-5},
    {"name": "D3-17 dmin", "stated": 3.162, "derive": lambda: dmin(b17, dB), "tol": 1e-3},
    {"name": "D3-17 largest distance", "stated": 4.472, "derive": lambda: max(all_d(b17, dB).values()), "tol": 1e-3},
    {"name": "D3-17 nearest neighbours", "stated": 2, "derive": lambda: min(nn_counts(b17, dB))},
]
CHECKS += ortho_checks("D3-18", 2000) + [
    {"name": "D3-18 Es,av", "stated": 10, "derive": lambda: e_av(b18, dB), "tol": 1e-5},
    {"name": "D3-18 dmin", "stated": 2, "derive": lambda: dmin(b18, dB), "tol": 1e-5},
    {"name": "D3-18 average nearest neighbours", "stated": 3, "derive": lambda: np.mean(nn_counts(b18, dB))},
    {"name": "D3-18 corner neighbours", "stated": 2, "derive": lambda: nn_counts(b18, dB)[0]},
    {"name": "D3-18 edge neighbours", "stated": 3, "derive": lambda: nn_counts(b18, dB)[1]},
    {"name": "D3-18 inner neighbours", "stated": 4, "derive": lambda: nn_counts(b18, dB)[5]},
    {"name": "D3-18 symbols of energy 10", "stated": 8,
     "derive": lambda: sum(1 for s in b18 if abs(energy(s, dB) - 10) < 1e-3)},
]
CHECKS += ortho_checks("D3-19", 1000) + [
    {"name": "D3-19 s5 coordinates", "stated": 2, "derive": lambda: coords_iq(b19[4], 1000)[1], "tol": 1e-4},
    {"name": "D3-19 inner energy", "stated": 4, "derive": lambda: energy(b19[0], dB), "tol": 1e-5},
    {"name": "D3-19 outer energy", "stated": 8, "derive": lambda: energy(b19[4], dB), "tol": 1e-5},
    {"name": "D3-19 Es,av", "stated": 6, "derive": lambda: e_av(b19, dB), "tol": 1e-5},
    {"name": "D3-19 dmin", "stated": 2, "derive": lambda: dmin(b19, dB), "tol": 1e-5},
    {"name": "D3-19 inner ring spacing", "stated": 2.828, "derive": lambda: dist(b19[0], b19[1], dB), "tol": 1e-3},
    {"name": "D3-19 outer ring spacing", "stated": 4, "derive": lambda: dist(b19[4], b19[5], dB), "tol": 1e-5},
    {"name": "D3-19 nearest neighbours (all)", "stated": 2, "derive": lambda: max(nn_counts(b19, dB))},
    {"name": "D3-19 nearest neighbours (least)", "stated": 2, "derive": lambda: min(nn_counts(b19, dB))},
]
CHECKS += ortho_checks("D3-20", 1000) + [
    {"name": "D3-20 s3 second coordinate", "stated": math.sqrt(3), "derive": lambda: coords_iq(b20[2], 1000)[1], "tol": 1e-4},
    {"name": "D3-20 Es,av", "stated": 3, "derive": lambda: e_av(b20, dB), "tol": 1e-5},
    {"name": "D3-20 dmin", "stated": 2, "derive": lambda: dmin(b20, dB), "tol": 1e-5},
    {"name": "D3-20 outer spacing", "stated": 3.464, "derive": lambda: dist(b20[1], b20[2], dB), "tol": 1e-3},
    {"name": "D3-20 neighbours of the zero symbol", "stated": 3, "derive": lambda: nn_counts(b20, dB)[0]},
    {"name": "D3-20 neighbours of an outer symbol", "stated": 1, "derive": lambda: nn_counts(b20, dB)[1]},
    {"name": "D3-20 dmin^2/Es,av", "stated": 1.333, "derive": lambda: dmin(b20, dB) ** 2 / e_av(b20, dB), "tol": 1e-3},
]
_c1 = math.sqrt(2) * np.cos(2000 * PI * TB)
_c2 = math.sqrt(2) * np.cos(3000 * PI * TB)
CHECKS += [
    {"name": "D3-21 psi1 energy", "stated": 1, "derive": lambda: energy(_c1, dB), "tol": 1e-6},
    {"name": "D3-21 psi2 energy", "stated": 1, "derive": lambda: energy(_c2, dB), "tol": 1e-6},
    {"name": "D3-21 <psi1,psi2> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(_c1, _c2, dB), "tol": 1e-6},
    {"name": "D3-21 dimensions", "stated": 2, "derive": lambda: dim(b21, dB)},
    {"name": "D3-21 Es,av", "stated": 9, "derive": lambda: e_av(b21, dB), "tol": 1e-5},
    {"name": "D3-21 dmin", "stated": 4.243, "derive": lambda: dmin(b21, dB), "tol": 1e-3},
    {"name": "D3-21 opposite", "stated": 6, "derive": lambda: dist(b21[0], b21[2], dB), "tol": 1e-5},
    {"name": "D3-21 nearest neighbours", "stated": 2, "derive": lambda: min(nn_counts(b21, dB))},
]
CHECKS += ortho_checks("D3-23", 1000) + [
    {"name": "D3-23 Es,av", "stated": 6, "derive": lambda: e_av(b23, dB), "tol": 1e-5},
    {"name": "D3-23 dmin", "stated": 2, "derive": lambda: dmin(b23, dB), "tol": 1e-5},
    {"name": "D3-23 inner neighbours", "stated": 3, "derive": lambda: nn_counts(b23, dB)[2]},
    {"name": "D3-23 outer neighbours", "stated": 2, "derive": lambda: nn_counts(b23, dB)[0]},
    {"name": "D3-23 average nearest neighbours", "stated": 2.5, "derive": lambda: np.mean(nn_counts(b23, dB))},
]
CHECKS += ortho_checks("D3-24", 1500) + [
    {"name": "D3-24 s2 first coordinate", "stated": -2, "derive": lambda: coords_iq(b24[1], 1500)[0], "tol": 1e-4},
    {"name": "D3-24 s3 second coordinate", "stated": -3, "derive": lambda: coords_iq(b24[2], 1500)[1], "tol": 1e-4},
    {"name": "D3-24 s4 first coordinate", "stated": 4, "derive": lambda: coords_iq(b24[3], 1500)[0], "tol": 1e-4},
    {"name": "D3-24 Es,av", "stated": 7.5, "derive": lambda: e_av(b24, dB), "tol": 1e-5},
    {"name": "D3-24 d12", "stated": 2.236, "derive": lambda: dist(b24[0], b24[1], dB), "tol": 1e-3},
    {"name": "D3-24 d13", "stated": 4, "derive": lambda: dist(b24[0], b24[2], dB), "tol": 1e-5},
    {"name": "D3-24 d14", "stated": 4.123, "derive": lambda: dist(b24[0], b24[3], dB), "tol": 1e-3},
    {"name": "D3-24 d23", "stated": 3.606, "derive": lambda: dist(b24[1], b24[2], dB), "tol": 1e-3},
    {"name": "D3-24 d24", "stated": 6, "derive": lambda: dist(b24[1], b24[3], dB), "tol": 1e-5},
    {"name": "D3-24 d34", "stated": 5, "derive": lambda: dist(b24[2], b24[3], dB), "tol": 1e-5},
    {"name": "D3-24 symbols with a neighbour at dmin", "stated": 2,
     "derive": lambda: sum(1 for c in nn_counts(b24, dB) if c > 0)},
]

# ── D3-25 … D3-30: reversed and comparison questions ───────────────────────

p25 = [U([0.5, 0.5, 0.5, 0.5]), U([0.5, 0.5, -0.5, -0.5])]
v25 = [(2, 2), (2, -2), (-2, -2), (-2, 2)]
s25 = [a * p25[0] + b * p25[1] for a, b in v25]


def synth26(x, y):
    p1, p2 = iq(2000)
    return x * p1 + y * p2


pts26 = [(1, 1), (-1, 1), (-1, -1), (1, -1), (3, 0), (0, 3), (-3, 0), (0, -3)]
s26 = [synth26(*p) for p in pts26]


def amp_phase(s, f):
    """Amplitude and phase of a sampled carrier, from its cos and sin content."""
    a = 2 * ip(s, np.cos(2 * PI * f * TB), dB)
    b = -2 * ip(s, np.sin(2 * PI * f * TB), dB)
    return math.hypot(a, b), math.atan2(b, a)


def psk8_dmin(E):
    pts = [carrier(math.sqrt(2 * E), 2000, k * PI / 4) for k in range(8)]
    return dmin(pts, dB)


q27 = [U([2, 2, 0, 0]), U([0, 0, 2, 2]), U([1, 1, 1, 1]), U([3, 3, -1, -1])]
G27 = gram_schmidt(q27, DT)
b28 = [2 * (2 * k - 5) * np.cos(2000 * PI * TB + PI / 3) for k in range(1, 5)]
phi28 = math.sqrt(2) * np.cos(2000 * PI * TB + PI / 3)
q29 = [U([1, 1, 1]), U([2, 0, 0])]
G29a = gram_schmidt(q29, DT)
G29b = gram_schmidt(q29[::-1], DT)
A30 = [U([1, 1, 1, 1]), U([-1, -1, -1, -1])]
B30 = [U([1, 1, 1, 1]), U([1, 1, -1, -1])]
C30 = [U([0, 0, 0, 0]), U([2, 2, 0, 0])]

CHECKS += [
    {"name": "D3-25 psi1 energy", "stated": 1, "derive": lambda: energy(p25[0], DT)},
    {"name": "D3-25 psi2 energy", "stated": 1, "derive": lambda: energy(p25[1], DT)},
    {"name": "D3-25 <psi1,psi2> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(*p25, DT)},
    {"name": "D3-25 height of s1 on [0,2)", "stated": 2, "derive": lambda: s25[0][0]},
    {"name": "D3-25 height of s1 on [2,4] (1 + value)", "stated": 1, "derive": lambda: 1 + s25[0][-1]},
    {"name": "D3-25 energy of each waveform", "stated": 8, "derive": lambda: energy(s25[2], DT)},
    {"name": "D3-25 Es,av", "stated": 8, "derive": lambda: e_av(s25, DT)},
    {"name": "D3-25 dmin", "stated": 4, "derive": lambda: dmin(s25, DT)},
    {"name": "D3-25 opposite", "stated": 5.657, "derive": lambda: dist(s25[0], s25[2], DT), "tol": 1e-3},
    {"name": "D3-25 nearest neighbours", "stated": 2, "derive": lambda: min(nn_counts(s25, DT))},
    {"name": "D3-25 orthogonal pairs", "stated": 4,
     "derive": lambda: sum(1 for i, j in itertools.combinations(range(4), 2) if abs(ip(s25[i], s25[j], DT)) < 1e-9)},
    {"name": "D3-26 inner amplitude", "stated": 2, "derive": lambda: amp_phase(s26[0], 2000)[0], "tol": 1e-5},
    {"name": "D3-26 inner phase of s1", "stated": PI / 4, "derive": lambda: amp_phase(s26[0], 2000)[1], "tol": 1e-5},
    {"name": "D3-26 outer amplitude", "stated": 3 * math.sqrt(2), "derive": lambda: amp_phase(s26[5], 2000)[0], "tol": 1e-5},
    {"name": "D3-26 outer phase of s6", "stated": PI / 2, "derive": lambda: amp_phase(s26[5], 2000)[1], "tol": 1e-5},
    {"name": "D3-26 Es,av", "stated": 5.5, "derive": lambda: e_av(s26, dB), "tol": 1e-5},
    {"name": "D3-26 dmin", "stated": 2, "derive": lambda: dmin(s26, dB), "tol": 1e-5},
    {"name": "D3-26 inner-outer distance", "stated": 2.236, "derive": lambda: dist(s26[0], s26[4], dB), "tol": 1e-3},
    {"name": "D3-26 outer spacing", "stated": 4.243, "derive": lambda: dist(s26[4], s26[5], dB), "tol": 1e-3},
    {"name": "D3-26 inner neighbours", "stated": 2, "derive": lambda: nn_counts(s26, dB)[0]},
    {"name": "D3-26 outer neighbours (1 + value)", "stated": 1, "derive": lambda: 1 + nn_counts(s26, dB)[4]},
    {"name": "D3-26 eight-phase dmin at Es,av 5.5", "stated": 1.795, "derive": lambda: psk8_dmin(5.5), "tol": 1e-3},
    {"name": "D3-27 dimensions", "stated": 2, "derive": lambda: len(G27[0])},
    {"name": "D3-27 s41", "stated": 3 * math.sqrt(2), "derive": lambda: G27[1][3][0], "tol": 1e-4},
    {"name": "D3-27 s42", "stated": -math.sqrt(2), "derive": lambda: G27[1][3][1], "tol": 1e-4},
    {"name": "D3-27 E4", "stated": 20, "derive": lambda: energy(q27[3], DT)},
    {"name": "D3-27 Es,av", "stated": 10, "derive": lambda: e_av(q27, DT)},
    {"name": "D3-27 dmin", "stated": 2, "derive": lambda: dmin(q27, DT)},
    {"name": "D3-27 d12", "stated": 4, "derive": lambda: dist(q27[0], q27[1], DT)},
    {"name": "D3-27 d34", "stated": 4, "derive": lambda: dist(q27[2], q27[3], DT)},
    {"name": "D3-27 d24", "stated": 6, "derive": lambda: dist(q27[1], q27[3], DT)},
    {"name": "D3-27 neighbours of s1", "stated": 2, "derive": lambda: nn_counts(q27, DT)[0]},
    {"name": "D3-27 neighbours of s2", "stated": 1, "derive": lambda: nn_counts(q27, DT)[1]},
    {"name": "D3-27 s4 = 1.5 s1 - 0.5 s2 (1 + residual energy)", "stated": 1,
     "derive": lambda: 1 + energy(q27[3] - (1.5 * q27[0] - 0.5 * q27[1]), DT)},
    {"name": "D3-28 s4 first coordinate", "stated": 2.121, "derive": lambda: coords_iq(b28[3], 1000)[0], "tol": 1e-3},
    {"name": "D3-28 s4 second coordinate", "stated": 3.674, "derive": lambda: coords_iq(b28[3], 1000)[1], "tol": 1e-3},
    {"name": "D3-28 unit energy of phi", "stated": 1, "derive": lambda: energy(phi28, dB), "tol": 1e-6},
    {"name": "D3-28 dimensions", "stated": 1, "derive": lambda: dim(b28, dB)},
    {"name": "D3-28 coordinate of s4 on phi", "stated": 4.243, "derive": lambda: ip(b28[3], phi28, dB), "tol": 1e-3},
    {"name": "D3-28 Es,av", "stated": 10, "derive": lambda: e_av(b28, dB), "tol": 1e-5},
    {"name": "D3-28 dmin", "stated": 2.828, "derive": lambda: dmin(b28, dB), "tol": 1e-3},
    {"name": "D3-29 first run, s2 coordinates (first)", "stated": 1.155, "derive": lambda: G29a[1][1][0], "tol": 1e-3},
    {"name": "D3-29 first run, s2 coordinates (second)", "stated": 1.633, "derive": lambda: G29a[1][1][1], "tol": 1e-3},
    {"name": "D3-29 first run, remainder energy", "stated": 8 / 3, "derive": lambda: G29a[2][1]},
    {"name": "D3-29 second run, s1 coordinates (first)", "stated": 1, "derive": lambda: G29b[1][1][0]},
    {"name": "D3-29 second run, s1 coordinates (second)", "stated": 1.414, "derive": lambda: G29b[1][1][1], "tol": 1e-3},
    {"name": "D3-29 distance, first run vectors", "stated": 1.732,
     "derive": lambda: float(np.linalg.norm(G29a[1][0] - G29a[1][1])), "tol": 1e-3},
    {"name": "D3-29 distance, second run vectors", "stated": 1.732,
     "derive": lambda: float(np.linalg.norm(G29b[1][0] - G29b[1][1])), "tol": 1e-3},
    {"name": "D3-29 rho12", "stated": 0.5774, "derive": lambda: rho(*q29, DT), "tol": 1e-3},
    {"name": "D3-29 E2", "stated": 4, "derive": lambda: energy(q29[1], DT)},
    {"name": "D3-30 A dimensions", "stated": 1, "derive": lambda: dim(A30, DT)},
    {"name": "D3-30 B dimensions", "stated": 2, "derive": lambda: dim(B30, DT)},
    {"name": "D3-30 C dimensions", "stated": 1, "derive": lambda: dim(C30, DT)},
    {"name": "D3-30 Es,av of C", "stated": 4, "derive": lambda: e_av(C30, DT)},
    {"name": "D3-30 Es,av of B", "stated": 4, "derive": lambda: e_av(B30, DT)},
    {"name": "D3-30 d of A", "stated": 4, "derive": lambda: dist(*A30, DT)},
    {"name": "D3-30 d of B", "stated": 2.828, "derive": lambda: dist(*B30, DT), "tol": 1e-3},
    {"name": "D3-30 d of C", "stated": 2.828, "derive": lambda: dist(*C30, DT), "tol": 1e-3},
    {"name": "D3-30 gain of A over B in dB", "stated": 3.01,
     "derive": lambda: 10 * math.log10((dist(*A30, DT) ** 2 / e_av(A30, DT)) / (dist(*B30, DT) ** 2 / e_av(B30, DT))),
     "tol": 1e-3},
]

# ── the three textbook-shaped questions: D3-04, D3-10, D3-22 ──────────────

# D3-04: simplex set from three orthogonal waveforms. The simplex waveforms are
# formed by subtracting the sampled average, and every number is read off the
# samples. The general-M claims use sampled Walsh sets, not the formula.
sbar04 = sum(q04) / 3
u04 = [s - sbar04 for s in q04]
B04 = G["q04"][0]


def walsh_set(M):
    """M orthogonal equal-energy waveforms on [0, M]: rows of a Sylvester matrix."""
    H = np.array([[1.0]])
    while H.shape[0] < M:
        H = np.block([[H, H], [H, -H]])
    return [U(list(r)) for r in H]


def simplex_of(sigs):
    m = sum(sigs) / len(sigs)
    return [s - m for s in sigs]


def saving_db(sigs):
    u = simplex_of(sigs)
    return 10 * math.log10(e_av(sigs, DT) / e_av(u, DT))


def energy_ratio(sigs):
    return e_av(sigs, DT) / e_av(simplex_of(sigs), DT)


def at(x, t):
    """Sample value of a drawn waveform at time t."""
    return float(x[int(t / DT)])


# D3-10: two four-point sets on shifted pulses of height 2.
A10 = q10
B10 = [U([2, 2, 0, 0]), U([0, 0, 2, 2]), U([2, 0, 2, 0]), U([0, 2, 0, 2])]
psi10 = [U([1 if j == i else 0 for j in range(4)]) for i in range(4)]
bbar10 = sum(B10) / 4
phia10 = U([0.5, 0.5, -0.5, -0.5])

# D3-22: carrier waveforms built from a(t), b(t) on [0, 2] at f_c = 1000 Hz.
N22 = 2 * NB
T22 = (np.arange(N22) + 0.5) / NB
d22 = 1 / NB
C22 = np.cos(2 * PI * 1000 * T22)
S22 = np.sin(2 * PI * 1000 * T22)
a22 = np.where(T22 < 1, 3.0, 1.0)
b22 = np.where(T22 < 1, 1.0, -3.0)


def set22(a, b):
    return [a * C22 - b * S22, b * C22 - a * S22, b * C22 + a * S22, a * C22 + b * S22]


s22 = set22(a22, b22)
t22 = set22(a22, 2 * b22)
phi22 = [a22 * C22 / math.sqrt(5), -a22 * S22 / math.sqrt(5),
         b22 * C22 / math.sqrt(5), -b22 * S22 / math.sqrt(5)]
first22 = T22 < 1

CHECKS += [
    # D3-04
    {"name": "D3-04 <s1,s2> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(q04[0], q04[1], DT)},
    {"name": "D3-04 <s1,s3> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(q04[0], q04[2], DT)},
    {"name": "D3-04 <s2,s3> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(q04[1], q04[2], DT)},
    {"name": "D3-04 E1", "stated": 81, "derive": lambda: energy(q04[0], DT)},
    {"name": "D3-04 E2", "stated": 81, "derive": lambda: energy(q04[1], DT)},
    {"name": "D3-04 E3", "stated": 81, "derive": lambda: energy(q04[2], DT)},
    {"name": "D3-04 coordinate of s3 on psi3", "stated": 9, "derive": lambda: co("q04", 2, 2)},
    {"name": "D3-04 orthogonal set dimensions", "stated": 3, "derive": lambda: dim(q04, DT)},
    {"name": "D3-04 average on [0,1)", "stated": 5, "derive": lambda: at(sbar04, 0.5)},
    {"name": "D3-04 average on [2,3]", "stated": 1, "derive": lambda: at(sbar04, 2.5)},
    {"name": "D3-04 u1 on [0,1)", "stated": -2, "derive": lambda: at(u04[0], 0.5)},
    {"name": "D3-04 u2 on [2,3]", "stated": -7, "derive": lambda: at(u04[1], 2.5)},
    {"name": "D3-04 u3 on [1,2)", "stated": -7, "derive": lambda: at(u04[2], 1.5)},
    {"name": "D3-04 average vector coordinate", "stated": 3, "derive": lambda: ip(sbar04, B04[0], DT)},
    {"name": "D3-04 u1 coordinate on psi1", "stated": 6, "derive": lambda: ip(u04[0], B04[0], DT)},
    {"name": "D3-04 u1 coordinate on psi2", "stated": -3, "derive": lambda: ip(u04[0], B04[1], DT)},
    {"name": "D3-04 u2 coordinate on psi2", "stated": 6, "derive": lambda: ip(u04[1], B04[1], DT)},
    {"name": "D3-04 Eu", "stated": 54, "derive": lambda: energy(u04[0], DT)},
    {"name": "D3-04 Eu of u3", "stated": 54, "derive": lambda: energy(u04[2], DT)},
    {"name": "D3-04 <u1,u2>", "stated": -27, "derive": lambda: ip(u04[0], u04[1], DT)},
    {"name": "D3-04 <u1,u3>", "stated": -27, "derive": lambda: ip(u04[0], u04[2], DT)},
    {"name": "D3-04 <u2,u3>", "stated": -27, "derive": lambda: ip(u04[1], u04[2], DT)},
    {"name": "D3-04 rho", "stated": -0.5, "derive": lambda: rho(u04[0], u04[1], DT)},
    {"name": "D3-04 d12 orthogonal set", "stated": 12.73, "derive": lambda: dist(q04[0], q04[1], DT), "tol": 1e-3},
    {"name": "D3-04 d12 simplex set", "stated": 12.73, "derive": lambda: dist(u04[0], u04[1], DT), "tol": 1e-3},
    {"name": "D3-04 d23 simplex set", "stated": 12.73, "derive": lambda: dist(u04[1], u04[2], DT), "tol": 1e-3},
    {"name": "D3-04 d12^2", "stated": 162, "derive": lambda: dist(u04[0], u04[1], DT) ** 2},
    {"name": "D3-04 simplex dimensions", "stated": 2, "derive": lambda: dim(u04, DT)},
    {"name": "D3-04 Es/Eu, M=2", "stated": 2, "derive": lambda: energy_ratio(walsh_set(2))},
    {"name": "D3-04 Es/Eu, M=3", "stated": 1.5, "derive": lambda: energy_ratio(q04)},
    {"name": "D3-04 Es/Eu, M=4", "stated": 1.333, "derive": lambda: energy_ratio(walsh_set(4)), "tol": 1e-3},
    {"name": "D3-04 Es/Eu, M=8", "stated": 1.143, "derive": lambda: energy_ratio(walsh_set(8)), "tol": 1e-3},
    {"name": "D3-04 Es/Eu, M=16", "stated": 1.067, "derive": lambda: energy_ratio(walsh_set(16)), "tol": 1e-3},
    {"name": "D3-04 saving dB, M=2", "stated": 3.010, "derive": lambda: saving_db(walsh_set(2)), "tol": 1e-3},
    {"name": "D3-04 saving dB, M=3", "stated": 1.761, "derive": lambda: saving_db(q04), "tol": 1e-3},
    {"name": "D3-04 saving dB, M=4", "stated": 1.249, "derive": lambda: saving_db(walsh_set(4)), "tol": 1e-3},
    {"name": "D3-04 saving dB, M=8", "stated": 0.580, "derive": lambda: saving_db(walsh_set(8)), "tol": 1e-3},
    {"name": "D3-04 saving dB, M=16", "stated": 0.280, "derive": lambda: saving_db(walsh_set(16)), "tol": 2e-3},
    {"name": "D3-04 rho for M=2", "stated": -1, "derive": lambda: rho(*simplex_of(walsh_set(2)), DT)},
    {"name": "D3-04 rho for M=8 is -1/7", "stated": -1 / 7,
     "derive": lambda: rho(simplex_of(walsh_set(8))[2], simplex_of(walsh_set(8))[5], DT)},
    # D3-10
    {"name": "D3-10 psi_i energy", "stated": 1, "derive": lambda: energy(psi10[2], DT)},
    {"name": "D3-10 <psi0,psi1> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(psi10[0], psi10[1], DT)},
    {"name": "D3-10 set A dimensions", "stated": 4, "derive": lambda: dim(A10, DT)},
    {"name": "D3-10 a2 coordinate", "stated": 2, "derive": lambda: ip(A10[2], psi10[2], DT)},
    {"name": "D3-10 b2 coordinate on psi2", "stated": 2, "derive": lambda: ip(B10[2], psi10[2], DT)},
    {"name": "D3-10 b2 coordinate on psi1 (1 + value)", "stated": 1, "derive": lambda: 1 + ip(B10[2], psi10[1], DT)},
    {"name": "D3-10 Es,av of A", "stated": 4, "derive": lambda: e_av(A10, DT)},
    {"name": "D3-10 Eb of A", "stated": 2, "derive": lambda: e_av(A10, DT) / math.log2(4)},
    {"name": "D3-10 Es,av of B", "stated": 8, "derive": lambda: e_av(B10, DT)},
    {"name": "D3-10 Eb of B", "stated": 4, "derive": lambda: e_av(B10, DT) / math.log2(4)},
    {"name": "D3-10 B d01", "stated": 4, "derive": lambda: dist(B10[0], B10[1], DT)},
    {"name": "D3-10 B d02", "stated": 2.828, "derive": lambda: dist(B10[0], B10[2], DT), "tol": 1e-3},
    {"name": "D3-10 B d03", "stated": 2.828, "derive": lambda: dist(B10[0], B10[3], DT), "tol": 1e-3},
    {"name": "D3-10 B d12", "stated": 2.828, "derive": lambda: dist(B10[1], B10[2], DT), "tol": 1e-3},
    {"name": "D3-10 B d13", "stated": 2.828, "derive": lambda: dist(B10[1], B10[3], DT), "tol": 1e-3},
    {"name": "D3-10 B d23", "stated": 4, "derive": lambda: dist(B10[2], B10[3], DT)},
    {"name": "D3-10 dmin of A", "stated": 2.828, "derive": lambda: dmin(A10, DT), "tol": 1e-3},
    {"name": "D3-10 dmin of B", "stated": 2.828, "derive": lambda: dmin(B10, DT), "tol": 1e-3},
    {"name": "D3-10 nearest neighbours in A", "stated": 3, "derive": lambda: min(nn_counts(A10, DT))},
    {"name": "D3-10 nearest neighbours in B (min)", "stated": 2, "derive": lambda: min(nn_counts(B10, DT))},
    {"name": "D3-10 nearest neighbours in B (max)", "stated": 2, "derive": lambda: max(nn_counts(B10, DT))},
    {"name": "D3-10 dmin^2/Eb of A", "stated": 4, "derive": lambda: dmin(A10, DT) ** 2 / (e_av(A10, DT) / 2)},
    {"name": "D3-10 dmin^2/Eb of B", "stated": 2, "derive": lambda: dmin(B10, DT) ** 2 / (e_av(B10, DT) / 2)},
    {"name": "D3-10 gain of A over B in dB", "stated": 3.01,
     "derive": lambda: 10 * math.log10((dmin(A10, DT) ** 2 / e_av(A10, DT)) / (dmin(B10, DT) ** 2 / e_av(B10, DT))),
     "tol": 1e-3},
    {"name": "D3-10 energy of the common part", "stated": 4, "derive": lambda: energy(bbar10, DT)},
    {"name": "D3-10 remainder energy", "stated": 4, "derive": lambda: energy(B10[3] - bbar10, DT)},
    {"name": "D3-10 common part orthogonal to remainder (1 + value)", "stated": 1,
     "derive": lambda: 1 + ip(bbar10, B10[0] - bbar10, DT)},
    {"name": "D3-10 b0 - bbar on phi_a", "stated": 2, "derive": lambda: ip(B10[0] - bbar10, phia10, DT)},
    {"name": "D3-10 energy of b0 - b2", "stated": 8, "derive": lambda: energy(B10[0] - B10[2], DT)},
    {"name": "D3-10 energy of a0 - a1", "stated": 8, "derive": lambda: energy(A10[0] - A10[1], DT)},
    {"name": "D3-10 set B dimensions", "stated": 3, "derive": lambda: dim(B10, DT)},
    # D3-22
    {"name": "D3-22 Ea", "stated": 10, "derive": lambda: energy(a22, d22), "tol": 1e-6},
    {"name": "D3-22 Eb", "stated": 10, "derive": lambda: energy(b22, d22), "tol": 1e-6},
    {"name": "D3-22 <a,b> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(a22, b22, d22), "tol": 1e-6},
    {"name": "D3-22 integral of cos^2 on [0,1)", "stated": 0.5,
     "derive": lambda: ip(C22[first22], C22[first22], d22), "tol": 1e-6},
    {"name": "D3-22 integral of sin^2 on [1,2)", "stated": 0.5,
     "derive": lambda: ip(S22[~first22], S22[~first22], d22), "tol": 1e-6},
    {"name": "D3-22 integral of cos sin on [0,1) (1 + value)", "stated": 1,
     "derive": lambda: 1 + ip(C22[first22], S22[first22], d22), "tol": 1e-6},
] + [
    {"name": f"D3-22 E{k + 1}", "stated": 10, "derive": (lambda k=k: energy(s22[k], d22)), "tol": 1e-6}
    for k in range(4)
] + [
    {"name": f"D3-22 <s{j + 1},s{k + 1}> (1 + value)", "stated": 1,
     "derive": (lambda j=j, k=k: 1 + ip(s22[j], s22[k], d22)), "tol": 1e-6}
    for j, k in itertools.combinations(range(4), 2)
] + [
    {"name": "D3-22 dimensions", "stated": 4, "derive": lambda: dim(s22, d22)},
    {"name": "D3-22 energy of aC", "stated": 5, "derive": lambda: energy(a22 * C22, d22), "tol": 1e-6},
    {"name": "D3-22 phi1 energy", "stated": 1, "derive": lambda: energy(phi22[0], d22), "tol": 1e-6},
    {"name": "D3-22 <phi1,phi3> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(phi22[0], phi22[2], d22), "tol": 1e-6},
    {"name": "D3-22 <phi2,phi4> (1 + value)", "stated": 1, "derive": lambda: 1 + ip(phi22[1], phi22[3], d22), "tol": 1e-6},
    {"name": "D3-22 s1 on phi1", "stated": math.sqrt(5), "derive": lambda: ip(s22[0], phi22[0], d22), "tol": 1e-6},
    {"name": "D3-22 s1 on phi4", "stated": math.sqrt(5), "derive": lambda: ip(s22[0], phi22[3], d22), "tol": 1e-6},
    {"name": "D3-22 s3 on phi2", "stated": -math.sqrt(5), "derive": lambda: ip(s22[2], phi22[1], d22), "tol": 1e-6},
    {"name": "D3-22 s4 on phi4", "stated": -math.sqrt(5), "derive": lambda: ip(s22[3], phi22[3], d22), "tol": 1e-6},
    {"name": "D3-22 dmin", "stated": 4.472, "derive": lambda: dmin(s22, d22), "tol": 1e-3},
    {"name": "D3-22 largest distance", "stated": 4.472, "derive": lambda: max(all_d(s22, d22).values()), "tol": 1e-3},
    {"name": "D3-22 dmin^2/Es,av", "stated": 2, "derive": lambda: dmin(s22, d22) ** 2 / e_av(s22, d22), "tol": 1e-6},
    {"name": "D3-22 energy of 2b", "stated": 40, "derive": lambda: energy(2 * b22, d22), "tol": 1e-6},
    {"name": "D3-22 (d) energy", "stated": 25, "derive": lambda: energy(t22[0], d22), "tol": 1e-6},
    {"name": "D3-22 (d) <s1,s4>", "stated": -15, "derive": lambda: ip(t22[0], t22[3], d22), "tol": 1e-6},
    {"name": "D3-22 (d) <s2,s3>", "stated": 15, "derive": lambda: ip(t22[1], t22[2], d22), "tol": 1e-6},
    {"name": "D3-22 (d) rho14", "stated": -0.6, "derive": lambda: rho(t22[0], t22[3], d22), "tol": 1e-6},
    {"name": "D3-22 (d) rho23", "stated": 0.6, "derive": lambda: rho(t22[1], t22[2], d22), "tol": 1e-6},
] + [
    {"name": f"D3-22 (d) <s{j + 1},s{k + 1}> stays 0 (1 + value)", "stated": 1,
     "derive": (lambda j=j, k=k: 1 + ip(t22[j], t22[k], d22)), "tol": 1e-6}
    for j, k in [(0, 1), (2, 3), (0, 2), (1, 3)]
] + [
    {"name": "D3-22 check: <s1,s4> over [0,1)", "stated": 4,
     "derive": lambda: ip(s22[0][first22], s22[3][first22], d22), "tol": 1e-6},
    {"name": "D3-22 check: <s1,s4> over [1,2]", "stated": -4,
     "derive": lambda: ip(s22[0][~first22], s22[3][~first22], d22), "tol": 1e-6},
]

DEFAULT_TOL = 5e-4


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
