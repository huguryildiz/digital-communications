"""PASS lines for every number stated in build/src/86_scenes_m5.js.

Module 5, digital modulation methods: the slide cards, the prediction
questions, the gallery captions, the quick check, the summary cards and the
numbers the figures print at their default settings. The seeded noise of the
figures (mulberry32 and Box-Muller in the scene file) is ported here bit for
bit, so a count a figure prints is the count checked below.

    .venv/bin/python verify/verify_m5.py      # N passed, 0 failed
"""
import math

import numpy as np

Q = lambda x: 0.5 * math.erfc(x / math.sqrt(2))
dB = lambda d: 10 ** (d / 10)
todB = lambda x: 10 * math.log10(x)
L2 = math.log2

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


def at(f, target, lo=-10, hi=60):
    """The dB value where a falling error curve f(ratio) meets target."""
    return solve(lambda d: math.log(max(f(dB(d)), 1e-300)) - math.log(target), lo, hi)


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


def nearest(pts, x, y):
    return min(range(len(pts)), key=lambda k: (x - pts[k][0]) ** 2 + (y - pts[k][1]) ** 2)


def psk_pts(M, r=1.0, off=0.0):
    return [(r * math.cos(2 * math.pi * k / M + off), r * math.sin(2 * math.pi * k / M + off)) for k in range(M)]


# ---- error probabilities, as in the scene file --------------------------
def pe_psk(M, g):
    if M == 2:
        return Q(math.sqrt(2 * g))
    return 2 * Q(math.sqrt(2 * L2(M) * g) * math.sin(math.pi / M))


def pe_pam(M, g):
    return 2 * (M - 1) / M * Q(math.sqrt(6 * L2(M) * g / (M * M - 1)))


def pe_qamnn(M, g):
    return 4 * (1 - 1 / math.sqrt(M)) * Q(math.sqrt(3 * L2(M) * g / (M - 1)))


def pe_qam(M, g):
    p = 2 * (1 - 1 / math.sqrt(M)) * Q(math.sqrt(3 * L2(M) * g / (M - 1)))
    return 1 - (1 - p) ** 2


def pe_orthu(M, g):
    return (M - 1) * Q(math.sqrt(L2(M) * g))


def pe_orth(M, g):
    """Exact symbol error of M orthogonal signals, by quadrature."""
    mu = math.sqrt(2 * L2(M) * g)
    y = np.linspace(mu - 12, mu + 12, 24001)
    q = 0.5 * np.array([math.erfc(v / math.sqrt(2)) for v in y])
    miss = -np.expm1((M - 1) * np.log1p(-np.minimum(q, 1 - 1e-16)))
    return float(np.trapezoid(np.exp(-(y - mu) ** 2 / 2) * miss, y) / math.sqrt(2 * math.pi))


def pb_orth(M, g):
    k = L2(M)
    return 2 ** (k - 1) / (2 ** k - 1) * pe_orth(M, g)


bpsk = lambda g: Q(math.sqrt(2 * g))
bfsk = lambda g: Q(math.sqrt(g))
dpsk = lambda g: 0.5 * math.exp(-g)
ncfsk = lambda g: 0.5 * math.exp(-g / 2)

# ---- 5.1 putting bits on a carrier --------------------------------------
check("m5-carrier passband band 2W = 2(5) kHz", 2 * 5, 10, 0)
check("m5-carrier band edges fc - W", 40 - 5, 35, 0)
check("m5-carrier band edges fc + W", 40 + 5, 45, 0)
t = np.linspace(0, 1, 400001)
check("m5-carrier <cos^2> = 1/2 over whole cycles", np.trapezoid(np.cos(2 * np.pi * 40 * t) ** 2, t), 0.5, 1e-6)
check("m5-iq theta = atan2(1,-1) (deg)", math.degrees(math.atan2(1, -1)), 135, 1e-9)
check("m5-iq int cos sin over whole cycles", np.trapezoid(np.cos(2 * np.pi * 2 * t) * np.sin(2 * np.pi * 2 * t), t), 0, 1e-9)
check("m5-iq QPSK amplitude sqrt(I^2+Q^2) at (+-1,+-1)", math.hypot(1, 1), math.sqrt(2), 1e-12)
check("m5-bpsk d_min = 2 sqrt(E_b), E_b = 4", 2 * math.sqrt(4), 4, 1e-12)
check("m5-bpsk d^2/2N0 = 4E_b/2N0 = 2E_b/N0 (ratio at E_b=N0=1)", 4 / 2, 2, 0)
rho = lambda x: math.sin(2 * math.pi * x) / (2 * math.pi * x)
check("m5-bfsk rho(0.5) printed 0.00", rho(0.5), 0.0, 5e-3)
x_min = solve(lambda x: 2 * math.pi * x * math.cos(2 * math.pi * x) - math.sin(2 * math.pi * x), 0.6, 0.9)
check("m5-bfsk minimum of rho at 0.715/T_b", x_min, 0.715, 0.0005)
check("m5-bfsk minimum rho = -0.217", rho(x_min), -0.217, 0.0005)
check("m5-bfsk first zero at 1/(2T_b)", solve(rho, 0.3, 0.7), 0.5, 1e-9)
f0 = 3
te = np.linspace(0, 1, 400001)
check("m5-bfsk exact correlation at dfT=0.5, f0T=3 (normalised)",
      np.trapezoid(np.cos(2 * np.pi * f0 * te) * np.cos(2 * np.pi * (f0 + 0.5) * te), te) / 0.5, 0, 1e-3)
check("m5-bfsk d_min^2 = 2E_b against 4E_b is 3 dB", todB(4 / 2), 3.01, 0.01)
check("m5-bfsk tones 1200 Hz at 0.2 s a bit are whole cycles", 1200 * 0.2, 240, 0)
check("m5-bask E_b = E/2 with E = 2", 2 / 2, 1, 0)
check("m5-bask d = sqrt(E) = sqrt(2 E_b) (E_b = 1)", math.sqrt(2), math.sqrt(2 * 1), 1e-12)
check("m5-bask amplitude 2 gives peak energy 2 over T_b=1 (A^2/2)", 2 ** 2 / 2, 2, 0)
g_bpsk5 = at(bpsk, 1e-5, 0, 20)
g_bfsk5 = at(bfsk, 1e-5, 0, 20)
check("m5-binary-pe BPSK at 1e-5 (dB)", g_bpsk5, 9.6, 0.05)
check("m5-binary-pe BFSK at 1e-5 (dB)", g_bfsk5, 12.6, 0.05)
check("m5-binary-pe gap 3 dB", g_bfsk5 - g_bpsk5, 3.0, 0.02)
check("m5-binary-pe readout BPSK at 9.6 dB", bpsk(dB(9.6)), 9.74e-6, 0.005e-6)
check("m5-binary-pe readout BFSK at 9.6 dB", bfsk(dB(9.6)), 1.26e-3, 0.005e-3)
Eb = 4e-15 / 1e5
check("m5-ex-binary E_b = P/R_b (J)", Eb, 4e-20, 1e-30)
check("m5-ex-binary E_b/N0", Eb / 4e-21, 10, 1e-9)
check("m5-ex-binary 10 dB", todB(10), 10, 1e-12)
check("m5-ex-binary BPSK Q(sqrt 20)", Q(math.sqrt(20)), 3.87e-6, 0.005e-6)
check("m5-ex-binary BFSK Q(sqrt 10)", Q(math.sqrt(10)), 7.83e-4, 0.005e-4)
check("m5-ex-binary BFSK power to match BPSK (W)", 2 * 4e-15, 8e-15, 1e-25)
check("m5-ex-binary P/N0 (Hz)", 4e-15 / 4e-21, 1e6, 1e-3)

# gallery: NFC, RDS, key fob, GPS
check("m5-real-binary NFC bit time 1/106 kb/s (us)", 1000 / 106, 9.43, 0.005)
check("m5-real-binary RDS cycles a bit 57000/1187.5", 57000 / 1187.5, 48, 1e-9)
check("m5-real-binary GPS main lobe 2 x 1.023 (MHz)", 2 * 1.023, 2.046, 1e-12)
sincx = lambda x: 1.0 if abs(x) < 1e-12 else math.sin(math.pi * x) / (math.pi * x)
check("m5-real-binary GPS first null at 1.023 MHz", sincx(1.023 / 1.023) ** 2, 0, 1e-12)

# ---- 5.2 phase-shift keying ----------------------------------------------
for k, want in [(1, 2.0), (2, 1.414), (3, 0.765), (4, 0.390), (5, 0.196)]:
    M = 2 ** k
    check(f"m5-mpsk figure d_min at M={M} (E_s=1)", 2 * math.sin(math.pi / M), want, 0.0006)
check("m5-mpsk cosine rule = 4 E_s sin^2(pi/M) at M=8",
      1 + 1 - 2 * math.cos(2 * math.pi / 8), 4 * math.sin(math.pi / 8) ** 2, 1e-12)
check("m5-mpsk QPSK E_s=2 d_min", 2 * math.sqrt(2) * math.sin(math.pi / 4), 2, 1e-12)
pb = Q(math.sqrt(2 * 10))
check("m5-qpsk P_e = 1-(1-P_b)^2 ~ 2P_b (relative)", (1 - (1 - pb) ** 2) / (2 * pb), 1, 1e-5)
truth("m5-psk-detect 50 deg decides 45 deg", nearest(psk_pts(8), math.cos(math.radians(50)), math.sin(math.radians(50))) == 1)
truth("m5-psk-detect 160 deg decides 180 deg", nearest(psk_pts(8), 0.82 * math.cos(math.radians(160)), 0.82 * math.sin(math.radians(160))) == 4)
truth("m5-psk-detect -100 deg decides -90 deg", nearest(psk_pts(8), 1.08 * math.cos(math.radians(-100)), 1.08 * math.sin(math.radians(-100))) == 6)
check("m5-psk-detect 50 deg is 5 deg from 45", 50 - 45, 5, 0)
check("m5-psk-detect 50 deg is 40 deg from 90", 90 - 50, 40, 0)
check("m5-mpsk-pe readout M=4 at 10 dB", pe_psk(4, 10), 7.74e-6, 0.005e-6)
check("m5-mpsk-pe readout M=8 at 10 dB", pe_psk(8, 10), 3.03e-3, 0.005e-3)
ratio = math.sin(math.pi / 4) ** 2 / math.sin(math.pi / 8) ** 2
check("m5-mpsk-pe E_s ratio 8 over 4", ratio, 3.41, 0.005)
check("m5-mpsk-pe E_s ratio in dB", todB(ratio), 5.33, 0.005)
check("m5-mpsk-pe per-bit cost 5.33 - 10log(1.5)", todB(ratio) - todB(1.5), 3.57, 0.005)
check("m5-mpsk-pe large-M cost tends to 6 dB", todB(math.sin(math.pi / 512) ** 2 / math.sin(math.pi / 1024) ** 2), 6.02, 0.01)
# at 1e-5 the 4-to-8 gap agrees
check("m5-mpsk-pe gap at 1e-5 (dB)", at(lambda g: pe_psk(8, g), 1e-5) - at(lambda g: pe_psk(4, g), 1e-5), 3.57, 0.05)
gray = lambda i: i ^ (i >> 1)
truth("m5-gray code 000 001 011 010 110 111 101 100",
      [format(gray(i), '03b') for i in range(8)] == ['000', '001', '011', '010', '110', '111', '101', '100'])
truth("m5-gray neighbours differ in one bit", all(bin(gray(i) ^ gray((i + 1) % 8)).count('1') == 1 for i in range(8)))
check("m5-gray natural 011 -> 100 costs three bits", bin(3 ^ 4).count('1'), 3, 0)
check("m5-gray P_b = 3e-3 / 3", 3e-3 / 3, 1e-3, 1e-15)
Z = gauss(5201, 600, 1)
P8 = psk_pts(8)
ks = bs = 0
for i in range(300):
    m = nearest(P8, 1 + 0.2 * Z[2 * i], 0.2 * Z[2 * i + 1])
    if m:
        ks += 1
        bs += bin(gray(0) ^ gray(m)).count('1')
print(f"INFO  m5-gray prints 'symbol errors {ks}, bit errors {bs}'")
check("m5-gray printed symbol errors", ks, 17, 0)
check("m5-gray printed bit errors", bs, 17, 0)
check("m5-gray symbol error fraction near 2Q(sin(pi/8)/0.2)", ks / 300, 2 * Q(math.sin(math.pi / 8) / 0.2), 0.03)
x = math.sqrt(2 * 30) * math.sin(math.pi / 8)
check("m5-ex-psk E_s/N0 = 3(10)", 3 * 10, 30, 0)
check("m5-ex-psk argument", x, 2.96, 0.005)
check("m5-ex-psk Q(2.96)", Q(x), 1.52e-3, 0.005e-3)
check("m5-ex-psk P_e", 2 * Q(x), 3.0e-3, 0.05e-3)
check("m5-ex-psk P_b", 2 * Q(x) / 3, 1.0e-3, 0.05e-3)
xe = math.sqrt(2 * 10) * math.sin(math.pi / 8)
check("m5-ex-psk wrong argument with E_b", xe, 1.71, 0.005)
check("m5-ex-psk wrong P_e with E_b", 2 * Q(xe), 0.087, 0.0005)
check("m5-ex-psk wedge half-angle 180/8", 180 / 8, 22.5, 0)
ZP = gauss(5202, 400, 1)
Q1 = [(1 / math.sqrt(2), 1 / math.sqrt(2)), (-1 / math.sqrt(2), 1 / math.sqrt(2)),
      (-1 / math.sqrt(2), -1 / math.sqrt(2)), (1 / math.sqrt(2), -1 / math.sqrt(2))]


def po_count(phi):
    c, s = math.cos(math.radians(phi)), math.sin(math.radians(phi))
    k = 0
    for i in range(200):
        p = Q1[i % 4]
        xx = c * p[0] - s * p[1] + 0.18 * ZP[2 * i]
        yy = s * p[0] + c * p[1] + 0.18 * ZP[2 * i + 1]
        k += nearest(Q1, xx, yy) != i % 4
    return k


k20 = po_count(20)
print(f"INFO  m5-phase-offset prints 'wrong {k20} of 200' at 20 deg")
check("m5-phase-offset printed count at 20 deg", k20, 3, 0)
truth("m5-phase-offset 90 deg without noise: every point lands on a neighbour", all(
    nearest(Q1, -p[1], p[0]) != i for i, p in enumerate(Q1)))
check("m5-phase-offset ambiguity 2pi/M for QPSK (deg)", 360 / 4, 90, 0)
th = 0
for b in [1, 0, 1, 1]:
    th = (th + b) % 2
check("m5-dpsk final phase / pi", th, 1, 0)
check("m5-dpsk three ones add 3pi = pi mod 2pi", (3 % 2), 1, 0)
g_dpsk5 = at(dpsk, 1e-5, 0, 20)
check("m5-dpsk-pe DPSK at 1e-5 (dB)", g_dpsk5, 10.34, 0.005)
check("m5-dpsk-pe BPSK at 1e-5 (dB)", g_bpsk5, 9.59, 0.005)
check("m5-dpsk-pe gap 0.75 dB", g_dpsk5 - g_bpsk5, 0.75, 0.01)
check("m5-dpsk-pe 1/2 e^-10", dpsk(10), 2.27e-5, 0.005e-5)
check("m5-dpsk-pe distractor 4.54e-5 = e^-10", math.exp(-10), 4.54e-5, 0.005e-5)
check("m5-dpsk-pe BPSK at 10 dB", bpsk(10), 3.87e-6, 0.005e-6)

# gallery: 802.11b, DVB-S, Bluetooth EDR, DVB-S2
check("m5-real-psk DVB-S2 8PSK d_min / sqrt(E_s)", 2 * math.sin(math.pi / 8), 0.765, 0.0005)
check("m5-real-psk 802.11b 1 Mb/s is one bit a microsecond", 1 / 1e6 * 1e6, 1, 0)
truth("m5-real-psk pi/4-DQPSK steps avoid pi (no step through origin)",
      all(abs(d) < math.pi for d in [math.pi / 4, -math.pi / 4, 3 * math.pi / 4, -3 * math.pi / 4]))

# ---- 5.3 amplitude and quadrature ----------------------------------------
for k, want in [(1, 2.0), (2, 0.894), (3, 0.436), (4, 0.217)]:
    M = 2 ** k
    check(f"m5-mask figure d_min at M={M} (E_s=1)", 2 * math.sqrt(3 / (M * M - 1)), want, 0.0006)
check("m5-mask caption spacing sqrt(12/(M^2-1)) at M=4", math.sqrt(12 / 15), 0.894, 0.0006)
check("m5-mask odd squares sum M(M^2-1)/3 at M=8", sum((2 * m - 1 - 8) ** 2 for m in range(1, 9)), 8 * 63 / 3, 1e-9)
check("m5-mask E_s = (M^2-1)d^2/12 for 4-ASK d=2", 15 * 4 / 12, 5, 1e-12)
check("m5-mask E_s direct (1+9+9+1)/4", (1 + 9 + 9 + 1) / 4, 5, 0)
check("m5-mask doubling cost ~6 dB (63/15)", todB(63 / 15), 6.2, 0.05)
check("m5-mask large-M doubling cost 6 dB", todB((4 * 1024 ** 2 - 1) / (1024 ** 2 - 1)), 6.02, 0.01)
check("m5-ex-ask4 N_min average", (1 + 2 + 2 + 1) / 4, 1.5, 0)
check("m5-ex-ask4 E_s = 5A^2", (9 + 1 + 1 + 9) / 4, 5, 0)
check("m5-ex-ask4 argument^2 = 2(25)/5", 2 * 25 / 5, 10, 0)
check("m5-ex-ask4 Q(sqrt 10)", Q(math.sqrt(10)), 7.83e-4, 0.005e-4)
check("m5-ex-ask4 P_e", 1.5 * Q(math.sqrt(10)), 1.17e-3, 0.005e-3)
check("m5-ex-ask4 same as the M-ASK formula", pe_pam(4, 25 / 2), 1.5 * Q(math.sqrt(10)), 1e-15)
QAM16 = [(x, y) for x in (-3, -1, 1, 3) for y in (-3, -1, 1, 3)]
nb = [sum(1 for q in QAM16 if abs((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 - 4) < 1e-9) for p in QAM16]
check("m5-qam average neighbours from the grid", sum(nb) / 16, 3, 1e-12)
check("m5-qam corners/edges/inner counts", (nb.count(2), nb.count(3), nb.count(4)) == (4, 8, 4), True, 0)
check("m5-qam 4(1-1/sqrt 16)", 4 * (1 - 1 / 4), 3, 1e-12)
check("m5-qam E_s = (M-1)d^2/6 for 16-QAM d=2", 15 * 4 / 6, 10, 1e-12)
check("m5-qam E_s from the grid", sum(x * x + y * y for x, y in QAM16) / 16, 10, 1e-12)
check("m5-qam-pe readout exact 16-QAM at 12 dB", pe_qam(16, dB(12)), 5.55e-4, 0.005e-4)
check("m5-qam-pe readout nearest neighbour at 12 dB", pe_qamnn(16, dB(12)), 5.55e-4, 0.005e-4)
check("m5-qam-pe 1-(1-1e-3)^2", 1 - (1 - 1e-3) ** 2, 1.999e-3, 1e-9)
check("m5-qam-pe E_s cost of 64 over 16 at equal d (dB)", todB(63 / 15), 6.23, 0.005)
check("m5-qam-pe E_s cost of 256 over 64 (dB), about 3 dB a bit", todB(255 / 63) / 2, 3.04, 0.01)
C8, R3 = 1 + math.sqrt(2), 1 + math.sqrt(3)
sets = {
    'a': [(1, 1), (-1, 1), (-1, -1), (1, -1), (3, 1), (-3, 1), (-3, -1), (3, -1)],
    'b': [(1, 1), (-1, 1), (-1, -1), (1, -1), (C8, C8), (-C8, C8), (-C8, -C8), (C8, -C8)],
    'c': [(2, 0), (0, 2), (-2, 0), (0, -2), (2, 2), (-2, 2), (-2, -2), (2, -2)],
    'd': [(1, 1), (-1, 1), (-1, -1), (1, -1), (R3, 0), (0, R3), (-R3, 0), (0, -R3)],
}
for n, want in [('a', 6), ('b', 6.83), ('c', 6), ('d', 4.73)]:
    pts = sets[n]
    check(f"m5-qam-shapes ({n}) average energy", sum(x * x + y * y for x, y in pts) / 8, want, 0.005)
    dmin = min(math.hypot(p[0] - q[0], p[1] - q[1]) for i, p in enumerate(pts) for q in pts[i + 1:])
    check(f"m5-qam-shapes ({n}) d_min", dmin, 2, 1e-9)
check("m5-qam-shapes C = sqrt(3 + 2 sqrt2) = 1 + sqrt2", math.sqrt(3 + 2 * math.sqrt(2)), C8, 1e-12)
check("m5-qam-shapes gain 10log(6/4.73)", todB(6 / (sum(x * x + y * y for x, y in sets['d']) / 8)), 1.03, 0.005)
check("m5-ex-qam16 d^2/2N0 = E_s/(5N0) at 80", 80 / 5, 16, 0)
check("m5-ex-qam16 80 is about 19 dB", todB(80), 19.03, 0.005)
check("m5-ex-qam16 Q(4)", Q(4), 3.17e-5, 0.005e-5)
check("m5-ex-qam16 P_e = 3Q(4)", 3 * Q(4), 9.5e-5, 0.05e-5)
check("m5-ex-qam16 P_b = P_e/4", 3 * Q(4) / 4, 2.4e-5, 0.05e-5)
adv = lambda M: todB(3 / (2 * (M - 1) * math.sin(math.pi / M) ** 2))
for M, want in [(8, 1.65), (16, 4.20), (32, 7.02), (64, 9.95)]:
    check(f"m5-qam-vs-psk advantage at M={M} (dB)", adv(M), want, 0.005)
check("m5-qam-vs-psk R_16 ratio", 3 / (30 * math.sin(math.pi / 16) ** 2), 2.63, 0.005)
check("m5-qam-vs-psk figure d_QAM at M=16", math.sqrt(6 / 15), 0.632, 0.0005)
check("m5-qam-vs-psk figure d_PSK at M=16", 2 * math.sin(math.pi / 16), 0.390, 0.0005)
check("m5-qam-vs-psk M=4 is no gain", adv(4), 0, 1e-9)
check("m5-real-qam 1024-QAM d_min = sqrt(6/1023)", math.sqrt(6 / 1023), 0.077, 0.0005)
check("m5-real-qam 1024 points carry 10 bits", L2(1024), 10, 0)
check("m5-real-qam 256 points carry 8 bits", L2(256), 8, 0)
check("m5-real-qam 256-QAM has 16 levels an axis", math.sqrt(256), 16, 0)
check("m5-real-qam 256 to 1024 costs 10log(1023/255)", todB(1023 / 255), 6.0, 0.05)
check("m5-real-qam 30 dB cloud sigma^2 = N0/2 at E_s=1", 0.5 / dB(30), 0.5e-3, 1e-12)

# ---- 5.4 frequency-shift keying and orthogonal signals --------------------
check("m5-mfsk pair distance^2 = 2E_s (unit vectors)", (1 - 0) ** 2 + (0 - 1) ** 2, 2, 0)
check("m5-mfsk 8-FSK neighbours M-1", 8 - 1, 7, 0)
truth("m5-mfsk figure decides r_1 = 0.82 > 0.34 > 0.22", 0.82 > 0.34 > 0.22)
orth_at = {}
for M, want, tol in [(2, 12.6, 0.05), (4, 9.9, 0.05), (8, 8.4, 0.05), (16, 7.4, 0.05), (32, 6.7, 0.05), (64, 6.1, 0.05)]:
    orth_at[M] = at(lambda g: pb_orth(M, g), 1e-5, -2, 16)
    check(f"m5-orth-m printed E_b/N0 at 1e-5 for M={M}", orth_at[M], want, tol)
check("m5-orth-m M=2 is coherent BFSK", orth_at[2], g_bfsk5, 0.01)
check("m5-orth-m wall ln 2 in dB", todB(math.log(2)), -1.59, 0.005)
check("m5-orth-m P_b factor 2^(k-1)/(2^k-1) at M=2", 1 / 1, 1, 0)
g_nc5 = at(ncfsk, 1e-5, 0, 20)
check("m5-noncoh noncoherent BFSK at 1e-5 (dB)", g_nc5, 13.4, 0.05)
check("m5-noncoh coherent BFSK at 1e-5 (dB)", g_bfsk5, 12.6, 0.05)
check("m5-noncoh twice the energy of DPSK (dB)", g_nc5 - g_dpsk5, 3.01, 0.01)
check("m5-noncoh y_c = cos 60", math.cos(math.radians(60)), 0.50, 0.005)
check("m5-noncoh envelope = 1", math.hypot(math.cos(1.1), math.sin(1.1)), 1, 1e-12)
tt = np.linspace(0, 1, 400001)
for df, want in [(0.5, 0), (1.0, 0)]:
    cc = np.trapezoid(np.cos(2 * np.pi * 20 * tt) * np.cos(2 * np.pi * (20 + df) * tt), tt) * 2
    check(f"m5-noncoh cosine correlation at df={df}/T", cc, want, 2e-3)
cs = np.trapezoid(np.cos(2 * np.pi * 20 * tt) * np.sin(2 * np.pi * 20.5 * tt), tt) * 2
check("m5-noncoh sine correlation at 1/(2T) is not zero", abs(cs), 2 / np.pi, 0.01)
cs1 = np.trapezoid(np.cos(2 * np.pi * 20 * tt) * np.sin(2 * np.pi * 21 * tt), tt) * 2
check("m5-noncoh sine correlation at 1/T is zero", cs1, 0, 2e-3)
check("m5-real-fsk Bell 202 two tones 1200/2200 at 1200 b/s: one cycle a mark bit", 1200 / 1200, 1, 0)
g = lambda u, BT: Q(2 * math.pi * BT / math.sqrt(math.log(2)) * (u - 0.5)) - Q(2 * math.pi * BT / math.sqrt(math.log(2)) * (u + 0.5))
uu = np.linspace(-3, 3, 60001)
gg = np.array([g(u, 0.3) for u in uu])
check("m5-real-fsk GMSK pulse area = one bit", np.trapezoid(gg, uu), 1, 1e-6)
spread = uu[gg > 0.05 * gg.max()]
check("m5-real-fsk GMSK BT=0.3 pulse spans about three bits", spread[-1] - spread[0], 3, 0.5)
check("m5-real-fsk DMR four levels carry 2 bits", L2(4), 2, 0)

# ---- 5.5 bandwidth and the choice of scheme --------------------------------
for k, want in [(1, 2.0), (2, 1.0), (3, 0.67), (4, 0.5), (5, 0.4)]:
    check(f"m5-spectrum main lobe 2R_b/k at k={k}", 2 / k, want, 0.005)
for k, pam, psk, orth in [(1, 0.5, 1, 1), (2, 0.25, 0.5, 1), (3, 0.17, 0.33, 1.33), (4, 0.13, 0.25, 2), (5, 0.1, 0.2, 3.2)]:
    M = 2 ** k
    check(f"m5-spectrum PAM band at k={k}", 1 / (2 * k), pam, 0.0051)
    check(f"m5-spectrum PSK band at k={k}", 1 / k, psk, 0.005)
    check(f"m5-spectrum orthogonal band at k={k}", M / (2 * k), orth, 0.005)
check("m5-spectrum 16-QAM at 10 Mb/s (MHz)", 10 / 4, 2.5, 0)
check("m5-spectrum QPSK main lobe R_b against 2R_b", (2 / 2) / 2, 0.5, 0)
ff = np.linspace(0, 1, 100001)
msk = lambda x: (np.cos(2 * np.pi * x) / (1 - 16 * x * x)) ** 2
check("m5-msk MSK first null (fT_b)", solve(lambda x: math.cos(2 * math.pi * x), 0.6, 0.9), 0.75, 1e-9)
check("m5-msk MSK finite at fT_b = 0.25 (no null)", (np.pi / 4) ** 2, 0.617, 0.001)
check("m5-msk OQPSK first null sinc^2(2 f T_b)", 1 / 2, 0.5, 0)
check("m5-msk main lobe 50% wider", 0.75 / 0.5, 1.5, 0)
check("m5-msk OQPSK edge midpoint envelope 1/sqrt2", math.hypot(1 / math.sqrt(2), 0), 1 / math.sqrt(2), 1e-12)
check("m5-msk BFSK spacing 1/(2T_b) gives pi/2 a bit", 2 * math.pi * 0.5 * 0.5, math.pi / 2, 1e-12)
check("m5-plane 64-QAM r = log2 64", L2(64), 6, 0)
fam = {'PAM': (pe_pam, 16), 'PSK': (pe_psk, 16), 'QAM': (pe_qamnn, 16), 'FSK': (pe_orthu, 16)}
for n, want in [('PAM', 23.1), ('PSK', 18.1), ('QAM', 14.0), ('FSK', 7.7)]:
    f, M = fam[n]
    check(f"m5-compare {n} at M=16 and 1e-5 (dB)", at(lambda gg_: f(M, gg_), 1e-5, -5, 60), want, 0.05)
lim = lambda r: todB((2 ** r - 1) / r)
check("m5-plane limit at r -> 0 is ln 2", lim(1e-6), todB(math.log(2)), 0.001)
truth("m5-plane every scheme sits right of the limit", all(
    at(lambda gg_: f(M, gg_), 1e-5, -5, 60) > lim(r) for f, Ms, rr in [
        (pe_pam, [2, 4, 8, 16, 32, 64], lambda M: 2 * L2(M)), (pe_psk, [4, 8, 16, 32, 64], L2),
        (pe_qamnn, [16, 64], L2), (pe_orthu, [2, 4, 8, 16, 32, 64], lambda M: 2 * L2(M) / M)]
    for M in Ms for r in [rr(M)]))
steps = [('BPSK', lambda g: bpsk(g), 9.6), ('QPSK', lambda g: bpsk(g / 2), 12.6),
         ('16-QAM', lambda g: pe_qam(16, g / 4) / 4, 19.5), ('64-QAM', lambda g: pe_qam(64, g / 6) / 6, 25.6),
         ('256-QAM', lambda g: pe_qam(256, g / 8) / 8, 31.5)]
th = {}
for n, f, want in steps:
    th[n] = at(f, 1e-5, 0, 60)
    check(f"m5-adaptive {n} threshold (dB)", th[n], want, 0.05)
truth("m5-adaptive 22 dB picks 16-QAM", th['16-QAM'] <= 22 < th['64-QAM'])
check("m5-adaptive 16 to 64 step (dB)", th['64-QAM'] - th['16-QAM'], 6, 0.2)
check("m5-adaptive 64 to 256 step (dB)", th['256-QAM'] - th['64-QAM'], 6, 0.2)
APSK = psk_pts(4, 1, math.pi / 4) + psk_pts(12, 2.7, math.pi / 12)
check("m5-real-choice 16APSK has 4 + 12 points", len(APSK), 16, 0)
check("m5-real-choice 16APSK two amplitudes", len({round(math.hypot(*p), 6) for p in APSK}), 2, 0)
check("m5-real-choice 16-QAM three amplitudes", len({round(math.hypot(*p), 6) for p in QAM16}), 3, 0)
check("m5-real-choice Bluetooth 1 Msym/s x 3 bits (Mb/s)", 1 * L2(8), 3, 0)
check("m5-real-choice LTE k from 2 to 8", (L2(4), L2(256)) == (2, 8), True, 0)

# ---- 5.6 summary -----------------------------------------------------------
ZC = gauss(5601, 400, 0.5)
n = 400
dt = 1 / n
c1 = c2 = 0.0
for i in range(n):
    u = (i + 0.5) * dt
    p1 = math.sqrt(2) * math.cos(2 * math.pi * 2 * u)
    p2 = -math.sqrt(2) * math.sin(2 * math.pi * 2 * u)
    r = p1 - p2 - 0.24 * p1 - 0.27 * p2 + ZC[i]
    c1 += r * p1 * dt
    c2 += r * p2 * dt
print(f"INFO  m5-chain prints r = ({c1:.2f}, {c2:.2f})")
check("m5-chain printed r_1", round(c1, 2), 0.75, 1e-9)
check("m5-chain printed r_2", round(c2, 2), -1.26, 1e-9)
truth("m5-chain decides 10 at (1,-1)", nearest([(1, 1), (-1, 1), (-1, -1), (1, -1)], c1, c2) == 3)
check("m5-chain 16-QAM at 1 Msym/s (Mb/s)", L2(16) * 1, 4, 0)
check("m5-quick BFSK = 9.6 + 3", 9.6 + 3.0, 12.6, 1e-9)
check("m5-quick 8-PSK bits", L2(8), 3, 0)
check("m5-quick 4-ASK to 8-ASK (dB)", todB(63 / 15), 6.2, 0.05)
check("m5-quick orthogonal band M=8", 8 / (2 * 3), 1.33, 0.005)
check("m5-quick orthogonal band M=16", 16 / (2 * 4), 2, 0)
check("m5-synth QAM over PSK at 16 (dB)", adv(16), 4.20, 0.005)
check("m5-synth QAM over PSK at 64 (dB)", adv(64), 9.95, 0.005)
check("m5-synth orthogonal floor (dB)", todB(math.log(2)), -1.6, 0.01)

print(f"\n{passed} passed, {failed} failed")
raise SystemExit(failed > 0)
