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

/* Sampling is a product of two signals, so it is drawn as three panels on one
   time axis: the message, the train that multiplies it, and the product. The
   panels share w, xr and pad.l, so a sample instant sits at the same place in
   all three and the reader can read straight down a column. */
function figSamplingStack(){
  const Ts = 1.0, N = 10;
  const common = {w:600, xr:[-0.4,10.4], xtarget:6, pad:{l:52,r:26,t:24,b:16}};
  const mute = f => Object.assign({}, common, f);
  const a = P.Axes(mute({h:128, yr:[-1.45,1.55], ylabel:'g(t)', ytarget:4}));
  a.curve(g,{color:C.in});
  /* Every impulse of the train has weight one: it only marks the instants. */
  const b = P.Axes(mute({h:100, yr:[-0.45,1.60], ylabel:'p(t)', ytarget:2}));
  for(let n=0;n<=N;n++) b.impulse(n*Ts, 1, {color:C.h, label:false});
  b.span(4*Ts, 5*Ts, 1.28, 'T_s', {tex:true, fs:13, color:C.h});
  /* The message is repeated as a dashed line, because the height of each
     impulse is read off it. */
  const c = P.Axes(mute({h:150, yr:[-1.45,1.55], xlabel:'t',
    ylabel:'g_\\delta(t)=g(t)\\,p(t)', ytarget:4, pad:{l:52,r:26,t:24,b:16}}));
  c.curve(g,{color:C.in, width:1.4, dash:'4 6', opacity:0.55});
  for(let n=0;n<=N;n++) c.impulse(n*Ts, g(n*Ts), {color:C.mid, label:false});
  return a.svg() + b.svg() + c.svg();
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
    ylabel:'G_\\delta(f),\\;H(f)', xtarget:8, xtickfmt:wfmt, ytickfmt:()=>''}));
  for(let n=-2;n<=2;n++) copy(a, n*fs, W, fs, {color:C.mid, width:2.2});
  a.poly([[-4.2,0],[-e,0],[-W,top],[W,top],[e,0],[4.2,0]], {color:C.h, width:1.5, dash:'6 5'});
  a.poly([[-4.2,0],[-W,0],[-W,top],[W,top],[W,0],[4.2,0]], {color:C.h, width:2.4});
  a.note(-W-0.42, 0.92*top, 'H(f)', {tex:true, fs:14, color:C.h, anchor:'end'});
  a.span(W, e, 1.24*fs, '\\text{transition band}', {tex:true, fs:12, color:C.muted});
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
function figInterp(){
  const Ts = 1;                     /* T_s = 1 s and 2W = 1, so the picture reads directly */
  const a = P.Axes(SZ({xr:[-0.4,8.4], yr:[-1.5,1.7], xlabel:'t', ylabel:'g(t),\\;g_r(t)',
    pad:{l:50,r:26,t:24,b:42}, xtarget:6, ytarget:4}));
  for(let n=0;n<=8;n++){
    a.raw(`<g class="st" data-st="${n}">`);
    a.curve(t=>g(n*Ts)*sinc((t-n*Ts)/Ts), {color:C.mid, width:1.1, opacity:0.55, dash:'3 3'});
    for(let k=0;k<=8;k++) if(k!==n)
      a.raw(`<circle class="st-z" cx="${a.sx(k*Ts).toFixed(2)}" cy="${a.sy(0).toFixed(2)}"
        r="3" fill="none" stroke="${C.mid}" stroke-width="1.5"/>`);
    a.raw('</g>');
  }
  a.curve(t=>{ let s=0; for(let n=-6;n<=14;n++) s += g(n*Ts)*sinc((t-n*Ts)/Ts); return s; },
          {color:C.out, width:2.6});
  for(let n=0;n<=8;n++){
    a.raw(`<g class="st-dot" data-st="${n}">`);
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
    a.raw(`<g class="st-eq" data-st="${n}">`);
    a.note(0.15, 1.45,
      `g(${n})\\,\\operatorname{sinc}(${arg})\\approx ${P.fmt(g(n*Ts),2)}\\,\\operatorname{sinc}(${arg})`,
      {tex:true, fs:13, color:C.mid});
    a.raw('</g>');
  }
  a.raw('<g class="sp-note">');
  a.note(0.15, 1.45, '\\text{one shifted }\\operatorname{sinc}\\text{ per sample}', {tex:true, fs:13, color:C.mid});
  a.raw('</g>');
  return a.svg().replace('<svg ','<svg class="sincpick" ');
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
  const a = P.Axes(SZ({xr:[-0.4,8.4], yr:[-1.5,1.7], xlabel:'t', ylabel:'g(t),\\;g_r(t)',
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
  const {b, v} = lloydMax(4);
  const a = P.Axes(SZ({xr:[-3.2,3.2], yr:[-0.06,0.52], xlabel:'m', ylabel:'f_M(m)',
    xtarget:7, ytarget:3}));
  for(let k=0;k<4;k++) if(k%2===0)
    a.area(phi, Math.max(-3.2,b[k]), Math.min(3.2,b[k+1]), {color:C.dec.in});
  a.curve(phi, {color:C.in, width:2.3});
  for(let k=1;k<4;k++){ a.vline(b[k], {color:C.muted, dash:'4 4'});
    a.note(b[k]+0.07, 0.47, `m_{${k}}`, {tex:true, fs:14, color:C.muted}); }
  v.forEach((x,k)=>{ a.point(x, 0, {color:C.mid, r:5});
    a.note(x, 0.035, `v_{${k+1}}`, {tex:true, fs:14, color:C.mid, anchor:'middle'}); });
  return a.svg();
}

function figQuantError(){
  const L = 8, mmax = 5, D = 2*mmax/L;
  const q = m => Math.max(-mmax+D/2, Math.min(mmax-D/2, (Math.floor(m/D)+0.5)*D));
  const m = t => mmax*Math.cos(t);
  const a = P.Axes({w:600,h:230,xr:[0,2*Math.PI],yr:[-6,6.4],
    xlabel:'t',ylabel:'m(t),\\;\\mathbb{Q}(m(t))',pad:{l:54,r:26,t:24,b:40},
    xtarget:5,ytarget:4});
  a.curve(m,{color:C.in});
  const pts=[]; for(let i=0;i<=900;i++){ const t=2*Math.PI*i/900; pts.push([t,q(m(t))]); }
  a.poly(pts,{color:C.mid,width:2.0});
  const b = P.Axes({w:600,h:170,xr:[0,2*Math.PI],yr:[-D,D],
    xlabel:'t',ylabel:'q(t)',pad:{l:54,r:26,t:26,b:40},
    xtarget:5,ytarget:3});
  b.hline(D/2,{color:C.err,dash:'4 4'}); b.hline(-D/2,{color:C.err,dash:'4 4'});
  b.curve(t=>m(t)-q(m(t)),{color:C.err,width:1.7,n:1400});
  b.note(0.12, 0.72*D, '+\\Delta/2', {tex:true,fs:13,color:C.err});
  return a.svg() + b.svg();
}

/* The error of a fine quantizer as a density: flat at 1/Delta across one
   step. Its second moment is the area under q^2 f_Q(q), shaded. */
function figErrDensity(){
  const a = P.Axes(SZ({xr:[-0.9,0.9], yr:[-0.14,1.4], xlabel:'q', ylabel:'f_Q(q)',
    xticksOverride:[-0.5,0,0.5], xtickfmt:x=>x<0?'\u2212\u0394/2':x>0?'\u0394/2':'0',
    yticksOverride:[]}));
  a.rect(-0.5, 0, 0.5, 1, {fill:C.dec.err, stroke:C.err, width:2});
  a.area(q=>q*q, -0.5, 0.5, {color:C.dec.err});
  const pts=[]; for(let i=0;i<=200;i++){ const q=-0.5+i/200; pts.push([q,q*q]); }
  a.poly(pts, {color:C.err, width:2});
  a.note(0.54, 1.1, 'f_Q(q)=1/\\Delta', {tex:true, fs:14, color:C.err});
  a.note(0.3, 0.42, 'q^{2}f_Q(q)', {tex:true, fs:14, color:C.err});
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

/* The sinusoid of the worked example through its three-bit quantizer. */
function figCosQuant(){
  const L = 8, mmax = 5, D = 2*mmax/L;
  const q = m => Math.max(-mmax+D/2, Math.min(mmax-D/2, (Math.floor(m/D)+0.5)*D));
  const a = P.Axes(SZ({xr:[0,2*Math.PI], yr:[-6,6.6], xlabel:'t', ylabel:'m(t),\\;\\mathbb{Q}(m(t))',
    pad:{l:60,r:26,t:24,b:42}, xtarget:5, ytarget:5}));
  for(let k=0;k<L;k++) a.hline(-mmax+(k+0.5)*D, {color:C.rule, dash:'2 5', opacity:0.9});
  a.curve(t=>mmax*Math.cos(t), {color:C.in});
  const pts=[]; for(let i=0;i<=1200;i++){ const t=2*Math.PI*i/1200; pts.push([t,q(mmax*Math.cos(t))]); }
  a.poly(pts, {color:C.mid, width:2.2});
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
function figMeasured(){
  const a = P.Axes(SZ({xr:[1.5,8.5], yr:[5,55], xlabel:'R\\;(\\text{bits per sample})',
    ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})', pad:{l:62,r:26,t:24,b:46}, xtarget:7, ytarget:5}));
  a.curve(R=>ALPHA_SINE+6.02*R, {color:C.in, width:2, dash:'6 5'});
  for(let R=2;R<=8;R++) a.point(R, sqnrMeasured(R), {color:C.mid, r:5});
  return a.svg();
}

/* The uniform source and its quantizer regions. The example has 256 levels;
   sixteen are drawn so that a region is wide enough to see. */
function figUniformSource(){
  const L = 16, D = 2/L;
  const a = P.Axes(SZ({xr:[-1.3,1.3], yr:[-0.08,0.72], xlabel:'m', ylabel:'f_M(m)',
    xtarget:6, ytarget:3}));
  for(let k=1;k<L;k++) a.vline(-1+k*D, {color:C.rule, dash:'2 4', opacity:0.9});
  a.poly([[-1.3,0],[-1,0],[-1,0.5],[1,0.5],[1,0],[1.3,0]], {color:C.in, width:2.4});
  for(let k=0;k<L;k++) a.point(-1+(k+0.5)*D, 0, {color:C.mid, r:3.4});
  a.note(0.5, 0.57, 'f_M(m)=\\tfrac12', {tex:true, fs:14, color:C.in, anchor:'middle'});
  return a.svg();
}

/* The five-level quantizer of the Gaussian example: boundaries and outputs as
   the scene states them. */
const GQ_EDGES  = [-Infinity, -40, -20, 20, 40, Infinity];
const GQ_LEVELS = [-30, -10, 0, 10, 30];
const gdens = x => Math.exp(-x*x/800)/Math.sqrt(2*Math.PI*400);
const gq = x => { for(let k=0;k<5;k++) if(x<=GQ_EDGES[k+1]) return GQ_LEVELS[k]; return 30; };
function figGaussQ(){
  const a = P.Axes(SZ({xr:[-75,75], yr:[-0.0015,0.024], xlabel:'x', ylabel:'f_X(x)',
    xticksOverride:[-40,-20,0,20,40], ytarget:3, ytickfmt:()=>''}));
  a.curve(gdens, {color:C.in, width:2.3});
  for(const e of [-40,-20,20,40]) a.vline(e, {color:C.muted, dash:'4 4'});
  GQ_LEVELS.forEach(v=>a.point(v, 0, {color:C.mid, r:5}));
  a.note(-72, 0.0215, '\\sigma_X=20', {tex:true, fs:14, color:C.in});
  return a.svg();
}
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

/* Where speech amplitudes fall, and where two quantizers of the same size put
   their boundaries: a uniform one in the upper row, a mu-law one below it. */
function figSpeechLevels(){
  const b = 0.12, L = 16;
  const a = P.Axes(SZ({xr:[-1.05,1.5], yr:[-1.4,4.6], xlabel:'x/x_{\\max}', ylabel:'f_X(x)',
    xticksOverride:[-1,-0.5,0,0.5,1], yticksOverride:[0,2,4]}));
  a.curve(x=>Math.exp(-Math.abs(x)/b)/(2*b), {color:C.in, width:2.3, n:1200});
  const row = (y, xs, col) => xs.forEach(x=>a.poly([[x,y-0.18],[x,y+0.18]], {color:col, width:1.6}));
  const uni = [], mu = [];
  for(let k=0;k<=L;k++){ const y=-1+2*k/L; uni.push(y); mu.push(muinv(y)); }
  row(-0.45, uni, C.muted); row(-1.05, mu, C.mid);
  a.note(1.1, -0.45, '\\text{uniform}', {tex:true, fs:13, color:C.muted});
  a.note(1.1, -1.05, '\\mu\\text{-law}', {tex:true, fs:13, color:C.mid});
  return a.svg();
}

function figCompanding(){
  const a = P.Axes(SZ({xr:[-1,1], yr:[-1,1], xlabel:'x/x_{\\max}', ylabel:'y',
    xtarget:4, ytarget:4}));
  a.curve(x=>x, {color:C.muted, width:1.3, dash:'4 4'});
  a.curve(mulaw, {color:C.in, width:2.4, n:1600});
  a.curve(alaw, {color:C.h, width:2.4, dash:'6 4', n:1600});
  a.note(-0.95, 0.86, '\\mu\\text{-law},\\ \\mu=255', {tex:true, fs:14, color:C.in});
  a.note(-0.95, 0.66, 'A\\text{-law},\\ A=87.6', {tex:true, fs:14, color:C.h});
  return a.svg();
}

function figGrayTable(){
  const rows = [['0','000','000'],['1','001','001'],['2','010','011'],['3','011','010'],
                ['4','100','110'],['5','101','111'],['6','110','101'],['7','111','100']];
  const a = P.Axes(SZ({xr:[0,3], yr:[-0.6,8.2], pad:{l:20,r:16,t:22,b:24},
    grid:false, zeroAxes:false, arrows:false, xticksOverride:[], yticksOverride:[]}));
  ['level','natural','Gray'].forEach((h,i)=>a.note(0.5+i, 7.6, h, {fs:15, color:C.muted, anchor:'middle', weight:600}));
  rows.forEach((r,k)=>{ const y = 6.7 - k*0.9;
    r.forEach((cell,i)=>a.note(0.5+i, y, cell, {fs:16, color:i===2?C.out:C.ink, anchor:'middle'})); });
  /* the one pair where natural binary changes all three bits */
  a.rect(1.12, 6.7-3*0.9-0.42, 1.88, 6.7-4*0.9+0.52, {stroke:C.err, width:1.4, dash:'4 3'});
  return a.svg();
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
  for(let k=1;k<8;k++) a.vline(k, {color:C.rule, dash:'2 4', opacity:0.9});
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
   bracket. */
const PCM_WORDS = ['000','001','001','111','110','000','001'];
function figPcmStream(){
  const bits = PCM_WORDS.join('').split('').map(Number), N = bits.length;
  /* The time marks are written under the stream rather than on the zero
     line, where a polar waveform would run through them. */
  const a = P.Axes(SZ({xr:[0,N], yr:[-1.9,2.3], xlabel:'t\\;(\\mathrm{s})', ylabel:'\\text{polar NRZ}',
    xticksOverride:[], yticksOverride:[-1,1]}));
  for(let k=3;k<N;k+=3) a.vline(k, {color:C.rule, dash:'3 4', opacity:0.9});
  for(let k=0;k<=N;k+=3) a.note(k, -1.55, P.fmt(0.2*k,1), {fs:13, color:C.muted, anchor:'middle'});
  const pts=[]; bits.forEach((b,k)=>{ const y=b?1:-1; pts.push([k,y],[k+1,y]); });
  a.poly(pts, {color:C.in, width:2.2});
  PCM_WORDS.forEach((w,i)=>a.note(3*i+1.5, 1.85, w, {fs:14, color:C.mid, anchor:'middle', weight:600}));
  a.span(0, 1, 1.3, 'T_b', {tex:true, fs:13, color:C.muted});
  return a.svg();
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

/* A gallery of four everyday cases closing a section: the figures in a 2×2
   grid, and the cards beside them revealed one at a time. */
function realGallery(cfg){
  return { id:cfg.id, module:'M1', nav:cfg.nav, title:cfg.title, src:cfg.src,
    objective:cfg.objective, keywords:cfg.keywords,
    budget:cfg.budget||'a gallery of four everyday cases; each figure is one example',
    slide:true, steps:cfg.notes.length-1, blocks:[
    {t:'eyebrow', text:cfg.eyebrow},
    {t:'title', text:cfg.title},
    {t:'cols', ratio:'c-8-4', fill:true, left:[
      {t:'grid', cols:2, gap:'18px 22px', items:cfg.figs.map(([svg,cap])=>
        [{t:'fig', frame:true, svg, caption:cap}])}
    ], right:cfg.notes.map((n,i)=>i ? {t:'reveal', at:i, items:[n]} : n)}
  ]};
}

/* ---- the galleries ------------------------------------------------------ */
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
    {t:'note', kind:'warn', head:'Hold droop', html:'The hold weights the spectrum by $\\operatorname{sinc}(f/f_s)$. At $f_s/2$ that is $2/\\pi$, a loss of $3.92$ dB.'}
  ]});

const REAL_QUANT = realGallery({ id:'m1-real-quant', nav:'Quantizers around us',
  title:'Quantizers around us', eyebrow:'Module 1 · Quantization', src:'CH7 s.16',
  objective:'Recognise uniform quantizers in displays and converters.',
  keywords:'examples thermometer display adc 10 bit 3.3 V step kitchen scale mid tread grey levels colour depth',
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
    [()=>{ const a=P.Axes(EXO({xr:[0,16],yr:[0,1],xlabel:'\\text{level}',ylabel:'',xticksOverride:[0,4,8,12,16],yticksOverride:[],grid:false}));
      for(let k=0;k<16;k++){ const v=Math.round(255*k/15); a.rect(k,0.12,k+1,0.88,{fill:`rgb(${v},${v},${v})`,stroke:C.rule,width:1}); }
      return a.svg(); }, 'Sixteen grey levels are drawn here. Eight bits a colour give $256$ levels, and three colours give $256^{3}=16\\,777\\,216$.']
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
      return a.svg(); }, 'Two $8$-bit quantizers on a sinusoid. The $\\mu$-law SQNR stays nearly flat as the level falls; the uniform one falls a decibel per decibel.'],
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

/* ---- the opening and the summary on navy ---------------------------------
   The page under these figures is navy, so the axis, the tick numbers and the
   axis names are drawn in the ink of that page, and the signals in the
   dark-page tints. */
const NAVY = {axis:'rgba(239,231,216,.34)', tick:'#9EACB9', name:'#E6E2D9'};
function figOpenTrace(){
  const a = P.Axes({w:520,h:215,xr:[0,10],yr:[-1.45,1.45],grid:false,
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
  return a.svg();
}
/* The same message sampled every half second and rounded to a step of 0.25:
   the stems rise one by one, each to its quantized height. */
function figOpenStems(){
  const a = P.Axes({w:520,h:215,xr:[0,10],yr:[-1.45,1.45],grid:false,
    xlabel:'n', ylabel:'\\mathbb{Q}(g(nT_s))', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3});
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
                 +ln('M4 40 H90',AX,1))
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
    {t:'grid', cols:1, gap:'24px', items:[
      [{t:'fig', svg:figOpenTrace}],
      [{t:'fig', svg:figOpenStems}]
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 1.1 ---- */
{ id:'m1-sampler', module:'M1', nav:'Impulse-train sampling', title:'Impulse-train sampling',
  objective:'Define the ideal sampled signal and reduce it to a weighted impulse train.',
  keywords:'impulse train sampling period sifting property ideal sampled signal',
  src:'CH7 s.4', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Impulse-train sampling'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, svg:figSamplingStack, caption:'The message, the train and their product on one time axis. Each impulse carries the sample value at its own time.'}
  ], right:[
    {t:'eq', label:'Impulse train', tex:'p(t)=\\sum_{n=-\\infty}^{\\infty}\\delta(t-nT_s),\\qquad f_s=\\frac{1}{T_s}'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Sampled signal', tex:'\\begin{aligned}g_\\delta(t)&=g(t)\\,p(t)\\\\&=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\,\\delta(t-nT_s)\\end{aligned}',
        note:'Sifting: $g(t)\\delta(t-t_0)=g(t_0)\\delta(t-t_0)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'A continuous-time signal', html:'$g_\\delta(t)$ is not a list of numbers. It is a train of weighted impulses, so it has a Fourier transform.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A sampler takes one sample every $T_s=125\\ \\mu$s.<div class="nsep"></div>What is the sampling rate?',
        ask:{key:'m1-sampler', choices:['$125$ Hz','$8$ kHz','$80$ kHz'], answer:1,
          why:'$f_s=1/T_s=1/(125\\times10^{-6})=8000$ Hz.'}}]}
  ]}
]},

{ id:'m1-spectrum', module:'M1', nav:'The sampled spectrum', title:'Sampling replicates the spectrum',
  objective:'Derive the replication result that every later statement rests on.',
  keywords:'fourier transform replication convolution impulse train spectrum',
  src:'CH7 s.5–6', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Sampling replicates the spectrum'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, svg:figSpectrumPair, caption:'The message spectrum, and the spectrum after sampling at $f_s=3W$. A scaled copy sits at every multiple of $f_s$.'}
  ], right:[
    {t:'eq', label:'Product in time', tex:'G_\\delta(f)=G(f)*P(f)',
      note:'A product in time is a convolution in frequency.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Transform of the train', tex:'P(f)=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)',
        note:'Every Fourier-series coefficient of $p(t)$ is $1/T_s$, by the sifting property.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, result:true, label:'Key result · Spectrum replicas', tex:'G_\\delta(f)=f_s\\sum_{n=-\\infty}^{\\infty}G(f-nf_s)'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$G(f)=0$ for $|f|\\ge 4$ kHz, and $f_s=10$ kHz.<div class="nsep"></div>Where does the copy centred at $f_s$ begin?',
        ask:{key:'m1-spectrum', choices:['$4$ kHz','$6$ kHz','$10$ kHz'], answer:1,
          why:'The copy $G(f-f_s)$ occupies $f_s-W<f<f_s+W$, so it starts at $10-4=6$ kHz.'}}]}
  ]}
]},

{ id:'m1-spectrum-b', module:'M1', nav:'One copy per impulse', title:'One copy per impulse',
  objective:'Show that convolving with one shifted impulse shifts the spectrum.',
  keywords:'convolution shifted impulse sifting copy scale factor fs replicas frames',
  src:'CH7 s.6', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'One copy per impulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$G(f)$','$f_s\\,G(f)$','$n=\\pm1$','$n=\\pm2$']},
      svg:figSpectrumBuild,
      caption:'Step through the frames. The message spectrum is scaled by $f_s$, then one copy is added for each pair of impulses at $\\pm nf_s$.'}
  ], right:[
    {t:'eq', label:'Convolution with one impulse', tex:'\\begin{aligned}G(f)*\\delta(f-nf_s)&=\\int_{-\\infty}^{\\infty}G(\\theta)\\,\\delta(f-nf_s-\\theta)\\,d\\theta\\\\&=G(f-nf_s)\\end{aligned}',
      note:'The impulse is even, so the sifting property picks $\\theta=f-nf_s$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Scale factor', html:'The impulses of $P(f)$ have weight $1/T_s=f_s$. Every copy is therefore $f_s$ times the message spectrum.'}]},
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

{ id:'m1-theorem', module:'M1', nav:'The sampling theorem', title:'The sampling theorem',
  objective:'State the theorem and the rate and interval it fixes.',
  keywords:'sampling theorem nyquist rate nyquist interval bandlimited statement',
  src:'CH7 s.12', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'The sampling theorem'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:()=>figCaseAt(2),
      caption:'At $f_s=2W$ the copies touch without overlap. A lower rate causes overlap; a higher rate leaves a gap.'}
  ], right:[
    {t:'note', kind:'def', head:'Sampling theorem', html:'If $G(f)=0$ for $|f|\\ge W$ and $f_s\\ge 2W$, the samples $g(nT_s)$ determine $g(t)$ exactly. For a lowpass signal, $W$ is also the highest frequency.'},
    {t:'reveal', at:1, items:[
      {t:'eq', key:true, result:true, label:'Key result · Nyquist rate', tex:'f_s^{\\min}=2W'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', side:true, label:'Nyquist interval', tex:'T_s^{\\max}=\\frac{1}{2W}',
        note:'The longest spacing between samples that still works.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Telephone speech is bandlimited to $W=3.4$ kHz.<div class="nsep"></div>What is the longest sampling interval?',
        ask:{key:'m1-theorem', choices:['$73.5\\ \\mu$s','$147\\ \\mu$s','$294\\ \\mu$s'], answer:1,
          why:'$T_s^{\\max}=1/(2W)=1/(6.8\\text{ kHz})=147\\ \\mu$s.'}}]}
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
      caption:'At $f_s=2.6W$ the ideal filter (solid) keeps the copy at the origin. A filter that can be built (dashed) falls through the gap before the next copy.'}
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

{ id:'m1-lpf-b', module:'M1', nav:'The filter in time', title:'The reconstruction filter in time',
  objective:'Derive the sinc impulse response and fix the sinc convention.',
  keywords:'impulse response sinc inverse fourier rectangle zeros sampling instants convention',
  src:'CH7 s.10', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'The reconstruction filter in time'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSinc,
      caption:'The pulse is one at $t=0$ and zero at every non-zero multiple of $1/(2W)$, which are the sampling instants at the Nyquist rate.'}
  ], right:[
    {t:'eq', label:'Impulse response at f_s = 2W', tex:'\\begin{aligned}h(t)&=\\int_{-W}^{W}\\frac{1}{2W}e^{j2\\pi ft}\\,df\\\\&=\\frac{\\sin(2\\pi Wt)}{2\\pi Wt}=\\operatorname{sinc}(2Wt)\\end{aligned}'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'The sinc convention', tex:'\\operatorname{sinc}(x)=\\frac{\\sin(\\pi x)}{\\pi x}',
        note:'One at $x=0$, zero at every other integer.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Zeros at the samples', html:'$h(nT_s)=\\operatorname{sinc}(n)=0$ for every $n\\ne0$ when $T_s=1/(2W)$. Each pulse is invisible at the other sampling instants.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The message is bandlimited to $W=5$ kHz.<div class="nsep"></div>Where is the first zero of $h(t)$ for $t>0$?',
        ask:{key:'m1-lpf-b', choices:['$50\\ \\mu$s','$100\\ \\mu$s','$200\\ \\mu$s'], answer:1,
          why:'$\\operatorname{sinc}(2Wt)=0$ first at $2Wt=1$, so $t=1/(2W)=100\\ \\mu$s.'}}]}
  ]}
]},

{ id:'m1-interp', module:'M1', nav:'Interpolation', title:'The interpolation formula',
  objective:'Derive the interpolation formula as a sum of shifted sinc pulses.',
  keywords:'interpolation formula sinc shifted samples reconstruction sum convolution',
  src:'CH7 s.11', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'The interpolation formula'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figInterp,
      caption:'Each sample scales one sinc pulse. The green sum passes through every sample. Point to a sample to lift its pulse.'}
  ], right:[
    {t:'eq', label:'Filter the impulse train', tex:'g_r(t)=\\int_{-\\infty}^{\\infty}\\underbrace{\\sum_{n}g(nT_s)\\,\\delta(\\tau-nT_s)}_{g_\\delta(\\tau)}\\,h(t-\\tau)\\,d\\tau'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Sift each impulse', tex:'g_r(t)=\\sum_{n}g(nT_s)\\underbrace{\\int_{-\\infty}^{\\infty}h(t-\\tau)\\,\\delta(\\tau-nT_s)\\,d\\tau}_{h(t-nT_s)}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, result:true, label:'Key result · Interpolation formula', tex:'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\operatorname{sinc}\\!\\bigl(2W(t-nT_s)\\bigr)'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Sampling at the Nyquist rate, evaluate $g_r(t)$ at $t=3T_s$.<div class="nsep"></div>Which terms of the sum are non-zero there?',
        ask:{key:'m1-interp', choices:['Only $n=3$','$n=2,3,4$','Every $n$'], answer:0,
          why:'The term $n$ is $g(nT_s)\\operatorname{sinc}(3-n)$, and $\\operatorname{sinc}$ vanishes at every non-zero integer.'}}]}
  ]}
]},

{ id:'m1-interp-b', module:'M1', nav:'Building the sum', title:'Building the interpolation sum',
  objective:'Watch the reconstruction converge as terms are added.',
  keywords:'partial sum interpolation truncation sinc terms nyquist rate frames convergence',
  src:'CH7 s.12', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'Building the interpolation sum'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['samples','$n=4$','$n=3,4,5$','$n=1,\\dots,7$','$n=-6,\\dots,14$']},
      svg:figInterpBuild,
      caption:'Step through the frames. Each new sinc pulse corrects the sum between the samples without moving it at the samples already fitted.'}
  ], right:[
    {t:'eq', label:'At the Nyquist rate', tex:'g(t)=\\sum_{n=-\\infty}^{\\infty}g\\!\\left(\\frac{n}{2W}\\right)\\operatorname{sinc}(2Wt-n)'},
    {t:'note', kind:'ok', head:'Values at the sample times', html:'At $t=kT_s$ every term but $n=k$ is zero, so $g_r(kT_s)=g(kT_s)$. Between the samples all the terms contribute.'},
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
    {t:'fig', frame:true, grow:true, svg:()=>{
      const a=P.Axes(SZ({xr:[-140,140],yr:[-0.1,1.4],xlabel:'f\\;(\\text{kHz})',ylabel:'X_\\delta(f)',
        xticksOverride:[-90,-40,40,90],ytickfmt:()=>''}));
      for(const c of [-90,0,90]) copy(a,c,40,1,{color:C.mid,width:2.2});
      a.span(40,50,0.22,'f_g=10',{tex:true,fs:13,color:C.muted});
      return a.svg(); },
      caption:'$W=40$ kHz sampled at $90$ kHz. The first copy starts at $50$ kHz, $10$ kHz above the message edge.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$x(t)$ is bandlimited to $W=40$ kHz.<div class="nsep"></div>Find (a) the Nyquist rate and (b) the rate with a $10$ kHz guard band.',
      ask:{key:'m1-ex-nyquist', q:'Predict (a) first.', choices:['$40$ kHz','$80$ kHz','$90$ kHz'], answer:1}},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Method', html:'<ol class="steps"><li>The Nyquist rate is $2W$.</li><li>A guard band $f_g$ adds to it: $f_s=2W+f_g$.</li></ol>'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Solution', html:'(a) $f_s=2(40)=80$ kHz. (b) $f_s=80+10=90$ kHz.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Check', html:'At $90$ kHz the first copy spans $50$ to $130$ kHz. The gap from $40$ to $50$ kHz is the $10$ kHz guard band.'}]}
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
      ask:{key:'m1-ex-nyquist-b', choices:['$80$ kHz','$120$ kHz','$160$ kHz'], answer:2}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Modulation shifts the spectrum', tex:'Y(f)=\\tfrac12X(f-40\\text{k})+\\tfrac12X(f+40\\text{k})',
        note:'The carrier is $\\cos(2\\pi f_ct)$ with $f_c=40$ kHz.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Solution', html:'The highest frequency of $y$ is $f_c+W=80$ kHz, so its Nyquist rate is $2(80)=160$ kHz.'}]},
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
      note:'$L$ levels share the full range $[-m_{\\max},m_{\\max}]$.'},
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

{ id:'m1-lloydmax', module:'M1', nav:'Levels and boundaries', title:'The quantizer as a function',
  objective:'State the quantizer function and the two optimality conditions.',
  keywords:'quantizer function regions boundaries lloyd max midpoint centroid gaussian',
  src:'CH7 s.17', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'The quantizer as a function'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figRegions,
      caption:'The best four-level quantizer for a Gaussian input. Each boundary $m_k$ lies midway between two levels; each level $v_k$ is the centroid of its region.'}
  ], right:[
    {t:'eq', label:'Quantizer function', tex:'\\mathbb{Q}(m)=v_k\\quad\\text{for}\\quad m_{k-1}<m\\le m_k',
      note:'The boundaries $m_k$ cut the range into $L$ regions.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Two conditions', html:'<ol class="steps"><li>Each boundary is the midpoint of its two levels: $m_k=\\tfrac12(v_k+v_{k+1})$.</li><li>Each level is the centroid of its region: $v_k=E[M\\mid M\\in\\text{region }k]$.</li></ol>'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Uniform input', html:'A uniform quantizer always meets the midpoint condition. For a uniform input it meets the centroid condition too, so it is optimal.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Two neighbouring levels are $v_1=1$ and $v_2=3$.<div class="nsep"></div>Where is the boundary between them?',
        ask:{key:'m1-lloydmax', choices:['$1.5$','$2$','$3$'], answer:1,
          why:'The midpoint condition gives $\\tfrac12(1+3)=2$: every input goes to the nearer level.'}}]}
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
    {t:'fig', frame:true, svg:figQuantError,
      caption:'A sinusoid of amplitude $5$ through an eight-level quantizer, $\\Delta=1.25$. The error stays between $-\\Delta/2$ and $\\Delta/2$.'}
  ], right:[
    {t:'eq', label:'Quantization error', tex:'q=m-\\mathbb{Q}(m)'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'Bound', tex:'|q|\\le\\frac{\\Delta}{2}',
        note:'Every input goes to the nearer level.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Uniform model', html:'For a small $\\Delta$ the input density is nearly flat across one region. The error is then modelled as $Q\\sim U(-\\Delta/2,\\Delta/2)$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A quantizer has $\\Delta=1.25$ and the input stays inside its range.<div class="nsep"></div>What is the largest error magnitude?',
        ask:{key:'m1-qnoise', choices:['$0.3125$','$0.625$','$1.25$'], answer:1,
          why:'$|q|\\le\\Delta/2=0.625$.'}}]}
  ]}
]},

{ id:'m1-qnoise-b', module:'M1', nav:'Noise power', title:'The power of quantization noise',
  objective:'Derive the mean-square error of a fine quantizer and write it in bits.',
  keywords:'mean square error delta squared over twelve variance bits per sample',
  src:'CH7 s.20', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'The power of quantization noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figErrDensity,
      caption:'The uniform error density, and $q^{2}f_Q(q)$ shaded. The shaded area is the noise power.'}
  ], right:[
    {t:'eq', label:'Mean-square error', tex:'\\begin{aligned}E[Q^{2}]&=\\int_{-\\Delta/2}^{\\Delta/2}q^{2}\\,\\frac{1}{\\Delta}\\,dq\\\\&=\\frac{1}{\\Delta}\\left[\\frac{q^{3}}{3}\\right]_{-\\Delta/2}^{\\Delta/2}=\\frac{\\Delta^{2}}{12}\\end{aligned}'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'In bits', tex:'E[Q^{2}]=\\frac{1}{12}\\left(\\frac{2m_{\\max}}{2^{R}}\\right)^{2}=\\frac{m_{\\max}^{2}}{3\\cdot 2^{2R}}',
        note:'Substitute $\\Delta=2m_{\\max}/L$ and $L=2^{R}$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'One bit, a quarter', html:'Each extra bit halves $\\Delta$ and divides the noise power by four.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A fine uniform quantizer has $\\Delta=0.5$.<div class="nsep"></div>What is $E[Q^{2}]$?',
        ask:{key:'m1-qnoise-b', choices:['$0.0208$','$0.0417$','$0.125$'], answer:0,
          why:'$\\Delta^{2}/12=0.25/12=0.0208$.'}}]}
  ]}
]},

{ id:'m1-sqnr', module:'M1', nav:'Signal-to-noise ratio', title:'Signal-to-quantization-noise ratio',
  objective:'Derive the SQNR of a uniform quantizer and the six-decibel rule.',
  keywords:'sqnr signal to quantization noise ratio decibel six per bit alpha input level slider',
  src:'CH7 s.21–22', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Signal-to-quantization-noise ratio'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'lvl', label:'level', min:-40, max:0, step:5, v:-20, show:v=>'$'+v+'$ dB'}]},
      svg:figSqnr,
      caption:'Drag the input level below full scale. The line keeps its slope of $6.02$ dB a bit and drops by the level.'},
    {t:'legend', items:[['in','full-scale sinusoid'],['mid','at the chosen level']], at:'tl'}
  ], right:[
    {t:'eq', label:'Definition', tex:'\\mathrm{SQNR}=\\frac{P_M}{E[Q^{2}]}'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Uniform quantizer', tex:'\\mathrm{SQNR}=\\frac{3P_M}{m_{\\max}^{2}}\\,2^{2R}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, result:true, label:'Key result · Six decibels a bit', tex:'\\mathrm{SQNR}\\;[\\mathrm{dB}]=\\underbrace{10\\log_{10}\\frac{3P_M}{m_{\\max}^{2}}}_{\\alpha}+\\,6.02R'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A quantizer gives $40$ dB at $R=6$.<div class="nsep"></div>What does it give at $R=8$?',
        ask:{key:'m1-sqnr', choices:['$46.02$ dB','$52.04$ dB','$53.33$ dB'], answer:1,
          why:'Two more bits add $2(6.02)=12.04$ dB.'}}]}
  ]}
]},

{ id:'m1-ex-cos', module:'M1', nav:'Worked example · a sinusoid', title:'Worked example: quantizing a sinusoid',
  objective:'Compute the step size and SQNR of a full-scale sinusoid at three bits.',
  keywords:'worked example sinusoid parseval average power sqnr three bits 19.82 db',
  src:'CH7 s.23', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: quantizing a sinusoid'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figCosQuant,
      caption:'$m(t)=5\\cos t$ through a three-bit quantizer spanning $[-5,5]$. The dotted lines are the eight levels.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$m(t)=5\\cos t$ and a uniform quantizer over its full range, $R=3$.<div class="nsep"></div>Find the step size and the SQNR in decibels.',
      ask:{key:'m1-ex-cos', q:'Predict the step size first.', choices:['$0.625$','$1.25$','$2.5$'], answer:1}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Signal power', tex:'P_M=\\sum_k|a_k|^{2}=2\\left(\\tfrac52\\right)^{2}=12.5',
        note:'Parseval, with $a_{\\pm1}=5/2$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Intercept', tex:'\\alpha=10\\log_{10}\\frac{3(12.5)}{5^{2}}=10\\log_{10}1.5=1.76\\ \\text{dB}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Solution', html:'$\\Delta=2(5)/8=1.25$ V and $\\mathrm{SQNR}=1.76+6.02(3)=19.82$ dB.'}]}
  ]}
]},

{ id:'m1-ex-cos-b', module:'M1', nav:'Worked example · model and measurement', title:'Worked example: the model and the measurement',
  objective:'Add a bit, check the answer two ways and compare it with a measurement.',
  keywords:'worked example four bits 25.84 db check measured 19.09 25.31 model limit step size error',
  src:'CH7 s.24', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: the model and the measurement'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figMeasured,
      caption:'The dashed line is $\\alpha+6.02R$. The dots are measured on the quantized waveform, and they approach the line as $R$ grows.'},
    {t:'legend', items:[['in','$\\alpha+6.02R$',true],['mid','measured']], at:'tl'}
  ], right:[
    {t:'eq', label:'At R = 4', tex:'\\Delta=\\frac{2(5)}{16}=0.625,\\qquad \\mathrm{SQNR}=1.76+6.02(4)=25.84\\ \\text{dB}'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Check', html:'$E[Q^{2}]=1.25^{2}/12=0.1302$ and $10\\log_{10}(12.5/0.1302)=19.82$ dB. Two routes give one number.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Model limit', html:'The measured values are $19.09$ and $25.31$ dB. At three or four bits the error of a sinusoid is not quite uniform.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'The full range is $2m_{\\max}=10$ V, so $\\Delta=2m_{\\max}/L$. Using $m_{\\max}/L$ halves every step.'}]}
  ]}
]},

{ id:'m1-ex-unif', module:'M1', nav:'Worked example · a uniform source', title:'Worked example: a uniform source',
  objective:'Compute the SQNR from the definitions when the input is uniform.',
  keywords:'worked example uniform distribution 256 levels sqnr 48.16 db integration',
  src:'CH7 s.25–26', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: a uniform source'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figUniformSource,
      caption:'The density of $M$ and the quantizer regions. Sixteen regions are drawn so each is visible; the example has $256$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$M\\sim U(-1,1)$ and a uniform quantizer with $L=256$.<div class="nsep"></div>Find the SQNR.',
      ask:{key:'m1-ex-unif', q:'Predict the step size first.', choices:['$1/256$','$1/128$','$1/64$'], answer:1}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Signal power', tex:'P_M=\\int_{-1}^{1}m^{2}\\,\\tfrac12\\,dm=\\tfrac13'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Noise power', tex:'\\Delta=\\frac{2}{256}=\\frac{1}{128},\\qquad E[Q^{2}]=\\frac{\\Delta^{2}}{12}=5.086\\times10^{-6}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Solution', html:'$\\mathrm{SQNR}=(1/3)/(5.086\\times10^{-6})=65536$, or $48.16$ dB. This is $6.02(8)$ with $\\alpha=0$, and the model is exact here.'}]}
  ]}
]},

{ id:'m1-ex-gauss', module:'M1', nav:'Worked example · a Gaussian source', title:'Worked example: a Gaussian source',
  objective:'Compute the signal and noise powers of a coarse quantizer by integration.',
  keywords:'worked example gaussian source psd five level quantizer noise power 188.17',
  src:'CH7 s.27', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: a Gaussian source'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figGaussQ,
      caption:'Each sample is $N(0,400)$. The dashed lines are the boundaries $\\pm20$ and $\\pm40$; the dots are the levels $0$, $\\pm10$, $\\pm30$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'A zero-mean Gaussian source with $S_X(f)=2$ for $|f|<100$ Hz, sampled at the Nyquist rate. A five-level quantizer: levels $0,\\pm10,\\pm30$, boundaries $\\pm20,\\pm40$.<div class="nsep"></div>Find the signal power.',
      ask:{key:'m1-ex-gauss', choices:['$2$','$200$','$400$'], answer:2}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Signal power', tex:'P_X=\\int_{-100}^{100}2\\,df=400=\\sigma_X^{2}'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Method', html:'The quantizer is coarse and its outer regions are unbounded. Integrate the error region by region; $\\Delta^{2}/12$ does not apply.'}]},
    {t:'reveal', at:3, items:[
      {t:'eq', label:'Noise power', tex:'P_Q=\\int_{-\\infty}^{\\infty}\\bigl(x-\\mathbb{Q}(x)\\bigr)^{2}f_X(x)\\,dx=188.17'}]}
  ]}
]},

{ id:'m1-ex-gauss-b', module:'M1', nav:'Worked example · where the error goes', title:'Worked example: where the error goes',
  objective:'Finish the Gaussian example and compare it with the uniform model.',
  keywords:'worked example gaussian sqnr 3.28 db model limit 10.8 db central region error',
  src:'CH7 s.28', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: where the error goes'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figGaussErr,
      caption:'The error integrand, region by region. The five areas add to $P_Q=188.17$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$P_X=400$ and $P_Q=188.17$.<div class="nsep"></div>What is the SQNR?',
      ask:{key:'m1-ex-gauss-b', choices:['$3.28$ dB','$6.02$ dB','$10.8$ dB'], answer:0}},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Solution', html:'$\\mathrm{SQNR}=10\\log_{10}(400/188.17)=3.28$ dB.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Model limit', html:'With $\\Delta=20$, the formula $\\Delta^{2}/12$ predicts $10.8$ dB. The coarse levels and the unbounded outer regions cost $7.5$ dB more.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Check', html:'The central region gives $79.50$ of the $188.17$. It holds $68\\%$ of the samples, each with an error of up to $20$.'}]}
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
      caption:'Speech amplitudes crowd near zero. Sixteen levels, placed uniformly (upper row) and by $\\mu$-law (lower row).'}
  ], right:[
    {t:'note', kind:'def', head:'The problem', html:'Speech is mostly quiet and only sometimes reaches its peak. A uniform step is the same for a whisper and a shout, so the whisper is quantized coarsely in proportion to itself.'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'Relative error', tex:'\\frac{|q|}{|m|}\\le\\frac{\\Delta}{2|m|}',
        note:'Small amplitudes suffer the most.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Companding', html:'Compress the signal with a memoryless curve, quantize uniformly, and expand at the receiver. The name joins <b>com</b>pressing and ex<b>panding</b>.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A uniform quantizer has $\\Delta=0.1$ V. A quiet signal peaks at $0.2$ V.<div class="nsep"></div>How large can the error be, relative to that peak?',
        ask:{key:'m1-nonuniform', choices:['$2.5\\%$','$25\\%$','$50\\%$'], answer:1,
          why:'$(\\Delta/2)/0.2=0.05/0.2=25\\%$.'}}]}
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
      caption:'The dashed line is no companding. Both laws spend much of the output range on small inputs.'}
  ], right:[
    {t:'eq', label:'µ-law', tex:'y=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}\\operatorname{sgn}(x),\\qquad |x|\\le 1'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'A-law', tex:'y=\\begin{cases}\\dfrac{A|x|}{1+\\ln A}\\operatorname{sgn}(x), & |x|\\le\\dfrac{1}{A}\\\\[8pt] \\dfrac{1+\\ln(A|x|)}{1+\\ln A}\\operatorname{sgn}(x), & \\dfrac{1}{A}<|x|\\le 1\\end{cases}'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'In use', html:'Both laws map $\\pm1$ to $\\pm1$, so the quantizer range is unchanged. North America and Japan use $\\mu=255$; most other countries use $A=87.6$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\mu=255$ and an input $x=0.01$.<div class="nsep"></div>What is the compressed value $y$?',
        ask:{key:'m1-companding', choices:['$0.01$','$0.23$','$0.50$'], answer:1,
          why:'$y=\\ln(3.55)/\\ln(256)=1.267/5.545=0.23$. One per cent of the range is lifted to almost a quarter.'}}]}
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
    {t:'fig', frame:true, grow:true, svg:figGrayTable,
      caption:'Eight levels in two codes. Adjacent Gray words (green) differ in one bit; the natural words $011$ and $100$ differ in all three.'}
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

{ id:'m1-ex-pcm', module:'M1', nav:'Worked example · a PCM stream', title:'Worked example: sample, quantize, encode',
  objective:'Set up one signal for all three stages: step size, levels and samples.',
  keywords:'worked example pcm sinc sampling quantizing step size levels',
  src:'CH7 s.36', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: sample, quantize, encode'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figPcmExample,
      caption:'The message (cyan), its samples every $0.6$ s, and the selected levels (violet). Each error is under half a step.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$m(t)=8\\,|\\operatorname{sinc}(t-2)|$, sampled every $T_s=0.6$ s, with an eight-level uniform quantizer over $[0,8]$.<div class="nsep"></div>Find the step size, the code words for $t=0,0.6,\\dots,3.6$, and the bit rate.',
      ask:{key:'m1-ex-pcm', q:'Predict the step size first.', choices:['$0.5$ V','$1$ V','$2$ V'], answer:1}},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Method', html:'<ol class="steps"><li>Take $\\Delta$ from the range and $L$.</li><li>Evaluate each sample.</li><li>Read the tread, then its code word.</li></ol>'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Step and levels', tex:'\\Delta=\\frac{8-0}{8}=1\\ \\text{V},\\qquad v_k=0.5,\\,1.5,\\,\\dots,\\,7.5'}]},
    {t:'reveal', at:3, items:[
      {t:'eq', label:'Samples', tex:'m(nT_s)=0,\\;1.73,\\;1.87,\\;7.48,\\;6.05,\\;0,\\;1.51'}]}
  ]}
]},

{ id:'m1-ex-pcm-b', module:'M1', nav:'Worked example · the bit stream', title:'Worked example: the bit stream',
  objective:'Finish the PCM example: code words, bit rate and a check.',
  keywords:'worked example code words bit rate 5 b/s polar nrz check sinc zero',
  src:'CH7 s.36', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Worked example'},
  {t:'title', text:'Worked example: the bit stream'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figPcmStream,
      caption:'The seven code words sent as one polar NRZ stream, three bits to a sample.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'Three bits a sample, one sample every $0.6$ s.<div class="nsep"></div>What is the bit rate?',
      ask:{key:'m1-ex-pcm-b', choices:['$1.8$ b/s','$5$ b/s','$0.6$ b/s'], answer:1}},
    {t:'eq', label:'Levels and code words', tex:'\\begin{array}{c|ccccccc}v&0.5&1.5&1.5&7.5&6.5&0.5&1.5\\\\\\hline\\text{code}&000&001&001&111&110&000&001\\end{array}'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Solution', html:'$f_s=1/0.6=1.667$ samples a second, so $R_b=3(1.667)=5$ b/s and one bit lasts $T_b=0.2$ s.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Check', html:'At $t=3$ the sample is $8|\\operatorname{sinc}(1)|=0$ exactly, because $\\operatorname{sinc}$ vanishes at every non-zero integer.'}]}
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
      {t:'eq', label:'Every pair', tex:'L^{2}=16^{2}=256\\ \\text{pairs}\\;\\Rightarrow\\;8\\ \\text{bits a pair}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Pairs that occur', tex:'3L-2=46\\ \\text{pairs}\\;\\Rightarrow\\;\\lceil\\log_2 46\\rceil=6\\ \\text{bits a pair}',
        note:'Three bits a sample instead of four, with the same cells.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'An $8$-level quantizer, and neighbours that differ by at most one step.<div class="nsep"></div>How many pairs can occur?',
        ask:{key:'m1-vq', choices:['$22$','$24$','$64$'], answer:0,
          why:'$3L-2=3(8)-2=22$: the diagonal and the two lines beside it.'}}]}
  ]}
]},

{ id:'m1-vq-image', module:'M1', nav:'Quantizing an image', title:'Quantizing an image',
  objective:'Work the size of a quantized image and name what is lost.',
  keywords:'image quantization bits per pixel kib banding contouring lossy compression',
  src:'CH7 s.37', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Vector quantization'},
  {t:'title', text:'Quantizing an image'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:()=>figBanding(),
      caption:'One row of a smooth gradient. The fine quantizer follows it; the coarse one replaces it with flat steps, and each step edge shows as a false line.'}
  ], right:[
    {t:'eq', label:'Bits in the image', tex:'\\begin{aligned}512^{2}(8)&=2\\,097\\,152\\ \\text{bits}=256\\ \\text{KiB}\\\\512^{2}(5)&=1\\,310\\,720\\ \\text{bits}=160\\ \\text{KiB}\\end{aligned}',
      note:'Going from $256$ to $32$ levels saves $37.5\\%$ of the file.'},
    {t:'reveal', at:1, items:[
      {t:'eq', side:true, label:'What it costs', tex:'6.02(8-5)=18.06\\ \\text{dB}',
        note:'Three bits fewer, three times six decibels.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Banding', html:'Coarse levels turn a smooth gradient into flat steps. The eye reads the step edges as contours that the scene never had.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A $256\\times256$ image quantized to $L=64$ levels.<div class="nsep"></div>How large is it?',
        ask:{key:'m1-vq-image', choices:['$48$ KiB','$64$ KiB','$384$ KiB'], answer:0,
          why:'$R=\\log_2 64=6$ bits, so $256^{2}(6)/8=49\\,152$ bytes $=48$ KiB.'}}]}
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

/* ---------------------------------------------------------------- 1.8 ---- */
{ id:'m1-quick', module:'M1', nav:'Quick check', title:'Quick check',
  objective:'Check the module ideas with eight short predictions.',
  keywords:'quick check predict alias nyquist rate sinc bits sqnr step size mu law gray code levels',
  budget:'a set of eight prediction cards; the questions carry no figure',
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
  /* Ten results as prompts, in the order of the module: the student answers
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
     a:'Adjacent levels differ in one bit, so a small decision error costs one bit error.'}
  ], {cols:2})},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Method', html:'<span style="color:var(--graphite)">Check a rate against $2W$ before sampling. Take $\\Delta$ from the full range $2m_{\\max}$. Compute the SQNR from the two powers and compare it with $\\alpha+6.02R$. Module 2 sends the resulting bits over a channel.</span>'}]}
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
   stays live either way. */
const SP = { n:null, held:false, i:-1 };
const spRoot  = () => document.querySelector('svg.sincpick');
function spApply(sv){
  if(!sv) return;
  sv.classList.toggle('pick', SP.n!=null);
  sv.querySelectorAll('[data-st]').forEach(el=>
    el.classList.toggle('on', el.dataset.st===String(SP.n)));
}
setInterval(()=>{
  if(document.hidden || SP.held) return;
  if(document.body.dataset.motion==='reduced') return;
  const sv = spRoot();
  if(!sv){ SP.n=null; SP.i=-1; return; }
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
  if(sv && !(e.relatedTarget instanceof Element && sv.contains(e.relatedTarget)))
    SP.held=false;      /* the roll call takes over on its next tick */
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
