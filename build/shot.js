/* Render scenes to `shots/` and report nothing else.

   Usage:  node pw.js shot.js [id[,id…]] [--dark] [--step=N] [--all-steps]

   No gate reads a rendering. Two of the four bugs found in the course this
   engine came from were invisible to every gate and visible at a glance, so
   this exists to be looked at rather than to pass. With no argument it renders
   every scene at its last reveal state, which is what qa.js also does; with an
   id it renders that one, which is what a scene under construction needs. */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const args = process.argv.slice(2);
  const dark = args.includes('--dark');
  const allSteps = args.includes('--all-steps');
  const stepArg = (args.find(a => a.startsWith('--step=')) || '').split('=')[1];
  const only = args.filter(a => !a.startsWith('--'))[0];
  const ids = only ? only.split(',') : null;

  const file = 'file://' + path.resolve(__dirname, '..', 'dist', 'Digital_Communications.html');
  const outDir = path.resolve(__dirname, '..', 'shots');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto(file, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  if (dark) { await page.keyboard.press('d'); await page.waitForTimeout(250); }

  const scenes = await page.evaluate(() => APP.scenes().map(s => ({ id: s.id, steps: s.steps || 0 })));
  const written = [];
  for (const s of scenes) {
    if (ids && !ids.includes(s.id)) continue;
    const steps = allSteps ? Array.from({ length: s.steps + 1 }, (_, i) => i)
                 : [stepArg != null ? Math.min(+stepArg, s.steps) : s.steps];
    for (const st of steps) {
      await page.evaluate(([id, step]) => { APP.goId(id, step); }, [s.id, st]);
      await page.waitForTimeout(190);
      const f = path.join(outDir, `${s.id}__s${st}${dark ? '__dark' : ''}.png`);
      await page.screenshot({ path: f });
      written.push(path.basename(f));
    }
  }
  console.log('SHOTS: ' + (written.length ? written.join(' ') : 'none — no scene matched'));
  console.log('CONSOLE ERRORS: ' + (errors.length ? errors.length + '\n  ' + errors.slice(0, 10).join('\n  ') : 'none'));
  await browser.close();
})();
