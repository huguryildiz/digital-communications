/* ==========================================================================
   Module 4 — The optimal receiver in additive white Gaussian noise.

   The receiver of this module correlates what arrived with the basis of
   Module 3, gets one point, and picks the nearest signal point, with a
   handicap for each prior. How often it is wrong depends on the distances
   between the points, and the union bound turns those distances into a
   number.

   Every teaching scene is a slide in the reference design (DESIGN.md), as in
   Modules 1 to 3: one figure on the left, two to four cards on the right, a
   prediction card on each slide, and each section closing on a gallery, a
   laboratory and a code page. Most figures move: a sequence is played in
   frames, a continuous parameter is a slider.

   Colour, as everywhere in this course: cyan is a transmitted waveform or its
   signal point, amber a basis function, violet an intermediate quantity (a
   correlator output, a weighted density, a metric), green the received
   waveform or point, red an error. Noise takes no colour of its own. A
   decision region is a faint fill of the colour of the point it decides for.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* The canvas of a slide figure and of a gallery figure, as in Modules 1 to 3. */
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
const gpdf = (x, m, s2) => Math.exp(-(x-m)*(x-m)/(2*s2))/Math.sqrt(2*Math.PI*s2);

/* Seeded noise: the same draws on every render, so a figure does not flicker
   and a count it prints is the count verify/verify_m4.py reproduces. */
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
const row = (h, parts) => { let x = 0, s = '';
  parts.forEach(([svg, w]) => { s += place(svg, x, 0, w, h); x += w; });
  return `<svg viewBox="0 0 ${x} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };

/* A piecewise-constant waveform, given as [start, end, value] pieces, and its
   outline with the vertical edges drawn. */
const pwc = segs => t => { for(const s of segs) if(t>=s[0] && t<s[1]) return s[2]; return 0; };
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
/* Noise draws: small dots in the hairline tone. Their stroke carries the same
   tone, so the collision sweep reads them as a guide, as it reads the grid. */
function cloud(a, xs, ys, n, o={}){
  let s = ''; const col = o.color || C.noise, r = o.r || 2.1;
  for(let i=0;i<n;i++){ const x = xs(i), y = ys(i);
    s += `<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${r}" fill="${col}" stroke="${col}" stroke-width="0.6"/>`; }
  a.raw(s);
}
/* A filled area under f between lo and hi, as a plate: a translucent wash
   that labels may cross. */
function wash(a, f, lo, hi, col, al){
  lo = Math.max(lo, a.o.xr[0]); hi = Math.min(hi, a.o.xr[1]);
  if(hi <= lo) return;
  const n = 200, pts = [];
  for(let i=0;i<=n;i++){ const t=lo+(hi-lo)*i/n; pts.push(f2(a.sx(t))+','+f2(a.sy(Math.min(f(t), a.o.yr[1])))); }
  a.raw(`<path d="M${f2(a.sx(lo))},${f2(a.sy(0))}L${pts.join('L')}L${f2(a.sx(hi))},${f2(a.sy(0))}Z" fill="${rgba(col, al==null?0.3:al)}" stroke="none"/>`);
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
   one half-plane for every other point. With unequal priors the metric is
   |r - s_i|^2 - N0 ln P(s_i), and the boundaries are still straight lines, so
   the same clipping draws the MAP regions. The picture is drawn by the rule
   the module derives, not placed beside it. */
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
function cells(pts, box, bias){
  const b = bias || pts.map(()=>0);
  return pts.map((p,i)=>{
    let poly = [[box[0],box[2]],[box[1],box[2]],[box[1],box[3]],[box[0],box[3]]];
    pts.forEach((q,j)=>{ if(j===i || !poly.length) return;
      poly = clipHalf(poly, 2*(q[0]-p[0]), 2*(q[1]-p[1]),
        q[0]*q[0]+q[1]*q[1]-p[0]*p[0]-p[1]*p[1]-b[j]+b[i]); });
    return poly;
  });
}
const PTCOL  = () => [C.in, C.out, C.mid, C.h, C.err];
const REGCOL = () => [C.dec.in, C.dec.out, C.dec.mid, C.dec.h, C.dec.err];
function fillPoly(a, poly, fill, op){
  if(poly.length < 3) return;
  a.raw(`<path d="M${poly.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L')}Z" fill="${fill}" stroke="none"${op!=null?` opacity="${op.toFixed(3)}"`:''}/>`);
}
/* Fill each region and draw the edges between regions; the edges of the box
   itself are left out. */
function drawCells(a, pts, o={}){
  const box = [a.o.xr[0], a.o.xr[1], a.o.yr[0], a.o.yr[1]];
  const cs = cells(pts, box, o.bias), fills = o.fills || REGCOL();
  cs.forEach((poly,i)=>fillPoly(a, poly, fills[i % fills.length], o.opacity));
  if(o.lines === false) return cs;
  const onBox = (p,q) => [0,1].some(k => Math.abs(p[0]-q[0])<1e-9 && Math.abs(p[0]-box[k])<1e-9)
                      || [2,3].some(k => Math.abs(p[1]-q[1])<1e-9 && Math.abs(p[1]-box[k])<1e-9);
  cs.forEach((poly,i)=>{ for(let k=0;k<poly.length;k++){ const p = poly[k], q = poly[(k+1)%poly.length];
    /* each interior edge belongs to two regions; draw it once */
    if(onBox(p,q)) continue;
    const mid = [(p[0]+q[0])/2, (p[1]+q[1])/2];
    const owner = cs.findIndex((c,j)=>j!==i && c.length > 2 && inside(c, mid, 1e-7));
    if(owner >= 0 && owner < i) continue;
    seg(a, [p,q], {color:o.lineCol||C.muted, width:o.lineW||1.3, opacity:o.opacity, dash:o.dash}); } });
  return cs;
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
/* Nearest point, with an optional bias N0 ln P(s_i). */
const nearest = (pts, x, y, bias) => { let best = 0, bd = Infinity;
  pts.forEach((p,k)=>{ const d = (x-p[0])*(x-p[0])+(y-p[1])*(y-p[1]) - (bias ? bias[k] : 0); if(d < bd){ bd = d; best = k; } });
  return best; };
const dots = (a, pts, o={}) => pts.forEach((p,i)=>a.point(p[0], p[1], {color:(o.cols||PTCOL())[i % 5], r:o.r||6.5}));

/* The point sets of the module. */
const QPSK = [[1,1],[-1,1],[-1,-1],[1,-1]];
const FIVE = a => [[0,0],[a,a],[-a,a],[-a,-a],[a,-a]];

/* ---- the navy opening ----------------------------------------------------
   The page under this figure is navy, so the axes take that page's ink and
   the signals the dark-page tints. */
const NAVY = {axis:'rgba(239,231,216,.34)', tick:'#9EACB9', name:'#E6E2D9'};
const T_CY = '#4FBECE', T_ER = '#E8785F';
const ZO = gauss(20260924, 600, 1);
function figOpen(v){
  const f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const a = plane({w:560, h:430, need:[[-2.3,2.3],[-2.1,2.1]], chrome:NAVY, grid:false,
    xticksOverride:[-1,1], yticksOverride:[-1,1]});
  if(op(2) > 0.02) drawCells(a, QPSK, {fills:['rgba(79,190,206,.17)','rgba(130,194,123,.13)','rgba(172,153,220,.14)','rgba(229,178,85,.13)'],
    opacity:op(2), lineCol:'rgba(239,231,216,.55)', lineW:1.4});
  const sg = 0.55, n = Math.round(300*op(1));
  let s = '', k = 0;
  for(let i=0;i<n;i++){ const x = 1+sg*ZO[2*i], y = 1+sg*ZO[2*i+1], out = x < 0 || y < 0;
    if(out) k++;
    const red = out && op(3) > 0.02;
    s += `<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="2.5" fill="${red ? T_ER : 'rgba(230,226,217,.32)'}" stroke="none"${red ? ` opacity="${(0.35+0.65*op(3)).toFixed(3)}"` : ''}/>`; }
  a.raw(s);
  QPSK.forEach((p,i)=>a.point(p[0], p[1], {color:T_CY, r:i ? 6.5 : 8, ring:'#12314E'}));
  lbl(a, 1.28, 1.9, '\\mathbf{s}_1\\;\\text{sent}', '#E6E2D9');
  if(op(3) > 0.5) lbl(a, -2.15, -1.9, '\\text{outside }R_1:\\ '+k+'\\text{ of }300', T_ER, 'start');
  return a.svg();
}

/* ---- 4.1 the observation ------------------------------------------------- */

/* Twelve bits grouped into blocks of k = 1, 2, 3 bits; each block picks one of
   M = 2^k levels for T = k T_b seconds. */
const BITS = [1,0,1,1,0,0,1,0,1,1,1,0];
const blockVal = (k, j) => BITS.slice(j*k, (j+1)*k).reduce((s,b)=>2*s+b, 0);
function figMary(v){
  const H = takeH(420), hTop = Math.round(H/3);
  const f = frameOf(v, 2), i0 = Math.min(1, Math.floor(f)), u = clamp01(f-i0), ks = [1,2,3];
  const kk = ks[Math.round(f)];
  const a = P.Axes(bare({w:560, h:hTop, xr:[-0.3,12.3], yr:[-1.35,1.55], pad:{l:56,r:26,t:8,b:6}}));
  lbl(a, 6, 1.1, '\\text{blocks of }k='+kk+':\\ M='+Math.pow(2,kk)+',\\ T='+(kk===1?'':kk)+'T_b', C.ink, 'middle');
  BITS.forEach((b,n)=>lbl(a, n+0.5, 0.3, String(b), C.ink, 'middle', 17));
  const blocksFor = (k, o) => { for(let j=0;j<12/k;j++){ const x0 = j*k+0.1, x1 = (j+1)*k-0.1;
      seg(a, [[x0,-0.05],[x0,-0.25],[x1,-0.25],[x1,-0.05]], {color:C.mid, width:1.8, opacity:o});
      if(o > 0.5) lbl(a, (x0+x1)/2, -0.85, String(blockVal(k,j)), C.mid, 'middle'); } };
  blocksFor(ks[i0], 1-u); if(u > 0.02) blocksFor(ks[i0+1], u);
  const b = TAx({w:560, h:H-hTop, xr:[-0.3,12.3], yr:[-1.45,1.45], xlabel:'t/T_b', ylabel:'s(t)',
    pad:{l:56,r:26,t:24,b:36}, xt:[0,3,6,9], yticksOverride:[-1,0,1]});
  const wave = k => { const M = Math.pow(2,k), sg = [];
    for(let j=0;j<12/k;j++) sg.push([j*k, (j+1)*k, (2*blockVal(k,j)-(M-1))/(M-1)]); return sg; };
  seg(b, outline(wave(ks[i0]),-0.3,12.3), {color:C.in, width:2.6, opacity:1-u});
  if(u > 0.02) seg(b, outline(wave(ks[i0+1]),-0.3,12.3), {color:C.in, width:2.6, opacity:u});
  return stack(560, [[a.svg(),hTop],[b.svg(),H-hTop]]);
}

/* A received waveform on two carrier basis functions over T = 1:
   psi1 = sqrt2 cos(4 pi t), psi2 = sqrt2 sin(4 pi t), s = psi1 - 0.6 psi2,
   plus one fixed draw of smoothed noise. The running integrals are computed
   from the same samples the figure draws. */
const OB = (()=>{
  const n = 800, dt = 1/n, z = gauss(4401, n+8, 1), nz = [];
  for(let i=0;i<=n;i++){ let s = 0; for(let k=0;k<8;k++) s += z[i+k]; nz.push(1.8*s/Math.sqrt(8)); }
  const t = [], r = [], sv = [], c1 = [0], c2 = [0];
  const p1 = x => Math.SQRT2*Math.cos(4*Math.PI*x), p2 = x => Math.SQRT2*Math.sin(4*Math.PI*x);
  for(let i=0;i<=n;i++){ const x = i*dt, s = p1(x) - 0.6*p2(x);
    t.push(x); sv.push(s); r.push(s + nz[i]); }
  for(let i=1;i<=n;i++){ const x = (i-0.5)*dt, rm = (r[i-1]+r[i])/2;
    c1.push(c1[i-1] + rm*p1(x)*dt); c2.push(c2[i-1] + rm*p2(x)*dt); }
  return {n, t, r, sv, c1, c2, s:[1,-0.6], rv:[c1[n], c2[n]]};
})();
function figObserve(v){
  const H = takeH(410), ha = Math.round(0.25*H), hb = Math.round(0.32*H), f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const a = TAx({w:560, h:ha, xr:[-0.03,1.13], yr:[-6.5,6.5], xlabel:'', ylabel:'r(t)',
    pad:{l:56,r:26,t:18,b:10}, yticksOverride:[-5,0,5]});
  seg(a, OB.t.map((x,i)=>[x, OB.r[i]]), {color:C.out, width:1.4});
  seg(a, OB.t.map((x,i)=>[x, OB.sv[i]]), {color:C.in, width:2.2});
  const b = TAx({w:560, h:hb, xr:[-0.03,1.13], yr:[-1.2,1.55], xlabel:'t/T', xnameDrop:34, ylabel:'c_1(t),\\;c_2(t)',
    pad:{l:56,r:26,t:18,b:34}, xt:[0,0.5,1], yticksOverride:[-1,0,1]});
  const m = Math.round(OB.n*clamp01(f));
  if(m > 1){
    seg(b, OB.t.slice(0,m+1).map((x,i)=>[x, OB.c1[i]]), {color:C.mid, width:2.4});
    seg(b, OB.t.slice(0,m+1).map((x,i)=>[x, OB.c2[i]]), {color:C.mid, width:2.4, dash:'7 5'});
    if(f < 0.999){ dot(b, OB.t[m], OB.c1[m], {color:C.mid, r:4.5}); dot(b, OB.t[m], OB.c2[m], {color:C.mid, r:4.5}); }
  }
  if(op(2) > 0.02){ dot(b, 1, OB.rv[0], {color:C.mid, r:5.5, opacity:op(2)}); dot(b, 1, OB.rv[1], {color:C.mid, r:5.5, opacity:op(2)});
    if(op(2) > 0.5){ lbl(b, 1.04, OB.rv[0]-0.08, 'r_1', C.mid); lbl(b, 1.04, OB.rv[1]-0.08, 'r_2', C.mid); } }
  const c = plane({h:H-ha-hb, need:[[-1.9,1.9],[-1.25,1.05]], xticksOverride:[], yticksOverride:[]});
  dot(c, OB.s[0], OB.s[1], {color:C.in, r:6.5});
  lbl(c, OB.s[0]-0.32, OB.s[1]-0.06, '\\mathbf{s}_i', C.in, 'end');
  if(op(3) > 0.02){ const [x,y] = OB.rv;
    seg(c, [[x,0],[x,y],[0,y]], {color:C.mid, width:1.3, dash:'4 5', opacity:op(3)});
    seg(c, [OB.s,[x,y]], {color:C.muted, width:1.6, opacity:op(3)});
    dot(c, x, y, {color:C.out, r:6.5, opacity:op(3)});
    if(op(3) > 0.5) lbl(c, x+0.14, y+0.1, '\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}', C.out); }
  return stack(560, [[a.svg(),ha],[b.svg(),hb],[c.svg(),H-ha-hb]]);
}

/* The filter matched to psi(t) = sqrt3 t on [0,1] and the correlator, both fed
   r(t) = 1.5 psi(t). The filter output y(t) = 4.5 (t^2/2 - t^3/6) for t <= 1
   and 4.5 (1/3 - u/2 + u^3/6), u = t - 1, after; the correlator gives
   c(t) = 1.5 t^3 up to T and holds 1.5. Both equal 1.5 at t = T only. */
const mfY = t => t <= 0 ? 0 : t <= 1 ? 4.5*(t*t/2 - t*t*t/6) : t <= 2 ? 4.5*(1/3 - (t-1)/2 + Math.pow(t-1,3)/6) : 0;
const mfC = t => t <= 0 ? 0 : t <= 1 ? 1.5*t*t*t : 1.5;
function figMfbank(v){
  const t0 = v ? v.t : 1;
  const a = P.Axes(SZ({xr:[-0.08,2.15], yr:[-0.15,2.05], xlabel:'t/T', ylabel:'y(t),\\;c(t)', xticksOverride:[0,0.5,1,1.5,2], yticksOverride:[0,0.5,1,1.5]}));
  a.curve(mfC, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(mfY, {color:C.mid, width:2.6});
  a.vline(t0, {color:C.ink, dash:'5 4', width:1.4});
  dot(a, t0, mfY(t0), {color:C.mid, r:6}); dot(a, t0, mfC(t0), {color:C.mid, r:5});
  lbl(a, 0.0, 1.86, 'y(t_0)='+num(mfY(t0))+',\\ \\ c(t_0)='+num(mfC(t0)), C.ink);
  return a.svg();
}

/* The received waveform in three dimensions: the signal plane, spanned by
   psi1 and psi2, and one direction outside it. The noise splits into the part
   in the plane, which the correlators keep, and n'(t), which they drop. */
function figIrrelevant(v){
  const f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const az = 32*Math.PI/180, el = 24*Math.PI/180;
  const pr = (x,y,z) => [x*Math.cos(az) - y*Math.sin(az), z*Math.cos(el) + (x*Math.sin(az) + y*Math.cos(az))*Math.sin(el)];
  const a = plane(bare({need:[[-2.2,2.3],[-1.35,2.0]], xlabel:'', ylabel:''}));
  const Pp = (...p) => pr(...p);
  const sheet = [[-1.9,-1.5,0],[1.9,-1.5,0],[1.9,1.5,0],[-1.9,1.5,0]].map(p=>Pp(...p));
  fillPoly(a, sheet, C.dec.h);
  seg(a, sheet.concat([sheet[0]]), {color:C.h, width:1.2, opacity:0.7});
  const ax = (p, q, name, lp, col) => { const A = Pp(...p), B = Pp(...q);
    arrow(a, A[0],A[1],B[0],B[1], {color:col, width:1.8, head:0.8});
    const L = Pp(...lp); lbl(a, L[0], L[1], name, col, 'middle', 16); };
  ax([0,0,0],[2.05,0,0], '\\psi_1', [2.3,0,-0.08], C.h);
  ax([0,0,0],[0,1.75,0], '\\psi_2', [0,2.02,-0.02], C.h);
  ax([0,0,0],[0,0,1.6], '\\text{outside}', [0,0,1.78], C.muted);
  const s1 = [1.0,-0.55,0], s2 = [-1.05,0.55,0], n = [0.4,0.45,1.05];
  const rt = [s1[0]+n[0], s1[1]+n[1], n[2]], rp = [rt[0], rt[1], 0];
  const S1 = Pp(...s1), S2 = Pp(...s2), RT = Pp(...rt), RP = Pp(...rp);
  if(op(3) > 0.02){ seg(a, [RT,S2], {color:C.muted, width:1.3, dash:'5 4', opacity:op(3)});
    seg(a, [RP,S2], {color:C.mid, width:2.0, opacity:op(3)});
    seg(a, [RT,S1], {color:C.muted, width:1.3, dash:'5 4', opacity:op(3)}); }
  if(op(1) > 0.02){ arrow(a, S1[0],S1[1],RP[0],RP[1], {color:C.mid, width:2.4, opacity:op(1)});
    seg(a, [RP,RT], {color:C.muted, width:1.8, dash:'5 4', opacity:op(1)});
    if(op(1) > 0.5) lbl(a, (RP[0]+RT[0])/2+0.1, (RP[1]+RT[1])/2, "n'", C.muted, 'start', 16); }
  if(op(1) < 0.98) arrow(a, S1[0],S1[1],RT[0],RT[1], {color:C.muted, width:2.0, opacity:1-op(1)});
  dot(a, S1[0], S1[1], {color:C.in, r:6.5}); dot(a, S2[0], S2[1], {color:C.in, r:6.5});
  lbl(a, S1[0]+0.12, S1[1]-0.22, '\\mathbf{s}_1', C.in); lbl(a, S2[0]-0.12, S2[1]-0.22, '\\mathbf{s}_2', C.in, 'end');
  dot(a, RT[0], RT[1], {color:C.out, r:6.5, opacity:1-0.65*op(2)});
  lbl(a, RT[0]+0.14, RT[1]+0.04, '\\tilde{\\mathbf{r}}', C.out, 'start', 16);
  if(op(2) > 0.02){ dot(a, RP[0], RP[1], {color:C.out, r:6.5, opacity:op(2)});
    if(op(2) > 0.5) lbl(a, RP[0]+0.16, RP[1]-0.2, '\\mathbf{r}', C.out, 'start', 16); }
  if(op(3) > 0.5) lbl(a, -2.1, 1.78, "\\|\\tilde{\\mathbf{r}}-\\mathbf{s}_j\\|^{2}=\\|\\mathbf{r}-\\mathbf{s}_j\\|^{2}+\\|n'\\|^{2}", C.ink);
  return a.svg();
}

/* Two noise components with variance N0/2 = 1 and correlation coefficient
   rho: n1 = z1, n2 = rho z1 + sqrt(1 - rho^2) z2, from one fixed draw, so the
   cloud deforms smoothly as rho is dragged. Contours at one and two standard
   deviations. */
const ZN = gauss(4402, 1200, 1);
function figNoise(v){
  const rho = v ? v.rho : 0, q = Math.sqrt(1-rho*rho);
  const a = plane({need:[[-3.3,3.3],[-3.1,3.1]], xlabel:'n_1', ylabel:'n_2', xticksOverride:[], yticksOverride:[]});
  cloud(a, i=>ZN[2*i], i=>rho*ZN[2*i]+q*ZN[2*i+1], 600, {r:2.2});
  [1,2].forEach(k=>{ const pts=[]; for(let i=0;i<=180;i++){ const u=2*Math.PI*i/180;
      pts.push([k*Math.cos(u), k*(rho*Math.cos(u)+q*Math.sin(u))]); }
    seg(a, pts, {color:C.mid, width:2.0, dash:k===2?'6 5':null}); });
  lbl(a, -3.1, 2.75, '\\rho='+num(rho, 1), C.mid);
  return a.svg();
}

/* Four-level PAM on a unit-energy pulse: s_m = -1.5, -0.5, 0.5, 1.5, and the
   four densities f(r | s_m) = exp(-(r - s_m)^2/N0)/sqrt(pi N0). */
const PAM4 = [-1.5,-0.5,0.5,1.5];
function figPam4(v){
  const N0 = v ? v.N0 : 0.1;
  const a = P.Axes(SZ({xr:[-2.7,2.7], yr:[0,2.75], xlabel:'r', ylabel:'f(r\\mid s_m)', xticksOverride:PAM4, yticksOverride:[0,1,2]}));
  PAM4.forEach(m=>a.curve(r=>Math.exp(-(r-m)*(r-m)/N0)/Math.sqrt(Math.PI*N0), {color:C.out, width:2.4, n:700}));
  PAM4.forEach(m=>a.point(m, 0, {color:C.in, r:6}));
  lbl(a, 2.62, 2.5, '\\sigma^{2}=N_0/2='+num(N0/2, 3), C.ink, 'end');
  return a.svg();
}

/* Four orthogonal signals of energy E = 4 with N0 = 1: when s1 = (2,0,0,0) is
   sent, r1 has mean 2 and r2, r3, r4 mean 0, each with variance N0/2 = 0.5.
   One component a frame. */
function figOrth(v){
  const H = takeH(420), f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const hp = Math.floor((H-34)/4), parts = [];
  for(let k=0;k<4;k++){ const last = k===3, h = hp + (last ? 34 : 0);
    const a = TAx({w:560, h, xr:[-2.6,4.4], yr:[0,0.72], xlabel:last?'r_k':'', xnameDrop:34, ylabel:'f(r_'+(k+1)+'\\mid\\mathbf{s}_1)',
      pad:{l:56,r:26,t:24,b:last?36:10}, xt:last?[-2,0,2,4]:null, yticksOverride:[0,0.5]});
    const o = k === 0 ? 1 : op(k), m = k === 0 ? 2 : 0;
    if(o > 0.02){ seg(a, Array.from({length:301},(_,i)=>{ const r = -2.6+7*i/300; return [r, Math.exp(-(r-m)*(r-m))/Math.sqrt(Math.PI)]; }), {color:C.out, width:2.4, opacity:o});
      dot(a, m, 0, {color:C.in, r:5.5, opacity:o}); }
    parts.push([a.svg(), h]); }
  return stack(560, parts);
}

/* A gallery of four everyday cases closing a section: the figures in a 2×2
   grid, and the cards beside them revealed one at a time. */
function realGallery(cfg){
  return { id:cfg.id, module:'M4', nav:cfg.nav, title:cfg.title, src:cfg.src,
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

/* 4.1. The GPS C/A code correlation at 1.023 Mchip/s, the Barker code of
   802.11b, thermal noise of a 50 ohm resistor over 20 MHz, and the pulse
   positions of ADS-B at 1 Mb/s. */
const BARKER = [1,1,1,-1,-1,-1,1,-1,-1,1,-1];
const barkerR = k => { let s = 0; for(let n=0;n<11;n++){ const m = n+k; if(m>=0 && m<11) s += BARKER[n]*BARKER[m]; } return s; };
const TCA = 1/1.023;
const REAL_OBSERVE = realGallery({ id:'m4-real-observe', nav:'Correlators around us',
  title:'Correlators around us', eyebrow:'Module 4 · The observation', src:'CH9 s.24–25',
  objective:'Recognise the correlator and its noisy output in satellite navigation, Wi-Fi, aircraft transponders and every receiver front end.',
  keywords:'examples gps c/a code correlation 1.023 mchip/s barker code 802.11b thermal noise 4kTRB ads-b pulse position 1090 mhz correlator',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[-2,-1,0,1,2], xr:[-2.6,2.6], yr:[-0.15,1.25], xlabel:'\\tau\\;(\\mu\\text{s})', ylabel:'R(\\tau)', yticksOverride:[0,0.5]}));
      a.curve(t=>Math.abs(t) < TCA ? 1-Math.abs(t)/TCA : 0, {color:C.mid, width:2.4, n:900});
      return a.svg(); }, 'A GPS receiver correlates the C/A code with a local copy. $R(\\tau)=1-|\\tau|/T_c$, with $T_c=0.978\\ \\mu$s, peaks when the two align.'],
    [()=>{ const a = TAx(EXO({xt:[-10,-5,0,5,10], xr:[-11,11], yr:[-2,12.5], xlabel:'k\\;(\\text{chips})', ylabel:'R[k]', yticksOverride:[5,10]}));
      a.stem(Array.from({length:21},(_,i)=>[i-10, barkerR(i-10)]), {color:C.mid, showZero:true});
      return a.svg(); }, '802.11b Wi-Fi spreads each bit with the $11$-chip Barker code. Its correlation $R[k]$ is $11$ at $k=0$ and $0$ or $-1$ elsewhere.'],
    [()=>{ const sg = 4.0, a = P.Axes(EXO({xr:[-14,14], yr:[0,0.115], xlabel:'v\\;(\\mu\\text{V})', ylabel:'f(v)', xticksOverride:[-12,-8,-4,0,4,8,12], yticksOverride:[0,0.05]}));
      wash(a, x=>gpdf(x,0,sg*sg), -sg, sg, C.muted, 0.18);
      a.curve(x=>gpdf(x,0,sg*sg), {color:C.muted, width:2.2});
      return a.svg(); }, 'A $50\\ \\Omega$ resistor at $290$ K, over $20$ MHz, gives noise with $\\sigma=\\sqrt{4kTRB}=4.0\\ \\mu$V. Every correlator output carries some.'],
    [()=>{ const bits = [1,0,1,1], segs = bits.map((b,n)=>b ? [n, n+0.5, 1] : [n+0.5, n+1, 1]);
      const a = TAx(EXO({xt:[0,1,2,3,4], xr:[-0.15,4.3], yr:[-0.2,1.35], xlabel:'t\\;(\\mu\\text{s})', ylabel:'s(t)', yticksOverride:[0,1]}));
      a.poly(outline(segs,-0.15,4.3), {color:C.in, width:2.4});
      bits.forEach((b,n)=>lbl(a, n+0.5, 1.12, String(b), C.ink, 'middle'));
      return a.svg(); }, 'Aircraft ADS-B sends a $1$ as a $0.5\\ \\mu$s pulse in the first half of the bit, a $0$ in the second. Two correlators give $(r_1,r_2)$.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Correlate, then decide', html:'Each receiver multiplies what arrives by a known waveform and integrates. The number it gets is one coordinate of $\\mathbf r$.'},
    {t:'note', kind:'def', head:'Noise in every output', html:'Thermal noise reaches every correlator. Each output is the signal coordinate plus a Gaussian sample.'},
    {t:'note', kind:'warn', head:'The window', html:'The integral runs over one symbol. A GPS copy that is late by $T_c$ gives $R=0$ and loses the whole signal.'}
  ]});

/* ---- 4.2 the decision rule --------------------------------------------------
   The binary pictures of this section put s1 = +1 and s2 = -1 on one axis,
   with N0 = 1 unless a scene says otherwise, so each conditional density has
   variance N0/2 = 0.5. */

/* The two weighted likelihoods P(s_i) f(r | s_i) and where they cross. */
function figMap(v){
  const p = v ? v.p : 0.7, tau = 0.25*Math.log((1-p)/p);
  const a = P.Axes(SZ({xr:[-3.2,3.2], yr:[0,0.74], xlabel:'r', ylabel:'P(s_i)\\,f(r\\mid s_i)',
    xticksOverride:[-2,-1,0,1,2], yticksOverride:[0,0.2,0.4]}));
  const w1 = r => p*gpdf(r,1,0.5), w2 = r => (1-p)*gpdf(r,-1,0.5);
  a.vline(0, {color:C.muted, dash:'2 4', width:1.2});
  a.curve(w2, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(w1, {color:C.mid, width:2.6});
  a.vline(tau, {color:C.ink, dash:'6 4', width:1.6});
  dot(a, tau, w1(tau), {color:C.mid, r:5.5});
  lbl(a, tau-0.1, 0.66, '\\tau='+num(tau), C.ink, 'end');
  a.point(1, 0, {color:C.in, r:6}); a.point(-1, 0, {color:C.in, r:6});
  return a.svg();
}

/* The received point r = (0.5, 0.3) and its squared distance to each of the
   four points (+-1, +-1), one a frame; the nearest one is ringed last. */
const RQ = [0.5, 0.3];
const d2 = (p, q) => (p[0]-q[0])*(p[0]-q[0]) + (p[1]-q[1])*(p[1]-q[1]);
function figMindist(v){
  const f = frameOf(v, 5), op = k => clamp01(f-k+1);
  const a = plane({need:[[-2.25,2.25],[-1.8,1.8]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  const LP = [[1.14,1.3,'start'],[-1.14,1.3,'end'],[-1.14,-1.5,'end'],[1.14,-1.5,'start']];
  QPSK.forEach((p,k)=>{ const o = op(k+1); if(o < 0.02) return;
    seg(a, [RQ,p], {color:k===0 && op(5) > 0.02 ? C.out : C.mid, width:k===0 ? 2.2+1.2*op(5) : 2.2, opacity:o});
    if(o > 0.5) lbl(a, LP[k][0], LP[k][1], 'D_'+(k+1)+'^{2}='+num(d2(RQ,p)), C.mid, LP[k][2]); });
  dots(a, QPSK, {cols:[C.in,C.in,C.in,C.in]});
  dot(a, RQ[0], RQ[1], {color:C.out, r:6.5});
  lbl(a, 0.7, 0.12, '\\mathbf{r}', C.out, 'start', 16);
  if(op(5) > 0.02) ring(a, 1, 1, {opacity:op(5)});
  return a.svg();
}

/* 4-PAM at s = -3, -1, 1, 3 and r = 1.6: the correlation r s_i alone, then
   with the energy term E_i/2 = s_i^2/2 taken off. The bars move between the
   two, and the largest is outlined in green. */
const MS = [-3,-1,1,3], MR = 1.6;
function figMetric(v){
  const f = clamp01(frameOf(v, 1));
  const a = TAx(SZ({xr:[-4.6,4.6], yr:[-11,6.8], xlabel:'s_i', ylabel:'m_i', xt:MS, yticksOverride:[-10,-5,0,5]}));
  const vals = MS.map(s=>MR*s - f*s*s/2), best = vals.indexOf(Math.max(...vals));
  MS.forEach((s,i)=>{ const y = vals[i], w = 0.8, X0 = a.sx(s-w/2), X1 = a.sx(s+w/2), Y0 = a.sy(0), Y1 = a.sy(y);
    a.raw(`<rect x="${f2(X0)}" y="${f2(Math.min(Y0,Y1))}" width="${f2(X1-X0)}" height="${f2(Math.abs(Y1-Y0))}" fill="${rgba(C.mid,0.26)}" stroke="${i===best ? C.out : C.mid}" stroke-width="${i===best ? 3.2 : 1.6}"/>`);
    if(f < 0.04 || f > 0.96) lbl(a, s, y >= 0 ? y+0.55 : y-1.5, num(y,1), i===best ? C.out : C.mid, 'middle'); });
  lbl(a, -4.4, 5.7, 'r=1.6', C.ink);
  return a.svg();
}

/* The two receiver structures, drawn as block diagrams and crossfaded:
   Method I correlates with the N basis functions, Method II with the M
   waveforms themselves. */
function recvI(){
  const it = [
    {t:'text',x:8,y:182,label:'r(t)',tex:true,fs:16,anchor:'start'},
    {t:'arrow',x1:8,y1:200,x2:52,y2:200}, {t:'line',d:'M52,80 V320'},
    {t:'text',x:183,y:212,label:'\\smash{\\vdots}',tex:true,fs:16},
    {t:'text',x:322,y:212,label:'\\smash{\\vdots}',tex:true,fs:16},
    {t:'box',x:356,y:40,w:204,h:320},
    {t:'text',x:458,y:172,label:'\\text{largest}',tex:true,fs:15},
    {t:'text',x:458,y:207,label:'\\mathbf{r}\\cdot\\mathbf{s}_i+a_i',tex:true,fs:15},
    {t:'text',x:458,y:242,label:'\\text{over }i=1,\\ldots,M',tex:true,fs:15},
    {t:'arrow',x1:560,y1:200,x2:626,y2:200}, {t:'text',x:594,y:184,label:'\\hat{s}',tex:true,fs:17}
  ];
  [[80,'1'],[320,'N']].forEach(([y,k])=>it.push({t:'arrow',x1:52,y1:y,x2:80,y2:y},
    {t:'box',x:80,y:y-30,w:210,h:60,label:'\\int_0^{T}(\\cdot)\\,\\psi_'+k+'(t)\\,dt',tex:true,fs:15},
    {t:'arrow',x1:290,y1:y,x2:356,y2:y}, {t:'text',x:323,y:y-12,label:'r_'+k,tex:true,fs:16}));
  return P.blocks({w:640, h:400, items:it});
}
function recvII(){
  const it = [
    {t:'text',x:8,y:182,label:'r(t)',tex:true,fs:16,anchor:'start'},
    {t:'arrow',x1:8,y1:200,x2:52,y2:200}, {t:'line',d:'M52,90 V330'},
    {t:'text',x:183,y:222,label:'\\smash{\\vdots}',tex:true,fs:16},
    {t:'box',x:430,y:40,w:130,h:320,label:'\\text{largest}',tex:true,fs:15},
    {t:'arrow',x1:560,y1:200,x2:626,y2:200}, {t:'text',x:594,y:184,label:'\\hat{s}',tex:true,fs:17}
  ];
  [[90,'1'],[330,'M']].forEach(([y,k])=>it.push({t:'arrow',x1:52,y1:y,x2:80,y2:y},
    {t:'box',x:80,y:y-30,w:210,h:60,label:'\\int_0^{T}(\\cdot)\\,s_'+k+'(t)\\,dt',tex:true,fs:15},
    {t:'arrow',x1:290,y1:y,x2:340,y2:y}, {t:'sum',x:354,y},
    {t:'arrow',x1:354,y1:y-58,x2:354,y2:y-16}, {t:'text',x:354,y:y-64,label:'a_'+k,tex:true,fs:16},
    {t:'arrow',x1:368,y1:y,x2:430,y2:y}));
  return P.blocks({w:640, h:400, items:it});
}
function figReceiver(v){
  const H = takeH(430), f = clamp01(frameOf(v, 1)), y = ((H-400)/2).toFixed(1);
  const g = (svg, o) => o < 0.02 ? '' : `<g opacity="${o.toFixed(3)}">${place(svg, 0, y, 640, 400)}</g>`;
  return `<svg viewBox="0 0 640 ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${g(recvI(), 1-f)}${g(recvII(), f)}</svg>`;
}

/* The error as an area. Antipodal +-1 (E_b = 1) with P(s1) = 0.25 at +1 and
   P(s2) = 0.75 at -1, N0 = 0.5, so each density has variance 0.25: the
   weighted density of each point on the wrong side of the threshold is
   shaded, and the lower panel is their sum as the threshold moves. It is
   smallest where the two weighted densities cross, tau* = ln(3)/8. */
const OPT = {p:0.25, ts:Math.log(3)/8};
const peTau = t => OPT.p*Qf((1-t)/0.5) + (1-OPT.p)*Qf((t+1)/0.5);
function figOptimal(v){
  const tau = v ? v.tau : 0.6, H = takeH(400), hb = Math.round(0.425*H), p = OPT.p;
  const w1 = r => p*gpdf(r,1,0.25), w2 = r => (1-p)*gpdf(r,-1,0.25);
  const a = P.Axes({w:560, h:H-hb, xr:[-2.6,2.6], yr:[0,0.7], xlabel:'', ylabel:'P(s_i)\\,f(r\\mid s_i)',
    pad:{l:56,r:26,t:24,b:12}, xticksOverride:[], yticksOverride:[0.2,0.4,0.6]});
  wash(a, w1, -2.6, tau, C.err, 0.3); wash(a, w2, tau, 2.6, C.err, 0.3);
  a.vline(OPT.ts, {color:C.muted, dash:'2 4', width:1.3});
  a.curve(w2, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(w1, {color:C.mid, width:2.6});
  a.vline(tau, {color:C.ink, dash:'6 4', width:1.6});
  lbl(a, tau+0.08, 0.62, '\\tau', C.ink);
  const b = P.Axes({w:560, h:hb, xr:[-2.6,2.6], yr:[0,0.85], xlabel:'r,\\;\\tau', ylabel:'P_e(\\tau)',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[-2,-1,1,2], yticksOverride:[0.25,0.5,0.75]});
  b.vline(OPT.ts, {color:C.muted, dash:'2 4', width:1.3});
  b.curve(peTau, {color:C.err, width:2.4});
  dot(b, tau, peTau(tau), {color:C.err, r:6});
  lbl(b, 2.5, 0.62, 'P_e='+num(peTau(tau),4), C.err, 'end');
  lbl(b, OPT.ts+0.08, 0.72, '\\tau^{\\ast}', C.muted);
  return stack(560, [[a.svg(),H-hb],[b.svg(),hb]]);
}

/* The worked example with the same link: +-1, P(s1) = 0.25 at +1,
   P(s2) = 0.75 at -1, N0 = 0.5. The reader marks the threshold; the answer
   is tau = ln(3)/8 = 0.137 and the two error areas. */
function figExMap(){
  const a = P.Axes(SZ({xr:[-2.6,2.6], yr:[0,0.7], xlabel:'r', ylabel:'P(s_i)\\,f(r\\mid s_i)',
    xticksOverride:[-2,-1,0,1,2], yticksOverride:[0.2,0.4,0.6]}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  const w1 = r => 0.25*gpdf(r,1,0.25), w2 = r => 0.75*gpdf(r,-1,0.25), tau = Math.log(3)/8;
  a.curve(w2, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(w1, {color:C.mid, width:2.6});
  a.point(1, 0, {color:C.in, r:6}); a.point(-1, 0, {color:C.in, r:6});
  a.raw('<g class="sk-key">');
  wash(a, w1, -2.6, tau, C.err, 0.34); wash(a, w2, tau, 2.6, C.err, 0.34);
  a.vline(tau, {color:C.ink, dash:'6 4', width:1.8});
  lbl(a, tau+0.1, 0.64, '\\tau=0.137', C.ink);
  a.raw('</g>');
  return a.svg();
}

/* A drawn signal set: four waveforms on [0,2) built from two unit pulses,
   their points, and the regions of the receiver with equal priors. */
const RX = [ {v:[2,0], segs:[[0,1,2]]}, {v:[1,1], segs:[[0,2,1]]},
             {v:[-1,1], segs:[[0,1,-1],[1,2,1]]}, {v:[-1,-1], segs:[[0,2,-1]]} ];
function figExReceiver(v){
  const H = takeH(420), h1 = Math.round(0.226*H), h2 = Math.round(0.286*H), f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const small = k => { const lo = k > 1, a = TAx({w:280, h:lo?h2:h1, xr:[-0.1,2.3], yr:[-1.5,2.5],
      xlabel:lo?'t':'', xnameDrop:30, ylabel:'s_'+(k+1)+'(t)', pad:{l:50,r:18,t:14,b:lo?34:10}, xt:lo?[0,1,2]:null, yticksOverride:[-1,2]});
    if(op(1) > 0.02){ seg(a, outline([[0,1,1]],-0.1,2.3), {color:C.h, width:1.6, dash:'6 5', opacity:op(1)});
      seg(a, outline([[1,2,1]],-0.1,2.3), {color:C.h, width:1.6, dash:'2 4', opacity:op(1)}); }
    a.poly(outline(RX[k].segs,-0.1,2.3), {color:C.in, width:2.4});
    return a.svg(); };
  const b = plane({h:H-h1-h2, need:[[-1.9,2.7],[-1.55,1.45]], xticksOverride:[-1,1,2], yticksOverride:[1]});
  const pts = RX.map(r=>r.v);
  if(op(3) > 0.02) drawCells(b, pts, {opacity:op(3)});
  const LP = [[2.12,0.14,'start'],[1.12,1.14,'start'],[-1.12,1.14,'end'],[-1.12,-1.36,'end']];
  pts.forEach((p,k)=>{ const o = op(2); if(o < 0.02) return;
    dot(b, p[0], p[1], {color:PTCOL()[k], r:6.5, opacity:o});
    if(o > 0.5) lbl(b, LP[k][0], LP[k][1], '\\mathbf{s}_'+(k+1), PTCOL()[k], LP[k][2]); });
  return stack(560, [[row(h1, [[small(0),280],[small(1),280]]),h1],
                     [row(h2, [[small(2),280],[small(3),280]]),h2],[b.svg(),H-h1-h2]]);
}

/* 4.2. A smoke alarm with a rare event, an optical receiver with on-off
   keying, caller ID with two tones, and the frequency samples of Bluetooth
   Low Energy. */
const ZB = gauss(4403, 16, 1);
const REAL_RULE = realGallery({ id:'m4-real-rule', nav:'Decision rules around us',
  title:'Decision rules around us', eyebrow:'Module 4 · The decision rule', src:'CH9 s.29–38',
  objective:'See the MAP threshold, the energy term and the correlation receiver in alarms, optical links, caller ID and Bluetooth.',
  keywords:'examples map threshold priors smoke alarm optical on-off keying energy term caller id bell 202 fsk bluetooth low energy gfsk sign decision',
  figs:[
    [()=>{ const a = P.Axes(EXO({xr:[-10,62], yr:[0,0.078], xlabel:'r\\;(\\text{mV})', ylabel:'f(r\\mid\\cdot)', xticksOverride:[0,10,20,30,40,50], yticksOverride:[0,0.03,0.06]}));
      a.curve(r=>gpdf(r,10,36), {color:C.out, width:2.2}); a.curve(r=>gpdf(r,40,36), {color:C.out, width:2.2, dash:'7 5'});
      a.vline(25, {color:C.muted, dash:'2 4', width:1.3}); a.vline(25+1.2*Math.log(99), {color:C.ink, dash:'6 4', width:1.6});
      return a.svg(); }, 'A smoke alarm reads $10$ mV in clean air and $40$ mV in smoke, with $\\sigma=6$ mV. Smoke is rare, $P=0.01$, so the threshold moves from $25$ to $30.5$ mV.'],
    [()=>{ const a = P.Axes(EXO({xr:[-12,32], yr:[0,0.16], xlabel:'i\\;(\\mu\\text{A})', ylabel:'f(i\\mid\\cdot)', xticksOverride:[-10,10,20,30], yticksOverride:[]}));
      a.curve(r=>gpdf(r,0,9), {color:C.out, width:2.2}); a.curve(r=>gpdf(r,20,9), {color:C.out, width:2.2, dash:'7 5'});
      wash(a, r=>gpdf(r,0,9), 10, 32, C.err, 0.3);
      a.vline(10, {color:C.ink, dash:'6 4', width:1.6});
      return a.svg(); }, 'An optical receiver sees $0$ or $20\\ \\mu$A. The energy term puts the threshold at $10\\ \\mu$A. With $\\sigma=3\\ \\mu$A, $P_e=Q(10/3)=4.3\\times10^{-4}$.'],
    [()=>{ const T = 1/1.2, a = TAx(EXO({xt:[0,0.2,0.4,0.6], xr:[-0.03,0.9], yr:[-1.45,1.45], xlabel:'t\\;(\\text{ms})', ylabel:'s_0(t),\\;s_1(t)', yticksOverride:[-1,0,1]}));
      a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*1.2*t):NaN, {color:C.in, width:2.2, n:700});
      a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*2.2*t):NaN, {color:C.in, width:1.8, n:700, dash:'6 4'});
      return a.svg(); }, 'Caller ID sends $1200$ Hz for a $1$ and $2200$ Hz for a $0$. The receiver correlates with both tones over $T=0.833$ ms: Method II.'],
    [()=>{ const bits = [1,0,0,1,1,0,1,0,1,1,0,0,0,1,0,1], a = TAx(EXO({xt:[0,5,10], xr:[-0.8,16], yr:[-420,420], xlabel:'n\\;(\\text{bit})', ylabel:'\\Delta f[n]\\;(\\text{kHz})', yticksOverride:[-250,250]}));
      a.hline(250, {color:C.muted, dash:'3 4'}); a.hline(-250, {color:C.muted, dash:'3 4'});
      a.stem(bits.map((b,n)=>[n, (b?250:-250)+60*ZB[n]]), {color:C.out});
      return a.svg(); }, 'Bluetooth Low Energy shifts the carrier by about $\\pm250$ kHz. With equal priors the receiver decides by the sign of each sample.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Priors move the threshold', html:'A rare event gets a smaller region. The threshold moves toward the less likely signal.'},
    {t:'note', kind:'def', head:'The energy term', html:'With unequal energies the metric keeps $-E_i/2$. For on-off keying that puts the threshold at half the on level.'},
    {t:'note', kind:'warn', head:'Unknown priors', html:'When the priors are not known, the receiver uses ML. It is optimal only when the priors are equal.'}
  ]});

/* ---- 4.3 decision regions --------------------------------------------------- */

/* Five points, the corners (+-1.2, +-1.2) and the centre. The reader draws the
   boundaries; the answer holds the regions. */
function figRegions(){
  const pts = FIVE(1.2);
  const a = plane({need:[[-2.6,2.6],[-2.3,2.3]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  a.raw('<g class="sk-key">');
  drawCells(a, pts, {lineW:2.0, lineCol:C.ink});
  a.raw('</g>');
  dots(a, pts);
  return a.svg();
}

/* Three points with the prior of s3 on a slider and the other two sharing the
   rest; N0 = 1. The dashed lines are the equal-prior boundaries. */
const TRI = [[-1.2,-0.7],[1.2,-0.7],[0,1.2]];
function figRegionsPriors(v){
  const p = v ? v.p : 0.6, q = (1-p)/2, bias = [q,q,p].map(x=>Math.log(x));
  const a = plane({need:[[-2.5,2.5],[-2.15,2.25]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  drawCells(a, TRI, {bias, lineW:2.0, lineCol:C.ink});
  drawCells(a, TRI, {fills:['none'], lineW:1.3, lineCol:C.muted, dash:'4 5'});
  dots(a, TRI);
  lbl(a, -1.36, -1.05, '\\mathbf{s}_1', PTCOL()[0], 'end'); lbl(a, 1.36, -1.05, '\\mathbf{s}_2', PTCOL()[1]);
  lbl(a, 0.18, 1.5, '\\mathbf{s}_3', PTCOL()[2]);
  return a.svg();
}

/* Two equally likely points a distance d apart, N0 = 1: the two densities
   along the line joining them, and the tail of the left one beyond the
   midpoint, which is P_e. */
function figBinary(v){
  const d = v ? v.d : 2, h = d/2;
  const a = P.Axes(SZ({xr:[-3.6,3.6], yr:[0,0.8], xlabel:'\\text{position along the line from }\\mathbf{s}_0\\text{ to }\\mathbf{s}_1',
    ylabel:'f(r\\mid s_i)', xticksOverride:[-3,-2,-1,0,1,2,3], yticksOverride:[0,0.25,0.5]}));
  const f0 = r => gpdf(r,-h,0.5), f1 = r => gpdf(r,h,0.5);
  wash(a, f0, 0, 3.6, C.err, 0.34);
  a.curve(f0, {color:C.out, width:2.2, dash:'7 5'});
  a.curve(f1, {color:C.out, width:2.6});
  a.vline(0, {color:C.ink, dash:'6 4', width:1.5});
  a.point(-h, 0, {color:C.in, r:6}); a.point(h, 0, {color:C.in, r:6});
  a.span(-h, h, 0.64, 'd', {tex:true, color:C.mid});
  lbl(a, 3.5, 0.73, 'P_e='+sci(Qf(d/Math.SQRT2)), C.err, 'end');
  return a.svg();
}

/* Unequal priors, d = 2 and N0 = 0.5: s0 at -1 and s1 at +1, the boundary
   a distance mu from s1, and both weighted tails, whose sum is P_e. */
function figBinaryPriors(v){
  const p = v ? v.p : 0.9, d = 2, N0 = 0.5, sg = Math.sqrt(N0/2);
  const mu = d/2 + N0/(2*d)*Math.log(p/(1-p)), xb = d/2 - mu;
  const w0 = r => (1-p)*gpdf(r,-1,N0/2), w1 = r => p*gpdf(r,1,N0/2);
  const pe = (1-p)*Qf((d-mu)/sg) + p*Qf(mu/sg);
  const a = P.Axes(SZ({xr:[-2.8,2.8], yr:[0,0.95], xlabel:'r', ylabel:'P(s_i)\\,f(r\\mid s_i)',
    xticksOverride:[-2,-1,1,2], yticksOverride:[0.25,0.5,0.75]}));
  wash(a, w0, xb, 2.8, C.err, 0.3); wash(a, w1, -2.8, xb, C.err, 0.3);
  a.curve(w0, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(w1, {color:C.mid, width:2.6});
  a.vline(xb, {color:C.ink, dash:'6 4', width:1.6});
  a.point(-1, 0, {color:C.in, r:6}); a.point(1, 0, {color:C.in, r:6});
  a.span(xb, 1, 0.84, '\\mu', {tex:true, color:C.ink});
  lbl(a, -2.7, 0.84, 'P_e='+num(pe,4), C.err);
  return a.svg();
}

/* 4.3. The sectors of 8PSK, the squares of 16-QAM, the thresholds of PAM4
   and the rectangles of a telephone keypad. */
const QAMN = (()=>{ const o = [], s = Math.sqrt(10); for(const x of [-3,-1,1,3]) for(const y of [-3,-1,1,3]) o.push([x/s, y/s]); return o; })();
const DT_L = [697,770,852,941], DT_H = [1209,1336,1477,1633];
const ZR = gauss(4407, 20, 1);
const REAL_REGIONS = realGallery({ id:'m4-real-regions', nav:'Decision regions around us',
  title:'Decision regions around us', eyebrow:'Module 4 · Decision regions', src:'CH9 s.47–50',
  objective:'Read the decision regions of satellite television, Wi-Fi, data-centre links and a telephone keypad.',
  keywords:'examples decision regions 8psk sectors dvb-s2 16-qam squares wifi pam4 thresholds data centre dtmf keypad tones rectangles',
  figs:[
    [()=>{ const a = galPlane([[-1.45,1.45],[-1.3,1.3]]), pts = Array.from({length:8},(_,i)=>[Math.cos(i*Math.PI/4), Math.sin(i*Math.PI/4)]);
      drawCells(a, pts, {fills:[C.dec.in, C.dec.mid]});
      pts.forEach(p=>a.point(p[0],p[1],{color:C.in,r:5.5})); return a.svg(); },
      'Satellite television can use 8PSK. Its regions are eight $45^{\\circ}$ sectors, so the receiver decides by the phase of $\\mathbf{r}$ alone.'],
    [()=>{ const a = galPlane([[-1.45,1.45],[-1.3,1.3]]);
      drawCells(a, QAMN, {fills:QAMN.map((p,i)=>((i>>2)+i)%2 ? C.dec.mid : C.dec.in)});
      QAMN.forEach(p=>a.point(p[0],p[1],{color:C.in,r:4.8})); return a.svg(); },
      'Wi-Fi 16-QAM at unit average energy has square regions of side $d_{\\min}=2/\\sqrt{10}=0.632$. The $12$ outer ones are unbounded.'],
    [()=>{ const lv = [-300,-100,100,300], sym = [2,0,3,1,1,3,0,2,3,0,1,2,2,1,0,3];
      const a = TAx(EXO({xt:[0,5,10,15], xr:[-0.8,16], yr:[-440,440], xlabel:'n', ylabel:'r[n]\\;(\\text{mV})', yticksOverride:[-300,-100,100,300]}));
      [[-440,-200],[-200,0],[0,200],[200,440]].forEach(([lo,hi],k)=>a.rect(-0.8,lo,16,hi,{fill:k%2?C.dec.mid:C.dec.in}));
      [-200,0,200].forEach(y=>a.hline(y,{color:C.ink, dash:'6 4', width:1.3}));
      a.stem(sym.map((k,n)=>[n, lv[k]+40*ZR[n]]), {color:C.out});
      return a.svg(); }, 'PAM4 in data-centre links sends $\\pm100$ and $\\pm300$ mV. The thresholds $0$ and $\\pm200$ mV cut the axis into four intervals.'],
    [()=>{ const pts = []; DT_L.forEach(x=>DT_H.forEach(y=>pts.push([x,y])));
      const a = P.Axes(EXO({xr:[655,985], yr:[1150,1700], xlabel:'f_{\\text{low}}\\;(\\text{Hz})', ylabel:'f_{\\text{high}}\\;(\\text{Hz})',
        xticksOverride:DT_L, yticksOverride:DT_H, grid:false}));
      drawCells(a, pts, {fills:pts.map((p,i)=>((i>>2)+i)%2 ? C.dec.mid : C.dec.in)});
      pts.forEach(p=>a.point(p[0],p[1],{color:C.in,r:4.8})); return a.svg(); },
      'A phone key sends one low and one high tone. The receiver decides in rectangles with edges halfway between neighbouring tones.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Nearest point', html:'In each system the receiver picks the signal point nearest to $\\mathbf r$. The regions are cut by perpendicular bisectors.'},
    {t:'note', kind:'def', head:'Outer regions', html:'Points on the edge of a constellation have unbounded regions. Noise can push them outward without an error.'},
    {t:'note', kind:'warn', head:'Scale', html:'The regions hold only if the receiver knows the scale of the points. A gain error moves every point and every boundary.'}
  ]});

/* ---- 4.4 error probability and the union bound ------------------------------ */

/* Monte Carlo on the five-point set: the centre is sent with sigma = 0.4 and
   the draws outside its region |r1| + |r2| < 1.2 are counted. */
const ZP = gauss(4404, 2000, 1);
const peCount = n => { let k = 0; for(let i=0;i<n;i++) if(Math.abs(0.4*ZP[2*i])+Math.abs(0.4*ZP[2*i+1]) > 1.2) k++; return k; };
function figPe(v){
  const f = clamp01(frameOf(v, 2)/2)*2, n = Math.round(Math.pow(10, 1+f)), pts = FIVE(1.2);
  const a = plane({need:[[-2.6,2.6],[-2.3,2.3]], xticksOverride:[], yticksOverride:[]});
  drawCells(a, pts);
  let s = '', k = 0;
  for(let i=0;i<n;i++){ const x = 0.4*ZP[2*i], y = 0.4*ZP[2*i+1], out = Math.abs(x)+Math.abs(y) > 1.2;
    if(out) k++;
    const col = out ? C.err : C.noise;
    s += `<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${out?3:2.2}" fill="${col}" stroke="${col}" stroke-width="0.6"/>`; }
  a.raw(s);
  dots(a, pts);
  lbl(a, -2.45, 2.02, '\\text{outside: }'+k+'/'+n+'='+num(k/n,3), C.err);
  return a.svg();
}

/* The union bound for s1 = (1,1) of the square: one pairwise half-plane a
   frame, then the parts of the plane the sum counts two or three times. */
function figUnion(v){
  const f = frameOf(v, 4), op = k => clamp01(f-k+1);
  const a = plane({need:[[-2.35,2.35],[-2.15,2.15]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  const X = a.o.xr, Y = a.o.yr, full = [[X[0],Y[0]],[X[1],Y[0]],[X[1],Y[1]],[X[0],Y[1]]];
  const A = [clipHalf(full,1,0,0), clipHalf(full,1,1,0), clipHalf(full,0,1,0)];
  cloud(a, i=>1+0.5*ZO[2*i], i=>1+0.5*ZO[2*i+1], 260);
  A.forEach((poly,k)=>{ const o = op(k+1); if(o < 0.02) return; fillPoly(a, poly, rgba(C.err, 0.14), o); });
  if(op(1) > 0.02) seg(a, [[0,Y[0]],[0,Y[1]]], {color:C.err, width:1.6, dash:'6 4', opacity:op(1)});
  if(op(2) > 0.02) seg(a, [[Math.max(X[0],-Y[1]),-Math.max(X[0],-Y[1])],[Math.min(X[1],-Y[0]),-Math.min(X[1],-Y[0])]], {color:C.err, width:1.6, dash:'6 4', opacity:op(2)});
  if(op(3) > 0.02) seg(a, [[X[0],0],[X[1],0]], {color:C.err, width:1.6, dash:'6 4', opacity:op(3)});
  dots(a, QPSK);
  lbl(a, 1.14, 1.3, '\\mathbf{s}_1', C.in);
  if(op(1) > 0.5) lbl(a, -0.55, 1.78, 'A_{12}', C.err, 'end');
  if(op(2) > 0.5) lbl(a, -0.3, -1.98, 'A_{13}', C.err, 'end');
  if(op(3) > 0.5) lbl(a, 1.8, -0.55, 'A_{14}', C.err);
  if(op(4) > 0.5){ lbl(a, -1.95, -1.25, '3\\times', C.err); lbl(a, -2.0, 0.95, '2\\times', C.err); lbl(a, 0.3, -1.62, '2\\times', C.err); }
  return a.svg();
}

/* 8-PSK: the general union bound, the sum of seven pairwise terms, and the
   minimum-distance bound 7 Q(sqrt(2 Es/N0) sin(pi/8)). */
const dB = db => Math.pow(10, db/10);
/* A curve on a logarithmic axis stops at the lower edge of the axis: LGF is
   that edge, set by the figure right after it makes its axes. */
let LGF = -99;
const lg10 = v => { const y = Math.log10(Math.max(1e-12, v)); return y < LGF-0.02 ? NaN : y; };
function figDmin(){
  const a = TAx(SZ({xt:[0,3,6,9,12], xr:[0,18], yr:[-6,0.6], xlabel:'E_s/N_0\\;(\\text{dB})', ylabel:'P_e', ytickfmt:P.decade,
    yticksOverride:P.decades(-6,0), zeroAxes:false})); LGF = a.o.yr[0];
  const gen = db => { let s = 0; for(let j=1;j<8;j++) s += Qf(Math.sqrt(2*dB(db))*Math.sin(Math.PI*j/8)); return s; };
  a.curve(db=>lg10(7*Qf(Math.sqrt(2*dB(db))*Math.sin(Math.PI/8))), {color:C.err, width:2.4, dash:'7 5'});
  a.curve(db=>lg10(gen(db)), {color:C.err, width:2.6});
  return a.svg();
}

/* Q(x) and its exponential bound on a logarithmic axis, with a marker. */
function figChernoff(v){
  const x0 = v ? v.x : 3, B = x => 0.5*Math.exp(-x*x/2);
  const a = TAx(SZ({xt:[0,1,2,3,4,5], xr:[0,5.2], yr:[-7,0.3], xlabel:'x', ylabel:'Q(x),\\;\\tfrac12e^{-x^{2}/2}', ytickfmt:P.decade,
    yticksOverride:P.decades(-7,0), zeroAxes:false})); LGF = a.o.yr[0];
  a.curve(x=>Math.log10(B(x)), {color:C.err, width:2.2, dash:'7 5'});
  a.curve(x=>Math.log10(Qf(x)), {color:C.err, width:2.6});
  a.vline(x0, {color:C.ink, dash:'5 4', width:1.3});
  dot(a, x0, Math.log10(B(x0)), {color:C.err, r:5}); dot(a, x0, Math.log10(Qf(x0)), {color:C.err, r:5.5});
  lbl(a, 0.15, -5.3, 'Q('+num(x0,1)+')='+sci(Qf(x0)), C.err);
  lbl(a, 0.15, -6.35, '\\tfrac12e^{-x^{2}/2}='+sci(B(x0)), C.err);
  return a.svg();
}

/* The square: the region of s1 is the first quadrant. Its two faces are
   shared with s2 and s4; the bisector toward s3 bounds nothing. */
function figIntel(){
  const a = plane({need:[[-2.4,2.4],[-2.1,2.1]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  drawCells(a, QPSK);
  const X = a.o.xr, Y = a.o.yr, L = Math.min(-X[0], Y[1]);
  seg(a, [[-L,L],[L,-L]], {color:C.muted, width:1.6, dash:'5 4'});
  seg(a, [[0,0],[0,Y[1]]], {color:C.err, width:4}); seg(a, [[0,0],[X[1],0]], {color:C.err, width:4});
  dots(a, QPSK);
  lbl(a, 1.14, 1.3, '\\mathbf{s}_1', C.in); lbl(a, -1.2, 0.72, '\\mathbf{s}_2', C.out, 'end');
  lbl(a, -1.14, -1.52, '\\mathbf{s}_3', C.mid, 'end'); lbl(a, 1.16, -0.72, '\\mathbf{s}_4', C.h);
  lbl(a, 0.14, 1.85, '\\text{face}', C.err); lbl(a, 1.55, 0.14, '\\text{face}', C.err);
  lbl(a, -0.75, 1.62, '\\text{no face}', C.muted, 'end');
  return a.svg();
}

/* 16-QAM on the grid (+-1, +-3): the corners have two nearest neighbours, the
   edge points three and the inner points four. One group a frame. */
const QAM16 = []; for(const x of [-3,-1,1,3]) for(const y of [-3,-1,1,3]) QAM16.push([x,y]);
const nnOf = p => QAM16.filter(q=>Math.abs(d2(p,q)-4) < 1e-9);
function figNN(v){
  const f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const a = plane({need:[[-4.3,4.3],[-4.4,4.1]], xlabel:'', ylabel:'', xticksOverride:[], yticksOverride:[], zeroAxes:false, grid:false});
  QAM16.forEach(p=>{ const g = nnOf(p).length-2, show = g === 0 ? 1 : op(g), cur = show*(1-op(g+1));
    if(cur > 0.02) nnOf(p).forEach(q=>seg(a, [p,q], {color:C.mid, width:2.4, opacity:cur}));
    if(show > 0.5) lbl(a, p[0]+0.3, p[1]+0.28, String(nnOf(p).length), C.mid, 'start', 15); });
  QAM16.forEach(p=>a.point(p[0], p[1], {color:C.in, r:6}));
  if(op(3) > 0.5) lbl(a, 0, -4.05, '\\bar N_{\\min}=\\frac{4(2)+8(3)+4(4)}{16}=3', C.ink, 'middle');
  return a.svg();
}

/* The four forms on the square, from s1: the general bound counts all three
   points, the intelligent bound the two faces, the nearest-neighbour form the
   two points on the circle of radius d_min, and the minimum-distance bound
   moves the diagonal point in to d_min. */
function figExUnion(v){
  const f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const a = plane({need:[[-2.4,2.4],[-2.1,2.1]], xticksOverride:[], yticksOverride:[]});
  drawCells(a, QPSK);
  const Y = a.o.yr, X = a.o.xr;
  const faces = op(1)*(1-op(2));
  if(faces > 0.02){ seg(a, [[0,0],[0,Y[1]]], {color:C.err, width:4, opacity:faces}); seg(a, [[0,0],[X[1],0]], {color:C.err, width:4, opacity:faces}); }
  if(op(2) > 0.02) circle(a, 2, {c:[1,1], color:C.mid, width:1.6, dash:'5 5', opacity:op(2)});
  seg(a, [[1,1],[-1,1]], {color:C.mid, width:2.4}); seg(a, [[1,1],[1,-1]], {color:C.mid, width:2.4});
  seg(a, [[1,1],[-1,-1]], {color:C.mid, width:2.4, dash:op(1) > 0.5 ? '4 6' : null, opacity:1-0.7*op(1)});
  const g = 1-Math.SQRT2;
  if(op(3) > 0.02){ seg(a, [[1,1],[g,g]], {color:C.mid, width:2.4, opacity:op(3)});
    ring(a, g, g, {color:C.mid, r:7, width:2.2, opacity:op(3)}); }
  dots(a, QPSK);
  lbl(a, 1.14, 1.3, '\\mathbf{s}_1', C.in);
  return a.svg();
}

/* Four points on the rectangle (+-1.5, +-1): from s1 = (1.5, 1) the others
   are at 3, 2 and sqrt13. The region of s1 is the first quadrant, so its two
   faces are shared with the points at 3 and at 2; only the one at 2 is a
   nearest neighbour. */
const RECT = [[1.5,1],[-1.5,1],[-1.5,-1],[1.5,-1]];
function figExUnionB(v){
  const f = frameOf(v, 2), op = k => clamp01(f-k+1);
  const a = plane({need:[[-2.5,2.5],[-1.9,1.9]], xticksOverride:[], yticksOverride:[]});
  drawCells(a, RECT);
  const Y = a.o.yr, X = a.o.xr, s = RECT[0];
  const lo = 1-0.65*op(1);
  RECT.slice(1).forEach((q,k)=>seg(a, [s,q], {color:C.mid, width:2.4, dash:k===1?'4 6':null, opacity:lo}));
  lbl(a, -0.75, 1.16, '3', C.mid, 'middle'); lbl(a, 1.66, -0.5, '2', C.mid);
  lbl(a, 0.1, -0.5, '\\sqrt{13}', C.mid);
  if(op(1) > 0.02){ const o = op(1)*(1-0.5*op(2));
    seg(a, [[0,0],[0,Y[1]]], {color:C.err, width:4, opacity:o}); seg(a, [[0,0],[X[1],0]], {color:C.err, width:4, opacity:o}); }
  if(op(2) > 0.02){ circle(a, 2, {c:s, color:C.mid, width:1.6, dash:'5 5', opacity:op(2)});
    ring(a, 1.5, -1, {color:C.mid, r:13, opacity:op(2)}); }
  dots(a, RECT);
  lbl(a, 1.64, 1.2, '\\mathbf{s}_1', C.in);
  return a.svg();
}

/* 16-QAM on the grid (+-1, +-3), E_s = 10: the general union bound, the
   minimum-distance bound, the nearest-neighbour form and a simulation of
   20 000 symbols at each even E_s/N0 from 0 to 18 dB. */
const QD = (()=>{ const m = {}; QAM16.forEach(p=>QAM16.forEach(q=>{ if(p===q) return; const k = d2(p,q); m[k] = (m[k]||0)+1/16; })); return Object.entries(m).map(([k,c])=>[+k,c]); })();
const q16 = {
  gen: db => { const N0 = 10/dB(db); return QD.reduce((s,[k,c])=>s + c*Qf(Math.sqrt(k/(2*N0))), 0); },
  nn:  db => 3*Qf(Math.sqrt(4/(2*10/dB(db)))),
  dm:  db => 15*Qf(Math.sqrt(4/(2*10/dB(db))))
};
let QSIM = null;
function qamSim(){
  if(QSIM) return QSIM;
  const z = gauss(4405, 40000, 1), r = rng(4406), sym = Array.from({length:20000}, ()=>Math.floor(r()*16));
  const snap = x => Math.max(-3, Math.min(3, 2*Math.floor(x/2)+1));
  QSIM = [];
  for(let db=0; db<=18; db+=2){ const sg = Math.sqrt(10/dB(db)/2); let e = 0;
    for(let i=0;i<20000;i++){ const p = QAM16[sym[i]];
      if(snap(p[0]+sg*z[2*i]) !== p[0] || snap(p[1]+sg*z[2*i+1]) !== p[1]) e++; }
    QSIM.push([db, e/20000]); }
  return QSIM;
}
function figTightness(v){
  const s0 = v ? v.snr : 6;
  const a = TAx(SZ({xt:[0,4,8,12,16], xr:[0,20], yr:[-5,0.9], xlabel:'E_s/N_0\\;(\\text{dB})', ylabel:'P_e', ytickfmt:P.decade,
    yticksOverride:P.decades(-5,0), zeroAxes:false})); LGF = a.o.yr[0];
  a.hline(0, {color:C.muted, dash:'2 4', width:1.2});
  a.curve(db=>lg10(q16.dm(db)), {color:C.err, width:2.0, dash:'2 5'});
  a.curve(db=>lg10(q16.gen(db)), {color:C.err, width:2.6});
  a.curve(db=>lg10(q16.nn(db)), {color:C.mid, width:2.4, dash:'7 5'});
  qamSim().forEach(([db,pe])=>{ if(pe > 0) a.point(db, Math.log10(pe), {color:C.out, r:5.5}); });
  a.vline(s0, {color:C.ink, dash:'5 4', width:1.3});
  lbl(a, 0.4, -3.9, '\\text{union: }'+sci(q16.gen(s0)), C.err);
  lbl(a, 0.4, -4.65, '\\text{nearest: }'+sci(q16.nn(s0)), C.mid);
  return a.svg();
}

/* 4.4. The nearest-neighbour form for Wi-Fi 16-QAM, the union bound and the
   exact error of LTE's QPSK, the switching points of link adaptation, and a
   bit-error-rate tester converging. */
const ZT = (()=>{ const r = rng(4408); let k = 0; const out = [];
  const marks = [3,3.5,4,4.5,5,5.5,6].map(e=>Math.round(Math.pow(10,e)));
  let n = 0; marks.forEach(m=>{ while(n < m){ if(r() < 1e-3) k++; n++; } out.push([Math.log10(m), k/m]); });
  return out; })();
const REAL_UNION = realGallery({ id:'m4-real-union', nav:'Error probability around us',
  title:'Error probability around us', eyebrow:'Module 4 · The union bound', src:'CH9 s.56–64',
  objective:'Use the nearest-neighbour form and the union bound on Wi-Fi, LTE and 5G, and see how an error rate is measured.',
  keywords:'examples wifi 16-qam nearest neighbour lte qpsk union bound exact 5g link adaptation switching snr bit error rate tester',
  figs:[
    [()=>{ const a = TAx(EXO({xt:[8,12,16,20], xr:[8,24], yr:[-7,0], xlabel:'E_s/N_0\\;(\\text{dB})', ylabel:'P_e', ytickfmt:P.decade, yticksOverride:[-6,-4,-2,0], zeroAxes:false})); LGF = a.o.yr[0];
      a.curve(db=>lg10(3*Qf(Math.sqrt(dB(db)/5))), {color:C.mid, width:2.4});
      return a.svg(); }, 'Wi-Fi 16-QAM has $d_{\\min}^{2}=0.4E_s$ and $\\bar N_{\\min}=3$. The nearest-neighbour form is $P_e\\approx3Q\\bigl(\\sqrt{E_s/5N_0}\\bigr)$.'],
    [()=>{ const a = TAx(EXO({xt:[0,4,8], xr:[0,12], yr:[-6,0], xlabel:'E_s/N_0\\;(\\text{dB})', ylabel:'P_e', ytickfmt:P.decade, yticksOverride:[-6,-4,-2,0], zeroAxes:false})); LGF = a.o.yr[0];
      a.curve(db=>lg10(2*Qf(Math.sqrt(dB(db)))+Qf(Math.sqrt(2*dB(db)))), {color:C.err, width:2.4});
      a.curve(db=>lg10(1-Math.pow(1-Qf(Math.sqrt(dB(db))),2)), {color:C.ink, width:1.8, dash:'6 4'});
      return a.svg(); }, 'LTE control channels use QPSK. Solid: the union bound. Dashed: the exact $P_e$. They differ by less than $1\\%$ above $10$ dB.'],
    [()=>{ const a = TAx(EXO({xt:[5,10,15,20], xr:[4,30], yr:[-5,0], xlabel:'E_s/N_0\\;(\\text{dB})', ylabel:'P_e', ytickfmt:P.decade, yticksOverride:[-4,-3,-2,-1,0], zeroAxes:false})); LGF = a.o.yr[0];
      a.hline(-3, {color:C.muted, dash:'3 4'});
      a.curve(db=>lg10(2*Qf(Math.sqrt(dB(db)))), {color:C.mid, width:2.2});
      a.curve(db=>lg10(3*Qf(Math.sqrt(dB(db)/5))), {color:C.mid, width:2.2, dash:'7 5'});
      a.curve(db=>lg10(3.5*Qf(Math.sqrt(dB(db)/21))), {color:C.mid, width:2.2, dash:'2 4'});
      return a.svg(); }, 'A 5G phone picks its modulation from the channel. For $P_e=10^{-3}$, QPSK, 16-QAM and 64-QAM need about $10.3$, $17.6$ and $24.0$ dB.'],
    [()=>{ const a = P.Axes(EXO({xr:[2.7,6.3], yr:[0,0.0034], xlabel:'n\\;(\\text{bits})', ylabel:'\\hat P_b', xtickfmt:P.decade, xticksOverride:[3,4,5,6], yticksOverride:[0,0.001,0.002,0.003], zeroAxes:false}));
      a.hline(0.001, {color:C.muted, dash:'3 4'});
      a.stem(ZT, {color:C.out, showZero:true});
      return a.svg(); }, 'A bit-error-rate tester divides the errors by the bits sent. At $P_b=10^{-3}$ the estimate settles once about $100$ errors are in.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Nearest neighbours first', html:'At useful error rates the terms at $d_{\\min}$ dominate. Designers quote $\\bar N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$.'},
    {t:'note', kind:'def', head:'A target error rate', html:'A link fixes a target such as $10^{-3}$. Each constellation then needs its own $E_s/N_0$.'},
    {t:'note', kind:'warn', head:'Few errors', html:'An error rate measured from a few errors is noisy. A tester waits for about $100$ errors.'}
  ]});

/* ---- 4.5 the chain ------------------------------------------------------- */

/* One symbol through the whole receiver: the waveform of 4.1, its two
   correlator outputs, the decision among four points (+-1, +-0.6), and then
   200 repeats of the same symbol with sigma = 0.3, the wrong ones in red. */
const CH_PTS = [[1,-0.6],[1,0.6],[-1,0.6],[-1,-0.6]];
const ZC = gauss(4409, 400, 1);
function figChain(v){
  const H = takeH(410), ha = Math.round(0.245*H), hb = Math.round(0.317*H), f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const a = TAx({w:560, h:ha, xr:[-0.03,1.13], yr:[-6.5,6.5], xlabel:'', ylabel:'r(t)',
    pad:{l:56,r:26,t:20,b:10}, yticksOverride:[-5,0,5]});
  seg(a, OB.t.map((x,i)=>[x, OB.r[i]]), {color:C.out, width:1.4});
  const b = TAx({w:560, h:hb, xr:[-0.03,1.13], yr:[-1.2,1.55], xlabel:'t/T', xnameDrop:34, ylabel:'c_1,\\;c_2',
    pad:{l:56,r:26,t:20,b:34}, xt:[0,0.5,1], yticksOverride:[-1,0,1]});
  const m = Math.round(OB.n*op(1));
  if(m > 1){
    seg(b, OB.t.slice(0,m+1).map((x,i)=>[x, OB.c1[i]]), {color:C.mid, width:2.4});
    seg(b, OB.t.slice(0,m+1).map((x,i)=>[x, OB.c2[i]]), {color:C.mid, width:2.4, dash:'7 5'});
  }
  const c = plane({h:H-ha-hb, need:[[-2.2,2.2],[-1.45,1.45]], xticksOverride:[], yticksOverride:[]});
  if(op(2) > 0.02) drawCells(c, CH_PTS, {opacity:op(2)});
  if(op(3) > 0.02){ const o = op(3); let s = '', k = 0;
    for(let i=0;i<200;i++){ const x = 1+0.3*ZC[2*i], y = -0.6+0.3*ZC[2*i+1], out = x < 0 || y > 0;
      if(out) k++;
      const col = out ? C.err : C.noise;
      s += `<circle cx="${f2(c.sx(x))}" cy="${f2(c.sy(y))}" r="${out?3:2.1}" fill="${col}" stroke="${col}" stroke-width="0.6" opacity="${o.toFixed(3)}"/>`; }
    c.raw(s);
    if(o > 0.5) lbl(c, -2.05, -1.25, '\\text{wrong: }'+k+'\\text{ of }200', C.err); }
  dots(c, CH_PTS, {cols:[C.in,C.in,C.in,C.in]});
  if(op(2) > 0.02){ const [x,y] = OB.rv;
    dot(c, x, y, {color:C.out, r:6.5, opacity:op(2)*(1-0.7*op(3))});
    ring(c, 1, -0.6, {opacity:op(2)*(1-op(3))}); }
  return stack(560, [[a.svg(),ha],[b.svg(),hb],[c.svg(),H-ha-hb]]);
}

/* Small sketches for the summary and project cards, in the dark-page tints. */
const G = (()=>{
  const sv = b => `<svg viewBox="0 0 92 44">${b}</svg>`;
  const ln = (d,c,w,da) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round"${da?` stroke-dasharray="${da}"`:''}/>`;
  const dt = (x,y,c,r) => `<circle cx="${x}" cy="${y}" r="${r||4}" fill="${c}"/>`;
  const AX='rgba(239,231,216,.30)', CY='#4FBECE', VI='#AC99DC', AM='#E5B255', GR='#82C27B', RD='#E8785F';
  const bell = (m, h, s) => 'M'+Array.from({length:41},(_,i)=>{ const x = 4+2.1*i; return x.toFixed(1)+','+(40-h*Math.exp(-Math.pow((x-m)/s,2))).toFixed(1); }).join('L');
  const axes = ln('M6 40 H88 M10 42 V4',AX,1);
  const quad = ln('M8 22 H84 M46 2 V42',AX,1);
  return {
    mary:   sv(ln('M4 30 H22 V12 H40 V36 H58 V20 H76 V8 H88',CY,2)),
    obs:    sv(axes+ln('M10 40 C30 40 34 14 52 12',VI,2)+dt(62,16,GR)+dt(56,20,CY,3)),
    mf:     sv(axes+ln('M10 40 C28 38 40 10 50 10 C60 10 70 38 86 40',VI,2)+ln('M50 4 V42',AX,1.2,'3 3')),
    irr:    sv(ln('M8 34 L60 34 L84 18 L32 18 Z',AM,1.4)+dt(44,26,GR,3.5)+ln('M44 26 V6',AX,1.4,'3 3')+dt(44,6,GR,3)),
    noise:  sv(Array.from({length:22},(_,i)=>dt((46+16*Math.cos(i*2.4)*((i%3+1)/3)).toFixed(1),(22+16*Math.sin(i*2.4)*((i%3+1)/3)).toFixed(1),AX,1.6)).join('')+ln('M62 22 A16 16 0 1 1 61.9 21.9',VI,1.4)),
    map:    sv(axes+ln(bell(30,26,11),VI,2)+ln(bell(62,16,11),VI,2,'4 3')+ln('M49 4 V42',AX,1.2,'3 3')),
    dist:   sv(quad+dt(66,10,CY)+dt(26,10,CY)+dt(26,34,CY)+dt(66,34,CY)+ln('M54 18 L66 10',GR,2.2)+ln('M54 18 L26 10 M54 18 L26 34 M54 18 L66 34',VI,1.2,'3 3')+dt(54,18,GR,3.5)),
    metric: sv(ln('M6 26 H88',AX,1)+`<rect x="12" y="26" width="12" height="12" fill="${VI}" opacity=".6"/><rect x="32" y="26" width="12" height="5" fill="${VI}" opacity=".6"/><rect x="52" y="16" width="12" height="10" fill="none" stroke="${GR}" stroke-width="2"/><rect x="72" y="22" width="12" height="4" fill="${VI}" opacity=".6"/>`),
    regions:sv(ln('M46 2 V42 M8 22 H84',CY,1.4)+dt(28,12,CY,3.5)+dt(64,12,CY,3.5)+dt(28,32,CY,3.5)+dt(64,32,CY,3.5)),
    binary: sv(axes+ln(bell(32,26,11),GR,2)+ln(bell(60,26,11),GR,2)+`<path d="M46 40 L46 ${(40-26*Math.exp(-Math.pow(14/11,2))).toFixed(1)} L60 14 L88 40 Z" fill="${RD}" opacity=".35"/>`),
    union:  sv(quad+`<path d="M8 2 H46 V42 H8 Z" fill="${RD}" opacity=".18"/><path d="M8 42 H84 V22 H8 Z" fill="${RD}" opacity=".18"/>`+dt(66,12,CY)),
    nn:     sv(ln('M16 22 H76 M46 6 V38',VI,2)+dt(46,22,CY)+dt(16,22,CY,3.2)+dt(76,22,CY,3.2)+dt(46,6,CY,3.2)+dt(46,38,CY,3.2)),
    tight:  sv(axes+ln('M10 8 C30 12 50 26 86 38',RD,2)+ln('M10 16 C30 18 50 28 86 39',VI,2,'4 3')+dt(40,21,GR,2.6)+dt(58,29,GR,2.6)+dt(74,34,GR,2.6))
  };
})();

/* ======================================================================== */
const SC = [

/* ---------------------------------------------------------------- 4.0 ---- */
{ id:'m4-open', module:'M4', nav:'Module 4 opening', title:'The Optimal Receiver in AWGN',
  objective:'Show what the receiver of this module does and what decides how often it is wrong.',
  keywords:'module 4 overview optimal receiver awgn noise cloud decision regions nearest point error probability union bound',
  src:'CH9 s.23', dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · The optimal receiver in AWGN'},
  {t:'title', level:1, text:'The Optimal Receiver in AWGN'},
  {t:'lede', text:'One of $M$ signals is sent and noise is added. The receiver turns what arrives into a point and picks the nearest signal point.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'stack', style:'--ts:1.6;gap:34px', items:[
      {t:'note', kind:'warn', head:'Result 1', html:'<span style="color:var(--graphite)">A bank of correlators turns $r(t)$ into a point $\\mathbf r$. The best rule picks the nearest signal point, with a handicap for each prior.</span>'},
      {t:'note', kind:'warn', head:'Result 2', html:'<span style="color:var(--graphite)">How often the receiver is wrong depends only on the distances between the points. The union bound turns them into a number.</span>'}
    ]}
  ], right:[
    {t:'fig', frames:{labels:['sent','noise','regions','errors']}, svg:figOpen}
  ]}
]},

/* ---------------------------------------------------------------- 4.1 ---- */
{ id:'m4-mary', module:'M4', nav:'Bits into symbols', title:'Bits into symbols',
  objective:'Group bits into blocks of k and relate the number of signals, the symbol rate and the bit rate.',
  keywords:'m-ary signalling bits per symbol k log2 M symbol rate bit rate symbol duration blocks frames',
  src:'CH9 s.23', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The observation'},
  {t:'title', text:'Bits into symbols'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$k=1$','$k=2$','$k=3$']}, svg:figMary,
      caption:'Twelve bits read in blocks of $k$. Each block picks one of $M=2^{k}$ levels and lasts $T=kT_b$.'}
  ], right:[
    {t:'eq', label:'Bits and symbols', tex:'k=\\log_2M,\\qquad R_s=\\frac1T,\\qquad R_b=kR_s,\\qquad T_b=\\frac{T}{k}',
      note:'Each symbol carries $k$ bits. The symbol rate $R_s$ counts waveforms a second. The bit rate $R_b$ counts bits.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'One waveform a block', html:'Each $T$ seconds the transmitter sends one of $M$ waveforms $s_1(t),\\ldots,s_M(t)$. The receiver must name it from a noisy $r(t)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A modem sends $2400$ symbols a second with $M=16$.<div class="nsep"></div>What is its bit rate?',
        ask:{key:'m4-mary', choices:['$2400$ b/s','$9600$ b/s','$38\\,400$ b/s'], answer:1,
          why:'$k=\\log_216=4$ bits a symbol, so $R_b=4\\times2400=9600$ b/s.'}}]}
  ]}
]},

{ id:'m4-observe', module:'M4', nav:'The observation vector', title:'The observation vector',
  objective:'Show how a bank of correlators turns the received waveform into a point r = s + n.',
  keywords:'correlator bank demodulator running integral received waveform signal plus noise point observation vector frames',
  src:'CH9 s.24–25', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The observation'},
  {t:'title', text:'The observation vector'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$r(t)$','integrate','$r_1,\\;r_2$','$\\mathbf{r}$']}, svg:figObserve,
      caption:'$r(t)$ is $s_i(t)$ plus noise over one symbol, $T=1$. Each running integral of $r(t)\\,\\psi_j(t)$ ends at one coordinate of $\\mathbf r$.'},
    {t:'legend', items:[['out','$r(t)$'],['in','$s_i(t)$'],['mid','$c_1(t)$',false,1],['mid','$c_2(t)$',true,1]], at:'tr'}
  ], right:[
    {t:'eq', label:'Correlator outputs', tex:'r_j=\\int_0^{T}r(t)\\,\\psi_j(t)\\,dt=s_{ij}+n_j,\\qquad j=1,\\ldots,N',
      note:'$r(t)=s_i(t)+n(t)$, and the integral is linear. Each output is a signal coordinate plus a noise coordinate.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · the observation', tex:'\\mathbf r=\\mathbf s_i+\\mathbf n',
        note:'The receiver now works with one point. The noise moves it away from the sent point $\\mathbf s_i$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\mathbf s_i=(2,-1)$ is sent and the noise coordinates are $n_1=0.3$, $n_2=-0.4$.<div class="nsep"></div>Where does $\\mathbf r$ land?',
        ask:{key:'m4-observe', choices:['$(2.3,-1.4)$','$(1.7,-0.6)$','$(0.3,-0.4)$'], answer:0,
          why:'$\\mathbf r=\\mathbf s_i+\\mathbf n=(2+0.3,\\,-1-0.4)=(2.3,-1.4)$.'}}]}
  ]}
]},

{ id:'m4-mfbank', module:'M4', nav:'The matched-filter bank', title:'The matched-filter bank',
  objective:'Show that a filter matched to each basis function, sampled at t = T, gives the correlator output.',
  keywords:'matched filter bank impulse response psi(T-t) sampling time correlator equivalence slider',
  src:'CH9 s.25', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The observation'},
  {t:'title', text:'The matched-filter bank'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'t', label:'$t_0/T$', min:0, max:2, step:0.05, v:0.6, show:v=>'$'+num(v)+'$'}]},
      svg:figMfbank,
      caption:'$\\psi(t)=\\sqrt3\\,t$ on $[0,1]$ and $r(t)=1.5\\,\\psi(t)$. Solid: the matched filter output $y(t)$. Dashed: the correlator $c(t)$. Drag the sampling time.'}
  ], right:[
    {t:'eq', label:'Matched filter', tex:'h_j(t)=\\psi_j(T-t),\\qquad y_j(t)=\\int_0^{T}r(\\tau)\\,\\psi_j(T-t+\\tau)\\,d\\tau',
      note:'Each filter is its basis function turned around in time. Its output is a convolution.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Sample at T', tex:'y_j(T)=\\int_0^{T}r(\\tau)\\,\\psi_j(\\tau)\\,d\\tau=r_j',
        note:'Put $t=T$: the shift disappears and the integral is the correlator. At other times the two differ.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The signals are as drawn.<div class="nsep"></div>What does the matched filter give at $t=T=1$?',
        ask:{key:'m4-mfbank', choices:['$0.75$','$1.5$','$4.5$'], answer:1,
          why:'$y(1)=1.5\\int_0^{1}\\psi^{2}(t)\\,dt=1.5$, the correlator value.'}}]}
  ]}
]},

{ id:'m4-irrelevant', module:'M4', nav:'The noise the receiver ignores', title:'The noise the receiver ignores',
  objective:'Show that the noise outside the signal space adds the same amount to every distance and can be dropped.',
  keywords:'irrelevant noise n prime outside signal space sufficient statistics projection three dimensions independent',
  src:'CH9 s.26–27', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The observation'},
  {t:'title', text:'The noise the receiver ignores'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$\\tilde{\\mathbf r}$','split','project','distances']}, svg:figIrrelevant,
      caption:'The amber sheet is the signal space. The noise splits into a part in the sheet and $n\'$ outside it. Only the part in the sheet moves $\\mathbf r$.'}
  ], right:[
    {t:'note', kind:'def', head:'Outside the signal space', html:'Noise has parts in every direction. The part $n\'(t)$ outside the span of $\\psi_1,\\ldots,\\psi_N$ does not depend on the signal sent.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Why it can be dropped', tex:'\\|\\tilde{\\mathbf r}-\\mathbf s_j\\|^{2}=\\|\\mathbf r-\\mathbf s_j\\|^{2}+\\|n\'\\|^{2}',
        note:'Pythagoras: $n\'$ is at right angles to the sheet. It adds the same $\\|n\'\\|^{2}$ for every $j$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Sufficient statistics', html:'The $N$ correlator outputs hold everything the decision needs. Nothing is lost by dropping $n\'(t)$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'In the sheet, $\\|\\mathbf r-\\mathbf s_1\\|^{2}=0.5$ and $\\|\\mathbf r-\\mathbf s_2\\|^{2}=2.0$. Outside, $\\|n\'\\|^{2}=0.8$.<div class="nsep"></div>What are the full squared distances?',
        ask:{key:'m4-irrelevant', choices:['$1.3$ and $2.8$','$0.5$ and $2.0$','$0.4$ and $1.6$'], answer:0,
          why:'Add $0.8$ to each: $1.3$ and $2.8$. The gap stays $1.5$, so $\\mathbf s_1$ still wins.'}}]}
  ]}
]},

{ id:'m4-noise', module:'M4', nav:'The noise components', title:'The noise components',
  objective:'Show that white noise on an orthonormal basis gives independent Gaussian components of variance N0/2.',
  keywords:'noise components independent gaussian variance N0/2 white noise orthonormal circular cloud correlation coefficient ellipse slider',
  src:'CH9 s.26–28', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The observation'},
  {t:'title', text:'The noise components'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'rho', label:'$\\rho$', min:-0.9, max:0.9, step:0.1, v:0, show:v=>'$'+num(v,1)+'$'}]},
      svg:figNoise,
      caption:'Two noise components with variance $1$. Drag the correlation $\\rho$. The solid and dashed curves hold about $39\\%$ and $86\\%$ of the points.'}
  ], right:[
    {t:'eq', label:'One component', tex:'n_j=\\int_0^{T}n(t)\\,\\psi_j(t)\\,dt,\\qquad E[n_j]=0,\\qquad E[n_j^{2}]=\\frac{N_0}{2}',
      note:'Each noise coordinate is Gaussian, with mean zero and variance $N_0/2$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Two components', tex:'E[n_jn_k]=\\frac{N_0}{2}\\int_0^{T}\\psi_j(t)\\,\\psi_k(t)\\,dt=0,\\qquad j\\ne k',
        note:'Uncorrelated Gaussians are independent, so the cloud is round.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'An ellipse', html:'Coloured noise gives $\\rho\\ne0$. The cloud tilts, and the nearest point is no longer the best guess.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Noise with $\\rho=0.8$ reaches the two correlators.<div class="nsep"></div>What shape does the cloud take?',
        ask:{key:'m4-noise', choices:['a circle','an ellipse along $n_1=n_2$','an ellipse along $n_1=-n_2$'], answer:1,
          why:'A positive $\\rho$ makes $n_2$ follow $n_1$. The cloud stretches along the line $n_1=n_2$.'}}]}
  ]}
]},

{ id:'m4-ex-pam4', module:'M4', nav:'Worked example · four-level PAM', title:'Worked example: four-level PAM',
  objective:'Find the four conditional densities at the output of the demodulator for four-level PAM.',
  keywords:'worked example 4-pam four level pam conditional density gaussian bells N0 slider demodulator output',
  src:'CH9 s.26–27', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · Worked example'},
  {t:'title', text:'Worked example: four-level PAM'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'N0', label:'$N_0$', min:0.02, max:0.6, step:0.02, v:0.1, show:v=>'$'+num(v)+'$'}]},
      svg:figPam4,
      caption:'Drag $N_0$. Each bell sits on one level, and its width grows with $\\sqrt{N_0}$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'Four-level PAM, $s_m\\in\\{-1.5,-0.5,0.5,1.5\\}$ on a unit-energy pulse, $N_0=0.1$.<div class="nsep"></div>Find $f(r\\mid s_m)$. How tall is each bell?',
      ask:{key:'m4-ex-pam4', choices:['$0.56$','$1.78$','$3.16$'], answer:1,
        why:'The peak is $1/\\sqrt{\\pi N_0}=1/\\sqrt{0.1\\pi}=1.78$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'r=s_m+n,\\qquad n\\sim\\mathcal N\\!\\left(0,\\tfrac{N_0}{2}\\right)',
        note:'One basis function, so one correlator and one number. The noise shifts it by a Gaussian amount.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'f(r\\mid s_m)=\\frac{1}{\\sqrt{\\pi N_0}}\\,e^{-(r-s_m)^{2}/N_0},\\qquad \\sigma^{2}=\\frac{N_0}{2}=0.05',
        note:'Four bells of one shape, each centred on its level.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Check', html:'Each bell has $\\sigma=0.22$, well inside half the spacing, $0.5$. Drag $N_0$ to $0.6$ and neighbours overlap.'}]}
  ]}
]},

{ id:'m4-ex-orth', module:'M4', nav:'Worked example · four orthogonal signals', title:'Worked example: four orthogonal signals',
  objective:'Find the densities of the four correlator outputs when one of four orthogonal signals is sent.',
  keywords:'worked example orthogonal signals four correlator outputs densities mean sqrt E noise only components frames',
  src:'CH9 s.26–27', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · Worked example'},
  {t:'title', text:'Worked example: four orthogonal signals'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$r_1$','$r_2$','$r_3$','$r_4$']}, svg:figOrth,
      caption:'$\\mathbf s_1$ is sent. Step through the four correlator outputs. Only the first is centred away from zero.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'Four orthogonal signals of energy $E=4$, $N_0=1$. $\\mathbf s_1=(2,0,0,0)$ is sent.<div class="nsep"></div>Find the density of each $r_k$. What is the mean of $r_1$?',
      ask:{key:'m4-ex-orth', choices:['$0$','$2$','$4$'], answer:1,
        why:'$r_1=\\sqrt E+n_1=2+n_1$, so its mean is $\\sqrt E=2$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'r_1=\\sqrt{E}+n_1,\\qquad r_k=n_k,\\quad k=2,3,4',
        note:'Only the first correlator sees the signal. The other three see noise alone.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'f(r_1\\mid\\mathbf s_1)=\\frac{e^{-(r_1-2)^{2}}}{\\sqrt{\\pi}},\\qquad f(r_k\\mid\\mathbf s_1)=\\frac{e^{-r_k^{2}}}{\\sqrt{\\pi}}',
        note:'Each has variance $N_0/2=0.5$ and peak $1/\\sqrt\\pi=0.56$. The four are independent.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Check', html:'The means $(2,0,0,0)$ have squared length $4=E$, as they must.'}]}
  ]}
]},

REAL_OBSERVE,

{ id:'m4-lab-u', module:'M4', nav:'Laboratory {lab} · The correlator bank', title:'Laboratory {lab} · The correlator bank',
  objective:'Watch the correlators turn noisy waveforms into points and count the wrong decisions.',
  keywords:'laboratory correlator running integral received point cloud send run nearest point wrong decisions interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · The observation'},
  {t:'title', text:'Laboratory {lab} · The correlator bank'},
  {t:'lede', text:'Choose a signal set and $E_s/N_0$, then send symbols. Watch the correlators integrate, each point land, and the cloud grow.'},
  {t:'lab', id:'U'}
]},

{ id:'m4-code-observe', module:'M4', nav:'Code · The observation', title:'The observation in code',
  objective:'Correlate noisy waveforms, measure the noise variance and draw the conditional densities.',
  keywords:'code matlab python program run correlator observation vector noise variance conditional density pam orthogonal',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 4 · The observation in code'},
  {t:'title', text:'The observation in code'},
  {t:'raw', html:()=>CODEBANK.page('m4-code-observe')}
]},

/* ---------------------------------------------------------------- 4.2 ---- */
{ id:'m4-map', module:'M4', nav:'MAP and ML', title:'MAP and ML',
  objective:'Derive the maximum a posteriori rule from Bayes and reduce it to maximum likelihood for equal priors.',
  keywords:'map maximum a posteriori ml maximum likelihood bayes prior likelihood weighted densities crossing threshold slider',
  src:'CH9 s.29–30', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'MAP and ML'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'p', label:'$P(s_1)$', min:0.1, max:0.9, step:0.05, v:0.7, show:v=>'$'+num(v)+'$'}]},
      svg:figMap,
      caption:'$s_1=+1$ and $s_2=-1$, $N_0=1$. Drag $P(s_1)$. The receiver picks the taller curve, so their crossing $\\tau$ is the threshold.'},
    {t:'legend', items:[['mid','$P(s_1)\\,f(r\\mid s_1)$'],['mid','$P(s_2)\\,f(r\\mid s_2)$',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'MAP', tex:'\\hat s=\\arg\\max_i P(\\mathbf s_i\\mid\\mathbf r)=\\arg\\max_i P(\\mathbf s_i)\\,f(\\mathbf r\\mid\\mathbf s_i)',
      note:'Bayes: $P(\\mathbf s_i\\mid\\mathbf r)=P(\\mathbf s_i)f(\\mathbf r\\mid\\mathbf s_i)/f(\\mathbf r)$. The denominator is the same for every $i$, so it drops.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'ML', tex:'\\hat s=\\arg\\max_i f(\\mathbf r\\mid\\mathbf s_i)',
        note:'With equal priors the factor $P(\\mathbf s_i)$ is common and drops too. MAP becomes maximum likelihood.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$P(s_1)=0.8$ and $P(s_2)=0.2$. At some $r$, $f(r\\mid s_1)=0.2$ and $f(r\\mid s_2)=0.5$.<div class="nsep"></div>Which does MAP pick?',
        ask:{key:'m4-map', choices:['$s_1$','$s_2$','a tie'], answer:0,
          why:'$0.8(0.2)=0.16$ beats $0.2(0.5)=0.10$. ML would pick $s_2$, because $0.5>0.2$.'}}]}
  ]}
]},

{ id:'m4-mindist', module:'M4', nav:'Minimum distance', title:'Minimum distance',
  objective:'Show that maximum likelihood in Gaussian noise picks the nearest signal point, and how priors change it.',
  keywords:'minimum distance detector gaussian likelihood logarithm nearest point squared distance prior handicap frames',
  src:'CH9 s.31–34', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'Minimum distance'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$\\mathbf r$','$D_1$','$D_2$','$D_3$','$D_4$','nearest']}, svg:figMindist,
      caption:'$\\mathbf r=(0.5,0.3)$ and four equally likely points $(\\pm1,\\pm1)$. Step through the four squared distances.'}
  ], right:[
    {t:'eq', label:'Gaussian likelihood', tex:'f(\\mathbf r\\mid\\mathbf s_i)=\\frac{1}{(\\pi N_0)^{N/2}}\\,e^{-\\|\\mathbf r-\\mathbf s_i\\|^{2}/N_0}',
      note:'The $N$ noise components are independent, so the density is a product of $N$ bells.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · minimum distance', tex:'\\hat s=\\arg\\min_i\\Bigl(\\|\\mathbf r-\\mathbf s_i\\|^{2}-N_0\\ln P(\\mathbf s_i)\\Bigr)',
        note:'Take the logarithm of $P(\\mathbf s_i)f(\\mathbf r\\mid\\mathbf s_i)$ and drop the constant. With equal priors, pick the nearest point.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\mathbf r$ as drawn, $N_0=1$. $P(\\mathbf s_4)=0.7$ and the other three are $0.1$.<div class="nsep"></div>Which point does MAP pick?',
        ask:{key:'m4-mindist', choices:['$\\mathbf s_1$','$\\mathbf s_4$','$\\mathbf s_2$'], answer:1,
          why:'$\\mathbf s_1$ scores $0.74+\\ln10=3.04$ and $\\mathbf s_4$ scores $1.94-\\ln0.7=2.30$. The smaller wins.'}}]}
  ]}
]},

{ id:'m4-metric', module:'M4', nav:'The correlation metric', title:'The correlation metric',
  objective:'Rewrite the minimum-distance rule as a correlation with an energy term and a prior term.',
  keywords:'correlation metric expand squared distance energy term E/2 prior term 4-pam bars frames',
  src:'CH9 s.35–36', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'The correlation metric'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$r\\,s_i$','$r\\,s_i-E_i/2$']}, svg:figMetric,
      caption:'4-PAM at $-3,-1,1,3$ and $r=1.6$. The correlation alone favours $s=3$. Taking off $E_i/2=s_i^{2}/2$ gives the win to $s=1$.'}
  ], right:[
    {t:'eq', label:'Expand the distance', tex:'\\|\\mathbf r-\\mathbf s_i\\|^{2}=\\|\\mathbf r\\|^{2}-2\\,\\mathbf r\\cdot\\mathbf s_i+E_i',
      note:'$\\|\\mathbf r\\|^{2}$ is the same for every $i$ and drops. Halve the rest and change its sign.'},
    {t:'reveal', at:1, items:[
      {t:'eq', result:true, label:'Key result · correlation metric', tex:'\\hat s=\\arg\\max_i\\Bigl(\\mathbf r\\cdot\\mathbf s_i-\\frac{E_i}{2}+\\frac{N_0}{2}\\ln P(\\mathbf s_i)\\Bigr)',
        note:'The same rule as minimum distance. With equal energies and priors only $\\mathbf r\\cdot\\mathbf s_i$ is left.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$r=1.6$ as drawn, equal priors.<div class="nsep"></div>What is the metric $rs_i-s_i^{2}/2$ of $s=3$?',
        ask:{key:'m4-metric', choices:['$0.3$','$1.1$','$4.8$'], answer:0,
          why:'$1.6(3)-9/2=4.8-4.5=0.3$. That is below $1.1$ for $s=1$, the nearest level.'}}]}
  ]}
]},

{ id:'m4-receiver', module:'M4', nav:'Two receiver structures', title:'Two receiver structures',
  objective:'Build the optimal receiver from basis correlators or from signal correlators, and compare their cost.',
  keywords:'receiver structure method I basis correlators method II signal correlators bias a_i block diagram frames',
  src:'CH9 s.37–38', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'Two receiver structures'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['Method I','Method II']}, svg:figReceiver,
      caption:'Method I correlates with the $N$ basis functions, then forms $M$ metrics. Method II correlates with the $M$ waveforms. Both give the same $\\hat s$.'}
  ], right:[
    {t:'note', kind:'def', head:'Method I', html:'Compute $\\mathbf r=(r_1,\\ldots,r_N)$ with $N$ correlators. Then form $\\mathbf r\\cdot\\mathbf s_i+a_i$ for each $i$ and keep the largest.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The bias', tex:'a_i=\\frac{N_0}{2}\\ln P(\\mathbf s_i)-\\frac{E_i}{2}',
        note:'One constant for each signal. The priors and the energies fix it before any signal arrives.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Method II', html:'Inner products are preserved, so $\\int_0^{T}r(t)\\,s_i(t)\\,dt=\\mathbf r\\cdot\\mathbf s_i$. $M$ correlators with the waveforms give the metrics directly.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$M=16$ signals span $N=2$ dimensions.<div class="nsep"></div>How many correlators does Method II need?',
        ask:{key:'m4-receiver', choices:['$2$','$16$','$32$'], answer:1,
          why:'One for each waveform, $M=16$. Method I needs only $N=2$, so it is cheaper here.'}}]}
  ]}
]},

{ id:'m4-optimal', module:'M4', nav:'Optimality of the MAP rule', title:'Optimality of the MAP rule',
  objective:'Show that the error probability is an area and that the MAP threshold makes it smallest.',
  keywords:'optimality map minimum error probability area threshold slider weighted densities crossing',
  src:'CH9 s.29–30', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'Optimality of the MAP rule'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'tau', label:'$\\tau$', min:-1.5, max:1.5, step:0.05, v:0.6, show:v=>'$'+num(v)+'$'}]},
      svg:figOptimal,
      caption:'$\\pm1$ with $P(s_1)=0.25$ at $+1$, $N_0=0.5$. Drag $\\tau$. The red areas add up to $P_e$, drawn below.'}
  ], right:[
    {t:'eq', label:'Error as an area', tex:'P_e(\\tau)=P(s_1)\\int_{-\\infty}^{\\tau}f(r\\mid s_1)\\,dr+P(s_2)\\int_{\\tau}^{\\infty}f(r\\mid s_2)\\,dr',
      note:'Each red area is a weighted density on the wrong side of $\\tau$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The best threshold', html:'Move $\\tau$ right by $\\Delta$. The first area gains $P(s_1)f(\\tau\\mid s_1)\\Delta$ and the second loses $P(s_2)f(\\tau\\mid s_2)\\Delta$. No move helps where the two are equal.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'In any dimension', html:'Give each $\\mathbf r$ to the largest weighted density. Any other choice adds area, so MAP has the smallest $P_e$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The link as drawn.<div class="nsep"></div>Where is $P_e(\\tau)$ smallest?',
        ask:{key:'m4-optimal', choices:['at $\\tau=0$','at $\\tau^{\\ast}=0.137$','at $\\tau=1$'], answer:1,
          why:'The weighted densities cross at $\\tau^{\\ast}=0.137$, where $P_e=0.0192$. At $\\tau=0$ it is $0.0228$.'}}]}
  ]}
]},

{ id:'m4-ex-map', module:'M4', nav:'Worked example · a MAP threshold', title:'Worked example: a MAP threshold',
  objective:'Find the MAP threshold and the error probability of a binary antipodal link with unequal priors.',
  keywords:'worked example map threshold antipodal unequal priors ln ratio error probability sketch',
  src:'CH9 s.29–34', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · Worked example'},
  {t:'title', text:'Worked example: a MAP threshold'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Mark the threshold, then check it.'}, svg:figExMap,
      caption:'Solid: $0.25\\,f(r\\mid s_1)$ at $+1$. Dashed: $0.75\\,f(r\\mid s_2)$ at $-1$. The answer marks $\\tau$ and the two error areas.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$\\pm1$, so $E_b=1$, with $P(s_1)=0.25$ at $+1$, $P(s_2)=0.75$ at $-1$ and $N_0=0.5$.<div class="nsep"></div>Find $\\tau$ and $P_e$. Which way does $\\tau$ move?',
      ask:{key:'m4-ex-map', choices:['toward $+1$','toward $-1$','it stays at $0$'], answer:0,
        why:'$s_1$ is the less likely signal, so its region shrinks. The threshold moves toward $+1$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\tau=\\frac{N_0}{4\\sqrt{E_b}}\\,\\ln\\frac{P(s_2)}{P(s_1)}',
        note:'Set the two weighted densities equal at $r=\\tau$ and take logarithms. The squares cancel.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\tau=\\tfrac{0.5}{4}\\ln3=0.137,\\qquad P_e=0.25\\,Q(1.73)+0.75\\,Q(2.27)=0.0192',
        note:'Each $Q$ argument is the distance from a point to $\\tau$, over $\\sigma=\\sqrt{N_0/2}=0.5$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Check', html:'ML keeps $\\tau=0$ and gets $Q(2)=0.0228$. MAP is about $16\\%$ better.'}]}
  ]}
]},

{ id:'m4-ex-receiver', module:'M4', nav:'Worked example · a receiver for four waveforms', title:'Worked example: a receiver for four waveforms',
  objective:'Build the optimal receiver for four drawn waveforms and decide one received point.',
  keywords:'worked example optimal receiver four waveforms unit pulses basis points regions correlation metric energy term frames',
  src:'CH9 s.39–46', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · Worked example'},
  {t:'title', text:'Worked example: a receiver for four waveforms'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['signals','basis','points','regions']}, svg:figExReceiver,
      caption:'Four waveforms built from two unit pulses. Step to the basis, the points and the regions of the minimum-distance receiver.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'The four waveforms on $[0,2)$, equally likely. $\\mathbf r=(1.2,0.3)$ arrives.<div class="nsep"></div>Build the receiver. Which signal does it pick?',
      ask:{key:'m4-ex-receiver', choices:['$s_1$','$s_2$','$s_3$'], answer:1,
        why:'The metrics are $0.4$ for $s_1$ and $0.5$ for $s_2$, so $s_2$ wins.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\begin{aligned}&\\psi_1=1\\text{ on }[0,1),\\qquad \\psi_2=1\\text{ on }[1,2)\\\\&\\mathbf s_1=(2,0),\\ \\mathbf s_2=(1,1),\\ \\mathbf s_3=(-1,1),\\ \\mathbf s_4=(-1,-1)\\end{aligned}',
        note:'Read the height on each half. The energies are $4,2,2,2$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}\\mathbf r\\cdot\\mathbf s_i-\\tfrac{E_i}{2}:&\\quad 2.4-2=0.4,\\quad 1.5-1=0.5,\\\\&\\quad {-0.9}-1=-1.9,\\quad -1.5-1=-2.5\\end{aligned}',
        note:'The largest is $0.5$, so $\\hat s=s_2$. The correlation alone picks $s_1$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Check', html:'Distances: $\\|\\mathbf r-\\mathbf s_1\\|^{2}=0.73$ and $\\|\\mathbf r-\\mathbf s_2\\|^{2}=0.53$. $\\mathbf r$ lies in the region of $\\mathbf s_2$.'}]}
  ]}
]},

REAL_RULE,

{ id:'m4-lab-v', module:'M4', nav:'Laboratory {lab} · The MAP detector', title:'Laboratory {lab} · The MAP detector',
  objective:'Move the priors, the noise and the threshold, and compare the MAP threshold with ML on a live stream of symbols.',
  keywords:'laboratory map detector threshold priors ml midpoint error areas simulated symbols stream interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'Laboratory {lab} · The MAP detector'},
  {t:'lede', text:'Set $P(s_1)$ and $E_b/N_0$, then choose ML, MAP or a threshold by hand. Compare the shaded error with a live stream of symbols.'},
  {t:'lab', id:'V'}
]},

{ id:'m4-code-rule', module:'M4', nav:'Code · The decision rule', title:'The decision rule in code',
  objective:'Compute MAP and ML thresholds, scan the error area, and compare the distance and correlation forms of the rule.',
  keywords:'code matlab python program run map ml threshold minimum distance correlation metric error area',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule in code'},
  {t:'title', text:'The decision rule in code'},
  {t:'raw', html:()=>CODEBANK.page('m4-code-rule')}
]},

/* ---------------------------------------------------------------- 4.3 ---- */
{ id:'m4-regions', module:'M4', nav:'Decision regions', title:'Decision regions',
  objective:'Draw the decision regions of a signal set from the perpendicular bisectors.',
  keywords:'decision regions perpendicular bisector convex polygon unbounded outer regions five points sketch',
  src:'CH9 s.47, 50', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions'},
  {t:'title', text:'Decision regions'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Draw the boundaries, then check them.'}, svg:figRegions,
      caption:'Five equally likely points: the corners $(\\pm1.2,\\pm1.2)$ and the centre. Draw the region of each point.'}
  ], right:[
    {t:'note', kind:'def', head:'Perpendicular bisectors', html:'The points equally far from $\\mathbf s_i$ and $\\mathbf s_j$ form a line: the perpendicular bisector of the segment between them.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'A region', tex:'R_i=\\bigl\\{\\mathbf r:\\ \\|\\mathbf r-\\mathbf s_i\\|<\\|\\mathbf r-\\mathbf s_j\\|\\ \\text{for all }j\\ne i\\bigr\\}',
        note:'Each region is cut out by bisectors, so it is a convex polygon.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Unbounded regions', html:'Outer points have regions that run off to infinity. Noise that pushes them outward causes no error.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The five points as drawn.<div class="nsep"></div>How many straight faces does the centre region have?',
        ask:{key:'m4-regions', choices:['$3$','$4$','$5$'], answer:1,
          why:'The four bisectors with the corners cut a square turned by $45^{\\circ}$: $|r_1|+|r_2|<1.2$.'}}]}
  ]}
]},

{ id:'m4-regions-priors', module:'M4', nav:'Regions with unequal priors', title:'Regions with unequal priors',
  objective:'Show that unequal priors move each boundary parallel to itself, toward the less likely point.',
  keywords:'unequal priors map regions boundary shift parallel bisector mu ln ratio three points slider',
  src:'CH9 s.48–50', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions'},
  {t:'title', text:'Regions with unequal priors'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'p', label:'$P(\\mathbf s_3)$', min:0.1, max:0.8, step:0.05, v:0.6, show:v=>'$'+num(v)+'$'}]},
      svg:figRegionsPriors,
      caption:'Three points, $N_0=1$. Drag $P(\\mathbf s_3)$. The other two share the rest. Solid lines are the MAP boundaries, dashed lines the equal-prior ones.'}
  ], right:[
    {t:'eq', label:'A boundary', tex:'\\|\\mathbf r-\\mathbf s_i\\|^{2}-N_0\\ln P(\\mathbf s_i)=\\|\\mathbf r-\\mathbf s_j\\|^{2}-N_0\\ln P(\\mathbf s_j)',
      note:'The $\\|\\mathbf r\\|^{2}$ terms cancel. The boundary is still a straight line, parallel to the bisector.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The shift', tex:'\\mu_i=\\frac{d}{2}+\\frac{N_0}{2d}\\ln\\frac{P(\\mathbf s_i)}{P(\\mathbf s_j)}',
        note:'$\\mu_i$ is the distance from $\\mathbf s_i$ to the boundary. A likely point pushes the line away from itself.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$d=2$, $N_0=1$, $P(\\mathbf s_i)=0.8$ and $P(\\mathbf s_j)=0.2$.<div class="nsep"></div>How far from $\\mathbf s_i$ is the boundary?',
        ask:{key:'m4-regions-priors', choices:['$0.65$','$1$','$1.35$'], answer:2,
          why:'$\\mu_i=1+\\tfrac14\\ln4=1+0.35=1.35$. The likely point keeps the larger share.'}}]}
  ]}
]},

{ id:'m4-binary', module:'M4', nav:'Binary error probability', title:'Binary error probability',
  objective:'Find the error probability of two equally likely points from their distance.',
  keywords:'binary error probability distance Q function tail antipodal orthogonal on-off d squared over 2N0 slider',
  src:'CH9 s.48–55', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions'},
  {t:'title', text:'Binary error probability'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'d', label:'$d$', min:0.5, max:4, step:0.1, v:2, show:v=>'$'+num(v,1)+'$'}]},
      svg:figBinary,
      caption:'Two equally likely points a distance $d$ apart, $N_0=1$. Drag $d$. The red tail past the midpoint is $P_e$.'}
  ], right:[
    {t:'eq', label:'Along the line', tex:'P_e=P\\Bigl(n>\\frac d2\\Bigr)=Q\\!\\left(\\frac{d/2}{\\sqrt{N_0/2}}\\right)=Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)',
      note:'Only the noise along the line through the two points matters. It has variance $N_0/2$, and an error needs more than $d/2$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Two special cases', html:'<div class="cmp"><div><b>Antipodal</b>, $d=2\\sqrt{E_b}$: $P_e=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.</div><div><b>Orthogonal or on-off</b>, $d=\\sqrt{2E_b}$: $P_e=Q\\bigl(\\sqrt{E_b/N_0}\\bigr)$.</div></div>'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$d=2$ and $N_0=0.5$.<div class="nsep"></div>What is $P_e$?',
        ask:{key:'m4-binary', choices:['$Q(1)$','$Q(2)$','$Q(4)$'], answer:1,
          why:'$d^{2}/2N_0=4/1=4$, so $P_e=Q(2)=0.0228$.'}}]}
  ]}
]},

{ id:'m4-binary-priors', module:'M4', nav:'Binary error with unequal priors', title:'Binary error with unequal priors',
  objective:'Find the error probability of a binary MAP receiver when the priors differ.',
  keywords:'binary error unequal priors map boundary mu two tails weighted sum slider',
  src:'CH9 s.48–54', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions'},
  {t:'title', text:'Binary error with unequal priors'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'p', label:'$P(s_1)$', min:0.1, max:0.95, step:0.05, v:0.9, show:v=>'$'+num(v)+'$'}]},
      svg:figBinaryPriors,
      caption:'$s_0=-1$ and $s_1=+1$, so $d=2$, with $N_0=0.5$. Drag $P(s_1)$. The boundary sits $\\mu$ from $s_1$, and the red tails add up to $P_e$.'}
  ], right:[
    {t:'eq', label:'Two tails', tex:'P_e=P(s_0)\\,Q\\!\\left(\\frac{d-\\mu}{\\sqrt{N_0/2}}\\right)+P(s_1)\\,Q\\!\\left(\\frac{\\mu}{\\sqrt{N_0/2}}\\right)',
      note:'If $s_0$ is sent, an error needs noise past $d-\\mu$. If $s_1$ is sent, past $\\mu$. Weight each by its prior.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The boundary', tex:'\\mu=\\frac d2+\\frac{N_0}{2d}\\ln\\frac{P(s_1)}{P(s_0)}',
        note:'Equal priors give $\\mu=d/2$ and the formula of the last slide.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$P(s_1)=0.9$ as drawn, $d=2$, $N_0=0.5$.<div class="nsep"></div>Which receiver has the smaller $P_e$?',
        ask:{key:'m4-binary-priors', choices:['MAP, $0.0122$','ML, $0.0228$','both the same'], answer:0,
          why:'MAP uses $\\mu=1.27$ and gets $0.0122$. ML keeps the midpoint and gets $Q(2)=0.0228$.'}}]}
  ]}
]},

REAL_REGIONS,

{ id:'m4-lab-g', module:'M4', nav:'Laboratory {lab} · Constellations and decision regions', title:'Laboratory {lab} · Constellations and decision regions',
  objective:'Choose a constellation and a noise level, see its decision regions, and count errors against the union bound.',
  keywords:'laboratory constellation decision regions drag points noise scatter error count union bound interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions'},
  {t:'title', text:'Laboratory {lab} · Constellations and decision regions'},
  {t:'lede', text:'Choose a constellation and drag its points with the pointer. See the regions, scatter received points, and compare the errors with the union bound.'},
  {t:'lab', id:'G'}
]},

{ id:'m4-code-regions', module:'M4', nav:'Code · Decision regions', title:'Decision regions in code',
  objective:'Draw decision regions on a grid and compute the binary error probability with equal and unequal priors.',
  keywords:'code matlab python program run decision regions grid binary error probability priors boundary',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions in code'},
  {t:'title', text:'Decision regions in code'},
  {t:'raw', html:()=>CODEBANK.page('m4-code-regions')}
]},

/* ---------------------------------------------------------------- 4.4 ---- */
{ id:'m4-pe', module:'M4', nav:'The exact error probability', title:'The exact error probability',
  objective:'Write the exact error probability as an integral over regions, and estimate it by simulation.',
  keywords:'exact error probability integral over region no closed form monte carlo simulation count errors frames',
  src:'CH9 s.51, 56', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'The exact error probability'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$10$','$100$','$1000$']}, svg:figPe,
      caption:'The centre point of the five-point set is sent, with $\\sigma=0.4$. Step from $10$ to $1000$ draws. The red fraction settles near the exact $0.067$.'}
  ], right:[
    {t:'eq', label:'Exact error', tex:'P_e=\\sum_{i=1}^{M}P(\\mathbf s_i)\\int_{\\mathbf r\\notin R_i}f(\\mathbf r\\mid\\mathbf s_i)\\,d\\mathbf r',
      note:'Each term is the part of a Gaussian bell that falls outside a polygon.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'No closed form', html:'For most polygons this integral has no formula. It needs numerical integration or a simulation.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Simulation', html:'Send many symbols, add noise and count the wrong decisions. About $100$ errors give a usable estimate.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The true $P_e$ is about $10^{-4}$.<div class="nsep"></div>How many symbols give about $100$ errors?',
        ask:{key:'m4-pe', choices:['$10^{4}$','$10^{6}$','$10^{8}$'], answer:1,
          why:'$100/10^{-4}=10^{6}$ symbols.'}}]}
  ]}
]},

{ id:'m4-union', module:'M4', nav:'The union bound', title:'The union bound',
  objective:'Bound the error probability by a sum of pairwise error probabilities, each a binary Q function.',
  keywords:'union bound pairwise error events half planes overlap counted twice sum of Q functions frames',
  src:'CH9 s.57–59', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'The union bound'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$\\mathbf s_1$','$A_{12}$','$A_{13}$','$A_{14}$','overlaps']}, svg:figUnion,
      caption:'$\\mathbf s_1=(1,1)$ is sent. Step through the three half-planes where it loses to one other point.'}
  ], right:[
    {t:'eq', label:'Pairwise events', tex:'P(\\text{error}\\mid\\mathbf s_i)\\le\\sum_{j\\ne i}P(A_{ij}),\\qquad P(A_{ij})=Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)',
      note:'$A_{ij}$: $\\mathbf r$ is nearer $\\mathbf s_j$ than $\\mathbf s_i$, a binary error at distance $d_{ij}$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Overlaps counted twice', html:'The sum counts each overlap more than once, so it can only be larger.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', result:true, label:'Key result · union bound', tex:'P_e\\le\\frac1M\\sum_{i=1}^{M}\\sum_{j\\ne i}Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)',
        note:'It needs only the distances between the points.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The square has $M=4$ points.<div class="nsep"></div>How many $Q$ terms does the bound for $\\mathbf s_1$ have?',
        ask:{key:'m4-union', choices:['$2$','$3$','$4$'], answer:1,
          why:'One for each other point, $M-1=3$: two at $d=2$ and one at $2\\sqrt2$.'}}]}
  ]}
]},

{ id:'m4-dmin', module:'M4', nav:'The minimum-distance bound', title:'The minimum-distance bound',
  objective:'Replace every distance by the smallest one to get a bound that needs only M and d_min.',
  keywords:'minimum distance bound M-1 Q d_min 8-psk looser than union bound log axis',
  src:'CH9 s.60–61', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'The minimum-distance bound'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figDmin,
      caption:'8-PSK. Solid: the sum of all seven pairwise terms. Dashed: every distance replaced by $d_{\\min}$. The dashed curve stays above.'},
    {t:'legend', items:[['err','union bound'],['err','$d_{\\min}$ bound',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Minimum-distance bound', tex:'P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)',
      note:'Every $d_{ij}\\ge d_{\\min}$ and $Q$ falls, so each term is at most the one at $d_{\\min}$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'One number', html:'The bound needs only $M$ and the smallest distance. It is quick, and loose when few pairs sit at $d_{\\min}$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'8-PSK with $E_s=1$.<div class="nsep"></div>What is $d_{\\min}$?',
        ask:{key:'m4-dmin', choices:['$0.38$','$0.77$','$1.41$'], answer:1,
          why:'$d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/8)=2(0.383)=0.77$.'}}]}
  ]}
]},

{ id:'m4-chernoff', module:'M4', nav:'An exponential bound', title:'An exponential bound',
  objective:'Bound Q(x) by an exponential and write the error probability as a plain exponential in d_min.',
  keywords:'exponential bound Q function half exp minus x squared over 2 chernoff log axis slider',
  src:'CH9 s.60–61', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'An exponential bound'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'x', label:'$x$', min:0.5, max:5, step:0.1, v:3, show:v=>'$'+num(v,1)+'$'}]},
      svg:figChernoff,
      caption:'Solid: $Q(x)$. Dashed: $\\tfrac12e^{-x^{2}/2}$. Drag $x$. The bound stays above $Q(x)$, and both fall with the same exponent.'}
  ], right:[
    {t:'eq', label:'Exponential bound', tex:'Q(x)\\le\\tfrac12e^{-x^{2}/2},\\qquad x\\ge0',
      note:'A plain exponential that sits above $Q$ for every $x\\ge0$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Applied to the bound', tex:'P_e\\le\\frac{M-1}{2}\\,e^{-d_{\\min}^{2}/4N_0}',
        note:'Put $x^{2}=d_{\\min}^{2}/2N_0$ in the minimum-distance bound. The error falls exponentially in $d_{\\min}^{2}/N_0$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$x=3$ as drawn.<div class="nsep"></div>How much larger is the bound than $Q(3)$?',
        ask:{key:'m4-chernoff', choices:['about $1.1$ times','about $4$ times','about $40$ times'], answer:1,
          why:'$\\tfrac12e^{-4.5}=5.6\\times10^{-3}$ against $Q(3)=1.35\\times10^{-3}$, a ratio of $4.1$.'}}]}
  ]}
]},

{ id:'m4-intel', module:'M4', nav:'The intelligent union bound', title:'The intelligent union bound',
  objective:'Keep only the terms for points that share a face of the decision region.',
  keywords:'intelligent union bound faces of decision region neighbours drop terms qpsk square',
  src:'CH9 s.59–60', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'The intelligent union bound'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figIntel,
      caption:'The region of $\\mathbf s_1$ is the first quadrant. Its two faces, in red, are shared with $\\mathbf s_2$ and $\\mathbf s_4$. The bisector with $\\mathbf s_3$, dashed, only touches the corner.'}
  ], right:[
    {t:'note', kind:'def', head:'Only the faces', html:'To leave $R_i$, $\\mathbf r$ must cross one of its faces. Keep the terms for points that share a face; drop the others.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Intelligent union bound', tex:'P(\\text{error}\\mid\\mathbf s_i)\\le\\sum_{j\\in F_i}Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)',
        note:'$F_i$ holds the points that share a face with $R_i$. The bound is tighter, and still a bound.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The square as drawn.<div class="nsep"></div>How many terms does the intelligent bound keep for $\\mathbf s_1$?',
        ask:{key:'m4-intel', choices:['$1$','$2$','$3$'], answer:1,
          why:'Two faces, shared with $\\mathbf s_2$ and $\\mathbf s_4$. The term for $\\mathbf s_3$ is dropped.'}}]}
  ]}
]},

{ id:'m4-nn', module:'M4', nav:'Nearest neighbours', title:'Nearest neighbours',
  objective:'Approximate the error probability by the terms at the minimum distance, weighted by the average number of neighbours.',
  keywords:'nearest neighbour approximation N_min average neighbours at d_min 16-qam corners edges inner frames',
  src:'CH9 s.60–61', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'Nearest neighbours'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['corners','edges','inner','average']}, svg:figNN,
      caption:'16-QAM on the grid $\\pm1,\\pm3$, so $d_{\\min}=2$. Step through the corners, the edge points and the inner points. Each number counts neighbours at $d_{\\min}$.'}
  ], right:[
    {t:'eq', result:true, label:'Key result · nearest neighbours', tex:'P_e\\approx\\bar N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)',
      note:'$\\bar N_{\\min}$ is the average number of neighbours at $d_{\\min}$. At high SNR the other terms are far smaller.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'An approximation', html:'It keeps only part of the union bound, so it is not a bound. It can sit below the exact $P_e$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'QPSK, the square $(\\pm1,\\pm1)$.<div class="nsep"></div>What is $\\bar N_{\\min}$?',
        ask:{key:'m4-nn', choices:['$1$','$2$','$3$'], answer:1,
          why:'Each point has two neighbours at $d_{\\min}=2$. The diagonal point is at $2\\sqrt2$.'}}]}
  ]}
]},

{ id:'m4-ex-union', module:'M4', nav:'Worked example · four forms on QPSK', title:'Worked example: four forms on QPSK',
  objective:'Compute the general, intelligent, nearest-neighbour and minimum-distance forms for QPSK and compare them.',
  keywords:'worked example qpsk union bound intelligent nearest neighbour minimum distance compare exact frames',
  src:'CH9 s.62–63', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · Worked example'},
  {t:'title', text:'Worked example: four forms on QPSK'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['general','intelligent','nearest','$d_{\\min}$']}, svg:figExUnion,
      caption:'From $\\mathbf s_1$: all three points, the two faces, the circle of radius $d_{\\min}$, and the diagonal point moved in to $d_{\\min}$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'QPSK at $(\\pm1,\\pm1)$, equal priors, $N_0=2/9$, so $d_{\\min}^{2}/2N_0=9$.<div class="nsep"></div>Compute the four forms. Which is largest?',
      ask:{key:'m4-ex-union', choices:['general','intelligent','$d_{\\min}$ bound'], answer:2,
        why:'It counts three terms at $Q(3)$. The others count two, plus a tiny diagonal term.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'Q(3)=1.35\\times10^{-3},\\qquad Q(\\sqrt{18})=Q(4.24)=1.1\\times10^{-5}',
        note:'Neighbours at $d=2$ give $x=3$. The diagonal at $2\\sqrt2$ gives $x=\\sqrt{18}$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}\\text{general}&=2Q(3)+Q(4.24)=2.71\\times10^{-3}\\\\\\text{intelligent}=\\text{nearest}&=2Q(3)=2.70\\times10^{-3}\\\\d_{\\min}\\text{ bound}&=3Q(3)=4.05\\times10^{-3}\\end{aligned}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Check', html:'The exact value is $1-\\bigl(1-Q(3)\\bigr)^{2}=2.70\\times10^{-3}$. The diagonal term adds only $0.4\\%$.'}]}
  ]}
]},

{ id:'m4-ex-union-b', module:'M4', nav:'Worked example · a rectangle', title:'Worked example: a rectangle',
  objective:'Compute the intelligent bound and the nearest-neighbour form for a set where they differ.',
  keywords:'worked example rectangle four points faces intelligent bound nearest neighbour differ exact frames',
  src:'CH9 s.64–65', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · Worked example'},
  {t:'title', text:'Worked example: a rectangle'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['distances','faces','nearest']}, svg:figExUnionB,
      caption:'Four points $(\\pm1.5,\\pm1)$. Step from the three distances to the two faces of $R_1$, and then to its one nearest neighbour.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'Four equally likely points $(\\pm1.5,\\pm1)$ with $N_0=0.4$.<div class="nsep"></div>Find two forms. Which point shares a face with $\\mathbf s_1$ but is not a nearest neighbour?',
      ask:{key:'m4-ex-union-b', choices:['$(-1.5,1)$','$(1.5,-1)$','$(-1.5,-1)$'], answer:0,
        why:'It shares the face $r_1=0$ but sits at distance $3$, more than $d_{\\min}=2$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'d=2:\\ Q\\bigl(2/\\sqrt{0.8}\\bigr)=Q(2.24)=1.27\\times10^{-2},\\qquad d=3:\\ Q(3.35)=4.0\\times10^{-4}',
        note:'Each argument is $d/\\sqrt{2N_0}=d/\\sqrt{0.8}$. All four points are alike.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}\\text{intelligent}&=Q(2.24)+Q(3.35)=1.31\\times10^{-2}\\\\\\text{nearest}&=\\bar N_{\\min}\\,Q(2.24)=1.27\\times10^{-2}\\end{aligned}',
        note:'$\\bar N_{\\min}=1$: each point has one neighbour at $d_{\\min}=2$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Check', html:'The exact value is $1.31\\times10^{-2}$. The nearest-neighbour form is $3\\%$ below it, so it is not a bound.'}]}
  ]}
]},

{ id:'m4-tightness', module:'M4', nav:'Tightness of the bounds', title:'Tightness of the bounds',
  objective:'Compare the union bound, the minimum-distance bound and the nearest-neighbour form with a simulation across SNR.',
  keywords:'tightness union bound low snr exceeds one high snr nearest neighbour simulation 16-qam log axis slider',
  src:'CH9 s.64', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'Tightness of the bounds'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'snr', label:'$E_s/N_0$', min:0, max:18, step:1, v:6, show:v=>'$'+v+'$ dB'}]},
      svg:figTightness,
      caption:'16-QAM with $E_s=10$. Green dots: a simulation of $20\\,000$ symbols. Drag the SNR marker and read the two values below the curves.'},
    {t:'legend', items:[['err','union bound'],['err','$d_{\\min}$ bound',true],['mid','nearest neighbour',true],['out','simulation','dot']], at:'tr'}
  ], right:[
    {t:'note', kind:'def', head:'Low SNR', html:'Many terms are large and they overlap. The union bound can pass $1$ and then tells nothing.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'High SNR', html:'The terms at $d_{\\min}$ dominate. The union bound, the nearest-neighbour form and the simulation meet.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The $d_{\\min}$ bound', html:'It counts all $15$ other points at $d_{\\min}$, five times the $\\bar N_{\\min}=3$ of 16-QAM. It stays five times too high.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'16-QAM at $0$ dB, as drawn.<div class="nsep"></div>What does the union bound give?',
        ask:{key:'m4-tightness', choices:['about $0.3$','about $0.9$','about $2.8$'], answer:2,
          why:'It adds $15$ heavily overlapping terms and gets $2.79$, more than any probability.'}}]}
  ]}
]},

REAL_UNION,

{ id:'m4-lab-w', module:'M4', nav:'Laboratory {lab} · Error bounds against simulation', title:'Laboratory {lab} · Error bounds against simulation',
  objective:'Plot the union bound and its variants against a Monte Carlo simulation for several constellations.',
  keywords:'laboratory error bounds union intelligent nearest neighbour minimum distance exponential monte carlo snr constellation interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'Laboratory {lab} · Error bounds against simulation'},
  {t:'lede', text:'Choose a constellation. Compare five bounds with a Monte Carlo run that grows as you watch, at any SNR.'},
  {t:'lab', id:'W'}
]},

{ id:'m4-code-union', module:'M4', nav:'Code · The union bound', title:'The union bound in code',
  objective:'Estimate the error probability by simulation and compare it with the union, intelligent, nearest-neighbour, minimum-distance and exponential bounds.',
  keywords:'code matlab python program run monte carlo union bound intelligent nearest neighbour minimum distance exponential',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound in code'},
  {t:'title', text:'The union bound in code'},
  {t:'raw', html:()=>CODEBANK.page('m4-code-union')}
]},

/* ---------------------------------------------------------------- 4.5 ---- */
{ id:'m4-chain', module:'M4', nav:'From waveform to error rate', title:'From waveform to error rate',
  objective:'Follow one symbol through the whole receiver: correlators, decision and error probability.',
  keywords:'chain waveform correlators point decision regions error probability repeat review frames summary',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · Summary'},
  {t:'title', text:'From waveform to error rate'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$r(t)$','correlate','decide','repeat']}, svg:figChain,
      caption:'One symbol through the receiver. Step to the correlator outputs, the decision, and $200$ repeats whose wrong decisions estimate $P_e$.'}
  ], right:[
    {t:'note', kind:'def', head:'Four moves', html:'<ol class="steps"><li>Correlate $r(t)$ with the basis to get $\\mathbf r$.</li><li>Pick the best metric: the nearest point for equal priors.</li><li>Read the regions from the bisectors.</li><li>Bound $P_e$ from the distances.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Module 5', html:'Each modulation of Module 5 is a constellation. Its error rate follows from its distances and this receiver.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'QPSK with $d_{\\min}^{2}/2N_0=16$.<div class="nsep"></div>What does the nearest-neighbour form give?',
        ask:{key:'m4-chain', choices:['$3.2\\times10^{-5}$','$6.3\\times10^{-5}$','$9.5\\times10^{-5}$'], answer:1,
          why:'$\\bar N_{\\min}=2$ and $Q(4)=3.17\\times10^{-5}$, so $P_e\\approx6.3\\times10^{-5}$.'}}]}
  ]}
]},

{ id:'m4-quick', module:'M4', nav:'Quick check', title:'Quick check',
  objective:'Check the module ideas with six short predictions.',
  keywords:'quick check predict bits per symbol noise variance nearest point priors binary error union bound terms',
  budget:'a set of six prediction cards. The questions carry no figure',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · Quick check'},
  {t:'title', text:'Quick check'},
  {t:'grid', cols:3, gap:'22px 20px', style:'flex:1;grid-auto-rows:1fr;padding-bottom:8px', items:[
    [{t:'note', kind:'def', head:'Bits a symbol', html:'A set of $M=32$ signals. Each symbol carries',
      ask:{key:'m4-qc0', choices:['$3$ bits','$5$ bits','$32$ bits'], answer:1,
        why:'$\\log_232=5$.'}}],
    [{t:'note', kind:'def', head:'Noise variance', html:'$N_0=0.4$. Each correlator output has noise variance',
      ask:{key:'m4-qc1', choices:['$0.2$','$0.4$','$0.8$'], answer:0,
        why:'$N_0/2=0.2$.'}}],
    [{t:'note', kind:'def', head:'Nearest point', html:'$\\mathbf r=(0.2,0.9)$, with $(0,1)$ and $(1,0)$ equally likely. The receiver picks',
      ask:{key:'m4-qc2', choices:['$(0,1)$','$(1,0)$','either'], answer:0,
        why:'Squared distances $0.05$ and $1.45$; the smaller wins.'}}],
    [{t:'note', kind:'def', head:'Priors', html:'$P(\\mathbf s_1)$ rises. The boundary between $\\mathbf s_1$ and $\\mathbf s_2$ moves',
      ask:{key:'m4-qc3', choices:['toward $\\mathbf s_1$','away from $\\mathbf s_1$','nowhere'], answer:1,
        why:'A likely point gets a larger region, so the line moves toward $\\mathbf s_2$.'}}],
    [{t:'note', kind:'def', head:'Binary error', html:'Two equally likely points, $d=2$ and $N_0=2$. $P_e$ is',
      ask:{key:'m4-qc4', choices:['$Q(1)$','$Q(\\sqrt2)$','$Q(2)$'], answer:0,
        why:'$d^{2}/2N_0=4/4=1$, so $Q(1)$.'}}],
    [{t:'note', kind:'def', head:'Union bound', html:'A set of $M=8$ points. For one sent point, the general bound has',
      ask:{key:'m4-qc5', choices:['$7$ terms','$8$ terms','$28$ terms'], answer:0,
        why:'One term for each other point, $M-1=7$.'}}]
  ]}
]},

{ id:'m4-synth', module:'M4', nav:'Summary', title:'Module 4 summary',
  objective:'Collect the results this module contributes to the rest of the course.',
  keywords:'summary correlator matched filter sufficient statistics map ml minimum distance correlation metric regions binary error union bound nearest neighbour recall',
  dark:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 4 · Summary'},
  {t:'title', text:'Module 4 summary'},
  /* Twelve results as prompts, in the order of the module: the student answers
     each one aloud, then opens the card. */
  {t:'raw', html:()=>RECALL.deck('m4', [
    {q:'How many bits does one of $M$ waveforms carry?', glyph:G.mary,
     a:'$k=\\log_2M$, so $R_b=kR_s$ and $T_b=T/k$.'},
    {q:'What does the correlator bank give?', glyph:G.obs,
     a:'$\\mathbf r=\\mathbf s_i+\\mathbf n$, with $r_j=\\int_0^{T}r(t)\\,\\psi_j(t)\\,dt$.'},
    {q:'When does a matched filter give the same number?', glyph:G.mf,
     a:'At the sampling time $t=T$. Its impulse response is $\\psi_j(T-t)$.'},
    {q:'Why can the noise outside the signal space be dropped?', glyph:G.irr,
     a:'It does not depend on the signal and adds the same $\\|n\'\\|^{2}$ to every distance.'},
    {q:'What are the noise components?', glyph:G.noise,
     a:'Independent Gaussians with mean $0$ and variance $N_0/2$. The cloud is round.'},
    {q:'What does MAP maximise?', glyph:G.map,
     a:'$P(\\mathbf s_i)\\,f(\\mathbf r\\mid\\mathbf s_i)$. With equal priors it is ML.'},
    {q:'What is ML in Gaussian noise?', glyph:G.dist,
     a:'Minimum distance. MAP subtracts $N_0\\ln P(\\mathbf s_i)$ from each squared distance.'},
    {q:'What is the correlation metric?', glyph:G.metric,
     a:'$\\mathbf r\\cdot\\mathbf s_i-E_i/2+\\frac{N_0}{2}\\ln P(\\mathbf s_i)$. Keep the largest.'},
    {q:'What shape are the decision regions?', glyph:G.regions,
     a:'Convex polygons cut by bisectors. Unequal priors shift each line toward the less likely point.'},
    {q:'What is the binary error probability?', glyph:G.binary,
     a:'$Q\\bigl(\\sqrt{d^{2}/2N_0}\\bigr)$ for equal priors.'},
    {q:'What is the union bound?', glyph:G.union,
     a:'$P_e\\le\\frac1M\\sum_i\\sum_{j\\ne i}Q\\bigl(\\sqrt{d_{ij}^{2}/2N_0}\\bigr)$. The intelligent bound keeps only faces.'},
    {q:'What is the nearest-neighbour form?', glyph:G.nn,
     a:'$\\bar N_{\\min}Q\\bigl(\\sqrt{d_{\\min}^{2}/2N_0}\\bigr)$. Close at high SNR, but not a bound.'}
  ], {cols:2})},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Method', html:'<span style="color:var(--graphite)">Correlate to get $\\mathbf r$, pick the best metric, and bound $P_e$ from the distances. Module 5 uses this receiver for every modulation.</span>'}]}
]},

/* Four optional projects for students who want to try the module on their own
   computer. They carry no grade and no code: each card gives an aim, what it
   practises, a few steps and what to look for. The briefs state no numerical
   answer, so they need no line in verify/. */
{ id:'m4-projects', module:'M4', nav:'Projects to try', title:'Projects to try',
  objective:'Offer four optional projects that use the module on simulated signals.',
  keywords:'projects matlab python correlation receiver simulation map versus ml decision regions grid union bound tightness',
  dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · Projects'},
  {t:'title', text:'Projects to try'},
  {t:'raw', html:()=>PROJECTS.deck('m4', [
    {title:'A correlation receiver from samples', glyph:G.obs,
     aim:'Build the whole receiver for QPSK from sampled waveforms and measure how often it is wrong.',
     learn:['Correlators computed as sums over samples.',
            'Scaling noise to a chosen $N_0$.',
            'Counting errors to estimate $P_e$.'],
     steps:['Build two carrier basis functions over one symbol at $100$ samples.',
            'Send random QPSK symbols and add Gaussian noise of variance $N_0/2$ to each sample, scaled for the sample spacing.',
            'Correlate, pick the nearest point and count the errors.',
            'Repeat at several $N_0$ and plot $P_e$ on a log axis.'],
     look:'The measured points follow $2Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ once enough errors are counted.'},
    {title:'MAP against ML', glyph:G.map,
     aim:'See how much a receiver gains by knowing the priors.',
     learn:['The MAP threshold for a binary link.',
            'Why the gain grows as the priors become uneven.',
            'What happens when the assumed priors are wrong.'],
     steps:['Send antipodal bits with $P(s_1)=p$ for several $p$ from $0.5$ to $0.95$.',
            'Decide each with the midpoint and with the MAP threshold.',
            'Plot both error rates against $p$.',
            'Decide with a threshold built for the wrong $p$.'],
     look:'The two receivers agree at $p=0.5$. The MAP receiver pulls ahead as $p$ grows, and a wrong prior can do worse than ML.'},
    {title:'Decision regions on a grid', glyph:G.regions,
     aim:'Draw the regions of any constellation by deciding every point of a fine grid.',
     learn:['Minimum distance as a rule you can run anywhere.',
            'How priors move the boundaries.',
            'Why the regions are convex polygons.'],
     steps:['Pick a constellation of five to eight points.',
            'Decide every point of a $400\\times400$ grid and colour it by the answer.',
            'Give one point a larger prior and redraw.',
            'Compare the boundaries with the perpendicular bisectors.'],
     look:'Every boundary is a straight line. A larger prior pushes its point\'s boundaries outward, parallel to themselves.'},
    {title:'Tightness of the union bound', glyph:G.tight,
     aim:'Compare the union bound and its variants with a simulation across SNR.',
     learn:['The general and intelligent union bounds.',
            'The nearest-neighbour form.',
            'Where each is close to the truth.'],
     steps:['Take 8-PSK and 16-QAM at unit average energy.',
            'Compute every bound from the pairwise distances.',
            'Simulate at SNR from $0$ to $20$ dB.',
            'Plot all on one log axis and read the gap at each SNR.'],
     look:'At low SNR the general bound can pass $1$. At high SNR all the curves close in on the simulation.'}
  ])}
]}

];

window.SCENES_M4 = SC;
})();
