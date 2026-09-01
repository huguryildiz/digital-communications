/* Course notes — front matter and Chapter 1.

   The front matter lives here because chapter 1 is the first chapter file the
   builder finds. It moves to `c0.js` when the course opening is written.
   The contents lists the chapters that exist; it grows as they are added. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:48,r:20,t:18,b:32},xtarget:8,ytarget:3},o));
const tri=(f,W,h)=>Math.abs(f)<W ? h*(1-Math.abs(f)/W) : 0;
const sinc=x=>Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);

/* Every pair a two-sample block can take, with the pairs a smooth signal can
   actually produce shaded. A cell is shaded when the two indices differ by at
   most one, which is the condition the text states, so the count in the caption
   is the count the figure draws. */
function lattice(L){
  const a=ax({w:400,h:300,xr:[0,L],yr:[0,L],
    xlabel:'\\text{sample }n',ylabel:'\\text{sample }n+1',
    pad:{l:56,r:20,t:20,b:42},
    xticksOverride:[0,4,8,12,16],yticksOverride:[0,4,8,12,16],grid:false});
  for(let i=0;i<L;i++) for(let j=0;j<L;j++){
    const near=Math.abs(i-j)<=1;
    a.rect(i,j,i+1,j+1,{fill:near?C.dec.in:'none',stroke:near?C.in:C.rule});
  }
  return a.svg();
}

/* One row of a smooth gradient at two level counts: the coarse staircase is
   what a reader sees as banding. */
function banding(){
  const a=ax({w:400,h:280,xr:[0,1],yr:[-0.06,1.10],
    xlabel:'\\text{position across the image}',ylabel:'\\text{brightness}',
    pad:{l:58,r:20,t:20,b:42},xtarget:5,ytarget:5});
  const q=(v,L)=>(Math.min(L-1,Math.floor(v*L))+0.5)/L;
  a.curve(x=>q(x,256),{color:C.in,width:2.0,n:1400});
  a.curve(x=>q(x,8),{color:C.mid,width:2.2,n:1400});
  a.note(0.06,0.96,'L=256',{tex:true,fs:11,color:C.in});
  a.note(0.62,0.30,'L=8',{tex:true,fs:11,color:C.mid});
  return a.svg();
}

window.C1 = [

/* ---------------- title ---------------- */
{t:'title', kicker:'Digital Communications', text:'Digital Communications',
 sub:'A waveform becomes bits. A channel carries the bits through noise. A receiver decides what was sent and measures the error.',
 meta:[['Covers','Chapters 1 to 6, and appendices A and B'],['Level','Undergraduate'],
       ['Assumed background','Fourier analysis, probability, random processes']]},

{t:'h3', text:'Course conventions'},
{t:'p', text:'Read the plain explanation before the mathematics. Worked examples use five headings: Given, Find, Method, Solution, and Check.'},
{t:'p', text:'Noise is white and Gaussian with <b>two-sided</b> power spectral density $N_0/2$ watts per hertz. The Gaussian tail is $Q(x)=\\frac{1}{\\sqrt{2\\pi}}\\int_x^{\\infty}e^{-t^{2}/2}\\,dt=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$. Energy and power use $R=1\\ \\Omega$.'},
{t:'p', text:'A <b>PS</b> marker points to the related section of Proakis and Salehi, <i>Fundamentals of Communication Systems</i>, second edition. The textbook chapter numbers differ from the course chapter numbers.'},

{t:'toc', items:[
 ['1','The transition from analog to digital','Impulse-train sampling and the replication of the spectrum. The sampling theorem. Reconstruction and sinc interpolation. Uniform quantization, the error it makes, and the signal-to-quantization-noise ratio. Companding. Encoding, line codes and pulse code modulation.','PS CH7.1&ndash;7.4'],
 ['2','Baseband transmission of digital signals','Matched filtering. Correlator and matched-filter demodulators. The decision statistic, optimal threshold, and bit error probability. Intersymbol interference and the eye pattern. Nyquist\'s criterion and the raised cosine.','PS CH8.2&ndash;8.3, PS CH10.1, PS CH10.3'],
 ['3','Geometric representation of signal waveforms','Signals as vectors. Orthonormal bases, coordinates, energy and distance. The constellation diagram. The Gram&ndash;Schmidt procedure.','PS CH8.1'],
 ['4','The optimal receiver in additive white Gaussian noise','Correlator banks. The MAP and ML rules. Minimum-distance detection. Decision regions. The union bound and the nearest-neighbour approximation.','PS CH8.3&ndash;8.4'],
 ['5','Digital modulation methods','Binary modulation and its energy costs. M-ary phase-shift keying, amplitude-shift keying, quadrature amplitude modulation, and frequency-shift keying.','PS CH8.5&ndash;8.7, PS CH9.5'],
 ['6','An introduction to information theory','Self-information and entropy. Extended sources. Average codeword length and coding efficiency. Uniquely decodable and prefix codes, the Kraft inequality, and how close to the entropy a code can get. Huffman coding, its ties and its variance.','PS CH12.1&ndash;12.3'],
 ['A','Summary of formulas','The main formulas in course order, without derivations.','&mdash;'],
 ['B','The laboratories','Four laboratories on quantization, matched filtering, quadrature amplitude modulation, and Huffman coding.','&mdash;']
]},

{t:'page'},

/* ================= CHAPTER 1 ================= */
{t:'h1', num:'CHAPTER 1', text:'The transition from analog to digital'},
{t:'p', lead:true, text:'A continuous waveform becomes a bit stream in three steps. Sampling makes time discrete. Quantization makes amplitude discrete. Encoding replaces each quantized amplitude with bits. Sampling can be reversed. Quantization cannot.'},

{t:'h2', num:'1.1', text:'Impulse-train sampling'},
{t:'p', text:'Sampling every $T_s$ seconds is multiplication by a train of impulses. Write $f_s=1/T_s$ for the sampling frequency.'},
{t:'eqbox', cap:'The ideal sampled signal', tex:[
  'p(t)=\\sum_{n=-\\infty}^{\\infty}\\delta(t-nT_s)',
  'g_\\delta(t)=g(t)\\,p(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\,\\delta(t-nT_s)'],
 after:'The second line uses the sampling property $g(t)\\delta(t-t_0)=g(t_0)\\delta(t-t_0)$, which turns the product under the sum into a number.'},
{t:'p', text:'The signal $g_\\delta$ is continuous in time, not a sequence of numbers. Therefore, it has a Fourier transform. A product in time becomes a convolution in frequency:'},
{t:'eq', tex:'P(f)=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)=f_s\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)'},
{t:'p', text:'The Fourier-series coefficient of $p(t)$ is the same for every harmonic: $a_k=\\frac{1}{T_s}\\int_{-T_s/2}^{T_s/2}\\delta(t)e^{-j2\\pi kf_0t}\\,dt=\\frac{1}{T_s}$. Now convolve $G$ with the impulse train:'},
{t:'eq', tex:'G_\\delta(f)=G(f)*P(f)=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}G(f)*\\delta(f-nf_s)'},
{t:'p', text:'A shifted impulse shifts the function during convolution. Write the convolution integral and use the even property $\\delta(-u)=\\delta(u)$:'},
{t:'eq', tex:'\\begin{aligned}G(f)*\\delta(f-nf_s)&=\\int G(\\theta)\\,\\delta(f-nf_s-\\theta)\\,d\\theta\\\\[2pt]&=\\int G(\\theta)\\,\\delta\\bigl(-[\\theta-(f-nf_s)]\\bigr)\\,d\\theta\\\\[2pt]&=\\int G(\\theta)\\,\\delta\\bigl(\\theta-(f-nf_s)\\bigr)\\,d\\theta\\\\[2pt]&=G(f-nf_s)\\end{aligned}'},
{t:'p', text:'The last line uses the sifting property. Each impulse in $P(f)$ places one copy of $G$ at a multiple of $f_s$.'},
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

{t:'box', kind:'warn', hd:'Aliasing', html:'When the replicas overlap, a high message frequency combines with a low frequency from a replica. No filter can separate these components. The samples no longer determine the original signal. A real signal is not strictly bandlimited, so a <b>guard band</b> $f_g$ separates the message and the first replica. Then $f_s=2W+f_g$. An anti-aliasing filter removes frequencies above $W$ before sampling.'},

{t:'h2', num:'1.2', text:'The sampling theorem and reconstruction'},
{t:'box', kind:'def', hd:'Sampling theorem', html:'If $G(f)=0$ for $|f|\\ge W$ and $f_s\\ge 2W$, then $g(t)$ is determined completely by its samples $g(nT_s)$ and can be recovered from them exactly. If $f_s<2W$, aliasing occurs and the recovery fails. The rate $2W$ is the <b>Nyquist rate</b> and $T_s=1/(2W)$ the <b>Nyquist interval</b>.'},
{t:'p', text:'An ideal lowpass filter keeps the copy at the origin and rejects the other copies. At $f_s=2W$:'},
{t:'eqbox', cap:'The reconstruction filter and its impulse response', tex:[
  'H_{\\mathrm{LPF}}(f)=\\begin{cases}\\dfrac{1}{2W}, & |f|\\le W\\\\[4pt] 0, & \\text{otherwise}\\end{cases}',
  'h_{\\mathrm{LPF}}(t)=\\int_{-W}^{W}\\frac{1}{2W}e^{j2\\pi ft}\\,df=\\frac{\\sin(2\\pi Wt)}{2\\pi Wt}=\\operatorname{sinc}(2Wt)'],
 after:'The course uses $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$. This function is one at zero and zero at every other integer.'},
{t:'box', kind:'warn', hd:'Reconstruction-filter gain', html:'Sampling scales the spectrum by $f_s=2W$. The filter must remove this scale factor. A unit-gain filter returns a signal that is $2W$ times too large.'},
{t:'p', text:'Filtering in frequency is convolution in time. Therefore, convolve the impulse train with $h_{\\mathrm{LPF}}$. Use $\\tau$ as the integration variable:'},
{t:'eqbox', cap:'The convolution integral, and the sifting step', tex:[
  'g_r(t)=\\int_{-\\infty}^{\\infty}\\overbrace{\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\,\\delta(\\tau-nT_s)}^{=\\,g_\\delta(\\tau)}\\operatorname{sinc}\\bigl(2W(t-\\tau)\\bigr)\\,d\\tau',
  'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\underbrace{\\int_{-\\infty}^{\\infty}\\operatorname{sinc}\\bigl(2W(t-\\tau)\\bigr)\\,\\delta(\\tau-nT_s)\\,d\\tau}_{=\\,\\operatorname{sinc}\\bigl(2W(t-nT_s)\\bigr)}'],
 after:'The sum does not depend on $\\tau$, so it moves outside the integral. The sifting property then replaces $\\tau$ with $nT_s$.'},
{t:'eqbox', cap:'Interpolation', tex:[
  'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\operatorname{sinc}\\bigl(2W(t-nT_s)\\bigr)',
  'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g\\!\\left(\\frac{n}{2W}\\right)\\operatorname{sinc}(2Wt-n)\\quad\\text{at } f_s=2W'],
 after:'At $t=kT_s$, every term is zero except the term with $n=k$. Therefore, $g_r(kT_s)=g(kT_s)$. The same sum reconstructs the signal between the sample times.'},

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
 ['Find','Find (a) the Nyquist rate, (b) the rate with a $10$ kHz guard band, and (c) the Nyquist rate of $y(t)=x(t)\\cos(80000\\pi t)$.'],
 ['Method','Read (a) and (b) off the geometry of the replicas. For (c) find the bandwidth of $y$ first: the rate follows from that, not from the bandwidth of $x$.'],
 ['Solution','(a) $f_s=2W=80$ kHz. (b) $f_s=2W+f_g=90$ kHz. (c) The carrier is at $f_c=40$ kHz, and multiplication shifts the spectrum both ways and halves it: $Y(f)=\\tfrac12X(f-40\\mathrm{k})+\\tfrac12X(f+40\\mathrm{k})$. The result occupies $|f|<80$ kHz, so $f_s=160$ kHz.'],
 ['Check','The highest frequency of $y$ is $f_c+W=80$ kHz. Therefore, its Nyquist rate is $160$ kHz. The rate follows the highest frequency, not the message bandwidth.']
]},
{t:'box', kind:'warn', hd:'Common error in part (c)', html:'The rate $80$ kHz applies to $x$, not to $y$. Modulation moves the highest frequency to $80$ kHz. Therefore, $y$ needs a sampling rate of $160$ kHz.'},

{t:'page'},

{t:'h2', num:'1.3', text:'Quantization'},
{t:'p', text:'Quantization replaces a sample amplitude with one of $L$ <b>representation levels</b>. A <b>uniform</b> quantizer uses the same spacing $\\Delta$ between consecutive levels.'},
{t:'p', text:'A <b>mid-rise</b> quantizer has a decision boundary at zero, so it has no zero output level. A <b>mid-tread</b> quantizer has an output level at zero. Thus, a mid-tread quantizer reproduces a small input as zero.'},

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

{t:'p', text:'A quantizer divides the input range into $L$ regions $\\mathcal{J}_k$. Each region has one output value $v_k$. Two conditions define an optimal quantizer:'},
{t:'ol', items:[
 'Each boundary is the <b>midpoint</b> of its two adjacent levels: $m_k=\\tfrac12(v_{k-1}+v_k)$. This sends each input to the nearer level.',
 'Each level is the <b>centroid</b> of its region: $v_k=E[M\\mid M\\in\\mathcal{J}_k]$. This minimizes the mean-square error in that region.'
]},
{t:'p', text:'The two conditions depend on each other, so apply them in turn. A uniform quantizer satisfies both conditions for a uniform input.'},

{t:'h2', num:'1.4', text:'Quantization noise and the signal-to-noise ratio'},
{t:'p', text:'The quantization error is $Q=M-\\mathbb{Q}(M)$. Nearest-level quantization keeps this error between $-\\Delta/2$ and $\\Delta/2$.'},
{t:'p', text:'If $\\Delta$ is small, the density of $M$ is nearly constant across one region. The error can then be modeled as uniform.'},
{t:'eqbox', cap:'The uniform error model', tex:[
  'f_Q(q)=\\frac{1}{\\Delta},\\qquad -\\frac{\\Delta}{2}\\le q\\le\\frac{\\Delta}{2}',
  'E[Q^{2}]=\\int_{-\\Delta/2}^{\\Delta/2}q^{2}\\frac{1}{\\Delta}\\,dq=\\frac{\\Delta^{2}}{12}'],
 after:'For a zero-mean error, this mean-square value is also the variance and the quantization-noise power.'},
{t:'p', text:'Substitute $\\Delta=2m_{\\max}/L$ and $L=2^{R}$. Then divide the signal power by the error power to obtain the SQNR.'},
{t:'eqbox', cap:'Signal-to-quantization-noise ratio', tex:[
  'E[Q^{2}]=\\frac{1}{12}\\left(\\frac{2m_{\\max}}{L}\\right)^{2}=\\frac{m_{\\max}^{2}}{3\\cdot 2^{2R}}',
  '\\mathrm{SQNR}=\\frac{P_M}{E[Q^{2}]}=\\frac{3P_M}{m_{\\max}^{2}}2^{2R}',
  '\\mathrm{SQNR}\\;[\\mathrm{dB}]=\\underbrace{10\\log_{10}\\frac{3P_M}{m_{\\max}^{2}}}_{\\alpha}+\\;6.02R'],
 after:'Each extra bit adds $20\\log_{10}2=6.02$ dB. Doubling the level count halves the step size and divides the error power by four.'},
{t:'box', kind:'warn', hd:'Input-range use', html:'The term $\\alpha$ depends on the signal power and peak amplitude. A full-scale sinusoid gives $\\alpha\\approx1.76$ dB. A sinusoid that reaches one quarter of the range loses $12.04$ dB.'},

{t:'ex', hd:'Example 1.2 — a full-scale sinusoid', rows:[
 ['Given','$m(t)=5\\cos t$ through a uniform quantizer spanning its full range.'],
 ['Find','The step size and the SQNR at $R=3$ and $R=4$ bits per sample.'],
 ['Method','Average power from Parseval, step size from $\\Delta=2m_{\\max}/L$, then $\\alpha+6.02R$.'],
 ['Solution','The coefficients are $a_{\\pm1}=5/2$, so $P_M=2(5/2)^{2}=12.5$ and $m_{\\max}=5$. At $R=3$: $\\Delta=2(5)/8=1.25$ V and $\\mathrm{SQNR}=1.76+18.06=19.82$ dB. At $R=4$: $\\Delta=0.625$ V and $\\mathrm{SQNR}=1.76+24.08=25.84$ dB.'],
 ['Check','The two differ by $6.02$ dB, one bit. Independently, $E[Q^{2}]=\\Delta^{2}/12=0.1302$ and $10\\log_{10}(12.5/0.1302)=19.82$ dB.']
]},
{t:'box', kind:'warn', hd:'Model limit', html:'The measured results are $19.09$ dB and $25.31$ dB. They are below the model by $0.7$ dB and $0.5$ dB. A sinusoid does not produce a uniform error at low resolution. The gap decreases as $R$ increases.'},

{t:'ex', hd:'Example 1.3 — when the model breaks', rows:[
 ['Given','A zero-mean stationary Gaussian source has $S_X(f)=2$ for $|f|<100$ Hz. Its samples enter a five-level quantizer with outputs $-30,-10,0,10,30$ and boundaries at $-40,-20,20,40$.'],
 ['Find','The SQNR of the scheme.'],
 ['Method','The signal power is the area under the spectral density. The noise power must be integrated region by region, because this quantizer is neither uniform nor fine.'],
 ['Solution','$P_X=\\int_{-100}^{100}2\\,df=400$, and since the mean is zero this is also $\\sigma_X^{2}$. Splitting $P_Q=\\int(x-\\mathbb{Q}(x))^{2}f_X(x)\\,dx$ at the four boundaries gives $7.98+46.36+79.50+46.36+7.98=188.18$, so $\\mathrm{SQNR}=10\\log_{10}(400/188.18)=3.27$ dB.'],
 ['Check','The central region alone contributes $79.50$, and it holds the $68\\%$ of the mass with $|X|<20$ and an error of up to $20$. That is where a five-level quantizer spends its error, and it is why the answer is a few decibels rather than a few tens.']
]},
{t:'box', kind:'err', hd:'Model limit', html:'This quantizer is coarse, and its outer regions are unbounded. A sample at $x=120$ has an error of $90$. The formula $\\Delta^2/12$ predicts $10.8$ dB, but direct integration gives $3.27$ dB.'},

{t:'page'},

{t:'h2', num:'1.5', text:'Non-uniform quantization'},
{t:'p', text:'Speech contains small amplitudes more often than large amplitudes. A uniform quantizer gives every amplitude the same step size. Thus, its relative error is larger for small amplitudes.'},
{t:'p', text:'A non-uniform quantizer uses narrow regions where the probability density is high. It uses wide regions where the density is low. This arrangement reduces distortion without adding levels.'},
{t:'p', text:'A <b>compander</b> first compresses the signal with a memoryless nonlinearity. It then uses a uniform quantizer. The receiver applies the inverse expansion.'},
{t:'eqbox', cap:'The two standard compressors', tex:[
  'y=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}\\operatorname{sgn}(x),\\qquad |x|\\le 1',
  'y=\\begin{cases}\\dfrac{A|x|}{1+\\ln A}\\operatorname{sgn}(x), & 0\\le|x|\\le 1/A\\\\[8pt] \\dfrac{1+\\ln(A|x|)}{1+\\ln A}\\operatorname{sgn}(x), & 1/A<|x|\\le1\\end{cases}'],
 after:'Both laws map $x=\\pm1$ to $y=\\pm1$. The standard parameters are $\\mu=255$ and $A=87.6$. For the same speech and eight-bit quantizer, their SQNR values differ by less than $0.01$ dB.'},

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
}, cap:'The identity line shows the result without companding. Both compressors use much of the output range for small input amplitudes.'},

{t:'h2', num:'1.6', text:'Encoding, line codes and pulse code modulation'},
{t:'p', text:'With $L=2^{R}$ levels, each sample needs $R$ bits. At $f_s$ samples per second, the bit rate is $R_b=Rf_s$.'},
{t:'p', text:'<b>Natural binary coding</b> assigns increasing binary values to the levels. Adjacent <b>Gray</b> words differ by one bit. Thus, a small level error changes only one Gray-coded bit.'},
{t:'p', text:'A <b>line code</b> converts the bits into a waveform. Unipolar NRZ has a DC component that causes droop in an AC-coupled stage. Balanced polar NRZ has no DC component.'},
{t:'p', text:'A long run of equal NRZ bits has no transitions for clock recovery. Manchester coding adds a transition to every bit but uses twice the bandwidth.'},

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
 ['Method','Calculate $\\Delta$ from the range and level count. Evaluate each sample. Select the word from the quantization region.'],
 ['Solution','$\\Delta=8/8=1$ V and the levels sit at $0.5,1.5,\\ldots,7.5$. The samples are $0,\\;1.73,\\;1.87,\\;7.48,\\;6.05,\\;0,\\;1.51$, giving the words $000\\;001\\;001\\;111\\;110\\;000\\;001$. With $R=3$ and $f_s=1/0.6=1.667$, $R_b=5$ bit/s and $T_b=T_s/3=0.2$ s.'],
 ['Check','At $t=3$, the sample is $8|\\operatorname{sinc}(1)|=0$. The sinc function is zero at every nonzero integer. The interpolation formula uses the same property.']
]},

{t:'h2', num:'1.7', text:'Vector quantization'},
{t:'p', text:'<b>Scalar quantization</b> processes one sample at a time. It does not use the dependence between neighboring samples.'},
{t:'p', text:'<b>Vector quantization</b> treats $n$ samples as one point in $n$ dimensions. A <b>codebook</b> contains the allowed output points. The quantizer selects the nearest codebook point.'},
{t:'ex', hd:'Example 1.5 \u2014 pairs of neighbouring samples', rows:[
 ['Given','$L=16$ levels, and a signal smooth enough that a sample never moves more than one step from the one before it.'],
 ['Find','What a pair costs, quantized separately and quantized together.'],
 ['Method','Count the pairs each scheme has to be able to name, and take the base-two logarithm.'],
 ['Solution','Separately, every combination is allowed: $L^{2}=256$ pairs, $\\log_2 256=8$ bits a pair, or $4$ bits a sample. Together, only the pairs with $|i-j|\\le1$ can occur, and there are $3L-2=46$ of them: $\\lceil\\log_2 46\\rceil=6$ bits a pair, or $3$ bits a sample.'],
 ['Check','The cell size and rounding error do not change. The code omits $210$ pairs that the signal model cannot produce. The rate decreases from four to three bits per sample.']
]},
{t:'figrow', items:[
 {svg:()=>lattice(16), cap:'A scalar quantizer represents all $256$ pairs. Under the smooth-signal assumption, only the $46$ shaded pairs can occur.'},
 {svg:()=>banding(), cap:'The coarse quantizer changes a smooth gradient into flat steps. Each step boundary appears as a false line.'}
]},
{t:'box', kind:'warn', hd:'Source dependence', html:'Most of the rate reduction comes from dependence between neighboring samples. Better cell shapes can give a smaller gain for independent samples. This course does not develop that case.'},
{t:'ex', hd:'Example 1.6 \u2014 quantizing an image', rows:[
 ['Given','A $512\\times512$ greyscale image at $8$ bits a pixel, so $L=256$ levels.'],
 ['Find','The size of the file, and the size and the cost at $L=32$.'],
 ['Solution','$512^{2}(8)=2\\,097\\,152$ bits, which is $256$ KiB. At $L=32$ the rate is $R=\\log_2 32=5$ bits a pixel, so $1\\,310\\,720$ bits or $160$ KiB \u2014 $37.5\\%$ smaller.'],
 ['Cost','$\\Delta\\mathrm{SQNR}=6.02(8-5)=18.06$ dB. A smooth gradient becomes flat bands with false edges.'],
 ['Check','The decoder cannot recover the position of a pixel inside its quantization interval. Therefore, this compression is <b>lossy</b>. JPEG also quantizes transformed image blocks.']
]},

{t:'h2', num:'1.8', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Replication','$G_\\delta(f)=f_s\\sum_n G(f-nf_s)$','PS CH7.1.1'],
 ['Sampling theorem','$f_s\\ge 2W$ for a message bandlimited to $W$','PS CH7.1.1'],
 ['Reconstruction','$g_r(t)=\\sum_n g(nT_s)\\operatorname{sinc}(2Wt-n)$, filter gain $1/(2W)$','PS CH7.1.1'],
 ['Step size','$\\Delta=2m_{\\max}/L$, $\\;L=2^{R}$','PS CH7.2.1'],
 ['Error power','$E[Q^{2}]=\\Delta^{2}/12$, when the step is small','PS CH7.2.1'],
 ['Signal-to-noise','$\\mathrm{SQNR}\\;[\\mathrm{dB}]=\\alpha+6.02R$','PS CH7.2.1'],
 ['Bit rate','$R_b=Rf_s$','PS CH7.3, 7.4.1'],
 ['Vector quantization','round $n$ samples together and use a codebook','PS CH7.2.2']
]},
{t:'p', text:'Sampling is reversible and quantization is not. Everything after this chapter takes the bit stream as given and asks what the channel does to it.'}

];
})();
