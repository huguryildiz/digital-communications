"""Re-derives every number a worked practice-question solution states.

A worked solution ends with a step that checks its own answer. That step is
where a wrong answer is most likely to survive, because a solution that
miscalculates in the middle usually miscalculates in the check as well and
agrees with itself. Each entry reaches the same number by a route the
solution does not take: a numerical integral of the given density, a seeded
Monte Carlo run, a Gram-Schmidt pass on sampled waveforms, a Huffman code
built by a separate heap.

The checks live one module to a file, `drills_m1.py` ... `drills_m6.py`, each
a `CHECKS` list of dicts {name, stated, derive, tol} with its own
`DEFAULT_TOL`. Each file also runs on its own. This runner collects all six,
so the gate stays one command.

Adding a check is adding a dict to the module's CHECKS. The runner does not
change.
"""

import importlib
import sys

MODULES = [f"drills_m{n}" for n in range(1, 7)]


def main() -> int:
    passed = failed = 0
    for name in MODULES:
        mod = importlib.import_module(name)
        default_tol = getattr(mod, "DEFAULT_TOL", 5e-3)
        for c in mod.CHECKS:
            stated = c["stated"]
            tol = c.get("tol", default_tol)
            try:
                got = float(c["derive"]())
            except Exception as exc:              # a check that cannot run has failed
                print(f"FAIL  {c['name']}: re-derivation raised {type(exc).__name__}: {exc}")
                failed += 1
                continue
            if stated == 0:                           # a stated zero is compared absolutely
                rel = abs(got)
            else:
                rel = abs(got - stated) / abs(stated)
            ok = rel <= tol
            print(f"{'PASS' if ok else 'FAIL'}  {c['name']}: solution states {stated:.6g}, "
                  f"re-derived {got:.6g}, relative difference {rel:.2e}")
            if ok:
                passed += 1
            else:
                failed += 1
    print(f"{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
