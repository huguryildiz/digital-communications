/* ==========================================================================
   Module 2 — section 2.1, random signals.

   A short section ahead of the matched filter. The receiver of this module
   works against noise, and noise is a random signal, so the section gathers
   the few facts about random signals the rest of the module uses: the
   ensemble, the mean and the autocorrelation, stationarity and power, the
   power spectral density, white noise, a random signal through a linear
   filter, filtered white noise and the Gaussian noise sample at a filter
   output. Each slide carries one animated or live figure and the mathematics
   it needs, and the section closes, like every teaching section, on a
   gallery, a laboratory and a code page.

   The scenes are kept in their own file, beside `83_scenes_m2.js` and
   `88_scenes_m2x.js`, with the few helpers they need copied rather than
   shared. Addresses and anchors live in `89_sections.js`.

   Colour, as in the rest of the module: cyan the random signal under study
   (a sample function of the input process, and its spectrum), amber a
   filter, green a filter output, violet an ensemble statistic (a histogram,
   an autocorrelation, an estimate, a density), red an error. Noise that only
   disturbs something else takes no colour.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

const SZ  = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const EXO = o => Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3}, o);
const sinc = x => Math.abs(x)<1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
const clamp01 = x => Math.max(0, Math.min(1, x));
const frameOf = (v, last) => v && v.frame!=null ? v.frame : last;
const val = (v, k, d) => v && v[k]!=null ? v[k] : d;
/* Stacked panels, one <svg> each inside the figure's own. A stacked figure
   that grows hands the extra height to one panel. */
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };
const extraHeight = base => { const H = P.hOverride; P.hOverride = null; return H ? Math.max(0, H-base) : 0; };
/* A 160-high strip panel keeps no data area once the phone draws its labels
   larger, so it takes more height there. */
const TOPH = () => P.labelScale() > 1 ? 250 : 160;
const fade = (a, op, draw) => { if(op < 0.01) return; a.raw(`<g opacity="${op.toFixed(3)}">`); draw(); a.raw('</g>'); };

/* A seeded generator, so every noise figure is the same figure on every
   machine and in every render. mulberry32, as in the rest of the module. */
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }
function noiseFn(seed, dt, s, t0=-2, t1=40){
  const n = gauss(seed, Math.ceil((t1-t0)/dt)+2, s);
  return t => { const x = (t-t0)/dt, k = Math.max(0, Math.min(n.length-2, Math.floor(x))), f = x-k,
    w = (1-Math.cos(Math.PI*f))/2; return (1-w)*n[k] + w*n[k+1]; };
}
/* A stationary Gaussian process with R(tau) = exp(-|tau|/tc) and unit power,
   sampled every dt: x[k+1] = a x[k] + sqrt(1-a^2) z[k], a = exp(-dt/tc). The
   first value is drawn from the stationary density, so every time is alike. */
function ou(z, dt, tc){ const a = Math.exp(-dt/tc), b = Math.sqrt(1-a*a), x = [z[0]];
  for(let k=1;k<z.length;k++) x.push(a*x[k-1] + b*z[k]); return x; }
const path = (x, dt, t1) => t => { if(t < 0 || t > t1) return NaN;
  const u = t/dt, k = Math.max(0, Math.min(x.length-2, Math.floor(u))), f = u-k; return x[k]*(1-f) + x[k+1]*f; };
const dN = x => Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);

/* ---- A random signal ----------------------------------------------------
   Eight sample functions of one process (R(tau) = exp(-|tau|/0.4 ms)), drawn
   over 9 ms, the values of all eight at t0 = 5 ms, and a histogram of X(t0)
   over 2000 outcomes on its side, with the unit Gaussian density it follows. */
const EN_DT = 0.02, EN_T1 = 9, EN_T0 = 5;
const EN_P = [0,1,2,3,4,5,6,7].map(i=>ou(gauss(20260401+i, 451, 1), EN_DT, 0.4));
const EN_BW = 0.25, EN_LO = -3.25;
const EN_H = (()=>{ const c = Array(26).fill(0);
  gauss(20260411, 2000, 1).forEach(x=>{ const k = Math.floor((x-EN_LO)/EN_BW); if(k>=0 && k<26) c[k]++; }); return c; })();
function figEnsemble(v){
  const f = frameOf(v, 5), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2), o4 = clamp01(f-3), o5 = clamp01(f-4);
  const a = P.Axes(SZ({xr:[0,13.4], yr:[-3.5,4.1], xlabel:'t\\;(\\text{ms})', ylabel:'X(t)',
    xticksOverride:[0,2,4,6,8], yticksOverride:[-2,0,2]}));
  /* frames 2 and 3: a second and then a third recording laid over the first, in three hues;
     frame 4: all eight, the extra ones faint */
  [[1,o1],[2,o2]].forEach(([i,o])=>fade(a, o*(1-o3), ()=>a.curve(path(EN_P[i], EN_DT, EN_T1), {color:[C.in, C.h, C.err][i], width:1.9, n:700})));
  fade(a, 0.32*o3, ()=>{ for(let i=1;i<8;i++) a.curve(path(EN_P[i], EN_DT, EN_T1), {color:C.in, width:0.9, n:700}); });
  a.curve(path(EN_P[0], EN_DT, EN_T1), {color:C.in, width:2.9, n:900});
  fade(a, o4, ()=>{
    a.poly([[EN_T0,-3.5],[EN_T0,3.2]], {color:C.mid, width:1.6, dash:'5 4'});
    EN_P.forEach((x,i)=>{ const y = path(x, EN_DT, EN_T1)(EN_T0); a.point(EN_T0, y, {color:C.mid, r:4.2}); });
    a.note(EN_T0, 3.55, 't_0', {tex:true, fs:15, color:C.mid, anchor:'middle'});
  });
  if(o5 > 0.01){
    const X0 = 9.7, L = 3.2/Math.max(...EN_H);
    EN_H.forEach((c,k)=>{ if(c) a.rect(X0, EN_LO+k*EN_BW+0.015, X0+L*c*o5, EN_LO+(k+1)*EN_BW-0.015, {fill:C.dec.mid, stroke:C.mid, width:1}); });
    fade(a, o5, ()=>{
      const pts = []; for(let i=0;i<=120;i++){ const y = -3.3+6.6*i/120; pts.push([X0+L*2000*EN_BW*dN(y), y]); }
      a.poly(pts, {color:C.mid, width:2.4});
      a.note(13.3, 3.55, 'f_{X(t_0)}(x)', {tex:true, fs:15, color:C.mid, anchor:'end'});
    });
  }
  return a.svg();
}

/* ---- Mean and autocorrelation ---------------------------------------------
   Three sample functions of the process with R(tau) = exp(-|tau|/tc), tc =
   1 ms, read at t = 1.5 ms and at t + tau. The scatter is 300 pairs of that
   process, X(t) and X(t + tau), drawn exactly: X(t + tau) = rho X(t) +
   sqrt(1 - rho^2) Z with rho = R(tau), from the same seeds for every tau, so
   the cloud turns smoothly as the slider moves. */
const AC_DT = 0.02, AC_TC = 1, AC_T1 = 1.5;
const AC_P = [0,1,2].map(i=>ou(gauss(20260421+i, 301, 1), AC_DT, AC_TC));
const AC_Z1 = gauss(20260431, 300, 1), AC_Z2 = gauss(20260432, 300, 1);
function figAcf(v){
  const tau = val(v, 'tau', 0.5), rho = Math.exp(-tau/AC_TC), s = Math.sqrt(1-rho*rho);
  const hA = TOPH()+50, hB = 270 + extraHeight(hA+270);
  const a = P.Axes({w:560, h:hA, xr:[0,6], yr:[-2.4,4.2], xlabel:'t\\;(\\text{ms})', ylabel:'x(t)',
    pad:{l:56,r:26,t:22,b:40}, xticksOverride:[0,1,2,3,4,5,6], yticksOverride:[-2,0,2,4]});
  /* three sample functions: three hues far apart, so each stays followable where they cross */
  AC_P.forEach((x,i)=>a.curve(path(x, AC_DT, 6), {color:[C.in, C.h, C.err][i], width:1.6, n:700}));
  [AC_T1, AC_T1+tau].forEach(t=>{ a.vline(t, {color:C.mid, dash:'5 4', width:1.4, opacity:0.9});
    AC_P.forEach(x=>a.point(t, path(x, AC_DT, 6)(t), {color:C.mid, r:4})); });
  const b = P.Axes({w:300, h:hB, xr:[-3.3,3.3], yr:[-3.3,3.3], xlabel:'X(t)', ylabel:'X(t+\\tau)',
    pad:{l:52,r:14,t:24,b:42}, xticksOverride:[-2,0,2], yticksOverride:[-2,0,2]});
  let sum = 0;
  AC_Z1.forEach((z,i)=>{ const y = rho*z + s*AC_Z2[i]; sum += z*y;
    if(Math.abs(z) < 3.25 && Math.abs(y) < 3.25)
      b.raw(`<circle cx="${b.sx(z).toFixed(2)}" cy="${b.sy(y).toFixed(2)}" r="2.6" fill="${C.mid}" opacity="0.6"/>`); });
  const c = P.Axes({w:260, h:hB, xr:[0,3.2], yr:[-0.08,1.32], xlabel:'\\tau\\;(\\text{ms})', ylabel:'R_X(\\tau)',
    pad:{l:48,r:18,t:24,b:42}, xticksOverride:[0,1,2,3], yticksOverride:[0,0.5,1]});
  c.curve(t=>Math.exp(-t/AC_TC), {color:C.mid, width:2.5, n:400});
  c.point(tau, rho, {color:C.mid, r:5.2});
  c.note(3.15, 1.17, `\\hat R_X(\\tau)=${(sum/AC_Z1.length).toFixed(2)}`, {tex:true, fs:15, color:C.ink, anchor:'end'});
  return `<svg viewBox="0 0 560 ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,560,hA)}${place(b.svg(),0,hA,300,hB)}${place(c.svg(),300,hA,260,hB)}</svg>`;
}

/* ---- Stationarity and power ------------------------------------------------
   R(tau) = 4 exp(-|tau|/2) cos(2 pi tau), tau in ms: the transform of each
   exponential factor is positive, so this is the autocorrelation of a real
   stationary process. Frame 1 marks R(0), frame 2 turns the right half over
   onto the left, frame 3 draws the bound |R(tau)| <= R(0). */
const RW = t => 4*Math.exp(-Math.abs(t)/2)*Math.cos(2*Math.PI*t);
function figWss(v){
  const f = frameOf(v, 3), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  const a = P.Axes(SZ({xr:[-3.2,3.2], yr:[-5.6,6], xlabel:'\\tau\\;(\\text{ms})', ylabel:'R_X(\\tau)\\;(\\text{V}^{2})',
    xticksOverride:[-3,-2,-1,0,1,2,3], yticksOverride:[-4,-2,2,4]}));
  fade(a, o3, ()=>{
    a.rect(-3.2, -4, 3.2, 4, {fill:C.dec.mid});
    /* the bound lines stop short of the axis, so the tick labels 4 and -4 stay clear of them */
    [4,-4].forEach(y=>[[-3.2,-0.45],[0.45,3.2]].forEach(([x0,x1])=>
      a.poly([[x0,y],[x1,y]], {color:C.slate, dash:'6 4', width:1.4, opacity:1})));
    a.note(3.15, -5.25, '|R_X(\\tau)|\\le R_X(0)', {tex:true, fs:15, color:C.slate, anchor:'end'});
  });
  if(o2 < 0.01 || o2 > 0.99) a.curve(RW, {color:C.mid, width:2.6, n:900});
  else {
    /* the left half, faint, and the right half turning over onto it */
    a.curve(t=>t<=0 ? RW(t) : NaN, {color:C.mid, width:1.4, dash:'4 5', n:450});
    a.curve(t=>t>=0 ? RW(t) : NaN, {color:C.mid, width:2.6, n:450});
    const c = Math.cos(Math.PI*o2), pts = [];
    for(let i=0;i<=450;i++){ const t = 3.2*i/450; pts.push([c*t, RW(t)]); }
    a.poly(pts, {color:C.mid, width:2.6});
  }
  fade(a, o2, ()=>a.note(-3.1, 5.25, 'R_X(-\\tau)=R_X(\\tau)', {tex:true, fs:15, color:C.mid}));
  fade(a, o1, ()=>{ a.point(0, 4, {color:C.mid, r:5.4});
    a.note(0.22, 5.25, 'R_X(0)=P_X=4', {tex:true, fs:15, color:C.mid}); });
  return a.svg();
}

/* ---- Worked example: a random phase ---------------------------------------
   A = 3, f0 = 1 kHz, t in ms. Keep the initial sine (theta = 3pi/2), then
   show five seeded uniform phase draws. Fade out one recording before fading
   in the next: interpolating phase would suggest a phase varying with time.
   Each complete recording has one fixed phase, amplitude and frequency. */
const EX_PHASES = (()=>{ const r=rng(20261014);
  return [3*Math.PI/2, ...Array.from({length:5}, ()=>2*Math.PI*r())]; })();
const exPhaseLabel = i => i===0 ? '\\theta=3\\pi/2' : '\\theta\\approx '+EX_PHASES[i].toFixed(2)+'\\;\\text{rad}';
function figExPhase(v){
  const f=Math.max(0,Math.min(EX_PHASES.length-1,frameOf(v,0))), lo=Math.floor(f), u=f-lo;
  const i=u<0.5 ? lo : Math.min(lo+1,EX_PHASES.length-1), op=Math.abs(2*u-1);
  const a=P.Axes(SZ({xr:[-1.6,1.6],yr:[-4,4],xlabel:'t\\;(\\text{ms})',ylabel:'X(t)\\;(\\text{V})',xticksOverride:[-1.5,-1,-0.5,0.5,1,1.5],yticksOverride:[-3,0,3]}));
  a.note(1.55,3.65,exPhaseLabel(i),{tex:true,fs:15,color:C.ink,anchor:'end'});
  fade(a,op,()=>a.curve(t=>3*Math.cos(2*Math.PI*t+EX_PHASES[i]),{color:C.in,width:2.6,n:700}));
  return a.svg();
}

/* ---- Power spectral density -----------------------------------------------
   R(tau) = exp(-|tau|/tc) with unit power, tau in ms, and its transform
   S(f) = 2 tc / (1 + (2 pi f tc)^2), f in kHz, so S is in V^2/kHz. The sample
   function is the same seeded draws filtered with each tc, so it roughens
   smoothly as tc falls. */
const PS_DT = 0.01, PS_Z = gauss(20260441, 1001, 1);
function figPsdR(v){
  const tc = val(v, 'tc', 0.3), hA = TOPH(), hB = 270 + extraHeight(hA+270);
  const S = f => 2*tc/(1+Math.pow(2*Math.PI*f*tc, 2));
  const a = P.Axes({w:560, h:hA, xr:[0,10], yr:[-3.4,3.4], xlabel:'t\\;(\\text{ms})', ylabel:'x(t)',
    pad:{l:56,r:26,t:22,b:40}, xticksOverride:[0,2,4,6,8,10], yticksOverride:[-2,0,2]});
  a.curve(path(ou(PS_Z, PS_DT, tc), PS_DT, 10), {color:C.in, width:1.5, n:1000});
  const b = P.Axes({w:280, h:hB, xr:[-2.2,2.2], yr:[-0.06,1.3], xlabel:'\\tau\\;(\\text{ms})', ylabel:'R_X(\\tau)',
    pad:{l:48,r:16,t:24,b:42}, xticksOverride:[-2,-1,0,1,2], yticksOverride:[0.5,1]});
  b.curve(t=>Math.exp(-Math.abs(t)/tc), {color:C.mid, width:2.5, n:900});
  const c = P.Axes({w:280, h:hB, xr:[-2.2,2.2], yr:[0,2.35], xlabel:'f\\;(\\text{kHz})', ylabel:'S_X\\;(\\text{V}^{2}/\\text{kHz})',
    pad:{l:48,r:16,t:24,b:42}, xticksOverride:[-2,-1,0,1,2], yticksOverride:[0.5,1,1.5,2]});
  c.area(S, -2.2, 2.2, {color:C.dec.in, n:600});
  c.curve(S, {color:C.in, width:2.6, n:900});
  c.note(2.15, 2.12, 'P_X=1', {tex:true, fs:15, color:C.ink, anchor:'end'});
  return `<svg viewBox="0 0 560 ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,560,hA)}${place(b.svg(),0,hA,280,hB)}${place(c.svg(),280,hA,280,hB)}</svg>`;
}

/* ---- White noise -----------------------------------------------------------
   Noise with density N0/2 on |f| < B, f in kHz. Its autocorrelation is
   N0 B sinc(2 B tau), drawn divided by R(0) = N0 B so the peak stays at one
   while the lobe narrows. The sample function is a sum of cosines at
   (k + 1/2) 50 Hz with seeded phases, every one below B, scaled to unit
   power, so widening the band adds components and keeps the old ones. */
const WH_DF = 0.05, WH_PH = (()=>{ const r = rng(20260451), o = []; for(let k=0;k<2400;k++) o.push(2*Math.PI*r()); return o; })();
function figWhite(v){
  const B = 0.5*Math.pow(200, val(v, 'B', 0.2616)), X = B > 8 ? 10*Math.ceil(1.25*B/10) : 10, hA = TOPH(), hB = 270 + extraHeight(hA+270);
  const K = Math.max(1, Math.floor(B/WH_DF - 0.5) + 1), g = Math.sqrt(2/K);
  const a = P.Axes({w:560, h:hA, xr:[0,3], yr:[-3.4,3.4], xlabel:'t\\;(\\text{ms})', ylabel:'x(t)/\\sigma',
    pad:{l:56,r:26,t:22,b:40}, xticksOverride:[0,0.5,1,1.5,2,2.5,3], yticksOverride:[-2,0,2]});
  a.curve(t=>{ let s = 0; for(let k=0;k<K;k++) s += Math.cos(2*Math.PI*(k+0.5)*WH_DF*t + WH_PH[k]); return g*s; },
    {color:C.in, width:1.4, n:Math.min(3000, Math.max(1200, Math.ceil(60*B)))});
  const b = P.Axes({w:280, h:hB, xr:[-1.2,1.2], yr:[-0.3,1.3], xlabel:'\\tau\\;(\\text{ms})', ylabel:'R_X(\\tau)/N_0B',
    pad:{l:48,r:16,t:24,b:42}, xticksOverride:[-1,0,1], yticksOverride:[0.5,1]});
  b.curve(t=>sinc(2*B*t), {color:C.mid, width:2.5, n:Math.min(8000, Math.max(1400, Math.ceil(48*B)))});
  const z = 1/(2*B);
  if(z <= 1.15){ [-z, z].forEach(t=>b.point(t, 0, {color:C.mid, r:4.4}));
    b.note(z+0.06, 0.16, '\\tfrac{1}{2B}', {tex:true, fs:15, color:C.mid}); }
  const c = P.Axes({w:280, h:hB, xr:[-X,X], yr:[0,1.45], xlabel:'f\\;(\\text{kHz})', ylabel:'S_X(f)',
    pad:{l:48,r:16,t:24,b:42}, xticksOverride:[-X,-X/2,0,X/2,X], yticksOverride:[1], ytickfmt:()=>''});
  c.poly([[-X,1],[X,1]], {color:C.in, width:1.4, dash:'4 5'});
  c.rect(-B, 0, B, 1, {fill:C.dec.in});
  c.poly([[-X,0],[-B,0],[-B,1],[B,1],[B,0],[X,0]], {color:C.in, width:2.6});
  c.note(-0.97*X, 1.16, '\\tfrac{N_0}{2}', {tex:true, fs:15, color:C.in});
  return `<svg viewBox="0 0 560 ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,560,hA)}${place(b.svg(),0,hA,280,hB)}${place(c.svg(),280,hA,280,hB)}</svg>`;
}

/* ---- A random signal through a filter ------------------------------------
   White noise with N0/2 = 0.5 into an RC lowpass filter with f3dB = 1 kHz,
   |H(f)|^2 = 1/(1 + f^2) with f in kHz. Frame 2 turns S_X into S_Y = |H|^2 S_X;
   frame 3 draws one input sample function and the filter's response to it,
   integrated with a step of 5 us. */
const LT_X = noiseFn(20260461, 0.02, 1, -0.5, 6);
const LT_Y = (()=>{ const rc = 1/(2*Math.PI), dt = 0.005, y = [0]; let v = 0;
  for(let k=1;k<=Math.round(6.5/dt);k++){ const t = -0.5 + k*dt; v += (LT_X(t)-v)*dt/rc; y.push(v); }
  return t => { const u = (t+0.5)/dt, k = Math.max(0, Math.min(y.length-2, Math.floor(u))), f = u-k; return y[k]*(1-f) + y[k+1]*f; }; })();
function figLti(v){
  const f = frameOf(v, 3), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  const h2 = TOPH(), h1b = P.labelScale() > 1 ? 320 : 230, h1 = h1b + extraHeight(h1b+h2);
  const H2 = x => 1/(1+x*x);
  const a = P.Axes({w:560, h:h1, xr:[-5,5], yr:[0,2.05], xlabel:'f\\;(\\text{kHz})', ylabel:'S(f),\\;|H(f)|^{2}',
    pad:{l:56,r:26,t:24,b:42}, xticksOverride:[-4,-2,0,2,4], yticksOverride:[]});
  a.curve(()=>0.5, {color:C.in, width:o2 > 0.01 ? 1.5 : 2.6, dash:o2 > 0.01 ? '6 5' : null, n:4});
  fade(a, o1, ()=>a.curve(H2, {color:C.h, width:2.2, dash:'7 5', n:600}));
  a.note(-4.9, 0.63, '\\tfrac{N_0}{2}', {tex:true, fs:15, color:C.in});
  fade(a, o2, ()=>{ const Sy = x => 0.5*(1-o2 + o2*H2(x));
    a.area(Sy, -5, 5, {color:C.dec.out, n:400}); a.curve(Sy, {color:C.out, width:2.6, n:600}); });
  const b = P.Axes({w:560, h:h2, xr:[0,5], yr:[-3.2,3.2], xlabel:'t\\;(\\text{ms})', ylabel:'x(t),\\;y(t)',
    pad:{l:56,r:26,t:22,b:40}, xticksOverride:[0,1,2,3,4,5], yticksOverride:[-2,0,2]});
  b.curve(LT_X, {color:C.in, width:o3 > 0.01 ? 1.1 : 1.5, n:1200, opacity:o3 > 0.01 ? 0.55 : null});
  fade(b, o3, ()=>b.curve(LT_Y, {color:C.out, width:2.6, n:800}));
  return stack(560, [[a.svg(),h1],[b.svg(),h2]]);
}

/* ---- Filtered white noise ---------------------------------------------------
   |H(f)|^2 = 1/(1 + (2 pi f RC)^2) with RC in ms and f in kHz, and the ideal
   filter of the same peak and area, of half-width B_neq = 1/(4RC). */
function figNoiseBw(v){
  const rc = val(v, 'rc', 1), bn = 1/(4*rc), f3 = 1/(2*Math.PI*rc);
  const H2 = f => 1/(1+Math.pow(2*Math.PI*f*rc, 2));
  const a = P.Axes(SZ({xr:[-2,2], yr:[0,1.55], xlabel:'f\\;(\\text{kHz})', ylabel:'|H(f)|^{2}',
    xticksOverride:[-2,-1,0,1,2], yticksOverride:[0.5,1]}));
  a.area(H2, -2, 2, {color:C.dec.h, n:600});
  a.poly([[-bn,0],[-bn,1],[bn,1],[bn,0]], {color:C.slate, width:2, dash:'7 5'});
  [-f3, f3].forEach(x=>a.poly([[x,0],[x,0.5]], {color:C.muted, width:1.4, dash:'3 4'}));
  a.curve(H2, {color:C.h, width:2.6, n:900});
  a.note(-1.95, 1.38, `B_{\\text{neq}}=${Math.round(1000*bn)}\\ \\text{Hz}`, {tex:true, fs:15, color:C.slate});
  a.note(-1.95, 1.18, `f_{3\\text{dB}}=${Math.round(1000*f3)}\\ \\text{Hz}`, {tex:true, fs:15, color:C.muted});
  return a.svg();
}

/* The same picture with no circuit named: the slider is B_neq itself and the
   filter is a generic lowpass with |H|^2 = 1/(1 + (f/f0)^2), whose area is
   pi f0, so B_neq = pi f0 / 2. */
function figNoiseBwGen(v){
  const bn = val(v, 'b', 0.5), f0 = 2*bn/Math.PI;
  const H2 = f => 1/(1+Math.pow(f/f0, 2));
  const a = P.Axes(SZ({xr:[-2,2], yr:[0,1.55], xlabel:'f\\;(\\text{kHz})', ylabel:'|H(f)|^{2}',
    xticksOverride:[-2,-1,0,1,2], yticksOverride:[0.5,1]}));
  a.area(H2, -2, 2, {color:C.dec.h, n:600});
  a.poly([[-bn,0],[-bn,1],[bn,1],[bn,0]], {color:C.slate, width:2, dash:'7 5'});
  a.curve(H2, {color:C.h, width:2.6, n:900});
  a.note(-1.95, 1.38, `B_{\\text{neq}}=${Math.round(1000*bn)}\\ \\text{Hz}`, {tex:true, fs:15, color:C.slate});
  return a.svg();
}

/* ---- Gaussian noise ---------------------------------------------------------
   The density of the sum of n independent uniform sources on [-1, 1], scaled
   to unit variance: exact for n = 1 and 2, and for n = 5 and 30 from the
   characteristic function (sin w / w)^n, integrated by the midpoint rule
   (the integrand has fallen below 1e-7 of its peak where each sum stops). */
const CL_X = [...Array(361)].map((_,i)=>-3.6+0.02*i);
let CL_D = null;
function cltDens(){
  if(CL_D) return CL_D;
  const cf = (n, s, W, dw) => { let r = 0; for(let w=dw/2; w<W; w+=dw){ r += Math.pow(Math.sin(w)/w, n)*Math.cos(w*s); } return r*dw/Math.PI; };
  const scaled = (n, fS) => { const c = Math.sqrt(n/3); return CL_X.map(z=>c*fS(c*z)); };
  CL_D = [
    scaled(1, s=>Math.abs(s) <= 1 ? 0.5 : 0),
    scaled(2, s=>Math.max(0, (2-Math.abs(s))/4)),
    scaled(5, s=>Math.abs(s) >= 5 ? 0 : Math.max(0, cf(5, s, 60, 0.01))),
    scaled(30, s=>Math.max(0, cf(30, s, 8, 0.005)))
  ];
  return CL_D;
}
function figClt(v){
  const f = frameOf(v, 3), k = Math.min(2, Math.floor(f+1e-9)), fr = f-k, D = cltDens();
  const d = CL_X.map((_,i)=> fr < 1e-9 ? D[k][i] : (1-fr)*D[k][i] + fr*D[Math.min(3,k+1)][i]);
  const at = z => { const u = (z+3.6)/0.02, i = Math.max(0, Math.min(359, Math.floor(u))), w = u-i; return d[i]*(1-w) + d[i+1]*w; };
  const a = P.Axes(SZ({xr:[-3.6,3.6], yr:[0,0.62], xlabel:'z', ylabel:'f_Z(z)',
    xticksOverride:[-3,-2,-1,0,1,2,3], yticksOverride:[0.2,0.4]}));
  a.area(at, -3.6, 3.6, {color:C.dec.mid, n:720});
  /* one source on the same scale: the flat box every sum starts from */
  const hw = Math.sqrt(3), hb = 1/(2*hw);
  a.poly([[-hw,0],[-hw,hb],[hw,hb],[hw,0]], {color:C.muted, width:1.4, opacity:0.9});
  a.note(1.95, hb+0.025, '\\text{one source}', {tex:true, fs:14, color:C.muted});
  a.curve(dN, {color:C.slate, width:1.8, n:500});
  a.curve(at, {color:C.mid, width:2.8, n:720});
  const n = [1,2,5,30][Math.round(f)];
  const gap = Math.max(...CL_X.map((z,i)=>Math.abs(d[i]-dN(z))));
  a.note(-3.45, 0.6, `n=${n}`, {tex:true, fs:18, color:C.mid});
  a.note(-3.45, 0.5, 'Z=\\dfrac{X_1+\\cdots+X_n}{\\sqrt{n/3}}', {tex:true, fs:15, color:C.slate});
  a.note(-3.45, 0.36, `\\text{largest gap to Gaussian: }${gap.toFixed(3)}`, {tex:true, fs:14, color:C.muted});
  return a.svg();
}

/* ---- the gallery ------------------------------------------------------------
   Thermal noise of a 1 kOhm resistor at 290 K in a 1 MHz band, drawn at its
   rms of sqrt(4kTRB) = 4.0 uV. The autocorrelation of a vowel with pitch
   125 Hz. The noise power kTB against bandwidth. The periodic autocorrelation
   of the 15-chip sequence of the shift register x^4 + x + 1. */
const TH = (()=>{ const w = noiseFn(20260471, 0.5, 1, -1, 12); let s = 0;
  for(let i=0;i<2000;i++){ const t = 10*(i+0.5)/2000; s += w(t)*w(t); }
  const g = 4/Math.sqrt(s/2000); return t => g*w(t); })();
const VOW = [...Array(24)].map((_,k)=>{ const f = 125*(k+1);
  return Math.exp(-Math.pow((f-700)/180, 2)) + 0.7*Math.exp(-Math.pow((f-1200)/220, 2)) + 0.08; });
const VOW_S = VOW.reduce((s,a)=>s+a*a, 0);
const vowR = t => VOW.reduce((s,a,k)=>s + a*a*Math.cos(2*Math.PI*0.125*(k+1)*t), 0)/VOW_S;
const PN = (()=>{ let r = [1,0,0,0]; const o = [];
  for(let n=0;n<15;n++){ o.push(1-2*r[3]); const fb = r[3]^r[0]; r = [fb, r[0], r[1], r[2]]; } return o; })();
const pnR = k => { let s = 0; for(let n=0;n<15;n++) s += PN[n]*PN[((n+k)%15+15)%15]; return s/15; };

const REAL_RANDOM = {
  id:'m2-real-random', module:'M2', nav:'Random signals around us', title:'Random signals around us',
  objective:'Recognise thermal noise, pitch detection, the noise floor and scrambled data as random signals.',
  keywords:'examples thermal noise resistor johnson kTB 4kTRB speech pitch autocorrelation vowel noise floor -174 dBm/Hz wifi scrambler pseudo random sequence shift register',
  budget:'a gallery of four everyday cases. Each figure is one example',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Random signals'},
  {t:'title', text:'Random signals around us'},
  {t:'cols', ratio:'c-8-4', fill:true, left:[
    {t:'grid', cols:2, gap:'18px 22px', items:[
      [{t:'fig', frame:true, svg:()=>{ const a = P.Axes(EXO({xr:[0,10], yr:[-13,13], xlabel:'t\\;(\\mu\\text{s})', ylabel:'v(t)\\;(\\mu\\text{V})',
          xticksOverride:[0,2,4,6,8,10], yticksOverride:[-8,-4,0,4,8]}));
        a.hline(4, {color:C.slate, dash:'6 4', opacity:1}); a.hline(-4, {color:C.slate, dash:'6 4', opacity:1});
        a.curve(TH, {color:C.in, width:1.6, n:900});
        a.note(9.9, 10.2, 'v_{\\mathrm{rms}}=4.0\\ \\mu\\text{V}', {tex:true, fs:14, color:C.slate, anchor:'end'});
        return a.svg(); },
        caption:'Thermal noise of a $1\\ \\text{k}\\Omega$ resistor at $T=290$ K in a band $B=1$ MHz: $v_{\\mathrm{rms}}=\\sqrt{4kTRB}=4.0\\ \\mu$V.'}],
      [{t:'fig', frame:true, svg:()=>{ const a = P.Axes(EXO({xr:[0,20], yr:[-0.75,1.3], xlabel:'\\tau\\;(\\text{ms})', ylabel:'R(\\tau)/R(0)',
          xticksOverride:[0,4,8,12,16,20], yticksOverride:[-0.5,0.5,1]}));
        a.curve(vowR, {color:C.mid, width:2.2, n:1400});
        a.point(8, vowR(8), {color:C.mid, r:5});
        a.note(8.5, 1.12, 'T_0=8\\ \\text{ms}', {tex:true, fs:14, color:C.mid});
        return a.svg(); },
        caption:'A vowel is a sum of harmonics of its pitch $f_0$. A speech coder finds $f_0=125$ Hz where $R(\\tau)=\\sum_k\\tfrac{a_k^{2}}{2}\\cos(2\\pi kf_0\\tau)$ peaks again, at $T_0=8$ ms.'}],
      [{t:'fig', frame:true, svg:()=>{ const a = P.Axes(EXO({xr:[3,8], yr:[-150,-85], xlabel:'B\\;(\\text{Hz})', ylabel:'P\\;(\\text{dBm})',
          xticksOverride:[3,4,5,6,7,8], xtickfmt:x=>['1k','10k','100k','1M','10M','100M'][Math.round(x)-3], yticksOverride:[-140,-120,-100]}));
        a.curve(x=>-173.98+10*x, {color:C.mid, width:2.4, n:200});
        const x20 = Math.log10(2e7);
        a.point(x20, -173.98+10*x20, {color:C.mid, r:5});
        a.note(x20-0.12, -95.5, '-101\\ \\text{dBm}', {tex:true, fs:14, color:C.mid, anchor:'end'});
        return a.svg(); },
        caption:'At $T=290$ K, $N_0=kT=-174$ dBm/Hz. A band $B$ collects $P=N_0B=kTB$, so a $20$ MHz Wi-Fi channel starts from $-101$ dBm.'}],
      [{t:'fig', frame:true, svg:()=>{ const a = P.Axes(EXO({xr:[-4.8,19.8], yr:[-0.3,1.25], xlabel:'k', ylabel:'R[k]',
          xticksOverride:[0,5,10,15], yticksOverride:[0.5,1]}));
        const st = []; for(let k=-4;k<=19;k++) st.push([k, pnR(k)]);
        a.stem(st, {color:C.mid, showZero:true});
        return a.svg(); },
        caption:'A scrambler makes data look white. The $15$-chip shift-register sequence $c[n]$ has $R[k]=\\tfrac{1}{15}\\sum_nc[n]\\,c[n+k]$: $1$ at $k=0$, $-1/15$ elsewhere.'}]
    ]}
  ], right:[
    {t:'note', kind:'def', head:'Noise is a random signal', html:'Every resistor makes thermal noise. The power it can deliver in a band $B$ is $kTB$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Structure in $R$', html:'A peak of $R(\\tau)$ away from $\\tau=0$ means the signal repeats after $\\tau$. A sequence with no such peak looks white.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Bandwidth costs noise', html:'Noise power grows by $10$ dB for every factor of $10$ in bandwidth. So a receiver filters to the band of its signal.'}]}
  ]}
]};

/* Single-panel figures keep one observation readable at lecture distance. */
function figMean(){
  const a=P.Axes(SZ({xr:[0,9],yr:[-3.5,4.1],xlabel:'t\\;(\\text{ms})',ylabel:'X(t)\\;(\\text{V})',xticksOverride:[0,2,4,6,8],yticksOverride:[-2,0,2]}));
  EN_P.forEach((x,i)=>a.curve(path(x,EN_DT,EN_T1),{color:C.in,width:i?1:2.5,n:700,opacity:i?0.3:1}));
  a.hline(0,{color:C.mid,dash:'10 6',width:3.6}); return a.svg();
}
function figAcfPairs(v){
  const tau=v&&v.tau!=null?v.tau:0.5, rho=Math.exp(-tau), s=Math.sqrt(1-rho*rho);
  const a=P.Axes(SZ({xr:[-3.3,3.3],yr:[-3.3,3.3],xlabel:'X(t)\\;(\\text{V})',ylabel:'X(t+\\tau)\\;(\\text{V})',xticksOverride:[-2,0,2],yticksOverride:[-2,0,2]}));
  AC_Z1.forEach((z,i)=>{const y=rho*z+s*AC_Z2[i];if(Math.abs(z)<3.25&&Math.abs(y)<3.25)a.point(z,y,{color:C.mid,r:2.8});});return a.svg();
}
function figAcfCurve(v){
  const tau=v&&v.tau!=null?v.tau:1, rho=Math.exp(-Math.abs(tau));
  const a=P.Axes(SZ({xr:[-3.2,3.2],yr:[-0.08,1.4],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_X(\\tau)\\;(\\text{V}^{2})',xticksOverride:[-3,-2,-1,0,1,2,3],yticksOverride:[0.5,1]}));
  a.curve(t=>Math.exp(-Math.abs(t)),{color:C.mid,width:2.6,n:700});
  if(v){
    a.poly([[tau,0],[tau,rho],[0,rho]],{color:C.mid,width:1,dash:'4 4',opacity:0.55});
    a.note(-3.05,1.2,`R_X(${+tau.toFixed(2)})=${rho.toFixed(3)}\\;\\text{V}^{2}`,{tex:true,fs:15,color:C.mid});
  }
  a.point(tau,rho,{color:C.mid,r:5});
  if(v) a.raw(`<circle data-acf-drag data-x0="${a.x0}" data-x1="${a.x1}" cx="${a.sx(tau)}" cy="${a.sy(rho)}" r="${24*P.labelScale()}" fill="transparent" style="cursor:ew-resize;touch-action:none" aria-hidden="true"/>`);
  return a.svg();
}
/* The figure owns pointer capture because its SVG is replaced by the live
   slider redraw. Map every move through the current SVG, including stage
   scaling and figure growth, then let the existing slider update its state. */
let acfDrag=null;
document.addEventListener('pointerdown',e=>{
  const hit=e.target.closest('[data-acf-drag]');
  if(!hit || e.button || acfDrag) return;
  if(APP.state.display==='projector' && APP.state.pointer==='laser' && e.pointerType!=='touch') return;
  const fig=hit.closest('figure'), input=fig.querySelector('input[data-live="tau"]');
  if(!input) return;
  e.preventDefault();
  acfDrag={fig,input,id:e.pointerId};
  fig.setPointerCapture(e.pointerId);
});
/* The initial touch target is replaced on redraw. Keep the browser from
   taking that active drag for scrolling after the target has gone. */
document.addEventListener('touchstart',e=>{
  if(acfDrag && e.target.closest('[data-acf-drag]')) e.preventDefault();
},{passive:false});
document.addEventListener('touchmove',e=>{
  if(acfDrag) e.preventDefault();
},{passive:false});
document.addEventListener('pointermove',e=>{
  if(!acfDrag || e.pointerId!==acfDrag.id) return;
  const {fig,input}=acfDrag, hit=fig.querySelector('[data-acf-drag]'), svg=hit&&hit.ownerSVGElement;
  const matrix=svg&&svg.getScreenCTM();
  if(!matrix || !fig.isConnected){ acfDrag=null; return; }
  const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
  const min=+input.min, max=+input.max, step=+input.step;
  const tau=-3.2+(q.x-+hit.dataset.x0)/(+hit.dataset.x1-+hit.dataset.x0)*6.4;
  input.value=Math.max(min,Math.min(max,min+Math.round((tau-min)/step)*step)).toFixed(2);
  input.dispatchEvent(new Event('input',{bubbles:true}));
});
const endAcfDrag=e=>{
  if(!acfDrag || e.pointerId!==acfDrag.id) return;
  const {fig,id}=acfDrag;
  acfDrag=null;
  if(fig.hasPointerCapture(id)) fig.releasePointerCapture(id);
};
document.addEventListener('pointerup',endAcfDrag);
document.addEventListener('pointercancel',endAcfDrag);
document.addEventListener('lostpointercapture',endAcfDrag);
function figPsdOnly(v){
  const tc=v&&v.tc!=null?v.tc:0.3, S=f=>2*tc/(1+(2*Math.PI*f*tc)**2);
  const a=P.Axes(SZ({xr:[-4,4],yr:[0,2.4],xlabel:'f\\;(\\text{kHz})',ylabel:'S_X(f)\\;(\\text{V}^{2}/\\text{kHz})',xticksOverride:[-4,-2,0,2,4],yticksOverride:[0.5,1,1.5,2]}));
  a.area(S,-4,4,{color:C.dec.in,n:600});a.curve(S,{color:C.in,width:2.6,n:700});
  const fh=1/(2*Math.PI*tc), pk=2*tc;
  a.poly([[-fh,0],[-fh,tc],[fh,tc],[fh,0]],{color:C.mid,width:1.4,dash:'4 5'});
  a.point(0,pk,{color:C.in,r:4.6});[-fh,fh].forEach(x=>a.point(x,tc,{color:C.mid,r:4.4}));
  /* the three lines are spaced in pixels, so larger labels move apart */
  const dy=40*P.labelScale()/(a.sy(0)-a.sy(1));
  a.note(3.9,2.2,'S_X(f)=\\dfrac{2\\tau_c}{1+(2\\pi f\\tau_c)^2}',{tex:true,fs:15,color:C.ink,anchor:'end'});
  a.note(3.9,2.2-dy,'S_X(0)='+pk.toFixed(2)+'\\ \\text{V}^{2}/\\text{kHz}',{tex:true,fs:15,color:C.in,anchor:'end'});
  a.note(3.9,2.2-2*dy,'f_{1/2}=\\dfrac{1}{2\\pi\\tau_c}='+fh.toFixed(2)+'\\ \\text{kHz}',{tex:true,fs:15,color:C.mid,anchor:'end'});
  return a.svg();
}
function figPowerArea(){
  const a=P.Axes(SZ({xr:[-7,7],yr:[0,1.6],xlabel:'f\\;(\\text{kHz})',ylabel:'S_X(f)\\;(\\text{W}/\\text{Hz})',xticksOverride:[-5,0,5],yticksOverride:[0.5,1],ytickfmt:v=>v+'×10⁻³'}));
  a.rect(-5,0,5,1,{fill:C.dec.in});a.poly([[-7,0],[-5,0],[-5,1],[5,1],[5,0],[7,0]],{color:C.in,width:2.6});return a.svg();
}
function figWhiteSpectrum(v){
  const B=v&&v.B!=null?v.B:2;
  const a=P.Axes(SZ({xr:[-5,5],yr:[0,1.6],xlabel:'f\\;(\\text{kHz})',ylabel:'S_w(f)/(N_0/2)',xticksOverride:[-4,-2,0,2,4],yticksOverride:[0.5,1]}));
  a.rect(-B,0,B,1,{fill:C.dec.in});a.poly([[-5,0],[-B,0],[-B,1],[B,1],[B,0],[5,0]],{color:C.in,width:2.6});return a.svg();
}
function figWhiteCorrelation(v){
  const B=v&&v.B!=null?v.B:2;
  const a=P.Axes(SZ({xr:[-1.2,1.2],yr:[-0.4,1.5],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_w(\\tau)/(N_0B)',xticksOverride:[-1,-0.5,0,0.5,1],yticksOverride:[0.5,1]}));
  a.curve(t=>sinc(2*B*t),{color:C.mid,width:2.6,n:1800});[-1/(2*B),1/(2*B)].forEach(t=>a.point(t,0,{color:C.mid,r:4.5}));return a.svg();
}
/* The white-noise limit: R_w(tau)/(N0/2) = 2B sinc(2B tau), B in kHz, tau in
   ms. The peak 2B grows and the lobe narrows while the area stays 1, so the
   curve tends to the impulse delta(tau) as B grows. */
function figWhiteLimit(v){
  const B=v&&v.B!=null?v.B:1, r=t=>2*B*sinc(2*B*t), pk=2*B, top=Math.max(11.6,pk*1.16);
  const raw=top/5, mag=Math.pow(10,Math.floor(Math.log10(raw))), st=[1,2,5,10].map(k=>k*mag).find(x=>x>=raw);
  const yt=[]; for(let y=st;y<=pk+1e-9;y+=st) yt.push(y);
  const a=P.Axes(SZ({xr:[-1.2,1.2],yr:[-0.224*top,top],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_w(\\tau)/(N_0/2)\\;(\\text{kHz})',xticksOverride:[-1,-0.5,0,0.5,1],yticksOverride:yt}));
  a.area(r,-1.2,1.2,{color:C.dec.mid,n:8000});a.curve(r,{color:C.mid,width:2.6,n:8000});
  a.point(0,pk,{color:C.mid,r:5});
  a.note(0.08,pk+0.03*top,'2B',{tex:true,fs:15,color:C.mid});
  a.note(1.15,0.91*top,'\\text{area}=1',{tex:true,fs:15,color:C.ink,anchor:'end'});
  return a.svg();
}
function figFilterSpectrum(v){
  const f=v&&v.frame!=null?v.frame:2, H2=x=>1/(1+x*x);
  const a=P.Axes(SZ({xr:[-5,5],yr:[0,1.7],xlabel:'f\\;(\\text{kHz})',ylabel:'S(f),\\;|H(f)|^{2}',xticksOverride:[-4,-2,0,2,4],yticksOverride:[0.5,1]}));
  a.curve(()=>0.5,{color:C.in,width:2.2,n:4});
  a.raw(`<g opacity="${clamp01(f)}">`);a.curve(H2,{color:C.h,width:2.6,n:600});a.raw('</g>');
  a.raw(`<g opacity="${clamp01(f-1)}">`);a.area(x=>0.5*H2(x),-5,5,{color:C.dec.out,n:600});a.curve(x=>0.5*H2(x),{color:C.out,width:2.6,n:600});a.raw('</g>');return a.svg();
}
function figFilterTime(){
  const a=P.Axes(SZ({xr:[0,5],yr:[-3.2,3.2],xlabel:'t\\;(\\text{ms})',ylabel:'x(t),\\;y(t)',xticksOverride:[0,1,2,3,4,5],yticksOverride:[-2,0,2]}));
  a.curve(LT_X,{color:C.in,width:1.1,opacity:0.45,n:1000});a.curve(LT_Y,{color:C.out,width:2.6,n:800});return a.svg();
}
function figGaussianSample(){
  const sigma=2, d=x=>Math.exp(-x*x/(2*sigma*sigma))/(sigma*Math.sqrt(2*Math.PI));
  const a=P.Axes(SZ({xr:[-7,7],yr:[0,0.3],xlabel:'n\\;(\\text{mV})',ylabel:'f_n(n)\\;(\\text{mV}^{-1})',xticksOverride:[-4,-2,0,2,4,6],yticksOverride:[0.1,0.2]}));
  a.area(d,4,7,{color:C.dec.err,n:200});a.curve(d,{color:C.mid,width:2.6,n:700});a.poly([[4,0],[4,d(4)]],{color:C.err,width:2,dash:'5 4'});return a.svg();
}

/* Stationarity: the three recordings of the autocorrelation scene, read at a
   start time t that the slider moves and at t + 1 ms. The gap stays fixed, so
   for this WSS process the average product stays R_X(1 ms) = e^-1 V^2. The
   two readouts are measured from the 3000 recordings SS_P (defined below). */
function figWssShift(v){
  const t0=val(v,'t',1), tau=1;
  const a=P.Axes(SZ({xr:[0,6],yr:[-3.4,5.4],xlabel:'t\\;(\\text{ms})',ylabel:'X(t)\\;(\\text{V})',xticksOverride:[0,1,2,3,4,5,6],yticksOverride:[-2,0,2]}));
  AC_P.forEach((x,i)=>a.curve(path(x,AC_DT,6),{color:[C.in,C.h,C.err][i],width:1.6,n:700}));
  [t0,t0+tau].forEach(t=>{a.vline(t,{color:C.mid,dash:'5 4',width:1.4,opacity:0.9});
    AC_P.forEach(x=>a.point(t,path(x,AC_DT,6)(t),{color:C.mid,r:4}));});
  a.span(t0,t0+tau,4.45,'\\tau=1\\ \\text{ms}',{tex:true,fs:15,color:C.mid});
  let m=0, r=0; SS_P.forEach(x=>{ const f=path(x,AC_DT,6), u=f(t0); m+=u; r+=u*f(t0+tau); });
  m/=SS_N; r/=SS_N;
  a.note(5.95,5.0,'\\hat\\mu_X(t)='+m.toFixed(2)+'\\ \\text{V}',{tex:true,fs:15,color:C.mid,anchor:'end'});
  a.note(5.95,4.35,'\\hat R_X(t,t+\\tau)='+r.toFixed(2)+'\\ \\text{V}^{2}',{tex:true,fs:15,color:C.mid,anchor:'end'});
  return a.svg();
}
/* Strict-sense stationarity: recordings of the same process (the first
   three are the recordings of the slide before), read at a start time t that
   the slider moves and at t + 1 ms. The cloud of pairs and the histogram of
   X(t) are measured from the recordings, so only sampling scatter moves. */
const SS_N = 3000, SS_TAU = 1, SS_BW = 0.5, SS_LO = -3.25;
const SS_P = AC_P.concat([...Array(SS_N-3).keys()].map(i=>ou(gauss(20260601+i, 301, 1), AC_DT, AC_TC)));
function figSssShift(v){
  const t0 = val(v, 't', 1), hA = TOPH()+50, hB = 270 + extraHeight(hA+270);
  const a = P.Axes({w:560, h:hA, xr:[0,6], yr:[-2.4,4.2], xlabel:'t\\;(\\text{ms})', ylabel:'X(t)',
    pad:{l:56,r:26,t:22,b:40}, xticksOverride:[0,1,2,3,4,5,6], yticksOverride:[-2,0,2,4]});
  AC_P.forEach((x,i)=>a.curve(path(x, AC_DT, 6), {color:[C.in, C.h, C.err][i], width:1.6, n:700}));
  [t0, t0+SS_TAU].forEach(t=>{ a.vline(t, {color:C.mid, dash:'5 4', width:1.4, opacity:0.9});
    AC_P.forEach((x,i)=>a.point(t, path(x, AC_DT, 6)(t), {color:C.mid, r:4})); });
  const b = P.Axes({w:300, h:hB, xr:[-3.3,3.3], yr:[-3.3,3.3], xlabel:'X(t)', ylabel:'X(t+\\tau)',
    pad:{l:52,r:14,t:24,b:42}, xticksOverride:[-2,0,2], yticksOverride:[-2,0,2]});
  const c = P.Axes({w:260, h:hB, xr:[-3.3,3.3], yr:[0,0.62], xlabel:'X(t)', ylabel:'f(x)',
    pad:{l:48,r:18,t:24,b:42}, xticksOverride:[-2,0,2], yticksOverride:[]});
  const cnt = Array(13).fill(0);
  SS_P.forEach((x,i)=>{ const f = path(x, AC_DT, 6), u = f(t0), w = f(t0+SS_TAU);
    if(i >= 3 && i < 300 && Math.abs(u) < 3.25 && Math.abs(w) < 3.25)
      b.raw(`<circle cx="${b.sx(u).toFixed(2)}" cy="${b.sy(w).toFixed(2)}" r="2.6" fill="${C.mid}" opacity="0.6"/>`);
    const k = Math.floor((u-SS_LO)/SS_BW); if(k >= 0 && k < 13) cnt[k]++; });
  AC_P.forEach((x,i)=>{ const f = path(x, AC_DT, 6); b.point(f(t0), f(t0+SS_TAU), {color:[C.in, C.h, C.err][i], r:5}); });
  cnt.forEach((n,k)=>{ if(n) c.rect(SS_LO+k*SS_BW+0.02, 0, SS_LO+(k+1)*SS_BW-0.02, n/(SS_N*SS_BW), {fill:C.dec.mid, stroke:C.mid, width:1}); });
  c.curve(dN, {color:C.mid, width:2.4, n:300});
  return `<svg viewBox="0 0 560 ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,560,hA)}${place(b.svg(),0,hA,300,hB)}${place(c.svg(),300,hA,260,hB)}</svg>`;
}
const EB = 'Module 2 · Random signals';
function figOutputNoise(v){
  /* RC = 0.5 ms: the area under |H|^2 is 1/(2RC) = 1 kHz, so P_n = (N0/2)(1 kHz).
     Frames: 0 white input, 1 filter gain, 2 output PSD with its area filling in,
     3 the rectangle of equal area (half-width 1/(4RC) = 0.5 kHz). */
  const f = frameOf(v, 3), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2), rc = 0.5, bn = 1/(4*rc);
  const H2 = x => 1/(1+Math.pow(2*Math.PI*x*rc, 2));
  const a = P.Axes(SZ({xr:[-2,2], yr:[0,1.5], xlabel:'f\\;(\\text{kHz})', ylabel:'S(f)/(N_0/2)',
    xticksOverride:[-2,-1,0,1,2], yticksOverride:[0.5,1]}));
  a.curve(()=>1, {color:C.in, width:o1 > 0.01 ? 1.5 : 2.6, dash:o1 > 0.01 ? '6 5' : null, n:4});
  fade(a, o1, ()=>a.curve(H2, {color:C.h, width:2.2, dash:'7 5', n:700}));
  if(o2 > 0.01){
    const hi = -2 + 4*o2;
    a.area(H2, -2, hi, {color:C.dec.out, n:600});
    a.curve(x=>x <= hi ? H2(x) : NaN, {color:C.out, width:2.6, n:700});
  }
  fade(a, o3, ()=>{
    a.poly([[-bn,0],[-bn,1],[bn,1],[bn,0]], {color:C.slate, width:2.2, dash:'7 5'});
    a.note(0.62, 1.12, '\\text{equal area}', {tex:true, fs:15, color:C.slate});
  });
  if(f < 2.01 && f > 1.01) a.note(-1.95, 1.38, '\\text{area}\\ =\\ \\text{power}', {tex:true, fs:15, color:C.out});
  return a.svg();
}

const SC = [

{
  id:'m2-rp-ensemble',
  module:'M2',
  nav:'A random signal',
  title:'A random signal',
  objective:'Distinguish a noise recording, its ensemble and the random variable obtained at a fixed time.',
  keywords:'random signal noise receiver a random signal',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'A random signal'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figEnsemble,
          caption:'Each trace is one noise recording. Fix $t_0$ and compare recordings to obtain the distribution of $X(t_0)$.',
          frames:{
            labels:['one recording', 'two recordings', 'three recordings', 'the ensemble', 'a fixed time', 'the distribution']
          }
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Random process', html:'Each noise recording is a sample function of $X(t)$. Their collection is the ensemble.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Read a thousand receiver trials at the same time $t_0=5$ ms.<div class="nsep"></div>What do the readings describe?',
          ask:{
            key:'m2-rp-ensemble',
            choices:['one waveform', 'the random variable $X(t_0)$', 'a time average'],
            answer:1,
            why:'The time is fixed. The trial changes, so each reading is one value of $X(t_0)$.'
          }
        },
        {
          t:'reveal',
          at:1,
          items:[
            {t:'eq', label:'At a fixed time', tex:'X(t_0)\\ \\text{has density}\\ f_{X(t_0)}(x)', note:'A recording varies with time. A random variable varies across trials at one fixed time.'}
          ]
        }
      ]
    }
  ],
  src:'book 5.2'
},

{
  id:'m2-rp-mean',
  module:'M2',
  nav:'The ensemble mean',
  title:'The ensemble mean',
  objective:'Interpret the ensemble mean without assuming that one recording has the same time average.',
  keywords:'random signal noise receiver the ensemble mean',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'The ensemble mean'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {t:'fig', frame:true, grow:true, svg:figMean, caption:'The dashed line is the ensemble mean of this zero-mean noise. Individual recordings fluctuate around it.'},
        {
          t:'legend',
          items:[
            ['in', 'recordings'],
            ['mid', 'ensemble mean', true]
          ],
          at:'tr'
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Mean', html:'At a fixed time, average the values across receiver trials. The mean describes the centre of their distribution.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'The noise has zero ensemble mean.<div class="nsep"></div>What must one noise recording do?',
          ask:{
            key:'m2-rp-mean',
            choices:['stay at zero', 'fluctuate; it need not be zero', 'have zero value at every sample'],
            answer:1,
            why:'Zero mean describes the average across trials. Individual noise values can be positive or negative.'
          }
        },
        {
          t:'reveal',
          at:1,
          items:[
            {t:'eq', label:'Definition', tex:'\\mu_X(t)=E[X(t)]', note:'This expectation averages across the ensemble. A time average along one recording requires additional assumptions.'}
          ]
        }
      ]
    }
  ],
  src:'book 5.2.1'
},

{
  id:'m2-rp-acf',
  module:'M2',
  nav:'Autocorrelation',
  title:'Autocorrelation',
  objective:'Interpret the average product of two readings and predict how their relationship changes with the gap.',
  keywords:'random signal noise receiver autocorrelation',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Autocorrelation'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figAcfPairs,
          caption:'Each dot is a pair from one trial: $X(t)$ and $X(t+\\tau)$. Increase the gap and watch the cloud spread.',
          live:{
            controls:[
              {k:'tau', label:'$\\tau$ (ms)', min:0, max:3, step:0.05, v:0.5, show:v=>'$'+v.toFixed(2)+'$'}
            ]
          }
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Pairs of values', html:'Take two readings from each noise recording, separated by $\\tau$. Their average product is the autocorrelation.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'For this zero-mean process, increase the gap $\\tau$.<div class="nsep"></div>How does the cloud change?',
          ask:{
            key:'m2-rp-acf',
            choices:['it concentrates on the diagonal', 'it spreads away from the diagonal', 'every value becomes zero'],
            answer:1,
            why:'In this example the correlation decreases with the gap. The later reading becomes less related to the earlier one.'
          }
        },
        {
          t:'reveal',
          at:1,
          items:[
            {t:'eq', label:'Definition', tex:'R_X(t,t+\\tau)=E[X(t)X(t+\\tau)]', note:'The product is positive when the readings have the same sign. Autocorrelation also depends on their magnitudes.'}
          ]
        }
      ]
    }
  ],
  src:'book 5.2.1'
},

{
  id:'m2-rp-acf-value',
  module:'M2',
  nav:'Reading the autocorrelation',
  title:'Reading the autocorrelation',
  objective:'Evaluate the autocorrelation at a given gap and compare it with its zero-gap value.',
  keywords:'random signal noise receiver reading the autocorrelation',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Reading the autocorrelation'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {t:'fig', frame:true, grow:true, svg:figAcfCurve,
          live:{controls:[{k:'tau',label:'$\\tau$',min:-3,max:3,step:0.01,v:1,show:x=>`$${x.toFixed(2)}\\;\\text{ms}$`}]},
          caption:'Drag the point or move the slider to read the gap and autocorrelation. For this zero-mean, unit-power process, autocorrelation decreases with the gap magnitude.'}
      ],
      right:[
        {t:'note', kind:'def', head:'Receiver readings', html:'A large positive autocorrelation means the readings tend to have the same sign. Here it depends only on the gap.'},
        {t:'eq', label:'Example', tex:'R_X(\\tau)=e^{-|\\tau|/\\tau_c}\\ \\text{V}^{2},\\qquad\\tau_c=1\\ \\text{ms}', note:'At zero gap, multiply each reading by itself. This process has $R_X(0)=1\\ \\text{V}^{2}$.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Read the curve at $\\tau=1$ ms.<div class="nsep"></div>What is $R_X(1\\ \\text{ms})$?',
          ask:{
            key:'m2-rp-acf-value',
            choices:['$0.37\\ \\text{V}^{2}$', '$0.61\\ \\text{V}^{2}$', '$1\\ \\text{V}^{2}$'],
            answer:0,
            why:'Substitute the gap: $R_X(1\\ \\text{ms})=e^{-1}=0.37\\ \\text{V}^{2}$, below its zero-gap value.'
          }
        }
      ]
    }
  ],
  src:'book 5.2.1'
},

{
  id:'m2-rp-wss',
  module:'M2',
  nav:'Wide-sense stationarity',
  title:'Wide-sense stationarity',
  objective:'State the WSS conditions and distinguish them from strict-sense stationarity.',
  keywords:'random signal noise receiver stationarity',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Wide-sense stationarity'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {t:'fig', frame:true, grow:true, svg:figWssShift,
          live:{controls:[{k:'t',label:'$t$ (ms)',min:0.2,max:4.8,step:0.05,v:1,show:x=>'$'+x.toFixed(2)+'$'}]},
          caption:'Drag the start time $t$. The three readings change. The values at the top right average 3000 recordings: $\\hat\\mu_X$ stays near $0$ and $\\hat R_X$ near $R_X(1\\ \\text{ms})=0.37\\ \\text{V}^{2}$, up to sampling scatter.'}
      ],
      right:[
        {t:'note', kind:'def', head:'Stationarity', html:'Wide-sense stationarity (WSS) preserves the mean and autocorrelation under a time shift. Strict-sense stationarity preserves every joint distribution.'},
        {t:'eq', label:'WSS conditions', tex:'\\mu_X(t)=\\mu_X,\\qquad R_X(t,t+\\tau)=R_X(\\tau)', note:'Both moments are finite. With finite second moments, strict-sense stationarity implies WSS.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Move both WSS readings by the same time shift.<div class="nsep"></div>What stays unchanged?',
          ask:{
            key:'m2-rp-wss',
            choices:['the individual readings', 'their ensemble average product', 'the whole recording'],
            answer:1,
            why:'WSS fixes these statistics. Individual recordings do not have to repeat.'
          }
        }
      ]
    }
  ],
  src:'book 5.2.2'
},

{
  id:'m2-rp-sss',
  module:'M2',
  nav:'Strict-sense stationarity',
  title:'Strict-sense stationarity',
  objective:'State strict-sense stationarity and see that a common time shift leaves the first two joint distributions unchanged.',
  keywords:'random signal noise receiver strict-sense stationarity joint distribution',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Strict-sense stationarity'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {t:'fig', frame:true, grow:true, svg:figSssShift,
          live:{controls:[{k:'t',label:'$t$ (ms)',min:0.2,max:4.8,step:0.05,v:1,show:x=>'$'+x.toFixed(2)+'$'}]},
          caption:'Drag the start time $t$. The cloud of pairs and the histogram of $X(t)$ keep their shape. Two readings show only the first two orders of the joint distribution.'}
      ],
      right:[
        {t:'note', kind:'def', head:'Strict sense', html:'A process is strict-sense stationary (SSS) when a common time shift leaves every joint distribution unchanged.'},
        {t:'eq', label:'Shift invariance', tex:'f_{X(t_1),\\ldots,X(t_n)}(x_1,\\ldots,x_n)=f_{X(t_1+\\Delta),\\ldots,X(t_n+\\Delta)}(x_1,\\ldots,x_n)', note:'Here $x_i$ is a value of $X(t_i)$. This holds for every $n$, every choice of times and every shift $\\Delta$. With finite second moments, SSS implies WSS.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Move the start time $t$ and watch the cloud of pairs.<div class="nsep"></div>What does the cloud do?',
          ask:{
            key:'m2-rp-sss',
            choices:['it moves with $t$', 'it keeps its shape', 'it grows'],
            answer:1,
            why:'The joint distribution of $X(t)$ and $X(t+\\tau)$ does not depend on $t$. Only the sampling scatter changes.'
          }
        }
      ]
    }
  ],
  src:'book 5.2.2'
},

{
  id:'m2-rp-power',
  module:'M2',
  nav:'Autocorrelation and power',
  title:'Autocorrelation and power',
  objective:'Find mean-square power from the zero-gap autocorrelation and state symmetry and magnitude bounds.',
  keywords:'random signal noise receiver autocorrelation and power',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Autocorrelation and power'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figWss,
          caption:'Read the peak at zero gap, then compare positive and negative gaps. The process is real-valued and WSS.',
          frames:{
            labels:['autocorrelation', 'power', 'even', 'bounded']
          }
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Zero gap', html:'At zero gap, a reading is multiplied by itself. Its expectation is the average squared value, or mean-square power.'},
        {t:'eq', label:'Three properties', tex:'\\begin{aligned}P_X=R_X(0)&=E[X^2(t)]\\\\R_X(-\\tau)&=R_X(\\tau)\\\\|R_X(\\tau)|&\\le R_X(0)\\end{aligned}', note:'For voltage, $P_X$ has units $\\text{V}^{2}$. Across a $1\\ \\Omega$ load, its numerical value is the power in watts.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'The curve is $R_X(\\tau)=4e^{-|\\tau|/2}\\cos(2\\pi\\tau)\\ \\text{V}^{2}$, with $\\tau$ in ms.<div class="nsep"></div>What is $P_X$?',
          ask:{
            key:'m2-rp-power',
            choices:['$2\\ \\text{V}^{2}$', '$4\\ \\text{V}^{2}$', '$8\\ \\text{V}^{2}$'],
            answer:1,
            why:'Set $\\tau=0$: $P_X=4e^0\\cos0=4\\ \\text{V}^{2}$.'
          }
        }
      ]
    }
  ],
  src:'book 5.2.2'
},

{
  id:'m2-rp-ex-phase',
  module:'M2',
  nav:'Worked example: a sinusoid with a random phase',
  title:'Worked example: a sinusoid with a random phase',
  objective:'Compute the mean, autocorrelation and power of a sinusoid with a random phase.',
  keywords:'random signal noise receiver worked example: a sinusoid with a random phase',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Worked example: a sinusoid with a random phase'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figExPhase,
          caption:'Each recording has one fixed phase. Press Next for another phase sample. Amplitude and frequency stay fixed.',
          frames:{
            labels:EX_PHASES.map(()=>''),
            ms:900
          },
        }
      ],
      right:[
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Let $X(t)=A\\cos(2\\pi f_0t+\\Theta)$, $A=3$ V, $f_0=1$ kHz. The phase is uniform on $[0,2\\pi)$. Find the mean, autocorrelation and power.'
        },
        {t:'eq', label:'Mean', tex:'\\mu_X=\\frac{1}{2\\pi}\\int_0^{2\\pi}A\\cos(2\\pi f_0t+\\theta)\\,d\\theta=0', note:'Average across phases. The integral covers a full cycle.'},
        {t:'eq', label:'Autocorrelation', tex:'\\begin{aligned}R_X(t,t+\\tau)&=A^2E[\\cos(2\\pi f_0t+\\Theta)\\cos(2\\pi f_0(t+\\tau)+\\Theta)]\\\\&=\\frac{A^2}{2}E[\\cos(2\\pi f_0\\tau)+\\cos(2\\pi f_0(2t+\\tau)+2\\Theta)]\\\\&=\\frac{A^2}{2}\\cos(2\\pi f_0\\tau)\\end{aligned}', note:'Use $\\cos\\alpha\\cos\\beta=\\tfrac12[\\cos(\\alpha-\\beta)+\\cos(\\alpha+\\beta)]$. The common phase cancels in the difference. The sum term averages to zero over $\\Theta$.'},
        {t:'eq', label:'Power', tex:'P_X=R_X(0)=\\frac{A^2}{2}=4.5\\ \\text{V}^{2}', note:'Common error: use $A^2/2$, not $A^2=9\\ \\text{V}^{2}$, which drops the $\\tfrac12$. The mean is constant and $R_X$ depends only on $\\tau$, so the process is WSS.'},
      ]
    }
  ],
  src:'book 5.2.1'
},

{
  id:'m2-rp-psd',
  module:'M2',
  nav:'Power spectral density',
  title:'Power spectral density',
  objective:'Interpret power spectral density and connect correlation time to spectral width.',
  keywords:'random signal noise receiver power spectral density',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Power spectral density'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figPsdOnly,
          caption:'Drag $\\tau_c$. A longer correlation time concentrates the spectrum near zero frequency. The total area stays $1\\ \\text{V}^{2}$.',
          live:{
            controls:[
              {k:'tc', label:'$\\tau_c$ (ms)', min:0.05, max:1, step:0.01, v:0.3, show:v=>'$'+v.toFixed(2)+'$'}
            ]
          }
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Power per frequency', html:'Power spectral density (PSD) describes power per unit frequency. Here it is measured in $\\text{V}^{2}/\\text{kHz}$.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'This process has $R_X(\\tau)=e^{-|\\tau|/\\tau_c}\\ \\text{V}^{2}$. Increase $\\tau_c$.<div class="nsep"></div>What happens to the spectrum?',
          ask:{
            key:'m2-rp-psd',
            choices:['it becomes wider', 'it becomes narrower', 'its total power increases'],
            answer:1,
            why:'The spectrum narrows. The total power remains $R_X(0)=1\\ \\text{V}^{2}$.'
          }
        },
        {
          t:'reveal',
          at:1,
          items:[
            {t:'eq', label:'Wiener–Khinchin', tex:'S_X(f)=\\int_{-\\infty}^{\\infty}R_X(\\tau)e^{-j2\\pi f\\tau}\\,d\\tau', note:'For a real WSS process, the PSD is real, even and nonnegative. Here $S_X(f)=2\\tau_c/[1+(2\\pi f\\tau_c)^2]$.'}
          ]
        }
      ]
    }
  ],
  src:'book 5.2.5'
},

{
  id:'m2-rp-psd-power',
  module:'M2',
  nav:'Power from the spectrum',
  title:'Power from the spectrum',
  objective:'Compute total power by integrating the two-sided PSD.',
  keywords:'random signal noise receiver power from the spectrum',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Power from the spectrum'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {t:'fig', frame:true, grow:true, svg:figPowerArea, caption:'The shaded rectangle covers both negative and positive frequencies. Its total width is $10$ kHz.'}
      ],
      right:[
        {t:'note', kind:'def', head:'Area', html:'Add the power in all frequency intervals. This gives the same mean-square power as $R_X(0)$.'},
        {t:'eq', label:'Inverse transform', tex:'\\begin{aligned}R_X(\\tau)&=\\int_{-\\infty}^{\\infty}S_X(f)e^{j2\\pi f\\tau}\\,df\\\\P_X=R_X(0)&=\\int_{-\\infty}^{\\infty}S_X(f)\\,df\\end{aligned}', note:'Set $\\tau=0$ in the inverse transform. The exponential becomes $1$.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'$S_X(f)=10^{-3}$ W/Hz on $|f|<5$ kHz and zero elsewhere.<div class="nsep"></div>What is the power?',
          ask:{
            key:'m2-rp-psd-power',
            choices:['$5$ W', '$10$ W', '$20$ W'],
            answer:1,
            why:'Integrate over both halves: $P_X=10^{-3}(5000-(-5000))=10$ W.'
          }
        }
      ]
    }
  ],
  src:'book 5.2.5'
},

{
  id:'m2-rp-white',
  module:'M2',
  nav:'Noise in a finite band',
  title:'Noise in a finite band',
  objective:'Compute the finite power of noise with a flat PSD over a finite band.',
  keywords:'random signal noise receiver noise in a finite band',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Noise in a finite band'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figWhiteSpectrum,
          caption:'Drag the half-width $B$. A flat two-sided density of $N_0/2$ collects more noise power when the band widens.',
          live:{
            controls:[
              {k:'B', label:'$B$ (kHz)', min:0.5, max:4, step:0.05, v:2, show:v=>'$'+v.toFixed(2)+'$'}
            ]
          }
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Receiver band', html:'Start with noise whose PSD is flat inside a finite band. Its power is finite.'},
        {t:'eq', label:'Bandlimited noise', tex:'\\begin{aligned}S_w(f)&=\\frac{N_0}{2},\\quad |f|<B\\\\P_w&=\\int_{-B}^{B}\\frac{N_0}{2}\\,df=N_0B\\end{aligned}', note:'Outside this ideal lowpass band, the PSD is zero. The total width is $2B$.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Keep $N_0/2$ fixed and double $B$.<div class="nsep"></div>What happens to the noise power?',
          ask:{
            key:'m2-rp-white',
            choices:['it halves', 'it stays the same', 'it doubles'],
            answer:2,
            why:'The spectral area doubles because the width doubles.'
          }
        }
      ]
    }
  ],
  src:'book 5.3.2'
},

{
  id:'m2-rp-white-correlation',
  module:'M2',
  nav:'Bandlimited noise samples',
  title:'Bandlimited noise samples',
  objective:'Relate the finite-band noise spectrum to its sinc autocorrelation and sample correlations.',
  keywords:'random signal noise receiver bandlimited noise samples',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Bandlimited noise samples'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figWhiteCorrelation,
          caption:'Drag $B$. The normalized autocorrelation narrows. Filtered noise samples can remain correlated at nonzero time gaps.',
          live:{
            controls:[
              {k:'B', label:'$B$ (kHz)', min:0.5, max:4, step:0.05, v:2, show:v=>'$'+v.toFixed(2)+'$'}
            ]
          }
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Time relation', html:'Take the inverse transform of the flat finite-band spectrum. It gives a sinc-shaped autocorrelation.'},
        {t:'eq', label:'Autocorrelation', tex:'R_w(\\tau)=N_0B\\operatorname{sinc}(2B\\tau)', note:'Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$ and $\\operatorname{sinc}(0)=1$. The first zeros occur at $\\tau=\\pm1/(2B)$.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'An ideal lowpass filter has $B=1$ MHz. Read its noise output $0.5\\ \\mu$s apart.<div class="nsep"></div>How are the samples related?',
          ask:{
            key:'m2-rp-white-correlation',
            choices:['uncorrelated', 'fully correlated', 'negatively correlated'],
            answer:0,
            why:'$2B\\tau=1$, so $R_w(\\tau)=N_0B\\operatorname{sinc}(1)=0$.'
          }
        }
      ]
    }
  ],
  src:'book 5.3.2'
},

{
  id:'m2-rp-white-ideal',
  module:'M2',
  nav:'The white-noise model',
  title:'The white-noise model',
  objective:'Distinguish ideal white noise from finite-band noise and explain why filtering gives finite output power.',
  keywords:'random signal noise receiver the white-noise model',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'The white-noise model'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figWhiteLimit,
          caption:'Drag $B$. The peak $2B$ grows and the lobe narrows, but the area stays $1$. As $B$ grows without limit, the curve tends to the impulse $\\delta(\\tau)$.',
          live:{
            controls:[
              {k:'B', label:'$B$ (kHz)', min:0.5, max:50, step:0.5, v:1, show:v=>'$'+v.toFixed(1)+'$'}
            ]
          }
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Ideal model', html:'Ideal white noise has a constant PSD over all frequencies. Its total power is infinite, so it is a generalized model.'},
        {t:'eq', label:'White noise', tex:'S_w(f)=\\frac{N_0}{2},\\qquad R_w(\\tau)=\\frac{N_0}{2}\\delta(\\tau)', note:'A constant spectrum transforms to an impulse. Practical receivers admit a finite band.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'White noise enters a finite-energy receive filter.<div class="nsep"></div>Must the output noise power be infinite?',
          ask:{
            key:'m2-rp-white-ideal',
            choices:['yes', 'no'],
            answer:1,
            why:'A finite-energy filter has finite $\\int|H(f)|^2df$, so its output noise power is finite.'
          }
        }
      ]
    }
  ],
  src:'book 5.3.2'
},

{
  id:'m2-rp-mean-filter',
  module:'M2',
  nav:'The mean through a filter',
  title:'The mean through a filter',
  objective:'Compute the output mean of an LTI filter when the required output statistics exist.',
  keywords:'random signal noise receiver the mean through a filter',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'The mean through a filter'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {t:'fig', frame:true, grow:true, svg:figFilterTime, caption:'A lowpass filter smooths this illustrative noise recording. Its effect on the ensemble mean depends on the DC gain.'},
        {
          t:'legend',
          items:[
            ['in', 'input'],
            ['out', 'filtered output']
          ],
          at:'tr'
        }
      ],
      right:[
        {t:'note', kind:'def', head:'LTI filter', html:'An LTI filter weights delayed values of $X(t)$. For a WSS input, the mean is constant.'},
        {t:'eq', label:'Mean', tex:'\\begin{aligned}\\mu_Y&=\\int_{-\\infty}^{\\infty}h(u)E[X(t-u)]\\,du\\\\&=\\mu_X\\int_{-\\infty}^{\\infty}h(u)\\,du=\\mu_XH(0)\\end{aligned}', note:'$H(0)$ is the DC gain. Assume the output statistics exist.'},
        {t:'note', kind:'def', head:'Expectation and DC gain', html:'$E[\\cdot]$ is linear, and $h(u)$ is not random, so $E$ acts only on $X$. For a WSS input $E[X(t-u)]=\\mu_X$ is constant, so it leaves the integral.<div class="nsep"></div>Since $H(f)=\\int h(u)e^{-j2\\pi fu}du$, setting $f=0$ makes the exponential $1$, so $\\int h(u)\\,du=H(0)$.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'A differentiable input with mean $3$ V enters $H(f)=j2\\pi f$.<div class="nsep"></div>What is the output mean?',
          ask:{
            key:'m2-rp-mean-filter',
            choices:['$0$', '$3$ V', '$6\\pi$ V'],
            answer:0,
            why:'$H(0)=0$, so $\\mu_Y=3H(0)=0$.'
          }
        }
      ]
    }
  ],
  src:'book 5.2.4'
},

{
  id:'m2-rp-lti',
  module:'M2',
  nav:'The spectrum through a filter',
  title:'The spectrum through a filter',
  objective:'Compute the output PSD from the input PSD and filter power gain.',
  keywords:'random signal noise receiver the spectrum through a filter',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'The spectrum through a filter'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figFilterSpectrum,
          caption:'Build the output PSD from the input PSD and the power gain $|H(f)|^2$. Low frequencies pass; high frequencies are attenuated.',
          frames:{
            labels:['input PSD', 'power gain', 'output PSD']
          }
        },
        {
          t:'legend',
          items:[
            ['in', '$S_X(f)$', false],
            ['h', '$|H(f)|^2$', false, 1],
            ['out', '$S_Y(f)$', false, 2]
          ],
          at:'tr'
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Output spectrum', html:'For receiver noise, set $X(t)=w(t)$ and $Y(t)=n(t)$. The filter scales the PSD by $|H(f)|^2$.'},
        {t:'eq', label:'LTI result', tex:'\\begin{aligned}S_Y(f)&=H(f)H^*(f)S_X(f)\\\\&=|H(f)|^2S_X(f)\\end{aligned}', note:'For a real filter and a WSS input, the output PSD is the input PSD times $|H(f)|^2$. Assume the output statistics exist.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'At one frequency, a filter has $|H(f)|=1/2$.<div class="nsep"></div>What fraction of the input PSD remains?',
          ask:{
            key:'m2-rp-lti',
            choices:['$1/2$', '$1/4$', '$1$'],
            answer:1,
            why:'Power gain is the squared magnitude: $|H(f)|^2=(1/2)^2=1/4$.'
          }
        }
      ]
    }
  ],
  src:'book 5.2.4, 5.2.5'
},

{
  id:'m2-rp-filtered',
  module:'M2',
  nav:'Filtered white noise',
  title:'Filtered white noise',
  objective:'Compute output white-noise power by integrating the output PSD.',
  keywords:'random signal noise receiver filtered white noise',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Filtered white noise'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figOutputNoise,
          caption:'The filter gain $|H(f)|^2$ shapes the flat input PSD. The area under the output PSD is the output noise power, and a rectangle of equal area gives the same power.',
          frames:{
            labels:['white noise in', 'filter gain', 'output PSD', 'equal area']
          }
        },
        {
          t:'legend',
          items:[
            ['in', '$N_0/2$', true],
            ['h', '$|H(f)|^2$', true, 1],
            ['out', '$S_n(f)$', false, 2]
          ],
          at:'tr'
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Noise power', html:'The admitted noise power depends on the area under $|H(f)|^2$.'},
        {t:'eq', label:'Output power', tex:'P_n=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^2\\,df', note:'For a finite-energy filter, this integral is finite.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Two filters have the same area under $|H(f)|^2$.<div class="nsep"></div>Which passes more of the same white noise?',
          ask:{
            key:'m2-rp-filtered',
            choices:['the first', 'the second', 'both pass the same power'],
            answer:2,
            why:'The integral is equal, so both output noise powers are equal.'
          }
        }
      ]
    }
  ],
  src:'book 5.3.3'
},

{
  id:'m2-rp-noise-bandwidth',
  module:'M2',
  nav:'Noise-equivalent bandwidth',
  title:'Noise-equivalent bandwidth',
  objective:'Replace a filter by an ideal equal-area filter to compute its admitted white-noise power.',
  keywords:'random signal noise receiver filtered white noise',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Noise-equivalent bandwidth'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figNoiseBwGen,
          caption:'The dashed ideal filter has the same peak gain and total area. Its half-width is the noise-equivalent bandwidth.',
          live:{
            controls:[
              {k:'b', label:'$B_{\\text{neq}}$ (kHz)', min:0.1, max:1, step:0.05, v:0.5, show:v=>'$'+v.toFixed(2)+'$'}
            ]
          }
        },
        {
          t:'legend',
          items:[
            ['h', '$|H(f)|^2$'],
            ['slate', 'equal-area ideal filter', true]
          ],
          at:'tr'
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Equal-area filter', html:'Equal spectral areas pass equal white-noise powers.'},
        {t:'eq', label:'Definition', tex:'\\begin{aligned}B_{\\text{neq}}&=\\frac{\\int_{-\\infty}^{\\infty}|H(f)|^2df}{2H_{\\max}^2}\\\\P_n&=N_0B_{\\text{neq}}H_{\\max}^2\\end{aligned}', note:'Here $H_{\\max}$ is the peak magnitude. The ideal filter has total width $2B_{\\text{neq}}$.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Two filters have $B_{\\text{neq}}=1$ kHz. One has $H_{\\max}=1$, the other $H_{\\max}=2$.<div class="nsep"></div>How much more white-noise power does the second pass?',
          ask:{
            key:'m2-rp-noise-bandwidth',
            choices:['the same', 'twice', 'four times'],
            answer:2,
            why:'$P_n=N_0B_{\\text{neq}}H_{\\max}^2$, and $H_{\\max}^2$ grows from $1$ to $4$.'
          }
        }
      ]
    }
  ],
  src:'book 5.3.3'
},

{
  id:'m2-rp-rc-bandwidth',
  module:'M2',
  nav:'Noise bandwidth of an RC filter',
  title:'Noise bandwidth of an RC filter',
  objective:'Derive the RC noise-equivalent bandwidth and compute the admitted white-noise power.',
  keywords:'random signal noise receiver noise bandwidth of an rc filter',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Noise bandwidth of an RC filter'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {t:'fig', frame:true, grow:true, svg:figNoiseBw, caption:'For $RC=1$ ms, the equivalent half-width is $250$ Hz. The $3$ dB frequency is $159$ Hz.'},
        {
          t:'legend',
          items:[
            ['h', '$|H(f)|^2$'],
            ['slate', 'equal-area ideal filter', true]
          ],
          at:'tr'
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Method', html:'Use $|H(f)|^2=1/[1+(2\\pi fRC)^2]$, with $H_{\\max}=1$. Substitute $u=2\\pi fRC$.'},
        {t:'eq', label:'Integrate the power gain', tex:'\\begin{aligned}\\int_{-\\infty}^{\\infty}|H(f)|^2df&=\\frac{1}{2\\pi RC}\\int_{-\\infty}^{\\infty}\\frac{du}{1+u^2}\\\\&=\\frac{\\pi}{2\\pi RC}=\\frac{1}{2RC}\\\\B_{\\text{neq}}&=\\frac{1}{4RC}\\end{aligned}', note:'The antiderivative is $\\arctan u$. Its infinite limits give $\\pi$.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'$N_0/2=10^{-8}$ W/Hz and $RC=1$ ms.<div class="nsep"></div>What is the output noise power?',
          ask:{
            key:'m2-rp-rc-bandwidth',
            choices:['$3.2\\ \\mu$W', '$5\\ \\mu$W', '$10\\ \\mu$W'],
            answer:1,
            why:'$B_{\\text{neq}}=250$ Hz, so $P_n=(2\\times10^{-8})(250)=5\\ \\mu$W.'
          }
        }
      ]
    }
  ],
  src:'book 5.3.3'
},

{
  id:'m2-rp-gauss',
  module:'M2',
  nav:'Gaussian noise',
  title:'Gaussian noise',
  objective:'Distinguish whiteness and Gaussianity and explain the Gaussian thermal-noise approximation.',
  keywords:'random signal noise receiver gaussian noise',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'Gaussian noise'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {
          t:'fig',
          frame:true,
          grow:true,
          svg:figClt,
          caption:'Each source $X_i$ is a random number, equally likely anywhere in $[-1,1]$. Press Next to add sources. The shape of the sum rounds into the bell curve.',
          frames:{
            labels:['1 source', '2 sources', '5 sources', '30 sources']
          }
        },
        {
          t:'legend',
          items:[
            ['mid', 'sum of the sources'],
            ['slate', 'Gaussian bell curve']
          ],
          at:'tr'
        }
      ],
      right:[
        {t:'note', kind:'def', head:'Experiment', html:'Draw $n$ independent random numbers, each flat on $[-1,1]$, and add them. Scale the sum by $\\sqrt{n/3}$ so its variance is $1$. Repeat many times and plot how often each value of $Z$ occurs.'},
        {t:'note', kind:'def', head:'Gaussian model', html:'One source gives a flat box. Two give a triangle. Five already look like a bell. Thermal noise is a sum of a huge number of tiny independent motions, so it is Gaussian.'},
        {t:'note', kind:'def', head:'Two properties', html:'White describes the spectrum. Gaussian describes the joint distributions. A process can have either property without the other.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'A Gaussian noise process passes through a linear filter with finite output variance.<div class="nsep"></div>What is the distribution of one output sample?',
          ask:{
            key:'m2-rp-gauss',
            choices:['Gaussian', 'uniform', 'always zero'],
            answer:0,
            why:'Linear combinations of jointly Gaussian values are Gaussian. Filtering changes their variance and time correlation.'
          }
        }
      ]
    }
  ],
  src:'book 5.3.1'
},

{
  id:'m2-rp-sample',
  module:'M2',
  nav:'From a noise waveform to one sample',
  title:'From a noise waveform to one sample',
  objective:'Connect the filtered noise process to a Gaussian sample and compute its tail probability.',
  keywords:'random signal noise receiver from a noise waveform to one sample',
  slide:true,
  steps:1,
  blocks:[
    {t:'eyebrow', text:'Module 2 · Random signals'},
    {t:'title', text:'From a noise waveform to one sample'},
    {
      t:'cols',
      ratio:'c-5-7',
      fill:true,
      left:[
        {t:'fig', frame:true, grow:true, svg:figGaussianSample, caption:'Fix $T_b$ and repeat the receiver trial. The shaded tail is the probability of a sample above $4$ mV.'}
      ],
      right:[
        {t:'note', kind:'def', head:'Receiver sample', html:'The filtered noise $n(t)$ is a random process. At the end of a bit of duration $T_b$, read $n=n(T_b)$.'},
        {t:'eq', label:'Filtered white Gaussian noise', tex:'\\begin{aligned}n=n(T_b)&\\sim\\mathcal N(0,\\sigma_n^2)\\\\\\sigma_n^2=E[n^2]&=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^2df\\end{aligned}', note:'For zero-mean noise, variance equals mean-square power. The filter therefore determines the spread of the samples.'},
        {
          t:'note',
          kind:'def',
          head:'Given',
          html:'Here $\\sigma_n=2$ mV. For a Gaussian $X$ with mean $\\mu$ and standard deviation $\\sigma$, $P(X>z)=Q\\bigl((z-\\mu)/\\sigma\\bigr)$.<div class="nsep"></div>What is $P(n>4\\ \\text{mV})$?',
          ask:{
            key:'m2-rp-sample',
            choices:['$Q(1)$', '$Q(2)$', '$Q(4)$'],
            answer:1,
            why:'Normalize by the standard deviation: $Q(4/2)=Q(2)=0.0228$. This sample model will be used to calculate decision errors.'
          }
        }
      ]
    }
  ],
  src:'book 5.3.1, 5.3.3'
},

REAL_RANDOM,

{ id:'m2-lab-t', module:'M2', nav:'Laboratory {lab} · A random signal through a filter', title:'Laboratory {lab} · A random signal through a filter',
  objective:'Pass three random signals through a lowpass filter and compare the measured output power, autocorrelation and spectrum with the theory.',
  keywords:'laboratory random process white noise random phase sinusoid random binary wave filter rc ideal lowpass autocorrelation power spectral density output power interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'Laboratory {lab} · A random signal through a filter'},
  {t:'lede', text:'Choose a random signal and a filter. Watch the measurements settle on the theory.'},
  {t:'lab', id:'T'}
]},

{ id:'m2-code-random', module:'M2', nav:'Code · Random signals', title:'Random signals in code',
  objective:'Average over an ensemble, transform an autocorrelation and measure the power of filtered white noise.',
  keywords:'code matlab python program run ensemble average autocorrelation power spectral density wiener khinchin white noise rc filter noise equivalent bandwidth',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 2 · Random signals in code'},
  {t:'title', text:'Random signals in code'},
  {t:'raw', html:()=>CODEBANK.page('m2-code-random')}
]}

];

window.SCENES_M2R = SC;
})();
