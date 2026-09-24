/* Course notes — Chapter 4. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:50,r:20,t:18,b:34},xtarget:6,ytarget:3},o));
/* Q(x) through erfc, with a fractional error below 1.2e-7, so a curve on a
   logarithmic axis keeps its shape. */
function erfc(x){ const z=Math.abs(x), t=1/(1+0.5*z);
  const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+
    t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x>=0?r:2-r; }
const Q=x=>0.5*erfc(x/Math.SQRT2);
const gpdf=(x,m,s2)=>Math.exp(-(x-m)*(x-m)/(2*s2))/Math.sqrt(2*Math.PI*s2);
function rng(s){let a=s>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function gauss(s,n,sd){const r=rng(s),o=[];for(let i=0;i<n;i++){const u=Math.max(1e-12,r()),v=r();
  o.push(sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v));}return o;}
const lab=(a,x,y,s,col,anchor)=>a.note(x,y,s,{tex:true,fs:13,color:col||C.ink,anchor:anchor||'start'});
/* A filled area under f between lo and hi, as a faint wash. */
function wash(a,f,lo,hi,col){ a.area(f,lo,hi,{color:col}); }
const RED='rgba(166,59,42,.22)';

/* Decision regions drawn cell by cell: each small square takes the colour of
   the point with the smallest metric |r - s_i|^2 - b_i. */
function regions(pts,opts){
  opts=opts||{};
  const lim=opts.lim||2.2, n=90;
  const a=ax({w:opts.w||330,h:opts.h||250,xr:[-lim,lim],yr:[-lim*(opts.h||250)/(opts.w||330)*1.12,lim*(opts.h||250)/(opts.w||330)*1.12],
    xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:46,r:20,t:22,b:36},xticksOverride:[],yticksOverride:[]});
  const REG=[C.dec.in,C.dec.out,C.dec.mid,C.dec.h,C.dec.err];
  const [ya,yb]=a.o.yr, sx=2*lim/n, sy=(yb-ya)/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x=-lim+(i+0.5)*sx, y=ya+(j+0.5)*sy;
    let best=0,bd=Infinity;
    pts.forEach((p,k)=>{const d=(x-p[0])**2+(y-p[1])**2-(p[2]||0); if(d<bd){bd=d;best=k;}});
    a.rect(x-sx/2,y-sy/2,x+sx/2,y+sy/2,{fill:REG[best%REG.length]});
  }
  if(opts.cloud){ const nz=gauss(20260802,2*opts.cloud,opts.sigma||0.34);
    for(let i=0;i<opts.cloud;i++)
      a.point(pts[0][0]+nz[2*i],pts[0][1]+nz[2*i+1],{color:C.noise,r:1.5,ring:'none'}); }
  pts.forEach(p=>a.point(p[0],p[1],{color:C.in,r:5}));
  return a.svg();
}

window.C4 = [

{t:'h1', num:'CHAPTER 4', text:'The optimal receiver in additive white Gaussian noise'},
{t:'p', lead:true, text:'A transmitter sends one of $M$ waveforms and the channel adds noise. The receiver has to name the waveform that was sent. Chapter 3 turned the waveforms into points. This chapter turns the receiver into a rule about those points: pick the nearest one, with a handicap for each prior. It then asks how often that rule is wrong.'},

{t:'h2', num:'4.1', text:'The observation'},
{t:'p', text:'Binary signalling sends one bit a symbol. With $M$ waveforms, each symbol carries $k=\\log_2M$ bits. The transmitter reads the bit stream in blocks of $k$ bits, and each block picks one waveform.'},
{t:'eqbox', cap:'Bits and symbols', tex:'k=\\log_2M,\\qquad R_s=\\frac1T,\\qquad R_b=kR_s,\\qquad T_b=\\frac{T}{k}',
 after:'$T$ is the symbol duration and $R_s$ the symbol rate. The bit rate $R_b$ is $k$ times larger, and one bit lasts $T_b=T/k$.'},
{t:'p', text:'For example, a modem that sends $2400$ symbols a second with $M=16$ carries $k=4$ bits a symbol. Its bit rate is $4\\times2400=9600$ b/s.'},

{t:'p', text:'Over one symbol the receiver sees $r(t)=s_i(t)+n(t)$, where $n(t)$ is white Gaussian noise of two-sided density $N_0/2$. The receiver correlates $r(t)$ with each of the $N$ basis functions. This is the analyzer of Chapter 3.'},
{t:'eqbox', cap:'The correlator outputs', tex:[
  'r_j=\\int_0^{T}r(t)\\,\\psi_j(t)\\,dt=s_{ij}+n_j,\\qquad j=1,\\ldots,N',
  '\\mathbf r=\\mathbf s_i+\\mathbf n'],
 after:'The integral is linear, so each output is a signal coordinate plus a noise coordinate. The receiver now works with one point $\\mathbf r$.'},
{t:'p', text:'A bank of matched filters gives the same numbers. The filter for axis $j$ has impulse response $h_j(t)=\\psi_j(T-t)$, the basis function turned around in time.'},
{t:'eqbox', cap:'The matched filter sampled at $t=T$', tex:[
  'y_j(t)=\\int_0^{T}r(\\tau)\\,\\psi_j(T-t+\\tau)\\,d\\tau',
  'y_j(T)=\\int_0^{T}r(\\tau)\\,\\psi_j(\\tau)\\,d\\tau=r_j'],
 after:'At $t=T$ the shift disappears and the convolution is the correlation. At any other time the two outputs differ.'},
{t:'fig', svg:()=>{
  const y=t=>t<=0?0:t<=1?4.5*(t*t/2-t*t*t/6):t<=2?4.5*(1/3-(t-1)/2+Math.pow(t-1,3)/6):0;
  const c=t=>t<=0?0:t<=1?1.5*t*t*t:1.5;
  const a=ax({w:560,h:210,xr:[-0.08,2.15],yr:[-0.1,1.9],xlabel:'t/T',ylabel:'y(t),\\;c(t)',xticksOverride:[0.5,1,1.5,2],yticksOverride:[0.5,1,1.5]});
  a.curve(c,{color:C.mid,width:2,dash:'7 5'}); a.curve(y,{color:C.mid,width:2.3});
  a.vline(1,{color:C.ink,dash:'5 4'}); a.point(1,1.5,{color:C.mid,r:5});
  lab(a,1.06,1.66,'y(T)=c(T)=1.5',C.ink);
  return a.svg(); },
 cap:'$\\psi(t)=\\sqrt3\\,t$ on $[0,1]$ and $r(t)=1.5\\,\\psi(t)$. Solid: the matched filter output $y(t)$. Dashed: the correlator $c(t)$. They agree only at $t=T$.'},

{t:'p', text:'The correlators keep only the part of the noise that lies in the signal space. The rest, $n\'(t)$, is at right angles to every basis function. The receiver can drop it for two reasons.'},
{t:'eqbox', cap:'The noise outside the signal space adds the same amount to every distance', tex:'\\|\\tilde{\\mathbf r}-\\mathbf s_j\\|^{2}=\\|\\mathbf r-\\mathbf s_j\\|^{2}+\\|n\'\\|^{2}',
 after:'Here $\\tilde{\\mathbf r}$ is the received waveform with nothing dropped. Pythagoras splits its distance to each signal into two parts, and the second part is the same for every $j$.'},
{t:'p', text:'First, $n\'(t)$ contains no signal, because every signal lies in the span of the basis. Second, it is independent of the noise coordinates the receiver keeps. So it carries no information about which signal was sent. The $N$ outputs $r_1,\\ldots,r_N$ are called <b>sufficient statistics</b>.'},
{t:'p', text:'For example, suppose the squared distances inside the signal space are $0.5$ and $2.0$, and $\\|n\'\\|^{2}=0.8$. The full squared distances are $1.3$ and $2.8$. The gap stays $1.5$, so the same signal wins.'},

{t:'p', text:'Each noise coordinate is a weighted integral of a Gaussian process, so it is Gaussian with mean zero. Its variance, and the correlation between two coordinates, follow from $E[n(t)n(u)]=\\frac{N_0}{2}\\delta(t-u)$.'},
{t:'eqbox', cap:'The noise components', tex:[
  'E[n_jn_k]=\\int_0^{T}\\!\\!\\int_0^{T}\\frac{N_0}{2}\\,\\delta(t-u)\\,\\psi_j(t)\\,\\psi_k(u)\\,dt\\,du=\\frac{N_0}{2}\\int_0^{T}\\psi_j(t)\\,\\psi_k(t)\\,dt',
  'E[n_j^{2}]=\\frac{N_0}{2},\\qquad E[n_jn_k]=0\\quad(j\\ne k)'],
 after:'The delta function collapses the double integral, and orthonormality finishes the job. Gaussian variables that are uncorrelated are independent.'},
{t:'box', kind:'def', hd:'A round cloud', html:'Every axis has the same variance $N_0/2$, and the axes are independent. So the cloud of received points around a signal point is a circle in two dimensions and a sphere in $N$. About $39\\%$ of the points fall inside one standard deviation and $86\\%$ inside two.'},
{t:'box', kind:'warn', hd:'Correlated noise', html:'Coloured noise, or a basis that is not orthonormal, makes the components correlated. The cloud becomes a tilted ellipse, and the nearest point is no longer the best guess.'},
{t:'figrow', n:2, items:[
 {svg:()=>{ const z=gauss(4402,800,1), a=ax({w:330,h:260,xr:[-3.4,3.4],yr:[-2.9,2.9],xlabel:'n_1',ylabel:'n_2',xticksOverride:[],yticksOverride:[]});
   for(let i=0;i<400;i++) a.point(z[2*i],z[2*i+1],{color:C.noise,r:1.6,ring:'none'});
   [1,2].forEach(k=>{ const pts=[]; for(let i=0;i<=160;i++){const u=2*Math.PI*i/160; pts.push([k*Math.cos(u),k*Math.sin(u)]);} a.poly(pts,{color:C.mid,width:1.6,dash:k===2?'6 5':null}); });
   return a.svg(); }, cap:'$\\rho=0$: independent components, a round cloud.'},
 {svg:()=>{ const z=gauss(4402,800,1), rho=0.8, q=Math.sqrt(1-rho*rho), a=ax({w:330,h:260,xr:[-3.4,3.4],yr:[-2.9,2.9],xlabel:'n_1',ylabel:'n_2',xticksOverride:[],yticksOverride:[]});
   for(let i=0;i<400;i++) a.point(z[2*i],rho*z[2*i]+q*z[2*i+1],{color:C.noise,r:1.6,ring:'none'});
   [1,2].forEach(k=>{ const pts=[]; for(let i=0;i<=160;i++){const u=2*Math.PI*i/160; pts.push([k*Math.cos(u),k*(rho*Math.cos(u)+q*Math.sin(u))]);} a.poly(pts,{color:C.mid,width:1.6,dash:k===2?'6 5':null}); });
   return a.svg(); }, cap:'$\\rho=0.8$: the cloud stretches along $n_1=n_2$.'}
]},

{t:'ex', hd:'Example 4.1 — four-level PAM', rows:[
 ['Given','Four levels $s_m\\in\\{-1.5,-0.5,0.5,1.5\\}$ on one unit-energy pulse, with $N_0=0.1$.'],
 ['Find','The density of the correlator output for each level.'],
 ['Method','One basis function means one correlator and one number, $r=s_m+n$. The noise $n$ is Gaussian with mean $0$ and variance $N_0/2$.'],
 ['Solution','$f(r\\mid s_m)=\\dfrac{1}{\\sqrt{\\pi N_0}}\\,e^{-(r-s_m)^{2}/N_0}$, four bells of one shape, each centred on its level. Here $\\sigma^{2}=0.05$ and the peak is $1/\\sqrt{0.1\\pi}=1.78$.'],
 ['Check','$\\sigma=0.22$ is well inside half the spacing between levels, $0.5$. A larger $N_0$ would make neighbouring bells overlap.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $N_0$, not $N_0/2$, as the variance. The bells then come out $\\sqrt2$ times too wide.'},
{t:'fig', svg:()=>{ const L=[-1.5,-0.5,0.5,1.5], a=ax({w:560,h:200,xr:[-2.7,2.7],yr:[0,2.1],xlabel:'r',ylabel:'f(r\\mid s_m)',xticksOverride:L,yticksOverride:[1,2]});
  L.forEach(m=>a.curve(r=>Math.exp(-(r-m)*(r-m)/0.1)/Math.sqrt(0.1*Math.PI),{color:C.out,width:2,n:700}));
  L.forEach(m=>a.point(m,0,{color:C.in,r:4.5})); return a.svg(); },
 cap:'The four conditional densities of Example 4.1, with $N_0=0.1$.'},
{t:'ex', hd:'Example 4.2 — four orthogonal signals', rows:[
 ['Given','Four orthogonal signals of energy $E=4$ and $N_0=1$. $\\mathbf s_1=(2,0,0,0)$ is sent.'],
 ['Find','The density of each correlator output.'],
 ['Method','Only the first correlator sees the signal: $r_1=\\sqrt E+n_1$ and $r_k=n_k$ for $k=2,3,4$.'],
 ['Solution','$f(r_1\\mid\\mathbf s_1)=e^{-(r_1-2)^{2}}/\\sqrt\\pi$ and $f(r_k\\mid\\mathbf s_1)=e^{-r_k^{2}}/\\sqrt\\pi$. Each has variance $0.5$ and peak $1/\\sqrt\\pi=0.56$, and the four are independent.'],
 ['Check','The means $(2,0,0,0)$ have squared length $4=E$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Give every component the mean $\\sqrt E$. Only the correlator matched to the sent signal sees it.'},

{t:'h2', num:'4.2', text:'The decision rule'},
{t:'p', text:'The receiver should name the signal that is most probable once $\\mathbf r$ has been seen. Bayes\' rule writes that probability with the prior $P(\\mathbf s_i)$ and the likelihood $f(\\mathbf r\\mid\\mathbf s_i)$.'},
{t:'eqbox', cap:'Maximum a posteriori (MAP) and maximum likelihood (ML)', tex:[
  'P(\\mathbf s_i\\mid\\mathbf r)=\\frac{P(\\mathbf s_i)\\,f(\\mathbf r\\mid\\mathbf s_i)}{f(\\mathbf r)}',
  '\\text{MAP: }\\hat s=\\arg\\max_iP(\\mathbf s_i)\\,f(\\mathbf r\\mid\\mathbf s_i),\\qquad \\text{ML: }\\hat s=\\arg\\max_if(\\mathbf r\\mid\\mathbf s_i)'],
 after:'The denominator is the same for every $i$, so it cannot change the answer. With equal priors the factor $P(\\mathbf s_i)$ drops too, and MAP becomes ML.'},
{t:'p', text:'For example, let $P(s_1)=0.8$ and $P(s_2)=0.2$. At some $r$ the likelihoods are $0.2$ and $0.5$. MAP compares $0.8(0.2)=0.16$ with $0.2(0.5)=0.10$ and picks $s_1$. ML would pick $s_2$.'},
{t:'fig', svg:()=>{ const p=0.7, tau=0.25*Math.log((1-p)/p), a=ax({w:560,h:210,xr:[-3.2,3.2],yr:[0,0.7],xlabel:'r',ylabel:'P(s_i)\\,f(r\\mid s_i)',xticksOverride:[-2,-1,1,2],yticksOverride:[0.2,0.4]});
  a.curve(r=>(1-p)*gpdf(r,-1,0.5),{color:C.mid,width:2,dash:'7 5'}); a.curve(r=>p*gpdf(r,1,0.5),{color:C.mid,width:2.3});
  a.vline(tau,{color:C.ink,dash:'6 4'}); lab(a,tau-0.1,0.62,'\\tau',C.ink,'end');
  a.point(1,0,{color:C.in,r:4.5}); a.point(-1,0,{color:C.in,r:4.5}); return a.svg(); },
 cap:'$s_1=+1$ with $P(s_1)=0.7$ and $s_2=-1$, $N_0=1$. The receiver picks the taller weighted density, so the crossing $\\tau$ is the threshold. It sits on the side of the less likely signal.'},

{t:'p', text:'The noise components are independent Gaussians of variance $N_0/2$. So the likelihood is a product of $N$ bells, and it depends on $\\mathbf r$ only through the distance to $\\mathbf s_i$.'},
{t:'eqbox', cap:'From likelihood to distance', tex:[
  'f(\\mathbf r\\mid\\mathbf s_i)=\\frac{1}{(\\pi N_0)^{N/2}}\\,e^{-\\|\\mathbf r-\\mathbf s_i\\|^{2}/N_0}',
  '\\hat s=\\arg\\min_i\\Bigl(\\|\\mathbf r-\\mathbf s_i\\|^{2}-N_0\\ln P(\\mathbf s_i)\\Bigr)'],
 after:'Take the logarithm of $P(\\mathbf s_i)f(\\mathbf r\\mid\\mathbf s_i)$, drop the constant, and multiply by $-N_0$. The logarithm is increasing, so the best signal is unchanged.'},
{t:'box', kind:'ok', hd:'Minimum distance', html:'With equal priors the MAP receiver picks the signal point nearest to $\\mathbf r$. Unequal priors subtract $N_0\\ln P(\\mathbf s_i)$ from each squared distance, a handicap in favour of the likely signals.'},
{t:'p', text:'For example, take $\\mathbf r=(0.5,0.3)$ and the four points $(\\pm1,\\pm1)$. The squared distances are $0.74$, $2.74$, $3.94$ and $1.94$, so ML picks $(1,1)$. Now let $N_0=1$, $P(\\mathbf s_4)=0.7$ for $\\mathbf s_4=(1,-1)$, and $0.1$ for the others. The scores become $0.74+\\ln10=3.04$ and $1.94-\\ln0.7=2.30$, and MAP picks $\\mathbf s_4$.'},

{t:'p', text:'Expanding the squared distance gives the form in which a receiver is built. The term $\\|\\mathbf r\\|^{2}$ is the same for every $i$ and drops out.'},
{t:'eqbox', cap:'The correlation metric', tex:[
  '\\|\\mathbf r-\\mathbf s_i\\|^{2}=\\|\\mathbf r\\|^{2}-2\\,\\mathbf r\\cdot\\mathbf s_i+E_i',
  '\\hat s=\\arg\\max_i\\Bigl(\\mathbf r\\cdot\\mathbf s_i-\\frac{E_i}{2}+\\frac{N_0}{2}\\ln P(\\mathbf s_i)\\Bigr)'],
 after:'This is the same rule, written with correlations. With equal energies and equal priors only $\\mathbf r\\cdot\\mathbf s_i$ is left: pick the largest correlation.'},
{t:'box', kind:'warn', hd:'Unequal energies', html:'Keep $-E_i/2$ when the energies differ. Without it the receiver favours the high-energy signals. For four-level PAM at $-3,-1,1,3$ and $r=1.6$, the correlations are $-4.8$, $-1.6$, $1.6$ and $4.8$. The metrics are $-9.3$, $-2.1$, $1.1$ and $0.3$, so the answer is $1$, the nearest level, not $3$.'},

{t:'p', text:'There are two ways to build the receiver. <b>Method I</b> computes $\\mathbf r$ with $N$ correlators and then forms $\\mathbf r\\cdot\\mathbf s_i+a_i$ for each $i$. <b>Method II</b> correlates $r(t)$ with each waveform $s_i(t)$ directly, because inner products are preserved.'},
{t:'eqbox', cap:'The bias of each signal', tex:'a_i=\\frac{N_0}{2}\\ln P(\\mathbf s_i)-\\frac{E_i}{2},\\qquad \\int_0^{T}r(t)\\,s_i(t)\\,dt=\\mathbf r\\cdot\\mathbf s_i',
 after:'The bias is fixed by the priors and the energies before any signal arrives. Method I needs $N$ correlators and Method II needs $M$, so Method I is cheaper whenever $N<M$.'},

{t:'p', text:'Why is MAP the best rule? For one dimension the answer is a picture. The error probability is the area under each weighted density on the wrong side of the threshold.'},
{t:'eqbox', cap:'The error as an area', tex:'P_e(\\tau)=P(s_1)\\int_{-\\infty}^{\\tau}f(r\\mid s_1)\\,dr+P(s_2)\\int_{\\tau}^{\\infty}f(r\\mid s_2)\\,dr',
 after:'Move $\\tau$ right by a small $\\Delta$. The first area gains $P(s_1)f(\\tau\\mid s_1)\\Delta$ and the second loses $P(s_2)f(\\tau\\mid s_2)\\Delta$. No move helps where the two weighted densities are equal, which is the MAP threshold.'},
{t:'p', text:'The same argument works in $N$ dimensions. The probability of a correct decision is $\\sum_iP(\\mathbf s_i)\\int_{R_i}f(\\mathbf r\\mid\\mathbf s_i)\\,d\\mathbf r$. It is largest when each $\\mathbf r$ is given to the signal whose weighted density is largest there. That is the MAP rule, so no other rule has a smaller $P_e$.'},

{t:'ex', hd:'Example 4.3 — a MAP threshold', rows:[
 ['Given','Antipodal $\\pm1$, so $E_b=1$, with $P(s_1)=0.25$ at $+1$, $P(s_2)=0.75$ at $-1$, and $N_0=0.5$.'],
 ['Find','The MAP threshold $\\tau$ and the error probability.'],
 ['Method','Set the two weighted densities equal at $r=\\tau$ and take logarithms. The squares cancel and leave $\\tau=\\dfrac{N_0}{4\\sqrt{E_b}}\\ln\\dfrac{P(s_2)}{P(s_1)}$.'],
 ['Solution','$\\tau=\\tfrac{0.5}{4}\\ln3=0.137$. With $\\sigma=\\sqrt{N_0/2}=0.5$, $P_e=0.25\\,Q(1.73)+0.75\\,Q(2.27)=0.0192$.'],
 ['Check','The threshold moves toward the less likely signal. ML keeps $\\tau=0$ and gets $Q(2)=0.0228$, so MAP is about $16\\%$ better.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Move the threshold toward the likely signal. The likely signal gets the larger region, so $\\tau$ moves toward the less likely one.'},
{t:'fig', svg:()=>{ const tau=Math.log(3)/8, w1=r=>0.25*gpdf(r,1,0.25), w2=r=>0.75*gpdf(r,-1,0.25);
  const a=ax({w:560,h:210,xr:[-2.6,2.6],yr:[0,0.7],xlabel:'r',ylabel:'P(s_i)\\,f(r\\mid s_i)',xticksOverride:[-2,-1,1,2],yticksOverride:[0.2,0.4,0.6]});
  wash(a,w1,-2.6,tau,RED); wash(a,w2,tau,2.6,RED);
  a.curve(w2,{color:C.mid,width:2,dash:'7 5'}); a.curve(w1,{color:C.mid,width:2.3});
  a.vline(tau,{color:C.ink,dash:'6 4'}); lab(a,tau+0.1,0.62,'\\tau=0.137',C.ink);
  return a.svg(); },
 cap:'Example 4.3. The two red areas are the two ways to be wrong. Their sum is $P_e=0.0192$.'},
{t:'ex', hd:'Example 4.4 — a receiver for four waveforms', rows:[
 ['Given','Four equally likely waveforms on $[0,2)$. $s_1=2$ on $[0,1)$ and $s_2=1$ on $[0,2)$. $s_3$ is $-1$ on $[0,1)$ and $1$ on $[1,2)$, and $s_4=-1$ on $[0,2)$. $\\mathbf r=(1.2,0.3)$ arrives.'],
 ['Find','The receiver and its decision.'],
 ['Method','Take $\\psi_1=1$ on $[0,1)$ and $\\psi_2=1$ on $[1,2)$. Then $\\mathbf s_1=(2,0)$, $\\mathbf s_2=(1,1)$, $\\mathbf s_3=(-1,1)$ and $\\mathbf s_4=(-1,-1)$, with energies $4,2,2,2$.'],
 ['Solution','The metrics $\\mathbf r\\cdot\\mathbf s_i-E_i/2$ are $2.4-2=0.4$, $1.5-1=0.5$, $-0.9-1=-1.9$ and $-1.5-1=-2.5$. The largest is $0.5$, so $\\hat s=s_2$.'],
 ['Check','$\\|\\mathbf r-\\mathbf s_1\\|^{2}=0.73$ and $\\|\\mathbf r-\\mathbf s_2\\|^{2}=0.53$, so $\\mathbf s_2$ is also the nearest point. The correlation alone would have picked $s_1$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Drop $-E_i/2$ when the energies differ. The correlation alone picks $s_1$, which is not the nearest point.'},

{t:'h2', num:'4.3', text:'Decision regions'},
{t:'p', text:'Group the observations that give the same answer. The space splits into $M$ <b>decision regions</b>, one for each signal.'},
{t:'eqbox', cap:'A decision region with equal priors', tex:'R_i=\\bigl\\{\\mathbf r:\\ \\|\\mathbf r-\\mathbf s_i\\|<\\|\\mathbf r-\\mathbf s_j\\|\\ \\text{for all }j\\ne i\\bigr\\}',
 after:'The points equally far from $\\mathbf s_i$ and $\\mathbf s_j$ form the perpendicular bisector of the segment between them. Each region is cut out by bisectors, so it is a convex polygon.'},
{t:'p', text:'A point on the edge of the constellation has a region that runs off to infinity. Noise that pushes such a point outward causes no error. Only the neighbours that share a face with a region matter for its boundary.'},
{t:'p', text:'Unequal priors keep the boundaries straight, because the $\\|\\mathbf r\\|^{2}$ terms still cancel. Each boundary moves parallel to itself, toward the less likely point.'},
{t:'eqbox', cap:'Where the boundary sits', tex:'\\mu_i=\\frac{d}{2}+\\frac{N_0}{2d}\\ln\\frac{P(\\mathbf s_i)}{P(\\mathbf s_j)}',
 after:'$\\mu_i$ is the distance from $\\mathbf s_i$ to its boundary with $\\mathbf s_j$, a distance $d$ away. For $d=2$, $N_0=1$ and priors $0.8$ and $0.2$, $\\mu_i=1+\\tfrac14\\ln4=1.35$.'},
{t:'figrow', n:3, items:[
 {svg:()=>regions([[0,0],[1.2,1.2],[-1.2,1.2],[-1.2,-1.2],[1.2,-1.2]],{lim:2.4,h:230}),
  cap:'Five equally likely points. The centre region is the square $|r_1|+|r_2|<1.2$, with four faces.'},
 {svg:()=>regions([[-1.2,-0.7],[1.2,-0.7],[0,1.2]],{lim:2.4,h:230}),
  cap:'Three equally likely points: the boundaries are bisectors.'},
 {svg:()=>regions([[-1.2,-0.7,Math.log(0.2)],[1.2,-0.7,Math.log(0.2)],[0,1.2,Math.log(0.6)]],{lim:2.4,h:230}),
  cap:'The same points with $P(\\mathbf s_3)=0.6$ and $N_0=1$: the likely point takes more of the plane.'}
]},

{t:'p', text:'Two equally likely points a distance $d$ apart give the simplest case. Only the noise along the line through the points can cause an error. That noise has variance $N_0/2$, and an error needs more than $d/2$.'},
{t:'eqbox', cap:'The binary error probability', big:true, tex:'P_e=Q\\!\\left(\\frac{d/2}{\\sqrt{N_0/2}}\\right)=Q\\!\\left(\\sqrt{\\frac{d^{2}}{2N_0}}\\right)',
 after:'Antipodal points have $d=2\\sqrt{E_b}$, so $P_e=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. Orthogonal or on-off points have $d=\\sqrt{2E_b}$, so $P_e=Q\\bigl(\\sqrt{E_b/N_0}\\bigr)$, $3$ dB worse.'},
{t:'p', text:'For example, $d=2$ and $N_0=0.5$ give $d^{2}/2N_0=4$ and $P_e=Q(2)=0.0228$.'},
{t:'fig', svg:()=>{ const a=ax({w:560,h:200,xr:[-3.4,3.4],yr:[0,0.66],xlabel:'r',ylabel:'f(r\\mid s_i)',xticksOverride:[-2,-1,1,2],yticksOverride:[0.25,0.5]});
  wash(a,r=>gpdf(r,-1,0.5),0,3.4,RED);
  a.curve(r=>gpdf(r,-1,0.5),{color:C.out,width:2,dash:'7 5'}); a.curve(r=>gpdf(r,1,0.5),{color:C.out,width:2.3});
  a.vline(0,{color:C.ink,dash:'6 4'}); a.point(-1,0,{color:C.in,r:4.5}); a.point(1,0,{color:C.in,r:4.5});
  return a.svg(); },
 cap:'Two points at $\\pm1$ with $N_0=1$. The red tail of the left density beyond the midpoint is $P_e=Q(\\sqrt2)$.'},
{t:'p', text:'With unequal priors the boundary sits a distance $\\mu$ from $s_1$, and the two tails have different widths. Weight each tail by its prior.'},
{t:'eqbox', cap:'Binary error with unequal priors', tex:[
  'P_e=P(s_0)\\,Q\\!\\left(\\frac{d-\\mu}{\\sqrt{N_0/2}}\\right)+P(s_1)\\,Q\\!\\left(\\frac{\\mu}{\\sqrt{N_0/2}}\\right)',
  '\\mu=\\frac d2+\\frac{N_0}{2d}\\ln\\frac{P(s_1)}{P(s_0)}'],
 after:'Equal priors give $\\mu=d/2$ and the formula above. For $d=2$, $N_0=0.5$ and $P(s_1)=0.9$, $\\mu=1.27$ and $P_e=0.0122$. The midpoint would give $Q(2)=0.0228$.'},

{t:'h2', num:'4.4', text:'Error probability and the union bound'},
{t:'p', text:'The exact error probability sums, over the signals, the part of each Gaussian bell that falls outside its region.'},
{t:'eqbox', cap:'The exact error probability', tex:'P_e=\\sum_{i=1}^{M}P(\\mathbf s_i)\\int_{\\mathbf r\\notin R_i}f(\\mathbf r\\mid\\mathbf s_i)\\,d\\mathbf r',
 after:'For most polygons this integral has no closed form. It needs numerical integration or a simulation.'},
{t:'p', text:'A simulation sends many symbols, adds noise and counts the wrong decisions. The estimate is noisy until about $100$ errors have been counted. At $P_e=10^{-4}$ that takes about $10^{6}$ symbols.'},
{t:'p', text:'Sometimes the integral is easy. In the five-point set of Section 4.3, with corners at $(\\pm1.2,\\pm1.2)$, send the centre with $\\sigma=0.4$. Its region is a square turned by $45^{\\circ}$, and turning the axes with it gives $P(\\text{error}\\mid\\text{centre})=1-\\bigl(1-2Q(1.2/(\\sqrt2\\,\\sigma))\\bigr)^{2}=0.067$.'},

{t:'p', text:'The union bound avoids the integral. Suppose $\\mathbf s_i$ was sent, and let $A_{ij}$ be the event that $\\mathbf r$ is nearer $\\mathbf s_j$ than $\\mathbf s_i$. An error is the union of these events. The probability of a union is at most the sum of the probabilities.'},
{t:'eqbox', cap:'The union bound', tex:[
  'P(\\text{error}\\mid\\mathbf s_i)\\le\\sum_{j\\ne i}P(A_{ij}),\\qquad P(A_{ij})=Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)',
  'P_e\\le\\frac1M\\sum_{i=1}^{M}\\sum_{j\\ne i}Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)'],
 after:'Each $A_{ij}$ is a binary error at distance $d_{ij}$. The sum counts the overlaps of the events more than once, so it can only be larger than $P_e$.'},
{t:'fig', svg:()=>regions([[1,1],[-1,1],[-1,-1],[1,-1]],{lim:2.4,w:400,h:280,cloud:340,sigma:0.42}),
 cap:'The square $(\\pm1,\\pm1)$, its four regions, and the observations when $(1,1)$ is sent. The exact $P_e$ is the fraction of the cloud outside its region.'},
{t:'p', text:'Every $d_{ij}$ is at least $d_{\\min}$, and $Q$ falls. So each term is at most the term at $d_{\\min}$, which gives a bound that needs only $M$ and $d_{\\min}$.'},
{t:'eqbox', cap:'The minimum-distance bound and its exponential form', tex:[
  'P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)',
  'Q(x)\\le\\tfrac12e^{-x^{2}/2}\\quad\\Longrightarrow\\quad P_e\\le\\frac{M-1}{2}\\,e^{-d_{\\min}^{2}/4N_0}'],
 after:'The second line shows that the error falls exponentially in $d_{\\min}^{2}/N_0$. At $x=3$ the exponential bound is $5.6\\times10^{-3}$ against $Q(3)=1.35\\times10^{-3}$, about $4.1$ times larger.'},
{t:'p', text:'For 8-PSK with $E_s=1$, $d_{\\min}=2\\sin(\\pi/8)=0.77$. Only two of the seven other points sit at that distance, so this bound is loose.'},

{t:'p', text:'Two refinements are used in practice. To leave its region, $\\mathbf r$ must cross one of the faces. So the union may run only over the points that share a face with $R_i$. This set is written $F_i$.'},
{t:'eqbox', cap:'The intelligent union bound and the nearest-neighbour form', tex:[
  'P(\\text{error}\\mid\\mathbf s_i)\\le\\sum_{j\\in F_i}Q\\!\\left(\\sqrt{\\frac{d_{ij}^{2}}{2N_0}}\\right)',
  'P_e\\approx\\bar N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'],
 after:'The first line is still a bound. The second keeps only the terms at $d_{\\min}$, weighted by $\\bar N_{\\min}$, the average number of neighbours at $d_{\\min}$. It is an approximation, not a bound, and it can fall below the exact $P_e$.'},
{t:'p', text:'In 16-QAM on the grid $\\pm1,\\pm3$ the four corners have two neighbours at $d_{\\min}=2$, the eight edge points three, and the four inner points four. So $\\bar N_{\\min}=(4\\cdot2+8\\cdot3+4\\cdot4)/16=3$.'},

{t:'ex', hd:'Example 4.5 — four forms on QPSK', rows:[
 ['Given','QPSK at $(\\pm1,\\pm1)$, equally likely, with $N_0=2/9$, so $d_{\\min}^{2}/2N_0=9$.'],
 ['Find','The general bound, the intelligent bound, the nearest-neighbour form and the minimum-distance bound.'],
 ['Method','From $(1,1)$, two points are at $d=2$, giving $x=3$, and one is at $2\\sqrt2$, giving $x=\\sqrt{18}=4.24$. The region of $(1,1)$ is a quadrant with two faces. All four points are alike.'],
 ['Solution','General: $2Q(3)+Q(4.24)=2.71\\times10^{-3}$. Intelligent and nearest neighbour: $2Q(3)=2.70\\times10^{-3}$. Minimum distance: $3Q(3)=4.05\\times10^{-3}$.'],
 ['Check','The exact value is $1-\\bigl(1-Q(3)\\bigr)^{2}=2.70\\times10^{-3}$. The diagonal term adds only $0.4\\%$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Count the diagonal point as a nearest neighbour. That gives $\\bar N_{\\min}=3$ and a value $50\\%$ too high.'},
{t:'ex', hd:'Example 4.6 — a rectangle', rows:[
 ['Given','Four equally likely points $(\\pm1.5,\\pm1)$ with $N_0=0.4$.'],
 ['Find','The intelligent bound and the nearest-neighbour form.'],
 ['Method','From $(1.5,1)$ the others are at $3$, $2$ and $\\sqrt{13}$. The region is a quadrant. Its faces are shared with the points at $3$ and $2$. Each $Q$ argument is $d/\\sqrt{2N_0}=d/\\sqrt{0.8}$.'],
 ['Solution','Intelligent: $Q(2.24)+Q(3.35)=1.31\\times10^{-2}$. Nearest neighbour, with $\\bar N_{\\min}=1$: $Q(2.24)=1.27\\times10^{-2}$.'],
 ['Check','The exact value is $1.31\\times10^{-2}$. The nearest-neighbour form is $3\\%$ below it, because it drops a face shared with a point beyond $d_{\\min}$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Treat the nearest-neighbour form as a bound. Here it is below the exact value.'},

{t:'p', text:'How tight are these forms? At low SNR many terms are large and they overlap. For 16-QAM with $E_s=10$ at $E_s/N_0=0$ dB, the general union bound gives $2.79$, which says nothing about a probability.'},
{t:'fig', svg:()=>{
  const pts=[]; for(const x of [-3,-1,1,3]) for(const y of [-3,-1,1,3]) pts.push([x,y]);
  const D={}; pts.forEach(p=>pts.forEach(q=>{ if(p===q) return; const k=(p[0]-q[0])**2+(p[1]-q[1])**2; D[k]=(D[k]||0)+1/16; }));
  const N0=db=>10/Math.pow(10,db/10), lg=v=>Math.log10(Math.max(1e-9,v));
  const gen=db=>Object.entries(D).reduce((s,[k,c])=>s+c*Q(Math.sqrt(+k/(2*N0(db)))),0);
  const a=ax({w:560,h:230,xr:[0,18],yr:[-5,0.8],xlabel:'E_s/N_0\\;(\\text{dB})',ylabel:'P_e',ytickfmt:P.decade,yticksOverride:[-4,-3,-2,-1],xticksOverride:[3,6,9,12,15],zeroAxes:false});
  a.hline(0,{color:C.muted,dash:'2 4'});
  const cut=v=>v<-5?NaN:v;
  a.curve(db=>cut(lg(15*Q(Math.sqrt(4/(2*N0(db)))))),{color:C.err,width:1.8,dash:'2 5'});
  a.curve(db=>cut(lg(gen(db))),{color:C.err,width:2.3});
  a.curve(db=>cut(lg(3*Q(Math.sqrt(4/(2*N0(db)))))),{color:C.mid,width:2,dash:'7 5'});
  return a.svg(); },
 cap:'16-QAM with $E_s=10$. Solid: the general union bound. Dashed: the nearest-neighbour form. Dotted: the minimum-distance bound, which counts all $15$ other points and stays five times too high. The dashed line at the top is $P_e=1$.'},
{t:'box', kind:'ok', hd:'At high SNR', html:'The terms at $d_{\\min}$ dominate. The union bound and the nearest-neighbour form meet, and both approach the exact error probability. Designers quote $\\bar N_{\\min}Q\\bigl(\\sqrt{d_{\\min}^{2}/2N_0}\\bigr)$.'},

{t:'h2', num:'4.5', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Bits and symbols','$k=\\log_2M$, $R_b=kR_s$, $T_b=T/k$','PS CH8.4'],
 ['Observation','$\\mathbf r=\\mathbf s_i+\\mathbf n$ from $N$ correlators or matched filters sampled at $t=T$','PS CH8.4.1'],
 ['Sufficient statistics','the noise outside the signal space adds the same $\\|n\'\\|^{2}$ to every distance','PS CH8.4.1'],
 ['Noise components','independent, each $\\mathcal N(0,N_0/2)$','PS CH8.4.1'],
 ['MAP and ML','maximise $P(\\mathbf s_i)f(\\mathbf r\\mid\\mathbf s_i)$; equal priors give ML','PS CH8.4.1'],
 ['Minimum distance','minimise $\\|\\mathbf r-\\mathbf s_i\\|^{2}-N_0\\ln P(\\mathbf s_i)$','PS CH8.4.1'],
 ['Correlation metric','maximise $\\mathbf r\\cdot\\mathbf s_i-E_i/2+\\frac{N_0}{2}\\ln P(\\mathbf s_i)$','PS CH8.4.1'],
 ['Optimality','MAP regions give the smallest $P_e$','PS CH8.4.1'],
 ['Regions','convex polygons cut by bisectors, shifted by unequal priors','PS CH8.4.1'],
 ['Binary error','$Q\\bigl(\\sqrt{d^{2}/2N_0}\\bigr)$, and two weighted tails with unequal priors','PS CH8.3.3'],
 ['Union bound','$P_e\\le\\frac1M\\sum_i\\sum_{j\\ne i}Q\\bigl(\\sqrt{d_{ij}^{2}/2N_0}\\bigr)$','PS CH8.4.2'],
 ['Minimum-distance bound','$(M-1)Q\\bigl(\\sqrt{d_{\\min}^{2}/2N_0}\\bigr)\\le\\frac{M-1}{2}e^{-d_{\\min}^{2}/4N_0}$','PS CH8.4.2'],
 ['Intelligent bound','sum only over the points that share a face',''],
 ['Nearest neighbours','$P_e\\approx\\bar N_{\\min}Q\\bigl(\\sqrt{d_{\\min}^{2}/2N_0}\\bigr)$, not a bound','']
]},
{t:'p', text:'The receiver correlates to find $\\mathbf r$ and picks the best metric, the nearest point when the priors are equal. Its error probability depends on the distances between the points, and $d_{\\min}$ with $\\bar N_{\\min}$ describes it at high SNR. Chapter 5 compares these two numbers for the common modulations at the same energy.'}

];
})();
