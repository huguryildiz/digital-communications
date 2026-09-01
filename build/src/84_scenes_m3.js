/* ==========================================================================
   Module 3 — Geometric representation of signal waveforms.

   The idea of the module in one sentence: a set of waveforms can be written as
   a set of points, and everything the receiver needs to know is in the picture
   those points make.

   The module is short and it is a change of language rather than a change of
   subject. Every scene says what is happening in ordinary words first.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* The three waveforms of the worked example, and the basis Gram-Schmidt finds
   for them. Drawn from their definitions so the figures and the arithmetic
   cannot drift apart. */
const S1 = t => (t>=0 && t<2) ? 1 : 0;
const S2 = t => (t>=2 && t<3) ? 1 : 0;
const S3 = t => (t>=0 && t<3) ? 1 : 0;
const PSI1 = t => S1(t)/Math.SQRT2;
const PSI2 = t => S2(t);

function figWave(f, name, colour, yr, small){
  const a = P.Axes({w:small?270:300,h:small?140:170,xr:[-0.2,3.4],yr:yr||[-0.3,1.4],
    xlabel:'t',ylabel:name,pad:{l:44,r:18,t:22,b:36},xtarget:4,ytarget:3});
  const pts=[]; for(let i=0;i<=680;i++){ const t=-0.2+3.6*i/680; pts.push([t,f(t)]); }
  a.poly(pts,{color:colour||C.in,width:2.1});
  return a.svg();
}

function figConstellation(pts, opts){
  opts = opts || {};
  const a = P.Axes({w:opts.w||520,h:opts.h||330,xr:opts.xr||[-0.6,2.0],yr:opts.yr||[-0.6,1.8],
    xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:54,r:26,t:28,b:44},xtarget:4,ytarget:4});
  pts.forEach(p=>{
    if(opts.dashTo!==false){
      a.poly([[p.x,0],[p.x,p.y]],{color:C.rule,width:1,dash:'3 4'});
      a.poly([[0,p.y],[p.x,p.y]],{color:C.rule,width:1,dash:'3 4'});
    }
    a.point(p.x,p.y,{color:p.c||C.in,r:6});
    a.note(p.x, p.y+0.16, p.l, {tex:true,fs:14,color:p.c||C.in,anchor:'middle'});
  });
  return a.svg();
}

/* ---- summary-card miniatures ----
   Each recalls the key figure of its section, stripped to the shape alone. */
function mini(w,h,xr,yr){ return P.Axes({w:w,h:h,xr:xr,yr:yr,pad:{l:10,r:10,t:8,b:8},
  xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}); }
function miniProject(){
  const a = mini(520,100,[-0.25,2.6],[-0.2,1.5]);
  a.poly([[0,0],[2.4,0]],{color:C.grid,width:1.4});
  a.poly([[0,0],[0,1.4]],{color:C.grid,width:1.4});
  a.poly([[0,0],[1.8,1.05]],{color:C.in,width:2.2});
  a.poly([[1.8,1.05],[1.8,0]],{color:C.rule,width:1.2,dash:'3 4'});
  a.poly([[1.8,1.05],[0,1.05]],{color:C.rule,width:1.2,dash:'3 4'});
  a.point(1.8,1.05,{color:C.in,r:4.5});
  return a.svg();
}
function miniInner(){
  const a = mini(520,100,[-0.25,2.6],[-0.2,1.5]);
  a.poly([[0,0],[2.3,0.35]],{color:C.in,width:2.2});
  a.poly([[0,0],[1.2,1.3]],{color:C.out,width:2.2});
  a.point(2.3,0.35,{color:C.in,r:4.5}); a.point(1.2,1.3,{color:C.out,r:4.5});
  return a.svg();
}
function miniGS(){
  const a = mini(520,100,[-0.25,2.6],[-0.2,1.5]);
  a.poly([[0,0],[2.2,1.2]],{color:C.in,width:2.2});
  a.poly([[0,0],[2.2,0]],{color:C.rule,width:1.6,dash:'3 4'});
  a.poly([[2.2,0],[2.2,1.2]],{color:C.h,width:2.2});
  a.point(2.2,1.2,{color:C.in,r:4.5});
  return a.svg();
}
function miniNearest(){
  const a = mini(520,100,[-1.4,1.4],[-1.15,1.15]);
  a.rect(-1.4,-1.15,0,0,{fill:C.dec.in}); a.rect(0,-1.15,1.4,0,{fill:C.dec.out});
  a.rect(-1.4,0,0,1.15,{fill:C.dec.mid}); a.rect(0,0,1.4,1.15,{fill:C.dec.h});
  a.poly([[0,-1.15],[0,1.15]],{color:C.grid,width:1.2});
  a.poly([[-1.4,0],[1.4,0]],{color:C.grid,width:1.2});
  [[-0.7,-0.55],[0.7,-0.55],[-0.7,0.55],[0.7,0.55]].forEach(p=>a.point(p[0],p[1],{color:C.ink,r:4}));
  return a.svg();
}

const SC = [

/* ---------------------------------------------------------------- 3.0 ---- */
{ id:'m3-open', module:'M3', nav:'Why one axis is not enough', title:'Multiple signal-space axes',
  objective:'Show the problem two unrelated waveforms create for the Module 2 receiver.',
  keywords:'geometric representation two matched filters basis signal space opening',
  src:'CH9 s.2–3', steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Opening'},
  {t:'title', text:'Multiple signal-space axes'},
  {t:'lede', text:'In Module 2 the two waveforms were opposites, so one shape represented both and the receiver needed one number. What happens when neither waveform is a multiple of the other?'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Take $s_0(t)$ and $s_1(t)$ below. Neither is a multiple of the other, so no single function $\\psi(t)$ can write both as $s_m\\psi(t)$. The receiver of Module 2 does not apply, and none of its results do either.</p>'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Use <b>two</b> axes to represent these waveforms. The receiver computes one coordinate on each axis and then works with the two resulting numbers.</p>'},
      {t:'note', kind:'def', head:'Geometric representation', html:'A set of waveforms can be represented by a set of <b>points</b>. The receiver can then use geometry. For equally likely signals in white Gaussian noise, it selects the nearest signal point.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Coordinate calculations', html:'Waveform analysis requires integrals. Point analysis uses arithmetic on coordinates. This module gives the conversion. Modules 4 and 5 use the resulting geometry.'}
    ]}
  ], right:[
    {t:'grid', cols:2, gap:'20px', items:[
      [{t:'fig', frame:true, svg:()=>figWave(t=>(t>=0&&t<1.5)?1:(t<3?-1:0),'s_0(t)',C.in,[-1.5,1.5]),
        caption:'$s_0(t)$: positive for the first half of the interval, negative for the second.'}],
      [{t:'fig', frame:true, svg:()=>figWave(t=>(t>=0&&t<0.75)?1:(t<2.25?-1:(t<3?1:0)),'s_1(t)',C.out,[-1.5,1.5]),
        caption:'$s_1(t)$: three pieces rather than two. It is not a multiple of $s_0$.'}]
    ]},
    {t:'fig', frame:true, svg:()=>P.blocks({w:600,h:200,items:[
      {t:'arrow',x1:20,y1:100,x2:110,y2:100},
      {t:'box',x:110,y:20,w:200,h:60,label:'matched to s_0(t)',tex:true,fs:14},
      {t:'box',x:110,y:120,w:200,h:60,label:'matched to s_1(t)',tex:true,fs:14},
      {t:'line',d:'M65,100 v-50 h45'}, {t:'line',d:'M65,100 v50 h45'},
      {t:'arrow',x1:310,y1:50,x2:400,y2:50},
      {t:'arrow',x1:310,y1:150,x2:400,y2:150},
      {t:'text',x:22,y:78,label:'x(t)',tex:true,fs:15,anchor:'start'},
      {t:'text',x:445,y:56,label:'y_1',tex:true,fs:15},
      {t:'text',x:445,y:156,label:'y_2',tex:true,fs:15}
    ]}), caption:'Two filters, two numbers. The pair $(y_1,y_2)$ is a point in a plane, and that plane is what the module is about.'}
  ]}
]},

/* ---------------------------------------------------------------- 3.1 ---- */
{ id:'m3-ortho', module:'M3', nav:'An orthonormal basis', title:'An orthonormal basis',
  objective:'Define an orthonormal basis for signals by analogy with vectors.',
  keywords:'orthonormal basis inner product norm orthogonal unit energy functions',
  src:'CH9 s.4–5', steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'An orthonormal basis'},
  {t:'lede', text:'Everything in this section is one analogy. A vector is a list of numbers because it has been written against a set of axes. A signal can be a list of numbers for exactly the same reason.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p><b>For vectors.</b> With unit axes $\\mathbf{e}_1,\\ldots,\\mathbf{e}_N$, any $\\mathbf{a}$ is $\\sum_k a_k\\mathbf{e}_k$, and two operations do all the work:</p>'},
    {t:'eq', tex:'\\langle\\mathbf{a},\\mathbf{b}\\rangle=\\sum_{k=1}^{N}a_kb_k,\\qquad \\|\\mathbf{a}\\|=\\sqrt{\\langle\\mathbf{a},\\mathbf{a}\\rangle}'},
    {t:'small', html:'The axes are <b>orthonormal</b>: each has unit length and each is perpendicular to all the others, $\\langle\\mathbf{e}_i,\\mathbf{e}_j\\rangle=0$ for $i\\ne j$.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p><b>For signals.</b> The inner product of two signals is the integral of their product, and everything else follows unchanged:</p>'},
      {t:'eq', key:true, tex:'\\langle x,y\\rangle=\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Orthonormal signal set', html:'A set $\\{\\psi_1,\\ldots,\\psi_N\\}$ is orthonormal when $$\\int_{-\\infty}^{\\infty}\\psi_j(t)\\psi_k(t)\\,dt=\\begin{cases}1,&j=k\\\\0,&j\\ne k.\\end{cases}$$ The first line gives <b>unit energy</b>. The second line makes each pair <b>orthogonal</b>.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Read it in plain words', html:'"Orthogonal" for signals means the same thing it means for arrows: the two have nothing of each other in them. If you multiply them together and add up the result over all time, you get zero. Two non-overlapping pulses are the clearest case — where one is non-zero the other is zero, so their product is zero everywhere.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:460,h:240,xr:[-0.4,1.9],yr:[-0.4,1.6],
        xlabel:'\\mathbf{e}_1',ylabel:'\\mathbf{e}_2',pad:{l:52,r:24,t:26,b:42},xtarget:4,ytarget:3});
      a.poly([[0,0],[1.5,0.9]],{color:C.in,width:2.4});
      a.poly([[1.5,0],[1.5,0.9]],{color:C.rule,width:1,dash:'3 4'});
      a.poly([[0,0.9],[1.5,0.9]],{color:C.rule,width:1,dash:'3 4'});
      a.point(1.5,0.9,{color:C.in,r:5});
      a.note(1.5,1.06,'\\mathbf{a}=(a_1,a_2)',{tex:true,fs:14,color:C.in,anchor:'middle'});
      a.note(0.72,-0.22,'a_1',{tex:true,fs:13,color:C.muted,anchor:'middle'});
      a.note(-0.3,0.86,'a_2',{tex:true,fs:13,color:C.muted});
      return a.svg();
    }, caption:'A vector is a list of numbers because it has been written against axes. Its length and its angle to another vector are computed from that list and nothing else.'},
    {t:'grid', cols:2, gap:'18px', items:[
      [{t:'fig', svg:()=>figWave(PSI1,'\\psi_1(t)',C.in,null,true), caption:'$\\psi_1$: height $1/\\sqrt{2}$ on $[0,2]$, so its energy is $1$.'}],
      [{t:'fig', svg:()=>figWave(PSI2,'\\psi_2(t)',C.h,null,true), caption:'$\\psi_2$: height $1$ on $[2,3]$, energy $1$. It never overlaps $\\psi_1$, so the two are orthogonal.'}]
    ]}
  ]}
]},

{ id:'m3-project', module:'M3', nav:'Coordinates', title:'The coordinates of a waveform',
  objective:'Give the projection formula and the property that makes it useful.',
  keywords:'projection coordinates synthesis analysis inner product preserved key property',
  src:'CH9 s.6–8', steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'The coordinates of a waveform'},
  {t:'lede', text:'How a waveform becomes a list of numbers.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Once the axes are fixed, a signal is written against them the same way a vector is:'},
    {t:'eq', key:true, label:'analysis', tex:'s_{ij}=\\int_{0}^{T}s_i(t)\\,\\psi_j(t)\\,dt'},
    {t:'eq', key:true, label:'synthesis', tex:'s_i(t)=\\sum_{j=1}^{N}s_{ij}\\,\\psi_j(t)'},
    {t:'small', html:'The first line takes a waveform apart into $N$ numbers. The second builds it back. The list $\\mathbf{s}_i=(s_{i1},\\ldots,s_{iN})$ is the <b>signal vector</b>.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The property that makes this worth doing', html:'Inner products survive the translation. If $x$ has coordinates $\\mathbf{x}$ and $y$ has coordinates $\\mathbf{y}$, then $$\\int_{-\\infty}^{\\infty}x(t)y(t)\\,dt=\\sum_{k=1}^{N}x_ky_k=\\langle\\mathbf{x},\\mathbf{y}\\rangle.$$'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'small', html:'<b>Why.</b> Expand both sums, exchange the integral and the sums, and use orthonormality. Every cross term $\\int\\psi_j\\psi_k$ with $j\\ne k$ is zero, and every term with $j=k$ is one. What is left is $\\sum_k x_ky_k$.'},
      {t:'body', html:'An integral over waveforms has become a sum over $N$ numbers.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Receiver calculations', html:'The coordinate representation preserves the waveforms. The receiver calculates $N$ integrals once. It then calculates energies, distances, decisions, and error probabilities from the $N$ coordinates.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>P.blocks({w:620,h:270,items:[
      {t:'arrow',x1:20,y1:70,x2:120,y2:70},
      {t:'box',x:120,y:38,w:210,h:64,label:'\\int_0^T(\\cdot)\\,\\psi_1(t)\\,dt',tex:true,fs:15},
      {t:'arrow',x1:330,y1:70,x2:420,y2:70},
      {t:'arrow',x1:20,y1:190,x2:120,y2:190},
      {t:'box',x:120,y:158,w:210,h:64,label:'\\int_0^T(\\cdot)\\,\\psi_2(t)\\,dt',tex:true,fs:15},
      {t:'arrow',x1:330,y1:190,x2:420,y2:190},
      {t:'text',x:65,y:56,label:'s_i(t)',tex:true,fs:15},
      {t:'text',x:65,y:176,label:'s_i(t)',tex:true,fs:15},
      {t:'text',x:466,y:76,label:'s_{i1}',tex:true,fs:15},
      {t:'text',x:466,y:196,label:'s_{i2}',tex:true,fs:15},
      {t:'text',x:225,y:250,label:'the analyser: one integral per axis',fs:12.5}
    ]}), caption:'The analyzer calculates one coordinate for each basis function. The synthesizer uses the coordinates to reconstruct the waveform.'}
  ]}
]},

{ id:'m3-energy', module:'M3', nav:'Energy and distance', title:'Energy and distance',
  objective:'Identify energy with squared norm and signal difference with Euclidean distance.',
  keywords:'energy squared norm euclidean distance constellation L2 norm',
  src:'CH9 s.11–12', steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'Energy and distance'},
  {t:'lede', text:'Signal energy is squared length. The energy of a signal difference is squared distance.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Put $y=x$ in the property of the last scene and the energy of a signal is the squared length of its vector:'},
    {t:'eq', key:true, tex:'E_{s_i}=\\int_0^{T}s_i^{2}(t)\\,dt=\\sum_{j=1}^{N}s_{ij}^{2}=\\|\\mathbf{s}_i\\|^{2}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Apply it to the difference of two signals and the energy of the difference is the squared distance between the two points:'},
      {t:'eq', key:true, tex:'\\|\\mathbf{s}_i-\\mathbf{s}_k\\|^{2}=\\int_0^{T}\\bigl(s_i(t)-s_k(t)\\bigr)^{2}dt=\\sum_{j=1}^{N}(s_{ij}-s_{kj})^{2}'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Energy and distance', html:'<b>Energy is the squared distance from a signal point to the origin.</b> <b>Distance between signal points controls their probability of confusion.</b> Antipodal signaling gains $3$ dB over on-off signaling at the same average energy. Module 4 derives the general rule.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:520,h:340,xr:[-1.6,1.6],yr:[-1.6,1.6],
        xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:54,r:26,t:28,b:44},xtarget:4,ytarget:4});
      const pts=[[1,1,C.in,'\\mathbf{s}_1'],[1,-1,C.out,'\\mathbf{s}_2'],[-1,-1,C.mid,'\\mathbf{s}_3'],[-1,1,C.h,'\\mathbf{s}_4']];
      pts.forEach(([x,y,c,l])=>{ a.poly([[0,0],[x,y]],{color:c,width:1.4,dash:'4 4'});
        a.point(x,y,{color:c,r:6}); a.note(x,y+(y>0?0.2:-0.32),l,{tex:true,fs:14,color:c,anchor:'middle'}); });
      a.poly([[1,1],[1,-1]],{color:C.err,width:2});
      a.note(1.12,0,'d=2',{tex:true,fs:13,color:C.err});
      return a.svg();
    }, caption:'Four points, each at distance $\\sqrt{2}$ from the origin, so all four waveforms carry energy $2$. The nearest pair are $2$ apart, and it is that number, not the energy, that sets how often they are confused.'}
  ]}
]},

/* ---------------------------------------------------------------- 3.2 ---- */
{ id:'m3-constellation', module:'M3', nav:'The constellation', title:'The constellation diagram',
  objective:'Define the constellation and read energy and distance from it.',
  keywords:'constellation diagram signal space points energy distance qpsk',
  src:'CH9 s.11', steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations'},
  {t:'title', text:'The constellation diagram'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'note', kind:'def', head:'Constellation diagram', html:'The picture of the signal vectors in the space their basis spans. One point per waveform, one axis per basis function. Nothing else is in the picture, and nothing else is needed.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Three things are read directly off it:</p><ul><li>The <b>distance from the origin</b> to a point is $\\sqrt{E_i}$, the square root of that waveform\'s energy.</li><li>The <b>distance between two points</b> is the square root of the energy of their difference.</li><li>The <b>number of axes</b> is how many matched filters the receiver needs.</li></ul>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'A picture is not a waveform', html:'Different waveform sets can produce the same constellation. In the white Gaussian noise model, equal constellations have equal coherent-detection error performance. Their bandwidth and implementation can still differ. The next module derives the receiver result.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figConstellation(
      [{x:1,y:1,c:C.in,l:'\\mathbf{s}_1'},{x:1,y:-1,c:C.out,l:'\\mathbf{s}_2'},
       {x:-1,y:-1,c:C.mid,l:'\\mathbf{s}_3'},{x:-1,y:1,c:C.h,l:'\\mathbf{s}_4'}],
      {xr:[-1.7,1.7],yr:[-1.7,1.7],dashTo:false}),
      caption:'Four equal-energy points form a square. Each point is $\\sqrt{2}$ from the origin, so each signal has energy $2$. The nearest-neighbor distance is $2$.'}
  ]}
]},

/* ---------------------------------------------------------------- 3.3 ---- */
{ id:'m3-gs', module:'M3', nav:'Gram–Schmidt', title:'The Gram–Schmidt procedure',
  objective:'State the Gram–Schmidt procedure as three repeated steps.',
  keywords:'gram schmidt orthogonalization procedure basis normalise subtract remainder',
  src:'CH9 s.16–18', steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Gram–Schmidt'},
  {t:'title', text:'The Gram–Schmidt procedure'},
  {t:'lede', text:'The axes have been assumed so far. Gram–Schmidt is the recipe that produces them from any set of waveforms, and it is three steps repeated until there is nothing left.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p><b>The first axis is the first signal, scaled to unit energy.</b></p>'},
    {t:'eq', tex:'E_1=\\int s_1^{2}(t)\\,dt,\\qquad \\psi_1(t)=\\frac{s_1(t)}{\\sqrt{E_1}},\\qquad s_{11}=\\sqrt{E_1}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p><b>Every later axis is what is left of the next signal after the axes already found are taken out of it.</b> For $s_k$:</p>'},
      {t:'eq', key:true, tex:'g_k(t)=s_k(t)-\\sum_{i=1}^{k-1}s_{ki}\\,\\psi_i(t),\\qquad s_{ki}=\\int s_k(t)\\psi_i(t)\\,dt'},
      {t:'eq', tex:'E_{g_k}=\\int g_k^{2}(t)\\,dt,\\qquad \\psi_k(t)=\\frac{g_k(t)}{\\sqrt{E_{g_k}}}'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'The step that ends it', html:'If $g_k(t)=0$, that signal was already a combination of the axes found so far and <b>no new axis is added</b>. The procedure stops when every signal has been used. The number of axes $N$ is at most the number of signals $M$, and often fewer.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'The order matters, the answer does not', html:'Starting from a different signal gives a different set of axes. It gives the same number of them, the same energies and the same distances. The constellation is the same picture seen from a different angle, and every result that depends only on distances is unchanged.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:520,h:340,xr:[-0.4,2.0],yr:[-0.4,1.7],
        xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:54,r:26,t:28,b:44},xtarget:4,ytarget:4});
      a.poly([[0,0],[1.7,0]],{color:C.in,width:2.2});
      a.poly([[0,0],[1.2,1.3]],{color:C.out,width:2.2});
      a.poly([[1.2,0],[1.2,1.3]],{color:C.mid,width:2.2,dash:'5 4'});
      a.poly([[0,0],[1.2,0]],{color:C.h,width:2.2});
      a.note(1.62,0.14,'\\psi_1',{tex:true,fs:14,color:C.in,anchor:'middle'});
      a.note(1.24,1.44,'s_2',{tex:true,fs:14,color:C.out,anchor:'middle'});
      a.note(1.32,0.62,'g_2',{tex:true,fs:14,color:C.mid});
      a.note(0.6,0.14,'s_{21}\\psi_1',{tex:true,fs:13,color:C.h,anchor:'middle'});
      return a.svg();
    }, caption:'The second Gram–Schmidt step. Subtract the component of $s_2$ along $\\psi_1$. The remainder $g_2$ is perpendicular to $\\psi_1$. Normalizing $g_2$ gives the second axis.'}
  ]}
]},

{ id:'m3-ex-gs', module:'M3', nav:'Worked example: Gram–Schmidt', title:'Worked example: three pulses, two axes',
  objective:'Run the procedure on three waveforms and draw the constellation.',
  keywords:'worked example gram schmidt three signals two basis functions constellation',
  src:'CH9 s.19–21', steps:4, blocks:[
  {t:'eyebrow', text:'Module 3 · Gram–Schmidt'},
  {t:'title', text:'Worked example: three pulses, two axes'},
  {t:'cols', ratio:'c-6-6', vcenter:false, left:[
    {t:'wex', rows:[
      ['Given','$s_1(t)=1$ on $[0,2]$; $s_2(t)=1$ on $[2,3]$; $s_3(t)=1$ on $[0,3]$; each zero elsewhere.'],
      ['Find','An orthonormal basis, the three signal vectors, and the constellation.']
    ]},
    {t:'reveal', at:1, items:[
      {t:'wex', rows:[
        ['Step 1','$E_1=\\int_0^{2}1^{2}dt=2$, so $\\psi_1(t)=\\dfrac{1}{\\sqrt{2}}$ on $[0,2]$ and $s_{11}=\\sqrt{2}$.']
      ]}
    ]},
    {t:'reveal', at:2, items:[
      {t:'wex', rows:[
        ['Step 2','$s_{21}=\\int s_2\\psi_1\\,dt=0$, because $s_2$ and $\\psi_1$ never overlap. So $g_2=s_2$, $E_{g_2}=1$, and $\\psi_2(t)=s_2(t)=1$ on $[2,3]$.']
      ]}
    ]},
    {t:'reveal', at:3, items:[
      {t:'wex', rows:[
        ['Step 3','$s_{31}=\\int_0^{2}1\\cdot\\tfrac{1}{\\sqrt{2}}dt=\\sqrt{2}$ and $s_{32}=\\int_2^{3}1\\cdot1\\,dt=1$. Then $$g_3=s_3-\\sqrt{2}\\,\\psi_1-1\\cdot\\psi_2=0,$$ so <b>no third axis</b>: $s_3$ was already a combination of the two.'],
        ['Vectors','$\\mathbf{s}_1=(\\sqrt{2},\\,0)$, $\\;\\mathbf{s}_2=(0,\\,1)$, $\\;\\mathbf{s}_3=(\\sqrt{2},\\,1)$.']
      ]}
    ]},
    {t:'reveal', at:4, items:[
      {t:'wex', rows:[
        ['Check','The vectors have energies $2$, $1$, and $3$. The corresponding waveform integrals give the same values. This agreement confirms that signal energy equals squared vector length.']
      ]},
      {t:'note', kind:'ok', head:'Read the answer', html:'Three waveforms needed only two axes, because the third was the sum of the other two. $s_3=s_1+s_2$ is visible in the pictures before any integral is computed. The receiver needs two matched filters, not three.'}
    ]}
  ], right:[
    {t:'grid', cols:3, gap:'14px', items:[
      [{t:'fig', svg:()=>figWave(S1,'s_1(t)',C.in), caption:'$s_1$'}],
      [{t:'fig', svg:()=>figWave(S2,'s_2(t)',C.out), caption:'$s_2$'}],
      [{t:'fig', svg:()=>figWave(S3,'s_3(t)',C.mid), caption:'$s_3=s_1+s_2$'}]
    ]},
    {t:'fig', frame:true, svg:()=>figConstellation(
      [{x:Math.SQRT2,y:0,c:C.in,l:'\\mathbf{s}_1'},{x:0,y:1,c:C.out,l:'\\mathbf{s}_2'},
       {x:Math.SQRT2,y:1,c:C.mid,l:'\\mathbf{s}_3'}]),
      caption:'The constellation. Two axes carry three signals, and the picture shows at a glance that $\\mathbf{s}_3$ is $\\mathbf{s}_1+\\mathbf{s}_2$.'}
  ]}
]},

{ id:'m3-lab-f', module:'M3', nav:'Laboratory F', title:'Laboratory F · From waveform to basis',
  objective:'Let the reader change the waveform set and watch the basis and the constellation follow.',
  keywords:'laboratory gram schmidt basis constellation waveform set dimension',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Gram–Schmidt'},
  {t:'title', text:'Laboratory F · From waveform to basis'},
  {t:'body', html:'Choose a set of waveforms and watch the procedure run on it. It shows the basis functions it produces, how many there are, and where the signals land. Reorder the set and the axes change while the constellation keeps its shape.'},
  {t:'lab', id:'F'}
]},

{ id:'m3-remarks', module:'M3', nav:'What the geometry decides', title:'Results determined by geometry',
  objective:'State what the constellation determines and what it leaves open.',
  keywords:'remarks same geometry different waveforms performance receiver structure bandwidth',
  src:'CH9 s.15', steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations'},
  {t:'title', text:'Results determined by geometry'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'note', kind:'def', head:'Geometric equivalence', html:'<ol><li>Different waveform sets can have the same constellation.</li><li>The constellation determines receiver structure and error performance.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Put together: if two signal sets give the same constellation, they have the same error probability and the same receiver. Nothing about the waveforms themselves survives into the answer.</p>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Bandwidth', html:'The constellation does not determine bandwidth. Two waveform sets with the same constellation can use different bandwidths. Geometry determines receiver performance, while the waveform shape determines bandwidth.'}
    ]}
  ], right:[
    {t:'grid', cols:2, gap:'18px', items:[
      [{t:'fig', frame:true, svg:()=>figWave(t=>(t>=0&&t<1.5)?1:(t<3?-1:0),'s_a(t)',C.in,[-1.5,1.5]),
        caption:'One waveform set: two rectangular pieces.'}],
      [{t:'fig', frame:true, svg:()=>figWave(t=>(t>=0&&t<3)?Math.sqrt(2/3)*1.22*Math.cos(2*Math.PI*t/3):0,'s_b(t)',C.out,[-1.5,1.5]),
        caption:'Another: one cycle of a cosine. It has the same energy, and against a basis of its own it is the same single point.'}]
    ]},
    {t:'fig', frame:true, svg:()=>figConstellation(
      [{x:1.4,y:0,c:C.in,l:'\\text{both}'}],{w:500,h:200,xr:[-1.8,1.8],yr:[-0.5,0.7],dashTo:false}),
      caption:'One dimension, one point each. A receiver built for either is built for both.'}
  ]}
]},

/* ---------------------------------------------------------------- 3.4 ---- */
{ id:'m3-synth', module:'M3', nav:'Summary', title:'Module 3 summary',
  objective:'Collect the translation this module provides.',
  keywords:'summary basis coordinates energy distance constellation gram schmidt',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Summary'},
  {t:'title', text:'Module 3 summary'},
  {t:'grid', cols:2, gap:'26px', items:[
    [{t:'card', head:'The translation', items:[
      {t:'fig', svg:miniProject},
      {t:'eq', plain:true, tex:'s_{ij}=\\int_0^T s_i\\psi_j\\,dt,\\quad s_i(t)=\\sum_j s_{ij}\\psi_j(t)'},
      {t:'small', html:'Integrate against each basis function to calculate the coordinates. Add the scaled basis functions to reconstruct the waveform.'}
    ]}],
    [{t:'card', head:'Preserved quantities', items:[
      {t:'fig', svg:miniInner},
      {t:'eq', plain:true, tex:'\\int xy\\,dt=\\langle\\mathbf{x},\\mathbf{y}\\rangle,\\quad E_i=\\|\\mathbf{s}_i\\|^{2}'},
      {t:'small', html:'Inner products — and therefore energies and distances. Everything the receiver needs is one of those.'}
    ]}],
    [{t:'card', head:'Finding the axes', items:[
      {t:'fig', svg:miniGS},
      {t:'eq', plain:true, tex:'g_k=s_k-\\textstyle\\sum_{i<k}s_{ki}\\psi_i,\\quad \\psi_k=g_k/\\sqrt{E_{g_k}}'},
      {t:'small', html:'Gram–Schmidt: subtract what is already known, normalise the remainder. A zero remainder adds no axis.'}
    ]}],
    [{t:'card', head:'Receiver decision', items:[
      {t:'fig', svg:miniNearest},
      {t:'small', html:'Module 4 computes the coordinates of what arrives and picks the nearest point. The error probability then depends on the distances, and on nothing else.'}
    ]}]
  ]},
  {t:'note', kind:'ok', head:'Main result', html:'An orthonormal basis converts each signal into coordinates. Signal energy is squared vector length. The energy of a signal difference is squared distance.'}
]}

];

window.SCENES_M3 = SC;
})();
