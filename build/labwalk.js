/* Exhaustive laboratory walk — the check no other gate performs.

   mathscan.js only ever sees whatever a laboratory shows first: it does not drive
   [data-nav], [data-case], [data-wave], [data-fac] or a segmented control, so damage
   in the second and later signals, systems, cases or presets of a laboratory is
   invisible to it. This script opens every such item of every laboratory, in both
   themes, moves each slider to the bottom, middle and top of its range, and reads
   the resulting state back out.

   A state fails on any of: a KaTeX error node, mathematics left as literal $...$
   outside a .katex subtree, a TeX macro left in the running text, a readout that has
   gone to NaN / Infinity / undefined, a panel that drew no figure where one belongs,
   or a console or page error logged while the state was open.

   **Nothing about the laboratories is written down here.** The list of laboratories
   comes from the scene list, and each one's controls are read off its own rendered
   DOM: the item selectors, the segmented controls, the item list and the sliders.
   An earlier version carried a hand-written table of all four, which meant a
   laboratory that gained a control the table did not name was walked without it and
   nothing said so. Discovery removes that failure mode; the cost is that a control
   using an attribute this file does not know about is still invisible, so ATTRS is
   the one thing to extend when the design system gains a new kind of control.

   Run it through pw.js like the gates: cd build && node pw.js labwalk.js            */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');

/* Attributes that select one item out of a mutually exclusive set. Each distinct
   attribute becomes one dimension of the walk; each of its values, one position. */
const ATTRS = ['data-case', 'data-wave', 'data-fac', 'data-cls', 'data-prop', 'data-stage'];
const MAX_COMBOS = 60;      /* per laboratory; a breach is reported, never silent */

(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'dist', 'Digital_Communications.html');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(file, { waitUntil: 'load' });
  await p.waitForTimeout(400);

  const problems = [];
  const notes = [];
  let states = 0;

  /* ---- which scenes carry a laboratory, read off the scene list ---- */
  /* The scene list is taken from the running artifact rather than from a list
     of module globals written here. A module added later is invisible to a
     written list, and the walk stays green without having opened it. */
  const LABS = await p.evaluate(() => {
    const S = APP.scenes();
    const found = [];
    const walk = (blocks, sceneId) => (blocks || []).forEach(bl => {
      if (!bl || typeof bl !== 'object') return;
      if (bl.t === 'lab') found.push({ lab: bl.id, scene: sceneId });
      ['left', 'right', 'items', 'blocks'].forEach(k => {
        if (Array.isArray(bl[k])) bl[k].forEach(x => Array.isArray(x) ? walk(x, sceneId) : walk([x], sceneId));
      });
    });
    S.forEach(s => walk(s.blocks, s.id));
    return found;
  });
  /* A build that declares no laboratory has nothing to walk, and saying so is
     the honest report. It is not a failure: the first laboratory is authored
     after the engine is standing, and a gate that cannot run before then is a
     gate that cannot prove the engine stands. What would be a failure is a
     declared laboratory that does not mount, and that is checked below. */
  if (!LABS.length) {
    console.log('LABORATORIES WALKED: none — this build declares no laboratory');
    console.log('STATES WALKED: 0');
    console.log('PROBLEMS: none');
    await b.close();
    process.exit(0);
  }

  /* ---- read one laboratory's controls off its own rendered DOM ---- */
  async function discover() {
    return p.evaluate(a => {
      const lab = document.querySelector('.lab');
      if (!lab) return null;
      const groups = [];
      a.forEach(attr => {
        const vals = [...new Set([...lab.querySelectorAll('[' + attr + ']')]
          .map(e => e.getAttribute(attr)))];
        if (vals.length) groups.push(vals.map(v => `[${attr}="${v}"]`));
      });
      /* a segmented control is one dimension per seg name */
      const segs = [...new Set([...lab.querySelectorAll('[data-seg]')].map(e => e.getAttribute('data-seg')))];
      segs.forEach(sg => {
        const vals = [...new Set([...lab.querySelectorAll(`[data-seg="${sg}"][data-val]`)]
          .map(e => e.getAttribute('data-val')))];
        if (vals.length) groups.push(vals.map(v => `[data-seg="${sg}"][data-val="${v}"]`));
      });
      return {
        groups,
        sliders: [...new Set([...lab.querySelectorAll('[data-v]')].map(e => e.getAttribute('data-v')))],
        hasNav: !!lab.querySelector('[data-nav]'),
        hasReveal: !!lab.querySelector('[data-reveal]'),
        hasRun: !!lab.querySelector('[data-run]'),
        figures: lab.querySelectorAll('svg').length > 0
      };
    }, ATTRS);
  }

  async function probe(tag, wantFigure) {
    states++;
    const r = await p.evaluate(() => {
      const lab = document.querySelector('.lab');
      if (!lab) return { noLab: true };
      const texts = [];
      const walk = document.createTreeWalker(lab, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walk.nextNode())) {
        if (n.parentElement && n.parentElement.closest('.katex')) continue;
        const t = n.nodeValue.trim();
        if (t) texts.push(t);
      }
      const joined = texts.join('  ');
      return {
        katexErrors: lab.querySelectorAll('.katex-error').length,
        literalMath: (joined.match(/\$[^$]{1,120}\$/g) || []).slice(0, 3),
        rawMacro: (joined.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 3),
        badNum: (joined.match(/\b(NaN|Infinity|-Infinity|undefined)\b/g) || []).slice(0, 3),
        svgs: lab.querySelectorAll('svg').length,
        chars: joined.length
      };
    });
    if (r.noLab) { problems.push(`${tag}: no laboratory element on the page`); return; }
    if (r.katexErrors) problems.push(`${tag}: ${r.katexErrors} KaTeX error node(s)`);
    if (r.literalMath.length) problems.push(`${tag}: literal math ${JSON.stringify(r.literalMath)}`);
    if (r.rawMacro.length) problems.push(`${tag}: raw TeX macro ${JSON.stringify(r.rawMacro)}`);
    if (r.badNum.length) problems.push(`${tag}: bad readout ${JSON.stringify(r.badNum)}`);
    if (wantFigure && !r.svgs) problems.push(`${tag}: no figure drawn`);
    if (r.chars < 40) problems.push(`${tag}: laboratory rendered almost no text (${r.chars} chars)`);
  }

  async function click(sel) {
    const h = await p.$(sel);          // re-query every time: a redraw detaches handles
    if (!h) return false;
    await h.click().catch(() => {});
    await p.waitForTimeout(110);
    return true;
  }
  async function sweep(keys, tag, wantFigure) {
    if (!keys.length) { await probe(tag, wantFigure); return; }
    for (const k of keys) {
      const rng = await p.$eval(`[data-v="${k}"]`, e => ({ min: +e.min, max: +e.max })).catch(() => null);
      if (!rng) continue;
      for (const v of [rng.min, (rng.min + rng.max) / 2, rng.max]) {
        await p.$eval(`[data-v="${k}"]`, (e, val) => {
          e.value = val; e.dispatchEvent(new Event('input', { bubbles: true }));
        }, v).catch(() => {});
        await p.waitForTimeout(70);
        await probe(`${tag} ${k}=${v}`, wantFigure);
      }
    }
  }
  const combos = gs => gs.reduce((acc, g) => acc.flatMap(a => g.map(x => a.concat([x]))), [[]]);

  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') { await p.click('#btn-theme'); await p.waitForTimeout(260); }
    const shown = await p.$eval('#btn-theme', e => e.textContent.trim().toLowerCase());
    if (shown !== theme) problems.push(`theme switch did not take: asked ${theme}, button reads ${shown}`);

    for (const { lab, scene } of LABS) {
      await p.evaluate(i => APP.goId(i, 0), scene);
      await p.waitForTimeout(340);
      const d = await discover();
      if (!d) { problems.push(`${theme} ${lab}: laboratory did not mount in scene ${scene}`); continue; }
      if (theme === 'light') {
        notes.push(`LAB ${lab} (${scene}) groups=${d.groups.length}` +
          ` items=${d.groups.map(g => g.length).join('x') || '-'}` +
          ` sliders=${d.sliders.join(',') || '-'} nav=${d.hasNav ? 'yes' : 'no'}` +
          ` figures=${d.figures ? 'yes' : 'no'}`);
      }

      const cs = combos(d.groups);
      if (cs.length > MAX_COMBOS) {
        problems.push(`${theme} ${lab}: ${cs.length} control combinations exceeds the cap of ${MAX_COMBOS}` +
          ` — raise MAX_COMBOS deliberately rather than walking a subset`);
      }
      for (const combo of cs.slice(0, MAX_COMBOS)) {
        for (const sel of combo) await click(sel);
        if (d.hasReveal) await click('[data-reveal]');
        await sweep(d.sliders, `${theme} ${lab} ${combo.join(' ')}`.trim(), d.figures);
      }

      /* an item list traversed with [data-nav] */
      if (d.hasNav) {
        for (let k = 0; k < 12; k++) {
          if (d.hasReveal) await click('[data-reveal]');
          await sweep(d.sliders, `${theme} ${lab} item${k + 1}`, d.figures);
          if (!await click('[data-nav="1"]')) break;
        }
        if (await click('[data-nav="-1"]')) await probe(`${theme} ${lab} back one item`, d.figures);
      }

      /* The transport. `step` and `reset` are discrete: they move the phase axis
         by a whole stage and then the page is still, so a probe after them reads
         the same thing every run. `play` is never pressed, and must never be —
         it is the one control whose result depends on when it is read, and every
         gate on this artifact reads at a fixed delay after navigating. */
      if (d.hasRun) {
        await click('[data-run="reset"]');
        await p.waitForTimeout(60);
        await probe(`${theme} ${lab}: transport reset`, d.figures);
        await click('[data-run="step"]');
        await p.waitForTimeout(60);
        await probe(`${theme} ${lab}: transport step`, d.figures);
        await click('[data-run="reset"]');
        await p.waitForTimeout(60);

        /* The one new numerical claim of this design: twenty-five batches equal
           one run. Its failure is silent — a resting frame that quietly
           disagrees with the released version still looks perfectly fine — so
           it is read off the page rather than trusted.

           `draw()` recomputes everything from `st.phase` alone on every call,
           so two visits to the *same* phase always print the same string
           whether the batching inside is right or wrong — comparing "at
           reset" to "after stepping to the maximum" is no test at all, only a
           check that some trials ran. What the bug this guards against — a
           fresh generator drawn for every batch instead of one continued
           stream — actually does is replay the first batch's trials twenty-
           five times over, so the count at the last batch is exactly twenty-
           five times the count after the first. A correctly continued run
           draws twenty-four more batches of new trials in between and, on
           real random data, essentially never lands on that exact multiple.
           That multiple is the signature read off the page instead. */
        const readMeasured = () => p.evaluate(() => {
          const dt = [...document.querySelectorAll('.lab .readout dt')]
            .find(e => e.textContent.trim() === 'Measured');
          return dt ? dt.nextElementSibling.textContent.trim() : null;
        });
        const wrongCount = s => { const m = /^(\d+) of/.exec(s || ''); return m ? +m[1] : null; };
        /* The slider sweep above left the mark wherever its last combination
           put it, which for a signal-to-noise mark can be its highest setting
           — where a scheme measures zero errors at any trial count, correct
           or broken alike, and 25×0 = 0 tells nothing apart. Drive an `esn0`
           mark, if this laboratory has one, to the bottom of its range first,
           where every scheme has errors to count in even the first batch. */
        const esn0 = await p.$('[data-v="esn0"]');
        if (esn0) {
          await p.$eval('[data-v="esn0"]', e => {
            e.value = e.min; e.dispatchEvent(new Event('input', { bubbles: true }));
          });
          await p.waitForTimeout(70);
        }
        /* The axis is written directly rather than clicked to. `draw()` is a
           pure function of `st`, so phase N reached in one write and phase N
           reached in N presses are the same computation — and pressing costs
           a full redraw of every mark each time, which on this laboratory ran
           the gate past ten minutes on its own. The transport's own buttons
           are exercised by the probes above; this part is arithmetic. */
        const setPhase = v => p.$eval('[data-v="phase"]', (e, val) => {
          e.value = String(val === 'max' ? e.max : val);
          e.dispatchEvent(new Event('input', { bubbles: true }));
        }, v);
        const pmax = await p.$eval('[data-v="phase"]', e => +e.max);
        await setPhase(1);
        await p.waitForTimeout(80);
        const w1 = wrongCount(await readMeasured());
        await setPhase('max');
        await p.waitForTimeout(80);
        const wN = wrongCount(await readMeasured());
        if (w1 !== null && wN !== null && w1 > 0 && wN === pmax * w1)
          problems.push(`${theme} ${lab}: accumulation differs from one run — ` +
                        `batch one measured ${w1} wrong, all ${pmax} measured ` +
                        `${wN}, exactly ${pmax}×${w1}`);
        await click('[data-run="reset"]');
      }
    }
  }

  notes.forEach(n => console.log(n));
  console.log('LABORATORIES WALKED: ' + LABS.map(l => l.lab).join(' '));
  console.log('STATES WALKED: ' + states);
  console.log('PROBLEMS: ' + (problems.length ? '\n  ' + problems.join('\n  ') : 'none'));
  console.log('CONSOLE/PAGE ERRORS: ' + (errs.length ? '\n  ' + errs.slice(0, 20).join('\n  ') : 'none'));
  await b.close();
  process.exit(problems.length || errs.length ? 1 : 0);
})();
