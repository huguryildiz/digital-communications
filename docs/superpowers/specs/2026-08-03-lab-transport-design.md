# Laboratory transport — design

Date: 2026-08-03
Status: approved, not yet implemented
Repository: `~/Documents/GitHub/digital-communications`

Four laboratories gain a time axis: the reader presses play and the figure develops instead of
appearing finished. This document is the design record; the implementation plan is written
separately.

This is a v1.1 change. Version 1.0 is complete and all eleven gates are green, so every decision
below is made to keep them green rather than to renegotiate them.

---

## 1. What is being built

A **transport** — play, step, reset — added to the laboratory kit and used by four laboratories:

| Laboratory | What develops over time |
| --- | --- |
| C · The matched filter | the filter sweeps across the pulse, the output curve is drawn as the overlap accumulates, then the sampling instant walks to the peak |
| B · PCM, DPCM and delta modulation | the coded waveform is built one sample at a time, so slope overload is watched rather than deduced |
| H · Error probability against SNR | the trial count climbs and the measured points settle onto the closed form |
| J · Building a Huffman code | already staged by hand; the transport drives the existing control |

The remaining six laboratories are untouched. Animation there would be decoration, and the project
forbids decoration: the public page's own note calls its two moving parts *"honest instruments
rather than ornament"*, and the same test applies inside the artifact.

### What is deliberately not built

- **No speed slider.** `commsyslab` has one, from 0.25× to 8×. The right tempo differs per
  laboratory and is a thing the author knows and the reader does not, so it is fixed per laboratory
  and not exposed.
- **No looping.** Each animation runs once and stops on its final frame. A figure that restarts
  forever is a distraction during a lecture and burns a core while nobody is looking at it.
- **No autoplay.** Nothing on the page moves until the reader presses play. §6 explains why this is
  a correctness requirement and not a preference.
- **No second drawing path.** §3 explains why.

---

## 2. The one drawing path

The rejected alternative is worth recording, because it is the obvious one.

An animation could carry its own light renderer and call the laboratory's full `draw()` only when
the transport stops. It would be faster. It is refused because it makes **two drawings of one
quantity**: when the mathematics is corrected, one path is updated and the other is not, and the
gates read only one of them. The rule the public page is already held to —

> the error probability is `Q(√(2 Eb/N0))` computed on the page, so the picture and the number
> cannot drift apart

— is the same rule here. **Every frame of every animation goes through the laboratory's existing
`draw(root)`.** A laboratory that animates has exactly as many drawing paths as one that does not.

Cost of the rule, measured rather than assumed:

| Laboratory | Work in one `draw()` | Verdict |
| --- | --- | --- |
| J | five merges over five leaves | free |
| B | 256-sample recursion | free |
| C | correlation, 512 × 513 products ≈ 2 ms | cache it, §5 |
| H | 11 marks × 20 000 trials × up to 16 distances ≈ 3.5 M operations | must accumulate, §5 |

Only H genuinely cannot redraw per frame, and there the fix and the chosen pedagogy are the same
thing: accumulate trials instead of recomputing them.

---

## 3. The stage axis

**Every animated laboratory gains one visible slider, `phase`, and the transport drives that
slider and nothing else.**

This is the load-bearing decision. It buys three things at once:

1. **Gate coverage is free.** `labwalk.js` discovers sliders off the rendered DOM and walks each
   one to the bottom, middle and top of its range. A new slider is walked the day it appears,
   without `labwalk.js` being told it exists.
2. **The animation is scrubbable.** A reader who does not want to watch drags the slider. A
   lecturer who wants to stop on one frame drags the slider. Nothing is reachable only by animating.
3. **There is one source of truth for "where are we".** The transport writes `phase`; `draw()`
   reads `phase`. No hidden counter can disagree with what is on screen.

`phase` runs from `0` to a per-laboratory maximum and always advances by 1.

| Lab | `phase` range | Meaning of one step | Tempo | Run time |
| --- | --- | --- | --- | --- |
| C | 0 – 40 | 0–20 sweep position, 21–40 sampling instant | 90 ms | 3.6 s |
| B | 0 – 64 | four source samples | 55 ms | 3.5 s |
| H | 0 – 25 | one batch of trials at every mark | 140 ms | 3.5 s |
| J | 0 – 4 | one merge (**the existing `step` control, renamed**) | 700 ms | 2.8 s |

The tempos land near 3.5 s on purpose: long enough to follow, short enough that a lecturer will
actually press the button twice.

### The resting frame does not move

**`phase` defaults to its maximum, and at the maximum every laboratory draws exactly what it draws
today.** Pressing play rewinds to 0 and runs forward.

This is what protects version 1.0. The gates sample a still page; the screenshots in `shot.js` are
of the resting frame; the walked states are of the resting frame. If the resting frame is unchanged,
none of them can notice that a time axis was added — except by walking the new slider, which is the
one change we want them to notice.

J already works this way: `st.step` defaults to 4, its maximum, showing the completed tree. The
other three are being made to match a pattern the project already has.

---

## 4. The transport contract

Added to `LABS.KIT` in `build/src/70_labs.js`. About 45 lines in total: the twenty-five lines of
loop arithmetic described in §9, plus button binding, the disabled-state bookkeeping and the
reduced-motion branch.

```js
LABS.KIT.transport(root, {
  key:    'phase',    // the axis key in `st`, and the slider's data-v
  max:    40,         // phase runs 0..max
  ms:     90,         // milliseconds per step
  get:    () => st.phase,
  set:    v => { st.phase = v; },
  redraw: () => draw(root)
})
```

It returns nothing. It finds its own buttons under `root` and binds them.

**Button semantics.** Three buttons, marked `data-run="play" | "step" | "reset"`.

| Button | At rest, `phase < max` | At rest, `phase = max` | While running |
| --- | --- | --- | --- |
| play | run forward from here | rewind to 0, then run | pause, stay put |
| step | advance one, stay paused | nothing (button disabled) | pause, then advance one |
| reset | rewind to 0, stay paused | rewind to 0, stay paused | pause, rewind to 0 |

Play is one button whose label toggles between `▶ Play` and `❚❚ Pause`, carrying `aria-pressed`.
Reset rewinds to 0 rather than to the maximum: play already rewinds on its own, so reset's distinct
job is "stop and take me back to the start", which is what a lecturer re-explaining a step wants.

**The loop.** A fixed-step accumulator over `requestAnimationFrame`, the same shape as
`commsyslab`'s `useSimulationLoop` with the React removed:

```text
on each frame:
    acc += elapsed
    while acc >= ms:  acc -= ms; advance one phase
    if phase = max:   stop
```

Whole steps at a fixed tempo, so a 120 Hz machine and a 60 Hz machine show the same thing at the
same moment. Frame timing is read from the `requestAnimationFrame` timestamp, never from
`Date.now()`.

**How it stops.** Three ways, all of them the transport's own responsibility:

1. `phase` reaches `max` — it stops and stays there.
2. **`root.isConnected` is false** — the scene changed, the DOM was replaced, the loop cancels
   itself and does not redraw.
3. The reader presses pause or reset.

Point 2 matters more than it looks. `90_app.js` replaces `#scene-host`'s `innerHTML` on every scene
change and then re-mounts the laboratories, and it offers no teardown hook. A loop that did not
check would keep drawing into a detached tree, and a new one would join it on every revisit.
Checking `isConnected` per frame solves this **without opening `90_app.js`**, which the project
requires: the engine is copied from the source course and is not redesigned here.

**Reduced motion.** Where `matchMedia('(prefers-reduced-motion: reduce)').matches` is true, play does
not animate — it sets `phase` to `max` in one frame. The reader still reaches the result; nothing
moves to get there. Step and reset are unaffected, being discrete already. This matches what `site/`
already does.

---

## 5. The four laboratories

### C · The matched filter — `build/src/72_labs_m2.js`

Two acts on one axis, because they are one idea: **the peak of the matched-filter output is the
right instant to sample.** The first act produces the peak, the second shows what missing it costs.

- **`phase` 0–20, the sweep.** The top panel already draws `s(t)` and `h_opt(t) = s(T−t)`. It gains
  the third thing that makes those two mean something: the shifted filter `h(t−τ)` at the current
  position, and the overlap between it and the pulse as a filled region. The bottom panel draws the
  output curve only as far as the sweep has reached, so the curve is visibly the running integral
  of that shaded area rather than a shape that was always there. The sampling marker is hidden.
- **`phase` 21–40, the scan.** The output curve is complete. The sampling marker appears at 20 % of
  `T` and walks to 100 %, and the SNR-loss readout moves with it, ending at the peak — at
  `0.00 dB`, which is the resting state.

`samp` stays a slider and stays independently draggable. During the scan the transport writes it
and moves its thumb, so the reader sees which control the animation is driving.

**Layout risk, and the answer to it.** The overlap fill is drawn inside the existing top panel; no
panel is added and no panel changes size. `qa.js` reports a scene as `dense` when it needs a scale
factor below 0.90 to fit, and this laboratory must not cross that line. The transport row sits with
the existing controls, which is the one place the column grows — by one row of three small buttons.

**Cache.** `out`, the correlation, depends only on `shape`. It is computed once per shape and reused
across all 41 phases. This makes the sweep cost a slice of an array rather than a fresh O(N²).

### B · PCM, DPCM and delta modulation — `build/src/71_labs_m1.js`

`phase` 0–64, four of the 256 source samples per step. The source waveform is drawn in full from the
start; the coded output is drawn only up to sample `4 × phase`.

The point is slope overload. With a small step size the staircase visibly falls behind the source
and never catches up, and watching it fail to keep up teaches what a static picture of the finished
staircase only records. All three methods animate, since all three are built sample by sample.

The readouts — bit rate, step size, prediction gain — are properties of the whole run, not of the
prefix drawn so far, so they show their final values throughout and do not flicker. This is a
deliberate exception to "everything on screen is computed at interaction time" and is worth stating:
an SQNR that changed every frame would be measuring the length of the prefix, which means nothing.

### H · Error probability against SNR — `build/src/75_labs_m5.js`

`phase` 0–25. Every mark is present from the first frame; what climbs is the number of trials behind
each one. At `phase = k` each mark has run `k × (target / 25)` trials, where `target` is what the
`trials` slider selects: 400, 1500, 5000 or 20 000. All four divide by 25 exactly, so the run time
is the same whichever is chosen.

The points jump early and settle late, and the lowest points settle last — which is the laboratory's
existing lesson about why error rates below `10⁻⁵` are quoted from the formula rather than measured,
now visible instead of asserted.

**The determinism requirement, stated precisely.** Accumulating 25 batches of `target/25` trials
must produce **the identical error count** to today's single call of `target` trials. It does,
provided each mark keeps one `rng` stream created once from its existing seed and every batch draws
from where the last one stopped: a mulberry32 sequence consumed in the same order yields the same
numbers regardless of where it is interrupted. `measure()` is therefore restructured from "run n
trials" to "advance this mark's state by n trials", and the resting frame is bit-for-bit what it is
today.

This is a checkable claim, and §7 makes it a check rather than an assumption.

### J · Building a Huffman code — `build/src/76_labs_m6.js`

The least work of the four. `st.step` already runs 0–4 and already means "merges revealed". It is
renamed `phase` for consistency with the other three and handed to the transport. The drawing code
does not change.

At 700 ms a step, each merge is on screen long enough to read which two entries were taken and where
the combination went back — which is the whole of the tie-breaking rule the `high`/`low` control
switches.

---

## 6. What the gates must see

**No gate may ever start an animation.** `qa.js`, `mathscan.js` and `textclash.js` sample a fixed
number of milliseconds after navigating — 190, 160 and 120 — and read the DOM. A page with something
moving on it would give them a different answer on every run. Since nothing autoplays and no gate
presses play, they see the resting frame, which §3 fixes as identical to today's.

`labwalk.js` is the exception and is extended on purpose. Its own header says the honest thing:

> the cost is that a control using an attribute this file does not know about is still invisible,
> so ATTRS is the one thing to extend when the design system gains a new kind of control

Leaving `data-run` invisible would satisfy the gate while breaking that promise. So `labwalk.js`
learns about the transport, in the one way that stays deterministic: **for each laboratory that has
one, press `step` once, probe, then press `reset`, and probe again. Never press `play`.** A comment
records why — `play` is the only control on the page whose result depends on when it is read.

The `phase` slider needs no special handling: it is a `data-v` slider and the existing walk moves it
to bottom, middle and top already.

### Expected gate output after the change

| Gate | Before | After |
| --- | --- | --- |
| `qa.js` | 109 scenes, 0 errors, 0 overflow, nothing dense | unchanged, and `dense` is the one to watch |
| `labtest.js` | 120 questions, 342 parts, ERRORS: none | unchanged |
| `textclash.js` | TOTAL COLLISIONS: 0 | unchanged |
| `mathscan.js` | 0 / 109 damaged | unchanged |
| `notes/mathscan.js` | 0 literal, 0 KaTeX errors | unchanged — notes are not touched |
| `labwalk.js` | 396 states, PROBLEMS: none | more states, PROBLEMS: none — and it now carries the §7 check |
| `seccheck.js` | 108 addressed, 90 anchored | unchanged |
| `verify_*.py` | 68 / 276 / 12 passed | unchanged — no new numerical definition enters the course |
| `rule_check.py` | 0 violations | unchanged — button labels are student-facing strings |

`labwalk.js` will report a higher state count: four new sliders at three positions each, plus two
button presses per animated laboratory. The exact number is whatever the run prints, and the plan
records it rather than predicting it.

---

## 7. How this is verified

Four checks, in the order they catch things.

1. **The accumulation identity, checked through the DOM.** The H claim of §5 — that 25 batches equal
   one run — is the only new numerical claim in this design, and the one whose failure would be
   silent: a resting frame that quietly disagrees with version 1.0 still looks fine.

   It is **not** a `verify/*.py` gate. Those gates re-derive a quantity in Python from the
   definitions, independently of the artifact; this claim is about the artifact's own arithmetic
   staying self-consistent across two routes, which Python cannot observe without reimplementing
   `measure()` and mulberry32 — reimplementing the thing under test.

   It belongs in `labwalk.js`, which is already in laboratory H pressing buttons. The check is four
   steps and needs no test hook inside the artifact: read the `Measured` readout at rest, press
   `reset`, press `step` to the maximum, read it again, require the two strings to be **identical**.
   Not close — identical. A mismatch is a `PROBLEMS` line like any other, so the gate count stays
   at eleven.
2. **The eleven gates**, all of them, reported as printed.
3. **The rebuilt artifact opened and watched.** Each of the four animations is played end to end and
   looked at. Two of the four bugs found in the source course were invisible to every gate and
   obvious on sight, and an animation is precisely the kind of thing a DOM probe cannot judge.
4. **Byte-reproducibility.** Build twice from unchanged sources; `git status` stays clean. The
   transport must not put a timestamp, a frame count or a random value into the output.

---

## 8. Files

| File | Change |
| --- | --- |
| `build/src/70_labs.js` | `LABS.KIT.transport` added, ~45 lines |
| `build/src/10_style.css` | transport row: three buttons, the play/pause toggle state |
| `build/src/71_labs_m1.js` | B gains `phase`, prefix drawing |
| `build/src/72_labs_m2.js` | C gains `phase`, the overlap fill, partial output curve, driven `samp` |
| `build/src/75_labs_m5.js` | H gains `phase`, `measure()` restructured to accumulate |
| `build/src/76_labs_m6.js` | J renames `step` to `phase`, binds the transport |
| `build/labwalk.js` | transport discovery: press `step` and `reset`, never `play`; the accumulation check of §7 |
| `CLAUDE.md` | the state table and the gate numbers, once the run has printed them |

`90_app.js`, `40_core.js` and `60_plot.js` are not touched. Neither is anything under `notes/`.

---

## 9. Provenance

The loop is derived from `commsyslab/src/lib/sim/useSimulationLoop.ts` — the fixed-step accumulator
over `requestAnimationFrame`, and the play / step / reset semantics of
`commsyslab/src/components/TransportControls.tsx`. React, the speed control and the tick callback
are dropped; what survives is about twenty-five lines of arithmetic.

This is the first code in this repository actually taken from `commsyslab`. §7 of the v1.0 design
anticipated porting the laboratories' numerical cores and none of it happened — every laboratory was
written from the textbook instead. That section should be corrected to say what was done, and this
document is where the exception now lives.

`commsyslab` carries no LICENSE file, but it is the author's own work, so there is no restriction.
No equation reference comes across with this code, so the §7 trap about wrong textbook anchors does
not apply: a `requestAnimationFrame` accumulator has no textbook anchor to get wrong.
