---
paths:
  - "build/src/7*.js"
  - "build/src/8*.js"
  - "build/src/9*.js"
  - "notes/src/**/*.js"
---

# Student-facing content and fixed mathematics

These rules apply to the artifact, notes, PDFs, practice questions, and instructor solutions. Run the relevant gates in `build-pipeline.md` before delivery.

## Who this is for

Second-year undergraduates. This constraint decides every writing question, and it outranks
completeness, elegance and rigour for its own sake.

- **Plain first, formal second.** Every scene says what is going on in ordinary words before it says
  it in symbols, and again afterwards if the symbols were heavy. A reader who stops at the prose
  should still have learnt something true.
- **A worked example beats a general theorem.** Where the two compete, the example wins and the
  theorem goes in a note beside it.
- **No material the course does not need.** Where a gap has to be filled, private reference material
  is the authority for the fact, but the passage is written at the level the rest of the course is
  written at, never at the level of that material.
- **Name the mistake.** Every worked example carries the error a student actually makes, said
  plainly. That is worth more than another example.
- **One idea a scene.** A scene that needs a scale factor below 0.90 to fit is a scene carrying two
  ideas. `qa.js` prints those under `dense`; split them.

## Editorial rules R1–R9 (inherited) and R10 (this course's own)

**R1 — Teach the subject, not the production process.** Student-facing text is self-contained lecture material. It must not reveal conversion, auditing, redrawing, or verification work.

**R2 — Banned student-facing language.** Do not write "in the PDF", "on page X", "in this file", "in this document", "the document shows", "as shown in the attached", "in the source notes", "the source says", "the original notes", "the lecture notes state", "the uploaded document", "the provided material", "redrawn from", "reconstructed from", "based on the original figure", "verified against", "cross-checked", "the audit found", or "editorial enhancement". Never write the course code, and never name the course this engine came from, or any source document, page, audit or process. Rewrite such sentences so the mathematics carries the meaning.

**R3 — Keep provenance hidden.** It belongs in the instructor edition, instructor solutions, and internal records, never in the student view.

**R4 — Write for a second-year undergraduate reading in a second language.** Use short sentences, one idea each, with subject and verb close together. Prefer everyday words: "use" over "utilise", "so" over "consequently", "shows" over "demonstrates". Avoid idioms, figures of speech, hype, praise, decorative rhetorical questions, em-dash chains, nested parentheses, and sentences with three clauses where two sentences work. Define technical terms on first use. Keep one idea per paragraph and put derivation steps in order.

Every derivation is explicit. Start from the governing definition, substitute the given signal or system, show changes of limits or indices, evaluate the integral or sum, and show each algebraic simplification before stating the result. Explain every non-obvious equality or inequality. Do not hide a step in prose or require the student to reconstruct it. A definition or directly stated identity needs no false derivation.

A derivation shows its intermediate steps, set large, one step to a line: the integral the definition expands to, the change of variable, the property being applied, never jumped over because it is routine to whoever wrote it. Each step is its own display `eq` block, never a formula buried in a `body` or `small` line. Where a step is a chain of more than one equality, write it `\begin{aligned}` with each equality on its own line and aligned at the `=`; a chain run across the page overflows its block on any window narrower than the stage, and `qa.js` measures the wide layout at 1920 px, so an overflowing chain can pass there and still break on a projector or a phone.

Practice-question solutions (`sol:` in `build/src/9[2-8]_drill_m*.js`) show every step, with no exceptions, in the Given, Find, Method, Solution, Check form. Write each antiderivative and evaluate it at its limits. Name every substitution and give its new limits. Solve inequalities one at a time and say where a negative divisor reverses one. Put a chain of equalities in a `\begin{aligned}` block, one equality per line. A Check step evaluates the integrals and sums it uses instead of quoting their values. The Module 1 solutions are the reference for this level of detail.

Say what an idea is for before developing it. Name each move (for example, "take the transform of both sides"). Explain steps students commonly get wrong and the reason for a definition that otherwise looks arbitrary. A slide card holds one or two sentences; the notes carry the full explanation.

**R5 — Simple language must preserve correctness.** Define every symbol on first use. Preserve signs, coefficients, limits, and scale factors. State required assumptions and convergence conditions. State the `sinc` and `Q(x)` conventions at every use where the scene depends on them.

**R6 — Use the fixed conventions below without local variation.**

**R7 — Figures and worked examples.** Given, Find, Method, Solution, Check, with a stated reason why the method fits the question. See `figures-and-math.md` for the drawing rules.

**R8 — Typeset mathematics in every student-facing field.** Route eyebrows, equation labels, callout titles, card tabs, worked-example keys, table heads, contents entries, and captions through `md()`. A new block type in `build/src/90_app.js` or `notes/src/render.js` must route every text field through `md()` in the same commit.

**R9 — Check these rules mechanically.** Run the relevant gates in `build-pipeline.md`. Inspect screenshots after visual changes; gates cannot see every flaw.

**R10 — the slide and the missing step.** The model for every student-facing string is a lecture slide with the step it leaves out written back in. A slide is short because a lecturer speaks beside it; these pages stand alone, so they add the missing step and keep the slide's plainness while doing it. `rule_check.py` measures the first three points below.

- **A heading names its topic and nothing else.** "Uniform quantization", "MAP rule", "Common error". Never "What this really means", "Why this matters", "The rule worth remembering" — a heading that opens with an interrogative or a narrator's phrase tells the reader how to feel about the material instead of naming it. *Measured.*
- **A plain sentence comes before the equation or the figure, never after it alone.** The reader is told in words what the next object is, then shown it, and the words name the move the object makes.
- **One idea a paragraph, and at most 25 words a sentence.** Mathematics inside `$…$` counts as one word, because a formula is read as one object. A semicolon joining two independent clauses is a sentence boundary written with the wrong mark. *Both measured.*
- **A technical term is defined where it first appears, in one short sentence, and then keeps that name.** One item, one name: not "levels" here and "representation values" there.
- **A student's mistake is kept, and written short and technical.** The form is `Common error: use $2m_{\max}$, not $m_{\max}$, for the quantizer range.` The error comes first and the explanation second, never the reverse.
- **No narration.** The material does not tell the reader that a result is important, interesting, or worth carrying away. It states the result.

## Mathematical conventions

- `sinc(x) = sin(πx)/(πx)`. State this convention at every use.
- `Q(x)` is the Gaussian tail, `Q(x) = ½ erfc(x/√2)`.
- Noise is white and Gaussian with **two-sided** PSD `N₀/2` unless a scene says otherwise. Mixing the
  one-sided and two-sided conventions is a silent 3 dB error.
- The imaginary unit is `j`.

## Colour semantics

Cyan is the transmitted signal or source symbol (`C.in`), amber the channel or filter (`C.h`), green
the received or detected output (`C.out`), violet an intermediate quantity — sampled, quantized, or a
transformation in progress (`C.mid`), red an error (`C.err`). **Noise takes no colour** — it is the
hairline tone at low opacity. A decision region is a low-opacity fill of the colour of the symbol it
decides for. See `figures-and-math.md` and `DESIGN.md` for where these tokens live in code.

## Standing content decisions

- Since 2026-09-24, thirty questions a module (Module 0 has none), every one written in the form of a
  midterm or final examination question: one statement in the examination's wording, three or four
  lettered parts carrying point weights that sum to 25 (`[8 pts]`), each part usually resting on the
  one before, and no answer options (`labtest.js` asserts `options=0`). Every worked solution carries
  at least one figure (`figSol`) that shows the answer: the matched filter, the conditional densities
  with the threshold and the error areas, the constellation with its decision regions, the quantizer
  over the density, the spectrum against the sampling rate, the Huffman tree. A question keeps the
  shape of a source paper question and no number from it; preserve the answer's character (periodic
  stays periodic, unstable stays unstable). `src` names the paper question and renders only in the
  instructor edition. Where a module carries a different count for a recorded reason, state the reason
  in `TODO.md` or `.claude/reference/history.md`, not silently.
- Since 2026-09-25, a question's shape may also come from a textbook problem that already has the
  examination form: three or four parts that can be done by hand, an answer that can be drawn, and only
  material the module teaches. At most a quarter of a module's thirty come from this second source. Such
  a question replaces the closest duplicate of a question that stays, so the count stays thirty. It
  keeps the problem's shape and nothing else: the statement is rewritten in the course's wording and
  every number is new. `src` names the problem (`'Madhow P6.28'`) and renders only in the instructor
  edition. The plan is `.claude/plans/2026-09-24-madhow-question-transfer.md`.
- A slide may ask for a prediction with `note.ask` choices (one per teaching slide, in the card headed
  **Given**), and a module closes before its summary with one quick-check slide of six short
  predictions in a 3×2 grid. A prediction needs no paper calculation, gives its reason in one sentence,
  and has a PASS line in `verify/` for every number it states. It never replaces a worked derivation.
  It counts toward the card budget in `DESIGN.md`, "Figure and card budget".
- A module summary is a recall deck (`RECALL.deck`, `DESIGN.md`, "Interaction on a slide"): one card
  for each result the module carries forward, a short question on the front and a one- or two-sentence
  answer on the back that states the result exactly, with its conditions. A deck restates results
  already proved; it introduces no new result.
- A slide whose task is to plot a signal obtained from a given one makes the reader draw it first with
  `fig.sketch` (`DESIGN.md`, "Interaction on a slide"; `m1-ex-nyquist-b` is the
  mechanism reference). The given signal stays on the axes as a faint trace, the answer goes in the
  `.sk-key` group, and the caption says what to map without stating the answer. Apply it when a module
  is converted; converted slides are not retrofitted in a separate pass.
- Seven forms inside a card are part of the slide language (`DESIGN.md`, "Inside a card"): annotated
  equation, comparison panel, property chips, step strip, key result, margin note, value chip. Use the
  one that fits whenever a slide meets its case, and apply them as each module is converted. Each
  counts as the card it sits in.
- Every teaching section of a module ends with one "… Around Us" gallery slide (id `*-real-*`), placed
  after the last teaching scene and before that section's laboratory. It shows four everyday signals in
  a 2×2 grid, mixing continuous (curves) and discrete (stems) where relevant, with physical units on
  the axes. Each caption names the everyday source in one sentence and gives its formula in TeX,
  matching the plotted function. Register its id in `CONTENT.SECTIONS` and `CONTENT.BOOK`.
- Every teaching section of a converted module has at least one laboratory, following its gallery, and
  since 2026-09-23 the section then closes with its code page: gallery, laboratory, code (`m1-real-*`
  → `m1-lab-*` → `m1-code-*` is the Module 1 order). Opening, summary and property-summary sections
  carry none. A laboratory exercises its own section's material, not a later section's. List its id
  inside that section in `CONTENT.SECTIONS`, taking a laboratory letter (`.L`) rather than an ordinal,
  and give it a `CONTENT.BOOK` anchor. Register it so `labtest.js` and `labwalk.js` sweep it, and give
  every fixed number in its cards a PASS line in `verify/`.
- Since 2026-09-23, every teaching section of every converted module closes with a code page after its
  laboratory (`DESIGN.md`, "Code pages"; `m1-code-sampling` and the other `m1-code-*` scenes are the
  reference once `build/src/7?_code_m1.js` exists). The scene id has the shape `m<N>-code-<name>`,
  address `<section>.C`. It holds three to five programs, each in MATLAB and Python: `title`, one or
  two sentences of `what`, a `try` asking the reader to change one thing and predict the result, and
  `out`, what the program prints. A program works the section's own signals and numbers, prints the
  number the section computes in the same words in both languages, uses no MATLAB toolbox and only
  NumPy and Matplotlib in Python, and is 10 to 21 lines. Every entry passes `verify/code_check.py` in
  both languages before delivery.
- Since 2026-09-23, a scene that is not a teaching slide shows a drawn icon at the left of its title: a
  flask for a laboratory, `</>` for a code page, a globe for an "… Around Us" gallery, a pencil for the
  practice questions, a bolt for the quick check (`DESIGN.md`, "Title icons"). The icon comes from the
  scene id shape (`-lab-`, `-code-`, `-real-`, `-drill`, `-quick`); a new kind of non-teaching scene
  gets its icon in `TITLE_ICONS` in `build/src/90_app.js`.
- Never show a textbook anchor as a bare address; the book chip on screen carries it. Declare addresses
  only in `build/src/89_sections.js`, never in scene files. Look an anchor up in the private reference
  material before writing it; where it cannot be verified, write none (`m1-linecodes` and `m2-eye` are
  the existing examples). The reference course's chapter numbers and this course's own numbering do not
  always agree; check both before writing `CH` text.
