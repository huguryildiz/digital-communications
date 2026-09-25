/* Course notes — Chapter 4. Every slide scene of Module 4 except the laboratory
   appears here, in slide order (build/src/85_scenes_m4.js). The opening slide is
   the chapter lead, each teaching slide is one h3, the two worked-example slides
   are Examples 4.1 and 4.2, and the summary slide is the summary section. The
   four miniatures on the summary slide repeat figures drawn earlier in the
   chapter, so the summary carries their results without them. Every figure is
   drawn from the same data as the slide figure it stands for. */
(function(){
const P=PLOT, C=P.COL;

function Qf(x){ const t=1/(1+0.2316419*Math.abs(x));
  const d=0.3989422804014327*Math.exp(-x*x/2);
  const p=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0?p:1-p; }
function rng(s){let a=s>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function gauss(s,n,sd){const r=rng(s),o=[];for(let i=0;i<n;i++){const u=Math.max(1e-12,r()),v=r();
  o.push(sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v));}return o;}
/* A slide figure is drawn for a column of the stage; on the page it is set
   narrower than the text so that its labels keep a readable size. */
const narrow=(svg,pct)=>svg.replace(/^<svg /,`<svg style="max-width:${pct}%;margin:0 auto" `);

/* A constellation and its decision regions, found by the nearest-point rule on
   a grid, with an optional cloud of observations around the first point. The
   same drawing as the slides' figRegions. */
const REGCOL=[C.dec.in,C.dec.out,C.dec.mid,C.dec.h,C.dec.err];
const PTCOL =[C.in,C.out,C.mid,C.h,C.err];
function regions(pts,opts){
  opts=opts||{};
  const lim=opts.lim||2.2, n=72, w=opts.w||420;
  /* The plot area is square unless a height is given, so that a bisector
     drawn on the page is perpendicular to the pair it separates. */
  const a=P.Axes({w:w,h:opts.h||(w-76+68),xr:[-lim,lim],yr:[-lim,lim],
    xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:52,r:24,t:26,b:42},xtarget:4,ytarget:4});
  const step=2*lim/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x=-lim+(i+0.5)*step, y=-lim+(j+0.5)*step;
    let best=0,bd=Infinity;
    pts.forEach((p,k)=>{const d=(x-p[0])**2+(y-p[1])**2-(p[2]||0); if(d<bd){bd=d;best=k;}});
    a.rect(x-step/2,y-step/2,x+step/2,y+step/2,{fill:REGCOL[best%REGCOL.length]});
  }
  if(opts.cloud){ const nz=gauss(20260802,2*opts.cloud,opts.sigma||0.32);
    for(let i=0;i<opts.cloud;i++)
      a.point(pts[0][0]+nz[2*i],pts[0][1]+nz[2*i+1],{color:C.noise,r:1.7,ring:'none'}); }
  pts.forEach((p,k)=>a.point(p[0],p[1],{color:PTCOL[k%PTCOL.length],r:6}));
  if(opts.over) opts.over(a);
  return a.svg();
}
const SQ=[[1,1],[-1,1],[-1,-1],[1,-1]], SQ12=[[1.2,1.2],[-1.2,1.2],[-1.2,-1.2],[1.2,-1.2]];

/* m4-observe: the bank of N correlators. */
const figBank=()=>narrow(P.blocks({w:620,h:300,items:[
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
]}),62);

/* m4-noise: eight hundred draws of a two-dimensional noise vector. */
function figNoise(){
  const a=P.Axes({w:420,h:412,xr:[-2.4,2.4],yr:[-2.4,2.4],
    xlabel:'n_1',ylabel:'n_2',pad:{l:52,r:24,t:26,b:42},xtarget:4,ytarget:4});
  const nz=gauss(20260802,1600,0.62);
  for(let i=0;i<800;i++) a.point(nz[2*i],nz[2*i+1],{color:C.noise,r:1.9,ring:'none'});
  [1,2,3].forEach(k=>{ const pts=[]; for(let i=0;i<=200;i++){ const th=2*Math.PI*i/200;
    pts.push([k*0.62*Math.cos(th),k*0.62*Math.sin(th)]); }
    a.poly(pts,{color:C.muted,width:1,dash:'4 4'}); });
  return narrow(a.svg(),46);
}

/* m4-mindist: the distance the detector minimises. */
function figDist(){
  const a=P.Axes({w:480,h:340,xr:[-0.4,2.6],yr:[-0.4,2.4],
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
  return narrow(a.svg(),58);
}

/* m4-metric: the correlation receiver. */
const figReceiver=()=>narrow(P.blocks({w:620,h:320,items:[
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
]}),66);

/* m4-binary: the two densities along the line joining the points. */
function figBinary(){
  const a=P.Axes({w:520,h:300,xr:[-2.6,2.6],yr:[-0.06,0.8],
    xlabel:'\\text{position along the line joining the two points}',ylabel:'f',
    pad:{l:54,r:26,t:26,b:46},xtarget:5,ytarget:4});
  const s=0.62;
  const g=(y,m)=>Math.exp(-(y-m)*(y-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
  a.rect(-2.6,0,0,0.70,{fill:C.dec.err}); a.rect(0,0,2.6,0.70,{fill:C.dec.in});
  a.area(y=>g(y,-1),0,2.6,{color:C.dec.err,stroke:C.err});
  a.curve(y=>g(y,-1),{color:C.err,width:2.2});
  a.curve(y=>g(y, 1),{color:C.in, width:2.2});
  a.vline(0,{color:C.ink,dash:'5 4',width:1.6});
  a.point(-1,0,{color:C.err,r:6}); a.point(1,0,{color:C.in,r:6});
  a.span(-1,1,0.72,null,{color:C.muted});
  a.note(0.12,0.745,'d',{tex:true,fs:13,color:C.muted});
  return narrow(a.svg(),60);
}

/* m4-dmin: two bounds for 8-PSK. d_min^2 = 4 Es sin^2(pi/8), Es = 3 Eb,
   N_min = 2, M-1 = 7. */
function figPSKBounds(){
  const a=P.Axes({w:520,h:320,xr:[0,16],yr:[-7,-0.02],
    xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_e',ytickfmt:P.decade,yticksOverride:P.decades(-7,-1),zeroAxes:false,
    pad:{l:58,r:26,t:26,b:44},xtarget:6,ytarget:6});
  const arg=d=>Math.sqrt(3*Math.pow(10,d/10)*4*Math.pow(Math.sin(Math.PI/8),2)/2);
  const cl=v=>Math.log10(Math.max(1e-12,v));
  a.curve(d=>cl(7*Qf(arg(d))),{color:C.err,width:2.2});
  a.curve(d=>cl(2*Qf(arg(d))),{color:C.in,width:2.2});
  a.curve(d=>cl(1*Qf(arg(d))),{color:C.muted,width:1.5,dash:'5 4'});
  return narrow(a.svg(),56);
}

/* m4-intel: the two faces of the first-quadrant region, and the bisector
   that bounds nothing. */
const figFaces=()=>narrow(regions(SQ12,{lim:2.6,over:a=>{
  a.poly([[0,0],[0,2.6]],{color:C.h,width:3.4});
  a.poly([[0,0],[2.6,0]],{color:C.h,width:3.4});
  a.poly([[-1.95,1.95],[1.95,-1.95]],{color:C.muted,width:1.6,dash:'5 4'});
  a.note(0.16,2.16,'\\text{face}',{tex:true,fs:12,color:C.h});
  a.note(-2.50,1.55,'\\text{no face}',{tex:true,fs:12,color:C.muted});
}}),38);

window.C4 = [

{t:'h1', num:'CHAPTER 4', text:'The optimal receiver in additive white Gaussian noise'},

/* m4-open */
{t:'p', lead:true, text:'A transmitter sends one of $M$ signals. The channel adds noise. The receiver observes the sum and identifies the transmitted signal. Chapter 3 represented the signals as points. This chapter derives a decision rule for those points.'},
{t:'p', text:'Write what arrives as a signal plus noise.'},
{t:'eq', tex:'r(t)=s_i(t)+n(t),\\qquad 0<t<T'},
{t:'p', text:'Here $n(t)$ is white Gaussian noise of two-sided density $N_0/2$. The receiver knows the $M$ possible signals. It does not know which one was sent, and it can only choose.'},
{t:'box', kind:'ok', hd:'Decision rule', html:'For equally likely signals, calculate the coordinates of the received waveform. Then select the nearest signal point. This rule minimizes the probability of error.'},
{t:'p', text:'Two results follow under this white Gaussian noise model.'},
{t:'ul', items:[
 'The coherent-detection error probability depends on the <b>distances</b> between the signal points.',
 'The exact error probability requires an integral over the decision regions. This integral usually has no simple closed form. The <b>union bound</b> gives a computable upper bound made of $Q$ functions.'
]},
{t:'fig', svg:()=>narrow(regions(SQ,{cloud:260,sigma:0.34}),36),
 cap:'Four signal points, the regions the rule assigns to each, and a cloud of what the receiver observes when the first point is sent. Most of the cloud is in the right region. The part outside it is the error probability.',
 short:'Four signal points, their decision regions and a cloud of observations.'},

/* ================================================================ 4.1 ==== */
{t:'h2', num:'4.1', text:'The observation'},

/* m4-observe */
{t:'h3', text:'The observation vector'},
{t:'p', text:'The receiver keeps $N$ numbers, and loses nothing that matters. It has $N$ correlators, one for each basis function, and each returns one number.'},
{t:'fig', svg:figBank, cap:'The demodulator. $N$ correlators give $N$ numbers, and these are everything the detector sees.', short:'The bank of $N$ correlators.'},
{t:'p', text:'Correlate $r(t)$ with $\\psi_k(t)$ and split the integral into its signal part and its noise part.'},
{t:'eq', tex:'\\begin{aligned}r_k&=\\int_0^{T}r(t)\\,\\psi_k(t)\\,dt\\\\&=\\int_0^{T}s_i(t)\\,\\psi_k(t)\\,dt+\\int_0^{T}n(t)\\,\\psi_k(t)\\,dt\\\\&=s_{ik}+n_k\\end{aligned}'},
{t:'p', text:'The first integral is the coordinate $s_{ik}$ of the signal. The second is the noise component $n_k$. Together the $N$ outputs form the observation vector.'},
{t:'eqbox', cap:'The observation vector', tex:'\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}=(r_1,\\ldots,r_N)'},
{t:'p', text:'The signal was built from the $N$ basis functions, so the correlators capture all of it. The noise was not. Part of it lies outside the space the basis spans. Write that part $n_0(t)$.'},
{t:'eq', tex:'r(t)=\\sum_{k=1}^{N}r_k\\psi_k(t)+n_0(t)'},
{t:'box', kind:'ok', hd:'Noise outside the signal space', html:'The component $n_0(t)$ contains no signal. It is also independent of the retained coordinates. Therefore, it contains no information that can help the receiver identify the transmitted signal.'},
{t:'box', kind:'warn', hd:'Noise retained by the receiver', html:'The correlators do not remove all noise. The receiver keeps every noise component inside the signal space. It discards only the component that cannot distinguish the signals.'},

/* m4-noise */
{t:'h3', text:'The noise vector'},
{t:'p', text:'Each axis carries one independent Gaussian. Each $n_k$ is a projection of a Gaussian process onto a fixed function, so it is Gaussian with zero mean. The useful part is the correlation between two of them.'},
{t:'p', text:'Write each $n_k$ as its integral and take the expectation inside. Then use $E[n(\\tau)n(u)]=\\frac{N_0}{2}\\delta(\\tau-u)$ and the sifting property.'},
{t:'eq', tex:'\\begin{aligned}E[n_jn_k]&=\\int_0^{T}\\!\\!\\int_0^{T}E[n(\\tau)n(u)]\\,\\psi_j(\\tau)\\psi_k(u)\\,d\\tau\\,du\\\\&=\\int_0^{T}\\!\\!\\int_0^{T}\\frac{N_0}{2}\\delta(\\tau-u)\\,\\psi_j(\\tau)\\psi_k(u)\\,d\\tau\\,du\\\\&=\\frac{N_0}{2}\\int_0^{T}\\psi_j(u)\\psi_k(u)\\,du\\end{aligned}'},
{t:'p', text:'The basis is orthonormal. So the last integral is $1$ when $j=k$ and $0$ otherwise.'},
{t:'eq', tex:'E[n_jn_k]=\\begin{cases}\\dfrac{N_0}{2},&j=k\\\\[4pt]0,&j\\ne k\\end{cases}'},
{t:'box', kind:'def', hd:'Uncorrelated, and therefore independent', html:'For jointly Gaussian variables, zero correlation is independence. So the $N$ noise components are independent, each $\\mathcal{N}(0,\\,N_0/2)$, and the joint density is a product.'},
{t:'p', text:'One component has variance $\\sigma^{2}=N_0/2$. Its density is therefore as follows.'},
{t:'eq', tex:'\\begin{aligned}f(n_k)&=\\frac{1}{\\sqrt{2\\pi\\sigma^{2}}}\\exp\\!\\left(-\\frac{n_k^{2}}{2\\sigma^{2}}\\right)\\\\&=(\\pi N_0)^{-1/2}\\exp\\!\\left(-\\frac{n_k^{2}}{N_0}\\right)\\end{aligned}'},
{t:'p', text:'Multiply the $N$ factors. The powers add to $(\\pi N_0)^{-N/2}$ and the exponents add to one sum.'},
{t:'eqbox', cap:'The joint density of the noise', tex:'f_{\\mathbf{n}}(n_1,\\ldots,n_N)=(\\pi N_0)^{-N/2}\\exp\\!\\left(-\\sum_{k=1}^{N}\\frac{n_k^{2}}{N_0}\\right)'},
{t:'box', kind:'ok', hd:'Noise geometry', html:'Each axis has variance $N_0/2$, and the axes are independent. Therefore, the noise cloud is circular in two dimensions and spherical in $N$ dimensions. This symmetry gives the nearest-point rule.'},
{t:'fig', svg:figNoise, cap:'Eight hundred draws of a two-dimensional noise vector, with circles at one, two and three standard deviations. The cloud has no preferred direction. This symmetry makes Euclidean distance the correct measure for the decision rule.',
 short:'Eight hundred draws of a two-dimensional noise vector.'},

/* ================================================================ 4.2 ==== */
{t:'h2', num:'4.2', text:'The decision rule'},

/* m4-map */
{t:'h3', text:'The MAP and ML rules'},
{t:'p', text:'The receiver should choose the signal that is most likely given what it saw. That is the posterior probability $P(\\mathbf{s}_i\\mid\\mathbf{r})$. Bayes\' rule writes it as follows.'},
{t:'eq', tex:'P(\\mathbf{s}_i\\mid\\mathbf{r})=\\frac{P(\\mathbf{s}_i)\\,f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)}{f_{\\mathbf{r}}(\\mathbf{r})}'},
{t:'p', text:'The denominator is the same for every $i$. It cannot change which $i$ wins, so it is dropped.'},
{t:'box', kind:'def', hd:'The MAP rule', html:'Choose the $\\mathbf{s}_i$ that maximises $P(\\mathbf{s}_i)\\,f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)$, the prior times the likelihood. This rule minimises the probability of error, and no rule does better.'},
{t:'box', kind:'def', hd:'The ML rule', html:'If all $M$ signals are equally likely, every prior is $1/M$. The priors then cannot change the answer either. What is left is: choose the $\\mathbf{s}_i$ that maximises the likelihood $f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)$.'},
{t:'p', text:'<b>Which one to use.</b> MAP minimizes the probability of error when the priors are known and all errors cost the same. ML gives the same decision when the priors are equal. It is also what remains when they are unknown. With known unequal priors, MAP can give a lower error probability.'},
{t:'figrow', n:2, items:[
 {svg:()=>regions([[-1.1,0],[1.1,0]],{lim:2.2,w:420,h:190}),
  cap:'Equal priors: the boundary is the perpendicular bisector, exactly halfway between the two points.',
  short:'Two points with equal priors.'},
 {svg:()=>regions([[-1.1,0,0.9],[1.1,0]],{lim:2.2,w:420,h:190}),
  cap:'The left symbol four times more likely. Its region has grown and the boundary has moved towards the other point. Nothing else about the picture has changed.',
  short:'Two points, the left one four times more likely.'}
]},

/* m4-mindist */
{t:'h3', text:'Minimum-distance detection'},
{t:'p', text:'The rule is: choose the nearest point. To see it, put the noise density of Section 4.1 into the likelihood. Each $r_k$ is $s_{ik}$ plus independent noise of variance $N_0/2$, so $\\mathbf{n}=\\mathbf{r}-\\mathbf{s}_i$.'},
{t:'eq', tex:'f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)=(\\pi N_0)^{-N/2}\\exp\\!\\left(-\\sum_{k=1}^{N}\\frac{(r_k-s_{ik})^{2}}{N_0}\\right)'},
{t:'p', text:'Take the logarithm. It is increasing, so it does not change which $i$ wins. It turns the product into a sum, and the sum of squares is the squared distance.'},
{t:'eq', tex:'\\ln f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)=-\\frac{N}{2}\\ln(\\pi N_0)-\\frac{1}{N_0}\\,\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}'},
{t:'p', text:'The first term does not depend on $i$ and is dropped. Maximising what is left means minimising the squared distance.'},
{t:'eqbox', cap:'ML detection', tex:'\\hat{s}=\\arg\\min_{i}\\;\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}'},
{t:'p', text:'For MAP, add $\\ln P(\\mathbf{s}_i)$ to the log-likelihood and drop the same constant. Then multiply by $-N_0$, which turns the maximum into a minimum.'},
{t:'eq', tex:'\\begin{aligned}&\\arg\\max_i\\Bigl\\{\\ln P(\\mathbf{s}_i)-\\frac{1}{N_0}\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}\\Bigr\\}\\\\&\\quad=\\arg\\min_i\\Bigl\\{\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)\\Bigr\\}\\end{aligned}'},
{t:'eqbox', cap:'MAP detection', tex:'\\hat{s}=\\arg\\min_{i}\\;\\Bigl\\{\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)\\Bigr\\}'},
{t:'box', kind:'ok', hd:'Say it in words', html:'<b>Choose the signal point closest to what arrived.</b> With unequal priors, subtract a fixed handicap from each distance first. A more likely symbol gets a larger handicap and so wins from further away.'},
{t:'box', kind:'warn', hd:'Prior-probability term', html:'The metric subtracts $N_0\\ln P(\\mathbf{s}_i)$. Because the logarithm is negative, a more likely symbol receives a smaller penalty. A sign error incorrectly shrinks its decision region.'},
{t:'fig', svg:figDist, cap:'The quantity the detector minimises is the ordinary distance between the observation and a signal point. In two dimensions it is Pythagoras: $D^{2}=(r_1-s_{i1})^{2}+(r_2-s_{i2})^{2}$.',
 short:'The distance between the observation and a signal point.'},

/* m4-metric */
{t:'h3', text:'The correlation metric'},
{t:'p', text:'This is the receiver in the form it is built. Expanding the squared distance gives three terms.'},
{t:'eq', tex:'\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}=\\underbrace{\\|\\mathbf{r}\\|^{2}}_{\\text{same for every }i}-2\\,\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i+\\underbrace{\\|\\mathbf{s}_i\\|^{2}}_{E_i}'},
{t:'p', text:'The first term is the same whichever signal is being tested. It cannot change the winner and is dropped from the MAP metric.'},
{t:'eq', tex:'\\hat{s}=\\arg\\min_i\\Bigl\\{-2\\,\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i+E_i-N_0\\ln P(\\mathbf{s}_i)\\Bigr\\}'},
{t:'p', text:'Turn the minimum into a maximum by changing every sign, and divide by two.'},
{t:'eqbox', cap:'The correlation metric', tex:'\\hat{s}=\\arg\\max_{i}\\;\\Bigl\\{\\underbrace{\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i}_{\\text{correlation}}-\\frac{E_i}{2}+\\frac{N_0}{2}\\ln P(\\mathbf{s}_i)\\Bigr\\}',
 after:'And $\\mathbf{r}\\cdot\\mathbf{s}_i=\\int_0^{T}r(t)s_i(t)\\,dt$, by the inner-product property of Chapter 3. So the receiver can correlate against the waveforms directly and never compute coordinates at all.'},
{t:'box', kind:'ok', hd:'The simplest case, which is the common one', html:'If all $M$ signals are equally likely <b>and</b> have the same energy, both correction terms are the same for every $i$ and drop out. The rule becomes: <b>choose the signal with the largest correlation.</b> That is one multiplier and one integrator per signal, and nothing else.'},
{t:'box', kind:'warn', hd:'Unequal signal energies', html:'Keep the term $-E_i/2$ when the signal energies differ. Without it, the correlation metric favors a high-energy signal. This error makes an on-off receiver select the nonzero signal too often.'},
{t:'fig', svg:figReceiver, cap:'The receiver as it is built: one correlator per signal, an energy correction on each, and a comparison. With equal energies the corrections vanish and only the correlators remain.',
 short:'The correlation receiver.'},

/* ================================================================ 4.3 ==== */
{t:'h2', num:'4.3', text:'Decision regions'},

/* m4-regions */
{t:'h3', text:'Decision regions'},
{t:'p', text:'This is the rule, drawn. The rule assigns every possible observation to one signal. Collecting the observations that give the same answer divides the space into $M$ pieces.'},
{t:'eq', tex:'R_i=\\left\\{\\mathbf{r}\\;:\\;\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}\\le\\|\\mathbf{r}-\\mathbf{s}_j\\|^{2}\\ \\text{for all }j\\ne i\\right\\}'},
{t:'box', kind:'def', hd:'Three facts about the boundaries', html:'<ol><li>A boundary between two points is <b>perpendicular</b> to the line joining them.</li><li>With equal priors it crosses that line exactly <b>halfway</b>.</li><li>With unequal priors it moves, and <b>the region of the less likely signal shrinks</b>.</li></ol>'},
{t:'p', text:'The first two are the definition of a perpendicular bisector. The set of points equidistant from two fixed points <em>is</em> that bisector. Nothing has to be calculated once the rule is "nearest point".'},
{t:'box', kind:'warn', hd:'A region need not be bounded', html:'Only the nearest neighbours contribute boundaries. A point in the middle of a constellation has a bounded region. A point on the outside has one that runs off to infinity. That is why outer points make fewer errors than inner ones.'},
{t:'fig', svg:()=>narrow(regions([[1.15,0],[0,1.15],[-1.15,0],[0,-1.15]],{lim:2.2}),38),
 cap:'Four points form four decision regions. Each boundary is perpendicular to the line between its two points. For three points on a line, the middle region is a strip. The outer regions are half-planes.',
 short:'Four points and their four decision regions.'},

/* m4-binary */
{t:'h3', text:'The binary case'},
{t:'p', text:'Take two equally likely points a distance $d$ apart. Put the origin midway, so they sit at $\\pm d/2$ on the line joining them. The boundary is then at zero.'},
{t:'p', text:'An error happens when the noise along that line carries the observation across the boundary, a distance of $d/2$. The noise on any one axis is $\\mathcal{N}(0,N_0/2)$, with standard deviation $\\sqrt{N_0/2}$. So the error is the tail of that Gaussian beyond $d/2$.'},
{t:'eq', tex:'\\begin{aligned}P_e&=Q\\!\\left(\\frac{d/2}{\\sqrt{N_0/2}}\\right)\\\\&=Q\\!\\left(\\sqrt{\\frac{d^{2}}{4}\\cdot\\frac{2}{N_0}}\\right)\\end{aligned}'},
{t:'eqbox', cap:'Binary error probability', tex:'P_e=Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)'},
{t:'p', text:'For antipodal signalling the two points are at $\\pm\\sqrt{E_b}$. So $d=2\\sqrt{E_b}$ and $d^{2}=4E_b$.'},
{t:'eq', tex:'P_b=Q\\!\\left(\\sqrt{\\frac{4E_b}{2N_0}}\\right)=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)'},
{t:'p', text:'This is the expression Chapter 2 derived by integrating two Gaussian densities. Here it comes from the picture, with no integral at all.'},
{t:'box', kind:'ok', hd:'Distance alone', html:'The error probability of a binary system depends on <b>the distance between the two points and on nothing else</b>. It does not depend on the waveforms, their shapes, or where the points sit.'},
{t:'p', text:'With unequal priors the boundary is no longer at the midpoint. Measure its position $\\mu$ from $\\mathbf{s}_1$ along the line joining the two points. On the boundary the two MAP metrics are equal.'},
{t:'eq', tex:'\\begin{aligned}\\mu^{2}-N_0\\ln P(\\mathbf{s}_1)&=(d-\\mu)^{2}-N_0\\ln P(\\mathbf{s}_0)\\\\2d\\mu-d^{2}&=N_0\\ln\\frac{P(\\mathbf{s}_1)}{P(\\mathbf{s}_0)}\\end{aligned}'},
{t:'p', text:'Solve for $\\mu$.'},
{t:'eqbox', cap:'Boundary position', tex:'\\mu=\\frac{d}{2}+\\frac{N_0}{2d}\\ln\\frac{P(\\mathbf{s}_1)}{P(\\mathbf{s}_0)}',
 after:'Equal priors give $\\mu=d/2$. A more likely $\\mathbf{s}_1$ makes the logarithm positive. So $\\mu$ grows, the boundary moves away from $\\mathbf{s}_1$, and its region enlarges.'},
{t:'p', text:'The Chapter 2 results follow from distance. Antipodal points are $2\\sqrt{E_b}$ apart. On-off points are $\\sqrt{2E_b}$ apart, so $d^{2}=2E_b$ and $P_b=Q\\bigl(\\sqrt{E_b/N_0}\\bigr)$. The factor $\\sqrt{2}$ in distance is a factor $2$ in energy, and $10\\log_{10}2$ gives the $3$ dB difference.'},
{t:'fig', svg:figBinary, cap:'The two densities along the line joining the points. The shaded tail is the probability that the left signal is mistaken for the right one.',
 short:'The two densities along the line joining two points.'},

/* ================================================================ 4.4 ==== */
{t:'h2', num:'4.4', text:'The union bound'},

/* m4-pe */
{t:'h3', text:'The exact error probability'},
{t:'p', text:'This is the exact answer, and why it is not usable. A decision is correct when the observation lands in the right region. Average that over the symbols.'},
{t:'eq', tex:'P(C)=\\sum_{i=1}^{M}P\\bigl(\\mathbf{r}\\in R_i\\mid\\mathbf{s}_i\\bigr)P(\\mathbf{s}_i),\\qquad P_e=1-P(C)'},
{t:'p', text:'Each of those probabilities is an integral of the likelihood over a region. With equal priors every $P(\\mathbf{s}_i)$ is $1/M$.'},
{t:'eqbox', cap:'Exact error probability', tex:'P_e=1-\\frac{1}{M}\\sum_{i=1}^{M}\\int_{R_i}f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)\\,d\\mathbf{r}'},
{t:'box', kind:'err', hd:'Exact integral', html:'The integral can have $N$ dimensions, and the decision region can have many faces. For $M=2$, it reduces to one Gaussian tail. Larger constellations usually require numerical integration.'},
{t:'box', kind:'ok', hd:'Use an upper bound instead', html:'The union bound, next, replaces the exact expression with an upper bound made of $Q$ functions. The bound is often useful at high signal-to-noise ratios. It can be loose at low ratios. Because it is an upper bound, meeting the bound is sufficient to meet the true error requirement.'},
{t:'fig', svg:()=>narrow(regions([[1.2,1.2],[-1.2,1.2],[-1.2,-1.2],[1.2,-1.2],[0,0]],{lim:2.6,cloud:400,sigma:0.42}),40),
 cap:'Five signal points and the observation cloud for the top-right point. The exact error probability is the fraction of the cloud outside its decision region. Higher-dimensional regions make this calculation more difficult.',
 short:'Five signal points and the observation cloud for one of them.'},

/* m4-union */
{t:'h3', text:'The union bound'},
{t:'p', text:'Suppose that $\\mathbf{s}_k$ was sent. Let $A_{kj}$ be the event that the observation is closer to $\\mathbf{s}_j$ than to $\\mathbf{s}_k$. An error occurs when at least one event occurs. The probability of their union is not more than the sum of their probabilities.'},
{t:'eq', tex:'P(\\text{error}\\mid\\mathbf{s}_k)=P\\!\\left(\\bigcup_{j\\ne k}A_{kj}\\right)\\le\\sum_{j\\ne k}P(A_{kj})'},
{t:'p', text:'Each $P(A_{kj})$ is a <b>binary</b> question: closer to $\\mathbf{s}_j$ or to $\\mathbf{s}_k$, ignoring every other point. The binary answer of Section 4.3 is already known.'},
{t:'eqbox', cap:'Pairwise error probability', tex:'P(\\mathbf{s}_k\\to\\mathbf{s}_j)=Q\\!\\left(\\frac{d_{kj}/2}{\\sqrt{N_0/2}}\\right)=Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)',
 after:'Here $d_{kj}=\\|\\mathbf{s}_k-\\mathbf{s}_j\\|$. The $N$-dimensional problem has become a list of one-dimensional ones.'},
{t:'p', text:'Add the pairwise terms for each $\\mathbf{s}_k$, and average over the $M$ equally likely signals.'},
{t:'eqbox', cap:'Union bound', tex:'P_e\\le\\frac{1}{M}\\sum_{k=1}^{M}\\sum_{\\substack{j=1\\\\ j\\ne k}}^{M}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)'},
{t:'box', kind:'warn', hd:'Union-bound gap', html:'The error events can overlap. The sum then counts one observation more than once. Therefore, the bound can exceed the true probability. At high signal-to-noise ratios, the overlap becomes small.'},
{t:'fig', svg:()=>narrow(regions(SQ12,{lim:2.6,cloud:340,sigma:0.5}),40),
 cap:'Observation regions when the top-right point is sent. The bound compares this point with the left, bottom, and diagonal points separately. Overlap between two pairwise error regions is counted twice.',
 short:'The observation cloud for the top-right point of four.'},

/* m4-dmin */
{t:'h3', text:'Minimum-distance and nearest-neighbour bounds'},
{t:'p', text:'$Q$ decreases, so replacing every distance by the smallest one can only make each term larger. Write the smallest distance as $d_{\\min}$.'},
{t:'eq', tex:'d_{\\min}=\\min_{k\\ne j}\\;d_{kj}'},
{t:'p', text:'Every one of the $M-1$ terms in the inner sum is then at most $Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$. The inner sum is at most $M-1$ times that, and so is its average over $k$.'},
{t:'eqbox', cap:'Minimum-distance bound', tex:'P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'},
{t:'box', kind:'warn', hd:'This one is loose, and deliberately', html:'It pretends every other signal point sits at the minimum distance. In a large constellation most of them are much further away and contribute almost nothing. So the bound over-states $P_e$ by a factor of several. It is used because it needs only two numbers, $M$ and $d_{\\min}$.'},
{t:'p', text:'The tighter form keeps only the points that are actually at the minimum distance. Let $N_{\\min}$ be the average number of such <b>nearest neighbours</b> per signal point.'},
{t:'eqbox', cap:'Nearest-neighbour approximation', tex:'P_e\\approx N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)',
 after:'This approximation is useful at high signal-to-noise ratios. More distant points have much smaller pairwise terms, so the nearest neighbours dominate the error probability.'},
{t:'box', kind:'ok', hd:'Constellation parameters', html:'Two parameters control the nearest-neighbor bound. The minimum distance $d_{\\min}$ controls the argument of $Q$. The count $N_{\\min}$ is a multiplier. Good constellations maximize $d_{\\min}$ for a fixed average energy.'},
{t:'fig', svg:figPSKBounds, cap:'Two bounds for eight-point phase-shift keying: the minimum-distance bound with $M-1=7$ (red), the nearest-neighbour form with $N_{\\min}=2$ (cyan), and a single pairwise term (dashed grey). Both bounds use the same $Q$ function with different multipliers. Their ratio is the constant $7/2$, so their horizontal positions are equal.',
 short:'Two bounds for eight-point phase-shift keying.'},

/* m4-intel */
{t:'h3', text:'The intelligent union bound'},
{t:'p', text:'The union bound adds one term for every other signal point. An observation must leave its decision region before it can approach another point. It leaves through a <b>face</b> shared with one neighbor. A point without a shared face cannot be the first incorrect decision.'},
{t:'box', kind:'def', hd:'The set that matters', html:'Write $\\mathcal{N}(k)$ for the neighbours of $\\mathbf{s}_k$ whose perpendicular bisectors form the faces of the decision region $R_k$. These are the only points that bound the region, so they are the only ones an error has to cross.'},
{t:'p', text:'Leaving $R_k$ means crossing at least one of its faces, so the union over the faces already covers every error. Summing over that smaller set is still an upper bound.'},
{t:'eqbox', cap:'Intelligent union bound', tex:'P(\\text{error}\\mid\\mathbf{s}_k)\\le\\sum_{j\\in\\mathcal{N}(k)}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)',
 after:'This bound uses fewer terms than the full union bound. Each retained term represents a face that the observation can cross when it leaves the correct region.'},
{t:'ex', hd:'Four points in a square', rows:[
 ['Region','The top-right point decides for the whole first quadrant. That region has two faces: one shared with the point to its left, one with the point below.'],
 ['Dropped','The diagonal point shares no face. Its bisector is the line $\\psi_2=-\\psi_1$, which never touches the first quadrant.'],
 ['Bound','$P_e\\le 2Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$, where the union bound also carried $Q\\!\\left(\\sqrt{2d^{2}/2N_0}\\right)$.'],
 ['At $d^{2}/2N_0=9$','$2.70\\times10^{-3}$ against the union bound\'s $2.71\\times10^{-3}$ and the minimum-distance bound\'s $4.05\\times10^{-3}$.']
]},
{t:'box', kind:'warn', hd:'Not the same statement as the nearest-neighbour form', html:'Here the two give the same expression, because both faces happen to sit at $d_{\\min}$. They still say different things. This one <em>counts faces</em> and is an upper bound, so a system built to it is safe. The nearest-neighbour form <em>counts points at $d_{\\min}$</em> and is an approximation, so it can sit below the truth. They part company whenever a face is shared with a point further away than $d_{\\min}$. That face is a real way out of the region, and only this bound keeps it.'},
{t:'fig', svg:figFaces, cap:'The solid lines bound the top-right decision region. Each line is shared with one nearest neighbor. The dashed diagonal bisector does not touch this region. Therefore, it does not represent a nearest-neighbor error.',
 short:'The faces of the top-right decision region.'},

/* m4-ex-union */
{t:'p', text:'Example 4.1 applies the general union bound to four points in a square. The figure shows the constellation and its regions.'},
{t:'fig', svg:()=>narrow(regions(SQ,{lim:2.4}),36),
 cap:'The constellation of Example 4.1 and its four regions. From any point, two neighbours share a boundary with it and the diagonal one does not.',
 short:'The four-point constellation of Example 4.1.'},
{t:'ex', hd:'Example 4.1 — the union bound', rows:[
 ['Given','Four equally likely points at $(\\pm d/2,\\,\\pm d/2)$: neighbouring points are $d$ apart, diagonal ones $d\\sqrt{2}$.'],
 ['Find','The symbol error probability from the general union bound.'],
 ['Method','Take one point, list its distances to the other three, and add one $Q$ for each. The constellation is symmetric, so every point gives the same answer and the average is that answer.'],
 ['Distances','From $\\mathbf{s}_1$: two neighbours at $d$ and one diagonal at $d\\sqrt{2}$. So the squared distances are $d^{2}$, $d^{2}$ and $2d^{2}$.'],
 ['Solution','$$P_e\\le 2\\,Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)+Q\\!\\left(\\sqrt{\\frac{2d^{2}}{2N_0}}\\right)$$'],
 ['Check','Three terms because there are three other points. The third has a larger argument because its point is further away.']
]},

/* m4-ex-union-b */
{t:'p', text:'Example 4.2 takes the same constellation, with the two forms that are actually used, and sets the three answers side by side.'},
{t:'ex', hd:'Example 4.2 — the simplified bounds', rows:[
 ['Given','The four points of Example 4.1, with $M=4$.'],
 ['Find','The nearest-neighbour and minimum-distance forms, and all three answers at $d^{2}/2N_0=9$.'],
 ['Method','Read $d_{\\min}$, $N_{\\min}$ and $M-1$ off the constellation and put each into its form.'],
 ['Nearest neighbours','$d_{\\min}=d$, and each point has $N_{\\min}=2$ neighbours at that distance, so $$P_e\\approx 2\\,Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right).$$ This approximation omits the smaller diagonal term.'],
 ['Minimum-distance form','$M-1=3$, so $$P_e\\le 3\\,Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right),$$ which pretends the diagonal point is as close as the neighbours.'],
 ['Check','Put $d^{2}/2N_0=9$, so $Q(3)=1.35\\times10^{-3}$ and $Q(4.243)=1.10\\times10^{-5}$. The three answers are $2.71\\times10^{-3}$, $2.70\\times10^{-3}$ and $4.05\\times10^{-3}$.']
]},
{t:'box', kind:'ok', hd:'Bound comparison', html:'The two useful bounds differ by less than one percent. The diagonal term contributes $0.4\\%$. The loose bound is about $50\\%$ larger. Each form changes only the multiplier of the same $Q$ function.'},

/* ================================================================ 4.5 ==== */
{t:'h2', num:'4.5', text:'Summary'},

/* m4-synth */
{t:'h3', text:'Summary of results'},
{t:'table', cap:'Summary of Chapter 4: the optimal receiver in additive white Gaussian noise.', head:['Result','Statement','Anchor'], rows:[
 ['The receiver','$\\hat{s}=\\arg\\max_i\\Bigl\\{\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i-\\tfrac{E_i}{2}+\\tfrac{N_0}{2}\\ln P(\\mathbf{s}_i)\\Bigr\\}$. Correlate with each signal. Correct for energy and prior. Select the largest metric.','PS CH8.4.1'],
 ['The picture','$\\hat{s}=\\arg\\min_i\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}$. Nearest-point boundaries are perpendicular bisectors. Unequal priors change the region sizes.','PS CH8.4.1'],
 ['Binary','$P_e=Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$. For two points, the distance gives the exact error probability.','PS CH8.3.3'],
 ['M-ary','$P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$. For larger constellations, nearest neighbors give the dominant error terms.','PS CH8.4.2']
]},
{t:'box', kind:'ok', hd:'Connection to Chapter 5', html:'Chapter 5 applies these rules to common constellations. It compares their minimum distances at fixed average energy.'}

];
})();
