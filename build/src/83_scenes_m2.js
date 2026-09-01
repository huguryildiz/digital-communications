/* ==========================================================================
   Module 2 — Baseband transmission of digital signals.

   One bit is sent as one waveform; the channel adds noise; the receiver has to
   decide. The module answers three questions in order. What filter should the
   receiver use? Where should the threshold go? And what happens when the
   channel is bandlimited and the pulses start to overlap?

   Colour: cyan is the transmitted waveform, amber the filter, green the
   detected output, violet the decision statistic, red an error or the
   interference that causes one. Noise is the hairline tone.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;
const sinc = x => Math.abs(x)<1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);

/* A seeded generator, so every noise figure is the same figure on every
   machine and in every render. */
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }

/* The Gaussian tail, by a rational approximation good to about 1e-7 — enough
   for a figure and for a readout, and the closed forms it draws are checked
   against a simulation in the numerical gate rather than against this. */
function Qf(x){
  const t = 1/(1+0.2316419*Math.abs(x));
  const d = 0.3989422804014327*Math.exp(-x*x/2);
  const p = d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0 ? p : 1-p;
}

function figReceiver(){
  return P.blocks({w:720,h:210,items:[
    {t:'arrow',x1:20,y1:70,x2:110,y2:70},
    {t:'sum',x:140,y:70},
    {t:'arrow',x1:100,y1:130,x2:140,y2:92},
    {t:'arrow',x1:158,y1:70,x2:250,y2:70},
    {t:'box',x:250,y:36,w:190,h:68,label:'h(t)',tex:true},
    {t:'arrow',x1:440,y1:70,x2:540,y2:70},
    {t:'text',x:60,y:52,label:'g(t)',tex:true,fs:16},
    {t:'text',x:100,y:150,label:'w(t)',tex:true,fs:15},
    {t:'text',x:200,y:52,label:'x(t)',tex:true,fs:16},
    {t:'text',x:492,y:52,label:'y(t)',tex:true,fs:16},
    {t:'text',x:632,y:44,label:'y(T)',tex:true,fs:16},
    {t:'line',d:'M540,70 h34'},
    {t:'line',d:'M574,70 l22,-14'},
    {t:'text',x:585,y:110,label:'\\text{sample at }t=T',tex:true,fs:13},
    {t:'text',x:345,y:140,label:'linear time-invariant filter',fs:12.5}
  ]});
}

function figMatched(){
  const T = 1;
  const a = P.Axes({w:640,h:210,xr:[-0.3,2.3],yr:[-0.3,1.35],
    xlabel:'t',ylabel:'s(t),\\;h_{\\mathrm{opt}}(t),\\;y(t)',pad:{l:60,r:26,t:26,b:40},
    xtarget:5,ytarget:3});
  a.poly([[-0.3,0],[0,0],[0,1],[T,1],[T,0],[2.3,0]],{color:C.in,width:2.2});
  a.poly([[-0.3,0],[0,0],[0,0.55],[T,0.55],[T,0],[2.3,0]],{color:C.h,width:2.0,dash:'6 4'});
  a.curve(t=>t<0?0:t<T?t:t<2*T?2*T-t:0,{color:C.out,width:2.4});
  a.vline(T,{color:C.muted});
  a.note(1.02,1.16,'y(T)=E_s',{tex:true,fs:14,color:C.out});
  return a.svg();
}

function figDensities(lam){
  const s = Math.sqrt(0.5), A = 1;
  const g = (y,m) => Math.exp(-(y-m)*(y-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
  const a = P.Axes({w:660,h:260,xr:[-3.2,3.2],yr:[-0.05,0.72],
    xlabel:'y',ylabel:'f_Y(y\\mid s_m)',pad:{l:56,r:26,t:26,b:42},xtarget:6,ytarget:4});
  /* The decision regions are the colour of the symbol they decide for, at the
     opacity a region takes throughout this course. */
  a.rect(-3.2,0,lam,0.70,{fill:C.dec.err});
  a.rect(lam,0,3.2,0.70,{fill:C.dec.out});
  a.curve(y=>0.7*g(y,-A),{color:C.err,width:2.2});
  a.curve(y=>0.3*g(y, A),{color:C.out,width:2.2});
  a.vline(lam,{color:C.ink,dash:'5 4',width:1.6});
  a.note(lam,0.66,'\\lambda',{tex:true,fs:15,color:C.ink,anchor:'middle'});
  return a.svg();
}

function figPe(){
  /* The curve is stopped half a decade above the bottom of the range. Run to
     the edge it crosses the axis name, and an axis name a curve runs through
     is the one thing the label sweep holds to a stricter standard. */
  const a = P.Axes({w:640,h:300,xr:[0,12],yr:[-7,-0.02],
    xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_b',ytickfmt:P.decade,yticksOverride:P.decades(-7,-1),zeroAxes:false,
    pad:{l:60,r:26,t:26,b:44},xtarget:6,ytarget:6});
  a.curve(d=>Math.log10(Math.max(1e-12,Qf(Math.sqrt(2*Math.pow(10,d/10))))),
    {color:C.in,width:2.4});
  return a.svg();
}

function figIsi(alpha){
  const Tb = 1, W = 1/(2*Tb);
  const p = t => {
    const den = 1-16*alpha*alpha*W*W*t*t;
    if(Math.abs(den) < 1e-6) return sinc(2*W*t)*Math.PI/4;
    return sinc(2*W*t)*Math.cos(2*Math.PI*alpha*W*t)/den;
  };
  const bits = [1,-1,1,1,-1,-1,1,-1];
  const a = P.Axes({w:660,h:230,xr:[-1,8],yr:[-1.8,1.8],
    xlabel:'t/T_b',ylabel:'\\text{received pulse train}',pad:{l:60,r:26,t:26,b:42},
    xtarget:6,ytarget:4});
  bits.forEach((b,k)=>a.curve(t=>b*p(t-k),{color:C.mid,width:1,opacity:0.55,dash:'3 3'}));
  a.curve(t=>{let s=0;bits.forEach((b,k)=>{s+=b*p(t-k);});return s;},{color:C.in,width:2.3});
  bits.forEach((b,k)=>a.point(k,(()=>{let s=0;bits.forEach((c,j)=>{s+=c*p(k-j);});return s;})(),
    {color:C.out,r:3.6}));
  return a.svg();
}

function figEye(alpha, jitter){
  const Tb=1, W=1/(2*Tb);
  const p = t => { const den=1-16*alpha*alpha*W*W*t*t;
    if(Math.abs(den)<1e-6) return sinc(2*W*t)*Math.PI/4;
    return sinc(2*W*t)*Math.cos(2*Math.PI*alpha*W*t)/den; };
  const a = P.Axes({w:470,h:200,xr:[-1,1],yr:[-1.9,1.9],
    xlabel:'t/T_b',ylabel:'y(t)',pad:{l:50,r:22,t:24,b:40},xtarget:4,ytarget:3});
  const noise = gauss(20260802, 512, jitter);
  for(let pat=0;pat<32;pat++){
    const b=[]; for(let k=0;k<5;k++) b.push(((pat>>k)&1)?1:-1);
    const pts=[];
    for(let i=0;i<=120;i++){
      const t=-1+2*i/120;
      let s=0; for(let k=0;k<5;k++) s += b[k]*p(t-(k-2));
      pts.push([t, s + noise[(pat*121+i)%512]]);
    }
    a.poly(pts,{color:C.in,width:0.9,opacity:0.5});
  }
  a.vline(0,{color:C.h,dash:'5 4'});
  return a.svg();
}

/* ---- summary-card miniatures ----
   Each recalls the key figure of its section, stripped to the shape alone. */
function mini(w,h,xr,yr){ return P.Axes({w:w,h:h,xr:xr,yr:yr,pad:{l:10,r:10,t:8,b:8},
  xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}); }
function miniMatched(){
  const a = mini(520,96,[-0.2,2.4],[-0.15,1.2]);
  a.curve(t=>(t>0&&t<1)? t : 0,{color:C.in,width:2});
  a.curve(t=>(t>1.2&&t<2.2)? 2.2-t : 0,{color:C.h,width:2});
  return a.svg();
}
function miniThreshold(){
  const a = mini(520,96,[-3.4,3.4],[0,1.15]);
  const g=(x,m)=>Math.exp(-(x-m)*(x-m)/0.9);
  a.curve(x=>g(x,-1.4),{color:C.in,width:2});
  a.curve(x=>g(x,1.4),{color:C.mid,width:2});
  a.vline(0.2,{color:C.ink,dash:'4 3'});
  return a.svg();
}
function miniPe(){
  const a = mini(520,96,[0,12],[-7,0]);
  a.curve(d=>Math.log10(Math.max(1e-12,Qf(Math.sqrt(2*Math.pow(10,d/10))))),{color:C.in,width:2});
  return a.svg();
}
function miniRcos(){
  const a = mini(520,96,[-1.3,1.3],[0,1.18]);
  const rc=(f,al)=>{const x=Math.abs(f),f1=(1-al)/2,f2=(1+al)/2;
    return x<=f1?1:x>=f2?0:0.5*(1+Math.cos(Math.PI*(x-f1)/Math.max(al,1e-9)));};
  [[0,C.in],[0.5,C.h],[1,C.out]].forEach(([al,c])=>a.curve(f=>rc(f,al),{color:c,width:2}));
  return a.svg();
}

const SC = [

/* ---------------------------------------------------------------- 2.0 ---- */
{ id:'m2-open', module:'M2', nav:'The receiver problem', title:'The receiver problem',
  objective:'Frame the three questions the module answers.',
  keywords:'baseband receiver matched filter threshold intersymbol interference opening',
  src:'CH8 s.2–3', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Opening'},
  {t:'title', text:'The receiver problem'},
  {t:'lede', text:'Module 1 produced a bit stream. A transmitter now sends one waveform per bit, a channel adds noise to it, and a receiver has to say which waveform was sent. Everything in this module is one of three questions about that receiver.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p><b>What filter?</b> The receiver observes the waveform for one bit interval and has to compress it to a single number. Some filters make that number more reliable than others, and one of them is best.</p>'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p><b>Where is the threshold?</b> The number is compared against a threshold. Where the threshold goes depends on how likely the two symbols were before anything was received.</p>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p><b>What if the pulses overlap?</b> A channel of finite bandwidth spreads each pulse in time, so a pulse meant for one interval leaks into the next. That is intersymbol interference, and it is the only error in this module that noise did not cause.</p>'},
      {t:'note', kind:'ok', head:'Connection to Module 3', html:'The matched-filter result depends on waveform energy, not waveform shape. This result supports the geometric representation in Module 3.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:figReceiver, caption:'The receiver model: the transmitted waveform, the noise added to it, one linear filter, and one sample taken at the end of the bit interval. Everything the detector knows is that sample.'}
  ]}
]},

/* ---------------------------------------------------------------- 2.1 ---- */
{ id:'m2-model', module:'M2', nav:'The peak pulse SNR', title:'The peak pulse signal-to-noise ratio',
  objective:'Define the quantity the filter is chosen to maximise.',
  keywords:'received signal white gaussian noise peak pulse signal to noise ratio filter output',
  src:'CH8 s.3–6', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The peak pulse signal-to-noise ratio'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'The received signal over one bit interval is'},
    {t:'eq', tex:'x(t)=g(t)+w(t),\\qquad 0<t<T'},
    {t:'small', html:'with $g$ the waveform carrying the symbol and $w$ white Gaussian noise of two-sided power spectral density $N_0/2$. The filter output splits the same way, because it is linear:'},
    {t:'eq', tex:'y(t)=x(t)*h(t)=\\underbrace{g(t)*h(t)}_{g_0(t)}+\\underbrace{w(t)*h(t)}_{n(t)}'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The figure of merit', html:'The sample is taken at $t=T$, so what matters is the signal there against the noise power that accompanies it:'},
      {t:'eq', key:true, tex:'(\\mathrm{SNR})_o=\\frac{|g_0(T)|^{2}}{E[n^{2}(t)]}'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'Both parts can be written in terms of $H(f)$. The signal part is an inverse transform evaluated at $t=T$. The noise part is the area under the filtered noise density.'},
      {t:'eq', tex:'(\\mathrm{SNR})_o=\\frac{\\left|\\int_{-\\infty}^{\\infty}G(f)H(f)e^{j2\\pi fT}\\,df\\right|^{2}}{\\dfrac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^{2}\\,df}'},
      {t:'note', kind:'warn', head:'The problem, stated', html:'For a given $G(f)$, find the $H(f)$ that maximises this ratio. Both the numerator and the denominator grow when $H$ is scaled up, so the answer cannot be "make $H$ large". It has to be about the <em>shape</em> of $H$.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a=P.Axes({w:620,h:300,xr:[0,5],yr:[-2.6,2.6],
        xlabel:'t/T_b',ylabel:'x(t)',pad:{l:52,r:26,t:26,b:44},xtarget:5,ytarget:4});
      const bits=[1,-1,1,1,-1];
      const n=gauss(20260802,900,0.55);
      const pts=[];
      for(let i=0;i<900;i++){ const t=5*i/900; pts.push([t, bits[Math.min(4,Math.floor(t))]+n[i]]); }
      a.poly(pts,{color:C.noise,width:0.9});
      const cl=[]; for(let i=0;i<900;i++){ const t=5*i/900; cl.push([t,bits[Math.min(4,Math.floor(t))]]); }
      a.poly(cl,{color:C.in,width:2.2});
      return a.svg();
    }, caption:'Five polar-NRZ bits with noise. The clean transmitted waveform is drawn over the received waveform. The receiver observes only the received waveform.'}
  ]}
]},

{ id:'m2-schwarz', module:'M2', nav:'The bound', title:'The bound on the output SNR',
  objective:'Apply Schwarz\'s inequality to bound the output SNR.',
  keywords:'schwarz inequality bound optimisation equality condition energy',
  src:'CH8 s.7–8', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The bound on the output SNR'},
  {t:'lede', text:'A bound that does not depend on the filter.'},
  {t:'note', kind:'def', head:'Schwarz\'s inequality', html:'For two finite-energy signals $\\phi_1$ and $\\phi_2$, $$\\left|\\int\\phi_1(x)\\phi_2(x)\\,dx\\right|^{2}\\le\\int|\\phi_1(x)|^{2}dx\\int|\\phi_2(x)|^{2}dx,$$ with equality if and only if $\\phi_1(x)=k\\,\\phi_2^{*}(x)$ for some constant $k$.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Take $\\phi_1(f)=H(f)$ and $\\phi_2(f)=G(f)e^{j2\\pi fT}$. The numerator of the ratio is exactly the left-hand side, and $|e^{j2\\pi fT}|=1$, so'},
    {t:'eq', tex:'\\left|\\int G(f)H(f)e^{j2\\pi fT}df\\right|^{2}\\le\\int|H(f)|^{2}df\\int|G(f)|^{2}df'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Substituting into the ratio, the factor $\\int|H|^{2}$ appears above and below and cancels:'},
      {t:'eq', key:true, tex:'(\\mathrm{SNR})_o\\le\\frac{2}{N_0}\\int_{-\\infty}^{\\infty}|G(f)|^{2}\\,df=\\frac{2E}{N_0}'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Interpret the bound', html:'The bound contains no $H$. In white Gaussian noise, no linear filter can give an output ratio greater than $2E/N_0$. A matched filter reaches this bound. Thus, pulses with the same energy give the same maximum output ratio when each pulse uses its own matched filter.'}
    ]}
  ], right:[
    {t:'body', html:'<p>The condition for equality is what identifies the filter:</p>'},
    {t:'eq', key:true, tex:'H(f)=k\\,\\phi_2^{*}(f)=k\\,G^{*}(f)e^{-j2\\pi fT}'},
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:470,h:190,xr:[-2.6,2.6],yr:[-0.08,1.25],
        xlabel:'f', ylabel:'|G(f)|,\\;|H(f)|',
        pad:{l:56,r:22,t:22,b:40}, xtarget:4, ytarget:3, ytickfmt:()=>''});
      const g = f => Math.exp(-f*f/1.1)*(0.72+0.28*Math.cos(2.1*f));
      a.curve(g,{color:C.in,width:2.3});
      a.curve(f=>0.8*g(f),{color:C.h,width:2.0,dash:'6 4'});
      return a.svg();
    }, caption:'The equality condition drawn: the magnitude of the best filter traces the magnitude of the signal spectrum, scaled by $k$. Where the signal has little energy, the filter listens less. The next scene takes the inverse transform and finds something simpler than it looks.'}
  ]}
]},

{ id:'m2-matched', module:'M2', nav:'The matched filter', title:'The matched filter',
  objective:'Derive the impulse response of the matched filter.',
  keywords:'matched filter impulse response time reversed shifted conjugate',
  src:'CH8 s.9', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'The matched filter'},
  {t:'lede', text:'The filter is the signal, backwards.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Take the inverse transform of the optimum $H(f)$. Since $g$ is real, $G^{*}(f)=G(-f)$, and the exponential is a shift:'},
    {t:'eq', tex:'h_{\\mathrm{opt}}(t)=\\int k\\,G(-f)\\,e^{-j2\\pi f(T-t)}\\,df'},
    {t:'eq', key:true, tex:'h_{\\mathrm{opt}}(t)=k\\,g(T-t),\\qquad 0<t<T'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Matched filter', html:'The optimum filter\'s impulse response is the transmitted waveform <b>reversed in time and shifted</b> so that it fits inside the bit interval. It is said to be <em>matched</em> to that waveform.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'The output at the sampling instant is then'},
      {t:'eq', tex:'y(T)=\\int_{0}^{T}s(\\tau)\\,s\\bigl(T-(T-\\tau)\\bigr)\\,d\\tau=\\int_{0}^{T}s^{2}(\\tau)\\,d\\tau=E_s'},
      {t:'note', kind:'ok', head:'Filter output', html:'At the correct sampling time, the matched filter returns the energy of its matched waveform. This operation is a correlation.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:figMatched, caption:'A rectangular pulse of duration $T$, the filter matched to it, and the output. For a symmetric pulse the reversal changes nothing, which is why the filter is drawn dashed over the pulse rather than beside it. The output peaks at exactly $t=T$ and its peak is the energy.'},
    {t:'legend', items:[['in','transmitted pulse'],['h','matched filter'],['out','filter output']]}
  ]}
]},

{ id:'m2-props', module:'M2', nav:'What the matched filter achieves', title:'Properties of the matched filter',
  objective:'Establish that the output SNR depends only on the energy-to-density ratio.',
  keywords:'output snr energy noise spectral density unitless shape independent',
  src:'CH8 s.12–13', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Properties of the matched filter'},
  {t:'lede', text:'Energy, not shape.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Substituting $H(f)=kG^{*}(f)e^{-j2\\pi fT}$ back into the two parts gives, by Parseval,'},
    {t:'eq', tex:'g_0(T)=k\\int|G(f)|^{2}df=k\\,E,\\qquad E[n^{2}(t)]=\\frac{k^{2}N_0}{2}E'},
    {t:'eq', key:true, tex:'(\\mathrm{SNR})_o=\\frac{(kE)^{2}}{k^{2}N_0E/2}=\\frac{2E}{N_0}'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Three things this says', html:'<ol><li>The constant $k$ cancels. Any scaling of the filter gives the same ratio, so the filter is determined only up to a gain.</li><li>The ratio depends on the <b>energy</b> of the pulse and on the noise density, and on nothing else about the pulse.</li><li>$E/N_0$ is dimensionless: energy in joules over watts per hertz, and a watt per hertz is a joule.</li></ol>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The consequence worth stating early', html:'A designer choosing a pulse shape is not choosing performance in noise — that is fixed by the energy. The shape is chosen for other reasons: bandwidth, how fast the pulse decays, how much it interferes with its neighbours. Those are the second half of this module.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a=P.Axes({w:600,h:280,xr:[-0.2,1.2],yr:[-0.2,2.4],
        xlabel:'t/T',ylabel:'s(t)',pad:{l:52,r:26,t:26,b:44},xtarget:4,ytarget:4});
      /* three pulses of equal energy and very different shape */
      a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[1.2,0]],{color:C.in,width:2.2});
      a.curve(t=>t>0&&t<1?Math.sqrt(2)*Math.sin(Math.PI*t)*1.0/Math.SQRT1_2*0.7071:0,
        {color:C.mid,width:2.2});
      a.poly([[-0.2,0],[0,0],[0.5,2],[1,0],[1.2,0]],{color:C.h,width:2.2,dash:'6 4'});
      return a.svg();
    }, caption:'Three pulses have the same energy. In white Gaussian noise, their matched-filter receivers give the same output signal-to-noise ratio. Pulse shape does not change this ratio.'}
  ]}
]},

{ id:'m2-lab-c', module:'M2', nav:'Laboratory C', title:'Laboratory C · The matched filter',
  objective:'Let the reader change the pulse, the noise and the sampling instant.',
  keywords:'laboratory matched filter pulse shape noise sampling instant interactive',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · The matched filter'},
  {t:'title', text:'Laboratory C · The matched filter'},
  {t:'body', html:'Choose the pulse shape, noise level, and sampling time. The laboratory calculates the measured output signal-to-noise ratio from the waveform. The predicted value is $2E/N_0$. A sampling time other than $t=T$ decreases the ratio.'},
  {t:'lab', id:'C'}
]},

/* ---------------------------------------------------------------- 2.2 ---- */
{ id:'m2-basis', module:'M2', nav:'One basis, two symbols', title:'One basis, two symbols',
  objective:'Introduce the unit-energy basis and antipodal signalling.',
  keywords:'basis function unit energy polar nrz antipodal signalling one dimensional',
  src:'CH8 s.17', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'One basis, two symbols'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Both waveforms of a binary baseband system are multiples of the same rectangular shape, so one unit-energy function carries both:'},
    {t:'eq', tex:'\\psi(t)=\\begin{cases}\\dfrac{1}{\\sqrt{T_b}}, & 0\\le t\\le T_b\\\\[4pt] 0,&\\text{otherwise}\\end{cases}\\qquad \\int_0^{T_b}\\psi^{2}(t)\\,dt=1'},
    {t:'eq', tex:'s_m(t)=s_m\\,\\psi(t),\\qquad s_0=-A\\sqrt{T_b},\\quad s_1=+A\\sqrt{T_b}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'In the time domain those are simply $\\mp A$ held for the whole bit interval — polar NRZ, the line code of Module 1. Both carry the same energy:'},
      {t:'eq', tex:'E_{s_0}=E_{s_1}=\\int_0^{T_b}A^{2}dt=A^{2}T_b\\;\\triangleq\\;E_b,\\qquad A\\sqrt{T_b}=\\sqrt{E_b}'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Signal-space notation', html:'The two waveforms become the numbers $\\pm\\sqrt{E_b}$ on one axis. Module 3 extends this representation to a finite signal set. Module 4 uses it to construct the receiver.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a=P.Axes({w:600,h:220,xr:[-0.3,1.3],yr:[-1.6,1.6],
        xlabel:'t/T_b',ylabel:'s_0(t),\\;s_1(t)',pad:{l:56,r:26,t:26,b:44},xtarget:4,ytarget:4});
      a.poly([[-0.3,0],[0,0],[0,1],[1,1],[1,0],[1.3,0]],{color:C.in,width:2.2});
      a.poly([[-0.3,0],[0,0],[0,-1],[1,-1],[1,0],[1.3,0]],{color:C.err,width:2.2});
      a.note(0.5,1.25,'s_1(t)=+A',{tex:true,fs:14,color:C.in,anchor:'middle'});
      a.note(0.5,-1.42,'s_0(t)=-A',{tex:true,fs:14,color:C.err,anchor:'middle'});
      return a.svg();
    }, caption:'The two waveforms of polar NRZ. They differ by a sign and nothing else, which is what "antipodal" means.'},
    {t:'fig', svg:()=>{
      const a=P.Axes({w:600,h:130,xr:[-1.8,1.8],yr:[-0.7,0.7],
        xlabel:'\\text{signal space (one dimension)}',pad:{l:40,r:26,t:22,b:44},
        xtarget:4,yticksOverride:[],ytarget:1});
      a.point(-1,0,{color:C.err,r:6}); a.point(1,0,{color:C.in,r:6});
      a.note(-1,0.28,'s_0=-\\sqrt{E_b}',{tex:true,fs:13,color:C.err,anchor:'middle'});
      a.note(1,0.28,'s_1=+\\sqrt{E_b}',{tex:true,fs:13,color:C.in,anchor:'middle'});
      return a.svg();
    }, caption:'The same two waveforms as two points. The distance between them is $2\\sqrt{E_b}$, and Module 4 shows that this distance is what the error probability actually depends on.'}
  ]}
]},

{ id:'m2-correlator', module:'M2', nav:'Two demodulators, one number', title:'Correlator and matched-filter demodulators',
  objective:'Show that the correlator and the matched filter give the same statistic.',
  keywords:'correlator demodulator matched filter equivalent decision statistic sample',
  src:'CH8 s.19–20', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The demodulator'},
  {t:'title', text:'Correlator and matched-filter demodulators'},
  {t:'lede', text:'Two demodulators, one number.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'The <b>matched-filter</b> demodulator filters with $h_{\\mathrm{opt}}(t)=\\psi(T_b-t)$ and samples at $t=T_b$. The <b>correlator</b> multiplies by $\\psi(t)$ and integrates over the interval:'},
    {t:'eq', tex:'y=\\int_0^{T_b}x(\\tau)\\,\\psi(\\tau)\\,d\\tau'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Writing $x=s_m\\psi+w$ and using $\\int\\psi^{2}=1$:'},
      {t:'eq', key:true, tex:'y=s_m\\underbrace{\\int_0^{T_b}\\psi^{2}(\\tau)d\\tau}_{=1}+\\underbrace{\\int_0^{T_b}w(\\tau)\\psi(\\tau)d\\tau}_{n}=s_m+n'},
      {t:'note', kind:'ok', head:'They are the same at the sampling instant', html:'Convolving with a time-reversed function and evaluating at $T_b$ <em>is</em> correlating over the interval. The two demodulators differ in how they are built and not in what they produce, and both reduce the received waveform to one number.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'They agree at one instant only', html:'For $t\\ne T_b$ the two outputs are different signals. The equivalence holds at the sampling instant, and it is another reason that instant matters. Sample early and the two demodulators do not even agree with each other.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>P.blocks({w:640,h:260,items:[
      {t:'arrow',x1:20,y1:60,x2:110,y2:60},
      {t:'box',x:110,y:28,w:170,h:64,label:'\\psi(T_b-t)',tex:true},
      {t:'arrow',x1:280,y1:60,x2:370,y2:60},
      {t:'text',x:65,y:44,label:'x(t)',tex:true,fs:15},
      {t:'text',x:452,y:34,label:'y(T_b)',tex:true,fs:15},
      {t:'line',d:'M370,60 h30'}, {t:'line',d:'M400,60 l20,-13'},
      {t:'text',x:195,y:118,label:'matched filter',fs:12.5},
      {t:'arrow',x1:20,y1:190,x2:100,y2:190},
      {t:'sum',x:130,y:190},
      {t:'arrow',x1:130,y1:236,x2:130,y2:208},
      {t:'arrow',x1:148,y1:190,x2:230,y2:190},
      {t:'box',x:230,y:158,w:140,h:64,label:'\\int_0^{t}(\\cdot)',tex:true},
      {t:'arrow',x1:370,y1:190,x2:400,y2:190},
      {t:'text',x:60,y:174,label:'x(t)',tex:true,fs:15},
      {t:'text',x:172,y:246,label:'\\psi(t)',tex:true,fs:14},
      {t:'text',x:482,y:164,label:'y(T_b)',tex:true,fs:15},
      {t:'line',d:'M400,190 h30'}, {t:'line',d:'M430,190 l20,-13'},
      {t:'text',x:250,y:248,label:'correlator',fs:12.5}
    ]}), caption:'Two implementations of the same demodulator. The upper system uses a filter. The lower system uses a multiplier and an integrator. Both produce the same sample at $t=T_b$.'}
  ]}
]},

/* ---------------------------------------------------------------- 2.3 ---- */
{ id:'m2-stat', module:'M2', nav:'The decision statistic', title:'The decision statistic',
  objective:'Establish the distribution of the decision statistic.',
  keywords:'decision statistic gaussian variance conditional density noise projection',
  src:'CH8 s.21–22', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision'},
  {t:'title', text:'The decision statistic'},
  {t:'lede', text:'Everything the detector is given is one Gaussian number.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'The noise term is a projection of a Gaussian process onto a fixed function, so it is a Gaussian random variable. Its variance follows from the autocorrelation of white noise:'},
    {t:'eq', tex:'\\sigma_n^{2}=E\\!\\left[\\left(\\int_0^{T_b}\\!w(\\tau)\\psi(\\tau)d\\tau\\right)^{2}\\right]=\\frac{N_0}{2}\\int_0^{T_b}\\!\\psi^{2}(\\tau)d\\tau=\\frac{N_0}{2}'},
    {t:'reveal', at:1, items:[
      {t:'small', html:'The middle step uses $E[w(\\tau)w(u)]=\\tfrac{N_0}{2}\\delta(\\tau-u)$ and the sifting property, and the last uses that $\\psi$ has unit energy. The two-sided density $N_0/2$ arrives here unchanged, which is why the convention has to be fixed once and never mixed.'},
      {t:'eq', key:true, tex:'y=s_m+n\\;\\sim\\;\\mathcal{N}\\!\\left(s_m,\\;\\frac{N_0}{2}\\right)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'So the two conditional densities are the same Gaussian, shifted:'},
      {t:'eq', tex:'f_Y(y\\mid s_m)=\\frac{1}{\\sqrt{\\pi N_0}}\\exp\\!\\left(-\\frac{(y-s_m)^{2}}{N_0}\\right)'},
      {t:'note', kind:'ok', head:'The problem has become one-dimensional', html:'A waveform in noise has been reduced to one number drawn from one of two known Gaussians. Deciding which is a question with a clean answer, and the next scene gives it.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figDensities(0), caption:'The two conditional densities, weighted by equal priors, with the threshold at the origin. The shaded regions are the decision regions, each in the colour of the symbol it decides for. The error probability is the area of each density that lies in the other\'s region.'}
  ]}
]},

{ id:'m2-threshold', module:'M2', nav:'The optimal threshold', title:'The optimal threshold',
  objective:'Derive the optimal threshold for unequal priors.',
  keywords:'threshold optimum priors leibniz likelihood unequal probabilities log ratio',
  src:'CH8 s.24–26', steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision'},
  {t:'title', text:'The optimal threshold'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'The detector decides "1" when $y>\\lambda$. By total probability,'},
    {t:'eq', tex:'P_e=P(s_0)\\!\\int_{\\lambda}^{\\infty}\\!f_Y(y\\mid s_0)dy+P(s_1)\\!\\int_{-\\infty}^{\\lambda}\\!f_Y(y\\mid s_1)dy'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Differentiating with respect to $\\lambda$ — the Leibniz rule gives $-f_Y(\\lambda\\mid s_0)$ from the first term and $+f_Y(\\lambda\\mid s_1)$ from the second — and setting the derivative to zero:'},
      {t:'eq', tex:'P(s_1)\\,f_Y(\\lambda\\mid s_1)=P(s_0)\\,f_Y(\\lambda\\mid s_0)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'Dividing the two densities, the normalising constants cancel and the exponents subtract:'},
      {t:'eq', tex:'\\frac{P(s_0)}{P(s_1)}=\\exp\\!\\left(\\frac{4\\lambda A\\sqrt{T_b}}{N_0}\\right)'},
      {t:'eq', key:true, tex:'\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4A\\sqrt{T_b}}\\ln\\frac{P(s_0)}{P(s_1)}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_0)}{P(s_1)}'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Read the sign', html:'If $P(s_0)>P(s_1)$ the threshold moves <b>towards</b> the more likely symbol\'s rival — that is, $\\lambda>0$, enlarging the region that decides $s_0$. Equal priors give $\\lambda=0$ and the threshold sits midway. As $N_0\\to0$ the threshold returns to the midpoint whatever the priors: when the noise is small enough the priors stop mattering.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figDensities(0.35), caption:'Unequal priors with $P(s_0)=0.7$. Each density is weighted by its prior probability. The curve for the more likely symbol is taller. The crossing and decision threshold move toward the less likely symbol.'}
  ]}
]},

{ id:'m2-pe', module:'M2', nav:'The error probability', title:'The bit error probability',
  objective:'Derive the bit error probability of antipodal signalling.',
  keywords:'probability of error antipodal q function energy per bit noise density',
  src:'CH8 s.29–31', steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision'},
  {t:'title', text:'The bit error probability'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Take equal priors, so $\\lambda=0$. For a Gaussian $Y\\sim\\mathcal{N}(\\mu,\\sigma^{2})$, $P(Y>y)=Q\\!\\left(\\frac{y-\\mu}{\\sigma}\\right)$. With $\\mu=-\\sqrt{E_b}$ and $\\sigma=\\sqrt{N_0/2}$:'},
    {t:'eq', tex:'P(y>0\\mid s_0)=Q\\!\\left(\\frac{0-(-\\sqrt{E_b})}{\\sqrt{N_0/2}}\\right)=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'The other case gives the same number, using $Q(-x)=1-Q(x)$:'},
      {t:'eq', tex:'P(y<0\\mid s_1)=1-Q\\!\\left(-\\sqrt{\\frac{2E_b}{N_0}}\\right)=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, tex:'P_b=\\tfrac12 Q\\!\\left(\\sqrt{\\tfrac{2E_b}{N_0}}\\right)+\\tfrac12 Q\\!\\left(\\sqrt{\\tfrac{2E_b}{N_0}}\\right)=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)'},
      {t:'note', kind:'ok', head:'Required parameter', html:'The error probability depends only on $E_b/N_0$. It does not depend separately on $A$, $T_b$, or pulse shape. An unchanged energy per bit gives an unchanged error probability.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Antipodal and orthogonal signals', html:'Antipodal signaling gives $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$. Orthogonal signaling gives $Q\\!\\left(\\sqrt{E_b/N_0}\\right)$ and requires $3$ dB more energy. Both results use the two-sided noise density $N_0/2$.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:figPe, caption:'The bit error probability against $E_b/N_0$ in decibels, on a logarithmic scale. The curve falls faster than any straight line: past about $8$ dB, every extra decibel costs the channel roughly an order of magnitude in errors.'}
  ]}
]},

{ id:'m2-ex-pe', module:'M2', nav:'Worked example: unequal priors', title:'Worked example: unequal priors',
  objective:'Compute a threshold and an error probability with unequal priors.',
  keywords:'worked example unequal priors threshold error probability binary pam',
  src:'CH8 s.32–34', steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision'},
  {t:'title', text:'Worked example: unequal priors'},
  {t:'wex', rows:[
    ['Given','A binary PAM system whose correlator output is $y=\\pm\\sqrt{E_b}+n$, with $P(s_1)=0.3$, $E_b=1$ and $N_0=0.1$.'],
    ['Find','The optimal threshold, and the average error probability at that threshold.']
  ]},
  {t:'reveal', at:1, items:[
    {t:'wex', rows:[
      ['Method','Calculate the threshold from the log-ratio of the priors. Calculate each conditional error from its Gaussian tail. Then weight the two errors by their priors.'],
      ['Solution','$\\lambda_{\\mathrm{opt}}=\\dfrac{N_0}{4\\sqrt{E_b}}\\ln\\dfrac{P(s_0)}{P(s_1)}=\\dfrac{0.1}{4}\\ln\\dfrac{0.7}{0.3}=0.025(0.8473)=0.0212.$']
    ]}
  ]},
  {t:'reveal', at:2, items:[
    {t:'wex', rows:[
      ['','$\\sigma=\\sqrt{N_0/2}=0.2236$. Then $P(\\text{err}\\mid s_0)=Q\\!\\left(\\dfrac{0.0212+1}{0.2236}\\right)=Q(4.567)=2.475\\times10^{-6}$ and $P(\\text{err}\\mid s_1)=Q\\!\\left(\\dfrac{1-0.0212}{0.2236}\\right)=Q(4.377)=6.005\\times10^{-6}$.'],
      ['','$P_e=0.7(2.475\\times10^{-6})+0.3(6.005\\times10^{-6})=3.534\\times10^{-6}$.']
    ]}
  ]},
  {t:'reveal', at:3, items:[
    {t:'wex', rows:[
      ['Check','A zero threshold gives $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)=3.872\\times10^{-6}$. The optimal threshold gives $3.534\\times10^{-6}$. This change decreases the error probability by about nine percent.']
    ]},
    {t:'note', kind:'warn', head:'Threshold direction', html:'Here, $s_0$ is more likely, so the threshold moves away from $s_0$ and toward $s_1$. This movement enlarges the decision region for $s_0$. A sign error in the logarithm moves the threshold in the wrong direction.'}
  ]}
]},

{ id:'m2-lab-d', module:'M2', nav:'Laboratory D', title:'Laboratory D · Threshold and error probability',
  objective:'Let the reader move the threshold, the priors and the noise.',
  keywords:'laboratory threshold priors noise variance error probability decision regions',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · The decision'},
  {t:'title', text:'Laboratory D · Threshold and error probability'},
  {t:'body', html:'Move the threshold by hand and watch the two conditional error probabilities trade against each other. Change the priors and the noise level and the best place for it moves. The laboratory marks the optimum, so a threshold placed by eye can be compared against the one the derivation gives.'},
  {t:'lab', id:'D'}
]},

/* ---------------------------------------------------------------- 2.4 ---- */
{ id:'m2-isi', module:'M2', nav:'Intersymbol interference', title:'Intersymbol interference',
  objective:'Show where intersymbol interference comes from.',
  keywords:'intersymbol interference bandlimited channel dispersion residual effect sampling instant',
  src:'CH8 s.35–37', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'Intersymbol interference'},
  {t:'lede', text:'When the pulses overlap: the error that noise did not cause.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Everything so far assumed an ideal channel. A real channel is bandlimited, and a bandlimited channel spreads a pulse in time. Write the received signal as a train of the overall pulse shape $p$:'},
    {t:'eq', tex:'y(t)=\\mu\\sum_k a_k\\,p(t-kT_b)+n(t),\\qquad \\mu\\,p(t)=g(t)*h(t)*c(t)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Sampling at $t_i=iT_b$ and separating the term that was meant to be there:'},
      {t:'eq', key:true, tex:'y(t_i)=\\underbrace{\\mu a_i}_{\\text{wanted}}+\\underbrace{\\mu\\sum_{k\\ne i}a_k\\,p\\bigl((i-k)T_b\\bigr)}_{\\text{intersymbol interference}}+\\;n(t_i)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'err', head:'Interference limit', html:'The middle term is deterministic interference from the data. More transmitter power increases the wanted signal and this interference by the same factor. Thus, more energy does not remove intersymbol interference.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figIsi(1.0), caption:'Eight bits pass through a channel with a fast-decaying pulse. Each faint curve is one pulse. The heavy curve is their sum. Neighboring pulses are zero at the sample times, so the samples equal $\\pm1$.'},
    {t:'fig', frame:true, svg:()=>figIsi(0.0), caption:'The same bits pass through a channel with a slow-decaying pulse. Neighboring pulse tails are not zero at the sample times. Therefore, each sample moves away from $\\pm1$ by a data-dependent amount.'}
  ]}
]},

{ id:'m2-eye', module:'M2', nav:'The eye diagram', title:'The eye diagram',
  objective:'Read the four measurements an eye diagram carries.',
  keywords:'eye diagram eye pattern jitter margin noise timing sensitivity superposition',
  src:'CH8 s.38–41', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'The eye diagram'},
  {t:'lede', text:'Every bit pattern at once.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'note', kind:'def', head:'Eye pattern', html:'Cut the received waveform into bit-length pieces and draw them all on top of each other, synchronised to the clock. The result is a synchronised superposition of every realisation of the signal within one signalling interval.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>The diagram shows four measurements directly:</p><ul><li>The <b>height of the opening</b> at the sampling instant is the margin over noise.</li><li>The <b>width of the opening</b> is how far the sampling instant can move before a decision goes wrong.</li><li>The <b>slope</b> at the crossings shows sensitivity to a timing error.</li><li>The <b>spread of the crossings</b> is the timing jitter.</li></ul>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Closed eye', html:'A closed eye has no sampling time that gives correct decisions for every bit pattern. Changing the threshold cannot remove this interference. The eye diagram shows this limit directly.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figEye(1.0, 0.06), caption:'A wide-open eye: a pulse that decays quickly, and light noise. Every trace passes close to $\\pm1$ at the centre of the interval.'},
    {t:'fig', frame:true, svg:()=>figEye(0.0, 0.06), caption:'The same noise acts on a slow-decaying pulse. Data-dependent interference spreads the traces, narrows the opening, and scatters the crossings.'}
  ]}
]},

{ id:'m2-lab-e', module:'M2', nav:'Laboratory E', title:'Laboratory E · The eye diagram',
  objective:'Let the reader close the eye with roll-off, timing and noise.',
  keywords:'laboratory eye diagram roll off timing offset noise intersymbol interference',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Intersymbol interference'},
  {t:'title', text:'Laboratory E · The eye diagram and intersymbol interference'},
  {t:'body', html:'Change the roll-off of the pulse, the sampling instant and the noise level, and watch the eye open and close. The readout reports the opening, the worst-case interference and the margin, so what the picture shows can be checked against a number.'},
  {t:'lab', id:'E'}
]},

/* ---------------------------------------------------------------- 2.5 ---- */
{ id:'m2-nyquist', module:'M2', nav:'Nyquist\'s criterion', title:'The condition for zero interference',
  objective:'State Nyquist\'s criterion in both domains and give the ideal channel.',
  keywords:'nyquist criterion distortionless transmission zero isi bandwidth ideal channel',
  src:'CH8 s.42–45', steps:3, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'Nyquist\'s criterion'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'The interference term vanishes exactly when the overall pulse is zero at every sampling instant but its own:'},
    {t:'eq', key:true, label:'time domain', tex:'p\\bigl((i-k)T_b\\bigr)=\\begin{cases}1, & i=k\\\\ 0, & i\\ne k\\end{cases}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Sampling $p$ at the instants and transforming turns that into a statement about the spectrum. The sampled pulse has transform $\\frac{1}{T_b}\\sum_n P(f-nR_b)$, and the condition makes the sampled pulse a single impulse of weight one:'},
      {t:'eq', key:true, label:'frequency domain', tex:'R_b\\sum_{n}P(f-nR_b)=1,\\qquad R_b=\\frac{1}{T_b}'},
      {t:'small', html:'In words: the replicas of the pulse spectrum, spaced by the symbol rate, must add to a constant.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'The simplest spectrum satisfying it is a rectangle of width $2W$ with $W=R_b/2$, the <b>Nyquist bandwidth</b>. Its pulse is'},
      {t:'eq', tex:'p(t)=\\operatorname{sinc}(2Wt),\\qquad W=\\frac{R_b}{2}=\\frac{1}{2T_b}'},
      {t:'note', kind:'ok', head:'The rate a bandwidth supports', html:'A channel of bandwidth $W$ carries at most $2W$ symbols per second with no interference. That number is the counterpart of the sampling theorem, arrived at from the other end.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Ideal-channel limit', html:'A rectangular spectrum has abrupt edges and cannot be built exactly. Its pulse also decays as $1/t$. A small timing error then includes long tails from many neighboring pulses.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a=P.Axes({w:600,h:210,xr:[-3.4,3.4],yr:[-0.15,1.5],
        xlabel:'f/W',ylabel:'P(f)/T_b',pad:{l:56,r:26,t:26,b:42},xtarget:6,ytarget:3});
      for(let n=-1;n<=1;n++)
        a.poly([[-3.4,0],[2*n-1,0],[2*n-1,1],[2*n+1,1],[2*n+1,0],[3.4,0]],
               {color:n?C.mid:C.in,width:n?1.6:2.2});
      return a.svg();
    }, caption:'The ideal Nyquist channel and its replicas at multiples of $R_b=2W$. They tile the axis exactly, so their sum is a constant and the criterion holds.'},
    {t:'fig', frame:true, svg:()=>{
      const a=P.Axes({w:600,h:210,xr:[-3.4,3.4],yr:[-0.35,1.25],
        xlabel:'t/T_b',ylabel:'p(t)',pad:{l:52,r:26,t:26,b:42},xtarget:6,ytarget:3});
      a.curve(t=>sinc(t),{color:C.in,width:2.2});
      for(let k=-3;k<=3;k++) a.point(k, k===0?1:0, {color:C.out,r:3.6});
      return a.svg();
    }, caption:'Its pulse. Every sampling instant except its own falls on a zero, which is Nyquist\'s criterion seen in the time domain.'}
  ]}
]},

{ id:'m2-rcos', module:'M2', nav:'The raised cosine', title:'The raised cosine',
  objective:'Give the raised-cosine spectrum and what the roll-off controls.',
  keywords:'raised cosine roll off factor excess bandwidth transmission bandwidth decay',
  src:'CH8 s.46–48', steps:2, blocks:[
  {t:'eyebrow', text:'Module 2 · Nyquist and the raised cosine'},
  {t:'title', text:'The raised cosine'},
  {t:'lede', text:'Buying decay with bandwidth.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Widen the spectrum from $W$ towards $2W$ and taper the edges, keeping the tiling property:'},
    {t:'eq', tex:'P(f)=\\begin{cases}\\dfrac{1}{2W}, & 0\\le|f|\\le f_1\\\\[6pt] \\dfrac{1}{4W}\\left[1-\\sin\\dfrac{\\pi(|f|-W)}{2W-2f_1}\\right], & f_1\\le|f|<2W-f_1\\\\[6pt] 0,&\\text{otherwise}\\end{cases}'},
    {t:'eq', label:'roll-off factor', tex:'\\alpha=1-\\frac{f_1}{W}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Its pulse is the Nyquist pulse multiplied by a factor that makes it decay far faster:'},
      {t:'eq', key:true, tex:'p(t)=\\operatorname{sinc}(2Wt)\\,\\frac{\\cos(2\\pi\\alpha Wt)}{1-16\\alpha^{2}W^{2}t^{2}}'},
      {t:'small', html:'The first factor keeps the zero crossings at $t=iT_b$, so the criterion still holds. The second decays as $1/t^{2}$, so a timing error no longer accumulates a long tail of neighbours.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>The price is bandwidth. The transmission bandwidth is $B_T=(1+\\alpha)W$ and the excess over Nyquist is $\\alpha W$.</p>'},
      {t:'note', kind:'ok', head:'Roll-off trade-off', html:'A larger roll-off gives faster pulse decay and less sensitivity to timing error. It also uses more bandwidth. At $\\alpha=0$, the raised cosine is the ideal Nyquist channel. At $\\alpha=1$, it uses twice the Nyquist bandwidth. Typical systems use $0.2\\le\\alpha\\le0.5$.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a=P.Axes({w:600,h:220,xr:[-2.2,2.2],yr:[-0.12,1.2],
        xlabel:'f/W',ylabel:'2W\\,P(f)',pad:{l:56,r:26,t:26,b:42},xtarget:6,ytarget:3});
      const rc=(f,al)=>{ const u=Math.abs(f);
        if(al===0) return u<=1?1:0;
        const f1=1-al;
        if(u<=f1) return 1;
        if(u<2-f1) return 0.5*(1-Math.sin(Math.PI*(u-1)/(2-2*f1)));
        return 0; };
      [[0,C.in],[0.5,C.h],[1,C.out]].forEach(([al,col])=>a.curve(f=>rc(f,al),{color:col,width:2.1}));
      return a.svg();
    }, caption:'Raised-cosine spectra for three roll-off factors. All three tile the frequency axis with spacing $2W$. Therefore, all three satisfy the Nyquist criterion. Their bandwidths are different.'},
    {t:'legend', items:[['in','$\\alpha = 0$'],['h','$\\alpha = 0.5$'],['out','$\\alpha = 1$']]},
    {t:'fig', frame:true, svg:()=>{
      const a=P.Axes({w:600,h:210,xr:[-3.4,3.4],yr:[-0.35,1.25],
        xlabel:'t/T_b',ylabel:'p(t)',pad:{l:52,r:26,t:26,b:42},xtarget:6,ytarget:3});
      const pl=(al,col)=>a.curve(t=>{ const den=1-4*al*al*t*t;
        if(Math.abs(den)<1e-6) return sinc(t)*Math.PI/4;
        return sinc(t)*Math.cos(Math.PI*al*t)/den; },{color:col,width:2.1});
      pl(0,C.in); pl(0.5,C.h); pl(1,C.out);
      return a.svg();
    }, caption:'The corresponding pulses. Each pulse is zero at every nonzero integer multiple of $T_b$. Their tails decay at different rates.'}
  ]}
]},

/* ---------------------------------------------------------------- 2.6 ---- */
{ id:'m2-synth', module:'M2', nav:'Summary', title:'Module 2 summary',
  objective:'Collect the results this module contributes to the rest of the course.',
  keywords:'summary matched filter threshold error probability nyquist raised cosine',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Summary'},
  {t:'title', text:'Module 2 summary'},
  {t:'grid', cols:2, gap:'26px', items:[
    [{t:'card', head:'The filter', items:[
      {t:'fig', svg:miniMatched},
      {t:'eq', plain:true, tex:'h_{\\mathrm{opt}}(t)=g(T-t),\\quad(\\mathrm{SNR})_o=\\frac{2E}{N_0}'},
      {t:'small', html:'The matched filter maximizes the output signal-to-noise ratio. The result depends on pulse energy, not pulse shape.'}
    ]}],
    [{t:'card', head:'The decision', items:[
      {t:'fig', svg:miniThreshold},
      {t:'eq', plain:true, tex:'y=s_m+n,\\quad \\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_0)}{P(s_1)}'},
      {t:'small', html:'The detector uses one Gaussian variable. The optimal threshold is the log-ratio of the priors, scaled by the noise density.'}
    ]}],
    [{t:'card', head:'The error probability', items:[
      {t:'fig', svg:miniPe},
      {t:'eq', plain:true, tex:'P_b=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)'},
      {t:'small', html:'Antipodal signalling depends on one number, and Module 4 shows that number is really a distance.'}
    ]}],
    [{t:'card', head:'The bandwidth', items:[
      {t:'fig', svg:miniRcos},
      {t:'eq', plain:true, tex:'R_b\\sum_n P(f-nR_b)=1,\\quad B_T=(1+\\alpha)W'},
      {t:'small', html:'Zero interference requires spectral replicas that tile the frequency axis. A raised-cosine pulse adds the excess bandwidth $\\alpha W$.'}
    ]}]
  ]},
  {t:'note', kind:'ok', head:'Main result', html:'The matched filter gives the best receiver performance in noise. A Nyquist pulse removes intersymbol interference. These two methods solve different receiver problems.'}
]}

];

window.SCENES_M2 = SC;
})();
