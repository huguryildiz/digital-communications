# Laboratory Transport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give laboratories C, B, H and J a time axis, so a reader presses play and the figure
develops instead of arriving finished.

**Architecture:** One transport is added to the laboratory kit. It drives a single visible slider
named `phase` and nothing else, so each laboratory keeps exactly one drawing path and `labwalk.js`
covers the new axis for free. `phase` rests at its maximum, where every laboratory draws precisely
what it draws today, which is what leaves version 1.0's gate output intact.

**Tech Stack:** Vanilla JavaScript in `build/src/*.js`, concatenated by `build/build.js` into one
offline HTML file. No npm dependency, no import, no build step beyond concatenation. Gates run
under Playwright via `build/pw.js`.

**Spec:** `docs/superpowers/specs/2026-08-03-lab-transport-design.md`. Read it before Task 1.

## Global Constraints

- **The artifact is one offline file.** Nothing is imported, fetched or installed. Code taken from
  `commsyslab` is copied and adapted, never depended on.
- **One drawing path per laboratory.** Every animation frame goes through that laboratory's existing
  `draw(root)`. A second, lighter renderer is forbidden: it would make two drawings of one quantity
  and the gates read only one of them.
- **Nothing autoplays.** No animation starts without a click. Every gate samples the DOM a fixed
  number of milliseconds after navigating, so a page that moved by itself would answer differently
  on each run.
- **`phase` defaults to its maximum**, and at the maximum each laboratory renders exactly its
  current output. Verified by gate output being unchanged, not by inspection.
- **Frame time comes from the `requestAnimationFrame` timestamp.** Never `Date.now()`, never
  `Math.random()`.
- **`90_app.js`, `40_core.js`, `60_plot.js` and everything under `notes/` are not touched.** The
  engine is copied from the source course and is not redesigned here.
- **The build is byte-reproducible.** Building twice from unchanged sources leaves `git status`
  clean.
- **Every piece of mathematics in a figure is typeset LaTeX** with `tex:true`, on one line.
- **Sources and any rebuilt `dist/` file are committed together**, never in separate commits.
- Python is the arm64 venv at `.venv/`. Never the x86_64 anaconda `python3`.
- `source/` is gitignored and must be present locally before anything can be built or checked.

---

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `build/src/70_labs.js` | `LABS.KIT.transport` and `LABS.KIT.runbar` — the loop, the buttons, the reduced-motion branch | 1 |
| `build/src/10_style.css` | `.runbar` — the three-button row, matching `.seg` | 1 |
| `build/src/76_labs_m6.js` | J: `st.step` renamed `phase`, transport bound | 1 |
| `build/labwalk.js` | transport discovery; the accumulation check | 2, 4 |
| `build/src/71_labs_m1.js` | B: `phase` axis, prefix drawing of the coded waveform | 3 |
| `build/src/75_labs_m5.js` | H: `phase` axis, `measure()` restructured to accumulate | 4 |
| `build/src/72_labs_m2.js` | C: `phase` axis, overlap fill, partial output curve, driven `samp` | 5 |
| `CLAUDE.md`, spec §7 of the v1.0 design | state table, gate numbers, the porting correction | 6 |

Task order is deliberate: Task 1 is the smallest end-to-end slice (kit plus the laboratory that
already has a stage axis), so the transport is proven working before three laboratories are built
on it.

---

### Task 1: The transport in the kit, driven by laboratory J

**Files:**
- Modify: `build/src/70_labs.js:41` — the `return { KIT: … }` line
- Modify: `build/src/10_style.css:635` — after the `.seg` rules
- Modify: `build/src/76_labs_m6.js:109,159,252` — J's state, its `done` read, its slider
- Modify: `dist/Digital_Communications.html` — rebuilt

**Interfaces:**
- Produces: `LABS.KIT.transport(root, opts)` where `opts` is
  `{ key: string, max: number, ms: number, get: () => number, set: (v: number) => void, redraw: () => void }`,
  returns `undefined`.
- Produces: `LABS.KIT.runbar()` returning the three-button HTML string.
- Consumed by Tasks 3, 4 and 5.

- [x] **Step 1: Read the spec**

Read `docs/superpowers/specs/2026-08-03-lab-transport-design.md` §3 and §4 in full. The button
semantics table in §4 is the specification for Step 3 and is not repeated here.

- [x] **Step 2: Add the runbar markup helper to the kit**

In `build/src/70_labs.js`, inside the IIFE, above the `return`:

```js
  /* The three buttons a laboratory with a time axis carries. They are marked
     `data-run` rather than `data-seg`: a segmented control selects one state
     out of a set and `labwalk.js` walks every one of them, which is right for
     a state and wrong for a clock. What `labwalk.js` does with these is
     written down in that file. */
  const runbar = () => `<div class="ctrl runbar">
        <button data-run="play" aria-pressed="false">&#9654; Play</button>
        <button data-run="step">&#9197; Step</button>
        <button data-run="reset">&#8634; Reset</button></div>`;
```

- [x] **Step 3: Add the transport to the kit**

In the same IIFE, below `runbar`:

```js
  /* Drives one control — the `phase` slider — and nothing else, so a
     laboratory that animates has exactly as many drawing paths as one that
     does not, and `labwalk.js` covers the axis because a slider is a thing it
     already walks.

     It never starts on its own. Every gate reads the DOM a fixed number of
     milliseconds after navigating, and a page that moved by itself would give
     a different answer on every run.

     The loop is a fixed-step accumulator over requestAnimationFrame: whole
     steps at a fixed tempo, so a 60 Hz display and a 120 Hz one show the same
     frame at the same moment. The time comes from the frame timestamp and
     never from the clock, which would make the artifact's behaviour depend on
     when it was opened. */
  function transport(root, o){
    const slider = root.querySelector(`[data-v="${o.key}"]`);
    const bPlay  = root.querySelector('[data-run="play"]');
    const bStep  = root.querySelector('[data-run="step"]');
    const bReset = root.querySelector('[data-run="reset"]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, acc = 0, last = 0;

    const chrome = () => {
      if(bPlay){ bPlay.innerHTML = raf ? '&#10074;&#10074; Pause' : '&#9654; Play';
                 bPlay.setAttribute('aria-pressed', String(!!raf)); }
      if(bStep){ bStep.disabled = (o.get() >= o.max) && !raf; }
    };
    const put = v => { o.set(v); if(slider) slider.value = String(v); o.redraw(); chrome(); };
    const stop = () => { if(raf) cancelAnimationFrame(raf); raf = 0; acc = 0; last = 0; chrome(); };

    function frame(now){
      /* The scene changed under us: the host's innerHTML was replaced and this
         tree is detached. Drawing into it would burn a core for nobody, and a
         second loop would join it on the next visit. The engine offers no
         teardown hook, so the loop takes responsibility for its own death. */
      if(!root.isConnected){ raf = 0; return; }
      if(!last) last = now;
      acc += now - last; last = now;
      let v = o.get();
      while(acc >= o.ms && v < o.max){ acc -= o.ms; v++; }
      if(v !== o.get()) put(v);
      if(v >= o.max){ stop(); return; }
      raf = requestAnimationFrame(frame);
    }

    if(bPlay) bPlay.addEventListener('click', ()=>{
      if(raf){ stop(); return; }
      /* Reduced motion gets the result without the journey. */
      if(reduced){ put(o.max); return; }
      if(o.get() >= o.max) put(0);
      last = 0; acc = 0; raf = requestAnimationFrame(frame); chrome();
    });
    if(bStep)  bStep.addEventListener('click', ()=>{ stop(); if(o.get() < o.max) put(o.get()+1); });
    if(bReset) bReset.addEventListener('click', ()=>{ stop(); put(0); });
    chrome();
  }
```

Then change the kit's export line from `return { KIT:{ T, M, F, el, gcd } };` to:

```js
  return { KIT:{ T, M, F, el, gcd, transport, runbar } };
```

- [x] **Step 4: Style the runbar**

In `build/src/10_style.css`, immediately after the `.seg button:hover…` rule at line 635:

```css
.runbar{ display:flex; gap:8px; }
.runbar button{
  font-family:var(--mono); font-size:calc(13px * var(--ts)); letter-spacing:.06em; padding:8px 14px;
  background:transparent; border:1px solid var(--rule-strong); border-radius:var(--radius);
  color:var(--muted); cursor:pointer; transition:background 140ms var(--ease),color 140ms var(--ease);
}
.runbar button:hover:not(:disabled){ background:var(--paper-3); color:var(--ink); }
.runbar button[aria-pressed=true]{ background:var(--coral); color:#FCF9F3; border-color:var(--coral); }
.runbar button:disabled{ opacity:.4; cursor:default; }
```

- [x] **Step 5: Rename J's axis and bind the transport**

In `build/src/76_labs_m6.js`, three edits inside the `J` IIFE:

Line 109 — `let st = { w1:40, w2:20, w3:20, w4:10, w5:10, step:4, high:1 };`
becomes `let st = { w1:40, w2:20, w3:20, w4:10, w5:10, phase:4, high:1 };`

Line 159 — `const done = st.step;` becomes `const done = st.phase;`
(the trailing comment `/* merges revealed so far */` stays.)

Line 252 — the slider `<input type="range" data-v="step" min="0" max="4" step="1" value="4">`
becomes `<input type="range" data-v="phase" min="0" max="4" step="1" value="4">`. Its `<label>` and
any `data-out="step"` in that label become `data-out="phase"` — grep the file for `"step"` and fix
every one of the three occurrences; `st.step` must not survive anywhere.

Add the runbar to the control column, immediately before the tie-break segmented control:

```js
              ${LABS.KIT.runbar()}
```

And at the end of `mount`, after the existing `draw(root);`:

```js
      LABS.KIT.transport(root, { key:'phase', max:4, ms:700,
        get:()=>st.phase, set:v=>{ st.phase=v; }, redraw:()=>draw(root) });
```

700 ms a step is long enough to read which two entries were merged and where the combination went
back, which is the whole of what the tie-break control changes.

- [x] **Step 6: Syntax check and build**

```bash
cd /Users/huguryildiz/Documents/GitHub/digital-communications
node --check build/src/70_labs.js && node --check build/src/76_labs_m6.js
cd build && node build.js
```

Expected: no output from `--check`, and `build.js` reports the file written.

- [x] **Step 7: Confirm the resting frame did not move**

```bash
cd build && node pw.js qa.js && node pw.js labwalk.js
```

Expected: `qa.js` prints 109 scenes, 0 errors, 0 overflow, nothing under `dense`.
`labwalk.js` prints `PROBLEMS: none` with a state count **higher than 396** — J's slider is still
one slider, but it is now named `phase`; the count rises only once Tasks 3–5 land. If `qa.js`
reports `m6-lab-j` as dense, the runbar has pushed the control column over: move it below the
tie-break control and re-run before continuing.

- [x] **Step 8: Watch it**

```bash
cd build && node pw.js shot.js
```

Then open `dist/Digital_Communications.html`, go to laboratory J, and press play, step and reset in
turn. Confirm by eye: play runs the five merges and stops on the full tree; pressing play again
rewinds and replays; step advances one merge and is disabled on the last; reset returns to an empty
tree. Then navigate to another scene mid-animation and back — nothing must be left running, and the
console must be clean.

- [x] **Step 9: Commit**

```bash
git add build/src/70_labs.js build/src/10_style.css build/src/76_labs_m6.js dist/Digital_Communications.html
git commit -m "Give the laboratory kit a transport, and run laboratory J on it"
```

---

### Task 2: `labwalk.js` learns the transport

**Files:**
- Modify: `build/labwalk.js` — the `discover()` return, and the walk that consumes it

**Interfaces:**
- Consumes: `[data-run="play"|"step"|"reset"]` from Task 1.
- Produces: a `hasRun` flag on the discovery result, consumed by Task 4's accumulation check.

- [x] **Step 1: Understand why this task exists**

`labwalk.js` discovers controls off the rendered DOM precisely so that a control it was never told
about is still walked. Its header says the honest thing: *"the cost is that a control using an
attribute this file does not know about is still invisible, so ATTRS is the one thing to extend when
the design system gains a new kind of control."* Leaving `data-run` invisible would keep the gate
green while breaking that promise. This task keeps the promise **without** ever pressing play,
because play is the one control on the page whose result depends on when it is read.

- [x] **Step 2: Report the transport from `discover()`**

In `build/labwalk.js`, in the object returned by the `p.evaluate` inside `discover()`, add one
property beside `hasNav` and `hasReveal`:

```js
        hasRun: !!lab.querySelector('[data-run]'),
```

- [x] **Step 3: Walk it**

Where the walk consumes the discovery result, after the slider walk for a laboratory and before it
moves on, add:

```js
    /* The transport. `step` and `reset` are discrete: they move the phase axis
       by a whole stage and then the page is still, so a probe after them reads
       the same thing every run. `play` is never pressed, and must never be —
       it is the one control whose result depends on when it is read, and every
       gate on this artifact reads at a fixed delay after navigating. */
    if (d.hasRun) {
      await click('[data-run="reset"]');
      await p.waitForTimeout(60);
      await probe(`${L.lab}: transport reset`, d.figures);
      await click('[data-run="step"]');
      await p.waitForTimeout(60);
      await probe(`${L.lab}: transport step`, d.figures);
      await click('[data-run="reset"]');
      await p.waitForTimeout(60);
    }
```

`d` is the discovery result and `L` the laboratory record; match the surrounding code's names if
they differ.

- [x] **Step 4: Run it**

```bash
cd build && node pw.js labwalk.js
```

Expected: `PROBLEMS: none`, and a state count **two higher than the previous run** — laboratory J is
the only transport so far, and it contributes one `reset` probe and one `step` probe.

- [x] **Step 5: Prove the walk actually reaches the transport**

Temporarily break it: in `76_labs_m6.js`, change J's `set` callback to `set:v=>{ st.phase=v+1; }`,
rebuild, and re-run `labwalk.js`. The `transport step` probe must now fail or the readouts go wrong.
Revert the change, rebuild, re-run, confirm `PROBLEMS: none`. A check that cannot fail is not a
check, and this is the cheapest way to know this one can.

- [x] **Step 6: Commit**

```bash
git add build/labwalk.js
git commit -m "Walk the transport in labwalk, by stepping it and never playing it"
```

---

### Task 3: B · the coded waveform, one sample at a time

**Files:**
- Modify: `build/src/71_labs_m1.js:159` (state), the `draw` body, the control column, `mount`
- Modify: `dist/Digital_Communications.html` — rebuilt

**Interfaces:**
- Consumes: `LABS.KIT.transport`, `LABS.KIT.runbar` from Task 1.

- [x] **Step 1: Add the axis to the state**

Line 159: `let st = { method:'pcm', bits:3, step:8 };` becomes

```js
    let st = { method:'pcm', bits:3, step:8, phase:64 };
```

`st.step` here is the delta modulator's **step size** and is unrelated to the transport. Do not
rename it. `phase` runs 0–64 and each unit is four of the 256 source samples.

- [x] **Step 2: Draw only the prefix of the coded waveform**

The source waveform keeps being drawn in full; only the coded output is truncated. Where `draw`
plots the reconstruction, clip it to `4 * st.phase` samples. The reconstruction array is `rec` for
PCM and DPCM and the return of `delta(step)` for delta modulation; whichever local holds it, plot

```js
      const shown = rec.slice(0, 4*st.phase);
```

and plot `shown` instead of `rec`. Leave every readout — bit rate, step size, prediction gain, SQNR
— computed from the **full** `rec`.

That last point is deliberate and worth a comment in the file:

```js
      /* The readouts describe the whole run and not the part drawn so far. An
         SQNR that changed as the trace grew would be measuring the length of
         the prefix, which is a fact about the animation and not about the
         coder. */
```

- [x] **Step 3: Add the control and bind the transport**

In the control column, after the existing step-size slider:

```js
              <div class="ctrl"><label>Samples coded <span class="val" data-out="phase">64</span></label>
                <input type="range" data-v="phase" min="0" max="64" step="1" value="64"></div>
              ${LABS.KIT.runbar()}
```

At the end of `mount`, after `draw(root);`:

```js
      LABS.KIT.transport(root, { key:'phase', max:64, ms:55,
        get:()=>st.phase, set:v=>{ st.phase=v; }, redraw:()=>draw(root) });
```

- [x] **Step 4: Build and check the resting frame**

```bash
cd build && node build.js && node pw.js qa.js && node pw.js mathscan.js
```

Expected: `qa.js` 109 scenes, 0 errors, 0 overflow, nothing dense. `mathscan.js` `0 / 109`.
At `phase = 64` the figure must be pixel-identical to before this task; `4 × 64 = 256`, the whole
array, so `slice` returns everything.

- [x] **Step 5: Watch the lesson land**

Open the artifact at laboratory B, choose **delta**, set the step size to its minimum, and press
play. The staircase must visibly fall behind the source and never catch up — that is slope
overload, and watching it fail is the thing this task exists to produce. If the trace grows too fast
to follow, raise `ms` from 55 to 70 and rebuild.

- [x] **Step 6: Commit**

```bash
git add build/src/71_labs_m1.js dist/Digital_Communications.html
git commit -m "Build laboratory B's coded waveform one sample at a time"
```

---

### Task 4: H · trials accumulate onto the closed form

**Files:**
- Modify: `build/src/75_labs_m5.js:45` (state), `measure()`, `draw()`, the control column, `mount`
- Modify: `build/labwalk.js` — the accumulation check
- Modify: `dist/Digital_Communications.html` — rebuilt

**Interfaces:**
- Consumes: `LABS.KIT.transport`, `LABS.KIT.runbar` from Task 1; `hasRun` from Task 2.

- [x] **Step 1: Understand the identity that must hold**

Twenty-five batches of `target/25` trials must produce **the identical error count** to today's one
call of `target` trials. It does if each mark keeps one `rng` stream, created once from its existing
seed, and every batch draws from where the last one stopped — a mulberry32 sequence consumed in the
same order gives the same numbers however it is interrupted. Get this wrong (a fresh `rng(seed)` per
batch is the obvious way) and the resting frame silently disagrees with version 1.0.

`target` is what the `trials` slider selects: 400, 1500, 5000 or 20 000. All four divide by 25
exactly, so the batch size is a whole number and the run time is the same whichever is chosen.

- [x] **Step 2: Restructure `measure` to advance a state**

Replace `measure(g, esn0dB, n, seed)` with a version that advances a caller-held state instead of
running to completion. The trial body — draw a symbol, add Gaussian noise to each dimension the
scheme uses, decide by nearest point — is unchanged; only who owns the loop counter changes.

```js
    /* One mark's measurement, held open. `s.r` is the mark's own generator,
       made once; every batch draws from where the last stopped, so twenty-five
       batches of n consume exactly the sequence one batch of 25n would. That
       identity is what lets the animation accumulate without the final frame
       disagreeing with a single run — and `labwalk.js` checks it rather than
       trusting it. */
    function markState(seed){ return { r: rng(seed), wrong:0, n:0 }; }

    function advance(s, g, esn0dB, n){
      const N0 = 1/Math.pow(10, esn0dB/10), sig = Math.sqrt(N0/2);
      for(let t=0;t<n;t++){
        const i = Math.min(g.M-1, Math.floor(s.r()*g.M));
        const u = Math.max(1e-12, s.r()), v = s.r();
        const m = sig*Math.sqrt(-2*Math.log(u));
        const x = g.pts[i][0] + m*Math.cos(2*Math.PI*v);
        const y = g.dim === 2 ? g.pts[i][1] + m*Math.sin(2*Math.PI*v) : g.pts[i][1];
        let best = 0, bd = Infinity;
        for(let k=0;k<g.M;k++){
          const d = (x-g.pts[k][0])**2 + (y-g.pts[k][1])**2;
          if(d < bd){ bd = d; best = k; }
        }
        if(best !== i) s.wrong++;
      }
      s.n += n;
      return s;
    }

    /* Run a mark from scratch to `phase` batches. Cheap enough to redo per
       frame — 25 batches of at most 800 trials — and it keeps `draw()` a pure
       function of `st`, which is what makes the slider scrubbable in both
       directions rather than only forwards. */
    function toPhase(g, esn0dB, seed, target, phase){
      const s = markState(seed);
      advance(s, g, esn0dB, Math.round(target/25)*phase);
      return { wrong:s.wrong, n:s.n, rate: s.n ? s.wrong/s.n : 0 };
    }
```

`toPhase` running the batches as one call of `batch × phase` is the same sequence as `phase` calls
of `batch` — that is the identity of Step 1, used to keep `draw()` stateless.

- [x] **Step 3: Point `draw()` at it**

In `draw`, `nTrial` is the target. Replace the two `measure(...)` calls:

```js
      const dots = MARKS.map((d,i)=>({ d, r: toPhase(g, d, 20260802 + 977*i, nTrial, st.phase) }));
```

and

```js
      const meas = toPhase(g, st.esn0, 20260802 + 977*MARKS.indexOf(st.esn0), nTrial, st.phase);
```

Everything downstream — the `sd`/`off` binomial check, the three verdicts, the readouts — is
unchanged, but the `Trials a point` readout now reports what has actually been run:

```js
        <div><dt>Trials a point</dt><dd>${meas.n} of ${nTrial}</dd></div>
```

At `phase = 25` this reads `20000 of 20000` and every other number is what it is today.

- [x] **Step 4: Add the control and bind the transport**

After the `trials` slider in the control column:

```js
              <div class="ctrl"><label>Batches run <span class="val" data-out="phase">25</span></label>
                <input type="range" data-v="phase" min="0" max="25" step="1" value="25"></div>
              ${LABS.KIT.runbar()}
```

State line 45 becomes `let st = { set:'qpsk', esn0:10, trials:3, phase:25 };`, and at the end of
`mount`, after `draw(root);`:

```js
      LABS.KIT.transport(root, { key:'phase', max:25, ms:140,
        get:()=>st.phase, set:v=>{ st.phase=v; }, redraw:()=>draw(root) });
```

- [x] **Step 5: Add the accumulation check to `labwalk.js`**

Inside the `if (d.hasRun)` block written in Task 2, after the existing probes:

```js
      /* The one new numerical claim of this design: twenty-five batches equal
         one run. Its failure is silent — a resting frame that quietly
         disagrees with the released version still looks perfectly fine — so it
         is read off the page rather than trusted. Identical strings, not close
         ones: a floating-point tolerance here would hide exactly the error
         this is looking for. */
      const readMeasured = () => p.evaluate(() => {
        const dt = [...document.querySelectorAll('.lab .readout dt')]
          .find(e => e.textContent.trim() === 'Measured');
        return dt ? dt.nextElementSibling.textContent.trim() : null;
      });
      const atRest = await readMeasured();
      if (atRest) {
        await click('[data-run="reset"]');
        for (let k = 0; k < 25; k++) await click('[data-run="step"]');
        await p.waitForTimeout(80);
        const stepped = await readMeasured();
        if (stepped !== atRest)
          problems.push(`${L.lab}: accumulation differs from one run — ` +
                        `at rest "${atRest}", stepped "${stepped}"`);
        await click('[data-run="reset"]');
      }
```

This runs for any laboratory carrying both a transport and a `Measured` readout, which today is H
alone. The 25 presses match H's `max`; a laboratory with a different maximum simply reaches its own
end early and the comparison still holds, because `step` does nothing at the maximum.

- [x] **Step 6: Watch the check fail, then pass**

Break it on purpose first. In `toPhase`, replace the single `advance` call with a loop that remakes
the generator each batch:

```js
      for(let k=0;k<phase;k++){ s.r = rng(seed); advance(s, g, esn0dB, Math.round(target/25)); }
```

Then:

```bash
cd build && node build.js && node pw.js labwalk.js
```

Expected: **FAIL** — a `PROBLEMS` line reading `accumulation differs from one run`. If it passes,
the check is not reaching the readout and must be fixed before going on.

Now revert to the Step 2 version, rebuild, and re-run:

```bash
cd build && node build.js && node pw.js labwalk.js
```

Expected: `PROBLEMS: none`.

- [x] **Step 7: Run the numerical gates**

```bash
cd build && node pw.js qa.js && node pw.js mathscan.js && node pw.js textclash.js
cd ../verify && ../.venv/bin/python verify_ber.py
```

Expected: `qa.js` 0 errors, 0 overflow, nothing dense; `mathscan.js` `0 / 109`; `textclash.js`
`TOTAL COLLISIONS: 0`; `verify_ber.py` `12 passed, 0 failed`. `verify_ber.py` is the independent
Python check of the error probabilities and must be untouched by this task — if it moves, the
restructure changed the mathematics and not just who owns the loop.

- [x] **Step 8: Watch it**

Open laboratory H, press play, and confirm the points jump early and settle late, with the lowest
points settling last. Try `trials` at each of its four positions: the run must take the same time at
every one.

- [x] **Step 9: Commit**

```bash
git add build/src/75_labs_m5.js build/labwalk.js dist/Digital_Communications.html
git commit -m "Accumulate laboratory H's trials, and check the accumulation is one run"
```

---

### Task 5: C · the filter sweeps, then the sample walks to the peak

**Files:**
- Modify: `build/src/72_labs_m2.js:38` (state), the `C` `draw` body, the control column, `mount`
- Modify: `dist/Digital_Communications.html` — rebuilt

**Interfaces:**
- Consumes: `LABS.KIT.transport`, `LABS.KIT.runbar` from Task 1.

- [x] **Step 1: Understand the two acts**

They are one idea — **the peak of the matched-filter output is the right instant to sample** — in
two movements. `phase` 0–20 sweeps the filter and draws the output curve as far as the sweep has
reached, so the curve is visibly the running integral of a shaded overlap rather than a shape that
was always there. `phase` 21–40 leaves the curve complete and walks the sampling marker from 20 % of
`T` to 100 %, ending at the peak, which is the resting state.

- [x] **Step 2: Add the axis**

Line 38: `let st = { shape:'rect', noise:30, samp:100 };` becomes

```js
    let st = { shape:'rect', noise:30, samp:100, phase:40 };
```

- [x] **Step 3: Cache the correlation**

`out` depends only on `shape`, never on `samp`, `noise` or `phase`, and it costs 512 × 513 products.
Above `draw`, add:

```js
    /* The correlation is a property of the pulse alone, so it is computed once
       per shape and reused across all forty-one phases. Recomputing it per
       frame would be a quarter of a million products to redraw a marker. */
    let cache = { shape:null, out:null, E:0 };
    function correlation(){
      if(cache.shape === st.shape) return cache;
      const dt = TB/N, sig = [];
      for(let i=0;i<N;i++) sig.push(pulse(i*dt));
      const E = sig.reduce((s,v)=>s+v*v,0)*dt;
      const out = [];
      for(let k=0;k<=N;k++){
        let s=0;
        for(let i=0;i<N;i++){ const j=i-(N-k); if(j>=0&&j<N) s += sig[i]*sig[j]; }
        out.push(s*dt);
      }
      cache = { shape:st.shape, out, E, sig, dt };
      return cache;
    }
```

In `draw`, replace the inline `sig`/`E`/`out` computation with `const { out, E, sig, dt } =
correlation();`. Everything below it is unchanged.

- [x] **Step 4: Derive the two acts from `phase`**

At the top of `draw`, after the cache read:

```js
      /* Act one sweeps, act two scans. `samp` stays a real control and stays
         draggable; during act two the transport writes it and moves its thumb,
         so the reader can see which control the animation is driving. */
      const sweeping = st.phase <= 20;
      const swept    = Math.min(1, st.phase/20);           /* 0…1 of the axis */
      if(!sweeping){
        st.samp = 20 + Math.round((st.phase-21)/19*80/5)*5;  /* 20…100, in fives */
        const sl = root.querySelector('[data-v="samp"]');
        if(sl) sl.value = String(st.samp);
      }
```

At `phase = 40` this gives `st.samp = 100`, the resting value. Verify that arithmetic before moving
on: `(40-21)/19 = 1`, `1 × 80/5 = 16`, `16 × 5 = 80`, `20 + 80 = 100`.

- [x] **Step 5: Draw the sweep**

In the top panel, after the two existing `ax.curve` calls, add the shifted filter and the overlap —
only while sweeping:

```js
      if(sweeping){
        const tau = swept;                       /* the filter's leading edge */
        ax.curve(t=>pulse((tau-t)*TB),{color:P.COL.h,width:1.9,n:600});
        /* The overlap is what the integral is accumulating at this instant, and
           shading it is the whole reason the sweep is worth watching. Amber is
           the filter's colour, and `dec.h` is its low-opacity fill, which
           carries a separate value for the dark theme. */
        ax.area(t=>Math.min(pulse(t*TB), pulse((tau-t)*TB)), 0, 1, {color:P.COL.dec.h});
      }
```

`area(f, a, b, opts)` is the existing primitive at `60_plot.js:246`, written for exactly this —
its own comment reads *"filled area under a function (overlap highlighting)"*. It takes a function
of the x-axis variable, an interval, and a fill colour; it closes the path to `y = 0` itself.
`85_scenes_m4.js:327` is a worked example of the call. Do not add a new panel: the fill goes inside
the existing top panel, because `qa.js` reports a scene as `dense` below a 0.90 scale factor and
this laboratory must not cross that line.

In the bottom panel, clip the output curve to the sweep and hide the marker during act one:

```js
      const kmax = sweeping ? Math.round(swept*N) : N;
      bx.poly(out.slice(0,kmax+1).map((v,k)=>[k/N,v]),{color:P.COL.out,width:2.3});
      if(!sweeping){
        bx.vline(st.samp/100,{color:P.COL.err,width:1.6,dash:'5 4'});
        bx.point(st.samp/100, peak, {color:P.COL.err, r:4.5});
      }
```

- [x] **Step 6: Add the control and bind the transport**

After the `samp` slider:

```js
              <div class="ctrl"><label>Sweep and scan <span class="val" data-out="phase">40</span></label>
                <input type="range" data-v="phase" min="0" max="40" step="1" value="40"></div>
              ${LABS.KIT.runbar()}
```

At the end of `mount`, after `draw(root);`:

```js
      LABS.KIT.transport(root, { key:'phase', max:40, ms:90,
        get:()=>st.phase, set:v=>{ st.phase=v; }, redraw:()=>draw(root) });
```

- [x] **Step 7: Build and check the resting frame hardest of all**

This is the task most likely to move the resting frame, because it touches the drawing and not only
the data.

```bash
cd build && node build.js && node pw.js qa.js && node pw.js textclash.js && node pw.js mathscan.js
```

Expected: `qa.js` 109 scenes, 0 errors, 0 overflow, **nothing under `dense`** — if `m2-lab-c`
appears there, the control column has grown too tall; move the runbar above the sliders and re-run.
`textclash.js` `TOTAL COLLISIONS: 0`. `mathscan.js` `0 / 109`.

At `phase = 40`, `sweeping` is false and the marker is drawn, so the figure is what it is today.

- [x] **Step 8: Watch both acts**

Open laboratory C and press play. Act one: the dashed filter slides across the pulse, the shaded
overlap grows and shrinks, and the output curve draws itself in step with it, peaking exactly where
the overlap is largest. Act two: the marker appears at 20 % and walks to the peak while the loss
readout climbs to `0 dB`. Try all three pulse shapes — the peak value must be the same for all
three, which is the point the laboratory already makes and the animation must not break.

- [x] **Step 9: Commit**

```bash
git add build/src/72_labs_m2.js dist/Digital_Communications.html
git commit -m "Sweep the matched filter, then walk the sample to its peak"
```

---

### Task 6: The full sweep, and the record

**Files:**
- Modify: `CLAUDE.md` — the state table and the gate numbers
- Modify: `docs/superpowers/specs/2026-08-02-digital-communications-design.md:211-250` — §7
- Modify: `dist/Digital_Communications.html` if the final build differs

- [x] **Step 1: Run all eleven gates, in order**

```bash
cd /Users/huguryildiz/Documents/GitHub/digital-communications
node --check build/src/7*.js build/src/8*.js build/src/9*.js
cd build && node pw.js qa.js
cd build && node pw.js labtest.js
cd build && node pw.js textclash.js
cd build && node pw.js mathscan.js
cd build && node pw.js ../notes/mathscan.js
cd build && node pw.js labwalk.js
cd build && node pw.js seccheck.js
cd verify && ../.venv/bin/python verify_scenes.py
cd verify && ../.venv/bin/python verify_drills.py
cd verify && ../.venv/bin/python verify_ber.py
.venv/bin/python tools/rule_check.py "build/src/8[1-9]_scenes*.js" \
  "build/src/9[2-8]_drill_m*.js" "build/src/91_*.js" "build/src/70_labs.js" \
  "build/src/7[1-9]_labs*.js" "notes/src/*.js"
```

Expected: `qa.js` 109 scenes, 0 errors, 0 overflow, nothing dense · `labtest.js` ERRORS: none ·
`textclash.js` TOTAL COLLISIONS: 0 · `mathscan.js` 0 / 109 · `notes/mathscan.js` 0 literal,
0 KaTeX errors · `labwalk.js` PROBLEMS: none, state count above 396 · `seccheck.js` PROBLEMS: none ·
`verify_scenes.py` 68 passed · `verify_drills.py` 276 passed · `verify_ber.py` 12 passed ·
`rule_check.py` TOTAL VIOLATIONS: 0.

**Write down what each run actually printed.** A summary in place of a run is not acceptable here.

- [x] **Step 2: Prove the build is still byte-reproducible**

```bash
cd build && node build.js && cd .. && git status --short
```

Expected: no modification to `dist/Digital_Communications.html`. A diff nobody authored means the
transport put a timestamp, a frame count or a random value into the output — find it before
continuing.

- [x] **Step 3: Check reduced motion behaves**

```bash
cd build && node -e "
const {chromium}=require('/home/claude/.npm-global/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({reducedMotion:'reduce'});
await p.goto('file://'+require('path').resolve('../dist/Digital_Communications.html'));
await p.waitForTimeout(500);
await p.evaluate(()=>APP.goId('m6-lab-j',0));
await p.waitForTimeout(300);
await p.click('[data-run=\"reset\"]'); await p.click('[data-run=\"play\"]');
await p.waitForTimeout(200);
console.log('phase after play:', await p.\$eval('[data-v=phase]',e=>e.value));
await b.close();})()"
```

Expected: `phase after play: 4` — under reduced motion, play lands on the final frame at once
instead of animating there.

- [x] **Step 4: Look at the screenshots**

```bash
cd build && node pw.js shot.js
```

Then look at them. Two of the four bugs found in the source course were invisible to all eleven
gates and visible at a glance, and a laboratory that has just gained a row of buttons is exactly
where a layout regression hides.

- [x] **Step 5: Update `CLAUDE.md`**

In the *"What a run printed on the last full sweep"* table, replace the `labwalk.js` row with the
count Step 1 actually printed. Add one row to the *"Where the project stands"* table:

```markdown
| 8 | Laboratory transport · labs C, B, H, J gain a phase axis | done |
```

and change *"**Version 1.0. Complete.**"* to *"**Version 1.1. Complete.**"*.

In the repository-layout table, extend the `build/src/70_labs.js` row to mention the transport.

- [x] **Step 6: Correct §7 of the v1.0 design record**

`docs/superpowers/specs/2026-08-02-digital-communications-design.md` §7 says the laboratories'
numerical cores are ported from `commsyslab`. They were not — every one was written from the
textbook, and three of the laboratory files say so in their own headers. Add a paragraph at the end
of §7:

```markdown
**What was actually done.** No numerical core was ported. Every laboratory was written from the
textbook, and the correspondence in the table above is one of subject and not of code — the two
projects teach the same course, so they compute the same quantities by different routes. The first
code genuinely taken from `commsyslab` is the transport of the 2026-08-03 design: the fixed-step
`requestAnimationFrame` accumulator of `src/lib/sim/useSimulationLoop.ts` and the play / step /
reset semantics of `src/components/TransportControls.tsx`, with React, the speed control and the
tick callback dropped.
```

- [x] **Step 7: Commit**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-08-02-digital-communications-design.md
git commit -m "Record the transport, and correct what was said about porting"
git push origin main
```

---

## Self-Review

**Spec coverage.** §1 four laboratories → Tasks 1, 3, 4, 5. §1 exclusions (no speed slider, no
looping, no autoplay, no second renderer) → Global Constraints and Task 1 Step 3. §2 one drawing
path → Global Constraints; the C cache → Task 5 Step 3; the H accumulation → Task 4 Step 2. §3
`phase` slider and the resting frame → every laboratory task, checked in Task 1 Step 7, Task 3
Step 4, Task 4 Step 7, Task 5 Step 7. §3 tempo table → the `ms` value in each task. §4 contract,
button semantics, loop, `isConnected`, reduced motion → Task 1 Steps 2–3, checked in Task 6 Step 3.
§5 each laboratory → its own task. §6 gates → Task 6 Step 1; `labwalk` extension → Task 2. §7
accumulation check → Task 4 Steps 5–6; the eleven gates → Task 6 Step 1; watching it → Steps 8 of
Tasks 1, 3, 4, 5 and Task 6 Step 4; byte-reproducibility → Task 6 Step 2. §8 file table → the File
Structure table. §9 provenance → Task 6 Step 6.

**Type consistency.** `LABS.KIT.transport(root, {key, max, ms, get, set, redraw})` is defined in
Task 1 Step 3 and called with exactly those six keys in Tasks 1, 3, 4 and 5. `LABS.KIT.runbar()`
takes no argument everywhere. `hasRun` is produced in Task 2 Step 2 and consumed in Task 2 Step 3
and Task 4 Step 5. `toPhase(g, esn0dB, seed, target, phase)` is defined in Task 4 Step 2 and called
with five arguments in Step 3. `markState`/`advance` are internal to Task 4.

**One thing left to the implementer, on purpose.** Task 2 Step 3 says to match the surrounding
variable names in `labwalk.js`'s walk loop, which is readable in under a minute at the file. Every
other call in this plan is against a signature that was read rather than assumed: `area` at
`60_plot.js:246`, `poly` at `237`, and the `.seg` token set at `10_style.css:627`.
