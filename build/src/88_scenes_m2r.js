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
  const f = frameOf(v, 3), o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  const a = P.Axes(SZ({xr:[0,13.4], yr:[-3.5,4.1], xlabel:'t\\;(\\text{ms})', ylabel:'x(t)',
    xticksOverride:[0,2,4,6,8], yticksOverride:[-2,0,2]}));
  fade(a, 0.32*o1, ()=>{ for(let i=1;i<8;i++) a.curve(path(EN_P[i], EN_DT, EN_T1), {color:C.in, width:0.9, n:700}); });
  a.curve(path(EN_P[0], EN_DT, EN_T1), {color:C.in, width:2.9, n:900});
  fade(a, o2, ()=>{
    a.poly([[EN_T0,-3.5],[EN_T0,3.2]], {color:C.mid, width:1.6, dash:'5 4'});
    EN_P.forEach((x,i)=>{ const y = path(x, EN_DT, EN_T1)(EN_T0); if(i || o1 > 0.5) a.point(EN_T0, y, {color:C.mid, r:4.2}); });
    a.note(EN_T0, 3.55, 't_0', {tex:true, fs:15, color:C.mid, anchor:'middle'});
  });
  if(o3 > 0.01){
    const X0 = 9.7, L = 3.2/Math.max(...EN_H);
    EN_H.forEach((c,k)=>{ if(c) a.rect(X0, EN_LO+k*EN_BW+0.015, X0+L*c*o3, EN_LO+(k+1)*EN_BW-0.015, {fill:C.dec.mid, stroke:C.mid, width:1}); });
    fade(a, o3, ()=>{
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
  AC_P.forEach(x=>a.curve(path(x, AC_DT, 6), {color:C.in, width:1.5, n:700}));
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
   A = 3, f0 = 1 kHz, tau in ms. The given sample function (theta = -pi/2, a
   sine, so it is zero on the vertical axis where the tick numbers sit) is the
   faint trace; the answer R(tau) = (A^2/2) cos(2 pi f0 tau) = 4.5 cos(2 pi tau)
   sits in the sketch key. */
function figExPhase(){
  const a = P.Axes(SZ({xr:[-1.6,1.6], yr:[-6.6,6.6], xlabel:'t,\\;\\tau\\;(\\text{ms})', ylabel:'x(t),\\;R_X(\\tau)',
    xticksOverride:[-1.5,-1,-0.5,0.5,1,1.5], yticksOverride:[-4.5,-3,3,4.5]}));
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  a.curve(t=>3*Math.sin(2*Math.PI*t), {color:C.ink, width:1.6, dash:'6 5', n:700});
  a.note(-1.56, -5.95, 'x(t),\\;\\theta=-\\pi/2', {tex:true, fs:14, color:C.ink});
  a.raw('<g class="sk-key">');
  a.curve(t=>4.5*Math.cos(2*Math.PI*t), {color:C.mid, width:2.6, n:700});
  a.point(0, 4.5, {color:C.mid, r:5});
  a.note(0.1, 5.55, 'R_X(0)=4.5', {tex:true, fs:15, color:C.mid});
  a.raw('</g>');
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
const WH_DF = 0.05, WH_PH = (()=>{ const r = rng(20260451), o = []; for(let k=0;k<200;k++) o.push(2*Math.PI*r()); return o; })();
function figWhite(v){
  const B = val(v, 'B', 2), hA = TOPH(), hB = 270 + extraHeight(hA+270);
  const K = Math.max(1, Math.floor(B/WH_DF - 0.5) + 1), g = Math.sqrt(2/K);
  const a = P.Axes({w:560, h:hA, xr:[0,3], yr:[-3.4,3.4], xlabel:'t\\;(\\text{ms})', ylabel:'x(t)/\\sigma',
    pad:{l:56,r:26,t:22,b:40}, xticksOverride:[0,0.5,1,1.5,2,2.5,3], yticksOverride:[-2,0,2]});
  a.curve(t=>{ let s = 0; for(let k=0;k<K;k++) s += Math.cos(2*Math.PI*(k+0.5)*WH_DF*t + WH_PH[k]); return g*s; },
    {color:C.in, width:1.4, n:1200});
  const b = P.Axes({w:280, h:hB, xr:[-1.2,1.2], yr:[-0.3,1.3], xlabel:'\\tau\\;(\\text{ms})', ylabel:'R_X(\\tau)/N_0B',
    pad:{l:48,r:16,t:24,b:42}, xticksOverride:[-1,0,1], yticksOverride:[0.5,1]});
  b.curve(t=>sinc(2*B*t), {color:C.mid, width:2.5, n:1400});
  const z = 1/(2*B);
  if(z <= 1.15){ [-z, z].forEach(t=>b.point(t, 0, {color:C.mid, r:4.4}));
    b.note(z+0.06, 0.16, '\\tfrac{1}{2B}', {tex:true, fs:15, color:C.mid}); }
  const c = P.Axes({w:280, h:hB, xr:[-10,10], yr:[0,1.45], xlabel:'f\\;(\\text{kHz})', ylabel:'S_X(f)',
    pad:{l:48,r:16,t:24,b:42}, xticksOverride:[-10,-5,0,5,10], yticksOverride:[1], ytickfmt:()=>''});
  c.poly([[-10,1],[10,1]], {color:C.in, width:1.4, dash:'4 5'});
  c.rect(-B, 0, B, 1, {fill:C.dec.in});
  c.poly([[-10,0],[-B,0],[-B,1],[B,1],[B,0],[10,0]], {color:C.in, width:2.6});
  c.note(-9.7, 1.16, '\\tfrac{N_0}{2}', {tex:true, fs:15, color:C.in});
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
  a.curve(at, {color:C.mid, width:2.6, n:720});
  a.curve(dN, {color:C.slate, width:1.8, dash:'7 5', n:500});
  const n = [1,2,5,30][Math.round(f)];
  a.note(-3.45, 0.54, `n=${n}`, {tex:true, fs:16, color:C.mid});
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

const EB = 'Module 2 · Random signals';
const SC = [

{ id:'m2-rp-ensemble', module:'M2', nav:'A random signal', title:'A random signal',
  objective:'Describe a random signal as an ensemble of waveforms and as a random variable at each fixed time.',
  keywords:'random process stochastic process ensemble sample function outcome random variable fixed time noise voltage histogram density',
  src:'SPS intro; book 5.2', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'A random signal'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['one outcome','the ensemble','a fixed time','the distribution']},
      svg:figEnsemble,
      caption:'Step through the frames. Each run of the experiment draws one waveform. Across all runs, the value at $t_0$ is a random variable, and its histogram is drawn at the right.'}
  ], right:[
    {t:'note', kind:'def', head:'Random process', html:'A random process $X(t)$ gives one waveform for each outcome of an experiment. Each waveform is a sample function, and all of them together are the ensemble.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'At a fixed time', tex:'X(t_0)\\ \\text{is a random variable with density}\\ f_{X(t_0)}(x)',
        note:'Fix the time and let the outcome vary. The values across the ensemble spread with this density.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A thousand identical receivers record their noise. Each one is read at the same time $t_0=2$ ms.<div class="nsep"></div>What are the thousand values?',
        ask:{key:'m2-rp-ensemble', choices:['one sample function','draws of the random variable $X(t_0)$','the autocorrelation'], answer:1,
          why:'The time is fixed and the outcome changes. So the values are draws of one random variable.'}}]}
  ]}
]},

{ id:'m2-rp-acf', module:'M2', nav:'Mean and autocorrelation', title:'Mean and autocorrelation',
  objective:'Define the mean and the autocorrelation of a random process and read the autocorrelation from pairs of values.',
  keywords:'mean autocorrelation expected value ensemble average pairs of samples correlation lag tau scatter plot correlation time',
  src:'book 5.2.1', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'Mean and autocorrelation'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'tau', label:'$\\tau$ (ms)', min:0, max:3, step:0.05, v:0.5, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figAcf,
      caption:'Drag the gap $\\tau$. Each dot is one sample function read at $t$ and at $t+\\tau$. Close together the pairs agree. Far apart they form a round cloud.'}
  ], right:[
    {t:'eq', label:'Mean', tex:'\\mu_X(t)=E\\bigl[X(t)\\bigr]',
      note:'The average over the ensemble at the time $t$, not an average over time.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Autocorrelation', tex:'R_X(t,t+\\tau)=E\\bigl[X(t)\\,X(t+\\tau)\\bigr]',
        note:'The average product of two values $\\tau$ apart. It is large when the two values move together.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'For this process $R_X$ depends only on the gap: $R_X(\\tau)=e^{-|\\tau|/\\tau_c}$ with $\\tau_c=1$ ms.<div class="nsep"></div>What is $R_X(1\\ \\text{ms})$?',
        ask:{key:'m2-rp-acf', choices:['$0.37$','$0.61$','$1$'], answer:0,
          why:'$R_X(1\\ \\text{ms})=e^{-1}=0.37$. Values $1$ ms apart are still partly alike.'}}]}
  ]}
]},

{ id:'m2-rp-wss', module:'M2', nav:'Stationarity and power', title:'Stationarity and power',
  objective:'State wide-sense stationarity and the three properties of the autocorrelation, with the power as its value at zero.',
  keywords:'wide sense stationary wss stationarity autocorrelation properties even function maximum at zero average power R(0)',
  src:'book 5.2.2', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'Stationarity and power'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$R_X(\\tau)$','power','even','bounded']},
      svg:figWss,
      caption:'Step through the frames for $R_X(\\tau)=4e^{-|\\tau|/2}\\cos(2\\pi\\tau)$, with $\\tau$ in ms. Each frame marks one property.'}
  ], right:[
    {t:'note', kind:'def', head:'Wide-sense stationary', html:'A process is wide-sense stationary when its mean is a constant and $R_X$ depends only on the gap $\\tau$. A shift of the time origin changes neither.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Three properties', tex:'\\begin{aligned}R_X(0)&=E\\bigl[X^{2}(t)\\bigr]=P_X\\\\R_X(-\\tau)&=R_X(\\tau)\\\\|R_X(\\tau)|&\\le R_X(0)\\end{aligned}',
        note:'The first is the average power. A value is never more alike to another value than to itself, which is the third.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$R_X(\\tau)=4e^{-|\\tau|/2}\\cos(2\\pi\\tau)\\ \\text{V}^{2}$, with $\\tau$ in ms.<div class="nsep"></div>What is the average power $P_X$?',
        ask:{key:'m2-rp-wss', choices:['$2\\ \\text{V}^{2}$','$4\\ \\text{V}^{2}$','$8\\ \\text{V}^{2}$'], answer:1,
          why:'$P_X=R_X(0)=4e^{0}\\cos0=4\\ \\text{V}^{2}$. Across $1\\ \\Omega$ that is $4$ W.'}}]}
  ]}
]},

{ id:'m2-rp-ex-phase', module:'M2', nav:'Worked example · a random phase', title:'Worked example: a sinusoid with a random phase',
  objective:'Find the mean, the autocorrelation and the power of a sinusoid whose phase is uniformly random.',
  keywords:'worked example random phase sinusoid uniform phase mean zero autocorrelation cosine power A^2/2 stationary sketch',
  src:'book Ex. 5.2.2, 5.2.8', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Worked example'},
  {t:'title', text:'Worked example: a sinusoid with a random phase'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Sketch $R_X(\\tau)$ on the axes, then check it.'}, svg:figExPhase,
      caption:'The dashed trace is one sample function, the one with $\\theta=-\\pi/2$. Draw $R_X(\\tau)$ on the same axes, then show the answer.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$X(t)=A\\cos(2\\pi f_0t+\\Theta)$, $A=3$ V, $f_0=1$ kHz, $\\Theta$ uniform on $[0,2\\pi)$.<div class="nsep"></div>Find $\\mu_X$, $R_X(\\tau)$ and $P_X$.',
      ask:{key:'m2-rp-ex-phase', choices:['$1.5\\ \\text{V}^{2}$','$4.5\\ \\text{V}^{2}$','$9\\ \\text{V}^{2}$'], answer:1,
        why:'$P_X=R_X(0)=A^{2}/2=9/2=4.5\\ \\text{V}^{2}$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\begin{aligned}\\mu_X&=\\tfrac{1}{2\\pi}\\textstyle\\int_0^{2\\pi}A\\cos(2\\pi f_0t+\\theta)\\,d\\theta=0\\\\R_X&=\\tfrac{A^{2}}{2}E\\bigl[\\cos(2\\pi f_0\\tau)+\\cos(\\phi+2\\Theta)\\bigr]\\end{aligned}',
        note:'Average over the phase. A product of cosines is half the cosine of the difference plus half the cosine of the sum, $\\phi=2\\pi f_0(2t+\\tau)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}R_X(\\tau)&=\\tfrac{A^{2}}{2}\\cos(2\\pi f_0\\tau)=4.5\\cos(2\\pi f_0\\tau)\\ \\text{V}^{2}\\\\P_X&=R_X(0)=4.5\\ \\text{V}^{2}\\end{aligned}',
        note:'Check: $\\cos(\\phi+2\\Theta)$ averages to zero. $R_X$ depends on $\\tau$ only, so the process is stationary.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $A^{2}/2$, not $A^{2}$, for the power. Dropping the $\\tfrac12$ gives $9\\ \\text{V}^{2}$.'}]}
  ]}
]},

{ id:'m2-rp-psd', module:'M2', nav:'Power spectral density', title:'Power spectral density',
  objective:'Define the power spectral density as the Fourier transform of the autocorrelation and read the power as its area.',
  keywords:'power spectral density psd wiener khinchin theorem fourier transform autocorrelation spectrum power area correlation time bandwidth',
  src:'SPS 5; book 5.2.5', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'Power spectral density'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'tc', label:'$\\tau_c$ (ms)', min:0.05, max:1, step:0.01, v:0.3, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figPsdR,
      caption:'Drag $\\tau_c$ in $R_X(\\tau)=e^{-|\\tau|/\\tau_c}$, whose transform is $S_X(f)=2\\tau_c/\\bigl(1+(2\\pi f\\tau_c)^{2}\\bigr)$. A fast waveform has a narrow $R_X$ and a wide spectrum. The area stays $1$.'}
  ], right:[
    {t:'eq', label:'Wiener–Khinchin', key:true, tex:'S_X(f)=\\int_{-\\infty}^{\\infty}R_X(\\tau)\\,e^{-j2\\pi f\\tau}\\,d\\tau',
      note:'For a stationary process the power spectral density is the Fourier transform of $R_X(\\tau)$. It is real, even and never negative.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Power', tex:'\\begin{aligned}R_X(\\tau)&=\\int_{-\\infty}^{\\infty}S_X(f)\\,e^{j2\\pi f\\tau}\\,df\\\\P_X=R_X(0)&=\\int_{-\\infty}^{\\infty}S_X(f)\\,df\\end{aligned}',
        note:'Write the inverse transform and set $\\tau=0$. The power is the area under the spectral density.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A process has $S_X(f)=10^{-3}$ W/Hz for $|f|<5$ kHz and $0$ elsewhere.<div class="nsep"></div>What is its power $P_X$?',
        ask:{key:'m2-rp-psd', choices:['$5$ W','$10$ W','$20$ W'], answer:1,
          why:'$P_X=\\int_{-5000}^{5000}10^{-3}\\,df=10^{-3}(10^{4})=10$ W. Both halves of the band count.'}}]}
  ]}
]},

{ id:'m2-rp-white', module:'M2', nav:'White noise', title:'White noise',
  objective:'Model thermal noise as white noise with a flat two-sided density N0/2 and an impulse autocorrelation.',
  keywords:'white noise flat power spectral density N0/2 two sided impulse autocorrelation uncorrelated bandlimited sinc thermal noise',
  src:'book 5.3.2', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'White noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'B', label:'$B$ (kHz)', min:0.5, max:8, step:0.1, v:2, show:v=>'$'+v.toFixed(1)+'$'}]},
      svg:figWhite,
      caption:'Drag the band $B$ of noise with density $N_0/2$ on $|f|<B$. Its $R_X(\\tau)=N_0B\\operatorname{sinc}(2B\\tau)$, with $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$, narrows toward an impulse as $B$ grows.'}
  ], right:[
    {t:'eq', label:'White noise', tex:'S_W(f)=\\frac{N_0}{2}\\quad\\text{for all }f,\\qquad R_W(\\tau)=\\frac{N_0}{2}\\,\\delta(\\tau)',
      note:'The inverse transform of a constant is an impulse. So two values at different times are uncorrelated, however close.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'A model', html:'The area under a flat density is infinite, so no real noise is white. Thermal noise stays within $10\\%$ of flat up to $10^{12}$ Hz, far above any receiver band.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'White noise passes an ideal lowpass filter with $B=1$ MHz. Two output samples are taken $0.5\\ \\mu$s apart.<div class="nsep"></div>How are the two samples related?',
        ask:{key:'m2-rp-white', choices:['uncorrelated','fully correlated','negatively correlated'], answer:0,
          why:'$R(\\tau)$ is proportional to $\\operatorname{sinc}(2B\\tau)$, and $2B\\tau=2(10^{6})(0.5\\times10^{-6})=1$ is a zero of the sinc.'}}]}
  ]}
]},

{ id:'m2-rp-lti', module:'M2', nav:'Through a linear filter', title:'A random signal through a filter',
  objective:'Find the mean and the power spectral density of a random process at the output of a linear time-invariant filter.',
  keywords:'linear time invariant filter lti random process output mean dc gain H(0) output power spectral density |H(f)|^2 autocorrelation convolution',
  src:'SPS 1, 8; book 5.2.4, 5.2.5', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'A random signal through a filter'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['$S_X(f)$','$|H(f)|^{2}$','$S_Y(f)$','in time']},
      svg:figLti,
      caption:'Step through the frames. White noise with $N_0/2=0.5$ enters an RC lowpass filter with $f_{3\\text{dB}}=1$ kHz. The output keeps the low frequencies, so it varies more slowly.'},
    {t:'legend', items:[['in','$S_X(f)$'],['h','$|H(f)|^{2}$',true,1],['out','$S_Y(f)$',0,2]], at:'tr'}
  ], right:[
    {t:'eq', label:'Mean', tex:'\\mu_Y=\\mu_X\\int_{-\\infty}^{\\infty}h(t)\\,dt=\\mu_X\\,H(0)',
      note:'Take the expectation inside the convolution integral. Only the gain at $f=0$ matters.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Key result · Output spectrum', result:true, tex:'\\begin{aligned}R_Y(\\tau)&=h(\\tau)*h(-\\tau)*R_X(\\tau)\\\\S_Y(f)&=H(f)\\,H^{*}(f)\\,S_X(f)=|H(f)|^{2}S_X(f)\\end{aligned}',
        note:'Transform each factor. For a real $h$, $h(-\\tau)$ becomes $H^{*}(f)$, so the phase of $H$ drops out.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A process with mean $\\mu_X=3$ V passes a differentiator, $H(f)=j2\\pi f$.<div class="nsep"></div>What is the output mean $\\mu_Y$?',
        ask:{key:'m2-rp-lti', choices:['$0$','$3$ V','$6\\pi$ V'], answer:0,
          why:'$\\mu_Y=\\mu_XH(0)=3\\,(j2\\pi\\cdot0)=0$. A differentiator removes the constant part.'}}]}
  ]}
]},

{ id:'m2-rp-filtered', module:'M2', nav:'Filtered white noise', title:'Filtered white noise',
  objective:'Compute the output power of white noise through a filter with the noise-equivalent bandwidth.',
  keywords:'filtered white noise output noise power noise equivalent bandwidth rc lowpass 1/(4RC) 3 dB bandwidth ideal filter same area',
  src:'book 5.3.3, Ex. 5.3.4', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'Filtered white noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'rc', label:'$RC$ (ms)', min:0.25, max:2, step:0.05, v:1, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figNoiseBw,
      caption:'Drag $RC$. The dashed ideal filter has the same peak and the same area as $|H(f)|^{2}$. Its half-width $B_{\\text{neq}}$ is wider than the $3$ dB frequency.'},
    {t:'legend', items:[['h','$|H(f)|^{2}$'],['slate','ideal, same area',true]], at:'tr'}
  ], right:[
    {t:'eq', label:'Output power', tex:'\\begin{aligned}P_Y&=\\int_{-\\infty}^{\\infty}\\frac{N_0}{2}\\,|H(f)|^{2}\\,df\\\\&=N_0\\,B_{\\text{neq}}\\,H_{\\max}^{2}\\end{aligned}',
      note:'Here $B_{\\text{neq}}=\\int|H(f)|^{2}df\\,/\\,(2H_{\\max}^{2})$ is the noise-equivalent bandwidth: the half-width of an ideal filter that passes the same noise power.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'RC lowpass', tex:'\\begin{aligned}\\int_{-\\infty}^{\\infty}\\frac{df}{1+(2\\pi fRC)^{2}}&=\\frac{1}{2\\pi RC}\\int_{-\\infty}^{\\infty}\\frac{du}{1+u^{2}}=\\frac{1}{2RC}\\\\B_{\\text{neq}}&=\\frac{1}{4RC}\\end{aligned}',
        note:'Here $|H(f)|^{2}=1/\\bigl(1+(2\\pi fRC)^{2}\\bigr)$ and $H_{\\max}=1$. Substitute $u=2\\pi fRC$. The integral of $1/(1+u^{2})$ is $\\pi$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'White noise with $N_0/2=10^{-8}$ W/Hz passes an RC filter with $RC=1$ ms.<div class="nsep"></div>What is the output power $P_Y$?',
        ask:{key:'m2-rp-filtered', choices:['$3.2\\ \\mu$W','$5\\ \\mu$W','$10\\ \\mu$W'], answer:1,
          why:'$B_{\\text{neq}}=1/(4RC)=250$ Hz, so $P_Y=N_0B_{\\text{neq}}=(2\\times10^{-8})(250)=5\\ \\mu$W. The $3$ dB width gives $3.2\\ \\mu$W.'}}]}
  ]}
]},

{ id:'m2-rp-gauss', module:'M2', nav:'Gaussian noise', title:'Gaussian noise',
  objective:'Explain why thermal noise is Gaussian and state that a sample of filtered Gaussian noise is a Gaussian random variable.',
  keywords:'gaussian process thermal noise central limit theorem sum of many independent sources normal density filter output sample variance Q function',
  src:'book 5.3, 5.3.1', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'Gaussian noise'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['one source','two','five','thirty']},
      svg:figClt,
      caption:'Step through the frames. Each source adds an independent uniform current, and the sum $Z$ is scaled to unit variance. By five sources it already follows the Gaussian curve.'},
    {t:'legend', items:[['mid','sum of $n$ sources'],['slate','Gaussian',true]], at:'tr'}
  ], right:[
    {t:'note', kind:'def', head:'Central limit theorem', html:'Thermal noise is the sum of the currents of very many electrons, each small and independent. Such a sum has a Gaussian density.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'After a filter', tex:'Y(t_0)\\sim\\mathcal{N}(0,\\sigma^{2}),\\qquad\\sigma^{2}=P_Y=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^{2}\\,df',
        note:'A linear filter keeps zero-mean white Gaussian noise Gaussian. So one output sample is a Gaussian variable, and its variance is the output power.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A sample of filtered noise has $\\sigma=2$ mV. $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ is the Gaussian tail.<div class="nsep"></div>What is $P\\bigl(Y(t_0)>4\\ \\text{mV}\\bigr)$?',
        ask:{key:'m2-rp-gauss', choices:['$Q(1)$','$Q(2)$','$Q(4)$'], answer:1,
          why:'Divide by $\\sigma$: $P(Y>4\\ \\text{mV})=Q(4/2)=Q(2)=0.0228$.'}}]}
  ]}
]},

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
