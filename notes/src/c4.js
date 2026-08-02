/* Course notes — Chapter 4. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:50,r:20,t:18,b:34},xtarget:6,ytarget:3},o));
function Q(x){ const t=1/(1+0.2316419*Math.abs(x));
  const d=0.3989422804014327*Math.exp(-x*x/2);
  const p=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0?p:1-p; }
function rng(s){let a=s>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function gauss(s,n,sd){const r=rng(s),o=[];for(let i=0;i<n;i++){const u=Math.max(1e-12,r()),v=r();
  o.push(sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v));}return o;}

function regions(pts,opts){
  opts=opts||{};
  const lim=opts.lim||2.2, n=76;
  const a=ax({w:opts.w||330,h:opts.h||250,xr:[-lim,lim],yr:[-lim,lim],
    xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:46,r:20,t:22,b:36},xtarget:4,ytarget:4});
  const REG=[C.dec.in,C.dec.out,C.dec.mid,C.dec.h,C.dec.err];
  const step=2*lim/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x=-lim+(i+0.5)*step, y=-lim+(j+0.5)*step;
    let best=0,bd=Infinity;
    pts.forEach((p,k)=>{const d=(x-p[0])**2+(y-p[1])**2-(p[2]||0); if(d<bd){bd=d;best=k;}});
    a.rect(x-step/2,y-step/2,x+step/2,y+step/2,{fill:REG[best%REG.length]});
  }
  if(opts.cloud){ const nz=gauss(20260802,2*opts.cloud,opts.sigma||0.34);
    for(let i=0;i<opts.cloud;i++)
      a.point(pts[0][0]+nz[2*i],pts[0][1]+nz[2*i+1],{color:C.noise,r:1.5,ring:'none'}); }
  pts.forEach(p=>a.point(p[0],p[1],{color:C.ink,r:5}));
  return a.svg();
}

window.C4 = [

{t:'h1', num:'CHAPTER 4', text:'The optimal receiver in additive white Gaussian noise'},
{t:'p', lead:true, text:'A transmitter picks one of $M$ signals and sends it; the channel adds noise; the receiver has to name the signal. Chapter 3 turned the signals into points. This chapter turns the receiver into a rule about those points, and the rule is simple: choose the point nearest to what arrived.'},

{t:'h2', num:'4.1', text:'What the receiver keeps'},
{t:'p', text:'The received signal is $r(t)=s_i(t)+n(t)$ over one symbol interval. The receiver has $N$ correlators, one for each basis function, and each returns one number.'},
{t:'eqbox', cap:'The observation vector', tex:[
  'r_k=\\int_0^{T}r(t)\\psi_k(t)\\,dt=s_{ik}+n_k',
  '\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}=(r_1,\\ldots,r_N)'],
 after:'The signal was built from the $N$ basis functions, so the correlators capture all of it. The noise was not: the part of it outside the signal space, written $n_0(t)$, is thrown away.'},
{t:'box', kind:'ok', hd:'Why throwing $n_0(t)$ away costs nothing', html:'It contains no signal — every signal is a combination of the $N$ basis functions and has no component outside that space. And it is independent of the $N$ numbers the receiver kept. Something that carries no information about the answer and is unrelated to what was kept cannot help. Note what this does <em>not</em> say: the noise inside the signal space is kept in full, and it is all the trouble there is.'},
{t:'p', text:'Each $n_k$ is a projection of a Gaussian process onto a fixed function, so it is Gaussian with zero mean. The useful part is what happens between two of them: using $E[n(\\tau)n(u)]=\\frac{N_0}{2}\\delta(\\tau-u)$ and orthonormality, $E[n_jn_k]$ is $N_0/2$ when $j=k$ and zero otherwise. Uncorrelated jointly Gaussian variables are independent, so the noise components are independent, each $\\mathcal{N}(0,N_0/2)$.'},
{t:'box', kind:'def', hd:'What that means for the picture', html:'Every axis carries the same variance and the axes are independent, so the noise cloud is a <b>circle</b> — a sphere in $N$ dimensions — with no preferred direction. That symmetry is why the receiver may simply measure distance. If the variances differed, the nearest point in the ordinary sense would not be the best answer.'},

{t:'h2', num:'4.2', text:'The decision rule'},
{t:'p', text:'The receiver should choose the signal that is most likely given what it saw. By Bayes\' rule that means maximising $P(\\mathbf{s}_i)f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)$ — the prior times the likelihood. This is the <b>MAP</b> rule, and no rule has a smaller error probability. If all $M$ signals are equally likely the priors cannot change the answer, and what is left is the <b>ML</b> rule: maximise the likelihood alone.'},
{t:'p', text:'Putting the noise density into the likelihood and taking a logarithm — which is increasing, so it changes no winner — turns the product into a sum and leaves one term that depends on $i$.'},
{t:'eqbox', cap:'Minimum-distance detection', tex:[
  '\\ln f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)=-\\frac{N}{2}\\ln(\\pi N_0)-\\frac{1}{N_0}\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}',
  '\\hat{s}=\\arg\\min_i\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}\\quad\\text{(ML)}',
  '\\hat{s}=\\arg\\min_i\\Bigl\\{\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)\\Bigr\\}\\quad\\text{(MAP)}'],
 after:'In words: choose the signal point closest to what arrived. With unequal priors, subtract a fixed handicap from each distance first — the term is positive and larger for the more likely symbol, so that symbol wins from further away.'},
{t:'p', text:'Expanding the squared distance gives the form a receiver is actually built in. The term $\\|\\mathbf{r}\\|^{2}$ is the same for every $i$ and drops out; turning the minimum into a maximum and dividing by two leaves the <b>correlation metric</b>.'},
{t:'eqbox', cap:'The receiver as it is built',
 tex:'\\hat{s}=\\arg\\max_i\\Bigl\\{\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i-\\frac{E_i}{2}+\\frac{N_0}{2}\\ln P(\\mathbf{s}_i)\\Bigr\\}',
 after:'And $\\mathbf{r}\\cdot\\mathbf{s}_i=\\int_0^{T}r(t)s_i(t)\\,dt$, so the receiver can correlate against the waveforms directly and never compute coordinates. If the signals are equally likely <b>and</b> have equal energy, both corrections vanish and the rule is: take the largest correlation.'},
{t:'box', kind:'warn', hd:'When the energies differ, keep the energy term', html:'Without $-E_i/2$ a high-energy signal wins too often, because a large $\\mathbf{s}_i$ makes $\\mathbf{r}\\cdot\\mathbf{s}_i$ large whatever arrived. On-off signalling is exactly this case, and dropping the term there makes the receiver decide "one" almost always. Equal priors remove the prior term; only equal <em>energies</em> remove the energy term.'},

{t:'h2', num:'4.3', text:'Decision regions'},
{t:'p', text:'Collecting the observations that give the same answer divides the space into $M$ regions, $R_i=\\{\\mathbf{r}:\\|\\mathbf{r}-\\mathbf{s}_i\\|\\le\\|\\mathbf{r}-\\mathbf{s}_j\\|\\ \\text{for all}\\ j\\}$. Three facts describe them, and all three follow from the rule being "nearest point".'},
{t:'ol', items:[
 'A boundary between two points is <b>perpendicular</b> to the line joining them.',
 'With equal priors it crosses that line exactly <b>halfway</b>.',
 'With unequal priors it moves, and <b>the region of the less likely signal shrinks</b>.'
]},
{t:'p', text:'The first two are the definition of a perpendicular bisector: the set of points equidistant from two fixed points <em>is</em> that bisector. Nothing has to be calculated. Only nearest neighbours contribute boundaries, so a point in the middle of a constellation has a bounded region and a point on the outside has one that runs off to infinity — which is why outer points make fewer errors.'},

{t:'figrow', n:3, items:[
 {svg:()=>regions([[-1.1,0],[1.1,0]],{lim:2.2,h:190}),
  cap:'Two points, equal priors: the boundary is halfway.'},
 {svg:()=>regions([[-1.1,0,0.9],[1.1,0]],{lim:2.2,h:190}),
  cap:'The left symbol four times more likely: its region has grown.'},
 {svg:()=>regions([[1.15,0],[0,1.15],[-1.15,0],[0,-1.15]],{lim:2.2,h:190}),
  cap:'Four points, four boundaries, each perpendicular to the pair it separates.'}
]},

{t:'p', text:'For two equally likely points a distance $d$ apart, the boundary is $d/2$ from each. An error happens when the noise along the line joining them carries the observation across, and the noise on any one axis is $\\mathcal{N}(0,N_0/2)$.'},
{t:'eqbox', cap:'The binary result, from the picture', big:true, tex:[
  'P_e=Q\\!\\left(\\frac{d/2}{\\sqrt{N_0/2}}\\right)=Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)',
  '\\mu=\\frac{d}{2}+\\frac{N_0}{2d}\\ln\\frac{P(\\mathbf{s}_1)}{P(\\mathbf{s}_0)}'],
 after:'The second line is where the boundary sits when the priors are unequal, measured from the first point along the line. Equal priors give $\\mu=d/2$.'},
{t:'box', kind:'ok', hd:'The result this chapter exists for', html:'The error probability of a binary system depends on <b>the distance between the two points and on nothing else</b>. Antipodal points are $2\\sqrt{E_b}$ apart, giving $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$; on-off or orthogonal points are $\\sqrt{2E_b}$ apart, smaller by $\\sqrt2$ — which is the $3$ dB of Chapter 2, obtained here by measuring a picture instead of integrating two densities.'},

{t:'h2', num:'4.4', text:'The union bound'},
{t:'p', text:'For more than two signals the exact answer is an integral of the likelihood over each decision region, in $N$ dimensions and over a polygon with as many faces as the point has neighbours. There is no closed form. The way round it is to bound the answer instead.'},
{t:'p', text:'Suppose $\\mathbf{s}_k$ was sent, and let $A_{kj}$ be the event that the observation is closer to $\\mathbf{s}_j$ than to $\\mathbf{s}_k$. An error happens exactly when at least one of those occurs, and the probability of a union is at most the sum of the probabilities. Each term is a two-point question whose answer is already known.'},
{t:'eqbox', cap:'The union bound and its two usable forms', tex:[
  'P(\\mathbf{s}_k\\to\\mathbf{s}_j)=Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)',
  'P_e\\le\\frac{1}{M}\\sum_{k}\\sum_{j\\ne k}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)',
  'P_e\\le(M-1)Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right),\\qquad P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'],
 after:'$N_{\\min}$ is the <em>average</em> number of points at the minimum distance, and need not be an integer. The last form is the one used in practice.'},
{t:'box', kind:'warn', hd:'Why it is an over-estimate, and when that matters', html:'The events overlap: an observation can be closer to two other points at once, and the sum counts it twice. So the bound is always at least the truth. At low signal-to-noise ratio the overlaps are large and the bound can exceed one, which is useless; at the ratios real systems run at, every term is tiny and the bound is close enough to be quoted as the answer.'},

{t:'ex', hd:'Example 4.1 — three bounds on one constellation', rows:[
 ['Given','Four equally likely points at $(\\pm d/2,\\pm d/2)$: neighbours $d$ apart, diagonals $d\\sqrt2$.'],
 ['Find','The symbol error probability by each of the three forms.'],
 ['Method','Take one point, list its distances to the other three, and add one $Q$ for each. Symmetry makes every point give the same answer.'],
 ['Solution','General: $P_e\\le 2Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)+Q\\!\\left(\\sqrt{2d^{2}/2N_0}\\right)$. Nearest neighbours ($d_{\\min}=d$, $N_{\\min}=2$): $P_e\\approx 2Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$. Minimum distance ($M-1=3$): $P_e\\le 3Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$.'],
 ['Check','Put $d^{2}/2N_0=9$, so $Q(3)=1.35\\times10^{-3}$ and $Q(4.243)=1.10\\times10^{-5}$. The three answers are $2.71\\times10^{-3}$, $2.70\\times10^{-3}$ and $4.05\\times10^{-3}$: the diagonal term is worth $0.4\\%$, and pretending it is a nearest neighbour costs $50\\%$. All three are the same $Q$ with a different count in front, so none of them moves the curve sideways.']
]},

{t:'fig', svg:()=>regions([[1,1],[-1,1],[-1,-1],[1,-1]],{lim:2.4,w:400,h:280,cloud:340,sigma:0.42}),
 cap:'The constellation, its four regions, and the observations the receiver sees when the top-right point is sent. The exact error probability is the fraction of that cloud outside its own region; the bound adds three separate two-point questions and counts the overlaps twice.'},

{t:'h2', num:'4.5', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Observation','$\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}$, each $n_k\\sim\\mathcal{N}(0,N_0/2)$, independent','PS CH8.4.1'],
 ['MAP rule','minimise $\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)$','PS CH8.4.1'],
 ['ML rule','minimise $\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}$: choose the nearest point','PS CH8.4.1'],
 ['Receiver','maximise $\\mathbf{r}\\cdot\\mathbf{s}_i-E_i/2+\\frac{N_0}{2}\\ln P(\\mathbf{s}_i)$','PS CH8.4.1'],
 ['Regions','perpendicular bisectors; the less likely region shrinks','PS CH8.4.1'],
 ['Binary','$P_e=Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$','PS CH8.3.3'],
 ['Union bound','$P_e\\le\\frac{1}{M}\\sum_k\\sum_{j\\ne k}Q(\\cdot)$','PS CH8.4.2'],
 ['In practice','$P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$','PS CH8.4.2']
]},
{t:'p', text:'A constellation is judged by two numbers: $d_{\\min}$, which sets the exponent and therefore almost everything, and $N_{\\min}$, which multiplies it and matters far less. Chapter 5 applies this to the constellations that are actually used, and asks which of them gets the largest $d_{\\min}$ for a given average energy and a given number of bits per symbol.'}

];
})();
