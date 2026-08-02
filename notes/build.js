const fs=require('fs'), path=require('path');
const S=p=>fs.readFileSync(path.join(__dirname,p),'utf8');
const B=path.join(__dirname,'..','build','src');
const g=s=>s.replace(/<\/script>/gi,'<\\/script>');

/* The chapters are the files that exist, not a list written here. A chapter
   written and never added to a list is a chapter that reaches no page and
   fails no gate, which is the quietest way to lose work. `src/c1.js` declares
   `C1`, `src/c0.js` declares `C0`: the global is the file name in capitals, so
   discovering the file is discovering the array.

   They are ordered by the number in the name so that chapter 10, if this
   course ever grows one, does not sort between 1 and 2. */
const chapters = fs.readdirSync(path.join(__dirname,'src'))
  .filter(f=>/^c\d+\.js$/.test(f))
  .sort((a,b)=>parseInt(a.slice(1),10)-parseInt(b.slice(1),10))
  /* The appendices follow the numbered chapters, in letter order. `editions.js`
     slices the formula summary out of `ca.js`, so it has to be the same file
     the notes carry rather than a second copy. */
  .concat(fs.readdirSync(path.join(__dirname,'src'))
    .filter(f=>/^c[a-z]\.js$/.test(f)).sort());
const globals = chapters.map(f=>f.replace(/\.js$/,'').toUpperCase());

const html=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Digital Communications — Lecture Notes</title>
<style>${fs.readFileSync(path.join(B,'20_katex.css'),'utf8')}</style>
<style>${S('src/notes.css')}</style></head><body><div id="doc"></div>
<script>${g(fs.readFileSync(path.join(B,'30_katex.js'),'utf8'))}</script>
<script>${g(fs.readFileSync(path.join(B,'60_plot.js'),'utf8'))}</script>
<script>${g(S('src/render.js'))}</script>
${chapters.map(f=>`<script>${g(S('src/'+f))}</script>`).join('\n')}
<script>renderNotes([].concat(${globals.join(',') || ''}), document.getElementById('doc')); document.title=document.title;</script>
</body></html>`;
fs.mkdirSync(path.join(__dirname,'..','dist'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'..','dist','Lecture_Notes.html'), html);
console.log('notes html', (html.length/1048576).toFixed(2)+' MB', '·',
  chapters.length, 'chapter'+(chapters.length===1?'':'s'),
  chapters.length? '· '+globals.join(' ') : '(none yet)');
