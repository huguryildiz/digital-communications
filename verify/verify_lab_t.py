"""PASS lines for every fixed number in the cards of Laboratory T
(build/src/72_labs_m2r.js, scene m2-lab-t): a random signal through a filter.

Units as in the laboratory: time in ms, frequency in kHz, amplitude in V, so a
power spectral density is in V^2/kHz. The closed forms the cards state are
checked against numerical integrals of S_X(f)|H(f)|^2, written here
independently of the laboratory's own code. Standard library only.

    python3 verify/verify_lab_t.py      # N passed, 0 failed
"""
import math
import random

passed = failed = 0

HALF_N0 = 1.0   # two-sided white-noise density, V^2/kHz
A = 1.0         # V
F0 = 1.0        # kHz, the sinusoid
TB = 0.5        # ms, the binary wave


def check(name, got, want, tol):
    global passed, failed
    ok = abs(got - want) <= tol
    passed += ok
    failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {got:.6g} (want {want} ± {tol})")


def simpson(f, a, b, n=20000):
    h = (b - a) / n
    s = f(a) + f(b) + sum((4 if i % 2 else 2) * f(a + i * h) for i in range(1, n))
    return s * h / 3


sinc = lambda x: 1.0 if abs(x) < 1e-12 else math.sin(math.pi * x) / (math.pi * x)
rc2 = lambda f, fc: 1 / (1 + (f / fc) ** 2)
SXb = lambda f: A * A * TB * sinc(f * TB) ** 2


def int_even(g, fmax):
    """Integral over the whole line of an even integrand: 2 * int_0^inf, the
    tail beyond fmax taken from u = 1/f so the 1/f^2 tail is not lost."""
    head = simpson(g, 0, fmax)
    tail = simpson(lambda u: g(1 / u) / (u * u) if u > 0 else 0.0, 0, 1 / fmax)
    return 2 * (head + tail)


# White noise through the RC lowpass: B_neq = (pi/2) f_3dB, P_Y = N_0 B_neq
for fc in (0.25, 1.0, 5.0):
    bneq = int_even(lambda f: rc2(f, fc), 50 * fc) / 2       # int |H|^2 df / (2 H_max^2)
    check(f"B_neq/f_3dB for RC at f_3dB={fc} kHz", bneq / fc, math.pi / 2, 1e-6)
    py = int_even(lambda f: HALF_N0 * rc2(f, fc), 50 * fc)
    check(f"P_Y white/RC at f_3dB={fc} = (N0/2) pi f_3dB", py, HALF_N0 * math.pi * fc, 1e-5)
check("default readout, white/RC at 1 kHz: pi", HALF_N0 * math.pi * 1.0, 3.142, 5e-4)
check("RC passes more than its 3 dB width: B_neq/f_3dB > 1", math.pi / 2, 1.571, 5e-4)

# White noise through the ideal lowpass: P_Y = N_0 B = 2 B
for B in (0.25, 1.0, 5.0):
    check(f"P_Y white/ideal at B={B}: N0 B", 2 * simpson(lambda f: HALF_N0, 0, B, 200), 2 * HALF_N0 * B, 1e-12)
check("N_0 = 2 (N_0/2) = 2 V^2/kHz, the factor 2 in N_0 B", 2 * HALF_N0, 2.0, 0)

# The random-phase sinusoid: P_X = A^2/2, impulses of weight A^2/4
check("sinusoid P_X = A^2/2 (the 0.5 in the card)", A * A / 2, 0.5, 0)
check("sinusoid impulse weight A^2/4", A * A / 4, 0.25, 0)
th = [2 * math.pi * k / 20000 for k in range(20000)]
check("ensemble mean of A cos(2 pi f0 t + Theta), t=0.3 ms",
      sum(A * math.cos(2 * math.pi * F0 * 0.3 + t) for t in th) / len(th), 0.0, 1e-9)
check("ensemble R_X(0.2 ms) = (A^2/2) cos(2 pi f0 0.2)",
      sum(A * math.cos(t) * A * math.cos(2 * math.pi * F0 * 0.2 + t) for t in th) / len(th),
      A * A / 2 * math.cos(2 * math.pi * F0 * 0.2), 1e-9)
check("sinusoid through RC at f_3dB = f0: 0.5/(1+1) = 0.25", 0.5 * rc2(F0, 1.0), 0.25, 0)

# The random binary wave: P_X = A^2 = 1, S_X(0) = A^2 T_b = 0.5, first null 1/T_b = 2 kHz
check("binary P_X = int A^2 T_b sinc^2(f T_b) df = A^2", int_even(SXb, 200), A * A, 2e-4)
check("binary S_X(0) = A^2 T_b", SXb(0), 0.5, 0)
check("binary main lobe ends at 1/T_b kHz", 1 / TB, 2.0, 0)
check("S_X(1/T_b) = 0", SXb(1 / TB), 0.0, 1e-30)
# R_X is the triangle: the inverse transform of S_X at tau = 0.2 ms
tau = 0.2
check("binary R_X(0.2 ms) = A^2(1-|tau|/T_b)",
      int_even(lambda f: SXb(f) * math.cos(2 * math.pi * f * tau), 200),
      A * A * (1 - tau / TB), 5e-4)

# Binary through RC: the closed form P_Y = A^2 [1 - (RC/T_b)(1 - e^{-T_b/RC})]
for fc in (0.25, 1.0, 5.0):
    RC = 1 / (2 * math.pi * fc)
    closed = A * A * (1 - RC / TB * (1 - math.exp(-TB / RC)))
    num = int_even(lambda f: SXb(f) * rc2(f, fc), 200)
    check(f"P_Y binary/RC at f_3dB={fc}: closed form = integral", closed, num, 5e-4)
RC = 1 / (2 * math.pi)
check("P_Y binary/RC at the default 1 kHz", A * A * (1 - RC / TB * (1 - math.exp(-TB / RC))), 0.695, 5e-4)
check("main lobe passed (f_3dB = 5 kHz): P_Y close to P_X",
      A * A * (1 - 1 / (2 * math.pi * 5) / TB * (1 - math.exp(-TB * 2 * math.pi * 5))), 0.936, 5e-4)

# Binary through the ideal lowpass at B = 2 kHz = 1/T_b: the main lobe, 0.903 of P_X
check("P_Y binary/ideal at B = 1/T_b", 2 * simpson(SXb, 0, 2.0), 0.903, 5e-4)

# The simulation of white noise through RC: the sampled Ornstein-Uhlenbeck
# recursion y[n+1] = a y[n] + sqrt(P(1-a^2)) z[n] keeps variance P at any dt,
# and its lag-k correlation is P a^k = P exp(-k dt/RC). Checked by Monte Carlo.
rnd = random.Random(20260924)
fc, dt = 1.0, 1 / 32
RC = 1 / (2 * math.pi * fc)
a = math.exp(-dt / RC)
P = HALF_N0 * math.pi * fc
y, s0, s1, prev, n = rnd.gauss(0, math.sqrt(P)), 0.0, 0.0, None, 400000
for _ in range(n):
    s0 += y * y
    if prev is not None:
        s1 += prev * y
    prev = y
    y = a * y + math.sqrt(P * (1 - a * a)) * rnd.gauss(0, 1)
check("OU recursion power at f_3dB = 1 kHz (Monte Carlo, 2%)", s0 / n, P, 0.02 * P)
check("OU recursion lag-1 correlation / P = exp(-dt/RC)", s1 / (n - 1) / P, a, 0.01)

print(f"{passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
