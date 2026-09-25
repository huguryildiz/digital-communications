"""PASS lines for every number stated in build/src/85_scenes_m4.js.

Module 4, the optimal receiver in AWGN: the slide cards, the prediction
questions, the gallery captions and the counts the figures print. The seeded
noise of the figures (mulberry32 and Box-Muller in the scene file) is ported
here bit for bit, so a count a figure prints is the count checked below.

    .venv/bin/python verify/verify_m4.py      # N passed, 0 failed
"""
import math

import numpy as np

Q = lambda x: 0.5 * math.erfc(x / math.sqrt(2))
dB = lambda d: 10 ** (d / 10)

passed = failed = 0


def check(name, got, want, tol):
    global passed, failed
    ok = abs(got - want) <= tol
    passed += ok
    failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {got:.6g} (want {want} ± {tol})")


def truth(name, ok):
    global passed, failed
    passed += bool(ok)
    failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {name}")


def solve(g, lo, hi):
    for _ in range(200):
        mid = (lo + hi) / 2
        if g(lo) * g(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


# ---- the seeded noise of the scene file --------------------------------
M32 = 0xFFFFFFFF


def i32(x):
    x &= M32
    return x - (1 << 32) if x >= (1 << 31) else x


def imul(a, b):
    return i32((a & M32) * (b & M32))


def rng(seed):
    state = [seed & M32]

    def nxt():
        a = state[0] = (state[0] + 0x6D2B79F5) & M32
        t = imul(a ^ (a >> 15), 1 | a)
        t = i32(i32(t + imul(i32(t ^ ((t & M32) >> 7)), 61 | t)) ^ t)
        return ((t ^ ((t & M32) >> 14)) & M32) / 4294967296
    return nxt


def gauss(seed, n, s):
    r = rng(seed)
    out = []
    for _ in range(n):
        u = max(1e-12, r())
        v = r()
        out.append(s * math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v))
    return out


# ---- 4.0 opening: 300 draws around s1 = (1,1), sigma 0.55 ----------------
ZO = gauss(20260924, 600, 1)
k_open = sum(1 for i in range(300) if 1 + 0.55 * ZO[2 * i] < 0 or 1 + 0.55 * ZO[2 * i + 1] < 0)
print(f"INFO  m4-open prints 'outside R_1: {k_open} of 300'")
check("m4-open outside count near 300(1-(1-Q(1/0.55))^2)", k_open / 300,
      1 - (1 - Q(1 / 0.55)) ** 2, 0.03)

# ---- 4.1 the observation ------------------------------------------------
check("m4-mary k = log2 16", math.log2(16), 4, 1e-12)
check("m4-mary R_b = 4 x 2400", 4 * 2400, 9600, 0)
check("m4-observe r1 = 2 + 0.3", 2 + 0.3, 2.3, 1e-12)
check("m4-observe r2 = -1 - 0.4", -1 - 0.4, -1.4, 1e-12)

# matched filter: psi(t) = sqrt3 t on [0,1], r = 1.5 psi
t = np.linspace(0, 1, 200001)
psi = np.sqrt(3) * t
check("m4-mfbank psi has unit energy", np.trapezoid(psi ** 2, t), 1, 1e-6)
check("m4-mfbank y(T) = 1.5 int psi^2", 1.5 * np.trapezoid(psi ** 2, t), 1.5, 1e-6)


def y_mf(t0):
    tau = np.linspace(0, 1, 200001)
    arg = 1 - t0 + tau
    h = np.where((arg >= 0) & (arg <= 1), np.sqrt(3) * arg, 0.0)
    return np.trapezoid(1.5 * np.sqrt(3) * tau * h, tau)


mfY = lambda t0: 4.5 * (t0 ** 2 / 2 - t0 ** 3 / 6) if t0 <= 1 else 4.5 * (1 / 3 - (t0 - 1) / 2 + (t0 - 1) ** 3 / 6)
for t0 in (0.4, 1.0, 1.5):
    check(f"m4-mfbank figure y({t0}) matches the convolution", mfY(t0), y_mf(t0), 1e-4)
check("m4-mfbank y(1) = c(1) = 1.5", mfY(1.0), 1.5, 1e-12)
truth("m4-mfbank y(0.6) != c(0.6): the two differ off t = T", abs(mfY(0.6) - 1.5 * 0.6 ** 3) > 0.1)

check("m4-irrelevant 0.5 + 0.8", 0.5 + 0.8, 1.3, 1e-12)
check("m4-irrelevant 2.0 + 0.8", 2.0 + 0.8, 2.8, 1e-12)
check("m4-irrelevant gap stays 1.5", 2.8 - 1.3, 1.5, 1e-12)

check("m4-noise 1-sigma contour holds 1 - e^-1/2 (39%)", 1 - math.exp(-0.5), 0.39, 0.005)
check("m4-noise 2-sigma contour holds 1 - e^-2 (86%)", 1 - math.exp(-2), 0.86, 0.006)

check("m4-ex-pam4 peak 1/sqrt(0.1 pi)", 1 / math.sqrt(0.1 * math.pi), 1.78, 0.005)
check("m4-ex-pam4 sigma^2 = N0/2", 0.1 / 2, 0.05, 1e-12)
check("m4-ex-pam4 sigma = 0.22", math.sqrt(0.05), 0.22, 0.005)
check("m4-ex-orth mean of r1 = sqrt E", math.sqrt(4), 2, 1e-12)
check("m4-ex-orth peak 1/sqrt(pi)", 1 / math.sqrt(math.pi), 0.56, 0.005)
check("m4-ex-orth |(2,0,0,0)|^2 = E", 2 ** 2, 4, 0)

# gallery 4.1
check("m4-real-observe T_c = 1/1.023 us", 1 / 1.023, 0.978, 0.0005)
barker = [1, 1, 1, -1, -1, -1, 1, -1, -1, 1, -1]
R = [sum(barker[n] * barker[n + k] for n in range(11) if 0 <= n + k < 11) for k in range(-10, 11)]
check("m4-real-observe Barker R[0]", R[10], 11, 0)
truth("m4-real-observe Barker sidelobes are 0 or -1", all(v in (0, -1) for i, v in enumerate(R) if i != 10))
kB = 1.380649e-23
check("m4-real-observe sqrt(4kTRB) in uV", math.sqrt(4 * kB * 290 * 50 * 20e6) * 1e6, 4.0, 0.05)

# ---- 4.2 the decision rule ---------------------------------------------
check("m4-map 0.8 x 0.2", 0.8 * 0.2, 0.16, 1e-12)
check("m4-map 0.2 x 0.5", 0.2 * 0.5, 0.10, 1e-12)

rq = np.array([0.5, 0.3])
qpsk = [np.array(p) for p in ([1, 1], [-1, 1], [-1, -1], [1, -1])]
D2 = [float(np.sum((rq - p) ** 2)) for p in qpsk]
for k, want in enumerate([0.74, 2.74, 3.94, 1.94]):
    check(f"m4-mindist D_{k + 1}^2", D2[k], want, 1e-9)
pri = [0.1, 0.1, 0.1, 0.7]
score = [D2[k] - math.log(pri[k]) for k in range(4)]
check("m4-mindist s1 score 0.74 + ln10", score[0], 3.04, 0.005)
check("m4-mindist s4 score 1.94 - ln0.7", score[3], 2.30, 0.005)
truth("m4-mindist MAP picks s4", int(np.argmin(score)) == 3)

MS, MR = [-3, -1, 1, 3], 1.6
for s_, want in zip(MS, [-4.8, -1.6, 1.6, 4.8]):
    check(f"m4-metric r s at s={s_}", MR * s_, want, 1e-9)
met = [MR * s_ - s_ * s_ / 2 for s_ in MS]
for s_, m_, want in zip(MS, met, [-9.3, -2.1, 1.1, 0.3]):
    check(f"m4-metric r s - s^2/2 at s={s_}", m_, want, 1e-9)
truth("m4-metric winner is s = 1, the nearest level", MS[int(np.argmax(met))] == 1 and abs(MR - 1) < abs(MR - 3))

# optimal and the worked example: +-1, P(s1) = 0.25, N0 = 0.5
p1, N0, sg = 0.25, 0.5, math.sqrt(0.25)
pe_tau = lambda tau: p1 * Q((1 - tau) / sg) + (1 - p1) * Q((tau + 1) / sg)
tau_star = N0 / 4 * math.log((1 - p1) / p1)
check("m4-optimal/m4-ex-map tau* = (N0/4) ln 3", tau_star, 0.137, 0.0005)
grid = np.linspace(-1.5, 1.5, 30001)
check("m4-optimal argmin of P_e(tau) is tau*", float(grid[np.argmin([pe_tau(x) for x in grid])]), tau_star, 2e-4)
check("m4-optimal/m4-ex-map P_e(tau*)", pe_tau(tau_star), 0.0192, 0.00005)
check("m4-optimal/m4-ex-map P_e(0) = Q(2)", pe_tau(0), 0.0228, 0.00005)
check("m4-ex-map Q argument (1 - tau)/0.5", (1 - tau_star) / sg, 1.73, 0.005)
check("m4-ex-map Q argument (1 + tau)/0.5", (1 + tau_star) / sg, 2.27, 0.005)
check("m4-ex-map MAP saves 16%", (pe_tau(0) - pe_tau(tau_star)) / pe_tau(0), 0.16, 0.005)
check("m4-ex-map common error: the inverse ratio gives tau = -0.137", N0 / 4 * math.log(p1 / (1 - p1)), -0.137, 0.0005)

rv = np.array([1.2, 0.3])
RX = [np.array(p) for p in ([2, 0], [1, 1], [-1, 1], [-1, -1])]
E = [float(p @ p) for p in RX]
check("m4-ex-receiver energies 4,2,2,2", sum(abs(a - b) for a, b in zip(E, [4, 2, 2, 2])), 0, 1e-12)
corr = [float(rv @ p) for p in RX]
for k, want in enumerate([2.4, 1.5, -0.9, -1.5]):
    check(f"m4-ex-receiver r.s_{k + 1}", corr[k], want, 1e-9)
metr = [c - e / 2 for c, e in zip(corr, E)]
for k, want in enumerate([0.4, 0.5, -1.9, -2.5]):
    check(f"m4-ex-receiver metric {k + 1}", metr[k], want, 1e-9)
check("m4-ex-receiver |r-s1|^2", float(np.sum((rv - RX[0]) ** 2)), 0.73, 1e-9)
check("m4-ex-receiver |r-s2|^2", float(np.sum((rv - RX[1]) ** 2)), 0.53, 1e-9)

# gallery 4.2
check("m4-real-rule smoke threshold 25 + (36/30) ln 99", 25 + 36 / 30 * math.log(99), 30.5, 0.05)
check("m4-real-rule optical P_e = Q(10/3)", Q(10 / 3), 4.3e-4, 0.05e-4)
check("m4-real-rule caller ID T = 1/1200 s in ms", 1000 / 1200, 0.833, 0.0005)

# ---- 4.3 decision regions ---------------------------------------------
check("m4-regions bisector of 0 and (1.2,1.2) passes (0.6,0.6): |r1|+|r2| = 1.2", 0.6 + 0.6, 1.2, 1e-12)
check("m4-regions-priors mu = 1 + ln4/4", 1 + math.log(4) / 4, 1.35, 0.005)
check("m4-regions-priors ln4/4", math.log(4) / 4, 0.35, 0.005)
check("m4-binary Q(2), d=2 N0=0.5", Q(math.sqrt(4 / (2 * 0.5))), 0.0228, 0.00005)
mu = 1 + 0.5 / 4 * math.log(0.9 / 0.1)
check("m4-binary-priors mu = 1 + (N0/2d) ln 9", mu, 1.27, 0.005)
pe_bp = 0.1 * Q((2 - mu) / 0.5) + 0.9 * Q(mu / 0.5)
check("m4-binary-priors MAP P_e", pe_bp, 0.0122, 0.00005)
check("m4-binary-priors ML P_e = Q(2)", 0.1 * Q(2) + 0.9 * Q(2), 0.0228, 0.00005)
check("m4-real-regions 16-QAM d_min = 2/sqrt10", 2 / math.sqrt(10), 0.632, 0.0005)
check("m4-real-regions 8PSK sector angle", 360 / 8, 45, 0)
check("m4-real-regions 16-QAM outer regions", 16 - 4, 12, 0)

# ---- 4.4 error probability and the union bound --------------------------
a_, s_ = 1.2, 0.4
exact_c = 1 - (1 - 2 * Q(a_ / (math.sqrt(2) * s_))) ** 2
check("m4-pe exact P(error | centre)", exact_c, 0.067, 0.0005)
ZP = gauss(4404, 2000, 1)
for n in (10, 100, 1000):
    k = sum(1 for i in range(n) if abs(0.4 * ZP[2 * i]) + abs(0.4 * ZP[2 * i + 1]) > 1.2)
    print(f"INFO  m4-pe frame n={n} prints {k}/{n} = {k / n:.3f}")
    if n == 1000:
        check("m4-pe 1000 draws settle near the exact value", k / n, exact_c, 0.02)
check("m4-pe symbols for 100 errors at 1e-4", 100 / 1e-4, 1e6, 0)

check("m4-dmin 8-PSK d_min = 2 sin(pi/8)", 2 * math.sin(math.pi / 8), 0.77, 0.005)
check("m4-dmin distractor sin(pi/8)", math.sin(math.pi / 8), 0.38, 0.005)
check("m4-chernoff Q(3)", Q(3), 1.35e-3, 0.005e-3)
check("m4-chernoff half e^-4.5 (figure)", 0.5 * math.exp(-4.5), 5.55e-3, 0.005e-3)
check("m4-chernoff half e^-4.5 (card)", 0.5 * math.exp(-4.5), 5.6e-3, 0.05e-3)
check("m4-chernoff ratio", 0.5 * math.exp(-4.5) / Q(3), 4.1, 0.05)
xs = np.linspace(0, 8, 8001)
truth("m4-chernoff Q(x) <= exp bound on [0,8]", all(Q(x) <= 0.5 * math.exp(-x * x / 2) + 1e-15 for x in xs))

qam = [(x, y) for x in (-3, -1, 1, 3) for y in (-3, -1, 1, 3)]
nn = [sum(1 for q in qam if (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 == 4) for p in qam]
check("m4-nn 16-QAM average neighbours", sum(nn) / 16, 3, 1e-12)
check("m4-nn corners have 2", min(nn), 2, 0)
check("m4-nn inner points have 4", max(nn), 4, 0)

# ex-union: square (+-1,+-1), d_min^2/2N0 = 9, so N0 = 2/9
N0 = 2 / 9
x2, xd = math.sqrt(4 / (2 * N0)), math.sqrt(8 / (2 * N0))
check("m4-ex-union x at d = 2", x2, 3, 1e-12)
check("m4-ex-union x at 2 sqrt2 = sqrt 18", xd, 4.24, 0.005)
check("m4-ex-union Q(3)", Q(3), 1.35e-3, 0.005e-3)
check("m4-ex-union Q(4.24)", Q(xd), 1.1e-5, 0.05e-5)
check("m4-ex-union general", 2 * Q(3) + Q(xd), 2.71e-3, 0.005e-3)
check("m4-ex-union intelligent = nearest", 2 * Q(3), 2.70e-3, 0.005e-3)
check("m4-ex-union d_min bound", 3 * Q(3), 4.05e-3, 0.005e-3)
check("m4-ex-union exact", 1 - (1 - Q(3)) ** 2, 2.70e-3, 0.005e-3)
check("m4-ex-union diagonal share", Q(xd) / (2 * Q(3)), 0.004, 0.0005)
check("notes 4.5 common error: 3Q/2Q is 50% too high", 3 * Q(3) / (2 * Q(3)) - 1, 0.5, 1e-12)
check("m4-ex-pam4 common error: N0 as variance is sqrt2 too wide", math.sqrt(0.1) / math.sqrt(0.05), math.sqrt(2), 1e-12)
check("notes binary figure P_e = Q(sqrt2) at d=2, N0=1", Q(math.sqrt(4 / 2)), Q(math.sqrt(2)), 1e-15)

# ex-union-b: rectangle (+-1.5,+-1), N0 = 0.4
N0 = 0.4
xa, xb, xc = 2 / math.sqrt(2 * N0), 3 / math.sqrt(2 * N0), math.sqrt(13) / math.sqrt(2 * N0)
check("m4-ex-union-b x at d = 2", xa, 2.24, 0.005)
check("m4-ex-union-b x at d = 3", xb, 3.35, 0.005)
check("m4-ex-union-b Q(2.24)", Q(xa), 1.27e-2, 0.005e-2)
check("m4-ex-union-b Q(3.35)", Q(xb), 4.0e-4, 0.05e-4)
check("m4-ex-union-b intelligent", Q(xa) + Q(xb), 1.31e-2, 0.005e-2)
check("m4-ex-union-b nearest", Q(xa), 1.27e-2, 0.005e-2)
ex_b = 1 - (1 - Q(xa)) * (1 - Q(xb))
check("m4-ex-union-b exact", ex_b, 1.31e-2, 0.005e-2)
check("m4-ex-union-b nearest is 3% below exact", (ex_b - Q(xa)) / ex_b, 0.03, 0.005)
truth("m4-ex-union-b general exceeds intelligent", Q(xa) + Q(xb) + Q(xc) > Q(xa) + Q(xb))

# tightness: 16-QAM on (+-1,+-3), E_s = 10
D = {}
for p in qam:
    for q in qam:
        if p != q:
            k = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
            D[k] = D.get(k, 0) + 1 / 16
gen = lambda d_: sum(c * Q(math.sqrt(k / (2 * 10 / dB(d_)))) for k, c in D.items())
nnf = lambda d_: 3 * Q(math.sqrt(4 / (2 * 10 / dB(d_))))
check("m4-tightness E_s = 10", sum(x * x + y * y for x, y in qam) / 16, 10, 1e-12)
check("m4-tightness union bound at 0 dB", gen(0), 2.79, 0.005)
check("m4-tightness 15 other points", sum(D.values()), 15, 1e-9)
check("m4-tightness d_min bound / nearest = 15/3", 15 / 3, 5, 0)
check("m4-tightness readout union at 6 dB", gen(6), 0.948, 0.0005)
check("m4-tightness readout nearest at 6 dB", nnf(6), 0.558, 0.0005)

# gallery 4.4
check("m4-real-union 16-QAM d_min^2 / E_s", 4 / 10, 0.4, 1e-12)
lte_u = lambda d_: 2 * Q(math.sqrt(dB(d_))) + Q(math.sqrt(2 * dB(d_)))
lte_e = lambda d_: 1 - (1 - Q(math.sqrt(dB(d_)))) ** 2
truth("m4-real-union LTE union and exact differ by < 1% above 10 dB",
      all(lte_u(d_) / lte_e(d_) - 1 < 0.01 for d_ in np.linspace(10, 12, 41)))
for name, f, want in [("QPSK", lambda x: 2 * Q(math.sqrt(x)), 10.3),
                      ("16-QAM", lambda x: 3 * Q(math.sqrt(x / 5)), 17.6),
                      ("64-QAM", lambda x: 3.5 * Q(math.sqrt(x / 21)), 24.0)]:
    d_ = solve(lambda d_: f(dB(d_)) - 1e-3, 0, 40)
    check(f"m4-real-union {name} E_s/N0 for 1e-3 (dB)", d_, want, 0.05)
check("m4-real-union 64-QAM average neighbours", (4 * 2 + 24 * 3 + 36 * 4) / 64, 3.5, 1e-12)
check("m4-real-union 64-QAM d_min^2 / 2N0 = E_s/(21 N0)", 4 / 42 / 2, 1 / 21, 1e-12)
check("m4-real-union 100 errors at 1e-3 need 1e5 bits", 100 / 1e-3, 1e5, 0)

# ---- 4.5 summary -------------------------------------------------------
check("m4-chain Q(4)", Q(4), 3.17e-5, 0.005e-5)
check("m4-chain 2 Q(4)", 2 * Q(4), 6.3e-5, 0.05e-5)
ZC = gauss(4409, 400, 1)
k_chain = sum(1 for i in range(200) if 1 + 0.3 * ZC[2 * i] < 0 or -0.6 + 0.3 * ZC[2 * i + 1] > 0)
print(f"INFO  m4-chain prints 'wrong: {k_chain} of 200'")
check("m4-chain wrong fraction near 1-(1-Q(2))(1-Q(3.33))", k_chain / 200, 1 - (1 - Q(2)) * (1 - Q(1 / 0.3)), 0.03)
check("m4-quick log2 32", math.log2(32), 5, 1e-12)
check("m4-quick N0/2", 0.4 / 2, 0.2, 1e-12)
check("m4-quick |r-(0,1)|^2", 0.2 ** 2 + 0.1 ** 2, 0.05, 1e-12)
check("m4-quick |r-(1,0)|^2", 0.8 ** 2 + 0.9 ** 2, 1.45, 1e-12)
check("m4-quick d^2/2N0 = 1", 4 / (2 * 2), 1, 0)
check("m4-quick M-1 terms", 8 - 1, 7, 0)

print(f"\n{passed} passed, {failed} failed")
raise SystemExit(failed > 0)
