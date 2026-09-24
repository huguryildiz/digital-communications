/* ==========================================================================
   Practice questions — Module 1.

   Thirty questions in the form of the midterm and final examination
   questions on sampling, quantization and PCM. Each one is a statement and
   three or four lettered parts with point weights that sum to 25, and each
   worked solution ends in a figure that shows the answer. The worked solution
   is hidden until the reader asks for it.

   The five question types follow the examination: PCM design from an
   accuracy requirement, the spectrum of a product or a sinc, a sum of
   sinusoids through a uniform quantizer, a density with a fine quantizer, and
   a drawn density with a coarse quantizer. No number set is taken from an
   examination paper. Every number a solution states is re-derived by an
   independent route in verify/drills_m1.py.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;
const sinc = x => Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);

/* ---- figure helpers ---------------------------------------------------
   Every figure below is a function called when its solution is drawn, so
   it takes the palette in force. A legend is a card inside the plot it keys
   (DESIGN.md, Figures); a panel is positioned so that its legend sits in
   its own corner when a solution stacks two panels. */
/* The printed editions load this file without the app, so RENDER is absent
   there and the notes renderer's renderInline() typesets the legend instead. */
const mdL = l => (typeof RENDER !== 'undefined' ? RENDER.md : window.renderInline)(l);
const legend = (items, at) => `<div class="legend in-plot lg-at-${at||'tr'}">${items.map(([c,l,d])=>
  `<i class="lg-${c}${d==='dot'?' lg-dot':d?' lg-dash':''}">${mdL(l)}</i>`).join('')}</div>`;
const panel = (svg, lg) => `<div style="position:relative">${svg}${lg||''}</div>`;

/* The largest quantization error of an R-bit quantizer as a share of the
   peak-to-peak range: (Delta/2)/(2V) = 1/(2L) = 50/2^R per cent. */
function figAccuracy(o){
  const Rs = []; for(let R=o.R0-3; R<=o.R0+2; R++) Rs.push(R);
  const pct = R => 50/2**R, top = pct(o.R0-3);
  const a = P.Axes({w:700,h:300,xr:[o.R0-3.7,o.R0+2.7],yr:[0,top*1.55],
    xlabel:'R\\;(\\text{bits per sample})', ylabel:'\\text{largest error}\\;(\\%\\text{ of }2V_{\\max})',
    pad:{l:58,r:26,t:26,b:44}, xticksOverride:Rs, xtickfmt:v=>String(v), ytarget:4});
  if(o.band){
    a.rect(o.R0-3.7, o.band[0], o.R0+2.7, o.band[1], {fill:C.dec.out});
    a.note(o.R0+2.6, o.band[1], `${P.fmt(o.band[0],3)}\\le p<${P.fmt(o.band[1],3)}`, {tex:true, anchor:'end', dy:-12, color:C.out});
  }
  a.stem(Rs.filter(R=>R!==o.R0).map(R=>[R,pct(R)]), {color:C.mid});
  a.stem([[o.R0,pct(o.R0)]], {color:C.out});
  const items = [['mid','$50/2^{R}$ per cent'],['out','least $R$ that meets it']];
  if(o.p!=null){
    a.hline(o.p, {color:C.err, dash:'6 4', opacity:1});
    a.note(o.R0+2.6, o.p, `p=${o.p}\\%`, {tex:true, anchor:'end', dy:-12, color:C.err});
    items.push(['err','requirement $p$',1]);
  }
  return panel(a.svg(), legend(items));
}

/* A line spectrum and its copies around the multiples of f_s. `lines` holds
   [f, weight] for f >= 0; the weight is the magnitude of the impulse. */
function figLines(o){
  const wmax = Math.max(...o.lines.map(l=>l[1]));
  const a = P.Axes({w:720,h:280,xr:[-o.xmax,o.xmax],yr:[0,wmax*2.4],
    xlabel:`f\\;(\\text{${o.unit||'kHz'}})`, ylabel:'|X_\\delta(f)|',
    pad:{l:34,r:28,t:26,b:44}, xticksOverride:o.ticks, ytickfmt:()=>''});
  const put = (f,w,col,op) => { if(Math.abs(f) < 0.97*o.xmax) a.impulse(f,w,{color:col,label:false,opacity:op}); };
  for(const k of [-3,-2,-1,1,2,3]) o.lines.forEach(([f,w])=>{ put(k*o.fs+f,w,C.mid,0.85); if(f) put(k*o.fs-f,w,C.mid,0.85); });
  o.lines.forEach(([f,w])=>{ put(f,w,C.in); if(f) put(-f,w,C.in); });
  if(o.fg) a.span(o.W, o.fs-o.W, wmax*1.2, `f_g=${o.fg}`, {tex:true, fs:13, color:C.muted});
  return panel(a.svg(), legend([['in','$X(f)$'],['mid','copies at $\\pm f_s,\\ \\pm2f_s$']], 'tl'));
}

/* A continuous spectrum X(f) (zero outside |f| < B) and its copies. */
function figShape(o){
  const X = f => Math.abs(f) < o.B ? o.X(f) : null;
  const a = P.Axes({w:720,h:280,xr:[-o.xmax,o.xmax],yr:[0,o.peak*2.2],
    xlabel:`f\\;(\\text{${o.unit||'Hz'}})`, ylabel:'X_\\delta(f)',
    pad:{l:34,r:28,t:26,b:44}, xticksOverride:o.ticks, ytickfmt:()=>''});
  for(const k of [-3,-2,-1,1,2,3]){
    a.area(f=>X(f-k*o.fs)||0, k*o.fs-o.B, k*o.fs+o.B, {color:C.dec.mid});
    a.curve(f=>X(f-k*o.fs), {color:C.mid});
  }
  a.area(f=>X(f)||0, -o.B, o.B, {color:C.dec.in});
  a.curve(X, {color:C.in});
  if(o.fg) a.span(o.W, o.fs-o.W, o.peak*1.2, `f_g=${o.fg}`, {tex:true, fs:13, color:C.muted});
  if(o.mark) a.note(o.mark[0], o.mark[1], o.mark[2], {tex:true, anchor:'middle', dy:-10, color:C.in});
  return panel(a.svg(), legend([['in','$X(f)$'],['mid','copies at $\\pm f_s,\\ \\pm2f_s$']], 'tl'));
}

/* A waveform over a few periods with its maximum and minimum marked. The
   labels sit outside the band the curve fills, above the maximum line and
   below the minimum line, so the curve never crosses them. */
function figWave(o){
  const s = o.max - o.min;
  const a = P.Axes({w:720,h:o.h||290,xr:[o.t0,o.t1],yr:[o.min-0.3*s, o.max+(o.head||0.45)*s],
    xlabel:'t\\;(\\text{ms})', ylabel:'x(t)', pad:{l:56,r:28,t:26,b:44}, ytarget:5,
    xticksOverride:o.xticks||null});
  a.hline(o.max, {color:C.mid, dash:'5 4', opacity:1});
  if(o.minTo!=null) a.poly([[o.t0,o.min],[o.minTo,o.min]], {color:C.mid, width:1, dash:'5 4'});
  else a.hline(o.min, {color:C.mid, dash:'5 4', opacity:1});
  (o.parts||[]).forEach(f=>a.curve(f, {color:C.mid, width:1.5, dash:'5 4'}));
  a.curve(o.f, {color:C.in});
  (o.marks||[]).forEach(([t,v])=>a.point(t, v, {color:C.mid}));
  const lx = o.lx!=null ? o.lx : o.t0 + 0.02*(o.t1-o.t0);
  a.note(lx, o.max, o.maxLab, {tex:true, dy:-10, color:C.mid});
  if(o.minTo!=null) a.note(o.minTo+0.02*(o.t1-o.t0), o.min, o.minLab, {tex:true, dy:4, color:C.mid});
  else a.note(lx, o.min, o.minLab, {tex:true, dy:20, color:C.mid});
  return panel(a.svg(), o.legend ? legend(o.legend) : '');
}

/* A density with the power integrand x^2 f(x) shaded: its area is P_X. */
function figDensity(o){
  const g = x => (x < o.lo || x > o.hi) ? 0 : o.f(x);
  const w = o.hi - o.lo;
  const a = P.Axes({w:720,h:290,xr:[o.lo-0.3*w, o.hi+0.3*w],yr:[0,o.ymax],
    xlabel:'x', ylabel:'f_X(x)', pad:{l:52,r:28,t:26,b:44}, xticksOverride:o.xticks, ytarget:4});
  a.area(x=>x*x*g(x), o.lo, o.hi, {color:C.dec.mid});
  a.curve(x=>(x < o.lo || x > o.hi) ? null : x*x*o.f(x), {color:C.mid, dash:'6 4'});
  a.curve(g, {color:C.in, n:900});
  return panel(a.svg(), legend([['in','$f_X(x)$'],['mid','$x^{2}f_X(x)$ with area $P_X$',1]], o.at||'tr'));
}

/* A coarse quantizer: the staircase with its output levels written on it,
   then the density with the error integrand (x - Q(x))^2 f(x) shaded region
   by region. The shaded area is the noise power P_Q. Both panels share the
   x axis, so its numbers are written once, under the second panel. */
function figCoarse(o){
  const qy = o.qy || [-o.qr, o.qr];
  const a = P.Axes({w:720,h:230,xr:o.xr,yr:qy, xlabel:'x', ylabel:'\\mathbb{Q}(x)',
    pad:{l:52,r:28,t:26,b:44}, xticksOverride:o.xticks, xtickfmt:()=>'', ytickfmt:()=>'', ytarget:4});
  o.q.forEach(([lo,hi,v])=>{
    a.poly([[Math.max(lo,o.xr[0]),v],[Math.min(hi,o.xr[1]),v]], {color:C.mid, width:2.8});
    if(v) a.note((Math.max(lo,o.xr[0])+Math.min(hi,o.xr[1]))/2, v, P.fmt(v,2), {tex:true, anchor:'middle', dy:v>0?-12:22, color:C.mid});
  });
  const b = P.Axes({w:720,h:270,xr:o.xr,yr:[0,o.emax], xlabel:'x', ylabel:'(x-\\mathbb{Q}(x))^{2}f_X(x)',
    pad:{l:52,r:28,t:26,b:44}, xticksOverride:o.xticks, ytarget:4});
  const cuts = o.cuts;
  for(let i=0; i<cuts.length-1; i++){
    const lo = cuts[i], hi = cuts[i+1];
    let v = 0; for(const [l,h,w] of o.q) if((lo+hi)/2 > l && (lo+hi)/2 < h) v = w;
    const e = x => (x-v)*(x-v)*o.f(x);
    b.area(e, lo, hi, {color:C.dec.err, n:200});
    b.curve(x=>(x < lo || x > hi) ? null : e(x), {color:C.err});
  }
  b.curve(o.f, {color:C.in, width:1.6, dash:'6 4', n:900});
  return panel(a.svg())
       + panel(b.svg(), legend([['err','error integrand, area $P_Q$'],['in','$f_X(x)$',1]], 'tl'));
}

/* A drawn density, in the form the question gives it: the height is c. */
function figPdf(o){
  const a = P.Axes({w:640,h:240,xr:o.xr,yr:[0,1.4], xlabel:'x', ylabel:'f_X(x)',
    pad:{l:52,r:26,t:26,b:44}, xticksOverride:o.xticks, ytickfmt:()=>'', ytarget:2});
  (o.levels||[[1,'c']]).forEach(([y,lab,x1])=>{
    a.poly([[o.xr[0],y],[x1,y]], {color:C.ruleStrong, width:1.1, dash:'4 4'});
    a.note(o.xr[0], y, lab, {tex:true, anchor:'end', dx:-8, color:C.ink});
  });
  a.poly(o.pts, {color:C.in});
  return a.svg();
}

/* The largest number of bits per sample a link of rate Rb allows at the
   sampling rate f_s: the floor of Rb/f_s. */
function figBudget(o){
  const a = P.Axes({w:700,h:290,xr:o.xr,yr:o.yr, xlabel:`f_s\\;(\\text{${o.unit}})`,
    ylabel:'\\text{bits per sample}', pad:{l:52,r:28,t:26,b:44}, xticksOverride:o.xticks, ystep:1,
    xtickfmt:v=>P.fmt(v,2)});
  if(o.forbid) a.rect(o.xr[0], o.yr[0], o.forbid, o.yr[1], {fill:C.dec.err});
  a.curve(f=>o.Rb/f, {color:C.h, dash:'6 4'});
  for(let R=o.yr[0]; R<=o.yr[1]; R++){
    const f1 = Math.min(o.xr[1], o.Rb/R), f0 = Math.max(o.xr[0], o.Rb/(R+1));
    if(f1 > f0) a.poly([[f0,R],[f1,R]], {color:C.mid, width:2.6});
  }
  a.point(o.pick[0], o.pick[1], {color:C.out, r:5.5});
  return panel(a.svg(), legend([['h','$R_b/f_s$',1],['mid','whole bits $\\lfloor R_b/f_s\\rfloor$'],['out','design point','dot']]));
}

/* ======================================================================
   The taxonomy: the five examination question types of this module.
   ====================================================================== */
CONTENT.DRILLTYPES.M1 = [
  { k:'pcm', name:'PCM design from an accuracy requirement',
    asks:'A sinusoid or a bandwidth is given with an accuracy requirement or a level count. Find the bits per sample, the sampling rate, the bit rate and the symbol rate.',
    method:['Turn the requirement into a bound on the step. The largest error $\\Delta/2$ must stay below the stated share of the peak-to-peak value $2V_{\\max}$.',
            'Put $\\Delta=2V_{\\max}/L$ and solve for $L$. Round $L$ up to a power of two, and take $R=\\log_2 L$.',
            'The sampling rate is $2W$, or $2W$ times the stated margin. Then $R_b=Rf_s$, and an $M$-level PAM system sends $R_b/\\log_2 M$ symbols a second.'],
    go:'m1-encode' },

  { k:'spectrum', name:'The spectrum of a product, a square or a sinc',
    asks:'A signal is given as a product of sinusoids, a squared cosine or a sinc expression. Find its highest frequency, the sampling rate, the bit rate and the step size.',
    method:['Expand products and squares into sums with $2\\cos A\\cos B=\\cos(A-B)+\\cos(A+B)$. For sinc factors, a product in time is a convolution in frequency, so the bandwidths add.',
            'With a guard band the rate is $f_s=2W+f_g$. A required bit rate fixes $f_s=R_b/R$, and then $f_g=f_s-2W$.',
            'The step is $\\Delta=(x_{\\max}-x_{\\min})/L$. Find the two extremes from the signal itself, not from the amplitudes of its terms.'],
    go:'m1-ex-nyquist' },

  { k:'wave', name:'A sum of sinusoids through a uniform quantizer',
    asks:'A sum of sinusoids is sampled at the Nyquist rate and uniformly quantized. Find the bit rate, the step size and the SQNR in decibels.',
    method:['The Nyquist rate is twice the highest frequency present.',
            'Check whether the terms can peak together. If they cannot, write the sum as a function of one cosine and find its extremes.',
            'Terms at different frequencies add their powers $A_i^{2}/2$. Then $\\mathrm{SQNR}=P_X/(\\Delta^{2}/12)$, or $\\alpha+6.02R$ in decibels.'],
    go:'m1-sqnr' },

  { k:'fine', name:'A density with a constant and a fine uniform quantizer',
    asks:'A density is given with an unknown constant, and a uniform quantizer with many levels covers its range. Find the constant, the SQNR and the bit rate.',
    method:['Find the constant from $\\int f_X(x)\\,dx=1$ first. Split the integral at zero when the density contains $|x|$.',
            'The signal power is $P_X=\\int x^{2}f_X(x)\\,dx$, the full mean square with the mean included.',
            'With many levels the noise power is $\\Delta^{2}/12$, where $\\Delta$ is the range over $L$. Then $\\mathrm{SQNR}=P_X/(\\Delta^{2}/12)$.'],
    go:'m1-ex-unif' },

  { k:'coarse', name:'A drawn density and a coarse quantizer',
    asks:'A trapezoidal, triangular or stepped density is drawn with its height $c$, and a quantizer with two to four outputs is given. Find $c$, the two powers and the SQNR.',
    method:['Find $c$ from the area of the drawn shape. Then write the density on each straight piece.',
            'Split the noise integral $\\int(x-\\mathbb{Q}(x))^{2}f_X(x)\\,dx$ at every quantizer boundary and every corner of the density, and integrate each piece.',
            'Do not use $\\Delta^{2}/12$ for a coarse quantizer. Its error is not uniform, and outside the covered range it has no bound.'],
    go:'m1-ex-gauss' }
];

/* ======================================================================
   The questions.
   ====================================================================== */
CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- A. PCM design from an accuracy requirement --------------------- */

{ id:'D1-01', module:'M1', type:'pcm', src:'MT Q1',
  stem:'Assume that a sinusoidal message signal is defined as $x(t)=V_{\\max}\\cos(12000\\pi t)$, where $V_{\\max}$ is the maximum amplitude of the message signal. This analog message signal is sampled at the Nyquist rate and quantized by using a uniform quantizer. The quantization noise is a uniform random variable between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$, where $\\Delta$ is the step size. The quantization noise is required not to exceed $\\pm0.25\\%$ of the peak-to-peak message signal. Quantized data are encoded by using a $4$-level PAM system.',
  parts:['[9 pts] What is the minimum number of bits per sample for this PAM system?',
         '[8 pts] Calculate the bit rate of this system.',
         '[8 pts] What is the symbol rate of this system?'],
  sol:'<b>Given.</b> $x(t)=V_{\\max}\\cos(2\\pi(6000)t)$, Nyquist sampling, noise within $\\pm0.25\\%$ of the peak-to-peak value, $4$-level PAM.<br>'
     +'<b>Find.</b> The least number of bits per sample $R$, the bit rate $R_b$ and the symbol rate $R_s$.<br>'
     +'<b>Method.</b> The requirement bounds the step $\\Delta$. That bound gives a least level count $L$, rounded up to a power of two. The rates then follow from $R_b=Rf_s$ and $R_s=R_b/\\log_2 M$.<br>'
     +'<b>Solution — (a).</b> The peak-to-peak value is $2V_{\\max}$, and the largest error is $\\Delta/2$. The requirement reads:'
     +'$$\\frac{\\Delta}{2}\\le0.0025\\,(2V_{\\max})=0.005\\,V_{\\max}.$$'
     +'Multiply both sides by $2$ to get $\\Delta\\le0.01\\,V_{\\max}$. The quantizer spans $[-V_{\\max},V_{\\max}]$, so $\\Delta=2V_{\\max}/L$:'
     +'$$\\begin{aligned}\\frac{2V_{\\max}}{L}&\\le0.01\\,V_{\\max}\\\\L&\\ge\\frac{2}{0.01}\\\\L&\\ge200\\end{aligned}$$'
     +'The level count must be a power of two. The smallest one above $200$ is $L=256=2^{8}$, so $R=8$ bits per sample.<br>'
     +'<b>Solution — (b).</b> The message frequency is $f_0=12000\\pi/(2\\pi)=6000$ Hz. The Nyquist rate is $f_s=2f_0=12\\,000$ samples per second.'
     +'$$\\begin{aligned}R_b&=Rf_s\\\\&=8\\times12\\,000\\\\&=96\\,000~\\text{bit/s}\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> A $4$-level PAM symbol carries $\\log_2 4=2$ bits.'
     +'$$\\begin{aligned}R_s&=\\frac{R_b}{\\log_2 M}\\\\&=\\frac{96\\,000}{2}\\\\&=48\\,000~\\text{symbols/s}\\end{aligned}$$<br>'
     +'<b>Check.</b> With $L=256$ the largest error is $\\Delta/2=V_{\\max}/256=0.00391\\,V_{\\max}$. Divided by $2V_{\\max}$ this is $0.195\\%$, inside $0.25\\%$. With $L=128$ it is $0.391\\%$, outside. So $8$ bits is the least.',
  err:'Measuring the bound against $V_{\\max}$ instead of the peak-to-peak value $2V_{\\max}$. Then $\\Delta\\le0.005\\,V_{\\max}$, $L\\ge400$ and $R=9$, one bit too many.',
  teach:'Close variant of the examination shape. Part (a) carries the weight, and most lost marks come from the peak-to-peak factor or from rounding $L$ down.',
  figSol:()=>figAccuracy({p:0.25, R0:8}) },

{ id:'D1-02', module:'M1', type:'pcm', src:'MT Q1',
  stem:'Assume that a sinusoidal message signal is defined as $x(t)=V_{\\max}\\sin(7000\\pi t)$, where $V_{\\max}$ is the maximum amplitude of the message signal. It is sampled at a rate $25\\%$ greater than the Nyquist rate and quantized by using a uniform quantizer. The quantization noise is a uniform random variable between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$. It is required not to exceed $\\pm0.8\\%$ of the peak-to-peak message signal. Quantized data are encoded by using an $8$-level PAM system.',
  parts:['[7 pts] What is the minimum number of bits per sample?',
         '[6 pts] Determine the sampling rate.',
         '[6 pts] Calculate the bit rate of this system.',
         '[6 pts] What is the symbol rate of this system?'],
  sol:'<b>Given.</b> $x(t)=V_{\\max}\\sin(2\\pi(3500)t)$, sampling $25\\%$ above the Nyquist rate, noise within $\\pm0.8\\%$ of the peak-to-peak value, $8$-level PAM.<br>'
     +'<b>Find.</b> $R$, $f_s$, $R_b$ and $R_s$.<br>'
     +'<b>Method.</b> Bound $\\Delta$ from the requirement, then $L$ and $R$. A percentage above the Nyquist rate multiplies that rate.<br>'
     +'<b>Solution — (a).</b> The largest error $\\Delta/2$ is compared with the peak-to-peak value $2V_{\\max}$:'
     +'$$\\begin{aligned}\\frac{\\Delta}{2}&\\le0.008\\,(2V_{\\max})\\\\\\Delta&\\le0.032\\,V_{\\max}\\end{aligned}$$'
     +'With $\\Delta=2V_{\\max}/L$ this becomes $2/L\\le0.032$, so $L\\ge62.5$. The smallest power of two above $62.5$ is $L=64$, and $R=\\log_2 64=6$ bits per sample.<br>'
     +'<b>Solution — (b).</b> The frequency is $f_0=3500$ Hz, so the Nyquist rate is $2f_0=7000$ Hz.'
     +'$$\\begin{aligned}f_s&=1.25\\times7000\\\\&=8750~\\text{samples/s}\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}R_b&=Rf_s\\\\&=6\\times8750\\\\&=52\\,500~\\text{bit/s}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> An $8$-level symbol carries $\\log_2 8=3$ bits.'
     +'$$\\begin{aligned}R_s&=\\frac{52\\,500}{3}\\\\&=17\\,500~\\text{symbols/s}\\end{aligned}$$<br>'
     +'<b>Check.</b> Each $6$-bit sample fills exactly two $3$-bit symbols. So $R_s=2f_s=2(8750)=17\\,500$ symbols per second, the same number. The error bound with $L=64$ is $50/64=0.78\\%$, just inside $0.8\\%$.',
  err:'Computing the rate as $2(3500)+0.25(3500)$. The $25\\%$ multiplies the Nyquist rate of $7000$ Hz, not the tone frequency.',
  teach:'Close variant. The requirement is set so that $L=64$ passes by a small margin, which rewards exact arithmetic over estimation.',
  figSol:()=>figAccuracy({p:0.8, R0:6}) },

{ id:'D1-03', module:'M1', type:'pcm', src:'MT Q1',
  stem:'Let $X(t)$ have a bandwidth of $3.2$ MHz. This signal is sampled, quantized and binary encoded to obtain a PCM signal.',
  parts:['[7 pts] Determine the sampling rate if $X(t)$ is sampled at a rate $25\\%$ greater than the Nyquist rate.',
         '[6 pts] If the samples of $X(t)$ are quantized by using a uniform quantizer with $2048$ levels, determine the number of bits required per sample.',
         '[6 pts] Calculate the bit rate of this system in bits per second.',
         '[6 pts] Find the least channel bandwidth that can carry this PCM signal.'],
  sol:'<b>Given.</b> $W=3.2$ MHz, a rate $25\\%$ above the Nyquist rate, $L=2048$.<br>'
     +'<b>Find.</b> $f_s$, $R$, $R_b$ and the least channel bandwidth $B_T$.<br>'
     +'<b>Method.</b> The Nyquist rate is $2W$, and the margin multiplies it. Then $R=\\log_2 L$ and $R_b=Rf_s$. A binary stream needs at least $R_b/2$ hertz.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}f_s&=1.25\\,(2W)\\\\&=1.25\\times6.4\\\\&=8~\\text{MHz}\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> $2048=2^{11}$, so $R=\\log_2 2048=11$ bits per sample.<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}R_b&=Rf_s\\\\&=11\\times8\\times10^{6}\\\\&=88\\times10^{6}~\\text{bit/s}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}B_T&\\ge\\frac{R_b}{2}\\\\&=\\frac{88\\times10^{6}}{2}\\\\&=44~\\text{MHz}\\end{aligned}$$<br>'
     +'<b>Check.</b> At the Nyquist rate the bit rate would be $11\\times6.4=70.4$ Mbit/s. The margin scales it by $1.25$, and $1.25\\times70.4=88$ Mbit/s. The copies in the figure leave a guard band $f_s-2W=1.6$ MHz.',
  err:'Computing $f_s=2(3.2)+0.25(3.2)=7.2$ MHz. The margin multiplies the Nyquist rate $6.4$ MHz, not the bandwidth.',
  teach:'Close variant with a fourth part on the channel bandwidth, taken from the PCM bandwidth scene. It links the bit rate to a physical band.',
  figSol:()=>figShape({X:f=>1-0.55*(f/3.2)**2, B:3.2, peak:1, fs:8, W:3.2, fg:'1.6', xmax:12.6, unit:'MHz',
    ticks:[-8,-3.2,3.2,8]}) },

{ id:'D1-04', module:'M1', type:'pcm', src:'MT Q1 (variant)',
  stem:'A PCM system carries the sinusoid $x(t)=V_{\\max}\\cos(10000\\pi t)$. It samples at the Nyquist rate and quantizes uniformly over $[-V_{\\max},V_{\\max}]$. The quantization noise is uniform between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$. The bits are sent by a $16$-level PAM system, and the measured symbol rate is $17\\,500$ symbols per second.',
  parts:['[6 pts] Find the bit rate and the number of bits per sample.',
         '[6 pts] Find the number of quantization levels and the step size in terms of $V_{\\max}$.',
         '[7 pts] Find the largest quantization error as a percentage of the peak-to-peak message signal.',
         '[6 pts] The design came from a requirement of $\\pm p\\%$ of the peak-to-peak signal. Find the range of $p$ for which this number of bits is the minimum.'],
  sol:'<b>Given.</b> $f_0=5000$ Hz, Nyquist sampling, $16$-level PAM at $R_s=17\\,500$ symbols per second.<br>'
     +'<b>Find.</b> $R_b$, $R$, $L$, $\\Delta$, the largest error in per cent, and the range of $p$.<br>'
     +'<b>Method.</b> Work the design backwards. The symbol rate gives the bit rate, and the sampling rate gives the bits per sample. The last part asks when $R$ passes and $R-1$ fails.<br>'
     +'<b>Solution — (a).</b> A $16$-level symbol carries $\\log_2 16=4$ bits, and $f_s=2f_0=10\\,000$ samples per second.'
     +'$$\\begin{aligned}R_b&=R_s\\log_2 M=17\\,500\\times4=70\\,000~\\text{bit/s}\\\\R&=\\frac{R_b}{f_s}=\\frac{70\\,000}{10\\,000}=7~\\text{bits per sample}\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> $L=2^{7}=128$, and $\\Delta=2V_{\\max}/128=V_{\\max}/64=0.0156\\,V_{\\max}$.<br>'
     +'<b>Solution — (c).</b> The largest error is $\\Delta/2=V_{\\max}/128$. Divide it by the peak-to-peak value:'
     +'$$\\frac{V_{\\max}/128}{2V_{\\max}}=\\frac{1}{256}=0.391\\%.$$<br>'
     +'<b>Solution — (d).</b> Seven bits meet the requirement when $0.391\\le p$. Six bits would give $L=64$ and a largest error of $1/128=0.781\\%$. Six bits fail when $p<0.781$. So seven bits is the minimum for $0.391\\le p<0.781$.<br>'
     +'<b>Check.</b> Take $p=0.5$, inside the range. Then $\\Delta/2\\le0.005(2V_{\\max})$ gives $L\\ge1/0.01=100$, so $L=128$ and $R=7$ again.',
  err:'Multiplying the symbol rate by $16$ instead of by $\\log_2 16=4$. A symbol with $16$ levels carries $4$ bits, not $16$.',
  teach:'Creative variant: the examination question run backwards. Part (d) makes the student see the requirement as an interval, which is what the rounding up hides.',
  figSol:()=>figAccuracy({R0:7, band:[0.390625, 0.78125]}) },

{ id:'D1-05', module:'M1', type:'pcm', src:'MT Q1 (variant)',
  stem:'Assume that a sinusoidal message signal is defined as $x(t)=V_{\\max}\\cos(18000\\pi t)$. It is sampled at the Nyquist rate and quantized by using a uniform quantizer. The quantization noise is uniform between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$. It is required not to exceed $\\pm0.1\\%$ of the peak-to-peak message signal. The bits are sent by an $M$-level PAM system over a channel that accepts at most $60\\,000$ symbols per second.',
  parts:['[8 pts] What is the minimum number of bits per sample?',
         '[6 pts] Calculate the bit rate of this system.',
         '[5 pts] Find the smallest PAM order $M$, a power of two, that the channel accepts.',
         '[6 pts] Calculate the symbol rate with that $M$.'],
  sol:'<b>Given.</b> $f_0=9000$ Hz, Nyquist sampling, noise within $\\pm0.1\\%$ of the peak-to-peak value, at most $60\\,000$ symbols per second.<br>'
     +'<b>Find.</b> $R$, $R_b$, the least $M$ and the symbol rate.<br>'
     +'<b>Method.</b> Bound $\\Delta$ to get $R$. The symbol rate is $R_b/k$ with $k=\\log_2 M$ bits a symbol. Solve $R_b/k\\le60\\,000$ for the smallest whole $k$.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}\\frac{\\Delta}{2}&\\le0.001\\,(2V_{\\max})\\\\\\Delta&\\le0.004\\,V_{\\max}\\\\\\frac{2V_{\\max}}{L}&\\le0.004\\,V_{\\max}\\\\L&\\ge500\\end{aligned}$$'
     +'The smallest power of two above $500$ is $512$, so $R=9$ bits per sample.<br>'
     +'<b>Solution — (b).</b> $f_s=2(9000)=18\\,000$ samples per second.'
     +'$$\\begin{aligned}R_b&=9\\times18\\,000\\\\&=162\\,000~\\text{bit/s}\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}\\frac{162\\,000}{k}&\\le60\\,000\\\\k&\\ge\\frac{162\\,000}{60\\,000}\\\\k&\\ge2.7\\end{aligned}$$'
     +'The smallest whole $k$ is $3$, so $M=2^{3}=8$.<br>'
     +'<b>Solution — (d).</b> $R_s=162\\,000/3=54\\,000$ symbols per second.<br>'
     +'<b>Check.</b> With $M=4$ the symbol rate is $162\\,000/2=81\\,000$, above the limit. With $M=8$ it is $54\\,000$, below it. So $8$ is the least order.',
  err:'Rounding $k=2.7$ down to $2$. Then $R_s=81\\,000$ symbols per second and the channel limit is broken. A bound of the form $k\\ge2.7$ rounds up.',
  teach:'Creative variant: the PAM order is the unknown. It checks that the student treats bits per symbol and levels per symbol as different quantities.',
  figSol:()=>{
    const ks=[1,2,3,4,5,6], rs=k=>162/k;
    const a=P.Axes({w:700,h:300,xr:[0.3,6.7],yr:[0,250],xlabel:'k=\\log_2 M\\;(\\text{bits per symbol})',
      ylabel:'R_s\\;(\\text{thousand symbols/s})',pad:{l:58,r:26,t:26,b:44},xticksOverride:ks,xtickfmt:String,ytarget:5});
    a.stem(ks.filter(k=>k!==3).map(k=>[k,rs(k)]),{color:C.mid});
    a.stem([[3,rs(3)]],{color:C.out});
    a.hline(60,{color:C.err,dash:'6 4',opacity:1});
    a.note(6.6,60,'60\\text{ limit}',{tex:true,anchor:'end',dy:-12,color:C.err});
    return panel(a.svg(), legend([['mid','$R_s=R_b/k$'],['out','least $k$ within the limit'],['err','channel limit',1]]));
  } },

{ id:'D1-06', module:'M1', type:'pcm', src:'MT Q1 (variant)',
  stem:'Let $X(t)$ have a bandwidth of $2.5$ MHz. It is sampled at a rate $30\\%$ greater than the Nyquist rate, quantized by a uniform quantizer and binary encoded. The PCM signal must fit a link that carries $64$ Mbit/s. Assume that $1$ Mbit/s $=10^{6}$ bit/s.',
  parts:['[6 pts] Determine the sampling rate.',
         '[7 pts] Find the largest number of bits per sample, and the number of levels, that the link allows.',
         '[6 pts] Calculate the bit rate of the resulting system.',
         '[6 pts] For a full-scale sinusoidal test signal, calculate the SQNR in dB.'],
  sol:'<b>Given.</b> $W=2.5$ MHz, a rate $30\\%$ above the Nyquist rate, a link of $64$ Mbit/s.<br>'
     +'<b>Find.</b> $f_s$, the largest $R$ and its $L$, $R_b$, and the SQNR of a full-scale sinusoid.<br>'
     +'<b>Method.</b> The link bounds $Rf_s$ from above. With $f_s$ fixed, $R$ is the largest whole number with $Rf_s\\le64$ Mbit/s. For a full-scale sinusoid $3P_X/x_{\\max}^{2}=1.5$.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}f_s&=1.30\\,(2W)\\\\&=1.30\\times5\\\\&=6.5~\\text{MHz}\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}R\\,(6.5\\times10^{6})&\\le64\\times10^{6}\\\\R&\\le\\frac{64}{6.5}=9.85\\end{aligned}$$'
     +'The largest whole $R$ is $9$, so $L=2^{9}=512$.<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}R_b&=9\\times6.5\\times10^{6}\\\\&=58.5\\times10^{6}~\\text{bit/s}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> A sinusoid of amplitude $A$ has $P_X=A^{2}/2$ and fills $[-A,A]$. With $\\Delta=2A/L$:'
     +'$$\\begin{aligned}\\mathrm{SQNR}&=\\frac{A^{2}/2}{(2A/L)^{2}/12}\\\\&=\\frac{3L^{2}}{2}=\\frac{3(512)^{2}}{2}=393\\,216\\\\&=10\\log_{10}393\\,216=55.95~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> Ten bits would need $10\\times6.5=65$ Mbit/s, above the link rate. The rule $1.76+6.02R$ gives $1.76+6.02(9)=55.94$ dB, the same to rounding.',
  err:'Rounding $9.85$ up to $10$ bits. Here the bound is an upper limit set by the link, so the whole number is taken below it.',
  teach:'Creative variant: the bit budget reverses the rounding direction of part (a) of the examination question. Ask the student to say which way to round before computing.',
  figSol:()=>figBudget({Rb:64, xr:[4.6,8.4], yr:[7,14], xticks:[5,6,6.5,7,8], unit:'MHz', pick:[6.5,9]}) },

/* ---- B. The spectrum of a product, a square or a sinc --------------- */

{ id:'D1-07', module:'M1', type:'spectrum', src:'MT Q1',
  stem:'Let $x(t)=10\\cos(3000\\pi t)\\cos(6000\\pi t)$ be sampled and quantized by using a $512$-level uniform quantizer. Assume that $1$ kbit/s $=1000$ bit/s.',
  parts:['[6 pts] Determine the minimum sampling rate if a guard band of $1$ kHz is required.',
         '[6 pts] Calculate the bit rate of this system.',
         '[6 pts] If the data rate of this system is required as $108$ kbit/s, what should the guard band be?',
         '[7 pts] Calculate the step size of the uniform quantizer.'],
  sol:'<b>Given.</b> A product of two cosines, a guard band of $1$ kHz, $L=512$.<br>'
     +'<b>Find.</b> $f_s$, $R_b$, the guard band for $108$ kbit/s, and $\\Delta$.<br>'
     +'<b>Method.</b> Expand the product into a sum first. The highest frequency of the sum sets $W$, and $f_s=2W+f_g$.<br>'
     +'<b>Solution — (a).</b> Use $2\\cos A\\cos B=\\cos(A-B)+\\cos(A+B)$ with $A=2\\pi(1500)t$ and $B=2\\pi(3000)t$:'
     +'$$\\begin{aligned}x(t)&=5\\,[\\cos(A-B)+\\cos(A+B)]\\\\&=5\\cos(2\\pi(1500)t)+5\\cos(2\\pi(4500)t)\\end{aligned}$$'
     +'The cosine is even, so $\\cos(A-B)=\\cos(B-A)$. The highest frequency is $W=4.5$ kHz.'
     +'$$\\begin{aligned}f_s&=2W+f_g\\\\&=9+1\\\\&=10~\\text{kHz}\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> $R=\\log_2 512=9$ bits, so $R_b=9\\times10\\,000=90\\,000$ bit/s $=90$ kbit/s.<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}f_s&=\\frac{R_b}{R}=\\frac{108\\,000}{9}=12~\\text{kHz}\\\\f_g&=f_s-2W=12-9=3~\\text{kHz}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> At $t=0$ both factors are $1$, so $x_{\\max}=10$. At $t=1/3000$ s the first factor is $\\cos\\pi=-1$ and the second is $\\cos2\\pi=1$, so $x_{\\min}=-10$.'
     +'$$\\begin{aligned}\\Delta&=\\frac{x_{\\max}-x_{\\min}}{L}\\\\&=\\frac{20}{512}\\\\&=0.0391\\end{aligned}$$<br>'
     +'<b>Check.</b> Evaluate the expanded form at $t=1/3000$ s: $5\\cos(\\pi)+5\\cos(3\\pi)=-5-5=-10$. It agrees with the product form. The product cannot pass $10$ in size, since each factor is at most $1$.',
  err:'Taking $W=3$ kHz from the factor $\\cos(6000\\pi t)$. The product holds a $4.5$ kHz term that neither factor has.',
  teach:'Close variant of the examination shape. Part (c) is the reverse question, and the check in part (d) that the minimum is really $-10$ is worth asking for aloud.',
  figSol:()=>figLines({lines:[[1.5,2.5],[4.5,2.5]], fs:10, W:4.5, fg:'1', xmax:15.5, ticks:[-10,-4.5,4.5,10]}) },

{ id:'D1-08', module:'M1', type:'spectrum', src:'MT Q1',
  stem:'Let $x(t)=5\\sin(2000\\pi t)\\cos(8000\\pi t)$ be sampled and quantized by using a $64$-level uniform quantizer. Assume that $1$ kbit/s $=1000$ bit/s.',
  parts:['[6 pts] Determine the minimum sampling rate if a guard band of $1.5$ kHz is required.',
         '[6 pts] Calculate the bit rate of this system.',
         '[6 pts] If the data rate of this system is required as $78$ kbit/s, what should the guard band be?',
         '[7 pts] Calculate the step size of the uniform quantizer.'],
  sol:'<b>Given.</b> A product of a sine and a cosine, a guard band of $1.5$ kHz, $L=64$.<br>'
     +'<b>Find.</b> $f_s$, $R_b$, the guard band for $78$ kbit/s, and $\\Delta$.<br>'
     +'<b>Method.</b> Expand the product with $2\\sin A\\cos B=\\sin(A+B)+\\sin(A-B)$. Then $f_s=2W+f_g$ and $R_b=Rf_s$.<br>'
     +'<b>Solution — (a).</b> Put $A=2\\pi(1000)t$ and $B=2\\pi(4000)t$:'
     +'$$\\begin{aligned}x(t)&=2.5\\,[\\sin(A+B)+\\sin(A-B)]\\\\&=2.5\\sin(2\\pi(5000)t)-2.5\\sin(2\\pi(3000)t)\\end{aligned}$$'
     +'The sine is odd, so $\\sin(A-B)=-\\sin(B-A)$. The highest frequency is $W=5$ kHz.'
     +'$$\\begin{aligned}f_s&=2W+f_g\\\\&=10+1.5\\\\&=11.5~\\text{kHz}\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> $R=\\log_2 64=6$ bits, so $R_b=6\\times11\\,500=69\\,000$ bit/s $=69$ kbit/s.<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}f_s&=\\frac{78\\,000}{6}=13~\\text{kHz}\\\\f_g&=13-10=3~\\text{kHz}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> At $t=1/4000$ s the sine is $\\sin(\\pi/2)=1$ and the cosine is $\\cos2\\pi=1$, so $x_{\\max}=5$. At $t=3/4000$ s the sine is $-1$ and the cosine is $\\cos6\\pi=1$, so $x_{\\min}=-5$.'
     +'$$\\begin{aligned}\\Delta&=\\frac{5-(-5)}{64}\\\\&=0.156\\end{aligned}$$<br>'
     +'<b>Check.</b> Evaluate the expanded form at $t=1/4000$ s: $2.5\\sin(2.5\\pi)-2.5\\sin(1.5\\pi)=2.5+2.5=5$. It agrees with the product form.',
  err:'Writing $\\sin A\\cos B$ with the cosine identity. The expansion of a sine times a cosine gives sines, and the frequencies are still $A\\pm B$.',
  teach:'Close variant with a sine factor. The frequencies are those of the cosine product, and the extremes need a separate instant for each.',
  figSol:()=>figLines({lines:[[3,1.25],[5,1.25]], fs:11.5, W:5, fg:'1.5', xmax:17.5, ticks:[-11.5,-5,5,11.5]}) },

{ id:'D1-09', module:'M1', type:'spectrum', src:'MT Q1',
  stem:'Let $x(t)=8\\cos^{2}(3000\\pi t)$ be sampled and quantized by using a $256$-level uniform quantizer that spans the range of $x(t)$. Assume that $1$ kbit/s $=1000$ bit/s.',
  parts:['[6 pts] Determine the minimum sampling rate if a guard band of $2$ kHz is required.',
         '[6 pts] Calculate the bit rate of this system.',
         '[6 pts] If the data rate of this system is required as $72$ kbit/s, what should the guard band be?',
         '[7 pts] Calculate the step size of the uniform quantizer.'],
  sol:'<b>Given.</b> A squared cosine, a guard band of $2$ kHz, $L=256$ over the range of $x(t)$.<br>'
     +'<b>Find.</b> $f_s$, $R_b$, the guard band for $72$ kbit/s, and $\\Delta$.<br>'
     +'<b>Method.</b> Write the square as a sum with $\\cos^{2}\\theta=\\tfrac12(1+\\cos2\\theta)$. The square doubles the frequency and adds a constant.<br>'
     +'<b>Solution — (a).</b> With $\\theta=2\\pi(1500)t$:'
     +'$$\\begin{aligned}x(t)&=8\\cdot\\tfrac12\\,(1+\\cos2\\theta)\\\\&=4+4\\cos(2\\pi(3000)t)\\end{aligned}$$'
     +'The highest frequency is $W=3$ kHz.'
     +'$$\\begin{aligned}f_s&=2W+f_g\\\\&=6+2\\\\&=8~\\text{kHz}\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> $R=\\log_2 256=8$ bits, so $R_b=8\\times8000=64\\,000$ bit/s $=64$ kbit/s.<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}f_s&=\\frac{72\\,000}{8}=9~\\text{kHz}\\\\f_g&=9-6=3~\\text{kHz}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> A square is never negative, so $x_{\\min}=0$, reached at $t=1/6000$ s. The largest value is $x(0)=8$.'
     +'$$\\begin{aligned}\\Delta&=\\frac{8-0}{256}\\\\&=0.03125\\end{aligned}$$<br>'
     +'<b>Check.</b> The expanded form gives the same range: $4+4\\cos(\\cdot)$ runs from $4-4=0$ to $4+4=8$. The constant $4$ is the impulse at $f=0$ in the figure.',
  err:'Taking $W=1.5$ kHz from the argument $3000\\pi t$. Squaring doubles the frequency, so the tone sits at $3$ kHz.',
  teach:'Close variant with a square in place of a product. The range is one-sided, so the step is the range over $L$, not $2x_{\\max}/L$.',
  figSol:()=>figLines({lines:[[0,4],[3,2]], fs:8, W:3, fg:'2', xmax:13, ticks:[-8,-3,3,8]}) },

{ id:'D1-10', module:'M1', type:'spectrum', src:'Final Q1',
  stem:'The signal $$x(t)=\\left(\\frac{\\sin(200\\pi t)}{20\\pi t}\\right)^{2}$$ is sampled at the Nyquist rate. The samples are uniformly quantized with $256$ levels over the range of $x(t)$. Use $\\operatorname{sinc}(u)=\\sin(\\pi u)/(\\pi u)$. According to the information given above,',
  parts:['[8 pts] Calculate the bit rate of this system.',
         '[8 pts] Calculate the step size of the uniform quantizer.',
         '[9 pts] Find the quantized value and the natural binary code word of the samples at $t=0$, $t=2.5$ ms and $t=7.5$ ms.'],
  sol:'<b>Given.</b> A squared sinc, Nyquist sampling, $L=256$ over the range of $x(t)$.<br>'
     +'<b>Find.</b> $R_b$, $\\Delta$, and three quantized samples with their code words.<br>'
     +'<b>Method.</b> Write $x(t)$ with the sinc. A square in time is a convolution in frequency, so the bandwidth doubles. The sample index is $\\lfloor x/\\Delta\\rfloor$, capped at $L-1$.<br>'
     +'<b>Solution — (a).</b> $\\sin(200\\pi t)/(20\\pi t)=10\\,\\sin(200\\pi t)/(200\\pi t)=10\\operatorname{sinc}(200t)$, so $x(t)=100\\operatorname{sinc}^{2}(200t)$. The factor has the transform $\\tfrac{1}{20}\\Pi(f/200)$, which is zero for $|f|>100$ Hz.'
     +' The convolution of two rectangles of width $200$ Hz is a triangle:'
     +'$$X(f)=\\frac{200-|f|}{400},\\quad|f|\\le200~\\text{Hz}.$$'
     +'So $W=200$ Hz and $f_s=2W=400$ Hz. With $R=\\log_2 256=8$ bits, $R_b=8\\times400=3200$ bit/s.<br>'
     +'<b>Solution — (b).</b> A square is never negative, and $x(t)=0$ at $t=k/200$ s for every $k\\ne0$. The largest value is $x(0)=100\\operatorname{sinc}^{2}(0)=100$.'
     +'$$\\begin{aligned}\\Delta&=\\frac{100-0}{256}\\\\&=0.3906\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The sampling interval is $T_s=1/400$ s $=2.5$ ms, so $t=nT_s$ gives $x=100\\operatorname{sinc}^{2}(n/2)$. The level of index $k$ is $(k+\\tfrac12)\\Delta$.'
     +'<div class="eq plain sm">$$\\begin{array}{c|ccc}t&0&2.5~\\text{ms}&7.5~\\text{ms}\\\\\\hline x(t)&100&400/\\pi^{2}=40.53&400/(9\\pi^{2})=4.503\\\\x/\\Delta&256\\to255&103.75&11.53\\\\\\text{level}&99.80&40.43&4.492\\\\\\text{word}&11111111&01100111&00001011\\end{array}$$</div>'
     +'At $t=0$ the index $256$ is outside $0,\\dots,255$, so it is capped at $255$. The values use $\\operatorname{sinc}(1/2)=2/\\pi$ and $\\operatorname{sinc}(3/2)=-2/(3\\pi)$.<br>'
     +'<b>Check.</b> Every error is at most $\\Delta/2=0.195$: $100-99.80=0.195$, $40.53-40.43=0.098$ and $4.503-4.492=0.011$. The area of $x(t)$ is $X(0)$. Integrating, $100\\int\\operatorname{sinc}^{2}(200t)\\,dt=100/200=0.5$, which is the peak of the triangle, $200/400$.',
  err:'Taking the bandwidth as $100$ Hz, the band of one sinc factor. The square convolves the spectrum with itself, which doubles the band to $200$ Hz.',
  teach:'Examination shape with part (c) changed. A squared sinc has finite energy and zero average power, so its SQNR is not defined. The code words replace that part.',
  figSol:()=>{
    const X = f => (200-Math.abs(f))/400;
    const top = figShape({X, B:200, peak:0.5, fs:400, xmax:1150, unit:'Hz', ticks:[-800,-400,-200,200,400,800]});
    const xs = t => 100*sinc(0.2*t)**2, n = []; for(let k=0;k<=5;k++) n.push([2.5*k, xs(2.5*k)]);
    const a = P.Axes({w:720,h:270,xr:[0,14],yr:[-12,140],xlabel:'t\\;(\\text{ms})',ylabel:'x(t)',
      pad:{l:52,r:28,t:26,b:44},xticksOverride:[2.5,5,7.5,10,12.5],ytarget:4});
    a.curve(xs,{color:C.in});
    a.stem(n,{color:C.mid});
    return top + panel(a.svg(), legend([['in','$x(t)$'],['mid','samples $x(nT_s)$']]));
  } },

{ id:'D1-11', module:'M1', type:'spectrum', src:'Final Q1',
  stem:'The signal $$x(t)=\\frac{\\sin(200\\pi t)}{10\\pi t}\\cdot\\frac{\\sin(600\\pi t)}{10\\pi t}$$ is sampled at the Nyquist rate. The samples are uniformly quantized with $128$ levels over the range of $x(t)$. Use $\\operatorname{sinc}(u)=\\sin(\\pi u)/(\\pi u)$. According to the information given above,',
  parts:['[8 pts] Calculate the bit rate of this system.',
         '[8 pts] Calculate the step size of the uniform quantizer. (Hint: $\\min x(t)\\cong-177$.)',
         '[9 pts] Find the smallest number of levels, a power of two, that makes the step size smaller than $1$. Calculate the bit rate it needs.'],
  sol:'<b>Given.</b> A product of two sinc factors, Nyquist sampling, $L=128$, and $\\min x(t)\\cong-177$.<br>'
     +'<b>Find.</b> $R_b$, $\\Delta$, and the least $L$ with $\\Delta<1$ and its bit rate.<br>'
     +'<b>Method.</b> A product in time is a convolution in frequency, so the two bandwidths add. The step is the range over $L$.<br>'
     +'<b>Solution — (a).</b> Write each factor with the sinc:'
     +'$$\\begin{aligned}\\frac{\\sin(200\\pi t)}{10\\pi t}&=20\\operatorname{sinc}(200t)\\\\\\frac{\\sin(600\\pi t)}{10\\pi t}&=60\\operatorname{sinc}(600t)\\end{aligned}$$'
     +'The first is bandlimited to $100$ Hz and the second to $300$ Hz. Their product is bandlimited to $100+300=400$ Hz. So $f_s=2(400)=800$ Hz, $R=\\log_2 128=7$, and $R_b=7\\times800=5600$ bit/s.<br>'
     +'<b>Solution — (b).</b> Each factor is largest at $t=0$, where $\\operatorname{sinc}(0)=1$. So $x_{\\max}=20\\times60=1200$, and the hint gives $x_{\\min}=-177$.'
     +'$$\\begin{aligned}\\Delta&=\\frac{1200-(-177)}{128}\\\\&=\\frac{1377}{128}\\\\&=10.76\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $\\Delta=1377/L<1$ needs $L>1377$. The powers of two near it are $1024<1377<2048$, so $L=2048$ and $R=11$. Then $\\Delta=1377/2048=0.672$ and $R_b=11\\times800=8800$ bit/s.<br>'
     +'<b>Check.</b> With $L=1024$ the step is $1377/1024=1.34$, still above $1$. The spectrum is a trapezoid. Its height at $f=0$ equals the area of $x(t)$, $1200\\int\\operatorname{sinc}(200t)\\operatorname{sinc}(600t)\\,dt=1200/600=2$.',
  err:'Taking the range as $[-1200,1200]$. The signal never goes below about $-177$, so a symmetric range wastes nearly half the levels.',
  teach:'Examination shape with part (c) changed, since a product of sincs has zero average power and no SQNR. The hint for the minimum is kept as in the examination.',
  figSol:()=>{
    const X = f => { const g=Math.abs(f); return g<=200 ? 2 : 2*(400-g)/200; };
    const top = figShape({X, B:400, peak:2, fs:800, xmax:1300, unit:'Hz', ticks:[-800,-400,-200,200,400,800]});
    return top + figWave({f:t=>1200*sinc(0.2*t)*sinc(0.6*t), t0:0, t1:14, max:1200, min:-177,
      maxLab:'x_{\\max}=1200', minLab:'x_{\\min}\\cong-177', lx:4.2, xticks:[8,10,12], h:270, minTo:3.3, marks:[[2.289,-176.7]]});
  } },

{ id:'D1-12', module:'M1', type:'spectrum', src:'Final Q1',
  stem:'The signal $$x(t)=\\frac{\\sin(1000\\pi t)}{\\pi t}\\,\\cos(4000\\pi t)$$ is sampled at the Nyquist rate. The samples are uniformly quantized with $1024$ levels over the range of $x(t)$. According to the information given above,',
  parts:['[8 pts] Find the Fourier transform $X(f)$ and the highest frequency in $x(t)$.',
         '[6 pts] Calculate the bit rate of this system.',
         '[5 pts] Calculate the step size of the uniform quantizer. (Hint: $\\min x(t)\\cong-902$.)',
         '[6 pts] Calculate the energy of $x(t)$ by Parseval\'s theorem.'],
  sol:'<b>Given.</b> A sinc pulse times a cosine carrier, Nyquist sampling, $L=1024$, and $\\min x(t)\\cong-902$.<br>'
     +'<b>Find.</b> $X(f)$, the highest frequency, $R_b$, $\\Delta$, and the energy $E_x$.<br>'
     +'<b>Method.</b> Use the pair $2W\\operatorname{sinc}(2Wt)\\leftrightarrow\\Pi(f/2W)$ and the modulation property. The energy is $\\int|X(f)|^{2}\\,df$.<br>'
     +'<b>Solution — (a).</b> $\\sin(1000\\pi t)/(\\pi t)=1000\\operatorname{sinc}(1000t)$, whose transform is $\\Pi(f/1000)$: height $1$ for $|f|<500$ Hz. The cosine moves half of it to each of $\\pm2000$ Hz:'
     +'$$X(f)=\\tfrac12\\Pi\\!\\left(\\frac{f-2000}{1000}\\right)+\\tfrac12\\Pi\\!\\left(\\frac{f+2000}{1000}\\right).$$'
     +'$X(f)$ is $\\tfrac12$ for $1500<|f|<2500$ Hz and zero elsewhere. The highest frequency is $2.5$ kHz.<br>'
     +'<b>Solution — (b).</b> $f_s=2(2500)=5000$ Hz and $R=\\log_2 1024=10$, so $R_b=10\\times5000=50\\,000$ bit/s.<br>'
     +'<b>Solution — (c).</b> At $t=0$ the sinc factor is $1000$ and the cosine is $1$, so $x_{\\max}=1000$.'
     +'$$\\begin{aligned}\\Delta&=\\frac{1000-(-902)}{1024}\\\\&=\\frac{1902}{1024}\\\\&=1.857\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> Each rectangle has height $\\tfrac12$ and width $1000$ Hz.'
     +'$$\\begin{aligned}E_x&=\\int_{-\\infty}^{\\infty}|X(f)|^{2}\\,df\\\\&=2\\int_{1500}^{2500}\\left(\\tfrac12\\right)^{2}df\\\\&=2\\cdot\\tfrac14\\cdot1000\\\\&=500\\end{aligned}$$<br>'
     +'<b>Check.</b> In time, $\\cos^{2}\\theta=\\tfrac12(1+\\cos2\\theta)$ splits the energy into two integrals. The first is $\\tfrac12\\int(\\sin(1000\\pi t)/(\\pi t))^{2}dt=\\tfrac12\\int\\Pi^{2}(f/1000)\\,df=\\tfrac12(1000)=500$.'
     +' The second is the transform of the squared sinc at $4000$ Hz. That transform stops at $1000$ Hz, so the second integral is $0$.',
  err:'Taking $500$ Hz, the edge of the sinc factor, as the highest frequency. The cosine moves that band to $1500$ to $2500$ Hz, so the Nyquist rate is $5$ kHz.',
  teach:'Close to the examination shape. The energy part replaces the SQNR, which a finite-energy pulse does not have, and uses the Parseval line of the transform review.',
  figSol:()=>{
    const X = f => { const g=Math.abs(f); return (g>1.5 && g<2.5) ? 0.5 : null; };
    const top = figShape({X:f=>X(f)==null?0:X(f), B:2.5, peak:0.5, fs:5, xmax:8.2, unit:'kHz', ticks:[-5,-2.5,-1.5,1.5,2.5,5]});
    return top + figWave({f:t=>1000*sinc(t)*Math.cos(4*Math.PI*t), t0:0, t1:3.2, max:1000, min:-902,
      maxLab:'x_{\\max}=1000', minLab:'x_{\\min}\\cong-902', lx:1.2, h:270, marks:[[0.2447,-902.4]]});
  } },

/* ---- C. A sum of sinusoids through a uniform quantizer -------------- */

{ id:'D1-13', module:'M1', type:'wave', src:'Final Q1',
  stem:'The signal $x(t)=2\\cos(3000\\pi t)+3\\cos(9000\\pi t)$ is sampled at the Nyquist rate and samples are uniformly quantized with $256$ levels. According to the information given above,',
  parts:['[5 pts] Calculate the bit rate of this system.',
         '[10 pts] Calculate the step size of the uniform quantizer.',
         '[10 pts] Calculate the SQNR of the quantization scheme (in dB).'],
  sol:'<b>Given.</b> Two cosines at $1.5$ kHz and $4.5$ kHz with amplitudes $2$ and $3$, Nyquist sampling, $L=256$.<br>'
     +'<b>Find.</b> $R_b$, $\\Delta$ and the SQNR.<br>'
     +'<b>Method.</b> The rate comes from the highest frequency. The step comes from the range $[x_{\\min},x_{\\max}]$. The SQNR is $P_X/(\\Delta^{2}/12)$, with $P_X$ from the amplitudes.<br>'
     +'<b>Solution — (a).</b> The highest frequency is $4.5$ kHz, so $f_s=9$ kHz. With $R=\\log_2 256=8$ bits:'
     +'$$\\begin{aligned}R_b&=8\\times9000\\\\&=72\\,000~\\text{bit/s}\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> At $t=0$ both terms peak together: $x(0)=2+3=5$. At $t=1/3000$ s the terms are $2\\cos\\pi=-2$ and $3\\cos3\\pi=-3$, so $x=-5$. No value can pass $2+3=5$ in size.'
     +'$$\\begin{aligned}\\Delta&=\\frac{5-(-5)}{256}\\\\&=0.0391\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The two tones have different frequencies, so their powers add:'
     +'$$\\begin{aligned}P_X&=\\frac{2^{2}}{2}+\\frac{3^{2}}{2}=6.5\\\\E[Q^{2}]&=\\frac{\\Delta^{2}}{12}=\\frac{0.0391^{2}}{12}=1.272\\times10^{-4}\\\\\\mathrm{SQNR}&=\\frac{6.5}{1.272\\times10^{-4}}=51\\,118\\\\&=10\\log_{10}51\\,118=47.09~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> By the rule, $\\alpha=10\\log_{10}(3P_X/x_{\\max}^{2})=10\\log_{10}(19.5/25)=-1.079$ dB. Then $\\alpha+20R\\log_{10}2=-1.079+48.165=47.09$ dB.',
  err:'Taking the peak as $3$, the larger amplitude. The two cosines both equal $1$ at $t=0$, so the peak is the sum $5$.',
  teach:'Close variant of the examination shape. Ask the student to name the instant of the minimum, which the answer $-5$ needs.',
  figSol:()=>figWave({f:t=>2*Math.cos(3*Math.PI*t)+3*Math.cos(9*Math.PI*t), t0:0, t1:2, max:5, min:-5,
    maxLab:'x_{\\max}=5', minLab:'x_{\\min}=-5', lx:0.72, marks:[[0,5],[1/3,-5],[2/3,5],[1,-5],[4/3,5],[5/3,-5],[2,5]]}) },

{ id:'D1-14', module:'M1', type:'wave', src:'Final Q1',
  stem:'The signal $x(t)=2\\cos(2000\\pi t)+\\cos(4000\\pi t)$ is sampled at the Nyquist rate and samples are uniformly quantized with $128$ levels. The quantizer spans the range of $x(t)$, from its minimum to its maximum. According to the information given above,',
  parts:['[5 pts] Calculate the bit rate of this system.',
         '[7 pts] Find the maximum and the minimum of $x(t)$.',
         '[6 pts] Calculate the step size of the uniform quantizer.',
         '[7 pts] Calculate the SQNR of the quantization scheme (in dB).'],
  sol:'<b>Given.</b> Tones at $1$ kHz and $2$ kHz with amplitudes $2$ and $1$, Nyquist sampling, $L=128$ over $[x_{\\min},x_{\\max}]$.<br>'
     +'<b>Find.</b> $R_b$, $x_{\\max}$, $x_{\\min}$, $\\Delta$ and the SQNR.<br>'
     +'<b>Method.</b> The second tone is the double angle of the first. Write $x$ as a function of $c=\\cos\\theta$ and find its extremes on $[-1,1]$.<br>'
     +'<b>Solution — (a).</b> The highest frequency is $2$ kHz, so $f_s=4$ kHz. With $R=\\log_2 128=7$ bits, $R_b=7\\times4000=28\\,000$ bit/s.<br>'
     +'<b>Solution — (b).</b> Put $\\theta=2\\pi(1000)t$ and $c=\\cos\\theta$. Then $\\cos2\\theta=2c^{2}-1$:'
     +'$$\\begin{aligned}x&=2c+(2c^{2}-1)\\\\&=2c^{2}+2c-1=g(c)\\end{aligned}$$'
     +'Set the derivative to zero: $g^{\\prime}(c)=4c+2=0$, so $c=-\\tfrac12$. There $g(-\\tfrac12)=\\tfrac12-1-1=-1.5$. At the ends $g(1)=3$ and $g(-1)=-1$. So $x_{\\max}=3$ and $x_{\\min}=-1.5$.<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}\\Delta&=\\frac{3-(-1.5)}{128}\\\\&=\\frac{4.5}{128}\\\\&=0.0352\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}P_X&=\\frac{2^{2}}{2}+\\frac{1^{2}}{2}=2.5\\\\E[Q^{2}]&=\\frac{0.0352^{2}}{12}=1.030\\times10^{-4}\\\\\\mathrm{SQNR}&=\\frac{2.5}{1.030\\times10^{-4}}=24\\,273\\\\&=43.85~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> The minimum sits where $\\cos\\theta=-\\tfrac12$, at $\\theta=2\\pi/3$ or $t=1/3$ ms. Evaluate there: $2\\cos(2\\pi/3)+\\cos(4\\pi/3)=-1-\\tfrac12=-1.5$.',
  err:'Taking the range as $[-3,3]$ by symmetry. This signal never goes below $-1.5$, so a symmetric range wastes a third of the levels.',
  teach:'Close to the examination shape, where the minimum is given as a hint. Here the student finds it, which a quadratic in $\\cos\\theta$ makes possible by hand.',
  figSol:()=>figWave({f:t=>2*Math.cos(2*Math.PI*t)+Math.cos(4*Math.PI*t), t0:0, t1:2, max:3, min:-1.5,
    maxLab:'x_{\\max}=3', minLab:'x_{\\min}=-1.5', lx:0.4, marks:[[0,3],[1/3,-1.5],[2/3,-1.5],[1,3],[4/3,-1.5],[5/3,-1.5],[2,3]]}) },

{ id:'D1-15', module:'M1', type:'wave', src:'Final Q1',
  stem:'The signal $x(t)=\\cos(1000\\pi t)+\\cos(3000\\pi t)+\\cos(5000\\pi t)$ is sampled at the Nyquist rate and samples are uniformly quantized with $512$ levels. According to the information given above,',
  parts:['[5 pts] Calculate the bit rate of this system.',
         '[10 pts] Calculate the step size of the uniform quantizer.',
         '[10 pts] Calculate the SQNR of the quantization scheme (in dB).'],
  sol:'<b>Given.</b> Three unit cosines at $0.5$, $1.5$ and $2.5$ kHz, Nyquist sampling, $L=512$.<br>'
     +'<b>Find.</b> $R_b$, $\\Delta$ and the SQNR.<br>'
     +'<b>Method.</b> As before: the highest frequency, the range, and $P_X/(\\Delta^{2}/12)$.<br>'
     +'<b>Solution — (a).</b> The highest frequency is $2.5$ kHz, so $f_s=5$ kHz. $R=\\log_2 512=9$, so $R_b=9\\times5000=45\\,000$ bit/s.<br>'
     +'<b>Solution — (b).</b> At $t=0$ all three cosines are $1$, so $x_{\\max}=3$. At $t=1$ ms the angles are $\\pi$, $3\\pi$ and $5\\pi$, so all three are $-1$ and $x_{\\min}=-3$.'
     +'$$\\begin{aligned}\\Delta&=\\frac{3-(-3)}{512}\\\\&=0.01172\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $$\\begin{aligned}P_X&=3\\times\\tfrac12=1.5\\\\E[Q^{2}]&=\\frac{0.01172^{2}}{12}=1.144\\times10^{-5}\\\\\\mathrm{SQNR}&=\\frac{1.5}{1.144\\times10^{-5}}=131\\,072\\\\&=51.18~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> $3P_X/x_{\\max}^{2}=4.5/9=\\tfrac12$, so $\\alpha=10\\log_{10}0.5=-3.010$ dB. The rule gives $-3.010+20(9)\\log_{10}2=-3.010+54.185=51.18$ dB. In ratio form, $\\tfrac12\\cdot2^{18}=2^{17}=131\\,072$.',
  err:'Adding the amplitudes to get the power, $P_X=3$. Each unit cosine carries power $\\tfrac12$, so three of them carry $1.5$.',
  teach:'Close variant with three terms. The odd harmonics make the waveform square-like, and the negative intercept shows that its power is low for its peak.',
  figSol:()=>figWave({f:t=>Math.cos(Math.PI*t)+Math.cos(3*Math.PI*t)+Math.cos(5*Math.PI*t), t0:0, t1:4, max:3, min:-3,
    maxLab:'x_{\\max}=3', minLab:'x_{\\min}=-3', lx:0.35, marks:[[0,3],[1,-3],[2,3],[3,-3],[4,3]]}) },

{ id:'D1-16', module:'M1', type:'wave', src:'Final Q1 (variant)',
  stem:'The signal $x(t)=3\\sin(5000\\pi t)+4\\cos(5000\\pi t)$ is sampled at the Nyquist rate and samples are uniformly quantized with $128$ levels over the range of $x(t)$. According to the information given above,',
  parts:['[5 pts] Calculate the bit rate of this system.',
         '[8 pts] Find the peak value of $x(t)$.',
         '[5 pts] Calculate the step size of the uniform quantizer.',
         '[7 pts] Calculate the SQNR of the quantization scheme (in dB).'],
  sol:'<b>Given.</b> A sine and a cosine at the same frequency $2.5$ kHz, Nyquist sampling, $L=128$.<br>'
     +'<b>Find.</b> $R_b$, the peak, $\\Delta$ and the SQNR.<br>'
     +'<b>Method.</b> Two terms at one frequency are one sinusoid. Write $a\\sin\\theta+b\\cos\\theta=A\\cos(\\theta-\\varphi)$ with $A=\\sqrt{a^{2}+b^{2}}$.<br>'
     +'<b>Solution — (a).</b> The only frequency is $2.5$ kHz, so $f_s=5$ kHz. With $R=7$, $R_b=7\\times5000=35\\,000$ bit/s.<br>'
     +'<b>Solution — (b).</b> Expand $A\\cos(\\theta-\\varphi)=A\\cos\\varphi\\cos\\theta+A\\sin\\varphi\\sin\\theta$ and match terms:'
     +'$$\\begin{aligned}A\\cos\\varphi&=4\\\\A\\sin\\varphi&=3\\\\A&=\\sqrt{4^{2}+3^{2}}=5\\end{aligned}$$'
     +'So $x(t)=5\\cos(5000\\pi t-\\varphi)$ with $\\varphi=\\arctan(3/4)=0.644$ rad. The peak is $5$, and the minimum is $-5$.<br>'
     +'<b>Solution — (c).</b> $\\Delta=(5-(-5))/128=0.0781$.<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}P_X&=\\frac{5^{2}}{2}=12.5\\\\E[Q^{2}]&=\\frac{0.0781^{2}}{12}=5.086\\times10^{-4}\\\\\\mathrm{SQNR}&=\\frac{12.5}{5.086\\times10^{-4}}=24\\,576\\\\&=43.91~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> The sine and the cosine are orthogonal over a period, so their powers add: $3^{2}/2+4^{2}/2=4.5+8=12.5$. The peak at $t=\\varphi/(5000\\pi)=0.041$ ms gives $3\\sin(0.644)+4\\cos(0.644)=1.8+3.2=5$.',
  err:'Taking the peak as $3+4=7$. The two terms peak a quarter period apart, so their sum peaks at $\\sqrt{3^{2}+4^{2}}=5$.',
  teach:'Creative variant: two terms that look like a sum but share one frequency. It tests whether the student checks when the terms peak before adding amplitudes.',
  figSol:()=>figWave({f:t=>3*Math.sin(5*Math.PI*t)+4*Math.cos(5*Math.PI*t), t0:0, t1:1.2, max:5, min:-5,
    parts:[t=>3*Math.sin(5*Math.PI*t), t=>4*Math.cos(5*Math.PI*t)], maxLab:'x_{\\max}=5', minLab:'x_{\\min}=-5', lx:0.5,
    legend:[['in','$x(t)$'],['mid','$3\\sin$ and $4\\cos$ terms',1]]}) },

{ id:'D1-17', module:'M1', type:'wave', src:'Final Q1 (variant)',
  stem:'The signal $x(t)=4\\cos(2000\\pi t)+2\\cos(6000\\pi t)$ is sampled with a guard band of at least $1$ kHz and uniformly quantized over the range of $x(t)$. The bits must fit a link of $80$ kbit/s. Assume that $1$ kbit/s $=1000$ bit/s.',
  parts:['[5 pts] Determine the minimum sampling rate.',
         '[7 pts] Find the largest number of bits per sample that the link allows at that rate.',
         '[6 pts] Calculate the step size of the uniform quantizer.',
         '[7 pts] Calculate the SQNR of the quantization scheme (in dB).'],
  sol:'<b>Given.</b> Tones at $1$ kHz and $3$ kHz with amplitudes $4$ and $2$, $f_g\\ge1$ kHz, a link of $80$ kbit/s.<br>'
     +'<b>Find.</b> $f_s$, the largest $R$, $\\Delta$ and the SQNR.<br>'
     +'<b>Method.</b> The guard band sets the least $f_s$. The link sets the largest $R$ at that $f_s$. Then $\\Delta$ and the SQNR follow as usual.<br>'
     +'<b>Solution — (a).</b> $W=3$ kHz, so $f_s=2W+f_g=6+1=7$ kHz.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}R\\,(7000)&\\le80\\,000\\\\R&\\le11.43\\end{aligned}$$'
     +'The largest whole $R$ is $11$, so $L=2048$ and $R_b=77$ kbit/s.<br>'
     +'<b>Solution — (c).</b> At $t=0$ the terms give $4+2=6$. At $t=0.5$ ms they give $4\\cos\\pi+2\\cos3\\pi=-6$. So the range is $[-6,6]$.'
     +'$$\\begin{aligned}\\Delta&=\\frac{12}{2048}\\\\&=0.00586\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}P_X&=\\frac{4^{2}}{2}+\\frac{2^{2}}{2}=10\\\\E[Q^{2}]&=\\frac{0.00586^{2}}{12}=2.861\\times10^{-6}\\\\\\mathrm{SQNR}&=\\frac{10}{2.861\\times10^{-6}}=3.495\\times10^{6}\\\\&=65.43~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> $\\alpha=10\\log_{10}(30/36)=-0.792$ dB, and $-0.792+20(11)\\log_{10}2=-0.792+66.227=65.43$ dB. With $R=11$ the link allows $f_s$ up to $80/11=7.27$ kHz, so the guard band could grow to $1.27$ kHz.',
  err:'Choosing $R=12$ from $80/6$, the rate without the guard band. The guard band raises $f_s$ to $7$ kHz, and $12\\times7=84$ kbit/s breaks the link.',
  teach:'Creative variant that joins the guard-band question and the SQNR question through a bit budget. The rounding goes down here, unlike the accuracy question.',
  figSol:()=>figBudget({Rb:80, xr:[5.6,9.4], yr:[8,14], xticks:[6,7,8,9], unit:'kHz', pick:[7,11], forbid:7}) },

/* ---- D. A density with a constant and a fine uniform quantizer ------ */

{ id:'D1-18', module:'M1', type:'fine', src:'MT Q2',
  stem:'A strict-sense stationary random process $X(t)$ is sampled. The sampled values $X$ have the following PDF: $f_X(x)=k\\left[1+x^{2}\\right]$ for $x\\in[-1,1]$. Sampled values are quantized by using a uniform quantizer with $128$ levels. The quantization noise is a uniform random variable between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$, where $\\Delta$ is the step size.',
  parts:['[5 pts] Determine the value of $k$.',
         '[15 pts] Obtain the SQNR in dB.',
         '[5 pts] If the bandwidth of the signal is $4$ kHz, what is the bit rate of the corresponding PCM system?'],
  sol:'<b>Given.</b> $f_X(x)=k(1+x^{2})$ on $[-1,1]$, $L=128$ over $[-1,1]$, uniform noise.<br>'
     +'<b>Find.</b> $k$, the SQNR and the bit rate.<br>'
     +'<b>Method.</b> The total area gives $k$. The second moment gives $P_X$. The noise is $\\Delta^{2}/12$ with $\\Delta=2/L$.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}1&=\\int_{-1}^{1}k(1+x^{2})\\,dx\\\\&=k\\left[x+\\frac{x^{3}}{3}\\right]_{-1}^{1}\\\\&=k\\left[\\left(1+\\tfrac13\\right)-\\left(-1-\\tfrac13\\right)\\right]\\\\&=\\tfrac83\\,k\\end{aligned}$$'
     +'So $k=3/8=0.375$.<br>'
     +'<b>Solution — (b).</b> The signal power is the second moment:'
     +'$$\\begin{aligned}P_X&=\\int_{-1}^{1}x^{2}\\cdot\\tfrac38(1+x^{2})\\,dx\\\\&=\\tfrac38\\left[\\frac{x^{3}}{3}+\\frac{x^{5}}{5}\\right]_{-1}^{1}\\\\&=\\tfrac38\\left(\\tfrac23+\\tfrac25\\right)=\\tfrac38\\cdot\\tfrac{16}{15}=0.4\\end{aligned}$$'
     +'The step is $\\Delta=2/128=1/64$, so $E[Q^{2}]=\\Delta^{2}/12=1/49\\,152=2.035\\times10^{-5}$.'
     +'$$\\begin{aligned}\\mathrm{SQNR}&=\\frac{0.4}{2.035\\times10^{-5}}=19\\,661\\\\&=10\\log_{10}19\\,661=42.94~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $f_s=2(4000)=8000$ samples per second and $R=\\log_2 128=7$, so $R_b=7\\times8000=56\\,000$ bit/s.<br>'
     +'<b>Check.</b> $\\alpha=10\\log_{10}(3P_X/1^{2})=10\\log_{10}1.2=0.792$ dB. Then $0.792+20(7)\\log_{10}2=0.792+42.144=42.94$ dB.',
  err:'Integrating $k(1+x^{2})$ over $[0,1]$ only, which gives $k=3/4$. The density lives on $[-1,1]$, and the area over the whole interval must be $1$.',
  teach:'Close variant of the examination shape with $1+x^{2}$ in place of $1+|x|^{1/2}$. The point weights follow the examination.',
  figSol:()=>figDensity({f:x=>0.375*(1+x*x), lo:-1, hi:1, ymax:1.3, xticks:[-1,-0.5,0.5,1]}) },

{ id:'D1-19', module:'M1', type:'fine', src:'MT Q2',
  stem:'A strict-sense stationary random process $X(t)$ is sampled. The sampled values $X$ have the following PDF: $f_X(x)=k\\left[1-|x|^{1/2}\\right]$ for $x\\in[-1,1]$. Sampled values are quantized by using a uniform quantizer with $512$ levels. The quantization noise is a uniform random variable between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$, where $\\Delta$ is the step size.',
  parts:['[5 pts] Determine the value of $k$.',
         '[15 pts] Obtain the SQNR in dB.',
         '[5 pts] If the bandwidth of the signal is $5$ kHz, what is the bit rate of the corresponding PCM system?'],
  sol:'<b>Given.</b> $f_X(x)=k(1-|x|^{1/2})$ on $[-1,1]$, $L=512$ over $[-1,1]$.<br>'
     +'<b>Find.</b> $k$, the SQNR and the bit rate.<br>'
     +'<b>Method.</b> The density is even, so integrate over $[0,1]$ and double. There $|x|=x$.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}1&=2k\\int_{0}^{1}\\bigl(1-x^{1/2}\\bigr)dx\\\\&=2k\\left[x-\\tfrac23x^{3/2}\\right]_{0}^{1}\\\\&=2k\\left(1-\\tfrac23\\right)=\\tfrac23\\,k\\end{aligned}$$'
     +'So $k=3/2$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P_X&=2\\cdot\\tfrac32\\int_{0}^{1}\\bigl(x^{2}-x^{5/2}\\bigr)dx\\\\&=3\\left[\\frac{x^{3}}{3}-\\tfrac27x^{7/2}\\right]_{0}^{1}\\\\&=3\\left(\\tfrac13-\\tfrac27\\right)=\\tfrac17=0.1429\\end{aligned}$$'
     +'The step is $\\Delta=2/512=1/256$, so $E[Q^{2}]=1/(12\\cdot65\\,536)=1.272\\times10^{-6}$.'
     +'$$\\begin{aligned}\\mathrm{SQNR}&=\\frac{1/7}{1.272\\times10^{-6}}=112\\,347\\\\&=50.51~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $f_s=10$ kHz and $R=\\log_2 512=9$, so $R_b=9\\times10\\,000=90\\,000$ bit/s.<br>'
     +'<b>Check.</b> $\\alpha=10\\log_{10}(3/7)=-3.680$ dB. Then $-3.680+20(9)\\log_{10}2=-3.680+54.185=50.51$ dB. The intercept is negative because the density crowds near zero.',
  err:'Writing $\\int x^{1/2}dx=\\tfrac12x^{-1/2}$. The power rule raises the exponent: $\\int x^{1/2}dx=\\tfrac23x^{3/2}$.',
  teach:'Close variant with the square root kept but its sign reversed. The density now peaks at zero, and the negative intercept follows.',
  figSol:()=>figDensity({f:x=>1.5*(1-Math.sqrt(Math.abs(x))), lo:-1, hi:1, ymax:2.1, xticks:[-1,-0.5,0.5,1]}) },

{ id:'D1-20', module:'M1', type:'fine', src:'MT Q2',
  stem:'The samples of a stationary source, $X(t)$, are distributed according to the PDF $f_X(x)=k\\left(4-x^{2}\\right)$ for $|x|\\le2$, and zero elsewhere. The samples are quantized by using a uniform quantizer with $64$ levels over $[-2,2]$. The quantization noise is a uniform random variable between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$.',
  parts:['[5 pts] Determine the value of $k$.',
         '[15 pts] Obtain the SQNR in dB.',
         '[5 pts] If the bandwidth of the signal is $6$ kHz, what is the bit rate of the corresponding PCM system?'],
  sol:'<b>Given.</b> A parabolic density on $[-2,2]$, $L=64$ over $[-2,2]$.<br>'
     +'<b>Find.</b> $k$, the SQNR and the bit rate.<br>'
     +'<b>Method.</b> Area for $k$, second moment for $P_X$, and $\\Delta^{2}/12$ with $\\Delta=4/64$.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}1&=2k\\int_{0}^{2}(4-x^{2})\\,dx\\\\&=2k\\left[4x-\\frac{x^{3}}{3}\\right]_{0}^{2}\\\\&=2k\\left(8-\\tfrac83\\right)=\\tfrac{32}{3}\\,k\\end{aligned}$$'
     +'So $k=3/32=0.09375$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P_X&=2\\cdot\\tfrac{3}{32}\\int_{0}^{2}(4x^{2}-x^{4})\\,dx\\\\&=\\tfrac{3}{16}\\left[\\frac{4x^{3}}{3}-\\frac{x^{5}}{5}\\right]_{0}^{2}\\\\&=\\tfrac{3}{16}\\left(\\tfrac{32}{3}-\\tfrac{32}{5}\\right)=\\tfrac{3}{16}\\cdot\\tfrac{64}{15}=0.8\\end{aligned}$$'
     +'The step is $\\Delta=4/64=1/16$, so $E[Q^{2}]=1/3072=3.255\\times10^{-4}$.'
     +'$$\\begin{aligned}\\mathrm{SQNR}&=0.8\\times3072=2457.6\\\\&=33.91~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $f_s=12$ kHz and $R=\\log_2 64=6$, so $R_b=6\\times12\\,000=72\\,000$ bit/s.<br>'
     +'<b>Check.</b> $\\alpha=10\\log_{10}(3(0.8)/2^{2})=10\\log_{10}0.6=-2.218$ dB. Then $-2.218+20(6)\\log_{10}2=-2.218+36.124=33.91$ dB.',
  err:'Using $\\Delta=2/64$ as for a range of $[-1,1]$. The range here is $[-2,2]$, which is $4$ wide, so $\\Delta=4/64$.',
  teach:'Close variant on a wider interval. The range enters both the step and the intercept, and a student who keeps $[-1,1]$ is off by $6$ dB.',
  figSol:()=>figDensity({f:x=>(3/32)*(4-x*x), lo:-2, hi:2, ymax:0.75, xticks:[-2,-1,1,2]}) },

{ id:'D1-21', module:'M1', type:'fine', src:'MT Q2',
  stem:'The samples of a stationary source $X(t)$ have the PDF $f_X(x)=k\\,e^{-|x|}$ for $|x|\\le2$, and zero elsewhere. They are quantized by a uniform quantizer with $256$ levels over $[-2,2]$. The quantization noise is a uniform random variable between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$.',
  parts:['[5 pts] Determine the value of $k$.',
         '[7 pts] Calculate the power of the samples.',
         '[7 pts] Obtain the SQNR in dB.',
         '[6 pts] Find the smallest number of levels, a power of two, that gives an SQNR of at least $50$ dB.'],
  sol:'<b>Given.</b> A truncated two-sided exponential on $[-2,2]$, $L=256$ over $[-2,2]$.<br>'
     +'<b>Find.</b> $k$, $P_X$, the SQNR, and the least $L$ for $50$ dB.<br>'
     +'<b>Method.</b> Integrate over $[0,2]$ and double. The power needs integration by parts twice. For the last part use $\\mathrm{SQNR}=\\alpha+6.02R$.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}1&=2k\\int_{0}^{2}e^{-x}dx\\\\&=2k\\bigl[-e^{-x}\\bigr]_{0}^{2}\\\\&=2k\\,(1-e^{-2})\\end{aligned}$$'
     +'So $k=1/(2(1-e^{-2}))=1/(2\\times0.8647)=0.5783$.<br>'
     +'<b>Solution — (b).</b> By parts twice, $\\int x^{2}e^{-x}dx=-e^{-x}(x^{2}+2x+2)$. Evaluate it at the limits:'
     +'$$\\begin{aligned}\\int_{0}^{2}x^{2}e^{-x}dx&=-e^{-2}(4+4+2)+e^{0}(0+0+2)\\\\&=2-10e^{-2}=0.6466\\\\P_X&=2k\\,(0.6466)=0.7479\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $\\Delta=4/256=1/64$, so $E[Q^{2}]=1/49\\,152=2.035\\times10^{-5}$.'
     +'$$\\begin{aligned}\\mathrm{SQNR}&=\\frac{0.7479}{2.035\\times10^{-5}}=36\\,759\\\\&=45.65~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $\\alpha=10\\log_{10}(3P_X/x_{\\max}^{2})=10\\log_{10}(2.2436/4)=-2.511$ dB. Solve for $R$:'
     +'$$\\begin{aligned}-2.511+6.02R&\\ge50\\\\R&\\ge\\frac{52.511}{6.02}=8.72\\end{aligned}$$'
     +'So $R=9$ and $L=512$, which gives $-2.511+54.185=51.67$ dB.<br>'
     +'<b>Check.</b> The rule at $R=8$ gives $-2.511+48.165=45.65$ dB, the value of part (c) reached another way. It is below $50$ dB, so $256$ levels are not enough.',
  err:'Forgetting the factor $2$ from the two halves of the density, which gives $k=1.157$. The area over $[-2,0]$ equals the area over $[0,2]$, and both count.',
  teach:'Close variant with an exponential density, which needs integration by parts. Part (d) replaces the bit rate with a design question on the level count.',
  figSol:()=>figDensity({f:x=>0.5783*Math.exp(-Math.abs(x)), lo:-2, hi:2, ymax:1.1, xticks:[-2,-1,1,2]}) },

{ id:'D1-22', module:'M1', type:'fine', src:'MT Q2 (variant)',
  stem:'The samples of a stationary source $X(t)$ have the PDF $f_X(x)=k(1+x)$ for $-1\\le x\\le1$, and zero elsewhere. The samples are quantized by a uniform quantizer with $32$ levels over $[-1,1]$. The quantization noise is a uniform random variable between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$.',
  parts:['[5 pts] Determine the value of $k$.',
         '[8 pts] Calculate the mean and the power of the samples.',
         '[7 pts] Obtain the SQNR in dB.',
         '[5 pts] If the bandwidth of the signal is $3.5$ kHz, what is the bit rate of the corresponding PCM system?'],
  sol:'<b>Given.</b> A ramp density on $[-1,1]$, $L=32$ over $[-1,1]$.<br>'
     +'<b>Find.</b> $k$, $E[X]$, $P_X$, the SQNR and the bit rate.<br>'
     +'<b>Method.</b> The density is not even, so integrate over the whole interval. The signal power is $E[X^{2}]$, with the mean inside it.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}1&=k\\left[x+\\frac{x^{2}}{2}\\right]_{-1}^{1}\\\\&=k\\left[\\left(1+\\tfrac12\\right)-\\left(-1+\\tfrac12\\right)\\right]=2k\\end{aligned}$$'
     +'So $k=\\tfrac12$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}E[X]&=\\tfrac12\\left[\\frac{x^{2}}{2}+\\frac{x^{3}}{3}\\right]_{-1}^{1}=\\tfrac12\\left[\\left(\\tfrac12+\\tfrac13\\right)-\\left(\\tfrac12-\\tfrac13\\right)\\right]=\\tfrac13\\\\P_X&=\\tfrac12\\left[\\frac{x^{3}}{3}+\\frac{x^{4}}{4}\\right]_{-1}^{1}=\\tfrac12\\left[\\left(\\tfrac13+\\tfrac14\\right)-\\left(-\\tfrac13+\\tfrac14\\right)\\right]=\\tfrac13\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $\\Delta=2/32=1/16$, so $E[Q^{2}]=1/3072$.'
     +'$$\\begin{aligned}\\mathrm{SQNR}&=\\tfrac13\\times3072=1024\\\\&=30.10~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $f_s=7$ kHz and $R=\\log_2 32=5$, so $R_b=5\\times7000=35\\,000$ bit/s.<br>'
     +'<b>Check.</b> Split the density into $\\tfrac12$ and $\\tfrac12x$. The odd part adds $\\tfrac12\\int x^{3}dx=0$ to the power. So $P_X=\\tfrac12\\int_{-1}^{1}x^{2}dx=\\tfrac13$, the power of a uniform source, and $\\mathrm{SQNR}=6.02(5)=30.10$ dB.',
  err:'Using the variance $\\tfrac13-\\left(\\tfrac13\\right)^{2}=\\tfrac29$ as the signal power. The SQNR compares the full mean square $E[X^{2}]$ with the noise, and the mean is part of the signal.',
  teach:'Creative variant with a density that is not even. The tilt moves the mean but leaves the power at the uniform value, which the check makes visible.',
  figSol:()=>figDensity({f:x=>0.5*(1+x), lo:-1, hi:1, ymax:1.6, xticks:[-1,-0.5,0.5,1], at:'tl'}) },

{ id:'D1-23', module:'M1', type:'fine', src:'MT Q2 (variant)',
  stem:'The samples of a stationary source $X(t)$ have the PDF $f_X(x)=k|x|$ for $|x|\\le a$, and zero elsewhere. The power of the samples is $E[X^{2}]=2$. A uniform quantizer with $L$ levels covers $[-a,a]$. The quantization noise is a uniform random variable between $-\\tfrac{\\Delta}{2}$ and $\\tfrac{\\Delta}{2}$.',
  parts:['[8 pts] Determine $a$ and $k$.',
         '[7 pts] Find the smallest $L$, a power of two, that gives an SQNR of at least $40$ dB.',
         '[5 pts] Calculate the step size and the SQNR obtained with that $L$.',
         '[5 pts] If the bandwidth of the signal is $6.5$ kHz, what is the bit rate of the corresponding PCM system?'],
  sol:'<b>Given.</b> A V-shaped density on $[-a,a]$ with unknown $a$ and $k$, and $E[X^{2}]=2$.<br>'
     +'<b>Find.</b> $a$, $k$, the least $L$ for $40$ dB, $\\Delta$, the SQNR and the bit rate.<br>'
     +'<b>Method.</b> Two conditions fix two unknowns: the area is $1$ and the power is $2$. Then use $\\mathrm{SQNR}=\\alpha+6.02R$.<br>'
     +'<b>Solution — (a).</b> $$\\begin{aligned}1&=2k\\int_{0}^{a}x\\,dx=2k\\cdot\\frac{a^{2}}{2}=ka^{2}\\\\2&=2k\\int_{0}^{a}x^{3}dx=2k\\cdot\\frac{a^{4}}{4}=\\frac{ka^{4}}{2}\\end{aligned}$$'
     +'Put $k=1/a^{2}$ into the second line: $a^{2}/2=2$, so $a=2$ and $k=\\tfrac14$.<br>'
     +'<b>Solution — (b).</b> $\\alpha=10\\log_{10}(3P_X/a^{2})=10\\log_{10}(6/4)=1.761$ dB.'
     +'$$\\begin{aligned}1.761+6.02R&\\ge40\\\\R&\\ge\\frac{38.239}{6.02}=6.35\\end{aligned}$$'
     +'So $R=7$ and $L=128$.<br>'
     +'<b>Solution — (c).</b> $\\Delta=4/128=0.03125$, and $E[Q^{2}]=\\Delta^{2}/12=8.138\\times10^{-5}$.'
     +'$$\\begin{aligned}\\mathrm{SQNR}&=\\frac{2}{8.138\\times10^{-5}}=24\\,576\\\\&=43.91~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $f_s=13$ kHz, so $R_b=7\\times13\\,000=91\\,000$ bit/s.<br>'
     +'<b>Check.</b> Six bits would give $1.761+36.12=37.88$ dB, short of $40$. The ratio $3P_X/a^{2}=1.5$ is the value for a full-scale sinusoid, so this source behaves like one.',
  err:'Setting the peak $ka$ equal to $1$. The area under a density is $1$, not its largest value.',
  teach:'Creative variant: the power is given and the support is found. The coincidence with the sinusoid intercept is worth pointing out in class.',
  figSol:()=>figDensity({f:x=>0.25*Math.abs(x), lo:-2, hi:2, ymax:2.4, xticks:[-2,-1,1,2]}) },

/* ---- E. A drawn density and a coarse quantizer ----------------------- */

{ id:'D1-24', module:'M1', type:'coarse', src:'MT Q2',
  stem:'The samples of a stationary source, $X(t)$, are distributed according to the probability density function (PDF) drawn below. These samples are quantized using the following quantizer: $$\\hat X=\\mathbb{Q}(X)=\\begin{cases}-2,&-3<X<0\\\\2,&0<X<3\\\\0,&\\text{otherwise}\\end{cases}$$ According to the information given above,',
  figure:()=>figPdf({xr:[-6,6], xticks:[-5,-3,3,5], pts:[[-6,0],[-5,0],[-3,1],[3,1],[5,0],[6,0]], levels:[[1,'c',-3]]}),
  parts:['[6 pts] Determine the value of $c$.',
         '[6 pts] Calculate the power of the samples of the stationary source.',
         '[6 pts] Calculate the power of the quantization noise.',
         '[7 pts] Obtain the SQNR in dB.'],
  sol:'<b>Given.</b> A trapezoidal density on $[-5,5]$, flat at height $c$ on $[-3,3]$. The quantizer gives $\\pm2$ on $(-3,0)$ and $(0,3)$, and $0$ elsewhere.<br>'
     +'<b>Find.</b> $c$, $P_X$, $P_Q$ and the SQNR.<br>'
     +'<b>Method.</b> The area gives $c$. Both powers are even integrals, so work on $x\\ge0$ and double. Split the noise integral at the corner $x=3$, which is also a quantizer boundary.<br>'
     +'<b>Solution — (a).</b> A trapezoid with parallel sides $10$ and $6$ and height $c$ has area $\\tfrac12(10+6)c=8c=1$. So $c=\\tfrac18$.'
     +' For $x\\ge0$ the density is $\\tfrac18$ on $[0,3]$ and $(5-x)/16$ on $[3,5]$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P_X&=2\\left[\\int_{0}^{3}\\frac{x^{2}}{8}dx+\\int_{3}^{5}\\frac{x^{2}(5-x)}{16}dx\\right]\\\\&=2\\left[\\frac{x^{3}}{24}\\Big|_{0}^{3}+\\frac{1}{16}\\left(\\frac{5x^{3}}{3}-\\frac{x^{4}}{4}\\right)\\Big|_{3}^{5}\\right]\\\\&=2\\left[1.125+\\tfrac{1}{16}(52.083-24.75)\\right]\\\\&=2\\,[1.125+1.708]=5.667\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> On $(0,3)$ the output is $2$, and on $(3,5)$ it is $0$:'
     +'$$\\begin{aligned}P_Q&=2\\left[\\int_{0}^{3}\\frac{(x-2)^{2}}{8}dx+\\int_{3}^{5}\\frac{x^{2}(5-x)}{16}dx\\right]\\\\&=2\\left[\\frac{(x-2)^{3}}{24}\\Big|_{0}^{3}+1.708\\right]\\\\&=2\\left[\\frac{1-(-8)}{24}+1.708\\right]\\\\&=2\\,[0.375+1.708]=4.167\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}\\mathrm{SQNR}&=\\frac{5.667}{4.167}=1.36\\\\&=10\\log_{10}1.36=1.34~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> On $(0,3)$, $X$ is uniform with probability $\\tfrac38$, mean $1.5$ and variance $9/12=0.75$. So $E[(X-2)^{2}]$ there is $0.75+(1.5-2)^{2}=1$, and $\\tfrac38\\times1=0.375$ as in part (c).',
  err:'Using $\\Delta^{2}/12$ for the noise. The quantizer returns $0$ for $|X|>3$, so the error there reaches $5$ and the uniform model does not hold.',
  teach:'Close variant of the examination shape. The tails outside the covered range carry most of the noise, which the figure shows at a glance.',
  figSol:()=>figCoarse({f:x=>{const g=Math.abs(x); return g<=3 ? 1/8 : g<=5 ? (5-g)/16 : 0;},
    q:[[-6,-3,0],[-3,0,-2],[0,3,2],[3,6,0]], xr:[-6,6], qr:3.4, xticks:[-5,-3,3,5], cuts:[-5,-3,0,3,5], emax:2.0}) },

{ id:'D1-25', module:'M1', type:'coarse', src:'MT Q2',
  stem:'The samples of a stationary source, $X(t)$, are distributed according to the probability density function (PDF) drawn below. These samples are quantized using the following quantizer: $$\\hat X=\\mathbb{Q}(X)=\\begin{cases}-3,&-6<X<0\\\\3,&0<X<6\\\\0,&\\text{otherwise}\\end{cases}$$ According to the information given above,',
  figure:()=>figPdf({xr:[-8,8], xticks:[-6,-3,3,6], pts:[[-8,0],[-6,0],[0,1],[6,0],[8,0]], levels:[[1,'c',0]]}),
  parts:['[6 pts] Determine the value of $c$.',
         '[6 pts] Calculate the power of the samples of the stationary source.',
         '[6 pts] Calculate the power of the quantization noise.',
         '[7 pts] Obtain the SQNR in dB.'],
  sol:'<b>Given.</b> A triangular density on $[-6,6]$ with peak $c$, and outputs $\\pm3$ on $(-6,0)$ and $(0,6)$.<br>'
     +'<b>Find.</b> $c$, $P_X$, $P_Q$ and the SQNR.<br>'
     +'<b>Method.</b> The area gives $c$. For $x\\ge0$ the density is $c(1-x/6)$, and both powers are twice the integral over $[0,6]$.<br>'
     +'<b>Solution — (a).</b> The triangle has base $12$ and height $c$, so $\\tfrac12(12)c=6c=1$ and $c=\\tfrac16$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P_X&=2\\int_{0}^{6}x^{2}\\cdot\\tfrac16\\left(1-\\frac{x}{6}\\right)dx\\\\&=\\tfrac13\\left[\\frac{x^{3}}{3}-\\frac{x^{4}}{24}\\right]_{0}^{6}\\\\&=\\tfrac13\\,(72-54)=6\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> Substitute $u=x-3$, so $x=0$ gives $u=-3$ and $x=6$ gives $u=3$. The density becomes $\\tfrac16(\\tfrac12-\\tfrac{u}{6})$:'
     +'$$\\begin{aligned}P_Q&=2\\int_{0}^{6}(x-3)^{2}\\cdot\\tfrac16\\left(1-\\frac{x}{6}\\right)dx\\\\&=\\tfrac13\\int_{-3}^{3}u^{2}\\left(\\tfrac12-\\frac{u}{6}\\right)du\\\\&=\\tfrac13\\left[\\frac{u^{3}}{6}-\\frac{u^{4}}{24}\\right]_{-3}^{3}\\\\&=\\tfrac13\\left[(4.5-3.375)-(-4.5-3.375)\\right]\\\\&=\\tfrac13\\,(9)=3\\end{aligned}$$'
     +'The $u^{4}$ terms cancel between the two limits, because $u^{3}/6$ is odd and $u^{4}/24$ is even.<br>'
     +'<b>Solution — (d).</b> $\\mathrm{SQNR}=6/3=2$, which is $10\\log_{10}2=3.01$ dB.<br>'
     +'<b>Check.</b> Each region is one cell of width $\\Delta=6$, the density is a straight line inside it, and the output sits at its midpoint. The odd part of the error integral vanishes, so $P_Q=\\Delta^{2}/12=36/12=3$.',
  err:'Leaving out the factor $\\tfrac16$ of the density after the substitution. Change the variable in the whole integrand, not only in the square.',
  teach:'Close variant of the triangular examination shape. With the outputs at the cell midpoints the result equals $\\Delta^{2}/12$, which the check explains.',
  figSol:()=>figCoarse({f:x=>{const g=Math.abs(x); return g<=6 ? (1-g/6)/6 : 0;},
    q:[[-8,-6,0],[-6,0,-3],[0,6,3],[6,8,0]], xr:[-8,8], qr:4.6, xticks:[-6,-3,3,6], cuts:[-6,0,6], emax:2.6}) },

{ id:'D1-26', module:'M1', type:'coarse', src:'MT Q2',
  stem:'The samples of a stationary source, $X(t)$, are distributed according to the probability density function (PDF) drawn below. These samples are quantized using the following quantizer: $$\\hat X=\\mathbb{Q}(X)=\\begin{cases}-2,&-4<X<-1\\\\0,&-1\\le X\\le1\\\\2,&1<X<4\\end{cases}$$ According to the information given above,',
  figure:()=>figPdf({xr:[-5,5], xticks:[-4,-2,-1,1,2,4], pts:[[-5,0],[-4,0],[-2,1],[2,1],[4,0],[5,0]], levels:[[1,'c',-2]]}),
  parts:['[6 pts] Determine the value of $c$.',
         '[6 pts] Calculate the power of the samples of the stationary source.',
         '[6 pts] Calculate the power of the quantization noise.',
         '[7 pts] Obtain the SQNR in dB.'],
  sol:'<b>Given.</b> A trapezoidal density on $[-4,4]$, flat at height $c$ on $[-2,2]$, and a three-level quantizer with outputs $-2$, $0$, $2$.<br>'
     +'<b>Find.</b> $c$, $P_X$, $P_Q$ and the SQNR.<br>'
     +'<b>Method.</b> Work on $x\\ge0$ and double. Split the noise integral at the quantizer boundary $x=1$ and at the corner $x=2$.<br>'
     +'<b>Solution — (a).</b> $\\tfrac12(8+4)c=6c=1$, so $c=\\tfrac16$. For $x\\ge0$ the density is $\\tfrac16$ on $[0,2]$ and $(4-x)/12$ on $[2,4]$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P_X&=2\\left[\\int_{0}^{2}\\frac{x^{2}}{6}dx+\\int_{2}^{4}\\frac{x^{2}(4-x)}{12}dx\\right]\\\\&=2\\left[\\frac{x^{3}}{18}\\Big|_{0}^{2}+\\frac{1}{12}\\left(\\frac{4x^{3}}{3}-\\frac{x^{4}}{4}\\right)\\Big|_{2}^{4}\\right]\\\\&=2\\left[\\tfrac49+\\tfrac{1}{12}\\left(\\tfrac{64}{3}-\\tfrac{20}{3}\\right)\\right]\\\\&=2\\left[\\tfrac49+\\tfrac{11}{9}\\right]=\\tfrac{10}{3}=3.333\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The output is $0$ on $[0,1]$ and $2$ on $(1,4)$. On $[2,4]$ substitute $u=x-2$, with limits $0$ and $2$:'
     +'$$\\begin{aligned}P_Q&=2\\left[\\int_{0}^{1}\\frac{x^{2}}{6}dx+\\int_{1}^{2}\\frac{(x-2)^{2}}{6}dx+\\int_{0}^{2}\\frac{u^{2}(2-u)}{12}du\\right]\\\\&=2\\left[\\tfrac{1}{18}+\\tfrac{1}{18}+\\tfrac{1}{12}\\left(\\tfrac{16}{3}-4\\right)\\right]\\\\&=2\\left[\\tfrac19+\\tfrac19\\right]=\\tfrac49=0.444\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}\\mathrm{SQNR}&=\\frac{10/3}{4/9}=7.5\\\\&=10\\log_{10}7.5=8.75~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> On $[0,1]$, $X$ is uniform with probability $\\tfrac16$ and $E[X^{2}]=\\tfrac13$ there. That gives $\\tfrac16\\cdot\\tfrac13=\\tfrac{1}{18}$, the first term of part (c).',
  err:'Giving the middle region the output of its neighbours. On $[-1,1]$ the quantizer returns $0$, so the error there is $x$ itself.',
  teach:'Close variant with a mid-tread quantizer whose outputs cover the whole support. It is the one coarse case with no unbounded tail, so the SQNR is higher.',
  figSol:()=>figCoarse({f:x=>{const g=Math.abs(x); return g<=2 ? 1/6 : g<=4 ? (4-g)/12 : 0;},
    q:[[-5,-1,-2],[-1,1,0],[1,5,2]], xr:[-5,5], qr:3.4, xticks:[-4,-2,-1,1,2,4], cuts:[-4,-2,-1,1,2,4], emax:0.3}) },

{ id:'D1-27', module:'M1', type:'coarse', src:'MT Q2',
  stem:'The samples of a stationary source, $X(t)$, are distributed according to the probability density function (PDF) drawn below. These samples are quantized using the following quantizer: $$\\hat X=\\mathbb{Q}(X)=\\begin{cases}-2,&-4<X<0\\\\2,&0<X<4\\\\0,&\\text{otherwise}\\end{cases}$$ According to the information given above,',
  figure:()=>figPdf({xr:[-7,7], xticks:[-6,-4,-2,2,4,6], pts:[[-7,0],[-6,0],[-2,1],[2,1],[6,0],[7,0]], levels:[[1,'c',-2]]}),
  parts:['[6 pts] Determine the value of $c$.',
         '[6 pts] Calculate the power of the samples of the stationary source.',
         '[6 pts] Calculate the power of the quantization noise.',
         '[7 pts] Obtain the SQNR in dB.'],
  sol:'<b>Given.</b> A trapezoidal density on $[-6,6]$, flat at height $c$ on $[-2,2]$. The outputs are $\\pm2$ on $(-4,0)$ and $(0,4)$, and $0$ outside.<br>'
     +'<b>Find.</b> $c$, $P_X$, $P_Q$ and the SQNR.<br>'
     +'<b>Method.</b> Work on $x\\ge0$ and double. The noise integral splits at the corner $x=2$ and at the boundary $x=4$.<br>'
     +'<b>Solution — (a).</b> $\\tfrac12(12+4)c=8c=1$, so $c=\\tfrac18$. For $x\\ge0$ the density is $\\tfrac18$ on $[0,2]$ and $(6-x)/32$ on $[2,6]$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P_X&=2\\left[\\int_{0}^{2}\\frac{x^{2}}{8}dx+\\int_{2}^{6}\\frac{x^{2}(6-x)}{32}dx\\right]\\\\&=2\\left[\\frac{x^{3}}{24}\\Big|_{0}^{2}+\\frac{1}{32}\\left(2x^{3}-\\frac{x^{4}}{4}\\right)\\Big|_{2}^{6}\\right]\\\\&=2\\left[\\tfrac13+\\tfrac{1}{32}(108-12)\\right]\\\\&=2\\left[\\tfrac13+3\\right]=\\tfrac{20}{3}=6.667\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> Three pieces for $x\\ge0$. On $[2,4]$ substitute $u=x-2$, with limits $0$ and $2$, so $6-x=4-u$:'
     +'$$\\begin{aligned}\\int_{0}^{2}\\frac{(x-2)^{2}}{8}dx&=\\frac{(x-2)^{3}}{24}\\Big|_{0}^{2}=\\tfrac13\\\\\\int_{0}^{2}\\frac{u^{2}(4-u)}{32}du&=\\tfrac{1}{32}\\left(\\tfrac{32}{3}-4\\right)=\\tfrac{5}{24}\\\\\\int_{4}^{6}\\frac{x^{2}(6-x)}{32}dx&=\\tfrac{1}{32}\\left(2x^{3}-\\frac{x^{4}}{4}\\right)\\Big|_{4}^{6}=\\tfrac{1}{32}(108-64)=\\tfrac{11}{8}\\end{aligned}$$'
     +'$$P_Q=2\\left[\\tfrac13+\\tfrac{5}{24}+\\tfrac{11}{8}\\right]=2\\cdot\\tfrac{23}{12}=\\tfrac{23}{6}=3.833$$<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}\\mathrm{SQNR}&=\\frac{20/3}{23/6}=\\frac{40}{23}=1.739\\\\&=2.40~\\text{dB}\\end{aligned}$$<br>'
     +'<b>Check.</b> The tail $(4,6)$ holds probability $\\int_{4}^{6}(6-x)/32\\,dx=\\tfrac{1}{16}$. There $X$ has the density $(6-x)/2$, whose second moment is $\\tfrac12(2x^{3}-x^{4}/4)\\big|_{4}^{6}=22$. So the tail adds $\\tfrac{1}{16}\\times22=\\tfrac{11}{8}$ on each side, as in part (c).',
  err:'Dropping the tails beyond $\\pm4$ because they hold little probability. They hold $\\tfrac18$ of it in total but $72\\%$ of the noise power.',
  teach:'Close variant of the trapezoidal examination shape, with outputs that stop short of the support. The small tails dominate the noise, as the figure shows.',
  figSol:()=>figCoarse({f:x=>{const g=Math.abs(x); return g<=2 ? 1/8 : g<=6 ? (6-g)/32 : 0;},
    q:[[-7,-4,0],[-4,0,-2],[0,4,2],[4,7,0]], xr:[-7,7], qr:3.4, xticks:[-6,-4,-2,2,4,6], cuts:[-6,-4,-2,0,2,4,6], emax:1.75}) },

{ id:'D1-28', module:'M1', type:'coarse', src:'MT Q2 (variant)',
  stem:'The samples of a stationary source $X(t)$ have the piecewise-constant PDF drawn below. They are quantized by a $4$-level uniform quantizer over $[-3,3]$, with outputs $\\pm0.75$ and $\\pm2.25$ and boundaries $0$ and $\\pm1.5$.',
  figure:()=>figPdf({xr:[-4,4], xticks:[-3,-1.5,-1,1,1.5,3], pts:[[-4,0],[-3,0],[-3,0.5],[-1,0.5],[-1,1],[1,1],[1,0.5],[3,0.5],[3,0],[4,0]],
    levels:[[1,'c',-1],[0.5,'c/2',-3]]}),
  parts:['[5 pts] Determine the value of $c$.',
         '[6 pts] Calculate the power of the samples.',
         '[8 pts] Calculate the power of the quantization noise, region by region.',
         '[6 pts] Obtain the SQNR in dB, and compare the noise power with $\\Delta^{2}/12$.'],
  sol:'<b>Given.</b> A density of height $c$ on $|x|<1$ and $c/2$ on $1<|x|<3$. A uniform quantizer with $\\Delta=1.5$ and outputs at the cell midpoints.<br>'
     +'<b>Find.</b> $c$, $P_X$, $P_Q$, the SQNR, and a comparison with $\\Delta^{2}/12$.<br>'
     +'<b>Method.</b> The step of the density at $x=1$ falls inside the cell $(0,1.5)$. Split the noise integral there as well as at the boundaries.<br>'
     +'<b>Solution — (a).</b> The area is $2c+2\\cdot\\tfrac{c}{2}\\cdot2=4c=1$, so $c=\\tfrac14$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P_X&=2\\left[\\int_{0}^{1}\\frac{x^{2}}{4}dx+\\int_{1}^{3}\\frac{x^{2}}{8}dx\\right]\\\\&=2\\left[\\tfrac{1}{12}+\\frac{27-1}{24}\\right]=2\\cdot\\tfrac{14}{12}=\\tfrac73=2.333\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> Use the antiderivative $(x-v)^{3}/3$ on each piece, with $v$ the output:'
     +'$$\\begin{aligned}\\int_{0}^{1}\\frac{(x-0.75)^{2}}{4}dx&=\\tfrac{1}{12}(0.25^{3}+0.75^{3})=0.03646\\\\\\int_{1}^{1.5}\\frac{(x-0.75)^{2}}{8}dx&=\\tfrac{1}{24}(0.75^{3}-0.25^{3})=0.01693\\\\\\int_{1.5}^{3}\\frac{(x-2.25)^{2}}{8}dx&=\\tfrac{1}{24}(2\\times0.75^{3})=0.03516\\end{aligned}$$'
     +'Doubling for $x<0$: $P_Q=2(0.03646+0.01693+0.03516)=0.1771$.<br>'
     +'<b>Solution — (d).</b> $\\mathrm{SQNR}=2.333/0.1771=13.18$, which is $11.20$ dB. The model gives $\\Delta^{2}/12=2.25/12=0.1875$, so the true noise is $5.6\\%$ smaller. More probability sits in the part of the cell $(0,1.5)$ nearer its output.<br>'
     +'<b>Check.</b> Take $P_X$ as a mixture. $|X|<1$ has probability $\\tfrac12$ and $E[X^{2}]=\\tfrac13$ there. $1<|X|<3$ has probability $\\tfrac12$ and $E[X^{2}]=(27-1)/6=\\tfrac{13}{3}$ there. So $P_X=\\tfrac12\\cdot\\tfrac13+\\tfrac12\\cdot\\tfrac{13}{3}=\\tfrac73$.',
  err:'Integrating the cell $(0,1.5)$ with one density value. The density changes from $c$ to $c/2$ at $x=1$, inside the cell, so that cell needs two integrals.',
  teach:'Creative variant: a stepped density and a uniform quantizer whose cell holds a jump. It shows when $\\Delta^{2}/12$ is close and why it is not exact.',
  figSol:()=>figCoarse({f:x=>{const g=Math.abs(x); return g<1 ? 0.25 : g<=3 ? 0.125 : 0;},
    q:[[-4,-1.5,-2.25],[-1.5,0,-0.75],[0,1.5,0.75],[1.5,4,2.25]], xr:[-4,4], qr:3.6, xticks:[-3,-1.5,-1,1,1.5,3], cuts:[-3,-1.5,-1,0,1,1.5,3], emax:0.5}) },

{ id:'D1-29', module:'M1', type:'coarse', src:'MT Q2 (variant)',
  stem:'The samples of a stationary source $X(t)$ have the triangular PDF drawn below. They are quantized by $$\\hat X=\\mathbb{Q}(X)=\\begin{cases}-b,&-3<X<0\\\\b,&0<X<3\\\\0,&\\text{otherwise}\\end{cases}$$ where $b>0$ is a design constant.',
  figure:()=>figPdf({xr:[-4,4], xticks:[-3,-1,1,3], pts:[[-4,0],[-3,0],[0,1],[3,0],[4,0]], levels:[[1,'c',0]]}),
  parts:['[5 pts] Determine the value of $c$.',
         '[5 pts] Calculate the power of the samples.',
         '[7 pts] For $b=2$, calculate the power of the quantization noise and the SQNR in dB.',
         '[8 pts] Find the value of $b$ that makes the noise power smallest, and the SQNR it gives.'],
  sol:'<b>Given.</b> A triangular density on $[-3,3]$ with peak $c$, and outputs $\\pm b$ on the two halves.<br>'
     +'<b>Find.</b> $c$, $P_X$, $P_Q$ and the SQNR for $b=2$, and the best $b$.<br>'
     +'<b>Method.</b> Expand $(x-b)^{2}$ so that $P_Q$ becomes a quadratic in $b$. Its coefficients are moments of the density. Then set the derivative in $b$ to zero.<br>'
     +'<b>Solution — (a).</b> $\\tfrac12(6)c=3c=1$, so $c=\\tfrac13$. For $x\\ge0$ the density is $\\tfrac13(1-x/3)$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}P_X&=2\\int_{0}^{3}x^{2}\\cdot\\tfrac13\\left(1-\\frac{x}{3}\\right)dx\\\\&=\\tfrac23\\left[\\frac{x^{3}}{3}-\\frac{x^{4}}{12}\\right]_{0}^{3}=\\tfrac23\\,(9-6.75)=1.5\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> By symmetry $P_Q=2\\int_{0}^{3}(x-b)^{2}f_X\\,dx$. Expand the square:'
     +'$$\\begin{aligned}P_Q&=2\\int_{0}^{3}x^{2}f_X\\,dx-2b\\cdot2\\int_{0}^{3}xf_X\\,dx+b^{2}\\cdot2\\int_{0}^{3}f_X\\,dx\\\\&=P_X-2b\\,E|X|+b^{2}\\end{aligned}$$'
     +'The last integral is $1$. The middle one is $E|X|=\\tfrac23\\left[\\frac{x^{2}}{2}-\\frac{x^{3}}{9}\\right]_{0}^{3}=\\tfrac23(4.5-3)=1$. So $P_Q=1.5-2b+b^{2}$.'
     +' At $b=2$: $P_Q=1.5-4+4=1.5$ and $\\mathrm{SQNR}=1.5/1.5=1$, which is $0$ dB.<br>'
     +'<b>Solution — (d).</b> $$\\begin{aligned}\\frac{dP_Q}{db}&=-2+2b=0\\\\b&=1\\end{aligned}$$'
     +'The second derivative is $2>0$, so this is a minimum. Then $P_Q=1.5-2+1=0.5$ and $\\mathrm{SQNR}=3$, which is $4.77$ dB.<br>'
     +'<b>Check.</b> Integrate directly at $b=1$ with $u=x-1$, limits $-1$ and $2$: $2\\cdot\\tfrac19\\int_{-1}^{2}u^{2}(2-u)\\,du=\\tfrac29\\left[\\tfrac{2u^{3}}{3}-\\tfrac{u^{4}}{4}\\right]_{-1}^{2}=\\tfrac29\\left(\\tfrac43+\\tfrac{11}{12}\\right)=0.5$.',
  err:'Placing the output at the midpoint $1.5$ of the cell. The best output is the mean of $X$ in the cell, $E[X\\mid0<X<3]=1$, not the midpoint.',
  teach:'Creative variant that reaches the centroid condition of the optimal quantizer by one derivative. At $b=2$ the noise equals the signal power, a result worth a moment in class.',
  figSol:()=>figCoarse({f:x=>{const g=Math.abs(x); return g<=3 ? (1-g/3)/3 : 0;},
    q:[[-4,-3,0],[-3,0,-1],[0,3,1],[3,4,0]], xr:[-4,4], qr:3.4, xticks:[-3,-1,1,3], cuts:[-3,0,3], emax:0.58}) },

{ id:'D1-30', module:'M1', type:'coarse', src:'MT Q2 (variant)',
  stem:'The samples of a non-negative stationary source $X(t)$ have the PDF drawn below. It falls linearly from $c$ at $x=0$ to zero at $x=4$. They are quantized by $$\\hat X=\\mathbb{Q}(X)=\\begin{cases}1,&0<X<2\\\\3,&2<X<4\\\\0,&\\text{otherwise}\\end{cases}$$ According to the information given above,',
  figure:()=>figPdf({xr:[-1,5], xticks:[1,2,3,4], pts:[[-1,0],[0,0],[0,1],[4,0],[5,0]], levels:[[1,'c',0]]}),
  parts:['[5 pts] Determine the value of $c$.',
         '[6 pts] Calculate the mean and the power of the samples.',
         '[8 pts] Calculate the power of the quantization noise.',
         '[6 pts] Obtain the SQNR in dB, and compare the noise power with $\\Delta^{2}/12$.'],
  sol:'<b>Given.</b> $f_X(x)=c(1-x/4)$ on $[0,4]$, and a two-level uniform quantizer with $\\Delta=2$ and outputs at the cell midpoints.<br>'
     +'<b>Find.</b> $c$, $E[X]$, $P_X$, $P_Q$, the SQNR and a comparison with $\\Delta^{2}/12$.<br>'
     +'<b>Method.</b> Integrate each cell after centring it on its output. The substitution $u=x-v$ makes the odd terms vanish.<br>'
     +'<b>Solution — (a).</b> The triangle has base $4$ and height $c$, so $2c=1$ and $c=\\tfrac12$.<br>'
     +'<b>Solution — (b).</b> $$\\begin{aligned}E[X]&=\\tfrac12\\int_{0}^{4}\\left(x-\\frac{x^{2}}{4}\\right)dx=\\tfrac12\\left[\\frac{x^{2}}{2}-\\frac{x^{3}}{12}\\right]_{0}^{4}=\\tfrac12\\left(8-\\tfrac{16}{3}\\right)=\\tfrac43\\\\P_X&=\\tfrac12\\int_{0}^{4}\\left(x^{2}-\\frac{x^{3}}{4}\\right)dx=\\tfrac12\\left[\\frac{x^{3}}{3}-\\frac{x^{4}}{16}\\right]_{0}^{4}=\\tfrac12\\left(\\tfrac{64}{3}-16\\right)=\\tfrac83\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> On $(0,2)$ put $u=x-1$, limits $-1$ and $1$, so $1-x/4=\\tfrac34-\\tfrac{u}{4}$. On $(2,4)$ put $u=x-3$, so $1-x/4=\\tfrac14-\\tfrac{u}{4}$.'
     +'$$\\begin{aligned}\\int_{0}^{2}(x-1)^{2}f_X\\,dx&=\\tfrac12\\int_{-1}^{1}u^{2}\\left(\\tfrac34-\\tfrac{u}{4}\\right)du=\\tfrac12\\cdot\\tfrac34\\cdot\\tfrac23=\\tfrac14\\\\\\int_{2}^{4}(x-3)^{2}f_X\\,dx&=\\tfrac12\\int_{-1}^{1}u^{2}\\left(\\tfrac14-\\tfrac{u}{4}\\right)du=\\tfrac12\\cdot\\tfrac14\\cdot\\tfrac23=\\tfrac{1}{12}\\end{aligned}$$'
     +'The $u^{3}$ terms integrate to zero over $[-1,1]$. So $P_Q=\\tfrac14+\\tfrac{1}{12}=\\tfrac13=0.333$.<br>'
     +'<b>Solution — (d).</b> $\\mathrm{SQNR}=(8/3)/(1/3)=8$, which is $10\\log_{10}8=9.03$ dB. Here $\\Delta^{2}/12=4/12=\\tfrac13$, exactly equal to $P_Q$.<br>'
     +'<b>Check.</b> Each cell has probability $f_X(v)\\Delta$ when the density is straight inside it. That is $\\tfrac38\\cdot2=\\tfrac34$ and $\\tfrac18\\cdot2=\\tfrac14$. Each contributes its probability times $\\Delta^{2}/12$, so $\\tfrac34\\cdot\\tfrac13+\\tfrac14\\cdot\\tfrac13=\\tfrac13$.',
  err:'Taking the range as $[-4,4]$ in part (d), which gives $\\Delta=4$ and $\\Delta^{2}/12=1.33$. The source never goes negative, so the quantizer covers $[0,4]$ and $\\Delta=2$.',
  teach:'Creative variant with a one-sided source. It shows that $\\Delta^{2}/12$ is exact, not approximate, when the density is a straight line inside each cell and the output sits at the midpoint.',
  figSol:()=>figCoarse({f:x=>(x>=0 && x<=4) ? 0.5*(1-x/4) : 0,
    q:[[-1,0,0],[0,2,1],[2,4,3],[4,5,0]], xr:[-1,5], qr:4.4, qy:[-0.8,4.2], xticks:[1,2,3,4], cuts:[0,2,4], emax:0.88}) }

]);

/* ======================================================================
   The scene that carries them.
   ====================================================================== */
window.DRILL_M1 = [

{ id:'m1-drill', module:'M1', nav:'Module 1 · practice questions',
  title:'Module 1 — practice questions',
  objective:'Thirty open-ended questions with worked solutions on sampling, quantization and PCM.',
  keywords:'practice questions module 1 sampling nyquist guard band quantization sqnr step size bit rate symbol rate pam pcm density',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Practice D1-01 … D1-30'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question before opening its solution. The bit rate is the resolution times the sampling rate. A required level count rounds up to a power of two. A coarse quantizer needs its noise integrated region by region.'},
  {t:'rule', short:true},
  {t:'drill', module:'M1'}
]}

];
})();
