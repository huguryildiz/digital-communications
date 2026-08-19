/* Count visible note boxes per scene at the last reveal step. Not a gate —
   a one-off audit for the note-box diet: a teaching scene should show at most
   two boxes when fully revealed. */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');

(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'dist', 'Digital_Communications.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(file, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const scenes = await page.evaluate(() => APP.scenes().map(s => ({ id: s.id, steps: s.steps || 0 })));
  const rows = [];
  for (const s of scenes) {
    await page.evaluate(([id, step]) => { APP.goId(id, step); }, [s.id, s.steps]);
    await page.waitForTimeout(60);
    const n = await page.evaluate(() => {
      const inner = document.getElementById('scene-host').firstElementChild;
      /* instructor panels and worked-solution wrappers are not note boxes */
      return inner ? inner.querySelectorAll('.note:not(.instr-panel .note)').length : 0;
    });
    rows.push([s.id, n]);
  }
  rows.sort((a, b) => b[1] - a[1]);
  console.log('THREE OR MORE:', JSON.stringify(rows.filter(r => r[1] >= 3)));
  console.log('TWO:', rows.filter(r => r[1] === 2).length,
              'ONE:', rows.filter(r => r[1] === 1).length,
              'ZERO:', rows.filter(r => r[1] === 0).length);
  await browser.close();
})();
