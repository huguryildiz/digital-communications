"""PASS lines for every number stated in build/src/88_scenes_m2r.js.

Section 2.1 of Module 2, random signals: nine teaching slides and the
gallery. Standard library only, so it runs without the project venv.
Merge these checks into verify_scenes.py once that file is free to edit.

    python3 verify/verify_m2r.py      # N passed, 0 failed
"""
import math
import random

Q = lambda x: 0.5 * math.erfc(x / math.sqrt(2))
sinc = lambda x: 1.0 if abs(x) < 1e-12 else math.sin(math.pi * x) / (math.pi * x)

passed = failed = 0


def check(name, got, want, tol):
    global passed, failed
    ok = abs(got - want) <= tol
    passed += ok
    failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {got:.6g} (want {want} ± {tol})")


def integrate(f, a, b, n=200000):
    """Midpoint rule; the integrands here are smooth or have known tails."""
    h = (b - a) / n
    return h * sum(f(a + (i + 0.5) * h) for i in range(n))


# m2-rp-acf: R(tau) = exp(-|tau|/tc), tc = 1 ms, at tau = 1 ms; distractor exp(-1/2)
check("m2-rp-acf R(1 ms) = e^-1", math.exp(-1), 0.37, 0.005)
check("m2-rp-acf distractor e^-1/2", math.exp(-0.5), 0.61, 0.005)

# m2-rp-wss: R(tau) = 4 exp(-|tau|/2) cos(2 pi tau); P = R(0); |R| <= R(0)
RW = lambda t: 4 * math.exp(-abs(t) / 2) * math.cos(2 * math.pi * t)
check("m2-rp-wss P_X = R(0)", RW(0), 4.0, 1e-12)
check("m2-rp-wss even", max(abs(RW(t / 100) - RW(-t / 100)) for t in range(0, 321)), 0.0, 1e-12)
check("m2-rp-wss |R| <= R(0) on [-3.2,3.2]", max(abs(RW(t / 1000)) for t in range(-3200, 3201)), 4.0, 1e-12)
# its spectrum is nonnegative: S(f) = 2 [L(f-1) + L(f+1)], L(f) = 1/(1/4 + (2 pi f)^2)
L = lambda f: 1 / (0.25 + (2 * math.pi * f) ** 2)
check("m2-rp-wss S_X(f) >= 0 (min over f)", min(2 * (L(f / 100 - 1) + L(f / 100 + 1)) for f in range(-500, 501)) > 0, 1, 0)

# m2-rp-ex-phase: A = 3 V, f0 = 1 kHz, Theta uniform. Ensemble average over a fine phase grid.
A, f0 = 3.0, 1000.0
M = 3600
th = [2 * math.pi * (k + 0.5) / M for k in range(M)]
for t in (0.0, 0.2e-3, 0.37e-3):
    mu = sum(A * math.cos(2 * math.pi * f0 * t + q) for q in th) / M
    check(f"m2-rp-ex-phase mean at t={t*1e3:.2f} ms", mu, 0.0, 1e-9)
    for tau, want in ((0.0, 4.5), (0.25e-3, 0.0), (0.5e-3, -4.5)):
        R = sum(A * math.cos(2 * math.pi * f0 * t + q) * A * math.cos(2 * math.pi * f0 * (t + tau) + q) for q in th) / M
        check(f"m2-rp-ex-phase R({tau*1e3:.2f} ms) at t={t*1e3:.2f} ms", R, want, 1e-9)
check("m2-rp-ex-phase P = A^2/2", A * A / 2, 4.5, 1e-12)
check("m2-rp-ex-phase distractor A^2", A * A, 9.0, 1e-12)
check("m2-rp-ex-phase distractor A^2/6", A * A / 6, 1.5, 1e-12)

# m2-rp-psd: flat 1e-3 W/Hz on |f| < 5 kHz; and the figure's pair, area 1
check("m2-rp-psd P = 1e-3 * 1e4", 1e-3 * 1e4, 10.0, 1e-9)
tc = 0.3
S = lambda f: 2 * tc / (1 + (2 * math.pi * f * tc) ** 2)
area = integrate(S, -2000, 2000, 400000) + 2 * (1 / (2 * math.pi ** 2 * tc)) / 2000  # + the two 1/f^2 tails
check("m2-rp-psd area of S_X (tc = 0.3 ms) = R(0)", area, 1.0, 1e-4)
# the transform of exp(-|tau|/tc) at f = 0 is 2 tc
check("m2-rp-psd S_X(0) = 2 tc", integrate(lambda u: math.exp(-abs(u) / tc), -12, 12, 200000), 2 * tc, 1e-6)

# m2-rp-white: sinc(2 B tau) zero at 2 B tau = 1 for B = 1 MHz, tau = 0.5 us
check("m2-rp-white 2 B tau", 2 * 1e6 * 0.5e-6, 1.0, 1e-12)
check("m2-rp-white sinc(1)", sinc(1.0), 0.0, 1e-12)
# thermal noise flat to within 10% up to 1e12 Hz at room temperature: x/(e^x - 1), x = hf/kT
h, k = 6.62607015e-34, 1.380649e-23
x = h * 1e12 / (k * 300)
check("m2-rp-white thermal PSD ratio at 1e12 Hz, 300 K (>= 0.9)", x / math.expm1(x), 0.922, 0.001)

# m2-rp-lti: differentiator H(0) = 0, so mu_Y = 0 for mu_X = 3 V
check("m2-rp-lti mu_Y = 3 * H(0)", 3 * abs(complex(0, 2 * math.pi * 0)), 0.0, 1e-12)

# m2-rp-filtered: N0/2 = 1e-8 W/Hz, RC = 1 ms
RC, N0h = 1e-3, 1e-8
bneq = 1 / (4 * RC)
check("m2-rp-filtered B_neq = 1/(4RC)", bneq, 250.0, 1e-9)
H2 = lambda f: 1 / (1 + (2 * math.pi * f * RC) ** 2)
F = 2e6
PY = N0h * (integrate(H2, -F, F, 400000) + 2 / ((2 * math.pi * RC) ** 2 * F))
check("m2-rp-filtered P_Y by integration", PY, 5e-6, 1e-10)
check("m2-rp-filtered P_Y = N0 B_neq", 2 * N0h * bneq, 5e-6, 1e-15)
check("m2-rp-filtered distractor N0 f3dB (uW)", 2 * N0h / (2 * math.pi * RC) * 1e6, 3.2, 0.02)
check("m2-rp-filtered distractor N0/(2RC) (uW)", 2 * N0h / (2 * RC) * 1e6, 10.0, 1e-9)
check("m2-rp-filtered int du/(1+u^2) = pi", integrate(lambda u: 1 / (1 + u * u), -1e4, 1e4, 400000) + 2e-4, math.pi, 1e-6)
# the figure's default readouts: RC = 1 ms gives 250 Hz and 159 Hz
check("m2-rp-filtered f3dB (Hz) at RC = 1 ms", 1 / (2 * math.pi * RC), 159.15, 0.01)

# m2-rp-gauss: sigma = 2 mV, threshold 4 mV
check("m2-rp-gauss Q(2)", Q(4 / 2), 0.0228, 0.00005)
# the CLT figure: sum of n uniform[-1,1] has variance n/3, so scaling by sqrt(n/3) gives unit variance
rnd = random.Random(20260401)
for n in (1, 2, 5, 30):
    zs = [sum(rnd.uniform(-1, 1) for _ in range(n)) / math.sqrt(n / 3) for _ in range(20000)]
    var = sum(z * z for z in zs) / len(zs)
    check(f"m2-rp-gauss unit variance after scaling, n={n}", var, 1.0, 0.03)

# m2-real-random
kB, T = 1.380649e-23, 290
check("gallery v_rms = sqrt(4kTRB) (uV), R=1k, B=1MHz", math.sqrt(4 * kB * T * 1e3 * 1e6) * 1e6, 4.0, 0.005)
check("gallery kT in dBm/Hz", 10 * math.log10(kB * T / 1e-3), -174.0, 0.05)
check("gallery kTB at 20 MHz (dBm)", 10 * math.log10(kB * T * 20e6 / 1e-3), -101.0, 0.05)
check("gallery pitch 1/T0 (Hz)", 1 / 8e-3, 125.0, 1e-9)
# the 15-chip sequence of x^4 + x + 1 and its periodic autocorrelation
r, c = [1, 0, 0, 0], []
for _ in range(15):
    c.append(1 - 2 * r[3])
    r = [r[3] ^ r[0], r[0], r[1], r[2]]
Rk = [sum(c[n] * c[(n + kk) % 15] for n in range(15)) / 15 for kk in range(15)]
check("gallery PN R[0]", Rk[0], 1.0, 1e-12)
check("gallery PN R[k], k = 1..14 (max |R + 1/15|)", max(abs(v + 1 / 15) for v in Rk[1:]), 0.0, 1e-12)
check("gallery PN period (distinct shifts)", len({tuple(c[i:] + c[:i]) for i in range(15)}), 15, 0)
check("gallery 10 dB per decade", 10 * math.log10(10), 10.0, 1e-12)

print(f"\n{passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
