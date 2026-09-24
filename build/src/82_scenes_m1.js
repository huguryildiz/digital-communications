/* ==========================================================================
   Module 1 — Sampling, quantization and pulse code modulation.

   The chain that turns a continuous waveform into a bit stream, in the order
   the three operations are applied: sample, quantize, encode. Sampling is the
   only one of the three that is reversible, and the module is arranged so that
   the reader meets that fact rather than being told it.

   Every teaching scene is a slide in the reference design (DESIGN.md): one
   figure on the left, two to four cards on the right, a prediction card on
   each slide, and each section closing on a gallery, a laboratory and a code
   page.

   Colour, as everywhere in this course: cyan is the message, violet an
   intermediate quantity — a sampled or quantized value — amber a filter, green
   the recovered signal, red an error. Noise takes no colour of its own.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* The canvas of a slide figure, and of a gallery figure. A figure that grows
   into its column is one Axes, because the grown height is handed to the first
   Axes the figure draws. */
const SZ  = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const EXO = o => Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3}, o);
/* a number as the slides print it: 0.5, 1.25, -2 */
const num = v => String(Math.round(v*100)/100);
const sinc = x => Math.abs(x)<1e-9 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
/* tick names in units of W: -2W, -W, 0, W, 2W */
const wfmt = v => Math.abs(v)<1e-9 ? '0' : (v===1?'':v===-1?'-':P.fmt(v,2))+'W';

/* ---- the shared shapes of this module -----------------------------------
   One triangular spectrum stands for "a signal bandlimited to W" throughout,
   so the reader recognises the same object in the sampled spectrum, in the
   three cases and in the reconstruction figure. */
const tri = (f,W,h) => Math.abs(f) < W ? h*(1-Math.abs(f)/W) : 0;

/* One copy of that spectrum in a sampled-spectrum figure, drawn from its own
   three corners instead of from tri() sampled across the whole axis. tri() is
   zero outside its band and curve() draws that zero, so every copy laid a
   coloured line along the axis and the axis of G_delta(f) came out in the
   colour of the signal. Drawn from its corners a copy stops where its band
   stops. Corners outside the view are clipped, so a partial copy at the edge
   still enters from the edge. */
const copy = (a, c, W, peak, opts) => a.poly([[c-W,0],[c,peak],[c+W,0]], opts);

/* The message used in every time-domain figure of the sampling sections. It is
   drawn from its own definition rather than from a table of points, so the
   samples in one figure and the curve in the next cannot drift apart. */
const g = t => 0.85*Math.sin(1.15*t) + 0.35*Math.sin(2.7*t + 0.8);

/* Sampling is a product of two signals, built up on one time axis one signal
   per frame: the message, then the train that multiplies it, then the
   product. Between frames 1 and 2 each impulse of the train slides from
   height one to g(nT_s) and the train fades behind it, so the reader sees the
   product form at every sample instant. Frame 3 fades the message and the
   train out and leaves the sampled signal alone. */
function figSamplingStack(v){
  const k = v ? v.frame : 3, Ts = 1.0, N = 10;
  const a = P.Axes(SZ({xr:[-0.4,10.4], yr:[-1.45,1.9], xlabel:'t',
    pad:{l:50,r:26,t:24,b:42}, xtarget:6, ytarget:4}));
  const x = Math.max(0, Math.min(1, k-2));
  if(x < 1) a.curve(g, {color:C.in, opacity:1-x});
  if(k > 1e-9){
    const u = Math.min(1, k), w = Math.max(0, Math.min(1, k-1));
    if(x < 1) for(let n=0;n<=N;n++) a.impulse(n*Ts, u, {color:C.h, label:false, opacity:(1-0.6*w)*(1-x)});
    if(u > 0.5 && x < 0.5) a.span(4*Ts, 5*Ts, 1.28, 'T_s', {tex:true, fs:13, color:C.h});
    if(w > 1e-9)
      for(let n=0;n<=N;n++) a.impulse(n*Ts, 1 + (g(n*Ts)-1)*w, {color:C.mid, label:false});
  }
  return a.svg();
}

/* The message spectrum and the same spectrum after sampling, on one frequency
   axis. The sampled spectrum is one signal, so every copy in it takes one
   colour; its axis is marked at f_s, because f_s sets where the copies land. */
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

/* The replicas added one frequency shift at a time. Frame 0 is the message
   spectrum; going to frame 1 scales it by f_s; from there the copies at
   +-m f_s rise while the frame runs from m to m+1. Copies beyond +-2f_s lie
   outside the view. */
function figSpectrumBuild(v){
  const k = v ? v.frame : 3, W = 1, fs = 2.4;
  const a = P.Axes(SZ({xr:[-6,6], yr:[-0.12*fs,1.32*fs], xlabel:'f', ylabel:'G_\\delta(f)',
    xticksOverride:[-2*fs,-fs,fs,2*fs], ytickfmt:()=>'',
    xtickfmt:x=>{ const n=Math.round(x/fs); return (n===1?'':n===-1?'-':n)+'f\u209b'; }}));
  copy(a, 0, W, 1, {color:C.in, width:1.6, dash:'5 5'});
  a.note(0.35, 1.02, 'G(f)', {tex:true, fs:14, color:C.in});
  if(k>1e-9){
    const h0 = k<1 ? 1+(fs-1)*k : fs;
    copy(a, 0, W, h0, {color:C.mid, width:2.4});
    for(let m=1;m<=2;m++){
      const f = Math.max(0, Math.min(1, k-m));
      if(f>0) for(const s of [-1,1]) copy(a, s*m*fs, W, fs*f, {color:C.mid, width:2.4});
    }
    if(k>=1-1e-9) a.note(0, 1.12*fs, 'f_s\\,G(f)', {tex:true, fs:14, color:C.mid, anchor:'middle'});
  }
  return a.svg();
}

/* The sampled spectrum at any rate f_s = r W: a guard band above 2W, copies
   that touch at 2W, and red overlaps below it. Every adjacent pair of copies
   overlaps once f_s < 2W, so every overlap is filled, not only the central
   one. The fill is drawn between the two triangles that meet, never across a
   whole copy, so no red line runs along the axis. */
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

/* The reconstruction filter on the sampled spectrum at f_s = 2.6W. The ideal
   filter passes |f| <= W with gain T_s; the dashed one is a filter that can be
   built, flat to W and falling to zero where the first copy starts. The gap it
   falls through is the transition band that oversampling pays for. */
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

/* The impulse response of the reconstruction filter: one at the origin, zero
   at every non-zero multiple of 1/(2W). The filter keeps its amber in time as
   in frequency, and the zeros are marked because the interpolation scene
   rests on them. */
function figSinc(){
  const a = P.Axes(SZ({xr:[-3.6,3.6], yr:[-0.42,1.30], xlabel:'t', ylabel:'h(t)',
    xticksOverride:[-3,-2,-1,1,2,3], xtickfmt:()=>'', ytarget:3, ytickfmt:()=>''}));
  a.curve(t=>sinc(t), {color:C.h, width:2.4});
  for(let n=-3;n<=3;n++) if(n) a.point(n, 0, {color:C.h, r:3.6});
  a.span(2, 3, -0.30, '\\tfrac{1}{2W}', {tex:true, fs:13, color:C.h});
  a.note(0.14, 1.14, '\\operatorname{sinc}(2Wt)', {tex:true, fs:14, color:C.h});
  return a.svg();
}

/* Interactive: each term is wrapped in a group carrying its sample index, so
   the style sheet can lift one sinc out of the crowd — the idle roll call and
   the pointer handling at the foot of this file drive the `on`/`pick`
   classes. While a term is lifted, its zeros at the other sampling instants
   are drawn, because those zeros are why the sum passes through every sample.
   The figure itself stays a plain string of SVG, rebuilt on every render. */
function figInterp(v){
  const Ts = 1;
  /* frame 0 is the resting figure; frame k >= 1 lifts term n = k-1 by hand */
  const man = v && v.frame != null ? Math.round(v.frame) - 1 : -1;                     /* T_s = 1 s and 2W = 1, so the picture reads directly */
  const a = P.Axes(SZ({xr:[-0.4,8.4], yr:[-1.5,1.95], xlabel:'t',
    pad:{l:50,r:26,t:24,b:42}, xtarget:6, ytarget:4}));
  for(let n=0;n<=8;n++){
    a.raw(`<g class="st${n===man?' on':''}" data-st="${n}">`);
    a.curve(t=>g(n*Ts)*sinc((t-n*Ts)/Ts), {color:C.mid, width:1.1, opacity:0.55, dash:'3 3'});
    for(let k=0;k<=8;k++) if(k!==n)
      a.raw(`<circle class="st-z" cx="${a.sx(k*Ts).toFixed(2)}" cy="${a.sy(0).toFixed(2)}"
        r="3" fill="none" stroke="${C.mid}" stroke-width="1.5"/>`);
    a.raw('</g>');
  }
  a.curve(t=>{ let s=0; for(let n=-6;n<=14;n++) s += g(n*Ts)*sinc((t-n*Ts)/Ts); return s; },
          {color:C.out, width:2.6});
  for(let n=0;n<=8;n++){
    a.raw(`<g class="st-dot${n===man?' on':''}" data-st="${n}">`);
    a.point(n*Ts, g(n*Ts), {color:C.in, r:3.8});
    /* an invisible disc widens the pointer target to a finger's width */
    a.raw(`<circle cx="${a.sx(n*Ts).toFixed(2)}" cy="${a.sy(g(n*Ts)).toFixed(2)}"
      r="20" fill="transparent"/>`);
    a.raw('</g>');
  }
  /* One expression per term, at the spot the resting caption occupies; the
     style sheet shows only the lifted term's line. With T_s = 1 and 2W = 1 the
     term g(nT_s) sinc(2W(t-nT_s)) reads g(n) sinc(t-n). The value is rounded,
     so it is joined with \approx. */
  for(let n=0;n<=8;n++){
    const arg = n===0 ? 't' : `t-${n}`;
    a.raw(`<g class="st-eq${n===man?' on':''}" data-st="${n}">`);
    a.note(0.15, 1.45,
      `g(${n})\\,\\operatorname{sinc}(${arg})\\approx ${P.fmt(g(n*Ts),2)}\\,\\operatorname{sinc}(${arg})`,
      {tex:true, fs:13, color:C.mid});
    a.raw('</g>');
  }
  a.raw('<g class="sp-note">');
  a.note(0.15, 1.45, '\\text{one shifted }\\operatorname{sinc}\\text{ per sample}', {tex:true, fs:13, color:C.mid});
  a.raw('</g>');
  return a.svg().replace('<svg ', man >= 0 ? `<svg class="sincpick pick" data-man="${man}" ` : '<svg class="sincpick" ');
}

/* The interpolation sum built up term by term. Frame j holds the terms of
   INTERP_SETS[j]; between two frames the new terms enter with a weight that
   runs from 0 to 1, so the green sum moves smoothly toward g(t). The last set
   is every term the figure needs, n = -6..14. */
const INTERP_SETS = [[], [4], [3,4,5], [1,2,3,4,5,6,7], null];
function figInterpBuild(v){
  const k = v ? v.frame : 4;
  const has = (j,n) => INTERP_SETS[j]===null ? true : INTERP_SETS[j].includes(n);
  const w = n => { const j = Math.min(3, Math.floor(k)), f = k - j;
    const a0 = has(j,n)?1:0, a1 = has(j+1,n)?1:0; return a0 + (a1-a0)*f; };
  const a = P.Axes(SZ({xr:[-0.4,8.4], yr:[-1.5,1.95], xlabel:'t',
    pad:{l:50,r:26,t:24,b:42}, xtarget:6, ytarget:4}));
  a.curve(g, {color:C.in, width:1.4, dash:'4 6', opacity:0.55});
  const fade = k > 3 ? 4 - k : 1;
  for(let n=0;n<=8;n++){ const wn = w(n);
    if(wn > 0.02 && fade > 0.02)
      a.curve(t=>wn*g(n)*sinc(t-n), {color:C.mid, width:1.2, opacity:0.7*fade, dash:'3 3'}); }
  if(k > 1e-9)
    a.curve(t=>{ let s=0; for(let n=-6;n<=14;n++){ const wn=w(n); if(wn) s += wn*g(n)*sinc(t-n); } return s; },
            {color:C.out, width:2.6});
  for(let n=0;n<=8;n++) a.point(n, g(n), {color:C.in, r:3.8});
  return a.svg();
}

/* A uniform quantizer with eight levels and a unit step, in either family. */
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

/* One sample at a time through the mid-tread quantizer of figQuantizer. The
   frame is the time in units of T_s: between two frames the probe slides
   along the signal, so the reader sees the input move across a tread and the
   output hold, then jump at a boundary. The top panel keeps every sample
   taken so far and the level it went to. The two panels are nested in one
   svg, because a frame redraw replaces a single svg; the redraw's height
   hint is for a one-panel figure, so it is cleared here. */
const walkM = t => 2.3*Math.sin(2*Math.PI*(t-1)/9+2.2) + 0.6*Math.sin(2*Math.PI*(t-1)/4);
const walkQ = m => Math.max(-3, Math.min(3, Math.round(m)));
function figQuantWalk(v){
  P.hOverride = null;
  const f = (v ? v.frame : 0) + 1, mp = walkM(f), vp = walkQ(mp);
  const a = P.Axes({w:600, h:200, xr:[-0.2,8.4], yr:[-3.6,3.6], xlabel:'t/T_s', ylabel:'m(t),\\;v[n]',
    pad:{l:56,r:26,t:24,b:40}, xtarget:9, ytarget:8});
  for(let k=-3;k<=3;k++) a.hline(k, {color:C.rule, dash:'2 5', opacity:0.9});
  a.curve(walkM, {color:C.in, width:2});
  a.vline(f, {color:C.muted});
  for(let n=1;n<=f+1e-6;n++){ const m = walkM(n), q = walkQ(m);
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
  const nest = (svg, y, h) => svg.replace('<svg ', `<svg x="0" y="${y}" width="600" height="${h}" `);
  return `<svg viewBox="0 0 600 470" xmlns="http://www.w3.org/2000/svg" role="img">${nest(a.svg(),0,200)}${nest(b.svg(),200,270)}</svg>`;
}

/* The Gaussian tail and density, for the quantizer that minimises the mean
   square error. erf is the Abramowitz–Stegun rational form (error < 1.5e-7). */
function erf(x){ const s = x<0?-1:1; x = Math.abs(x); const t = 1/(1+0.3275911*x);
  return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x)); }
const phi = x => Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
const Phi = x => 0.5*(1+erf(x/Math.SQRT2));

/* The optimal four-level quantizer of a unit Gaussian, reached by applying the
   two conditions in turn until they agree: each level the centroid of its
   region, each boundary the midpoint of its two levels. The figure draws what
   the iteration settles on, so it cannot disagree with the conditions. */
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

function figQuantError(v){
  P.hOverride = null;
  const R = v && v.R!=null ? v.R : 3, L = 2**R, mmax = 5, D = 2*mmax/L;
  const q = m => Math.max(-mmax+D/2, Math.min(mmax-D/2, (Math.floor(m/D)+0.5)*D));
  const m = t => mmax*Math.cos(t);
  const a = P.Axes({w:600,h:230,xr:[0,2*Math.PI],yr:[-6,6.4],
    xlabel:'t',ylabel:'\\text{amplitude}',pad:{l:54,r:26,t:24,b:40},
    xtarget:5,ytarget:4});
  a.curve(m,{color:C.in});
  const pts=[]; for(let i=0;i<=900;i++){ const t=2*Math.PI*i/900; pts.push([t,q(m(t))]); }
  a.poly(pts,{color:C.mid,width:2.0});
  const E = 1.8*D/2;
  const b = P.Axes({w:600,h:210,xr:[0,2*Math.PI],yr:[-E,E],
    xlabel:'t',ylabel:'\\text{amplitude}',pad:{l:54,r:26,t:26,b:40},
    xtarget:5,ytarget:4});
  b.hline(D/2,{color:C.err,dash:'4 4'}); b.hline(-D/2,{color:C.err,dash:'4 4'});
  b.curve(t=>m(t)-q(m(t)),{color:C.err,width:1.7,n:1400});
  b.note(2*Math.PI-0.1, D/2+0.3*D, '+\\Delta/2', {tex:true,fs:13,color:C.err,anchor:'end'});
  const nest = (svg, y, h) => svg.replace('<svg ', `<svg x="0" y="${y}" width="600" height="${h}" `);
  return `<svg viewBox="0 0 600 440" xmlns="http://www.w3.org/2000/svg" role="img">${nest(a.svg(),0,230)}${nest(b.svg(),230,210)}</svg>`;
}

/* The time-average SQNR of a noisy sinusoid under sliders on the window T
   and the bit count R. m(t) = 3cos t + n(t), where n(t) is Gaussian with
   variance 0.36, drawn once from a seeded generator (samples every 0.25 s,
   joined by a raised-cosine blend) so the figure is the same in every render.
   The quantizer spans [-5,5]; the window [-T/2, T/2] is shaded on both panels
   and the two averages over it are printed with their ratio in dB. */
const SQNR_NOISE = (() => {
  let a = 20260924>>>0;
  const u = () => { a = (a + 0x6D2B79F5)>>>0; let t = a;
    t = Math.imul(t ^ t>>>15, t | 1); t ^= t + Math.imul(t ^ t>>>7, t | 61);
    return ((t ^ t>>>14)>>>0)/4294967296; };
  const h = 0.25, n = [];
  for(let i=0;i<=200;i++) n.push(0.6*Math.sqrt(-2*Math.log(u()+1e-12))*Math.cos(2*Math.PI*u()));
  return t => { const x = (t+25)/h, k = Math.max(0, Math.min(199, Math.floor(x))), f = x-k,
    w = (1-Math.cos(Math.PI*f))/2; return (1-w)*n[k] + w*n[k+1]; };
})();
function figSqnrWindow(v){
  P.hOverride = null;
  const T = v && v.T!=null ? v.T : 6, R = v && v.R!=null ? v.R : 3, X = 12, mmax = 5, D = 2*mmax/(1<<R);
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
  const nest = (svg, y, h) => svg.replace('<svg ', `<svg x="0" y="${y}" width="600" height="${h}" `);
  return `<svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg" role="img">${nest(a.svg(),0,230)}${nest(b.svg(),230,190)}</svg>`;
}

/* The bound |q| <= Delta/2 under a slider on the input m. A four-level
   mid-rise quantizer with Delta = 1. The region that holds m is shaded, its
   level v_k sits at the middle, and q is the gap between the line v = m and
   the staircase. The lower panel is q against m: it rises across each region
   and never leaves +-Delta/2, reaching it only at a boundary. The v_k label
   sits just left of its region, clear of the probe and the line v = m. The boundary labels move to the top in the
   leftmost region, where the line v = m runs through the bottom corner. */
function figErrBound(v){
  P.hOverride = null;
  const p = v && v.m!=null ? v.m : 0.7;
  const Q = m => Math.max(-1.5, Math.min(1.5, Math.floor(m)+0.5));
  const k0 = Math.max(-2, Math.min(1, Math.floor(p))), vk = k0+0.5, q = p-Q(p);
  const dfmt = x => { const n = Math.round(x); return n===0 ? '0' : (n<0?'−':'')+(Math.abs(n)===1?'':Math.abs(n))+'Δ'; };
  const a = P.Axes({w:600, h:270, xr:[-2.3,2.3], yr:[-2.3,2.5], xlabel:'m', ylabel:'\\mathbb{Q}(m)',
    pad:{l:56,r:26,t:24,b:40}, xticksOverride:[-2,-1,0,1,2], yticksOverride:[], xtickfmt:()=>''});
  a.rect(k0, -2.3, k0+1, 2.5, {fill:C.dec.mid});
  a.poly([[-2.3,-2.3],[2.3,2.3]], {color:C.in, width:1.4, dash:'4 4'});
  for(let k=-2;k<2;k++) a.poly([[k,Q(k+0.5)],[k+1,Q(k+0.5)]], {color:C.mid, width:2.4});
  const yb = k0===-2 ? 1.75 : -2.05;
  a.note(k0, yb, 'm_{k-1}', {tex:true, fs:14, color:C.muted, anchor:'end', dx:-4});
  a.note(k0+1, yb, 'm_k', {tex:true, fs:14, color:C.muted, dx:4});
  a.note(k0, vk-0.08, 'v_k', {tex:true, fs:15, color:C.mid, anchor:'end', dx:-8});
  a.span(k0, k0+1, 2.2, '\\Delta', {tex:true, fs:15, color:C.muted});
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
  const nest = (svg, y, h) => svg.replace('<svg ', `<svg x="0" y="${y}" width="600" height="${h}" `);
  return `<svg viewBox="0 0 600 490" xmlns="http://www.w3.org/2000/svg" role="img">${nest(a.svg(),0,270)}${nest(b.svg(),270,220)}</svg>`;
}

/* The error of a fine quantizer as a density: flat at 1/Delta across one
   step. Its second moment is the area under q^2 f_Q(q), shaded. */
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

/* SQNR against the bit count for a sinusoid at a chosen level below full
   scale. The full-scale line stays as the reference; the violet line moves
   with the slider and carries its value at R = 8. */
const ALPHA_SINE = 10*Math.log10(1.5);
function figSqnr(v){
  const lvl = v ? v.lvl : -20;
  const a = P.Axes(SZ({xr:[1,12], yr:[0,80], xlabel:'R\\;(\\text{bits per sample})',
    ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})', pad:{l:62,r:26,t:24,b:46}, xtarget:6, ytarget:5}));
  a.curve(R=>ALPHA_SINE+6.02*R, {color:C.in, width:2.3});
  a.curve(R=>ALPHA_SINE+lvl+6.02*R, {color:C.mid, width:2.3});
  const y8 = ALPHA_SINE + lvl + 6.02*8;
  a.point(8, y8, {color:C.mid, r:5});
  a.note(8.3, y8-3, P.fmt(y8,1)+'\\ \\mathrm{dB}', {tex:true, fs:14, color:C.mid});
  return a.svg();
}

/* SQNR of the full-scale sinusoid, measured: the waveform is quantized and the
   error averaged over one period. This is the quantity the formula predicts,
   computed without the formula. */
function sqnrMeasured(R){
  const mmax = 5, L = 2**R, D = 2*mmax/L, N = 20000; let pm = 0, pq = 0;
  for(let i=0;i<N;i++){
    const m = mmax*Math.cos(2*Math.PI*i/N);
    const lv = Math.max(-L/2+0.5, Math.min(L/2-0.5, Math.floor(m/D)+0.5))*D;
    pm += m*m; pq += (m-lv)*(m-lv);
  }
  return 10*Math.log10(pm/pq);
}
/* The SQNR of a full-scale sinusoid through a fine uniform quantizer,
   against the bit count, played one bit a frame. Frame k shows R = 1..k+1.
   Between two frames the new stem rises from the height of the last one, and
   a bracket marks the 6.02 dB it adds; the step Delta halves, so the noise
   power falls by four. */
function figNoiseBits(v){
  const f = v ? v.frame : 7, n = Math.floor(f+1e-9), u = f-n, R = n+1;
  const a = P.Axes(SZ({xr:[0,8.6], yr:[0,60], xlabel:'R\\;(\\text{bits per sample})',
    ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})', pad:{l:62,r:26,t:24,b:46}, xtarget:8, ytarget:6}));
  const y = r => ALPHA_SINE + 20*r*Math.log10(2);
  a.curve(y, {color:C.err, width:1.2, dash:'5 5', opacity:0.45});
  const st = []; for(let r=1;r<=R;r++) st.push([r, y(r)]);
  if(u > 0) st.push([R+1, y(R)+(y(R+1)-y(R))*u]);
  a.stem(st, {color:C.err});
  /* the step just taken: from bit Rb-1 to bit Rb, with its height grown by g */
  const Rb = u > 0 ? R+1 : R, g = u > 0 ? u : 1;
  if(Rb >= 2){
    const lo = y(Rb-1), hi = lo+(y(Rb)-lo)*g, X = Rb+0.22;
    a.poly([[Rb-1,lo],[X,lo]], {color:C.muted, width:1, dash:'3 4'});
    a.poly([[X-0.06,lo],[X,lo],[X,hi],[X-0.06,hi]], {color:C.in, width:1.6});
    if(g > 0.6) a.note(X, (lo+hi)/2, '+6.02\\ \\mathrm{dB}', {tex:true, fs:14, color:C.in, dx:6});
  }
  const Rs = u > 0.5 ? R+1 : R;
  a.note(0.3, 55, '\\Delta=2m_{\\max}/2^{'+Rs+'}', {tex:true, fs:14, color:C.muted});
  a.note(0.3, 48, 'E[Q^{2}]=m_{\\max}^{2}/(3\\cdot4^{'+Rs+'})', {tex:true, fs:14, color:C.err});
  return a.svg();
}
/* The uniform source and its quantizer regions. The example has 256 levels;
   sixteen are drawn so that a region is wide enough to see. */
function figUniformSource(){
  const L = 256, D = 2/L;
  const a = P.Axes(SZ({xr:[-1.2,1.2], yr:[-1.15,1.15], xlabel:'m', ylabel:'\\mathbb{Q}(m)',
    xticksOverride:[-1,-0.5,0,0.5,1], yticksOverride:[-1,-0.5,0,0.5,1]}));
  a.poly([[-1.2,-1.2],[1.2,1.2]], {color:C.muted, width:1.2, dash:'4 4'});
  const pts = [[-1.2, -1+D/2]];
  for(let k=1;k<L;k++) pts.push([-1+k*D, -1+(k-0.5)*D], [-1+k*D, -1+(k+0.5)*D]);
  pts.push([1.2, 1-D/2]);
  a.poly(pts, {color:C.in, width:1.6});
  /* Inset: the six steps around the origin, enlarged into the empty upper-left
     quadrant, so the steps hidden at full scale can be seen. */
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

/* The five-level quantizer of the Gaussian example: boundaries and outputs as
   the scene states them. */
const GQ_EDGES  = [-Infinity, -40, -20, 20, 40, Infinity];
const GQ_LEVELS = [-30, -10, 0, 10, 30];
const gdens = x => Math.exp(-x*x/800)/Math.sqrt(2*Math.PI*400);
const gq = x => { for(let k=0;k<5;k++) if(x<=GQ_EDGES[k+1]) return GQ_LEVELS[k]; return 30; };
/* The error integrand of the same quantizer, region by region. The area of
   each piece is its contribution to P_Q. */
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

const MU = 255, A_LAW = 87.6;
const sgn = x => x<0 ? -1 : 1;
const mulaw = x => sgn(x)*Math.log(1+MU*Math.abs(x))/Math.log(1+MU);
const muinv = y => sgn(y)*(Math.pow(1+MU, Math.abs(y))-1)/MU;
const alaw  = x => { const u=Math.abs(x);
  return sgn(x)*(u < 1/A_LAW ? A_LAW*u/(1+Math.log(A_LAW)) : (1+Math.log(A_LAW*u))/(1+Math.log(A_LAW))); };

/* The input-output staircase of a sixteen-level mu-law quantizer. Its steps
   are fine near zero and coarse near the peak. */
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

/* Each law as a family on 0 <= |x| <= 1, A-law above and mu-law below. A = 1
   and mu -> 0 both give the straight line, drawn dashed; the heaviest curve
   is the value telephone PCM uses. */
function figCompanding(){
  const muL = mu => x => Math.log(1+mu*x)/Math.log(1+mu);
  P.hOverride = null;
  const H = 235;
  const aL  = A => x => x < 1/A ? A*x/(1+Math.log(A)) : (1+Math.log(A*x))/(1+Math.log(A));
  /* The lower-right triangle under the straight line is empty, so the key
     sits there, one swatch per curve. */
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

/* The compander as a chain: compressor, uniform quantizer, expander, each box
   carrying a small drawing of its input-output curve; the quantizer's has
   eight levels, mid-rise. Under the chain, the whole chain from m to m-hat:
   the same eight levels, now narrow near zero and wide near the peak. The
   compressor drawn is a mu-law curve with a mild mu, so its shape reads at
   glyph size. */
function figCompander(){
  const bw = 130, bh = 120, y0 = 44, yc = y0+bh/2, xs = [56, 236, 416];
  const mu = 20, c = x => sgn(x)*Math.log(1+mu*Math.abs(x))/Math.log(1+mu);
  const cinv = y => sgn(y)*(Math.pow(1+mu, Math.abs(y))-1)/mu;
  const stairs = f => { const pts = [];
    for(let k=-4;k<4;k++){ const v = f((k+0.5)/4); pts.push([f(k/4), v], [f((k+1)/4), v]); }
    return pts; };
  const curve = f => [...Array(121)].map((_,k)=>{ const u = -1+2*k/120; return [u, f(u)]; });
  /* axes and a trace in a panel centred on (cx,cy), half-sizes gx and gy */
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
  /* the whole chain, m to m-hat */
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

/* Natural binary against Gray for the 2^R levels of an R-bit quantizer; the
   slider sets R, three bits by default. Rows share the height the table has. */
function figGrayTable(v){
  const R = v && v.R!=null ? v.R : 3, L = 2**R;
  const bits = n => n.toString(2).padStart(R, '0');
  const rows = []; for(let k=0;k<L;k++) rows.push([String(k), bits(k), bits(k^(k>>1))]);
  const s = Math.min(0.9, 6.9/(L-1)), fs = L>8 ? 13 : 16;
  const a = P.Axes(SZ({xr:[0,3], yr:[-0.6,8.2], pad:{l:20,r:16,t:22,b:24},
    grid:false, zeroAxes:false, arrows:false, xticksOverride:[], yticksOverride:[]}));
  ['level','natural','Gray'].forEach((h,i)=>a.note(0.5+i, 7.6, h, {fs:15, color:C.muted, anchor:'middle', weight:600}));
  /* each Gray word is a placeholder here, split into one tspan per bit below */
  rows.forEach((r,k)=>{ const y = 6.7 - k*s;
    r.forEach((cell,i)=>a.note(0.5+i, y, i===2 ? '§G'+k+'§' : cell, {fs, color:i===2?C.out:C.ink, anchor:'middle'})); });
  /* the middle pair, where natural binary changes all R bits */
  const m = L/2;
  a.rect(1.12, 6.7-(m-1)*s-0.42*s/0.9, 1.88, 6.7-m*s+0.52*s/0.9, {stroke:C.err, width:1.4, dash:'4 3'});
  /* an arc joins each pair of adjacent Gray words, which differ in one bit */
  const gx = a.sx(2.7), lift = fs/2;
  for(let k=0;k<L-1;k++){
    const yA = a.sy(6.7-k*s) - 2, yB = a.sy(6.7-(k+1)*s) - lift, r = (yB-yA)/2;
    a.raw(`<path class="gy-anim" style="animation-name:gy${L}a${k}" d="M${gx.toFixed(2)},${yA.toFixed(2)}A${(0.6*r).toFixed(2)},${r.toFixed(2)} 0 0 1 ${gx.toFixed(2)},${yB.toFixed(2)}"
      fill="none" stroke="${C.out}" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>`);
  }
  /* The pairs light up in turn: arc k thickens and the one bit that differs
     between words k and k+1, bit tz(k+1) from the right, turns amber in both.
     Each bit takes part in at most one pair, since one of k and k+1 is odd. */
  const flip = k => R-1-Math.log2((k+1)&-(k+1));
  const win = k => [k/(L-1)*100, (k+1)/(L-1)*100];
  const kf = (name, k, off, on) => { const [p0,p1] = win(k), e = Math.min(4, (p1-p0)/6);
    return `@keyframes ${name}{0%,${p0.toFixed(2)}%,${Math.min(100,p1).toFixed(2)}%,100%{${off}}${(p0+e).toFixed(2)}%,${(p1-e).toFixed(2)}%{${on}}}`; };
  let css = '';
  for(let k=0;k<L-1;k++){
    css += kf(`gy${L}a${k}`, k, 'stroke-width:1.6px;opacity:.8', 'stroke-width:3.4px;opacity:1');
    css += kf(`gy${L}b${k}`, k, `fill:${C.out}`, `fill:${C.h}`);
  }
  const bitOf = (w, j) => { for(const k of [w-1, w]) if(k>=0 && k<L-1 && flip(k)===j) return k; return -1; };
  const svg = a.svg().replace(/§G(\d+)§/g, (_, w) => { w = +w;
    return rows[w][2].split('').map((c,j)=>{ const k = bitOf(w, j);
      return k<0 ? `<tspan>${c}</tspan>` : `<tspan class="gy-anim" style="animation-name:gy${L}b${k}">${c}</tspan>`; }).join(''); });
  return svg.replace(/(<svg[^>]*>)/, `$1<style>.gy-anim{animation-duration:${(1.1*(L-1)).toFixed(1)}s;animation-iteration-count:infinite;animation-timing-function:linear}
    ${css}@media (prefers-reduced-motion:reduce){.gy-anim{animation:none}}</style>`);
}

/* One entry per code: the name and the rule that maps a bit and a position
   inside it to a level. */
const LINE_CODES = [
  ['Unipolar NRZ', (b,u)=> b?1:0, true],
  ['Polar NRZ',    (b,u)=> b?1:-1],
  ['Unipolar RZ',  (b,u)=> (b && u<0.5)?1:0, true],
  ['Manchester',   (b,u)=> (u<0.5 ? (b?1:-1) : (b?-1:1))]
];
/* The four codes of the same eight bits, stacked on one bit axis. A unipolar
   code swings between 0 and 1, a polar one between -1 and 1, and each trace
   carries a faint line at its own zero. */
function figLineCodes(){
  const bits = [0,1,1,0,1,0,0,1], off = [9.3, 6.2, 3.1, 0];
  const a = P.Axes(SZ({xr:[0,8], yr:[-1.3,11.6], pad:{l:20,r:20,t:14,b:24},
    grid:false, zeroAxes:false, arrows:false, xticksOverride:[], yticksOverride:[]}));
  /* Bit boundaries, cut at each trace so they never cross its name. */
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
  const q = v => Math.min(7, Math.floor(v)) + 0.5;      /* eight levels, step 1 V */
  const a = P.Axes(SZ({xr:[-0.15,3.75], yr:[-0.5,9.2], xlabel:'t\\;(\\mathrm{s})', ylabel:'m(t)',
    pad:{l:52,r:26,t:24,b:44}, xtarget:6, ytarget:4}));
  for(let k=0;k<8;k++) a.hline(k+0.5, {color:C.rule, dash:'2 5', opacity:0.9});
  a.curve(m, {color:C.in});
  for(let n=0;n<=6;n++){ const t=n*Ts, v=m(t);
    a.point(t, v, {color:C.in, r:4.5}); a.point(t, q(v), {color:C.mid, r:4.5}); }
  a.note(1.8, 8.6, '\\Delta=1\\ \\mathrm{V},\\;L=8', {tex:true, fs:14, color:C.muted, anchor:'middle'});
  return a.svg();
}

/* The seven code words of the example as one polar NRZ stream, a word to a
   bracket. An amber box steps along the stream one bit at a time and a violet
   box one code word at a time, so T_b and T_s = 3T_b are read off the axis.
   The two boxes share one cycle, three bit steps to a word step. */
const PCM_WORDS = ['000','001','001','111','110','000','001'];
function figPcmStream(){
  const bits = PCM_WORDS.join('').split('').map(Number), N = bits.length, W = PCM_WORDS.length;
  /* The time marks are written under the stream rather than on the zero
     line, where a polar waveform would run through them. */
  const a = P.Axes(SZ({xr:[0,N], yr:[-2.75,3.0], xlabel:'t\\;(\\mathrm{s})', ylabel:'\\text{polar NRZ}',
    pad:{l:56,r:40,t:24,b:42}, xticksOverride:[], yticksOverride:[-1,1]}));
  const bw = a.sx(1)-a.sx(0);
  /* the moving boxes sit under the waveform */
  a.raw(`<g class="ps-anim" style="animation-name:psw;animation-timing-function:steps(${W},jump-none)">`);
  a.rect(0, -1.3, 3, 2.15, {fill:C.dec.mid, stroke:C.mid, width:1.6});
  a.note(1.5, 2.55, 'T_s=3T_b=0.6\\ \\mathrm{s}', {tex:true, fs:16, color:C.mid, anchor:'middle'});
  a.raw('</g>');
  a.raw(`<g class="ps-anim" style="animation-name:psb;animation-timing-function:steps(${N},jump-none)">`);
  a.rect(0, -1.3, 1, 1.3, {fill:C.dec.h, stroke:C.h, width:1.6});
  a.note(0.5, -2.3, 'T_b=0.2\\ \\mathrm{s}', {tex:true, fs:16, color:C.h, anchor:'middle'});
  a.raw('</g>');
  for(let k=1;k<N;k++) if(k%3) a.poly([[k,-1.3],[k,1.3]], {color:C.rule, width:1, dash:'2 4'});
  for(let k=3;k<=N;k+=3) a.poly([[k,-1.3],[k,2.15]], {color:C.muted, width:1.4, dash:'6 4'});
  for(let k=0;k<=N;k+=3) a.note(k, -1.7, P.fmt(0.2*k,1), {fs:13, color:C.muted, anchor:'middle'});
  const pts=[]; bits.forEach((b,k)=>{ const y=b?1:-1; pts.push([k,y],[k+1,y]); });
  a.poly(pts, {color:C.in, width:2.2});
  PCM_WORDS.forEach((w,i)=>a.note(3*i+1.5, 1.72, w, {fs:14, color:C.mid, anchor:'middle', weight:600}));
  const T = (0.6*N).toFixed(1);
  return a.svg().replace(/(<svg[^>]*>)/, `$1<style>.ps-anim{animation-duration:${T}s;animation-iteration-count:infinite}
    @keyframes psw{from{transform:translateX(0)}to{transform:translateX(${(3*bw*(W-1)).toFixed(2)}px)}}
    @keyframes psb{from{transform:translateX(0)}to{transform:translateX(${(bw*(N-1)).toFixed(2)}px)}}
    @media (prefers-reduced-motion:reduce){.ps-anim{animation:none}}</style>`);
}

/* Every pair a two-sample block can take, with the pairs a smooth signal can
   actually produce shaded. A cell is shaded when the two indices differ by at
   most one, which is the condition the scene states, so the count on the
   slide is the count the figure draws. */
function figPairLattice(L, shade){
  const a = P.Axes(SZ({xr:[0,L], yr:[0,L], xlabel:'\\text{sample }n', ylabel:'\\text{sample }n+1',
    pad:{l:58,r:22,t:22,b:46}, xticksOverride:[0,4,8,12,16], yticksOverride:[0,4,8,12,16], grid:false}));
  for(let i=0;i<L;i++) for(let j=0;j<L;j++){
    const near = shade && Math.abs(i-j) <= 1;
    a.rect(i, j, i+1, j+1, {fill: near ? C.dec.in : 'none', stroke: near ? C.in : C.rule});
  }
  return a.svg();
}

/* One row of a smooth gradient at two level counts. The coarse staircase is
   what a reader sees as banding. Both curves are one quantizer rule with a
   different L. */
function figBanding(o){
  const a = P.Axes(Object.assign(SZ({xr:[0,1], yr:[-0.06,1.10], xlabel:'\\text{position across the image}',
    ylabel:'\\text{brightness}', pad:{l:62,r:22,t:22,b:46}, xtarget:5, ytarget:5}), o||{}));
  const q = (v,L) => (Math.min(L-1, Math.floor(v*L)) + 0.5)/L;
  a.curve(x => q(x, 256), {color:C.in, width:2.0, n:1400});
  a.curve(x => q(x, 8),   {color:C.mid, width:2.4, n:1400});
  a.note(0.06, 0.96, 'L=256', {tex:true, fs:14, color:C.in});
  a.note(0.62, 0.30, 'L=8', {tex:true, fs:14, color:C.mid});
  return a.svg();
}

/* A photograph at L = 2^R grey levels, cropped square to stand for the
   512 x 512 image of the card beside it. The quantizer is an SVG filter: the
   picture is turned to luminance, then each value in [k/L,(k+1)/L) is sent to
   (k+1/2)/L, the rule figBanding draws. The ramp under the picture goes
   through the same filter, so its steps are the levels the picture uses. The
   last line is the card's size sum at the slider's R. */
function figImageQuant(v){
  const R = v && v.R!=null ? v.R : 3, L = 2**R, W = 600, S = 370, x0 = (W-S)/2, id = 'iq'+L;
  const tv = Array.from({length:L}, (_,k)=>((k+0.5)/L).toFixed(4)).join(' ');
  const fn = c => `<feFunc${c} type="discrete" tableValues="${tv}"/>`;
  const lum = '0.299 0.587 0.114 0 0 ';
  const grp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  const bits = 512*512*R;
  return `<svg viewBox="0 0 ${W} ${S+92}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Inter,-apple-system,sans-serif">
    <defs><filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="1" height="1">
      <feColorMatrix type="matrix" values="${lum+lum+lum}0 0 0 1 0"/>
      <feComponentTransfer>${fn('R')+fn('G')+fn('B')}</feComponentTransfer></filter>
      <linearGradient id="${id}g"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
    <image href="${IMG.satellite}" x="${x0}" y="0" width="${S}" height="${S}" preserveAspectRatio="xMidYMid slice" filter="url(#${id})"/>
    <rect x="${x0}" y="${S+12}" width="${S}" height="20" fill="url(#${id}g)" filter="url(#${id})"/>
    <text x="${x0-8}" y="${S+27}" font-size="14" fill="${C.muted}" text-anchor="end">0</text>
    <text x="${x0+S+8}" y="${S+27}" font-size="14" fill="${C.muted}">1</text>
    <text x="${W/2}" y="${S+60}" font-size="15" fill="${C.ink}" text-anchor="middle">L = ${L} levels, ${R} bit${R===1?'':'s'} a pixel</text>
    <text x="${W/2}" y="${S+84}" font-size="15" fill="${C.muted}" text-anchor="middle">512\u00b2 \u00d7 ${R} = ${grp(bits)} bits = ${grp(bits/8192)} KiB</text>
  </svg>`;
}

/* A gallery of four everyday cases closing a section: the figures in a 2×2
   grid, and the cards beside them revealed one at a time. */
function realGallery(cfg){
  return { id:cfg.id, module:'M1', nav:cfg.nav, title:cfg.title, src:cfg.src,
    objective:cfg.objective, keywords:cfg.keywords,
    budget:cfg.budget||'a gallery of four everyday cases. Each figure is one example',
    slide:true, steps:cfg.notes.length-1, blocks:[
    {t:'eyebrow', text:cfg.eyebrow},
    {t:'title', text:cfg.title},
    {t:'cols', ratio:'c-8-4', fill:true, left:[
      {t:'grid', cols:2, gap:'18px 22px', items:cfg.figs.map(([svg,cap,listen])=>
        [Object.assign({t:'fig', frame:true, svg, caption:cap}, listen?{listen}:{})])}
    ], right:cfg.notes.map((n,i)=>i ? {t:'reveal', at:i, items:[n]} : n)}
  ]};
}

/* ---- the galleries ------------------------------------------------------ */

/* A recorded sound as a signal of time, for fig.listen. SND holds 8 kHz
   mu-law bytes (build/snd/pack.js); they are expanded once. M keeps every
   M-th sample, after a low-pass below 4/M kHz when filter is set, the way
   an anti-aliasing filter would run before a slower sampler. Playback
   rebuilds the signal from the kept samples with a windowed sinc. */
const SPEECH = {};
/* The recording as 8 kHz samples, expanded from its mu-law bytes once. */
function speechRaw(name){
  if(!SPEECH[name]){
    const b = atob(SND[name]), x = new Float32Array(b.length);
    for(let i=0;i<b.length;i++){
      const u = ~b.charCodeAt(i) & 255, e = (u>>4) & 7, m = ((((u&15)<<3) + 0x84) << e) - 0x84;
      x[i] = (u & 128 ? -m : m)/32768;
    }
    SPEECH[name] = x;
  }
  return SPEECH[name];
}
/* Samples y at the rate fs as a signal of time, rebuilt with a windowed sinc. */
function asSound(y, fs){
  const K = 8;
  return { dur: y.length/fs, f: t => {
    const u = t*fs, n0 = Math.floor(u); let s = 0;
    for(let n=n0-K+1;n<=n0+K;n++){
      if(n<0 || n>=y.length) continue;
      const d = u-n;
      s += y[n]*(d ? Math.sin(Math.PI*d)/(Math.PI*d) : 1)*(0.5+0.5*Math.cos(Math.PI*d/K));
    }
    return s; } };
}
function speech(name, M, filter){
  speechRaw(name);
  const key = name+'/'+M+'/'+!!filter;
  if(!SPEECH[key]){
    let x = SPEECH[name];
    if(filter){ const fc = 0.45/M, L = 60, h = [];
      for(let k=-L;k<=L;k++) h.push((k ? Math.sin(2*Math.PI*fc*k)/(Math.PI*k) : 2*fc)*(0.54+0.46*Math.cos(Math.PI*k/L)));
      const y = new Float32Array(x.length);
      for(let n=0;n<x.length;n++){ let s=0; for(let k=-L;k<=L;k++){ const i=n-k; if(i>=0 && i<x.length) s += h[k+L]*x[i]; } y[n]=s; }
      x = y; }
    const y = new Float32Array(Math.ceil(x.length/M));
    for(let i=0;i<y.length;i++) y[i] = x[i*M];
    SPEECH[key] = y;
  }
  return asSound(SPEECH[key], 8000/M);
}

const REAL_SAMPLING = realGallery({ id:'m1-real-sampling', nav:'Sampling rates around us',
  title:'Sampling rates around us', eyebrow:'Module 1 · The sampling theorem', src:'CH7 s.12',
  objective:'Attach the Nyquist rate to systems students use every day.',
  keywords:'examples cd audio 44.1 khz telephone 8 khz film 24 frames wagon wheel ecg 500 hz',
  figs:[
    [()=>{ const a=P.Axes(EXO({xr:[-70,70],yr:[-0.1,1.3],xlabel:'f\\;(\\text{kHz})',ylabel:'G_\\delta(f)',
        xticksOverride:[-44.1,-20,20,44.1],ytickfmt:()=>''}));
      for(const c of [-44.1,0,44.1]) copy(a,c,20,1,{color:C.mid,width:2.2});
      return a.svg(); }, 'CD audio is sampled at $44.1$ kHz. Hearing ends near $20$ kHz, so a $4.1$ kHz guard band remains.'],
    [()=>{ const a=P.Axes(EXO({xr:[-12,12],yr:[-0.1,1.3],xlabel:'f\\;(\\text{kHz})',ylabel:'G_\\delta(f)',
        xticksOverride:[-8,-3.4,3.4,8],ytickfmt:()=>''}));
      const band = c => [1,-1].forEach(s=>a.poly([[c+0.3*s,0],[c+0.9*s,1],[c+2.2*s,0.62],[c+3.4*s,0]],{color:C.mid,width:2.2}));
      for(const c of [-16,-8,0,8,16]) band(c);
      return a.svg(); }, 'Telephone speech is filtered to $3.4$ kHz and sampled at $8$ kHz, which leaves a $1.2$ kHz guard band.',
      {items:[
        {label:'$f_s=8$ kHz', sound:()=>speech('apollo11', 1)},
        {label:'$f_s=2$ kHz, no filter', sound:()=>speech('apollo11', 4)},
        {label:'$f_s=2$ kHz, filtered', sound:()=>speech('apollo11', 4, true)}]}],
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
  ],
  notes:[
    {t:'note', kind:'def', head:'Rate from the band', html:'Each system samples above twice its highest frequency. A filter before the sampler removes anything above $f_s/2$.'},
    {t:'note', kind:'err', head:'Aliasing you can see', html:'A film camera has no filter before its sampler. A motion faster than half the frame rate folds back, so a wheel can appear to turn backwards.'}
  ]});

const REAL_RECONSTRUCT = realGallery({ id:'m1-real-reconstruct', nav:'Reconstruction around us',
  title:'Reconstruction around us', eyebrow:'Module 1 · Reconstruction', src:'CH7 s.12',
  objective:'Compare the ideal filter with the holds and filters real converters use.',
  keywords:'examples zero order hold staircase droop linear interpolation oversampling dac images',
  figs:[
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
  ],
  notes:[
    {t:'note', kind:'def', head:'A hold, not a sinc', html:'A converter cannot build the ideal filter. It holds each sample for $T_s$, then smooths the staircase with an analog filter.'},
    {t:'note', kind:'def', head:'Transform pair', html:'A hold of length $T_s$ has a rectangular impulse response, and a rectangle transforms to a sinc.<div class="nsep"></div>$h_0(t)=1,\\ 0\\le t<T_s\\;\\leftrightarrow\\;T_s\\operatorname{sinc}(fT_s)\\,e^{-j\\pi fT_s}$<br>Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$.'},
    {t:'note', kind:'warn', head:'Hold droop', html:'The hold weights the spectrum by $\\operatorname{sinc}(f/f_s)$. At $f_s/2$ that is $2/\\pi$, a loss of $3.92$ dB.'}
  ]});

const REAL_QUANT = realGallery({ id:'m1-real-quant', nav:'Quantizers around us',
  title:'Quantizers around us', eyebrow:'Module 1 · Quantization', src:'CH7 s.16',
  objective:'Recognise uniform quantizers in displays, converters and stored data.',
  keywords:'examples thermometer display adc 10 bit 3.3 V step kitchen scale mid tread language model llm weights 4 bit int4 memory',
  figs:[
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
      const phi=w=>Math.exp(-w*w/2)/Math.sqrt(2*Math.PI), D=0.4;
      const Phi=w=>{ let s=0; const n=400, lo=-8; for(let i=0;i<n;i++){ const u=lo+(w-lo)*(i+.5)/n; s+=phi(u); } return s*(w-lo)/n; };
      a.curve(phi,{color:C.in,width:1.6,dash:'5 5'});
      a.stem([...Array(16)].map((_,k)=>{ const l=-3+k*D, lo=k?l-D/2:-8, hi=k<15?l+D/2:8; return [l,(Phi(hi)-Phi(lo))/D]; }),{color:C.mid});
      return a.svg(); }, 'A language model with $70\\times10^{9}$ weights needs $140$ GB at $16$ bits. At $4$ bits each weight is rounded to one of $2^{4}=16$ levels, and the model needs about $35$ GB.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Every reading is a level', html:'A digital display shows one of a finite set of values. A change smaller than one step leaves the reading unchanged.'},
    {t:'note', kind:'ok', head:'A level at zero', html:'A display that rounds is mid-tread, so an empty scale reads exactly zero. A converter that truncates puts a boundary at each code edge.'}
  ]});

const REAL_SQNR = realGallery({ id:'m1-real-sqnr', nav:'SQNR around us',
  title:'SQNR around us', eyebrow:'Module 1 · Quantization noise', src:'CH7 s.22',
  objective:'Put the six-decibel rule next to the word lengths of real formats.',
  keywords:'examples cd 16 bit 98 db telephone 8 bit headroom dbfs banding word length studio 24 bit',
  figs:[
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
    [()=>figBanding({w:520,h:250,pad:{l:60,r:22,t:22,b:44}}), 'A row of an image at $8$ levels shows bands where the $256$-level row is smooth.'],
    [()=>{ const R=[8,12,16,24], nm=['telephone','camera','CD','studio'];
      const a=P.Axes(EXO({xr:[4,27],yr:[0,180],xlabel:'R\\;(\\text{bits})',ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',xticksOverride:R,ytarget:4}));
      a.stem(R.map(r=>[r,ALPHA_SINE+6.0206*r]),{color:C.mid});
      R.forEach((r,i)=>a.note(r,ALPHA_SINE+6.0206*r+20,nm[i],{fs:13,color:C.muted,anchor:'middle'}));
      return a.svg(); }, 'A full-scale sinusoid at common word lengths: $49.9$, $74.0$, $98.1$ and $146.3$ dB.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Headroom costs SQNR', html:'The formula assumes a full-scale input. Each decibel below full scale takes one decibel from the SQNR.'},
    {t:'note', kind:'warn', head:'Quiet talkers at 8 bits', html:'A telephone call spans a wide range of levels. At $8$ uniform bits a quiet talker keeps little SQNR. Companding, next, fixes this.'}
  ]});

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
const REAL_COMPANDING = realGallery({ id:'m1-real-companding', nav:'Companding around us',
  title:'Companding around us', eyebrow:'Module 1 · Non-uniform quantization', src:'CH7 s.33',
  objective:'See what companding does to a telephone signal and to its SQNR.',
  keywords:'examples telephone mu law a law sqnr against level compressed speech 3 bit non uniform staircase',
  figs:[
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
  ],
  notes:[
    {t:'note', kind:'def', head:'Telephone PCM', html:'North America and Japan use $\\mu$-law with $\\mu=255$. Most other countries use A-law with $A=87.6$. Both use $8$ bits at $8$ kHz.'},
    {t:'note', kind:'ok', head:'Steady quality', html:'Companding gives up a little SQNR at full scale. In return the SQNR stays nearly constant over a wide range of input levels.'}
  ]});

const REAL_PCM = realGallery({ id:'m1-real-pcm', nav:'PCM around us',
  title:'PCM around us', eyebrow:'Module 1 · Pulse code modulation', src:'CH7 s.36',
  objective:'Compute the bit rates of real PCM formats and see a line code and a Gray code in use.',
  keywords:'examples cd 1.4112 mb/s telephone 64 kb/s 125 microseconds ethernet manchester rotary encoder gray code',
  figs:[
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
  ],
  notes:[
    {t:'note', kind:'def', head:'Rate from three numbers', html:'The bit rate is the bits a sample, times the sampling rate, times the number of channels.'},
    {t:'note', kind:'ok', head:'One bit at a boundary', html:'A reading taken exactly on a sector edge can see either neighbour. With a Gray code it is off by at most one sector.'}
  ]});

/* ---- figures of the later scenes ------------------------------------------
   Aliasing in an image, overload, dither, hearing the quantizer, the cost of
   PCM in bandwidth and in bit errors, DPCM and delta modulation, and the
   coders built on them: the T1 frame, LPC, sigma-delta and JPEG. */

/* A seeded uniform generator, so that every render draws the same noise. */
function seeded(seed){
  let a = seed>>>0;
  return () => { a = (a + 0x6D2B79F5)>>>0; let t = a;
    t = Math.imul(t ^ t>>>15, t | 1); t ^= t + Math.imul(t ^ t>>>7, t | 61);
    return ((t ^ t>>>14)>>>0)/4294967296; };
}
/* One panel placed inside a larger figure. */
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const frameOf = (v, last) => v && v.frame!=null ? v.frame : last;
const clamp01 = x => Math.max(0, Math.min(1, x));

/* A grey picture w x h drawn from f(i,j) in [0,1], as a PNG data URI. It is
   drawn once per key: the figures that use it redraw on every slider step. */
const PIX = {};
function pixels(key, w, h, f){
  if(PIX[key]) return PIX[key];
  if(typeof document==='undefined') return '';
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), im = g.createImageData(w, h);
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){
    const v = Math.max(0, Math.min(255, Math.round(255*f(i,j)))), k = 4*(j*w+i);
    im.data[k] = im.data[k+1] = im.data[k+2] = v; im.data[k+3] = 255;
  }
  g.putImageData(im, 0, 0);
  return (PIX[key] = c.toDataURL('image/png'));
}
const picture = (url, x, y, w, h, sharp) =>
  `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${sharp?' style="image-rendering:pixelated"':''}/>`
  + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.rule}" stroke-width="1"/>`;

/* A zone plate: rings whose spatial frequency grows with the radius. At the
   radius r (in image widths) the rings repeat ZONE_A r times per image width,
   so N pixels across hold them only inside r = N/(2 ZONE_A). */
const ZONE_A = 84;
const zone = (u,v) => 0.5 + 0.5*Math.cos(Math.PI*ZONE_A*(u*u+v*v));
function figMoire(v){
  P.hOverride = null;
  const N = v && v.N!=null ? v.N : 48, S = 270, x2 = 330, cx = x2+S/2, cy = S/2;
  const fine = pixels('zone512', 512, 512, (i,j)=>zone((i+0.5)/512-0.5, (j+0.5)/512-0.5));
  const smp  = pixels('zone'+N, N, N, (i,j)=>zone((i+0.5)/N-0.5, (j+0.5)/N-0.5));
  const ra = N/(2*ZONE_A)*S, id = 'moclip'+N;
  let ring = '';
  if(ra < 0.72*S)
    ring = `<clipPath id="${id}"><rect x="${x2}" y="0" width="${S}" height="${S}"/></clipPath>
      <circle cx="${cx}" cy="${cy}" r="${ra.toFixed(1)}" fill="none" stroke="${C.plate}" stroke-width="6" clip-path="url(#${id})"/>
      <circle cx="${cx}" cy="${cy}" r="${ra.toFixed(1)}" fill="none" stroke="${C.err}" stroke-width="3" stroke-dasharray="8 5" clip-path="url(#${id})"/>`;
  const lab = (t, x) => P.texName(t, {xMid:x, baseline:S+32, size:16, color:C.ink, figW:600});
  return `<svg viewBox="0 0 600 ${S+44}" xmlns="http://www.w3.org/2000/svg" role="img">`
    + picture(fine, 0, 0, S, S, false) + picture(smp, x2, 0, S, S, true) + ring
    + lab('\\text{the scene}', S/2) + lab(`${N}\\times${N}\\text{ samples}`, cx) + '</svg>';
}

/* A smooth random signal of unit power: twelve cosines of seeded frequency
   and phase. Its values are close to Gaussian, with rare large peaks. */
const GSIG = (()=>{ const r = seeded(7040), K = 12, c = [];
  for(let k=0;k<K;k++) c.push([0.6+2.4*r(), 2*Math.PI*r()]);
  const amp = Math.sqrt(2/K);
  return t => { let s = 0; for(const [w,p] of c) s += Math.cos(w*t+p); return amp*s; }; })();
/* SQNR of a unit Gaussian through an L-level mid-rise quantizer spanning
   [-V, V], the outer levels taking everything beyond. Simpson's rule. */
function gaussSqnr(V, L){
  const D = 2*V/L, q = x => Math.max(-V+D/2, Math.min(V-D/2, (Math.floor(x/D)+0.5)*D));
  const n = 6000, a = -9, h = 18/n; let s = 0;
  for(let i=0;i<=n;i++){ const x = a+i*h, w = (i===0||i===n) ? 1 : (i%2 ? 4 : 2); s += w*(x-q(x))**2*phi(x); }
  return -10*Math.log10(s*h/3);
}
const OVL = (()=>{ const pts = []; let best = [0,-1];
  for(let V=0.4; V<=4.0001; V+=0.02){ const s = gaussSqnr(V, 8); pts.push([V, s]); if(s > best[1]) best = [V, s]; }
  return {pts, best}; })();
function figOverload(v){
  P.hOverride = null;
  const V = v && v.V!=null ? v.V : 1, L = 8, D = 2*V/L;
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
  const b = P.Axes({w:600, h:214, xr:[0.4,4], yr:[0,16], xlabel:'m_{\\max}/\\sigma', ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',
    pad:{l:62,r:26,t:24,b:44}, xticksOverride:[0.5,1,1.5,2,2.5,3,3.5,4], yticksOverride:[0,5,10,15]});
  b.vline(OVL.best[0], {color:C.muted, dash:'4 4'});
  b.poly(OVL.pts, {color:C.mid, width:2.3});
  const s = gaussSqnr(V, L);
  b.point(V, s, {color:C.mid, r:5.5});
  b.note(V + (V < 3 ? 0.08 : -0.08), s - 2.6, s.toFixed(2)+'\\ \\mathrm{dB}', {tex:true, fs:15, color:C.mid, anchor:V < 3 ? 'start' : 'end'});
  return `<svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,236)}${place(b.svg(),0,236,600,214)}</svg>`;
}

/* SQNR against R for three sources, each at full range: the model lines
   alpha + 6.02R and the values measured on the quantized source. The
   Gaussian source is loaded at +-4 sigma, so at many bits its clipped peaks
   bend it below its line. */
const A_GAUSS4 = 10*Math.log10(3/16);
function figSqnrSources(v){
  const R = v && v.R!=null ? v.R : 8;
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
  return a.svg();
}

/* The recording through an R-bit quantizer spanning its own peak, at a level
   lvl dB below it; law 'mu' puts the mu-law compressor and expander around
   the same uniform quantizer. Kept per setting: the slider revisits them. */
const SPQ = {};
function speechQ(R, law, lvl){
  const key = R+'/'+law+'/'+lvl;
  if(!SPQ[key]){
    const x = speechRaw('apollo11'); let pk = 0;
    for(let i=0;i<x.length;i++) pk = Math.max(pk, Math.abs(x[i]));
    const A = Math.pow(10, lvl/20)/pk, L = 1<<R, D = 2/L;
    const uq = y => Math.max(-1+D/2, Math.min(1-D/2, (Math.floor(y/D)+0.5)*D));
    const s = new Float32Array(x.length), q = new Float32Array(x.length), e = new Float32Array(x.length);
    let ps = 0, pe = 0;
    for(let i=0;i<x.length;i++){
      const m = A*x[i], y = law==='mu' ? muinv(uq(mulaw(m))) : uq(m);
      s[i] = m; q[i] = y; e[i] = y-m; ps += m*m; pe += (y-m)*(y-m);
    }
    SPQ[key] = {s, q, e, D, sqnr:10*Math.log10(ps/pe)};
  }
  return SPQ[key];
}
/* The 50 ms of the recording with the most energy, for the plotted excerpt. */
const LOUD = (()=>{ let at = 0; return () => {
  if(at) return at;
  const x = speechRaw('apollo11'), W = 400; let best = -1;
  for(let i=0;i+W<x.length;i+=40){ let e = 0; for(let k=0;k<W;k++) e += x[i+k]*x[i+k]; if(e > best){ best = e; at = i; } }
  return at; }; })();
const stair = (y, i0, n) => { const pts = [];
  for(let k=0;k<n;k++){ const t = k/8, v = y[i0+k]; pts.push([t, v], [t+1/8, v]); } return pts; };
function figHearBits(v){
  P.hOverride = null;
  const R = v && v.R!=null ? v.R : 3, Q = speechQ(R, 'u', 0), i0 = LOUD(), n = 200, D = Q.D;
  const a = P.Axes({w:600, h:236, xr:[0,25], yr:[-1.15,1.15], xlabel:'t\\;(\\mathrm{ms})', ylabel:'x(t)',
    pad:{l:54,r:26,t:24,b:40}, xtarget:5, yticksOverride:[-1,-0.5,0,0.5,1]});
  a.poly([...Array(n)].map((_,k)=>[k/8, Q.s[i0+k]]), {color:C.in, width:1.6});
  a.poly(stair(Q.q, i0, n), {color:C.mid, width:1.8});
  const b = P.Axes({w:600, h:196, xr:[0,25], yr:[-1.1*D,2.0*D], xlabel:'t\\;(\\mathrm{ms})', ylabel:'q(t)',
    pad:{l:54,r:26,t:20,b:40}, xtarget:5, yticksOverride:[]});
  b.hline(D/2, {color:C.err, dash:'4 4'}); b.hline(-D/2, {color:C.err, dash:'4 4'});
  b.poly(stair(Q.e, i0, n), {color:C.err, width:1.4});
  b.note(12.5, 1.5*D, `\\mathrm{SQNR}=${Q.sqnr.toFixed(1)}\\ \\text{dB over the whole recording}`, {tex:true, fs:16, color:C.err, anchor:'middle'});
  return `<svg viewBox="0 0 600 432" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,236)}${place(b.svg(),0,236,600,196)}</svg>`;
}

/* A quiet voice through six uniform bits and through six mu-law bits. The
   vertical axis follows the voice, so the uniform steps look as coarse to
   the eye as they sound. */
function figHearMu(v){
  P.hOverride = null;
  const lvl = v && v.lvl!=null ? v.lvl : -30, R = 6, i0 = LOUD(), n = 400;
  const U = speechQ(R, 'u', lvl), M = speechQ(R, 'mu', lvl);
  let pk = 0; for(let k=0;k<n;k++) pk = Math.max(pk, Math.abs(U.s[i0+k]));
  const Y = Math.max(1.2*pk, 0.75*U.D);
  const panel = (Qz, y0, head) => {
    const a = P.Axes({w:600, h:186, xr:[0,50], yr:[-Y,Y], xlabel:'t\\;(\\mathrm{ms})', ylabel:'x(t)',
      pad:{l:54,r:26,t:24,b:40}, xtarget:5, ytarget:4, ytickfmt:u=>P.fmt(u,3)});
    a.poly([...Array(n)].map((_,k)=>[k/8, Qz.s[i0+k]]), {color:C.in, width:1.6});
    a.poly(stair(Qz.q, i0, n), {color:C.mid, width:1.9});
    return place(a.svg(), 0, y0, 600, 186)
      + P.texName(`${head}\\quad\\mathrm{SQNR}=${Qz.sqnr.toFixed(1)}\\ \\mathrm{dB}`, {xRight:574, baseline:y0-6, size:15, color:C.mid, figW:600});
  };
  /* the key of the two traces, drawn in the strip above the upper panel */
  const key = (x, col, t) => `<path d="M${x},14H${x+26}" stroke="${col}" stroke-width="2.4"/>`
    + P.texName(t, {xLeft:x+32, baseline:20, size:15, color:C.ink, figW:600});
  return `<svg viewBox="0 0 600 470" xmlns="http://www.w3.org/2000/svg" role="img">`
    + key(56, C.in, 'x(t)') + key(150, C.mid, '\\mathbb{Q}(x(t))')
    + panel(U, 52, '\\text{uniform, }6\\text{ bits}') + panel(M, 284, '\\mu\\text{-law, }6\\text{ bits}') + '</svg>';
}

/* Dither. A slow sinusoid 1.3 steps high through a mid-tread quantizer with
   a unit step; frame 1 adds a uniform dither of one step before it, frame 2
   averages 64 dithered passes. The strips under the plot are a grey ramp at
   four levels, without and with dither. */
const DITH = (()=>{ const r = seeded(4242), N = 240, K = 64, d = [];
  for(let k=0;k<K;k++){ const row = []; for(let n=0;n<N;n++) row.push(r()-0.5); d.push(row); }
  return {N, K, d}; })();
const ditherIn = n => 1.3*Math.sin(2*Math.PI*n/DITH.N);
function figDither(v){
  P.hOverride = null;
  const f = frameOf(v, 2), {N, K, d} = DITH, u1 = clamp01(f), u2 = clamp01(f-1);
  const a = P.Axes({w:600, h:300, xr:[0,N], yr:[-2.3,2.3], xlabel:'n', ylabel:'m[n],\\;\\hat m[n]',
    pad:{l:56,r:26,t:24,b:40}, xtarget:6, yticksOverride:[-2,-1,0,1,2]});
  for(const L of [-2,-1,1,2]) a.hline(L, {color:C.rule, dash:'2 5', opacity:0.9});
  a.raw(`<g opacity="${(1-0.8*u1).toFixed(3)}">`);
  a.poly([...Array(N)].map((_,n)=>[n, Math.round(ditherIn(n))]), {color:C.mid, width:2.2});
  a.raw('</g>');
  if(u1 > 1e-3){
    a.raw(`<g opacity="${(u1*(1-0.75*u2)).toFixed(3)}">`);
    a.poly([...Array(N)].map((_,n)=>[n, Math.round(ditherIn(n)+d[0][n])]), {color:C.mid, width:1.1});
    a.raw('</g>');
  }
  if(u2 > 1e-3){
    const avg = [...Array(N)].map((_,n)=>{ let s = 0; for(let k=0;k<K;k++) s += Math.round(ditherIn(n)+d[k][n]); return [n, s/K]; });
    a.raw(`<g opacity="${u2.toFixed(3)}">`); a.poly(avg, {color:C.out, width:2.4}); a.raw('</g>');
  }
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
/* The same idea by ear: a quiet tone 1.3 steps high at 8 kHz, one second. */
const TONE = {};
function ditherTone(withDither){
  const key = withDither ? 'd' : 'p';
  if(!TONE[key]){ const r = seeded(515), n = 8000, y = new Float32Array(n);
    for(let i=0;i<n;i++){ const x = 1.3*Math.sin(2*Math.PI*330*i/8000); y[i] = Math.round(x + (withDither ? r()-0.5 : 0)); }
    TONE[key] = y; }
  return asSound(TONE[key], 8000);
}

/* The bandwidth PCM needs. Top: the message band and the least band of an
   R-bit PCM stream sampled at 2W. Bottom: the SQNR of a full-scale
   sinusoid against the same bandwidth, one point per bit. */
function figPcmBw(v){
  P.hOverride = null;
  const R = v && v.R!=null ? v.R : 8;
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
  b.note(R+(R<9?0.3:-0.3), s-15, P.fmt(s,1)+'\\ \\mathrm{dB}', {tex:true, fs:15, color:C.mid, anchor:R<9?'start':'end'});
  return `<svg viewBox="0 0 600 440" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,210)}${place(b.svg(),0,210,600,230)}</svg>`;
}

/* One channel bit error in a 4-bit PCM stream. The sample n = 3 is coded
   1110; frame k flips bit b = k-1 of it, so the decoded value moves by
   2^b steps. Between frames the wrong sample slides to its new value. */
const BE = { R:4, n0:3, N:24 };
const beX = n => 0.9*Math.sin(2*Math.PI*n/BE.N + 0.3);
const beCode = x => Math.max(0, Math.min(15, Math.floor(x/0.125)+8));
const beLevel = k => (k-8+0.5)*0.125;
function figBitError(v){
  const f = frameOf(v, 4), k0 = beCode(beX(BE.n0));
  const at = j => j < 1 ? beLevel(k0) : beLevel(k0 ^ (1<<(j-1)));
  const j = Math.min(3, Math.floor(f)), u = f-j, y = at(j) + (at(j+1)-at(j))*u, b = Math.round(f)-1;
  const a = P.Axes(SZ({xr:[-0.6,BE.N-0.4], yr:[-1.3,1.55], xlabel:'n', ylabel:'\\hat m[n]',
    xtarget:6, yticksOverride:[-1,-0.5,0,0.5,1]}));
  a.curve(t=>beX(t), {color:C.in, width:1.4, dash:'5 5', opacity:0.6});
  const st = []; for(let n=0;n<BE.N;n++) if(n!==BE.n0) st.push([n, beLevel(beCode(beX(n)))]);
  a.stem(st, {color:C.mid});
  const ok = beLevel(k0), wrong = Math.abs(y-ok) > 1e-6;
  a.stem([[BE.n0, y]], {color:wrong ? C.err : C.mid});
  if(b >= 0 && Math.abs(f-Math.round(f)) < 1e-6){
    a.point(BE.n0, ok, {color:C.mid, r:4, ring:C.plate});
    a.poly([[BE.n0+0.55, ok],[BE.n0+0.55, y]], {color:C.err, width:1.6, dash:'4 3'});
    const bits = k => k.toString(2).padStart(4,'0');
    a.note(BE.n0+1.5, (ok+y)/2, `2^{${b}}\\Delta`, {tex:true, fs:15, color:C.err});
    a.note(9.5, 1.32, `\\texttt{${bits(k0)}}\\to\\texttt{${bits(k0^(1<<b))}}`, {tex:true, fs:16, color:C.err});
  }
  return a.svg();
}
/* The recording at 8 bits with bit b of each sample flipped with
   probability p; bit 0 is the last bit, bit 7 the first. */
const BERR = {};
function speechBitErr(b, p){
  const key = b+'/'+p;
  if(!BERR[key]){
    const x = speechRaw('apollo11'), r = seeded(9001+b); let pk = 0;
    for(let i=0;i<x.length;i++) pk = Math.max(pk, Math.abs(x[i]));
    const y = new Float32Array(x.length);
    for(let i=0;i<x.length;i++){
      let k = Math.max(0, Math.min(255, Math.floor(x[i]/pk*128)+128));
      if(r() < p) k ^= (1<<b);
      y[i] = (k-128+0.5)/128;
    }
    BERR[key] = y;
  }
  return asSound(BERR[key], 8000);
}

/* DPCM of a smooth source with a first-order predictor and a 3-bit
   quantizer of the difference over [-0.4, 0.4]. The decoder's value
   xhat[n-1] is the prediction, so encoder and decoder stay in step. */
const DP = (()=>{ const N = 32, x = [], xh = [], pr = [], e = [], L = 8, D = 0.8/L;
  const q = u => Math.max(-0.4+D/2, Math.min(0.4-D/2, (Math.floor(u/D)+0.5)*D));
  let last = 0;
  for(let n=0;n<N;n++){ const s = 0.78*Math.sin(2*Math.PI*n/N) + 0.26*Math.sin(6*Math.PI*n/N + 0.9);
    x.push(s); pr.push(last); e.push(s-last); last = last + q(s-last); xh.push(last); }
  return {N, x, xh, pr, e}; })();
function figDpcm(v){
  P.hOverride = null;
  const f = frameOf(v, 2), u1 = clamp01(f), u2 = clamp01(f-1), {N, x, pr, e} = DP;
  const a = P.Axes({w:600, h:250, xr:[-0.8,N-0.2], yr:[-1.15,1.15], xlabel:'n', ylabel:'x[n]',
    pad:{l:56,r:26,t:24,b:40}, xtarget:8, yticksOverride:[-1,-0.5,0,0.5,1]});
  a.stem(x.map((s,n)=>[n,s]), {color:C.in});
  if(u1 > 1e-3){
    a.raw(`<g opacity="${u1.toFixed(3)}">`);
    for(let n=0;n<N;n++) a.poly([[n+0.22, pr[n]],[n+0.22, x[n]]], {color:C.muted, width:1.2, dash:'2 3'});
    for(let n=0;n<N;n++) a.point(n+0.22, pr[n], {color:C.mid, r:3.4});
    a.raw('</g>');
  }
  const b = P.Axes({w:600, h:210, xr:[-0.8,N-0.2], yr:[-1.15,1.15], xlabel:'n', ylabel:'e[n]=x[n]-\\hat x[n-1]',
    pad:{l:56,r:26,t:24,b:40}, xtarget:8, yticksOverride:[-1,-0.5,0,0.5,1]});
  if(u2 > 1e-3){
    b.raw(`<g opacity="${u2.toFixed(3)}">`); b.stem(e.map((s,n)=>[n,s]), {color:C.mid}); b.raw('</g>');
    const em = Math.max(...e.map(Math.abs));
    b.note(N-1, 0.78, `|e[n]|\\le${em.toFixed(2)}`, {tex:true, fs:15, color:C.mid, anchor:'end'});
  }
  return `<svg viewBox="0 0 600 460" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,250)}${place(b.svg(),0,250,600,210)}</svg>`;
}

/* Delta modulation of a signal with one steep rise between two nearly flat
   stretches. The staircase moves one step a sample; where it trails the
   signal by more than two steps the lag is shaded as slope overload. The
   bits are the ticks under the plot, up for 1 and down for 0. */
const DMN = 120;
const dmX = n => 0.72*Math.tanh((n-38)/5) + 0.1*Math.sin(2*Math.PI*n/30);
function figDm(v){
  const D = v && v.D!=null ? v.D : 0.06;
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

/* Time-division multiplexing. Top: four of the 24 calls, each sampled every
   125 us. Bottom: one T1 frame, a framing bit and 24 slots of 8 bits, which
   fill in slot by slot between frames 0 and 1. */
function figT1(v){
  P.hOverride = null;
  const f = frameOf(v, 2), u1 = clamp01(f), u2 = clamp01(f-1);
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
  const shown = u1*25;
  if(shown > 0.02) b.rect(0, 1, 1, 2.2, {fill:C.plate, stroke:C.slate, width:1.6});
  for(let k=1;k<=24;k++){ const on = clamp01(shown-k);
    if(on <= 0.02) continue;
    const x0 = 1+8*(k-1);
    b.raw(`<g opacity="${on.toFixed(3)}">`);
    b.rect(x0, 1, x0+8, 2.2, {fill:C.dec.mid, stroke:C.mid, width:1.4});
    b.note(x0+4, 1.45, String(k), {fs:12, color:C.ink, anchor:'middle'});
    b.raw('</g>');
  }
  if(shown > 0.5) b.note(-1.4, 1.45, '\\mathrm{F}', {tex:true, fs:15, color:C.slate, anchor:'end'});
  if(u2 > 1e-3){
    b.raw(`<g opacity="${u2.toFixed(3)}">`);
    b.span(0, 193, 0.62, null, {color:C.muted});
    b.note(96.5, 0.05, '193\\ \\text{bits in }125\\ \\mu\\text{s}=1.544\\ \\text{Mb/s}', {tex:true, fs:15, color:C.ink, anchor:'middle'});
    b.span(1, 9, 2.75, null, {color:C.mid});
    b.note(5, 2.85, '8 bits', {fs:13, color:C.mid, anchor:'start'});
    b.raw('</g>');
  }
  return `<svg viewBox="0 0 600 430" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,260)}${place(b.svg(),0,260,600,170)}</svg>`;
}

/* The source-filter model of LPC at 8 kHz: a pulse train at 125 Hz through
   an all-pole filter with three resonances, the formants of an open vowel. */
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
  const r = seeded(31), noise = new Float32Array(n); for(let i=0;i<n;i++) noise[i] = r()-0.5;
  const H = f => { let re = 0, im = 0; A.forEach((c,k)=>{ re += c*Math.cos(2*Math.PI*f*k/fs); im -= c*Math.sin(2*Math.PI*f*k/fs); });
    return 1/Math.hypot(re, im); };
  let hmax = 0; for(let f=0; f<=4000; f+=5) hmax = Math.max(hmax, H(f));
  return { fs, F, pulses, voiced:synth(pulses), whisper:synth(noise), HdB: f => 20*Math.log10(H(f)/hmax) };
})();
function figLpc(v){
  P.hOverride = null;
  const f = frameOf(v, 2), u1 = clamp01(f), u2 = clamp01(f-1);
  const a = P.Axes({w:600, h:236, xr:[0,32], yr:[-1.15,1.3], xlabel:'t\\;(\\mathrm{ms})', ylabel:'w_n,\\;x_n',
    pad:{l:54,r:26,t:24,b:40}, xticksOverride:[0,8,16,24,32], yticksOverride:[-1,0,1]});
  for(let t=0;t<=32;t+=8) a.impulse(t, 1, {color:C.in, label:false, opacity:1-0.75*u2});
  if(u2 > 1e-3){
    const y = LPC.voiced, off = 64*40, pts = [];
    for(let k=0;k<=256;k++) pts.push([k/8, y[off+k]]);
    a.raw(`<g opacity="${u2.toFixed(3)}">`); a.poly(pts, {color:C.out, width:1.9}); a.raw('</g>');
  }
  if(u2 < 0.5) a.span(8, 16, 1.16, '\\text{pitch period }1/f_0', {tex:true, fs:13, color:C.muted});
  /* The response is drawn 12 dB under its peak and the range stops short of
     0 dB, so the frequency ticks sit on the lower frame, clear of the curve. */
  const b = P.Axes({w:600, h:214, xr:[0,4], yr:[-50,-0.5], xlabel:'f\\;(\\mathrm{kHz})', ylabel:'|H(f)|\\;(\\mathrm{dB})',
    pad:{l:62,r:26,t:24,b:42}, xticksOverride:[0,1,2,3,4], yticksOverride:[-40,-20]});
  if(u1 > 1e-3){
    b.raw(`<g opacity="${u1.toFixed(3)}">`);
    b.curve(k=>LPC.HdB(1000*k)-12, {color:C.h, width:2.3, n:800});
    LPC.F.forEach((F,i)=>b.note(F/1000, LPC.HdB(F)-8, `F_{${i+1}}`, {tex:true, fs:14, color:C.h, anchor:'middle'}));
    b.raw('</g>');
  }
  return `<svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,236)}${place(b.svg(),0,236,600,214)}</svg>`;
}

/* A first-order sigma-delta modulator on one period of a sinusoid,
   oversampled U times a base grid of 16 samples. The one-bit output is
   averaged over U samples, which is the lowpass filter of the decoder. */
function sigmaDelta(U){
  const N = 16*U, x = [], y = []; let s = 0, last = 0;
  for(let n=0;n<N;n++){ const xn = 0.5*Math.sin(2*Math.PI*(n+0.5)/N); s += xn - last; last = s >= 0 ? 1 : -1; x.push(xn); y.push(last); }
  const h = Math.max(1, U), avg = [];
  for(let n=0;n<N;n++){ let a = 0, c = 0; for(let k=n-h;k<=n+h;k++){ const w = 1-Math.abs(k-n)/(h+1); a += w*y[(k+N)%N]; c += w; } avg.push(a/c); }
  let pe = 0, px = 0; for(let n=0;n<N;n++){ pe += (avg[n]-x[n])**2; px += x[n]*x[n]; }
  return {N, x, y, avg, snr:10*Math.log10(px/pe)};
}
function figSigmaDelta(v){
  const U = v && v.U!=null ? v.U : 16, S = sigmaDelta(U), N = S.N;
  const a = P.Axes(SZ({xr:[0,1], yr:[-1.3,1.55], xlabel:'t/T_0', ylabel:'y[n],\\;\\hat x(t)',
    xticksOverride:[0,0.25,0.5,0.75,1], yticksOverride:[-1,-0.5,0,0.5,1]}));
  const pts = []; S.y.forEach((b,n)=>pts.push([n/N,b],[(n+1)/N,b]));
  a.raw('<g opacity="0.55">'); a.poly(pts, {color:C.mid, width:1}); a.raw('</g>');
  a.curve(t=>0.5*Math.sin(2*Math.PI*t), {color:C.in, width:2.2, dash:'7 5'});
  a.poly(S.avg.map((u,n)=>[(n+0.5)/N, u]), {color:C.out, width:2.6});
  a.note(0.02, 1.36, `\\text{after the filter: }\\mathrm{SNR}=${S.snr.toFixed(1)}\\ \\mathrm{dB}`, {tex:true, fs:15, color:C.out});
  return a.svg();
}

/* JPEG on a drawn 128 x 128 picture: 8 x 8 blocks, the 2-D DCT, the
   standard luminance table scaled by the quality setting, rounding, and
   the inverse DCT. The count is of coefficients that survive rounding. */
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
const JPG = {};
function jpeg(quality){
  if(JPG[quality]) return JPG[quality];
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
  return (JPG[quality] = {out, nz});
}
function figJpeg(v){
  P.hOverride = null;
  const qv = v && v.q!=null ? v.q : 25, {n, p} = JIMG, J = jpeg(qv), S = 270;
  const orig = pixels('jorig', n, n, (i,j)=>p[j*n+i]/255);
  const dec  = pixels('jq'+qv, n, n, (i,j)=>J.out[j*n+i]/255);
  const lab = (t, x) => P.texName(t, {xMid:x, baseline:S+30, size:16, color:C.ink, figW:600});
  const pct = (100*J.nz/(n*n)).toFixed(1);
  return `<svg viewBox="0 0 600 ${S+76}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Inter,-apple-system,sans-serif">`
    + picture(orig, 0, 0, S, S, true) + picture(dec, 330, 0, S, S, true)
    + lab('\\text{original}', S/2) + lab(`\\text{quality }${qv}`, 330+S/2)
    + `<text x="300" y="${S+64}" font-size="15" fill="${C.muted}" text-anchor="middle">${J.nz} of ${n*n} coefficients are not zero (${pct}%)</text></svg>`;
}

/* The whole chain on one message: the lowpass filter takes off a fast
   ripple, the sampler keeps one value every T_s, the quantizer moves each
   value to one of eight levels, and the encoder writes three bits for it. */
const CH_D = 0.4, chQ = s => Math.max(0, Math.min(7, Math.floor((s+1.6)/CH_D)));
function figChain(v){
  P.hOverride = null;
  const f = frameOf(v, 4), u = k => clamp01(f-k);
  const bw = 120, bh = 50, y0 = 26, xs = [22, 170, 318, 466], names = ['Lowpass filter','Sampler','Quantizer','Encoder'];
  const it = [];
  names.forEach((nm,i)=>{ it.push({t:'box', x:xs[i], y:y0, w:bw, h:bh, label:nm, fs:15});
    if(i<3) it.push({t:'arrow', x1:xs[i]+bw, y1:y0+bh/2, x2:xs[i+1], y2:y0+bh/2}); });
  const hi = Math.round(f)-1;
  const glow = hi >= 0 ? `<rect x="${xs[hi]}" y="${y0}" width="${bw}" height="${bh}" fill="${hi===0 ? C.dec.h : C.dec.mid}" rx="2"/>` : '';
  const top = P.blocks({w:600, h:96, items:it}).replace(/(<svg[^>]*>)/, '$1'+glow);
  const a = P.Axes({w:600, h:330, xr:[-0.4,8.4], yr:[-2.35,1.9], xlabel:'t/T_s', ylabel:'\\text{signal at this stage}',
    pad:{l:54,r:26,t:24,b:40}, ynameAtAxis:true, xtarget:9, yticksOverride:[-1.6,0,1.6]});
  const rip = 0.22*(1-u(0));
  if(f >= 2) for(let k=0;k<8;k++) a.hline(-1.6+(k+0.5)*CH_D, {color:C.rule, dash:'2 5', opacity:0.9*u(2)});
  a.curve(t=>g(t)+rip*Math.sin(7.7*t), {color:C.in, width:2.2, opacity:f > 1 ? 1-0.6*u(1) : 1});
  if(f > 1){
    const st = []; for(let n=0;n<=8;n++){ const s = g(n), qv = -1.6+(chQ(s)+0.5)*CH_D; st.push([n, s+(qv-s)*u(2)]); }
    a.raw(`<g opacity="${u(1).toFixed(3)}">`); a.stem(st, {color:C.mid}); a.raw('</g>');
  }
  if(f > 3){
    a.raw(`<g opacity="${u(3).toFixed(3)}">`);
    for(let n=0;n<=8;n++) a.note(n, -2.1, chQ(g(n)).toString(2).padStart(3,'0'), {fs:14, color:C.mid, anchor:'middle', weight:600});
    a.raw('</g>');
  }
  return `<svg viewBox="0 0 600 426" xmlns="http://www.w3.org/2000/svg" role="img">${place(top,0,0,600,96)}${place(a.svg(),0,96,600,330)}</svg>`;
}

/* ---- the opening and the summary on navy ---------------------------------
   The page under these figures is navy, so the axis, the tick numbers and the
   axis names are drawn in the ink of that page, and the signals in the
   dark-page tints. */
const NAVY = {axis:'rgba(239,231,216,.34)', tick:'#9EACB9', name:'#E6E2D9'};
function figOpenTrace(){
  const a = P.Axes({w:520,h:178,xr:[0,10],yr:[-1.45,1.45],grid:false,
    xlabel:'t', ylabel:'g(t)', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3});
  const pts=[]; for(let i=0;i<=520;i++){ const t=10*i/520; pts.push([a.sx(t),a.sy(g(t))]); }
  const d='M'+pts.map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join('L');
  let len=0; for(let i=1;i<pts.length;i++) len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  const cap='fill="none" stroke-linejoin="round" stroke-linecap="round"';
  a.raw(`<g style="--len:${len.toFixed(1)};--len-neg:${(-len).toFixed(1)};--tail-e:${(140-len).toFixed(1)}">
    <path class="mtf-trace" d="${d}" stroke="#7FC3CE" stroke-width="2.4" ${cap}/>
    <g class="mtf-sparkwrap">
      <path class="mtf-beam-tail" d="${d}" stroke="#7FC3CE" stroke-width="4.5" opacity=".55" ${cap}/>
      <path class="mtf-beam" d="${d}" stroke="#D9F3F7" stroke-width="3" ${cap}/></g></g>`);
  /* the sampling instants: a dot on the trace every half second, appearing
     with the stem it becomes below */
  for(let n=0;n<=20;n++){
    const X=a.sx(0.5*n).toFixed(2), Y=a.sy(g(0.5*n)).toFixed(2);
    a.raw(`<g class="mtf-stem" style="--i:${n};transform-origin:${X}px ${Y}px">
      <circle class="mtf-stem-dot" cx="${X}" cy="${Y}" r="3.6" fill="#D9F3F7" stroke="#0A0F18" stroke-width="1.2"/></g>`);
  }
  return a.svg();
}
/* The same message sampled every half second and rounded to a step of 0.25:
   the stems rise one by one, each to its quantized height. */
function figOpenStems(){
  const a = P.Axes({w:520,h:178,xr:[0,10],yr:[-1.45,1.45],grid:false,
    xlabel:'n', ylabel:'\\mathbb{Q}(g(nT_s))', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3,
    xtickfmt:v=>String(2*v)});
  const q = v => (Math.floor(v/0.25)+0.5)*0.25;
  for(let k=-5;k<=5;k++) a.hline((k+0.5)*0.25, {color:'rgba(239,231,216,.10)', dash:'2 5'});
  for(let n=0;n<=20;n++){
    const t=0.5*n, X=a.sx(t).toFixed(2), Y0=a.sy(0).toFixed(2), Y=a.sy(q(g(t))).toFixed(2);
    a.raw(`<g class="mtf-stem" style="--i:${n};transform-origin:${X}px ${Y0}px">
      <line x1="${X}" y1="${Y0}" x2="${X}" y2="${Y}" stroke="#AC99DC" stroke-width="1.8"/>
      <circle class="mtf-stem-dot" cx="${X}" cy="${Y}" r="4" fill="#AC99DC"/></g>`);
  }
  return a.svg();
}
/* Each quantized sample as its 4-bit code, most significant bit on top: level
   k of the sixteen steps of 0.25 on [-2, 2) is written k in binary, one digit
   to a row. The columns follow the stems above, one sample to a column. */
function figOpenBits(){
  const a = P.Axes({w:520,h:98,xr:[0,10],yr:[0,4],grid:false,zeroAxes:false,
    xlabel:'', ylabel:'\\text{4-bit code}', chrome:NAVY, pad:{l:46,r:30,t:10,b:4},
    xtickfmt:()=>'', ytickfmt:()=>''});
  const rh=a.sy(0)-a.sy(1);
  for(let n=0;n<=20;n++){
    const k = Math.floor(g(0.5*n)/0.25)+8, X=a.sx(0.5*n);
    const cells = [3,2,1,0].map((b,r)=>{ const on=(k>>b)&1, y=a.sy(4-r)+rh*0.78;
      return `<text x="${X.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" font-size="15"
        font-family="'JetBrains Mono',ui-monospace,monospace" fill="${on?'#C9BAF0':'rgba(239,231,216,.38)'}">${on}</text>`; }).join('');
    a.raw(`<g class="mtf-stem" style="--i:${n+3};transform-origin:${X.toFixed(2)}px ${a.sy(0).toFixed(2)}px">${cells}</g>`);
  }
  return a.svg();
}

/* Small sketches for the summary cards, in the dark-page signal tints. */
const G = (()=>{
  const sv = b => `<svg viewBox="0 0 92 44">${b}</svg>`;
  const ln = (d,c,w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const AX='rgba(239,231,216,.30)', CY='#4FBECE', GR='#82C27B', RD='#E8785F', VI='#AC99DC', AM='#E5B255';
  const sincPath = (x0,w,y0,h,col) => ln('M'+[...Array(81)].map((_,k)=>{ const u=-4+8*k/80;
    return (x0+w*k/80).toFixed(1)+','+(y0-h*sinc(u)).toFixed(1); }).join('L'), col, 1.8);
  return {
    replicas: sv(ln('M1 38 H91',AX,1)+ln('M6 38 L16 10 L26 38 M36 38 L46 10 L56 38 M66 38 L76 10 L86 38',VI)),
    nyquist:  sv(ln('M1 38 H91',AX,1)+ln('M16 38 L31 10 L46 38 L61 10 L76 38',VI)+`<circle cx="46" cy="38" r="3" fill="${VI}"/>`),
    sinc:     sv(ln('M1 32 H91',AX,1)+sincPath(2,88,32,26,AM)),
    interp:   sv(ln('M1 24 H91',AX,1)+ln('M2 26 Q14 4 28 16 T54 30 T90 14',GR)
                 +[8,24,40,56,72,88].map((x,i)=>`<circle cx="${x}" cy="${[16,12,22,28,21,15][i]}" r="2.4" fill="${CY}"/>`).join('')),
    stair:    sv(ln('M4 40 L88 4',AX,1)+ln('M4 38 H18 V30 H32 V22 H46 V16 H60 V10 H74 V4 H88',VI)),
    errbox:   sv(ln('M1 38 H91',AX,1)+`<rect x="26" y="12" width="40" height="26" fill="rgba(232,120,95,.18)" stroke="${RD}" stroke-width="1.8"/>`
                 +ln('M26 38 Q46 18 66 38',RD,1.4)),
    sqnr:     sv(ln('M4 40 H90 M4 40 V4',AX,1)+ln('M8 36 L84 8',GR)+[8,27,46,65,84].map((x,i)=>`<circle cx="${x}" cy="${36-7*i}" r="2.4" fill="${GR}"/>`).join('')),
    compand:  sv(ln('M4 40 L88 4',AX,1)+ln('M'+[...Array(41)].map((_,k)=>{ const u=k/40;
                 return (4+84*u).toFixed(1)+','+(40-36*Math.log(1+255*u)/Math.log(256)).toFixed(1); }).join('L'),CY)),
    pcm:      sv(ln('M1 22 H91',AX,1)+ln('M2 34 H14 V10 H38 V34 H50 V10 H62 V34 H86 V10 H90',CY)),
    gray:     sv([0,1,2,3,4,5,6,7].map(k=>{ const gc=k^(k>>1); return [0,1,2].map(b=>((gc>>(2-b))&1)
                 ? `<rect x="${4+k*10.8}" y="${4+b*12.5}" width="10" height="11" fill="${CY}"/>` : '').join(''); }).join('')
                 +ln('M4 40 H90',AX,1)),
    bw:       sv(ln('M1 38 H91',AX,1)+`<rect x="10" y="22" width="72" height="16" fill="rgba(172,153,220,.18)" stroke="${VI}" stroke-width="1.6"/>`
                 +ln('M36 38 L46 8 L56 38',CY)),
    dm:       sv(ln('M4 36 C30 36 34 8 60 8 H88',CY,1.6)+ln('M4 36 H12 V32 H20 V28 H28 V24 H36 V20 H44 V16 H52 V12 H60 V8 H68 V12 H76 V8 H84',VI,1.6)),
    alias:    sv(ln('M1 23 H91',AX,1)+ln('M'+[...Array(89)].map((_,k)=>(2+k).toFixed(1)+','+(23-15*Math.cos(2*Math.PI*k/10)).toFixed(1)).join('L'),AX,1.2)
                 +ln('M'+[...Array(89)].map((_,k)=>(2+k).toFixed(1)+','+(23-15*Math.cos(2*Math.PI*k/110)).toFixed(1)).join('L'),RD,1.8)
                 +[0,1,2,3,4,5,6,7,8].map(i=>{ const k=11*i, y=23-15*Math.cos(2*Math.PI*k/10);
                   return `<circle cx="${(2+k).toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="${VI}"/>`; }).join(''))
  };
})();

const SC = [

/* ---------------------------------------------------------------- 1.0 ---- */
{ id:'m1-open', module:'M1', nav:'Module 1 opening', title:'Sampling, Quantization and PCM',
  objective:'Fix the three-stage chain and name which stage is reversible.',
  keywords:'module 1 overview sampling quantization encoding chain analog digital reversible',
  src:'CH7 s.3', dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Sampling, quantization and PCM'},
  {t:'title', level:1, text:'Sampling, Quantization and PCM'},
  {t:'lede', text:'A continuous waveform becomes a bit stream in three stages: sampling, quantization and encoding.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'stack', style:'--ts:1.6;gap:34px', items:[
      {t:'note', kind:'warn', head:'Result 1', html:'<span style="color:var(--graphite)">Sampling can be undone. At $f_s\\ge 2W$ the samples of a signal bandlimited to $W$ determine it exactly.</span>'},
      {t:'note', kind:'warn', head:'Result 2', html:'<span style="color:var(--graphite)">Quantization cannot be undone. Each extra bit divides the error power by four, which is about $6$ dB of SQNR.</span>'}
    ]}
  ], right:[
    {t:'grid', cols:1, gap:'10px', items:[
      [{t:'fig', svg:figOpenTrace}],
      [{t:'fig', svg:figOpenStems}],
      [{t:'fig', svg:figOpenBits}]
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 1.1 ---- */
/* A reference slide: the transform, pairs and properties Module 1 and 2 use,
   written in f. It has no figure, so it states its budget. */
{ id:'m1-ft-review', module:'M1', nav:'Fourier transform review', title:'Fourier transform review',
  objective:'Restate the Fourier transform in the frequency variable f, with the pairs and properties the module uses.',
  keywords:'fourier transform review pairs properties frequency f omega 2 pi sinc rectangle impulse train shift modulation convolution parseval',
  budget:'a reference slide of the transform, its pairs and its properties. There is nothing to draw',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Fourier transform review'},
  {t:'cols', ratio:'c-6-6', left:[
    {t:'eq', label:'The transform in $f$', tex:'\\begin{aligned}X(f)&=\\int_{-\\infty}^{\\infty}x(t)\\,e^{-j2\\pi ft}\\,dt\\\\x(t)&=\\int_{-\\infty}^{\\infty}X(f)\\,e^{j2\\pi ft}\\,df\\end{aligned}',
      note:'Put $\\omega=2\\pi f$. Then $d\\omega=2\\pi\\,df$, so the factor $1/2\\pi$ leaves the inverse.'},
    {t:'eq', label:'Properties', tex:'\\begin{aligned}x(t-t_0)&\\;\\leftrightarrow\\;X(f)\\,e^{-j2\\pi ft_0}\\\\x(t)\\,e^{j2\\pi f_0t}&\\;\\leftrightarrow\\;X(f-f_0)\\\\x(t)*y(t)&\\;\\leftrightarrow\\;X(f)\\,Y(f)\\\\x(t)\\,y(t)&\\;\\leftrightarrow\\;X(f)*Y(f)\\\\\\int_{-\\infty}^{\\infty}|x(t)|^{2}\\,dt&=\\int_{-\\infty}^{\\infty}|X(f)|^{2}\\,df\\end{aligned}',
      note:'The last line is Parseval\'s theorem: the energy is the same in both domains.'}
  ], right:[
    {t:'eq', label:'Pairs', tex:'\\begin{aligned}\\delta(t)&\\;\\leftrightarrow\\;1\\\\1&\\;\\leftrightarrow\\;\\delta(f)\\\\e^{j2\\pi f_0t}&\\;\\leftrightarrow\\;\\delta(f-f_0)\\\\\\cos(2\\pi f_0t)&\\;\\leftrightarrow\\;\\tfrac12\\delta(f-f_0)+\\tfrac12\\delta(f+f_0)\\\\\\Pi(t/T)&\\;\\leftrightarrow\\;T\\operatorname{sinc}(fT)\\\\2W\\operatorname{sinc}(2Wt)&\\;\\leftrightarrow\\;\\Pi\\!\\left(\\frac{f}{2W}\\right)\\\\\\sum_{n}\\delta(t-nT_s)&\\;\\leftrightarrow\\;\\frac{1}{T_s}\\sum_{n}\\delta(f-nf_s)\\end{aligned}',
      note:'$\\Pi(t/T)$ is $1$ for $|t|<T/2$ and $0$ elsewhere. Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$ and $f_s=1/T_s$.'},
    {t:'note', kind:'err', head:'Common error', html:'Use $1\\leftrightarrow\\delta(f)$, not $1\\leftrightarrow2\\pi\\delta(f)$, when the $\\omega$ pair $1\\leftrightarrow2\\pi\\delta(\\omega)$ moves to $f$. The reason is $\\delta(2\\pi f)=\\delta(f)/2\\pi$.'}
  ]}
]},

{ id:'m1-sampler', module:'M1', nav:'Impulse-train sampling', title:'Impulse-train sampling',
  objective:'Define the ideal sampled signal and reduce it to a weighted impulse train.',
  keywords:'impulse train sampling period sifting property ideal sampled signal',
  src:'CH7 s.4', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Impulse-train sampling'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$g(t)$','$p(t)$','$g_\\delta(t)=g(t)\\,p(t)$','$g_\\delta(t)$ alone']},
      svg:figSamplingStack,
      caption:'Step through the frames. The message, the train, then their product: each impulse carries the sample value at its own time.'},
    {t:'legend', items:[['in','$g(t)$',0,0,2],['h','$p(t)$',0,1,2],['mid','$g_\\delta(t)$',0,2]]}
  ], right:[
    {t:'eq', label:'Impulse train', tex:'p(t)=\\sum_{n=-\\infty}^{\\infty}\\delta(t-nT_s),\\qquad f_s=\\frac{1}{T_s}'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Sampled signal', tex:'\\begin{aligned}g_\\delta(t)&=g(t)\\,p(t)\\\\&=g(t)\\sum_{n=-\\infty}^{\\infty}\\delta(t-nT_s)\\\\&=\\sum_{n=-\\infty}^{\\infty}g(t)\\,\\delta(t-nT_s)\\\\&=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\,\\delta(t-nT_s)\\end{aligned}',
        note:'Move $g(t)$ inside the sum, then sift: $g(t)\\delta(t-t_0)=g(t_0)\\delta(t-t_0)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A sampler takes one sample every $T_s=125\\ \\mu$s.<div class="nsep"></div>What is the sampling rate?',
        ask:{key:'m1-sampler', choices:['$125$ Hz','$8$ kHz','$80$ kHz'], answer:1,
          why:'$f_s=1/T_s=1/(125\\times10^{-6})=8000$ Hz.'}}]}
  ]}
]},

{ id:'m1-spectrum', module:'M1', cls:'type-lg', nav:'The sampled spectrum', title:'The spectrum of a sampled signal',
  objective:'Find the transform of the impulse train, the first half of the replication result.',
  keywords:'fourier transform replication convolution impulse train spectrum',
  src:'CH7 s.5–6', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'The spectrum of a sampled signal'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, svg:figSpectrumPair, caption:'The message spectrum, and the spectrum after sampling at $f_s=3W$. A scaled copy sits at every multiple of $f_s$.'},
    {t:'note', kind:'def', head:'Transform pairs', html:'In $f$, no $2\\pi$ appears: $x(t)\\,y(t)\\leftrightarrow X(f)*Y(f)$ and $e^{j2\\pi f_0t}\\leftrightarrow\\delta(f-f_0)$.'}
  ], right:[

    {t:'eq', label:'Product in time', tex:'G_\\delta(f)=G(f)*P(f)',
      note:'$g_\\delta(t)=g(t)\\,p(t)$, so the first pair applies.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Transform of the train', tex:'\\begin{aligned}c_n&=\\frac{1}{T_s}\\int_{-T_s/2}^{T_s/2}\\delta(t)\\,e^{-j2\\pi nf_st}\\,dt=\\frac{1}{T_s}\\\\p(t)&=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}e^{j2\\pi nf_st}\\\\P(f)&=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)\\end{aligned}',
        note:'Sifting gives $e^{0}=1$. The second pair, with $f_0=nf_s$, transforms each term.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$G(f)=0$ for $|f|\\ge 4$ kHz, and $f_s=10$ kHz.<div class="nsep"></div>Where does the copy centred at $f_s$ begin?',
        ask:{key:'m1-spectrum', choices:['$4$ kHz','$6$ kHz','$10$ kHz'], answer:1,
          why:'The copy $G(f-f_s)$ occupies $f_s-W<f<f_s+W$, so it starts at $10-4=6$ kHz.'}}]}
  ]}
]},

{ id:'m1-spectrum-b', module:'M1', nav:'Spectral replicas', title:'Spectral replicas',
  objective:'Show that convolving with one shifted impulse shifts the spectrum, and assemble the replicas.',
  keywords:'convolution shifted impulse sifting copy scale factor fs replicas frames',
  src:'CH7 s.6', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Spectral replicas'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$G(f)$','$f_s\\,G(f)$','$n=\\pm1$','$n=\\pm2$']},
      svg:figSpectrumBuild,
      caption:'Step through the frames. The message spectrum is scaled by $f_s$, then one copy is added for each pair of impulses at $\\pm nf_s$.'}
  ], right:[
    {t:'eq', label:'Convolution with one impulse', tex:'\\begin{aligned}G(f)*\\delta(f-nf_s)&=\\int_{-\\infty}^{\\infty}G(\\theta)\\,\\delta(f-nf_s-\\theta)\\,d\\theta\\\\&=\\int_{-\\infty}^{\\infty}G(\\theta)\\,\\delta\\bigl(\\theta-(f-nf_s)\\bigr)\\,d\\theta\\\\&=G(f-nf_s)\\end{aligned}',
      note:'Flip the sign of the even impulse, then sift at $\\theta=f-nf_s$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', key:true, result:true, label:'Key result · Spectrum replicas', tex:'\\begin{aligned}G_\\delta(f)&=\\frac{1}{T_s}\\sum_{n}G(f)*\\delta(f-nf_s)\\\\&=f_s\\sum_{n=-\\infty}^{\\infty}G(f-nf_s)\\end{aligned}',
        note:'Put $P(f)$ into $G(f)*P(f)$ and convolve term by term, with $1/T_s=f_s$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A signal is sampled at $f_s=8$ kHz.<div class="nsep"></div>In the copy centred at $f_s$, where does the value $G(1\\text{ kHz})$ appear?',
        ask:{key:'m1-spectrum-b', choices:['$7$ kHz','$8$ kHz','$9$ kHz'], answer:2,
          why:'The copy is $G(f-8\\text{ kHz})$. It equals $G(1\\text{ kHz})$ where $f-8=1$, at $9$ kHz.'}}]}
  ]}
]},

{ id:'m1-cases', module:'M1', nav:'Three sampling rates', title:'Three sampling rates',
  objective:'Separate oversampling, Nyquist sampling and aliasing by the geometry of the replicas.',
  keywords:'oversampling nyquist undersampling aliasing overlap guard band slider',
  src:'CH7 s.7–8', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Three sampling rates'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'r', label:'$f_s$', min:1.2, max:3.4, step:0.1, v:3, show:v=>'$'+num(v)+'W$'}]},
      svg:v=>figCaseAt(v ? v.r : 3),
      caption:'Drag $f_s$. Above $2W$ a guard band separates the copies; at $2W$ they touch; below $2W$ they overlap.'}
  ], right:[
    {t:'note', kind:'def', head:'Three cases', html:'<ol class="steps"><li>$f_s>2W$: oversampling, a gap between copies.</li><li>$f_s=2W$: Nyquist sampling, the copies touch.</li><li>$f_s<2W$: undersampling, the copies overlap.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'err', head:'Aliasing', html:'Where two copies overlap, a high message frequency lands on a low one. No filter can separate them, so the samples no longer determine the signal.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Guard band', html:'A real signal is not strictly bandlimited. Sample at $f_s=2W+f_g$, and filter out everything above $W$ before the sampler.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$W=3$ kHz and $f_s=5$ kHz.<div class="nsep"></div>Do the copies overlap?',
        ask:{key:'m1-cases', choices:['Yes','No'], answer:0,
          why:'$f_s=5<2W=6$ kHz. The first copy starts at $5-3=2$ kHz, inside the message band.'}}]}
  ]}
]},

{ id:'m1-theorem', module:'M1', cls:'type-lg', nav:'The sampling theorem', title:'The sampling theorem',
  objective:'State the theorem and the rate and interval it fixes.',
  keywords:'sampling theorem nyquist rate nyquist interval bandlimited statement',
  src:'CH7 s.12', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'The sampling theorem'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:()=>figCaseAt(2),
      caption:'At $f_s=2W$ the copies touch without overlap. A lower rate causes overlap. A higher rate leaves a gap.'}
  ], right:[
    {t:'note', kind:'def', head:'Sampling theorem', html:'If $G(f)=0$ for $|f|\\ge W$ and $f_s\\ge 2W$, the samples $g(nT_s)$ determine $g(t)$ exactly.'},
    {t:'reveal', at:1, items:[
      {t:'eq', key:true, result:true, label:'Key result · Nyquist rate', tex:'\\begin{aligned}f_s-W&\\ge W\\\\f_s&\\ge 2W\\\\f_s^{\\min}&=2W\\end{aligned}',
        note:'The copy at $f_s$ starts at $f_s-W$, which must not lie below $W$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', side:true, label:'Nyquist interval', tex:'\\begin{aligned}T_s&=\\frac{1}{f_s}\\le\\frac{1}{2W}\\\\T_s^{\\max}&=\\frac{1}{2W}\\end{aligned}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Telephone speech is bandlimited to $W=3.4$ kHz.<div class="nsep"></div>What is the longest sampling interval?',
        ask:{key:'m1-theorem', choices:['$73.5\\ \\mu$s','$147\\ \\mu$s','$294\\ \\mu$s'], answer:1,
          why:'$T_s^{\\max}=1/(2W)=1/(6.8\\text{ kHz})=147\\ \\mu$s.'}}]}
  ]}
]},

{ id:'m1-moire', module:'M1', nav:'Aliasing in an image', title:'Aliasing in an image',
  objective:'See the sampling theorem in space: a pattern finer than two pixels a cycle folds into a false pattern.',
  keywords:'aliasing image pixels moire zone plate spatial frequency camera optical lowpass filter slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Aliasing in an image'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      live:{controls:[{k:'N', label:'$N$', min:24, max:128, step:8, v:48, show:v=>'$'+v+'$ pixels'}]},
      svg:figMoire,
      caption:'Rings that get finer toward the edge, and the same rings sampled on an $N\\times N$ grid. Outside the red circle the rings are finer than two pixels a cycle, and false rings appear.'}
  ], right:[
    {t:'note', kind:'def', head:'Sampling in space', html:'A camera samples a scene with its pixels. A pattern finer than two pixels a cycle folds back into a coarser false pattern, called <b>moiré</b>.'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'No aliasing', tex:'f\\le\\frac{N}{2}\\ \\ \\text{cycles per image width}',
        note:'$N$ pixels across the image. Two pixels a cycle is the Nyquist rate in space.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Optical filter', html:'Many cameras put a slight blur in front of the sensor. It removes detail finer than the pixels, as an anti-aliasing filter does before a sampler.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'An image is $1000$ pixels wide.<div class="nsep"></div>What is the finest stripe pattern it can hold without aliasing?',
        ask:{key:'m1-moire', choices:['$250$ cycles','$500$ cycles','$1000$ cycles'], answer:1,
          why:'Two pixels a cycle, so $N/2=1000/2=500$ cycles across the image.'}}]}
  ]}
]},

REAL_SAMPLING,

/* ---------------------------------------------------------------- 1.2 ---- */
{ id:'m1-lpf', module:'M1', nav:'The reconstruction filter', title:'The reconstruction filter',
  objective:'Give the ideal reconstruction filter, its gain and the transition band.',
  keywords:'reconstruction lowpass filter gain transition band oversampling',
  src:'CH7 s.9', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'The reconstruction filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figLpf,
      caption:'At $f_s=2.6W$ the ideal filter (solid) keeps the copy at the origin. A filter that can be built (dashed) falls through the gap before the next copy.'},
    {t:'legend', items:[['mid','$G_\\delta(f)$'],['h','ideal $H(f)$'],['slate','buildable filter',true]]}
  ], right:[
    {t:'eq', label:'Ideal lowpass filter', tex:'H(f)=\\begin{cases}T_s, & |f|\\le W\\\\[2pt] 0, & |f|>f_s-W\\end{cases}',
      note:'Between $W$ and $f_s-W$ the filter may do anything.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Filter gain', html:'Sampling scales the spectrum by $f_s$. A gain of $T_s=1/f_s$ removes the scale. A unit-gain filter returns $f_s$ times the signal.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Transition band', html:'Above the Nyquist rate a gap of $f_s-2W$ opens between $W$ and the next copy. A real filter needs this gap to roll off.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$W=4$ kHz and $f_s=10$ kHz.<div class="nsep"></div>How wide is the transition band?',
        ask:{key:'m1-lpf', choices:['$2$ kHz','$4$ kHz','$6$ kHz'], answer:0,
          why:'The next copy starts at $f_s-W=6$ kHz, so the gap is $6-4=2$ kHz.'}}]}
  ]}
]},

{ id:'m1-lpf-b', module:'M1', nav:'The filter in time', title:'The reconstruction filter in the time domain',
  objective:'Derive the sinc impulse response and fix the sinc convention.',
  keywords:'impulse response sinc inverse fourier rectangle zeros sampling instants convention',
  src:'CH7 s.10', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'The reconstruction filter in the time domain'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSinc,
      caption:'The pulse is one at $t=0$ and zero at every non-zero multiple of $1/(2W)$, which are the sampling instants at the Nyquist rate.'}
  ], right:[
    {t:'eq', label:'Impulse response at f_s = 2W', tex:'\\begin{aligned}h(t)&=\\int_{-W}^{W}\\frac{1}{2W}e^{j2\\pi ft}\\,df\\\\&=\\frac{1}{2W}\\cdot\\frac{e^{j2\\pi Wt}-e^{-j2\\pi Wt}}{j2\\pi t}\\\\&=\\frac{1}{2W}\\cdot\\frac{2j\\sin(2\\pi Wt)}{j2\\pi t}\\\\&=\\frac{\\sin(2\\pi Wt)}{2\\pi Wt}\\\\&=\\operatorname{sinc}(2Wt)\\end{aligned}',
      note:'The gain is $T_s=1/(2W)$. Integrate, then use $e^{jx}-e^{-jx}=2j\\sin x$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'The sinc convention', tex:'\\operatorname{sinc}(x)=\\frac{\\sin(\\pi x)}{\\pi x}'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The message is bandlimited to $W=5$ kHz.<div class="nsep"></div>Where is the first zero of $h(t)$ for $t>0$?',
        ask:{key:'m1-lpf-b', choices:['$50\\ \\mu$s','$100\\ \\mu$s','$200\\ \\mu$s'], answer:1,
          why:'$\\operatorname{sinc}(2Wt)=0$ first at $2Wt=1$, so $t=1/(2W)=100\\ \\mu$s.'}}]}
  ]}
]},

{ id:'m1-interp', module:'M1', nav:'Interpolation', title:'The interpolation formula',
  objective:'Derive the interpolation formula as a sum of shifted sinc pulses.',
  keywords:'interpolation formula sinc shifted samples reconstruction sum convolution',
  src:'CH7 s.11', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'The interpolation formula'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figInterp,
      frames:{labels:['all terms','$n=0$','$n=1$','$n=2$','$n=3$','$n=4$','$n=5$','$n=6$','$n=7$','$n=8$'], ms:250},
      caption:'Each sample scales one sinc pulse. The green sum passes through every sample. Point to a sample, or step through the terms, to lift its pulse.'},
    {t:'legend', items:[['in','$g(nT_s)$'],['mid','$g(nT_s)\\operatorname{sinc}$ terms',true],['out','$g_r(t)$']]}
  ], right:[
    {t:'eq', label:'Filter the impulse train', tex:'\\begin{aligned}g_r(t)&=\\int_{-\\infty}^{\\infty}\\underbrace{\\sum_{n}g(nT_s)\\,\\delta(\\tau-nT_s)}_{g_\\delta(\\tau)}\\,h(t-\\tau)\\,d\\tau\\\\&=\\sum_{n}g(nT_s)\\int_{-\\infty}^{\\infty}h(t-\\tau)\\,\\delta(\\tau-nT_s)\\,d\\tau\\\\&=\\sum_{n}g(nT_s)\\,h(t-nT_s)\\end{aligned}',
      note:'Swap the sum and the integral, then sift each term at $\\tau=nT_s$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', key:true, result:true, label:'Key result · Interpolation formula', tex:'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\operatorname{sinc}\\!\\bigl(2W(t-nT_s)\\bigr)',
        note:'Substitute $h(t)=\\operatorname{sinc}(2Wt)$, the filter at $f_s=2W$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Sampling at the Nyquist rate, evaluate $g_r(t)$ at $t=3T_s$.<div class="nsep"></div>Which terms of the sum are non-zero there?',
        ask:{key:'m1-interp', choices:['Only $n=3$','$n=2,3,4$','Every $n$'], answer:0,
          why:'The term $n$ is $g(nT_s)\\operatorname{sinc}(3-n)$, and $\\operatorname{sinc}$ vanishes at every non-zero integer.'}}]}
  ]}
]},

{ id:'m1-interp-b', module:'M1', nav:'Partial sums', title:'Partial sums of the interpolation formula',
  objective:'Watch the reconstruction converge as terms are added.',
  keywords:'partial sum interpolation truncation sinc terms nyquist rate frames convergence',
  src:'CH7 s.12', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'Partial sums of the interpolation formula'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['samples','$n=4$','$n=3,4,5$','$n=1,\\dots,7$','$n=-6,\\dots,14$']},
      svg:figInterpBuild,
      caption:'Step through the frames. Each new sinc pulse corrects the sum between the samples without moving it at the samples already fitted.'},
    {t:'legend', items:[['in','$g(t)$',true],['mid','sinc terms',true,1,3],['out','partial sum $g_r(t)$',0,1]]}
  ], right:[
    {t:'eq', label:'At the Nyquist rate', tex:'\\begin{aligned}g(t)&=\\sum_{n}g(nT_s)\\operatorname{sinc}\\!\\bigl(2W(t-nT_s)\\bigr)\\\\&=\\sum_{n=-\\infty}^{\\infty}g\\!\\left(\\frac{n}{2W}\\right)\\operatorname{sinc}(2Wt-n)\\end{aligned}',
      note:'Put $T_s=1/(2W)$, so that $2WnT_s=n$.'},
    {t:'note', kind:'ok', head:'Values at the sample times', html:'$h(nT_s)=\\operatorname{sinc}(n)=0$ for $n\\ne0$, so at $t=kT_s$ only $n=k$ survives and $g_r(kT_s)=g(kT_s)$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'A finite sum', html:'A sum over a few samples is exact only at those samples. The error between them shrinks as more terms enter.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Only one sample is non-zero: $g(0)=1$.<div class="nsep"></div>What does the formula reconstruct?',
        ask:{key:'m1-interp-b', choices:['$\\operatorname{sinc}(2Wt)$','A rectangle of width $T_s$','An impulse at $t=0$'], answer:0,
          why:'The sum has one term, $1\\cdot\\operatorname{sinc}(2Wt)$.'}}]}
  ]}
]},

{ id:'m1-ex-nyquist', module:'M1', nav:'Worked example · sampling rates', title:'Worked example: the Nyquist rate and a guard band',
  objective:'Apply the Nyquist rate and add a guard band.',
  keywords:'worked example nyquist rate guard band 40 khz 80 khz 90 khz',
  src:'CH7 s.13', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: the Nyquist rate and a guard band'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$X(f)$','$f_s=2W=80$ kHz','$f_s=90$ kHz'], ms:900},
      svg:v=>{
      const k = v ? v.frame : 2;
      const fs = 80 + 10*Math.max(0, Math.min(1, k-1)), h = Math.max(0, Math.min(1, k));
      const tk = Math.round(fs);
      const a=P.Axes(SZ({xr:[-140,140],yr:[-0.1,1.4],xlabel:'f\\;(\\text{kHz})',ylabel:'X_\\delta(f)',
        xticksOverride:[-tk,-40,40,tk],ytickfmt:()=>''}));
      copy(a,0,40,1,{color:C.mid,width:2.2});
      if(h > 1e-9) for(const c of [-fs,fs]) copy(a,c,40,h,{color:C.mid,width:2.2});
      if(fs - 80 > 1.5) a.span(40,fs-40,0.22,`f_g=${Math.round(fs-80)}`,{tex:true,fs:13,color:C.muted});
      return a.svg(); },
      caption:'Step through the frames. At $f_s=2W=80$ kHz the first copy starts exactly at the message edge $W=40$ kHz. At $90$ kHz it starts at $50$ kHz, leaving a $10$ kHz guard band.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$x(t)$ is bandlimited to $W=40$ kHz.<div class="nsep"></div>Find (a) the Nyquist rate and (b) the rate with a $10$ kHz guard band.',
      ask:{key:'m1-ex-nyquist', q:'Predict (a) first.', choices:['$40$ kHz','$80$ kHz','$90$ kHz'], answer:1,
        why:'The Nyquist rate is $2W=2(40)=80$ kHz. The guard band only enters in (b).'}},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Method', html:'<ol class="steps"><li>The Nyquist rate is $2W$.</li><li>A guard band $f_g$ adds to it: $f_s=2W+f_g$.</li></ol>'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\text{(a)}\\;\\begin{aligned}f_s&=2W\\\\&=2(40)\\\\&=80\\ \\text{kHz}\\end{aligned}\\qquad\\text{(b)}\\;\\begin{aligned}f_s&=2W+f_g\\\\&=80+10\\\\&=90\\ \\text{kHz}\\end{aligned}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Check', html:'At $90$ kHz the first copy spans $f_s-W=50$ to $f_s+W=130$ kHz. The gap from $W=40$ to $50$ kHz is the $10$ kHz guard band.'}]}
  ]}
]},

{ id:'m1-ex-nyquist-b', module:'M1', nav:'Worked example · a modulated signal', title:'Worked example: the rate of a modulated signal',
  objective:'Find the Nyquist rate of a signal after multiplication by a carrier.',
  keywords:'worked example modulation carrier cosine spectrum shift nyquist rate 160 khz sketch',
  src:'CH7 s.14', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: the rate of a modulated signal'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Sketch $Y(f)$ on the axes, then check it.'}, svg:()=>{
      const a=P.Axes(SZ({xr:[-100,100],yr:[-0.1,1.25],xlabel:'f\\;(\\text{kHz})',ylabel:'Y(f)',
        xticksOverride:[-80,-40,0,40,80],ytickfmt:()=>''}));
      a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
      a.poly([[-40,0],[0,1],[40,0]],{color:C.ink,width:1.6,dash:'6 5'});
      a.note(4,1.05,'X(f)',{tex:true,fs:14,color:C.ink});
      a.raw('<g class="sk-key">');
      for(const c of [-40,40]) copy(a,c,40,0.5,{color:C.in,width:2.4});
      a.note(84,0.6,'Y(f)',{tex:true,fs:14,color:C.in,anchor:'end'});
      a.raw('</g>');
      return a.svg(); },
      caption:'The dashed trace is $X(f)$. Draw the two half-height copies, then show the answer.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$y(t)=x(t)\\cos(80000\\pi t)$, with $x$ bandlimited to $40$ kHz.<div class="nsep"></div>Find (c) the Nyquist rate of $y(t)$.',
      ask:{key:'m1-ex-nyquist-b', choices:['$80$ kHz','$120$ kHz','$160$ kHz'], answer:2,
        why:'The carrier at $f_c=40$ kHz moves the band edge to $f_c+W=80$ kHz, so the rate is $2(80)=160$ kHz.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Modulation shifts the spectrum', tex:'\\begin{aligned}y(t)&=x(t)\\cos(2\\pi f_ct)\\\\&=\\tfrac12x(t)\\,e^{j2\\pi f_ct}+\\tfrac12x(t)\\,e^{-j2\\pi f_ct}\\\\Y(f)&=\\tfrac12X(f-f_c)+\\tfrac12X(f+f_c)\\end{aligned}',
        note:'$2\\pi f_ct=80000\\pi t$ gives $f_c=40$ kHz, and $e^{\\pm j2\\pi f_ct}$ shifts by $\\pm f_c$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}f_{\\max}&=f_c+W\\\\&=40+40\\\\&=80\\ \\text{kHz}\\end{aligned}\\qquad\\begin{aligned}f_s&=2f_{\\max}\\\\&=2(80)\\\\&=160\\ \\text{kHz}\\end{aligned}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'The rate $80$ kHz belongs to $x$. Modulation moves the highest frequency to $80$ kHz, so $y$ needs $160$ kHz.'}]}
  ]}
]},

REAL_RECONSTRUCT,

/* ---------------------------------------------------------------- 1.3 ---- */
{ id:'m1-quant', module:'M1', nav:'Quantization', title:'Uniform quantization',
  objective:'Define quantization, the step size and the mid-rise family.',
  keywords:'quantization levels uniform step size midrise decision boundary',
  src:'CH7 s.15', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'Uniform quantization'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:()=>figQuantizer('midrise'),
      caption:'A mid-rise quantizer with $L=8$ and $\\Delta=1$. A boundary sits at the origin, so the output steps through $\\pm\\Delta/2$.'}
  ], right:[
    {t:'note', kind:'def', head:'Quantization', html:'Quantization replaces each sample by the nearest of $L$ <b>representation levels</b>. In a <b>uniform</b> quantizer the levels are equally spaced.'},
    {t:'eq', label:'Step size', tex:'\\Delta=\\frac{2m_{\\max}}{L}',
      note:'$L$ levels share the full range $[-m_{\\max},m_{\\max}]$. For a range $[m_{\\min},m_{\\max}]$, ${\\Delta=(m_{\\max}-m_{\\min})/L}$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Mid-rise', html:'A decision boundary sits at zero. With $L$ even, the levels are $\\pm\\Delta/2,\\pm3\\Delta/2,\\dots$ and none of them is zero.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A mid-rise quantizer has $\\Delta=1$.<div class="nsep"></div>What is the output for $m=0.2$?',
        ask:{key:'m1-quant', choices:['$0$','$0.2$','$0.5$'], answer:2,
          why:'$0.2$ lies in the region $(0,1]$, whose level is its midpoint $0.5$.'}}]}
  ]}
]},

{ id:'m1-quant-b', module:'M1', nav:'Mid-tread', title:'Mid-rise and mid-tread',
  objective:'Separate the two uniform families by what they do at zero.',
  keywords:'midtread midrise zero level small input comparison',
  src:'CH7 s.16', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'Mid-rise and mid-tread'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:()=>figQuantizer('midtread'),
      caption:'A mid-tread quantizer with $\\Delta=1$. A level sits at the origin, and the tread around zero is one step wide.'}
  ], right:[
    {t:'note', kind:'def', head:'Two families', html:'<div class="cmp"><div><span class="cmp-h">Mid-rise</span>A boundary at zero. A small input goes to $\\pm\\Delta/2$.</div><div><span class="cmp-h">Mid-tread</span>A level at zero. A small input goes to exactly $0$.</div></div>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Silence', html:'A mid-rise quantizer turns a silent input with a little noise into a signal of $\\pm\\Delta/2$. A mid-tread quantizer keeps it silent.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A mid-tread quantizer has $\\Delta=1$.<div class="nsep"></div>What is the output for $m=0.2$?',
        ask:{key:'m1-quant-b', choices:['$0$','$0.2$','$0.5$'], answer:0,
          why:'The tread around zero covers $|m|<0.5$, and its level is $0$.'}}]}
  ]}
]},

{ id:'m1-quant-walk', module:'M1', nav:'Sample to level', title:'A sampled signal through the quantizer',
  objective:'Follow each sample from the signal to its level on the staircase.',
  keywords:'quantizer sample level staircase mid-tread input output frames animation',
  src:'CH7 s.16', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'A sampled signal through the quantizer'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      frames:{labels:['$n=1$','$n=2$','$n=3$','$n=4$','$n=5$','$n=6$','$n=7$','$n=8$']},
      svg:figQuantWalk,
      caption:'Step through the samples. Each sample $m(nT_s)$ enters the mid-tread quantizer with $\\Delta=1$ and leaves as the level $v[n]$.'}
  ], right:[
    {t:'note', kind:'def', head:'Sample and quantize', html:'<ol class="steps"><li>Sample: read $m(nT_s)$ off the signal.</li><li>Find the region: the sample lies between two boundaries of the staircase.</li><li>Output: the level of that region, $v[n]=\\mathbb{Q}\\bigl(m(nT_s)\\bigr)$.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Many inputs, one level', html:'Every input between $1.5$ and $2.5$ leaves as $2$. The output keeps the region and loses the exact value.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The same quantizer receives the sample $m(nT_s)=1.62$.<div class="nsep"></div>What is $v[n]$?',
        ask:{key:'m1-quant-walk', choices:['$1$','$1.5$','$2$'], answer:2,
          why:'$1.62$ lies between the boundaries $1.5$ and $2.5$, so it goes to the level $2$.'}}]}
  ]}
]},

{ id:'m1-lloydmax', module:'M1', nav:'Levels and boundaries', title:'The quantizer as a function',
  objective:'State the quantizer function and the two optimality conditions.',
  keywords:'quantizer function regions boundaries lloyd max midpoint centroid gaussian',
  src:'CH7 s.17', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'The quantizer as a function'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figRegions,
      caption:'The best four-level quantizer for a Gaussian input. The steps widen in the tails, where the input is rare. Each boundary $m_k$ lies midway between two levels.'}
  ], right:[
    {t:'eq', label:'Quantizer function', tex:'\\mathbb{Q}(m)=v_k\\quad\\text{for}\\quad m_{k-1}<m\\le m_k',
      note:'The boundaries $m_k$ cut the range into $L$ regions.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Two conditions', html:'<ol class="steps"><li>Each boundary is the midpoint of its two levels: $m_k=\\tfrac12(v_k+v_{k+1})$.</li><li>Each level is the centroid of its region: $v_k=E[M\\mid M\\in\\text{region }k]$.</li></ol>A quantizer that meets both is the Lloyd–Max quantizer.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Uniform input', html:'A uniform quantizer always meets the midpoint condition. For a uniform input it meets the centroid condition too, so it is optimal.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Two neighbouring levels are $v_1=1$ and $v_2=3$.<div class="nsep"></div>Where is the boundary between them?',
        ask:{key:'m1-lloydmax', choices:['$1.5$','$2$','$3$'], answer:1,
          why:'The midpoint condition gives $\\tfrac12(1+3)=2$: every input goes to the nearer level.'}}]}
  ]}
]},

{ id:'m1-overload', module:'M1', nav:'Overload', title:'Overload and granular noise',
  objective:'Choose the range of a quantizer by trading clipped peaks against a coarser step.',
  keywords:'overload clipping granular noise loading range m max gaussian 3 bits optimum 2.34 sigma slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'Overload and granular noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      live:{controls:[{k:'V', label:'$m_{\\max}$', min:0.5, max:4, step:0.05, v:1, show:v=>'$'+v.toFixed(2)+'\\sigma$'}]},
      svg:figOverload,
      caption:'A signal with rare large peaks through a $3$-bit quantizer spanning $[-m_{\\max},m_{\\max}]$. Red marks the clipped peaks. The lower curve is the SQNR of a Gaussian input against the range.'},
    {t:'legend', items:[['in','$m(t)$'],['mid','$\\mathbb{Q}(m(t))$'],['err','clipped']], at:'tc'}
  ], right:[
    {t:'note', kind:'def', head:'Two errors', html:'<div class="cmp"><div><span class="cmp-h">Overload</span>An input beyond $\\pm m_{\\max}$ is clipped to the outer level. Its error has no bound.</div><div><span class="cmp-h">Granular noise</span>Inside the range $|q|\\le\\Delta/2$. A wider range makes $\\Delta$ and this error larger.</div></div>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'The best range', html:'For a Gaussian input and $3$ bits the SQNR peaks at $m_{\\max}=2.34\\sigma$, with $14.27$ dB. A few clipped peaks cost less than a coarser step.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'Set $m_{\\max}$ from the rare peaks of the signal, not from its typical size. At $m_{\\max}=\\sigma$ the SQNR falls to $6.97$ dB.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A $3$-bit quantizer is set to $m_{\\max}=\\sigma$ for a Gaussian input.<div class="nsep"></div>Which error dominates?',
        ask:{key:'m1-overload', choices:['Overload','Granular noise'], answer:0,
          why:'About $32\\%$ of the samples lie outside $\\pm\\sigma$, and each of them is clipped.'}}]}
  ]}
]},

REAL_QUANT,

/* ---------------------------------------------------------------- 1.4 ---- */
{ id:'m1-qnoise', module:'M1', nav:'Quantization noise', title:'Quantization noise',
  objective:'Define the quantization error, bound it and state the uniform model.',
  keywords:'quantization noise error bound half step uniform model',
  src:'CH7 s.18–19', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Quantization noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'m', label:'$m$', min:-2, max:1.99, step:0.01, v:0.7, show:v=>'$'+v.toFixed(2)+'\\,\\Delta$'}]},
      svg:figErrBound,
      caption:'Drag the input $m$. The error is the gap between the line $v=m$ and the staircase. It is largest at a boundary, where it equals $\\Delta/2$.'}
  ], right:[
    {t:'eq', label:'Quantization error', tex:'q=m-\\mathbb{Q}(m)'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'Bound', tex:'\\begin{aligned}|q|&=|m-v_k|\\\\&\\le\\tfrac12(m_k-m_{k-1})\\\\&=\\frac{\\Delta}{2}\\end{aligned}',
        note:'Inside the range, $v_k$ is the midpoint of a region $\\Delta$ wide.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Uniform model', html:'For a small $\\Delta$ the input density is nearly flat across one region. The error is then modelled as $Q\\sim U(-\\Delta/2,\\Delta/2)$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A quantizer has $\\Delta=1.25$ and the input stays inside its range.<div class="nsep"></div>What is the largest error magnitude?',
        ask:{key:'m1-qnoise', choices:['$0.3125$','$0.625$','$1.25$'], answer:1,
          why:'$|q|\\le\\Delta/2=0.625$.'}}]}
  ]}
]},

{ id:'m1-qnoise-b', module:'M1', nav:'Noise power', title:'The power of quantization noise',
  objective:'Derive the mean-square error of a fine quantizer.',
  keywords:'mean square error delta squared over twelve variance uniform error density',
  src:'CH7 s.20', slide:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'The power of quantization noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figErrDensity,
      caption:'The uniform error density, and $q^{2}f_Q(q)$ shaded. The shaded area is the noise power $E[Q^{2}]$.'}
  ], right:[
    {t:'eq', label:'Mean-square error', tex:'\\begin{aligned}E[Q^{2}]&=\\int_{-\\Delta/2}^{\\Delta/2}q^{2}\\,\\frac{1}{\\Delta}\\,dq\\\\&=\\frac{1}{\\Delta}\\left[\\frac{q^{3}}{3}\\right]_{-\\Delta/2}^{\\Delta/2}\\\\&=\\frac{1}{3\\Delta}\\left(\\frac{\\Delta^{3}}{8}+\\frac{\\Delta^{3}}{8}\\right)\\\\&=\\frac{\\Delta^{2}}{12}\\end{aligned}',
      note:'The error density is $f_Q(q)=1/\\Delta$ on $[-\\Delta/2,\\Delta/2]$, and $(-\\Delta/2)^{3}=-\\Delta^{3}/8$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Given', html:'A fine uniform quantizer has $\\Delta=0.5$.<div class="nsep"></div>What is $E[Q^{2}]$?',
        ask:{key:'m1-qnoise-b', choices:['$0.0208$','$0.0417$','$0.125$'], answer:0,
          why:'$\\Delta^{2}/12=0.25/12=0.0208$.'}}]}
  ]}
]},

{ id:'m1-qnoise-c', module:'M1', nav:'Noise power in bits', title:'Quantization noise in bits',
  objective:'Write the noise power of a fine quantizer in terms of the bits a sample.',
  keywords:'noise power bits per sample step size halves quarter 2 to the minus 2R',
  src:'CH7 s.20', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Quantization noise in bits'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$R=1$','$R=2$','$R=3$','$R=4$','$R=5$','$R=6$','$R=7$','$R=8$']},
      svg:figNoiseBits,
      caption:'Step through the bits for a full-scale sinusoid. Each added bit halves $\\Delta$, divides $E[Q^{2}]$ by four, and lifts the SQNR by $10\\log_{10}4=6.02$ dB.'}
  ], right:[
    {t:'eq', label:'In bits', tex:'\\begin{aligned}E[Q^{2}]&=\\frac{\\Delta^{2}}{12}\\\\&=\\frac{1}{12}\\left(\\frac{2m_{\\max}}{2^{R}}\\right)^{2}\\\\&=\\frac{1}{12}\\cdot\\frac{4m_{\\max}^{2}}{2^{2R}}\\\\&=\\frac{m_{\\max}^{2}}{3\\cdot 2^{2R}}\\end{aligned}',
      note:'Substitute $\\Delta=2m_{\\max}/L$ and $L=2^{R}$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'One bit, a quarter', html:'Each extra bit halves $\\Delta$ and divides the noise power by four.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A fine quantizer goes from $R=6$ to $R=7$ bits.<div class="nsep"></div>By what factor does $E[Q^{2}]$ fall?',
        ask:{key:'m1-qnoise-c', choices:['$2$','$4$','$8$'], answer:1,
          why:'$E[Q^{2}]$ is proportional to $2^{-2R}$, and $2^{2}=4$.'}}]}
  ]}
]},

{ id:'m1-sqnr', module:'M1', nav:'Signal-to-noise ratio', title:'Signal-to-quantization-noise ratio',
  objective:'Derive the SQNR of a uniform quantizer and the six-decibel rule.',
  keywords:'sqnr signal to quantization noise ratio decibel six per bit alpha input level slider',
  src:'CH7 s.21–22', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Signal-to-quantization-noise ratio'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'lvl', label:'level', min:-40, max:0, step:5, v:-20, show:v=>'$'+v+'$ dB'}]},
      svg:figSqnr,
      caption:'Drag the input level below full scale. The line keeps its slope of $6.02$ dB a bit and drops by the level.'},
    {t:'legend', items:[['in','full-scale sinusoid'],['mid','at the chosen level']], at:'tl-axis'}
  ], right:[
    {t:'eq', label:'Uniform quantizer', tex:'\\begin{aligned}\\mathrm{SQNR}&=\\frac{P_M}{E[Q^{2}]}\\\\&=\\frac{3P_M}{m_{\\max}^{2}}\\,2^{2R}\\end{aligned}',
      note:'Substitute $E[Q^{2}]=m_{\\max}^{2}/(3\\cdot2^{2R})$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', key:true, result:true, label:'Key result · Six decibels a bit', tex:'\\begin{aligned}\\mathrm{SQNR}\\;[\\mathrm{dB}]&=\\underbrace{10\\log_{10}\\frac{3P_M}{m_{\\max}^{2}}}_{\\alpha}+10\\log_{10}2^{2R}\\\\&=\\alpha+20R\\log_{10}2\\\\&=\\alpha+6.02R\\end{aligned}',
        note:'The log of a product is a sum of logs, and $20\\log_{10}2=6.02$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A quantizer gives $40$ dB at $R=6$.<div class="nsep"></div>What does it give at $R=8$?',
        ask:{key:'m1-sqnr', choices:['$46.02$ dB','$52.04$ dB','$53.33$ dB'], answer:1,
          why:'Two more bits add $2(6.02)=12.04$ dB.'}}]}
  ]}
]},

{ id:'m1-sqnr-def', module:'M1', nav:'SQNR of a variable and of a signal', title:'SQNR of a random variable and of a signal',
  objective:'Define the SQNR as a ratio of two powers, for a random variable and for a signal.',
  keywords:'sqnr definition random variable expectation signal time average limit power ratio window',
  src:'CH7 s.22', slide:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'SQNR of a random variable and of a signal'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'T', label:'$T$', min:1, max:24, step:1, v:6, show:v=>'$'+v+'$ s'},
        {k:'R', label:'$R$', min:1, max:5, step:1, v:3, show:v=>'$'+v+'$ bit'+(v===1?'':'s')}]},
      svg:figSqnrWindow,
      caption:'A sinusoid with Gaussian noise on it, through an $R$-bit quantizer spanning $[-5,5]$. Widen the window $T$. The ratio of the two time averages settles as $T$ grows.'},
    {t:'legend', items:[['in','$m(t)$'],['mid','$\\mathbb{Q}(m(t))$'],['err','$q(t)$']], at:'tc'}
  ], right:[
    {t:'eq', label:'Random variable', tex:'\\mathrm{SQNR}=\\frac{E[M^{2}]}{E\\big[(M-\\mathbb{Q}(M))^{2}\\big]}',
      note:'Quantize the random variable $M$ to $\\mathbb{Q}(M)$. Both powers are expected values.'},
    {t:'eq', label:'Signal', tex:'\\mathrm{SQNR}=\\frac{\\displaystyle\\lim_{T\\to\\infty}\\frac{1}{T}\\int_{-T/2}^{T/2}m^{2}(t)\\,dt}{\\displaystyle\\lim_{T\\to\\infty}\\frac{1}{T}\\int_{-T/2}^{T/2}\\big(m(t)-\\mathbb{Q}(m(t))\\big)^{2}\\,dt}',
      note:'Quantize the signal $m(t)$ to $\\mathbb{Q}(m(t))$. Each limit is a time average over the whole time axis.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'The noisy sinusoid', html:'Here $m(t)=3\\cos t+n(t)$, with $n(t)$ Gaussian of variance $0.36$. As $T\\to\\infty$ the top tends to $P_M=4.5+0.36=4.86$. The uniform error model puts the bottom at $\\Delta^{2}/12$.'}]}
  ]}
]},

{ id:'m1-ex-cos', module:'M1', nav:'Worked example · a sinusoid', title:'Worked example: SQNR of a sinusoid',
  objective:'Find the step size and the SQNR of a full-scale sinusoid at three bits, and check them against the rule.',
  keywords:'worked example sinusoid step size 1.25 power 12.5 sqnr 19.82 db alpha 1.76 measured 19.09 common error',
  src:'CH7 s.23–24', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: SQNR of a sinusoid'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      live:{controls:[{k:'R', label:'$R$', min:1, max:5, step:1, v:3, show:v=>'$'+v+'$ bit'+(v===1?'':'s')}]},
      svg:v=>figQuantError(v),
      caption:'$m(t)=5\\cos t$ through an $R$-bit quantizer spanning $[-5,5]$, and the error below it. The error stays between $-\\Delta/2$ and $\\Delta/2$.'},
    {t:'legend', items:[['in','$m(t)$'],['mid','$\\mathbb{Q}(m(t))$'],['err','$q(t)$']], at:'tc'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$m(t)=5\\cos t$ and a uniform quantizer over its full range, $R=3$.<div class="nsep"></div>Find the step size and the SQNR.',
      ask:{key:'m1-ex-cos', q:'Predict the step size first.', choices:['$0.625$','$1.25$','$2.5$'], answer:1,
        why:'The range $[-5,5]$ is $10$ wide and $R=3$ gives $L=8$ levels, so $\\Delta=10/8=1.25$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}P_M&=\\tfrac12(5)^{2}=12.5\\\\\\Delta&=\\frac{2(5)}{2^{3}}=1.25\\end{aligned}\\qquad\\begin{aligned}E[Q^{2}]&=\\frac{1.25^{2}}{12}=0.1302\\\\\\mathrm{SQNR}&=10\\log_{10}\\frac{12.5}{0.1302}=19.82\\ \\text{dB}\\end{aligned}',
        note:'A sinusoid of peak $A$ has power $A^{2}/2$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Check', html:'The rule gives the same: $\\alpha=10\\log_{10}1.5=1.76$ dB and $1.76+6.02(3)=19.82$ dB. Measured on the waveform the SQNR is $19.09$ dB, since three bits is a coarse quantizer.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $\\Delta=2m_{\\max}/L$, not $m_{\\max}/L$. The full range is $2m_{\\max}=10$ V.'}]}
  ]}
]},

{ id:'m1-ex-unif', module:'M1', nav:'Worked example · a uniform source', title:'Worked example: SQNR of a uniform source',
  objective:'Compute the SQNR of a uniform source from the two powers and see why the model is exact for it.',
  keywords:'worked example uniform distribution 256 levels signal power one third noise power 48.16 db exact model alpha zero',
  src:'CH7 s.25–26', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: SQNR of a uniform source'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figUniformSource,
      caption:'The $256$-level quantizer on $[-1,1]$. At full scale the steps are too fine to see. The inset enlarges the six around the origin.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$M\\sim U(-1,1)$ and a uniform quantizer with $L=256$.<div class="nsep"></div>Find the SQNR.',
      ask:{key:'m1-ex-unif', q:'Predict the step size first.', choices:['$1/256$','$1/128$','$1/64$'], answer:1,
        why:'The range $[-1,1]$ is $2$ wide, so $\\Delta=2/256=1/128$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}P_M&=\\int_{-1}^{1}\\tfrac12m^{2}\\,dm=\\tfrac13\\\\E[Q^{2}]&=\\frac{(1/128)^{2}}{12}=\\frac{1}{196\\,608}\\end{aligned}\\qquad\\begin{aligned}\\mathrm{SQNR}&=\\tfrac13(196\\,608)\\\\&=65\\,536=2^{16}\\\\&=48.16\\ \\text{dB}\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Check', html:'Each region holds a flat piece of the input density, so the error is exactly $U(-\\Delta/2,\\Delta/2)$. The result is $6.02(8)$ dB, so $\\alpha=0$ for this source.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $\\Delta=2/256$, not $1/256$. The range $[-1,1]$ is $2$ wide.'}]}
  ]}
]},

{ id:'m1-ex-gauss', module:'M1', nav:'Worked example · a Gaussian source', title:'Worked example: SQNR of a Gaussian source',
  objective:'Integrate the error of a coarse quantizer on a Gaussian source region by region and compare it with the uniform model.',
  keywords:'worked example gaussian source psd five level quantizer signal power 400 noise power 188.17 sqnr 3.28 db model limit 10.8 db',
  src:'CH7 s.27–28', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: SQNR of a Gaussian source'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figGaussErr,
      caption:'The error integrand $(x-\\mathbb{Q}(x))^{2}f_X(x)$, region by region. The five areas add to the noise power $P_Q=188.17$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'A zero-mean Gaussian source with $S_X(f)=2$ for $|f|<100$ Hz. Five levels $0,\\pm10,\\pm30$, boundaries $\\pm20,\\pm40$.<div class="nsep"></div>Find the SQNR.',
      ask:{key:'m1-ex-gauss', q:'Predict the signal power first.', choices:['$2$','$200$','$400$'], answer:2,
        why:'$P_X=\\int S_X(f)\\,df=2(200)=400$. The value $2$ is the height of $S_X$, not its area.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}P_Q&=\\int_{-20}^{20}x^{2}f_X\\,dx+2\\int_{20}^{40}(x-10)^{2}f_X\\,dx+2\\int_{40}^{\\infty}(x-30)^{2}f_X\\,dx\\\\&=79.50+2(46.36)+2(7.98)=188.17\\\\\\mathrm{SQNR}&=10\\log_{10}\\frac{400}{188.17}=3.28\\ \\text{dB}\\end{aligned}',
        note:'$f_X$ is even, so each side region has a twin. The integrals are evaluated numerically.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'Using $\\Delta^{2}/12=33.3$ gives $10.8$ dB, $7.5$ dB too high. That model holds only for a small $\\Delta$ and an input inside the range.'}]}
  ]}
]},

{ id:'m1-sqnr-sources', module:'M1', nav:'One rule, three sources', title:'One rule, three sources',
  objective:'Compare the SQNR of three sources at full range: the same slope, a different intercept.',
  keywords:'sqnr sources sinusoid uniform gaussian alpha intercept slope six decibels loading four sigma measured slider',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'One rule, three sources'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'R', label:'$R$', min:1, max:10, step:1, v:8, show:v=>'$'+v+'$ bit'+(v===1?'':'s')}]},
      svg:figSqnrSources,
      caption:'The lines are $\\alpha+6.02R$. The dots are measured on each quantized source, up to the $R$ of the slider. The Gaussian dots leave their line at many bits, where the clipped peaks set the error.'},
    {t:'legend', items:[['in','sinusoid'],['slate','uniform'],['in','Gaussian, $\\pm4\\sigma$',true],['mid','measured','dot']], at:'tl-axis'}
  ], right:[
    {t:'note', kind:'def', head:'Same slope', html:'Every source gains $6.02$ dB a bit. The source sets only the intercept, $\\alpha=10\\log_{10}(3P_M/m_{\\max}^{2})$.'},
    {t:'eq', label:'Three intercepts', tex:'\\begin{aligned}\\text{sinusoid: }&\\quad 10\\log_{10}\\frac{3(A^{2}/2)}{A^{2}}=1.76\\ \\text{dB}\\\\\\text{uniform: }&\\quad 10\\log_{10}\\frac{3(1/3)}{1}=0\\ \\text{dB}\\\\\\text{Gaussian, }m_{\\max}=4\\sigma\\text{: }&\\quad 10\\log_{10}\\frac{3\\sigma^{2}}{16\\sigma^{2}}=-7.27\\ \\text{dB}\\end{aligned}'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Peaks cost range', html:'A Gaussian source has rare large peaks. A range wide enough for them leaves most levels unused on typical samples.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Both at $R=8$ bits.<div class="nsep"></div>How far below the sinusoid does the rule put the Gaussian source at $\\pm4\\sigma$?',
        ask:{key:'m1-sqnr-sources', choices:['$1.76$ dB','$7.27$ dB','$9.03$ dB'], answer:2,
          why:'The slopes are equal, so the gap is the gap in $\\alpha$: $1.76-(-7.27)=9.03$ dB.'}}]}
  ]}
]},

{ id:'m1-hear-bits', module:'M1', nav:'Hearing quantization noise', title:'Hearing quantization noise',
  objective:'Listen to speech at a chosen number of bits, and to the quantization error alone.',
  keywords:'listen hear speech quantization noise bits error sound distortion hiss slider audio',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Hearing quantization noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      live:{controls:[{k:'R', label:'$R$', min:1, max:8, step:1, v:3, show:v=>'$'+v+'$ bit'+(v===1?'':'s')}]},
      listen:{items:[
        {label:'speech at $R$ bits', sound:v=>asSound(speechQ(v.R,'u',0).q, 8000)},
        {label:'the error alone', sound:v=>asSound(speechQ(v.R,'u',0).e, 8000)},
        {label:'original', sound:()=>speech('apollo11', 1)}]},
      svg:figHearBits,
      caption:'$25$ ms of speech through an $R$-bit uniform quantizer spanning its peak, and the error below it. Each sound plays at the same loudness.'},
    {t:'legend', items:[['in','$x(t)$'],['mid','$\\mathbb{Q}(x(t))$'],['err','$q(t)$']], at:'tc'}
  ], right:[
    {t:'note', kind:'def', head:'Listen', html:'Play the speech at $R$ bits, then the error alone. At $8$ bits the error is a faint hiss. At $2$ bits it follows the words.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Noise that follows the signal', html:'At a few bits the error moves with the speech. It sounds like distortion, not like hiss, and the uniform error model no longer holds.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Speech sounds clean at $8$ bits.<div class="nsep"></div>How much SQNR does the rule take away at $4$ bits?',
        ask:{key:'m1-hear-bits', choices:['$6.02$ dB','$24.08$ dB','$48.16$ dB'], answer:1,
          why:'Four bits fewer at $6.02$ dB a bit: $4(6.02)=24.08$ dB.'}}]}
  ]}
]},

{ id:'m1-dither', module:'M1', nav:'Dither', title:'Dither',
  objective:'Add a small random signal before the quantizer so that the average output follows the input between the levels.',
  keywords:'dither random noise before quantizer average banding tone distortion grain frames listen',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Dither'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      frames:{labels:['no dither','with dither','the average']},
      listen:{items:[
        {label:'quiet tone, no dither', sound:()=>ditherTone(false)},
        {label:'with dither', sound:()=>ditherTone(true)}]},
      svg:figDither,
      caption:'A slow sinusoid $1.3$ steps high through a quantizer with a unit step. Step through the frames: the staircase, the output with dither, and $64$ dithered outputs averaged. The strips are a grey ramp at four levels.'}
  ], right:[
    {t:'note', kind:'def', head:'Dither', html:'Add a small random signal, about one step wide, before the quantizer. The error then no longer follows the signal.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'The average follows', html:'Each output still sits on a level. Averaged over time, or by the eye over neighbouring pixels, it follows the input between the levels.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The cost', html:'Dither adds noise power. It trades a pattern that the ear or the eye notices for a hiss or a grain that it ignores.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'An input sits $0.3\\Delta$ above a level. The dither is uniform on $[-\\Delta/2,\\Delta/2]$.<div class="nsep"></div>How often is the next level up chosen?',
        ask:{key:'m1-dither', choices:['Never','$30\\%$ of the time','$50\\%$ of the time'], answer:1,
          why:'The boundary is $0.5\\Delta$ up, so the dither must exceed $0.2\\Delta$: a chance of $0.3$. The average output is then $0.3\\Delta$.'}}]}
  ]}
]},

REAL_SQNR,

{ id:'m1-lab-a', module:'M1', nav:'Laboratory {lab} · Quantization and SQNR', title:'Laboratory {lab} · Quantization and SQNR',
  objective:'Let the reader move the level count and the amplitude and watch the error follow.',
  keywords:'laboratory quantization sqnr levels step size amplitude interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Laboratory {lab} · Quantization and SQNR'},
  {t:'lede', text:'Set the number of levels and the input amplitude. Compare the measured SQNR with the prediction $\\alpha+6.02R$.'},
  {t:'lab', id:'A'}
]},

/* ---------------------------------------------------------------- 1.5 ---- */
{ id:'m1-nonuniform', module:'M1', nav:'Non-uniform quantization', title:'Non-uniform quantization',
  objective:'Motivate non-uniform quantization from the statistics of speech.',
  keywords:'non uniform quantization speech small amplitudes relative error companding compressor expander',
  src:'CH7 s.29–30', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Non-uniform quantization'},
  {t:'title', text:'Non-uniform quantization'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSpeechLevels,
      caption:'A sixteen-level $\\mu$-law quantizer. Its steps are fine near zero, where speech amplitudes crowd, and coarse near the peak.'}
  ], right:[
    {t:'note', kind:'def', head:'The problem', html:'Speech is mostly quiet and only sometimes reaches its peak. A uniform step is the same for a whisper and a shout, so the whisper is quantized coarsely in proportion to itself.'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'Relative error', tex:'\\frac{|q|}{|m|}\\le\\frac{\\Delta/2}{|m|}=\\frac{\\Delta}{2|m|}',
        note:'Divide $|q|\\le\\Delta/2$ by $|m|$. Small amplitudes suffer the most.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Companding', html:'Compress the signal with a memoryless curve, quantize uniformly, and expand at the receiver. The name joins <b>com</b>pressing and ex<b>panding</b>.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A uniform quantizer has $\\Delta=0.1$ V. A quiet signal peaks at $0.2$ V.<div class="nsep"></div>How large can the error be, relative to that peak?',
        ask:{key:'m1-nonuniform', choices:['$2.5\\%$','$25\\%$','$50\\%$'], answer:1,
          why:'$(\\Delta/2)/0.2=0.05/0.2=25\\%$.'}}]}
  ]}
]},

{ id:'m1-compander', module:'M1', nav:'The compander', title:'The compander',
  objective:'Build a non-uniform quantizer from a compressor, a uniform quantizer and an expander.',
  keywords:'companding compander compressor expander uniform quantizer gain weak strong inverse curve',
  src:'CH7 s.30', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Non-uniform quantization'},
  {t:'title', text:'The compander'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figCompander,
      caption:'The quantizer in the middle is uniform. Seen from $m$ to $\\hat m$, its steps are fine near zero and coarse near the peak.'}
  ], right:[
    {t:'note', kind:'def', head:'Compressor', html:'A memoryless curve $y=c(m)$. It gives a weak signal a high gain and a strong signal a low gain, so small amplitudes are spread over more quantizer levels.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Expander', html:'The receiver applies the inverse curve $c^{-1}$. It takes away the boost that the compressor gave the weak signal and returns every level to its original size.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Compander', tex:'\\hat m=c^{-1}\\big(Q(c(m))\\big)',
        note:'$Q$ is the uniform quantizer. Near an input $m$, a step $\\Delta$ in $y$ is a step of about $\\Delta/c\'(m)$ in $m$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Near zero the compressor has slope $c\'(0)=4$. The uniform step is $\\Delta=0.1$.<div class="nsep"></div>What input step does a quiet signal see?',
        ask:{key:'m1-compander', choices:['$0.4$','$0.1$','$0.025$'], answer:2,
          why:'$\\Delta/c\'(0)=0.1/4=0.025$. The quiet signal sees a step four times finer than the uniform one.'}}]}
  ]}
]},

{ id:'m1-companding', module:'M1', nav:'A-law and µ-law', title:'A-law and µ-law companding',
  objective:'Give the two companding laws and where each is used.',
  keywords:'mu law a law compander 255 87.6 speech telephony logarithmic',
  src:'CH7 s.31–33', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Non-uniform quantization'},
  {t:'title', text:'A-law and µ-law companding'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figCompanding,
      caption:'A-law (top) and $\\mu$-law (bottom) for three parameter values. The dashed line is no companding. The larger the parameter, the more output range goes to small inputs.'}
  ], right:[
    {t:'eq', label:'µ-law', tex:'y=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}\\operatorname{sgn}(x),\\qquad |x|\\le 1'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'A-law', tex:'y=\\begin{cases}\\dfrac{A|x|}{1+\\ln A}\\operatorname{sgn}(x), & |x|\\le\\dfrac{1}{A}\\\\[8pt] \\dfrac{1+\\ln(A|x|)}{1+\\ln A}\\operatorname{sgn}(x), & \\dfrac{1}{A}<|x|\\le 1\\end{cases}'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'In use', html:'$\\mu$-law ($\\mu=255$): the United States, Canada and Japan. A-law ($A=87.6$): Europe, Türkiye and most other countries.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\mu=255$ and an input $x=0.01$.<div class="nsep"></div>What is the compressed value $y$?',
        ask:{key:'m1-companding', choices:['$0.01$','$0.23$','$0.50$'], answer:1,
          why:'$y=\\ln(3.55)/\\ln(256)=1.267/5.545=0.23$. One per cent of the range is lifted to almost a quarter.'}}]}
  ]}
]},

{ id:'m1-hear-mu', module:'M1', nav:'Hearing companding', title:'Hearing companding',
  objective:'Hear a quiet voice through uniform and mu-law quantizers of the same size.',
  keywords:'listen hear companding mu law uniform quiet voice level six bits sqnr slider audio',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Non-uniform quantization'},
  {t:'title', text:'Hearing companding'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      live:{controls:[{k:'lvl', label:'level', min:-40, max:0, step:5, v:-30, show:v=>'$'+v+'$ dB'}]},
      listen:{items:[
        {label:'uniform, $6$ bits', sound:v=>asSound(speechQ(6,'u',v.lvl).q, 8000)},
        {label:'$\\mu$-law, $6$ bits', sound:v=>asSound(speechQ(6,'mu',v.lvl).q, 8000)}]},
      svg:figHearMu,
      caption:'The same $50$ ms of speech at a level below full scale, through $6$ uniform bits (top) and $6$ $\\mu$-law bits (bottom). The vertical axis follows the voice. Each sound plays at the same loudness.'},
  ], right:[
    {t:'note', kind:'def', head:'Same bits, different steps', html:'Both quantizers use $6$ bits over the same range. The uniform one spends its levels evenly, so a quiet voice meets only a few of them.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Quiet voices stay clear', html:'The $\\mu$-law steps shrink with the voice. Its SQNR hardly changes as the level falls, while the uniform SQNR falls a decibel per decibel.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A talker drops $20$ dB below full scale.<div class="nsep"></div>By how much does the uniform SQNR fall?',
        ask:{key:'m1-hear-mu', choices:['$0$ dB','$6$ dB','$20$ dB'], answer:2,
          why:'The noise power $\\Delta^{2}/12$ stays the same and the signal power falls by $20$ dB.'}}]}
  ]}
]},

REAL_COMPANDING,

/* ---------------------------------------------------------------- 1.6 ---- */
{ id:'m1-encode', module:'M1', nav:'Encoding and bit rate', title:'Encoding and the bit rate',
  objective:'Fix the bit rate relation and contrast natural binary with Gray coding.',
  keywords:'encoding bit rate natural binary gray code adjacent levels one bit 64 kb/s',
  src:'CH7 s.34', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'Encoding and the bit rate'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'R', label:'$R$', min:1, max:4, step:1, v:3, show:v=>'$'+v+'$ bit'+(v===1?'':'s')}]},
      svg:v=>figGrayTable(v),
      caption:'The $2^{R}$ levels in two codes. Adjacent Gray words (green, joined by arcs) differ in one bit. The two natural words either side of the middle differ in all $R$ bits.'}
  ], right:[
    {t:'eq', key:true, result:true, label:'Key result · Bit rate', tex:'R_b=R\\,f_s\\qquad\\left(\\frac{\\text{bits}}{\\text{sample}}\\right)\\left(\\frac{\\text{samples}}{\\text{s}}\\right)'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Two codes', html:'<b>Natural binary</b> numbers the levels $0$ to $L-1$ in order. <b>Gray coding</b> orders the words so that adjacent levels differ in exactly one bit.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Gray-code advantage', html:'A small decision error usually picks a neighbouring level. With a Gray code that costs one bit error, not several.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Telephone speech: $L=256$ levels at $f_s=8$ kHz.<div class="nsep"></div>What is the bit rate?',
        ask:{key:'m1-encode', choices:['$8$ kb/s','$64$ kb/s','$2.048$ Mb/s'], answer:1,
          why:'$R=\\log_2256=8$ bits, so $R_b=8(8000)=64$ kb/s.'}}]}
  ]}
]},

{ id:'m1-linecodes', module:'M1', nav:'Line codes', title:'Line codes',
  objective:'Present the line-code families and the property that separates them.',
  keywords:'line codes unipolar polar nrz rz manchester dc component clock recovery',
  src:'CH7 s.35', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'Line codes'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figLineCodes,
      caption:'Four line codes of the bits $0\\,1\\,1\\,0\\,1\\,0\\,0\\,1$. Each faint line is the zero of its trace.'}
  ], right:[
    {t:'note', kind:'def', head:'Line code', html:'A line code is the rule that turns the bits of a PCM stream into a waveform on the wire.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'DC component', html:'<div class="cmp"><div><span class="cmp-h">Unipolar</span>Levels $0$ and $+A$: a DC component that an AC-coupled stage cannot pass.</div><div><span class="cmp-h">Polar</span>Levels $\\pm A$: balanced data has no DC component.</div></div>'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Clock recovery', html:'A long run of equal NRZ bits has no transitions. Manchester coding puts a transition in every bit, at the cost of twice the bandwidth.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A polar NRZ stream sends a long run of ones.<div class="nsep"></div>Can the receiver recover its clock from that stretch?',
        ask:{key:'m1-linecodes', choices:['Yes','No'], answer:1,
          why:'The waveform stays at $+A$ with no transitions to lock onto.'}}]}
  ]}
]},

{ id:'m1-ex-pcm', module:'M1', nav:'Worked example · PCM encoding', title:'Worked example: PCM encoding of a sinc pulse',
  objective:'Set up one signal for all three stages and find the step size and levels.',
  keywords:'worked example pcm sinc sampling quantizing step size levels',
  src:'CH7 s.36', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: PCM encoding of a sinc pulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figPcmExample,
      caption:'The message (cyan), its samples every $0.6$ s, and the selected levels (violet). Each error is under half a step.'},
    {t:'legend', items:[['in','$m(t)$'],['in','samples $m(nT_s)$','dot'],['mid','levels $\\mathbb{Q}(m(nT_s))$','dot']], at:'tl-axis'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$m(t)=8\\,|\\operatorname{sinc}(t-2)|$, sampled every $T_s=0.6$ s, with an eight-level uniform quantizer over $[0,8]$.<div class="nsep"></div>Find the step size, the code words for $t=0,0.6,\\dots,3.6$, and the bit rate.',
      ask:{key:'m1-ex-pcm', q:'Predict the step size first.', choices:['$0.5$ V','$1$ V','$2$ V'], answer:1,
        why:'The range $[0,8]$ is $8$ wide and there are $8$ levels, so $\\Delta=8/8=1$ V.'}},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Method', html:'<ol class="steps"><li>Take $\\Delta$ from the range and $L$.</li><li>Evaluate each sample.</li><li>Read the tread, then its code word.</li></ol>'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Step and levels', tex:'\\begin{aligned}\\Delta&=\\frac{8-0}{8}=1\\ \\text{V}\\\\v_k&=\\bigl(k+\\tfrac12\\bigr)\\Delta,\\quad k=0,\\dots,7\\\\&=0.5,\\,1.5,\\,\\dots,\\,7.5\\ \\text{V}\\end{aligned}'}]}
  ]}
]},

{ id:'m1-ex-pcm-s', module:'M1', nav:'Worked example · samples and code words', title:'Worked example: samples and code words',
  objective:'Evaluate the samples of the PCM example and read their code words.',
  keywords:'worked example pcm samples sinc levels code words natural binary index',
  src:'CH7 s.36', slide:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: samples and code words'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figPcmExample,
      caption:'Each sample falls in one tread and takes that tread\'s level (violet). Each error is under half a step.'},
    {t:'legend', items:[['in','$m(t)$'],['in','samples $m(nT_s)$','dot'],['mid','levels $\\mathbb{Q}(m(nT_s))$','dot']], at:'tl-axis'}
  ], right:[
    {t:'eq', label:'Samples', tex:'\\begin{array}{c|ccccccc}t&0&0.6&1.2&1.8&2.4&3.0&3.6\\\\t-2&-2&-1.4&-0.8&-0.2&0.4&1&1.6\\\\\\hline m(t)&0&1.73&1.87&7.48&6.05&0&1.51\\end{array}',
        note:'With $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$: $m(0.6)=8\\,|\\sin(1.4\\pi)|/(1.4\\pi)=8(0.951)/4.398=1.73$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Levels and code words', tex:'\\begin{array}{c|ccccccc}v&0.5&1.5&1.5&7.5&6.5&0.5&1.5\\\\k&0&1&1&7&6&0&1\\\\\\hline\\text{code}&000&001&001&111&110&000&001\\end{array}',
        note:'The index is $k=v/\\Delta-\\tfrac12$, written in three bits.'}]}
  ]}
]},

{ id:'m1-ex-pcm-b', module:'M1', nav:'Worked example · bit rate', title:'Worked example: the bit rate of the PCM stream',
  objective:'Finish the PCM example: the bit rate, the bit duration and a check.',
  keywords:'worked example code words bit rate 5 b/s polar nrz check sinc zero',
  src:'CH7 s.36', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: the bit rate of the PCM stream'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figPcmStream,
      caption:'The seven code words as one polar NRZ stream. The amber box steps one bit, $T_b$. The violet box steps one code word, $T_s=3T_b$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'Three bits a sample, one sample every $0.6$ s.<div class="nsep"></div>What is the bit rate?',
      ask:{key:'m1-ex-pcm-b', choices:['$1.8$ b/s','$5$ b/s','$0.6$ b/s'], answer:1,
        why:'$R_b=R/T_s=3/0.6=5$ b/s.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}f_s&=\\frac{1}{T_s}=\\frac{1}{0.6}=1.667\\ \\text{samples/s}\\\\R_b&=R\\,f_s=\\frac{3}{0.6}=5\\ \\text{b/s}\\\\T_b&=\\frac{1}{R_b}=0.2\\ \\text{s}\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Check', html:'At $t=3$ the sample is $8|\\operatorname{sinc}(1)|=0$ exactly, because $\\operatorname{sinc}$ vanishes at every non-zero integer.'}]}
  ]}
]},

{ id:'m1-pcm-bw', module:'M1', nav:'The bandwidth of PCM', title:'The bandwidth of PCM',
  objective:'Give the least bandwidth of a PCM stream and the trade between bits, SQNR and bandwidth.',
  keywords:'pcm bandwidth bit rate half nyquist expansion factor trade sqnr six decibels per bit telephone 32 khz slider',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'The bandwidth of PCM'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      live:{controls:[{k:'R', label:'$R$', min:1, max:12, step:1, v:8, show:v=>'$'+v+'$ bit'+(v===1?'':'s')}]},
      svg:figPcmBw,
      caption:'Top: the message band $W$ (cyan) and the least band of $R$-bit PCM sampled at $2W$ (violet). Bottom: the SQNR of a full-scale sinusoid against that bandwidth.'}
  ], right:[
    {t:'eq', key:true, result:true, label:'Key result · Bandwidth of PCM', tex:'\\begin{aligned}B_T&\\ge\\frac{R_b}{2}=\\frac{R\\,f_s}{2}\\\\B_T&\\ge RW\\quad\\text{at } f_s=2W\\end{aligned}',
      note:'A binary stream of $R_b$ bits a second needs at least $R_b/2$ hertz. Module 2 shows why.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Bits for bandwidth', html:'Each extra bit adds $6.02$ dB of SQNR and $W$ hertz of bandwidth. PCM buys quality with bandwidth.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Telephone PCM: $f_s=8$ kHz and $R=8$ bits.<div class="nsep"></div>What is the least bandwidth?',
        ask:{key:'m1-pcm-bw', choices:['$4$ kHz','$32$ kHz','$64$ kHz'], answer:1,
          why:'$R_b=8(8000)=64$ kb/s, and $B_T\\ge R_b/2=32$ kHz: eight times the $4$ kHz of the voice.'}}]}
  ]}
]},

{ id:'m1-biterror', module:'M1', nav:'Bit errors in PCM', title:'Bit errors in PCM',
  objective:'Show that the damage of a channel bit error depends on the position of the bit.',
  keywords:'bit error pcm most significant bit least significant click position 2 to the b delta natural binary frames listen',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'Bit errors in PCM'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['no error','$b=0$','$b=1$','$b=2$','$b=3$']},
      listen:{items:[
        {label:'errors in the last bit', sound:()=>speechBitErr(0, 0.02)},
        {label:'errors in the first bit', sound:()=>speechBitErr(7, 0.02)}]},
      svg:figBitError,
      caption:'A $4$-bit PCM stream with $\\Delta=0.125$. Step through the frames: one bit $b$ of the code word $1110$ is received wrong. The sounds are $8$-bit speech with one sample in fifty hit in one bit.'}
  ], right:[
    {t:'eq', label:'Size of the error', tex:'\\hat m-m_q=\\pm2^{b}\\Delta',
      note:'Bit $b$ counts from $0$ at the right. The first bit, $b=R-1$, moves the sample by $2^{R-1}\\Delta=m_{\\max}$, half the range.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Clicks', html:'A wrong first bit throws a sample across half the range. The ear hears a click, far louder than the quantization noise.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'An $8$-bit quantizer has $\\Delta=1/128$ V.<div class="nsep"></div>How far does a wrong first bit move a sample?',
        ask:{key:'m1-biterror', choices:['$1/128$ V','$0.5$ V','$1$ V'], answer:2,
          why:'$2^{7}\\Delta=128/128=1$ V, which is $m_{\\max}$.'}}]}
  ]}
]},

{ id:'m1-dpcm', module:'M1', nav:'Differential PCM', title:'Differential PCM',
  objective:'Quantize the difference between a sample and a prediction, which needs fewer bits than the sample.',
  keywords:'dpcm differential pulse code modulation prediction difference correlation fewer bits 32 kb/s encoder decoder frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Differential coding'},
  {t:'title', text:'Differential PCM'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      frames:{labels:['samples $x[n]$','prediction $\\hat x[n-1]$','difference $e[n]$']},
      svg:figDpcm,
      caption:'Step through the frames. Each sample is predicted by the last decoded value (violet dots). The difference, on the same scale below, is far smaller than the sample.'}
  ], right:[
    {t:'note', kind:'def', head:'Predict, then send the difference', html:'Neighbouring samples are close. DPCM quantizes the difference between a sample and its prediction, which has a much smaller range.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Encoder and decoder', tex:'\\begin{aligned}e[n]&=x[n]-\\hat x[n-1]\\\\\\hat x[n]&=\\hat x[n-1]+\\mathbb{Q}\\bigl(e[n]\\bigr)\\end{aligned}',
        note:'The encoder predicts from $\\hat x[n-1]$, the value the decoder also has. So $x[n]-\\hat x[n]=e[n]-\\mathbb{Q}(e[n])$, and errors do not pile up.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Fewer bits', html:'For speech at $8$ kHz, DPCM with $4$ bits a sample matches PCM with $8$. That is $32$ kb/s in place of $64$ kb/s.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'DPCM sends $4$ bits a sample at $f_s=8$ kHz.<div class="nsep"></div>What is the bit rate?',
        ask:{key:'m1-dpcm', choices:['$16$ kb/s','$32$ kb/s','$64$ kb/s'], answer:1,
          why:'$R_b=R\\,f_s=4(8000)=32$ kb/s.'}}]}
  ]}
]},

{ id:'m1-dm', module:'M1', nav:'Delta modulation', title:'Delta modulation',
  objective:'Code with one bit a sample and see the two errors the step size trades.',
  keywords:'delta modulation one bit staircase step size slope overload granular noise oversampling slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Differential coding'},
  {t:'title', text:'Delta modulation'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'D', label:'$\\Delta$', min:0.02, max:0.3, step:0.01, v:0.06, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figDm,
      caption:'A signal with one steep rise, and the staircase that follows it one step a sample. Red shades slope overload. The ticks under the plot are the bits.'},
    {t:'legend', items:[['in','$x[n]$'],['mid','$\\hat x[n]$'],['err','slope overload']], at:'tl-axis'}
  ], right:[
    {t:'note', kind:'def', head:'One bit a sample', html:'Delta modulation is DPCM with a two-level quantizer. Each bit moves the staircase up or down by $\\Delta$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Two errors', html:'<div class="cmp"><div><span class="cmp-h">Slope overload</span>The signal rises faster than $\\Delta$ a sample. The staircase falls behind.</div><div><span class="cmp-h">Granular noise</span>The signal is flat. The staircase hunts by $\\pm\\Delta$ around it.</div></div>'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', side:true, label:'No overload', tex:'\\left|\\frac{dx}{dt}\\right|\\le\\frac{\\Delta}{T_s}=\\Delta f_s',
        note:'The staircase climbs at most $\\Delta$ every $T_s$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$x(t)=\\sin(2\\pi\\,1000\\,t)$ has largest slope $2\\pi(1000)$. The rate is $f_s=64$ kHz.<div class="nsep"></div>Which is the smallest of these steps that avoids overload?',
        ask:{key:'m1-dm', choices:['$0.01$','$0.1$','$1$'], answer:1,
          why:'$\\Delta\\ge2\\pi(1000)/64\\,000=0.098$, and $0.1$ is the smallest choice above it.'}}]}
  ]}
]},

REAL_PCM,

{ id:'m1-lab-b', module:'M1', nav:'Laboratory {lab} · PCM, DPCM and delta modulation', title:'Laboratory {lab} · PCM, DPCM and delta modulation',
  objective:'Compare three waveform coders on the same source at the same bit rate.',
  keywords:'laboratory pcm dpcm delta modulation slope overload granular noise',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'Laboratory {lab} · PCM, DPCM and delta modulation'},
  {t:'lede', text:'PCM codes each sample, DPCM the prediction error, and delta modulation one step up or down. Compare their errors at one bit rate.'},
  {t:'lab', id:'B'}
]},

/* ---------------------------------------------------------------- 1.7 ---- */
{ id:'m1-vq', module:'M1', nav:'Vector quantization', title:'Vector quantization',
  objective:'Show why quantizing a block of samples beats quantizing each one alone.',
  keywords:'vector quantization scalar codebook block pairs smooth signal rate reduction',
  src:'CH7 s.37', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Vector quantization'},
  {t:'title', text:'Vector quantization'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:()=>figPairLattice(16, APP.state.step>=2),
      caption:'All $256$ pairs of a $16$-level quantizer. If neighbours differ by at most one step, only the $46$ shaded pairs occur.'}
  ], right:[
    {t:'note', kind:'def', head:'Vector quantization', html:'Treat $n$ samples as one point in $n$ dimensions and send the nearest point of a <b>codebook</b>. Scalar quantization is the case $n=1$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Every pair', tex:'\\begin{aligned}L^{2}&=16^{2}=256\\ \\text{pairs}\\\\\\log_2 256&=8\\ \\text{bits a pair}\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Pairs that occur', tex:'\\begin{aligned}L+2(L-1)&=3L-2\\\\&=3(16)-2=46\\ \\text{pairs}\\\\\\lceil\\log_2 46\\rceil&=\\lceil 5.52\\rceil=6\\ \\text{bits a pair}\\end{aligned}',
        note:'The diagonal holds $L$ pairs and each side line $L-1$: three bits a sample, not four.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'An $8$-level quantizer, and neighbours that differ by at most one step.<div class="nsep"></div>How many pairs can occur?',
        ask:{key:'m1-vq', choices:['$22$','$24$','$64$'], answer:0,
          why:'$3L-2=3(8)-2=22$: the diagonal and the two lines beside it.'}}]}
  ]}
]},

{ id:'m1-vq-image', module:'M1', nav:'Image quantization', title:'Image quantization',
  objective:'Work the size of a quantized image and name what is lost.',
  keywords:'image quantization bits per pixel kib banding contouring lossy compression',
  src:'CH7 s.37', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Vector quantization'},
  {t:'title', text:'Image quantization'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, svg:figImageQuant,
      live:{controls:[{k:'R', label:'$R$', min:1, max:8, step:1, v:3, show:v=>'$'+v+'$ bit'+(v===1?'':'s')}]},
      caption:'Every pixel through one uniform quantizer. At $8$ bits the picture looks continuous. Below about $5$ bits the sky breaks into flat bands, and at $1$ bit only two greys are left.'}
  ], right:[
    {t:'eq', label:'Bits in a 512 × 512 image', tex:'\\begin{aligned}512^{2}(8)&=2\\,097\\,152\\ \\text{bits}\\\\&=256\\ \\text{KiB}\\end{aligned}\\qquad\\begin{aligned}512^{2}(5)&=1\\,310\\,720\\ \\text{bits}\\\\&=160\\ \\text{KiB}\\end{aligned}',
      note:'One KiB is $8(1024)$ bits, and $32$ levels need $\\log_2 32=5$ bits. The file shrinks by $(256-160)/256=37.5\\%$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'What it costs', tex:'6.02(8-5)=6.02(3)=18.06\\ \\text{dB}',
        note:'Three bits fewer, three times six decibels.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Banding', html:'Coarse levels turn a smooth gradient into flat steps. The eye reads the step edges as contours that the scene never had.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A $256\\times256$ image quantized to $L=64$ levels.<div class="nsep"></div>How large is it?',
        ask:{key:'m1-vq-image', choices:['$48$ KiB','$64$ KiB','$384$ KiB'], answer:0,
          why:'$R=\\log_2 64=6$ bits, so $256^{2}(6)/8=49\\,152$ bytes $=48$ KiB.'}}]}
  ]}
]},

/* ---------------------------------------------------------------- 1.8 ---- */
{ id:'m1-lpc', module:'M1', nav:'Linear predictive coding', title:'Linear predictive coding',
  objective:'Send the settings of a model of the voice in place of its samples.',
  keywords:'lpc linear predictive coding analysis synthesis vocal tract all pole filter pitch voiced unvoiced 2.4 kb/s frames listen',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Speech, audio and image coding'},
  {t:'title', text:'Linear predictive coding'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      frames:{labels:['excitation','vocal-tract filter','speech']},
      listen:{items:[
        {label:'pulse train', sound:()=>asSound(LPC.pulses, 8000)},
        {label:'vowel', sound:()=>asSound(LPC.voiced, 8000)},
        {label:'whisper', sound:()=>asSound(LPC.whisper, 8000)}]},
      svg:figLpc,
      caption:'Step through the frames. A pulse train at $f_0=125$ Hz drives an all-pole filter with three peaks, the formants $F_1,F_2,F_3$. The output is a vowel. Noise through the same filter is a whisper.'}
  ], right:[
    {t:'note', kind:'def', head:'A model, not a waveform', html:'LPC measures a model of the voice every $20$ ms and sends its settings. The receiver runs the model to make the speech again.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'All-pole model', tex:'x_n=\\sum_{i=1}^{p}a_i\\,x_{n-i}+G\\,w_n',
        note:'$w_n$ is a pulse train for a voiced sound and white noise for an unvoiced one. The $a_i$ describe the shape of the vocal tract.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Bit rate', html:'Each frame sends the $a_i$, the gain $G$, the pitch and one voiced bit. That brings speech down to about $2.4$ kb/s, against $64$ kb/s for PCM.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A coder sends $48$ bits for each $20$ ms frame.<div class="nsep"></div>What is its bit rate?',
        ask:{key:'m1-lpc', choices:['$0.96$ kb/s','$2.4$ kb/s','$48$ kb/s'], answer:1,
          why:'$50$ frames a second, so $48(50)=2400$ b/s.'}}]}
  ]}
]},

{ id:'m1-t1', module:'M1', nav:'Time-division multiplexing', title:'Time-division multiplexing and T1',
  objective:'Share one line among 24 PCM calls by giving each a slot in every frame.',
  keywords:'time division multiplexing tdm t1 ds-1 frame 193 bits 1.544 mb/s 24 calls framing bit e1 hierarchy frames',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Speech, audio and image coding'},
  {t:'title', text:'Time-division multiplexing and T1'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      frames:{labels:['$24$ calls','one frame','the line rate']},
      svg:figT1,
      caption:'Step through the frames. Every call is sampled every $125\\ \\mu$s. Its $8$-bit word takes one slot of the frame, after a framing bit F.'}
  ], right:[
    {t:'note', kind:'def', head:'Time-division multiplexing', html:'Many PCM calls share one line by taking turns. Each call gets one slot in every frame, and a frame lasts one sampling interval.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'T1 line rate', tex:'\\begin{aligned}24(8)+1&=193\\ \\text{bits a frame}\\\\193(8000)&=1.544\\ \\text{Mb/s}\\end{aligned}',
        note:'The extra bit marks the start of each frame, so the receiver knows which slot is which.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'A hierarchy', html:'Four T1 lines make a $6.312$ Mb/s line, and seven of those a $44.736$ Mb/s line. Europe and Türkiye use E1: $32$ slots, $2.048$ Mb/s.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Leave out the framing bit.<div class="nsep"></div>What rate do the $24$ calls alone need?',
        ask:{key:'m1-t1', choices:['$1.536$ Mb/s','$1.544$ Mb/s','$2.048$ Mb/s'], answer:0,
          why:'$24(64)=1536$ kb/s. The framing bit adds $8$ kb/s to make $1.544$ Mb/s.'}}]}
  ]}
]},

{ id:'m1-sigmadelta', module:'M1', nav:'Sigma-delta conversion', title:'Oversampling and sigma-delta conversion',
  objective:'Convert with one bit a sample by sampling far above the Nyquist rate and filtering.',
  keywords:'oversampling sigma delta modulator one bit converter cd player 256 times 11.2896 mhz integrator lowpass filter slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Speech, audio and image coding'},
  {t:'title', text:'Oversampling and sigma-delta conversion'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'U', label:'$U$', min:4, max:64, step:4, v:16, show:v=>'$'+v+'\\times$'}]},
      svg:figSigmaDelta,
      caption:'One period of a sinusoid (dashed) oversampled $U$ times. The one-bit output (violet) swings between $\\pm1$, and a lowpass filter averages it back to the signal (green).'},
    {t:'legend', items:[['in','$x(t)$',true],['mid','one-bit output'],['out','after the filter']], at:'tr'}
  ], right:[
    {t:'note', kind:'def', head:'Oversample, then use one bit', html:'At a rate far above $2W$, neighbouring samples are nearly equal. One bit a sample can then carry the change.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Sigma-delta loop', tex:'\\begin{aligned}v[n]&=v[n-1]+x[n]-y[n-1]\\\\y[n]&=\\operatorname{sgn}\\bigl(v[n]\\bigr)\\end{aligned}',
        note:'The integrator $v$ adds up the error, so the running average of the bits $y$ stays on the input.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'The decoder is a filter', html:'A lowpass filter turns the bits back into the signal. The fast swings of the bits lie far above $20$ kHz and are removed.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A CD player oversamples $44.1$ kHz audio by $U=256$.<div class="nsep"></div>At what rate does its one-bit converter run?',
        ask:{key:'m1-sigmadelta', choices:['$2.82$ MHz','$11.29$ MHz','$44.1$ MHz'], answer:1,
          why:'$256(44.1\\text{ kHz})=11.2896$ MHz.'}}]}
  ]}
]},

{ id:'m1-jpeg', module:'M1', nav:'Transform coding and JPEG', title:'Transform coding and JPEG',
  objective:'Quantize the cosine transform of each image block, so that most coefficients become zero.',
  keywords:'jpeg transform coding discrete cosine transform dct 8 by 8 blocks quantization table zigzag blocking quality slider',
  slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Speech, audio and image coding'},
  {t:'title', text:'Transform coding and JPEG'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      live:{controls:[{k:'q', label:'quality', min:5, max:95, step:5, v:25, show:v=>'$'+v+'$'}]},
      svg:figJpeg,
      caption:'A drawn picture of $128\\times128$ pixels and its JPEG version. Lower the quality: more coefficients become zero, and the $8\\times8$ blocks begin to show.'}
  ], right:[
    {t:'note', kind:'def', head:'Transform coding', html:'JPEG cuts the picture into $8\\times8$ blocks and takes the discrete cosine transform of each. Most of the energy of a block lands in a few low-frequency coefficients.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Quantize the coefficients', html:'Each coefficient has its own uniform step, larger at high frequencies. Most high-frequency coefficients round to zero and cost almost nothing to send.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Blocking', html:'At a coarse step each block keeps little more than its average. The picture breaks into visible $8\\times8$ squares.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A $512\\times512$ picture is coded at $0.5$ bit a pixel.<div class="nsep"></div>How large is the file?',
        ask:{key:'m1-jpeg', choices:['$16$ KiB','$128$ KiB','$256$ KiB'], answer:0,
          why:'$512^{2}(0.5)/8=16\\,384$ bytes $=16$ KiB, sixteen times less than at $8$ bits a pixel.'}}]}
  ]}
]},

/* ---- laboratories and code pages, placed by 89_sections.js ---- */
{ id:'m1-lab-l', module:'M1', nav:'Laboratory {lab} · Sampling and aliasing', title:'Laboratory {lab} · Sampling and aliasing',
  objective:'Move a tone past half the sampling rate and watch it fold back.',
  keywords:'laboratory sampling aliasing nyquist rate apparent frequency tone spectrum replicas interactive', slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Laboratory {lab} · Sampling and aliasing'},
  {t:'lede', text:'Set the tone and the sampling rate. Predict the frequency the samples show before you read it.'},
  {t:'lab', id:'L'}
]},
{ id:'m1-lab-m', module:'M1', nav:'Laboratory {lab} · Reconstruction from samples', title:'Laboratory {lab} · Reconstruction from samples',
  objective:'Compare sinc interpolation with a hold, and see the error appear below the Nyquist rate.',
  keywords:'laboratory reconstruction sinc interpolation zero order hold truncation error interactive', slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'Laboratory {lab} · Reconstruction from samples'},
  {t:'lede', text:'Rebuild the message from its samples with sinc pulses or with a hold. Compare the error at each rate.'},
  {t:'lab', id:'M'}
]},
{ id:'m1-lab-n', module:'M1', nav:'Laboratory {lab} · The quantizer', title:'Laboratory {lab} · The quantizer',
  objective:'Read the region, the level and the error of one input on a uniform quantizer.',
  keywords:'laboratory quantizer staircase midrise midtread levels boundaries step error interactive', slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'Laboratory {lab} · The quantizer'},
  {t:'lede', text:'Choose the level count and the quantizer type. Move the input and read its region, level and error.'},
  {t:'lab', id:'N'}
]},
{ id:'m1-lab-o', module:'M1', nav:'Laboratory {lab} · Companding', title:'Laboratory {lab} · Companding',
  objective:'Show how mu-law companding holds the SQNR steady as the input level falls.',
  keywords:'laboratory companding mu law uniform sqnr input level dynamic range interactive', slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Non-uniform quantization'},
  {t:'title', text:'Laboratory {lab} · Companding'},
  {t:'lede', text:'Lower the input level and compare the SQNR of a uniform quantizer with a mu-law quantizer of the same size.'},
  {t:'lab', id:'O'}
]},
{ id:'m1-code-sampling', module:'M1', nav:'Code · Sampling', title:'Sampling in code',
  objective:'Sample a tone, compute the Nyquist rate and the alias frequency, and see the replicas in a spectrum.',
  keywords:'code matlab python program run sampling nyquist alias frequency spectrum',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 1 · Sampling in code'},
  {t:'title', text:'Sampling in code'},
  {t:'raw', html:()=>CODEBANK.page('m1-code-sampling')}
]},
{ id:'m1-code-reconstruct', module:'M1', nav:'Code · Reconstruction', title:'Reconstruction in code',
  objective:'Rebuild a message from its samples with a sum of sinc pulses and measure the error.',
  keywords:'code matlab python program run reconstruction sinc interpolation hold',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction in code'},
  {t:'title', text:'Reconstruction in code'},
  {t:'raw', html:()=>CODEBANK.page('m1-code-reconstruct')}
]},
{ id:'m1-code-quant', module:'M1', nav:'Code · Quantization', title:'Quantization in code',
  objective:'Build a uniform quantizer and apply it to a sampled signal.',
  keywords:'code matlab python program run quantizer midrise midtread levels',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization in code'},
  {t:'title', text:'Quantization in code'},
  {t:'raw', html:()=>CODEBANK.page('m1-code-quant')}
]},
{ id:'m1-code-sqnr', module:'M1', nav:'Code · SQNR', title:'SQNR in code',
  objective:'Measure the quantization noise and the SQNR of a sinusoid, a uniform source and a Gaussian source.',
  keywords:'code matlab python program run sqnr quantization noise six decibels per bit',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise in code'},
  {t:'title', text:'SQNR in code'},
  {t:'raw', html:()=>CODEBANK.page('m1-code-sqnr')}
]},
{ id:'m1-code-companding', module:'M1', nav:'Code · Companding', title:'Companding in code',
  objective:'Compress with mu-law and A-law, and compare the SQNR with a uniform quantizer.',
  keywords:'code matlab python program run mu law a law compressor',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 1 · Non-uniform quantization in code'},
  {t:'title', text:'Companding in code'},
  {t:'raw', html:()=>CODEBANK.page('m1-code-companding')}
]},
{ id:'m1-code-pcm', module:'M1', nav:'Code · PCM', title:'PCM in code',
  objective:'Sample, quantize and encode a signal into a PCM bit stream.',
  keywords:'code matlab python program run pcm encoding bit rate gray code line code',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation in code'},
  {t:'title', text:'PCM in code'},
  {t:'raw', html:()=>CODEBANK.page('m1-code-pcm')}
]},

/* ---------------------------------------------------------------- 1.9 ---- */
{ id:'m1-chain', module:'M1', nav:'From sound to bits', title:'From sound to bits',
  objective:'Follow one signal through the whole chain: filter, sampler, quantizer, encoder.',
  keywords:'chain analog to digital converter anti aliasing lowpass filter sampler quantizer encoder bits review frames listen',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Summary'},
  {t:'title', text:'From sound to bits'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true,
      frames:{labels:['sound','filtered','sampled','quantized','bits']},
      listen:{items:[
        {label:'speech, $8$ bits', sound:()=>asSound(speechQ(8,'u',0).q, 8000)},
        {label:'speech, $3$ bits', sound:()=>asSound(speechQ(3,'u',0).q, 8000)}]},
      svg:figChain,
      caption:'Step through the stages. The filter removes the fast ripple and the sampler keeps one value every $T_s$. The quantizer moves it to one of eight levels, and the encoder writes three bits.'}
  ], right:[
    {t:'note', kind:'def', head:'Four stages', html:'<ol class="steps"><li>Filter the signal to the band $W$.</li><li>Sample at $f_s\\ge 2W$.</li><li>Quantize to $L=2^{R}$ levels.</li><li>Write $R$ bits a sample.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Quantization error', html:'Filtering and sampling at $f_s\\ge2W$ keep everything inside the band. Only the quantizer adds an error that no receiver can remove.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A recording is sampled at $16$ kHz with $12$ bits a sample.<div class="nsep"></div>What is the bit rate?',
        ask:{key:'m1-chain', choices:['$16$ kb/s','$192$ kb/s','$384$ kb/s'], answer:1,
          why:'$R_b=R\\,f_s=12(16\\,000)=192$ kb/s.'}}]}
  ]}
]},

{ id:'m1-quick', module:'M1', nav:'Quick check', title:'Quick check',
  objective:'Check the module ideas with eight short predictions.',
  keywords:'quick check predict alias nyquist rate sinc bits sqnr step size mu law gray code levels',
  budget:'a set of eight prediction cards. The questions carry no figure',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Quick check'},
  {t:'title', text:'Quick check'},
  {t:'grid', cols:4, gap:'22px 20px', style:'flex:1;grid-auto-rows:1fr;padding-bottom:8px', items:[
    [{t:'note', kind:'def', head:'Aliasing', html:'A $7$ kHz tone sampled at $10$ kHz appears at',
      ask:{key:'m1-qc0', choices:['$3$ kHz','$7$ kHz','$17$ kHz'], answer:0,
        why:'$7>f_s/2=5$, so it folds to $|7-10|=3$ kHz.'}}],
    [{t:'note', kind:'def', head:'Nyquist rate', html:'Audio bandlimited to $20$ kHz has the Nyquist rate',
      ask:{key:'m1-qc1', choices:['$20$ kHz','$40$ kHz','$44.1$ kHz'], answer:1,
        why:'$2W=40$ kHz. CD audio samples a little above it.'}}],
    [{t:'note', kind:'def', head:'The sinc convention', html:'$\\operatorname{sinc}(2)$ equals',
      ask:{key:'m1-qc2', choices:['$0$','$1$','$1/(2\\pi)$'], answer:0,
        why:'$\\sin(2\\pi)/(2\\pi)=0$: sinc vanishes at every non-zero integer.'}}],
    [{t:'note', kind:'def', head:'Bits and SQNR', html:'Two more bits a sample raise the SQNR by about',
      ask:{key:'m1-qc3', choices:['$4$ dB','$6$ dB','$12$ dB'], answer:2,
        why:'$6.02$ dB a bit, so $12.04$ dB for two.'}}],
    [{t:'note', kind:'def', head:'Step size', html:'Doubling $\\Delta$ multiplies $E[Q^{2}]$ by',
      ask:{key:'m1-qc4', choices:['$2$','$4$','$1/2$'], answer:1,
        why:'$E[Q^{2}]=\\Delta^{2}/12$ grows with the square of the step.'}}],
    [{t:'note', kind:'def', head:'Companding', html:'$\\mu$-law companding gives finer steps to',
      ask:{key:'m1-qc5', choices:['small amplitudes','large amplitudes'], answer:0,
        why:'The compressor is steep near zero, so small inputs spread over many levels.'}}],
    [{t:'note', kind:'def', head:'Gray code', html:'Two adjacent Gray code words differ in',
      ask:{key:'m1-qc6', choices:['one bit','up to $R$ bits'], answer:0,
        why:'That is the rule that defines the code.'}}],
    [{t:'note', kind:'def', head:'Levels', html:'A $16$-bit quantizer has how many levels?',
      ask:{key:'m1-qc7', choices:['$16$','$256$','$65\\,536$'], answer:2,
        why:'$L=2^{16}=65\\,536$.'}}]
  ]}
]},

{ id:'m1-synth', module:'M1', nav:'Summary', title:'Module 1 summary',
  objective:'Collect the results this module contributes to the rest of the course.',
  keywords:'summary sampling quantization pcm results bit rate sqnr recall',
  dark:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 1 · Summary'},
  {t:'title', text:'Module 1 summary'},
  /* Twelve results as prompts, in the order of the module: the student answers
     each one aloud, then opens the card. The sketch on each card is the
     picture to remember. */
  {t:'raw', html:()=>RECALL.deck('m1', [
    {q:'What does sampling do to the spectrum?', glyph:G.replicas,
     a:'$G_\\delta(f)=f_s\\sum_n G(f-nf_s)$: a copy at every multiple of $f_s$, scaled by $f_s$.'},
    {q:'What is the lowest safe sampling rate?', glyph:G.nyquist,
     a:'The <b>Nyquist rate</b> $2W$. Below it the copies overlap and alias.'},
    {q:'What filter turns the samples back into the signal?', glyph:G.sinc,
     a:'An ideal lowpass filter with gain $T_s$. At $f_s=2W$ its impulse response is $\\operatorname{sinc}(2Wt)$.'},
    {q:'How is $g(t)$ written in terms of its samples?', glyph:G.interp,
     a:'$g(t)=\\sum_n g(nT_s)\\operatorname{sinc}\\bigl(2W(t-nT_s)\\bigr)$, exact at every $t$.'},
    {q:'Mid-rise or mid-tread: which has a level at zero?', glyph:G.stair,
     a:'<b>Mid-tread.</b> Mid-rise has a boundary at zero and outputs $\\pm\\Delta/2$ there.'},
    {q:'What is the power of the quantization noise?', glyph:G.errbox,
     a:'$E[Q^{2}]=\\Delta^{2}/12$, with $\\Delta=2m_{\\max}/L$, for a fine quantizer.'},
    {q:'What does one more bit buy?', glyph:G.sqnr,
     a:'$6.02$ dB: $\\mathrm{SQNR}=\\alpha+6.02R$, and $\\alpha=1.76$ dB for a full-scale sinusoid.'},
    {q:'Why compand?', glyph:G.compand,
     a:'Small amplitudes are common. Finer steps near zero keep the SQNR steady as the level falls.'},
    {q:'What bit rate does PCM need?', glyph:G.pcm,
     a:'$R_b=R\\,f_s$. Telephone speech: $8(8000)=64$ kb/s.'},
    {q:'Why use a Gray code?', glyph:G.gray,
     a:'Adjacent levels differ in one bit, so a small decision error costs one bit error.'},
    {q:'What bandwidth does PCM need?', glyph:G.bw,
     a:'$B_T\\ge R_b/2$, which is $RW$ at $f_s=2W$. Each extra bit adds $6.02$ dB and $W$ hertz.'},
    {q:'What do DPCM and delta modulation send?', glyph:G.dm,
     a:'The difference from a prediction. Delta modulation sends one bit a sample and needs $\\Delta f_s$ above the largest slope.'}
  ], {cols:2})},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Method', html:'<span style="color:var(--graphite)">Check a rate against $2W$ before sampling. Take $\\Delta$ from the full range $2m_{\\max}$. Compute the SQNR from the two powers and compare it with $\\alpha+6.02R$. Module 2 sends the resulting bits over a channel.</span>'}]}
]},

/* Four optional projects for students who want to try the module on their own
   computer. They carry no grade and no code: each card gives an aim, what it
   practises, a few steps and what to look for. The briefs state no numerical
   answer, so they need no line in verify/. */
{ id:'m1-projects', module:'M1', nav:'Projects to try', title:'Projects to try',
  objective:'Offer four optional projects that use the module on real and computed signals.',
  keywords:'projects matlab python aliasing decimation reconstruction sinc hold bit depth sqnr mu-law companding recording',
  dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Projects'},
  {t:'title', text:'Projects to try'},
  {t:'raw', html:()=>PROJECTS.deck('m1', [
    {title:'Hear aliasing in a recording', glyph:G.alias,
     aim:'Lower the sampling rate of a recording and hear what aliasing does to it.',
     learn:['The Nyquist rate $2W$ of a real signal.',
            'Aliasing: a tone above $f_s/2$ returns at a lower frequency.',
            'Why a lowpass filter comes before the sampler.'],
     steps:['Record a few seconds of music or speech at $f_s=44.1$ kHz.',
            'Keep every 4th sample and play the result at $f_s/4$. Then keep every 8th sample.',
            'Repeat, but first remove everything above the new $f_s/2$ with a lowpass filter.',
            'Do the same with a tone that sweeps from 0 to 10 kHz, and plot the spectrum of each version.'],
     look:'Without the filter, high notes come back as new low notes that were never played. With the filter, the sound is only duller. The swept tone climbs, turns and falls, again and again.'},
    {title:'Rebuild a tone from its samples', glyph:G.interp,
     aim:'Rebuild a signal from its samples in two ways and measure how close each one gets.',
     learn:['The interpolation formula $g(t)=\\sum_n g(nT_s)\\operatorname{sinc}\\bigl(2W(t-nT_s)\\bigr)$, with $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$.',
            'The zero-order hold, which keeps each sample until the next one.',
            'The error of a finite sum of sinc terms.'],
     steps:['Sample $g(t)=\\cos(2\\pi\\,3t)$ at $f_s=8$ Hz on $0\\le t\\le 4$ s.',
            'Rebuild $g(t)$ on a fine grid with the sinc sum. Rebuild it again with a zero-order hold.',
            'Plot both against the true $g(t)$, and plot the error of each.',
            'Repeat with $f_s=6.5$ Hz and with $f_s=5$ Hz.'],
     look:'The sinc sum is close in the middle and worse near the two ends, where terms are missing. The hold lags by half a sample. At $f_s=5$ Hz both rebuild a different tone.'},
    {title:'Take bits away from a song', glyph:G.sqnr,
     aim:'Quantize a recording with fewer and fewer bits and compare the measured SQNR with the rule.',
     learn:['A uniform quantizer with $L=2^R$ levels and $\\Delta=2m_{\\max}/L$.',
            'The SQNR measured from the signal power and the error power.',
            'When the model of the error as uniform noise fails.'],
     steps:['Scale a recording so that $|x|\\le m_{\\max}$. Quantize it with $R=12,8,6,4,2$ bits.',
            'For each $R$, compute the error $q=x_q-x$ and the SQNR $=10\\log_{10}\\bigl(\\overline{x^{2}}/\\overline{q^{2}}\\bigr)$.',
            'Plot SQNR against $R$ and draw the line $\\alpha+6.02R$ over it.',
            'Listen to $x_q$ and to $q$ alone for each $R$.'],
     look:'The points follow a straight line for large $R$ and leave it for small $R$. There the error sounds like the music, not like a hiss. $\\alpha$ is lower than for a full-scale sinusoid.'},
    {title:'Keep a quiet voice clear', glyph:G.compand,
     aim:'Compare a uniform quantizer with a $\\mu$-law quantizer as the input level falls.',
     learn:['The $\\mu$-law compressor and its inverse, the expander.',
            'SQNR against input level for both quantizers.',
            'Why speech and telephony use companding.'],
     steps:['Record a sentence and scale its peak to $m_{\\max}$. Make copies scaled down by 10, 20, 30 and 40 dB.',
            'Quantize each copy with 8 bits: once uniformly, once through the compressor with $\\mu=255$, then the expander.',
            'Compute the SQNR of every version and plot it against the input level.',
            'Listen to the quietest copy in both versions.'],
     look:'The uniform curve falls by about the same number of dB as the input. The $\\mu$-law curve stays nearly flat, so the quiet copy keeps most of its SQNR.'}
  ])}
]}

];

/* ---- the interpolation figure comes alive -------------------------------
   A slow roll call lifts each sample's sinc in turn, so the crowd of dashed
   terms reads as nine individuals rather than a blur. Pointing at a sample
   pins its sinc; on a touch screen a tap pins it and a second tap on the
   same sample releases it. Leaving the figure lets the roll call continue.
   The state lives here, not in the SVG, because the scene is re-rendered on
   every step and theme change and the figure string is rebuilt from scratch.
   The roll call defers to the course's own motion switch (body[data-motion]),
   which is initialised from prefers-reduced-motion; the pointer interaction
   stays live either way. Previous and Next under the figure step through the
   terms by hand: the figure then carries the chosen term in data-man, the
   roll call stops, and releasing a pointer pin returns to that term. */
const SP = { n:null, held:false, i:-1 };
const spRoot  = () => document.querySelector('svg.sincpick');
function spApply(sv){
  if(!sv) return;
  const n = SP.held || sv.dataset.man==null ? SP.n : +sv.dataset.man;
  sv.classList.toggle('pick', n!=null);
  sv.querySelectorAll('[data-st]').forEach(el=>
    el.classList.toggle('on', el.dataset.st===String(n)));
}
setInterval(()=>{
  if(document.hidden || SP.held) return;
  if(document.body.dataset.motion==='reduced') return;
  const sv = spRoot();
  if(!sv){ SP.n=null; SP.i=-1; return; }
  if(sv.dataset.man!=null) return;
  SP.i=(SP.i+1)%9; SP.n=SP.i; spApply(sv);
}, 1700);
document.addEventListener('pointerover', e=>{
  if(e.pointerType!=='mouse' || !(e.target instanceof Element)) return;
  const d = e.target.closest('svg.sincpick .st-dot');
  if(!d) return;
  SP.held=true; SP.n=+d.dataset.st; spApply(spRoot());
});
document.addEventListener('pointerout', e=>{
  if(!SP.held || e.pointerType!=='mouse' || !(e.target instanceof Element)) return;
  const sv = e.target.closest('svg.sincpick');
  if(sv && !(e.relatedTarget instanceof Element && sv.contains(e.relatedTarget))){
    SP.held=false;      /* the roll call takes over on its next tick */
    if(sv.dataset.man!=null) spApply(sv); }
});
document.addEventListener('click', e=>{
  /* a mouse pins by pointing; its click must not immediately release the pin */
  if(e.pointerType==='mouse' || !(e.target instanceof Element)) return;
  const d = e.target.closest('svg.sincpick .st-dot');
  if(!d) return;
  const n=+d.dataset.st;
  if(SP.held && SP.n===n){ SP.held=false; SP.n=null; }
  else { SP.held=true; SP.n=n; }
  spApply(spRoot());
});

window.SCENES_M1 = SC;
})();
