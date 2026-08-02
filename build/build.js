const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname,'src');
const read = f => fs.readFileSync(path.join(SRC,f),'utf8');

const jsFiles = ['30_katex.js','60_plot.js','80_content_core.js','40_core.js','70_labs.js','90_app.js']
  .concat(fs.readdirSync(SRC).filter(f=>/^[78][1-9]_|^9[1-9]_/.test(f) && f.endsWith('.js')).sort());

/* `assets/icon.svg` is the only copy of the mark. It reaches the page twice — as the
   favicon, where it has to be a URL-encoded data URI, and as the header logo,
   where it is inlined so that the stylesheet can size and animate it. The
   lecture notes and the three editions read the same file through
   `window.ICON_SVG`, so there is one drawing and no copies to keep in step. */
const icon = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'icon.svg'), 'utf8').trim();
const faviconURI = 'data:image/svg+xml,' + encodeURIComponent(icon)
  .replace(/'/g, '%27').replace(/"/g, '%22');
const headerIcon = icon
  .replace(/^<svg /, '<svg class="eelogo" aria-hidden="true" focusable="false" ')
  .replace(/\swidth="\d+"\sheight="\d+"/, '');

let head = read('00_head.html')
  .replace('/*__KATEX_CSS__*/', () => read('20_katex.css'))
  .replace('/*__APP_CSS__*/',  () => read('10_style.css'))
  .replace('/*__FAVICON__*/',  () => faviconURI)
  .replace('<!--__ICON__-->',  () => headerIcon);

const guard = s => s.replace(/<\/script>/gi, '<\\/script>');
const scripts = jsFiles.map(f => `<script>\n/* ==== ${f} ==== */\n` + guard(read(f)) + `\n</script>`).join('\n');

const out = head + '\n' + scripts + '\n' + read('99_tail.html');
const dest = path.join(__dirname,'..','dist','Digital_Communications.html');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest, out);
console.log('built', dest, (out.length/1024/1024).toFixed(2)+' MB', '·', jsFiles.length, 'js modules');
