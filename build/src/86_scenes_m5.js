/* ==========================================================================
   Module 5 — Digital modulation methods.

   The module in one sentence: a carrier has an amplitude, a frequency and a
   phase, each of them can be switched by the data, and Module 4 already tells
   us how well each choice works — measure the minimum distance.

   Written plain first, and every scheme is presented the same way: the
   waveform, the constellation, the minimum distance, the error probability.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

function Qf(x){
  const t = 1/(1+0.2316419*Math.abs(x));
  const d = 0.3989422804014327*Math.exp(-x*x/2);
  const p = d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0 ? p : 1-p;
}

/* A constellation with its decision regions, drawn by the rule of Module 4. */
const REGCOL = [C.dec.in, C.dec.out, C.dec.mid, C.dec.h, C.dec.err];
function figConst(pts, opts){
  opts = opts || {};
  const lim = opts.lim || 1.9, n = opts.n || 76;
  const a = P.Axes({w:opts.w||400,h:opts.h||300,xr:[-lim,lim],yr:[-lim,lim],
    xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:50,r:22,t:24,b:40},
    xtarget:opts.tick||3, ytarget:opts.tick||3});
  if(opts.regions !== false){
    const step = 2*lim/n;
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){
      const x=-lim+(i+0.5)*step, y=-lim+(j+0.5)*step;
      let best=0, bd=Infinity;
      pts.forEach((p,k)=>{ const d=(x-p[0])**2+(y-p[1])**2; if(d<bd){bd=d;best=k;} });
      a.rect(x-step/2,y-step/2,x+step/2,y+step/2,{fill:REGCOL[best%REGCOL.length]});
    }
  }
  pts.forEach(p=>a.point(p[0],p[1],{color:C.ink,r:opts.r||5.5}));
  return a.svg();
}

/* The carrier waveform of a binary scheme, drawn from its definition. */
function figCarrier(kind){
  const bits = [1,0,1,0], Tb = 1, fc = 4;
  const a = P.Axes({w:600,h:150,xr:[0,4],yr:[-1.6,1.6],
    xlabel:'t/T_b',ylabel:'s(t)',pad:{l:48,r:22,t:20,b:36},xtarget:4,ytarget:3});
  const f = t => {
    const k = Math.min(3, Math.floor(t)), b = bits[k];
    if(kind==='bpsk') return (b?1:-1)*Math.cos(2*Math.PI*fc*t);
    if(kind==='bask') return b ? Math.cos(2*Math.PI*fc*t) : 0;
    return Math.cos(2*Math.PI*(b?fc+1:fc-1)*t);
  };
  const pts=[]; for(let i=0;i<=1600;i++){ const t=4*i/1600; pts.push([t,f(t)]); }
  a.poly(pts,{color:C.in,width:1.7});
  for(let k=1;k<4;k++) a.vline(k,{color:C.rule,dash:'2 4'});
  bits.forEach((b,k)=>a.note(k+0.5, 1.36, String(b), {fs:14,color:C.muted,anchor:'middle'}));
  return a.svg();
}

const PSK = M => Array.from({length:M},(_,k)=>[Math.cos(2*Math.PI*k/M), -Math.sin(2*Math.PI*k/M)]);
const QAM16 = [].concat(...[-3,-1,1,3].map(x=>[-3,-1,1,3].map(y=>[x/3.35,y/3.35])));
const PAM = M => Array.from({length:M},(_,k)=>[(2*k-(M-1))/(M-1)*1.4, 0]);

const SC = [

/* ---------------------------------------------------------------- 5.0 ---- */
{ id:'m5-open', module:'M5', nav:'Three things to switch', title:'Amplitude, frequency, phase',
  objective:'Frame the module as one question asked of three carrier parameters.',
  keywords:'digital modulation amplitude frequency phase keying ask fsk psk opening',
  src:'CH9 s.65', steps:2, blocks:[
  {t:'eyebrow', text:'Module 5 · Opening'},
  {t:'title', text:'Amplitude, frequency, phase'},
  {t:'lede', text:'A sinusoidal carrier has an amplitude, a frequency and a phase. Switching any one of them according to the data is a digital modulation scheme. There are three families because there are three things to switch.'},
  /* The three waveforms go side by side rather than stacked. Three figures in
     one column is taller than the stage; three across uses the width the scene
     has spare and leaves the type at the size it was designed at. */
  {t:'grid', cols:3, gap:'22px', items:[
    [{t:'fig', frame:true, svg:()=>figCarrier('bask'),
      caption:'<b>Amplitude-shift keying.</b> The carrier is switched on and off.'}],
    [{t:'fig', frame:true, svg:()=>figCarrier('bpsk'),
      caption:'<b>Phase-shift keying.</b> The amplitude is constant and the phase flips by $180^{\\circ}$.'}],
    [{t:'fig', frame:true, svg:()=>figCarrier('bfsk'),
      caption:'<b>Frequency-shift keying.</b> Two frequencies, one per bit.'}]
  ]},
  {t:'body', html:'<p>Each has a binary form and an $M$-ary form, and a fourth family — <b>quadrature amplitude modulation</b> — switches amplitude and phase together. Every scheme below is presented in the same order: the waveform, the constellation, the minimum distance, the error probability.</p>'},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Module 4 provides the method', html:'Each scheme defines a constellation. At high signal-to-noise ratios, Module 4 approximates its symbol error probability by $N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$. We will draw each constellation, find $d_{\\min}$, and count its nearest neighbours.'}
  ]},
  {t:'reveal', at:2, items:[
    {t:'note', kind:'warn', head:'Bandwidth is not shown by the constellation', html:'At a fixed bit rate, increasing $M$ reduces the symbol rate of phase and amplitude schemes. Their required bandwidth therefore decreases. Orthogonal frequency-shift keying needs more frequencies as $M$ grows, so its required bandwidth increases. A constellation alone does not show this trade-off.'}
  ]}
]},

/* ---------------------------------------------------------------- 5.1 ---- */
{ id:'m5-bpsk', module:'M5', nav:'BPSK', title:'Binary phase-shift keying',
  objective:'Give the BPSK waveform, constellation and error probability.',
  keywords:'bpsk binary phase shift keying antipodal constellation error probability',
  src:'CH9 s.66–67', steps:2, blocks:[
  {t:'eyebrow', text:'Module 5 · Binary schemes'},
  {t:'title', text:'Binary phase-shift keying'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'The two waveforms differ by a phase shift of $\\pi$, which is the same as a change of sign:'},
    {t:'eq', tex:'s_1(t)=\\sqrt{\\frac{2E_b}{T_b}}\\cos(2\\pi f_ct),\\qquad s_0(t)=-\\sqrt{\\frac{2E_b}{T_b}}\\cos(2\\pi f_ct)'},
    {t:'small', html:'over $0\\le t\\le T_b$, with $f_cT_b$ an integer so that a whole number of carrier cycles fits in each bit.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'One basis function carries both, so the constellation is one-dimensional:'},
      {t:'eq', tex:'\\psi(t)=\\sqrt{\\frac{2}{T_b}}\\cos(2\\pi f_ct),\\qquad s_{0,1}=\\mp\\sqrt{E_b}'},
      {t:'eq', key:true, tex:'d_{\\min}=2\\sqrt{E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'This is the antipodal case again', html:'Exactly the constellation of Module 2 and Module 4, now carried on a carrier. The modulation has moved the signal to a frequency band. It has not changed the geometry, and so it has not changed the error probability by a decibel.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figCarrier('bpsk'),
      caption:'The waveform for the bits $1\\,0\\,1\\,0$. Every bit boundary where the data changes carries a phase reversal, visible as a discontinuity in the envelope of the oscillation.'},
    {t:'fig', frame:true, svg:()=>figConst([[-1.2,0],[1.2,0]],{lim:1.9,w:400,h:190}),
      caption:'The constellation has two points on one axis, separated by $2\\sqrt{E_b}$. The boundary is the $\\psi_2$ axis. The receiver decides from the sign of the correlator output.'}
  ]}
]},

{ id:'m5-bfsk', module:'M5', nav:'BFSK', title:'Binary frequency-shift keying',
  objective:'Give BFSK, its orthogonality condition and its 3 dB penalty.',
  keywords:'bfsk frequency shift keying orthogonal two dimensions three decibels',
  src:'CH9 s.68–69', steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Binary schemes'},
  {t:'title', text:'Binary frequency-shift keying'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Two frequencies, one per bit, at the same amplitude:'},
    {t:'eq', tex:'s_i(t)=\\sqrt{\\frac{2E_b}{T_b}}\\cos(2\\pi f_it),\\qquad i=0,1'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'How far apart the frequencies must be', html:'The two waveforms are made <b>orthogonal</b> by choosing $$f_1=f_0+\\frac{1}{2T_b}.$$ Any closer and their inner product is non-zero, which pulls the two constellation points together. Any further apart is wasted bandwidth for no gain in distance.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'Two orthogonal waveforms need two axes, so the constellation is two-dimensional with one point on each:'},
      {t:'eq', tex:'\\mathbf{s}_0=(\\sqrt{E_b},\\,0),\\qquad \\mathbf{s}_1=(0,\\,\\sqrt{E_b})'},
      {t:'eq', key:true, tex:'d_{\\min}=\\sqrt{2E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'The three decibels, and where they went', html:'BFSK needs <b>twice the energy per bit</b> of BPSK for the same error probability. The reason is in the picture. Two perpendicular points of length $\\sqrt{E_b}$ are $\\sqrt{2E_b}$ apart; two opposite points of the same length are $2\\sqrt{E_b}$ apart. Perpendicular is closer than opposite, by a factor of $\\sqrt2$ in distance and a factor of two in energy.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figCarrier('bfsk'),
      caption:'The waveform for $1\\,0\\,1\\,0$. The amplitude never changes; only the rate of oscillation does.'},
    {t:'fig', frame:true, svg:()=>figConst([[1.2,0],[0,1.2]],{lim:1.9,w:360,h:200}),
      caption:'The constellation: two points at right angles, and a boundary along the diagonal. Compare the separation with the previous scene — the same energy, the two points closer together.'}
  ]}
]},

{ id:'m5-bask', module:'M5', nav:'BASK', title:'Binary amplitude-shift keying',
  objective:'Give BASK and show that averaging the energy recovers the same penalty.',
  keywords:'bask on off keying amplitude shift average energy per bit',
  src:'CH9 s.70–72', steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Binary schemes'},
  {t:'title', text:'Binary amplitude-shift keying'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'The simplest of the three: the carrier is present for a one and absent for a zero.'},
    {t:'eq', tex:'s_1(t)=\\sqrt{\\frac{2E}{T_b}}\\cos(2\\pi f_ct),\\qquad s_0(t)=0'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'One basis function again, so the constellation is one-dimensional — but the two points are not symmetric about the origin:'},
      {t:'eq', tex:'\\mathbf{s}_0=0,\\qquad \\mathbf{s}_1=\\sqrt{E}'},
      {t:'note', kind:'warn', head:'The energy that has to be averaged', html:'Half the bits carry energy $E$ and half carry none, so the <b>average</b> energy per bit is $E_b=E/2$, and $\\mathbf{s}_1=\\sqrt{2E_b}$. Reporting $E$ as the energy per bit is the standard mistake here, and it makes on-off keying look as good as BPSK.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, tex:'d_{\\min}=\\sqrt{2E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)'},
      {t:'body', html:'The same answer as BFSK, and for the same reason: the same distance at the same average energy.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Two schemes, one geometry', html:'BASK puts its points at $0$ and $\\sqrt{2E_b}$ on a line; BFSK puts them at $(\\sqrt{E_b},0)$ and $(0,\\sqrt{E_b})$ in a plane. Different pictures, the same separation at the same average energy, and therefore the same error probability. Module 3 said two signal sets with the same geometry perform identically. Here are two with <em>different</em> geometry and the same distance, which is all the performance depends on.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figCarrier('bask'),
      caption:'The waveform for $1\\,0\\,1\\,0$. During a zero nothing is transmitted at all, which is why the average energy is half the peak.'},
    {t:'fig', frame:true, svg:()=>figConst([[0,0],[1.4,0]],{lim:1.9,w:400,h:190}),
      caption:'The constellation. The boundary sits midway at $\\sqrt{E_b/2}$, and the two points are $\\sqrt{2E_b}$ apart — the same separation BFSK achieves with two dimensions.'}
  ]}
]},

/* ---------------------------------------------------------------- 5.2 ---- */
{ id:'m5-mpsk', module:'M5', nav:'M-ary PSK', title:'M-ary phase-shift keying',
  objective:'Derive the minimum distance of M-PSK from the cosine rule.',
  keywords:'m-ary psk constellation circle cosine rule minimum distance gray coding',
  src:'CH9 s.74–77', steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'M-ary phase-shift keying'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Keep the amplitude fixed and use $M$ phases instead of two:'},
    {t:'eq', tex:'s_i(t)=\\sqrt{\\frac{2E_s}{T_s}}\\cos\\!\\left(2\\pi f_ct+\\frac{2\\pi(i-1)}{M}\\right),\\quad i=1,\\ldots,M'},
    {t:'small', html:'Two basis functions — a cosine and a sine at the carrier frequency — carry all $M$ of them. The constellation is therefore $M$ points evenly spaced on a circle of radius $\\sqrt{E_s}$, whatever $M$ is.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Neighbouring points subtend $2\\pi/M$ at the centre. The cosine rule gives the chord between them:'},
      {t:'eq', tex:'d_{\\min}^{2}=E_s+E_s-2E_s\\cos\\frac{2\\pi}{M}=2E_s\\left(1-\\cos\\frac{2\\pi}{M}\\right)'},
      {t:'eq', key:true, tex:'d_{\\min}=2\\sqrt{E_s}\\,\\sin\\frac{\\pi}{M}'},
      {t:'small', html:'using $1-\\cos2a=2\\sin^{2}a$. Every point has exactly two neighbours at that distance, so $N_{\\min}=2$.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Check it against what is known', html:'At $M=2$ the formula gives $2\\sqrt{E_s}\\sin90^{\\circ}=2\\sqrt{E_b}$ — BPSK. At $M=4$ it gives $2\\sqrt{E_s}\\sin45^{\\circ}=\\sqrt{2E_s}$, the square constellation of Module 4. A general formula that reproduces the two cases already known is a formula worth trusting.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Gray coding belongs here', html:'Neighbouring points are the ones confused, so the bits are assigned so that neighbouring points differ in one bit. A symbol error then costs one bit error out of $\\log_2 M$, and the bit error probability is about $P_e/\\log_2 M$.'}
    ]}
  ], right:[
    {t:'grid', cols:2, gap:'14px', items:[
      [{t:'fig', frame:true, svg:()=>figConst(PSK(4),{lim:1.7,w:330,h:250}),
        caption:'$M=4$: the points are far apart and the regions are quadrants.'}],
      [{t:'fig', frame:true, svg:()=>figConst(PSK(8),{lim:1.7,w:330,h:250}),
        caption:'$M=8$: three bits a symbol, and the wedges have narrowed to $45^{\\circ}$. At $M=16$ the points crowd so close on the same circle that PSK is rarely used beyond eight.'}]
    ]},
  ]}
]},

{ id:'m5-mpsk-pe', module:'M5', nav:'What M-PSK costs', title:'The error probability of M-ary PSK',
  objective:'Give the M-PSK error probability and the cost of increasing M.',
  keywords:'m-psk error probability energy per bit cost of doubling M decibels',
  src:'CH9 s.78', steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Phase-shift keying'},
  {t:'title', text:'The error probability of M-ary PSK'},
  {t:'lede', text:'What each extra bit costs.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Put the distance into the nearest-neighbour approximation of Module 4:'},
    {t:'eq', key:true, tex:'P_e\\approx 2\\,Q\\!\\left(\\sqrt{\\frac{2E_s}{N_0}}\\,\\sin\\frac{\\pi}{M}\\right)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Comparing schemes fairly means comparing them per bit, and $E_s=(\\log_2 M)E_b$:'},
      {t:'eq', key:true, tex:'P_e\\approx 2\\,Q\\!\\left(\\sqrt{\\frac{2\\log_2 M\\,E_b}{N_0}}\\,\\sin\\frac{\\pi}{M}\\right)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The two ways to read this', html:'<b>At a fixed signal-to-noise ratio, raising $M$ raises the error probability.</b> The $\\log_2 M$ inside grows, but $\\sin(\\pi/M)$ falls faster, and the product falls. <b>At a fixed error probability, raising $M$ demands more signal-to-noise ratio.</b> Both readings say the same thing: extra bits per symbol are paid for in power.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'body', html:'<p>How much? Holding the $Q$ argument fixed while going from $M$ to $2M$ needs</p>'},
      {t:'eq', tex:'\\frac{E_b/N_0\\big|_{2M}}{E_b/N_0\\big|_{M}}=\\frac{\\log_2 M\\;\\sin^{2}(\\pi/M)}{\\log_2 2M\\;\\sin^{2}(\\pi/2M)}'},
      {t:'small', html:'From $M=4$ to $M=8$ that is $3.41$, or $5.33$ dB in terms of $E_s/N_0$; per bit it is $3.57$ dB. Beyond eight it gets worse each time, and QAM replaces PSK.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:520,h:340,xr:[0,20],yr:[-6,-0.02],
        xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_e',ytickfmt:P.decade,yticksOverride:P.decades(-6,-1),zeroAxes:false,
        pad:{l:58,r:26,t:26,b:44},xtarget:5,ytarget:6});
      const cl = v => Math.log10(Math.max(1e-12, v));
      [[2,C.in],[4,C.out],[8,C.h],[16,C.err]].forEach(([M,col])=>{
        a.curve(d=>cl(2*Qf(Math.sqrt(2*Math.log2(M)*Math.pow(10,d/10))*Math.sin(Math.PI/M))),
          {color:col,width:2.1});
      });
      return a.svg();
    }, caption:'Symbol error probability against energy per bit, for four sizes of PSK. The curves move steadily to the right as $M$ grows, and the gaps widen.'},
    {t:'legend', items:[['in','$M=2$'],['out','$M=4$'],['h','$M=8$'],['err','$M=16$']]},
    {t:'small', html:'$M=2$ and $M=4$ lie almost on top of each other. QPSK carries two bits a symbol for the same energy per bit as BPSK, which is why it is everywhere.'}
  ]}
]},

/* ---------------------------------------------------------------- 5.3 ---- */
{ id:'m5-mask', module:'M5', nav:'M-ary PAM', title:'M-ary amplitude-shift keying',
  objective:'Give the M-PAM constellation, distance and error probability.',
  keywords:'m-ary ask pam amplitude levels one dimension six decibels neighbours',
  src:'CH9 s.83–87', steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
  {t:'title', text:'M-ary amplitude-shift keying'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Switch the amplitude among $M$ levels instead of two. One basis function carries them all, so the constellation is $M$ points equally spaced on a <b>line</b>, at $\\pm A,\\pm3A,\\ldots$ and $d_{\\min}=2A$.</p>'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Averaging the squared amplitudes over the $M$ levels gives the average symbol energy, and inverting it gives the distance:'},
      {t:'eq', tex:'E_{s,\\text{avg}}=\\frac{A^{2}(M^{2}-1)}{3}\\quad\\Longrightarrow\\quad d_{\\min}=\\sqrt{\\frac{12\\,E_{s,\\text{avg}}}{M^{2}-1}}'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'small', html:'The two end points have one neighbour and the $M-2$ inner ones have two, so $N_{\\min}=2(M-1)/M$.'},
      {t:'eq', key:true, tex:'P_e\\approx\\frac{2(M-1)}{M}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Doubling M costs about six decibels', html:'The distance falls as $1/\\sqrt{M^{2}-1}$, so doubling $M$ divides $d_{\\min}^{2}$ by roughly four — six decibels — while buying one extra bit a symbol. That is a poor exchange, and it is why amplitude modulation alone is not used for large alphabets.'}
    ]}
  ], right:[
    /* Stacked, these three overran the column; side by side they fit. */
    {t:'grid', cols:1, gap:'10px', items:[
      [{t:'fig', frame:true, svg:()=>figConst(PAM(2),{lim:1.9,w:400,h:120}),
        caption:'$M=2$: one bit a symbol.'}],
      [{t:'fig', frame:true, svg:()=>figConst(PAM(8),{lim:1.9,w:400,h:120}),
        caption:'$M=8$: three bits. Between the two, $M=4$ already puts the points three times closer at the same average energy. All of them share one line, which is the whole problem.'}]
    ]}
  ]}
]},

{ id:'m5-qam', module:'M5', nav:'QAM', title:'Quadrature amplitude modulation',
  objective:'Present QAM as two independent PAM constellations and give its distance.',
  keywords:'qam quadrature amplitude modulation two dimensional grid neighbours 16-qam',
  src:'CH9 s.89–94', steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
  {t:'title', text:'Quadrature amplitude modulation'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'note', kind:'def', head:'The idea in one line', html:'Run one amplitude-modulated signal on the cosine and an independent one on the sine. Two axes, two independent $\\sqrt{M}$-level constellations, and $M$ points on a square grid.'},
    {t:'body', html:'<p>That is why the material states $M$-QAM as two-dimensional $M$-ASK. It is literally two amplitude constellations at right angles, and the receiver decides each axis separately.</p>'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'With neighbouring points a distance $d$ apart on the grid,'},
      {t:'eq', tex:'E_{s,\\text{avg}}=\\frac{(M-1)d^{2}}{6}\\quad\\Longrightarrow\\quad d_{\\min}=d=\\sqrt{\\frac{6\\,E_{s,\\text{avg}}}{M-1}}'},
      {t:'small', html:'Compare with $M$-PAM, where the denominator is $M^{2}-1$ rather than $M-1$. Spreading the same points over two dimensions instead of one is what turns the square into a linear factor.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'small', html:'The neighbour count depends on where a point sits: four corners with two, the edges with three, the interior with four. For $16$-QAM that averages to $N_{\\min}=\\frac{4(2)+8(3)+4(4)}{16}=3$.'},
      {t:'eq', key:true, tex:'P_e\\approx N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Why QAM wins for large alphabets', html:'At sixteen points, PAM has $d_{\\min}^{2}=12E_s/255$ and QAM has $6E_s/15$. That is larger by a factor of $8.5$, or $9.3$ dB, at the same energy and the same four bits a symbol. Two dimensions are worth having, and QAM is how they are used.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figConst(QAM16,{lim:1.35,w:360,h:300,r:4.5,n:88}),
      caption:'$16$-QAM: four levels on each axis, sixteen points, four bits a symbol. The corner points have two neighbours, the edges three and the middle four, which is where $N_{\\min}=3$ comes from. At $M=4$ the grid is two levels a side, which is the four points of QPSK — the two schemes are the same scheme there.'}
  ]}
]},

{ id:'m5-lab-h', module:'M5', nav:'Laboratory H', title:'Laboratory H · Error probability against signal-to-noise ratio',
  objective:'Compare the closed form with a simulation for every scheme.',
  keywords:'laboratory error probability simulation closed form comparison modulation schemes',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
  {t:'title', text:'Laboratory H · Error probability against signal-to-noise ratio'},
  {t:'body', html:'Choose a scheme and a range of signal-to-noise ratios. The laboratory draws the closed-form curve and, beside it, the error rate measured by simulating the channel and the detector. The two are computed by different routes, and where they part company is worth knowing about.'},
  {t:'lab', id:'H'}
]},

/* ---------------------------------------------------------------- 5.4 ---- */
{ id:'m5-mfsk', module:'M5', nav:'M-ary FSK', title:'M-ary frequency-shift keying',
  objective:'Show that FSK buys distance with bandwidth rather than with power.',
  keywords:'m-ary fsk orthogonal signals dimensions bandwidth grows opposite trade',
  src:'CH9 s.79–82', steps:3, blocks:[
  {t:'eyebrow', text:'Module 5 · Frequency-shift keying'},
  {t:'title', text:'M-ary frequency-shift keying'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>$M$ frequencies, spaced so that every pair of waveforms is orthogonal. Orthogonal waveforms are independent directions, so <b>$M$ signals need $M$ axes</b> — one dimension per symbol.</p>'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Every point sits on its own axis at distance $\\sqrt{E_s}$ from the origin, so every pair is the same distance apart:'},
      {t:'eq', key:true, tex:'d_{kj}=\\sqrt{2E_s}\\ \\text{for every pair},\\qquad N_{\\min}=M-1'},
      {t:'eq', tex:'P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{E_s}{N_0}}\\right)'},
      {t:'small', html:'Here the union bound and the nearest-neighbour form are the same expression, because every other point <em>is</em> a nearest neighbour.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'The distance does not shrink', html:'This is the opposite of every other family in the module. In PSK and QAM the points crowd together as $M$ grows and $d_{\\min}$ falls; here the separation stays at $\\sqrt{2E_s}$ however large $M$ becomes. Only the number of ways to be wrong grows, and that costs a factor in front of the $Q$ rather than inside it.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'What it costs instead', html:'Bandwidth. Each new symbol needs a new frequency, so the occupied band grows in proportion to $M$. PSK and QAM keep the same two dimensions however many points they place in them. Frequency-shift keying spends bandwidth to save power; the others spend power to save bandwidth. Which is the right trade depends entirely on which of the two is scarce.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:460,h:330,xr:[-0.4,1.7],yr:[-0.4,1.7],
        xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:52,r:24,t:26,b:42},xtarget:4,ytarget:4});
      a.rect(-0.4,-0.4,1.7,1.7,{fill:C.dec.in});
      a.poly([[-0.4,-0.4],[1.7,1.7]],{color:C.ink,width:1.4,dash:'5 4'});
      a.point(1.2,0,{color:C.ink,r:6}); a.point(0,1.2,{color:C.ink,r:6});
      a.poly([[1.2,0],[0,1.2]],{color:C.err,width:2});
      a.note(0.86,0.46,'d=\\sqrt{2E_s}',{tex:true,fs:14,color:C.err});
      return a.svg();
    }, caption:'Two orthogonal signals: one point on each axis, $\\sqrt{2E_s}$ apart, with the diagonal as the boundary. Adding a third symbol adds a third axis, and the new point is the same distance from both of the others.'}
  ]}
]},

{ id:'m5-compare', module:'M5', nav:'Comparing the families', title:'Comparing the families',
  objective:'Put the four families side by side on power and bandwidth.',
  keywords:'comparison psk qam pam fsk bandwidth power efficiency trade',
  src:'CH9 s.95–101', steps:2, blocks:[
  {t:'eyebrow', text:'Module 5 · Comparison'},
  {t:'title', text:'Comparing the families'},
  {t:'lede', text:'Which family to use, and what each one spends.'},
  {t:'body', html:'Every scheme in this module carries $\\log_2 M$ bits a symbol. What separates them is how much energy that costs and how much bandwidth.'},
  {t:'grid', cols:2, gap:'26px', items:[
    [{t:'card', head:'PAM — one dimension', items:[
      {t:'body', html:'<p>$d_{\\min}^{2}=\\dfrac{12E_s}{M^{2}-1}$. Cheapest in bandwidth, and the distance collapses fastest: about $6$ dB for each doubling of $M$. Used where only one dimension is available, as in baseband.</p>'}
    ]}],
    [{t:'card', head:'PSK — two dimensions, one circle', items:[
      {t:'body', html:'<p>$d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/M)$. Constant envelope, which suits an amplifier driven hard. Above eight points the circle is crowded and the cost per extra bit climbs past $5$ dB.</p>'}
    ]}],
    [{t:'card', head:'QAM — two dimensions, a grid', items:[
      {t:'body', html:'<p>$d_{\\min}^{2}=\\dfrac{6E_s}{M-1}$. The denominator is linear in $M$ rather than quadratic, so QAM beats PAM by a widening margin and PSK above eight points. It is what a modern link uses.</p>'}
    ]}],
    [{t:'card', head:'FSK — M dimensions', items:[
      {t:'body', html:'<p>$d_{\\min}=\\sqrt{2E_s}$, and it does not shrink. Bandwidth grows with $M$ instead. The only family here that spends bandwidth to save power.</p>'}
    ]}]
  ]},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'One sentence to take away', html:'Every family answers the same question: how to place $M$ points as far apart as possible for a given average energy. They differ in how many dimensions they are allowed to use. More dimensions mean more room and more bandwidth, and that is the whole trade.'}
  ]},
  {t:'reveal', at:2, items:[
    {t:'note', kind:'warn', head:'What none of this settles', html:'The comparison is on error probability and bandwidth alone. A real choice weighs three more things. How hard is the transmitter to build, can the amplifier run at saturation, and how much must the receiver know about the carrier phase? PSK survives against QAM in some systems for the second of those reasons and no other.'}
  ]}
]},

/* ---------------------------------------------------------------- 5.5 ---- */
{ id:'m5-synth', module:'M5', nav:'Summary', title:'What Module 5 established',
  objective:'Collect the modulation results.',
  keywords:'summary modulation families minimum distance error probability comparison',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 5 · Summary'},
  {t:'title', text:'What Module 5 established'},
  {t:'grid', cols:2, gap:'26px', items:[
    [{t:'card', head:'The binary three', items:[
      {t:'body', html:'<p>BPSK is antipodal and best. BFSK and BASK are both $3$ dB worse, for the same reason: their points are $\\sqrt2$ closer at the same average energy per bit.</p>'},
      {t:'eq', plain:true, tex:'Q\\!\\left(\\sqrt{2E_b/N_0}\\right)\\ \\text{vs}\\ Q\\!\\left(\\sqrt{E_b/N_0}\\right)'}
    ]}],
    [{t:'card', head:'The M-ary families', items:[
      {t:'body', html:'<p>Each is a constellation, and Module 4 supplies the answer once the distance is measured.</p>'},
      {t:'eq', plain:true, tex:'P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)'}
    ]}],
    [{t:'card', head:'The distances', items:[
      {t:'body', html:'<p>Three formulas cover the module.</p>'},
      {t:'eq', plain:true, tex:'\\text{PSK: }2\\sqrt{E_s}\\sin\\tfrac{\\pi}{M}'},
      {t:'eq', plain:true, tex:'\\text{PAM: }\\sqrt{12E_s/(M^{2}-1)}'},
      {t:'eq', plain:true, tex:'\\text{QAM: }\\sqrt{6E_s/(M-1)}'}
    ]}],
    [{t:'card', head:'The trade', items:[
      {t:'body', html:'<p>More bits a symbol costs power in PSK, PAM and QAM, and bandwidth in FSK. Which to spend is a question about the channel, not about the mathematics.</p>'}
    ]}]
  ]},
  {t:'note', kind:'ok', head:'What Module 6 asks instead', html:'Every scheme here is judged against the noise. Module 6 asks a different question: how much information did the source produce, and how fast can a channel carry it at all? That limit no modulation scheme can pass.'}
]}

];

window.SCENES_M5 = SC;
})();
