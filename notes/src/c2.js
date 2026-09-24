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
{t:'p', lead:true, text:'Chapter 1 produced a stream of bits. Each bit now becomes a waveform, and the channel adds noise. The receiver must identify the transmitted waveform. This chapter first describes noise as a random signal. It then selects the receiver filter and decision threshold. It also studies pulse overlap in a bandlimited channel.'},

{t:'h2', num:'2.1', text:'Random signals'},
{t:'p', text:'Noise is a random signal: nobody knows its waveform in advance. The receiver still has to be designed against it. This section collects the few facts about random signals that the rest of the chapter uses.'},
{t:'p', text:'A <b>random process</b> $X(t)$ gives one waveform for each outcome of an experiment. Each waveform is a <b>sample function</b>, and the set of all sample functions is the <b>ensemble</b>. Fix a time $t_0$ and let the outcome vary. Then $X(t_0)$ is a random variable with its own density $f_{X(t_0)}(x)$.'},
{t:'p', text:'Two averages over the ensemble describe a random process well enough for this course. The mean is the average value at one time. The autocorrelation is the average product of two values $\\tau$ apart.'},
{t:'eqbox', cap:'Mean and autocorrelation', tex:[
  '\\mu_X(t)=E\\bigl[X(t)\\bigr],\\qquad R_X(t,t+\\tau)=E\\bigl[X(t)\\,X(t+\\tau)\\bigr]'],
 after:'Both are averages across the ensemble at fixed times, not averages along one waveform. The autocorrelation is large when two values $\\tau$ apart tend to move together.'},
{t:'p', text:'A process is <b>wide-sense stationary</b> when its mean is a constant and $R_X(t,t+\\tau)$ depends only on the gap $\\tau$. A shift of the time origin then changes neither, and we write $R_X(\\tau)$. Three properties follow from the definition.'},
{t:'eqbox', cap:'Properties of the autocorrelation', tex:[
  'R_X(0)=E\\bigl[X^{2}(t)\\bigr]=P_X',
  'R_X(-\\tau)=E\\bigl[X(t)\\,X(t-\\tau)\\bigr]=E\\bigl[X(s+\\tau)\\,X(s)\\bigr]=R_X(\\tau)',
  'E\\bigl[(X(t)\\pm X(t+\\tau))^{2}\\bigr]=2R_X(0)\\pm2R_X(\\tau)\\ge0\\quad\\Rightarrow\\quad|R_X(\\tau)|\\le R_X(0)'],
 after:'The first line is the average power. The second substitutes $s=t-\\tau$. The third expands a square, which can never be negative, and uses both signs.'},

{t:'ex', hd:'Example 2.1 — a sinusoid with a random phase', rows:[
 ['Given','$X(t)=A\\cos(2\\pi f_0t+\\Theta)$ with $A=3$ V, $f_0=1$ kHz, and $\\Theta$ uniform on $[0,2\\pi)$, so its density is $1/(2\\pi)$ there.'],
 ['Find','The mean $\\mu_X$, the autocorrelation $R_X(\\tau)$ and the power $P_X$.'],
 ['Method','Average over the phase with its density. Turn the product of two cosines into a sum with $\\cos a\\cos b=\\tfrac12\\cos(a-b)+\\tfrac12\\cos(a+b)$.'],
 ['Solution','The mean is $\\mu_X=\\frac{1}{2\\pi}\\int_0^{2\\pi}A\\cos(2\\pi f_0t+\\theta)\\,d\\theta=0$, since a cosine integrates to zero over a full period of $\\theta$. For the autocorrelation, $R_X=\\frac{A^{2}}{2}E\\bigl[\\cos(2\\pi f_0\\tau)\\bigr]+\\frac{A^{2}}{2}E\\bigl[\\cos(4\\pi f_0t+2\\pi f_0\\tau+2\\Theta)\\bigr]$. The second average is zero for the same reason. So $R_X(\\tau)=\\frac{A^{2}}{2}\\cos(2\\pi f_0\\tau)=4.5\\cos(2\\pi f_0\\tau)$ $\\text{V}^{2}$, and $P_X=R_X(0)=4.5$ $\\text{V}^{2}$.'],
 ['Check','The mean is constant and $R_X$ depends on $\\tau$ only, so the process is wide-sense stationary. The time average of one sample function, $A^{2}\\cos^{2}$ over a period, is also $A^{2}/2=4.5$ $\\text{V}^{2}$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $A^{2}/2$, not $A^{2}$, for the power of the sinusoid. Dropping the $\\tfrac12$ of the product formula gives $9$ $\\text{V}^{2}$.'},

{t:'p', text:'The autocorrelation says how fast a process changes. Its Fourier transform says the same thing in frequency. It is the <b>power spectral density</b> $S_X(f)$, the power per hertz at each frequency.'},
{t:'eqbox', cap:'The Wiener–Khinchin theorem, and the power', tex:[
  'S_X(f)=\\int_{-\\infty}^{\\infty}R_X(\\tau)\\,e^{-j2\\pi f\\tau}\\,d\\tau',
  'P_X=R_X(0)=\\int_{-\\infty}^{\\infty}S_X(f)\\,df'],
 after:'The second line sets $\\tau=0$ in the inverse transform $R_X(\\tau)=\\int S_X(f)e^{j2\\pi f\\tau}df$. The spectral density is real, even and never negative. For the random-phase sinusoid it is $\\frac{A^{2}}{4}\\bigl[\\delta(f-f_0)+\\delta(f+f_0)\\bigr]$, all its power at $\\pm f_0$.'},
{t:'p', text:'A process whose values stay alike for a long time has a narrow spectrum. Take $R_X(\\tau)=e^{-|\\tau|/\\tau_c}$, where $\\tau_c$ is the correlation time. The function is even, so the transform keeps only the cosine part.'},
{t:'eqbox', cap:'A correlation time and a bandwidth', tex:[
  'S_X(f)=2\\int_0^{\\infty}e^{-\\tau/\\tau_c}\\cos(2\\pi f\\tau)\\,d\\tau=\\frac{2\\,(1/\\tau_c)}{(1/\\tau_c)^{2}+(2\\pi f)^{2}}=\\frac{2\\tau_c}{1+(2\\pi f\\tau_c)^{2}}'],
 after:'The integral is the standard one, $\\int_0^\\infty e^{-a\\tau}\\cos(b\\tau)\\,d\\tau=a/(a^{2}+b^{2})$, with $a=1/\\tau_c$ and $b=2\\pi f$. The spectrum falls to half its peak at $f=1/(2\\pi\\tau_c)$, so a short correlation time means a wide band. The area stays $R_X(0)=1$.'},

{t:'p', text:'Thermal noise is modelled as <b>white noise</b>: its spectral density is the same constant at every frequency. The inverse transform of a constant is an impulse.'},
{t:'eqbox', cap:'White noise', tex:[
  'S_W(f)=\\frac{N_0}{2}\\quad\\text{for all }f,\\qquad R_W(\\tau)=\\frac{N_0}{2}\\,\\delta(\\tau)'],
 after:'Two values of white noise at different times are uncorrelated, however close they are. The density is two-sided: $N_0/2$ on positive and on negative frequencies.'},
{t:'box', kind:'warn', hd:'A model', html:'The area under a flat density is infinite, so no real noise is white. Thermal noise at room temperature stays within $10\\%$ of flat up to $10^{12}$ Hz. That is far above any receiver band, and the receiver filter removes the rest.'},
{t:'p', text:'A receiver never sees all of that band. Noise of density $N_0/2$ on $|f|<B$ only has a finite power and a finite autocorrelation. Its autocorrelation is the inverse transform of a rectangle.'},
{t:'eqbox', cap:'Bandlimited white noise', tex:[
  'R(\\tau)=\\int_{-B}^{B}\\frac{N_0}{2}\\,e^{j2\\pi f\\tau}\\,df=\\frac{N_0}{2}\\cdot\\frac{\\sin(2\\pi B\\tau)}{\\pi\\tau}=N_0B\\operatorname{sinc}(2B\\tau)'],
 after:'Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$. The power is $R(0)=N_0B$. The zeros fall at $\\tau=k/(2B)$, so samples taken $1/(2B)$ apart are uncorrelated.'},

{t:'p', text:'A receiver filters its input, so we need the random signal at the output of a linear time-invariant filter $h(t)$. The output is $Y(t)=\\int h(u)\\,X(t-u)\\,du$. Take the expectation inside the integral.'},
{t:'eqbox', cap:'A random signal through a filter', tex:[
  'E\\bigl[Y(t)\\bigr]=\\int_{-\\infty}^{\\infty}h(u)\\,E\\bigl[X(t-u)\\bigr]\\,du=\\mu_X\\int_{-\\infty}^{\\infty}h(u)\\,du=\\mu_X\\,H(0)',
  'R_Y(\\tau)=\\int\\!\\!\\int h(u)\\,h(v)\\,R_X(\\tau+u-v)\\,du\\,dv=h(\\tau)*h(-\\tau)*R_X(\\tau)',
  'S_Y(f)=H(f)\\,H^{*}(f)\\,S_X(f)=|H(f)|^{2}\\,S_X(f)'],
 after:'The second line writes out $E[Y(t)Y(t+\\tau)]$ with the two convolution integrals. For a stationary input it depends on $\\tau$ only, so the output is stationary too. The third line transforms each factor: for a real $h$, $h(-\\tau)$ becomes $H^{*}(f)$. The phase of the filter drops out.'},
{t:'p', text:'For white noise at the input, $S_Y(f)=\\frac{N_0}{2}|H(f)|^{2}$. Its area is the output noise power. It is convenient to describe it by one width.'},
{t:'eqbox', cap:'Filtered white noise and the noise-equivalent bandwidth', tex:[
  'P_Y=\\int_{-\\infty}^{\\infty}\\frac{N_0}{2}\\,|H(f)|^{2}\\,df=N_0\\,B_{\\text{neq}}\\,H_{\\max}^{2},\\qquad B_{\\text{neq}}=\\frac{\\int_{-\\infty}^{\\infty}|H(f)|^{2}\\,df}{2H_{\\max}^{2}}',
  '\\int_{-\\infty}^{\\infty}\\frac{df}{1+(2\\pi fRC)^{2}}=\\frac{1}{2\\pi RC}\\int_{-\\infty}^{\\infty}\\frac{du}{1+u^{2}}=\\frac{\\pi}{2\\pi RC}=\\frac{1}{2RC}\\quad\\Rightarrow\\quad B_{\\text{neq}}=\\frac{1}{4RC}'],
 after:'$B_{\\text{neq}}$ is the half-width of an ideal filter with the same peak gain that passes the same noise power. The second line is the RC lowpass filter, $|H(f)|^{2}=1/\\bigl(1+(2\\pi fRC)^{2}\\bigr)$, with the substitution $u=2\\pi fRC$. Its $B_{\\text{neq}}$ is $\\pi/2$ times its $3$ dB frequency $1/(2\\pi RC)$.'},

{t:'figrow', n:2, items:[
 {svg:()=>{const tc=0.3, a=ax({w:330,h:190,xr:[-2.2,2.2],yr:[0,2.3],xlabel:'f\\;(\\text{kHz})',
    ylabel:'S_X(f)',xtarget:5,ytarget:3});
   const S=f=>2*tc/(1+Math.pow(2*Math.PI*f*tc,2)), S2=f=>2/(1+Math.pow(2*Math.PI*f,2));
   a.curve(S,{color:C.in,width:2.2,n:500}); a.curve(S2,{color:C.in,width:1.6,dash:'6 4',n:500});
   return a.svg();},
  cap:'The spectral density of $R_X(\\tau)=e^{-|\\tau|/\\tau_c}$ for $\\tau_c=0.3$ ms (solid) and $\\tau_c=1$ ms (dashed). The slower process has the narrower spectrum, and both areas are $1$.'},
 {svg:()=>{const rc=1, bn=1/(4*rc), a=ax({w:330,h:190,xr:[-1,1],yr:[0,1.3],xlabel:'f\\;(\\text{kHz})',
    ylabel:'|H(f)|^{2}',xtarget:5,ytarget:3});
   a.curve(f=>1/(1+Math.pow(2*Math.PI*f*rc,2)),{color:C.h,width:2.2,n:500});
   a.poly([[-bn,0],[-bn,1],[bn,1],[bn,0]],{color:C.slate,width:1.8,dash:'6 4'});
   return a.svg();},
  cap:'An RC filter with $RC=1$ ms and the ideal filter of the same area (dashed). Its half-width is $B_{\\text{neq}}=250$ Hz, wider than the $3$ dB frequency of $159$ Hz.'}
]},

{t:'ex', hd:'Example 2.2 — white noise through an RC filter', rows:[
 ['Given','White noise with $N_0/2=10^{-8}$ W/Hz enters an RC lowpass filter with $RC=1$ ms.'],
 ['Find','The noise-equivalent bandwidth $B_{\\text{neq}}$ and the output noise power $P_Y$.'],
 ['Method','Use $B_{\\text{neq}}=1/(4RC)$ with $H_{\\max}=1$, then $P_Y=N_0B_{\\text{neq}}$.'],
 ['Solution','$B_{\\text{neq}}=1/(4\\times10^{-3})=250$ Hz. With $N_0=2\\times10^{-8}$ W/Hz, $P_Y=(2\\times10^{-8})(250)=5\\times10^{-6}$ W.'],
 ['Check','Work in time instead. The impulse response is $h(t)=\\frac{1}{RC}e^{-t/RC}$ for $t\\ge0$, so $\\int_0^{\\infty}h^{2}(t)\\,dt=\\frac{1}{R^{2}C^{2}}\\cdot\\frac{RC}{2}=\\frac{1}{2RC}=500$ $\\text{s}^{-1}$. By Parseval, $P_Y=\\frac{N_0}{2}\\int h^{2}\\,dt=(10^{-8})(500)=5\\times10^{-6}$ W.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $B_{\\text{neq}}=1/(4RC)$, not the $3$ dB frequency $1/(2\\pi RC)$, for the noise power. The $3$ dB width gives $3.18\\times10^{-6}$ W, which is $\\pi/2$ too small.'},

{t:'p', text:'Thermal noise is the sum of the currents of very many electrons, each small and independent. By the central limit theorem such a sum is Gaussian. A linear filter keeps a Gaussian process Gaussian, because every output value is a weighted sum of input values.'},
{t:'eqbox', cap:'One sample of filtered noise', tex:[
  'Y(t_0)\\sim\\mathcal{N}\\bigl(0,\\sigma^{2}\\bigr),\\qquad\\sigma^{2}=P_Y=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^{2}\\,df',
  'P\\bigl(Y(t_0)>a\\bigr)=Q\\!\\left(\\frac{a}{\\sigma}\\right)'],
 after:'This holds for zero-mean white Gaussian noise at the input. $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ is the Gaussian tail. For $\\sigma=2$ mV, the chance that a sample exceeds $4$ mV is $Q(2)=0.0228$. Every decision in this chapter rests on this sample.'},

{t:'h2', num:'2.2', text:'The matched filter'},
{t:'p', text:'Over one bit interval the receiver sees $x(t)=g(t)+w(t)$, the waveform plus white Gaussian noise of two-sided density $N_0/2$. It passes this through a filter and takes one sample at the end of the interval. Because the filter is linear, its output splits the same way, into a signal part $g_0(t)=g*h$ and a noise part $n(t)=w*h$.'},
{t:'p', text:'The quantity worth maximising is the signal at the sampling instant against the noise power that accompanies it. Call this ratio $\\eta$.'},
{t:'eqbox', cap:'The peak pulse signal-to-noise ratio',
 tex:'\\eta=\\frac{|g_0(T)|^{2}}{E[n^{2}(T)]}=\\frac{\\left|\\int_{-\\infty}^{\\infty}G(f)H(f)e^{j2\\pi fT}df\\right|^{2}}{\\dfrac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^{2}df}',
 after:'Scaling $H$ up multiplies the top and the bottom by the same factor, so the answer cannot be "make $H$ large". What is being chosen is the shape of $H$.'},
{t:'p', text:'Schwarz\'s inequality says that $\\left|\\int\\phi_1\\phi_2\\right|^{2}\\le\\int|\\phi_1|^{2}\\int|\\phi_2|^{2}$, with equality only when $\\phi_1=k\\phi_2^{*}$. Taking $\\phi_1=H(f)$ and $\\phi_2=G(f)e^{j2\\pi fT}$, the factor $\\int|H|^{2}$ cancels between the top and the bottom and a bound appears that contains no $H$ at all.'},
{t:'eqbox', cap:'The bound, and the filter that reaches it', tex:[
  '\\eta\\le\\frac{2}{N_0}\\int|G(f)|^{2}df=\\frac{2E}{N_0}',
  'H(f)=k\\,G^{*}(f)e^{-j2\\pi fT}\\quad\\Longleftrightarrow\\quad h_{\\mathrm{opt}}(t)=k\\,g(T-t)'],
 after:'The optimum filter is the transmitted waveform reversed in time and shifted into the interval. It is called the <b>matched filter</b>.'},
{t:'box', kind:'ok', hd:'Two things this says', html:'The best achievable ratio is $\\eta_{\\max}=2E/N_0$. It depends on the <b>energy</b> of the pulse and on the noise density, and on nothing else about the pulse. Two completely different waveforms of the same energy perform identically. The constant $k$ cancels. Therefore, the filter is fixed only up to a gain.'},

{t:'p', text:'The matched-filter output can be found directly, without going through frequency. Write it as a convolution and substitute $h(t)=g(T-t)$.'},
{t:'eqbox', cap:'The matched-filter output as a sliding overlap', tex:[
  'y(t)=\\int_{-\\infty}^{\\infty}g(\\tau)\\,h(t-\\tau)\\,d\\tau=\\int_{-\\infty}^{\\infty}g(\\tau)\\,g(T-t+\\tau)\\,d\\tau'],
 after:'At $t=T$ the two copies of $g$ line up exactly, so $y(T)=\\int g^{2}(\\tau)\\,d\\tau=E$. The peak of the matched-filter output is always the pulse energy, whatever the pulse shape.'},

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

{t:'ex', hd:'Example 2.3 — matched filter of a rectangular pulse', rows:[
 ['Given','$s(t)=A$ on $[0,T]$, with $A=2$ V, $T=0.5$ ms and $N_0/2=10^{-4}$ W/Hz.'],
 ['Find','The matched filter $h(t)$, the output $y(t)$ and the largest peak SNR $\\eta_{\\max}$.'],
 ['Method','Reverse and shift the pulse to get $h(t)$. Slide it across $s(t)$ to get $y(t)$. Then use $\\eta_{\\max}=2E/N_0$.'],
 ['Solution','$h(t)=s(T-t)=A$ on $[0,T]$. Sliding the overlap gives $y(t)=A^{2}t$ for $0\\le t\\le T$ and $y(t)=A^{2}(2T-t)$ for $T\\le t\\le2T$. The energy is $E=A^{2}T=(2)^{2}(0.5\\times10^{-3})=2\\times10^{-3}$ J. Then $\\eta_{\\max}=2E/N_0=2(2\\times10^{-3})/(2\\times10^{-4})=20$.'],
 ['Check','$10\\log_{10}20=13.0$ dB, and $y(T)=A^{2}T=E$, as the general result requires.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $N_0=2\\times10^{-4}$ W/Hz in $2E/N_0$, not $N_0/2$. Using $N_0/2$ in place of $N_0$ gives $40$, twice the true value.'},

{t:'h2', num:'2.3', text:'From waveform to number'},
{t:'p', text:'Both waveforms of a binary baseband system are multiples of one shape, so a single unit-energy function carries both. With $\\psi(t)=1/\\sqrt{T_b}$ on the bit interval, polar NRZ is $s_m(t)=s_m\\psi(t)$ with $s_0=-A\\sqrt{T_b}$ and $s_1=+A\\sqrt{T_b}$. Both carry energy $E_b=A^{2}T_b$, so $A\\sqrt{T_b}=\\sqrt{E_b}$ and the two waveforms have become two <em>numbers</em>, $\\pm\\sqrt{E_b}$, on one axis.'},
{t:'p', text:'This axis is a signal space of one dimension, the axis of $\\psi(t)$. The point $s_0=-\\sqrt{E_b}$ stands for the waveform $s_0(t)$, and $s_1=+\\sqrt{E_b}$ for $s_1(t)$.'},
{t:'eqbox', cap:'The two symbols as points',
 tex:'s_m=\\int_0^{T_b}s_m(t)\\,\\psi(t)\\,dt=\\pm\\sqrt{E_b},\\qquad d=s_1-s_0=2\\sqrt{E_b}',
 after:'A larger distance $d$ means noise must move the received point further before it crosses to the wrong symbol.'},
{t:'p', text:'The demodulator can be built two ways. The <b>matched filter</b> convolves with $\\psi(T_b-t)$ and samples at $T_b$. The <b>correlator</b> multiplies by $\\psi(t)$ and integrates over the interval. Put $t=T_b$ in the matched-filter output, and the convolution integral becomes the correlator integral, for any shape of $\\psi$.'},
{t:'eqbox', cap:'The two demodulators agree at $t=T_b$', tex:[
  'h(t)=\\psi(T_b-t)',
  'y(t)=\\int_{-\\infty}^{\\infty}x(\\tau)\\,\\psi(T_b-t+\\tau)\\,d\\tau\\;\\Longrightarrow\\;y(T_b)=\\int_0^{T_b}x(\\tau)\\,\\psi(\\tau)\\,d\\tau'],
 after:'This equality holds at $t=T_b$ for every basis shape $\\psi(t)$, not only for a rectangle.'},
{t:'p', text:'For the rectangular $\\psi$ used in polar NRZ, the two demodulators agree over the whole bit, not only at $t=T_b$. The matched-filter output is the ramp $y(t)=s_m t/\\sqrt{T_b}$ for $0\\le t\\le T_b$, and the correlator output at time $t$ is the same running integral $\\int_0^t x(\\tau)\\psi(\\tau)\\,d\\tau$.'},
{t:'box', kind:'warn', hd:'A different basis shape', html:'For a shape such as a half-sine $\\psi$, the running matched-filter output and the running correlator output differ before $t=T_b$. Only at $t=T_b$ do the two demodulators agree, because that is where the convolution and the correlation cover the same interval.'},
{t:'eqbox', cap:'The decision statistic',
 tex:'y=\\int_0^{T_b}x(\\tau)\\psi(\\tau)\\,d\\tau=s_m\\underbrace{\\int_0^{T_b}\\psi^{2}}_{=1}+\\underbrace{\\int_0^{T_b}w\\psi}_{n}=s_m+n',
 after:'The noise term $n$ is Gaussian, because it is a linear operation on a Gaussian process.'},
{t:'p', text:'Find the variance of $n$ from the autocorrelation of white noise. Write $n^2$ as a double integral, substitute the two-sided density, and use the sifting property of $\\delta(\\tau-u)$.'},
{t:'eqbox', cap:'The noise variance, step by step', tex:[
  '\\begin{aligned}E[n^{2}]&=\\int_0^{T_b}\\!\\!\\int_0^{T_b}E[w(\\tau)w(u)]\\,\\psi(\\tau)\\psi(u)\\,d\\tau\\,du\\\\&=\\int_0^{T_b}\\!\\!\\int_0^{T_b}\\frac{N_0}{2}\\,\\delta(\\tau-u)\\,\\psi(\\tau)\\psi(u)\\,d\\tau\\,du\\\\&=\\frac{N_0}{2}\\int_0^{T_b}\\psi^{2}(\\tau)\\,d\\tau=\\frac{N_0}{2}\\end{aligned}'],
 after:'The inner integral sifts $\\delta(\\tau-u)$ against $\\psi(u)$, leaving $\\psi(\\tau)$. The unit energy of $\\psi$ then makes the answer $N_0/2$, independent of the interval length.'},

{t:'h2', num:'2.4', text:'The decision and its error probability'},
{t:'eqbox', cap:'What the detector is given', tex:[
  '\\sigma_n^{2}=\\frac{N_0}{2}',
  'y=s_m+n\\;\\sim\\;\\mathcal{N}\\!\\left(s_m,\\;\\frac{N_0}{2}\\right)'],
 after:'The two-sided convention arrives here unchanged. Reading the density as one-sided makes every error probability in the course $3$ dB too optimistic, and nothing in the algebra shows it.'},
{t:'p', text:'The detector decides $s_1$ when $y>\\lambda$. Write each conditional error as a Gaussian tail, using $s_0=-\\sqrt{E_b}$, $s_1=+\\sqrt{E_b}$ and $\\sigma=\\sqrt{N_0/2}$.'},
{t:'eqbox', cap:'The conditional errors, with the substitution shown', tex:[
  '\\begin{aligned}P(\\text{err}\\mid s_0)&=\\int_{\\lambda}^{\\infty}\\frac{1}{\\sqrt{\\pi N_0}}\\,e^{-(y+\\sqrt{E_b})^{2}/N_0}\\,dy\\\\&=\\int_{(\\lambda+\\sqrt{E_b})/\\sigma}^{\\infty}\\frac{1}{\\sqrt{2\\pi}}\\,e^{-z^{2}/2}\\,dz=Q\\!\\left(\\frac{\\lambda+\\sqrt{E_b}}{\\sigma}\\right)\\end{aligned}',
  'P(\\text{err}\\mid s_1)=\\int_{-\\infty}^{\\lambda}f_Y(y\\mid s_1)\\,dy=Q\\!\\left(\\frac{\\sqrt{E_b}-\\lambda}{\\sigma}\\right)'],
 after:'The substitution $z=(y+\\sqrt{E_b})/\\sigma$ turns the lower limit $y=\\lambda$ into $z=(\\lambda+\\sqrt{E_b})/\\sigma$, which is the argument of $Q$. The second line follows the same way with $z=(\\sqrt{E_b}-y)/\\sigma$.'},
{t:'p', text:'The average error $P_e(\\lambda)$ weights each conditional error by its prior. Differentiate with respect to $\\lambda$ by the Leibniz rule, set the result to zero, and the two prior-weighted densities must be equal there.'},
{t:'eqbox', cap:'The optimal threshold, derived', tex:[
  '\\begin{aligned}P_e(\\lambda)&=P(s_0)\\,P(\\text{err}\\mid s_0)+P(s_1)\\,P(\\text{err}\\mid s_1)\\\\\\frac{dP_e}{d\\lambda}&=-P(s_0)\\,f_Y(\\lambda\\mid s_0)+P(s_1)\\,f_Y(\\lambda\\mid s_1)=0\\end{aligned}',
  '\\begin{aligned}P(s_0)\\,e^{-(\\lambda+\\sqrt{E_b})^{2}/N_0}&=P(s_1)\\,e^{-(\\lambda-\\sqrt{E_b})^{2}/N_0}\\\\4\\lambda\\sqrt{E_b}&=N_0\\ln\\frac{P(s_0)}{P(s_1)}\\end{aligned}',
  '\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_0)}{P(s_1)}'],
 after:'The common factor $1/\\sqrt{\\pi N_0}$ cancels from the equal-density equation. Taking logarithms and expanding the two squares $(\\lambda+\\sqrt{E_b})^{2}$ and $(\\lambda-\\sqrt{E_b})^{2}$ leaves only the term $4\\lambda\\sqrt{E_b}$, since the $\\lambda^{2}$ and $E_b$ terms cancel. Equal priors put the threshold at the midpoint. If $s_0$ is more likely, the threshold moves in the positive direction, enlarging the decision region for $s_0$.'},

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

{t:'p', text:'The Gaussian tail used above is defined by an integral, and it has no closed form. A few of its values are used throughout the course.'},
{t:'eqbox', cap:'The Q function', tex:'Q(x)=\\frac{1}{\\sqrt{2\\pi}}\\int_x^{\\infty}e^{-z^{2}/2}\\,dz=\\tfrac12\\operatorname{erfc}\\!\\left(\\frac{x}{\\sqrt2}\\right)',
 after:'$Q(x)$ is the probability that a Gaussian variable of mean $0$ and variance $1$ exceeds $x$. Three values recur: $Q(1)=0.159$, $Q(2)=0.0228$, $Q(3)=1.35\\times10^{-3}$.'},
{t:'p', text:'With equal priors the threshold is at the origin, $\\lambda=0$, and both conditional errors become the same Gaussian tail.'},
{t:'eqbox', cap:'The result of the chapter', big:true, tex:[
  '\\frac{\\sqrt{E_b}}{\\sigma}=\\frac{\\sqrt{E_b}}{\\sqrt{N_0/2}}=\\sqrt{\\frac{2E_b}{N_0}}',
  'P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)'],
 after:'It depends on $E_b/N_0$ and on nothing else — not on the amplitude, not on the bit duration, not on the pulse shape. Doubling the amplitude and quartering the duration change neither the energy per bit nor the answer.'},
{t:'box', kind:'warn', hd:'Antipodal and orthogonal signals', html:'Antipodal signaling gives $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$. On-off or orthogonal signaling gives $Q\\!\\left(\\sqrt{E_b/N_0}\\right)$ and needs $3$ dB more energy. For on-off signaling, half the symbols have zero energy. Therefore, average bit energy is half the nonzero-symbol energy.'},

{t:'fig', svg:()=>{
  const a=ax({w:560,h:250,xr:[0,12],yr:[-7,-0.02],xlabel:'E_b/N_0\\;(\\mathrm{dB})',
    ylabel:'P_b',ytickfmt:P.decade,yticksOverride:P.decades(-7,-1),zeroAxes:false,xtarget:6,ytarget:6,pad:{l:56,r:22,t:20,b:38}});
  a.curve(d=>Math.log10(Math.max(1e-12,Q(Math.sqrt(2*Math.pow(10,d/10))))),
    {color:C.in,width:2.3});
  return a.svg();
}, cap:'Bit error probability against $E_b/N_0$. Past about $8$ dB every extra decibel is worth roughly an order of magnitude in error rate.'},

{t:'ex', hd:'Example 2.4 — unequal priors', rows:[
 ['Given','A binary PAM system with correlator output $y=\\pm\\sqrt{E_b}+n$, where $P(s_1)=0.3$, $E_b=1$ and $N_0=0.1$.'],
 ['Find','The optimal threshold and the average error probability there.'],
 ['Method','Threshold from the log-ratio of the priors. Each conditional error from a Gaussian tail. Average by weighting.'],
 ['Solution','$\\lambda=\\frac{0.1}{4}\\ln\\frac{0.7}{0.3}=0.0212$ and $\\sigma=\\sqrt{0.05}=0.2236$. Then $P(\\text{err}\\mid s_0)=Q(4.567)=2.475\\times10^{-6}$ and $P(\\text{err}\\mid s_1)=Q(4.377)=6.005\\times10^{-6}$, so $P_e=0.7(2.475)+0.3(6.005)$ in units of $10^{-6}$, giving $3.534\\times10^{-6}$.'],
 ['Check','Leaving the threshold at zero would give $Q(\\sqrt{20})=3.872\\times10^{-6}$. The ratio $3.872/3.534=1.096$, so moving the threshold improves the answer by about $10$ per cent. A real gain and a small one. This is what a shift of a tenth of a standard deviation buys.']
]},

{t:'page'},

{t:'h2', num:'2.5', text:'Intersymbol interference'},
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

{t:'p', text:'A first-order RC lowpass channel makes the interference concrete. Its transfer function has one parameter, the $3$ dB bandwidth $B$.'},
{t:'eqbox', cap:'The channel and its response to one bit', tex:[
  'H(f)=\\frac{1}{1+jf/B},\\qquad\\tau=\\frac{1}{2\\pi B}',
  'r(T_b)=1-q,\\qquad q=e^{-2\\pi BT_b}'],
 after:'$\\tau$ is the time constant of the channel. A single bit reaches only the fraction $1-q$ of its own level by the end of the bit. The rest arrives after the bit ends, as a decaying tail.'},
{t:'p', text:'A bit that ended $m$ bits ago still contributes to the present sample, because its tail has not fully decayed.'},
{t:'eqbox', cap:'One earlier bit\'s share of the present sample, and the worst case', tex:[
  '(1-q)\\,q^{m}',
  '\\sum_{m=1}^{\\infty}(1-q)\\,q^{m}=q'],
 after:'The sum is a geometric series and adds to $q$. When every earlier bit opposes the present one, the sample shrinks from $1-q$ to $1-2q$, and the eye opening is $2(1-2q)$.'},
{t:'p', text:'The eye closes when the opening reaches zero. Set $1-2q=0$ and solve for the bandwidth.'},
{t:'eqbox', cap:'Eye closure', tex:'1-2q=0\\;\\Longrightarrow\\;e^{-2\\pi BT_b}=\\tfrac12\\;\\Longrightarrow\\;BT_b=\\frac{\\ln2}{2\\pi}=0.110',
 after:'Below $BT_b=0.110$ some bit patterns cross zero at the sampling instant, and decisions fail even without noise. At $BT_b=0.25$, $q=0.208$, so $1-q=0.792$ and $1-2q=0.584$. At $BT_b=0.3$, $q=0.152$ and the opening $2(1-2q)$ is $1.39$.'},

{t:'ex', hd:'Example 2.5 — a sample with a bit-pattern history', rows:[
 ['Given','Bits $0\\,0\\,0\\,1\\,1\\,1\\,0\\,1$ sent after a line idle at the level of a $0$ ($a_k=-1$), through an RC channel with $BT_b=0.25$, so $q=0.208$.'],
 ['Find','The sample at the end of the seventh bit, $y_7$.'],
 ['Method','Add the bit\'s own share $(1-q)$ or $-(1-q)$ to the tails of every earlier bit, each weighted by $(1-q)q^{m}$.'],
 ['Solution','The seventh bit is a $0$, contributing $-(1-q)$. The three $1$s before it (bits four to six) contribute $(1-q)(q+q^{2}+q^{3})$. Every bit before that, and the idle line, is a $0$ and contributes $-(1-q)\\sum_{m\\ge4}q^{m}$. So $y_7=-(1-q)+(1-q)(q+q^{2}+q^{3})-(1-q)\\sum_{m\\ge4}q^{m}=-1+2q-2q^{4}=-0.588$.'],
 ['Check','The sample is negative, so the receiver still decides $0$ correctly. The result depends on the whole bit history through the geometric tails, not on the previous bit alone.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use the full history of bits, not only the previous bit. Each earlier bit still contributes through its own tail $(1-q)q^{m}$, however small.'},

{t:'h2', num:'2.6', text:'Nyquist\'s criterion and the raised cosine'},
{t:'p', text:'The interference vanishes exactly when the overall pulse is zero at every sampling instant but its own. Sampling $p$ at those instants and transforming turns that requirement into a statement about the spectrum.'},
{t:'eqbox', cap:'Nyquist\'s criterion for distortionless transmission', tex:[
  'p\\bigl((i-k)T_b\\bigr)=\\begin{cases}1,&i=k\\\\0,&i\\ne k\\end{cases}',
  'R_b\\sum_n P(f-nR_b)=1,\\qquad R_b=\\frac{1}{T_b}'],
 after:'In words: the replicas of the pulse spectrum, spaced by the symbol rate, must add to a constant. The simplest spectrum that does it is a rectangle of width $2W$ with $W=R_b/2$, the <b>Nyquist bandwidth</b>, whose pulse is $\\operatorname{sinc}(2Wt)$.'},
{t:'box', kind:'ok', hd:'The rate a bandwidth supports', html:'A channel of bandwidth $W$ carries at most $2W$ symbols per second with no interference. This is the counterpart of the sampling theorem, reached from the other end of the same argument.'},
{t:'p', text:'The sinc pulse of the ideal Nyquist channel is impractical. Its terms fall only as $1/(\\pi|k|)$, so the sum of their sizes grows like $\\sum1/k$. For example, $\\operatorname{sinc}(0.1)=0.984$ is barely smaller than $1$. A small timing error still collects interference from many neighbours at once, because so many terms are involved. The fix is to widen the spectrum and taper its edges while keeping the tiling property.'},
{t:'eqbox', cap:'The raised cosine', tex:[
  'P(f)=\\begin{cases}\\dfrac{1}{2W},&|f|<f_1\\\\[6pt]\\dfrac{1}{4W}\\left[1+\\cos\\dfrac{\\pi(|f|-f_1)}{2W-2f_1}\\right],&f_1\\le|f|<2W-f_1\\\\[6pt]0,&|f|\\ge2W-f_1\\end{cases}',
  'p(t)=\\operatorname{sinc}\\!\\left(\\frac{t}{T_b}\\right)\\frac{\\cos(\\pi\\alpha t/T_b)}{1-4\\alpha^{2}t^{2}/T_b^{2}},\\qquad f_1=W(1-\\alpha)'],
 after:'$W=R_b/2$ and $\\alpha$ runs from $0$ to $1$. The sinc factor in $p(t)$ keeps the zero crossings at $t=iT_b$, so the criterion still holds. For $\\alpha>0$ the second factor falls as $1/t^{2}$, so the pulse tails fall as $1/|t|^{3}$. The price is bandwidth: $B_T=W(1+\\alpha)=\\frac{R_b}{2}(1+\\alpha)$, an excess of $\\alpha W$ over the Nyquist bandwidth $W$.'},

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

{t:'ex', hd:'Example 2.6 — fitting a rate into a channel', rows:[
 ['Given','A channel of bandwidth $48$ kHz is to carry $64$ kbit/s with raised-cosine shaping.'],
 ['Find','The Nyquist bandwidth and the largest roll-off that fits.'],
 ['Method','$W=R_b/2$, then $(1+\\alpha)W\\le B$.'],
 ['Solution','$W=32$ kHz, and $(1+\\alpha)(32)\\le48$ gives $\\alpha\\le0.5$. At $\\alpha=0.5$ the signal uses the whole $48$ kHz, with an excess of $16$ kHz over the Nyquist bandwidth.'],
 ['Check','At $\\alpha=0$, the signal needs only $32$ kHz and still fits. However, its pulse decays as $1/t$, and its ideal filter cannot be built. Using the available bandwidth gives a pulse that decays as $1/t^{3}$. The spectral efficiency is $64/48=1.33$ bit/s/Hz, below the theoretical maximum of $2$.']
]},

{t:'ex', hd:'Example 2.7 — the bandwidth of a raised-cosine link', rows:[
 ['Given','A link sends $R_b=20$ kb/s with raised-cosine pulses and $\\alpha=0.5$.'],
 ['Find','$W$, $f_1$ and $B_T$.'],
 ['Method','$W=R_b/2$, then $f_1=W(1-\\alpha)$ and $B_T=W(1+\\alpha)$.'],
 ['Solution','$W=20/2=10$ kHz. $f_1=10(1-0.5)=5$ kHz. $B_T=10(1+0.5)=15$ kHz.'],
 ['Check','$B_T-W=W-f_1=5$ kHz, so the roll-off is symmetric about $W$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $W=R_b/2=10$ kHz, not $W=R_b=20$ kHz. The wrong $W$ gives $B_T=30$ kHz, twice the true value.'},

{t:'p', text:'The raised-cosine filter can be split between the transmitter and the receiver. Each half is a square root of the raised cosine.'},
{t:'eqbox', cap:'The root-raised-cosine split', tex:'H_T(f)\\,H_R(f)=P(f),\\qquad H_T(f)=H_R(f)=\\sqrt{P(f)}',
 after:'For a real, even $\\sqrt{P(f)}$, $H_R=H_T^{*}$, so the receive filter is matched to the transmitted pulse. The link then has both the smallest error probability and zero interference. At $\\alpha=0.5$ the raised cosine is at half height at $f=W$, so $\\sqrt{2W\\,P(W)}=\\sqrt{0.5}=0.707$.'},

{t:'h2', num:'2.7', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Matched filter','$h_{\\mathrm{opt}}(t)=g(T-t)$','PS CH8.3.2'],
 ['What it achieves','$\\eta_{\\max}=2E/N_0$, independent of the pulse shape','PS CH8.3.2'],
 ['Decision statistic','$y=s_m+n$, $\\;n\\sim\\mathcal{N}(0,N_0/2)$','PS CH8.3.1'],
 ['Optimal threshold','$\\lambda=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_0)}{P(s_1)}$','PS CH8.3.3'],
 ['Antipodal error','$P_b=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$','PS CH8.3.3'],
 ['On-off error','$P_b=Q\\!\\left(\\sqrt{E_b/N_0}\\right)$, three decibels worse','PS CH8.3.3'],
 ['RC-channel interference','worst case $\\sum_m(1-q)q^{m}=q$, $\\;q=e^{-2\\pi BT_b}$','PS CH10.1.1'],
 ['Eye closure','opening $2(1-2q)$ vanishes at $BT_b=\\ln2/(2\\pi)=0.110$','PS CH10.1.1'],
 ['Nyquist criterion','$R_b\\sum_n P(f-nR_b)=1$','PS CH10.3.1'],
 ['Nyquist bandwidth','$W=R_b/2$, the least bandwidth with zero interference','PS CH10.3.1'],
 ['Raised cosine','$B_T=W(1+\\alpha)$','PS CH10.3.1'],
 ['Root-raised-cosine split','$H_T(f)=H_R(f)=\\sqrt{P(f)}$, matched and free of interference','PS CH10.5.1']
]},
{t:'p', text:'Two waveforms have become two points on a line, and the error probability has turned out to depend on the distance between them. Chapter 3 asks what happens when there are more than two waveforms, and finds that the same picture works with more axes.'}

];
})();
