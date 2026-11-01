/* ==========================================================================
   Module 2 — one visual scene added to the module.

   One slide in 2.5 puts noise on the eye diagram and reads the error count
   off the samples at the sampling instant. Its address lives in
   `89_sections.js`, and the scene takes its place in the module from there.

   The scene is kept in its own file, beside `83_scenes_m2.js`, with the
   few helpers it needs copied rather than shared, since that file keeps its
   helpers inside its own closure.

   Colour, as in the rest of the module: cyan the transmitted waveform or its
   spectrum, amber a filter, violet a filter output before its sample or the
   decision statistic, green the received waveform and the decided bits, red an
   error or the interference that causes one. Noise takes no colour.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

const SZ = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const val = (v, k, d) => v && v[k]!=null ? v[k] : d;

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

/* ---- 2.5 Noise on the eye -----------------------------------------------
   The 128 seven-bit patterns of the eye in 2.5, each drawn once with its own
   noise, through the Gaussian channel of the eye slides: bit k on
   [k-1/2, k+1/2] comes out as Q((t-k-1/2)/sigma) - Q((t-k+1/2)/sigma) with
   sigma = sqrt(ln 2)/(2 pi B T_b), and the line holds the outer bits beyond
   the pattern. The fourth bit is sampled at its centre, t = 3. The histogram
   takes eight noise values a pattern, 1024 samples at the sampling instant.
   The noise is seeded, so a setting of the sliders is always the same
   figure. */
function erfc(x){ const z=Math.abs(x), t=1/(1+0.5*z);
  const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806
    +t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x>=0 ? r : 2-r; }
const Qf = x => 0.5*erfc(x/Math.SQRT2);
const EYE_P = [...Array(128)].map((_,j)=>{ const p=(j*37+45)%128, b=[]; for(let k=0;k<7;k++) b.push((p>>k)&1); return b; });
const EYE_W = EYE_P.map((_,j)=>noiseFn(20260960+j, 0.3, 1, 1, 5));
const EYE_Z = gauss(20260951, 1024, 1);
function figEyeNoise(v){
  const bt = val(v,'bt',0.5), sg = val(v,'sg',0.2), s = Math.sqrt(Math.LN2)/(2*Math.PI*bt);
  const y0 = (bits, t) => bits.reduce((y,b,k)=>y+(b?1:-1)*(Qf((t-k-0.5)/s)-Qf((t-k+0.5)/s)),
    (bits[0]?1:-1)*Qf((t+0.5)/s) + (bits[6]?1:-1)*(1-Qf((t-6.5)/s)));
  const a = P.Axes(SZ({xr:[-1,2.3], yr:[-2.9,2.9], xlabel:'t', xunit:'T_b', ylabel:'y(t)',
    xticksOverride:[-1,-0.5,0,0.5,1], ytarget:4}));
  a.raw('<g opacity="0.45">');
  EYE_P.forEach((bits,j)=>{ const pts=[]; for(let i=0;i<=90;i++){ const u=-1+2*i/90, t=3+u;
    pts.push([u, y0(bits,t)+sg*EYE_W[j](t)]); } a.poly(pts, {color:C.out, width:1.05}); });
  a.raw('</g>');
  a.vline(0, {color:C.muted});
  a.vline(1.08, {color:C.muted});
  /* the opening the traces leave at t = 0: the lowest trace of a 1 against
     the highest trace of a 0. Noise eats it from both sides; once the two
     cross, the band between them is red and the eye is closed. */
  let y1m = Infinity, y0m = -Infinity;
  EYE_P.forEach((bits,j)=>{ const y = y0(bits,3)+sg*EYE_W[j](3); if(bits[3]) y1m = Math.min(y1m, y); else y0m = Math.max(y0m, y); });
  if(y1m > y0m){ const x = 0.07;
    a.poly([[x,y0m],[x,y1m]], {color:C.mid, width:2.6});
    a.poly([[x-0.035,y0m],[x+0.035,y0m]], {color:C.mid, width:2.6}); a.poly([[x-0.035,y1m],[x+0.035,y1m]], {color:C.mid, width:2.6});
    a.note(-0.95, 2.55, `\\text{eye opening}=${(y1m-y0m).toFixed(2)}`, {tex:true, fs:14, color:C.mid});
  } else {
    a.rect(-0.12, y1m, 0.12, y0m, {fill:C.err});
    a.note(-0.95, 2.55, '\\text{eye closed}', {tex:true, fs:14, color:C.err});
  }
  /* the samples at the sampling instant, as a histogram on its side: each bar
     is one bin of y_k, on the same vertical axis as the eye */
  const NB = 44, lo = -2.2, hi = 2.2, ok = Array(NB).fill(0), bad = Array(NB).fill(0); let ne = 0;
  EYE_P.forEach((bits,j)=>{ const s0 = y0(bits,3), one = bits[3]===1;
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
        {k:'bt', label:'$BT_b$', min:0.15, max:0.8, step:0.01, v:0.5, show:v=>'$'+v.toFixed(2)+'$'},
        {k:'sg', label:'$\\sigma$', min:0, max:0.6, step:0.01, v:0.2, show:v=>'$'+v.toFixed(2)+'$'}]},
      svg:figEyeNoise,
      caption:'Drag the noise $\\sigma$ and the bandwidth $BT_b$ of the Gaussian channel. The violet bracket is the opening left at $t=0$. It turns red when the eye closes. The bars at the right count $1024$ samples taken at $t=0$, red ones on the wrong side of zero.'}
  ], right:[
    {t:'eq', label:'One sample', tex:'y_k=\\underbrace{a_k(1-2q)}_{\\text{own bit}}+\\underbrace{\\text{ISI}_k}_{\\text{other bits}}+\\underbrace{n_k}_{\\text{noise}}',
      note:'Interference moves each sample to one of a few levels. Noise then spreads every level into a bell.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Worst pattern', html:'The levels nearest zero fail first. Their margin is $1-4q$, not $1-2q$, so a half-closed eye needs much less noise to fail.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$BT_b=0.5$ and the noise grows slowly from zero.<div class="nsep"></div>Which samples cross zero first?',
        ask:{key:'m2-eye-noise', choices:['the worst-pattern samples','all samples equally','the samples with no interference'], answer:0,
          why:'They sit at $\\pm(1-4q)=\\pm0.88$, the closest level to the threshold.'}}]}
  ]}
]},
];

window.SCENES_M2X = SC;
})();
