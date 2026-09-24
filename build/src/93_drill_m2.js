/* ==========================================================================
   Practice questions — Module 2.

   Thirty questions in the form of the midterm and final examination
   questions of this module. Four shapes come from the examination papers:
   the matched-filter demodulator with two drawn waveforms, the binary
   decision under a noise density that is not Gaussian, and the binary PAM
   question with priors, unequal variances or folded outputs. Two further
   shapes keep the same format and turn the question round: a target error
   that fixes the noise level or the prior, and a detection question that
   carries a raised-cosine bandwidth or interference from the previous bit.

   Every number is new. Each Q-function argument is a two-decimal value a
   table covers, and every stated number has an independent check in
   verify/drills_m2.py.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;
const NS = 'http://www.w3.org/2000/svg';

/* ---- figure helpers ---------------------------------------------------- */

/* One panel placed inside a larger figure: side by side or stacked. */
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const row = (items, h) => { let x = 0, s = '';
  items.forEach(([svg, w]) => { s += place(svg, x, 0, w, h); x += w; });
  return `<svg viewBox="0 0 ${x} ${h}" xmlns="${NS}" role="img">${s}</svg>`; };
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="${NS}" role="img">${s}</svg>`; };

const gpdf = (y, m, v) => Math.exp(-(y-m)*(y-m)/(2*v))/Math.sqrt(2*Math.PI*v);
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16);
  return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; };
/* tick labels in thirds or halves, written as fractions */
const frac = d => v => { const k = Math.round(v*d); if(k===0) return '0';
  if(k % d === 0) return String(k/d); return (k<0?'-':'') + Math.abs(k) + '/' + d; };

/* A waveform given as pieces [t0, t1, f], f a number or a function of t,
   zero outside the pieces, as a polyline from xa to xb. */
function wavePts(segs, xa, xb){
  const pts = [[xa, 0], [segs[0][0], 0]];
  segs.forEach(([a, b, f]) => { const n = typeof f === 'function' ? 80 : 1;
    for(let i=0;i<=n;i++){ const t = a + (b-a)*i/n; pts.push([t, typeof f === 'function' ? f(t) : f]); } });
  pts.push([segs[segs.length-1][1], 0], [xb, 0]);
  return pts;
}
function waveAx(segs, T, o){
  const opt = {w:o.w||380, h:o.h||220, xr:[-0.4, T+0.6], yr:o.yr, xlabel:'t\\;(\\mathrm{s})', ylabel:o.yl,
    pad:{l:58,r:24,t:22,b:40}, xstep:1, ytarget:4};
  if(o.ys) opt.ystep = o.ys;
  if(o.yt) opt.yticksOverride = o.yt;
  if(o.yf) opt.ytickfmt = o.yf;
  const a = P.Axes(opt);
  a.poly(wavePts(segs, -0.4, T+0.6), {color:o.col||C.in, width:2.4});
  return a.svg();
}
/* The matched-filter type demodulator. */
function demod(){
  return P.blocks({w:760,h:150,items:[
    {t:'text',x:14,y:58,label:'s_m(t)',tex:true,anchor:'start',fs:16,color:C.in},
    {t:'text',x:14,y:88,label:'m=0,1',tex:true,anchor:'start',fs:13},
    {t:'arrow',x1:74,y1:62,x2:150,y2:62,color:C.in},
    {t:'sum',x:164,y:62},
    {t:'arrow',x1:164,y1:134,x2:164,y2:78,color:C.muted},
    {t:'text',x:180,y:134,label:'w(t)',tex:true,anchor:'start',fs:15},
    {t:'arrow',x1:178,y1:62,x2:300,y2:62,label:'x(t)',tex:true,color:C.out},
    {t:'box',x:300,y:30,w:160,h:64,label:'\\psi(T-t)',tex:true,color:C.h},
    {t:'text',x:380,y:122,label:'Matched filter',fs:14},
    {t:'arrow',x1:460,y1:62,x2:556,y2:62,label:'y(t)',tex:true,color:C.mid},
    {t:'line',d:'M556,62 h22'},{t:'line',d:'M578,62 l22,-15'},
    {t:'text',x:592,y:24,label:'\\text{sample at }t=T',tex:true,fs:13},
    {t:'arrow',x1:606,y1:62,x2:748,y2:62,label:'Y=y(T)',tex:true,color:C.mid}
  ]});
}
/* The question figure of a matched-filter question: s0 and s1, then the demodulator. */
function mfQ(T, s0, s1, o0, o1){
  return stack(760, [
    [row([[waveAx(s0, T, Object.assign({yl:'s_0(t)'}, o0)), 380],
          [waveAx(s1, T, Object.assign({yl:'s_1(t)'}, o1)), 380]], 220), 220],
    [demod(), 150]]);
}
/* psi(t) beside h(t) = psi(T - t). */
function psiH(T, psi, h, o){
  const ax = (segs, yl, col) => waveAx(segs, T, Object.assign({yl, col}, o));
  return row([[ax(psi, '\\psi(t)', C.in), 380], [ax(h, 'h(t)=\\psi(T-t)', C.h), 380]], 220);
}
/* The weighted conditional densities with the thresholds and the error areas.
   o.dec1(y) says whether y is decided "1"; the density of the other message
   is shaded over each region, so the shaded area is P_b. The plot is drawn in
   the shifted variable u = y - xr[0], so the vertical axis sits at the left
   edge and never runs through a threshold or its label. */
function dens(o){
  const top = o.top, off = o.xr[0], span = o.xr[1] - o.xr[0];
  const step = o.xs || P.niceStep(span, 7);
  const xt = []; for(let v = Math.ceil(off/step - 1e-9)*step; v <= o.xr[1] + 1e-9; v += step) xt.push(v - off);
  const a = P.Axes({w:o.w||760, h:o.h||300, xr:[0, span], yr:[-0.05*top, (o.room||1.42)*top],
    xlabel:o.xl||'y', ylabel:o.yl||'p_m\\,f_Y(y\\mid m)', pad:{l:66,r:28,t:24,b:42}, ytarget:3,
    xticksOverride:xt, xtickfmt: u => P.fmt(u + off, 3)});
  const g = f => u => f(u + off);
  const fill = rgba(C.err, 0.24);
  const edges = [o.xr[0], ...o.lams, o.xr[1]];
  for(let i=0;i<edges.length-1;i++){ const u = edges[i], v = edges[i+1];
    a.area(g(o.dec1((u+v)/2) ? o.f0 : o.f1), u - off, v - off, {color:fill, n:400}); }
  a.curve(g(o.f0), {color:C.mid, width:2.4, dash:'8 5', n:1400});
  a.curve(g(o.f1), {color:C.mid, width:2.4, n:1400});
  o.lams.forEach(l => a.vline(l - off, {color:C.ink, dash:'6 4', width:1.6, opacity:1}));
  (o.notes||[]).forEach(n => { const k = n[4]==='k';
    a.note(n[0] - off, n[1]*top, n[2], {tex:true, fs:15, anchor:k ? 'start' : (n[3]||'middle'), dx:k ? 7 : 0,
      color:k ? C.ink : C.mid}); });
  return a.svg();
}
/* The standard figure of an equal-variance Gaussian question. */
function gdens(m0, m1, v, p0, lam, xr, extra){
  const f0 = y => p0*gpdf(y, m0, v), f1 = y => (1-p0)*gpdf(y, m1, v);
  const top = Math.max(p0, 1-p0)*gpdf(0, 0, v);
  const lo = m0 < m1;
  return dens(Object.assign({xr, top, f0, f1, lams:[lam], dec1: y => lo ? y > lam : y < lam,
    notes:[[m0, f0(m0)/top+0.08, 'p_0\\,f_Y(y\\mid 0)'], [m1, f1(m1)/top+0.08, 'p_1\\,f_Y(y\\mid 1)'],
           [lam, 1.3, '\\lambda='+(+lam.toFixed(3)), 'middle', 'k']]}, extra||{}));
}
/* A noise density drawn as the question gives it. Noise takes no colour. The
   vertical axis sits at the left edge, clear of the peak it labels. */
function noiseQ(f, xr, yr, o){
  const off = xr[0], span = xr[1] - xr[0], step = o.xs || P.niceStep(span, 7);
  const xt = []; for(let v = Math.ceil(off/step - 1e-9)*step; v <= xr[1] + 1e-9; v += step) xt.push(v - off);
  const opt = {w:o.w||640, h:o.h||230, xr:[0, span], yr, xlabel:o.xl||'n', ylabel:o.yl||'f_N(n)',
    pad:{l:62,r:28,t:22,b:40}, ytarget:3, xticksOverride:xt, xtickfmt: u => P.fmt(u + off, 3)};
  if(o.yt) opt.yticksOverride = o.yt;
  if(o.yf) opt.ytickfmt = o.yf;
  const a = P.Axes(opt);
  a.curve(u => f(u + off), {color:C.ink, width:2.4, n:1600});
  if(o.yt) o.yt.forEach(v => a.hline(v, {color:C.muted}));
  return a.svg();
}
const tri = (a) => n => Math.abs(n) <= a ? (1 - Math.abs(n)/a)/a : 0;
const lap = (b) => n => Math.exp(-Math.abs(n)/b)/(2*b);
const expo = (mu) => y => y >= 0 ? Math.exp(-y/mu)/mu : 0;

/* ======================================================================
   The taxonomy: the examination question types of this module.
   ====================================================================== */
CONTENT.DRILLTYPES.M2 = [
  { k:'mf', name:'Matched-filter demodulator for two drawn waveforms',
    asks:'Two waveforms $s_0(t)$ and $s_1(t)$ are drawn, with the noise density. Plot the matched filter, write the two conditional densities of the sample, and find the threshold and the error probability.',
    method:['Find the energy of one nonzero waveform and divide it by the square root of that energy. The result is $\\psi(t)$. Check that the other waveform is a multiple of it.',
            'Reverse $\\psi$ in time and shift it by $T$: $h(t)=\\psi(T-t)$. The coordinates are $s_m=\\int_0^T s_m(t)\\psi(t)\\,dt$, and the noise variance of the sample is $N_0/2$.',
            'With equal priors the threshold is midway between the coordinates, and $P_b=Q\\bigl(d/(2\\sigma)\\bigr)$ for coordinates a distance $d$ apart. With unequal priors, set the weighted densities equal.'],
    go:'m2-demod' },

  { k:'nongauss', name:'Binary decision in noise that is not Gaussian',
    asks:'The sample is the noise, or the noise plus a constant. The noise density is triangular or Laplacian, or the sample is exponential. Find any constant, the error of a given rule, the optimal threshold and its error.',
    method:['Find the constant from $\\int f_N(n)\\,dn=1$ before anything else.',
            'For a rule $Y>t$, integrate each conditional density over the region where its message is decided wrongly. Do not use $Q$, because the noise is not Gaussian.',
            'The optimal threshold solves $p_0\\,f_Y(\\lambda\\mid 0)=p_1\\,f_Y(\\lambda\\mid 1)$. Compare the two densities region by region, because their expressions change at every corner.'],
    go:'m2-threshold' },

  { k:'pam', name:'Binary PAM with priors, unequal variances or folded outputs',
    asks:'The matched-filter output is Gaussian with a mean and a variance for each bit, or it is the magnitude of a Gaussian. Write the conditional densities, find the optimal threshold, and give $P_b$ as a number.',
    method:['Write each conditional density with its own mean and variance. A folded output $Y=|N|$ has the density $2f_N(y)$ for $y\\ge 0$.',
            'Set the weighted densities equal and take logarithms. Unequal variances give a quadratic, and its two roots are two thresholds.',
            'Write each conditional error as a sum or a difference of Gaussian tails. Read each $Q$ value from a table, then weight by the priors.'],
    go:'m2-ex-pe' },

  { k:'design', name:'Working back from a target error or threshold',
    asks:'The error probability or the position of the threshold is given. Find the noise level or the prior that produces it.',
    method:['Write $P_b$ or $\\lambda$ as a function of the unknown quantity first.',
            'Invert the $Q$ function with a table. For example, $Q(x)=10^{-3}$ gives $x=3.09$.',
            'Put the answer back into the forward formula and check that it returns the given value.'],
    go:'m2-pe' },

  { k:'isi', name:'Detection with a bandwidth or with interference',
    asks:'A detection question is joined to a raised-cosine bandwidth, or the sample carries part of the previous bit.',
    method:['For raised-cosine pulses, $W=R_b/2$, $f_1=W(1-\\alpha)$ and $B_T=W(1+\\alpha)$.',
            'The energy per bit is $E_b=P/R_b$. A higher bit rate at the same received power gives a smaller $E_b$.',
            'Interference makes each conditional density a mixture of Gaussians. Average the conditional error over the values of the previous bit.'],
    go:'m2-ex-rc' }
];

/* Wording shared by the matched-filter questions. */
const MF_PARTS = [
  '<b>[5 pts]</b> Plot the impulse response of the matched filter, $h(t)=\\psi(T-t)$.',
  '<b>[10 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
  '<b>[10 pts]</b> Find the optimal decision threshold ($\\lambda$) and calculate the average probability of bit error ($P_b$). Use a table of the $Q$ function for the numerical value.'];
const MF_STEM = (psd, T) => 'Consider an additive white Gaussian noise channel with two-sided noise power spectral density $N_0/2=' + psd + '$ W/Hz. '
  + 'Two equiprobable messages, $s_0(t)$ for “0” and $s_1(t)$ for “1”, are transmitted by the waveforms below. '
  + 'These signals are passed through the following matched-filter type demodulator. '
  + 'Here $\\psi(t)$ is the unit-energy basis signal (pulse shape) that represents these signals. '
  + 'It is also used in the impulse response of the matched filter. '
  + 'The noise $w(t)$ is zero-mean white Gaussian noise, and $T=' + T + '$ s. According to the information given above,';

/* ======================================================================
   The questions.
   ====================================================================== */
CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- matched-filter demodulator, two drawn waveforms ------------------ */

{ id:'D2-01', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('2.25', 3),
  figure: () => mfQ(3, [[0,1,-2],[1,3,-4]], [[0,1,1],[1,3,2]],
    {yr:[-5,1], ys:1}, {yr:[-0.5,2.5], ys:1}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> Equal priors, $N_0/2=2.25$ W/Hz and $T=3$ s. $s_1(t)=1$ on $[0,1)$ and $2$ on $[1,3]$. $s_0(t)=-2$ on $[0,1)$ and $-4$ on $[1,3]$.<br>'
     +'<b>Find.</b> $h(t)$, $f_Y(y\\mid 1)$, $f_Y(y\\mid 0)$, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> The two waveforms have the same shape, because $s_0(t)=-2s_1(t)$. So one basis signal $\\psi(t)$ represents both. The sample is $Y=s_m+n$, where $s_m$ is the coordinate of the sent signal. The noise sample $n$ is Gaussian with mean $0$ and variance $N_0/2$.<br>'
     +'<b>Solution — (a).</b> Find the energy of $s_1$ first, one piece at a time. $$\\begin{aligned}E_1&=\\int_0^3s_1^{2}(t)\\,dt\\\\&=\\int_0^11^{2}\\,dt+\\int_1^32^{2}\\,dt\\\\&=1+8=9\\end{aligned}$$ '
     +'Divide $s_1$ by $\\sqrt{E_1}=3$. This gives $\\psi(t)=1/3$ on $[0,1)$ and $\\psi(t)=2/3$ on $[1,3]$. '
     +'Now reverse $\\psi$ in time and shift it by $T=3$. The argument $3-t$ lies in $[1,3]$ when $t\\in[0,2]$, and in $[0,1)$ when $t\\in(2,3]$. $$h(t)=\\psi(3-t)=\\begin{cases}2/3,&t\\in[0,2]\\\\1/3,&t\\in(2,3]\\\\0,&\\text{otherwise}\\end{cases}$$<br>'
     +'<b>Solution — (b).</b> The coordinate of $s_1$ is its projection on $\\psi$. $$s_1=\\int_0^3s_1(t)\\psi(t)\\,dt=\\int_0^1\\tfrac13\\,dt+\\int_1^3\\tfrac43\\,dt=\\tfrac13+\\tfrac83=3$$ '
     +'Since $s_0(t)=-2s_1(t)$, its coordinate is $s_0=-2(3)=-6$. The noise sample has variance $\\sigma^{2}=N_0/2=2.25$, so $\\sigma=1.5$. '
     +'$$f_Y(y\\mid 1)=\\frac{1}{\\sqrt{2\\pi(2.25)}}e^{-(y-3)^{2}/(2\\cdot2.25)}=0.2660\\,e^{-(y-3)^{2}/4.5}$$ $$f_Y(y\\mid 0)=0.2660\\,e^{-(y+6)^{2}/4.5}$$<br>'
     +'<b>Solution — (c).</b> With equal priors, set the two densities equal at $y=\\lambda$. The factors in front cancel, so the exponents are equal. '
     +'$$\\begin{aligned}(\\lambda-3)^{2}&=(\\lambda+6)^{2}\\\\\\lambda^{2}-6\\lambda+9&=\\lambda^{2}+12\\lambda+36\\\\-18\\lambda&=27\\\\\\lambda&=-1.5\\end{aligned}$$ '
     +'Decide “1” when $Y>-1.5$. Each conditional error is a Gaussian tail. $$P(e\\mid 0)=P(Y>-1.5\\mid 0)=Q\\!\\left(\\frac{-1.5-(-6)}{1.5}\\right)=Q(3.00)$$ $$P(e\\mid 1)=P(Y<-1.5\\mid 1)=Q\\!\\left(\\frac{3-(-1.5)}{1.5}\\right)=Q(3.00)$$ '
     +'From the table, $Q(3.00)=1.350\\times10^{-3}$. $$P_b=\\tfrac12Q(3.00)+\\tfrac12Q(3.00)=1.350\\times10^{-3}$$<br>'
     +'<b>Check.</b> The distance between the coordinates is also the energy of the difference signal. $s_1(t)-s_0(t)$ is $3$ on $[0,1)$ and $6$ on $[1,3]$. $$d^{2}=\\int_0^13^{2}\\,dt+\\int_1^36^{2}\\,dt=9+72=81$$ '
     +'So $d=9$, and $P_b=Q\\bigl(d/(2\\sigma)\\bigr)=Q(9/3)=Q(3.00)$, the same value.',
  figSol: () => stack(760, [
    [psiH(3, [[0,1,1/3],[1,3,2/3]], [[0,2,2/3],[2,3,1/3]], {yr:[-0.2,1], yt:[1/3,2/3,1], yf:frac(3)}), 220],
    [gdens(-6, 3, 2.25, 0.5, -1.5, [-11,8]), 300]]),
  err:'Common error: taking $\\sigma^{2}=N_0=4.5$. The given density is already the two-sided value $N_0/2$, so the sample variance is $2.25$. The wrong variance gives $Q(2.12)=0.0170$.',
  teach:'This is the examination shape. The waveforms look different because the jump goes the other way, but they are multiples of one pulse. Ask the class to test this before computing anything.' },

{ id:'D2-02', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('4', 3),
  figure: () => mfQ(3, [[0,3,t=>-t]], [[0,3,t=>2*t]],
    {yr:[-3.5,0.8], ys:1}, {yr:[-0.8,6.5], ys:2}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> Equal priors, $N_0/2=4$ W/Hz and $T=3$ s. $s_1(t)=2t$ and $s_0(t)=-t$ on $[0,3]$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Both waveforms are multiples of the ramp $g(t)=t$. Normalise the ramp to unit energy to get $\\psi(t)$. Then find the two coordinates and place the threshold midway between them.<br>'
     +'<b>Solution — (a).</b> The energy of the ramp needs the antiderivative $t^{3}/3$. $$E_g=\\int_0^3t^{2}\\,dt=\\left[\\frac{t^{3}}{3}\\right]_0^3=\\frac{27}{3}-0=9$$ '
     +'So $\\psi(t)=t/\\sqrt9=t/3$ on $[0,3]$. Replace $t$ by $3-t$. $$h(t)=\\psi(3-t)=\\frac{3-t}{3}=1-\\frac{t}{3},\\quad t\\in[0,3]$$ '
     +'The filter starts at $1$ and falls to $0$ at $t=3$. It is the ramp run backwards.<br>'
     +'<b>Solution — (b).</b> Project each waveform on $\\psi$. $$s_1=\\int_0^32t\\cdot\\frac{t}{3}\\,dt=\\frac23\\left[\\frac{t^{3}}{3}\\right]_0^3=\\frac23(9)=6$$ $$s_0=\\int_0^3(-t)\\frac{t}{3}\\,dt=-\\frac13(9)=-3$$ '
     +'The noise variance is $\\sigma^{2}=N_0/2=4$, so $\\sigma=2$ and $1/\\sqrt{2\\pi(4)}=0.1995$. $$f_Y(y\\mid 1)=0.1995\\,e^{-(y-6)^{2}/8},\\qquad f_Y(y\\mid 0)=0.1995\\,e^{-(y+3)^{2}/8}$$<br>'
     +'<b>Solution — (c).</b> Equal priors and equal variances put the threshold midway between the coordinates. $$\\lambda=\\frac{6+(-3)}{2}=1.5$$ '
     +'Decide “1” when $Y>1.5$. Each coordinate is $4.5$ from the threshold. $$P(e\\mid 0)=Q\\!\\left(\\frac{1.5+3}{2}\\right)=Q(2.25),\\qquad P(e\\mid 1)=Q\\!\\left(\\frac{6-1.5}{2}\\right)=Q(2.25)$$ '
     +'From the table, $Q(2.25)=0.01222$, so $P_b=\\tfrac12(0.01222)+\\tfrac12(0.01222)=0.01222$.<br>'
     +'<b>Check.</b> The difference signal is $s_1(t)-s_0(t)=3t$. $$d^{2}=\\int_0^39t^{2}\\,dt=9\\left[\\frac{t^{3}}{3}\\right]_0^3=81$$ So $d=9$ and $d/(2\\sigma)=9/4=2.25$, the same $Q$ argument.',
  figSol: () => stack(760, [
    [psiH(3, [[0,3,t=>t/3]], [[0,3,t=>1-t/3]], {yr:[-0.2,1.2], yt:[1/3,2/3,1], yf:frac(3)}), 220],
    [gdens(-3, 6, 4, 0.5, 1.5, [-10,13]), 300]]),
  err:'Common error: taking $h(t)=\\psi(t)=t/3$. The matched filter is the pulse reversed in time, so a rising ramp gives a falling filter $1-t/3$.',
  teach:'The coordinates $6$ and $-3$ are not symmetric about zero, so the threshold is not zero even with equal priors.' },

{ id:'D2-03', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('4', 4),
  figure: () => mfQ(4, [[0,4,0]], [[0,1,2],[1,3,4],[3,4,0]],
    {yr:[-1,1], ys:1}, {yr:[-0.6,4.6], ys:1}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> Equal priors, $N_0/2=4$ W/Hz and $T=4$ s. $s_0(t)=0$. $s_1(t)=2$ on $[0,1)$, $4$ on $[1,3)$ and $0$ on $[3,4]$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> This is on-off signalling. The zero signal has no shape, so $\\psi(t)$ comes from $s_1$ alone. The coordinate of $s_0$ is zero.<br>'
     +'<b>Solution — (a).</b> Find the energy of $s_1$ piece by piece. $$\\begin{aligned}E_1&=\\int_0^12^{2}\\,dt+\\int_1^34^{2}\\,dt+\\int_3^40^{2}\\,dt\\\\&=4+32+0=36\\end{aligned}$$ '
     +'So $\\psi(t)=s_1(t)/6$: $1/3$ on $[0,1)$, $2/3$ on $[1,3)$ and $0$ on $[3,4]$. Reverse and shift by $T=4$. The zero piece moves to the front. $$h(t)=\\psi(4-t)=\\begin{cases}0,&t\\in[0,1)\\\\2/3,&t\\in(1,3]\\\\1/3,&t\\in(3,4]\\end{cases}$$<br>'
     +'<b>Solution — (b).</b> The coordinates are $s_1=\\sqrt{E_1}=6$ and $s_0=0$. The noise variance is $\\sigma^{2}=4$, so $\\sigma=2$. $$f_Y(y\\mid 1)=\\frac{1}{\\sqrt{8\\pi}}e^{-(y-6)^{2}/8}=0.1995\\,e^{-(y-6)^{2}/8}$$ $$f_Y(y\\mid 0)=0.1995\\,e^{-y^{2}/8}$$<br>'
     +'<b>Solution — (c).</b> Equal priors put the threshold midway: $\\lambda=(0+6)/2=3$. Decide “1” when $Y>3$. $$P(e\\mid 0)=Q\\!\\left(\\frac{3-0}{2}\\right)=Q(1.50),\\qquad P(e\\mid 1)=Q\\!\\left(\\frac{6-3}{2}\\right)=Q(1.50)$$ '
     +'From the table, $Q(1.50)=0.06681$, so $P_b=0.06681$.<br>'
     +'<b>Check.</b> On-off signalling with average energy $E_b=(36+0)/2=18$ has $P_b=Q\\bigl(\\sqrt{E_b/N_0}\\bigr)$. Here $N_0=8$, so $\\sqrt{18/8}=\\sqrt{2.25}=1.50$. This is the same argument.',
  figSol: () => stack(760, [
    [psiH(4, [[0,1,1/3],[1,3,2/3],[3,4,0]], [[0,1,0],[1,3,2/3],[3,4,1/3]], {yr:[-0.2,1], yt:[1/3,2/3,1], yf:frac(3)}), 220],
    [gdens(0, 6, 4, 0.5, 3, [-6,12]), 300]]),
  err:'Common error: writing $h(t)=2/3$ on $[0,2)$ by reversing only the nonzero part. The whole interval $[0,4]$ is reversed, so the zero piece on $[3,4]$ becomes a zero piece on $[0,1)$.',
  teach:'Ask where the filter output would peak if the sample were taken at $t=3$ instead of $t=4$. The trailing zero of $s_1$ makes the difference visible.' },

{ id:'D2-04', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('1', 4),
  figure: () => mfQ(4, [[0,1,1],[1,4,-1]], [[0,1,3],[1,4,-3]],
    {yr:[-1.6,1.6], ys:1}, {yr:[-3.8,3.8], ys:1}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> Equal priors, $N_0/2=1$ W/Hz and $T=4$ s. $s_0(t)=1$ on $[0,1)$ and $-1$ on $[1,4]$. $s_1(t)=3s_0(t)$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> The two signals have the same shape and the same sign. Both coordinates are positive, so the threshold is not at zero.<br>'
     +'<b>Solution — (a).</b> The energy of $s_0$ is $$E_0=\\int_0^11^{2}\\,dt+\\int_1^4(-1)^{2}\\,dt=1+3=4.$$ '
     +'So $\\psi(t)=s_0(t)/2$: $1/2$ on $[0,1)$ and $-1/2$ on $[1,4]$. The argument $4-t$ lies in $[1,4]$ when $t\\in[0,3]$. $$h(t)=\\psi(4-t)=\\begin{cases}-1/2,&t\\in[0,3]\\\\1/2,&t\\in(3,4]\\end{cases}$$<br>'
     +'<b>Solution — (b).</b> The coordinates are $s_0=\\sqrt{E_0}=2$ and $s_1=3(2)=6$. The noise variance is $\\sigma^{2}=1$. $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{2\\pi}}e^{-(y-2)^{2}/2}=0.3989\\,e^{-(y-2)^{2}/2}$$ $$f_Y(y\\mid 1)=0.3989\\,e^{-(y-6)^{2}/2}$$<br>'
     +'<b>Solution — (c).</b> Set the densities equal: $(\\lambda-2)^{2}=(\\lambda-6)^{2}$. Expand both sides: $-4\\lambda+4=-12\\lambda+36$, so $8\\lambda=32$ and $\\lambda=4$. '
     +'Decide “1” when $Y>4$. $$P(e\\mid 0)=Q\\!\\left(\\frac{4-2}{1}\\right)=Q(2.00),\\qquad P(e\\mid 1)=Q\\!\\left(\\frac{6-4}{1}\\right)=Q(2.00)$$ '
     +'From the table, $Q(2.00)=0.02275$, so $P_b=0.02275$.<br>'
     +'<b>Check.</b> The difference signal is $s_1-s_0=2s_0(t)$, with energy $4E_0=16$. So $d=4$ and $Q\\bigl(d/(2\\sigma)\\bigr)=Q(4/2)=Q(2.00)$. The large energies of $s_1$ do not help. Only the distance between the two signals counts.',
  figSol: () => stack(760, [
    [psiH(4, [[0,1,0.5],[1,4,-0.5]], [[0,3,-0.5],[3,4,0.5]], {yr:[-0.8,0.8], yt:[-0.5,0.5], yf:frac(2)}), 220],
    [gdens(2, 6, 1, 0.5, 4, [-1.5,9.5]), 300]]),
  err:'Common error: placing the threshold at $\\lambda=0$ out of habit. Both coordinates are positive, and a zero threshold decides “1” almost every time. It gives $P_b\\approx\\tfrac12$.',
  teach:'The energy of $s_1$ is $36$, but the error depends only on the distance $4$. This question separates energy from distance.' },

{ id:'D2-05', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('6.25', 3),
  figure: () => mfQ(3, [[0,1.5,t=>-4*t],[1.5,3,t=>-4*(3-t)]], [[0,1.5,t=>4*t],[1.5,3,t=>4*(3-t)]],
    {yr:[-6.8,1], ys:2}, {yr:[-1,6.8], ys:2}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> Equal priors, $N_0/2=6.25$ W/Hz and $T=3$ s. $s_1(t)$ is a triangle that rises from $0$ to $6$ at $t=1.5$ and falls back to $0$ at $t=3$. $s_0(t)=-s_1(t)$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Antipodal signals share one basis signal. The triangle is symmetric about $T/2$, so its matched filter is the triangle itself.<br>'
     +'<b>Solution — (a).</b> On $[0,1.5]$, $s_1(t)=4t$. By symmetry the energy is twice the energy of the rising half. $$E_1=2\\int_0^{1.5}16t^{2}\\,dt=32\\left[\\frac{t^{3}}{3}\\right]_0^{1.5}=32(1.125)=36$$ '
     +'So $\\psi(t)=s_1(t)/6$. It rises as $\\tfrac23t$ to $1$ at $t=1.5$ and falls as $\\tfrac23(3-t)$. Replacing $t$ by $3-t$ swaps the two halves. $$h(t)=\\psi(3-t)=\\psi(t)$$<br>'
     +'<b>Solution — (b).</b> The coordinates are $s_1=\\sqrt{E_1}=6$ and $s_0=-6$. The noise variance is $\\sigma^{2}=6.25$, so $\\sigma=2.5$ and $1/\\sqrt{2\\pi(6.25)}=0.1596$. $$f_Y(y\\mid 1)=0.1596\\,e^{-(y-6)^{2}/12.5},\\qquad f_Y(y\\mid 0)=0.1596\\,e^{-(y+6)^{2}/12.5}$$<br>'
     +'<b>Solution — (c).</b> The coordinates are symmetric about zero and the priors are equal, so $\\lambda=0$. Decide “1” when $Y>0$. $$P(e\\mid 1)=P(Y<0\\mid 1)=Q\\!\\left(\\frac{6-0}{2.5}\\right)=Q(2.40)$$ '
     +'By symmetry $P(e\\mid 0)=Q(2.40)$ too. From the table, $Q(2.40)=8.198\\times10^{-3}$, so $P_b=8.198\\times10^{-3}$.<br>'
     +'<b>Check.</b> For antipodal signals $P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. Here $E_b=36$ and $N_0=12.5$. $$\\sqrt{\\frac{2(36)}{12.5}}=\\sqrt{5.76}=2.40$$',
  figSol: () => stack(760, [
    [psiH(3, [[0,1.5,t=>2*t/3],[1.5,3,t=>2*(3-t)/3]], [[0,1.5,t=>2*t/3],[1.5,3,t=>2*(3-t)/3]], {yr:[-0.2,1.2], yt:[1/3,2/3,1], yf:frac(3)}), 220],
    [gdens(-6, 6, 6.25, 0.5, 0, [-14,14]), 300]]),
  err:'Common error: taking the energy as $\\tfrac12(6)^{2}(3)=54$, the area rule for a triangle applied to $s_1^{2}$. The energy integrates the square of the signal, and the square of a triangle is not a triangle.',
  teach:'A symmetric pulse is its own matched filter. Ask which of the earlier pulses had this property.' },

{ id:'D2-06', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('4', 3),
  figure: () => mfQ(3, [[0,3,t=>-5*(3-t)/3]], [[0,3,t=>2*(3-t)/3]],
    {yr:[-5.6,0.8], ys:1}, {yr:[-0.6,2.6], ys:1}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> Equal priors, $N_0/2=4$ W/Hz and $T=3$ s. $s_1(t)=\\tfrac23(3-t)$ falls from $2$ to $0$. $s_0(t)=-\\tfrac53(3-t)$ rises from $-5$ to $0$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Both waveforms are multiples of the falling ramp $g(t)=3-t$. Normalise it to get $\\psi(t)$, find the two coordinates and place the threshold midway.<br>'
     +'<b>Solution — (a).</b> Substitute $u=3-t$, so $du=-dt$. The limits $t=0$ and $t=3$ become $u=3$ and $u=0$. $$E_g=\\int_0^3(3-t)^{2}\\,dt=\\int_0^3u^{2}\\,du=\\left[\\frac{u^{3}}{3}\\right]_0^3=9$$ '
     +'So $\\psi(t)=(3-t)/3$ on $[0,3]$. Replace $t$ by $3-t$: $$h(t)=\\psi(3-t)=\\frac{3-(3-t)}{3}=\\frac{t}{3},\\quad t\\in[0,3].$$<br>'
     +'<b>Solution — (b).</b> Each waveform is a multiple of $g$, so its coordinate is that multiple times $\\sqrt{E_g}=3$. $$s_1=\\tfrac23(3)=2,\\qquad s_0=-\\tfrac53(3)=-5$$ '
     +'The noise variance is $\\sigma^{2}=4$, so $\\sigma=2$. $$f_Y(y\\mid 1)=0.1995\\,e^{-(y-2)^{2}/8},\\qquad f_Y(y\\mid 0)=0.1995\\,e^{-(y+5)^{2}/8}$$<br>'
     +'<b>Solution — (c).</b> The threshold is midway: $\\lambda=(2+(-5))/2=-1.5$. Decide “1” when $Y>-1.5$. Each coordinate is $3.5$ from $\\lambda$. $$P(e\\mid 0)=Q\\!\\left(\\frac{-1.5+5}{2}\\right)=Q(1.75),\\qquad P(e\\mid 1)=Q\\!\\left(\\frac{2+1.5}{2}\\right)=Q(1.75)$$ '
     +'From the table, $Q(1.75)=0.04006$, so $P_b=0.04006$.<br>'
     +'<b>Check.</b> Compute the coordinate of $s_1$ by direct projection. $$\\int_0^3\\tfrac23(3-t)\\cdot\\tfrac{3-t}{3}\\,dt=\\tfrac29\\int_0^3(3-t)^{2}\\,dt=\\tfrac29(9)=2$$ This agrees with part (b).',
  figSol: () => stack(760, [
    [psiH(3, [[0,3,t=>(3-t)/3]], [[0,3,t=>t/3]], {yr:[-0.2,1.2], yt:[1/3,2/3,1], yf:frac(3)}), 220],
    [gdens(-5, 2, 4, 0.5, -1.5, [-12,9]), 300]]),
  err:'Common error: using the peak values $2$ and $-5$ as the coordinates without checking. They equal the coordinates here only because $\\sqrt{E_g}=3$ equals the peak of $g$. For the ramp $t$ on $[0,4]$ the two differ.',
  teach:'This is the examination shape with the ramps falling instead of rising. The substitution in part (a) is worth writing out once.' },

{ id:'D2-07', module:'M2', type:'mf', src:'MT Q3 (variant)',
  stem:'Consider an additive white Gaussian noise channel with two-sided noise power spectral density $N_0/2=2.25$ W/Hz. '
     +'Two messages are transmitted by the waveforms below: $s_0(t)$ for “0” and $s_1(t)$ for “1”. '
     +'The message “0” is sent with probability $0.8$ and “1” with probability $0.2$. '
     +'The signals pass through the matched-filter type demodulator shown, with the unit-energy basis signal $\\psi(t)$ and $T=3$ s. According to the information given above,',
  figure: () => mfQ(3, [[0,2,-2],[2,3,1]], [[0,2,2],[2,3,-1]],
    {yr:[-2.6,1.6], ys:1}, {yr:[-1.6,2.6], ys:1}),
  parts:['<b>[5 pts]</b> Plot the impulse response of the matched filter, $h(t)=\\psi(T-t)$.',
         '<b>[8 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '<b>[7 pts]</b> Find the optimal decision threshold ($\\lambda$).',
         '<b>[5 pts]</b> Calculate $P_b$ at this threshold. Compare it with $P_b$ for the threshold $\\lambda=0$.'],
  sol:'<b>Given.</b> $p_0=0.8$, $p_1=0.2$, $N_0/2=2.25$ W/Hz and $T=3$ s. $s_1(t)=2$ on $[0,2)$ and $-1$ on $[2,3]$. $s_0(t)=-s_1(t)$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> The signals are antipodal, so one basis signal represents both. The priors are unequal, so the threshold moves away from the more likely message. It solves $p_0f_Y(\\lambda\\mid 0)=p_1f_Y(\\lambda\\mid 1)$.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^22^{2}\\,dt+\\int_2^3(-1)^{2}\\,dt=8+1=9$, so $\\psi(t)=s_1(t)/3$. That is $2/3$ on $[0,2)$ and $-1/3$ on $[2,3]$. '
     +'The argument $3-t$ lies in $(2,3]$ when $t\\in[0,1)$. $$h(t)=\\psi(3-t)=\\begin{cases}-1/3,&t\\in[0,1)\\\\2/3,&t\\in[1,3]\\end{cases}$$<br>'
     +'<b>Solution — (b).</b> The coordinates are $s_1=3$ and $s_0=-3$. The variance is $\\sigma^{2}=2.25$, so $\\sigma=1.5$. $$f_Y(y\\mid 1)=0.2660\\,e^{-(y-3)^{2}/4.5},\\qquad f_Y(y\\mid 0)=0.2660\\,e^{-(y+3)^{2}/4.5}$$<br>'
     +'<b>Solution — (c).</b> Set the weighted densities equal and cancel $0.2660$. Take the natural logarithm of both sides. '
     +'$$\\begin{aligned}0.8\\,e^{-(\\lambda+3)^{2}/4.5}&=0.2\\,e^{-(\\lambda-3)^{2}/4.5}\\\\\\ln4&=\\frac{(\\lambda+3)^{2}-(\\lambda-3)^{2}}{4.5}\\\\\\ln4&=\\frac{12\\lambda}{4.5}\\\\\\lambda&=\\frac{4.5(1.3863)}{12}=0.5199\\end{aligned}$$ '
     +'Decide “1” when $Y>0.5199$. The threshold moved toward $s_1$, so the more likely “0” gets the larger region.<br>'
     +'<b>Solution — (d).</b> Round each argument to two decimals for the table. $$P(e\\mid 0)=Q\\!\\left(\\frac{0.5199+3}{1.5}\\right)=Q(2.35)=0.009387$$ $$P(e\\mid 1)=Q\\!\\left(\\frac{3-0.5199}{1.5}\\right)=Q(1.65)=0.04947$$ '
     +'$$P_b=0.8(0.009387)+0.2(0.04947)=0.007510+0.009894=0.01740$$ At $\\lambda=0$ both arguments are $3/1.5=2.00$, so $P_b=Q(2.00)=0.02275$. The optimal threshold lowers $P_b$ by about $24\\%$.<br>'
     +'<b>Check.</b> Evaluate both weighted densities at $\\lambda=0.5199$. $$0.8(0.2660)e^{-(3.5199)^{2}/4.5}=0.2128(0.06373)=0.01356$$ $$0.2(0.2660)e^{-(2.4801)^{2}/4.5}=0.0532(0.2549)=0.01356$$ They are equal, as the threshold condition requires.',
  figSol: () => stack(760, [
    [psiH(3, [[0,2,2/3],[2,3,-1/3]], [[0,1,-1/3],[1,3,2/3]], {yr:[-0.6,1], yt:[-1/3,1/3,2/3], yf:frac(3)}), 220],
    [gdens(-3, 3, 2.25, 0.8, 0.5199, [-8,8], {notes:[[-3,1.08,'0.8\\,f_Y(y\\mid 0)'],[3,0.33,'0.2\\,f_Y(y\\mid 1)'],[0.5199,1.3,'\\lambda=0.520','middle','k']]}), 300]]),
  err:'Common error: writing $\\ln(p_1/p_0)$ and getting $\\lambda=-0.520$. The threshold must move toward the less likely signal, here $s_1$, so that “0” gets more of the axis.',
  teach:'Part (d) shows that the gain from the optimal threshold is real but modest. Ask what happens to the gain as $N_0$ falls.' },

{ id:'D2-08', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('2.56', 4),
  figure: () => mfQ(4, [[0,2,-3],[2,4,3]], [[0,2,1],[2,4,-1]],
    {yr:[-3.8,3.8], ys:1}, {yr:[-1.6,1.6], ys:1}),
  parts:['<b>[6 pts]</b> Show that one basis signal represents both waveforms. Give $\\psi(t)$ and the coordinates of $s_0$ and $s_1$.',
         '<b>[5 pts]</b> Plot the impulse response of the matched filter, $h(t)=\\psi(T-t)$.',
         '<b>[7 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '<b>[7 pts]</b> Find the optimal decision threshold ($\\lambda$) and calculate $P_b$ with a table of the $Q$ function.'],
  sol:'<b>Given.</b> Equal priors, $N_0/2=2.56$ W/Hz and $T=4$ s. $s_0(t)=-3$ on $[0,2)$ and $3$ on $[2,4]$. $s_1(t)=1$ on $[0,2)$ and $-1$ on $[2,4]$.<br>'
     +'<b>Find.</b> $\\psi(t)$, the coordinates, $h(t)$, the conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Two waveforms need one basis signal when one is a multiple of the other. Test this piece by piece, then normalise.<br>'
     +'<b>Solution — (a).</b> On $[0,2)$ the ratio $s_0/s_1$ is $-3/1=-3$. On $[2,4]$ it is $3/(-1)=-3$. The ratio is the same everywhere, so $s_0(t)=-3s_1(t)$. '
     +'The energy of $s_1$ is $E_1=\\int_0^41\\,dt=4$, so $\\psi(t)=s_1(t)/2$. That is $1/2$ on $[0,2)$ and $-1/2$ on $[2,4]$. The coordinates are $s_1=2$ and $s_0=-3(2)=-6$.<br>'
     +'<b>Solution — (b).</b> The argument $4-t$ lies in $[2,4]$ when $t\\in[0,2]$. $$h(t)=\\psi(4-t)=\\begin{cases}-1/2,&t\\in[0,2]\\\\1/2,&t\\in(2,4]\\end{cases}$$ Here $h(t)=-\\psi(t)$.<br>'
     +'<b>Solution — (c).</b> The variance is $\\sigma^{2}=2.56$, so $\\sigma=1.6$ and $1/\\sqrt{2\\pi(2.56)}=0.2493$. $$f_Y(y\\mid 1)=0.2493\\,e^{-(y-2)^{2}/5.12},\\qquad f_Y(y\\mid 0)=0.2493\\,e^{-(y+6)^{2}/5.12}$$<br>'
     +'<b>Solution — (d).</b> The threshold is midway: $\\lambda=(2-6)/2=-2$. Decide “1” when $Y>-2$. Each coordinate is $4$ from $\\lambda$. $$P_b=Q\\!\\left(\\frac{4}{1.6}\\right)=Q(2.50)=6.210\\times10^{-3}$$<br>'
     +'<b>Check.</b> The difference $s_1(t)-s_0(t)$ is $4$ on $[0,2)$ and $-4$ on $[2,4]$. Its energy is $16(4)=64$, so $d=8$. Then $d/(2\\sigma)=8/3.2=2.50$.',
  figSol: () => stack(760, [
    [psiH(4, [[0,2,0.5],[2,4,-0.5]], [[0,2,-0.5],[2,4,0.5]], {yr:[-0.8,0.8], yt:[-0.5,0.5], yf:frac(2)}), 220],
    [gdens(-6, 2, 2.56, 0.5, -2, [-12,8]), 300]]),
  err:'Common error: treating the two waveforms as orthogonal because their jumps go opposite ways. Their correlation is $\\int_0^4s_0s_1\\,dt=-12$, not zero, so they lie on one line.',
  teach:'Part (a) is the step students skip. Ask them to compute the correlation before assuming two dimensions.' },

{ id:'D2-09', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('6.25', 4),
  figure: () => mfQ(4, [[0,1,0],[1,3,-4],[3,4,-2]], [[0,1,0],[1,3,2],[3,4,1]],
    {yr:[-4.8,0.8], ys:1}, {yr:[-0.6,2.6], ys:1}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> Equal priors, $N_0/2=6.25$ W/Hz and $T=4$ s. $s_1(t)$ is $0$, $2$, $2$, $1$ on the four unit intervals. $s_0(t)=-2s_1(t)$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Normalise $s_1$ to get $\\psi$. Then $s_0$ has twice the size and the opposite sign.<br>'
     +'<b>Solution — (a).</b> $$E_1=\\int_0^10\\,dt+\\int_1^32^{2}\\,dt+\\int_3^41^{2}\\,dt=0+8+1=9$$ '
     +'So $\\psi(t)=s_1(t)/3$: $0$, $2/3$, $2/3$, $1/3$ on the four unit intervals. Reversing the interval $[0,4]$ reverses the order of the four values. $$h(t)=\\psi(4-t):\\quad\\tfrac13,\\ \\tfrac23,\\ \\tfrac23,\\ 0\\ \\text{on}\\ [0,1),[1,2),[2,3),[3,4]$$<br>'
     +'<b>Solution — (b).</b> The coordinates are $s_1=3$ and $s_0=-6$. The variance is $\\sigma^{2}=6.25$, so $\\sigma=2.5$. $$f_Y(y\\mid 1)=0.1596\\,e^{-(y-3)^{2}/12.5},\\qquad f_Y(y\\mid 0)=0.1596\\,e^{-(y+6)^{2}/12.5}$$<br>'
     +'<b>Solution — (c).</b> The threshold is midway: $\\lambda=(3-6)/2=-1.5$. Each coordinate is $4.5$ from it. $$P_b=Q\\!\\left(\\frac{4.5}{2.5}\\right)=Q(1.80)=0.03593$$<br>'
     +'<b>Check.</b> The difference $s_1-s_0=3s_1(t)$ has energy $9E_1=81$, so $d=9$. Then $d/(2\\sigma)=9/5=1.80$.',
  figSol: () => stack(760, [
    [psiH(4, [[0,1,0],[1,3,2/3],[3,4,1/3]], [[0,1,1/3],[1,3,2/3],[3,4,0]], {yr:[-0.2,1], yt:[1/3,2/3,1], yf:frac(3)}), 220],
    [gdens(-6, 3, 6.25, 0.5, -1.5, [-15,12]), 300]]),
  err:'Common error: taking $\\lambda=0$ because the signals have opposite signs. Opposite signs are not enough. The coordinates $3$ and $-6$ are not symmetric, so the midpoint is $-1.5$.',
  teach:'The leading zero of $s_1$ becomes a trailing zero of $h$. Ask the class to predict the plot before computing it.' },

{ id:'D2-10', module:'M2', type:'mf', src:'MT Q3',
  stem: MF_STEM('5.76', 4),
  figure: () => mfQ(4, [[0,4,0]], [[0,3,t=>2*t],[3,4,0]],
    {yr:[-1,1], ys:1}, {yr:[-0.8,6.8], ys:2}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> Equal priors, $N_0/2=5.76$ W/Hz and $T=4$ s. $s_0(t)=0$. $s_1(t)=2t$ on $[0,3]$ and $0$ on $(3,4]$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> This is on-off signalling, so $\\psi$ comes from $s_1$. The ramp stops at $t=3$, before the end of the interval.<br>'
     +'<b>Solution — (a).</b> $$E_1=\\int_0^3(2t)^{2}\\,dt=4\\left[\\frac{t^{3}}{3}\\right]_0^3=4(9)=36$$ '
     +'So $\\psi(t)=2t/6=t/3$ on $[0,3]$ and $0$ on $(3,4]$. Replace $t$ by $4-t$. The value $(4-t)/3$ applies when $4-t\\in[0,3]$, that is when $t\\in[1,4]$. $$h(t)=\\psi(4-t)=\\begin{cases}0,&t\\in[0,1)\\\\(4-t)/3,&t\\in[1,4]\\end{cases}$$<br>'
     +'<b>Solution — (b).</b> The coordinates are $s_1=6$ and $s_0=0$. The variance is $\\sigma^{2}=5.76$, so $\\sigma=2.4$ and $1/\\sqrt{2\\pi(5.76)}=0.1662$. $$f_Y(y\\mid 1)=0.1662\\,e^{-(y-6)^{2}/11.52},\\qquad f_Y(y\\mid 0)=0.1662\\,e^{-y^{2}/11.52}$$<br>'
     +'<b>Solution — (c).</b> The threshold is midway: $\\lambda=3$. $$P_b=Q\\!\\left(\\frac{3}{2.4}\\right)=Q(1.25)=0.1056$$<br>'
     +'<b>Check.</b> On-off signalling with $E_b=18$ and $N_0=11.52$ gives $\\sqrt{E_b/N_0}=\\sqrt{1.5625}=1.25$. This is the same argument.',
  figSol: () => stack(760, [
    [psiH(4, [[0,3,t=>t/3],[3,4,0]], [[0,1,0],[1,4,t=>(4-t)/3]], {yr:[-0.2,1.2], yt:[1/3,2/3,1], yf:frac(3)}), 220],
    [gdens(0, 6, 5.76, 0.5, 3, [-8,14]), 300]]),
  err:'Common error: writing $h(t)=(3-t)/3$ on $[0,3]$, a reversal about $t=3$ instead of about $T=4$. That filter peaks at the wrong time, and its output at $t=4$ is not the coordinate.',
  teach:'Compare with the waveforms of the rising-ramp question. The ramp that stops early moves the filter to the right.' },

{ id:'D2-11', module:'M2', type:'mf', src:'MT Q3 (variant)',
  stem: MF_STEM('6.25', 4),
  figure: () => mfQ(4, [[0,4,-1]], [[0,4,3]], {yr:[-1.6,0.8], ys:1}, {yr:[-0.8,3.8], ys:1}),
  parts:['<b>[5 pts]</b> Plot the impulse response of the matched filter, $h(t)=\\psi(T-t)$.',
         '<b>[6 pts]</b> Without noise, find and plot the filter output $y(t)$ when $s_1(t)$ is sent. Give its value at $t=T$.',
         '<b>[7 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '<b>[7 pts]</b> Find the optimal decision threshold ($\\lambda$) and calculate $P_b$.'],
  sol:'<b>Given.</b> Equal priors, $N_0/2=6.25$ W/Hz and $T=4$ s. $s_1(t)=3$ and $s_0(t)=-1$ on $[0,4]$.<br>'
     +'<b>Find.</b> $h(t)$, the noise-free output $y(t)$, the conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> The output of a linear filter is the convolution of its input with $h$. At $t=T$ it equals the correlation with $\\psi$, which is the coordinate.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^49\\,dt=36$, so $\\psi(t)=3/6=1/2$ on $[0,4]$. A constant pulse is its own reversal: $h(t)=1/2$ on $[0,4]$.<br>'
     +'<b>Solution — (b).</b> Write the convolution. The product $s_1(\\tau)h(t-\\tau)$ is $3\\cdot\\tfrac12=1.5$ where the two pulses overlap. $$y(t)=\\int_{-\\infty}^{\\infty}s_1(\\tau)h(t-\\tau)\\,d\\tau=1.5\\times(\\text{overlap length})$$ '
     +'For $t\\in[0,4]$ the overlap is $[0,t]$, of length $t$. For $t\\in[4,8]$ it is $[t-4,4]$, of length $8-t$. $$y(t)=\\begin{cases}1.5t,&t\\in[0,4]\\\\1.5(8-t),&t\\in[4,8]\\\\0,&\\text{otherwise}\\end{cases}$$ The peak is $y(4)=6$, at the sampling instant.<br>'
     +'<b>Solution — (c).</b> The coordinates are $s_1=6$ and $s_0=-2$. The variance is $\\sigma^{2}=6.25$, so $\\sigma=2.5$. $$f_Y(y\\mid 1)=0.1596\\,e^{-(y-6)^{2}/12.5},\\qquad f_Y(y\\mid 0)=0.1596\\,e^{-(y+2)^{2}/12.5}$$<br>'
     +'<b>Solution — (d).</b> The threshold is midway: $\\lambda=(6-2)/2=2$. Each coordinate is $4$ from it. $$P_b=Q\\!\\left(\\frac{4}{2.5}\\right)=Q(1.60)=0.05480$$<br>'
     +'<b>Check.</b> The correlator gives the same sample: $\\int_0^4s_1(t)\\psi(t)\\,dt=\\int_0^4\\tfrac32\\,dt=6$. This equals $y(4)$ from part (b).',
  figSol: () => { const a = P.Axes({w:760,h:250,xr:[-0.5,8.8],yr:[-0.6,7.4],xlabel:'t\\;(\\mathrm{s})',ylabel:'y(t)',
      pad:{l:58,r:28,t:22,b:40},xstep:1,ystep:2});
    a.poly([[-0.5,0],[0,0],[4,6],[8,0],[8.8,0]], {color:C.mid, width:2.4});
    a.vline(4, {color:C.muted}); a.point(4, 6, {color:C.mid, r:5});
    a.note(4.25, 6.3, 'y(T)=6', {tex:true, fs:15, color:C.mid});
    return stack(760, [
      [psiH(4, [[0,4,0.5]], [[0,4,0.5]], {yr:[-0.3,0.8], yt:[0.5], yf:frac(2)}), 220],
      [a.svg(), 250],
      [gdens(-2, 6, 6.25, 0.5, 2, [-10,14]), 300]]); },
  err:'Common error: reading the peak of $y(t)$ as the amplitude $3$ of $s_1$. The matched-filter output at $T$ is the coordinate $\\sqrt{E_1}=6$, a different quantity with different units.',
  teach:'The triangle in part (b) is worth drawing on the board. Only its value at $t=T$ reaches the decision.' },

{ id:'D2-12', module:'M2', type:'mf', src:'MT Q3 (variant)',
  stem:'Consider an additive white Gaussian noise channel with two-sided noise power spectral density $N_0/2=1$ W/Hz. '
     +'The message “0” is sent by $s_0(t)$ with probability $0.6$, and “1” by $s_1(t)$ with probability $0.4$. '
     +'These signals are passed through the matched-filter type demodulator shown, with the unit-energy basis signal $\\psi(t)$ and $T=3$ s. According to the information given above,',
  figure: () => mfQ(3, [[0,3,t=>t-1.5]], [[0,3,t=>3*t-4.5]], {yr:[-2,2], ys:1}, {yr:[-5,5], ys:2}),
  parts: MF_PARTS,
  sol:'<b>Given.</b> $p_0=0.6$, $p_1=0.4$, $N_0/2=1$ W/Hz and $T=3$ s. $s_0(t)=t-1.5$ and $s_1(t)=3(t-1.5)$ on $[0,3]$.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Both ramps are multiples of $g(t)=t-1.5$, with the same sign. The priors are unequal, so set the weighted densities equal.<br>'
     +'<b>Solution — (a).</b> Substitute $u=t-1.5$. The limits $0$ and $3$ become $-1.5$ and $1.5$. $$E_g=\\int_{-1.5}^{1.5}u^{2}\\,du=\\left[\\frac{u^{3}}{3}\\right]_{-1.5}^{1.5}=1.125+1.125=2.25$$ '
     +'So $\\psi(t)=(t-1.5)/1.5=(2t-3)/3$. Replace $t$ by $3-t$: $$h(t)=\\psi(3-t)=\\frac{2(3-t)-3}{3}=\\frac{3-2t}{3}=-\\psi(t).$$ The filter falls from $1$ to $-1$.<br>'
     +'<b>Solution — (b).</b> The coordinates are the multiples times $\\sqrt{E_g}=1.5$: $s_0=1.5$ and $s_1=3(1.5)=4.5$. With $\\sigma^{2}=1$, $$f_Y(y\\mid 0)=0.3989\\,e^{-(y-1.5)^{2}/2},\\qquad f_Y(y\\mid 1)=0.3989\\,e^{-(y-4.5)^{2}/2}.$$<br>'
     +'<b>Solution — (c).</b> Set $0.6f_Y(\\lambda\\mid 0)=0.4f_Y(\\lambda\\mid 1)$, cancel $0.3989$ and take logarithms. '
     +'$$\\begin{aligned}\\ln\\frac{0.6}{0.4}&=\\frac{(\\lambda-1.5)^{2}-(\\lambda-4.5)^{2}}{2}\\\\0.4055&=\\frac{6\\lambda-18}{2}=3\\lambda-9\\\\\\lambda&=\\frac{9.4055}{3}=3.135\\end{aligned}$$ '
     +'Decide “1” when $Y>3.135$. Round each argument to two decimals. $$P(e\\mid 0)=Q(3.135-1.5)=Q(1.64)=0.05050$$ $$P(e\\mid 1)=Q(4.5-3.135)=Q(1.36)=0.08691$$ '
     +'$$P_b=0.6(0.05050)+0.4(0.08691)=0.03030+0.03476=0.06506$$<br>'
     +'<b>Check.</b> Evaluate the weighted densities at $\\lambda=3.135$. $0.6(0.3989)e^{-(1.635)^{2}/2}=0.2393(0.2627)=0.0629$. $0.4(0.3989)e^{-(1.365)^{2}/2}=0.1596(0.3940)=0.0629$. They are equal to three figures.',
  figSol: () => stack(760, [
    [psiH(3, [[0,3,t=>(2*t-3)/3]], [[0,3,t=>(3-2*t)/3]], {yr:[-1.3,1.3], yt:[-1,-1/3,1/3,1], yf:frac(3)}), 220],
    [gdens(1.5, 4.5, 1, 0.6, 3.135, [-2,8], {notes:[[1.5,1.08,'0.6\\,f_Y(y\\mid 0)'],[4.5,0.75,'0.4\\,f_Y(y\\mid 1)'],[3.135,1.3,'\\lambda=3.135','middle','k']]}), 300]]),
  err:'Common error: placing the threshold at $0$ because the ramps cross zero. The sign of the waveform inside the interval does not matter. Only the coordinates $1.5$ and $4.5$ enter the decision.',
  teach:'A ramp through zero has a filter that is its own negative. Ask why that does not change the sign of the coordinates.' },

/* ---- binary decision in noise that is not Gaussian --------------------- */

{ id:'D2-13', module:'M2', type:'nongauss', src:'MT Q4',
  stem:'In a binary digital communication system, the received sample is $Y=N$ if “0” is sent and $Y=5+N$ if “1” is sent. '
     +'The probability density function of the noise sample $N$ is shown below: $$f_N(n)=\\begin{cases}\\dfrac18\\left(1-\\dfrac{|n|}{8}\\right),&-8\\le n\\le 8\\\\0,&\\text{otherwise.}\\end{cases}$$ '
     +'Assume that “0” and “1” are transmitted with equal probabilities.',
  figure: () => noiseQ(tri(8), [-10,10], [-0.01,0.16], {xs:2, yt:[0.125], yf:()=>'1/8'}),
  parts:['<b>[9 pts]</b> Calculate the average probability of bit error ($P_b$) for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}3$, that is, decide “1” if $Y>3$ and “0” if $Y<3$.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$).',
         '<b>[8 pts]</b> Calculate $P_b$ for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> A triangular noise density on $[-8,8]$ with peak $1/8$. $Y=N$ for “0” and $Y=5+N$ for “1”. Equal priors.<br>'
     +'<b>Find.</b> $P_b$ for the rule $Y>3$, the optimal $\\lambda$, and $P_b$ at $\\lambda$.<br>'
     +'<b>Method.</b> The noise is not Gaussian, so no $Q$ function appears. Integrate the triangle directly. With equal priors the optimal threshold is where the two conditional densities cross.<br>'
     +'<b>Solution — (a).</b> First find the tail of the noise for $t\\in[0,8]$. $$\\begin{aligned}P(N>t)&=\\int_t^8\\frac18\\left(1-\\frac{n}{8}\\right)dn\\\\&=\\frac18\\left[n-\\frac{n^{2}}{16}\\right]_t^8\\\\&=\\frac18\\left[(8-4)-\\left(t-\\frac{t^{2}}{16}\\right)\\right]\\\\&=\\frac{64-16t+t^{2}}{128}=\\frac{(8-t)^{2}}{128}\\end{aligned}$$ '
     +'The density is even, so $P(N<-t)=P(N>t)$. A “0” is decided wrongly when $N>3$. $$P(e\\mid 0)=P(N>3)=\\frac{5^{2}}{128}=0.1953$$ '
     +'A “1” is decided wrongly when $5+N<3$, that is when $N<-2$. $$P(e\\mid 1)=P(N<-2)=\\frac{6^{2}}{128}=0.2813$$ $$P_b=\\tfrac12(0.1953)+\\tfrac12(0.2813)=\\frac{61}{256}=0.2383$$<br>'
     +'<b>Solution — (b).</b> The conditional densities are $f_Y(y\\mid 0)=f_N(y)$ and $f_Y(y\\mid 1)=f_N(y-5)$. Both are nonzero only on $[-3,8]$. Compare them there, one region at a time. '
     +'On $[-3,0]$, $f_Y(y\\mid 0)=(8+y)/64$ is larger than $f_Y(y\\mid 1)=(3+y)/64$. '
     +'On $[0,5]$, $f_Y(y\\mid 0)=(8-y)/64$ and $f_Y(y\\mid 1)=(3+y)/64$. They are equal when $8-y=3+y$, so at $y=2.5$. '
     +'On $[5,8]$, $f_Y(y\\mid 1)=(13-y)/64$ is larger than $(8-y)/64$. So $\\lambda=2.5$, and the receiver decides “1” when $Y>2.5$.<br>'
     +'<b>Solution — (c).</b> $$P(e\\mid 0)=P(N>2.5)=\\frac{5.5^{2}}{128}=0.2363,\\qquad P(e\\mid 1)=P(N<-2.5)=0.2363$$ '
     +'So $P_b=0.2363$. It is smaller than $0.2383$ from part (a), as the optimal threshold requires.<br>'
     +'<b>Check.</b> With equal priors, $P_b$ at the optimal threshold is half the area under the smaller of the two densities. On $[-3,2.5]$ the smaller one is $(3+y)/64$. '
     +'$$\\int_{-3}^{2.5}\\frac{3+y}{64}\\,dy=\\frac{1}{64}\\left[\\frac{(3+y)^{2}}{2}\\right]_{-3}^{2.5}=\\frac{30.25}{128}=0.2363$$ The region $[2.5,8]$ gives the same area by symmetry. Half of the total $0.4727$ is $0.2363$.',
  figSol: () => dens({xr:[-10,15], top:0.0625, f0: y=>0.5*tri(8)(y), f1: y=>0.5*tri(8)(y-5), lams:[2.5], dec1: y=>y>2.5, xs:5,
    notes:[[-0.4,1.08,'p_0\\,f_Y(y\\mid 0)','end'],[5.4,1.08,'p_1\\,f_Y(y\\mid 1)','start'],[2.5,1.3,'\\lambda=2.5','middle','k']]}),
  err:'Common error: using $Q(\\cdot)$ with the variance of the triangle. The noise is not Gaussian, so a Gaussian tail gives a wrong number. Integrate the given density.',
  teach:'This is the examination shape. The region-by-region comparison in part (b) is the step most answers leave out.' },

{ id:'D2-14', module:'M2', type:'nongauss', src:'MT Q4',
  stem:'In a binary digital communication system, the received sample is $Y=-2+N$ if “0” is sent and $Y=2+N$ if “1” is sent. '
     +'The PDF of the noise sample $N$ is $$f_N(n)=c\\,e^{-|n|/2},\\qquad -\\infty<n<\\infty,$$ where $c$ is a constant. '
     +'Assume that “0” and “1” are transmitted with equal probabilities.',
  figure: () => noiseQ(lap(2), [-9,9], [-0.02,0.3], {xs:2, yt:[0.25], yf:()=>'c'}),
  parts:['<b>[9 pts]</b> Find $c$. Then calculate the average probability of bit error for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}1$, that is, decide “1” if $Y>1$ and “0” if $Y<1$.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$).',
         '<b>[8 pts]</b> Calculate the average probability of bit error ($P_b$) for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> $f_N(n)=c\\,e^{-|n|/2}$. $Y=-2+N$ for “0” and $Y=2+N$ for “1”. Equal priors.<br>'
     +'<b>Find.</b> $c$, $P_b$ for the rule $Y>1$, the optimal $\\lambda$, and $P_b$ at $\\lambda$.<br>'
     +'<b>Method.</b> The constant comes from the total area. The error probabilities are tails of the Laplacian density, integrated directly.<br>'
     +'<b>Solution — (a).</b> The density is even, so the total area is twice the area on $n\\ge 0$. $$\\int_{-\\infty}^{\\infty}f_N(n)\\,dn=2c\\int_0^{\\infty}e^{-n/2}\\,dn=2c\\left[-2e^{-n/2}\\right]_0^{\\infty}=2c(0+2)=4c$$ '
     +'Setting $4c=1$ gives $c=1/4$. The tail for $t\\ge 0$ is $$P(N>t)=\\int_t^{\\infty}\\tfrac14e^{-n/2}\\,dn=\\tfrac14\\left[-2e^{-n/2}\\right]_t^{\\infty}=\\tfrac12e^{-t/2}.$$ '
     +'A “0” is decided wrongly when $-2+N>1$, that is $N>3$. A “1” is decided wrongly when $2+N<1$, that is $N<-1$. '
     +'$$P(e\\mid 0)=\\tfrac12e^{-1.5}=0.1116,\\qquad P(e\\mid 1)=P(N>1)=\\tfrac12e^{-0.5}=0.3033$$ $$P_b=\\tfrac12(0.1116+0.3033)=0.2074$$<br>'
     +'<b>Solution — (b).</b> The conditional densities are $f_Y(y\\mid 0)=\\tfrac14e^{-|y+2|/2}$ and $f_Y(y\\mid 1)=\\tfrac14e^{-|y-2|/2}$. '
     +'With equal priors, decide “1” where $f_Y(y\\mid 1)>f_Y(y\\mid 0)$. That happens when $|y-2|<|y+2|$, that is when $y$ is closer to $2$ than to $-2$. So $\\lambda=0$.<br>'
     +'<b>Solution — (c).</b> Each error is now a tail beyond distance $2$. $$P(e\\mid 0)=P(N>2)=\\tfrac12e^{-1}=0.1839,\\qquad P(e\\mid 1)=P(N<-2)=0.1839$$ So $P_b=0.1839$.<br>'
     +'<b>Check.</b> For a threshold $t\\in[-2,2]$, $$P_b(t)=\\tfrac12\\cdot\\tfrac12e^{-(t+2)/2}+\\tfrac12\\cdot\\tfrac12e^{-(2-t)/2}=\\tfrac14e^{-1}\\left(e^{-t/2}+e^{t/2}\\right).$$ '
     +'At $t=1$ this is $\\tfrac14(0.3679)(0.6065+1.6487)=0.2074$, as in part (a). The bracket is smallest at $t=0$, where $P_b=\\tfrac12e^{-1}=0.1839$.',
  figSol: () => dens({xr:[-9,9], top:0.125, f0: y=>0.5*lap(2)(y+2), f1: y=>0.5*lap(2)(y-2), lams:[0], dec1: y=>y>0, xs:2,
    notes:[[-2.3,1.08,'p_0\\,f_Y(y\\mid 0)','end'],[2.3,1.08,'p_1\\,f_Y(y\\mid 1)','start'],[0,1.3,'\\lambda=0','middle','k']]}),
  err:'Common error: taking $c=1/2$ from the one-sided area $\\int_0^{\\infty}e^{-n/2}dn=2$ without doubling. The density covers both signs of $n$, so the area is $4c$.',
  teach:'Part (a) is where the constant decides everything. A wrong $c$ doubles every later number.' },

{ id:'D2-15', module:'M2', type:'nongauss', src:'MT Q4',
  stem:'In a binary digital communication system, the received sample is denoted by $Y$. '
     +'If “0” is transmitted, $Y$ is exponentially distributed with mean $2$. If “1” is transmitted, $Y$ is exponentially distributed with mean $6$. '
     +'The input bits are equiprobable. An exponential PDF with mean $\\mu$ is $f_Y(y)=\\frac{1}{\\mu}e^{-y/\\mu}$ for $y\\ge 0$, and $0$ otherwise.',
  parts:['<b>[9 pts]</b> Calculate the average probability of bit error for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}4$, that is, decide “1” if $Y>4$ and “0” if $Y<4$.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$).',
         '<b>[8 pts]</b> Calculate the average probability of bit error ($P_b$) for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> $f_Y(y\\mid 0)=\\tfrac12e^{-y/2}$ and $f_Y(y\\mid 1)=\\tfrac16e^{-y/6}$ for $y\\ge 0$. Equal priors.<br>'
     +'<b>Find.</b> $P_b$ for the rule $Y>4$, the optimal $\\lambda$, and $P_b$ at $\\lambda$.<br>'
     +'<b>Method.</b> Integrate each density over the region where its message is decided wrongly. The optimal threshold is where the two densities cross.<br>'
     +'<b>Solution — (a).</b> A “0” is decided wrongly when $Y>4$. $$P(e\\mid 0)=\\int_4^{\\infty}\\tfrac12e^{-y/2}\\,dy=\\left[-e^{-y/2}\\right]_4^{\\infty}=e^{-2}=0.1353$$ '
     +'A “1” is decided wrongly when $Y<4$. $$P(e\\mid 1)=\\int_0^4\\tfrac16e^{-y/6}\\,dy=\\left[-e^{-y/6}\\right]_0^4=1-e^{-2/3}=0.4866$$ $$P_b=\\tfrac12(0.1353+0.4866)=0.3110$$<br>'
     +'<b>Solution — (b).</b> Set the densities equal at $y=\\lambda$ and multiply both sides by $6$. Then take logarithms. '
     +'$$\\begin{aligned}3e^{-\\lambda/2}&=e^{-\\lambda/6}\\\\\\ln3-\\frac{\\lambda}{2}&=-\\frac{\\lambda}{6}\\\\\\ln3&=\\frac{\\lambda}{3}\\\\\\lambda&=3\\ln3=3.296\\end{aligned}$$ '
     +'Above $\\lambda$ the slower decay of $f_Y(y\\mid 1)$ makes it the larger density. So the receiver decides “1” when $Y>3.296$.<br>'
     +'<b>Solution — (c).</b> Use $e^{-\\lambda/2}=e^{-1.5\\ln3}=3^{-1.5}$ and $e^{-\\lambda/6}=3^{-0.5}$. $$P(e\\mid 0)=3^{-1.5}=0.1925,\\qquad P(e\\mid 1)=1-3^{-0.5}=1-0.5774=0.4226$$ $$P_b=\\tfrac12(0.1925+0.4226)=0.3075$$<br>'
     +'<b>Check.</b> Write $P_b(t)=\\tfrac12\\left(e^{-t/2}+1-e^{-t/6}\\right)$ and differentiate. $$\\frac{dP_b}{dt}=\\tfrac12\\left(-\\tfrac12e^{-t/2}+\\tfrac16e^{-t/6}\\right)$$ '
     +'At $t=3.296$ the bracket is $-\\tfrac12(0.1925)+\\tfrac16(0.5774)=-0.09623+0.09623=0$. So the threshold is a stationary point, and $0.3075<0.3110$.',
  figSol: () => dens({xr:[-0.5,16], top:0.25, f0: y=>0.5*expo(2)(y), f1: y=>0.5*expo(6)(y), lams:[3*Math.log(3)], dec1: y=>y>3*Math.log(3), xs:2,
    notes:[[0.25,1.08,'p_0\\,f_Y(y\\mid 0)','start'],[7,0.45,'p_1\\,f_Y(y\\mid 1)','start'],[3*Math.log(3),1.3,'\\lambda=3.296','middle','k']]}),
  err:'Common error: equating the exponents and ignoring the factors in front, which gives $\\lambda=0$. The factors $1/2$ and $1/6$ carry the difference between the two means.',
  teach:'Ask why $P_b$ stays near $0.3$ even at the best threshold. The two densities overlap heavily, because their means differ by a factor of three only.' },

{ id:'D2-16', module:'M2', type:'nongauss', src:'MT Q4',
  stem:'In a binary digital communication system, the received sample is $Y=N$ if “0” is sent and $Y=6+N$ if “1” is sent. '
     +'The noise sample $N$ has the triangular PDF shown below: $$f_N(n)=\\begin{cases}\\dfrac14\\left(1-\\dfrac{|n|}{4}\\right),&-4\\le n\\le 4\\\\0,&\\text{otherwise.}\\end{cases}$$ '
     +'Assume that “0” and “1” are transmitted with equal probabilities.',
  figure: () => noiseQ(tri(4), [-6,6], [-0.02,0.3], {xs:1, yt:[0.25], yf:()=>'1/4'}),
  parts:['<b>[9 pts]</b> Calculate the average probability of bit error for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}5$, that is, decide “1” if $Y>5$ and “0” if $Y<5$.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$).',
         '<b>[8 pts]</b> Calculate the average probability of bit error ($P_b$) for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> A triangular noise density on $[-4,4]$ with peak $1/4$. $Y=N$ for “0” and $Y=6+N$ for “1”. Equal priors.<br>'
     +'<b>Find.</b> $P_b$ for the rule $Y>5$, the optimal $\\lambda$, and $P_b$ at $\\lambda$.<br>'
     +'<b>Method.</b> The noise has finite support. A conditional error can therefore be exactly zero. Integrate the triangle and compare the densities region by region.<br>'
     +'<b>Solution — (a).</b> For $t\\in[0,4]$ the tail is $$P(N>t)=\\int_t^4\\frac14\\left(1-\\frac{n}{4}\\right)dn=\\frac14\\left[n-\\frac{n^{2}}{8}\\right]_t^4=\\frac{(4-t)^{2}}{32}.$$ For $t\\ge 4$ it is $0$. '
     +'A “0” is decided wrongly when $N>5$, which is impossible. So $P(e\\mid 0)=0$. A “1” is decided wrongly when $6+N<5$, that is $N<-1$. $$P(e\\mid 1)=P(N>1)=\\frac{3^{2}}{32}=0.2813$$ $$P_b=\\tfrac12(0)+\\tfrac12(0.2813)=0.1406$$<br>'
     +'<b>Solution — (b).</b> $f_Y(y\\mid 0)=f_N(y)$ is nonzero on $[-4,4]$ and $f_Y(y\\mid 1)=f_N(y-6)$ on $[2,10]$. They overlap only on $[2,4]$. '
     +'There $f_Y(y\\mid 0)=(4-y)/16$ and $f_Y(y\\mid 1)=(y-2)/16$. They are equal when $4-y=y-2$, so $\\lambda=3$. Below $2$ only “0” is possible, and above $4$ only “1”.<br>'
     +'<b>Solution — (c).</b> $$P(e\\mid 0)=P(N>3)=\\frac{1^{2}}{32}=0.03125,\\qquad P(e\\mid 1)=P(N<-3)=0.03125$$ So $P_b=0.03125$, four and a half times smaller than in part (a).<br>'
     +'<b>Check.</b> Half the area under the smaller density on the overlap gives $P_b$. $$\\tfrac12\\left[\\int_2^3\\frac{y-2}{16}\\,dy+\\int_3^4\\frac{4-y}{16}\\,dy\\right]=\\tfrac12\\left[\\frac{1}{32}+\\frac{1}{32}\\right]=0.03125$$',
  figSol: () => dens({xr:[-6,12], top:0.125, f0: y=>0.5*tri(4)(y), f1: y=>0.5*tri(4)(y-6), lams:[3], dec1: y=>y>3, xs:2,
    notes:[[-0.3,1.08,'p_0\\,f_Y(y\\mid 0)','end'],[6.3,1.08,'p_1\\,f_Y(y\\mid 1)','start'],[3,1.3,'\\lambda=3','middle','k']]}),
  err:'Common error: writing $P(e\\mid 0)=P(N>5)=(4-5)^{2}/32=1/32$. The tail formula holds only for $t\\le 4$. Beyond the support the tail is zero.',
  teach:'The rule $Y>5$ makes one error impossible and the other large. Ask whether the optimal rule ever makes one error zero.' },

{ id:'D2-17', module:'M2', type:'nongauss', src:'MT Q4',
  stem:'In a binary digital communication system, the received sample is $Y=N$ if “0” is sent and $Y=8+N$ if “1” is sent. '
     +'The PDF of the noise sample $N$ is $$f_N(n)=c\\,e^{-|n|/5},\\qquad -\\infty<n<\\infty,$$ where $c$ is a constant. '
     +'Assume that “0” and “1” are transmitted with equal probabilities.',
  figure: () => noiseQ(lap(5), [-20,20], [-0.01,0.12], {xs:5, yt:[0.1], yf:()=>'c'}),
  parts:['<b>[9 pts]</b> Find $c$. Then calculate the average probability of bit error for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}3$, that is, decide “1” if $Y>3$ and “0” if $Y<3$.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$).',
         '<b>[8 pts]</b> Calculate the average probability of bit error ($P_b$) for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> $f_N(n)=c\\,e^{-|n|/5}$. $Y=N$ for “0” and $Y=8+N$ for “1”. Equal priors.<br>'
     +'<b>Find.</b> $c$, $P_b$ for the rule $Y>3$, the optimal $\\lambda$, and $P_b$ at $\\lambda$.<br>'
     +'<b>Method.</b> Find $c$ from the total area, then integrate Laplacian tails.<br>'
     +'<b>Solution — (a).</b> $$\\int_{-\\infty}^{\\infty}c\\,e^{-|n|/5}\\,dn=2c\\left[-5e^{-n/5}\\right]_0^{\\infty}=10c=1\\;\\Longrightarrow\\;c=\\frac{1}{10}$$ '
     +'The tail for $t\\ge 0$ is $P(N>t)=\\int_t^{\\infty}\\tfrac{1}{10}e^{-n/5}\\,dn=\\tfrac12e^{-t/5}$. A “0” is decided wrongly when $N>3$. A “1” is decided wrongly when $8+N<3$, that is $N<-5$. '
     +'$$P(e\\mid 0)=\\tfrac12e^{-0.6}=0.2744,\\qquad P(e\\mid 1)=\\tfrac12e^{-1}=0.1839$$ $$P_b=\\tfrac12(0.2744+0.1839)=0.2292$$<br>'
     +'<b>Solution — (b).</b> With equal priors, decide “1” where $e^{-|y-8|/5}>e^{-|y|/5}$, that is where $|y-8|<|y|$. This holds for $y>4$, so $\\lambda=4$.<br>'
     +'<b>Solution — (c).</b> Both errors are tails beyond distance $4$. $$P(e\\mid 0)=P(N>4)=\\tfrac12e^{-0.8}=0.2247,\\qquad P(e\\mid 1)=P(N<-4)=0.2247$$ So $P_b=0.2247$.<br>'
     +'<b>Check.</b> For $t\\in[0,8]$, $P_b(t)=\\tfrac14\\left(e^{-t/5}+e^{-(8-t)/5}\\right)$. Its derivative $\\tfrac{1}{20}\\left(-e^{-t/5}+e^{-(8-t)/5}\\right)$ is zero only at $t=4$. There $P_b=\\tfrac14(2)(0.4493)=0.2247$.',
  figSol: () => dens({xr:[-14,22], top:0.05, f0: y=>0.5*lap(5)(y), f1: y=>0.5*lap(5)(y-8), lams:[4], dec1: y=>y>4, xs:4,
    notes:[[-0.6,1.08,'p_0\\,f_Y(y\\mid 0)','end'],[8.6,1.08,'p_1\\,f_Y(y\\mid 1)','start'],[4,1.3,'\\lambda=4','middle','k']]}),
  err:'Common error: using $P(N>t)=e^{-t/5}$, the tail of a one-sided exponential. The Laplacian puts half its area on each side, so the tail carries the factor $\\tfrac12$.',
  teach:'The Laplacian falls much more slowly than a Gaussian. Here $P_b$ barely moves from part (a) to part (c).' },

{ id:'D2-18', module:'M2', type:'nongauss', src:'MT Q4',
  stem:'In a binary digital communication system, the received sample is denoted by $Y$. '
     +'If “0” is transmitted, $Y$ is exponentially distributed with mean $3$. If “1” is transmitted, $Y$ is exponentially distributed with mean $12$. '
     +'The input bits are equiprobable. An exponential PDF with mean $\\mu$ is $f_Y(y)=\\frac{1}{\\mu}e^{-y/\\mu}$ for $y\\ge 0$.',
  parts:['<b>[9 pts]</b> Calculate the average probability of bit error for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}6$, that is, decide “1” if $Y>6$ and “0” if $Y<6$.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$).',
         '<b>[8 pts]</b> Calculate the average probability of bit error ($P_b$) for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> $f_Y(y\\mid 0)=\\tfrac13e^{-y/3}$ and $f_Y(y\\mid 1)=\\tfrac{1}{12}e^{-y/12}$ for $y\\ge 0$. Equal priors.<br>'
     +'<b>Find.</b> $P_b$ for the rule $Y>6$, the optimal $\\lambda$, and $P_b$ at $\\lambda$.<br>'
     +'<b>Method.</b> Integrate each exponential over its error region. Equate the densities for the threshold.<br>'
     +'<b>Solution — (a).</b> $$P(e\\mid 0)=\\int_6^{\\infty}\\tfrac13e^{-y/3}\\,dy=\\left[-e^{-y/3}\\right]_6^{\\infty}=e^{-2}=0.1353$$ $$P(e\\mid 1)=\\int_0^6\\tfrac{1}{12}e^{-y/12}\\,dy=\\left[-e^{-y/12}\\right]_0^6=1-e^{-0.5}=0.3935$$ '
     +'$$P_b=\\tfrac12(0.1353+0.3935)=0.2644$$<br>'
     +'<b>Solution — (b).</b> Multiply both densities by $12$ and take logarithms. $$\\begin{aligned}4e^{-\\lambda/3}&=e^{-\\lambda/12}\\\\\\ln4&=\\frac{\\lambda}{3}-\\frac{\\lambda}{12}=\\frac{\\lambda}{4}\\\\\\lambda&=4\\ln4=5.545\\end{aligned}$$ Decide “1” when $Y>5.545$.<br>'
     +'<b>Solution — (c).</b> $e^{-\\lambda/3}=4^{-4/3}$ and $e^{-\\lambda/12}=4^{-1/3}$. $$P(e\\mid 0)=4^{-4/3}=0.1575,\\qquad P(e\\mid 1)=1-4^{-1/3}=1-0.6300=0.3700$$ $$P_b=\\tfrac12(0.1575+0.3700)=0.2638$$<br>'
     +'<b>Check.</b> The rule of part (a) is close to optimal, so the two answers should be close. Evaluate $P_b(t)=\\tfrac12\\left(e^{-t/3}+1-e^{-t/12}\\right)$ at $t=5$: $\\tfrac12(0.1889+1-0.6592)=0.2648$. Both $t=5$ and $t=6$ give more than $0.2638$.',
  figSol: () => dens({xr:[-1,30], top:1/6, f0: y=>0.5*expo(3)(y), f1: y=>0.5*expo(12)(y), lams:[4*Math.log(4)], dec1: y=>y>4*Math.log(4), xs:5,
    notes:[[0.3,1.08,'p_0\\,f_Y(y\\mid 0)','start'],[12,0.42,'p_1\\,f_Y(y\\mid 1)','start'],[4*Math.log(4),1.3,'\\lambda=5.545','middle','k']]}),
  err:'Common error: placing the threshold at the average of the means, $7.5$. The densities are not symmetric, so the midpoint rule of the Gaussian case does not apply.',
  teach:'The means $3$ and $12$ give the same threshold ratio as means $1$ and $4$. Ask why the error probabilities do not depend on the scale.' },

{ id:'D2-19', module:'M2', type:'nongauss', src:'MT Q4 (variant)',
  stem:'In a binary digital communication system, the received sample is $Y=-3+N$ if “0” is sent and $Y=3+N$ if “1” is sent. '
     +'The PDF of the noise sample $N$ is $f_N(n)=c\\,e^{-|n|}$ for all $n$, where $c$ is a constant. '
     +'The bit “0” is sent with probability $0.8$ and “1” with probability $0.2$.',
  figure: () => noiseQ(lap(1), [-5,5], [-0.04,0.6], {xs:1, yt:[0.5], yf:()=>'c'}),
  parts:['<b>[9 pts]</b> Find $c$. Then calculate $P_b$ for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}0$.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$) for these priors.',
         '<b>[8 pts]</b> Calculate $P_b$ for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> $f_N(n)=c\\,e^{-|n|}$. $Y=-3+N$ for “0” and $Y=3+N$ for “1”. $p_0=0.8$ and $p_1=0.2$.<br>'
     +'<b>Find.</b> $c$, $P_b$ at $\\lambda=0$, the optimal $\\lambda$, and $P_b$ there.<br>'
     +'<b>Method.</b> The optimal threshold solves $p_0f_Y(\\lambda\\mid 0)=p_1f_Y(\\lambda\\mid 1)$. Between the two means both exponents are linear in $\\lambda$, so the equation is easy to solve.<br>'
     +'<b>Solution — (a).</b> $\\int c\\,e^{-|n|}\\,dn=2c\\left[-e^{-n}\\right]_0^{\\infty}=2c=1$, so $c=\\tfrac12$. The tail for $t\\ge0$ is $P(N>t)=\\tfrac12e^{-t}$. '
     +'With $\\lambda=0$ both errors need a noise of size $3$. $$P(e\\mid 0)=P(N>3)=\\tfrac12e^{-3}=0.02489,\\qquad P(e\\mid 1)=P(N<-3)=0.02489$$ $$P_b=0.8(0.02489)+0.2(0.02489)=0.02489$$<br>'
     +'<b>Solution — (b).</b> For $-3<y<3$, $f_Y(y\\mid 0)=\\tfrac12e^{-(y+3)}$ and $f_Y(y\\mid 1)=\\tfrac12e^{-(3-y)}$. Set the weighted densities equal and take logarithms. '
     +'$$\\begin{aligned}0.8\\,e^{-(\\lambda+3)}&=0.2\\,e^{-(3-\\lambda)}\\\\\\ln0.8-\\lambda-3&=\\ln0.2-3+\\lambda\\\\2\\lambda&=\\ln4\\\\\\lambda&=\\ln2=0.6931\\end{aligned}$$ '
     +'This lies inside $(-3,3)$, as assumed. Decide “1” when $Y>0.6931$.<br>'
     +'<b>Solution — (c).</b> A “0” is now wrong when $N>3.693$, and a “1” when $N<-2.307$. $$P(e\\mid 0)=\\tfrac12e^{-3.693}=0.01245,\\qquad P(e\\mid 1)=\\tfrac12e^{-2.307}=0.04979$$ '
     +'$$P_b=0.8(0.01245)+0.2(0.04979)=0.009957+0.009957=0.01991$$<br>'
     +'<b>Check.</b> Write $P_b(\\lambda)=\\tfrac12e^{-3}\\left(0.8e^{-\\lambda}+0.2e^{\\lambda}\\right)$. At $\\lambda=\\ln2$ the bracket is $0.8/2+0.2(2)=0.8$. So $P_b=0.8(0.02489)=0.01991$, which is $20\\%$ below part (a).',
  figSol: () => dens({xr:[-8,8], top:0.4, f0: y=>0.8*lap(1)(y+3), f1: y=>0.2*lap(1)(y-3), lams:[Math.log(2)], dec1: y=>y>Math.log(2), xs:2,
    notes:[[-3.3,1.06,'0.8\\,f_Y(y\\mid 0)','end'],[3.6,0.36,'0.2\\,f_Y(y\\mid 1)','start'],[Math.log(2),1.3,'\\lambda=0.693','middle','k']]}),
  err:'Common error: keeping $\\lambda=0$ because the noise is symmetric. Symmetric noise gives the midpoint only for equal priors. Here the more likely “0” needs the larger region.',
  teach:'The two weighted errors are equal at the optimum, $0.009957$ each. Ask whether that holds for Gaussian noise too.' },

{ id:'D2-20', module:'M2', type:'nongauss', src:'MT Q4 (variant)',
  stem:'In a binary digital communication system, the received sample is $Y=N$ if “0” is sent and $Y=4+N$ if “1” is sent. '
     +'The noise $N$ has the triangular PDF $f_N(n)=\\frac15\\left(1-\\frac{|n|}{5}\\right)$ for $|n|\\le 5$, and $0$ otherwise. '
     +'The bit “0” is sent with probability $0.6$ and “1” with probability $0.4$.',
  figure: () => noiseQ(tri(5), [-7,7], [-0.02,0.24], {xs:1, yt:[0.2], yf:()=>'1/5'}),
  parts:['<b>[9 pts]</b> Calculate $P_b$ for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}2$, the midpoint between the two signal values.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$) for these priors.',
         '<b>[8 pts]</b> Calculate $P_b$ for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> A triangular noise density on $[-5,5]$ with peak $1/5$. $Y=N$ for “0” and $Y=4+N$ for “1”. $p_0=0.6$ and $p_1=0.4$.<br>'
     +'<b>Find.</b> $P_b$ at $2$, the optimal $\\lambda$, and $P_b$ at $\\lambda$.<br>'
     +'<b>Method.</b> Integrate the triangle for each error and weight by the priors. For the threshold, compare $p_0f_Y(y\\mid 0)$ with $p_1f_Y(y\\mid 1)$ region by region.<br>'
     +'<b>Solution — (a).</b> For $t\\in[0,5]$ the tail is $$P(N>t)=\\int_t^5\\frac15\\left(1-\\frac{n}{5}\\right)dn=\\frac15\\left[n-\\frac{n^{2}}{10}\\right]_t^5=\\frac{(5-t)^{2}}{50}.$$ '
     +'Both errors need a noise of size $2$: $P(e\\mid 0)=P(N>2)=9/50=0.18$ and $P(e\\mid 1)=P(N<-2)=0.18$. So $P_b=0.6(0.18)+0.4(0.18)=0.18$.<br>'
     +'<b>Solution — (b).</b> The densities overlap on $[-1,5]$. On $[0,4]$, $f_Y(y\\mid 0)=(5-y)/25$ and $f_Y(y\\mid 1)=(1+y)/25$. Set the weighted values equal. '
     +'$$\\begin{aligned}0.6(5-y)&=0.4(1+y)\\\\3-0.6y&=0.4+0.4y\\\\y&=2.6\\end{aligned}$$ '
     +'On $[-1,0]$, $0.6(5+y)$ exceeds $0.4(1+y)$, so “0” wins. On $[4,5]$, $0.4(9-y)$ exceeds $0.6(5-y)$, so “1” wins. So $\\lambda=2.6$.<br>'
     +'<b>Solution — (c).</b> A “0” is wrong when $N>2.6$. A “1” is wrong when $4+N<2.6$, that is $N<-1.4$. $$P(e\\mid 0)=\\frac{2.4^{2}}{50}=0.1152,\\qquad P(e\\mid 1)=\\frac{3.6^{2}}{50}=0.2592$$ '
     +'$$P_b=0.6(0.1152)+0.4(0.2592)=0.06912+0.10368=0.1728$$<br>'
     +'<b>Check.</b> $P_b$ at the optimum is the area under the smaller weighted density. On $[-1,2.6]$ it is $0.4(1+y)/25$, and on $[2.6,5]$ it is $0.6(5-y)/25$. '
     +'$$\\int_{-1}^{2.6}\\frac{0.4(1+y)}{25}\\,dy=0.016\\cdot\\frac{3.6^{2}}{2}=0.10368,\\qquad\\int_{2.6}^{5}\\frac{0.6(5-y)}{25}\\,dy=0.024\\cdot\\frac{2.4^{2}}{2}=0.06912$$ The sum is $0.1728$.',
  figSol: () => dens({xr:[-6,10], top:0.12, f0: y=>0.6*tri(5)(y), f1: y=>0.4*tri(5)(y-4), lams:[2.6], dec1: y=>y>2.6, xs:2,
    notes:[[-0.3,1.06,'0.6\\,f_Y(y\\mid 0)','end'],[4.3,0.8,'0.4\\,f_Y(y\\mid 1)','start'],[2.6,1.3,'\\lambda=2.6','middle','k']]}),
  err:'Common error: comparing the unweighted densities and getting $\\lambda=2$. The priors multiply the densities before they are compared.',
  teach:'The error given “1” grows while the error given “0” shrinks. Ask why the weighted sum still falls.' },

{ id:'D2-21', module:'M2', type:'nongauss', src:'MT Q4 (variant)',
  stem:'In a binary digital communication system, the received sample is denoted by $Y$. '
     +'If “0” is sent, $Y$ is exponentially distributed with mean $1$. If “1” is sent, $Y$ is exponentially distributed with mean $3$. '
     +'The bit “0” is sent with probability $0.4$ and “1” with probability $0.6$.',
  parts:['<b>[9 pts]</b> Calculate $P_b$ for the decision rule $Y\\underset{0}{\\overset{1}{\\gtrless}}2$.',
         '<b>[8 pts]</b> Determine the optimal decision threshold ($\\lambda$) for these priors.',
         '<b>[8 pts]</b> Calculate $P_b$ for the $\\lambda$ value obtained in part (b).'],
  sol:'<b>Given.</b> $f_Y(y\\mid 0)=e^{-y}$ and $f_Y(y\\mid 1)=\\tfrac13e^{-y/3}$ for $y\\ge 0$. $p_0=0.4$ and $p_1=0.6$.<br>'
     +'<b>Find.</b> $P_b$ for the rule $Y>2$, the optimal $\\lambda$, and $P_b$ at $\\lambda$.<br>'
     +'<b>Method.</b> Integrate each exponential over its error region and weight by the priors. The threshold solves $p_0f_Y(\\lambda\\mid 0)=p_1f_Y(\\lambda\\mid 1)$.<br>'
     +'<b>Solution — (a).</b> $$P(e\\mid 0)=\\int_2^{\\infty}e^{-y}\\,dy=e^{-2}=0.1353,\\qquad P(e\\mid 1)=\\int_0^2\\tfrac13e^{-y/3}\\,dy=1-e^{-2/3}=0.4866$$ '
     +'$$P_b=0.4(0.1353)+0.6(0.4866)=0.05413+0.2919=0.3461$$<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}0.4\\,e^{-\\lambda}&=0.6\\cdot\\tfrac13e^{-\\lambda/3}=0.2\\,e^{-\\lambda/3}\\\\\\ln2&=\\lambda-\\frac{\\lambda}{3}=\\frac{2\\lambda}{3}\\\\\\lambda&=1.5\\ln2=1.040\\end{aligned}$$ Decide “1” when $Y>1.040$.<br>'
     +'<b>Solution — (c).</b> Here $e^{-\\lambda}=2^{-1.5}$ and $e^{-\\lambda/3}=2^{-0.5}$. $$P(e\\mid 0)=2^{-1.5}=0.3536,\\qquad P(e\\mid 1)=1-2^{-0.5}=0.2929$$ '
     +'$$P_b=0.4(0.3536)+0.6(0.2929)=0.1414+0.1757=0.3172$$<br>'
     +'<b>Check.</b> The derivative of $P_b(t)=0.4e^{-t}+0.6\\left(1-e^{-t/3}\\right)$ is $-0.4e^{-t}+0.2e^{-t/3}$. At $t=1.040$ it is $-0.4(0.3536)+0.2(0.7071)=-0.1414+0.1414=0$.',
  figSol: () => dens({xr:[-0.5,10], top:0.4, f0: y=>0.4*expo(1)(y), f1: y=>0.6*expo(3)(y), lams:[1.5*Math.log(2)], dec1: y=>y>1.5*Math.log(2), xs:1,
    notes:[[1.5,0.62,'0.4\\,f_Y(y\\mid 0)','start'],[5,0.3,'0.6\\,f_Y(y\\mid 1)','start'],[1.5*Math.log(2),1.3,'\\lambda=1.040','middle','k']]}),
  err:'Common error: forgetting the factor $\\tfrac13$ in $f_Y(y\\mid 1)$ when the priors are applied. The equation then gives $\\lambda=1.5\\ln(2/3)<0$, a threshold outside the range of $Y$.',
  teach:'The more likely “1” pulls the threshold down from $1.648$ to $1.040$. Ask what prior would put the threshold at zero.' },

/* ---- binary PAM: priors, unequal variances, folded outputs ------------- */

{ id:'D2-22', module:'M2', type:'pam', src:'Final Q2',
  stem:'In a binary pulse amplitude modulation (PAM) communication system, “0” and “1” bits are transmitted. '
     +'At the output of the matched filter, we observe $Y=|N_0|$ when “0” is transmitted and $Y=|N_1|$ when “1” is transmitted. '
     +'Here $N_0$ and $N_1$ are independent Gaussian random variables with $N_0\\sim\\mathcal{N}(\\mu=0,\\sigma^{2}=1)$ and $N_1\\sim\\mathcal{N}(\\mu=0,\\sigma^{2}=4)$. '
     +'Assume that “0” and “1” are transmitted with equal probabilities.',
  parts:['<b>[8 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '<b>[9 pts]</b> Find the optimal decision threshold ($\\lambda$).',
         '<b>[8 pts]</b> Calculate the average probability of bit error ($P_b$). Give the result as a numerical value, using a table of the $Q$ function.'],
  sol:'<b>Given.</b> $Y=|N_0|$ for “0” and $Y=|N_1|$ for “1”, with $N_0\\sim\\mathcal{N}(0,1)$ and $N_1\\sim\\mathcal{N}(0,4)$. Equal priors.<br>'
     +'<b>Find.</b> The two conditional PDFs, $\\lambda$, and $P_b$ as a number.<br>'
     +'<b>Method.</b> Find the density of a magnitude from its distribution function. Then set the two densities equal. Both have zero mean, so the one with the larger variance wins for large $y$.<br>'
     +'<b>Solution — (a).</b> For $y\\ge 0$, the distribution function of $Y$ given “0” is $$F_Y(y\\mid 0)=P(|N_0|\\le y)=P(-y\\le N_0\\le y)=F_{N_0}(y)-F_{N_0}(-y).$$ '
     +'Differentiate with respect to $y$. The Gaussian density is even, so the two terms are equal. $$f_Y(y\\mid 0)=f_{N_0}(y)+f_{N_0}(-y)=\\frac{2}{\\sqrt{2\\pi}}e^{-y^{2}/2},\\quad y\\ge 0$$ '
     +'The same step with $\\sigma^{2}=4$ gives $$f_Y(y\\mid 1)=\\frac{2}{\\sqrt{2\\pi(4)}}e^{-y^{2}/8}=\\frac{1}{\\sqrt{2\\pi}}e^{-y^{2}/8},\\quad y\\ge 0.$$ Both densities are zero for $y<0$.<br>'
     +'<b>Solution — (b).</b> Set the densities equal, cancel $1/\\sqrt{2\\pi}$, and take logarithms. '
     +'$$\\begin{aligned}2e^{-\\lambda^{2}/2}&=e^{-\\lambda^{2}/8}\\\\\\ln2&=\\frac{\\lambda^{2}}{2}-\\frac{\\lambda^{2}}{8}=\\frac{3\\lambda^{2}}{8}\\\\\\lambda^{2}&=\\frac{8\\ln2}{3}=1.848\\\\\\lambda&=1.360\\end{aligned}$$ '
     +'Below $\\lambda$ the narrow density of “0” is larger. Decide “0” when $Y<1.360$ and “1” when $Y>1.360$.<br>'
     +'<b>Solution — (c).</b> A “0” is wrong when $|N_0|>1.360$. That event has two Gaussian tails. $$P(e\\mid 0)=2Q\\!\\left(\\frac{1.360}{1}\\right)=2Q(1.36)=2(0.08691)=0.1738$$ '
     +'A “1” is wrong when $|N_1|<1.360$. Divide by $\\sigma_1=2$. $$P(e\\mid 1)=1-2Q\\!\\left(\\frac{1.360}{2}\\right)=1-2Q(0.68)=1-2(0.2483)=0.5034$$ '
     +'$$P_b=\\tfrac12(0.1738)+\\tfrac12(0.5034)=0.3386$$<br>'
     +'<b>Check.</b> Evaluate both densities at $\\lambda=1.3596$. $0.7979\\,e^{-0.9243}=0.7979(0.3968)=0.3166$ and $0.3989\\,e^{-0.2311}=0.3989(0.7937)=0.3166$. They are equal, so $\\lambda$ is the crossing point.',
  figSol: () => dens({xr:[-0.4,7], top:0.3989, f0: y=>y>=0 ? gpdf(y,0,1) : 0, f1: y=>y>=0 ? gpdf(y,0,4) : 0,
    lams:[1.3596], dec1: y=>y>1.3596, xs:1,
    notes:[[0.12,1.08,'p_0\\,f_Y(y\\mid 0)','start'],[3,0.38,'p_1\\,f_Y(y\\mid 1)','start'],[1.3596,1.3,'\\lambda=1.360','middle','k']]}),
  err:'Common error: writing $f_Y(y\\mid 0)=f_{N_0}(y)$ without the factor $2$. The negative half of $N_0$ folds onto the positive axis, so the density doubles there.',
  teach:'This is the examination shape. Here detection works on the size of the output, because the two outputs have the same mean.' },

{ id:'D2-23', module:'M2', type:'pam', src:'Final Q2',
  stem:'Assume that in a binary pulse amplitude modulation (PAM) communication system, “0” and “1” bits occur with probabilities $0.6$ and $0.4$. '
     +'At the output of the matched filter, the output signal has a Gaussian distribution with mean $3$ and variance $4$ if “1” is transmitted. '
     +'It has a Gaussian distribution with mean $0$ and variance $1$ if “0” is transmitted. According to this information,',
  parts:['<b>[8 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '<b>[9 pts]</b> Find the optimal decision rule. Show that it needs two thresholds, and give both.',
         '<b>[8 pts]</b> Calculate the average probability of bit error ($P_b$) as a numerical value, using a table of the $Q$ function.'],
  sol:'<b>Given.</b> $p_0=0.6$ and $p_1=0.4$. $Y\\sim\\mathcal{N}(0,1)$ given “0” and $Y\\sim\\mathcal{N}(3,4)$ given “1”.<br>'
     +'<b>Find.</b> The two conditional PDFs, the decision rule, and $P_b$.<br>'
     +'<b>Method.</b> Set the weighted densities equal and take logarithms. The variances differ, so the $y^{2}$ terms do not cancel. The result is a quadratic with two roots.<br>'
     +'<b>Solution — (a).</b> $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{2\\pi}}e^{-y^{2}/2}=0.3989\\,e^{-y^{2}/2},\\qquad f_Y(y\\mid 1)=\\frac{1}{\\sqrt{2\\pi(4)}}e^{-(y-3)^{2}/8}=0.1995\\,e^{-(y-3)^{2}/8}$$<br>'
     +'<b>Solution — (b).</b> Set $0.6f_Y(\\lambda\\mid 0)=0.4f_Y(\\lambda\\mid 1)$. The factors in front are $0.6(0.3989)$ and $0.4(0.1995)$, whose ratio is $3$. Take logarithms and multiply by $8$. '
     +'$$\\begin{aligned}\\ln3-\\frac{\\lambda^{2}}{2}&=-\\frac{(\\lambda-3)^{2}}{8}\\\\8\\ln3-4\\lambda^{2}&=-\\lambda^{2}+6\\lambda-9\\\\3\\lambda^{2}+6\\lambda-9-8\\ln3&=0\\\\\\lambda^{2}+2\\lambda-5.930&=0\\end{aligned}$$ '
     +'The quadratic formula gives $\\lambda=-1\\pm\\sqrt{1+5.930}=-1\\pm2.632$. So $\\lambda_1=-3.632$ and $\\lambda_2=1.632$. '
     +'Between the roots the narrow density of “0” is larger. Decide “0” when $-3.632<Y<1.632$, and “1” otherwise.<br>'
     +'<b>Solution — (c).</b> A “0” is wrong outside the interval. $$P(e\\mid 0)=Q(3.63)+Q(1.63)=0.000142+0.05155=0.05169$$ '
     +'A “1” is wrong inside the interval. Let $Z$ be a standard Gaussian variable. With mean $3$ and $\\sigma=2$, the limits become $(-3.632-3)/2=-3.32$ and $(1.632-3)/2=-0.68$. '
     +'$$P(e\\mid 1)=P(-3.32<Z<-0.68)=Q(0.68)-Q(3.32)=0.2483-0.000450=0.2478$$ $$P_b=0.6(0.05169)+0.4(0.2478)=0.03101+0.09912=0.1301$$<br>'
     +'<b>Check.</b> Evaluate the weighted densities at both roots. At $1.632$ they are $0.2394e^{-1.332}=0.0632$ and $0.0798e^{-0.2339}=0.0632$. '
     +'At $-3.632$ they are $0.2394e^{-6.596}=3.27\\times10^{-4}$ and $0.0798e^{-5.498}=3.27\\times10^{-4}$. Both roots are crossing points.',
  figSol: () => dens({xr:[-6,10], top:0.2394, f0: y=>0.6*gpdf(y,0,1), f1: y=>0.4*gpdf(y,3,4), lams:[-3.632,1.632],
    dec1: y=>y<-3.632 || y>1.632, xs:2,
    notes:[[-0.5,1.08,'0.6\\,f_Y(y\\mid 0)','end'],[3.4,0.43,'0.4\\,f_Y(y\\mid 1)','start'],
           [-3.632,1.3,'\\lambda_1=-3.632','middle','k'],[1.632,1.3,'\\lambda_2=1.632','middle','k']]}),
  err:'Common error: cancelling the $y^{2}$ terms as if the variances were equal, which leaves one threshold. With unequal variances the wider density wins again far out on the left, so a second threshold appears.',
  teach:'This is the examination shape. The second threshold matters little here, because $Q(3.63)$ is small, but the rule is wrong without it.' },

{ id:'D2-24', module:'M2', type:'pam', src:'Final Q2',
  stem:'Assume that in a binary pulse amplitude modulation (PAM) communication system, “0” and “1” bits occur with probabilities $0.7$ and $0.3$. '
     +'Consider a signal detector with the input $$Y=\\begin{cases}5+N,&\\text{if }1\\text{ is sent}\\\\N,&\\text{if }0\\text{ is sent}\\end{cases}$$ '
     +'where $N$ is a Gaussian random variable with mean $0$ and variance $4$. According to this information,',
  parts:['<b>[8 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '<b>[8 pts]</b> Find the optimal decision threshold ($\\lambda$).',
         '<b>[9 pts]</b> Calculate the average probability of bit error ($P_b$) as a numerical value, using a table of the $Q$ function.'],
  sol:'<b>Given.</b> $p_0=0.7$ and $p_1=0.3$. $Y=5+N$ for “1” and $Y=N$ for “0”, with $N\\sim\\mathcal{N}(0,4)$.<br>'
     +'<b>Find.</b> The two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> The variances are equal, so the $y^{2}$ terms cancel and one threshold results. It moves from the midpoint $2.5$ toward the less likely “1”.<br>'
     +'<b>Solution — (a).</b> $$f_Y(y\\mid 1)=\\frac{1}{\\sqrt{8\\pi}}e^{-(y-5)^{2}/8}=0.1995\\,e^{-(y-5)^{2}/8},\\qquad f_Y(y\\mid 0)=0.1995\\,e^{-y^{2}/8}$$<br>'
     +'<b>Solution — (b).</b> Set $0.7f_Y(\\lambda\\mid 0)=0.3f_Y(\\lambda\\mid 1)$ and take logarithms. '
     +'$$\\begin{aligned}\\ln\\frac{0.7}{0.3}&=\\frac{\\lambda^{2}-(\\lambda-5)^{2}}{8}=\\frac{10\\lambda-25}{8}\\\\10\\lambda&=25+8(0.8473)=31.78\\\\\\lambda&=3.178\\end{aligned}$$ Decide “1” when $Y>3.178$.<br>'
     +'<b>Solution — (c).</b> Divide each distance by $\\sigma=2$ and round to two decimals. $$P(e\\mid 0)=Q\\!\\left(\\frac{3.178}{2}\\right)=Q(1.59)=0.05592$$ $$P(e\\mid 1)=Q\\!\\left(\\frac{5-3.178}{2}\\right)=Q(0.91)=0.1814$$ '
     +'$$P_b=0.7(0.05592)+0.3(0.1814)=0.03914+0.05442=0.09356$$<br>'
     +'<b>Check.</b> At $\\lambda=3.178$ the weighted densities are $0.1396e^{-1.2625}=0.1396(0.2830)=0.03951$ and $0.05984e^{-0.4150}=0.05984(0.6604)=0.03951$. They are equal.',
  figSol: () => gdens(0, 5, 4, 0.7, 3.178, [-7,12], {xs:2, notes:[[0,1.08,'0.7\\,f_Y(y\\mid 0)'],[5.9,0.56,'0.3\\,f_Y(y\\mid 1)','start'],[3.178,1.3,'\\lambda=3.178','middle','k']]}),
  err:'Common error: dividing by the variance $4$ instead of the standard deviation $2$ inside $Q$. That gives $Q(0.79)$ and $Q(0.46)$, far too large.',
  teach:'This is the examination shape with new numbers. The two errors differ by a factor of three, and the priors balance them.' },

{ id:'D2-25', module:'M2', type:'pam', src:'Final Q2',
  stem:'In a binary pulse amplitude modulation (PAM) communication system, the matched-filter output is $Y=-2+N$ when “0” is sent and $Y=2+N$ when “1” is sent. '
     +'The noise $N$ is Gaussian with mean $0$ and variance $1$. The bit “1” occurs three times as often as the bit “0”. According to this information,',
  parts:['<b>[6 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '<b>[7 pts]</b> Find the optimal decision threshold ($\\lambda$).',
         '<b>[7 pts]</b> Calculate $P_b$ as a numerical value, using a table of the $Q$ function.',
         '<b>[5 pts]</b> A receiver ignores the priors and uses $\\lambda=0$. Calculate its $P_b$ and compare.'],
  sol:'<b>Given.</b> $p_1=3p_0$, so $p_0=0.25$ and $p_1=0.75$. $Y=\\mp2+N$ with $N\\sim\\mathcal{N}(0,1)$.<br>'
     +'<b>Find.</b> The two conditional PDFs, $\\lambda$, $P_b$, and $P_b$ at $\\lambda=0$.<br>'
     +'<b>Method.</b> The priors come from the ratio: $p_0+3p_0=1$. The threshold then moves toward the less likely “0”.<br>'
     +'<b>Solution — (a).</b> $$f_Y(y\\mid 1)=0.3989\\,e^{-(y-2)^{2}/2},\\qquad f_Y(y\\mid 0)=0.3989\\,e^{-(y+2)^{2}/2}$$<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}0.25\\,e^{-(\\lambda+2)^{2}/2}&=0.75\\,e^{-(\\lambda-2)^{2}/2}\\\\\\ln\\frac13&=\\frac{(\\lambda+2)^{2}-(\\lambda-2)^{2}}{2}=4\\lambda\\\\\\lambda&=\\frac{-1.0986}{4}=-0.2747\\end{aligned}$$ Decide “1” when $Y>-0.2747$.<br>'
     +'<b>Solution — (c).</b> $$P(e\\mid 0)=Q(-0.2747+2)=Q(1.73)=0.04182,\\qquad P(e\\mid 1)=Q(2+0.2747)=Q(2.27)=0.01160$$ '
     +'$$P_b=0.25(0.04182)+0.75(0.01160)=0.01046+0.00870=0.01916$$<br>'
     +'<b>Solution — (d).</b> At $\\lambda=0$ both errors are $Q(2.00)=0.02275$, so $P_b=0.02275$. The optimal threshold lowers $P_b$ by $16\\%$.<br>'
     +'<b>Check.</b> At $\\lambda=-0.2747$ the weighted densities are $0.25(0.3989)e^{-1.4884}=0.0225$ and $0.75(0.3989)e^{-2.5870}=0.0225$. They are equal.',
  figSol: () => gdens(-2, 2, 1, 0.25, -0.2747, [-5.5,5.5], {xs:1, notes:[[-2.2,0.41,'0.25\\,f_Y(y\\mid 0)','end'],[2,1.08,'0.75\\,f_Y(y\\mid 1)'],[-0.2747,1.3,'\\lambda=-0.275','middle','k']]}),
  err:'Common error: taking $p_1=3$ and $p_0=1$ straight from “three times as often”. Priors must add to one, so $p_0=0.25$ and $p_1=0.75$.',
  teach:'Part (d) puts a number on what the prior is worth. It is a modest gain when the signals are well separated.' },

{ id:'D2-26', module:'M2', type:'pam', src:'Final Q2 (variant)',
  stem:'In a binary pulse amplitude modulation (PAM) communication system, the matched-filter output is $Y=|N_0|$ when “0” is transmitted and $Y=|N_1|$ when “1” is transmitted. '
     +'$N_0$ and $N_1$ are independent Gaussian random variables with $N_0\\sim\\mathcal{N}(\\mu=0,\\sigma^{2}=1)$ and $N_1\\sim\\mathcal{N}(\\mu=0,\\sigma^{2}=9)$. '
     +'The bit “0” is sent with probability $0.6$ and “1” with probability $0.4$.',
  parts:['<b>[8 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '<b>[9 pts]</b> Find the optimal decision threshold ($\\lambda$) for these priors.',
         '<b>[8 pts]</b> Calculate $P_b$ as a numerical value, using a table of the $Q$ function.'],
  sol:'<b>Given.</b> $Y=|N_0|$ or $|N_1|$ with variances $1$ and $9$. $p_0=0.6$ and $p_1=0.4$.<br>'
     +'<b>Find.</b> The two conditional PDFs, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> A folded Gaussian has density $2f_N(y)$ on $y\\ge0$. Set the weighted densities equal and solve for $\\lambda^{2}$.<br>'
     +'<b>Solution — (a).</b> $$f_Y(y\\mid 0)=\\frac{2}{\\sqrt{2\\pi}}e^{-y^{2}/2}=0.7979\\,e^{-y^{2}/2},\\qquad f_Y(y\\mid 1)=\\frac{2}{3\\sqrt{2\\pi}}e^{-y^{2}/18}=0.2660\\,e^{-y^{2}/18}$$ for $y\\ge 0$, and both are zero for $y<0$.<br>'
     +'<b>Solution — (b).</b> Cancel $2/\\sqrt{2\\pi}$ from both sides and take logarithms. '
     +'$$\\begin{aligned}0.6\\,e^{-\\lambda^{2}/2}&=\\frac{0.4}{3}e^{-\\lambda^{2}/18}\\\\\\ln\\frac{0.6(3)}{0.4}&=\\frac{\\lambda^{2}}{2}-\\frac{\\lambda^{2}}{18}=\\frac{4\\lambda^{2}}{9}\\\\\\lambda^{2}&=\\frac{9\\ln4.5}{4}=3.384\\\\\\lambda&=1.840\\end{aligned}$$ Decide “1” when $Y>1.840$.<br>'
     +'<b>Solution — (c).</b> $$P(e\\mid 0)=P(|N_0|>1.840)=2Q(1.84)=2(0.03288)=0.06576$$ '
     +'$$P(e\\mid 1)=P(|N_1|<1.840)=1-2Q\\!\\left(\\frac{1.840}{3}\\right)=1-2Q(0.61)=1-2(0.2709)=0.4582$$ '
     +'$$P_b=0.6(0.06576)+0.4(0.4582)=0.03946+0.1833=0.2227$$<br>'
     +'<b>Check.</b> At $\\lambda=1.840$ the weighted densities are $0.6(0.7979)e^{-1.692}=0.0882$ and $0.4(0.2660)e^{-0.1880}=0.0882$. They are equal.',
  figSol: () => dens({xr:[-0.4,9], top:0.4787, f0: y=>y>=0 ? 0.6*2*gpdf(y,0,1) : 0, f1: y=>y>=0 ? 0.4*2*gpdf(y,0,9) : 0,
    lams:[1.8396], dec1: y=>y>1.8396, xs:1,
    notes:[[0.12,1.08,'0.6\\,f_Y(y\\mid 0)','start'],[3.6,0.3,'0.4\\,f_Y(y\\mid 1)','start'],[1.8396,1.3,'\\lambda=1.840','middle','k']]}),
  err:'Common error: dropping the factor $1/3$ that comes from $\\sigma_1=3$ in the density of $N_1$. The equation then reads $\\ln1.5=4\\lambda^{2}/9$, and the threshold falls to $0.955$.',
  teach:'Compare with the equal-prior folded question. The more likely “0” pushes the threshold out, and the error given “1” becomes large.' },

/* ---- working back from a target -------------------------------------- */

{ id:'D2-27', module:'M2', type:'design', src:'Final Q2 (variant)',
  stem:'In a binary pulse amplitude modulation (PAM) communication system, the matched-filter output is $Y=N$ when “0” is sent and $Y=3+N$ when “1” is sent. '
     +'The noise $N$ is Gaussian with mean $0$ and variance $1$. A designer wants the optimal threshold to sit at $\\lambda=2$. According to this information,',
  parts:['<b>[6 pts]</b> Write $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$. Find the optimal threshold and $P_b$ for equal priors.',
         '<b>[7 pts]</b> Find the probability $p_0$ of “0” that makes $\\lambda=2$ the optimal threshold.',
         '<b>[7 pts]</b> Calculate $P_b$ for this prior with $\\lambda=2$.',
         '<b>[5 pts]</b> With this prior, the receiver keeps the threshold of part (a). Calculate its $P_b$ and compare.'],
  sol:'<b>Given.</b> $Y=N$ for “0” and $Y=3+N$ for “1”, with $N\\sim\\mathcal{N}(0,1)$. Target $\\lambda=2$.<br>'
     +'<b>Find.</b> The PDFs, the equal-prior threshold and $P_b$, the prior $p_0$ for $\\lambda=2$, and two values of $P_b$.<br>'
     +'<b>Method.</b> Write the optimal threshold as a function of the priors, then solve it backwards for $p_0$.<br>'
     +'<b>Solution — (a).</b> $f_Y(y\\mid 0)=0.3989\\,e^{-y^{2}/2}$ and $f_Y(y\\mid 1)=0.3989\\,e^{-(y-3)^{2}/2}$. With equal priors $\\lambda=1.5$, midway. Each error is $Q(1.5/1)$, so $P_b=Q(1.50)=0.06681$.<br>'
     +'<b>Solution — (b).</b> Set $p_0f_Y(\\lambda\\mid 0)=p_1f_Y(\\lambda\\mid 1)$ and take logarithms. $$\\ln\\frac{p_0}{p_1}=\\frac{\\lambda^{2}-(\\lambda-3)^{2}}{2}=\\frac{6\\lambda-9}{2}=3\\lambda-4.5$$ '
     +'At $\\lambda=2$ this gives $\\ln(p_0/p_1)=1.5$, so $p_0/p_1=e^{1.5}=4.482$. With $p_1=1-p_0$, $$p_0=\\frac{4.482}{1+4.482}=0.8176,\\qquad p_1=0.1824.$$<br>'
     +'<b>Solution — (c).</b> A “0” is wrong when $N>2$. A “1” is wrong when $3+N<2$, that is $N<-1$. $$P_b=0.8176\\,Q(2.00)+0.1824\\,Q(1.00)=0.8176(0.02275)+0.1824(0.1587)=0.01860+0.02895=0.04755$$<br>'
     +'<b>Solution — (d).</b> At $\\lambda=1.5$ both conditional errors are $Q(1.50)=0.06681$. The weighted sum is $0.06681$ whatever the priors are. The threshold at $2$ gives $0.04755$, which is $29\\%$ lower.<br>'
     +'<b>Check.</b> At $\\lambda=2$ the weighted densities are $0.8176(0.3989)e^{-2}=0.3262(0.1353)=0.04414$ and $0.1824(0.3989)e^{-0.5}=0.07277(0.6065)=0.04414$. They are equal, so $\\lambda=2$ is optimal for this prior.',
  figSol: () => gdens(0, 3, 1, 0.8176, 2, [-3.5,6.5], {xs:1, notes:[[-0.3,1.08,'0.818\\,f_Y(y\\mid 0)','end'],[3.3,0.34,'0.182\\,f_Y(y\\mid 1)','start'],[2,1.3,'\\lambda=2','middle','k']]}),
  err:'Common error: solving $\\ln(p_0/p_1)=1.5$ as $p_0=e^{1.5}$. That is a ratio, and a probability cannot exceed one. Use $p_1=1-p_0$.',
  teach:'Reversing the question makes the class read the threshold formula as a relation between two unknowns. Part (d) shows why the prior is worth using.' },

{ id:'D2-28', module:'M2', type:'design', src:'MT Q3 (variant)',
  stem:'Two equiprobable messages, $s_0(t)$ for “0” and $s_1(t)$ for “1”, are transmitted by the waveforms below, with $T=4$ s. '
     +'They pass through the matched-filter type demodulator shown, with the unit-energy basis signal $\\psi(t)$. '
     +'The channel adds zero-mean white Gaussian noise of two-sided power spectral density $N_0/2$, which is not yet known. The link must reach $P_b\\le10^{-3}$. According to the information given above,',
  figure: () => mfQ(4, [[0,2,-2],[2,3,-1],[3,4,0]], [[0,2,2],[2,3,1],[3,4,0]], {yr:[-2.6,0.8], ys:1}, {yr:[-0.8,2.6], ys:1}),
  parts:['<b>[5 pts]</b> Plot the impulse response of the matched filter, $h(t)=\\psi(T-t)$.',
         '<b>[8 pts]</b> Write the optimal threshold and $P_b$ as a function of $N_0/2$.',
         '<b>[7 pts]</b> Find the largest $N_0/2$ that meets $P_b\\le10^{-3}$. Use $Q(3.09)=1.00\\times10^{-3}$.',
         '<b>[5 pts]</b> The message “0” is now sent as $s_0(t)=0$, with the same $s_1(t)$. Find the largest $N_0/2$ again.'],
  sol:'<b>Given.</b> $s_1(t)=2$ on $[0,2)$, $1$ on $[2,3)$ and $0$ on $[3,4]$. $s_0(t)=-s_1(t)$. Equal priors. Target $P_b\\le10^{-3}$.<br>'
     +'<b>Find.</b> $h(t)$, $P_b$ as a function of $N_0/2$, and the largest allowed $N_0/2$ for two designs.<br>'
     +'<b>Method.</b> Keep $\\sigma=\\sqrt{N_0/2}$ as the unknown. The $Q$ function falls as its argument grows, so $P_b\\le10^{-3}$ means an argument of at least $3.09$.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^24\\,dt+\\int_2^31\\,dt=8+1=9$, so $\\psi(t)=s_1(t)/3$. That is $2/3$ on $[0,2)$, $1/3$ on $[2,3)$ and $0$ on $[3,4]$. '
     +'Reverse and shift by $T=4$. $$h(t)=\\psi(4-t)=\\begin{cases}0,&t\\in[0,1)\\\\1/3,&t\\in[1,2)\\\\2/3,&t\\in[2,4]\\end{cases}$$<br>'
     +'<b>Solution — (b).</b> The coordinates are $\\pm3$, so $\\lambda=0$ for every noise level. Each coordinate is $3$ from the threshold. $$P_b=Q\\!\\left(\\frac{3}{\\sigma}\\right)=Q\\!\\left(\\frac{3}{\\sqrt{N_0/2}}\\right)$$<br>'
     +'<b>Solution — (c).</b> Solve the inequality one step at a time. $$\\begin{aligned}Q\\!\\left(\\frac{3}{\\sigma}\\right)&\\le10^{-3}=Q(3.09)\\\\\\frac{3}{\\sigma}&\\ge3.09\\\\\\sigma&\\le\\frac{3}{3.09}=0.9709\\\\\\frac{N_0}{2}&=\\sigma^{2}\\le0.9426\\ \\text{W/Hz}\\end{aligned}$$ '
     +'The direction of the inequality turns at the second line, because $Q$ is decreasing.<br>'
     +'<b>Solution — (d).</b> Now the coordinates are $3$ and $0$, so $\\lambda=1.5$ and each coordinate is $1.5$ from it. $$\\frac{1.5}{\\sigma}\\ge3.09\\;\\Longrightarrow\\;\\sigma\\le0.4854\\;\\Longrightarrow\\;\\frac{N_0}{2}\\le0.2356\\ \\text{W/Hz}$$ '
     +'The on-off design tolerates four times less noise, a loss of $6.02$ dB.<br>'
     +'<b>Check.</b> Put $N_0/2=0.9426$ back: $\\sigma=\\sqrt{0.9426}=0.9709$ and $3/0.9709=3.090$, so $P_b=Q(3.09)=10^{-3}$. The ratio $0.9426/0.2356=4.00$ equals $(3/1.5)^{2}$.',
  figSol: () => { const s2 = 9/(3.09*3.09);
    return stack(760, [
      [psiH(4, [[0,2,2/3],[2,3,1/3],[3,4,0]], [[0,1,0],[1,2,1/3],[2,4,2/3]], {yr:[-0.2,1], yt:[1/3,2/3,1], yf:frac(3)}), 220],
      [gdens(-3, 3, s2, 0.5, 0, [-6.5,6.5], {xs:1, notes:[[-3,1.08,'p_0\\,f_Y(y\\mid 0)'],[3,1.08,'p_1\\,f_Y(y\\mid 1)'],[0,1.3,'\\lambda=0,\\ \\sigma^{2}=0.9426','middle','k']]}), 300]]); },
  err:'Common error: keeping the direction of the inequality when inverting $Q$ and writing $3/\\sigma\\le3.09$. That gives a smallest noise level instead of a largest one.',
  teach:'The reversed question asks for a design limit. Part (d) states the $6$ dB gap between antipodal and on-off signalling as a noise budget.' },

/* ---- detection with a bandwidth or with interference ------------------ */

{ id:'D2-29', module:'M2', type:'isi', src:'Final Q2 (variant)',
  stem:'A binary antipodal baseband link sends $R_b=12$ kb/s with raised-cosine pulses of roll-off factor $\\alpha=0.25$. '
     +'The matched-filter sample is $Y=\\sqrt{E_b}+N$ for “1” and $Y=-\\sqrt{E_b}+N$ for “0”, and the bits are equiprobable. '
     +'The received power is $P=3.6\\ \\mu$W. $N$ is Gaussian with mean $0$ and variance $N_0/2$, where $N_0=5\\times10^{-11}$ W/Hz. According to this information,',
  parts:['<b>[6 pts]</b> Find the Nyquist bandwidth $W$, the frequency $f_1$ where the roll-off starts, and the transmission bandwidth $B_T$.',
         '<b>[7 pts]</b> Find $E_b$. Write $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$, and give the optimal threshold.',
         '<b>[6 pts]</b> Calculate $P_b$ with a table of the $Q$ function.',
         '<b>[6 pts]</b> The channel offers $B_T=9$ kHz. The rate is raised to fill it, with the same $\\alpha$ and the same received power. Find the new $R_b$ and $P_b$.'],
  sol:'<b>Given.</b> $R_b=12$ kb/s, $\\alpha=0.25$, $P=3.6\\ \\mu$W, $N_0=5\\times10^{-11}$ W/Hz, equal priors.<br>'
     +'<b>Find.</b> $W$, $f_1$, $B_T$, $E_b$, the conditional PDFs, $\\lambda$, $P_b$, and the new rate and $P_b$.<br>'
     +'<b>Method.</b> The bandwidth depends on the rate and the roll-off. The error depends on $E_b/N_0$, and $E_b=P/R_b$ ties the two together.<br>'
     +'<b>Solution — (a).</b> $$W=\\frac{R_b}{2}=6\\ \\text{kHz},\\qquad f_1=W(1-\\alpha)=4.5\\ \\text{kHz},\\qquad B_T=W(1+\\alpha)=7.5\\ \\text{kHz}$$<br>'
     +'<b>Solution — (b).</b> One bit lasts $T_b=1/R_b$, so $E_b=PT_b=3.6\\times10^{-6}/12000=3.0\\times10^{-10}$ J. Then $\\sqrt{E_b}=1.732\\times10^{-5}$. '
     +'The variance is $\\sigma^{2}=N_0/2=2.5\\times10^{-11}$, so $\\sigma=5\\times10^{-6}$ and $1/\\sqrt{2\\pi\\sigma^{2}}=7.979\\times10^{4}$. '
     +'$$f_Y(y\\mid 1)=7.979\\times10^{4}\\,e^{-(y-1.732\\times10^{-5})^{2}/(5\\times10^{-11})}$$ $$f_Y(y\\mid 0)=7.979\\times10^{4}\\,e^{-(y+1.732\\times10^{-5})^{2}/(5\\times10^{-11})}$$ '
     +'The signals are antipodal with equal priors, so $\\lambda=0$.<br>'
     +'<b>Solution — (c).</b> $$P_b=Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)=Q\\!\\left(\\frac{1.732\\times10^{-5}}{5\\times10^{-6}}\\right)=Q(3.46)=2.701\\times10^{-4}$$<br>'
     +'<b>Solution — (d).</b> Solve $B_T=R_b(1+\\alpha)/2$ for the rate. $$R_b=\\frac{2B_T}{1+\\alpha}=\\frac{2(9)}{1.25}=14.4\\ \\text{kb/s}$$ '
     +'Now $E_b=3.6\\times10^{-6}/14400=2.5\\times10^{-10}$ J and $2E_b/N_0=10$. $$P_b=Q\\bigl(\\sqrt{10}\\bigr)=Q(3.16)=7.889\\times10^{-4}$$ The rate rose by $20\\%$ and $P_b$ rose about three times.<br>'
     +'<b>Check.</b> Both designs have $B_T/R_b=(1+\\alpha)/2=0.625$: $7.5/12=0.625$ and $9/14.4=0.625$. The ratio $E_b/N_0$ fell from $6$ to $5$, that is $10\\log_{10}(6/5)=0.79$ dB. This equals $10\\log_{10}(14.4/12)=0.79$ dB, the rate increase.',
  figSol: () => { const f1 = 4.5, W = 6, B = 7.5;
    const Pf = f => { const a = Math.abs(f); return a < f1 ? 1 : a < B ? 0.5*(1+Math.cos(Math.PI*(a-f1)/(2*W-2*f1))) : 0; };
    const s = P.Axes({w:760,h:250,xr:[0,10],yr:[-0.08,1.4],xlabel:'f\\;(\\mathrm{kHz})',ylabel:'2W\\,P(f)',
      pad:{l:66,r:28,t:22,b:40},xstep:1,ytarget:3});
    s.curve(Pf, {color:C.h, width:2.4, n:1200});
    [f1, W, B].forEach(v => s.vline(v, {color:C.muted}));
    s.note(f1, 1.2, 'f_1', {tex:true, fs:15, anchor:'start', dx:6, color:C.ink});
    s.note(W, 1.2, 'W', {tex:true, fs:15, anchor:'start', dx:6, color:C.ink});
    s.note(B, 1.2, 'B_T', {tex:true, fs:15, anchor:'start', dx:6, color:C.ink});
    return stack(760, [[s.svg(), 250],
      [gdens(-1.732, 1.732, 0.25, 0.5, 0, [-4,4], {xl:'y\\;(10^{-5})', xs:1}), 300]]); },
  err:'Common error: taking $W=R_b=12$ kHz. The Nyquist bandwidth is half the bit rate, so every bandwidth in the question comes out twice too large.',
  teach:'Part (d) is the trade the whole module turns on. More bits per second through the same power leave less energy for each bit.' },

{ id:'D2-30', module:'M2', type:'isi', src:'Final Q2 (variant)',
  stem:'In a binary PAM system, the pulse of each bit spreads into the next bit interval. The matched-filter sample of the current bit is $Y=a+c+N$. '
     +'Here $a=1.8$ for “1” and $a=-1.8$ for “0”. The term $c$ comes from the previous bit: $c=0.6$ if that bit was “1” and $c=-0.6$ if it was “0”. '
     +'All bits are independent and equiprobable, and $N$ is Gaussian with mean $0$ and variance $0.36$. According to this information,',
  parts:['<b>[8 pts]</b> Determine the conditional PDFs, $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$, averaged over the previous bit.',
         '<b>[7 pts]</b> Find the optimal decision threshold ($\\lambda$).',
         '<b>[10 pts]</b> Calculate $P_b$ with a table of the $Q$ function. Compare it with $P_b$ when the interference is removed ($c=0$).'],
  sol:'<b>Given.</b> $a=\\pm1.8$, $c=\\pm0.6$ with equal probabilities, $N\\sim\\mathcal{N}(0,0.36)$, so $\\sigma=0.6$. Equal priors.<br>'
     +'<b>Find.</b> The two conditional PDFs, $\\lambda$, and $P_b$ with and without interference.<br>'
     +'<b>Method.</b> Given the current bit, the sample still depends on the previous bit. Its density is the average of two Gaussians, one for each previous bit.<br>'
     +'<b>Solution — (a).</b> Given “1”, $Y=2.4+N$ or $Y=1.2+N$, each with probability $\\tfrac12$. With $1/\\sqrt{2\\pi(0.36)}=0.6649$, '
     +'$$f_Y(y\\mid 1)=\\tfrac12(0.6649)\\left[e^{-(y-2.4)^{2}/0.72}+e^{-(y-1.2)^{2}/0.72}\\right].$$ '
     +'Given “0” the two means are $-2.4$ and $-1.2$. $$f_Y(y\\mid 0)=0.3324\\left[e^{-(y+2.4)^{2}/0.72}+e^{-(y+1.2)^{2}/0.72}\\right]$$<br>'
     +'<b>Solution — (b).</b> The two densities are mirror images: $f_Y(y\\mid 0)=f_Y(-y\\mid 1)$. For $y>0$ and any mean $m>0$, $|y-m|<y+m$. So each Gaussian of $f_Y(y\\mid 1)$ is larger than its mirror, and “1” wins for every $y>0$. With equal priors, $\\lambda=0$.<br>'
     +'<b>Solution — (c).</b> Average the conditional error over the previous bit. $$\\begin{aligned}P(e\\mid 1)&=\\tfrac12P(2.4+N<0)+\\tfrac12P(1.2+N<0)\\\\&=\\tfrac12Q\\!\\left(\\frac{2.4}{0.6}\\right)+\\tfrac12Q\\!\\left(\\frac{1.2}{0.6}\\right)\\\\&=\\tfrac12Q(4.00)+\\tfrac12Q(2.00)\\\\&=\\tfrac12(3.167\\times10^{-5})+\\tfrac12(0.02275)=0.01139\\end{aligned}$$ '
     +'By symmetry $P(e\\mid 0)$ is the same, so $P_b=0.01139$. Without interference, $P_b=Q(1.8/0.6)=Q(3.00)=1.350\\times10^{-3}$. The interference raises $P_b$ about $8.4$ times.<br>'
     +'<b>Check.</b> The previous bit of the opposite sign leaves a margin of $1.8-0.6=1.2$, which is $2$ standard deviations. That pattern alone gives $\\tfrac12Q(2.00)=0.01138$. The other pattern adds only $\\tfrac12Q(4.00)=1.6\\times10^{-5}$.',
  figSol: () => { const f1 = y => 0.25*(gpdf(y,2.4,0.36)+gpdf(y,1.2,0.36)), f0 = y => f1(-y);
    let top = 0; for(let i=0;i<=400;i++){ top = Math.max(top, f1(4*i/400)); }
    return dens({xr:[-4.5,4.5], top, f0, f1, lams:[0], dec1: y=>y>0, xs:1,
      notes:[[-1.8,1.1,'p_0\\,f_Y(y\\mid 0)'],[1.8,1.1,'p_1\\,f_Y(y\\mid 1)'],[0,1.3,'\\lambda=0','middle','k']]}); },
  err:'Common error: using only the average signal level $1.8$ and getting $Q(3.00)$. The interference changes the margin from bit to bit, and the small margin dominates the average.',
  teach:'The interference costs almost an order of magnitude without changing the average signal. Ask what $c$ would close the eye completely.' }

]);

window.DRILL_M2 = [

{ id:'m2-drill', module:'M2', nav:'Module 2 · practice questions',
  title:'Module 2 — practice questions',
  objective:'Thirty open-ended questions with worked solutions, in the form they are asked in.',
  keywords:'practice questions module 2 matched filter demodulator conditional density threshold priors error probability laplacian triangular exponential folded gaussian raised cosine interference',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Practice D2-01 … D2-30'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question before opening its solution. Use these checks:<ul><li>The sample variance is the two-sided density $N_0/2$.</li><li>The optimal threshold moves away from the more likely message.</li><li>A noise density that is not Gaussian is integrated directly, without $Q$.</li><li>An error probability falls when the distance between the signals grows.</li></ul>'},
  {t:'rule', short:true},
  {t:'drill', module:'M2'}
]}

];
})();
