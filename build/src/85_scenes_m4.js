/* ==========================================================================
   Module 4 — The optimal receiver in additive white Gaussian noise.

   The module in one sentence: the best receiver computes the coordinates of
   what arrived and picks the nearest signal point, and how often it is wrong
   depends only on how far apart the points are.

   Written plain first. Each scene says what is happening in ordinary words,
   then in symbols, and names the step a reader is most likely to get wrong.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

function Qf(x){
  const t = 1/(1+0.2316419*Math.abs(x));
  const d = 0.3989422804014327*Math.exp(-x*x/2);
  const p = d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0 ? p : 1-p;
}
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }

/* A constellation with its decision regions drawn as a low-opacity fill of the
   colour of the symbol each region decides for. The regions are found by
   testing a grid: the nearest point wins, which is the rule the module
   derives, so the picture is drawn by the rule rather than beside it. */
const REGCOL = [C.dec.in, C.dec.out, C.dec.mid, C.dec.h, C.dec.err];
const PTCOL  = [C.in, C.out, C.mid, C.h, C.err];

function figRegions(pts, opts){
  opts = opts || {};
  const lim = opts.lim || 2.2, n = opts.n || 86;
  const a = P.Axes({w:opts.w||480,h:opts.h||340,xr:[-lim,lim],yr:[-lim,lim],
    xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:52,r:24,t:26,b:42},xtarget:4,ytarget:4});
  const step = 2*lim/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x = -lim + (i+0.5)*step, y = -lim + (j+0.5)*step;
    let best = 0, bd = Infinity;
    pts.forEach((p,k)=>{
      const d = (x-p.x)*(x-p.x)+(y-p.y)*(y-p.y) - (p.bias||0);
      if(d < bd){ bd = d; best = k; }
    });
    a.rect(x-step/2, y-step/2, x+step/2, y+step/2, {fill:REGCOL[best % REGCOL.length]});
  }
  if(opts.cloud){
    const nz = gauss(20260802, 2*opts.cloud, opts.sigma||0.32);
    for(let i=0;i<opts.cloud;i++)
      a.point(pts[0].x+nz[2*i], pts[0].y+nz[2*i+1], {color:C.noise, r:1.7, ring:'none'});
  }
  pts.forEach((p,k)=>a.point(p.x,p.y,{color:PTCOL[k % PTCOL.length], r:6}));
  /* A scene that needs to mark something on top of the regions — a boundary,
     a label — draws it here, on the same axes, rather than building a second
     figure that would have to repeat the grid. */
  if(opts.over) opts.over(a);
  return a.svg();
}

/* ---- summary-card miniatures ----
   Each recalls the key figure of its section, stripped to the shape alone. */
function mini(w,h,xr,yr){ return P.Axes({w:w,h:h,xr:xr,yr:yr,pad:{l:10,r:10,t:8,b:8},
  xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}); }
function miniRule(){
  const a = mini(520,100,[-1.5,1.5],[-1.1,1.1]);
  const pts=[[-0.9,-0.5],[0.9,-0.5],[0,0.75]];
  const r=[0.28,0.42];
  a.poly([r,pts[2]],{color:C.out,width:1.8,dash:'4 3'});
  pts.forEach(p=>a.point(p[0],p[1],{color:C.ink,r:4.5}));
  a.point(r[0],r[1],{color:C.mid,r:5});
  return a.svg();
}
function miniRegions(){
  const a = mini(320,84,[-1.5,1.5],[-1.1,1.1]);
  a.rect(-1.5,-1.1,0,0,{fill:C.dec.in}); a.rect(0,-1.1,1.5,0,{fill:C.dec.out});
  a.rect(-1.5,0,0,1.1,{fill:C.dec.mid}); a.rect(0,0,1.5,1.1,{fill:C.dec.h});
  a.poly([[0,-1.1],[0,1.1]],{color:C.grid,width:1.2});
  a.poly([[-1.5,0],[1.5,0]],{color:C.grid,width:1.2});
  [[-0.75,-0.5],[0.75,-0.5],[-0.75,0.5],[0.75,0.5]].forEach(p=>a.point(p[0],p[1],{color:C.ink,r:4}));
  return a.svg();
}
function miniBinaryD(){
  const a = mini(520,100,[-1.6,1.6],[-0.6,0.9]);
  a.poly([[-1,0],[1,0]],{color:C.err,width:2});
  a.point(-1,0,{color:C.ink,r:5}); a.point(1,0,{color:C.ink,r:5});
  a.poly([[0,-0.4],[0,0.55]],{color:C.rule,width:1.2,dash:'3 4'});
  a.note(0,0.62,'d',{tex:true,fs:12,color:C.err,anchor:'middle'});
  return a.svg();
}
function miniUnion(){
  /* the x-range matches the pixel aspect of the frame, so the ring is round */
  const a = mini(520,130,[-5.26,5.26],[-1.2,1.2]);
  const R=0.85;
  const ring=[]; for(let i=0;i<=48;i++){const t=2*Math.PI*i/48; ring.push([R*Math.cos(t),R*Math.sin(t)]);}
  a.poly(ring,{color:C.rule,width:1.2,dash:'3 4'});
  a.point(0,0,{color:C.ink,r:5});
  [[R,0],[-R,0],[0,R],[0,-R]].forEach(p=>a.point(p[0],p[1],{color:C.mid,r:4}));
  return a.svg();
}

const SC = [

/* ---------------------------------------------------------------- 4.0 ---- */
{ id:'m4-open', module:'M4', nav:'The receiver problem', title:'Which point did it come from?',
  objective:'State the problem the module solves and the answer it reaches.',
  keywords:'optimal receiver awgn decision minimum distance opening m-ary',
  src:'CH9 s.23', steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · Opening'},
  {t:'title', text:'Which point did it come from?'},
  {t:'lede', text:'A transmitter picks one of $M$ signals and sends it. The channel adds noise. The receiver sees the sum and has to name the signal. Module 3 turned the signals into points; this module turns the receiver into a rule about those points.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Write what arrives as</p>'},
    {t:'eq', tex:'r(t)=s_i(t)+n(t),\\qquad 0<t<T'},
    {t:'body', html:'<p>with $n(t)$ white Gaussian noise of two-sided density $N_0/2$. The receiver knows the $M$ possible signals. It does not know which was sent, and it never will — it can only choose.</p>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'The answer, in one line', html:'When the $M$ signals are equally likely, the best rule is: <b>compute the coordinates of what arrived and choose the signal point nearest to it.</b> Nothing cleverer helps, and the rest of the module is why that is true and what it costs.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>Two results follow under this white Gaussian noise model.</p><ul><li>The coherent-detection error probability depends on the <b>distances</b> between the signal points.</li><li>The exact error probability requires an integral over the decision regions. This integral usually has no simple closed form. The <b>union bound</b> gives a computable upper bound made of $Q$ functions.</li></ul>'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figRegions(
      [{x:1,y:1},{x:-1,y:1},{x:-1,y:-1},{x:1,y:-1}],{cloud:260,sigma:0.34}),
      caption:'Four signal points, the regions the rule assigns to each, and a cloud of what the receiver actually observes when the first point is sent. Most of the cloud is in the right region. The part that is not is the error probability.'}
  ]}
]},

/* ---------------------------------------------------------------- 4.1 ---- */
{ id:'m4-observe', module:'M4', nav:'What the receiver keeps', title:'The observation vector',
  objective:'Show that the correlator bank loses nothing that matters.',
  keywords:'correlator bank observation vector irrelevant noise component projection',
  src:'CH9 s.24–25', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The observation'},
  {t:'title', text:'The observation vector'},
  {t:'lede', text:'The receiver keeps $N$ numbers, and loses nothing that matters.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The receiver has $N$ correlators, one per basis function. Each returns one number:</p>'},
    {t:'eq', tex:'r_k=\\int_0^{T}r(t)\\,\\psi_k(t)\\,dt=\\underbrace{\\int_0^T s_i\\psi_k\\,dt}_{s_{ik}}+\\underbrace{\\int_0^T n\\psi_k\\,dt}_{n_k}=s_{ik}+n_k'},
    {t:'eq', key:true, tex:'\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}=(r_1,\\ldots,r_N)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>The signal was built from the $N$ basis functions, so the correlators capture all of it. The noise was not: part of it lies outside the space the basis spans. Write that part $n_0(t)$, so that</p>'},
      {t:'eq', tex:'r(t)=\\sum_{k=1}^{N}r_k\\psi_k(t)+n_0(t)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Why $n_0(t)$ can be thrown away', html:'It contains no signal at all. Every signal is a combination of the $N$ basis functions, so none of them has any component outside that space. And it is independent of the $N$ numbers the receiver kept. A quantity that carries no information about the answer and is unrelated to what was kept cannot help, so discarding it costs nothing.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'What this does not say', html:'The result does not say that the noise is small or that the correlators remove it. The receiver keeps all noise components inside the signal space. It discards only the component that cannot help distinguish the signals.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>P.blocks({w:620,h:300,items:[
      {t:'arrow',x1:20,y1:60,x2:110,y2:60},
      {t:'box',x:110,y:28,w:200,h:64,label:'\\int_0^T(\\cdot)\\,\\psi_1(t)\\,dt',tex:true,fs:15},
      {t:'arrow',x1:310,y1:60,x2:400,y2:60},
      {t:'arrow',x1:20,y1:180,x2:110,y2:180},
      {t:'box',x:110,y:148,w:200,h:64,label:'\\int_0^T(\\cdot)\\,\\psi_N(t)\\,dt',tex:true,fs:15},
      {t:'arrow',x1:310,y1:180,x2:400,y2:180},
      {t:'text',x:22,y:44,label:'r(t)',tex:true,fs:15,anchor:'start'},
      {t:'text',x:445,y:66,label:'r_1',tex:true,fs:15},
      {t:'text',x:445,y:186,label:'r_N',tex:true,fs:15},
      {t:'text',x:60,y:126,label:'\\vdots',tex:true,fs:18},
      {t:'text',x:250,y:260,label:'a bank of N correlators',fs:12.5}
    ]}), caption:'The demodulator. $N$ correlators, $N$ numbers, and everything the detector will ever see.'}
  ]}
]},

{ id:'m4-noise', module:'M4', nav:'The noise on each axis', title:'The noise vector',
  objective:'Establish the distribution of the noise vector.',
  keywords:'noise vector independent gaussian variance uncorrelated joint density',
  src:'CH9 s.26–27', steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The observation'},
  {t:'title', text:'The noise vector'},
  {t:'lede', text:'One independent Gaussian per axis.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Each $n_k$ is a projection of a Gaussian process onto a fixed function, so it is Gaussian with zero mean. The useful part is what happens between two of them:</p>'},
    {t:'eq', tex:'E[n_jn_k]=\\frac{N_0}{2}\\int_0^{T}\\psi_j(u)\\psi_k(u)\\,du=\\begin{cases}\\dfrac{N_0}{2},&j=k\\\\[4pt]0,&j\\ne k\\end{cases}'},
    {t:'small', html:'The middle step uses $E[n(\\tau)n(u)]=\\frac{N_0}{2}\\delta(\\tau-u)$ and the sifting property; the last uses that the basis is orthonormal.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Uncorrelated, and therefore independent', html:'For jointly Gaussian variables, zero correlation is independence. So the $N$ noise components are independent, each $\\mathcal{N}(0,\\,N_0/2)$, and the joint density is a product:'},
      {t:'eq', key:true, tex:'f_{\\mathbf{n}}(n_1,\\ldots,n_N)=(\\pi N_0)^{-N/2}\\exp\\!\\left(-\\sum_{k=1}^{N}\\frac{n_k^{2}}{N_0}\\right)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'What the picture looks like', html:'Every axis has the same variance and the axes are independent. The noise cloud is therefore a <b>circle</b> — a sphere in $N$ dimensions — and not an ellipse. That symmetry is what makes "nearest point" the right rule in the next section. If the variances differed, the nearest point in the ordinary sense would not be the best answer.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:480,h:340,xr:[-2.4,2.4],yr:[-2.4,2.4],
        xlabel:'n_1',ylabel:'n_2',pad:{l:52,r:24,t:26,b:42},xtarget:4,ytarget:4});
      const nz = gauss(20260802, 1600, 0.62);
      for(let i=0;i<800;i++) a.point(nz[2*i], nz[2*i+1], {color:C.noise, r:1.9, ring:'none'});
      [1,2,3].forEach(k=>{
        const pts=[]; for(let i=0;i<=200;i++){ const th=2*Math.PI*i/200;
          pts.push([k*0.62*Math.cos(th), k*0.62*Math.sin(th)]); }
        a.poly(pts,{color:C.muted,width:1,dash:'4 4'});
      });
      return a.svg();
    }, caption:'Eight hundred draws of a two-dimensional noise vector, with circles at one, two and three standard deviations. The cloud has no preferred direction. This symmetry makes Euclidean distance the correct measure for the decision rule.'}
  ]}
]},

/* ---------------------------------------------------------------- 4.2 ---- */
{ id:'m4-map', module:'M4', nav:'MAP and ML', title:'The MAP and ML rules',
  objective:'State the MAP and ML rules and the relation between them.',
  keywords:'maximum a posteriori maximum likelihood bayes prior posterior decision rule',
  src:'CH9 s.29–30', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'The MAP and ML rules'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The receiver should choose the signal that is most likely <em>given what it saw</em>. That is the posterior probability $P(\\mathbf{s}_i\\mid\\mathbf{r})$, and by Bayes\' rule</p>'},
    {t:'eq', tex:'P(\\mathbf{s}_i\\mid\\mathbf{r})=\\frac{P(\\mathbf{s}_i)\\,f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)}{f_{\\mathbf{r}}(\\mathbf{r})}'},
    {t:'small', html:'The denominator is the same for every $i$, so it cannot change which $i$ wins and is dropped.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The MAP rule', html:'Choose the $\\mathbf{s}_i$ that maximises $P(\\mathbf{s}_i)\\,f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)$ — the prior times the likelihood. This is the rule that minimises the probability of error, and no rule does better.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'The ML rule', html:'If all $M$ signals are equally likely, every prior is $1/M$ and the priors cannot change the answer either. What is left is: choose the $\\mathbf{s}_i$ that maximises the likelihood $f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)$.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'<b>Which one to use:</b> MAP minimizes the probability of error when the priors are known and all errors cost the same. ML gives the same decision when the priors are equal, and is what remains when they are unknown. With known unequal priors, MAP can give a lower error probability.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figRegions(
      [{x:-1.1,y:0},{x:1.1,y:0}],{lim:2.2,w:420,h:190}),
      caption:'Equal priors: the boundary is the perpendicular bisector, exactly halfway between the two points.'},
    {t:'fig', frame:true, svg:()=>figRegions(
      [{x:-1.1,y:0,bias:0.9},{x:1.1,y:0}],{lim:2.2,w:420,h:190}),
      caption:'The left symbol four times more likely. Its region has grown and the boundary has moved towards the other point. Nothing else about the picture has changed.'}
  ]}
]},

{ id:'m4-mindist', module:'M4', nav:'Minimum distance', title:'Minimum-distance detection',
  objective:'Reduce the ML rule to minimum-distance detection.',
  keywords:'minimum distance detection log likelihood euclidean squared distance nearest',
  src:'CH9 s.31–34', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'Minimum-distance detection'},
  {t:'lede', text:'The rule is: choose the nearest point.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Put the noise density from the last section into the likelihood. Each $r_k$ is $s_{ik}$ plus independent noise of variance $N_0/2$, so</p>'},
    {t:'eq', tex:'f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)=(\\pi N_0)^{-N/2}\\exp\\!\\left(-\\sum_{k=1}^{N}\\frac{(r_k-s_{ik})^{2}}{N_0}\\right)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Take the logarithm. It is increasing, so it does not change which $i$ wins, and it turns the product into a sum:</p>'},
      {t:'eq', tex:'\\ln f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)=-\\frac{N}{2}\\ln(\\pi N_0)-\\frac{1}{N_0}\\,\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}'},
      {t:'small', html:'The first term does not depend on $i$ and is dropped. Maximising what is left means minimising the squared distance.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, label:'ML detection', tex:'\\hat{s}=\\arg\\min_{i}\\;\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}'},
      {t:'eq', key:true, label:'MAP detection', tex:'\\hat{s}=\\arg\\min_{i}\\;\\Bigl\\{\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)\\Bigr\\}'},
      {t:'note', kind:'ok', head:'Say it in words', html:'<b>Choose the signal point closest to what arrived.</b> With unequal priors, subtract a fixed handicap from each distance first. A more likely symbol gets a larger handicap and so wins from further away.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Where the handicap goes', html:'$-N_0\\ln P(\\mathbf{s}_i)$ is <em>subtracted</em>, and $\\ln P$ is negative, so the term is positive and smaller for the more likely symbol. Getting the sign wrong shrinks the region of the likely symbol instead of growing it, and the error probability rises rather than falls.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:480,h:340,xr:[-0.4,2.6],yr:[-0.4,2.4],
        xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:52,r:24,t:26,b:42},xtarget:4,ytarget:4});
      a.poly([[0.6,1.9],[1.8,0.7]],{color:C.err,width:2.2});
      a.poly([[0.6,1.9],[0.6,0.7]],{color:C.rule,width:1,dash:'3 4'});
      a.poly([[0.6,0.7],[1.8,0.7]],{color:C.rule,width:1,dash:'3 4'});
      a.point(0.6,1.9,{color:C.mid,r:6});
      a.point(1.8,0.7,{color:C.in,r:6});
      a.note(0.6,2.06,'\\mathbf{r}',{tex:true,fs:15,color:C.mid,anchor:'middle'});
      a.note(1.86,0.5,'\\mathbf{s}_i',{tex:true,fs:15,color:C.in});
      a.note(1.34,1.44,'D(\\mathbf{r},\\mathbf{s}_i)',{tex:true,fs:14,color:C.err});
      a.note(1.2,0.5,'r_1-s_{i1}',{tex:true,fs:13,color:C.muted,anchor:'middle'});
      a.note(0.02,1.3,'r_2-s_{i2}',{tex:true,fs:13,color:C.muted});
      return a.svg();
    }, caption:'The quantity the detector minimises is the ordinary distance between the observation and a signal point, and in two dimensions it is Pythagoras: $D^{2}=(r_1-s_{i1})^{2}+(r_2-s_{i2})^{2}$.'}
  ]}
]},

{ id:'m4-metric', module:'M4', nav:'The receiver that computes it', title:'The correlation metric',
  objective:'Turn the distance rule into the correlation metric a receiver computes.',
  keywords:'correlation metric receiver structure energy bias equal energy signals',
  src:'CH9 s.35–36', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The decision rule'},
  {t:'title', text:'The correlation metric'},
  {t:'lede', text:'The receiver, in the form it is built.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Expanding the squared distance gives three terms:</p>'},
    {t:'eq', tex:'\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}=\\underbrace{\\|\\mathbf{r}\\|^{2}}_{\\text{same for every }i}-2\\,\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i+\\underbrace{\\|\\mathbf{s}_i\\|^{2}}_{E_i}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>The first term is the same whichever signal is being tested, so it cannot change the winner and is dropped. Turning the minimum into a maximum and dividing by two:</p>'},
      {t:'eq', key:true, tex:'\\hat{s}=\\arg\\max_{i}\\;\\Bigl\\{\\underbrace{\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i}_{\\text{correlation}}-\\frac{E_i}{2}+\\frac{N_0}{2}\\ln P(\\mathbf{s}_i)\\Bigr\\}'},
      {t:'small', html:'And $\\mathbf{r}\\cdot\\mathbf{s}_i=\\int_0^{T}r(t)s_i(t)\\,dt$, by the property of Module 3 — so the receiver can correlate against the waveforms directly and never compute coordinates at all.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'The simplest case, which is the common one', html:'If all $M$ signals are equally likely <b>and</b> have the same energy, both correction terms are the same for every $i$ and drop out. The rule becomes: <b>choose the signal with the largest correlation.</b> That is one multiplier and one integrator per signal, and nothing else.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'When the energies differ', html:'The $-E_i/2$ term must stay. Without it a high-energy signal wins too often, because a large $\\mathbf{s}_i$ makes $\\mathbf{r}\\cdot\\mathbf{s}_i$ large whatever arrived. On-off signalling is exactly this case, and dropping the term there makes the receiver decide "one" almost always.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>P.blocks({w:620,h:320,items:[
      {t:'arrow',x1:20,y1:60,x2:100,y2:60},
      {t:'box',x:100,y:30,w:150,h:60,label:'\\int_0^T(\\cdot)s_1(t)dt',tex:true,fs:14},
      {t:'arrow',x1:250,y1:60,x2:300,y2:60},
      {t:'sum',x:325,y:60},
      {t:'arrow',x1:325,y1:110,x2:325,y2:78},
      {t:'text',x:325,y:132,label:'-E_1/2',tex:true,fs:13},
      {t:'arrow',x1:343,y1:60,x2:420,y2:60},
      {t:'arrow',x1:20,y1:210,x2:100,y2:210},
      {t:'box',x:100,y:180,w:150,h:60,label:'\\int_0^T(\\cdot)s_M(t)dt',tex:true,fs:14},
      {t:'arrow',x1:250,y1:210,x2:300,y2:210},
      {t:'sum',x:325,y:210},
      {t:'arrow',x1:325,y1:260,x2:325,y2:228},
      {t:'text',x:325,y:282,label:'-E_M/2',tex:true,fs:13},
      {t:'arrow',x1:343,y1:210,x2:420,y2:210},
      {t:'box',x:420,y:95,w:140,h:80,label:'take the largest',fs:14},
      {t:'arrow',x1:550,y1:135,x2:600,y2:135},
      {t:'text',x:22,y:44,label:'r(t)',tex:true,fs:15,anchor:'start'},
      {t:'text',x:60,y:140,label:'\\vdots',tex:true,fs:18}
    ]}), caption:'The receiver as it is built: one correlator per signal, an energy correction on each, and a comparison. With equal energies the corrections vanish and only the correlators remain.'}
  ]}
]},

/* ---------------------------------------------------------------- 4.3 ---- */
{ id:'m4-regions', module:'M4', nav:'Decision regions', title:'Decision regions',
  objective:'Show that decision boundaries are perpendicular bisectors.',
  keywords:'decision regions perpendicular bisector boundaries unequal priors shrink',
  src:'CH9 s.47, 50', steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions'},
  {t:'title', text:'Decision regions'},
  {t:'lede', text:'The rule, drawn.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The rule assigns every possible observation to one signal. Collecting the observations that give the same answer divides the space into $M$ pieces:</p>'},
    {t:'eq', tex:'R_i=\\left\\{\\mathbf{r}\\;:\\;\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}\\le\\|\\mathbf{r}-\\mathbf{s}_j\\|^{2}\\ \\text{for all }j\\ne i\\right\\}'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Three facts about the boundaries', html:'<ol><li>A boundary between two points is <b>perpendicular</b> to the line joining them.</li><li>With equal priors it crosses that line exactly <b>halfway</b>.</li><li>With unequal priors it moves, and <b>the region of the less likely signal shrinks</b>.</li></ol>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>The first two are the definition of a perpendicular bisector: the set of points equidistant from two fixed points <em>is</em> that bisector. Nothing has to be calculated once the rule is "nearest point".</p>'},
      {t:'note', kind:'warn', head:'A region need not be bounded', html:'Only the nearest neighbours contribute boundaries. A point in the middle of a constellation has a bounded region. A point on the outside has one that runs off to infinity, and that is why outer points make fewer errors than inner ones.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figRegions(
      [{x:1.15,y:0},{x:0,y:1.15},{x:-1.15,y:0},{x:0,y:-1.15}],{lim:2.2,w:360,h:210}),
      caption:'Four points, four regions, four boundaries — each perpendicular to the line joining the two points it separates. Three points on a line would give a strip in the middle and two half planes outside it, which is why a middle symbol is mistaken more often than an outer one.'},
  ]}
]},

{ id:'m4-binary', module:'M4', nav:'The binary case', title:'The binary case',
  objective:'Derive the binary error probability from the geometry alone.',
  keywords:'binary decision distance error probability q function geometry antipodal',
  src:'CH9 s.48–55', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions'},
  {t:'title', text:'The binary case'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Take two equally likely points a distance $d$ apart. Put the origin midway, so they sit at $\\pm d/2$ on the line joining them, and the boundary is at zero.</p>'},
    {t:'body', html:'<p>An error happens when the noise along that line carries the observation across the boundary — a distance of $d/2$. The noise on any one axis is $\\mathcal{N}(0,N_0/2)$, so</p>'},
    {t:'eq', key:true, tex:'P_e=Q\\!\\left(\\frac{d/2}{\\sqrt{N_0/2}}\\right)=Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>For antipodal signalling the two points are at $\\pm\\sqrt{E_b}$, so $d=2\\sqrt{E_b}$ and $d^{2}=4E_b$:</p>'},
      {t:'eq', tex:'P_b=Q\\!\\left(\\sqrt{\\frac{4E_b}{2N_0}}\\right)=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)'},
      {t:'small', html:'The same expression Module 2 derived by integrating two Gaussian densities — reached here from the picture, with no integral at all.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'This is the result the module is for', html:'The error probability of a binary system depends on <b>the distance between the two points and on nothing else</b>. Not the waveforms, not their shapes, not even where the points sit — only how far apart they are.'},
      {t:'body', html:'<p>With unequal priors the boundary is no longer at the midpoint. Measuring from the first point along the line joining the two, it sits at</p>'},
      {t:'eq', label:'boundary position', tex:'\\mu=\\frac{d}{2}+\\frac{N_0}{2d}\\ln\\frac{P(\\mathbf{s}_1)}{P(\\mathbf{s}_0)}'},
      {t:'small', html:'Equal priors give $\\mu=d/2$. A more likely $\\mathbf{s}_1$ makes the logarithm positive, so $\\mu$ grows, the boundary moves away from $\\mathbf{s}_1$, and its region enlarges.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'Both results of Module 2 follow at once. Antipodal points are $2\\sqrt{E_b}$ apart; on-off points are $\\sqrt{2E_b}$ apart, smaller by $\\sqrt{2}$ — which is the $3$ dB, obtained by measuring a picture.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:520,h:300,xr:[-2.6,2.6],yr:[-0.06,0.72],
        xlabel:'\\text{position along the line joining the two points}',ylabel:'f',
        pad:{l:54,r:26,t:26,b:46},xtarget:5,ytarget:4});
      const s = 0.62;
      const g=(y,m)=>Math.exp(-(y-m)*(y-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
      a.rect(-2.6,0,0,0.70,{fill:C.dec.err}); a.rect(0,0,2.6,0.70,{fill:C.dec.in});
      a.area(y=>g(y,-1), 0, 2.6, {color:C.dec.err, stroke:C.err});
      a.curve(y=>g(y,-1),{color:C.err,width:2.2});
      a.curve(y=>g(y, 1),{color:C.in, width:2.2});
      a.vline(0,{color:C.ink,dash:'5 4',width:1.6});
      a.point(-1,0,{color:C.err,r:6}); a.point(1,0,{color:C.in,r:6});
      a.span(-1,1,0.63,'d',{tex:true,color:C.muted});
      return a.svg();
    }, caption:'The two densities along the line joining the points. The shaded tail is the probability that the left signal is mistaken for the right one.'}
  ]}
]},

{ id:'m4-lab-g', module:'M4', nav:'Laboratory G', title:'Laboratory G · Constellations and decision regions',
  objective:'Let the reader move points and watch the regions and the error follow.',
  keywords:'laboratory constellation decision regions noise error probability minimum distance',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · Decision regions'},
  {t:'title', text:'Laboratory G · Constellations and decision regions'},
  {t:'body', html:'Choose a constellation and a noise level. The laboratory draws the decision regions from the rule and scatters the observations the receiver would actually see. It counts how many land in the wrong region, and compares that count with the union bound. Move the points closer and both numbers rise together.'},
  {t:'lab', id:'G'}
]},

/* ---------------------------------------------------------------- 4.4 ---- */
{ id:'m4-pe', module:'M4', nav:'The exact answer', title:'The exact error probability',
  objective:'Give the general error expression and explain the difficulty.',
  keywords:'general expression probability of error integral decision region multidimensional',
  src:'CH9 s.51, 56', steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'The exact error probability'},
  {t:'lede', text:'The exact answer, and why it is not usable.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>A decision is correct when the observation lands in the right region. Averaging over the symbols:</p>'},
    {t:'eq', tex:'P(C)=\\sum_{i=1}^{M}P\\bigl(\\mathbf{r}\\in R_i\\mid\\mathbf{s}_i\\bigr)P(\\mathbf{s}_i),\\qquad P_e=1-P(C)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Each of those probabilities is an integral of the likelihood over a region:</p>'},
      {t:'eq', key:true, tex:'P_e=1-\\frac{1}{M}\\sum_{i=1}^{M}\\int_{R_i}f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)\\,d\\mathbf{r}'},
      {t:'note', kind:'err', head:'Why the exact form is difficult', html:'The integral can extend over $N$ dimensions, and the decision region can have several faces. For $M=2$, it reduces to one Gaussian tail. For a general larger constellation, a closed form is usually unavailable and numerical integration can be expensive.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Use an upper bound instead', html:'The next scene replaces the exact expression with an upper bound made of $Q$ functions. The bound is often useful at high signal-to-noise ratios. It can be loose at low ratios. Because it is an upper bound, meeting the bound is sufficient to meet the true error requirement.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figRegions(
      [{x:1.2,y:1.2},{x:-1.2,y:1.2},{x:-1.2,y:-1.2},{x:1.2,y:-1.2},{x:0,y:0}],
      {lim:2.6,cloud:400,sigma:0.42}),
      caption:'Five points, and the cloud the receiver sees when the top-right one is sent. The exact error probability is the fraction of that cloud outside its own region — a shape with three straight edges here, and a harder one in higher dimensions.'}
  ]}
]},

{ id:'m4-union', module:'M4', nav:'The union bound', title:'The union bound',
  objective:'Derive the union bound from the pairwise error probability.',
  keywords:'union bound pairwise error probability upper bound q function distance',
  src:'CH9 s.57–59', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'The union bound'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Suppose $\\mathbf{s}_k$ was sent. Let $A_{kj}$ be the event that the observation is closer to $\\mathbf{s}_j$ than to $\\mathbf{s}_k$. An error happens exactly when at least one of those events occurs, and the probability of a union is at most the sum of the probabilities:</p>'},
    {t:'eq', tex:'P(\\text{error}\\mid\\mathbf{s}_k)=P\\!\\left(\\bigcup_{j\\ne k}A_{kj}\\right)\\le\\sum_{j\\ne k}P(A_{kj})'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Each $P(A_{kj})$ is a <b>binary</b> question — closer to $\\mathbf{s}_j$ or to $\\mathbf{s}_k$, ignoring every other point — and the binary answer is already known:</p>'},
      {t:'eq', key:true, tex:'P(\\mathbf{s}_k\\to\\mathbf{s}_j)=Q\\!\\left(\\frac{d_{kj}/2}{\\sqrt{N_0/2}}\\right)=Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)'},
      {t:'small', html:'with $d_{kj}=\\|\\mathbf{s}_k-\\mathbf{s}_j\\|$. The $N$-dimensional problem has become a list of one-dimensional ones.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, label:'union bound', tex:'P_e\\le\\frac{1}{M}\\sum_{k=1}^{M}\\sum_{\\substack{j=1\\\\ j\\ne k}}^{M}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Why it is an over-estimate, and when that matters', html:'The events overlap. One observation can be closer to two other points, so the sum can count it twice. The bound is therefore not less than the true probability. At low signal-to-noise ratios, it can even exceed one. At high ratios, the overlap terms become small and the bound is often close to the true result.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figRegions(
      [{x:1.2,y:1.2},{x:-1.2,y:1.2},{x:-1.2,y:-1.2},{x:1.2,y:-1.2}],
      {lim:2.6,cloud:340,sigma:0.5}),
      caption:'The observation when the top-right point is sent. The bound adds up three separate two-point questions — is it closer to the left one, to the bottom one, to the diagonal one — and the region where two of those answers are "yes" is counted twice.'}
  ]}
]},

{ id:'m4-dmin', module:'M4', nav:'The usable forms', title:'The minimum-distance and nearest-neighbour forms',
  objective:'Give the minimum-distance bound and the nearest-neighbour approximation.',
  keywords:'minimum distance bound nearest neighbour approximation number of neighbours',
  src:'CH9 s.60–61', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'The minimum-distance and nearest-neighbour forms'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>$Q$ decreases, so replacing every distance by the smallest one can only make each term larger. Write</p>'},
    {t:'eq', tex:'d_{\\min}=\\min_{k\\ne j}\\;d_{kj}'},
    {t:'body', html:'<p>and every one of the $M-1$ terms in the inner sum is at most $Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$:</p>'},
    {t:'eq', key:true, label:'minimum-distance bound', tex:'P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'This one is loose, and deliberately', html:'It pretends every other signal point sits at the minimum distance. In a large constellation most of them are much further away and contribute almost nothing, so the bound over-states $P_e$ by a factor of several. It is used because it needs only two numbers, $M$ and $d_{\\min}$.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>The tighter form keeps only the points that are actually at the minimum distance. Let $N_{\\min}$ be the average number of such <b>nearest neighbours</b> per signal point:</p>'},
      {t:'eq', key:true, label:'nearest-neighbour approximation', tex:'P_e\\approx N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'},
      {t:'small', html:'This approximation is useful at high signal-to-noise ratios. More distant points have much smaller pairwise terms, so the nearest neighbours dominate the error probability.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'What to take away', html:'A constellation is judged by two numbers. $d_{\\min}$ sets the exponent and therefore almost everything; $N_{\\min}$ multiplies it and matters far less. Designing a good constellation means pushing $d_{\\min}$ as far as possible at a fixed average energy.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:520,h:320,xr:[0,16],yr:[-7,-0.02],
        xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_e',ytickfmt:P.decade,yticksOverride:P.decades(-7,-1),zeroAxes:false,
        pad:{l:58,r:26,t:26,b:44},xtarget:6,ytarget:6});
      /* 8-PSK: d_min^2 = 4 Es sin^2(pi/8), Es = 3 Eb, Nmin = 2, M-1 = 7 */
      const arg = d => Math.sqrt(3*Math.pow(10,d/10)*4*Math.pow(Math.sin(Math.PI/8),2)/2);
      const cl = v => Math.log10(Math.max(1e-12, v));
      a.curve(d=>cl(7*Qf(arg(d))),{color:C.err,width:2.2});
      a.curve(d=>cl(2*Qf(arg(d))),{color:C.in,width:2.2});
      a.curve(d=>cl(1*Qf(arg(d))),{color:C.muted,width:1.5,dash:'5 4'});
      return a.svg();
    }, caption:'The two bounds for eight-point phase-shift keying. They are parallel, because both are the same $Q$ with a different multiplier; the gap is a constant factor of $7/2$, under $6$ dB of error rate at any signal-to-noise ratio and never any shift along the horizontal axis.'},
    {t:'legend', items:[['err','minimum-distance bound, $M-1=7$'],
                        ['in','nearest-neighbour, $N_{\\min}=2$'],
                        ['mid','a single pairwise term']]}
  ]}
]},

{ id:'m4-intel', module:'M4', nav:'The intelligent bound', title:'The intelligent union bound',
  objective:'Tighten the union bound by dropping the points whose bisectors form no face of the region.',
  keywords:'intelligent union bound decision region faces neighbours tighter maximum likelihood',
  src:'CH9 s.59–60', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'The intelligent union bound'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The union bound adds one term for every other signal point. Look at what most of those points are doing. To land nearer a far-away point, the observation has to leave its own region first. And it leaves through a <b>face</b>: a piece of boundary shared with one particular neighbour. A point that shares no face with the region cannot be the first one reached.</p>'},
    {t:'note', kind:'def', head:'The set that matters', html:'Write $\\mathcal{N}(k)$ for the neighbours of $\\mathbf{s}_k$ whose perpendicular bisectors form the faces of the decision region $R_k$. These are the only points that bound the region, so they are the only ones an error has to cross.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Leaving $R_k$ means crossing at least one of its faces, so the union over the faces already covers every error. Summing over that smaller set is still an upper bound:</p>'},
      {t:'eq', key:true, label:'intelligent union bound', tex:'P(\\text{error}\\mid\\mathbf{s}_k)\\le\\sum_{j\\in\\mathcal{N}(k)}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)'},
      {t:'small', html:'This bound uses fewer terms than the full union bound. Each retained term represents a face that the observation can cross when it leaves the correct region.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'wex', head:'Four points in a square', rows:[
        ['Region','The top-right point decides for the whole first quadrant. That region has two faces: one shared with the point to its left, one with the point below.'],
        ['Dropped','The diagonal point shares no face. Its bisector is the line $\\psi_2=-\\psi_1$, which never touches the first quadrant.'],
        ['Bound','$P_e\\le 2Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$, where the union bound also carried $Q\\!\\left(\\sqrt{2d^{2}/2N_0}\\right)$.'],
        ['At $d^{2}/2N_0=9$','$2.70\\times10^{-3}$ against the union bound\'s $2.71\\times10^{-3}$ and the minimum-distance bound\'s $4.05\\times10^{-3}$.']
      ]}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Not the same statement as the nearest-neighbour form', html:'Here the two give the same expression, because both faces happen to sit at $d_{\\min}$. They still say different things. This one <em>counts faces</em> and is an upper bound, so a system built to it is safe. The nearest-neighbour form of the last scene <em>counts points at $d_{\\min}$</em> and is an approximation, so it can sit below the truth. They part company whenever a face is shared with a point further away than $d_{\\min}$. That face is a real way out of the region, and only this bound keeps it.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figRegions(
      [{x:1.2,y:1.2},{x:-1.2,y:1.2},{x:-1.2,y:-1.2},{x:1.2,y:-1.2}],
      {lim:2.6, over:a=>{
        /* the two faces of the first-quadrant region, and the bisector that
           bounds nothing — drawn from the geometry, not placed by hand */
        a.poly([[0,0],[0,2.6]], {color:C.h, width:3.4});
        a.poly([[0,0],[2.6,0]], {color:C.h, width:3.4});
        a.poly([[-1.95,1.95],[1.95,-1.95]], {color:C.muted, width:1.6, dash:'5 4'});
        a.note(0.16, 2.16, '\\text{face}', {tex:true, fs:12, color:C.h});
        a.note(-2.50, 1.55, '\\text{no face}', {tex:true, fs:12, color:C.muted});
      }}),
      caption:'The two solid boundaries are the faces of the top-right region, each shared with one neighbour. The dashed line is the bisector against the diagonal point: it separates two other regions and never touches this one, so the term the union bound spent on it was buying nothing.'}
  ]}
]},

{ id:'m4-ex-union', module:'M4', nav:'Worked example: the bound', title:'Worked example: the union bound',
  objective:'Apply the general union bound to a four-point constellation.',
  keywords:'worked example union bound four points square distances general form',
  src:'CH9 s.62–63', steps:2, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'Worked example: the union bound'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'wex', rows:[
      ['Given','Four equally likely points at $(\\pm d/2,\\,\\pm d/2)$: neighbouring points are $d$ apart, diagonal ones $d\\sqrt{2}$.'],
      ['Find','The symbol error probability from the general union bound.'],
      ['Method','Take one point, list its distances to the other three, and add one $Q$ for each. The constellation is symmetric, so every point gives the same answer and the average is that answer.']
    ]},
    {t:'reveal', at:1, items:[
      {t:'wex', rows:[
        ['Distances','From $\\mathbf{s}_1$: two neighbours at $d$ and one diagonal at $d\\sqrt{2}$, so the squared distances are $d^{2}$, $d^{2}$ and $2d^{2}$.']
      ]}
    ]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, tex:'P_e\\le 2\\,Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)+Q\\!\\left(\\sqrt{\\frac{2d^{2}}{2N_0}}\\right)'},
      {t:'small', html:'Three terms because there are three other points, and the third has a larger argument because its point is further away.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figRegions(
      [{x:1,y:1},{x:-1,y:1},{x:-1,y:-1},{x:1,y:-1}],{lim:2.4,w:380,h:250}),
      caption:'The constellation and its four regions. From any point, two neighbours share a boundary with it and the diagonal one does not.'}
  ]}
]},

{ id:'m4-ex-union-b', module:'M4', nav:'Worked example: the simpler forms', title:'Worked example: the two simpler forms',
  objective:'Compare the nearest-neighbour and minimum-distance forms with the general one.',
  keywords:'worked example nearest neighbour minimum distance comparison numbers',
  src:'CH9 s.64–65', steps:3, blocks:[
  {t:'eyebrow', text:'Module 4 · The union bound'},
  {t:'title', text:'Worked example: the two simpler forms'},
  {t:'lede', text:'The same constellation, with the two forms that are actually used, and the three answers side by side.'},
  {t:'reveal', at:1, items:[
    {t:'wex', rows:[
      ['Nearest neighbours','$d_{\\min}=d$, and each point has $N_{\\min}=2$ neighbours at that distance, so $$P_e\\approx 2\\,Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right).$$ This approximation omits the smaller diagonal term.'],
      ['Minimum-distance form','$M-1=3$, so $$P_e\\le 3\\,Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right),$$ which pretends the diagonal point is as close as the neighbours.']
    ]}
  ]},
  {t:'reveal', at:2, items:[
    {t:'wex', rows:[
      ['Check','Put $d^{2}/2N_0=9$, so $Q(3)=1.35\\times10^{-3}$ and $Q(4.243)=1.10\\times10^{-5}$. The three answers are $2.71\\times10^{-3}$, $2.70\\times10^{-3}$ and $4.05\\times10^{-3}$.']
    ]}
  ]},
  {t:'reveal', at:3, items:[
    {t:'note', kind:'ok', head:'The lesson', html:'The two useful forms differ by less than one per cent: the diagonal term is worth $0.4\\%$ and dropping it is safe. The loose form is half again too large. Pretending the diagonal point is a nearest neighbour adds a whole extra term at the smallest distance. All three are the same $Q$ with a different count in front, so none of them moves the curve sideways. The signal-to-noise ratio needed for a given error rate is almost the same whichever is used.'}
  ]}
]},

/* ---------------------------------------------------------------- 4.5 ---- */
{ id:'m4-synth', module:'M4', nav:'Summary', title:'What Module 4 established',
  objective:'Collect the results this module contributes.',
  keywords:'summary optimal receiver minimum distance union bound dmin nearest neighbours',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · Summary'},
  {t:'title', text:'What Module 4 established'},
  {t:'grid', cols:2, gap:'26px', items:[
    [{t:'card', head:'The receiver', items:[
      {t:'fig', svg:miniRule},
      {t:'eq', plain:true, tex:'\\hat{s}=\\arg\\max_i\\Bigl\\{\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i-\\tfrac{E_i}{2}+\\tfrac{N_0}{2}\\ln P(\\mathbf{s}_i)\\Bigr\\}'},
      {t:'small', html:'Correlate against each signal, correct for energy and prior, take the largest.'}
    ]}],
    [{t:'card', head:'The picture', items:[
      {t:'fig', svg:miniRegions},
      {t:'eq', plain:true, tex:'\\hat{s}=\\arg\\min_i\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}'},
      {t:'small', html:'Choose the nearest point. Boundaries are perpendicular bisectors; a less likely symbol gets a smaller region.'}
    ]}],
    [{t:'card', head:'Binary', items:[
      {t:'fig', svg:miniBinaryD},
      {t:'eq', plain:true, tex:'P_e=Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)'},
      {t:'small', html:'Two points, one distance, one $Q$ — everything Module 2 derived by integration follows in a line.'}
    ]}],
    [{t:'card', head:'M-ary', items:[
      {t:'fig', svg:miniUnion},
      {t:'eq', plain:true, tex:'P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)'},
      {t:'small', html:'The exact answer is an integral nobody can do; the bound keeps only the nearest neighbours.'}
    ]}]
  ]},
  {t:'note', kind:'ok', head:'What Module 5 does with this', html:'It applies the result to the constellations that are actually used: amplitude, phase and quadrature modulation. The question is which of them gets the largest $d_{\\min}$ for a given average energy and a given number of bits per symbol.'}
]}

];

window.SCENES_M4 = SC;
})();
