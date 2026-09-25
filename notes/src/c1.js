/* Course notes — front matter and Chapter 1.

   The front matter lives here because chapter 1 is the first chapter file the
   builder finds. It moves to `c0.js` when the course opening is written.
   The contents lists the chapters that exist; it grows as they are added.

   Chapter 1 carries the teaching slides of Module 1 in their order, one h3 to a
   slide, with the step each slide leaves out written back in. Every figure
   below is drawn from the same data as the slide figure it stands for; a
   slider or a frame sequence is shown at one state, which the caption names. */
(function(){
const P=PLOT, C=P.COL;

/* ---- the canvas and the shared shapes of the module --------------------- */
const SZ  = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
/* A slide figure is drawn for a column of the stage; on the page it is set
   narrower than the text so that its labels keep a readable size. */
const narrow = (s, pct) => `<div style="max-width:${pct}%;margin:0 auto">${s}</div>`;
const sinc = x => Math.abs(x)<1e-9 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
const wfmt = v => Math.abs(v)<1e-9 ? '0' : (v===1?'':v===-1?'-':P.fmt(v,2))+'W';
const tri = (f,W,h) => Math.abs(f) < W ? h*(1-Math.abs(f)/W) : 0;
const copy = (a, c, W, peak, opts) => a.poly([[c-W,0],[c,peak],[c+W,0]], opts);
const g = t => 0.85*Math.sin(1.15*t) + 0.35*Math.sin(2.7*t + 0.8);
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const clamp01 = x => Math.max(0, Math.min(1, x));
function seeded(seed){
  let a = seed>>>0;
  return () => { a = (a + 0x6D2B79F5)>>>0; let t = a;
    t = Math.imul(t ^ t>>>15, t | 1); t ^= t + Math.imul(t ^ t>>>7, t | 61);
    return ((t ^ t>>>14)>>>0)/4294967296; };
}
/* A grey picture w x h drawn from f(i,j) in [0,1], as a PNG data URI. */
const PIX = {};
function pixels(key, w, h, f){
  if(PIX[key]) return PIX[key];
  if(typeof document==='undefined') return '';
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), im = x.createImageData(w, h);
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){
    const v = Math.max(0, Math.min(255, Math.round(255*f(i,j)))), k = 4*(j*w+i);
    im.data[k] = im.data[k+1] = im.data[k+2] = v; im.data[k+3] = 255;
  }
  x.putImageData(im, 0, 0);
  return (PIX[key] = c.toDataURL('image/png'));
}
const picture = (url, x, y, w, h, sharp) =>
  `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${sharp?' style="image-rendering:pixelated"':''}/>`
  + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.rule}" stroke-width="1"/>`;

/* ---- 1.1 the sampling theorem ------------------------------------------- */
/* Frame 2 of the slide: the message, the train behind it, and the product. */
function figSamplingStack(){
  const a = P.Axes(SZ({xr:[-0.4,10.4], yr:[-1.45,1.9], xlabel:'t',
    pad:{l:50,r:26,t:24,b:42}, xtarget:6, ytarget:4}));
  a.curve(g, {color:C.in});
  for(let n=0;n<=10;n++) a.impulse(n, 1, {color:C.h, label:false, opacity:0.4});
  a.span(4, 5, 1.28, 'T_s', {tex:true, fs:13, color:C.h});
  for(let n=0;n<=10;n++) a.impulse(n, g(n), {color:C.mid, label:false});
  return a.svg();
}
function figSpectrumPair(){
  const W = 1, fs = 3, top = fs;
  const common = {w:600, xr:[-3.3*W,3.3*W], xlabel:'f', xtarget:6,
                  pad:{l:52,r:26,t:22,b:40}, ytickfmt:()=>''};
  const sgn = v => v<0 ? '-' : '';
  const a = P.Axes(Object.assign({}, common, {h:170, yr:[-0.12,1.34],
    ylabel:'G(f)', ytarget:2, xticksOverride:[-W,W], xtickfmt:v=>sgn(v)+'W'}));
  copy(a, 0, W, 1, {color:C.in, width:2.4});
  const b = P.Axes(Object.assign({}, common, {h:230, yr:[-0.12*top,1.28*top],
    ylabel:'G_\\delta(f)', ytarget:3, xticksOverride:[-fs,-W,W,fs],
    xtickfmt:v=>sgn(v)+(Math.abs(Math.abs(v)-fs)<1e-9 ? 'f\u209b' : 'W')}));
  for(let n=-3;n<=3;n++) copy(b, n*fs, W, fs, {color:C.mid,width:2.2});
  return a.svg() + b.svg();
}
/* The last frame of the slide: the scaled message and the copies at +-f_s, +-2f_s. */
function figSpectrumBuild(){
  const W = 1, fs = 2.4;
  const a = P.Axes(SZ({xr:[-6,6], yr:[-0.12*fs,1.32*fs], xlabel:'f', ylabel:'G_\\delta(f)',
    xticksOverride:[-2*fs,-fs,fs,2*fs], ytickfmt:()=>'',
    xtickfmt:x=>{ const n=Math.round(x/fs); return (n===1?'':n===-1?'-':n)+'f\u209b'; }}));
  copy(a, 0, W, 1, {color:C.in, width:1.6, dash:'5 5'});
  a.note(0.35, 1.02, 'G(f)', {tex:true, fs:14, color:C.in});
  copy(a, 0, W, fs, {color:C.mid, width:2.4});
  for(let m=1;m<=2;m++) for(const s of [-1,1]) copy(a, s*m*fs, W, fs, {color:C.mid, width:2.4});
  a.note(0, 1.12*fs, 'f_s\\,G(f)', {tex:true, fs:14, color:C.mid, anchor:'middle'});
  return a.svg();
}
/* The sampled spectrum at f_s = r W: a guard band above 2W, copies that touch
   at 2W, red overlaps below it. */
function figCaseAt(fs){
  const W = 1;
  const a = P.Axes(SZ({xr:[-4.4,4.4], yr:[-0.12*fs,1.34*fs], xlabel:'f', ylabel:'G_\\delta(f)',
    xtarget:8, xtickfmt:wfmt, ytickfmt:()=>''}));
  const nyq = Math.abs(fs-2*W) < 1e-6;
  if(fs < 2*W - 1e-6){
    for(let n=-4;n<=3;n++){
      const lo = (n+1)*fs - W, hi = n*fs + W;
      a.area(f=>Math.min(fs*tri(f-n*fs,W,1), fs*tri(f-(n+1)*fs,W,1)), lo, hi,
             {color:C.dec.err, stroke:C.err});
    }
    const pk = fs*(1 - fs/(2*W));
    a.note(fs/2, 1.14*fs, '\\text{aliasing}', {tex:true, fs:13, color:C.err, anchor:'middle'});
    a.poly([[fs/2, 1.07*fs],[fs/2, pk + 0.1*fs]], {color:C.err, width:1, dash:'3 3'});
  }
  for(let n=-4;n<=4;n++) copy(a, n*fs, W, fs, {color:C.mid, width:2.2});
  if(fs > 2*W + 1e-6){
    const lab = fs - 2*W >= 0.45;
    for(const c of [-1,1])
      a.span(c*W, c*(fs-W), 0.16*fs, c>0 && lab ? '\\text{guard band}' : null, {tex:true, fs:12, color:C.muted});
  }
  if(nyq) a.point(W, 0, {color:C.mid, r:4.5});
  const name = nyq ? '\\text{Nyquist rate}' : fs > 2*W ? '\\text{oversampling}' : '\\text{undersampling}';
  a.note(-4.2, 1.2*fs, name, {tex:true, fs:14, color:fs < 2*W-1e-6 ? C.err : C.muted});
  return a.svg();
}
/* A zone plate: rings whose spatial frequency grows with the radius. */
const ZONE_A = 84;
const zone = (u,v) => 0.5 + 0.5*Math.cos(Math.PI*ZONE_A*(u*u+v*v));
function figMoire(N){
  const S = 270, x2 = 330, cx = x2+S/2, cy = S/2;
  const fine = pixels('zone512', 512, 512, (i,j)=>zone((i+0.5)/512-0.5, (j+0.5)/512-0.5));
  const smp  = pixels('zone'+N, N, N, (i,j)=>zone((i+0.5)/N-0.5, (j+0.5)/N-0.5));
  const ra = N/(2*ZONE_A)*S, id = 'nmoclip'+N;
  const ring = `<clipPath id="${id}"><rect x="${x2}" y="0" width="${S}" height="${S}"/></clipPath>
      <circle cx="${cx}" cy="${cy}" r="${ra.toFixed(1)}" fill="none" stroke="${C.plate}" stroke-width="6" clip-path="url(#${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${ra.toFixed(1)}" fill="none" stroke="${C.err}" stroke-width="3" stroke-dasharray="8 5" clip-path="url(#${id})"/>`;
  const lab = (t, x) => P.texName(t, {xMid:x, baseline:S+32, size:16, color:C.ink, figW:600});
  return `<svg viewBox="0 0 600 ${S+44}" xmlns="http://www.w3.org/2000/svg" role="img">`
    + picture(fine, 0, 0, S, S, false) + picture(smp, x2, 0, S, S, true) + ring
    + lab('\\text{the scene}', S/2) + lab(`${N}\\times${N}\\text{ samples}`, cx) + '</svg>';
}

/* ---- 1.2 reconstruction ------------------------------------------------- */
function figLpf(){
  const W = 1, fs = 2.6, e = fs - W, top = 1.12*fs;
  const a = P.Axes(SZ({xr:[-4.2,4.2], yr:[-0.12*fs,1.4*fs], xlabel:'f',
    xtarget:8, xtickfmt:wfmt, ytickfmt:()=>''}));
  for(let n=-2;n<=2;n++) copy(a, n*fs, W, fs, {color:C.mid, width:2.2});
  a.poly([[-4.2,0],[-e,0],[-W,top],[W,top],[e,0],[4.2,0]], {color:C.slate, width:1.5, dash:'6 5'});
  a.poly([[-4.2,0],[-W,0],[-W,top],[W,top],[W,0],[4.2,0]], {color:C.h, width:2.4});
  a.span(-e, -W, 1.24*fs, '\\text{transition band}', {tex:true, fs:12, color:C.muted});
  return a.svg();
}
function figSinc(){
  const a = P.Axes(SZ({xr:[-3.6,3.6], yr:[-0.42,1.30], xlabel:'t', ylabel:'h(t)',
    xticksOverride:[-3,-2,-1,1,2,3], xtickfmt:()=>'', ytarget:3, ytickfmt:()=>''}));
  a.curve(t=>sinc(t), {color:C.h, width:2.4});
  for(let n=-3;n<=3;n++) if(n) a.point(n, 0, {color:C.h, r:3.6});
  a.span(2, 3, -0.30, '\\tfrac{1}{2W}', {tex:true, fs:13, color:C.h});
  a.note(0.14, 1.14, '\\operatorname{sinc}(2Wt)', {tex:true, fs:14, color:C.h});
  return a.svg();
}
/* The resting state of the slide: every term dashed, the sum, the samples. */
function figInterp(){
  const a = P.Axes(SZ({xr:[-0.4,8.4], yr:[-1.5,1.95], xlabel:'t',
    pad:{l:50,r:26,t:24,b:42}, xtarget:6, ytarget:4}));
  for(let n=0;n<=8;n++) a.curve(t=>g(n)*sinc(t-n), {color:C.mid, width:1.1, opacity:0.55, dash:'3 3'});
  a.curve(t=>{ let s=0; for(let n=-6;n<=14;n++) s += g(n)*sinc(t-n); return s; }, {color:C.out, width:2.6});
  for(let n=0;n<=8;n++) a.point(n, g(n), {color:C.in, r:3.8});
  a.note(0.15, 1.45, '\\text{one shifted }\\operatorname{sinc}\\text{ per sample}', {tex:true, fs:13, color:C.mid});
  return a.svg();
}
/* Frame 3 of the slide: the terms n = 1, ..., 7 and their partial sum. */
function figInterpBuild(){
  const set = [1,2,3,4,5,6,7];
  const a = P.Axes(SZ({xr:[-0.4,8.4], yr:[-1.5,1.95], xlabel:'t',
    pad:{l:50,r:26,t:24,b:42}, xtarget:6, ytarget:4}));
  a.curve(g, {color:C.in, width:1.4, dash:'4 6', opacity:0.55});
  for(const n of set) a.curve(t=>g(n)*sinc(t-n), {color:C.mid, width:1.2, opacity:0.7, dash:'3 3'});
  a.curve(t=>{ let s=0; for(const n of set) s += g(n)*sinc(t-n); return s; }, {color:C.out, width:2.6});
  for(let n=0;n<=8;n++) a.point(n, g(n), {color:C.in, r:3.8});
  return a.svg();
}
/* Example 1.1: the last frame, f_s = 90 kHz, and the answer to part (c). */
function figNyquistEx(){
  const fs = 90;
  const a = P.Axes(SZ({xr:[-140,140],yr:[-0.1,1.4],xlabel:'f\\;(\\text{kHz})',ylabel:'X_\\delta(f)',
    xticksOverride:[-fs,-40,40,fs],ytickfmt:()=>''}));
  copy(a,0,40,1,{color:C.mid,width:2.2});
  for(const c of [-fs,fs]) copy(a,c,40,1,{color:C.mid,width:2.2});
  a.span(40,fs-40,0.22,'f_g=10',{tex:true,fs:13,color:C.muted});
  return a.svg();
}
function figModulated(){
  const a = P.Axes(SZ({xr:[-100,100],yr:[-0.1,1.25],xlabel:'f\\;(\\text{kHz})',ylabel:'Y(f)',
    xticksOverride:[-80,-40,0,40,80],ytickfmt:()=>''}));
  a.poly([[-40,0],[0,1],[40,0]],{color:C.ink,width:1.6,dash:'6 5'});
  a.note(4,1.05,'X(f)',{tex:true,fs:14,color:C.ink});
  for(const c of [-40,40]) copy(a,c,40,0.5,{color:C.in,width:2.4});
  a.note(84,0.6,'Y(f)',{tex:true,fs:14,color:C.in,anchor:'end'});
  return a.svg();
}

/* ---- 1.3 quantization --------------------------------------------------- */
function figQuantizer(kind){
  const L = 8, D = 1, half = L*D/2;
  const rise  = m => Math.max(-half+D/2, Math.min(half-D/2, (Math.floor(m/D)+0.5)*D));
  const tread = m => Math.max(-half+D, Math.min(half-D, Math.round(m/D)*D));
  const q = kind==='midrise' ? rise : tread;
  const a = P.Axes(SZ({xr:[-half,half], yr:[-half,half], xlabel:'m', ylabel:'v=\\mathbb{Q}(m)',
    xtarget:8, ytarget:8}));
  a.poly([[-half,-half],[half,half]], {color:C.rule, width:1.2, dash:'3 4'});
  const pts=[];
  for(let i=0;i<=1600;i++){ const m=-half+2*half*i/1600; pts.push([m,q(m)]); }
  a.poly(pts, {color:C.mid, width:2.4});
  a.note(-half+0.25, half-0.6, kind==='midrise'?'mid-rise':'mid-tread', {fs:15, color:C.mid, weight:600});
  return a.svg();
}
/* The last frame of the slide: all eight samples and the eighth on the staircase. */
const walkM = t => 2.3*Math.sin(2*Math.PI*(t-1)/9+2.2) + 0.6*Math.sin(2*Math.PI*(t-1)/4);
const walkQ = m => Math.max(-3, Math.min(3, Math.round(m)));
function figQuantWalk(){
  const f = 8, mp = walkM(f), vp = walkQ(mp);
  const a = P.Axes({w:600, h:200, xr:[-0.2,8.4], yr:[-3.6,3.6], xlabel:'t/T_s', ylabel:'m(t),\\;v[n]',
    pad:{l:56,r:26,t:24,b:40}, xtarget:9, ytarget:8});
  for(let k=-3;k<=3;k++) a.hline(k, {color:C.rule, dash:'2 5', opacity:0.9});
  a.curve(walkM, {color:C.in, width:2});
  a.vline(f, {color:C.muted});
  for(let n=1;n<=f;n++){ const m = walkM(n), q = walkQ(m);
    a.poly([[n,m],[n,q]], {color:C.mid, width:1.4, dash:'3 3'});
    a.point(n, m, {color:C.in, r:4}); a.point(n, q, {color:C.mid, r:4.6}); }
  a.point(f, mp, {color:C.in, r:5.4});
  const b = P.Axes({w:600, h:270, xr:[-3.8,3.8], yr:[-3.8,3.8], xlabel:'m', ylabel:'v=\\mathbb{Q}(m)',
    pad:{l:56,r:26,t:26,b:40}, xtarget:8, ytarget:8});
  b.poly([[-3.8,-3.8],[3.8,3.8]], {color:C.rule, width:1.2, dash:'3 4'});
  const pts=[]; for(let i=0;i<=1520;i++){ const m=-3.8+7.6*i/1520; pts.push([m,walkQ(m)]); }
  b.poly(pts, {color:C.mid, width:2.4});
  b.poly([[mp,0],[mp,vp]], {color:C.in, width:1.6, dash:'4 4'});
  b.poly([[mp,vp],[0,vp]], {color:C.mid, width:1.6, dash:'4 4'});
  b.point(mp, 0, {color:C.in, r:5.4}); b.point(0, vp, {color:C.mid, r:5.4});
  b.note(1.1, -2.2, `m=${mp.toFixed(2)}`, {tex:true, fs:16, color:C.in});
  b.note(1.1, -3.2, `v=${vp}`, {tex:true, fs:16, color:C.mid});
  return `<svg viewBox="0 0 600 470" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,200)}${place(b.svg(),0,200,600,270)}</svg>`;
}
/* The Gaussian density and tail; erf in the Abramowitz–Stegun rational form. */
function erf(x){ const s = x<0?-1:1; x = Math.abs(x); const t = 1/(1+0.3275911*x);
  return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x)); }
const phi = x => Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
const Phi = x => 0.5*(1+erf(x/Math.SQRT2));
/* The optimal four-level quantizer of a unit Gaussian: the two conditions
   applied in turn until they agree. */
function lloydMax(L){
  const b = [-Infinity]; for(let k=1;k<L;k++) b.push(-2+4*k/L); b.push(Infinity);
  let v = [];
  for(let it=0; it<300; it++){
    v = []; for(let k=0;k<L;k++) v.push((phi(b[k])-phi(b[k+1]))/(Phi(b[k+1])-Phi(b[k])));
    for(let k=1;k<L;k++) b[k] = (v[k-1]+v[k])/2;
  }
  return {b, v};
}
function figRegions(){
  const {b, v} = lloydMax(4), X = 2.8;
  const a = P.Axes(SZ({xr:[-X,X], yr:[-2.1,2.1], xlabel:'m', ylabel:'\\mathbb{Q}(m)',
    xticksOverride:[-2,-1,0,1,2], yticksOverride:[-2,-1,0,1,2]}));
  a.poly([[-X,-X],[X,X]], {color:C.muted, width:1.2, dash:'4 4'});
  for(let k=1;k<4;k++){ a.vline(b[k], {color:C.muted, dash:'4 4'});
    a.note(b[k], 1.85, `m_{${k}}`, {tex:true, fs:14, color:C.muted, dx:5}); }
  const pts = [[-X, v[0]]];
  for(let k=1;k<4;k++) pts.push([b[k], v[k-1]], [b[k], v[k]]);
  pts.push([X, v[3]]);
  a.poly(pts, {color:C.in, width:2.4});
  v.forEach((x,k)=>{ a.point(x, x, {color:C.mid, r:5});
    a.note(x, x+0.16, `v_{${k+1}}`, {tex:true, fs:14, color:C.mid, anchor:'end', dx:-8}); });
  return a.svg();
}
/* A smooth random signal of unit power, and the SQNR of a unit Gaussian
   through an L-level mid-rise quantizer on [-V, V] (Simpson's rule). */
const GSIG = (()=>{ const r = seeded(7040), K = 12, c = [];
  for(let k=0;k<K;k++) c.push([0.6+2.4*r(), 2*Math.PI*r()]);
  const amp = Math.sqrt(2/K);
  return t => { let s = 0; for(const [w,p] of c) s += Math.cos(w*t+p); return amp*s; }; })();
function gaussSqnr(V, L){
  const D = 2*V/L, q = x => Math.max(-V+D/2, Math.min(V-D/2, (Math.floor(x/D)+0.5)*D));
  const n = 6000, a = -9, h = 18/n; let s = 0;
  for(let i=0;i<=n;i++){ const x = a+i*h, w = (i===0||i===n) ? 1 : (i%2 ? 4 : 2); s += w*(x-q(x))**2*phi(x); }
  return -10*Math.log10(s*h/3);
}
/* The slider at its first position, m_max = sigma. */
function figOverload(){
  const V = 1, L = 8, D = 2*V/L;
  const q = m => Math.max(-V+D/2, Math.min(V-D/2, (Math.floor(m/D)+0.5)*D));
  const a = P.Axes({w:600, h:236, xr:[0,12], yr:[-3.2,4.4], xlabel:'t', ylabel:'m(t)',
    pad:{l:54,r:26,t:24,b:40}, xtarget:6, yticksOverride:[-3,-2,-1,0,1,2,3]});
  a.hline(V, {color:C.err, dash:'5 4', opacity:0.9}); a.hline(-V, {color:C.err, dash:'5 4', opacity:0.9});
  a.curve(GSIG, {color:C.in, n:1400});
  const pts = []; for(let i=0;i<=2400;i++){ const t = 12*i/2400; pts.push([t, q(GSIG(t))]); }
  a.poly(pts, {color:C.mid, width:1.9});
  let seg = [];
  for(let i=0;i<=2400;i++){ const t = 12*i/2400, x = GSIG(t);
    if(Math.abs(x) > V){ seg.push([t, x]); }
    else if(seg.length){ a.poly(seg, {color:C.err, width:3.4}); seg = []; } }
  if(seg.length) a.poly(seg, {color:C.err, width:3.4});
  const pts2 = []; let best = [0,-1];
  for(let U=0.4; U<=4.0001; U+=0.02){ const s = gaussSqnr(U, 8); pts2.push([U, s]); if(s > best[1]) best = [U, s]; }
  const b = P.Axes({w:600, h:214, xr:[0.4,4], yr:[0,16], xlabel:'m_{\\max}/\\sigma', ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',
    pad:{l:62,r:26,t:24,b:44}, xticksOverride:[0.5,1,1.5,2,2.5,3,3.5,4], yticksOverride:[0,5,10,15]});
  b.vline(best[0], {color:C.muted, dash:'4 4'});
  b.poly(pts2, {color:C.mid, width:2.3});
  const s = gaussSqnr(V, L);
  b.point(V, s, {color:C.mid, r:5.5});
  b.note(V + 0.08, s - 2.6, s.toFixed(2)+'\\ \\mathrm{dB}', {tex:true, fs:15, color:C.mid, anchor:'start'});
  return `<svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,236)}${place(b.svg(),0,236,600,214)}</svg>`;
}

/* ---- 1.4 quantization noise and SQNR ------------------------------------ */
/* The slider at its first position, m = 0.7 Delta. */
function figErrBound(){
  const p = 0.7;
  const Q = m => Math.max(-1.5, Math.min(1.5, Math.floor(m)+0.5));
  const k0 = Math.max(-2, Math.min(1, Math.floor(p))), vk = k0+0.5, q = p-Q(p);
  const dfmt = x => { const n = Math.round(x); return n===0 ? '0' : (n<0?'−':'')+(Math.abs(n)===1?'':Math.abs(n))+'Δ'; };
  const a = P.Axes({w:600, h:270, xr:[-2.3,2.3], yr:[-2.3,2.5], xlabel:'m', ylabel:'\\mathbb{Q}(m)',
    pad:{l:56,r:26,t:24,b:40}, xticksOverride:[-2,-1,0,1,2], yticksOverride:[], xtickfmt:()=>''});
  a.rect(k0, -2.3, k0+1, 2.5, {fill:C.dec.mid});
  a.poly([[-2.3,-2.3],[2.3,2.3]], {color:C.in, width:1.4, dash:'4 4'});
  for(let k=-2;k<2;k++) a.poly([[k,Q(k+0.5)],[k+1,Q(k+0.5)]], {color:C.mid, width:2.4});
  const yb = -2.05;
  a.note(k0, yb, 'm_{k-1}', {tex:true, fs:14, color:C.muted, anchor:'end', dx:-4});
  a.note(k0+1, yb, 'm_k', {tex:true, fs:14, color:C.muted, dx:4});
  a.note(k0, vk-0.08, 'v_k', {tex:true, fs:15, color:C.mid, anchor:'end', dx:-8});
  a.span(k0, k0+1, 1.7, '\\Delta', {tex:true, fs:15, color:C.muted});
  a.vline(p, {color:C.muted});
  a.poly([[p,vk],[p,p]], {color:C.err, width:3});
  a.point(p, p, {color:C.in, r:5}); a.point(p, vk, {color:C.mid, r:5});
  a.note(2.25, -1.3, `|q|=${(Math.abs(q)).toFixed(2)}\\,\\Delta`, {tex:true, fs:15, color:C.err, anchor:'end'});
  const b = P.Axes({w:600, h:220, xr:[-2.3,2.3], yr:[-0.9,0.9], xlabel:'m', ylabel:'q',
    pad:{l:56,r:26,t:20,b:40}, xticksOverride:[-2,-1,0,1,2], yticksOverride:[], xtickfmt:dfmt});
  b.rect(k0, -0.9, k0+1, 0.9, {fill:C.dec.mid});
  b.hline(0.5, {color:C.err, dash:'4 4'}); b.hline(-0.5, {color:C.err, dash:'4 4'});
  b.note(-2.25, 0.6, '+\\Delta/2', {tex:true, fs:14, color:C.err});
  b.note(-2.25, -0.8, '-\\Delta/2', {tex:true, fs:14, color:C.err});
  for(let k=-2;k<2;k++) b.poly([[k,-0.5],[k+1-1e-6,0.5]], {color:C.err, width:2});
  b.vline(p, {color:C.muted});
  b.point(p, q, {color:C.err, r:5});
  return `<svg viewBox="0 0 600 490" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,270)}${place(b.svg(),0,270,600,220)}</svg>`;
}
function figErrDensity(){
  const a = P.Axes(SZ({xr:[-0.9,0.9], yr:[-0.14,1.4], xlabel:'q', ylabel:'f_Q(q)',
    xticksOverride:[-0.5,0,0.5], xtickfmt:x=>x<0?'\u2212\u0394/2':x>0?'\u0394/2':'0',
    yticksOverride:[]}));
  a.rect(-0.5, 0, 0.5, 1, {stroke:C.muted, width:1.6});
  a.area(q=>q*q, -0.5, 0.5, {color:C.dec.err});
  const pts=[]; for(let i=0;i<=200;i++){ const q=-0.5+i/200; pts.push([q,q*q]); }
  a.poly(pts, {color:C.err, width:2});
  a.note(0.54, 1.1, 'f_Q(q)=1/\\Delta', {tex:true, fs:14, color:C.muted});
  a.note(0.54, 0.22, 'q^{2}f_Q(q)', {tex:true, fs:14, color:C.err});
  return a.svg();
}
const ALPHA_SINE = 10*Math.log10(1.5);
/* The last frame of the slide: R = 1, ..., 8. */
function figNoiseBits(){
  const R = 8;
  const a = P.Axes(SZ({xr:[0,9.6], yr:[0,60], xlabel:'R\\;(\\text{bits per sample})',
    ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})', pad:{l:62,r:26,t:24,b:46}, xticksOverride:[1,2,3,4,5,6,7,8], ytarget:6}));
  const y = r => ALPHA_SINE + 20*r*Math.log10(2);
  a.curve(r=>r<=8.6 ? y(r) : NaN, {color:C.err, width:1.2, dash:'5 5', opacity:0.45});
  const st = []; for(let r=1;r<=R;r++) st.push([r, y(r)]);
  a.stem(st, {color:C.err});
  const lo = y(R-1), hi = y(R), X = R+0.22;
  a.poly([[R-1,lo],[X,lo]], {color:C.muted, width:1, dash:'3 4'});
  a.poly([[X-0.06,lo],[X,lo],[X,hi],[X-0.06,hi]], {color:C.in, width:1.6});
  a.note(X, (lo+hi)/2, '+6.02\\ \\mathrm{dB}', {tex:true, fs:14, color:C.in, dx:6});
  a.note(0.3, 55, '\\Delta=2m_{\\max}/2^{'+R+'}', {tex:true, fs:14, color:C.muted});
  a.note(0.3, 48, 'E[Q^{2}]=m_{\\max}^{2}/(3\\cdot4^{'+R+'})', {tex:true, fs:14, color:C.err});
  return a.svg();
}
/* The slider at its first position, 20 dB below full scale. */
function figSqnr(){
  const lvl = -20;
  const a = P.Axes(SZ({xr:[1,12], yr:[0,80], xlabel:'R\\;(\\text{bits per sample})',
    ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})', pad:{l:62,r:26,t:24,b:46}, xtarget:6, ytarget:5}));
  a.curve(R=>ALPHA_SINE+6.02*R, {color:C.in, width:2.3});
  a.curve(R=>ALPHA_SINE+lvl+6.02*R, {color:C.mid, width:2.3});
  const y8 = ALPHA_SINE + lvl + 6.02*8;
  a.point(8, y8, {color:C.mid, r:5});
  a.note(8.3, y8-3, P.fmt(y8,1)+'\\ \\mathrm{dB}', {tex:true, fs:14, color:C.mid});
  a.note(1.3, 74, '\\text{full scale}', {tex:true, fs:13, color:C.in});
  a.note(1.3, 66, '20\\ \\mathrm{dB}\\text{ below}', {tex:true, fs:13, color:C.mid});
  return a.svg();
}
/* The noisy sinusoid of the SQNR definition, at T = 6 s and R = 3. */
const SQNR_NOISE = (() => {
  const u = seeded(20260924), h = 0.25, n = [];
  for(let i=0;i<=200;i++) n.push(0.6*Math.sqrt(-2*Math.log(u()+1e-12))*Math.cos(2*Math.PI*u()));
  return t => { const x = (t+25)/h, k = Math.max(0, Math.min(199, Math.floor(x))), f = x-k,
    w = (1-Math.cos(Math.PI*f))/2; return (1-w)*n[k] + w*n[k+1]; };
})();
function figSqnrWindow(){
  const T = 6, R = 3, X = 12, mmax = 5, D = 2*mmax/(1<<R);
  const q = m => Math.max(-mmax+D/2, Math.min(mmax-D/2, (Math.floor(m/D)+0.5)*D));
  const m = t => 3*Math.cos(t) + SQNR_NOISE(t);
  let ps = 0, pq = 0; const N = 6000;
  for(let i=0;i<N;i++){ const t = -T/2+T*(i+0.5)/N, e = m(t)-q(m(t)); ps += m(t)*m(t); pq += e*e; }
  ps /= N; pq /= N;
  const a = P.Axes({w:600,h:230,xr:[-X,X],yr:[-6,12],
    xlabel:'t',ylabel:'\\text{amplitude}',pad:{l:54,r:26,t:24,b:40},xtarget:5,yticksOverride:[-5,5]});
  a.rect(-T/2, -6, T/2, 12, {fill:C.dec.in});
  a.curve(m,{color:C.in,n:2400});
  const pts=[]; for(let i=0;i<=4800;i++){ const t=-X+2*X*i/4800; pts.push([t,q(m(t))]); }
  a.poly(pts,{color:C.mid,width:1.8});
  const b = P.Axes({w:600,h:190,xr:[-X,X],yr:[-1.1*D,2.0*D],
    xlabel:'t',ylabel:'q(t)',pad:{l:54,r:26,t:20,b:40},xtarget:5,yticksOverride:[]});
  b.rect(-T/2, -1.1*D, T/2, 2.0*D, {fill:C.dec.in});
  b.hline(D/2,{color:C.err,dash:'4 4'}); b.hline(-D/2,{color:C.err,dash:'4 4'});
  b.curve(t=>m(t)-q(m(t)),{color:C.err,width:1.5,n:4800});
  b.note(X-0.2, 0.74*D, '\\pm\\Delta/2', {tex:true,fs:13,color:C.err,anchor:'end'});
  b.note(0, 1.5*D, `\\mathrm{SQNR}=${ps.toFixed(2)}/${pq.toFixed(4)}=${(10*Math.log10(ps/pq)).toFixed(2)}\\ \\text{dB}`,
    {tex:true, fs:17, color:C.err, anchor:'middle'});
  return `<svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,230)}${place(b.svg(),0,230,600,190)}</svg>`;
}
/* Example 1.2 at R = 3: the sinusoid, its quantized form and the error. */
function figQuantError(){
  const R = 3, L = 2**R, mmax = 5, D = 2*mmax/L;
  const q = m => Math.max(-mmax+D/2, Math.min(mmax-D/2, (Math.floor(m/D)+0.5)*D));
  const m = t => mmax*Math.cos(t);
  const a = P.Axes({w:600,h:230,xr:[0,2*Math.PI],yr:[-6,6.4],
    xlabel:'t',ylabel:'\\text{amplitude}',pad:{l:54,r:26,t:24,b:40},xtarget:5,ytarget:4});
  a.curve(m,{color:C.in});
  const pts=[]; for(let i=0;i<=900;i++){ const t=2*Math.PI*i/900; pts.push([t,q(m(t))]); }
  a.poly(pts,{color:C.mid,width:2.0});
  const E = 1.8*D/2;
  const b = P.Axes({w:600,h:210,xr:[0,2*Math.PI],yr:[-E,E],
    xlabel:'t',ylabel:'\\text{amplitude}',pad:{l:54,r:26,t:26,b:40},xtarget:5,ytarget:4});
  b.hline(D/2,{color:C.err,dash:'4 4'}); b.hline(-D/2,{color:C.err,dash:'4 4'});
  b.curve(t=>m(t)-q(m(t)),{color:C.err,width:1.7,n:1400});
  b.note(2*Math.PI-0.1, D/2+0.3*D, '+\\Delta/2', {tex:true,fs:13,color:C.err,anchor:'end'});
  return `<svg viewBox="0 0 600 440" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,230)}${place(b.svg(),0,230,600,210)}</svg>`;
}
function figUniformSource(){
  const L = 256, D = 2/L;
  const a = P.Axes(SZ({xr:[-1.2,1.2], yr:[-1.15,1.15], xlabel:'m', ylabel:'\\mathbb{Q}(m)',
    xticksOverride:[-1,-0.5,0,0.5,1], yticksOverride:[-1,-0.5,0,0.5,1]}));
  a.poly([[-1.2,-1.2],[1.2,1.2]], {color:C.muted, width:1.2, dash:'4 4'});
  const pts = [[-1.2, -1+D/2]];
  for(let k=1;k<L;k++) pts.push([-1+k*D, -1+(k-0.5)*D], [-1+k*D, -1+(k+0.5)*D]);
  pts.push([1.2, 1-D/2]);
  a.poly(pts, {color:C.in, width:1.6});
  const x0 = -1.05, y0 = 0.2, W = 0.8, s = W/(6*D);
  const T = (m,q) => [x0+(m+3*D)*s, y0+(q+3*D)*s];
  a.poly([[x0,y0],[x0+W,y0],[x0+W,y0+W],[x0,y0+W],[x0,y0]], {color:C.muted, width:1});
  a.poly([[-3*D,-3*D],[3*D,-3*D],[3*D,3*D],[-3*D,3*D],[-3*D,-3*D]], {color:C.muted, width:1});
  a.poly([T(-3*D,-3*D), T(3*D,3*D)], {color:C.muted, width:1.2, dash:'4 4'});
  const z = [T(-3*D,-2.5*D)];
  for(let k=-2;k<=2;k++) z.push(T(k*D,(k-0.5)*D), T(k*D,(k+0.5)*D));
  z.push(T(3*D,2.5*D));
  a.poly(z, {color:C.in, width:2.2});
  const [ax, ay] = T(-1.25*D, -1.5*D);
  a.note(ax, ay-0.13, '\\Delta', {tex:true, fs:14, color:C.in, anchor:'middle'});
  return a.svg();
}
const GQ_EDGES  = [-Infinity, -40, -20, 20, 40, Infinity];
const GQ_LEVELS = [-30, -10, 0, 10, 30];
const gdens = x => Math.exp(-x*x/800)/Math.sqrt(2*Math.PI*400);
const gq = x => { for(let k=0;k<5;k++) if(x<=GQ_EDGES[k+1]) return GQ_LEVELS[k]; return 30; };
function figGaussErr(){
  const a = P.Axes(SZ({xr:[-80,80], yr:[-0.3,5.8], xlabel:'x', ylabel:'(x-\\mathbb{Q}(x))^{2}f_X(x)',
    xticksOverride:[-40,-20,0,20,40], ytarget:3, pad:{l:66,r:26,t:24,b:42}}));
  const f = x => (x-gq(x))**2*gdens(x);
  for(let k=0;k<5;k++) a.area(f, Math.max(-80,GQ_EDGES[k]), Math.min(80,GQ_EDGES[k+1]),
    {color:C.dec.err, stroke:'none'});
  a.curve(f, {color:C.err, width:2, n:1600});
  for(const e of [-40,-20,20,40]) a.vline(e, {color:C.muted, dash:'4 4'});
  a.note(-10, 5.3, '79.50', {fs:14, color:C.err, anchor:'middle'});
  for(const s of [-1,1]){
    a.note(30*s, 2.9, '46.36', {fs:14, color:C.err, anchor:'middle'});
    a.note(60*s, 1.1, '7.98', {fs:14, color:C.err, anchor:'middle'});
  }
  return a.svg();
}
/* SQNR of the full-scale sinusoid, measured over one period of the waveform. */
function sqnrMeasured(R){
  const mmax = 5, L = 2**R, D = 2*mmax/L, N = 20000; let pm = 0, pq = 0;
  for(let i=0;i<N;i++){
    const m = mmax*Math.cos(2*Math.PI*i/N);
    const lv = Math.max(-L/2+0.5, Math.min(L/2-0.5, Math.floor(m/D)+0.5))*D;
    pm += m*m; pq += (m-lv)*(m-lv);
  }
  return 10*Math.log10(pm/pq);
}
const A_GAUSS4 = 10*Math.log10(3/16);
/* The slider at its first position, R = 8. */
function figSqnrSources(){
  const R = 8;
  const a = P.Axes(SZ({xr:[0.5,10.6], yr:[-10,70], xlabel:'R\\;(\\text{bits per sample})',
    ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})', pad:{l:62,r:26,t:24,b:46},
    xticksOverride:[1,2,3,4,5,6,7,8,9,10], yticksOverride:[-10,0,10,20,30,40,50,60,70]}));
  a.curve(r=>ALPHA_SINE+6.0206*r, {color:C.in, width:2.2});
  a.curve(r=>6.0206*r, {color:C.slate, width:2.2});
  a.curve(r=>A_GAUSS4+6.0206*r, {color:C.in, width:2.2, dash:'7 5'});
  for(let r=1;r<=R;r++){
    a.point(r, sqnrMeasured(r), {color:C.mid, r:4.4});
    a.point(r, 6.0206*r, {color:C.mid, r:4.4});
    a.point(r, gaussSqnr(4, 1<<r), {color:C.mid, r:4.4});
  }
  a.note(1, 62, '\\text{sinusoid},\\ \\alpha=1.76', {tex:true, fs:13, color:C.in});
  a.note(1, 55, '\\text{uniform},\\ \\alpha=0', {tex:true, fs:13, color:C.slate});
  a.note(1, 48, '\\text{Gaussian},\\ \\pm4\\sigma,\\ \\alpha=-7.27', {tex:true, fs:13, color:C.in});
  return a.svg();
}
/* Dither: the last frame, 64 dithered outputs averaged, and the two strips. */
const DITH = (()=>{ const r = seeded(4242), N = 240, K = 64, d = [];
  for(let k=0;k<K;k++){ const row = []; for(let n=0;n<N;n++) row.push(r()-0.5); d.push(row); }
  return {N, K, d}; })();
const ditherIn = n => 1.3*Math.sin(2*Math.PI*n/DITH.N);
function figDither(){
  const {N, K, d} = DITH;
  const a = P.Axes({w:600, h:300, xr:[0,N], yr:[-2.3,2.3], xlabel:'n', ylabel:'m[n],\\;\\hat m[n]',
    pad:{l:56,r:26,t:24,b:40}, xtarget:6, yticksOverride:[-2,-1,0,1,2]});
  for(const L of [-2,-1,1,2]) a.hline(L, {color:C.rule, dash:'2 5', opacity:0.9});
  a.raw('<g opacity="0.2">');
  a.poly([...Array(N)].map((_,n)=>[n, Math.round(ditherIn(n))]), {color:C.mid, width:2.2});
  a.raw('</g><g opacity="0.25">');
  a.poly([...Array(N)].map((_,n)=>[n, Math.round(ditherIn(n)+d[0][n])]), {color:C.mid, width:1.1});
  a.raw('</g>');
  const avg = [...Array(N)].map((_,n)=>{ let s = 0; for(let k=0;k<K;k++) s += Math.round(ditherIn(n)+d[k][n]); return [n, s/K]; });
  a.poly(avg, {color:C.out, width:2.4});
  a.curve(ditherIn, {color:C.in, width:1.8, dash:'6 4'});
  const W = 160, H = 12, L = 4;
  const r = seeded(99), noise = [...Array(W*H)].map(()=>r()-0.5);
  const q = x => Math.max(0, Math.min(L-1, Math.round(x*(L-1))))/(L-1);
  const plain = pixels('dith0', W, H, i=>q(i/(W-1)));
  const dith  = pixels('dith1', W, H, (i,j)=>q(i/(W-1)+noise[j*W+i]/(L-1)));
  const lab = (t, y) => P.texName(t, {xRight:102, baseline:y, size:14, color:C.muted, figW:600});
  return `<svg viewBox="0 0 600 404" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,300)}`
    + lab('\\text{no dither}', 336) + picture(plain, 112, 316, 462, 30, true)
    + lab('\\text{dither}', 386) + picture(dith, 112, 366, 462, 30, true) + '</svg>';
}

/* ---- 1.5 non-uniform quantization --------------------------------------- */
const MU = 255, A_LAW = 87.6;
const sgn = x => x<0 ? -1 : 1;
const muinv = y => sgn(y)*(Math.pow(1+MU, Math.abs(y))-1)/MU;
function figSpeechLevels(){
  const L = 16;
  const a = P.Axes(SZ({xr:[-1,1], yr:[-1,1], xlabel:'x/x_{\\max}', ylabel:'\\mathbb{Q}(x)/x_{\\max}',
    xticksOverride:[-1,-0.5,0,0.5,1], yticksOverride:[-1,-0.5,0,0.5,1]}));
  const stair = (edge, level) => { const pts = [];
    for(let k=0;k<L;k++){ const v = level(k); pts.push([edge(k),v],[edge(k+1),v]); }
    return pts; };
  const y = k => -1+2*k/L;
  a.poly(stair(k=>muinv(y(k)), k=>muinv(y(k)+1/L)), {color:C.mid, width:2.4});
  a.note(-0.95, 0.86, '\\mu\\text{-law},\\ \\mu=255', {tex:true, fs:14, color:C.mid});
  return a.svg();
}
function figCompander(){
  const bw = 130, bh = 120, y0 = 44, yc = y0+bh/2, xs = [56, 236, 416];
  const mu = 20, c = x => sgn(x)*Math.log(1+mu*Math.abs(x))/Math.log(1+mu);
  const cinv = y => sgn(y)*(Math.pow(1+mu, Math.abs(y))-1)/mu;
  const stairs = f => { const pts = [];
    for(let k=-4;k<4;k++){ const v = f((k+0.5)/4); pts.push([f(k/4), v], [f((k+1)/4), v]); }
    return pts; };
  const curve = f => [...Array(121)].map((_,k)=>{ const u = -1+2*k/120; return [u, f(u)]; });
  const panel = (cx, cy, gx, gy, pts, col) =>
    `<path d="M${cx-gx-6},${cy}H${cx+gx+6}M${cx},${cy+gy+6}V${cy-gy-6}" stroke="${C.axis}" stroke-width="1"/>`
    + `<path d="${pts.map(([u,v],k)=>(k?'L':'M')+(cx+gx*u).toFixed(1)+','+(cy-gy*v).toFixed(1)).join('')}"
        fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/>`;
  const it = [
    {t:'arrow', x1:8, y1:yc, x2:xs[0], y2:yc, label:'m(t)', tex:true},
    {t:'arrow', x1:xs[0]+bw, y1:yc, x2:xs[1], y2:yc, label:'y', tex:true},
    {t:'arrow', x1:xs[1]+bw, y1:yc, x2:xs[2], y2:yc, label:'\\hat y', tex:true},
    {t:'arrow', x1:xs[2]+bw, y1:yc, x2:594, y2:yc, label:'\\hat m(t)', tex:true}
  ];
  ['Compressor','Uniform quantizer','Expander'].forEach((name,i)=>{
    it.push({t:'box', x:xs[i], y:y0, w:bw, h:bh});
    it.push({t:'text', x:xs[i]+bw/2, y:y0-14, label:name, fs:15, color:C.ink});
  });
  [['high gain for weak inputs,','low gain for strong ones'],[],['undoes the compression,','restores every level']]
    .forEach((ls,i)=>ls.forEach((L,j)=>it.push({t:'text', x:xs[i]+bw/2, y:y0+bh+26+j*19, label:L, fs:13})));
  const pc = 300, py = 360, pgx = 200, pgy = 96;
  it.push({t:'text', x:pc+pgx+14, y:py+5, label:'m', tex:true, anchor:'start', fs:15});
  it.push({t:'text', x:pc+10, y:py-pgy-4, label:'\\hat m', tex:true, anchor:'start', fs:15});
  it.push({t:'text', x:pc-pgx, y:py-pgy+8, label:'the whole chain', anchor:'start', fs:13});
  const extra = panel(xs[0]+bw/2, yc, 50, 44, curve(c), C.mid)
    + panel(xs[1]+bw/2, yc, 50, 44, stairs(u=>u), C.mid)
    + panel(xs[2]+bw/2, yc, 50, 44, curve(cinv), C.out)
    + `<path d="M${pc-pgx},${py+pgy}L${pc+pgx},${py-pgy}" stroke="${C.muted}" stroke-width="1.2" stroke-dasharray="4 4"/>`
    + panel(pc, py, pgx, pgy, stairs(cinv), C.out);
  return P.blocks({w:600, h:470, items:it}).replace('</svg>', extra + '</svg>');
}
function figCompanding(){
  const muL = mu => x => Math.log(1+mu*x)/Math.log(1+mu);
  const H = 235;
  const aL  = A => x => x < 1/A ? A*x/(1+Math.log(A)) : (1+Math.log(A*x))/(1+Math.log(A));
  const panel = (law, color, fam, id) => {
    const a = P.Axes({w:560, h:H, xr:[0,1], yr:[0,1.06], xlabel:'|x|', ylabel:'|y|',
      pad:{l:56,r:26,t:18,b:42}, xticksOverride:[0,0.2,0.4,0.6,0.8,1], yticksOverride:[0,0.5,1]});
    a.curve(x=>x, {color:C.muted, width:1.3, dash:'4 4'});
    const key = (y, txt, st) => { a.poly([[0.66,y],[0.74,y]], st);
      a.note(0.77, y, txt, {tex:true, fs:14, color:st.color, dy:2}); };
    fam.forEach(([p, w, op, txt], i) => {
      const st = {color, width:w, opacity:op};
      a.curve(law(p), Object.assign({n:1600}, st));
      key(0.46-0.17*i, txt, st);
    });
    key(0.46-0.17*fam.length, id, {color:C.muted, width:1.3, dash:'4 4'});
    return a.svg();
  };
  const top = panel(aL, C.h, [[A_LAW, 2.6, 1, 'A=87.6'], [2, 1.8, 0.65, 'A=2']], 'A=1');
  const bot = panel(muL, C.in, [[MU, 2.6, 1, '\\mu=255'], [5, 1.8, 0.65, '\\mu=5']], '\\mu\\to0');
  return top + bot;
}

/* ---- 1.6 PCM, DPCM and delta modulation --------------------------------- */
const LINE_CODES = [
  ['Unipolar NRZ', (b,u)=> b?1:0, true],
  ['Polar NRZ',    (b,u)=> b?1:-1],
  ['Unipolar RZ',  (b,u)=> (b && u<0.5)?1:0, true],
  ['Manchester',   (b,u)=> (u<0.5 ? (b?1:-1) : (b?-1:1))]
];
function figLineCodes(){
  const bits = [0,1,1,0,1,0,0,1], off = [9.3, 6.2, 3.1, 0];
  const a = P.Axes(SZ({xr:[0,8], yr:[-1.3,11.6], pad:{l:20,r:20,t:14,b:24},
    grid:false, zeroAxes:false, arrows:false, xticksOverride:[], yticksOverride:[]}));
  off.forEach(y0=>{ for(let k=0;k<=8;k++) a.poly([[k,y0-1.0],[k,y0+1.0]], {color:C.muted, width:1.4, dash:'6 4'}); });
  bits.forEach((b,k)=>a.note(k+0.5, 11.0, String(b), {fs:15, color:C.ink, anchor:'middle', weight:600}));
  LINE_CODES.forEach(([name,f,uni],i)=>{
    const y0 = off[i], lv = x => uni ? y0-0.8+1.6*x : y0+0.8*x;
    a.poly([[0,uni?y0-0.8:y0],[8,uni?y0-0.8:y0]], {color:C.rule, width:1});
    const pts=[];
    for(let k=0;k<8;k++) for(let j=0;j<=80;j++){ const u=j/80; pts.push([k+u, lv(f(bits[k],u))]); }
    a.poly(pts, {color:C.in, width:2.2});
    a.note(0.06, y0+1.18, name, {fs:13, color:C.muted});
  });
  return a.svg();
}
function figPcmExample(){
  const m = t => 8*Math.abs(sinc(t-2));
  const Ts = 0.6;
  const q = v => Math.min(7, Math.floor(v)) + 0.5;
  const a = P.Axes(SZ({xr:[-0.15,3.75], yr:[-0.5,9.2], xlabel:'t\\;(\\mathrm{s})', ylabel:'m(t)',
    pad:{l:52,r:26,t:24,b:44}, xtarget:6, ytarget:4}));
  for(let k=0;k<8;k++) a.hline(k+0.5, {color:C.rule, dash:'2 5', opacity:0.9});
  a.curve(m, {color:C.in});
  for(let n=0;n<=6;n++){ const t=n*Ts, v=m(t);
    a.point(t, v, {color:C.in, r:4.5}); a.point(t, q(v), {color:C.mid, r:4.5}); }
  a.note(1.8, 8.6, '\\Delta=1\\ \\mathrm{V},\\;L=8', {tex:true, fs:14, color:C.muted, anchor:'middle'});
  return a.svg();
}
/* The seven code words as one polar NRZ stream, with the fourth bit and the
   second word boxed; on the slide the two boxes step along the stream. */
const PCM_WORDS = ['000','001','001','111','110','000','001'];
function figPcmStream(){
  const bits = PCM_WORDS.join('').split('').map(Number), N = bits.length;
  const a = P.Axes(SZ({xr:[0,N], yr:[-2.75,3.0], xlabel:'t\\;(\\mathrm{s})', ylabel:'\\text{polar NRZ}',
    pad:{l:56,r:40,t:24,b:42}, xticksOverride:[], yticksOverride:[-1,1]}));
  a.rect(3, -1.3, 6, 2.15, {fill:C.dec.mid, stroke:C.mid, width:1.6});
  a.note(4.5, 2.55, 'T_s=3T_b=0.6\\ \\mathrm{s}', {tex:true, fs:16, color:C.mid, anchor:'middle'});
  a.rect(3, -1.3, 4, 1.3, {fill:C.dec.h, stroke:C.h, width:1.6});
  a.note(3.5, -2.3, 'T_b=0.2\\ \\mathrm{s}', {tex:true, fs:16, color:C.h, anchor:'middle'});
  for(let k=1;k<N;k++) if(k%3) a.poly([[k,-1.3],[k,1.3]], {color:C.rule, width:1, dash:'2 4'});
  for(let k=3;k<=N;k+=3) a.poly([[k,-1.3],[k,2.15]], {color:C.muted, width:1.4, dash:'6 4'});
  for(let k=0;k<=N;k+=3) a.note(k, -1.7, P.fmt(0.2*k,1), {fs:13, color:C.muted, anchor:'middle'});
  const pts=[]; bits.forEach((b,k)=>{ const y=b?1:-1; pts.push([k,y],[k+1,y]); });
  a.poly(pts, {color:C.in, width:2.2});
  PCM_WORDS.forEach((w,i)=>a.note(3*i+1.5, 1.72, w, {fs:14, color:C.mid, anchor:'middle', weight:600}));
  return a.svg();
}
/* The slider at its first position, R = 8. */
function figPcmBw(){
  const R = 8;
  const a = P.Axes({w:600, h:210, xr:[-13,13], yr:[-0.1,1.45], xlabel:'f', ylabel:'|S(f)|',
    pad:{l:54,r:26,t:24,b:40}, xticksOverride:[-12,-8,-4,-1,1,4,8,12], xtickfmt:wfmt, ytickfmt:()=>''});
  a.rect(-R, 0, R, 0.55, {fill:C.dec.mid, stroke:C.mid, width:2});
  copy(a, 0, 1, 1, {color:C.in, width:2.4});
  a.note(12.6, 1.22, `B_T=${R}W`, {tex:true, fs:16, color:C.mid, anchor:'end'});
  const b = P.Axes({w:600, h:230, xr:[0,12.6], yr:[0,80], xlabel:'B_T/W', ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',
    pad:{l:62,r:26,t:24,b:44}, xticksOverride:[0,2,4,6,8,10,12], yticksOverride:[0,20,40,60,80]});
  b.curve(x=>x>=1-1e-9 && x<=12+1e-9 ? ALPHA_SINE+6.0206*x : NaN, {color:C.mid, width:2.2, n:600});
  const s = ALPHA_SINE+6.0206*R;
  b.point(R, s, {color:C.mid, r:5.5});
  b.note(R+0.3, s-15, P.fmt(s,1)+'\\ \\mathrm{dB}', {tex:true, fs:15, color:C.mid, anchor:'start'});
  return `<svg viewBox="0 0 600 440" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,210)}${place(b.svg(),0,210,600,230)}</svg>`;
}
/* The last frame of the slide: bit b = 3 of the code word 1110 received wrong. */
const BE = { n0:3, N:24 };
const beX = n => 0.9*Math.sin(2*Math.PI*n/BE.N + 0.3);
const beCode = x => Math.max(0, Math.min(15, Math.floor(x/0.125)+8));
const beLevel = k => (k-8+0.5)*0.125;
function figBitError(){
  const b = 3, k0 = beCode(beX(BE.n0)), ok = beLevel(k0), y = beLevel(k0 ^ (1<<b));
  const a = P.Axes(SZ({xr:[-0.6,BE.N-0.4], yr:[-1.3,1.55], xlabel:'n', ylabel:'\\hat m[n]',
    xtarget:6, yticksOverride:[-1,-0.5,0,0.5,1]}));
  a.curve(t=>beX(t), {color:C.in, width:1.4, dash:'5 5', opacity:0.6});
  const st = []; for(let n=0;n<BE.N;n++) if(n!==BE.n0) st.push([n, beLevel(beCode(beX(n)))]);
  a.stem(st, {color:C.mid});
  a.stem([[BE.n0, y]], {color:C.err});
  a.point(BE.n0, ok, {color:C.mid, r:4, ring:C.plate});
  a.poly([[BE.n0+0.55, ok],[BE.n0+0.55, y]], {color:C.err, width:1.6, dash:'4 3'});
  const bits = k => k.toString(2).padStart(4,'0');
  a.note(BE.n0+1.5, (ok+y)/2, `2^{${b}}\\Delta`, {tex:true, fs:15, color:C.err});
  a.note(9.5, 1.32, `\\texttt{${bits(k0)}}\\to\\texttt{${bits(k0^(1<<b))}}`, {tex:true, fs:16, color:C.err});
  return a.svg();
}
/* DPCM with a first-order predictor and a 3-bit quantizer of the difference. */
const DP = (()=>{ const N = 32, x = [], xh = [], pr = [], e = [], L = 8, D = 0.8/L;
  const q = u => Math.max(-0.4+D/2, Math.min(0.4-D/2, (Math.floor(u/D)+0.5)*D));
  let last = 0;
  for(let n=0;n<N;n++){ const s = 0.78*Math.sin(2*Math.PI*n/N) + 0.26*Math.sin(6*Math.PI*n/N + 0.9);
    x.push(s); pr.push(last); e.push(s-last); last = last + q(s-last); xh.push(last); }
  return {N, x, xh, pr, e}; })();
function figDpcm(){
  const {N, x, pr, e} = DP;
  const a = P.Axes({w:600, h:250, xr:[-0.8,N-0.2], yr:[-1.15,1.15], xlabel:'n', ylabel:'x[n]',
    pad:{l:56,r:26,t:24,b:40}, xtarget:8, yticksOverride:[-1,-0.5,0,0.5,1]});
  a.stem(x.map((s,n)=>[n,s]), {color:C.in});
  for(let n=0;n<N;n++) a.poly([[n+0.22, pr[n]],[n+0.22, x[n]]], {color:C.muted, width:1.2, dash:'2 3'});
  for(let n=0;n<N;n++) a.point(n+0.22, pr[n], {color:C.mid, r:3.4});
  const b = P.Axes({w:600, h:210, xr:[-0.8,N-0.2], yr:[-1.15,1.15], xlabel:'n', ylabel:'e[n]=x[n]-\\hat x[n-1]',
    pad:{l:56,r:26,t:24,b:40}, xtarget:8, yticksOverride:[-1,-0.5,0,0.5,1]});
  b.stem(e.map((s,n)=>[n,s]), {color:C.mid});
  const em = Math.max(...e.map(Math.abs));
  b.note(N-1, 0.78, `|e[n]|\\le${em.toFixed(2)}`, {tex:true, fs:15, color:C.mid, anchor:'end'});
  return `<svg viewBox="0 0 600 460" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,250)}${place(b.svg(),0,250,600,210)}</svg>`;
}
/* Delta modulation at the slider's first position, Delta = 0.06. */
const DMN = 120;
const dmX = n => 0.72*Math.tanh((n-38)/5) + 0.1*Math.sin(2*Math.PI*n/30);
function figDm(){
  const D = 0.06;
  const a = P.Axes(SZ({xr:[0,DMN], yr:[-1.6,1.32], xlabel:'n', ylabel:'x[n],\\;\\hat x[n]',
    xtarget:6, yticksOverride:[-1,-0.5,0,0.5,1]}));
  const xh = [], bits = []; let s = dmX(0);
  for(let n=0;n<DMN;n++){ const up = dmX(n) >= s; s += up ? D : -D; xh.push(s); bits.push(up); }
  let run = null;
  const shade = (lo, hi) => a.rect(lo-0.5, -1.18, hi+0.5, 1.18, {fill:C.dec.err});
  for(let n=0;n<DMN;n++){ const lag = Math.abs(dmX(n)-xh[n]) > 2*D;
    if(lag && run===null) run = n; if(!lag && run!==null){ shade(run, n-1); run = null; } }
  if(run!==null) shade(run, DMN-1);
  a.curve(dmX, {color:C.in, width:2});
  const pts = []; xh.forEach((y,n)=>pts.push([n,y],[n+1,y]));
  a.poly(pts, {color:C.mid, width:1.8});
  bits.forEach((up,n)=>a.poly([[n+0.5,-1.42],[n+0.5, up ? -1.28 : -1.56]], {color:C.mid, width:1.2}));
  return a.svg();
}

/* ---- 1.7 vector quantization -------------------------------------------- */
function figPairLattice(L){
  const a = P.Axes(SZ({xr:[0,L], yr:[0,L], xlabel:'\\text{sample }n', ylabel:'\\text{sample }n+1',
    pad:{l:58,r:22,t:22,b:46}, xticksOverride:[0,4,8,12,16], yticksOverride:[0,4,8,12,16], grid:false}));
  for(let i=0;i<L;i++) for(let j=0;j<L;j++){
    const near = Math.abs(i-j) <= 1;
    a.rect(i, j, i+1, j+1, {fill: near ? C.dec.in : 'none', stroke: near ? C.in : C.rule});
  }
  return a.svg();
}
/* The grey ramp of the image slide at the slider's first position, R = 3:
   each value in [k/L,(k+1)/L) is sent to (k+1/2)/L. */
function figImageRamp(){
  const R = 3, L = 2**R, W = 600, S = 370, x0 = (W-S)/2;
  const grp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  const bits = 512*512*R;
  let cells = '';
  for(let k=0;k<L;k++){ const v = Math.round(255*(k+0.5)/L);
    cells += `<rect x="${(x0+k*S/L).toFixed(2)}" y="0" width="${(S/L+0.5).toFixed(2)}" height="40" fill="rgb(${v},${v},${v})"/>`; }
  return `<svg viewBox="0 0 ${W} 112" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Inter,-apple-system,sans-serif">
    ${cells}<rect x="${x0}" y="0" width="${S}" height="40" fill="none" stroke="${C.rule}" stroke-width="1"/>
    <text x="${x0-8}" y="26" font-size="14" fill="${C.muted}" text-anchor="end">0</text>
    <text x="${x0+S+8}" y="26" font-size="14" fill="${C.muted}">1</text>
    <text x="${W/2}" y="72" font-size="15" fill="${C.ink}" text-anchor="middle">L = ${L} levels, ${R} bits a pixel</text>
    <text x="${W/2}" y="98" font-size="15" fill="${C.muted}" text-anchor="middle">512\u00b2 \u00d7 ${R} = ${grp(bits)} bits = ${grp(bits/8192)} KiB</text>
  </svg>`;
}

/* ---- 1.8 speech, audio and image coding ---------------------------------- */
/* The source-filter model of LPC at 8 kHz: a pulse train at 125 Hz through an
   all-pole filter with three resonances. */
const LPC = (()=>{
  const fs = 8000, F = [730,1090,2440], B = [90,110,160];
  let A = [1];
  F.forEach((f,i)=>{ const r = Math.exp(-Math.PI*B[i]/fs), th = 2*Math.PI*f/fs, s = [1, -2*r*Math.cos(th), r*r];
    const out = new Array(A.length+2).fill(0);
    A.forEach((c,j)=>s.forEach((d,k)=>{ out[j+k] += c*d; })); A = out; });
  const synth = (w) => { const y = new Float32Array(w.length);
    for(let n=0;n<w.length;n++){ let s = w[n]; for(let i=1;i<A.length;i++) if(n-i>=0) s -= A[i]*y[n-i]; y[n] = s; }
    let pk = 0; for(const u of y) pk = Math.max(pk, Math.abs(u)); for(let n=0;n<y.length;n++) y[n] /= pk; return y; };
  const n = 9600, pulses = new Float32Array(n); for(let i=0;i<n;i+=64) pulses[i] = 1;
  const H = f => { let re = 0, im = 0; A.forEach((c,k)=>{ re += c*Math.cos(2*Math.PI*f*k/fs); im -= c*Math.sin(2*Math.PI*f*k/fs); });
    return 1/Math.hypot(re, im); };
  let hmax = 0; for(let f=0; f<=4000; f+=5) hmax = Math.max(hmax, H(f));
  return { F, voiced:synth(pulses), HdB: f => 20*Math.log10(H(f)/hmax) };
})();
function figLpc(){
  const a = P.Axes({w:600, h:236, xr:[0,32], yr:[-1.15,1.3], xlabel:'t\\;(\\mathrm{ms})', ylabel:'w_n,\\;x_n',
    pad:{l:54,r:26,t:24,b:40}, xticksOverride:[0,8,16,24,32], yticksOverride:[-1,0,1]});
  for(let t=0;t<=32;t+=8) a.impulse(t, 1, {color:C.in, label:false, opacity:0.25});
  const y = LPC.voiced, off = 64*40, pts = [];
  for(let k=0;k<=256;k++) pts.push([k/8, y[off+k]]);
  a.poly(pts, {color:C.out, width:1.9});
  const b = P.Axes({w:600, h:214, xr:[0,4], yr:[-50,-0.5], xlabel:'f\\;(\\mathrm{kHz})', ylabel:'|H(f)|\\;(\\mathrm{dB})',
    pad:{l:62,r:26,t:24,b:42}, xticksOverride:[0,1,2,3,4], yticksOverride:[-40,-20]});
  b.curve(k=>LPC.HdB(1000*k)-12, {color:C.h, width:2.3, n:800});
  LPC.F.forEach((F,i)=>b.note(F/1000, LPC.HdB(F)-8, `F_{${i+1}}`, {tex:true, fs:14, color:C.h, anchor:'middle'}));
  return `<svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,236)}${place(b.svg(),0,236,600,214)}</svg>`;
}
/* The last frame of the slide: four of the 24 calls and one whole T1 frame. */
function figT1(){
  const a = P.Axes({w:600, h:260, xr:[-1.05,3.1], yr:[0.1,5.1], xlabel:'t\\;(\\mu\\text{s})', ylabel:'',
    pad:{l:26,r:26,t:18,b:40}, grid:false, zeroAxes:false, xticksOverride:[0,1,2,3], xtickfmt:x=>String(125*x), yticksOverride:[]});
  const rows = [[4.4,'call 1',0.4],[3.4,'call 2',1.7],[2.4,'call 3',3.1],[0.8,'call 24',4.4]];
  rows.forEach(([y0,name,ph])=>{
    a.poly([[0,y0],[3,y0]], {color:C.rule, width:1});
    a.curve(t=>t>=-0.02 && t<=3.02 ? y0+0.34*Math.sin(2.3*t+ph) : NaN, {color:C.in, width:1.8});
    [0,1,2,3].forEach(t=>{ const s = y0+0.34*Math.sin(2.3*t+ph);
      a.poly([[t,y0],[t,s]], {color:C.mid, width:1.8}); a.point(t, s, {color:C.mid, r:3.6}); });
    a.note(-1.0, y0+0.08, name, {fs:14, color:C.ink});
  });
  a.note(-0.72, 1.75, '⋮', {fs:18, color:C.ink});
  const b = P.Axes({w:600, h:170, xr:[-8,199], yr:[0,3.2], xlabel:'', ylabel:'',
    pad:{l:26,r:26,t:10,b:12}, grid:false, zeroAxes:false, xticksOverride:[], yticksOverride:[]});
  b.rect(0, 1, 1, 2.2, {fill:C.plate, stroke:C.slate, width:1.6});
  for(let k=1;k<=24;k++){ const x0 = 1+8*(k-1);
    b.rect(x0, 1, x0+8, 2.2, {fill:C.dec.mid, stroke:C.mid, width:1.4});
    b.note(x0+4, 1.45, String(k), {fs:12, color:C.ink, anchor:'middle'}); }
  b.note(-1.4, 1.45, '\\mathrm{F}', {tex:true, fs:15, color:C.slate, anchor:'end'});
  b.span(0, 193, 0.62, null, {color:C.muted});
  b.note(96.5, 0.05, '193\\ \\text{bits in }125\\ \\mu\\text{s}=1.544\\ \\text{Mb/s}', {tex:true, fs:15, color:C.ink, anchor:'middle'});
  b.span(1, 9, 2.75, null, {color:C.mid});
  b.note(5, 2.85, '8 bits', {fs:13, color:C.mid, anchor:'start'});
  return `<svg viewBox="0 0 600 430" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,260)}${place(b.svg(),0,260,600,170)}</svg>`;
}
/* A first-order sigma-delta modulator at the slider's first position, U = 16. */
function sigmaDelta(U){
  const N = 16*U, x = [], y = []; let s = 0, last = 0;
  for(let n=0;n<N;n++){ const xn = 0.5*Math.sin(2*Math.PI*(n+0.5)/N); s += xn - last; last = s >= 0 ? 1 : -1; x.push(xn); y.push(last); }
  const h = Math.max(1, U), avg = [];
  for(let n=0;n<N;n++){ let a = 0, c = 0; for(let k=n-h;k<=n+h;k++){ const w = 1-Math.abs(k-n)/(h+1); a += w*y[(k+N)%N]; c += w; } avg.push(a/c); }
  let pe = 0, px = 0; for(let n=0;n<N;n++){ pe += (avg[n]-x[n])**2; px += x[n]*x[n]; }
  return {N, x, y, avg, snr:10*Math.log10(px/pe)};
}
function figSigmaDelta(){
  const S = sigmaDelta(16), N = S.N;
  const a = P.Axes(SZ({xr:[0,1], yr:[-1.3,1.55], xlabel:'t/T_0', ylabel:'y[n],\\;\\hat x(t)',
    xticksOverride:[0,0.25,0.5,0.75,1], yticksOverride:[-1,-0.5,0,0.5,1]}));
  const pts = []; S.y.forEach((b,n)=>pts.push([n/N,b],[(n+1)/N,b]));
  a.raw('<g opacity="0.55">'); a.poly(pts, {color:C.mid, width:1}); a.raw('</g>');
  a.curve(t=>0.5*Math.sin(2*Math.PI*t), {color:C.in, width:2.2, dash:'7 5'});
  a.poly(S.avg.map((u,n)=>[(n+0.5)/N, u]), {color:C.out, width:2.6});
  a.note(0.02, 1.36, `\\text{after the filter: }\\mathrm{SNR}=${S.snr.toFixed(1)}\\ \\mathrm{dB}`, {tex:true, fs:15, color:C.out});
  return a.svg();
}
/* JPEG on a drawn 128 x 128 picture at the slider's first position, quality 25. */
const JQ = [16,11,10,16,24,40,51,61, 12,12,14,19,26,58,60,55, 14,13,16,24,40,57,69,56, 14,17,22,29,51,87,80,62,
            18,22,37,56,68,109,103,77, 24,35,55,64,81,104,113,92, 49,64,78,87,103,121,120,101, 72,92,95,98,112,100,103,99];
const JIMG = (()=>{ const n = 128, p = new Float64Array(n*n);
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){
    const x = i/n, y = j/n; let v = 0.82 - 0.38*y;
    if((x-0.72)**2 + (y-0.24)**2 < 0.011) v = 0.98;
    const hill = 0.64 + 0.07*Math.sin(6.5*x) + 0.035*Math.sin(19*x+1);
    if(y > hill) v = 0.30 + 0.09*Math.sin(40*x)*Math.sin(37*y) + 0.12*(y-hill);
    if(x > 0.14 && x < 0.40 && y > 0.46 && y < 0.82){ v = 0.58;
      if(((Math.floor((x-0.14)*40))%3===1) && ((Math.floor((y-0.46)*40))%3===1)) v = 0.12; }
    if(y > 0.34 && y < 0.47 && x > 0.12 && x < 0.42 && y > 0.47-(0.13-Math.abs(x-0.27))) v = 0.40;
    p[j*n+i] = 255*v;
  }
  return {n, p}; })();
const DCT8 = [...Array(8)].map((_,u)=>[...Array(8)].map((_,k)=>(u ? 0.5 : Math.SQRT1_2*0.5)*Math.cos((2*k+1)*u*Math.PI/16)));
function jpeg(quality){
  const {n, p} = JIMG, out = new Float64Array(n*n), sc = quality < 50 ? 5000/quality : 200-2*quality;
  const T = JQ.map(q=>Math.max(1, Math.floor((q*sc+50)/100)));
  let nz = 0;
  for(let bj=0;bj<n;bj+=8) for(let bi=0;bi<n;bi+=8){
    const X = [...Array(64)].fill(0);
    for(let u=0;u<8;u++) for(let w=0;w<8;w++){ let s = 0;
      for(let k=0;k<8;k++) for(let l=0;l<8;l++) s += DCT8[u][k]*DCT8[w][l]*(p[(bj+k)*n+bi+l]-128);
      const qv = Math.round(s/T[u*8+w]); if(qv) nz++; X[u*8+w] = qv*T[u*8+w]; }
    for(let k=0;k<8;k++) for(let l=0;l<8;l++){ let s = 0;
      for(let u=0;u<8;u++) for(let w=0;w<8;w++) s += DCT8[u][k]*DCT8[w][l]*X[u*8+w];
      out[(bj+k)*n+bi+l] = s+128; }
  }
  return {out, nz};
}
function figJpeg(){
  const qv = 25, {n, p} = JIMG, J = jpeg(qv), S = 270;
  const orig = pixels('jorig', n, n, (i,j)=>p[j*n+i]/255);
  const dec  = pixels('jq'+qv, n, n, (i,j)=>J.out[j*n+i]/255);
  const lab = (t, x) => P.texName(t, {xMid:x, baseline:S+30, size:16, color:C.ink, figW:600});
  const pct = (100*J.nz/(n*n)).toFixed(1);
  return `<svg viewBox="0 0 600 ${S+76}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Inter,-apple-system,sans-serif">`
    + picture(orig, 0, 0, S, S, true) + picture(dec, 330, 0, S, S, true)
    + lab('\\text{original}', S/2) + lab(`\\text{quality }${qv}`, 330+S/2)
    + `<text x="300" y="${S+64}" font-size="15" fill="${C.muted}" text-anchor="middle">${J.nz} of ${n*n} coefficients are not zero (${pct}%)</text></svg>`;
}

/* ---- the "around us" galleries and the chain of the summary -------------- */
const EXO = o => Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3}, o);
const mulaw = x => sgn(x)*Math.log(1+MU*Math.abs(x))/Math.log(1+MU);
const alaw  = x => { const u=Math.abs(x);
  return sgn(x)*(u < 1/A_LAW ? A_LAW*u/(1+Math.log(A_LAW)) : (1+Math.log(A_LAW*u))/(1+Math.log(A_LAW))); };
/* A gallery's four figures as two rows of two, each with its caption. */
const gallery = figs => [0,2].map(i=>({t:'figrow', n:2, items:figs.slice(i,i+2).map(([svg,cap])=>({svg, cap}))}));

const GAL_SAMPLING = [
  [()=>{ const a=P.Axes(EXO({xr:[-70,70],yr:[-0.1,1.3],xlabel:'f\\;(\\text{kHz})',ylabel:'G_\\delta(f)',
      xticksOverride:[-44.1,-20,20,44.1],ytickfmt:()=>''}));
    for(const c of [-44.1,0,44.1]) copy(a,c,20,1,{color:C.mid,width:2.2});
    return a.svg(); }, 'CD audio is sampled at $44.1$ kHz. Hearing ends near $20$ kHz, so a $4.1$ kHz guard band remains.'],
  [()=>{ const a=P.Axes(EXO({xr:[-12,12],yr:[-0.1,1.3],xlabel:'f\\;(\\text{kHz})',ylabel:'G_\\delta(f)',
      xticksOverride:[-8,-3.4,3.4,8],ytickfmt:()=>''}));
    const band = c => [1,-1].forEach(s=>a.poly([[c+0.3*s,0],[c+0.9*s,1],[c+2.2*s,0.62],[c+3.4*s,0]],{color:C.mid,width:2.2}));
    for(const c of [-16,-8,0,8,16]) band(c);
    return a.svg(); }, 'Telephone speech is filtered to $3.4$ kHz and sampled at $8$ kHz, which leaves a $1.2$ kHz guard band.'],
  [()=>{ const a=P.Axes(EXO({xr:[0,60],yr:[-14,26],xlabel:'\\text{true rate (Hz)}',ylabel:'\\text{seen (Hz)}',
      xticksOverride:[0,12,24,36,48,60],ytarget:4}));
    a.curve(f=>f,{color:C.in,width:1.4,dash:'5 5'});
    const pts=[]; for(let i=0;i<=1200;i++){ const f=60*i/1200; pts.push([f, f-24*Math.round(f/24)]); }
    for(let i=1;i<pts.length;i++) if(Math.abs(pts[i][1]-pts[i-1][1])<5) a.poly([pts[i-1],pts[i]],{color:C.mid,width:2.2});
    a.point(20,-4,{color:C.err,r:4.5});
    return a.svg(); }, 'Film samples at $24$ frames a second. A spoke pattern repeating $20$ times a second appears to turn backwards at $4$ a second.'],
  [()=>{ const beat = t => { const u=((t%0.8)+0.8)%0.8, G=(c,w,h)=>h*Math.exp(-(((u-c)/w)**2));
      return G(0.10,0.025,0.12)+G(0.20,0.010,-0.10)+G(0.23,0.012,1.0)+G(0.26,0.012,-0.22)+G(0.45,0.040,0.30); };
    const a=P.Axes(EXO({xr:[0,1.6],yr:[-0.4,1.2],xlabel:'t\\;(\\text{s})',ylabel:'v(t)\\;(\\text{mV})',xtarget:5}));
    a.curve(beat,{color:C.in,n:1600});
    return a.svg(); }, 'An electrocardiograph samples at $500$ Hz. The diagnostic band ends near $150$ Hz, below $f_s/2=250$ Hz.']
];
const GAL_RECONSTRUCT = [
  [()=>{ const a=P.Axes(EXO({xr:[0,8.4],yr:[-1.5,1.5],xlabel:'t/T_s',ylabel:'g_r(t)',xtarget:5}));
    a.curve(g,{color:C.in,width:1.4,dash:'4 6',opacity:.6});
    const pts=[]; for(let n=0;n<=8;n++){ pts.push([n,g(n)],[n+1,g(n)]); }
    a.poly(pts,{color:C.out,width:2.2});
    for(let n=0;n<=8;n++) a.point(n,g(n),{color:C.in,r:3.6});
    return a.svg(); }, 'A zero-order hold keeps each sample until the next one. The output is a staircase.'],
  [()=>{ const a=P.Axes(EXO({xr:[0,1],yr:[0,1.12],xlabel:'f/f_s',ylabel:'|H(f)|',xticksOverride:[0,0.5,1],ytarget:3}));
    a.curve(f=>Math.abs(sinc(f)),{color:C.h,width:2.3});
    a.point(0.5,2/Math.PI,{color:C.h,r:4.5});
    a.note(0.53,2/Math.PI+0.08,'-3.92\\ \\mathrm{dB}',{tex:true,fs:14,color:C.h});
    return a.svg(); }, 'The hold is a filter with gain $|\\operatorname{sinc}(f/f_s)|$. It falls to $2/\\pi$ at $f_s/2$.'],
  [()=>{ const a=P.Axes(EXO({xr:[0,8.4],yr:[-1.5,1.5],xlabel:'t/T_s',ylabel:'g_r(t)',xtarget:5}));
    a.curve(g,{color:C.in,width:1.4,dash:'4 6',opacity:.6});
    a.poly([...Array(9)].map((_,n)=>[n,g(n)]),{color:C.out,width:2.2});
    for(let n=0;n<=8;n++) a.point(n,g(n),{color:C.in,r:3.6});
    return a.svg(); }, 'Joining the samples by straight lines is a filter with a triangular impulse response. It is smoother than the hold, but still not a sinc.'],
  [()=>{ const a=P.Axes(EXO({xr:[-200,200],yr:[-0.1,1.4],xlabel:'f\\;(\\text{kHz})',ylabel:'G_\\delta(f)',
      xticksOverride:[-176.4,0,176.4],ytickfmt:()=>''}));
    for(const c of [-176.4,0,176.4]) copy(a,c,20,1,{color:C.mid,width:2.2});
    a.poly([[-200,0],[-156.4,0],[-20,1.15],[20,1.15],[156.4,0],[200,0]],{color:C.h,width:1.6,dash:'6 5'});
    return a.svg(); }, 'Oversampling CD audio by four moves the first copy to $156.4$ kHz. A gentle filter (dashed) then removes it.']
];
const GAL_QUANT = [
  [()=>{ const a=P.Axes(EXO({xr:[0,10],yr:[36.55,37.15],xlabel:'t\\;(\\text{min})',ylabel:'T\\;(^\\circ\\mathrm{C})',xtarget:5,ytarget:3}));
    const T = t => 36.62+0.046*t;
    a.curve(T,{color:C.in,width:1.6,dash:'5 5'});
    a.curve(t=>Math.round(T(t)*10)/10,{color:C.mid,width:2.3,n:1600});
    return a.svg(); }, 'A clinical thermometer shows $0.1\\ ^\\circ$C steps. The reading jumps only when the temperature crosses a boundary.'],
  [()=>{ const D=3.3/1024*1000;
    const a=P.Axes(EXO({xr:[0,20],yr:[-0.5,7],xlabel:'x\\;(\\text{mV})',ylabel:'\\text{code}',xtarget:5,ytarget:4}));
    a.curve(x=>Math.floor(x/D),{color:C.mid,width:2.3,n:1600});
    return a.svg(); }, 'A 10-bit converter over $3.3$ V has $\\Delta=3.3/1024=3.22$ mV. Inputs inside one step share one code.'],
  [()=>{ const a=P.Axes(EXO({xr:[0,3.2],yr:[-0.3,3.4],xlabel:'\\text{load (g)}',ylabel:'\\text{reading (g)}',xtarget:5,ytarget:4}));
    a.curve(x=>x,{color:C.in,width:1.4,dash:'5 5'});
    a.curve(x=>Math.round(x),{color:C.mid,width:2.3,n:1600});
    a.point(0.4,0,{color:C.err,r:4.5});
    return a.svg(); }, 'A kitchen scale reads in $1$ g steps and rounds. A $0.4$ g feather reads $0$: the scale is a mid-tread quantizer.'],
  [()=>{ const a=P.Axes(EXO({xr:[-3.4,3.4],yr:[0,0.5],xlabel:'w/\\sigma',ylabel:'\\text{share of weights}',ynameAtAxis:true,xticksOverride:[-3,-2,-1,0,1,2,3],yticksOverride:[]}));
    const D=0.4;
    const Pc=w=>{ let s=0; const n=400, lo=-8; for(let i=0;i<n;i++){ const u=lo+(w-lo)*(i+.5)/n; s+=phi(u); } return s*(w-lo)/n; };
    a.curve(phi,{color:C.in,width:1.6,dash:'5 5'});
    a.stem([...Array(16)].map((_,k)=>{ const l=-3+k*D, lo=k?l-D/2:-8, hi=k<15?l+D/2:8; return [l,(Pc(hi)-Pc(lo))/D]; }),{color:C.mid});
    return a.svg(); }, 'A language model with $70\\times10^{9}$ weights needs $140$ GB at $16$ bits. At $4$ bits each weight is rounded to one of $2^{4}=16$ levels, and the model needs about $35$ GB.']
];
/* One row of a smooth gradient at two level counts. */
function figBanding(){
  const a = P.Axes(EXO({xr:[0,1], yr:[-0.06,1.10], xlabel:'\\text{position across the image}',
    ylabel:'\\text{brightness}', pad:{l:60,r:22,t:22,b:44}, xtarget:5, ytarget:5}));
  const q = (v,L) => (Math.min(L-1, Math.floor(v*L)) + 0.5)/L;
  a.curve(x => q(x, 256), {color:C.in, width:2.0, n:1400});
  a.curve(x => q(x, 8),   {color:C.mid, width:2.4, n:1400});
  a.note(0.06, 0.96, 'L=256', {tex:true, fs:14, color:C.in});
  a.note(0.62, 0.30, 'L=8', {tex:true, fs:14, color:C.mid});
  return a.svg();
}
const GAL_SQNR = [
  [()=>{ const s=ALPHA_SINE+6.0206*16;
    const a=P.Axes(EXO({xr:[-60,-1e-6],xticksOverride:[-60,-40,-20,-1e-6],xtickfmt:v=>String(Math.round(v)),yr:[0,110],xlabel:'\\text{level (dB below full scale)}',ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})'}));
    a.curve(l=>s+l,{color:C.mid,width:2.3});
    a.point(-40,s-40,{color:C.mid,r:4.5});
    a.note(-37,s-58,'58.1\\ \\mathrm{dB}',{tex:true,fs:14,color:C.mid});
    return a.svg(); }, 'CD audio uses $16$ bits: $98.1$ dB at full scale, and $58.1$ dB for a passage $40$ dB quieter.'],
  [()=>{ const s=ALPHA_SINE+6.0206*8;
    const a=P.Axes(EXO({xr:[-60,-1e-6],xticksOverride:[-60,-40,-20,-1e-6],xtickfmt:v=>String(Math.round(v)),yr:[-10,60],xlabel:'\\text{level (dB below full scale)}',ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})'}));
    a.curve(l=>s+l,{color:C.mid,width:2.3});
    a.point(-30,s-30,{color:C.err,r:4.5});
    a.note(-28,s-36,'19.9\\ \\mathrm{dB}',{tex:true,fs:14,color:C.err});
    return a.svg(); }, 'By $\\alpha+6.02R$, uniform $8$-bit PCM gives $49.9$ dB at full scale but only $19.9$ dB for a signal $30$ dB below it.'],
  [()=>figBanding(), 'A row of an image at $8$ levels shows bands where the $256$-level row is smooth.'],
  [()=>{ const R=[8,12,16,24], nm=['telephone','camera','CD','studio'];
    const a=P.Axes(EXO({xr:[4,27],yr:[0,180],xlabel:'R\\;(\\text{bits})',ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',xticksOverride:R,ytarget:4}));
    a.stem(R.map(r=>[r,ALPHA_SINE+6.0206*r]),{color:C.mid});
    R.forEach((r,i)=>a.note(r,ALPHA_SINE+6.0206*r+20,nm[i],{fs:13,color:C.muted,anchor:'middle'}));
    return a.svg(); }, 'A full-scale sinusoid at common word lengths: $49.9$, $74.0$, $98.1$ and $146.3$ dB.']
];
/* SQNR of a sinusoid at a level below full scale, measured through an 8-bit
   quantizer with or without the mu-law compressor. */
function sqnrLevel(lvl, compand){
  const A = Math.pow(10, lvl/20), L = 256, D = 2/L, N = 4000; let pm = 0, pq = 0;
  for(let i=0;i<N;i++){
    const x = A*Math.sin(2*Math.PI*(i+0.37)/N);
    const y = compand ? mulaw(x) : x;
    const yq = Math.max(-L/2+0.5, Math.min(L/2-0.5, Math.floor(y/D)+0.5))*D;
    const xq = compand ? muinv(yq) : yq;
    pm += x*x; pq += (x-xq)*(x-xq);
  }
  return 10*Math.log10(pm/pq);
}
const GAL_COMPANDING = [
  [()=>{ const a=P.Axes(EXO({xr:[-50,-1e-6],xticksOverride:[-50,-40,-30,-20,-10,-1e-6],xtickfmt:v=>String(Math.round(v)),yr:[0,55],xlabel:'\\text{level (dB below full scale)}',ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',ytarget:4}));
    const pts=c=>{ const p=[]; for(let l=-50;l<=0;l+=2.5) p.push([l,sqnrLevel(l,c)]); return p; };
    a.poly(pts(false),{color:C.in,width:2.2}); a.poly(pts(true),{color:C.mid,width:2.4});
    a.note(-49,12,'\\text{uniform}',{tex:true,fs:13,color:C.in});
    a.note(-49,42,'\\mu\\text{-law}',{tex:true,fs:13,color:C.mid});
    return a.svg(); }, 'Two $8$-bit quantizers on a sinusoid. The $\\mu$-law SQNR stays nearly flat as the level falls. The uniform one falls a decibel per decibel.'],
  [()=>{ const a=P.Axes(EXO({xr:[0,0.05],yr:[0,0.5],xlabel:'x/x_{\\max}',ylabel:'y',xticksOverride:[0,0.0114,0.05],ytarget:3}));
    a.curve(mulaw,{color:C.in,width:2.3}); a.curve(alaw,{color:C.h,width:2.3,dash:'6 4'});
    a.vline(1/A_LAW,{color:C.muted});
    return a.svg(); }, 'Near zero the laws differ: A-law is a straight line up to $1/A=0.0114$, and $\\mu$-law is curved all the way.'],
  [()=>{ const burst = t => Math.exp(-2.2*t)*(Math.sin(2*Math.PI*3.1*t)+0.4*Math.sin(2*Math.PI*7.3*t));
    const a=P.Axes(EXO({xr:[0,2],yr:[-1.2,1.2],xlabel:'t\\;(\\text{s})',ylabel:'x(t),\\;y(t)',xtarget:5,ytarget:3}));
    a.curve(burst,{color:C.in,width:1.6,n:1600}); a.curve(t=>mulaw(burst(t)),{color:C.mid,width:2.1,n:1600});
    return a.svg(); }, 'A decaying burst (cyan) and its $\\mu$-law compressed form (violet). The quiet tail is lifted toward full scale.'],
  [()=>{ const L=8, D=2/L;
    const a=P.Axes(EXO({xr:[-1,1],yr:[-1.1,1.1],xlabel:'x',ylabel:'\\hat{x}',xtarget:4,ytarget:4}));
    a.curve(x=>x,{color:C.rule,width:1.2,dash:'3 4'});
    a.curve(x=>muinv(Math.max(-L/2+0.5,Math.min(L/2-0.5,Math.floor(mulaw(x)/D)+0.5))*D),{color:C.mid,width:2.3,n:2400});
    return a.svg(); }, 'A $3$-bit $\\mu$-law quantizer drawn against its input: narrow steps near zero, wide steps near the peak.']
];
const GAL_PCM = [
  [()=>{ const a=P.Axes(EXO({xr:[-0.5,16.5],yr:[-2.6,2.6],xlabel:'n',ylabel:'\\text{L, R}',xtarget:5,yticksOverride:[]}));
    const Lc=[...Array(17)].map((_,n)=>[n,1.3+0.9*Math.sin(0.5*n)]), Rc=[...Array(17)].map((_,n)=>[n,-1.3+0.9*Math.sin(0.5*n+1.3)]);
    a.hline(1.3,{color:C.rule}); a.hline(-1.3,{color:C.rule});
    Lc.forEach(([n,v])=>a.poly([[n,1.3],[n,v]],{color:C.mid,width:1.8})); Lc.forEach(([n,v])=>a.point(n,v,{color:C.mid,r:3.4}));
    Rc.forEach(([n,v])=>a.poly([[n,-1.3],[n,v]],{color:C.mid,width:1.8})); Rc.forEach(([n,v])=>a.point(n,v,{color:C.mid,r:3.4}));
    return a.svg(); }, 'CD audio: two channels of $16$ bits at $44.1$ kHz give $2(16)(44\\,100)=1.4112$ Mb/s.'],
  [()=>{ const a=P.Axes(EXO({xr:[0,8],yr:[-1.9,1.9],xlabel:'t\\;(\\mu\\text{s})',ylabel:'',xticksOverride:[],yticksOverride:[]}));
    [0,4,8].forEach(k=>a.note(k,-1.6,P.fmt(k*15.625,1),{fs:13,color:C.muted,anchor:'middle'}));
    const bits=[1,0,1,1,0,0,1,0], pts=[]; bits.forEach((b,k)=>{ pts.push([k,b?1:-1],[k+1,b?1:-1]); });
    for(let k=1;k<8;k++) a.vline(k,{color:C.rule,dash:'2 4'});
    a.poly(pts,{color:C.in,width:2.2}); a.span(0,8,1.45,'125\\ \\mu\\text{s}',{tex:true,fs:13,color:C.muted});
    return a.svg(); }, 'A telephone call sends one $8$-bit word every $125\\ \\mu$s, which is $64$ kb/s.'],
  [()=>{ const bits=[1,0,1,1,0,0,1,0], f=LINE_CODES[3][1], pts=[];
    const a=P.Axes(EXO({xr:[0,8],yr:[-1.6,1.9],xlabel:'\\text{bit}',ylabel:'',xticksOverride:[],yticksOverride:[]}));
    for(let k=1;k<8;k++) a.vline(k,{color:C.rule,dash:'2 4'});
    bits.forEach((b,k)=>{ for(let j=0;j<=40;j++) pts.push([k+j/40, f(b,j/40)]); a.note(k+0.5,1.5,String(b),{fs:13,color:C.ink,anchor:'middle'}); });
    a.poly(pts,{color:C.in,width:2.2});
    return a.svg(); }, 'Ten-megabit Ethernet over twisted pair uses Manchester coding: a transition in the middle of every bit.'],
  [()=>{ const a=P.Axes(EXO({xr:[0,8],yr:[0,3.3],xlabel:'\\text{sector}',ylabel:'\\text{track}',xticksOverride:[0,2,4,6,8],yticksOverride:[],grid:false}));
    for(let k=0;k<8;k++){ const gc=k^(k>>1); for(let b=0;b<3;b++){ const on=(gc>>(2-b))&1;
      a.rect(k,2.2-b*1.05,k+1,3.1-b*1.05,{fill:on?C.in:'none',stroke:C.rule,width:1}); } }
    return a.svg(); }, 'A shaft encoder prints a Gray code on three tracks. At each sector edge only one track changes.']
];

/* The whole chain on one message at the last frame of the summary slide: the
   filter has taken off the ripple, the sampler kept one value every T_s, the
   quantizer moved each value to one of eight levels, the encoder wrote three
   bits for each. */
const CH_D = 0.4, chQ = s => Math.max(0, Math.min(7, Math.floor((s+1.6)/CH_D)));
function figChain(){
  const bw = 120, bh = 50, y0 = 26, xs = [22, 170, 318, 466], names = ['Lowpass filter','Sampler','Quantizer','Encoder'];
  const it = [];
  names.forEach((nm,i)=>{ it.push({t:'box', x:xs[i], y:y0, w:bw, h:bh, label:nm, fs:15});
    if(i<3) it.push({t:'arrow', x1:xs[i]+bw, y1:y0+bh/2, x2:xs[i+1], y2:y0+bh/2}); });
  const top = P.blocks({w:600, h:96, items:it}).replace(/(<svg[^>]*>)/, `$1<rect x="${xs[3]}" y="${y0}" width="${bw}" height="${bh}" fill="${C.dec.mid}" rx="2"/>`);
  const a = P.Axes({w:600, h:330, xr:[-0.4,8.4], yr:[-2.35,1.9], xlabel:'t/T_s', ylabel:'\\text{signal at this stage}',
    pad:{l:54,r:26,t:24,b:40}, ynameAtAxis:true, xtarget:9, yticksOverride:[-1.6,0,1.6]});
  for(let k=0;k<8;k++) a.hline(-1.6+(k+0.5)*CH_D, {color:C.rule, dash:'2 5', opacity:0.9});
  a.curve(g, {color:C.in, width:2.2, opacity:0.4});
  const st = []; for(let n=0;n<=8;n++) st.push([n, -1.6+(chQ(g(n))+0.5)*CH_D]);
  a.stem(st, {color:C.mid});
  for(let n=0;n<=8;n++) a.note(n, -2.1, chQ(g(n)).toString(2).padStart(3,'0'), {fs:14, color:C.mid, anchor:'middle', weight:600});
  return `<svg viewBox="0 0 600 426" xmlns="http://www.w3.org/2000/svg" role="img">${place(top,0,0,600,96)}${place(a.svg(),0,96,600,330)}</svg>`;
}

window.C1 = [

/* ---------------- cover and contents ---------------- */
{t:'cover', kicker:'Sampling &middot; Detection &middot; Modulation &middot; Coding', text:'Digital Communications',
 sub:'Lecture Notes', foot:'Chapters 1&ndash;6 &middot; Appendices A&ndash;B'},
{t:'page'},

{t:'h1', text:'Contents', rule:false},
{t:'toc', items:[
 ['1','The transition from analog to digital','The Fourier transform in $f$. Impulse-train sampling, the spectral replicas and the sampling theorem. The reconstruction filter and the interpolation formula. Uniform quantization, mid-rise and mid-tread, overload and granular noise. Quantization noise, the signal-to-quantization-noise ratio and dither. Non-uniform quantization and A-law and $\\mu$-law companding. Encoding, line codes, the bandwidth and bit errors of PCM, DPCM and delta modulation. Vector quantization. Linear predictive coding, T1, sigma-delta conversion and JPEG.','PS CH7.1&ndash;7.7'],
 ['2','Baseband transmission of digital signals','The matched filter and the peak signal-to-noise ratio. Antipodal signalling, and correlator and matched-filter demodulators. The decision statistic, the optimal threshold, the $Q$ function and the bit error probability. Intersymbol interference and the eye diagram. Nyquist\'s criterion, the minimum bandwidth and the raised cosine. Equalization, timing, the spectrum of a bit stream and regenerative repeaters.','PS CH8.2&ndash;8.3, 8.9, 10.1&ndash;10.3, 10.5'],
 ['3','Geometric representation of signal waveforms','Signals as vectors: orthonormal bases, coordinates, inner products, energy and distance. The constellation diagram, a cosine and a sine as axes, and points on a circle. The Gram&ndash;Schmidt procedure and the choice of basis.','PS CH8.1&ndash;8.2, 8.6.1, 8.7.1'],
 ['4','The optimal receiver in additive white Gaussian noise','The observation vector and the noise outside the signal space. The MAP and ML rules, minimum-distance detection and the correlation metric. Decision regions and the binary error probability. The union bound, its intelligent form and the nearest-neighbour approximation.','PS CH8.3.3, 8.4'],
 ['5','Digital modulation methods','Bits on a carrier and the IQ modulator. BPSK, BFSK and BASK compared. M-ary phase-shift keying, QPSK as two BPSK links, Gray labels, carrier phase error and differential PSK. M-ary amplitude-shift keying, quadrature amplitude modulation, eight-point constellations and QAM against PSK. M-ary frequency-shift keying, orthogonal signals and noncoherent detection. Bandwidth, offset QPSK and MSK, and the bandwidth-efficiency plane. Adaptive modulation, the receiver noise floor and the link budget.','PS CH6.4, 8.5&ndash;8.7, 9.1, 9.5&ndash;9.7, 10.2, 14.5'],
 ['6','An introduction to information theory','Self-information, entropy and extended sources. Typical sequences, the source coding theorem, prefix codes, the Kraft inequality, and rate and distortion. Huffman, arithmetic and Lempel&ndash;Ziv coding. The discrete memoryless channel, joint and conditional entropy, and mutual information. Channel capacity, the binary symmetric and erasure channels, repetition codes, the channel coding theorem and the Hamming code. The Gaussian channel, the Shannon limit and water-filling.','PS CH12.1&ndash;12.6'],
 ['A','Summary of formulas','The results each chapter carries forward, as question and answer, one table a chapter, in course order and without derivations.','&mdash;'],
 ['B','The laboratories','Four laboratories on quantization, matched filtering, quadrature amplitude modulation, and Huffman coding.','&mdash;']
]},

{t:'h3', text:'Course conventions'},
{t:'p', text:'These notes are written for undergraduates. They assume Fourier analysis, probability and random processes. Read the plain explanation before the mathematics. Worked examples use five headings: Given, Find, Method, Solution, and Check.'},
{t:'p', text:'Noise is white and Gaussian with <b>two-sided</b> power spectral density $N_0/2$ watts per hertz. The Gaussian tail is $Q(x)=\\frac{1}{\\sqrt{2\\pi}}\\int_x^{\\infty}e^{-t^{2}/2}\\,dt=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$. Energy and power use $R=1\\ \\Omega$.'},
{t:'p', text:'A <b>PS</b> marker points to the related section of Proakis and Salehi, <i>Fundamentals of Communication Systems</i>, second edition. The textbook chapter numbers differ from the course chapter numbers.'},

{t:'page'},

/* ================= CHAPTER 1 ================= */
{t:'h1', num:'CHAPTER 1', text:'The transition from analog to digital'},
{t:'p', lead:true, text:'A continuous waveform becomes a bit stream in three stages: sampling, quantization and encoding.'},
{t:'p', text:'Two results carry through the chapter. Sampling can be undone. At $f_s\\ge 2W$ the samples of a signal bandlimited to $W$ determine it exactly. Quantization cannot be undone. Each extra bit divides the error power by four, which is about $6$ dB of signal-to-quantization-noise ratio.'},

/* ---------------------------------------------------------------- 1.1 */
{t:'h2', num:'1.1', text:'The sampling theorem'},

{t:'h3', text:'Fourier transform review'},
{t:'p', text:'This chapter writes the Fourier transform in the frequency variable $f$, in hertz.'},
{t:'eqbox', cap:'The transform in $f$', tex:'\\begin{aligned}X(f)&=\\int_{-\\infty}^{\\infty}x(t)\\,e^{-j2\\pi ft}\\,dt\\\\x(t)&=\\int_{-\\infty}^{\\infty}X(f)\\,e^{j2\\pi ft}\\,df\\end{aligned}',
 after:'Put $\\omega=2\\pi f$. Then $d\\omega=2\\pi\\,df$, so the factor $1/2\\pi$ of the inverse transform in $\\omega$ disappears.'},
{t:'p', text:'Five properties are used below. A shift in time multiplies the transform by a phase. A multiplication by a complex exponential shifts the transform. Convolution and multiplication trade places.'},
{t:'eqbox', cap:'Properties', tex:'\\begin{aligned}x(t-t_0)&\\;\\leftrightarrow\\;X(f)\\,e^{-j2\\pi ft_0}\\\\x(t)\\,e^{j2\\pi f_0t}&\\;\\leftrightarrow\\;X(f-f_0)\\\\x(t)*y(t)&\\;\\leftrightarrow\\;X(f)\\,Y(f)\\\\x(t)\\,y(t)&\\;\\leftrightarrow\\;X(f)*Y(f)\\\\\\int_{-\\infty}^{\\infty}|x(t)|^{2}\\,dt&=\\int_{-\\infty}^{\\infty}|X(f)|^{2}\\,df\\end{aligned}',
 after:'The last line is Parseval\'s theorem: the energy is the same in both domains.'},
{t:'p', text:'The pairs below are the ones the chapter uses. Here $\\Pi(t/T)$ is $1$ for $|t|<T/2$ and $0$ elsewhere. The course uses $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$ and $f_s=1/T_s$.'},
{t:'eqbox', cap:'Pairs', tex:'\\begin{aligned}\\delta(t)&\\;\\leftrightarrow\\;1\\\\1&\\;\\leftrightarrow\\;\\delta(f)\\\\e^{j2\\pi f_0t}&\\;\\leftrightarrow\\;\\delta(f-f_0)\\\\\\cos(2\\pi f_0t)&\\;\\leftrightarrow\\;\\tfrac12\\delta(f-f_0)+\\tfrac12\\delta(f+f_0)\\\\\\Pi(t/T)&\\;\\leftrightarrow\\;T\\operatorname{sinc}(fT)\\\\2W\\operatorname{sinc}(2Wt)&\\;\\leftrightarrow\\;\\Pi\\!\\left(\\frac{f}{2W}\\right)\\\\\\sum_{n}\\delta(t-nT_s)&\\;\\leftrightarrow\\;\\frac{1}{T_s}\\sum_{n}\\delta(f-nf_s)\\end{aligned}'},
{t:'box', kind:'err', hd:'Common error', html:'Use $1\\leftrightarrow\\delta(f)$, not $1\\leftrightarrow2\\pi\\delta(f)$, when the $\\omega$ pair $1\\leftrightarrow2\\pi\\delta(\\omega)$ moves to $f$. The reason is $\\delta(2\\pi f)=\\delta(f)/2\\pi$.'},

{t:'h3', text:'Impulse-train sampling'},
{t:'p', text:'An ideal sampler takes one value of the message $g(t)$ every $T_s$ seconds. The <b>sampling frequency</b> is $f_s=1/T_s$. The sampler is modelled as a multiplication by a train of unit impulses.'},
{t:'eqbox', cap:'Impulse train', tex:'p(t)=\\sum_{n=-\\infty}^{\\infty}\\delta(t-nT_s),\\qquad f_s=\\frac{1}{T_s}'},
{t:'p', text:'The <b>sampled signal</b> is the product $g_\\delta(t)=g(t)\\,p(t)$. Move $g(t)$ inside the sum. Then use the sampling property $g(t)\\delta(t-t_0)=g(t_0)\\delta(t-t_0)$ on each term.'},
{t:'eqbox', cap:'Sampled signal', tex:'\\begin{aligned}g_\\delta(t)&=g(t)\\,p(t)\\\\&=g(t)\\sum_{n=-\\infty}^{\\infty}\\delta(t-nT_s)\\\\&=\\sum_{n=-\\infty}^{\\infty}g(t)\\,\\delta(t-nT_s)\\\\&=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\,\\delta(t-nT_s)\\end{aligned}',
 after:'Each impulse now carries the sample value at its own time.'},
{t:'fig', svg:()=>narrow(figSamplingStack(),64), cap:'The message $g(t)$, the impulse train $p(t)$ behind it, and their product $g_\\delta(t)$. Each impulse of $g_\\delta$ has the height of the message at its sampling instant.', short:'Impulse-train sampling.'},
{t:'p', text:'For example, a sampler with $T_s=125\\ \\mu$s has $f_s=1/(125\\times10^{-6})=8000$ Hz, or $8$ kHz.'},

{t:'h3', text:'The spectrum of a sampled signal'},
{t:'p', text:'The sampled signal is a product in time. A product in time is a convolution in frequency, so the first step is one line.'},
{t:'eqbox', cap:'Product in time', tex:'G_\\delta(f)=G(f)*P(f)',
 after:'In $f$, no $2\\pi$ appears in either pair used here: $x(t)\\,y(t)\\leftrightarrow X(f)*Y(f)$ and $e^{j2\\pi f_0t}\\leftrightarrow\\delta(f-f_0)$.'},
{t:'p', text:'The train $p(t)$ is periodic with period $T_s$, so it has a Fourier series. Over one period it holds only the impulse at $t=0$. Sifting gives $e^{0}=1$ for every coefficient $c_n$.'},
{t:'eqbox', cap:'Transform of the train', tex:'\\begin{aligned}c_n&=\\frac{1}{T_s}\\int_{-T_s/2}^{T_s/2}\\delta(t)\\,e^{-j2\\pi nf_st}\\,dt=\\frac{1}{T_s}\\\\p(t)&=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}e^{j2\\pi nf_st}\\\\P(f)&=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)\\end{aligned}',
 after:'The second pair, with $f_0=nf_s$, transforms each term of the series.'},
{t:'fig', svg:()=>narrow(figSpectrumPair(),64), cap:'The message spectrum $G(f)$, and the spectrum after sampling at $f_s=3W$. A scaled copy of $G(f)$ sits at every multiple of $f_s$.', short:'The spectrum before and after sampling.'},
{t:'p', text:'For example, let $G(f)=0$ for $|f|\\ge 4$ kHz and $f_s=10$ kHz. The copy $G(f-f_s)$ occupies $f_s-W<f<f_s+W$. So it begins at $10-4=6$ kHz.'},

{t:'h3', text:'Spectral replicas'},
{t:'p', text:'It remains to convolve $G(f)$ with one shifted impulse. Write the convolution integral. The impulse is even, so flip the sign of its argument. Then sift at $\\theta=f-nf_s$.'},
{t:'eqbox', cap:'Convolution with one impulse', tex:'\\begin{aligned}G(f)*\\delta(f-nf_s)&=\\int_{-\\infty}^{\\infty}G(\\theta)\\,\\delta(f-nf_s-\\theta)\\,d\\theta\\\\&=\\int_{-\\infty}^{\\infty}G(\\theta)\\,\\delta\\bigl(\\theta-(f-nf_s)\\bigr)\\,d\\theta\\\\&=G(f-nf_s)\\end{aligned}'},
{t:'p', text:'Put $P(f)$ into $G(f)*P(f)$ and convolve term by term. Each impulse of $P(f)$ places one copy of $G$ at a multiple of $f_s$. The factor $1/T_s$ equals $f_s$.'},
{t:'eqbox', cap:'Key result: spectrum replicas', tex:'\\begin{aligned}G_\\delta(f)&=\\frac{1}{T_s}\\sum_{n}G(f)*\\delta(f-nf_s)\\\\&=f_s\\sum_{n=-\\infty}^{\\infty}G(f-nf_s)\\end{aligned}',
 after:'Sampling copies the spectrum to every multiple of $f_s$ and scales it by $f_s$.'},
{t:'fig', svg:()=>narrow(figSpectrumBuild(),64), cap:'The message spectrum $G(f)$ (dashed) is scaled by $f_s$, and one copy is added for each pair of impulses at $\\pm nf_s$. Copies are drawn at $\\pm f_s$ and $\\pm2f_s$.', short:'The spectral replicas.'},
{t:'p', text:'For example, let a signal be sampled at $f_s=8$ kHz. The copy centred at $f_s$ is $G(f-8\\text{ kHz})$. It equals $G(1\\text{ kHz})$ where $f-8=1$, that is at $9$ kHz.'},

{t:'h3', text:'Three sampling rates'},
{t:'p', text:'The copies have width $2W$ and sit $f_s$ apart. The geometry of the copies separates three cases.'},
{t:'ol', items:[
 '$f_s>2W$: <b>oversampling</b>. A gap separates the copies.',
 '$f_s=2W$: <b>Nyquist sampling</b>. The copies touch.',
 '$f_s<2W$: <b>undersampling</b>. The copies overlap.'
]},
{t:'figrow', n:2, items:[
 {svg:()=>figCaseAt(3), cap:'$f_s=3W$: a guard band separates the copies.'},
 {svg:()=>figCaseAt(1.5), cap:'$f_s=1.5W$: the copies overlap, and the overlaps (red) are aliasing.'}
]},
{t:'box', kind:'err', hd:'Aliasing', html:'Where two copies overlap, a high message frequency lands on a low one. No filter can separate them, so the samples no longer determine the signal.'},
{t:'box', kind:'warn', hd:'Guard band', html:'A real signal is not strictly bandlimited. Sample at $f_s=2W+f_g$, where $f_g$ is a <b>guard band</b>. Filter out everything above $W$ before the sampler.'},
{t:'p', text:'For example, let $W=3$ kHz and $f_s=5$ kHz. Then $f_s<2W=6$ kHz. The first copy starts at $5-3=2$ kHz, inside the message band, so the copies overlap.'},

{t:'h3', text:'The sampling theorem'},
{t:'p', text:'The three cases give the condition for exact recovery. The copies must not overlap.'},
{t:'box', kind:'def', hd:'Sampling theorem', html:'If $G(f)=0$ for $|f|\\ge W$ and $f_s\\ge 2W$, the samples $g(nT_s)$ determine $g(t)$ exactly.'},
{t:'p', text:'The copy at $f_s$ starts at $f_s-W$. That start must not lie below the message edge $W$.'},
{t:'eqbox', cap:'Key result: Nyquist rate', tex:'\\begin{aligned}f_s-W&\\ge W\\\\f_s&\\ge 2W\\\\f_s^{\\min}&=2W\\end{aligned}',
 after:'The least rate $2W$ is the <b>Nyquist rate</b>.'},
{t:'p', text:'The same condition, written for the sampling interval, gives the longest interval allowed. It is the <b>Nyquist interval</b>.'},
{t:'eqbox', cap:'Nyquist interval', tex:'\\begin{aligned}T_s&=\\frac{1}{f_s}\\le\\frac{1}{2W}\\\\T_s^{\\max}&=\\frac{1}{2W}\\end{aligned}'},
{t:'fig', svg:()=>narrow(figCaseAt(2),64), cap:'At $f_s=2W$ the copies touch without overlap. A lower rate causes overlap. A higher rate leaves a gap.', short:'Sampling at the Nyquist rate.'},
{t:'p', text:'For example, telephone speech is bandlimited to $W=3.4$ kHz. The longest sampling interval is $T_s^{\\max}=1/(2W)=1/(6.8\\text{ kHz})=147\\ \\mu$s.'},

{t:'h3', text:'Aliasing in an image'},
{t:'p', text:'A camera samples a scene in space with its pixels. A pattern finer than two pixels a cycle folds back into a coarser false pattern, called <b>moir&eacute;</b>.'},
{t:'p', text:'Two pixels a cycle is the Nyquist rate in space. An image $N$ pixels across therefore holds a pattern of spatial frequency $f$ only up to a limit.'},
{t:'eqbox', cap:'No aliasing', tex:'f\\le\\frac{N}{2}\\ \\ \\text{cycles per image width}'},
{t:'fig', svg:()=>narrow(figMoire(48),78), cap:'Rings that get finer toward the edge, and the same rings sampled on a $48\\times48$ grid. Outside the red circle the rings are finer than two pixels a cycle, and false rings appear.', short:'Aliasing in an image.'},
{t:'box', kind:'warn', hd:'Optical filter', html:'Many cameras put a slight blur in front of the sensor. It removes detail finer than the pixels, as an anti-aliasing filter does before a sampler.'},
{t:'p', text:'For example, an image $1000$ pixels wide holds at most $N/2=1000/2=500$ cycles across its width without aliasing.'},

{t:'h3', text:'Sampling rates around us'},
{t:'box', kind:'def', hd:'Rate from the band', html:'Each system samples above twice its highest frequency. A filter before the sampler removes anything above $f_s/2$.'},
...gallery(GAL_SAMPLING),
{t:'box', kind:'err', hd:'Aliasing you can see', html:'A film camera has no filter before its sampler. A motion faster than half the frame rate folds back, so a wheel can appear to turn backwards.'},

/* ---------------------------------------------------------------- 1.2 */
{t:'h2', num:'1.2', text:'Reconstruction'},

{t:'h3', text:'The reconstruction filter'},
{t:'p', text:'To recover $g(t)$, keep the copy at the origin and reject all the others. An ideal lowpass filter does this.'},
{t:'eqbox', cap:'Ideal lowpass filter', tex:'H(f)=\\begin{cases}T_s, & |f|\\le W\\\\[2pt] 0, & |f|>f_s-W\\end{cases}',
 after:'Between $W$ and $f_s-W$ there is no signal energy, so the filter may do anything there.'},
{t:'fig', svg:()=>narrow(figLpf(),64), cap:'At $f_s=2.6W$ the ideal filter (solid, amber) keeps the copy at the origin. A filter that can be built (dashed) falls through the gap before the next copy.', short:'The reconstruction filter.'},
{t:'box', kind:'warn', hd:'Filter gain', html:'Sampling scales the spectrum by $f_s$. A gain of $T_s=1/f_s$ removes the scale. A unit-gain filter returns $f_s$ times the signal.'},
{t:'box', kind:'def', hd:'Transition band', html:'Above the Nyquist rate a gap of $f_s-2W$ opens between $W$ and the next copy. A real filter needs this gap to roll off. The gap is the <b>transition band</b>.'},
{t:'p', text:'For example, let $W=4$ kHz and $f_s=10$ kHz. The next copy starts at $f_s-W=6$ kHz. The transition band is $6-4=2$ kHz wide.'},

{t:'h3', text:'The reconstruction filter in the time domain'},
{t:'p', text:'At $f_s=2W$ the gain is $T_s=1/(2W)$. Take the inverse transform of the rectangle. Integrate, then use $e^{jx}-e^{-jx}=2j\\sin x$.'},
{t:'eqbox', cap:'Impulse response at $f_s=2W$', tex:'\\begin{aligned}h(t)&=\\int_{-W}^{W}\\frac{1}{2W}e^{j2\\pi ft}\\,df\\\\&=\\frac{1}{2W}\\cdot\\frac{e^{j2\\pi Wt}-e^{-j2\\pi Wt}}{j2\\pi t}\\\\&=\\frac{1}{2W}\\cdot\\frac{2j\\sin(2\\pi Wt)}{j2\\pi t}\\\\&=\\frac{\\sin(2\\pi Wt)}{2\\pi Wt}\\\\&=\\operatorname{sinc}(2Wt)\\end{aligned}'},
{t:'p', text:'The last step uses the sinc convention of the course.'},
{t:'eqbox', cap:'The sinc convention', tex:'\\operatorname{sinc}(x)=\\frac{\\sin(\\pi x)}{\\pi x}',
 after:'The function is one at $x=0$ and zero at every non-zero integer.'},
{t:'fig', svg:()=>narrow(figSinc(),64), cap:'The pulse $\\operatorname{sinc}(2Wt)$ is one at $t=0$ and zero at every non-zero multiple of $1/(2W)$. These are the sampling instants at the Nyquist rate.', short:'The impulse response of the reconstruction filter.'},
{t:'p', text:'For example, let the message be bandlimited to $W=5$ kHz. Then $\\operatorname{sinc}(2Wt)=0$ first at $2Wt=1$. The first zero for $t>0$ is at $t=1/(2W)=100\\ \\mu$s.'},

{t:'h3', text:'The interpolation formula'},
{t:'p', text:'The reconstructed signal $g_r(t)$ is the output of the filter when the input is $g_\\delta(t)$. Filtering is convolution in time, with $\\tau$ as the integration variable.'},
{t:'eqbox', cap:'Filter the impulse train', tex:'\\begin{aligned}g_r(t)&=\\int_{-\\infty}^{\\infty}\\underbrace{\\sum_{n}g(nT_s)\\,\\delta(\\tau-nT_s)}_{g_\\delta(\\tau)}\\,h(t-\\tau)\\,d\\tau\\\\&=\\sum_{n}g(nT_s)\\int_{-\\infty}^{\\infty}h(t-\\tau)\\,\\delta(\\tau-nT_s)\\,d\\tau\\\\&=\\sum_{n}g(nT_s)\\,h(t-nT_s)\\end{aligned}',
 after:'The weights $g(nT_s)$ do not depend on $\\tau$, so the sum and the integral swap. Sifting then sets $\\tau=nT_s$ in each term.'},
{t:'p', text:'Substitute $h(t)=\\operatorname{sinc}(2Wt)$, the filter at $f_s=2W$, with $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$.'},
{t:'eqbox', cap:'Key result: interpolation formula', tex:'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\operatorname{sinc}\\!\\bigl(2W(t-nT_s)\\bigr)',
 after:'Each sample scales one sinc pulse centred on its own sampling instant.'},
{t:'fig', svg:()=>narrow(figInterp(),64), cap:'Each sample (cyan) scales one sinc pulse (dashed). The sum (green) passes through every sample. Here $T_s=1$ and $2W=1$.', short:'The interpolation formula as a sum of sinc pulses.'},
{t:'p', text:'For example, sample at the Nyquist rate and evaluate $g_r(t)$ at $t=3T_s$. The term $n$ is $g(nT_s)\\operatorname{sinc}(3-n)$. The sinc vanishes at every non-zero integer, so only the term $n=3$ is non-zero.'},

{t:'h3', text:'Partial sums of the interpolation formula'},
{t:'p', text:'At the Nyquist rate put $T_s=1/(2W)$. Then $2WnT_s=n$, and the formula takes a shorter form.'},
{t:'eqbox', cap:'At the Nyquist rate', tex:'\\begin{aligned}g(t)&=\\sum_{n}g(nT_s)\\operatorname{sinc}\\!\\bigl(2W(t-nT_s)\\bigr)\\\\&=\\sum_{n=-\\infty}^{\\infty}g\\!\\left(\\frac{n}{2W}\\right)\\operatorname{sinc}(2Wt-n)\\end{aligned}'},
{t:'box', kind:'ok', hd:'Values at the sample times', html:'$h(nT_s)=\\operatorname{sinc}(n)=0$ for $n\\ne0$. So at $t=kT_s$ only the term $n=k$ survives, and $g_r(kT_s)=g(kT_s)$.'},
{t:'fig', svg:()=>narrow(figInterpBuild(),64), cap:'The partial sum of the terms $n=1,\\dots,7$ (green) against $g(t)$ (dashed). Each new sinc pulse corrects the sum between the samples without moving it at the samples already fitted.', short:'A partial sum of the interpolation formula.'},
{t:'box', kind:'warn', hd:'A finite sum', html:'A sum over a few samples is exact only at those samples. The error between them shrinks as more terms enter.'},
{t:'p', text:'For example, let only one sample be non-zero: $g(0)=1$. The sum has one term, so the formula reconstructs $1\\cdot\\operatorname{sinc}(2Wt)$.'},

{t:'ex', hd:'Example 1.1 — the Nyquist rate, a guard band and a modulated signal', rows:[
 ['Given','$x(t)$ is bandlimited to $W=40$ kHz, and $y(t)=x(t)\\cos(80000\\pi t)$.'],
 ['Find','(a) The Nyquist rate of $x(t)$. (b) The rate of $x(t)$ with a $10$ kHz guard band. (c) The Nyquist rate of $y(t)$.'],
 ['Method','The Nyquist rate is $2W$, and a guard band $f_g$ adds to it: $f_s=2W+f_g$. For (c), find the highest frequency of $y$ first. Modulation shifts the spectrum, so the rate follows the new band edge.'],
 ['Solution','(a) and (b) follow from the two rules. $$\\text{(a)}\\quad\\begin{aligned}f_s&=2W\\\\&=2(40)\\\\&=80\\ \\text{kHz}\\end{aligned}\\qquad\\text{(b)}\\quad\\begin{aligned}f_s&=2W+f_g\\\\&=80+10\\\\&=90\\ \\text{kHz}\\end{aligned}$$ (c) The carrier frequency comes from $2\\pi f_ct=80000\\pi t$, so $f_c=40$ kHz. Write the cosine as two exponentials. Each exponential $e^{\\pm j2\\pi f_ct}$ shifts the spectrum by $\\pm f_c$. $$\\begin{aligned}y(t)&=x(t)\\cos(2\\pi f_ct)\\\\&=\\tfrac12x(t)\\,e^{j2\\pi f_ct}+\\tfrac12x(t)\\,e^{-j2\\pi f_ct}\\\\Y(f)&=\\tfrac12X(f-f_c)+\\tfrac12X(f+f_c)\\end{aligned}$$ The highest frequency of $y$ and its Nyquist rate follow. $$\\begin{aligned}f_{\\max}&=f_c+W\\\\&=40+40\\\\&=80\\ \\text{kHz}\\end{aligned}\\qquad\\begin{aligned}f_s&=2f_{\\max}\\\\&=2(80)\\\\&=160\\ \\text{kHz}\\end{aligned}$$'],
 ['Check','At $90$ kHz the first copy spans $f_s-W=50$ to $f_s+W=130$ kHz. The gap from $W=40$ to $50$ kHz is the $10$ kHz guard band. At $80$ kHz the first copy starts exactly at the message edge $W=40$ kHz.']
]},
{t:'figrow', n:2, items:[
 {svg:()=>figNyquistEx(), cap:'Parts (a) and (b): the sampled spectrum at $f_s=90$ kHz. The first copy starts at $50$ kHz and leaves a $10$ kHz guard band. At $f_s=80$ kHz it would start at $40$ kHz.'},
 {svg:()=>figModulated(), cap:'Part (c): $X(f)$ (dashed) and the two half-height copies that make $Y(f)$. The band edge of $Y(f)$ is $80$ kHz.'}
]},
{t:'box', kind:'err', hd:'Common error', html:'The rate $80$ kHz belongs to $x$. Modulation moves the highest frequency to $80$ kHz, so $y$ needs $160$ kHz.'},

{t:'h3', text:'Reconstruction around us'},
{t:'box', kind:'def', hd:'A hold, not a sinc', html:'A converter cannot build the ideal filter. It holds each sample for $T_s$, then smooths the staircase with an analog filter.'},
{t:'p', text:'A hold of length $T_s$ has a rectangular impulse response, and a rectangle transforms to a sinc. Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$.'},
{t:'eqbox', cap:'Transform pair', tex:'h_0(t)=1,\\ 0\\le t<T_s\\;\\leftrightarrow\\;T_s\\operatorname{sinc}(fT_s)\\,e^{-j\\pi fT_s}'},
...gallery(GAL_RECONSTRUCT),
{t:'box', kind:'warn', hd:'Hold droop', html:'The hold weights the spectrum by $\\operatorname{sinc}(f/f_s)$. At $f_s/2$ that is $2/\\pi$, a loss of $3.92$ dB.'},

/* ---------------------------------------------------------------- 1.3 */
{t:'h2', num:'1.3', text:'Quantization'},

{t:'h3', text:'Uniform quantization'},
{t:'box', kind:'def', hd:'Quantization', html:'Quantization replaces each sample by the nearest of $L$ <b>representation levels</b>. In a <b>uniform</b> quantizer the levels are equally spaced.'},
{t:'p', text:'The $L$ levels share the full range $[-m_{\\max},m_{\\max}]$ equally. The spacing is the <b>step size</b> $\\Delta$.'},
{t:'eqbox', cap:'Step size', tex:'\\Delta=\\frac{2m_{\\max}}{L}',
 after:'For a range $[m_{\\min},m_{\\max}]$ the step is $\\Delta=(m_{\\max}-m_{\\min})/L$.'},
{t:'box', kind:'def', hd:'Mid-rise', html:'A decision boundary sits at zero. With $L$ even, the levels are $\\pm\\Delta/2,\\pm3\\Delta/2,\\dots$ and none of them is zero.'},
{t:'fig', svg:()=>narrow(figQuantizer('midrise'),60), cap:'A mid-rise quantizer with $L=8$ and $\\Delta=1$. A boundary sits at the origin, so the output steps through $\\pm\\Delta/2$.', short:'A mid-rise quantizer.'},
{t:'p', text:'For example, a mid-rise quantizer with $\\Delta=1$ maps $m=0.2$ to $0.5$. The input lies in the region $(0,1]$, whose level is its midpoint $0.5$.'},

{t:'h3', text:'Mid-rise and mid-tread'},
{t:'p', text:'Uniform quantizers come in two families. They differ in what they do at zero.'},
{t:'table', cap:'The two families of uniform quantizer.', head:['Family','At zero','A small input'], rows:[
 ['Mid-rise','a boundary','goes to $\\pm\\Delta/2$'],
 ['Mid-tread','a level','goes to exactly $0$']
]},
{t:'fig', svg:()=>narrow(figQuantizer('midtread'),60), cap:'A mid-tread quantizer with $\\Delta=1$. A level sits at the origin, and the tread around zero is one step wide.', short:'A mid-tread quantizer.'},
{t:'box', kind:'warn', hd:'Silence', html:'A mid-rise quantizer turns a silent input with a little noise into a signal of $\\pm\\Delta/2$. A mid-tread quantizer keeps it silent.'},
{t:'p', text:'For example, a mid-tread quantizer with $\\Delta=1$ maps $m=0.2$ to $0$. The tread around zero covers $|m|<0.5$, and its level is $0$.'},

{t:'h3', text:'A sampled signal through the quantizer'},
{t:'p', text:'A converter samples first and quantizes second. Each sample passes through three steps.'},
{t:'ol', items:[
 'Sample: read $m(nT_s)$ off the signal.',
 'Find the region: the sample lies between two boundaries of the staircase.',
 'Output: the level of that region, $v[n]=\\mathbb{Q}\\bigl(m(nT_s)\\bigr)$.'
]},
{t:'fig', svg:()=>narrow(figQuantWalk(),64), cap:'Eight samples $m(nT_s)$ (cyan) enter the mid-tread quantizer with $\\Delta=1$ and leave as the levels $v[n]$ (violet). The lower panel follows the eighth sample across the staircase.', short:'A sampled signal through the quantizer.'},
{t:'box', kind:'warn', hd:'Many inputs, one level', html:'Every input between $1.5$ and $2.5$ leaves as $2$. The output keeps the region and loses the exact value.'},
{t:'p', text:'For example, the same quantizer maps the sample $m(nT_s)=1.62$ to $v[n]=2$. The sample lies between the boundaries $1.5$ and $2.5$.'},

{t:'h3', text:'The quantizer as a function'},
{t:'p', text:'A quantizer is a function of its input. Its <b>boundaries</b> $m_k$ cut the range into $L$ regions. Region $k$ is the interval $m_{k-1}<m\\le m_k$, and its level is $v_k$.'},
{t:'eqbox', cap:'Quantizer function', tex:'\\mathbb{Q}(m)=v_k\\quad\\text{for}\\quad m_{k-1}<m\\le m_k'},
{t:'p', text:'An optimal quantizer meets two conditions.'},
{t:'ol', items:[
 'Each boundary is the midpoint of its two levels: $m_k=\\tfrac12(v_k+v_{k+1})$. Every input then goes to the nearer level.',
 'Each level is the centroid of its region: $v_k=E[M\\mid M\\in\\text{region }k]$.'
]},
{t:'p', text:'A quantizer that meets both conditions is the <b>Lloyd&ndash;Max quantizer</b>.'},
{t:'fig', svg:()=>narrow(figRegions(),60), cap:'The best four-level quantizer for a Gaussian input. The steps widen in the tails, where the input is rare. Each boundary $m_k$ lies midway between two levels.', short:'The optimal four-level quantizer for a Gaussian input.'},
{t:'box', kind:'ok', hd:'Uniform input', html:'A uniform quantizer always meets the midpoint condition. For a uniform input it meets the centroid condition too, so it is optimal.'},
{t:'p', text:'For example, let two neighbouring levels be $v_1=1$ and $v_2=3$. The midpoint condition puts the boundary between them at $\\tfrac12(1+3)=2$.'},

{t:'h3', text:'Overload and granular noise'},
{t:'p', text:'A quantizer spanning $[-m_{\\max},m_{\\max}]$ makes two kinds of error. The choice of $m_{\\max}$ trades one against the other.'},
{t:'table', cap:'The two errors of a quantizer.', head:['Error','Where','Size'], rows:[
 ['<b>Overload</b>','an input beyond $\\pm m_{\\max}$, clipped to the outer level','no bound'],
 ['<b>Granular noise</b>','an input inside the range','$|q|\\le\\Delta/2$, larger for a wider range']
]},
{t:'fig', svg:()=>narrow(figOverload(),66), cap:'A signal with rare large peaks through a $3$-bit quantizer spanning $[-m_{\\max},m_{\\max}]$ with $m_{\\max}=\\sigma$. Red marks the clipped peaks. The lower curve is the SQNR of a Gaussian input against the range, and the dot sits at $m_{\\max}=\\sigma$.', short:'Overload and granular noise.'},
{t:'box', kind:'ok', hd:'The best range', html:'For a Gaussian input and $3$ bits the SQNR peaks at $m_{\\max}=2.34\\sigma$, with $14.27$ dB. A few clipped peaks cost less than a coarser step.'},
{t:'box', kind:'err', hd:'Common error', html:'Set $m_{\\max}$ from the rare peaks of the signal, not from its typical size. At $m_{\\max}=\\sigma$ the SQNR falls to $6.97$ dB.'},
{t:'p', text:'For example, set a $3$-bit quantizer to $m_{\\max}=\\sigma$ for a Gaussian input. About $32\\%$ of the samples lie outside $\\pm\\sigma$, and each of them is clipped. Overload then dominates.'},

{t:'h3', text:'Quantizers around us'},
{t:'box', kind:'def', hd:'Every reading is a level', html:'A digital display shows one of a finite set of values. A change smaller than one step leaves the reading unchanged.'},
...gallery(GAL_QUANT),
{t:'box', kind:'ok', hd:'A level at zero', html:'A display that rounds is mid-tread, so an empty scale reads exactly zero. A converter that truncates puts a boundary at each code edge.'},

/* ---------------------------------------------------------------- 1.4 */
{t:'h2', num:'1.4', text:'Quantization noise and SQNR'},

{t:'h3', text:'Quantization noise'},
{t:'p', text:'The <b>quantization error</b> is the difference between the input and its level.'},
{t:'eqbox', cap:'Quantization error', tex:'q=m-\\mathbb{Q}(m)'},
{t:'p', text:'Inside the range, $v_k$ is the midpoint of a region $\\Delta$ wide. The input cannot lie farther from the midpoint than half the region.'},
{t:'eqbox', cap:'Bound', tex:'\\begin{aligned}|q|&=|m-v_k|\\\\&\\le\\tfrac12(m_k-m_{k-1})\\\\&=\\frac{\\Delta}{2}\\end{aligned}'},
{t:'fig', svg:()=>narrow(figErrBound(),64), cap:'The error is the gap between the line $v=m$ and the staircase, shown at $m=0.7\\Delta$. It is largest at a boundary, where it equals $\\Delta/2$.', short:'The quantization error and its bound.'},
{t:'box', kind:'def', hd:'Uniform model', html:'For a small $\\Delta$ the input density is nearly flat across one region. The error is then modelled as $Q\\sim U(-\\Delta/2,\\Delta/2)$.'},
{t:'p', text:'For example, a quantizer with $\\Delta=1.25$ whose input stays inside its range has $|q|\\le\\Delta/2=0.625$.'},

{t:'h3', text:'The power of quantization noise'},
{t:'p', text:'The power of the error is its mean-square value $E[Q^{2}]$. Under the uniform model the error density is $f_Q(q)=1/\\Delta$ on $[-\\Delta/2,\\Delta/2]$. Write the expectation as an integral and evaluate the antiderivative at its limits.'},
{t:'eqbox', cap:'Mean-square error', tex:'\\begin{aligned}E[Q^{2}]&=\\int_{-\\Delta/2}^{\\Delta/2}q^{2}\\,\\frac{1}{\\Delta}\\,dq\\\\&=\\frac{1}{\\Delta}\\left[\\frac{q^{3}}{3}\\right]_{-\\Delta/2}^{\\Delta/2}\\\\&=\\frac{1}{3\\Delta}\\left(\\frac{\\Delta^{3}}{8}+\\frac{\\Delta^{3}}{8}\\right)\\\\&=\\frac{\\Delta^{2}}{12}\\end{aligned}',
 after:'The lower limit gives $(-\\Delta/2)^{3}=-\\Delta^{3}/8$, which is subtracted.'},
{t:'fig', svg:()=>narrow(figErrDensity(),60), cap:'The uniform error density, and $q^{2}f_Q(q)$ shaded. The shaded area is the noise power $E[Q^{2}]$.', short:'The uniform error density.'},
{t:'p', text:'For example, a fine uniform quantizer with $\\Delta=0.5$ has $E[Q^{2}]=\\Delta^{2}/12=0.25/12=0.0208$.'},

{t:'h3', text:'Quantization noise in bits'},
{t:'p', text:'An $R$-bit quantizer has $L=2^{R}$ levels. Substitute $\\Delta=2m_{\\max}/L$ and $L=2^{R}$ into $E[Q^{2}]=\\Delta^{2}/12$.'},
{t:'eqbox', cap:'In bits', tex:'\\begin{aligned}E[Q^{2}]&=\\frac{\\Delta^{2}}{12}\\\\&=\\frac{1}{12}\\left(\\frac{2m_{\\max}}{2^{R}}\\right)^{2}\\\\&=\\frac{1}{12}\\cdot\\frac{4m_{\\max}^{2}}{2^{2R}}\\\\&=\\frac{m_{\\max}^{2}}{3\\cdot 2^{2R}}\\end{aligned}'},
{t:'box', kind:'ok', hd:'One bit, a quarter', html:'Each extra bit halves $\\Delta$ and divides the noise power by four.'},
{t:'fig', svg:()=>narrow(figNoiseBits(),60), cap:'The SQNR of a full-scale sinusoid for $R=1,\\dots,8$. Each added bit halves $\\Delta$, divides $E[Q^{2}]$ by four, and lifts the SQNR by $10\\log_{10}4=6.02$ dB.', short:'Quantization noise in bits.'},
{t:'p', text:'For example, a fine quantizer that goes from $R=6$ to $R=7$ bits divides $E[Q^{2}]$ by $4$. The noise power is proportional to $2^{-2R}$, and $2^{2}=4$.'},

{t:'h3', text:'Signal-to-quantization-noise ratio'},
{t:'p', text:'The <b>signal-to-quantization-noise ratio</b> (SQNR) compares the power $P_M$ of the message with the power of the error. Substitute $E[Q^{2}]=m_{\\max}^{2}/(3\\cdot2^{2R})$.'},
{t:'eqbox', cap:'Uniform quantizer', tex:'\\begin{aligned}\\mathrm{SQNR}&=\\frac{P_M}{E[Q^{2}]}\\\\&=\\frac{3P_M}{m_{\\max}^{2}}\\,2^{2R}\\end{aligned}'},
{t:'p', text:'In decibels the product becomes a sum, because the log of a product is a sum of logs. The factor $2^{2R}$ gives $20R\\log_{10}2$, and $20\\log_{10}2=6.02$.'},
{t:'eqbox', cap:'Key result: six decibels a bit', tex:'\\begin{aligned}\\mathrm{SQNR}\\;[\\mathrm{dB}]&=\\underbrace{10\\log_{10}\\frac{3P_M}{m_{\\max}^{2}}}_{\\alpha}+10\\log_{10}2^{2R}\\\\&=\\alpha+20R\\log_{10}2\\\\&=\\alpha+6.02R\\end{aligned}',
 after:'Every extra bit adds $6.02$ dB.'},
{t:'fig', svg:()=>narrow(figSqnr(),60), cap:'The SQNR of a full-scale sinusoid (cyan) and of the same sinusoid $20$ dB below full scale (violet). The line keeps its slope of $6.02$ dB a bit and drops by the level.', short:'SQNR against the number of bits.'},
{t:'p', text:'For example, a quantizer that gives $40$ dB at $R=6$ gives $52.04$ dB at $R=8$. Two more bits add $2(6.02)=12.04$ dB.'},

{t:'h3', text:'SQNR of a random variable and of a signal'},
{t:'p', text:'The SQNR is a ratio of two powers. For a random variable $M$ quantized to $\\mathbb{Q}(M)$, both powers are expected values.'},
{t:'eqbox', cap:'Random variable', tex:'\\mathrm{SQNR}=\\frac{E[M^{2}]}{E\\big[(M-\\mathbb{Q}(M))^{2}\\big]}'},
{t:'p', text:'For a signal $m(t)$ quantized to $\\mathbb{Q}(m(t))$, both powers are time averages over the whole time axis.'},
{t:'eqbox', cap:'Signal', tex:'\\mathrm{SQNR}=\\frac{\\displaystyle\\lim_{T\\to\\infty}\\frac{1}{T}\\int_{-T/2}^{T/2}m^{2}(t)\\,dt}{\\displaystyle\\lim_{T\\to\\infty}\\frac{1}{T}\\int_{-T/2}^{T/2}\\big(m(t)-\\mathbb{Q}(m(t))\\big)^{2}\\,dt}'},
{t:'fig', svg:()=>narrow(figSqnrWindow(),66), cap:'A sinusoid with Gaussian noise on it, through a $3$-bit quantizer spanning $[-5,5]$, averaged over the window $T=6$ s (shaded). The ratio of the two time averages settles as $T$ grows.', short:'SQNR as a ratio of two time averages.'},
{t:'box', kind:'ok', hd:'The noisy sinusoid', html:'Here $m(t)=3\\cos t+n(t)$, with $n(t)$ Gaussian of variance $0.36$. As $T\\to\\infty$ the numerator tends to $P_M=4.5+0.36=4.86$. The uniform error model puts the denominator at $\\Delta^{2}/12$.'},

{t:'ex', hd:'Example 1.2 — SQNR of a sinusoid', rows:[
 ['Given','$m(t)=5\\cos t$, and a uniform quantizer over its full range with $R=3$.'],
 ['Find','The step size and the SQNR.'],
 ['Method','Find the signal power and the step size. The noise power is $\\Delta^{2}/12$, and the SQNR is the ratio of the two powers. A sinusoid of peak $A$ has power $A^{2}/2$.'],
 ['Solution','The range $[-5,5]$ is $10$ wide, and $R=3$ gives $L=2^{3}=8$ levels. $$\\begin{aligned}P_M&=\\tfrac12(5)^{2}=12.5\\\\\\Delta&=\\frac{2(5)}{2^{3}}=1.25\\end{aligned}$$ Divide the signal power by the noise power. $$\\begin{aligned}E[Q^{2}]&=\\frac{1.25^{2}}{12}=0.1302\\\\\\mathrm{SQNR}&=10\\log_{10}\\frac{12.5}{0.1302}=19.82\\ \\text{dB}\\end{aligned}$$'],
 ['Check','The rule gives the same value: $\\alpha=10\\log_{10}1.5=1.76$ dB and $1.76+6.02(3)=19.82$ dB. Measured on the waveform the SQNR is $19.09$ dB, since three bits is a coarse quantizer.']
]},
{t:'fig', svg:()=>narrow(figQuantError(),66), cap:'$m(t)=5\\cos t$ through a $3$-bit quantizer spanning $[-5,5]$, and the error below it. The error stays between $-\\Delta/2$ and $\\Delta/2$.', short:'Example 1.2: a sinusoid and its quantization error.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\Delta=2m_{\\max}/L$, not $m_{\\max}/L$. The full range is $2m_{\\max}=10$ V.'},

{t:'ex', hd:'Example 1.3 — SQNR of a uniform source', rows:[
 ['Given','$M\\sim U(-1,1)$, and a uniform quantizer with $L=256$.'],
 ['Find','The SQNR.'],
 ['Method','Compute the two powers. The signal power comes from the density $f_M(m)=\\tfrac12$ on $[-1,1]$. The noise power is $\\Delta^{2}/12$ with $\\Delta=2/256=1/128$.'],
 ['Solution','Integrate $m^{2}f_M(m)$ and evaluate the antiderivative at its limits. $$P_M=\\int_{-1}^{1}\\tfrac12m^{2}\\,dm=\\tfrac12\\left[\\frac{m^{3}}{3}\\right]_{-1}^{1}=\\tfrac12\\cdot\\tfrac23=\\tfrac13$$ Then the noise power and the ratio follow. $$\\begin{aligned}E[Q^{2}]&=\\frac{(1/128)^{2}}{12}=\\frac{1}{196\\,608}\\end{aligned}\\qquad\\begin{aligned}\\mathrm{SQNR}&=\\tfrac13(196\\,608)\\\\&=65\\,536=2^{16}\\\\&=48.16\\ \\text{dB}\\end{aligned}$$'],
 ['Check','Each region holds a flat piece of the input density, so the error is exactly $U(-\\Delta/2,\\Delta/2)$. The result is $6.02(8)$ dB, so $\\alpha=0$ for this source.']
]},
{t:'fig', svg:()=>narrow(figUniformSource(),60), cap:'The $256$-level quantizer on $[-1,1]$. At full scale the steps are too fine to see. The inset enlarges the six around the origin.', short:'Example 1.3: the 256-level quantizer.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\Delta=2/256$, not $1/256$. The range $[-1,1]$ is $2$ wide.'},

{t:'ex', hd:'Example 1.4 — SQNR of a Gaussian source', rows:[
 ['Given','A zero-mean stationary Gaussian source has $S_X(f)=2$ for $|f|<100$ Hz. Its samples enter a quantizer with five levels $0,\\pm10,\\pm30$ and boundaries $\\pm20,\\pm40$.'],
 ['Find','The SQNR.'],
 ['Method','The signal power is the area under the power spectral density. The quantizer is coarse and its outer regions are unbounded, so the noise power is integrated region by region.'],
 ['Solution','The signal power is the area under $S_X$, not its height. $$P_X=\\int_{-100}^{100}2\\,df=2(200)=400$$ The mean is zero, so $400$ is also the variance, and $f_X$ is Gaussian with $\\sigma=20$. The density $f_X$ is even, so each side region has a twin. The integrals are evaluated numerically. $$\\begin{aligned}P_Q&=\\int_{-20}^{20}x^{2}f_X\\,dx+2\\int_{20}^{40}(x-10)^{2}f_X\\,dx+2\\int_{40}^{\\infty}(x-30)^{2}f_X\\,dx\\\\&=79.50+2(46.36)+2(7.98)=188.17\\\\\\mathrm{SQNR}&=10\\log_{10}\\frac{400}{188.17}=3.28\\ \\text{dB}\\end{aligned}$$'],
 ['Check','The five areas of the error integrand add to $79.50+92.72+15.96=188.18$, which is $188.17$ before rounding. The ratio $400/188.17=2.126$, and $10\\log_{10}2.126=3.28$ dB.']
]},
{t:'fig', svg:()=>narrow(figGaussErr(),60), cap:'The error integrand $(x-\\mathbb{Q}(x))^{2}f_X(x)$, region by region. The five areas add to the noise power $P_Q=188.17$.', short:'Example 1.4: the error integrand region by region.'},
{t:'box', kind:'err', hd:'Common error', html:'Using $\\Delta^{2}/12=33.3$ gives $10.8$ dB, $7.5$ dB too high. That model holds only for a small $\\Delta$ and an input inside the range.'},

{t:'h3', text:'One rule, three sources'},
{t:'p', text:'Every source gains $6.02$ dB a bit. The source sets only the intercept, $\\alpha=10\\log_{10}(3P_M/m_{\\max}^{2})$. Three sources at full range give three intercepts.'},
{t:'eqbox', cap:'Three intercepts', tex:'\\begin{aligned}\\text{sinusoid: }&\\quad 10\\log_{10}\\frac{3(A^{2}/2)}{A^{2}}=1.76\\ \\text{dB}\\\\\\text{uniform: }&\\quad 10\\log_{10}\\frac{3(1/3)}{1}=0\\ \\text{dB}\\\\\\text{Gaussian, }m_{\\max}=4\\sigma\\text{: }&\\quad 10\\log_{10}\\frac{3\\sigma^{2}}{16\\sigma^{2}}=-7.27\\ \\text{dB}\\end{aligned}'},
{t:'fig', svg:()=>narrow(figSqnrSources(),60), cap:'The lines are $\\alpha+6.02R$ for the three sources. The dots are measured on each quantized source, up to $R=8$. The Gaussian dots leave their line at many bits, where the clipped peaks set the error.', short:'SQNR of three sources against the number of bits.'},
{t:'box', kind:'warn', hd:'Peaks cost range', html:'A Gaussian source has rare large peaks. A range wide enough for them leaves most levels unused on typical samples.'},
{t:'p', text:'For example, at $R=8$ the rule puts the Gaussian source at $\\pm4\\sigma$ below the sinusoid by $1.76-(-7.27)=9.03$ dB. The slopes are equal, so the gap is the gap in $\\alpha$.'},

{t:'h3', text:'Hearing quantization noise'},
{t:'p', text:'Speech quantized with $8$ bits has an error that sounds like a faint hiss. At $2$ bits the error follows the words.'},
{t:'box', kind:'warn', hd:'Noise that follows the signal', html:'At a few bits the error moves with the speech. It sounds like distortion, not like hiss, and the uniform error model no longer holds.'},
{t:'p', text:'For example, speech that sounds clean at $8$ bits loses $4(6.02)=24.08$ dB of SQNR at $4$ bits, by the rule of six decibels a bit.'},

{t:'h3', text:'Dither'},
{t:'box', kind:'def', hd:'Dither', html:'<b>Dither</b> is a small random signal, about one step wide, added before the quantizer. The error then no longer follows the signal.'},
{t:'box', kind:'ok', hd:'The average follows', html:'Each output still sits on a level. Averaged over time, or by the eye over neighbouring pixels, it follows the input between the levels.'},
{t:'fig', svg:()=>narrow(figDither(),66), cap:'A slow sinusoid $1.3$ steps high through a quantizer with a unit step. The faint traces are the staircase without dither and one output with dither. The green trace averages $64$ dithered outputs. The strips are a grey ramp at four levels, without and with dither.', short:'Dither.'},
{t:'box', kind:'warn', hd:'The cost', html:'Dither adds noise power. It trades a pattern that the ear or the eye notices for a hiss or a grain that it ignores.'},
{t:'p', text:'For example, let an input sit $0.3\\Delta$ above a level, with dither uniform on $[-\\Delta/2,\\Delta/2]$. The boundary is $0.5\\Delta$ up, so the dither must exceed $0.2\\Delta$. That happens with probability $0.3$, so the next level up is chosen $30\\%$ of the time. The average output is then $0.3\\Delta$ above the level.'},

{t:'h3', text:'SQNR around us'},
{t:'box', kind:'def', hd:'Headroom costs SQNR', html:'The formula assumes a full-scale input. Each decibel below full scale takes one decibel from the SQNR.'},
...gallery(GAL_SQNR),
{t:'box', kind:'warn', hd:'Quiet talkers at 8 bits', html:'A telephone call spans a wide range of levels. At $8$ uniform bits a quiet talker keeps little SQNR. Companding, next, fixes this.'},

/* ---------------------------------------------------------------- 1.5 */
{t:'h2', num:'1.5', text:'Non-uniform quantization'},

{t:'h3', text:'Non-uniform quantization'},
{t:'p', text:'Speech is mostly quiet and only sometimes reaches its peak. A uniform step is the same for a whisper and a shout. So the whisper is quantized coarsely in proportion to itself.'},
{t:'p', text:'Divide the bound $|q|\\le\\Delta/2$ by $|m|$ to get the <b>relative error</b>. Small amplitudes suffer the most.'},
{t:'eqbox', cap:'Relative error', tex:'\\frac{|q|}{|m|}\\le\\frac{\\Delta/2}{|m|}=\\frac{\\Delta}{2|m|}'},
{t:'box', kind:'def', hd:'Companding', html:'Compress the signal with a memoryless curve, quantize uniformly, and expand at the receiver. The name <b>companding</b> joins <b>com</b>pressing and ex<b>panding</b>.'},
{t:'fig', svg:()=>narrow(figSpeechLevels(),60), cap:'A sixteen-level $\\mu$-law quantizer. Its steps are fine near zero, where speech amplitudes crowd, and coarse near the peak.', short:'A non-uniform quantizer.'},
{t:'p', text:'For example, let a uniform quantizer have $\\Delta=0.1$ V and a quiet signal peak at $0.2$ V. The error can reach $(\\Delta/2)/0.2=0.05/0.2=25\\%$ of that peak.'},

{t:'h3', text:'The compander'},
{t:'p', text:'A <b>compander</b> builds a non-uniform quantizer from three parts: a compressor, a uniform quantizer and an expander.'},
{t:'box', kind:'def', hd:'Compressor', html:'A memoryless curve $y=c(m)$. It gives a weak signal a high gain and a strong signal a low gain, so small amplitudes are spread over more quantizer levels.'},
{t:'box', kind:'ok', hd:'Expander', html:'The receiver applies the inverse curve $c^{-1}$. It takes away the boost that the compressor gave the weak signal and returns every level to its original size.'},
{t:'p', text:'The whole chain maps $m$ to $\\hat m$. Here $Q$ is the uniform quantizer.'},
{t:'eqbox', cap:'Compander', tex:'\\hat m=c^{-1}\\big(Q(c(m))\\big)',
 after:'Near an input $m$, a step $\\Delta$ in $y$ is a step of about $\\Delta/c\'(m)$ in $m$.'},
{t:'fig', svg:()=>narrow(figCompander(),66), cap:'The quantizer in the middle is uniform. Seen from $m$ to $\\hat m$, its steps are fine near zero and coarse near the peak.', short:'The compander.'},
{t:'p', text:'For example, let the compressor have slope $c\'(0)=4$ near zero and the uniform step be $\\Delta=0.1$. A quiet signal sees the step $\\Delta/c\'(0)=0.1/4=0.025$. That step is four times finer than the uniform one.'},

{t:'h3', text:'A-law and µ-law companding'},
{t:'p', text:'Two compressor curves are standard. Both act on an input normalized to $|x|\\le1$. The first is the $\\mu$-law.'},
{t:'eqbox', cap:'$\\mu$-law', tex:'y=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}\\operatorname{sgn}(x),\\qquad |x|\\le 1'},
{t:'p', text:'The second is the A-law.'},
{t:'eqbox', cap:'A-law', tex:'y=\\begin{cases}\\dfrac{A|x|}{1+\\ln A}\\operatorname{sgn}(x), & |x|\\le\\dfrac{1}{A}\\\\[8pt] \\dfrac{1+\\ln(A|x|)}{1+\\ln A}\\operatorname{sgn}(x), & \\dfrac{1}{A}<|x|\\le 1\\end{cases}'},
{t:'fig', svg:()=>narrow(figCompanding(),60), cap:'A-law (top) and $\\mu$-law (bottom) for three parameter values. The dashed line is no companding. The larger the parameter, the more output range goes to small inputs.', short:'A-law and µ-law companding.'},
{t:'box', kind:'ok', hd:'In use', html:'$\\mu$-law with $\\mu=255$ is used in the United States, Canada and Japan. A-law with $A=87.6$ is used in Europe, T&uuml;rkiye and most other countries.'},
{t:'p', text:'For example, with $\\mu=255$ the input $x=0.01$ gives $y=\\ln(3.55)/\\ln(256)=1.267/5.545=0.23$. One per cent of the range is lifted to almost a quarter.'},

{t:'h3', text:'Hearing companding'},
{t:'p', text:'Compare a uniform quantizer and a $\\mu$-law quantizer, both with $6$ bits over the same range. The uniform one spends its levels evenly, so a quiet voice meets only a few of them.'},
{t:'box', kind:'ok', hd:'Quiet voices stay clear', html:'The $\\mu$-law steps shrink with the voice. Its SQNR hardly changes as the level falls, while the uniform SQNR falls a decibel per decibel.'},
{t:'p', text:'For example, let a talker drop $20$ dB below full scale. The uniform noise power $\\Delta^{2}/12$ stays the same and the signal power falls by $20$ dB. So the uniform SQNR falls by $20$ dB.'},

{t:'h3', text:'Companding around us'},
{t:'box', kind:'def', hd:'Telephone PCM', html:'North America and Japan use $\\mu$-law with $\\mu=255$. Most other countries use A-law with $A=87.6$. Both use $8$ bits at $8$ kHz.'},
...gallery(GAL_COMPANDING),
{t:'box', kind:'ok', hd:'Steady quality', html:'Companding gives up a little SQNR at full scale. In return the SQNR stays nearly constant over a wide range of input levels.'},

/* ---------------------------------------------------------------- 1.6 */
{t:'h2', num:'1.6', text:'PCM, DPCM and delta modulation'},

{t:'h3', text:'Encoding and the bit rate'},
{t:'p', text:'<b>Pulse code modulation</b> (PCM) writes each quantized sample as $R$ bits. The bit rate is the bits a sample times the samples a second.'},
{t:'eqbox', cap:'Key result: bit rate', tex:'R_b=R\\,f_s\\qquad\\left(\\frac{\\text{bits}}{\\text{sample}}\\right)\\left(\\frac{\\text{samples}}{\\text{s}}\\right)'},
{t:'box', kind:'def', hd:'Two codes', html:'<b>Natural binary</b> numbers the levels $0$ to $L-1$ in order. <b>Gray coding</b> orders the words so that adjacent levels differ in exactly one bit.'},
{t:'table', cap:'The eight levels of a $3$-bit quantizer in natural binary and in Gray code. The natural words $011$ and $100$ either side of the middle differ in all three bits.', short:'Natural binary and Gray code for three bits.', head:['Level','Natural','Gray'], rows:[
 ['$0$','$000$','$000$'], ['$1$','$001$','$001$'], ['$2$','$010$','$011$'], ['$3$','$011$','$010$'],
 ['$4$','$100$','$110$'], ['$5$','$101$','$111$'], ['$6$','$110$','$101$'], ['$7$','$111$','$100$']
]},
{t:'box', kind:'ok', hd:'Gray-code advantage', html:'A small decision error usually picks a neighbouring level. With a Gray code that costs one bit error, not several.'},
{t:'p', text:'For example, telephone speech uses $L=256$ levels at $f_s=8$ kHz. Then $R=\\log_2256=8$ bits, and $R_b=8(8000)=64$ kb/s.'},

{t:'h3', text:'Line codes'},
{t:'box', kind:'def', hd:'Line code', html:'A <b>line code</b> is the rule that turns the bits of a PCM stream into a waveform on the wire.'},
{t:'p', text:'Line codes differ in their levels. The levels decide whether the waveform has a DC component.'},
{t:'table', cap:'The DC component of the two families of line code.', head:['Family','Levels','DC component'], rows:[
 ['Unipolar','$0$ and $+A$','present, and an AC-coupled stage cannot pass it'],
 ['Polar','$\\pm A$','none for balanced data']
]},
{t:'fig', svg:()=>narrow(figLineCodes(),60), cap:'Four line codes of the bits $0\\,1\\,1\\,0\\,1\\,0\\,0\\,1$. Each faint line is the zero of its trace.', short:'Four line codes.'},
{t:'box', kind:'warn', hd:'Clock recovery', html:'A long run of equal NRZ bits has no transitions. Manchester coding puts a transition in every bit, at the cost of twice the bandwidth.'},
{t:'p', text:'For example, a polar NRZ stream that sends a long run of ones stays at $+A$. It has no transitions to lock onto, so the receiver cannot recover its clock from that stretch.'},

{t:'ex', hd:'Example 1.5 — PCM encoding of a sinc pulse', rows:[
 ['Given','$m(t)=8\\,|\\operatorname{sinc}(t-2)|$, with $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$. It is sampled every $T_s=0.6$ s and quantized by an eight-level uniform quantizer over $[0,8]$.'],
 ['Find','The step size, the code words for $t=0,0.6,\\dots,3.6$, and the bit rate.'],
 ['Method','Take $\\Delta$ from the range and $L$. Evaluate each sample. Read the tread it falls in, then its code word. The bit rate is $R_b=R\\,f_s$.'],
 ['Solution','The step and the levels come from the range $[0,8]$ and $L=8$. $$\\begin{aligned}\\Delta&=\\frac{8-0}{8}=1\\ \\text{V}\\\\v_k&=\\bigl(k+\\tfrac12\\bigr)\\Delta,\\quad k=0,\\dots,7\\\\&=0.5,\\,1.5,\\,\\dots,\\,7.5\\ \\text{V}\\end{aligned}$$ Evaluate the samples. For instance, $m(0.6)=8\\,|\\sin(1.4\\pi)|/(1.4\\pi)=8(0.951)/4.398=1.73$. $$\\begin{array}{c|ccccccc}t&0&0.6&1.2&1.8&2.4&3.0&3.6\\\\t-2&-2&-1.4&-0.8&-0.2&0.4&1&1.6\\\\\\hline m(t)&0&1.73&1.87&7.48&6.05&0&1.51\\end{array}$$ Each sample takes the level of its tread. The index is $k=v/\\Delta-\\tfrac12$, written in three bits. $$\\begin{array}{c|ccccccc}v&0.5&1.5&1.5&7.5&6.5&0.5&1.5\\\\k&0&1&1&7&6&0&1\\\\\\hline\\text{code}&000&001&001&111&110&000&001\\end{array}$$ Three bits a sample give the bit rate and the bit duration. $$\\begin{aligned}f_s&=\\frac{1}{T_s}=\\frac{1}{0.6}=1.667\\ \\text{samples/s}\\\\R_b&=R\\,f_s=\\frac{3}{0.6}=5\\ \\text{b/s}\\\\T_b&=\\frac{1}{R_b}=0.2\\ \\text{s}\\end{aligned}$$'],
 ['Check','At $t=3$ the sample is $8|\\operatorname{sinc}(1)|=0$ exactly, because $\\operatorname{sinc}$ vanishes at every non-zero integer.']
]},
{t:'figrow', n:2, items:[
 {svg:()=>figPcmExample(), cap:'The message (cyan), its samples every $0.6$ s, and the selected levels (violet). Each error is under half a step.'},
 {svg:()=>figPcmStream(), cap:'The seven code words as one polar NRZ stream. The amber box marks one bit, $T_b=0.2$ s. The violet box marks one code word, $T_s=3T_b$.'}
]},

{t:'h3', text:'The bandwidth of PCM'},
{t:'p', text:'A binary stream of $R_b$ bits a second needs a bandwidth of at least $R_b/2$ hertz. Chapter 2 shows why. At the Nyquist rate $f_s=2W$ this becomes $RW$.'},
{t:'eqbox', cap:'Key result: bandwidth of PCM', tex:'\\begin{aligned}B_T&\\ge\\frac{R_b}{2}=\\frac{R\\,f_s}{2}\\\\B_T&\\ge RW\\quad\\text{at } f_s=2W\\end{aligned}'},
{t:'box', kind:'ok', hd:'Bits for bandwidth', html:'Each extra bit adds $6.02$ dB of SQNR and $W$ hertz of bandwidth. PCM buys quality with bandwidth.'},
{t:'fig', svg:()=>narrow(figPcmBw(),66), cap:'Top: the message band $W$ (cyan) and the least band of $8$-bit PCM sampled at $2W$ (violet). Bottom: the SQNR of a full-scale sinusoid against that bandwidth.', short:'The bandwidth of PCM.'},
{t:'p', text:'For example, telephone PCM with $f_s=8$ kHz and $R=8$ bits has $R_b=8(8000)=64$ kb/s. Its least bandwidth is $B_T\\ge R_b/2=32$ kHz, eight times the $4$ kHz of the voice.'},

{t:'h3', text:'Bit errors in PCM'},
{t:'p', text:'A channel error flips one bit of a code word. With natural binary coding the damage depends on the position of the bit. Bit $b$ counts from $0$ at the right and carries the weight $2^{b}$.'},
{t:'eqbox', cap:'Size of the error', tex:'\\hat m-m_q=\\pm2^{b}\\Delta',
 after:'Here $m_q$ is the level sent and $\\hat m$ the level decoded. The first bit, $b=R-1$, moves the sample by $2^{R-1}\\Delta=m_{\\max}$, half the range.'},
{t:'fig', svg:()=>narrow(figBitError(),60), cap:'A $4$-bit PCM stream with $\\Delta=0.125$. Bit $b=3$ of the code word $1110$ is received wrong, and the sample moves by $2^{3}\\Delta$.', short:'A bit error in PCM.'},
{t:'box', kind:'warn', hd:'Clicks', html:'A wrong first bit throws a sample across half the range. The ear hears a click, far louder than the quantization noise.'},
{t:'p', text:'For example, an $8$-bit quantizer with $\\Delta=1/128$ V moves a sample by $2^{7}\\Delta=128/128=1$ V when the first bit is wrong. That is $m_{\\max}$.'},

{t:'h3', text:'Differential PCM'},
{t:'box', kind:'def', hd:'Predict, then send the difference', html:'Neighbouring samples are close. <b>Differential PCM</b> (DPCM) quantizes the difference between a sample and its prediction, which has a much smaller range.'},
{t:'p', text:'The prediction is the last decoded value $\\hat x[n-1]$. The encoder forms the difference, and the decoder adds the quantized difference to its last value.'},
{t:'eqbox', cap:'Encoder and decoder', tex:'\\begin{aligned}e[n]&=x[n]-\\hat x[n-1]\\\\\\hat x[n]&=\\hat x[n-1]+\\mathbb{Q}\\bigl(e[n]\\bigr)\\end{aligned}',
 after:'The encoder predicts from $\\hat x[n-1]$, the value the decoder also has. So $x[n]-\\hat x[n]=e[n]-\\mathbb{Q}(e[n])$, and errors do not pile up.'},
{t:'fig', svg:()=>narrow(figDpcm(),66), cap:'Each sample is predicted by the last decoded value (violet dots). The difference, on the same scale below, is far smaller than the sample.', short:'Differential PCM.'},
{t:'box', kind:'ok', hd:'Fewer bits', html:'For speech at $8$ kHz, DPCM with $4$ bits a sample matches PCM with $8$. That is $32$ kb/s in place of $64$ kb/s.'},
{t:'p', text:'For example, DPCM with $4$ bits a sample at $f_s=8$ kHz has $R_b=R\\,f_s=4(8000)=32$ kb/s.'},

{t:'h3', text:'Delta modulation'},
{t:'box', kind:'def', hd:'One bit a sample', html:'<b>Delta modulation</b> is DPCM with a two-level quantizer. Each bit moves the staircase up or down by $\\Delta$.'},
{t:'p', text:'The step size trades two errors against each other.'},
{t:'table', cap:'The two errors of delta modulation.', head:['Error','Cause'], rows:[
 ['<b>Slope overload</b>','The signal rises faster than $\\Delta$ a sample. The staircase falls behind.'],
 ['<b>Granular noise</b>','The signal is flat. The staircase hunts by $\\pm\\Delta$ around it.']
]},
{t:'p', text:'The staircase climbs at most $\\Delta$ every $T_s$. It follows the signal only while the slope stays below that climb.'},
{t:'eqbox', cap:'No overload', tex:'\\left|\\frac{dx}{dt}\\right|\\le\\frac{\\Delta}{T_s}=\\Delta f_s'},
{t:'fig', svg:()=>narrow(figDm(),60), cap:'A signal with one steep rise, and the staircase with $\\Delta=0.06$ that follows it one step a sample. Red shades slope overload. The ticks under the plot are the bits.', short:'Delta modulation.'},
{t:'p', text:'For example, $x(t)=\\sin(2\\pi\\,1000\\,t)$ has largest slope $2\\pi(1000)$, and the rate is $f_s=64$ kHz. No overload needs $\\Delta\\ge2\\pi(1000)/64\\,000=0.098$.'},

{t:'h3', text:'PCM around us'},
{t:'box', kind:'def', hd:'Rate from three numbers', html:'The bit rate is the bits a sample, times the sampling rate, times the number of channels.'},
...gallery(GAL_PCM),
{t:'box', kind:'ok', hd:'One bit at a boundary', html:'A reading taken exactly on a sector edge can see either neighbour. With a Gray code it is off by at most one sector.'},

/* ---------------------------------------------------------------- 1.7 */
{t:'h2', num:'1.7', text:'Vector quantization'},

{t:'h3', text:'Vector quantization'},
{t:'box', kind:'def', hd:'Vector quantization', html:'<b>Vector quantization</b> treats $n$ samples as one point in $n$ dimensions and sends the nearest point of a <b>codebook</b>. Scalar quantization is the case $n=1$.'},
{t:'p', text:'Take pairs of samples from a $16$-level quantizer. Quantized one at a time, every pair of levels must be nameable.'},
{t:'eqbox', cap:'Every pair', tex:'\\begin{aligned}L^{2}&=16^{2}=256\\ \\text{pairs}\\\\\\log_2 256&=8\\ \\text{bits a pair}\\end{aligned}'},
{t:'p', text:'Now let neighbouring samples differ by at most one step. Only pairs of levels with $|i-j|\\le1$ occur. The diagonal holds $L$ such pairs and each side line $L-1$.'},
{t:'eqbox', cap:'Pairs that occur', tex:'\\begin{aligned}L+2(L-1)&=3L-2\\\\&=3(16)-2=46\\ \\text{pairs}\\\\\\lceil\\log_2 46\\rceil&=\\lceil 5.52\\rceil=6\\ \\text{bits a pair}\\end{aligned}',
 after:'Six bits a pair is three bits a sample, not four.'},
{t:'fig', svg:()=>narrow(figPairLattice(16),60), cap:'All $256$ pairs of a $16$-level quantizer. If neighbours differ by at most one step, only the $46$ shaded pairs occur.', short:'The pairs a vector quantizer must name.'},
{t:'p', text:'For example, an $8$-level quantizer whose neighbours differ by at most one step has $3L-2=3(8)-2=22$ pairs that can occur.'},

{t:'h3', text:'Image quantization'},
{t:'p', text:'A greyscale image is quantized pixel by pixel. The size of the file is the pixel count times the bits a pixel. One KiB is $8(1024)$ bits, and $32$ levels need $\\log_2 32=5$ bits.'},
{t:'eqbox', cap:'Bits in a $512\\times512$ image', tex:'\\begin{aligned}512^{2}(8)&=2\\,097\\,152\\ \\text{bits}\\\\&=256\\ \\text{KiB}\\end{aligned}\\qquad\\begin{aligned}512^{2}(5)&=1\\,310\\,720\\ \\text{bits}\\\\&=160\\ \\text{KiB}\\end{aligned}',
 after:'The file shrinks by $(256-160)/256=37.5\\%$.'},
{t:'p', text:'Three bits fewer cost three times six decibels of SQNR.'},
{t:'eqbox', cap:'What it costs', tex:'6.02(8-5)=6.02(3)=18.06\\ \\text{dB}'},
{t:'fig', svg:()=>narrow(figImageRamp(),66), cap:'A grey ramp from $0$ to $1$ through a uniform quantizer with $L=8$ levels. Below it is the size of a $512\\times512$ image at $3$ bits a pixel.', short:'Image quantization.'},
{t:'box', kind:'warn', hd:'Banding', html:'Coarse levels turn a smooth gradient into flat steps. The eye reads the step edges as contours that the scene never had.'},
{t:'p', text:'For example, a $256\\times256$ image with $L=64$ levels needs $R=\\log_2 64=6$ bits a pixel. Its size is $256^{2}(6)/8=49\\,152$ bytes, or $48$ KiB.'},

/* ---------------------------------------------------------------- 1.8 */
{t:'h2', num:'1.8', text:'Speech, audio and image coding'},

{t:'h3', text:'Linear predictive coding'},
{t:'box', kind:'def', hd:'A model, not a waveform', html:'<b>Linear predictive coding</b> (LPC) measures a model of the voice every $20$ ms and sends its settings. The receiver runs the model to make the speech again.'},
{t:'p', text:'The model is an all-pole filter driven by an excitation $w_n$. Each output sample is a weighted sum of the last $p$ outputs plus the scaled excitation.'},
{t:'eqbox', cap:'All-pole model', tex:'x_n=\\sum_{i=1}^{p}a_i\\,x_{n-i}+G\\,w_n',
 after:'$w_n$ is a pulse train for a voiced sound and white noise for an unvoiced one. The $a_i$ describe the shape of the vocal tract.'},
{t:'fig', svg:()=>narrow(figLpc(),66), cap:'A pulse train at $f_0=125$ Hz (faint) drives an all-pole filter with three peaks, the formants $F_1,F_2,F_3$. The output is a vowel (green). Noise through the same filter is a whisper.', short:'Linear predictive coding.'},
{t:'box', kind:'ok', hd:'Bit rate', html:'Each frame sends the $a_i$, the gain $G$, the pitch and one voiced bit. That brings speech down to about $2.4$ kb/s, against $64$ kb/s for PCM.'},
{t:'p', text:'For example, a coder that sends $48$ bits for each $20$ ms frame sends $50$ frames a second. Its bit rate is $48(50)=2400$ b/s.'},

{t:'h3', text:'Time-division multiplexing and T1'},
{t:'box', kind:'def', hd:'Time-division multiplexing', html:'Many PCM calls share one line by taking turns. Each call gets one slot in every frame, and a frame lasts one sampling interval.'},
{t:'p', text:'The T1 line carries $24$ calls of $8$ bits each, plus one framing bit. The extra bit marks the start of each frame, so the receiver knows which slot is which. A frame is sent every $125\\ \\mu$s, that is $8000$ times a second.'},
{t:'eqbox', cap:'T1 line rate', tex:'\\begin{aligned}24(8)+1&=193\\ \\text{bits a frame}\\\\193(8000)&=1.544\\ \\text{Mb/s}\\end{aligned}'},
{t:'fig', svg:()=>narrow(figT1(),66), cap:'Every call is sampled every $125\\ \\mu$s. Its $8$-bit word takes one slot of the frame, after a framing bit F.', short:'Time-division multiplexing and the T1 frame.'},
{t:'box', kind:'ok', hd:'A hierarchy', html:'Four T1 lines make a $6.312$ Mb/s line, and seven of those a $44.736$ Mb/s line. Europe and T&uuml;rkiye use E1: $32$ slots, $2.048$ Mb/s.'},
{t:'p', text:'For example, leave out the framing bit. The $24$ calls alone need $24(64)=1536$ kb/s. The framing bit adds $8$ kb/s to make $1.544$ Mb/s.'},

{t:'h3', text:'Oversampling and sigma-delta conversion'},
{t:'box', kind:'def', hd:'Oversample, then use one bit', html:'At a rate far above $2W$, neighbouring samples are nearly equal. One bit a sample can then carry the change.'},
{t:'p', text:'A <b>sigma-delta</b> converter integrates the error between the input and its one-bit output. The output bit is the sign of the integrator.'},
{t:'eqbox', cap:'Sigma-delta loop', tex:'\\begin{aligned}v[n]&=v[n-1]+x[n]-y[n-1]\\\\y[n]&=\\operatorname{sgn}\\bigl(v[n]\\bigr)\\end{aligned}',
 after:'The integrator $v$ adds up the error, so the running average of the bits $y$ stays on the input.'},
{t:'fig', svg:()=>narrow(figSigmaDelta(),60), cap:'One period of a sinusoid (dashed) oversampled $U=16$ times. The one-bit output (violet) swings between $\\pm1$, and a lowpass filter averages it back to the signal (green).', short:'Sigma-delta conversion.'},
{t:'box', kind:'ok', hd:'The decoder is a filter', html:'A lowpass filter turns the bits back into the signal. The fast swings of the bits lie far above $20$ kHz and are removed.'},
{t:'p', text:'For example, a CD player that oversamples $44.1$ kHz audio by $U=256$ runs its one-bit converter at $256(44.1\\text{ kHz})=11.2896$ MHz.'},

{t:'h3', text:'Transform coding and JPEG'},
{t:'box', kind:'def', hd:'Transform coding', html:'JPEG cuts the picture into $8\\times8$ blocks and takes the discrete cosine transform of each. Most of the energy of a block lands in a few low-frequency coefficients.'},
{t:'box', kind:'def', hd:'Quantize the coefficients', html:'Each coefficient has its own uniform step, larger at high frequencies. Most high-frequency coefficients round to zero and cost almost nothing to send.'},
{t:'fig', svg:()=>narrow(figJpeg(),78), cap:'A drawn picture of $128\\times128$ pixels and its JPEG version at quality $25$. At lower quality more coefficients become zero, and the $8\\times8$ blocks begin to show.', short:'Transform coding and JPEG.'},
{t:'box', kind:'warn', hd:'Blocking', html:'At a coarse step each block keeps little more than its average. The picture breaks into visible $8\\times8$ squares.'},
{t:'p', text:'For example, a $512\\times512$ picture coded at $0.5$ bit a pixel takes $512^{2}(0.5)/8=16\\,384$ bytes, or $16$ KiB. That is sixteen times less than at $8$ bits a pixel.'},

/* ---------------------------------------------------------------- 1.9 */
{t:'h2', num:'1.9', text:'Summary'},

{t:'h3', text:'From sound to bits'},
{t:'p', text:'One signal passes through the whole chain in four stages.'},
{t:'ol', items:[
 'Filter the signal to the band $W$.',
 'Sample at $f_s\\ge 2W$.',
 'Quantize to $L=2^{R}$ levels.',
 'Write $R$ bits a sample.'
]},
{t:'fig', svg:()=>narrow(figChain(),66), cap:'One message through the four stages. The filter has removed a fast ripple, and the sampler has kept one value every $T_s$. The quantizer has moved each value to one of eight levels, and the encoder has written three bits for it.', short:'From sound to bits.'},
{t:'box', kind:'ok', hd:'Quantization error', html:'Filtering and sampling at $f_s\\ge2W$ keep everything inside the band. Only the quantizer adds an error that no receiver can remove.'},
{t:'p', text:'For example, a recording sampled at $16$ kHz with $12$ bits a sample has $R_b=R\\,f_s=12(16\\,000)=192$ kb/s.'},

{t:'h3', text:'Quick check'},
{t:'p', text:'Each question needs no calculation on paper. The answer and its reason follow the question.'},
{t:'q', n:'1', text:'Aliasing. A $7$ kHz tone sampled at $10$ kHz appears at what frequency?', ans:'$3$ kHz. Since $7>f_s/2=5$, it folds to $|7-10|=3$ kHz.'},
{t:'q', n:'2', text:'Nyquist rate. What is the Nyquist rate of audio bandlimited to $20$ kHz?', ans:'$2W=40$ kHz. CD audio samples a little above it.'},
{t:'q', n:'3', text:'The sinc convention. What is $\\operatorname{sinc}(2)$?', ans:'$0$. Since $\\sin(2\\pi)/(2\\pi)=0$, sinc vanishes at every non-zero integer.'},
{t:'q', n:'4', text:'Bits and SQNR. By about how much do two more bits a sample raise the SQNR?', ans:'$12$ dB. At $6.02$ dB a bit, two bits give $12.04$ dB.'},
{t:'q', n:'5', text:'Step size. Doubling $\\Delta$ multiplies $E[Q^{2}]$ by what factor?', ans:'$4$. $E[Q^{2}]=\\Delta^{2}/12$ grows with the square of the step.'},
{t:'q', n:'6', text:'Companding. Does $\\mu$-law companding give finer steps to small or to large amplitudes?', ans:'Small amplitudes. The compressor is steep near zero, so small inputs spread over many levels.'},
{t:'q', n:'7', text:'Gray code. In how many bits do two adjacent Gray code words differ?', ans:'One bit. That is the rule that defines the code.'},
{t:'q', n:'8', text:'Levels. How many levels does a $16$-bit quantizer have?', ans:'$L=2^{16}=65\\,536$.'},

{t:'h3', text:'Summary of results'},
{t:'table', cap:'Summary of Chapter 1: from an analog signal to bits.', head:['Question','Result','Anchor'], rows:[
 ['What does sampling do to the spectrum?','$G_\\delta(f)=f_s\\sum_n G(f-nf_s)$: a copy at every multiple of $f_s$, scaled by $f_s$.','PS CH7.1.1'],
 ['What is the lowest safe sampling rate?','The Nyquist rate $2W$. Below it the copies overlap and alias.','PS CH7.1.1'],
 ['What filter turns the samples back into the signal?','An ideal lowpass filter with gain $T_s$. At $f_s=2W$ its impulse response is $\\operatorname{sinc}(2Wt)$.','PS CH7.1.1'],
 ['How is $g(t)$ written in terms of its samples?','$g(t)=\\sum_n g(nT_s)\\operatorname{sinc}\\bigl(2W(t-nT_s)\\bigr)$, exact at every $t$.','PS CH7.1.1'],
 ['Mid-rise or mid-tread: which has a level at zero?','Mid-tread. Mid-rise has a boundary at zero and outputs $\\pm\\Delta/2$ there.','PS CH7.2.1'],
 ['What is the power of the quantization noise?','$E[Q^{2}]=\\Delta^{2}/12$, with $\\Delta=2m_{\\max}/L$, for a fine quantizer.','PS CH7.2.1'],
 ['What does one more bit buy?','$6.02$ dB: $\\mathrm{SQNR}=\\alpha+6.02R$, and $\\alpha=1.76$ dB for a full-scale sinusoid.','PS CH7.2.1'],
 ['Why compand?','Small amplitudes are common. Finer steps near zero keep the SQNR steady as the level falls.','PS CH7.2.1'],
 ['What bit rate does PCM need?','$R_b=R\\,f_s$. Telephone speech: $8(8000)=64$ kb/s.','PS CH7.3'],
 ['Why use a Gray code?','Adjacent levels differ in one bit, so a small decision error costs one bit error.','PS CH7.3'],
 ['What bandwidth does PCM need?','$B_T\\ge R_b/2$, which is $RW$ at $f_s=2W$. Each extra bit adds $6.02$ dB and $W$ hertz.','PS CH7.4.1'],
 ['What do DPCM and delta modulation send?','The difference from a prediction. Delta modulation sends one bit a sample and needs $\\Delta f_s$ above the largest slope.','PS CH7.4.2&ndash;7.4.3']
]},
{t:'box', kind:'ok', hd:'Method', html:'Check a rate against $2W$ before sampling. Take $\\Delta$ from the full range $2m_{\\max}$. Compute the SQNR from the two powers and compare it with $\\alpha+6.02R$. Chapter 2 sends the resulting bits over a channel.'},

{t:'h3', text:'Projects to try'},
{t:'p', text:'Four optional projects use the chapter on real and computed signals. Each gives an aim, what it practises, a few steps and what to look for.'},
{t:'box', kind:'def', hd:'Hear aliasing in a recording', html:'Lower the sampling rate of a recording and hear what aliasing does to it.<br><b>Practises:</b> The Nyquist rate $2W$ of a real signal. Aliasing: a tone above $f_s/2$ returns at a lower frequency. Why a lowpass filter comes before the sampler.<ol><li>Record a few seconds of music or speech at $f_s=44.1$ kHz.</li><li>Keep every 4th sample and play the result at $f_s/4$. Then keep every 8th sample.</li><li>Repeat, but first remove everything above the new $f_s/2$ with a lowpass filter.</li><li>Do the same with a tone that sweeps from 0 to 10 kHz, and plot the spectrum of each version.</li></ol><b>Look for:</b> Without the filter, high notes come back as new low notes that were never played. With the filter, the sound is only duller. The swept tone climbs, turns and falls, again and again.'},
{t:'box', kind:'def', hd:'Rebuild a tone from its samples', html:'Rebuild a signal from its samples in two ways and measure how close each one gets.<br><b>Practises:</b> The interpolation formula $g(t)=\\sum_n g(nT_s)\\operatorname{sinc}\\bigl(2W(t-nT_s)\\bigr)$, with $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$. The zero-order hold, which keeps each sample until the next one. The error of a finite sum of sinc terms.<ol><li>Sample $g(t)=\\cos(2\\pi\\,3t)$ at $f_s=8$ Hz on $0\\le t\\le 4$ s.</li><li>Rebuild $g(t)$ on a fine grid with the sinc sum. Rebuild it again with a zero-order hold.</li><li>Plot both against the true $g(t)$, and plot the error of each.</li><li>Repeat with $f_s=6.5$ Hz and with $f_s=5$ Hz.</li></ol><b>Look for:</b> The sinc sum is close in the middle and worse near the two ends, where terms are missing. The hold lags by half a sample. At $f_s=5$ Hz both rebuild a different tone.'},
{t:'box', kind:'def', hd:'Take bits away from a song', html:'Quantize a recording with fewer and fewer bits and compare the measured SQNR with the rule.<br><b>Practises:</b> A uniform quantizer with $L=2^R$ levels and $\\Delta=2m_{\\max}/L$. The SQNR measured from the signal power and the error power. When the model of the error as uniform noise fails.<ol><li>Scale a recording so that $|x|\\le m_{\\max}$. Quantize it with $R=12,8,6,4,2$ bits.</li><li>For each $R$, compute the error $q=x_q-x$ and the SQNR $=10\\log_{10}\\bigl(\\overline{x^{2}}/\\overline{q^{2}}\\bigr)$.</li><li>Plot SQNR against $R$ and draw the line $\\alpha+6.02R$ over it.</li><li>Listen to $x_q$ and to $q$ alone for each $R$.</li></ol><b>Look for:</b> The points follow a straight line for large $R$ and leave it for small $R$. There the error sounds like the music, not like a hiss. $\\alpha$ is lower than for a full-scale sinusoid.'},
{t:'box', kind:'def', hd:'Keep a quiet voice clear', html:'Compare a uniform quantizer with a $\\mu$-law quantizer as the input level falls.<br><b>Practises:</b> The $\\mu$-law compressor and its inverse, the expander. SQNR against input level for both quantizers. Why speech and telephony use companding.<ol><li>Record a sentence and scale its peak to $m_{\\max}$. Make copies scaled down by 10, 20, 30 and 40 dB.</li><li>Quantize each copy with 8 bits: once uniformly, once through the compressor with $\\mu=255$, then the expander.</li><li>Compute the SQNR of every version and plot it against the input level.</li><li>Listen to the quietest copy in both versions.</li></ol><b>Look for:</b> The uniform curve falls by about the same number of dB as the input. The $\\mu$-law curve stays nearly flat, so the quiet copy keeps most of its SQNR.'}

];
})();
