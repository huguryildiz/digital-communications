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
{t:'p', lead:true, text:'A transmitter picks one of $M$ signals and sends it. The channel adds noise. The receiver has to name the signal. Chapter 3 turned the signals into points. This chapter turns the receiver into a rule about those points, and the rule is simple: choose the point nearest to what arrived.'},

{t:'h2', num:'4.1', text:'What the receiver keeps'},
{t:'p', text:'The received signal is $r(t)=s_i(t)+n(t)$ over one symbol interval. The receiver has $N$ correlators, one for each basis function, and each returns one number.'},
{t:'eqbox', cap:'The observation vector', tex:[
  'r_k=\\int_0^{T}r(t)\\psi_k(t)\\,dt=s_{ik}+n_k',
  '\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}=(r_1,\\ldots,r_N)'],
 after:'The signal was built from the $N$ basis functions, so the correlators capture all of it. The noise was not: the part of it outside the signal space, written $n_0(t)$, is thrown away.'},
{t:'box', kind:'ok', hd:'Noise outside the signal space', html:'The component $n_0(t)$ contains no signal because every signal lies in the basis span. It is also independent of the retained coordinates. Therefore, it cannot help the receiver identify the transmitted signal. The receiver still keeps all noise components inside the signal space.'},
{t:'p', text:'Each $n_k$ is a projection of a Gaussian process onto a fixed function, so it is Gaussian with zero mean. The useful part is what happens between two of them: using $E[n(\\tau)n(u)]=\\frac{N_0}{2}\\delta(\\tau-u)$ and orthonormality, $E[n_jn_k]$ is $N_0/2$ when $j=k$ and zero otherwise. Uncorrelated jointly Gaussian variables are independent, so the noise components are independent, each $\\mathcal{N}(0,N_0/2)$.'},
{t:'box', kind:'def', hd:'Noise geometry', html:'Every axis has the same variance, and the axes are independent. Therefore, the noise cloud is circular in two dimensions and spherical in $N$ dimensions. This symmetry gives the nearest-point decision rule.'},

{t:'h2', num:'4.2', text:'The decision rule'},
{t:'p', text:'The receiver should choose the signal that is most likely given what it saw. By Bayes\' rule that means maximising $P(\\mathbf{s}_i)f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)$ — the prior times the likelihood. This is the <b>MAP</b> rule, and no rule has a smaller error probability. If all $M$ signals are equally likely the priors cannot change the answer, and what is left is the <b>ML</b> rule: maximise the likelihood alone.'},
{t:'p', text:'Substitute the noise density into the likelihood. Then take its logarithm. The logarithm is increasing, so it does not change the maximizing signal. It converts the product into a sum and isolates the term that depends on $i$.'},
{t:'eqbox', cap:'Minimum-distance detection', tex:[
  '\\ln f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)=-\\frac{N}{2}\\ln(\\pi N_0)-\\frac{1}{N_0}\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}',
  '\\hat{s}=\\arg\\min_i\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}\\quad\\text{(ML)}',
  '\\hat{s}=\\arg\\min_i\\Bigl\\{\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)\\Bigr\\}\\quad\\text{(MAP)}'],
 after:'Select the signal point with the smallest metric. For unequal priors, the prior term changes each distance metric. A more likely symbol receives a larger decision region.'},
{t:'p', text:'Expanding the squared distance gives the form a receiver is actually built in. The term $\\|\\mathbf{r}\\|^{2}$ is the same for every $i$ and drops out. Turning the minimum into a maximum and dividing by two leaves the <b>correlation metric</b>.'},
{t:'eqbox', cap:'The receiver as it is built',
 tex:'\\hat{s}=\\arg\\max_i\\Bigl\\{\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i-\\frac{E_i}{2}+\\frac{N_0}{2}\\ln P(\\mathbf{s}_i)\\Bigr\\}',
 after:'And $\\mathbf{r}\\cdot\\mathbf{s}_i=\\int_0^{T}r(t)s_i(t)\\,dt$, so the receiver can correlate against the waveforms directly and never compute coordinates. If the signals are equally likely <b>and</b> have equal energy, both corrections vanish and the rule is: take the largest correlation.'},
{t:'box', kind:'warn', hd:'Unequal signal energies', html:'Keep $-E_i/2$ when signal energies differ. Without it, a large $\\mathbf{s}_i$ makes the correlation metric favor a high-energy signal. This error makes an on-off receiver select "one" too often. Equal priors remove only the prior term.'},

{t:'h2', num:'4.3', text:'Decision regions'},
{t:'p', text:'Collecting the observations that give the same answer divides the space into $M$ regions, $R_i=\\{\\mathbf{r}:\\|\\mathbf{r}-\\mathbf{s}_i\\|\\le\\|\\mathbf{r}-\\mathbf{s}_j\\|\\ \\text{for all}\\ j\\}$. Three facts describe them, and all three follow from the rule being "nearest point".'},
{t:'ol', items:[
 'A boundary between two points is <b>perpendicular</b> to the line joining them.',
 'With equal priors it crosses that line exactly <b>halfway</b>.',
 'With unequal priors it moves, and <b>the region of the less likely signal shrinks</b>.'
]},
{t:'p', text:'A decision boundary is the perpendicular bisector of two signal points. Only nearest neighbors contribute boundaries. An interior point has a bounded decision region. An outer point has an unbounded region and usually fewer nearest neighbors.'},

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
{t:'box', kind:'ok', hd:'Binary error probability', html:'The binary error probability depends only on the distance between the two signal points. Antipodal points are $2\\sqrt{E_b}$ apart. On-off or orthogonal points are $\\sqrt{2E_b}$ apart. The factor $\\sqrt2$ gives the $3$ dB difference from Chapter 2.'},

{t:'h2', num:'4.4', text:'The union bound'},
{t:'p', text:'For more than two signals, the exact error is an $N$-dimensional integral over each decision region. A region can have many faces. A simple closed form is usually unavailable. The union bound gives a computable upper bound.'},
{t:'p', text:'Suppose $\\mathbf{s}_k$ was sent, and let $A_{kj}$ be the event that the observation is closer to $\\mathbf{s}_j$ than to $\\mathbf{s}_k$. An error happens exactly when at least one of those occurs, and the probability of a union is at most the sum of the probabilities. Each term is a two-point question whose answer is already known.'},
{t:'eqbox', cap:'The union bound and its three usable forms', tex:[
  'P(\\mathbf{s}_k\\to\\mathbf{s}_j)=Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)',
  'P_e\\le\\frac{1}{M}\\sum_{k}\\sum_{j\\ne k}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)',
  'P_e\\le(M-1)Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right),\\qquad P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'],
 after:'$N_{\\min}$ is the <em>average</em> number of points at the minimum distance, and need not be an integer. The last form is the one used in practice.'},
{t:'p', text:'One more tightening is available, and it costs nothing. To land nearer a different point the observation must leave its own region, and it leaves through a <b>face</b>. A piece of boundary shared with one particular neighbour. A point that shares no face with the region cannot be the first one reached. Therefore, the union need only run over the neighbours that bound the region. Write $\\mathcal{N}(k)$ for those.'},
{t:'eqbox', cap:'The intelligent union bound', tex:[
  'P(\\text{error}\\mid\\mathbf{s}_k)\\le\\sum_{j\\in\\mathcal{N}(k)}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)'],
 after:'Still an upper bound, because leaving the region means crossing one of its faces. It is not the nearest-neighbour form: this one counts <em>faces</em> and bounds, that one counts <em>points at $d_{\\min}$</em> and approximates. They agree whenever every face sits at $d_{\\min}$, and part company when a face is shared with a point further away.'},
{t:'box', kind:'warn', hd:'Union-bound gap', html:'Pairwise error events can overlap, so their sum can count one observation more than once. The bound can exceed one at low signal-to-noise ratio. At high ratios, the overlaps become small and the bound approaches the exact error probability.'},

{t:'ex', hd:'Example 4.1 — four bounds on one constellation', rows:[
 ['Given','Four equally likely points at $(\\pm d/2,\\pm d/2)$: neighbours $d$ apart, diagonals $d\\sqrt2$.'],
 ['Find','The symbol error probability by each of the four forms.'],
 ['Method','Take one point, list its distances to the other three, and add one $Q$ for each. Then ask which of those three actually bound its region. Symmetry makes every point give the same answer.'],
 ['Solution','General: $P_e\\le 2Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)+Q\\!\\left(\\sqrt{2d^{2}/2N_0}\\right)$. Intelligent (the region has two faces, both at $d$): $P_e\\le 2Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$. Nearest neighbours ($d_{\\min}=d$, $N_{\\min}=2$): $P_e\\approx 2Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$. Minimum distance ($M-1=3$): $P_e\\le 3Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$.'],
 ['Check','Put $d^{2}/2N_0=9$, so $Q(3)=1.35\\times10^{-3}$ and $Q(4.243)=1.10\\times10^{-5}$. The four answers are $2.71\\times10^{-3}$, $2.70\\times10^{-3}$, $2.70\\times10^{-3}$ and $4.05\\times10^{-3}$: the diagonal term is worth $0.4\\%$, and pretending it is a nearest neighbour costs $50\\%$. The middle two agree here because both faces sit at $d_{\\min}$, and only one of them is a bound. All four are the same $Q$ with a different count in front, so none of them moves the curve sideways.']
]},

{t:'fig', svg:()=>regions([[1,1],[-1,1],[-1,-1],[1,-1]],{lim:2.4,w:400,h:280,cloud:340,sigma:0.42}),
 cap:'The constellation, its four regions, and the observations the receiver sees when the top-right point is sent. The exact error probability is the fraction of that cloud outside its own region. The bound adds three separate two-point questions and counts the overlaps twice.'},

{t:'h2', num:'4.5', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Observation','$\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}$, each $n_k\\sim\\mathcal{N}(0,N_0/2)$, independent','PS CH8.4.1'],
 ['MAP rule','minimise $\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)$','PS CH8.4.1'],
 ['ML rule','minimise $\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}$: choose the nearest point','PS CH8.4.1'],
 ['Receiver','maximise $\\mathbf{r}\\cdot\\mathbf{s}_i-E_i/2+\\frac{N_0}{2}\\ln P(\\mathbf{s}_i)$','PS CH8.4.1'],
 ['Regions','perpendicular bisectors. The less likely region shrinks','PS CH8.4.1'],
 ['Binary','$P_e=Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$','PS CH8.3.3'],
 ['Union bound','$P_e\\le\\frac{1}{M}\\sum_k\\sum_{j\\ne k}Q(\\cdot)$','PS CH8.4.2'],
 ['Intelligent form','sum over the neighbours that give $R_k$ a face','PS CH8.4.2'],
 ['In practice','$P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$','PS CH8.4.2']
]},
{t:'p', text:'Two parameters describe the nearest-neighbor approximation. The minimum distance $d_{\\min}$ controls the $Q$-function argument. The average neighbor count $N_{\\min}$ is a multiplier. Chapter 5 compares these values for practical constellations at fixed energy and bits per symbol.'}

];
})();
