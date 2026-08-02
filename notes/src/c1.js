/* Course notes — front matter and Chapter 1.

   The front matter lives here because chapter 1 is the first chapter file the
   builder finds. It moves to `c0.js` when the course opening is written.
   The contents lists the chapters that exist; it grows as they are added. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:48,r:20,t:18,b:32},xtarget:8,ytarget:3},o));
const tri=(f,W,h)=>Math.abs(f)<W ? h*(1-Math.abs(f)/W) : 0;
const sinc=x=>Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);

window.C1 = [

/* ---------------- title ---------------- */
{t:'title', kicker:'EE 413 · Communication Systems II', text:'Digital Communications',
 sub:'Lecture notes for the whole course: how a waveform becomes a finite alphabet of symbols, how those symbols are carried across a channel that adds noise to everything, how a receiver decides which one was sent, and how often it is wrong.',
 meta:[['Covers','Chapters 1 to 6, and appendix A'],['Level','Undergraduate'],
       ['Assumed background','Fourier analysis, probability, random processes']]},

{t:'h3', text:'How to read these notes'},
{t:'p', text:'Every chapter builds on the one before it. Within a chapter, each idea arrives in the same order: a picture, a definition, an equation, a short derivation, a worked example, and a warning about the mistake that is easiest to make. Worked examples use five headings — Given, Find, Method, Solution, Check. Do the Check step yourself before reading it.'},
{t:'p', text:'Two conventions apply everywhere and both are worth fixing now, because getting either wrong costs a factor of two that nothing on the page reveals. Noise is white and Gaussian with <b>two-sided</b> power spectral density $N_0/2$ watts per hertz. The Gaussian tail is $Q(x)=\\frac{1}{\\sqrt{2\\pi}}\\int_x^{\\infty}e^{-t^{2}/2}\\,dt=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$. Energy and power are normalised, with $R=1\\ \\Omega$.'},
{t:'p', text:'The contents below carries a third column. An entry such as <b>PS CH7.2.1</b> points into the course textbook, Proakis and Salehi, <i>Fundamentals of Communication Systems</i>, second edition, where the same material is developed at length. The <b>PS</b> marker is what tells the two apart, and it is not decorative: these notes reach information theory in chapter 6 and the textbook develops it in chapter 12, while the textbook\'s own chapter 12 heading is nowhere near what a bare number would suggest.'},

{t:'toc', items:[
 ['1','The transition from analog to digital','Impulse-train sampling and the replication of the spectrum. The sampling theorem. Reconstruction and sinc interpolation. Uniform quantization, the error it makes, and the signal-to-quantization-noise ratio. Companding. Encoding, line codes and pulse code modulation.','PS CH7.1&ndash;7.4'],
 ['2','Baseband transmission of digital signals','The matched filter and what it achieves. Correlator and matched-filter demodulators. The decision statistic, the optimal threshold and the bit error probability. Intersymbol interference and the eye pattern. Nyquist\'s criterion and the raised cosine.','PS CH8.2&ndash;8.3, PS CH10.1, PS CH10.3'],
 ['3','Geometric representation of signal waveforms','Signals as vectors. Orthonormal bases, coordinates, energy and distance. The constellation diagram. The Gram&ndash;Schmidt procedure.','PS CH8.1'],
 ['4','The optimal receiver in additive white Gaussian noise','What the correlator bank keeps. The MAP and ML rules. Minimum-distance detection and the receiver that computes it. Decision regions. The union bound and the nearest-neighbour approximation.','PS CH8.3&ndash;8.4'],
 ['5','Digital modulation methods','The three binary schemes and the three decibels between them. M-ary phase-shift keying and what each extra bit costs. Amplitude-shift keying on a line, quadrature amplitude modulation on a grid, and frequency-shift keying in M dimensions.','PS CH8.5&ndash;8.7, PS CH9.5'],
 ['6','An introduction to information theory','Self-information and entropy. Extended sources. Average codeword length and coding efficiency. Uniquely decodable and prefix codes, the Kraft inequality, and how close to the entropy a code can get. Huffman coding, its ties and its variance.','PS CH12.1&ndash;12.3'],
 ['A','Summary of formulas','Everything the course establishes, in the order it establishes it, with no derivations.','&mdash;']
]},

{t:'page'},

/* ================= CHAPTER 1 ================= */
{t:'h1', num:'CHAPTER 1', text:'The transition from analog to digital'},
{t:'p', lead:true, text:'A continuous waveform becomes a bit stream in three steps: sampling makes it discrete in time, quantization makes it discrete in amplitude, and encoding replaces each amplitude by a word of bits. Only the first of the three can be undone, and this chapter is largely about what that means.'},

{t:'h2', num:'1.1', text:'Impulse-train sampling'},
{t:'p', text:'Sampling every $T_s$ seconds is multiplication by a train of impulses. Write $f_s=1/T_s$ for the sampling frequency.'},
{t:'eqbox', cap:'The ideal sampled signal', tex:[
  'p(t)=\\sum_{n=-\\infty}^{\\infty}\\delta(t-nT_s)',
  'g_\\delta(t)=g(t)\\,p(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\,\\delta(t-nT_s)'],
 after:'The second line uses the sampling property $g(t)\\delta(t-t_0)=g(t_0)\\delta(t-t_0)$, which turns the product under the sum into a number.'},
{t:'p', text:'What makes this worth writing is that $g_\\delta$ is a continuous-time signal, not a sequence, so it has a Fourier transform. A product in time is a convolution in frequency, and the transform of an impulse train is another impulse train:'},
{t:'eq', tex:'P(f)=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)=f_s\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)'},
{t:'p', text:'The coefficient is the Fourier-series coefficient of $p(t)$, and it is the same for every harmonic: $a_k=\\frac{1}{T_s}\\int_{-T_s/2}^{T_s/2}\\delta(t)e^{-j2\\pi kf_0t}\\,dt=\\frac{1}{T_s}$, by the sifting property. Convolving $G$ with that train gives the result the rest of the chapter rests on.'},
{t:'eqbox', cap:'Sampling replicates the spectrum',
 tex:'G_\\delta(f)=f_s\\sum_{n=-\\infty}^{\\infty}G(f-nf_s)',
 after:'Sampling copies the spectrum to every multiple of $f_s$ and scales it by $f_s$. Nothing is lost provided the copies do not overlap.'},

{t:'figrow', n:3, items:[
 {svg:()=>{const a=ax({w:340,h:170,xr:[-3.3,3.3],yr:[-0.4,4.0],xlabel:'f',ylabel:'G_\\delta(f)',
    xtarget:4,ytarget:3,xtickfmt:v=>P.fmt(v,2)+'W',ytickfmt:()=>''});
   for(let n=-1;n<=1;n++) a.curve(f=>3*tri(f-3*n,1,1),{color:n?C.mid:C.in,width:n?1.7:2.2});
   return a.svg();}, cap:'$f_s>2W$: a gap between the replicas.'},
 {svg:()=>{const a=ax({w:340,h:170,xr:[-3.3,3.3],yr:[-0.4,2.7],xlabel:'f',ylabel:'G_\\delta(f)',
    xtarget:4,ytarget:3,xtickfmt:v=>P.fmt(v,2)+'W',ytickfmt:()=>''});
   for(let n=-1;n<=1;n++) a.curve(f=>2*tri(f-2*n,1,1),{color:n?C.mid:C.in,width:n?1.7:2.2});
   return a.svg();}, cap:'$f_s=2W$: they touch and do not overlap.'},
 {svg:()=>{const a=ax({w:340,h:170,xr:[-3.3,3.3],yr:[-0.4,2.1],xlabel:'f',ylabel:'G_\\delta(f)',
    xtarget:4,ytarget:3,xtickfmt:v=>P.fmt(v,2)+'W',ytickfmt:()=>''});
   for(let n=-1;n<=1;n++) a.curve(f=>1.5*tri(f-1.5*n,1,1),{color:n?C.mid:C.in,width:n?1.7:2.2});
   for(const c of [-1,1]) a.area(f=>Math.min(1.5*tri(f,1,1),1.5*tri(f-1.5*c,1,1)),
     Math.max(-1,1.5*c-1), Math.min(1,1.5*c+1), {color:C.dec.err, stroke:C.err});
   return a.svg();}, cap:'$f_s<2W$: they overlap, and the overlap cannot be undone.'}
]},

{t:'box', kind:'warn', hd:'Aliasing', html:'In the third case a high frequency of the message has been added to a low frequency of a replica. No filter can separate a sum into its parts, so the original signal cannot be recovered from its samples — not by a better filter and not by more computation. In practice a real signal is never strictly bandlimited, so a <b>guard band</b> $f_g$ is left between the edge of the message and the edge of the first replica: $f_s=2W+f_g$, with an anti-aliasing filter removing whatever lies above $W$ before the sampler sees it.'},

{t:'h2', num:'1.2', text:'The sampling theorem and reconstruction'},
{t:'box', kind:'def', hd:'Sampling theorem', html:'If $G(f)=0$ for $|f|\\ge W$ and $f_s\\ge 2W$, then $g(t)$ is determined completely by its samples $g(nT_s)$ and can be recovered from them exactly. If $f_s<2W$, aliasing occurs and the recovery fails. The rate $2W$ is the <b>Nyquist rate</b> and $T_s=1/(2W)$ the <b>Nyquist interval</b>.'},
{t:'p', text:'Recovery means keeping the copy at the origin and rejecting every other one, which is a lowpass filter. At $f_s=2W$:'},
{t:'eqbox', cap:'The reconstruction filter and its impulse response', tex:[
  'H_{\\mathrm{LPF}}(f)=\\begin{cases}\\dfrac{1}{2W}, & |f|\\le W\\\\[4pt] 0, & \\text{otherwise}\\end{cases}',
  'h_{\\mathrm{LPF}}(t)=\\int_{-W}^{W}\\frac{1}{2W}e^{j2\\pi ft}\\,df=\\frac{\\sin(2\\pi Wt)}{2\\pi Wt}=\\operatorname{sinc}(2Wt)'],
 after:'The convention used throughout is $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$, so that $\\operatorname{sinc}$ is one at zero and zero at every other integer.'},
{t:'box', kind:'warn', hd:'The gain is not one', html:'Sampling multiplied the spectrum by $f_s=2W$, so the filter has to divide it back. A reconstruction filter of unit gain returns a signal $2W$ times too large, and nothing in a plot of the spectrum <i>shape</i> reveals it.'},
{t:'p', text:'Filtering in frequency is convolution in time. Convolving the impulse train with $h_{\\mathrm{LPF}}$ and using the sifting property once more gives the interpolation formula.'},
{t:'eqbox', cap:'Interpolation', tex:[
  'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\operatorname{sinc}\\bigl(2W(t-nT_s)\\bigr)',
  'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g\\!\\left(\\frac{n}{2W}\\right)\\operatorname{sinc}(2Wt-n)\\quad\\text{at } f_s=2W'],
 after:'At $t=kT_s$ every term vanishes except the one with $n=k$, because $\\operatorname{sinc}$ is zero at every non-zero integer. So $g_r(kT_s)=g(kT_s)$ exactly — and, since the filter passes the whole message and nothing else, the two agree everywhere and not only at the instants.'},

{t:'fig', svg:()=>{
  const g=t=>0.85*Math.sin(1.15*t)+0.35*Math.sin(2.7*t+0.8);
  const a=ax({w:700,h:230,xr:[-0.4,8.4],yr:[-1.5,1.6],xlabel:'t',ylabel:'g(t),\\;g_r(t)',ytarget:4});
  for(let n=0;n<=8;n++) a.curve(t=>g(n)*sinc(t-n),{color:C.mid,width:1,opacity:0.5,dash:'3 3'});
  a.curve(t=>{let s=0;for(let n=-6;n<=14;n++)s+=g(n)*sinc(t-n);return s;},{color:C.out,width:2.4});
  for(let n=0;n<=8;n++) a.point(n,g(n),{color:C.in,r:3.4});
  return a.svg();
}, cap:'Each sample contributes one shifted sinc scaled by its own value. Their sum, drawn heavy, passes through every sample because each sinc is zero at all the other sampling instants.'},

{t:'ex', hd:'Example 1.1 — three sampling rates', rows:[
 ['Given','A signal $x(t)$ bandlimited to $W=40$ kHz.'],
 ['Find','(a) the Nyquist rate; (b) the rate with a $10$ kHz guard band; (c) the Nyquist rate of $y(t)=x(t)\\cos(80000\\pi t)$.'],
 ['Method','Read (a) and (b) off the geometry of the replicas. For (c) find the bandwidth of $y$ first: the rate follows from that, not from the bandwidth of $x$.'],
 ['Solution','(a) $f_s=2W=80$ kHz. (b) $f_s=2W+f_g=90$ kHz. (c) The carrier is at $f_c=40$ kHz, and multiplication shifts the spectrum both ways and halves it: $Y(f)=\\tfrac12X(f-40\\mathrm{k})+\\tfrac12X(f+40\\mathrm{k})$. The result occupies $|f|<80$ kHz, so $f_s=160$ kHz.'],
 ['Check','The highest frequency of $y$ is $f_c+W=80$ kHz and $2\\times80=160$ kHz. Doubling the carrier would double the answer while leaving the width of $Y$ unchanged: the rate follows the highest frequency present, not the width of the message.']
]},
{t:'box', kind:'warn', hd:'The trap in part (c)', html:'Answering $80$ kHz is answering for $x$, not for $y$. Modulation moved the message up the frequency axis and the sampler has to keep up with where it went.'},

{t:'page'},

{t:'h2', num:'1.3', text:'Quantization'},
{t:'p', text:'Quantization replaces a sample amplitude by the nearest member of a finite set of $L$ <b>representation levels</b>. In a <b>uniform</b> quantizer the spacing $\\Delta$ between consecutive levels is the same everywhere. The two families differ in what happens at zero: a <b>mid-rise</b> quantizer puts a decision boundary there, so no output level is zero, while a <b>mid-tread</b> quantizer puts a level there, so a small input is quantized to exactly zero. Speech coders use mid-tread, because a silent input should be reproduced as silence rather than as a $\\pm\\Delta/2$ chatter.'},

{t:'figrow', n:2, items:[
 {svg:()=>{const a=ax({w:330,h:230,xr:[-4,4],yr:[-4,4],xlabel:'m',ylabel:'v=\\mathbb{Q}(m)',xtarget:4,ytarget:4});
   const pts=[];for(let i=0;i<=800;i++){const m=-4+8*i/800;
     pts.push([m,Math.max(-3.5,Math.min(3.5,(Math.floor(m)+0.5)))]);}
   a.poly(pts,{color:C.mid,width:2.1});return a.svg();},
  cap:'Mid-rise, $L=8$, $\\Delta=1$. A boundary at the origin.'},
 {svg:()=>{const a=ax({w:330,h:230,xr:[-4,4],yr:[-4,4],xlabel:'m',ylabel:'v=\\mathbb{Q}(m)',xtarget:4,ytarget:4});
   const pts=[];for(let i=0;i<=800;i++){const m=-4+8*i/800;
     pts.push([m,Math.max(-3,Math.min(3,Math.round(m)))]);}
   a.poly(pts,{color:C.mid,width:2.1});return a.svg();},
  cap:'Mid-tread, $L=8$, $\\Delta=1$. A level at the origin.'}
]},

{t:'p', text:'A quantizer is a partition of the input range into $L$ regions $\\mathcal{J}_k$ with one output value $v_k$ per region. Two conditions make it optimal, and they refer to each other, which is why they are applied by turns rather than solved at once.'},
{t:'ol', items:[
 'Each boundary is the <b>midpoint</b> of the two levels it separates, $m_k=\\tfrac12(v_{k-1}+v_k)$. Given the levels, this minimises the error, because it sends every input to the nearer level.',
 'Each level is the <b>centroid</b> of its own region, $v_k=E[M\\mid M\\in\\mathcal{J}_k]$. Given the boundaries, this minimises the mean square error inside the region.'
]},
{t:'p', text:'A uniform quantizer satisfies the first by construction. It satisfies the second only when the input is uniformly distributed, which is the deeper reason the uniform quantizer is optimal for a uniform source and for no other.'},

{t:'h2', num:'1.4', text:'Quantization noise and the signal-to-noise ratio'},
{t:'p', text:'The quantization error is $Q=M-\\mathbb{Q}(M)$. Because every input is sent to the nearer level, it can never exceed half a step, so $-\\Delta/2\\le q\\le \\Delta/2$. If $\\Delta$ is small enough that the density of $M$ is nearly flat across one region, the error is as likely to fall anywhere in that interval as anywhere else.'},
{t:'eqbox', cap:'The uniform error model', tex:[
  'f_Q(q)=\\frac{1}{\\Delta},\\qquad -\\frac{\\Delta}{2}\\le q\\le\\frac{\\Delta}{2}',
  'E[Q^{2}]=\\int_{-\\Delta/2}^{\\Delta/2}q^{2}\\frac{1}{\\Delta}\\,dq=\\frac{\\Delta^{2}}{12}'],
 after:'With a zero-mean input the error has zero mean too, so this mean square is also the variance: the power of the quantization noise is its variance.'},
{t:'p', text:'Substituting $\\Delta=2m_{\\max}/L$ and $L=2^{R}$ puts the result in the form the rest of the chapter uses, and dividing the signal power by it gives the figure of merit.'},
{t:'eqbox', cap:'Signal-to-quantization-noise ratio', tex:[
  'E[Q^{2}]=\\frac{1}{12}\\left(\\frac{2m_{\\max}}{L}\\right)^{2}=\\frac{m_{\\max}^{2}}{3\\cdot 2^{2R}}',
  '\\mathrm{SQNR}=\\frac{P_M}{E[Q^{2}]}=\\frac{3P_M}{m_{\\max}^{2}}2^{2R}',
  '\\mathrm{SQNR}\\;[\\mathrm{dB}]=\\underbrace{10\\log_{10}\\frac{3P_M}{m_{\\max}^{2}}}_{\\alpha}+\\;6.02R'],
 after:'Every extra bit per sample adds $20\\log_{10}2=6.02$ dB. Doubling the level count halves the step, which quarters the error power, and a factor of four is $6.02$ dB.'},
{t:'box', kind:'warn', hd:'What $\\alpha$ costs', html:'The intercept is negative for every signal that does not fill the quantizer range. A full-scale sinusoid has $P_M=m_{\\max}^{2}/2$ and $\\alpha=10\\log_{10}1.5\\approx1.76$ dB; a sinusoid reaching a quarter of the range has $\\alpha=-10.28$ dB, a loss of $12.04$ dB — exactly two bits. That calculation is the argument for companding, and its size is the size of the argument.'},

{t:'ex', hd:'Example 1.2 — a full-scale sinusoid', rows:[
 ['Given','$m(t)=5\\cos t$ through a uniform quantizer spanning its full range.'],
 ['Find','The step size and the SQNR at $R=3$ and $R=4$ bits per sample.'],
 ['Method','Average power from Parseval, step size from $\\Delta=2m_{\\max}/L$, then $\\alpha+6.02R$.'],
 ['Solution','The coefficients are $a_{\\pm1}=5/2$, so $P_M=2(5/2)^{2}=12.5$ and $m_{\\max}=5$. At $R=3$: $\\Delta=2(5)/8=1.25$ V and $\\mathrm{SQNR}=1.76+18.06=19.82$ dB. At $R=4$: $\\Delta=0.625$ V and $\\mathrm{SQNR}=1.76+24.08=25.84$ dB.'],
 ['Check','The two differ by $6.02$ dB, one bit. Independently, $E[Q^{2}]=\\Delta^{2}/12=0.1302$ and $10\\log_{10}(12.5/0.1302)=19.82$ dB.']
]},
{t:'box', kind:'warn', hd:'What the formula does not know', html:'Quantize this waveform and measure the error it actually makes, and the answers are $19.09$ dB and $25.31$ dB — about $0.7$ dB and $0.5$ dB below the formula. The uniform model assumes the error is equally likely anywhere in half a step, and a sinusoid spends most of its time near its peaks, where the error is largest. The gap halves with every extra bit: $0.27$ dB at $R=6$ and $0.14$ dB at $R=8$. That is what "$\\Delta$ small enough" means, and knowing the size of the gap is the difference between using a model and believing it.'},

{t:'ex', hd:'Example 1.3 — when the model breaks', rows:[
 ['Given','A zero-mean stationary Gaussian source with $S_X(f)=2$ for $|f|<100$ Hz, sampled at the Nyquist rate, each sample through a five-level quantizer with outputs $-30,-10,0,10,30$ and boundaries at $-40,-20,20,40$.'],
 ['Find','The SQNR of the scheme.'],
 ['Method','The signal power is the area under the spectral density. The noise power must be integrated region by region, because this quantizer is neither uniform nor fine.'],
 ['Solution','$P_X=\\int_{-100}^{100}2\\,df=400$, and since the mean is zero this is also $\\sigma_X^{2}$. Splitting $P_Q=\\int(x-\\mathbb{Q}(x))^{2}f_X(x)\\,dx$ at the four boundaries gives $7.98+46.36+79.50+46.36+7.98=188.18$, so $\\mathrm{SQNR}=10\\log_{10}(400/188.18)=3.27$ dB.'],
 ['Check','The central region alone contributes $79.50$, and it holds the $68\\%$ of the mass with $|X|<20$ and an error of up to $20$. That is where a five-level quantizer spends its error, and it is why the answer is a few decibels rather than a few tens.']
]},
{t:'box', kind:'err', hd:'Why $\\Delta^{2}/12$ would have lied', html:'The quantizer is coarse and its outer regions are unbounded, so the error there is not bounded by half a step at all: a sample at $x=120$ is quantized to $30$ and the error is $90$. Applying the uniform model with $\\Delta=20$ predicts $E[Q^{2}]=33.3$ and an SQNR of $10.8$ dB, three times too optimistic. The model is a small-step model, and this is what its failure looks like.'},

{t:'page'},

{t:'h2', num:'1.5', text:'Non-uniform quantization'},
{t:'p', text:'Speech spends most of its time at small amplitudes and only occasionally reaches its peak. A uniform quantizer gives the same absolute step to a whisper and to a shout, so the whisper is quantized far more coarsely in proportion to itself. Relaxing the requirement that the regions be of equal length allows the distortion to be reduced at the same level count — narrow regions where the density is high and wide ones where it is low, which is what the centroid condition asks for and what a uniform quantizer cannot give.'},
{t:'p', text:'Rather than build a non-uniform quantizer, the signal is compressed by a memoryless non-linearity, quantized <b>uniformly</b>, and expanded at the receiver by the inverse. Compressing plus expanding is <b>companding</b>, and it is how the non-uniform quantizer is built out of a uniform one.'},
{t:'eqbox', cap:'The two standard compressors', tex:[
  'y=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}\\operatorname{sgn}(x),\\qquad |x|\\le 1',
  'y=\\begin{cases}\\dfrac{A|x|}{1+\\ln A}\\operatorname{sgn}(x), & 0\\le|x|\\le 1/A\\\\[8pt] \\dfrac{1+\\ln(A|x|)}{1+\\ln A}\\operatorname{sgn}(x), & 1/A<|x|\\le1\\end{cases}'],
 after:'Both are normalised so that $x=\\pm1$ maps to $y=\\pm1$. The standard parameters are $\\mu=255$ and $A=87.6$; on the same speech through the same eight-bit uniform quantizer the two give signal-to-noise ratios within a hundredth of a decibel of one another. The difference between them is regional rather than technical.'},

{t:'fig', svg:()=>{
  const a=ax({w:420,h:250,xr:[-1,1],yr:[-1,1],xlabel:'x/x_{\\max}',ylabel:'y',xtarget:4,ytarget:4});
  const mu=255,A=87.6,sgn=x=>x<0?-1:1;
  a.curve(x=>x,{color:C.muted,width:1.2,dash:'4 4'});
  a.curve(x=>sgn(x)*Math.log(1+mu*Math.abs(x))/Math.log(1+mu),{color:C.in,width:2.2});
  a.curve(x=>{const u=Math.abs(x);
    return sgn(x)*(u<1/A ? A*u/(1+Math.log(A)) : (1+Math.log(A*u))/(1+Math.log(A)));},
    {color:C.h,width:2.2,dash:'6 4'});
  a.note(-0.97,0.86,'\\mu\\text{-law}',{tex:true,fs:13,color:C.in});
  a.note(-0.97,0.62,'A\\text{-law}',{tex:true,fs:13,color:C.h});
  return a.svg();
}, cap:'The two compressor characteristics against the identity, which is what no companding would give. Both spend most of their output range on the smallest tenth of the input.'},

{t:'h2', num:'1.6', text:'Encoding, line codes and pulse code modulation'},
{t:'p', text:'With $L=2^{R}$ levels each sample needs $R$ bits, and at $f_s$ samples per second the stream leaves the encoder at $R_b=Rf_s$ bits per second. <b>Natural binary coding</b> assigns $0$ to $L-1$ to the levels in increasing order; <b>Gray coding</b> assigns the words so that adjacent levels differ in exactly one bit. The second is worth the trouble because a channel error almost always moves the decision to a neighbouring level, and under natural binary that can flip several bits at once — level $7$ is $0111$ and level $8$ is $1000$, four bits apart, where the Gray words $0100$ and $1100$ are one.'},
{t:'p', text:'A <b>line code</b> is the rule that turns those bits into a waveform. Unipolar NRZ is on-off signalling: simplest, and it carries a DC level that makes the waveform droop through any AC-coupled stage. Polar NRZ is antipodal signalling and has no DC component for balanced data, which is why it is the shape Chapter 2 analyses. Both go quiet during a long run of identical bits, and a receiver recovering its clock from the waveform then has nothing to lock to; Manchester forces a transition in the middle of every bit, so the clock is always recoverable and there is never a DC component, paid for with twice the bandwidth.'},

{t:'figrow', n:2, items:[
 {svg:()=>{const bits=[0,1,1,0,1,0,0,1];
   const a=ax({w:330,h:130,xr:[0,8],yr:[-1.5,1.5],pad:{l:26,r:14,t:12,b:20},
     xticksOverride:[],yticksOverride:[-1,0,1],grid:false});
   const pts=[];for(let k=0;k<8;k++)for(let j=0;j<=40;j++)pts.push([k+j/40,bits[k]?1:0]);
   for(let k=1;k<8;k++) a.vline(k,{color:C.rule,dash:'2 4'});
   a.poly(pts,{color:C.in,width:1.8});return a.svg();}, cap:'Unipolar NRZ.'},
 {svg:()=>{const bits=[0,1,1,0,1,0,0,1];
   const a=ax({w:330,h:130,xr:[0,8],yr:[-1.5,1.5],pad:{l:26,r:14,t:12,b:20},
     xticksOverride:[],yticksOverride:[-1,0,1],grid:false});
   const pts=[];for(let k=0;k<8;k++)for(let j=0;j<=40;j++)pts.push([k+j/40,bits[k]?1:-1]);
   for(let k=1;k<8;k++) a.vline(k,{color:C.rule,dash:'2 4'});
   a.poly(pts,{color:C.in,width:1.8});return a.svg();}, cap:'Polar NRZ, carrying the same eight bits $01101001$.'}
]},

{t:'ex', hd:'Example 1.4 — a complete PCM stream', rows:[
 ['Given','$m(t)=8|\\operatorname{sinc}(t-2)|$, so $0\\le m(t)\\le8$, sampled every $T_s=0.6$ s and quantized by an eight-level uniform quantizer covering $[0,8]$.'],
 ['Find','The step size, the levels, the code words for $t=0,0.6,\\ldots,3.6$, and the bit rate.'],
 ['Method','$\\Delta$ from the range and the level count; each sample by direct evaluation; each word from the tread the sample falls in.'],
 ['Solution','$\\Delta=8/8=1$ V and the levels sit at $0.5,1.5,\\ldots,7.5$. The samples are $0,\\;1.73,\\;1.87,\\;7.48,\\;6.05,\\;0,\\;1.51$, giving the words $000\\;001\\;001\\;111\\;110\\;000\\;001$. With $R=3$ and $f_s=1/0.6=1.667$, $R_b=5$ bit/s and $T_b=T_s/3=0.2$ s.'],
 ['Check','The sample at $t=3$ is $8|\\operatorname{sinc}(1)|=0$ exactly, because $\\operatorname{sinc}$ vanishes at every non-zero integer — the same fact the interpolation formula rests on, met again at the other end of the chapter.']
]},

{t:'h2', num:'1.7', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Replication','$G_\\delta(f)=f_s\\sum_n G(f-nf_s)$','PS CH7.1.1'],
 ['Sampling theorem','$f_s\\ge 2W$ for a message bandlimited to $W$','PS CH7.1.1'],
 ['Reconstruction','$g_r(t)=\\sum_n g(nT_s)\\operatorname{sinc}(2Wt-n)$, filter gain $1/(2W)$','PS CH7.1.1'],
 ['Step size','$\\Delta=2m_{\\max}/L$, $\\;L=2^{R}$','PS CH7.2.1'],
 ['Error power','$E[Q^{2}]=\\Delta^{2}/12$, when the step is small','PS CH7.2.1'],
 ['Signal-to-noise','$\\mathrm{SQNR}\\;[\\mathrm{dB}]=\\alpha+6.02R$','PS CH7.2.1'],
 ['Bit rate','$R_b=Rf_s$','PS CH7.3, 7.4.1']
]},
{t:'p', text:'Sampling is reversible and quantization is not. Everything after this chapter takes the bit stream as given and asks what the channel does to it.'}

];
})();
