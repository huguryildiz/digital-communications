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
  const a = P.Axes({w:520,h:130,xr:[0,10],yr:[-1.6,1.6],grid:false,
    xlabel:'t/T_b', ylabel:'s(t)', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3});
  a.curve(openS, {color:T_CY, width:2.4, n:2000, anim:{delay:0, sweep:'#D9F3F7'}});
  OPEN_B.forEach((b,k)=>a.note(k+0.5, 1.32, String(b), {fs:14, color:'#9EACB9', anchor:'middle'}));
  return a.svg();
}
function figOpenRx(){
  const a = P.Axes({w:520,h:130,xr:[0,10],yr:[-2.6,2.6],grid:false,
    xlabel:'t/T_b', ylabel:'x(t)', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3});
  a.curve(t=>openS(t)+OPEN_W(t), {color:T_GR, width:1.6, n:2000, anim:{delay:0.5}});
  return a.svg();
}
function figOpenDecide(){
  const a = P.Axes({w:520,h:130,xr:[0,10],yr:[-1.9,1.9],grid:false,
    xlabel:'t/T_b', ylabel:'y_k', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xstep:2, ytarget:3});
  a.hline(0, {color:'rgba(239,231,216,.30)', dash:'4 5'});
  a.stem(OPEN_B.map((_,k)=>[k+1, openY(k)]), {color:T_VI, anim:{delay:1.2, step:0.09, tip:true}});
  OPEN_B.forEach((_,k)=>{ const d = openY(k) > 0 ? 1 : 0;
    a.note(k+1, 1.58, String(d), {fs:14, color:d===OPEN_B[k] ? T_GR : T_RD, anchor:'middle', weight:600}); });
  return a.svg();
}

/* ---- 2.1 the matched filter ---------------------------------------------- */

/* The receiver: the pulse, the noise added to it, one linear filter, and one
   sample at the end of the bit. Under it, what reaches the filter: the pulse
   of one bit and the same pulse with white noise on it. */
const RX_W = noiseFn(7, 0.012, 0.5, -1, 4);
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
  const a = P.Axes({w:560,h:250,xr:[-0.2,1.4],yr:[-1.2,2.6],xlabel:'t/T',ylabel:'x(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,0.5,1],ytarget:3});
  a.curve(t=>(t>=0&&t<=1?1:0)+RX_W(t), {color:C.out, width:1.5, n:900});
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[1.4,0]], {color:C.in, width:2.4});
  return stack(560, [[top,150],[a.svg(),250]]);
}

/* The output of a filter matched to a unit rectangle: the signal part g0(t)
   and a band one standard deviation of the output noise wide around it. One
   noisy output is drawn thin. The sample at t = T sees g0(T) and that noise. */
const SNR_N = noiseFn(11, 0.06, 0.16, -1, 4);
function figSnr(){
  const s = 0.16, g0 = t => t<0 ? 0 : t<1 ? t : t<2 ? 2-t : 0;
  const a = P.Axes(SZ({xr:[0,2.3], yr:[-0.45,1.45], xlabel:'t/T', ylabel:'y(t)',
    xticksOverride:[0,0.5,1,1.5,2], ytarget:4}));
  const pts = []; for(let i=0;i<=230;i++){ const t = 2.3*i/230; pts.push([a.sx(t), a.sy(g0(t)+s)]); }
  for(let i=230;i>=0;i--){ const t = 2.3*i/230; pts.push([a.sx(t), a.sy(g0(t)-s)]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(t=>g0(t)+SNR_N(t), {color:C.mid, width:1.2, opacity:0.35, n:900});
  a.curve(g0, {color:C.mid, width:2.6});
  a.vline(1, {color:C.muted});
  a.point(1, 1, {color:C.mid, r:5});
  a.note(1.06, 1.24, 'g_0(T)', {tex:true, fs:15, color:C.mid});
  a.poly([[1.55,0.45-s],[1.55,0.45+s]], {color:C.muted, width:1.6});
  a.poly([[1.52,0.45+s],[1.58,0.45+s]], {color:C.muted, width:1.6});
  a.poly([[1.52,0.45-s],[1.58,0.45-s]], {color:C.muted, width:1.6});
  a.note(1.62, 0.64, '\\pm\\sqrt{E[n^{2}]}', {tex:true, fs:14, color:C.muted});
  return a.svg();
}

/* Schwarz's inequality under a slider. The signal spectrum |G(f)| is a
   Gaussian of unit width and the filter |H(f)| one of width b. With the
   phases matched, the output SNR as a fraction of the bound is
   (int GH)^2/(int G^2 int H^2) = 2b/(1+b^2), which is 1 only at b = 1. */
const schwarzRatio = b => 2*b/(1+b*b);
function figSchwarz(v){
  const b = v && v.b!=null ? v.b : 1;
  const a = P.Axes(SZ({xr:[-3.2,3.2], yr:[-0.08,1.3], xlabel:'f', ylabel:'|G(f)|,\\;|H(f)|',
    xtarget:6, ytarget:3, ytickfmt:()=>''}));
  const G = f => Math.exp(-f*f), H = f => Math.exp(-f*f/(b*b));
  a.area(f=>Math.min(G(f),H(f)), -3.2, 3.2, {color:C.dec.mid});
  a.curve(G, {color:C.in, width:2.4});
  a.curve(H, {color:C.h, width:2.2, dash:'7 5'});
  a.note(-3.05, 1.16, `\\eta=${schwarzRatio(b).toFixed(2)}\\cdot\\dfrac{2E}{N_0}`, {tex:true, fs:16, color:C.mid});
  return a.svg();
}

/* The matched filter built in two moves on a ramp s(t) = t/T: reverse it in
   time, then shift it right by T. Frame 0 is the pulse; frame 1 is s(-t);
   frame 2 is h(t) = s(T-t). Between frames each point moves continuously. */
function figMatchedBuild(v){
  const f = frameOf(v, 2), u1 = clamp01(f), u2 = clamp01(f-1);
  const X = t => t*(1-2*u1) + u2;
  const a = P.Axes(SZ({xr:[-1.35,1.35], yr:[-0.2,1.35], xlabel:'t/T', ylabel:'s(t),\\;h(t)',
    xticksOverride:[-1,-0.5,0,0.5,1], ytarget:3}));
  a.poly([[0,0],[0,0],[1,1],[1,0]], {color:C.in, width:f>0.05?1.6:2.6});
  if(f > 0.05) a.poly([[X(0),0],[X(1),1],[X(1),0]], {color:C.h, width:2.6});
  return a.svg();
}

/* The matched-filter output as a sliding overlap, for a unit rectangle on
   [0, T]. The top panel slides h(t - tau) = s(T - t + tau) across s(tau) and
   shades their product; the lower panel draws y(t), the area of that product,
   as far as the slide has gone. Frame k puts the slide at t = kT/2. */
function figConvSweep(v){
  P.hOverride = null;
  const t = frameOf(v, 2)/2;
  const s = u => (u>=0 && u<=1) ? 1 : 0, y = u => u<0 ? 0 : u<1 ? u : u<2 ? 2-u : 0;
  const a = P.Axes({w:560,h:200,xr:[-1.2,2.3],yr:[-0.2,1.4],xlabel:'\\tau/T',ylabel:'s(\\tau),\\;h(t-\\tau)',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[-1,0,1,2],ytarget:2});
  a.area(u=>Math.min(s(u), s(u-t+1)), -1.2, 2.3, {color:C.dec.mid});
  a.poly([[-1.2,0],[0,0],[0,1],[1,1],[1,0],[2.3,0]], {color:C.in, width:2.4});
  a.poly([[-1.2,0],[t-1,0],[t-1,1],[t,1],[t,0],[2.3,0]], {color:C.h, width:2.2, dash:'7 5'});
  const b = P.Axes({w:560,h:230,xr:[-1.2,2.3],yr:[-0.2,1.4],xlabel:'t/T',ylabel:'y(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[-1,0,1,2],ytarget:2});
  b.curve(y, {color:C.mid, width:1.4, dash:'4 5', opacity:0.5});
  b.curve(u=>u<=t+1e-9 ? y(u) : NaN, {color:C.mid, width:2.6, n:700});
  b.point(t, y(t), {color:C.mid, r:5});
  if(Math.abs(t-1) < 0.02) b.note(1.06, 1.18, 'y(T)=E', {tex:true, fs:15, color:C.mid});
  return stack(560, [[a.svg(),200],[b.svg(),230]]);
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
  const a = P.Axes(SZ({xr:[-0.2,2.2], yr:[-0.12,1.3], xlabel:'t/T', ylabel:'y(t)/E',
    xticksOverride:[0,0.5,1,1.5,2], ytarget:3}));
  a.poly(mfOut(0), {color:C.mid, width:2.4});
  a.poly(mfOut(1), {color:C.mid, width:2.4, dash:'8 5'});
  a.vline(1, {color:C.muted});
  a.point(1, 1, {color:C.mid, r:5});
  a.note(1.06, 1.14, 'y(T)=E', {tex:true, fs:15, color:C.mid});
  return a.svg();
}

/* Worked example: the pulse s(t) = A on [0, T] and, as the answer, the output
   of its matched filter, both scaled so the axes are the same for the two. */
function figExMf(){
  const a = P.Axes(SZ({xr:[-0.4,2.4], yr:[-0.12,1.3], xlabel:'t/T', ylabel:'y(t)/(A^{2}T)',
    xticksOverride:[0,0.5,1,1.5,2], ytarget:4}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[2.4,0]], {color:C.ink, width:1.6, dash:'6 5'});
  a.note(0.06, 1.1, 's(t)/A', {tex:true, fs:14, color:C.ink});
  a.raw('<g class="sk-key">');
  a.poly([[-0.2,0],[0,0],[1,1],[2,0],[2.4,0]], {color:C.mid, width:2.6});
  a.point(1, 1, {color:C.mid, r:5});
  a.note(1.08, 1.12, 'y(T)=A^{2}T', {tex:true, fs:15, color:C.mid});
  a.raw('</g>');
  return a.svg();
}

/* ---- 2.2 the demodulator -------------------------------------------------- */

/* The basis and the two waveforms of polar NRZ, drawn with T_b = 1 and
   A = 1.5, so s_1(t) = +1.5 psi(t) and s_0(t) = -1.5 psi(t). */
function figBasis(){
  const a = P.Axes(SZ({xr:[-0.3,1.35], yr:[-2.1,2.1], xlabel:'t/T_b', ylabel:'\\psi(t),\\;s_m(t)',
    xticksOverride:[0,0.5,1], ytickfmt:()=>'', yticksOverride:[-1.5,-1,0,1,1.5]}));
  a.poly([[-0.3,0],[0,0],[0,1.5],[1,1.5],[1,0],[1.35,0]], {color:C.in, width:2.4});
  a.poly([[-0.3,0],[0,0],[0,-1.5],[1,-1.5],[1,0],[1.35,0]], {color:C.in, width:2.4, dash:'8 5'});
  a.poly([[-0.3,0],[0,0],[0,1],[1,1],[1,0],[1.35,0]], {color:C.h, width:2.2});
  a.note(0.5, 1.78, 's_1(t)=+A', {tex:true, fs:15, color:C.in, anchor:'middle'});
  a.note(0.5, 0.72, '\\psi(t)=1/\\sqrt{T_b}', {tex:true, fs:15, color:C.h, anchor:'middle'});
  a.note(0.5, -1.86, 's_0(t)=-A', {tex:true, fs:15, color:C.in, anchor:'middle'});
  return a.svg();
}

/* The same two waveforms as two points on one axis. */
function figSignalSpace(){
  P.hOverride = null;
  const a = P.Axes({w:560,h:210,xr:[-0.3,1.35],yr:[-2.1,2.1],xlabel:'t/T_b',ylabel:'s_m(t)',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[0,0.5,1],yticksOverride:[],ytarget:2});
  a.poly([[-0.3,0],[0,0],[0,1.5],[1,1.5],[1,0],[1.35,0]], {color:C.in, width:2.4});
  a.poly([[-0.3,0],[0,0],[0,-1.5],[1,-1.5],[1,0],[1.35,0]], {color:C.in, width:2.4, dash:'8 5'});
  a.note(1.05, 1.5, 's_1(t)', {tex:true, fs:15, color:C.in});
  a.note(1.05, -1.5, 's_0(t)', {tex:true, fs:15, color:C.in});
  const b = P.Axes({w:560,h:190,xr:[-2,2],yr:[-1,1.2],xlabel:'\\text{signal-space axis}',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[],yticksOverride:[],grid:false,arrows:false});
  b.point(-1.4, 0, {color:C.in, r:7}); b.point(1.4, 0, {color:C.in, r:7});
  b.note(-1.4, -0.6, 's_0=-\\sqrt{E_b}', {tex:true, fs:16, color:C.in, anchor:'middle'});
  b.note(1.4, -0.6, 's_1=+\\sqrt{E_b}', {tex:true, fs:16, color:C.in, anchor:'middle'});
  b.span(-1.4, 1.4, 0.62, 'd=2\\sqrt{E_b}', {tex:true, fs:15, color:C.muted});
  return stack(560, [[a.svg(),210],[b.svg(),190]]);
}

/* The matched-filter demodulator: the block and what it does to one bit. The
   input is one bit with noise; the output rises to s_m + n at t = T_b. */
const DM_W = noiseFn(29, 0.012, 0.45, -1, 3);
function figMfDemod(){
  P.hOverride = null;
  const top = P.blocks({w:560,h:130,items:[
    {t:'arrow',x1:16,y1:58,x2:150,y2:58,label:'x(t)',tex:true,color:C.out},
    {t:'box',x:150,y:26,w:150,h:64,label:'\\psi(T_b-t)',tex:true,color:C.h},
    {t:'arrow',x1:300,y1:58,x2:396,y2:58,label:'y(t)',tex:true,color:C.mid},
    {t:'line',d:'M396,58 h24'}, {t:'line',d:'M420,58 l20,-14'},
    {t:'arrow',x1:448,y1:58,x2:548,y2:58,label:'y(T_b)',tex:true,color:C.mid},
    {t:'text',x:430,y:104,label:'t=T_b',tex:true,fs:14}
  ]});
  /* one bit s_m = +1 on [0, 1] with psi = 1: x = 1 + w there, 0 elsewhere */
  const x = t => (t>=0 && t<=1) ? 1 + DM_W(t) : 0;
  const N = 400, yv = []; for(let j=0;j<=200;j++){ const t = 2*j/200; let s = 0;
    for(let i=0;i<N;i++){ const u = (i+0.5)/N; if(u <= t && u >= t-1) s += x(u); } yv.push([t, s/N]); }
  const a = P.Axes({w:560,h:280,xr:[-0.15,2.2],yr:[-1.0,2.6],xlabel:'t/T_b',ylabel:'x(t),\\;y(t)',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,0.5,1,1.5,2],ytarget:3});
  a.curve(t=>t>=0&&t<=1 ? x(t) : NaN, {color:C.out, width:1.4, n:900});
  a.poly(yv, {color:C.mid, width:2.6});
  a.vline(1, {color:C.muted});
  a.point(1, yv[100][1], {color:C.mid, r:5});
  a.note(1.06, yv[100][1]+0.36, 'y(T_b)=s_m+n', {tex:true, fs:15, color:C.mid});
  return stack(560, [[top,130],[a.svg(),280]]);
}

/* Correlator and matched filter on one noiseless bit, s_m = 1, with the
   rectangular basis. The correlator integrates from 0 and is dumped at T_b;
   the filter output is the triangle. On [0, T_b] the two are the same line. */
function figCorrMf(){
  const a = P.Axes(SZ({xr:[-0.15,2.2], yr:[-0.2,1.35], xlabel:'t/T_b', ylabel:'\\text{output}',
    xticksOverride:[0,0.5,1,1.5,2], ytarget:3}));
  a.raw('<g opacity="0.45">');
  a.poly([[-0.15,0],[0,0],[1,1],[2,0],[2.2,0]], {color:C.mid, width:5});
  a.raw('</g>');
  a.poly([[-0.15,0],[0,0],[1,1],[1,0],[2.2,0]], {color:C.mid, width:2.2, dash:'7 5'});
  a.vline(1, {color:C.muted});
  a.point(1, 1, {color:C.mid, r:5});
  a.note(1.06, 1.14, 's_m=1', {tex:true, fs:15, color:C.mid});
  return a.svg();
}

/* ---- 2.3 the decision and its error ------------------------------------ */

/* The two conditional densities of y. The figures use E_b = 1 and N_0 = 0.5,
   so sigma = 0.5 and the overlap is wide enough to see. The density given
   s_0 is dashed, the one given s_1 solid; both are densities of the decision
   statistic, so both are violet. The error areas are red. */
const DS = {A:1, s:0.5, N0:0.5};
function densFrame(o){
  const a = P.Axes(SZ(Object.assign({xr:[-3,3], xlabel:'y', xticksOverride:[-2,-1,0,1,2],
    xtickfmt:v=>Math.abs(v)===1 ? '' : String(v), ytarget:3, ytickfmt:()=>''}, o)));
  return a;
}
function markMeans(a, y){
  a.point(-1, 0, {color:C.in, r:5}); a.point(1, 0, {color:C.in, r:5});
  a.note(-1, y, '-\\sqrt{E_b}', {tex:true, fs:15, color:C.in, anchor:'middle'});
  a.note(1, y, '+\\sqrt{E_b}', {tex:true, fs:15, color:C.in, anchor:'middle'});
}
function figStat(){
  const {A,s} = DS, top = dens(0,0,s);
  const a = densFrame({yr:[-0.06*top,1.3*top], ylabel:'f_Y(y\\mid s_m)'});
  a.curve(y=>dens(y,-A,s), {color:C.mid, width:2.4, dash:'8 5'});
  a.curve(y=>dens(y, A,s), {color:C.mid, width:2.4});
  markMeans(a, 0.1*top);
  return a.svg();
}
function figErrors(v){
  const {A,s} = DS, top = dens(0,0,s), lam = v && v.lam!=null ? v.lam : 0;
  const a = densFrame({yr:[-0.06*top,1.42*top], ylabel:'f_Y(y\\mid s_m)'});
  a.area(y=>dens(y,-A,s), lam, 3, {color:C.dec.err});
  a.area(y=>dens(y, A,s), -3, lam, {color:C.dec.err});
  a.curve(y=>dens(y,-A,s), {color:C.mid, width:2.4, dash:'8 5'});
  a.curve(y=>dens(y, A,s), {color:C.mid, width:2.4});
  a.vline(lam, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  markMeans(a, 0.1*top);
  a.note(-2.9, 1.3*top, `P(\\text{err}\\mid s_0)=${sci(Qf((lam+A)/s))}`, {tex:true, fs:15, color:C.err});
  a.note(-2.9, 1.14*top, `P(\\text{err}\\mid s_1)=${sci(Qf((A-lam)/s))}`, {tex:true, fs:15, color:C.err});
  return a.svg();
}
/* The optimal threshold for P(s_0) = 0.7: where the two weighted densities
   cross. It moves right of zero, towards s_1. */
const lamOpt = (N0, A, p0) => N0/(4*A)*Math.log(p0/(1-p0));
function figThreshold(){
  const {A,s,N0} = DS, p0 = 0.7, top = p0*dens(0,0,s), lo = lamOpt(N0,A,p0);
  const a = densFrame({yr:[-0.06*top,1.3*top], ylabel:'P(s_m)\\,f_Y(y\\mid s_m)'});
  a.area(y=>Math.min(p0*dens(y,-A,s),(1-p0)*dens(y,A,s)), -3, 3, {color:C.dec.err});
  a.curve(y=>p0*dens(y,-A,s), {color:C.mid, width:2.4, dash:'8 5'});
  a.curve(y=>(1-p0)*dens(y,A,s), {color:C.mid, width:2.4});
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
  a.curve(y=>p0*dens(y,-A,s), {color:C.mid, width:2.4, dash:'8 5'});
  a.curve(y=>(1-p0)*dens(y,A,s), {color:C.mid, width:2.4});
  a.vline(0, {color:C.muted});
  a.vline(lo, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  markMeans(a, 0.1*top);
  a.note(-2.9, 1.2*top, `\\lambda_{\\mathrm{opt}}=${lo.toFixed(3)}`, {tex:true, fs:16, color:C.ink});
  return a.svg();
}

/* The standard normal density and the tail Q(x) under a slider on x. */
function figQ(v){
  const x = v && v.x!=null ? v.x : 1;
  const phi = z => Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
  const a = P.Axes(SZ({xr:[-3.6,3.6], yr:[-0.03,0.52], xlabel:'z', ylabel:'\\phi(z)',
    xticksOverride:[-3,-2,-1,0,1,2,3], ytarget:3}));
  a.area(phi, x, 3.6, {color:C.dec.mid});
  a.curve(phi, {color:C.mid, width:2.4});
  a.vline(x, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.note(-3.45, 0.47, `Q(${x.toFixed(1)})=${sci(Qf(x))}`, {tex:true, fs:16, color:C.mid});
  return a.svg();
}

/* P_b = Q(sqrt(2 E_b/N_0)) against E_b/N_0 in decibels, on decades. The curve
   stops half a decade above the bottom of the range, clear of the axis name. */
const pbDb = d => Qf(Math.sqrt(2*Math.pow(10, d/10)));
function figPe(v){
  const dB = v && v.dB!=null ? v.dB : null;
  const a = P.Axes(SZ({xr:[0,12], yr:[-8,-0.02], xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'P_b',
    ytickfmt:P.decade, yticksOverride:P.decades(-8,-1), zeroAxes:false, pad:{l:64,r:26,t:24,b:46}, xtarget:6}));
  a.curve(d=>{ const p = pbDb(d); return p > 3e-8 ? Math.log10(p) : NaN; }, {color:C.in, width:2.4});
  if(dB!=null){ const p = pbDb(dB);
    a.vline(dB, {color:C.muted});
    a.point(dB, Math.log10(p), {color:C.in, r:5.5});
    const hi = dB >= 9;
    a.note(hi ? dB-0.35 : dB+0.35, Math.log10(p)+(hi ? -0.7 : 0.5), `P_b=${sci(p)}`, {tex:true, fs:16, color:C.in, anchor:hi ? 'end' : 'start'}); }
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
  a.curve(inX(y=>L(y,-A,p0)), {color:C.mid, width:2.4, dash:'8 5'});
  a.curve(inX(y=>L(y, A,1-p0)), {color:C.mid, width:2.4});
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

const ISI_B = [1,1,0,1,0,0];
function figIsiBuild(v){
  const f = frameOf(v, 3), bt = 0.25, r = rcResp(bt);
  const a = P.Axes(SZ({xr:[-0.6,7.3], yr:[-1.6,1.75], xlabel:'t/T_b', ylabel:'y(t)',
    xticksOverride:[0,1,2,3,4,5,6,7], ytarget:4}));
  const one = clamp01(1-(f-1.5)*2), many = clamp01(f-1.5);
  if(one > 0.02){
    a.poly([[-0.6,0],[0,0],[0,1],[1,1],[1,0],[7.3,0]], {color:C.in, width:2.4});
    if(f > 0.02) a.curve(t=>clamp01(f)*r(t), {color:C.out, width:2.6, n:900});
  }
  if(many > 0.02){
    a.curve(nrz(ISI_B), {color:C.in, width:1.4, dash:'5 5', opacity:0.7*many, n:1400});
    ISI_B.forEach((b,k)=>a.curve(t=>(b?1:-1)*r(t-k), {color:C.mid, width:1.2, dash:'3 4', opacity:0.75*many*clamp01(3-f+0.2), n:900}));
    const y = rcTrain(ISI_B, bt), w = clamp01(f-2);
    if(w > 0.02){ a.curve(y, {color:C.out, width:2.6, n:1400});
      ISI_B.forEach((_,k)=>a.point(k+1, y(k+1), {color:C.mid, r:4.6})); }
  }
  return a.svg();
}

/* One sample and what makes it up. Bits 0,0,0 then 1 after a line idle at
   the level of a 0; the sample at the end of the 1 is the bit's own share
   (1 - q) less the tails of the earlier bits. BT_b = 0.25. */
const TERM_B = [0,0,0,1];
function figIsiTerm(){
  P.hOverride = null;
  const bt = 0.25, q = rcq(bt), y = rcTrain(TERM_B, bt, -1);
  const a = P.Axes({w:560,h:210,xr:[-0.6,4.4],yr:[-1.4,1.5],xlabel:'t/T_b',ylabel:'y(t)',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[0,1,2,3,4],ytarget:3});
  a.curve(nrz(TERM_B,-1), {color:C.in, width:1.4, dash:'5 5', opacity:0.7, n:900});
  a.curve(y, {color:C.out, width:2.6, n:900});
  a.vline(4, {color:C.muted});
  a.point(4, y(4), {color:C.mid, r:5});
  a.note(3.1, 1.25, `y=${y(4).toFixed(3)}`, {tex:true, fs:15, color:C.mid});
  const cont = [0,1,2,3,4].map(m=>[m, (m===0?1:-1)*(1-q)*Math.pow(q,m)]);
  const b = P.Axes({w:560,h:220,xr:[-0.5,5],yr:[-0.35,1.0],xlabel:'m\\;(\\text{bits back})',ylabel:'\\text{share of the sample}',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0,1,2,3,4],ytarget:3});
  b.stem([cont[0]], {color:C.mid});
  b.stem(cont.slice(1), {color:C.err});
  b.note(0.12, 0.86, '1-q', {tex:true, fs:15, color:C.mid});
  b.note(2.3, 0.4, '-(1-q)q^{m}', {tex:true, fs:15, color:C.err});
  return stack(560, [[a.svg(),210],[b.svg(),220]]);
}

/* Worked example: the bits 0 0 0 1 1 1 0 1 after a line idle at the level of
   a 0, through the channel with BT_b = 0.25. The answer is y(t) and its
   samples at the end of each bit; the one asked for, at the end of the
   seventh bit, is -1 + 2q - 2q^4 = -0.588. */
const EXI_B = [0,0,0,1,1,1,0,1];
function figExIsi(){
  const bt = 0.25, y = rcTrain(EXI_B, bt, -1);
  const a = P.Axes(SZ({xr:[-0.4,8.4], yr:[-1.5,1.6], xlabel:'t/T_b', ylabel:'y(t)',
    xticksOverride:[0,1,2,3,4,5,6,7,8], ytarget:4}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  a.curve(nrz(EXI_B,-1), {color:C.ink, width:1.6, dash:'6 5', n:1400});
  EXI_B.forEach((b,k)=>a.note(k+0.5, 1.4, String(b), {fs:14, color:C.ink, anchor:'middle'}));
  a.raw('<g class="sk-key">');
  a.curve(y, {color:C.out, width:2.6, n:1400});
  EXI_B.forEach((_,k)=>a.point(k+1, y(k+1), {color:C.mid, r:4.6}));
  a.note(7.12, y(7)-0.2, y(7).toFixed(3), {tex:true, fs:15, color:C.mid});
  a.raw('</g>');
  return a.svg();
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
function figEyeBuild(v){
  const f = frameOf(v, 3), n = Math.min(128, Math.round(Math.pow(2, f*7/3)));
  const a = P.Axes(SZ({xr:[-1,1], yr:[-1.5,1.5], xlabel:'t/T_b', ylabel:'y(t)',
    xticksOverride:[-1,-0.5,0,0.5,1], ytarget:4}));
  a.raw(`<g opacity="${n>20 ? 0.5 : 1}">`);
  eyeTraces(0.3, n).forEach(pts=>a.poly(pts, {color:C.out, width:n>20?1.1:1.8}));
  a.raw('</g>');
  a.vline(0, {color:C.muted});
  return a.svg();
}
function figEyeLive(v){
  const bt = v && v.bt!=null ? v.bt : 0.3, q = rcq(bt), h = 1-2*q;
  const a = P.Axes(SZ({xr:[-1,1], yr:[-1.5,1.5], xlabel:'t/T_b', ylabel:'y(t)',
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

/* ---- 2.5 Nyquist and the raised cosine -----------------------------------
   T_b = 1, so R_b = 1 and the Nyquist bandwidth W = 1/2. The pulse p(t) and
   its spectrum P(f) are cyan; replicas of the spectrum and their sum, which
   is the spectrum of the sampled pulse, are violet as in Module 1. */
const rcPulse = (t, al) => { const den = 1-4*al*al*t*t;
  if(Math.abs(den) < 1e-6) return sinc(t)*Math.PI/4;
  return sinc(t)*Math.cos(Math.PI*al*t)/den; };
/* 2W P(f) of the raised cosine, f in units of W */
const rcSpec = (f, al) => { const u = Math.abs(f), f1 = 1-al;
  if(al < 1e-9) return u <= 1 ? 1 : 0;
  if(u <= f1) return 1;
  if(u < 2-f1) return 0.5*(1-Math.sin(Math.PI*(u-1)/(2-2*f1)));
  return 0; };

function figSincTrain(){
  const a = P.Axes(SZ({xr:[-4.5,4.5], yr:[-0.35,1.3], xlabel:'t/T_b', ylabel:'p(t)',
    xticksOverride:[-4,-3,-2,-1,0,1,2,3,4], ytarget:3}));
  a.curve(t=>sinc(t-1), {color:C.in, width:1.4, dash:'6 5', opacity:0.6});
  a.curve(t=>sinc(t+1), {color:C.in, width:1.4, dash:'6 5', opacity:0.6});
  a.curve(sinc, {color:C.in, width:2.6});
  for(let k=-4;k<=4;k++) a.point(k, sinc(k), {color:C.mid, r:4.8});
  return a.svg();
}
/* A triangular spectrum of width 2R_b, P(f) = T_b(1 - |f|/R_b), and its
   replicas at multiples of R_b. Frame 0 is the pulse spectrum, frames 1 and 2
   add the pairs at +-R_b and +-2R_b, frame 3 draws their sum, a constant. The
   sum is drawn on [-2R_b, 2R_b], where the five drawn copies are all there is. */
function figTiling(v){
  const f = frameOf(v, 3), tri = u => Math.max(0, 1-Math.abs(u));
  const a = P.Axes(SZ({xr:[-3.3,3.3], yr:[-0.12,1.45], xlabel:'f/R_b', ylabel:'R_b\\,P(f-nR_b)',
    xticksOverride:[-3,-2,-1,0,1,2,3], ytarget:3}));
  for(const n of [-2,-1,1,2]){ const w = clamp01(f - (Math.abs(n)-1));
    if(w > 0.02) a.poly([[n-1,0],[n,w],[n+1,0]], {color:C.mid, width:1.8, dash:'6 4'}); }
  a.poly([[-1,0],[0,1],[1,0]], {color:C.in, width:2.6});
  if(f > 2.02){ const w = clamp01(f-2);
    a.curve(u=>{ if(Math.abs(u) > 2) return NaN; let s = 0; for(let n=-2;n<=2;n++) s += tri(u-n); return w*s + (1-w)*tri(u); }, {color:C.mid, width:2.8});
  }
  return a.svg();
}
function figNyqChannel(){
  const a = P.Axes(SZ({xr:[-3.6,3.6], yr:[-0.12,1.4], xlabel:'f/W', ylabel:'2W\\,P(f-nR_b)',
    xticksOverride:[-3,-1,1,3], ytarget:3}));
  for(let n=-1;n<=1;n++)
    a.poly([[-3.6,0],[2*n-1,0],[2*n-1,1],[2*n+1,1],[2*n+1,0],[3.6,0]], {color:n?C.mid:C.in, width:n?1.8:2.6, dash:n?'6 4':null});
  return a.svg();
}
/* The ideal pulse sampled late by eps: each neighbour now contributes
   p(k + eps), and those contributions decay only as 1/k. */
const sincIsi = (eps, K=20) => { let s = 0; for(let k=-K;k<=K;k++) if(k) s += Math.abs(sinc(k+eps)); return s; };
function figSincOffset(v){
  const eps = v && v.eps!=null ? v.eps : 0.1;
  const a = P.Axes(SZ({xr:[-5.5,5.5], yr:[-0.35,1.35], xlabel:'t/T_b', ylabel:'p(t)',
    xticksOverride:[-5,-4,-3,-2,-1,0,1,2,3,4,5], ytarget:3}));
  a.curve(sinc, {color:C.in, width:2.6});
  const st = []; for(let k=-5;k<=5;k++) if(k) st.push([k+eps, sinc(k+eps)]);
  a.stem(st, {color:C.err});
  a.stem([[eps, sinc(eps)]], {color:C.mid});
  a.note(-5.35, 1.18, `\\textstyle\\sum_{1\\le|k|\\le20}|p(kT_b+\\epsilon)|=${sincIsi(eps).toFixed(2)}`, {tex:true, fs:15, color:C.err});
  return a.svg();
}
function figRcSpec(v){
  const al = v && v.al!=null ? v.al : 0.5;
  const a = P.Axes(SZ({xr:[-3.3,3.3], yr:[-0.12,1.4], xlabel:'f/W', ylabel:'2W\\,P(f)',
    xticksOverride:[-3,-2,-1,0,1,2,3], ytarget:3}));
  for(const n of [-1,1]) a.curve(f=>rcSpec(f-2*n, al), {color:C.mid, width:1.6, dash:'6 4', n:900});
  a.curve(f=>rcSpec(f, al), {color:C.in, width:2.6, n:900});
  a.curve(f=>{ let s = 0; for(let n=-2;n<=2;n++) s += rcSpec(f-2*n, al); return s; }, {color:C.mid, width:2.2, n:900});
  a.span(-1-al, 1+al, 1.24, `B_T=${(1+al).toFixed(2)}\\,W`, {tex:true, fs:15, color:C.muted});
  return a.svg();
}
function figRcPulse(v){
  const al = v && v.al!=null ? v.al : 0.5;
  const a = P.Axes(SZ({xr:[-4.5,4.5], yr:[-0.3,1.25], xlabel:'t/T_b', ylabel:'p(t)',
    xticksOverride:[-4,-3,-2,-1,0,1,2,3,4], ytarget:3}));
  a.curve(sinc, {color:C.in, width:1.4, dash:'6 5', opacity:0.6});
  a.curve(t=>rcPulse(t, al), {color:C.in, width:2.6, n:900});
  for(let k=-4;k<=4;k++) a.point(k, k ? 0 : 1, {color:C.mid, r:4.6});
  a.note(-4.35, 1.08, `\\alpha=${al.toFixed(2)}`, {tex:true, fs:16, color:C.in});
  return a.svg();
}
/* Worked example: R_b = 20 kb/s, so W = 10 kHz. The given trace is the ideal
   rectangle; the answer is the raised cosine with alpha = 0.5. */
function figExRc(){
  const a = P.Axes(SZ({xr:[-22,22], yr:[-0.12,1.35], xlabel:'f\\;(\\text{kHz})', ylabel:'2W\\,P(f)',
    xticksOverride:[-20,-15,-10,-5,0,5,10,15,20], ytarget:3}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  a.poly([[-22,0],[-10,0],[-10,1],[10,1],[10,0],[22,0]], {color:C.ink, width:1.6, dash:'6 5'});
  a.raw('<g class="sk-key">');
  a.curve(f=>rcSpec(f/10, 0.5), {color:C.in, width:2.6, n:900});
  a.span(-15, 15, 1.18, 'B_T=15\\ \\text{kHz}', {tex:true, fs:15, color:C.in});
  a.raw('</g>');
  return a.svg();
}
function figSrrc(){
  const al = 0.5;
  const a = P.Axes(SZ({xr:[-2.2,2.2], yr:[-0.08,1.3], xlabel:'f/W', ylabel:'\\text{spectrum}',
    xticksOverride:[-2,-1.5,-1,-0.5,0,0.5,1,1.5,2], ytarget:3}));
  a.curve(f=>Math.sqrt(rcSpec(f, al)), {color:C.h, width:2.4, dash:'8 5', n:900});
  a.curve(f=>rcSpec(f, al), {color:C.in, width:2.6, n:900});
  return a.svg();
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
    [()=>{ const Tb = 104.2, a=P.Axes(EXO({xr:[-10,230],yr:[-0.5,1.9],xlabel:'t\\;(\\mu\\text{s})',ylabel:'x(t),\\;y(t)',xticksOverride:[0,104.2,208.4],
        xtickfmt:v=>v?String(+v.toFixed(1)):'0',ytarget:3}));
      a.curve(t=>t>=0&&t<Tb?1+UA_W(t/Tb):0,{color:C.out,width:1.3,n:900});
      a.curve(t=>{ if(t<0||t>=Tb) return t>=Tb ? 0 : NaN; let s=0; const N=120; for(let i=0;i<N;i++){ const u=t*(i+0.5)/N; s+=1+UA_W(u/Tb); } return s/N*(t/Tb); },{color:C.mid,width:2.4,n:600});
      a.point(Tb,(()=>{ let s=0; for(let i=0;i<400;i++) s+=1+UA_W((i+0.5)/400); return s/400; })(),{color:C.mid,r:5});
      return a.svg(); }, 'A serial port at $9600$ baud integrates each bit over $T_b=1/9600=104.2\\ \\mu$s, then dumps. The integrator is the matched filter of a rectangular bit.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Correlation with a template', html:'Each receiver correlates what it hears with a copy of what was sent. That is the matched filter $h(t)=s(T-t)$ read at its peak.'},
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
    [()=>{ const a=P.Axes(EXO({xr:[-0.1,2.1],yr:[-0.1,1.25],xlabel:'t/T_b',ylabel:'y(t)/\\sqrt{E_b}',xticksOverride:[0,0.5,1,1.5,2],ytarget:3}));
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
    [()=>{ const a=P.Axes(EXO({xr:[0,16],yr:[-12,-0.02],xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_b',ytickfmt:P.decade,
        yticksOverride:[-12,-9,-6,-3],zeroAxes:false,pad:{l:64,r:26,t:24,b:44},xtarget:5}));
      a.curve(d=>{ const p=pbDb(d); return p>1.5e-12 ? Math.log10(p) : NaN; },{color:C.in,width:2.2});
      a.hline(-10,{color:C.muted}); a.point(13.06,-10,{color:C.in,r:4.5});
      a.note(12.6,-11.3,'13.1\\ \\mathrm{dB}',{tex:true,fs:14,color:C.in,anchor:'end'});
      return a.svg(); }, 'Wired Ethernet asks for $P_b<10^{-10}$. Polar signalling reaches it at $E_b/N_0=13.1$ dB, where $\\sqrt{2E_b/N_0}=6.36$.'],
    [()=>{ const p0 = 0.9, s = 0.5, lo = lamOpt(0.5,1,p0), a=P.Axes(EXO({xr:[-2.5,2.5],yr:[-0.04,0.8],xlabel:'y',ylabel:'P(s_m)\\,f_Y(y\\mid s_m)',xticksOverride:[-2,-1,0,1,2],ytickfmt:()=>'',ytarget:3}));
      a.curve(y=>p0*dens(y,-1,s),{color:C.mid,width:2.2,dash:'7 5'});
      a.curve(y=>(1-p0)*dens(y,1,s),{color:C.mid,width:2.2});
      a.vline(lo,{color:C.ink,dash:'6 4',width:1.4,opacity:1});
      return a.svg(); }, 'A sensor reports a rare event with prior $p_1=0.1$. With $E_b=1$ and $N_0=0.5$, $\\lambda_{\\mathrm{opt}}=0.125\\ln 9=0.275$, moved toward the rare symbol.'],
    [()=>{ const a=P.Axes(EXO({xr:[0,6.3],yr:[-10,0],xlabel:'x',ylabel:'Q(x)',ytickfmt:P.decade,yticksOverride:[-9,-6,-3,0],zeroAxes:false,pad:{l:64,r:26,t:24,b:44},xticksOverride:[0,1,2,3,4,5,6]}));
      a.curve(x=>Math.log10(Qf(x)),{color:C.mid,width:2.2});
      for(let k=1;k<=6;k++) a.point(k,Math.log10(Qf(k)),{color:C.mid,r:4.2});
      return a.svg(); }, 'The Gaussian tail $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ on decades. Above $x=3$ each unit step in $x$ divides $Q(x)$ by more than $40$.'],
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
    [()=>{ const r = rcResp(0.15), a=P.Axes(EXO({xr:[-0.3,5.3],yr:[-0.1,1.1],xlabel:'t/T_b',ylabel:'r(t)',xticksOverride:[0,1,2,3,4,5],ytarget:3}));
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
    [()=>{ const W = 13.75, a=P.Axes(EXO({xr:[-25,25],yr:[-0.08,1.3],xlabel:'f\\;(\\text{MHz})',ylabel:'2W\\,P(f)',xticksOverride:[-18.6,-13.75,0,13.75,18.6],
        xtickfmt:v=>String(+v.toFixed(2)),ytarget:3}));
      a.curve(f=>rcSpec(f/W,0.35),{color:C.in,width:2.2,n:900});
      return a.svg(); }, 'Satellite television at $R_s=27.5$ Mbaud with $\\alpha=0.35$ uses $B_T=13.75(1.35)=18.6$ MHz at baseband.'],
    [()=>{ const W = 1.92, a=P.Axes(EXO({xr:[-3.2,3.2],yr:[-0.08,1.3],xlabel:'f\\;(\\text{MHz})',ylabel:'2W\\,P(f)',xticksOverride:[-2.5,-1.92,0,1.92,2.5],
        xtickfmt:v=>String(+v.toFixed(2)),ytarget:3}));
      a.curve(f=>rcSpec(f/W,0.22),{color:C.in,width:2.2,n:900});
      a.vline(-2.5,{color:C.h,dash:'6 4',width:1.4}); a.vline(2.5,{color:C.h,dash:'6 4',width:1.4});
      return a.svg(); }, '3G mobile sends $3.84$ Mchip/s with $\\alpha=0.22$. $B_T=1.92(1.22)=2.34$ MHz fits inside the $\\pm2.5$ MHz of its $5$ MHz channel.'],
    [()=>{ const a=P.Axes(EXO({xr:[-4.5,4.5],yr:[-0.3,1.2],xlabel:'t/T_s',ylabel:'p(t)',xticksOverride:[-4,-2,0,2,4],ytarget:3}));
      a.curve(t=>rcPulse(t,0.35),{color:C.in,width:2.2,n:900});
      for(let k=-4;k<=4;k++) a.point(k,k?0:1,{color:C.mid,r:4});
      return a.svg(); }, 'The raised-cosine pulse of $\\alpha=0.35$. It is zero at every other sampling instant, so the samples carry no interference.'],
    [()=>{ const a=P.Axes(EXO({xr:[0,0.3],yr:[-0.1,2.3],xlabel:'\\epsilon/T_s',ylabel:'\\textstyle\\sum|p(kT_s+\\epsilon)|',xticksOverride:[0,0.1,0.2,0.3],ytarget:3}));
      a.curve(e=>tmIsi(e,0),{color:C.err,width:2.2,dash:'7 5',n:200});
      a.curve(e=>tmIsi(e,0.5),{color:C.err,width:2.2,n:200});
      a.note(0.15,1.5,'\\alpha=0',{tex:true,fs:14,color:C.err,anchor:'end'});
      a.note(0.3,0.2,'\\alpha=0.5',{tex:true,fs:14,color:C.err,anchor:'end'});
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
{ id:'m2-receiver', module:'M2', nav:'The receiver model', title:'The receiver model',
  objective:'Set up the pulse, the white noise and the linear filter sampled at one instant.',
  keywords:'receiver model pulse white gaussian noise power spectral density two sided linear filter sample instant',
  src:'CH8 s.3', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The receiver model'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figReceiver,
      caption:'One pulse $g(t)$ on $[0,T]$ plus white noise $w(t)$ enters a linear filter. The filter output is sampled once, at $t=T$.'},
  ], right:[
    {t:'eq', label:'Received signal', tex:'x(t)=g(t)+w(t),\\qquad 0\\le t\\le T',
      note:'$g(t)$ is the pulse of one bit. $w(t)$ is the noise the channel adds.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'White noise', tex:'S_W(f)=\\frac{N_0}{2}\\quad\\text{for all }f,\\qquad R_W(\\tau)=\\frac{N_0}{2}\\,\\delta(\\tau)',
        note:'The spectral density is two-sided and flat. Noise values at two different times are uncorrelated.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'White noise has the two-sided density $S_W(f)=10^{-9}$ W/Hz.<div class="nsep"></div>What is $N_0$?',
        ask:{key:'m2-receiver', choices:['$5\\times10^{-10}$ W/Hz','$10^{-9}$ W/Hz','$2\\times10^{-9}$ W/Hz'], answer:2,
          why:'$S_W(f)=N_0/2$, so $N_0=2(10^{-9})=2\\times10^{-9}$ W/Hz.'}}]}
  ]}
]},

{ id:'m2-model', module:'M2', nav:'The peak pulse SNR', title:'The peak pulse signal-to-noise ratio',
  objective:'Define the peak pulse SNR at the sampling instant and write both of its parts in the frequency domain.',
  keywords:'peak pulse signal to noise ratio sampling instant output noise variance filter transfer function',
  src:'CH8 s.3–6', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The peak pulse signal-to-noise ratio'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSnr,
      caption:'The filter output: the signal part $g_0(t)$ and a band one noise standard deviation wide. The receiver reads one value, at $t=T$.'},
    {t:'legend', items:[['mid','$g_0(t)$'],['mid','one noisy output',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Peak pulse SNR', tex:'\\eta=\\frac{|g_0(T)|^{2}}{E[n^{2}(T)]}',
      note:'$g_0(t)$ is the filter output for $g(t)$ alone, and $n(t)$ for $w(t)$ alone.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Both parts in $f$', tex:'\\begin{aligned}g_0(T)&=\\int_{-\\infty}^{\\infty}H(f)\\,G(f)\\,e^{j2\\pi fT}\\,df\\\\E[n^{2}(T)]&=\\int_{-\\infty}^{\\infty}\\frac{N_0}{2}\\,|H(f)|^{2}\\,df\\end{aligned}',
        note:'The first line is the inverse transform of $H(f)G(f)$ at $t=T$. The second integrates the output noise density $S_W(f)|H(f)|^{2}$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'At $t=T$ the signal part is $g_0(T)=2$ mV and the noise power is $E[n^{2}(T)]=10^{-6}\\ \\text{V}^{2}$.<div class="nsep"></div>What is $\\eta$?',
        ask:{key:'m2-model', choices:['$2$','$4$','$16$'], answer:1,
          why:'$\\eta=(2\\times10^{-3})^{2}/10^{-6}=4\\times10^{-6}/10^{-6}=4$.'}}]}
  ]}
]},

{ id:'m2-schwarz', module:'M2', nav:'The bound', title:'The bound on the output SNR',
  objective:'Bound the peak pulse SNR with Schwarz\'s inequality and find when the bound is reached.',
  keywords:'schwarz inequality bound 2E/N0 energy parseval equality condition',
  src:'CH8 s.7–8', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The bound on the output SNR'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'b', label:'$b$', min:0.3, max:3, step:0.05, v:1, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figSchwarz,
      caption:'Drag $b$, the width of $|H(f)|$ against the width of $|G(f)|$. The SNR reaches the bound only when the two shapes agree, at $b=1$.'},
    {t:'legend', items:[['in','$|G(f)|$'],['h','$|H(f)|$',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Schwarz\'s inequality', tex:'\\Bigl|\\int\\phi_1(f)\\,\\phi_2(f)\\,df\\Bigr|^{2}\\le\\int|\\phi_1(f)|^{2}\\,df\\int|\\phi_2(f)|^{2}\\,df',
      note:'Equality holds only when $\\phi_1(f)=k\\,\\phi_2^{*}(f)$ for a constant $k$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The bound', key:true, result:true, tex:'\\begin{aligned}|g_0(T)|^{2}&\\le\\int|H(f)|^{2}df\\int|G(f)|^{2}df\\\\\\eta&\\le\\frac{2}{N_0}\\int|G(f)|^{2}\\,df=\\frac{2E}{N_0}\\end{aligned}',
        note:'Take $\\phi_1=H(f)$, $\\phi_2=G(f)\\,e^{j2\\pi fT}$, divide by $E[n^{2}(T)]$, and use Parseval: $\\int|G(f)|^{2}df=E$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A pulse has energy $E=5\\times10^{-7}$ J and the noise has $N_0=10^{-7}$ W/Hz.<div class="nsep"></div>What is the largest peak SNR?',
        ask:{key:'m2-schwarz', choices:['$5$','$10$','$20$'], answer:1,
          why:'$\\eta_{\\max}=2E/N_0=2(5\\times10^{-7})/10^{-7}=10$.'}}]}
  ]}
]},

{ id:'m2-matched', module:'M2', nav:'The matched filter', title:'The matched filter',
  objective:'Find the filter that reaches the bound, in frequency and in time.',
  keywords:'matched filter transfer function complex conjugate impulse response time reversal shift h(t)=g(T-t)',
  src:'CH8 s.9', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The matched filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$s(t)$','$s(-t)$','$h(t)=s(T-t)$']},
      svg:figMatchedBuild,
      caption:'Step through the frames for the ramp $s(t)=t/T$. Reverse it in time, then shift it right by $T$.'},
    {t:'legend', items:[['in','$s(t)$'],['h','$s(-t)$',0,1,1],['h','$h(t)=s(T-t)$',0,2]], at:'tl-axis'}
  ], right:[
    {t:'eq', label:'In frequency', tex:'H_{\\mathrm{opt}}(f)=k\\,G^{*}(f)\\,e^{-j2\\pi fT}',
      note:'This is the equality condition, $\\phi_1=k\\phi_2^{*}$, with $\\phi_2=G(f)e^{j2\\pi fT}$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'In time', tex:'\\begin{aligned}h_{\\mathrm{opt}}(t)&=k\\int_{-\\infty}^{\\infty}G^{*}(f)\\,e^{-j2\\pi f(T-t)}\\,df\\\\&=k\\,g^{*}(T-t)\\\\&=k\\,g(T-t)\\end{aligned}',
        note:'The integral is the conjugate of the inverse transform of $G(f)$ at $T-t$. A real pulse has $g^{*}=g$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$g(t)=t/T$ for $0\\le t\\le T$, and $k=1$.<div class="nsep"></div>What is $h_{\\mathrm{opt}}(0)$?',
        ask:{key:'m2-matched', choices:['$0$','$1/2$','$1$'], answer:2,
          why:'$h_{\\mathrm{opt}}(0)=g(T-0)=g(T)=T/T=1$.'}}]}
  ]}
]},

{ id:'m2-conv', module:'M2', nav:'The matched-filter output', title:'The output of the matched filter',
  objective:'Compute the matched-filter output as a sliding overlap and read its peak at t = T.',
  keywords:'matched filter output convolution sliding overlap autocorrelation peak energy triangle',
  src:'CH8 s.9', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The output of the matched filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$t=0$','$t=T/2$','$t=T$','$t=3T/2$','$t=2T$']},
      svg:figConvSweep,
      caption:'Step through $t$. The shaded area is the overlap of $s(\\tau)$ and $h(t-\\tau)$, and the lower panel plots it as $y(t)$.'},
    {t:'legend', items:[['in','$s(\\tau)$'],['h','$h(t-\\tau)$',true],['mid','$y(t)$']], at:'tr'}
  ], right:[
    {t:'eq', label:'Convolution', tex:'\\begin{aligned}y(t)&=\\int_{-\\infty}^{\\infty}s(\\tau)\\,h(t-\\tau)\\,d\\tau\\\\&=\\int_{-\\infty}^{\\infty}s(\\tau)\\,s(T-t+\\tau)\\,d\\tau\\end{aligned}',
      note:'Substitute $h(t)=s(T-t)$, so $h(t-\\tau)=s(T-t+\\tau)$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The peak', key:true, result:true, tex:'y(T)=\\int_{-\\infty}^{\\infty}s^{2}(\\tau)\\,d\\tau=E',
        note:'At $t=T$ the two copies lie on top of each other, so the overlap is the energy.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$s(t)=A$ for $0\\le t\\le T$, so $E=A^{2}T$.<div class="nsep"></div>What is $y(T/2)$?',
        ask:{key:'m2-conv', choices:['$E/4$','$E/2$','$E$'], answer:1,
          why:'For $0\\le t\\le T$ the overlap has length $t$, so $y(t)=A^{2}t$ and $y(T/2)=A^{2}T/2=E/2$.'}}]}
  ]}
]},

{ id:'m2-props', module:'M2', nav:'Matched-filter properties', title:'Properties of the matched filter',
  objective:'State that the peak value is E for any shape and that the SNR depends on the energy only.',
  keywords:'matched filter properties peak value energy shape independent output snr rectangular half sine',
  src:'CH8 s.12–13', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Properties of the matched filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figEqualOutputs,
      caption:'A rectangular pulse and a half-sine pulse of the same energy $E$, each through its own matched filter. Both outputs peak at $t=T$ with the value $E$.'},
    {t:'legend', items:[['mid','rectangular'],['mid','half sine',true]], at:'tr'}
  ], right:[
    {t:'note', kind:'def', head:'Two properties', html:'<ol class="steps"><li>The output is the pulse autocorrelation, shifted by $T$. Its peak is $y(T)=E$.</li><li>The peak SNR is $2E/N_0$. It depends on the energy, not on the shape.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Noise at the output', tex:'\\begin{aligned}E[n^{2}(T)]&=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}h^{2}(t)\\,dt\\\\&=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}s^{2}(T-t)\\,dt=\\frac{N_0E}{2}\\end{aligned}',
        note:'Then $\\eta=E^{2}/(N_0E/2)=2E/N_0$, which is the bound.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A rectangular pulse and a half-sine pulse both have $E=10^{-6}$ J, and $N_0=10^{-7}$ W/Hz.<div class="nsep"></div>Which one gives the larger peak SNR?',
        ask:{key:'m2-props', choices:['rectangular','half sine','neither: both give $20$'], answer:2,
          why:'$\\eta_{\\max}=2E/N_0=2(10^{-6})/10^{-7}=20$ for both, since only the energy counts.'}}]}
  ]}
]},

{ id:'m2-ex-mf', module:'M2', nav:'Worked example · a rectangular pulse', title:'Worked example: the matched filter of a rectangular pulse',
  objective:'Find the matched filter, its output and the largest peak SNR for a rectangular pulse.',
  keywords:'worked example matched filter rectangular pulse triangle output energy peak snr 13 dB sketch',
  src:'CH8 s.12–13', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Worked example'},
  {t:'title', text:'Worked example: the matched filter of a rectangular pulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Sketch $y(t)$ on the axes, then check it.'}, svg:figExMf,
      caption:'The dashed trace is $s(t)/A$. Draw the output of its matched filter, then show the answer.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$s(t)=A$ on $[0,T]$, $A=2$ V, $T=0.5$ ms, $N_0/2=10^{-4}$ W/Hz.<div class="nsep"></div>Find $h(t)$, $y(t)$ and the largest peak SNR.',
      ask:{key:'m2-ex-mf', choices:['$10$','$20$','$40$'], answer:1,
        why:'$E=A^{2}T=2\\times10^{-3}$ J and $N_0=2\\times10^{-4}$ W/Hz, so $2E/N_0=20$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\begin{aligned}h(t)&=s(T-t)=A,\\quad 0\\le t\\le T\\\\y(t)&=\\begin{cases}A^{2}t,&0\\le t\\le T\\\\A^{2}(2T-t),&T\\le t\\le 2T\\end{cases}\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}E&=A^{2}T=(2)^{2}(0.5\\times10^{-3})=2\\times10^{-3}\\ \\text{J}\\\\\\eta_{\\max}&=\\frac{2E}{N_0}=\\frac{2(2\\times10^{-3})}{2\\times10^{-4}}=20\\end{aligned}',
        note:'Check: $10\\log_{10}20=13.0$ dB, and $y(T)=A^{2}T=E$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $N_0=2\\times10^{-4}$, not $N_0/2$, in $2E/N_0$. The wrong value gives $40$.'}]}
  ]}
]},

REAL_MATCHED,

{ id:'m2-lab-c', module:'M2', nav:'Laboratory {lab} · The matched filter', title:'Laboratory {lab} · The matched filter',
  objective:'Change the pulse, the noise and the sampling instant, and compare the output SNR with the bound.',
  keywords:'laboratory matched filter pulse shape noise sampling instant output snr bound interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Laboratory {lab} · The matched filter'},
  {t:'lede', text:'Choose the pulse, the noise and the sampling instant. Compare the output SNR with the bound $2E/N_0$.'},
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

/* ---------------------------------------------------------------- 2.2 ---- */
{ id:'m2-basis', module:'M2', nav:'Antipodal signalling', title:'The unit-energy basis and antipodal signalling',
  objective:'Write both waveforms of polar signalling as multiples of one unit-energy basis function.',
  keywords:'basis function unit energy antipodal polar nrz s1 s0 bit energy',
  src:'CH8 s.17', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The unit-energy basis and antipodal signalling'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figBasis,
      caption:'The basis $\\psi(t)$ and the two waveforms of polar signalling, drawn with $T_b=1$ and $A=1.5$. Each waveform is $\\psi(t)$ times a number.'},
    {t:'legend', items:[['h','$\\psi(t)$'],['in','$s_1(t)$'],['in','$s_0(t)$',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'The basis', tex:'\\psi(t)=\\frac{1}{\\sqrt{T_b}},\\quad 0\\le t\\le T_b,\\qquad\\int_{0}^{T_b}\\psi^{2}(t)\\,dt=1',
      note:'A basis function has unit energy. Outside $[0,T_b]$ it is zero.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Two waveforms', tex:'\\begin{aligned}s_1(t)&=+A=+\\sqrt{E_b}\\,\\psi(t)\\\\s_0(t)&=-A=-\\sqrt{E_b}\\,\\psi(t)\\\\E_b&=\\int_0^{T_b}A^{2}\\,dt=A^{2}T_b\\end{aligned}',
        note:'The two waveforms are negatives of each other, so the signalling is called antipodal.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Polar signalling uses $A=2$ V and $T_b=1$ ms, in a $1\\ \\Omega$ load.<div class="nsep"></div>What is $E_b$?',
        ask:{key:'m2-basis', choices:['$2$ mJ','$4$ mJ','$8$ mJ'], answer:1,
          why:'$E_b=A^{2}T_b=(2)^{2}(10^{-3})=4\\times10^{-3}$ J.'}}]}
  ]}
]},

{ id:'m2-space', module:'M2', nav:'Signal space', title:'Two waveforms as two points',
  objective:'Represent the two waveforms as two points on the basis axis and find their distance.',
  keywords:'signal space constellation projection coefficient distance 2 sqrt Eb',
  src:'CH8 s.17', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Two waveforms as two points'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSignalSpace,
      caption:'The two waveforms, and the same two as points on the axis of $\\psi(t)$. The points are $2\\sqrt{E_b}$ apart.'}
  ], right:[
    {t:'eq', label:'Coefficient on $\\psi$', tex:'\\begin{aligned}s_m&=\\int_0^{T_b}s_m(t)\\,\\psi(t)\\,dt\\\\s_1&=\\int_0^{T_b}A\\,\\frac{1}{\\sqrt{T_b}}\\,dt=A\\sqrt{T_b}=+\\sqrt{E_b}\\end{aligned}',
      note:'Multiply by $\\psi(t)$ and integrate. For $s_0(t)=-A$ the same steps give $-\\sqrt{E_b}$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Distance', tex:'d=s_1-s_0=\\sqrt{E_b}-\\bigl(-\\sqrt{E_b}\\bigr)=2\\sqrt{E_b}',
        note:'A larger distance means noise must move $y$ further before it crosses to the wrong point.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Polar signalling has $E_b=4$ mJ.<div class="nsep"></div>What is the distance $d$ between the two points?',
        ask:{key:'m2-space', choices:['$0.063\\ \\sqrt{\\text{J}}$','$0.126\\ \\sqrt{\\text{J}}$','$0.253\\ \\sqrt{\\text{J}}$'], answer:1,
          why:'$d=2\\sqrt{E_b}=2\\sqrt{4\\times10^{-3}}=2(0.0632)=0.126\\ \\sqrt{\\text{J}}$.'}}]}
  ]}
]},

{ id:'m2-demod', module:'M2', nav:'The demodulator output', title:'The demodulator output',
  objective:'Show that the demodulator output is the symbol coefficient plus a Gaussian noise term of variance N0/2.',
  keywords:'demodulator matched filter output decision statistic noise term variance N0/2 gaussian',
  src:'CH8 s.19–20', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'The demodulator output'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figMfDemod,
      caption:'The filter matched to $\\psi(t)$, and what it does to one noisy bit. At $t=T_b$ its output is the symbol $s_m$ plus a noise value $n$.'},
  ], right:[
    {t:'eq', label:'The sample', tex:'y(T_b)=\\int_0^{T_b}s_m(t)\\,\\psi(t)\\,dt+\\int_0^{T_b}w(t)\\,\\psi(t)\\,dt=s_m+n',
      note:'Correlate $x(t)=s_m(t)+w(t)$ with $\\psi(t)$ and split the integral.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Noise variance', tex:'\\begin{aligned}E[n^{2}]&=\\int_0^{T_b}\\!\\!\\int_0^{T_b}E[w(t)w(u)]\\,\\psi(t)\\,\\psi(u)\\,dt\\,du\\\\&=\\int_0^{T_b}\\!\\!\\int_0^{T_b}\\frac{N_0}{2}\\,\\delta(t-u)\\,\\psi(t)\\,\\psi(u)\\,dt\\,du\\\\&=\\frac{N_0}{2}\\int_0^{T_b}\\psi^{2}(t)\\,dt=\\frac{N_0}{2}\\end{aligned}',
        note:'Sift with $R_W(\\tau)=(N_0/2)\\delta(\\tau)$, then use $\\int\\psi^{2}dt=1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The noise has $N_0=2\\times10^{-4}$ W/Hz.<div class="nsep"></div>What is the standard deviation $\\sigma$ of $n$?',
        ask:{key:'m2-demod', choices:['$10^{-4}$','$0.01$','$0.014$'], answer:1,
          why:'$\\sigma^{2}=N_0/2=10^{-4}$, so $\\sigma=\\sqrt{10^{-4}}=0.01$.'}}]}
  ]}
]},

{ id:'m2-correlator', module:'M2', nav:'Correlator and matched filter', title:'Correlator and matched-filter demodulators',
  objective:'Show that the correlator and the matched filter give the same value at the end of the bit.',
  keywords:'correlator integrate and dump matched filter equivalence sampling instant T_b',
  src:'CH8 s.19–20', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Correlator and matched-filter demodulators'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figCorrMf,
      caption:'One noiseless bit with $s_m=1$ and the rectangular $\\psi$. The correlator integrates from $0$ and is reset at $T_b$. At $t=T_b$ both read $s_m$.'},
    {t:'legend', items:[['mid','matched filter'],['mid','correlator',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Correlator', tex:'y=\\int_0^{T_b}x(t)\\,\\psi(t)\\,dt',
      note:'Multiply by $\\psi(t)$, integrate over the bit, read the result at $T_b$, then reset.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Matched filter at $T_b$', tex:'\\begin{aligned}h(t)&=\\psi(T_b-t)\\\\y(t)&=\\int_{-\\infty}^{\\infty}x(\\tau)\\,\\psi(T_b-t+\\tau)\\,d\\tau\\\\y(T_b)&=\\int_0^{T_b}x(\\tau)\\,\\psi(\\tau)\\,d\\tau\\end{aligned}',
        note:'Put $t=T_b$. The last line is the correlator output, for any shape of $\\psi$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A noiseless bit with $s_m=1$ and the rectangular $\\psi$ enters the matched filter.<div class="nsep"></div>What is the filter output at $t=1.5T_b$?',
        ask:{key:'m2-correlator', choices:['$0$','$0.5$','$1$'], answer:1,
          why:'The output is the triangle $2-t/T_b$ after its peak, so $y(1.5T_b)=0.5$. Only the value at $T_b$ is used.'}}]}
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
    {t:'legend', items:[['mid','$f_Y(y\\mid s_0)$',true],['mid','$f_Y(y\\mid s_1)$']], at:'tr'}
  ], right:[
    {t:'eq', label:'The statistic', tex:'y=s_m+n,\\qquad s_m=\\pm\\sqrt{E_b},\\qquad n\\sim\\mathcal{N}\\!\\left(0,\\tfrac{N_0}{2}\\right)',
      note:'$y$ is the demodulator output at $t=T_b$. It is all the receiver keeps of the bit.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Conditional density', tex:'f_Y(y\\mid s_1)=\\frac{1}{\\sqrt{\\pi N_0}}\\exp\\!\\left(-\\frac{(y-\\sqrt{E_b})^{2}}{N_0}\\right)',
        note:'This is a Gaussian with mean $\\sqrt{E_b}$ and variance $\\sigma^{2}=N_0/2$. For $s_0$, replace $-\\sqrt{E_b}$ by $+\\sqrt{E_b}$ in the exponent.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$E_b=1$ and $N_0=0.5$.<div class="nsep"></div>What is the standard deviation of $y$ given $s_1$?',
        ask:{key:'m2-stat', choices:['$0.25$','$0.5$','$0.707$'], answer:1,
          why:'$\\sigma=\\sqrt{N_0/2}=\\sqrt{0.25}=0.5$. The symbol shifts the mean, not the spread.'}}]}
  ]}
]},

{ id:'m2-errors', module:'M2', nav:'The two errors', title:'The two conditional errors',
  objective:'Write each conditional error probability as a Gaussian tail and see them trade as the threshold moves.',
  keywords:'threshold conditional error probability gaussian tail Q function trade off',
  src:'CH8 s.24–26', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'The two conditional errors'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'lam', label:'$\\lambda$', min:-1, max:1, step:0.05, v:0, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figErrors,
      caption:'Drag the threshold $\\lambda$. The receiver decides $s_1$ when $y>\\lambda$. Each red area is one conditional error. One grows as the other shrinks.'},
    {t:'legend', items:[['mid','$f_Y(y\\mid s_0)$',true],['mid','$f_Y(y\\mid s_1)$'],['err','error']], at:'tr'}
  ], right:[
    {t:'eq', label:'Error given $s_0$', tex:'\\begin{aligned}P(\\text{err}\\mid s_0)&=\\int_{\\lambda}^{\\infty}\\frac{1}{\\sqrt{\\pi N_0}}\\,e^{-(y+\\sqrt{E_b})^{2}/N_0}\\,dy\\\\&=\\int_{(\\lambda+\\sqrt{E_b})/\\sigma}^{\\infty}\\frac{1}{\\sqrt{2\\pi}}\\,e^{-z^{2}/2}\\,dz\\\\&=Q\\!\\left(\\frac{\\lambda+\\sqrt{E_b}}{\\sigma}\\right)\\end{aligned}',
      note:'Substitute $z=(y+\\sqrt{E_b})/\\sigma$ with $\\sigma=\\sqrt{N_0/2}$. The lower limit $y=\\lambda$ becomes $z=(\\lambda+\\sqrt{E_b})/\\sigma$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Error given $s_1$', tex:'P(\\text{err}\\mid s_1)=\\int_{-\\infty}^{\\lambda}f_Y(y\\mid s_1)\\,dy=Q\\!\\left(\\frac{\\sqrt{E_b}-\\lambda}{\\sigma}\\right)',
        note:'The same substitution with $z=(\\sqrt{E_b}-y)/\\sigma$. Here $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$E_b=1$, $\\sigma=0.5$ and $\\lambda=0$.<div class="nsep"></div>What is $P(\\text{err}\\mid s_0)$?',
        ask:{key:'m2-errors', choices:['$0.0013$','$0.0228$','$0.159$'], answer:1,
          why:'$Q\\bigl((0+1)/0.5\\bigr)=Q(2)=0.0228$.'}}]}
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
    {t:'legend', items:[['mid','$0.7\\,f_Y(y\\mid s_0)$',true],['mid','$0.3\\,f_Y(y\\mid s_1)$'],['err','$P_e$']], at:'tr'}
  ], right:[
    {t:'eq', label:'Minimise the average error', tex:'\\begin{aligned}P_e(\\lambda)&=p_0\\,P(\\text{err}\\mid s_0)+p_1\\,P(\\text{err}\\mid s_1)\\\\\\frac{dP_e}{d\\lambda}&=-p_0\\,f_Y(\\lambda\\mid s_0)+p_1\\,f_Y(\\lambda\\mid s_1)=0\\end{aligned}',
      note:'$p_0$ and $p_1$ are the priors. Differentiate each integral with respect to its limit $\\lambda$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Solve for $\\lambda$', key:true, result:true, tex:'\\begin{aligned}p_0\\,e^{-(\\lambda+\\sqrt{E_b})^{2}/N_0}&=p_1\\,e^{-(\\lambda-\\sqrt{E_b})^{2}/N_0}\\\\4\\lambda\\sqrt{E_b}&=N_0\\ln\\frac{p_0}{p_1}\\\\\\lambda_{\\mathrm{opt}}&=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}\\end{aligned}',
        note:'Cancel the common factor $1/\\sqrt{\\pi N_0}$, take logarithms, then expand the two squares.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$p_0=0.7$, $E_b=1$ and $N_0=0.5$.<div class="nsep"></div>What is $\\lambda_{\\mathrm{opt}}$?',
        ask:{key:'m2-threshold', choices:['$-0.106$','$0$','$0.106$'], answer:2,
          why:'$\\lambda_{\\mathrm{opt}}=\\frac{0.5}{4}\\ln\\frac{0.7}{0.3}=0.125(0.847)=0.106$. It moves toward the less likely symbol.'}}]}
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
    {t:'legend', items:[['mid','$p_0\\,f_Y(y\\mid s_0)$',true],['mid','$p_1\\,f_Y(y\\mid s_1)$']], at:'tr'}
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
  keywords:'Q function gaussian tail erfc complementary error function standard normal table values',
  src:'CH8 s.29–31', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'The Q function'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'x', label:'$x$', min:0, max:3.5, step:0.1, v:1, show:v=>'$'+v.toFixed(1)+'$'}]},
      svg:figQ,
      caption:'Drag $x$. $Q(x)$ is the shaded area under the standard normal density to the right of $x$.'}
  ], right:[
    {t:'eq', label:'Definition', key:true, tex:'Q(x)=\\frac{1}{\\sqrt{2\\pi}}\\int_{x}^{\\infty}e^{-z^{2}/2}\\,dz=\\tfrac12\\operatorname{erfc}\\!\\left(\\frac{x}{\\sqrt2}\\right)',
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
  src:'CH8 s.29–31', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision and its error'},
  {t:'title', text:'The bit error probability'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'dB', label:'$E_b/N_0$', min:0, max:12, step:0.2, v:9.6, show:v=>'$'+v.toFixed(1)+'$ dB'}]},
      svg:figPe,
      caption:'Drag $E_b/N_0$. The error probability falls slowly at low $E_b/N_0$ and steeply at high $E_b/N_0$.'}
  ], right:[
    {t:'eq', label:'Equal priors', tex:'\\begin{aligned}P_b&=\\tfrac12\\,Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)+\\tfrac12\\,Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)=Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)\\\\\\frac{\\sqrt{E_b}}{\\sigma}&=\\frac{\\sqrt{E_b}}{\\sqrt{N_0/2}}=\\sqrt{\\frac{2E_b}{N_0}}\\end{aligned}',
      note:'Put $\\lambda=0$ in both conditional errors. The two are equal.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Polar signalling', key:true, result:true, tex:'P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)',
        note:'$2E_b/N_0$ is the peak SNR of the matched filter, so $P_b=Q\\bigl(\\sqrt{\\eta_{\\max}}\\bigr)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$E_b/N_0=4$, which is $6.02$ dB.<div class="nsep"></div>What is $P_b$?',
        ask:{key:'m2-pe', choices:['$2.3\\times10^{-2}$','$2.3\\times10^{-3}$','$3.2\\times10^{-5}$'], answer:1,
          why:'$P_b=Q(\\sqrt{8})=Q(2.83)=2.3\\times10^{-3}$. Dropping the $2$ gives $Q(2)=2.3\\times10^{-2}$.'}}]}
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
    {t:'legend', items:[['mid','$0.7\\,f_Y(y\\mid s_0)$',true],['mid','$0.3\\,f_Y(y\\mid s_1)$']], at:'tc'}
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
{ id:'m2-isi', module:'M2', nav:'Intersymbol interference', title:'Intersymbol interference',
  objective:'Show how a bandlimited channel spreads each bit into the next ones.',
  keywords:'intersymbol interference bandlimited channel rc lowpass time constant pulse spreading tail',
  src:'CH8 s.35–37', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'Intersymbol interference'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['one bit','its response','six bits','their sum']},
      svg:figIsiBuild,
      caption:'Step through the frames. An RC channel with $BT_b=0.25$ stretches each bit into the next ones. The received samples are the sum of all the tails.'},
    {t:'legend', items:[['in','sent'],['mid','one response each',true,2,2],['out','received']], at:'tr'}
  ], right:[
    {t:'eq', label:'The RC channel', tex:'H(f)=\\frac{1}{1+jf/B},\\qquad h(t)=\\frac{1}{\\tau}e^{-t/\\tau}\\ (t\\ge0),\\qquad\\tau=\\frac{1}{2\\pi B}',
      note:'$B$ is the $3$ dB bandwidth. The channel responds to a sudden change with a time constant $\\tau$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'One bit', tex:'\\begin{aligned}r(t)&=1-e^{-t/\\tau},\\quad 0\\le t\\le T_b\\\\r(T_b)&=1-q,\\qquad q=e^{-T_b/\\tau}=e^{-2\\pi BT_b}\\end{aligned}',
        note:'The response of a unit bit on $[0,T_b]$. It never reaches $1$ inside the bit, and it decays after it.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The channel has $BT_b=0.25$.<div class="nsep"></div>What fraction of its own level does a bit reach by the end of the bit?',
        ask:{key:'m2-isi', choices:['$0.208$','$0.792$','$1$'], answer:1,
          why:'$q=e^{-2\\pi(0.25)}=e^{-\\pi/2}=0.208$, so $r(T_b)=1-q=0.792$.'}}]}
  ]}
]},

{ id:'m2-isi-term', module:'M2', nav:'The interference term', title:'The interference term',
  objective:'Write each sample as its own bit plus the tails of all earlier bits.',
  keywords:'intersymbol interference term sample sum of tails geometric series worst case q',
  src:'CH8 s.35–37', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'The interference term'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figIsiTerm,
      caption:'The bits $0,0,0,1$ after a line idle at the level of a $0$, with $BT_b=0.25$. The lower panel splits the last sample into its own share and the tails of earlier bits.'},
    {t:'legend', items:[['mid','own bit'],['err','earlier bits']], at:'tl-axis'}
  ], right:[
    {t:'eq', label:'One sample', tex:'y_k=a_k(1-q)+\\sum_{m=1}^{\\infty}a_{k-m}\\,(1-q)\\,q^{m},\\qquad a_k=\\pm1',
      note:'After its bit, a response decays as $(1-q)e^{-(t-T_b)/\\tau}$. One bit later that is $(1-q)q$, $m$ bits later $(1-q)q^{m}$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Worst case', tex:'\\sum_{m=1}^{\\infty}(1-q)\\,q^{m}=(1-q)\\,\\frac{q}{1-q}=q',
        note:'The geometric series. When every earlier bit has the opposite sign, the sample shrinks from $1-q$ to $1-2q$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$BT_b=0.25$. A $1$ follows a long run of $0$s.<div class="nsep"></div>What is the sample at the end of the $1$?',
        ask:{key:'m2-isi-term', choices:['$0.584$','$0.792$','$1$'], answer:0,
          why:'All earlier bits are $-1$, so $y=(1-q)-q=1-2q=1-2(0.208)=0.584$.'}}]}
  ]}
]},

{ id:'m2-ex-isi', module:'M2', nav:'Worked example · a bit pattern', title:'Worked example: the samples of a bit pattern',
  objective:'Sketch the channel output for a bit pattern and compute one sample with its interference.',
  keywords:'worked example intersymbol interference bit pattern rc channel sample sketch -0.588',
  src:'CH8 s.35–37', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Worked example'},
  {t:'title', text:'Worked example: the samples of a bit pattern'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Sketch $y(t)$ on the axes, then check it.'}, svg:figExIsi,
      caption:'The dashed trace is the sent pattern. Draw the channel output and mark its value at the end of each bit, then show the answer.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'Bits $0\\,0\\,0\\,1\\,1\\,1\\,0\\,1$ after a line idle at a $0$. $BT_b=0.25$, so $q=0.208$.<div class="nsep"></div>Find the sample at the end of the seventh bit.',
      ask:{key:'m2-ex-isi', choices:['$-0.792$','$-0.588$','$+0.208$'], answer:1,
        why:'$y_7=-1+2q-2q^{4}=-1+0.416-0.004=-0.588$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'y_7=-(1-q)+(1-q)(q+q^{2}+q^{3})-(1-q)\\sum_{m=4}^{\\infty}q^{m}',
        note:'The own bit, the three $1$s, then every earlier bit and the idle line, all $-1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}y_7&=-(1-q)+(q-q^{4})-q^{4}\\\\&=-1+2q-2q^{4}\\\\&=-1+2(0.2079)-2(0.0019)=-0.588\\end{aligned}',
        note:'Check: the sample is negative, so the $0$ is still decided correctly.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use the full history, not only the previous bit.'}]}
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
      frames:{labels:['one trace','$5$ traces','$25$ traces','all $128$ patterns']},
      svg:figEyeBuild,
      caption:'Step through the frames. Each trace is the received waveform over two bits, centred on a sampling instant, for $BT_b=0.3$. Laid on top of each other they form the eye.'}
  ], right:[
    {t:'note', kind:'def', head:'Eye diagram', html:'Cut the received waveform into pieces $2T_b$ long, centred on the sampling instants, and draw them all on one axis.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Opening', tex:'\\min_{\\text{patterns}}|y_k|=(1-q)-q=1-2q,\\qquad\\text{opening}=2(1-2q)',
        note:'The vertical gap at the sampling instant. The worst pattern has every earlier bit opposite to the current one.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The RC channel has $BT_b=0.3$.<div class="nsep"></div>What is the eye opening at the sampling instant?',
        ask:{key:'m2-eye', choices:['$0.70$','$1.39$','$1.70$'], answer:1,
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
{ id:'m2-nyq-sinc', module:'M2', nav:'A pulse with zero interference', title:'A pulse with zero interference',
  objective:'Show that the sinc pulse is zero at every other sampling instant.',
  keywords:'sinc pulse zero crossings sampling instants zero intersymbol interference ideal nyquist pulse',
  src:'CH8 s.42–45', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'A pulse with zero interference'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSincTrain,
      caption:'$p(t)=\\operatorname{sinc}(t/T_b)$ with two of its neighbours. At every sampling instant only one pulse is non-zero.'},
    {t:'legend', items:[['in','$p(t)$'],['in','neighbours',true],['mid','samples','dot']], at:'tr'}
  ], right:[
    {t:'eq', label:'Zero interference', tex:'p(kT_b)=\\begin{cases}1,&k=0\\\\0,&k\\neq0\\end{cases}',
      note:'A pulse with this property adds nothing to the samples of its neighbours, however long it lasts.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The sinc pulse', tex:'p(t)=\\operatorname{sinc}\\!\\left(\\frac{t}{T_b}\\right),\\qquad p(kT_b)=\\frac{\\sin(\\pi k)}{\\pi k}=0\\quad(k\\neq0)',
        note:'Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$, and $\\operatorname{sinc}(0)=1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$p(t)=\\operatorname{sinc}(t/T_b)$ with $T_b=0.1$ ms.<div class="nsep"></div>Where is $p(t)=0$?',
        ask:{key:'m2-nyq-sinc', choices:['every $0.1$ ms except $t=0$','every $0.05$ ms','nowhere'], answer:0,
          why:'$\\operatorname{sinc}(t/T_b)=0$ at $t/T_b=\\pm1,\\pm2,\\ldots$, that is every $0.1$ ms except $t=0$.'}}]}
  ]}
]},

{ id:'m2-nyquist', module:'M2', nav:'Nyquist\'s criterion', title:'Nyquist\'s criterion for zero intersymbol interference',
  objective:'State the zero-interference condition in frequency: the shifted copies of P(f) add to a constant.',
  keywords:'nyquist criterion zero isi spectrum copies sum constant sampled pulse replication',
  src:'CH8 s.42–45', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Nyquist\'s criterion for zero intersymbol interference'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$P(f)$','copies at $\\pm R_b$','copies at $\\pm2R_b$','their sum']},
      svg:figTiling,
      caption:'Step through the frames for a triangular $P(f)$ of width $2R_b$. The copies at multiples of $R_b$ add to a constant, so $p(t)$ has zero interference.'},
    {t:'legend', items:[['in','$P(f)$'],['mid','copies',true,1],['mid','sum of copies',0,3]], at:'tr'}
  ], right:[
    {t:'eq', label:'Sample the pulse', tex:'\\begin{aligned}p_\\delta(t)&=\\sum_{k}p(kT_b)\\,\\delta(t-kT_b)\\\\P_\\delta(f)&=R_b\\sum_{n}P(f-nR_b)\\end{aligned}',
      note:'The second line is the replication result of Module 1, with $f_s=R_b=1/T_b$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Nyquist\'s criterion', key:true, result:true, tex:'p(kT_b)=\\delta[k]\\iff\\sum_{n=-\\infty}^{\\infty}P(f-nR_b)=T_b',
        note:'Zero interference makes $p_\\delta(t)=\\delta(t)$, whose transform is $1$. Divide by $R_b$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$P(f)=T_b(1-|f|/R_b)$ for $|f|<R_b$, so $p(t)=\\operatorname{sinc}^{2}(t/T_b)$.<div class="nsep"></div>What is $p(T_b)$?',
        ask:{key:'m2-nyquist', choices:['$0$','$0.5$','$1$'], answer:0,
          why:'The copies add to $T_b$, so the criterion holds. Directly, $\\operatorname{sinc}^{2}(1)=0$.'}}]}
  ]}
]},

{ id:'m2-nyq-channel', module:'M2', nav:'The minimum bandwidth', title:'The minimum bandwidth',
  objective:'Show that zero interference needs a bandwidth of at least R_b/2.',
  keywords:'nyquist bandwidth minimum R_b/2 ideal rectangular spectrum gaps copies',
  src:'CH8 s.42–45', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The minimum bandwidth'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figNyqChannel,
      caption:'The rectangle of width $2W=R_b$ and its copies at multiples of $R_b$. They meet edge to edge and fill the axis with no gap.'},
    {t:'legend', items:[['in','$P(f)$'],['mid','copies',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Nyquist bandwidth', key:true, result:true, tex:'B_T\\ge W=\\frac{R_b}{2}',
      note:'If $P(f)=0$ for $|f|>B_T$ with $B_T<R_b/2$, the copies leave gaps, and their sum cannot be constant.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'The only pulse at $B_T=W$', tex:'P(f)=\\frac{1}{2W}\\,\\Pi\\!\\left(\\frac{f}{2W}\\right)\\;\\leftrightarrow\\;p(t)=\\operatorname{sinc}(2Wt)=\\operatorname{sinc}\\!\\left(\\frac{t}{T_b}\\right)',
        note:'$\\Pi(f/2W)$ is $1$ for $|f|<W$. The sinc pulse of the last slide is this pulse.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A link sends $R_b=64$ kb/s.<div class="nsep"></div>What is the smallest bandwidth with zero interference?',
        ask:{key:'m2-nyq-channel', choices:['$32$ kHz','$64$ kHz','$128$ kHz'], answer:0,
          why:'$W=R_b/2=64/2=32$ kHz.'}}]}
  ]}
]},

{ id:'m2-sinc-timing', module:'M2', nav:'Timing and the sinc pulse', title:'Timing and the sinc pulse',
  objective:'Show why the sinc pulse is impractical: a small timing error collects interference from many neighbours.',
  keywords:'sinc pulse timing error jitter slow decay 1/t tails harmonic series non causal',
  src:'CH8 s.42–45', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Timing and the sinc pulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'eps', label:'$\\epsilon/T_b$', min:0, max:0.4, step:0.02, v:0.1, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figSincOffset,
      caption:'Drag the timing error $\\epsilon$. Each red stem is a neighbour\'s contribution to a sample taken $\\epsilon$ late. The sum at the top grows quickly with $\\epsilon$.'},
    {t:'legend', items:[['in','$p(t)$'],['mid','wanted term'],['err','interference']], at:'tr'}
  ], right:[
    {t:'eq', label:'A late sample', tex:'y_0=a_0\\operatorname{sinc}\\!\\left(\\frac{\\epsilon}{T_b}\\right)+\\sum_{k\\neq0}a_k\\operatorname{sinc}\\!\\left(k+\\frac{\\epsilon}{T_b}\\right)',
      note:'Sample at $t=\\epsilon$ instead of $t=0$. Every neighbour now adds a small term.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Slow tails', html:'The terms fall only as $1/(\\pi|k|)$. The sum of their sizes behaves like $\\sum1/k$, which grows without bound. A sinc pulse also lasts forever in both directions.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The sample is taken $\\epsilon=0.1T_b$ late.<div class="nsep"></div>What is the wanted term, $\\operatorname{sinc}(0.1)$?',
        ask:{key:'m2-sinc-timing', choices:['$0.984$','$0.9$','$0.5$'], answer:0,
          why:'$\\sin(0.1\\pi)/(0.1\\pi)=0.309/0.314=0.984$. The wanted term barely drops. The interference is the problem.'}}]}
  ]}
]},

{ id:'m2-rcos', module:'M2', nav:'The raised cosine', title:'The raised-cosine spectrum',
  objective:'Define the raised-cosine spectrum and its bandwidth, and check it against Nyquist\'s criterion.',
  keywords:'raised cosine spectrum roll off factor alpha transmission bandwidth W(1+alpha) nyquist criterion',
  src:'CH8 s.46–48', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The raised-cosine spectrum'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'al', label:'$\\alpha$', min:0, max:1, step:0.05, v:0.5, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figRcSpec,
      caption:'Drag the roll-off $\\alpha$. The spectrum widens from $W$ to $W(1+\\alpha)$. The copies still add to a constant for every $\\alpha$.'},
    {t:'legend', items:[['in','$P(f)$'],['mid','copies',true],['mid','sum of copies']], at:'tr'}
  ], right:[
    {t:'eq', label:'Raised-cosine spectrum', tex:'P(f)=\\begin{cases}\\dfrac{1}{2W},&|f|<f_1\\\\[4pt]\\dfrac{1}{4W}\\Bigl[1+\\cos\\dfrac{\\pi(|f|-f_1)}{2W-2f_1}\\Bigr],&f_1\\le|f|<2W-f_1\\\\[4pt]0,&|f|\\ge2W-f_1\\end{cases}',
      note:'$W=R_b/2$ and $f_1=W(1-\\alpha)$. The roll-off factor $\\alpha$ runs from $0$ to $1$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Bandwidth', key:true, result:true, tex:'B_T=2W-f_1=W(1+\\alpha)=\\frac{R_b}{2}(1+\\alpha)',
        note:'$\\alpha=0$ is the rectangle, $B_T=W$. $\\alpha=1$ doubles the bandwidth to $R_b$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$W=5$ kHz and $\\alpha=0.25$.<div class="nsep"></div>What is $B_T$?',
        ask:{key:'m2-rcos', choices:['$5$ kHz','$6.25$ kHz','$10$ kHz'], answer:1,
          why:'$B_T=W(1+\\alpha)=5(1.25)=6.25$ kHz.'}}]}
  ]}
]},

{ id:'m2-rcos-pulse', module:'M2', nav:'The raised-cosine pulse', title:'The raised-cosine pulse',
  objective:'Write the raised-cosine pulse in time and see how the roll-off shortens its tails.',
  keywords:'raised cosine pulse time domain zero crossings tails decay 1/t^3 roll off',
  src:'CH8 s.46–48', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The raised-cosine pulse'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'al', label:'$\\alpha$', min:0, max:1, step:0.05, v:0.5, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figRcPulse,
      caption:'Drag $\\alpha$. The zeros at $t=kT_b$ stay where they are. A larger $\\alpha$ makes the tails die out sooner.'},
    {t:'legend', items:[['in','raised cosine'],['in','sinc',true],['mid','samples','dot']], at:'tr'}
  ], right:[
    {t:'eq', label:'The pulse', tex:'p(t)=\\operatorname{sinc}\\!\\left(\\frac{t}{T_b}\\right)\\frac{\\cos(\\pi\\alpha t/T_b)}{1-4\\alpha^{2}t^{2}/T_b^{2}}',
      note:'The sinc factor keeps the zeros at $t=kT_b$. Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Faster decay', html:'For $\\alpha>0$ the second factor falls as $1/t^{2}$, so the tails fall as $1/|t|^{3}$. A timing error then collects little interference.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The roll-off is $\\alpha=1$.<div class="nsep"></div>What is $p(1.5T_b)$?',
        ask:{key:'m2-rcos-pulse', choices:['$0$','$-0.21$','$0.5$'], answer:0,
          why:'$\\cos(1.5\\pi)=0$ and the denominator $1-4(2.25)=-8$ is not zero, so $p(1.5T_b)=0$.'}}]}
  ]}
]},

{ id:'m2-ex-rc', module:'M2', nav:'Worked example · a raised-cosine link', title:'Worked example: a raised-cosine link',
  objective:'Find the Nyquist bandwidth, the flat band and the transmission bandwidth of a raised-cosine link.',
  keywords:'worked example raised cosine 20 kb/s roll off 0.5 bandwidth 15 kHz sketch spectrum',
  src:'CH8 s.46–48', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Worked example'},
  {t:'title', text:'Worked example: a raised-cosine link'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Sketch $2W\\,P(f)$ on the axes, then check it.'}, svg:figExRc,
      caption:'The dashed trace is the ideal rectangle of width $2W$. Draw the raised-cosine spectrum with $\\alpha=0.5$, then show the answer.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'A link sends $R_b=20$ kb/s with raised-cosine pulses and $\\alpha=0.5$.<div class="nsep"></div>Find $W$, $f_1$ and $B_T$.',
      ask:{key:'m2-ex-rc', choices:['$10$ kHz','$15$ kHz','$20$ kHz'], answer:1,
        why:'$W=10$ kHz, so $B_T=W(1+\\alpha)=10(1.5)=15$ kHz.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'W=\\frac{R_b}{2},\\qquad f_1=W(1-\\alpha),\\qquad B_T=W(1+\\alpha)',
        note:'The spectrum is flat up to $f_1$ and falls to zero at $B_T$, with its half-height point at $W$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}W&=20/2=10\\ \\text{kHz}\\\\f_1&=10(1-0.5)=5\\ \\text{kHz}\\\\B_T&=10(1+0.5)=15\\ \\text{kHz}\\end{aligned}',
        note:'Check: $B_T-W=W-f_1=5$ kHz, so the roll-off is symmetric about $W$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $W=R_b/2=10$ kHz, not $R_b=20$ kHz. The wrong $W$ gives $B_T=30$ kHz, twice the true value.'}]}
  ]}
]},

{ id:'m2-srrc', module:'M2', nav:'Splitting the filter', title:'Splitting the raised cosine',
  objective:'Split the raised cosine between transmitter and receiver so the receiver is also a matched filter.',
  keywords:'root raised cosine square root split transmit receive filter matched filter zero isi',
  src:'CH8 s.46–48', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Splitting the raised cosine'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSrrc,
      caption:'The raised cosine with $\\alpha=0.5$ and its square root. Two square-root filters in a row give the raised cosine.'},
    {t:'legend', items:[['in','$2W\\,P(f)$'],['h','$\\sqrt{2W\\,P(f)}$',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Split', tex:'H_T(f)\\,H_R(f)=P(f),\\qquad H_T(f)=H_R(f)=\\sqrt{P(f)}',
      note:'$H_T$ shapes the pulse at the transmitter and $H_R$ filters at the receiver. Their product must meet Nyquist\'s criterion.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Matched and free of interference', html:'$H_R=H_T^{*}$ for a real, even $\\sqrt{P(f)}$, so the receive filter is matched to the pulse. The link then has both the smallest $P_b$ and zero interference.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\alpha=0.5$.<div class="nsep"></div>What is $\\sqrt{2W\\,P(f)}$ at $f=W$?',
        ask:{key:'m2-srrc', choices:['$0.5$','$0.707$','$1$'], answer:1,
          why:'At $f=W$ the raised cosine is at half height, $2W\\,P(W)=0.5$, and $\\sqrt{0.5}=0.707$.'}}]}
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
  /* Twelve results as prompts, in the order of the module: the student answers
     each one aloud, then opens the card. */
  {t:'raw', html:()=>RECALL.deck('m2', [
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
     a:'The Gaussian tail $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$: the chance that a unit Gaussian exceeds $x$.'},
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
