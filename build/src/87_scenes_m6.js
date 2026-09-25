/* ==========================================================================
   Module 6 — An introduction to information theory.

   Two numbers carry the module. A source has an entropy: the fewest bits a
   symbol that any lossless code can reach. A channel has a capacity: the most
   bits a use that any code can carry reliably. The first half measures and
   reaches the entropy (Huffman, arithmetic and Lempel–Ziv coding), the second
   measures and reaches toward the capacity (mutual information, the binary
   channels, the Gaussian channel and Shannon's formula).

   Every teaching scene is a slide in the reference design (DESIGN.md), as in
   Modules 1 to 5: one figure on the left, two to four cards on the right, a
   prediction card on each slide, and each section closing on a gallery, a
   laboratory and a code page. Most figures move: a sequence is played in
   frames, a continuous parameter is a slider.

   Colour, as everywhere in this course: cyan is a source symbol, its
   probability or the entropy it carries; amber the channel and the
   uncertainty the channel adds; violet an intermediate quantity (a codeword,
   a code length, a rate being built); green what is received or delivered
   (mutual information, capacity, a decoded symbol); red an error, a lost
   quantity or an impossible region. Noise takes no colour of its own.

   The drawing helpers are the ones Module 5 uses, kept here so that this file
   stands on its own. Every number a figure prints is recomputed by
   verify/verify_m6.py.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* ---- drawing helpers (as Module 5) ---------------------------------------- */
const SZ  = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const EXO = o => Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3}, o);
const clamp01 = x => Math.max(0, Math.min(1, x));
const frameOf = (v, last) => v && v.frame!=null ? v.frame : last;
const f2 = v => v.toFixed(2);
const num = (v, d=2) => { const s = v.toFixed(d); return /^-0\.0*$/.test(s) ? s.slice(1) : s; };
const sci = (v, d=2) => { if(!(v > 0)) return '0'; const e = Math.floor(Math.log10(v)), m = v/Math.pow(10, e);
  return e >= -1 ? num(v, 3) : m.toFixed(d)+'\\times10^{'+e+'}'; };
const rgba = (hex, al) => { const h = hex.replace('#','');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${al})`; };

function erfc(x){ const z = Math.abs(x), t = 1/(1+0.5*z);
  const r = t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+
    t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x >= 0 ? r : 2-r; }
const Qf = x => 0.5*erfc(x/Math.SQRT2);
const dB = db => Math.pow(10, db/10);
const todB = x => 10*Math.log10(x);
function reach(g, target, lo=-10, hi=60){
  for(let i=0;i<90;i++){ const m = (lo+hi)/2; if(g(m) > target) lo = m; else hi = m; }
  return (lo+hi)/2;
}
/* Seeded draws (mulberry32): the same on every render, and the same as the
   port in verify/verify_m6.py. */
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }

const takeH = h0 => { const h = P.hOverride || h0; P.hOverride = null; return h; };
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };
const fade = (svg, o) => o < 0.02 ? '' : `<g opacity="${o.toFixed(3)}">${svg}</g>`;

function arrow(a, x0,y0,x1,y1, o={}){
  const X0=a.sx(x0), Y0=a.sy(y0), X1=a.sx(x1), Y1=a.sy(y1), L=Math.hypot(X1-X0,Y1-Y0);
  if(L < 3) return;
  const ux=(X1-X0)/L, uy=(Y1-Y0)/L, hd=12*(o.head||1), col=o.color||C.in;
  const op = o.opacity!=null ? ` opacity="${o.opacity.toFixed(3)}"` : '';
  a.raw(`<line x1="${f2(X0)}" y1="${f2(Y0)}" x2="${f2(X1-hd*0.8*ux)}" y2="${f2(Y1-hd*0.8*uy)}" stroke="${col}" stroke-width="${o.width||2.6}" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}${op}/>`
    + `<path d="M${f2(X1)},${f2(Y1)} L${f2(X1-hd*ux-hd*0.42*uy)},${f2(Y1-hd*uy+hd*0.42*ux)} L${f2(X1-hd*ux+hd*0.42*uy)},${f2(Y1-hd*uy-hd*0.42*ux)} Z" fill="${col}"${op}/>`);
}
function seg(a, pts, o={}){
  if(pts.length < 2) return;
  const d = 'M'+pts.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L');
  a.raw(`<path d="${d}" fill="none" stroke="${o.color||C.muted}" stroke-width="${o.width||1.4}" stroke-linejoin="round" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function trace(a, f, lo, hi, o={}){
  const n = o.n || 600, pts = [];
  lo = Math.max(lo, a.o.xr[0]); hi = Math.min(hi, a.o.xr[1]);
  if(hi <= lo) return;
  for(let i=0;i<=n;i++){ const t = lo+(hi-lo)*i/n; pts.push([t, f(t)]); }
  seg(a, pts, o);
}
function dot(a, x, y, o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||6}" fill="${o.color||C.in}" stroke="${o.ring||'#FCF9F3'}" stroke-width="${o.ringw||1.4}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function ring(a, x, y, o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||13}" fill="none" stroke="${o.color||C.out}" stroke-width="${o.width||2.6}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
/* A filled box in data coordinates. Below an alpha of 0.35 it is a plate,
   which a label may sit on. */
function box(a, x0, y0, x1, y1, fill, o={}){
  a.raw(`<rect x="${f2(Math.min(a.sx(x0),a.sx(x1)))}" y="${f2(Math.min(a.sy(y0),a.sy(y1)))}" width="${f2(Math.abs(a.sx(x1)-a.sx(x0)))}" height="${f2(Math.abs(a.sy(y1)-a.sy(y0)))}" fill="${fill}" stroke="${o.stroke||'none'}" stroke-width="${o.width||1.4}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
const circle = (a, r, o={}) => { const pts=[]; const c = o.c || [0,0];
  for(let i=0;i<=160;i++){ const u=2*Math.PI*i/160; pts.push([c[0]+r*Math.cos(u), c[1]+r*Math.sin(u)]); }
  seg(a, pts, Object.assign({color:C.muted, width:1.2, dash:'4 5'}, o)); };
function disc(a, cx, cy, r, fill, o={}){
  a.raw(`<ellipse cx="${f2(a.sx(cx))}" cy="${f2(a.sy(cy))}" rx="${f2(Math.abs(a.sx(cx+r)-a.sx(cx)))}" ry="${f2(Math.abs(a.sy(cy+r)-a.sy(cy)))}" fill="${fill}" stroke="${o.stroke||'none'}" stroke-width="${o.width||1.3}"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function cloudPts(a, pts, o={}){
  let s = ''; const r = o.r || 2.1;
  pts.forEach(([x,y])=>{ const col = o.color || C.noise;
    s += `<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${r}" fill="${col}" stroke="${col}" stroke-width="0.6"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`; });
  a.raw(s);
}
function wash(a, f, lo, hi, col, al, base){
  lo = Math.max(lo, a.o.xr[0]); hi = Math.min(hi, a.o.xr[1]);
  if(hi <= lo) return;
  const n = 200, pts = [], y0 = base!=null ? base : Math.max(0, a.o.yr[0]);
  for(let i=0;i<=n;i++){ const t=lo+(hi-lo)*i/n; pts.push(f2(a.sx(t))+','+f2(a.sy(Math.max(a.o.yr[0], Math.min(f(t), a.o.yr[1]))))); }
  a.raw(`<path d="M${f2(a.sx(lo))},${f2(a.sy(y0))}L${pts.join('L')}L${f2(a.sx(hi))},${f2(a.sy(y0))}Z" fill="${rgba(col, al==null?0.3:al)}" stroke="none"/>`);
}
/* A probability mass function: a stem with a round head, as every pmf in this course. */
const pmf = (a, pairs, o={}) => pairs.forEach(([x,v])=>{ seg(a, [[x,0],[x,v]], {color:o.color||C.in, width:o.width||1.8}); a.point(x, v, {color:o.color||C.in, r:o.r||4}); });
const lbl = (a, x, y, s, col, anchor, fs) => a.note(x, y, s, {tex:true, fs:fs||15, color:col||C.ink, anchor:anchor||'start'});
/* A plain label (a bit, a digit) with the halo of every figure label. */
const txt = (a, x, y, s, col, anchor, fs, o={}) => a.note(x, y, s, Object.assign({fs:fs||14, color:col||C.muted, anchor:anchor||'middle'}, o));

function bottomTicks(a, vals, fmt){
  const L = P.labelScale(), f = fmt || (v => String(v));
  vals.forEach(v=>{ const X = f2(a.sx(v));
    a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${a.y0+5}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${X}" y="${f2(a.y0+19*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="middle">${f(v)}</text>`); });
  return a;
}
function leftTicks(a, vals, fmt){
  const L = P.labelScale(), f = fmt || (v => String(v));
  vals.forEach(v=>{ const Y = a.sy(v);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x1}" y2="${f2(Y)}" stroke="${C.grid}" stroke-width="1"/>`);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x0-5}" y2="${f2(Y)}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${f2(a.x0-10)}" y="${f2(Y+4.5*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="end">${f(v)}</text>`); });
  return a;
}
const TAx = o => { const xt = o.xt; const a = P.Axes(Object.assign({}, o, {xticksOverride:[]})); return xt ? bottomTicks(a, xt, o.xfmt) : a; };
/* Axes whose x range spans zero keep their y ticks at the left edge. */
const TAxL = o => { const a = leftTicks(TAx(Object.assign({}, o, {yticksOverride:[], zeroAxes:false})), o.yticksOverride, o.ytickfmt);
  a.raw(`<path d="M${f2(a.x0)},${f2(a.y1)}V${f2(a.y0)}H${f2(a.x1)}" fill="none" stroke="${C.axis}" stroke-width="1.5"/>`); return a; };
const bare = o => Object.assign({xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}, o);
let LGF = -99;
const lg10 = v => { const y = Math.log10(Math.max(1e-14, v)); return y < LGF-0.02 ? NaN : y; };
const logAx = o => { const a = TAx(Object.assign({ytickfmt:P.decade, zeroAxes:false}, o)); LGF = a.o.yr[0]; return a; };

/* A gallery of four everyday cases closing a section: the figures in a 2×2
   grid, and the cards beside them revealed one at a time. */
function realGallery(cfg){
  return { id:cfg.id, module:'M6', nav:cfg.nav, title:cfg.title, src:cfg.src,
    objective:cfg.objective, keywords:cfg.keywords,
    budget:cfg.budget||'a gallery of four everyday cases. Each figure is one example',
    slide:true, steps:cfg.notes.length-1, blocks:[
    {t:'eyebrow', text:cfg.eyebrow},
    {t:'title', text:cfg.title},
    {t:'cols', ratio:'c-8-4', fill:true, left:[
      {t:'grid', cols:2, gap:'18px 22px', items:cfg.figs.map(([svg,cap])=>[{t:'fig', frame:true, svg, caption:cap}])}
    ], right:cfg.notes.map((n,i)=>i ? {t:'reveal', at:i, items:[n]} : n)}
  ]};
}

/* ---- the mathematics of the module ---------------------------------------- */
const lg = Math.log2;
const H = ps => -ps.reduce((s,p)=>p > 0 ? s + p*lg(p) : s, 0);
const hb = p => (p<=0||p>=1) ? 0 : -(p*lg(p)+(1-p)*lg(1-p));
/* The entropies of a channel matrix Pyx (row j: the output distribution when
   x_j is sent) driven by an input distribution px, from the definitions. */
function chan(Pyx, px){
  const py = new Array(Pyx[0].length).fill(0);
  Pyx.forEach((row,j)=>row.forEach((v,k)=>{ py[k] += px[j]*v; }));
  const HX = H(px), HY = H(py), HYX = Pyx.reduce((s,row,j)=>s + px[j]*H(row), 0);
  return { py, HX, HY, HYX, HXY:HX+HYX, HXgY:HX+HYX-HY, I:HY-HYX };
}
/* The capacity of a binary-input channel, by searching the one free number. */
function capBinary(Pyx, n){
  n = n || 2000; let best = {q:0, I:0};
  for(let i=0;i<=n;i++){ const q = i/n, I = chan(Pyx, [q, 1-q]).I; if(I > best.I) best = {q, I}; }
  return best;
}
const BSC = p => [[1-p, p],[p, 1-p]];
const BEC = e => [[1-e, e, 0],[0, e, 1-e]];
const ZCH = [[1, 0],[0.5, 0.5]];
const DMC = [[0.8, 0.2],[0.3, 0.7]];
/* The average length of a Huffman code is the sum of the probabilities of the
   merged nodes: each merge adds one bit to every symbol under it. */
function huffAvg(ps){
  let a = ps.slice().sort((x,y)=>x-y), L = 0;
  while(a.length > 1){ const s = a[0] + a[1]; L += s; a = a.slice(2); let i = 0; while(i < a.length && a[i] < s) i++; a.splice(i, 0, s); }
  return L;
}
const prod = (ps, n) => { let out = [1]; for(let k=0;k<n;k++){ const nx = []; out.forEach(u=>ps.forEach(p=>nx.push(u*p))); out = nx; } return out; };
/* log n!, for the binomial weights of the typical-sequence figure */
const LF = [0]; for(let i=1;i<=1200;i++) LF.push(LF[i-1] + Math.log(i));
const binom = (n, k, p) => Math.exp(LF[n]-LF[k]-LF[n-k] + k*Math.log(p) + (n-k)*Math.log(1-p));
const S3 = [0.7, 0.2, 0.1], FIVE = [0.4, 0.2, 0.2, 0.1, 0.1];
const HS3 = H(S3), HFIVE = H(FIVE);

/* ---- a binary tree drawn from its codewords --------------------------------
   Root at the left, depth to the right, leaves one row each and a parent at
   the mean of its children. A codeword that is not at a leaf is drawn at an
   internal node, which is how a code that is not a prefix code looks. */
function drawTree(a, codes, labels, o={}){
  const nodes = new Set(['']); codes.forEach(c=>{ for(let i=1;i<=c.length;i++) nodes.add(c.slice(0,i)); });
  const all = Array.from(nodes);
  const kids = n => all.filter(m => m.length === n.length+1 && m.slice(0,-1) === n);
  const order = all.slice().sort((x,y)=>y.length-x.length || (x<y?-1:1));
  const leaves = all.filter(n=>!kids(n).length).sort();
  const row = {}; leaves.forEach((n,i)=>{ row[n] = i; });
  order.forEach(n=>{ const k = kids(n); if(k.length) row[n] = k.reduce((s,m)=>s+row[m],0)/k.length; });
  const span = Math.max(1, leaves.length-1), ox = o.x0 || 0, dx = o.dx || 1, oy = o.y0 || 0, sy = o.fitH ? o.fitH/span : (o.sy || 1);
  const X = n => ox + n.length*dx, Y = n => oy + (span - row[n])*sy;
  const op = o.opacity;
  all.forEach(n=>{ if(n === '') return; const par = n.slice(0,-1);
    seg(a, [[X(par), Y(par)], [X(n), Y(n)]], {color:C.muted, width:1.6, opacity:op});
    if(o.bits !== false){
      const px = [a.sx(X(par)), a.sy(Y(par))], cx = [a.sx(X(n)), a.sy(Y(n))];
      const sl = Math.abs((cx[1]-px[1])/(cx[0]-px[0])), up = cx[1] < px[1] || (cx[1]===px[1] && n.slice(-1)==='0');
      const off = 5*sl + (up ? 7 : 16);
      txt(a, (X(par)+X(n))/2, (Y(par)+Y(n))/2, n.slice(-1), C.muted, 'middle', 13, {dy: up ? -off : off});
    }
  });
  all.forEach(n=>{ const i = codes.indexOf(n), hot = i >= 0 && o.hot === n;
    dot(a, X(n), Y(n), {color: i >= 0 ? (hot ? C.mid : (o.leaf || C.in)) : C.muted, r: i >= 0 ? (hot ? 7.5 : 6) : 3.4, opacity:op});
    if(i >= 0 && labels[i]) a.note(X(n), Y(n), labels[i], {tex:true, fs:o.fs||15, color: hot ? C.mid : C.ink, dx:12, dy: kids(n).length ? -16 : 0});
  });
  return {X, Y, span};
}

/* ---- a channel drawn as a transition diagram --------------------------------
   Inputs on the left in cyan, outputs on the right in green, a transition the
   channel keeps in amber and one that changes the symbol in red, dashed. The
   probabilities are placed by the caller, where no line crosses them. */
const CX0 = 0.1, CX1 = 0.9;
function chanDiag(a, ins, outs, edges, o={}){
  edges.forEach(([j,k,kind])=>{
    const y0 = ins[j][1], y1 = outs[k][1];
    seg(a, [[CX0, y0],[CX1, y1]], {color: kind==='flip' ? C.err : C.h, width: o.w ? o.w(j,k) : 2.4,
      dash: kind==='flip' ? '7 5' : kind==='erase' ? '3 4' : null, opacity:o.opacity});
  });
  ins.forEach(([s,y])=>{ dot(a, CX0, y, {color:C.in, r:7}); a.note(CX0, y, s, {tex:true, fs:17, color:C.in, anchor:'end', dx:-14}); });
  outs.forEach(([s,y])=>{ dot(a, CX1, y, {color:C.out, r:7}); a.note(CX1, y, s, {tex:true, fs:17, color:C.out, dx:14}); });
}

/* ---- tiles: a matrix drawn as squares whose shade is the entry -------------- */
function tile(a, x, y, w, h, v, col, text, o={}){
  box(a, x, y, x+w, y+h, rgba(col, 0.05 + 0.27*clamp01(v/(o.max||1))), {stroke:C.rule, width:1.2, opacity:o.opacity});
  if(text!=null && (o.opacity==null || o.opacity > 0.4)) a.note(x+w/2, y+h/2, text, {tex:true, fs:o.fs||17, color:o.tcol||C.ink, anchor:'middle', dy:5});
}

/* ---- an information bar ----------------------------------------------------
   One bar of width H(X,Y) cut into H(X|Y), I(X;Y) and H(Y|X), with H(X) over
   it and H(Y) under it: the picture that makes I = H(X) - H(X|Y) obvious. */
function infoBar(a, r, o={}){
  const L = r.HXgY, M = r.I, R = r.HXY - r.HXgY - r.I, y0 = o.y || 0, h = o.h || 0.5;
  box(a, 0, y0, L, y0+h, rgba(C.err, 0.2), {stroke:C.err});
  box(a, L, y0, L+M, y0+h, rgba(C.out, 0.26), {stroke:C.out});
  box(a, L+M, y0, L+M+R, y0+h, rgba(C.h, 0.2), {stroke:C.h});
  seg(a, [[0, y0+h+0.28],[L+M, y0+h+0.28]], {color:C.in, width:2.6});
  seg(a, [[L, y0-0.28],[L+M+R, y0-0.28]], {color:C.out, width:2.6});
  return {L, M, R};
}

/* ---- the navy opening ------------------------------------------------------
   The two numbers of the module on the two binary models: the entropy of a
   binary source and the capacity of the binary symmetric channel. The page
   under this figure is navy, so the traces take the dark-page tints. */
const NAVY = {axis:'rgba(239,231,216,.34)', tick:'#9EACB9', name:'#E6E2D9', grid:'rgba(239,231,216,.10)'};
const T_CY = '#4FBECE', T_GR = '#82C27B', T_INK = '#E6E2D9';
function figOpen(){
  const panel = (f, col, name, h) => {
    const a = P.Axes({w:560, h, xr:[0,1], yr:[0,1.35], xlabel:'p', ylabel:'\\text{bits}', pad:{l:56,r:26,t:24,b:42},
      xticksOverride:[0,0.5,1], yticksOverride:[0,1], grid:false, chrome:NAVY});
    trace(a, f, 0.001, 0.999, {color:col, width:2.8, n:500});
    lbl(a, 0.5, 1.2, name, col, 'middle', 16);
    return [a.svg(), h];
  };
  return stack(560, [panel(hb, T_CY, '\\text{a source: }H_b(p)', 230), panel(p=>1-hb(p), T_GR, '\\text{a channel: }C=1-H_b(p)', 230)]);
}

/* ---- 6.1 information and entropy -------------------------------------------- */

/* Self-information against probability, with the reader's p on it. */
function figSelfInfo(v){
  const p = v ? v.p : 0.125, I = -lg(p);
  const a = TAx(SZ({xr:[0,1.02], yr:[0,7.6], xlabel:'p', ylabel:'I(p)\\;(\\text{bits})', xt:[0,0.25,0.5,0.75,1], yticksOverride:[0,1,2,3,4,5,6,7]}));
  trace(a, u=>-lg(u), 0.004, 1, {color:C.in, width:2.8, n:900});
  seg(a, [[p,0],[p,I],[0,I]], {color:C.ink, width:1.3, dash:'5 4'});
  dot(a, p, I, {color:C.in, r:7});
  lbl(a, 0.98, 6.9, 'p='+num(p,3), C.ink, 'end', 17);
  lbl(a, 0.98, 6.1, 'I(p)=-\\log_2p='+num(I,2)+'\\ \\text{bits}', C.in, 'end', 17);
  return a.svg();
}

/* Twenty questions with eight cards, then a skewed source asked by a tree:
   the average number of yes/no questions is the entropy. */
const Q_TARGET = 5;
function figQuestions(v){
  const f = Math.min(5, frameOf(v, 5)), Ht = takeH(430), hA = Math.round(0.4*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.2,8.2], yr:[-0.9,2.6], pad:{l:16,r:16,t:12,b:10}}));
  const alive = i => { let o = 1;
    if(i < 4) o = Math.min(o, 1-clamp01(f)); if(i < 4 || i > 5) o = Math.min(o, 1-clamp01(f-1)); if(i !== Q_TARGET) o = Math.min(o, 1-clamp01(f-2));
    return 0.18 + 0.82*o; };
  for(let i=0;i<8;i++){ const o = alive(i), hit = i === Q_TARGET && f >= 2.5;
    box(a, i+0.08, 0, i+0.92, 1.3, rgba(hit ? C.out : C.in, 0.22), {stroke: hit ? C.out : C.in, width:1.8, opacity:o});
    txt(a, i+0.5, 0.52, String(i+1), hit ? C.out : C.in, 'middle', 19, {dy:6}); }
  const qs = ['\\text{8 equally likely cards: which one?}', '\\text{Q1: is it in 5 to 8?  yes}', '\\text{Q2: is it 5 or 6?  yes}',
    '3\\text{ questions}=\\log_2 8\\text{ bits}'];
  const qi = Math.min(3, Math.round(f));
  lbl(a, 4, 1.95, qs[qi], C.ink, 'middle', 16);
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-1.3,5.4], yr:[-0.6,3.6], pad:{l:16,r:16,t:10,b:12}}));
  const oT = clamp01(f-3);
  if(oT > 0.02){
    const t = drawTree(b, ['0','10','110','111'], ['A,\\ \\tfrac12','B,\\ \\tfrac14','C,\\ \\tfrac18','D,\\ \\tfrac18'], {dx:1.1, opacity:oT});
    b.note(0, t.Y(''), '\\text{is it A?}', {tex:true, fs:14, color:C.muted, anchor:'end', dx:-10, dy:5});
    if(f > 4.4) lbl(b, 5.3, 3.35, '\\bar{L}=\\tfrac12(1)+\\tfrac14(2)+\\tfrac18(3)+\\tfrac18(3)=1.75', C.mid, 'end', 15);
  }
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* The information each symbol carries and its weighted share. */
function figEntropyBars(){
  const a = TAx(SZ({xr:[0.4,5.3], yr:[-0.55,3.9], ylabel:'\\text{bits}', yticksOverride:[0,1,2,3]}));
  S3.forEach((p,k)=>{
    box(a, k+0.62, 0, k+0.97, -lg(p), rgba(C.in, 0.22), {stroke:C.in, width:1.8});
    box(a, k+1.03, 0, k+1.38, -p*lg(p), rgba(C.mid, 0.3), {stroke:C.mid, width:1.8});
    lbl(a, k+1, -0.4, 's_'+(k+1)+'\\;('+p+')', C.ink, 'middle', 15);
  });
  a.hline(HS3, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.hline(lg(3), {color:C.muted, dash:'2 4', width:1.4, opacity:1});
  lbl(a, 3.55, HS3-0.32, 'H(S)=1.157', C.ink, 'start', 16);
  lbl(a, 3.55, lg(3)+0.14, '\\log_2 3=1.585', C.muted, 'start', 16);
  return a.svg();
}

/* The binary entropy function with the reader's p, and its two terms. */
function figHb(v){
  const p = v ? v.p : 0.11, h = hb(p);
  const a = TAx(SZ({xr:[0,1], yr:[0,1.42], xlabel:'p', ylabel:'\\text{bits}', xt:[0,0.25,0.5,0.75,1], yticksOverride:[0,0.5,1]}));
  trace(a, u=>-u*lg(u), 0.001, 1, {color:C.muted, width:1.5, dash:'5 4'});
  trace(a, u=>-(1-u)*lg(1-u), 0, 0.999, {color:C.muted, width:1.5, dash:'5 4'});
  trace(a, hb, 0.0005, 0.9995, {color:C.in, width:2.8, n:900});
  seg(a, [[p,0],[p,h]], {color:C.ink, width:1.3, dash:'5 4'});
  dot(a, p, h, {color:C.in, r:7});
  lbl(a, 0.5, 1.23, 'H_b('+num(p,2)+')='+num(h,3)+'\\ \\text{bits}', C.in, 'middle', 17);
  return a.svg();
}

/* A four-level source sampled at the Nyquist rate: the level pmf, and the
   samples of one millisecond. */
const RATE_P = [0.4, 0.3, 0.2, 0.1];
const rateWave = t => 0.55*Math.sin(2*Math.PI*1.1*t+0.3) + 0.35*Math.sin(2*Math.PI*2.6*t+1.2);
function figExRate(){
  const Ht = takeH(420), hA = Math.round(0.46*Ht);
  const a = TAx({w:560, h:hA, xr:[0.3,4.7], yr:[0,0.55], xlabel:'\\text{level}', ylabel:'p_k', pad:{l:56,r:26,t:24,b:40}, xt:[1,2,3,4], yticksOverride:[0.1,0.2,0.3,0.4]});
  pmf(a, RATE_P.map((p,k)=>[k+1,p]));
  RATE_P.forEach((p,k)=>lbl(a, k+1.12, p+0.03, String(p), C.in, 'start', 15));
  const b = TAx({w:560, h:Ht-hA, xr:[0,1.02], yr:[-1.2,1.35], xlabel:'t\\;(\\text{ms})', ylabel:'x(t)', pad:{l:56,r:26,t:24,b:42}, xt:[0,0.5], yticksOverride:[-1,0,1]});
  trace(b, rateWave, 0, 1.02, {color:C.in, width:2.4});
  b.stem(Array.from({length:7}, (_,k)=>[k/6, rateWave(k/6)]), {color:C.mid});
  b.span(0, 1/6, 1.1, 'T_s=\\tfrac16\\ \\text{ms}', {tex:true, color:C.mid, fs:15});
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* The self-information of each symbol of S, then of each pair of S^2; the
   dashed line is the average, which doubles. */
const S3PAIRS = [], S3PL = [];
S3.forEach((p,i)=>S3.forEach((q,j)=>{ S3PAIRS.push(p*q); S3PL.push('s_'+(i+1)+'s_'+(j+1)); }));
function figExtension(v){
  const f = clamp01(frameOf(v, 1));
  const a = TAx(SZ({xr:[0,9.2], yr:[-0.9,7.6], ylabel:'I\\;(\\text{bits})', yticksOverride:[0,2,4,6]}));
  const o1 = f, o0 = 1-f;
  if(o0 > 0.02) S3.forEach((p,k)=>{ const c = 1.5+3.1*k;
    box(a, c-1.1, 0, c+1.1, -lg(p), rgba(C.in, 0.22), {stroke:C.in, width:1.8, opacity:o0});
    if(o0 > 0.5) lbl(a, c, -0.55, 's_'+(k+1), C.ink, 'middle', 15); });
  if(o1 > 0.02) S3PAIRS.forEach((p,k)=>{
    box(a, k+0.14, 0, k+0.86, -lg(p), rgba(C.in, 0.22), {stroke:C.in, width:1.6, opacity:o1});
    if(o1 > 0.5) lbl(a, k+0.5, -0.55, S3PL[k], C.ink, 'middle', 12); });
  const Hl = HS3*(1+f);
  a.hline(Hl, {color:C.ink, dash:'6 4', width:1.8, opacity:1});
  lbl(a, 0.2, 7.0, f < 0.5 ? 'H(S)=1.157' : 'H(S^2)=2\\times1.157=2.314', C.ink, 'start', 17);
  return a.svg();
}

/* ---- 6.1 gallery: entropy of real data -----------------------------------
   Every number below is computed here from the data in this file. */
const SPEECH = [
  'four score and seven years ago our fathers brought forth on this',
  'continent a new nation conceived in liberty and dedicated to the proposition',
  'that all men are created equal now we are engaged in a',
  'great civil war testing whether that nation or any nation so conceived',
  'and so dedicated can long endure we are met on a great',
  'battle field of that war we have come to dedicate a portion',
  'of that field as a final resting place for those who here',
  'gave their lives that that nation might live it is altogether fitting',
  'and proper that we should do this but in a larger sense',
  'we can not dedicate we can not consecrate we can not hallow',
  'this ground the brave men living and dead who struggled here have',
  'consecrated it far above our poor power to add or detract the',
  'world will little note nor long remember what we say here but',
  'it can never forget what they did here it is for us',
  'the living rather to be dedicated here to the unfinished work which',
  'they who fought here have thus far so nobly advanced it is',
  'rather for us to be here dedicated to the great task remaining',
  'before us that from these honored dead we take increased devotion to',
  'that cause for which they gave the last full measure of devotion',
  'that we here highly resolve that these dead shall not have died',
  'in vain that this nation under god shall have a new birth',
  'of freedom and that government of the people by the people for',
  'the people shall not perish from the earth'
].join(' ');
const LETTERS = (()=>{ const c = {}; for(const ch of SPEECH) c[ch] = (c[ch]||0)+1;
  const n = SPEECH.length, list = Object.keys(c).map(k=>[k, c[k]/n]).sort((x,y)=>y[1]-x[1] || (x[0]<y[0]?-1:1));
  return { list, H:H(list.map(x=>x[1])), K:list.length }; })();
const LOADED = [0.1,0.1,0.1,0.1,0.1,0.5];
const SCAN = (()=>{ const s = new Array(80).fill(0); [[9,11],[30,33],[52,54],[61,62]].forEach(([u,w])=>{ for(let i=u;i<w;i++) s[i] = 1; }); return s; })();
/* A drawn image: a 64 by 64 product gradient, cut into eight grey levels. */
const GREY = (()=>{ const c = new Array(8).fill(0); for(let x=0;x<64;x++) for(let y=0;y<64;y++) c[Math.floor(8*((x+0.5)/64)*((y+0.5)/64))]++;
  const p = c.map(v=>v/4096); return { p, H:H(p) }; })();
const REAL_ENTROPY = realGallery({ id:'m6-real-entropy', nav:'Entropy around us',
  title:'Entropy around us', eyebrow:'Module 6 · Information and entropy', src:'book 12.1.1, 12.2',
  objective:'Compute the entropy of letters, dice, a scanned line and an image from their measured frequencies.',
  keywords:'examples entropy english letters frequency speech 27 symbols fair die loaded die scan line fax pixel grey level histogram image',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[1,5,10,15,20], xr:[0,25.5], yr:[0,0.22], xlabel:'k\\;(\\text{rank})', ylabel:'p_k', yticksOverride:[0.1,0.2]}));
      pmf(a, LETTERS.list.map((x,k)=>[k+1, x[1]]), {r:3});
      lbl(a, 2.2, 0.188, '\\text{space}', C.ink, 'start', 14); lbl(a, 3.2, 0.118, 'e', C.ink, 'start', 14);
      return a.svg(); },
      'The $'+LETTERS.K+'$ symbols of a short speech, letters and space, by frequency. $H=-\\sum_kp_k\\log_2p_k='+num(LETTERS.H,2)+'$ bits a symbol, against $\\log_2'+LETTERS.K+'='+num(lg(LETTERS.K),2)+'$.'],
    [()=>{ const a = TAx(EXO({xt:[1,6,8,13], xr:[0,14], yr:[0,0.62], xlabel:'\\text{face}', ylabel:'p_k', yticksOverride:[0.2,0.4]}));
      pmf(a, [1,2,3,4,5,6].map(k=>[k, 1/6]));
      pmf(a, LOADED.map((p,k)=>[k+8, p]));
      lbl(a, 3.5, 0.3, '\\text{fair}', C.ink, 'middle', 14); lbl(a, 10.5, 0.3, '\\text{loaded}', C.ink, 'middle', 14);
      return a.svg(); },
      'A fair die carries $\\log_26=2.585$ bits a throw. A die loaded to show six half the time carries $H='+num(H(LOADED),3)+'$ bits.'],
    [()=>{ const a = TAx(EXO({xt:[0,2.5,5,7.5,10], xr:[0,10], yr:[-0.2,1.45], xlabel:'x\\;(\\text{mm})', ylabel:'b(x)', yticksOverride:[0,1]}));
      const pts = [[0,0]]; SCAN.forEach((b,i)=>{ pts.push([i/8, b], [(i+1)/8, b]); });
      a.poly(pts, {color:C.in, width:2.2});
      return a.svg(); },
      'A scanned text line, $8$ pixels a millimetre, is $90\\%$ white. As independent pixels it carries $H_b(0.1)='+num(hb(0.1),3)+'$ bit a pixel, not $1$.'],
    [()=>{ const a = TAx(EXO({xt:[0,1,2,3,4,5,6,7], xr:[-0.6,7.6], yr:[0,0.5], xlabel:'g\\;(\\text{grey level})', ylabel:'p(g)', yticksOverride:[0.2,0.4]}));
      pmf(a, GREY.p.map((p,g)=>[g,p]));
      return a.svg(); },
      'A drawn $64\\times64$ grey image, $8$ levels. Its histogram gives $H='+num(GREY.H,2)+'$ bits a pixel, below $\\log_28=3$.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Frequencies in, bits out', html:'Count how often each symbol occurs, then apply $H=-\\sum_kp_k\\log_2p_k$.'},
    {t:'note', kind:'ok', head:'Uneven is cheaper', html:'Each source here sits below $\\log_2K$. The gap is what a variable-length code can save.'},
    {t:'note', kind:'warn', head:'Memory', html:'Letters and pixels depend on their neighbours. The entropy with memory is lower still, about $1.3$ bits a letter for English.'}
  ]});

/* ---- 6.2 the limits of compression -------------------------------------------- */

/* The encoder, and a dyadic source whose code lengths equal its information. */
const DY = [0.5, 0.25, 0.125, 0.125], DYC = ['0','10','110','111'];
function figCodeLength(){
  const Ht = takeH(420), hA = Math.round(0.3*Ht);
  const blk = P.blocks({w:560, h:hA, items:[
    {t:'box', x:20, y:hA/2-30, w:112, h:60, label:'source'},
    {t:'arrow', x1:132, y1:hA/2, x2:206, y2:hA/2, label:'s_k', tex:true},
    {t:'box', x:206, y:hA/2-30, w:170, h:60, label:'source encoder'},
    {t:'arrow', x1:376, y1:hA/2, x2:450, y2:hA/2, label:'\\mathtt{110}', tex:true},
    {t:'text', x:500, y:hA/2+6, label:'bits'}]});
  const b = TAx({w:560, h:Ht-hA, xr:[0.4,5.9], yr:[-0.75,3.6], ylabel:'\\text{bits}', pad:{l:56,r:26,t:24,b:14}, yticksOverride:[0,1,2,3]});
  DY.forEach((p,k)=>{
    box(b, k+0.64, 0, k+0.98, -lg(p), rgba(C.in, 0.22), {stroke:C.in, width:1.8});
    box(b, k+1.02, 0, k+1.36, DYC[k].length, rgba(C.mid, 0.3), {stroke:C.mid, width:1.8});
    lbl(b, k+1, -0.5, '\\mathtt{'+DYC[k]+'}', C.mid, 'middle', 15);
  });
  b.hline(1.75, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  lbl(b, 4.55, 1.95, '\\bar{L}=H=1.75', C.ink, 'start', 15);
  return `<svg viewBox="0 0 560 ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img">${place(blk,0,0,560,hA)}${place(b.svg(),0,hA,560,Ht-hA)}</svg>`;
}

/* The surprise -(1/n) log2 P(x) of every binary sequence of length n, p = 0.2,
   with the binomial weight of each value. It piles up at H as n grows. */
const TS_P = 0.2, TS_H = hb(TS_P), TS_EPS = 0.1, TS_N = [10,20,50,100,200,1000];
const tsStat = n => { let Pt = 0, cnt = 0; for(let k=0;k<=n;k++){ const s = -(k*lg(TS_P)+(n-k)*lg(1-TS_P))/n;
  if(Math.abs(s-TS_H) <= TS_EPS+1e-9){ Pt += binom(n,k,TS_P); cnt += Math.exp(LF[n]-LF[k]-LF[n-k]); } } return {Pt, lc:lg(cnt)}; };
function figTypical(v){
  const n = TS_N[v ? v.i : 3], st = tsStat(n);
  let mx = 0; for(let k=0;k<=n;k++) mx = Math.max(mx, binom(n,k,TS_P));
  const a = TAx(SZ({xr:[0.2,1.62], yr:[0,1.8*mx], xlabel:'-\\tfrac1n\\log_2P(\\mathbf{x})\\;(\\text{bits})', ylabel:'P', xt:[0.4,0.8,1.2], yticksOverride:[]}));
  box(a, TS_H-TS_EPS, 0, TS_H+TS_EPS, 1.8*mx, rgba(C.mid, 0.14));
  const pts = []; for(let k=0;k<=n;k++){ const s = -(k*lg(TS_P)+(n-k)*lg(1-TS_P))/n; if(s <= 1.62) pts.push([s, binom(n,k,TS_P)]); }
  pmf(a, pts, {r: n > 100 ? 2.4 : 3.6, width: n > 100 ? 1.2 : 1.8});
  a.vline(TS_H, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  lbl(a, 1.58, 1.5*mx, 'n='+n+',\\ \\ H=0.722', C.ink, 'end', 16);
  lbl(a, 1.58, 1.3*mx, 'P(\\text{typical})='+num(st.Pt,4), C.mid, 'end', 16);
  lbl(a, 1.58, 1.1*mx, '2^{nH}=2^{'+num(n*TS_H,1)+'}\\text{ of }2^{'+n+'}', C.in, 'end', 16);
  return a.svg();
}

/* All 1024 sequences of ten bits, p = 0.2, in order of their number of ones.
   With the band of the last slide, H ± 0.1, the typical ones have two ones. */
const ST_N = 10, ST_TYP = [2];
const ST = (()=>{ const k = [], pr = []; for(let j=0;j<=ST_N;j++){ const c = Math.round(Math.exp(LF[ST_N]-LF[j]-LF[ST_N-j]));
  for(let i=0;i<c;i++){ k.push(j); pr.push(Math.pow(TS_P,j)*Math.pow(1-TS_P,ST_N-j)); } }
  const typ = k.map(j=>ST_TYP.includes(j)), nT = typ.filter(Boolean).length, pT = pr.reduce((s,p,i)=>s+(typ[i]?p:0), 0);
  return {k, pr, typ, nT, pT}; })();
function figSourceThm(v){
  const f = Math.min(3, frameOf(v, 3)), Ht = takeH(430), hA = Math.round(0.62*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.5,32.5], yr:[-0.5,32.5], pad:{l:40,r:40,t:14,b:10}}));
  const oT = clamp01(f);
  let dAll = '', dTyp = '';
  const cw = (a.x1-a.x0)/33, ch = (a.y0-a.y1)/33;
  ST.k.forEach((j,i)=>{ const X = a.sx(i%32)-cw*0.42, Y = a.sy(31-Math.floor(i/32))-ch*0.42, s = `M${f2(X)},${f2(Y)}h${f2(cw*0.84)}v${f2(ch*0.84)}h${f2(-cw*0.84)}Z`;
    if(ST.typ[i]) dTyp += s; else dAll += s; });
  a.raw(`<path d="${dAll}" fill="${rgba(C.in, 0.12)}" stroke="none"/>`);
  a.raw(`<path d="${dTyp}" fill="${rgba(oT > 0.5 ? C.mid : C.in, 0.12 + 0.2*oT)}" stroke="none"/>`);
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-0.05,1.12], yr:[-0.2,3.2], pad:{l:40,r:40,t:14,b:14}}));
  const o2 = clamp01(f-1), o3 = clamp01(f-2);
  if(f < 0.5) lbl(b, 0.5, 2.3, '2^{10}=1024\\text{ sequences of }n=10\\text{ bits}', C.ink, 'middle', 16);
  else if(f < 1.5) lbl(b, 0.5, 2.3, '\\text{typical: two ones, }'+ST.nT+'\\text{ sequences}', C.mid, 'middle', 16);
  if(o2 > 0.02){
    box(b, 0, 1.55, ST.nT/1024, 2.05, rgba(C.mid, 0.3), {stroke:C.mid, opacity:o2}); box(b, 0, 1.55, 1, 2.05, rgba(C.muted, 0.1));
    box(b, 0, 0.75, ST.pT, 1.25, rgba(C.mid, 0.3), {stroke:C.mid, opacity:o2}); box(b, 0, 0.75, 1, 1.25, rgba(C.muted, 0.1));
    if(o2 > 0.5){ lbl(b, ST.nT/1024+0.02, 1.62, num(100*ST.nT/1024,0)+'\\%\\text{ of the sequences}', C.mid, 'start', 15);
      lbl(b, ST.pT+0.02, 0.82, num(100*ST.pT,0)+'\\%\\text{ of the probability}', C.mid, 'start', 15); }
  }
  if(o3 > 0.5) lbl(b, 0.5, 2.6, '\\text{index: }\\lceil\\log_2'+ST.nT+'\\rceil='+Math.ceil(lg(ST.nT))+'\\text{ bits, not }10', C.ink, 'middle', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* Three codes as trees, then one bit stream read by each. */
const CODES = { I:['0','1','00','11'], II:['0','10','110','111'], III:['0','01','011','0111'] };
const SLAB = ['s_1','s_2','s_3','s_4'];
const PSTREAM = '0101100111';
const parse = (code, s) => { const out = []; let i = 0; while(i < s.length){ let hit = -1;
  code.forEach((c,k)=>{ if(s.startsWith(c, i) && (hit < 0 || c.length > code[hit].length) && (code !== CODES.III || s[i+c.length] !== '1')) hit = k; });
  if(hit < 0) break; out.push([i, i+code[hit].length, hit]); i += code[hit].length; } return out; };
function figPrefix(v){
  const f = Math.min(3, frameOf(v, 3)), Ht = takeH(430), hA = Math.round(0.6*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.4,5.2], yr:[-0.6,3.6], pad:{l:18,r:18,t:14,b:10}}));
  const ops = [1-clamp01(f), clamp01(f)*(1-clamp01(f-1)), clamp01(f-1)*(1-clamp01(f-2)), clamp01(f-2)*0.35];
  ['I','II','III'].forEach((nm,k)=>{ const o = k===2 ? Math.max(ops[2], ops[3]) : ops[k]; if(o < 0.02) return;
    drawTree(a, CODES[nm], SLAB, {dx:1.15, sy: nm==='II' ? 1 : 1, opacity:o, bits: o > 0.5});
    if(o > 0.5) lbl(a, 5.1, 3.3, '\\text{Code '+nm+'}', C.ink, 'end', 17); });
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-2.2,10.4], yr:[-2.6,1.3], pad:{l:18,r:18,t:10,b:10}}));
  for(let i=0;i<10;i++){ box(b, i+0.06, 0.1, i+0.94, 1.1, rgba(C.mid, 0.16), {stroke:C.mid, width:1.4}); txt(b, i+0.5, 0.45, PSTREAM[i], C.mid, 'middle', 17, {dy:6}); }
  lbl(b, -0.2, 0.45, '\\text{bits}', C.ink, 'end', 15);
  const o = clamp01(f-2);
  if(o > 0.5){
    [['II', -0.8], ['III', -1.9]].forEach(([nm, y])=>{ lbl(b, -0.2, y, '\\text{'+nm+'}', C.ink, 'end', 15);
      parse(CODES[nm], PSTREAM).forEach(([u,w,k])=>{ b.span(u+0.1, w-0.1, y+0.55, '', {color:C.out}); lbl(b, (u+w)/2, y, SLAB[k], C.out, 'middle', 15); }); });
  }
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* Each codeword of length l owns the stretch [0.c, 0.c + 2^-l) of the unit
   interval. A prefix code is one whose stretches do not overlap; the Kraft
   sum is their total length. */
const KRAFT = [['I', CODES.I], ['II', CODES.II], ['III', CODES.III], ['1,2,3,4', ['0','10','110','1110']]];
const bval = c => c.split('').reduce((s,b,i)=>s + (+b)*Math.pow(2,-(i+1)), 0);
function figKraft(v){
  const f = Math.min(3, frameOf(v, 3));
  const a = TAx(SZ({xr:[-0.62,1.62], yr:[-1.5,4.3], xt:[0,0.5,1], yticksOverride:[], grid:false}));
  a.vline(1, {color:C.ink, dash:'5 4', width:1.3, opacity:1}); a.vline(0, {color:C.muted, dash:'2 4', width:1, opacity:1});
  KRAFT.forEach(([nm, code], k)=>{ const o = clamp01(1-Math.abs(f-k)); if(o < 0.02) return;
    code.forEach((c,i)=>{ const lo = bval(c), y = 3.3-0.95*i;
      box(a, lo, y-0.3, lo+Math.pow(2,-c.length), y+0.3, rgba(C.in, 0.24), {stroke:C.in, width:1.8, opacity:o});
      if(o > 0.5) lbl(a, -0.05, y-0.08, SLAB[i]+'\\;\\mathtt{'+c+'}', C.ink, 'end', 15); });
    const sum = code.reduce((s,c)=>s+Math.pow(2,-c.length), 0), y = -0.8;
    box(a, 0, y-0.3, Math.min(sum,1), y+0.3, rgba(C.mid, 0.3), {stroke:C.mid, width:1.8, opacity:o});
    if(sum > 1) box(a, 1, y-0.3, sum, y+0.3, rgba(C.err, 0.3), {stroke:C.err, width:1.8, opacity:o});
    if(o > 0.5) lbl(a, -0.05, y-0.08, '\\sum2^{-l_k}='+(sum===1 ? '1' : num(sum, sum===0.9375 ? 4 : 3)), sum > 1 ? C.err : C.mid, 'end', 15);
  });
  return a.svg();
}

/* The two-sided bound against the block length, with the reader's n. */
function figBound(v){
  const n = v ? v.n : 10;
  const a = TAx(SZ({xr:[0.5,10.5], yr:[HS3-0.4,HS3+1.2], xlabel:'n\\;(\\text{symbols a block})', ylabel:'\\text{bits a symbol}', xt:[1,2,4,6,8,10], yticksOverride:[1,1.5,2]}));
  wash(a, u=>HS3+1/u, 0.5, 10.5, C.mid, 0.12, HS3);
  a.hline(HS3, {color:C.in, width:2.4, dash:'1 0', opacity:1});
  trace(a, u=>HS3+1/u, 0.9, 10.5, {color:C.mid, width:2.4});
  for(let k=1;k<=10;k++) dot(a, k, HS3+1/k, {color:C.mid, r: k===n ? 8 : 4.5});
  seg(a, [[n, HS3],[n, HS3+1/n]], {color:C.ink, width:1.3, dash:'5 4'});
  lbl(a, 10.3, HS3+1.06, 'n='+n+':\\ \\ H\\le L_n/n<H+'+num(1/n,3), C.ink, 'end', 16);
  lbl(a, 10.3, HS3-0.26, 'H(S)=1.157', C.in, 'end', 15);
  return a.svg();
}

/* Rate and distortion of a Gaussian source in decibels: a line of slope
   -6.02 dB a bit, with the Lloyd–Max quantizers of Module 1 above it. */
const LM = [[1, 0.3634], [2, 0.1175], [3, 0.03455]];
function figRD(v){
  const R = v ? v.R : 1, D = Math.pow(2, -2*R);
  const a = TAx(SZ({xr:[0,4.2], yr:[-27,2], xlabel:'R\\;(\\text{bits a sample})', ylabel:'D/\\sigma^2\\;(\\text{dB})', xt:[0,1,2,3], yticksOverride:[0,-10,-20]}));
  a.curve(r=>todB(Math.pow(2,-2*r)), {color:C.in, width:2.6});
  LM.forEach(([r,d])=>{ dot(a, r, todB(d), {color:C.mid, r:6.5}); seg(a, [[r, todB(Math.pow(2,-2*r))],[r, todB(d)]], {color:C.mid, width:1.4, dash:'3 3'}); });
  lbl(a, 1.12, todB(0.3634)+0.6, '1.62\\text{ dB}', C.mid, 'start', 14);
  lbl(a, 2.12, todB(0.1175)+0.6, '2.74\\text{ dB}', C.mid, 'start', 14);
  lbl(a, 3.12, todB(0.03455)+0.6, '3.45\\text{ dB}', C.mid, 'start', 14);
  dot(a, R, todB(D), {color:C.in, r:7});
  lbl(a, 0.1, -19.5, 'R='+num(R,1)+':\\ D='+(D >= 0.01 ? num(D,4) : sci(D,2))+'\\,\\sigma^2', C.in, 'start', 16);
  lbl(a, 0.1, -23.6, '10\\log_{10}D/\\sigma^2='+num(todB(D),1)+'\\text{ dB}', C.in, 'start', 16);
  return a.svg();
}

/* ---- 6.2 gallery: codes around us ---------------------------------------- */
const MORSE = {a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..'};
const morseT = s => s.split('').reduce((t,c)=>t+(c==='.'?1:3), 0) + s.length - 1;
const MORSE_RANK = LETTERS.list.filter(x=>x[0] !== ' ').map(x=>[x[0], morseT(MORSE[x[0]])]);
const utf8 = b => b <= 7 ? 1 : Math.ceil((b-1)/5);
const BRAILLE = [['b',[1,2]],['i',[2,4]],['t',[2,3,4,5]],['s',[2,3,4]]];
const REAL_CODES = realGallery({ id:'m6-real-codes', nav:'Codes around us',
  title:'Codes around us', eyebrow:'Module 6 · The limits of compression', src:'book 12.3.1',
  objective:'Recognise variable-length and fixed-length codes in Morse code, UTF-8, telephone numbers and Braille.',
  keywords:'examples morse code dot dash units letter frequency utf-8 bytes code point prefix telephone country code e.164 braille six dots 64 cells fixed length',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[1,5,10,15,20,25], xr:[0,27], yr:[0,15], xlabel:'\\text{letter, by frequency}', ylabel:'T\\;(\\text{units})', yticksOverride:[5,10]}));
      a.stem(MORSE_RANK.map((x,k)=>[k+1, x[1]]), {color:C.mid});
      lbl(a, 1.3, 2.3, 'e', C.ink, 'middle', 14); lbl(a, 2.3, 4.3, 't', C.ink, 'middle', 14);
      return a.svg(); },
      'Morse code gives common letters short signals: $e$ is one dot. Each letter lasts $T=\\sum_it_i+(m-1)$ units, with a dot $1$ and a dash $3$.'],
    [()=>{ const a = TAx(EXO({xt:[1,7,11,16,21], xr:[0,22], yr:[0,4.8], xlabel:'b\\;(\\text{bits in the code point})', ylabel:'\\text{bytes}', yticksOverride:[1,2,3,4]}));
      const pts = []; for(let b=1;b<=21;b++) pts.push([b-0.5, utf8(b)], [b+0.5, utf8(b)]);
      a.poly(pts, {color:C.mid, width:2.6});
      return a.svg(); },
      'UTF-8 writes a character in $1$ to $4$ bytes: $1$ for $b\\le7$, else $\\lceil(b-1)/5\\rceil$. A lead byte never starts another, so it is a prefix code.'],
    [()=>{ const a = P.Axes(bare(EXO({xr:[-0.3,3.9], yr:[-0.6,10.6], pad:{l:16,r:16,t:12,b:12}})));
      drawTree(a, ['1','7','30','31','33','351','358','90','91','971','972'], ['+1','+7','+30','+31','+33','+351','+358','+90','+91','+971','+972'], {dx:1.05, bits:false, leaf:C.mid, fs:13});
      return a.svg(); },
      'Telephone country codes: $+1$, $+30$, $+351$, $+971$. No code is the start of another, so a switch knows where the code ends without a separator.'],
    [()=>{ const a = P.Axes(bare(EXO({xr:[-0.5,11.5], yr:[-1.5,4], pad:{l:16,r:16,t:12,b:12}})));
      BRAILLE.forEach(([ch, dots], k)=>{ const x0 = 1+2.8*k;
        for(let d=1;d<=6;d++){ const x = x0 + (d > 3 ? 1 : 0), y = 3 - ((d-1)%3);
          if(dots.includes(d)) dot(a, x, y, {color:C.mid, r:8}); else ring(a, x, y, {color:C.muted, r:7, width:1.4}); }
        lbl(a, x0+0.5, -0.9, '\\text{'+ch+'}', C.ink, 'middle', 16); });
      return a.svg(); },
      'Braille sets each letter in a cell of six dots, raised or flat: $2^6=64$ patterns, $6$ bits a letter whatever its frequency.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Short for common', html:'Morse and UTF-8 give frequent symbols short codewords. That is the idea of every variable-length code.'},
    {t:'note', kind:'ok', head:'Prefix codes', html:'UTF-8 and the country codes need no separators. A reader knows where each codeword ends.'},
    {t:'note', kind:'warn', head:'Fixed length', html:'Braille spends $6$ bits a letter. The letters of the speech in 6.1 carry $4.04$ bits each.'}
  ]});

/* ---- 6.3 Huffman and Lempel–Ziv coding -------------------------------------
   The Huffman table: one column a stage, each sorted, the two smallest of a
   column merged into one entry of the next. Upper of the pair gets 0, lower 1.
   A column is [name, probability]; `into` names what the last two became. */
const HUFF_HIGH = { cols:[
  [['s1',0.4],['s2',0.2],['s3',0.2],['s4',0.1],['s5',0.1]],
  [['s1',0.4],['A',0.2],['s2',0.2],['s3',0.2]],
  [['B',0.4],['s1',0.4],['A',0.2]],
  [['C',0.6],['B',0.4]] ], into:['A','B','C'],
  code:{s1:'00', s2:'10', s3:'11', s4:'010', s5:'011'} };
const HUFF_LOW = { cols:[
  [['s1',0.4],['s2',0.2],['s3',0.2],['s4',0.1],['s5',0.1]],
  [['s1',0.4],['s2',0.2],['s3',0.2],['A',0.2]],
  [['s1',0.4],['B',0.4],['s2',0.2]],
  [['C',0.6],['s1',0.4]] ], into:['A','B','C'],
  code:{s1:'1', s2:'01', s3:'000', s4:'0010', s5:'0011'} };
function huffTable(a, T, f, o={}){
  const op = o.opacity==null ? 1 : o.opacity, Y = r => 4 - r;
  T.cols.forEach((col, i)=>{ const oc = i === 0 ? 1 : clamp01(f-i+1); if(oc < 0.02) return;
    col.forEach(([nm,p], r)=>lbl(a, i*1.15, Y(r), num(p,1), nm.startsWith('s') && i === 0 ? C.in : C.mid, 'middle', 16));
    if(i < T.cols.length-1){ const on = clamp01(f-i); if(on < 0.02) return;
      const nx = T.cols[i+1], L = col.length;
      col.forEach(([nm], r)=>{ const merged = r >= L-2, tgt = merged ? T.into[i] : nm, r2 = nx.findIndex(e=>e[0]===tgt);
        seg(a, [[i*1.15+(merged ? 0.36 : 0.22), Y(r)+0.08],[(i+1)*1.15-0.24, Y(r2)+0.08]], {color: merged ? C.mid : C.muted, width: merged ? 2 : 1.3, opacity:on*op}); });
      if(on > 0.5){ txt(a, i*1.15+0.27, Y(L-2)+0.08, '0', C.mid, 'middle', 14, {dy:5}); txt(a, i*1.15+0.27, Y(L-1)+0.08, '1', C.mid, 'middle', 14, {dy:5}); }
    }
  });
  const last = T.cols.length-1;
  if(f > last+0.5){ txt(a, last*1.15+0.27, Y(0)+0.08, '0', C.mid, 'middle', 14, {dy:5}); txt(a, last*1.15+0.27, Y(1)+0.08, '1', C.mid, 'middle', 14, {dy:5});
    T.cols[0].forEach(([nm], r)=>lbl(a, -0.62, Y(r), '\\mathtt{'+T.code[nm]+'}', C.out, 'end', 16)); }
  T.cols[0].forEach(([nm], r)=>lbl(a, -0.3, Y(r), 's_'+nm[1], C.in, 'end', 16));
}
function figHuffman(v){
  const f = Math.min(4, frameOf(v, 4));
  const a = P.Axes(bare(SZ({xr:[-1.45,3.95], yr:[-0.6,4.6]})));
  huffTable(a, HUFF_HIGH, f);
  if(f > 3.5) lbl(a, 3.9, -0.35, '\\bar{L}=2.2,\\ \\ \\eta=0.9645', C.out, 'end', 16);
  return a.svg();
}

/* Ties: the merged entry placed high or low. Same average, different spread. */
const LEN_HIGH = [2,2,2,3,3], LEN_LOW = [1,2,3,4,4];
const lvar = ls => { const L = ls.reduce((s,l,k)=>s+FIVE[k]*l, 0); return ls.reduce((s,l,k)=>s+FIVE[k]*(l-L)*(l-L), 0); };
function figHuffVar(v){
  const f = Math.min(2, frameOf(v, 2)), Ht = takeH(420), hA = Math.round(0.6*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-1.55,3.95], yr:[-0.5,4.5], pad:{l:14,r:14,t:10,b:6}}));
  const oL = clamp01(f);
  if(oL < 0.98) huffTable(a, HUFF_HIGH, 4, {opacity:1-oL});
  const g1 = P.Axes(bare({w:560, h:hA, xr:[-1.55,3.95], yr:[-0.5,4.5], pad:{l:14,r:14,t:10,b:6}}));
  if(oL > 0.02) huffTable(g1, HUFF_LOW, 4, {opacity:oL});
  const b = TAx({w:560, h:Ht-hA, xr:[0.4,5.6], yr:[0,5.7], ylabel:'l_k', pad:{l:56,r:26,t:24,b:40}, xt:[], yticksOverride:[1,2,3,4]});
  const o2 = clamp01(f-1);
  [1,2,3,4,5].forEach(k=>lbl(b, k, -1.2, 's_'+k, C.in, 'middle', 15));
  const hi = LEN_HIGH, lo = LEN_LOW;
  if(1-oL*(1-o2) > 0.02) b.stem(hi.map((l,k)=>[k+1-0.12*o2, l]), {color:C.mid});
  if(oL > 0.02) b.stem(lo.map((l,k)=>[k+1+0.12*o2, l]), {color:C.h});
  b.hline(2.2, {color:C.ink, dash:'6 4', width:1.5, opacity:1});
  if(o2 > 0.5){ lbl(b, 0.5, 4.85, '\\sigma^2_{\\text{high}}=0.16,\\ \\ \\sigma^2_{\\text{low}}=1.36', C.ink, 'start', 15); }
  else lbl(b, 0.5, 4.85, '\\sigma^2='+(oL < 0.5 ? '0.16' : '1.36'), C.ink, 'start', 15);
  return `<svg viewBox="0 0 560 ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img">${oL < 0.98 ? place(a.svg(),0,0,560,hA) : ''}${oL > 0.02 ? place(g1.svg(),0,0,560,hA) : ''}${place(b.svg(),0,hA,560,Ht-hA)}</svg>`;
}

/* Huffman codes for single symbols, pairs and triples of 0.7, 0.2, 0.1: the
   average length a symbol against the entropy and the bound H + 1/n. */
const EXT_L = [1,2,3].map(n=>huffAvg(prod(S3, n))/n);
function figHuffExt(v){
  const f = Math.min(2, frameOf(v, 2)), Ht = takeH(430), hA = Math.round(0.52*Ht);
  const a = TAx({w:560, h:hA, xr:[0.5,3.5], yr:[0.8,2.35], ylabel:'\\text{bits a symbol}', pad:{l:56,r:26,t:24,b:14}, xt:[], yticksOverride:[1.2,1.6,2.0]});
  a.hline(HS3, {color:C.in, width:2, dash:'6 4', opacity:1});
  [1,2,3].forEach(n=>{ const o = clamp01(f-n+2); if(o < 0.02) return;
    ring(a, n, HS3+1/n, {color:C.ink, r:8, width:2, opacity:o});
    dot(a, n, EXT_L[n-1], {color:C.mid, r:7, opacity:o});
    if(o > 0.5) lbl(a, n+0.14, HS3+1/n+0.02, 'H+\\tfrac1'+n, C.ink, 'start', 14); });
  lbl(a, 3.45, HS3-0.24, 'H=1.157', C.in, 'end', 14);
  const b = TAx({w:560, h:Ht-hA, xr:[0.5,3.5], yr:[1.13,1.33], xlabel:'n\\;(\\text{symbols a block})', ylabel:'\\bar{L}_n/n', pad:{l:56,r:26,t:24,b:42}, xt:[1,2,3], yticksOverride:[1.15,1.2,1.25,1.3]});
  b.hline(HS3, {color:C.in, width:2, dash:'6 4', opacity:1});
  [1,2,3].forEach(n=>{ const o = clamp01(f-n+2); if(o < 0.02) return;
    dot(b, n, EXT_L[n-1], {color:C.mid, r:7, opacity:o});
    if(o > 0.5) lbl(b, n+0.12, EXT_L[n-1]+(n===1 ? -0.035 : 0.012), num(EXT_L[n-1], 4), C.mid, 'start', 15); });
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* Arithmetic coding of s1 s1 s2 with 0.7, 0.2, 0.1: each symbol keeps its
   share of the current interval. */
const AR_P = [0.7, 0.2, 0.1], AR_SEQ = [0, 0, 1];
const AR = (()=>{ const iv = [[0,1]]; AR_SEQ.forEach(s=>{ const [lo,hi] = iv[iv.length-1], w = hi-lo;
  const c = [0, 0.7, 0.9, 1]; iv.push([lo+w*c[s], lo+w*c[s+1]]); }); return iv; })();
function figArith(v){
  const f = Math.min(4, frameOf(v, 4));
  const a = P.Axes(bare(SZ({xr:[-0.3,1.3], yr:[-0.8,4.4]})));
  const cuts = [0, 0.7, 0.9, 1], cols = [0.3, 0.2, 0.12];
  for(let r=0;r<4;r++){ const o = r === 0 ? 1 : clamp01(f-r+1); if(o < 0.02) continue;
    const y = 3.7 - 1.25*r, [lo, hi] = AR[r];
    if(r < 3) for(let s=0;s<3;s++){ box(a, cuts[s], y-0.22, cuts[s+1], y+0.22, rgba(C.in, cols[s]), {stroke:C.in, width:1.4, opacity:o});
      if(o > 0.5) lbl(a, (cuts[s]+cuts[s+1])/2, y-0.06, 's_'+(s+1), C.in, 'middle', 15); }
    else { box(a, 0, y-0.22, 1, y+0.22, rgba(C.in, 0.22), {stroke:C.in, width:1.4, opacity:o}); }
    if(o > 0.5){ lbl(a, -0.03, y-0.06, num(lo, 3).replace(/\.?0+$/,'') || '0', C.ink, 'end', 15); lbl(a, 1.03, y-0.06, num(hi, 3).replace(/\.?0+$/,''), C.ink, 'start', 15); }
    if(r < 3){ const on = clamp01(f-r); if(on > 0.02){ const s = AR_SEQ[r];
      box(a, cuts[s], y-0.22, cuts[s+1], y+0.22, 'none', {stroke:C.mid, width:3, opacity:on});
      seg(a, [[cuts[s], y-0.26],[0, y-1.25+0.26]], {color:C.mid, width:1.3, dash:'4 4', opacity:on});
      seg(a, [[cuts[s+1], y-0.26],[1, y-1.25+0.26]], {color:C.mid, width:1.3, dash:'4 4', opacity:on}); } }
  }
  const o4 = clamp01(f-3);
  if(o4 > 0.02){ const [lo, hi] = AR[3], y = 3.7-3*1.25, t0 = (0.375-lo)/(hi-lo), t1 = (0.40625-lo)/(hi-lo);
    box(a, t0, y-0.22, t1, y+0.22, rgba(C.out, 0.3), {stroke:C.out, width:2.4, opacity:o4});
    if(o4 > 0.5){ lbl(a, 0.5, 4.12, 'w=0.7\\times0.7\\times0.2=0.098,\\quad -\\log_2w=3.35', C.ink, 'middle', 15);
      lbl(a, (t0+t1)/2, y-0.62, '0.\\mathtt{01100}_2=0.375', C.out, 'middle', 15); } }
  return a.svg();
}

/* Lempel–Ziv parsing of an 18-bit stream: each phrase is an earlier phrase
   and one new bit, and the dictionary grows as a tree. */
const LZ_PH = ['0','00','1','01','11','001','010','0101'];
const LZ_S = LZ_PH.join('');
const LZ_PT = LZ_PH.map(ph=>[ph.length > 1 ? LZ_PH.indexOf(ph.slice(0,-1))+1 : 0, ph.slice(-1)]);
function figLZ(v){
  const f = Math.min(8, frameOf(v, 8)), k = Math.round(f), Ht = takeH(430), hA = Math.round(0.28*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.3,18.3], yr:[-0.9,1.4], pad:{l:14,r:14,t:10,b:6}}));
  let pos = 0;
  LZ_PH.forEach((ph,i)=>{ const done = i < k, cur = i === k-1;
    for(let j=0;j<ph.length;j++){ const x = pos+j;
      box(a, x+0.06, 0, x+0.94, 1.1, rgba(done ? (cur ? C.mid : C.in) : C.muted, done ? 0.22 : 0.08), {stroke: done ? (cur ? C.mid : C.in) : C.muted, width:1.3});
      txt(a, x+0.5, 0.42, ph[j], done ? (cur ? C.mid : C.in) : C.muted, 'middle', 16, {dy:6}); }
    if(done) seg(a, [[pos+ph.length, -0.25],[pos+ph.length, 1.3]], {color:C.ink, width:1.6});
    if(done) txt(a, pos+ph.length/2, -0.55, String(i+1), cur ? C.mid : C.muted, 'middle', 13, {dy:4});
    pos += ph.length; });
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-0.5,5.6], yr:[-0.7,5.7], pad:{l:14,r:14,t:14,b:10}}));
  if(k > 0){
    const t = drawTree(b, LZ_PH.slice(0,k), LZ_PH.slice(0,k).map((_,i)=>String(i+1)), {dx:1.1, fitH:4.2, hot:LZ_PH[k-1]});
    b.note(0, t.Y(''), '0', {tex:true, fs:14, color:C.muted, anchor:'end', dx:-10});
    const [pt, bit] = LZ_PT[k-1];
    lbl(b, 5.5, 5.35, '\\text{phrase }'+k+':\\ \\mathtt{'+LZ_PH[k-1]+'}\\to('+pt+',\\mathtt{'+bit+'})', C.mid, 'end', 16);
  } else lbl(b, 2.5, 2.5, '\\text{empty dictionary: entry }0', C.muted, 'middle', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* LZ78 on a long seeded binary source, p = 0.1: the bits it sends a source
   bit, against the entropy. Built once, on first use. */
const LZL = { seed:6301, p:0.1, E:[] };
function lzLong(){
  if(LZL.E.length) return LZL.E;
  const N = 1000000, r = rng(LZL.seed), nxt = new Map(); let node = 0, count = 0, cost = 0, e = 2;
  for(let i=1;i<=N;i++){ const b = r() < LZL.p ? 1 : 0, key = node*2+b;
    if(nxt.has(key)) node = nxt.get(key);
    else { count++; nxt.set(key, count); cost += (count > 1 ? Math.ceil(lg(count)) : 0) + 1; node = 0; }
    while(e <= 6.0001 && i === Math.round(Math.pow(10, e))){ LZL.E.push([e, cost/i]); e = Math.round((e+0.1)*10)/10; }
  }
  return LZL.E;
}
function figLZLong(v){
  const e = v ? v.e : 3, E = lzLong(), pt = E.reduce((b,q)=>Math.abs(q[0]-e) < Math.abs(b[0]-e) ? q : b, E[0]);
  const a = TAx(SZ({xr:[1.8,6.2], yr:[0,1.25], xlabel:'n\\;(\\text{source bits})', ylabel:'\\text{bits sent a source bit}', xt:[2,3,4,5,6], xfmt:P.decade, yticksOverride:[0,0.5,1]}));
  a.hline(1, {color:C.ink, dash:'2 4', width:1.4, opacity:1});
  a.hline(hb(LZL.p), {color:C.in, dash:'6 4', width:1.8, opacity:1});
  seg(a, E, {color:C.mid, width:2.6});
  dot(a, pt[0], pt[1], {color:C.mid, r:7});
  lbl(a, 6.1, 1.06, '\\text{one bit a symbol}', C.ink, 'end', 15);
  lbl(a, 6.1, hb(LZL.p)-(P.labelScale() > 1 ? 0.17 : 0.1), 'H_b(0.1)=0.469', C.in, 'end', 15);
  lbl(a, 1.9, P.labelScale() > 1 ? 0.08 : 0.18, 'n=10^{'+num(pt[0],1)+'}:\\ '+num(pt[1],3)+'\\text{ bits a source bit}', C.mid, 'start', 16);
  return a.svg();
}

/* ---- 6.3 gallery: compression around us ----------------------------------- */
/* LZ77: at each position, the longest earlier copy of the text that follows. */
const LZ77 = (()=>{ const s = SPEECH.slice(0, 240), out = [];
  for(let i=0;i<s.length;i++){ let best = 0; for(let j=0;j<i;j++){ let l = 0; while(i+l < s.length && s[j+l] === s[i+l] && j+l < i+l) l++; if(l > best) best = l; } out.push(best); }
  return out; })();
const PNG_ROW = Array.from({length:32}, (_,n)=>Math.round(60 + 5*n + 3*Math.sin(n/2)));
const PNG_D = PNG_ROW.map((x,n)=>n ? x-PNG_ROW[n-1] : x);
const histH = xs => { const c = {}; xs.forEach(x=>{ c[x] = (c[x]||0)+1; }); return H(Object.values(c).map(v=>v/xs.length)); };
/* An 8×8 block, its two-dimensional DCT, a uniform quantizer of step 16 and
   the zig-zag order of JPEG. */
const JPG = (()=>{ const blk = [], cf = [];
  for(let y=0;y<8;y++) for(let x=0;x<8;x++) blk.push(Math.round(128 + 50*Math.cos(Math.PI*(x+0.5)/10) + 20*(y/7) - 10*Math.sin(Math.PI*(x+y)/9)) - 128);
  const cu = u => u ? 1 : Math.SQRT1_2;
  for(let v=0;v<8;v++) for(let u=0;u<8;u++){ let s = 0;
    for(let y=0;y<8;y++) for(let x=0;x<8;x++) s += blk[8*y+x]*Math.cos((2*x+1)*u*Math.PI/16)*Math.cos((2*y+1)*v*Math.PI/16);
    cf.push(Math.round(0.25*cu(u)*cu(v)*s/16)); }
  const zz = []; for(let d=0;d<15;d++){ const idx = []; for(let y=0;y<8;y++){ const x = d-y; if(x>=0 && x<8) idx.push([x,y]); }
    if(d%2===0) idx.reverse(); idx.forEach(([x,y])=>zz.push(cf[8*y+x])); }
  return {zz, nz:zz.filter(c=>c!==0).length}; })();
const FAX = [180, 12, 260, 8, 90, 30, 400, 6, 150, 16, 576];
const REAL_COMPRESS = realGallery({ id:'m6-real-compress', nav:'Compression around us',
  title:'Compression around us', eyebrow:'Module 6 · Huffman and Lempel–Ziv coding', src:'book 12.3.1, 12.3.2',
  objective:'Recognise Lempel–Ziv matching and Huffman codes inside ZIP, PNG, JPEG and fax.',
  keywords:'examples zip gzip deflate lz77 huffman png row filter difference jpeg dct zig-zag quantized zeros fax group 3 modified huffman run length 1728 pixels',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[0,60,120,180,240], xr:[-4,244], yr:[0,26], xlabel:'i\\;(\\text{character})', ylabel:'\\ell(i)', yticksOverride:[10,20]}));
      a.stem(LZ77.map((l,i)=>[i,l]), {color:C.mid, r:1.8, width:1.2});
      return a.svg(); },
      'ZIP and gzip use DEFLATE: LZ77 copies, then Huffman codes. $\\ell(i)$ is the longest earlier copy of the text from character $i$.'],
    [()=>{ const a = TAx(EXO({xt:[0,8,16,24], xr:[-1,32], yr:[-8,230], xlabel:'n\\;(\\text{pixel})', ylabel:'x[n],\\;d[n]', yticksOverride:[0,100,200]}));
      a.stem(PNG_ROW.map((x,n)=>[n,x]), {color:C.in, r:2.4, width:1.4});
      a.stem(PNG_D.slice(1).map((d,n)=>[n+1,d]), {color:C.mid, r:2.4, width:1.4});
      return a.svg(); },
      'PNG filters each row first: $d[n]=x[n]-x[n-1]$ takes $'+num(histH(PNG_D.slice(1)),2)+'$ bits a pixel against $'+num(histH(PNG_ROW),2)+'$. DEFLATE then codes $d[n]$.'],
    [()=>{ const a = TAx(EXO({xt:[0,16,32,48], xr:[-2,65], yr:[-14,26], xlabel:'k', ylabel:'c_k', yticksOverride:[-10,0,10,20], zeroAxes:false}));
      a.hline(0, {color:C.muted, width:1, dash:'2 4'});
      a.stem(JPG.zz.map((c,k)=>[k,c]), {color:C.mid, r:2.4, width:1.4});
      return a.svg(); },
      'JPEG takes the DCT of each $8\\times8$ block and quantizes it. Here $'+JPG.nz+'$ of the $64$ values $c_k$ are nonzero. The runs of zeros are Huffman-coded.'],
    [()=>{ const a = TAx(EXO({xt:[1,3,5,7,9,11], xr:[0,12], yr:[0,650], xlabel:'\\text{run}', ylabel:'\\text{length (pixels)}', yticksOverride:[200,400,600]}));
      a.stem(FAX.map((l,i)=>[i+1,l]), {color:C.mid});
      return a.svg(); },
      'A fax line of $\\sum_i\\ell_i='+FAX.reduce((s,x)=>s+x,0)+'$ pixels is sent as run lengths $\\ell_i$, white and black in turn, each Huffman-coded.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Two steps', html:'Each format first turns the data into something with low entropy: copies, differences, zeros or runs.'},
    {t:'note', kind:'ok', head:'Then Huffman', html:'A Huffman code, or a close cousin, then spends bits by frequency.'},
    {t:'note', kind:'warn', head:'Lossy and lossless', html:'ZIP, PNG and fax lose nothing. JPEG throws information away in its quantizer before any coding.'}
  ]});

/* ---- 6.4 channels and mutual information ------------------------------------ */

function figDMC(){
  const a = P.Axes(bare(SZ({xr:[-0.25,1.25], yr:[-0.45,1.45]})));
  chanDiag(a, [['x_0',1],['x_1',0]], [['y_0',1],['y_1',0]], [[0,0,'keep'],[0,1,'flip'],[1,1,'keep'],[1,0,'flip']]);
  lbl(a, 0.62, 1.1, '0.8', C.h, 'middle', 17); lbl(a, 0.62, -0.24, '0.7', C.h, 'middle', 17);
  lbl(a, 0.38, 0.83, '0.2', C.err, 'middle', 17); lbl(a, 0.38, 0.05, '0.3', C.err, 'middle', 17);
  return a.svg();
}

/* The four joint probabilities as widths, and the output distribution. */
function figInputDist(v){
  const q = v ? v.q : 0.75, J = [[DMC[0][0]*q, DMC[0][1]*q],[DMC[1][0]*(1-q), DMC[1][1]*(1-q)]];
  const py0 = J[0][0]+J[1][0];
  const a = P.Axes(bare(SZ({xr:[-0.3,1.06], yr:[-0.3,3.3]})));
  let x = 0;
  [[0,0],[1,0],[0,1],[1,1]].forEach(([j,k])=>{ const w = J[j][k], col = j===k ? C.h : C.err;
    box(a, x, 2.0, x+w, 2.8, rgba(col, 0.26), {stroke:col, width:1.6});
    if(w > 0.08) lbl(a, x+w/2, 2.28, num(w,3), col, 'middle', 15);
    x += w; });
  lbl(a, -0.03, 2.28, 'p(x,y)', C.ink, 'end', 16);
  box(a, 0, 0.6, py0, 1.4, rgba(C.out, 0.3), {stroke:C.out, width:1.6});
  box(a, py0, 0.6, 1, 1.4, rgba(C.out, 0.14), {stroke:C.out, width:1.6});
  lbl(a, -0.03, 0.88, 'p(y)', C.ink, 'end', 16);
  if(py0 > 0.12) lbl(a, py0/2, 0.88, 'p(y_0)='+num(py0,3), C.out, 'middle', 16);
  if(1-py0 > 0.12) lbl(a, (1+py0)/2, 0.88, num(1-py0,3), C.out, 'middle', 16);
  seg(a, [[J[0][0]+J[1][0], 2.0],[py0, 1.4]], {color:C.muted, width:1.2, dash:'4 4'});
  return a.svg();
}

/* Hard-decision BPSK is a binary symmetric channel with p = Q(sqrt(2Eb/N0)). */
function figBSC(v){
  const g = v ? v.g : 4, p = Qf(Math.sqrt(2*dB(g))), Ht = takeH(430), hA = Math.round(0.46*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.25,1.25], yr:[-0.5,1.5], pad:{l:14,r:14,t:12,b:10}}));
  chanDiag(a, [['0',1],['1',0]], [['0',1],['1',0]], [[0,0,'keep'],[0,1,'flip'],[1,1,'keep'],[1,0,'flip']]);
  lbl(a, 0.62, 1.13, '1-p', C.h, 'middle', 17); lbl(a, 0.62, -0.3, '1-p', C.h, 'middle', 17);
  lbl(a, 0.38, 0.8, 'p', C.err, 'middle', 17); lbl(a, 0.38, 0.06, 'p', C.err, 'middle', 17);
  const b = logAx({w:560, h:Ht-hA, xr:[0,10.4], yr:[-6,-0.2], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'p', pad:{l:62,r:26,t:24,b:42}, xt:[0,2,4,6,8,10], yticksOverride:P.decades(-6,-1)});
  b.curve(d=>lg10(Qf(Math.sqrt(2*dB(d)))), {color:C.err, width:2.6});
  dot(b, g, Math.log10(p), {color:C.err, r:7});
  lbl(b, 0.3, -5.2, 'p=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)='+sci(p,2), C.err, 'start', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* The joint pmf 0.4, 0.1, 0.1, 0.4 as tiles, and the chain rule as a bar. */
const JPMF = [[0.4,0.1],[0.1,0.4]];
function figJoint(v){
  const f = Math.min(2, frameOf(v, 2)), Ht = takeH(430), hA = Math.round(0.55*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-1.2,3.2], yr:[-0.3,2.6], pad:{l:14,r:14,t:10,b:6}}));
  for(let j=0;j<2;j++) for(let k=0;k<2;k++) tile(a, 0.2+k*0.95, 1.2-j*0.95, 0.9, 0.9, JPMF[j][k], C.in, String(JPMF[j][k]), {max:0.4, fs:19});
  ['x_0','x_1'].forEach((s,j)=>lbl(a, 0.1, 1.58-j*0.95, s, C.in, 'end', 17));
  ['y_0','y_1'].forEach((s,k)=>lbl(a, 0.65+k*0.95, 2.22, s, C.out, 'middle', 17));
  lbl(a, 2.25, 1.58, 'p(x_0)=0.5', C.in, 'start', 15); lbl(a, 2.25, 0.63, 'p(x_1)=0.5', C.in, 'start', 15);
  const HXY = H([0.4,0.1,0.1,0.4]);
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-0.15,2.15], yr:[-1.3,1.6], pad:{l:14,r:14,t:10,b:10}}));
  box(b, 0, 0.1, HXY, 0.7, rgba(C.muted, 0.1), {stroke:C.muted, width:1.6});
  lbl(b, HXY/2, 1.0, 'H(X,Y)='+num(HXY,4), C.ink, 'middle', 16);
  const o1 = clamp01(f), o2 = clamp01(f-1);
  if(o1 > 0.02){ box(b, 0, 0.1, 1, 0.7, rgba(C.in, 0.28), {stroke:C.in, width:1.8, opacity:o1}); if(o1 > 0.5) lbl(b, 0.5, -0.5, 'H(X)=1', C.in, 'middle', 16); }
  if(o2 > 0.02){ box(b, 1, 0.1, HXY, 0.7, rgba(C.h, 0.28), {stroke:C.h, width:1.8, opacity:o2}); if(o2 > 0.5) lbl(b, 1+(HXY-1)/2, -0.5, 'H(Y\\mid X)='+num(HXY-1,4), C.h, 'middle', 16); }
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* The uncertainty left about X after each output of the channel of 0.8/0.2,
   0.3/0.7 with p(x_0) = 0.75, and its average. */
const CE = (()=>{ const q = 0.75, j = [[0.8*q, 0.2*q],[0.3*(1-q), 0.7*(1-q)]], py = [j[0][0]+j[1][0], j[0][1]+j[1][1]];
  const h0 = hb(j[0][0]/py[0]), h1 = hb(j[0][1]/py[1]);
  return { py, h0, h1, avg:py[0]*h0+py[1]*h1, HX:hb(q), HYX:q*hb(0.2)+(1-q)*hb(0.3), post:[j[0][0]/py[0], j[0][1]/py[1]] }; })();
function figCondEnt(v){
  const f = Math.min(3, frameOf(v, 3));
  const a = TAx(SZ({xr:[-0.72,1.22], yr:[-0.2,5.2], xlabel:'\\text{bits}', xt:[0,0.5,1], yticksOverride:[], grid:false}));
  a.vline(0, {color:C.muted, dash:'2 4', width:1, opacity:1});
  const rows = [
    ['H(X)', CE.HX, C.in, 0],
    ['H(X\\mid y_0)', CE.h0, C.err, 0],
    ['H(X\\mid y_1)', CE.h1, C.err, 1],
    ['H(X\\mid Y)', CE.avg, C.err, 2],
    ['H(Y\\mid X)', CE.HYX, C.h, 3]];
  rows.forEach(([nm, val, col, at], i)=>{ const o = at === 0 ? 1 : clamp01(f-at+1); if(o < 0.02) return; const y = 4.4 - 1.02*i;
    box(a, 0, y-0.3, val, y+0.3, rgba(col, 0.26), {stroke:col, width:1.8, opacity:o});
    if(o > 0.5){ lbl(a, -0.04, y-0.1, nm, col, 'end', 16); lbl(a, val+0.03, y-0.1, num(val,3), col, 'start', 16); } });
  return a.svg();
}

/* The information bar of a BSC with equal inputs, with the reader's p. */
function figMutual(v){
  const p = v ? v.p : 0.1, r = chan(BSC(p), [0.5,0.5]);
  const a = P.Axes(bare(SZ({xr:[-0.08,2.08], yr:[-1.6,2.0]})));
  infoBar(a, r);
  lbl(a, (r.HXgY+r.I)/2, 0.95, 'H(X)=1', C.in, 'middle', 16);
  lbl(a, (r.HXgY+r.HXY)/2, -0.72, 'H(Y)=1', C.out, 'middle', 16);
  lbl(a, 0, 1.6, 'p='+num(p,2)+':\\ \\ I='+num(r.I,3), C.out, 'start', 17);
  lbl(a, 0, -1.4, 'H(X,Y)='+num(r.HXY,3), C.ink, 'start', 16);
  return a.svg();
}
function figMutualProps(){
  const r = chan(BSC(0.25), [0.5,0.5]);
  const a = P.Axes(bare(SZ({xr:[-0.08,2.08], yr:[-1.6,2.0]})));
  infoBar(a, r);
  lbl(a, (r.HXgY+r.I)/2, 0.95, 'H(X)=1', C.in, 'middle', 16);
  lbl(a, (r.HXgY+r.HXY)/2, -0.72, 'H(Y)=1', C.out, 'middle', 16);
  lbl(a, 0, 1.6, 'p=0.25:\\ \\ I='+num(r.I,3), C.out, 'start', 17);
  lbl(a, 0, -1.4, 'H(X,Y)=H(X)+H(Y)-I='+num(r.HXY,3), C.ink, 'start', 16);
  return a.svg();
}

/* ---- 6.4 gallery: information around us ------------------------------------ */
const RAIN = chan([[0.8,0.2],[0.1,0.9]], [0.3,0.7]);
const testI = pr => chan([[0.99,0.01],[0.05,0.95]], [pr, 1-pr]).I;
const QZ = (()=>{ const e = [-Infinity,-1.5,-1,-0.5,0,0.5,1,1.5,Infinity], Phi = x => x===Infinity ? 1 : x===-Infinity ? 0 : 1-Qf(x);
  const p = e.slice(1).map((b,i)=>Phi(b)-Phi(e[i])); return {p, H:H(p)}; })();
const REAL_INFO = realGallery({ id:'m6-real-info', nav:'Information around us',
  title:'Information around us', eyebrow:'Module 6 · Channels and mutual information', src:'book 12.1.3',
  objective:'Compute how much a forecast, a medical test, a receiver and a quantizer tell about what they observe.',
  keywords:'examples mutual information weather forecast rain medical test rare condition prevalence bpsk receiver hard decision quantizer gaussian output entropy',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[], xr:[0,3.6], yr:[0,1.05], xlabel:'', ylabel:'\\text{bits}', yticksOverride:[0.5,1], grid:false}));
      [['H(W)', RAIN.HX, C.in], ['H(W\\mid F)', RAIN.HXgY, C.err], ['I(W;F)', RAIN.I, C.out]].forEach(([n,v,c],i)=>{ const x = 0.35+1.1*i;
        box(a, x, 0, x+0.7, v, rgba(c, 0.28), {stroke:c, width:1.6}); lbl(a, x+0.35, v+0.08, n, c, 'middle', 13); });
      return a.svg(); },
      'A forecast: rain $30\\%$ of days, forecast on $80\\%$ of rainy days and $10\\%$ of dry ones. $I(W;F)='+num(RAIN.I,3)+'$ of $H(W)='+num(RAIN.HX,3)+'$ bits.'],
    [()=>{ const a = TAx(EXO({xt:[0,10,20,30,40,50], xr:[0,50], yr:[0,0.8], xlabel:'\\text{prevalence }(\\%)', ylabel:'I(D;T)\\;(\\text{bits})', yticksOverride:[0.2,0.4,0.6]}));
      a.curve(x=>testI(x/100), {color:C.out, width:2.4, n:400});
      dot(a, 1, testI(0.01), {color:C.out, r:5.5});
      return a.svg(); },
      'A test with $99\\%$ sensitivity and a $5\\%$ false-positive rate. For a condition in $1\\%$ of people, $I(D;T)='+num(testI(0.01),3)+'$ bit a test.'],
    [()=>{ const a = TAxL(EXO({xt:[-4,0,4,8], xr:[-5,10], yr:[0,1.12], xlabel:'E/N_0\\;(\\text{dB})', ylabel:'I\\;(\\text{bits})', yticksOverride:[0.5,1], zeroAxes:false}));
      a.curve(d=>1-hb(Qf(Math.sqrt(2*dB(d)))), {color:C.out, width:2.4, n:400});
      return a.svg(); },
      'A BPSK receiver that decides each bit. With equal bits $I=1-H_b(p)$ and $p=Q\\bigl(\\sqrt{2E/N_0}\\bigr)$: $'+num(1-hb(Qf(Math.sqrt(2*dB(4)))),3)+'$ bit at $4$ dB.'],
    [()=>{ const a = TAxL(EXO({xt:[-1.75,-0.75,0.25,1.25], xr:[-2.3,2.3], yr:[0,0.24], xlabel:'q\\;(\\text{output level, }\\sigma=1)', ylabel:'P(q)', yticksOverride:[0.1,0.2], xfmt:u=>u.toFixed(2), zeroAxes:false}));
      pmf(a, QZ.p.map((p,i)=>[-1.75+0.5*i, p]), {color:C.mid});
      return a.svg(); },
      'An $8$-level quantizer of step $0.5\\sigma$ on a Gaussian sample. Its output is fixed by the input, so $I(X;Q)=H(Q)='+num(QZ.H,3)+'$ bits.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Shared information', html:'$I=H(X)-H(X\\mid Y)$: how much the observation lowers the uncertainty.'},
    {t:'note', kind:'ok', head:'Accurate is not informative', html:'A good test of a rare condition says little on average, because it almost always reads negative.'},
    {t:'note', kind:'warn', head:'Deterministic output', html:'When $Y$ is a function of $X$, $H(Y\\mid X)=0$ and $I(X;Y)=H(Y)$.'}
  ]});

/* ---- 6.5 channel capacity -------------------------------------------------- */
const CZ = capBinary(ZCH, 4000);
function figCapacity(v){
  const q = v ? v.q : 0.5, rb = chan(BSC(0.1), [q,1-q]).I, rz = chan(ZCH, [q,1-q]).I;
  const a = TAx(SZ({xr:[0,1], yr:[0,0.72], xlabel:'q=p(x_0)', ylabel:'I(X;Y)\\;(\\text{bits})', xt:[0,0.25,0.5,0.75,1], yticksOverride:[0,0.2,0.4,0.6]}));
  a.curve(u=>chan(BSC(0.1), [u,1-u]).I, {color:C.out, width:2.6});
  a.curve(u=>chan(ZCH, [u,1-u]).I, {color:C.out, width:2.6, dash:'8 5'});
  ring(a, 0.5, 1-hb(0.1), {color:C.ink, r:10, width:1.6}); ring(a, CZ.q, CZ.I, {color:C.ink, r:10, width:1.6});
  seg(a, [[q,0],[q,0.6]], {color:C.ink, dash:'5 4', width:1.2});
  dot(a, q, rb, {color:C.out, r:6.5}); dot(a, q, rz, {color:C.out, r:6.5});
  lbl(a, 0.03, 0.66, 'q='+num(q,2)+':\\ \\ I_{\\text{BSC}}='+num(rb,3)+',\\ \\ I_{\\text{Z}}='+num(rz,3), C.ink, 'start', 16);
  return a.svg();
}

/* The reader draws C(p) = 1 - H_b(p) over the faint H_b(p). */
function figBSCcap(){
  const a = TAx(SZ({xr:[0,1], yr:[0,1.18], xlabel:'p', ylabel:'\\text{bits per use}', xt:[0,0.25,0.5,0.75,1], yticksOverride:[0,0.5,1]}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  trace(a, hb, 0.001, 0.999, {color:C.h, width:1.8, dash:'6 5', opacity:0.75});
  lbl(a, 0.5, 1.06, 'H_b(p)', C.h, 'middle', 16);
  a.raw('<g class="sk-key">');
  trace(a, u=>1-hb(u), 0.0005, 0.9995, {color:C.out, width:2.8, n:900});
  a.raw('</g>');
  return a.svg();
}

/* The binary erasure channel against the binary symmetric channel. */
function figBEC(v){
  const e = v ? v.e : 0.1, Ht = takeH(430), hA = Math.round(0.44*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.25,1.25], yr:[-0.35,1.35], pad:{l:14,r:14,t:12,b:10}}));
  chanDiag(a, [['0',1],['1',0]], [['0',1],['e',0.5],['1',0]], [[0,0,'keep'],[0,1,'erase'],[1,2,'keep'],[1,1,'erase']]);
  lbl(a, 0.55, 1.1, '1-\\epsilon', C.h, 'middle', 17); lbl(a, 0.55, -0.24, '1-\\epsilon', C.h, 'middle', 17);
  lbl(a, 0.3, 0.62, '\\epsilon', C.h, 'middle', 17); lbl(a, 0.3, 0.3, '\\epsilon', C.h, 'middle', 17);
  const b = TAx({w:560, h:Ht-hA, xr:[0,0.5], yr:[0,1.15], xlabel:'\\epsilon', ylabel:'C\\;(\\text{bits per use})', pad:{l:56,r:26,t:24,b:42}, xt:[0,0.1,0.2,0.3,0.4,0.5], yticksOverride:[0,0.5,1]});
  b.curve(u=>1-u, {color:C.out, width:2.6});
  b.curve(u=>1-hb(u), {color:C.out, width:2.6, dash:'8 5'});
  dot(b, e, 1-e, {color:C.out, r:6.5}); dot(b, e, 1-hb(e), {color:C.out, r:6.5});
  lbl(b, 0.49, 1.03, '\\epsilon='+num(e,2)+':\\ \\text{BEC }'+num(1-e,3)+',\\ \\text{BSC }'+num(1-hb(e),3), C.ink, 'end', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* The Z-channel: its diagram above its mutual-information curve. */
function figZ(){
  const Ht = takeH(430), hA = Math.round(0.42*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.25,1.25], yr:[-0.4,1.4], pad:{l:14,r:14,t:12,b:10}}));
  chanDiag(a, [['0',1],['1',0]], [['0',1],['1',0]], [[0,0,'keep'],[1,0,'flip'],[1,1,'keep']]);
  lbl(a, 0.55, 1.12, '1', C.h, 'middle', 17); lbl(a, 0.55, -0.27, '\\tfrac12', C.h, 'middle', 17); lbl(a, 0.3, 0.46, '\\tfrac12', C.err, 'middle', 17);
  const b = TAx({w:560, h:Ht-hA, xr:[0,1], yr:[0,0.44], xlabel:'q=P(X=0)', ylabel:'I(X;Y)\\;(\\text{bits})', pad:{l:56,r:26,t:24,b:42}, xt:[0,0.25,0.5,0.75,1], yticksOverride:[0.1,0.2,0.3,0.4]});
  b.curve(u=>chan(ZCH,[u,1-u]).I, {color:C.out, width:2.6});
  b.vline(0.6, {color:C.ink, dash:'5 4', width:1.3, opacity:1});
  dot(b, 0.6, chan(ZCH,[0.6,0.4]).I, {color:C.out, r:7});
  dot(b, 0.5, chan(ZCH,[0.5,0.5]).I, {color:C.muted, r:5});
  lbl(b, 0.63, 0.395, 'q^{*}=0.6,\\ C=0.3219', C.out, 'start', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* A three-input, three-output channel whose rows are shifts of (0.6, 0.2, 0.2). */
const SYM = [[0.6,0.2,0.2],[0.2,0.6,0.2],[0.2,0.2,0.6]];
function figSym(){
  const a = P.Axes(bare(SZ({xr:[-1.1,4.3], yr:[-1.5,3.9]})));
  for(let j=0;j<3;j++) for(let k=0;k<3;k++) tile(a, k, 2-j, 0.95, 0.95, SYM[j][k], C.h, String(SYM[j][k]), {max:0.6, fs:19});
  ['x_0','x_1','x_2'].forEach((s,j)=>lbl(a, -0.12, 2.42-j, s, C.in, 'end', 17));
  ['y_0','y_1','y_2'].forEach((s,k)=>lbl(a, k+0.47, 3.2, s, C.out, 'middle', 17));
  [0,1,2].forEach(k=>tile(a, k, -1.2, 0.95, 0.6, 1/3, C.out, '\\tfrac13', {max:1, fs:17}));
  lbl(a, -0.12, -1.0, 'p(y)', C.out, 'end', 16);
  lbl(a, 3.1, 1.52, '\\text{each row: }', C.ink, 'start', 15);
  lbl(a, 3.1, 1.0, 'H=1.371', C.h, 'start', 16);
  return a.svg();
}

/* Why reliable transmission is possible: inputs whose outputs cannot be
   confused, and the same count for long blocks of a BSC. */
const WC = [[0.5,0.5,0,0],[0,0.5,0.5,0],[0,0,0.5,0.5],[0.5,0,0,0.5]];
const WC_BLOBS = [[-2.2,1.2],[0.1,1.6],[2.3,1.1],[-1.3,-1.0],[1.2,-1.1],[3.3,-0.6],[-3.3,-0.4]];
function figWhyCap(v){
  const f = Math.min(3, frameOf(v, 3)), oA = 1-clamp01(f-1.5), oB = clamp01(f-1.5), Ht = takeH(380);
  const a = P.Axes(bare(SZ({xr:[-1.4,4.6], yr:[-0.9,4.4], h:Ht})));
  if(oA > 0.02){ const keep = j => j % 2 === 0, dim = clamp01(f);
    for(let j=0;j<4;j++) for(let k=0;k<4;k++){ const o = oA*(keep(j) ? 1 : 1-0.75*dim);
      tile(a, k, 3-j, 0.92, 0.92, WC[j][k], C.h, WC[j][k] ? '\\tfrac12' : '', {max:0.5, fs:17, opacity:o}); }
    if(oA > 0.5){ [0,1,2,3].forEach(j=>lbl(a, -0.12, 3.4-j, 'x_'+j, C.in, 'end', 17)); [0,1,2,3].forEach(k=>lbl(a, k+0.46, 4.1, 'y_'+k, C.out, 'middle', 17));
      lbl(a, 1.95, -0.6, f < 0.5 ? '\\text{each output could come from two inputs}' : '\\text{use }x_0,\\,x_2\\text{ only: no confusion, 1 bit a use}', C.ink, 'middle', 15); } }
  if(oB > 0.02){ const b = planeAx([[-4.8,4.8],[-3.5,3.4]], {h:Ht});
    box(b, -4.5, -2.5, 4.5, 2.6, rgba(C.out, 0.06), {stroke:C.out, width:1.6, opacity:oB});
    WC_BLOBS.forEach(([x,y])=>{ disc(b, x, y, 0.95, rgba(C.in, 0.16), {stroke:C.in, width:1.4, opacity:oB}); dot(b, x, y, {color:C.in, r:5, opacity:oB}); });
    if(oB > 0.5){ lbl(b, 0, 2.85, '2^{n}\\text{ output words}', C.out, 'middle', 16);
      lbl(b, 0, -3.05, f < 2.5 ? '\\text{each codeword: about }2^{nH_b(p)}\\text{ likely outputs}' : '2^{n}/2^{nH_b(p)}=2^{n(1-H_b(p))}\\text{ codewords fit}', f < 2.5 ? C.in : C.out, 'middle', 16); }
    return `<svg viewBox="0 0 560 ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img">${oA > 0.02 ? place(a.svg(),0,0,560,Ht) : ''}${place(b.svg(),0,0,560,Ht)}</svg>`; }
  return a.svg();
}

/* Repetition codes on a BSC with p = 0.1: majority vote over n copies. */
const repPe = (n, p) => { let s = 0; for(let k=Math.floor(n/2)+1;k<=n;k++) s += Math.exp(LF[n]-LF[k]-LF[n-k])*Math.pow(p,k)*Math.pow(1-p,n-k); return s; };
function figRepetition(v){
  const n = v ? v.n : 3, C1 = 1-hb(0.1);
  const a = logAx(SZ({xr:[0,1.08], yr:[-5.5,0], xlabel:'R\\;(\\text{bits per use})', ylabel:'P_e', xt:[0,0.25,0.5,0.75], yticksOverride:P.decades(-5,-1)}));
  box(a, 0, -5.5, C1, 0, rgba(C.out, 0.1));
  a.vline(C1, {color:C.out, dash:'1 0', width:2.2, opacity:1});
  lbl(a, C1+0.02, -0.4, 'C=0.531', C.out, 'start', 16);
  const pts = []; for(let m=1;m<=15;m+=2) pts.push([1/m, Math.log10(repPe(m, 0.1))]);
  seg(a, pts, {color:C.mid, width:1.6, dash:'4 4'});
  pts.forEach(([x,y])=>dot(a, x, y, {color:C.mid, r:5.5}));
  ring(a, 1/n, Math.log10(repPe(n,0.1)), {color:C.mid, r:11, width:2.2});
  lbl(a, 1.05, -4.0, 'n='+n+',\\ R=1/'+n, C.mid, 'end', 16);
  lbl(a, 1.05, -4.7, 'P_e='+sci(repPe(n,0.1),2), C.mid, 'end', 16);
  return a.svg();
}

/* The coding theorem on the plane of crossover and rate. */
function figCodingThm(){
  const a = TAx(SZ({xr:[0,0.5], yr:[0,1.12], xlabel:'p', ylabel:'R\\;(\\text{bits per use})', xt:[0,0.1,0.2,0.3,0.4,0.5], yticksOverride:[0,0.5,1]}));
  wash(a, u=>1-hb(u), 0, 0.5, C.out, 0.16);
  a.area(()=>1.12, 0, 0.5, {color:rgba(C.err, 0.06)});
  a.curve(u=>1-hb(u), {color:C.out, width:2.6});
  a.hline(0.5, {color:C.ink, dash:'6 4', width:1.4, opacity:1});
  a.vline(0.11, {color:C.ink, dash:'3 4', width:1.2, opacity:1});
  [1,3,5,7].forEach(m=>dot(a, 0.1, 1/m, {color:C.mid, r:5.5}));
  lbl(a, 0.22, 0.035, '\\text{reliable: }R<C', C.out, 'middle', 15);
  lbl(a, 0.3, 0.9, '\\text{impossible: }R>C', C.err, 'middle', 17);
  lbl(a, 0.125, 0.57, 'p=0.11', C.ink, 'start', 15);
  return a.svg();
}

/* The (7,4) Hamming code. Bits sit at positions 1 to 7, and the parity check
   s_i covers the positions whose binary index has bit i set: three circles,
   each holding an even number of ones in a codeword. */
const HAM = (()=>{ const words = [];
  for(let m=0;m<16;m++){ const c = new Array(8).fill(0); [3,5,6,7].forEach((pos,i)=>{ c[pos] = (m >> (3-i)) & 1; });
    c[1] = c[3]^c[5]^c[7]; c[2] = c[3]^c[6]^c[7]; c[4] = c[5]^c[6]^c[7]; words.push(c.slice(1)); }
  const wt = words.map(w=>w.reduce((s,b)=>s+b,0)); return {words, dmin:Math.min(...wt.filter(x=>x>0))}; })();
const HAM_C = [0,1,1,0,0,1,1], HAM_ERR = 5;
const HAM_POS = {1:[-1.25,0.72], 2:[1.25,0.72], 3:[0,0.95], 4:[0,-1.45], 5:[-0.62,-0.35], 6:[0.62,-0.35], 7:[0,0.05]};
const HAM_CIRC = [[-0.62,0.3],[0.62,0.3],[0,-0.72]];
const syn = w => [1,2,4].map(b=>[1,2,3,4,5,6,7].filter(i=>i&b).reduce((s,i)=>s^w[i-1],0));
function figHamming(v){
  const f = Math.min(4, frameOf(v, 4)), o0 = 1-clamp01(f);
  if(o0 > 0.5){ const big = P.labelScale() > 1, a = P.Axes(bare(SZ({xr:[0,4.2], yr:[big ? -1.5 : -0.6,8.4]})));
    HAM.words.forEach((w,i)=>{ const col = Math.floor(i/8), row = i%8, x = 0.2+2.1*col, y = 7.6-row*1.0;
      lbl(a, x, y-0.18, '\\mathtt{'+w.join('')+'}', C.mid, 'start', 17);
      lbl(a, x+1.45, y-0.18, String(w.reduce((s,b)=>s+b,0)), C.muted, 'start', 15); });
    lbl(a, 2.1, big ? -0.95 : -0.35, '16\\text{ codewords, weights at right: }d_{\\min}=3', C.ink, 'middle', 15);
    return a.svg(); }
  const a = planeAx([[-2.6,2.6],[-2.4,2.9]]);
  const w = HAM_C.slice(); if(f >= 1.5 && f < 3.5) w[HAM_ERR-1] ^= 1;
  const s = syn(w), bad = f >= 2.5 && f < 3.5 ? s : [0,0,0];
  HAM_CIRC.forEach(([cx,cy],i)=>disc(a, cx, cy, 1.25, bad[i] ? rgba(C.err, 0.12) : rgba(C.mid, 0.05), {stroke: bad[i] ? C.err : C.mid, width:2}));
  for(let i=1;i<=7;i++){ const [x,y] = HAM_POS[i], data = [3,5,6,7].includes(i), hit = i === HAM_ERR && f >= 1.5;
    const col = hit ? (f >= 3.5 ? C.out : C.err) : (data ? C.in : C.mid), o = data ? 1 : clamp01(f-0.2);
    if(o > 0.3){ txt(a, x, y, String(w[i-1]), col, 'middle', 22, {dy:7, weight:600}); txt(a, x + (x < 0 ? -0.28 : 0.3), y+0.28, String(i), C.muted, 'middle', 11); } }
  const row = w.join('');
  lbl(a, -2.5, 2.55, (f >= 1.5 && f < 3.5 ? 'r=' : 'c=')+'\\mathtt{'+row+'}', f >= 1.5 && f < 3.5 ? C.err : (f >= 3.5 ? C.out : C.mid), 'start', 18);
  if(f >= 2.5 && f < 3.5) lbl(a, 2.5, 2.55, 's=(s_4s_2s_1)=\\mathtt{'+s[2]+s[1]+s[0]+'}=5', C.err, 'end', 17);
  if(f >= 3.5) lbl(a, 2.5, 2.55, '\\text{flip bit }5', C.out, 'end', 17);
  return a.svg();
}

/* A source of entropy 0.469 bit a symbol over a BSC, one use a symbol. */
const TR_H = hb(0.1);
const TR_E = reach(e=>1-hb(e)-TR_H, 0, 1e-9, 0.5);
function figTransmission(v){
  const e = v ? v.e : 0.05, c = 1-hb(e), ok = c > TR_H;
  const a = TAx(SZ({xr:[0,1], yr:[0,1.18], xlabel:'\\epsilon', ylabel:'\\text{bits per use}', xt:[0,0.25,0.75,1], yticksOverride:[0,0.5,1]}));
  box(a, 0, 0, TR_E, 1.18, rgba(C.out, 0.1)); box(a, 1-TR_E, 0, 1, 1.18, rgba(C.out, 0.1));
  a.curve(u=>1-hb(u), {color:C.out, width:2.6});
  a.hline(TR_H, {color:C.in, dash:'6 4', width:1.8, opacity:1});
  lbl(a, 0.5, TR_H+0.05, 'H(U)=0.469', C.in, 'middle', 16);
  dot(a, e, c, {color: ok ? C.out : C.err, r:7});
  lbl(a, 0.5, 1.07, '\\epsilon='+num(e,2)+':\\ C='+num(c,3)+(ok ? '>H(U)' : '<H(U)'), ok ? C.out : C.err, 'middle', 17);
  return a.svg();
}

/* ---- 6.5 gallery: capacity around us ---------------------------------------- */
const cascP = (p, n) => (1-Math.pow(1-2*p, n))/2;
const ZLEAK = [[1,0],[0.1,0.9]], CZL = capBinary(ZLEAK, 4000);
const REAL_CAPACITY = realGallery({ id:'m6-real-capacity', nav:'Capacity around us',
  title:'Capacity around us', eyebrow:'Module 6 · Channel capacity', src:'book 12.5',
  objective:'Model a receiver, a lossy network, a chain of repeaters and a memory cell as binary channels and read their capacity.',
  keywords:'examples capacity hard decision bpsk bsc packet loss erasure channel repeater chain cascade bsc flash memory cell z-channel leak',
  figs:[
    [()=>{ const a = TAxL(EXO({xt:[-4,0,4,8], xr:[-5,10], yr:[0,1.12], xlabel:'E/N_0\\;(\\text{dB})', ylabel:'C\\;(\\text{bits per use})', yticksOverride:[0.5,1], zeroAxes:false}));
      a.curve(d=>1-hb(Qf(Math.sqrt(2*dB(d)))), {color:C.out, width:2.4, n:400});
      return a.svg(); },
      'A BPSK receiver that decides each bit is a BSC with $p=Q\\bigl(\\sqrt{2E/N_0}\\bigr)$, so $C=1-H_b(p)$. At $0$ dB, $C='+num(1-hb(Qf(Math.SQRT2)),3)+'$.'],
    [()=>{ const a = TAx(EXO({xt:[0,0.1,0.2,0.3], xr:[0,0.32], yr:[0,1.1], xlabel:'\\epsilon\\;(\\text{packets lost})', ylabel:'C', yticksOverride:[0.5,1]}));
      a.curve(u=>1-u, {color:C.out, width:2.4});
      return a.svg(); },
      'A network that loses a fraction $\\epsilon$ of packets, and says which, is an erasure channel: $C=1-\\epsilon$. At $5\\%$ loss, $0.95$ of the rate survives.'],
    [()=>{ const a = TAx(EXO({xt:[1,5,10,15,20], xr:[0,21], yr:[0,1.05], xlabel:'n\\;(\\text{hops})', ylabel:'C_n', yticksOverride:[0.5,1]}));
      a.stem(Array.from({length:20}, (_,k)=>[k+1, 1-hb(cascP(0.01, k+1))]), {color:C.out});
      return a.svg(); },
      'A chain of $n$ repeaters, each deciding bits with $p=0.01$, is one BSC with $p_n=\\tfrac12\\bigl(1-(1-2p)^n\\bigr)$. $C$ falls from $0.919$ to $'+num(1-hb(cascP(0.01,10)),3)+'$ in $10$ hops.'],
    [()=>{ const a = TAx(EXO({xt:[0,0.25,0.5,0.75,1], xr:[0,1], yr:[0,0.8], xlabel:'q=P(\\text{store }0)', ylabel:'I\\;(\\text{bits})', yticksOverride:[0.25,0.5,0.75]}));
      a.curve(u=>chan(ZLEAK,[u,1-u]).I, {color:C.out, width:2.4});
      dot(a, CZL.q, CZL.I, {color:C.out, r:5.5});
      return a.svg(); },
      'A memory cell whose charge leaks, so a stored $1$ reads as $0$ with probability $0.1$, is a Z-channel. $C='+num(CZL.I,3)+'$ at $q='+num(CZL.q,2)+'$.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Modelled as', html:'Each device is read as a binary channel with stated numbers. The capacity follows from its matrix.'},
    {t:'note', kind:'ok', head:'Erasures are cheap', html:'A lost packet that is flagged costs $\\epsilon$. A flipped bit that is hidden costs $H_b(\\epsilon)$, which is more.'},
    {t:'note', kind:'warn', head:'Hops add up', html:'Each decision adds errors, and capacity only falls along a chain.'}
  ]});

/* ---- 6.6 the Gaussian channel ------------------------------------------------ */

/* Sphere counting in two dimensions: seven codewords, the noise disc around
   each, and the disc of all received words. */
const AW_R = 1, AW_BIG = 3, AW_PTS = [[0,0]].concat([0,1,2,3,4,5].map(k=>[2*Math.cos(Math.PI*k/3+Math.PI/6), 2*Math.sin(Math.PI*k/3+Math.PI/6)]));
const AW_Z = gauss(6601, 240, 0.42);
function planeAx(need, o){
  const h = P.hOverride || (o && o.h) || 380; P.hOverride = null;
  const base = Object.assign({w:560, pad:{l:20,r:20,t:14,b:14}}, bare(o||{}), {h});
  const pr = P.Axes(Object.assign({}, base, {xr:need[0], yr:need[1]}));
  const k = Math.min((pr.x1-pr.x0)/(need[0][1]-need[0][0]), (pr.y0-pr.y1)/(need[1][1]-need[1][0]));
  const cx = (need[0][0]+need[0][1])/2, cy = (need[1][0]+need[1][1])/2, hx = (pr.x1-pr.x0)/k/2, hy = (pr.y0-pr.y1)/k/2;
  return P.Axes(Object.assign({}, base, {xr:[cx-hx,cx+hx], yr:[cy-hy,cy+hy]}));
}
function figAWGN(v){
  const f = Math.min(3, frameOf(v, 3)), a = planeAx([[-4.4,4.4],[-4.3,4.0]]);
  const o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  if(o2 > 0.02){ disc(a, 0, 0, AW_BIG, rgba(C.out, 0.05*o2), {stroke:C.out, width:2, dash:'7 5', opacity:o2}); }
  AW_PTS.forEach(([x,y],i)=>{ const o = i === 0 ? 1 : o1; if(o < 0.02) return;
    disc(a, x, y, AW_R, rgba(C.in, 0.12), {stroke:C.in, width:1.4, dash:'4 4', opacity:o});
    dot(a, x, y, {color:C.in, r:5.5, opacity:o}); });
  cloudPts(a, AW_Z.slice(0,120).map((u,i)=>[u, AW_Z[120+i]]), {r:1.9, opacity:1-0.7*o1});
  if(f < 0.5) lbl(a, 1.25, 1.35, '\\text{radius }\\sqrt{nP_N}', C.in, 'start', 16);
  if(o2 > 0.5) lbl(a, 0, 3.35, '\\text{radius }\\sqrt{n(P+P_N)}', C.out, 'middle', 16);
  if(o3 > 0.5) lbl(a, 0, -3.75, 'M\\approx\\bigl(1+P/P_N\\bigr)^{n/2}', C.ink, 'middle', 16);
  return a.svg();
}

/* Capacity of the bandlimited channel, per hertz, against the SNR. */
function figShannon(v){
  const s = v ? v.s : 11.76, snr = dB(s), c = lg(1+snr);
  const a = TAxL(SZ({xr:[-10,30], yr:[0,11.8], xlabel:'\\text{SNR}\\;(\\text{dB})', ylabel:'C/W\\;(\\text{b/s/Hz})', xt:[-10,0,10,20], yticksOverride:[0,2,4,6,8,10], zeroAxes:false}));
  a.curve(d=>lg(1+dB(d)), {color:C.out, width:2.6});
  seg(a, [[s,0],[s,c],[-10,c]], {color:C.ink, width:1.3, dash:'5 4'});
  dot(a, s, c, {color:C.out, r:7});
  lbl(a, -9, 10.95, '\\text{SNR}='+num(snr, snr < 10 ? 2 : 1)+':\\ \\ C/W='+num(c,2), C.out, 'start', 16);
  return a.svg();
}

/* A telephone line: W = 3.1 kHz, and the common error of putting the SNR in
   dB inside the logarithm. */
function figPhone(){
  const a = TAx(SZ({xr:[0,40], yr:[0,44], xlabel:'\\text{SNR}\\;(\\text{dB})', ylabel:'C\\;(\\text{kb/s})', xt:[0,10,20,30,40], yticksOverride:[0,10,20,30,40]}));
  a.curve(d=>3.1*lg(1+dB(d)), {color:C.out, width:2.6});
  dot(a, 30, 3.1*lg(1001), {color:C.out, r:7});
  lbl(a, 29, 3.1*lg(1001)+3, '30\\text{ dB}:\\ 30.9\\text{ kb/s}', C.out, 'end', 16);
  ring(a, todB(30), 3.1*lg(31), {color:C.err, r:10, width:2.2});
  lbl(a, todB(30)+1.2, 3.1*lg(31)-4.2, '\\log_2(1+30):\\ 15.4\\text{ kb/s}', C.err, 'start', 16);
  return a.svg();
}

/* More bandwidth at the same power: C rises and levels off at 1.44 P/N0.
   More power at the same bandwidth: C keeps growing, slowly. */
function figBandwidth(v){
  const u = v ? v.w : 0, x = Math.pow(10, u), c = x*lg(1+1/x), Ht = takeH(430), hA = Math.round(0.56*Ht);
  const a = TAxL({w:560, h:hA, xr:[-1.05,2.05], yr:[0,1.75], xlabel:'WN_0/P', ylabel:'C/(P/N_0)', pad:{l:62,r:26,t:24,b:42}, xt:[-1,0,1,2], xfmt:P.decade, yticksOverride:[0,0.5,1], zeroAxes:false});
  a.hline(1/Math.LN2, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.curve(t=>Math.pow(10,t)*lg(1+Math.pow(10,-t)), {color:C.out, width:2.6});
  dot(a, u, c, {color:C.out, r:7});
  lbl(a, -0.95, 1/Math.LN2+0.1, '1/\\ln2=1.443', C.ink, 'start', 15);
  lbl(a, 2.0, 0.2, 'WN_0/P='+num(x, x < 1 ? 2 : 1)+':\\ C='+num(c,3)+'\\,P/N_0', C.out, 'end', 16);
  const b = TAx({w:560, h:Ht-hA, xr:[0,100], yr:[0,7.6], xlabel:'P/(N_0W)', ylabel:'C/W', pad:{l:62,r:26,t:24,b:42}, xt:[0,25,50,75,100], yticksOverride:[0,2,4,6]});
  b.curve(t=>lg(1+t), {color:C.out, width:2.4, dash:'8 5'});
  lbl(b, 98, 2.3, '\\text{power alone: }\\log_2(1+P/N_0W)', C.out, 'end', 15);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}

/* The bandwidth-efficiency plane with the limit E_b/N_0 = (2^r - 1)/r and the
   uncoded schemes of Module 5 at a symbol error of 1e-5. */
const PE5 = {
  psk: (M, g) => M===2 ? Qf(Math.sqrt(2*g)) : 2*Qf(Math.sqrt(2*lg(M)*g)*Math.sin(Math.PI/M)),
  qam: (M, g) => 4*(1-1/Math.sqrt(M))*Qf(Math.sqrt(3*lg(M)*g/(M-1))),
  orth:(M, g) => (M-1)*Qf(Math.sqrt(lg(M)*g)) };
const PL5 = [['psk',2,1],['psk',4,2],['psk',8,3],['qam',16,4],['qam',64,6],['orth',4,1],['orth',8,0.75],['orth',16,0.5],['orth',32,0.3125],['orth',64,0.1875]]
  .map(([fam,M,r])=>({fam, M, r, g:reach(d=>PE5[fam](M, dB(d)), 1e-5, -5, 40)}));
const limDB = r => todB((Math.pow(2,r)-1)/r);
function figPlane6(v){
  const u = v ? v.u : 1, r = Math.pow(2, u);
  const a = TAx(SZ({xr:[-3,22], yr:[-3,3], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'r=R_b/W', xt:[0,5,10,15], yticksOverride:[], grid:false, zeroAxes:false}));
  leftTicks(a, [-3,-2,-1,0,1,2,3], t=>t >= 0 ? String(Math.pow(2,t)) : '1/'+Math.pow(2,-t));
  const lim = []; for(let t=-3;t<=3.001;t+=0.05) lim.push([limDB(Math.pow(2,t)), t]);
  const fillPts = lim.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L');
  a.raw(`<path d="M${f2(a.sx(-3))},${f2(a.sy(-3))}L${fillPts}L${f2(a.sx(-3))},${f2(a.sy(3))}Z" fill="${rgba(C.err, 0.1)}" stroke="none"/>`);
  seg(a, lim, {color:C.out, width:2.6});
  a.hline(0, {color:C.muted, width:1, dash:'2 4'});
  PL5.forEach(q=>dot(a, q.g, lg(q.r), {color:C.in, r:5.5}));
  dot(a, limDB(r), u, {color:C.out, r:7});
  lbl(a, 21.5, -2.6, 'r='+num(r, r < 1 ? 3 : 2)+':\\ E_b/N_0\\ge'+num(limDB(r),2)+'\\text{ dB}', C.out, 'end', 16);
  lbl(a, 21.5, 0.25, '\\text{bandwidth-limited}', C.ink, 'end', 14);
  lbl(a, 21.5, -0.7, '\\text{power-limited}', C.ink, 'end', 14);
  lbl(a, -2.6, 2.55, '\\text{impossible}', C.err, 'start', 15);
  return a.svg();
}

/* The limit as r falls to zero: the point walks down the curve to ln 2. */
const LIM_R = [4, 2, 1, 0.5, 0.1, 0.001];
function figLimit(v){
  const f = Math.min(5, frameOf(v, 5)), i = Math.min(4, Math.floor(f)), t = f-i;
  const u = lg(LIM_R[i]) + (i < 5 ? t*(lg(LIM_R[Math.min(5,i+1)])-lg(LIM_R[i])) : 0), r = Math.pow(2, u);
  const a = TAxL(SZ({xr:[-3,12], yr:[-10.5,2.6], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'\\log_2 r', zeroAxes:false, xt:[-1.59,0,3,6,9], xfmt:x=>x.toFixed(x%1 ? 2 : 0), yticksOverride:[-10,-8,-6,-4,-2,0,2]}));
  const lim = []; for(let t=-10.5;t<=2.6;t+=0.05) lim.push([limDB(Math.pow(2,t)), t]);
  seg(a, lim, {color:C.out, width:2.6});
  a.vline(todB(Math.LN2), {color:C.err, dash:'1 0', width:2, opacity:1});
  dot(a, limDB(r), u, {color:C.mid, r:7});
  lbl(a, 11.8, -9.6, 'r='+(r < 0.01 ? '0.001' : num(r, r < 1 ? 2 : 0))+':\\ '+num(limDB(r),2)+'\\text{ dB}', C.mid, 'end', 16);
  if(f > 4.5){ const bp = reach(d=>Qf(Math.sqrt(2*dB(d))), 1e-5, 0, 20);
    dot(a, bp, 0, {color:C.in, r:6.5}); arrow(a, bp-0.3, -1.3, todB(Math.LN2)+0.15, -1.3, {color:C.ink, width:1.6, head:0.7});
    lbl(a, (bp+todB(Math.LN2))/2+1, -0.95, '11.18\\text{ dB}', C.ink, 'middle', 15); lbl(a, bp+0.3, 0.45, '\\text{BPSK}', C.in, 'start', 15); }
  return a.svg();
}

/* Water-filling: six subchannels with noise 0.1 to 3.2 and a total power P. */
const WF_N = [0.1, 0.2, 0.4, 0.8, 1.6, 3.2];
function waterfill(N, Pt){
  let lo = Math.min(...N), hi = Math.max(...N)+Pt;
  for(let i=0;i<100;i++){ const mu = (lo+hi)/2, used = N.reduce((s,n)=>s+Math.max(0, mu-n), 0); if(used > Pt) hi = mu; else lo = mu; }
  const mu = (lo+hi)/2, pw = N.map(n=>Math.max(0, mu-n));
  return {mu, pw, C:N.reduce((s,n,i)=>s+0.5*lg(1+pw[i]/n), 0), Ceq:N.reduce((s,n)=>s+0.5*lg(1+Pt/N.length/n), 0), used:pw.filter(x=>x>0).length};
}
function figWater(v){
  const Pt = v ? v.P : 1, w = waterfill(WF_N, Pt);
  const a = TAxL(SZ({xr:[-0.4,6.4], yr:[0,4.6], ylabel:'\\text{power, noise}', xt:[], yticksOverride:[0,1,2,3,4]}));
  WF_N.forEach((n,i)=>{ box(a, i+0.1, 0, i+0.9, n, C.noiseSoft, {stroke:C.noise, width:1.4});
    if(w.pw[i] > 0) box(a, i+0.1, n, i+0.9, w.mu, rgba(C.in, 0.3), {stroke:C.in, width:1.6});
    lbl(a, i+0.5, -0.32, 'N_'+(i+1), C.muted, 'middle', 14); });
  a.hline(w.mu, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  lbl(a, -0.2, 4.25, 'P='+num(Pt,2)+':\\ \\ \\mu='+num(w.mu,3)+',\\ '+w.used+'\\text{ channels used}', C.in, 'start', 16);
  lbl(a, -0.2, 3.7, 'C='+num(w.C,3)+'\\text{ bits, equal shares }'+num(w.Ceq,3), C.out, 'start', 16);
  return a.svg();
}

/* ---- 6.6 gallery: Shannon's formula around us -------------------------------- */
const DSL_N = Array.from({length:24}, (_,k)=>0.02*Math.pow(1.22, k));
const DSL = waterfill(DSL_N, 6);
const DSL_B = DSL_N.map((n,k)=>lg(1+DSL.pw[k]/n));
const REAL_SHANNON = realGallery({ id:'m6-real-shannon', nav:"Shannon's formula around us",
  title:"Shannon's formula around us", eyebrow:'Module 6 · The Gaussian channel', src:'book 12.5.1, 12.6',
  objective:'Apply the capacity of the bandlimited Gaussian channel to a telephone line, a radio channel, a deep-space link and DSL tones.',
  keywords:'examples shannon capacity telephone voice band 300 3400 hz radio 20 mhz 20 dB deep space power limited 1.44 P/N0 dsl dmt tones water filling bits per tone',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[0,1,2,3,4], xr:[0,4.4], yr:[0,1.3], xlabel:'f\\;(\\text{kHz})', ylabel:'|H(f)|', yticksOverride:[0.5,1]}));
      a.curve(fk=>1/(1+Math.pow(0.3/fk, 8))/(1+Math.pow(fk/3.4, 12)), {color:C.h, width:2.4, n:500});
      a.span(0.3, 3.4, 1.12, 'W=3.1\\text{ kHz}', {tex:true, color:C.h, fs:14});
      return a.svg(); },
      'A telephone line passes $300$ Hz to $3.4$ kHz. At an SNR of $30$ dB, $C=W\\log_2(1+\\text{SNR})=30.9$ kb/s.'],
    [()=>{ const a = TAx(EXO({xt:[0,10,20,30], xr:[0,32], yr:[0,230], xlabel:'\\text{SNR}\\;(\\text{dB})', ylabel:'C\\;(\\text{Mb/s})', yticksOverride:[100,200]}));
      a.curve(d=>20*lg(1+dB(d)), {color:C.out, width:2.4});
      dot(a, 20, 20*lg(101), {color:C.out, r:5.5});
      return a.svg(); },
      'A radio channel $20$ MHz wide at an assumed SNR of $20$ dB: $C=20\\log_2101='+num(20*lg(101),0)+'$ Mb/s.'],
    [()=>{ const a = TAx(EXO({xt:[0,20,40,60,80], xr:[0,85], yr:[0,16.5], xlabel:'W\\;(\\text{kHz})', ylabel:'C\\;(\\text{kb/s})', yticksOverride:[5,10,15]}));
      a.hline(10/Math.LN2, {color:C.ink, dash:'6 4', width:1.4, opacity:1});
      a.curve(wk=>wk*lg(1+10/Math.max(wk,1e-6)), {color:C.out, width:2.4});
      return a.svg(); },
      'A deep-space link with an assumed $P/N_0=10^{4}$ Hz. More band helps less and less: $C\\to P/(N_0\\ln2)='+num(10/Math.LN2,1)+'$ kb/s.'],
    [()=>{ const a = TAx(EXO({xt:[0,25,50,75,100], xr:[-3,106], yr:[0,9.5], xlabel:'f\\;(\\text{kHz})', ylabel:'b_k\\;(\\text{bits})', yticksOverride:[2,4,6,8]}));
      a.stem(DSL_B.map((b,k)=>[4.3125*(k+1), b]), {color:C.mid});
      return a.svg(); },
      'DSL splits its band into tones $4.3125$ kHz apart. With noise rising in frequency, water-filling gives tone $k$ the bits $b_k=\\log_2(1+P_k/N_k)$.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Band and SNR', html:'$C=W\\log_2(1+P/N_0W)$ takes a width in hertz and a ratio, never a ratio in dB.'},
    {t:'note', kind:'ok', head:'Two regimes', html:'A wide band at low SNR is power-limited. A narrow band at high SNR is bandwidth-limited.'},
    {t:'note', kind:'warn', head:'Assumed numbers', html:'The SNR and $P/N_0$ here are assumptions for the example, not a claim about any standard.'}
  ]});

/* ---- 6.7 summary: a source over a channel ----------------------------------- */
const LINK6 = { Rs:1000, Rc:3000, g:4 };
LINK6.p = Qf(Math.sqrt(2*dB(LINK6.g))); LINK6.C = 1-hb(LINK6.p);
function figChain6(v){
  const f = Math.min(5, frameOf(v, 5)), Ht = takeH(430), hA = Math.round(0.36*Ht), on = k => clamp01(f-k+1);
  const hot = k => Math.round(f) === k ? C.mid : C.ink;
  const blk = P.blocks({w:560, h:hA, items:[
    {t:'box', x:8, y:hA/2-30, w:92, h:60, label:'source', color:hot(0)},
    {t:'arrow', x1:100, y1:hA/2, x2:132, y2:hA/2},
    {t:'box', x:132, y:hA/2-30, w:104, h:60, label:'Huffman', color:hot(2)},
    {t:'arrow', x1:236, y1:hA/2, x2:268, y2:hA/2},
    {t:'box', x:268, y:hA/2-30, w:128, h:60, label:'BPSK + noise', color:hot(3), fs:14},
    {t:'arrow', x1:396, y1:hA/2, x2:428, y2:hA/2},
    {t:'box', x:428, y:hA/2-30, w:124, h:60, label:'BSC', color:hot(4)}]});
  const b = TAx({w:560, h:Ht-hA, xr:[-1250,3200], yr:[-0.5,3.9], xlabel:'\\text{b/s}', pad:{l:24,r:26,t:14,b:42}, xt:[0,1000,2000], yticksOverride:[], grid:false});
  const bars = [[1, 'H\\,R_s', HFIVE*LINK6.Rs, C.in], [2, '\\bar{L}\\,R_s', 2.2*LINK6.Rs, C.mid], [4, 'C\\,R_c', LINK6.C*LINK6.Rc, C.out]];
  bars.forEach(([k, nm, val, col], i)=>{ const o = on(k); if(o < 0.02) return; const y = 2.7-1.05*i;
    box(b, 0, y-0.32, val, y+0.32, rgba(col, 0.28), {stroke:col, width:1.8, opacity:o});
    if(o > 0.5) lbl(b, -60, y-0.1, nm+'='+Math.round(val), col, 'end', 16); });
  if(f > 4.5) lbl(b, 3150, 3.5, '2122<2709:\\ \\text{reliable is possible}', C.out, 'end', 16);
  else if(f > 2.5 && f < 3.5) lbl(b, 3150, 3.5, 'p=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)='+num(LINK6.p,4)+'\\text{ at 4 dB}', C.err, 'end', 16);
  return `<svg viewBox="0 0 560 ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img">${place(blk,0,0,560,hA)}${place(b.svg(),0,hA,560,Ht-hA)}</svg>`;
}

/* Small sketches for the summary and project cards, in the dark-page tints. */
const G = (()=>{
  const sv = b => `<svg viewBox="0 0 92 44">${b}</svg>`;
  const ln = (d,c,w,da) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round"${da?` stroke-dasharray="${da}"`:''}/>`;
  const dt = (x,y,c,r) => `<circle cx="${x}" cy="${y}" r="${r||4}" fill="${c}"/>`;
  const AX='rgba(239,231,216,.30)', CY='#4FBECE', VI='#AC99DC', AM='#E5B255', GR='#82C27B', RD='#E8785F';
  const axes = ln('M6 40 H88 M10 42 V4',AX,1);
  const curve = (fn, x0, x1, c, w, da) => ln('M'+Array.from({length:41},(_,i)=>{ const u = i/40, x = x0+(x1-x0)*u; return x.toFixed(1)+','+fn(u).toFixed(1); }).join('L'), c, w, da);
  return {
    self:    sv(axes+curve(u=>40-34*Math.min(1, -Math.log2(Math.max(0.02,u))/6), 12, 86, CY, 2)),
    hb:      sv(axes+curve(u=>40-32*(u<=0||u>=1?0:-(u*Math.log2(u)+(1-u)*Math.log2(1-u))), 12, 86, CY, 2)),
    ext:     sv(axes+[16,26,36,46,56,66,76].map((x,i)=>ln(`M${x} 40 V${34-3*i}`,CY,5)).join('')),
    typical: sv(axes+curve(u=>40-30*Math.exp(-Math.pow((u-0.4)/0.08,2)), 12, 86, CY, 2)),
    kraft:   sv(ln('M10 12 H48',CY,5)+ln('M10 22 H29',CY,5)+ln('M29 22 H38',CY,5)+ln('M10 32 H86',VI,5)),
    bound:   sv(axes+curve(u=>12+18*(1-1/(1+9*u)), 12, 86, VI, 2)+ln('M10 34 H88',CY,1.4,'3 3')),
    huffman: sv(ln('M12 8 L40 16 M12 20 L40 16 M40 16 L70 26 M12 34 L70 26 M70 26 L86 26',VI,1.8)+dt(12,8,CY,3)+dt(12,20,CY,3)+dt(12,34,CY,3)),
    lz:      sv(ln('M10 22 L32 10 M10 22 L32 34 M32 10 L56 4 M32 10 L56 16 M32 34 L56 30 M56 30 L80 36',VI,1.6)+dt(10,22,AX,3)+dt(80,36,VI,3.5)),
    channel: sv(ln('M14 10 H78 M14 34 H78',AM,2)+ln('M14 10 L78 34 M14 34 L78 10',RD,1.4,'4 3')+dt(14,10,CY)+dt(14,34,CY)+dt(78,10,GR)+dt(78,34,GR)),
    mutual:  sv(ln('M10 16 H32',RD,8)+ln('M32 16 H58',GR,8)+ln('M58 16 H82',AM,8)+ln('M10 32 H58',CY,2)),
    capacity:sv(axes+curve(u=>40-30*(1-(u<=0||u>=1?0:-(u*Math.log2(u)+(1-u)*Math.log2(1-u)))), 12, 86, GR, 2)),
    theorem: sv(axes+curve(u=>40-30*(1-(u<=0||u>=0.5?(u<=0?0:1):-(u*Math.log2(u)+(1-u)*Math.log2(1-u)))), 12, 86, GR, 2)+dt(26,24,VI,3)+dt(26,12,VI,3)),
    hamming: sv(`<circle cx="36" cy="18" r="13" fill="none" stroke="${VI}" stroke-width="1.6"/><circle cx="56" cy="18" r="13" fill="none" stroke="${VI}" stroke-width="1.6"/><circle cx="46" cy="30" r="13" fill="none" stroke="${RD}" stroke-width="1.6"/>`),
    shannon: sv(axes+curve(u=>40-34*Math.log2(1+20*u)/Math.log2(21), 12, 86, GR, 2)),
    limit:   sv(axes+ln('M22 4 V40',RD,1.6)+curve(u=>6+30*u*u, 30, 86, GR, 2)),
    water:   sv(ln('M12 40 V30 H26 V26 H40 V20 H54 V12 H68 V4',AX,1.4)+ln('M12 18 H60',CY,2)),
    chain:   sv(dt(12,22,CY)+ln('M18 22 H30',AX,1.2)+ln('M32 14 h16 v16 h-16 Z',VI,1.4)+ln('M50 22 H60',AX,1.2)+dt(80,22,GR))
  };
})();

/* ======================================================================== */
const labScene = (id, lab, title, eyebrow, objective, keywords, lede) => ({ id, module:'M6',
  nav:'Laboratory {lab} · '+title, title:'Laboratory {lab} · '+title, objective, keywords,
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · '+eyebrow},
  {t:'title', text:'Laboratory {lab} · '+title},
  {t:'lede', text:lede},
  {t:'lab', id:lab}
]});
const codeScene = (id, nav, title, objective, keywords) => ({ id, module:'M6', nav:'Code · '+nav, title,
  objective, keywords, slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 6 · '+title},
  {t:'title', text:title},
  {t:'raw', html:()=>CODEBANK.page(id)}
]});
const given = (key, html, choices, answer, why) => ({t:'note', kind:'def', head:'Given', html, ask:{key, choices, answer, why}});

const SC = [

/* ---------------------------------------------------------------- 6.0 ---- */
{ id:'m6-open', module:'M6', nav:'Module 6 opening', title:'An Introduction to Information Theory',
  objective:'Name the two numbers of information theory: the entropy of a source and the capacity of a channel.',
  keywords:'module 6 overview information theory entropy source coding capacity channel coding binary entropy opening',
  src:'CH10 s.2–3', dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', level:1, text:'An Introduction to Information Theory'},
  {t:'lede', text:'Two numbers set what any code can do. A source has an entropy, and a channel has a capacity.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'stack', style:'--ts:1.6;gap:34px', items:[
      {t:'note', kind:'warn', head:'Result 1', html:'<span style="color:var(--graphite)">A source has an entropy: the fewest bits a symbol that any lossless code can reach.</span>'},
      {t:'note', kind:'warn', head:'Result 2', html:'<span style="color:var(--graphite)">A channel has a capacity: the most bits a use that any code can carry reliably.</span>'}
    ]}
  ], right:[
    {t:'fig', svg:figOpen}
  ]}
]},

/* ---------------------------------------------------------------- 6.1 ---- */
{ id:'m6-selfinfo', module:'M6', nav:'Self-information', title:'Self-information',
  objective:'Measure the information in one symbol as minus the logarithm of its probability.',
  keywords:'self-information logarithm bits nats probability rare symbol properties additive slider',
  src:'CH10 s.4', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Information and entropy'},
  {t:'title', text:'Self-information'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'p', label:'$p$', min:0.01, max:0.95, step:0.005, v:0.125, show:v=>'$'+num(v,3)+'$'}]},
      svg:figSelfInfo,
      caption:'Self-information against probability. Drag $p$: a rare symbol carries many bits, and a certain one carries none.'}
  ], right:[
    {t:'eq', label:'Self-information', tex:'I(s_k)=\\log_2\\frac{1}{p_k}=-\\log_2p_k\\ \\ \\text{bits}',
      note:'A symbol of probability $p_k$ carries $I(s_k)$ bits when it arrives. Base $2$ gives bits, base $e$ gives nats.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Three properties', html:'$I\\ge0$, and $I=0$ when $p_k=1$. Rarer symbols carry more. Independent symbols add: $I(s_js_k)=I(s_j)+I(s_k)$, because their probabilities multiply.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'Write $-\\log_2p_k$, not $\\log_2p_k$. The logarithm of a probability is negative, and information is not.'}]},
    {t:'reveal', at:3, items:[
      given('m6-selfinfo', 'A symbol has probability $p=1/8$.<div class="nsep"></div>How many bits does it carry?',
        ['$1/8$ bit','$3$ bits','$8$ bits'], 1, '$-\\log_2\\tfrac18=\\log_28=3$ bits: three halvings from certainty.')]}
  ]}
]},

{ id:'m6-questions', module:'M6', nav:'Yes/no questions', title:'Information as yes/no questions',
  objective:'Read a bit as one yes/no question and entropy as the average number of questions.',
  keywords:'bits questions twenty questions halving eight cards log2 skewed source question tree average 1.75 frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Information and entropy'},
  {t:'title', text:'Information as yes/no questions'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['cards','Q1','Q2','Q3','skewed','average']}, svg:figQuestions,
      caption:'Find one of eight equal cards with yes/no questions, one a press. Then ask a skewed source with a tree: its average number of questions is its entropy.'}
  ], right:[
    {t:'note', kind:'def', head:'One question, one bit', html:'A yes/no question whose two answers are equally likely gives one bit. Each answer halves the candidates.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Equal cases', tex:'K=2^{m}\\ \\text{cases}\\;\\Longrightarrow\\;m=\\log_2K\\ \\text{questions}',
        note:'Eight cards take $\\log_28=3$ questions.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Skewed source', tex:'\\bar{L}=\\tfrac12(1)+\\tfrac14(2)+\\tfrac18(3)+\\tfrac18(3)=1.75=H',
        note:'Ask about the likely symbol first. The average equals the entropy of $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-questions', '$16$ equally likely outcomes.<div class="nsep"></div>How many yes/no questions find one?',
        ['$4$','$8$','$16$'], 0, '$\\log_216=4$: the questions halve $16$ to $8$, $4$, $2$ and $1$.')]}
  ]}
]},

{ id:'m6-entropy', module:'M6', nav:'Entropy', title:'Entropy',
  objective:'Define entropy as the average self-information and give its bounds.',
  keywords:'entropy average information bits a symbol bounds log2 K uniform maximum three-symbol source 1.157',
  src:'CH10 s.5–6', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Information and entropy'},
  {t:'title', text:'Entropy'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figEntropyBars,
      caption:'For each symbol of $0.7,0.2,0.1$: the bits it carries (left bar) and its weighted share (right bar). The weighted bars add to $H(S)=1.157$.'},
    {t:'legend', items:[['in','$I(s_k)$'],['mid','$p_kI(s_k)$']], at:'tr'}
  ], right:[
    {t:'eq', label:'Entropy', tex:'H(S)=\\sum_{k=1}^{K}p_kI(s_k)=-\\sum_{k=1}^{K}p_k\\log_2p_k',
      note:'The average information of a symbol, in bits a symbol.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Example', tex:'\\begin{aligned}H(S)&=-0.7\\log_20.7-0.2\\log_20.2-0.1\\log_20.1\\\\&=0.360+0.464+0.332=1.157\\ \\text{bits}\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · entropy bounds', tex:'0\\le H(S)\\le\\log_2K',
        note:'Zero when one symbol is certain. $\\log_2K$ when all $K$ symbols are equally likely.'}]},
    {t:'reveal', at:3, items:[
      given('m6-entropy', 'Two three-symbol sources: $0.7,0.2,0.1$ and $\\tfrac13,\\tfrac13,\\tfrac13$.<div class="nsep"></div>Which has the larger entropy?',
        ['$0.7,0.2,0.1$','the uniform one','they are equal'], 1, '$\\log_23=1.585>1.157$. Equal probabilities give the most uncertainty.')]}
  ]}
]},

{ id:'m6-hb', module:'M6', nav:'Binary entropy', title:'The binary entropy function',
  objective:'Draw the entropy of a two-symbol source and read its flat top.',
  keywords:'binary entropy function H_b(p) two symbols coin flat top one bit 0.11 half bit binary symmetric source slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Information and entropy'},
  {t:'title', text:'The binary entropy function'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'p', label:'$p$', min:0.01, max:0.99, step:0.01, v:0.11, show:v=>'$'+num(v,2)+'$'}]},
      svg:figHb,
      caption:'The binary entropy function (solid) and its two terms (dashed). Drag $p$: the top is flat near $\\tfrac12$.'}
  ], right:[
    {t:'eq', label:'Binary entropy', tex:'H_b(p)=-p\\log_2p-(1-p)\\log_2(1-p)',
      note:'A source of two symbols with probabilities $p$ and $1-p$. It is symmetric about $p=\\tfrac12$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Flat top', html:'At $p=\\tfrac12$, $H_b=1$ bit. It falls slowly near the top and reaches $0$ only at $p=0$ and $p=1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Binary symmetric source', html:'Equally likely independent bits carry one bit each. No lossless code can shorten them.'}]},
    {t:'reveal', at:3, items:[
      given('m6-hb', 'A binary source with $p=0.11$.<div class="nsep"></div>What is $H_b(p)$?',
        ['$0.11$ bit','$0.50$ bit','$0.89$ bit'], 1, '$-0.11\\log_20.11-0.89\\log_20.89=0.350+0.150=0.500$ bit.')]}
  ]}
]},

{ id:'m6-ex-rate', module:'M6', nav:'Worked example · rate of a source', title:'Worked example: the information rate of a source',
  objective:'Turn an entropy in bits a sample into an information rate in bits a second.',
  keywords:'worked example information rate sampled source nyquist rate 6000 samples four levels 1.846 bits 11079 b/s',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Worked example'},
  {t:'title', text:'Worked example: the information rate of a source'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figExRate,
      caption:'Top: the four levels and their probabilities. Bottom: a source band-limited to $3$ kHz, sampled every $\\tfrac16$ ms.'}
  ], right:[
    given('m6-ex-rate', 'A source band-limited to $W=3$ kHz is sampled at the Nyquist rate. Each sample takes one of four levels with probabilities $0.4,0.3,0.2,0.1$.<div class="nsep"></div>Find the information rate. How many samples a second?',
      ['$3000$','$6000$','$12000$'], 1, 'The Nyquist rate is $2W=6000$ samples a second.'),
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'R=H(S)\\,f_s,\\qquad f_s=2W=6000\\ \\text{samples/s}',
        note:'Bits a sample times samples a second.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}H(S)&=0.529+0.521+0.464+0.332=1.846\\ \\text{bits}\\\\R&=1.846\\times6000=11\\,079\\ \\text{b/s}\\end{aligned}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Multiply by the sample rate $2W$, not by the bandwidth $W$. Using $3000$ gives half the rate, $5539$ b/s.'}]}
  ]}
]},

{ id:'m6-extension', module:'M6', nav:'Extended sources', title:'Extended sources',
  objective:'Show that a block of n symbols of a memoryless source carries n times the entropy.',
  keywords:'extension extended source blocks pairs S^2 nine symbols n times entropy memoryless 2.3136 frames',
  src:'CH10 s.7', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Information and entropy'},
  {t:'title', text:'Extended sources'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$S$','$S^{2}$']}, svg:figExtension,
      caption:'The bits each symbol carries, then each pair of $S^2$. A pair carries the sum of its two symbols, so the dashed average doubles.'}
  ], right:[
    {t:'eq', label:'Extension', tex:'H(S^{n})=n\\,H(S)',
      note:'Group $n$ symbols into one symbol of an alphabet of $K^n$. The symbols of a memoryless source are independent, so their information adds.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Check with pairs', tex:'\\begin{aligned}H(S^2)&=-\\textstyle\\sum_{i,j}p_ip_j\\log_2(p_ip_j)\\\\&=2.3136=2\\times1.1568\\end{aligned}',
        note:'Nine probabilities, $0.49,0.14,\\ldots,0.01$, summed the long way.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Memory', html:'With memory, as in English where $q$ is followed by $u$, a block carries less than $nH(S)$. Compressors live on that surplus.'}]},
    {t:'reveal', at:3, items:[
      given('m6-extension', 'The source $0.7,0.2,0.1$, taken three at a time.<div class="nsep"></div>What is $H(S^3)$?',
        ['$1.157$','$2.314$','$3.470$'], 2, '$3\\times1.1568=3.470$ bits a block of three.')]}
  ]}
]},

REAL_ENTROPY,

labScene('m6-lab-i', 'I', 'Entropy of a source', 'Information and entropy',
  'Move the probabilities of a source and watch its entropy respond.',
  'laboratory entropy probabilities uniform dyadic bounds redundancy fixed-length code interactive',
  'Set the probabilities of up to six symbols. Watch the information of each, the entropy and its gap to $\\log_2K$.'),

codeScene('m6-code-entropy', 'Entropy', 'Entropy in code',
  'Compute self-information, entropy and the entropy of an extended source and of a text.',
  'code matlab python program run self-information entropy extension letter frequencies text'),

/* ---------------------------------------------------------------- 6.2 ---- */
{ id:'m6-coding', module:'M6', nav:'Code length', title:'Code length',
  objective:'Define the average codeword length and the efficiency of a code.',
  keywords:'source coding encoder codeword average length efficiency variable length dyadic morse english 4.22 1.3',
  src:'CH10 s.8–11', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The limits of compression'},
  {t:'title', text:'Code length'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figCodeLength,
      caption:'The source encoder maps each symbol to a codeword. For $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$ each code length (right bar) equals the information of its symbol (left bar).'}
  ], right:[
    {t:'eq', label:'Average length and efficiency', tex:'\\bar{L}=\\sum_{k=1}^{K}p_kl_k,\\qquad\\eta=\\frac{H(S)}{\\bar{L}}\\le1',
      note:'$l_k$ is the length of the codeword of $s_k$. Common symbols should get short codewords.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Source coding theorem', html:'Every uniquely decodable code has $\\bar{L}\\ge H(S)$. The entropy is the fewest bits a symbol that a lossless code reaches.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'English', html:'With its memory, English carries about $1.3$ bits a letter. A letter-by-letter code needs $4.22$, so $\\eta=1.3/4.22=0.31$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-coding', 'Codeword lengths $1,2,3,3$ for $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$.<div class="nsep"></div>What is $\\bar{L}$?',
        ['$1.75$','$2$','$2.25$'], 0, '$\\tfrac12(1)+\\tfrac14(2)+\\tfrac18(3)+\\tfrac18(3)=1.75=H$, so $\\eta=1$.')]}
  ]}
]},

{ id:'m6-typical', module:'M6', nav:'Typical sequences', title:'Typical sequences',
  objective:'See the probability of long sequences gather on about 2^{nH} typical ones.',
  keywords:'typical sequences typical set asymptotic equipartition binomial 2^{nH} surprise per symbol n grows 0.722 slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The limits of compression'},
  {t:'title', text:'Typical sequences'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'i', label:'$n$', min:0, max:5, step:1, v:3, show:v=>'$'+TS_N[v]+'$'}]},
      svg:figTypical,
      caption:'Every sequence of $n$ bits with $P(1)=0.2$, placed at its $-\\tfrac1n\\log_2P$. Drag $n$: the probability gathers in the band $H\\pm0.1$.'}
  ], right:[
    {t:'note', kind:'def', head:'Typical sequences', html:'A long sequence has about $np$ ones. Its probability is then close to $2^{-nH}$, so $-\\tfrac1n\\log_2P\\approx H$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The typical set', tex:'P(\\mathbf{x})\\approx2^{-nH},\\qquad|A|\\approx2^{nH}\\ \\text{of}\\ 2^{n}',
        note:'For large $n$ these sequences hold almost all the probability. The rest are rare.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Uniform source', html:'At $p=\\tfrac12$, $H=1$ and every sequence is typical. There is nothing to compress.'}]},
    {t:'reveal', at:3, items:[
      given('m6-typical', '$n=100$ bits with $P(1)=0.2$, so $H=0.722$.<div class="nsep"></div>About how many typical sequences are there?',
        ['$2^{20}$','$2^{72}$','$2^{100}$'], 1, '$2^{nH}=2^{100\\times0.722}=2^{72.2}$, a tiny fraction of $2^{100}$.')]}
  ]}
]},

{ id:'m6-source-thm', module:'M6', nav:'The source coding theorem', title:'The source coding theorem',
  objective:'Index the typical set with about nH bits and state the source coding theorem as a rate.',
  keywords:'source coding theorem typical set index nH bits rate R greater than H error probability 1024 sequences 175 frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The limits of compression'},
  {t:'title', text:'The source coding theorem'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$2^{10}$','typical','probability','index']}, svg:figSourceThm,
      caption:'All $1024$ sequences of ten bits with $P(1)=0.2$, in order of their number of ones. Step to the typical ones, their share of the probability and the index that names them.'}
  ], right:[
    {t:'note', kind:'def', head:'Index the typical set', html:'Give each typical sequence a number. About $nH$ bits name it, and the rare rest are allowed to fail.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · source coding theorem', tex:'R>H:\\ P_{\\text{error}}\\to0,\\qquad R<H:\\ P_{\\text{error}}\\not\\to0',
        note:'A code of $R$ bits a symbol can be made reliable when $R$ exceeds $H$, and never when $R$ falls below it.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Ten bits', html:'With $\\epsilon=0.1$ the $45$ typical sequences hold $30\\%$ of the probability and need $6$ bits. At $n=100$ they hold $83\\%$, and at $n=1000$, $99.99\\%$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-source-thm', 'A source with $H=0.5$ bit a symbol, in blocks of $n=1000$.<div class="nsep"></div>About how many bits index a block?',
        ['$500$','$1000$','$2^{500}$'], 0, '$nH=1000\\times0.5=500$ bits name the $2^{500}$ typical blocks.')]}
  ]}
]},

{ id:'m6-prefix', module:'M6', nav:'Prefix codes', title:'Prefix codes',
  objective:'Separate uniquely decodable codes from prefix codes and read both on a code tree.',
  keywords:'prefix code instantaneous uniquely decodable code tree leaf codes I II III decoding bit stream frames',
  src:'CH10 s.12–14', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The limits of compression'},
  {t:'title', text:'Prefix codes'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['Code I','Code II','Code III','decode']}, svg:figPrefix,
      caption:'Three codes for four symbols, drawn as trees. The last step reads the bits $\\mathtt{0101100111}$ with Codes II and III.'}
  ], right:[
    {t:'note', kind:'def', head:'Uniquely decodable', html:'Every bit string of the code comes from one symbol string only.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Prefix code', html:'No codeword starts another. The decoder names a symbol as soon as its last bit arrives, so the code is called instantaneous.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Three codes', html:'Code I fails: $\\mathtt{00}$ is $s_3$ or $s_1s_1$. Code II is a prefix code. Code III decodes, but only once the next $\\mathtt{0}$ arrives.'}]},
    {t:'reveal', at:3, items:[
      given('m6-prefix', 'Code III: $\\mathtt{0},\\mathtt{01},\\mathtt{011},\\mathtt{0111}$.<div class="nsep"></div>Is it instantaneous?',
        ['yes','no'], 1, 'After $\\mathtt{01}$ the decoder waits: a $\\mathtt{1}$ next means a longer word, a $\\mathtt{0}$ means $s_2$.')]}
  ]}
]},

{ id:'m6-kraft', module:'M6', nav:'The Kraft inequality', title:'The Kraft inequality',
  objective:'Test whether a set of codeword lengths allows a prefix code.',
  keywords:'kraft inequality codeword lengths unit interval dyadic intervals overlap prefix code necessary sufficient sums 1.5 1 0.9375 frames',
  src:'CH10 s.15–16', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The limits of compression'},
  {t:'title', text:'The Kraft inequality'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['Code I','Code II','Code III','$1,2,3,4$']}, svg:figKraft,
      caption:'Each codeword of length $l$ owns $2^{-l}$ of the unit interval. A prefix code has no overlaps. The bottom bar is the Kraft sum.'}
  ], right:[
    {t:'eq', label:'Kraft inequality', tex:'\\sum_{k=1}^{K}2^{-l_k}\\le1',
      note:'A prefix code with lengths $l_k$ exists exactly when the sum is at most one.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Three sums', html:'Code I: $1.5>1$, so no prefix code has its lengths. Code II: exactly $1$. Code III: $0.9375$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Lengths, not codewords', html:'Code III passes and is still not a prefix code. Its lengths allow one: $\\mathtt{0},\\mathtt{10},\\mathtt{110},\\mathtt{1110}$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-kraft', 'Lengths $1,2,2,3$ for four symbols.<div class="nsep"></div>Is a prefix code possible?',
        ['yes','no'], 1, '$\\tfrac12+\\tfrac14+\\tfrac14+\\tfrac18=1.125>1$.')]}
  ]}
]},

{ id:'m6-bound', module:'M6', nav:'The source-coding bound', title:'The source-coding bound',
  objective:'Bound the average length of a prefix code within one bit of the entropy, and within 1/n for blocks.',
  keywords:'source coding bound H less than L less than H+1 dyadic rounding blocks 1/n codebook K^n 59049 slider',
  src:'CH10 s.17–18', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The limits of compression'},
  {t:'title', text:'The source-coding bound'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'n', label:'$n$', min:1, max:10, step:1, v:10}]},
      svg:figBound,
      caption:'Bounds on the bits a symbol for blocks of $n$ symbols from $0.7,0.2,0.1$. Drag $n$: the gap of $1/n$ closes.'}
  ], right:[
    {t:'eq', result:true, label:'Key result · the source-coding bound', tex:'H(S)\\le\\bar{L}<H(S)+1',
      note:'Take $l_k=\\lceil-\\log_2p_k\\rceil$. The rounding adds less than one bit.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Dyadic case', html:'If every $p_k=2^{-l_k}$, no length is rounded and $\\bar{L}=H(S)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Blocks of n', tex:'nH(S)\\le L_n<nH(S)+1\\;\\Longrightarrow\\;H(S)\\le\\frac{L_n}{n}<H(S)+\\frac1n',
        note:'The rounding bit is spread over $n$ symbols. The codebook grows as $K^n$: $3^{10}=59\\,049$ words.'}]},
    {t:'reveal', at:3, items:[
      given('m6-bound', 'Blocks of $n=10$ symbols.<div class="nsep"></div>At most how far above $H(S)$ is $L_n/n$?',
        ['$0.01$ bit','$0.1$ bit','$1$ bit'], 1, '$1/n=1/10=0.1$ bit a symbol.')]}
  ]}
]},

{ id:'m6-rd', module:'M6', nav:'Rate and distortion', title:'Rate and distortion',
  objective:'Relate bits a sample to the least mean-square error of a Gaussian source, and compare the quantizers of Module 1.',
  keywords:'rate distortion lossy D(R) sigma^2 2^{-2R} gaussian source 6 dB per bit lloyd max quantizer gap slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The limits of compression'},
  {t:'title', text:'Rate and distortion'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'R', label:'$R$', min:0.5, max:4, step:0.1, v:1, show:v=>'$'+num(v,1)+'$'}]},
      svg:figRD,
      caption:'The least distortion of a Gaussian source at $R$ bits a sample (line) and the Lloyd–Max quantizers of Module 1 (dots). Drag $R$.'}
  ], right:[
    {t:'note', kind:'def', head:'Lossy coding', html:'When some error is allowed, fewer bits suffice. The rate–distortion function gives the fewest bits for a mean-square error $D$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Gaussian source', tex:'D(R)=\\sigma^{2}\\,2^{-2R}\\quad\\Longleftrightarrow\\quad R(D)=\\tfrac12\\log_2\\frac{\\sigma^{2}}{D}',
        note:'Each extra bit divides $D$ by four: $6.02$ dB a bit, the rule of Module 1.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Quantizers', html:'The Lloyd–Max quantizer of Module 1 sits $1.62$ dB above the line at $1$ bit and $2.74$ dB at $2$ bits. Coding blocks of samples closes the gap.'}]},
    {t:'reveal', at:3, items:[
      given('m6-rd', 'A Gaussian source coded at $R$ bits a sample.<div class="nsep"></div>One more bit changes $D$ by',
        ['$\\div2$, $3$ dB','$\\div4$, $6.02$ dB','$\\div8$, $9$ dB'], 1, '$2^{-2(R+1)}=2^{-2R}/4$, and $10\\log_{10}4=6.02$ dB.')]}
  ]}
]},

REAL_CODES,

labScene('m6-lab-typical', 'TS', 'Typical sequences', 'The limits of compression',
  'Draw sequences from a binary source and watch the probability gather on the typical set.',
  'laboratory typical sequences typical set binomial surprise band epsilon sample sequences n grows interactive',
  'Choose $p$, $n$ and the band, then draw sequences. Watch the probability gather on the typical set as $n$ grows.'),

codeScene('m6-code-bound', 'Limits of compression', 'The limits of compression in code',
  'Compute Kraft sums, the typical set, the block-coding bound and the distortion of a Gaussian source.',
  'code matlab python program run kraft sum typical set binomial block bound rate distortion lloyd'),

/* ---------------------------------------------------------------- 6.3 ---- */
{ id:'m6-huffman', module:'M6', nav:'Huffman coding', title:'Huffman coding',
  objective:'Build a Huffman code by repeated merges and find its average length and efficiency.',
  keywords:'huffman coding algorithm merge two smallest sort table codewords average length 2.2 efficiency 0.9645 optimal frames',
  src:'CH10 s.19–20', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Huffman and Lempel–Ziv coding'},
  {t:'title', text:'Huffman coding'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['list','merge 1','merge 2','merge 3','codewords']}, svg:figHuffman,
      caption:'The five probabilities, sorted. Each press merges the two smallest into one entry of the next column and sorts again. The last step reads each codeword back.'}
  ], right:[
    {t:'note', kind:'def', head:'Huffman algorithm', html:'<ol class="steps"><li>Sort the probabilities.</li><li>Merge the two smallest, labelled $0$ and $1$, and sort again.</li><li>At one entry, read each codeword from the last merge back.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Codewords', tex:'\\mathtt{00},\\ \\mathtt{10},\\ \\mathtt{11},\\ \\mathtt{010},\\ \\mathtt{011}',
        note:'The two most likely symbols get two bits, the two least likely three.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · Huffman code', tex:'\\eta=\\frac{H(S)}{\\bar{L}}=\\frac{2.1219}{2.2}=0.9645',
        note:'No prefix code for single symbols has a smaller average length.'}]},
    {t:'reveal', at:3, items:[
      given('m6-huffman', '$p=0.4,0.2,0.2,0.1,0.1$ with lengths $2,2,2,3,3$.<div class="nsep"></div>What is $\\bar{L}$?',
        ['$2.1219$','$2.2$','$3$'], 1, '$0.8+0.4+0.4+0.3+0.3=2.2$ bits, above $H=2.1219$.')]}
  ]}
]},

{ id:'m6-huffman-var', module:'M6', nav:'Ties and variance', title:'Ties and variance',
  objective:'Show that ties give Huffman codes of equal average length and different variance.',
  keywords:'huffman ties merged placed high low variance codeword length buffer minimum variance 0.16 1.36 frames',
  src:'CH10 s.21–22', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Huffman and Lempel–Ziv coding'},
  {t:'title', text:'Ties and variance'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['high','low','compare']}, svg:figHuffVar,
      caption:'Ties broken high, then low. Below: the codeword lengths of each code against $\\bar{L}=2.2$.'}
  ], right:[
    {t:'note', kind:'def', head:'Ties', html:'When a merged entry ties with others, it may go above them or below. Both choices give a Huffman code.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Same average', tex:'\\begin{aligned}\\text{high: }&2,2,2,3,3\\;\\Rightarrow\\;\\bar{L}=2.2\\\\\\text{low: }&1,2,3,4,4\\;\\Rightarrow\\;\\bar{L}=2.2\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Variance', tex:'\\sigma^{2}=\\sum_kp_k\\bigl(l_k-\\bar{L}\\bigr)^{2}:\\quad0.16\\ \\text{against}\\ 1.36',
        note:'Placing the merged entry high gives the least variance.'}]},
    {t:'reveal', at:3, items:[
      given('m6-huffman-var', 'A transmitter with a small buffer.<div class="nsep"></div>Which Huffman code suits it?',
        ['$\\sigma^2=0.16$','$\\sigma^2=1.36$','either'], 0, 'Lengths near $\\bar{L}$ keep the bit rate steady, so the buffer fills and empties less.')]}
  ]}
]},

{ id:'m6-huffman-ext', module:'M6', nav:'Coding pairs', title:'Huffman codes for pairs of symbols',
  objective:'Code pairs and triples of symbols and compare the bits a symbol with the entropy.',
  keywords:'huffman pairs triples extension blocks 1.3 1.165 1.1753 efficiency 0.890 0.993 0.984 bound H+1/n frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Huffman and Lempel–Ziv coding'},
  {t:'title', text:'Huffman codes for pairs of symbols'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$n=1$','$n=2$','$n=3$']}, svg:figHuffExt,
      caption:'Huffman codes for single symbols, pairs and triples of $0.7,0.2,0.1$. Top: the bound $H+1/n$ (rings) and the code (dots). Bottom: the code, enlarged.'}
  ], right:[
    {t:'note', kind:'def', head:'Code blocks', html:'Build a Huffman code for the $K^n$ blocks of $n$ symbols. Divide its average length by $n$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Three block lengths', tex:'\\frac{\\bar{L}_n}{n}=1.3,\\ 1.165,\\ 1.1753\\quad\\text{for}\\ n=1,2,3',
        note:'Against $H=1.157$: efficiency $0.8898$, $0.9929$ and $0.9842$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'Expect the bound $H+1/n$ to fall, not every block code. Triples give $1.1753$, worse than pairs.'}]},
    {t:'reveal', at:3, items:[
      given('m6-huffman-ext', 'Huffman on pairs of $0.7,0.2,0.1$ gives $\\bar{L}_2=2.33$ bits a pair.<div class="nsep"></div>How many bits a symbol?',
        ['$1.157$','$1.165$','$2.33$'], 1, '$2.33/2=1.165$, against $1.3$ for single symbols.')]}
  ]}
]},

{ id:'m6-arith', module:'M6', nav:'Arithmetic coding', title:'Arithmetic coding',
  objective:'Code a message as a subinterval of [0,1) and name it with about -log2 of its width bits.',
  keywords:'arithmetic coding interval subdivision width product of probabilities tag binary fraction 0.098 3.35 bits 5 bits frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Huffman and Lempel–Ziv coding'},
  {t:'title', text:'Arithmetic coding'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$[0,1)$','$s_1$','$s_1s_1$','$s_1s_1s_2$','tag']}, svg:figArith,
      caption:'Arithmetic coding of $s_1s_1s_2$ with $0.7,0.2,0.1$. Each symbol keeps its share of the current interval. The last step names the final interval with a binary fraction.'}
  ], right:[
    {t:'note', kind:'def', head:'Interval', html:'Start with $[0,1)$. Each symbol keeps the part of the interval that its probability owns.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Width', tex:'w=\\prod_ip(s_i)=0.7\\times0.7\\times0.2=0.098',
        note:'The width is the probability of the whole message.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Tag', tex:'l=\\lceil-\\log_2w\\rceil+1=\\lceil3.35\\rceil+1=5\\ \\text{bits}',
        note:'A binary fraction of $l$ bits inside the interval names it: $0.\\mathtt{01100}_2=0.375$. The extra bit is paid once a message.'}]},
    {t:'reveal', at:3, items:[
      given('m6-arith', 'The interval width halves.<div class="nsep"></div>How does the tag length change?',
        ['one more bit','twice the bits','no change'], 0, '$-\\log_2(w/2)=-\\log_2w+1$.')]}
  ]}
]},

{ id:'m6-lz', module:'M6', nav:'Lempel–Ziv coding', title:'Lempel–Ziv coding',
  objective:'Parse a bit stream into new phrases and send each as a pointer and one bit.',
  keywords:'lempel ziv lz78 parsing phrases dictionary tree pointer innovation bit universal short stream 18 bits frames',
  src:'CH10 w.12', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Huffman and Lempel–Ziv coding'},
  {t:'title', text:'Lempel–Ziv coding'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['start','1','2','3','4','5','6','7','8']}, svg:figLZ,
      caption:'An $18$-bit stream parsed into phrases, one a press. Each new phrase is an earlier phrase plus one bit, so the dictionary grows as a tree.'}
  ], right:[
    {t:'note', kind:'def', head:'Lempel–Ziv parsing', html:'Read the stream. Cut off the shortest string not yet in the dictionary, and add it as a new entry.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Phrase code', tex:'(\\text{pointer},\\ \\text{new bit}):\\quad\\mathtt{010}\\to(4,\\mathtt{0})',
        note:'The pointer names the earlier phrase. The decoder builds the same dictionary.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Short streams', html:'With a $3$-bit pointer and one new bit, eight phrases take $32$ bits for $18$. A pointer of $\\lceil\\log_2i\\rceil$ bits for phrase $i$ takes $25$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-lz', 'The dictionary holds $\\mathtt{0},\\mathtt{00},\\mathtt{1},\\mathtt{01},\\mathtt{11},\\mathtt{001},\\mathtt{010}$. The stream goes on $\\mathtt{0101}\\ldots$<div class="nsep"></div>What is the next phrase?',
        ['$(7,\\mathtt{1})$','$(4,\\mathtt{1})$','$(7,\\mathtt{0})$'], 0, '$\\mathtt{010}$ is entry $7$, and $\\mathtt{0101}$ is new.')]}
  ]}
]},

{ id:'m6-lz-long', module:'M6', nav:'Lempel–Ziv on a long stream', title:'Lempel–Ziv on a long stream',
  objective:'Watch the cost of Lempel–Ziv fall toward the entropy as the stream grows.',
  keywords:'lempel ziv long stream universal cost per source bit entropy 0.469 seeded source 10^6 bits 0.689 0.557 slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Huffman and Lempel–Ziv coding'},
  {t:'title', text:'Lempel–Ziv on a long stream'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'e', label:'$\\log_{10}n$', min:2, max:6, step:0.1, v:3, show:v=>'$'+num(v,1)+'$'}]},
      svg:figLZLong,
      caption:'Lempel–Ziv on one random stream from a binary source with $P(1)=0.1$: the bits sent a source bit, against $H_b(0.1)$. Drag $n$.'}
  ], right:[
    {t:'note', kind:'def', head:'Universal code', html:'Lempel–Ziv is told nothing about the source. It learns the frequent strings from the stream itself.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Cost', tex:'L=\\sum_{i=1}^{c}\\bigl(\\lceil\\log_2i\\rceil+1\\bigr)\\ \\text{bits for}\\ c\\ \\text{phrases}',
        note:'$0.689$ bits a source bit at $n=10^3$ and $0.557$ at $n=10^6$, against $H=0.469$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Slow approach', html:'The cost falls toward $H$ only as the phrases grow long. Any single-symbol code costs $1$ bit here.'}]},
    {t:'reveal', at:3, items:[
      given('m6-lz-long', 'The stream grows from $10^3$ to $10^6$ bits.<div class="nsep"></div>The Lempel–Ziv cost a source bit',
        ['rises','falls toward $H$','falls below $H$'], 1, 'Longer phrases carry more bits a pointer, and no lossless code beats $H$.')]}
  ]}
]},

REAL_COMPRESS,

labScene('m6-lab-j', 'J', 'Huffman code construction', 'Huffman and Lempel–Ziv coding',
  'Run the Huffman algorithm one merge at a time and read off what it costs.',
  'laboratory huffman merge step tree tie rule variance pairs average length efficiency interactive',
  'Set the probabilities and step through the merges. Switch the tie rule, or code pairs, and compare $\\bar{L}$ with $H$.'),

codeScene('m6-code-huffman', 'Huffman and Lempel–Ziv', 'Huffman and Lempel–Ziv in code',
  'Build Huffman codes by repeated merges, for single symbols and pairs, and parse a stream with LZ78.',
  'code matlab python program run huffman merge tie variance pairs lempel ziv lz78 parse'),

/* ---------------------------------------------------------------- 6.4 ---- */
{ id:'m6-dmc', module:'M6', nav:'The discrete channel', title:'The discrete memoryless channel',
  objective:'Describe a discrete memoryless channel by its transition probabilities.',
  keywords:'discrete memoryless channel dmc transition probabilities channel matrix rows sum to one diagram inputs outputs',
  src:'CH10 s.23–24', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channels and mutual information'},
  {t:'title', text:'The discrete memoryless channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figDMC,
      caption:'A binary channel as a diagram. Each input has a line to each output it can reach, labelled with the probability of that move.'}
  ], right:[
    {t:'note', kind:'def', head:'The channel', html:'An input symbol $x_j$ goes in and an output $y_k$ comes out, with probability $p(y_k\\mid x_j)$. Memoryless: each use ignores the others.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Channel matrix', tex:'\\mathbf{P}=\\begin{bmatrix}p(y_0\\mid x_0)&p(y_1\\mid x_0)\\\\p(y_0\\mid x_1)&p(y_1\\mid x_1)\\end{bmatrix}=\\begin{bmatrix}0.8&0.2\\\\0.3&0.7\\end{bmatrix}'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Rows', html:'Each row is the output distribution of one input, so it sums to one. The columns need not.'}]},
    {t:'reveal', at:3, items:[
      given('m6-dmc', 'The matrix above.<div class="nsep"></div>Which always sum to one?',
        ['the rows','the columns','both'], 0, 'Row $j$ lists where $x_j$ can go: $0.8+0.2=0.3+0.7=1$. The columns give $1.1$ and $0.9$.')]}
  ]}
]},

{ id:'m6-inputdist', module:'M6', nav:'Input and output distributions', title:'Input and output distributions',
  objective:'Find the joint and output distributions of a channel from its input distribution.',
  keywords:'input distribution output distribution joint probability total probability channel matrix p(y) slider',
  src:'CH10 s.25', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channels and mutual information'},
  {t:'title', text:'Input and output distributions'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'q', label:'$p(x_0)$', min:0, max:1, step:0.01, v:0.75, show:v=>'$'+num(v,2)+'$'}]},
      svg:figInputDist,
      caption:'The four joint probabilities of the channel $0.8/0.2$, $0.3/0.7$, drawn to width, and the output distribution they add to. Drag $p(x_0)$.'},
    {t:'legend', items:[['h','kept'],['err','moved'],['out','$p(y)$']], at:'tr'}
  ], right:[
    {t:'eq', label:'Joint', tex:'p(x_j,y_k)=p(y_k\\mid x_j)\\,p(x_j)',
      note:'The channel sets $p(y\\mid x)$. The transmitter sets $p(x)$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Output', tex:'p(y_k)=\\sum_jp(y_k\\mid x_j)\\,p(x_j)',
        note:'Add the joint blocks that end at $y_k$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Two sources', html:'At $p(x_0)=0.75$, $y_0$ comes from $x_0$ with probability $0.6$ and from $x_1$ with $0.075$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-inputdist', '$p(x_0)=0.75$ into the channel $0.8/0.2$, $0.3/0.7$.<div class="nsep"></div>What is $p(y_0)$?',
        ['$0.600$','$0.675$','$0.800$'], 1, '$0.8\\times0.75+0.3\\times0.25=0.6+0.075=0.675$.')]}
  ]}
]},

{ id:'m6-bsc', module:'M6', nav:'The binary symmetric channel', title:'The binary symmetric channel',
  objective:'Read hard-decision BPSK as a binary symmetric channel with crossover p = Q(√(2Eb/N0)).',
  keywords:'binary symmetric channel bsc crossover probability hard decision bpsk Q function Eb/N0 modules 4 and 5 slider',
  src:'CH10 s.26', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channels and mutual information'},
  {t:'title', text:'The binary symmetric channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'g', label:'$E_b/N_0$', min:0, max:10, step:0.1, v:4, show:v=>'$'+num(v,1)+'$ dB'}]},
      svg:figBSC,
      caption:'Top: the binary symmetric channel. Bottom: its crossover when BPSK is decided bit by bit. Drag $E_b/N_0$.'}
  ], right:[
    {t:'note', kind:'def', head:'BSC', html:'Each bit arrives flipped with probability $p$ and intact with $1-p$, whatever its value.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'From BPSK', tex:'p=Q\\Bigl(\\sqrt{2E_b/N_0}\\Bigr)',
        note:'The matched-filter receiver of Module 4 decides each BPSK bit of Module 5. What it hands on is a BSC.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Hard decisions', html:'Deciding each bit throws away how sure the receiver was. Later slides count what that costs.'}]},
    {t:'reveal', at:3, items:[
      given('m6-bsc', 'BPSK at $E_b/N_0=4$ dB, decided bit by bit.<div class="nsep"></div>What is the crossover $p$?',
        ['$0.0024$','$0.0125$','$0.0786$'], 1, '$4$ dB is $2.512$, and $Q\\bigl(\\sqrt{5.024}\\bigr)=Q(2.241)=0.0125$.')]}
  ]}
]},

{ id:'m6-joint', module:'M6', nav:'Joint entropy', title:'Joint entropy and the chain rule',
  objective:'Define the joint entropy of two variables and split it with the chain rule.',
  keywords:'joint entropy chain rule H(X,Y) H(X) H(Y|X) joint pmf 0.4 0.1 1.7219 0.7219 frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channels and mutual information'},
  {t:'title', text:'Joint entropy and the chain rule'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$H(X,Y)$','$H(X)$','$H(Y\\mid X)$']}, svg:figJoint,
      caption:'A joint pmf as tiles, and its joint entropy as a bar. Step through: $H(X)$ fills part of the bar, and $H(Y\\mid X)$ fills the rest.'}
  ], right:[
    {t:'eq', label:'Joint entropy', tex:'H(X,Y)=-\\sum_{j,k}p(x_j,y_k)\\log_2p(x_j,y_k)',
      note:'The entropy of the pair, treated as one symbol. Here $H(X,Y)=1.7219$ bits.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · chain rule', tex:'H(X,Y)=H(X)+H(Y\\mid X)=H(Y)+H(X\\mid Y)',
        note:'Learn $X$ first, then what is left of $Y$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'This pmf', html:'$H(X)=1$ and, given either $x$, $Y$ agrees with probability $0.8$: $H(Y\\mid X)=H_b(0.2)=0.7219$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-joint', '$H(X,Y)=1.7219$ and $H(X)=1$.<div class="nsep"></div>What is $H(Y\\mid X)$?',
        ['$0.278$','$0.722$','$1.722$'], 1, '$1.7219-1=0.7219$ bit, by the chain rule.')]}
  ]}
]},

{ id:'m6-condent', module:'M6', nav:'Conditional entropy', title:'Conditional entropy',
  objective:'Measure the uncertainty about the input that remains after the output is seen.',
  keywords:'conditional entropy equivocation H(X|Y) H(Y|X) posterior average over outputs frames',
  src:'CH10 s.27', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channels and mutual information'},
  {t:'title', text:'Conditional entropy'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$H(X)$','$y_0$','$y_1$','average','$H(Y\\mid X)$']}, svg:figCondEnt,
      caption:'The channel $0.8/0.2$, $0.3/0.7$ with $p(x_0)=0.75$. The uncertainty about $X$ after each output, their average, and the other conditional entropy.'}
  ], right:[
    {t:'eq', label:'Conditional entropy', tex:'H(X\\mid Y)=\\sum_kp(y_k)\\,H(X\\mid Y=y_k)',
      note:'The uncertainty about the input left after the output, averaged over the outputs.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'This channel', html:'After $y_0$, $x_0$ has probability $0.889$ and $H=0.503$. After $y_1$, $0.462$ and $H=0.996$. Weighted by $0.675$ and $0.325$: $H(X\\mid Y)=0.663$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'$H(X\\mid Y)$ and $H(Y\\mid X)$ differ. Here $H(Y\\mid X)=0.75H_b(0.2)+0.25H_b(0.3)=0.762$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-condent', 'A BSC with $p=0.1$ and equally likely inputs.<div class="nsep"></div>What is $H(X\\mid Y)$?',
        ['$0.1$','$0.469$','$0.531$'], 1, 'Either output leaves $x$ wrong with probability $0.1$: $H_b(0.1)=0.469$.')]}
  ]}
]},

{ id:'m6-mutual', module:'M6', nav:'Mutual information', title:'Mutual information',
  objective:'Define mutual information as the uncertainty about the input that the output removes.',
  keywords:'mutual information I(X;Y) H(X)-H(X|Y) information bar bsc 1-H_b(p) slider',
  src:'CH10 s.28', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channels and mutual information'},
  {t:'title', text:'Mutual information'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'p', label:'$p$', min:0, max:0.5, step:0.01, v:0.1, show:v=>'$'+num(v,2)+'$'}]},
      svg:figMutual,
      caption:'A BSC with equal inputs. The bar is $H(X,Y)$, the line above it $H(X)$ and the line below it $H(Y)$. Their overlap is $I(X;Y)$. Drag $p$.'},
    {t:'legend', items:[['err','$H(X\\mid Y)$'],['out','$I(X;Y)$'],['h','$H(Y\\mid X)$']], at:'tr'}
  ], right:[
    {t:'eq', label:'Mutual information', tex:'I(X;Y)=H(X)-H(X\\mid Y)',
      note:'The uncertainty about $X$ before the output, less what remains after it.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'BSC, equal inputs', tex:'I(X;Y)=1-H_b(p)'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Two ends', html:'At $p=0$ the full bit gets through. At $p=\\tfrac12$ the output is a coin flip, and $I=0$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-mutual', 'A BSC with $p=0.1$ and equal inputs.<div class="nsep"></div>What is $I(X;Y)$?',
        ['$0.1$','$0.469$','$0.531$'], 2, '$1-H_b(0.1)=1-0.469=0.531$ bit a use.')]}
  ]}
]},

{ id:'m6-mutual-props', module:'M6', nav:'Properties', title:'Properties of mutual information',
  objective:'State the symmetry and non-negativity of mutual information and its link to the joint entropy.',
  keywords:'mutual information properties symmetric non-negative H(X)+H(Y)-H(X,Y) independent zero bayes',
  src:'CH10 s.29', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channels and mutual information'},
  {t:'title', text:'Properties of mutual information'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figMutualProps,
      caption:'The bars for a BSC with $p=0.25$ and equal inputs. The shared middle is the same whether it is read from $X$ or from $Y$.'},
    {t:'legend', items:[['err','$H(X\\mid Y)$'],['out','$I(X;Y)$'],['h','$H(Y\\mid X)$']], at:'tr'}
  ], right:[
    {t:'eq', label:'Symmetry', tex:'I(X;Y)=H(X)-H(X\\mid Y)=H(Y)-H(Y\\mid X)=I(Y;X)',
      note:'It follows from Bayes: $p(x,y)$ is the same read either way.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Joint entropy', tex:'I(X;Y)=H(X)+H(Y)-H(X,Y)\\ge0',
        note:'Here $1+1-1.811=0.189$ bit.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Never negative', html:'Seeing $Y$ never adds to the uncertainty about $X$ on average: $H(X\\mid Y)\\le H(X)$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-mutual-props', '$X$ and $Y$ are independent.<div class="nsep"></div>What is $I(X;Y)$?',
        ['$0$','$H(X)$','$H(X)+H(Y)$'], 0, 'Then $H(X\\mid Y)=H(X)$, and nothing is shared.')]}
  ]}
]},

REAL_INFO,

labScene('m6-lab-mi', 'MI', 'Mutual information of a channel', 'Channels and mutual information',
  'Set a channel matrix and an input distribution and watch the information bars respond.',
  'laboratory mutual information channel matrix input distribution entropy bars joint conditional interactive',
  'Choose a channel and its input distribution. Watch $H(X)$, $H(X\\mid Y)$ and $I(X;Y)$ change as the bars.'),

codeScene('m6-code-channel', 'Channels', 'Channels in code',
  'Compute the output distribution, the entropies and the mutual information of a discrete channel.',
  'code matlab python program run channel matrix joint output distribution conditional entropy mutual information bsc'),

/* ---------------------------------------------------------------- 6.5 ---- */
{ id:'m6-capacity', module:'M6', nav:'Channel capacity', title:'Channel capacity',
  objective:'Define capacity as the mutual information maximised over the input distribution.',
  keywords:'channel capacity maximum mutual information input distribution bsc z-channel peak bits per use slider',
  src:'CH10 s.30', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Channel capacity'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'q', label:'$q$', min:0.01, max:0.99, step:0.01, v:0.5, show:v=>'$'+num(v,2)+'$'}]},
      svg:figCapacity,
      caption:'Mutual information against the input distribution, for a BSC with $p=0.1$ (solid) and the Z-channel (dashed). The ring on each peak is its capacity. Drag $q$.'}
  ], right:[
    {t:'eq', result:true, label:'Key result · capacity', tex:'C=\\max_{p(x)}I(X;Y)\\ \\ \\text{bits per use}',
      note:'The channel fixes $p(y\\mid x)$. The transmitter picks the input distribution that lets the most through.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Two peaks', html:'The BSC peaks at $q=\\tfrac12$ with $C=0.531$. The Z-channel peaks at $q=0.6$ with $C=0.322$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'A property of the channel', html:'$I(X;Y)$ depends on the input. $C$ does not: the maximum has removed it.'}]},
    {t:'reveal', at:3, items:[
      given('m6-capacity', 'A BSC, symmetric in its two inputs.<div class="nsep"></div>Where does $I(X;Y)$ peak?',
        ['$q=0.1$','$q=\\tfrac12$','$q=1$'], 1, 'The symmetry makes the curve symmetric about $q=\\tfrac12$, and its peak sits there.')]}
  ]}
]},

{ id:'m6-bsc-cap', module:'M6', nav:'Capacity of the BSC', title:'Capacity of the binary symmetric channel',
  objective:'Derive C = 1 - H_b(p) for the binary symmetric channel and draw it.',
  keywords:'bsc capacity 1-H_b(p) derivation sketch draw p=0.5 zero p=0.11 half bit',
  src:'CH10 s.31', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Capacity of the binary symmetric channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Draw $C(p)$'}, svg:figBSCcap,
      caption:'Draw the capacity of the BSC against $p$ over the faint $H_b(p)$, then reveal it.'}
  ], right:[
    {t:'eq', label:'Derivation', tex:'\\begin{aligned}I(X;Y)&=H(Y)-H(Y\\mid X)\\\\&=H(Y)-H_b(p)\\le1-H_b(p)\\end{aligned}',
      note:'$H(Y\\mid X)=H_b(p)$ whatever the input. Equal inputs make $H(Y)=1$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · BSC capacity', tex:'C=1-H_b(p)'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Worst case', html:'$C=0$ at $p=\\tfrac12$. At $p=1$ every bit flips, the receiver flips it back, and $C=1$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-bsc-cap', 'A BSC with $p=0.11$.<div class="nsep"></div>What is $C$?',
        ['$0.11$','$0.5$','$0.89$'], 1, '$H_b(0.11)=0.500$, so $C=0.500$ bit a use.')]}
  ]}
]},

{ id:'m6-bec', module:'M6', nav:'The erasure channel', title:'The binary erasure channel',
  objective:'Find the capacity of a channel that flags its losses and compare it with the BSC.',
  keywords:'binary erasure channel bec erasure flagged capacity 1-epsilon against bsc 1-H(epsilon) slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'The binary erasure channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'e', label:'$\\epsilon$', min:0, max:0.45, step:0.01, v:0.1, show:v=>'$'+num(v,2)+'$'}]},
      svg:figBEC,
      caption:'Top: the binary erasure channel, where a lost bit arrives as $e$. Bottom: its capacity (solid) against the BSC with $p=\\epsilon$ (dashed). Drag $\\epsilon$.'}
  ], right:[
    {t:'note', kind:'def', head:'Erasure', html:'Each bit arrives intact with probability $1-\\epsilon$, or as a flagged $e$. It is never flipped.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · BEC capacity', tex:'C=1-\\epsilon',
        note:'The bits that arrive are certain. Only the erased fraction is lost.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Flagged against hidden', html:'The BSC hides its errors among good bits, so it loses $H_b(\\epsilon)>\\epsilon$ for $\\epsilon<\\tfrac12$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-bec', '$\\epsilon=0.1$ on a BEC and $p=0.1$ on a BSC.<div class="nsep"></div>Which capacities?',
        ['$0.9$ and $0.531$','$0.531$ and $0.9$','$0.9$ and $0.9$'], 0, 'BEC: $1-0.1=0.9$. BSC: $1-H_b(0.1)=0.531$.')]}
  ]}
]},

{ id:'m6-ex-zchannel', module:'M6', nav:'Worked example · the Z-channel', title:'Worked example: the Z-channel',
  objective:'Find the capacity of the Z-channel by maximising its mutual information over the input distribution.',
  keywords:'worked example z-channel asymmetric capacity optimum input 0.6 log2(5/4) 0.3219 0.3113',
  src:'CH10 s.32', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Worked example'},
  {t:'title', text:'Worked example: the Z-channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figZ,
      caption:'Top: a $0$ always arrives, and a $1$ turns into $0$ half the time. Bottom: $I(X;Y)$ against $q$, with its peak and the value at $q=\\tfrac12$ (grey).'}
  ], right:[
    given('m6-ex-zchannel', 'A $0$ is always received as $0$. A $1$ is received as $0$ or $1$ with probability $\\tfrac12$ each. Let $q=P(X=0)$.<div class="nsep"></div>Find $C$. What is $H(Y\\mid X)$?',
      ['$1-q$','$q$','$1$'], 0, 'Only $X=1$ is uncertain, with $H_b(\\tfrac12)=1$ bit, so $H(Y\\mid X)=1-q$.'),
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'I(q)=H_b\\bigl(\\tfrac{1-q}{2}\\bigr)-(1-q)',
        note:'$P(Y=1)=(1-q)/2$. Set $\\mathrm{d}I/\\mathrm{d}q=0$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'q^{*}=0.6,\\qquad C=H_b(0.2)-0.4=\\log_2\\tfrac54=0.3219'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Equal inputs give $0.3113$, not $C$. On an asymmetric channel the best input is not uniform.'}]}
  ]}
]},

{ id:'m6-ex-symmetric', module:'M6', nav:'Worked example · a symmetric channel', title:'Worked example: a symmetric three-output channel',
  objective:'Find the capacity of a symmetric channel from one row of its matrix.',
  keywords:'worked example symmetric channel three inputs three outputs cyclic rows uniform input log2 3 capacity 0.214 uses per bit',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Worked example'},
  {t:'title', text:'Worked example: a symmetric three-output channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSym,
      caption:'The channel matrix as tiles. Each row is a shift of $0.6,0.2,0.2$. Equal inputs give equal outputs, shown in the bottom row.'}
  ], right:[
    given('m6-ex-symmetric', 'Three inputs, three outputs. Each row of the matrix is a shift of $0.6,0.2,0.2$.<div class="nsep"></div>Find $C$. Which input reaches it?',
      ['$x_0$ always','uniform','$0.6,0.2,0.2$'], 1, 'The rows are shifts of one another. Inputs of $\\tfrac13$ each make the outputs equal and $H(Y)$ as large as it can be.'),
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'C=\\log_2K-H(\\text{row})',
        note:'$H(Y\\mid X)$ is the entropy of one row for every input. The uniform output gives $H(Y)=\\log_2K$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'C=\\log_23-H(0.6,0.2,0.2)=1.585-1.371=0.2140',
        note:'At least $1/0.214=4.67$ uses to carry one bit.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'$\\log_23$ is the most any three-output channel carries, not its capacity. Subtract the row entropy.'}]}
  ]}
]},

{ id:'m6-why-capacity', module:'M6', nav:'Reliable over a noisy channel', title:'Reliable transmission over a noisy channel',
  objective:'Count the codewords that a noisy channel keeps apart, first for one use and then for long blocks.',
  keywords:'why capacity non-confusable inputs noisy typewriter extension bsc 2^{nH(p)} 2^{n(1-H(p))} sphere counting frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Reliable transmission over a noisy channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['overlap','two inputs','long blocks','count']}, svg:figWhyCap,
      caption:'A four-input channel whose outputs overlap, then the same count for long blocks of a BSC. Each codeword owns a cloud of likely outputs.'}
  ], right:[
    {t:'note', kind:'def', head:'One use', html:'Each input reaches two outputs. Using only $x_0$ and $x_2$, no output can come from both: one bit a use with no errors.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Long blocks', html:'A word of $n$ bits through a BSC lands, almost surely, among about $2^{nH_b(p)}$ likely outputs.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Count', tex:'M\\approx\\frac{2^{n}}{2^{nH_b(p)}}=2^{n(1-H_b(p))}=2^{nC}',
        note:'Codewords whose clouds do not overlap can be told apart.'}]},
    {t:'reveal', at:3, items:[
      given('m6-why-capacity', 'Blocks of $n=100$ bits over a BSC with $p=0.11$.<div class="nsep"></div>About how many codewords fit?',
        ['$2^{11}$','$2^{50}$','$2^{100}$'], 1, '$C=1-H_b(0.11)=0.5$, so $2^{100\\times0.5}=2^{50}$.')]}
  ]}
]},

{ id:'m6-repetition', module:'M6', nav:'Repetition codes', title:'Repetition codes',
  objective:'Lower the error of a binary symmetric channel by repetition and see what it costs in rate.',
  keywords:'repetition code majority vote bsc p=0.1 rate 1/n error probability 0.028 capacity 0.531 slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Repetition codes'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'n', label:'$n$', min:1, max:15, step:2, v:3}]},
      svg:figRepetition,
      caption:'Repetition codes on a BSC with $p=0.1$: the error after a majority vote against the rate $1/n$. The green band marks the rates below $C$. Drag $n$.'}
  ], right:[
    {t:'note', kind:'def', head:'Repeat and vote', html:'Send each bit $n$ times, $n$ odd, and decide by majority. The vote fails when more than half the copies flip.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Error', tex:'P_e=\\sum_{k>n/2}\\binom{n}{k}p^{k}(1-p)^{n-k}',
        note:'$0.1$, $0.028$, $0.0086$ for $n=1,3,5$, and $3.36\\times10^{-5}$ at $n=15$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Rate falls too', html:'The error goes to zero only as the rate $1/n$ does. The theorem promises far better: any rate below $C=0.531$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-repetition', 'Three copies over a BSC with $p=0.1$.<div class="nsep"></div>What is $P_e$?',
        ['$0.001$','$0.028$','$0.1$'], 1, '$3p^{2}(1-p)+p^{3}=0.027+0.001=0.028$.')]}
  ]}
]},

{ id:'m6-coding-thm', module:'M6', nav:'The channel coding theorem', title:'The channel coding theorem',
  objective:'State the channel coding theorem: reliable transmission is possible exactly at rates below capacity.',
  keywords:'channel coding theorem shannon rate below capacity reliable impossible converse bsc regions repetition points',
  src:'CH10 s.33–34', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'The channel coding theorem'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figCodingThm,
      caption:'Over a BSC: rates below $C(p)=1-H_b(p)$ can be made reliable, and rates above it cannot. The violet dots are the repetition codes at $p=0.1$.'}
  ], right:[
    {t:'eq', result:true, label:'Key result · channel coding theorem', tex:'R<C:\\ P_e\\to0\\ \\text{is possible},\\qquad R>C:\\ \\text{it is not}',
      note:'$R$ is in bits a channel use. The codes need long blocks.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The promise', html:'Codes exist with rate close to $C$ and error as small as asked. The theorem does not build them.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Repetition', html:'The repetition points sit far below the curve. Their rate falls with their error, which the theorem says is unnecessary.'}]},
    {t:'reveal', at:3, items:[
      given('m6-coding-thm', 'A code of rate $R=0.5$ over a BSC.<div class="nsep"></div>Reliable transmission needs',
        ['$p<0.11$','$p<0.25$','$p<0.5$'], 0, '$1-H_b(p)>0.5$ holds for $p<0.11$, where $H_b=0.5$.')]}
  ]}
]},

{ id:'m6-codes-glimpse', module:'M6', nav:'A glimpse of codes', title:'A glimpse of codes: the Hamming code',
  objective:'See a single parity check and the (7,4) Hamming code correct one error by its syndrome.',
  keywords:'parity check hamming code 7 4 codewords minimum distance 3 corrects one error syndrome circles frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'A glimpse of codes: the Hamming code'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['codewords','encode','error','syndrome','correct']}, svg:figHamming,
      caption:'The $16$ codewords of the $(7,4)$ Hamming code, then one of them in three parity circles. A bit flips, the circles that fail name it, and it is flipped back.'}
  ], right:[
    {t:'note', kind:'def', head:'Parity check', html:'One parity bit makes the number of ones even. A single error is detected but not located.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Hamming (7,4)', html:'Four data bits and three parity bits, each parity bit keeping one circle even. Rate $4/7$. Any two codewords differ in at least $d_{\\min}=3$ places.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Correction', tex:'t=\\Bigl\\lfloor\\frac{d_{\\min}-1}{2}\\Bigr\\rfloor=1',
        note:'The failing circles form the syndrome, a binary number. It names the flipped position.'}]},
    {t:'reveal', at:3, items:[
      given('m6-codes-glimpse', 'The circles for $s_1$ and $s_4$ fail, and $s_2$ holds.<div class="nsep"></div>Which bit flipped?',
        ['bit $3$','bit $5$','bit $6$'], 1, '$s_4s_2s_1=101$ in binary is $5$.')]}
  ]}
]},

{ id:'m6-transmission', module:'M6', nav:'A source over a channel', title:'Sending a source over a channel',
  objective:'Decide whether a source can be sent reliably over a channel by comparing its entropy with the capacity.',
  keywords:'information transmission theorem source channel H(U) less than C bsc epsilon range 0.1206 0.8794 slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Sending a source over a channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'e', label:'$\\epsilon$', min:0, max:1, step:0.005, v:0.05, show:v=>'$'+num(v,3)+'$'}]},
      svg:figTransmission,
      caption:'A binary source with $P(1)=0.1$ sent over a BSC, one use a symbol. The green bands mark where $C(\\epsilon)$ exceeds $H(U)$. Drag $\\epsilon$.'}
  ], right:[
    {t:'eq', result:true, label:'Key result · source over a channel', tex:'H(U)<C\\quad\\text{bits per channel use}',
      note:'Compress the source to $H(U)$, then code it for the channel. Both steps can be made reliable.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'This source', tex:'H_b(0.1)=0.469<1-H_b(\\epsilon)\\iff\\epsilon<0.1206\\ \\text{or}\\ \\epsilon>0.8794'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Rates', html:'With $R_s$ symbols and $R_c$ uses a second, compare $H(U)R_s$ with $CR_c$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-transmission', 'The same source over a BSC with $\\epsilon=0.2$.<div class="nsep"></div>Reliable?',
        ['yes','no'], 1, '$C=1-H_b(0.2)=0.278<0.469$.')]}
  ]}
]},

REAL_CAPACITY,

labScene('m6-lab-k', 'K', 'Channel capacity', 'Channel capacity',
  'Find the capacity of binary channels by moving the input distribution.',
  'laboratory channel capacity bsc z-channel erasure cascade input distribution peak interactive',
  'Pick a binary channel: symmetric, Z, erasure or a cascade. Move the input distribution and find the peak of $I(X;Y)$.'),

codeScene('m6-code-capacity', 'Capacity', 'Capacity in code',
  'Find the capacity of binary channels numerically and simulate repetition codes on a BSC.',
  'code matlab python program run capacity maximise mutual information bsc z-channel erasure repetition simulation'),

/* ---------------------------------------------------------------- 6.6 ---- */
{ id:'m6-awgn', module:'M6', nav:'The Gaussian channel', title:'The Gaussian channel',
  objective:'Count the codewords that fit in a power-limited Gaussian channel and find its capacity per use.',
  keywords:'gaussian channel awgn power limit sphere packing noise disc radius capacity half log2(1+P/N) frames',
  src:'CH10 s.35', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The Gaussian channel'},
  {t:'title', text:'The Gaussian channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['noise','codewords','all outputs','count']}, svg:figAWGN,
      caption:'A received word lands near its codeword, inside a noise disc. All received words lie in a larger disc. Count how many noise discs fit inside.'}
  ], right:[
    {t:'eq', label:'Channel', tex:'Y=X+Z,\\qquad Z\\sim\\mathcal{N}(0,P_N),\\qquad\\mathrm{E}[X^{2}]\\le P'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Sphere count', html:'Over $n$ uses the noise fills a ball of radius $\\sqrt{nP_N}$, and the received words a ball of radius $\\sqrt{n(P+P_N)}$. Divide the volumes.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · Gaussian channel', tex:'C=\\tfrac12\\log_2\\Bigl(1+\\frac{P}{P_N}\\Bigr)\\ \\ \\text{bits per use}'}]},
    {t:'reveal', at:3, items:[
      given('m6-awgn', '$P/P_N=15$.<div class="nsep"></div>What is $C$?',
        ['$1$ bit','$2$ bits','$4$ bits'], 1, '$\\tfrac12\\log_2(16)=2$ bits a use.')]}
  ]}
]},

{ id:'m6-shannon', module:'M6', nav:'The bandlimited channel', title:'The capacity of the bandlimited channel',
  objective:'Turn 2W uses a second into the capacity W log2(1 + P/N0W) of a bandlimited channel.',
  keywords:'shannon capacity bandlimited channel W log2(1+SNR) 2W samples per second bits per second per hertz slider',
  src:'CH10 s.36', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The Gaussian channel'},
  {t:'title', text:'The capacity of the bandlimited channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'s', label:'SNR', min:-10, max:30, step:0.1, v:11.76, show:v=>'$'+num(v,1)+'$ dB'}]},
      svg:figShannon,
      caption:'Capacity per hertz against the SNR in dB. At high SNR each $3$ dB adds one bit a second per hertz. Drag the SNR.'}
  ], right:[
    {t:'note', kind:'def', head:'Uses a second', html:'A channel of band $W$ carries $2W$ independent samples a second, as in Module 1. Each sample is one use of the Gaussian channel.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · Shannon capacity', tex:'C=2W\\cdot\\tfrac12\\log_2\\Bigl(1+\\frac{P}{N_0W}\\Bigr)=W\\log_2(1+\\text{SNR})\\ \\ \\text{b/s}',
        note:'The noise power in the band is $N_0W$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'SNR is a ratio', html:'Put the ratio inside the logarithm. $30$ dB is $1000$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-shannon', '$W=1$ MHz and $\\text{SNR}=15$.<div class="nsep"></div>What is $C$?',
        ['$1$ Mb/s','$4$ Mb/s','$15$ Mb/s'], 1, '$10^{6}\\log_2(16)=4$ Mb/s.')]}
  ]}
]},

{ id:'m6-ex-phone', module:'M6', nav:'Worked example · a telephone line', title:'Worked example: a telephone line',
  objective:'Apply the Shannon capacity to a voice-band telephone line.',
  keywords:'worked example telephone line voice band 3.1 kHz 30 dB 30.9 kb/s common error dB inside logarithm 15.4',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Worked example'},
  {t:'title', text:'Worked example: a telephone line'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figPhone,
      caption:'Capacity of a $3.1$ kHz line against its SNR in dB. The dot is the right answer at $30$ dB, and the ring is the answer with $30$ inside the logarithm.'}
  ], right:[
    given('m6-ex-phone', 'A telephone line passes $300$ Hz to $3.4$ kHz at an SNR of $30$ dB.<div class="nsep"></div>Find $C$. What is $W$?',
      ['$3.1$ kHz','$3.4$ kHz','$3.7$ kHz'], 0, '$W=3400-300=3100$ Hz.'),
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\text{SNR}=10^{30/10}=1000,\\qquad C=W\\log_2(1+\\text{SNR})'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'C=3100\\log_2(1001)=3100\\times9.967=30.9\\ \\text{kb/s}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'$3100\\log_2(1+30)=15.4$ kb/s puts decibels inside the logarithm. Convert first.'}]}
  ]}
]},

{ id:'m6-bandwidth', module:'M6', nav:'More bandwidth, same power', title:'Capacity against bandwidth',
  objective:'Show that capacity levels off at 1.44 P/N0 as bandwidth grows at a fixed power.',
  keywords:'capacity against bandwidth infinite bandwidth limit P/N0 ln2 1.4427 power limited more power slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The Gaussian channel'},
  {t:'title', text:'Capacity against bandwidth'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'w', label:'$WN_0/P$', min:-1, max:2, step:0.05, v:0, show:v=>'$'+num(Math.pow(10,v), Math.pow(10,v) < 1 ? 2 : 1)+'$'}]},
      svg:figBandwidth,
      caption:'Top: capacity against bandwidth at a fixed power, levelling off at the dashed line. Bottom: capacity per hertz against power at a fixed band, which keeps rising. Drag $W$.'}
  ], right:[
    {t:'note', kind:'def', head:'More band', html:'A wider band lets more samples through, but spreads the same power thinner. The two effects nearly cancel.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · infinite band', tex:'\\lim_{W\\to\\infty}W\\log_2\\Bigl(1+\\frac{P}{N_0W}\\Bigr)=\\frac{P}{N_0\\ln2}=1.4427\\,\\frac{P}{N_0}'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'More power', html:'At a fixed band, capacity keeps growing with power, but only as its logarithm.'}]},
    {t:'reveal', at:3, items:[
      given('m6-bandwidth', 'The band grows without limit at a fixed $P/N_0$.<div class="nsep"></div>$C$ tends to',
        ['infinity','$1.44\\,P/N_0$','zero'], 1, '$\\log_2(1+x)\\approx x/\\ln2$ for small $x$.')]}
  ]}
]},

{ id:'m6-plane', module:'M6', nav:'The bandwidth-efficiency plane', title:'The bandwidth-efficiency plane',
  objective:'Draw the least Eb/N0 for each spectral efficiency and place the uncoded schemes of Module 5 against it.',
  keywords:'bandwidth efficiency plane spectral efficiency r=Rb/W Eb/N0 (2^r-1)/r power limited bandwidth limited uncoded gap module 5 slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The Gaussian channel'},
  {t:'title', text:'The bandwidth-efficiency plane'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'u', label:'$r$', min:-3, max:3, step:0.05, v:1, show:v=>'$'+num(Math.pow(2,v), Math.pow(2,v) < 1 ? 3 : 2)+'$'}]},
      svg:figPlane6,
      caption:'The least $E_b/N_0$ for each spectral efficiency $r$ (line), and the uncoded schemes of Module 5 at a symbol error of $10^{-5}$ (cyan dots). Drag $r$.'}
  ], right:[
    {t:'eq', label:'Spectral efficiency', tex:'r=\\frac{R_b}{W},\\qquad R_b<C\\;\\Longrightarrow\\;\\frac{E_b}{N_0}>\\frac{2^{r}-1}{r}',
      note:'Put $P=E_bR_b$ into $R_b<W\\log_2(1+P/N_0W)$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Two regions', html:'Above $r=1$ the band is scarce. Below it, power is scarce. Left of the line nothing works.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The gap', html:'Each uncoded scheme sits several dB right of the line. Coding exists to close that gap.'}]},
    {t:'reveal', at:3, items:[
      given('m6-plane', '$r=2$ b/s/Hz.<div class="nsep"></div>What is the least $E_b/N_0$?',
        ['$0$ dB','$1.76$ dB','$4.77$ dB'], 1, '$(2^{2}-1)/2=1.5$, and $10\\log_{10}1.5=1.76$ dB.')]}
  ]}
]},

{ id:'m6-limit', module:'M6', nav:'The Shannon limit', title:'The Shannon limit',
  objective:'Find the least Eb/N0 for reliable transmission, −1.59 dB, and the gap of uncoded BPSK to it.',
  keywords:'shannon limit -1.59 dB ln 2 r to zero bpsk 9.59 dB gap 11.18 dB coding gain frames',
  src:'CH10 s.37', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The Gaussian channel'},
  {t:'title', text:'The Shannon limit'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$r=4$','$2$','$1$','$\\tfrac12$','$0.1$','$\\to0$']}, svg:figLimit,
      caption:'The bound of the last slide as $r$ falls. The point walks down to $\\ln2$, and the last step places uncoded BPSK at $10^{-5}$.'}
  ], right:[
    {t:'eq', result:true, label:'Key result · Shannon limit', tex:'\\frac{E_b}{N_0}>\\lim_{r\\to0}\\frac{2^{r}-1}{r}=\\ln2=-1.59\\ \\text{dB}',
      note:'No code works below it, at any bandwidth.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'BPSK', html:'Uncoded BPSK needs $9.59$ dB for $P_b=10^{-5}$. That is $11.18$ dB above the limit.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Coding closes the gap', html:'Modern codes come within a fraction of a dB of the limit. Module 5 met the same $-1.59$ dB for orthogonal signals as $M$ grows.'}]},
    {t:'reveal', at:3, items:[
      given('m6-limit', 'BPSK at $10^{-5}$ needs $9.59$ dB.<div class="nsep"></div>Its gap to the Shannon limit is about',
        ['$1.6$ dB','$9.6$ dB','$11.2$ dB'], 2, '$9.59-(-1.59)=11.18$ dB.')]}
  ]}
]},

{ id:'m6-waterfill', module:'M6', nav:'Sharing power over parallel channels', title:'Water-filling',
  objective:'Share a total power over parallel Gaussian channels to maximise the total capacity.',
  keywords:'water filling parallel gaussian channels water level mu power allocation quietest subchannels dsl ofdm slider',
  src:'CH10 w.13', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The Gaussian channel'},
  {t:'title', text:'Water-filling'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'P', label:'$P$', min:0.05, max:8, step:0.05, v:1, show:v=>'$'+num(v,2)+'$'}]},
      svg:figWater,
      caption:'Six subchannels with noise $0.1$ to $3.2$ (grey). Power (cyan) is poured in up to one level $\\mu$. Drag the total power $P$.'}
  ], right:[
    {t:'eq', label:'Parallel channels', tex:'C=\\sum_i\\tfrac12\\log_2\\Bigl(1+\\frac{P_i}{N_i}\\Bigr),\\qquad\\sum_iP_i=P'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · water-filling', tex:'P_i=\\max(0,\\ \\mu-N_i)',
        note:'Fill every channel up to the same level $\\mu$. Channels whose noise lies above it get nothing.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'At P = 1', html:'Three channels are used, for $2.254$ bits. Equal shares give $1.641$.'}]},
    {t:'reveal', at:3, items:[
      given('m6-waterfill', 'Very little total power.<div class="nsep"></div>Which channels get it?',
        ['all equally','the quietest','the noisiest'], 1, 'The water first covers the lowest floor.')]}
  ]}
]},

REAL_SHANNON,

labScene('m6-lab-wf', 'WF', 'Water-filling', 'The Gaussian channel',
  'Pour a total power over parallel channels and compare the capacity with equal shares.',
  'laboratory water filling parallel channels noise floor water level power allocation capacity equal shares interactive',
  'Shape the noise floors and set the total power. Watch the water level, the channels used and the capacity against equal shares.'),

codeScene('m6-code-gauss', 'The Gaussian channel', 'The Gaussian channel in code',
  'Compute the Shannon capacity, the bandwidth-efficiency bound, the Shannon limit and a water-filling allocation.',
  'code matlab python program run shannon capacity bandwidth limit plane water filling'),

/* ---------------------------------------------------------------- 6.7 ---- */
{ id:'m6-chain', module:'M6', nav:'From source to channel', title:'From a source to a channel',
  objective:'Follow one source through a Huffman code and a BPSK link and check that it fits the capacity.',
  keywords:'summary chain source huffman bpsk bsc capacity symbol rate channel rate H R_s C R_c check frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Summary'},
  {t:'title', text:'From a source to a channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['source','$H$','Huffman','BPSK','BSC','check']}, svg:figChain6,
      caption:'The source of $0.4,0.2,0.2,0.1,0.1$ at $1000$ symbols a second, a Huffman code, and BPSK at $3000$ bits a second and $4$ dB. The bars compare the rates.'}
  ], right:[
    {t:'note', kind:'def', head:'The source', html:'$H=2.122$ bits a symbol. The Huffman code of 6.3 spends $\\bar{L}=2.2$, so $2200$ b/s leave the encoder.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The channel', html:'BPSK at $4$ dB, decided bit by bit, is a BSC with $p=0.0125$ and $C=0.903$ bit a use.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · the check', tex:'H\\,R_s=2122\\ \\text{b/s}\\;<\\;C\\,R_c=2709\\ \\text{b/s}',
        note:'A channel code of rate $2200/3000=0.733<C$ exists that makes the link reliable.'}]},
    {t:'reveal', at:3, items:[
      given('m6-chain', 'The same link at $R_c=2000$ uses a second.<div class="nsep"></div>Reliable?',
        ['yes','no'], 1, '$CR_c=0.903\\times2000=1806<2122$ b/s.')]}
  ]}
]},

{ id:'m6-quick', module:'M6', nav:'Quick check', title:'Quick check',
  objective:'Check the module ideas with six short predictions.',
  keywords:'quick check predict uniform entropy kraft sum huffman bound independent mutual information erasure capacity shannon limit',
  budget:'a set of six prediction cards. The questions carry no figure',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · Quick check'},
  {t:'title', text:'Quick check'},
  {t:'grid', cols:3, gap:'22px 20px', style:'flex:1;grid-auto-rows:1fr;padding-bottom:8px', items:[
    [{t:'note', kind:'def', head:'Uniform source', html:'Eight equally likely symbols have an entropy of',
      ask:{key:'m6-qc0', choices:['$1$ bit','$3$ bits','$8$ bits'], answer:1,
        why:'$\\log_28=3$.'}}],
    [{t:'note', kind:'def', head:'Kraft sum', html:'Codeword lengths $1,2,3,3$ give a Kraft sum of',
      ask:{key:'m6-qc1', choices:['$0.875$','$1$','$1.25$'], answer:1,
        why:'$\\tfrac12+\\tfrac14+\\tfrac18+\\tfrac18=1$.'}}],
    [{t:'note', kind:'def', head:'Huffman length', html:'A Huffman code for a source of entropy $H$ has $\\bar{L}$',
      ask:{key:'m6-qc2', choices:['below $H$','in $[H,H+1)$','above $H+1$'], answer:1,
        why:'It meets the source-coding bound.'}}],
    [{t:'note', kind:'def', head:'Independent pair', html:'For independent $X$ and $Y$, $I(X;Y)$ is',
      ask:{key:'m6-qc3', choices:['$0$','$H(X)$','$H(X,Y)$'], answer:0,
        why:'$H(X\\mid Y)=H(X)$.'}}],
    [{t:'note', kind:'def', head:'Erasures', html:'A binary erasure channel with $\\epsilon=0.2$ has capacity',
      ask:{key:'m6-qc4', choices:['$0.2$','$0.278$','$0.8$'], answer:2,
        why:'$C=1-\\epsilon$.'}}],
    [{t:'note', kind:'def', head:'Limit', html:'Below which $E_b/N_0$ can no code be reliable?',
      ask:{key:'m6-qc5', choices:['$-1.59$ dB','$0$ dB','$9.59$ dB'], answer:0,
        why:'$\\ln2=0.693$, which is $-1.59$ dB.'}}]
  ]}
]},

{ id:'m6-synth', module:'M6', nav:'Summary', title:'Module 6 summary',
  objective:'Collect the results this module contributes to the rest of the course.',
  keywords:'summary self-information entropy binary entropy extension typical kraft bound huffman lempel ziv channel mutual information capacity coding theorem hamming shannon limit water filling recall',
  src:'CH10 s.38', dark:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 6 · Summary'},
  {t:'title', text:'Module 6 summary'},
  /* Fourteen results as prompts, in the order of the module: the student
     answers each one aloud, then opens the card. */
  {t:'raw', html:()=>RECALL.deck('m6', [
    {q:'How much information does a symbol carry?', glyph:G.self,
     a:'$I(s_k)=-\\log_2p_k$ bits: rare symbols carry more.'},
    {q:'What is entropy, and what bounds it?', glyph:G.hb,
     a:'$H(S)=-\\sum_kp_k\\log_2p_k$, with $0\\le H\\le\\log_2K$.'},
    {q:'What does an extended source carry?', glyph:G.ext,
     a:'$H(S^{n})=nH(S)$ for a memoryless source.'},
    {q:'What are typical sequences?', glyph:G.typical,
     a:'About $2^{nH}$ sequences, each of probability near $2^{-nH}$, that hold almost all the probability.'},
    {q:'When do codeword lengths allow a prefix code?', glyph:G.kraft,
     a:'Exactly when $\\sum_k2^{-l_k}\\le1$.'},
    {q:'How close can a code get to the entropy?', glyph:G.bound,
     a:'$H\\le\\bar{L}<H+1$, and $H+1/n$ for blocks of $n$.'},
    {q:'How is a Huffman code built?', glyph:G.huffman,
     a:'Merge the two least likely entries until one is left, then read each codeword back.'},
    {q:'What does Lempel–Ziv need to know about the source?', glyph:G.lz,
     a:'Nothing. It parses the stream into new phrases, and its cost falls toward $H$ as the stream grows.'},
    {q:'What is a binary symmetric channel?', glyph:G.channel,
     a:'Each bit flips with probability $p$. Hard-decision BPSK gives $p=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.'},
    {q:'What is mutual information?', glyph:G.mutual,
     a:'$I(X;Y)=H(X)-H(X\\mid Y)$, symmetric and never negative.'},
    {q:'What is the capacity of a channel?', glyph:G.capacity,
     a:'$C=\\max_{p(x)}I(X;Y)$: $1-H_b(p)$ for the BSC, $1-\\epsilon$ for the erasure channel.'},
    {q:'What does the channel coding theorem say?', glyph:G.theorem,
     a:'Rates below $C$ can be made reliable. Rates above it cannot.'},
    {q:'What is the capacity of a bandlimited channel?', glyph:G.shannon,
     a:'$C=W\\log_2(1+P/N_0W)$ b/s, which levels off at $1.44\\,P/N_0$ as $W$ grows.'},
    {q:'What is the Shannon limit?', glyph:G.limit,
     a:'$E_b/N_0>\\ln2=-1.59$ dB. Uncoded BPSK sits $11.2$ dB above it.'}
  ], {cols:2})},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Method', html:'<span style="color:var(--graphite)">Compress the source to its entropy, then code it for the channel below capacity. Module 7 builds those channel codes.</span>'}]}
]},

/* Four optional projects for students who want to try the module on their own
   computer. They carry no grade and no code: each card gives an aim, what it
   practises, a few steps and what to look for. The briefs state no numerical
   answer, so they need no line in verify/. */
{ id:'m6-projects', module:'M6', nav:'Projects to try', title:'Projects to try',
  objective:'Offer four optional projects that use the module on real text and simulated channels.',
  keywords:'projects matlab python entropy meter huffman coder text lz78 compressor bsc simulator repetition capacity water filling line',
  dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · Projects'},
  {t:'title', text:'Projects to try'},
  {t:'raw', html:()=>PROJECTS.deck('m6', [
    {title:'An entropy meter and a Huffman coder', glyph:G.huffman,
     aim:'Measure the entropy of a text and code it with a Huffman code built from its own counts.',
     learn:['Letter frequencies as probabilities.',
            'Building a Huffman code by repeated merges.',
            'Average length against entropy.'],
     steps:['Count the letters and spaces of a long text.',
            'Compute the entropy of one letter.',
            'Build a Huffman code and encode the text.',
            'Decode it and check that nothing changed.'],
     look:'The bits a letter sit just above the entropy, and far above the $1.3$ bits of English with its memory.'},
    {title:'An LZ78 compressor', glyph:G.lz,
     aim:'Compress binary streams with LZ78 and compare the cost with the entropy.',
     learn:['Parsing a stream into new phrases.',
            'A pointer and one new bit a phrase.',
            'Why a universal code needs long streams.'],
     steps:['Draw bits with $P(1)=p$ for several $p$.',
            'Parse each stream and count the phrases.',
            'Compute the bits sent a source bit.',
            'Plot the cost against the stream length and $H_b(p)$.'],
     look:'The cost falls slowly toward $H_b(p)$ and never below it.'},
    {title:'A BSC simulator', glyph:G.theorem,
     aim:'Send bits over a simulated BSC with repetition codes and a Hamming code.',
     learn:['Majority voting over copies.',
            'Syndrome decoding of one error.',
            'Rate against error, next to capacity.'],
     steps:['Flip random bits with probability $p$.',
            'Code with repetition $n=1,3,5$ and with the $(7,4)$ Hamming code.',
            'Decode and count the bit errors.',
            'Plot error against rate with $C=1-H_b(p)$.'],
     look:'The Hamming code gives more rate than repetition at a similar error, and all points sit left of $C$.'},
    {title:'Water-filling on a line', glyph:G.water,
     aim:'Share power over the tones of a line whose noise rises with frequency.',
     learn:['Parallel Gaussian channels.',
            'The water level found by bisection.',
            'Why the noisiest tones get nothing.'],
     steps:['Choose a noise floor that grows with frequency over $64$ tones.',
            'Find the water level for a total power by bisection.',
            'Compute the bits each tone carries.',
            'Compare the total with equal shares as the power changes.'],
     look:'At low power a few quiet tones carry everything. At high power the shares become nearly equal.'}
  ])}
]}

];

window.SCENES_M6 = SC;
})();
