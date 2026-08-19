# Digital Communications source-fidelity remediation plan

Drafted: 2026-08-19  
Scope: `dist/Digital_Communications.html` and the source layers that generate it  
Audience: second-year undergraduate engineering students

## Objective

Make the interactive course a defensible adaptation of the lecturer's four
handwritten chapters while preserving the existing interaction engine,
laboratories, numerical verification, simple English, and one-idea-per-scene
teaching model.

The work is complete only when every lecture-note unit is represented,
explicitly adapted, or explicitly omitted for a recorded pedagogical reason.
Passing the rendering and numerical gates is necessary but does not establish
source fidelity by itself.

## Source authority

1. `source/lecture-notes.pdf` controls the order of ideas, notation, worked
   examples, warnings, and course depth.
2. `source/book.pdf` verifies technical details and fills only gaps left by the
   lecture notes.
3. `.Codex/notes/source_inventory.md` and `m1_inventory.md` through
   `m6_inventory.md` are the current internal traceability and ambiguity
   ledgers.
4. Existing source files and tests establish implementation conventions, but
   they do not overrule the teaching sources.

The lecture structure is CH7, CH8, CH9, and CH10. M3, M4, and M5 are three
navigation units inside the single continuous CH9 argument; they are not three
independent source chapters.

## Non-goals

- Do not rewrite the course from scratch.
- Do not make the textbook the presentation template or expand the syllabus to
  match the book.
- Do not edit `dist/Digital_Communications.html` directly.
- Do not copy every handwritten sentence. Preserve the teaching logic and
  technical invariants while adapting the medium.
- Do not remove laboratories, questions, summaries, or useful supplemental
  explanations merely because they are not direct source units.
- Do not claim that a source statement is correct when the book, derivation, or
  an independent calculation contradicts it.
- Do not mix unrelated working-tree changes into a fidelity commit.

## Execution contract

`/uret` takes the first unchecked item, completes only that item, runs its
stated checks, changes `[ ]` to `[x]`, and commits the owned paths. Each commit
must include source changes and the rebuilt `dist/` artifact together.

Before each task:

1. Run `git status --short` and inspect diffs for every path the task will
   touch.
2. Treat every pre-existing modification as user-owned until proven otherwise.
3. Stage explicit paths only. Never use `git add -A` or a blanket source glob.
4. If a source ambiguity changes the intended mathematics or course scope,
   record it in the relevant inventory and stop that item without ticking it.
5. Report the numbers the checks actually print; never substitute expected or
   historical counts.

## Fixed technical invariants

- White Gaussian noise has two-sided PSD `N_0/2`; an orthonormal noise
  coordinate therefore has variance `N_0/2`.
- `Q(x)=0.5 erfc(x/sqrt(2))` and `sinc(x)=sin(pi x)/(pi x)`.
- MAP includes prior probabilities. It reduces to ML for equal priors under the
  stated model; minimum-distance detection also relies on the common-covariance
  AWGN likelihood.
- A full or intelligent union expression is an upper bound. The
  nearest-neighbour expression is generally a high-SNR approximation.
- The sampling theorem, 6.02 dB/bit rule, SER-to-BER conversion, modulation
  bandwidth comparisons, source-coding limits, and channel-capacity claims must
  carry their assumptions.
- A source correction must be recorded internally. It must not be silently
  presented as though the handwritten page stated the corrected result.

---

## Phase 0 - Reconcile the current workspace

The worktree already contains edits in the engine, scene, drill, notes, and
generated artifact layers. The inventories describe the snapshot inspected on
2026-08-18 and may already be partly stale.

- [ ] **P0.1 - Reconcile current diffs with the six inventories.** Read the
  current diffs of `build/src/82_scenes_m1.js` through
  `build/src/87_scenes_m6.js`, `build/src/89_sections.js`, affected drills,
  `notes/src/`, and `dist/Digital_Communications.html`. For every `partial` or
  `missing` inventory row, record whether the current worktree has already
  closed it, partly closed it, or not touched it. Save the read-only comparison
  in `.Codex/notes/worktree_fidelity_delta.md`; update inventory labels only
  when the evidence is direct. Do not modify student-facing content in this
  item. Check: every current modified teaching file has an owner/status entry;
  `git diff --check` is clean for the plan-owned diff.

- [ ] **P0.2 - Establish the source-coordinate model.** Document one canonical
  mapping with both PDF page numbers and chapter-local locators (`CH7 s.4`,
  `CH10 w.13`, and so on). Adopt the following low-blast-radius structure unless
  current code proves it unsafe: retain M1-M6 as navigation units, attach CH7,
  CH8, CH9 parts I-III, and CH10 as canonical lecture metadata, and do not
  renumber existing section addresses yet. Record downstream consumers before
  changing any visible numbering.

## Phase 1 - Make source coverage machine-checkable

- [ ] **P1.1 - Add a structured internal source map.** Create a tracked,
  non-student-facing map under `verify/` that records, for every teaching scene:
  scene ID, lecture chapter, PDF page range, chapter-local locator, book anchor,
  and classification (`faithful`, `adapted`, `supplemental`, or
  `approved-omission`). Do not expose source/audit wording in rendered scenes.
  Derive the map from the reviewed inventories rather than scraping OCR.

- [ ] **P1.2 - Add a source-coverage verifier.** Implement a verifier that
  checks schema validity, unique scene IDs, monotone lecture order inside each
  chapter, existence of every referenced scene, and disposition of every
  inventory unit. Provide a normal mode that reports unresolved rows during
  remediation and a strict mode that fails on `partial`, `missing`, or
  unapproved omission. Add focused tests containing at least one duplicate ID,
  missing scene, reversed source range, and unresolved unit.

- [ ] **P1.3 - Align chapter metadata without destabilizing navigation.** Make
  the CH7-CH10 relationship explicit in the internal section/source metadata.
  Preserve M1-M6 navigation and existing deep links unless a separate reviewed
  migration proves renumbering safe. Correct comments that claim the artifact
  and lecture notes already use identical chapter numbering when they do not.
  Check every contents, search, progress, print, and deep-link consumer.

## Phase 2 - Close source-fidelity gaps in dependency order

Each module item must close all of that module's `missing` rows and either close
or explicitly approve every `partial` row. A title match is not sufficient:
compare purpose, assumptions, notation, derivation steps, worked-example method,
conclusion, and named student mistake.

- [ ] **P2.1 - Repair M3, the conceptual bridge into CH9.** In
  `build/src/84_scenes_m3.js`, restore or explicitly omit the PDF-page-28 bridge
  among magnitude-phase, in-phase/quadrature, and complex-envelope
  representations. Retain the motivation for moving from waveforms to signal
  space. Restore the source's cosine/sine orthonormality bridge and decide
  whether the 8-PSK Gram-Schmidt homework belongs here or in M5; do not duplicate
  the derivation. Preserve the qualifications that equal geometry implies equal
  coherent-AWGN error behavior, not equal bandwidth or implementation. Rebuild
  the artifact and inspect every changed M3 scene.

- [ ] **P2.2 - Restore M4's missing exact-error worked reasoning.** In
  `build/src/85_scenes_m4.js`, carry the three-signal example from PDF pages
  46-49, or record an explicit pedagogical omission backed by an equivalent
  example. If restored, split it across enough scenes to keep each above the
  0.90 scale floor. The solution must construct the basis/constellation,
  determine regions, calculate conditional errors, and explain why different
  points have different vulnerability. Keep exact probability, full union
  bound, intelligent union bound, and nearest-neighbour approximation distinct.

- [ ] **P2.3 - Restore M5's image-only 4-ASK worked example.** In
  `build/src/86_scenes_m5.js`, preserve the PDF-page-60 outer/inner point
  counting, exact average SER, `E_s,avg=5A^2`, and the result that the
  nearest-neighbour count `3/2` gives the same expression in this case. Use the
  Given, Find, Method, Solution, Check structure. Reconnect the QPSK comparison
  of the three bounds to M4 so the source's method remains visible. Audit all
  high-SNR, Gray-mapping, “6 dB,” and bandwidth statements for their required
  qualifications. Correct the PDF-page-66 trend internally: for fixed M, error
  decreases as SNR increases.

- [ ] **P2.4 - Complete M2's pulse-shaping endpoint.** In
  `build/src/83_scenes_m2.js`, add or explicitly omit the FIR realization and
  transmitter/receiver square-root-raised-cosine split from PDF pages 26-27.
  Verify that the Nyquist condition is described as zero ISI at the sampling
  instants, not preservation of the whole waveform. Decide whether the polar
  NRZ and Manchester matched-filter examples require a worked scene or only a
  supporting comparison. Recheck every `N_0/2` variance and matched-filter
  optimality statement.

- [ ] **P2.5 - Resolve M1's remaining source depth.** In
  `build/src/82_scenes_m1.js`, decide whether the line-code PSD derivation is in
  syllabus scope. If not, record an approved omission and retain the source's
  qualitative DC, droop, and line-code comparison. Verify the Gaussian
  quantization example against PDF page 8, including overload tails; do not
  replace it silently with `Delta^2/12`. Confirm that the 6.02 dB/bit statement
  stays attached to the high-resolution/no-overload assumptions. Keep DPCM and
  delta modulation classified as artifact extensions.

- [ ] **P2.6 - Encode and test the CH10 source corrections.** In
  `build/src/87_scenes_m6.js` and the relevant verification code, preserve the
  visually confirmed entropy distribution `{0.7,0.2,0.1}`. Keep Code III
  `{0,01,011,0111}` classified as uniquely decodable but not prefix; add a small
  deterministic decoding test so the handwritten conclusion cannot return.
  Preserve the correct Kraft distinction: the inequality is necessary for a
  displayed prefix code and sufficient for the existence of a prefix code with
  those lengths, but it does not certify an arbitrary displayed assignment.
  Separate source coding, channel coding, and channel capacity. State
  arbitrarily small error below capacity rather than literal zero error at
  finite blocklength.

## Phase 3 - Synchronize all student-facing layers

- [ ] **P3.1 - Synchronize lecture-note editions.** Update the relevant
  `notes/src/cN.js` files from the corrected teaching sequence. Do not paste the
  interactive scene prose mechanically: keep the same definitions, notation,
  examples, assumptions, and order in a form that reads on paper. Rebuild
  lecture notes HTML and all four PDF editions.

- [ ] **P3.2 - Synchronize questions and solutions.** Review
  `build/src/92_drill_m1.js` through `97_drill_m6.js` for every corrected or
  newly restored concept. Add or revise questions only where the concept is
  examinable. Preserve 20 open-ended questions per module, 12 single-skill and
  eight full-length, with `options=0`; every solution remains Given, Find,
  Method, Solution, Check and names the likely mistake.

- [ ] **P3.3 - Close the source inventories.** Update the structured source map
  and `.Codex/notes/mN_inventory.md` ledgers from actual final content. No row
  may remain `missing` or `partial`. An omission is acceptable only when its
  reason, authority, and effect on assessment are recorded. Run the source
  verifier in strict mode and report its exact counts.

## Phase 4 - Full verification and visual review

- [ ] **P4.1 - Run syntax, build, and reproducibility checks.** Run JavaScript
  syntax checks first. Build the artifact twice from unchanged sources and
  verify that the second build leaves no new diff. Build the notes and all PDF
  editions. Do not attribute pre-existing worktree changes to these commands.

- [ ] **P4.2 - Run all eleven project gates.** Execute the commands below in
  the documented environment and record the exact numbers printed:

  ```bash
  for f in build/src/7*.js build/src/8*.js build/src/9*.js; do node --check "$f" || exit 1; done
  (cd build && node pw.js qa.js)
  (cd build && node pw.js labtest.js)
  (cd build && node pw.js textclash.js)
  (cd build && node pw.js mathscan.js)
  (cd build && node pw.js ../notes/mathscan.js)
  (cd build && node pw.js labwalk.js)
  (cd build && node pw.js seccheck.js)
  (cd verify && ../.venv/bin/python verify_scenes.py)
  (cd verify && ../.venv/bin/python verify_drills.py)
  (cd verify && ../.venv/bin/python verify_ber.py)
  .venv/bin/python tools/rule_check.py "build/src/8[1-9]_scenes*.js" \
    "build/src/9[2-8]_drill_m*.js" "build/src/91_*.js" \
    "build/src/70_labs.js" "build/src/7[1-9]_labs*.js" "notes/src/*.js"
  ```

- [ ] **P4.3 - Inspect rendered evidence.** Sweep the rebuilt lecture-notes PDF
  for literal TeX, generate screenshots, and visually inspect every changed
  scene plus the scenes immediately before and after it:

  ```bash
  pdftotext -layout dist/Lecture_Notes.pdf - | grep -nE '\$[^$]+\$|\\[a-zA-Z]+'
  (cd build && node pw.js shot.js)
  ```

  Check derivation order, reveal sequence, mathematical labels, clipped content,
  colour semantics, dark/light themes, and whether any new scene falls below
  the 0.90 scale floor. A green automated run does not replace this review.

- [ ] **P4.4 - Final evidence and repository audit.** Run `git diff --check`,
  inspect `git status --short`, and compare the final staged paths with the task
  ownership record. Report: source units covered/adapted/supplemental/omitted;
  scenes and labs; each gate's printed totals; PDFs built; screenshots inspected;
  remaining uncertainties; and any unrelated dirty-tree files deliberately left
  untouched.

## Completion criteria

The plan is complete only when all of the following are true:

- Every lecture-note unit in PDF pages 2-80 has a reviewed disposition.
- There are no unresolved `missing`, `partial`, or `verify` inventory rows.
- CH7, CH8, CH9, and CH10 continuity is represented accurately without breaking
  M1-M6 navigation.
- Every changed claim is supported by the lecture notes, the book, or an
  independent derivation, with conflicts recorded internally.
- All changed worked examples teach the method and name the likely mistake.
- Interactive and paper editions agree on definitions, notation, examples, and
  assumptions.
- The source-coverage verifier passes in strict mode.
- The project gates and PDF/render sweep pass with their actual reported totals.
- No unrelated user change is staged or committed.
