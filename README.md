<!-- markdownlint-disable MD033 -->
<!-- Inline HTML is intentional: centered hero header and badge row. -->

<p align="center">
  <img src="assets/icon.svg" alt="Digital Communications logo" width="120" height="120">
</p>

<h1 align="center">Digital Communications</h1>

<p align="center">
  <strong>Interactive Lecture Artifact, Laboratories and Lecture Notes</strong><br>
  <sub>A single offline HTML file for an undergraduate digital communications course. Step through a scene and watch the error probability build itself.</sub>
</p>

<p align="center">
  <a href="https://digital-communications.vercel.app"><img src="https://img.shields.io/badge/digital--communications.vercel.app-04050F?style=for-the-badge&logo=vercel&logoColor=39FF85" alt="The public page"></a>
  &nbsp;
  <a href="dist/Digital_Communications.html"><img src="https://img.shields.io/badge/Digital__Communications.html-12314E?style=for-the-badge&logo=html5&logoColor=FAF8F4" alt="The interactive artifact"></a>
  &nbsp;
  <img src="https://img.shields.io/badge/Offline%20%C2%B7%20one%20file-12314E?style=for-the-badge&logoColor=white" alt="Offline, one file">
  <img src="https://img.shields.io/badge/KaTeX%20vendored-12314E?style=for-the-badge&logo=latex&logoColor=white" alt="KaTeX">
  <img src="https://img.shields.io/badge/Playwright-12314E?style=for-the-badge&logo=playwright&logoColor=45BA4B" alt="Playwright">
  <img src="https://img.shields.io/badge/NumPy%20%C2%B7%20SciPy%20%C2%B7%20SymPy-12314E?style=for-the-badge&logo=python&logoColor=FFD343" alt="NumPy, SciPy and SymPy">
  <img src="https://img.shields.io/badge/v1.0%20%C2%B7%20Modules%200--6-12314E?style=for-the-badge" alt="Version v1.0">
</p>

---

## Overview

**Digital Communications** is a lecture artifact that turns a handwritten digital-communications course
into a stepped, self-explaining document. It covers the whole course — sampling, quantization and PCM;
baseband transmission, the matched filter and intersymbol interference; the geometric representation of
signals; the optimal receiver in additive white Gaussian noise, decision regions and the union bound;
PSK, PAM, QAM and FSK; and an introduction to information theory — in 109 scenes that advance one idea
at a time.

Everything runs from one HTML file. No install, no sign-in, no server, no network request at any point.
Progress is stored on the reader's own device and nowhere else. Beside the artifact sit four A4
documents built from the same content, and a public page that hands out the ones students get.

It is written for **second-year undergraduates**, and that constraint decides every writing question:
plain first and formal second, a worked example before a general theorem, and nothing the course does
not need. The artifact is teaching material rather than a report about teaching material — nothing in
the student view mentions how it was produced.

---

## Why this artifact

A digital communications course is hard to follow from a static page because every result is the end of
a chain, and the chain is where the meaning is. Why a quantizer costs 6 dB a bit. Why the matched
filter is the best linear thing that can be done to a pulse. Why an error probability is almost always
one `Q` of a distance. This artifact makes that chain the interface.

- **One step, one idea.** A scene reveals its parts in order, so a derivation is read rather than decoded.
- **Every figure is drawn, not pasted.** Constellations, eye diagrams, decision regions and block diagrams are generated per render.
- **Ten laboratories.** Every control changes the mathematics and not the drawing: the numbers beside a figure are computed from the definitions at the moment the control moves.
- **Every number is checked twice.** 356 results are recomputed by a separate program that reaches each one by a different route.
- **Every label is checked.** A sweep proves that nothing written inside a figure is crossed by anything drawn in it.
- **Name the mistake.** Every worked example carries the error a student actually makes, said plainly.
- **One voice.** A reader cannot tell which module was written first.

---

## Modules

Seven modules, 109 scenes. A module's count includes its two question sections: the map of question
types that opens it and the twenty practice questions that close it. Module 0 has neither, because
nothing in it is examinable and everything in it is needed to read the rest.

| #   | Module                                    | Scenes | What it covers                                                                                                                                                                          |
| --- | ----------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **The Frame of the Course**               | 5      | What the whole subject asks, the transmitter–channel–receiver chain, why digits are sent at all and what regeneration costs, the map of the six modules, how to use the artifact           |
| 1   | **Sampling, Quantization and PCM**        | 25     | The sampling theorem and aliasing, reconstruction, uniform and non-uniform quantization, the signal-to-quantization-noise ratio and the 6 dB rule, companding, PCM, DPCM, delta modulation, line codes |
| 2   | **Baseband Transmission**                 | 21     | The transmitted pulse, the matched filter and why it maximises signal-to-noise ratio, the threshold and its error probability, intersymbol interference, the Nyquist criterion, raised-cosine shaping, the eye diagram |
| 3   | **Geometric Representation of Signals**   | 12     | Gram–Schmidt, orthonormal bases, a waveform as a point, energy as squared length, the noise projection, and why distance is the only thing that matters                                    |
| 4   | **The Optimal Receiver in AWGN**          | 17     | The correlation and matched-filter receivers, the maximum-likelihood decision rule, decision regions, pairwise error probability, the union bound and when it is tight                     |
| 5   | **Digital Modulation Methods**            | 14     | Binary and M-ary PSK, PAM, QAM and FSK, their constellations, their minimum distances, their error probabilities, and bandwidth against energy                                             |
| 6   | **An Introduction to Information Theory** | 15     | Self-information and entropy, source coding, the Huffman code, mutual information, channel capacity and the Shannon limit                                                                  |

### Laboratories

Ten laboratories, A to J. Each one is a live figure with controls: nothing is precomputed and nothing
is a video.

| Lab   | In module | What it does                                                                          |
| ----- | --------- | -------------------------------------------------------------------------------------- |
| **A** | 1         | Quantization and SQNR — levels against error power, and the 6 dB a bit                  |
| **B** | 1         | PCM, DPCM and delta modulation — the same signal through three coders                   |
| **C** | 2         | The matched filter — the pulse, the filter and the sampled output                       |
| **D** | 2         | Threshold and error probability — move the threshold, watch the two tails               |
| **E** | 2         | The eye diagram — pulse shaping, roll-off and the opening that survives                 |
| **F** | 3         | From waveform to basis — Gram–Schmidt run one vector at a time                          |
| **G** | 4         | Constellations and decision regions — the regions redrawn as the constellation moves    |
| **H** | 5         | Error probability against signal-to-noise ratio — every scheme on one axis               |
| **I** | 6         | Entropy of a source — the distribution against the bits it needs                        |
| **J** | 6         | Building a Huffman code — the tree assembled merge by merge                             |

### Question banks

Twenty questions in each of Modules 1 to 6, 120 in all, in 342 parts: twelve single-skill questions and
eight full-length ones a module. **Every question is open-ended** — there are no multiple-choice options
anywhere in the artifact. Each carries a worked solution in Given · Find · Method · Solution · Check
form that says why the method fits the question and names the mistake a student actually makes. A
question may keep the shape of a past paper question and no number from it.

---

## Concept Chain

Each module is a link in one argument, and the argument has one sentence at the end of it: **errors are
decided by the distance between the signal points, and by almost nothing else.**

```text
analog signal → symbols → waveforms → points → decision → error probability → limit
      │            │           │          │         │             │              │
  Module 1     Module 1    Module 2   Module 3   Module 4     Modules 4-5    Module 6
  sample,      quantize,   matched    energy as  regions,     Q of a         entropy,
  reconstruct  code        filter,    length,    maximum      distance,      capacity,
               PCM         ISI, eye   distance   likelihood   union bound    Shannon
```

---

## The public page

`site/` is a landing page in front of the course, deployed at
**[digital-communications.vercel.app](https://digital-communications.vercel.app)**. It is not part of
the artifact and no gate reads it; a change there is checked by looking at it.

Two things on it move, and both are instruments rather than ornament.

- **The hero mesh** (`site/grid.js`) is Paul Bakaus's [Kinetic Grid](https://radiant-shaders.com/shader/kinetic-grid)
  from [Radiant Shaders](https://github.com/pbakaus/radiant), MIT, with the tension ramp recoloured to
  the mark — green and blue where the wave passes, amber only where energy enters, which is the colour
  this course gives a channel. Its physics models nothing in the syllabus and does not pretend to.
- **The instrument** (`site/scope.js`) is the laboratory oscilloscope with the framework taken out. One
  slowly drifting `Eb/N0` sets the noise drawn on the trace, the reading in the corner, and the error
  probability `Q(√(2 Eb/N0))` beside it, so the picture and the number are one statement and cannot
  drift apart. The bits in the corner are the bits the trace is drawing.

Both stop when the tab is hidden or the canvas scrolls out of view, and both settle to one still frame
under `prefers-reduced-motion`.

`.vercelignore` replaces `.gitignore` for the upload rather than adding to it, so anything that must
stay off the host is named there even when git already ignores it. `dist/Instructor_Solutions.*` is the
one that matters.

---

## Architecture

| Layer            | Stack                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Artifact         | One self-contained HTML file · no runtime dependency · no network request                          |
| Stage            | Fixed 1920×1080 · `fitScene()` scales an oversized scene down to a floor of 0.90                   |
| Math typesetting | KaTeX, vendored and font-inlined in `20_katex.css` / `30_katex.js`                                  |
| Figures          | Custom SVG primitives in `60_plot.js` — axes, curves, stems, constellations, blocks, TeX labels     |
| Content          | Plain JavaScript data: scenes, blocks, laboratories, questions                                      |
| Sections         | `89_sections.js` — the one place chapters, addresses and textbook anchors are declared              |
| Mark             | `assets/icon.svg` — the only copy; the artifact and all four documents inline it                    |
| State            | `localStorage` on the reader's device only                                                          |
| Build            | Node · `build/build.js` concatenates `build/src/*` · byte-reproducible                              |
| Notes            | `notes/build.js` → HTML · `notes/editions.js` → four editions · `notes/topdf.js` → A4 PDFs           |
| Gates            | Playwright (`qa` · `labtest` · `textclash` · `mathscan` · `labwalk` · `seccheck`) · Python (NumPy · SciPy · SymPy) · `rule_check` |
| Page             | `site/` static, deployed to Vercel · no framework, no build step                                    |
| Distribution     | Five files in `dist/` · no server, no analytics                                                     |

The pipeline enforces a hard boundary between content and rendering. Scenes are data; `90_app.js`
renders them and `60_plot.js` draws them. A figure is produced per render rather than once at load
time, so it belongs to the palette it is drawn in instead of carrying a stale one — pass a function to
`fig.svg` and `raw.html`, never a string built at module scope.

---

## Design System

One visual language throughout: an ivory page with a matching dark page, a fixed set of signal colours,
and mathematics typeset in the same face wherever it appears — running text, figure axis, block diagram.

- **Signal colour is semantic.** Cyan `#14707F` transmitted signal or source symbol · amber `#C08422`
  channel or filter · green `#4A7A46` received or detected output · violet `#6A5A92` intermediate
  quantity · red `#A63B2A` error.
- **Noise takes no colour.** A sixth hue would make the palette unreadable, and noise is almost always
  drawn behind something else, so it is the hairline tone at low opacity. A symbol point inside a noise
  cloud keeps its own colour.
- **A decision region is a low-opacity fill of the colour of the symbol it decides for**, so the region
  and the symbol read as one statement.
- **Page colours.** Canvas ivory `#FAF8F4` · ink `#232B33` · coral `#A0451C` emphasis ·
  slate `#28567E` metadata · navy `#12314E` for module openings and synthesis scenes only.
- **Typography.** Iowan Old Style / Palatino for headings and prose, Inter for interface text, a
  monospace stack for metadata, readouts and identifiers.
- **Every figure label is mathematics.** Axis names, block-diagram signals and annotations are TeX with
  `tex:true`, on one line — never a plain string and never a Unicode substitute for a symbol. A label
  split across two lines reads as untyped text to the gate.
- **An `eq` block's label is uppercased by the style sheet**, so Greek letters and TeX macros do not go
  in it; the name is written in ASCII, or the symbol goes in the equation instead.

---

## Project Structure

```text
build/
├── src/
│   ├── 00_head.html            Document shell, rail, overlays, mark placeholders
│   ├── 10_style.css            Design tokens, layout, print CSS
│   ├── 20_katex.css            Vendored KaTeX, fonts inlined
│   ├── 30_katex.js             Vendored KaTeX renderer
│   ├── 40_core.js              Navigation, keyboard, overlays, persisted state
│   ├── 60_plot.js              SVG plotting: Axes, curve, poly, stem, blocks, texName
│   ├── 70_labs.js              The laboratory kit
│   ├── 71_labs_m1.js … 76_labs_m6.js     Laboratories A–J, one file a module
│   ├── 80_content_core.js      Metadata, conventions, glossary, module list, the textbook mark
│   ├── 81_scenes_m0.js … 87_scenes_m6.js Teaching scenes, one file a module
│   ├── 89_sections.js          Chapters, sections, addresses and textbook anchors
│   ├── 90_app.js               Scene renderer and block types
│   ├── 92_drill_m1.js … 97_drill_m6.js   Question sections, twenty a module
│   └── 99_tail.html            Scene registration and boot — an array not named here never appears
├── build.js                    Concatenates src/ → dist/Digital_Communications.html
├── pw.js                       Module-resolution redirect for the Playwright harnesses
├── qa.js labtest.js textclash.js mathscan.js labwalk.js seccheck.js   Six of the eleven gates
└── domcheck.js shot.js         A sweep and a screenshot tool, neither a gate

notes/
├── build.js editions.js topdf.js   Lecture-notes pipeline → HTML → four A4 PDFs
├── mathscan.js                     The notes mathematics gate
└── src/                            c1.js … c6.js · ca.js · render.js · notes.css

site/                           index.html · site.css · grid.js · scope.js
verify/                         verify_scenes.py · verify_drills.py · verify_ber.py · ber_claims.py · wilson.py
tools/rule_check.py             The editorial banned-phrase scanner
assets/icon.svg                 The mark — one file, inlined everywhere
dist/                           The five deliverables
source/                         Course source material (git-ignored)
```

Folders are organised by **who the files are for**. Superseded material is deleted rather than kept
beside the current files; git history is where it survives.

---

## Quick Start

Requires Node.js 18+ and, for the numerical gates, a local arm64 Python 3.12 virtualenv.

```bash
cd build  && node build.js                   # → dist/Digital_Communications.html
cd notes  && node build.js && node editions.js
cd build  && node pw.js ../notes/topdf.js    # → every edition to PDF
```

No framework, no bundler, no npm dependency at runtime. Playwright is needed only to run the gates and
to render the PDFs. The artifact build is byte-reproducible: building twice from unchanged sources
leaves `git status` clean, and a rebuild that produces a diff you did not author is a signal, not noise.

`.venv` is git-ignored; create it once, and never with the x86_64 Anaconda Python — under Rosetta it
silently slows the numerical gates.

```bash
/opt/homebrew/bin/python3.12 -m venv .venv && .venv/bin/pip install numpy scipy sympy
```

`source/` holds the lecture material and the textbook and is not committed; it must be present locally
before anything can be built or checked. Nothing else in the repository needs network access.

---

## Every number is checked twice

No number in a scene or a solution is written down and left alone. A separate program reaches each one
by a different route.

- **`verify/verify_scenes.py`** — 68 checks. Constellations are rebuilt from their definitions and
  measured, rather than read off the formula printed beside them.
- **`verify/verify_drills.py`** — 276 checks over the `Check` step of every worked solution. Huffman
  codes are built a second time with a heap, including the tie rule.
- **`verify/verify_ber.py`** — 12 Monte-Carlo simulations of the systems whose error probabilities the
  course states, with trial counts sized so that a dropped factor of two falls outside the Wilson
  interval.

`verify_ber.py` is written **independently of the artifact's own simulation**. Porting the artifact's
code into the gate would make the gate verify itself.

---

## Verification Gates

Eleven gates. Nothing is done until all eleven pass, and **the number a run printed is the number that
gets reported** — never a summary in place of a run.

| Gate                | Command                                             | Must print                                    |
| ------------------- | --------------------------------------------------- | --------------------------------------------- |
| Layout              | `cd build && node pw.js qa.js`                       | 0 errors, 0 overflow, nothing dense            |
| Interaction         | `cd build && node pw.js labtest.js`                  | `ERRORS: none`, `options=0`                    |
| Labels              | `cd build && node pw.js textclash.js`                | `TOTAL COLLISIONS: 0`                          |
| Mathematics         | `cd build && node pw.js mathscan.js`                 | `SCENES WITH MATH DAMAGE: 0 / 109`             |
| Notes mathematics   | `cd build && node pw.js ../notes/mathscan.js`        | `LITERAL MATH IN NOTES: 0`, `KATEX ERRORS: 0`  |
| Laboratories        | `cd build && node pw.js labwalk.js`                  | `PROBLEMS: none`                               |
| Contents addressing  | `cd build && node pw.js seccheck.js`                | `PROBLEMS: none`                               |
| Scene numbers       | `cd verify && ../.venv/bin/python verify_scenes.py`  | `68 passed, 0 failed`                          |
| Question numbers    | `cd verify && ../.venv/bin/python verify_drills.py`  | `276 passed, 0 failed`                         |
| Bit error rates     | `cd verify && ../.venv/bin/python verify_ber.py`     | `12 passed, 0 failed`                          |
| Wording             | `tools/rule_check.py` (below)                        | `TOTAL VIOLATIONS: 0`                          |

```bash
node --check build/src/7*.js build/src/8*.js build/src/9*.js   # runs first; not a gate

.venv/bin/python tools/rule_check.py "build/src/8[1-9]_scenes*.js" \
  "build/src/9[2-8]_drill_m*.js" "build/src/91_*.js" "build/src/70_labs.js" \
  "build/src/7[1-9]_labs*.js" "notes/src/*.js"
```

`qa.js` renders every scene at its last reveal and measures it against the stage; a scene that needs a
scale below 0.90 is a scene carrying two ideas, and it prints under `dense`. `labtest.js` drives every
laboratory control and walks every question to its worked solution. `textclash.js` walks every scene at
every step and tests the glyph box of every figure label against the drawn geometry — it classifies by
colour, so a palette change that skips it leaves it measuring nothing while still reporting green.
`labwalk.js` walks every reachable laboratory state in both themes. `seccheck.js` checks that every
scene carries the address and the textbook anchor `89_sections.js` declares for it. `rule_check.py`
scans every student-facing string for phrases that would reveal how the material was made, and for
mathematics inside a figure written as anything other than LaTeX.

No gate reads a rendering. After the PDFs are built they are swept by eye:

```bash
pdftotext -layout dist/Lecture_Notes.pdf - | grep -nE '\$[^$]+\$|\\\\[a-zA-Z]+'   # no output
cd build && node pw.js shot.js                                                    # then look
```

The Playwright harnesses require Playwright at a fixed absolute path. Elsewhere they run unmodified
behind `build/pw.js`, a short module-resolution redirect: `node pw.js qa.js`,
`node pw.js ../notes/topdf.js`. Set `PW_PATH` if Playwright lives somewhere else.

---

## Keyboard

| Group    | Key            | Action                                  |
| -------- | -------------- | --------------------------------------- |
| Steps    | `→` `Space`    | Next reveal, then the next scene         |
| Steps    | `←`            | Previous reveal, then the previous scene |
| Scenes   | `↓` `↑`        | Next / previous scene, ignoring reveals  |
| Scenes   | `Home` `End`   | First / last scene                       |
| Overlays | `M`            | Contents                                 |
| Overlays | `/` `F`        | Full-text search                         |
| Overlays | `G`            | Notation glossary                        |
| Overlays | `Esc`          | Close any overlay                        |
| Modes    | `S`            | Show / hide the contents rail            |
| Modes    | `P`            | Normal / projector size                  |
| Modes    | `D`            | Light / dark page                        |
| Modes    | `L`            | Lecture / self-study                     |
| Modes    | `I`            | Student / instructor edition             |
| Modes    | `R`            | Full / reduced motion                    |

---

## What to hand out

Give students four of the five files in `dist/`, or send them the page and let them take what they need.

- **`Digital_Communications.html`** — the interactive artifact, about 1.3 MB. Opens in any browser,
  works offline, makes no network request, and stores optional progress on the reader's own device.
- **`Lecture_Notes.pdf`** — 44 pages, A4: six chapters and an appendix, printable and annotatable.
- **`Student_Workbook.pdf`** — 40 pages: every question and the laboratories, with room to work.
- **`Formula_Reference.pdf`** — 9 pages: the conventions, every formula, every symbol.

**`Instructor_Solutions.pdf`** — 92 pages, every question worked with the error it catches and a
teaching note — is **not** handed out and is not published. Its build products are git-ignored and it is
named in `.vercelignore`.

---

## Conventions

Fixed everywhere, because half the factor-of-two errors in this subject come from mixing two of them in
one line. Each is stated in the artifact where a reader first needs it.

- Noise is white and Gaussian with **two-sided** power spectral density `N₀/2`, unless a scene says otherwise.
- `Q(x) = ½ erfc(x/√2)`.
- `sinc(x) = sin(πx)/(πx)`, with zeros at every non-zero integer.
- Energy is normalised: the resistance is `1 Ω`, so no resistance appears anywhere.
- `log` without a base means base two.
- `E_s = (log₂ M) E_b`, converted once and never twice.

---

## Reference

The content is built from the course's own handwritten lecture notes, which are the authority for the
order of ideas and for the phrasing of a definition or a warning. Where a gap has to be filled, a
standard text is the authority for the result — but it is filled at the level the rest of the course is
written at, not at the level the book is written at. The text is never reproduced, quoted or
redistributed in any form, and its chapter numbers and this course's do not agree: Module 2 spans two of
its chapters, and Module 6 is not the chapter its number suggests.

A textbook anchor is looked up before it is written. A wrong anchor is well formed, so no gate can catch
it; where one cannot be verified, none is written.

---

## Current State

**v1.0 — complete.** Modules 0 to 6 in 109 scenes, laboratories A to J, and twenty open-ended practice
questions in every module from 1 to 6 — 120 questions in 342 parts, each with a worked solution that
says why its method fits and names the mistake a student actually makes. A module opens with a map of
the question types it will ask and closes with the questions themselves. Four A4 documents are built
from the same content, and a public page hands out the ones students get.

What the gates printed on the final run: 109 scenes, 0 errors, 0 overflow, nothing dense; laboratories
A–J with 120 questions, 120 solutions and 342 parts, and no errors; 0 label collisions; 0 scenes with
damaged mathematics; 0 literal mathematics and 0 KaTeX errors in the notes; 396 laboratory states walked
with no problem; 108 of 109 scenes addressed and 90 anchored, the cover taking no address by design; 356
numerical checks passed; and 0 wording violations. Both builds are byte-reproducible: building twice
from unchanged sources gives the same file both times.

Two scenes carry no textbook anchor on purpose — the line-code scene of Module 1 and the eye-pattern
scene of Module 2 — because no section of the text states those results in the form the course needs.

---

<p align="center">
  <strong>Digital Communications</strong><br>
  <sub>📡 One file, offline, and readable on the first pass.</sub>
</p>
