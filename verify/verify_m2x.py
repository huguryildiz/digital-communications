"""PASS lines for every number stated in build/src/88_scenes_m2x.js.

The visual scene of Module 2 (the noisy eye in 2.5). Standard library only, so it runs without the project venv.
Merge these checks into verify_scenes.py once that file is free to edit.

    python3 verify/verify_m2x.py      # N passed, 0 failed
"""
import math

q = lambda bt: math.exp(-2 * math.pi * bt)

passed = failed = 0


def check(name, got, want, tol):
    global passed, failed
    ok = abs(got - want) <= tol
    passed += ok
    failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {got:.6g} (want {want} ± {tol})")


# m2-eye-noise: the worst-pattern level at BT_b = 0.3
check("m2-eye-noise 1-2q at BT=0.3", 1 - 2 * q(0.3), 0.70, 0.005)

print(f"{passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
