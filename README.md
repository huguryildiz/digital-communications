<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <img src="assets/icon.svg" alt="Digital Communications logo" width="120" height="120">
</p>

<h1 align="center">Digital Communications</h1>

<p align="center">
  <strong>Interactive Lecture Artifact</strong><br>
  <sub>An interactive deck for the undergraduate digital communications course I teach to electrical engineering students.</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML_%C2%B7_JavaScript-0b1220?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="HTML and JavaScript">
  <img src="https://img.shields.io/badge/KaTeX-0b1220?style=for-the-badge&logo=latex&logoColor=4FBECE" alt="KaTeX">
  <img src="https://img.shields.io/badge/Pyodide-0b1220?style=for-the-badge&logo=python&logoColor=3776AB" alt="Pyodide">
  <img src="https://img.shields.io/badge/NumPy_%C2%B7_SciPy_%C2%B7_SymPy-0b1220?style=for-the-badge&logo=numpy&logoColor=4DABCF" alt="NumPy, SciPy and SymPy">
  <img src="https://img.shields.io/badge/Playwright-0b1220?style=for-the-badge&logo=playwright&logoColor=45BA4B" alt="Playwright">
  <a href="https://digital-communications-tedu.vercel.app"><img src="https://img.shields.io/badge/digital--communications--tedu.vercel.app-0b1220?style=for-the-badge&logo=vercel&logoColor=white" alt="Live"></a>
  <a href="https://github.com/huguryildiz/digital-communications/actions/workflows/checks.yml"><img src="https://img.shields.io/github/actions/workflow/status/huguryildiz/digital-communications/checks.yml?branch=main&style=for-the-badge&label=checks" alt="Checks"></a>
</p>

<h3 align="center">
  <a href="#what-this-is">Overview</a>
  &nbsp;·&nbsp;
  <a href="#topics">Topics</a>
  &nbsp;·&nbsp;
  <a href="#repository-layout">Architecture</a>
  &nbsp;·&nbsp;
  <a href="#building">Building</a>
  &nbsp;·&nbsp;
  <a href="#checks">Checks</a>
</h3>

---

## What this is

The course is taught from a single HTML document that works as both a lecture deck and a study
guide. Each scene reveals one idea at a time, so a derivation can be followed step by step, whether
it is projected in the lecture room or read alone before an exam.

The course runs from sampling and quantization, through baseband transmission, the geometric view of
signals and the optimal receiver in noise, to the digital modulation methods and an introduction to
information theory. Its one argument is that errors are decided by the distance between the signal
points, and by almost nothing else.

Alongside the scenes, the artifact contains:

- **Laboratories.** Each has controls for a signal, a coder or a receiver; moving one updates the plot and the numbers beside it, computed from the definitions at that moment.
- **Practice questions.** Twenty open-ended questions for each of Modules 1 to 6, each with a worked solution that checks its own answer a second way.
- **Code pages.** Short Python programs that reproduce a result from the lecture. A reader can run them in the browser from the course site. Modules 1 to 6 have them.

The same content also produces a set of printable PDF editions: the lecture notes, a student workbook
with the questions only, and a formula reference.

## Topics

| Module | Title | Topics |
| --- | --- | --- |
| 0 | Why digital communications? | What the subject asks · the transmitter–channel–receiver chain · why digits are sent at all · the course map · how to use the artifact |
| 1 | Sampling, quantization and PCM | The sampling theorem and aliasing · reconstruction · uniform and non-uniform quantization · SQNR and the 6 dB rule · companding · PCM, DPCM and delta modulation · line codes |
| 2 | Baseband transmission | The transmitted pulse · the matched filter · the threshold and its error probability · intersymbol interference · the Nyquist criterion · raised-cosine shaping · the eye diagram |
| 3 | Geometric representation of signals | Gram–Schmidt · orthonormal bases · a waveform as a point · energy as squared length · the noise projection |
| 4 | The optimal receiver in AWGN | Correlation and matched-filter receivers · the maximum-likelihood rule · decision regions · pairwise error probability · the union bound |
| 5 | Digital modulation methods | PSK, PAM, QAM and FSK · constellations and minimum distance · error probabilities · bandwidth against energy |
| 6 | An introduction to information theory | Self-information and entropy · source coding · the Huffman code · mutual information · channel capacity and the Shannon limit |

## How students use it

Students open the course at its site address and work there; the artifact is not handed out as a
download. The PDF editions are available from the same site. Reading progress is kept in the reader's
own browser and is not sent anywhere. The site has no sign-in and no analytics. The instructor
solutions are not published.

Press `?` inside the artifact for the keyboard shortcuts.

## Repository layout

```text
build/     the artifact: sources in build/src/, the build script, and the browser checks
notes/     the lecture notes and the other PDF editions
verify/    Python scripts that recompute every numerical result independently
tools/     text checks on student-facing wording
web/       the public site and the script that assembles it
dist/      generated output; never edited by hand
assets/    the course icon
source/    private reference material; not tracked and never redistributed
```

`build/src/` is a set of numbered files concatenated in order. Content is data: scenes, laboratories
and questions are plain JavaScript objects, and one renderer and one plotting module draw them. Figures
are drawn at render time, so they always follow the current light or dark theme.

## Building

Node.js is the only requirement for the artifact and the notes. KaTeX is vendored into the sources, so
nothing is installed and nothing is fetched from the network.

```bash
cd build && node build.js                              # the artifact
cd notes && node build.js                              # the lecture notes
cd notes && node editions.js && node ../build/pw.js topdf.js   # the other editions and all PDFs
node web/build-site.js                                 # the public site, in site/
```

The artifact build is byte-reproducible. If a rebuild from unchanged sources changes the output, that
difference needs to be explained before anything ships.

The numerical checks use a local Python environment:

```bash
/opt/homebrew/bin/python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

## Python on the site

The site is hosted on Vercel as static files. Vercel runs no Python: the code pages run Python in the
reader's browser through [Pyodide](https://pyodide.org), a build of CPython compiled to WebAssembly.

1. On Vercel, the build command runs `web/build-site.js`, which calls `web/pyodide.js`. That script downloads Pyodide 0.29.3 from
   jsDelivr, together with NumPy, Matplotlib and their dependencies, and checks every file against a
   pinned SHA-256. A mismatch stops the build. This is the one step that uses the network; the artifact
   and the notes still build offline.
2. The files are published under `pyodide/v0.29.3/` on the course site itself, so a reader's
   browser never contacts a third-party server. `vercel.json` serves them with a one-year immutable
   cache and the `application/wasm` content type.
3. Nothing is loaded when the page opens. The first press of **Run** loads the runtime and the two
   packages, which takes a few seconds; later runs reuse it.
4. Each program runs in a fresh namespace. Printed output appears under the code, and Matplotlib
   figures are drawn to PNG and shown in place of a window.

The code sent to Python never leaves the reader's browser. A copy of the artifact opened as a local
file (`file://`) makes no request and offers Copy only. For an offline local build, set
`SKIP_PYODIDE=1`; the site then has no runtime, and Run reports that Python could not be loaded.

## Checks

Before a release, the sources pass a chain of checks. Browser checks render every scene and look for
overflow, damaged mathematics and labels that collide with a drawn curve, and they drive every
laboratory control in both themes. Python scripts recompute every number the course states, and a
Monte-Carlo check simulates every error probability the course quotes. Text checks enforce the wording
rules. The browser checks run through `build/pw.js`, which locates the local Playwright install (set
`PW_PATH` if it is elsewhere). Report the result a run actually printed, not a remembered one.

## Reporting errors

If you find a mistake in a scene, a figure, a question or a PDF, please open an issue on
[GitHub Issues](https://github.com/huguryildiz/digital-communications/issues). Say where it is (the
scene title or the page number), what is wrong, and, if it is a display problem, which browser and
theme you used. A screenshot helps.

## Conventions

These are fixed for the whole course and stated in the artifact where a reader first meets them.

- Noise is white and Gaussian with two-sided power spectral density `N₀/2`, unless a scene says otherwise.
- `Q(x) = ½ erfc(x/√2)`.
- sinc is normalised, `sinc(x) = sin(πx)/(πx)`, with zeros at every non-zero integer.
- Energy is normalised to a 1 Ω resistance.
- `log` without a base means base two.
- `E_s = (log₂ M) E_b`, converted once and never twice.

## Design

The visual language, the colour roles of signals and the figure rules are in [`DESIGN.md`](DESIGN.md).
The audience, purpose and constraints are in [`PRODUCT.md`](PRODUCT.md). The design is shared with the
sibling course [Signals and Systems](https://github.com/huguryildiz/signals-and-systems); the two read
as one publication.

## Sources

The content is written from the course's own handwritten lecture notes. A standard textbook is used
only to fill a gap and to cross-check results and scale factors; it is never quoted, reproduced or
redistributed.

## Citing

If you use this material in teaching or research, please cite it. The citation metadata is in
[`CITATION.cff`](CITATION.cff), and GitHub's **Cite this repository** button in the repository sidebar
gives it in APA and BibTeX. In BibTeX:

```bibtex
@misc{yildiz_digital_communications,
  author       = {Y{\i}ld{\i}z, H{\"u}seyin U{\u{g}}ur},
  title        = {Digital Communications: An Interactive Lecture Artifact},
  year         = {2026},
  version      = {1.3},
  howpublished = {\url{https://digital-communications-tedu.vercel.app}},
  note         = {Source: \url{https://github.com/huguryildiz/digital-communications}}
}
```

Please cite the version you used. When a new version is released, the version number in
`CITATION.cff` changes with it.

## License

The repository separates original course content from original software.

- **Course content** (scenes, laboratories, code pages, questions, worked solutions, lecture notes,
  figures and the authored material in the generated files) is licensed under
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). See `LICENSE-CONTENT`.
- **Software** (the build pipeline, renderer, plotting code, checks, notes pipeline and public page) is
  licensed under the MIT License. See `LICENSE`.
- **Generated HTML files** combine both, plus third-party components, and each part keeps its own
  license.

KaTeX, the grid shader on the public page and the Pyodide runtime keep their upstream licenses; see
`THIRD_PARTY_NOTICES.md`. Material in `source/` is third-party and is covered by neither project
license.

Suggested attribution:

> Hüseyin Uğur Yıldız, *Digital Communications*, https://huguryildiz.com/
