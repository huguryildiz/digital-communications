"""PASS lines for the closed-form numbers of the code page m2-code-random.

The four programs of section 2.1 in build/src/78_code_m2.js (rp-phase,
rp-psd, rp-rc, rp-lpf) print these numbers beside their numerical results.
Standard library only, so it runs without the project venv.

    python3 verify/verify_code_rp.py      # N passed, 0 failed
"""
import math

sinc = lambda x: 1.0 if abs(x) < 1e-12 else math.sin(math.pi * x) / (math.pi * x)

passed = failed = 0


def check(name, got, want, tol):
    global passed, failed
    ok = abs(got - want) <= tol
    passed += ok
    failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {got:.6g} (want {want} ± {tol})")


# rp-phase: X(t) = A cos(2 pi f0 t + Theta), A = 3 V, f0 = 1 kHz
A, f0 = 3.0, 1e3
Rx = lambda tau: A**2 / 2 * math.cos(2 * math.pi * f0 * tau)
check("rp-phase R_X(0) = A^2/2", Rx(0), 4.5, 1e-12)
check("rp-phase R_X(0.25 ms)", Rx(0.25e-3), 0.0, 1e-12)
check("rp-phase R_X(0.5 ms)", Rx(0.5e-3), -4.5, 1e-12)
check("rp-phase P_X = R_X(0)", Rx(0), 4.5, 1e-12)
# the mean over M = 360 equally spaced phases is zero at any t
M = 360
check("rp-phase ensemble mean at t = 0.2 ms",
      sum(A * math.cos(2 * math.pi * f0 * 0.2e-3 + 2 * math.pi * k / M) for k in range(M)) / M, 0.0, 1e-12)

# rp-psd: R_X(tau) = exp(-|tau|/tauc), tauc = 1 ms
tauc = 1e-3
Sx = lambda f: 2 * tauc / (1 + (2 * math.pi * f * tauc) ** 2)
check("rp-psd S_X(0) = 2 tauc", Sx(0), 2e-3, 1e-15)
f_half = 1 / (2 * math.pi * tauc)
check("rp-psd half-power frequency 1/(2 pi tauc) (Hz)", f_half, 159.2, 0.05)
check("rp-psd S_X(f_half) = S_X(0)/2", Sx(f_half), 1e-3, 1e-15)
check("rp-psd S_X(1 kHz)", Sx(1e3), 4.9409e-5, 5e-10)
# int S_X df = 2 tauc * (1/(2 pi tauc)) * pi = 1 = R_X(0)
check("rp-psd power int S_X df", 2 * tauc * math.pi / (2 * math.pi * tauc), 1.0, 1e-12)

# rp-rc: N0/2 = 1e-8 W/Hz, RC = 1 ms
N0, RC = 2e-8, 1e-3
Bneq = 1 / (4 * RC)
f3 = 1 / (2 * math.pi * RC)
check("rp-rc P_Y = N0/(4RC) (W)", N0 / (4 * RC), 5e-6, 1e-18)
check("rp-rc B_neq = 1/(4RC) (Hz)", Bneq, 250.0, 1e-9)
check("rp-rc f_3dB = 1/(2 pi RC) (Hz)", f3, 159.2, 0.05)
check("rp-rc wrong answer N0 f_3dB (W)", N0 * f3, 3.18e-6, 0.005e-6)
# the Lorentzian tail beyond 10 MHz is 1e-5 of P_Y, too small to move 5.000e-06
tail = N0 / (4 * math.pi**2 * RC**2 * 1e7)
check("rp-rc tail beyond 10 MHz / P_Y", tail / (N0 / (4 * RC)), 1.0e-5, 0.02e-5)

# rp-lpf: N0/2 = 1e-8 W/Hz, B = 1 MHz, R_Y(tau) = N0 B sinc(2 B tau)
B = 1e6
Ry = lambda tau: N0 * B * sinc(2 * B * tau)
check("rp-lpf P_Y = N0 B (W)", N0 * B, 0.02, 1e-15)
check("rp-lpf R_Y(0) (W)", Ry(0), 0.02, 1e-15)
check("rp-lpf R_Y(0.25 us) (W)", Ry(0.25e-6), 0.012732, 5e-7)
check("rp-lpf zero R_Y(0.5 us) = R_Y(1/(2B))", Ry(0.5e-6), 0.0, 1e-15)
check("rp-lpf zero R_Y(1 us) = R_Y(2/(2B))", Ry(1e-6), 0.0, 1e-15)
check("rp-lpf 1/(2B) (us)", 1e6 / (2 * B), 0.5, 1e-12)

print(f"\n{passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
