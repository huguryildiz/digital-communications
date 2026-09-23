# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Second-year undergraduate electrical-engineering students, many reading English as a second
language. They meet the material twice: projected in a lecture, with the instructor talking over it,
and alone, before a paper. The instructor is the second user: he presents from the artifact in a 16:9
room and needs each scene to work as a lecture slide.

## Product Purpose

A one-semester Digital Communications course in one interactive artifact built from one set of
sources: `dist/Digital_Communications.html` (seven modules, laboratories, practice questions with
worked solutions) plus lecture notes and their PDF. It is published as a static site behind a cover
page.

The artifact is the lecture deck. The lecture notes carry the long explanation. A student who wants
the full argument reads the notes; a student in the room reads the slide and listens.

The syllabus: sampling, quantization and PCM (M1); baseband transmission, the matched filter and
intersymbol interference (M2); the geometric representation of signals (M3); the optimal receiver in
additive white Gaussian noise, decision regions and the union bound (M4); digital modulation methods —
PSK, PAM, QAM, FSK (M5); an introduction to information theory — entropy, source coding, channel
capacity (M6). M0 is the opening: what the whole subject asks, and how to use the artifact.

## Operating Context

- Lecture room, 16:9 projector, read from the back row. Lecture mode raises the type scale.
- Laptop, independent study, either theme, any window shape.
- Phone or tablet, independent study: the artifact drops to a fluid single-column layout below the
  16:9 stage's usable width; see `DESIGN.md`, "The two layouts".
- Online, from the course site. Students open the course at its address; the PDF editions are offered
  as downloads.
- Print: PDF editions made from the notes pipeline.

## Capabilities and Constraints

- One HTML file, served by the site. It makes no network request of its own; the Python runtime for a
  code page's **Run** button, when built, is the one exception, loaded from the course site on first
  press.
- No analytics. Progress is stored on the device only.
- Fixed 1920×1080 stage, scaled to the window, with a fluid phone/tablet layout below that.
- Every number on a page is recomputed by a verification script (`verify/verify_scenes.py`,
  `verify/verify_drills.py`, `verify/verify_ber.py`); every label in every figure is swept for
  collisions (`textclash.js`). A design change that a gate cannot check is a change someone has to
  check by eye.
- The mathematics is fixed. A redesign never changes a formula, a number, a question setup, an
  address or a textbook anchor.
- Instructor material never reaches the published copy.

## Brand Commitments

Calm, rigorous and editorial. The interface makes a demanding technical course feel navigable, and
never competes with the mathematics. The artifact carries the same design tokens as its sibling course,
[Signals and Systems](https://github.com/huguryildiz/signals-and-systems) (local copy:
`~/Documents/GitHub/signals-and-systems`) — the two read as one publication.

The public cover page is the exception to "calm". It is dark and cinematic, built the same way as the
Signals and Systems cover: one pinned frame in which Figure 1 builds as the reader scrolls, under a
large serif title that changes with each step, and a row of facts below it. `DESIGN.md`, "The public
cover page", has the details.

The language is plain academic English. No promotional tone, no slogans, no sentence written to sound
impressive. `.claude/rules/content-writing.md` R1–R10 is the standard.

## Evidence on Hand

- Private reference material in `source/` (not in git, never reproduced or quoted).
- No testimonials, usage figures or outcomes data exist. Do not invent any.

## Product Principles

1. A scene is a slide. It carries what the room needs to see while the instructor speaks: a figure,
   the equations, and short cards. The paragraph belongs in the lecture notes.
2. A worked example beats a general theorem; where the two compete, the example wins.
3. Show the whole learning path before explaining one point on it.
4. Use interaction to disclose relationships, not to hide required content.
5. Keep every figure sparse enough to read at lecture distance.
6. Difficulty belongs to the mathematics, never to the English or the layout carrying it.
7. Name the mistake. Every worked example carries the error a student actually makes, said plainly.

## Engagement Rules

Module 1 is the worked example for these; the mechanics are in `DESIGN.md`, "Interaction on a slide".
Apply them as each further module is converted.

1. **Intuition before algebra.** A student first sees, hears or guesses what a signal does. The
   calculation comes after that, not first.
2. **Predict first.** Where a card already asks a question, it offers two to four choices
   (`note.ask`). The student commits to an answer before the reveal step shows the working.
3. **Move it.** When a parameter changes what the figure shows (a sampling rate, a distance, an
   `Eb/N0`), the figure gets a slider (`fig.live`). The default slider value draws the figure the
   slide had before.
4. **Connect it to everyday life.** One sentence ties the signal to something the student already
   knows. The sentence goes in the caption of the section's "… Around Us" gallery.
5. **Close with a quick check.** Before its summary, each converted module has one slide of six short
   predictions. None needs a calculation on paper, and each shows a one-sentence reason after the
   answer.
6. **Keep the rigour.** Interaction never replaces a derivation. Every derivation is still shown in
   full, and the practice questions stay open-ended. A slide must keep a fit of at least 0.90 in
   lecture mode, or it loses the interaction.

## Accessibility & Inclusion

Keyboard access to every control. `Motion: reduced` and `prefers-reduced-motion` give a complete still
frame, never a missing one. Text contrast of at least 4.5:1 in both themes, tab labels included.
Signal colours are chosen as colour-blind-safe pairs and are never the only carrier of meaning: a curve
is also labelled.
