---
paths:
  - "build/src/10_style.css"
  - "build/src/60_plot.js"
  - "build/src/7*.js"
  - "build/src/8*.js"
  - "build/src/9*.js"
  - "build/textclash.js"
  - "notes/src/**/*.js"
---

# Figures, typesetting, and visual changes

Read `DESIGN.md` before changing a scene, figure, or style. Respect its LOCKED decisions. The palette
is defined across `build/src/10_style.css`, `build/src/60_plot.js`, and `build/textclash.js`; keep
those files consistent when changing it. Module 1 is the converted reference (`slide:true`); new
lecture-slide styles apply to a scene only once it carries that flag. Modules 2–6 are not yet
converted and keep their current look until they are.

**R7 — Figures and examples.** Worked examples use Given, Find, Method, Solution, Check. Label every
axis. Draw continuous-time signals as curves, discrete-time signals as stems, and impulses as arrows
whose height is the weight. An impulse arrowhead points away from the zero line: up for a positive
weight, down for a negative one. Draw every impulse through `Axes.impulse`, never with a hand-built
path. Every piece of mathematics in a figure is TeX with `tex:true`, never a plain string, Unicode
substitute (`∞ ² ₁ Σ ∫ − τ ω ⇒ → × · ≤ ≥`), or `italic:true`. Double TeX backslashes in JavaScript
strings (`'\\;'`, `'\\text{...}'`); a bare `;` or stray tab in a label can indicate a lost backslash.
No drawing may cross text; labels must not overlap. An axis name must not touch data, axes,
arrowheads, or ticks: widen `pad` rather than moving the name inside. Captions explain meaning, not
provenance. A legend is a card inside the plot, in a corner the traces leave free, never below or
beside it; in the dark theme its fill is a light step above the figure card, never darker. See
`DESIGN.md`, Figures, for the full mechanics.

**Card colours.** No two cards on a slide share a colour; a labelled equation counts as a card. A
teaching slide holds two to four tabbed cards; a fifth needs a `budget:` reason on the scene. Write
each card's `kind` for its meaning and let `toneCards()` in `build/src/90_app.js` recolour a repeat;
never set a card colour in scene data. See `DESIGN.md`, Information card.

**Practice questions sit on cards.** Every practice question, in every module, is drawn inside one
card (`.dr-page .quiz.drill`, styled like `.card`), from its code pill down to the worked solution.
Style it only through that rule in `10_style.css`; never per module or per question.

**The practice pager takes a typed question number.** The number in `Question N of M` is an input
field (`input.dr-n[data-drill-go]`) that jumps to the typed question on Enter or blur, clamped to the
module's range. It comes from the shared `drill` block in `90_app.js`; keep it when editing the
pager, and do not add a second navigation control per module.

**Sequences on a figure.** A figure that builds or takes apart a result in steps uses `fig.frames`
with Previous and Next buttons, and each press animates the change; it never uses a slider. Sliders
(`fig.live`) are only for a continuous parameter. The Previous/Next bar and its counter come from the
renderer; a scene never draws or styles its own. See `DESIGN.md`, "A figure played in frames".

**R8 — Typeset mathematics in every student-facing field.** Route eyebrows, equation labels, callout
titles, card tabs, worked-example keys, table heads, contents entries, and captions through `md()`. A
new block type in `build/src/90_app.js` or `notes/src/render.js` must route every text field through
`md()` in the same commit.

**R9 — Check these rules mechanically.** Run the relevant gates in `build-pipeline.md`. Inspect
screenshots after visual changes; gates cannot see every flaw.

**Laboratory font-size rule.** Before delivering a new or restyled laboratory, check computed sizes
against the laboratory type floor in `DESIGN.md`. Remove bare inline pixel sizes from its controls and
results. Inspect normal and projector views in both themes with the longest populated control state.
Record the projector fit factor and confirm it is at least 0.90 without clipped text. If larger type
causes a poor fit, reflow the controls or readouts, or split the scene; do not shrink the type back
down or apply an unverified font override to every laboratory.

**Laboratory figure-height rule.** A laboratory's plots fill their column (`DESIGN.md`, A slide).
Every laboratory, in a converted module or not, sets `root.redraw` in `mount()` and draws each desktop plot at
`gh(h)` from `LABS.KIT.GH(root)`; never hard-code a larger viewBox height to fill the column, because
the spare height differs between normal display and lecture mode. Check it in a screenshot of both
modes: the last plot ends within a few pixels of the foot of the control column.

**Phone and tablet rule.** Every scene, laboratory, code page and practice page works on a phone
held upright and on a tablet held upright; both get the one-column phone layout (`body[data-layout=phone]`,
`DESIGN.md`, The two layouts). A tablet on its side is a desktop: it gets the wide 1920×1080 stage,
unchanged. A style written for the wide stage (an inline `flex:0 0 auto`, a fixed width, a `1fr` track)
must not push anything past the edge of a 320 px screen; loosen it under `body[data-layout=phone]`,
never in scene data. After any change to a scene, laboratory or style, the phone sweeps in
`build-pipeline.md` report none on every line.

Keep the KaTeX macro lists in `60_plot.js`, `90_app.js`, and `notes/src/render.js` in step. `PLOT` and
`APP` are top-level `const`, not `window` properties; use their bare identifiers in Playwright
`page.evaluate`, and remember a probe reading `window.LABS` finds nothing even when `LABS` exists.

Never run blanket search-and-replace over `build/src/*.js`. JavaScript statement terminators and TeX
thin spaces use semicolons differently. Edit labels individually, then run
`node --check build/src/7*.js build/src/8*.js build/src/9*.js` — check every file the glob expands to,
since `node --check` only checks the first path it is given.

## Colour tokens

Cyan `C.in` (transmitted or source), amber `C.h` (channel or filter), green `C.out` (received or
detected), violet `C.mid` (intermediate: sampled, quantized, in transformation), red `C.err` (error).
Noise takes no colour — a hairline tone at low opacity. A figure never uses one of these for anything
else. `textclash.js` classifies a drawn element as guide, axis, or content by its colour; a palette
change that skips it leaves the gate measuring nothing while still reporting a pass.

## Traps met at least once in this repository

- A figure built at load time keeps the palette it was born with. Pass a function to `fig.svg` and
  `raw.html`, never a string built at module scope.
- The build is byte-reproducible. Building twice from unchanged sources leaves `git status` clean; a
  diff nobody authored means something is wrong.
- A figure rule can reach into typeset mathematics. `#scene-host svg` and `figure svg` make every SVG
  in their scope a full-width block, and KaTeX draws a tall square root as a surd whose tail is a
  small SVG. Giving those pieces any geometry other than KaTeX's own collapses the surd onto the
  expression under it. If either rule is touched, look at an equation with a root in it.
- A grid track written `1fr` is `minmax(auto,1fr)`. In the phone layout that lets one wide figure or
  one long formula push its track past the edge of the screen. Every single-column track there is
  `minmax(0,1fr)`.
- Overflow on one axis turns the other from `visible` into `auto`. A `.katex-display` given
  `overflow-y:hidden` becomes its own scroll container, so `phoneMath()` measures an overflow of zero
  on a formula that is actually running off the page.
- A label distance that is not measured in labels closes up when the labels grow. Every such distance
  in `60_plot.js` carries `LBLS`.
- Look at screenshots. Several bugs in this course and its sibling were invisible to every gate and
  visible at a glance.
