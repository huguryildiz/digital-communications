/* Course notes — Chapter 2. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:52,r:20,t:18,b:34},xtarget:8,ytarget:3},o));
const sinc=x=>Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);
function Q(x){ const t=1/(1+0.2316419*Math.abs(x));
  const d=0.3989422804014327*Math.exp(-x*x/2);
  const p=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0?p:1-p; }

window.C2 = [

{t:'h1', num:'CHAPTER 2', text:'Baseband transmission of digital signals'},
{t:'p', lead:true, text:'Chapter 1 produced a stream of bits. Each bit now becomes a waveform, and the channel adds noise. The receiver must identify the transmitted waveform. This chapter selects the receiver filter and decision threshold. It also studies pulse overlap in a bandlimited channel.'},

{t:'h2', num:'2.1', text:'The matched filter'},
{t:'p', text:'Over one bit interval the receiver sees $x(t)=g(t)+w(t)$, the waveform plus white Gaussian noise of two-sided density $N_0/2$. It passes this through a filter and takes one sample at the end of the interval. Because the filter is linear, its output splits the same way, into a signal part $g_0(t)=g*h$ and a noise part $n(t)=w*h$.'},
{t:'p', text:'The quantity worth maximising is the signal at the sampling instant against the noise power that accompanies it.'},
{t:'eqbox', cap:'The peak pulse signal-to-noise ratio',
 tex:'(\\mathrm{SNR})_o=\\frac{|g_0(T)|^{2}}{E[n^{2}(t)]}=\\frac{\\left|\\int_{-\\infty}^{\\infty}G(f)H(f)e^{j2\\pi fT}df\\right|^{2}}{\\dfrac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^{2}df}',
 after:'Scaling $H$ up multiplies the top and the bottom by the same factor, so the answer cannot be "make $H$ large". What is being chosen is the shape of $H$.'},
{t:'p', text:'Schwarz\'s inequality says that $\\left|\\int\\phi_1\\phi_2\\right|^{2}\\le\\int|\\phi_1|^{2}\\int|\\phi_2|^{2}$, with equality only when $\\phi_1=k\\phi_2^{*}$. Taking $\\phi_1=H(f)$ and $\\phi_2=G(f)e^{j2\\pi fT}$, the factor $\\int|H|^{2}$ cancels between the top and the bottom and a bound appears that contains no $H$ at all.'},
{t:'eqbox', cap:'The bound, and the filter that reaches it', tex:[
  '(\\mathrm{SNR})_o\\le\\frac{2}{N_0}\\int|G(f)|^{2}df=\\frac{2E}{N_0}',
  'H(f)=k\\,G^{*}(f)e^{-j2\\pi fT}\\quad\\Longleftrightarrow\\quad h_{\\mathrm{opt}}(t)=k\\,g(T-t)'],
 after:'The optimum filter is the transmitted waveform reversed in time and shifted into the interval. It is called the <b>matched filter</b>.'},
{t:'box', kind:'ok', hd:'Two things this says', html:'The best achievable ratio is $2E/N_0$. It depends on the <b>energy</b> of the pulse and on the noise density, and on nothing else about the pulse. Two completely different waveforms of the same energy perform identically. The constant $k$ cancels. Therefore, the filter is fixed only up to a gain.'},

{t:'figrow', n:2, items:[
 {svg:()=>{const a=ax({w:330,h:190,xr:[-0.3,2.3],yr:[-0.3,1.35],xlabel:'t/T',
    ylabel:'s(t),\\;y(t)',xtarget:4,ytarget:3});
   a.poly([[-0.3,0],[0,0],[0,1],[1,1],[1,0],[2.3,0]],{color:C.in,width:2.1});
   a.curve(t=>t<0?0:t<1?t:t<2?2-t:0,{color:C.out,width:2.3});
   return a.svg();},
  cap:'A rectangular pulse and the output of the filter matched to it. The output peaks at exactly $t=T$, and its peak is the energy of the pulse.'},
 {svg:()=>{const a=ax({w:330,h:190,xr:[-0.2,1.2],yr:[-0.2,2.4],xlabel:'t/T',ylabel:'s(t)',
    xtarget:4,ytarget:3});
   a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[1.2,0]],{color:C.in,width:2.1});
   a.curve(t=>t>0&&t<1?Math.SQRT2*Math.sin(Math.PI*t):0,{color:C.mid,width:2.1});
   a.poly([[-0.2,0],[0,0],[0.5,2],[1,0],[1.2,0]],{color:C.h,width:2.1,dash:'6 4'});
   return a.svg();},
  cap:'Three pulses of the same energy. Against white Gaussian noise a matched-filter receiver performs identically on all three.'}
]},

{t:'h2', num:'2.2', text:'From waveform to number'},
{t:'p', text:'Both waveforms of a binary baseband system are multiples of one shape, so a single unit-energy function carries both. With $\\psi(t)=1/\\sqrt{T_b}$ on the bit interval, polar NRZ is $s_m(t)=s_m\\psi(t)$ with $s_0=-A\\sqrt{T_b}$ and $s_1=+A\\sqrt{T_b}$. Both carry energy $E_b=A^{2}T_b$, so $A\\sqrt{T_b}=\\sqrt{E_b}$ and the two waveforms have become two <em>numbers</em>, $\\pm\\sqrt{E_b}$, on one axis.'},
{t:'p', text:'The demodulator can be built two ways. The <b>matched filter</b> convolves with $\\psi(T_b-t)$ and samples at $T_b$. The <b>correlator</b> multiplies by $\\psi(t)$ and integrates over the interval. At the sampling instant the two produce the same number. This occurs because convolving with a reversed function and evaluating at the end of the interval <em>is</em> correlating over it.'},
{t:'eqbox', cap:'The decision statistic',
 tex:'y=\\int_0^{T_b}x(\\tau)\\psi(\\tau)\\,d\\tau=s_m\\underbrace{\\int_0^{T_b}\\psi^{2}}_{=1}+\\underbrace{\\int_0^{T_b}w\\psi}_{n}=s_m+n',
 after:'They agree at $t=T_b$ and nowhere else, which is one more reason the sampling instant matters.'},

{t:'h2', num:'2.3', text:'The decision and its error probability'},
{t:'p', text:'The noise term is a projection of a Gaussian process onto a fixed function, so it is a Gaussian random variable. Its variance follows from $E[w(\\tau)w(u)]=\\frac{N_0}{2}\\delta(\\tau-u)$ and the sifting property, and the unit energy of $\\psi$ makes the answer independent of the interval length.'},
{t:'eqbox', cap:'What the detector is given', tex:[
  '\\sigma_n^{2}=\\frac{N_0}{2}\\int_0^{T_b}\\psi^{2}(\\tau)d\\tau=\\frac{N_0}{2}',
  'y=s_m+n\\;\\sim\\;\\mathcal{N}\\!\\left(s_m,\\;\\frac{N_0}{2}\\right)'],
 after:'The two-sided convention arrives here unchanged. Reading the density as one-sided makes every error probability in the course $3$ dB too optimistic, and nothing in the algebra shows it.'},
{t:'p', text:'The detector decides "1" when $y>\\lambda$. Write the average error as two integrals. Differentiate with respect to $\\lambda$ by the Leibniz rule. Set the derivative to zero. The result places the threshold where the two prior-weighted densities cross.'},
{t:'eqbox', cap:'The optimal threshold', tex:[
  'P(s_1)f_Y(\\lambda\\mid s_1)=P(s_0)f_Y(\\lambda\\mid s_0)',
  '\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_0)}{P(s_1)}'],
 after:'Equal priors put the threshold at the midpoint. If $s_0$ is more likely, the threshold moves in the positive direction. This movement enlarges the decision region for $s_0$.'},

{t:'figrow', n:2, items:[
 {svg:()=>{const s=Math.sqrt(0.5);
   const g=(y,m)=>Math.exp(-(y-m)*(y-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
   const a=ax({w:330,h:200,xr:[-3.2,3.2],yr:[-0.05,0.65],xlabel:'y',
     ylabel:'P(s_m)f_Y(y\\mid s_m)',xtarget:5,ytarget:3});
   a.rect(-3.2,0,0,0.62,{fill:C.dec.err}); a.rect(0,0,3.2,0.62,{fill:C.dec.out});
   a.curve(y=>0.5*g(y,-1),{color:C.err,width:2}); a.curve(y=>0.5*g(y,1),{color:C.out,width:2});
   a.vline(0,{color:C.ink,dash:'5 4'}); return a.svg();},
  cap:'Equal priors: the threshold sits midway and the shaded decision regions are symmetric.'},
 {svg:()=>{const s=Math.sqrt(0.5);
   const g=(y,m)=>Math.exp(-(y-m)*(y-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
   const a=ax({w:330,h:200,xr:[-3.2,3.2],yr:[-0.05,0.72],xlabel:'y',
     ylabel:'P(s_m)f_Y(y\\mid s_m)',xtarget:5,ytarget:3});
   a.rect(-3.2,0,0.35,0.70,{fill:C.dec.err}); a.rect(0.35,0,3.2,0.70,{fill:C.dec.out});
   a.curve(y=>0.7*g(y,-1),{color:C.err,width:2}); a.curve(y=>0.3*g(y,1),{color:C.out,width:2});
   a.vline(0.35,{color:C.ink,dash:'5 4'}); return a.svg();},
  cap:'$P(s_0)=0.7$: the more likely symbol\'s curve is taller and the crossing has moved towards the less likely one.'}
]},

{t:'p', text:'With equal priors the threshold is at the origin and both conditional errors are the same Gaussian tail, using $P(Y>y)=Q\\!\\left(\\frac{y-\\mu}{\\sigma}\\right)$ and $Q(-x)=1-Q(x)$.'},
{t:'eqbox', cap:'The result of the chapter', big:true,
 tex:'P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)',
 after:'It depends on $E_b/N_0$ and on nothing else — not on the amplitude, not on the bit duration, not on the pulse shape. Doubling the amplitude and quartering the duration change neither the energy per bit nor the answer.'},
{t:'box', kind:'warn', hd:'Antipodal and orthogonal signals', html:'Antipodal signaling gives $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$. On-off or orthogonal signaling gives $Q\\!\\left(\\sqrt{E_b/N_0}\\right)$ and needs $3$ dB more energy. For on-off signaling, half the symbols have zero energy. Therefore, average bit energy is half the nonzero-symbol energy.'},

{t:'fig', svg:()=>{
  const a=ax({w:560,h:250,xr:[0,12],yr:[-7,-0.02],xlabel:'E_b/N_0\\;(\\mathrm{dB})',
    ylabel:'P_b',ytickfmt:P.decade,yticksOverride:P.decades(-7,-1),zeroAxes:false,xtarget:6,ytarget:6,pad:{l:56,r:22,t:20,b:38}});
  a.curve(d=>Math.log10(Math.max(1e-12,Q(Math.sqrt(2*Math.pow(10,d/10))))),
    {color:C.in,width:2.3});
  return a.svg();
}, cap:'Bit error probability against $E_b/N_0$. Past about $8$ dB every extra decibel is worth roughly an order of magnitude in error rate.'},

{t:'ex', hd:'Example 2.1 — unequal priors', rows:[
 ['Given','A binary PAM system with correlator output $y=\\pm\\sqrt{E_b}+n$, where $P(s_1)=0.3$, $E_b=1$ and $N_0=0.1$.'],
 ['Find','The optimal threshold and the average error probability there.'],
 ['Method','Threshold from the log-ratio of the priors. Each conditional error from a Gaussian tail. Average by weighting.'],
 ['Solution','$\\lambda=\\frac{0.1}{4}\\ln\\frac{0.7}{0.3}=0.0212$ and $\\sigma=\\sqrt{0.05}=0.2236$. Then $P(\\text{err}\\mid s_0)=Q(4.567)=2.475\\times10^{-6}$ and $P(\\text{err}\\mid s_1)=Q(4.377)=6.005\\times10^{-6}$, so $P_e=0.7(2.475)+0.3(6.005)$ in units of $10^{-6}$, giving $3.534\\times10^{-6}$.'],
 ['Check','Leaving the threshold at zero would give $Q(\\sqrt{20})=3.872\\times10^{-6}$. Moving it improves the answer by about nine per cent. A real gain and a small one. This is what a shift of a tenth of a standard deviation buys.']
]},

{t:'page'},

{t:'h2', num:'2.4', text:'Intersymbol interference'},
{t:'p', text:'Everything above assumed an ideal channel. A real bandlimited channel spreads each pulse in time. Therefore, one pulse can enter adjacent symbol intervals. Write the received signal as a train of the overall pulse $p$. Sampling at $t_i=iT_b$ separates the wanted pulse from intersymbol interference.'},
{t:'eqbox', cap:'Where the interference comes from',
 tex:'y(t_i)=\\underbrace{\\mu a_i}_{\\text{wanted}}+\\underbrace{\\mu\\sum_{k\\ne i}a_k\\,p\\bigl((i-k)T_b\\bigr)}_{\\text{intersymbol interference}}+\\;n(t_i)',
 after:'The middle term is not noise. It is caused by the data itself, and raising the transmit power raises it by the same factor, so more power does not help. At high signal-to-noise ratio it is the only thing limiting the system.'},
{t:'p', text:'An <b>eye pattern</b> shows this interference. Divide the received waveform into bit-length segments. Align the segments with the clock and draw them together. The opening height gives the noise margin. Its width gives the permitted sampling-time error. Crossing slope shows timing sensitivity, and crossing spread shows timing jitter. A closed eye has no sampling time that gives correct decisions for every bit pattern.'},

{t:'figrow', n:2, items:[
 {svg:()=>{
   const p=t=>{const den=1-4*t*t; return Math.abs(den)<1e-6?sinc(t)*Math.PI/4:sinc(t)*Math.cos(Math.PI*t)/den;};
   const a=ax({w:330,h:210,xr:[-1,1],yr:[-1.7,1.7],xlabel:'t/T_b',ylabel:'y(t)',xtarget:4,ytarget:3});
   for(let pat=0;pat<32;pat++){ const b=[]; for(let k=0;k<5;k++) b.push(((pat>>k)&1)?1:-1);
     const pts=[]; for(let i=0;i<=80;i++){ const t=-1+2*i/80;
       let s=0; for(let k=0;k<5;k++) s+=b[k]*p(t-(k-2)); pts.push([t,s]); }
     a.poly(pts,{color:C.in,width:0.85,opacity:0.5}); }
   return a.svg();}, cap:'A wide-open eye: a pulse that decays quickly. Every trace passes close to $\\pm1$ at the centre.'},
 {svg:()=>{
   const p=t=>sinc(t);
   const a=ax({w:330,h:210,xr:[-1,1],yr:[-1.7,1.7],xlabel:'t/T_b',ylabel:'y(t)',xtarget:4,ytarget:3});
   for(let pat=0;pat<32;pat++){ const b=[]; for(let k=0;k<5;k++) b.push(((pat>>k)&1)?1:-1);
     const pts=[]; for(let i=0;i<=80;i++){ const t=-1+2*i/80;
       let s=0; for(let k=0;k<5;k++) s+=b[k]*p(t-(k-2)); pts.push([t,s]); }
     a.poly(pts,{color:C.in,width:0.85,opacity:0.5}); }
   return a.svg();}, cap:'A slowly decaying pulse. The opening has narrowed and the crossings have scattered, with the noise unchanged.'}
]},

{t:'h2', num:'2.5', text:'Nyquist\'s criterion and the raised cosine'},
{t:'p', text:'The interference vanishes exactly when the overall pulse is zero at every sampling instant but its own. Sampling $p$ at those instants and transforming turns that requirement into a statement about the spectrum.'},
{t:'eqbox', cap:'Nyquist\'s criterion for distortionless transmission', tex:[
  'p\\bigl((i-k)T_b\\bigr)=\\begin{cases}1,&i=k\\\\0,&i\\ne k\\end{cases}',
  'R_b\\sum_n P(f-nR_b)=1,\\qquad R_b=\\frac{1}{T_b}'],
 after:'In words: the replicas of the pulse spectrum, spaced by the symbol rate, must add to a constant. The simplest spectrum that does it is a rectangle of width $2W$ with $W=R_b/2$, the <b>Nyquist bandwidth</b>, whose pulse is $\\operatorname{sinc}(2Wt)$.'},
{t:'box', kind:'ok', hd:'The rate a bandwidth supports', html:'A channel of bandwidth $W$ carries at most $2W$ symbols per second with no interference. This is the counterpart of the sampling theorem, reached from the other end of the same argument.'},
{t:'p', text:'The ideal Nyquist channel cannot be built. Its spectrum has vertical edges, and its pulse decays only as $1/t$. Therefore, a small timing error lets a long tail of neighbours contribute at once. The fix is to widen the spectrum and taper its edges while keeping the tiling property.'},
{t:'eqbox', cap:'The raised cosine', tex:[
  'P(f)=\\begin{cases}\\dfrac{1}{2W},&0\\le|f|\\le f_1\\\\[6pt]\\dfrac{1}{4W}\\left[1-\\sin\\dfrac{\\pi(|f|-W)}{2W-2f_1}\\right],&f_1\\le|f|<2W-f_1\\\\[6pt]0,&\\text{otherwise}\\end{cases}',
  'p(t)=\\operatorname{sinc}(2Wt)\\,\\frac{\\cos(2\\pi\\alpha Wt)}{1-16\\alpha^{2}W^{2}t^{2}},\\qquad \\alpha=1-\\frac{f_1}{W}'],
 after:'The first factor keeps the zero crossings at $t=iT_b$, so the criterion still holds. The second decays as $1/t^{2}$. The price is bandwidth: $B_T=(1+\\alpha)W$, an excess of $\\alpha W$ over Nyquist.'},

{t:'figrow', n:2, items:[
 {svg:()=>{const a=ax({w:330,h:190,xr:[-2.2,2.2],yr:[-0.12,1.2],xlabel:'f/W',
    ylabel:'2W\\,P(f)',xtarget:5,ytarget:3});
   const rc=(f,al)=>{const u=Math.abs(f); if(al===0) return u<=1?1:0;
     const f1=1-al; if(u<=f1) return 1;
     if(u<2-f1) return 0.5*(1-Math.sin(Math.PI*(u-1)/(2-2*f1))); return 0;};
   [[0,C.in],[0.5,C.h],[1,C.out]].forEach(([al,col])=>a.curve(f=>rc(f,al),{color:col,width:2}));
   return a.svg();}, cap:'The spectrum at $\\alpha=0$, $0.5$ and $1$. All three tile the axis at spacing $2W$, so all three give zero interference.'},
 {svg:()=>{const a=ax({w:330,h:190,xr:[-3.4,3.4],yr:[-0.35,1.25],xlabel:'t/T_b',
    ylabel:'p(t)',xtarget:6,ytarget:3});
   const pl=(al,col)=>a.curve(t=>{const den=1-4*al*al*t*t;
     return Math.abs(den)<1e-6?sinc(t)*Math.PI/4:sinc(t)*Math.cos(Math.PI*al*t)/den;},
     {color:col,width:2});
   pl(0,C.in); pl(0.5,C.h); pl(1,C.out); return a.svg();},
  cap:'Their pulses. All three vanish at every non-zero multiple of $T_b$. The tails differ by orders of magnitude.'}
]},

{t:'ex', hd:'Example 2.2 — fitting a rate into a channel', rows:[
 ['Given','A channel of bandwidth $48$ kHz is to carry $64$ kbit/s with raised-cosine shaping.'],
 ['Find','The Nyquist bandwidth and the largest roll-off that fits.'],
 ['Method','$W=R_b/2$, then $(1+\\alpha)W\\le B$.'],
 ['Solution','$W=32$ kHz, and $(1+\\alpha)(32)\\le48$ gives $\\alpha\\le0.5$. At $\\alpha=0.5$ the signal uses the whole $48$ kHz, with an excess of $16$ kHz over the Nyquist bandwidth.'],
 ['Check','At $\\alpha=0$, the signal needs only $32$ kHz and still fits. However, its pulse decays as $1/t$, and its ideal filter cannot be built. Using the available bandwidth gives a pulse that decays as $1/t^{3}$. The spectral efficiency is $64/48=1.33$ bit/s/Hz, below the theoretical maximum of $2$.']
]},

{t:'h2', num:'2.6', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Matched filter','$h_{\\mathrm{opt}}(t)=g(T-t)$','PS CH8.3.2'],
 ['What it achieves','$(\\mathrm{SNR})_o=2E/N_0$, independent of the pulse shape','PS CH8.3.2'],
 ['Decision statistic','$y=s_m+n$, $\\;n\\sim\\mathcal{N}(0,N_0/2)$','PS CH8.3.1'],
 ['Optimal threshold','$\\lambda=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_0)}{P(s_1)}$','PS CH8.3.3'],
 ['Antipodal error','$P_b=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$','PS CH8.3.3'],
 ['On-off error','$P_b=Q\\!\\left(\\sqrt{E_b/N_0}\\right)$, three decibels worse','PS CH8.3.3'],
 ['Nyquist criterion','$R_b\\sum_n P(f-nR_b)=1$','PS CH10.3.1'],
 ['Raised cosine','$B_T=(1+\\alpha)W$','PS CH10.3.1']
]},
{t:'p', text:'Two waveforms have become two points on a line, and the error probability has turned out to depend on the distance between them. Chapter 3 asks what happens when there are more than two waveforms, and finds that the same picture works with more axes.'}

];
})();
