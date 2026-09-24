/* ==========================================================================
   Practice questions — Module 4.

   Thirty questions in the form of the midterm and final examinations. Six
   shapes, one per type below. Three questions take their shape from a
   textbook problem (src 'Madhow P6.xx') and keep the id of the question they
   replaced: D4-04 (bound), D4-05 (mismatch) and D4-26 (erasure).

     binary  — two drawn waveforms in white Gaussian noise, the correlator or
               matched-filter demodulator, the conditional densities of its
               sample, the optimal threshold and the bit error probability;
     priors  — binary PAM with unequal priors: the MAP threshold, and the
               average bit error probability read from a Q table;
     mary    — an M-ary waveform family: the constellation, the optimal
               decision regions, and the nearest-neighbour approximation of
               the symbol error probability as a function of E_s,avg/N0;
     bound   — the union bound against the nearest-neighbour form, and two
               constellations compared at equal average energy;
     erasure — a receiver with a third outcome, an erasure zone along the
               boundaries: error and erasure probabilities, bound and exact;
     mismatch— a gain error moves the samples against fixed thresholds: the
               conditional errors, the average error and the loss in dB.

   Every Q value is quoted as a table would give it: the argument rounded to
   two decimals. verify/drills_m4.py re-derives every stated number by a
   different route (sampled waveforms, numerical integration, Monte Carlo).
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;
const NS = 'http://www.w3.org/2000/svg';

/* ---- layout: several finished SVGs placed side by side in one figure ---- */
function row(list, gap){
  gap = gap || 16;
  let x = 0, H = 0;
  const inner = list.map(s=>{
    const m = s.match(/^<svg viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const w = +m[1], h = +m[2];
    const out = s.replace(/^<svg viewBox="0 0 [\d.]+ [\d.]+"/,
      `<svg x="${x}" y="0" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"`);
    x += w + gap; H = Math.max(H, h);
    return out;
  });
  return `<svg viewBox="0 0 ${x-gap} ${H}" xmlns="${NS}" role="img">${inner.join('')}</svg>`;
}

/* ---- a legend drawn as a small card inside the plot ---- */
function legend(a, items, corner){
  const L = P.labelScale(), fs = 13, rowH = 22*L, sw = 24*L, padX = 9*L;
  const tw = Math.max(...items.map(it=>it[1].replace(/\\[a-zA-Z]+|[{}_^]/g,'').length))*7.2*L;
  const w = padX*2 + sw + 8*L + tw, h = items.length*rowH + 8*L;
  const x = (corner||'tr').includes('l') ? a.x0 + 8 : a.x1 - w - 8;
  const y = (corner||'tr').includes('b') ? a.y0 - h - 8 : a.y1 + 8;
  a.raw(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="5"
    fill="${C.plate}" stroke="${C.rule}" stroke-width="1.2"/>`);
  items.forEach((it,i)=>{
    const cy = y + 4*L + rowH*(i+0.5);
    if(it[2]==='fill')
      a.raw(`<rect x="${(x+padX).toFixed(1)}" y="${(cy-6*L).toFixed(1)}" width="${sw.toFixed(1)}" height="${(12*L).toFixed(1)}" fill="${it[0]}" stroke="${C.err}" stroke-width="1"/>`);
    else
      a.raw(`<line x1="${(x+padX).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(x+padX+sw).toFixed(1)}" y2="${cy.toFixed(1)}"
        stroke="${it[0]}" stroke-width="${2.4}" ${it[2]?`stroke-dasharray="${it[2]}"`:''}/>`);
    a.raw(P.texName(it[1], {xLeft:x+padX+sw+8*L, baseline:cy+4*L, size:fs, color:C.ink, figW:a.W}));
  });
  return a;
}

/* ---- a waveform on its own small axes ---- */
function wave(o){
  const a = P.Axes({w:o.w||330, h:o.h||210, xr:o.xr, yr:o.yr,
    xlabel:'t\\;(\\mathrm{s})', ylabel:o.name, pad:{l:46,r:22,t:24,b:40},
    xstep:o.xstep||1, ystep:o.ystep, ytarget:4});
  if(o.pts) a.poly(o.pts, {color:o.color||C.in, width:2.4});
  if(o.f) a.curve(o.f, {color:o.color||C.in, width:2.4});
  return a.svg();
}
function waves(A, B){ return row([wave(A), wave(B)], 18); }

/* ---- the demodulator the examination draws ----
   kind 'mf' draws the matched filter psi(T-t); 'corr' draws a correlator. */
function receiver(kind, T){
  const box = kind==='mf' ? '\\psi(T-t)' : '\\int_0^{T}(\\cdot)\\,\\psi(t)\\,dt';
  return P.blocks({w:760, h:176, items:[
    {t:'text', x:18, y:98, label:'s_m(t)', tex:true, fs:15, anchor:'start', color:C.ink},
    {t:'arrow', x1:80, y1:94, x2:176, y2:94},
    {t:'sum', x:192, y:94},
    {t:'arrow', x1:192, y1:156, x2:192, y2:112},
    {t:'text', x:206, y:160, label:'w(t)', tex:true, fs:15, anchor:'start', color:C.ink},
    {t:'arrow', x1:206, y1:94, x2:300, y2:94},
    {t:'text', x:253, y:80, label:'r(t)', tex:true, fs:15},
    {t:'box', x:300, y:62, w:196, h:64, label:box, tex:true, fs:15},
    {t:'line', d:'M496,94 H560 L596,72'},
    {t:'line', d:'M604,94 H616'},
    {t:'arrow', x1:616, y1:94, x2:700, y2:94},
    {t:'text', x:586, y:44, label:'t=T', tex:true, fs:14},
    {t:'text', x:660, y:80, label:'Y', tex:true, fs:15},
    {t:'text', x:398, y:150, label: kind==='mf' ? 'matched filter' : 'correlator', fs:13}
  ]});
}

/* ---- conditional densities, the threshold and the error areas ----
   comps: [{m, s, p, col, tex}] sorted by mean; cuts: thresholds between
   consecutive components. With unequal priors the curves are weighted by
   the priors, so the threshold sits where the drawn curves cross. */
function dens(o){
  const g = (y,m,s)=>Math.exp(-(y-m)*(y-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
  const wtd = !!o.weighted;
  const f = c => y => (wtd ? c.p : 1)*g(y, c.m, c.s);
  let top = 0;
  o.comps.forEach(c=>{ top = Math.max(top, (wtd?c.p:1)/(c.s*Math.sqrt(2*Math.PI))); });
  const yr = [0, top*(o.head||1.45)];
  const a = P.Axes({w:o.w||660, h:o.h||300, xr:o.xr, yr:yr,
    xlabel:'y', ylabel: wtd ? 'P_i\\,f_Y(y\\mid i)' : 'f_Y(y\\mid i)',
    pad:{l:30,r:24,t:26,b:42}, xstep:o.xstep, yticksOverride:[]});
  const cuts = [-Infinity].concat(o.cuts, [Infinity]);
  o.comps.forEach((c,i)=>{
    const lo = cuts[i], hi = cuts[i+1];
    if(lo > -Infinity) a.area(f(c), o.xr[0], lo, {color:C.dec.err, stroke:C.err});
    if(hi <  Infinity) a.area(f(c), hi, o.xr[1], {color:C.dec.err, stroke:C.err});
  });
  o.comps.forEach(c=>a.curve(f(c), {color:c.col, width:2.4}));
  (o.ml||[]).forEach(t=>a.vline(t, {color:C.muted, dash:'2 4', width:1.2}));
  o.cuts.forEach((t,i)=>{
    a.vline(t, {color:C.ink, dash:'6 4', width:1.6});
    const lab = (o.cutTex && o.cutTex[i]) || '\\lambda';
    const anc = (o.cutAnchor&&o.cutAnchor[i]) || (t<0 ? 'end' : 'start');
    a.note(t, yr[1]*0.93, lab, {tex:true, fs:14, color:C.ink, anchor:anc, dx:anc==='end'?-6:6});
  });
  const items = o.comps.map(c=>[c.col, c.tex]);
  items.push([C.dec.err, '\\text{error area}', 'fill']);
  (o.moreLegend||[]).forEach(it=>items.push(it));
  legend(a, items, o.legend||'tr');
  if(o.over) o.over(a);
  return a.svg();
}

/* ---- a constellation with its decision regions ----
   pts: [{x, y, tex, p}]; the region of each point is found by testing a grid
   against the MAP metric |r-s_i|^2 - N0 ln P(s_i) (N0 = 0 gives the ML rule),
   so the picture is drawn by the rule itself. */
/* four colours are enough to keep every pair of neighbouring regions apart;
   a point may name its colour index `c` so that neighbours differ */
const REGCOL = () => [C.dec.in, C.dec.out, C.dec.mid, C.dec.h];
const PTCOL  = () => [C.in, C.out, C.mid, C.h];
function cons(o){
  const xr = o.xr, yr = o.yr, n = o.n || 72;
  const a = P.Axes({w:o.w||560, h:o.h||420, xr:xr, yr:yr,
    xlabel:o.xlabel||'\\psi_1', ylabel: o.oneD ? '' : (o.ylabel||'\\psi_2'), pad:o.pad||{l:52,r:24,t:26,b:42},
    xstep:o.xstep, ystep:o.ystep, xtarget:6, ytarget:5,
    yticksOverride: o.oneD ? [] : null,
    xtickfmt: v=>(o.hideX||[]).some(h=>Math.abs(h-v)<1e-9) ? '' : P.fmt(v,3),
    ytickfmt: v=>(o.hideY||[]).some(h=>Math.abs(h-v)<1e-9) ? '' : P.fmt(v,3)});
  const rc = REGCOL(), pc = PTCOL();
  const N0 = o.N0 || 0;
  const sx = (xr[1]-xr[0])/n, sy = (yr[1]-yr[0])/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x = xr[0]+(i+0.5)*sx, y = yr[0]+(j+0.5)*sy;
    let best = 0, bd = Infinity;
    o.pts.forEach((p,k)=>{
      const d = (x-p.x)*(x-p.x)+(y-p.y)*(y-p.y) - (N0 && p.p ? N0*Math.log(p.p) : 0);
      if(d < bd){ bd = d; best = k; }
    });
    const cb = o.pts[best].c!=null ? o.pts[best].c : best;
    a.rect(x-sx/2, y-sy/2, x+sx/2, y+sy/2, {fill:rc[cb % rc.length]});
  }
  /* the boundaries themselves: each pairwise bisector, kept only where its
     two points are both nearest by the same metric */
  const met = (x,y)=>o.pts.map(p=>(x-p.x)*(x-p.x)+(y-p.y)*(y-p.y) - (N0 && p.p ? N0*Math.log(p.p) : 0));
  const L = Math.hypot(xr[1]-xr[0], yr[1]-yr[0]);
  for(let i=0;i<o.pts.length;i++) for(let j=i+1;j<o.pts.length;j++){
    const pi=o.pts[i], pj=o.pts[j], nx=pj.x-pi.x, ny=pj.y-pi.y, nn=nx*nx+ny*ny;
    const bi = N0 && pi.p ? N0*Math.log(pi.p) : 0, bj = N0 && pj.p ? N0*Math.log(pj.p) : 0;
    const cc = (pj.x*pj.x+pj.y*pj.y - pi.x*pi.x - pi.y*pi.y + bi - bj)/2;
    const x0 = cc*nx/nn, y0 = cc*ny/nn, ux = -ny/Math.sqrt(nn), uy = nx/Math.sqrt(nn);
    let run = [];
    const flush = ()=>{ if(run.length>1) a.poly(run, {color:C.ink, width:1.5}); run = []; };
    for(let k=0;k<=1200;k++){
      const tt = -L + 2*L*k/1200, x = x0+tt*ux, y = y0+tt*uy;
      const inside = x>=xr[0] && x<=xr[1] && y>=yr[0] && y<=yr[1];
      const m = met(x,y), mi = m[i];
      if(inside && m.every(v=>v >= mi - 1e-9*(1+Math.abs(mi)))) run.push([x,y]); else flush();
    }
    flush();
  }
  (o.lines||[]).forEach(l=>a.poly(l.pts, {color:l.color||C.muted, width:l.width||1.4, dash:l.dash}));
  (o.nn||[]).forEach(([i,j])=>a.poly([[o.pts[i].x,o.pts[i].y],[o.pts[j].x,o.pts[j].y]],
    {color:C.muted, width:1.3, dash:'4 4'}));
  if(o.dmin){
    const [i,j] = o.dmin, p = o.pts[i], q = o.pts[j];
    a.poly([[p.x,p.y],[q.x,q.y]], {color:C.err, width:2.6});
  }
  const ci = (p,k)=>pc[(p.c!=null ? p.c : k) % pc.length];
  o.pts.forEach((p,k)=>a.point(p.x, p.y, {color:ci(p,k), r:6}));
  o.pts.forEach((p,k)=>{ if(p.tex) a.note(p.x, p.y, p.tex,
    {tex:true, fs:14, color:ci(p,k), dx:p.dx!=null?p.dx:8, dy:p.dy!=null?p.dy:-12, anchor:p.anchor||'start'}); });
  if(o.dmin && o.dminAt) a.note(o.dminAt[0], o.dminAt[1], 'd_{\\min}', {tex:true, fs:14, color:C.err, anchor:o.dminAnchor||'middle'});
  if(o.over) o.over(a);
  return a.svg();
}

/* ---- the impulse response of the matched filter next to the basis ---- */
function hPair(o){
  const A = P.Axes({w:330, h:210, xr:o.xr, yr:o.yr, xlabel:'t\\;(\\mathrm{s})', ylabel:'\\psi(t)',
    pad:{l:52,r:22,t:24,b:40}, xstep:o.xstep||1, ystep:o.ystep, ytarget:4});
  const B = P.Axes({w:330, h:210, xr:o.xr, yr:o.yr, xlabel:'t\\;(\\mathrm{s})', ylabel:'h(t)=\\psi(T-t)',
    pad:{l:52,r:22,t:24,b:40}, xstep:o.xstep||1, ystep:o.ystep, ytarget:4});
  if(o.pts){ A.poly(o.pts, {color:C.in, width:2.4});
    B.poly(o.pts.filter(p=>p[0]<=o.T).map(p=>[o.T-p[0], p[1]]).reverse().concat([[o.xr[1],0]]), {color:C.h, width:2.4}); }
  if(o.f){ A.curve(o.f, {color:C.in, width:2.4});
    B.curve(t=>o.f(o.T-t), {color:C.h, width:2.4}); }
  return row([A.svg(), B.svg()], 18);
}

/* ---- the Gaussian tail for drawn curves only (Borjesson-Sundberg form,
   relative error below 0.3%); every stated number comes from a Q table ---- */
function Qfn(x){
  if(x < 0) return 1 - Qfn(-x);
  return Math.exp(-x*x/2)/((0.661*x + 0.339*Math.sqrt(x*x + 5.51))*Math.sqrt(2*Math.PI));
}

/* ---- four quadrant regions with a cross-shaped erasure zone ----
   The zone |y1|<b or |y2|<b decides for no symbol, so it keeps the page
   colour under a light hatch; its edges are the decision boundaries. */
function erasureFig(o){
  const L = o.lim, b = o.b;
  const a = P.Axes({w:o.w||540, h:o.h||500, xr:[-L,L], yr:[-L,L], xlabel:'y_1', ylabel:'y_2',
    pad:{l:52,r:24,t:26,b:42}, xstep:1, ystep:1, xtarget:7, ytarget:7});
  const rc = REGCOL(), pc = PTCOL();
  o.pts.forEach((p,k)=>{ const sx = Math.sign(p.x), sy = Math.sign(p.y);
    a.rect(sx*b, sy*b, sx*L, sy*L, {fill:rc[k % rc.length]}); });
  for(let v=-L; v<=L-2*b+1e-9; v+=0.3){
    a.poly([[-b,v],[b,v+2*b]], {color:C.ruleStrong, width:1});
    a.poly([[v,-b],[v+2*b,b]], {color:C.ruleStrong, width:1});
  }
  [-b,b].forEach(e=>{ a.poly([[e,-L],[e,L]], {color:C.ink, width:1.5});
                      a.poly([[-L,e],[L,e]], {color:C.ink, width:1.5}); });
  o.pts.forEach((p,k)=>a.point(p.x, p.y, {color:pc[k % pc.length], r:6}));
  o.pts.forEach((p,k)=>a.note(p.x, p.y, p.tex, {tex:true, fs:14, color:pc[k % pc.length],
    dx:p.x>0?10:-10, dy:-12, anchor:p.x>0?'start':'end'}));
  if(o.over) o.over(a);
  return a.svg();
}

/* ======================================================================
   The taxonomy: the examination question types this module answers.
   ====================================================================== */
CONTENT.DRILLTYPES.M4 = [
  { k:'binary', name:'Two waveforms, the optimal receiver and the bit error probability',
    asks:'Two waveforms are drawn and sent in white Gaussian noise. Find the basis, the conditional densities of the sample, the optimal threshold and $P_b$.',
    method:['Find the unit-energy basis $\\psi(t)$ and project each waveform on it: $s_i=\\int_0^T s_i(t)\\psi(t)\\,dt$. If the two waveforms are not multiples of one pulse, use two basis functions.',
            'The sample is $Y=s_i+N$ with $N\\sim\\mathcal{N}(0,N_0/2)$, so each conditional density is a Gaussian centred on its coordinate.',
            'With equal priors the threshold is the midpoint, and $P_b=Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$ with $d=|s_1-s_0|$. With unequal priors move the threshold and weight the two tails by the priors.'],
    go:'m4-binary' },

  { k:'priors', name:'Binary PAM with unequal priors: the MAP threshold',
    asks:'Two Gaussian conditional densities and two unequal priors are given. Find the MAP threshold and the average bit error probability as a number.',
    method:['Write the MAP rule: decide the symbol with the larger $P(i)\\,f_Y(y\\mid i)$. Set the two products equal and take the logarithm.',
            'For equal variances the threshold is $\\lambda=\\frac{m_0+m_1}{2}+\\frac{\\sigma^{2}}{m_1-m_0}\\ln\\frac{P_0}{P_1}$. It moves towards the less likely mean.',
            'Then $P_b=P_0\\,P(\\text{error}\\mid 0)+P_1\\,P(\\text{error}\\mid 1)$. Each term is one Gaussian tail, read from a $Q$ table with the argument rounded to two decimals.'],
    go:'m4-map' },

  { k:'mary', name:'M-ary constellations: decision regions and the nearest-neighbour approximation',
    asks:'An $M$-ary waveform family is given. Draw the constellation and its optimal decision regions, and give $P_e$ as a function of $E_{s,\\text{avg}}/N_0$.',
    method:['Choose the basis, usually $\\sqrt{2/T}\\cos(2\\pi f_ct)$ and $-\\sqrt{2/T}\\sin(2\\pi f_ct)$, and read off each coordinate. The average energy is $E_{s,\\text{avg}}=\\frac1M\\sum_i\\|\\mathbf{s}_i\\|^{2}$.',
            'Each boundary is the perpendicular bisector of two neighbouring points. Outer points have regions that run off to infinity.',
            'Find $d_{\\min}$ and the average number $N_{\\min}$ of points at that distance. Then $P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$, with $d_{\\min}^{2}$ written in terms of $E_{s,\\text{avg}}$.'],
    go:'m4-dmin' },

  { k:'bound', name:'Union bound and equal-energy comparison',
    asks:'Bound the symbol error probability of a small constellation, or compare two constellations at the same average energy.',
    method:['List every pairwise distance $d_{kj}$. The union bound adds one $Q\\!\\left(\\sqrt{d_{kj}^{2}/2N_0}\\right)$ for every other point, averaged over the transmitted point.',
            'The nearest-neighbour form keeps only the terms at $d_{\\min}$. It is an approximation and can fall below the true value.',
            'To compare two constellations, express both $d_{\\min}^{2}$ in terms of the same $E_{s,\\text{avg}}$ first. The larger $d_{\\min}^{2}$ wins, and $N_{\\min}$ only scales the answer.'],
    go:'m4-union' },

  { k:'erasure', name:'A decision with an erasure zone',
    asks:'The receiver puts out an erasure when the observation lies near a boundary. Find the regions, the error and erasure probabilities by the intelligent union bound, and their exact values.',
    method:['Draw the regions with the zone cut out. From a signal point, measure the distance to the near edge of the zone and to its far edge.',
            'An error must cross a far edge, and an erasure only a near edge. The intelligent union bound adds one $Q$ term for each face of that kind.',
            'When the zone is made of strips along the axes, the two coordinates are independent. The exact probabilities are then products of one-coordinate probabilities.'],
    go:'m4-intel' },

  { k:'mismatch', name:'A receiver with misplaced thresholds',
    asks:'A wrong gain scales the samples while the thresholds stay at their nominal places. Find the conditional errors, the average error and the loss in decibels.',
    method:['Scale the samples and keep the thresholds. List the distance from each sample to each threshold beside it.',
            'In one dimension the error of a symbol is one $Q$ term for each threshold beside it. The terms add exactly, because the error events cannot happen together.',
            'At high signal-to-noise ratio the smallest distance decides. The loss in decibels is $20\\log_{10}$ of the correct distance over that smallest distance.'],
    go:'m4-regions' }
];

CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- binary: two drawn waveforms and the optimal receiver ------------- */

{ id:'D4-01', module:'M4', type:'binary', src:'MT Q3',
  stem:'Two equiprobable messages, "0" and "1", are sent over an additive white Gaussian noise channel. The two-sided noise power spectral density is $N_0/2=2$ W/Hz. Message $m$ is carried by the waveform $s_m(t)$ drawn below, with $T=3$ s. These signals are passed through the following correlator-type demodulator. Here $\\psi(t)$ is the unit-energy basis function of the two signals, and $w(t)$ is the white Gaussian noise. According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,3.4], yr:[-4,2], pts:[[0,0],[1,0],[1,-3],[3,-3],[3,0],[3.4,0]], ystep:2},
    {name:'s_1(t)', xr:[0,3.4], yr:[-4,2], pts:[[0,0],[1,0],[1,1],[3,1],[3,0],[3.4,0]], ystep:2})
    + receiver('corr'),
  parts:['[7 pts] Find $\\psi(t)$ and the coordinates $s_0$ and $s_1$ of the two signals on it.',
         '[8 pts] Determine the conditional probability density functions $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[10 pts] Find the optimal decision threshold $\\lambda$ and calculate the average probability of bit error $P_b$.'],
  sol:'<b>Given.</b> $s_0(t)=-3$ and $s_1(t)=1$ for $1\\le t<3$, both zero elsewhere in $[0,3]$. Equal priors, $N_0/2=2$ W/Hz, sample at $T=3$ s.<br>'
     +'<b>Find.</b> $\\psi(t)$, $s_0$, $s_1$, the two conditional densities, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Both waveforms are multiples of one rectangular pulse, so one basis function carries both. The correlator output is the coordinate plus Gaussian noise of variance $N_0/2$. With equal priors the MAP rule is the ML rule, and the threshold is the midpoint.<br>'
     +'<b>Solution — (a).</b> Both signals have the shape $p(t)=1$ for $1\\le t<3$. Its energy is $$E_p=\\int_1^3 1^{2}\\,dt=\\Big[\\,t\\,\\Big]_1^3=3-1=2.$$ Divide the pulse by $\\sqrt{E_p}$ to get unit energy: $\\psi(t)=1/\\sqrt2$ for $1\\le t<3$, and zero elsewhere. Project each signal on $\\psi(t)$: $$\\begin{aligned}s_0&=\\int_1^3(-3)\\frac{1}{\\sqrt2}\\,dt\\\\&=-\\frac{3}{\\sqrt2}\\Big[\\,t\\,\\Big]_1^3\\\\&=-\\frac{6}{\\sqrt2}=-3\\sqrt2=-4.243\\end{aligned}$$ $$\\begin{aligned}s_1&=\\int_1^3(1)\\frac{1}{\\sqrt2}\\,dt\\\\&=\\frac{2}{\\sqrt2}=\\sqrt2=1.414\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> The sample is $Y=s_m+N$, where $N=\\int_0^T w(t)\\psi(t)\\,dt$. $N$ is Gaussian with zero mean and variance $\\sigma^{2}=N_0/2=2$. So each conditional density is a Gaussian centred on its coordinate: $$f_Y(y\\mid 1)=\\frac{1}{\\sqrt{4\\pi}}\\exp\\!\\left(-\\frac{(y-\\sqrt2)^{2}}{4}\\right)$$ $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{4\\pi}}\\exp\\!\\left(-\\frac{(y+3\\sqrt2)^{2}}{4}\\right)$$<br>'
     +'<b>Solution — (c).</b> Equal priors, so decide "1" when $f_Y(y\\mid1)>f_Y(y\\mid0)$. That is when $y$ is closer to $s_1$ than to $s_0$. The threshold is the midpoint: $$\\lambda=\\frac{s_0+s_1}{2}=\\frac{-3\\sqrt2+\\sqrt2}{2}=-\\sqrt2=-1.414.$$ Decide "1" if $Y>\\lambda$ and "0" otherwise. Given "0", an error happens when $N>\\lambda-s_0$: $$\\begin{aligned}P(e\\mid 0)&=Q\\!\\left(\\frac{\\lambda-s_0}{\\sigma}\\right)\\\\&=Q\\!\\left(\\frac{-\\sqrt2+3\\sqrt2}{\\sqrt2}\\right)\\\\&=Q(2.00)=0.02275\\end{aligned}$$ Given "1", the distance to the threshold is also $s_1-\\lambda=2\\sqrt2$, so $P(e\\mid1)=Q(2.00)$. Then $$P_b=\\tfrac12(0.02275)+\\tfrac12(0.02275)=0.02275.$$<br>'
     +'<b>Check.</b> Reach the $Q$ argument from the waveforms directly. The energy of the difference is $$d^{2}=\\int_1^3\\bigl(s_1(t)-s_0(t)\\bigr)^{2}dt=\\int_1^3 4^{2}\\,dt=32.$$ With $N_0=4$, $$\\sqrt{\\frac{d^{2}}{2N_0}}=\\sqrt{\\frac{32}{8}}=2.00,$$ the same argument as in part (c).',
  figSol: () => dens({xr:[-9,6], xstep:3, cuts:[-Math.SQRT2],
    comps:[{m:-3*Math.SQRT2, s:Math.SQRT2, p:0.5, col:C.in, tex:'f_Y(y\\mid 0)'},
           {m:Math.SQRT2, s:Math.SQRT2, p:0.5, col:C.out, tex:'f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=-1.414'], legend:'tr', head:1.7}),
  err:'Using $\\sigma^{2}=N_0=4$ instead of $\\sigma^{2}=N_0/2=2$. The density given is already the two-sided $N_0/2$, and doubling it gives $Q(1.41)$ in place of $Q(2.00)$.',
  teach:'This is the examination shape with the demodulator drawn as a correlator. Ask for the $Q$ argument twice, from the coordinates and from $d^{2}$ in time, so the class sees that only the distance matters.' },

{ id:'D4-02', module:'M4', type:'binary', src:'MT Q3',
  stem:'In an additive white Gaussian noise channel with two-sided noise power spectral density $N_0/2=9$ W/Hz, two equiprobable messages, "0" and "1", are transmitted. Their waveforms $s_0(t)$ and $s_1(t)$ are drawn below. These signals are passed through the following matched-filter type demodulator, sampled at $t=T=3$ s. Here $\\psi(t)$ is the unit-energy basis signal that represents both waveforms and is also the impulse response of the matched filter. According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,3.4], yr:[-4,7], pts:[[0,0],[3,6],[3,0],[3.4,0]], ystep:2},
    {name:'s_1(t)', xr:[0,3.4], yr:[-4,7], pts:[[0,0],[3,-3],[3,0],[3.4,0]], ystep:2})
    + receiver('mf'),
  parts:['[5 pts] Plot the impulse response of the matched filter, $h(t)=\\psi(T-t)$.',
         '[10 pts] Determine the conditional PDFs $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[10 pts] Find the optimal decision threshold $\\lambda$ and calculate the average probability of bit error $P_b$. Use a $Q$-function table.'],
  sol:'<b>Given.</b> $s_0(t)=2t$ and $s_1(t)=-t$ for $0\\le t\\le3$, read from the drawing. Equal priors, $N_0/2=9$ W/Hz, $T=3$ s.<br>'
     +'<b>Find.</b> $h(t)$, the two conditional densities, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Both waveforms are multiples of the ramp $p(t)=t$. Normalise it to get $\\psi(t)$. The matched filter sampled at $T$ computes the projection on $\\psi(t)$, so $Y$ is a coordinate plus noise.<br>'
     +'<b>Solution — (a).</b> The ramp has energy $$E_p=\\int_0^3 t^{2}\\,dt=\\left[\\frac{t^{3}}{3}\\right]_0^3=\\frac{27}{3}-0=9.$$ So $\\psi(t)=t/\\sqrt9=t/3$ for $0\\le t\\le3$. Replace $t$ by $3-t$: $$h(t)=\\psi(3-t)=\\frac{3-t}{3},\\qquad 0\\le t\\le3.$$ It falls in a straight line from $1$ at $t=0$ to $0$ at $t=3$.<br>'
     +'<b>Solution — (b).</b> At $t=T$ the filter output is $y(T)=\\int_0^T r(\\tau)h(T-\\tau)\\,d\\tau=\\int_0^T r(\\tau)\\psi(\\tau)\\,d\\tau$. That is the projection of $r(t)$ on $\\psi(t)$. The signal parts are $$\\begin{aligned}s_0&=\\int_0^3 2t\\cdot\\frac{t}{3}\\,dt\\\\&=\\frac23\\left[\\frac{t^{3}}{3}\\right]_0^3\\\\&=\\frac23(9)=6\\end{aligned}$$ $$\\begin{aligned}s_1&=\\int_0^3(-t)\\frac{t}{3}\\,dt\\\\&=-\\frac13(9)=-3\\end{aligned}$$ The noise part has variance $\\sigma^{2}=N_0/2=9$, so $\\sigma=3$. Hence $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{18\\pi}}\\exp\\!\\left(-\\frac{(y-6)^{2}}{18}\\right)$$ $$f_Y(y\\mid 1)=\\frac{1}{\\sqrt{18\\pi}}\\exp\\!\\left(-\\frac{(y+3)^{2}}{18}\\right)$$<br>'
     +'<b>Solution — (c).</b> Equal priors give the midpoint threshold: $$\\lambda=\\frac{6+(-3)}{2}=1.5.$$ Here $s_0>s_1$, so decide "0" if $Y>1.5$ and "1" if $Y<1.5$. Given "0", an error is $Y<1.5$: $$P(e\\mid0)=Q\\!\\left(\\frac{6-1.5}{3}\\right)=Q(1.50)=0.06681.$$ Given "1", an error is $Y>1.5$: $$P(e\\mid1)=Q\\!\\left(\\frac{1.5-(-3)}{3}\\right)=Q(1.50).$$ So $P_b=\\tfrac12(0.06681)+\\tfrac12(0.06681)=0.06681$.<br>'
     +'<b>Check.</b> Compute the distance in time. The difference is $s_0(t)-s_1(t)=3t$, so $$d^{2}=\\int_0^3 9t^{2}\\,dt=9\\left[\\frac{t^{3}}{3}\\right]_0^3=81.$$ Then $d=9$, and $d/(2\\sigma)=9/6=1.50$, the same argument.',
  figSol: () => hPair({xr:[0,3.4], yr:[-0.2,1.3], ystep:0.5, T:3, pts:[[0,0],[3,1],[3,0],[3.4,0]]})
     + dens({xr:[-12,15], xstep:3, cuts:[1.5],
       comps:[{m:-3, s:3, p:0.5, col:C.out, tex:'f_Y(y\\mid 1)'},
              {m:6, s:3, p:0.5, col:C.in, tex:'f_Y(y\\mid 0)'}],
       cutTex:['\\lambda=1.5'], legend:'tl', head:1.75}),
  err:'Deciding "1" for $Y>\\lambda$ out of habit. Here $s_0=6$ is the larger coordinate, so a large sample means "0".',
  teach:'Part (a) is the examination\'s own opening. Ask the class to say why $y(T)$ equals the correlator output before they write any density.' },

{ id:'D4-03', module:'M4', type:'binary', src:'MT Q3',
  stem:'Two equiprobable messages are sent over an additive white Gaussian noise channel with two-sided noise power spectral density $N_0/2=0.64$ W/Hz. Message "0" is sent by $s_0(t)=0$. Message "1" is sent by the triangular pulse $s_1(t)$ drawn below, with $T=3$ s. The received signal passes through the following correlator-type demodulator. According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,3.4], yr:[-1,5], pts:[[0,0],[3.4,0]], ystep:2},
    {name:'s_1(t)', xr:[0,3.4], yr:[-1,5], pts:[[0,0],[1.5,4],[3,0],[3.4,0]], ystep:2})
    + receiver('corr'),
  parts:['[6 pts] Find the basis function $\\psi(t)$, the coordinates $s_0$ and $s_1$, and the energies $E_0$ and $E_1$.',
         '[6 pts] Determine the conditional PDFs $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[7 pts] Find the optimal decision threshold $\\lambda$ and the average probability of bit error $P_b$.',
         '[6 pts] The receiver is rebuilt to compare $\\int_0^T r(t)s_i(t)\\,dt-E_i/2$ for $i=0,1$ and pick the larger. Show that it makes the same decisions as part (c).'],
  sol:'<b>Given.</b> $s_0(t)=0$. $s_1(t)=\\tfrac83 t$ for $0\\le t\\le1.5$ and $s_1(t)=\\tfrac83(3-t)$ for $1.5\\le t\\le3$. Equal priors, $N_0/2=0.64$ W/Hz.<br>'
     +'<b>Find.</b> $\\psi(t)$, $s_0$, $s_1$, $E_0$, $E_1$, the densities, $\\lambda$, $P_b$, and the equivalence of the correlation metric.<br>'
     +'<b>Method.</b> On-off signalling needs one basis function, the normalised pulse. The threshold is the midpoint of the two coordinates. The correlation metric must keep the energy term, because the two energies differ.<br>'
     +'<b>Solution — (a).</b> The triangle is symmetric about $t=1.5$, so its energy is twice the energy of the rising half: $$\\begin{aligned}E_1&=2\\int_0^{1.5}\\left(\\tfrac83 t\\right)^{2}dt\\\\&=2\\cdot\\frac{64}{9}\\left[\\frac{t^{3}}{3}\\right]_0^{1.5}\\\\&=\\frac{128}{9}\\cdot\\frac{3.375}{3}=16\\end{aligned}$$ So $\\psi(t)=s_1(t)/\\sqrt{16}=s_1(t)/4$. Then $s_1=\\int_0^3 s_1(t)\\psi(t)\\,dt=E_1/4=4$. The zero signal has $s_0=0$ and $E_0=0$.<br>'
     +'<b>Solution — (b).</b> $Y=s_m+N$ with $\\sigma^{2}=0.64$ and $\\sigma=0.8$: $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{1.28\\pi}}\\exp\\!\\left(-\\frac{y^{2}}{1.28}\\right)$$ $$f_Y(y\\mid 1)=\\frac{1}{\\sqrt{1.28\\pi}}\\exp\\!\\left(-\\frac{(y-4)^{2}}{1.28}\\right)$$<br>'
     +'<b>Solution — (c).</b> Equal priors: $\\lambda=(0+4)/2=2$. Decide "1" if $Y>2$. Both errors need a noise excursion of $2$: $$P(e\\mid0)=P(e\\mid1)=Q\\!\\left(\\frac{2}{0.8}\\right)=Q(2.50)=0.006210.$$ So $P_b=0.006210$.<br>'
     +'<b>Solution — (d).</b> Since $s_1(t)=4\\psi(t)$, the correlation with $s_1$ is $\\int_0^T r(t)s_1(t)\\,dt=4Y$. The correlation with $s_0$ is zero. The two metrics are $$\\begin{aligned}M_1&=4Y-\\frac{16}{2}=4Y-8\\\\M_0&=0-0=0\\end{aligned}$$ Decide "1" when $M_1>M_0$, that is $4Y>8$, that is $Y>2$. This is the threshold of part (c).<br>'
     +'<b>Check.</b> From the distance: $d^{2}=E_1=16$ and $N_0=1.28$, so $$\\sqrt{\\frac{d^{2}}{2N_0}}=\\sqrt{\\frac{16}{2.56}}=\\sqrt{6.25}=2.50,$$ the same argument as in part (c).',
  figSol: () => dens({xr:[-3,7], xstep:1, cuts:[2],
    comps:[{m:0, s:0.8, p:0.5, col:C.in, tex:'f_Y(y\\mid 0)'},
           {m:4, s:0.8, p:0.5, col:C.out, tex:'f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=2'], legend:'tr', head:1.7}),
  err:'Dropping $-E_i/2$ from the correlation metric. With $E_1=16$ and $E_0=0$ the receiver then decides "1" for every $Y>0$, and $P(e\\mid 0)$ becomes one half.',
  teach:'Part (d) ties the examination shape to the correlation metric of the module. An on-off pair is the case where the energy term cannot be left out.' },

{ id:'D4-04', module:'M4', type:'bound', src:'Madhow P6.17',
  stem:'A symbol of length $T=2$ s has four slots of $0.5$ s. The pulse in slot $i$ is $p_i(t)=2$ for $0.5(i-1)\\le t<0.5i$, and zero elsewhere, with $i=1,\\ldots,4$. Two sets of four equally likely signals are built from these pulses. Set A puts one pulse in one slot, $s_i(t)=p_i(t)$. Set B puts pulses in two slots: $$s_1=p_1+p_2,\\quad s_2=p_3+p_4,\\quad s_3=p_1+p_3,\\quad s_4=p_2+p_4.$$ The channel adds white Gaussian noise with power spectral density $N_0/2$. Let $E_p$ be the energy of one pulse. The receiver uses the basis $\\psi_i(t)=p_i(t)/\\sqrt{E_p}$ and forms $r_i=\\int_0^T r(t)\\psi_i(t)\\,dt$. According to the information given above,',
  parts:['[6 pts] Find $E_p$, the four signal vectors of each set, and the energy per bit $E_b$ of each set.',
         '[7 pts] Find every pairwise distance in each set in terms of its $E_b$. Write the union bound on the symbol error probability $P_e$ of each set as a function of $E_b/N_0$.',
         '[6 pts] Find the penalty of set B in decibels at high $E_b/N_0$. Evaluate both union bounds at $E_b/N_0=4$.',
         '[6 pts] Show that the ML receiver for set B needs only the signs of $Z_1=r_1-r_4$ and $Z_2=r_2-r_3$. Find the exact $P_e$ of set B and evaluate it at $E_b/N_0=4$.'],
  sol:'<b>Given.</b> Four pulses of height $2$ and width $0.5$ s in disjoint slots. Set A uses one slot, set B two. Equal priors, noise power spectral density $N_0/2$.<br>'
     +'<b>Find.</b> $E_p$, the vectors, $E_b$ of each set, the distances, the two union bounds, the penalty of set B, and the exact $P_e$ of set B.<br>'
     +'<b>Method.</b> The pulses do not overlap, so they are orthogonal, and each one gives one basis direction. A vector then lists which slots carry a pulse. The union bound needs only the pairwise distances. For set B all energies are equal, so the ML rule becomes a largest-correlation rule, and that splits into two independent sign tests.<br>'
     +'<b>Solution — (a).</b> The energy of one pulse is $$E_p=\\int_0^{0.5}2^{2}\\,dt=4\\Big[\\,t\\,\\Big]_0^{0.5}=2.$$ So $p_i(t)=\\sqrt2\\,\\psi_i(t)$, and every pulse adds $\\sqrt2$ to its own coordinate. For set A: $$\\begin{aligned}\\mathbf{s}_1&=(\\sqrt2,0,0,0)\\\\\\mathbf{s}_2&=(0,\\sqrt2,0,0)\\\\\\mathbf{s}_3&=(0,0,\\sqrt2,0)\\\\\\mathbf{s}_4&=(0,0,0,\\sqrt2)\\end{aligned}$$ For set B: $$\\begin{aligned}\\mathbf{s}_1&=(\\sqrt2,\\sqrt2,0,0)\\\\\\mathbf{s}_2&=(0,0,\\sqrt2,\\sqrt2)\\\\\\mathbf{s}_3&=(\\sqrt2,0,\\sqrt2,0)\\\\\\mathbf{s}_4&=(0,\\sqrt2,0,\\sqrt2)\\end{aligned}$$ Four symbols carry $\\log_2 4=2$ bits. In set A every signal has energy $E_s=2$, so $E_b=2/2=1$. In set B every signal has energy $E_s=2+2=4$, so $E_b=4/2=2$.<br>'
     +'<b>Solution — (b).</b> In set A two signals differ in two coordinates, by $\\sqrt2$ in each. So every pair has $$d^{2}=(\\sqrt2)^{2}+(\\sqrt2)^{2}=4=4E_b.$$ In set B, start from $\\mathbf{s}_1$ and square the coordinate differences: $$\\begin{aligned}\\|\\mathbf{s}_1-\\mathbf{s}_2\\|^{2}&=2+2+2+2=8=4E_b\\\\\\|\\mathbf{s}_1-\\mathbf{s}_3\\|^{2}&=0+2+2+0=4=2E_b\\\\\\|\\mathbf{s}_1-\\mathbf{s}_4\\|^{2}&=2+0+0+2=4=2E_b\\end{aligned}$$ Every point of set B has the same pattern: two others at $d^{2}=2E_b$ and one at $d^{2}=4E_b$. The union bound adds $Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$ over the other three points. The sum is the same for every transmitted point, so it is also the average: $$P_e^{A}\\le3\\,Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)$$ $$P_e^{B}\\le2\\,Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)+Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)$$<br>'
     +'<b>Solution — (c).</b> At high $E_b/N_0$ the term with the smallest distance dominates. Set A has $d_{\\min}^{2}=4E_b$ and set B has $d_{\\min}^{2}=2E_b$. Set B needs twice the $E_b$ to reach the same $Q$ argument. Its penalty is $$10\\log_{10}\\frac{4}{2}=3.01\\ \\text{dB}.$$ At $E_b/N_0=4$ the arguments are $\\sqrt{2(4)}=\\sqrt8=2.828\\approx2.83$ and $\\sqrt4=2.00$: $$\\begin{aligned}P_e^{A}&\\le3\\,Q(2.83)\\\\&=3(0.002327)=0.006981\\end{aligned}$$ $$\\begin{aligned}P_e^{B}&\\le2\\,Q(2.00)+Q(2.83)\\\\&=0.04550+0.002327=0.04783\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> Expand the squared distance: $\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}=\\|\\mathbf{r}\\|^{2}-2\\langle\\mathbf{r},\\mathbf{s}_i\\rangle+E_i$. All four $E_i$ equal $4$, so only the correlation changes with $i$. ML picks the largest correlation. Divided by $\\sqrt2$, the four correlations are $r_1+r_2$, $r_3+r_4$, $r_1+r_3$ and $r_2+r_4$. Decide $s_1$ when $r_1+r_2$ beats each of the others: $$\\begin{aligned}(r_1+r_2)-(r_1+r_3)&=r_2-r_3=Z_2>0\\\\(r_1+r_2)-(r_2+r_4)&=r_1-r_4=Z_1>0\\\\(r_1+r_2)-(r_3+r_4)&=Z_1+Z_2>0\\end{aligned}$$ The third line holds whenever the first two do. So decide $s_1$ when $Z_1>0$ and $Z_2>0$. The same steps decide $s_2$ for $Z_1<0,\\ Z_2<0$, $s_3$ for $Z_1>0,\\ Z_2<0$ and $s_4$ for $Z_1<0,\\ Z_2>0$.<br>'
     +'<b>Solution — (d), exact error.</b> Given $s_1$, $$Z_1=\\sqrt2+n_1-n_4,\\qquad Z_2=\\sqrt2+n_2-n_3.$$ Each $n_i$ has variance $N_0/2$, so each $Z$ has variance $N_0$. The two use different noise terms, so they are independent. One sign is wrong with probability $$Q\\!\\left(\\frac{\\sqrt2}{\\sqrt{N_0}}\\right)=Q\\!\\left(\\sqrt{\\frac{E_p}{N_0}}\\right)=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right),$$ because $E_b=E_p=2$ for set B. The decision is right only when both signs are right: $$P_e^{B}=1-\\left[1-Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)\\right]^{2}.$$ At $E_b/N_0=4$: $$\\begin{aligned}P_e^{B}&=1-(1-0.02275)^{2}\\\\&=1-0.95502\\\\&=0.04498\\end{aligned}$$<br>'
     +'<b>Check.</b> The exact value lies below the bound, $0.04498<0.04783$. Expand the exact form: $1-(1-Q)^{2}=2Q-Q^{2}$. So the gap is the far term plus the overlap term: $$\\begin{aligned}Q(2.83)+Q(2.00)^{2}&=0.002327+0.000518\\\\&=0.002845\\end{aligned}$$ This equals $0.04783-0.04498=0.00285$.',
  figSol: () => {
    const B = cons({xr:[-2.2,2.2], yr:[-2.2,2.2], w:470, h:450, xstep:1, ystep:1,
      xlabel:'(r_1-r_4)/\\sqrt2', ylabel:'(r_2-r_3)/\\sqrt2', pad:{l:56,r:24,t:30,b:48},
      pts:[{x:1,y:1,c:0,tex:'\\mathbf{s}_1'},{x:-1,y:-1,c:2,tex:'\\mathbf{s}_2',dx:-8,dy:20,anchor:'end'},
           {x:1,y:-1,c:1,tex:'\\mathbf{s}_3',dy:20},{x:-1,y:1,c:3,tex:'\\mathbf{s}_4',dx:-8,anchor:'end'}],
      lines:[{pts:[[1,1],[-1,-1]], dash:'4 4'}],
      dmin:[0,2], dminAt:[1.12,0.28], dminAnchor:'start', hideX:[-1,1], hideY:[-1,1],
      over:a=>a.note(-0.2,0.34,'d^{2}=4E_b',{tex:true,fs:13,color:C.muted,anchor:'end'})});
    const g = P.Axes({w:560, h:450, xr:[0,14], yr:[-6,-0.02], xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'P_e',
      ytickfmt:P.decade, yticksOverride:P.decades(-6,-1), zeroAxes:false,
      pad:{l:62,r:24,t:30,b:48}, xstep:2, xtarget:7, ytarget:7});
    const lin = x => Math.pow(10, x/10), cl = v => Math.log10(Math.max(1e-12, v));
    const bA = x => 3*Qfn(Math.sqrt(2*lin(x)));
    const bB = x => 2*Qfn(Math.sqrt(lin(x))) + Qfn(Math.sqrt(2*lin(x)));
    const eB = x => { const q = Qfn(Math.sqrt(lin(x))); return 2*q - q*q; };
    g.curve(x=>cl(bA(x)), {color:C.in, width:2.4});
    g.curve(x=>cl(bB(x)), {color:C.mid, width:2.4});
    g.curve(x=>cl(eB(x)), {color:C.mid, width:2, dash:'6 4'});
    const at = (f, v) => { let lo = 0, hi = 20; for(let k=0;k<60;k++){ const m=(lo+hi)/2; if(f(m) > v) lo = m; else hi = m; } return lo; };
    g.span(at(bA,1e-5), at(bB,1e-5), -5, '\\approx3\\ \\text{dB}', {tex:true, color:C.ink, fs:13});
    g.vline(10*Math.log10(4), {color:C.muted, dash:'2 4', width:1.2});
    legend(g, [[C.in,'\\text{A, union bound}'],[C.mid,'\\text{B, union bound}'],[C.mid,'\\text{B, exact}','6 4']], 'bl');
    return row([B, g.svg()], 18); },
  err:'Comparing the two sets at the same pulse height instead of the same $E_b$. Set B spends two pulses on every symbol, so its $E_b$ is twice that of set A at equal height.',
  teach:'Two four-ary sets from the same pulses, compared by distance per unit of energy. Part (d) is a rare case where the exact error is easy. Set B is a square constellation lying in a plane of the four-dimensional space.' },

{ id:'D4-05', module:'M4', type:'mismatch', src:'Madhow P6.28',
  stem:'A 4-PAM receiver expects the noiseless samples $-6$, $-2$, $2$ and $6$. It decides with the fixed thresholds $-4$, $0$ and $4$. The four symbols are equally likely. The noise on the sample is Gaussian with mean $0$ and variance $1$. A faulty gain stage scales the noiseless samples by a factor $g$, so they arrive at $\\pm2g$ and $\\pm6g$. The thresholds and the noise variance do not change. The gain stage divides its input by $\\sqrt{\\hat P}$, where $\\hat P$ is its estimate of the received power $P$. According to the information given above,',
  parts:['[5 pts] For $g=0.85$, sketch the thresholds and the four noiseless samples. Give the distance from each sample to each threshold beside it.',
         '[7 pts] For $g=0.85$, find the conditional error probability of an inner and of an outer symbol, and the average symbol error probability $P_e$.',
         '[7 pts] Repeat part (b) for $g=1.15$.',
         '[6 pts] For each $g$, give the loss in decibels at high signal-to-noise ratio against thresholds at the midpoints of the scaled samples. Say which gain is worse, and whether $\\hat P$ is too large or too small.'],
  sol:'<b>Given.</b> Nominal samples $\\pm2$ and $\\pm6$, thresholds $-4$, $0$, $4$, noise standard deviation $\\sigma=1$, equal priors. First $g=0.85$, then $g=1.15$.<br>'
     +'<b>Find.</b> The distances to the thresholds, the conditional errors and $P_e$ for both gains, the loss of each in decibels, and the power error.<br>'
     +'<b>Method.</b> The thresholds stay and only the samples move. So each symbol has its own distance to each threshold beside it. In one dimension an error past one threshold is one Gaussian tail. The negative samples mirror the positive ones, so work with the two positive samples.<br>'
     +'<b>Solution — (a).</b> With $g=0.85$ the samples are $\\pm2(0.85)=\\pm1.7$ and $\\pm6(0.85)=\\pm5.1$. The inner sample $1.7$ lies between the thresholds $0$ and $4$. Its distances are $$1.7-0=1.7,\\qquad 4-1.7=2.3.$$ The outer sample $5.1$ has one threshold beside it, at distance $5.1-4=1.1$. With the correct gain every distance would be $2$. The shrink moves the outer sample towards threshold $4$ and the inner sample towards $0$.<br>'
     +'<b>Solution — (b).</b> Given $1.7$, an error is $Y<0$ or $Y>4$. The two events cannot happen together, so the intelligent union bound is exact here: $$\\begin{aligned}P(e\\mid1.7)&=Q\\!\\left(\\frac{1.7}{1}\\right)+Q\\!\\left(\\frac{2.3}{1}\\right)\\\\&=Q(1.70)+Q(2.30)\\\\&=0.04457+0.01072\\\\&=0.05529\\end{aligned}$$ Given $5.1$, an error is $Y<4$: $$P(e\\mid5.1)=Q\\!\\left(\\frac{1.1}{1}\\right)=Q(1.10)=0.1357.$$ Two of the four symbols are inner and two are outer, each with probability $\\tfrac14$: $$\\begin{aligned}P_e&=\\tfrac12(0.05529)+\\tfrac12(0.1357)\\\\&=0.02765+0.06785\\\\&=0.09550\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> With $g=1.15$ the samples are $\\pm2.3$ and $\\pm6.9$. The inner sample is $2.3$ from threshold $0$ and $4-2.3=1.7$ from threshold $4$. The outer sample is $6.9-4=2.9$ from threshold $4$. Then $$\\begin{aligned}P(e\\mid2.3)&=Q(2.30)+Q(1.70)\\\\&=0.01072+0.04457\\\\&=0.05529\\end{aligned}$$ $$P(e\\mid6.9)=Q(2.90)=0.001866.$$ Average over the four symbols: $$\\begin{aligned}P_e&=\\tfrac12(0.05529)+\\tfrac12(0.001866)\\\\&=0.02765+0.000933\\\\&=0.02858\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> Thresholds at the midpoints of the scaled samples would keep every distance at half the spacing, $2g$. At high signal-to-noise ratio the smallest distance decides $P_e$, because its $Q$ term is far larger than the others. To bring that distance back to $2g$, the amplitude must grow by their ratio, and the energy by the ratio squared. So the loss is $20\\log_{10}$ of the ratio: $$g=0.85:\\quad 20\\log_{10}\\frac{1.7}{1.1}=3.78\\ \\text{dB}$$ $$g=1.15:\\quad 20\\log_{10}\\frac{2.3}{1.7}=2.63\\ \\text{dB}$$ The low gain is worse. It pushes the outer samples towards the only threshold they have.<br>'
     +'<b>Solution — (d), power estimate.</b> The stage should divide by $\\sqrt P$. It divides by $\\sqrt{\\hat P}$, so the samples are scaled by $g=\\sqrt{P/\\hat P}$. Square both sides and solve: $\\hat P=P/g^{2}$. For $g=0.85$, $\\hat P=1.384\\,P$, too large by $10\\log_{10}1.384=1.41$ dB. For $g=1.15$, $\\hat P=0.756\\,P$, too small by $1.21$ dB. A gain below one means the stage overestimated the power.<br>'
     +'<b>Check.</b> Put $g=1$ back. Every distance is $2$, so $P(e\\mid2)=2Q(2.00)$ and $P(e\\mid6)=Q(2.00)$. Then $P_e=\\tfrac12(2)(0.02275)+\\tfrac12(0.02275)=1.5(0.02275)=0.03413$. This is the ordinary 4-PAM value $N_{\\min}Q(d_{\\min}/2\\sigma)$ with $N_{\\min}=1.5$.',
  figSol: () => {
    const comps = g => [-6,-2,2,6].map((m,k)=>({m:m*g, s:1, p:0.25, col:[C.in,C.out,C.mid,C.h][k],
      tex:'f_Y(y\\mid '+(m<0?'{-}':'')+Math.abs(m)+')'}));
    const panel = (g, name) => dens({xr:[-9.5,9.5], xstep:2, cuts:[-4,0,4], ml:[-6,-2,2,6], w:720, h:380,
      comps:comps(g), cutTex:['-4','0','4'], cutAnchor:['end','start','start'], legend:'tr', head:3.0, moreLegend:[[C.muted,'\\text{nominal sample}','2 4']],
      over:a=>a.note(-9.3, 0.4*3.0*0.84, name, {tex:true, fs:14, color:C.ink})});
    return panel(0.85, 'g=0.85') + panel(1.15, 'g=1.15'); },
  err:'Moving the thresholds with the samples. The thresholds stay at $-4$, $0$ and $4$. Only the samples move, so an inner sample has two different distances, and an outer sample at $g=0.85$ is only $1.1$ from its threshold.',
  teach:'A receiver that is slightly wrong. Ask first which sample moved towards a threshold, then compute. The dotted lines in the solution figure mark the nominal samples. The sign of the power error in part (d) is a two-line argument that students often reverse.' },

{ id:'D4-06', module:'M4', type:'binary', src:'MT Q3',
  stem:'Two equiprobable messages, "0" and "1", are sent over an additive white Gaussian noise channel with $N_0/2=0.36$ W/Hz. The waveforms are $s_0(t)=\\sin(\\pi t)$ and $s_1(t)=3\\sin(\\pi t)$ for $0\\le t\\le2$ s, drawn below. The received signal passes through a correlator-type demodulator with $T=2$ s. According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,2.2], yr:[-3.5,3.5], f:t=>t<=2?Math.sin(Math.PI*t):0, xstep:0.5, ystep:1},
    {name:'s_1(t)', xr:[0,2.2], yr:[-3.5,3.5], f:t=>t<=2?3*Math.sin(Math.PI*t):0, xstep:0.5, ystep:1}),
  parts:['[6 pts] Find $\\psi(t)$, the coordinates $s_0$ and $s_1$, and the energies $E_0$ and $E_1$.',
         '[6 pts] Determine the conditional PDFs $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[7 pts] Find the optimal decision threshold $\\lambda$ and calculate $P_b$.',
         '[6 pts] A designer builds a receiver that picks the larger of $\\int_0^T r(t)s_i(t)\\,dt$ and leaves out $-E_i/2$. Find its $P_b$.'],
  sol:'<b>Given.</b> $s_0(t)=\\sin(\\pi t)$, $s_1(t)=3\\sin(\\pi t)$ on $[0,2]$. Equal priors, $N_0/2=0.36$ W/Hz.<br>'
     +'<b>Find.</b> $\\psi(t)$, $s_0$, $s_1$, $E_0$, $E_1$, the densities, $\\lambda$, $P_b$, and $P_b$ without the energy term.<br>'
     +'<b>Method.</b> Both signals are multiples of $\\sin(\\pi t)$, so one basis function carries both. The two energies differ. So the correlation metric needs $-E_i/2$, and part (d) measures what leaving it out costs.<br>'
     +'<b>Solution — (a).</b> Use $\\sin^{2}x=\\tfrac12(1-\\cos2x)$: $$\\begin{aligned}\\int_0^2\\sin^{2}(\\pi t)\\,dt&=\\int_0^2\\frac{1-\\cos(2\\pi t)}{2}\\,dt\\\\&=\\left[\\frac t2-\\frac{\\sin(2\\pi t)}{4\\pi}\\right]_0^2\\\\&=1-0=1\\end{aligned}$$ So $\\psi(t)=\\sin(\\pi t)$ already has unit energy. Then $s_0=1$ and $s_1=3$, with $E_0=1$ and $E_1=9$.<br>'
     +'<b>Solution — (b).</b> $\\sigma^{2}=0.36$, $\\sigma=0.6$: $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{0.72\\pi}}e^{-(y-1)^{2}/0.72},\\qquad f_Y(y\\mid 1)=\\frac{1}{\\sqrt{0.72\\pi}}e^{-(y-3)^{2}/0.72}.$$<br>'
     +'<b>Solution — (c).</b> $\\lambda=(1+3)/2=2$. Decide "1" if $Y>2$. Each error needs a noise excursion of $1$: $$P_b=Q\\!\\left(\\frac{1}{0.6}\\right)\\approx Q(1.67)=0.04746.$$<br>'
     +'<b>Solution — (d).</b> The correlations are $\\int_0^T r(t)s_0(t)\\,dt=Y$ and $\\int_0^T r(t)s_1(t)\\,dt=3Y$. The receiver decides "1" when $3Y>Y$, that is when $Y>0$. So its threshold is $0$. Given "0", an error is $Y>0$: $$P(e\\mid0)=P(N>-1)=1-Q(1.67)=0.9525.$$ Given "1", an error is $Y<0$: $P(e\\mid1)=Q(3/0.6)=Q(5.00)=2.9\\times10^{-7}$. So $$P_b=\\tfrac12(0.9525)+\\tfrac12(2.9\\times10^{-7})=0.4763.$$<br>'
     +'<b>Check.</b> Put the energy term back. The metrics are $3Y-4.5$ and $Y-0.5$. Decide "1" when $3Y-4.5>Y-0.5$, that is $2Y>4$, that is $Y>2$. This is the threshold of part (c). The distance also agrees: $d^{2}=\\int_0^2 4\\sin^{2}(\\pi t)\\,dt=4$ and $\\sqrt{4/1.44}=1.667$.',
  figSol: () => dens({xr:[-1.5,5.5], xstep:1, cuts:[2], ml:[0],
    comps:[{m:1, s:0.6, p:0.5, col:C.in, tex:'f_Y(y\\mid 0)'},
           {m:3, s:0.6, p:0.5, col:C.out, tex:'f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=2'], legend:'tr', head:1.75,
    over:a=>a.note(0,0.62,'\\text{no }E_i/2',{tex:true,fs:13,color:C.muted,anchor:'end',dx:-6})}),
  err:'Leaving out $-E_i/2$ when the energies differ. The larger-energy signal then wins every positive sample, and $P_b$ rises from $0.047$ to $0.48$.',
  teach:'Part (d) makes the energy term concrete: a receiver that ignores it is almost a coin toss. The dotted line in the solution figure shows where its threshold sits.' },

{ id:'D4-07', module:'M4', type:'binary', src:'MT Q3',
  stem:'Two equiprobable messages are sent over an additive white Gaussian noise channel with $N_0/2=0.49$ W/Hz. They are transmitted by $$s_0(t)=\\sqrt2\\cos(4\\pi t),\\qquad s_1(t)=-3\\sqrt2\\cos(4\\pi t),\\qquad 0\\le t\\le1\\ \\text{s}.$$ These signals are passed through a correlator-type demodulator with $T=1$ s, drawn below. According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,1.1], yr:[-4.6,4.6], f:t=>t<=1?Math.SQRT2*Math.cos(4*Math.PI*t):0, xstep:0.25, ystep:2},
    {name:'s_1(t)', xr:[0,1.1], yr:[-4.6,4.6], f:t=>t<=1?-3*Math.SQRT2*Math.cos(4*Math.PI*t):0, xstep:0.25, ystep:2})
    + receiver('corr'),
  parts:['[7 pts] Find the unit-energy basis $\\psi(t)$ and the coordinates $s_0$ and $s_1$.',
         '[8 pts] Determine the conditional PDFs $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[10 pts] Find the optimal decision threshold $\\lambda$ and calculate the average probability of bit error $P_b$.'],
  sol:'<b>Given.</b> $s_0(t)=\\sqrt2\\cos(4\\pi t)$ and $s_1(t)=-3\\sqrt2\\cos(4\\pi t)$ on $[0,1]$. Equal priors, $N_0/2=0.49$ W/Hz.<br>'
     +'<b>Find.</b> $\\psi(t)$, $s_0$, $s_1$, the densities, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Both signals are multiples of $\\cos(4\\pi t)$. Normalise it, project, and use the midpoint threshold.<br>'
     +'<b>Solution — (a).</b> Try $\\psi(t)=\\sqrt2\\cos(4\\pi t)$. Use $\\cos^{2}x=\\tfrac12(1+\\cos2x)$: $$\\begin{aligned}\\int_0^1 2\\cos^{2}(4\\pi t)\\,dt&=\\int_0^1\\bigl(1+\\cos(8\\pi t)\\bigr)dt\\\\&=\\left[t+\\frac{\\sin(8\\pi t)}{8\\pi}\\right]_0^1\\\\&=1\\end{aligned}$$ So $\\psi(t)=\\sqrt2\\cos(4\\pi t)$ has unit energy. Then $s_0(t)=1\\cdot\\psi(t)$ and $s_1(t)=-3\\,\\psi(t)$, so $s_0=1$ and $s_1=-3$.<br>'
     +'<b>Solution — (b).</b> $\\sigma^{2}=0.49$ and $\\sigma=0.7$: $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{0.98\\pi}}e^{-(y-1)^{2}/0.98},\\qquad f_Y(y\\mid 1)=\\frac{1}{\\sqrt{0.98\\pi}}e^{-(y+3)^{2}/0.98}.$$<br>'
     +'<b>Solution — (c).</b> $\\lambda=(1+(-3))/2=-1$. Since $s_0>s_1$, decide "0" if $Y>-1$. Each error needs a noise excursion of $2$: $$P_b=Q\\!\\left(\\frac{2}{0.7}\\right)=Q(2.857)\\approx Q(2.86)=0.002118.$$<br>'
     +'<b>Check.</b> From the waveforms: $s_0(t)-s_1(t)=4\\sqrt2\\cos(4\\pi t)$, so $d^{2}=16\\int_0^1 2\\cos^{2}(4\\pi t)\\,dt=16$. With $N_0=0.98$, $\\sqrt{16/1.96}=2.857$, the same argument.',
  figSol: () => dens({xr:[-6,4], xstep:1, cuts:[-1],
    comps:[{m:-3, s:0.7, p:0.5, col:C.out, tex:'f_Y(y\\mid 1)'},
           {m:1, s:0.7, p:0.5, col:C.in, tex:'f_Y(y\\mid 0)'}],
    cutTex:['\\lambda=-1'], legend:'tr', head:1.75}),
  err:'Taking the peak amplitudes $\\sqrt2$ and $-3\\sqrt2$ as the coordinates. The basis function already carries the $\\sqrt2$, so the coordinates are $1$ and $-3$.',
  teach:'A carrier pulse in the midterm shape. The integer number of cycles in $[0,1]$ is what makes the $\\cos(8\\pi t)$ term integrate to zero.' },

{ id:'D4-08', module:'M4', type:'binary', src:'MT Q3',
  stem:'In an additive white Gaussian noise channel with $N_0/2=4$ W/Hz, "0" and "1" bits occur with probabilities $0.6$ and $0.4$. They are transmitted by the waveforms $s_0(t)$ and $s_1(t)$ drawn below. These signals are passed through the following matched-filter type demodulator, sampled at $t=T=3$ s. According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,3.4], yr:[-3,5], pts:[[0,0],[0,4],[3,0],[3.4,0]], ystep:2},
    {name:'s_1(t)', xr:[0,3.4], yr:[-3,5], pts:[[0,0],[0,-2],[3,0],[3.4,0]], ystep:2})
    + receiver('mf'),
  parts:['[5 pts] Plot the impulse response of the matched filter, $h(t)=\\psi(T-t)$.',
         '[8 pts] Determine the conditional PDFs $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[12 pts] Find the optimal decision threshold $\\lambda$ and calculate the average probability of bit error $P_b$.'],
  sol:'<b>Given.</b> $s_0(t)=\\tfrac43(3-t)$ and $s_1(t)=-\\tfrac23(3-t)$ for $0\\le t\\le3$. $P_0=0.6$, $P_1=0.4$, $N_0/2=4$ W/Hz.<br>'
     +'<b>Find.</b> $h(t)$, the densities, the MAP threshold $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> Both ramps are multiples of $p(t)=3-t$. The priors differ, so the optimal threshold is the MAP threshold, not the midpoint.<br>'
     +'<b>Solution — (a).</b> The energy of $p(t)$ needs the substitution $u=3-t$, $du=-dt$. The limits $t=0$ and $t=3$ become $u=3$ and $u=0$: $$E_p=\\int_0^3(3-t)^{2}dt=\\int_0^3u^{2}\\,du=\\left[\\frac{u^{3}}{3}\\right]_0^3=9.$$ So $\\psi(t)=(3-t)/3$, and $$h(t)=\\psi(3-t)=\\frac{3-(3-t)}{3}=\\frac t3,\\qquad 0\\le t\\le3.$$ It rises in a straight line from $0$ to $1$.<br>'
     +'<b>Solution — (b).</b> The coordinates are $$s_0=\\frac43\\cdot\\frac13\\int_0^3(3-t)^{2}dt=\\frac49(9)=4,\\qquad s_1=-\\frac23\\cdot\\frac13(9)=-2.$$ With $\\sigma^{2}=4$: $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{8\\pi}}e^{-(y-4)^{2}/8},\\qquad f_Y(y\\mid 1)=\\frac{1}{\\sqrt{8\\pi}}e^{-(y+2)^{2}/8}.$$<br>'
     +'<b>Solution — (c).</b> Decide "0" when $0.6\\,f_Y(y\\mid0)>0.4\\,f_Y(y\\mid1)$. Take logarithms: $$\\ln0.6-\\frac{(y-4)^{2}}{8}>\\ln0.4-\\frac{(y+2)^{2}}{8}.$$ Expand the squares: $(y+2)^{2}-(y-4)^{2}=12y-12$. So $$\\frac{12y-12}{8}>\\ln\\frac{0.4}{0.6}=-0.4055.$$ Multiply by $8/12$, which is positive: $y-1>-0.2703$, so $$\\lambda=0.7297.$$ Decide "0" if $Y>0.7297$. The two conditional errors are $$\\begin{aligned}P(e\\mid0)&=Q\\!\\left(\\frac{4-0.7297}{2}\\right)\\approx Q(1.64)=0.05050\\\\P(e\\mid1)&=Q\\!\\left(\\frac{0.7297+2}{2}\\right)\\approx Q(1.36)=0.08691\\end{aligned}$$ Weight by the priors: $$\\begin{aligned}P_b&=0.6(0.05050)+0.4(0.08691)\\\\&=0.03030+0.03476\\\\&=0.06506\\end{aligned}$$<br>'
     +'<b>Check.</b> The ML threshold $1$ gives $P_b=Q(3/2)=Q(1.50)=0.06681$. The MAP value $0.06506$ is lower, as it must be, because MAP minimises $P_b$.',
  figSol: () => hPair({xr:[0,3.4], yr:[-0.2,1.3], ystep:0.5, T:3, pts:[[0,0],[0,1],[3,0],[3.4,0]]})
     + dens({xr:[-9,11], xstep:2, cuts:[0.7297], weighted:true,
       comps:[{m:-2, s:2, p:0.4, col:C.out, tex:'0.4\\,f_Y(y\\mid 1)'},
              {m:4, s:2, p:0.6, col:C.in, tex:'0.6\\,f_Y(y\\mid 0)'}],
       cutTex:['\\lambda=0.730'], legend:'tl', head:1.8}),
  err:'Moving $\\lambda$ towards the more likely mean $s_0=4$. The MAP threshold moves away from it, from $1$ down to $0.730$, which enlarges the region of "0".',
  teach:'The midterm shape with the priors of the final. Solving the inequality one step at a time is where marks are lost, so insist on the expansion of the squares.' },

{ id:'D4-09', module:'M4', type:'binary', src:'MT Q3 (variant)',
  stem:'Two equiprobable messages are sent over an additive white Gaussian noise channel with $N_0/2=0.2$ W/Hz. The waveforms are $s_0(t)=2$ for $0\\le t<2$, and $s_1(t)=2$ for $0\\le t<1$ and $s_1(t)=0$ for $1\\le t<2$. They are drawn below, with $T=2$ s. The receiver uses two correlators, with the basis functions of part (a). According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,2.4], yr:[-1,3], pts:[[0,0],[0,2],[2,2],[2,0],[2.4,0]], xstep:0.5, ystep:1},
    {name:'s_1(t)', xr:[0,2.4], yr:[-1,3], pts:[[0,0],[0,2],[1,2],[1,0],[2.4,0]], xstep:0.5, ystep:1}),
  parts:['[7 pts] Apply Gram–Schmidt, starting from $s_1(t)$, to find $\\psi_1(t)$, $\\psi_2(t)$ and the vectors $\\mathbf{s}_0$ and $\\mathbf{s}_1$.',
         '[6 pts] Find the ML decision rule and draw the decision regions.',
         '[6 pts] Calculate the average probability of bit error $P_b$.',
         '[6 pts] Show that one correlator with $s_0(t)-s_1(t)$ makes the same decisions, and give its threshold.'],
  sol:'<b>Given.</b> $s_0(t)=2$ on $[0,2)$, $s_1(t)=2$ on $[0,1)$ and $0$ on $[1,2)$. Equal priors, $N_0/2=0.2$ W/Hz.<br>'
     +'<b>Find.</b> The basis and vectors, the ML regions, $P_b$, and the single-correlator threshold.<br>'
     +'<b>Method.</b> The signals are not multiples of one pulse, so Gram–Schmidt gives two basis functions. The ML rule is minimum distance, and $P_b$ depends only on the distance between the points.<br>'
     +'<b>Solution — (a).</b> Start from $s_1$: $E_1=\\int_0^1 2^{2}\\,dt=4$, so $\\psi_1(t)=s_1(t)/2=1$ on $[0,1)$. Project $s_0$ on it: $s_{01}=\\int_0^1 2\\cdot1\\,dt=2$. Remove that part: $$g(t)=s_0(t)-2\\psi_1(t)=\\begin{cases}0,&0\\le t<1\\\\2,&1\\le t<2\\end{cases}$$ Its energy is $\\int_1^2 4\\,dt=4$, so $\\psi_2(t)=g(t)/2=1$ on $[1,2)$, and $s_{02}=2$. The vectors are $$\\mathbf{s}_0=(2,\\,2),\\qquad\\mathbf{s}_1=(2,\\,0).$$<br>'
     +'<b>Solution — (b).</b> Decide "0" when $\\mathbf{y}$ is closer to $\\mathbf{s}_0$: $$\\begin{aligned}(y_1-2)^{2}+(y_2-2)^{2}&<(y_1-2)^{2}+y_2^{2}\\\\-4y_2+4&<0\\\\y_2&>1\\end{aligned}$$ The boundary is the horizontal line $y_2=1$. $Y_1$ plays no part, because both signals have the same first coordinate.<br>'
     +'<b>Solution — (c).</b> $d=\\|\\mathbf{s}_0-\\mathbf{s}_1\\|=\\sqrt{0^{2}+2^{2}}=2$ and $\\sigma=\\sqrt{0.2}=0.4472$. So $$P_b=Q\\!\\left(\\frac{d/2}{\\sigma}\\right)=Q\\!\\left(\\frac{1}{0.4472}\\right)=Q(2.236)\\approx Q(2.24)=0.01255.$$<br>'
     +'<b>Solution — (d).</b> The difference is $s_0(t)-s_1(t)=2$ on $[1,2)$, which is $2\\psi_2(t)$. So the correlator output is $Z=\\int_0^2 r(t)\\bigl(s_0(t)-s_1(t)\\bigr)dt=2Y_2$. The rule $Y_2>1$ becomes $Z>2$. The threshold $2$ is also $(E_0-E_1)/2=(8-4)/2$, the energy term of the correlation metric.<br>'
     +'<b>Check.</b> In time, $d^{2}=\\int_0^2\\bigl(s_0(t)-s_1(t)\\bigr)^{2}dt=\\int_1^2 4\\,dt=4$. With $N_0=0.4$, $\\sqrt{d^{2}/2N_0}=\\sqrt{4/0.8}=\\sqrt5=2.236$, the same argument.',
  figSol: () => cons({xr:[-0.5,4], yr:[-1.5,3.5], w:520, h:440, xstep:1, ystep:1,
    pts:[{x:2,y:2,tex:'\\mathbf{s}_0'},{x:2,y:0,tex:'\\mathbf{s}_1'}],
    dmin:[0,1], dminAt:[2.12,0.62], dminAnchor:'start', hideX:[2], hideY:[1,2],
    over:a=>{ a.note(2.6,1.15,'y_2=1',{tex:true,fs:14,color:C.ink}); }}),
  err:'Using $\\|\\mathbf{s}_0\\|-\\|\\mathbf{s}_1\\|=2\\sqrt2-2=0.83$ as the distance. The error depends on the distance between the two points, $\\|\\mathbf{s}_0-\\mathbf{s}_1\\|=2$, not on the difference of their lengths.',
  teach:'A variant of the midterm shape where Gram–Schmidt is needed. Part (d) shows that a binary receiver needs only one correlator, matched to the difference.' },

{ id:'D4-10', module:'M4', type:'binary', src:'MT Q3',
  stem:'In an additive white Gaussian noise channel with noise power spectral density $N_0/2=9$ W/Hz, two equiprobable messages are sent by the waveforms drawn below. These signals are passed through the following matched-filter type demodulator, sampled at $t=T=4$ s. According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,4.5], yr:[-3,3], pts:[[0,0],[0,1],[2,1],[2,-1],[4,-1],[4,0],[4.5,0]], ystep:1},
    {name:'s_1(t)', xr:[0,4.5], yr:[-3,3], pts:[[0,0],[0,-2],[2,-2],[2,2],[4,2],[4,0],[4.5,0]], ystep:1})
    + receiver('mf'),
  parts:['[5 pts] Plot the impulse response of the matched filter, $h(t)=\\psi(T-t)$.',
         '[10 pts] Determine the conditional PDFs $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[10 pts] Find the optimal decision threshold $\\lambda$ and calculate the average probability of bit error $P_b$.'],
  sol:'<b>Given.</b> $s_0(t)=1$ on $[0,2)$ and $-1$ on $[2,4)$. $s_1(t)=-2s_0(t)$. Equal priors, $N_0/2=9$ W/Hz, $T=4$ s.<br>'
     +'<b>Find.</b> $h(t)$, the densities, $\\lambda$ and $P_b$.<br>'
     +'<b>Method.</b> $s_1$ is a multiple of $s_0$, so $\\psi(t)$ is $s_0$ normalised. The matched filter reverses $\\psi$ in time.<br>'
     +'<b>Solution — (a).</b> $E_0=\\int_0^4 1^{2}\\,dt=4$, so $\\psi(t)=s_0(t)/2$: $\\tfrac12$ on $[0,2)$ and $-\\tfrac12$ on $[2,4)$. For $0\\le t<2$ the argument $4-t$ lies in $(2,4]$, where $\\psi=-\\tfrac12$. For $2\\le t<4$ it lies in $(0,2]$, where $\\psi=\\tfrac12$. So $$h(t)=\\psi(4-t)=\\begin{cases}-\\tfrac12,&0\\le t<2\\\\\\;\\;\\tfrac12,&2\\le t<4\\end{cases}$$<br>'
     +'<b>Solution — (b).</b> $s_0=\\int_0^4 s_0(t)\\psi(t)\\,dt=E_0/2=2$ and $s_1=-2s_0=-4$. With $\\sigma^{2}=9$: $$f_Y(y\\mid 0)=\\frac{1}{\\sqrt{18\\pi}}e^{-(y-2)^{2}/18},\\qquad f_Y(y\\mid 1)=\\frac{1}{\\sqrt{18\\pi}}e^{-(y+4)^{2}/18}.$$<br>'
     +'<b>Solution — (c).</b> $\\lambda=(2+(-4))/2=-1$. Decide "0" if $Y>-1$. Each error needs a noise excursion of $3$, and $\\sigma=3$: $$P_b=Q\\!\\left(\\frac{3}{3}\\right)=Q(1.00)=0.1587.$$<br>'
     +'<b>Check.</b> $s_0(t)-s_1(t)=3s_0(t)$, so $d^{2}=9E_0=36$. With $N_0=18$, $\\sqrt{36/36}=1.00$, the same argument.',
  figSol: () => hPair({xr:[0,4.5], yr:[-0.8,0.8], ystep:0.5, T:4, pts:[[0,0],[0,0.5],[2,0.5],[2,-0.5],[4,-0.5],[4,0],[4.5,0]]})
     + dens({xr:[-14,12], xstep:4, cuts:[-1],
       comps:[{m:-4, s:3, p:0.5, col:C.out, tex:'f_Y(y\\mid 1)'},
              {m:2, s:3, p:0.5, col:C.in, tex:'f_Y(y\\mid 0)'}],
       cutTex:['\\lambda=-1'], legend:'tr', head:1.8}),
  err:'Plotting $h(t)=\\psi(t)$. The matched filter is the basis reversed in time, so its negative half comes first.',
  teach:'The error probability here is large, $0.16$, because $d/2$ equals one noise standard deviation. Ask what $N_0/2$ would give $Q(3.00)$: nine times less, $1$ W/Hz.' },

{ id:'D4-11', module:'M4', type:'binary', src:'MT Q3 (variant)',
  stem:'A binary link uses $s_1(t)=2$ and $s_0(t)=-2$ for $0\\le t<2$ s, with equal priors. The noise is white and Gaussian with an unknown two-sided power spectral density $N_0/2$. The receiver is the optimal correlator receiver with $T=2$ s. The link must reach $P_b\\le1.0\\times10^{-3}$. A $Q$ table gives $Q(3.09)=1.001\\times10^{-3}$ and $Q(3.10)=0.968\\times10^{-3}$. According to the information given above,',
  figure: () => waves(
    {name:'s_0(t)', xr:[0,2.4], yr:[-3,3], pts:[[0,0],[0,-2],[2,-2],[2,0],[2.4,0]], xstep:0.5, ystep:1},
    {name:'s_1(t)', xr:[0,2.4], yr:[-3,3], pts:[[0,0],[0,2],[2,2],[2,0],[2.4,0]], xstep:0.5, ystep:1}),
  parts:['[8 pts] Find the coordinates $s_0$ and $s_1$, and write $P_b$ as a function of $N_0/2$.',
         '[9 pts] Find the largest $N_0/2$ that meets the requirement.',
         '[8 pts] The link is changed to on-off signalling, $s_0(t)=0$ and $s_1(t)=A$ on $[0,2)$, with the same average energy per bit. Find $A$, the largest $N_0/2$ now, and the loss in decibels.'],
  sol:'<b>Given.</b> Antipodal rectangular pulses of height $2$ on $[0,2)$. Equal priors, $P_b\\le1.0\\times10^{-3}$.<br>'
     +'<b>Find.</b> $s_0$, $s_1$, $P_b(N_0/2)$, the largest $N_0/2$, and the same for on-off signalling.<br>'
     +'<b>Method.</b> Write $P_b=Q\\bigl((d/2)/\\sigma\\bigr)$. $Q$ is decreasing, so $P_b\\le10^{-3}$ holds when the argument is at least the value $x$ with $Q(x)=10^{-3}$. Solve that for $\\sigma$.<br>'
     +'<b>Solution — (a).</b> $E=\\int_0^2 2^{2}\\,dt=8$, so $\\psi(t)=1/\\sqrt2$ on $[0,2)$. Then $s_1=\\sqrt8=2\\sqrt2=2.828$ and $s_0=-2.828$. The threshold is $0$, so $d/2=2.828$ and $$P_b=Q\\!\\left(\\frac{2.828}{\\sigma}\\right),\\qquad\\sigma=\\sqrt{N_0/2}.$$<br>'
     +'<b>Solution — (b).</b> The table puts $Q(x)=1.0\\times10^{-3}$ at $x=3.09$. So the requirement is $2.828/\\sigma\\ge3.09$. Solve for $\\sigma$: $$\\sigma\\le\\frac{2.828}{3.09}=0.9153.$$ Square both sides, which are positive: $$\\frac{N_0}{2}=\\sigma^{2}\\le0.8378\\ \\text{W/Hz}.$$<br>'
     +'<b>Solution — (c).</b> The average energy per bit of on-off keying is $\\tfrac12(A^{2}\\cdot2)+\\tfrac12(0)=A^{2}$. Set it equal to $8$: $A=2\\sqrt2=2.828$. The coordinates are $s_0=0$ and $s_1=A\\sqrt2=4$, so $d/2=2$. The requirement is $2/\\sigma\\ge3.09$: $$\\sigma\\le\\frac{2}{3.09}=0.6472,\\qquad\\frac{N_0}{2}\\le0.4189\\ \\text{W/Hz}.$$ The tolerable noise is halved: $10\\log_{10}(0.8378/0.4189)=3.01$ dB.<br>'
     +'<b>Check.</b> The ratio follows from the squared distances alone. Antipodal gives $d^{2}=(2\\cdot2.828)^{2}=32$, on-off gives $d^{2}=16$. Half the $d^{2}$ at the same argument means half the noise variance.',
  figSol: () => dens({xr:[-6,6], xstep:2, cuts:[0], w:620, h:260,
       comps:[{m:-2.828, s:0.9153, p:0.5, col:C.in, tex:'f_Y(y\\mid 0)'},
              {m:2.828, s:0.9153, p:0.5, col:C.out, tex:'f_Y(y\\mid 1)'}],
       cutTex:['\\lambda=0'], legend:'tr', head:1.8,
       over:a=>a.note(-5.8,0.66,'\\text{antipodal},\\ N_0/2=0.838',{tex:true,fs:13,color:C.ink})})
     + dens({xr:[-3,7], xstep:1, cuts:[2], w:620, h:260,
       comps:[{m:0, s:0.6472, p:0.5, col:C.in, tex:'f_Y(y\\mid 0)'},
              {m:4, s:0.6472, p:0.5, col:C.out, tex:'f_Y(y\\mid 1)'}],
       cutTex:['\\lambda=2'], legend:'tr', head:1.8,
       over:a=>a.note(-2.85,0.95,'\\text{on-off},\\ N_0/2=0.419',{tex:true,fs:13,color:C.ink})}),
  err:'Keeping the peak amplitude $2$ for on-off signalling. The comparison is fair only at equal average energy, which needs $A=2\\sqrt2$.',
  teach:'A reversed question: the error probability is given and the noise is asked for. The two solution panels have the same error area, which is the point of the answer.' },

/* ---- priors: binary PAM with unequal priors ---------------------------- */

{ id:'D4-12', module:'M4', type:'priors', src:'Final Q2',
  stem:'Assume that in a binary pulse amplitude modulation (PAM) communication system, "0" and "1" bits occur with probabilities $0.4$ and $0.6$. At the output of the matched filter the sample is $$Y=\\begin{cases}2+N, & \\text{if "1" is sent}\\\\-2+N, & \\text{if "0" is sent}\\end{cases}.$$ Here $N$ is a Gaussian random variable with mean $0$ and variance $2.25$. According to this information,',
  parts:['[8 pts] Determine the conditional PDFs $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[8 pts] Find the optimal decision threshold $\\lambda$.',
         '[9 pts] Calculate the average probability of bit error $P_b$ as a number. Use a $Q$-function table.'],
  sol:'<b>Given.</b> Means $\\pm2$, variance $\\sigma^{2}=2.25$ ($\\sigma=1.5$), $P_0=0.4$, $P_1=0.6$.<br>'
     +'<b>Find.</b> The two densities, the MAP threshold and $P_b$.<br>'
     +'<b>Method.</b> The optimal rule is MAP: decide the bit with the larger $P_i\\,f_Y(y\\mid i)$. Solve the equality for $y$, then add the two weighted tails.<br>'
     +'<b>Solution — (a).</b> Each density is Gaussian with variance $2.25$, so $2\\sigma^{2}=4.5$: $$f_Y(y\\mid 1)=\\frac{1}{\\sqrt{4.5\\pi}}e^{-(y-2)^{2}/4.5},\\qquad f_Y(y\\mid 0)=\\frac{1}{\\sqrt{4.5\\pi}}e^{-(y+2)^{2}/4.5}.$$<br>'
     +'<b>Solution — (b).</b> Decide "1" when $0.6\\,f_Y(y\\mid1)>0.4\\,f_Y(y\\mid0)$. Take logarithms: $$\\ln0.6-\\frac{(y-2)^{2}}{4.5}>\\ln0.4-\\frac{(y+2)^{2}}{4.5}.$$ Since $(y+2)^{2}-(y-2)^{2}=8y$: $$\\frac{8y}{4.5}>\\ln\\frac{0.4}{0.6}=-0.4055.$$ Multiply by $4.5/8$, which is positive: $$y>\\lambda=-0.2281.$$<br>'
     +'<b>Solution — (c).</b> Given "0", an error is $Y>\\lambda$. Given "1", it is $Y<\\lambda$: $$\\begin{aligned}P(e\\mid0)&=Q\\!\\left(\\frac{-0.2281+2}{1.5}\\right)\\approx Q(1.18)=0.1190\\\\P(e\\mid1)&=Q\\!\\left(\\frac{2+0.2281}{1.5}\\right)\\approx Q(1.49)=0.06811\\end{aligned}$$ Weight by the priors: $$\\begin{aligned}P_b&=0.4(0.1190)+0.6(0.06811)\\\\&=0.04760+0.04087\\\\&=0.08847\\end{aligned}$$<br>'
     +'<b>Check.</b> The midpoint threshold $0$ ignores the priors. It gives $P_b=Q(2/1.5)\\approx Q(1.33)=0.09176$. The MAP value $0.08847$ is lower, as it must be.',
  figSol: () => dens({xr:[-7,7], xstep:1, cuts:[-0.2281], ml:[0], weighted:true,
    comps:[{m:-2, s:1.5, p:0.4, col:C.in, tex:'0.4\\,f_Y(y\\mid 0)'},
           {m:2, s:1.5, p:0.6, col:C.out, tex:'0.6\\,f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=-0.228'], cutAnchor:['end'], legend:'tl', head:1.9}),
  err:'Using the midpoint $\\lambda=0$ with unequal priors. That is the ML threshold, and it gives $P_b=0.0918$ instead of $0.0885$.',
  teach:'This is the examination shape. The figure shows the weighted densities, so the threshold sits exactly where the two drawn curves cross.' },

{ id:'D4-13', module:'M4', type:'priors', src:'Final Q2',
  stem:'Assume that in a binary PAM communication system, "0" and "1" bits occur with probabilities $0.6$ and $0.4$. Consider a signal detector with the input $$Y=\\begin{cases}5+N, & \\text{if "1" is sent}\\\\ N, & \\text{if "0" is sent}\\end{cases}.$$ Here $N$ is a Gaussian random variable with mean $0$ and variance $4$. According to this information,',
  parts:['[8 pts] Find the optimal decision threshold $\\lambda$.',
         '[10 pts] Calculate the average probability of bit error $P_b$ as a number. Use a $Q$-function table.',
         '[7 pts] A simpler detector uses the midpoint $2.5$ as its threshold. Calculate its $P_b$ and compare.'],
  sol:'<b>Given.</b> Means $0$ and $5$, $\\sigma^{2}=4$ ($\\sigma=2$), $P_0=0.6$, $P_1=0.4$.<br>'
     +'<b>Find.</b> The MAP threshold, its $P_b$, and $P_b$ at the midpoint.<br>'
     +'<b>Method.</b> Set $P_0f_Y(y\\mid0)=P_1f_Y(y\\mid1)$ and solve for $y$. Then add the two weighted Gaussian tails.<br>'
     +'<b>Solution — (a).</b> Decide "1" when $0.4\\,f_Y(y\\mid1)>0.6\\,f_Y(y\\mid0)$. Take logarithms: $$\\ln0.4-\\frac{(y-5)^{2}}{8}>\\ln0.6-\\frac{y^{2}}{8}.$$ Since $y^{2}-(y-5)^{2}=10y-25$: $$\\frac{10y-25}{8}>\\ln\\frac{0.6}{0.4}=0.4055.$$ Multiply by $8$ and add $25$: $10y>28.244$, so $$\\lambda=2.8244.$$ The threshold moves from the midpoint towards the less likely mean $5$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P(e\\mid0)&=Q\\!\\left(\\frac{2.8244-0}{2}\\right)\\approx Q(1.41)=0.07927\\\\P(e\\mid1)&=Q\\!\\left(\\frac{5-2.8244}{2}\\right)\\approx Q(1.09)=0.1379\\end{aligned}$$ $$\\begin{aligned}P_b&=0.6(0.07927)+0.4(0.1379)\\\\&=0.04756+0.05514\\\\&=0.1027\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> At $\\lambda=2.5$ both errors need a noise excursion of $2.5$: $P(e\\mid0)=P(e\\mid1)=Q(1.25)=0.1056$. So $P_b=0.1056$. The MAP detector saves $0.0029$, about $3\\%$.<br>'
     +'<b>Check.</b> At $\\lambda=2.8244$ the weighted densities must be equal. The common factor $1/\\sqrt{8\\pi}$ cancels. $0.6\\,e^{-2.8244^{2}/8}=0.6(0.3689)=0.2213$ and $0.4\\,e^{-2.1756^{2}/8}=0.4(0.5533)=0.2213$. They agree.',
  figSol: () => dens({xr:[-6,11], xstep:2, cuts:[2.8244], ml:[2.5], weighted:true,
    comps:[{m:0, s:2, p:0.6, col:C.in, tex:'0.6\\,f_Y(y\\mid 0)'},
           {m:5, s:2, p:0.4, col:C.out, tex:'0.4\\,f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=2.824'], legend:'tr', head:1.9}),
  err:'Writing $\\ln(P_1/P_0)$ in place of $\\ln(P_0/P_1)$. The threshold then lands at $2.18$, on the wrong side of the midpoint, and $P_b$ rises to $0.115$.',
  teach:'The on-off form of the examination question. Part (c) shows that the MAP gain is real but small at these priors.' },

{ id:'D4-14', module:'M4', type:'priors', src:'Final Q2',
  stem:'In a binary PAM system the matched-filter output is $Y=1+N$ when "1" is sent and $Y=-2+N$ when "0" is sent. $N$ is Gaussian with mean $0$ and variance $1$. The bits "0" and "1" occur with probabilities $0.75$ and $0.25$. According to this information,',
  parts:['[6 pts] Determine the conditional PDFs $f_Y(y\\mid 1)$ and $f_Y(y\\mid 0)$.',
         '[6 pts] Find the ML threshold and the $P_b$ of a detector that uses it.',
         '[7 pts] Find the optimal (MAP) decision threshold $\\lambda$.',
         '[6 pts] Calculate $P_b$ of the MAP detector as a number, and compare.'],
  sol:'<b>Given.</b> Means $m_0=-2$ and $m_1=1$, $\\sigma=1$, $P_0=0.75$, $P_1=0.25$.<br>'
     +'<b>Find.</b> The densities, the ML threshold and its $P_b$, the MAP threshold and its $P_b$.<br>'
     +'<b>Method.</b> The ML threshold is the midpoint of the means. The MAP threshold shifts it by $\\frac{\\sigma^{2}}{m_1-m_0}\\ln\\frac{P_0}{P_1}$.<br>'
     +'<b>Solution — (a).</b> $$f_Y(y\\mid 1)=\\frac{1}{\\sqrt{2\\pi}}e^{-(y-1)^{2}/2},\\qquad f_Y(y\\mid 0)=\\frac{1}{\\sqrt{2\\pi}}e^{-(y+2)^{2}/2}.$$<br>'
     +'<b>Solution — (b).</b> $\\lambda_{\\text{ML}}=(-2+1)/2=-0.5$. Both errors need a noise excursion of $1.5$, so $$P_b=0.75\\,Q(1.50)+0.25\\,Q(1.50)=Q(1.50)=0.06681.$$<br>'
     +'<b>Solution — (c).</b> Decide "1" when $0.25\\,f_Y(y\\mid1)>0.75\\,f_Y(y\\mid0)$. Take logarithms: $$-\\frac{(y-1)^{2}}{2}+\\frac{(y+2)^{2}}{2}>\\ln\\frac{0.75}{0.25}=\\ln3.$$ Since $(y+2)^{2}-(y-1)^{2}=6y+3$, this is $3y+1.5>1.0986$. So $$y>\\lambda=\\frac{1.0986-1.5}{3}=-0.1338.$$<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}P(e\\mid0)&=Q\\!\\left(\\frac{-0.1338+2}{1}\\right)\\approx Q(1.87)=0.03074\\\\P(e\\mid1)&=Q\\!\\left(\\frac{1+0.1338}{1}\\right)\\approx Q(1.13)=0.1292\\end{aligned}$$ $$\\begin{aligned}P_b&=0.75(0.03074)+0.25(0.1292)\\\\&=0.02306+0.03231\\\\&=0.05537\\end{aligned}$$ The MAP detector is about $17\\%$ better than the ML detector.<br>'
     +'<b>Check.</b> The general formula gives the same threshold: $-0.5+\\frac{1}{3}\\ln3=-0.5+0.3662=-0.1338$. The shift is positive, towards the less likely mean $1$.',
  figSol: () => dens({xr:[-5.5,4.5], xstep:1, cuts:[-0.1338], weighted:true,
    comps:[{m:-2, s:1, p:0.75, col:C.in, tex:'0.75\\,f_Y(y\\mid 0)'},
           {m:1, s:1, p:0.25, col:C.out, tex:'0.25\\,f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=-0.134'], legend:'tr', head:1.7}),
  err:'Placing the ML threshold at $0$ because the noise has zero mean. The ML threshold is the midpoint of the two means, $-0.5$, not zero.',
  teach:'Means that are not symmetric about zero are a common trap in this shape. Ask the class for the ML threshold first, then the shift.' },

{ id:'D4-15', module:'M4', type:'priors', src:'Final Q2',
  stem:'Bits are sent by antipodal signalling with energy $E_b=2.25$ J per bit. The two signal points are $s_0=-\\sqrt{E_b}$ and $s_1=+\\sqrt{E_b}$ on one basis function. The noise is white and Gaussian with $N_0=0.5$ W/Hz. The bit "0" occurs with probability $0.8$ and "1" with probability $0.2$. According to this information,',
  parts:['[6 pts] Find the distance $d$ between the two points and the $P_b$ of the ML detector.',
         '[7 pts] Find the MAP boundary: its distance $\\mu$ from $s_0$, and the threshold $\\lambda$.',
         '[7 pts] Calculate the conditional error probabilities $P(e\\mid 0)$ and $P(e\\mid 1)$ of the MAP detector.',
         '[5 pts] Calculate $P_b$ of the MAP detector and compare it with part (a).'],
  sol:'<b>Given.</b> $s_0=-1.5$, $s_1=1.5$, $N_0=0.5$, so $\\sigma^{2}=N_0/2=0.25$ and $\\sigma=0.5$. $P_0=0.8$, $P_1=0.2$.<br>'
     +'<b>Find.</b> $d$, the ML $P_b$, $\\mu$, $\\lambda$, the two conditional errors and the MAP $P_b$.<br>'
     +'<b>Method.</b> The MAP boundary sits at $\\mu=\\frac d2+\\frac{N_0}{2d}\\ln\\frac{P_0}{P_1}$ from $s_0$. Each conditional error is the tail beyond the boundary.<br>'
     +'<b>Solution — (a).</b> $d=1.5-(-1.5)=3$. The ML detector has $$P_b=Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)=Q\\!\\left(\\sqrt{\\frac{9}{1}}\\right)=Q(3.00)=1.350\\times10^{-3}.$$<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}\\mu&=\\frac32+\\frac{0.5}{6}\\ln\\frac{0.8}{0.2}\\\\&=1.5+0.08333(1.3863)\\\\&=1.6155\\end{aligned}$$ Measured from $s_0=-1.5$, the threshold is $\\lambda=-1.5+1.6155=0.1155$. Decide "1" if $Y>0.1155$.<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}P(e\\mid0)&=Q\\!\\left(\\frac{\\mu}{\\sigma}\\right)=Q\\!\\left(\\frac{1.6155}{0.5}\\right)\\approx Q(3.23)=6.190\\times10^{-4}\\\\P(e\\mid1)&=Q\\!\\left(\\frac{d-\\mu}{\\sigma}\\right)=Q\\!\\left(\\frac{1.3845}{0.5}\\right)\\approx Q(2.77)=2.803\\times10^{-3}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}P_b&=0.8(6.190\\times10^{-4})+0.2(2.803\\times10^{-3})\\\\&=4.952\\times10^{-4}+5.606\\times10^{-4}\\\\&=1.056\\times10^{-3}\\end{aligned}$$ This is about $22\\%$ below the ML value $1.350\\times10^{-3}$.<br>'
     +'<b>Check.</b> Solve the MAP rule directly: decide "1" when $(y-1.5)^{2}-N_0\\ln0.2<(y+1.5)^{2}-N_0\\ln0.8$. This is $-6y<0.5\\ln(0.2/0.8)=-0.6931$, so $y>0.1155$. The same threshold.',
  figSol: () => dens({xr:[-3.5,3.5], xstep:1, cuts:[0.1155], ml:[0], weighted:true,
    comps:[{m:-1.5, s:0.5, p:0.8, col:C.in, tex:'0.8\\,f_Y(y\\mid 0)'},
           {m:1.5, s:0.5, p:0.2, col:C.out, tex:'0.2\\,f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=0.116'], legend:'tr', head:1.35}),
  err:'Moving the boundary towards the more likely point $s_0$. The boundary moves away from it, so $\\lambda$ is positive and the region of "0" grows.',
  teach:'This is the module\'s own form of the final\'s question: the boundary position $\\mu$ measured along the line joining the points.' },

{ id:'D4-16', module:'M4', type:'priors', src:'Final Q2 (variant)',
  stem:'A three-level PAM system sends $Y=s+N$ with $s\\in\\{-2,\\,0,\\,2\\}$. The priors are $P(-2)=P(2)=0.25$ and $P(0)=0.5$. $N$ is Gaussian with mean $0$ and variance $0.5$. According to this information,',
  parts:['[6 pts] Write the three conditional PDFs $f_Y(y\\mid s)$.',
         '[7 pts] Find the two optimal (MAP) thresholds $\\lambda_1<\\lambda_2$.',
         '[7 pts] Calculate the average symbol error probability $P_e$ as a number.',
         '[5 pts] Calculate $P_e$ of the ML detector, with thresholds $\\pm1$, and compare.'],
  sol:'<b>Given.</b> Three levels $-2,0,2$ with priors $0.25,0.5,0.25$. $\\sigma^{2}=0.5$, $\\sigma=0.7071$.<br>'
     +'<b>Find.</b> The densities, the MAP thresholds, $P_e$ for MAP and for ML.<br>'
     +'<b>Method.</b> A threshold separates two neighbouring levels only. Apply the binary MAP rule to each neighbouring pair. Symmetry gives $\\lambda_1=-\\lambda_2$.<br>'
     +'<b>Solution — (a).</b> For each level $s$: $$f_Y(y\\mid s)=\\frac{1}{\\sqrt{\\pi}}e^{-(y-s)^{2}},\\qquad s\\in\\{-2,0,2\\},$$ because $2\\sigma^{2}=1$.<br>'
     +'<b>Solution — (b).</b> Between $0$ and $2$, decide $2$ when $0.25\\,f_Y(y\\mid2)>0.5\\,f_Y(y\\mid0)$. Take logarithms: $$\\ln0.25-(y-2)^{2}>\\ln0.5-y^{2}.$$ Since $y^{2}-(y-2)^{2}=4y-4$, this is $4y-4>\\ln2=0.6931$. So $\\lambda_2=1.1733$. By symmetry $\\lambda_1=-1.1733$. Both move outwards, so the middle region grows.<br>'
     +'<b>Solution — (c).</b> An outer level errs only towards the middle. The middle level errs on both sides: $$\\begin{aligned}P(e\\mid\\pm2)&=Q\\!\\left(\\frac{2-1.1733}{0.7071}\\right)\\approx Q(1.17)=0.1210\\\\P(e\\mid0)&=2Q\\!\\left(\\frac{1.1733}{0.7071}\\right)\\approx2Q(1.66)=0.09691\\end{aligned}$$ $$\\begin{aligned}P_e&=2(0.25)(0.1210)+0.5(0.09691)\\\\&=0.06050+0.04846\\\\&=0.1090\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> With thresholds $\\pm1$ every excursion is $1$, so each tail is $Q(1/0.7071)\\approx Q(1.41)=0.07927$. Then $P_e=0.5(0.07927)+0.5(2)(0.07927)=0.1189$. MAP is about $8\\%$ better.<br>'
     +'<b>Check.</b> At $\\lambda_2$ the two weighted densities are equal. The common factor cancels, leaving $0.25\\,e^{-0.8267^{2}}=0.25(0.5049)=0.1262$ and $0.5\\,e^{-1.1733^{2}}=0.5(0.2524)=0.1262$.',
  figSol: () => dens({xr:[-4.5,4.5], xstep:1, cuts:[-1.1733,1.1733], ml:[-1,1], weighted:true, w:680,
    comps:[{m:-2, s:Math.SQRT1_2, p:0.25, col:C.in, tex:'0.25\\,f_Y(y\\mid -2)'},
           {m:0, s:Math.SQRT1_2, p:0.5, col:C.out, tex:'0.5\\,f_Y(y\\mid 0)'},
           {m:2, s:Math.SQRT1_2, p:0.25, col:C.mid, tex:'0.25\\,f_Y(y\\mid 2)'}],
    cutTex:['\\lambda_1','\\lambda_2'], cutAnchor:['end','start'], legend:'tr', head:1.9}),
  err:'Shrinking the middle region. The middle level is the more likely one, so both thresholds move outwards, from $\\pm1$ to $\\pm1.173$.',
  teach:'A variant with three levels. Each threshold is a binary MAP problem between neighbours, which is the point to make.' },

{ id:'D4-17', module:'M4', type:'priors', src:'Final Q2',
  stem:'In a binary PAM system the bit "1" is twice as likely as the bit "0". The matched-filter output is $Y=1+N$ when "1" is sent and $Y=-1+N$ when "0" is sent. $N$ is Gaussian with mean $0$ and variance $0.25$. According to this information,',
  parts:['[8 pts] Find the two priors and the optimal decision threshold $\\lambda$.',
         '[9 pts] Calculate the average probability of bit error $P_b$ as a number.',
         '[8 pts] The noise variance rises to $1$. Find the new threshold and $P_b$, and say how far $\\lambda$ moved.'],
  sol:'<b>Given.</b> $P_1=2P_0$, means $\\pm1$, $\\sigma^{2}=0.25$, then $\\sigma^{2}=1$.<br>'
     +'<b>Find.</b> $P_0$, $P_1$, $\\lambda$ and $P_b$ at both noise levels.<br>'
     +'<b>Method.</b> The priors sum to one. The MAP shift is $\\frac{\\sigma^{2}}{m_1-m_0}\\ln\\frac{P_0}{P_1}$, so it grows in proportion to the noise variance.<br>'
     +'<b>Solution — (a).</b> $P_0+2P_0=1$, so $P_0=1/3$ and $P_1=2/3$. The midpoint is $0$ and $m_1-m_0=2$: $$\\lambda=\\frac{0.25}{2}\\ln\\frac{1/3}{2/3}=0.125(-0.6931)=-0.0866.$$ Decide "1" if $Y>-0.0866$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P(e\\mid0)&=Q\\!\\left(\\frac{-0.0866+1}{0.5}\\right)\\approx Q(1.83)=0.03362\\\\P(e\\mid1)&=Q\\!\\left(\\frac{1+0.0866}{0.5}\\right)\\approx Q(2.17)=0.01500\\end{aligned}$$ $$\\begin{aligned}P_b&=\\tfrac13(0.03362)+\\tfrac23(0.01500)\\\\&=0.01121+0.01000\\\\&=0.02121\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> With $\\sigma^{2}=1$: $\\lambda=\\frac12(-0.6931)=-0.3466$, four times further from the midpoint. Then $$\\begin{aligned}P_b&=\\tfrac13Q(0.6534)+\\tfrac23Q(1.3466)\\\\&\\approx\\tfrac13(0.2578)+\\tfrac23(0.08851)\\\\&=0.08595+0.05901=0.1450\\end{aligned}$$ The priors matter more when the noise is larger.<br>'
     +'<b>Check.</b> The ML detector at $\\sigma=1$ gives $P_b=Q(1.00)=0.1587$. The MAP value $0.1450$ is lower, as it must be.',
  figSol: () => dens({xr:[-3,3], xstep:1, cuts:[-0.0866], ml:[0], weighted:true,
    comps:[{m:-1, s:0.5, p:1/3, col:C.in, tex:'\\tfrac13\\,f_Y(y\\mid 0)'},
           {m:1, s:0.5, p:2/3, col:C.out, tex:'\\tfrac23\\,f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=-0.087'], cutAnchor:['end'], legend:'tl', head:1.35}),
  err:'Taking the priors as $0.5$ and $1$. "Twice as likely" means $P_1=2P_0$, and the two priors must still add to one, so $P_0=1/3$.',
  teach:'Part (c) shows that the MAP shift scales with $\\sigma^{2}$. At low noise the MAP and ML detectors almost agree.' },

{ id:'D4-18', module:'M4', type:'priors', src:'Final Q2 (variant)',
  stem:'In a binary PAM system the matched-filter output is $Y=2+N$ for "1" and $Y=-2+N$ for "0". $N$ is Gaussian with mean $0$ and variance $4$. The bit "0" occurs with probability $0.9$ and "1" with probability $0.1$. According to this information,',
  parts:['[6 pts] For the sample $y=0.5$, compute $P_0f_Y(y\\mid0)$ and $P_1f_Y(y\\mid1)$. Give the MAP and the ML decisions.',
         '[6 pts] Find the MAP threshold $\\lambda$.',
         '[7 pts] Calculate $P_b$ of the MAP detector as a number.',
         '[6 pts] Show that $P(e\\mid1)$ exceeds one half, and compare $P_b$ with the ML detector.'],
  sol:'<b>Given.</b> Means $\\pm2$, $\\sigma=2$, $P_0=0.9$, $P_1=0.1$, one sample $y=0.5$.<br>'
     +'<b>Find.</b> The two weighted likelihoods at $y=0.5$, the decisions, $\\lambda$, $P_b$ and the comparison.<br>'
     +'<b>Method.</b> MAP compares $P_i f_Y(y\\mid i)$ and ML compares $f_Y(y\\mid i)$. The threshold follows from equating the weighted densities.<br>'
     +'<b>Solution — (a).</b> The factor is $1/\\sqrt{8\\pi}=0.1995$. $$\\begin{aligned}f_Y(0.5\\mid0)&=0.1995\\,e^{-2.5^{2}/8}=0.1995(0.4578)=0.09132\\\\f_Y(0.5\\mid1)&=0.1995\\,e^{-1.5^{2}/8}=0.1995(0.7548)=0.1506\\end{aligned}$$ Weighted: $0.9(0.09132)=0.08219$ and $0.1(0.1506)=0.01506$. MAP decides "0". ML compares $0.09132$ with $0.1506$ and decides "1".<br>'
     +'<b>Solution — (b).</b> Decide "1" when $\\frac{(y+2)^{2}-(y-2)^{2}}{8}>\\ln\\frac{0.9}{0.1}$. The left side is $y$, so $$\\lambda=\\ln9=2.197.$$ The threshold lies beyond $s_1=2$.<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}P(e\\mid0)&=Q\\!\\left(\\frac{2.197+2}{2}\\right)\\approx Q(2.10)=0.01786\\\\P(e\\mid1)&=P(Y<2.197\\mid1)=1-Q\\!\\left(\\frac{0.197}{2}\\right)\\approx1-Q(0.10)=0.5398\\end{aligned}$$ $$\\begin{aligned}P_b&=0.9(0.01786)+0.1(0.5398)\\\\&=0.01607+0.05398\\\\&=0.07005\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $P(e\\mid1)=0.5398>0.5$: more than half the "1"s are misread. The ML detector has $P_b=Q(2/2)=Q(1.00)=0.1587$. MAP more than halves the average, because "0" is nine times more frequent.<br>'
     +'<b>Check.</b> The sample $0.5$ is below $\\lambda=2.197$, so the threshold also decides "0", as part (a) found.',
  figSol: () => dens({xr:[-9,9], xstep:2, cuts:[2.197], ml:[0], weighted:true,
    comps:[{m:-2, s:2, p:0.9, col:C.in, tex:'0.9\\,f_Y(y\\mid 0)'},
           {m:2, s:2, p:0.1, col:C.out, tex:'0.1\\,f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=2.197'], legend:'tr', head:1.35}),
  err:'Comparing $f_Y(y\\mid i)$ without the priors in part (a). That is the ML test, and it decides "1" for $y=0.5$ where MAP decides "0".',
  teach:'A variant with strong priors: the threshold passes the less likely mean. It is a good place to ask what "optimal" means when one conditional error exceeds one half.' },

{ id:'D4-19', module:'M4', type:'priors', src:'Final Q2 (variant)',
  stem:'In a binary PAM system the matched-filter output is $Y=1+N$ for "1" and $Y=-1+N$ for "0". $N$ is Gaussian with mean $0$ and variance $0.5$. The priors are not known. The MAP detector of this system uses the threshold $\\lambda=-0.25$. According to this information,',
  parts:['[9 pts] Find the priors $P_0$ and $P_1$.',
         '[8 pts] Calculate $P_b$ of this MAP detector as a number.',
         '[8 pts] Calculate $P_b$ of the ML detector with the same priors, and compare.'],
  sol:'<b>Given.</b> Means $\\pm1$, $\\sigma^{2}=0.5$, $\\sigma=0.7071$, MAP threshold $\\lambda=-0.25$.<br>'
     +'<b>Find.</b> $P_0$, $P_1$ and the two error probabilities.<br>'
     +'<b>Method.</b> The threshold formula $\\lambda=\\frac{m_0+m_1}{2}+\\frac{\\sigma^{2}}{m_1-m_0}\\ln\\frac{P_0}{P_1}$ has one unknown, the prior ratio. Solve for it, then use $P_0+P_1=1$.<br>'
     +'<b>Solution — (a).</b> Here the midpoint is $0$ and $\\sigma^{2}/(m_1-m_0)=0.5/2=0.25$. So $$0.25\\ln\\frac{P_0}{P_1}=-0.25,\\qquad \\frac{P_0}{P_1}=e^{-1}=0.3679.$$ Put $P_0=0.3679P_1$ into $P_0+P_1=1$: $1.3679P_1=1$. So $P_1=0.7311$ and $P_0=0.2689$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P(e\\mid0)&=Q\\!\\left(\\frac{-0.25+1}{0.7071}\\right)\\approx Q(1.06)=0.1446\\\\P(e\\mid1)&=Q\\!\\left(\\frac{1+0.25}{0.7071}\\right)\\approx Q(1.77)=0.03836\\end{aligned}$$ $$\\begin{aligned}P_b&=0.2689(0.1446)+0.7311(0.03836)\\\\&=0.03888+0.02805\\\\&=0.06693\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The ML threshold is $0$, so $P_b=Q(1/0.7071)\\approx Q(1.41)=0.07927$ whatever the priors. The MAP detector is about $16\\%$ better.<br>'
     +'<b>Check.</b> Put the priors back: $0.25\\ln(0.2689/0.7311)=0.25(-1.000)=-0.25$, the given threshold.',
  figSol: () => dens({xr:[-3.5,3.5], xstep:1, cuts:[-0.25], ml:[0], weighted:true,
    comps:[{m:-1, s:Math.SQRT1_2, p:0.2689, col:C.in, tex:'0.269\\,f_Y(y\\mid 0)'},
           {m:1, s:Math.SQRT1_2, p:0.7311, col:C.out, tex:'0.731\\,f_Y(y\\mid 1)'}],
    cutTex:['\\lambda=-0.25'], cutAnchor:['end'], legend:'tl', head:1.4}),
  err:'Solving $\\ln(P_0/P_1)=-1$ as $P_0=e^{-1}$. The logarithm gives the ratio $P_0/P_1=e^{-1}$, and $P_0+P_1=1$ is still needed.',
  teach:'A reversed question: the threshold is given and the priors are asked for. It tests whether the class can read the MAP formula in both directions.' },

{ id:'D4-20', module:'M4', type:'priors', src:'Final Q2 (variant)',
  stem:'Two messages use $s_0(t)=2\\sqrt2\\cos(2\\pi t)$ and $s_1(t)=2\\sqrt2\\sin(2\\pi t)$ for $0\\le t\\le1$ s. The channel adds white Gaussian noise with $N_0/2=0.5$ W/Hz. The priors are $P(s_0)=0.75$ and $P(s_1)=0.25$. The receiver has two correlators with $\\psi_1(t)=\\sqrt2\\cos(2\\pi t)$ and $\\psi_2(t)=\\sqrt2\\sin(2\\pi t)$. According to the information given above,',
  parts:['[6 pts] Find the signal vectors $\\mathbf{s}_0$ and $\\mathbf{s}_1$, and write the MAP metric of each.',
         '[7 pts] Find the MAP decision boundary and draw the two decision regions.',
         '[6 pts] The observation is $\\mathbf{r}=(0.9,\\,1.1)$. Give the MAP and the ML decisions.',
         '[6 pts] Calculate $P_b$ of the MAP detector and compare it with the ML detector.'],
  sol:'<b>Given.</b> Two orthogonal carrier pulses, $N_0=1$, $\\sigma^{2}=0.5$, $P(s_0)=0.75$, $P(s_1)=0.25$.<br>'
     +'<b>Find.</b> $\\mathbf{s}_0$, $\\mathbf{s}_1$, the MAP boundary, two decisions and $P_b$.<br>'
     +'<b>Method.</b> MAP chooses the smallest $\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(s_i)$. Setting the two metrics equal gives a straight line parallel to the ML bisector.<br>'
     +'<b>Solution — (a).</b> $s_0(t)=2\\psi_1(t)$ and $s_1(t)=2\\psi_2(t)$, so $\\mathbf{s}_0=(2,0)$ and $\\mathbf{s}_1=(0,2)$. The metrics are $$D_i(\\mathbf{r})=\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-\\ln P(s_i),\\qquad N_0=1.$$<br>'
     +'<b>Solution — (b).</b> Set $D_0=D_1$: $$\\begin{aligned}(r_1-2)^{2}+r_2^{2}-\\ln0.75&=r_1^{2}+(r_2-2)^{2}-\\ln0.25\\\\-4r_1+4r_2&=\\ln0.75-\\ln0.25=\\ln3\\\\r_2&=r_1+0.2747\\end{aligned}$$ Decide $s_0$ below this line and $s_1$ above it. It is the ML line $r_2=r_1$ moved $0.275$ towards $\\mathbf{s}_1$.<br>'
     +'<b>Solution — (c).</b> For $\\mathbf{r}=(0.9,1.1)$, $r_2-r_1=0.2$. ML: $0.2>0$, so $s_1$. MAP: $0.2<0.2747$, so $s_0$. The metrics confirm it: $D_0=2.42+0.288=2.708$ and $D_1=1.62+1.386=3.006$.<br>'
     +'<b>Solution — (d).</b> $d=\\|\\mathbf{s}_0-\\mathbf{s}_1\\|=2\\sqrt2=2.828$. The boundary lies at $$\\begin{aligned}\\mu&=\\frac d2+\\frac{N_0}{2d}\\ln\\frac{0.75}{0.25}\\\\&=1.4142+\\frac{1.0986}{5.657}=1.6084\\end{aligned}$$ from $\\mathbf{s}_0$. With $\\sigma=0.7071$: $$\\begin{aligned}P(e\\mid s_0)&=Q(1.6084/0.7071)\\approx Q(2.27)=0.01160\\\\P(e\\mid s_1)&=Q(1.2200/0.7071)\\approx Q(1.73)=0.04182\\end{aligned}$$ $$P_b=0.75(0.01160)+0.25(0.04182)=0.01916.$$ The ML detector gives $Q(1.4142/0.7071)=Q(2.00)=0.02275$.<br>'
     +'<b>Check.</b> The distance from $\\mathbf{s}_0=(2,0)$ to the line $r_2-r_1-0.2747=0$ is $|0-2-0.2747|/\\sqrt2=1.6085$. This is $\\mu$ again.',
  figSol: () => cons({xr:[-1.5,3.5], yr:[-1.5,3.5], w:520, h:440, xstep:1, ystep:1, N0:1,
    pts:[{x:2,y:0,p:0.75,tex:'\\mathbf{s}_0'},{x:0,y:2,p:0.25,tex:'\\mathbf{s}_1'}],
    lines:[{pts:[[-1.5,-1.5],[3.5,3.5]], dash:'4 4'}],
    over:a=>{ a.point(0.9,1.1,{color:C.ink,r:4});
      a.note(0.9,1.1,'\\mathbf{r}',{tex:true,fs:14,color:C.ink,dx:-16,dy:-4});
      a.note(3.45,2.7,'\\text{ML}',{tex:true,fs:13,color:C.muted,anchor:'end'});
      a.note(0.12,2.8,'r_2=r_1+0.275',{tex:true,fs:13,color:C.ink}); }}),
  err:'Moving the boundary towards $\\mathbf{s}_0$ because it is more likely. The more likely point gets the larger region, so the line moves towards $\\mathbf{s}_1$.',
  teach:'A two-dimensional variant: the prior shifts the bisector without turning it. The observation in part (c) is chosen to fall between the ML and MAP lines.' },

/* ---- mary: a waveform family, its regions and the nearest-neighbour form */

{ id:'D4-21', module:'M4', type:'mary', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the waveforms $$s_k(t)=\\sqrt6\\cos\\!\\left(2000\\pi t+\\frac{(2k-1)\\pi}{6}\\right),\\qquad k\\in\\{1,\\ldots,6\\},\\ 0\\le t\\le1.$$ These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. According to the information given above,',
  parts:['[8 pts] Choose an orthonormal basis, find the coordinates of the six points, and give $E_{s,\\text{avg}}$.',
         '[7 pts] Draw the signal constellation and the optimal decision regions.',
         '[10 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$.'],
  sol:'<b>Given.</b> Six phases $30^{\\circ},90^{\\circ},\\ldots,330^{\\circ}$, amplitude $\\sqrt6$, $T=1$ s, carrier $1000$ Hz, equal priors.<br>'
     +'<b>Find.</b> The basis, the six points, $E_{s,\\text{avg}}$, the regions and $P_e$ by the nearest-neighbour approximation.<br>'
     +'<b>Method.</b> Expand the cosine of a sum to split each waveform on a cosine and a sine. The regions are bounded by perpendicular bisectors. Then $P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$.<br>'
     +'<b>Solution — (a).</b> Take $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$ on $[0,1]$. Each has unit energy, because $[0,1]$ holds a whole number of cycles. With $\\theta_k=(2k-1)\\pi/6$: $$\\begin{aligned}s_k(t)&=\\sqrt6\\cos\\theta_k\\cos(2000\\pi t)-\\sqrt6\\sin\\theta_k\\sin(2000\\pi t)\\\\&=\\sqrt3\\cos\\theta_k\\,\\psi_1(t)+\\sqrt3\\sin\\theta_k\\,\\psi_2(t)\\end{aligned}$$ So $\\mathbf{s}_k=\\sqrt3(\\cos\\theta_k,\\sin\\theta_k)$: six points on a circle of radius $\\sqrt3$. For example $\\mathbf{s}_1=(1.5,\\,0.866)$ and $\\mathbf{s}_2=(0,\\,1.732)$. Every point has energy $3$, so $E_{s,\\text{avg}}=3$.<br>'
     +'<b>Solution — (b).</b> Neighbouring points are $60^{\\circ}$ apart. Each bisector is a ray from the origin half-way between two neighbours, at $0^{\\circ},60^{\\circ},120^{\\circ},\\ldots$. So each region is a $60^{\\circ}$ wedge centred on its point.<br>'
     +'<b>Solution — (c).</b> Two neighbours on a circle of radius $\\sqrt{E_s}$, $60^{\\circ}$ apart, are $$d_{\\min}=2\\sqrt{E_s}\\sin\\frac{\\pi}{6}=\\sqrt{E_s}=\\sqrt3=1.732$$ apart. Every point has two neighbours at this distance, so $N_{\\min}=2$. With $d_{\\min}^{2}=E_{s,\\text{avg}}$: $$P_e\\approx2\\,Q\\!\\left(\\sqrt{\\frac{E_{s,\\text{avg}}}{2N_0}}\\right).$$<br>'
     +'<b>Check.</b> Compute $d_{\\min}$ from the coordinates: $\\mathbf{s}_1-\\mathbf{s}_2=(1.5,\\,-0.866)$, so $d_{\\min}^{2}=2.25+0.75=3=E_{s,\\text{avg}}$.',
  figSol: () => { const r=Math.sqrt(3); return cons({xr:[-2.7,2.7], yr:[-2.5,2.5], w:560, h:460, xstep:1, ystep:1,
    pts:[1,2,3,4,5,6].map(k=>{ const th=(2*k-1)*Math.PI/6; return {x:r*Math.cos(th), y:r*Math.sin(th), c:(k-1)%3,
      tex:'\\mathbf{s}_'+k, dx:Math.cos(th)>0.1?8:Math.cos(th)<-0.1?-8:8, dy:k===5?20:-12, anchor:Math.cos(th)<-0.1?'end':'start'}; }),
    dmin:[0,1], dminAt:[1.6,1.6], dminAnchor:'start',
    nn:[[1,2],[2,3],[3,4],[4,5],[5,0]]}); },
  err:'Taking $d_{\\min}$ as the radius $\\sqrt3$ because the numbers agree here. The chord is $2\\sqrt{E_s}\\sin(\\pi/M)$, and it equals the radius only for $M=6$.',
  teach:'The examination shape, with six phases instead of five. Ask for $d_{\\min}^{2}$ from two coordinates as well as from the chord formula.' },

{ id:'D4-22', module:'M4', type:'mary', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the following waveforms: $$\\begin{aligned}s_1(t)&=0\\\\s_2(t)&=2\\sqrt2\\cos(2000\\pi t)\\\\s_3(t)&=4\\cos\\!\\left(2000\\pi t+\\frac{\\pi}{4}\\right)\\\\s_4(t)&=2\\sqrt2\\cos\\!\\left(2000\\pi t+\\frac{\\pi}{2}\\right)\\end{aligned}$$ all for $0\\le t\\le1$. These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. According to the information given above,',
  parts:['[7 pts] Find the four signal points and $E_{s,\\text{avg}}$.',
         '[6 pts] Draw the signal constellation and the optimal decision regions.',
         '[7 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$.',
         '[5 pts] Moving the constellation so that its centre is at the origin keeps $P_e$. How much energy does it save, in decibels?'],
  sol:'<b>Given.</b> Four waveforms on a $1000$ Hz carrier, $T=1$ s, equal priors.<br>'
     +'<b>Find.</b> The points, $E_{s,\\text{avg}}$, the regions, $P_e$ and the saving from centring.<br>'
     +'<b>Method.</b> Use $\\psi_1=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2=-\\sqrt2\\sin(2000\\pi t)$. A waveform $A\\cos(2000\\pi t+\\theta)$ has the point $\\frac{A}{\\sqrt2}(\\cos\\theta,\\sin\\theta)$.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}\\mathbf{s}_1&=(0,0)\\\\\\mathbf{s}_2&=2(\\cos0,\\sin0)=(2,0)\\\\\\mathbf{s}_3&=2\\sqrt2\\left(\\cos\\tfrac\\pi4,\\sin\\tfrac\\pi4\\right)=(2,2)\\\\\\mathbf{s}_4&=2\\left(\\cos\\tfrac\\pi2,\\sin\\tfrac\\pi2\\right)=(0,2)\\end{aligned}$$ The energies are $0,4,8,4$, so $E_{s,\\text{avg}}=\\frac{0+4+8+4}{4}=4$.<br>'
     +'<b>Solution — (b).</b> The points form a square of side $2$ with centre $(1,1)$. The bisectors are the lines $r_1=1$ and $r_2=1$. Each region is a quadrant about $(1,1)$, and each contains one corner point.<br>'
     +'<b>Solution — (c).</b> $d_{\\min}=2$, the side of the square. Each point has two neighbours at that distance, so $N_{\\min}=2$. Here $d_{\\min}^{2}=4=E_{s,\\text{avg}}$: $$P_e\\approx2\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)=2\\,Q\\!\\left(\\sqrt{\\frac{E_{s,\\text{avg}}}{2N_0}}\\right).$$<br>'
     +'<b>Solution — (d).</b> Shift every point by $(-1,-1)$. The points become $(\\pm1,\\pm1)$ and every distance is unchanged, so $P_e$ is unchanged. Each energy is now $2$, so $E_{s,\\text{avg}}=2$. The saving is $10\\log_{10}(4/2)=3.01$ dB.<br>'
     +'<b>Check.</b> The mean of the four points is $(1,1)$, with squared length $2$. The average energy splits as $2$ for the mean plus $2$ about the mean, which is $4$. Centring removes the first part.',
  figSol: () => cons({xr:[-1.2,3.2], yr:[-1.2,3.2], w:500, h:440, xstep:1, ystep:1,
    pts:[{x:0,y:0,tex:'\\mathbf{s}_1',dx:-8,dy:18,anchor:'end'},{x:2,y:0,tex:'\\mathbf{s}_2'},{x:2,y:2,tex:'\\mathbf{s}_3'},{x:0,y:2,tex:'\\mathbf{s}_4',dx:-8,anchor:'end'}],
    dmin:[0,1], dminAt:[1.35,0.12], hideX:[1], hideY:[1,2], nn:[[1,2],[2,3],[3,0]],
    over:a=>a.point(1,1,{color:C.ink,r:3})}),
  err:'Taking $E_{s,\\text{avg}}$ as $2$ because the square has side $2$. The zero point counts, and the far corner has energy $8$, so the average is $4$.',
  teach:'The examination set $\\{0,\\,2\\cos,\\,2\\sqrt2\\cos(\\cdot\\pm\\pi/4)\\}$ with new points. Part (d) shows why constellations are centred at the origin.' },

{ id:'D4-23', module:'M4', type:'mary', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the waveforms $$s_k(t)=(2k-5)\\sqrt2\\cos(4000\\pi t),\\qquad k\\in\\{1,2,3,4\\},\\ 0\\le t\\le1.$$ These signals are planned to be transmitted over a standard additive white Gaussian noise (AWGN) channel with $\\mathcal{N}(0,N_0/2)$. According to the information given above,',
  parts:['[8 pts] Find the basis, the four signal points and $E_{s,\\text{avg}}$.',
         '[7 pts] Draw the signal constellation and the optimal decision regions.',
         '[10 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$.'],
  sol:'<b>Given.</b> Four-level PAM on a $2000$ Hz carrier, $T=1$ s, equal priors.<br>'
     +'<b>Find.</b> The points, $E_{s,\\text{avg}}$, the regions and $P_e$.<br>'
     +'<b>Method.</b> All four waveforms are multiples of one pulse, so the constellation is one-dimensional. The boundaries are midpoints, and $N_{\\min}$ is an average over the points.<br>'
     +'<b>Solution — (a).</b> $\\psi(t)=\\sqrt2\\cos(4000\\pi t)$ has unit energy on $[0,1]$. Then $s_k(t)=(2k-5)\\psi(t)$, so the points are $-3,\\,-1,\\,1,\\,3$. $$E_{s,\\text{avg}}=\\frac{9+1+1+9}{4}=5.$$<br>'
     +'<b>Solution — (b).</b> The boundaries are the midpoints $-2$, $0$ and $2$. The two outer points own half-lines, $r<-2$ and $r>2$. The two inner points own the intervals $(-2,0)$ and $(0,2)$.<br>'
     +'<b>Solution — (c).</b> $d_{\\min}=2$. The outer points have one neighbour each and the inner points two, so $$N_{\\min}=\\frac{1+2+2+1}{4}=1.5.$$ From part (a), $d_{\\min}^{2}=4=\\frac45E_{s,\\text{avg}}$. So $$P_e\\approx1.5\\,Q\\!\\left(\\sqrt{\\frac{4E_{s,\\text{avg}}/5}{2N_0}}\\right)=1.5\\,Q\\!\\left(\\sqrt{\\frac{2E_{s,\\text{avg}}}{5N_0}}\\right).$$<br>'
     +'<b>Check.</b> The general $M$-PAM relation $d_{\\min}^{2}=12E_{s,\\text{avg}}/(M^{2}-1)$ gives $12(5)/15=4$ for $M=4$. This is the $d_{\\min}^{2}$ found above.',
  figSol: () => cons({xr:[-4.5,4.5], yr:[-1,1], w:640, h:200, xstep:1, oneD:true,
    pts:[-3,-1,1,3].map((x,k)=>({x:x, y:0, tex:'\\mathbf{s}_'+(k+1)})),
    dmin:[1,2], dminAt:[0.3,-0.5], dminAnchor:'start', hideX:[-2,2]}),
  err:'Taking $N_{\\min}=2$ for every point. The two outer points have one neighbour each, so the average is $1.5$.',
  teach:'The examination\'s "PAM on a carrier" shape with four levels. Ask why only one correlator is needed.' },

{ id:'D4-24', module:'M4', type:'mary', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the waveforms $$s_k(t)=2\\cos\\!\\left(1000\\pi t+\\frac{(2k-1)\\pi}{8}\\right),\\qquad k\\in\\{1,\\ldots,8\\},\\ 0\\le t\\le2.$$ These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. According to the information given above,',
  parts:['[7 pts] Choose an orthonormal basis and find the signal points and $E_{s,\\text{avg}}$.',
         '[6 pts] Draw the signal constellation and the optimal decision regions.',
         '[7 pts] Determine the nearest-neighbour approximation of $P_e$ as a function of $E_{s,\\text{avg}}/N_0$.',
         '[5 pts] Evaluate it at $E_{s,\\text{avg}}/N_0=20$.'],
  sol:'<b>Given.</b> Eight phases $22.5^{\\circ},67.5^{\\circ},\\ldots$, amplitude $2$, $T=2$ s, carrier $500$ Hz, equal priors.<br>'
     +'<b>Find.</b> The basis, points, $E_{s,\\text{avg}}$, regions, $P_e$ and its value at $20$.<br>'
     +'<b>Method.</b> With $T=2$ the unit-energy basis is $\\sqrt{2/T}\\cos=\\cos$. Neighbours on a circle are $2\\sqrt{E_s}\\sin(\\pi/M)$ apart.<br>'
     +'<b>Solution — (a).</b> $\\psi_1(t)=\\cos(1000\\pi t)$ and $\\psi_2(t)=-\\sin(1000\\pi t)$. Check the energy: $\\int_0^2\\cos^{2}(1000\\pi t)\\,dt=\\int_0^2\\frac{1+\\cos(2000\\pi t)}{2}dt=1$. Expanding the cosine gives $\\mathbf{s}_k=2(\\cos\\theta_k,\\sin\\theta_k)$ with $\\theta_k=(2k-1)\\pi/8$. The points lie on a circle of radius $2$, so $E_{s,\\text{avg}}=4$.<br>'
     +'<b>Solution — (b).</b> Each region is a $45^{\\circ}$ wedge centred on its point. The boundaries are rays at $0^{\\circ},45^{\\circ},90^{\\circ},\\ldots$, which are the coordinate axes and the diagonals.<br>'
     +'<b>Solution — (c).</b> $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/8)=4(0.3827)=1.531$ and $N_{\\min}=2$. With $d_{\\min}^{2}=4E_{s,\\text{avg}}\\sin^{2}(\\pi/8)$: $$P_e\\approx2\\,Q\\!\\left(\\sqrt{\\frac{2E_{s,\\text{avg}}}{N_0}}\\sin\\frac\\pi8\\right)=2\\,Q\\!\\left(0.5412\\sqrt{\\frac{E_{s,\\text{avg}}}{N_0}}\\right).$$<br>'
     +'<b>Solution — (d).</b> $0.5412\\sqrt{20}=2.420$, so $P_e\\approx2\\,Q(2.42)=2(0.007760)=0.01552$.<br>'
     +'<b>Check.</b> From two coordinates: $\\mathbf{s}_1=(1.848,\\,0.765)$ and $\\mathbf{s}_2=(0.765,\\,1.848)$. Then $d_{\\min}^{2}=2(1.0824)^{2}=2.343$, and $4E_s\\sin^{2}(\\pi/8)=16(0.1464)=2.343$.',
  figSol: () => cons({xr:[-3,3], yr:[-2.8,2.8], w:540, h:480, xstep:1, ystep:1,
    pts:[1,2,3,4,5,6,7,8].map(k=>{ const th=(2*k-1)*Math.PI/8; return {x:2*Math.cos(th), y:2*Math.sin(th),
      tex:'\\mathbf{s}_'+k, dx:Math.cos(th)<0?-8:8, dy:Math.sin(th)<0?18:-10, anchor:Math.cos(th)<0?'end':'start'}; }),
    dmin:[0,1], dminAt:[2.0,1.5], dminAnchor:'start',
    nn:[[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]]}),
  err:'Using $T=1$ and the basis $\\sqrt2\\cos$. Here $T=2$, so the unit-energy basis is $\\cos(1000\\pi t)$, and the radius is $2$, not $\\sqrt2$.',
  teach:'Close to the examination\'s phase-offset shape, with a longer symbol. The basis normalisation for $T\\ne1$ is the trap.' },

{ id:'D4-25', module:'M4', type:'mary', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the waveforms $$s_{a,b}(t)=a\\sqrt2\\cos(2000\\pi t)-b\\sqrt2\\sin(2000\\pi t),\\qquad 0\\le t\\le1,$$ with $a\\in\\{-3,-1,1,3\\}$ and $b\\in\\{-1,1\\}$. These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. According to the information given above,',
  parts:['[8 pts] Find the signal points and $E_{s,\\text{avg}}$.',
         '[7 pts] Draw the signal constellation and the optimal decision regions.',
         '[10 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$.'],
  sol:'<b>Given.</b> Eight points, four amplitudes on the cosine and two on the sine, $T=1$ s, equal priors.<br>'
     +'<b>Find.</b> The points, $E_{s,\\text{avg}}$, the regions and $P_e$.<br>'
     +'<b>Method.</b> With $\\psi_1=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2=-\\sqrt2\\sin(2000\\pi t)$ the point is $(a,b)$. Count the neighbours at $d_{\\min}$ point by point and average.<br>'
     +'<b>Solution — (a).</b> $s_{a,b}(t)=a\\,\\psi_1(t)+b\\,\\psi_2(t)$, so the points are $(a,b)$: a $4\\times2$ grid. The energies are $a^{2}+b^{2}$: four points with $2$ and four with $10$. $$E_{s,\\text{avg}}=\\frac{4(2)+4(10)}{8}=6.$$<br>'
     +'<b>Solution — (b).</b> The bisectors are the vertical lines $r_1=-2,\\,0,\\,2$ and the horizontal line $r_2=0$. The four inner points own bounded-width strips on one side of $r_2=0$. The four outer points own regions that run off to infinity on two sides.<br>'
     +'<b>Solution — (c).</b> $d_{\\min}=2$. An inner point, such as $(1,1)$, has neighbours $(-1,1)$, $(3,1)$ and $(1,-1)$: three. An outer point, such as $(3,1)$, has $(1,1)$ and $(3,-1)$: two. So $$N_{\\min}=\\frac{4(3)+4(2)}{8}=2.5.$$ With $d_{\\min}^{2}=4=\\frac23E_{s,\\text{avg}}$: $$P_e\\approx2.5\\,Q\\!\\left(\\sqrt{\\frac{E_{s,\\text{avg}}}{3N_0}}\\right).$$<br>'
     +'<b>Check.</b> Count the neighbour pairs instead. The grid has $3\\times2=6$ horizontal and $4$ vertical pairs at distance $2$. Each pair is counted from both ends: $2(10)/8=2.5$.',
  figSol: () => { const P8=[]; [-1,1].forEach(b=>[-3,-1,1,3].forEach((a,i)=>P8.push({x:a,y:b,c:b<0?i:(i+2)%4})));
    P8.forEach((p,k)=>{ p.tex = null; });
    return cons({xr:[-4.8,4.8], yr:[-2.6,2.6], w:640, h:380, xstep:1, ystep:1, pts:P8,
      dmin:[5,6], dminAt:[0.15,1.3], dminAnchor:'start', hideX:[-3,-2,-1,1,2,3], hideY:[-1,1],
      nn:[[4,5],[6,7],[0,1],[1,2],[2,3],[0,4],[1,5],[2,6],[3,7]]}); },
  err:'Taking $N_{\\min}=4$, as in a large square grid. In a $4\\times2$ grid no point has four neighbours, and the average is $2.5$.',
  teach:'A rectangular eight-point set in the examination shape. The neighbour count by pairs in the check is the fast way to get $N_{\\min}$.' },

{ id:'D4-26', module:'M4', type:'erasure', src:'Madhow P6.24',
  stem:'A QPSK receiver works on the two correlator outputs $\\mathbf{y}=(y_1,y_2)$. The four equally likely signal points are $\\mathbf{s}_1=(2,2)$, $\\mathbf{s}_2=(-2,2)$, $\\mathbf{s}_3=(-2,-2)$ and $\\mathbf{s}_4=(2,-2)$. Each coordinate carries independent Gaussian noise with mean $0$ and variance $N_0/2=0.64$. The receiver does not decide when the observation lies close to a boundary. If $|y_1|<0.4$ or $|y_2|<0.4$, it puts out an erasure, a mark that means "no decision". Otherwise it decides the point in the quadrant of $\\mathbf{y}$. Let $d$ be the distance between neighbouring points, $d_1$ the width of each erasure strip, and $\\alpha=d_1/d$. The energy per bit is $E_b=E_{s,\\text{avg}}/2$. According to the information given above,',
  parts:['[6 pts] Find $d$, $d_1$, $\\alpha$, $E_b$ and $E_b/N_0$. Draw the decision regions and the erasure zone.',
         '[7 pts] Use the intelligent union bound to approximate the symbol error probability $p$ and the erasure probability $q$. Write each as a function of $E_b/N_0$ and $\\alpha$, then evaluate it.',
         '[7 pts] Find $p$ and $q$ exactly, as products of probabilities of the two coordinates, and evaluate them.',
         '[5 pts] Find the symbol error probability of the ordinary QPSK receiver, which has no erasure zone. State what the zone gains and what it costs.'],
  sol:'<b>Given.</b> Points $(\\pm2,\\pm2)$ with equal priors. Noise variance $\\sigma^{2}=N_0/2=0.64$ on each coordinate, so $\\sigma=0.8$ and $N_0=1.28$. Erasure strips $|y_1|<0.4$ and $|y_2|<0.4$.<br>'
     +'<b>Find.</b> $d$, $d_1$, $\\alpha$, $E_b$, $E_b/N_0$, the regions, $p$ and $q$ by the bound and exactly, and $P_e$ without the zone.<br>'
     +'<b>Method.</b> By symmetry all four points have the same $p$ and $q$, so take $\\mathbf{s}_1=(2,2)$. Each coordinate has three outcomes: the right side, the strip, or the wrong side. The noise on the two coordinates is independent, so their probabilities multiply.<br>'
     +'<b>Solution — (a).</b> Neighbouring points such as $(2,2)$ and $(-2,2)$ are $d=4$ apart. Each strip runs from $-0.4$ to $0.4$, so $d_1=0.8$ and $$\\alpha=\\frac{d_1}{d}=\\frac{0.8}{4}=0.2.$$ Every point has energy $2^{2}+2^{2}=8$, so $E_{s,\\text{avg}}=8$ and $E_b=4$. Then $$\\frac{E_b}{N_0}=\\frac{4}{1.28}=3.125.$$ The region of $\\mathbf{s}_1$ is $y_1>0.4$ and $y_2>0.4$: the first quadrant with the strips cut away. The other three regions follow by symmetry. The cross where $|y_1|<0.4$ or $|y_2|<0.4$ is the erasure zone.<br>'
     +'<b>Solution — (b).</b> Take $\\mathbf{s}_1$ sent. The near edge of each strip is $2-0.4=1.6$ from the point, which is $\\tfrac d2(1-\\alpha)$. The far edge is $2+0.4=2.4$, which is $\\tfrac d2(1+\\alpha)$. An error needs $y_1<-0.4$ or $y_2<-0.4$, a crossing of one of two far edges. An erasure needs a crossing of one of two near edges. The intelligent union bound adds one term for each of these faces. Write the scale in terms of $E_b$ first. Here $d^{2}=16=4E_b$, so $$\\frac{d/2}{\\sigma}=\\sqrt{\\frac{d^{2}}{2N_0}}=\\sqrt{\\frac{2E_b}{N_0}}.$$ Hence $$p\\approx2\\,Q\\!\\left((1+\\alpha)\\sqrt{\\frac{2E_b}{N_0}}\\right),\\qquad q\\approx2\\,Q\\!\\left((1-\\alpha)\\sqrt{\\frac{2E_b}{N_0}}\\right).$$ With $\\sqrt{2(3.125)}=\\sqrt{6.25}=2.5$: $$\\begin{aligned}p&\\approx2\\,Q\\bigl(1.2(2.5)\\bigr)=2\\,Q(3.00)=2.700\\times10^{-3}\\\\q&\\approx2\\,Q\\bigl(0.8(2.5)\\bigr)=2\\,Q(2.00)=0.04550\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> On one coordinate $y_i=2+n_i$. Let $c$ be the probability that it lands on the right side, and $w$ that it lands on the wrong side: $$\\begin{aligned}c&=1-Q\\!\\left((1-\\alpha)\\sqrt{2E_b/N_0}\\right)\\\\&=1-Q\\!\\left(\\tfrac{1.6}{0.8}\\right)=1-Q(2.00)=0.97725\\end{aligned}$$ $$\\begin{aligned}w&=Q\\!\\left((1+\\alpha)\\sqrt{2E_b/N_0}\\right)\\\\&=Q\\!\\left(\\tfrac{2.4}{0.8}\\right)=Q(3.00)=0.00135\\end{aligned}$$ A correct decision needs both coordinates on the right side, with probability $c^{2}$. A decision of any kind needs both outside the strips, with probability $(c+w)^{2}$. So $$\\begin{aligned}q&=1-(c+w)^{2}\\\\&=1-(0.97860)^{2}\\\\&=1-0.95766=0.04234\\end{aligned}$$ $$\\begin{aligned}p&=(c+w)^{2}-c^{2}\\\\&=0.95766-0.95502\\\\&=2.640\\times10^{-3}\\end{aligned}$$ Both values of part (b) lie above these, $2.700\\times10^{-3}>2.640\\times10^{-3}$ and $0.04550>0.04234$, as a union bound must.<br>'
     +'<b>Solution — (d).</b> Without the zone the boundaries are the axes, $2$ from the point. Each coordinate is wrong with probability $Q(2/0.8)=Q(2.50)=0.006210$. The symbol is right only when both are right: $$\\begin{aligned}P_e&=1-(1-0.006210)^{2}\\\\&=1-0.98762\\\\&=0.01238\\end{aligned}$$ The zone cuts wrong decisions from $0.01238$ to $0.00264$, about $4.7$ times fewer. It pays with $4.23\\%$ of the symbols erased. An erasure is flagged, so a later decoder knows which symbols to distrust. A wrong decision carries no flag.<br>'
     +'<b>Check.</b> The three outcomes must add to one: $$\\begin{aligned}c^{2}+p+q&=0.95502+0.00264+0.04234\\\\&=1.00000\\end{aligned}$$ Also $p=w(2c+w)=0.00135(1.95585)=2.640\\times10^{-3}$, the value of part (c).',
  figSol: () => erasureFig({lim:3.4, b:0.4,
    pts:[{x:2,y:2,tex:'\\mathbf{s}_1'},{x:-2,y:2,tex:'\\mathbf{s}_2'},{x:-2,y:-2,tex:'\\mathbf{s}_3'},{x:2,y:-2,tex:'\\mathbf{s}_4'}],
    over:a=>{ a.poly([[2,2],[0.4,2]], {color:C.muted, width:1.4, dash:'3 3'});
      a.poly([[2,1.4],[-0.4,1.4]], {color:C.err, width:2});
      a.note(1.2, 2, '1.6', {tex:true, fs:13, color:C.muted, anchor:'middle', dy:-10});
      a.note(0.8, 1.4, '2.4', {tex:true, fs:13, color:C.err, anchor:'middle', dy:18});
      a.note(-2.45, 0.2, '\\text{erasure}', {tex:true, fs:13, color:C.ink, anchor:'middle', dy:4}); }}),
  err:'Measuring the error distance to the axis, $2/0.8=2.5$, as in ordinary QPSK. With the zone an error must pass the far edge of a strip, $2.4$ from the point, so the argument is $3.00$.',
  teach:'A decision with three outcomes. The intelligent union bound works face by face, once for the error faces and once for the erasure faces. Part (d) shows the trade: fewer wrong decisions for a few flagged ones.' },

{ id:'D4-27', module:'M4', type:'mary', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the waveforms $$s_k(t)=2\\cos\\!\\left(2000\\pi t+\\frac{2\\pi k}{3}+\\frac\\pi2\\right),\\qquad k\\in\\{0,1,2\\},\\ 0\\le t\\le1.$$ These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. According to the information given above,',
  parts:['[7 pts] Find the three signal points and $E_{s,\\text{avg}}$.',
         '[6 pts] Draw the signal constellation and the optimal decision regions.',
         '[7 pts] Determine the nearest-neighbour approximation of $P_e$ as a function of $E_{s,\\text{avg}}/N_0$.',
         '[5 pts] Evaluate it at $E_{s,\\text{avg}}/N_0=6$.'],
  sol:'<b>Given.</b> Three phases $90^{\\circ},210^{\\circ},330^{\\circ}$, amplitude $2$, $T=1$ s, equal priors.<br>'
     +'<b>Find.</b> The points, $E_{s,\\text{avg}}$, the regions, $P_e$ and its value at $6$.<br>'
     +'<b>Method.</b> The point of $A\\cos(2000\\pi t+\\theta)$ is $\\frac{A}{\\sqrt2}(\\cos\\theta,\\sin\\theta)$. Three points on a circle are all neighbours of each other.<br>'
     +'<b>Solution — (a).</b> The radius is $2/\\sqrt2=\\sqrt2$. $$\\begin{aligned}\\mathbf{s}_0&=\\sqrt2(\\cos90^{\\circ},\\sin90^{\\circ})=(0,\\,1.414)\\\\\\mathbf{s}_1&=\\sqrt2(\\cos210^{\\circ},\\sin210^{\\circ})=(-1.225,\\,-0.707)\\\\\\mathbf{s}_2&=\\sqrt2(\\cos330^{\\circ},\\sin330^{\\circ})=(1.225,\\,-0.707)\\end{aligned}$$ Every point has energy $2$, so $E_{s,\\text{avg}}=2$.<br>'
     +'<b>Solution — (b).</b> Each region is a $120^{\\circ}$ wedge centred on its point. The boundaries are the rays at $30^{\\circ}$, $150^{\\circ}$ and $270^{\\circ}$ from the origin.<br>'
     +'<b>Solution — (c).</b> $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/3)=\\sqrt3\\sqrt2=\\sqrt6=2.449$. Each point has two neighbours at this distance, so $N_{\\min}=2$. With $d_{\\min}^{2}=3E_{s,\\text{avg}}$: $$P_e\\approx2\\,Q\\!\\left(\\sqrt{\\frac{3E_{s,\\text{avg}}}{2N_0}}\\right).$$<br>'
     +'<b>Solution — (d).</b> At $E_{s,\\text{avg}}/N_0=6$ the argument is $\\sqrt{9}=3$. So $P_e\\approx2\\,Q(3.00)=2(1.350\\times10^{-3})=2.700\\times10^{-3}$.<br>'
     +'<b>Check.</b> From coordinates: $\\mathbf{s}_2-\\mathbf{s}_1=(2.449,\\,0)$, so $d_{\\min}^{2}=6=3E_{s,\\text{avg}}$.',
  figSol: () => { const r=Math.SQRT2; return cons({xr:[-2.4,2.4], yr:[-2.2,2.2], w:520, h:460, xstep:1, ystep:1,
    pts:[0,1,2].map(k=>{ const th=2*Math.PI*k/3+Math.PI/2; return {x:r*Math.cos(th), y:r*Math.sin(th),
      tex:'\\mathbf{s}_'+k, dx:Math.cos(th)<-0.1?-8:8, dy:Math.sin(th)<0?20:-10, anchor:Math.cos(th)<-0.1?'end':'start'}; }),
    dmin:[1,2], dminAt:[0.25,-0.97], dminAnchor:'start', hideX:[-1,1], hideY:[-1,1], nn:[[0,1],[0,2]]}); },
  err:'Using $d_{\\min}=\\sqrt2\\,r$, the chord of four points. Three points are $120^{\\circ}$ apart, so the chord is $2r\\sin60^{\\circ}=\\sqrt3\\,r$.',
  teach:'The examination shape with $M=3$. Here the nearest-neighbour form is also the full union bound, because every point neighbours every other.' },

{ id:'D4-28', module:'M4', type:'mary', src:'Final Q3 (variant)',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the waveforms $s_1(t)=0$ and $$s_k(t)=2\\sqrt2\\cos\\!\\left(2000\\pi t+\\frac{(k-2)\\pi}{3}\\right),\\qquad k\\in\\{2,\\ldots,7\\},\\ 0\\le t\\le1.$$ These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. According to the information given above,',
  parts:['[8 pts] Find the seven signal points and $E_{s,\\text{avg}}$.',
         '[8 pts] Draw the signal constellation and the optimal decision regions.',
         '[9 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$.'],
  sol:'<b>Given.</b> A zero signal and six carrier pulses of amplitude $2\\sqrt2$, $60^{\\circ}$ apart. $T=1$ s, equal priors.<br>'
     +'<b>Find.</b> The points, $E_{s,\\text{avg}}$, the regions and $P_e$.<br>'
     +'<b>Method.</b> The ring has radius $2$. A regular hexagon has side equal to its radius, so the ring points are also $2$ apart.<br>'
     +'<b>Solution — (a).</b> $\\mathbf{s}_1=(0,0)$ and $\\mathbf{s}_k=2\\bigl(\\cos\\tfrac{(k-2)\\pi}{3},\\sin\\tfrac{(k-2)\\pi}{3}\\bigr)$: six points of a regular hexagon of radius $2$. $$E_{s,\\text{avg}}=\\frac{0+6(4)}{7}=\\frac{24}{7}=3.429.$$<br>'
     +'<b>Solution — (b).</b> The centre region is bounded by the six bisectors at distance $1$ from the origin: a regular hexagon. Each ring point owns the wedge-shaped region outside it. That region lies between the bisectors with its two ring neighbours and runs off to infinity.<br>'
     +'<b>Solution — (c).</b> The centre is $2$ from all six ring points. Neighbouring ring points are $2\\cdot2\\sin30^{\\circ}=2$ apart. So $d_{\\min}=2$. The centre has $6$ neighbours at $d_{\\min}$, and each ring point has $3$: the centre and two ring points. $$N_{\\min}=\\frac{6+6(3)}{7}=\\frac{24}{7}=3.429.$$ With $d_{\\min}^{2}=4=\\frac{7}{6}E_{s,\\text{avg}}$: $$P_e\\approx\\frac{24}{7}\\,Q\\!\\left(\\sqrt{\\frac{7E_{s,\\text{avg}}}{12N_0}}\\right).$$<br>'
     +'<b>Check.</b> Count pairs at distance $2$: six spokes and six ring sides make $12$ pairs. Each counts twice: $24/7$.',
  figSol: () => cons({xr:[-3.2,3.2], yr:[-2.9,2.9], w:540, h:480, xstep:1, ystep:1,
    pts:[{x:0,y:0,c:3,tex:'\\mathbf{s}_1',dx:18,dy:20}].concat([0,1,2,3,4,5].map(i=>{ const th=i*Math.PI/3;
      return {x:2*Math.cos(th), y:2*Math.sin(th), c:i%2, tex:'\\mathbf{s}_'+(i+2), dx:Math.cos(th)<-0.1?-8:8, dy:Math.sin(th)<-0.1?20:-10, anchor:Math.cos(th)<-0.1?'end':'start'}; })),
    dmin:[0,1], dminAt:[1.5,0.22], hideX:[-1,1], hideY:[-2,-1,1,2],
    nn:[[0,2],[0,3],[0,4],[0,5],[0,6],[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]]}),
  err:'Counting only the centre\'s neighbours, $N_{\\min}=6$. $N_{\\min}$ is the average over all seven points, and a ring point has three neighbours.',
  teach:'A variant: the hexagonal packing. It has a large $N_{\\min}$ but also a large $d_{\\min}$ for its energy.' },

/* ---- bound: the union bound and equal-energy comparisons -------------- */

{ id:'D4-29', module:'M4', type:'bound', src:'Final Q3 (variant)',
  stem:'Two designs carry three bits per symbol with the same average symbol energy $E_{s,\\text{avg}}$ over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. Design A is 8-PSK: eight equally likely points on a circle, $45^{\\circ}$ apart. Design B is the rectangle of points $c(a,b)$ with $a\\in\\{\\pm1,\\pm3\\}$, $b\\in\\{\\pm1\\}$ and a scale $c>0$. According to the information given above,',
  parts:['[7 pts] Find $d_{\\min}^{2}$ of each design in terms of $E_{s,\\text{avg}}$.',
         '[6 pts] Find $N_{\\min}$ of each design.',
         '[7 pts] Evaluate the nearest-neighbour approximation of $P_e$ for both at $E_{s,\\text{avg}}/N_0=20$.',
         '[5 pts] Say which design is better, and give its gain in $d_{\\min}^{2}$ in decibels.'],
  sol:'<b>Given.</b> 8-PSK and a $4\\times2$ rectangle at the same $E_{s,\\text{avg}}$. Equal priors.<br>'
     +'<b>Find.</b> $d_{\\min}^{2}$, $N_{\\min}$, $P_e$ at $20$, and the gain.<br>'
     +'<b>Method.</b> Write each $d_{\\min}^{2}$ as a multiple of the same $E_{s,\\text{avg}}$. Only then are the two $Q$ arguments comparable.<br>'
     +'<b>Solution — (a).</b> A: neighbours on a circle of radius $\\sqrt{E_s}$ are $2\\sqrt{E_s}\\sin(\\pi/8)$ apart, so $$d_A^{2}=4E_{s,\\text{avg}}\\sin^{2}\\frac\\pi8=0.5858\\,E_{s,\\text{avg}}.$$ B: the energies are $2c^{2}$ and $10c^{2}$, four of each, so $E_{s,\\text{avg}}=6c^{2}$. The spacing is $2c$, so $$d_B^{2}=4c^{2}=\\frac23E_{s,\\text{avg}}=0.6667\\,E_{s,\\text{avg}}.$$<br>'
     +'<b>Solution — (b).</b> A: every point has two neighbours, $N_{\\min}=2$. B: four inner points have three neighbours and four outer points two, so $N_{\\min}=(12+8)/8=2.5$.<br>'
     +'<b>Solution — (c).</b> $P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$ with $E_{s,\\text{avg}}/N_0=20$: $$\\begin{aligned}\\text{A: }&2\\,Q\\!\\left(\\sqrt{0.5858(10)}\\right)=2\\,Q(2.42)=2(0.007760)=0.01552\\\\\\text{B: }&2.5\\,Q\\!\\left(\\sqrt{0.6667(10)}\\right)=2.5\\,Q(2.58)=2.5(0.004940)=0.01235\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> B is better. Its larger $d_{\\min}^{2}$ outweighs its larger $N_{\\min}$. The gain is $10\\log_{10}(0.6667/0.5858)=0.56$ dB.<br>'
     +'<b>Check.</b> Compute $d_A^{2}$ from two points of the circle, $(\\sqrt{E_s},0)$ and $\\sqrt{E_s}(0.7071,0.7071)$: $E_s\\bigl[(1-0.7071)^{2}+0.7071^{2}\\bigr]=E_s(0.0858+0.5)=0.5858E_s$.',
  figSol: () => { const r=Math.sqrt(6);
    const A = cons({xr:[-3.4,3.4], yr:[-3.4,3.4], w:420, h:420, xstep:1, ystep:1,
      pts:[0,1,2,3,4,5,6,7].map(k=>({x:r*Math.cos(k*Math.PI/4), y:r*Math.sin(k*Math.PI/4)})),
      dmin:[0,1], dminAt:[2.2,1.75], dminAnchor:'start', hideY:[-1,1],
      over:a=>a.note(-3.3,3.0,'\\text{A: 8-PSK}',{tex:true,fs:14,color:C.ink})});
    const P8=[]; [-1,1].forEach(b=>[-3,-1,1,3].forEach((a,i)=>P8.push({x:a,y:b,c:b<0?i:(i+2)%4})));
    const B = cons({xr:[-4.2,4.2], yr:[-4.2,4.2], w:420, h:420, xstep:1, ystep:1, pts:P8,
      dmin:[5,6], dminAt:[0.15,1.35], dminAnchor:'start', hideX:[-2,2], hideY:[-1,1],
      over:a=>a.note(-4.1,3.7,'\\text{B: rectangle}',{tex:true,fs:14,color:C.ink})});
    return row([A,B],18); },
  err:'Comparing the two at equal spacing $c=1$ instead of equal energy. The rectangle then has $E_{s,\\text{avg}}=6$ and 8-PSK some other value, and the comparison says nothing about geometry.',
  teach:'Both panels are drawn at $E_{s,\\text{avg}}=6$, so the eye can compare $d_{\\min}$ directly. The gain is small, which is also worth saying.' },

{ id:'D4-30', module:'M4', type:'bound', src:'Final Q3 (variant)',
  stem:'Three equally likely messages use $s_1(t)=0$, $s_2(t)=2$ for $0\\le t<1$ (zero after), and $s_3(t)=3$ for $1\\le t<2$ (zero before). $T=2$ s. The channel adds white Gaussian noise with $N_0/2=0.25$ W/Hz. The receiver is the optimal ML receiver. According to the information given above,',
  parts:['[6 pts] Find the basis, the three signal points, and draw the decision regions.',
         '[6 pts] Find all pairwise distances, $d_{\\min}$ and $N_{\\min}$.',
         '[7 pts] Evaluate the union bound on the symbol error probability $P_e$.',
         '[6 pts] Evaluate the nearest-neighbour approximation and the minimum-distance bound, and put the three numbers in order.'],
  sol:'<b>Given.</b> Points built from two disjoint unit pulses, equal priors, $N_0=0.5$, $\\sigma=0.5$.<br>'
     +'<b>Find.</b> The points, the regions, the distances, and three estimates of $P_e$.<br>'
     +'<b>Method.</b> The union bound adds $Q\\!\\left(\\sqrt{d_{kj}^{2}/2N_0}\\right)$ over every ordered pair and divides by $M$. Here $\\sqrt{d^{2}/2N_0}=d$, because $2N_0=1$.<br>'
     +'<b>Solution — (a).</b> $\\psi_1(t)=1$ on $[0,1)$ and $\\psi_2(t)=1$ on $[1,2)$. The points are $\\mathbf{s}_1=(0,0)$, $\\mathbf{s}_2=(2,0)$ and $\\mathbf{s}_3=(0,3)$. The bisectors are $r_1=1$ (for $\\mathbf{s}_1,\\mathbf{s}_2$), $r_2=1.5$ (for $\\mathbf{s}_1,\\mathbf{s}_3$) and $-2r_1+3r_2=2.5$ (for $\\mathbf{s}_2,\\mathbf{s}_3$). All three meet at $(1,1.5)$. The region of $\\mathbf{s}_1$ is the quadrant $r_1<1$, $r_2<1.5$.<br>'
     +'<b>Solution — (b).</b> $d_{12}=2$, $d_{13}=3$ and $d_{23}=\\sqrt{4+9}=\\sqrt{13}=3.606$. So $d_{\\min}=2$. Only $\\mathbf{s}_1$ and $\\mathbf{s}_2$ are at $d_{\\min}$, each with one neighbour, so $N_{\\min}=(1+1+0)/3=2/3$.<br>'
     +'<b>Solution — (c).</b> Each pair appears twice in the double sum: $$\\begin{aligned}P_e&\\le\\frac13\\cdot2\\bigl[Q(2)+Q(3)+Q(3.61)\\bigr]\\\\&=\\frac23\\bigl[0.02275+0.001350+0.0001531\\bigr]\\\\&=\\frac23(0.02425)=0.01617\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> Nearest neighbour: $\\frac23Q(2.00)=0.01517$. Minimum distance: $(M-1)Q(2.00)=2(0.02275)=0.04550$. In order: $0.01517<0.01617<0.04550$. The nearest-neighbour value is below the union bound because it drops two real terms.<br>'
     +'<b>Check.</b> The region of $\\mathbf{s}_1$ is an exact quadrant, so its conditional error is exact: $1-(1-Q(2))(1-Q(3))=1-(0.97725)(0.99865)=0.02407$. The union bound for this point is $Q(2)+Q(3)=0.02410$, just above it, as a bound must be.',
  figSol: () => cons({xr:[-1.5,4], yr:[-1.5,4.5], w:500, h:520, xstep:1, ystep:1,
    pts:[{x:0,y:0,tex:'\\mathbf{s}_1',dx:-8,dy:18,anchor:'end'},{x:2,y:0,tex:'\\mathbf{s}_2'},{x:0,y:3,tex:'\\mathbf{s}_3',dx:-8,anchor:'end'}],
    dmin:[0,1], dminAt:[1.15,0.2], dminAnchor:'start', hideX:[1,2], hideY:[3], nn:[[0,2],[1,2]],
    over:a=>a.point(1,1.5,{color:C.ink,r:3})}),
  err:'Counting each pair once and not dividing by $M$. The union bound averages over the transmitted point, and each pair appears once from each end.',
  teach:'A small constellation where the three forms separate. The check uses the one region that is an exact quadrant, so the true value is known for one point.' }

]);

/* ======================================================================
   The scene that carries them.
   ====================================================================== */
window.DRILL_M4 = [

{ id:'m4-drill', module:'M4', nav:'Module 4 · practice questions',
  title:'Module 4 — practice questions',
  objective:'Thirty examination questions on the optimal receiver, with worked solutions.',
  keywords:'practice questions module 4 optimal receiver map ml threshold conditional density decision regions nearest neighbour union bound constellation',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · Practice D4-01 … D4-30'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question before opening its solution. Use these checks:<ul><li>The noise variance of each coordinate is $N_0/2$.</li><li>A MAP threshold moves towards the less likely symbol.</li><li>$P_b$ with unequal priors weights each conditional error by its prior.</li><li>$N_{\\min}$ is an average over the points and need not be an integer.</li></ul>'},
  {t:'rule', short:true},
  {t:'drill', module:'M4'}
]}

];
})();
