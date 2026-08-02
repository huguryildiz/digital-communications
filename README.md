# Digital Communications — EE 413

A teaching artifact for **EE 413 Communication Systems II**: one offline HTML file carrying
seven modules, ten interactive laboratories and one hundred and twenty practice questions with
worked solutions, plus a lecture-notes PDF and three derived editions.

Written for second-year undergraduates. Plain first, formal second; a worked example before a
general theorem; nothing the course does not need.

## What is built

| File | What it is |
| --- | --- |
| `dist/Digital_Communications.html` | the artifact — open it in a browser, no server, no network |
| `dist/Lecture_Notes.pdf` | six chapters and an appendix of formulas |
| `dist/Student_Workbook.pdf` | every question, no answers |
| `dist/Instructor_Solutions.pdf` | every question worked, with the error it catches and a teaching note |
| `dist/Formula_Reference.pdf` | the conventions, every formula, every symbol |

The artifact is a single file with the fonts, the mathematics renderer and every figure inside
it. It makes no network request and works from a memory stick.

## The course

| Module | Subject |
| --- | --- |
| 0 | The frame of the course — what it asks, why digits, the map |
| 1 | Sampling, reconstruction, quantization and PCM |
| 2 | Baseband transmission: the matched filter, ISI, the Nyquist criterion |
| 3 | Geometric representation of signals — a waveform as a point |
| 4 | The optimal receiver in AWGN: the decision rule, regions, the union bound |
| 5 | Digital modulation: PSK, PAM, QAM and FSK |
| 6 | An introduction to information theory: entropy, source coding, Huffman |

Ten laboratories, A to J. Every control in a laboratory changes the mathematics and not the
drawing — the numbers beside a figure are computed from the definitions at the moment the
control moves.

## Every number is checked twice

No number in a scene or a solution is written down and left alone. A separate program reaches
each one by a different route:

- **`verify/verify_scenes.py`** — 68 checks. Constellations are rebuilt from their definitions
  and measured, rather than read off the formula printed beside them.
- **`verify/verify_drills.py`** — 276 checks over the `Check` step of every worked solution.
  Huffman codes are built a second time with a heap, including the tie rule.
- **`verify/ber_claims.py`** — 12 Monte Carlo simulations of the systems whose error
  probabilities the course states, with trial counts sized so that a dropped factor of two falls
  outside the Wilson interval.

Eight further gates check the rendering: layout overflow, text-on-figure collisions, damaged
mathematics, laboratory behaviour under every control state, section addressing, and banned
phrasing.

## Building

```bash
cd build  && node build.js                   # the artifact
cd notes  && node build.js && node editions.js
cd build  && node pw.js ../notes/topdf.js    # every edition to PDF
```

No framework, no bundler, no npm dependency at runtime. Playwright is needed only to run the
gates and to render the PDFs. Python is the arm64 virtual environment at `.venv/`.

`source/` holds the lecture material and the textbook and is not committed; it must be present
locally before anything can be built or checked.

## Conventions

Fixed everywhere, because half the factor-of-two errors in this subject come from mixing two of
them in one line:

- Noise is white and Gaussian with **two-sided** power spectral density `N₀/2`.
- `Q(x) = ½ erfc(x/√2)`.
- `sinc(x) = sin(πx)/(πx)`, zeros at every non-zero integer.
- Energy is normalised: the resistance is `1 Ω`, so no resistance appears anywhere.
- `log` without a base means base two.
- `E_s = (log₂ M) E_b`, converted once and never twice.

## Working on it

`CLAUDE.md` is the working document: read order, repository layout, the eleven gates with what
each must print, the editorial rules, the decisions that are fixed, and the traps — all of which
were met at least once.
