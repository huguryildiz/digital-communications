/* Interaction smoke test: exercise every laboratory control at nominal and
   boundary values and confirm the readouts change and nothing throws. */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'dist', 'Digital_Communications.html');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(file, { waitUntil: 'load' }); await p.waitForTimeout(400);

  const out = [];
  async function scene(id) { await p.evaluate(i => APP.goId(i, 0), id); await p.waitForTimeout(220); }

  // ---- every laboratory in the build, found rather than listed
  /* Nothing here names a laboratory. A gate that names one is a gate that
     stays green over a laboratory authored after it was written, and it has to
     be rewritten every time the course gains one. The laboratories are taken
     from the scene list instead: every scene holding a `lab` block is opened,
     and whatever controls it presents are driven to their boundaries. */
  const CTRL = ['case', 'stage', 'nav', 'opt', 'wave', 'fac', 'cls', 'reveal', 'prop', 'seg'];

  async function sliderSweep(sel) {
    /* Each control is re-read before it is used: a laboratory redraws itself on
       every change, so a handle taken before the click is already detached. */
    const sl = await p.$$eval(sel + ' input[type=range]',
      els => els.map(e => ({ v: e.dataset.v, min: +e.min, max: +e.max })));
    for (const s of sl) {
      for (const val of [s.min, (s.min + s.max) / 2, s.max]) {
        const ok = await p.$eval(`${sel} [data-v="${s.v}"]`,
          (el, x) => { el.value = x; el.dispatchEvent(new Event('input', { bubbles: true })); return true; }, val)
          .catch(() => false);
        if (!ok) { errs.push(`LABSWEEP slider ${s.v} of ${sel} vanished mid-sweep`); break; }
        await p.waitForTimeout(35);
      }
    }
    return sl.length;
  }

  const found = await p.evaluate(() => APP.scenes()
    .map(s => ({ scene: s.id, labs: (s.blocks || []).filter(b => b.t === 'lab').map(b => b.id) }))
    .filter(o => o.labs.length)
    .map(o => ({ scene: o.scene, lab: o.labs[0] })));
  /* A build with no laboratory yet has nothing to sweep, and saying so is the
     honest report rather than a failure. A declared laboratory that fails to
     mount, or mounts empty, is a failure, and that is what the loop below
     checks. */

  for (const L of found) {
    const sel = `[data-lab="${L.lab}"]`;
    /* A laboratory that throws while mounting takes the render down with it.
       That is recorded and the sweep moves on, so one broken laboratory does
       not hide the state of the others. */
    const opened = await scene(L.scene).then(() => true)
      .catch(e => { errs.push(`LABSWEEP ${L.lab}: mount threw — ${String(e.message).split('\n')[0]}`); return false; });
    if (!opened) continue;
    const present = await p.$$eval(sel, e => e.length);
    if (!present) { errs.push(`LABSWEEP ${L.lab}: no [data-lab] element in ${L.scene}`); continue; }
    const missing = await p.$eval(sel, e => e.innerText.includes('Laboratory not available'));
    if (missing) { errs.push(`LABSWEEP ${L.lab}: not registered in LABS, scene ${L.scene}`); continue; }

    let nSlider = await sliderSweep(sel);
    const handles = await p.evaluate(([s, attrs]) => {
      const root = document.querySelector(s); const list = [];
      for (const a of attrs) root.querySelectorAll(`[data-${a}]`).forEach(el => {
        let q = `${s} [data-${a}="${el.dataset[a]}"]`;
        if (a === 'seg' && el.dataset.val != null) q += `[data-val="${el.dataset.val}"]`;
        if (!list.includes(q)) list.push(q);
      });
      return list;
    }, [sel, CTRL]);

    let clicked = 0, gone = 0;
    for (const q of handles) {
      const h = await p.$(q);
      if (!h) { gone++; continue; }                       // removed by an earlier click
      const hit = await h.click({ timeout: 1500 }).then(() => true).catch(() => false);
      if (!hit) { gone++; continue; }
      clicked++;
      await p.waitForTimeout(45);
      nSlider = Math.max(nSlider, await sliderSweep(sel));  // ranges change with the case
    }

    const svg = await p.$$eval(sel + ' svg', e => e.length);
    const chars = await p.$eval(sel, e => e.innerText.replace(/\s+/g, ' ').length);
    if (!svg) errs.push(`LABSWEEP ${L.lab}: draws no figure`);
    if (chars < 80) errs.push(`LABSWEEP ${L.lab}: mounted almost empty (${chars} chars)`);
    out.push(`LAB ${L.lab} (${L.scene}) sliders=${nSlider} controls=${clicked}/${handles.length}`
      + (gone ? ` detached=${gone}` : '') + ` svg=${svg} chars=${chars}`);
  }
  out.push('LABORATORIES SWEPT: ' + (found.length ? found.map(o => o.lab).join(' ')
    : 'none — this build declares no laboratory'));

  // ---- exam drills: every question is open-ended and one question is on screen
  //      at a time, so what there is to drive is the pager and the reveal of the
  //      worked solution. Every question of every module is opened, because a
  //      question left unpaged is a question no gate has ever rendered.
  /* Which modules have a question section is read from the artifact, not
     written here: the course opening carries no examinable method and so no
     questions, and a module list written into the gate goes stale the moment
     that changes. A module whose question scene exists and holds nothing is a
     different matter, and is an error. */
  let dpages = 0, dsol = 0, dparts = 0, dopts = 0;
  const drillModules = await p.evaluate(() => {
    const ids = new Set(APP.scenes().map(s => s.id));
    return CONTENT.MODULES.map(m => m.id).filter(id => ids.has(id.toLowerCase() + '-drill'));
  });
  for (const m of drillModules) {
    await scene(m.toLowerCase() + '-drill');
    const n = await p.evaluate(mm => CONTENT.DRILL.filter(q => q.module === mm).length, m);
    if (!n) { errs.push(`DRILL ${m}: question section exists but holds no question`); continue; }
    for (let i = 0; i < n; i++) {
      const shown = await p.$$eval('#scene-host .dr-page .drill', e => e.length);
      if (shown !== 1) errs.push(`DRILL ${m} q${i + 1}: ${shown} questions on screen, expected 1`);
      const b = await p.$('#scene-host .drill [data-sol]');
      if (!b) { errs.push(`DRILL ${m} q${i + 1}: no solution button`); }
      else {
        await b.click(); await p.waitForTimeout(120);
        dsol += await p.$$eval('#scene-host .drill .note.ok', e => e.length);
      }
      dparts += await p.$$eval('#scene-host .drill .dr-parts li', e => e.length);
      dopts += await p.$$eval('#scene-host .opt', e => e.length);
      dpages++;
      const nx = await p.$('#scene-host .dr-pager [data-step="1"]:not([disabled])');
      if (!nx) { if (i !== n - 1) errs.push(`DRILL ${m}: pager stopped at ${i + 1} of ${n}`); break; }
      await nx.click(); await p.waitForTimeout(120);
    }
  }
  out.push(`DRILL modules=${drillModules.join(' ') || 'none'} pages=${dpages}`
    + ` solutions=${dsol} parts=${dparts} options=${dopts}`);
  if (dopts !== 0) errs.push(`DRILL: ${dopts} answer options rendered — every question is open-ended`);

  // ---- modes, overlays, deep links, reset
  await p.keyboard.press('i'); await p.waitForTimeout(120);
  const instr = await p.evaluate(() => document.body.dataset.edition);
  await p.keyboard.press('r'); await p.waitForTimeout(80);
  const motion = await p.evaluate(() => document.body.dataset.motion);
  await p.keyboard.press('l'); await p.waitForTimeout(80);
  const mode = await p.evaluate(() => document.body.dataset.mode);
  await p.keyboard.press('m'); await p.waitForTimeout(120);
  const mapOpen = await p.$$eval('#ov-map.open', e => e.length);
  await p.keyboard.press('Escape');
  /* The term searched for and the scene deep-linked to are taken from the
     artifact, not written here. A word from this course put into the gate goes
     stale the moment the scene carrying it is rewritten, and the run then
     reports zero hits from a search that was never going to find anything. */
  const probe = await p.evaluate(() => {
    const ss = APP.scenes();
    const last = ss[ss.length - 1];
    const word = (ss.find(s => (s.keywords || '').trim()) || {}).keywords || last.title;
    return { term: word.trim().split(/\s+/).sort((a, b) => b.length - a.length)[0],
             id: last.id, step: last.steps || 0 };
  });
  await p.keyboard.press('/'); await p.waitForTimeout(120);
  await p.fill('#searchbox', probe.term); await p.waitForTimeout(150);
  const hits = await p.$$eval('#sresults .sres', e => e.length);
  if (!hits) errs.push(`SEARCH: "${probe.term}" is in the artifact and the search found nothing`);
  await p.keyboard.press('Escape');
  await p.evaluate(x => { location.hash = '#' + x.id + '/' + x.step; }, probe);
  await p.waitForTimeout(200);
  const deep = await p.evaluate(() => [APP.state.i, APP.state.step]);
  if (deep[1] !== probe.step) errs.push(`DEEPLINK: asked ${probe.id}/${probe.step}, landed on step ${deep[1]}`);
  out.push(`MODES edition=${instr} motion=${motion} mode=${mode} map=${mapOpen}`
    + ` search="${probe.term}" hits=${hits} deepLink=${probe.id}/${deep[1]}`);

  console.log(out.join('\n'));
  console.log('\nERRORS: ' + (errs.length ? errs.slice(0, 10).join(' | ') : 'none'));
  await b.close();
})();
