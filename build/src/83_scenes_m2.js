/* ==========================================================================
   Module 2 — Baseband transmission of digital signals.

   One bit is sent as one waveform, the channel adds noise, and the receiver
   decides. The module answers three questions in order. Which filter should
   the receiver use? Where should the threshold go? What happens when the
   channel is bandlimited and the pulses overlap?

   Every teaching scene is a slide in the reference design (DESIGN.md), as in
   Module 1: one figure on the left, two to four cards on the right, a
   prediction card on each slide, and each section closing on a gallery, a
   laboratory and a code page.

   Colour, as everywhere in this course: cyan is the transmitted waveform or
   symbol, amber a filter or the channel, violet the decision statistic and
   any other intermediate quantity (a filter output before its sample, a
   sampled spectrum), green the received waveform and the decided bits, red an
   error or the interference that causes one. Noise takes no colour of its
   own: it is the hairline tone, or it is part of a received waveform.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* The canvas of a slide figure and of a gallery figure, as in Module 1. A
   figure that grows into its column is one Axes: the grown height is handed
   to the first Axes the figure draws. */
const SZ  = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const EXO = o => Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3}, o);
const sinc = x => Math.abs(x)<1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
const clamp01 = x => Math.max(0, Math.min(1, x));
/* One panel placed inside a larger figure, for the stacked figures. */
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };
const frameOf = (v, last) => v && v.frame!=null ? v.frame : last;
/* draw() inside a group at opacity op; nothing at all below 1 % */
const fade = (a, op, draw) => { if(op < 0.01) return; a.raw(`<g opacity="${op.toFixed(3)}">`); draw(); a.raw('</g>'); };

/* A seeded generator, so every noise figure is the same figure on every
   machine and in every render. */
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }
/* Noise as a function of time: seeded samples every `dt`, joined by a raised
   cosine so a trace drawn from it is the same at any resolution. */
function noiseFn(seed, dt, s, t0=-2, t1=40){
  const n = gauss(seed, Math.ceil((t1-t0)/dt)+2, s);
  return t => { const x = (t-t0)/dt, k = Math.max(0, Math.min(n.length-2, Math.floor(x))), f = x-k,
    w = (1-Math.cos(Math.PI*f))/2; return (1-w)*n[k] + w*n[k+1]; };
}
/* Bandlimited Gaussian noise: a sum of K cosines evenly spread over (0, B),
   each with Gaussian quadrature weights, so every value is Gaussian and the
   spectrum is flat up to B and zero above. It is tabulated at 16 points a
   period of B, then shifted and scaled so its mean over [t0, t1] is 0 and its
   RMS there is exactly s: the trace shows the sigma the slide states. */
function bandNoise(seed, B, s, t0, t1){
  const L = t1-t0, K = Math.max(8, Math.round(B*L)), z = gauss(seed, 2*K, 1);
  const dt = 1/(16*B), N = Math.ceil(L/dt)+1, x = new Float64Array(N);
  let m = 0, q = 0;
  for(let i=0;i<N;i++){ const t = i*dt; let v = 0;
    for(let k=0;k<K;k++){ const w = 2*Math.PI*(k+0.5)*B/K*t; v += z[2*k]*Math.cos(w) + z[2*k+1]*Math.sin(w); }
    x[i] = v; m += v; }
  m /= N; for(let i=0;i<N;i++){ x[i] -= m; q += x[i]*x[i]; }
  const g = s/Math.sqrt(q/N); for(let i=0;i<N;i++) x[i] *= g;
  return t => { const u = (t-t0)/dt, k = Math.max(0, Math.min(N-2, Math.floor(u))), f = u-k;
    return (1-f)*x[k] + f*x[k+1]; };
}

/* The Gaussian tail Q(x) = erfc(x/sqrt 2)/2, through a Chebyshev fit of erfc
   with a relative error below 1.2e-7 everywhere, so a readout of an error
   probability near 1e-6 keeps its leading digits. */
function erfc(x){ const z=Math.abs(x), t=1/(1+0.5*z);
  const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806
    +t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x>=0 ? r : 2-r; }
const Qf = x => 0.5*erfc(x/Math.SQRT2);
const dens = (y,m,s) => Math.exp(-(y-m)*(y-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
/* a number in TeX, three significant figures: 0.0228, 2.48\times10^{-6} */
function sci(v, d=3){
  if(v===0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  if(e >= -2 && e < 3) return String(+v.toPrecision(d));
  const m = v/Math.pow(10,e);
  return (+m.toPrecision(d)) + '\\times10^{' + e + '}';
}
/* a decade tick with its mantissa, for a log axis that spans less than two decades */
const SUPS = {'-':'\u207B','0':'\u2070','1':'\u00B9','2':'\u00B2','3':'\u00B3','4':'\u2074','5':'\u2075','6':'\u2076','7':'\u2077','8':'\u2078','9':'\u2079'};
const mdec = v => { const e = Math.floor(v+1e-9), m = Math.round(Math.pow(10, v-e));
  return (m===1 ? '' : m+'\u00D7') + '10' + String(e).split('').map(c=>SUPS[c]||c).join(''); };

/* Tick numbers of a logarithmic axis drawn at the left edge of the frame.
   PLOT writes them beside the vertical zero axis, which in the two worked
   figures of 2.3 runs through the middle of the data. */
function leftTicks(a, vals, fmt){
  vals.forEach(v=>{ const y = a.sy(v).toFixed(2);
    a.raw(`<line x1="${a.x0}" y1="${y}" x2="${a.x0-5}" y2="${y}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${a.x0-10}" y="${(+y+4.5).toFixed(2)}" font-size="13" fill="${C.muted}" text-anchor="end">${fmt(v)}</text>`); });
}

/* ---- the navy opening ----------------------------------------------------
   The page under these figures is navy, so the axis, the tick numbers and the
   axis names take that page's ink, and the signals the dark-page tints. */
const NAVY = {axis:'rgba(239,231,216,.34)', tick:'#9EACB9', name:'#E6E2D9'};
const T_CY = '#4FBECE', T_GR = '#82C27B', T_VI = '#AC99DC', T_RD = '#E8785F';
const OPEN_B = [1,0,1,1,0,1,0,0,1,1];
const openS = t => { const k = Math.floor(t); return (k>=0 && k<10) ? (OPEN_B[k] ? 1 : -1) : 0; };
const OPEN_W = noiseFn(20260925, 0.05, 0.55, -1, 11);
/* The integrate-and-dump output of each bit, the decision statistic y_k. */
const openY = k => { let s = 0; const N = 200;
  for(let i=0;i<N;i++){ const t = k+(i+0.5)/N; s += openS(t)+OPEN_W(t); } return s/N; };
function figOpenTx(){
  /* in projector mode the bit labels grow: the panel gains height and the
     labels sit a fixed number of pixels above the pulse top */
  const big = P.labelScale()>1;
  const a = P.Axes({w:520,h:big?156:130,xr:[0,10],yr:[-1.6,big?2.3:1.6],grid:false,
    xlabel:'t', xunit:'T_b', ylabel:'s(t)', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3,
    ...(big ? {yticksOverride:[-1,0,1]} : {})});
  a.curve(openS, {color:T_CY, width:2.4, n:2000, anim:{delay:0, sweep:'#D9F3F7'}});
  const yb = big ? 1 + 9*P.labelScale()/(a.sy(0)-a.sy(1)) : 1.32;
  OPEN_B.forEach((b,k)=>a.note(k+0.5, yb, String(b), {fs:14, color:'#9EACB9', anchor:'middle'}));
  return a.svg();
}
function figOpenRx(){
  const a = P.Axes({w:520,h:130,xr:[0,10],yr:[-2.6,2.6],grid:false,
    xlabel:'t', xunit:'T_b', ylabel:'x(t)', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3});
  a.curve(t=>openS(t)+OPEN_W(t), {color:T_GR, width:1.6, n:2000, anim:{delay:0.5}});
  return a.svg();
}
function figOpenDecide(){
  const a = P.Axes({w:520,h:130,xr:[0,10],yr:[-1.9,1.9],grid:false,
    xlabel:'t', xunit:'T_b', ylabel:'y_k', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3});
  a.hline(0, {color:'rgba(239,231,216,.30)', dash:'4 5'});
  a.stem(OPEN_B.map((_,k)=>[k+1, openY(k)]), {color:T_VI, anim:{delay:1.2, step:0.09, tip:true}});
  OPEN_B.forEach((_,k)=>{ const d = openY(k) > 0 ? 1 : 0;
    a.note(k+1, 1.58, String(d), {fs:14, color:d===OPEN_B[k] ? T_GR : T_RD, anchor:'middle', weight:600}); });
  return a.svg();
}

/* ---- 2.1 the matched filter ---------------------------------------------- */

/* The filter problem. One rectangular pulse g(t) = 1 on [0, T], with T = 1 and
   E = 1, in white noise of N0 = 0.08, through an RC filter h(t) = e^{-t/tau}/tau
   or through the matched filter. The noise is one seeded realisation on a
   grid of dt = T/200 with variance N0/(2 dt) a sample, so an output built from
   it has the variance (N0/2) int h^2 the slides state: N0/(4 tau) for the RC
   filter, N0/2 for the matched one. The input is drawn averaged over T/25,
   which is how a scope of that bandwidth would show it; the filters see the
   full grid. Every figure of this pulse in noise uses this one realisation. */
const FP_N0 = 0.08, FP_DT = 1/200, FP_T0 = -6, FP_T1 = 2.4;
const FP_K = Math.round((FP_T1-FP_T0)/FP_DT)+1;
const FP_W = gauss(20261209, FP_K, Math.sqrt(FP_N0/(2*FP_DT)));
const fpG = t => (t>=0 && t<=1) ? 1 : 0;
const rcSig = (t, tau) => t<0 ? 0 : t<=1 ? 1-Math.exp(-t/tau) : (1-Math.exp(-1/tau))*Math.exp(-(t-1)/tau);
const mfSig = t => t<0 ? 0 : t<1 ? t : t<2 ? 2-t : 0;
/* eta at t = T as a fraction of the bound 2E/N0, for an RC filter with T/tau = x */
const rcRatio = x => 2*Math.pow(1-Math.exp(-x), 2)/x;
const FP_NOISE = {};
function fpNoise(key, tau){
  if(!FP_NOISE[key]){ const n = new Float64Array(FP_K);
    if(tau){ const a = Math.exp(-FP_DT/tau); let s = 0;
      for(let k=0;k<FP_K;k++){ s = a*s + FP_W[k]*FP_DT/tau; n[k] = s; } }
    else { let s = 0;
      for(let k=0;k<FP_K;k++){ s += FP_W[k]*FP_DT; if(k>=200) s -= FP_W[k-200]*FP_DT; n[k] = s; } }
    FP_NOISE[key] = n; }
  const n = FP_NOISE[key];
  return t => { const x = (t-FP_T0)/FP_DT, k = Math.max(0, Math.min(FP_K-2, Math.floor(x))), f = x-k;
    return (1-f)*n[k] + f*n[k+1]; };
}
/* the input as a scope would show it: the same white noise through a
   Gaussian smoothing of unit gain, standard deviation 4 grid steps (T/50),
   sampled every 2 steps. Its variance is (N0/2) times the sum of the squared
   weights over dt, about 0.56, so the drawn noise has a standard deviation
   near 0.75: a continuous, bandlimited Gaussian trace, scaled as that scope
   would scale it. */
const FP_X = (()=>{ const R = 12, w = [];
  for(let i=-R;i<=R;i++) w.push(Math.exp(-i*i/32));
  const sw = w.reduce((a,b)=>a+b, 0), o = [];
  for(let k=Math.round((-0.2-FP_T0)/FP_DT); k+R<FP_K; k+=2){
    let s = 0; for(let i=-R;i<=R;i++) s += w[i+R]*FP_W[k+i]; const t = FP_T0+k*FP_DT;
    if(t > 2.3) break; o.push([t, fpG(t)+s/sw]); } return o; })();
/* one filter of the pulse: its signal part, its noise standard deviation, its
   noise realisation and eta/(2E/N0) at t = T */
const fpFilter = tau => tau
  ? {sig:t=>rcSig(t,tau), sd:Math.sqrt(FP_N0/(4*tau)), n:fpNoise('rc'+tau, tau), ratio:rcRatio(1/tau)}
  : {sig:mfSig, sd:Math.sqrt(FP_N0/2), n:fpNoise('mf', 0), ratio:1};
/* the output of one filter: a band one standard deviation wide around the
   signal part, one noisy output drawn thin, the signal part, and its sample */
function fpOutput(a, F, x0, x1){
  const N = 250, pts = [];
  for(let i=0;i<=N;i++){ const t = x0+(x1-x0)*i/N; pts.push([a.sx(t), a.sy(F.sig(t)+F.sd)]); }
  for(let i=N;i>=0;i--){ const t = x0+(x1-x0)*i/N; pts.push([a.sx(t), a.sy(F.sig(t)-F.sd)]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(t=>F.sig(t)+F.n(t), {color:C.mid, width:1.2, opacity:0.4, n:900});
  a.curve(F.sig, {color:C.mid, width:2.6, n:600});
  a.vline(1, {color:C.muted});
  a.point(1, F.sig(1), {color:C.mid, r:5});
}
const etaNote = r => `\\eta=${r.toFixed(2)}\\cdot\\dfrac{2E}{N_0}`;

/* Additive Gaussian noise on five polar bits, +1 -1 +1 -1 +1 over 5T, at
   three noise levels. One realisation of bandlimited Gaussian noise (B = 20/T)
   with RMS exactly 1 is scaled by sigma, so a press of Next shows the same
   noise growing from 0.1 to 0.5 to 1; between frames sigma moves on a log
   scale. The shaded band is g(t) +/- sigma. The readout is the chance that a
   sample read at one instant of a +1 bit falls below 0, Q(1/sigma). */
const AW_S = [0.1, 0.5, 1], AW_B = [1,0,1,0,1];
const AW_W = bandNoise(20261014, 20, 1, -0.2, 5.2);
const awG = t => { const k = Math.floor(t); return (k>=0 && k<5) ? (AW_B[k] ? 1 : -1) : 0; };
const awQ = s => { const q = Qf(1/s); return q < 1e-6 ? '\\approx 0' : '='+q.toFixed(3); };
function figAwgn(v){
  const f = frameOf(v, 0), i = Math.min(1, Math.floor(f)), u = clamp01(f-i);
  const s = Math.exp((1-u)*Math.log(AW_S[i]) + u*Math.log(AW_S[i+1]));
  const a = P.Axes(SZ({xr:[-0.15,5.15], yr:[-4.6,6.6], xlabel:'t', xunit:'T', ylabel:'x(t)=g(t)+w(t)',
    xticksOverride:[0,1,2,3,4,5], yticksOverride:[-4,-2,0,2,4]}));
  const pts = [], N = 400;
  for(let j=0;j<=N;j++){ const t = 5*j/N; pts.push([a.sx(t), a.sy(awG(t)+s)]); }
  for(let j=N;j>=0;j--){ const t = 5*j/N; pts.push([a.sx(t), a.sy(awG(t)-s)]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(t=>t>=0 && t<=5 ? awG(t)+s*AW_W(t) : NaN, {color:C.out, width:1.3, n:2400});
  a.poly([[-0.15,0],[0,0],[0,1],[1,1],[1,-1],[2,-1],[2,1],[3,1],[3,-1],[4,-1],[4,1],[5,1],[5,0],[5.15,0]], {color:C.in, width:2.4});
  a.note(0.02, 5.5, `Q(1/\\sigma)${awQ(s)}`, {tex:true, fs:16, color:C.mid});
  return a.svg();
}

/* The opening of the section: the same noisy pulse through three filters,
   one frame each. Between frames the signal part, the band and the noisy
   output blend, so a press shows one output turning into the next. */
const FP_FILTERS = [fpFilter(0.1), fpFilter(2), fpFilter(0)];
function figFilterChoice(v){
  P.hOverride = null;
  const f = frameOf(v, 2), i = Math.min(1, Math.floor(f)), u = clamp01(f-i);
  const A = FP_FILTERS[i], B = FP_FILTERS[i+1];
  const F = {sig:t=>(1-u)*A.sig(t)+u*B.sig(t), sd:(1-u)*A.sd+u*B.sd, n:t=>(1-u)*A.n(t)+u*B.n(t)};
  /* the phone draws larger labels, so each panel takes more height there */
  const big = P.labelScale() > 1, hA = big ? 290 : 200, hB = big ? 330 : 230;
  const a = P.Axes({w:560,h:hA,xr:[-0.2,2.3],yr:[-1.6,2.6],xlabel:'t', xunit:'T',ylabel:'x(t)',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[0,1,2],yticksOverride:[-1,0,1,2]});
  a.area(t=>(t>=0&&t<1?1:0), -0.2, 2.3, {color:C.dec.in, n:600});
  a.poly(FP_X.map(([t,x])=>[t, fpG(t)+0.5*(x-fpG(t))]), {color:C.out, width:1.0});
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[2.3,0]], {color:C.in, width:3.2});
  /* the legend is laid out in pixels from the right, so larger labels keep it on one line */
  const px = 1/(a.sx(1)-a.sx(0)), L = P.labelScale(), x2 = 2.27-112*L*px, x1 = x2-(30+34*L)*px;
  a.poly([[x1-24*px,2.3],[x1-6*px,2.3]], {color:C.in, width:3.2});
  a.note(x1, 2.3, 'g(t)', {tex:true, fs:15, color:C.in});
  a.poly([[x2-24*px,2.3],[x2-6*px,2.3]], {color:C.out, width:1.6});
  a.note(x2, 2.3, 'x(t)=g(t)+w(t)', {tex:true, fs:15, color:C.out});
  const b = P.Axes({w:560,h:hB,xr:[-0.2,2.3],yr:[-1.1,2.1],xlabel:'t', xunit:'T',ylabel:'y(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,1,2],yticksOverride:[-1,0,1,2]});
  fpOutput(b, F, -0.2, 2.3);
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The receiver: the pulse, the noise added to it, one linear filter, and one
   sample at the end of the bit. Under it, what reaches the filter: the pulse
   of one bit and the same pulse with white noise on it. */
const RX_W = bandNoise(7, 30, 0.5, -0.2, 1.4);
function figReceiver(){
  P.hOverride = null;
  const top = P.blocks({w:560,h:150,items:[
    {t:'arrow',x1:14,y1:62,x2:112,y2:62,label:'g(t)',tex:true,color:C.in},
    {t:'sum',x:132,y:62},
    {t:'arrow',x1:132,y1:128,x2:132,y2:78,color:C.muted},
    {t:'text',x:150,y:128,label:'w(t)',tex:true,anchor:'start',fs:15},
    {t:'arrow',x1:148,y1:62,x2:238,y2:62,label:'x(t)',tex:true,color:C.out},
    {t:'box',x:238,y:32,w:118,h:60,label:'h(t)',tex:true,color:C.h},
    {t:'arrow',x1:356,y1:62,x2:436,y2:62,label:'y(t)',tex:true,color:C.mid},
    {t:'line',d:'M436,62 h24'}, {t:'line',d:'M460,62 l20,-14'},
    {t:'arrow',x1:488,y1:62,x2:548,y2:62,label:'y(T)',tex:true,color:C.mid},
    {t:'text',x:470,y:104,label:'t=T',tex:true,fs:14}
  ]});
  const a = P.Axes({w:560,h:250,xr:[-0.2,1.4],yr:[-1.2,2.6],xlabel:'t', xunit:'T',ylabel:'x(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,0.5,1],ytarget:3});
  a.curve(t=>(t>=0&&t<=1?1:0)+RX_W(t), {color:C.out, width:1.5, n:900});
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[1.4,0]], {color:C.in, width:2.4});
  return stack(560, [[top,150],[a.svg(),250]]);
}

/* The output of a linear filter split into its two parts, for the noisy
   pulse of the opening slide through an RC filter with tau = 0.8T. Frame 0
   is the input; frame 1 adds the signal part g0(t) = g * h, the same on every
   transmission; frame 2 adds the noise part n(t) = w * h on its own, with a
   band one standard deviation sqrt(N0/(4 tau)) wide around 0; frame 3 lifts
   the noise onto g0(t), which is y(t), and marks the sample at t = T with the
   noise value n(T) as the gap between g0(T) and y(T). */
const SP_F = fpFilter(0.25);
function figSplit(v){
  P.hOverride = null;
  const f = frameOf(v, 3), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  const big = P.labelScale() > 1, hA = big ? 290 : 200, hB = big ? 330 : 230;
  const a = P.Axes({w:560,h:hA,xr:[-0.2,2.3],yr:[-3.2,4.4],xlabel:'t', xunit:'T',ylabel:'x(t)',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[0,1,2],yticksOverride:[-2,0,2,4]});
  a.poly(FP_X, {color:C.out, width:1.3});
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[2.3,0]], {color:C.in, width:2.4});
  const b = P.Axes({w:560,h:hB,xr:[-0.2,2.3],yr:[-1.1,2.2],xlabel:'t', xunit:'T',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,1,2],yticksOverride:[-1,0,1,2]});
  const sd = SP_F.sd, lift = t => o3*SP_F.sig(t);
  if(o2 > 0.01){ const pts = [], N = 250;
    for(let i=0;i<=N;i++){ const t = -0.2+2.5*i/N; pts.push([b.sx(t), b.sy(lift(t)+sd)]); }
    for(let i=N;i>=0;i--){ const t = -0.2+2.5*i/N; pts.push([b.sx(t), b.sy(lift(t)-sd)]); }
    b.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}" opacity="${o2.toFixed(3)}"/>`);
    fade(b, o2, ()=>b.curve(t=>lift(t)+SP_F.n(t), {color:o3 > 0.5 ? C.mid : C.muted, width:1.4, n:900})); }
  fade(b, o1, ()=>b.curve(SP_F.sig, {color:C.mid, width:2.8, n:600}));
  b.vline(1, {color:C.muted});
  fade(b, o1*(1-o3), ()=>b.note(1.08, 1.55, 'g_0(t)=g(t)*h(t)', {tex:true, fs:15, color:C.mid}));
  fade(b, o2*(1-o3), ()=>b.note(1.62, -0.72, 'n(t)=w(t)*h(t)', {tex:true, fs:15, color:C.muted}));
  fade(b, o3, ()=>{ const g0 = SP_F.sig(1), y = g0+SP_F.n(1);
    b.point(1, g0, {color:C.ink, r:3.5}); b.point(1, y, {color:C.mid, r:5.5});
    b.poly([[1.05,g0],[1.05,y]], {color:C.err, width:2.2});
    b.note(1.12, (g0+y)/2-0.08, 'n(T)', {tex:true, fs:15, color:C.err});
    b.note(1.08, 1.75, 'y(t)=g_0(t)+n(t)', {tex:true, fs:15, color:C.mid}); });
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The peak pulse SNR of an RC filter under a slider. The upper panel is the
   output of the pulse in noise above: the signal part g0(t), a band one noise
   standard deviation wide, one noisy output, and the sample at t = T. The
   lower panel is eta as a fraction of the bound against T/tau on a log axis,
   2(1 - e^{-x})^2/x, whose largest value is 0.81 at T/tau = 1.26. */
const RC_BEST = 1.2564;
function figSnr(v){
  P.hOverride = null;
  const r = v && v.r!=null ? v.r : 0, tau = Math.pow(10, -r), F = fpFilter(+tau.toPrecision(6));
  const big = P.labelScale() > 1, hA = big ? 480 : 400;
  const g0 = F.sig(1), sd = F.sd, eta = Math.pow(g0/sd, 2);
  const a = P.Axes({w:560,h:hA,xr:[-0.2,2.3],yr:[-0.9,1.9],xlabel:'t', xunit:'T',ylabel:'y(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,1,2],yticksOverride:[0,1]});
  a.curve(F.sig, {color:C.mid, width:2.4, n:600});
  a.vline(1, {color:C.muted, dash:'4 4'});
  a.poly([[1,0],[1,g0]], {color:C.mid, width:6});
  a.poly([[1.3,-sd],[1.3,sd]], {color:C.muted, width:6});
  a.note(0.94, Math.max(g0, 0.15)+0.12, '\\text{signal}\\;g_0(T)', {tex:true, fs:15, color:C.mid, anchor:'end'});
  a.note(1.38, -sd-0.18, '\\text{noise}\\;\\pm\\sigma', {tex:true, fs:15, color:C.muted});
  a.note(0.06, 1.65, `\\eta=\\Bigl(\\dfrac{\\text{signal}}{\\text{noise}}\\Bigr)^{2}=${eta.toFixed(1)}`, {tex:true, fs:16, color:C.mid});
  /* what the bars say at this speed: a slow filter has little noise but no
     signal, a fast one has all the signal and keeps adding noise */
  const x = 1/tau, why = x < 0.7 ? '\\text{slow: the pulse barely rises}'
                      : x < 2.2 ? '\\text{near the best: both are fair}'
                      :           '\\text{fast: noise keeps growing}';
  a.note(0.08, -0.74, why, {tex:true, fs:15, color:C.mid});
  return stack(560, [[a.svg(),hA]]);
}

/* The output noise power, built in frames for an RC filter with tau = T/4,
   |H(f)|^2 = 1/(1 + (2 pi f tau)^2) with f in units of 1/T. Frame 0 is the
   flat input density N0/2; frame 1 lays |H(f)|^2 over it; frame 2 multiplies
   the two into S_N(f); frame 3 sweeps the area under S_N(f) from the left
   (no number is printed). The whole area is
   (N0/2)/(2 tau) = N0/(4 tau) = N0/T for tau = T/4. */
const NP_TAU = 0.25, npH2 = f => 1/(1+Math.pow(2*Math.PI*f*NP_TAU, 2));
const npCum = f => (Math.atan(2*Math.PI*NP_TAU*f) + Math.PI/2)/(2*Math.PI*NP_TAU)/2;
function figNoisePower(v){
  const f = frameOf(v, 3), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  const a = P.Axes(SZ({xr:[-4,4], yr:[0,1.6], xlabel:'fT', ylabel:'S(f)/(N_0/2),\\;|H(f)|^{2}',
    xticksOverride:[-4,-2,0,2,4], yticksOverride:[0.5,1], ytickfmt:()=>''}));
  const Sn = x => (1-o2) + o2*npH2(x);
  a.curve(()=>1, {color:C.in, width:o2 > 0.01 ? 1.5 : 2.6, dash:o2 > 0.01 ? '6 5' : null, n:4});
  a.note(-3.9, 1.14, 'S_W(f)=\\tfrac{N_0}{2}', {tex:true, fs:15, color:C.in});
  fade(a, o1*(1-0.6*o2), ()=>a.curve(npH2, {color:C.h, width:2.2, dash:'7 5', n:600}));
  fade(a, o1*(1-o2), ()=>a.note(1.0, 0.45, '|H(f)|^{2}', {tex:true, fs:15, color:C.h}));
  fade(a, o2, ()=>{ a.curve(Sn, {color:C.out, width:2.6, n:600});
    a.note(1.0, 0.45, 'S_N(f)=\\tfrac{N_0}{2}|H(f)|^{2}', {tex:true, fs:15, color:C.out}); });
  if(o3 > 0.01){ const x1 = -4 + 8*o3;
    a.area(npH2, -4, x1, {color:C.dec.out, n:400});
    a.vline(x1, {color:C.out, dash:'4 4'}); }
  return a.svg();
}

/* Schwarz's inequality under a slider. The signal spectrum |G(f)| is a
   Gaussian of unit width and the filter |H(f)| one of width b. With the
   phases matched, the output SNR as a fraction of the bound is
   (int GH)^2/(int G^2 int H^2) = 2b/(1+b^2), which is 1 only at b = 1. */
const schwarzRatio = b => 2*b/(1+b*b);
function figSchwarz(v){
  const b = v && v.b!=null ? v.b : 1;
  const L = P.labelScale(), big = L>1, top = big ? 1.5 : 1.3;
  const a = P.Axes(SZ({xr:[-3.2,3.2], yr:[-0.08,top], xlabel:'f', ylabel:'|G(f)|,\\;|H(f)|',
    xtarget:6, ytarget:3, ytickfmt:()=>''}));
  const G = f => Math.exp(-f*f), H = f => Math.exp(-f*f/(b*b));
  const cut = b < 1;
  a.area(f=>Math.max(G(f),H(f)), -3.2, 3.2, {color:(cut ? C.coral : C.muted)+'59'});
  a.area(f=>Math.min(G(f),H(f)), -3.2, 3.2, {color:C.dec.mid});
  a.curve(G, {color:C.in, width:2.4});
  a.curve(H, {color:C.h, width:2.2, dash:'7 5'});
  const r = schwarzRatio(b), ok = Math.abs(b-1) < 0.07;
  const verdict = ok ? '\\text{matched: best possible}'
    : cut ? '\\text{too narrow: pulse cut}' : '\\text{too wide: extra noise}';
  const u = 1/(a.sy(0)-a.sy(1)), y1 = big ? top-18*L*u : 1.2, y2 = big ? y1-23*L*u : 1.06;
  a.note(-3.05, y1, verdict, {tex:true, fs:17, color:ok ? C.mid : (cut ? C.coral : C.muted)});
  a.note(-3.05, y2, `${Math.round(r*100)}\\%\\ \\text{of the best SNR}`, {tex:true, fs:16, color:C.mid});
  return a.svg();
}

/* The ratio of the slide before, eta/(2E/N0) = 2b/(1 + b^2), against the
   width b of |H(f)|. It is 1 at b = 1 and 0.8 at b = 1/2 and at b = 2. */
function figBoundCurve(){
  const a = P.Axes(SZ({xr:[0,3.2], yr:[0,1.25], xlabel:'b', ylabel:'\\eta\\,/\\,(2E/N_0)',
    xticksOverride:[0,0.5,1,2,3], yticksOverride:[0.5,0.8,1]}));
  a.hline(1, {color:C.muted, dash:'5 4'});
  a.note(2.3, 1.1, '\\text{the bound}', {tex:true, fs:14, color:C.muted});
  a.curve(b=>schwarzRatio(b), {color:C.h, width:2.6, n:500});
  [[0.5,0.8],[2,0.8]].forEach(([x,y])=>a.point(x, y, {color:C.h, r:4.5}));
  a.point(1, 1, {color:C.mid, r:5.5});
  a.note(1.06, 1.1, 'b=1', {tex:true, fs:15, color:C.mid});
  return a.svg();
}

/* The matched filter built in two moves on a ramp g(t) = t/T: reverse it in
   time, then shift it right by T. Frame 0 is the pulse; frame 1 is g(-t);
   frame 2 is h(t) = g(T-t). The reversal is drawn as a mirror turning about
   t = 0: every point moves from t to -t, and the mirror line is shown while
   it turns. The shift slides the reversed ramp right, with a bracket of
   length T under it. The earlier stages stay on the axes as faint traces. */
function figMatchedBuild(v){
  const f = frameOf(v, 2), u1 = clamp01(f), u2 = clamp01(f-1);
  const X = t => t*(1-2*u1) + u2;
  const a = P.Axes(SZ({xr:[-1.35,1.35], yr:[-0.2,1.75], xlabel:'t', xunit:'T', ylabel:'\\text{amplitude}', ynameAtAxis:true,
    xticksOverride:[-1,-0.5,0,0.5,1], yticksOverride:[0.5,1]}));
  a.poly([[0,0],[0,0],[1,1],[1,0]], {color:C.in, width:f>0.05?1.6:2.6});
  a.note(1.04, 0.72, 'g(t)', {tex:true, fs:15, color:C.in});
  if(f > 0.02 && f < 1.15) fade(a, Math.min(1, 1.15-f), ()=>{ a.vline(0, {color:C.coral, dash:'6 4', width:1.6});
    a.note(-0.05, 1.36, '\\text{mirror at }t=0', {tex:true, fs:14, color:C.coral, anchor:'end'}); });
  if(u2 > 0.02) a.poly([[0,0],[-1,1],[-1,0]], {color:C.h, width:1.4, dash:'5 5'});
  if(u2 > 0.02) a.span(-1, -1+u2, 1.4, u2 > 0.5 ? '+T' : '', {tex:true, color:C.h, fs:15});
  if(f > 0.05) a.poly([[X(0),0],[X(1),1],[X(1),0]], {color:C.h, width:2.6});
  if(f > 0.9 && u2 < 0.15) a.note(-1.02, 1.12, 'g(-t)', {tex:true, fs:15, color:C.h, anchor:'end'});
  if(u2 > 0.85) a.note(0.05, 1.12, 'h(t)=g(T-t)', {tex:true, fs:15, color:C.h});
  return a.svg();
}

/* The matched-filter output as a sliding overlap, for the ramp g(t) = t/T of
   the slide before, in three panels. The top panel slides h(t - tau) =
   g(T - t + tau), the ramp moved to [t - T, t], across g(tau). The middle
   panel is their product, shaded, with its area. The lower panel draws
   y(t)/E, that area over E = T/3, as far as the slide has gone. For
   0 <= t <= T the area is (1 - t)t^2/2 + t^3/3, so y/E = 1.5t^2 - 0.5t^3, and
   y is even about t = T. Frames 0-3 put the slide at t = 0, T/2, T, 2T. Frame 4 shows
   what happens without the reversal: h = g, at t = T the copy runs the wrong
   way, the product is tau(1 - tau)/T^2 and its area is E/2; the unreversed
   output g * g peaks at 0.83E, at t = sqrt(2)T, not at T. */
const yRev = u => { const w = u<=1 ? u : 2-u; return w<=0 ? 0 : 1.5*w*w-0.5*w*w*w; };
const yUnrev = u => u<=0 ? 0 : u<=1 ? 0.5*u*u*u : u<=2 ? 3*(u/2-1/3-u*(u-1)*(u-1)/2+Math.pow(u-1,3)/3) : 0;
function figConvSweep(v){
  P.hOverride = null;
  const f = frameOf(v, 2), o5 = clamp01(f-3), F = Math.min(f, 3), t = F<=2 ? F/2 : 1+(F-2);
  const big = P.labelScale() > 1, hA = big ? 230 : 130, hB = big ? 230 : 115, hC = big ? 260 : 185;
  const g = u => (u>=0 && u<=1) ? u : 0;
  const a = P.Axes({w:560,h:hA,xr:[-1.2,2.3],yr:[-0.2,1.5],xlabel:'',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:24},xticksOverride:[-1,0,1,2],yticksOverride:[0,1]});
  const b = P.Axes({w:560,h:hB,xr:[-1.2,2.3],yr:[-0.15,1.25],xlabel:'',ylabel:'g(\\tau)\\,h(t-\\tau)',
    pad:{l:56,r:26,t:24,b:24},xticksOverride:[-1,0,1,2],yticksOverride:[0,1]});
  const c = P.Axes({w:560,h:hC,xr:[-1.2,2.3],yr:[-0.2,1.5],xlabel:'t', xunit:'T',ylabel:'y(t)/E',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[-1,0,1,2],yticksOverride:[0,0.5,1]});
  a.poly([[-1.2,0],[0,0],[1,1],[1,0],[2.3,0]], {color:C.in, width:2.4});
  /* the reversed copy, sliding */
  fade(a, 1-o5, ()=>a.poly([[-1.2,0],[t-1,0],[t,1],[t,0],[2.3,0]], {color:C.h, width:2.2, dash:'7 5'}));
  fade(b, 1-o5, ()=>{ const p = u => g(u)*g(1-t+u);
    b.area(p, -1.2, 2.3, {color:C.dec.mid}); b.curve(p, {color:C.mid, width:2.4, n:600});
    b.note(1.45, 0.95, `\\text{area}=${yRev(t).toFixed(2)}E`, {tex:true, fs:15, color:C.mid}); });
  /* frame 5: no reversal, at t = T the copy is g(T - tau), running down */
  fade(a, o5, ()=>a.poly([[-1.2,0],[0,0],[0,1],[1,0],[2.3,0]], {color:C.h, width:2.2, dash:'7 5'}));
  fade(b, o5, ()=>{ const p = u => g(u)*(u>=0 && u<=1 ? 1-u : 0);
    b.area(p, -1.2, 2.3, {color:C.dec.err}); b.curve(p, {color:C.err, width:2.4, n:600});
    b.note(1.45, 0.95, '\\text{area}=0.50E', {tex:true, fs:15, color:C.err}); });
  c.curve(yRev, {color:C.mid, width:1.4, dash:'4 5', opacity:0.5});
  c.curve(u=>u<=t+1e-9 ? yRev(u) : NaN, {color:C.mid, width:2.6, n:700});
  c.point(t, yRev(t), {color:C.mid, r:5});
  if(Math.abs(t-1) < 0.02 && o5 < 0.5) c.note(1.06, 1.24, 'y(T)=E', {tex:true, fs:15, color:C.mid});
  fade(c, o5, ()=>{ c.curve(yUnrev, {color:C.err, width:2.2, dash:'7 5', n:600});
    c.point(1, 0.5, {color:C.err, r:5});
    c.note(2.28, 1.3, 'h=g:\\ y(T)=0.50E', {tex:true, fs:15, color:C.err, anchor:'end'}); });
  return stack(560, [[a.svg(),hA],[b.svg(),hB],[c.svg(),hC]]);
}

/* Two pulses of equal energy on [0, T], and the output of the filter matched
   to each. Every output is the pulse's autocorrelation shifted by T, so both
   peak at t = T with the value E, whatever the shape. */
const SHAPES = [
  t => (t>=0 && t<=1) ? 1 : 0,
  t => (t>=0 && t<=1) ? Math.SQRT2*Math.sin(Math.PI*t) : 0
];
const MF_OUT = {};
function mfOut(k){
  if(!MF_OUT[k]){ const s = SHAPES[k], N = 400, pts = [];
    for(let j=0;j<=240;j++){ const t = 2.4*j/240 - 0.2; let acc = 0;
      for(let i=0;i<N;i++){ const u = (i+0.5)/N; acc += s(u)*s(u+1-t); } pts.push([t, acc/N]); }
    MF_OUT[k] = pts; }
  return MF_OUT[k];
}
function figEqualOutputs(){
  const a = P.Axes(SZ({xr:[-0.2,2.2], yr:[-0.12,1.3], xlabel:'t', xunit:'T', ylabel:'y(t)/E',
    xticksOverride:[0,0.5,1,1.5,2], ytarget:3}));
  a.poly(mfOut(0), {color:C.mid, width:2.4});
  a.poly(mfOut(1), {color:C.mid, width:2.4, dash:'8 5'});
  a.vline(1, {color:C.muted});
  a.point(1, 1, {color:C.mid, r:5});
  a.note(1.06, 1.14, 'y(T)=E', {tex:true, fs:15, color:C.mid});
  return a.svg();
}

/* A gain k on the matched filter of the rectangular pulse of the opening
   slide (E = 1, N0 = 0.08, so 2E/N0 = 25). The signal part is k times the
   triangle, the noise standard deviation is k sqrt(N0 E/2) = 0.2k, and one
   noisy output is the same realisation times k. Every part scales by k, so
   the picture only changes its vertical size, and eta stays 25. */
function figGain(v){
  const k = v && v.k!=null ? v.k : 1, F = FP_FILTERS[2];
  const L = P.labelScale(), big = L>1, top = big ? 5.6 : 4.9;
  const a = P.Axes(SZ({xr:[-0.2,2.3], yr:[-1.2,top], xlabel:'t', xunit:'T', ylabel:'y(t)',
    xticksOverride:[0,1,2], yticksOverride:[-1,0,1,2,3]}));
  const pts = [], N = 250;
  for(let i=0;i<=N;i++){ const t = -0.2+2.5*i/N; pts.push([a.sx(t), a.sy(k*(F.sig(t)+F.sd))]); }
  for(let i=N;i>=0;i--){ const t = -0.2+2.5*i/N; pts.push([a.sx(t), a.sy(k*(F.sig(t)-F.sd))]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(t=>k*(F.sig(t)+F.n(t)), {color:C.mid, width:1.2, opacity:0.4, n:900});
  a.curve(t=>k*F.sig(t), {color:C.mid, width:2.6, n:600});
  a.vline(1, {color:C.muted});
  a.point(1, k, {color:C.mid, r:5});
  const u = 1/(a.sy(0)-a.sy(1)), y1 = big ? top-16*L*u : 4.45, y2 = big ? y1-28*L*u : 3.9,
        y3 = big ? y2-34*L*u : 3.25;
  a.note(2.26, y1, `g_0(T)=kE=${k.toFixed(2)}`, {tex:true, fs:15, color:C.mid, anchor:'end'});
  a.note(2.26, y2, `\\sqrt{E[n^{2}]}=0.20k=${(0.2*k).toFixed(2)}`, {tex:true, fs:15, color:C.muted, anchor:'end'});
  a.note(2.26, y3, `\\eta=\\frac{(${k.toFixed(2)})^{2}}{(${(0.2*k).toFixed(2)})^{2}}=25`, {tex:true, fs:15, color:C.mid, anchor:'end'});
  return a.svg();
}

/* The matched filter in frequency, for the ramp g(t) = sqrt(3) t/T on [0, T]
   (E = 1, T = 1), with k = 1. With w = 2 pi f,
   G(f) = sqrt(3)[e^{-jw}(1 + jw) - 1]/w^2, so |G| peaks at sqrt(3)/2 at f = 0
   and is never zero. |H| = |G|, and angle H = -angle G - 2 pi f T, so
   angle G + angle H = -2 pi f T: the output spectrum is |G|^2 delayed by T.
   Phases are unwrapped from f = 0 and drawn over pi; angle G spans +/-3.5 pi
   on |fT| <= 2, angle H only +/-0.5 pi. Frames: the magnitudes, angle G,
   angle H, their sum. */
const rampG = f => { const w = 2*Math.PI*f, r3 = Math.sqrt(3);
  if(Math.abs(w) < 1e-6) return [r3/2, -r3*w/3];
  const c = Math.cos(w), s = Math.sin(w);
  return [r3*(c + w*s - 1)/(w*w), r3*(w*c - s)/(w*w)]; };
const MFF = (()=>{ const N = 440, F = [], mag = [], ph = new Array(N+1);
  for(let i=0;i<=N;i++){ const f = -2.2 + 4.4*i/N, g = rampG(f); F.push(f); mag.push(Math.hypot(g[0], g[1])); ph[i] = Math.atan2(g[1], g[0]); }
  const c = N/2; ph[c] = 0;
  for(let i=c+1;i<=N;i++){ let d = ph[i]-ph[i-1]; d -= 2*Math.PI*Math.round(d/(2*Math.PI)); ph[i] = ph[i-1]+d; }
  for(let i=c-1;i>=0;i--){ let d = ph[i]-ph[i+1]; d -= 2*Math.PI*Math.round(d/(2*Math.PI)); ph[i] = ph[i+1]+d; }
  return {F, mag, ph}; })();
function figMfFreq(v){
  P.hOverride = null;
  const f = frameOf(v, 3), oG = clamp01(f), oH = clamp01(f-1), oS = clamp01(f-2);
  const big = P.labelScale() > 1, hA = big ? 260 : 185, hB = big ? 300 : 245;
  const a = P.Axes({w:560,h:hA,xr:[-2.2,2.2],yr:[0,1.12],xlabel:'',ylabel:'|G(f)|,\\;|H(f)|',
    pad:{l:56,r:26,t:24,b:big ? 40 : 24},xticksOverride:[-2,-1,0,1,2],yticksOverride:[0.5,1]});
  const b = P.Axes({w:560,h:hB,xr:[-2.2,2.2],yr:[-4.6,4.6],xlabel:'fT',ylabel:'\\text{phase}/\\pi',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[-2,-1,0,1,2],yticksOverride:[-4,-2,0,2,4]});
  const {F, mag, ph} = MFF, pts = fn => F.map((x,i)=>[x, fn(i)]);
  a.poly(pts(i=>mag[i]), {color:C.in, width:2.8});
  a.poly(pts(i=>mag[i]), {color:C.h, width:2.2, dash:'7 6'});
  a.note(0.32, 0.95, '|H|=|G|', {tex:true, fs:15, color:C.h});
  fade(b, oG, ()=>b.poly(pts(i=>ph[i]/Math.PI), {color:C.in, width:2.4}));
  fade(b, oH, ()=>b.poly(pts(i=>(-ph[i]-2*Math.PI*F[i])/Math.PI), {color:C.h, width:2.4, dash:'7 6'}));
  fade(b, oS, ()=>{ b.curve(x=>-2*x, {color:C.mid, width:2.8, n:4});
    b.note(-0.4, -3.2, '\\angle G+\\angle H=-2\\pi fT', {tex:true, fs:15, color:C.mid, anchor:'end'}); });
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The correlator against the matched filter, for the noiseless ramp
   g(t) = t/T (T = 1, E = 1/3). The correlator multiplies x = g by g and
   integrates from 0, so z(t)/E = t^3 on [0, T]; it is read at T and reset
   (integrate and dump). The matched-filter output y(t)/E = 1.5t^2 - 0.5t^3
   is another curve: z(T/2) = 0.13E, y(T/2) = 0.31E, and both are E at t = T.
   Frames 0-2 run the integration to t = 0, T/2, T; frame 3 adds y(t). */
function figMfCorr(v){
  P.hOverride = null;
  const f = frameOf(v, 3), t = Math.min(f, 2)/2, o3 = clamp01(f-2);
  const big = P.labelScale() > 1, hA = big ? 250 : 150, hB = big ? 290 : 215;
  const a = P.Axes({w:560,h:hA,xr:[-0.2,2.2],yr:[-0.15,1.35],xlabel:'',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:24},xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[0,1]});
  const b = P.Axes({w:560,h:hB,xr:[-0.2,2.2],yr:[-0.15,1.4],xlabel:'t', xunit:'T',ylabel:'\\text{output}/E',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[0,0.5,1]});
  const g = u => (u>=0 && u<=1) ? u : 0, p = u => g(u)*g(u);
  a.poly([[-0.2,0],[0,0],[1,1],[1,0],[2.2,0]], {color:C.in, width:2.4});
  if(t > 0.005) a.area(p, 0, t, {color:C.dec.mid, n:300});
  a.curve(p, {color:C.mid, width:2.2, n:400});
  a.vline(t, {color:C.muted});
  a.note(1.06, 0.62, 'x(\\tau)g(\\tau)', {tex:true, fs:15, color:C.mid});
  b.curve(u=>u>=0 && u<=t+1e-9 ? u*u*u : NaN, {color:C.mid, width:2.6, n:500});
  b.point(t, t*t*t, {color:C.mid, r:5});
  if(t > 0.98) b.poly([[1,1],[1,0],[2.2,0]], {color:C.mid, width:1.6, dash:'3 4'});
  fade(b, o3, ()=>{ b.curve(yRev, {color:C.mid, width:2.2, dash:'8 6', n:600});
    b.point(0.5, 0.125, {color:C.mid, r:4}); b.point(0.5, yRev(0.5), {color:C.mid, r:4});
    b.note(0.44, 0.42, '0.31E', {tex:true, fs:14, color:C.mid, anchor:'end'});
    b.note(0.6, 0.06, '0.13E', {tex:true, fs:14, color:C.mid}); });
  if(t > 0.98) b.note(1.06, 1.18, o3 > 0.5 ? 'z(T)=y(T)=E' : 'z(T)=E', {tex:true, fs:15, color:C.mid});
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* Sampling early or late, for the rectangular pulse of the opening slides
   (E = 1, N0 = 0.08, k = 1): the matched output is the triangle, the noise
   band is +/-0.2 at every t, and eta(t0)/(2E/N0) = (1 - |t0 - T|/T)^2. */
function figTiming(v){
  P.hOverride = null;
  const t0 = v && v.t0!=null ? v.t0 : 1.1, r = Math.pow(Math.max(0, 1-Math.abs(t0-1)), 2);
  const big = P.labelScale() > 1, hA = big ? 270 : 215, hB = big ? 270 : 215;
  const a = P.Axes({w:560,h:hA,xr:[-0.2,2.2],yr:[-0.4,1.4],xlabel:'',ylabel:'y(t)/E',
    pad:{l:56,r:26,t:24,b:24},xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[0,0.5,1]});
  const b = P.Axes({w:560,h:hB,xr:[-0.2,2.2],yr:[-0.1,1.35],xlabel:'t_0', xunit:'T',ylabel:'\\eta(t_0)\\,/\\,(2E/N_0)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[0,0.5,1]});
  const pts = [], N = 240;
  for(let i=0;i<=N;i++){ const t = -0.2+2.4*i/N; pts.push([a.sx(t), a.sy(mfSig(t)+0.2)]); }
  for(let i=N;i>=0;i--){ const t = -0.2+2.4*i/N; pts.push([a.sx(t), a.sy(mfSig(t)-0.2)]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(mfSig, {color:C.mid, width:2.6, n:400});
  a.vline(t0, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.point(t0, mfSig(t0), {color:C.mid, r:5});
  b.curve(t=>Math.pow(Math.max(0, 1-Math.abs(t-1)), 2), {color:C.mid, width:2.6, n:500});
  /* in projector mode the line stops under the enlarged eta readout */
  if(big){ const L = P.labelScale(), yt = 1.2-18*L/(b.sy(0)-b.sy(1));
    b.raw(`<line x1="${b.sx(t0).toFixed(2)}" y1="${b.sy(yt).toFixed(2)}" x2="${b.sx(t0).toFixed(2)}" y2="${b.sy(-0.1).toFixed(2)}" stroke="${C.ink}" stroke-width="${(1.6*(1+(L-1)*0.75)).toFixed(2)}" stroke-dasharray="6 4"/>`); }
  else b.vline(t0, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  b.point(t0, r, {color:C.mid, r:5});
  const db = r > 1e-3 ? `\\;(${(10*Math.log10(r)).toFixed(2)}\\ \\text{dB})` : '';
  b.note(2.16, 1.2, etaNote(r) + db, {tex:true, fs:15, color:C.mid, anchor:'end'});
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The sample y(T) of the matched filter for polar bits, k = 1, E = 1,
   N0 = 0.5: y(T) = +/-1 + n with n Gaussian, standard deviation
   sqrt(N0 E/2) = 0.5, the numbers of the decision section. Histograms of the
   first n samples, as densities on bins 0.2 wide; n moves on a log scale,
   50 -> 500 -> 5000. The last frame lays the two Gaussian densities over the
   bars and shades the part of the +1 density below 0, Q(2) = 0.023. */
const SD_S = 0.5, SD_BW = 0.2, SD_LO = -3;
const SD_N1 = gauss(20261015, 5000, SD_S), SD_N0 = gauss(20261016, 5000, SD_S);
function sdBins(z, m, n){ const c = new Array(30).fill(0);
  for(let i=0;i<n;i++){ const k = Math.floor((m+z[i]-SD_LO)/SD_BW); if(k>=0 && k<30) c[k]++; }
  return c.map(x=>x/(n*SD_BW)); }
function figSampleDist(v){
  const f = frameOf(v, 3), n = Math.round(50*Math.pow(10, Math.min(f, 2))), o3 = clamp01(f-2);
  const a = P.Axes(SZ({xr:[-3,3], yr:[-0.04,1.3], xlabel:'y(T)', ylabel:'\\text{density}',
    xticksOverride:[-2,-1,0,1,2], yticksOverride:[0.4,0.8,1.2], ytickfmt:()=>''}));
  const bars = (c, fill, dash) => c.forEach((h,k)=>{ if(h <= 0) return;
    const x = a.sx(SD_LO+k*SD_BW), w = a.sx(SD_LO+(k+1)*SD_BW)-x, y = a.sy(Math.min(h, 1.3));
    a.raw(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(a.sy(0)-y).toFixed(1)}" fill="${fill}" stroke="${C.mid}" stroke-width="1.2"${dash ? ' stroke-dasharray="4 3"' : ''}/>`); });
  bars(sdBins(SD_N0, -1, n), 'none', true);
  bars(sdBins(SD_N1, 1, n), C.dec.mid, false);
  fade(a, o3, ()=>{ a.area(y=>dens(y, 1, SD_S), -3, 0, {color:C.dec.err});
    a.curve(y=>dens(y, -1, SD_S), {color:C.mid, width:2.4, dash:'8 5'});
    a.curve(y=>dens(y, 1, SD_S), {color:C.mid, width:2.6});
    a.note(0.1, 0.55, 'Q(2)', {tex:true, fs:15, color:C.err}); });
  a.note(-2.9, 1.18, `n=${n}`, {tex:true, fs:15, color:C.ink});
  return a.svg();
}

/* Worked example: the pulse g(t) = A on [0, T] and, as the answer, the output
   of its matched filter, both scaled so the axes are the same for the two.
   Frames 0-2 build h(t) = g(T - t) from g(t): shift left by T to g(t + T),
   then mirror about t = 0. For a rectangle the result is the pulse again. */
function figExMf(v){
  const f = frameOf(v, 3), u1 = clamp01(f), u2 = clamp01(f-1), u3 = clamp01(f-2);
  const X = t => (t-u1)*(1-2*u2);
  const TL = {'-1':'-T','0':'0','0.5':'T/2','1':'T','1.5':'3T/2','2':'2T'};
  const a = P.Axes(SZ({xr:[-1.4,2.4], yr:[-0.12,1.45], xlabel:'t', ylabel:'',
    xticksOverride:[-1,0,0.5,1,1.5,2], xtickfmt:v=>TL[String(v)]||'', yticksOverride:[1], ytickfmt:()=>'A'}));
  fade(a, 1-u3, ()=>{
    a.poly([[-1.4,0],[0,0],[0,1],[1,1],[1,0],[2.4,0]], {color:C.ink, width:1.6});
    if(f < 0.02) a.note(0.06, 1.1, 'g(t)', {tex:true, fs:14, color:C.ink});
    if(u1 > 0.02 && u2 < 0.98) fade(a, 1-u2, ()=>a.span(-u1, 0, 1.3, u1 > 0.5 ? '-T' : '', {tex:true, color:C.h, fs:15}));
    if(u2 > 0.02 && u2 < 0.98) fade(a, Math.sin(Math.PI*u2), ()=>{ a.vline(0, {color:C.coral, width:1.6});
      a.note(-0.05, 1.3, '\\text{mirror at }t=0', {tex:true, fs:14, color:C.coral, anchor:'end'}); });
    if(f > 0.02){ const x0 = X(0), x1 = X(1), l = Math.min(x0, x1), r = Math.max(x0, x1);
      a.poly([[-1.4,0],[l,0],[l,1],[r,1],[r,0],[2.4,0]], {color:C.h, width:2.6}); }
    if(f > 0.9 && u2 < 0.15) a.note(-0.5, 1.1, 'g(t+T)', {tex:true, fs:15, color:C.h, anchor:'middle'});
    if(u2 > 0.85) a.note(0.5, 1.1, 'h(t)=g(T-t)', {tex:true, fs:15, color:C.h, anchor:'middle'});
  });
  fade(a, u3, ()=>{ a.poly([[-0.2,0],[0,0],[1,1],[2,0],[2.4,0]], {color:C.mid, width:2.6});
    a.point(1, 1, {color:C.mid, r:5});
    a.note(1.08, 1.12, 'y(T)=A^{2}T', {tex:true, fs:15, color:C.mid}); });
  return a.svg();
}

/* ---- 2.3 the demodulator -------------------------------------------------- */

/* Three unit-energy basis pulses on one bit, T_b = 1: the rectangle, the
   Manchester pulse (+1 on the first half, -1 on the second, as in Module 1)
   and a pulse of three steps (+1, -1, +1 on [0, 1/4), [1/4, 1/2), [1/2, 1)).
   Each has |psi| = 1 on the bit, so each has unit energy. */
const PSI = {
  rect: t => (t>=0 && t<1) ? 1 : 0,
  man:  t => (t>=0 && t<1) ? (t<0.5 ? 1 : -1) : 0,
  step: t => (t>=0 && t<1) ? (t<0.25 || t>=0.5 ? 1 : -1) : 0
};
/* The autocorrelation R(s) = int psi(tau) psi(tau + s) dtau. Each pulse is
   constant on quarters of the bit, so R is linear between multiples of 1/4
   and is tabulated there exactly. The matched-filter output of s_m psi(t) is
   s_m R(t - T_b). */
const psiR = key => { const p = PSI[key], v = [];
  for(let k=-4;k<=4;k++){ let s = 0; for(let q=0;q<4;q++){ const u = q/4+1/8; s += p(u)*p(u+k/4); } v.push(s/4); }
  return s => { if(s <= -1 || s >= 1) return 0; const x = (s+1)*4, k = Math.min(7, Math.floor(x)), f = x-k;
    return (1-f)*v[k] + f*v[k+1]; }; };
const PSI_R = {rect:psiR('rect'), man:psiR('man'), step:psiR('step')};
const rectPts = (h, x1=1.45) => [[-0.3,0],[0,0],[0,h],[1,h],[1,0],[x1,0]];
/* a label shown near frame k only, fully at k and gone half a frame away */
const near = (f, k) => clamp01(1-2*Math.abs(f-k));

/* The unit-energy basis on a t/T_b axis. Frame 0 is psi(t), of height
   1/sqrt(T_b), drawn 1.5; frame 1 squares it to 1/T_b, drawn 2.25 (so
   T_b = 1/2.25 s here); frame 2 sweeps the area under psi^2 from 0 to T_b,
   and the readout int_0^t psi^2 = t/T_b ends at 1. */
function figBasisUnit(v){
  const f = frameOf(v, 0), u1 = clamp01(f), u2 = clamp01(f-1);
  const H1 = 1.5, H2 = 2.25, h = H1+u1*(H2-H1);
  const a = P.Axes(SZ({xr:[-0.3,1.45], yr:[-0.3,2.9], xlabel:'t', xunit:'T_b', ylabel:'\\text{amplitude}', ynameAtAxis:true,
    xticksOverride:[0,0.5,1], yticksOverride:[], ytarget:3}));
  if(u2 > 0.005) a.area(()=>h, 0, u2, {color:C.dec.mid});
  a.poly(rectPts(h), {color:u1 < 0.5 ? C.h : C.mid, width:2.6});
  fade(a, 1-u1, ()=>a.note(0.5, H1+0.3, '\\psi(t)=1/\\sqrt{T_b}', {tex:true, fs:16, color:C.h, anchor:'middle'}));
  fade(a, u1, ()=>a.note(0.5, H2+0.3, '\\psi^{2}(t)=1/T_b', {tex:true, fs:16, color:C.mid, anchor:'middle'}));
  fade(a, u2, ()=>a.note(0.5, 1.0, `\\int_0^{t}\\psi^{2}(\\tau)\\,d\\tau=${u2.toFixed(2)}`, {tex:true, fs:16, color:C.mid, anchor:'middle'}));
  return a.svg();
}

/* Antipodal signalling with T_b = 1, the basis drawn at height 1 and A = 1.5.
   The cyan trace is c psi(t): c runs 1 -> A (frame 1, s_1) -> -A (frame 2,
   s_0), so the scaling and the sign flip are seen as moves of one shape. */
function figAntipodal(v){
  const f = frameOf(v, 0), A = 1.5;
  const c = f <= 1 ? 1+(A-1)*clamp01(f) : A-2*A*clamp01(f-1);
  const a = P.Axes(SZ({xr:[-0.3,1.45], yr:[-2.2,2.3], xlabel:'t', xunit:'T_b', ylabel:'\\text{amplitude}', ynameAtAxis:true,
    xticksOverride:[0,0.5,1], yticksOverride:[-1.5,-1,0,1,1.5], ytickfmt:()=>''}));
  a.poly(rectPts(1), {color:C.h, width:2.2});
  if(f > 1.01) fade(a, 0.4, ()=>a.poly(rectPts(A), {color:C.in, width:2.2}));
  fade(a, clamp01(f), ()=>a.poly(rectPts(c), {color:c < 0 ? C.mid : C.in, width:2.6, dash:c < 0 ? '8 5' : null}));
  /* in projector mode the label is centred between the axis and the top of psi */
  const L = P.labelScale(), yp = L>1 ? 0.5-4*L/(a.sy(0)-a.sy(1)) : 0.55;
  a.note(0.5, yp, '\\psi(t)', {tex:true, fs:16, color:C.h, anchor:'middle'});
  fade(a, f < 1.5 ? near(f, 1) : 0.4, ()=>a.note(0.5, A+0.3, 's_1(t)=+A\\sqrt{T_b}\\,\\psi(t)=+A', {tex:true, fs:15, color:C.in, anchor:'middle'}));
  fade(a, near(f, 2), ()=>a.note(0.5, -A-0.4, 's_0(t)=-A\\sqrt{T_b}\\,\\psi(t)=-A', {tex:true, fs:15, color:C.mid, anchor:'middle'}));
  return a.svg();
}

/* The two waveforms as two points. Frame 0: s_1(t) and s_0(t). Frame 1: the
   products s_m(t) psi(t), whose areas (swept in) are the coefficients
   +-sqrt(E_b). Frame 2: the two coefficients move out from 0 to their places
   on the axis of psi. Frame 3: the distance 2 sqrt(E_b). */
function figSignalSpace(v){
  P.hOverride = null;
  const f = frameOf(v, 0), u1 = clamp01(f), u2 = clamp01(f-1), u3 = clamp01(f-2);
  const big = P.labelScale() > 1, hA = big ? 290 : 230, hB = big ? 230 : 180;
  const a = P.Axes({w:560,h:hA,xr:[-0.3,1.45],yr:[-2.2,2.2],xlabel:'t', xunit:'T_b',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[0,0.5,1],yticksOverride:[],ytarget:2});
  if(u1 > 0.005){ a.area(()=>1.5, 0, u1, {color:C.dec.mid}); a.area(()=>-1.5, 0, u1, {color:C.dec.mid}); }
  a.poly(rectPts(1.5), {color:C.in, width:2.4});
  a.poly(rectPts(-1.5), {color:C.in, width:2.4, dash:'8 5'});
  a.note(1.05, 1.5, 's_1(t)', {tex:true, fs:15, color:C.in});
  a.note(1.05, -1.5, 's_0(t)', {tex:true, fs:15, color:C.in});
  fade(a, clamp01(2*u1-1), ()=>{ a.note(0.27, 0.65, '+\\sqrt{E_b}', {tex:true, fs:16, color:C.mid, anchor:'middle'});
    a.note(0.27, -1.1, '-\\sqrt{E_b}', {tex:true, fs:16, color:C.mid, anchor:'middle'}); });
  const b = P.Axes({w:560,h:hB,xr:[-2,2],yr:[-1,1.2],xlabel:'\\text{axis of }\\psi(t)',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[],yticksOverride:[],grid:false,arrows:false,zeroAxes:false});
  b.poly([[-2,0],[2,0]], {color:C.axis, width:1.5});
  fade(b, u2, ()=>{ b.point(-1.4*u2, 0, {color:C.in, r:7}); b.point(1.4*u2, 0, {color:C.in, r:7}); });
  fade(b, clamp01(2*u2-1), ()=>{ b.note(-1.4, -0.6, 's_0=-\\sqrt{E_b}', {tex:true, fs:16, color:C.in, anchor:'middle'});
    b.note(1.4, -0.6, 's_1=+\\sqrt{E_b}', {tex:true, fs:16, color:C.in, anchor:'middle'}); });
  fade(b, u3, ()=>b.span(-1.4, 1.4, 0.62, 'd=2\\sqrt{E_b}', {tex:true, fs:15, color:C.muted}));
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The matched filter at work on one noiseless bit, s_m = 1, rectangular psi,
   T_b = 1. Frame k puts the output time at t = k/2. Top: s_m psi(tau) and the
   reversed, shifted filter h(t - tau) = psi(T_b - t + tau); their overlap is
   shaded. Below: y(t), the overlap area, traced up to t. It is non-zero on
   (0, 2T_b) and peaks at T_b. */
const tri1 = t => Math.max(0, 1-Math.abs(t-1));
function figDemodConv(v){
  P.hOverride = null;
  const f = frameOf(v, 0), t = f/2;
  const big = P.labelScale() > 1, hA = big ? 270 : 205, hB = big ? 290 : 225;
  const a = P.Axes({w:560,h:hA,xr:[-1.2,2.3],yr:[-0.3,1.75],xlabel:'\\tau', xunit:'T_b',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[-1,0,1,2],yticksOverride:[0,1]});
  const lo = Math.max(0, t-1), hi = Math.min(1, t);
  if(hi-lo > 0.005) a.area(()=>1, lo, hi, {color:C.dec.mid});
  a.poly([[-1.2,0],[0,0],[0,1],[1,1],[1,0],[2.3,0]], {color:C.in, width:2.4});
  a.poly([[-1.2,0],[t-1,0],[t-1,1],[t,1],[t,0],[2.3,0]], {color:C.h, width:2.2, dash:'7 5'});
  a.note(0.5, 1.2, 's_m\\psi(\\tau)', {tex:true, fs:15, color:C.in, anchor:'middle'});
  /* the label puts the output time in place of t: h(T_b/2-tau) at rest, two decimals between */
  const k = Math.round(2*t), tl = Math.abs(2*t-k) < 0.01
    ? ['','T_b/2','T_b','3T_b/2','2T_b'][k] : `${t.toFixed(2)}T_b`;
  /* the label (about 0.8 T_b wide) steps to whichever side of the vertical axis is nearer rather than cross it */
  let lx = t-0.95; if(lx < 0.08 && lx+0.8 > -0.08) lx = lx+0.4 < 0 ? -0.9 : 0.08;
  a.note(lx, 1.55, `h(${tl}-\\tau)`, {tex:true, fs:15, color:C.h});
  const b = P.Axes({w:560,h:hB,xr:[-1.2,2.3],yr:[-0.2,1.5],xlabel:'t', xunit:'T_b',ylabel:'y(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[-1,0,1,2],yticksOverride:[0,0.5,1]});
  b.curve(s=>s <= t+1e-9 ? tri1(s) : NaN, {color:C.mid, width:2.6, n:700});
  b.vline(1, {color:C.muted});
  b.point(t, tri1(t), {color:C.mid, r:5});
  b.note(-1.1, 1.25, `y(t)=${tri1(t).toFixed(2)}`, {tex:true, fs:16, color:C.mid});
  fade(b, clamp01(f-3), ()=>{ b.span(0, 2, 1.18, '', {color:C.muted});
    b.note(0.45, 1.3, '0<t<2T_b', {tex:true, fs:15, color:C.muted, anchor:'middle'}); });
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The demodulator on one noisy bit: s_m = +1, rectangular psi, T_b = 1, and
   coarse Gaussian noise (samples every 0.04, standard deviation 0.75). The
   output y(t) is the running integral of x over (t - 1, t). Frame 0: the
   input. Frame 1: the output, swept from 0 to 2T_b, over the dashed signal
   part. Frame 2: the sample y(T_b) = s_m + n; with this seed n = -0.22. */
const DM_W = noiseFn(30, 0.04, 0.75, -1, 3);
const DM_X = t => (t>=0 && t<=1) ? 1 + DM_W(t) : 0;
const DM_Y = (()=>{ const N = 600, o = []; for(let j=0;j<=200;j++){ const t = 2*j/200; let s = 0;
  for(let i=0;i<N;i++){ const u = (i+0.5)/N; if(u <= t && u >= t-1) s += DM_X(u); } o.push([t, s/N]); } return o; })();
/* The same noisy bit, its output split in two. Frame 0: the input x(t).
   Frame 1: the signal part s_m psi * h, the triangle. Frame 2: the noise part
   n(t) = w * h on its own, the output minus the triangle. Frame 3: their sum
   y(t). */
function figDemodSplit(v){
  P.hOverride = null;
  const f = frameOf(v, 0), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  const big = P.labelScale() > 1, hA = big ? 260 : 190, hB = big ? 300 : 230;
  const a = P.Axes({w:560,h:hA,xr:[-0.15,2.2],yr:[-1.4,3.0],xlabel:'t', xunit:'T_b',ylabel:'x(t)',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[0,1,2],yticksOverride:[-1,0,1,2]});
  a.curve(t=>t>=0 && t<=1 ? DM_X(t) : NaN, {color:C.out, width:1.4, n:900});
  a.poly([[-0.15,0],[0,0],[0,1],[1,1],[1,0],[2.2,0]], {color:C.in, width:2.2});
  const b = P.Axes({w:560,h:hB,xr:[-0.3,2.2],yr:[-0.6,1.5],xlabel:'t', xunit:'T_b',ylabel:'y(t)',
    pad:{l:56,r:26,t:34,b:42},xticksOverride:[0,1,2],yticksOverride:[0,0.5,1]});
  const nz = DM_Y.map(p=>[p[0], p[1]-tri1(p[0])]);
  fade(b, o1*(1-0.5*o3), ()=>b.poly([[-0.3,0],[0,0],[1,1],[2,0],[2.2,0]], {color:C.mid, width:2.4, dash:o3 > 0.5 ? '6 5' : null}));
  fade(b, o2*(1-o3), ()=>b.poly(nz, {color:C.muted, width:2.0}));
  fade(b, o3, ()=>b.poly(DM_Y, {color:C.mid, width:2.6}));
  fade(b, o1*(1-o3), ()=>b.note(1.1, 1.08, '\\text{signal part}', {tex:true, fs:15, color:C.mid}));
  fade(b, o2*(1-o3), ()=>b.note(1.45, -0.42, 'n(t)', {tex:true, fs:15, color:C.muted}));
  fade(b, o3, ()=>b.note(1.1, 1.08, 'y(t)', {tex:true, fs:15, color:C.mid}));
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The demodulator on one noisy bit. The slider sets N0: the drawn noise,
   samples of s.d. 0.75 every 0.04 T_b, integrates against psi to a variance
   of 0.75^2 x 0.04 = N0/2 with N0 = 0.045, so at N0 = DM_N0 the trace is the
   one drawn; any other N0 scales the same draw, and with it n, by
   sqrt(N0/DM_N0). The signal part, the dashed triangle, does not move. */
const DM_N0 = 0.045;
/* A legend entry drawn inside the axes, for a panel that sits below another
   drawing, where a legend card would land on the drawing above: a short line
   ending 6 px left of x at the height of the name's middle, then its TeX
   name at x. */
function keyEntry(a, x, y, tex, col, o){
  const px = 1/(a.sx(1)-a.sx(0)), yl = y + 5*P.labelScale()/(a.sy(0)-a.sy(1));
  a.poly([[x-24*px,yl],[x-6*px,yl]], {color:col, width:o.width||2.2, dash:o.dash||null});
  a.note(x, y, tex, {tex:true, fs:15, color:col});
}
function figMfDemod(v){
  P.hOverride = null;
  const f = frameOf(v, 0), u1 = clamp01(f), u2 = clamp01(f-1);
  const k = Math.sqrt((v && v.n0!=null ? v.n0 : DM_N0)/DM_N0);
  const xk = t => 1 + k*DM_W(t), yk = DM_Y.map(([t, y])=>[t, tri1(t) + k*(y - tri1(t))]);
  const top = P.blocks({w:560,h:130,items:[
    {t:'arrow',x1:16,y1:58,x2:150,y2:58,label:'x(t)',tex:true,color:C.out},
    {t:'box',x:150,y:26,w:150,h:64,label:'\\psi(T_b-t)',tex:true,color:C.h},
    {t:'arrow',x1:300,y1:58,x2:396,y2:58,label:'y(t)',tex:true,color:C.mid},
    {t:'line',d:'M396,58 h24'}, {t:'line',d:'M420,58 l20,-14'},
    {t:'arrow',x1:448,y1:58,x2:548,y2:58,label:'y(T_b)',tex:true,color:C.mid},
    {t:'text',x:430,y:104,label:'t=T_b',tex:true,fs:14}
  ]});
  const big = P.labelScale() > 1, hA = big ? 320 : 260;
  const a = P.Axes({w:560,h:hA,xr:[-0.15,2.2],yr:[-1.4,3.4],xlabel:'t', xunit:'T_b',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[-1,0,1,2]});
  a.curve(t=>t>=0 && t<=1 ? xk(t) : NaN, {color:C.out, width:1.4, n:900, opacity:(1-0.55*u1).toFixed(3)});
  a.poly(rectPts(1, 2.2).map(p=>[Math.max(p[0],-0.15), p[1]]), {color:C.in, width:2.2});
  fade(a, u1, ()=>a.poly([[-0.15,0],[0,0],[1,1],[2,0],[2.2,0]], {color:C.mid, width:1.6, dash:'6 5'}));
  const T = 2*u1; if(T > 0.01) a.poly(yk.filter(p=>p[0] <= T+1e-9), {color:C.mid, width:2.6});
  a.vline(1, {color:C.muted});
  const yT = yk[100][1];
  fade(a, u2, ()=>{ a.point(1, 1, {color:C.ink, r:3.5}); a.point(1, yT, {color:C.mid, r:5.5});
    if(Math.abs(yT-1) > 0.01) a.poly([[1.07,1],[1.07,yT]], {color:C.muted, width:2.4});
    a.note(1.06, 1.2, `y(T_b)=s_m+n,\\;\\; n=${(yT-1).toFixed(2)}`, {tex:true, fs:16, color:C.mid}); });
  { const L = P.labelScale(), px = 1/(a.sx(1)-a.sx(0)), x3 = 2.17-26*L*px, x2 = x3-86*L*px, x1 = x2-64*L*px;
    keyEntry(a, x1, 3.15, 'x(t)', C.out, {width:1.4});
    keyEntry(a, x2, 3.15, 's_m\\psi(t)', C.in, {});
    fade(a, u1, ()=>keyEntry(a, x3, 3.15, 'y(t)', C.mid, {width:2.6})); }
  return stack(560, [[top,130],[a.svg(),hA]]);
}

/* Five unit-energy pulses g(t) = s_m psi(t), T_b = 1: polar 1 and 0, the
   Manchester 1 and 0, and the pulse of three steps. The filter is always
   matched to psi, so it is the same for the 1 and the 0 of a code. Between
   frames the pulse, the filter and the output blend into the next. The slider
   sets t. Top: g(tau), the reversed and shifted filter h(t - tau) =
   psi(tau + T_b - t), and their product shaded. Below: the noiseless output
   s_m R(t - T_b), drawn solid up to t, which reads s_m = +-1 at t = T_b for
   every shape. */
const SH = [['rect',1],['rect',-1],['man',1],['man',-1],['step',1]];
function figDemodShapes(v){
  P.hOverride = null;
  const f = frameOf(v, 0), i = Math.min(3, Math.floor(f)), u = clamp01(f-i);
  const [ka, sa] = SH[i], [kb, sb] = SH[i+1];
  const mix = (p, q) => t => (1-u)*p(t)+u*q(t);
  const g = mix(t=>sa*PSI[ka](t), t=>sb*PSI[kb](t));
  const h = mix(t=>PSI[ka](1-t), t=>PSI[kb](1-t));
  const y = mix(t=>sa*PSI_R[ka](t-1), t=>sb*PSI_R[kb](t-1));
  const T = v && v.t!=null ? v.t : 1, hs = tau => h(T-tau);
  const big = P.labelScale() > 1, hA = big ? 270 : 170, hB = big ? 300 : 195;
  const a = P.Axes({w:560,h:hA,xr:[-0.2,2.2],yr:[-1.5,1.5],xlabel:'\\tau', xunit:'T_b',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[0,1,2],yticksOverride:[-1,0,1]});
  a.area(tau=>g(tau)*hs(tau), -0.2, 2.2, {color:C.mid+'40', n:1200});
  a.curve(hs, {color:C.h, width:2.2, dash:'7 5', n:1200});
  a.curve(g, {color:C.in, width:2.6, n:1200});
  const b = P.Axes({w:560,h:hB,xr:[-0.2,2.2],yr:[-1.4,1.6],xlabel:'t', xunit:'T_b',ylabel:'y(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,1,2],yticksOverride:[-1,-0.5,0,0.5,1]});
  b.curve(y, {color:C.mid+'73', width:1.6, dash:'6 5', n:800});
  b.curve(t=>t <= T ? y(t) : NaN, {color:C.mid, width:2.6, n:800});
  b.vline(1, {color:C.muted});
  const s = y(T), on = Math.abs(T-1) < 0.011;
  const val = Math.abs(Math.abs(s)-1) < 0.02 ? (s > 0 ? '+1' : '-1') : (s >= 0 ? '+' : '')+s.toFixed(2);
  b.point(T, s, {color:C.mid, r:5});
  b.note(0.06, 1.38,
    `${on ? 'y(T_b)' : 'y('+T.toFixed(2)+')'}=${val}`, {tex:true, fs:16, color:C.mid});
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* Ten bits, 0 1 0 1 1 0 0 1 0 0, sent as polar NRZ (and, in the last frame,
   as Manchester pulses) with T_b = 1 and Gaussian noise of standard deviation
   1.8 on samples every 0.02. The matched filter of psi gives y(t); the
   noiseless output y0(t) is the sum of one shaped pulse per bit, each zero at
   the sampling instants of its neighbours. With this seed every sample keeps
   its sign: the smallest margin s_m y(kT_b) is 0.51 (polar) and 0.73
   (Manchester), and the sample noise has an RMS of 0.20 and 0.24. Frames:
   bits, received x(t), y0(t), y(t), its samples at t = kT_b, Manchester.
   The slider sets t: the filter h(t - tau) covers [t - T_b, t] on the top
   axes, its product with the signal part g is shaded, and the outputs are
   solid up to t and faint after it. */
const TR_B = [0,1,0,1,1,0,0,1,0,0];
const TR_W = noiseFn(20261020, 0.02, 1.8, -1, 12);
const TR = (()=>{ const out = {};
  ['rect','man'].forEach(key => { const p = PSI[key];
    const g = t => { const k = Math.floor(t); return (k>=0 && k<10) ? (TR_B[k] ? 1 : -1)*p(t-k) : 0; };
    const x = t => g(t) + ((t>=0 && t<10) ? TR_W(t) : 0);
    const dt = 0.005, y0 = [], y = [];
    for(let j=0;j<=560;j++){ const t = j*0.02; let s0 = 0, s1 = 0;
      for(let i=0;i<200;i++){ const tau = t-1+(i+0.5)*dt, hh = p(1-t+tau); if(!hh) continue;
        s0 += g(tau)*hh*dt; s1 += x(tau)*hh*dt; }
      y0.push([t, s0]); y.push([t, s1]); }
    out[key] = {g, x, y0, y};
  });
  return out; })();
function figDemodTrain(v){
  P.hOverride = null;
  const f = frameOf(v, 0), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2), o4 = clamp01(f-3), m = clamp01(f-4);
  const R = TR.rect, M = TR.man, mixF = (p, q) => t => (1-m)*p(t)+m*q(t);
  const mixP = (p, q) => p.map((pt, j)=>[pt[0], (1-m)*pt[1]+m*q[j][1]]);
  const T = v && v.t!=null ? v.t : 10.8;
  const hT = tau => (1-m)*PSI.rect(1-T+tau)+m*PSI.man(1-T+tau), gT = mixF(R.g, M.g);
  const big = P.labelScale() > 1, hA = big ? 300 : 190, hB = big ? 300 : 200;
  /* at the end of the slider the top axes show all ten bits; anywhere else
     they zoom to four bits around t, and the noise is drawn faint and cut at
     the edge of the axes so the filter and the product stay readable */
  const zoom = T < 10.79, x0 = zoom ? Math.min(Math.max(-0.3, T-2.6), 6.8) : -0.3, x1 = zoom ? x0+4 : 10.8;
  const xt = zoom ? [Math.ceil(x0), Math.ceil(x0)+1, Math.ceil(x0)+2, Math.ceil(x0)+3].filter(k=>k>=0 && k<=x1) : [0,2,4,6,8,10];
  const a = P.Axes({w:560,h:hA,xr:[x0,x1],yr:[-2.0,3.2],xlabel:'\\tau', xunit:'T_b',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:50,b:40},xticksOverride:xt,yticksOverride:[-1,0,1]});
  fade(a, o1, ()=>a.curve(mixF(R.x, M.x), {color:zoom ? C.out+'59' : C.out, width:1.1, n:2400}));
  if(zoom) a.area(tau=>gT(tau)*hT(tau), x0, x1, {color:C.mid+'59', n:1600});
  a.curve(gT, {color:C.in, width:2.4, n:2400});
  if(zoom) a.curve(hT, {color:C.h, width:2.4, dash:'7 5', n:1600});
  /* each bit value sits on a small plate in the panel colour, so the noise does not run through it */
  const pw = 9*P.labelScale()*(x1-x0)/478;
  TR_B.forEach((bit, k)=>{ if(k+0.5 > x0 && k+0.5 < x1){ a.rect(k+0.5-pw, 1.98, k+0.5+pw, 2.62, {fill:C.plate});
    a.note(k+0.5, 2.2, String(bit), {tex:true, fs:15, color:C.in, anchor:'middle'}); } });
  const b = P.Axes({w:560,h:hB,xr:[-0.3,10.8],yr:[-2.7,2.4],xlabel:'t', xunit:'T_b',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,2,4,6,8,10],yticksOverride:[-1,0,1]});
  b.hline(0, {color:C.muted, dash:'5 4'});
  if(zoom) b.rect(Math.max(-0.3, T-1), -2.7, T, 2.4, {fill:C.h+'1F'});
  const cut = (Y, after) => Y.filter(p=>after ? p[0] >= T-0.02 : p[0] <= T+1e-9);
  const Y0 = mixP(R.y0, M.y0), Y1 = mixP(R.y, M.y);
  fade(b, o2*(1-0.55*o3), ()=>{ b.poly(cut(Y0), {color:C.mid, width:2.0, dash:'6 4'});
    b.poly(cut(Y0, true), {color:C.mid+'59', width:1.4, dash:'6 4'}); });
  fade(b, o3, ()=>{ b.poly(cut(Y1), {color:C.mid, width:2.4}); b.poly(cut(Y1, true), {color:C.mid+'59', width:1.4}); });
  if(T < 10.79 && o2 > 0.01){ const j = Math.min(Y0.length-1, Math.round(T/0.02)), yv = (1-o3)*Y0[j][1]+o3*Y1[j][1];
    b.vline(T, {color:C.muted}); b.point(T, yv, {color:C.mid, r:5});
    const yr = Math.abs(yv) < 0.005 ? '0.00' : (yv > 0 ? '+' : '')+yv.toFixed(2);
    b.note(0.1, -1.6, `${o3 < 0.5 ? 'y_0' : 'y'}(${T.toFixed(2)})=${yr}`, {tex:true, fs:15, color:C.mid}); }
  fade(b, o4, ()=>{ const Y = mixP(R.y, M.y);
    for(let k=1;k<=Math.min(10, Math.floor(T+1e-9));k++){ const yk = Y[50*k][1]; b.point(k, yk, {color:C.mid, r:5});
      b.note(k-0.5, 2.05, yk > 0 ? '1' : '0', {tex:true, fs:15, color:C.out, anchor:'middle'}); } });
  { const L = P.labelScale(), px = 1/(b.sx(1)-b.sx(0)), y = -2.3, x = 10.6-150*L*px;
    fade(b, o2, ()=>keyEntry(b, x, y, 'y_0(t)', C.mid, {width:2.0, dash:'6 4'}));
    fade(b, o3, ()=>keyEntry(b, x+80*L*px, y, 'y(t)', C.mid, {width:2.4})); }
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The correlator on one noiseless bit, s_m = 1, with the Manchester psi.
   The input x = psi, so the product x psi = psi^2 = 1 on the bit and the
   running integral y(t) = int_0^t psi^2 = t/T_b. Frames 0-2 run t to 0,
   T_b/2, T_b; frame 3 dumps the integrator after the sample is taken. */
function figCorrOut(v){
  P.hOverride = null;
  const f = frameOf(v, 0), t = Math.min(f, 2)/2, d = clamp01(f-2);
  const top = P.blocks({w:560,h:108,items:[
    {t:'arrow',x1:14,y1:44,x2:112,y2:44,label:'x(t)',tex:true,color:C.out},
    {t:'line',d:'M112,44 a16,16 0 1,0 32,0 a16,16 0 1,0 -32,0'},
    {t:'line',d:'M117,33 l22,22 M139,33 l-22,22'},
    {t:'arrow',x1:128,y1:102,x2:128,y2:62,color:C.h},
    {t:'text',x:146,y:96,label:'\\psi(t)',tex:true,anchor:'start',fs:15,color:C.h},
    {t:'arrow',x1:144,y1:44,x2:226,y2:44},
    {t:'box',x:226,y:16,w:132,h:56,label:'\\int_0^{t}(\\cdot)\\,d\\tau',tex:true},
    {t:'arrow',x1:358,y1:44,x2:436,y2:44,label:'y(t)',tex:true,color:C.mid},
    {t:'line',d:'M436,44 h24'}, {t:'line',d:'M460,44 l20,-14'},
    {t:'arrow',x1:488,y1:44,x2:548,y2:44,label:'y(T_b)',tex:true,color:C.mid},
    {t:'text',x:470,y:88,label:'t=T_b',tex:true,fs:14}
  ]});
  const big = P.labelScale() > 1, hA = big ? 250 : 130, hB = big ? 280 : 168;
  const a = P.Axes({w:560,h:hA,xr:[-0.2,2.2],yr:[-1.5,1.6],xlabel:'',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:24},xticksOverride:[0,1,2],yticksOverride:[-1,0,1]});
  if(t > 0.005 && d < 0.99) fade(a, 1-d, ()=>a.area(()=>1, 0, t, {color:C.dec.mid}));
  a.curve(PSI.man, {color:C.in, width:2.2, n:900});
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[2.2,0]], {color:C.mid, width:2.0, dash:'6 4'});
  a.vline(t, {color:C.muted});
  { const px = 1/(a.sx(1)-a.sx(0)), L = P.labelScale(), x = 2.17-(118+78)*L*px;
    keyEntry(a, x, 1.15, 'x(\\tau)', C.in, {});
    keyEntry(a, x+78*L*px, 1.15, 'x(\\tau)\\psi(\\tau)', C.mid, {width:2.0, dash:'6 4'}); }
  const b = P.Axes({w:560,h:hB,xr:[-0.2,2.2],yr:[-0.2,1.45],xlabel:'t', xunit:'T_b',ylabel:'y(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[0,0.5,1]});
  b.poly([[0,0],[t,t]], {color:C.mid, width:2.6});
  if(d > 0.01) b.poly([[1,1],[1,1-d]], {color:C.mid, width:2.0, dash:'3 4'});
  if(d > 0.99) b.poly([[1,0],[2.2,0]], {color:C.mid, width:2.6});
  b.point(t, t, {color:C.mid, r:5});
  b.note(0.04, 1.22, `y(t)=\\int_0^{t}\\psi^{2}\\,d\\tau=${t.toFixed(2)}`, {tex:true, fs:15, color:C.mid});
  fade(b, d, ()=>b.note(1.1, 0.25, '\\text{reset to }0', {tex:true, fs:14, color:C.muted}));
  return stack(560, [[top,108],[a.svg(),hA],[b.svg(),hB]]);
}

/* The correlator against the matched filter on one noiseless bit, s_m = 1,
   T_b = 1, for three shapes of psi (rectangle, Manchester, three steps).
   The filter output is s_m R(t - T_b), drawn wide; the correlator output is
   int_0^t psi^2 = t on [0, T_b], dumped at T_b, drawn dashed. The two lines
   leave each other inside the bit and meet at t = T_b with the value s_m. */
const CM = ['rect','man','step'];
function figCorrMf(v){
  const f = frameOf(v, 0), i = Math.min(1, Math.floor(f)), u = clamp01(f-i);
  const y = t => (1-u)*PSI_R[CM[i]](t-1) + u*PSI_R[CM[i+1]](t-1);
  const a = P.Axes(SZ({xr:[-0.15,2.2], yr:[-0.75,1.4], xlabel:'t', xunit:'T_b', ylabel:'\\text{output}',
    xticksOverride:[0,0.5,1,1.5,2], yticksOverride:[-0.5,0,0.5,1]}));
  a.raw('<g opacity="0.45">'); a.curve(y, {color:C.mid, width:5, n:800}); a.raw('</g>');
  a.poly([[-0.15,0],[0,0],[1,1],[1,0],[2.2,0]], {color:C.mid, width:2.2, dash:'7 5'});
  a.vline(1, {color:C.muted});
  a.point(1, 1, {color:C.mid, r:5});
  a.note(1.06, 1.18, 's_m=1', {tex:true, fs:15, color:C.mid});
  return a.svg();
}

/* The double integral of the noise variance, drawn over its square of (t, u)
   pairs for the Manchester psi, T_b = 1. Frame 0: psi(t) psi(u) is +1/T_b on
   the two shaded squares and -1/T_b on the other two. Frame 1: white noise is
   correlated only near t = u; the band of width eps around the diagonal
   narrows from 0.18 to a line between frames 1 and 2. Frame 2: on the line
   t = u the product is psi^2(t) = +1/T_b everywhere. Frame 3: the result. */
function figNoisePlane(v){
  const f = frameOf(v, 0), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  const a = P.Axes(SZ({xr:[-0.12,1.18], yr:[-0.12,1.3], xlabel:'t', xunit:'T_b', ylabel:'u/T_b',
    xticksOverride:[0,0.5,1], yticksOverride:[0,0.5,1], grid:false}));
  const q = 1-0.6*o2;
  a.raw(`<g opacity="${q.toFixed(3)}">`);
  a.rect(0, 0, 0.5, 0.5, {fill:C.dec.mid, stroke:C.mid, width:1.2});
  a.rect(0.5, 0.5, 1, 1, {fill:C.dec.mid, stroke:C.mid, width:1.2});
  a.rect(0, 0.5, 0.5, 1, {stroke:C.mid, width:1.2, dash:'4 4'});
  a.rect(0.5, 0, 1, 0.5, {stroke:C.mid, width:1.2, dash:'4 4'});
  a.note(0.13, 0.4, '+', {tex:true, fs:18, color:C.mid, anchor:'middle'});
  a.note(0.63, 0.9, '+', {tex:true, fs:18, color:C.mid, anchor:'middle'});
  a.note(0.25, 0.73, '-', {tex:true, fs:18, color:C.mid, anchor:'middle'});
  a.note(0.75, 0.23, '-', {tex:true, fs:18, color:C.mid, anchor:'middle'});
  a.raw('</g>');
  if(o1 > 0.01 && o2 < 0.99){ const e = 0.18*(1-o2)+0.004;
    const pts = [[0,0],[e,0],[1,1-e],[1,1],[1-e,1],[0,e]].map(p=>[a.sx(p[0]).toFixed(1), a.sy(p[1]).toFixed(1)]);
    a.raw(`<path d="M${pts.map(p=>p.join(',')).join('L')}Z" fill="${C.noise}" opacity="${(0.55*o1).toFixed(3)}"/>`); }
  fade(a, o2, ()=>a.poly([[0,0],[1,1]], {color:C.mid, width:3.2}));
  fade(a, o1*(1-o2), ()=>a.note(0.5, 1.15, 'E[w(t)w(u)]=\\tfrac{N_0}{2}\\delta(t-u)', {tex:true, fs:15, color:C.muted, anchor:'middle'}));
  fade(a, o2*(1-o3), ()=>a.note(0.5, 1.15, 't=u:\\ \\psi(t)\\psi(u)=\\psi^{2}(t)', {tex:true, fs:15, color:C.mid, anchor:'middle'}));
  fade(a, o3, ()=>a.note(0.5, 1.15, 'E[n^{2}]=\\tfrac{N_0}{2}\\int_0^{T_b}\\psi^{2}(t)\\,dt=\\tfrac{N_0}{2}', {tex:true, fs:16, color:C.mid, anchor:'middle'}));
  return a.svg();
}
/* The second slide of the variance plays the same figure from frame 1. */
const figNoisePlaneB = v => figNoisePlane({frame:frameOf(v, 0)+1});

/* Measured noise values under an N0 slider. Each of 3000 values is the sum
   n = sum_j w_j psi(t_j) dt over 40 samples of the Manchester psi, with w_j
   independent Gaussian of variance N0/(2 dt): a discrete white noise. The
   base draws are made once with unit variance and scaled by sqrt(N0/2), so the
   slider moves one set of measurements. Histogram (density, bins 0.1 wide)
   against the density N(0, N0/2); the readout compares the measured spread
   with the formula. The axis runs over n + 3 and is labelled n, so the
   density axis sits at the left edge rather than through the peak. */
const NH = (()=>{ const M = 40, dt = 1/M, z = gauss(20261021, 3000*M, 1), out = [];
  for(let i=0;i<3000;i++){ let s = 0; for(let j=0;j<M;j++){ const t = (j+0.5)*dt;
    s += z[i*M+j]*Math.sqrt(1/dt)*(t<0.5 ? 1 : -1)*dt; } out.push(s); }
  const m = out.reduce((p,q)=>p+q, 0)/out.length;
  return {n:out, sd:Math.sqrt(out.reduce((p,q)=>p+(q-m)*(q-m), 0)/(out.length-1))}; })();
function figNoiseHist(v){
  const N0 = v && v.N0!=null ? v.N0 : 0.5, s = Math.sqrt(N0/2), BW = 0.1, LO = -2, O = 3;
  const a = P.Axes(SZ({xr:[1,5], yr:[-0.06,2.2], xlabel:'n', ylabel:'\\text{density}',
    xticksOverride:[1,2,3,4,5], xtickfmt:x=>String(x-O), yticksOverride:[0.5,1,1.5,2]}));
  const c = new Array(40).fill(0); NH.n.forEach(z=>{ const k = Math.floor((s*z-LO)/BW); if(k>=0 && k<40) c[k]++; });
  c.forEach((h,k)=>{ const d = h/(NH.n.length*BW); if(d <= 0) return;
    const x = a.sx(O+LO+k*BW), w = a.sx(O+LO+(k+1)*BW)-x, y = a.sy(Math.min(d, 2.2));
    a.raw(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(a.sy(0)-y).toFixed(1)}" fill="${C.dec.mid}" stroke="${C.mid}" stroke-width="1.1"/>`); });
  a.curve(y=>dens(y-O, 0, s), {color:C.mid, width:2.6, n:500});
  a.note(1.1, 1.95, `\\text{measured }\\sigma=${(s*NH.sd).toFixed(3)}`, {tex:true, fs:15, color:C.mid});
  const L = P.labelScale(), y2 = L>1 ? 1.95-27*L/(a.sy(0)-a.sy(1)) : 1.7;
  a.note(1.1, y2, `\\sqrt{N_0/2}=${s.toFixed(3)}`, {tex:true, fs:15, color:C.ink});
  return a.svg();
}

/* Binary orthogonal signalling (binary PPM), T_b = 1, E_b = 2: s_1 is a
   pulse of height 2 on the first half of the bit, s_2 the same on the second,
   and the bases psi_1, psi_2 have height sqrt 2. Frame 0: the two waveforms.
   Frame 1: the two bases. Frame 2: the two signal points (sqrt E_b, 0) and
   (0, sqrt E_b) on the plane of the correlator outputs (y_1, y_2), with the
   distance sqrt(2 E_b). Frame 3: 60 noisy outputs around each point, noise
   standard deviation 0.18 on each axis, independent. */
const PP_Z = gauss(20261022, 240, 0.18);
function figPpm(v){
  P.hOverride = null;
  const f = frameOf(v, 0), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2), r = Math.SQRT2;
  const big = P.labelScale() > 1, hA = big ? 230 : 170, hB = big ? 330 : 270;
  const a = P.Axes({w:560,h:hA,xr:[-0.3,1.3],yr:[-0.3,big?3.0:2.6],xlabel:'t', xunit:'T_b',ylabel:'\\text{amplitude}', ynameAtAxis:true,
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[0,0.5,1],yticksOverride:[]});
  /* both pulses are zero off their halves: the zero line is drawn once, solid,
     and s_2 (dashed) only by its top and its falling edge, so no dashed run
     lies on a solid one */
  const pair = (h, color, width, dash, color2=color) => { a.poly([[-0.3,0],[1.3,0]], {color, width});
    a.poly([[0,0],[0,h],[0.5,h],[0.5,0]], {color, width}); a.poly([[0.5,h],[1,h],[1,0]], {color:color2, width, dash}); };
  /* the pulse names sit a fixed number of pixels above the pulse tops */
  const ys = big ? 2+8*P.labelScale()/(a.sy(0)-a.sy(1)) : 2.25;
  fade(a, 1-0.6*o1, ()=>{ pair(2, C.in, 2.4, '8 5', C.mid);
    a.note(0.25, ys, 's_1(t)', {tex:true, fs:15, color:C.in, anchor:'middle'});
    a.note(0.75, ys, 's_2(t)', {tex:true, fs:15, color:C.mid, anchor:'middle'}); });
  fade(a, o1, ()=>{ pair(r, C.h, 2.2, '7 5');
    a.note(1.05, r, '\\psi_1,\\ \\psi_2', {tex:true, fs:15, color:C.h}); });
  const b = P.Axes({w:560,h:hB,xr:[-0.9,2.6],yr:[-0.7,2.1],xlabel:'y_1',ylabel:'y_2',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,1],yticksOverride:[0,1],xtickfmt:()=>'',ytickfmt:()=>''});
  fade(b, o3, ()=>{ for(let i=0;i<60;i++){ b.point(r+PP_Z[i], PP_Z[60+i], {color:C.out, r:2.6, ring:'none'});
    b.point(PP_Z[120+i], r+PP_Z[180+i], {color:C.out, r:2.6, ring:'none'}); } });
  fade(b, o2, ()=>{ b.point(r, 0, {color:C.in, r:7}); b.point(0, r, {color:C.mid, r:7});
    b.poly([[r,0],[0,r]], {color:C.muted, width:1.6, dash:'5 4'});
    b.note(r+0.45, 0.55, 's_1=(\\sqrt{E_b},0)', {tex:true, fs:15, color:C.in});
    b.note(0.55, r+0.12, 's_2=(0,\\sqrt{E_b})', {tex:true, fs:15, color:C.mid});
    b.note(0.85, 0.85, 'd=\\sqrt{2E_b}', {tex:true, fs:15, color:C.muted}); });
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* ---- 2.3 the decision and its error ------------------------------------ */

/* The two conditional densities of y. The figures use E_b = 1 and N_0 = 0.5,
   so sigma = 0.5 and the overlap is wide enough to see. The density given
   s_0 is violet, the one given s_1 cyan; both are solid, so the two symbols
   never share a colour; each mean dot takes its symbol's colour. The error areas are red. */
const DS = {A:1, s:0.5, N0:0.5};
function densFrame(o){
  const a = P.Axes(SZ(Object.assign({xr:[-3,3], xlabel:'y', xticksOverride:[-2,-1,0,1,2],
    xtickfmt:v=>Math.abs(v)===1 ? '' : String(v), ytarget:3, ytickfmt:()=>''}, o)));
  return a;
}
function markMeans(a, y){
  a.point(-1, 0, {color:C.mid, r:5}); a.point(1, 0, {color:C.in, r:5});
  a.note(-1, y, '-\\sqrt{E_b}', {tex:true, fs:15, color:C.mid, anchor:'middle'});
  a.note(1, y, '+\\sqrt{E_b}', {tex:true, fs:15, color:C.in, anchor:'middle'});
}
function figStat(){
  const {A,s} = DS, top = dens(0,0,s);
  const a = densFrame({yr:[-0.06*top,1.3*top], ylabel:'f_Y(y\\mid s_m)'});
  a.curve(y=>dens(y,-A,s), {color:C.mid, width:2.4});
  a.curve(y=>dens(y, A,s), {color:C.in, width:2.4});
  markMeans(a, 0.1*top);
  return a.svg();
}
function figErrors(v){
  const {A,s} = DS, top = dens(0,0,s), lam = v && v.lam!=null ? v.lam : 0;
  const L = P.labelScale(), big = L>1, yt = (big ? 1.6 : 1.42)*top;
  const a = densFrame({yr:[-0.06*top,yt], ylabel:'f_Y(y\\mid s_m)'});
  a.area(y=>dens(y,-A,s), lam, 3, {color:C.dec.err});
  a.area(y=>dens(y, A,s), -3, lam, {color:C.dec.err});
  a.curve(y=>dens(y,-A,s), {color:C.mid, width:2.4});
  a.curve(y=>dens(y, A,s), {color:C.in, width:2.4});
  a.vline(lam, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.note(lam, -0.06*top, '\\lambda', {tex:true, fs:17, color:C.ink, anchor:'middle', dy:18*L});
  markMeans(a, 0.1*top);
  const u = 1/(a.sy(0)-a.sy(1)), y1 = big ? yt-18*L*u : 1.3*top, y2 = big ? y1-24*L*u : 1.14*top;
  a.note(-2.9, y1, `P(\\text{err}\\mid s_0)=${sci(Qf((lam+A)/s))}`, {tex:true, fs:15, color:C.err});
  a.note(-2.9, y2, `P(\\text{err}\\mid s_1)=${sci(Qf((A-lam)/s))}`, {tex:true, fs:15, color:C.err});
  return a.svg();
}
/* The optimal threshold for P(s_0) = 0.7: where the two weighted densities
   cross. It moves right of zero, towards s_1. */
const lamOpt = (N0, A, p0) => N0/(4*A)*Math.log(p0/(1-p0));
function figThreshold(){
  const {A,s,N0} = DS, p0 = 0.7, top = p0*dens(0,0,s), lo = lamOpt(N0,A,p0);
  const a = densFrame({yr:[-0.06*top,1.3*top], ylabel:'P(s_m)\\,f_Y(y\\mid s_m)'});
  a.area(y=>Math.min(p0*dens(y,-A,s),(1-p0)*dens(y,A,s)), -3, 3, {color:C.dec.err});
  a.curve(y=>p0*dens(y,-A,s), {color:C.mid, width:2.4});
  a.curve(y=>(1-p0)*dens(y,A,s), {color:C.in, width:2.4});
  a.vline(0, {color:C.muted});
  a.vline(lo, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.point(lo, (1-p0)*dens(lo,A,s), {color:C.ink, r:4.5});
  markMeans(a, 0.1*top);
  a.note(lo+0.1, 1.16*top, '\\lambda_{\\mathrm{opt}}', {tex:true, fs:16, color:C.ink});
  return a.svg();
}
function figThresholdLive(v){
  const p0 = v && v.p0!=null ? v.p0 : 0.7, dB = v && v.dB!=null ? v.dB : 3;
  const A = 1, N0 = 1/Math.pow(10, dB/10), s = Math.sqrt(N0/2), lo = lamOpt(N0, A, p0);
  const top = Math.max(p0, 1-p0)*dens(0,0,s);
  const a = densFrame({yr:[-0.06*top,1.36*top], ylabel:'P(s_m)\\,f_Y(y\\mid s_m)'});
  a.curve(y=>p0*dens(y,-A,s), {color:C.mid, width:2.4});
  a.curve(y=>(1-p0)*dens(y,A,s), {color:C.in, width:2.4});
  a.vline(0, {color:C.muted});
  a.vline(lo, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  markMeans(a, 0.1*top);
  a.note(-2.9, 1.2*top, `\\lambda_{\\mathrm{opt}}=${lo.toFixed(3)}`, {tex:true, fs:16, color:C.ink});
  return a.svg();
}

/* Q(x) is drawn in a closed frame with its numbers on the left edge, as a
   plot of a function on [-4,4]; the guides run from the axes to the point. */
function qFrame(a){
  a.raw(`<rect x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none" stroke="${C.axis}" stroke-width="1"/>`);
  leftTicks(a, [0,0.2,0.4,0.6,0.8,1], v=>String(v));
}
function qGuide(a, x, q){
  const X = a.sx(x).toFixed(2), Y = a.sy(q).toFixed(2), d = `stroke="${C.ink}" stroke-width="1.6" stroke-dasharray="6 4"`;
  a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${Y}" ${d}/><line x1="${a.x0}" y1="${Y}" x2="${X}" y2="${Y}" ${d}/>`);
}
/* Q(x) against x, falling from 1 to 0, with the value at the slider marked.
   The tick at x = 0 is placed at 1e-9 so the axis does not drop it as the origin. */
function figQ(v){
  const x = v && v.x!=null ? v.x : 1, q = Qf(x);
  const a = P.Axes(SZ({xr:[-4,4], yr:[0,1.05], xlabel:'x', ylabel:'Q(x)', zeroAxes:false,
    xticksOverride:[-4,-2,1e-9,2,4], xtickfmt:v=>String(Math.round(v)), yticksOverride:[0,0.2,0.4,0.6,0.8,1], ytickfmt:()=>'', pad:{l:64,r:26,t:24,b:46}}));
  qFrame(a);
  a.curve(Qf, {color:C.mid, width:2.4});
  qGuide(a, x, q);
  a.point(x, q, {color:C.mid, r:5.5});
  a.note(0.5, 0.9, `Q(${x.toFixed(1)})=${sci(q)}`, {tex:true, fs:16, color:C.mid});
  return a.svg();
}

/* P_b = Q(sqrt(2 E_b/N_0)) against E_b/N_0 in decibels, on decades. The curve
   stops half a decade above the bottom of the range, clear of the axis name. */
const pbDb = d => Qf(Math.sqrt(2*Math.pow(10, d/10)));
function figPe(v){
  const dB = v && v.dB!=null ? v.dB : null;
  const a = P.Axes(SZ({xr:[0,12], yr:[-8,-0.02], xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'P_e',
    ytickfmt:P.decade, yticksOverride:P.decades(-8,-1), zeroAxes:false, pad:{l:64,r:26,t:24,b:46}, xtarget:6}));
  a.curve(d=>{ const p = pbDb(d); return p > 3e-8 ? Math.log10(p) : NaN; }, {color:C.in, width:2.4});
  if(dB!=null){ const p = pbDb(dB);
    a.vline(dB, {color:C.muted});
    a.point(dB, Math.log10(p), {color:C.in, r:5.5});
    const hi = dB >= 9, L = P.labelScale(), dn = L>1 ? 28*L/(a.sy(0)-a.sy(1)) : 0.7;
    a.note(hi ? dB-0.35 : dB+0.35, Math.log10(p)+(hi ? -dn : 0.5), `P_e=${sci(p)}`, {tex:true, fs:16, color:C.in, anchor:hi ? 'end' : 'start'}); }
  return a.svg();
}

/* Worked example, E_b = 1, N_0 = 0.1, P(s_1) = 0.3. On a logarithmic scale
   each weighted density is a parabola; they cross at lambda_opt = 0.0212,
   just right of zero. */
const EX = {A:1, N0:0.1, p0:0.7};
EX.s = Math.sqrt(EX.N0/2); EX.lam = lamOpt(EX.N0, EX.A, EX.p0);
EX.pe = l => EX.p0*Qf((l+EX.A)/EX.s) + (1-EX.p0)*Qf((EX.A-l)/EX.s);
function figExLog(){
  const {A,s,p0,lam} = EX, L = (y,m,p) => Math.log10(p*dens(y,m,s));
  const a = P.Axes(SZ({xr:[-0.25,0.25], yr:[-7.6,-1.8], xlabel:'y', ylabel:'P(s_m)\\,f_Y(y\\mid s_m)',
    ytickfmt:()=>'', yticksOverride:P.decades(-7,-2), xticksOverride:[-0.2,-0.1,0,0.1,0.2], zeroAxes:false,
    pad:{l:64,r:26,t:24,b:44}}));
  leftTicks(a, P.decades(-7,-2), P.decade);
  const inX = f => y => Math.abs(y) <= 0.24 ? f(y) : NaN;
  a.curve(inX(y=>L(y,-A,p0)), {color:C.mid, width:2.4});
  a.curve(inX(y=>L(y, A,1-p0)), {color:C.in, width:2.4});
  a.vline(0, {color:C.muted});
  a.vline(lam, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.point(lam, L(lam,A,1-p0), {color:C.ink, r:4.5});
  a.note(lam+0.012, -6.9, '\\lambda_{\\mathrm{opt}}=0.0212', {tex:true, fs:15, color:C.ink});
  return a.svg();
}
/* The average error probability against the threshold, for the same numbers.
   Its minimum sits at lambda_opt; the value at zero is about 10 per cent higher. */
function figExPe(){
  const {lam} = EX, lg = l => Math.log10(EX.pe(l));
  const a = P.Axes(SZ({xr:[-0.12,0.16], yr:[-5.75,-4.45], xlabel:'\\lambda', ylabel:'P_e',
    ytickfmt:()=>'', yticksOverride:[Math.log10(4e-6),Math.log10(1e-5),Math.log10(2e-5)],
    xticksOverride:[-0.1,-0.05,0,0.05,0.1,0.15], zeroAxes:false, pad:{l:88,r:26,t:24,b:44}}));
  leftTicks(a, [Math.log10(4e-6),Math.log10(1e-5),Math.log10(2e-5)], mdec);
  a.curve(lg, {color:C.in, width:2.4});
  a.vline(0, {color:C.muted}); a.vline(lam, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.point(0, lg(0), {color:C.muted, r:5}); a.point(lam, lg(lam), {color:C.in, r:5.5});
  return a.svg();
}

/* ---- 2.4 intersymbol interference ---------------------------------------
   The channel of this section is a first-order RC lowpass of 3 dB bandwidth
   B, time constant tau = 1/(2 pi B), and T_b = 1. A rectangular bit through it
   gives r(t); sampled at the end of each bit, one bit back weighs
   q = exp(-2 pi B T_b) as much as the bit itself, m bits back q^m. */
const rcq = bt => Math.exp(-2*Math.PI*bt);
function rcResp(bt){ const tau = 1/(2*Math.PI*bt), e = Math.exp(-1/tau);
  return t => t<0 ? 0 : t<=1 ? 1-Math.exp(-t/tau) : (1-e)*Math.exp(-(t-1)/tau); }
/* y(t) for a list of bits, with the line idle at `hist` (0 for rest, -1 for a
   long run of zeros) before t = 0: that run leaves hist * exp(-t/tau). */
function rcTrain(bits, bt, hist=0){ const r = rcResp(bt), tau = 1/(2*Math.PI*bt);
  return t => bits.reduce((s,b,k)=>s + (b?1:-1)*r(t-k), t>=0 ? hist*Math.exp(-t/tau) : hist); }
const nrz = (bits, hist=0) => t => { const k = Math.floor(t); return k<0 ? hist : k<bits.length ? (bits[k]?1:-1) : 0; };

/* The one bit pattern followed through the first slides of the section:
   from the bits to the pulses, through the channel, and into the samples. */
const ISI_B = [1,1,0,1,0,0];
/* a trace that draws itself from left to right: NaN beyond the pen */
const upTo = (f, tEnd) => t => t <= tEnd ? f(t) : NaN;
const bitDigits = (a, bits, y, op=1) => fade(a, op, ()=>bits.forEach((b,k)=>
  a.note(k+0.5, y, String(b), {fs:15, color:C.ink, anchor:'middle', weight:600})));

/* The baseband link, block by block. Each frame lights one block and shows
   the signal that leaves it: the bits, their amplitudes a_k, the pulses of
   the transmit filter (rectangles of length T_b), the channel output twice
   (an ideal channel h = delta, which passes s(t) unchanged, then a
   band-limited RC channel with BT_b = 0.25, which rounds and spreads it), the
   same with noise, its samples at the end of each bit, and the decisions. A
   red dot on the diagram sits at the point whose signal is drawn below and
   slides along the link from frame to frame. The arrows of the diagram carry
   the colours of the traces below, so the diagram is the key. */
const LINK_N = noiseFn(20261025, 0.12, 0.07, -1, 8);
const LINK_BOX = [-1, 0, 1, 2, 2, 3, 4, 5];              /* the block lit in each frame */
const LINK_DOT = [24, 120, 219, 315, 315, 449, 509, 588]; /* where its signal is taken */
function figIsiLink(v){
  P.hOverride = null;
  const f = frameOf(v, 7), u = k => clamp01(f-k), big = P.labelScale() > 1;
  const yc = 44, bh = 42, by = yc-bh/2;
  const box = [[34,66],[140,60],[238,60],[376,56],[464,30],[528,68]];
  const it = [
    {t:'arrow',x1:4,y1:yc,x2:34,y2:yc,label:'b_k',tex:true,color:C.ink},
    {t:'box',x:34,y:by,w:66,h:bh,label:'PAM',fs:15},
    {t:'arrow',x1:100,y1:yc,x2:140,y2:yc,label:'a_k',tex:true,color:C.in},
    {t:'box',x:140,y:by,w:60,h:bh,label:'g(t)',tex:true},
    {t:'arrow',x1:200,y1:yc,x2:238,y2:yc,label:'s(t)',tex:true,color:C.in},
    {t:'box',x:238,y:by,w:60,h:bh,label:'h(t)',tex:true,color:C.h},
    {t:'arrow',x1:298,y1:yc,x2:332,y2:yc,label:'x(t)',tex:true,color:C.out},
    {t:'sum',x:346,y:yc},
    {t:'arrow',x1:346,y1:96,x2:346,y2:yc+16,color:C.muted},
    {t:'text',x:336,y:104,label:'w(t)',tex:true,anchor:'end',fs:14},
    {t:'arrow',x1:360,y1:yc,x2:376,y2:yc},
    {t:'box',x:376,y:by,w:56,h:bh,label:'c(t)',tex:true},
    {t:'arrow',x1:432,y1:yc,x2:466,y2:yc,label:'y(t)',tex:true,color:C.out},
    {t:'line',d:`M466,${yc} l16,-12`},
    {t:'text',x:478,y:yc+26,label:'t_i',tex:true,fs:14},
    {t:'arrow',x1:490,y1:yc,x2:528,y2:yc,label:'y(t_i)',tex:true,color:C.mid},
    {t:'box',x:528,y:by,w:68,h:bh,label:'Decide',fs:14},
    {t:'text',x:170,y:86,label:'transmit filter',fs:12},
    {t:'text',x:268,y:86,label:'channel',fs:12},
    {t:'text',x:404,y:86,label:'receive filter',fs:12}];
  const glowFill = [C.dec.in, C.dec.in, C.dec.h, C.dec.out, C.dec.mid, C.dec.out];
  const glow = box.map(([x,w],i)=>{
    const op = LINK_BOX.reduce((m,b,k)=>b===i ? Math.max(m, clamp01(1-Math.abs(f-k))) : m, 0);
    return op > 0.01 ? `<rect x="${x}" y="${by}" width="${w}" height="${bh}" fill="${glowFill[i]}" opacity="${op.toFixed(3)}" rx="2"/>` : ''; }).join('');
  const k0 = Math.min(6, Math.floor(f)), dx = LINK_DOT[k0] + (LINK_DOT[k0+1]-LINK_DOT[k0])*(f-k0);
  const dot = `<circle cx="${dx.toFixed(1)}" cy="${yc}" r="7" fill="${C.err}" stroke="${C.plate}" stroke-width="2.5"/>`;
  const top = P.blocks({w:600, h:116, items:it}).replace(/(<svg[^>]*>)/, '$1'+glow).replace(/<\/svg>\s*$/, dot+'</svg>');

  const H = big ? 330 : 290;
  const a = P.Axes({w:600, h:H, xr:[-0.5,6.6], yr:[-1.85,1.95], xlabel:'t', xunit:'T_b', ylabel:'\\text{signal at this stage}',
    ynameAtAxis:true, pad:{l:54,r:26,t:24,b:42}, xticksOverride:[0,1,2,3,4,5,6], yticksOverride:[-1,0,1]});
  bitDigits(a, ISI_B, 1.62);
  const amp = ISI_B.map(b=>b?1:-1), w = u(1);
  /* the amplitudes rise as stems, then each stem widens into its pulse */
  fade(a, 1-0.55*u(2), ()=>{
    if(w < 0.02) a.stem(amp.map((s,k)=>[k, s*u(0)]), {color:C.in});
    else amp.forEach((s,k)=>{ a.rect(k, 0, k+w, s, {fill:C.dec.in});
      a.poly([[k,0],[k,s],[k+w,s],[k+w,0]], {color:C.in, width:2.3}); });
  });
  if(f > 2){
    /* frame 3: h = delta, so x = s; frame 4: the channel narrows to BT_b = 0.25 */
    const bt = 0.25*Math.pow(80, 1-u(3)), x = rcTrain(ISI_B, bt), y = t => x(t) + u(4)*LINK_N(t);
    fade(a, u(2), ()=>a.curve(y, {color:C.out, width:2.5, n:1400}));
    fade(a, clamp01(1-Math.abs(f-3)), ()=>a.note(0.12, -1.6, 'x(t)=s(t)*\\delta(t)=s(t)', {tex:true, fs:15, color:C.out}));
    fade(a, clamp01(1-Math.abs(f-4)), ()=>a.note(0.12, -1.6, 'x(t)=s(t)*h(t),\\ \\text{band-limited}', {tex:true, fs:15, color:C.out}));
    fade(a, u(5), ()=>ISI_B.forEach((_,k)=>{ a.vline(k+1, {color:C.mid, opacity:0.5});
      a.point(k+1, y(k+1), {color:C.mid, r:5}); }));
    fade(a, u(6), ()=>{ a.hline(0, {color:C.ink, dash:'6 4', opacity:0.9});
      ISI_B.forEach((_,k)=>a.note(k+0.5, -1.66, y(k+1) > 0 ? '1' : '0', {fs:15, color:C.out, anchor:'middle', weight:600})); });
  }
  return `<svg viewBox="0 0 600 ${116+H}" xmlns="http://www.w3.org/2000/svg" role="img">${place(top,0,0,600,116)}${place(a.svg(),0,116,600,H)}</svg>`;
}

/* From bits to the transmitted signal. Above, the transmit pulse g(t), a
   rectangle of height 1 on [0, T_b]. Below, the bits, their amplitudes as
   stems at the start of each bit, one copy of g per bit stamped from its stem,
   and the sum s(t) drawn over them. */
function figIsiTx(v){
  P.hOverride = null;
  const f = frameOf(v, 3), u = k => clamp01(f-k), big = P.labelScale() > 1;
  const hA = big ? 170 : 150, hB = big ? 300 : 260;
  const g = P.Axes({w:560, h:hA, xr:[-0.6,2.4], yr:[-0.3,1.5], xlabel:'t', xunit:'T_b', ylabel:'g(t)',
    pad:{l:56,r:26,t:24,b:40}, xticksOverride:[0,1,2], yticksOverride:[0,1]});
  g.rect(0, 0, 1, 1, {fill:C.dec.h});
  g.poly([[-0.6,0],[0,0],[0,1],[1,1],[1,0],[2.4,0]], {color:C.h, width:2.4});
  const a = P.Axes({w:560, h:hB, xr:[-0.4,6.6], yr:[-1.5,1.95], xlabel:'t', xunit:'T_b', ylabel:'s(t)',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[0,1,2,3,4,5,6], yticksOverride:[-1,0,1]});
  bitDigits(a, ISI_B, 1.62);
  const amp = ISI_B.map(b=>b?1:-1);
  amp.forEach((s,k)=>{
    const w = clamp01((f-1)*6-k);            /* the pulses are stamped one after another */
    if(w < 0.02){ if(u(0) > 0) a.stem([[k, s*u(0)]], {color:C.in}); return; }
    a.rect(k, 0, k+w, s, {fill:C.dec.in});
    /* a pulse after one of the same sign shares its left edge: draw it once, so the dashes do not overlap */
    const pts = k > 0 && amp[k-1] === s ? [[k,s],[k+w,s],[k+w,0]] : [[k,0],[k,s],[k+w,s],[k+w,0]];
    fade(a, 1-0.7*u(2), ()=>a.poly(pts, {color:C.in, width:1.6, dash:'5 4'}));
  });
  if(f > 2) a.curve(upTo(t=>t<0 || t>=6 ? 0 : amp[Math.floor(t)], -0.4+7*u(2)), {color:C.in, width:2.6, n:1400});
  return stack(560, [[g.svg(),hA],[a.svg(),hB]]);
}

/* The channel output as a convolution, x(t) = integral of s(u) h(t - u).
   Above, in u: s(u) dashed and the flipped, shifted response h(t - u)
   in amber, with their product shaded violet; its area is x(t). Below, x(t)
   drawn up to the current t, with the point being computed. Frame 0 is the
   ideal channel, h = delta, which picks s(t) itself; from frame 1 the RC
   channel with BT_b = 0.25 slides from t = 0 to the end of the pattern. */
const CONV_BT = 0.25, CONV_T = [0, 0, 2, 4, 6.6];
function figIsiChannel(v){
  P.hOverride = null;
  const f = frameOf(v, 4), big = P.labelScale() > 1, ideal = clamp01(1-f);
  const i0 = Math.min(3, Math.floor(f)), t = CONV_T[i0] + (CONV_T[i0+1]-CONV_T[i0])*(f-i0);
  const tc = 1/(2*Math.PI*CONV_BT), hr = u => u < 0 ? 0 : Math.exp(-u/tc)/tc;
  const sF = nrz(ISI_B), x = rcTrain(ISI_B, CONV_BT);
  const hA = big ? 310 : 250, hB = big ? 250 : 225;
  const a = P.Axes({w:560, h:hA, xr:[-0.4,6.6], yr:[-1.5,2.3], xlabel:'u', xunit:'T_b', ylabel:'s(u),\\ h(t-u)',
    pad:{l:56,r:26,t:big ? 96 : 52,b:40}, xticksOverride:[0,1,2,3,4,5,6], yticksOverride:[-1,0,1]});
  a.curve(sF, {color:C.in, width:1.6, dash:'5 5', n:1400});
  if(ideal > 0.01) fade(a, ideal, ()=>{ a.impulse(2.5, 1.6, {color:C.h, label:false}); a.point(2.5, sF(2.5), {color:C.mid, r:5}); });
  if(f > 0.01) fade(a, 1-ideal, ()=>{
    const pr = u => sF(u)*hr(t-u);
    a.area(u => u <= t ? pr(u) : 0, -0.4, Math.min(t, 6.6), {color:C.dec.mid, n:600});
    a.area(u => u <= t ? pr(u) : 0, -0.4, Math.min(t, 6.6), {color:C.dec.mid, n:600});
    a.curve(u => u <= t ? pr(u) : NaN, {color:C.mid, width:1.6, n:900});
    a.curve(u => hr(t-u), {color:C.h, width:2.6, n:900});
    a.vline(t, {color:C.h, opacity:0.8}); });
  const b = P.Axes({w:560, h:hB, xr:[-0.4,6.6], yr:[-1.95,1.95], xlabel:'t', xunit:'T_b', ylabel:'x(t)',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[0,1,2,3,4,5,6], yticksOverride:[-1,0,1]});
  bitDigits(b, ISI_B, 1.62);
  b.curve(sF, {color:C.in, width:1.5, dash:'5 5', opacity:0.8, n:1400});
  if(ideal > 0.01) fade(b, ideal, ()=>b.curve(u=>u<0 ? 0 : sF(u), {color:C.out, width:2.6, n:1400}));
  if(f > 0.01) fade(b, 1-ideal, ()=>{ b.curve(upTo(u=>u<0 ? 0 : x(u), t), {color:C.out, width:2.6, n:1400});
    b.point(t, x(t), {color:C.mid, r:5.5}); });
  fade(b, ideal, ()=>b.note(0.12, -1.66, 'x(t)=s(t)*\\delta(t)=s(t)', {tex:true, fs:15, color:C.out}));
  fade(b, 1-ideal, ()=>b.note(0.12, -1.66, 'x(t)=s(t)*h(t),\\ \\text{band-limited}', {tex:true, fs:15, color:C.out}));
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* How the pulses overlap. One bit and its response, whose tail (red) reaches
   into the following bits; then the other five bits, each with its own
   response (violet, dashed) and tail; then their sum, the received waveform,
   with its samples at the end of each bit. RC channel, BT_b = 0.25. */
function figIsiBuild(v){
  const f = frameOf(v, 3), bt = 0.25, r = rcResp(bt), u = k => clamp01(f-k);
  const a = P.Axes(SZ({xr:[-0.6,7.3], yr:[-1.6,1.75], xlabel:'t', xunit:'T_b', ylabel:'y(t)',
    xticksOverride:[0,1,2,3,4,5,6,7], ytarget:4}));
  const amp = ISI_B.map(b=>b?1:-1);
  /* bit k comes in at stage k: bit 0 in frame 0, the rest one by one in frame 2 */
  const inAt = k => k===0 ? 1 : clamp01((f-1)*5-(k-1));
  const swp = k => k===0 ? u(0) : inAt(k);           /* how far its response is drawn */
  const spill = 1-0.3*u(2);
  amp.forEach((s,k)=>{ const o = inAt(k); if(o < 0.01) return;
    const rk = t => s*r(t-k);
    fade(a, o, ()=>a.poly([[k,0],[k,s],[k+1,s],[k+1,0]], {color:C.in, width:2.2}));
    const pen = -0.6 + 7.9*swp(k);
    if(pen > k+1) fade(a, spill, ()=>{ a.area(upTo(rk, pen), k+1, Math.min(pen, 7.3), {color:C.dec.err});
      a.area(upTo(rk, pen), k+1, Math.min(pen, 7.3), {color:C.dec.err}); });
    const solo = k===0 ? 1-u(1) : 0;
    if(solo > 0.01) fade(a, solo, ()=>a.curve(upTo(rk, pen), {color:C.out, width:2.6, n:900}));
    if(solo < 0.99) a.curve(upTo(rk, pen), {color:C.mid, width:1.4, dash:'4 4', opacity:(1-solo)*(1-0.35*u(2)), n:900});
  });
  /* in frame 1 the first response's samples: its own, then what it leaves */
  fade(a, u(0)*(1-u(1)), ()=>{ [1,2,3].forEach(m=>a.point(m, r(m), {color:m===1 ? C.mid : C.err, r:4.6})); });
  if(f > 2){ const y = rcTrain(ISI_B, bt);
    a.curve(upTo(y, -0.6+7.9*u(2)), {color:C.out, width:2.6, n:1400});
    fade(a, clamp01((f-2.6)*2.5), ()=>ISI_B.forEach((_,k)=>a.point(k+1, y(k+1), {color:C.mid, r:4.6}))); }
  return a.svg();
}

/* One sample taken apart. Bits 0 1 0 1 1 after a line at rest; the sample is
   at t_i = 5 T_b, the end of the last bit. Top, the received waveform, the
   own pulse (violet) and the other pulses added together (red, dashed), each
   with its value at t_i. Bottom, the sample built tip to tail on one scale:
   the own bit mu a_i = 1 - q, the interference of the earlier bits, a noise
   value n(t_i) = -0.1, and the total, each with its share of the sum of the
   three sizes. The slider sets BT_b; a narrower channel shrinks the own bit
   and grows the interference. */
const SMP_B = [0,1,0,1,1], SMP_N = -0.1;
function isiParts(bt){ const q = rcq(bt), amp = SMP_B.map(b=>b?1:-1);
  const own = 1-q, isi = [0,1,2,3].reduce((s,k)=>s + amp[k]*(1-q)*Math.pow(q, 4-k), 0);
  return {q, own, isi, n:SMP_N, y:own+isi+SMP_N}; }
function figIsiSample(v){
  P.hOverride = null;
  const f = frameOf(v, 3), u = k => clamp01(f-k), big = P.labelScale() > 1;
  const bt = v && v.bt!=null ? v.bt : 0.25, r = rcResp(bt), ti = 5, pt = isiParts(bt);
  const y = rcTrain(SMP_B, bt), oth = t => y(t) - r(t-4);
  const Ht = big ? 290 : 250, Hb = big ? 200 : 176;
  const a = P.Axes({w:600, h:Ht, xr:[-0.4,5.6], yr:[-1.6,2.2], xlabel:'t', xunit:'T_b', ylabel:'y(t)',
    pad:{l:52,r:20,t:22,b:40}, xticksOverride:[0,1,2,3,4,5], yticksOverride:[-1,0,1]});
  bitDigits(a, SMP_B, 1.7);
  a.vline(ti, {color:C.ink, dash:'6 4', opacity:0.9});
  a.note(ti-0.08, -1.42, 't_i', {tex:true, fs:15, color:C.ink, anchor:'end'});
  a.curve(t=>t<0 ? 0 : y(t), {color:C.out, width:2.6, opacity:1-0.6*u(0), n:1200});
  fade(a, u(0), ()=>{ a.curve(t=>r(t-4), {color:C.mid, width:2.6, n:900}); a.point(ti, r(1), {color:C.mid, r:5}); });
  fade(a, u(1), ()=>{ a.curve(oth, {color:C.err, width:2, dash:'6 4', n:1200}); a.point(ti, oth(ti), {color:C.err, r:5}); });
  /* the noise moves the sample off the waveform */
  const yn = y(ti) + SMP_N*u(2);
  if(f > 2) a.poly([[ti, y(ti)], [ti, yn]], {color:C.noise, width:3});
  a.point(ti, yn, {color:C.out, r:5.5});

  /* the parts tip to tail: own, interference, noise, then the sample */
  const b = P.Axes({w:600, h:Hb, xr:[-0.55,1.55], yr:[0,4.3], xlabel:'', ylabel:'',
    pad:{l:14,r:20,t:10,b:30}, xticksOverride:[], yticksOverride:[], arrows:false});
  const tot = Math.abs(pt.own)+Math.abs(pt.isi)+Math.abs(pt.n), pc = x => Math.round(100*Math.abs(x)/tot)+'%';
  const sg = x => (x < 0 ? '-' : '+')+Math.abs(x).toFixed(3);
  b.vline(0, {color:C.ink, dash:'none', width:1.3, opacity:0.9});
  b.poly([[1,0],[1,0.22]], {color:C.muted, width:1.3});
  b.note(1.53, 4.3, 'share', {fs:12, color:C.muted, anchor:'end', dy:10});
  b.note(0, 0, '0', {tex:true, fs:13, color:C.ink, anchor:'middle', dy:18});
  b.note(1, 0, '1', {tex:true, fs:13, color:C.muted, anchor:'middle', dy:18});
  const rows = [
    {c:C.mid, lo:0, hi:pt.own, name:'\\mu a_i', at:0},
    {c:C.err, lo:pt.own, hi:pt.own+pt.isi, name:'\\text{ISI}', at:1},
    {c:C.noise, lo:pt.own+pt.isi, hi:pt.y, name:'n(t_i)', at:2},
    {c:C.out, lo:0, hi:pt.y, name:'y(t_i)', at:2, total:true}];
  rows.forEach((w,j)=>{ const yc = 3.6-j, o = u(w.at) * (w.total ? clamp01((f-2)*2-1) : 1);
    b.note(-0.06, yc, w.name, {tex:true, fs:15, color:w.c===C.noise ? C.ink : w.c, anchor:'end', dy:2});
    if(o < 0.01) return;
    const hi = w.lo + (w.hi-w.lo)*o;
    if(j > 0 && !w.total) b.poly([[w.lo, yc+1-0.3], [w.lo, yc+0.3]], {color:C.muted, width:1.1, dash:'3 3'});
    if(Math.abs(hi-w.lo) > 1e-4) b.rect(w.lo, yc-0.28, hi, yc+0.28, {fill:w.c});
    const val = w.total ? '='+pt.y.toFixed(3) : sg(w.hi-w.lo), tc = w.c===C.noise ? C.ink : w.c;
    fade(b, clamp01(o*1.5-0.5), ()=>{ b.note(Math.max(w.lo, w.hi)+0.03, yc, val, {tex:true, fs:14, color:tc, dy:2});
      if(!w.total) b.note(1.53, yc, pc(w.hi-w.lo), {fs:14, color:tc, anchor:'end', weight:600, dy:6}); });
  });
  return `<svg viewBox="0 0 600 ${Ht+Hb}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,600,Ht)}${place(b.svg(),0,Ht,600,Hb)}</svg>`;
}

/* The eye of the same channel: the received waveform cut into two-bit pieces
   centred on the sampling instant (the end of a bit) and laid on top of each
   other. Each trace is one pattern of seven bits; seven are enough because
   q^5 is negligible at these bandwidths. */
function eyeTraces(bt, n){
  const out = [], r = rcResp(bt);
  for(let j=0;j<n;j++){ const p = (j*37+45) % 128, bits = [];
    for(let k=0;k<7;k++) bits.push((p>>k)&1);
    const pts = []; for(let i=0;i<=120;i++){ const u = -1+2*i/120, t = 6+u;
      let s = 0; bits.forEach((b,k)=>{ s += (b?1:-1)*r(t-k); }); pts.push([u, s]); }
    out.push(pts); }
  return out;
}
/* The eye as the overlay of every bit pattern. A piece 2T_b long around a
   sampling instant t_k (the end of a bit) holds the bit just ended, the bit
   after it, and the tail of the bit before: three bits, eight patterns. The
   line before each pattern sits at the level of its first bit, so the eight
   pieces reach the best and the worst case of the 128-pattern eye. Left, the
   eight patterns through the RC channel with BT_b = 0.3, the window
   [-T_b, T_b] shaded. Each frame lifts one piece out of its window and lays
   it on the eye at the right: the newest in violet, the earlier ones green. */
const EYE_P = [0,1,2,3,4,5,6,7].map(n=>[n&1, (n>>1)&1, (n>>2)&1]);
const eyePiece = (bits, bt) => { const y = rcTrain(bits, bt, bits[0]?1:-1); return uu => y(uu+2); };
function figEyePatterns(v){
  P.hOverride = null;
  const f = Math.max(0, Math.min(8, frameOf(v, 8))), cur = Math.ceil(f-1e-9), p = ease(clamp01(f-(cur-1)));
  const bt = 0.3, RH = 54, T0 = 34, T1 = 190, EX = 226, W = 560, Y0 = 40, H = Y0+8*RH+6;
  const e = P.Axes({w:W-EX, h:H, xr:[-1,1], yr:[-1.5,1.5], xlabel:'t-t_k', xunit:'T_b', ylabel:'y(t)',
    pad:{l:56,r:20,t:Y0,b:42}, xticksOverride:[-1,0,1], ytarget:4});
  e.vline(0, {color:C.ink, dash:'6 4', opacity:0.8});
  const tx = uu => T0 + (uu+2)/3*(T1-T0), ty = (j, yy) => Y0 + j*RH + 34 - 14*yy;
  const ex = uu => EX + e.sx(uu), ey = yy => e.sy(yy);
  const d = pts => 'M'+pts.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join('L');
  const line = (pts, c, w, op=1, dash='') => `<path d="${d(pts)}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${op}"${dash?` stroke-dasharray="${dash}"`:''} stroke-linejoin="round"/>`;
  const span = (lo, hi, n) => Array.from({length:n+1}, (_,i)=>lo+(hi-lo)*i/n);
  const ax = (EX+e.x0-14), ay = ey(0);
  let left = '', arrows = '', eye = '';
  EYE_P.forEach((bits, j)=>{
    const y = eyePiece(bits, bt), k = j+1, on = k <= cur, now = k === cur, top = Y0 + j*RH;
    left += `<rect x="${tx(-1)}" y="${top+17}" width="${tx(1)-tx(-1)}" height="34" fill="${C.dec.mid}"/>`;
    left += line([[T0, ty(j,0)], [T1, ty(j,0)]], C.grid, 1);
    bits.forEach((b,i)=>{ left += `<text x="${tx(i-1.5).toFixed(1)}" y="${top+13}" font-size="14" font-weight="600" text-anchor="middle" fill="${now ? C.mid : C.ink}">${b}</text>`; });
    left += line(span(-2, 1, 90).map(uu=>[tx(uu), ty(j, y(uu))]), on ? C.out : C.muted, 1.6, on ? 1 : 0.5);
    if(on) left += line(span(-1, 1, 60).map(uu=>[tx(uu), ty(j, y(uu))]), now ? C.mid : C.out, 2.6);
    if(!on) return;
    arrows += line([[T1+6, ty(j,0)], [ax, ay]], now ? C.mid : C.muted, 1.3, now ? 0.9 : 0.45, '2 4');
    const pts = span(-1, 1, 80).map(uu=>{ const s = now ? p : 1;
      return [tx(uu) + (ex(uu)-tx(uu))*s, ty(j, y(uu)) + (ey(y(uu))-ty(j, y(uu)))*s]; });
    if(now) eye += line(pts, C.mid, 2.6);
    else eye = line(pts, C.out, 1.7, 0.85) + eye;
  });
  arrows += `<circle cx="${ax}" cy="${ay}" r="3" fill="${cur ? C.mid : C.muted}" opacity="${cur ? 0.9 : 0.4}"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${place(e.svg(), EX, 0, W-EX, H)}${left}${arrows}${eye}</svg>`;
}

/* Reading the eye of the RC channel at BT_b = 0.3, the 128 seven-bit
   patterns of figEyeLive. The current bit fills [-T_b, 0] and is sampled at
   t = 0, so the eye is widest there. Each frame adds one reading:
   the sampling instant; the opening +-(1-2q), the margin left for noise; the
   spread of the levels at t = 0, from 1-2q to 1, which is 2q; the zero
   crossings, which come at tau ln(1+|y_0|) after a sampling instant and so
   spread from tau ln(2-2q) to tau ln 2, with the window between the inner
   crossings in which a sample still decides correctly; and the slope of the
   worst trace 1 - 2 e^{-(t+T_b)/tau} near t = 0, which sets how much a timing
   error costs. Labels sit in a gutter right of the eye. */
function figEyeRead(v){
  const f = frameOf(v, 5), u = k => clamp01(f-k), bt = 0.3, q = rcq(bt), tau = 1/(2*Math.PI*bt), h = 1-2*q;
  const a = P.Axes({w:640, h:380, xr:[-1,1], yr:[-1.6,1.9], xlabel:'t', xunit:'T_b', ylabel:'y(t)',
    pad:{l:56,r:224,t:24,b:42}, xticksOverride:[-1,0,1], yticksOverride:[-1,0,1]});
  a.raw('<g opacity="0.5">');
  eyeTraces(bt, 128).forEach(pts=>a.poly(pts, {color:C.out, width:1.1}));
  a.raw('</g>');
  /* the labels stand in a column right of the eye, each on a leader */
  const lab = (y, s, c) => a.note(1.13, y, s, {tex:true, fs:14, color:c});
  const lead = (x0, y0, y1, c) => a.poly([[x0,y0],[1.1,y1]], {color:c, width:1.2});
  const cap = (x, ya, yb, c) => { a.poly([[x,ya],[x,yb]], {color:c, width:2.4});
    a.poly([[x-0.03,ya],[x+0.03,ya]], {color:c, width:2.4}); a.poly([[x-0.03,yb],[x+0.03,yb]], {color:c, width:2.4}); };
  fade(a, u(0), ()=>{ a.vline(0, {color:C.ink, dash:'6 4', width:1.4, opacity:1});
    a.note(0.04, 1.66, '\\text{best sampling time}', {tex:true, fs:14, color:C.ink}); });
  fade(a, u(1), ()=>{ cap(0.11, -h, h, C.mid); lead(0.14, 0.3, 0.3, C.mid); lab(0.3, '\\text{margin over noise}', C.mid); });
  fade(a, u(2), ()=>{ cap(0.05, h, 1, C.err); lead(0.08, 0.85, 1.25, C.err); lab(1.25, '\\text{distortion at }t=0', C.err); });
  const c0 = tau*Math.log(2-2*q), c1 = tau*Math.log(2);
  fade(a, u(3), ()=>{ [[c0,c1],[c0-1,c1-1]].forEach(([p,r])=>a.rect(p, -0.045, r, 0.045, {fill:C.err}));
    lead(c1+0.01, 0, -0.5, C.err); lab(-0.5, '\\text{zero-crossing spread}', C.err);
    a.poly([[c1-1,0.16],[c0,0.16]], {color:C.ink, width:1.6}); a.poly([[c1-1,0.07],[c1-1,0.25]], {color:C.ink, width:1.6});
    a.poly([[c0,0.07],[c0,0.25]], {color:C.ink, width:1.6});
    lead(c0+0.02, 0.2, -0.98, C.ink); lab(-0.98, '\\text{sampling window}', C.ink); });
  const t0 = -0.3, y0 = 1-2*Math.exp(-(t0+1)/tau), sl = (2/tau)*Math.exp(-(t0+1)/tau);
  fade(a, u(4), ()=>{ a.poly([[t0-0.16, y0-0.16*sl],[t0+0.16, y0+0.16*sl]], {color:C.ink, width:2.8});
    lead(t0+0.17, y0+0.17*sl, 0.78, C.ink); lab(0.78, '\\text{timing sensitivity}', C.ink); });
  return a.svg();
}
function figEyeLive(v){
  const bt = v && v.bt!=null ? v.bt : 0.3, q = rcq(bt), h = 1-2*q;
  const a = P.Axes(SZ({xr:[-1,1], yr:[-1.5,1.5], xlabel:'t', xunit:'T_b', ylabel:'y(t)',
    xticksOverride:[-1,-0.5,0,0.5,1], ytarget:4}));
  a.raw('<g opacity="0.5">');
  eyeTraces(bt, 128).forEach(pts=>a.poly(pts, {color:C.out, width:1.1}));
  a.raw('</g>');
  a.vline(0, {color:C.muted});
  if(h > 0.02){
    a.poly([[0.06,-h],[0.06,h]], {color:C.mid, width:2.4});
    a.poly([[0.03,h],[0.09,h]], {color:C.mid, width:2.4}); a.poly([[0.03,-h],[0.09,-h]], {color:C.mid, width:2.4});
    a.note(0.13, 1.3, `2(1-2q)=${(2*h).toFixed(3)}`, {tex:true, fs:15, color:C.mid});
  } else a.note(0.1, 0.06, '\\text{closed}', {tex:true, fs:16, color:C.err});
  return a.svg();
}

/* ---- 2.6 Nyquist and the raised cosine -----------------------------------
   T_b = 1, so R_b = 1 and the Nyquist bandwidth W = 1/2. Time is drawn in
   units of T_b and frequency in units of W, so the copies of a spectrum sit
   every 2W = R_b. A spectrum is drawn as P(f)/T_b, which is 1 on the flat part
   of the Nyquist rectangle. The pulse p(t) and its spectrum P(f) are cyan;
   the samples p(mT_b), the copies of P(f) and their sum P_delta(f), which
   belong to the sampled pulse, are violet as in Module 1. */
const rcPulse = (t, al) => { const den = 1-4*al*al*t*t;
  if(Math.abs(den) < 1e-6) return sinc(t)*Math.PI/4;
  return sinc(t)*Math.cos(Math.PI*al*t)/den; };
/* the second factor of the pulse, cos(2 pi alpha W t)/(1 - 16 alpha^2 W^2 t^2)
   with W = 1/2, and its limit pi/4 where the denominator vanishes */
const rcWin = (t, al) => { const den = 1-4*al*al*t*t;
  if(Math.abs(den) < 1e-6) return Math.PI/4;
  return Math.cos(Math.PI*al*t)/den; };
/* P(f)/T_b of the raised cosine, f in units of W */
const rcSpec = (f, al) => { const u = Math.abs(f), f1 = 1-al;
  if(al < 1e-9) return u <= 1 ? 1 : 0;
  if(u <= f1) return 1;
  if(u < 2-f1) return 0.5*(1-Math.sin(Math.PI*(u-1)/(2-2*f1)));
  return 0; };
const ease = s => s*s*(3-2*s);

/* Zero interference at the sampling instants. Five bits sent with a pulse
   that meets the criterion (the raised cosine of alpha = 0.5), mu = 1.
   Frame 0 draws each pulse a_k p(t - kT_b) and their sum y(t). Frame 1 picks
   the sampling instant t_i = 2T_b and the own pulse. In frame 2 a red marker
   runs down each other pulse to t_i, where every one of them is zero. Frame 3
   marks the sample y(t_i) = mu a_i, and the samples at the other instants. */
const NZ_A = [1,-1,1,1,-1], NZ_I = 2;
function figNyqZero(v){
  const f = frameOf(v, 3), u = k => clamp01(f-k), al = 0.5;
  const pk = k => t => NZ_A[k]*rcPulse(t-k, al);
  const y = t => NZ_A.reduce((s,a,k)=>s+a*rcPulse(t-k, al), 0);
  const a = P.Axes(SZ({xr:[-1.4,6.8], yr:[-1.75,2.2], xlabel:'t', xunit:'T_b', ylabel:'y(t)',
    xticksOverride:[0,1,2,3,4,5,6], yticksOverride:[-1,0,1]}));
  NZ_A.forEach((s,k)=>a.note(k+0.1, 1.86, (s > 0 ? '+1' : '-1'), {tex:true, fs:15, color:C.in}));
  a.curve(y, {color:C.out, width:2.6, opacity:1-0.6*u(0), n:1400});
  NZ_A.forEach((_,k)=>{
    if(k===NZ_I){
      fade(a, 1-u(0), ()=>a.curve(pk(k), {color:C.mid, width:1.4, dash:'5 4', n:900}));
      fade(a, u(0), ()=>a.curve(pk(k), {color:C.mid, width:2.8, n:900}));
      return; }
    fade(a, 1-u(1), ()=>a.curve(pk(k), {color:C.mid, width:1.4, dash:'5 4', n:900}));
    fade(a, u(1), ()=>a.curve(pk(k), {color:C.err, width:1.5, dash:'5 4', n:900}));
  });
  fade(a, u(0), ()=>{ a.vline(NZ_I, {color:C.ink, dash:'6 4', opacity:0.9});
    a.note(NZ_I+0.08, -1.5, 't_i', {tex:true, fs:15, color:C.ink});
    a.point(NZ_I, NZ_A[NZ_I], {color:C.mid, r:5.5}); });
  /* each other pulse is followed from its own peak down to t_i */
  const e = ease(u(1));
  if(f > 1.01) NZ_A.forEach((_,k)=>{ if(k===NZ_I) return;
    const t = k + (NZ_I-k)*e; a.point(t, pk(k)(t), {color:C.err, r:4.6}); });
  fade(a, clamp01((f-1.6)*2.5)*(1-u(2)), ()=>a.note(NZ_I-0.1, -1.4, 'p\\bigl((i-k)T_b\\bigr)=0', {tex:true, fs:15, color:C.err, anchor:'end'}));
  fade(a, u(2), ()=>{ NZ_A.forEach((_,k)=>{ if(k!==NZ_I) a.point(k, y(k), {color:C.out, r:4.4}); });
    a.point(NZ_I, y(NZ_I), {color:C.out, r:6});
    a.note(NZ_I-0.16, 1.25, 'y(t_i)=\\mu a_i', {tex:true, fs:15, color:C.out, anchor:'end'}); });
  return a.svg();
}

/* The sampled pulse and its spectrum, for a pulse whose spectrum is too
   narrow: p(t) = sinc(0.7t/T_b), so R_b P(f) = 1/0.7 on |f| < 0.35R_b = 0.7W.
   Above, the samples p(mT_b) rise as impulses, then the pulse fades and leaves
   p_delta(t). Below, P(f); its copies slide out to every 2W; their sum
   P_delta(f) = R_b sum P(f - nR_b) drops to zero in the gaps (red). */
const NS_B = 0.7;
const nsP = t => sinc(NS_B*t), nsS = x => Math.abs(x) < NS_B ? 1/NS_B : 0;
const nsAxes = big => P.Axes({w:560, h:big ? 225 : 190, xr:[-4.6,4.6], yr:[-0.45,1.3],
  xlabel:'t', xunit:'T_b', ylabel:'p(t),\\ p_\\delta(t)', pad:{l:56,r:26,t:24,b:40},
  xticksOverride:[-4,-3,-2,-1,0,1,2,3,4], yticksOverride:[0,1]});
const nfAxes = (big, yl) => P.Axes({w:560, h:big ? 230 : 200, xr:[-4.6,4.6], yr:[-0.15,1.75],
  xlabel:'f', xunit:'W', ylabel:yl, pad:{l:56,r:26,t:24,b:42},
  xticksOverride:[-4,-2,-1,0,1,2,4], yticksOverride:[0,1]});
function figNyqSample(v){
  P.hOverride = null;
  const f = frameOf(v, 3), u = k => clamp01(f-k), big = P.labelScale() > 1;
  const a = nsAxes(big);
  fade(a, 1-0.75*u(1), ()=>a.curve(nsP, {color:C.in, width:2.6, n:900}));
  for(let m=-4;m<=4;m++){ const w = nsP(m)*ease(clamp01(u(0)*1.6-Math.abs(m)*0.15));
    if(Math.abs(w) > 0.012) a.impulse(m, w, {color:C.mid, label:false}); }
  fade(a, u(1), ()=>a.note(0.28, 1.12, 'p_\\delta(t)', {tex:true, fs:15, color:C.mid}));
  const b = nfAxes(big, 'R_b\\,P(f-nR_b)'), s = ease(u(1));
  if(f > 1.01) fade(b, 1-u(2), ()=>[-2,-1,1,2].forEach(n=>{ const c = 2*n*s;
    b.poly([[c-NS_B,0],[c-NS_B,1/NS_B],[c+NS_B,1/NS_B],[c+NS_B,0]], {color:C.mid, width:1.8, dash:'6 4'}); }));
  fade(b, u(2), ()=>{ [-3,-1,1,3].forEach(c=>b.rect(c-(1-NS_B), 0, c+(1-NS_B), 1.6, {fill:C.dec.err}));
    b.curve(x=>{ let t = 0; for(let n=-3;n<=3;n++) t += nsS(x-2*n); return t; }, {color:C.mid, width:2.8, n:1400});
    b.note(0.2, 1.58, 'P_\\delta(f)', {tex:true, fs:15, color:C.mid}); });
  b.poly([[-4.6,0],[-NS_B,0],[-NS_B,1/NS_B],[NS_B,1/NS_B],[NS_B,0],[4.6,0]], {color:C.in, width:2.6});
  return stack(560, [[a.svg(),big ? 225 : 190],[b.svg(),big ? 230 : 200]]);
}

/* Nyquist's criterion in frequency. The pulse of the last figure is blended
   into one that meets the criterion, the raised cosine with alpha = 0.5:
   p_s = (1-s) g + s r. The blend is linear, so its samples are (1-s) g(mT_b)
   for m != 0 and 1 at m = 0, and its spectrum is the same blend of the two
   spectra. Frame 0 is the pulse with interference, frame 1 the blend done,
   p_delta(t) = delta(t); frame 2 draws the copies of the new spectrum, whose
   sum is 1 at every frequency. */
function figNyqFreq(v){
  P.hOverride = null;
  const f = frameOf(v, 2), u = k => clamp01(f-k), s = ease(u(0)), al = 0.5, big = P.labelScale() > 1;
  const pt = t => (1-s)*nsP(t) + s*rcPulse(t, al), Pf = x => (1-s)*nsS(x) + s*rcSpec(x, al);
  const a = nsAxes(big);
  a.curve(pt, {color:C.in, width:2, opacity:0.35, n:900});
  for(let m=-4;m<=4;m++){ const w = m ? (1-s)*nsP(m) : 1;
    if(Math.abs(w) > 0.012) a.impulse(m, w, {color:C.mid, label:false}); }
  fade(a, u(0), ()=>a.note(0.28, 1.12, 'p_\\delta(t)=\\delta(t)', {tex:true, fs:15, color:C.mid}));
  const b = nfAxes(big, 'R_b\\,P(f-nR_b)');
  fade(b, 1-s, ()=>[-3,-1,1,3].forEach(c=>b.rect(c-(1-NS_B), 0, c+(1-NS_B), 1.6, {fill:C.dec.err})));
  fade(b, u(1), ()=>[-2,-1,1,2].forEach(n=>b.curve(x=>Pf(x-2*n), {color:C.mid, width:1.6, dash:'6 4', n:900})));
  b.curve(Pf, {color:C.in, width:2.6, n:900});
  b.curve(x=>{ let t = 0; for(let n=-3;n<=3;n++) t += Pf(x-2*n); return t; }, {color:C.mid, width:2.8, n:1400});
  fade(b, u(1), ()=>b.note(0.2, 1.3, 'P_\\delta(f)=1', {tex:true, fs:15, color:C.mid}));
  return stack(560, [[a.svg(),big ? 225 : 190],[b.svg(),big ? 230 : 200]]);
}

/* The ideal Nyquist channel. Above, P(f) = 1/(2W) = T_b on |f| <= W; in the
   last frame its copies P(f +- 2W) slide in from +-4W and meet it edge to
   edge. Below, its pulse p(t) = sinc(2Wt) = sinc(t/T_b), drawn from left to
   right, then its zeros at t = kT_b, k != 0. */
function figNyqChannel(v){
  P.hOverride = null;
  const f = frameOf(v, 3), u = k => clamp01(f-k), big = P.labelScale() > 1;
  const hA = big ? 210 : 180, hB = big ? 230 : 200;
  const a = P.Axes({w:560, h:hA, xr:[-3.6,3.6], yr:[-0.15,1.6], xlabel:'f', xunit:'W', ylabel:'P(f)/T_b',
    pad:{l:56,r:26,t:24,b:40}, xticksOverride:[-3,-2,-1,0,1,2,3], yticksOverride:[0,1]});
  a.rect(-1, 0, 1, 1, {fill:C.dec.in});
  a.poly([[-3.6,0],[-1,0],[-1,1],[1,1],[1,0],[3.6,0]], {color:C.in, width:2.6});
  a.note(0.1, 1.22, 'P(f)', {tex:true, fs:15, color:C.in});
  const s = ease(u(2)), d = 2+2*(1-s);
  fade(a, s, ()=>[-1,1].forEach(n=>{ const c = n*d;
    a.poly([[c-1,0],[c-1,1],[c+1,1],[c+1,0]], {color:C.mid, width:1.8, dash:'6 4'});
    a.note(c, 1.22, n < 0 ? 'P(f+2W)' : 'P(f-2W)', {tex:true, fs:15, color:C.mid, anchor:'middle'}); }));
  const b = P.Axes({w:560, h:hB, xr:[-4.6,4.6], yr:[-0.4,1.25], xlabel:'t', xunit:'T_b', ylabel:'p(t)',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[-4,-3,-2,-1,0,1,2,3,4], yticksOverride:[0,1]});
  if(f > 0.01) b.curve(upTo(sinc, -4.6+9.2*ease(u(0))), {color:C.in, width:2.6, n:900});
  fade(b, u(1), ()=>{ for(let k=-4;k<=4;k++) if(k) b.point(k, 0, {color:C.mid, r:4.8});
    b.note(1.12, 0.62, 'p(kT_b)=0', {tex:true, fs:15, color:C.mid}); });
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The ideal pulse sampled eps late. Above, each neighbour adds p(kT_b + eps)
   (red stems) to the wanted term p(eps) (violet). Below, the sum of their
   sizes over 1 <= |k| <= K as K grows. For the sinc pulse the terms fall as
   1/(pi|k|) and the sum keeps growing, like a harmonic series. For the raised
   cosine with alpha = 0.5 (dashed) it levels off within a few bits. */
const isiSum = (eps, K, al) => { let s = 0;
  for(let k=1;k<=K;k++) s += Math.abs(rcPulse(k+eps, al)) + Math.abs(rcPulse(-k+eps, al)); return s; };
const sincIsi = eps => isiSum(eps, 20, 0);
function figSincOffset(v){
  P.hOverride = null;
  const eps = v && v.eps!=null ? v.eps : 0.1, big = P.labelScale() > 1;
  const hA = big ? 225 : 190, hB = big ? 230 : 200;
  const a = P.Axes({w:560, h:hA, xr:[-5.5,5.5], yr:[-0.35,1.3], xlabel:'t', xunit:'T_b', ylabel:'p(t)',
    pad:{l:56,r:26,t:24,b:40}, xticksOverride:[-4,-2,0,2,4], yticksOverride:[0,1]});
  a.curve(sinc, {color:C.in, width:2.6, n:900});
  const st = []; for(let k=-5;k<=5;k++) if(k) st.push([k+eps, sinc(k+eps)]);
  a.stem(st, {color:C.err});
  a.stem([[eps, sinc(eps)]], {color:C.mid});
  const K = 40;
  const b = P.Axes({w:560, h:hB, xr:[0,K+1], yr:[0,3.3], xlabel:'K\\;(\\text{neighbours on each side})',
    ylabel:'\\textstyle\\sum_{1\\le|k|\\le K}|p(kT_b+\\epsilon)|', pad:{l:56,r:26,t:24,b:42},
    xticksOverride:[0,10,20,30,40], yticksOverride:[0,1,2,3]});
  const run = al => { const pts = [[0,0]]; for(let k=1;k<=K;k++) pts.push([k, isiSum(eps, k, al)]); return pts; };
  const r0 = run(0), r5 = run(0.5);
  b.poly(r0, {color:C.err, width:2.6});
  b.poly(r5, {color:C.err, width:2.2, dash:'7 5'});
  /* the two readouts share one line in the upper left, which the sums never reach */
  b.note(1, 2.8, `\\alpha=0:\\ ${r0[K][1].toFixed(2)},\\qquad\\alpha=0.5\\ (\\text{dashed}):\\ ${r5[K][1].toFixed(2)}`, {tex:true, fs:15, color:C.err});
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* Building the raised-cosine spectrum, alpha = 0.5, so f_1 = W/2 and the
   band ends at 2W - f_1 = 3W/2. Frame 0 is the ideal rectangle (dashed).
   Frame 1 draws the flat part on |f| <= f_1. Frame 2 sweeps the roll-off out
   to 2W - f_1 on both sides. Frame 3 turns the piece the roll-off cuts from
   the rectangle (f_1 < |f| < W, above the curve) half a turn about the point
   (W, T_b/2); it lands on the piece the roll-off adds (W < |f| < 2W - f_1).
   A half turn is a point reflection, which an affine map keeps, so it is done
   in screen coordinates and still lands exactly. */
function figRcBuild(v){
  const f = frameOf(v, 3), u = k => clamp01(f-k), al = 0.5, f1 = 1-al, f2 = 1+al;
  const a = P.Axes(SZ({xr:[-2.3,2.3], yr:[-0.12,1.5], xlabel:'f', xunit:'W', ylabel:'P(f)/T_b',
    xticksOverride:[-2,-1.5,-1,-0.5,0,0.5,1,1.5,2], yticksOverride:[0,0.5,1]}));
  a.poly([[-2.3,0],[-1,0],[-1,1],[1,1],[1,0],[2.3,0]], {color:C.ink, width:1.6, dash:'6 5'});
  const w1 = f1*ease(u(0));
  if(w1 > 0.005) a.poly([[-w1,1],[w1,1]], {color:C.in, width:2.8});
  fade(a, u(0), ()=>{ a.vline(f1, {color:C.in, opacity:0.7}); a.vline(-f1, {color:C.in, opacity:0.7});
    a.note(-0.1, 1.13, '\\tfrac{1}{2W}=T_b', {tex:true, fs:15, color:C.in, anchor:'end'});
    a.note(f1-0.04, 1.32, 'f_1', {tex:true, fs:15, color:C.in, anchor:'end'}); });
  const end = f1+(f2-f1)*ease(u(1));
  if(f > 1.01){ a.curve(x=>{ const z = Math.abs(x); return z >= f1 && z <= end ? rcSpec(x, al) : NaN; }, {color:C.in, width:2.8, n:900});
    fade(a, u(1), ()=>{ a.poly([[-2.3,0],[-f2,0]], {color:C.in, width:2.8}); a.poly([[f2,0],[2.3,0]], {color:C.in, width:2.8});
      a.vline(f2, {color:C.in, opacity:0.7}); a.vline(-f2, {color:C.in, opacity:0.7});
      a.note(f2+0.04, 1.32, '2W-f_1', {tex:true, fs:15, color:C.in}); }); }
  if(f > 2.01){ const th = Math.PI*ease(u(2));
    const piece = sg => { const pts = []; for(let i=0;i<=48;i++){ const x = f1+(1-f1)*i/48; pts.push([sg*x, rcSpec(x, al)]); }
      pts.push([sg,1],[sg*f1,1]); return pts; };
    const turn = (pts, sg) => { const cx = a.sx(sg), cy = a.sy(0.5), t = sg*th;
      return pts.map(([x,y])=>{ const X = a.sx(x)-cx, Y = a.sy(y)-cy;
        return [cx+X*Math.cos(t)-Y*Math.sin(t), cy+X*Math.sin(t)+Y*Math.cos(t)]; }); };
    fade(a, clamp01(u(2)*4), ()=>[-1,1].forEach(sg=>{ const q = turn(piece(sg), sg);
      a.raw(`<path d="M${q.map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join('L')}Z" fill="${C.dec.mid}" stroke="${C.mid}" stroke-width="1.6" stroke-linejoin="round"/>`); }));
    fade(a, u(2), ()=>a.note(1.08, 0.62, '\\tfrac{1}{2}T_b', {tex:true, fs:15, color:C.mid})); }
  fade(a, u(1), ()=>{ a.point(1, 0.5, {color:C.mid, r:5}); a.point(-1, 0.5, {color:C.mid, r:5}); });
  return a.svg();
}

/* The copies of the raised cosine, alpha = 0.5, add to a constant. Above,
   P(f), then P(f + 2W) and P(f - 2W) sliding in from +-4W. In the overlaps
   (shaded) a cursor stacks the two values that meet at one frequency: the
   rising edge of P(f) (cyan) and the falling edge of P(f + 2W) (violet),
   which always reach T_b. Below, their sum, drawn from left to right. */
function figRcCheck(v){
  P.hOverride = null;
  const f = frameOf(v, 3), u = k => clamp01(f-k), al = 0.5, big = P.labelScale() > 1;
  const hA = big ? 240 : 215, hB = big ? 205 : 180;
  const a = P.Axes({w:560, h:hA, xr:[-3.4,3.4], yr:[-0.12,1.55], xlabel:'f', xunit:'W', ylabel:'P(f-nR_b)/T_b',
    pad:{l:56,r:26,t:24,b:40}, xticksOverride:[-3,-2,-1,0,1,2,3], yticksOverride:[0,0.5,1]});
  const s = ease(u(0)), d = 2+2*(1-s);
  fade(a, u(1), ()=>{ a.rect(-1-al, 0, -1+al, 1.08, {fill:C.dec.mid}); a.rect(1-al, 0, 1+al, 1.08, {fill:C.dec.mid}); });
  fade(a, s, ()=>[-1,1].forEach(n=>{ a.curve(x=>rcSpec(x-n*d, al), {color:C.mid, width:2.2, dash:'7 4', n:900});
    a.note(n*d, 1.24, n < 0 ? 'P(f+2W)' : 'P(f-2W)', {tex:true, fs:15, color:C.mid, anchor:'middle'}); }));
  a.curve(x=>rcSpec(x, al), {color:C.in, width:2.6, n:900});
  a.note(0.1, 1.24, 'P(f)', {tex:true, fs:15, color:C.in});
  const xc = -1.38+0.6*ease(u(1)), y1 = rcSpec(xc, al), y2 = rcSpec(xc+2, al), bw = 0.05;
  fade(a, u(1), ()=>{ a.rect(xc-bw, 0, xc+bw, y1, {fill:C.in}); a.rect(xc-bw, y1, xc+bw, y1+y2, {fill:C.mid});
    a.hline(1, {color:C.ink, dash:'6 4', opacity:0.8}); a.note(xc, 1.1, 'T_b', {tex:true, fs:15, color:C.ink, anchor:'middle'}); });
  const b = P.Axes({w:560, h:hB, xr:[-3.4,3.4], yr:[-0.12,1.4], xlabel:'f', xunit:'W', ylabel:'R_b\\sum_nP(f-nR_b)',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[-3,-2,-1,0,1,2,3], yticksOverride:[0,1]});
  if(f > 2.01){ b.curve(upTo(x=>{ let t = 0; for(let n=-3;n<=3;n++) t += rcSpec(x-2*n, al); return t; }, -3.4+6.8*ease(u(2))), {color:C.mid, width:2.8, n:900});
    fade(b, u(2), ()=>b.note(0, 1.18, '=1', {tex:true, fs:15, color:C.mid, anchor:'middle'})); }
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* The raised-cosine pulse built as a product, alpha = 0.5. Frame 0 is the
   sinc factor with its zeros at kT_b. Frame 1 adds the second factor (violet).
   Frame 2 multiplies them: the cyan trace turns from the sinc into p(t), and
   the zeros stay. Frame 3 sets the pulses of alpha = 0, 0.5 and 1 side by side. */
function figRcPulse(v){
  const f = frameOf(v, 3), u = k => clamp01(f-k), al = 0.5, s = ease(u(1));
  const a = P.Axes(SZ({xr:[-4.5,4.5], yr:[-0.35,1.25], xlabel:'t', xunit:'T_b', ylabel:'p(t)',
    xticksOverride:[-4,-3,-2,-1,0,1,2,3,4], yticksOverride:[0,0.5,1]}));
  fade(a, u(1), ()=>a.curve(sinc, {color:C.in, width:1.6, dash:'6 5', n:900}));
  fade(a, u(0)*(1-0.55*u(1))*(1-u(2)), ()=>a.curve(t=>rcWin(t, al), {color:C.mid, width:2.4, n:900}));
  a.curve(t=>sinc(t)*(1-s+s*rcWin(t, al)), {color:C.in, width:2.8, n:900});
  fade(a, u(2), ()=>a.curve(t=>rcPulse(t, 1), {color:C.mid, width:2.4, n:900}));
  for(let k=-4;k<=4;k++) if(k) a.point(k, 0, {color:C.mid, r:4.6});
  return a.svg();
}

/* The roll-off chosen with a slider. Above, the spectrum with a strip that
   names its bands: the passband |f| <= f_1, the transition band out to
   (1 + alpha)W, and the stop band beyond. Below, the pulse against the sinc
   pulse (alpha = 0, dashed), with the tails past |t| = 2T_b shaded and the
   largest of them read out. */
const rcTail = al => { let m = 0; for(let t=2;t<=12;t+=0.005) m = Math.max(m, Math.abs(rcPulse(t, al))); return m; };
function figRcAlpha(v){
  P.hOverride = null;
  const al = v && v.al!=null ? v.al : 0.5, f1 = 1-al, f2 = 1+al, big = P.labelScale() > 1;
  const hA = big ? 225 : 200, hB = big ? 225 : 195;
  const a = P.Axes({w:560, h:hA, xr:[-2.3,2.3], yr:[-0.12,1.75], xlabel:'f', xunit:'W', ylabel:'P(f)/T_b',
    pad:{l:56,r:26,t:24,b:40}, xticksOverride:[-2,-1,0,1,2], yticksOverride:[0,0.5,1]});
  const strip = (x0, x1, fill) => { if(x1-x0 > 1e-3) a.rect(x0, 1.22, x1, 1.3, {fill}); };
  strip(-f1, f1, C.in); strip(f1, f2, C.mid); strip(-f2, -f1, C.mid); strip(f2, 2.3, C.grid); strip(-2.3, -f2, C.grid);
  /* names on the right half only, each where it fits, so none crosses the axis */
  const lab = (x0, x1, s) => { if(a.sx(x1)-a.sx(x0) > 6.8*s.length*P.labelScale()+4) a.note((x0+x1)/2, 1.42, s, {fs:13, color:C.ink, anchor:'middle'}); };
  lab(0, f1, 'passband'); lab(f1, f2, 'transition'); lab(f2, 2.3, 'stop');
  a.curve(x=>rcSpec(x, al), {color:C.in, width:2.6, n:900});
  a.note(-2.22, 0.72, `B_T=${(1+al).toFixed(2)}\\,W`, {tex:true, fs:15, color:C.in});
  const b = P.Axes({w:560, h:hB, xr:[-4.6,4.6], yr:[-0.35,1.25], xlabel:'t', xunit:'T_b', ylabel:'p(t)',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[-4,-2,0,2,4], yticksOverride:[0,0.5,1]});
  b.rect(2, -0.35, 4.6, 1.25, {fill:C.dec.err}); b.rect(-4.6, -0.35, -2, 1.25, {fill:C.dec.err});
  b.curve(sinc, {color:C.in, width:1.5, dash:'6 5', n:900});
  b.curve(t=>rcPulse(t, al), {color:C.in, width:2.6, n:900});
  b.note(-4.45, 1.0, `\\max_{|t|\\ge2T_b}|p(t)|=${rcTail(al).toFixed(3)}`, {tex:true, fs:15, color:C.err});
  return stack(560, [[a.svg(),hA],[b.svg(),hB]]);
}

/* Worked example: R_b = 20 kb/s, so W = 10 kHz. The given trace is the ideal
   rectangle; the answer is the raised cosine with alpha = 0.5. */
function figExRc(){
  const a = P.Axes(SZ({xr:[-22,22], yr:[-0.12,P.labelScale()>1?1.5:1.35], xlabel:'f\\;(\\text{kHz})', ylabel:'P(f)/T_b',
    xticksOverride:[-20,-15,-10,-5,0,5,10,15,20], ytarget:3}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  a.poly([[-22,0],[-10,0],[-10,1],[10,1],[10,0],[22,0]], {color:C.ink, width:1.6, dash:'6 5'});
  a.raw('<g class="sk-key">');
  a.curve(f=>rcSpec(f/10, 0.5), {color:C.in, width:2.6, n:900});
  a.span(-15, 15, 1.18, 'B_T=15\\ \\text{kHz}', {tex:true, fs:15, color:C.in});
  a.raw('</g>');
  return a.svg();
}

/* Splitting the raised cosine, alpha = 0.5. Above, the link with a square-
   root filter at each end of a flat channel; the two filters light up in
   frame 2. Below, P(f)/T_b (cyan), then its square root (amber); in the last
   frame the root is multiplied by the second root, (P/T_b)^(1/2 + s/2), and
   lands on the raised cosine. */
function figSrrc(v){
  P.hOverride = null;
  const f = frameOf(v, 3), u = k => clamp01(f-k), al = 0.5, big = P.labelScale() > 1;
  const yc = 46, bh = 42, by = yc-bh/2;
  const it = [
    {t:'arrow',x1:4,y1:yc,x2:44,y2:yc,label:'a_k',tex:true,color:C.in},
    {t:'box',x:44,y:by,w:76,h:bh,label:'H_T(f)',tex:true},
    {t:'arrow',x1:120,y1:yc,x2:156,y2:yc},
    {t:'box',x:156,y:by,w:82,h:bh,label:'channel',fs:14,color:C.h},
    {t:'arrow',x1:238,y1:yc,x2:262,y2:yc},
    {t:'sum',x:276,y:yc},
    {t:'arrow',x1:276,y1:100,x2:276,y2:yc+16,color:C.muted},
    {t:'text',x:266,y:106,label:'w(t)',tex:true,anchor:'end',fs:14},
    {t:'arrow',x1:290,y1:yc,x2:318,y2:yc},
    {t:'box',x:318,y:by,w:76,h:bh,label:'H_R(f)',tex:true},
    {t:'arrow',x1:394,y1:yc,x2:430,y2:yc,label:'y(t)',tex:true,color:C.out},
    {t:'line',d:`M430,${yc} l16,-12`},
    {t:'text',x:442,y:yc+26,label:'t_i',tex:true,fs:14},
    {t:'arrow',x1:454,y1:yc,x2:520,y2:yc,label:'y(t_i)',tex:true,color:C.mid},
    {t:'text',x:82,y:88,label:'transmitter',fs:12},
    {t:'text',x:356,y:88,label:'receiver',fs:12}];
  const g = u(1)*(1-0.6*u(2));
  const glow = g > 0.01 ? [44,318].map(x=>`<rect x="${x}" y="${by}" width="76" height="${bh}" fill="${C.dec.h}" opacity="${g.toFixed(3)}" rx="2"/>`).join('') : '';
  const top = P.blocks({w:560, h:116, items:it}).replace(/(<svg[^>]*>)/, '$1'+glow);
  const H = big ? 295 : 265;
  const b = P.Axes({w:560, h:H, xr:[-2.2,2.2], yr:[-0.1,1.4], xlabel:'f', xunit:'W', ylabel:'\\text{response}',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[-2,-1.5,-1,-0.5,0,0.5,1,1.5,2], yticksOverride:[0,0.5,1]});
  b.curve(x=>rcSpec(x, al), {color:C.in, width:2.6, n:900});
  fade(b, 1-u(1), ()=>b.note(-2.1, 1.2, 'P(f)/T_b', {tex:true, fs:15, color:C.in}));
  const p = 0.5+0.5*ease(u(2));
  fade(b, u(0), ()=>b.curve(x=>Math.pow(rcSpec(x, al), p), {color:C.h, width:2.6, dash:'8 5', n:900}));
  fade(b, u(1)*(1-u(2)), ()=>b.note(2.15, 1.2, 'H_T(f)=H_R(f)=\\sqrt{P(f)}', {tex:true, fs:15, color:C.h, anchor:'end'}));
  fade(b, u(2), ()=>b.note(2.15, 1.2, 'H_T(f)\\,H_R(f)=P(f)', {tex:true, fs:15, color:C.in, anchor:'end'}));
  return `<svg viewBox="0 0 560 ${116+H}" xmlns="http://www.w3.org/2000/svg" role="img">${place(top,0,0,560,116)}${place(b.svg(),0,116,560,H)}</svg>`;
}

/* ---- the whole receiver --------------------------------------------------
   Eight bits through the chain. The noise is heavy enough that one decision,
   the second bit, is wrong, and that decision is red. */
const CH_B = [1,0,0,1,1,0,1,0];
const CH_W = noiseFn(20260942, 0.25, 0.9, -1, 10);
const chS = nrz(CH_B), chX = t => t>=0 && t<8 ? chS(t)+CH_W(t) : 0;
const chY = k => { let s = 0; const N = 200; for(let i=0;i<N;i++) s += chX(k+(i+0.5)/N); return s/N; };
function figChain(v){
  P.hOverride = null;
  const f = frameOf(v, 4), op = k => clamp01(f-k+1);
  const ax = (h, yr, yl, pb) => P.Axes({w:560,h,xr:[-0.2,8.3],yr,xlabel:pb?'t/T_b':'',ylabel:yl,
    pad:{l:56,r:26,t:22,b:pb?40:14},xticksOverride:pb?[0,2,4,6,8]:[],ytarget:2});
  const a = ax(120, [-1.6,1.9], 's(t)', false);
  CH_B.forEach((b,k)=>a.note(k+0.5, 1.55, String(b), {fs:15, color:C.ink, anchor:'middle', weight:600}));
  if(op(1) > 0.02) a.curve(chS, {color:C.in, width:2.4, n:1400, opacity:op(1)});
  const b = ax(120, [-3.2,3.2], 'x(t)', false);
  if(op(2) > 0.02) b.curve(chX, {color:C.out, width:1.4, n:1400, opacity:op(2)});
  const c = ax(170, [-1.9,2.0], 'y_k', true);
  if(op(3) > 0.02){ c.hline(0, {color:C.muted});
    c.stem(CH_B.map((_,k)=>[k+1, chY(k)*op(3)]), {color:C.mid}); }
  if(op(4) > 0.5) CH_B.forEach((bit,k)=>{ const d = chY(k) > 0 ? 1 : 0;
    c.note(k+1, 1.62, String(d), {fs:15, color:d===bit ? C.out : C.err, anchor:'middle', weight:600}); });
  return stack(560, [[a.svg(),120],[b.svg(),120],[c.svg(),170]]);
}

/* Small sketches for the summary cards, in the dark-page signal tints. */
const G = (()=>{
  const sv = b => `<svg viewBox="0 0 92 44">${b}</svg>`;
  const ln = (d,c,w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const AX='rgba(239,231,216,.30)', CY='#4FBECE', GR='#82C27B', RD='#E8785F', VI='#AC99DC', AM='#E5B255';
  const bell = (m,s,h,y0) => 'M'+[...Array(61)].map((_,k)=>{ const x=4+84*k/60, u=(x-m)/s;
    return x.toFixed(1)+','+(y0-h*Math.exp(-u*u/2)).toFixed(1); }).join('L');
  const sincPath = (x0,w,y0,h,col) => ln('M'+[...Array(81)].map((_,k)=>{ const u=-4+8*k/80;
    return (x0+w*k/80).toFixed(1)+','+(y0-h*sinc(u)).toFixed(1); }).join('L'), col, 1.8);
  return {
    white:  sv(ln('M1 38 H91',AX,1)+ln('M4 18 H88',CY)+ln('M46 38 V6',VI,1.6)),
    filt:   sv(ln('M1 38 H91',AX,1)+ln('M4 16 H88',CY,1.4)+ln(bell(46,11,26,38),GR)),
    mf:     sv(ln('M1 38 H91',AX,1)+ln('M8 38 V14 H40 V38',CY,1.6)+ln('M46 38 L66 8 L86 38',VI)),
    snr:    sv(ln('M1 38 H91',AX,1)+ln('M10 36 Q46 -8 82 36',AM)+ln('M10 36 Q46 10 82 36',CY,1.6)),
    space:  sv(ln('M4 24 H88',AX,1)+`<circle cx="20" cy="24" r="4.5" fill="${CY}"/><circle cx="72" cy="24" r="4.5" fill="${CY}"/>`
              +ln('M20 12 V8 H72 V12',AX,1.2)),
    corr:   sv(ln('M1 38 H91',AX,1)+ln('M8 38 L46 8 L84 38',VI,4)+ln('M8 38 L46 8 V38 H84',GR,1.6)),
    noise:  sv(ln('M1 38 H91',AX,1)+ln(bell(46,12,28,38),VI)),
    thresh: sv(ln('M1 38 H91',AX,1)+ln(bell(28,10,26,38),VI)+ln(bell(64,10,18,38),VI)+ln('M50 4 V40',AM,1.6)),
    q:      sv(ln('M1 38 H91',AX,1)+`<path d="${bell(40,13,28,38)}" fill="none"/>`+ln(bell(40,13,28,38),VI)
              +`<path d="M58 38 L58 ${(38-28*Math.exp(-0.5*(18/13)**2)).toFixed(1)} Q70 34 88 37.5 L88 38 Z" fill="rgba(172,153,220,.35)"/>`),
    pb:     sv(ln('M6 4 V40 H90',AX,1)+ln('M8 6 Q40 8 58 22 T86 40',CY)),
    isi:    sv(ln('M1 30 H91',AX,1)+ln('M4 30 H12 V10 H36 V30',CY,1.4)+ln('M12 30 Q18 12 36 12 Q44 26 88 30',GR)),
    eye:    sv(ln('M4 36 C30 36 34 8 60 8 H88 M4 8 C30 8 34 36 60 36 H88 M4 36 H88 M4 8 H88',GR,1.6)),
    nyq:    sv(ln('M1 38 H91',AX,1)+sincPath(2,88,34,26,CY)),
    rc:     sv(ln('M1 38 H91',AX,1)+ln('M4 38 L18 38 C26 38 26 10 34 10 H58 C66 10 66 38 74 38 H88',CY))
  };
})();

/* A gallery of four everyday cases closing a section: the figures in a 2×2
   grid, and the cards beside them revealed one at a time. */
function realGallery(cfg){
  return { id:cfg.id, module:'M2', nav:cfg.nav, title:cfg.title, src:cfg.src,
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

/* ---- the galleries ------------------------------------------------------ */

/* 2.1. A chirp of T = 10 us sweeping B = 5 MHz: at zero Doppler its matched
   output is (1 - |t|/T)|sinc(B t (1 - |t|/T))|. The Barker code of 802.11b and
   its aperiodic autocorrelation. An ultrasonic echo at 5.83 ms, 1.00 m away at
   343 m/s. A UART bit at 9600 baud through its integrate-and-dump. */
const BARKER = [1,-1,1,1,-1,1,1,1,-1,-1,-1];
const barkerR = k => { let s = 0; for(let n=0;n+Math.abs(k)<11;n++) s += BARKER[n]*BARKER[n+Math.abs(k)]; return s; };
const US_W = noiseFn(41, 0.08, 0.05, -1, 12), UA_W = noiseFn(43, 0.01, 0.35, -1, 2);
const REAL_MATCHED = realGallery({ id:'m2-real-matched', nav:'Matched filters around us',
  title:'Matched filters around us', eyebrow:'Module 2 · The matched filter', src:'CH8 s.9',
  objective:'Recognise the matched filter in radar, Wi-Fi, range finders and serial ports.',
  keywords:'examples radar chirp pulse compression barker code wifi 802.11b ultrasonic range finder echo uart integrate and dump',
  figs:[
    [()=>{ const T = 10, B = 5, a=P.Axes(EXO({xr:[-1.2,1.2],yr:[-0.08,1.2],xlabel:'t\\;(\\mu\\text{s})',ylabel:'|y(t)|/E',
        xticksOverride:[-1,-0.5,0,0.5,1],ytarget:3}));
      a.curve(t=>(1-Math.abs(t)/T)*Math.abs(sinc(B*t*(1-Math.abs(t)/T))),{color:C.mid,width:2.2,n:900});
      a.span(-0.1,0.1,1.08,'1/B',{tex:true,fs:14,color:C.muted});
      return a.svg(); }, 'A radar chirp lasts $T=10\\ \\mu$s and sweeps $B=5$ MHz. Its matched output is $(1-|t|/T)\\,|\\operatorname{sinc}(Bt(1-|t|/T))|$, a peak about $1/B=0.2\\ \\mu$s wide.'],
    [()=>{ const a=P.Axes(EXO({xr:[-11,11],yr:[-2,12.5],xlabel:'k',ylabel:'R[k]',xticksOverride:[-10,-5,0,5,10],yticksOverride:[0,5,10]}));
      const st=[]; for(let k=-10;k<=10;k++) st.push([k,barkerR(k)]);
      a.stem(st,{color:C.mid,showZero:true});
      return a.svg(); }, 'Wi-Fi at $1$ and $2$ Mb/s spreads each bit over the $11$-chip Barker code $c[n]$. Its matched output $R[k]=\\sum_n c[n]\\,c[n+k]$ is $11$ at $k=0$ and $0$ or $-1$ elsewhere.'],
    [()=>{ const t0 = 5.83, a=P.Axes(EXO({xr:[0,10],yr:[-0.2,1.25],xlabel:'t\\;(\\text{ms})',ylabel:'y(t)',xtarget:6,ytarget:3}));
      a.curve(t=>Math.max(0,1-Math.abs(t-t0)/0.4)+US_W(t),{color:C.mid,width:1.8,n:900});
      a.vline(t0,{color:C.muted});
      a.note(t0+0.2,1.08,'t_0=5.83\\ \\text{ms}',{tex:true,fs:14,color:C.mid});
      return a.svg(); }, 'An ultrasonic range finder correlates the echo with the pulse it sent. The peak at $t_0=5.83$ ms gives $d=ct_0/2=1.00$ m for $c=343$ m/s.'],
    [()=>{ const Tb = 104.2, a=P.Axes(EXO({xr:[-10,230],yr:[-0.5,1.9],xlabel:'t\\;(\\mu\\text{s})',ylabel:'\\text{amplitude}', ynameAtAxis:true,xticksOverride:[0,104.2,208.4],
        xtickfmt:v=>v?String(+v.toFixed(1)):'0',ytarget:3}));
      a.curve(t=>t>=0&&t<Tb?1+UA_W(t/Tb):0,{color:C.out,width:1.3,n:900});
      a.curve(t=>{ if(t<0||t>=Tb) return t>=Tb ? 0 : NaN; let s=0; const N=120; for(let i=0;i<N;i++){ const u=t*(i+0.5)/N; s+=1+UA_W(u/Tb); } return s/N*(t/Tb); },{color:C.mid,width:2.4,n:600});
      a.point(Tb,(()=>{ let s=0; for(let i=0;i<400;i++) s+=1+UA_W((i+0.5)/400); return s/400; })(),{color:C.mid,r:5});
      { const px=1/(a.sx(1)-a.sx(0)), L=P.labelScale(); keyEntry(a,222-110*L*px,1.6,'x(t)',C.out,{width:1.3}); keyEntry(a,222-50*L*px,1.6,'y(t)',C.mid,{width:2.4}); }
      return a.svg(); }, 'A serial port at $9600$ baud integrates each bit over $T_b=1/9600=104.2\\ \\mu$s, then dumps. The integrator is the matched filter of a rectangular bit.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Correlation with a template', html:'Each receiver correlates what it hears with a copy of what was sent. That is the matched filter $h(t)=g(T-t)$ read at its peak.'},
    {t:'note', kind:'def', head:'Peak time', html:'The peak falls where the copy lines up with the echo. Its time is the delay, and the delay gives the range.'},
    {t:'note', kind:'warn', head:'Pulse compression', html:'A long chirp carries much energy, and its matched output is still a peak about $1/B$ wide. The resolution comes from the bandwidth $B$, not from the length $T$.'}
  ]});

/* 2.2. Polar signalling on an RS-485 pair, a UART's sixteen samples a bit, a
   histogram of y at E_b/N_0 = 6 dB, and a sampling instant 0.1 T_b early. */
const RS_B = [1,0,1,1,0,0,1,0], RS_W = noiseFn(47, 0.03, 0.12, -1, 10);
const UART_X = gauss(53, 16, 0.45).map(v=>1+v);
const HIST = (()=>{ const s = 1/Math.sqrt(2*Math.pow(10,0.6)), n = gauss(59, 4000, s), bins = new Array(50).fill(0);
  n.forEach((v,i)=>{ const y = (i%2 ? 1 : -1) + v, k = Math.floor((y+2.5)/0.1); if(k>=0 && k<50) bins[k]++; });
  return bins.map((c,k)=>[-2.45+0.1*k, c]); })();
const REAL_DEMOD = realGallery({ id:'m2-real-demod', nav:'Demodulators around us',
  title:'Demodulators around us', eyebrow:'Module 2 · The demodulator', src:'CH8 s.19–20',
  objective:'See antipodal signalling and the correlator in serial links and digital receivers.',
  keywords:'examples rs-485 differential polar nrz uart oversampling sixteen samples histogram decision statistic sampling instant timing offset',
  figs:[
    [()=>{ const a=P.Axes(EXO({xr:[0,8],yr:[-3.2,3.2],xlabel:'t\\;(\\mu\\text{s})',ylabel:'v_{AB}(t)\\;(\\text{V})',xtarget:5,yticksOverride:[-2,0,2]}));
      a.curve(t=>2*nrz(RS_B)(t)+RS_W(t),{color:C.out,width:1.6,n:1200});
      a.curve(t=>2*nrz(RS_B)(t),{color:C.in,width:2.2,n:1200,dash:'6 5'});
      return a.svg(); }, 'An RS-485 pair at $1$ Mb/s sends $s(t)=\\pm A$ on the difference of two wires, with $A=2$ V. That is polar signalling with $s_m=\\pm A\\sqrt{T_b}$.'],
    [()=>{ const a=P.Axes(EXO({xr:[-1,16],yr:[-0.3,2.2],xlabel:'n',ylabel:'x[n]',xticksOverride:[0,5,10,15],ytarget:3}));
      a.stem(UART_X.map((v,n)=>[n,v]),{color:C.out});
      a.hline(1,{color:C.muted});
      return a.svg(); }, 'A UART takes $16$ samples a bit. The sum $y=\\sum_{n=0}^{15}x[n]$ is a correlator with a rectangular $\\psi$, run on samples.'],
    [()=>{ const a=P.Axes(EXO({xr:[-2.5,2.5],yr:[-10,260],xlabel:'y/\\sqrt{E_b}',ylabel:'\\text{count}',xticksOverride:[-2,-1,0,1,2],ytarget:3}));
      a.stem(HIST,{color:C.mid,r:2.4});
      a.vline(0,{color:C.muted});
      return a.svg(); }, 'The values of $y$ for $4000$ bits at $E_b/N_0=6$ dB. The two bumps sit at $\\pm\\sqrt{E_b}$, each with spread $\\sigma=\\sqrt{N_0/2}$.'],
    [()=>{ const a=P.Axes(EXO({xr:[-0.1,2.1],yr:[-0.1,1.25],xlabel:'t', xunit:'T_b',ylabel:'y(t)/\\sqrt{E_b}',xticksOverride:[0,0.5,1,1.5,2],ytarget:3}));
      a.poly([[-0.1,0],[0,0],[1,1],[2,0],[2.1,0]],{color:C.mid,width:2.4});
      a.point(1,1,{color:C.mid,r:4.5}); a.point(0.9,0.9,{color:C.err,r:4.5});
      return a.svg(); }, 'Sampled $0.1T_b$ early, the output keeps $0.9\\sqrt{E_b}$. The signal energy seen drops to $0.81E_b$, a loss of $0.92$ dB.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Two points on a line', html:'Every antipodal link sends $\\pm A$ for one bit. After the demodulator only the number $y=\\pm\\sqrt{E_b}+n$ is left.'},
    {t:'note', kind:'def', head:'A correlator on samples', html:'A digital receiver adds samples instead of integrating. The sum of $N$ samples a bit is the correlator with $\\psi$ sampled $N$ times.'},
    {t:'note', kind:'warn', head:'Timing', html:'The correlator is read at the end of the bit. An offset of $\\epsilon$ scales the signal term by $1-\\epsilon/T_b$.'}
  ]});

/* 2.3. The P_b curve with the 1e-10 target of wired Ethernet; a sensor whose
   symbol 1 is rare; Q(x) on decades; error counts in blocks of 1e5 bits. */
const ERR_CNT = (()=>{ const r = rng(61), out = [];
  for(let b=0;b<20;b++){ let k = 0, p = Math.exp(-10), s = p; const u = r(); while(u > s){ k++; p *= 10/k; s += p; } out.push([b+1, k]); }
  return out; })();
const REAL_DECISION = realGallery({ id:'m2-real-decision', nav:'Error rates around us',
  title:'Error rates around us', eyebrow:'Module 2 · The decision and its error', src:'CH8 s.29–31',
  objective:'Relate the error probability to link targets, rare events and measured error counts.',
  keywords:'examples bit error rate target ethernet 1e-10 q function table rare event sensor prior threshold error counter poisson',
  figs:[
    [()=>{ const L=P.labelScale(), big=L>1;
      /* in projector mode the panel is taller and reaches lower, so the 13.1 dB
         label fits under the target line */
      const a=P.Axes(EXO({h:big?290:250,xr:[0,16],yr:[big?-13:-12,-0.02],xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_b',ytickfmt:P.decade,
        yticksOverride:[-12,-9,-6,-3],zeroAxes:false,pad:{l:64,r:26,t:24,b:44},xtarget:5}));
      a.curve(d=>{ const p=pbDb(d); return p>1.5e-12 ? Math.log10(p) : NaN; },{color:C.in,width:2.2});
      a.hline(-10,{color:C.muted}); a.point(13.06,-10,{color:C.in,r:4.5});
      a.note(12.6,big ? -11.5-5*L/(a.sy(0)-a.sy(1)) : -11.3,'13.1\\ \\mathrm{dB}',{tex:true,fs:14,color:C.in,anchor:'end'});
      return a.svg(); }, 'Wired Ethernet asks for $P_b<10^{-10}$. Polar signalling reaches it at $E_b/N_0=13.1$ dB, where $\\sqrt{2E_b/N_0}=6.36$.'],
    [()=>{ const p0 = 0.9, s = 0.5, lo = lamOpt(0.5,1,p0), a=P.Axes(EXO({xr:[-2.5,2.5],yr:[-0.04,0.8],xlabel:'y',ylabel:'P(s_m)\\,f_Y(y\\mid s_m)',xticksOverride:[-2,-1,0,1,2],ytickfmt:()=>'',ytarget:3}));
      a.curve(y=>p0*dens(y,-1,s),{color:C.mid,width:2.2,dash:'7 5'});
      a.curve(y=>(1-p0)*dens(y,1,s),{color:C.mid,width:2.2});
      a.vline(lo,{color:C.ink,dash:'6 4',width:1.4,opacity:1});
      return a.svg(); }, 'A sensor reports a rare event with prior $p_1=0.1$. With $E_b=1$ and $N_0=0.5$, $\\lambda_{\\mathrm{opt}}=0.125\\ln 9=0.275$, moved toward the rare symbol.'],
    [()=>{ const a=P.Axes(EXO({xr:[0,6.3],yr:[-10,0],xlabel:'x',ylabel:'Q(x)',ytickfmt:P.decade,yticksOverride:[-9,-6,-3,0],zeroAxes:false,pad:{l:64,r:26,t:24,b:44},xticksOverride:[0,1,2,3,4,5,6]}));
      a.curve(x=>Math.log10(Qf(x)),{color:C.mid,width:2.2});
      for(let k=1;k<=6;k++) a.point(k,Math.log10(Qf(k)),{color:C.mid,r:4.2});
      return a.svg(); }, 'The Gaussian tail $Q(x)$ on decades. Above $x=3$ each unit step in $x$ divides $Q(x)$ by more than $40$.'],
    [()=>{ const a=P.Axes(EXO({xr:[0,21],yr:[-1,22],xlabel:'\\text{block}',ylabel:'\\text{errors}',xticksOverride:[1,5,10,15,20],yticksOverride:[0,10,20]}));
      a.hline(10,{color:C.muted});
      a.stem(ERR_CNT,{color:C.err,showZero:true});
      return a.svg(); }, 'A tester counts errors in blocks of $10^{5}$ bits at $P_b=10^{-4}$. It expects $10$ a block, and the counts scatter around that.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Target error rate', html:'A standard fixes the largest $P_b$ a link may have. The curve $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ turns that target into the $E_b/N_0$ the link needs.'},
    {t:'note', kind:'def', head:'Counting errors', html:'A measured $P_b$ is errors divided by bits. About $10$ errors are needed for a steady estimate, so $P_b=10^{-4}$ needs about $10^{5}$ bits.'},
    {t:'note', kind:'warn', head:'Rare symbols', html:'When one symbol is rare, $\\lambda_{\\mathrm{opt}}$ moves toward it. The receiver then needs stronger evidence before it decides the rare symbol.'}
  ]});

/* 2.4. A long line's pulse response, a two-ray echo, fibre dispersion, and
   the eye opening 2(1 - 2q) against BT_b. */
const REAL_ISI = realGallery({ id:'m2-real-isi', nav:'Intersymbol interference around us',
  title:'Intersymbol interference around us', eyebrow:'Module 2 · Intersymbol interference', src:'CH8 s.35–37',
  objective:'Recognise intersymbol interference in cables, radio echoes and optical fibre.',
  keywords:'examples cable pulse response tail multipath echo two ray wifi optical fibre dispersion pulse broadening eye opening bandwidth',
  figs:[
    [()=>{ const r = rcResp(0.15), a=P.Axes(EXO({xr:[-0.3,5.3],yr:[-0.1,1.1],xlabel:'t', xunit:'T_b',ylabel:'r(t)',xticksOverride:[0,1,2,3,4,5],ytarget:3}));
      a.poly([[-0.3,0],[0,0],[0,1],[1,1],[1,0],[5.3,0]],{color:C.in,width:1.4,dash:'5 5'});
      a.curve(r,{color:C.out,width:2.2,n:800});
      for(let m=1;m<=4;m++) a.point(m+1,r(m+1),{color:C.err,r:4});
      return a.svg(); }, 'A long twisted pair acts like the RC channel with $BT_b=0.15$. One bit leaves $(1-q)q^{m}$ in the sample $m$ bits later, with $q=e^{-2\\pi BT_b}=0.39$.'],
    [()=>{ const a=P.Axes(EXO({xr:[-1,7],yr:[-0.15,1.25],xlabel:'n',ylabel:'h[n]',xticksOverride:[0,1,2,3,4,5,6],ytarget:3}));
      a.stem([[0,1],[3,0.6]],{color:C.h});
      return a.svg(); }, 'A radio echo three symbols late with gain $0.6$: $h[n]=\\delta[n]+0.6\\,\\delta[n-3]$. Each sample then carries $0.6\\,a_{k-3}$ from an older symbol.'],
    [()=>{ const s0 = 20, s1 = Math.hypot(20, 34), g = (t,s) => Math.exp(-t*t/(2*s*s))/s*20;
      const a=P.Axes(EXO({xr:[-150,150],yr:[-0.06,1.2],xlabel:'t\\;(\\text{ps})',ylabel:'p(t)',xticksOverride:[-100,0,100],ytickfmt:()=>'',ytarget:3}));
      a.curve(t=>g(t,s0),{color:C.in,width:2.2}); a.curve(t=>g(t,s1),{color:C.out,width:2.2});
      a.curve(t=>g(t-100,s1),{color:C.out,width:1.4,dash:'5 5'});
      return a.svg(); }, 'A $10$ Gb/s light pulse with $\\sigma_0=20$ ps spreads to $\\sigma=\\sqrt{20^{2}+34^{2}}=39.4$ ps after $20$ km of fibre. It then reaches into the next bit, $100$ ps away.'],
    [()=>{ const a=P.Axes(EXO({xr:[0,0.6],yr:[-0.5,2.1],xlabel:'BT_b',ylabel:'\\text{eye opening}',xticksOverride:[0,0.11,0.2,0.4,0.6],ytarget:3}));
      a.curve(bt=>2*(1-2*rcq(bt)),{color:C.mid,width:2.2});
      a.hline(0,{color:C.muted}); a.point(Math.log(2)/(2*Math.PI),0,{color:C.err,r:4.5});
      return a.svg(); }, 'The eye opening $2(1-2q)$ of the RC channel against $BT_b$. It reaches zero at $BT_b=\\ln 2/(2\\pi)=0.110$.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Channel memory', html:'Every bandlimited channel spreads a pulse beyond its own bit. The sample of one bit then carries part of its neighbours.'},
    {t:'note', kind:'def', head:'Echoes', html:'A radio echo is intersymbol interference with a delay. An echo $d$ symbols late with gain $g$ adds $g\\,a_{k-d}$ to $y_k$.'},
    {t:'note', kind:'warn', head:'Errors without noise', html:'When the eye is closed, some bit patterns are decided wrongly with no noise at all. More transmit power does not remove them.'}
  ]});

/* 2.5. Satellite television at 27.5 Mbaud and alpha = 0.35; 3G at
   3.84 Mchip/s and alpha = 0.22 inside a 5 MHz channel; the raised-cosine
   pulse of alpha = 0.35; interference against a timing error for two
   roll-offs. */
const tmIsi = (eps, al) => { let s = 0; for(let k=-30;k<=30;k++) if(k) s += Math.abs(rcPulse(k+eps, al)); return s; };
const REAL_NYQUIST = realGallery({ id:'m2-real-nyquist', nav:'Pulse shaping around us',
  title:'Pulse shaping around us', eyebrow:'Module 2 · Nyquist and the raised cosine', src:'CH8 s.46–48',
  objective:'Read roll-off factors and bandwidths off broadcast and mobile standards.',
  keywords:'examples raised cosine roll off satellite television dvb 27.5 mbaud 0.35 3g umts 3.84 mchip 0.22 5 mhz channel timing error',
  figs:[
    [()=>{ const W = 13.75, a=P.Axes(EXO({xr:[-25,25],yr:[-0.08,1.3],xlabel:'f\\;(\\text{MHz})',ylabel:'P(f)/T_b',xticksOverride:[-18.6,-13.75,0,13.75,18.6],
        xtickfmt:v=>String(+v.toFixed(2)),ytarget:3}));
      a.curve(f=>rcSpec(f/W,0.35),{color:C.in,width:2.2,n:900});
      return a.svg(); }, 'Satellite television at $R_s=27.5$ Mbaud with $\\alpha=0.35$ uses $B_T=13.75(1.35)=18.6$ MHz at baseband.'],
    [()=>{ const W = 1.92, a=P.Axes(EXO({xr:[-3.2,3.2],yr:[-0.08,1.3],xlabel:'f\\;(\\text{MHz})',ylabel:'P(f)/T_b',xticksOverride:[-2.5,-1.92,0,1.92,2.5],
        xtickfmt:v=>String(+v.toFixed(2)),ytarget:3}));
      a.curve(f=>rcSpec(f/W,0.22),{color:C.in,width:2.2,n:900});
      a.vline(-2.5,{color:C.h,dash:'6 4',width:1.4}); a.vline(2.5,{color:C.h,dash:'6 4',width:1.4});
      return a.svg(); }, '3G mobile sends $3.84$ Mchip/s with $\\alpha=0.22$. $B_T=1.92(1.22)=2.34$ MHz fits inside the $\\pm2.5$ MHz of its $5$ MHz channel.'],
    [()=>{ const a=P.Axes(EXO({xr:[-4.5,4.5],yr:[-0.3,1.2],xlabel:'t', xunit:'T_s',ylabel:'p(t)',xticksOverride:[-4,-2,0,2,4],ytarget:3}));
      a.curve(t=>rcPulse(t,0.35),{color:C.in,width:2.2,n:900});
      for(let k=-4;k<=4;k++) a.point(k,k?0:1,{color:C.mid,r:4});
      return a.svg(); }, 'The raised-cosine pulse of $\\alpha=0.35$. It is zero at every other sampling instant, so the samples carry no interference.'],
    [()=>{ const a=P.Axes(EXO({xr:[0,0.3],yr:[-0.1,2.3],xlabel:'\\epsilon', xunit:'T_s',ylabel:'\\textstyle\\sum|p(kT_s+\\epsilon)|',xticksOverride:[0,0.1,0.2,0.3],ytarget:3}));
      a.curve(e=>tmIsi(e,0),{color:C.err,width:2.2,dash:'7 5',n:200});
      a.curve(e=>tmIsi(e,0.5),{color:C.err,width:2.2,n:200});
      a.note(0.15,1.5,'\\alpha=0',{tex:true,fs:14,color:C.err,anchor:'end'});
      /* in projector mode the label grows into the solid curve; it sits above it instead */
      const L=P.labelScale(), ya=L>1 ? tmIsi(0.3,0.5)+10*L/(a.sy(0)-a.sy(1)) : 0.2;
      a.note(0.3,ya,'\\alpha=0.5',{tex:true,fs:14,color:C.err,anchor:'end'});
      return a.svg(); }, 'Interference collected by a sample taken $\\epsilon$ late, summed over $1\\le|k|\\le30$. The raised cosine with $\\alpha=0.5$ collects far less than the sinc pulse.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Roll-off in standards', html:'Satellite television uses $\\alpha=0.35$, $0.25$ or $0.20$. 3G mobile uses $\\alpha=0.22$. A small $\\alpha$ saves bandwidth.'},
    {t:'note', kind:'def', head:'Bandwidth', html:'$B_T=\\tfrac{R_s}{2}(1+\\alpha)$ at baseband. On a carrier the occupied band is twice that, $R_s(1+\\alpha)$.'},
    {t:'note', kind:'warn', head:'Timing', html:'A small $\\alpha$ gives long tails. A sample taken late then collects interference from many neighbours.'}
  ]});

/* ======================================================================== */
const SC = [

/* ---------------------------------------------------------------- 2.0 ---- */
{ id:'m2-open', module:'M2', nav:'Module 2 opening', title:'Baseband Transmission of Digital Signals',
  objective:'Fix the receiver chain for one bit: a waveform, noise, a filter, a sample and a decision.',
  keywords:'module 2 overview baseband receiver matched filter noise decision threshold error probability intersymbol interference nyquist',
  src:'CH8 s.2–3', dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Baseband transmission of digital signals'},
  {t:'title', level:1, text:'Baseband Transmission of Digital Signals'},
  {t:'lede', text:'Each bit is sent as one waveform. The channel adds noise, and the receiver filters, samples and decides.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'stack', style:'--ts:1.6;gap:34px', items:[
      {t:'note', kind:'warn', head:'Result 1', html:'<span style="color:var(--graphite)">The matched filter gives the largest peak SNR, $2E/N_0$. Only the pulse energy counts, not its shape.</span>'},
      {t:'note', kind:'warn', head:'Result 2', html:'<span style="color:var(--graphite)">With polar signalling and equal priors, $P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. A channel narrower than $R_b/2$ cannot avoid intersymbol interference.</span>'}
    ]}
  ], right:[
    {t:'grid', cols:1, gap:'10px', items:[
      [{t:'fig', svg:figOpenTx}],
      [{t:'fig', svg:figOpenRx}],
      [{t:'fig', svg:figOpenDecide}]
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 2.1 ---- */
{ id:'m2-awgn', module:'M2', nav:'Additive Gaussian noise', title:'Additive Gaussian noise',
  objective:'See the same bits under three noise levels, and find how often one sample of a bit has the wrong sign.',
  keywords:'additive white gaussian noise awgn noise level sigma polar bits one sample wrong sign Q function tail',
  src:'CH8 s.2', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Additive Gaussian noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$\\sigma=0.1$','$\\sigma=0.5$','$\\sigma=1$'], ms:900},
      svg:figAwgn,
      caption:'Five polar bits $g(t)=\\pm1$ and the received $x(t)$. Step through three noise levels. The shaded band is $g(t)\\pm\\sigma$.'},
    {t:'legend', items:[['in','$g(t)$'],['out','$x(t)$']], at:'tr'}
  ], right:[
    {t:'eq', label:'Additive noise', tex:'x(t)=g(t)+w(t),\\qquad w(t)\\sim\\mathcal{N}(0,\\sigma^{2})',
      note:'The channel adds noise to the pulse. At each instant the noise is a Gaussian value with mean $0$ and standard deviation $\\sigma$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'One sample of a $+1$ bit', tex:'\\begin{aligned}P\\bigl(x(t_0)<0\\bigr)&=P\\bigl(w(t_0)<-1\\bigr)=Q\\Bigl(\\frac{1}{\\sigma}\\Bigr)\\\\[4pt] Q(x)&=\\int_x^{\\infty}\\tfrac{1}{\\sqrt{2\\pi}}e^{-u^2/2}\\,du\\\\[4pt] P(X>z)&=Q\\Bigl(\\frac{z-\\mu}{\\sigma}\\Bigr)\\end{aligned}',
        note:'$Q(x)$ is the chance that a standard Gaussian value exceeds $x$. For a Gaussian $X$ with mean $\\mu$ and standard deviation $\\sigma$, subtract $\\mu$ and divide by $\\sigma$ first. At $\\sigma=1$ it is $Q(1)=0.16$, so one sample is a poor guide. A filter uses the whole bit instead.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A $+1$ bit is read at one instant, with $\\sigma=0.25$.<div class="nsep"></div>How likely is the sample to fall below $0$?',
        ask:{key:'m2-awgn', choices:['$3.2\\times10^{-5}$','$0.023$','$0.16$'], answer:0,
          why:'The sample falls below $0$ when the noise is below $-1$, which has chance $Q(1/\\sigma)$. Here $\\sigma=0.25$, so $1/\\sigma=1/0.25=4$ and the chance is $Q(4)=3.2\\times10^{-5}$. For comparison, $\\sigma=0.5$ gives $1/\\sigma=2$ and $Q(2)=0.023$, so halving $\\sigma$ cuts the chance by a factor of about $700$.'}}]}
  ]}
]},

{ id:'m2-filter-choice', module:'M2', nav:'Choosing the receive filter', title:'Choosing the receive filter',
  objective:'See how the receive filter sets the quality of one sample. An RC filter passes too much noise or smooths the pulse away.',
  keywords:'receive filter choice rc filter time constant bandwidth noise smoothing pulse buried in noise one sample',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Choosing the receive filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$\\tau=T/10$','$\\tau=2T$','matched filter']},
      svg:figFilterChoice,
      caption:'The cyan pulse $g(t)$ is buried in the green input $x(t)$. Step through three filters of the same input. Each output is sampled at $t=T$.'}
  ], right:[
    {t:'note', kind:'def', head:'The question', html:'The receiver reads one number, $y(T)$. The pulse puts a value there and the noise moves it. Choose $h(t)$ so that the pulse part is large against the noise part.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'An RC filter', tex:'\\begin{aligned}h(t)&=\\frac{1}{\\tau}\\,e^{-t/\\tau},\\qquad t\\ge0\\\\E[n^{2}]&=\\frac{N_0}{2}\\int_{0}^{\\infty}\\frac{e^{-2t/\\tau}}{\\tau^{2}}\\,dt=\\frac{N_0}{2}\\cdot\\frac{1}{2\\tau}=\\frac{N_0}{4\\tau}\\end{aligned}',
        note:'The noise power is $\\frac{N_0}{2}\\int h^{2}(t)\\,dt$, as for any filter of white noise. A small $\\tau$ passes more noise. A large $\\tau$ smooths the pulse away.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'An RC filter has $E[n^{2}]=N_0/(4\\tau)$. Make $\\tau$ ten times smaller.<div class="nsep"></div>What happens to $E[n^{2}]$?',
        ask:{key:'m2-filter-choice', choices:['it falls $10$ times','it does not change','it grows $10$ times'], answer:2,
          why:'$E[n^{2}]$ is proportional to $1/\\tau$, so $\\tau/10$ gives $10$ times the noise power.'}}]}
  ]}
]},

{ id:'m2-receiver', module:'M2', nav:'The receiver model', title:'The receiver model',
  objective:'Set up the pulse, the white noise and the linear filter sampled at one instant.',
  keywords:'receiver model pulse white gaussian noise power spectral density two sided linear filter sample instant boltzmann noise temperature',
  src:'CH8 s.3, s.5', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The receiver model'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figReceiver,
      caption:'One pulse $g(t)$ on $[0,T]$ plus white noise $w(t)$ enters a linear filter. The filter output is sampled once, at $t=T$.'},
  ], right:[
    {t:'eq', label:'Received signal', tex:'x(t)=g(t)+w(t),\\qquad 0\\le t\\le T',
      note:'$g(t)$ is the pulse of one bit. $w(t)$ is the noise the channel adds.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'White noise', tex:'\\begin{aligned}S_W(f)&=\\frac{N_0}{2}\\quad\\text{for all }f\\\\R_W(\\tau)&=\\frac{N_0}{2}\\,\\delta(\\tau),\\qquad N_0=k_BT_e\\end{aligned}',
        note:'The density is flat and two-sided, so noise values at two different times are uncorrelated. $k_B=1.38\\times10^{-23}$ J/K is Boltzmann\'s constant, and $T_e$ is the noise temperature in kelvin.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A receiver has the noise temperature $T_e=290$ K.<div class="nsep"></div>What is $N_0$?',
        ask:{key:'m2-receiver', choices:['$2.0\\times10^{-21}$ W/Hz','$4.0\\times10^{-21}$ W/Hz','$8.0\\times10^{-21}$ W/Hz'], answer:1,
          why:'$N_0=k_BT_e=(1.38\\times10^{-23})(290)=4.0\\times10^{-21}$ W/Hz. The two-sided density $N_0/2$ is half of it.'}}]}
  ]}
]},

{ id:'m2-split', module:'M2', nav:'Signal part and noise part', title:'Signal part and noise part',
  objective:'Split the filter output into a fixed signal part and a random noise part, and see why the noise part does not vanish.',
  keywords:'linear filter output signal part noise part deterministic random superposition noise still present at output',
  src:'CH8 s.4', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Signal part and noise part'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['input $x(t)$','signal part','noise part','$y(t)$ at $t=T$'], ms:900},
      svg:figSplit,
      caption:'An RC filter with $\\tau=T/4$ acts on the noisy pulse. Step through: the signal part, the noise part alone, then their sum, sampled at $t=T$.'}
  ], right:[
    {t:'eq', label:'Two parts', tex:'y(t)=x(t)*h(t)=\\underbrace{g(t)*h(t)}_{=g_0(t)}+\\underbrace{w(t)*h(t)}_{=n(t)}',
      note:'The filter is linear, so each part of $x(t)$ passes through it on its own. $g_0(t)$ is the same every time the bit is sent. $n(t)$ is random.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Noise at the output', html:'The filter cannot tell noise from pulse in the band the pulse uses. A filter that passes the pulse passes that noise too. So $n(T)$ never vanishes, and the filter can only make it small against $g_0(T)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A filter gives $g_0(T)\\neq0$ for the pulse $g(t)$.<div class="nsep"></div>Can its noise part have $E[n^{2}(T)]=0$?',
        ask:{key:'m2-split', choices:['yes, if narrow enough','yes, for the best filter','no'], answer:2,
          why:'$g_0(T)\\neq0$ needs $H(f)\\neq0$ where $G(f)\\neq0$. White noise has power there, so $E[n^{2}(T)]>0$.'}}]}
  ]}
]},

{ id:'m2-model', module:'M2', nav:'The peak pulse SNR', title:'The peak pulse signal-to-noise ratio',
  objective:'Define the peak pulse SNR at the sampling instant, write the signal part in the frequency domain, and measure the SNR of a simple filter.',
  keywords:'peak pulse signal to noise ratio sampling instant signal part inverse fourier transform rc filter time constant 0.81',
  src:'CH8 s.4', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The peak pulse signal-to-noise ratio'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'r', label:'$T/\\tau$', min:-1, max:1, step:0.05, v:0, show:v=>'$'+(+Math.pow(10,v).toPrecision(2))+'$'}]},
      svg:figSnr,
      caption:'Drag $T/\\tau$. A slow filter (small $T/\\tau$) smooths the noise, but the pulse barely rises. A fast one lets the pulse through, and the noise with it. $\\eta$ compares the violet bar to the grey bar, squared.'}
  ], right:[
    {t:'eq', label:'Peak pulse SNR', tex:'\\eta=\\frac{|g_0(T)|^{2}}{E[n^{2}(T)]}',
      note:'The signal part rises while the pulse enters the filter and falls after it. So it peaks at $t=T$, and the output is read there.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Signal part in $f$', tex:'\\begin{aligned}G_0(f)&=G(f)\\,H(f)\\\\g_0(T)&=\\int_{-\\infty}^{\\infty}G(f)\\,H(f)\\,e^{j2\\pi fT}\\,df\\end{aligned}',
        note:'Convolution in time is a product in frequency. The inverse transform, read at $t=T$, gives the second line.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'At $t=T$ the signal part is $g_0(T)=2$ mV and the noise power is $E[n^{2}(T)]=10^{-6}\\ \\text{V}^{2}$.<div class="nsep"></div>What is $\\eta$?',
        ask:{key:'m2-model', choices:['$2$','$4$','$16$'], answer:1,
          why:'$\\eta=(2\\times10^{-3})^{2}/10^{-6}=4\\times10^{-6}/10^{-6}=4$.'}}]}
  ]}
]},

{ id:'m2-noise-power', module:'M2', nav:'The output noise power', title:'The output noise power',
  objective:'Find the noise power at the filter output as the area under the filtered noise density, and state the problem the matched filter solves.',
  keywords:'output noise power filtered power spectral density area under density white noise rc filter optimization problem',
  src:'CH8 s.5–6', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The output noise power'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$S_W(f)$','$|H(f)|^{2}$','$S_N(f)$','area'], ms:1100},
      svg:figNoisePower,
      caption:'White noise of density $N_0/2$ through an RC filter with $\\tau=T/4$. Step through: the filter shapes the density, then the area under $S_N(f)$ builds up. The tails beyond $|f|=4/T$ hold the last tenth of it.'}
  ], right:[
    {t:'eq', label:'Filtered density and its area', tex:'\\begin{aligned}S_N(f)&=S_W(f)\\,|H(f)|^{2}=\\frac{N_0}{2}\\,|H(f)|^{2}\\\\E[n^{2}(t)]&=\\int_{-\\infty}^{\\infty}S_N(f)\\,df=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^{2}\\,df\\end{aligned}',
      note:'A filter multiplies a density by $|H(f)|^{2}$, and the power is the area under it. The area is the same at every $t$, so it is $E[n^{2}(T)]$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The problem', tex:'\\eta=\\frac{\\Bigl|\\int G(f)\\,H(f)\\,e^{j2\\pi fT}\\,df\\Bigr|^{2}}{\\frac{N_0}{2}\\int|H(f)|^{2}\\,df}',
        note:'Find the $H(f)$ that makes $\\eta$ largest for a given $G(f)$. The top grows where $H$ meets $G$. The bottom grows with every hertz $H$ passes.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'An ideal lowpass has $|H|=1$ for $|f|<1$ kHz, and $N_0=2\\times10^{-9}$ W/Hz.<div class="nsep"></div>What is $E[n^{2}]$?',
        ask:{key:'m2-noise-power', choices:['$10^{-6}$ W','$2\\times10^{-6}$ W','$4\\times10^{-6}$ W'], answer:1,
          why:'The area is $\\frac{N_0}{2}\\cdot2B=N_0B=(2\\times10^{-9})(10^{3})=2\\times10^{-6}$ W.'}}]}
  ]}
]},

{ id:'m2-schwarz', module:'M2', nav:'Schwarz\'s inequality', title:'Schwarz\'s inequality',
  objective:'State Schwarz\'s inequality and apply it to the signal part of the filter output.',
  keywords:'schwarz inequality equality condition filter width signal spectrum overlap',
  src:'CH8 s.7', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Schwarz\'s inequality'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'b', label:'$b$', min:0.3, max:3, step:0.05, v:1, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figSchwarz,
      caption:'Drag $b$, the width of $|H(f)|$. Violet is the pulse that gets through. Grey is noise let in where the pulse has no energy. Red is pulse thrown away. Only $b=1$ avoids both.'},
    {t:'legend', items:[['in','$|G(f)|$'],['h','$|H(f)|$',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Schwarz\'s inequality', tex:'\\Bigl|\\int\\phi_1(f)\\,\\phi_2(f)\\,df\\Bigr|^{2}\\le\\int|\\phi_1(f)|^{2}\\,df\\int|\\phi_2(f)|^{2}\\,df',
      note:'Both functions must have finite energy. The square is on the whole integral, not inside it. Equality holds only when $\\phi_1=k\\,\\phi_2^{*}$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Apply it to $g_0(T)$', tex:'\\begin{aligned}|g_0(T)|^{2}&=\\Bigl|\\int H(f)\\,G(f)\\,e^{j2\\pi fT}\\,df\\Bigr|^{2}\\\\&\\le\\int|H(f)|^{2}df\\int|G(f)|^{2}df\\end{aligned}',
        note:'Take $\\phi_1=H(f)$ and $\\phi_2=G(f)\\,e^{j2\\pi fT}$. Since $|e^{j2\\pi fT}|=1$, $\\int|\\phi_2|^{2}df=\\int|G|^{2}df$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A filter is made three times stronger: $H(f)$ becomes $3H(f)$.<div class="nsep"></div>What happens to $\\eta$?',
        ask:{key:'m2-schwarz', choices:['it grows $9$ times','it grows $3$ times','it does not change'], answer:2,
          why:'$|g_0(T)|^{2}$ and $E[n^{2}(T)]$ both grow $9$ times, so their ratio $\\eta$ stays the same.'}}]}
  ]}
]},

{ id:'m2-bound', module:'M2', nav:'The bound', title:'The bound on the output SNR',
  objective:'Divide by the noise power, cancel the filter, reach the bound 2E/N0, and name the filter that reaches it.',
  keywords:'bound 2E/N0 energy parseval cancel filter peak snr largest equality condition conjugate spectrum',
  src:'CH8 s.8', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The bound on the output SNR'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figBoundCurve,
      caption:'The SNR of the filter of width $b$ in the slide before, as a fraction of the bound. It reaches $1$ only at $b=1$, and no filter passes it.'}
  ], right:[
    {t:'eq', label:'The bound', key:true, result:true, tex:'\\begin{aligned}\\eta&=\\frac{|g_0(T)|^{2}}{\\frac{N_0}{2}\\int|H(f)|^{2}df}\\\\&\\le\\frac{\\int|H(f)|^{2}df\\int|G(f)|^{2}df}{\\frac{N_0}{2}\\int|H(f)|^{2}df}\\\\&=\\frac{2}{N_0}\\int|G(f)|^{2}\\,df=\\frac{2E}{N_0}\\end{aligned}',
      note:'Put Schwarz\'s bound on the top. Then $\\int|H|^{2}df$ is above and below the line and cancels. Parseval gives $\\int|G|^{2}df=E$, so the bound depends on the energy only.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The equality condition', tex:'H_{\\mathrm{opt}}(f)=k\\,\\phi_2^{*}(f)=k\\,G^{*}(f)\\,e^{-j2\\pi fT}',
        note:'Equality needs $\\phi_1=k\\phi_2^{*}$, with $\\phi_1=H(f)$ and $\\phi_2=G(f)e^{j2\\pi fT}$. The best filter passes most where the pulse spectrum is largest.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A pulse has energy $E=5\\times10^{-7}$ J and the noise has $N_0=10^{-7}$ W/Hz.<div class="nsep"></div>What is the largest peak SNR?',
        ask:{key:'m2-bound', choices:['$5$','$10$','$20$'], answer:1,
          why:'$\\eta_{\\max}=2E/N_0=2(5\\times10^{-7})/10^{-7}=10$.'}}]}
  ]}
]},

{ id:'m2-matched', module:'M2', nav:'The matched filter', title:'The matched filter',
  objective:'Turn the optimum transfer function into an impulse response, step by step: the filter is the pulse reversed in time and shifted by T.',
  keywords:'matched filter impulse response inverse fourier transform conjugation property time reversal shift h(t)=g(T-t) real pulse',
  src:'CH8 s.9', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The matched filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$g(t)$','reverse: $g(-t)$','shift: $g(T-t)$'], ms:1100},
      svg:figMatchedBuild,
      caption:'Step through the frames for the ramp $g(t)=t/T$. The ramp turns about $t=0$, then moves right by $T$.'},
    {t:'legend', items:[['in','$g(t)$'],['h','$g(-t)$',0,1,1],['h','$h(t)=g(T-t)$',0,2]], at:'tr'}
  ], right:[
    {t:'eq', label:'Step 1 · inverse transform', tex:'\\begin{aligned}h_{\\mathrm{opt}}(t)&=\\int_{-\\infty}^{\\infty}H_{\\mathrm{opt}}(f)\\,e^{j2\\pi ft}\\,df\\\\&=k\\int_{-\\infty}^{\\infty}G^{*}(f)\\,e^{j2\\pi f(t-T)}\\,df\\end{aligned}',
      note:'Substitute $H_{\\mathrm{opt}}(f)=kG^{*}(f)e^{-j2\\pi fT}$ and join the two exponentials.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 2 · real pulse, then reversal', key:true, result:true, tex:'\\begin{aligned}G^{*}(f)&=G(-f)\\\\h_{\\mathrm{opt}}(t)&=k\\int_{-\\infty}^{\\infty}G(-f)\\,e^{j2\\pi f(t-T)}\\,df\\\\&=k\\,g\\bigl(-(t-T)\\bigr)=k\\,g(T-t)\\end{aligned}',
        note:'A real pulse has $g=g^{*}$, so $G(f)=G^{*}(-f)$. Conjugate it for line one. Time reversal, $g(-s)\\leftrightarrow G(-f)$ with $s=t-T$, gives line three.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$g(t)=t/T$ for $0\\le t\\le T$, and $k=1$.<div class="nsep"></div>What is $h_{\\mathrm{opt}}(0)$?',
        ask:{key:'m2-matched', choices:['$0$','$1/2$','$1$'], answer:2,
          why:'$h_{\\mathrm{opt}}(0)=g(T-0)=g(T)=T/T=1$.'}}]}
  ]}
]},

{ id:'m2-mf-freq', module:'M2', nav:'The matched filter in frequency', title:'The matched filter in frequency',
  objective:'Read the matched filter in frequency: its magnitude is the pulse spectrum, and its phase cancels the pulse phase and adds a delay T.',
  keywords:'matched filter frequency domain magnitude response phase response conjugate spectrum linear phase delay all components in phase output spectrum',
  src:'CH8 s.9 (extension)', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The matched filter in frequency'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$|H|=|G|$','$\\angle G(f)$','$\\angle H(f)$','$\\angle G+\\angle H$'], ms:1100},
      svg:figMfFreq,
      caption:'The ramp $g(t)=\\sqrt{3}\\,t/T$ with $E=1$ and $k=1$. Top: the two magnitudes lie on each other. Bottom: the phases, and their sum, a straight line.'},
    {t:'legend', items:[['in','$G(f)$'],['h','$H(f)$',true],['mid','$\\angle G+\\angle H$',0,3]], at:'tr'}
  ], right:[
    {t:'eq', label:'Magnitude and phase', tex:'\\begin{aligned}H(f)&=k\\,G^{*}(f)\\,e^{-j2\\pi fT}\\\\|H(f)|&=k\\,|G(f)|\\\\\\angle H(f)&=-\\angle G(f)-2\\pi fT\\end{aligned}',
      note:'The filter passes the band where the pulse has energy. It weights each frequency by $|G(f)|$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The output spectrum', key:true, result:true, tex:'Y(f)=G(f)\\,H(f)=k\\,|G(f)|^{2}\\,e^{-j2\\pi fT}',
        note:'$-\\angle G$ cancels the phase of the pulse. A delay of $T$ is left, so every frequency component of $y(t)$ peaks at $t=T$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A pulse has $G(f_1)=0$ at one frequency $f_1$.<div class="nsep"></div>What is $|H(f_1)|$ for its matched filter?',
        ask:{key:'m2-mf-freq', choices:['$0$','$k$','$1/k$'], answer:0,
          why:'$|H(f_1)|=k|G(f_1)|=0$. The pulse has no energy there, so the filter lets no noise through.'}}]}
  ]}
]},

{ id:'m2-conv', module:'M2', nav:'The matched-filter output', title:'The output of the matched filter',
  objective:'Compute the matched-filter output as a sliding product and its area. Read its peak at t = T, and see what the reversal does.',
  keywords:'matched filter output convolution sliding product area integral accumulation autocorrelation peak energy ramp even symmetric reversal sampling instant',
  src:'CH8 s.11', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The output of the matched filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$t=0$','$t=T/2$','$t=T$','$t=2T$','$h=g$'], ms:1400},
      svg:figConvSweep,
      caption:'The ramp $g(t)=t/T$. Top: the reversed copy slides across $g(\\tau)$. Middle: their product, whose area is $y(t)$. Bottom: $y(t)$ builds up. The last frame leaves out the reversal.'},
    {t:'legend', items:[['in','$g(\\tau)$'],['h','$h(t-\\tau)$',true]], at:'tc-row'}
  ], right:[
    {t:'eq', label:'Convolution', tex:'y(t)=\\int g(\\tau)\\,h(t-\\tau)\\,d\\tau=\\int g(\\tau)\\,g(T-t+\\tau)\\,d\\tau',
      note:'Convolution reverses $h$ once more. So at $t=T$ the copy $g(T-t+\\tau)$ lies exactly on $g(\\tau)$. Without the reversal the ramp reaches only $0.50E$ there.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The peak', key:true, result:true, tex:'y(T)=\\int_{-\\infty}^{\\infty}g^{2}(\\tau)\\,d\\tau=E',
        note:'Every product $g^{2}$ is non-negative, so nothing cancels. The peak comes when the whole pulse is inside the filter. The noise power is the same at every $t$, so $t=T$ is the sampling instant.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'For the ramp $g(t)=t/T$, $y(T/2)=0.31E$.<div class="nsep"></div>What is $y(3T/2)$?',
        ask:{key:'m2-conv', choices:['$0$','$0.31E$','$0.69E$'], answer:1,
          why:'$y$ is even about $t=T$: the shift $\\tau\\to\\tau+u$ turns $y(T+u)$ into $y(T-u)$.'}}]}
  ]}
]},

{ id:'m2-mf-correlator', module:'M2', nav:'The correlator', title:'The correlator',
  objective:'Show that the matched-filter sample at t = T equals a correlation: multiply the input by the pulse and integrate over the bit.',
  keywords:'correlator integrate and dump matched filter equivalence sample at T multiply by pulse integrate ramp output differs before T',
  src:'CH8 s.11 (extension)', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The correlator'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$t=0$','$t=T/2$','$t=T$','matched filter'], ms:1400},
      svg:figMfCorr,
      caption:'The noiseless ramp $x(t)=g(t)=t/T$. Top: the product $x(\\tau)g(\\tau)$, integrated from $0$ to $t$. Bottom: the correlator output $z(t)$, read and reset at $t=T$. The last frame adds the matched-filter output $y(t)$.'},
    {t:'legend', items:[['in','$g(\\tau)$'],['mid','$z(t)$'],['mid','$y(t)$',true,3]], at:'tr'}
  ], right:[
    {t:'eq', label:'The sample at $t=T$', tex:'\\begin{aligned}y(T)&=\\int x(\\tau)\\,h(T-\\tau)\\,d\\tau\\\\&=\\int_{0}^{T}x(\\tau)\\,g(\\tau)\\,d\\tau\\end{aligned}',
      note:'$h(T-\\tau)=g\\bigl(T-(T-\\tau)\\bigr)=g(\\tau)$: at $t=T$ the reversal is undone. Multiply $x$ by the pulse and integrate over the bit.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Integrate and dump', html:'The correlator starts at the start of each bit, is read at $t=T$ and is then reset to zero. It needs the bit timing, as the matched filter does for its sampling instant.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The ramp $g(t)=t/T$ enters a correlator, with no noise.<div class="nsep"></div>What is $z(T/2)$?',
        ask:{key:'m2-mf-correlator', choices:['$0.13E$','$0.31E$','$0.50E$'], answer:0,
          why:'$z(T/2)=\\int_0^{T/2}g^{2}\\,d\\tau=(1/2)^{3}E=0.13E$. The matched filter gives $0.31E$ there. The two agree only at $t=T$.'}}]}
  ]}
]},

{ id:'m2-props', module:'M2', nav:'Matched-filter properties', title:'Properties of the matched filter',
  objective:'Compute the signal value and the noise power at t = T for the matched filter with a gain k.',
  keywords:'matched filter properties signal at sampling instant kE noise power k squared N0 E over 2 gain k parseval',
  src:'CH8 s.12', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Properties of the matched filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'k', label:'$k$', min:0.25, max:2, step:0.05, v:1, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figGain,
      caption:'Drag the gain $k$ of the matched filter for the noisy rectangular pulse. The pulse part and the noise band grow together, so $\\eta$ stays $25$.'}
  ], right:[
    {t:'eq', label:'Step 1 · signal at $t=T$', tex:'\\begin{aligned}g_0(T)&=k\\int_{-\\infty}^{\\infty}G(f)\\,G^{*}(f)\\,e^{-j2\\pi fT}e^{j2\\pi fT}\\,df\\\\&=k\\int_{-\\infty}^{\\infty}|G(f)|^{2}\\,df=kE\\end{aligned}',
      note:'Substitute $H(f)$: the exponentials cancel, and Parseval gives $E$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 2 · noise power', tex:'\\begin{aligned}E[n^{2}(t)]&=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}\\bigl|k\\,G^{*}(f)\\,e^{-j2\\pi fT}\\bigr|^{2}\\,df\\\\&=\\frac{k^{2}N_0}{2}\\int_{-\\infty}^{\\infty}|G(f)|^{2}\\,df=\\frac{k^{2}N_0E}{2}\\end{aligned}',
        note:'The noise in the band of the pulse stays. The signal grows as $k$, the noise power as $k^{2}$, so $k$ cancels in $\\eta$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A matched filter goes from $k=1$ to $k=2$.<div class="nsep"></div>What happens to the noise standard deviation?',
        ask:{key:'m2-props', choices:['no change','it doubles','it grows $4$ times'], answer:1,
          why:'$E[n^{2}]\\propto k^{2}$, so its square root doubles, as $g_0(T)$ does.'}}]}
  ]}
]},

{ id:'m2-props-snr', module:'M2', nav:'Matched-filter output SNR', title:'The output SNR of the matched filter',
  objective:'Divide the two results, see k cancel, and read the peak SNR 2E/N0 as a ratio without units.',
  keywords:'matched filter output snr 2E/N0 gain cancels energy to noise density ratio unitless shape independent rectangular half sine',
  src:'CH8 s.13', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The output SNR of the matched filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figEqualOutputs,
      caption:'A rectangular pulse and a half-sine pulse of the same energy $E$, each through its own matched filter. Both outputs peak at $t=T$ with the value $E$.'},
    {t:'legend', items:[['mid','rectangular'],['mid','half sine',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Key result · peak SNR', key:true, result:true, tex:'\\eta=\\frac{|g_0(T)|^{2}}{E[n^{2}(T)]}=\\frac{(kE)^{2}}{k^{2}N_0E/2}=\\frac{2E}{N_0}',
      note:'$k$ cancels. The SNR depends on the energy $E$ and on $N_0$, not on the shape of $g(t)$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Units', tex:'\\frac{E}{N_0}:\\quad\\frac{\\text{J}}{\\text{W/Hz}}=\\frac{\\text{J}}{(\\text{J/s})\\cdot\\text{s}}=1',
        note:'$E/N_0$ has no unit. It is often given in dB.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'Common error: call $N_0/2$ the noise density at the filter output. It is the input density. The output density is $\\frac{N_0}{2}|H(f)|^{2}$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A rectangular and a half-sine pulse have $E=10^{-6}$ J, $N_0=10^{-7}$ W/Hz.<div class="nsep"></div>Which gives the larger peak SNR?',
        ask:{key:'m2-props-snr', choices:['rectangular','half sine','both give $20$'], answer:2,
          why:'$2E/N_0=2(10^{-6})/10^{-7}=20$ for both: only the energy counts.'}}]}
  ]}
]},

{ id:'m2-sample-time', module:'M2', nav:'Sampling early or late', title:'Sampling early or late',
  objective:'Measure the loss of SNR when the matched filter is sampled away from t = T, and see why a causal matched filter cannot peak earlier.',
  keywords:'sampling instant timing error early late sample snr loss triangle squared causality causal filter delay matched filter',
  src:'CH8 s.11 (extension)', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Sampling early or late'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'t0', label:'$t_0/T$', min:0, max:2, step:0.05, v:1.1, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figTiming,
      caption:'Drag the sampling instant $t_0$ for the rectangular pulse and its matched filter. Top: the output and its noise band, the same width at every $t$. Bottom: the SNR at $t_0$.'}
  ], right:[
    {t:'eq', label:'SNR at $t_0$', tex:'\\begin{aligned}\\eta(t_0)&=\\frac{g_0^{2}(t_0)}{k^{2}N_0E/2}=\\Bigl(\\frac{g_0(t_0)}{kE}\\Bigr)^{2}\\frac{2E}{N_0}\\\\\\text{rectangle:}\\ \\frac{g_0(t_0)}{kE}&=1-\\frac{|t_0-T|}{T}\\end{aligned}',
      note:'The noise power is the same at every $t_0$. Only the signal part changes, and it is largest at $t_0=T$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Causality', html:'A filter that peaks at $t_0<T$ is $h(t)=g(t_0-t)$. It is non-zero for some $t<0$, so it needs the input before it arrives. A causal matched filter needs $t_0\\ge T$, and a later $t_0$ only adds delay.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The rectangular pulse is sampled $0.1T$ late.<div class="nsep"></div>What fraction of $2E/N_0$ is left?',
        ask:{key:'m2-sample-time', choices:['$0.90$','$0.81$','$0.50$'], answer:1,
          why:'$(1-0.1)^{2}=0.81$, a loss of $0.92$ dB.'}}]}
  ]}
]},

{ id:'m2-sample-dist', module:'M2', nav:'The output sample', title:'The output sample',
  objective:'See the sample y(T) of the matched filter as a Gaussian random variable centred on plus or minus kE, the input to the decision.',
  keywords:'output sample y(T) gaussian distribution histogram polar bits mean kE variance k squared N0 E over 2 overlap error Q(2) decision',
  src:'CH8 s.12–13 (extension)', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The output sample'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$n=50$','$n=500$','$n=5000$','densities'], ms:1600},
      svg:figSampleDist,
      caption:'Polar bits through the matched filter with $k=1$, $E=1$ and $N_0=0.5$. Histograms of $n$ samples $y(T)$ for each bit. The last frame adds the two Gaussian densities.'},
    {t:'legend', items:[['mid','bit $+1$'],['mid','bit $-1$',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'The sample at $t=T$', key:true, result:true, tex:'\\begin{aligned}y(T)&=\\pm kE+n(T)\\\\n(T)&\\sim\\mathcal{N}\\bigl(0,\\ k^{2}N_0E/2\\bigr)\\end{aligned}',
      note:'A linear filter turns Gaussian noise into Gaussian noise. So $y(T)$ is Gaussian, centred on $+kE$ or $-kE$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Overlap', html:'The spread is $\\sigma=k\\sqrt{N_0E/2}$. A sample on the wrong side of $0$ is an error. Section 2.4 sets the threshold and computes this probability.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$E=1$, $N_0=0.5$, $k=1$, and the bit is $+1$.<div class="nsep"></div>What fraction of the samples falls below $0$?',
        ask:{key:'m2-sample-dist', choices:['$0.023$','$0.16$','$0.50$'], answer:0,
          why:'$\\sigma=\\sqrt{0.5/2}=0.5$, so $P(y<0)=Q(1/0.5)=Q(2)=0.023$.'}}]}
  ]}
]},

{ id:'m2-ex-mf', module:'M2', nav:'Worked example · a rectangular pulse', title:'Worked example: the matched filter of a rectangular pulse',
  objective:'Find the matched filter, its output and the largest peak SNR for a rectangular pulse.',
  keywords:'worked example matched filter rectangular pulse triangle output energy peak snr 13 dB sketch',
  src:'CH8 s.10–13', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Worked example'},
  {t:'title', text:'Worked example: the matched filter of a rectangular pulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$g(t)$','shift: $g(t+T)$','reverse: $h(t)=g(T-t)$','output: $y(t)$'], ms:1100}, svg:figExMf,
      caption:'Step through: move $g(t)$ left by $T$, then mirror it about $t=0$ to get $h(t)$. The last step shows the output $y(t)$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$g(t)=A$ on $[0,T]$, $A=2$ V, $T=0.5$ ms, $N_0/2=10^{-4}$ W/Hz.<div class="nsep"></div>Find $h(t)$, $y(t)$ and the largest peak SNR.',
      ask:{key:'m2-ex-mf', choices:['$10$','$20$','$40$'], answer:1,
        why:'$E=A^{2}T=2\\times10^{-3}$ J and $N_0=2\\times10^{-4}$ W/Hz, so $2E/N_0=20$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\begin{aligned}h(t)&=g(T-t)=A,\\quad 0\\le t\\le T\\\\y(t)&=\\textstyle\\int_{0}^{t}A^{2}\\,d\\tau=A^{2}t,\\quad 0\\le t\\le T\\\\y(t)&=\\textstyle\\int_{t-T}^{T}A^{2}\\,d\\tau=A^{2}(2T-t),\\quad T\\le t\\le 2T\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}E&=A^{2}T=(2)^{2}(0.5\\times10^{-3})=2\\times10^{-3}\\ \\text{J}\\\\\\eta_{\\max}&=\\frac{2E}{N_0}=\\frac{2(2\\times10^{-3})}{2\\times10^{-4}}=20\\end{aligned}',
        note:'Check: $10\\log_{10}20=13.0$ dB, and $y(T)=A^{2}T=E$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $N_0=2\\times10^{-4}$, not $N_0/2$, in $2E/N_0$. The wrong value gives $40$.'}]}
  ]}
]},

REAL_MATCHED,

{ id:'m2-lab-c', module:'M2', nav:'Laboratory {lab} · The matched filter', title:'Laboratory {lab} · The matched filter',
  objective:'Change the pulse, the filter, the noise and the sampling instant, and compare the output SNR with the bound.',
  keywords:'laboratory matched filter rc filter pulse shape noise sampling instant output snr bound interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Laboratory {lab} · The matched filter'},
  {t:'lede', text:'Choose the pulse, the filter, the noise and the sampling instant. Compare the output SNR with the bound $2E/N_0$.'},
  {t:'lab', id:'C'}
]},

{ id:'m2-code-matched', module:'M2', nav:'Code · The matched filter', title:'The matched filter in code',
  objective:'Build a matched filter, measure its output SNR and compare pulse shapes of equal energy.',
  keywords:'code matlab python program run matched filter output snr sampling instant pulse shapes',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter in code'},
  {t:'title', text:'The matched filter in code'},
  {t:'raw', html:()=>CODEBANK.page('m2-code-matched')}
]},

/* ---------------------------------------------------------------- 2.3 ---- */
{ id:'m2-basis', module:'M2', nav:'The unit-energy pulse', title:'The unit-energy pulse',
  objective:'Define the rectangular unit-energy pulse of one bit, show that its energy is one, and name it the basis function.',
  keywords:'basis function unit energy rectangular pulse one bit psi height 1/sqrt(Tb) area of psi squared',
  src:'CH8 s.14', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The unit-energy pulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$\\psi(t)$','$\\psi^{2}(t)$','$\\int\\psi^{2}\\,d\\tau$'], ms:1100},
      svg:figBasisUnit,
      caption:'The pulse $\\psi(t)$ has height $1/\\sqrt{T_b}$ on one bit. Step through: square it, then sweep the area under $\\psi^{2}(t)$. The area ends at $1$.'},
    {t:'legend', items:[['h','$\\psi(t)$',0,0,0],['mid','$\\psi^{2}(t)$',0,1]], at:'tr'}
  ], right:[
    {t:'eq', label:'The pulse', tex:'\\psi(t)=\\begin{cases}1/\\sqrt{T_b}, & 0\\le t\\le T_b\\\\[2pt] 0, & \\text{otherwise}\\end{cases}',
      note:'A rectangle one bit long, and $T_b$ is the bit duration. We call $\\psi(t)$ the <b>basis function</b>. Module 3 builds them by Gram–Schmidt.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 1 · its energy', tex:'\\begin{aligned}E_\\psi&=\\int_0^{T_b}\\psi^{2}(t)\\,dt\\\\&=\\int_0^{T_b}\\frac{1}{T_b}\\,dt\\\\&=\\frac{1}{T_b}\\cdot T_b=1\\end{aligned}',
        note:'Square the height, then integrate over the bit. The height $1/\\sqrt{T_b}$ is chosen so that the energy is exactly $1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A bit lasts $T_b=4$ ms.<div class="nsep"></div>What is the height of $\\psi(t)$?',
        ask:{key:'m2-basis', choices:['$0.25\\ \\text{s}^{-1/2}$','$15.8\\ \\text{s}^{-1/2}$','$250\\ \\text{s}^{-1/2}$'], answer:1,
          why:'$1/\\sqrt{4\\times10^{-3}}=15.8$. Check: $\\psi^{2}=250$, and $250\\times4\\times10^{-3}=1$.'}}]}
  ]}
]},

{ id:'m2-antipodal', module:'M2', nav:'Antipodal signalling', title:'Antipodal signalling',
  objective:'Write both waveforms of polar NRZ as plus and minus a multiple of the basis, and find the energy per bit.',
  keywords:'antipodal signalling polar nrz s1 s0 coefficient A sqrt(Tb) basis multiple bit energy Eb = A^2 Tb',
  src:'CH8 s.14', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Antipodal signalling'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$\\psi(t)$','$s_1(t)$','$s_0(t)$'], ms:1100},
      svg:figAntipodal,
      caption:'Step through: the basis $\\psi(t)$, then $\\psi(t)$ times $+A\\sqrt{T_b}$, then times $-A\\sqrt{T_b}$. Drawn with $A=1.5$.'},
    {t:'legend', items:[['h','$\\psi(t)$'],['in','$s_1(t)$',0,1],['mid','$s_0(t)$',1,2]], at:'tr'}
  ], right:[
    {t:'eq', label:'One shape, two numbers', tex:'s_m(t)=s_m\\,\\psi(t),\\qquad m\\in\\{0,1\\}',
      note:'Both bits use the same shape. The number $s_m$ carries the bit.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Polar NRZ', tex:'\\begin{aligned}s_1(t)&=+A\\sqrt{T_b}\\cdot\\frac{1}{\\sqrt{T_b}}=+A\\\\[4pt]s_0(t)&=-A\\sqrt{T_b}\\cdot\\frac{1}{\\sqrt{T_b}}=-A\\end{aligned}',
        note:'Take $s_1=+A\\sqrt{T_b}$ and $s_0=-A\\sqrt{T_b}$. The $\\sqrt{T_b}$ cancels. One waveform is the negative of the other: the signalling is antipodal.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Energy per bit', tex:'\\begin{aligned}E_b&=\\int_0^{T_b}s_1^{2}(t)\\,dt=\\int_0^{T_b}A^{2}\\,dt\\\\&=A^{2}T_b\\end{aligned}',
        note:'So $A\\sqrt{T_b}=\\sqrt{E_b}$, and the two numbers are $s_1=+\\sqrt{E_b}$ and $s_0=-\\sqrt{E_b}$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'Polar signalling uses $A=2$ V and $T_b=1$ ms, in a $1\\ \\Omega$ load.<div class="nsep"></div>What is $E_b$?',
        ask:{key:'m2-antipodal', choices:['$2$ mJ','$4$ mJ','$8$ mJ'], answer:1,
          why:'$E_b=A^{2}T_b=(2)^{2}(10^{-3})=4\\times10^{-3}$ J.'}}]}
  ]}
]},

{ id:'m2-space', module:'M2', nav:'Signal space', title:'Two waveforms as two points',
  objective:'Represent the two waveforms as two points on the basis axis and find their distance.',
  keywords:'signal space constellation projection coefficient distance 2 sqrt Eb',
  src:'CH8 s.14 (extension, book 8.2.1)', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Two waveforms as two points'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$s_m(t)$','$s_m(t)\\,\\psi(t)$','points','distance'], ms:1100},
      svg:figSignalSpace,
      caption:'Step through: the two waveforms, and their products with $\\psi(t)$, whose areas are the two numbers. Then the numbers as points on the axis of $\\psi(t)$, and their distance.'}
  ], right:[
    {t:'eq', label:'Coefficient on $\\psi$', tex:'\\begin{aligned}s_m&=\\int_0^{T_b}s_m(t)\\,\\psi(t)\\,dt\\\\s_1&=\\int_0^{T_b}A\\cdot\\frac{1}{\\sqrt{T_b}}\\,dt\\\\&=\\frac{A}{\\sqrt{T_b}}\\cdot T_b=A\\sqrt{T_b}=+\\sqrt{E_b}\\end{aligned}',
      note:'Multiply by $\\psi(t)$ and integrate over the bit. For $s_0(t)=-A$ it gives $-\\sqrt{E_b}$. Module 3 draws any signal set this way.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Distance', tex:'\\begin{aligned}d&=s_1-s_0\\\\&=\\sqrt{E_b}-\\bigl(-\\sqrt{E_b}\\bigr)=2\\sqrt{E_b}\\end{aligned}',
        note:'A larger distance means noise must move the received number further before it lands nearer the wrong point.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Polar signalling has $E_b=4$ mJ.<div class="nsep"></div>What is the distance $d$ between the two points?',
        ask:{key:'m2-space', choices:['$0.063\\ \\sqrt{\\text{J}}$','$0.126\\ \\sqrt{\\text{J}}$','$0.253\\ \\sqrt{\\text{J}}$'], answer:1,
          why:'$d=2\\sqrt{E_b}=2\\sqrt{4\\times10^{-3}}=2(0.0632)=0.126\\ \\sqrt{\\text{J}}$.'}}]}
  ]}
]},

{ id:'m2-demod-mf', module:'M2', nav:'The matched-filter demodulator', title:'The matched-filter demodulator',
  objective:'Pass the received bit through the filter matched to the basis and split the output into a signal part and a noise part.',
  keywords:'matched filter demodulator h(t)=psi(Tb-t) signal part noise part n(t) random process linear filter superposition',
  src:'CH8 s.15', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The matched-filter demodulator'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$x(t)$','signal part','noise part','$y(t)$'], ms:1100},
      svg:figDemodSplit,
      caption:'One noisy bit with $s_m=+1$ and the rectangular $\\psi$. Step through: the input, the signal part of the output, the noise part alone, and their sum $y(t)$.'}
  ], right:[
    {t:'eq', label:'Filter and input', tex:'\\begin{aligned}h(t)&=\\psi(T_b-t)\\\\x(t)&=s_m\\psi(t)+w(t),\\qquad 0\\le t\\le T_b\\end{aligned}',
      note:'The filter is $\\psi$ reversed in time and delayed by one bit. $w(t)$ is white Gaussian noise.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 1 · split the output', tex:'\\begin{aligned}y(t)&=x(t)*h(t)\\\\&=\\underbrace{s_m\\psi(t)*h(t)}_{\\text{signal part}}+\\underbrace{w(t)*h(t)}_{=n(t)}\\end{aligned}',
        note:'The filter is linear, so each part of $x(t)$ passes through it on its own.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The same bit is sent twice.<div class="nsep"></div>Which part of $y(t)$ is the same both times?',
        ask:{key:'m2-demod-mf', choices:['the signal part','the noise part','both parts'], answer:0,
          why:'The signal part depends only on $s_m$ and $\\psi$. The noise part $n(t)$ is a random process, new on every transmission.'}}]}
  ]}
]},

{ id:'m2-demod-signal', module:'M2', nav:'The signal part', title:'The signal part as a convolution',
  objective:'Write the signal part and the noise part of the matched-filter output as convolution integrals and see how long the output lasts.',
  keywords:'signal part noise part n(t) convolution integral limits 0 Tb h(t-tau) psi(Tb-(t-tau)) sliding overlap output lasts 2Tb',
  src:'CH8 s.15', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The signal part as a convolution'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$t=0$','$t=T_b/2$','$t=T_b$','$t=3T_b/2$','$t=2T_b$'], ms:1000},
      svg:figDemodConv,
      caption:'One noiseless bit with $s_m=1$ and the rectangular $\\psi$. Top: $s_m\\psi(\\tau)$ and the reversed, shifted filter $h(t-\\tau)$. Below: the area of their overlap, which is $y(t)$. Step $t$ from $0$ to $2T_b$.'}
  ], right:[
    {t:'eq', label:'Step 2 · the signal part', tex:'\\begin{aligned}s_m\\psi(t)*h(t)&=\\int_0^{T_b}s_m\\psi(\\tau)\\,h(t-\\tau)\\,d\\tau\\\\&=\\int_0^{T_b}s_m\\psi(\\tau)\\,\\psi\\bigl(T_b-(t-\\tau)\\bigr)\\,d\\tau\\end{aligned}',
      note:'The limits are $0$ and $T_b$ because $\\psi(\\tau)=0$ outside the bit. Then replace $h(t-\\tau)$ by $\\psi$ at $T_b-(t-\\tau)$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 3 · the noise part and the sum', tex:'\\begin{aligned}n(t)&=w(t)*h(t)\\\\&=\\int_0^{T_b}w(\\tau)\\,\\psi\\bigl(T_b-(t-\\tau)\\bigr)\\,d\\tau\\\\[4pt]y(t)&=\\int_0^{T_b}s_m\\psi(\\tau)\\,\\psi\\bigl(T_b-(t-\\tau)\\bigr)\\,d\\tau+n(t)\\end{aligned}',
        note:'The noise part takes the same steps, with $w(\\tau)$ in place of $s_m\\psi(\\tau)$. The receiver uses $x(t)$ only over the bit, so the limits are again $0$ and $T_b$. The signal part is fixed. $n(t)$ is a random process.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'Common error: take the output to end with the bit at $T_b$. The bit and $h(t)$ each last $T_b$, so the output lasts $2T_b$.'}]}
  ]}
]},

{ id:'m2-demod', module:'M2', nav:'The demodulator output', title:'The demodulator output',
  objective:'Sample the matched-filter output at the end of the bit and show that it is the symbol plus one noise value.',
  keywords:'demodulator output sample at Tb reversal cancels unit energy s_m + n decision statistic random variable',
  src:'CH8 s.16', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The demodulator output'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$x(t)$','$y(t)$','$y(T_b)$'], ms:1200},
      live:{controls:[{k:'n0', label:'$N_0$', min:0, max:0.12, step:0.005, v:0.045, show:v=>'$'+v.toFixed(3)+'$'}]},
      svg:figMfDemod,
      caption:'One noisy bit with $s_m=+1$. Step through the input, the output and its sample at $t=T_b$. The dashed line is the signal part. Raise $N_0$ and $n$ grows as $\\sqrt{N_0}$.'}
  ], right:[
    {t:'eq', label:'Step 1 · sample at $t=T_b$', tex:'y(T_b)=\\int_0^{T_b}s_m\\psi(\\tau)\\,\\psi(\\tau)\\,d\\tau+n(T_b)',
      note:'Put $t=T_b$. Then $\\psi\\bigl(T_b-(T_b-\\tau)\\bigr)=\\psi(\\tau)$: the reversal and the delay cancel.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 2 · use unit energy', tex:'\\begin{aligned}y(T_b)&=s_m\\underbrace{\\int_0^{T_b}\\psi^{2}(\\tau)\\,d\\tau}_{=1}+n(T_b)\\\\&=s_m\\cdot1+n(T_b)\\end{aligned}',
        note:'$s_m$ leaves the integral. The rest is the energy of $\\psi$, which is $1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Key result · the demodulator output', key:true, result:true, tex:'y=s_m+n,\\qquad n=\\int_0^{T_b}w(\\tau)\\,\\psi(\\tau)\\,d\\tau',
        note:'The waveform has become one number. $n=n(T_b)$ is random, with a new value on every bit.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$E_b=4$ mJ, bit $0$, $n=0.01$.<div class="nsep"></div>What is $y$?',
        ask:{key:'m2-demod', choices:['$-0.073$','$-0.053$','$+0.053$'], answer:1,
          why:'$s_0=-\\sqrt{E_b}=-0.0632$, so $y=-0.0632+0.01=-0.053$.'}}]}
  ]}
]},

{ id:'m2-demod-shapes', module:'M2', nav:'Other pulse shapes', title:'The demodulator for other pulse shapes',
  objective:'Send polar, Manchester and three-step pulses through the filter matched to their basis. The sample at the end of the bit is the symbol each time.',
  keywords:'pulse shapes polar nrz manchester three step unit energy basis matched filter output shape sample at Tb equals s_m',
  src:'CH8 s.17', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The demodulator for other pulse shapes'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['polar $1$','polar $0$','Manchester $1$','Manchester $0$','three steps'], ms:1100},
      live:{controls:[{k:'t', label:'$t/T_b$', min:0, max:2, step:0.01, v:1, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figDemodShapes,
      caption:'Five unit-energy pulses $g(t)=s_m\\psi(t)$. Drag $t$: $h(t-\\tau)$ slides over $g(\\tau)$, and the shaded product integrates to $y(t)$. At $t=T_b$, $y=s_m$.'},
    {t:'legend', items:[['in','$g(\\tau)$'],['h','$h(t-\\tau)$',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Any unit-energy $\\psi$', tex:'\\begin{aligned}y(T_b)&=s_m\\underbrace{\\int_0^{T_b}\\psi^{2}(\\tau)\\,d\\tau}_{=1}\\\\&=s_m=\\pm1\\end{aligned}',
      note:'Step 2 of the last slide used only the unit energy of $\\psi$, never its shape. The filter matched to $\\psi$ serves both bits of a code.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Signal part only', html:'These outputs carry no noise. With noise the sample is $s_m+n$, and the curve between samples moves too.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The Manchester $\\psi(t)$ is $+1$ on the first half of the bit and $-1$ on the second. The bit is $1$, with no noise.<div class="nsep"></div>What is $y(T_b/2)$?',
        ask:{key:'m2-demod-shapes', choices:['$-0.5$','$0$','$+0.5$'], answer:0,
          why:'At $t=T_b/2$ the filter overlaps the first half of the bit. There $\\psi=+1$ meets $h=-1$, so $y=-0.5$.'}}]}
  ]}
]},

{ id:'m2-demod-train', module:'M2', nav:'A stream of bits', title:'A stream of bits',
  objective:'Demodulate ten bits in a row and see that each sample holds only its own bit.',
  keywords:'bit stream ten bits polar nrz manchester matched filter output triangles overlap sampling instants kTb no interference samples sign',
  src:'CH8 s.18', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'A stream of bits'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['bits','$x(t)$','$y_0(t)$','$y(t)$','samples','Manchester'], ms:1200},
      live:{controls:[{k:'t', label:'$t/T_b$', min:0, max:10.8, step:0.02, v:10.8, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figDemodTrain,
      caption:'Ten polar bits, then Manchester, through the matched filter. Drag $t$: the top axes zoom in, $h(t-\\tau)$ covers $[t-T_b,t]$, and the shaded product of the signal part integrates to $y_0(t)$.'},
    {t:'legend', items:[['in','$g(\\tau)$'],['out','$x(\\tau)$',0,1],['h','$h(t-\\tau)$',true]], at:'tc-row'}
  ], right:[
    {t:'eq', label:'Bit $k$', tex:'y(kT_b)=s_{m,k}+n_k,\\qquad k=1,2,\\dots',
      note:'Bit $k$ lasts from $(k-1)T_b$ to $kT_b$. Its output peaks at $kT_b$. The outputs of the bits before and after it are zero there.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Reading the samples', html:'A sample above $0$ is read as bit $1$, and a sample below $0$ as bit $0$. Section 2.4 places this threshold and finds how often noise moves a sample across it.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Two polar $1$ bits follow each other, with no noise.<div class="nsep"></div>What does $y_0(t)$ do between their two sampling instants?',
        ask:{key:'m2-demod-train', choices:['it falls to $0$','it stays at $+1$','it rises to $+2$'], answer:1,
          why:'The falling side of the first triangle and the rising side of the second add to $1$ at every $t$ between them.'}}]}
  ]}
]},

{ id:'m2-corr-out', module:'M2', nav:'The correlator demodulator', title:'The correlator demodulator',
  objective:'Build the demodulator as a multiplier and an integrator, and write its output as the symbol term plus a noise term.',
  keywords:'correlator demodulator correlation type multiply by psi integrate from 0 to t integrate and dump output s_m int psi^2 plus noise',
  src:'CH8 s.19', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The correlator demodulator'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$t=0$','$t=T_b/2$','$t=T_b$','reset'], ms:1200},
      svg:figCorrOut,
      caption:'One noiseless Manchester bit, $s_m=1$. Middle: the input and its product with $\\psi(\\tau)$. Below: the running integral, read at $T_b$, then reset.'}
  ], right:[
    {t:'eq', label:'The correlator', tex:'y(t)=\\int_0^{t}x(\\tau)\\,\\psi(\\tau)\\,d\\tau,\\qquad 0\\le t\\le T_b',
      note:'Multiply by $\\psi(t)$ and integrate from the start of the bit.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 1 · substitute $x(\\tau)$', tex:'\\begin{aligned}y(t)&=\\int_0^{t}\\bigl[\\underbrace{s_m\\psi(\\tau)+w(\\tau)}_{=x(\\tau)}\\bigr]\\psi(\\tau)\\,d\\tau\\\\&=s_m\\int_0^{t}\\psi^{2}(\\tau)\\,d\\tau+\\int_0^{t}w(\\tau)\\,\\psi(\\tau)\\,d\\tau\\end{aligned}',
        note:'Multiply out and split the integral.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A noiseless Manchester bit $1$.<div class="nsep"></div>What is the correlator output at $t=T_b/2$?',
        ask:{key:'m2-corr-out', choices:['$-0.5$','$0$','$+0.5$'], answer:2,
          why:'$y(T_b/2)=\\int_0^{T_b/2}\\psi^{2}\\,d\\tau=0.5$. The matched filter gives $-0.5$ at that time.'}}]}
  ]}
]},

{ id:'m2-correlator', module:'M2', nav:'Correlator and matched filter', title:'Correlator and matched-filter demodulators',
  objective:'Show that the correlator and the matched filter give the same value at the end of the bit.',
  keywords:'correlator integrate and dump matched filter equivalence sampling instant T_b',
  src:'CH8 s.19–20', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Correlator and matched-filter demodulators'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['rectangular $\\psi$','Manchester $\\psi$','three steps'], ms:1200},
      svg:figCorrMf,
      caption:'One noiseless bit with $s_m=1$, for three shapes of $\\psi$. The wide line is the matched-filter output, the dashed line the correlator output, reset at $T_b$. At $t=T_b$ both read $s_m$.'},
    {t:'legend', items:[['mid','matched filter'],['mid','correlator',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Correlator at $T_b$', tex:'\\begin{aligned}y(T_b)&=s_m\\underbrace{\\int_0^{T_b}\\psi^{2}(\\tau)\\,d\\tau}_{=1}+\\int_0^{T_b}w(\\tau)\\,\\psi(\\tau)\\,d\\tau\\\\&=s_m+n\\end{aligned}',
      note:'This $n$ equals the filter noise $n(T_b)$. Before $T_b$ the two noise terms differ.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Matched filter at $T_b$', tex:'\\begin{aligned}h(t)&=\\psi(T_b-t)\\\\y(t)&=\\int_{-\\infty}^{\\infty}x(\\tau)\\,\\underbrace{\\psi(T_b-t+\\tau)}_{=h(t-\\tau)}\\,d\\tau\\\\y(T_b)&=\\int_0^{T_b}x(\\tau)\\,\\psi(\\tau)\\,d\\tau\\end{aligned}',
        note:'Put $t=T_b$. The last line is the correlator output, for any shape of $\\psi$. Both demodulators turn the waveform into the one number $y=s_m+n$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A noiseless bit with $s_m=1$ and the rectangular $\\psi$ enters the matched filter.<div class="nsep"></div>What is the filter output at $t=1.5T_b$?',
        ask:{key:'m2-correlator', choices:['$0$','$0.5$','$1$'], answer:1,
          why:'The output is the triangle $2-t/T_b$ after its peak, so $y(1.5T_b)=0.5$. Only the value at $T_b$ is used.'}}]}
  ]}
]},

{ id:'m2-demod-noise', module:'M2', nav:'The noise sample', title:'The noise sample',
  objective:'Find the mean of the noise value at the demodulator output and write its mean square as a double integral.',
  keywords:'noise sample mean zero expectation inside integral variance mean square double integral white noise autocorrelation',
  src:'CH8 s.21', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The noise sample'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$\\psi(t)\\psi(u)$','$E[w(t)w(u)]$'], ms:1200},
      svg:figNoisePlane,
      caption:'The square of $(t,u)$ pairs in the double integral, for the Manchester $\\psi(t)$. The product $\\psi(t)\\psi(u)$ is $\\pm1/T_b$. White noise is correlated only near the line $t=u$.'}
  ], right:[
    {t:'eq', label:'Step 1 · the mean', tex:'\\begin{aligned}E[n]&=\\int_0^{T_b}E[w(\\tau)]\\,\\psi(\\tau)\\,d\\tau\\\\&=0\\end{aligned}',
      note:'The expectation moves inside the integral, and white noise has zero mean.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 2 · square and average', tex:'\\begin{aligned}E[n^{2}]&=E\\Bigl[\\int_0^{T_b}w(t)\\psi(t)\\,dt\\int_0^{T_b}w(u)\\psi(u)\\,du\\Bigr]\\\\&=\\int_0^{T_b}\\!\\!\\int_0^{T_b}E[w(t)w(u)]\\,\\psi(t)\\,\\psi(u)\\,dt\\,du\\end{aligned}',
        note:'Write $n^{2}$ as two integrals with different variables. Then take the expectation inside.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The noise value $n$ has $E[n]=0$.<div class="nsep"></div>Which quantity equals its variance?',
        ask:{key:'m2-demod-noise', choices:['$E[n^{2}]$','$(E[n])^{2}$','$E[n]$'], answer:0,
          why:'$\\operatorname{Var}(n)=E[n^{2}]-(E[n])^{2}$, and the second term is $0$.'}}]}
  ]}
]},

{ id:'m2-demod-noise-var', module:'M2', nav:'The noise variance', title:'The noise variance',
  objective:'Use the autocorrelation of white noise to reduce the double integral to N0/2, and state the distribution of the noise value.',
  keywords:'noise variance N0/2 white noise autocorrelation delta sifting unit energy gaussian random variable standard deviation',
  src:'CH8 s.21', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The noise variance'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$E[w(t)w(u)]$','$t=u$','result'], ms:1200},
      svg:figNoisePlaneB,
      caption:'Step through: the band where white noise is correlated narrows to the line $t=u$. On that line $\\psi(t)\\psi(u)=\\psi^{2}(t)=1/T_b$, whatever the sign pattern of $\\psi$.'}
  ], right:[
    {t:'eq', label:'Step 3 · white noise', tex:'\\begin{aligned}E[w(t)w(u)]&=R_w(t-u)\\\\&=\\frac{N_0}{2}\\,\\delta(t-u)\\end{aligned}',
      note:'The mean of $w(t)w(u)$ is the autocorrelation of $w$. For white noise it is an impulse at $t=u$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step 4 · sift and use unit energy', tex:'\\begin{aligned}E[n^{2}]&=\\int_0^{T_b}\\psi(t)\\int_0^{T_b}\\frac{N_0}{2}\\,\\delta(t-u)\\,\\psi(u)\\,du\\,dt\\\\&=\\frac{N_0}{2}\\int_0^{T_b}\\psi(t)\\underbrace{\\int_0^{T_b}\\psi(u)\\,\\delta(u-t)\\,du}_{=\\psi(t)}\\,dt\\\\&=\\frac{N_0}{2}\\underbrace{\\int_0^{T_b}\\psi^{2}(t)\\,dt}_{=1}\\\\&=\\frac{N_0}{2}\\end{aligned}',
        note:'$\\delta$ is even, so $\\delta(t-u)=\\delta(u-t)$. The impulse sifts out $\\psi(t)$, and unit energy gives $N_0/2$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Key result · the noise value', key:true, result:true, tex:'n\\sim\\mathcal{N}\\Bigl(0,\\ \\frac{N_0}{2}\\Bigr),\\qquad y\\sim\\mathcal{N}\\Bigl(s_m,\\ \\frac{N_0}{2}\\Bigr)',
        note:'A linear operation on Gaussian noise gives a Gaussian value. Adding $s_m$ moves the mean only.'}]}
  ]}
]},

{ id:'m2-demod-noise-hist', module:'M2', nav:'Measuring the noise value', title:'Measuring the noise value',
  objective:'Measure many noise values n under a slider for N0 and compare their spread with sqrt(N0/2).',
  keywords:'noise value histogram measured standard deviation sqrt(N0/2) slider N0 gaussian density simulation',
  src:'CH8 s.21 (extension)', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Measuring the noise value'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'N0', label:'$N_0$', min:0.05, max:1, step:0.05, v:0.5, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figNoiseHist,
      caption:'$3000$ noise values $n=\\int_0^{T_b}w(\\tau)\\,\\psi(\\tau)\\,d\\tau$, each from its own white noise, with the Manchester $\\psi$. Drag $N_0$. The curve is the Gaussian density with $\\sigma=\\sqrt{N_0/2}$.'}
  ], right:[
    {t:'eq', label:'The prediction', tex:'\\sigma=\\sqrt{\\frac{N_0}{2}}',
      note:'Each value is a sum of many noise samples weighted by $\\psi$. The measured spread follows $\\sqrt{N_0/2}$ to within a few percent at every $N_0$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'err', head:'Common error', html:'Common error: take $\\sigma=N_0/2$. That is the variance. At $N_0=0.5$ the spread is $\\sqrt{0.25}=0.5$, not $0.25$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$N_0$ is made four times larger.<div class="nsep"></div>What happens to the spread $\\sigma$ of $n$?',
        ask:{key:'m2-demod-noise-hist', choices:['it doubles','it grows $4$ times','it grows $16$ times'], answer:0,
          why:'$\\sigma=\\sqrt{N_0/2}$, and $\\sqrt{4}=2$.'}}]}
  ]}
]},

{ id:'m2-demod-ppm', module:'M2', nav:'Two orthogonal signals', title:'Two orthogonal signals',
  objective:'Demodulate binary orthogonal signals with two correlators and find the two noise terms uncorrelated.',
  keywords:'binary orthogonal signalling ppm pulse position two basis functions two correlators y1 y2 signal points uncorrelated independent noise distance sqrt(2Eb)',
  src:'book 8.3.1, binary orthogonal signals (extension)', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Two orthogonal signals'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$s_1(t),\\,s_2(t)$','$\\psi_1,\\,\\psi_2$','points','noise'], ms:1200},
      svg:figPpm,
      caption:'Pulse position: $s_1$ fills the first half of the bit and $s_2$ the second. Step through: the waveforms, the two bases, the two points on the plane $(y_1,y_2)$, and noisy outputs around them.'}
  ], right:[
    {t:'eq', label:'Two correlators', tex:'\\begin{aligned}y_m&=\\int_0^{T_b}r(\\tau)\\,\\psi_m(\\tau)\\,d\\tau,\\qquad m=1,2\\\\s_1\\text{ sent:}\\quad y_1&=\\sqrt{E_b}+n_1,\\qquad y_2=n_2\\end{aligned}',
      note:'Each correlator is matched to one basis. $\\psi_2$ is zero where $s_1$ is not, so the second output holds noise only.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The two noise terms', tex:'\\begin{aligned}E[n_1n_2]&=\\frac{N_0}{2}\\int_0^{T_b}\\psi_1(t)\\,\\psi_2(t)\\,dt\\\\&=0\\end{aligned}',
        note:'The sifting step of the variance, with $\\psi_2$ in place of the second $\\psi$. Orthogonal bases give uncorrelated, and so independent, Gaussian noise.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Orthogonal signalling with $E_b=4$ mJ.<div class="nsep"></div>What is the distance between the two points?',
        ask:{key:'m2-demod-ppm', choices:['$0.063\\ \\sqrt{\\text{J}}$','$0.089\\ \\sqrt{\\text{J}}$','$0.126\\ \\sqrt{\\text{J}}$'], answer:1,
          why:'$d=\\sqrt{2E_b}=\\sqrt{8\\times10^{-3}}=0.089$. Antipodal points are $2\\sqrt{E_b}=0.126$ apart, $\\sqrt{2}$ further.'}}]}
  ]}
]},

REAL_DEMOD,

{ id:'m2-lab-p', module:'M2', nav:'Laboratory {lab} · Correlator and matched filter', title:'Laboratory {lab} · Correlator and matched filter',
  objective:'Send one bit through both demodulators and compare their outputs.',
  keywords:'laboratory correlator matched filter demodulator decision statistic sampling instant interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Laboratory {lab} · Correlator and matched filter'},
  {t:'lede', text:'Send one bit through both demodulators. Compare the two outputs over the bit and at $t=T_b$.'},
  {t:'lab', id:'P'}
]},

{ id:'m2-code-demod', module:'M2', nav:'Code · The demodulator', title:'The demodulator in code',
  objective:'Project a received bit on the basis, compare the correlator with the matched filter and measure the noise variance.',
  keywords:'code matlab python program run basis function correlator matched filter noise variance',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator in code'},
  {t:'title', text:'The demodulator in code'},
  {t:'raw', html:()=>CODEBANK.page('m2-code-demod')}
]},

/* ---------------------------------------------------------------- 2.3 ---- */
{ id:'m2-stat', module:'M2', nav:'The decision statistic', title:'The decision statistic',
  objective:'Write the two conditional densities of the demodulator output.',
  keywords:'decision statistic conditional density gaussian mean variance likelihood',
  src:'CH8 s.21–22', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'The decision statistic'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figStat,
      caption:'The density of $y$ for each symbol, drawn with $E_b=1$ and $N_0=0.5$. Each is a Gaussian centred on its symbol, and the two overlap.'},
    {t:'legend', items:[['mid','$f_Y(y\\mid s_0)$'],['in','$f_Y(y\\mid s_1)$']], at:'tr'}
  ], right:[
    {t:'eq', label:'The statistic', tex:'y=s_m+n,\\qquad s_m=\\pm\\sqrt{E_b},\\qquad n\\sim\\mathcal{N}\\!\\left(0,\\tfrac{N_0}{2}\\right)',
      note:'$y$ is the demodulator output at $t=T_b$. It is all the receiver keeps of the bit.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Mean and variance', tex:'\\begin{aligned}E[y]&=E[s_m+n]=E[s_m]+E[n]\\\\&=s_m\\\\\\sigma_Y^{2}&=\\operatorname{Var}(y)=\\operatorname{Var}(s_m+n)\\\\&=\\operatorname{Var}(n)=\\frac{N_0}{2}\\end{aligned}',
        note:'$s_m$ is a constant and $E[n]=0$, so the mean is the symbol. Adding a constant moves $y$ but does not change its spread, since $\\operatorname{Var}(aX+b)=a^{2}\\operatorname{Var}(X)$ with $a=1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Conditional density', tex:'f_Y(y\\mid s_1)=\\frac{1}{\\sqrt{\\pi N_0}}\\exp\\!\\left(-\\frac{(y-\\sqrt{E_b})^{2}}{N_0}\\right)',
        note:'This is a Gaussian with mean $\\sqrt{E_b}$ and variance $\\sigma^{2}=N_0/2$. For $s_0$, replace $-\\sqrt{E_b}$ by $+\\sqrt{E_b}$ in the exponent.'}]},
  ]}
]},

{ id:'m2-errors', module:'M2', nav:'The two errors', title:'The two conditional errors',
  objective:'Write each conditional error probability as a Gaussian tail and see them trade as the threshold moves.',
  keywords:'threshold conditional error probability gaussian tail Q function trade off',
  src:'CH8 s.24–26', slide:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'The two conditional errors'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'lam', label:'$\\lambda$', min:-1, max:1, step:0.05, v:0, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figErrors,
      caption:'Drag the threshold $\\lambda$. The receiver decides $s_1$ when $y>\\lambda$. Each red area is one conditional error. One grows as the other shrinks.'},
    {t:'legend', items:[['mid','$f_Y(y\\mid s_0)$'],['in','$f_Y(y\\mid s_1)$'],['err','error']], at:'tr'}
  ], right:[
    {t:'eq', label:'Gaussian tail: $X\\sim\\mathcal{N}(\\mu,\\sigma^{2})$', key:true, tex:'\\begin{aligned}P(X>\\lambda)&=Q\\!\\left(\\frac{\\lambda-\\mu}{\\sigma}\\right)\\\\P(X<\\lambda)&=1-P(X>\\lambda)=1-Q\\!\\left(\\frac{\\lambda-\\mu}{\\sigma}\\right)\\\\Q(x)&=1-Q(-x)\\end{aligned}'},
    {t:'eq', label:'Case I: $s_0$ sent, $y>\\lambda$', tex:'\\begin{aligned}P(\\text{err}\\mid s_0)=P(y>\\lambda\\mid s_0)&=\\int_{\\lambda}^{\\infty}f_Y(y\\mid s_0)\\,dy\\\\&=\\int_{\\lambda}^{\\infty}\\frac{1}{\\sqrt{\\pi N_0}}\\,e^{-(y+\\sqrt{E_b})^{2}/N_0}\\,dy\\\\&=Q\\!\\left(\\frac{\\lambda-\\mu_0}{\\sigma}\\right)=Q\\!\\left(\\frac{\\lambda+\\sqrt{E_b}}{\\sigma}\\right)\\end{aligned}',
      note:'The receiver decides $s_1$ when $y>\\lambda$. Given $s_0$, $y$ is Gaussian with mean $\\mu_0=-\\sqrt{E_b}$ and deviation $\\sigma=\\sqrt{N_0/2}$. The Gaussian tail rule gives $Q\\bigl((\\lambda-\\mu_0)/\\sigma\\bigr)$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Case II: $s_1$ sent, $y<\\lambda$', tex:'\\begin{aligned}P(\\text{err}\\mid s_1)=P(y<\\lambda\\mid s_1)&=\\int_{-\\infty}^{\\lambda}f_Y(y\\mid s_1)\\,dy\\\\&=1-Q\\!\\left(\\frac{\\lambda-\\mu_1}{\\sigma}\\right)=1-Q\\!\\left(\\frac{\\lambda-\\sqrt{E_b}}{\\sigma}\\right)\\end{aligned}',
        note:'The receiver decides $s_0$ when $y<\\lambda$. Given $s_1$ the mean is $\\mu_1=+\\sqrt{E_b}$. The tail below $\\lambda$ is $1-Q\\bigl((\\lambda-\\mu_1)/\\sigma\\bigr)$.'}]}
  ]}
]},

{ id:'m2-threshold', module:'M2', nav:'The optimal threshold', title:'The optimal threshold',
  objective:'Derive the threshold that minimises the average error probability for unequal priors.',
  keywords:'optimal threshold map rule unequal priors average error probability derivative log likelihood',
  src:'CH8 s.24–26', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'The optimal threshold'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figThreshold,
      caption:'The two densities weighted by their priors, for $P(s_0)=0.7$, $E_b=1$ and $N_0=0.5$. They cross at $\\lambda_{\\mathrm{opt}}$, right of zero. The shaded area is $P_e$.'},
    {t:'legend', items:[['mid','$0.7\\,f_Y(y\\mid s_0)$'],['in','$0.3\\,f_Y(y\\mid s_1)$'],['err','$P_e$']], at:'tr'}
  ], right:[
    {t:'eq', label:'Minimise the average error', tex:'P_e(\\lambda)=p_0\\int_{\\lambda}^{\\infty}f_Y(y\\mid s_0)\\,dy+p_1\\int_{-\\infty}^{\\lambda}f_Y(y\\mid s_1)\\,dy',
      note:'$p_0$ and $p_1$ are the priors.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Leibniz rule', tex:'\\frac{d}{db}\\int_{a}^{b}f(x)\\,dx=f(b),\\qquad\\frac{d}{da}\\int_{a}^{b}f(x)\\,dx=-f(a)'},
      {t:'eq', label:'Set the derivative to zero', tex:'\\frac{dP_e}{d\\lambda}=-p_0\\,f_Y(\\lambda\\mid s_0)+p_1\\,f_Y(\\lambda\\mid s_1)=0',
        note:'$\\lambda$ is the lower limit of the first integral, hence the minus sign.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solve for $\\lambda$', key:true, result:true, tex:'\\begin{aligned}p_0\\,e^{-(\\lambda+\\sqrt{E_b})^{2}/N_0}&=p_1\\,e^{-(\\lambda-\\sqrt{E_b})^{2}/N_0}\\\\4\\lambda\\sqrt{E_b}&=N_0\\ln\\frac{p_0}{p_1}\\\\\\lambda_{\\mathrm{opt}}&=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}\\end{aligned}',
        note:'Cancel the common factor $1/\\sqrt{\\pi N_0}$, take logarithms, then expand the two squares.'}]},
  ]}
]},

{ id:'m2-threshold-b', module:'M2', nav:'Threshold, priors and noise', title:'Threshold, priors and noise',
  objective:'See how the optimal threshold moves with the prior and with the noise level.',
  keywords:'optimal threshold prior noise level equal priors zero threshold moves with N0',
  src:'CH8 s.24–26', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'Threshold, priors and noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[
        {k:'p0', label:'$p_0$', min:0.1, max:0.9, step:0.05, v:0.7, show:v=>'$'+v.toFixed(2)+'$'},
        {k:'dB', label:'$E_b/N_0$', min:0, max:10, step:1, v:3, show:v=>'$'+v+'$ dB'}]},
      svg:figThresholdLive,
      caption:'Drag the prior $p_0$ and $E_b/N_0$, with $E_b=1$. The threshold sits where the weighted densities cross. It returns to $0$ at $p_0=0.5$.'},
    {t:'legend', items:[['mid','$p_0\\,f_Y(y\\mid s_0)$'],['in','$p_1\\,f_Y(y\\mid s_1)$']], at:'tr'}
  ], right:[
    {t:'note', kind:'def', head:'Two effects', html:'<ol class="steps"><li>The threshold moves away from the more likely symbol, so that symbol gets the larger region.</li><li>The move grows with $N_0$. With little noise, $y$ decides and the prior hardly matters.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $\\ln(p_0/p_1)$, not $\\ln(p_1/p_0)$. With $p_0>p_1$ the threshold is positive, so the more likely $s_0$ keeps more of the axis.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The two symbols are equally likely, $p_0=p_1=0.5$.<div class="nsep"></div>Where is $\\lambda_{\\mathrm{opt}}$?',
        ask:{key:'m2-threshold-b', choices:['$0$','$N_0/4$','it depends on $N_0$'], answer:0,
          why:'$\\ln(0.5/0.5)=\\ln1=0$, so $\\lambda_{\\mathrm{opt}}=0$ for every $N_0$.'}}]}
  ]}
]},

{ id:'m2-q', module:'M2', nav:'The Q function', title:'The Q function',
  objective:'Define the Gaussian tail Q(x) and read its values.',
  keywords:'Q function gaussian tail standard normal table values',
  src:'CH8 s.29–31', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'The Q function'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'x', label:'$x$', min:-3.5, max:3.5, step:0.1, v:1, show:v=>'$'+v.toFixed(1)+'$'}]},
      svg:figQ,
      caption:'Drag $x$. $Q(x)$ falls from $1$ to $0$ and passes $0.5$ at $x=0$. The curve is symmetric about that point, so $Q(-x)=1-Q(x)$.'}
  ], right:[
    {t:'eq', label:'Definition', key:true, tex:'Q(x)=\\frac{1}{\\sqrt{2\\pi}}\\int_{x}^{\\infty}e^{-z^{2}/2}\\,dz',
      note:'$Q(x)$ is the probability that a Gaussian of mean $0$ and variance $1$ exceeds $x$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Values', tex:'Q(0)=0.5,\\quad Q(1)=0.159,\\quad Q(2)=0.0228,\\quad Q(3)=1.35\\times10^{-3}',
        note:'For large $x$, $Q(x)\\le\\tfrac12e^{-x^{2}/2}$, so the tail falls faster than any power of $x$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A Gaussian noise value has mean $0$ and standard deviation $\\sigma$.<div class="nsep"></div>What is the probability that it exceeds $3\\sigma$?',
        ask:{key:'m2-q', choices:['$1.35\\times10^{-3}$','$0.0228$','$0.159$'], answer:0,
          why:'Divide by $\\sigma$: the probability is $Q(3)=1.35\\times10^{-3}$.'}}]}
  ]}
]},

{ id:'m2-pe', module:'M2', nav:'The error probability', title:'The bit error probability',
  objective:'Derive the bit error probability of polar signalling with equal priors.',
  keywords:'bit error probability polar signalling equal priors Q sqrt 2Eb/N0 decibels curve',
  src:'CH8 s.29–31', slide:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'The bit error probability'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'dB', label:'$E_b/N_0$', min:0, max:12, step:0.2, v:9.6, show:v=>'$'+v.toFixed(1)+'$ dB'}]},
      svg:figPe,
      caption:'Drag $E_b/N_0$. The error probability falls slowly at low $E_b/N_0$ and steeply at high $E_b/N_0$.'}
  ], right:[
    {t:'eq', label:'Put $\\lambda=0$ in both conditional errors', tex:'\\begin{aligned}P(\\text{err}\\mid s_0)&=Q\\!\\left(\\frac{0+\\sqrt{E_b}}{\\sigma}\\right)=Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)\\\\P(\\text{err}\\mid s_1)&=1-Q\\!\\left(\\frac{0-\\sqrt{E_b}}{\\sigma}\\right)=1-Q\\!\\left(-\\frac{\\sqrt{E_b}}{\\sigma}\\right)\\\\&=1-\\left[1-Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)\\right]=Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)\\end{aligned}',
      note:'The last step uses $Q(-x)=1-Q(x)$. The two conditional errors are equal.'},
    {t:'eq', label:'Equal priors', tex:'\\begin{aligned}P_e&=\\underbrace{p_0}_{=1/2}\\underbrace{\\int_{0}^{\\infty}f_Y(y\\mid s_0)\\,dy}_{=Q(\\sqrt{E_b}/\\sigma)}+\\underbrace{p_1}_{=1/2}\\underbrace{\\int_{-\\infty}^{0}f_Y(y\\mid s_1)\\,dy}_{=Q(\\sqrt{E_b}/\\sigma)}=Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)\\\\\\frac{\\sqrt{E_b}}{\\sigma}&=\\frac{\\sqrt{E_b}}{\\sqrt{N_0/2}}=\\sqrt{\\frac{2E_b}{N_0}}\\end{aligned}'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Polar signalling', key:true, result:true, tex:'P_e=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)',
        note:'$2E_b/N_0$ is the peak SNR of the matched filter, so $P_e=Q\\bigl(\\sqrt{\\eta_{\\max}}\\bigr)$.'}]}
  ]}
]},

{ id:'m2-ex-pe', module:'M2', nav:'Worked example · unequal priors', title:'Worked example: unequal priors',
  objective:'Find the optimal threshold for unequal priors.',
  keywords:'worked example unequal priors optimal threshold 0.0212 logarithm density parabolas',
  src:'CH8 s.32–34', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Worked example'},
  {t:'title', text:'Worked example: unequal priors'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figExLog,
      caption:'The two weighted densities on a logarithmic scale, where each is a parabola. They cross at $\\lambda_{\\mathrm{opt}}$, just right of zero.'},
    {t:'legend', items:[['mid','$0.7\\,f_Y(y\\mid s_0)$'],['in','$0.3\\,f_Y(y\\mid s_1)$']], at:'tc'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'Polar signalling with $E_b=1$, $N_0=0.1$ and $P(s_1)=0.3$.<div class="nsep"></div>Find (a) the optimal threshold $\\lambda_{\\mathrm{opt}}$.',
      ask:{key:'m2-ex-pe', choices:['$-0.0212$','$0$','$0.0212$'], answer:2,
        why:'$\\lambda_{\\mathrm{opt}}=\\frac{0.1}{4}\\ln\\frac{0.7}{0.3}=0.025(0.847)=0.0212$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}',
        note:'The priors are unequal, so the threshold is not zero. $p_0=1-P(s_1)=0.7$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}\\lambda_{\\mathrm{opt}}&=\\frac{0.1}{4(1)}\\ln\\frac{0.7}{0.3}\\\\&=0.025(0.8473)\\\\&=0.0212\\end{aligned}',
        note:'Check: both weighted densities equal $3.70\\times10^{-5}$ there.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $p_0=0.7$, not the given $0.3$, for $s_0$. Swapping them gives $-0.0212$.'}]}
  ]}
]},

{ id:'m2-ex-pe-b', module:'M2', nav:'Worked example · the error probability', title:'Worked example: the error probability',
  objective:'Compute the average error probability at the optimal threshold and compare it with a threshold at zero.',
  keywords:'worked example unequal priors average error probability optimal threshold zero threshold comparison',
  src:'CH8 s.32–34', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Worked example'},
  {t:'title', text:'Worked example: the error probability'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figExPe,
      caption:'$P_e$ against the threshold for the same link. The minimum sits at $\\lambda_{\\mathrm{opt}}=0.0212$. At $\\lambda=0$ it is about $10$ per cent higher.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$E_b=1$, $N_0=0.1$, $p_0=0.7$, $\\lambda_{\\mathrm{opt}}=0.0212$.<div class="nsep"></div>Find (b) $P_e$ at $\\lambda_{\\mathrm{opt}}$, against $P_e$ at $\\lambda=0$.',
      ask:{key:'m2-ex-pe-b', choices:['about $10$ per cent lower','half as large','the same'], answer:0,
        why:'$P_e(\\lambda_{\\mathrm{opt}})=3.53\\times10^{-6}$ and $P_e(0)=3.87\\times10^{-6}$, a ratio of $1.10$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'P_e=p_0\\,Q\\!\\left(\\frac{\\lambda+\\sqrt{E_b}}{\\sigma}\\right)+p_1\\,Q\\!\\left(\\frac{\\sqrt{E_b}-\\lambda}{\\sigma}\\right),\\quad\\sigma=\\sqrt{N_0/2}=0.2236'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}P(\\text{err}\\mid s_0)&=Q\\!\\left(\\tfrac{1.0212}{0.2236}\\right)=Q(4.567)=2.48\\times10^{-6}\\\\P(\\text{err}\\mid s_1)&=Q\\!\\left(\\tfrac{0.9788}{0.2236}\\right)=Q(4.377)=6.01\\times10^{-6}\\\\P_e&=0.7(2.48)+0.3(6.01)=3.53\\times10^{-6}\\end{aligned}',
        note:'Check: at $\\lambda=0$, $P_e=Q(4.472)=3.87\\times10^{-6}$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $\\sigma=\\sqrt{N_0/2}$, not $\\sqrt{N_0}$. The wrong $\\sigma$ raises $P_e$ over a hundred times.'}]}
  ]}
]},

REAL_DECISION,

{ id:'m2-lab-d', module:'M2', nav:'Laboratory {lab} · Threshold and error probability', title:'Laboratory {lab} · Threshold and error probability',
  objective:'Move the threshold, the prior and the noise, and compare with the optimal threshold.',
  keywords:'laboratory threshold priors noise variance error probability decision regions interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'Laboratory {lab} · Threshold and error probability'},
  {t:'lede', text:'Move the threshold, the prior and $E_b/N_0$. Compare your threshold with $\\lambda_{\\mathrm{opt}}$.'},
  {t:'lab', id:'D'}
]},

{ id:'m2-code-decision', module:'M2', nav:'Code · The decision', title:'The decision in code',
  objective:'Compute the optimal threshold, draw the error probability curve and find the minimum by a scan.',
  keywords:'code matlab python program run optimal threshold error probability Q function scan',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 2 · The decision in code'},
  {t:'title', text:'The decision in code'},
  {t:'raw', html:()=>CODEBANK.page('m2-code-decision')}
]},

/* ---------------------------------------------------------------- 2.4 ---- */
{ id:'m2-isi-link', module:'M2', nav:'The baseband link', title:'The baseband link',
  objective:'Follow one bit pattern block by block through a baseband link, from the bits to the decisions.',
  keywords:'baseband link pulse amplitude modulator transmit filter channel receive filter sampler decision overall pulse',
  src:'CH8 s.35–36', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'The baseband link'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['bits $b_k$','amplitudes $a_k$','transmit filter','ideal channel','band-limited channel','noise and receive filter','sampler','decision'], ms:1100},
      svg:figIsiLink,
      caption:'Step through the link for the bits $1\\,1\\,0\\,1\\,0\\,0$. The red dot marks the point whose signal is drawn. An ideal channel, $h(t)=\\delta(t)$, passes $s(t)$ unchanged. A band-limited channel rounds the edges and spreads each pulse.'}
  ], right:[
    {t:'note', kind:'def', head:'Symbols', html:'$b_k$: the $k$-th bit. $a_k=\\pm1$: its amplitude. $T_b$: the bit duration.<div class="nsep"></div>$g(t)$, $h(t)$, $c(t)$: the transmit filter, the channel and the receive filter. $w(t)$: the channel noise. $t_i=iT_b$: the sampling instants.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Channel output', tex:'x(t)=s(t)*h(t)',
        note:'$h(t)$ is the impulse response of the channel. An ideal channel has $h(t)=\\delta(t)$, so $x(t)=s(t)$. A band-limited channel rounds and spreads each pulse.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Overall pulse', tex:'\\mu\\,p(t)=g(t)*h(t)*c(t)\\quad\\Longleftrightarrow\\quad\\mu\\,P(f)=G(f)\\,H(f)\\,C(f)',
        note:'The three filters act on a pulse as one filter. $p(t)$ is scaled so that $p(0)=1$, and $\\mu$ carries the gain.'}]},
    {t:'reveal', at:3, items:[
      {t:'eq', label:'Receive-filter output', tex:'y(t)=\\mu\\sum_k a_k\\,p(t-kT_b)+n(t)',
        note:'One copy of $p(t)$ for each bit, signed by $a_k$. $n(t)=w(t)*c(t)$ is the noise after the receive filter.'}]}
  ]}
]},

{ id:'m2-isi-tx', module:'M2', nav:'From bits to pulses', title:'From bits to pulses',
  objective:'Build the transmitted signal from the bits: map each bit to an amplitude and send one pulse per bit.',
  keywords:'polar nrz signalling amplitude a_k transmit filter g(t) pulse train transmitted signal s(t)',
  src:'CH8 s.35', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'From bits to pulses'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['the bits','amplitudes $a_k$','one pulse each','their sum $s(t)$'], ms:1300},
      svg:figIsiTx,
      caption:'Step through the frames. Each bit becomes a stem of height $\\pm1$, each stem stamps one copy of $g(t)$ into its slot, and the copies add up to $s(t)$.'}
  ], right:[
    {t:'eq', label:'Polar NRZ', tex:'a_k=\\begin{cases}+1, & b_k=1\\\\-1, & b_k=0\\end{cases}',
      note:'Each bit sets the sign of one pulse. NRZ means the level holds for the whole bit and does not return to zero.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Transmitted signal', tex:'s(t)=\\sum_k a_k\\,g(t-kT_b)',
        note:'Here $g(t)$ is a rectangle of height $1$ on $[0,T_b]$. The copies sit side by side and never overlap.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The bits $1\\,1\\,0\\,1\\,0\\,0$ are sent with this $g(t)$.<div class="nsep"></div>How many pulses are non-zero at any one time?',
        ask:{key:'m2-isi-tx', choices:['one','two','all six'], answer:0,
          why:'Each rectangle lasts exactly $T_b$, so only the pulse of the current bit is on.'}}]}
  ]}
]},

{ id:'m2-isi-channel', module:'M2', nav:'An ideal and a bandlimited channel', title:'An ideal and a bandlimited channel',
  objective:'Compute the channel output as a convolution, for an ideal channel and for a bandlimited RC channel.',
  keywords:'ideal channel flat frequency response bandlimited channel rc lowpass convolution flip slide multiply area smoothing pulse train',
  src:'CH8 s.35', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'An ideal and a bandlimited channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['ideal channel, $h(t)=\\delta(t)$','band-limited RC channel, $t=0$','$t=2T_b$','$t=4T_b$','the whole output'], ms:2200},
      svg:figIsiChannel,
      caption:'Step through the frames. The flipped response $h(t-u)$ slides along $s(u)$. The violet area under their product is $x(t)$. The first frame is the ideal channel and the rest use a band-limited RC channel with $BT_b=0.25$.'},
    {t:'legend', items:[['in','$s$',true],['h','$h(t-u)$'],['out','$x(t)$']], at:'tc-row'}
  ], right:[
    {t:'eq', label:'Channel output', tex:'x(t)=s(t)*h(t)=\\int_{-\\infty}^{\\infty}s(u)\\,h(t-u)\\,du',
      note:'Flip $h$, slide it to $t$, multiply by $s$ and take the area.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Ideal channel', tex:'H(f)=c\\quad\\Longrightarrow\\quad h(t)=c\\,\\delta(t),\\qquad x(t)=c\\,s(t)',
        note:'The impulse picks the single value $s(t)$, so the pulses keep their shape.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'RC channel', tex:'H(f)=\\frac{1}{1+jf/B},\\qquad h(t)=\\frac{1}{\\tau}e^{-t/\\tau}\\ (t\\ge0),\\qquad\\tau=\\frac{1}{2\\pi B}',
        note:'$B$ is the $3$ dB bandwidth. $h$ is spread over a few $\\tau$, so $x(t)$ averages $s$ over the recent past.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The ideal channel has $H(f)=0.5$.<div class="nsep"></div>What does it put out for $s(t)$?',
        ask:{key:'m2-isi-channel', choices:['$0.5\\,s(t)$','$s(t)$ with rounded edges','$s(t-0.5)$'], answer:0,
          why:'A flat $H(f)=c$ is $h(t)=c\\,\\delta(t)$, and convolving with it only scales: $x(t)=0.5\\,s(t)$.'}}]}
  ]}
]},

{ id:'m2-isi', module:'M2', nav:'Intersymbol interference', title:'Intersymbol interference',
  objective:'Show how a bandlimited channel spreads each bit into the next ones, and name the overlap intersymbol interference.',
  keywords:'intersymbol interference bandlimited channel rc lowpass time constant pulse spreading tail overlap neighbour',
  src:'CH8 s.35–37', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'Intersymbol interference'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['one bit','its response','six responses','their sum'], ms:1500},
      svg:figIsiBuild,
      caption:'Step through the frames. An RC channel with $BT_b=0.25$ stretches each bit, and the red tail reaches into the next bits. The received waveform is the sum of all the responses.'},
    {t:'legend', items:[['in','sent'],['out','received'],['mid','one response each',true,2,3],['err','spill into later bits']], at:'tr'}
  ], right:[
    {t:'eq', label:'One bit', tex:'\\begin{aligned}r(t)&=1-e^{-t/\\tau},\\quad 0\\le t\\le T_b\\\\r(T_b)&=1-q,\\qquad q=e^{-T_b/\\tau}=e^{-2\\pi BT_b}\\end{aligned}',
      note:'The response of a unit bit on $[0,T_b]$. It never reaches $1$ inside the bit, and it decays after it.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Intersymbol interference', html:'A pulse spread beyond its own bit overlaps its neighbours at their sampling instants. That overlap is <b>intersymbol interference</b> (ISI): one symbol interferes with the symbols after it.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The channel has $BT_b=0.25$.<div class="nsep"></div>What fraction of its own level does a bit reach by the end of the bit?',
        ask:{key:'m2-isi', choices:['$0.208$','$0.792$','$1$'], answer:1,
          why:'$q=e^{-2\\pi(0.25)}=e^{-\\pi/2}=0.208$, so $r(T_b)=1-q=0.792$.'}}]}
  ]}
]},

{ id:'m2-isi-sample', module:'M2', nav:'The three parts of a sample', title:'The three parts of a sample',
  objective:'Split a sample of the receive-filter output into its own bit, the interference of the other bits, and noise.',
  keywords:'sample y(t_i) desired output intersymbol interference term noise sample overall pulse p((i-k)T_b) waterfall',
  src:'CH8 s.36', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'The three parts of a sample'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['the received sample','own pulse','the other pulses','noise'], ms:1300},
      live:{controls:[{k:'bt', label:'$BT_b$', min:0.08, max:1, step:0.01, v:0.25, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figIsiSample,
      caption:'The bits $0\\,1\\,0\\,1\\,1$ through the RC channel, sampled at the end of the last bit. The bars add the parts tip to tail. The percentages are each part\'s share of their total size. Drag $BT_b$: a narrower channel shrinks the own bit and grows the interference.'},
    {t:'legend', items:[['out','received'],['mid','own pulse',false,1],['err','other pulses',true,2]], at:'tc-row'}
  ], right:[
    {t:'eq', label:'Sampled output', tex:'\\begin{aligned}y(t_i)&=\\underbrace{\\mu\\,a_i}_{\\text{own bit}}+\\underbrace{\\mu\\sum_{k\\ne i}a_k\\,p\\bigl((i-k)T_b\\bigr)}_{\\text{intersymbol interference}}\\\\&\\quad+\\underbrace{n(t_i)}_{\\text{noise}}\\end{aligned}',
      note:'Sample at $t_i=iT_b$. Since $p(0)=1$, the own bit gives $\\mu a_i$. Every other bit adds the value of its pulse at $t_i$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'RC channel', tex:'\\mu=1-q,\\qquad p(mT_b)=\\begin{cases}q^{m}, & m\\ge0\\\\0, & m<0\\end{cases}',
        note:'With the sample at the end of each bit. The channel is causal, so only earlier bits interfere.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$BT_b=0.25$, $a_i=+1$ and $a_{i-1}=+1$.<div class="nsep"></div>How much does the previous bit add to $y(t_i)$?',
        ask:{key:'m2-isi-sample', choices:['$+0.165$','$-0.165$','$+0.792$'], answer:0,
          why:'$\\mu\\,a_{i-1}\\,p(T_b)=(1-q)\\,q=0.792\\times0.208=0.165$.'}}]}
  ]}
]},

{ id:'m2-eye', module:'M2', nav:'The eye diagram', title:'The eye diagram',
  objective:'Build the eye diagram by overlaying the received waveform and read its opening.',
  keywords:'eye diagram overlay traces opening sampling instant worst case pattern',
  src:'CH8 s.38–41', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'The eye diagram'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['eight patterns','$000$','$100$','$010$','$110$','$001$','$101$','$011$','$111$'], ms:1400},
      svg:figEyePatterns,
      caption:'Step through the frames. Each pattern of three bits passes through the RC channel with $BT_b=0.3$. The window $2T_b$ wide around $t_k$ cuts one piece, and the piece is laid on the eye. The line before a pattern sits at the level of its first bit.'},
    {t:'legend', items:[['out','pieces laid'],['mid','the piece just added']], at:'tc-row'}
  ], right:[
    {t:'note', kind:'def', head:'Eye diagram', html:'Cut the received waveform into pieces $2T_b$ long, centred on the sampling instants $t_k$, and draw them on one axis. An oscilloscope triggered by the bit clock does this.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'One piece, one pattern', html:'A piece holds the bit sampled at $t_k$, the bit after it and the tail of the bit before. Three bits give eight patterns, and the eight pieces together show the best and the worst case.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The channel is made wider, so $BT_b$ grows.<div class="nsep"></div>What happens to the band of traces at $t-t_k=0$?',
        ask:{key:'m2-eye', choices:['it gets thinner','it gets thicker','it does not change'], answer:0,
          why:'A wider channel leaves smaller tails $q=e^{-2\\pi BT_b}$, so the levels at the sampling instant spread less.'}}]}
  ]}
]},

{ id:'m2-eye-read', module:'M2', nav:'Reading the eye', title:'Reading the eye',
  objective:'Read the sampling time, the noise margin, the distortion and the timing sensitivity off an eye diagram.',
  keywords:'eye diagram interpretation best sampling time margin over noise distortion zero crossing jitter slope timing error opening',
  src:'CH8 s.39', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'Reading the eye'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['the eye','best sampling time','margin over noise','distortion at $t=0$','zero crossings','timing sensitivity'], ms:1100},
      svg:figEyeRead,
      caption:'Step through the frames. Each frame adds one reading to the eye of the RC channel with $BT_b=0.3$, built from $128$ bit patterns.'}
  ], right:[
    {t:'eq', label:'Opening', tex:'\\min_{\\text{patterns}}|y_k|=(1-q)-q=1-2q,\\qquad\\text{opening}=2(1-2q)',
      note:'The vertical gap at the best sampling time. It is the margin left for noise. The worst pattern has every earlier bit opposite to the current one.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Timing', html:'A steep side of the eye means a small timing error costs a lot of margin. The spread of the zero crossings is the timing jitter that the bit clock must tolerate.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The RC channel has $BT_b=0.3$.<div class="nsep"></div>What is the eye opening at the sampling instant?',
        ask:{key:'m2-eye-read', choices:['$0.70$','$1.39$','$1.70$'], answer:1,
          why:'$q=e^{-0.6\\pi}=0.152$, so $2(1-2q)=2(0.696)=1.39$.'}}]}
  ]}
]},

{ id:'m2-eye-close', module:'M2', nav:'Eye closure', title:'Eye closure',
  objective:'Find the bandwidth at which the eye closes and decisions fail without noise.',
  keywords:'eye closure bandwidth ln2 2pi 0.110 noise margin decision errors without noise',
  src:'CH8 s.38–41', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'Eye closure'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'bt', label:'$BT_b$', min:0.08, max:0.6, step:0.01, v:0.3, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figEyeLive,
      caption:'Drag $BT_b$. A narrower channel closes the eye. Below $BT_b=0.110$ some patterns cross zero at the sampling instant.'}
  ], right:[
    {t:'eq', label:'Closure', key:true, result:true, tex:'\\begin{aligned}1-2q&=0\\\\e^{-2\\pi BT_b}&=\\tfrac12\\\\BT_b&=\\frac{\\ln2}{2\\pi}=0.110\\end{aligned}',
      note:'Set the opening to zero and take logarithms.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Noise margin', html:'Noise must move a sample by more than $1-2q$ to cause an error. A half-closed eye halves the margin, which costs $6$ dB of SNR.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use the worst pattern, not a typical one. A random stream may run for a long time before it shows the pattern that closes the eye.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The RC channel has $BT_b=0.1$.<div class="nsep"></div>Is the eye open or closed?',
        ask:{key:'m2-eye-close', choices:['open','closed'], answer:1,
          why:'$q=e^{-0.2\\pi}=0.533>0.5$, so $1-2q=-0.067<0$: the eye is closed.'}}]}
  ]}
]},

REAL_ISI,

{ id:'m2-lab-q', module:'M2', nav:'Laboratory {lab} · Intersymbol interference', title:'Laboratory {lab} · Intersymbol interference',
  objective:'Narrow the channel and move the sampling instant, and read the interference.',
  keywords:'laboratory intersymbol interference bandlimited channel eye diagram sampling instant interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'Laboratory {lab} · Intersymbol interference'},
  {t:'lede', text:'Narrow the channel and move the sampling instant. Read the interference and watch the eye close.'},
  {t:'lab', id:'Q'}
]},

{ id:'m2-code-isi', module:'M2', nav:'Code · Intersymbol interference', title:'Intersymbol interference in code',
  objective:'Compute the interference taps of an RC channel, draw its eye and find where the eye closes.',
  keywords:'code matlab python program run intersymbol interference rc channel taps eye diagram bandwidth',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference in code'},
  {t:'title', text:'Intersymbol interference in code'},
  {t:'raw', html:()=>CODEBANK.page('m2-code-isi')}
]},

/* ---------------------------------------------------------------- 2.5 ---- */
{ id:'m2-nyq-sinc', module:'M2', nav:'Zero interference at the sampling instants', title:'Zero interference at the sampling instants',
  objective:'State the time-domain condition for zero intersymbol interference and what it leaves of a sample.',
  keywords:'nyquist criterion time domain zero intersymbol interference p((i-k)T_b) sampling instant own bit mu a_i high snr',
  src:'CH8 s.42', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Zero interference at the sampling instants'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['one pulse per bit','the sample at $t_i$','the other pulses at $t_i$','the sample $y(t_i)$'], ms:1600},
      svg:figNyqZero,
      caption:'Step through the frames. Five bits sent with a pulse that is zero at every sampling instant but its own. At $t_i$ every other pulse passes through zero, so the sample is $\\mu a_i$.'},
    {t:'legend', items:[['out','$y(t)$'],['mid','$a_k\\,p(t-kT_b)$',true,0,0],['mid','own pulse',false,1],['err','other pulses',true,2]], at:'tr'}
  ], right:[
    {t:'eq', label:'Sampled output', tex:'y(t_i)=\\mu a_i+\\mu\\sum_{k\\ne i}a_k\\,p\\bigl((i-k)T_b\\bigr)+n(t_i)',
      note:'The own bit, the other bits and the noise. The middle term vanishes only if every other pulse is zero at $t_i$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Nyquist\'s criterion, time domain', key:true, result:true, tex:'p\\bigl((i-k)T_b\\bigr)=\\begin{cases}1, & i=k\\\\0, & i\\ne k\\end{cases}',
        note:'A pulse with this property adds nothing to the samples of its neighbours, however long it lasts.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Zero interference', tex:'y(t_i)=\\mu a_i+n(t_i)\\;\\cong\\;\\mu a_i',
        note:'For $i=k$, $p(0)=1$, so only the own bit is left. At high SNR, $|\\mu a_i|\\gg|n(t_i)|$, and the sample is $\\mu a_i$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$p(t)$ meets the criterion, $\\mu=1$, $a_i=-1$ and $n(t_i)=0.1$.<div class="nsep"></div>What is $y(t_i)$?',
        ask:{key:'m2-nyq-sinc', choices:['$-0.9$','$-1.1$','it depends on the other bits'], answer:0,
          why:'$y(t_i)=\\mu a_i+n(t_i)=-1+0.1=-0.9$. The other bits add nothing.'}}]}
  ]}
]},

{ id:'m2-nyq-sample', module:'M2', nav:'The sampled pulse', title:'The sampled pulse',
  objective:'Sample the pulse at the bit rate and write the spectrum of the sampled pulse as copies of P(f).',
  keywords:'sampled pulse impulse train p_delta(t) fourier transform replication copies P(f - nR_b) gaps narrow spectrum',
  src:'CH8 s.42', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The sampled pulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['the pulse $p(t)$','its samples $p(mT_b)$','the copies of $P(f)$','their sum $P_\\delta(f)$'], ms:1600},
      svg:figNyqSample,
      caption:'Step through the frames for $p(t)=\\operatorname{sinc}(0.7t/T_b)$, whose spectrum ends at $0.35R_b$. Its samples are not zero, and the copies of $P(f)$ leave gaps (red).'},
    {t:'legend', items:[['in','$p(t)$, $P(f)$'],['mid','sampled pulse',false,1]], at:'tr'}
  ], right:[
    {t:'eq', label:'Sampled pulse', tex:'p_\\delta(t)=\\sum_{m}p(mT_b)\\,\\delta(t-mT_b)',
      note:'Multiply $p(t)$ by an impulse train of period $T_b$. Each impulse carries one sample $p(mT_b)$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Its spectrum', tex:'p_\\delta(t)\\;\\overset{\\mathcal{F}}{\\longrightarrow}\\;P_\\delta(f)=\\frac{1}{T_b}\\sum_{n}P\\Bigl(f-n\\frac{1}{T_b}\\Bigr)',
        note:'The replication result of Module 1 with $f_s=1/T_b=R_b$: a copy of $P(f)$ every $R_b$, scaled by $1/T_b$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$P(f)=0$ for $|f|>0.35R_b$, and the copies sit every $R_b$.<div class="nsep"></div>Can $P_\\delta(f)$ be constant?',
        ask:{key:'m2-nyq-sample', choices:['yes','no, the copies leave gaps'], answer:1,
          why:'Each copy is $0.7R_b$ wide, so a gap of $R_b-0.7R_b=0.3R_b$ is left between neighbours, where $P_\\delta(f)=0$.'}}]}
  ]}
]},

{ id:'m2-nyquist', module:'M2', nav:'Nyquist\'s criterion in frequency', title:'Nyquist\'s criterion in frequency',
  objective:'Derive the frequency-domain form of Nyquist\'s criterion: the copies of P(f) spaced R_b apart add to a constant.',
  keywords:'nyquist criterion frequency domain sifting property P_delta(f) = 1 R_b sum P(f - nR_b) = 1 copies constant',
  src:'CH8 s.43', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Nyquist\'s criterion in frequency'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['a pulse with interference','zero interference','$P_\\delta(f)=1$'], ms:2000},
      svg:figNyqFreq,
      caption:'Step through the frames. As the samples $p(mT_b)$, $m\\ne0$, shrink to zero, $p_\\delta(t)$ becomes $\\delta(t)$ and the sum of the copies becomes flat.'},
    {t:'legend', items:[['in','$p(t)$, $P(f)$'],['mid','sampled pulse']], at:'tr'}
  ], right:[
    {t:'eq', label:'Fourier transform of $p_\\delta(t)$', tex:'P_\\delta(f)=\\int_{-\\infty}^{\\infty}\\overbrace{\\Bigl\\{\\sum_{m}p(mT_b)\\,\\delta(t-mT_b)\\Bigr\\}}^{=p_\\delta(t)}e^{-j2\\pi ft}\\,dt'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Zero interference', tex:'P_\\delta(f)=\\int_{-\\infty}^{\\infty}p(0)\\,\\delta(t)\\,e^{-j2\\pi ft}\\,dt=p(0)\\,e^{-j2\\pi f\\cdot0}=1',
        note:'With $m=i-k$, only $m=0$ is left. Sifting puts $t=0$ into the exponential, and $p(0)=1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Nyquist\'s criterion, frequency domain', key:true, result:true, tex:'R_b\\sum_{n}P(f-nR_b)=1,\\qquad R_b=\\frac{1}{T_b}',
        note:'Set the replication sum equal to $1$. The copies of $P(f)$ spaced $R_b$ apart add to the constant $T_b$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$P(f)=T_b(1-|f|/R_b)$ for $|f|<R_b$, a triangle.<div class="nsep"></div>Does it meet the criterion?',
        ask:{key:'m2-nyquist', choices:['yes','no'], answer:0,
          why:'Neighbouring triangles overlap, one rising as the other falls, so $R_b\\sum_nP(f-nR_b)=1$.'}}]}
  ]}
]},

{ id:'m2-nyq-channel', module:'M2', nav:'The ideal Nyquist channel', title:'The ideal Nyquist channel',
  objective:'Meet the criterion with the narrowest spectrum, a rectangle of width 2W, and find its pulse and the highest bit rate.',
  keywords:'ideal nyquist channel rectangular spectrum nyquist bandwidth W = R_b/2 sinc(2Wt) maximum rate 2W bits per second copies edge to edge',
  src:'CH8 s.44', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The ideal Nyquist channel'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$P(f)$ of height $T_b$','$p(t)=\\operatorname{sinc}(2Wt)$','zeros at $t=kT_b$','copies at $\\pm2W$'], ms:1500},
      svg:figNyqChannel,
      caption:'Step through the frames. The rectangle of width $2W$ is the narrowest spectrum that meets the criterion. Its pulse is zero at $t=kT_b$, $k\\ne0$, and its copies at $\\pm2W$ meet it edge to edge.'},
  ], right:[
    {t:'eq', label:'Ideal Nyquist channel', tex:'P(f)=\\begin{cases}\\dfrac{1}{2W}, & -W\\le f\\le W\\\\[4pt]0, & \\text{otherwise}\\end{cases}\\qquad W=\\frac{R_b}{2}=\\frac{1}{2T_b}',
      note:'$W$ is the <b>Nyquist bandwidth</b>. The height $1/(2W)$ equals $T_b$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Its pulse', tex:'p(t)=\\int_{-W}^{W}\\frac{1}{2W}\\,e^{j2\\pi ft}\\,df=\\frac{\\sin(2\\pi Wt)}{2\\pi Wt}=\\operatorname{sinc}(2Wt)',
        note:'Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$. Since $2W=1/T_b$, $p(kT_b)=\\operatorname{sinc}(k)=0$ for $k\\ne0$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Highest bit rate', key:true, result:true, tex:'R_b\\le2W\\quad\\Longleftrightarrow\\quad W\\ge\\frac{R_b}{2}',
        note:'A channel of bandwidth $W$ carries at most $2W$ bits per second without interference.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'A link sends $R_b=64$ kb/s.<div class="nsep"></div>What is the smallest bandwidth with zero interference?',
        ask:{key:'m2-nyq-channel', choices:['$32$ kHz','$64$ kHz','$128$ kHz'], answer:0,
          why:'$W=R_b/2=64/2=32$ kHz.'}}]}
  ]}
]},

{ id:'m2-sinc-timing', module:'M2', nav:'The ideal channel in practice', title:'The ideal channel in practice',
  objective:'Show why the ideal Nyquist channel is impractical: it cannot be built, and a small timing error collects interference from many neighbours.',
  keywords:'ideal nyquist channel impractical unrealizable abrupt transitions slow decay 1/t timing error jitter harmonic series raised cosine',
  src:'CH8 s.44', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The ideal channel in practice'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'eps', label:'$\\epsilon/T_b$', min:0, max:0.4, step:0.02, v:0.1, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figSincOffset,
      caption:'Drag the timing error $\\epsilon$. Above, each red stem is a neighbour\'s term in a sample taken $\\epsilon$ late. Below, the sum of their sizes as more neighbours are counted. It keeps growing for the sinc pulse, and levels off for a raised cosine with $\\alpha=0.5$.'},
    {t:'legend', items:[['in','$p(t)$'],['mid','wanted term'],['err','interference']], at:'tr'}
  ], right:[
    {t:'note', kind:'warn', head:'Impractical', html:'$P(f)$ jumps at $-W$ and $W$. No physical filter has such an abrupt edge.<div class="nsep"></div>$p(t)$ decays slowly, only as $1/|t|$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'A late sample', tex:'y(\\epsilon)=a_0\\operatorname{sinc}\\!\\left(\\frac{\\epsilon}{T_b}\\right)+\\sum_{k\\neq0}a_k\\operatorname{sinc}\\!\\left(k+\\frac{\\epsilon}{T_b}\\right)',
        note:'Sample bit $0$ at $t=\\epsilon$. Each neighbour adds a term up to $1/(\\pi|k|)$, and these add like $\\sum1/k$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Solution', html:'Exact timing is a major challenge in modem design, and some timing jitter is always left. A pulse with faster-decaying tails tolerates it: the <b>raised cosine</b>.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The sample is taken $\\epsilon=0.1T_b$ late.<div class="nsep"></div>What is the wanted term, $\\operatorname{sinc}(0.1)$?',
        ask:{key:'m2-sinc-timing', choices:['$0.984$','$0.9$','$0.5$'], answer:0,
          why:'$\\sin(0.1\\pi)/(0.1\\pi)=0.309/0.314=0.984$. The wanted term barely drops. The interference is the problem.'}}]}
  ]}
]},

{ id:'m2-rcos', module:'M2', nav:'The raised-cosine spectrum', title:'The raised-cosine spectrum',
  objective:'Build the raised-cosine spectrum from its flat part and its roll-off, and define the roll-off factor.',
  keywords:'raised cosine spectrum flat band f_1 roll off factor alpha = 1 - f_1/W transition 2W - f_1 odd symmetry half height',
  src:'CH8 s.46', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The raised-cosine spectrum'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['the ideal rectangle','flat up to $f_1$','roll-off to $2W-f_1$','odd symmetry about $W$'], ms:1800},
      svg:figRcBuild,
      caption:'Step through the frames for $\\alpha=0.5$. Below $W$ the roll-off cuts a piece from the rectangle (violet). Turned half a turn about $(W,T_b/2)$, it fills exactly the piece added above $W$.'},
  ], right:[
    {t:'eq', label:'Raised-cosine spectrum', tex:'P(f)=\\begin{cases}\\dfrac{1}{2W}, & 0\\le|f|\\le f_1\\\\[6pt]\\dfrac{1}{4W}\\Bigl\\{1-\\sin\\Bigl(\\dfrac{\\pi(|f|-W)}{2W-2f_1}\\Bigr)\\Bigr\\}, & f_1\\le|f|\\le2W-f_1\\\\[6pt]0, & \\text{otherwise}\\end{cases}',
      note:'The band grows from $W$ to between $W$ and $2W$, with rounded edges.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Roll-off factor', tex:'\\alpha=1-\\frac{f_1}{W},\\qquad f_1=W(1-\\alpha),\\qquad 2W-f_1=W(1+\\alpha)',
        note:'$\\alpha$ runs from $0$ to $1$. $\\alpha=0$ gives $f_1=W$, the ideal rectangle.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Half height at $W$', tex:'P(W)=\\frac{1}{4W}\\{1-\\sin0\\}=\\frac{1}{4W}=\\frac{T_b}{2}',
        note:'The roll-off is odd about this point. What it takes away below $W$ it adds above $W$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$R_b=10$ kb/s and $\\alpha=0.25$.<div class="nsep"></div>Where does the flat part end?',
        ask:{key:'m2-rcos', choices:['$3.75$ kHz','$5$ kHz','$6.25$ kHz'], answer:0,
          why:'$W=R_b/2=5$ kHz, so $f_1=W(1-\\alpha)=5(0.75)=3.75$ kHz.'}}]}
  ]}
]},

{ id:'m2-rcos-check', module:'M2', nav:'The copies add to a constant', title:'The copies add to a constant',
  objective:'Check that the raised cosine meets Nyquist\'s criterion: in each overlap the two roll-offs add to T_b.',
  keywords:'raised cosine nyquist criterion superposition copies P(f + 2W) P(f - 2W) overlap sum T_b flat',
  src:'CH8 s.48', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The copies add to a constant'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$P(f)$','$P(f+2W)$ and $P(f-2W)$','one frequency in the overlap','their sum'], ms:2000},
      svg:figRcCheck,
      caption:'Step through the frames for $\\alpha=0.5$. In each shaded overlap the falling edge of one copy and the rising edge of the next add to $T_b$, so the sum is flat.'},
  ], right:[
    {t:'eq', label:'Nyquist\'s criterion', tex:'R_b\\sum_{n}P(f-nR_b)=1\\quad\\Longleftrightarrow\\quad\\sum_{n}P(f-2nW)=T_b',
      note:'With $R_b=2W$ the copies sit every $2W$. Only two copies overlap at any frequency.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'In the overlap', tex:'\\begin{aligned}P(f)+P(f-2W)&=\\frac{1}{4W}\\{1-\\sin\\theta\\}+\\frac{1}{4W}\\{1+\\sin\\theta\\}\\\\&=\\frac{1}{2W}=T_b\\end{aligned}',
        note:'For $f_1\\le f\\le2W-f_1$, with $\\theta=\\pi(f-W)/(2W-2f_1)$. For the copy, $|f-2W|-W=-(f-W)$, so its sine changes sign.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\alpha=0.5$ and $P(0.8W)=0.794\\,T_b$.<div class="nsep"></div>What is $P(1.2W)$?',
        ask:{key:'m2-rcos-check', choices:['$0.206\\,T_b$','$0.794\\,T_b$','$0$'], answer:0,
          why:'$P(1.2W)=P(-1.2W)=P(0.8W-2W)$, and in the overlap $P(f)+P(f-2W)=T_b$. So $P(1.2W)=T_b-0.794\\,T_b=0.206\\,T_b$.'}}]}
  ]}
]},

{ id:'m2-rcos-pulse', module:'M2', nav:'The raised-cosine pulse', title:'The raised-cosine pulse',
  objective:'Write the raised-cosine pulse as a sinc factor that keeps the zeros and a second factor that speeds up the decay.',
  keywords:'raised cosine pulse inverse fourier transform sinc(2Wt) cos(2 pi alpha W t) 1 - 16 alpha^2 W^2 t^2 zero crossings faster decay 1/t^3',
  src:'CH8 s.46–47', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The raised-cosine pulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$\\operatorname{sinc}(2Wt)$','the second factor','their product $p(t)$','$\\alpha=0,\\ 0.5,\\ 1$'], ms:1600},
      svg:figRcPulse,
      caption:'Step through the frames. The product keeps every zero of $\\operatorname{sinc}(2Wt)$ at $t=kT_b$, and the second factor, drawn for $\\alpha=0.5$, damps the tails.'},
    {t:'legend', items:[['in','$\\operatorname{sinc}(2Wt)$',false,0,1],['mid','second factor',false,1,2],['in','$\\alpha=0.5$',false,2],['in','$\\alpha=0$',true,2],['mid','$\\alpha=1$',false,3]], at:'tr'}
  ], right:[
    {t:'eq', label:'Raised-cosine pulse', tex:'p(t)=\\mathcal{F}^{-1}\\{P(f)\\}=\\underbrace{\\operatorname{sinc}(2Wt)}_{\\text{zeros at }t_i=iT_b}\\;\\underbrace{\\frac{\\cos(2\\pi\\alpha Wt)}{1-16\\alpha^{2}W^{2}t^{2}}}_{\\text{faster decay}}',
      note:'Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$. Since $2W=1/T_b$, the sinc factor is zero at $t=kT_b$, $k\\ne0$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Faster decay', html:'For $\\alpha>0$ the second factor falls as $1/t^{2}$, so the tails fall as $1/|t|^{3}$, against $1/|t|$ for the sinc pulse. A timing error then collects little interference.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Common error', html:'Write $\\cos(2\\pi\\alpha Wt)$, not $\\cos(2\\pi\\alpha W)$. Without $t$ the factor is a constant and does nothing to the tails.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'The roll-off is $\\alpha=1$.<div class="nsep"></div>What is $p(1.5T_b)$?',
        ask:{key:'m2-rcos-pulse', choices:['$0$','$-0.21$','$0.5$'], answer:0,
          why:'$2\\pi\\alpha Wt=1.5\\pi$, so the cosine is $0$, and $1-16\\alpha^{2}W^{2}t^{2}=1-9=-8\\ne0$. So $p(1.5T_b)=0$.'}}]}
  ]}
]},

{ id:'m2-rcos-alpha', module:'M2', nav:'Choosing the roll-off', title:'Choosing the roll-off',
  objective:'Read the passband, transition band and transmission bandwidth of the raised cosine, and trade bandwidth against tail decay.',
  keywords:'roll off factor alpha transmission bandwidth B_T = (1 + alpha) W excess bandwidth alpha W passband transition band stop band tails filter design',
  src:'CH8 s.47', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Choosing the roll-off'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'al', label:'$\\alpha$', min:0, max:1, step:0.05, v:0.5, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figRcAlpha,
      caption:'Drag $\\alpha$. The strip names the bands of $P(f)$. A larger $\\alpha$ widens the transition band and $B_T$, and the tails of $p(t)$ beyond $|t|=2T_b$ (shaded) shrink.'},
  ], right:[
    {t:'eq', label:'Transmission bandwidth', key:true, result:true, tex:'B_T=2W-f_1=W(1+\\alpha)=\\frac{R_b}{2}(1+\\alpha)',
      note:'The <b>passband</b> ends at $f_1$, the <b>transition band</b> runs from $f_1$ to $B_T$, and the <b>stop band</b> starts at $B_T$. The bandwidth beyond $W$ is $\\alpha W$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'As $\\alpha$ increases', html:'The tails of $p(t)$ decay faster.<br>The bandwidth $B_T$ grows.<br>The filter is easier to design, since its edges are gentler.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$W=5$ kHz and $\\alpha=0.25$.<div class="nsep"></div>What is $B_T$?',
        ask:{key:'m2-rcos-alpha', choices:['$5$ kHz','$6.25$ kHz','$10$ kHz'], answer:1,
          why:'$B_T=W(1+\\alpha)=5(1.25)=6.25$ kHz.'}}]}
  ]}
]},

{ id:'m2-ex-rc', module:'M2', nav:'Worked example · a raised-cosine link', title:'Worked example: a raised-cosine link',
  objective:'Find the Nyquist bandwidth, the flat band and the transmission bandwidth of a raised-cosine link.',
  keywords:'worked example raised cosine 20 kb/s roll off 0.5 bandwidth 15 kHz sketch spectrum',
  src:'CH8 s.46–47', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Worked example'},
  {t:'title', text:'Worked example: a raised-cosine link'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Sketch $P(f)/T_b$ on the axes, then check it.'}, svg:figExRc,
      caption:'The dashed trace is the ideal rectangle of width $2W$. Draw the raised-cosine spectrum with $\\alpha=0.5$, then show the answer.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'A link sends $R_b=20$ kb/s with raised-cosine pulses and $\\alpha=0.5$.<div class="nsep"></div>Find $W$, $f_1$ and $B_T$.',
      ask:{key:'m2-ex-rc', choices:['$10$ kHz','$15$ kHz','$20$ kHz'], answer:1,
        why:'$W=10$ kHz, so $B_T=W(1+\\alpha)=10(1.5)=15$ kHz.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'W=\\frac{R_b}{2},\\qquad f_1=W(1-\\alpha),\\qquad B_T=2W-f_1=W(1+\\alpha)',
        note:'The spectrum is flat up to $f_1$ and falls to zero at $B_T$, with its half-height point at $W$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}W&=20/2=10\\ \\text{kHz}\\\\f_1&=10(1-0.5)=5\\ \\text{kHz}\\\\B_T&=10(1+0.5)=15\\ \\text{kHz}\\end{aligned}',
        note:'Check: $B_T-W=W-f_1=5$ kHz, so the roll-off is symmetric about $W$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $W=R_b/2=10$ kHz, not $R_b=20$ kHz. The wrong $W$ gives $B_T=30$ kHz, twice the true value.'}]}
  ]}
]},

{ id:'m2-srrc', module:'M2', nav:'Splitting the filter', title:'Splitting the raised cosine',
  objective:'Split the raised cosine into a square-root filter at each end, so the receive filter is also matched.',
  keywords:'square root raised cosine srrc split transmit receive filter matched filter zero isi fir tapped delay line',
  src:'CH8 s.48', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Splitting the raised cosine'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['the raised cosine $P(f)$','its square root','one root at each end','their product'], ms:1600},
      svg:figSrrc,
      caption:'Step through the frames for $\\alpha=0.5$. Each end of the link takes a square-root raised cosine. Over a flat channel their product is the raised cosine again.'},
  ], right:[
    {t:'eq', label:'Split', tex:'H_T(f)\\,H_R(f)=P(f),\\qquad H_T(f)=H_R(f)=\\sqrt{P(f)}',
      note:'$H_T$ shapes the pulse at the transmitter and $H_R$ filters at the receiver. Each is a <b>square-root raised-cosine</b> (SRRC) filter.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Matched and free of interference', html:'$H_R=H_T^{*}$ for a real, even $\\sqrt{P(f)}$, so the receive filter is matched to the pulse. The link then has both the smallest $P_b$ and zero interference.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Implementation', html:'A raised-cosine or SRRC filter is usually a finite impulse response (FIR) filter, also called a tapped-delay-line (TDL) filter. Its taps are samples of the pulse, cut off after a few $T_b$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\alpha=0.5$.<div class="nsep"></div>What is $H_T(W)/H_T(0)$?',
        ask:{key:'m2-srrc', choices:['$0.5$','$0.707$','$1$'], answer:1,
          why:'$P(W)=T_b/2$ and $P(0)=T_b$, so $H_T(W)/H_T(0)=\\sqrt{1/2}=0.707$.'}}]}
  ]}
]},

REAL_NYQUIST,

{ id:'m2-lab-e', module:'M2', nav:'Laboratory {lab} · The raised-cosine eye', title:'Laboratory {lab} · The raised-cosine eye',
  objective:'Change the roll-off, the timing offset and the noise, and read the margin.',
  keywords:'laboratory raised cosine eye diagram roll off timing offset noise margin interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Laboratory {lab} · The raised-cosine eye'},
  {t:'lede', text:'Change the roll-off, the timing offset and the noise. Compare the eye opening with the bandwidth it costs.'},
  {t:'lab', id:'E'}
]},

{ id:'m2-code-nyquist', module:'M2', nav:'Code · Nyquist and the raised cosine', title:'Nyquist and the raised cosine in code',
  objective:'Test Nyquist\'s criterion numerically, check the zeros of the raised-cosine pulse and find the fastest rate in a fixed band.',
  keywords:'code matlab python program run nyquist criterion tiling raised cosine zero crossings bandwidth',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine in code'},
  {t:'title', text:'Nyquist and the raised cosine in code'},
  {t:'raw', html:()=>CODEBANK.page('m2-code-nyquist')}
]},

/* ---------------------------------------------------------------- 2.6 ---- */
{ id:'m2-chain', module:'M2', nav:'From bits to decisions', title:'From bits to decisions',
  objective:'Follow eight bits through the whole link: pulse, noise, demodulator and decision.',
  keywords:'chain transmitter channel noise demodulator integrate and dump decision error review frames',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Summary'},
  {t:'title', text:'From bits to decisions'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['bits','$s(t)$','$x(t)$','$y_k$','decisions']},
      svg:figChain,
      caption:'Step through the stages. Each bit becomes $\\pm A$, noise is added, the correlator gives one number a bit, and its sign is the decision. The second decision is wrong.'}
  ], right:[
    {t:'note', kind:'def', head:'Four stages', html:'<ol class="steps"><li>Send each bit as $\\pm\\sqrt{E_b}\\,\\psi(t)$.</li><li>The channel adds white noise of density $N_0/2$.</li><li>Correlate with $\\psi(t)$ and read $y_k$ at the end of the bit.</li><li>Decide by comparing $y_k$ with $\\lambda_{\\mathrm{opt}}$.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Two limits', html:'Noise sets $P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. Bandwidth sets $R_b\\le2B_T/(1+\\alpha)$ for zero interference.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A polar link runs at $E_b/N_0=9.6$ dB with equal priors.<div class="nsep"></div>About what is $P_b$?',
        ask:{key:'m2-chain', choices:['$10^{-3}$','$10^{-5}$','$10^{-7}$'], answer:1,
          why:'$E_b/N_0=10^{0.96}=9.12$, so $P_b=Q(\\sqrt{18.2})=Q(4.27)=9.7\\times10^{-6}$.'}}]}
  ]}
]},

{ id:'m2-quick', module:'M2', nav:'Quick check', title:'Quick check',
  objective:'Check the module ideas with six short predictions.',
  keywords:'quick check predict matched filter peak snr threshold error probability intersymbol interference nyquist bandwidth',
  budget:'a set of six prediction cards. The questions carry no figure',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Quick check'},
  {t:'title', text:'Quick check'},
  {t:'grid', cols:3, gap:'22px 20px', style:'flex:1;grid-auto-rows:1fr;padding-bottom:8px', items:[
    [{t:'note', kind:'def', head:'Matched filter', html:'The filter matched to $s(t)$ on $[0,T]$ has the impulse response',
      ask:{key:'m2-qc0', choices:['$s(t)$','$s(T-t)$','$s(t-T)$'], answer:1,
        why:'Reverse the pulse in time, then shift it right by $T$.'}}],
    [{t:'note', kind:'def', head:'Peak SNR', html:'$E=2\\ \\mu$J and $N_0=10^{-7}$ W/Hz. The largest peak SNR is',
      ask:{key:'m2-qc1', choices:['$20$','$40$','$80$'], answer:1,
        why:'$2E/N_0=2(2\\times10^{-6})/10^{-7}=40$.'}}],
    [{t:'note', kind:'def', head:'Threshold', html:'With equal priors, the optimal threshold is',
      ask:{key:'m2-qc2', choices:['$0$','$N_0/4$','$\\sqrt{E_b}$'], answer:0,
        why:'$\\ln(p_0/p_1)=\\ln1=0$.'}}],
    [{t:'note', kind:'def', head:'Error probability', html:'$E_b/N_0$ rises from $4$ to $8$. $P_b$ falls from $2.3\\times10^{-3}$ to',
      ask:{key:'m2-qc3', choices:['$1.2\\times10^{-3}$','$3.2\\times10^{-5}$','$10^{-9}$'], answer:1,
        why:'$Q(\\sqrt{16})=Q(4)=3.2\\times10^{-5}$.'}}],
    [{t:'note', kind:'def', head:'Interference', html:'An RC channel has $BT_b=0.25$. The worst-case total interference $q$ is',
      ask:{key:'m2-qc4', choices:['$0.208$','$0.5$','$0.792$'], answer:0,
        why:'$q=e^{-2\\pi(0.25)}=e^{-\\pi/2}=0.208$.'}}],
    [{t:'note', kind:'def', head:'Bandwidth', html:'$R_b=1$ Mb/s with a raised cosine of $\\alpha=0.5$ needs $B_T=$',
      ask:{key:'m2-qc5', choices:['$0.5$ MHz','$0.75$ MHz','$1$ MHz'], answer:1,
        why:'$B_T=\\tfrac{R_b}{2}(1+\\alpha)=0.5(1.5)=0.75$ MHz.'}}]
  ]}
]},

{ id:'m2-synth', module:'M2', nav:'Summary', title:'Module 2 summary',
  objective:'Collect the results this module contributes to the rest of the course.',
  keywords:'summary matched filter correlator threshold error probability Q function intersymbol interference eye nyquist raised cosine recall',
  dark:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 2 · Summary'},
  {t:'title', text:'Module 2 summary'},
  /* Fourteen results as prompts, in the order of the module: the student answers
     each one aloud, then opens the card. */
  {t:'raw', html:()=>RECALL.deck('m2', [
    {q:'What is white noise?', glyph:G.white,
     a:'Noise with $S_W(f)=N_0/2$ at every $f$, so $R_W(\\tau)=\\frac{N_0}{2}\\delta(\\tau)$: values at different times are uncorrelated.'},
    {q:'What does a filter do to a random signal?', glyph:G.filt,
     a:'$S_Y(f)=|H(f)|^{2}S_X(f)$. White noise then has power $P_Y=\\frac{N_0}{2}\\int|H(f)|^{2}df=N_0B_{\\text{neq}}H_{\\max}^{2}$.'},
    {q:'Which filter gives the largest peak SNR?', glyph:G.mf,
     a:'The <b>matched filter</b> $h(t)=k\\,g(T-t)$, or $H(f)=k\\,G^{*}(f)\\,e^{-j2\\pi fT}$, sampled at $t=T$.'},
    {q:'What is that largest peak SNR?', glyph:G.snr,
     a:'$\\eta_{\\max}=2E/N_0$. It depends on the pulse energy $E$, not on its shape.'},
    {q:'Where do the two symbols of polar signalling sit?', glyph:G.space,
     a:'At $\\pm\\sqrt{E_b}$ on the axis of the unit-energy $\\psi(t)$, a distance $2\\sqrt{E_b}$ apart.'},
    {q:'When do the correlator and the matched filter agree?', glyph:G.corr,
     a:'At $t=T_b$: both give $\\int_0^{T_b}x(t)\\,\\psi(t)\\,dt$, for any shape of $\\psi$.'},
    {q:'What noise is left in the demodulator output?', glyph:G.noise,
     a:'$y=s_m+n$, with $n$ Gaussian of mean $0$ and variance $N_0/2$.'},
    {q:'Where does the optimal threshold go?', glyph:G.thresh,
     a:'$\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}$: at $0$ for equal priors, toward the less likely symbol otherwise.'},
    {q:'What is $Q(x)$?', glyph:G.q,
     a:'The Gaussian tail $Q(x)$: the chance that a unit Gaussian exceeds $x$.'},
    {q:'What is $P_b$ for polar signalling?', glyph:G.pb,
     a:'$P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ with equal priors and a matched filter.'},
    {q:'How much interference does an RC channel add?', glyph:G.isi,
     a:'A bit $m$ bits back adds $(1-q)q^{m}$, with $q=e^{-2\\pi BT_b}$. The worst case totals $q$.'},
    {q:'When does the eye close?', glyph:G.eye,
     a:'The opening is $2(1-2q)$. It closes at $BT_b=\\ln2/(2\\pi)=0.110$, and errors then occur without noise.'},
    {q:'What is Nyquist\'s criterion?', glyph:G.nyq,
     a:'$p(kT_b)=\\delta[k]$ exactly when $\\sum_nP(f-nR_b)=T_b$. It needs $B_T\\ge R_b/2$.'},
    {q:'What bandwidth does a raised cosine need?', glyph:G.rc,
     a:'$B_T=\\tfrac{R_b}{2}(1+\\alpha)$. The tails fall as $1/|t|^{3}$ for $\\alpha>0$.'}
  ], {cols:2})},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Method', html:'<span style="color:var(--graphite)">Match the filter to the pulse and read it at the end of the bit. Place the threshold from the priors. Check $B_T$ against $R_b/2$ before choosing a pulse. Module 3 extends these steps to more than two waveforms.</span>'}]}
]},

/* Four optional projects for students who want to try the module on their own
   computer. They carry no grade and no code: each card gives an aim, what it
   practises, a few steps and what to look for. The briefs state no numerical
   answer, so they need no line in verify/. */
{ id:'m2-projects', module:'M2', nav:'Projects to try', title:'Projects to try',
  objective:'Offer four optional projects that use the module on simulated links.',
  keywords:'projects matlab python bit error rate simulation matched filter correlation echo eye diagram cable raised cosine timing',
  dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Projects'},
  {t:'title', text:'Projects to try'},
  {t:'raw', html:()=>PROJECTS.deck('m2', [
    {title:'Measure a bit error rate', glyph:G.pb,
     aim:'Simulate a polar link and compare the measured error rate with $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.',
     learn:['The correlator receiver and its decision statistic.',
            'Setting the noise variance from $E_b/N_0$.',
            'How many bits a reliable estimate of $P_b$ needs.'],
     steps:['Draw $10^{6}$ random bits and map them to $\\pm1$.',
            'Add Gaussian noise of variance $N_0/2$ for $E_b/N_0$ from $0$ to $10$ dB.',
            'Decide by the sign of each value and count the errors.',
            'Plot the measured $P_b$ on a logarithmic axis with the $Q$ curve over it.'],
     look:'The points lie on the curve until the error count gets small. There they scatter, because too few errors were seen.'},
    {title:'Find an echo in noise', glyph:G.mf,
     aim:'Hide a known pulse in strong noise and find its delay with a matched filter.',
     learn:['Correlation with a template.',
            'Why a long pulse with a wide bandwidth gives a sharp peak.',
            'Reading a delay from the peak position.'],
     steps:['Make a chirp of $1000$ samples that sweeps a wide band.',
            'Place it at an unknown delay inside $10\\,000$ samples of noise that hides it.',
            'Correlate the record with the chirp and find the largest peak.',
            'Repeat with a plain rectangular pulse of the same energy.'],
     look:'The chirp gives one narrow peak at the true delay. The rectangle gives a broad triangle whose top is hard to place in noise.'},
    {title:'Draw the eye of a cable', glyph:G.eye,
     aim:'Send random bits through a lowpass channel and watch the eye close as the bandwidth falls.',
     learn:['Intersymbol interference from a bandlimited channel.',
            'The eye diagram as an overlay of short pieces.',
            'The link between eye opening and error rate.'],
     steps:['Build an RC lowpass with time constant $\\tau=1/(2\\pi B)$.',
            'Pass $2000$ random polar bits through it at $BT_b=0.5$, $0.25$ and $0.12$.',
            'Cut the output into pieces $2T_b$ long around each sample and plot them together.',
            'Add a little noise and count the errors at each bandwidth.'],
     look:'The eye narrows as $BT_b$ falls and is nearly shut near $0.11$. The error count jumps once the eye closes.'},
    {title:'Shape pulses with a raised cosine', glyph:G.rc,
     aim:'Compare the sinc pulse with raised-cosine pulses in bandwidth and in sensitivity to timing.',
     learn:['The raised-cosine pulse and its roll-off $\\alpha$.',
            'The spectrum of a pulse train.',
            'Why a small $\\alpha$ needs a precise clock.'],
     steps:['Build raised-cosine pulses with $\\alpha=0$, $0.25$ and $0.5$, truncated to $\\pm8T_b$.',
            'Send random polar bits with each and plot the spectrum of the result.',
            'Sample the received train slightly late, by $0.05T_b$ to $0.3T_b$.',
            'Plot the eye for each $\\alpha$ at each timing error.'],
     look:'A larger $\\alpha$ widens the spectrum. It also keeps the eye open for a larger timing error.'}
  ])}
]}

];

window.SCENES_M2 = SC;
})();
