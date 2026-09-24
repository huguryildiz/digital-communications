/* ==========================================================================
   Module 2 — five visual scenes added to the module.

   One slide in 2.4 puts noise on the eye diagram and reads the error count
   off the samples at the sampling instant. Section 2.6 is a survey, like 1.7
   and 1.8: four slides on what a real link adds to the receiver of 2.1–2.5,
   each carried by one animated or live figure and little mathematics. The
   equalizer is the book's 10.5.2, symbol timing 8.9.1, the power spectrum
   10.2 and regenerative repeaters 8.10; the addresses and anchors live in
   `89_sections.js`, and the scenes take their places in the module from there.

   The scenes are kept in their own file, beside `83_scenes_m2.js`, with the
   few helpers they need copied rather than shared, since that file keeps its
   helpers inside its own closure.

   Colour, as in the rest of the module: cyan the transmitted waveform or its
   spectrum, amber a filter, violet a filter output before its sample or the
   decision statistic, green the received waveform and the decided bits, red an
   error or the interference that causes one. Noise takes no colour.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

const SZ = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const sinc = x => Math.abs(x)<1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
const clamp01 = x => Math.max(0, Math.min(1, x));
const frameOf = (v, last) => v && v.frame!=null ? v.frame : last;
const val = (v, k, d) => v && v[k]!=null ? v[k] : d;
/* Stacked panels, one <svg> each inside the figure's own. A stacked figure
   that grows hands the extra height to one panel, the one named by `grow`. */
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };
const extraHeight = base => { const H = P.hOverride; P.hOverride = null; return H ? Math.max(0, H-base) : 0; };

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

/* The RC channel of 2.4 with T_b = 1: the response to one rectangular bit,
   and q = exp(-2 pi B T_b), the share of a bit that spills into the next. */
function rcResp(bt){ const tau = 1/(2*Math.PI*bt), e = Math.exp(-1/tau);
  return t => t<0 ? 0 : t<=1 ? 1-Math.exp(-t/tau) : (1-e)*Math.exp(-(t-1)/tau); }
const rcq = bt => Math.exp(-2*Math.PI*bt);
/* 2W P(f) of the raised cosine, f in units of W = R_b/2 */
const rcSpec = (f, al) => { const u = Math.abs(f), f1 = 1-al;
  if(al < 1e-9) return u <= 1 ? 1 : 0;
  if(u <= f1) return 1;
  if(u < 2-f1) return 0.5*(1-Math.sin(Math.PI*(u-1)/(2-2*f1)));
  return 0; };
const simpson = (f, a, b, n=400) => { if(b<=a) return 0; const h=(b-a)/n; let s=f(a)+f(b);
  for(let i=1;i<n;i++) s += (i%2?4:2)*f(a+i*h); return s*h/3; };

/* ---- 2.4 Noise on the eye -----------------------------------------------
   The 128 seven-bit patterns of the eye in 2.4, each drawn once with its own
   noise. The histogram takes eight noise values a pattern, 1024 samples at
   the sampling instant. The noise is seeded, so a setting of the sliders is
   always the same figure. */
const EYE_P = [...Array(128)].map((_,j)=>{ const p=(j*37+45)%128, b=[]; for(let k=0;k<7;k++) b.push((p>>k)&1); return b; });
const EYE_W = EYE_P.map((_,j)=>noiseFn(20260960+j, 0.3, 1, 3, 9));
const EYE_Z = gauss(20260951, 1024, 1);
function figEyeNoise(v){
  const bt = val(v,'bt',0.3), sg = val(v,'sg',0.2), r = rcResp(bt);
  const y0 = (bits, t) => bits.reduce((s,b,k)=>s+(b?1:-1)*r(t-k), 0);
  const a = P.Axes(SZ({xr:[-1,2.3], yr:[-2.9,2.9], xlabel:'t/T_b', ylabel:'y(t)',
    xticksOverride:[-1,-0.5,0,0.5,1], ytarget:4}));
  a.raw('<g opacity="0.45">');
  EYE_P.forEach((bits,j)=>{ const pts=[]; for(let i=0;i<=90;i++){ const u=-1+2*i/90, t=6+u;
    pts.push([u, y0(bits,t)+sg*EYE_W[j](t)]); } a.poly(pts, {color:C.out, width:1.05}); });
  a.raw('</g>');
  a.vline(0, {color:C.muted});
  a.vline(1.08, {color:C.muted});
  /* the samples at the sampling instant, as a histogram on its side: each bar
     is one bin of y_k, on the same vertical axis as the eye */
  const NB = 44, lo = -2.2, hi = 2.2, ok = Array(NB).fill(0), bad = Array(NB).fill(0); let ne = 0;
  EYE_P.forEach((bits,j)=>{ const s0 = y0(bits,6), one = bits[5]===1;
    for(let d=0;d<8;d++){ const y = s0 + sg*EYE_Z[j*8+d], k = Math.max(0, Math.min(NB-1, Math.floor((y-lo)/(hi-lo)*NB)));
      if((y>0)===one) ok[k]++; else { bad[k]++; ne++; } } });
  const top = Math.max(40, ...ok.map((c,k)=>c+bad[k])), X0 = 1.14, L = 1.1/top, bw = (hi-lo)/NB;
  for(let k=0;k<NB;k++){ const ya = lo+k*bw+0.01, yb = lo+(k+1)*bw-0.01;
    if(ok[k]) a.rect(X0, ya, X0+L*ok[k], yb, {fill:C.mid});
    if(bad[k]) a.rect(X0+L*ok[k], ya, X0+L*(ok[k]+bad[k]), yb, {fill:C.err}); }
  a.note(2.27, 2.55, 'y_k\\;\\text{at}\\;t=0', {tex:true, fs:14, color:C.mid, anchor:'end'});
  a.note(2.27, -2.7, `\\text{errors}=${ne}\\,/\\,1024`, {tex:true, fs:14, color:ne?C.err:C.muted, anchor:'end'});
  return a.svg();
}

/* ---- 2.6 The equalizer ---------------------------------------------------
   One tap: z(t) = y(t) + w y(t - T_b). The overall pulse is g(t) = r(t) +
   w r(t-1), whose samples are g_0 = 1 - q and g_m = (1-q) q^(m-1) (q + w) for
   m >= 1. The whole tail goes when w = -q, and the half opening of the eye is
   (1 - q) - |q + w|. The eye uses 128 seeded patterns of twelve bits. */
const EQ_P = (()=>{ const r = rng(20260970), o = [];
  for(let j=0;j<128;j++){ const b=[]; for(let k=0;k<12;k++) b.push(r()<0.5?0:1); o.push(b); } return o; })();
function figEqualizer(v){
  const bt = val(v,'bt',0.1), w = val(v,'w',0), q = rcq(bt), r = rcResp(bt);
  const H = 380 + extraHeight(380);
  const g = t => r(t) + w*r(t-1), h = (1-q) - Math.abs(q+w);
  /* the eye after the equalizer on the left, the sampled pulse on the right */
  const a = P.Axes({w:320,h:H,xr:[-1,1],yr:[-2,2],xlabel:'t/T_b',ylabel:'z(t)',
    pad:{l:50,r:14,t:24,b:42},xticksOverride:[-1,0,1],ytarget:4});
  a.raw('<g opacity="0.5">');
  EQ_P.forEach(bits=>{ const pts=[]; for(let i=0;i<=90;i++){ const u=-1+2*i/90, t=11+u;
    pts.push([u, bits.reduce((s,bb,k)=>s+(bb?1:-1)*g(t-k), 0)]); } a.poly(pts, {color:C.out, width:1.05}); });
  a.raw('</g>');
  a.vline(0, {color:C.muted});
  if(h > 0.02){
    a.poly([[0.07,-h],[0.07,h]], {color:C.mid, width:2.4});
    a.poly([[0.03,h],[0.11,h]], {color:C.mid, width:2.4}); a.poly([[0.03,-h],[0.11,-h]], {color:C.mid, width:2.4});
  }
  const b = P.Axes({w:240,h:H,xr:[-0.7,5.6],yr:[-0.9,1.3],xlabel:'m',ylabel:'g_m',
    pad:{l:44,r:14,t:24,b:42},xticksOverride:[0,1,2,3,4,5],ytarget:3});
  b.stem([[0, 1-q]], {color:C.mid});
  const tail = []; for(let m=1;m<=5;m++) tail.push([m, (1-q)*Math.pow(q,m-1)*(q+w)]);
  b.stem(tail, {color:C.err});
  b.note(5.5, 1.12, h > 0.02 ? `\\text{opening }${(2*h).toFixed(2)}` : '\\text{eye closed}',
    {tex:true, fs:14, color:h > 0.02 ? C.mid : C.err, anchor:'end'});
  return `<svg viewBox="0 0 560 ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,320,H)}${place(b.svg(),320,0,240,H)}</svg>`;
}

/* ---- 2.6 Symbol timing ---------------------------------------------------
   The matched-filter output of a rectangular pulse, the triangle of 2.1,
   peaking at t = T_b = 1. The clock starts 0.4 T_b late. Early and late
   samples are taken delta = 0.35 T_b either side; one step moves the clock by
   0.4 e, e = |y(tau - delta)| - |y(tau + delta)|, and the loop then settles
   on the peak, where the two samples agree. */
const tri = t => Math.max(0, 1-Math.abs(t-1));
const TM_D = 0.35;
function tmTau(f){ return f<=1 ? 1.4 : f<=2 ? 1.4-0.28*(f-1) : 1.12-0.12*Math.min(1, f-2); }
function figTiming(v){
  const f = frameOf(v, 3), tau = tmTau(f), op = clamp01(f);
  const a = P.Axes(SZ({h:330, xr:[-0.15,2.4], yr:[-0.12,1.42], xlabel:'t/T_b', ylabel:'y(t)',
    xticksOverride:[0,0.5,1,1.5,2], ytarget:3}));
  a.curve(tri, {color:C.mid, width:2.6, n:900});
  if(op > 0.02){
    a.raw(`<g opacity="${op.toFixed(3)}">`);
    for(const d of [-TM_D, TM_D]){ const x = tau+d;
      a.poly([[x,0],[x,tri(x)]], {color:C.slate, width:1.6, dash:'5 4'});
      a.point(x, tri(x), {color:C.slate, r:4.6}); }
    a.raw('</g>');
  }
  a.poly([[tau,0],[tau,tri(tau)]], {color:C.out, width:2.2});
  a.point(tau, tri(tau), {color:C.out, r:5.2});
  if(op > 0.5){ const e = tri(tau-TM_D) - tri(tau+TM_D);
    a.note(0.06, 1.28, `e=${Math.abs(e)<0.005 ? '0' : e.toFixed(2)}`, {tex:true, fs:15, color:C.ink}); }
  return a.svg();
}

/* ---- 2.6 The spectrum of a bit stream ------------------------------------
   Around each carrier, frequency in units of R_b. The transmit filter is the
   square-root raised cosine of 2.5, so the spectrum sent is the raised cosine
   itself, (1 + alpha) R_b wide. The rectangular pulse sends sinc^2(f T_b).
   The neighbour's band is its raised cosine, centred at the spacing Delta. The
   readout is the share of each spectrum's power that falls inside it. */
const DB_LO = -45;
const dB = x => Math.max(DB_LO-10, 10*Math.log10(Math.max(x, 1e-9)));
function figPsd(v){
  const al = val(v,'al',0.5), dl = val(v,'dl',1.25);
  const rc = f => rcSpec(2*f, al), rect = f => sinc(f)*sinc(f);
  const lo = dl-(1+al)/2, hi = dl+(1+al)/2;
  const a = P.Axes(SZ({xr:[-2.6,3.4], yr:[DB_LO,14], xlabel:'(f-f_c)/R_b', ylabel:'S(f)\\;(\\text{dB})',
    xticksOverride:[-2,-1,0,1,2,3], yticksOverride:[-40,-30,-20,-10,0], ytarget:4}));
  /* the power of each spectrum that lands in the neighbour's band, filled red */
  const fill = fn => { const x0 = Math.max(lo, -2.6), x1 = Math.min(hi, 3.4), pts = [];
    for(let i=0;i<=200;i++){ const x = x0+(x1-x0)*i/200, y = Math.max(DB_LO, Math.min(14, dB(fn(x))));
      pts.push(a.sx(x).toFixed(2)+','+a.sy(y).toFixed(2)); }
    a.raw(`<path d="M${a.sx(x0).toFixed(2)},${a.sy(DB_LO).toFixed(2)}L${pts.join('L')}L${a.sx(x1).toFixed(2)},${a.sy(DB_LO).toFixed(2)}Z" fill="${C.dec.err}" stroke="none"/>`); };
  fill(rect); if(lo < (1+al)/2) fill(rc);
  a.curve(f=>dB(rc(f-dl)), {color:C.slate, width:1.8, dash:'2 4', n:1200});
  a.curve(f=>dB(rect(f)), {color:C.in, width:1.6, dash:'4 4', n:1600});
  a.curve(f=>dB(rc(f)), {color:C.in, width:2.6, n:1200});
  const pr = simpson(rect, lo, hi, 800);
  const prc = simpson(rc, Math.max(lo,-(1+al)/2), Math.min(hi,(1+al)/2)) / simpson(rc, -(1+al)/2, (1+al)/2);
  const pct = x => x < 0.0005 ? '0' : (100*x).toFixed(1);
  a.note(3.35, 8.5, `\\text{rectangle }${pct(pr)}\\%,\\ \\text{RC }${pct(prc)}\\%`,
    {tex:true, fs:14, color:C.ink, anchor:'end'});
  return a.svg();
}

/* ---- 2.6 Regenerative repeaters -----------------------------------------
   Eight bits over four hops. Each hop adds its own noise, sd 0.5 of the pulse
   height, and each decision samples the middle of a bit. An amplifier chain
   carries every hop's noise to the end; a regenerative chain decides after
   every hop and sends a clean waveform on. With these seeds the regenerative
   chain makes one error, at hop 3, which the fourth hop carries forward; the
   amplifier chain, decided after hop 4, makes two. */
const RP_B = [1,0,1,1,0,0,1,0];
const RP_N = [1,2,3,4].map(i=>noiseFn(20261120+i, 0.25, 0.5, -1, 10));
const RP_R = (()=>{ const out = [RP_B.slice()]; let cur = RP_B.slice();
  RP_N.forEach(n=>{ cur = cur.map((b,j)=>((b?1:-1)+n(j+0.5)) > 0 ? 1 : 0); out.push(cur.slice()); }); return out; })();
const lvl = bits => t => { const k = Math.floor(t); return k<0 || k>=bits.length ? 0 : (bits[k]?1:-1); };
function figRepeater(v){
  const f = frameOf(v, 4), k = Math.floor(f+1e-9), fr = f-k;
  const ex = extraHeight(340), h2 = 160+ex, h3 = 180;
  const ax = (h, yr, yl, pb) => P.Axes({w:560,h,xr:[-0.2,8.3],yr,xlabel:pb?'t/T_b':'',ylabel:yl,
    pad:{l:56,r:26,t:22,b:pb?40:14},xticksOverride:pb?[0,2,4,6,8]:[],ytarget:2});
  const s = lvl(RP_B);
  /* amplify and forward: the noise of every hop so far */
  const acc = t => { let n = 0; for(let i=0;i<Math.min(k,4);i++) n += RP_N[i](t); if(k<4) n += fr*RP_N[k](t); return n; };
  const b = ax(h2, [-3.6,3.6], '\\text{amplified}', false);
  if(f < 0.02) b.curve(s, {color:C.in, width:2.2, n:1400});
  else b.curve(t=>t>=0 && t<8 ? s(t)+acc(t) : 0, {color:C.out, width:1.4, n:1600});
  if(f > 3.98) RP_B.forEach((bit,j)=>{ const y = s(j+0.5)+acc(j+0.5);
    b.point(j+0.5, y, {color:(y>0)===(bit===1) ? C.mid : C.err, r:4.4}); });
  /* decide and resend: the received waveform of the current hop, faint, and
     the waveform the repeater sends on, red where a bit is wrong */
  /* drawn at y + 2, so the time ticks sit under the frame and not on the
     edges of the waveform */
  const c = P.Axes({w:560,h:h3,xr:[-0.2,8.3],yr:[0.2,3.8],xlabel:'t/T_b',ylabel:'\\text{regenerated}',
    pad:{l:56,r:26,t:22,b:40},xnameDrop:44*P.labelScale(),xticksOverride:[0,2,4,6,8],yticksOverride:[1,3],ytickfmt:y=>P.fmt(y-2)});
  c.hline(2, {color:C.muted});
  const m = f > 0.02 ? Math.min(4, Math.ceil(f-1e-9)) : 0, sent = RP_R[Math.min(4, Math.floor(f+0.4))];
  if(m > 0){ const prev = lvl(RP_R[m-1]);
    c.curve(t=>2+(t>=0 && t<8 ? prev(t)+RP_N[m-1](t) : 0), {color:C.noise, width:1.3, n:1600}); }
  const cc = f < 0.6 ? C.in : C.out;   /* the sent waveform is cyan, a regenerated one green */
  sent.forEach((bit,j)=>{ const y = bit ? 3 : 1, wrong = bit!==RP_B[j];
    c.poly([[j,y],[j+1,y]], {color:wrong ? C.err : cc, width:2.6});
    if(j && sent[j-1]!==bit) c.poly([[j,1],[j,3]], {color:cc, width:2.6}); });
  c.poly([[-0.2,2],[0,2],[0,sent[0]?3:1]], {color:cc, width:2.6});
  c.poly([[8,sent[7]?3:1],[8,2],[8.3,2]], {color:cc, width:2.6});
  return stack(560, [[b.svg(),h2],[c.svg(),h3]]);
}

const EB = 'Module 2 · The link in practice';
const SC = [

{ id:'m2-eye-noise', module:'M2', nav:'Noise on the eye', title:'Noise on the eye',
  objective:'Add noise to the eye diagram and see which samples cross the threshold first.',
  keywords:'eye diagram noise histogram sampling instant errors bit error rate worst pattern margin',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'Noise on the eye'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[
        {k:'bt', label:'$BT_b$', min:0.12, max:0.6, step:0.01, v:0.3, show:v=>'$'+v.toFixed(2)+'$'},
        {k:'sg', label:'$\\sigma$', min:0, max:0.6, step:0.01, v:0.2, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figEyeNoise,
      caption:'Drag the noise $\\sigma$ and the bandwidth $BT_b$. The bars at the right count $1024$ samples taken at $t=0$. Violet ones fall on the correct side of zero, red ones on the wrong side.'}
  ], right:[
    {t:'eq', label:'One sample', tex:'y_k=\\underbrace{a_k(1-q)}_{\\text{own bit}}+\\underbrace{\\text{ISI}_k}_{\\text{earlier bits}}+\\underbrace{n_k}_{\\text{noise}}',
      note:'Interference moves each sample to one of a few levels. Noise then spreads every level into a bell.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Worst pattern', html:'The levels nearest zero fail first. Their margin is $1-2q$, not $1-q$, so a half-closed eye needs much less noise to fail.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$BT_b=0.3$ and the noise grows slowly from zero.<div class="nsep"></div>Which samples cross zero first?',
        ask:{key:'m2-eye-noise', choices:['the worst-pattern samples','all samples equally','the samples with no interference'], answer:0,
          why:'They sit at $\\pm(1-2q)=\\pm0.70$, the closest level to the threshold.'}}]}
  ]}
]},

/* ---------------------------------------------------------------- 2.6 ---- */
{ id:'m2-equalizer', module:'M2', nav:'The equalizer', title:'The equalizer',
  objective:'Open a closed eye with a one-tap equalizer after the channel.',
  keywords:'equalizer zero forcing tap transversal filter intersymbol interference eye opening noise enhancement',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'The equalizer'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[
        {k:'bt', label:'$BT_b$', min:0.08, max:0.6, step:0.01, v:0.1, show:v=>'$'+v.toFixed(2)+'$'},
        {k:'w', label:'$w$', min:-0.8, max:0.3, step:0.01, v:0, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figEqualizer,
      caption:'Drag the tap $w$. At $BT_b=0.1$ the eye starts closed. The right panel is the pulse after the equalizer, sampled $m$ bits later. Violet is the bit itself, red is what it leaves on later bits.'}
  ], right:[
    {t:'eq', label:'One tap', tex:'z(t)=y(t)+w\\,y(t-T_b)',
      note:'An equalizer is a filter after the channel that removes interference. This one adds $w$ times the waveform one bit earlier.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Zero forcing', html:'Each tail sample is $q$ times the one before, so $w=-q$ cancels them all. The tap also adds a delayed copy of the noise.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$BT_b=0.25$, so $q=0.208$.<div class="nsep"></div>Which tap removes all the interference?',
        ask:{key:'m2-equalizer', choices:['$w=-0.208$','$w=+0.208$','$w=-0.792$'], answer:0,
          why:'The tail samples are $(1-q)q^{m-1}(q+w)$, which vanish for every $m$ when $w=-q$.'}}]}
  ]}
]},

{ id:'m2-timing', module:'M2', nav:'Finding the sampling instant', title:'Finding the sampling instant',
  objective:'Show how an early–late gate moves the receiver clock to the peak of the matched-filter output.',
  keywords:'symbol synchronization timing recovery early late gate clock sampling instant matched filter peak',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'Finding the sampling instant'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['a late clock','early and late samples','a step earlier','locked']},
      svg:figTiming,
      caption:'Step through the frames. The green line is the clock on the matched-filter output of a rectangular pulse, with samples $\\delta=0.35T_b$ either side.'},
    {t:'legend', items:[['mid','$y(t)$'],['out','clock $\\tau$'],['slate','early and late']], at:'tr'}
  ], right:[
    {t:'note', kind:'def', head:'Early–late gate', html:'Take two extra samples, $\\delta$ before and $\\delta$ after the clock. The output is symmetric about its peak, so the two agree only there.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Error signal', tex:'e=|y(\\tau-\\delta)|-|y(\\tau+\\delta)|',
        note:'If $e>0$ the clock is late and moves earlier. If $e<0$ it moves later.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The early sample is $0.62$ and the late sample is $0.80$.<div class="nsep"></div>Is the clock early, late or on time?',
        ask:{key:'m2-timing', choices:['early','late','on time'], answer:0,
          why:'The larger sample lies on the side of the peak. The late one is larger, so the peak comes after the clock.'}}]}
  ]}
]},

{ id:'m2-psd', module:'M2', nav:'The spectrum of a bit stream', title:'The spectrum of a bit stream',
  objective:'Compare the spectrum of rectangular and raised-cosine pulses and the power they leave on a neighbouring channel.',
  keywords:'power spectral density spectrum bit stream rectangular pulse sinc squared raised cosine neighbouring channel spacing adjacent',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'The spectrum of a bit stream'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[
        {k:'al', label:'$\\alpha$', min:0, max:1, step:0.05, v:0.5, show:v=>'$'+v.toFixed(2)+'$'},
        {k:'dl', label:'$\\Delta/R_b$', min:0.8, max:2.2, step:0.05, v:1.25, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figPsd,
      caption:'Drag the roll-off $\\alpha$ and the channel spacing $\\Delta$. The red area is power that lands in the neighbouring channel. The numbers at the top give its share for each pulse.'},
    {t:'legend', items:[['in','raised cosine'],['in','rectangle',true],['slate','neighbour',true]], at:'tl-axis'}
  ], right:[
    {t:'eq', label:'Power spectrum', tex:'S(f)=\\frac{|G_T(f)|^2}{T_b}',
      note:'For independent, equally likely $\\pm1$ bits and transmit filter $G_T(f)$. The stream has the spectrum of one pulse.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Neighbours', html:'A rectangular pulse keeps only $90\\%$ of its power inside $|f-f_c|<R_b$. A raised cosine stops at $(1+\\alpha)R_b/2$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Channels are $1.25$ MHz apart. Each carries $R_b=1$ Mb/s with a raised cosine.<div class="nsep"></div>What is the largest $\\alpha$ that keeps them apart?',
        ask:{key:'m2-psd', choices:['$0.25$','$0.5$','$1$'], answer:0,
          why:'Each band is $(1+\\alpha)R_b$ wide, so $(1+\\alpha)(1\\ \\text{MHz})\\le1.25$ MHz gives $\\alpha\\le0.25$.'}}]}
  ]}
]},

{ id:'m2-repeater', module:'M2', nav:'Regenerative repeaters', title:'Regenerative repeaters',
  objective:'Compare a chain of amplifiers with a chain of regenerative repeaters over many hops.',
  keywords:'regenerative repeater analog repeater amplifier hops noise accumulation error propagation long link',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:EB},
  {t:'title', text:'Regenerative repeaters'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      frames:{labels:['sent','hop $1$','hop $2$','hop $3$','hop $4$']},
      svg:figRepeater,
      caption:'Step through four hops of the bits $1,0,1,1,0,0,1,0$. Amplifying collects the noise of every hop. Regenerating sends a clean waveform on, and a wrong bit, drawn red, stays wrong.'}
  ], right:[
    {t:'note', kind:'def', head:'Two repeaters', html:'<div class="cmp"><div><span class="cmp-h">Analog</span>Amplifies the signal and the noise together.</div><div><span class="cmp-h">Regenerative</span>Decides the bits and sends a clean waveform on.</div></div>'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'After $K$ hops', tex:'\\begin{aligned}P_{\\text{regen}}&\\approx K\\,Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)\\\\P_{\\text{analog}}&=Q\\bigl(\\sqrt{2E_b/(KN_0)}\\bigr)\\end{aligned}',
        note:'For $K=50$ hops and $P_b=10^{-6}$, regeneration needs $E_b/N_0=11.8$ dB and amplification $27.5$ dB.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A chain of $100$ regenerative repeaters has $p=10^{-6}$ a hop.<div class="nsep"></div>About what is the end-to-end $P_b$?',
        ask:{key:'m2-repeater', choices:['$10^{-6}$','$10^{-4}$','$10^{-2}$'], answer:1,
          why:'$P_b\\approx Kp=100\\times10^{-6}=10^{-4}$. Each hop adds its own errors.'}}]}
  ]}
]}

];

window.SCENES_M2X = SC;
})();
