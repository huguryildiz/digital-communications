/* Course notes — Chapter 4.

   The chapter follows the Module 4 slides section by section and slide by
   slide. Each figure is the slide's figure, drawn from the same data with the
   same labels and colours, at one representative state and at the width of a
   printed page: a figure played in frames is drawn at its last frame, and a
   slider at the value the caption names. */
(function(){
const P=PLOT, C=P.COL;
const W=640;

const SZ = o => Object.assign({w:W,h:240,pad:{l:56,r:26,t:22,b:42}}, o);
const clamp01 = x => Math.max(0, Math.min(1, x));
const f2 = v => v.toFixed(2);
/* a number for a figure label: d decimals, and never "-0.00" */
const num = (v, d=2) => { const s = v.toFixed(d); return /^-0\.0*$/.test(s) ? s.slice(1) : s; };
/* a small probability as TeX, 2.70\times10^{-3} */
const sci = (v, d=2) => { if(!(v > 0)) return '0'; const e = Math.floor(Math.log10(v)), m = v/Math.pow(10, e);
  return e >= -1 ? num(v, 3) : m.toFixed(d)+'\\times10^{'+e+'}'; };
const rgba = (hex, al) => { const h = hex.replace('#','');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${al})`; };

/* Q(x) through erfc, with a fractional error below 1.2e-7, so a curve on a
   logarithmic axis keeps its shape. */
function erfc(x){ const z=Math.abs(x), t=1/(1+0.5*z);
  const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+
    t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x>=0?r:2-r; }
const Qf = x => 0.5*erfc(x/Math.SQRT2);
const gpdf = (x,m,s2) => Math.exp(-(x-m)*(x-m)/(2*s2))/Math.sqrt(2*Math.PI*s2);
/* Seeded noise, the same draws the slides use. */
function rng(s){let a=s>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function gauss(s,n,sd){const r=rng(s),o=[];for(let i=0;i<n;i++){const u=Math.max(1e-12,r()),v=r();
  o.push(sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v));}return o;}

/* Panels stacked into one figure. Each nested panel is sized by an inline
   style, which wins over the page rule that makes every figure svg full width. */
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" style="width:${w}px;height:${h}px" `);
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };
const row = (h, parts) => { let x = 0, s = '';
  parts.forEach(([svg, w]) => { s += place(svg, x, 0, w, h); x += w; });
  return `<svg viewBox="0 0 ${x} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };

/* A piecewise-constant waveform as [start, end, value] pieces, and its outline
   with the vertical edges drawn. */
function outline(segs, lo, hi){
  const pts = [[lo,0]]; let x = lo, y = 0;
  segs.forEach(([a,b,v])=>{
    if(a > x + 1e-12){ if(y!==0) pts.push([x,0]); pts.push([a,0]); }
    pts.push([a,v],[b,v]); x = b; y = v; });
  pts.push([x,0],[hi,0]);
  return pts;
}

/* Drawing helpers in data coordinates. */
function arrow(a, x0,y0,x1,y1, o={}){
  const X0=a.sx(x0), Y0=a.sy(y0), X1=a.sx(x1), Y1=a.sy(y1), L=Math.hypot(X1-X0,Y1-Y0);
  if(L < 3) return;
  const ux=(X1-X0)/L, uy=(Y1-Y0)/L, hd=12*(o.head||1), col=o.color||C.in;
  a.raw(`<line x1="${f2(X0)}" y1="${f2(Y0)}" x2="${f2(X1-hd*0.8*ux)}" y2="${f2(Y1-hd*0.8*uy)}" stroke="${col}" stroke-width="${o.width||2.6}" stroke-linecap="round"/>`
    + `<path d="M${f2(X1)},${f2(Y1)} L${f2(X1-hd*ux-hd*0.42*uy)},${f2(Y1-hd*uy+hd*0.42*ux)} L${f2(X1-hd*ux+hd*0.42*uy)},${f2(Y1-hd*uy-hd*0.42*ux)} Z" fill="${col}"/>`);
}
function seg(a, pts, o={}){
  if(pts.length < 2) return;
  const d = 'M'+pts.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L');
  a.raw(`<path d="${d}" fill="none" stroke="${o.color||C.muted}" stroke-width="${o.width||1.4}" stroke-linejoin="round" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function dot(a, x, y, o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||6}" fill="${o.color||C.in}" stroke="#FFFFFF" stroke-width="1.4"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function ring(a, x, y, o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||13}" fill="none" stroke="${o.color||C.out}" stroke-width="${o.width||2.6}"/>`);
}
/* A circle, drawn only where it lies inside the data area. */
const circle = (a, r, o={}) => { const c = o.c || [0,0], [xa,xb] = a.o.xr, [ya,yb] = a.o.yr;
  const inBox = p => p[0]>=xa && p[0]<=xb && p[1]>=ya && p[1]<=yb;
  let run = [];
  const flush = () => { if(run.length > 1) seg(a, run, Object.assign({color:C.muted, width:1.2, dash:'4 5'}, o)); run = []; };
  for(let i=0;i<=240;i++){ const u=2*Math.PI*i/240, p = [c[0]+r*Math.cos(u), c[1]+r*Math.sin(u)];
    if(inBox(p)) run.push(p); else flush(); }
  flush(); };
/* Noise draws: small dots in the hairline tone. */
function cloud(a, xs, ys, n, o={}){
  let s = ''; const col = o.color || C.noise, r = o.r || 2.1;
  for(let i=0;i<n;i++) s += `<circle cx="${f2(a.sx(xs(i)))}" cy="${f2(a.sy(ys(i)))}" r="${r}" fill="${col}" stroke="${col}" stroke-width="0.6"/>`;
  a.raw(s);
}
/* A filled area under f between lo and hi, as a translucent wash. */
function wash(a, f, lo, hi, col, al){
  lo = Math.max(lo, a.o.xr[0]); hi = Math.min(hi, a.o.xr[1]);
  if(hi <= lo) return;
  const n = 200, pts = [];
  for(let i=0;i<=n;i++){ const t=lo+(hi-lo)*i/n; pts.push(f2(a.sx(t))+','+f2(a.sy(Math.min(f(t), a.o.yr[1])))); }
  a.raw(`<path d="M${f2(a.sx(lo))},${f2(a.sy(0))}L${pts.join('L')}L${f2(a.sx(hi))},${f2(a.sy(0))}Z" fill="${rgba(col, al==null?0.3:al)}" stroke="none"/>`);
}
const lbl = (a, x, y, s, col, anchor, fs) => a.note(x, y, s, {tex:true, fs:fs||14, color:col||C.ink, anchor:anchor||'start'});

/* Tick numbers of a time axis under the lower edge of the data area, where no
   step of a waveform can cross them. */
function bottomTicks(a, vals){
  const L = P.labelScale();
  vals.forEach(v=>{ const X = f2(a.sx(v));
    a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${a.y0+5}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${X}" y="${f2(a.y0+19*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="middle">${v}</text>`); });
  return a;
}
const TAx = o => { const xt = o.xt; const a = P.Axes(Object.assign({}, o, {xticksOverride:[]})); return xt ? bottomTicks(a, xt) : a; };
/* Tick numbers of the dependent axis at the left edge of the data area, with
   their grid lines, so that a threshold drawn near r = 0 never crosses them.
   An axes that takes these passes yticksOverride:[]. */
function leftTicks(a, vals){
  const L = P.labelScale();
  vals.forEach(v=>{ const Y = a.sy(v);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x1}" y2="${f2(Y)}" stroke="${C.grid}" stroke-width="1"/>`);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x0-5}" y2="${f2(Y)}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${a.x0-10}" y="${f2(Y+4.5)}" font-size="${13*L}" fill="${C.muted}" text-anchor="end">${v}</text>`); });
  return a;
}
const LAx = o => { const yt = o.yt; return leftTicks(P.Axes(Object.assign({}, o, {yticksOverride:[]})), yt || []); };
const bare = o => Object.assign({xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}, o);

/* A signal-space plane drawn to one scale on both axes. `need` is the smallest
   range each axis must show; the other range is widened to fill the box. */
function plane(o){
  const base = Object.assign({w:W, h:290, pad:{l:56,r:26,t:24,b:42}, xlabel:'\\psi_1', ylabel:'\\psi_2'}, o);
  delete base.need;
  const [nx, ny] = o.need;
  const pr = P.Axes(Object.assign({}, base, {xr:nx, yr:ny}));
  const k = Math.min((pr.x1-pr.x0)/(nx[1]-nx[0]), (pr.y0-pr.y1)/(ny[1]-ny[0]));
  const cx = (nx[0]+nx[1])/2, cy = (ny[0]+ny[1])/2;
  const hx = (pr.x1-pr.x0)/k/2, hy = (pr.y0-pr.y1)/k/2;
  return P.Axes(Object.assign({}, base, {xr:[cx-hx,cx+hx], yr:[cy-hy,cy+hy]}));
}

/* Decision regions: the visible box clipped by one half-plane for every other
   point. With unequal priors the metric is |r - s_i|^2 - N0 ln P(s_i), and the
   boundaries are still straight lines, so the same clipping draws the MAP
   regions. */
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
function inside(poly, p, eps){
  let sgn = 0;
  for(let k=0;k<poly.length;k++){ const A = poly[k], B = poly[(k+1)%poly.length];
    const cr = (B[0]-A[0])*(p[1]-A[1]) - (B[1]-A[1])*(p[0]-A[0]);
    if(Math.abs(cr) < (eps||1e-9)*Math.hypot(B[0]-A[0], B[1]-A[1])) continue;
    const s = Math.sign(cr); if(!sgn) sgn = s; else if(s !== sgn) return false; }
  return true;
}
/* Fill each region and draw each edge between two regions once. */
function drawCells(a, pts, o={}){
  const box = [a.o.xr[0], a.o.xr[1], a.o.yr[0], a.o.yr[1]];
  const cs = cells(pts, box, o.bias), fills = o.fills || REGCOL();
  cs.forEach((poly,i)=>fillPoly(a, poly, fills[i % fills.length]));
  const onBox = (p,q) => [0,1].some(k => Math.abs(p[0]-q[0])<1e-9 && Math.abs(p[0]-box[k])<1e-9)
                      || [2,3].some(k => Math.abs(p[1]-q[1])<1e-9 && Math.abs(p[1]-box[k])<1e-9);
  cs.forEach((poly,i)=>{ for(let k=0;k<poly.length;k++){ const p = poly[k], q = poly[(k+1)%poly.length];
    if(onBox(p,q)) continue;
    const mid = [(p[0]+q[0])/2, (p[1]+q[1])/2];
    const owner = cs.findIndex((c,j)=>j!==i && c.length > 2 && inside(c, mid, 1e-7));
    if(owner >= 0 && owner < i) continue;
    seg(a, [p,q], {color:o.lineCol||C.muted, width:o.lineW||1.3, dash:o.dash}); } });
  return cs;
}
const dots = (a, pts, o={}) => pts.forEach((p,i)=>a.point(p[0], p[1], {color:(o.cols||PTCOL())[i % 5], r:o.r||6.5}));

const QPSK = [[1,1],[-1,1],[-1,-1],[1,-1]];
const FIVE = a => [[0,0],[a,a],[-a,a],[-a,-a],[a,-a]];
const d2 = (p, q) => (p[0]-q[0])*(p[0]-q[0]) + (p[1]-q[1])*(p[1]-q[1]);

/* ---- 4.1 the observation ------------------------------------------------ */

/* Twelve bits read in blocks of k = 2: each block picks one of four levels
   for T = 2 T_b. */
const BITS = [1,0,1,1,0,0,1,0,1,1,1,0];
const blockVal = (k, j) => BITS.slice(j*k, (j+1)*k).reduce((s,b)=>2*s+b, 0);
function figMary(){
  const k = 2, M = 4, H = 300, hTop = Math.round(H/3);
  const a = P.Axes(bare({w:W, h:hTop, xr:[-0.3,12.3], yr:[-1.35,1.55], pad:{l:56,r:26,t:8,b:6}}));
  lbl(a, 6, 1.1, '\\text{blocks of }k=2:\\ M=4,\\ T=2T_b', C.ink, 'middle');
  BITS.forEach((b,n)=>lbl(a, n+0.5, 0.3, String(b), C.ink, 'middle', 16));
  for(let j=0;j<12/k;j++){ const x0 = j*k+0.1, x1 = (j+1)*k-0.1;
    seg(a, [[x0,-0.05],[x0,-0.25],[x1,-0.25],[x1,-0.05]], {color:C.mid, width:1.8});
    lbl(a, (x0+x1)/2, -0.85, String(blockVal(k,j)), C.mid, 'middle'); }
  const b = TAx({w:W, h:H-hTop, xr:[-0.3,12.3], yr:[-1.45,1.45], xlabel:'t/T_b', ylabel:'s(t)',
    pad:{l:56,r:26,t:24,b:36}, xt:[0,2,4,6,8,10], yticksOverride:[-1,0,1]});
  const sg = []; for(let j=0;j<12/k;j++) sg.push([j*k, (j+1)*k, (2*blockVal(k,j)-(M-1))/(M-1)]);
  seg(b, outline(sg,-0.3,12.3), {color:C.in, width:2.4});
  return stack(W, [[a.svg(),hTop],[b.svg(),H-hTop]]);
}

/* A received waveform on two carrier basis functions over T = 1:
   psi1 = sqrt2 cos(4 pi t), psi2 = sqrt2 sin(4 pi t), s = psi1 - 0.6 psi2,
   plus one fixed draw of smoothed noise, and its two running integrals. */
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
function figObserve(){
  const ha = 100, hb = 130, hc = 250;
  const a = TAx({w:W, h:ha, xr:[-0.03,1.13], yr:[-6.5,6.5], xlabel:'', ylabel:'r(t)',
    pad:{l:56,r:26,t:18,b:10}, yticksOverride:[-5,0,5]});
  seg(a, OB.t.map((x,i)=>[x, OB.r[i]]), {color:C.out, width:1.4});
  seg(a, OB.t.map((x,i)=>[x, OB.sv[i]]), {color:C.in, width:2.2});
  const b = TAx({w:W, h:hb, xr:[-0.03,1.13], yr:[-1.2,1.55], xlabel:'t/T', xnameDrop:34, ylabel:'c_1(t),\\;c_2(t)',
    pad:{l:56,r:26,t:18,b:34}, xt:[0,0.5,1], yticksOverride:[-1,0,1]});
  seg(b, OB.t.map((x,i)=>[x, OB.c1[i]]), {color:C.mid, width:2.4});
  seg(b, OB.t.map((x,i)=>[x, OB.c2[i]]), {color:C.mid, width:2.4, dash:'7 5'});
  dot(b, 1, OB.rv[0], {color:C.mid, r:5.5}); dot(b, 1, OB.rv[1], {color:C.mid, r:5.5});
  lbl(b, 1.04, OB.rv[0]-0.08, 'r_1', C.mid); lbl(b, 1.04, OB.rv[1]-0.08, 'r_2', C.mid);
  const c = plane({h:hc, need:[[-1.9,1.9],[-1.25,1.05]], pad:{l:170,r:170,t:24,b:42}, xticksOverride:[], yticksOverride:[]});
  dot(c, OB.s[0], OB.s[1], {color:C.in, r:6.5});
  lbl(c, OB.s[0]+0.12, OB.s[1]-0.36, '\\mathbf{s}_i', C.in);
  const [x,y] = OB.rv;
  seg(c, [[x,0],[x,y],[0,y]], {color:C.mid, width:1.3, dash:'4 5'});
  seg(c, [OB.s,[x,y]], {color:C.muted, width:1.6});
  dot(c, x, y, {color:C.out, r:6.5});
  lbl(c, x+0.14, y+0.1, '\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}', C.out);
  return stack(W, [[a.svg(),ha],[b.svg(),hb],[c.svg(),hc]]);
}

/* The filter matched to psi(t) = sqrt3 t on [0,1] and the correlator, both fed
   r(t) = 1.5 psi(t). They agree at t = T only. */
const mfY = t => t <= 0 ? 0 : t <= 1 ? 4.5*(t*t/2 - t*t*t/6) : t <= 2 ? 4.5*(1/3 - (t-1)/2 + Math.pow(t-1,3)/6) : 0;
const mfC = t => t <= 0 ? 0 : t <= 1 ? 1.5*t*t*t : 1.5;
function figMfbank(){
  const t0 = 1;
  const a = P.Axes(SZ({xr:[-0.08,2.15], yr:[-0.15,2.05], xlabel:'t/T', ylabel:'y(t),\\;c(t)', xticksOverride:[0,0.5,1,1.5,2], yticksOverride:[0,0.5,1,1.5]}));
  a.curve(mfC, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(mfY, {color:C.mid, width:2.6});
  a.vline(t0, {color:C.ink, dash:'5 4', width:1.4});
  dot(a, t0, mfY(t0), {color:C.mid, r:6});
  lbl(a, 1.1, 1.86, 'y(T)='+num(mfY(t0))+',\\ \\ c(T)='+num(mfC(t0)), C.ink);
  return a.svg();
}

/* The received waveform in three dimensions: the signal plane, spanned by
   psi1 and psi2, and one direction outside it. */
function figIrrelevant(){
  const az = 32*Math.PI/180, el = 24*Math.PI/180;
  const Pp = (x,y,z) => [x*Math.cos(az) - y*Math.sin(az), z*Math.cos(el) + (x*Math.sin(az) + y*Math.cos(az))*Math.sin(el)];
  const a = plane(bare({h:330, need:[[-2.2,2.3],[-1.35,2.0]], xlabel:'', ylabel:''}));
  const sheet = [[-1.9,-1.5,0],[1.9,-1.5,0],[1.9,1.5,0],[-1.9,1.5,0]].map(p=>Pp(...p));
  fillPoly(a, sheet, C.dec.h);
  seg(a, sheet.concat([sheet[0]]), {color:C.h, width:1.2, opacity:0.7});
  const ax = (p, q, name, lp, col) => { const A = Pp(...p), B = Pp(...q);
    arrow(a, A[0],A[1],B[0],B[1], {color:col, width:1.8, head:0.8});
    const L = Pp(...lp); lbl(a, L[0], L[1], name, col, 'middle', 15); };
  ax([0,0,0],[2.05,0,0], '\\psi_1', [2.3,0,-0.08], C.h);
  ax([0,0,0],[0,1.75,0], '\\psi_2', [0,2.02,-0.02], C.h);
  ax([0,0,0],[0,0,1.6], '\\text{outside}', [0,0,1.78], C.muted);
  const s1 = [1.0,-0.55,0], s2 = [-1.05,0.55,0], n = [0.4,0.45,1.05];
  const rt = [s1[0]+n[0], s1[1]+n[1], n[2]], rp = [rt[0], rt[1], 0];
  const S1 = Pp(...s1), S2 = Pp(...s2), RT = Pp(...rt), RP = Pp(...rp);
  seg(a, [RT,S2], {color:C.muted, width:1.3, dash:'5 4'});
  seg(a, [RP,S2], {color:C.mid, width:2.0});
  seg(a, [RT,S1], {color:C.muted, width:1.3, dash:'5 4'});
  arrow(a, S1[0],S1[1],RP[0],RP[1], {color:C.mid, width:2.4});
  seg(a, [RP,RT], {color:C.muted, width:1.8, dash:'5 4'});
  lbl(a, (RP[0]+RT[0])/2+0.1, (RP[1]+RT[1])/2, "n'", C.muted, 'start', 15);
  dot(a, S1[0], S1[1], {color:C.in, r:6.5}); dot(a, S2[0], S2[1], {color:C.in, r:6.5});
  lbl(a, S1[0]+0.12, S1[1]-0.22, '\\mathbf{s}_1', C.in); lbl(a, S2[0]-0.12, S2[1]-0.22, '\\mathbf{s}_2', C.in, 'end');
  dot(a, RT[0], RT[1], {color:C.out, r:6.5, opacity:0.35});
  lbl(a, RT[0]+0.14, RT[1]+0.04, '\\tilde{\\mathbf{r}}', C.out, 'start', 15);
  dot(a, RP[0], RP[1], {color:C.out, r:6.5});
  lbl(a, RP[0]+0.16, RP[1]-0.2, '\\mathbf{r}', C.out, 'start', 15);
  lbl(a, -3.4, 1.8, "\\|\\tilde{\\mathbf{r}}-\\mathbf{s}_j\\|^{2}=\\|\\mathbf{r}-\\mathbf{s}_j\\|^{2}+\\|n'\\|^{2}", C.ink);
  return a.svg();
}

/* Two noise components with variance 1 and correlation coefficient rho, from
   one fixed draw. Contours at one and two standard deviations. */
const ZN = gauss(4402, 1200, 1);
function figNoise(rho){
  const q = Math.sqrt(1-rho*rho);
  const a = plane({w:330, h:300, need:[[-3.3,3.3],[-3.1,3.1]], xlabel:'n_1', ylabel:'n_2', pad:{l:46,r:20,t:22,b:40}, xticksOverride:[], yticksOverride:[]});
  cloud(a, i=>ZN[2*i], i=>rho*ZN[2*i]+q*ZN[2*i+1], 600, {r:1.8});
  [1,2].forEach(k=>{ const pts=[]; for(let i=0;i<=180;i++){ const u=2*Math.PI*i/180;
      pts.push([k*Math.cos(u), k*(rho*Math.cos(u)+q*Math.sin(u))]); }
    seg(a, pts, {color:C.mid, width:2.0, dash:k===2?'6 5':null}); });
  lbl(a, -3.1, 2.75, '\\rho='+num(rho, 1), C.mid);
  return a.svg();
}

/* Four-level PAM on a unit-energy pulse, N0 = 0.1. */
const PAM4 = [-1.5,-0.5,0.5,1.5];
function figPam4(){
  const N0 = 0.1;
  const a = LAx(SZ({xr:[-2.7,2.7], yr:[0,2.2], xlabel:'r', ylabel:'f(r\\mid s_m)', xticksOverride:PAM4, yt:[1,2]}));
  PAM4.forEach(m=>a.curve(r=>Math.exp(-(r-m)*(r-m)/N0)/Math.sqrt(Math.PI*N0), {color:C.out, width:2.4, n:700}));
  PAM4.forEach(m=>a.point(m, 0, {color:C.in, r:6}));
  lbl(a, 2.62, 2.0, '\\sigma^{2}=N_0/2='+num(N0/2, 3), C.ink, 'end');
  return a.svg();
}

/* Four orthogonal signals of energy E = 4, N0 = 1, s1 sent: the density of
   each of the four correlator outputs. */
function figOrth(){
  const H = 400, hp = Math.floor((H-34)/4), parts = [];
  for(let k=0;k<4;k++){ const last = k===3, h = hp + (last ? 34 : 0), m = k === 0 ? 2 : 0;
    const a = leftTicks(TAx({w:W, h, xr:[-2.6,4.4], yr:[0,0.8], xlabel:last?'r_k':'', xnameDrop:34, ylabel:'f(r_'+(k+1)+'\\mid\\mathbf{s}_1)',
      pad:{l:56,r:26,t:24,b:last?36:10}, xt:last?[-2,0,2,4]:null, yticksOverride:[]}), [0.5]);
    seg(a, Array.from({length:301},(_,i)=>{ const r = -2.6+7*i/300; return [r, Math.exp(-(r-m)*(r-m))/Math.sqrt(Math.PI)]; }), {color:C.out, width:2.4});
    dot(a, m, 0, {color:C.in, r:5.5});
    parts.push([a.svg(), h]); }
  return stack(W, parts);
}

/* ---- 4.2 the decision rule ---------------------------------------------- */

/* The two weighted likelihoods P(s_i) f(r | s_i), s1 = +1, s2 = -1, N0 = 1. */
function figMap(){
  const p = 0.7, tau = 0.25*Math.log((1-p)/p);
  const a = LAx(SZ({xr:[-3.2,3.2], yr:[0,0.74], xlabel:'r', ylabel:'P(s_i)\\,f(r\\mid s_i)',
    xticksOverride:[-2,-1,0,1,2], yt:[0.2,0.4]}));
  const w1 = r => p*gpdf(r,1,0.5), w2 = r => (1-p)*gpdf(r,-1,0.5);
  a.curve(w2, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(w1, {color:C.mid, width:2.6});
  a.vline(tau, {color:C.ink, dash:'6 4', width:1.6});
  dot(a, tau, w1(tau), {color:C.mid, r:5.5});
  lbl(a, tau-0.1, 0.66, '\\tau='+num(tau), C.ink, 'end');
  a.point(1, 0, {color:C.in, r:6}); a.point(-1, 0, {color:C.in, r:6});
  return a.svg();
}

/* r = (0.5, 0.3) and its squared distance to each of the four points. */
const RQ = [0.5, 0.3];
function figMindist(){
  const a = plane({need:[[-2.25,2.25],[-1.8,1.8]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  const LP = [[1.14,1.3,'start'],[-1.14,1.3,'end'],[-1.14,-1.5,'end'],[1.14,-1.5,'start']];
  QPSK.forEach((p,k)=>{
    seg(a, [RQ,p], {color:k===0 ? C.out : C.mid, width:k===0 ? 3.4 : 2.2});
    lbl(a, LP[k][0], LP[k][1], 'D_'+(k+1)+'^{2}='+num(d2(RQ,p)), C.mid, LP[k][2]); });
  dots(a, QPSK, {cols:[C.in,C.in,C.in,C.in]});
  dot(a, RQ[0], RQ[1], {color:C.out, r:6.5});
  lbl(a, 0.7, 0.12, '\\mathbf{r}', C.out, 'start', 15);
  ring(a, 1, 1);
  return a.svg();
}

/* 4-PAM at s = -3, -1, 1, 3 and r = 1.6: the correlation r s_i alone (f = 0)
   and with the energy term taken off (f = 1). The largest is outlined green. */
const MS = [-3,-1,1,3], MR = 1.6;
function figMetric(f){
  const a = TAx({w:330, h:290, pad:{l:50,r:18,t:22,b:42}, xr:[-4.6,4.6], yr:[-11,6.8], xlabel:'s_i', ylabel:'m_i', xt:MS, yticksOverride:[-10,-5,0,5]});
  const vals = MS.map(s=>MR*s - f*s*s/2), best = vals.indexOf(Math.max(...vals));
  MS.forEach((s,i)=>{ const y = vals[i], w = 0.8, X0 = a.sx(s-w/2), X1 = a.sx(s+w/2), Y0 = a.sy(0), Y1 = a.sy(y);
    a.raw(`<rect x="${f2(X0)}" y="${f2(Math.min(Y0,Y1))}" width="${f2(X1-X0)}" height="${f2(Math.abs(Y1-Y0))}" fill="${rgba(C.mid,0.26)}" stroke="${i===best ? C.out : C.mid}" stroke-width="${i===best ? 3.2 : 1.6}"/>`);
    lbl(a, s, y >= 0 ? y+0.55 : y-1.5, num(y,1), i===best ? C.out : C.mid, 'middle'); });
  lbl(a, -4.4, 5.7, 'r=1.6', C.ink);
  return a.svg();
}

/* The two receiver structures as block diagrams, stacked. */
function recvI(){
  const it = [
    {t:'text',x:8,y:142,label:'r(t)',tex:true,fs:16,anchor:'start'},
    {t:'arrow',x1:8,y1:160,x2:52,y2:160}, {t:'line',d:'M52,85 V235'},
    {t:'text',x:183,y:172,label:'\\smash{\\vdots}',tex:true,fs:16},
    {t:'text',x:322,y:172,label:'\\smash{\\vdots}',tex:true,fs:16},
    {t:'box',x:356,y:40,w:204,h:240},
    {t:'text',x:458,y:132,label:'\\text{largest}',tex:true,fs:15},
    {t:'text',x:458,y:167,label:'\\mathbf{r}\\cdot\\mathbf{s}_i+a_i',tex:true,fs:15},
    {t:'text',x:458,y:202,label:'\\text{over }i=1,\\ldots,M',tex:true,fs:15},
    {t:'arrow',x1:560,y1:160,x2:626,y2:160}, {t:'text',x:594,y:144,label:'\\hat{s}',tex:true,fs:17}
  ];
  [[85,'1'],[235,'N']].forEach(([y,k])=>it.push({t:'arrow',x1:52,y1:y,x2:80,y2:y},
    {t:'box',x:80,y:y-30,w:210,h:60,label:'\\int_0^{T}(\\cdot)\\,\\psi_'+k+'(t)\\,dt',tex:true,fs:15},
    {t:'arrow',x1:290,y1:y,x2:356,y2:y}, {t:'text',x:323,y:y-12,label:'r_'+k,tex:true,fs:16}));
  return P.blocks({w:640, h:300, items:it});
}
function recvII(){
  const it = [
    {t:'text',x:8,y:142,label:'r(t)',tex:true,fs:16,anchor:'start'},
    {t:'arrow',x1:8,y1:160,x2:52,y2:160}, {t:'line',d:'M52,85 V235'},
    {t:'text',x:183,y:172,label:'\\smash{\\vdots}',tex:true,fs:16},
    {t:'box',x:430,y:40,w:130,h:240,label:'\\text{largest}',tex:true,fs:15},
    {t:'arrow',x1:560,y1:160,x2:626,y2:160}, {t:'text',x:594,y:144,label:'\\hat{s}',tex:true,fs:17}
  ];
  [[85,'1'],[235,'M']].forEach(([y,k])=>it.push({t:'arrow',x1:52,y1:y,x2:80,y2:y},
    {t:'box',x:80,y:y-30,w:210,h:60,label:'\\int_0^{T}(\\cdot)\\,s_'+k+'(t)\\,dt',tex:true,fs:15},
    {t:'arrow',x1:290,y1:y,x2:340,y2:y}, {t:'sum',x:354,y},
    {t:'arrow',x1:354,y1:y-58,x2:354,y2:y-16}, {t:'text',x:354,y:y-64,label:'a_'+k,tex:true,fs:16},
    {t:'arrow',x1:368,y1:y,x2:430,y2:y}));
  return P.blocks({w:640, h:300, items:it});
}
function figReceiver(){
  const w = 880, x = (w-640)/2;
  return `<svg viewBox="0 0 ${w} 620" xmlns="http://www.w3.org/2000/svg" role="img">${place(recvI(), x, 0, 640, 300)}${place(recvII(), x, 320, 640, 300)}</svg>`;
}

/* The error as an area: +-1 with P(s1) = 0.25 at +1, N0 = 0.5, shown at
   tau = 0.6. The lower panel is P_e(tau). */
const OPT = {p:0.25, ts:Math.log(3)/8};
const peTau = t => OPT.p*Qf((1-t)/0.5) + (1-OPT.p)*Qf((t+1)/0.5);
function figOptimal(){
  const tau = 0.6, H = 380, hb = Math.round(0.425*H), p = OPT.p;
  const w1 = r => p*gpdf(r,1,0.25), w2 = r => (1-p)*gpdf(r,-1,0.25);
  const a = LAx({w:W, h:H-hb, xr:[-2.6,2.6], yr:[0,0.7], xlabel:'', ylabel:'P(s_i)\\,f(r\\mid s_i)',
    pad:{l:56,r:26,t:22,b:12}, xticksOverride:[], yt:[0.2,0.4,0.6]});
  wash(a, w1, -2.6, tau, C.err, 0.3); wash(a, w2, tau, 2.6, C.err, 0.3);
  a.vline(OPT.ts, {color:C.muted, dash:'2 4', width:1.3});
  a.curve(w2, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(w1, {color:C.mid, width:2.6});
  a.vline(tau, {color:C.ink, dash:'6 4', width:1.6});
  lbl(a, tau+0.08, 0.62, '\\tau', C.ink);
  const b = LAx({w:W, h:hb, xr:[-2.6,2.6], yr:[0,0.85], xlabel:'r,\\;\\tau', ylabel:'P_e(\\tau)',
    pad:{l:56,r:26,t:22,b:42}, xticksOverride:[-2,-1,1,2], yt:[0.25,0.5,0.75]});
  b.vline(OPT.ts, {color:C.muted, dash:'2 4', width:1.3});
  b.curve(peTau, {color:C.err, width:2.4});
  dot(b, tau, peTau(tau), {color:C.err, r:6});
  lbl(b, 2.5, 0.62, 'P_e='+num(peTau(tau),4), C.err, 'end');
  lbl(b, OPT.ts+0.08, 0.72, '\\tau^{\\ast}', C.muted);
  return stack(W, [[a.svg(),H-hb],[b.svg(),hb]]);
}

/* Example 4.3: the threshold tau = ln(3)/8 and the two error areas. */
function figExMap(){
  const a = LAx(SZ({xr:[-2.6,2.6], yr:[0,0.7], xlabel:'r', ylabel:'P(s_i)\\,f(r\\mid s_i)',
    xticksOverride:[-2,-1,0,1,2], yt:[0.2,0.4,0.6]}));
  const w1 = r => 0.25*gpdf(r,1,0.25), w2 = r => 0.75*gpdf(r,-1,0.25), tau = Math.log(3)/8;
  wash(a, w1, -2.6, tau, C.err, 0.34); wash(a, w2, tau, 2.6, C.err, 0.34);
  a.curve(w2, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(w1, {color:C.mid, width:2.6});
  a.vline(tau, {color:C.ink, dash:'6 4', width:1.8});
  lbl(a, tau+0.1, 0.64, '\\tau=0.137', C.ink);
  a.point(1, 0, {color:C.in, r:6}); a.point(-1, 0, {color:C.in, r:6});
  return a.svg();
}

/* Example 4.4: four waveforms on [0,2) built from two unit pulses, their
   points, and the regions of the receiver with equal priors. */
const RX = [ {v:[2,0], segs:[[0,1,2]]}, {v:[1,1], segs:[[0,2,1]]},
             {v:[-1,1], segs:[[0,1,-1],[1,2,1]]}, {v:[-1,-1], segs:[[0,2,-1]]} ];
function figExReceiver(){
  const H = 440, h1 = Math.round(0.226*H), h2 = Math.round(0.286*H), hw = W/2;
  const small = k => { const lo = k > 1, a = TAx({w:hw, h:lo?h2:h1, xr:[-0.1,2.3], yr:[-1.5,2.5],
      xlabel:lo?'t':'', xnameDrop:30, ylabel:'s_'+(k+1)+'(t)', pad:{l:50,r:18,t:14,b:lo?34:10}, xt:lo?[0,1,2]:null, yticksOverride:[-1,2]});
    seg(a, outline([[0,1,1]],-0.1,2.3), {color:C.h, width:1.6, dash:'6 5'});
    seg(a, outline([[1,2,1]],-0.1,2.3), {color:C.h, width:1.6, dash:'2 4'});
    a.poly(outline(RX[k].segs,-0.1,2.3), {color:C.in, width:2.4});
    return a.svg(); };
  const b = plane({h:H-h1-h2, need:[[-1.9,2.7],[-1.55,1.45]], xticksOverride:[-1,1,2], yticksOverride:[1]});
  const pts = RX.map(r=>r.v);
  drawCells(b, pts);
  const LP = [[2.12,0.14,'start'],[1.12,1.14,'start'],[-1.12,1.14,'end'],[-1.12,-1.36,'end']];
  pts.forEach((p,k)=>{ dot(b, p[0], p[1], {color:PTCOL()[k], r:6.5});
    lbl(b, LP[k][0], LP[k][1], '\\mathbf{s}_'+(k+1), PTCOL()[k], LP[k][2]); });
  dot(b, 1.2, 0.3, {color:C.out, r:5});
  lbl(b, 1.34, 0.22, '\\mathbf{r}', C.out);
  return stack(W, [[row(h1, [[small(0),hw],[small(1),hw]]),h1],
                   [row(h2, [[small(2),hw],[small(3),hw]]),h2],[b.svg(),H-h1-h2]]);
}

/* ---- 4.3 decision regions ------------------------------------------------ */

/* Five points, the corners (+-1.2, +-1.2) and the centre, and their regions. */
function figRegions(){
  const pts = FIVE(1.2);
  const a = plane({need:[[-2.6,2.6],[-2.3,2.3]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  drawCells(a, pts, {lineW:2.0, lineCol:C.ink});
  dots(a, pts);
  return a.svg();
}

/* Three points, P(s3) = 0.6 and the other two 0.2 each, N0 = 1. The dashed
   lines are the equal-prior boundaries. */
const TRI = [[-1.2,-0.7],[1.2,-0.7],[0,1.2]];
function figRegionsPriors(){
  const p = 0.6, q = (1-p)/2, bias = [q,q,p].map(x=>Math.log(x));
  const a = plane({need:[[-2.5,2.5],[-2.15,2.25]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  drawCells(a, TRI, {bias, lineW:2.0, lineCol:C.ink});
  drawCells(a, TRI, {fills:['none'], lineW:1.3, lineCol:C.muted, dash:'4 5'});
  dots(a, TRI);
  lbl(a, -1.36, -1.05, '\\mathbf{s}_1', PTCOL()[0], 'end'); lbl(a, 1.36, -1.05, '\\mathbf{s}_2', PTCOL()[1]);
  lbl(a, 0.18, 1.5, '\\mathbf{s}_3', PTCOL()[2]);
  return a.svg();
}

/* Two equally likely points d = 2 apart, N0 = 1, and the tail past the
   midpoint. */
function figBinary(){
  const d = 2, h = d/2;
  const a = LAx(SZ({xr:[-3.6,3.6], yr:[0,0.8], xlabel:'\\text{position along the line from }\\mathbf{s}_0\\text{ to }\\mathbf{s}_1',
    ylabel:'f(r\\mid s_i)', xticksOverride:[-3,-2,-1,0,1,2,3], yt:[0.25,0.5]}));
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

/* Unequal priors, d = 2, N0 = 0.5, P(s1) = 0.9: the boundary a distance mu
   from s1, and both weighted tails. */
function figBinaryPriors(){
  const p = 0.9, d = 2, N0 = 0.5, sg = Math.sqrt(N0/2);
  const mu = d/2 + N0/(2*d)*Math.log(p/(1-p)), xb = d/2 - mu;
  const w0 = r => (1-p)*gpdf(r,-1,N0/2), w1 = r => p*gpdf(r,1,N0/2);
  const pe = (1-p)*Qf((d-mu)/sg) + p*Qf(mu/sg);
  const a = LAx(SZ({xr:[-2.8,2.8], yr:[0,0.95], xlabel:'r', ylabel:'P(s_i)\\,f(r\\mid s_i)',
    xticksOverride:[-2,-1,1,2], yt:[0.25,0.5,0.75]}));
  wash(a, w0, xb, 2.8, C.err, 0.3); wash(a, w1, -2.8, xb, C.err, 0.3);
  a.curve(w0, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(w1, {color:C.mid, width:2.6});
  a.vline(xb, {color:C.ink, dash:'6 4', width:1.6});
  a.point(-1, 0, {color:C.in, r:6}); a.point(1, 0, {color:C.in, r:6});
  a.span(xb, 1, 0.84, '\\mu', {tex:true, color:C.ink});
  lbl(a, -2.7, 0.84, 'P_e='+num(pe,4), C.err);
  return a.svg();
}

/* ---- 4.4 error probability and the union bound --------------------------- */

/* The centre of the five-point set sent with sigma = 0.4, 1000 draws, those
   outside |r1| + |r2| < 1.2 in red. */
const ZP = gauss(4404, 2000, 1);
function figPe(){
  const n = 1000, pts = FIVE(1.2);
  const a = plane({need:[[-2.6,2.6],[-2.3,2.3]], xticksOverride:[], yticksOverride:[]});
  drawCells(a, pts);
  let s = '', k = 0;
  for(let i=0;i<n;i++){ const x = 0.4*ZP[2*i], y = 0.4*ZP[2*i+1], out = Math.abs(x)+Math.abs(y) > 1.2;
    if(out) k++;
    const col = out ? C.err : C.noise;
    s += `<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${out?3:2.2}" fill="${col}" stroke="${col}" stroke-width="0.6"/>`; }
  a.raw(s);
  dots(a, pts);
  lbl(a, a.o.xr[0]+0.2, 2.02, '\\text{outside: }'+k+'/'+n+'='+num(k/n,3), C.err);
  return a.svg();
}

/* The union bound for s1 = (1,1) of the square: the three pairwise
   half-planes and the parts of the plane the sum counts two or three times. */
const ZO = gauss(20260924, 600, 1);
function figUnion(){
  const a = plane({need:[[-2.35,2.35],[-2.15,2.15]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  const X = a.o.xr, Y = a.o.yr, full = [[X[0],Y[0]],[X[1],Y[0]],[X[1],Y[1]],[X[0],Y[1]]];
  cloud(a, i=>1+0.5*ZO[2*i], i=>1+0.5*ZO[2*i+1], 260);
  [clipHalf(full,1,0,0), clipHalf(full,1,1,0), clipHalf(full,0,1,0)].forEach(poly=>fillPoly(a, poly, rgba(C.err, 0.14)));
  seg(a, [[0,Y[0]],[0,Y[1]]], {color:C.err, width:1.6, dash:'6 4'});
  seg(a, [[Math.max(X[0],-Y[1]),-Math.max(X[0],-Y[1])],[Math.min(X[1],-Y[0]),-Math.min(X[1],-Y[0])]], {color:C.err, width:1.6, dash:'6 4'});
  seg(a, [[X[0],0],[X[1],0]], {color:C.err, width:1.6, dash:'6 4'});
  dots(a, QPSK);
  lbl(a, 1.14, 1.3, '\\mathbf{s}_1', C.in);
  lbl(a, -0.55, 1.78, 'A_{12}', C.err, 'end'); lbl(a, -0.3, -1.98, 'A_{13}', C.err, 'end'); lbl(a, 1.8, -0.55, 'A_{14}', C.err);
  lbl(a, -1.95, -1.25, '3\\times', C.err); lbl(a, -2.0, 0.95, '2\\times', C.err); lbl(a, 0.3, -1.62, '2\\times', C.err);
  return a.svg();
}

/* 8-PSK: the sum of the seven pairwise terms and 7 Q(sqrt(2 Es/N0) sin(pi/8)). */
const dB = db => Math.pow(10, db/10);
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

/* Q(x) and its exponential bound on a logarithmic axis, marked at x = 3. */
function figChernoff(){
  const x0 = 3, B = x => 0.5*Math.exp(-x*x/2);
  const a = TAx(SZ({xt:[0,1,2,3,4,5], xr:[0,5.2], yr:[-7,0.3], xlabel:'x', ylabel:'Q(x),\\;\\tfrac12e^{-x^{2}/2}', ytickfmt:P.decade,
    yticksOverride:P.decades(-7,0), zeroAxes:false})); LGF = a.o.yr[0];
  a.curve(x=>Math.log10(B(x)), {color:C.err, width:2.2, dash:'7 5'});
  a.curve(x=>Math.log10(Qf(x)), {color:C.err, width:2.6});
  a.vline(x0, {color:C.ink, dash:'5 4', width:1.3});
  dot(a, x0, Math.log10(B(x0)), {color:C.err, r:5}); dot(a, x0, Math.log10(Qf(x0)), {color:C.err, r:5.5});
  lbl(a, 0.15, -5.3, 'Q(3.0)='+sci(Qf(x0)), C.err);
  lbl(a, 0.15, -6.35, '\\tfrac12e^{-x^{2}/2}='+sci(B(x0)), C.err);
  return a.svg();
}

/* The square: the region of s1 is the first quadrant, with two faces. */
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

/* 16-QAM on the grid (+-1, +-3): every pair of neighbours at d_min = 2 and
   the number of neighbours of each point. */
const QAM16 = []; for(const x of [-3,-1,1,3]) for(const y of [-3,-1,1,3]) QAM16.push([x,y]);
const nnOf = p => QAM16.filter(q=>Math.abs(d2(p,q)-4) < 1e-9);
function figNN(){
  const a = plane({h:340, need:[[-4.3,4.3],[-4.4,4.1]], xlabel:'', ylabel:'', xticksOverride:[], yticksOverride:[], zeroAxes:false, grid:false});
  QAM16.forEach(p=>nnOf(p).forEach(q=>{ if(q[0] > p[0] || q[1] > p[1]) seg(a, [p,q], {color:C.mid, width:2.2}); }));
  QAM16.forEach(p=>lbl(a, p[0]+0.3, p[1]+0.28, String(nnOf(p).length), C.mid, 'start'));
  QAM16.forEach(p=>a.point(p[0], p[1], {color:C.in, r:6}));
  lbl(a, 0, -4.05, '\\bar N_{\\min}=\\frac{4(2)+8(3)+4(4)}{16}=3', C.ink, 'middle');
  return a.svg();
}

/* Example 4.5 from s1: the two nearest neighbours on the circle of radius
   d_min, and the diagonal point moved in to d_min by the minimum-distance
   bound. */
function figExUnion(){
  const a = plane({need:[[-2.4,2.4],[-2.1,2.1]], xticksOverride:[], yticksOverride:[]});
  drawCells(a, QPSK);
  circle(a, 2, {c:[1,1], color:C.mid, width:1.6, dash:'5 5'});
  seg(a, [[1,1],[-1,1]], {color:C.mid, width:2.4}); seg(a, [[1,1],[1,-1]], {color:C.mid, width:2.4});
  seg(a, [[1,1],[-1,-1]], {color:C.mid, width:2.4, dash:'4 6', opacity:0.3});
  const g = 1-Math.SQRT2;
  seg(a, [[1,1],[g,g]], {color:C.mid, width:2.4});
  ring(a, g, g, {color:C.mid, r:7, width:2.2});
  dots(a, QPSK);
  lbl(a, 1.14, 1.3, '\\mathbf{s}_1', C.in);
  return a.svg();
}

/* Example 4.6: the rectangle (+-1.5, +-1). From s1 = (1.5, 1) the others are
   at 3, 2 and sqrt13. Its two faces are shared with the points at 3 and 2,
   and only the one at 2 is a nearest neighbour. */
const RECT = [[1.5,1],[-1.5,1],[-1.5,-1],[1.5,-1]];
function figExUnionB(){
  const a = plane({need:[[-2.5,2.5],[-1.9,1.9]], xticksOverride:[], yticksOverride:[]});
  drawCells(a, RECT);
  const Y = a.o.yr, X = a.o.xr, s = RECT[0];
  RECT.slice(1).forEach((q,k)=>seg(a, [s,q], {color:C.mid, width:2.4, dash:k===1?'4 6':null, opacity:0.35}));
  lbl(a, -0.75, 1.16, '3', C.mid, 'middle'); lbl(a, 1.66, -0.5, '2', C.mid);
  lbl(a, 0.1, -0.5, '\\sqrt{13}', C.mid);
  seg(a, [[0,0],[0,Y[1]]], {color:C.err, width:4, opacity:0.5}); seg(a, [[0,0],[X[1],0]], {color:C.err, width:4, opacity:0.5});
  circle(a, 2, {c:s, color:C.mid, width:1.6, dash:'5 5'});
  ring(a, 1.5, -1, {color:C.mid, r:13});
  dots(a, RECT);
  lbl(a, 1.64, 1.2, '\\mathbf{s}_1', C.in);
  return a.svg();
}

/* 16-QAM on the grid (+-1, +-3), E_s = 10: the general union bound, the
   minimum-distance bound, the nearest-neighbour form and a simulation of
   20 000 symbols at each even E_s/N0 from 0 to 18 dB, marked at 6 dB. */
const QD = (()=>{ const m = {}; QAM16.forEach(p=>QAM16.forEach(q=>{ if(p===q) return; const k = d2(p,q); m[k] = (m[k]||0)+1/16; })); return Object.entries(m).map(([k,c])=>[+k,c]); })();
const q16 = {
  gen: db => { const N0 = 10/dB(db); return QD.reduce((s,[k,c])=>s + c*Qf(Math.sqrt(k/(2*N0))), 0); },
  nn:  db => 3*Qf(Math.sqrt(4/(2*10/dB(db)))),
  dm:  db => 15*Qf(Math.sqrt(4/(2*10/dB(db))))
};
function qamSim(){
  const z = gauss(4405, 40000, 1), r = rng(4406), sym = Array.from({length:20000}, ()=>Math.floor(r()*16));
  const snap = x => Math.max(-3, Math.min(3, 2*Math.floor(x/2)+1));
  const out = [];
  for(let db=0; db<=18; db+=2){ const sg = Math.sqrt(10/dB(db)/2); let e = 0;
    for(let i=0;i<20000;i++){ const p = QAM16[sym[i]];
      if(snap(p[0]+sg*z[2*i]) !== p[0] || snap(p[1]+sg*z[2*i+1]) !== p[1]) e++; }
    out.push([db, e/20000]); }
  return out;
}
function figTightness(){
  const s0 = 6;
  const a = TAx(SZ({h:290, xt:[0,4,8,12,16], xr:[0,20], yr:[-5,0.9], xlabel:'E_s/N_0\\;(\\text{dB})', ylabel:'P_e', ytickfmt:P.decade,
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

/* ---- the opening --------------------------------------------------------
   Four points (+-1, +-1), their regions, and 300 received points when s1 is
   sent with sigma = 0.55; those outside R1 are errors. */
function figOpen(){
  const a = plane({need:[[-2.3,2.3],[-2.1,2.1]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  drawCells(a, QPSK);
  let s = '', k = 0;
  for(let i=0;i<300;i++){ const x = 1+0.55*ZO[2*i], y = 1+0.55*ZO[2*i+1], out = x < 0 || y < 0;
    if(out) k++;
    const col = out ? C.err : C.noise;
    s += `<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${out?3:2.2}" fill="${col}" stroke="${col}" stroke-width="0.6"/>`; }
  a.raw(s);
  dots(a, QPSK, {cols:[C.in,C.in,C.in,C.in]});
  lbl(a, 1.28, 1.9, '\\mathbf{s}_1\\;\\text{sent}', C.ink);
  lbl(a, a.o.xr[0]+0.2, -1.9, '\\text{outside }R_1:\\ '+k+'\\text{ of }300', C.err);
  return a.svg();
}

/* ---- the galleries -------------------------------------------------------
   Four everyday cases closing each teaching section, drawn as on the slides. */
const EXO = o => Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3}, o);
const galPlane = need => plane({w:520, h:250, pad:{l:60,r:26,t:24,b:40}, need, xticksOverride:[], yticksOverride:[]});

/* 4.1: GPS C/A code correlation, the Barker code of 802.11b, resistor noise,
   ADS-B pulse positions. */
const BARKER = [1,1,1,-1,-1,-1,1,-1,-1,1,-1];
const barkerR = k => { let s = 0; for(let n=0;n<11;n++){ const m = n+k; if(m>=0 && m<11) s += BARKER[n]*BARKER[m]; } return s; };
const TCA = 1/1.023;
const GAL_OBSERVE = [
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
];

/* 4.2: a smoke alarm, an optical receiver, caller ID, Bluetooth Low Energy. */
const ZB = gauss(4403, 16, 1);
const GAL_RULE = [
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
];

/* 4.3: 8PSK sectors, 16-QAM squares, PAM4 thresholds, the telephone keypad. */
const QAMN = (()=>{ const o = [], s = Math.sqrt(10); for(const x of [-3,-1,1,3]) for(const y of [-3,-1,1,3]) o.push([x/s, y/s]); return o; })();
const DT_L = [697,770,852,941], DT_H = [1209,1336,1477,1633];
const ZR = gauss(4407, 20, 1);
const GAL_REGIONS = [
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
];

/* 4.4: Wi-Fi 16-QAM, LTE QPSK, 5G link adaptation, a bit-error-rate tester. */
const ZT = (()=>{ const r = rng(4408); let k = 0; const out = [];
  const marks = [3,3.5,4,4.5,5,5.5,6].map(e=>Math.round(Math.pow(10,e)));
  let n = 0; marks.forEach(m=>{ while(n < m){ if(r() < 1e-3) k++; n++; } out.push([Math.log10(m), k/m]); });
  return out; })();
const GAL_UNION = [
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
];
/* A gallery as two rows of two captioned figures. */
const gallery = figs => [0,2].map(i=>({t:'figrow', n:2, items:figs.slice(i,i+2).map(([svg,cap])=>({svg, cap}))}));

/* ---- the chain ------------------------------------------------------------
   One symbol through the whole receiver: the waveform of 4.1, its two
   correlator outputs, the regions of four points (+-1, +-0.6), and 200 repeats
   of the same symbol with sigma = 0.3, the wrong ones in red. */
const CH_PTS = [[1,-0.6],[1,0.6],[-1,0.6],[-1,-0.6]];
const ZC = gauss(4409, 400, 1);
function figChain(){
  const ha = 90, hb = 120, hc = 220;
  const a = TAx({w:W, h:ha, xr:[-0.03,1.13], yr:[-6.5,6.5], xlabel:'', ylabel:'r(t)',
    pad:{l:56,r:26,t:20,b:10}, yticksOverride:[-5,0,5]});
  seg(a, OB.t.map((x,i)=>[x, OB.r[i]]), {color:C.out, width:1.4});
  const b = TAx({w:W, h:hb, xr:[-0.03,1.13], yr:[-1.2,1.55], xlabel:'t/T', xnameDrop:34, ylabel:'c_1,\\;c_2',
    pad:{l:56,r:26,t:20,b:34}, xt:[0,0.5,1], yticksOverride:[-1,0,1]});
  seg(b, OB.t.map((x,i)=>[x, OB.c1[i]]), {color:C.mid, width:2.4});
  seg(b, OB.t.map((x,i)=>[x, OB.c2[i]]), {color:C.mid, width:2.4, dash:'7 5'});
  const c = plane({h:hc, need:[[-2.2,2.2],[-1.45,1.45]], pad:{l:150,r:150,t:24,b:42}, xticksOverride:[], yticksOverride:[]});
  drawCells(c, CH_PTS);
  let s = '', k = 0;
  for(let i=0;i<200;i++){ const x = 1+0.3*ZC[2*i], y = -0.6+0.3*ZC[2*i+1], out = x < 0 || y > 0;
    if(out) k++;
    const col = out ? C.err : C.noise;
    s += `<circle cx="${f2(c.sx(x))}" cy="${f2(c.sy(y))}" r="${out?3:2.1}" fill="${col}" stroke="${col}" stroke-width="0.6"/>`; }
  c.raw(s);
  lbl(c, c.o.xr[0]+0.1, -1.25, '\\text{wrong: }'+k+'\\text{ of }200', C.err);
  dots(c, CH_PTS, {cols:[C.in,C.in,C.in,C.in]});
  dot(c, OB.rv[0], OB.rv[1], {color:C.out, r:6.5, opacity:0.3});
  return stack(W, [[a.svg(),ha],[b.svg(),hb],[c.svg(),hc]]);
}

window.C4 = [

{t:'h1', num:'CHAPTER 4', text:'The optimal receiver in additive white Gaussian noise'},
{t:'p', lead:true, text:'One of $M$ signals is sent and the channel adds noise. The receiver turns what arrives into a point and picks the nearest signal point.'},
{t:'p', text:'A bank of correlators turns $r(t)$ into a point $\\mathbf r$. The best rule picks the nearest signal point, with a handicap for each prior. How often the receiver is wrong depends only on the distances between the points. The union bound turns those distances into a number.'},
{t:'p', text:'The figure below sends one point many times and marks the received points that land in the wrong region.'},
{t:'fig', svg:figOpen,
 cap:'Four signal points and their decision regions. The grey dots are received points when $\\mathbf s_1$ is sent, and the red ones fall outside its region $R_1$.'},

/* ---------------------------------------------------------------- 4.1 ---- */
{t:'h2', num:'4.1', text:'The observation'},

{t:'h3', text:'Bits into symbols'},
{t:'p', text:'With $M$ waveforms, each symbol carries $k=\\log_2M$ bits. The bit stream is read in blocks of $k$ bits, and each block picks one waveform.'},
{t:'eqbox', cap:'Bits and symbols', tex:'k=\\log_2M,\\qquad R_s=\\frac1T,\\qquad R_b=kR_s,\\qquad T_b=\\frac{T}{k}',
 after:'Each symbol carries $k$ bits and lasts $T$. The symbol rate $R_s$ counts waveforms a second. The bit rate $R_b$ counts bits.'},
{t:'p', text:'Each $T$ seconds the transmitter sends one of the $M$ waveforms $s_1(t),\\ldots,s_M(t)$. The receiver must name it from a noisy $r(t)$.'},
{t:'p', text:'The figure below reads twelve bits in blocks of two. Each block picks one of four levels and holds it for $T=2T_b$.'},
{t:'fig', svg:figMary,
 cap:'Twelve bits read in blocks of $k=2$, so $M=2^{k}=4$ and $T=kT_b=2T_b$. The number under each block is the level it picks, from $0$ to $3$.'},
{t:'p', text:'For example, a modem sends $2400$ symbols a second with $M=16$. Then $k=\\log_216=4$ bits a symbol, and $R_b=4\\times2400=9600$ b/s.'},

{t:'h3', text:'The observation vector'},
{t:'p', text:'Over one symbol the receiver sees $r(t)=s_i(t)+n(t)$. Here $n(t)$ is white Gaussian noise of two-sided power spectral density $N_0/2$.'},
{t:'p', text:'The receiver correlates $r(t)$ with each of the $N$ orthonormal basis functions $\\psi_1(t),\\ldots,\\psi_N(t)$ of the signal set. Each correlator multiplies by one basis function and integrates over one symbol.'},
{t:'eqbox', cap:'Correlator outputs', tex:'\\begin{aligned}r_j&=\\int_0^{T}r(t)\\,\\psi_j(t)\\,dt\\\\&=\\int_0^{T}s_i(t)\\,\\psi_j(t)\\,dt+\\int_0^{T}n(t)\\,\\psi_j(t)\\,dt\\\\&=s_{ij}+n_j,\\qquad j=1,\\ldots,N\\end{aligned}',
 after:'The integral is linear, so it splits over the sum. The first integral is the coordinate $s_{ij}$ of the sent signal. The second is a noise coordinate $n_j$.'},
{t:'p', text:'Stack the $N$ outputs into one vector. The result is the observation the receiver decides from.'},
{t:'eqbox', cap:'The observation vector', big:true, tex:'\\mathbf r=\\mathbf s_i+\\mathbf n',
 after:'The receiver now works with one point $\\mathbf r$. The noise moves it away from the sent point $\\mathbf s_i$.'},
{t:'p', text:'The figure below follows one received waveform, with $T=1$, through two correlators.'},
{t:'fig', svg:figObserve,
 cap:'Top: $r(t)$, green, is $s_i(t)$, cyan, plus noise. Middle: the running integrals $c_1(t)$, solid, and $c_2(t)$, dashed, of $r(t)\\,\\psi_j(t)$. Bottom: their end values $r_1$ and $r_2$ are the coordinates of $\\mathbf r$.'},
{t:'p', text:'For example, let $\\mathbf s_i=(2,-1)$ be sent with noise coordinates $n_1=0.3$ and $n_2=-0.4$. Then $\\mathbf r=\\mathbf s_i+\\mathbf n=(2+0.3,\\,-1-0.4)=(2.3,-1.4)$.'},

{t:'h3', text:'The matched-filter bank'},
{t:'p', text:'A bank of matched filters gives the same numbers as the correlators. The filter for axis $j$ is its basis function turned around in time.'},
{t:'eqbox', cap:'Matched filter', tex:'h_j(t)=\\psi_j(T-t)'},
{t:'p', text:'The filter output is the convolution of $r(t)$ with $h_j(t)$. Write the convolution, then put in $h_j(t-\\tau)=\\psi_j(T-t+\\tau)$.'},
{t:'eq', tex:'\\begin{aligned}y_j(t)&=\\int_0^{T}r(\\tau)\\,h_j(t-\\tau)\\,d\\tau\\\\&=\\int_0^{T}r(\\tau)\\,\\psi_j(T-t+\\tau)\\,d\\tau\\end{aligned}'},
{t:'p', text:'Now sample the output at $t=T$. The shift $T-t$ becomes zero, and the integral is the correlator.'},
{t:'eqbox', cap:'Sample at $T$', tex:'y_j(T)=\\int_0^{T}r(\\tau)\\,\\psi_j(\\tau)\\,d\\tau=r_j',
 after:'At any other time the two outputs differ.'},
{t:'p', text:'The figure below uses $\\psi(t)=\\sqrt3\\,t$ on $[0,1]$ and $r(t)=1.5\\,\\psi(t)$, with no noise. The two curves meet only at $t=T=1$.'},
{t:'fig', svg:figMfbank,
 cap:'Solid: the matched filter output $y(t)$. Dashed: the correlator output $c(t)$. At the sampling time $t_0=T$ both equal $1.5$.'},
{t:'p', text:'The value at $T$ follows from the energy of $\\psi$. The correlator gives $y(1)=1.5\\int_0^{1}\\psi^{2}(t)\\,dt=1.5\\int_0^{1}3t^{2}\\,dt=1.5$.'},

{t:'h3', text:'The noise the receiver ignores'},
{t:'p', text:'Noise has parts in every direction, not only in the signal space. The part outside the span of $\\psi_1,\\ldots,\\psi_N$ is written $n\'(t)$. It does not depend on the signal sent.'},
{t:'p', text:'Let $\\tilde{\\mathbf r}$ be the received waveform with nothing dropped. It is $\\mathbf r$ plus $n\'$, and $n\'$ is at right angles to the signal space. So Pythagoras splits each squared distance into two parts.'},
{t:'eq', tex:'\\tilde{\\mathbf r}-\\mathbf s_j=(\\mathbf r-\\mathbf s_j)+n\''},
{t:'eqbox', cap:'The noise outside the signal space', tex:'\\|\\tilde{\\mathbf r}-\\mathbf s_j\\|^{2}=\\|\\mathbf r-\\mathbf s_j\\|^{2}+\\|n\'\\|^{2}',
 after:'The second part is the same for every $j$. It cannot change which signal is nearest, so the receiver can drop it.'},
{t:'box', kind:'ok', hd:'Sufficient statistics', html:'The $N$ correlator outputs $r_1,\\ldots,r_N$ hold everything the decision needs. Nothing is lost by dropping $n\'(t)$. Outputs with this property are called <b>sufficient statistics</b>.'},
{t:'p', text:'The figure below draws the signal space as a sheet in three dimensions.'},
{t:'fig', svg:figIrrelevant,
 cap:'The amber sheet is the signal space, spanned by $\\psi_1$ and $\\psi_2$. The noise splits into a part in the sheet and $n\'$ outside it. Only the part in the sheet moves $\\mathbf r$.'},
{t:'p', text:'For example, let the squared distances in the sheet be $\\|\\mathbf r-\\mathbf s_1\\|^{2}=0.5$ and $\\|\\mathbf r-\\mathbf s_2\\|^{2}=2.0$, with $\\|n\'\\|^{2}=0.8$. The full squared distances are $0.5+0.8=1.3$ and $2.0+0.8=2.8$. The gap stays $1.5$, so $\\mathbf s_1$ still wins.'},

{t:'h3', text:'The noise components'},
{t:'p', text:'Each noise coordinate is the noise correlated with one basis function. It is a weighted integral of a Gaussian process, so it is Gaussian.'},
{t:'eqbox', cap:'One component', tex:'n_j=\\int_0^{T}n(t)\\,\\psi_j(t)\\,dt,\\qquad E[n_j]=0',
 after:'The noise has mean zero, and the integral keeps the mean at zero.'},
{t:'p', text:'The variance of one component, and the correlation of two, follow from the autocorrelation of white noise, $E[n(t)n(u)]=\\frac{N_0}{2}\\delta(t-u)$.'},
{t:'eq', tex:'\\begin{aligned}E[n_jn_k]&=\\int_0^{T}\\!\\!\\int_0^{T}E[n(t)n(u)]\\,\\psi_j(t)\\,\\psi_k(u)\\,dt\\,du\\\\&=\\int_0^{T}\\!\\!\\int_0^{T}\\frac{N_0}{2}\\,\\delta(t-u)\\,\\psi_j(t)\\,\\psi_k(u)\\,dt\\,du\\\\&=\\frac{N_0}{2}\\int_0^{T}\\psi_j(t)\\,\\psi_k(t)\\,dt\\end{aligned}'},
{t:'p', text:'The delta function collapses the integral over $u$. Orthonormality then gives $1$ for the last integral when $j=k$, and $0$ otherwise.'},
{t:'eqbox', cap:'Two components', tex:'E[n_j^{2}]=\\frac{N_0}{2},\\qquad E[n_jn_k]=0,\\quad j\\ne k',
 after:'Gaussian variables that are uncorrelated are independent. So the $N$ components are independent, each with variance $N_0/2$.'},
{t:'p', text:'Every axis has the same variance, and the axes are independent. So the cloud of received points around a signal point is round.'},
{t:'box', kind:'warn', hd:'An ellipse', html:'Coloured noise gives correlated components, with correlation coefficient $\\rho\\ne0$. The cloud tilts into an ellipse, and the nearest point is no longer the best guess.'},
{t:'p', text:'For example, noise with $\\rho=0.8$ reaches the two correlators. A positive $\\rho$ makes $n_2$ follow $n_1$, so the cloud stretches along the line $n_1=n_2$.'},
{t:'p', text:'The figure below draws two components of variance $1$ for two values of $\\rho$.'},
{t:'figrow', n:2, items:[
 {svg:()=>figNoise(0), cap:'$\\rho=0$: independent components and a round cloud. The solid and dashed curves hold about $39\\%$ and $86\\%$ of the points.'},
 {svg:()=>figNoise(0.8), cap:'$\\rho=0.8$: $n_2$ follows $n_1$, and the cloud stretches along the line $n_1=n_2$.'}
]},

{t:'ex', hd:'Example 4.1 — four-level PAM', rows:[
 ['Given','Four-level PAM, $s_m\\in\\{-1.5,-0.5,0.5,1.5\\}$ on a unit-energy pulse, with $N_0=0.1$.'],
 ['Find','The conditional density $f(r\\mid s_m)$ of the correlator output for each level, and the height of each bell.'],
 ['Method','One basis function means one correlator and one number, $r=s_m+n$. The noise $n$ is Gaussian with mean $0$ and variance $\\sigma^{2}=N_0/2$. So $r$ is Gaussian and centred on $s_m$.'],
 ['Solution','Put $\\sigma^{2}=N_0/2$ into the Gaussian density. $$f(r\\mid s_m)=\\frac{1}{\\sqrt{2\\pi\\sigma^{2}}}\\,e^{-(r-s_m)^{2}/2\\sigma^{2}}=\\frac{1}{\\sqrt{\\pi N_0}}\\,e^{-(r-s_m)^{2}/N_0}$$ Here $\\sigma^{2}=0.05$. The peak is $1/\\sqrt{\\pi N_0}=1/\\sqrt{0.1\\pi}=1.78$. The four bells have one shape, each centred on its level.'],
 ['Check','Each bell has $\\sigma=\\sqrt{0.05}=0.22$, well inside half the spacing between levels, $0.5$. At $N_0=0.6$, $\\sigma=0.55$ and neighbouring bells overlap.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $N_0/2$, not $N_0$, as the variance. $N_0$ makes each bell $\\sqrt2$ times too wide.'},
{t:'p', text:'The figure below draws the four densities of Example 4.1.'},
{t:'fig', svg:figPam4,
 cap:'The four conditional densities of Example 4.1, drawn for $N_0=0.1$. Each bell sits on one level, and its width grows with $\\sqrt{N_0}$.'},

{t:'ex', hd:'Example 4.2 — four orthogonal signals', rows:[
 ['Given','Four orthogonal signals of energy $E=4$, with $N_0=1$. $\\mathbf s_1=(2,0,0,0)$ is sent.'],
 ['Find','The density of each correlator output $r_k$, and the mean of $r_1$.'],
 ['Method','Each signal lies along its own axis, at distance $\\sqrt E$ from the origin. So only the first correlator sees the signal. $$r_1=\\sqrt{E}+n_1,\\qquad r_k=n_k,\\quad k=2,3,4$$'],
 ['Solution','Each $n_k$ is Gaussian with variance $N_0/2=0.5$, so $2\\sigma^{2}=1$. $$f(r_1\\mid\\mathbf s_1)=\\frac{e^{-(r_1-2)^{2}}}{\\sqrt{\\pi}},\\qquad f(r_k\\mid\\mathbf s_1)=\\frac{e^{-r_k^{2}}}{\\sqrt{\\pi}}$$ The mean of $r_1$ is $\\sqrt E=2$. Each density has peak $1/\\sqrt\\pi=0.56$, and the four outputs are independent.'],
 ['Check','The means $(2,0,0,0)$ have squared length $2^{2}=4=E$, as they must.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\sqrt E=2$, not $E=4$, as the mean of $r_1$. The coordinate of $\\mathbf s_1$ is its length, and $E$ is its squared length.'},
{t:'p', text:'The figure below draws the four densities of Example 4.2.'},
{t:'fig', svg:figOrth,
 cap:'The four correlator outputs of Example 4.2 when $\\mathbf s_1$ is sent. Only $r_1$ is centred away from zero.'},

/* ---------------------------------------------------------------- 4.2 ---- */

{t:'h3', text:'Correlators around us'},
{t:'p', text:'Four everyday receivers correlate what arrives with a known waveform.'},
...gallery(GAL_OBSERVE),
{t:'box', kind:'def', hd:'Correlate, then decide', html:'Each receiver multiplies what arrives by a known waveform and integrates. The number it gets is one coordinate of $\\mathbf r$.'},
{t:'box', kind:'def', hd:'Noise in every output', html:'Thermal noise reaches every correlator. Each output is the signal coordinate plus a Gaussian sample.'},
{t:'box', kind:'warn', hd:'The window', html:'The integral runs over one symbol. A GPS copy that is late by $T_c$ gives $R=0$ and loses the whole signal.'},
{t:'h2', num:'4.2', text:'The decision rule'},

{t:'h3', text:'MAP and ML'},
{t:'p', text:'The receiver should name the signal that is most probable once $\\mathbf r$ has been seen. This is the maximum a posteriori, or <b>MAP</b>, rule.'},
{t:'p', text:'Bayes\' rule writes that probability with the prior $P(\\mathbf s_i)$ and the likelihood $f(\\mathbf r\\mid\\mathbf s_i)$.'},
{t:'eq', tex:'P(\\mathbf s_i\\mid\\mathbf r)=\\frac{P(\\mathbf s_i)\\,f(\\mathbf r\\mid\\mathbf s_i)}{f(\\mathbf r)}'},
{t:'p', text:'The denominator $f(\\mathbf r)$ is the same for every $i$, so it cannot change which $i$ wins.'},
{t:'eqbox', cap:'MAP', tex:'\\hat s=\\arg\\max_i P(\\mathbf s_i\\mid\\mathbf r)=\\arg\\max_i P(\\mathbf s_i)\\,f(\\mathbf r\\mid\\mathbf s_i)'},
{t:'p', text:'With equal priors the factor $P(\\mathbf s_i)$ is common to every $i$ and drops too. MAP then becomes the maximum-likelihood, or <b>ML</b>, rule.'},
{t:'eqbox', cap:'ML', tex:'\\hat s=\\arg\\max_i f(\\mathbf r\\mid\\mathbf s_i)'},
{t:'p', text:'For example, let $P(s_1)=0.8$ and $P(s_2)=0.2$. At some $r$ the likelihoods are $f(r\\mid s_1)=0.2$ and $f(r\\mid s_2)=0.5$. MAP compares $0.8(0.2)=0.16$ with $0.2(0.5)=0.10$ and picks $s_1$. ML picks $s_2$, because $0.5>0.2$.'},
{t:'p', text:'In one dimension the MAP rule picks the taller of the two weighted densities $P(s_i)\\,f(r\\mid s_i)$. The figure below shows that their crossing $\\tau$ is the threshold.'},
{t:'fig', svg:figMap,
 cap:'$s_1=+1$ and $s_2=-1$, with $N_0=1$, drawn for $P(s_1)=0.7$. Solid: $P(s_1)\\,f(r\\mid s_1)$. Dashed: $P(s_2)\\,f(r\\mid s_2)$. The crossing $\\tau$ sits on the side of the less likely $s_2$.'},

{t:'h3', text:'Minimum distance'},
{t:'p', text:'In Gaussian noise the likelihood has a simple form. The $N$ noise components are independent, so the density of $\\mathbf r$ is a product of $N$ bells.'},
{t:'eq', tex:'\\begin{aligned}f(\\mathbf r\\mid\\mathbf s_i)&=\\prod_{j=1}^{N}\\frac{1}{\\sqrt{\\pi N_0}}\\,e^{-(r_j-s_{ij})^{2}/N_0}\\\\&=\\frac{1}{(\\pi N_0)^{N/2}}\\,e^{-\\|\\mathbf r-\\mathbf s_i\\|^{2}/N_0}\\end{aligned}'},
{t:'p', text:'The sum of the squares in the exponent is the squared distance $\\|\\mathbf r-\\mathbf s_i\\|^{2}$. Now take the logarithm of the MAP product. The logarithm is increasing, so the best signal does not change.'},
{t:'eq', tex:'\\ln\\bigl(P(\\mathbf s_i)\\,f(\\mathbf r\\mid\\mathbf s_i)\\bigr)=\\ln P(\\mathbf s_i)-\\frac N2\\ln(\\pi N_0)-\\frac{\\|\\mathbf r-\\mathbf s_i\\|^{2}}{N_0}'},
{t:'p', text:'The middle term is the same for every $i$ and drops. Multiply what is left by $-N_0$, which turns the largest into the smallest.'},
{t:'eqbox', cap:'Minimum distance', big:true, tex:'\\hat s=\\arg\\min_i\\Bigl(\\|\\mathbf r-\\mathbf s_i\\|^{2}-N_0\\ln P(\\mathbf s_i)\\Bigr)',
 after:'With equal priors the MAP receiver picks the signal point nearest to $\\mathbf r$. Unequal priors subtract $N_0\\ln P(\\mathbf s_i)$ from each squared distance, a handicap in favour of the likely signals.'},
{t:'p', text:'The figure below takes $\\mathbf r=(0.5,0.3)$ and four equally likely points $(\\pm1,\\pm1)$. It marks the squared distance $D_i^{2}$ to each point.'},
{t:'fig', svg:figMindist,
 cap:'The received point $\\mathbf r=(0.5,0.3)$ and the points $\\mathbf s_1=(1,1)$, $\\mathbf s_2=(-1,1)$, $\\mathbf s_3=(-1,-1)$ and $\\mathbf s_4=(1,-1)$. The ring marks the nearest one, $\\mathbf s_1$.'},
{t:'p', text:'For $\\mathbf s_1$ the squared distance is $D_1^{2}=(0.5-1)^{2}+(0.3-1)^{2}=0.25+0.49=0.74$. The others are $2.74$, $3.94$ and $1.94$. With equal priors the receiver picks $\\mathbf s_1$.'},
{t:'p', text:'Now let $N_0=1$, with $P(\\mathbf s_4)=0.7$ and $0.1$ for each of the others. Each score adds $-\\ln P(\\mathbf s_i)$ to the squared distance.'},
{t:'eq', tex:'\\begin{aligned}\\mathbf s_1:&\\quad 0.74-\\ln0.1=0.74+2.30=3.04\\\\ \\mathbf s_2:&\\quad 2.74+2.30=5.04\\\\ \\mathbf s_3:&\\quad 3.94+2.30=6.24\\\\ \\mathbf s_4:&\\quad 1.94-\\ln0.7=1.94+0.36=2.30\\end{aligned}'},
{t:'p', text:'The smallest score is $2.30$, so MAP picks $\\mathbf s_4$.'},

{t:'h3', text:'The correlation metric'},
{t:'p', text:'Expanding the squared distance gives the form in which a receiver is built.'},
{t:'eq', tex:'\\begin{aligned}\\|\\mathbf r-\\mathbf s_i\\|^{2}&=\\sum_{j=1}^{N}(r_j-s_{ij})^{2}\\\\&=\\sum_{j=1}^{N}r_j^{2}-2\\sum_{j=1}^{N}r_js_{ij}+\\sum_{j=1}^{N}s_{ij}^{2}\\\\&=\\|\\mathbf r\\|^{2}-2\\,\\mathbf r\\cdot\\mathbf s_i+E_i\\end{aligned}'},
{t:'p', text:'Here $E_i=\\|\\mathbf s_i\\|^{2}$ is the energy of $s_i(t)$. The term $\\|\\mathbf r\\|^{2}$ is the same for every $i$ and drops. Halve the rest and change its sign, so the smallest becomes the largest.'},
{t:'eqbox', cap:'Correlation metric', big:true, tex:'\\hat s=\\arg\\max_i\\Bigl(\\mathbf r\\cdot\\mathbf s_i-\\frac{E_i}{2}+\\frac{N_0}{2}\\ln P(\\mathbf s_i)\\Bigr)',
 after:'This is the same rule as minimum distance. With equal energies and equal priors only $\\mathbf r\\cdot\\mathbf s_i$ is left: pick the largest correlation.'},
{t:'p', text:'With unequal energies the term $-E_i/2$ must stay. Take 4-PAM at $s_i=-3,-1,1,3$ with $r=1.6$ and equal priors. Each metric is $rs_i-s_i^{2}/2$.'},
{t:'eq', tex:'\\begin{aligned}s=-3:&\\quad -4.8-4.5=-9.3\\\\ s=-1:&\\quad -1.6-0.5=-2.1\\\\ s=1:&\\quad 1.6-0.5=1.1\\\\ s=3:&\\quad 4.8-4.5=0.3\\end{aligned}'},
{t:'p', text:'The largest is $1.1$, so the receiver picks $s=1$, the nearest level. The correlation alone is largest for $s=3$, at $4.8$. The figure below draws both sets of bars.'},
{t:'figrow', n:2, items:[
 {svg:()=>figMetric(0), cap:'The correlation $rs_i$ alone. The largest bar, outlined in green, is $s=3$.'},
 {svg:()=>figMetric(1), cap:'The metric $rs_i-s_i^{2}/2$. The energy term gives the win to $s=1$.'}
]},

{t:'h3', text:'Two receiver structures'},
{t:'p', text:'There are two ways to build the receiver. Both compute the correlation metric for every signal and keep the largest.'},
{t:'p', text:'<b>Method I</b> computes $\\mathbf r=(r_1,\\ldots,r_N)$ with $N$ correlators. Then it forms $\\mathbf r\\cdot\\mathbf s_i+a_i$ for each $i$ and keeps the largest.'},
{t:'eqbox', cap:'The bias', tex:'a_i=\\frac{N_0}{2}\\ln P(\\mathbf s_i)-\\frac{E_i}{2}',
 after:'There is one constant for each signal. The priors and the energies fix it before any signal arrives.'},
{t:'p', text:'<b>Method II</b> correlates $r(t)$ with each waveform $s_i(t)$ directly. Inner products are preserved, so each of these correlators gives $\\mathbf r\\cdot\\mathbf s_i$ at once.'},
{t:'eq', tex:'\\int_0^{T}r(t)\\,s_i(t)\\,dt=\\mathbf r\\cdot\\mathbf s_i'},
{t:'p', text:'Method I needs $N$ correlators and Method II needs $M$. So Method I is cheaper whenever $N<M$. For example, $M=16$ signals in $N=2$ dimensions need $16$ correlators in Method II and $2$ in Method I.'},
{t:'p', text:'The figure below draws both structures as block diagrams.'},
{t:'fig', svg:figReceiver,
 cap:'Top: Method I correlates with the $N$ basis functions, then forms $M$ metrics. Bottom: Method II correlates with the $M$ waveforms and adds each bias $a_i$. Both give the same $\\hat s$.'},

{t:'h3', text:'Optimality of the MAP rule'},
{t:'p', text:'No other rule has a smaller error probability than MAP. In one dimension the reason is a picture, because the error probability is an area.'},
{t:'p', text:'Take two signals and a threshold $\\tau$, with $s_1$ decided above $\\tau$. Each way to be wrong is a weighted density on the wrong side of $\\tau$.'},
{t:'eqbox', cap:'Error as an area', tex:'P_e(\\tau)=P(s_1)\\int_{-\\infty}^{\\tau}f(r\\mid s_1)\\,dr+P(s_2)\\int_{\\tau}^{\\infty}f(r\\mid s_2)\\,dr'},
{t:'p', text:'Move $\\tau$ right by a small $\\Delta$. The first area gains $P(s_1)f(\\tau\\mid s_1)\\Delta$, and the second loses $P(s_2)f(\\tau\\mid s_2)\\Delta$. So the slope of $P_e$ is the difference.'},
{t:'eq', tex:'\\frac{dP_e}{d\\tau}=P(s_1)\\,f(\\tau\\mid s_1)-P(s_2)\\,f(\\tau\\mid s_2)'},
{t:'p', text:'The slope is zero where the two weighted densities are equal. That point is the MAP threshold, and no move of $\\tau$ helps there.'},
{t:'box', kind:'ok', hd:'In any dimension', html:'Give each $\\mathbf r$ to the signal whose weighted density $P(\\mathbf s_i)f(\\mathbf r\\mid\\mathbf s_i)$ is largest there. Any other choice adds area, so MAP has the smallest $P_e$.'},
{t:'p', text:'The figure below uses $\\pm1$ with $P(s_1)=0.25$ at $+1$ and $N_0=0.5$. Its lower panel is $P_e(\\tau)$ as the threshold moves.'},
{t:'fig', svg:figOptimal,
 cap:'Drawn for $\\tau=0.6$. Top: the red areas are the weighted densities on the wrong side of $\\tau$. Bottom: their sum $P_e(\\tau)$, smallest at $\\tau^{\\ast}=0.137$, where the weighted densities cross.'},
{t:'p', text:'The minimum sits at $\\tau^{\\ast}=0.137$, with $P_e=0.0192$. At $\\tau=0$ it is $0.0228$.'},

{t:'ex', hd:'Example 4.3 — a MAP threshold', rows:[
 ['Given','Antipodal signals $\\pm1$, so $E_b=1$, with $P(s_1)=0.25$ at $+1$, $P(s_2)=0.75$ at $-1$, and $N_0=0.5$.'],
 ['Find','The MAP threshold $\\tau$, the direction it moves, and the error probability.'],
 ['Method','The MAP threshold is where the two weighted densities are equal. Set them equal at $r=\\tau$ and take logarithms. The common factor $1/\\sqrt{\\pi N_0}$ cancels. $$\\begin{aligned}\\ln P(s_1)-\\frac{(\\tau-\\sqrt{E_b})^{2}}{N_0}&=\\ln P(s_2)-\\frac{(\\tau+\\sqrt{E_b})^{2}}{N_0}\\\\ \\frac{(\\tau+\\sqrt{E_b})^{2}-(\\tau-\\sqrt{E_b})^{2}}{N_0}&=\\ln\\frac{P(s_2)}{P(s_1)}\\\\ \\frac{4\\sqrt{E_b}\\,\\tau}{N_0}&=\\ln\\frac{P(s_2)}{P(s_1)}\\end{aligned}$$ The squares $\\tau^{2}$ and $E_b$ cancel in the second line. So $\\tau=\\dfrac{N_0}{4\\sqrt{E_b}}\\ln\\dfrac{P(s_2)}{P(s_1)}$.'],
 ['Solution','$\\tau=\\tfrac{0.5}{4}\\ln\\tfrac{0.75}{0.25}=0.125\\ln3=0.137$. It is positive, so it moves toward $+1$, the less likely signal. Each $Q$ argument is the distance from a point to $\\tau$, over $\\sigma=\\sqrt{N_0/2}=0.5$. $$\\begin{aligned}P_e&=0.25\\,Q\\!\\left(\\frac{1-0.137}{0.5}\\right)+0.75\\,Q\\!\\left(\\frac{1+0.137}{0.5}\\right)\\\\&=0.25\\,Q(1.73)+0.75\\,Q(2.27)\\\\&=0.25(0.0422)+0.75(0.0115)=0.0192\\end{aligned}$$'],
 ['Check','ML keeps $\\tau=0$ and gets $Q(1/0.5)=Q(2)=0.0228$. MAP is about $16\\%$ better.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\ln\\bigl(P(s_2)/P(s_1)\\bigr)$, not its inverse. The inverse gives $\\tau=-0.137$.'},
{t:'p', text:'The figure below marks the threshold and the two error areas of Example 4.3.'},
{t:'fig', svg:figExMap,
 cap:'Example 4.3. Solid: $0.25\\,f(r\\mid s_1)$ at $+1$. Dashed: $0.75\\,f(r\\mid s_2)$ at $-1$. The two red areas are the two ways to be wrong, and their sum is $P_e=0.0192$.'},

{t:'ex', hd:'Example 4.4 — a receiver for four waveforms', rows:[
 ['Given','Four equally likely waveforms on $[0,2)$. $s_1(t)=2$ on $[0,1)$ and $s_2(t)=1$ on $[0,2)$. $s_3(t)$ is $-1$ on $[0,1)$ and $1$ on $[1,2)$, and $s_4(t)=-1$ on $[0,2)$. $\\mathbf r=(1.2,0.3)$ arrives.'],
 ['Find','The receiver and its decision for $\\mathbf r$.'],
 ['Method','Every waveform is constant on each half, so two unit pulses form an orthonormal basis: $\\psi_1=1$ on $[0,1)$ and $\\psi_2=1$ on $[1,2)$. Read each point from the heights on the two halves. $$\\mathbf s_1=(2,0),\\quad \\mathbf s_2=(1,1),\\quad \\mathbf s_3=(-1,1),\\quad \\mathbf s_4=(-1,-1)$$ The energies $E_i=\\|\\mathbf s_i\\|^{2}$ are $4,2,2,2$. They differ, so the metric keeps $-E_i/2$.'],
 ['Solution','With equal priors the metric is $\\mathbf r\\cdot\\mathbf s_i-E_i/2$. $$\\begin{aligned}\\mathbf s_1:&\\quad 1.2(2)+0.3(0)-2=0.4\\\\ \\mathbf s_2:&\\quad 1.2(1)+0.3(1)-1=0.5\\\\ \\mathbf s_3:&\\quad 1.2(-1)+0.3(1)-1=-1.9\\\\ \\mathbf s_4:&\\quad 1.2(-1)+0.3(-1)-1=-2.5\\end{aligned}$$ The largest is $0.5$, so $\\hat s=s_2$.'],
 ['Check','$\\|\\mathbf r-\\mathbf s_1\\|^{2}=0.8^{2}+0.3^{2}=0.73$ and $\\|\\mathbf r-\\mathbf s_2\\|^{2}=0.2^{2}+0.7^{2}=0.53$. So $\\mathbf s_2$ is also the nearest point, and $\\mathbf r$ lies in its region.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\mathbf r\\cdot\\mathbf s_i-E_i/2$, not $\\mathbf r\\cdot\\mathbf s_i$, if the energies differ. Correlation alone picks $s_1$.'},
{t:'p', text:'The figure below draws the waveforms, the basis and the regions of Example 4.4.'},
{t:'fig', svg:figExReceiver,
 cap:'Example 4.4. Top: the four waveforms, with the two unit pulses dashed in amber. Bottom: the four points, the regions of the minimum-distance receiver, and $\\mathbf r=(1.2,0.3)$ in the region of $\\mathbf s_2$.'},

/* ---------------------------------------------------------------- 4.3 ---- */

{t:'h3', text:'Decision rules around us'},
{t:'p', text:'Four everyday receivers use the MAP threshold, the energy term or the correlation receiver.'},
...gallery(GAL_RULE),
{t:'box', kind:'def', hd:'Priors move the threshold', html:'A rare event gets a smaller region. The threshold moves toward the less likely signal.'},
{t:'box', kind:'def', hd:'The energy term', html:'With unequal energies the metric keeps $-E_i/2$. For on-off keying that puts the threshold at half the on level.'},
{t:'box', kind:'warn', hd:'Unknown priors', html:'When the priors are not known, the receiver uses ML. It is optimal only when the priors are equal.'},
{t:'h2', num:'4.3', text:'Decision regions'},

{t:'h3', text:'Regions with equal priors'},
{t:'p', text:'Group the observations that give the same decision. The space splits into $M$ <b>decision regions</b>, one for each signal.'},
{t:'p', text:'Start with two points. The points $\\mathbf r$ equally far from $\\mathbf s_i$ and $\\mathbf s_j$ form a line, the <b>perpendicular bisector</b> of the segment between them. Expanding both squared distances shows why.'},
{t:'eq', tex:'\\begin{aligned}\\|\\mathbf r-\\mathbf s_i\\|^{2}&=\\|\\mathbf r-\\mathbf s_j\\|^{2}\\\\ -2\\,\\mathbf r\\cdot\\mathbf s_i+E_i&=-2\\,\\mathbf r\\cdot\\mathbf s_j+E_j\\\\ 2\\,\\mathbf r\\cdot(\\mathbf s_j-\\mathbf s_i)&=E_j-E_i\\end{aligned}'},
{t:'p', text:'The $\\|\\mathbf r\\|^{2}$ terms cancel, and the last line is linear in $\\mathbf r$. So the boundary is a straight line, at right angles to $\\mathbf s_j-\\mathbf s_i$.'},
{t:'eqbox', cap:'A region', tex:'R_i=\\bigl\\{\\mathbf r:\\ \\|\\mathbf r-\\mathbf s_i\\|<\\|\\mathbf r-\\mathbf s_j\\|\\ \\text{for all }j\\ne i\\bigr\\}',
 after:'Each region is cut out by bisectors, so it is a convex polygon.'},
{t:'box', kind:'warn', hd:'Unbounded regions', html:'Outer points have regions that run off to infinity. Noise that pushes an outer point outward causes no error.'},
{t:'p', text:'The figure below takes five equally likely points: the corners $(\\pm1.2,\\pm1.2)$ and the centre.'},
{t:'fig', svg:figRegions,
 cap:'Five equally likely points and their regions. The centre region is the square $|r_1|+|r_2|<1.2$, turned by $45^{\\circ}$. The four corner regions are unbounded.'},
{t:'p', text:'The centre region has four straight faces. The bisector between $(0,0)$ and $(1.2,1.2)$ is $r_1+r_2=1.2$. The other three corners give the other three faces.'},

{t:'h3', text:'Regions with unequal priors'},
{t:'p', text:'With unequal priors the boundary between $\\mathbf s_i$ and $\\mathbf s_j$ is where the two MAP scores are equal.'},
{t:'eqbox', cap:'A boundary', tex:'\\|\\mathbf r-\\mathbf s_i\\|^{2}-N_0\\ln P(\\mathbf s_i)=\\|\\mathbf r-\\mathbf s_j\\|^{2}-N_0\\ln P(\\mathbf s_j)',
 after:'The $\\|\\mathbf r\\|^{2}$ terms still cancel. The boundary is still a straight line, parallel to the bisector.'},
{t:'p', text:'To find where the line sits, measure along the segment from $\\mathbf s_i$ to $\\mathbf s_j$, which is $d$ long. Put the boundary a distance $x$ from $\\mathbf s_i$.'},
{t:'eq', tex:'\\begin{aligned}x^{2}-N_0\\ln P(\\mathbf s_i)&=(d-x)^{2}-N_0\\ln P(\\mathbf s_j)\\\\ 2dx-d^{2}&=N_0\\ln\\frac{P(\\mathbf s_i)}{P(\\mathbf s_j)}\\end{aligned}'},
{t:'p', text:'Solve for $x$ and call the result $\\mu_i$.'},
{t:'eqbox', cap:'The shift', tex:'\\mu_i=\\frac{d}{2}+\\frac{N_0}{2d}\\ln\\frac{P(\\mathbf s_i)}{P(\\mathbf s_j)}',
 after:'$\\mu_i$ is the distance from $\\mathbf s_i$ to its boundary with $\\mathbf s_j$. A likely point pushes the line away from itself, toward the less likely point.'},
{t:'p', text:'For example, take $d=2$, $N_0=1$, $P(\\mathbf s_i)=0.8$ and $P(\\mathbf s_j)=0.2$. Then $\\mu_i=1+\\tfrac14\\ln4=1+0.35=1.35$. The likely point keeps the larger share.'},
{t:'p', text:'The figure below gives each of three points a prior, with $N_0=1$.'},
{t:'fig', svg:figRegionsPriors,
 cap:'Three points with $N_0=1$, drawn for $P(\\mathbf s_3)=0.6$ and $P(\\mathbf s_1)=P(\\mathbf s_2)=0.2$. Solid lines are the MAP boundaries, dashed lines the equal-prior ones. The likely $\\mathbf s_3$ takes more of the plane.'},

{t:'h3', text:'Binary error probability'},
{t:'p', text:'Two equally likely points a distance $d$ apart give the simplest error probability. The boundary is the midpoint, $d/2$ from each point.'},
{t:'p', text:'Only the noise along the line through the two points can cause an error. That component has variance $N_0/2$, and an error needs more than $d/2$ of it.'},
{t:'eqbox', cap:'Along the line', tex:'\\begin{aligned}P_e&=P\\Bigl(n>\\frac d2\\Bigr)=Q\\!\\left(\\frac{d/2}{\\sqrt{N_0/2}}\\right)\\\\&=Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)\\end{aligned}',
 after:'Here $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ is the Gaussian tail. The last step squares the argument: $(d/2)^{2}/(N_0/2)=d^{2}/2N_0$.'},
{t:'p', text:'Put the distance of each special case into $d^{2}/2N_0$.'},
{t:'eqbox', cap:'Two special cases', tex:[
  '\\text{antipodal},\\ d=2\\sqrt{E_b}:\\qquad \\frac{d^{2}}{2N_0}=\\frac{2E_b}{N_0},\\qquad P_e=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)',
  '\\text{orthogonal or on-off},\\ d=\\sqrt{2E_b}:\\qquad \\frac{d^{2}}{2N_0}=\\frac{E_b}{N_0},\\qquad P_e=Q\\bigl(\\sqrt{E_b/N_0}\\bigr)']},
{t:'p', text:'For example, $d=2$ and $N_0=0.5$ give $d^{2}/2N_0=4/1=4$, so $P_e=Q(2)=0.0228$.'},
{t:'p', text:'The figure below draws the two densities along the line for $d=2$ and $N_0=1$.'},
{t:'fig', svg:figBinary,
 cap:'Two equally likely points $d=2$ apart, with $N_0=1$. The red tail of the left density past the midpoint is $P_e=Q(\\sqrt2)=7.86\\times10^{-2}$.'},

{t:'h3', text:'Binary error with unequal priors'},
{t:'p', text:'With unequal priors the MAP boundary moves off the midpoint. Put $s_0$ and $s_1$ a distance $d$ apart, with the boundary a distance $\\mu$ from $s_1$.'},
{t:'eqbox', cap:'The boundary', tex:'\\mu=\\frac d2+\\frac{N_0}{2d}\\ln\\frac{P(s_1)}{P(s_0)}',
 after:'This is the shift $\\mu_i$ above, with $s_1$ in the place of $\\mathbf s_i$.'},
{t:'p', text:'If $s_0$ is sent, an error needs noise past $d-\\mu$. If $s_1$ is sent, it needs noise past $\\mu$. Weight each tail by its prior.'},
{t:'eqbox', cap:'Two tails', tex:'P_e=P(s_0)\\,Q\\!\\left(\\frac{d-\\mu}{\\sqrt{N_0/2}}\\right)+P(s_1)\\,Q\\!\\left(\\frac{\\mu}{\\sqrt{N_0/2}}\\right)',
 after:'Equal priors give $\\mu=d/2$ and the formula for two equally likely points.'},
{t:'p', text:'For example, take $d=2$, $N_0=0.5$ and $P(s_1)=0.9$. The boundary and the error follow in two steps.'},
{t:'eq', tex:'\\begin{aligned}\\mu&=1+\\frac{0.5}{4}\\ln\\frac{0.9}{0.1}=1+0.125(2.197)=1.27\\\\ P_e&=0.1\\,Q\\!\\left(\\frac{2-1.27}{0.5}\\right)+0.9\\,Q\\!\\left(\\frac{1.27}{0.5}\\right)\\\\&=0.1\\,Q(1.45)+0.9\\,Q(2.55)=0.0122\\end{aligned}'},
{t:'p', text:'The ML receiver keeps the midpoint and gets $Q(2)=0.0228$. So the MAP receiver has the smaller $P_e$.'},
{t:'fig', svg:figBinaryPriors,
 cap:'$s_0=-1$ and $s_1=+1$, so $d=2$, with $N_0=0.5$, drawn for $P(s_1)=0.9$. The boundary sits $\\mu=1.27$ from $s_1$, and the two red tails add up to $P_e=0.0122$.'},

/* ---------------------------------------------------------------- 4.4 ---- */

{t:'h3', text:'Decision regions around us'},
{t:'p', text:'Four everyday systems decide in regions cut by bisectors.'},
...gallery(GAL_REGIONS),
{t:'box', kind:'def', hd:'Nearest point', html:'In each system the receiver picks the signal point nearest to $\\mathbf r$. The regions are cut by perpendicular bisectors.'},
{t:'box', kind:'def', hd:'Outer regions', html:'Points on the edge of a constellation have unbounded regions. Noise can push them outward without an error.'},
{t:'box', kind:'warn', hd:'Scale', html:'The regions hold only if the receiver knows the scale of the points. A gain error moves every point and every boundary.'},
{t:'h2', num:'4.4', text:'Error probability and the union bound'},

{t:'h3', text:'The exact error probability'},
{t:'p', text:'The exact error probability adds, over the signals, the part of each Gaussian bell that falls outside its region.'},
{t:'eqbox', cap:'Exact error', tex:'P_e=\\sum_{i=1}^{M}P(\\mathbf s_i)\\int_{\\mathbf r\\notin R_i}f(\\mathbf r\\mid\\mathbf s_i)\\,d\\mathbf r',
 after:'Each term is the part of a Gaussian bell that falls outside a polygon.'},
{t:'box', kind:'warn', hd:'No closed form', html:'For most polygons this integral has no formula. It needs numerical integration or a simulation.'},
{t:'p', text:'A <b>simulation</b> sends many symbols, adds noise and counts the wrong decisions. About $100$ errors give a usable estimate. At $P_e=10^{-4}$ that takes about $100/10^{-4}=10^{6}$ symbols.'},
{t:'p', text:'Sometimes the integral is easy. In the five-point set of Section 4.3, send the centre with $\\sigma=0.4$. Its region is the square $|r_1|+|r_2|<1.2$, turned by $45^{\\circ}$.'},
{t:'p', text:'Turn the axes with the square. Each new noise component still has variance $\\sigma^{2}$. The region becomes $|u_1|<a$ and $|u_2|<a$, with half-width $a=1.2/\\sqrt2=0.849$.'},
{t:'eq', tex:'\\begin{aligned}P(\\text{error}\\mid\\text{centre})&=1-\\Bigl(1-2Q\\bigl(a/\\sigma\\bigr)\\Bigr)^{2}\\\\&=1-\\Bigl(1-2Q(2.12)\\Bigr)^{2}=0.067\\end{aligned}'},
{t:'p', text:'The figure below counts the draws that land outside the centre region.'},
{t:'fig', svg:figPe,
 cap:'The centre point of the five-point set is sent with $\\sigma=0.4$, drawn for $1000$ draws. The red draws fall outside its region, and their fraction settles near the exact $0.067$.'},

{t:'h3', text:'The union bound'},
{t:'p', text:'The union bound avoids the integral. Suppose $\\mathbf s_i$ was sent, and let $A_{ij}$ be the event that $\\mathbf r$ is nearer $\\mathbf s_j$ than $\\mathbf s_i$.'},
{t:'p', text:'An error happens when at least one $A_{ij}$ happens, so the error is the union of these events. The probability of a union is at most the sum of the probabilities.'},
{t:'eqbox', cap:'Pairwise events', tex:[
  'P(\\text{error}\\mid\\mathbf s_i)\\le\\sum_{j\\ne i}P(A_{ij})',
  'P(A_{ij})=Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)'],
 after:'Each $A_{ij}$ is a binary error between two points at distance $d_{ij}$. So its probability is the binary result of Section 4.3.'},
{t:'box', kind:'def', hd:'Overlaps counted twice', html:'The events overlap. The sum counts each overlap more than once, so it can only be larger than the true probability.'},
{t:'p', text:'Average over the signals with equal priors $1/M$. This gives the union bound, which needs only the distances between the points.'},
{t:'eqbox', cap:'Union bound', big:true, tex:'P_e\\le\\frac1M\\sum_{i=1}^{M}\\sum_{j\\ne i}Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)'},
{t:'p', text:'The figure below draws the three half-planes for $\\mathbf s_1=(1,1)$ of the square.'},
{t:'fig', svg:figUnion,
 cap:'$\\mathbf s_1=(1,1)$ is sent, and the grey dots are received points. Each red half-plane $A_{1j}$ is where $\\mathbf r$ is nearer $\\mathbf s_j$. The labels mark the parts the sum counts two or three times.'},
{t:'p', text:'For $\\mathbf s_1$ the bound has $M-1=3$ terms. Two are for the points at $d=2$, and one is for the diagonal point at $2\\sqrt2$.'},

{t:'h3', text:'The minimum-distance bound'},
{t:'p', text:'Every $d_{ij}$ is at least the smallest distance $d_{\\min}$, and $Q$ falls as its argument grows. So each term is at most the term at $d_{\\min}$.'},
{t:'eqbox', cap:'Minimum-distance bound', tex:'P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)',
 after:'Each of the $M$ signals has $M-1$ terms, each at most $Q\\bigl(\\sqrt{d_{\\min}^{2}/2N_0}\\bigr)$. The average over the $M$ signals leaves $M-1$ of them.'},
{t:'box', kind:'def', hd:'One number', html:'The bound needs only $M$ and the smallest distance. It is quick, and loose when few pairs sit at $d_{\\min}$.'},
{t:'p', text:'8-PSK puts $M=8$ points on a circle of radius $\\sqrt{E_s}$. The point $j$ steps away sits at $d_j=2\\sqrt{E_s}\\sin(\\pi j/8)$. With $E_s=1$, $d_{\\min}=2\\sin(\\pi/8)=2(0.383)=0.77$.'},
{t:'p', text:'Only two of the seven other points sit at $d_{\\min}$. So the bound, which puts all seven there, is loose.'},
{t:'p', text:'The figure below compares it with the union bound for 8-PSK. Each term uses $d_j^{2}/2N_0=(2E_s/N_0)\\sin^{2}(\\pi j/8)$.'},
{t:'fig', svg:figDmin,
 cap:'8-PSK. Solid: the union bound, the sum of all seven pairwise terms. Dashed: the minimum-distance bound, with every distance replaced by $d_{\\min}$. The dashed curve stays above.'},

{t:'h3', text:'An exponential bound'},
{t:'p', text:'The function $Q(x)$ has no closed form. A plain exponential sits above it for every $x\\ge0$.'},
{t:'eqbox', cap:'Exponential bound', tex:'Q(x)\\le\\tfrac12e^{-x^{2}/2},\\qquad x\\ge0'},
{t:'p', text:'Put $x^{2}=d_{\\min}^{2}/2N_0$ into the minimum-distance bound. Then $x^{2}/2=d_{\\min}^{2}/4N_0$.'},
{t:'eqbox', cap:'Applied to the bound', tex:'P_e\\le\\frac{M-1}{2}\\,e^{-d_{\\min}^{2}/4N_0}',
 after:'The error falls exponentially in $d_{\\min}^{2}/N_0$.'},
{t:'p', text:'For example, at $x=3$ the bound is $\\tfrac12e^{-4.5}=5.6\\times10^{-3}$ against $Q(3)=1.35\\times10^{-3}$. It is about $4.1$ times larger. The figure below draws both on a logarithmic axis.'},
{t:'fig', svg:figChernoff,
 cap:'Solid: $Q(x)$. Dashed: $\\tfrac12e^{-x^{2}/2}$, marked at $x=3$. The bound stays above $Q(x)$, and both fall with the same exponent.'},

{t:'h3', text:'The intelligent union bound'},
{t:'p', text:'To leave $R_i$, the point $\\mathbf r$ must cross one of the faces of $R_i$. So keep the terms for the points that share a face with $R_i$, a set written $F_i$. Drop the others.'},
{t:'eqbox', cap:'Intelligent union bound', tex:'P(\\text{error}\\mid\\mathbf s_i)\\le\\sum_{j\\in F_i}Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)',
 after:'The bound is tighter than the general union bound, and still a bound.'},
{t:'p', text:'In the square, the region of $\\mathbf s_1$ is the first quadrant. The figure below marks its two faces, shared with $\\mathbf s_2$ and $\\mathbf s_4$. So the bound keeps two terms and drops the term for $\\mathbf s_3$.'},
{t:'fig', svg:figIntel,
 cap:'The region of $\\mathbf s_1$ is the first quadrant. Its two faces, in red, are shared with $\\mathbf s_2$ and $\\mathbf s_4$. The bisector with $\\mathbf s_3$, dashed, only touches the corner.'},

{t:'h3', text:'Nearest neighbours'},
{t:'p', text:'At high SNR the terms at $d_{\\min}$ are far larger than the others. Keeping only those terms gives the nearest-neighbour form.'},
{t:'eqbox', cap:'Nearest neighbours', big:true, tex:'P_e\\approx\\bar N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)',
 after:'$\\bar N_{\\min}$ is the average number of neighbours at $d_{\\min}$, taken over the $M$ points.'},
{t:'box', kind:'warn', hd:'An approximation', html:'It keeps only part of the union bound, so it is not a bound. It can sit below the exact $P_e$.'},
{t:'p', text:'In QPSK on the square $(\\pm1,\\pm1)$, each point has two neighbours at $d_{\\min}=2$. The diagonal point is at $2\\sqrt2$, so $\\bar N_{\\min}=2$.'},
{t:'p', text:'In 16-QAM on the grid $\\pm1,\\pm3$, $d_{\\min}=2$. The four corners have two neighbours at $d_{\\min}$, the eight edge points three, and the four inner points four.'},
{t:'eq', tex:'\\bar N_{\\min}=\\frac{4(2)+8(3)+4(4)}{16}=\\frac{48}{16}=3'},
{t:'p', text:'The figure below joins every pair of neighbours in 16-QAM.'},
{t:'fig', svg:figNN,
 cap:'16-QAM on the grid $\\pm1,\\pm3$. Each line joins two neighbours at $d_{\\min}=2$, and each number counts the neighbours of its point.'},

{t:'ex', hd:'Example 4.5 — four forms on QPSK', rows:[
 ['Given','QPSK at $(\\pm1,\\pm1)$, equally likely, with $N_0=2/9$. So $d_{\\min}^{2}/2N_0=4/(4/9)=9$.'],
 ['Find','The general union bound, the intelligent bound, the nearest-neighbour form and the minimum-distance bound. Which is largest?'],
 ['Method','From $\\mathbf s_1=(1,1)$, two points are at $d=2$, which gives $x=\\sqrt9=3$. One is at $2\\sqrt2$, which gives $x=\\sqrt{8/(4/9)}=\\sqrt{18}=4.24$. The region of $\\mathbf s_1$ is a quadrant with two faces, and all four points are alike. $$Q(3)=1.35\\times10^{-3},\\qquad Q(4.24)=1.1\\times10^{-5}$$'],
 ['Solution','$$\\begin{aligned}\\text{general}&=2Q(3)+Q(4.24)=2.71\\times10^{-3}\\\\ \\text{intelligent}=\\text{nearest}&=2Q(3)=2.70\\times10^{-3}\\\\ d_{\\min}\\text{ bound}&=3Q(3)=4.05\\times10^{-3}\\end{aligned}$$ The minimum-distance bound is the largest. It counts three terms at $Q(3)$, and the others count two plus a tiny diagonal term.'],
 ['Check','The regions are quadrants, so each noise component acts on its own. The exact value is $1-\\bigl(1-Q(3)\\bigr)^{2}=2.70\\times10^{-3}$. The diagonal term adds only $0.4\\%$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\bar N_{\\min}=2$, not $3$. The diagonal point is at $2\\sqrt2$, not at $d_{\\min}=2$.'},
{t:'p', text:'The figure below shows the nearest neighbours of $\\mathbf s_1$ in Example 4.5.'},
{t:'fig', svg:figExUnion,
 cap:'Example 4.5 from $\\mathbf s_1$. The dashed circle of radius $d_{\\min}$ passes through the two nearest neighbours. The minimum-distance bound moves the diagonal point in to $d_{\\min}$, ringed.'},

{t:'ex', hd:'Example 4.6 — a rectangle', rows:[
 ['Given','Four equally likely points $(\\pm1.5,\\pm1)$ with $N_0=0.4$.'],
 ['Find','The intelligent bound and the nearest-neighbour form. Which point shares a face with $\\mathbf s_1=(1.5,1)$ but is not a nearest neighbour?'],
 ['Method','From $\\mathbf s_1$ the others are at $3$, $2$ and $\\sqrt{13}$. The region of $\\mathbf s_1$ is the first quadrant, and its faces are shared with the points at $3$ and $2$. Each $Q$ argument is $d/\\sqrt{2N_0}=d/\\sqrt{0.8}$. $$d=2:\\ Q(2.24)=1.27\\times10^{-2},\\qquad d=3:\\ Q(3.35)=4.0\\times10^{-4}$$'],
 ['Solution','$$\\begin{aligned}\\text{intelligent}&=Q(2.24)+Q(3.35)=1.31\\times10^{-2}\\\\ \\text{nearest}&=\\bar N_{\\min}\\,Q(2.24)=1.27\\times10^{-2}\\end{aligned}$$ Each point has one neighbour at $d_{\\min}=2$, so $\\bar N_{\\min}=1$. The point $(-1.5,1)$ shares the face $r_1=0$ but sits at $3$, more than $d_{\\min}$.'],
 ['Check','The regions are quadrants, so the exact value is $1-\\bigl(1-Q(3.35)\\bigr)\\bigl(1-Q(2.24)\\bigr)=1.31\\times10^{-2}$. The nearest-neighbour form is $3\\%$ below it, so it is not a bound.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $Q(2.24)+Q(3.35)$ for both faces, not only $Q(2.24)$ for the nearest neighbour.'},
{t:'p', text:'The figure below marks the faces and the nearest neighbour of $\\mathbf s_1$ in Example 4.6.'},
{t:'fig', svg:figExUnionB,
 cap:'Example 4.6. The two red faces of $R_1$ are shared with the points at $3$ and $2$. The dashed circle of radius $d_{\\min}=2$ passes through one nearest neighbour, ringed.'},

{t:'h3', text:'Tightness of the bounds'},
{t:'p', text:'The bounds differ most at low SNR. Many terms are then large, and they overlap.'},
{t:'box', kind:'def', hd:'Low SNR', html:'The union bound can pass $1$ and then tells nothing. For 16-QAM with $E_s=10$ at $E_s/N_0=0$ dB, it adds $15$ heavily overlapping terms and gives $2.79$.'},
{t:'box', kind:'ok', hd:'High SNR', html:'The terms at $d_{\\min}$ dominate. The union bound, the nearest-neighbour form and the simulation meet.'},
{t:'box', kind:'warn', hd:'The minimum-distance bound', html:'It counts all $15$ other points at $d_{\\min}$, five times the $\\bar N_{\\min}=3$ of 16-QAM. So it stays five times too high.'},
{t:'p', text:'The figure below compares the three forms with a simulation for 16-QAM.'},
{t:'fig', svg:figTightness,
 cap:'16-QAM with $E_s=10$, marked at $E_s/N_0=6$ dB. Solid red: the union bound. Dotted red: the minimum-distance bound. Dashed violet: the nearest-neighbour form. Green dots: a simulation of $20\\,000$ symbols. The dashed line at the top is $P_e=1$.'},

/* ---------------------------------------------------------------- 4.5 ---- */

{t:'h3', text:'Error probability around us'},
{t:'p', text:'Wi-Fi, LTE and 5G use the nearest-neighbour form and the union bound, and a tester measures the error rate.'},
...gallery(GAL_UNION),
{t:'box', kind:'def', hd:'Nearest neighbours first', html:'At useful error rates the terms at $d_{\\min}$ dominate. Designers quote $\\bar N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$.'},
{t:'box', kind:'def', hd:'A target error rate', html:'A link fixes a target such as $10^{-3}$. Each constellation then needs its own $E_s/N_0$.'},
{t:'box', kind:'warn', hd:'Few errors', html:'An error rate measured from a few errors is noisy. A tester waits for about $100$ errors.'},
{t:'h2', num:'4.5', text:'Summary'},

{t:'h3', text:'From waveform to error rate'},
{t:'p', text:'The figure below follows one symbol through the receiver and then repeats it.'},
{t:'fig', svg:figChain,
 cap:'One symbol through the receiver: $r(t)$, the correlator outputs $c_1$ and $c_2$, and the regions of four points $(\\pm1,\\pm0.6)$. The $200$ repeats with $\\sigma=0.3$ estimate $P_e$, and the wrong ones are red.'},
{t:'p', text:'The receiver of this chapter makes four moves.'},
{t:'ol', items:[
 'Correlate $r(t)$ with the basis to get $\\mathbf r$.',
 'Pick the best metric: the nearest point for equal priors.',
 'Read the regions from the bisectors.',
 'Bound $P_e$ from the distances.']},
{t:'p', text:'Each modulation of Chapter 5 is a constellation. Its error rate follows from its distances and this receiver.'},
{t:'p', text:'For example, take QPSK with $d_{\\min}^{2}/2N_0=16$. Here $\\bar N_{\\min}=2$ and $Q(4)=3.17\\times10^{-5}$, so the nearest-neighbour form gives $P_e\\approx6.3\\times10^{-5}$.'},

{t:'h3', text:'Quick check'},
{t:'q', n:1, text:'A set of $M=32$ signals. How many bits does each symbol carry?', ans:'$5$ bits, since $\\log_232=5$.'},
{t:'q', n:2, text:'$N_0=0.4$. What is the noise variance of each correlator output?', ans:'$N_0/2=0.2$.'},
{t:'q', n:3, text:'$\\mathbf r=(0.2,0.9)$, with $(0,1)$ and $(1,0)$ equally likely. Which point does the receiver pick?', ans:'$(0,1)$. The squared distances are $0.05$ and $1.45$, and the smaller wins.'},
{t:'q', n:4, text:'$P(\\mathbf s_1)$ rises. Which way does the boundary between $\\mathbf s_1$ and $\\mathbf s_2$ move?', ans:'Away from $\\mathbf s_1$. A likely point gets a larger region, so the line moves toward $\\mathbf s_2$.'},
{t:'q', n:5, text:'Two equally likely points, $d=2$ and $N_0=2$. What is $P_e$?', ans:'$Q(1)$, since $d^{2}/2N_0=4/4=1$.'},
{t:'q', n:6, text:'A set of $M=8$ points. For one sent point, how many terms does the general union bound have?', ans:'$7$ terms, one for each other point, $M-1=7$.'},

{t:'h3', text:'Summary of results'},
{t:'table', cap:'Summary of Chapter 4: the optimal receiver in additive white Gaussian noise.', head:['Result','Statement','Anchor'], rows:[
 ['Bits and symbols','$k=\\log_2M$, so $R_b=kR_s$ and $T_b=T/k$','PS CH8.4'],
 ['Correlator bank','$\\mathbf r=\\mathbf s_i+\\mathbf n$, with $r_j=\\int_0^{T}r(t)\\,\\psi_j(t)\\,dt$','PS CH8.4.1'],
 ['Matched filter','the same number at the sampling time $t=T$, with impulse response $\\psi_j(T-t)$','PS CH8.4.1'],
 ['Noise outside the signal space','does not depend on the signal and adds the same $\\|n\'\\|^{2}$ to every distance','PS CH8.4.1'],
 ['Noise components','independent Gaussians with mean $0$ and variance $N_0/2$. The cloud is round','PS CH8.4.1'],
 ['MAP and ML','MAP maximises $P(\\mathbf s_i)\\,f(\\mathbf r\\mid\\mathbf s_i)$. With equal priors it is ML','PS CH8.4.1'],
 ['Minimum distance','ML in Gaussian noise. MAP subtracts $N_0\\ln P(\\mathbf s_i)$ from each squared distance','PS CH8.4.1'],
 ['Correlation metric','$\\mathbf r\\cdot\\mathbf s_i-E_i/2+\\frac{N_0}{2}\\ln P(\\mathbf s_i)$. Keep the largest','PS CH8.4.1'],
 ['Decision regions','convex polygons cut by bisectors. Unequal priors shift each line toward the less likely point','PS CH8.4.1'],
 ['Binary error','$Q\\bigl(\\sqrt{d^{2}/2N_0}\\bigr)$ for equal priors','PS CH8.3.3, 8.4.2'],
 ['Union bound','$P_e\\le\\frac1M\\sum_i\\sum_{j\\ne i}Q\\bigl(\\sqrt{d_{ij}^{2}/2N_0}\\bigr)$. The intelligent bound keeps only faces','PS CH8.4.2'],
 ['Nearest neighbours','$\\bar N_{\\min}Q\\bigl(\\sqrt{d_{\\min}^{2}/2N_0}\\bigr)$. Close at high SNR, but not a bound','']
]},
{t:'p', text:'Correlate to get $\\mathbf r$, pick the best metric, and bound $P_e$ from the distances. Chapter 5 uses this receiver for every modulation.'},

{t:'h3', text:'Projects to try'},
{t:'p', text:'Four optional projects use the chapter on simulated signals. Each gives an aim, what it practises, a few steps and what to look for.'},
{t:'box', kind:'def', hd:'A correlation receiver from samples', html:'Build the whole receiver for QPSK from sampled waveforms and measure how often it is wrong.<br><b>Practises:</b> correlators computed as sums over samples. Scaling noise to a chosen $N_0$. Counting errors to estimate $P_e$.<ol><li>Build two carrier basis functions over one symbol at $100$ samples.</li><li>Send random QPSK symbols and add Gaussian noise of variance $N_0/2$ to each sample, scaled for the sample spacing.</li><li>Correlate, pick the nearest point and count the errors.</li><li>Repeat at several $N_0$ and plot $P_e$ on a log axis.</li></ol><b>Look for:</b> the measured points follow $2Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ once enough errors are counted.'},
{t:'box', kind:'def', hd:'MAP against ML', html:'See how much a receiver gains by knowing the priors.<br><b>Practises:</b> the MAP threshold for a binary link. Why the gain grows as the priors become uneven. What happens when the assumed priors are wrong.<ol><li>Send antipodal bits with $P(s_1)=p$ for several $p$ from $0.5$ to $0.95$.</li><li>Decide each with the midpoint and with the MAP threshold.</li><li>Plot both error rates against $p$.</li><li>Decide with a threshold built for the wrong $p$.</li></ol><b>Look for:</b> the two receivers agree at $p=0.5$. The MAP receiver pulls ahead as $p$ grows, and a wrong prior can do worse than ML.'},
{t:'box', kind:'def', hd:'Decision regions on a grid', html:'Draw the regions of any constellation by deciding every point of a fine grid.<br><b>Practises:</b> minimum distance as a rule you can run anywhere. How priors move the boundaries. Why the regions are convex polygons.<ol><li>Pick a constellation of five to eight points.</li><li>Decide every point of a $400\\times400$ grid and colour it by the answer.</li><li>Give one point a larger prior and redraw.</li><li>Compare the boundaries with the perpendicular bisectors.</li></ol><b>Look for:</b> every boundary is a straight line. A larger prior pushes its point\'s boundaries outward, parallel to themselves.'},
{t:'box', kind:'def', hd:'Tightness of the union bound', html:'Compare the union bound and its variants with a simulation across SNR.<br><b>Practises:</b> the general and intelligent union bounds. The nearest-neighbour form. Where each is close to the truth.<ol><li>Take 8-PSK and 16-QAM at unit average energy.</li><li>Compute every bound from the pairwise distances.</li><li>Simulate at SNR from $0$ to $20$ dB.</li><li>Plot all on one log axis and read the gap at each SNR.</li></ol><b>Look for:</b> at low SNR the general bound can pass $1$. At high SNR all the curves close in on the simulation.'}

];
})();
