/* ==========================================================================
   Module 5 — Digital modulation methods.

   A carrier has an amplitude, a phase and a frequency. Each modulation of
   this module switches one of them, or two at once, and each one is a
   constellation. Module 4 then gives the receiver and the error probability
   from the distances between the points. What changes from scheme to scheme
   is where the points sit, how many bits each carries, and how much band the
   carrier needs.

   Every teaching scene is a slide in the reference design (DESIGN.md), as in
   Modules 1 to 4: one figure on the left, two to four cards on the right, a
   prediction card on each slide, and each section closing on a gallery, a
   laboratory and a code page. Most figures move: a sequence is played in
   frames, a continuous parameter is a slider.

   Colour, as everywhere in this course: cyan is a transmitted waveform or its
   signal point, amber a carrier or basis function, violet an intermediate
   quantity (I and Q, a correlator output, a phase), green the received
   waveform or point, red an error or an error probability. Noise takes no
   colour of its own. A decision region is a faint fill of the colour of the
   point it decides for.

   The helpers below are the ones Module 4 uses, kept here so that this file
   stands on its own.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* The canvas of a slide figure and of a gallery figure. */
const SZ  = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const EXO = o => Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3}, o);
const clamp01 = x => Math.max(0, Math.min(1, x));
const frameOf = (v, last) => v && v.frame!=null ? v.frame : last;
const f2 = v => v.toFixed(2);
/* a number for a figure label: d decimals, and never "-0.00" */
const num = (v, d=2) => { const s = v.toFixed(d); return /^-0\.0*$/.test(s) ? s.slice(1) : s; };
/* a small probability as TeX, 2.70\times10^{-3} */
const sci = (v, d=2) => { if(!(v > 0)) return '0'; const e = Math.floor(Math.log10(v)), m = v/Math.pow(10, e);
  return e >= -1 ? num(v, 3) : m.toFixed(d)+'\\times10^{'+e+'}'; };
/* a hex colour at an alpha below 0.35: a plate, which a label may cross */
const rgba = (hex, al) => { const h = hex.replace('#','');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${al})`; };

/* The Gaussian tail Q(x) = erfc(x/sqrt2)/2, with a fractional error below
   1.2e-7 everywhere, so a curve on a logarithmic axis keeps its shape. */
function erfc(x){ const z = Math.abs(x), t = 1/(1+0.5*z);
  const r = t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+
    t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x >= 0 ? r : 2-r; }
const Qf = x => 0.5*erfc(x/Math.SQRT2);
const dB = db => Math.pow(10, db/10);
const todB = x => 10*Math.log10(x);
/* The dB value at which a falling curve g(dB) meets a target, by bisection. */
function reach(g, target, lo=-10, hi=60){
  for(let i=0;i<90;i++){ const m = (lo+hi)/2; if(g(m) > target) lo = m; else hi = m; }
  return (lo+hi)/2;
}

/* Seeded noise: the same draws on every render, so a figure does not flicker
   and a count it prints is the count verify/verify_m5.py reproduces. */
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }

/* The height a slide figure is drawn at: the grown height when the renderer
   asks for one, else the authored height. Read once and cleared, so the
   panels inside a stacked figure keep the heights they are given. */
const takeH = h0 => { const h = P.hOverride || h0; P.hOverride = null; return h; };

/* One panel placed inside a larger figure; each nested panel keeps its own
   axes, and textclash.js measures it on its own. */
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };
/* Two panels drawn in the same place and crossfaded, for a figure whose
   lower half changes what it shows between frames. */
const fade = (svg, o) => o < 0.02 ? '' : `<g opacity="${o.toFixed(3)}">${svg}</g>`;

/* A piecewise-constant waveform, given as [start, end, value] pieces, and its
   outline with the vertical edges drawn. */
function outline(segs, lo, hi){
  const pts = [[lo,0]]; let x = lo, y = 0;
  segs.forEach(([a,b,v])=>{
    if(a > x + 1e-12){ if(y!==0) pts.push([x,0]); pts.push([a,0]); }
    pts.push([a,v],[b,v]); x = b; y = v; });
  pts.push([x,0],[hi,0]);
  return pts;
}

/* Drawing helpers in data coordinates that take an opacity, for the figures
   played in frames. */
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
/* A sampled trace of f on [lo, hi], cut to the data area of the axes. */
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
/* A ring around a point, for the one the receiver picks. */
function ring(a, x, y, o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||13}" fill="none" stroke="${o.color||C.out}" stroke-width="${o.width||2.6}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
const circle = (a, r, o={}) => { const pts=[]; const c = o.c || [0,0];
  for(let i=0;i<=160;i++){ const u=2*Math.PI*i/160; pts.push([c[0]+r*Math.cos(u), c[1]+r*Math.sin(u)]); }
  seg(a, pts, Object.assign({color:C.muted, width:1.2, dash:'4 5'}, o)); };
/* An arc of radius r from angle t0 to t1 (radians) about the origin. */
const arc = (a, r, t0, t1, o={}) => { const pts=[], n = 60;
  for(let i=0;i<=n;i++){ const u = t0+(t1-t0)*i/n; pts.push([r*Math.cos(u), r*Math.sin(u)]); }
  seg(a, pts, o); };
/* Noise draws: small dots in the hairline tone. Their stroke carries the same
   tone, so the collision sweep reads them as a guide, as it reads the grid. */
function cloudPts(a, pts, o={}){
  let s = ''; const r = o.r || 2.1;
  pts.forEach(([x,y,bad])=>{ const col = bad ? C.err : (o.color || C.noise);
    s += `<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${bad ? r+0.9 : r}" fill="${col}" stroke="${col}" stroke-width="0.6"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`; });
  a.raw(s);
}
/* A filled area under f between lo and hi, as a plate: a translucent wash
   that labels may cross. */
function wash(a, f, lo, hi, col, al){
  lo = Math.max(lo, a.o.xr[0]); hi = Math.min(hi, a.o.xr[1]);
  if(hi <= lo) return;
  const n = 200, pts = [], y0 = Math.max(0, a.o.yr[0]);
  for(let i=0;i<=n;i++){ const t=lo+(hi-lo)*i/n; pts.push(f2(a.sx(t))+','+f2(a.sy(Math.min(f(t), a.o.yr[1])))); }
  a.raw(`<path d="M${f2(a.sx(lo))},${f2(a.sy(y0))}L${pts.join('L')}L${f2(a.sx(hi))},${f2(a.sy(y0))}Z" fill="${rgba(col, al==null?0.3:al)}" stroke="none"/>`);
}
const lbl = (a, x, y, s, col, anchor, fs) => a.note(x, y, s, {tex:true, fs:fs||15, color:col||C.ink, anchor:anchor||'start'});

/* Tick numbers of the time axis under the lower edge of the data area, where
   no step of a waveform can cross them. An axes that takes these passes
   xticksOverride:[]. */
function bottomTicks(a, vals, fmt){
  const L = P.labelScale(), f = fmt || (v => String(v));
  vals.forEach(v=>{ const X = f2(a.sx(v));
    a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${a.y0+5}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${X}" y="${f2(a.y0+19*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="middle">${f(v)}</text>`); });
  return a;
}
/* Tick numbers of the vertical axis at the left edge of the data area, with
   the grid lines behind them. An axes whose horizontal range holds zero away
   from its left edge would otherwise set them on that zero line. */
function leftTicks(a, vals, fmt){
  const L = P.labelScale(), f = fmt || (v => String(v));
  vals.forEach(v=>{ const Y = a.sy(v);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x1}" y2="${f2(Y)}" stroke="${C.grid}" stroke-width="1"/>`);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x0-5}" y2="${f2(Y)}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${f2(a.x0-10)}" y="${f2(Y+4.5*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="end">${f(v)}</text>`); });
  return a;
}
const TAx = o => { const xt = o.xt; const a = P.Axes(Object.assign({}, o, {xticksOverride:[]})); return xt ? bottomTicks(a, xt, o.xfmt) : a; };
/* A blank drawing canvas in data coordinates: no ticks, no grid, no axes. */
const bare = o => Object.assign({xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}, o);

/* A signal-space plane drawn to one scale on both axes, so a circle is round
   at whatever height the figure is grown to. `need` is the smallest range
   each axis must show; the other range is widened to fill the box. */
function plane(o){
  const h = P.hOverride || o.h || 380; P.hOverride = null;
  const base = Object.assign({w:560, pad:{l:56,r:26,t:24,b:42}, xlabel:'\\psi_1', ylabel:'\\psi_2'}, o, {h});
  delete base.need;
  const [nx, ny] = o.need;
  const pr = P.Axes(Object.assign({}, base, {xr:nx, yr:ny}));
  const k = Math.min((pr.x1-pr.x0)/(nx[1]-nx[0]), (pr.y0-pr.y1)/(ny[1]-ny[0]));
  const cx = (nx[0]+nx[1])/2, cy = (ny[0]+ny[1])/2;
  const hx = (pr.x1-pr.x0)/k/2, hy = (pr.y0-pr.y1)/k/2;
  return P.Axes(Object.assign({}, base, {xr:[cx-hx,cx+hx], yr:[cy-hy,cy+hy]}));
}

/* ---- decision regions ------------------------------------------------------
   The region of each point is a convex polygon: the visible box clipped by
   one half-plane for every other point, the rule of Module 4. */
function clipHalf(poly, ax, ay, c){
  const out = [], n = poly.length;
  const val = p => ax*p[0]+ay*p[1]-c;
  for(let k=0;k<n;k++){
    const A = poly[k], B = poly[(k+1)%n], va = val(A), vb = val(B);
    if(va <= 0) out.push(A);
    if((va <= 0) !== (vb <= 0)){ const t = va/(va-vb); out.push([A[0]+t*(B[0]-A[0]), A[1]+t*(B[1]-A[1])]); }
  }
  return out;
}
function cells(pts, box){
  return pts.map((p,i)=>{
    let poly = [[box[0],box[2]],[box[1],box[2]],[box[1],box[3]],[box[0],box[3]]];
    pts.forEach((q,j)=>{ if(j===i || !poly.length) return;
      poly = clipHalf(poly, 2*(q[0]-p[0]), 2*(q[1]-p[1]), q[0]*q[0]+q[1]*q[1]-p[0]*p[0]-p[1]*p[1]); });
    return poly;
  });
}
const PTCOL  = () => [C.in, C.out, C.mid, C.h, C.err];
const REGCOL = () => [C.dec.in, C.dec.out, C.dec.mid, C.dec.h, C.dec.err];
function fillPoly(a, poly, fill, op){
  if(poly.length < 3) return;
  a.raw(`<path d="M${poly.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L')}Z" fill="${fill}" stroke="none"${op!=null?` opacity="${op.toFixed(3)}"`:''}/>`);
}
/* A point on or inside a convex polygon. */
function inside(poly, p, eps){
  let sgn = 0;
  for(let k=0;k<poly.length;k++){ const A = poly[k], B = poly[(k+1)%poly.length];
    const cr = (B[0]-A[0])*(p[1]-A[1]) - (B[1]-A[1])*(p[0]-A[0]);
    if(Math.abs(cr) < (eps||1e-9)*Math.hypot(B[0]-A[0], B[1]-A[1])) continue;
    const s = Math.sign(cr); if(!sgn) sgn = s; else if(s !== sgn) return false; }
  return true;
}
/* Fill each region and draw the edges between regions; the edges of the box
   itself are left out. */
function drawCells(a, pts, o={}){
  const box = [a.o.xr[0], a.o.xr[1], a.o.yr[0], a.o.yr[1]];
  const cs = cells(pts, box), fills = o.fills || REGCOL();
  cs.forEach((poly,i)=>fillPoly(a, poly, fills[i % fills.length], o.opacity));
  if(o.lines === false) return cs;
  const onBox = (p,q) => [0,1].some(k => Math.abs(p[0]-q[0])<1e-9 && Math.abs(p[0]-box[k])<1e-9)
                      || [2,3].some(k => Math.abs(p[1]-q[1])<1e-9 && Math.abs(p[1]-box[k])<1e-9);
  cs.forEach((poly,i)=>{ for(let k=0;k<poly.length;k++){ const p = poly[k], q = poly[(k+1)%poly.length];
    if(onBox(p,q)) continue;
    const mid = [(p[0]+q[0])/2, (p[1]+q[1])/2];
    const owner = cs.findIndex((c,j)=>j!==i && c.length > 2 && inside(c, mid, 1e-7));
    if(owner >= 0 && owner < i) continue;
    seg(a, [p,q], {color:o.lineCol||C.muted, width:o.lineW||1.3, opacity:o.opacity, dash:o.dash}); } });
  return cs;
}
const nearest = (pts, x, y) => { let best = 0, bd = Infinity;
  pts.forEach((p,k)=>{ const d = (x-p[0])*(x-p[0])+(y-p[1])*(y-p[1]); if(d < bd){ bd = d; best = k; } });
  return best; };

/* A curve on a logarithmic axis stops at the lower edge of the axis: LGF is
   that edge, set by the figure right after it makes its axes. */
let LGF = -99;
const lg10 = v => { const y = Math.log10(Math.max(1e-14, v)); return y < LGF-0.02 ? NaN : y; };
const logAx = o => { const a = TAx(Object.assign({ytickfmt:P.decade, zeroAxes:false}, o)); LGF = a.o.yr[0]; return a; };

/* ---- the point sets of the module ---------------------------------------- */
const PSKpts = (M, r=1, off=0) => Array.from({length:M}, (_,k)=>[r*Math.cos(2*Math.PI*k/M+off), r*Math.sin(2*Math.PI*k/M+off)]);
const gray = i => i ^ (i >> 1);
const bin = (v, k) => v.toString(2).padStart(k, '0');
/* QPSK with Gray labels: 00 at 45 degrees, then 01, 11, 10 anticlockwise. */
const QPSK = [[1,1],[-1,1],[-1,-1],[1,-1]];
const QLAB = ['00','01','11','10'];
/* 16-QAM on the grid (+-1, +-3), Gray labels on each axis. */
const LV4 = [-3,-1,1,3], G4 = ['00','01','11','10'];
const QAM16 = []; LV4.forEach(x=>LV4.forEach(y=>QAM16.push([x,y])));

/* ---- error probabilities, in one place -----------------------------------
   Each takes the SNR per bit as a ratio. The nearest-neighbour forms are the
   ones the slides derive; the exact square-QAM form is 1 - (1 - P_sqrtM)^2. */
const PE = {
  bpsk:  g => Qf(Math.sqrt(2*g)),
  bfsk:  g => Qf(Math.sqrt(g)),
  dpsk:  g => 0.5*Math.exp(-g),
  ncfsk: g => 0.5*Math.exp(-g/2),
  psk:   (M, g) => M===2 ? Qf(Math.sqrt(2*g)) : 2*Qf(Math.sqrt(2*Math.log2(M)*g)*Math.sin(Math.PI/M)),
  pam:   (M, g) => 2*(M-1)/M*Qf(Math.sqrt(6*Math.log2(M)*g/(M*M-1))),
  qamNN: (M, g) => 4*(1-1/Math.sqrt(M))*Qf(Math.sqrt(3*Math.log2(M)*g/(M-1))),
  qam:   (M, g) => { const p = 2*(1-1/Math.sqrt(M))*Qf(Math.sqrt(3*Math.log2(M)*g/(M-1))); return 1-(1-p)*(1-p); },
  orthU: (M, g) => (M-1)*Qf(Math.sqrt(Math.log2(M)*g))
};
/* The exact symbol error of M orthogonal signals, P_M = 1 - int phi(y - mu)
   (1 - Q(y))^(M-1) dy with mu = sqrt(2 k Eb/N0), written so that a small P_M
   keeps its digits. */
function orthExact(M, g){
  const mu = Math.sqrt(2*Math.log2(M)*g), n = 400, lo = mu-9, hi = mu+9, h = (hi-lo)/n;
  let s = 0;
  for(let i=0;i<=n;i++){ const y = lo+i*h, w = (i===0||i===n) ? 1 : (i%2 ? 4 : 2);
    const q = Qf(y), miss = -Math.expm1((M-1)*Math.log1p(-Math.min(q, 1-1e-16)));
    s += w*Math.exp(-(y-mu)*(y-mu)/2)*miss; }
  return s*h/3/Math.sqrt(2*Math.PI);
}

/* A gallery of four everyday cases closing a section: the figures in a 2×2
   grid, and the cards beside them revealed one at a time. */
function realGallery(cfg){
  return { id:cfg.id, module:'M5', nav:cfg.nav, title:cfg.title, src:cfg.src,
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
const galPlane = (need, o) => plane(Object.assign({w:520, h:250, pad:{l:60,r:26,t:24,b:40}, need, xticksOverride:[], yticksOverride:[]}, o||{}));

/* ---- the navy opening ----------------------------------------------------
   The same four bits sent three ways. The page under this figure is navy, so
   the traces take the dark-page tints and the labels that page's ink. */
const NAVY = {axis:'rgba(239,231,216,.34)', tick:'#9EACB9', name:'#E6E2D9'};
const T_CY = '#4FBECE', T_INK = '#E6E2D9', T_MUT = '#9EACB9';
const OPEN_BITS = [1,0,1,1];
function figOpen(){
  const rows = [
    ['\\text{amplitude: ASK}', t=>OPEN_BITS[Math.min(3,Math.floor(t))] ? Math.cos(6*Math.PI*t) : 0],
    ['\\text{phase: PSK}',     t=>(OPEN_BITS[Math.min(3,Math.floor(t))] ? 1 : -1)*Math.cos(6*Math.PI*t)],
    ['\\text{frequency: FSK}', t=>Math.cos(2*Math.PI*(OPEN_BITS[Math.min(3,Math.floor(t))] ? 4 : 2)*t)]
  ];
  const parts = rows.map(([name, f], k)=>{
    const h = k===0 ? 150 : 128;
    const a = P.Axes(bare({w:560, h, xr:[-0.05,4.05], yr:[-1.25, k===0 ? 2.3 : 1.75], pad:{l:18,r:18,t:6,b:6}, chrome:NAVY}));
    for(let n=1;n<4;n++) seg(a, [[n,-1.2],[n,1.2]], {color:'rgba(239,231,216,.22)', width:1, dash:'2 4'});
    trace(a, f, 0, 4, {color:T_CY, width:2.3, n:900});
    lbl(a, 0.02, 1.45, name, T_INK, 'start', 15);
    if(k===0) OPEN_BITS.forEach((b,n)=>lbl(a, n+0.5, 2.0, String(b), T_MUT, 'middle', 16));
    return [a.svg(), h];
  });
  return stack(560, parts);
}

/* ---- 5.1 putting bits on a carrier ---------------------------------------- */

/* A baseband pulse stream s(t) in milliseconds, a raised-cosine bump every
   0.2 ms, and its product with a 40 kHz carrier. The spectrum is a smooth
   bump of half-width W = 5 kHz; the product holds two half-height copies at
   +-f_c. Frames: the baseband pair, the product in time, the copies moving
   out in frequency. */
const CAR = { an:[1,-1,1,1,-1,1], fc:40, W:5 };
const bump = t => Math.abs(t) < 0.2 ? Math.pow(Math.cos(Math.PI*t/0.4), 2) : 0;
const sBase = t => CAR.an.reduce((s,a,n)=>s + 0.9*a*bump(t-0.1-0.2*n), 0);
const specB = f => Math.abs(f) < CAR.W ? Math.pow(Math.cos(Math.PI*f/(2*CAR.W)), 2) : 0;
function figCarrier(v){
  const H = takeH(420), hA = Math.round(0.5*H), f = frameOf(v, 2);
  const oM = clamp01(f), oS = clamp01(f-1);
  const a = TAx({w:560, h:hA, xr:[0,1.2], yr:[-1.3,1.45], xlabel:'t\\;(\\text{ms})', ylabel:'s(t),\\;u(t)',
    pad:{l:56,r:26,t:24,b:36}, xt:[0,0.4,0.8], yticksOverride:[-1,0,1]});
  if(oM < 0.98) trace(a, sBase, 0, 1.2, {color:C.in, width:2.6, opacity:1-oM});
  if(oM > 0.02){
    trace(a, sBase, 0, 1.2, {color:C.muted, width:1.3, dash:'5 4', opacity:oM});
    trace(a, t=>-sBase(t), 0, 1.2, {color:C.muted, width:1.3, dash:'5 4', opacity:oM});
    trace(a, t=>sBase(t)*Math.cos(2*Math.PI*CAR.fc*t), 0, 1.2, {color:C.in, width:1.7, n:2400, opacity:oM});
  }
  const b = P.Axes({w:560, h:H-hA, xr:[-55,55], yr:[0,1.3], xlabel:'f\\;(\\text{kHz})', ylabel:'|S(f)|,\\;|U(f)|',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[-40,-20,0,20,40], yticksOverride:[], grid:false});
  leftTicks(b, [0.5,1]);
  const c = CAR.fc*oS, ht = 1-0.5*oS;
  if(oS < 0.02) b.curve(specB, {color:C.in, width:2.6, n:800});
  else [-c, c].forEach(m=>b.curve(fr=>ht*specB(fr-m), {color:C.in, width:2.6, n:1200}));
  if(oS > 0.9){ b.span(CAR.fc-CAR.W, CAR.fc+CAR.W, 0.66, '2W', {tex:true, color:C.mid, fs:15});
    lbl(b, -CAR.fc, 0.62, '\\tfrac12S(f+f_c)', C.in, 'middle', 14); }
  else if(oS < 0.1) b.span(-CAR.W, CAR.W, 1.1, '2W', {tex:true, color:C.mid, fs:15});
  return stack(560, [[a.svg(),hA],[b.svg(),H-hA]]);
}

/* The IQ modulator for four QPSK symbols, 00 01 11 10, one a press: the
   point, then I(t) and Q(t), then the carrier burst I cos - Q sin, drawn as
   far as the current frame. Two carrier cycles a symbol. */
const FCT = 2;
const IQ_I = t => QPSK[Math.min(3, Math.max(0, Math.floor(t)))][0];
const IQ_Q = t => QPSK[Math.min(3, Math.max(0, Math.floor(t)))][1];
const iqBurst = t => IQ_I(t)*Math.cos(2*Math.PI*FCT*t) - IQ_Q(t)*Math.sin(2*Math.PI*FCT*t);
const QOFF = [[0.52,0.2,'start'],[-0.52,0.2,'end'],[-0.52,-0.45,'end'],[0.52,-0.45,'start']];
function figIQ(v){
  /* Projected, the labels are 1.36 times larger and their margins took most of
     the plane's panel. The figure is then drawn on a wider box of the same
     shape, so its height on the page is unchanged and the margins give back
     room to the plane; each axis name sits just under its axis, since the
     plane has no tick row and the time axis carries its own under the data. */
  const big = P.labelScale() > 1, W = big ? 630 : 560, H = takeH(big ? 495 : 440), hA = Math.round((big ? 0.42 : 0.36)*H), hB = Math.round((big ? 0.25 : 0.22)*H), f = Math.min(4, frameOf(v, 4));
  const drop = big ? {xnameDrop:0} : {};
  const cur = Math.min(3, Math.max(0, Math.ceil(f-1e-9)-1));
  const a = plane(Object.assign({w:W, h:hA, need:[[-2.3,2.3],[-1.75,1.8]], xlabel:'I', ylabel:'Q', xticksOverride:[], yticksOverride:[], pad:{l:56,r:26,t:24,b:36}}, drop));
  QPSK.forEach((p,k)=>{ const seen = k < f - 1e-9;
    dot(a, p[0], p[1], {color:C.in, r:6.5, opacity:seen ? 1 : 0.35});
    lbl(a, p[0]+QOFF[k][0], p[1]+QOFF[k][1], QLAB[k], C.in, QOFF[k][2]); });
  if(f > 0.02){ const [x,y] = QPSK[cur], o = clamp01(f-cur);
    seg(a, [[x,0],[x,y],[0,y]], {color:C.mid, width:1.4, dash:'4 5', opacity:o});
    ring(a, x, y, {color:C.in, r:10, opacity:o}); }
  const b = TAx({w:W, h:hB, xr:[-0.05,4.05], yr:[-1.6,2.15], xlabel:'', ylabel:'I(t),\\;Q(t)',
    pad:{l:56,r:26,t:20,b:8}, yticksOverride:[-1,1]});
  for(let n=1;n<4;n++) b.vline(n, {color:C.muted, dash:'2 4', width:1});
  if(f > 0.01){
    const stair = j => { const pts = []; for(let n=0;n<Math.ceil(f);n++) pts.push([n, QPSK[n][j]], [Math.min(n+1, f), QPSK[n][j]]); return pts; };
    seg(b, stair(0), {color:C.mid, width:2.4});
    seg(b, stair(1), {color:C.mid, width:2.4, dash:'7 5'});
  }
  for(let n=0;n<4;n++){ const o = clamp01(f-n); if(o > 0.5) lbl(b, n+0.5, 1.72, QLAB[n], C.ink, 'middle', 16); }
  const c = TAx(Object.assign({w:W, h:H-hA-hB, xr:[-0.05,4.05], yr:[-1.9,1.9], xlabel:'t/T', ylabel:'s(t)',
    pad:{l:56,r:26,t:20,b:36}, xt:[0,1,2,3], yticksOverride:[-1,1]}, drop));
  [Math.SQRT2, -Math.SQRT2].forEach(y=>seg(c, [[0,y],[4,y]], {color:C.muted, width:1.1, dash:'4 5'}));
  if(f > 0.01) trace(c, iqBurst, 0, f, {color:C.in, width:2.2, n:Math.max(20, Math.round(500*f))});
  return stack(W, [[a.svg(),hA],[b.svg(),hB],[c.svg(),H-hA-hB]]);
}

/* BPSK for the bits 1 1 0 1, two carrier cycles a bit. The reader draws the
   waveform over the faint carrier; the answer is +cos for a one and -cos for
   a zero. */
const BP_BITS = [1,1,0,1];
function figBPSK(){
  const a = TAx(SZ({xr:[-0.05,4.05], yr:[-1.6,2.05], xlabel:'t/T_b', ylabel:'s(t)', xt:[0,1,2,3], yticksOverride:[-1,0,1]}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  for(let n=1;n<4;n++) a.vline(n, {color:C.muted, dash:'2 4', width:1});
  trace(a, t=>Math.cos(2*Math.PI*FCT*t), 0, 4, {color:C.muted, width:1.4, dash:'4 5', opacity:0.6, n:800});
  BP_BITS.forEach((b,n)=>lbl(a, n+0.5, 1.6, String(b), C.ink, 'middle', 17));
  a.raw('<g class="sk-key">');
  trace(a, t=>(BP_BITS[Math.min(3,Math.floor(t))] ? 1 : -1)*Math.cos(2*Math.PI*FCT*t), 0, 4, {color:C.in, width:2.6, n:900});
  a.raw('</g>');
  return a.svg();
}

/* BFSK: two tones over one bit, f_0 T_b = 3 and f_1 = f_0 + Delta f, and
   their correlation rho = sin(2 pi Delta f T_b)/(2 pi Delta f T_b), which is
   zero first at Delta f = 1/(2 T_b). */
const rhoF = x => Math.abs(x) < 1e-9 ? 1 : Math.sin(2*Math.PI*x)/(2*Math.PI*x);
function figBFSK(v){
  const df = v ? v.df : 0.5, H = takeH(420), hA = Math.round(0.46*H);
  const a = TAx({w:560, h:hA, xr:[0,1.02], yr:[-1.5,1.75], xlabel:'t/T_b', ylabel:'s_0(t),\\;s_1(t)',
    pad:{l:56,r:26,t:24,b:36}, xt:[0,0.5], yticksOverride:[-1,0,1]});
  trace(a, t=>Math.cos(6*Math.PI*t), 0, 1, {color:C.in, width:2.0, dash:'6 5', n:500});
  trace(a, t=>Math.cos(2*Math.PI*(3+df)*t), 0, 1, {color:C.in, width:2.5, n:500});
  const b = P.Axes({w:560, h:H-hA, xr:[0,2.05], yr:[-0.4,1.12], xlabel:'\\Delta f\\,T_b', ylabel:'\\rho',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[0,0.5,1,1.5,2], yticksOverride:[0,0.5,1]});
  b.curve(rhoF, {color:C.mid, width:2.4});
  dot(b, df, rhoF(df), {color:C.mid, r:6});
  lbl(b, 2.0, 0.9, '\\rho='+num(rhoF(df)), C.mid, 'end');
  return stack(560, [[a.svg(),hA],[b.svg(),H-hA]]);
}
/* Continuous-phase tones for the listen buttons: one frequency a bit. */
function tones(freqs, Tb){
  const ph = [0]; freqs.forEach((f,i)=>ph.push(ph[i] + 2*Math.PI*f*Tb));
  return { dur: freqs.length*Tb, f: t=>{ const i = Math.min(freqs.length-1, Math.max(0, Math.floor(t/Tb)));
    return Math.sin(ph[i] + 2*Math.PI*freqs[i]*(t-i*Tb)); } };
}

/* BASK for 1 0 1 1 0 with peak energy E = 2, so the amplitude is 2. Frames:
   the waveform, the energy of each bit and their average, the constellation
   on one axis with its threshold halfway. */
const BA_BITS = [1,0,1,1,0];
function figBASK(v){
  const H = takeH(420), hA = Math.round(0.47*H), hb = H-hA, f = frameOf(v, 2);
  const oE = clamp01(f)*(1-clamp01(f-1)), oC = clamp01(f-1);
  const a = TAx({w:560, h:hA, xr:[-0.05,5.05], yr:[-2.5,3.2], xlabel:'t/T_b', ylabel:'s(t)',
    pad:{l:56,r:26,t:24,b:36}, xt:[0,1,2,3,4], yticksOverride:[-2,0,2]});
  for(let n=1;n<5;n++) a.vline(n, {color:C.muted, dash:'2 4', width:1});
  trace(a, t=>BA_BITS[Math.min(4,Math.floor(t))] ? 2*Math.cos(2*Math.PI*FCT*t) : 0, 0, 5, {color:C.in, width:2.4, n:1000});
  BA_BITS.forEach((b,n)=>lbl(a, n+0.5, 2.55, String(b), C.ink, 'middle', 17));
  const e = P.Axes({w:560, h:hb, xr:[-0.05,5.05], yr:[0,3.1], xlabel:'\\text{bit }n', ylabel:'E_n',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[], yticksOverride:[1,2]});
  BA_BITS.forEach((b,n)=>{ if(!b) return; const X0 = e.sx(n+0.2), X1 = e.sx(n+0.8), Y0 = e.sy(0), Y1 = e.sy(2);
    e.raw(`<rect x="${f2(X0)}" y="${f2(Y1)}" width="${f2(X1-X0)}" height="${f2(Y0-Y1)}" fill="${rgba(C.mid,0.26)}" stroke="${C.mid}" stroke-width="1.6"/>`); });
  e.hline(1, {color:C.ink, dash:'6 4', width:1.5, opacity:1});
  lbl(e, 5.0, 1.2, 'E_b=E/2', C.ink, 'end');
  lbl(e, 2.5, 2.4, 'E', C.mid, 'middle');
  const c = P.Axes({w:560, h:hb, xr:[-0.9,2.6], yr:[-1,1.3], xlabel:'\\psi', ylabel:'',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[0], yticksOverride:[], grid:false});
  const r2 = Math.SQRT2;
  c.rect(-0.9,-1,r2/2,1.3,{fill:C.dec.in}); c.rect(r2/2,-1,2.6,1.3,{fill:C.dec.out});
  c.vline(r2/2, {color:C.ink, dash:'6 4', width:1.5, opacity:1});
  dot(c, 0, 0, {color:C.in, r:7}); dot(c, r2, 0, {color:C.in, r:7});
  lbl(c, 0, 0.35, '\\mathbf{s}_0=0', C.in, 'middle');
  lbl(c, r2, 0.35, '\\mathbf{s}_1=\\sqrt{E}', C.in, 'middle');
  c.span(0, r2, -0.45, 'd=\\sqrt{E}=\\sqrt{2E_b}', {tex:true, color:C.mid, fs:15});
  lbl(c, r2/2+0.05, 1.0, '\\text{threshold}', C.ink, 'start', 14);
  return `<svg viewBox="0 0 560 ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,560,hA)}${fade(place(e.svg(),0,hA,560,hb), oE)}${fade(place(c.svg(),0,hA,560,hb), oC)}</svg>`;
}

/* The two binary curves on one axis, with the 3 dB gap drawn at 1e-5. */
const G5 = { bpsk: reach(d=>PE.bpsk(dB(d)), 1e-5, 0, 20), bfsk: reach(d=>PE.bfsk(dB(d)), 1e-5, 0, 20) };
function binAx(){
  const a = logAx(SZ({xr:[0,15], yr:[-7,0.3], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'P_b', xt:[0,3,6,9,12], yticksOverride:P.decades(-7,0)}));
  a.curve(d=>lg10(PE.bfsk(dB(d))), {color:C.err, width:2.4, dash:'7 5'});
  a.curve(d=>lg10(PE.bpsk(dB(d))), {color:C.err, width:2.6});
  return a;
}
function figBinaryPe(v){
  const x0 = v ? v.g : 9.6, a = binAx();
  arrow(a, G5.bpsk, -5, G5.bfsk, -5, {color:C.ink, width:1.8, head:0.7});
  lbl(a, G5.bpsk+0.3, -4.75, '3\\text{ dB}', C.ink, 'start');
  a.vline(x0, {color:C.ink, dash:'5 4', width:1.3});
  const pb = PE.bpsk(dB(x0)), pf = PE.bfsk(dB(x0));
  if(Math.log10(pb) > -7) dot(a, x0, Math.log10(pb), {color:C.err, r:5.5});
  if(Math.log10(pf) > -7) dot(a, x0, Math.log10(pf), {color:C.err, r:5.5});
  lbl(a, 0.4, -5.95, '\\text{BPSK: }P_b='+sci(pb), C.err);
  lbl(a, 0.4, -6.65, '\\text{BFSK, BASK: }P_b='+sci(pf), C.err);
  return a.svg();
}

/* The worked example: E_b/N_0 = 10, so 10 dB, read off both curves. */
function figExBinary(v){
  const f = frameOf(v, 3), op = k => clamp01(f-k+1), a = binAx();
  if(op(1) > 0.02) a.vline(10, {color:C.ink, dash:'5 4', width:1.4, opacity:op(1)});
  if(op(2) > 0.02){ dot(a, 10, Math.log10(PE.bpsk(10)), {color:C.err, r:6, opacity:op(2)});
    if(op(2) > 0.5) lbl(a, 9.7, -5.75, '3.87\\times10^{-6}', C.err, 'end'); }
  if(op(3) > 0.02){ dot(a, 10, Math.log10(PE.bfsk(10)), {color:C.err, r:6, opacity:op(3)});
    if(op(3) > 0.5) lbl(a, 10.35, -2.75, '7.83\\times10^{-4}', C.err); }
  return a.svg();
}

/* 5.1. An NFC reader, FM radio's RDS, a car key fob and GPS. */
const NFC_TB = 1000/106;
const FOB = [1,0,1,1,0,0,1,0,1,1,1,0];
const sincF = x => Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
const REAL_BINARY = realGallery({ id:'m5-real-binary', nav:'Binary keying around us',
  title:'Binary keying around us', eyebrow:'Module 5 · Putting bits on a carrier', src:'book 8.5.1, 8.6.1',
  objective:'Recognise amplitude and phase keying in contactless cards, FM radio, key fobs and satellite navigation.',
  keywords:'examples nfc 13.56 mhz 106 kb/s ask rds 57 khz 1187.5 bpsk key fob 433.92 mhz on-off keying gps 1575.42 mhz bpsk sinc spectrum',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[0,10,20,30], xr:[-1.5,4*NFC_TB+1.5], yr:[-0.15,1.35], xlabel:'t\\;(\\mu\\text{s})', ylabel:'A(t)', yticksOverride:[0,1]}));
      a.poly(outline([1,0,1,1].map((b,n)=>[n*NFC_TB, (n+1)*NFC_TB, b]), -1.5, 4*NFC_TB+1.5), {color:C.in, width:2.4});
      return a.svg(); },
      'An NFC reader sends $106$ kb/s by switching the amplitude of a $13.56$ MHz carrier, $s(t)=A(t)\\cos(2\\pi f_ct)$. One bit lasts $9.43\\ \\mu$s.'],
    [()=>{ const a = TAx(EXO({xt:[-0.1,0], xr:[-0.105,0.105], yr:[-1.4,1.4], xlabel:'t\\;(\\text{ms})', ylabel:'s(t)', yticksOverride:[], grid:false}));
      leftTicks(a, [-1,0,1]);
      a.vline(0, {color:C.muted, dash:'2 4'});
      a.curve(t=>(t < 0 ? 1 : -1)*Math.cos(2*Math.PI*57*t), {color:C.in, width:2.2, n:1400});
      return a.svg(); },
      'FM radio sends RDS data at $1187.5$ b/s by phase keying a $57$ kHz subcarrier, $s(t)=\\pm\\cos(2\\pi f_ct)$. One bit holds $48$ carrier cycles.'],
    [()=>{ const a = TAx(EXO({xt:[0,4,8], xr:[-0.8,12], yr:[-0.2,1.4], xlabel:'n', ylabel:'A[n]', yticksOverride:[0,1]}));
      a.stem(FOB.map((b,n)=>[n,b]), {color:C.in, showZero:true});
      return a.svg(); },
      'A car key fob switches a $433.92$ MHz carrier on and off. Bit $n$ sends $A[n]\\cos(2\\pi f_ct)$ with $A[n]\\in\\{0,1\\}$.'],
    [()=>{ const a = TAx(EXO({xt:[-3,-2,-1,0,1,2,3], xr:[-3.3,3.3], yr:[0,1.2], xlabel:'f-f_c\\;(\\text{MHz})', ylabel:'S(f)/T_c', yticksOverride:[], grid:false}));
      leftTicks(a, [0.5,1]);
      a.curve(x=>Math.pow(sincF(x/1.023), 2), {color:C.in, width:2.4, n:900});
      return a.svg(); },
      'GPS phase-keys a $1575.42$ MHz carrier at $1.023$ Mchip/s. Its spectrum $T_c\\operatorname{sinc}^{2}((f-f_c)T_c)$, with $\\operatorname{sinc}x=\\sin(\\pi x)/(\\pi x)$, has nulls at $\\pm1.023$ MHz.']
  ],
  notes:[
    {t:'note', kind:'def', head:'One switch a bit', html:'Each system changes one thing about its carrier for each bit: the amplitude or the sign.'},
    {t:'note', kind:'def', head:'Energy on the ones', html:'On-off keying spends energy only on the ones. With equal ones and zeros, $E_b$ is half the peak energy.'},
    {t:'note', kind:'warn', head:'Bit rate and band', html:'A faster bit rate widens the spectrum. The GPS main lobe is $2\\times1.023=2.046$ MHz wide.'}
  ]});

/* ---- 5.2 phase-shift keying ------------------------------------------------ */

/* M points on the unit circle (E_s = 1), their wedges, the chord between two
   neighbours and the angle 2 pi/M between them. */
const altFill = n => Array.from({length:n}, (_,i)=>i%2 ? C.dec.mid : C.dec.in);
function figMPSK(v){
  const k = v ? v.k : 3, M = 1 << k, pts = PSKpts(M), d = 2*Math.sin(Math.PI/M);
  const a = plane({need:[[-1.75,1.75],[-1.6,1.6]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  drawCells(a, pts, {fills:altFill(M), lines:false});
  for(let j=0;j<M;j++){ const u = (2*j+1)*Math.PI/M; seg(a, [[0,0],[1.3*Math.cos(u), 1.3*Math.sin(u)]], {color:C.muted, width:1.3}); }
  circle(a, 1, {color:C.muted, width:1.1});
  if(M > 2) arc(a, 0.36, 0, 2*Math.PI/M, {color:C.mid, width:2});
  seg(a, [pts[0], pts[1]], {color:C.err, width:2.8});
  pts.forEach(p=>a.point(p[0], p[1], {color:C.in, r:M > 16 ? 4.5 : 6}));
  lbl(a, a.o.xr[0]+0.06, a.o.yr[1]-0.18, 'M='+M+':\\ d_{\\min}='+num(d,3)+'\\sqrt{E_s}', C.err);
  return a.svg();
}

/* A QPSK burst and its two halves. The I half is a BPSK signal on the
   cosine, the Q half a BPSK signal on the sine; the receiver decides each
   sign on its own. */
function figQPSK(v){
  const H = takeH(430), hp = Math.round(0.31*H), f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const panel = (h, ylabel, fn, o, last) => {
    const a = TAx({w:560, h, xr:[-0.05,4.05], yr:[-1.9,2.3], xlabel:last ? 't/T' : '', ylabel,
      pad:{l:56,r:26,t:20,b:last ? 36 : 8}, xt:last ? [0,1,2,3] : null, yticksOverride:[-1,1]});
    for(let n=1;n<4;n++) a.vline(n, {color:C.muted, dash:'2 4', width:1});
    if(o > 0.02) trace(a, fn, 0, 4, {color:C.in, width:2.2, n:900, opacity:o});
    return a; };
  const A = panel(hp, 's(t)', iqBurst, 1, false);
  const B = panel(hp, 's_I(t)', t=>IQ_I(t)*Math.cos(2*Math.PI*FCT*t), op(1), false);
  const D = panel(H-2*hp, 's_Q(t)', t=>-IQ_Q(t)*Math.sin(2*Math.PI*FCT*t), op(2), true);
  if(op(3) > 0.5) for(let n=0;n<4;n++){
    lbl(B, n+0.5, 1.78, QPSK[n][0] > 0 ? '+1' : '-1', C.out, 'middle', 16);
    lbl(D, n+0.5, 1.78, QPSK[n][1] > 0 ? '+1' : '-1', C.out, 'middle', 16); }
  return stack(560, [[A.svg(),hp],[B.svg(),hp],[D.svg(),H-2*hp]]);
}

/* 8-PSK decided by the angle: three received points, one a frame, each with
   its angle theta and the point whose phase is nearest. */
const DET = [[50,1.18,[0.12,0.13,'start']],[160,0.82,[-0.12,0.2,'end']],[-100,1.08,[-0.14,-0.12,'end']]];
function figPSKDetect(v){
  const f = frameOf(v, 3), op = k => clamp01(f-k+1), pts = PSKpts(8);
  const a = plane({need:[[-1.75,1.75],[-1.6,1.6]], xticksOverride:[-1,1], yticksOverride:[-1,1], xlabel:'y_1', ylabel:'y_2'});
  drawCells(a, pts, {fills:altFill(8)});
  pts.forEach(p=>a.point(p[0], p[1], {color:C.in, r:6}));
  DET.forEach(([deg, r, L], k)=>{
    const o = op(k+1)*(k < 2 ? 1-0.8*op(k+2) : 1); if(o < 0.02) return;
    const th = deg*Math.PI/180, x = r*Math.cos(th), y = r*Math.sin(th);
    arc(a, 0.3, 0, th, {color:C.mid, width:2, opacity:o});
    seg(a, [[0,0],[x,y]], {color:C.mid, width:1.4, dash:'4 4', opacity:o});
    const m = nearest(pts, x, y);
    ring(a, pts[m][0], pts[m][1], {opacity:o});
    dot(a, x, y, {color:C.out, r:6.5, opacity:o});
    if(o > 0.5) lbl(a, x+L[0], y+L[1], '\\theta='+deg+'^{\\circ}', C.mid, L[2]);
  });
  return a.svg();
}

/* M-PSK symbol error against E_b/N_0 for M = 2 to 32, from the
   nearest-neighbour form (exact for M = 2), with a marker at the slider. */
const MS_PSK = [2,4,8,16,32];
const PSK_DASH = {2:null, 4:'2 4', 8:'7 5', 16:'12 5 3 5', 32:'3 3'};
function figMPSKPe(v){
  const x0 = v ? v.g : 10;
  const a = logAx(SZ({xr:[0,26], yr:[-7,1.7], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'P_e', xt:[0,5,10,15,20], yticksOverride:P.decades(-7,0)}));
  MS_PSK.forEach(M=>a.curve(d=>lg10(PE.psk(M, dB(d))), {color:C.err, width:M===2 ? 2.8 : 2.2, dash:PSK_DASH[M]}));
  [[4,'M=2,\\,4'],[8,'M=8'],[16,'M=16'],[32,'M=32']].forEach(([M,t])=>{
    const x = reach(d=>PE.psk(M, dB(d)), 1e-6, 0, 40); lbl(a, x-0.6, -6.3, t, C.err, 'end'); });
  seg(a, [[x0,-5.8],[x0,0.05]], {color:C.ink, dash:'5 4', width:1.3});
  [4,8].forEach(M=>{ const y = Math.log10(PE.psk(M, dB(x0))); if(y > -5.8) dot(a, x0, y, {color:C.err, r:5.5}); });
  lbl(a, 0.4, 1.2, 'M=4:\\ P_e='+sci(PE.psk(4, dB(x0))), C.err, 'start');
  lbl(a, 13.4, 1.2, 'M=8:\\ P_e='+sci(PE.psk(8, dB(x0))), C.err, 'start');
  return a.svg();
}

/* 8-PSK with natural and Gray labels. The chords between neighbours carry
   the number of bits in which their labels differ; the last frame sends
   300 noisy copies of the point at 0 degrees, sigma = 0.2 against E_s = 1,
   and counts the symbol and bit errors under Gray labels. */
const GRAY_Z = gauss(5201, 600, 1), GRAY_S = 0.2;
const pop = x => { let c = 0; while(x){ c += x & 1; x >>= 1; } return c; };
const grayCount = () => { const pts = PSKpts(8); let k = 0, b = 0; const cl = [];
  for(let i=0;i<300;i++){ const x = 1+GRAY_S*GRAY_Z[2*i], y = GRAY_S*GRAY_Z[2*i+1], m = nearest(pts, x, y);
    if(m){ k++; b += pop(gray(0) ^ gray(m)); } cl.push([x, y, m !== 0]); }
  return {k, b, cl}; };
function figGray(v){
  const f = frameOf(v, 3), op = k => clamp01(f-k+1), pts = PSKpts(8);
  const a = plane({need:[[-1.95,1.95],[-1.6,1.6]], xticksOverride:[], yticksOverride:[]});
  const oR = 1 - op(1)*(1-op(3));
  if(oR > 0.02) drawCells(a, pts, {fills:altFill(8), opacity:oR});
  circle(a, 1, {color:C.muted, width:1.1});
  const useGray = op(2) >= 0.5, labOf = i => useGray ? gray(i) : i;
  const oC = op(1)*(1-op(3));
  if(oC > 0.02) for(let i=0;i<8;i++){ const j = (i+1)%8, c = pop(labOf(i) ^ labOf(j));
    seg(a, [pts[i], pts[j]], {color:c > 1 ? C.err : C.mid, width:2.4, opacity:oC});
    if(oC > 0.5){ const u = (2*i+1)*Math.PI/8; lbl(a, 0.7*Math.cos(u), 0.7*Math.sin(u)-0.07, String(c), c > 1 ? C.err : C.mid, 'middle', 15); } }
  if(op(3) > 0.02){ const g = grayCount(); cloudPts(a, g.cl, {opacity:op(3)});
    /* two short lines in the top-left wedge, clear of the boundary at 112.5 degrees */
    if(op(3) > 0.5){ lbl(a, a.o.xr[0]+0.06, a.o.yr[1]-0.18, '\\text{symbol errors }'+g.k, C.err);
      a.note(a.o.xr[0]+0.06, a.o.yr[1]-0.18, '\\text{bit errors }'+g.b, {tex:true, fs:15, color:C.err, anchor:'start', dy:24*P.labelScale()}); } }
  pts.forEach((p,i)=>{ a.point(p[0], p[1], {color:C.in, r:6});
    const u = 2*Math.PI*i/8, onX = i%4===0, onY = i%4===2;
    const x = onY ? 0.1 : 1.3*Math.cos(u), y = onX ? 0.12 : 1.3*Math.sin(u)-0.06;
    lbl(a, x, y, '\\mathtt{'+bin(labOf(i),3)+'}', C.in, onY || x > 0 ? 'start' : 'end'); });
  return a.svg();
}

/* The worked 8-PSK example: the sent point, its wedge of +-22.5 degrees,
   and the two half-planes nearer a neighbour. */
function figExPSK(v){
  const f = frameOf(v, 2), op = k => clamp01(f-k+1), pts = PSKpts(8);
  const a = plane({need:[[-1.5,1.9],[-1.5,1.5]], xticksOverride:[], yticksOverride:[]});
  const X = a.o.xr, Y = a.o.yr, full = [[X[0],Y[0]],[X[1],Y[0]],[X[1],Y[1]],[X[0],Y[1]]];
  circle(a, 1, {color:C.muted, width:1.1});
  if(op(1) > 0.02){ const u = Math.PI/8, su = Math.sin(u), cu = Math.cos(u);
    fillPoly(a, clipHalf(clipHalf(full, -su, cu, 0), -su, -cu, 0), C.dec.in, op(1));
    const L = Math.min(X[1]/cu, Y[1]/su);
    [u,-u].forEach(w=>seg(a, [[0,0],[L*Math.cos(w), L*Math.sin(w)]], {color:C.ink, width:1.4, dash:'6 4', opacity:op(1)})); }
  if(op(2) > 0.02) [1,7].forEach(j=>{ const q = pts[j];
    fillPoly(a, clipHalf(full, 1-q[0], -q[1], 0), rgba(C.err, 0.14), op(2));
    seg(a, [pts[0], q], {color:C.mid, width:2.6, opacity:op(2)}); });
  if(op(2) > 0.5) lbl(a, 0.74, 0.47, 'd_{\\min}', C.mid, 'end');   /* inside the chord, clear of the wedge edge */
  pts.forEach(p=>a.point(p[0], p[1], {color:C.in, r:6}));
  lbl(a, 1.14, -0.1, '\\mathbf{s}_0', C.in);
  return a.svg();
}

/* A carrier-phase error phi rotates every received point. QPSK on the unit
   circle, 50 copies of each point with sigma = 0.18, decided in the fixed
   quadrants; the green rings are the rotated points without noise. */
const PO_Z = gauss(5202, 400, 1), PO_S = 0.18;
const Q1 = QPSK.map(p=>[p[0]/Math.SQRT2, p[1]/Math.SQRT2]);
function poCloud(phi){
  const t = phi*Math.PI/180, c = Math.cos(t), s = Math.sin(t), cl = []; let k = 0;
  for(let i=0;i<200;i++){ const p = Q1[i%4];
    const x = c*p[0]-s*p[1]+PO_S*PO_Z[2*i], y = s*p[0]+c*p[1]+PO_S*PO_Z[2*i+1];
    const bad = nearest(Q1, x, y) !== i%4; if(bad) k++; cl.push([x, y, bad]); }
  return {k, cl};
}
function figPhaseOffset(v){
  const phi = v ? v.phi : 20, t = phi*Math.PI/180, c = Math.cos(t), s = Math.sin(t);
  const a = plane({need:[[-1.75,1.75],[-1.6,1.6]], xticksOverride:[-1,1], yticksOverride:[-1,1], xlabel:'y_1', ylabel:'y_2'});
  drawCells(a, Q1);
  const g = poCloud(phi); cloudPts(a, g.cl);
  Q1.forEach(p=>a.point(p[0], p[1], {color:C.in, r:6.5}));
  Q1.forEach(p=>ring(a, c*p[0]-s*p[1], s*p[0]+c*p[1], {color:C.out, r:9, width:2.2}));
  if(phi > 2) arc(a, 0.42, Math.PI/4, Math.PI/4+t, {color:C.mid, width:2.2});
  lbl(a, a.o.xr[0]+0.06, a.o.yr[1]-0.14, '\\varphi='+phi+'^{\\circ}:\\ \\text{wrong }'+g.k+'\\text{ of }200', g.k ? C.err : C.ink);
  return a.svg();
}

/* Differential encoding of 1 0 1 1 from theta_0 = 0: a one adds pi, a zero
   adds nothing. The reader marks theta_n; the answer is 0, pi, pi, 0, pi. */
const DP_BITS = [1,0,1,1], DP_TH = [0,1,1,0,1];
function figDPSK(){
  const a = TAx(SZ({xr:[-0.6,4.6], yr:[-0.3,1.8], xlabel:'n', ylabel:'\\theta_n/\\pi', xt:[0,1,2,3,4], yticksOverride:[0,0.5,1]}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  DP_BITS.forEach((b,i)=>lbl(a, i+1, 1.5, 'b_'+(i+1)+'='+b, C.ink, 'middle', 16));
  a.stem([[0,0]], {color:C.in, showZero:true});
  lbl(a, 0.12, 0.1, '\\theta_0=0', C.in, 'start', 14);
  a.raw('<g class="sk-key">');
  a.stem(DP_TH.slice(1).map((y,i)=>[i+1, y]), {color:C.in, showZero:true});
  a.raw('</g>');
  return a.svg();
}

/* Binary DPSK against BPSK: 1/2 exp(-Eb/N0) against Q(sqrt(2Eb/N0)). */
const G_DPSK = reach(d=>PE.dpsk(dB(d)), 1e-5, 0, 20);
function figDPSKPe(v){
  const x0 = v ? v.g : 10;
  const a = logAx(SZ({xr:[0,15], yr:[-7,0.3], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'P_b', xt:[0,3,6,9,12], yticksOverride:P.decades(-7,0)}));
  a.curve(d=>lg10(PE.dpsk(dB(d))), {color:C.err, width:2.4, dash:'7 5'});
  a.curve(d=>lg10(PE.bpsk(dB(d))), {color:C.err, width:2.6});
  arrow(a, G5.bpsk-0.9, -5, G5.bpsk, -5, {color:C.ink, width:1.8, head:0.6});
  arrow(a, G_DPSK+0.9, -5, G_DPSK, -5, {color:C.ink, width:1.8, head:0.6});
  lbl(a, G_DPSK+1.0, -4.9, '0.75\\text{ dB}', C.ink, 'start');
  a.vline(x0, {color:C.ink, dash:'5 4', width:1.3});
  const pb = PE.bpsk(dB(x0)), pd = PE.dpsk(dB(x0));
  if(Math.log10(pb) > -7) dot(a, x0, Math.log10(pb), {color:C.err, r:5.5});
  if(Math.log10(pd) > -7) dot(a, x0, Math.log10(pd), {color:C.err, r:5.5});
  lbl(a, 0.4, -5.95, '\\text{BPSK: }P_b='+sci(pb), C.err);
  lbl(a, 0.4, -6.65, '\\text{DPSK: }P_b='+sci(pd), C.err);
  return a.svg();
}

/* 5.2. 802.11b Wi-Fi, satellite television, Bluetooth EDR and DVB-S2. */
const WB_BITS = [1,1,0,1,0,0,1,1,1,0,1];
const WB_TH = WB_BITS.reduce((o,b)=>{ o.push((o[o.length-1]+b)%2); return o; }, [0]);
const DVB_Z = gauss(5203, 480, 1);
const EDR = [0,1,4,3,0,1];
const REAL_PSK = realGallery({ id:'m5-real-psk', nav:'Phase keying around us',
  title:'Phase keying around us', eyebrow:'Module 5 · Phase-shift keying', src:'book 8.6.1, 8.6.4',
  objective:'Recognise differential and coherent phase keying in Wi-Fi, satellite television and Bluetooth.',
  keywords:'examples 802.11b dbpsk dqpsk 1 mb/s 2 mb/s dvb-s qpsk gray bluetooth edr pi/4-dqpsk 8dpsk dvb-s2 8psk phase change',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[0,4,8], xr:[-0.6,11], yr:[-0.2,1.4], xlabel:'t\\;(\\mu\\text{s})', ylabel:'\\theta_n/\\pi', yticksOverride:[0,1]}));
      a.stem(WB_TH.map((y,n)=>[n,y]), {color:C.in, showZero:true});
      return a.svg(); },
      '802.11b Wi-Fi at $1$ Mb/s sends one bit a microsecond as a phase change of $0$ or $\\pi$: $\\theta_n=\\theta_{n-1}+\\pi b_n$. At $2$ Mb/s it uses four phase changes.'],
    [()=>{ const a = galPlane([[-1.55,1.55],[-1.35,1.35]]);
      drawCells(a, Q1);
      cloudPts(a, Array.from({length:240}, (_,i)=>{ const p = Q1[i%4]; return [p[0]+0.13*DVB_Z[2*i], p[1]+0.13*DVB_Z[2*i+1], false]; }), {r:1.8});
      Q1.forEach((p,k)=>{ a.point(p[0], p[1], {color:C.in, r:5.5}); lbl(a, p[0]*1.62, p[1]*1.62-0.06, '\\mathtt{'+QLAB[k]+'}', C.in, p[0] > 0 ? 'start' : 'end', 14); });
      return a.svg(); },
      'Satellite television (DVB-S) sends QPSK with Gray labels. Each bit sees its own BPSK link, $P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.'],
    [()=>{ const a = galPlane([[-1.5,1.5],[-1.3,1.3]]), pts = PSKpts(8);
      circle(a, 1, {color:C.muted, width:1.1});
      for(let i=1;i<EDR.length;i++){ const p = pts[EDR[i-1]], q = pts[EDR[i]];
        arrow(a, p[0]*0.93, p[1]*0.93, q[0]*0.93, q[1]*0.93, {color:C.mid, width:2, head:0.7}); }
      pts.forEach(p=>a.point(p[0], p[1], {color:C.in, r:5}));
      return a.svg(); },
      'Bluetooth EDR at $2$ Mb/s uses $\\pi/4$-DQPSK. Each symbol turns the phase by $\\Delta\\theta\\in\\{\\pm\\pi/4,\\pm3\\pi/4\\}$, so no step passes through the origin.'],
    [()=>{ const a = galPlane([[-1.5,1.5],[-1.3,1.3]]), pts = PSKpts(8, 1, Math.PI/8);
      drawCells(a, pts, {fills:altFill(8)});
      seg(a, [pts[0], pts[1]], {color:C.err, width:2.4});
      pts.forEach(p=>a.point(p[0], p[1], {color:C.in, r:5}));
      return a.svg(); },
      'Satellite DVB-S2 adds 8PSK to QPSK. Neighbouring points are $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/8)=0.765\\sqrt{E_s}$ apart.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Phase alone', html:'PSK keeps the amplitude constant. The power amplifier sees one level.'},
    {t:'note', kind:'def', head:'Differential phase', html:'802.11b and Bluetooth EDR carry the bits in phase changes. The receiver needs no absolute carrier phase.'},
    {t:'note', kind:'warn', head:'Crowding', html:'Beyond eight points the circle crowds. Satellite links then add a second ring, and other links move to QAM.'}
  ]});

/* ---- 5.3 amplitude and quadrature ------------------------------------------ */

/* M-PAM on one axis at unit average energy: A = sqrt(3/(M^2-1)), points at
   (2m-1-M)A, thresholds halfway. The bracket marks d_min = 2A. */
function figMask(v){
  const k = v ? v.k : 2, M = 1 << k, A = Math.sqrt(3/(M*M-1));
  const pts = Array.from({length:M}, (_,m)=>(2*m+1-M)*A);
  const a = P.Axes(SZ({xr:[-2,2], yr:[-1,1.6], xlabel:'\\psi', ylabel:'', xticksOverride:[-1,0,1], yticksOverride:[], grid:false}));
  const th = pts.slice(1).map((p,i)=>(p+pts[i])/2), edges = [-2, ...th, 2];
  pts.forEach((p,i)=>a.rect(edges[i], -1, edges[i+1], 1, {fill:i%2 ? C.dec.mid : C.dec.in}));
  th.forEach(t=>seg(a, [[t,-1],[t,1]], {color:C.ink, width:1.3, dash:'6 4'}));
  /* the bracket on the outer pair, its name beyond the last point: a name
     centred on the bracket would sit on a threshold or on the axis */
  a.span(pts[M-2], pts[M-1], -0.45, '', {color:C.err});
  lbl(a, pts[M-1]+0.07, -0.45, 'd_{\\min}', C.err, 'start');
  pts.forEach(p=>dot(a, p, 0, {color:C.in, r:M > 8 ? 5 : 7}));
  lbl(a, -1.95, 1.28, 'M='+M+':\\ d_{\\min}='+num(2*A,3)+'\\sqrt{E_s}', C.err);
  return a.svg();
}

/* Four-level ASK at -3, -1, 1, 3 (units of A): each point's neighbours in
   turn, one point a frame, then the average count. */
const A4 = [-3,-1,1,3], NB4 = [1,2,2,1];
function figExASK4(v){
  const f = frameOf(v, 5);
  const a = P.Axes(SZ({xr:[-4.3,4.3], yr:[-1.4,2.7], xlabel:'\\psi/A', ylabel:'', xticksOverride:A4, yticksOverride:[], grid:false}));
  [-2,0,2].forEach(t=>seg(a, [[t,-1],[t,0.5]], {color:C.muted, width:1.2, dash:'5 4'}));
  const hump = (x1, x2, o) => seg(a, Array.from({length:41}, (_,i)=>{ const x = x1+(x2-x1)*i/40, u = 2*i/40-1; return [x, 0.18+0.75*(1-u*u)]; }), {color:C.mid, width:2.2, opacity:o});
  A4.forEach((x,k)=>{ const o = clamp01(f-k), cur = o*(1-clamp01(f-k-1));
    if(cur > 0.02){ if(k > 0) hump(A4[k-1], x, cur); if(k < 3) hump(x, A4[k+1], cur); }
    if(o > 0.5) lbl(a, x, 1.25, String(NB4[k]), C.mid, 'middle', 17); });
  A4.forEach((x,k)=>{ dot(a, x, 0, {color:C.in, r:7}); lbl(a, x, -0.72, '\\mathbf{s}_'+(k+1), C.in, 'middle'); });
  if(f > 4.5) lbl(a, 0.3, 2.2, '\\bar N_{\\min}=\\tfrac{1+2+2+1}{4}=1.5', C.ink, 'start', 17);   /* right of the axis */
  return a.svg();
}

/* 16-QAM built from two 4-PAM axes with Gray labels. Frames: the I levels,
   the Q levels, the grid with its 4-bit labels, and the neighbour count of
   each point: 2 at a corner, 3 on an edge, 4 inside. */
const nb16 = p => QAM16.filter(q=>Math.abs((p[0]-q[0])**2+(p[1]-q[1])**2-4) < 1e-9).length;
function figQAM(v){
  const f = frameOf(v, 3), oQ = clamp01(f), oG = clamp01(f-1), oN = clamp01(f-2);
  const a = plane({need:[[-4.8,4.8],[-4.6,4.4]], xticksOverride:[], yticksOverride:[]});
  if(oG < 0.98){ const o = 1-oG;
    LV4.forEach((x,i)=>{ dot(a, x, 0, {color:C.in, r:6.5, opacity:o});
      if(o > 0.5) lbl(a, x, 0.4, '\\mathtt{'+G4[i]+'}', C.in, 'middle', 14); });
    if(oQ > 0.02) LV4.forEach((y,i)=>{ dot(a, 0, y, {color:C.mid, r:6.5, opacity:oQ*o});
      if(oQ*o > 0.5) lbl(a, 0.3, y-0.12, '\\mathtt{'+G4[i]+'}', C.mid, 'start', 14); }); }
  if(oN > 0.02) QAM16.forEach(p=>QAM16.forEach(q=>{
    if(Math.abs((p[0]-q[0])**2+(p[1]-q[1])**2-4) < 1e-9 && (q[0] > p[0] || q[1] > p[1])) seg(a, [p,q], {color:C.mid, width:1.6, opacity:0.6*oN}); }));
  if(oG > 0.02) QAM16.forEach(p=>{ dot(a, p[0], p[1], {color:C.in, r:6.5, opacity:oG});
    if(oG > 0.5 && oN < 0.5) lbl(a, p[0], p[1]+0.45, '\\mathtt{'+G4[LV4.indexOf(p[0])]+G4[LV4.indexOf(p[1])]+'}', C.in, 'middle', 13);
    if(oN >= 0.5) lbl(a, p[0]+0.3, p[1]+0.3, String(nb16(p)), C.mid, 'start', 15); });
  if(oN >= 0.5) lbl(a, 0.35, -4.3, '\\bar N_{\\min}=\\tfrac{4(2)+8(3)+4(4)}{16}=3', C.ink, 'start', 16);   /* right of the axis */
  return a.svg();
}

/* Square M-QAM: the exact 1 - (1 - P_sqrtM)^2 and the nearest-neighbour
   form, against E_b/N_0. */
const MS_QAM = [4,16,64];
function figQAMPe(v){
  const x0 = v ? v.g : 12;
  const a = logAx(SZ({xr:[0,24], yr:[-7,2.5], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'P_e', xt:[0,5,10,15], yticksOverride:P.decades(-7,0)}));
  MS_QAM.forEach(M=>{
    a.curve(d=>lg10(PE.qamNN(M, dB(d))), {color:C.mid, width:2.0, dash:'3 4'});
    a.curve(d=>lg10(PE.qam(M, dB(d))), {color:C.err, width:2.5});
    const x = reach(d=>PE.qam(M, dB(d)), 1e-6, 0, 40); lbl(a, x-0.35, -6.3, 'M='+M, C.err, 'end'); });
  seg(a, [[x0,-5.8],[x0,0.05]], {color:C.ink, dash:'5 4', width:1.3});
  const pe = PE.qam(16, dB(x0)), pn = PE.qamNN(16, dB(x0));
  if(Math.log10(pe) > -5.8) dot(a, x0, Math.log10(pe), {color:C.err, r:5.5});
  lbl(a, 0.4, 1.95, '16\\text{-QAM exact: }'+sci(pe), C.err, 'start');
  lbl(a, 0.4, 1.15, '\\text{nearest neighbour: }'+sci(pn), C.mid, 'start');
  return a.svg();
}

/* Four eight-point sets with d_min = 2, and the average energy of each:
   (a) 6, (b) 6.83, (c) 6, (d) 4.73. One set a frame. */
const C8 = 1+Math.SQRT2, R3 = 1+Math.sqrt(3);
const SQ = [[1,1],[-1,1],[-1,-1],[1,-1]];
const SH = [
  {n:'(a)', pts:SQ.concat([[3,1],[-3,1],[-3,-1],[3,-1]]), d:[[1,1],[3,1]]},
  {n:'(b)', pts:SQ.concat([[C8,C8],[-C8,C8],[-C8,-C8],[C8,-C8]]), d:[[1,1],[C8,C8]]},
  {n:'(c)', pts:[[2,0],[0,2],[-2,0],[0,-2],[2,2],[-2,2],[-2,-2],[2,-2]], d:[[2,0],[2,2]]},
  {n:'(d)', pts:SQ.concat([[R3,0],[0,R3],[-R3,0],[0,-R3]]), d:[[1,1],[R3,0]]}
];
const Eav = pts => pts.reduce((s,p)=>s+p[0]*p[0]+p[1]*p[1], 0)/pts.length;
function figShapes(v){
  const f = frameOf(v, 3), i0 = Math.min(2, Math.floor(f)), u = clamp01(f-i0);
  const a = plane({need:[[-3.8,3.8],[-3.8,4.3]], xticksOverride:[-2,0,2], yticksOverride:[-2,0,2]});
  const draw = (S, o) => { if(o < 0.02) return;
    const radii = [...new Set(S.pts.map(p=>Math.hypot(p[0],p[1]).toFixed(4)))].map(Number);
    radii.forEach(r=>circle(a, r, {color:C.muted, width:1.1, opacity:o}));
    seg(a, S.d, {color:C.mid, width:2.8, opacity:o});
    S.pts.forEach(p=>dot(a, p[0], p[1], {color:C.in, r:6.5, opacity:o})); };
  draw(SH[i0], 1-u); draw(SH[i0+1], u);
  const S = SH[Math.round(f)];
  lbl(a, a.o.xr[0]+0.1, a.o.yr[1]-0.32, '\\text{'+S.n+'}\\quad E_{\\text{av}}='+num(Eav(S.pts),2)+',\\ \\ d_{\\min}=2', C.ink);
  return a.svg();
}

/* 16-QAM on the grid (+-1, +-3). The reader draws the decision boundaries;
   the answer is the lines x, y = 0, +-2. */
function figExQAM16(){
  const a = plane({need:[[-4.6,4.6],[-4.3,4.6]], xticksOverride:[-3,-1,1,3], yticksOverride:[-3,-1,1,3]});
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  a.raw('<g class="sk-key">');
  drawCells(a, QAM16, {fills:['none'], lineW:2.2, lineCol:C.ink});
  a.raw('</g>');
  QAM16.forEach(p=>dot(a, p[0], p[1], {color:C.in, r:6.5}));
  return a.svg();
}

/* M-PSK and square M-QAM at the same average energy, E_s = 1: the rings are
   the PSK points, the filled dots the QAM points, and each set's closest
   pair is joined. */
const qamSq = M => { const L = Math.sqrt(M), lv = Array.from({length:L}, (_,i)=>2*i+1-L), pts = [];
  lv.forEach(x=>lv.forEach(y=>pts.push([x,y]))); const e = Math.sqrt(Eav(pts)); return pts.map(p=>[p[0]/e, p[1]/e]); };
const advQ = M => 10*Math.log10((3/(M-1))/(2*Math.pow(Math.sin(Math.PI/M), 2)));
function figQAMvsPSK(v){
  const k = v ? v.k : 2, M = Math.pow(4, k), q = qamSq(M), ps = PSKpts(M);
  const dq = Math.sqrt(6/(M-1)), dp = 2*Math.sin(Math.PI/M);
  const a = plane({need:[[-1.65,1.65],[-1.6,2.2]], xticksOverride:[], yticksOverride:[]});
  circle(a, 1, {color:C.muted, width:1.1});
  ps.forEach(p=>ring(a, p[0], p[1], {color:C.in, r:M > 16 ? 3.5 : 5.5, width:1.8}));
  q.forEach(p=>dot(a, p[0], p[1], {color:C.in, r:M > 16 ? 3 : 5}));
  seg(a, [ps[0], ps[1]], {color:C.err, width:2.6, dash:'5 3'});
  seg(a, [q[0], q[1]], {color:C.err, width:2.6});
  const x0 = a.o.xr[0]+0.06, y0 = a.o.yr[1]-0.2;
  /* three short lines, all left of the vertical axis */
  lbl(a, x0, y0, 'M='+M+':\\ d_{\\text{QAM}}='+num(dq,3), C.err);
  lbl(a, x0, y0-0.3, 'd_{\\text{PSK}}='+num(dp,3), C.err);
  lbl(a, x0, y0-0.6, '10\\log_{10}\\bigl(d_{\\text{QAM}}^{2}/d_{\\text{PSK}}^{2}\\bigr)='+num(advQ(M),2)+'\\text{ dB}', C.ink);
  return a.svg();
}

/* 5.3. Wi-Fi 6, LTE and 5G NR, ADSL and cable television. */
const NR_R = rng(5301), NR_I = Array.from({length:16}, ()=>2*Math.floor(NR_R()*16)-15);
const ADSL = Array.from({length:29}, (_,j)=>{ const k = 32+8*j; return [k*4.3125, Math.max(2, Math.round(14-12*(k-32)/224))]; });
const CAB_Z = gauss(5302, 384, 1);
const REAL_QAM = realGallery({ id:'m5-real-qam', nav:'QAM around us',
  title:'QAM around us', eyebrow:'Module 5 · Amplitude and quadrature', src:'book 8.7.1',
  objective:'Recognise square QAM in Wi-Fi, mobile networks, telephone lines and cable television.',
  keywords:'examples wi-fi 6 1024-qam lte 5g nr 256-qam levels adsl tones 4.3125 khz bits per tone cable television 64-qam cloud',
  figs:[
    [()=>{ const a = galPlane([[-1.85,1.85],[-1.72,1.72]]), q = qamSq(1024);
      a.raw(q.map(p=>`<circle cx="${f2(a.sx(p[0]))}" cy="${f2(a.sy(p[1]))}" r="1.3" fill="${C.in}"/>`).join(''));
      return a.svg(); },
      'Wi-Fi 6 uses QAM with up to $1024$ points, $10$ bits a symbol. At $E_s=1$ the points are $d_{\\min}=\\sqrt{6/1023}=0.077$ apart.'],
    [()=>{ const a = TAx(EXO({xt:[0,5,10,15], xr:[-0.8,16], yr:[-17.5,17.5], xlabel:'n', ylabel:'I[n]', yticksOverride:[-15,-7,0,7,15]}));
      a.stem(NR_I.map((y,n)=>[n,y]), {color:C.in});
      return a.svg(); },
      'LTE and 5G NR use QAM with up to $256$ points. Each axis then carries one of $16$ levels, $I[n]\\in\\{\\pm1,\\pm3,\\ldots,\\pm15\\}$.'],
    [()=>{ const a = TAx(EXO({xt:[0,250,500,750,1000], xr:[0,1150], yr:[0,16.5], xlabel:'f\\;(\\text{kHz})', ylabel:'b_k', yticksOverride:[5,10,15]}));
      a.stem(ADSL, {color:C.in});
      return a.svg(); },
      'ADSL splits a phone line into tones $4.3125$ kHz apart. Tone $k$ carries $b_k$ bits as a QAM set of $2^{b_k}$ points. Higher tones arrive weaker and carry fewer bits.'],
    [()=>{ const a = galPlane([[-1.4,1.4],[-1.3,1.3]]), q = qamSq(64), s = Math.sqrt(0.5e-3);
      cloudPts(a, Array.from({length:192}, (_,i)=>{ const p = q[i%64]; return [p[0]+s*CAB_Z[2*i], p[1]+s*CAB_Z[2*i+1], false]; }), {r:1.5});
      q.forEach(p=>a.point(p[0], p[1], {color:C.in, r:2.6}));
      return a.svg(); },
      'Digital cable television uses 64-QAM and 256-QAM. Each $\\mathbf r=\\mathbf s+\\mathbf n$ lands in a small cloud, here 64-QAM at $E_s/N_0=30$ dB.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Two PAM sets', html:'Square QAM puts one PAM set on each axis. The receiver decides each axis on its own.'},
    {t:'note', kind:'def', head:'Bits a symbol', html:'$256$ points carry $8$ bits a symbol and $1024$ points carry $10$.'},
    {t:'note', kind:'warn', head:'Spacing', html:'At fixed energy $d_{\\min}^{2}=6E_s/(M-1)$. Going from $256$ to $1024$ points costs $6.0$ dB.'}
  ]});

/* ---- 5.4 frequency-shift keying and orthogonal signals ------------------- */

/* Three orthogonal signals drawn in an isometric view of three axes: the
   points, the equal chords between them, then a received point decided by
   its largest correlator output. */
const iso = p => [(p[0]-p[1])*0.866, p[2]-0.5*(p[0]+p[1])];
const RX3 = [0.82, 0.34, 0.22];
function figMFSK(v){
  const f = frameOf(v, 2), o1 = clamp01(f), o2 = clamp01(f-1);
  const a = plane(bare({need:[[-1.6,1.6],[-1.05,1.55]], xlabel:'', ylabel:''}));
  const E = [[1,0,0],[0,1,0],[0,0,1]];
  E.forEach((e,j)=>{ const q = iso(e.map(x=>1.45*x));
    arrow(a, 0, 0, q[0], q[1], {color:C.h, width:1.8, head:0.7});
    const L = iso(e.map(x=>1.62*x)); lbl(a, L[0], L[1]-0.05, '\\psi_'+(j+1), C.h, j===0 ? 'start' : j===1 ? 'end' : 'middle'); });
  if(o1 > 0.02) [[0,1],[1,2],[0,2]].forEach(([i,j])=>seg(a, [iso(E[i]), iso(E[j])], {color:C.mid, width:2.4, opacity:o1*(1-0.6*o2)}));
  if(o1 > 0.5 && o2 < 0.5){ const m = iso([0.5,0.5,0]); lbl(a, m[0], m[1]-0.22, 'd=\\sqrt{2E_s}', C.mid, 'middle'); }
  E.forEach(e=>{ const q = iso(e); dot(a, q[0], q[1], {color:C.in, r:7}); });
  if(o2 > 0.02){ const r = iso(RX3), p1 = iso([RX3[0],0,0]);
    seg(a, [r, p1], {color:C.mid, width:1.4, dash:'4 4', opacity:o2});
    dot(a, r[0], r[1], {color:C.out, r:6.5, opacity:o2});
    const s1 = iso(E[0]); ring(a, s1[0], s1[1], {opacity:o2});
    /* under the triangle, between the names of the two lower axes */
    if(o2 > 0.5) lbl(a, 0, a.o.yr[0]+0.08, 'r_1='+RX3[0]+'>r_2='+RX3[1]+'>r_3='+RX3[2], C.out, 'middle'); }
  return a.svg();
}

/* M orthogonal signals, M = 2 to 64 one a frame: the exact bit error
   against E_b/N_0. The curves are computed once, on a 0.1 dB grid. The
   faint wall at -1.6 dB is where they all end as M grows; Module 6 shows why. */
const ORTH_MS = [2,4,8,16,32,64], ORTH_X0 = -4, ORTH_DX = 0.1, ORTH_N = 201;
const orthPbM = (M, g) => Math.pow(2, Math.log2(M)-1)/(M-1)*orthExact(M, g);
const ORTH_TAB = {}, ORTH_AT = {};
const orthTab = M => ORTH_TAB[M] || (ORTH_TAB[M] = Array.from({length:ORTH_N}, (_,i)=>Math.log10(Math.max(1e-14, orthPbM(M, dB(ORTH_X0+ORTH_DX*i))))));
const orthAt = M => ORTH_AT[M] != null ? ORTH_AT[M] : (ORTH_AT[M] = reach(d=>orthPbM(M, dB(d)), 1e-5, -2, 16));
const orthLook = (M, d) => { const t = orthTab(M), u = (d-ORTH_X0)/ORTH_DX, i = Math.max(0, Math.min(ORTH_N-2, Math.floor(u))), w = u-i;
  const y = t[i]*(1-w)+t[i+1]*w; return y < LGF-0.02 ? NaN : y; };
const WALL = 10*Math.log10(Math.LN2);
function figOrthM(v){
  const f = frameOf(v, 5), n = Math.min(5, Math.round(f));
  const a = leftTicks(logAx(SZ({xr:[-4,16], yr:[-7,0.3], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'P_b', xt:[-4,0,4,8,12], yticksOverride:[], grid:false})), P.decades(-7,-1), P.decade);
  a.rect(-4, -7, WALL, 0.3, {fill:rgba(C.muted, 0.12)});
  a.vline(WALL, {color:C.muted, width:1.4, dash:'3 4'});
  lbl(a, WALL+0.25, -0.55, '\\text{limit, Module 6}', C.muted, 'start', 13);
  for(let i=0;i<=n;i++){ const M = ORTH_MS[i];
    a.curve(d=>orthLook(M, d), {color:C.err, width:i===n ? 2.8 : 1.5, opacity:i===n ? 1 : 0.45, n:240}); }
  const M = ORTH_MS[n], x = orthAt(M);
  dot(a, x, -5, {color:C.err, r:5.5});
  lbl(a, 15.6, -0.45, 'M='+M+':\\ E_b/N_0='+num(x,1)+'\\text{ dB at }10^{-5}', C.err, 'end');
  return a.svg();
}

/* Noncoherent BFSK. A tone with unknown phase phi gives the two outputs
   y_c = cos(phi) and y_s = sin(phi); the envelope is 1 whatever phi is. Below,
   the price: 12.6 dB coherent against 13.4 dB noncoherent at 1e-5. */
const G_NC = reach(d=>PE.ncfsk(dB(d)), 1e-5, 0, 20);
function figNoncoh(v){
  const phi = v ? v.phi : 60, t = phi*Math.PI/180, H = takeH(430), hA = Math.round(0.58*H);
  const a = plane({h:hA, need:[[-1.5,1.5],[-1.3,1.45]], xlabel:'y_c', ylabel:'y_s', xticksOverride:[], yticksOverride:[], pad:{l:56,r:26,t:24,b:36}});
  circle(a, 1, {color:C.muted, width:1.1});
  const x = Math.cos(t), y = Math.sin(t);
  seg(a, [[x,y],[x,0]], {color:C.mid, width:1.4, dash:'4 4'});
  seg(a, [[0,0],[x,0]], {color:C.mid, width:3.2});
  seg(a, [[0,0],[x,y]], {color:C.out, width:2.2});
  if(phi > 3) arc(a, 0.3, 0, t, {color:C.mid, width:2});
  dot(a, x, y, {color:C.out, r:6.5});
  lbl(a, a.o.xr[1]-0.05, a.o.yr[1]-0.2, 'y_c='+num(x)+',\\ \\ \\sqrt{y_c^{2}+y_s^{2}}=1', C.mid, 'end');
  const b = logAx({w:560, h:H-hA, xr:[6,16], yr:[-7,0.3], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'P_b',
    pad:{l:56,r:26,t:24,b:42}, xt:[6,8,10,12,14], yticksOverride:[-6,-4,-2,0]});
  b.curve(d=>lg10(PE.bfsk(dB(d))), {color:C.err, width:2.6});
  b.curve(d=>lg10(PE.ncfsk(dB(d))), {color:C.err, width:2.4, dash:'7 5'});
  dot(b, G5.bfsk, -5, {color:C.err, r:5}); dot(b, G_NC, -5, {color:C.err, r:5});
  lbl(b, G5.bfsk-0.2, -5.6, num(G5.bfsk,1), C.err, 'end', 14);
  lbl(b, G_NC+0.2, -4.6, num(G_NC,1)+'\\text{ dB}', C.err, 'start', 14);
  return stack(560, [[a.svg(),hA],[b.svg(),H-hA]]);
}

/* 5.4. Caller ID and radio modems, Bluetooth Low Energy, GSM and digital
   mobile radio. */
const B202 = [1,0,1,1,0], B202_T = 1/1.2;
const b202 = (()=>{ const fr = B202.map(b=>b ? 1.2 : 2.2), ph = [0];
  fr.forEach((f,i)=>ph.push(ph[i]+2*Math.PI*f*B202_T));
  return t=>{ const i = Math.min(4, Math.max(0, Math.floor(t/B202_T))); return Math.cos(ph[i]+2*Math.PI*fr[i]*(t-i*B202_T)); }; })();
const BLE = [1,1,-1,1,-1,-1,-1,1,1,-1];
const gPulse = (u, BT) => { const al = 2*Math.PI*BT/Math.sqrt(Math.LN2); return Qf(al*(u-0.5)) - Qf(al*(u+0.5)); };
const bleDev = t => BLE.reduce((s,d,n)=>s + d*(Qf(2*Math.PI*0.5/Math.sqrt(Math.LN2)*(t-n-1)) - Qf(2*Math.PI*0.5/Math.sqrt(Math.LN2)*(t-n))), 0);
const DMR = [3,1,-1,-3,1,3,-3,-1,1,-1,3,-3];
const REAL_FSK = realGallery({ id:'m5-real-fsk', nav:'Frequency keying around us',
  title:'Frequency keying around us', eyebrow:'Module 5 · Frequency-shift keying', src:'book 9.5, 9.6.1',
  objective:'Recognise frequency keying in telephone-line modems, Bluetooth Low Energy, GSM and digital mobile radio.',
  keywords:'examples bell 202 1200 2200 hz caller id bluetooth low energy gfsk 1 mb/s gsm gmsk bt 0.3 gaussian pulse dmr four-level fsk',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[0,1,2,3], xr:[-0.05,5*B202_T+0.05], yr:[-1.4,1.9], xlabel:'t\\;(\\text{ms})', ylabel:'s(t)', yticksOverride:[-1,0,1]}));
      for(let n=1;n<5;n++) a.vline(n*B202_T, {color:C.muted, dash:'2 4', width:1});
      trace(a, b202, 0, 5*B202_T, {color:C.in, width:2.2, n:900});
      B202.forEach((b,n)=>lbl(a, (n+0.5)*B202_T, 1.45, String(b), C.ink, 'middle', 14));
      return a.svg(); },
      'Caller ID and radio packet modems (Bell 202) send $1200$ b/s as $1200$ Hz for a one and $2200$ Hz for a zero. The phase runs on across each switch.'],
    [()=>{ const a = TAx(EXO({xt:[0,2,4,6,8], xr:[0,10], yr:[-1.4,1.4], xlabel:'t\\;(\\mu\\text{s})', ylabel:'\\Delta f(t)/\\Delta f_{\\max}', yticksOverride:[-1,0,1]}));
      a.poly(outline(BLE.map((d,n)=>[n, n+1, d]), 0, 10), {color:C.muted, width:1.2, dash:'4 4'});
      a.curve(bleDev, {color:C.in, width:2.4, n:600});
      return a.svg(); },
      'Bluetooth Low Energy sends $1$ Mb/s with Gaussian FSK (GFSK). A Gaussian filter rounds each switch of frequency, so the spectrum falls off faster.'],
    [()=>{ const a = TAx(EXO({xt:[-2,-1,0,1,2], xr:[-2.5,2.5], yr:[-0.08,1.2], xlabel:'t/T_b', ylabel:'g(t)', yticksOverride:[], grid:false}));
      leftTicks(a, [0,1]);
      a.poly([[-2.5,0],[-0.5,0],[-0.5,1],[0.5,1],[0.5,0],[2.5,0]], {color:C.muted, width:1.4, dash:'5 4'});
      a.curve(u=>gPulse(u, 0.3), {color:C.in, width:2.5, n:500});
      return a.svg(); },
      'GSM sends GMSK: MSK whose frequency pulse passes a Gaussian filter with $BT_b=0.3$. The dashed pulse is plain MSK. The Gaussian one spreads over about three bits.'],
    [()=>{ const a = TAx(EXO({xt:[0,4,8], xr:[-0.8,12], yr:[-3.8,3.8], xlabel:'n', ylabel:'f[n]', yticksOverride:[]}));
      a.stem(DMR.map((y,n)=>[n,y]), {color:C.in});
      [-3,-1,1,3].forEach(y=>lbl(a, 11.9, y+0.25, (y > 0 ? '+' : '-')+(Math.abs(y)===3 ? '3d' : 'd'), C.muted, 'end', 13));
      return a.svg(); },
      'Digital mobile radio (DMR) uses four-level FSK. Each symbol shifts the carrier by one of four offsets $\\{\\pm d,\\pm3d\\}$ and carries $2$ bits.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Frequency carries the bits', html:'FSK keeps a constant envelope. A cheap receiver can detect it without the carrier phase.'},
    {t:'note', kind:'def', head:'Smooth switching', html:'GFSK and GMSK smooth each change of frequency. The side lobes of the spectrum then fall off faster.'},
    {t:'note', kind:'warn', head:'Band grows with M', html:'Orthogonal tones need a band that grows with $M$. Radio links therefore keep $M$ at $2$ or $4$.'}
  ]});

/* ---- 5.5 bandwidth and the choice of scheme -------------------------------- */

/* At a fixed bit rate, k bits a symbol make the symbol k times longer: the
   sinc^2 main lobe of PSK and QAM is 2 R_b/k wide. Below, the band of each
   family at this k. */
const bwOf = k => { const M = 1 << k; return [['\\text{PAM (SSB)}', 1/(2*k), C.in], ['\\text{PSK, QAM}', 1/k, C.in], ['\\text{orthogonal}', M/(2*k), C.in]]; };
function figSpectrum(v){
  const k = v ? v.k : 2, M = 1 << k, H = takeH(430), hA = Math.round(0.56*H);
  const a = P.Axes({w:560, h:hA, xr:[-2.2,2.2], yr:[0,6.6], xlabel:'f/R_b', ylabel:'S(f)',
    pad:{l:56,r:26,t:24,b:40}, xticksOverride:[-2,-1,0,1,2], yticksOverride:[]});
  a.curve(x=>Math.pow(sincF(x), 2), {color:C.muted, width:1.4, dash:'5 4', n:800});
  a.curve(x=>k*Math.pow(sincF(k*x), 2), {color:C.in, width:2.6, n:1200});
  /* the bracket is centred on the vertical axis, so its name sits beside it */
  a.span(-1/k, 1/k, k+0.75, '', {color:C.mid});
  lbl(a, 1/k+0.08, k+0.75, k===1 ? '2R_b' : '2R_b/'+k+'='+num(2/k,2)+'R_b', C.mid, 'start');
  lbl(a, 2.15, 5.9, 'M='+M+'\\ (k='+k+')', C.in, 'end');
  const b = P.Axes({w:560, h:H-hA, xr:[0,3.6], yr:[0,3.2], xlabel:'W/R_b', ylabel:'',
    pad:{l:56,r:26,t:18,b:40}, xticksOverride:[0,1,2,3], yticksOverride:[], grid:false});
  bwOf(k).forEach(([name, w, col], i)=>{ const y = 2.6-i;
    b.rect(0, y-0.3, w, y+0.3, {fill:rgba(col, 0.3)}); seg(b, [[w,y-0.3],[w,y+0.3]], {color:col, width:2.4});
    lbl(b, w+0.06, y-0.1, name+':\\ '+num(w, 2), col, 'start', 14); });
  return stack(560, [[a.svg(),hA],[b.svg(),H-hA]]);
}

/* QPSK, offset QPSK and MSK over eight bits: the path of (I, Q) and the
   envelope. QPSK can cross the origin, offset QPSK changes one axis at a
   time, MSK stays on the circle. The last frame compares the spectra. */
const MS_I = [1,-1,-1,1], MS_Q = [1,-1,1,-1], MS_D = [1,1,-1,1,-1,-1,1,1], MS_TAU = 0.3;
const ramp = (t, t0) => clamp01((t-t0)/MS_TAU+0.5);
const held = (seq, t, off) => { let x = seq[0];
  for(let j=1;j<seq.length;j++) x += (seq[j]-seq[j-1])*ramp(t, 2*j+off); return x/Math.SQRT2; };
const MSK_WAYS = [
  t=>[held(MS_I, t, 0), held(MS_Q, t, 0)],
  t=>[held(MS_I, t, 0), held(MS_Q, t, 1)],
  t=>{ let th = Math.PI/4; MS_D.forEach((d,n)=>{ th += d*Math.PI/2*clamp01(t-n); }); return [Math.cos(th), Math.sin(th)]; }
];
const MSK_NAME = ['\\text{QPSK}', '\\text{offset QPSK}', '\\text{MSK}'];
const pskPsd = x => Math.pow(sincF(2*x), 2);
const mskPsd = x => { const den = 1-16*x*x; return Math.abs(den) < 1e-6 ? Math.pow(Math.PI/4, 2) : Math.pow(Math.cos(2*Math.PI*x)/den, 2); };
function figMSK(v){
  const f = frameOf(v, 3), H = takeH(430), hA = Math.round(0.6*H);
  const w3 = clamp01(f-2), i0 = Math.min(1, Math.floor(Math.min(f, 2))), u = clamp01(Math.min(f, 2)-i0);
  const a = plane({h:hA, need:[[-1.4,1.4],[-1.3,1.45]], xlabel:'I', ylabel:'Q', xticksOverride:[-1,1], yticksOverride:[-1,1], pad:{l:56,r:26,t:24,b:36}});
  circle(a, 1, {color:C.muted, width:1.1});
  const b = TAx({w:560, h:H-hA, xr:[0,8], yr:[0,1.35], xlabel:'t/T_b', ylabel:'|s(t)|',
    pad:{l:56,r:26,t:20,b:40}, xt:[0,2,4,6,8], yticksOverride:[0,1]});
  [[i0, 1-u], [i0+1, u]].forEach(([j, o])=>{ if(o < 0.02) return; const way = MSK_WAYS[j];
    seg(a, Array.from({length:801}, (_,i)=>way(8*i/800)), {color:C.in, width:2.4, opacity:o});
    seg(b, Array.from({length:801}, (_,i)=>{ const t = 8*i/800, p = way(t); return [t, Math.hypot(p[0], p[1])]; }), {color:C.in, width:2.4, opacity:o}); });
  QPSK.forEach(p=>dot(a, p[0]/Math.SQRT2, p[1]/Math.SQRT2, {color:C.in, r:5}));
  const j = u < 0.5 ? i0 : i0+1;
  lbl(a, a.o.xr[0]+0.05, a.o.yr[1]-0.15, MSK_NAME[j], C.in);
  const top = stack(560, [[a.svg(),hA],[b.svg(),H-hA]]);
  if(w3 < 0.02) return top;
  const c = logAx({w:560, h:H, xr:[0,2], yr:[-4,0.2], xlabel:'fT_b', ylabel:'S(f)/S(0)',
    pad:{l:56,r:26,t:24,b:42}, xt:[0,0.5,0.75,1,1.5,2], yticksOverride:[-4,-3,-2,-1,0]});
  c.curve(x=>lg10(pskPsd(x)), {color:C.in, width:2.4, dash:'7 5', n:1200});
  c.curve(x=>lg10(mskPsd(x)), {color:C.in, width:2.6, n:1200});
  lbl(c, 1.95, -0.4, '\\text{dashed: QPSK, offset QPSK}', C.in, 'end', 14);
  lbl(c, 1.95, -0.85, '\\text{solid: MSK}', C.in, 'end', 14);
  return `<svg viewBox="0 0 560 ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${fade(top.replace('<svg ', '<svg x="0" y="0" width="560" height="'+H+'" '), 1-w3)}${fade(place(c.svg(),0,0,560,H), w3)}</svg>`;
}

/* The bandwidth-efficiency plane: r = R_b/W against the E_b/N_0 each scheme
   needs for a target symbol error. The limit curve E_b/N_0 = (2^r - 1)/r is
   drawn faint; Module 6 derives it. */
const L2 = Math.log2;
const FAM = [
  {n:'PAM', dash:'2 4', Ms:[2,4,8,16,32,64], r:M=>2*L2(M), pe:(M,g)=>PE.pam(M,g)},
  {n:'PSK', dash:null, Ms:[4,8,16,32,64], r:M=>L2(M), pe:(M,g)=>PE.psk(M,g)},
  {n:'QAM', dash:'7 5', Ms:[16,64], r:M=>L2(M), pe:(M,g)=>PE.qamNN(M,g)},
  {n:'orthogonal', dash:'12 5 3 5', Ms:[2,4,8,16,32,64], r:M=>2*L2(M)/M, pe:(M,g)=>PE.orthU(M,g)}
];
const needAt = (fam, M, tgt) => reach(d=>fam.pe(M, dB(d)), tgt, -5, 60);
function figPlane(v){
  const e = v ? v.e : -5, tgt = Math.pow(10, e);
  /* Projected, the family names grow 1.36 times and would touch their curves;
     the plane is then drawn on a wider box of the same shape, so it takes the
     same room on the page and the names give back that part of the growth. */
  const big = P.labelScale() > 1;
  const a = TAx(SZ({w:big ? 640 : 560, h:big ? 434 : 380, xr:[-4,36], yr:[-3,4.4], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'R_b/W', xt:[0,10,20],
    yticksOverride:[], grid:false, zeroAxes:false}));
  leftTicks(a, [-3,-2,-1,0,1,2,3,4], u=>u >= 0 ? String(Math.pow(2,u)) : '1/'+Math.pow(2,-u));
  a.hline(0, {color:C.muted, width:1, dash:'2 4'});
  const lim = []; for(let u=-3;u<=4.001;u+=0.05){ const r = Math.pow(2,u); lim.push([todB((Math.pow(2,r)-1)/r), u]); }
  seg(a, lim, {color:C.muted, width:1.6, dash:'3 4'});
  lbl(a, -3.6, 3.55, '\\text{limit, Module 6}', C.muted, 'start', 13);
  const LB = {PAM:big ? [0.4,-0.62,'end'] : [-0.2,-0.5,'end'], PSK:[0.6,-0.12,'start'], QAM:big ? [-0.9,0.05,'end'] : [-0.8,0.2,'end'], orthogonal:[0.6,-0.12,'start']};
  FAM.forEach(fm=>{ const pts = fm.Ms.map(M=>[needAt(fm, M, tgt), L2(fm.r(M))]), p = pts[fm.n==='QAM' ? 0 : pts.length-1], L = LB[fm.n];
    seg(a, pts, {color:C.in, width:2.2, dash:fm.dash});
    pts.forEach(q=>dot(a, q[0], q[1], {color:C.in, r:5}));
    lbl(a, p[0]+L[0], p[1]+L[1], '\\text{'+fm.n+'}', C.in, L[2], 14); });
  lbl(a, 35.5, 0.35, '\\text{bandwidth-limited}', C.ink, 'end', 14);
  lbl(a, 35.5, -0.75, '\\text{power-limited}', C.ink, 'end', 14);
  lbl(a, 35.5, -2.6, 'P_e=10^{'+e+'}', C.err, 'end');
  return a.svg();
}

/* E_b/N_0 for P_e = 1e-5 against bits a symbol, for each family. */
function figCompare(){
  const a = TAx(SZ({xr:[0.6,7.6], yr:[0,36], xlabel:'k=\\log_2M', ylabel:'E_b/N_0\\;(\\text{dB})', xt:[1,2,3,4,5,6], yticksOverride:[0,10,20,30]}));
  FAM.forEach(fm=>{ const Ms = fm.n==='PSK' ? [2].concat(fm.Ms) : fm.n==='QAM' ? [4].concat(fm.Ms) : fm.Ms;
    const pts = Ms.map(M=>[L2(M), needAt(fm, M, 1e-5)]), p = pts[pts.length-1];
    seg(a, pts, {color:C.in, width:2.4, dash:fm.dash});
    pts.forEach(q=>dot(a, q[0], q[1], {color:C.in, r:5}));
    lbl(a, p[0]+0.15, p[1]-0.6, '\\text{'+fm.n+'}', C.in, 'start', 14); });
  return a.svg();
}

/* Adaptive modulation: the largest set whose bit error stays at 1e-5 at a
   given E_s/N_0, with Gray labels (P_b = P_e/k). */
const AD = [{n:'\\text{BPSK}', k:1, pb:g=>PE.bpsk(g)}, {n:'\\text{QPSK}', k:2, pb:g=>PE.bpsk(g/2)},
  {n:'16\\text{-QAM}', k:4, pb:g=>PE.qam(16, g/4)/4}, {n:'64\\text{-QAM}', k:6, pb:g=>PE.qam(64, g/6)/6},
  {n:'256\\text{-QAM}', k:8, pb:g=>PE.qam(256, g/8)/8}];
AD.forEach(s=>{ s.th = reach(d=>s.pb(dB(d)), 1e-5, 0, 60); });
function figAdaptive(v){
  const x0 = v ? v.g : 22;
  const a = TAx(SZ({xr:[0,40], yr:[0,9.4], xlabel:'E_s/N_0\\;(\\text{dB})', ylabel:'k\\;(\\text{bits a symbol})', xt:[0,10,20,30,40], yticksOverride:[0,2,4,6,8]}));
  const st = [[0,0]]; AD.forEach(s=>{ st.push([s.th, st[st.length-1][1]], [s.th, s.k]); }); st.push([40, 8]);
  seg(a, st, {color:C.in, width:2.6});
  AD.forEach((s,i)=>lbl(a, s.th-0.6, s.k-0.35, s.n, C.in, 'end', 13));
  let cur = -1; AD.forEach((s,i)=>{ if(x0 >= s.th) cur = i; });
  if(cur >= 0) seg(a, [[x0,0],[x0,AD[cur].k]], {color:C.ink, dash:'5 4', width:1.3});
  dot(a, x0, cur < 0 ? 0 : AD[cur].k, {color:C.out, r:6.5});
  lbl(a, 0.5, 8.6, cur < 0 ? '\\text{no set meets }10^{-5}' : AD[cur].n+':\\ '+AD[cur].k+'\\text{ bits a symbol}', C.out, 'start');
  return a.svg();
}

/* 5.5. Satellite, Bluetooth, GSM against QAM, and adaptive mobile links. */
const APSK = PSKpts(4, 1, Math.PI/4).concat(PSKpts(12, 2.7, Math.PI/12));
const Q16E = (()=>{ const r = rng(5501), s = []; for(let i=0;i<14;i++){ const p = QAM16[Math.floor(r()*16)]; s.push(Math.hypot(p[0], p[1])/Math.sqrt(10)); } return s; })();
const LTE_K = [2,2,4,4,6,6,8,6,4,4,2,4,6,6];
const REAL_CHOICE = realGallery({ id:'m5-real-choice', nav:'Choosing a scheme around us',
  title:'Choosing a scheme around us', eyebrow:'Module 5 · Bandwidth and the choice of scheme', src:'book 9.7',
  objective:'See how real systems trade energy, bandwidth and amplifier cost when they pick a modulation.',
  keywords:'examples dvb-s2 16apsk two rings bluetooth 1 2 3 mb/s gfsk pi/4-dqpsk 8dpsk gsm gmsk constant envelope 16-qam envelope lte 5g adaptive modulation qpsk 256-qam',
  figs:[
    [()=>{ const a = galPlane([[-3.2,3.2],[-3,3]]);
      circle(a, 1, {color:C.muted, width:1.1}); circle(a, 2.7, {color:C.muted, width:1.1});
      APSK.forEach(p=>a.point(p[0], p[1], {color:C.in, r:5}));
      return a.svg(); },
      'Satellite DVB-S2 also sends 16APSK: $4$ points on an inner ring and $12$ on an outer ring. Two amplitudes suit a satellite amplifier better than the three of 16-QAM.'],
    [()=>{ const a = TAx(EXO({xt:[], xr:[0,3.6], yr:[0,3.6], xlabel:'', ylabel:'R_b\\;(\\text{Mb/s})', yticksOverride:[1,2,3], grid:false}));
      [['\\text{GFSK}',1],['\\pi/4\\text{-DQPSK}',2],['8\\text{DPSK}',3]].forEach(([n,r],i)=>{ const x = 0.35+1.15*i;
        a.rect(x, 0, x+0.75, r, {fill:rgba(C.in, 0.3)}); lbl(a, x+0.375, r+0.15, n, C.in, 'middle', 13); });
      return a.svg(); },
      'Bluetooth Classic sends $1$ million symbols a second. GFSK carries $1$ bit a symbol, $\\pi/4$-DQPSK carries $2$ and 8DPSK $3$, for $1$, $2$ and $3$ Mb/s.'],
    [()=>{ const a = TAx(EXO({xt:[0,4,8,12], xr:[0,14], yr:[0,1.55], xlabel:'t/T', ylabel:'|s(t)|', yticksOverride:[0,1]}));
      a.poly(outline(Q16E.map((y,n)=>[n, n+1, y]), 0, 14).slice(1, -1), {color:C.in, width:2.2, dash:'6 4'});
      seg(a, [[0,1],[14,1]], {color:C.in, width:2.6});
      return a.svg(); },
      'GSM sends GMSK, whose envelope stays constant (solid). A 16-QAM envelope jumps between three levels (dashed), so its amplifier must stay linear.'],
    [()=>{ const a = TAx(EXO({xt:[0,4,8,12], xr:[0,14], yr:[0,9], xlabel:'t\\;(\\text{slots})', ylabel:'k', yticksOverride:[2,4,6,8]}));
      a.poly(outline(LTE_K.map((y,n)=>[n, n+1, y]), 0, 14).slice(1, -1), {color:C.in, width:2.4});
      return a.svg(); },
      'LTE and 5G NR change the modulation as the channel changes, from QPSK with $k=2$ up to 256-QAM with $k=8$ bits a symbol.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Energy or band', html:'A link short of band packs more bits into each symbol. A link short of energy spreads them over orthogonal signals.'},
    {t:'note', kind:'def', head:'Amplifier cost', html:'A constant envelope lets the amplifier run near saturation. That matters in a handset and on a satellite.'},
    {t:'note', kind:'warn', head:'Adapt', html:'Most modern links measure the channel and change $M$ as it changes.'}
  ]});

/* ---- 5.6 summary ------------------------------------------------------------ */

/* Two bits through a QPSK link: the bits 10 pick the point (1, -1), the IQ
   modulator makes the carrier, noise is added, two correlators return the
   received point, and the receiver picks the nearest point. The noise is
   n(t) = n_1 psi_1(t) + n_2 psi_2(t) + a small part outside the signal space. */
const CH_N = 400, CH_Z = gauss(5601, CH_N, 0.5), CH_A = [-0.24, -0.27];
const psi1 = t => Math.SQRT2*Math.cos(2*Math.PI*FCT*t), psi2 = t => -Math.SQRT2*Math.sin(2*Math.PI*FCT*t);
const CH = (()=>{ const t = [], s = [], r = [], c1 = [0], c2 = [0], dt = 1/CH_N;
  for(let i=0;i<CH_N;i++){ const u = (i+0.5)*dt, sv = psi1(u)-psi2(u);
    t.push(u); s.push(sv); r.push(sv + CH_A[0]*psi1(u) + CH_A[1]*psi2(u) + CH_Z[i]); }
  for(let i=0;i<CH_N;i++){ c1.push(c1[i]+r[i]*psi1(t[i])*dt); c2.push(c2[i]+r[i]*psi2(t[i])*dt); }
  return {t, s, r, c1, c2, rv:[c1[CH_N], c2[CH_N]]}; })();
function figChain(v){
  const big = P.labelScale() > 1, W = big ? 630 : 560, H = takeH(big ? 495 : 440), ha = Math.round((big ? 0.42 : 0.37)*H), hb = Math.round((big ? 0.25 : 0.26)*H), f = frameOf(v, 5), op = k => clamp01(f-k+1);
  const drop = big ? {xnameDrop:0} : {};   /* as in figIQ */
  /* Projected, the labels grow while the plane keeps its height, so the bit
     labels step further from their points and the two readouts move out past
     them. */
  const ox = big ? 2 : 1, bx = big ? 4.2 : 2.5;
  const a = plane(Object.assign({w:W, h:ha, need:[[-2.1,2.1],[-1.8,1.7]], xticksOverride:[], yticksOverride:[], pad:{l:56,r:26,t:24,b:36}}, drop));
  if(op(5) > 0.02) drawCells(a, QPSK, {opacity:op(5)});
  QPSK.forEach((p,k)=>{ dot(a, p[0], p[1], {color:C.in, r:6.5, opacity:k===3 || op(1) < 0.5 ? 1 : 0.4});
    lbl(a, p[0]+ox*QOFF[k][0], p[1]+QOFF[k][1], '\\mathtt{'+QLAB[k]+'}', C.in, QOFF[k][2]); });
  lbl(a, -bx, 0.9, '\\text{bits }\\mathtt{10}', C.ink, 'end');
  if(op(1) > 0.02) ring(a, 1, -1, {color:C.in, r:10, opacity:op(1)*(1-op(5))});
  if(op(5) > 0.02){ const [x,y] = CH.rv; dot(a, x, y, {color:C.out, r:6.5, opacity:op(5)}); ring(a, 1, -1, {r:10, opacity:op(5)});
    if(op(5) > 0.5) lbl(a, bx, 0.9, '\\mathbf r=('+num(x)+','+num(y)+')', C.out, 'start'); }
  const b = TAx({w:W, h:hb, xr:[0,1], yr:[-3.6,3.6], xlabel:'', ylabel:'s(t),\\;r(t)', pad:{l:56,r:26,t:20,b:10}, yticksOverride:[-2,0,2]});
  if(op(2) > 0.02) seg(b, CH.t.map((x,i)=>[x, CH.s[i]]), {color:C.in, width:2.2, opacity:op(2)*(1-0.6*op(3))});
  if(op(3) > 0.02) seg(b, CH.t.map((x,i)=>[x, CH.r[i]]), {color:C.out, width:1.3, opacity:op(3)});
  const c = TAx(Object.assign({w:W, h:H-ha-hb, xr:[0,1.12], yr:[-1.6,1.3], xlabel:'t/T', ylabel:'c_1,\\;c_2', pad:{l:56,r:26,t:20,b:36}, xt:[0,0.5,1], yticksOverride:[-1,1]}, drop));
  const m = Math.round(CH_N*op(4));
  if(m > 1){ seg(c, CH.t.slice(0,m).map((x,i)=>[x, CH.c1[i+1]]), {color:C.mid, width:2.4});
    seg(c, CH.t.slice(0,m).map((x,i)=>[x, CH.c2[i+1]]), {color:C.mid, width:2.4, dash:'7 5'}); }
  if(op(4) > 0.95){ lbl(c, 1.02, CH.rv[0]-0.1, 'r_1', C.mid); lbl(c, 1.02, CH.rv[1]-0.1, 'r_2', C.mid); }
  return stack(W, [[a.svg(),ha],[b.svg(),hb],[c.svg(),H-ha-hb]]);
}

/* Small sketches for the summary and project cards, in the dark-page tints. */
const G = (()=>{
  const sv = b => `<svg viewBox="0 0 92 44">${b}</svg>`;
  const ln = (d,c,w,da) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round"${da?` stroke-dasharray="${da}"`:''}/>`;
  const dt = (x,y,c,r) => `<circle cx="${x}" cy="${y}" r="${r||4}" fill="${c}"/>`;
  const AX='rgba(239,231,216,.30)', CY='#4FBECE', VI='#AC99DC', AM='#E5B255', GR='#82C27B', RD='#E8785F';
  const wave = (f, a0, x0, x1, y, fn) => 'M'+Array.from({length:61},(_,i)=>{ const x = x0+(x1-x0)*i/60; return x.toFixed(1)+','+(y-(fn ? fn(x) : a0)*Math.sin(2*Math.PI*f*(x-x0)/(x1-x0))).toFixed(1); }).join('L');
  const axes = ln('M6 40 H88 M10 42 V4',AX,1);
  const quad = ln('M8 22 H84 M46 2 V42',AX,1);
  const ringPts = (n, r, cx, cy, off) => Array.from({length:n},(_,k)=>dt((cx+r*Math.cos(2*Math.PI*k/n+(off||0))).toFixed(1),(cy-r*Math.sin(2*Math.PI*k/n+(off||0))).toFixed(1),CY,2.8)).join('');
  return {
    carrier: sv(ln(wave(6, 14, 6, 86, 22),CY,1.8)),
    iq:      sv(quad+ln('M46 22 L68 8',VI,2)+ln('M68 8 V22 M68 8 H46',AX,1.2,'3 3')+dt(68,8,CY)),
    binary:  sv(axes+ln('M10 8 C30 10 50 26 86 38',RD,2)+ln('M10 8 C36 10 58 22 86 30',RD,2,'4 3')),
    psk:     sv(ln('M62 22 A16 16 0 1 1 61.9 21.9',AX,1.2)+ringPts(8,16,46,22)),
    gray:    sv(ringPts(4,16,46,22,Math.PI/4)+ln('M57 11 L35 11',VI,1.6)),
    dpsk:    sv(ln('M6 34 H22 V10 H38 V34 H54 V34 H70 V10 H86',CY,2)),
    pam:     sv(ln('M6 22 H86',AX,1)+dt(14,22,CY)+dt(35,22,CY)+dt(57,22,CY)+dt(78,22,CY)+ln('M24 14 V30 M46 14 V30 M68 14 V30',AX,1.2,'3 3')),
    qam:     sv([10,24,38].map(y=>[22,38,54,70].map(x=>dt(x,y,CY,2.8)).join('')).join('')+dt(84,24,CY,2.8)),
    shapes:  sv(ringPts(4,8,46,22,Math.PI/4)+ringPts(4,18,46,22)),
    fsk:     sv(ln(wave(2, 13, 6, 44, 22),CY,1.8)+ln(wave(4, 13, 48, 86, 22),CY,1.8)),
    noncoh:  sv(ln('M62 22 A16 16 0 1 1 61.9 21.9',AX,1.2)+ln('M46 22 L57 10',GR,2)+ln('M46 22 L57 22',VI,2.4)+dt(57,10,GR,3)),
    spectrum:sv(axes+ln('M10 40 C20 40 26 40 30 36 C38 4 54 4 62 36 C66 40 72 40 88 40',CY,2)),
    msk:     sv(ln('M62 22 A16 16 0 1 1 61.9 21.9',CY,2)+ln('M20 36 L72 8',AX,1.2,'3 3')),
    plane:   sv(axes+dt(30,34,CY,3)+dt(44,24,CY,3)+dt(62,16,CY,3)+dt(80,8,CY,3)+ln('M14 38 C24 30 40 20 86 6',AX,1.2,'3 3')),
    adaptive:sv(axes+ln('M10 38 H26 V30 H42 V22 H58 V14 H74 V6 H86',CY,2)),
    chain:   sv(dt(12,22,CY)+ln('M18 22 H30',AX,1.2)+ln(wave(3, 8, 32, 58, 22),AM,1.6)+ln('M60 22 H72',AX,1.2)+dt(80,22,GR))
  };
})();

/* ======================================================================== */
const labScene = (id, lab, title, eyebrow, objective, keywords, lede) => ({ id, module:'M5',
  nav:'Laboratory {lab} · '+title, title:'Laboratory {lab} · '+title, objective, keywords,
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 5 · '+eyebrow},
  {t:'title', text:'Laboratory {lab} · '+title},
  {t:'lede', text:lede},
  {t:'lab', id:lab}
]});
const codeScene = (id, nav, title, objective, keywords) => ({ id, module:'M5', nav:'Code · '+nav, title,
  objective, keywords, slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 5 · '+title},
  {t:'title', text:title},
  {t:'raw', html:()=>CODEBANK.page(id)}
]});
const dBshow = v => '$'+num(v,1)+'$ dB';

const SC = [

/* ---------------------------------------------------------------- 5.0 ---- */
{ id:'m5-open', module:'M5', nav:'Module 5 opening', title:'Digital Modulation Methods',
  objective:'Show the three things a carrier can carry and what this module asks of each.',
  keywords:'module 5 overview digital modulation amplitude phase frequency keying ask psk fsk qam carrier constellation',
  src:'CH9 s.65', dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 5 · Digital modulation methods'},
  {t:'title', level:1, text:'Digital Modulation Methods'},
  {t:'lede', text:'A carrier has an amplitude, a phase and a frequency. Keying one of them, or two at once, puts bits on the carrier.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'stack', style:'--ts:1.6;gap:34px', items:[
      {t:'note', kind:'warn', head:'Result 1', html:'<span style="color:var(--graphite)">Every scheme is a set of points. Its error rate follows from their distances, through the receiver of Module 4.</span>'},
      {t:'note', kind:'warn', head:'Result 2', html:'<span style="color:var(--graphite)">More points carry more bits. PSK and QAM pay in energy, orthogonal signals pay in band.</span>'}
    ]}
  ], right:[
    {t:'fig', svg:figOpen}
  ]}
]},

/* ---------------------------------------------------------------- 5.1 ---- */
{ id:'m5-carrier', module:'M5', nav:'Bits on a carrier', title:'Bits on a carrier',
  objective:'Show that multiplying by a carrier moves the spectrum to the carrier frequency, doubles the band and halves the energy.',
  keywords:'carrier modulation frequency shift spectrum copies fc bandwidth 2W energy half passband frames',
  src:'CH9 s.65', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Putting bits on a carrier'},
  {t:'title', text:'Bits on a carrier'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$s(t)$','$\\times\\cos$','$U(f)$']}, svg:figCarrier,
      caption:'A baseband pulse stream $s(t)$ with band $W=5$ kHz. Step to its product with a $40$ kHz carrier and to the spectrum: two half-height copies at $\\pm f_c$.'}
  ], right:[
    {t:'eq', label:'Modulation shifts the spectrum', tex:'u(t)=s(t)\\cos(2\\pi f_ct)\\;\\Longrightarrow\\;U(f)=\\tfrac12S(f-f_c)+\\tfrac12S(f+f_c)',
      note:'Each copy keeps the shape of $S(f)$ at half the height.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Energy', tex:'\\begin{aligned}\\int s^{2}(t)\\cos^{2}(2\\pi f_ct)\\,dt&=\\tfrac12\\int s^{2}(t)\\,dt+\\tfrac12\\int s^{2}(t)\\cos(4\\pi f_ct)\\,dt\\\\&\\approx\\tfrac12E_s\\end{aligned}',
        note:'The second integral nearly vanishes when $f_c\\gg W$. The carrier halves the energy.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Band 2W', html:'Each copy runs from $f_c-W$ to $f_c+W$. The passband signal needs $2W$, twice the baseband width.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A baseband signal of band $W=5$ kHz rides a $40$ kHz carrier.<div class="nsep"></div>How wide is the passband signal?',
        ask:{key:'m5-carrier', choices:['$5$ kHz','$10$ kHz','$20$ kHz'], answer:1,
          why:'$2W=2(5)=10$ kHz, from $35$ to $45$ kHz.'}}]}
  ]}
]},

{ id:'m5-iq', module:'M5', nav:'The IQ modulator', title:'The IQ modulator',
  objective:'Build a passband signal from two baseband numbers on a cosine and a sine carrier.',
  keywords:'iq modulator in-phase quadrature cosine sine carrier constellation point amplitude phase atan2 qpsk burst frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Putting bits on a carrier'},
  {t:'title', text:'The IQ modulator'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['plane','$\\mathtt{00}$','$\\mathtt{01}$','$\\mathtt{11}$','$\\mathtt{10}$']}, svg:figIQ,
      caption:'Four QPSK symbols at $(\\pm1,\\pm1)$, one a press. Each point sets $I$ (solid) and $Q$ (dashed) for one symbol. The carrier burst below follows them.'}
  ], right:[
    {t:'eq', label:'The IQ modulator', tex:'s(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct)',
      note:'Two baseband numbers ride two carriers $90^{\\circ}$ apart. One point of the plane is one symbol.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Amplitude and phase', tex:'s(t)=A\\cos(2\\pi f_ct+\\theta),\\qquad A=\\sqrt{I^{2}+Q^{2}},\\quad \\theta=\\operatorname{atan2}(Q,I)',
        note:'The same point in polar form. PSK moves only $\\theta$ and ASK moves only $A$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Orthogonal carriers', html:'Over many carrier cycles $\\int\\cos(2\\pi f_ct)\\sin(2\\pi f_ct)\\,dt\\approx0$. A correlator on the cosine sees $I$ alone, and one on the sine sees $Q$ alone.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A symbol with $(I,Q)=(-1,+1)$.<div class="nsep"></div>What is the carrier phase $\\theta$?',
        ask:{key:'m5-iq', choices:['$45^{\\circ}$','$135^{\\circ}$','$225^{\\circ}$'], answer:1,
          why:'$\\theta=\\operatorname{atan2}(1,-1)=135^{\\circ}$, in the second quadrant.'}}]}
  ]}
]},

{ id:'m5-bpsk', module:'M5', nav:'Binary phase-shift keying', title:'Binary phase-shift keying',
  objective:'Send a bit as the sign of a carrier and read its distance and error probability.',
  keywords:'bpsk binary phase shift keying antipodal carrier sign 0 pi distance 2 sqrt Eb error probability sketch',
  src:'CH9 s.66–67', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Putting bits on a carrier'},
  {t:'title', text:'Binary phase-shift keying'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Draw $s(t)$'}, svg:figBPSK,
      caption:'The bits $1\\,1\\,0\\,1$ over a faint carrier, two cycles a bit. Draw the BPSK waveform, then reveal it.'}
  ], right:[
    {t:'eq', label:'BPSK', tex:'s_1(t)=\\sqrt{\\frac{2E_b}{T_b}}\\cos(2\\pi f_ct),\\qquad s_0(t)=-s_1(t)',
      note:'A one sends the carrier and a zero sends it inverted: a phase of $0$ or $\\pi$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · BPSK', tex:'d_{\\min}=2\\sqrt{E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)',
        note:'Two antipodal points at $\\pm\\sqrt{E_b}$. The binary result of Module 4 gives $d^{2}/2N_0=2E_b/N_0$, with $Q$ the Gaussian tail.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Antipodal on a carrier', html:'BPSK is baseband antipodal signalling times $\\cos(2\\pi f_ct)$. The carrier changes the band, not the error rate.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'BPSK with $E_b=4$.<div class="nsep"></div>How far apart are its two points?',
        ask:{key:'m5-bpsk', choices:['$2$','$4$','$8$'], answer:1,
          why:'$d_{\\min}=2\\sqrt{E_b}=2\\sqrt4=4$.'}}]}
  ]}
]},

{ id:'m5-bfsk', module:'M5', nav:'Binary frequency-shift keying', title:'Binary frequency-shift keying',
  objective:'Send a bit as one of two tones and find the spacing that makes them orthogonal.',
  keywords:'bfsk binary frequency shift keying two tones correlation rho sinc spacing 1/2T orthogonal listen 1200 2200 hz slider',
  src:'CH9 s.68–69', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Putting bits on a carrier'},
  {t:'title', text:'Binary frequency-shift keying'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'df', label:'$\\Delta f\\,T_b$', min:0.1, max:2, step:0.05, v:0.5, show:v=>'$'+num(v)+'$'}]},
      listen:{items:[
        {label:'$1200$ Hz', sound:()=>tones([1200,1200,1200,1200,1200], 0.2)},
        {label:'$2200$ Hz', sound:()=>tones([2200,2200,2200,2200,2200], 0.2)},
        {label:'bits $1\\,0\\,1\\,1\\,0$', sound:()=>tones([1200,2200,1200,1200,2200], 0.2)}]},
      svg:figBFSK,
      caption:'Two tones over one bit: $f_0T_b=3$ (dashed) and $f_0+\\Delta f$ (solid). Drag $\\Delta f$. The lowest value, $\\rho=-0.217$, falls at $\\Delta f=0.715/T_b$.'}
  ], right:[
    {t:'eq', label:'BFSK', tex:'s_i(t)=\\sqrt{\\frac{2E_b}{T_b}}\\cos(2\\pi f_it),\\qquad f_1=f_0+\\Delta f',
      note:'A one and a zero send two tones of energy $E_b$ each.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Correlation', tex:'\\rho=\\frac{1}{E_b}\\int_0^{T_b}s_0(t)\\,s_1(t)\\,dt\\approx\\frac{\\sin(2\\pi\\Delta fT_b)}{2\\pi\\Delta fT_b}',
        note:'The sum-frequency term averages out when $f_0\\gg1/T_b$. $\\rho=0$ at $\\Delta f=n/(2T_b)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · BFSK', tex:'d_{\\min}=\\sqrt{2E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)',
        note:'Two orthogonal points: $d^{2}=2E_b$ against $4E_b$ for BPSK. BFSK needs $3$ dB more energy.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'BFSK with bit time $T_b$.<div class="nsep"></div>What is the smallest spacing that keeps the tones orthogonal?',
        ask:{key:'m5-bfsk', choices:['$1/(4T_b)$','$1/(2T_b)$','$1/T_b$'], answer:1,
          why:'$\\rho=0$ first at $2\\pi\\Delta fT_b=\\pi$, so $\\Delta f=1/(2T_b)$.'}}]}
  ]}
]},

{ id:'m5-bask', module:'M5', nav:'Binary amplitude-shift keying', title:'Binary amplitude-shift keying',
  objective:'Send a bit by switching the carrier on and off, and relate peak and average energy.',
  keywords:'bask on-off keying ook amplitude shift keying peak energy average energy Eb = E/2 threshold constellation frames',
  src:'CH9 s.70–71', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Putting bits on a carrier'},
  {t:'title', text:'Binary amplitude-shift keying'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['waveform','energy','constellation']}, svg:figBASK,
      caption:'On-off keying of $1\\,0\\,1\\,1\\,0$ with peak energy $E=2$ a bit. Step to the energy of each bit and to the points on one axis.'}
  ], right:[
    {t:'eq', label:'BASK', tex:'s_1(t)=\\sqrt{\\frac{2E}{T_b}}\\cos(2\\pi f_ct),\\qquad s_0(t)=0',
      note:'A one sends the carrier and a zero sends nothing.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Average energy', tex:'E_b=\\tfrac12E+\\tfrac12(0)=\\frac{E}{2}',
        note:'Ones and zeros are equally likely. Only the ones cost energy.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · BASK', tex:'d=\\sqrt{E}=\\sqrt{2E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)',
        note:'The same distance as BFSK at the same average energy.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'BASK with peak energy $E=2$.<div class="nsep"></div>What is the average energy a bit?',
        ask:{key:'m5-bask', choices:['$0.5$','$1$','$2$'], answer:1,
          why:'$E_b=E/2=1$. Common error: use the average $E_b$, not the peak $E$, in $P_b$.'}}]}
  ]}
]},

{ id:'m5-binary-pe', module:'M5', nav:'Three binary schemes compared', title:'Three binary schemes compared',
  objective:'Compare the error probabilities of BPSK, BFSK and BASK and read the 3 dB gap.',
  keywords:'binary comparison bpsk bfsk bask error probability 3 dB antipodal orthogonal on-off slider',
  src:'CH9 s.72', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 5 · Putting bits on a carrier'},
  {t:'title', text:'Three binary schemes compared'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'g', label:'$E_b/N_0$', min:0, max:15, step:0.1, v:9.6, show:dBshow}]},
      svg:figBinaryPe,
      caption:'Drag $E_b/N_0$. At $10^{-5}$ the dashed curve sits $3$ dB to the right of the solid one.'},
    {t:'legend', items:[['err','BPSK'],['err','BFSK, BASK',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Squared distance', tex:'\\text{BPSK: }d^{2}=4E_b,\\qquad \\text{BFSK, BASK: }d^{2}=2E_b',
      note:'Half the squared distance costs a factor $2$ in energy, $10\\log_{10}2=3$ dB.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Same energy, same error', html:'BFSK and BASK need the same average $E_b/N_0$. BASK spends it only on the ones.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'BPSK reaches $P_b=10^{-5}$ at $9.6$ dB.<div class="nsep"></div>Where does BFSK reach it?',
        ask:{key:'m5-binary-pe', choices:['$9.6$ dB','$12.6$ dB','$15.6$ dB'], answer:1,
          why:'Half the squared distance: $9.6+3.0=12.6$ dB.'}}]}
  ]}
]},

{ id:'m5-ex-binary', module:'M5', nav:'Worked example · a binary link', title:'Worked example: a binary link',
  objective:'Turn a received power, a bit rate and a noise density into the bit error of BPSK and BFSK.',
  keywords:'worked example received power bit rate noise density Eb/N0 10 dB bpsk bfsk error probability frames',
  src:'CH9 s.72', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Worked example'},
  {t:'title', text:'Worked example: a binary link'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['curves','$10$ dB','BPSK','BFSK']}, svg:figExBinary,
      caption:'$E_b/N_0=10$ dB read on both curves. Solid: BPSK. Dashed: BFSK.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'A link receives $P=4\\times10^{-15}$ W at $R_b=100$ kb/s, with $N_0=4\\times10^{-21}$ W/Hz.<div class="nsep"></div>Find $P_b$ for BPSK and BFSK. What is $E_b/N_0$?',
      ask:{key:'m5-ex-binary', choices:['$1$','$10$','$100$'], answer:1,
        why:'$E_b=P/R_b=4\\times10^{-20}$ J, so $E_b/N_0=10$, or $10$ dB.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'E_b=\\frac{P}{R_b}=\\frac{4\\times10^{-15}}{10^{5}}=4\\times10^{-20}\\ \\text{J},\\qquad \\frac{E_b}{N_0}=10',
        note:'Energy a bit is power times bit time.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}\\text{BPSK:}\\quad P_b&=Q(\\sqrt{20})=3.87\\times10^{-6}\\\\\\text{BFSK:}\\quad P_b&=Q(\\sqrt{10})=7.83\\times10^{-4}\\end{aligned}',
        note:'BFSK would need $8\\times10^{-15}$ W to match BPSK.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $E_b=P/R_b$, not $P$, over $N_0$. $P/N_0=10^{6}$ Hz is not a signal-to-noise ratio.'}]}
  ]}
]},

REAL_BINARY,

labScene('m5-lab-iq', 'X', 'The IQ modulator', 'Putting bits on a carrier',
  'Build carrier waveforms from I and Q and watch the constellation point and the envelope respond.',
  'laboratory iq modulator in-phase quadrature carrier waveform constellation envelope bits interactive',
  'Choose a scheme and send bits. Watch $I$ and $Q$ set each point and the carrier follow them.'),

codeScene('m5-code-binary', 'Binary keying', 'Binary keying in code',
  'Simulate BPSK, BFSK and BASK over noise and compare their bit errors with the formulas.',
  'code matlab python program run bpsk bfsk bask simulation bit error rate Q function comparison'),

/* ---------------------------------------------------------------- 5.2 ---- */
{ id:'m5-mpsk', module:'M5', nav:'M-ary phase-shift keying', title:'M-ary phase-shift keying',
  objective:'Place M points on a circle and find the distance between neighbours.',
  keywords:'mpsk m-ary phase shift keying circle equal energy neighbour distance d_min sin pi/M cosine rule slider',
  src:'CH9 s.74–75', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'M-ary phase-shift keying'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'k', label:'$M$', min:1, max:5, step:1, v:3, show:v=>'$'+(1<<v)+'$'}]},
      svg:figMPSK,
      caption:'$M$ points on a circle of radius $\\sqrt{E_s}$, here $E_s=1$. Drag $M$. The red chord is $d_{\\min}$.'}
  ], right:[
    {t:'eq', label:'M-PSK', tex:'s_m(t)=\\sqrt{\\frac{2E_s}{T}}\\cos\\!\\left(2\\pi f_ct+\\frac{2\\pi m}{M}\\right),\\quad m=0,\\ldots,M-1',
      note:'Equal energy, $M$ phases. Each symbol carries $k=\\log_2M$ bits.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Neighbour distance', tex:'\\begin{aligned}d_{\\min}^{2}&=E_s+E_s-2E_s\\cos\\frac{2\\pi}{M}\\\\&=4E_s\\sin^{2}\\frac{\\pi}{M}\\end{aligned}',
        note:'The cosine rule on two neighbours, then $1-\\cos2x=2\\sin^{2}x$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Check', html:'At $M=2$, $d_{\\min}=2\\sqrt{E_s}$: BPSK. Each doubling of $M$ nearly halves $d_{\\min}$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'QPSK with $E_s=2$.<div class="nsep"></div>What is $d_{\\min}$?',
        ask:{key:'m5-mpsk', choices:['$\\sqrt2$','$2$','$2\\sqrt2$'], answer:1,
          why:'$d_{\\min}=2\\sqrt2\\,\\sin(\\pi/4)=2\\sqrt2/\\sqrt2=2$.'}}]}
  ]}
]},

{ id:'m5-qpsk', module:'M5', nav:'QPSK as two BPSK links', title:'QPSK as two BPSK links',
  objective:'Split a QPSK signal into a cosine half and a sine half and read its bit error.',
  keywords:'qpsk quadrature phase shift keying two bpsk links cosine sine halves bit error same as bpsk symbol error frames',
  src:'CH9 s.76', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'QPSK as two BPSK links'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$s(t)$','$s_I(t)$','$s_Q(t)$','decide']}, svg:figQPSK,
      caption:'The QPSK burst of the IQ modulator and its two halves. Each half is a BPSK signal. The last step decides each sign on its own.'}
  ], right:[
    {t:'eq', label:'Two halves', tex:'s(t)=\\underbrace{I\\cos(2\\pi f_ct)}_{\\text{BPSK on }\\cos}-\\underbrace{Q\\sin(2\\pi f_ct)}_{\\text{BPSK on }\\sin}',
      note:'The carriers are orthogonal, so the noise on one half does not reach the other.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · QPSK', tex:'P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right),\\qquad P_e=1-(1-P_b)^{2}\\approx2P_b',
        note:'Twice the bits of BPSK in the same band, at the same bit error.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'QPSK and BPSK run at the same $E_b/N_0$.<div class="nsep"></div>How does the QPSK bit error compare?',
        ask:{key:'m5-qpsk', choices:['the same','twice as large','half as large'], answer:0,
          why:'Each QPSK bit rides its own BPSK link with the same $E_b$. Both give $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.'}}]}
  ]}
]},

{ id:'m5-psk-detect', module:'M5', nav:'Detecting PSK by phase', title:'Detecting PSK by phase',
  objective:'Decide an M-PSK symbol from the angle of the two correlator outputs.',
  keywords:'psk detection two correlators phase angle atan2 nearest phase wedge decision regions 8-psk frames',
  src:'CH9 s.77', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'Detecting PSK by phase'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['points','$50^{\\circ}$','$160^{\\circ}$','$-100^{\\circ}$']}, svg:figPSKDetect,
      caption:'8-PSK and its wedges. Step through three received points. The receiver keeps the angle $\\theta$ and picks the nearest phase.'}
  ], right:[
    {t:'eq', label:'Two correlators', tex:'y_1=\\int_0^{T}r(t)\\,\\psi_1(t)\\,dt,\\qquad y_2=\\int_0^{T}r(t)\\,\\psi_2(t)\\,dt',
      note:'$\\psi_1=\\sqrt{2/T}\\cos(2\\pi f_ct)$ and $\\psi_2=-\\sqrt{2/T}\\sin(2\\pi f_ct)$, the basis of the IQ modulator.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Phase decision', tex:'\\theta=\\operatorname{atan2}(y_2,y_1),\\qquad \\hat m=\\text{the }m\\text{ with }\\tfrac{2\\pi m}{M}\\text{ nearest }\\theta',
        note:'All points have equal energy, so the nearest point has the nearest phase. The length of $\\mathbf y$ plays no part.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'An 8-PSK receiver measures $\\theta=50^{\\circ}$.<div class="nsep"></div>Which phase does it pick?',
        ask:{key:'m5-psk-detect', choices:['$45^{\\circ}$','$90^{\\circ}$','$0^{\\circ}$'], answer:0,
          why:'The phases are $45^{\\circ}$ apart. $50^{\\circ}$ is $5^{\\circ}$ from $45^{\\circ}$ and $40^{\\circ}$ from $90^{\\circ}$.'}}]}
  ]}
]},

{ id:'m5-mpsk-pe', module:'M5', nav:'M-PSK error probability', title:'M-PSK error probability',
  objective:'Read the symbol error of M-PSK from its two nearest neighbours and the cost of doubling M.',
  keywords:'mpsk symbol error probability nearest neighbour 2Q sin pi/M energy per bit doubling cost 3.57 dB slider',
  src:'CH9 s.78', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'M-PSK error probability'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'g', label:'$E_b/N_0$', min:0, max:26, step:0.5, v:10, show:dBshow}]},
      svg:figMPSKPe,
      caption:'Symbol error of M-PSK for $M=2$ to $32$. $M=2$ and $4$ nearly share one curve. Drag $E_b/N_0$.'}
  ], right:[
    {t:'eq', label:'Symbol error', tex:'P_e\\approx2Q\\!\\left(\\sqrt{\\frac{2E_s}{N_0}}\\,\\sin\\frac{\\pi}{M}\\right),\\qquad E_s=kE_b',
      note:'Two neighbours at $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/M)$ in the nearest-neighbour form of Module 4.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Cost of doubling M', tex:'\\frac{E_{s,8}}{E_{s,4}}=\\frac{\\sin^{2}(\\pi/4)}{\\sin^{2}(\\pi/8)}=3.41\\;(5.33\\text{ dB})',
        note:'The same $d_{\\min}$ needs $3.41$ times the symbol energy. The cost tends to $6$ dB a doubling.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'QPSK moves to 8-PSK at the same $P_e$.<div class="nsep"></div>How much more $E_b/N_0$ does it need?',
        ask:{key:'m5-mpsk-pe', choices:['about $1$ dB','about $3.6$ dB','about $6$ dB'], answer:1,
          why:'$E_s$ grows by $5.33$ dB but now carries $3$ bits, not $2$: $5.33-10\\log_{10}1.5=3.57$ dB.'}}]}
  ]}
]},

{ id:'m5-gray', module:'M5', nav:'Gray labels', title:'Gray labels',
  objective:'Label the points so that neighbours differ in one bit, and turn symbol errors into bit errors.',
  keywords:'gray code labels neighbours one bit symbol error bit error P_b = P_e/k natural labels 8-psk simulation frames',
  src:'CH9 s.99', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'Gray labels'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['natural','bits a step','Gray','noise']}, svg:figGray,
      caption:'8-PSK with natural labels, then Gray labels. Each chord shows how many bits its two labels differ in. The last step sends $300$ noisy copies of $\\mathtt{000}$.'}
  ], right:[
    {t:'eq', label:'Gray code', tex:'g=i\\oplus\\lfloor i/2\\rfloor',
      note:'For $i=0,\\ldots,7$: $\\mathtt{000},\\mathtt{001},\\mathtt{011},\\mathtt{010},\\mathtt{110},\\mathtt{111},\\mathtt{101},\\mathtt{100}$. Neighbours differ in one bit.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Bits from symbols', tex:'P_b\\approx\\frac{P_e}{\\log_2M}',
        note:'A symbol error nearly always lands on a neighbour, and a neighbour costs one bit of $k$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Natural labels', html:'Natural labels put $\\mathtt{011}$ beside $\\mathtt{100}$. That one symbol error costs three bits.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'8-PSK with Gray labels has $P_e=3\\times10^{-3}$.<div class="nsep"></div>What is $P_b$?',
        ask:{key:'m5-gray', choices:['$3\\times10^{-3}$','$10^{-3}$','$3.75\\times10^{-4}$'], answer:1,
          why:'$P_b\\approx P_e/3=10^{-3}$.'}}]}
  ]}
]},

{ id:'m5-ex-psk', module:'M5', nav:'Worked example · 8-PSK', title:'Worked example: 8-PSK',
  objective:'Find the symbol and bit error of 8-PSK with Gray labels at a given energy per bit.',
  keywords:'worked example 8-psk gray Eb/N0 10 dB Es/N0 30 symbol error bit error wedge neighbours frames',
  src:'CH9 s.78', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Worked example'},
  {t:'title', text:'Worked example: 8-PSK'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['points','wedge','neighbours']}, svg:figExPSK,
      caption:'The sent point $\\mathbf s_0$ and its wedge of $\\pm22.5^{\\circ}$. The red half-planes lie nearer a neighbour, each $d_{\\min}$ away.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'8-PSK with Gray labels at $E_b/N_0=10$ dB.<div class="nsep"></div>Find $P_e$ and $P_b$. What is $E_s/N_0$ as a ratio?',
      ask:{key:'m5-ex-psk', choices:['$10$','$30$','$3.3$'], answer:1,
        why:'$10$ dB is a ratio of $10$, and each symbol carries $3$ bits: $E_s/N_0=30$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\frac{E_s}{N_0}=3(10)=30,\\qquad x=\\sqrt{2(30)}\\,\\sin\\frac{\\pi}{8}=2.96',
        note:'Two neighbours, each $d_{\\min}$ from the sent point.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}P_e&\\approx2Q(2.96)=2(1.52\\times10^{-3})=3.0\\times10^{-3}\\\\P_b&\\approx\\frac{P_e}{3}=1.0\\times10^{-3}\\end{aligned}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $E_s=3E_b$, not $E_b$, inside $Q$. With $E_b$ the argument is $1.71$ and $P_e$ comes out as $0.087$.'}]}
  ]}
]},

{ id:'m5-phase-offset', module:'M5', nav:'A carrier phase error', title:'A carrier phase error',
  objective:'See how a carrier phase error turns the constellation and why a receiver can lock to the wrong phase.',
  keywords:'carrier phase error offset rotation qpsk quadrant decisions ambiguity 2pi/M differential encoding slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'A carrier phase error'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'phi', label:'$\\varphi$', min:0, max:90, step:1, v:20, show:v=>'$'+v+'^{\\circ}$'}]},
      svg:figPhaseOffset,
      caption:'QPSK with $200$ noisy symbols, decided in the fixed quadrants. The green rings are the points turned by a carrier phase error $\\varphi$. Drag $\\varphi$.'}
  ], right:[
    {t:'eq', label:'A phase error', tex:'r(t)=\\sqrt{\\tfrac{2E_s}{T}}\\cos(2\\pi f_ct+\\theta_m+\\varphi)+n(t)',
      note:'A receiver whose carrier is off by $\\varphi$ sees every point turned by $\\varphi$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Ambiguity', html:'M-PSK looks the same after a turn of $2\\pi/M$. A receiver can lock its carrier to any of these $M$ phases.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Differential encoding', html:'Send the bits in the change of phase from one symbol to the next. A constant $\\varphi$ then cancels.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'QPSK is received with $\\varphi=90^{\\circ}$ and no noise.<div class="nsep"></div>How many decisions are right?',
        ask:{key:'m5-phase-offset', choices:['all','half','none'], answer:2,
          why:'Each point lands exactly on a neighbour, so every symbol is decided as that neighbour.'}}]}
  ]}
]},

{ id:'m5-dpsk', module:'M5', nav:'Differential PSK', title:'Differential PSK',
  objective:'Encode bits in phase changes and decide each symbol against the one before.',
  keywords:'dpsk differential phase shift keying encoding phase change previous symbol reference detection sketch',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'Differential PSK'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Mark $\\theta_n$'}, svg:figDPSK,
      caption:'The bits $1\\,0\\,1\\,1$ from $\\theta_0=0$. A one adds $\\pi$ to the phase and a zero adds nothing. Mark each $\\theta_n$, then reveal it.'}
  ], right:[
    {t:'eq', label:'Differential encoding', tex:'\\theta_n=\\theta_{n-1}+\\pi b_n\\pmod{2\\pi}',
      note:'The bit is in the change of phase, not in the phase itself.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Differential detection', tex:'\\hat b_n=1\\quad\\text{when}\\quad\\mathbf y_n\\cdot\\mathbf y_{n-1}<0',
        note:'Compare each received point with the one before. A constant phase error turns both and cancels.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Errors in pairs', html:'One badly received symbol spoils two comparisons, with the symbol before and the one after. DPSK errors tend to come in pairs.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The bits $1\\,0\\,1\\,1$ from $\\theta_0=0$, as drawn.<div class="nsep"></div>What is the final phase $\\theta_4$?',
        ask:{key:'m5-dpsk', choices:['$0$','$\\pi/2$','$\\pi$'], answer:2,
          why:'Three ones add $3\\pi$, which is $\\pi$ modulo $2\\pi$.'}}]}
  ]}
]},

{ id:'m5-dpsk-pe', module:'M5', nav:'DPSK error probability', title:'DPSK error probability',
  objective:'Compare binary DPSK with coherent BPSK and read the small price of the missing carrier phase.',
  keywords:'dpsk error probability 1/2 exp(-Eb/N0) bpsk comparison 0.75 dB noncoherent reference slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'DPSK error probability'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'g', label:'$E_b/N_0$', min:0, max:15, step:0.1, v:10, show:dBshow}]},
      svg:figDPSKPe,
      caption:'Solid: coherent BPSK. Dashed: binary DPSK. At $10^{-5}$ they are $0.75$ dB apart. Drag $E_b/N_0$.'},
    {t:'legend', items:[['err','BPSK'],['err','DPSK',true]], at:'tr'}
  ], right:[
    {t:'eq', result:true, label:'Key result · binary DPSK', tex:'P_b=\\frac12e^{-E_b/N_0}',
      note:'No carrier phase is needed. The previous symbol is the reference.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Price', tex:'10.34\\text{ dB against }9.59\\text{ dB at }P_b=10^{-5}',
        note:'Binary DPSK costs less than $1$ dB.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Four phases and more', html:'For $M\\ge4$, differential detection costs about $3$ dB over coherent PSK. The reference symbol is as noisy as the one decided.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Binary DPSK at $E_b/N_0=10$ dB.<div class="nsep"></div>What is $P_b$?',
        ask:{key:'m5-dpsk-pe', choices:['$3.87\\times10^{-6}$','$2.27\\times10^{-5}$','$4.54\\times10^{-5}$'], answer:1,
          why:'$\\tfrac12e^{-10}=2.27\\times10^{-5}$. BPSK would give $3.87\\times10^{-6}$.'}}]}
  ]}
]},

REAL_PSK,

labScene('m5-lab-gray', 'Y', 'Gray labels', 'Phase-shift keying',
  'Compare the bit errors of Gray and natural labels on the same noisy symbols.',
  'laboratory gray code natural labels 8-psk symbol errors bit errors count interactive',
  'Pick a constellation and a noise level, then send symbols. Count bit errors under Gray and natural labels on the same draws.'),

codeScene('m5-code-psk', 'Phase-shift keying', 'Phase-shift keying in code',
  'Simulate M-PSK with Gray labels and compare its symbol and bit errors with the formulas.',
  'code matlab python program run mpsk gray labels symbol error bit error simulation dpsk'),

/* ---------------------------------------------------------------- 5.3 ---- */
{ id:'m5-mask', module:'M5', nav:'M-ary amplitude-shift keying', title:'M-ary amplitude-shift keying',
  objective:'Put M equally spaced amplitudes on one axis and find their energy and error probability.',
  keywords:'mask m-ary amplitude shift keying pam levels spacing average energy (M^2-1)d^2/12 symbol error 6 dB slider',
  src:'CH9 s.82–87', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
  {t:'title', text:'M-ary amplitude-shift keying'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'k', label:'$M$', min:1, max:4, step:1, v:2, show:v=>'$'+(1<<v)+'$'}]},
      svg:figMask,
      caption:'$M$ levels on one axis at unit average energy, with their thresholds. Drag $M$. The spacing shrinks as $\\sqrt{12/(M^{2}-1)}$.'}
  ], right:[
    {t:'eq', label:'M-ASK', tex:'s_m=(2m-1-M)\\,\\frac d2,\\qquad m=1,\\ldots,M',
      note:'Equally spaced amplitudes, $d$ apart, on one carrier: $\\pm d/2$, $\\pm3d/2$, and so on.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Average energy', tex:'E_s=\\frac{d^{2}}{4M}\\sum_{m=1}^{M}(2m-1-M)^{2}=\\frac{(M^{2}-1)\\,d^{2}}{12}',
        note:'The odd squares sum to $M(M^{2}-1)/3$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · M-ASK', tex:'P_e=\\frac{2(M-1)}{M}\\,Q\\!\\left(\\sqrt{\\frac{6E_s}{(M^{2}-1)N_0}}\\right)',
        note:'Inner points have two neighbours and the end points one. Each doubling of $M$ costs about $6$ dB.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'4-ASK with levels $\\pm1$, $\\pm3$, so $d=2$.<div class="nsep"></div>What is the average energy $E_s$?',
        ask:{key:'m5-mask', choices:['$2.5$','$5$','$10$'], answer:1,
          why:'$(1+9+9+1)/4=5$, or $(16-1)(4)/12=5$.'}}]}
  ]}
]},

{ id:'m5-ex-ask4', module:'M5', nav:'Worked example · four-level ASK', title:'Worked example: four-level ASK',
  objective:'Count the neighbours of four-level ASK and find its symbol error at a given SNR.',
  keywords:'worked example 4-ask four level amplitude neighbours 1.5 Es/N0 25 symbol error Q sqrt 10 frames',
  src:'CH9 s.88', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Worked example'},
  {t:'title', text:'Worked example: four-level ASK'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['points','$\\mathbf s_1$','$\\mathbf s_2$','$\\mathbf s_3$','$\\mathbf s_4$','average']}, svg:figExASK4,
      caption:'Four levels at $\\pm A$, $\\pm3A$. Step through the points and count the neighbours at distance $2A$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'4-ASK at $E_s/N_0=25$.<div class="nsep"></div>Find $P_e$. What is the average neighbour count $\\bar N_{\\min}$?',
      ask:{key:'m5-ex-ask4', choices:['$1$','$1.5$','$2$'], answer:1,
        why:'The end points have $1$ neighbour and the inner two have $2$: $(1+2+2+1)/4=1.5$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'E_s=\\frac{A^{2}(9+1+1+9)}{4}=5A^{2},\\qquad \\frac{d_{\\min}^{2}}{2N_0}=\\frac{4A^{2}}{2N_0}=\\frac{2E_s}{5N_0}',
        note:'Write $d_{\\min}=2A$ in terms of $E_s$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'P_e\\approx1.5\\,Q\\!\\left(\\sqrt{\\tfrac{2(25)}{5}}\\right)=1.5\\,Q(\\sqrt{10})=1.5(7.83\\times10^{-4})=1.17\\times10^{-3}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $\\bar N_{\\min}=1.5$, not $2$. The two end points have one neighbour each.'}]}
  ]}
]},

{ id:'m5-qam', module:'M5', nav:'Quadrature amplitude modulation', title:'Quadrature amplitude modulation',
  objective:'Build square QAM from two ASK axes and find its energy, neighbour count and error probability.',
  keywords:'qam quadrature amplitude modulation square grid two ask axes gray labels 16-qam average energy neighbours 3 frames',
  src:'CH9 s.89–95', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
  {t:'title', text:'Quadrature amplitude modulation'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$I$ levels','$Q$ levels','grid','neighbours']}, svg:figQAM,
      caption:'16-QAM is 4-ASK on the cosine and 4-ASK on the sine. Step to the grid with its Gray labels and to the neighbours of each point.'}
  ], right:[
    {t:'eq', label:'Square QAM', tex:'s(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct),\\qquad I,\\,Q\\in\\left\\{\\pm\\tfrac d2,\\pm\\tfrac{3d}{2},\\ldots\\right\\}',
      note:'Each axis carries $\\sqrt M$ levels, $d$ apart. Gray labels on each axis give neighbours that differ in one bit.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Average energy', tex:'E_s=2\\cdot\\frac{\\bigl((\\sqrt M)^{2}-1\\bigr)d^{2}}{12}=\\frac{(M-1)\\,d^{2}}{6}',
        note:'Two ASK axes, each with the energy of the last slide. 16-QAM with $d=2$ gives $E_s=10$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · square QAM', tex:'P_e\\approx4\\left(1-\\frac{1}{\\sqrt M}\\right)Q\\!\\left(\\sqrt{\\frac{3E_s}{(M-1)N_0}}\\right)',
        note:'The average neighbour count is $4(1-1/\\sqrt M)$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'16-QAM: $4$ corners with $2$ neighbours, $8$ edge points with $3$ and $4$ inner points with $4$.<div class="nsep"></div>What is $\\bar N_{\\min}$?',
        ask:{key:'m5-qam', choices:['$2$','$3$','$4$'], answer:1,
          why:'$(4\\cdot2+8\\cdot3+4\\cdot4)/16=48/16=3$.'}}]}
  ]}
]},

{ id:'m5-qam-pe', module:'M5', nav:'QAM error probability', title:'QAM error probability',
  objective:'Compare the exact symbol error of square QAM with its nearest-neighbour form.',
  keywords:'qam error probability exact 1-(1-P)^2 per axis nearest neighbour 4-qam 16-qam 64-qam 3 dB per bit slider',
  src:'CH9 s.94–95', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
  {t:'title', text:'QAM error probability'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'g', label:'$E_b/N_0$', min:0, max:24, step:0.5, v:12, show:dBshow}]},
      svg:figQAMPe,
      caption:'Symbol error of square QAM for $M=4$, $16$ and $64$. Solid: exact. Dashed: nearest-neighbour form. Drag $E_b/N_0$.'},
    {t:'legend', items:[['err','exact'],['mid','nearest neighbour',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Exact square QAM', tex:'P_e=1-\\bigl(1-P_{\\sqrt M}\\bigr)^{2},\\qquad P_{\\sqrt M}=2\\left(1-\\tfrac{1}{\\sqrt M}\\right)Q\\!\\left(\\sqrt{\\tfrac{3E_s}{(M-1)N_0}}\\right)',
      note:'A symbol is right only when both axes are right. Each axis is a $\\sqrt M$-level ASK.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Close at high SNR', html:'Expanding the square gives $2P_{\\sqrt M}-P_{\\sqrt M}^{2}$. The nearest-neighbour form keeps only $2P_{\\sqrt M}$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Three dB a bit', html:'At a fixed $d_{\\min}$, $E_s$ grows as $M-1$. Each extra bit a symbol costs about $3$ dB of $E_s/N_0$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Each axis of 16-QAM has $P_{\\sqrt M}=10^{-3}$.<div class="nsep"></div>What is $P_e$?',
        ask:{key:'m5-qam-pe', choices:['$10^{-3}$','about $2\\times10^{-3}$','$10^{-6}$'], answer:1,
          why:'$1-(1-10^{-3})^{2}=1.999\\times10^{-3}$, about $2\\times10^{-3}$.'}}]}
  ]}
]},

{ id:'m5-qam-shapes', module:'M5', nav:'Eight-point constellations', title:'Eight-point constellations',
  objective:'Compare four eight-point sets with the same minimum distance by their average energy.',
  keywords:'eight point constellations rectangle circle pam-psk hybrid average energy d_min 2 1 dB gain packing frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
  {t:'title', text:'Eight-point constellations'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['(a)','(b)','(c)','(d)']}, svg:figShapes,
      caption:'Four sets of eight points, each with $d_{\\min}=2$ (violet chord). Step through them and compare the average energy.'}
  ], right:[
    {t:'note', kind:'def', head:'Same distance', html:'All four sets keep neighbours $2$ apart, so at high SNR they err at about the same rate. The best set needs the least energy.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Average energy', tex:'\\text{(a) }6,\\qquad\\text{(b) }6.83,\\qquad\\text{(c) }6,\\qquad\\text{(d) }4.73',
        note:'Set (d) puts four points on an inner square and four on the axes at $1+\\sqrt3$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Gain', tex:'10\\log_{10}\\frac{6}{4.73}=1.03\\text{ dB}',
        note:'Set (d) saves about $1$ dB over the rectangle (a). The packing matters, not the grid.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The four sets as drawn, all with $d_{\\min}=2$.<div class="nsep"></div>Which one needs the least energy?',
        ask:{key:'m5-qam-shapes', choices:['(a)','(b)','(d)'], answer:2,
          why:'$E=4.73$ for (d), against $6$, $6.83$ and $6$.'}}]}
  ]}
]},

{ id:'m5-ex-qam16', module:'M5', nav:'Worked example · 16-QAM', title:'Worked example: 16-QAM',
  objective:'Find the energy, symbol error and bit error of 16-QAM with Gray labels.',
  keywords:'worked example 16-qam decision boundaries average energy 10 Es/N0 80 symbol error 3Q(4) bit error gray sketch',
  src:'CH9 s.96', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Worked example'},
  {t:'title', text:'Worked example: 16-QAM'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Draw the boundaries'}, svg:figExQAM16,
      caption:'16-QAM on the grid $\\pm1$, $\\pm3$. Draw the decision boundaries, then reveal them.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'16-QAM with $d_{\\min}=2$ and $E_s/N_0=80$, about $19$ dB.<div class="nsep"></div>Find $P_e$ and $P_b$. What is $E_s$?',
      ask:{key:'m5-ex-qam16', choices:['$5$','$10$','$20$'], answer:1,
        why:'$E_s=(M-1)d^{2}/6=15(4)/6=10$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\frac{d_{\\min}^{2}}{2N_0}=\\frac{3E_s}{15N_0}=\\frac{E_s}{5N_0}=16,\\qquad \\bar N_{\\min}=3',
        note:'The boundaries sit halfway between levels, at $0$ and $\\pm2$ on each axis.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}P_e&\\approx3\\,Q(\\sqrt{16})=3\\,Q(4)=9.5\\times10^{-5}\\\\P_b&\\approx\\frac{P_e}{4}=2.4\\times10^{-5}\\end{aligned}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $\\bar N_{\\min}=3$, not $4$. Only the four inner points have four neighbours.'}]}
  ]}
]},

{ id:'m5-qam-vs-psk', module:'M5', nav:'QAM against PSK', title:'QAM against PSK',
  objective:'Compare the distance of QAM and PSK at the same average energy and read the gain of QAM.',
  keywords:'qam versus psk same energy distance ratio advantage 4.20 dB 9.95 dB 16 64 circle grid slider',
  src:'CH9 s.97–98', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
  {t:'title', text:'QAM against PSK'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'k', label:'$M$', min:1, max:3, step:1, v:2, show:v=>'$'+Math.pow(4,v)+'$'}]},
      svg:figQAMvsPSK,
      caption:'PSK (rings) and square QAM (dots) at the same $E_s=1$. Drag $M$. The dashed chord is the PSK $d_{\\min}$ and the solid one the QAM $d_{\\min}$.'}
  ], right:[
    {t:'eq', label:'Distance at equal energy', tex:'d_{\\text{QAM}}^{2}=\\frac{6E_s}{M-1},\\qquad d_{\\text{PSK}}^{2}=4E_s\\sin^{2}\\frac{\\pi}{M}',
      note:'Both from earlier slides, at the same average energy.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Advantage', tex:'R_M=\\frac{d_{\\text{QAM}}^{2}}{d_{\\text{PSK}}^{2}}=\\frac{3}{2(M-1)\\sin^{2}(\\pi/M)}',
        note:'Above $1$, QAM needs less energy for the same $d_{\\min}$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'The gap grows', html:'QAM saves $1.65$, $4.20$, $7.02$ and $9.95$ dB over PSK at $M=8$, $16$, $32$ and $64$. PSK uses only a circle, QAM the whole plane.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'16-QAM against 16-PSK at the same $d_{\\min}$.<div class="nsep"></div>How much energy does QAM save?',
        ask:{key:'m5-qam-vs-psk', choices:['$1.65$ dB','$4.20$ dB','$9.95$ dB'], answer:1,
          why:'$R_{16}=3/\\bigl(30\\sin^{2}(\\pi/16)\\bigr)=2.63$, or $4.20$ dB.'}}]}
  ]}
]},

REAL_QAM,

labScene('m5-lab-h', 'H', 'Error probability against signal-to-noise ratio', 'Amplitude and quadrature',
  'Measure the error probability of ASK, PSK and QAM against the signal-to-noise ratio and compare with the formulas.',
  'laboratory error probability snr simulation ask psk qam curves formula comparison interactive',
  'Choose schemes and a range of $E_b/N_0$, then run. Each measured point lands beside its formula.'),

codeScene('m5-code-qam', 'Amplitude and quadrature', 'QAM in code',
  'Simulate ASK and square QAM and compare their symbol errors with the exact and nearest-neighbour forms.',
  'code matlab python program run ask qam 16-qam 64-qam symbol error exact nearest neighbour simulation'),

/* ---------------------------------------------------------------- 5.4 ---- */
{ id:'m5-mfsk', module:'M5', nav:'M-ary frequency-shift keying', title:'M-ary frequency-shift keying',
  objective:'Send one of M orthogonal tones and read the geometry and error bound of orthogonal signals.',
  keywords:'mfsk m-ary frequency shift keying orthogonal signals tones axes equal distance sqrt 2Es union bound frames',
  src:'CH9 s.79–81', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Frequency-shift keying'},
  {t:'title', text:'M-ary frequency-shift keying'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['axes','distances','decide']}, svg:figMFSK,
      caption:'Three orthogonal signals, one on each axis at $\\sqrt{E_s}$ from the origin. Every pair is $\\sqrt{2E_s}$ apart. The receiver picks the largest correlator output.'}
  ], right:[
    {t:'eq', label:'M-FSK', tex:'s_m(t)=\\sqrt{\\frac{2E_s}{T}}\\cos\\bigl(2\\pi(f_c+m\\,\\Delta f)\\,t\\bigr),\\qquad \\Delta f=\\frac{1}{2T}',
      note:'$M$ tones, each orthogonal to the others. Each is one axis of an $M$-dimensional space.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Distances', tex:'\\|\\mathbf s_i-\\mathbf s_j\\|^{2}=2E_s,\\qquad i\\ne j',
        note:'Every point is a neighbour of every other: $M-1$ neighbours at one distance.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · orthogonal signals', tex:'P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{E_s}{N_0}}\\right),\\qquad E_s=E_b\\log_2M',
        note:'The union bound of Module 4. More tones add bits without bringing the points closer.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'8-FSK.<div class="nsep"></div>How many nearest neighbours does each point have?',
        ask:{key:'m5-mfsk', choices:['$2$','$3$','$7$'], answer:2,
          why:'All $M-1=7$ other points are $\\sqrt{2E_s}$ away.'}}]}
  ]}
]},

{ id:'m5-orth-m', module:'M5', nav:'More signals, less energy', title:'More signals, less energy',
  objective:'See the energy per bit of orthogonal signals fall as M grows, toward a limit.',
  keywords:'orthogonal signals exact bit error M 2 to 64 energy per bit falls limit -1.6 dB ln 2 module 6 frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Frequency-shift keying'},
  {t:'title', text:'More signals, less energy'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$M=2$','$4$','$8$','$16$','$32$','$64$']}, svg:figOrthM,
      caption:'Exact bit error of $M$ orthogonal signals. Step up $M$: the curves move left. The faint wall at $-1.6$ dB is a limit that Module 6 derives.'}
  ], right:[
    {t:'eq', label:'Bits from symbols', tex:'P_b=\\frac{2^{k-1}}{2^{k}-1}\\,P_e',
      note:'A wrong symbol is any of the other $M-1$ with equal chance. Each bit differs in $2^{k-1}$ of them.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Less energy a bit', html:'At $P_b=10^{-5}$, $M=2$ needs $12.6$ dB and $M=64$ about $6.1$ dB. Each doubling of $M$ lowers the $E_b/N_0$ needed.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'A floor', html:'The gain has a limit. As $M$ grows, $P_b\\to0$ only above $E_b/N_0=\\ln2$, or $-1.6$ dB. Module 6 shows why.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Orthogonal signals with $M$ as large as you like.<div class="nsep"></div>Can $P_b\\to0$ below $-1.6$ dB?',
        ask:{key:'m5-orth-m', choices:['yes, with large $M$','no','only with Gray labels'], answer:1,
          why:'More signals move the curves toward the wall, not past it.'}}]}
  ]}
]},

{ id:'m5-noncoh', module:'M5', nav:'Noncoherent FSK', title:'Noncoherent FSK',
  objective:'Detect FSK without the carrier phase and read what it costs.',
  keywords:'noncoherent fsk envelope detector unknown phase cosine sine correlators spacing 1/T error probability 1/2 exp(-Eb/2N0) slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Frequency-shift keying'},
  {t:'title', text:'Noncoherent FSK'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'phi', label:'$\\varphi$', min:0, max:180, step:5, v:60, show:v=>'$'+v+'^{\\circ}$'}]},
      svg:figNoncoh,
      caption:'Top: a tone with unknown phase $\\varphi$ gives $y_c=\\cos\\varphi$ and $y_s=\\sin\\varphi$. Its envelope stays $1$. Bottom: coherent (solid) and noncoherent (dashed) BFSK.'}
  ], right:[
    {t:'eq', label:'Envelope detector', tex:'\\ell_i=\\sqrt{y_{c,i}^{2}+y_{s,i}^{2}}',
      note:'A cosine and a sine correlator for each tone. The length of $(y_c,y_s)$ does not depend on $\\varphi$. Pick the larger $\\ell_i$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Spacing', tex:'\\Delta f=\\frac1T',
        note:'Without the phase the tones must stay orthogonal for every $\\varphi$. That takes twice the coherent spacing.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · noncoherent BFSK', tex:'P_b=\\frac12e^{-E_b/2N_0}',
        note:'At $10^{-5}$: $13.4$ dB against $12.6$ dB coherent. It needs twice the energy of binary DPSK.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A noncoherent BFSK receiver with symbol time $T$.<div class="nsep"></div>What spacing keeps the tones orthogonal for every phase?',
        ask:{key:'m5-noncoh', choices:['$1/(4T)$','$1/(2T)$','$1/T$'], answer:2,
          why:'Both the cosine and the sine correlations must vanish. That first happens at $\\Delta f=1/T$.'}}]}
  ]}
]},

REAL_FSK,

labScene('m5-lab-fsk', 'Z', 'Orthogonal signals and FSK', 'Frequency-shift keying',
  'Send M-FSK over noise and watch the energy per bit needed fall as M grows.',
  'laboratory mfsk orthogonal tones correlator outputs largest noncoherent envelope error rate M interactive',
  'Choose $M$ and $E_b/N_0$, then send tones. Watch the correlator outputs, the largest one win, and the error count change with $M$.'),

codeScene('m5-code-fsk', 'Frequency-shift keying', 'FSK in code',
  'Simulate coherent and noncoherent M-FSK and compare their errors with the formulas.',
  'code matlab python program run mfsk orthogonal noncoherent envelope detector simulation error'),

/* ---------------------------------------------------------------- 5.5 ---- */
{ id:'m5-spectrum', module:'M5', nav:'Spectrum and bandwidth', title:'Spectrum and bandwidth',
  objective:'Relate the bits a symbol to the width of the spectrum and the band of each family.',
  keywords:'spectrum bandwidth sinc squared main lobe 2Rb/k pam psk qam orthogonal band W = Rb/log2M M Rb/2log2M slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Bandwidth and the choice of scheme'},
  {t:'title', text:'Spectrum and bandwidth'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'k', label:'$k$', min:1, max:5, step:1, v:2, show:v=>'$'+v+'$'}]},
      svg:figSpectrum,
      caption:'Top: PSK or QAM with a rectangular pulse at a fixed bit rate. Dashed: $k=1$. Drag $k$: the main lobe narrows to $2R_b/k$. Bottom: the band each family needs.'}
  ], right:[
    {t:'eq', label:'Spectrum', tex:'S(f)\\propto T\\operatorname{sinc}^{2}(fT),\\qquad T=kT_b',
      note:'Here $\\operatorname{sinc}x=\\sin(\\pi x)/(\\pi x)$. Longer symbols give a narrower spectrum, and the passband copy sits at $\\pm f_c$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Band of each family', tex:'\\text{PAM (SSB): }\\frac{R_b}{2\\log_2M},\\qquad\\text{PSK, QAM: }\\frac{R_b}{\\log_2M},\\qquad\\text{orthogonal: }\\frac{MR_b}{2\\log_2M}',
        note:'Orthogonal signals need $M$ dimensions a symbol, so their band grows with $M$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Example', html:'16-QAM at $10$ Mb/s carries $4$ bits a symbol, so $W=10/4=2.5$ MHz.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'QPSK and BPSK at the same bit rate.<div class="nsep"></div>How wide is the QPSK main lobe?',
        ask:{key:'m5-spectrum', choices:['half as wide','as wide','twice as wide'], answer:0,
          why:'QPSK symbols last $2T_b$, so the main lobe is $R_b$ wide against $2R_b$ for BPSK.'}}]}
  ]}
]},

{ id:'m5-msk', module:'M5', nav:'Offset QPSK and MSK', title:'Offset QPSK and MSK',
  objective:'Follow the envelope of QPSK, offset QPSK and MSK, and compare their spectra.',
  keywords:'offset qpsk oqpsk msk minimum shift keying constant envelope trajectory origin continuous phase spectrum side lobes frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Bandwidth and the choice of scheme'},
  {t:'title', text:'Offset QPSK and MSK'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['QPSK','offset QPSK','MSK','spectra']}, svg:figMSK,
      caption:'Eight bits sent three ways. Top: the path of $(I,Q)$. Bottom: the envelope. The last step compares the spectra.'}
  ], right:[
    {t:'note', kind:'def', head:'Offset QPSK', html:'Delay $Q$ by $T_b$. Only one axis changes at a time, so the path never crosses the origin and the envelope stays above $1/\\sqrt2$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'MSK', tex:'\\Delta\\theta=\\pm\\frac{\\pi}{2}\\ \\text{a bit},\\qquad \\Delta f=\\frac{1}{2T_b}',
        note:'Each bit turns the phase by $\\pm\\pi/2$ at a steady rate. MSK is BFSK at the least orthogonal spacing, with a continuous phase.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Spectrum', html:'The MSK main lobe reaches $0.75/T_b$ against $0.5/T_b$, so it is $50\\%$ wider. Its side lobes fall much faster.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'QPSK, offset QPSK and MSK.<div class="nsep"></div>Which keeps a constant envelope?',
        ask:{key:'m5-msk', choices:['QPSK','offset QPSK','MSK'], answer:2,
          why:'The MSK phase moves along the circle, so $|s(t)|$ never changes.'}}]}
  ]}
]},

{ id:'m5-plane', module:'M5', nav:'The bandwidth-efficiency plane', title:'The bandwidth-efficiency plane',
  objective:'Place each family on a plane of bits a second per hertz against energy per bit.',
  keywords:'bandwidth efficiency plane R/W bits per second per hertz Eb/N0 bandwidth-limited power-limited pam psk qam orthogonal limit slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Bandwidth and the choice of scheme'},
  {t:'title', text:'The bandwidth-efficiency plane'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'e', label:'$P_e$', min:-7, max:-3, step:1, v:-5, show:v=>'$10^{'+v+'}$'}]},
      svg:figPlane,
      caption:'$R_b/W$ against the $E_b/N_0$ each set needs for the target $P_e$, for $M$ up to $64$. The faint curve is a limit that Module 6 derives. Drag $P_e$.'}
  ], right:[
    {t:'eq', label:'Bandwidth efficiency', tex:'r=\\frac{R_b}{W}\\ \\text{b/s/Hz}',
      note:'PAM, PSK and QAM raise $r$ with $M$. Orthogonal signals lower it.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Two regions', html:'<div class="cmp"><div><span class="cmp-h">$r>1$: bandwidth-limited</span>PAM, PSK and QAM. More bits a symbol, more energy a bit.</div><div><span class="cmp-h">$r<1$: power-limited</span>Orthogonal signals. More band, less energy a bit.</div></div>'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'A limit', html:'No scheme sits left of the faint curve $E_b/N_0=(2^{r}-1)/r$. Module 6 derives it.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'64-QAM carries $6$ bits a symbol, so $r=6$.<div class="nsep"></div>Which region is it in?',
        ask:{key:'m5-plane', choices:['bandwidth-limited','power-limited','on the limit'], answer:0,
          why:'$r=6>1$. It saves band and pays in energy.'}}]}
  ]}
]},

{ id:'m5-compare', module:'M5', nav:'Comparing the families', title:'Comparing the families',
  objective:'Compare the energy per bit each family needs for a target error as the bits a symbol grow.',
  keywords:'comparison pam psk qam orthogonal fsk energy per bit Pe 1e-5 bits per symbol k chart',
  src:'CH9 s.97–98', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Bandwidth and the choice of scheme'},
  {t:'title', text:'Comparing the families'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figCompare,
      caption:'The $E_b/N_0$ each family needs for $P_e=10^{-5}$, against the bits a symbol. PAM and PSK climb fastest, QAM more slowly, and orthogonal signals fall.'}
  ], right:[
    {t:'note', kind:'def', head:'Bandwidth-limited', html:'PAM, PSK and QAM pay energy for each extra bit. QAM pays the least of the three.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Power-limited', html:'Orthogonal signals need less $E_b/N_0$ as $M$ grows, at the price of band.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'At M = 16', tex:'\\text{PAM }23.1,\\quad\\text{PSK }18.1,\\quad\\text{QAM }14.0,\\quad\\text{FSK }7.7\\ \\text{dB}',
        note:'The same $4$ bits a symbol, four very different energy bills.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Four families at $M=16$ and $P_e=10^{-5}$.<div class="nsep"></div>Which needs the least $E_b/N_0$?',
        ask:{key:'m5-compare', choices:['PSK','QAM','FSK'], answer:2,
          why:'16 orthogonal tones need about $7.7$ dB, 16-QAM about $14.0$ dB.'}}]}
  ]}
]},

{ id:'m5-adaptive', module:'M5', nav:'Adaptive modulation', title:'Adaptive modulation',
  objective:'Pick the largest constellation that meets a target bit error at the measured SNR.',
  keywords:'adaptive modulation link adaptation bpsk qpsk 16-qam 64-qam 256-qam threshold Es/N0 staircase bits per symbol slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Bandwidth and the choice of scheme'},
  {t:'title', text:'Adaptive modulation'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'g', label:'$E_s/N_0$', min:0, max:40, step:0.5, v:22, show:dBshow}]},
      svg:figAdaptive,
      caption:'The largest set whose bit error stays at $10^{-5}$, with Gray labels, against the SNR a symbol. Drag $E_s/N_0$.'}
  ], right:[
    {t:'note', kind:'def', head:'Adaptive modulation', html:'The receiver measures $E_s/N_0$ and reports it. The transmitter picks the largest $M$ that still meets the target.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Thresholds', tex:'\\begin{aligned}&\\text{BPSK }9.6,\\quad\\text{QPSK }12.6,\\quad16\\text{-QAM }19.5\\\\&64\\text{-QAM }25.6,\\quad256\\text{-QAM }31.5\\ \\text{dB}\\end{aligned}',
        note:'Each step of two bits costs about $6$ dB.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Same band', html:'The symbol rate stays fixed, so every step adds bits in the same band. A fading channel moves the link up and down the stairs.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The channel gives $E_s/N_0=22$ dB.<div class="nsep"></div>Which set does the link choose?',
        ask:{key:'m5-adaptive', choices:['QPSK','16-QAM','64-QAM'], answer:1,
          why:'$22$ dB clears the 16-QAM step at $19.5$ dB but not 64-QAM at $25.6$ dB.'}}]}
  ]}
]},

REAL_CHOICE,

labScene('m5-lab-plane', 'BW', 'The bandwidth-efficiency plane', 'Bandwidth and the choice of scheme',
  'Place schemes on the bandwidth-efficiency plane and see how the target error moves them.',
  'laboratory bandwidth efficiency plane bits per hertz energy per bit schemes target error interactive',
  'Pick schemes and a target error. Each lands on the plane at its $E_b/N_0$ and its bits a second per hertz.'),

codeScene('m5-code-compare', 'Comparing schemes', 'Comparing schemes in code',
  'Compute the energy per bit and band of each family and draw the bandwidth-efficiency plane.',
  'code matlab python program run comparison bandwidth efficiency plane pam psk qam fsk energy per bit'),

/* ---------------------------------------------------------------- 5.6 ---- */
{ id:'m5-chain', module:'M5', nav:'From bits to decisions', title:'From bits to decisions',
  objective:'Follow two bits through a QPSK link: point, carrier, noise, correlators and decision.',
  keywords:'chain bits point iq modulator carrier noise correlators received point decision qpsk summary frames',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 5 · Summary'},
  {t:'title', text:'From bits to decisions'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['bits','point','carrier','noise','correlate','decide']}, svg:figChain,
      caption:'The bits $\\mathtt{10}$ through a QPSK link. Step to the point, the carrier, the noisy $r(t)$, the two correlators and the decision.'}
  ], right:[
    {t:'note', kind:'def', head:'Four moves', html:'<ol class="steps"><li>Map $k$ bits to a point of the set.</li><li>The IQ modulator puts the point on the carrier.</li><li>Two correlators turn $r(t)$ into $\\mathbf r$.</li><li>The receiver picks the nearest point.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Module 6', html:'Here the error rate follows from $E_b/N_0$ and the set. Module 6 asks how many bits a second a band and a power can carry at all.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'16-QAM at $10^{6}$ symbols a second.<div class="nsep"></div>What is the bit rate?',
        ask:{key:'m5-chain', choices:['$1$ Mb/s','$4$ Mb/s','$16$ Mb/s'], answer:1,
          why:'$k=\\log_216=4$ bits a symbol: $4\\times10^{6}$ b/s.'}}]}
  ]}
]},

{ id:'m5-quick', module:'M5', nav:'Quick check', title:'Quick check',
  objective:'Check the module ideas with six short predictions.',
  keywords:'quick check predict bfsk 3 dB 8-psk bits ask doubling 6 dB dpsk reference orthogonal band main lobe',
  budget:'a set of six prediction cards. The questions carry no figure',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 5 · Quick check'},
  {t:'title', text:'Quick check'},
  {t:'grid', cols:3, gap:'22px 20px', style:'flex:1;grid-auto-rows:1fr;padding-bottom:8px', items:[
    [{t:'note', kind:'def', head:'Binary gap', html:'BPSK reaches $P_b=10^{-5}$ at $9.6$ dB. BFSK reaches it at',
      ask:{key:'m5-qc0', choices:['$9.6$ dB','$12.6$ dB','$19.2$ dB'], answer:1,
        why:'Half the squared distance costs $3$ dB.'}}],
    [{t:'note', kind:'def', head:'Bits a symbol', html:'Each 8-PSK symbol carries',
      ask:{key:'m5-qc1', choices:['$2$ bits','$3$ bits','$8$ bits'], answer:1,
        why:'$\\log_28=3$.'}}],
    [{t:'note', kind:'def', head:'ASK doubling', html:'4-ASK moves to 8-ASK at the same $d_{\\min}$. $E_s$ grows by about',
      ask:{key:'m5-qc2', choices:['$3$ dB','$6$ dB','$9$ dB'], answer:1,
        why:'$E_s\\propto M^{2}-1$: $10\\log_{10}(63/15)=6.2$ dB.'}}],
    [{t:'note', kind:'def', head:'DPSK reference', html:'A DPSK receiver decides each symbol against',
      ask:{key:'m5-qc3', choices:['a local carrier','the previous symbol','the next symbol'], answer:1,
        why:'The bit is in the change of phase from the symbol before.'}}],
    [{t:'note', kind:'def', head:'Orthogonal band', html:'Orthogonal signals at a fixed bit rate go from $M=8$ to $M=16$. The band',
      ask:{key:'m5-qc4', choices:['narrows','stays the same','widens'], answer:2,
        why:'$W=MR_b/(2\\log_2M)$ goes from $1.33R_b$ to $2R_b$.'}}],
    [{t:'note', kind:'def', head:'Main lobe', html:'At a fixed bit rate, the QPSK main lobe is, next to BPSK,',
      ask:{key:'m5-qc5', choices:['half as wide','as wide','twice as wide'], answer:0,
        why:'Its symbols last twice as long.'}}]
  ]}
]},

{ id:'m5-synth', module:'M5', nav:'Summary', title:'Module 5 summary',
  objective:'Collect the results this module contributes to the rest of the course.',
  keywords:'summary carrier iq modulator bpsk bfsk bask mpsk gray dpsk ask qam orthogonal fsk noncoherent msk bandwidth plane recall',
  src:'CH9 s.100–101', dark:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 5 · Summary'},
  {t:'title', text:'Module 5 summary'},
  /* Fourteen results as prompts, in the order of the module: the student
     answers each one aloud, then opens the card. */
  {t:'raw', html:()=>RECALL.deck('m5', [
    {q:'What does a carrier do to the spectrum?', glyph:G.carrier,
     a:'$U(f)=\\tfrac12S(f-f_c)+\\tfrac12S(f+f_c)$. The band doubles to $2W$ and the energy halves.'},
    {q:'What does the IQ modulator send?', glyph:G.iq,
     a:'$s(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct)$: one point of the plane a symbol.'},
    {q:'How do the binary schemes compare?', glyph:G.binary,
     a:'BPSK: $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. BFSK and BASK: $Q\\bigl(\\sqrt{E_b/N_0}\\bigr)$, $3$ dB worse.'},
    {q:'What is the M-PSK neighbour distance?', glyph:G.psk,
     a:'$d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/M)$, and $P_e\\approx2Q\\bigl(\\sqrt{2E_s/N_0}\\sin(\\pi/M)\\bigr)$.'},
    {q:'What do Gray labels buy?', glyph:G.gray,
     a:'Neighbours differ in one bit, so $P_b\\approx P_e/\\log_2M$.'},
    {q:'What does DPSK save, and what does it cost?', glyph:G.dpsk,
     a:'No carrier phase. $P_b=\\tfrac12e^{-E_b/N_0}$, under $1$ dB behind BPSK.'},
    {q:'What is the M-ASK error?', glyph:G.pam,
     a:'$\\frac{2(M-1)}{M}Q\\bigl(\\sqrt{6E_s/((M^{2}-1)N_0)}\\bigr)$, about $6$ dB a doubling.'},
    {q:'What is the square-QAM error?', glyph:G.qam,
     a:'$4(1-1/\\sqrt M)\\,Q\\bigl(\\sqrt{3E_s/((M-1)N_0)}\\bigr)$, with $E_s=(M-1)d^{2}/6$.'},
    {q:'How much does QAM save over PSK?', glyph:G.shapes,
     a:'$4.20$ dB at $M=16$ and $9.95$ dB at $M=64$.'},
    {q:'What do M orthogonal signals give?', glyph:G.fsk,
     a:'$M-1$ neighbours at $\\sqrt{2E_s}$. The $E_b/N_0$ needed falls as $M$ grows, toward $-1.6$ dB.'},
    {q:'What does noncoherent BFSK need?', glyph:G.noncoh,
     a:'Tones $1/T$ apart and an envelope detector. $P_b=\\tfrac12e^{-E_b/2N_0}$.'},
    {q:'What is MSK?', glyph:G.msk,
     a:'BFSK at $\\Delta f=1/(2T_b)$ with a continuous phase. Its envelope is constant.'},
    {q:'How wide is each family?', glyph:G.spectrum,
     a:'PSK and QAM: $R_b/\\log_2M$. Orthogonal: $MR_b/(2\\log_2M)$.'},
    {q:'Where does each family sit on the plane?', glyph:G.plane,
     a:'PAM, PSK and QAM: bandwidth-limited, $r>1$. Orthogonal: power-limited, $r<1$.'}
  ], {cols:2})},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Method', html:'<span style="color:var(--graphite)">Pick the point set, read $d_{\\min}$ and $\\bar N_{\\min}$, and apply the receiver of Module 4. Module 6 asks how far any scheme can go.</span>'}]}
]},

/* Four optional projects for students who want to try the module on their own
   computer. They carry no grade and no code: each card gives an aim, what it
   practises, a few steps and what to look for. The briefs state no numerical
   answer, so they need no line in verify/. */
{ id:'m5-projects', module:'M5', nav:'Projects to try', title:'Projects to try',
  objective:'Offer four optional projects that use the module on simulated signals.',
  keywords:'projects matlab python iq modem gray natural labels dpsk drifting phase adaptive link simulation',
  dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 5 · Projects'},
  {t:'title', text:'Projects to try'},
  {t:'raw', html:()=>PROJECTS.deck('m5', [
    {title:'An IQ modem from samples', glyph:G.iq,
     aim:'Build a QPSK and 16-QAM modem from sampled carriers and measure how often it is wrong.',
     learn:['The IQ modulator as two products and a sum.',
            'Two correlators as sums over samples.',
            'Counting errors to estimate $P_e$.'],
     steps:['Build a cosine and a sine carrier over one symbol at $64$ samples.',
            'Map random bits to QPSK points and form $s(t)=I\\cos-Q\\sin$.',
            'Add Gaussian noise, correlate, and pick the nearest point.',
            'Repeat for 16-QAM and plot both error rates against $E_b/N_0$.'],
     look:'The measured points follow the formulas of this module once enough errors are counted.'},
    {title:'Gray against natural labels', glyph:G.gray,
     aim:'Measure how much Gray labels lower the bit error of 8-PSK.',
     learn:['Gray code as $i\\oplus\\lfloor i/2\\rfloor$.',
            'Why a symbol error usually lands on a neighbour.',
            'Bit error against symbol error.'],
     steps:['Send random 8-PSK symbols over noise.',
            'Label the points once with natural binary and once with Gray code.',
            'Count the bit errors of each on the same noisy symbols.',
            'Plot both bit errors and $P_e/3$ against $E_b/N_0$.'],
     look:'The Gray curve sits on $P_e/3$. The natural curve sits above it.'},
    {title:'DPSK with a drifting phase', glyph:G.dpsk,
     aim:'See why differential detection survives a slowly drifting carrier phase.',
     learn:['Differential encoding of bits into phase changes.',
            'Coherent against differential detection.',
            'What a phase drift does to each.'],
     steps:['Encode random bits as binary DPSK.',
            'Turn each received symbol by a phase that grows slowly with time.',
            'Detect coherently with a fixed reference and differentially.',
            'Count the errors of each as the drift rate grows.'],
     look:'The coherent receiver fails once the drift passes $90^{\\circ}$. The differential one barely notices.'},
    {title:'An adaptive link', glyph:G.adaptive,
     aim:'Build a link that changes its constellation as the SNR changes.',
     learn:['Thresholds for a target bit error.',
            'Throughput against a fixed scheme.',
            'Why a margin above each threshold helps.'],
     steps:['Draw an SNR that wanders slowly between $0$ and $35$ dB.',
            'At each block pick the largest set that meets the target.',
            'Simulate the block and count its errors.',
            'Compare the bits delivered with a fixed QPSK link.'],
     look:'The adaptive link carries several times the bits at about the same error rate.'}
  ])}
]}

];

window.SCENES_M5 = SC;
})();
