# EE 413 Digital Communications — working notes

## Read this first, in this order

1. This file.
2. `docs/superpowers/plans/2026-08-02-digital-communications.md` — the plan. Its `- [ ]` checkboxes
   are the state of the work. `/uret` finds the first unchecked step, does it, ticks it and commits.
3. `docs/superpowers/specs/2026-08-02-digital-communications-design.md` — the design record. The
   plan's section references point into it.

## Who this is for

**Second-year undergraduates taking EE 413.** This is the constraint that decides every writing
question, and it outranks completeness, elegance and rigour-for-its-own-sake.

- **Plain first, formal second.** Every scene says what is going on in ordinary words before it says
  it in symbols, and again afterwards if the symbols were heavy. A reader who stops at the prose
  should still have learnt something true.
- **A worked example beats a general theorem.** Where the two compete, the example wins and the
  theorem goes in a note beside it.
- **No material the course does not need.** The syllabus is the four chapters of the lecture
  material. Where a gap has to be filled, `source/Book.pdf` is the authority — but fill it at the
  level the rest of the course is written at, not at the level the book is written at.
- **Name the mistake.** Every worked example carries the error a student actually makes, said
  plainly. That is worth more than another example.
- **One idea a scene.** A scene that needs a scale factor below 0.90 to fit is a scene carrying two
  ideas. `qa.js` prints those under `dense`; split them.

## How every note is written

**Every note in this repository is written clean and plain, at the level an undergraduate can
follow.** This binds the exposition, not only the sentences: one idea a paragraph, the steps of a
derivation in order with none of them left for the reader to supply, and no aside that the result
does not need. A passage that only a reader who already knows the material can follow has failed
this rule, however correct it is.

**The English is simple English.** The reader is an engineering student who may be reading in a
second language, so the vocabulary stays common and the grammar stays direct: everyday words, active
voice, subject and verb close together, no idiom and no figure of speech. The only hard words on the
page are the technical ones, and each of those is defined where it first appears. Difficulty belongs
to the mathematics, never to the English carrying it.

**A note teaches; it does not record.** Say what the idea is for before developing it, and name the
move each step makes — "take the transform of both sides", "split the integral at the point where
the pulse ends" — so the reader learns a method and not one result. Where a step is the one students
get wrong, say so and say why. Where a definition looks arbitrary, show the case it was made to
handle.

**The worked solutions are held to the same standard.** A solution is teaching material, not an
answer key: it carries the reasoning that reaches the answer, in the Given, Find, Method, Solution,
Check form of R7, and it states why the method fits this question. A solution that only shows the
arithmetic, or that arrives at the answer by a step the reader cannot see the reason for, is
unfinished. This covers the worked solution behind every practice question in the artifact, the
worked examples in the lecture notes, and the instructor solutions.

## Follow the lecturer's own exposition

`source/Lecture Notes.pdf` is where this course is already explained well, and that explanation is
the model for every page of this artifact. **Keep it throughout — the same voice from the first
scene to the last.** Concretely:

- **Take the order of ideas from the handwritten pages**, not from the slides and not from the book.
  Where the notes set something up before using it, set it up in the same place.
- **Keep the lecturer's phrasing for a definition or a warning** where it is already plain. Rewrite
  only what the page leaves implicit because it was said aloud.
- **The image-only worked examples live only in those pages.** Several slides show an example as a
  picture with no extractable text; the handwritten version is the one that can be read, and it is
  the authority for that example.
- **One voice.** A reader must not be able to tell which module was written when. Where an earlier
  module drifts from this, it is fixed rather than left.

## Where the project stands

**Version 1.0. Complete.** All eleven gates green, four PDFs rendered and swept.

| Phase | Content | State |
| --- | --- | --- |
| 0 | Engine, gates, `verify/` | done |
| 1 | M1 · Sampling, quantization, PCM · labs A, B · 20 questions · notes ch. 1 | done |
| 2 | M2 · Baseband transmission · labs C, D, E · 20 questions · notes ch. 2 | done |
| 3 | M3 · Geometric representation · lab F · 20 questions · notes ch. 3 | done |
| 4 | M4 · Optimal receiver, decision regions, union bound · lab G · 20 questions · notes ch. 4 | done |
| 5 | M5 · Modulation methods · lab H · 20 questions · notes ch. 5 | done |
| 6 | M6 · Information theory · labs I, J · 20 questions · notes ch. 6 | done |
| 7 | M0, appendix A, the three editions, the close | done |

What a run printed on the last full sweep:

| Gate | Printed |
| --- | --- |
| `qa.js` | 109 scenes, 0 errors, 0 overflow, nothing dense |
| `labtest.js` | laboratories A–J, 120 questions, 120 solutions, 342 parts, ERRORS: none |
| `textclash.js` | TOTAL COLLISIONS: 0 (88 flagged, 86 accepted haloed tick labels) |
| `mathscan.js` | SCENES WITH MATH DAMAGE: 0 / 109 |
| `notes/mathscan.js` | LITERAL MATH IN NOTES: 0, KATEX ERRORS: 0 |
| `labwalk.js` | 396 states walked, PROBLEMS: none |
| `seccheck.js` | 109 scenes, 108 addressed, 90 anchored, PROBLEMS: none |
| `verify_scenes.py` | 68 passed, 0 failed |
| `verify_drills.py` | 276 passed, 0 failed |
| `verify_ber.py` | 12 passed, 0 failed |
| `rule_check.py` | TOTAL VIOLATIONS: 0 |

Two scenes carry no textbook anchor on purpose (`m1-linecodes`, `m2-eye`), and the cover
carries no address, which is why 108 of 109 are addressed.

**What the plan promised and what was delivered.** The plan's goal line says 140 practice
questions. Its own allocation is twenty to each of six modules, and Task 13 states that Module 0
carries no question section, so the number is 120. Everything else in the goal was delivered as
written.

## Repository layout

| Path | Responsibility |
| --- | --- |
| `build/build.js` | concatenates `build/src/*` into `dist/Digital_Communications.html` |
| `build/src/00…60`, `90_app.js` | the engine, copied from `signals-and-systems`, not redesigned |
| `build/src/80_content_core.js` | `CONTENT.META`, the module list, the glossary, the `PS` mark |
| `build/src/89_sections.js` | **the one place** chapters, sections, addresses and anchors are declared |
| `build/src/8N_scenes_mM.js` | teaching scenes, one file per module |
| `build/src/70_labs.js` + `7N_labs_mM.js` | the laboratory kit and the laboratories |
| `build/src/9N_drill_mM.js` | question sections, one file per module |
| `build/src/99_tail.html` | **scene order** — an array not registered here never appears |
| `notes/build.js` `topdf.js` `editions.js` `src/cN.js` | the lecture-notes pipeline |
| `verify/*.py` | the numerical gates |
| `tools/rule_check.py` | banned phrases, figure-label rules, the `PS` mark |
| `.claude/notes/mN_inventory.md` | per-module source inventory and ambiguity ledger (gitignored) |

## Building

```bash
cd build  && node build.js          # the artifact
cd notes  && node build.js          # the lecture notes HTML
cd build  && node pw.js ../notes/topdf.js   # every edition to PDF
```

Python is the arm64 venv at `.venv/`. Never the x86_64 anaconda `python3`.
`source/` is gitignored and must be present locally before anything can be built or checked.

## The eleven gates, and what each must print

```bash
node --check build/src/7*.js build/src/8*.js build/src/9*.js   # not a gate; runs first
cd build && node pw.js qa.js                 # 0 errors, 0 overflow, nothing under `dense`
cd build && node pw.js labtest.js            # ERRORS: none, options=0
cd build && node pw.js textclash.js          # TOTAL COLLISIONS: 0
cd build && node pw.js mathscan.js           # SCENES WITH MATH DAMAGE: 0 / N
cd build && node pw.js ../notes/mathscan.js  # LITERAL MATH IN NOTES: 0, KATEX ERRORS: 0
cd build && node pw.js labwalk.js            # PROBLEMS: none
cd build && node pw.js seccheck.js           # PROBLEMS: none
cd verify && ../.venv/bin/python verify_scenes.py   # N passed, 0 failed
cd verify && ../.venv/bin/python verify_drills.py   # N passed, 0 failed
cd verify && ../.venv/bin/python verify_ber.py      # N passed, 0 failed
.venv/bin/python tools/rule_check.py "build/src/8[1-9]_scenes*.js" \
  "build/src/9[2-8]_drill_m*.js" "build/src/91_*.js" "build/src/70_labs.js" \
  "build/src/7[1-9]_labs*.js" "notes/src/*.js"       # TOTAL VIOLATIONS: 0
```

Report the numbers a run actually printed. Never a summary in place of a run.
And after the PDFs are built, sweep them — no gate reads a rendering:

```bash
pdftotext -layout dist/Lecture_Notes.pdf - | grep -nE '\$[^$]+\$|\\\\[a-zA-Z]+'   # no output
cd build && node pw.js shot.js                                                    # then look
```

## Editorial rules

R1–R9 are inherited from the source course and are binding on every student-facing string.
The ones that get broken:

- **Never name a source, a page, an audit or a process.** "The source" as the origin of information
  is fine — `rule_check.py` was narrowed for exactly that — but the material this was written from
  is never mentioned.
- **Every piece of mathematics in a figure is typeset LaTeX**, with `tex:true`, on one line. A
  `note()` or a `blocks()` label split across two lines reads as untyped text to the gate.
- **An `eq` block's `label` is uppercased by the style sheet.** Greek letters and TeX macros must not
  go in it; put them in the equation or write the name in ASCII.
- **Every text field passes through `md()`,** so mathematics in running text needs `$…$`. A legend
  item and an `eq` note are running text.

## Decisions that are fixed

- `Q(x)` is the Gaussian tail, `Q(x) = ½ erfc(x/√2)`. Noise is white and Gaussian with **two-sided**
  PSD `N₀/2` unless a scene says otherwise. Mixing the conventions is a silent 3 dB.
- `sinc(x) = sin(πx)/(πx)`.
- Colour: cyan is the transmitted signal or source symbol, amber the channel or filter, green the
  received or detected output, violet an intermediate quantity, red an error. **Noise takes no
  colour** — it is the hairline tone at low opacity. A decision region is a low-opacity fill of the
  colour of the symbol it decides for.
- Twenty questions a module, twelve single-skill and eight full-length, `options=0` throughout.
  A question may keep the shape of a paper question and **no** number from it.
- `verify_ber.py` is written independently of `commsyslab`. Porting the artifact's simulation into
  the gate makes the gate verify itself.
- Commit sources and any rebuilt `dist/` file together, never in separate commits.

## Traps, all of them met at least once

- **A textbook anchor is looked up in `source/Book.pdf` before it is written.** A wrong `PS` anchor
  is well formed, so no gate can catch it. Where an anchor cannot be verified, write none — the
  line-code scene of M1 and the eye-pattern scene of M2 carry none for that reason.
- **The book's chapter numbers and this course's do not agree.** M2 spans the book's chapters 8 and
  10; M6 is the book's chapter 12, not its chapter 10.
- **A figure built at load time keeps the palette it was born with.** Pass a function to `fig.svg`
  and `raw.html`, never a string built at module scope.
- **`textclash.js` classifies by colour.** A palette change that skips it leaves it measuring
  nothing while still reporting green.
- **Never run a blanket search-and-replace over `build/src/*.js`.** A backslash means one thing in
  JavaScript and another inside a TeX string.
- **The build is byte-reproducible.** Building twice from unchanged sources leaves `git status`
  clean. A diff nobody authored means something is wrong.
- **Look at screenshots.** Two of the four bugs found in the source course were invisible to all
  eleven gates and visible at a glance.
