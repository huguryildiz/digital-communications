/* ==========================================================================
   Practice questions — Module 2.

   Three of the six shapes come from the question tables: the matched-filter
   question with its conditional densities and threshold, the binary decision
   under a noise density that is not Gaussian, and the unequal-prior PAM
   question answered as a number rather than as a Q. The other three come from
   the worked material: the matched filter on its own, the error probability as
   a function of energy per bit, and the bandwidth questions of the second half
   of the module.

   Every question keeps the shape of its type and none of its numbers.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

CONTENT.DRILLTYPES.M2 = [
  { k:'mf', name:'Designing the matched filter',
    asks:'A pulse is given. Give the filter matched to it, the output at the sampling instant, and the signal-to-noise ratio that results.',
    method:['The impulse response is the pulse reversed in time and shifted into the interval: $h_{\\mathrm{opt}}(t)=g(T-t)$. Sketch the reversal before writing it down.',
            'The output at $t=T$ is the energy of the pulse, $\\int_0^T g^{2}(t)\\,dt$. Compute the energy first; everything else follows from it.',
            'The peak signal-to-noise ratio is $2E/N_0$ and depends on nothing else about the pulse. Two pulses of the same energy give the same answer.'],
    go:'m2-matched' },

  { k:'cond', name:'Conditional densities, threshold and error probability',
    asks:'A demodulator output is given with its noise. Write the two conditional densities, place the threshold and give the average error probability.',
    method:['Write $y=s_m+n$ and identify the mean and variance under each hypothesis. For a unit-energy basis the variance is $N_0/2$.',
            'With equal priors the threshold is midway between the two means. With unequal priors it is $\\lambda=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_0)}{P(s_1)}$ for antipodal signalling, and the crossing of the weighted densities in general.',
            'Each conditional error is a Gaussian tail: $P(Y>y)=Q\\!\\left(\\frac{y-\\mu}{\\sigma}\\right)$. Weight the two by the priors and add.'],
    go:'m2-threshold' },

  { k:'nongauss', name:'A binary decision under a noise density that is not Gaussian',
    asks:'A noise density is given that is not Gaussian. Find any unknown constant, then the two conditional errors and the threshold.',
    method:['Find the constant from $\\int f_N(n)\\,dn=1$ before anything else.',
            'Do not reach for $Q$. Integrate the given density over the region that causes an error, region by region, exactly as the definition asks.',
            'The threshold that minimises the error still satisfies $P(s_1)f_Y(\\lambda\\mid s_1)=P(s_0)f_Y(\\lambda\\mid s_0)$, but with a density that has finite support or a kink the solution may sit at an edge rather than where a derivative vanishes.'],
    go:'m2-stat' },

  { k:'ebn0', name:'Error probability against energy per bit',
    asks:'A system is specified by its energy per bit and noise density, or by a target error rate. Find the other.',
    method:['$P_b=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$ for antipodal signalling and $Q\\!\\left(\\sqrt{E_b/N_0}\\right)$ for on-off or orthogonal signalling — a factor of two inside, three decibels outside.',
            'Going the other way, invert the $Q$: read $x$ from $Q(x)=P_b$, then $E_b/N_0=x^{2}/2$.',
            'Raising the bit rate at fixed transmit power lowers $E_b$ in proportion, so a factor of four in rate costs $6.02$ dB.'],
    go:'m2-pe' },

  { k:'isi', name:'Bandwidth, the Nyquist criterion and the eye',
    asks:'A bit rate or a bandwidth is given with a roll-off. Find the other, or read an eye.',
    method:['The Nyquist bandwidth is $W=R_b/2$: a bandwidth $W$ carries at most $2W$ symbols per second with no interference.',
            'A raised cosine occupies $B_T=(1+\\alpha)W$, so the excess over Nyquist is $\\alpha W$ and a given bandwidth supports $R_b=2B_T/(1+\\alpha)$.',
            'Worst-case interference is $\\sum_{k\\ne 0}|p(kT_b)|$ over both sides, and the eye opening is $2\\left(|p(0)|-\\text{that sum}\\right)$.'],
    go:'m2-nyquist' },

  { k:'full', name:'A full-length question combining several of the shapes above',
    asks:'One statement and three or four lettered parts, each usually resting on the part before it.',
    method:['Read every part before starting. The filter of part (a) produces the statistic of part (b), which produces the threshold of part (c).',
            'Keep the noise convention straight: the density is two-sided $N_0/2$, so the variance of the decision statistic is $N_0/2$ and not $N_0$.',
            'Carry exact values between parts, and check each against the one before: an error probability must fall when the energy rises, and a threshold must lie between the two signal points.'] }
];

CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- single-skill ---------------------------------------------------- */

{ id:'D2-01', module:'M2', type:'mf', src:'MT Q3',
  stem:'A rectangular pulse of amplitude $A=2$ V and duration $T=4$ ms is received in white Gaussian noise of two-sided power spectral density $N_0/2$ with $N_0=10^{-3}$ W/Hz.',
  parts:['Give the impulse response of the matched filter.',
         'Give the filter output at $t=T$.',
         'Give the peak signal-to-noise ratio, in decibels.'],
  sol:'<b>Given.</b> $A=2$ V, $T=4$ ms, $N_0=10^{-3}$ W/Hz.<br>'
     +'<b>Find.</b> $h_{\\mathrm{opt}}$, $y(T)$ and $(\\mathrm{SNR})_o$.<br>'
     +'<b>Method.</b> Reverse and shift the pulse; the output at $T$ is its energy; the ratio is $2E/N_0$.<br>'
     +'<b>Solution — (a).</b> $h_{\\mathrm{opt}}(t)=g(T-t)$. A rectangle reversed is the same rectangle, so $h_{\\mathrm{opt}}(t)=2$ V for $0\\le t\\le 4$ ms and zero elsewhere.<br>'
     +'<b>Solution — (b).</b> $y(T)=E=\\int_0^{T}A^{2}dt=A^{2}T=4(0.004)=0.016$ J.<br>'
     +'<b>Solution — (c).</b> $(\\mathrm{SNR})_o=\\dfrac{2E}{N_0}=\\dfrac{2(0.016)}{10^{-3}}=32$, which is $10\\log_{10}32=15.05$ dB.<br>'
     +'<b>Check.</b> The filter output is a triangle peaking at $t=T$ with peak equal to the energy, so the value in (b) is also the height of that triangle. Halving the amplitude quarters the energy and costs $6.02$ dB, which is the same exchange rate the quantizer had for a different reason.',
  err:'Reporting $y(T)=A=2$. The matched filter returns the <em>energy</em>, not the amplitude, and the two have different units.',
  teach:'Ask what happens to (c) if the pulse is stretched to $8$ ms at the same amplitude. The energy doubles and the ratio gains $3$ dB — at the cost of halving the bit rate, which is the trade the whole subject turns on.' },

{ id:'D2-02', module:'M2', type:'mf', src:'MT Q3',
  stem:'A ramp pulse $s(t)=A\\,t/T$ is used on $0\\le t\\le T$ and zero elsewhere.',
  parts:['Give its energy.',
         'Give the impulse response of the matched filter.',
         'By how many decibels does it fall short of a rectangular pulse of the same peak amplitude?'],
  sol:'<b>Given.</b> A ramp reaching $A$ at $t=T$.<br>'
     +'<b>Find.</b> $E$, $h_{\\mathrm{opt}}$ and the loss against a rectangle of the same peak.<br>'
     +'<b>Method.</b> Integrate the square; reverse and shift; compare the two energies.<br>'
     +'<b>Solution — (a).</b> $E=\\displaystyle\\int_0^{T}\\frac{A^{2}t^{2}}{T^{2}}dt=\\frac{A^{2}T}{3}$.<br>'
     +'<b>Solution — (b).</b> $h_{\\mathrm{opt}}(t)=s(T-t)=A(T-t)/T$, a ramp falling from $A$ at $t=0$ to zero at $t=T$.<br>'
     +'<b>Solution — (c).</b> The rectangle has $E=A^{2}T$, three times as much, so the ramp loses $10\\log_{10}3=4.77$ dB.<br>'
     +'<b>Check.</b> Both filters are triangles reversed; the difference is entirely in the energy. A pulse of the same <em>energy</em> and any shape would lose nothing at all — the comparison here is at equal peak amplitude, which is a constraint on the transmitter rather than on the theory.',
  err:'Concluding that the ramp is worse because it is a worse shape. It is worse because it carries less energy for the same peak, and a designer limited by average power rather than peak power would find them equal.',
  teach:'This question separates two things students merge: the theory says shape does not matter at equal energy, and a real transmitter constrains the peak. Both are true and they say different things.' },

{ id:'D2-03', module:'M2', type:'mf', src:'CH8 s.13',
  stem:'A half-sine pulse $s(t)=B\\sin(\\pi t/T)$ on $0\\le t\\le T$ is to give the same matched-filter performance as a rectangular pulse of amplitude $A$ and the same duration.',
  parts:['Give the energy of each pulse.',
         'Give the peak amplitude $B$ the half-sine needs.'],
  sol:'<b>Given.</b> A half-sine of peak $B$ and a rectangle of amplitude $A$, both of duration $T$.<br>'
     +'<b>Find.</b> The $B$ that equalises the performance.<br>'
     +'<b>Method.</b> Performance is $2E/N_0$, so equal performance is equal energy.<br>'
     +'<b>Solution — (a).</b> $E_{\\text{rect}}=A^{2}T$ and $E_{\\text{sine}}=B^{2}\\displaystyle\\int_0^{T}\\sin^{2}(\\pi t/T)\\,dt=\\dfrac{B^{2}T}{2}$.<br>'
     +'<b>Solution — (b).</b> Setting them equal, $B^{2}T/2=A^{2}T$, so $B=A\\sqrt2$.<br>'
     +'<b>Check.</b> The half-sine must peak $41\\%$ higher because its average square is only half its peak square, while the rectangle\'s is all of it. The bound $2E/N_0$ contains no shape parameter, so once the energies match nothing else can distinguish them — which is worth stating as the answer to (b) rather than merely computing it.',
  err:'Equating the peak amplitudes and concluding the two are equivalent. Equal peaks give unequal energies, and it is energy the bound depends on.',
  teach:'A good place to ask what the matched filter for the half-sine looks like. It is the same half-sine, because that pulse is symmetric about the middle of its interval.' },

{ id:'D2-04', module:'M2', type:'ebn0', src:'Final Q2',
  stem:'An antipodal baseband system has $E_b=4\\times10^{-6}$ J per bit and noise of two-sided density $N_0/2$ with $N_0=10^{-6}$ W/Hz. The two symbols are equally likely.',
  parts:['Give $E_b/N_0$ in decibels.',
         'Give the bit error probability.'],
  sol:'<b>Given.</b> $E_b=4\\times10^{-6}$ J, $N_0=10^{-6}$ W/Hz, equal priors.<br>'
     +'<b>Find.</b> $E_b/N_0$ in dB and $P_b$.<br>'
     +'<b>Method.</b> The ratio first, then $P_b=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$.<br>'
     +'<b>Solution — (a).</b> $E_b/N_0=4$, which is $10\\log_{10}4=6.02$ dB.<br>'
     +'<b>Solution — (b).</b> $P_b=Q\\!\\left(\\sqrt{8}\\right)=Q(2.828)=2.34\\times10^{-3}$.<br>'
     +'<b>Check.</b> About one bit in $430$. At $6$ dB the system is in the region where a decibel is worth roughly a factor of three in error rate, which is the shape of the curve near its knee; further out each decibel is worth an order of magnitude.',
  err:'Computing $Q(4)$ from the ratio directly instead of $Q(\\sqrt{2\\times4})$. The argument of $Q$ is a square root, and forgetting it here gives $3\\times10^{-5}$, two orders out.',
  teach:'Worth having the student state the answer as "one error in every N bits". The decibel scale hides how large the numbers are.' },

{ id:'D2-05', module:'M2', type:'ebn0', src:'Final Q2',
  stem:'An antipodal system is required to achieve a bit error probability of $10^{-5}$.',
  parts:['Give the argument of $Q$ that produces it.',
         'Give the required $E_b/N_0$, as a ratio and in decibels.'],
  sol:'<b>Given.</b> A target $P_b=10^{-5}$.<br>'
     +'<b>Find.</b> The $E_b/N_0$ that meets it.<br>'
     +'<b>Method.</b> Invert the $Q$ function, then undo the square root.<br>'
     +'<b>Solution — (a).</b> $Q(x)=10^{-5}$ at $x=4.265$.<br>'
     +'<b>Solution — (b).</b> $2E_b/N_0=x^{2}=18.19$, so $E_b/N_0=9.09$, which is $9.59$ dB.<br>'
     +'<b>Check.</b> The previous question gave $2.34\\times10^{-3}$ at $6.02$ dB. Moving from there to $10^{-5}$ has cost $3.57$ dB and bought a factor of $234$ — roughly two orders of magnitude for three and a half decibels, which is the steepness the curve has in this region.',
  err:'Reporting $E_b/N_0=18.19$, the value of $x^{2}$, without halving. The two differ by $3$ dB and the mistake is invisible unless the answer is sanity-checked forwards.',
  teach:'Ask the student to check the answer by substituting it back. Inverting a $Q$ is the one operation in this module with no forward intuition to catch a slip.' },

{ id:'D2-06', module:'M2', type:'cond', src:'Final Q2',
  stem:'An antipodal system has $E_b=1$ and $N_0=0.2$. The symbol $s_0$ is sent with probability $0.8$.',
  parts:['Give the optimal threshold.',
         'Say which way it has moved, and why that is the right direction.'],
  sol:'<b>Given.</b> $E_b=1$, $N_0=0.2$, $P(s_0)=0.8$.<br>'
     +'<b>Find.</b> $\\lambda_{\\mathrm{opt}}$ and its direction.<br>'
     +'<b>Method.</b> $\\lambda_{\\mathrm{opt}}=\\dfrac{N_0}{4\\sqrt{E_b}}\\ln\\dfrac{P(s_0)}{P(s_1)}$.<br>'
     +'<b>Solution — (a).</b> $\\lambda_{\\mathrm{opt}}=\\dfrac{0.2}{4}\\ln\\dfrac{0.8}{0.2}=0.05\\ln4=0.0693$.<br>'
     +'<b>Solution — (b).</b> Positive, so it has moved towards $s_1=+1$ and away from $s_0=-1$. The region that decides $s_0$ has grown, which is right: $s_0$ is four times more likely, so a statistic near the middle should be resolved in its favour.<br>'
     +'<b>Check.</b> The shift is $0.0693$ against a signal separation of $2\\sqrt{E_b}=2$, so it is under four per cent of the way across — small, because at this noise level the densities are already well separated and the priors have little left to decide. Raising $N_0$ to $1$ would move the threshold to $0.347$, five times further.',
  err:'Getting the sign backwards by writing $\\ln\\frac{P(s_1)}{P(s_0)}$. The threshold then moves towards the more likely symbol, shrinking its own region, and the error probability rises rather than falls.',
  teach:'The check is the point: the size of the shift is set by the noise, and the direction by the priors. A student who can say which factor does which has understood the formula rather than memorised it.' },

{ id:'D2-07', module:'M2', type:'ebn0', src:'Final Q2',
  stem:'A system runs at $E_b/N_0=9$ dB. The bit rate is then raised by a factor of four with the transmit power and the noise density unchanged.',
  parts:['Give the new $E_b/N_0$ in decibels.',
         'Give the bit error probability before and after.'],
  sol:'<b>Given.</b> $E_b/N_0=9$ dB, rate multiplied by four at constant power.<br>'
     +'<b>Find.</b> The new ratio and both error probabilities.<br>'
     +'<b>Method.</b> Transmit power is $E_b R_b$. Holding power fixed while multiplying $R_b$ by four divides $E_b$ by four, which is $-6.02$ dB.<br>'
     +'<b>Solution — (a).</b> $9-6.02=2.98$ dB.<br>'
     +'<b>Solution — (b).</b> Before: $E_b/N_0=7.943$, so $P_b=Q(\\sqrt{15.89})=Q(3.986)=3.36\\times10^{-5}$. After: $E_b/N_0=1.986$, so $P_b=Q(\\sqrt{3.97})=Q(1.993)=2.31\\times10^{-2}$.<br>'
     +'<b>Check.</b> Four times the rate has cost nearly three orders of magnitude in error rate, from one bit in thirty thousand to one bit in forty-three. The energy per bit is the only quantity in the expression, and quadrupling the rate at fixed power is exactly quartering it.',
  err:'Assuming the error probability is unchanged because the power is unchanged. The error probability depends on energy per bit, not on power, and the two differ by the bit rate.',
  teach:'This is the cleanest statement in the module of what bandwidth and rate cost. It is worth setting before the Nyquist section rather than after it.' },

{ id:'D2-08', module:'M2', type:'nongauss', src:'MT Q4',
  stem:'A binary system has decision statistic $Y=s_m+N$, with $s_0=-1$, $s_1=+1$, equal priors, and noise of density $$f_N(n)=\\tfrac12 e^{-|n|},\\qquad n\\in\\mathbb{R}.$$The threshold is at zero.',
  parts:['Give $P(\\text{error}\\mid s_0)$.',
         'Give the average error probability, and compare it with the Gaussian case of the same noise variance.'],
  sol:'<b>Given.</b> Laplacian noise with unit scale; $s_m=\\pm1$; threshold at zero.<br>'
     +'<b>Find.</b> The conditional error and the average.<br>'
     +'<b>Method.</b> Integrate the given density over the error region. There is no $Q$ here.<br>'
     +'<b>Solution — (a).</b> With $s_0$ sent an error needs $Y>0$, that is $N>1$: $$P(N>1)=\\int_1^{\\infty}\\tfrac12 e^{-n}dn=\\tfrac12 e^{-1}=0.1839.$$<br>'
     +'<b>Solution — (b).</b> The density is symmetric and so is the signal set, so $P(\\text{error}\\mid s_1)$ is the same and $P_e=0.1839$. A Laplacian of unit scale has variance $2$; Gaussian noise of variance $2$ would give $Q(1/\\sqrt2)=Q(0.707)=0.2398$.<br>'
     +'<b>Check.</b> The Laplacian does better here, which is worth pausing on: it concentrates more probability near zero than a Gaussian of the same variance, and puts the rest further out in tails that a threshold at $\\pm1$ mostly does not reach.',
  err:'Reaching for $Q$ because the picture looks like the Gaussian one. $Q$ is defined for the standard normal and says nothing about any other density.',
  teach:'Ask what the optimal threshold is here. By symmetry it is zero, but the derivation that gives it is the density-crossing condition and not the Gaussian formula — a distinction the next question makes sharper.' },

{ id:'D2-09', module:'M2', type:'isi', src:'CH8 s.44–47',
  stem:'A baseband system transmits at $R_b=20$ kbit/s.',
  parts:['Give the Nyquist bandwidth.',
         'Give the transmission bandwidth with a raised-cosine roll-off of $\\alpha=0.35$.',
         'Give the excess bandwidth as a percentage.'],
  sol:'<b>Given.</b> $R_b=20$ kbit/s, $\\alpha=0.35$.<br>'
     +'<b>Find.</b> $W$, $B_T$ and the excess.<br>'
     +'<b>Method.</b> $W=R_b/2$; $B_T=(1+\\alpha)W$.<br>'
     +'<b>Solution — (a).</b> $W=10$ kHz.<br>'
     +'<b>Solution — (b).</b> $B_T=1.35(10)=13.5$ kHz.<br>'
     +'<b>Solution — (c).</b> The excess is $\\alpha W=3.5$ kHz, which is $35\\%$ of the Nyquist bandwidth — the roll-off, read as a percentage, which is what it is.<br>'
     +'<b>Check.</b> At $\\alpha=0$ the answer would be $10$ kHz and the pulse would be the ideal Nyquist one; at $\\alpha=1$ it would be $20$ kHz. Every value of $\\alpha$ between gives a system with zero interference at the sampling instants, so the $3.5$ kHz is bought entirely for tolerance to timing error and ease of filtering.',
  err:'Computing $B_T=(1+\\alpha)R_b=27$ kHz. The roll-off multiplies the <em>bandwidth</em>, which is half the rate, not the rate.',
  teach:'Worth asking what fraction of the theoretical maximum rate this system achieves: $20$ kbit/s in $13.5$ kHz is $1.48$ bit/s/Hz against a maximum of $2$.' },

{ id:'D2-10', module:'M2', type:'isi', src:'CH8 s.44–47',
  stem:'A channel of bandwidth $24$ kHz is to carry a raised-cosine baseband signal with roll-off $\\alpha=0.5$.',
  parts:['Give the largest Nyquist bandwidth that fits.',
         'Give the largest bit rate.'],
  sol:'<b>Given.</b> $B_T=24$ kHz available, $\\alpha=0.5$.<br>'
     +'<b>Find.</b> $W$ and $R_b$.<br>'
     +'<b>Method.</b> Invert $B_T=(1+\\alpha)W$, then $R_b=2W$.<br>'
     +'<b>Solution — (a).</b> $W=\\dfrac{B_T}{1+\\alpha}=\\dfrac{24}{1.5}=16$ kHz.<br>'
     +'<b>Solution — (b).</b> $R_b=2W=32$ kbit/s.<br>'
     +'<b>Check.</b> With $\\alpha=0$ the same channel would carry $48$ kbit/s, so the roll-off has cost a third of the rate. That is what the $50\\%$ excess bandwidth means seen from the other end, and it is why practical systems use a fifth to a half rather than one.',
  err:'Answering $R_b=2B_T=48$ kbit/s. That is the rate the ideal Nyquist channel would give; the raised cosine has to fit its excess inside the same $24$ kHz.',
  teach:'Ask for the spectral efficiency in bit/s/Hz — here $32/24=1.33$ — and then for the value of $\\alpha$ that would reach $1.6$. It is a short calculation and it makes the trade a number.' },

{ id:'D2-11', module:'M2', type:'isi', src:'CH8 s.42–44',
  stem:'A system uses the ideal Nyquist pulse $p(t)=\\operatorname{sinc}(2Wt)$ with $W=1/(2T_b)$.',
  parts:['Verify Nyquist\'s criterion in the time domain.',
         'Verify it in the frequency domain.'],
  sol:'<b>Given.</b> $p(t)=\\operatorname{sinc}(2Wt)$, $T_b=1/(2W)$.<br>'
     +'<b>Find.</b> That the criterion holds, both ways.<br>'
     +'<b>Method.</b> The time condition is about the sampling instants; the frequency condition is about the replicas adding to a constant.<br>'
     +'<b>Solution — (a).</b> At $t=kT_b=k/(2W)$ the argument is $2W\\cdot k/(2W)=k$, and $\\operatorname{sinc}(k)$ is $1$ at $k=0$ and $0$ at every other integer. So $p(kT_b)=\\delta_{k0}$, which is the criterion.<br>'
     +'<b>Solution — (b).</b> $P(f)=\\dfrac{1}{2W}$ for $|f|\\le W$ and zero outside, a rectangle of width $2W=R_b$. Replicas spaced $R_b$ apart therefore tile the axis exactly with no gap and no overlap, so $R_b\\sum_n P(f-nR_b)=R_b\\cdot\\dfrac{1}{2W}=1$.<br>'
     +'<b>Check.</b> The two verifications are the same statement: a spectrum whose replicas add to a constant has a sampled pulse that is a single impulse, and a sampled pulse that is a single impulse is a pulse that vanishes at every instant but its own.',
  err:'Checking only that $p(0)=1$. The criterion is about the zeros as much as the peak, and a pulse with the right peak and the wrong zeros gives interference at every instant.',
  teach:'Have the student say why the width has to be exactly $R_b$. Narrower leaves gaps and the sum is not constant; wider overlaps and the sum is not constant either, unless the overlap is shaped — which is what the raised cosine does.' },

{ id:'D2-12', module:'M2', type:'cond', src:'MT Q3',
  stem:'A correlator multiplies the received signal by a unit-energy basis function $\\psi(t)$ and integrates over $0\\le t\\le T_b$. The noise $w(t)$ is white and Gaussian with two-sided density $N_0/2$.',
  parts:['Show that the noise contribution $n=\\int_0^{T_b}w(\\tau)\\psi(\\tau)d\\tau$ has zero mean.',
         'Show that its variance is $N_0/2$.'],
  sol:'<b>Given.</b> White Gaussian noise of two-sided density $N_0/2$; a basis function of unit energy.<br>'
     +'<b>Find.</b> The mean and variance of the projection.<br>'
     +'<b>Method.</b> Take the expectation inside the integral; for the variance use $E[w(\\tau)w(u)]=\\frac{N_0}{2}\\delta(\\tau-u)$ and the sifting property.<br>'
     +'<b>Solution — (a).</b> $E[n]=\\int_0^{T_b}E[w(\\tau)]\\psi(\\tau)d\\tau=0$, because the noise is zero-mean at every instant.<br>'
     +'<b>Solution — (b).</b> $$E[n^{2}]=\\int_0^{T_b}\\!\\!\\int_0^{T_b}E[w(\\tau)w(u)]\\psi(\\tau)\\psi(u)\\,d\\tau\\,du=\\frac{N_0}{2}\\int_0^{T_b}\\!\\!\\int_0^{T_b}\\delta(\\tau-u)\\psi(\\tau)\\psi(u)\\,d\\tau\\,du.$$The inner integral sifts to $\\psi(\\tau)$, leaving $\\frac{N_0}{2}\\int_0^{T_b}\\psi^{2}(\\tau)d\\tau=\\frac{N_0}{2}$.<br>'
     +'<b>Check.</b> The answer does not contain $T_b$, and it should not: lengthening the interval spreads the same unit of energy over more time, so $\\psi$ falls and the two effects cancel exactly. The unit-energy normalisation is what makes that happen.',
  err:'Reporting $N_0$ rather than $N_0/2$, by taking the density as one-sided. Every error probability in this course then comes out $\\sqrt2$ too optimistic inside the $Q$, which is a $3$ dB error and is invisible in the algebra.',
  teach:'This is the one calculation in the module where the two-sided convention is used explicitly. It is worth doing in full once so that the factor is seen entering rather than assumed.' },

/* ---- full-length ----------------------------------------------------- */

{ id:'D2-13', module:'M2', type:'full', src:'MT Q3',
  stem:'In an additive white Gaussian noise channel with noise power spectral density $9$ W/Hz, two equiprobable messages are transmitted by $s_0(t)=-3$ and $s_1(t)=+3$ volts, each held for $0\\le t\\le T_b=2$ s. These pass through a matched-filter demodulator whose basis is the unit-energy rectangular pulse $\\psi(t)=1/\\sqrt{T_b}$.',
  parts:['Give the impulse response of the matched filter.',
         'Give the conditional probability density functions $f_Y(y\\mid s_0)$ and $f_Y(y\\mid s_1)$.',
         'Give the optimal decision threshold.',
         'Give the average probability of error.'],
  sol:'<b>Given.</b> $A=3$ V, $T_b=2$ s, $N_0/2=9$ so $N_0=18$ W/Hz, equal priors.<br>'
     +'<b>Find.</b> The filter, the two densities, the threshold and $P_b$.<br>'
     +'<b>Method.</b> The filter is the basis reversed; the statistic is $y=s_m+n$ with $n\\sim\\mathcal{N}(0,N_0/2)$; the threshold is midway for equal priors; the error is a Gaussian tail.<br>'
     +'<b>Solution — (a).</b> $h_{\\mathrm{opt}}(t)=\\psi(T_b-t)=1/\\sqrt2$ for $0\\le t\\le 2$ s, zero elsewhere. The basis is rectangular, so the reversal leaves it unchanged.<br>'
     +'<b>Solution — (b).</b> The energy per bit is $E_b=A^{2}T_b=9(2)=18$ J, so $s_{0,1}=\\mp\\sqrt{E_b}=\\mp4.243$. The variance is $N_0/2=9$, so $$f_Y(y\\mid s_m)=\\frac{1}{\\sqrt{18\\pi}}\\exp\\!\\left(-\\frac{(y\\mp4.243)^{2}}{18}\\right).$$<br>'
     +'<b>Solution — (c).</b> The priors are equal, so $\\lambda_{\\mathrm{opt}}=0$: midway between the two means.<br>'
     +'<b>Solution — (d).</b> $\\dfrac{2E_b}{N_0}=\\dfrac{36}{18}=2$, so $P_b=Q(\\sqrt2)=Q(1.414)=0.0786$.<br>'
     +'<b>Check.</b> One bit in thirteen is wrong, which is a very noisy channel — and it should be, since $E_b/N_0=1$ is $0$ dB. The signal separation is $2\\sqrt{E_b}=8.49$ against a noise standard deviation of $3$, under three standard deviations, and $Q(1.414)$ is exactly the tail beyond half of that separation.',
  err:'Taking the variance as $N_0=18$ because the question gave the density as $9$. The question gave $N_0/2=9$; the variance of the statistic is $N_0/2$, which is the same $9$, and reading the given number as $N_0$ doubles it.',
  teach:'Part (b) is where the marks are lost. Asking for the two densities <em>written out</em>, rather than named, forces both the mean and the variance to be stated and is where a convention error surfaces.' },

{ id:'D2-14', module:'M2', type:'full', src:'MT Q3',
  stem:'A binary system uses on-off signalling: $s_1(t)=A$ for $0\\le t\\le T_b$ when "1" is sent, and $s_0(t)=0$ when "0" is sent. The two are equally likely and the noise is white and Gaussian with two-sided density $N_0/2$.',
  parts:['Give the two points in signal space and the average energy per bit.',
         'Give the optimal threshold.',
         'Give the bit error probability in terms of $E_b/N_0$.',
         'Compare it with antipodal signalling at the same $E_b/N_0$.'],
  sol:'<b>Given.</b> On-off signalling with equal priors.<br>'
     +'<b>Find.</b> The signal points, the threshold, $P_b$, and the comparison.<br>'
     +'<b>Method.</b> Project onto the same unit-energy basis; the threshold is midway for equal priors; the tail follows from the separation and the noise.<br>'
     +'<b>Solution — (a).</b> With $\\psi(t)=1/\\sqrt{T_b}$, $s_1=A\\sqrt{T_b}$ and $s_0=0$. The energy of the "1" waveform is $A^{2}T_b$ and of the "0" waveform is zero, so the <b>average</b> energy per bit is $E_b=\\tfrac12 A^{2}T_b$, and $s_1=\\sqrt{2E_b}$.<br>'
     +'<b>Solution — (b).</b> Equal priors and equal noise on both sides put the threshold midway: $\\lambda=s_1/2=\\sqrt{E_b/2}$.<br>'
     +'<b>Solution — (c).</b> The distance from either point to the threshold is $s_1/2=\\sqrt{2E_b}/2$, and the noise standard deviation is $\\sqrt{N_0/2}$, so $$P_b=Q\\!\\left(\\frac{\\sqrt{2E_b}/2}{\\sqrt{N_0/2}}\\right)=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right).$$<br>'
     +'<b>Solution — (d).</b> Antipodal gives $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$. The argument is larger by $\\sqrt2$, so antipodal needs half the energy for the same error rate: a $3$ dB advantage.<br>'
     +'<b>Check.</b> The two signal points here are $\\sqrt{2E_b}$ apart; in the antipodal case they are $2\\sqrt{E_b}$ apart, larger by $\\sqrt2$. The error depends on the separation and on nothing else about where the points sit, so the $3$ dB is exactly that $\\sqrt2$ — which is the observation Module 4 turns into a general rule.',
  err:'Taking $E_b=A^{2}T_b$. Half the bits carry no energy at all, so the average is half that, and reporting the peak energy as $E_b$ makes on-off look as good as antipodal.',
  teach:'Part (d) is the whole point. Ask the student to say what would have to change about the two waveforms to recover the $3$ dB, and the answer — move them apart at the same average energy — is the design problem of Module 5.' },

{ id:'D2-15', module:'M2', type:'full', src:'MT Q4',
  stem:'In a binary system the decision statistic is $Y=s_m+N$ with $s_0=-4$ and $s_1=+4$. The noise has the triangular density $$f_N(n)=c\\left(1-\\frac{|n|}{10}\\right),\\qquad |n|\\le10,$$and zero elsewhere. The two symbols are equally likely and the threshold is at zero.',
  parts:['Determine $c$.',
         'Give $P(\\text{error}\\mid s_0)$.',
         'Give the average probability of error.',
         'Give the optimal threshold, with a reason.'],
  sol:'<b>Given.</b> Triangular noise on $[-10,10]$; $s_m=\\pm4$; equal priors; threshold zero.<br>'
     +'<b>Find.</b> $c$, the conditional error, the average, and the optimal threshold.<br>'
     +'<b>Method.</b> Area for $c$; integrate the density over the error region; symmetry for the rest.<br>'
     +'<b>Solution — (a).</b> The density is a triangle of base $20$ and height $c$, so $\\tfrac12(20)c=10c=1$ and $c=0.1$.<br>'
     +'<b>Solution — (b).</b> With $s_0$ sent an error needs $Y>0$, that is $N>4$: $$P(N>4)=\\int_4^{10}0.1\\left(1-\\frac{n}{10}\\right)dn=0.1\\left[n-\\frac{n^{2}}{20}\\right]_4^{10}=0.1\\bigl[(10-5)-(4-0.8)\\bigr]=0.18.$$<br>'
     +'<b>Solution — (c).</b> The density and the signal set are both symmetric, so $P(\\text{error}\\mid s_1)=0.18$ as well and $P_e=0.18$.<br>'
     +'<b>Solution — (d).</b> Zero. The optimality condition is $P(s_1)f_Y(\\lambda\\mid s_1)=P(s_0)f_Y(\\lambda\\mid s_0)$; with equal priors and a symmetric density the two weighted densities cross at the midpoint of the two means, which is zero.<br>'
     +'<b>Check.</b> The noise reaches $\\pm10$ and the signals are only $4$ from the threshold, so a large error rate is expected — and $18\\%$ is what a triangle whose top $60\\%$ of range lies beyond the signal gives. A Gaussian of the same variance, $100/6=16.7$, would give $Q(4/4.08)=Q(0.98)=0.164$, close but not equal: two densities of the same variance are not interchangeable.',
  err:'Applying $Q$ with the standard deviation of the triangular density. $Q$ is the tail of a <em>normal</em> distribution, and the two answers here differ in the second digit — enough to be wrong and close enough to look right.',
  teach:'Part (d) matters more than it looks. The formula from the antipodal Gaussian case does not apply, and a student who writes it down has not noticed that the derivation assumed a Gaussian density at every step.' },

{ id:'D2-16', module:'M2', type:'full', src:'MT Q4',
  stem:'In a binary system the received sample is $Y=-2+N$ when "0" is sent and $Y=+2+N$ when "1" is sent, where the noise $N$ is exponential with mean $4$: $$f_N(n)=\\tfrac14 e^{-n/4},\\qquad n\\ge0,$$and zero for $n<0$. The two symbols are equally likely, and the detector decides "1" when $Y>\\lambda$.',
  parts:['Give $P(\\text{error}\\mid s_1)$ and $P(\\text{error}\\mid s_0)$ as functions of $\\lambda$, for $\\lambda\\le2$.',
         'Give the value of $\\lambda$ that minimises the average error probability.',
         'Give the average error probability there.',
         'Say what is different about this answer compared with the Gaussian case.'],
  sol:'<b>Given.</b> One-sided exponential noise of mean $4$; signal points at $\\pm2$; equal priors.<br>'
     +'<b>Find.</b> The two conditional errors, the best threshold, the resulting error, and what is unusual.<br>'
     +'<b>Method.</b> The noise is non-negative, so each conditional distribution is supported on a half line. Work out where those half lines start before integrating anything.<br>'
     +'<b>Solution — (a).</b> If "1" is sent, $Y=2+N\\ge2$. For $\\lambda\\le2$ the event $Y<\\lambda$ is impossible, so $P(\\text{error}\\mid s_1)=0$. If "0" is sent, $Y=-2+N$, and an error needs $Y>\\lambda$, that is $N>\\lambda+2$: $$P(\\text{error}\\mid s_0)=\\int_{\\lambda+2}^{\\infty}\\tfrac14 e^{-n/4}dn=e^{-(\\lambda+2)/4}.$$<br>'
     +'<b>Solution — (b).</b> For $\\lambda\\le2$ the average is $\\tfrac12 e^{-(\\lambda+2)/4}$, which falls as $\\lambda$ rises. For $\\lambda>2$ the "1" errors switch on and the average rises again. The minimum is therefore at the corner, $\\lambda=2$.<br>'
     +'<b>Solution — (c).</b> $P_e=\\tfrac12 e^{-1}=0.1839$.<br>'
     +'<b>Solution — (d).</b> The optimum sits at an edge of the region rather than where a derivative vanishes, and one of the two conditional errors is exactly zero there. Neither can happen with Gaussian noise, whose density is positive everywhere, and it is the finite support of the noise that causes both.<br>'
     +'<b>Check.</b> At $\\lambda=2$ every "1" is decided correctly and only the "0" errors remain, halved by the prior. Pushing $\\lambda$ to $3$ gives $\\tfrac12\\bigl[e^{-5/4}+1-e^{-1/4}\\bigr]=\\tfrac12[0.2865+0.2212]=0.2539$, worse — which confirms the corner is a minimum and not merely a kink.',
  err:'Differentiating the average over all $\\lambda$ and solving for a stationary point. The expression is not differentiable at $\\lambda=2$ and has no stationary point at all; the minimum is found by looking at the two pieces.',
  teach:'A rare question where the calculus does not apply and the answer still exists. Worth setting for exactly that reason.' },

{ id:'D2-17', module:'M2', type:'full', src:'Final Q2',
  stem:'In a binary pulse amplitude modulation system the correlator output is $y=\\pm\\sqrt{E_b}+n$, where $n$ is Gaussian with zero mean and variance $N_0/2$. The symbol $s_1$ occurs with probability $0.25$, and $E_b=2$, $N_0=0.4$.',
  parts:['Give the optimal threshold.',
         'Give the two conditional error probabilities.',
         'Give the average probability of error, as a number.',
         'Compare it with the error probability a threshold at zero would give.'],
  sol:'<b>Given.</b> $E_b=2$, $N_0=0.4$, $P(s_1)=0.25$.<br>'
     +'<b>Find.</b> $\\lambda_{\\mathrm{opt}}$, both conditional errors, the average, and the comparison.<br>'
     +'<b>Method.</b> The log-ratio formula for the threshold, then a Gaussian tail on each side, then the weighted sum.<br>'
     +'<b>Solution — (a).</b> $\\sqrt{E_b}=1.4142$ and $$\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_0)}{P(s_1)}=\\frac{0.4}{5.657}\\ln3=0.0707(1.0986)=0.0777.$$<br>'
     +'<b>Solution — (b).</b> $\\sigma=\\sqrt{N_0/2}=0.4472$. Then $$P(\\text{err}\\mid s_0)=Q\\!\\left(\\frac{0.0777+1.4142}{0.4472}\\right)=Q(3.336)=4.250\\times10^{-4},$$ $$P(\\text{err}\\mid s_1)=Q\\!\\left(\\frac{1.4142-0.0777}{0.4472}\\right)=Q(2.989)=1.401\\times10^{-3}.$$<br>'
     +'<b>Solution — (c).</b> $P_e=0.75(4.250\\times10^{-4})+0.25(1.401\\times10^{-3})=6.691\\times10^{-4}$.<br>'
     +'<b>Solution — (d).</b> At $\\lambda=0$ both conditional errors are $Q(\\sqrt{2E_b/N_0})=Q(\\sqrt{10})=7.827\\times10^{-4}$, so the average is that same number. The optimal threshold improves it by $15\\%$.<br>'
     +'<b>Check.</b> The threshold moved towards the less likely symbol, so the error given $s_1$ went up and the error given $s_0$ went down — and the weighted total fell, which is the only test that matters. Notice that the larger conditional error is the one carrying the smaller weight; that is not a coincidence but the condition being satisfied.',
  err:'Averaging the two conditional errors without the priors, giving $9.13\\times10^{-4}$. The average error probability is a weighted average, and the whole point of moving the threshold is that the weights are unequal.',
  teach:'Part (d) is where the value of the calculation shows. Fifteen per cent for a threshold shift of five per cent of the signal separation is a real gain, and it is available for free.' },

{ id:'D2-18', module:'M2', type:'full', src:'Final Q2',
  stem:'A detector observes $Y=N$ when "0" is sent and $Y=4+N$ when "1" is sent, where $N$ is Gaussian with zero mean and variance $4$. The symbol "0" occurs with probability $0.6$.',
  parts:['Give the optimal decision threshold.',
         'Give the two conditional error probabilities.',
         'Give the average probability of error.',
         'Give the average probability of error with the threshold placed midway, and say what the difference is worth.'],
  sol:'<b>Given.</b> Two Gaussians of equal variance $\\sigma^{2}=4$ with means $0$ and $4$; $P(s_0)=0.6$.<br>'
     +'<b>Find.</b> The threshold, both errors, the average, and the comparison.<br>'
     +'<b>Method.</b> Setting the weighted densities equal for two Gaussians of equal variance gives $$\\lambda=\\frac{s_0+s_1}{2}+\\frac{\\sigma^{2}}{s_1-s_0}\\ln\\frac{P(s_0)}{P(s_1)},$$the midpoint plus a term that moves with the priors. The antipodal formula of the module is this expression with $s_{0,1}=\\mp\\sqrt{E_b}$ and $\\sigma^{2}=N_0/2$.<br>'
     +'<b>Solution — (a).</b> $\\lambda=2+\\dfrac{4}{4}\\ln\\dfrac{0.6}{0.4}=2+0.4055=2.405$.<br>'
     +'<b>Solution — (b).</b> $\\sigma=2$. $P(\\text{err}\\mid s_0)=Q(2.405/2)=Q(1.203)=0.1145$ and $P(\\text{err}\\mid s_1)=Q\\!\\left((4-2.405)/2\\right)=Q(0.797)=0.2127$.<br>'
     +'<b>Solution — (c).</b> $P_e=0.6(0.1145)+0.4(0.2127)=0.1538$.<br>'
     +'<b>Solution — (d).</b> At $\\lambda=2$ both conditional errors are $Q(1)=0.1587$, so $P_e=0.1587$. The optimal threshold is worth a $3.1\\%$ reduction.<br>'
     +'<b>Check.</b> The gain is small because the priors are close to even; at $P(s_0)=0.9$ the threshold would move to $2+\\ln9=4.20$ and the gain would be much larger. The two conditional errors at the optimum are very different from each other, $0.115$ against $0.213$, and that is what an optimal threshold looks like: it does not equalise the two errors, it equalises the weighted densities.<br>'
     +'<b>A general remark.</b> This signal set is on-off rather than antipodal, so the module\'s threshold formula does not apply directly. The general condition does, and reading it as "midpoint plus a prior term" is what makes it usable on any pair of equal-variance Gaussians.',
  err:'Choosing the threshold that equalises the two conditional error probabilities. That is a different criterion — it minimises the worst case rather than the average — and here it would put $\\lambda$ back at $2$.',
  teach:'The general formula in the Method is worth stating explicitly at some point in the course. Students who have only the antipodal special case cannot do this question at all, and the difference between the two is one line of algebra.' },

{ id:'D2-19', module:'M2', type:'full', src:'CH8 s.44–48',
  stem:'A baseband system must carry $R_b=64$ kbit/s through a channel of bandwidth $48$ kHz using raised-cosine pulse shaping.',
  parts:['Give the Nyquist bandwidth.',
         'Give the largest roll-off factor that fits in the channel.',
         'Give the transmission bandwidth actually used at that roll-off, and the excess bandwidth.',
         'Say what would go wrong at $\\alpha=0$, which also fits.'],
  sol:'<b>Given.</b> $R_b=64$ kbit/s, $48$ kHz available.<br>'
     +'<b>Find.</b> $W$, the largest $\\alpha$, the bandwidth used, and the objection to $\\alpha=0$.<br>'
     +'<b>Method.</b> $W=R_b/2$, then $(1+\\alpha)W\\le B$.<br>'
     +'<b>Solution — (a).</b> $W=32$ kHz.<br>'
     +'<b>Solution — (b).</b> $(1+\\alpha)(32)\\le48$ gives $\\alpha\\le0.5$, so $\\alpha=0.5$.<br>'
     +'<b>Solution — (c).</b> $B_T=1.5(32)=48$ kHz exactly, with an excess of $\\alpha W=16$ kHz over the Nyquist bandwidth.<br>'
     +'<b>Solution — (d).</b> At $\\alpha=0$ the system would occupy only $32$ kHz and still meet the criterion, so it fits comfortably. What goes wrong is everything else: the spectrum has vertical edges and cannot be built, and the pulse decays as $1/t$, so a small timing error lets a long tail of neighbours contribute at once and the interference does not settle. Using the whole channel buys a pulse decaying as $1/t^{3}$ and a filter that can be made.<br>'
     +'<b>Check.</b> The spectral efficiency at $\\alpha=0.5$ is $64/48=1.33$ bit/s/Hz against the theoretical $2$. The third of the capacity given up is exactly the excess bandwidth, and it is spent on being able to build the thing.',
  err:'Answering (b) with $\\alpha=1$ on the grounds that a larger roll-off is better. At $\\alpha=1$ the signal would need $64$ kHz and would not fit.',
  teach:'Part (d) is the question worth marking. A student who says only "it does not fit" has misread; a student who says "it fits and is a bad idea" has understood what the roll-off buys.' },

{ id:'D2-20', module:'M2', type:'full', src:'CH8 s.35–41',
  stem:'The overall pulse of a baseband system is normalised to $p(0)=1$ and has been measured at the neighbouring sampling instants: $p(\\pm T_b)=0.10$ and $p(\\pm2T_b)=-0.04$, with everything beyond negligible. The noise at the detector has standard deviation $\\sigma=0.15$.',
  parts:['Give the worst-case intersymbol interference at a sampling instant.',
         'Give the eye opening.',
         'Give the margin over noise, in standard deviations.',
         'Estimate the resulting error probability, and say what dominates it.'],
  sol:'<b>Given.</b> $p(0)=1$, $p(\\pm T_b)=0.10$, $p(\\pm2T_b)=-0.04$, $\\sigma=0.15$.<br>'
     +'<b>Find.</b> The worst-case interference, the opening, the margin and the error rate.<br>'
     +'<b>Method.</b> The worst case is every neighbour contributing against the wanted symbol at once, so the magnitudes add.<br>'
     +'<b>Solution — (a).</b> $$\\text{ISI}_{\\max}=\\sum_{k\\ne0}|p(kT_b)|=2(0.10)+2(0.04)=0.28.$$<br>'
     +'<b>Solution — (b).</b> The wanted symbol contributes $\\pm1$, so the worst case reaches only $1-0.28=0.72$ and the opening between the two worst cases is $2(0.72)=1.44$.<br>'
     +'<b>Solution — (c).</b> The half-opening is $0.72$, which is $0.72/0.15=4.8$ standard deviations.<br>'
     +'<b>Solution — (d).</b> $P_b\\approx Q(4.8)=7.9\\times10^{-7}$, and the interference dominates: without it the margin would be $1/0.15=6.67$ standard deviations and the error rate $Q(6.67)=1.3\\times10^{-11}$, four orders of magnitude better.<br>'
     +'<b>Check.</b> The estimate is a worst case and therefore pessimistic — the pattern that puts every neighbour against the wanted symbol occurs one time in sixteen here, and the average error rate is better than $7.9\\times10^{-7}$. It is the right number to design with, because the bad pattern will occur.',
  err:'Adding the interference terms with their signs, $2(0.10)+2(-0.04)=0.12$, and reporting a much better answer. The neighbouring symbols carry data and can take either sign, so the worst case adds the <em>magnitudes</em>.',
  teach:'Part (d) is the one that connects the two halves of the module. Interference costing four orders of magnitude while the noise is unchanged is the statement that more transmit power would not have helped.' }

]);

window.DRILL_M2 = [

{ id:'m2-drill', module:'M2', nav:'Module 2 · practice questions',
  title:'Module 2 — practice questions',
  objective:'Twenty open-ended questions with worked solutions, in the form they are asked in.',
  keywords:'practice questions module 2 matched filter correlator threshold priors error probability nyquist raised cosine eye',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 2 · Practice D2-01 … D2-20'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question on paper before opening its solution. Every solution ends with a <b>Check</b> step. In this module the cheap checks are: the matched-filter output at the sampling instant is an energy and has the units of one, the variance of the decision statistic is $N_0/2$ and never $N_0$, an optimal threshold lies between the two signal points and moves away from the more likely one, and an error probability must fall when the energy per bit rises.'},
  {t:'rule', short:true},
  {t:'drill', module:'M2'}
]}

];
})();
