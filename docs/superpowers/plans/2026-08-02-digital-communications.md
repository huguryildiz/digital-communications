# EE 413 Digital Communications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.
>
> **Self-triggered:** run `/uret` in this repository. That command finds the first unchecked step
> below, does it, ticks it, and commits. Run it again to continue. It is the only entry point;
> nothing here needs to be started by hand.

**Goal:** Build the EE 413 Communication Systems II teaching artifact — one offline HTML file
carrying seven modules, ten laboratories and 140 practice questions, plus a lecture-notes PDF and
three derived editions — all of it passing eleven verification gates.

**Architecture:** The course-agnostic rendering engine is copied once from `signals-and-systems`
and never redesigned. Content is written into numbered scene files that `build/build.js`
concatenates into a single artifact. Every numerical claim is re-derived by a Python gate, and
every closed-form error probability is additionally checked against an independent Monte Carlo
simulation.

**Tech Stack:** Vanilla JavaScript (no framework, no bundler, no npm at runtime), vendored KaTeX,
Playwright for the browser gates, Python 3.12 arm64 with numpy/scipy/sympy for the numerical gates.

**Design record:** `docs/superpowers/specs/2026-08-02-digital-communications-design.md`. Read it
before Task 1. Section references below (§4, §7, …) point into it.

---

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include this section.

- **One file, no network.** The artifact makes no network request and needs no install step. KaTeX
  is vendored and font-inlined. No `npm install` at any point in the build.
- **Editorial rules R1–R9 are binding** on every student-facing string, inherited unchanged from
  `signals-and-systems/CLAUDE.md` §6. Never name a source, a page, an audit or a process.
- **Turkish to the user, plain academic English in every file.** Deliverables and internal records
  alike.
- **`Q(x)` is the Gaussian tail**, `Q(x) = ½ erfc(x/√2)`. Noise is white and Gaussian with
  **two-sided** PSD `N_0/2` unless a scene says otherwise.
- **Textbook anchors carry the `PS` marker** and are looked up in `source/Book.pdf` before use. A
  well-formed but wrong anchor passes `rule_check.py`, so the lookup is not optional.
- **Twenty questions a module**, 12 single-skill and 8 full-length. No question carries a number
  from a paper. No student-facing string calls a question section an examination.
- **`verify_ber.py` is written independently of `commsyslab`.** Porting the artifact's simulation
  into the gate makes the gate verify itself.
- **`source/` is gitignored** and must be present locally before any build.
- **Commit sources and rebuilt `dist/` together**, never in separate commits.
- Python is the arm64 venv at `.venv/`. Never the x86_64 anaconda `python3`.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `build/build.js` | concatenates `build/src/*` into the artifact |
| `build/src/00_head.html` … `40_core.js`, `60_plot.js`, `90_app.js`, `99_tail.html` | engine, copied, not edited except where a task says so |
| `build/src/80_content_core.js` | `CONTENT.META`, the book icon, shared constants |
| `build/src/89_sections.js` | **the one place** chapters, sections, addresses and `PS` anchors are declared |
| `build/src/81_scenes_m0.js` … `87_scenes_m6.js` | teaching scenes, one file per module |
| `build/src/70_labs.js` … `74_labs_*.js` | laboratories |
In `build/src/80_content_core.js`, which is the one place the version lives in this course — there is no `91_scenes_end.js` here, and the Formula Reference reads the same value.
| `build/src/92_drill_m1.js` … `97_drill_m6.js` | question sections, one file per module |
| `build/src/99_tail.html` | **scene order** — a new array must be registered here or it never appears |
| `build/qa.js` `labtest.js` `textclash.js` `mathscan.js` `seccheck.js` `labwalk.js` `pw.js` | browser gates |
| `notes/build.js` `topdf.js` `editions.js` `src/c*.js` | lecture-notes pipeline |
| `verify/verify_scenes.py` | re-derives every number in a teaching scene |
| `verify/verify_drills.py` | re-derives every `Check` step in a worked solution |
| `verify/verify_ber.py` | **new** — closed-form error probability against Monte Carlo |
| `verify/wilson.py` | the interval test `verify_ber.py` decides with |
| `tools/rule_check.py` | banned phrases, figure-label rules, `PS` marker |
| `.claude/commands/uret.md` | the self-trigger |

---

# Phase 0 — Skeleton

The engine must be proven to work before any content depends on it.

### Task 1: Copy the engine and prove it builds

**Files:**
- Create: `build/`, `notes/`, `verify/`, `tools/`, `dist/` by copying from `signals-and-systems`
- Create: `build/src/80_content_core.js`, `build/src/89_sections.js`, `build/src/81_scenes_m0.js`
- Create: `build/src/99_tail.html` (edited copy)

**Interfaces:**
- Produces: `dist/Digital_Communications.html`, a valid artifact with exactly one scene.

- [x] **Step 1: Copy the engine files**

```bash
cd ~/Documents/GitHub/digital-communications
S=~/Documents/GitHub/signals-and-systems
mkdir -p build/src notes/src verify tools dist
cp $S/build/src/{00_head.html,10_style.css,20_katex.css,30_katex.js,40_core.js,60_plot.js,90_app.js} build/src/
cp $S/build/{build.js,qa.js,labtest.js,textclash.js,mathscan.js,seccheck.js,labwalk.js,domcheck.js,pw.js} build/
cp $S/notes/{build.js,topdf.js,editions.js} notes/
cp $S/notes/src/{render.js,notes.css} notes/src/
cp $S/tools/rule_check.py tools/
```

- [x] **Step 2: Rename the artifact output**

In `build/build.js`, change the output filename from `Signals_and_Systems.html` to
`Digital_Communications.html`. This is the only edit to `build.js`.

- [x] **Step 3: Adapt the palette to this course's signal semantics**

The five signal colours keep their values and change their meanings (spec §3): cyan is the
transmitted signal or source symbol, amber the channel or filter, green the received or detected
output, violet an intermediate quantity, red an error. Two things this course draws and the other
does not:

- **Noise takes no colour of its own.** It is drawn in the hairline tone at low opacity. Do not add
  a sixth hue — the symbol points inside a noise cloud must keep their own colour to stay readable.
- **A decision region** is a low-opacity fill of the colour of the symbol it decides for.

Add both as tokens beside the signal colours in `build/src/10_style.css` and in `LIGHT` / `DARK` in
`build/src/60_plot.js`.

**Then update `build/textclash.js` in the same commit.** That gate classifies a drawn element as
guide, axis or content **by its colour**, through its `GRID` / `AXIS` / `LIGHTFILL` token lists. A
palette change that skips it makes the gate report on colours the artifact no longer draws — it
stays green while measuring nothing. The new noise and decision-region tones belong in the fill
lists, not the content list: they are background, and a label crossing them is not a collision.

- [x] **Step 4: Write the minimal content core**

Create `build/src/80_content_core.js` with `CONTENT.META` set to `{course:'EE 413', title:'Digital
Communications', version:'0.1'}`, and `CONTENT.BOOKICON` copied verbatim from the source repository
— the inline SVG open book the `PS` chip uses.

- [x] **Step 5: Write one placeholder scene**

Create `build/src/81_scenes_m0.js` defining `window.SCENES_M0 = [...]` with a single title scene
carrying one heading and one paragraph. No mathematics, no figure.

- [x] **Step 6: Declare its address**

Create `build/src/89_sections.js` declaring chapter 0 with one section and one scene, no `PS`
anchor. The title scene is the one scene allowed to have no address — follow the source
repository's convention for marking it.

- [x] **Step 7: Register the array**

In `build/src/99_tail.html`, remove every `SCENES_M*` and `DRILL_M*` reference from the source
course and leave only `window.SCENES_M0`.

- [x] **Step 8: Build and check it parses**

```bash
node --check build/src/8*.js build/src/9*.js
cd build && node build.js
```

Expected: silence from `node --check`, and `dist/Digital_Communications.html` written.

- [x] **Step 9: Open it and confirm the scene renders**

```bash
cd build && node pw.js shot.js
```

If `shot.js` was not copied, open `dist/Digital_Communications.html` in a browser. Expected: the
title scene draws, no console error.

- [x] **Step 10: Commit**

```bash
git add -A && git commit -m "Copy the rendering engine and prove it builds on one scene"
```

---

### Task 2: Build the Python environment and the Wilson interval

**Files:**
- Create: `.venv/` (gitignored), `verify/wilson.py`, `verify/test_wilson.py`

**Interfaces:**
- Produces: `wilson_interval(k: int, n: int, z: float = 3.0) -> tuple[float, float]` returning
  `(lo, hi)`, the Wilson score interval for `k` successes in `n` trials.
- Produces: `consistent(p_claimed: float, k: int, n: int, z: float = 3.0) -> bool`, true when
  `p_claimed` lies inside that interval.

- [x] **Step 1: Create the arm64 virtualenv**

```bash
/opt/homebrew/bin/python3.12 -m venv .venv
.venv/bin/pip install numpy scipy sympy
.venv/bin/python -c "import platform; print(platform.machine())"
```

Expected: `arm64`. Anything else means the wrong interpreter — stop and fix it.

- [x] **Step 2: Write the failing test**

Create `verify/test_wilson.py`:

```python
import math
from wilson import wilson_interval, consistent

def test_interval_brackets_the_point_estimate():
    lo, hi = wilson_interval(500, 10000)
    assert lo < 0.05 < hi

def test_interval_narrows_with_more_trials():
    w_small = wilson_interval(50, 1000)
    w_large = wilson_interval(5000, 100000)
    assert (w_large[1] - w_large[0]) < (w_small[1] - w_small[0])

def test_zero_successes_gives_a_finite_upper_bound():
    lo, hi = wilson_interval(0, 10000)
    assert lo == 0.0
    assert 0.0 < hi < 0.01

def test_a_factor_of_two_error_is_rejected():
    # 10000 trials at a true rate of 0.05 gives ~500 errors.
    # A claim of 0.025 must fall outside the interval.
    assert consistent(0.05, 500, 10000)
    assert not consistent(0.025, 500, 10000)
```

- [x] **Step 3: Run it and watch it fail**

```bash
cd verify && ../.venv/bin/python -m pytest test_wilson.py -v
```

Expected: FAIL, `ModuleNotFoundError: No module named 'wilson'`.

- [x] **Step 4: Implement it**

Create `verify/wilson.py`:

```python
"""Wilson score interval, the decision rule for verify_ber.py.

A simulated error count k out of n trials is consistent with a claimed
probability p when p lies inside this interval. The normal approximation to
a binomial proportion is useless here because error probabilities are small
and k is often near zero; the Wilson interval stays correct in that regime.

z defaults to 3.0, roughly a 99.7% interval. A claim that is right passes
with probability ~0.997 per check, and a claim with a factor-of-two slip
fails whenever the trial count is sized as verify_ber.py sizes it.
"""

import math


def wilson_interval(k: int, n: int, z: float = 3.0) -> tuple[float, float]:
    if n <= 0:
        raise ValueError("n must be positive")
    p = k / n
    z2 = z * z
    denom = 1.0 + z2 / n
    centre = (p + z2 / (2 * n)) / denom
    half = (z / denom) * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))
    return (max(0.0, centre - half), min(1.0, centre + half))


def consistent(p_claimed: float, k: int, n: int, z: float = 3.0) -> bool:
    lo, hi = wilson_interval(k, n, z)
    return lo <= p_claimed <= hi
```

- [x] **Step 5: Run the tests and watch them pass**

```bash
cd verify && ../.venv/bin/python -m pytest test_wilson.py -v
```

Expected: `4 passed`.

- [x] **Step 6: Commit**

```bash
git add verify/wilson.py verify/test_wilson.py && \
git commit -m "Decide simulated error rates with a Wilson interval, not a normal approximation"
```

---

### Task 3: Write `verify_ber.py` against a claim it can already check

**Files:**
- Create: `verify/verify_ber.py`, `verify/ber_claims.py`

**Interfaces:**
- Consumes: `wilson.consistent`.
- Produces: `CLAIMS`, a list of dicts `{name, closed_form, simulate, trials, params}` where
  `closed_form(**params) -> float` and `simulate(rng, n, **params) -> int` returns an error count.
- Produces: a PASS/FAIL line per claim and a `N passed, M failed` summary, exit code 1 on any
  failure.

**Why this task exists before any scene:** the gate is written against antipodal binary signalling,
whose error probability every textbook agrees on. Getting the harness right on a known answer is
what makes it trustworthy on an unknown one.

- [x] **Step 1: Write the first claim**

Create `verify/ber_claims.py`:

```python
"""Every closed-form error probability the course states, paired with an
independent simulation of the same system.

The simulation is written from the system description, not from the formula:
it draws noise, forms the decision statistic, applies the decision rule and
counts disagreements. If the closed form is wrong, the two disagree.

Nothing here is ported from commsyslab. A gate built from the implementation
it checks verifies itself.
"""

import numpy as np
from scipy.special import erfc


def qfunc(x):
    return 0.5 * erfc(np.asarray(x, dtype=float) / np.sqrt(2.0))


# ── Binary antipodal signalling in AWGN ──────────────────────────────────────
# s = ±sqrt(Eb), noise variance N0/2, matched-filter output y = s + n.
# Claimed: P_b = Q(sqrt(2 Eb/N0)).

def antipodal_closed(ebn0_db):
    ebn0 = 10.0 ** (ebn0_db / 10.0)
    return float(qfunc(np.sqrt(2.0 * ebn0)))


def antipodal_sim(rng, n, ebn0_db):
    ebn0 = 10.0 ** (ebn0_db / 10.0)
    eb = 1.0
    n0 = eb / ebn0
    sigma = np.sqrt(n0 / 2.0)
    bits = rng.integers(0, 2, size=n)
    sent = np.where(bits == 1, np.sqrt(eb), -np.sqrt(eb))
    y = sent + rng.normal(0.0, sigma, size=n)
    decided = (y > 0).astype(int)
    return int(np.count_nonzero(decided != bits))


CLAIMS = [
    {
        "name": "binary antipodal, Eb/N0 = 4 dB",
        "closed_form": antipodal_closed,
        "simulate": antipodal_sim,
        "trials": 2_000_000,
        "params": {"ebn0_db": 4.0},
    },
    {
        "name": "binary antipodal, Eb/N0 = 8 dB",
        "closed_form": antipodal_closed,
        "simulate": antipodal_sim,
        "trials": 20_000_000,
        "params": {"ebn0_db": 8.0},
    },
]
```

- [x] **Step 2: Write the runner**

Create `verify/verify_ber.py`:

```python
"""Checks every closed-form error probability against a fixed-seed simulation.

A closed form cannot be verified by re-deriving it symbolically -- re-deriving
it is how the original error would be reproduced. It is verified by simulating
the system it describes and asking whether the measured error count is
consistent with the claimed probability.

Deterministic: the seed is fixed, the trial count is fixed per claim, and the
decision is a Wilson interval. A claim that is right passes on every machine.

Trial counts are chosen so that a factor-of-two error in the claimed
probability falls outside the interval. Raising a count is fine; lowering one
weakens the gate and must be justified in the commit message.
"""

import sys
import numpy as np
from ber_claims import CLAIMS
from wilson import wilson_interval, consistent

SEED = 20260802

def main() -> int:
    passed = failed = 0
    for claim in CLAIMS:
        rng = np.random.default_rng(SEED)
        n = claim["trials"]
        p = claim["closed_form"](**claim["params"])
        k = claim["simulate"](rng, n, **claim["params"])
        lo, hi = wilson_interval(k, n)
        ok = consistent(p, k, n)
        status = "PASS" if ok else "FAIL"
        print(
            f"{status}  {claim['name']}: claimed {p:.6e}, "
            f"measured {k}/{n} = {k/n:.6e}, interval [{lo:.6e}, {hi:.6e}]"
        )
        if ok:
            passed += 1
        else:
            failed += 1
    print(f"{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
```

- [x] **Step 3: Run it**

```bash
cd verify && ../.venv/bin/python verify_ber.py
```

Expected: `2 passed, 0 failed`.

- [x] **Step 4: Prove the gate can fail**

Temporarily change `antipodal_closed` to return `qfunc(np.sqrt(ebn0))` — the missing factor of two
that is the single most common error in this material. Re-run.

Expected: `0 passed, 2 failed`. **Then revert the change.** A gate never seen failing is a gate
that may not work.

- [x] **Step 5: Commit**

```bash
git add verify/verify_ber.py verify/ber_claims.py && \
git commit -m "Check closed-form error probabilities against an independent simulation"
```

---

### Task 4: Move the anchor marker from `OW` to `PS`, in both gates

**Files:**
- Modify: `tools/rule_check.py`
- Modify: `build/seccheck.js`

**Interfaces:**
- Produces: a failure on any `CH` reference in a student-facing string not immediately preceded by
  `PS `, and on any `§` anywhere.

**Both gates hold this rule and they must move together.** `rule_check.py` reads the source files;
`seccheck.js` reads the rendered page and additionally fails on a `CH` reference outside the chip
and on a chip that has lost its book icon. Changing one and not the other leaves the rule enforced
on one side only.

- [x] **Step 1: Read the existing marker check in both files**

The source repository's `rule_check.py` fails on a `§` and on a `CH` without `OW` in front of it.
`seccheck.js` holds the same rule for the rendered artifact. Find both.

- [x] **Step 2: Change the marker from `OW` to `PS` in both**

Keep the single exemption: the sentence in M0 that introduces the convention has to show the form
it describes.

- [x] **Step 3: Run both**

```bash
cd build && node pw.js seccheck.js
```

Expected: `PROBLEMS: none`, with the addressed and anchored counts printed.

- [x] **Step 4: Run `rule_check.py`**

```bash
.venv/bin/python tools/rule_check.py "build/src/8[1-9]_scenes*.js" "build/src/9[2-8]_drill_m*.js" \
        "build/src/91_*.js" "build/src/70_labs.js" "notes/src/*.js"
```

Expected: `TOTAL VIOLATIONS: 0` (there is almost no content yet, which is the point — the gate runs
clean before content exists).

- [x] **Step 4: Commit**

```bash
git add tools/rule_check.py && git commit -m "Mark textbook anchors PS, since this course reads Proakis and Salehi"
```

---

### Task 5: Get all eleven gates green on the skeleton

**Files:**
- Modify: whichever gate file names the source course's constants

**Interfaces:**
- Produces: eleven gates running and reporting zero failures on a one-scene artifact.

- [x] **Step 1: Run each gate and record what it prints**

```bash
node --check build/src/8*.js build/src/9*.js
cd build && node qa.js
cd build && node labtest.js
cd build && node textclash.js
cd build && node mathscan.js
cd build && node pw.js ../notes/mathscan.js
cd build && node pw.js labwalk.js
cd build && node pw.js seccheck.js
cd verify && ../.venv/bin/python verify_scenes.py
cd verify && ../.venv/bin/python verify_drills.py
cd verify && ../.venv/bin/python verify_ber.py
.venv/bin/python tools/rule_check.py "build/src/8[1-9]_scenes*.js" "build/src/9[2-8]_drill_m*.js" \
        "build/src/91_*.js" "build/src/70_labs.js" "notes/src/*.js"
```

- [x] **Step 2: Create the two missing verify files as empty-but-valid gates**

`verify_scenes.py` and `verify_drills.py` do not exist yet. Create each with an empty `CHECKS`
list and the same PASS/FAIL-per-line and `N passed, M failed` output shape as `verify_ber.py`, so
that a module can add checks to them without touching the runner.

- [x] **Step 3: Fix every gate that names the old course**

A gate that hardcodes `Signals_and_Systems.html`, a scene count, or a module list will fail. Change
the filename; make counts read from the artifact rather than from a constant.

- [x] **Step 4: Re-run all eleven and record the numbers**

Expected: no failures anywhere. Report the numbers each run printed, never a summary in place of a
run.

- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "Bring all eleven gates up on the skeleton"
```

---

# Phase 1 — Module 1, and the pattern every later module follows

M1 is Sampling, quantization and PCM (`PS CH7.3–7.4`). It costs about three times a later module,
because the figure vocabulary, the scene rhythm and the question format are all decided inside it.
**Everything Phase 2 onward does is this phase again with different content.**

### Task 6: Read the source for M1 and write the inventory

**Files:**
- Create: `.claude/notes/m1_inventory.md` (gitignored)

- [x] **Step 1: Extract the slide text**

```bash
pdftotext -layout source/Slides/EE413-CH7.pdf .claude/notes/ch7.txt
```

- [x] **Step 2: Render the handwritten pages for M1**

```bash
mkdir -p pages && pdftoppm -r 160 -png -f 2 -l 12 "source/Lecture Notes.pdf" pages/m1
```

160 dpi, not lower. Read every rendered page by eye — this is the source that carries the
derivations as they were taught.

- [x] **Step 3: Write the inventory**

One row per teachable item: what it is, which slide, which note page, whether the two agree. Where
they disagree, resolve against `source/Book.pdf` and record the resolution in the ambiguity ledger
format, numbered from A-01. **Never correct a source silently.**

- [x] **Step 4: Look up every `PS` anchor in the book**

For each item, find its section in `source/Book.pdf` and write the anchor down. Do not infer an
anchor from a chapter number, and do not carry one over from `commsyslab` — see §7 of the spec.

- [x] **Step 5: Commit** (the inventory is gitignored; commit only if a source resolution changed a
      tracked file)

---

### Task 7: Write the M1 teaching scenes

**Files:**
- Create: `build/src/82_scenes_m1.js`
- Modify: `build/src/89_sections.js`, `build/src/99_tail.html`

**Interfaces:**
- Produces: `window.SCENES_M1`, an array of scene objects in the schema `90_app.js` renders.

- [x] **Step 1: Write the scenes**

Follow the inventory order. Every figure obeys R7: axis names outside the data area, typeset with
KaTeX, no Unicode substitutes, every label with a halo. Continuous-time signals are curves,
discrete-time signals are stems, impulses are arrows whose height is the weight.

- [x] **Step 2: Declare the addresses in `89_sections.js`**

Chapter 1, its sections, every scene ordinal, and the `PS` anchor from Task 6 step 4. **No scene
file carries an address of its own.**

- [x] **Step 3: Register the array in `99_tail.html`**

`window.SCENES_M1` after `window.SCENES_M0`. A new array not registered here never appears.

- [x] **Step 4: Check it parses, then build**

```bash
node --check build/src/8*.js && cd build && node build.js
```

- [x] **Step 5: Run the layout gate**

```bash
cd build && node qa.js
```

Expected: `0 errors, 0 overflow`. The run also prints `dense` — every scene held together by a
scale factor below 0.90. A scene in that list is **split**, not shipped. That is the mechanical
reading of the one-page rule.

- [x] **Step 6: Run the label and mathematics gates**

```bash
cd build && node textclash.js && node mathscan.js
```

Expected: `TOTAL COLLISIONS: 0` and `SCENES WITH MATH DAMAGE: 0 / N`.

- [x] **Step 7: Look at a screenshot**

```bash
cd build && node pw.js shot.js
```

No gate reads a rendering. The 136 px key-column bug in the other course shipped through every gate
and was found by looking. Look.

- [x] **Step 8: Commit**

```bash
git add -A && git commit -m "Teach sampling, quantization and PCM"
```

---

### Task 8: Add the M1 numerical checks

**Files:**
- Modify: `verify/verify_scenes.py`

- [x] **Step 1: Write one check per number stated in an M1 scene**

Each re-derives the result independently — symbolically with SymPy where it can, numerically where
it cannot. A check that restates the scene's own arithmetic checks nothing.

- [x] **Step 2: Run it**

```bash
cd verify && ../.venv/bin/python verify_scenes.py
```

Expected: `N passed, 0 failed`, with N equal to the number of claims in M1.

- [x] **Step 3: Commit**

```bash
git add verify/verify_scenes.py && git commit -m "Re-derive every number the sampling scenes state"
```

---

### Task 9: Build laboratories A and B

**Files:**
- Create: `build/src/70_labs.js`, `build/src/71_labs_m1.js`
- Modify: `build/src/89_sections.js`, `build/src/99_tail.html`

**Interfaces:**
- Produces: laboratory A (quantization and SQNR) and B (PCM, DPCM, delta modulation), each
  registered in the scene list with a `1.L1` / `1.L2` address.

- [x] **Step 1: Port the numerical core from `commsyslab`**

`src/lib/dsp/sigmadelta.ts` and `dpcm.ts` for laboratory B; the quantizer in
`src/modules/sampling-quantization/` for A. TypeScript to vanilla JavaScript, type annotations
dropped. **Not** an import — the artifact stays one file.

- [x] **Step 2: Re-check every equation reference that came with it**

Look each up in `source/Book.pdf`. `gram-schmidt.ts` is already known to cite §7.1 for a result
that is §8.1 here. `rule_check.py` cannot catch this: a wrong `PS` anchor is a well-formed one.

- [x] **Step 3: Draw the figures from `PLOT.COL`**

No figure carries a page, plate or ink colour of its own, and a figure built in JavaScript is
produced per render — a figure generated once at load time keeps the palette it was born with.

- [x] **Step 4: Run the interaction gates**

```bash
cd build && node labtest.js && node pw.js labwalk.js
```

Expected: `ERRORS: none`, and `PROBLEMS: none` with the walked-state count printed.

- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "Add the quantization and waveform-coding laboratories"
```

---

### Task 10: Write the M1 question section

**Files:**
- Create: `build/src/92_drill_m1.js`
- Modify: `build/src/89_sections.js`, `build/src/99_tail.html`

**Interfaces:**
- Produces: `window.DRILL_M1` — one taxonomy section and twenty questions, each with a hidden
  worked solution and an instructor-only `src` field.

- [x] **Step 1: Write the taxonomy**

Six entries. Three come from the exam tables (MT Q1, MT Q2, Final Q1 — see spec §8); the rest from
the worked examples in the slides. The sixth names the full-length form.

- [x] **Step 2: Write twelve single-skill questions**

Two or three parts each.

- [x] **Step 3: Write eight full-length questions**

One statement, three to four lettered parts, in the form the papers use. A question may keep the
shape of a paper question. It may keep **no** number from it. A replacement number must leave the
character of the answer intact.

- [x] **Step 4: Set `options=0` throughout**

Every question is open-ended. `labtest.js` asserts this; a multiple-choice button fails the gate.

- [x] **Step 5: Walk the pager and the solutions**

```bash
cd build && node labtest.js && node mathscan.js
```

`labtest.js` walks the pager to the last question; `mathscan.js` opens every worked solution. A
pager that stops short fails here.

- [x] **Step 6: Commit**

```bash
git add -A && git commit -m "Set twenty practice questions on sampling and quantization"
```

---

### Task 11: Verify the M1 solutions numerically

**Files:**
- Modify: `verify/verify_drills.py`
- Modify: `verify/ber_claims.py` if any M1 solution states an error probability

- [x] **Step 1: Re-derive every number in every `Check` step**

Twenty solutions.

- [x] **Step 2: Add any error-probability claim to `ber_claims.py`**

With a trial count sized so a factor-of-two slip falls outside the interval.

- [x] **Step 3: Run both numerical gates**

```bash
cd verify && ../.venv/bin/python verify_drills.py && ../.venv/bin/python verify_ber.py
```

Expected: `N passed, 0 failed` from each.

- [x] **Step 4: Commit**

```bash
git add -A && git commit -m "Re-derive every number the sampling solutions state"
```

---

### Task 12: Write the M1 lecture-notes chapter and close the phase

**Files:**
- Create: `notes/src/c1.js`
- Modify: `notes/build.js` chapter list

- [x] **Step 1: Write chapter 1**

The same material as the scenes, in the notes block schema. **The block-type key is `t`, and a
worked example's heading key is `hd` — never `t`.** Two `t` keys in one object literal silently
drop the whole block.

- [x] **Step 2: Build the notes and the PDF**

```bash
cd notes && node build.js && node topdf.js
```

- [x] **Step 3: Run the notes mathematics gate**

```bash
cd build && node pw.js ../notes/mathscan.js
```

Expected: `LITERAL MATH IN NOTES: 0`, `KATEX ERRORS: 0`.

- [x] **Step 4: Sweep the PDF for source text**

```bash
pdftotext -layout dist/Lecture_Notes.pdf - | grep -nE '\$[^$]+\$|\\\\[a-zA-Z]+'
```

Expected: no output. This is not a gate — it is the step that catches the R8 class no gate can see.

- [x] **Step 5: Run all eleven gates and record every number**

- [x] **Step 6: Commit sources and `dist/` together**

```bash
git add -A && git commit -m "Put sampling and quantization into the lecture notes"
```

---

# Phases 2–6 — Modules 2 to 6

Each module repeats Tasks 6–12 exactly, with its own content. **Read Phase 1 before starting any of
these** — the steps, the gates and their expected output are written out there and are not repeated.

Per-module specifics:

| Phase | Module | Slides | Note pages | Laboratories | Taxonomy source |
| --- | --- | --- | --- | --- | --- |
| 2 | M2 baseband transmission ✔ done | CH8, all 48 | 13–27 | C, D, E | MT Q3, MT Q4, Final Q2 |
| 3 | M3 signal-space representation ✔ done | CH9 s.3–21 | 28–~40 | F | slides only — no exam type |
| 4 | M4 optimal receiver, decision regions, union bound ✔ done | CH9 s.23–65 | ~40–58 | G | Final Q3 in part |
| 5 | M5 modulation families ✔ done | CH9 s.66–101 | ~58–66 | H | Final Q3 in part |
| 6 | M6 information theory ✔ done | CH10, all 22 | 67–80 | I, J | Final Q4 |

Three things differ from Phase 1 and must not be forgotten:

- **M3, M4 and M5 have no adequate exam source** (spec §8). Their taxonomies come from the worked
  examples in the slides and the derivations in the handwritten notes. Write that down in the
  design record when you do it; do not let it look as if the papers covered CH9.
- **Laboratory H compares a closed form against a simulation.** Its claims go into
  `ber_claims.py` like any other, and the figure uses the same fixed seed so it renders identically
  everywhere.
- **M4 and M5 are where the factor-of-two errors live.** Every `P_e`, `P_b` and `P_s` in these two
  modules gets a `ber_claims.py` entry. No exceptions.

Per-module file names, following the established pattern:

| Module | Scenes | Drill | Labs | Notes |
| --- | --- | --- | --- | --- |
| M2 | `83_scenes_m2.js` | `93_drill_m2.js` | `72_labs_m2.js` | `notes/src/c2.js` |
| M3 | `84_scenes_m3.js` | `94_drill_m3.js` | `73_labs_m3.js` | `notes/src/c3.js` |
| M4 | `85_scenes_m4.js` | `95_drill_m4.js` | `74_labs_m4.js` | `notes/src/c4.js` |
| M5 | `86_scenes_m5.js` | `96_drill_m5.js` | `75_labs_m5.js` | `notes/src/c5.js` |
| M6 | `87_scenes_m6.js` | `97_drill_m6.js` | `76_labs_m6.js` | `notes/src/c6.js` |

---

# Phase 7 — Module 0, the editions, and the close

### Task 13: Write Module 0

**Files:**
- Modify: `build/src/81_scenes_m0.js`, `build/src/89_sections.js`

M0 is written last, because a course opening is easier to write once the course exists. It carries
no examinable method and therefore **no question section**.

- [x] **Step 1: Replace the placeholder scene with the opening**

The frame of the course, why digital, and the course map. Radial and orbital compositions are
reserved for exactly this.

- [x] **Step 2: Write the one scene that introduces the anchor convention**

This scene shows the `PS CH` form it describes and is the single exemption in `rule_check.py` and
`seccheck.js`. Everywhere else the form is enforced.

- [x] **Step 3: Run all eleven gates**

- [x] **Step 4: Commit**

---

### Task 14: Render the five editions

**Files:**
- Modify: `notes/editions.js`

- [x] **Step 1: Point `editions.js` at this course's drill data**

- [x] **Step 2: Render**

```bash
cd notes && node editions.js && node ../build/pw.js topdf.js
```

- [x] **Step 3: Sweep every page of every PDF**

```bash
for f in dist/*.pdf; do
  echo "== $f"; pdftotext -layout "$f" - | grep -nE '\$[^$]+\$|\\\\[a-zA-Z]+' | head
done
```

Expected: no output from any file. In the other course this sweep caught a question-type name whose
mathematics was interpolated raw — `$X(j\omega)$` printed on the page and the uppercase frame
turned it into `J\OMEGA`. No gate reads the editions.

- [x] **Step 4: Look at pages**

Render every page to an image and look at it.

- [x] **Step 5: Commit sources and `dist/` together**

---

### Task 15: Write `CLAUDE.md` and close

**Files:**
- Create: `CLAUDE.md`, `README.md`

- [x] **Step 1: Write `CLAUDE.md`**

Following the structure of the source course's: read order, where the project stands, repository
layout, building, the eleven gates with what each must print, the editorial rules, the fixed
decisions, and the known traps. It is what the next session reads.

- [x] **Step 2: Bump `CONTENT.META.version` to 1.0**

In `build/src/80_content_core.js`, which is the one place the version lives in this course — there is no `91_scenes_end.js` here, and the Formula Reference reads the same value.
the same commit.

- [x] **Step 3: Run all eleven gates one final time and record every number**

- [x] **Step 4: Commit**

---

## Notes for the executor

- **Report the numbers a run actually printed.** Never a summary in place of a run.
- **Never run a blanket search-and-replace over `build/src/*.js`.** A backslash means one thing in
  JavaScript and another inside a TeX string, and no pattern separates the two. Edit labels one at
  a time.
- **The build is byte-reproducible.** Building twice from unchanged sources leaves `git status`
  clean. A diff you did not author means something is wrong — find out why before committing.
- **A scene below 0.90 scale is split, not shipped.** `qa.js` prints the list under `dense`.
- **Look at screenshots.** Two of the four bugs found in the other course were invisible to all
  eleven gates and visible at a glance.
