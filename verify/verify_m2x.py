"""PASS lines for every number stated in build/src/88_scenes_m2x.js.

The five visual scenes of Module 2 (the noisy eye in 2.4 and the survey
section 2.6). Standard library only, so it runs without the project venv.
Merge these checks into verify_scenes.py once that file is free to edit.

    python3 verify/verify_m2x.py      # N passed, 0 failed
"""
import math

Q = lambda x: 0.5 * math.erfc(x / math.sqrt(2))
q = lambda bt: math.exp(-2 * math.pi * bt)
sinc = lambda x: 1.0 if abs(x) < 1e-12 else math.sin(math.pi * x) / (math.pi * x)

passed = failed = 0


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


def solve(g, lo, hi):
    for _ in range(200):
        mid = (lo + hi) / 2
        if g(lo) * g(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


# m2-eye-noise: the worst-pattern level at BT_b = 0.3
check("m2-eye-noise 1-2q at BT=0.3", 1 - 2 * q(0.3), 0.70, 0.005)

# m2-equalizer: q at BT_b = 0.25, the distractor 1-q, and the closed default eye
check("m2-equalizer q at BT=0.25", q(0.25), 0.208, 0.0005)
check("m2-equalizer 1-q at BT=0.25", 1 - q(0.25), 0.792, 0.0005)
check("m2-equalizer eye closed at BT=0.1 (1-2q<0)", 1 - 2 * q(0.1), -0.067, 0.0005)
check("m2-equalizer opening 2(1-q) at BT=0.1, w=-q", 2 * (1 - q(0.1)), 0.93, 0.005)
# the tail g_m = (1-q) q^(m-1) (q+w) vanishes for w = -q
check("m2-equalizer tail at w=-q", max(abs((1 - q(0.25)) * q(0.25) ** (m - 1) * (q(0.25) - q(0.25))) for m in range(1, 8)), 0.0, 1e-12)

# m2-timing: early 0.62 < late 0.80 gives e < 0, so the clock is early
check("m2-timing e = 0.62 - 0.80", 0.62 - 0.80, -0.18, 1e-12)
# the locked clock: triangle peak at 1, early/late at 1 -+ 0.35 agree
tri = lambda t: max(0.0, 1 - abs(t - 1))
check("m2-timing e at lock", tri(1 - 0.35) - tri(1 + 0.35), 0.0, 1e-12)
check("m2-timing e in the first frame", tri(1.4 - 0.35) - tri(1.4 + 0.35), 0.70, 1e-9)

# m2-psd: share of sinc^2 power inside |f| < R_b, and the largest alpha
check("m2-psd rectangle power in |f|<R_b", simpson(lambda f: sinc(f) ** 2, -1, 1), 0.90, 0.005)
check("m2-psd alpha max for 1.25 MHz spacing", 1.25 / 1.0 - 1, 0.25, 1e-12)

# m2-repeater: K = 50, P_b = 1e-6
K, P = 50, 1e-6
regen = 10 * math.log10(solve(lambda x: K * Q(math.sqrt(2 * x)) - P, 1, 1e4))
analog = 10 * math.log10(solve(lambda x: Q(math.sqrt(2 * x / K)) - P, 1, 1e7))
check("m2-repeater regenerative Eb/N0 dB", regen, 11.8, 0.05)
check("m2-repeater analog Eb/N0 dB", analog, 27.5, 0.05)
check("m2-repeater power ratio", 10 ** ((analog - regen) / 10), 37, 0.6)
check("m2-repeater K p for K=100, p=1e-6", 100 * 1e-6, 1e-4, 1e-15)

print(f"{passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
