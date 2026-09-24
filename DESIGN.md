---
name: Digital Communications
description: A lecture deck, lecture notes and practice questions for a one-semester course, in one design.
colors:
  canvas: "#FAF8F4"
  panel: "#FFFFFF"
  well: "#F2EFE8"
  ink: "#232B33"
  graphite: "#3B4650"
  muted: "#616B76"
  faint: "#939BA4"
  hairline: "#DCD7CC"
  hairline-strong: "#C2BCB0"
  coral: "#A0451C"
  slate: "#28567E"
  navy: "#12314E"
  signal-in: "#14707F"
  signal-h: "#C08422"
  signal-out: "#4A7A46"
  signal-mid: "#6A5A92"
  signal-err: "#A63B2A"
  tab-amber: "#8A5E12"
typography:
  display:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "74px"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "45px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.008em"
  body:
    fontFamily: "Inter, SF Pro Text, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.55
  card:
    fontFamily: "Inter, SF Pro Text, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.52
  label:
    fontFamily: "ui-monospace, SF Mono, JetBrains Mono, IBM Plex Mono, Menlo, monospace"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.12em"
rounded:
  sm: "3px"
spacing:
  s1: "8px"
  s2: "16px"
  s3: "24px"
  s4: "32px"
  s5: "48px"
  gutter: "44px"
  s7: "80px"
  page: "104px"
  flow: "18px"
components:
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.graphite}"
    typography: "{typography.card}"
    rounded: "{rounded.sm}"
    padding: "17px 22px 16px"
  card-tab:
    backgroundColor: "{colors.slate}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 12px 4px 10px"
  equation:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "16px 22px 16px 24px"
  figure-frame:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
---

# Design System: Digital Communications

This file holds every visual decision for the project. `CLAUDE.md` holds how to build and check;
`PRODUCT.md` holds who it is for. The source of truth for a value is the code: `:root` and
`body[data-theme=dark]` in `build/src/10_style.css`. Where this file and the code disagree, say so and
stop; do not pick one silently.

This design was carried over from Signals and Systems, this course's sibling, which built and locked
it first. Every colour, spacing and typography token below matches that course's own tokens; the two
artifacts read as one publication.

**Status of each part.** Sections marked **LOCKED** describe what is built and may not be changed
without the owner saying so. The slide language (the sections from *Rollout* to *A laboratory on a
slide*) is built in Module 1 and is locked with it; see *Module 1 is the reference* below.

### Module 1 is the reference — LOCKED

Module 1 carries `slide:true` throughout and is converted to the slide design described in this file.
Every other module (M2–M6) is converted to match it from this file and `.claude/rules/`, with no
design decision of its own. Where a module needs something Module 1 does not show, stop and ask; where
this file and Module 1 disagree, Module 1 is the evidence and this file is corrected. The reference
scene for each element is named where the element is described, using Module 1's own scene ids from
`build/src/82_scenes_m1.js`.

**Module 1 content and design frozen, 2026-09-24.** Module 1 runs from 1.0 to 1.9 and closes with
the chain from sound to bits (`m1-chain`), the quick check and the recall deck. Two sections are
surveys and carry no gallery, laboratory or code page: 1.7 (vector quantization) and 1.8 (speech,
audio and image coding). Every other teaching section ends gallery, laboratory, code. An audit on
that date found every Module 1 slide inside the figure and card budget, with a normal-view fit of at
least 0.90 except the gallery `m1-real-sampling` (0.895). It found no KaTeX error and no literal
mathematics in any Module 1 scene, and every stated number has a PASS line. The only text-collision
flags left in Module 1 are two on the animated opening `m1-open`, which predate the audit. A change to
a Module 1 slide now needs the owner's word, as for any other locked part.

A figure of stacked panels nests one `<svg>` per panel inside the figure's own `<svg>` (`m1-overload`,
`m1-pcm-bw`). Each panel keeps its own axes and coordinates, and `textclash.js` measures each nested
panel on its own.

## Overview

**Creative North Star: "The lecture deck of a careful department"**

A scene is a lecture slide: a title, a rule, two columns, a figure, the equations, and short
information cards. It is read from the back row of a 16:9 room while the instructor talks, so it
carries little prose and large type. The long explanation lives in the lecture notes.

The look is calm, rigorous and editorial: ivory paper or deep navy, a serif title, a plain sans body,
small uppercase mono labels, hairline rules, a 3 px radius. There is no gradient, no glass, no
decorative shadow, no emoji, no hero number. Colour is spent on meaning: the five signal colours say
what a curve *is*, and the card colours say what a card *does*.

**Key characteristics**

- One slide, one figure, two to four tabbed cards. See "A slide" under Layout.
- One idea a card, one or two short sentences a card.
- The stage is full: nothing top-heavy, nothing clipped.
- The same slide works in both themes and in lecture mode without a second design.

## Colors

### Signal colour semantics — LOCKED

Reused unchanged in every module, in every figure, in the artifact and in the notes:

cyan `#14707F` (`C.in` / `--sig-in`) transmitted signal or source symbol · amber `#C08422` (`C.h` /
`--sig-h`) channel or filter · green `#4A7A46` (`C.out` / `--sig-out`) received or detected output ·
violet `#6A5A92` (`C.mid` / `--sig-mid`) intermediate quantity — sampled, quantized, in transformation
· red `#A63B2A` (`C.err` / `--sig-err`) error or misconception.

**Noise takes no colour.** It is drawn as a hairline tone at low opacity, never one of the five
tokens. A decision region is a low-opacity fill of the colour of the symbol it decides for.

A figure never uses one of the five for anything else. A card may borrow green for a solution and red
for a common error because those meanings agree; it never borrows cyan or violet.

### Surface and accent tokens — LOCKED

| | light | dark |
| --- | --- | --- |
| canvas | `#FAF8F4` | `#0E1621` |
| raised panel | `#FFFFFF` | `#1A2634` |
| ink | `#232B33` | `#E6E2D9` |
| hairline | `#DCD7CC` | `#27333F` |
| coral, editorial emphasis | `#A0451C` | `#E09A6A` |
| slate, metadata | `#28567E` | `#8FB8DC` |
| navy, module-opening and synthesis scenes only | `#12314E` | `#080F18` |

The dark page is a deep navy, not a warm brown-black. In the dark theme the signal tokens are light
tints: cyan `#4FBECE`, amber `#E5B255`, green `#82C27B`, violet `#AC99DC`, red `#E8785F`.

**Three places hold these values and must move together:** `:root` and `body[data-theme=dark]` in
`build/src/10_style.css`, `LIGHT` and `DARK` in `build/src/60_plot.js`, and the token lists in
`build/textclash.js`. The collision sweep classifies a drawn element as guide, axis or content by its
colour, so a palette change that skips `textclash.js` makes the gate report on colours the artifact no
longer draws.

`notes/src/notes.css` still carries an earlier, lighter-only palette. The lecture notes and the
artifact are therefore not guaranteed to be the same colour; this is a known gap, not a decision.

### The public cover page

Redesigned on 2026-09-24 on the pattern of the Signals and Systems cover
(`~/Documents/GitHub/signals-and-systems/web/index.html`); the two share the layout and differ in
their figure, their text and their backdrop. The styles are inline in `web/index.html`, with no web
font and no stylesheet request (`site.css` and the old scope, `scope.js`, were removed). The page is
dark only: ground `#070C13`, ink `#E6E2D9`, hairlines in ink at 13% and 28%, coral `#E09A6A` for the
nav dots and the `+` on the figure label, and the dark-theme signal tints for the traces. The cover is
the one place where the rule against hero numbers does not apply; it has no gradient text, no glass
and no neon.

**The frame.** The first 300vh is one pinned stage with four corner marks, like a viewfinder. It holds
the course name and links to the modules and the documents; on the left the label `Figure 1 ·
section 2.3`, a large serif title whose second line is italic, one caption sentence, `Open the course`
and `Download the PDFs`; on the right Figure 1, frameless, with a `+` label naming the trace and its
reading; a vertical label on the right edge; and at the foot the step counter, a timeline whose marks
(Symbols, Channel, Error rate, Documents) scroll to their step, and a GitHub button linking the
repository. The titles are "Digital *Communications.*", "Through *the noise.*" and "How often *it is
wrong.*". On a phone the caption, the second link and the side label are hidden.

After the frame: the four facts as large serif numerals, the seven modules as a two-column list, the
three PDFs, and a footer with the copyright line and the GitHub button again.

**Figure 1** (`web/fig.js`) is section 2.3, the decision and its error, in three steps driven by the
scroll position. Twelve bits leave as a Manchester waveform s(t) in cyan; the channel adds white
Gaussian noise and the received r(t), in green, roughens as Eb/N0 falls from 16 dB to 4 dB; then
Pb = Q(√(2Eb/N0)) for antipodal signalling is drawn in red on a log axis, with the operating point
moving from 4 dB (1.25 × 10⁻²) to 10 dB (3.87 × 10⁻⁶). The noise is one seeded Gaussian realisation,
drawn with a standard deviation of 0.55/√(Eb/N0) of the pulse height: proportional to the true one,
scaled for the eye. The figure moves only when the reader scrolls, so it needs no reduced-motion
branch.

**The facts row** is written by hand, one `data-fact` attribute per number. `web/sitecheck.js` counts
the same four things in the published artifact (modules, scenes, scenes whose id matches `-lab-x`,
practice questions) and fails when a number on the cover disagrees.

**The document images** are the real PDFs: each card shows page 1 and one inside page behind it
(lecture notes page 22, workbook page 6, formula reference page 3), rendered with
`pdftoppm -r 72 -jpeg -jpegopt quality=80 -singlefile -f N -l N` into
`web/img/{ln,wb,fr}_{cover,page}.jpg`. Re-render them when those pages change.

The backdrop is `web/grid.js` (Radiant Shaders, "Kinetic Grid", MIT; see `THIRD_PARTY_NOTICES.md`),
inside the pinned frame, blended with `screen` at opacity .5 and masked to the left third so it never
runs through the figure. It does not take pointer input on this page.

## Typography

Serif for the display and scene titles, sans for everything read as a sentence, mono uppercase with
wide tracking for labels: the eyebrow, a card tab, an equation label, the key of a worked-example row.
Mono is used for labels and addresses only, never for running text.

| role | size | notes |
| --- | --- | --- |
| display `h1` | 74 px serif 400 | module openings |
| scene title `h2` | 45 px serif 400 | topic-style heading, never a sentence |
| lede | 23.5 px serif italic | one sentence under a title, used sparingly |
| body | 19 px / 1.55 | max width 900 px |
| card body | 24 px / 1.52 | slide cards (`.scene.slide .note`) |
| label / tab | 13.5 px mono, `.12em`, 600 | card and equation tabs |
| equation | 19 px, KaTeX at 1.30 em, in every scene, laboratory and display mode; no `lg` or `sm` size | scales with `--ts`; see Equation |
| figure caption | 18 px / 1.45 on converted slides and converted-module laboratories | unconverted scenes remain 14 px |

**Every size is written `calc(Npx * var(--ts))`.** `--ts` is 1 in normal display and 1.36 in lecture
mode (`body[data-display=projector]`). A size written as a bare pixel value does not grow in the
lecture room, which is the one place it has to.

**Every scene title reads at one size.** The eyebrow and the scene title (`h1.display`, `h2.title`)
keep their table sizes on every scene, including a dense scene that `fitScene()` scales down. The fit
sets `--hk` = 1/k on the column, and the eyebrow, the titles and the title rule multiply their sizes
by `var(--hk,1)`, so the transform takes back exactly what `--hk` added. Nothing else in the column is
exempt from the fit.

**Laboratory type floor.** When a laboratory is authored or restyled, control and result labels are at
least 16 px, segmented choices at least 17 px, live and result values at least 20 px, and explanatory
prose at least 19 px at `--ts:1`. These are source sizes, all multiplied by `var(--ts)`; inline pixel
sizes do not qualify. Inspect populated, long-text states in both themes and display modes at
1920×1080. In lecture mode the scene must keep a fit factor of at least 0.90 with no clipping. Reflow
controls or results, or split the laboratory, before reducing type.

**A label frame does not rewrite the mathematics it carries (R8).** The label classes are uppercase
with wide tracking, and both are inherited: `text-transform` turns `a_k` into `A_K` and
`letter-spacing` pulls an expression apart. One global rule in `10_style.css`,
`.katex{text-transform:none; letter-spacing:normal}`, resets both for every label class at once. Do
not remove it, and do not set either property on a `.katex` subtree.

## Layout

### The stage — LOCKED

- **One file, opened from the site.** No analytics, and no network request of its own.
- **Fixed 1920×1080 stage**, scaled to fit the window and centred. A window that is not 16:9 shows
  bands in the page colour above and below; accepted, because the lecture room is 16:9. The one
  exception is the practice-question page (below, *Practice questions*): there the stage keeps the
  window's width scale, grows downward to the window's foot and sits at the top.
- Scene padding `54px 104px 74px`; the content box under the padding is 952 px tall.
- `fitScene()` scales an oversized scene down to a floor of 0.82 (0.70 in lecture mode). It is a
  safety net, not a licence to overfill: a scene that needs below about 0.90 is split instead. On the
  floor, what is left is taken from the figures in proportion to their height, and a scene that gives
  up more than 3% of its figure height marks itself `data-capped`. `qa.js` names both under `dense`.
  Reaching that rescue is the signal to split the scene.
- **Radial and orbital compositions** are reserved for course maps and synthesis scenes.

### The two layouts — LOCKED

The artifact is one document with two layouts, and `body[data-layout]` says which is in force. The
wide one above is the original. On a screen that cannot carry that basis (under 760 px width, or under
480 px height with a coarse pointer, or up to 1024 px wide upright with a coarse pointer) the stage is
dropped rather than shrunk further: the scene becomes one fluid column of real pixels that scrolls, the
contents rail becomes a drawer, and the header hands its settings to the foot of that drawer. None of
the gates in `.claude/rules/build-pipeline.md` reads this layout; `mcheck.js` and `mshot.js` do.

### Rollout: a scene opts in

Everything in the slide language is scoped to scenes that carry `slide:true`. The renderer puts the
class `slide` on the scene host and every new rule is written under `.scene.slide`. An unconverted
scene keeps its current look and its current fit factor, so the gates stay green and the site stays
publishable after every commit. When the last module is converted, one final change removes the flag
and edits the base rules. Until then the new rules out-specify the old ones and do not replace them.

### Filling the stage — built in Module 1

A sparse scene would sit at the top of the stage with a third of it empty, because a plain fit only
scales down. Two parts fix this:

1. Every teaching slide's `cols` block carries `fill:true`. Its columns stretch to the full height of
   the content box and distribute their children over it (`justify-content:space-between`), so the air
   is shared between the cards and not left under them.
2. The figure takes the slack. A `fig` with `grow:true` is grown by `growFigures()` (called from
   `fitScene()` in `90_app.js`) into the room that is left, up to a cap, only at k = 1 on a slide
   scene; `data-capped` marks the opposite case.

### A slide

Title, then a full-width hairline under it with a 150 px coral segment, 2 px, at its left end. Then two
columns in the ratio 5:7, written `{t:'cols', ratio:'c-5-7', fill:true, left:[…], right:[…]}`: the
figure (with `frame:true, grow:true`) and its caption on the left, the given data, the method, the
steps and the result on the right. Every Module 1 teaching slide uses this split — for example
`m1-spectrum`, the sampled-spectrum key result. The gallery keeps `c-8-4` for its 2×2 grid (see
`m1-real-sampling`), and the navy opening keeps `c-6-6`. Reveal steps stay; a slide builds in the order
the instructor speaks.

**Figure and card budget.** A teaching slide carries exactly one figure and two to four tabbed cards.
A tabbed card is every `note` (the prediction card included) and every `eq` with a `label`; an
unlabelled `eq` is free. The figure is required. A slide outside the budget states its reason in a
`budget:'...'` field on its scene. More than that means the slide holds more than one idea and is
split. Laboratories, galleries, code pages and navy scenes keep their own layout and are outside this
budget. `build/slidebudget.js` counts figures and tabbed cards on every `slide:true` scene and lists
the slides outside the budget (see `.claude/rules/build-pipeline.md`, Advisory tools).

A laboratory uses the full remaining stage height. Its main columns stretch to the bottom of the
scene, and stacked controls, readouts and explanations distribute through that height. Do not leave a
laboratory compressed against the title with an unused lower half.

A dense scene is split, one example or one idea a slide. Splitting is a renumbering: it is an edit to
`build/src/89_sections.js` and nothing else carries an address.

Spacing is tight inside a card and generous between cards, with 30 px above every card so a tab never
touches the block above it.

## Elevation & Depth

Flat. Depth is tonal: canvas, raised panel, sunken well. There are no shadows on cards, figures or
equations. The paper grain on the stage is the only texture, and it never sits over an equation.

## Shapes

One radius, 3 px. Hairline borders, 1 px. The only thicker strokes are the 3 px left edge of a card or
an equation and the 2 px coral segment under a title. A block outline or a summing junction in a
figure has no fill at all; the label halo does the separating.

## Components

### Information card — built in Module 1

The card is a restyle of the existing `note` block, so every note in the course takes it with no
content change. The markup stays `<div class="note KIND"><span class="note-h">HEAD</span>…</div>`.

- Body: raised panel tinted 4% with the kind's colour, 1 px hairline border, 3 px left edge in the
  kind's colour, 3 px radius, padding `17px 22px 16px`, 24 px type.
- Tab: `.note-h` becomes a filled tab on the card's top-left edge, outside the reading column. Mono
  13.5 px uppercase, `.12em`, weight 600, padding `4px 12px 4px 10px`, top corners rounded.
- Icon: one drawn set, 15 px, 1.6 px stroke, as an inline SVG `mask-image` data URI on
  `.note-h::before` so it takes the tab's ink.

| kind | colour | icon | used for |
| --- | --- | --- | --- |
| `def` | slate | bookmark | Given, Method, Check, a definition |
| `ok` | green | check | Solution, a result |
| `warn` | amber; tab fill `#8A5E12` in the light theme | lightbulb | an interpretation, a thing to notice |
| `err` | red; tint 8% | warning triangle | Common error, a misconception |

**No two cards on a slide share a colour.** A slide holds at most four cards, and each takes its own
colour. A card keeps its kind's colour while that colour is still free on the slide; a repeat takes the
first free tone in the order slate, plum (`#8B3A62`, dark `#D98CB3`), graphite (`#5E5850`, dark
`#C4BDB2`), then amber and coral for a fifth card. Green and red are never handed out this way, because
they mean a solution and an error. A labelled equation has a tab like a card, so it counts as one:
`draw()` in `build/src/90_app.js` applies this through `toneCards()`, which sets `data-tone` on the
repeat, so scene data never names a colour. A quick-check grid of six cards keeps its own form and is
outside the rule. Reference: `m1-quant-b`, the mid-rise/mid-tread comparison panel.

### Equation

Raised panel, hairline border, 3 px coral left edge. An equation with a `label` takes the same tab as a
card, in coral, no icon: `Step 1 · …`. `.eq.key` adds a faint coral tint. `.eq.plain` has no frame.

Every equation block sets its mathematics at one size: 19 px with KaTeX at 1.30 em. An equation wider
than its column is the one exception: `fitScene()` in `90_app.js` sets it smaller until it fits, down
to 0.75 em, so it never runs into the figure beside it. A formula that reaches that floor is too long
for its column and belongs split over two lines.

### Worked example

Given, Find, Method, Solution, Check (R7). On a slide these are cards, not the rows of a `wex` ladder:
`Given` and the `Find` line share one card with a hairline between them, each step is a labelled
equation, `Solution` is a green card, and `Check` or `Common error` closes the column. Reference:
`m1-ex-pcm`, sample–quantize–encode as a step strip.

### Inside a card — one example each in Module 1

Seven forms that give a card or an equation a different shape for a different job. None is a block of
its own: each is a class inside a card's `html`, a TeX construct, or a flag on an `eq` block, so the
slide budget counts it as the card it sits in and `md()` still reads every text field.

| Form | Markup | Use it for | Module 1 example |
| --- | --- | --- | --- |
| Annotated equation | `\underbrace{…}_{\text{name}}` in the TeX | naming the parts of one formula; at most two braces a line | `m1-lloydmax`, the levels and boundaries of the quantizer function |
| Comparison panel | `<div class="cmp">…` | two cases read side by side; one or two sentences a side | `m1-quant-b`, mid-rise against mid-tread |
| Property chips | `<span class="chips">…` | a verdict on named properties, after the sentence that proves it | `m1-ex-gauss-b`, where the quantization error goes |
| Step strip | `<ol class="steps"><li>…</li></ol>` | a procedure of two to four moves, one line a move, in a `Method` card | `m1-ex-pcm`, sample, quantize, encode |
| Key result | `eq` with `result:true`, label `Key result · …` | the one result a module carries forward; at most one a slide | `m1-spectrum`, the sampled spectrum as a sum of shifted copies |
| Margin note | `eq` with `side:true` | the reason for a short equation, beside it; the equation must fit half the column | `m1-theorem`, the sampling theorem's rate condition |
| Value chip | `<span class="val">…` | the single number a solution ends on, with its name | `m1-sqnr`, the SQNR legend value inside the plot |

Colours come from existing tokens: the chips take the `ok` and `err` card colours, the rest coral and
the rule tones. A sticky note (tilted, shadowed, paper yellow) was considered and rejected: it breaks
the flat surface, the single radius, and the no-shadow rule.

### Interaction on a slide — built in Module 1

Three additions to existing blocks. None is a block of its own, so the slide budget still counts one
figure and two or three cards. Each is rendered in `build/src/90_app.js` and styled at the end of
`build/src/10_style.css`; every text field goes through `md()`.

- **A prediction in a card (`note.ask`).** A card that already asks a question can carry
  `ask:{key, q?, choices, answer, why?}`. The choices are buttons under the card text. The first click
  marks the right choice green with a check and a wrong pick red with a cross and a strike. `why` is
  optional; when given, its line is laid out from the start and made visible on the answer, so nothing
  on the slide moves. Every teaching slide carries one such card with the head **Given** (exceptions in
  `.claude/rules/content-writing.md`). Reference: `m1-theorem`, the sampling-rate prediction.
  **The ringed letter is the one form for a lettered choice anywhere in the artifact**: a `note.ask`
  choice, a laboratory's classification buttons, and any later quiz or drill option. The letter is
  mono, coral, in a circle with a 55% coral ring, sized in `em`; on hover the ring fills coral and the
  letter turns to paper.
- **Sliders under a figure (`fig.live`).** `live:{controls:[{k, label, min, max, step, v, show?}]}`.
  `svg` then takes the current values, `svg:v=>…`, and falls back to the default when `v` is absent. A
  slider is only for a continuous parameter the reader explores. Reference: `m1-cases`, the sampling
  rate slider across the three cases.
- **A figure played in frames (`fig.frames`).** `frames:{labels:[…], ms?}`. A figure that builds or
  takes apart a result in a sequence of moves uses *Previous* and *Next*, never a slider. Each press
  plays the change as an animation: `svg:v=>…` receives `v.frame`, running continuously from the old
  index to the new one, so the figure must be written for a fractional frame. Reduced motion jumps
  straight to the new frame. Frame 0 is the printed figure. Reference: `m1-spectrum-b`, one copy of the
  spectrum per impulse.
- **Sound under a figure (`fig.listen`).** `listen:{items:[{label, sound:v=>({f, dur})}]}`. `f` is the
  signal as a function of seconds, from the same formula the figure draws. The renderer samples it with
  Web Audio, sets one peak level, adds a 6 ms fade at each end and plays it once.
- **A sketch on a figure (`fig.sketch`).** `sketch:{label?}`. The reader draws on the axes with the
  pointer, then presses *Show the answer*. The figure's `svg` marks its data area with an invisible
  `<rect class="sk-area">` and wraps the answer in `<g class="sk-key">`. The reader's ink is coral,
  drawn under the answer so the two can be compared.

Sliders, sound and sketch buttons share one row under the figure (`.fxbar`); the everyday link goes in
the caption, one sentence. Control labels are at least 17 px, values 20 px, all times `--ts`.

A **quick-check slide** closes a module before its summary: six `note.ask` cards in a 3×2 grid, each
answerable in a few seconds. It carries `budget:` because it has no figure. Reference: `m1-quick`. The
module's practice questions stay open-ended.

A **module summary is a recall deck** (built in Module 1). Each result the module carries forward is
one card: the front is a short question in the lede's serif italic, the back is the answer in card body
type, one or two sentences. The student answers first, then clicks the card to check. The scene calls
it through a raw block, `{t:'raw', html:()=>RECALL.deck(id, cards, {cols})}` with
`cards = [{q, a, tag?, glyph?}]`. Reference: `m1-synth`, the Module 1 summary deck.

- Both faces share one grid cell, so a card is as tall as its longer face and opening it moves nothing.
- A bar above the deck counts `Recalled k of N` and holds one `Show all / Hide all` button.
- The answer must stand without its question: when the front is only a name, the answer opens with
  that name in bold, `<b>Aliasing.</b> …`.
- `glyph` is an optional inline SVG sketch, about 92×44 in viewBox units, in the dark-page signal
  tints because summary pages are navy.
- `tag` is a short mono label that sorts the cards. `cols:2` suits short answers; long answers take one
  column.

### Code pages — a rule for every converted section

Each teaching section closes with a code page, after its laboratory: gallery, laboratory, code. The
page is a scene with the id shape `m<N>-code-<name>`, address `<section>.C`. It pages through the
section's programs one at a time: numbered program tabs across the top, the code on the left, and on
the right what the program does, a **Try it** card (`warn`) with a change to predict before running,
and the output. It carries `budget:` because the program draws its own figure. The scene calls it
through a raw block, `{t:'raw', html:()=>CODEBANK.page('<scene id>')}`.

- **Where the code lives.** `build/src/7?_code_m<N>.js`: `CODE_M<N>`, one entry a program keyed by a
  short name, and `CODE_BANKS_M<N>`, the list of programs on each code page. An entry is
  `{title, what, try, out, m, py}`; `title`, `what` and `try` go through `md()`, the code is plain
  text.
- **What a program is.** It draws a signal from the section and prints the number the section
  computes, with the same wording in both languages, so `out` is one text for both. 10 to 21 lines,
  the section's variable names, English comments. MATLAB uses no toolbox; Python uses NumPy and
  Matplotlib only.
- **Figures do not link to it.** The code page is reached as the last scene of its section.
- **Check.** `verify/code_check.py` runs every entry in MATLAB and in Python and compares what each
  prints with `out`.
- Module 1's scene ids already name six code pages in `CONTENT.SECTIONS`
  (`build/src/89_sections.js`): `m1-code-sampling`, `m1-code-reconstruct`, `m1-code-quant`,
  `m1-code-sqnr`, `m1-code-companding`, `m1-code-pcm`. The corresponding `build/src/7?_code_m1.js`
  file with their `CODE_M1` and `CODE_BANKS_M1` entries does not yet exist; write it before the code
  pages can render or pass `code_check.py`.

### Title icons

A scene that is not a teaching slide carries a drawn icon at the left of its title, so its kind reads
at a glance. The icon is a coral stroke (24-unit grid, 1.7 stroke) in a square of 1.04 em with a 1.5 px
coral border, the one 3 px radius and a 7% coral tint. It is chosen from the scene id in `TITLE_ICONS`
(`build/src/90_app.js`): `-lab-` a flask, `-code-` the `</>` brackets, `-real-` a globe, `-drill` a
pencil, `-quick` a bolt. Teaching slides, openings and summaries have none.

### Heading icons

Every small mono heading that labels a block inside a panel carries a drawn icon at its left, in place
of the tick. The icon is a coral stroke (24-unit grid, 1.8 stroke) at 1.4 em, drawn as a CSS mask on
`.hi::before`. A heading takes it with two classes, `hi` and the role. A new role adds one `.hi-*` rule
to `build/src/10_style.css`; it does not reuse an icon that already means something else.

### A laboratory on a slide — built for Module 1's laboratories

A laboratory scene carries `slide:true` like any other slide, and its text follows the card language
rather than a plain stack. The rule applies to Module 1 now; the laboratories of Modules 2–6 keep their
current look until their module is converted.

- Every derivation, verdict and note that the laboratory draws is a card. A computed equation takes a
  coral tab that names what it computes; a note keeps its kind's tab and icon (`ok` for a result,
  `warn` for a trap or a counterexample). The equation that restates the current signal at the top of a
  column stays untabbed: it is a readout, not a step.
- Type is the Module 1 laboratory scale: control labels, readout keys and tabs 16 px, control values
  20 px, readout values 21 px, card text 19 px, the signal equation at the top 22 px, all times `--ts`.
  Plot text grows by narrowing the viewBox, not by a font override.
- The laboratory must fit at k = 1 in normal display. When the tabs push it over, shorten it before
  accepting a scale-down: pair two sliders in one row, drop the doubled flow gap inside a stack, move a
  verdict under the figure where the column has spare height, or lower a stacked plot's viewBox
  height.
- The lecture-mode floor of 0.90 is the target for every new laboratory. Reflow controls or results, or
  split the laboratory, before reducing type; measure the actual fit factor with `build/fitlist.js`
  rather than assuming it.

### Practice questions

A module's practice questions show one question at a time under a pager. The page scrolls; it is never
scaled.

- **The page reaches the foot of the window.** On a window taller than 16:9, `APP.fit()` sets the
  stage height to the window height divided by the width scale and places the stage at the top.
- **The counter is a pill.** `Question 13 of 20` sits in a rounded pill (`.dr-count`): mono 16 px,
  muted, on `--paper-2` with a `--rule-strong` border. The current number (`.dr-n`) is coral, semibold
  and 1.2 em.
- **The current number is a field.** `.dr-n` is a number input (`data-drill-go`): the reader types a
  question number and Enter, or leaving the field, jumps there. A number out of range is clamped to
  the first or last question.
- **The question's code is a coral pill.** The question id above the statement (`.drill .qid`) is mono
  15 px semibold, coral, on a 12% coral fill with a 45% coral border.
- **Every question sits on a card.** The question (`.dr-page .quiz.drill`) is one raised panel, the
  same as `.card`. A practice question is never laid out as bare text on the page background.
- **The worked solution is a column of information cards.** `solCards()` in `90_app.js` splits `sol`
  at its `<b>Given.</b>`, `Find`, `Method`, `Solution — …`, `Check` heads and draws each as the slide
  card: Given with Find under a hairline (slate), Method (slate), one green card per `Solution` head,
  Check (slate), and `err` as a red `Common error` card.

### Eyebrow

The band above the title carries the module, the scene's address in coral, and, where verified, a
textbook anchor as a chip: an open book drawn as inline SVG (`CONTENT.BOOKICON`), then `CH1.1`. The
anchor never reaches a reader as a bare address.

### Figures — LOCKED

- **Axis names live outside the data area**: the independent variable under it, the dependent variable
  above it. `Axes` widens the bottom or top margin by itself when the given `pad` is too small. Every
  label carries a halo in `--fig-halo`. Do not move labels back inside the data area.
- **`xlabel` and `ylabel` are TeX source**, typeset with KaTeX. Words go in `\text{...}`, Greek letters
  are `\tau`, `\omega`, and `\operatorname{Re}` is the house spelling.
- **`texName` typesets every other piece of mathematics in a figure**, anchored on `xLeft`, `xMid` or
  `xRight` at a baseline. In `blocks()` a label that is mathematics is marked `tex:true`.
- **Every piece of figure mathematics is TeX (R7).** Never a plain string, never a Unicode substitute.
  Mixed text and mathematics is one TeX string with the words in `\text{...}`.
- **Nothing written in a figure is crossed by anything drawn in it**, and no label sits on another, at
  any step. `textclash.js` fails on any contact, and an axis name fails on any hit at all.
- **A trace stays inside the data area.** `curve()` and `poly()` are clipped to it, widened by
  `CLIP_PAD`.
- **A figure belongs to the palette it is drawn in.** No figure code carries a page, plate or ink
  colour of its own: `PLOT.COL` holds them and `setTheme` swaps them.
- Continuous-time signals are curves, discrete-time signals are stems, impulses are arrows whose
  height is the weight. Every quantitative axis is labelled. A multi-trace plot also carries a legend.
- **Legend type.** A legend is set at 19 px (21 px in projector mode). The swatch is 26 px. Size is set
  once on `.legend` in `10_style.css`.
- **Legend placement.** A legend sits inside the plot it keys, as a small card in a corner the traces
  and annotations leave free. A scene writes it as a `legend` block right after its `fig`. Reference:
  `m1-sqnr`, the SQNR legend inside the plot.
- Signal traces use the semantic palette, never arbitrary series colours.
- A caption says what the figure means, never where it came from.

## Do's and Don'ts

**Do**

- Put a figure on every slide that has a signal or a system in it.
- Cut a paragraph to one card of one or two sentences, and move what is lost to the lecture notes.
- Split a scene that holds two examples.
- Multiply every type size by `var(--ts)`.
- Route every text field a renderer accepts through `md()` (R8), a tab and a caption included.
- Re-run all the gates after any style change: a restyle changes the fit factor of every scene.

**Don't**

- Don't add a block type where a restyle of existing markup will do.
- Don't use a signal colour for decoration, or cyan and violet for a card.
- Don't add shadows, gradients, glass, emoji, or a second radius.
- Don't set `text-transform` or `letter-spacing` on a `.katex` subtree.
- Don't hard-code a page or ink colour in figure code or in a card.
- Don't let the artifact and the lecture notes drift further: a card added to `10_style.css` is owed
  to `notes/src/notes.css`.
- Don't write a sentence to sound impressive. The copy rules are in
  `.claude/rules/content-writing.md`.
