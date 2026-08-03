# Digital Communications — design

Date: 2026-08-02
Status: approved, not yet implemented
Repository: `~/Documents/GitHub/digital-communications`

This document specifies the teaching artifact for this Digital Communications course. It is the
design record; the implementation plan is written separately.

---

## 1. What is being built

Four deliverables, the same set the source course produces:

1. **`dist/Digital_Communications.html`** — one offline-capable file carrying the whole course:
   teaching scenes, laboratories, and a practice-question section in every module.
2. **`dist/Lecture_Notes.pdf`** — the same material as a printed document.
3. **Three derived editions** — student workbook, instructor solutions, formula reference —
   generated from the same sources by `notes/editions.js`.

The design system, the block schema and the editorial rules R1–R9 are inherited from the Signals
and Systems project unchanged. They are not re-derived here. What this document specifies is the
material that is new: the sources, the module structure, the numbering, the laboratories and where
their numerical core comes from, the question sections, and the one kind of verification a
probabilistic course needs and a deterministic one does not.

---

## 2. Sources

Four kinds of source, all under `source/` and none of them redistributable. **`source/` is
gitignored in its entirety**, so a fresh clone does not contain it and the material has to be
copied in before anything can be rebuilt or re-read.

| Source | Extent | Character |
| --- | --- | --- |
| `source/Slides`, chapter 7 | 37 slides | digital text, extractable |
| `source/Slides`, chapter 8 | 48 slides | digital text, extractable |
| `source/Slides`, chapter 9 | 101 slides | digital text, extractable |
| `source/Slides`, chapter 10 | 22 slides | digital text, extractable |
| `source/Lecture Notes.pdf` | 80 pages, 42 MB | handwritten scan, week-by-week |
| `source/Book.pdf` | 924 pages, 15 MB | Proakis and Salehi, *Fundamentals of Communication Systems*, 2nd edition, ISBN 978-0-13-335485-0 |
| `source/Exams/MT - Analysis.pdf` | 1 populated page | midterm question table, three years × four questions |
| `source/Exams/Final - Analysis.pdf` | 1 page | final question table, three years × four questions |

**The slides are the primary source and this is the material difference from the source course.**
There, the only source was an 88-page handwritten scan, and every page had to be rendered at
160 dpi and read by eye before anything could be authored. Here `pdftotext -layout` returns clean
text for all 208 slides, and each slide carries its own topic in the footer. The handwritten notes
are the *second* source: they carry the derivations as they were taught, and they are what a slide
is checked against, not the other way round.

The handwritten notes divide by chapter and by teaching week:

| Chapter | Note pages | Weeks |
| --- | --- | --- |
| CH#7 The transition from analog to digital | 2–12 | 1–3 |
| CH#8 Baseband transmission of digital signals | 13–27 | 4–6 |
| CH#9 Bandpass transmission of digital signals | 28–66 | 7–10 |
| CH#10 An introduction to information theory | 67–80 | 11–14 |

`Book.pdf` is a **cross-check reference only**, never reproduced, quoted or redistributed. It stays
out of git because third-party material must not be redistributed; the handwritten scan stays out
because 42 MB does not belong in git history.

---

## 3. Repository and engine inheritance

The course-agnostic engine is copied from the source course once, at the
start, and evolves independently from that point. Measured against that repository, the engine is
about 2,000 lines and the course content about 15,200 — the engine is twelve percent of the work,
so copying it is cheap and sharing it is not worth the coupling.

Copied unchanged:

```text
build/src/  00_head.html  10_style.css  20_katex.css  30_katex.js
            40_core.js  60_plot.js  90_app.js  99_tail.html
build/      qa.js  labtest.js  textclash.js  mathscan.js  seccheck.js
            labwalk.js  domcheck.js  pw.js
notes/      build.js  topdf.js  editions.js  src/render.js  src/notes.css
tools/      rule_check.py
```

Written from nothing: every scene file, every laboratory, every question section,
`build/src/89_sections.js`, every lecture-note chapter, and the whole of `verify/`.

**No shared library, no monorepo.** Two courses do not justify an abstraction, and a shared engine
would mean every change to one course's rendering is a change to the other's. If a third course is
ever built the question is reopened; until then the engine is copied.

KaTeX stays vendored and font-inlined. No network fetch, ever.

### Colour semantics

The five signal colours of the source course carry over with the meanings adapted:

| Colour | Meaning here |
| --- | --- |
| cyan `#14707F` | transmitted signal, message, source symbol |
| amber `#C08422` | channel, filter, system block |
| green `#4A7A46` | received or detected output |
| violet `#6A5A92` | intermediate quantity — quantized sample, correlator output |
| red `#A63B2A` | error: a wrong decision, intersymbol interference, an aliased component |

**Noise takes no colour of its own.** A sixth hue would make the palette unreadable, and noise is
almost always drawn behind something else. It is drawn in the hairline tone at low opacity, and the
symbol points inside a noise cloud keep their own colour. Decision regions are drawn as a
low-opacity fill of the colour of the symbol they decide for.

---

## 4. Module structure

Seven modules. The course has four chapters, but CH9 is half of the course by every measure, so it
is split into three.

| Module | Content | Slide range | Textbook anchor |
| --- | --- | --- | --- |
| M0 | The frame of the course; why digital | CH7 s.1–8 | `PS CH7` |
| M1 | Sampling, quantization, PCM | CH7 | `PS CH7.3–7.4` |
| M2 | Baseband transmission: matched filter, decision, `P_e` | CH8 | `PS CH8.2–8.3` |
| M3 | Geometric representation of signal waveforms | CH9 s.3–21 | `PS CH8.1` |
| M4 | Optimal receiver in AWGN, decision regions, union bound | CH9 s.23–65 | `PS CH8.4` |
| M5 | Digital modulation methods: PAM, PSK, QAM, FSK | CH9 s.66–101 | `PS CH8.5–8.7, CH9.5` |
| M6 | Information theory: entropy, Huffman coding, capacity | CH10 | `PS CH12` |

### Why CH9 is split, and where

Three independent measurements agree that CH9 is half the course: 101 of 208 slides, 39 of 80
handwritten pages, and weeks 7 through 10 of fourteen. Leaving it as one module would give one
module more weight than the other three chapters together.

The split lines are not invented. The slide footers name six sections inside CH9:

```text
s.  3– 21   Geometric Representation of Signal Waveforms    (19)
s. 23– 46   Optimal Receiver Structure in AWGN Channels     (24)
s. 47– 55   Graphical Interpretation of Decision Regions    ( 9)
s. 56– 57   General Expression for P_e                      ( 2)
s. 58– 65   Union Bound                                     ( 8)
s. 66–101   Digital Modulation Methods                      (36)
```

M3 takes the first, M4 takes the next four, M5 takes the last. That gives 19 / 43 / 36 slides and
splits no named section. M4 is the largest of the three because the four sections it holds are one
argument: the receiver structure produces the decision regions, the decision regions produce the
general error expression, and the union bound is how that expression is made usable. Cutting it in
the middle would leave a module that states a result it cannot reach and a module that reaches a
result it never stated.

---

## 5. Numbering and textbook anchoring

The mechanism is the one already built for the source course: a three-level hierarchy of chapter,
section and scene; every address declared once in `build/src/89_sections.js` and derived onto the
scenes at load time; no scene file carrying an address of its own. A renumbering is an edit to one
file.

**The textbook anchor is mandatory here, not decorative.** The course numbering and the textbook
numbering collide:

| Course chapter | Textbook chapter | Relation |
| --- | --- | --- |
| CH7 The transition from analog to digital | Ch 7 Analog-to-Digital Conversion | matches |
| CH8 Baseband transmission | Ch 8.2–8.3 | part of one chapter |
| CH9 Bandpass transmission | Ch 8.1, Ch 8.4–8.7 and Ch 9.5 | spans two |
| CH10 An introduction to information theory | **Ch 12** | does not match |

The last row is the dangerous one. The textbook *has* a chapter 10, and it is about digital
transmission through bandlimited AWGN channels, not about information theory. A student who reads
"CH10" and opens the tenth chapter of the book lands somewhere unrelated. The anchor is what
prevents that, so it is a correctness feature rather than a convenience.

On screen the anchor is a chip: an open book drawn as inline SVG, then `PS CH12.3`. In the printed
notes, which have no icon, it is `PS CH12.3` in full. The `PS` marker — for Proakis and Salehi — is
what tells the two numbering systems apart, and it is checked mechanically: `rule_check.py` fails on
a `CH` reference without `PS` in front of it, and `seccheck.js` fails on a `CH` reference outside
the chip or on a chip that has lost its icon. The single exemption is the sentence in M0 that
introduces the convention, which has to show the form it describes.

A laboratory takes `n.L1`, `n.L2`; the two question sections of a chapter take `n.Q1` and `n.Q2`.

---

## 6. Laboratories

Ten laboratories, following the A–J pattern already established.

| | Laboratory | Module | What the reader drives |
| --- | --- | --- | --- |
| A | Quantization and SQNR | M1 | level count, step size, input amplitude |
| B | PCM, DPCM and delta modulation | M1 | method, step size, source bandwidth |
| C | The matched filter | M2 | pulse shape, noise level, sampling instant |
| D | Decision threshold and error probability | M2 | threshold, priors, noise variance |
| E | The eye diagram and intersymbol interference | M2 | roll-off, timing offset, channel |
| F | Gram-Schmidt: from waveform to basis | M3 | the waveform set |
| G | Constellations and decision regions | M4 | scheme, `E_s/N_0`, symbol count |
| H | Error probability against signal-to-noise ratio | M5 | scheme, closed form against simulation |
| I | Entropy and the Huffman tree | M6 | source distribution |
| J | Channel capacity | M6 | channel model, crossover probability, bandwidth |

Laboratory H is the one that draws a simulated curve beside a closed-form one. It uses a fixed seed
so the figure is the same on every render, which is also what makes it measurable by the gates.

---

## 7. Simulation code: `commsyslab`

`github.com/huguryildiz/commsyslab`, cloned at `~/Documents/GitHub/commsyslab`, is the author's own
public React and TypeScript project covering the same material as interactive browser simulations.
Under `src/lib/dsp/` it carries about 9,750 lines of **pure, framework-free** numerical code, with a
test suite beside it in `tests/`. That code is a source for the laboratories here.

The correspondence is close, because the two projects teach the same course:

| `commsyslab/src/lib/dsp/` | Used by |
| --- | --- |
| `gram-schmidt.ts` | M3, laboratory F |
| `multidim.ts` | M4, M5 |
| `eye.ts` | laboratory E |
| `probability.ts`, `math.ts` | the `Q` function and the tail bounds, everywhere |
| `random.ts` (`makeRng`) | every seeded figure |
| `awgn.ts` | every noise figure |
| `entropy.ts` | M6, laboratory I |
| `dpcm.ts`, `sigmadelta.ts` | M1, laboratory B |
| `linecode.ts` | M2 |
| `modulation.ts`, `dpsk.ts` | M5, laboratory H |

Two conventions already agree with what §10 fixes, which is why the reuse is worth having:
`qfunc(x) = ½ erfc(x/√2)` is exactly the `Q` this course defines, and `makeRng` is a deterministic
mulberry32 generator, so a seeded figure renders identically on every machine.

**How it is used.** The numerical core of a laboratory is ported — TypeScript to vanilla JavaScript,
type annotations dropped, React untouched. It is **not** a dependency: the artifact stays one
offline-capable file with no npm install and no network fetch, so nothing is imported, only copied
and adapted. The repository has no LICENSE file, but the code is the author's own, so there is no
restriction on reuse.

**Two constraints, and both matter.**

1. **`verify_ber.py` may not be derived from this code.** If the artifact and the gate that checks
   it come from one implementation, the gate verifies itself and a shared error passes silently. The
   Monte Carlo simulation is written independently in Python against scipy, without reading the
   TypeScript. Where `commsyslab` has a test for the same quantity, it serves as a *third* opinion:
   two independent implementations and one existing test agreeing on a number is strong evidence;
   one implementation agreeing with itself is none.

2. **Equation references may not be carried across.** The comments in `commsyslab` anchor to
   Proakis and Salehi, but not everywhere to *this* edition. A verified example: `gram-schmidt.ts`
   is headed "Proakis & Salehi §7.1, Eq. 7.1.1–7.1.11", while in `source/Book.pdf` §7.1 is
   "Sampling of Signals and Signal Reconstruction from Samples" and Gram-Schmidt is **§8.1**. That
   comment belongs to the authors' other book, *Communication Systems Engineering*. By contrast the
   "§5.1" heading `probability.ts` carries is correct for this edition. Every equation reference
   that comes across with ported code is re-checked against `source/Book.pdf` and none is accepted
   on the strength of having been written down already. This is precisely the class of error the
   `PS` anchor of §5 exists to prevent, arriving through a different door.

**What was actually done.** No numerical core was ported. Every laboratory was written from the
textbook, and the correspondence in the table above is one of subject and not of code — the two
projects teach the same course, so they compute the same quantities by different routes. The first
code genuinely taken from `commsyslab` is the transport of the 2026-08-03 design: the fixed-step
`requestAnimationFrame` accumulator of `src/lib/sim/useSimulationLoop.ts` and the play / step /
reset semantics of `src/components/TransportControls.tsx`, with React, the speed control and the
tick callback dropped.

---

## 8. Question sections

**Twenty questions a module, 140 in all.** Each of M1 to M6 opens with a taxonomy of the question
types that keep coming back and closes with twenty open-ended questions modelled on them, each
with a worked solution hidden until the reader asks for it. One question fills the screen; the
reader moves with a pager. M0 has no question section — it carries no examinable method.

**No student-facing string calls them an examination.** The sections read *question types* and
*practice questions*.

Of the twenty, **twelve are single-skill questions** with two or three parts and **eight are
full-length**, carrying one statement and three to four lettered parts in the form the papers use.
This is a higher proportion of full-length questions than the source course uses,
and the reason is that this course's papers are built differently: four questions of 25 points each,
every one of them already carrying lettered parts. A mostly-single-skill drill would misrepresent
what the reader is preparing for.

### Where the taxonomies come from

The two exam tables give three years of four questions each, twenty-four questions resolving to
eight recurring types:

| Type | Skill | Module |
| --- | --- | --- |
| MT Q1 | sampling rate, quantizer resolution, bit rate, symbol rate | M1 |
| MT Q2 | source PDF, quantizer, signal and noise power, SQNR | M1 |
| MT Q3 | matched filter, conditional PDFs, optimal threshold, `P_e` | M2 |
| MT Q4 | binary decision under a given non-Gaussian noise PDF | M2 |
| Final Q1 | Nyquist sampling with uniform quantization, SQNR in dB | M1 |
| Final Q2 | PAM with unequal priors, optimal threshold, `P_b` numerically | M2 |
| Final Q3 | M-ary constellation, decision regions, nearest-neighbour SEP | M4, M5 |
| Final Q4 | discrete memoryless source, entropy, Huffman code, efficiency | M6 |

The tables are better than raw papers: the rows already *are* the taxonomy, and reading across a
row shows how a type varies between years — same skeleton, different numbers. Two midterm rows
carry a further provenance note, `Madhow 6.11` and `Madhow 6.13`.

**M3 has no exam type at all, and M4 and M5 share one.** CH9 is half the course and an eighth of
the exam representation. The taxonomies for those three modules are therefore derived from the
worked examples in the slides and from the derivations in the handwritten notes, not from the
papers. This is stated here rather than discovered later, and it is the one place where the
question sections rest on a weaker source than the rest.

### The rule on numbers

A question may keep the shape of the paper question it comes from — the same number of parts, in
the same order, asking the same things. It may not keep a single one of its numbers. Every
amplitude, frequency, level count, variance, prior probability, alphabet and probability mass is
new.

**A replacement number must leave the character of the answer intact.** A quantizer that was
mid-tread stays mid-tread; a constellation whose nearest-neighbour count differs from its symbol
count keeps that property; a source whose Huffman code is not unique keeps that ambiguity if the
question exists to show it. Replacing `P(X=1)=1/2` by `1/3` in a Huffman question can silently turn
a tie-break into a non-tie and change what the question teaches.

A question's `src` field names the paper question it is built on and renders in the instructor
edition only.

---

## 9. Verification gates

Eleven gates. Nothing is done until all eleven pass, and a run reports the numbers it printed.

Eight are inherited and unchanged in kind: `qa.js` for layout, `labtest.js` for interaction,
`textclash.js` for label collisions, `mathscan.js` for mathematics in the artifact,
`notes/mathscan.js` for mathematics in the notes, `labwalk.js` for every laboratory state in both
themes, `seccheck.js` for the addressing and the `PS` marker, and `rule_check.py` for the banned
phrases and the figure-label rules — the last extended with the `PS`-without-marker check described
in §5. `node --check` runs before all of them and is not itself a gate.

The `verify/` suite is the part that is rewritten, because the mathematics of this course is
probabilistic:

| File | What it checks |
| --- | --- |
| `verify_scenes.py` | every numerical result stated in a teaching scene, re-derived |
| `verify_drills.py` | every number in a `Check` step of the 140 worked solutions |
| `verify_ber.py` | **every closed-form error-probability expression against Monte Carlo** |

The third is new as a *kind* of check, though the gate count stays at eleven: the Signals and
Systems project splits its scene verification across two files by module range, and here it starts
as one file and is split the same way when it outgrows a single file. A statement like
`P_b = Q(√(2E_b/N_0))` cannot be *proved* by re-deriving it symbolically — re-deriving it is how
the error would be reproduced. It is checked by simulating the channel and the detector and asking
whether the measured error rate is consistent with the claimed expression.

The gate is deterministic despite being a simulation: the seed is fixed, the trial count is fixed
per claim, and the failure criterion is that the closed-form value falls outside the Wilson score
interval of the simulated error count. A claim that is right passes on every machine; a claim with
a factor-of-two slip in an exponent or a missing `√2` fails on every machine. Trial counts are
sized so that the interval is tight enough to catch such a slip at the lowest signal-to-noise ratio
each claim is stated at.

`verify_ber.py` also covers laboratory H, which draws the same comparison for the reader.

The `.venv` is a local arm64 virtualenv with numpy, scipy and sympy — scipy is new relative to the
source course and is what supplies `erfc`, the Gaussian tail and the Wilson interval.

---

## 10. Editorial rules

R1 through R9 are inherited verbatim and are binding on every deliverable: write as lecture notes
and not as a report about them; never mention a source, a page, an audit or a process; plain
academic English for a second-year undergraduate; plain wording never bought at the cost of
correctness; fixed conventions stated where first needed; every piece of mathematics in a figure
written as typeset LaTeX with no Unicode substitutes; every text field passed through `md()`; and
all of it checked mechanically.

Two conventions are fixed for this course specifically, and each is stated once where it is first
needed:

- Noise is white and Gaussian with **two-sided** power spectral density `N_0/2` unless a scene says
  otherwise. Mixing the one-sided and two-sided conventions is the single most common source of a
  factor-of-two error in this material, and `verify_ber.py` is what catches it.
- `Q(x)` is the Gaussian tail, `Q(x) = (1/√(2π)) ∫_x^∞ e^{-t²/2} dt`. The complementary error
  function is used only where a result is more compactly written with it, and the relation is given
  at that point.

---

## 11. Build order

1. **Skeleton.** Repository, engine copy, `.gitignore`, one placeholder scene, all eleven gates
   running and green on nothing. Establishes that the copied engine works before any content
   depends on it.
2. **M1 complete.** Scenes, laboratories A and B, taxonomy, twenty questions, the lecture-note
   chapter, every gate, and a rendered PDF. This module costs about three times what the later ones
   will, because the conventions, the figure vocabulary and the question format are all decided
   inside it.
3. **M2 through M6**, each in the same shape.
4. **M0**, written last, because a course opening is easier to write once the course exists.
5. **The five editions**, `CLAUDE.md`, and a final sweep: `pdftotext -layout` over every page of
   every PDF, failing on a `$...$` pair or a bare TeX macro reaching the page.

Measured against the source course, which reached this state in five active days and
59 commits: the source reading here is cheaper because the slides are digital, the question count
is a third lower, and one new gate has to be written. The scale is comparable.

---

## 12. Known risks

- **M3 to M5 rest on a weaker source for their question taxonomies** (§8). The mitigation is to
  derive them from the worked examples in the slides and to state in the design record that they
  are so derived — not to pretend the papers cover CH9.
- **The `PS` anchor map is one-to-many** for M2 and M5, and one course chapter maps to two textbook
  chapters. The anchor field must accept a range and a list, which the source course
  implementation already does.
- **`verify_ber.py` can be made to pass by loosening it.** A trial count too low, or an interval
  too wide, turns the gate green without checking anything. The trial count per claim is chosen
  from the required interval width and recorded beside the claim, so a later loosening is visible
  in the diff.
- **Ported `commsyslab` code can smuggle in a wrong equation reference** (§7). One such reference
  is already confirmed: `gram-schmidt.ts` cites §7.1 for a result that is §8.1 in this edition. The
  mitigation is mechanical — every anchor that arrives with ported code is looked up in
  `source/Book.pdf` before it reaches a scene, and `rule_check.py` cannot catch this because a
  wrong `PS` anchor is well-formed.
- **The handwritten notes and the slides may disagree.** Where they do, the disagreement is
  recorded in the ambiguity ledger and resolved against `Book.pdf`, and the resolution is stated in
  the artifact at the point it occurs. Nothing is corrected silently.
