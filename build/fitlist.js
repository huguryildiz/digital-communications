/* Lists the fit factor of chosen scenes in normal display and in lecture mode,
   at every reveal step, at 1920×1080. A converted slide or laboratory should
   print 1 in normal display and at least 0.90 in lecture mode.

     cd build && node pw.js fitlist.js m1-lab-          (every id containing it)
     cd build && node pw.js fitlist.js m1-                                     */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');

(async () => {
  const want = process.argv[2] || '';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{ width:1920, height:1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', 'dist', 'Digital_Communications.html'), { waitUntil:'load' });
  await p.waitForTimeout(400);
  const scenes = (await p.evaluate(() => APP.scenes().map(s => ({ id:s.id, steps:s.steps||0 }))))
    .filter(s => s.id.includes(want));
  const rows = [];
  for(const mode of ['normal', 'projector']){
    await p.evaluate(m => { APP.state.display = m; document.body.dataset.display = m; APP.fit(); }, mode);
    for(const s of scenes) for(let st = 0; st <= s.steps; st++){
      await p.evaluate(([id, k]) => APP.goId(id, k), [s.id, st]);
      await p.waitForTimeout(160);
      const m = await p.evaluate(() => { const h = document.getElementById('scene-host');
        return { fit:+(h.dataset.fit||1), capped:h.dataset.capped||'', grown:h.dataset.grown||'' }; });
      rows.push([mode, s.id, st, m.fit, m.capped, m.grown]);
    }
  }
  for(const r of rows) console.log(r[0].padEnd(10), r[1].padEnd(26), 'step', String(r[2]).padEnd(2),
    'fit', String(r[3]).padEnd(6), r[4] ? 'capped '+r[4] : '', r[5] ? 'grown '+r[5] : '');
  const bad = rows.filter(r => (r[0]==='normal' && r[3] < 1) || (r[0]==='projector' && r[3] < 0.9));
  console.log('\nBELOW TARGET: ' + (bad.length ? bad.map(r => `${r[1]}/${r[2]} ${r[0]} ${r[3]}`).join(', ') : 'none'));
  console.log('ERRORS: ' + (errs.length ? errs.slice(0,5).join(' | ') : 'none'));
  await b.close();
})();
