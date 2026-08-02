/* ==========================================================================
   Practice questions — Module 1.

   The module opens with a taxonomy of the question shapes that keep coming
   back and closes with twenty open-ended questions in those shapes. Every
   worked solution is hidden until the reader asks for it, so a first pass
   shows the target and not the answer.

   Every question keeps the shape of the type it belongs to and none of its
   numbers. A replacement number is chosen so that the character of the answer
   survives: a quantizer that was coarse stays coarse, a signal that filled its
   range still fills it, and a question that exists to show a model failing
   still shows it failing.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;
const sinc = x => Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);

/* ======================================================================
   The taxonomy. Three of the six shapes are read off the question tables;
   the other three come from the worked examples in the lecture material,
   and the last names the full-length form.
   ====================================================================== */
CONTENT.DRILLTYPES.M1 = [
  { k:'rate', name:'Sampling rate, resolution and bit rate',
    asks:'A message is given by its bandwidth or its formula. Find the rate it must be sampled at, how many bits a sample needs, and the bit rate or symbol rate that follows.',
    method:['Find the highest frequency present. For a product of sinusoids, expand it first — the highest frequency of a product is not the highest frequency of either factor.',
            'The Nyquist rate is twice that. A guard band adds to it: $f_s=2W+f_g$. A rate stated as a percentage above Nyquist multiplies it.',
            'Resolution is $R=\\log_2 L$, rounded <em>up</em> when it comes from an accuracy requirement. The bit rate is $R_b=Rf_s$, and a symbol rate divides that by the bits each symbol carries.'],
    go:'m1-encode' },

  { k:'sqnr-density', name:'A source density, a quantizer, and the SQNR',
    asks:'A density is given with an unknown constant, together with a quantizer. Find the constant, the signal power, the noise power and the SQNR.',
    method:['Find the constant from $\\int f_X(x)\\,dx=1$ before anything else. Every later part depends on it.',
            'The signal power is $E[X^{2}]=\\int x^{2}f_X(x)\\,dx$, a property of the source, not the variance of the quantized values.',
            'The noise power is $E[(X-\\mathbb{Q}(X))^{2}]$, integrated region by region against the same density. Use $\\Delta^{2}/12$ only when the quantizer is uniform and fine; a coarse quantizer gives a few decibels, not tens.'],
    go:'m1-ex-gauss' },

  { k:'sqnr-wave', name:'A waveform through a uniform quantizer',
    asks:'A periodic waveform is sampled at the Nyquist rate and uniformly quantized. Find the bit rate, the step size and the SQNR in decibels.',
    method:['Average power from Parseval: for a sum of sinusoids it is the sum of half the squared amplitudes.',
            'The peak $m_{\\max}$ is the largest value the waveform actually reaches; for a sum that is the sum of the amplitudes only when the terms peak together. Then $\\Delta=2m_{\\max}/L$, or $m_{\\max}/L$ if the signal never goes negative.',
            '$\\mathrm{SQNR}\\;[\\mathrm{dB}]=10\\log_{10}(3P_M/m_{\\max}^{2})+6.02R$. The first term is negative whenever the signal does not fill the range.'],
    go:'m1-sqnr' },

  { k:'recon', name:'Reconstruction, aliasing and the anti-aliasing filter',
    asks:'A rate is given that may or may not be adequate. Decide whether the message survives, and where an aliased component lands.',
    method:['Draw the replicas at multiples of $f_s$ and look at whether they overlap. Everything else follows from the picture.',
            'A component at $f_0$ produces replicas at $f_0-nf_s$. The one that lands inside the band is what the reader hears, and it is at $|f_0-nf_s|$ for the $n$ that brings it closest to zero.',
            'An anti-aliasing filter removes what lies above $f_s/2$ before the sampler: it prevents the damage rather than recovering anything. The reconstruction filter has gain $1/(2W)$, not unity.'],
    go:'m1-cases' },

  { k:'pcm', name:'From a waveform to a bit stream',
    asks:'A signal, a sampling interval and a quantizer are given. Produce the samples, the levels, the code words and the bit rate.',
    method:['Evaluate the signal at each sampling instant. Do not read the values off a sketch.',
            'Find which tread each sample falls in: the index is $\\lfloor (m-m_{\\min})/\\Delta\\rfloor$, capped at $L-1$.',
            'Write the index as an $R$-bit word, in natural binary unless Gray coding is asked for. The bit rate is $Rf_s$ and one bit lasts $T_b=T_s/R$.'],
    go:'m1-ex-pcm' },

  { k:'full', name:'A full-length question combining several of the shapes above',
    asks:'One statement and three or four lettered parts, each usually resting on the part before it.',
    method:['Read every part before starting. A later part almost always uses a number an earlier part produced, so an error early on travels the whole way.',
            'Name the shape of each part before working it, and use the method for that shape unchanged.',
            'Carry exact values between parts, and check each against the one before: a bit rate must be the resolution times the sampling rate, and an SQNR must move by $6.02$ dB when a bit is added and by nothing else.'] }
];

/* ======================================================================
   The questions.
   ====================================================================== */
CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- single-skill, two or three parts ------------------------------- */

{ id:'D1-01', module:'M1', type:'rate', src:'MT Q1',
  stem:'A message signal is bandlimited to $W=12$ kHz.',
  parts:['Give the Nyquist rate.',
         'The sampler is run $25\\%$ above the Nyquist rate. Give the rate and the sampling interval.',
         'Express the extra margin in part (b) as a guard band $f_g$.'],
  sol:'<b>Given.</b> A lowpass message with $W=12$ kHz.<br>'
     +'<b>Find.</b> The Nyquist rate, a rate $25\\%$ above it, and the guard band that margin represents.<br>'
     +'<b>Method.</b> The Nyquist rate is twice the highest frequency. A percentage above it multiplies; a guard band adds.<br>'
     +'<b>Solution — (a).</b> $f_s^{\\min}=2W=24$ kHz.<br>'
     +'<b>Solution — (b).</b> $f_s=1.25\\times 24=30$ kHz, so $T_s=1/30000=33.3\\ \\mu$s.<br>'
     +'<b>Solution — (c).</b> $f_s=2W+f_g$ gives $f_g=30-24=6$ kHz.<br>'
     +'<b>Check.</b> The replicas sit at multiples of $30$ kHz and each is $24$ kHz wide, so the gap between the edge of one and the edge of the next is $30-24=6$ kHz — the guard band, read off the picture rather than off the formula.',
  err:'Reading "$25\\%$ above Nyquist" as $2W+0.25W=30$ kHz by accident of arithmetic. The two agree here only because $0.25\\times 2W=0.5W$ happens to equal $6$ kHz; with $W=10$ kHz they would not.',
  teach:'Ask for the guard band before the percentage. A student who can only do one of the two has learnt a formula rather than the picture.' },

{ id:'D1-02', module:'M1', type:'rate', src:'MT Q1',
  stem:'An audio source is sampled at $f_s=44$ kHz and each sample is quantized by a uniform quantizer with $L=512$ levels.',
  parts:['Give the number of bits per sample.',
         'Give the bit rate of the resulting PCM stream.',
         'How long does one bit last?'],
  sol:'<b>Given.</b> $f_s=44$ kHz, $L=512$.<br>'
     +'<b>Find.</b> $R$, $R_b$ and $T_b$.<br>'
     +'<b>Method.</b> $R=\\log_2 L$, $R_b=Rf_s$, $T_b=1/R_b$.<br>'
     +'<b>Solution.</b> $R=\\log_2 512=9$ bits per sample. $R_b=9\\times 44000=396$ kbit/s. One bit lasts $T_b=1/396000=2.53\\ \\mu$s.<br>'
     +'<b>Check.</b> The units carry the argument: $\\left(\\frac{\\text{bits}}{\\text{sample}}\\right)\\left(\\frac{\\text{samples}}{\\text{s}}\\right)=\\frac{\\text{bits}}{\\text{s}}$. And $T_b=T_s/R=(1/44000)/9=2.53\\ \\mu$s, which is the same number reached from the sampling interval instead.',
  err:'Reporting $R=512$ bits per sample. The level count and the resolution are different quantities and differ by a logarithm.',
  teach:'Worth asking what happens to $R_b$ if the level count is doubled: it rises by $f_s$ bits per second, one extra bit per sample, and buys $6.02$ dB.' },

{ id:'D1-03', module:'M1', type:'rate', src:'MT Q1',
  stem:'A signal $x(t)$ is bandlimited to $15$ kHz. It is used to modulate a carrier: $$y(t)=x(t)\\cos\\!\\left(2\\pi(60000)t\\right).$$',
  parts:['Sketch, in words, where the spectrum of $y$ sits.',
         'Give the Nyquist rate of $y(t)$.'],
  sol:'<b>Given.</b> $x$ bandlimited to $15$ kHz, carrier at $60$ kHz.<br>'
     +'<b>Find.</b> The Nyquist rate of the product.<br>'
     +'<b>Method.</b> Multiplication by a cosine shifts the spectrum to $\\pm f_c$ and halves it. The rate follows from the highest frequency of the <em>result</em>.<br>'
     +'<b>Solution — (a).</b> $Y(f)=\\tfrac12 X(f-60\\text{k})+\\tfrac12 X(f+60\\text{k})$: two copies of $X$, centred at $\\pm 60$ kHz, each $30$ kHz wide, so $Y$ is non-zero for $45<|f|<75$ kHz.<br>'
     +'<b>Solution — (b).</b> The highest frequency present is $f_c+W=75$ kHz, so $f_s^{\\min}=2(75)=150$ kHz.<br>'
     +'<b>Check.</b> Doubling the carrier to $120$ kHz would double the answer to $270$ kHz while leaving the width of $Y$ unchanged at $30$ kHz. The rate follows the highest frequency, not the width — which is the whole content of this question.',
  err:'Answering $30$ kHz, the Nyquist rate of $x$. Modulation moved the message and the sampler has to keep up with where it went.',
  teach:'This is the standard trap in the sampling question. A student who answers $30$ kHz has applied the rule to the wrong signal, which is a different mistake from not knowing the rule.' },

{ id:'D1-04', module:'M1', type:'recon', src:'CH7 s.9–11',
  stem:'A message bandlimited to $W=15$ kHz is sampled at exactly the Nyquist rate and reconstructed with an ideal lowpass filter.',
  parts:['Give the passband gain and cut-off of the reconstruction filter.',
         'Give its impulse response.',
         'Show that the reconstructed signal equals the message at every sampling instant.'],
  sol:'<b>Given.</b> $W=15$ kHz, $f_s=2W=30$ kHz.<br>'
     +'<b>Find.</b> The filter, its impulse response, and the value of the reconstruction at $t=kT_s$.<br>'
     +'<b>Method.</b> Sampling multiplied the spectrum by $f_s$; the filter divides it back and keeps only the copy at the origin.<br>'
     +'<b>Solution — (a).</b> $H_{\\mathrm{LPF}}(f)=\\dfrac{1}{2W}=\\dfrac{1}{30000}=3.33\\times10^{-5}$ for $|f|\\le 15$ kHz, and zero outside.<br>'
     +'<b>Solution — (b).</b> $h_{\\mathrm{LPF}}(t)=\\operatorname{sinc}(2Wt)=\\operatorname{sinc}(30000\\,t)$, with $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$.<br>'
     +'<b>Solution — (c).</b> $g_r(t)=\\sum_n g(nT_s)\\operatorname{sinc}(2Wt-n)$. At $t=kT_s=k/(2W)$ the argument of the $n$th term is $k-n$, and $\\operatorname{sinc}$ is zero at every non-zero integer and one at zero. Every term vanishes except $n=k$, leaving $g_r(kT_s)=g(kT_s)$.<br>'
     +'<b>Check.</b> The interpolation is not merely correct at the samples: since $f_s=2W$ exactly, the filter passes the whole message and nothing else, so $g_r$ and $g$ agree everywhere and not only at the instants.',
  err:'Giving the filter unit gain. The reconstruction is then $2W=30000$ times too large, and nothing in a plot of the spectrum shape reveals it.',
  teach:'Part (c) is the one worth insisting on. It is the only place in the module where the zeros of $\\operatorname{sinc}$ do the work, and the same fact returns in the PCM example.' },

{ id:'D1-05', module:'M1', type:'recon', src:'CH7 s.7–8',
  stem:'A pure tone at $7$ kHz is sampled at $f_s=10$ kHz with no anti-aliasing filter, and the samples are passed through an ideal lowpass filter of cut-off $5$ kHz.',
  parts:['Give the frequencies of the replicas the sampler produces below $10$ kHz.',
         'Give the frequency of the tone that comes out of the filter.',
         'What anti-aliasing filter would have prevented this, and what would have been lost?'],
  sol:'<b>Given.</b> $f_0=7$ kHz, $f_s=10$ kHz.<br>'
     +'<b>Find.</b> Where the tone lands after sampling and filtering.<br>'
     +'<b>Method.</b> Sampling puts a copy of every component at $f_0-nf_s$ for every integer $n$. The filter keeps whichever copies fall below its cut-off.<br>'
     +'<b>Solution — (a).</b> The replicas of the $7$ kHz component sit at $7-10=-3$ kHz and $7+0=7$ kHz among others; as a real signal the negative one appears at $3$ kHz.<br>'
     +'<b>Solution — (b).</b> The filter passes $|f|<5$ kHz, so it keeps the copy at $3$ kHz and rejects the one at $7$ kHz. A $7$ kHz tone went in and a $3$ kHz tone comes out.<br>'
     +'<b>Solution — (c).</b> A lowpass filter of cut-off $5$ kHz applied <em>before</em> the sampler would have removed the tone entirely. Nothing false would then appear, but the tone itself is lost. That is the trade the anti-aliasing filter makes: it converts a wrong answer into a missing one.<br>'
     +'<b>Check.</b> $|7-10|=3$, and $3<f_s/2=5$, so the alias does fall in band. A tone at exactly $5$ kHz would land on the band edge and a tone below $5$ kHz has its nearest replica at $10-f_0>5$ kHz and is therefore safe — which is the sampling theorem stated one component at a time.',
  err:'Answering $7$ kHz on the grounds that the tone "is still there". It is, at $7$ kHz, but the filter rejects that copy and keeps the one the sampler manufactured at $3$ kHz.',
  teach:'Have the student name what a listener would hear. Aliasing is not an abstraction here: the pitch is audibly wrong and no later processing can put it right.' },

{ id:'D1-06', module:'M1', type:'sqnr-wave', src:'Final Q1',
  stem:'The signal $m(t)=3\\cos t$ is quantized by a uniform quantizer that spans its full range, with $R=6$ bits per sample.',
  parts:['Give the number of levels and the step size.',
         'Give the SQNR in decibels.'],
  sol:'<b>Given.</b> $m(t)=3\\cos t$, $R=6$.<br>'
     +'<b>Find.</b> $L$, $\\Delta$ and the SQNR.<br>'
     +'<b>Method.</b> $L=2^R$, $\\Delta=2m_{\\max}/L$, and $\\mathrm{SQNR}=\\alpha+6.02R$ with $\\alpha=10\\log_{10}(3P_M/m_{\\max}^{2})$.<br>'
     +'<b>Solution — (a).</b> $L=2^{6}=64$ and $m_{\\max}=3$, so $\\Delta=\\dfrac{2(3)}{64}=0.09375$.<br>'
     +'<b>Solution — (b).</b> $P_M=3^{2}/2=4.5$, so $\\alpha=10\\log_{10}\\dfrac{3(4.5)}{9}=10\\log_{10}1.5=1.76$ dB and $\\mathrm{SQNR}=1.76+6.02(6)=37.88$ dB.<br>'
     +'<b>Check.</b> By the other route, $E[Q^{2}]=\\Delta^{2}/12=0.09375^{2}/12=7.324\\times10^{-4}$ and $10\\log_{10}(4.5/7.324\\times10^{-4})=37.88$ dB. Note also that $\\alpha$ came out at $1.76$ dB, the value for <em>any</em> full-scale sinusoid: the amplitude cancels, which is why the answer does not depend on the $3$.',
  err:'Using $\\Delta=m_{\\max}/L$ and halving the step. The range covered is $2m_{\\max}$, from $-3$ to $+3$.',
  teach:'The observation in the check is worth drawing out: $\\alpha=1.76$ dB for every full-scale sinusoid, so the amplitude in this question is decoration and the answer is $6.02R+1.76$.' },

{ id:'D1-07', module:'M1', type:'sqnr-wave', src:'Final Q1',
  stem:'A full-scale sinusoid is to be quantized so that the SQNR is at least $40$ dB.',
  parts:['Give the smallest number of bits per sample that achieves it.',
         'Give the SQNR actually obtained.',
         'By how many decibels would the requirement be missed with one bit fewer?'],
  sol:'<b>Given.</b> A sinusoid filling the quantizer range; a requirement of $40$ dB.<br>'
     +'<b>Find.</b> The smallest integer $R$.<br>'
     +'<b>Method.</b> $\\mathrm{SQNR}=1.76+6.02R$ for a full-scale sinusoid. Solve for $R$ and round <em>up</em>: resolution is an integer.<br>'
     +'<b>Solution — (a).</b> $1.76+6.02R\\ge 40$ gives $R\\ge (40-1.76)/6.02=6.35$, so $R=7$ bits.<br>'
     +'<b>Solution — (b).</b> $\\mathrm{SQNR}=1.76+6.02(7)=43.90$ dB.<br>'
     +'<b>Solution — (c).</b> At $R=6$, $\\mathrm{SQNR}=1.76+36.12=37.88$ dB, which misses the requirement by $2.12$ dB.<br>'
     +'<b>Check.</b> The two answers in (b) and (c) differ by $6.02$ dB, one bit, as they must. And $43.90-2.12=41.78\\neq40$: the requirement sits between two achievable values, which is why rounding up is not optional.',
  err:'Rounding $6.35$ down to $6$ because it is closer. Resolution cannot be fractional, and $6$ bits fails the requirement.',
  teach:'Ask what happens to the answer if the signal uses half the range. $\\alpha$ falls by $6.02$ dB, so exactly one more bit is needed — which is the cleanest statement of what amplitude costs.' },

{ id:'D1-08', module:'M1', type:'sqnr-density', src:'MT Q2',
  stem:'The samples of a source are uniformly distributed on $[-2,2]$ and are quantized by a uniform quantizer with $L=64$ levels covering that range.',
  parts:['Give the signal power and the step size.',
         'Give the quantization noise power.',
         'Give the SQNR in decibels.'],
  sol:'<b>Given.</b> $M\\sim U(-2,2)$, $L=64$.<br>'
     +'<b>Find.</b> $P_M$, $\\Delta$, $E[Q^{2}]$ and the SQNR.<br>'
     +'<b>Method.</b> Power from the density, step from the range and the level count, noise from $\\Delta^{2}/12$ — which is exact here because a uniform source over the full range makes the error genuinely uniform.<br>'
     +'<b>Solution — (a).</b> $P_M=\\displaystyle\\int_{-2}^{2}m^{2}\\tfrac14\\,dm=\\tfrac{4}{3}=1.333$. With $m_{\\max}=2$, $\\Delta=\\dfrac{2(2)}{64}=0.0625$.<br>'
     +'<b>Solution — (b).</b> $E[Q^{2}]=\\Delta^{2}/12=3.255\\times10^{-4}$.<br>'
     +'<b>Solution — (c).</b> $\\mathrm{SQNR}=1.333/3.255\\times10^{-4}=4096$, which is $10\\log_{10}4096=36.12$ dB.<br>'
     +'<b>Check.</b> $R=\\log_2 64=6$ and $\\alpha=10\\log_{10}\\dfrac{3(4/3)}{4}=10\\log_{10}1=0$ dB exactly, so $\\mathrm{SQNR}=6.02(6)=36.12$ dB. The intercept vanishing is not a coincidence: a uniform source spanning the range is the one case where the uniform quantizer is also the optimal one, and $4096=2^{12}=2^{2R}$.',
  err:'Taking $P_M$ to be the variance of the <em>quantized</em> values. The signal power is a property of the source, and the quantizer has not been applied yet when it is computed.',
  teach:'Contrast with the sinusoid: same level count, $\\alpha=0$ here and $+1.76$ dB there, so the sinusoid does better. A sinusoid concentrates its amplitude near the peaks, which for a fixed peak means more power.' },

{ id:'D1-09', module:'M1', type:'sqnr-density', src:'MT Q2',
  stem:'The samples of a stationary source have the triangular density $$f_X(x)=c\\left(1-\\frac{|x|}{3}\\right),\\qquad |x|\\le 3,$$and zero elsewhere.',
  parts:['Determine $c$.',
         'Give the power of the samples.'],
  sol:'<b>Given.</b> A symmetric triangular density on $[-3,3]$ with unknown peak $c$.<br>'
     +'<b>Find.</b> $c$ and $E[X^{2}]$.<br>'
     +'<b>Method.</b> The constant comes from the total area being one. The power is the second moment against the same density.<br>'
     +'<b>Solution — (a).</b> The density is a triangle of base $6$ and height $c$, so its area is $\\tfrac12(6)c=3c$. Setting $3c=1$ gives $c=\\tfrac13$.<br>'
     +'<b>Solution — (b).</b> $$E[X^{2}]=2\\int_{0}^{3}x^{2}\\cdot\\tfrac13\\left(1-\\tfrac{x}{3}\\right)dx=\\tfrac23\\int_{0}^{3}\\left(x^{2}-\\tfrac{x^{3}}{3}\\right)dx=\\tfrac23\\left(9-\\tfrac{27}{4}\\right)=1.5.$$<br>'
     +'<b>Check.</b> A symmetric triangular distribution on $[-a,a]$ has variance $a^{2}/6$, and $9/6=1.5$. The mean is zero by symmetry, so the variance and the power are the same number. Sanity: a <em>uniform</em> source on the same interval would have power $a^{2}/3=3$, twice as much, which is right — the triangular density concentrates its mass near zero.',
  err:'Setting $c=1$ because the peak of a triangle "should be one". The peak of a density is not one; the area is.',
  teach:'The comparison in the check is the useful part. Two sources on the same interval can differ in power by a factor of two, and the SQNR follows that factor directly.' },

{ id:'D1-10', module:'M1', type:'pcm', src:'CH7 s.36',
  stem:'A non-negative signal is known to lie in $[0,6]$ volts. It is quantized by an eight-level uniform quantizer covering that range, with the level of each tread at its midpoint, and encoded in natural binary.',
  parts:['Give the step size and list the eight levels.',
         'Give the level and the code word for the samples $0.9$, $2.4$, $4.7$ and $5.9$ volts.'],
  sol:'<b>Given.</b> Range $[0,6]$, $L=8$.<br>'
     +'<b>Find.</b> $\\Delta$, the levels, and four code words.<br>'
     +'<b>Method.</b> $\\Delta$ is the range divided by the level count; the index of a sample is $\\lfloor m/\\Delta\\rfloor$, capped at $L-1$.<br>'
     +'<b>Solution — (a).</b> $\\Delta=(6-0)/8=0.75$ V, and the levels sit at $0.375,\\,1.125,\\,1.875,\\,2.625,\\,3.375,\\,4.125,\\,4.875,\\,5.625$.<br>'
     +'<b>Solution — (b).</b> $0.9/0.75=1.2$, so index $1$, level $1.125$, word $001$. $2.4/0.75=3.2$, index $3$, level $2.625$, word $011$. $4.7/0.75=6.27$, index $6$, level $4.875$, word $110$. $5.9/0.75=7.87$, index $7$, level $5.625$, word $111$.<br>'
     +'<b>Check.</b> Every error is under half a step: $|0.9-1.125|=0.225$, $|2.4-2.625|=0.225$, $|4.7-4.875|=0.175$ and $|5.9-5.625|=0.275$, all below $\\Delta/2=0.375$. A value above the bound would mean a wrong tread rather than a rounding.',
  err:'Placing the levels at the tread boundaries — $0,\\,0.75,\\,1.5,\\ldots$ — instead of their midpoints. The error then reaches a full step rather than half of one, and the noise power is four times too large.',
  teach:'The check is the method: the half-step bound is what tells a student that an index is wrong without their having to redo the division.' },

{ id:'D1-11', module:'M1', type:'pcm', src:'CH7 s.34',
  stem:'Sixteen quantization levels are to be encoded in four bits, either in natural binary or in a Gray code.',
  parts:['Give the natural binary and Gray words for levels $7$ and $8$.',
         'Count how many bits change between those two adjacent levels under each code.',
         'Say what this costs when a channel error moves a decision to a neighbouring level.'],
  sol:'<b>Given.</b> $L=16$, $R=4$.<br>'
     +'<b>Find.</b> The two encodings of levels $7$ and $8$, and the cost of the difference.<br>'
     +'<b>Method.</b> Natural binary writes the index directly. The Gray word is $g=b\\oplus(b\\gg1)$, the index exclusive-ored with itself shifted right by one.<br>'
     +'<b>Solution — (a).</b> Level $7$: natural $0111$; Gray $0111\\oplus 0011=0100$. Level $8$: natural $1000$; Gray $1000\\oplus 0100=1100$.<br>'
     +'<b>Solution — (b).</b> Natural: $0111\\to1000$ changes all four bits. Gray: $0100\\to1100$ changes one.<br>'
     +'<b>Solution — (c).</b> A channel error almost always moves the decision to a neighbouring level, because the neighbouring level is the closest wrong answer. Under natural binary that single symbol error costs up to four bit errors; under Gray coding it costs exactly one. The reconstructed amplitude is wrong by one step either way — what changes is how many bits are reported wrong.<br>'
     +'<b>Check.</b> The Gray code has the one-bit property between <em>every</em> adjacent pair, not only this one: levels $3$ and $4$ give $0010$ and $0110$, one bit apart, where natural binary gives $0011$ and $0100$, three bits apart.',
  err:'Concluding that Gray coding reduces the probability of a symbol error. It does not touch the detector; it changes only how many bit errors a symbol error produces.',
  teach:'Levels $7$ and $8$ are chosen because they straddle the worst case in natural binary. Ask for another adjacent pair to check that the Gray property is general rather than lucky.' },

{ id:'D1-12', module:'M1', type:'sqnr-wave', src:'CH7 s.22',
  stem:'A quantizer is designed for a peak amplitude $m_{\\max}$, but the sinusoid actually presented to it reaches only a quarter of that.',
  parts:['Give $\\alpha$ in the two cases and the loss in decibels.',
         'How many extra bits per sample would recover the loss?'],
  sol:'<b>Given.</b> A uniform quantizer sized for $m_{\\max}$; a sinusoid of peak $0.25\\,m_{\\max}$.<br>'
     +'<b>Find.</b> The change in $\\alpha$ and its cost in bits.<br>'
     +'<b>Method.</b> $\\alpha=10\\log_{10}(3P_M/m_{\\max}^{2})$ with $m_{\\max}$ the quantizer\'s range, not the signal\'s peak. Only $P_M$ changes.<br>'
     +'<b>Solution — (a).</b> Full scale: $P_M=m_{\\max}^{2}/2$, so $\\alpha=10\\log_{10}1.5=1.76$ dB. At a quarter scale: $P_M=(0.25m_{\\max})^{2}/2=0.03125\\,m_{\\max}^{2}$, so $\\alpha=10\\log_{10}0.09375=-10.28$ dB. The loss is $12.04$ dB.<br>'
     +'<b>Solution — (b).</b> Each bit buys $6.02$ dB, so $12.04/6.02=2$ bits exactly.<br>'
     +'<b>Check.</b> The amplitude fell by a factor of four, the power by sixteen, and $10\\log_{10}16=12.04$ dB. Equivalently $20\\log_{10}4=12.04$ dB: every halving of the amplitude costs $6.02$ dB, one bit, which is the same exchange rate as the resolution — and the reason is the same, that halving the amplitude and halving the step size are the same thing seen from either end.<br>'
     +'<b>Why this matters.</b> A quantizer sized for the loudest passage of a piece of music gives the quiet passages far fewer effective levels. That is the argument for companding, and this calculation is how large the argument is.',
  err:'Recomputing $\\Delta$ from the signal\'s own peak. The quantizer was built for $m_{\\max}$ and does not change because the signal got quieter; that is precisely why the ratio degrades.',
  teach:'This question is the bridge to non-uniform quantization. It is worth setting immediately before that section rather than after it.' },

/* ---- full-length, three or four lettered parts ---------------------- */

{ id:'D1-13', module:'M1', type:'full', src:'MT Q1',
  stem:'A sinusoidal message is $x(t)=V_{\\max}\\cos(6000\\pi t)$, where $V_{\\max}$ is its peak amplitude. It is quantized by a uniform quantizer whose quantization noise is uniform on $\\left(-\\tfrac{\\Delta}{2},\\tfrac{\\Delta}{2}\\right)$, and the noise is required not to exceed $\\pm 2\\%$ of the peak-to-peak amplitude of the message. The quantized data are encoded with a $32$-level PAM system, and the message is sampled at the Nyquist rate.',
  parts:['Determine the minimum number of bits per sample.',
         'Calculate the bit rate of the system.',
         'Calculate the symbol rate of the system.'],
  sol:'<b>Given.</b> $f_0=3000$ Hz, noise bound $2\\%$ of peak-to-peak, $32$-level PAM.<br>'
     +'<b>Find.</b> $R$, $R_b$ and the symbol rate.<br>'
     +'<b>Method.</b> The accuracy requirement fixes the largest permissible $\\Delta$, which fixes the smallest permissible $L$, which fixes $R$ after rounding up. The rate then follows from $R_b=Rf_s$, and the symbol rate from how many bits a PAM symbol carries.<br>'
     +'<b>Solution — (a).</b> The peak-to-peak amplitude is $2V_{\\max}$, so the requirement is $$\\frac{\\Delta}{2}\\le 0.02\\,(2V_{\\max})=0.04V_{\\max}\\;\\Longrightarrow\\;\\Delta\\le 0.08V_{\\max}.$$With $\\Delta=2V_{\\max}/L$ this gives $L\\ge 2/0.08=25$. Since $L=2^{R}$ must be a power of two, $L=32$ and $R=5$ bits per sample.<br>'
     +'<b>Solution — (b).</b> The message reaches $3000$ Hz, so $f_s=2(3000)=6000$ samples per second and $$R_b=Rf_s=5\\times 6000=30\\ \\text{kbit/s}.$$<br>'
     +'<b>Solution — (c).</b> A $32$-level PAM symbol carries $\\log_2 32=5$ bits, so the symbol rate is $30000/5=6000$ symbols per second.<br>'
     +'<b>Check.</b> The symbol rate came out equal to the sampling rate, which is the arithmetic saying that one sample becomes exactly one PAM symbol here — $5$ bits per sample and $5$ bits per symbol. Had the requirement forced $R=6$, the symbol rate would have risen to $7200$ while the sampling rate stayed at $6000$, and one sample would no longer fit in one symbol.',
  err:'Reading the noise bound against $V_{\\max}$ rather than against the peak-to-peak $2V_{\\max}$. That halves the permissible step, doubles the required level count and gives $R=6$.',
  teach:'Part (c) rewards reading the question: the PAM level count is given and is not the same quantity as the quantizer level count, even though here they coincide.' },

{ id:'D1-14', module:'M1', type:'full', src:'MT Q1',
  stem:'The signal $$x(t)=6\\cos(2000\\pi t)\\cos(6000\\pi t)$$is sampled and quantized with a $512$-level uniform quantizer. Assume $1$ kbit/s $=1000$ bit/s.',
  parts:['Determine the minimum sampling rate if a guard band of $2$ kHz is required.',
         'Calculate the bit rate of the system at that sampling rate.',
         'If the bit rate is required to be $100$ kbit/s, what should the guard band be?',
         'Calculate the step size of the uniform quantizer.'],
  sol:'<b>Given.</b> A product of two cosines, $L=512$.<br>'
     +'<b>Find.</b> $f_s$ with a guard band, the bit rate, the guard band for a given bit rate, and $\\Delta$.<br>'
     +'<b>Method.</b> Expand the product before doing anything else: the bandwidth of a product is not the bandwidth of either factor.<br>'
     +'<b>Solution — (a).</b> Using $2\\cos A\\cos B=\\cos(A-B)+\\cos(A+B)$, $$x(t)=3\\cos(2\\pi(2000)t)+3\\cos(2\\pi(4000)t).$$The highest frequency is $4$ kHz, so $W=4$ kHz and $$f_s=2W+f_g=8+2=10\\ \\text{kHz}.$$<br>'
     +'<b>Solution — (b).</b> $R=\\log_2 512=9$ bits per sample, so $R_b=9\\times 10000=90$ kbit/s.<br>'
     +'<b>Solution — (c).</b> $f_s=R_b/R=100000/9=11.11$ kHz, so $f_g=f_s-2W=11.11-8=3.11$ kHz.<br>'
     +'<b>Solution — (d).</b> The two terms peak together at $t=0$, where $x(0)=3+3=6$, so $m_{\\max}=6$ and $$\\Delta=\\frac{2(6)}{512}=0.0234\\ \\text{V}.$$<br>'
     +'<b>Check.</b> Part (c) must give a larger guard band than part (a), because a higher bit rate at fixed resolution means a higher sampling rate and therefore more room between the replicas; $3.11>2$ kHz, as it should be. And $m_{\\max}=6$ agrees with the original form: $6\\cos\\cdot\\cos$ cannot exceed $6$, and it reaches it when both factors are one.',
  err:'Taking $W=3$ kHz from the $6000\\pi$ term without expanding. The product contains a $4$ kHz component that neither factor has.',
  teach:'Part (d) is worth asking about separately: the peak of a sum of two sinusoids is the sum of their amplitudes only when they peak together, which here they do and in the next question they also do — but it is a fact to be checked, not assumed.' },

{ id:'D1-15', module:'M1', type:'full', src:'MT Q1',
  stem:'A signal $X(t)$ has a bandwidth of $2.5$ MHz. It is sampled, quantized and binary encoded to obtain a PCM signal.',
  parts:['Determine the sampling rate if $X(t)$ is sampled at a rate $40\\%$ greater than the Nyquist rate.',
         'If the samples are quantized with a uniform quantizer with $4096$ levels, determine the number of bits required per sample.',
         'Calculate the bit rate of this system in bits per second.',
         'How much of the bit rate is the margin above Nyquist responsible for?'],
  sol:'<b>Given.</b> $W=2.5$ MHz, a rate $40\\%$ above Nyquist, $L=4096$.<br>'
     +'<b>Find.</b> $f_s$, $R$, $R_b$ and the cost of the margin.<br>'
     +'<b>Method.</b> A percentage above Nyquist multiplies the Nyquist rate. Resolution is a logarithm of the level count. The bit rate is their product.<br>'
     +'<b>Solution — (a).</b> The Nyquist rate is $2W=5$ MHz, so $$f_s=1.40\\times 5=7\\ \\text{MHz}.$$<br>'
     +'<b>Solution — (b).</b> $R=\\log_2 4096=12$ bits per sample.<br>'
     +'<b>Solution — (c).</b> $R_b=Rf_s=12\\times 7\\times10^{6}=84$ Mbit/s.<br>'
     +'<b>Solution — (d).</b> At exactly the Nyquist rate the bit rate would be $12\\times 5=60$ Mbit/s, so the $40\\%$ margin costs $24$ Mbit/s — $40\\%$ of the bit rate, since the two are proportional at fixed resolution.<br>'
     +'<b>Check.</b> $4096=2^{12}$, so the resolution is exact rather than rounded. And the margin costs the same percentage of the bit rate as it adds to the sampling rate, which is the sense in which oversampling is paid for linearly while resolution is paid for logarithmically: doubling the levels costs one bit per sample, or $8.3\\%$ here, and buys $6.02$ dB.',
  err:'Computing $f_s=2W+0.4W=5.5$ MHz. "Forty per cent greater than the Nyquist rate" multiplies the Nyquist rate, not the bandwidth.',
  teach:'Part (d) is the one that makes the question worth setting. It puts the two ways of spending bit rate — more samples and more levels — on the same scale for the first time.' },

{ id:'D1-16', module:'M1', type:'full', src:'MT Q2',
  stem:'A stationary source is sampled, and the samples have the density $$f_X(x)=k\\left(1+|x|\\right),\\qquad x\\in[-1,1],$$and zero elsewhere. The samples are quantized with a uniform quantizer with $128$ levels covering $[-1,1]$, and the quantization noise is uniform on $\\left(-\\tfrac{\\Delta}{2},\\tfrac{\\Delta}{2}\\right)$.',
  parts:['Determine the value of $k$.',
         'Obtain the SQNR in decibels.',
         'If the bandwidth of the source is $4$ kHz and it is sampled at the Nyquist rate, give the bit rate of the corresponding PCM system.'],
  sol:'<b>Given.</b> A density with an unknown constant on $[-1,1]$; $L=128$.<br>'
     +'<b>Find.</b> $k$, the SQNR and the PCM bit rate.<br>'
     +'<b>Method.</b> The constant comes from the total area. The signal power is the second moment against the density. The noise power is $\\Delta^{2}/12$, which applies because the quantizer is uniform and fine.<br>'
     +'<b>Solution — (a).</b> $$\\int_{-1}^{1}k(1+|x|)\\,dx=k\\left(2+2\\cdot\\tfrac12\\right)=3k=1\\;\\Longrightarrow\\;k=\\tfrac13.$$<br>'
     +'<b>Solution — (b).</b> $$P_X=\\int_{-1}^{1}x^{2}\\cdot\\tfrac13(1+|x|)\\,dx=\\tfrac23\\int_{0}^{1}\\left(x^{2}+x^{3}\\right)dx=\\tfrac23\\left(\\tfrac13+\\tfrac14\\right)=\\tfrac{7}{18}=0.3889.$$With $m_{\\max}=1$, $\\Delta=2/128=1/64$ and $E[Q^{2}]=\\Delta^{2}/12=2.035\\times10^{-5}$. Hence $$\\mathrm{SQNR}=\\frac{0.3889}{2.035\\times10^{-5}}=19115\\;\\Longrightarrow\\;42.81\\ \\text{dB}.$$<br>'
     +'<b>Solution — (c).</b> $R=\\log_2 128=7$ bits per sample and $f_s=2(4000)=8$ kHz, so $R_b=7\\times 8000=56$ kbit/s.<br>'
     +'<b>Check.</b> By the intercept route, $\\alpha=10\\log_{10}\\dfrac{3(0.3889)}{1}=0.67$ dB and $\\mathrm{SQNR}=0.67+6.02(7)=42.81$ dB. The intercept is positive but small: this density puts more mass near the edges than a uniform one, so the source has more power than $U(-1,1)$ — $0.389$ against $0.333$ — and gains the difference.',
  err:'Forgetting the absolute value when integrating and computing $\\int_{-1}^{1}k(1+x)\\,dx=2k$, which gives $k=\\tfrac12$. Every later number then inherits the error.',
  teach:'The check is the teaching point: a source that pushes its mass towards the edges of a fixed range does better through a uniform quantizer, and the intercept measures exactly how much better.' },

{ id:'D1-17', module:'M1', type:'full', src:'MT Q2',
  stem:'The samples of a stationary source $X$ have the triangular density $$f_X(x)=c\\left(1-\\frac{|x|}{8}\\right),\\qquad |x|\\le 8,$$and zero elsewhere. They are quantized by $$\\hat{X}=\\mathbb{Q}(X)=\\begin{cases}-3, & -6<X<0\\\\ \\;\\;\\,3, & \\;\\;\\;0<X<6\\\\ \\;\\;\\,0, & \\text{otherwise.}\\end{cases}$$',
  figure: () => {
    const a = P.Axes({w:660,h:250,xr:[-9,9],yr:[-4.4,4.4],
      xlabel:'x',ylabel:'\\mathbb{Q}(x)',pad:{l:52,r:26,t:26,b:42},xtarget:6,ytarget:4});
    a.poly([[-9,0],[-6,0]],{color:C.mid,width:2.2});
    a.poly([[-6,-3],[0,-3]],{color:C.mid,width:2.2});
    a.poly([[0,3],[6,3]],{color:C.mid,width:2.2});
    a.poly([[6,0],[9,0]],{color:C.mid,width:2.2});
    a.curve(x=>Math.abs(x)<=8 ? 3.6*(1-Math.abs(x)/8) : null,{color:C.in,width:1.6,dash:'5 4'});
    return a.svg();
  },
  parts:['Determine the value of $c$.',
         'Calculate the power of the samples of the source.',
         'Calculate the power of the quantization noise.',
         'Obtain the SQNR in decibels.'],
  sol:'<b>Given.</b> A triangular density on $[-8,8]$ and a three-level quantizer that returns zero outside $(-6,6)$.<br>'
     +'<b>Find.</b> $c$, $P_X$, $P_Q$ and the SQNR.<br>'
     +'<b>Method.</b> Area for the constant, second moment for the power, and a region-by-region integral for the noise — $\\Delta^{2}/12$ cannot be used here, because the quantizer is neither uniform nor fine.<br>'
     +'<b>Solution — (a).</b> The density is a triangle of base $16$ and height $c$, so $\\tfrac12(16)c=8c=1$ and $c=\\tfrac18=0.125$.<br>'
     +'<b>Solution — (b).</b> A symmetric triangular density on $[-a,a]$ has $E[X^{2}]=a^{2}/6$, so $$P_X=\\frac{64}{6}=10.667.$$<br>'
     +'<b>Solution — (c).</b> Splitting at the boundaries and using symmetry, $$P_Q=2\\left[\\int_{0}^{6}(x-3)^{2}f_X(x)\\,dx+\\int_{6}^{8}x^{2}f_X(x)\\,dx\\right]=2\\bigl[1.406+1.396\\bigr]=5.604.$$<br>'
     +'<b>Solution — (d).</b> $$\\mathrm{SQNR}\\;[\\mathrm{dB}]=10\\log_{10}\\frac{10.667}{5.604}=2.79\\ \\text{dB}.$$<br>'
     +'<b>Check.</b> A three-level quantizer carries at most $\\log_2 3=1.58$ bits, so a result of a few decibels is the right order; anything in the tens would be impossible. Note also that the two contributions to $P_Q$ are almost equal even though the outer region holds far less probability — the error there is much larger, and the two effects nearly cancel.',
  err:'Applying $\\Delta^{2}/12$ with $\\Delta=6$. That gives $P_Q=3$ and an SQNR of $5.5$ dB, twice too good, because the error outside $(-6,6)$ is not bounded by half a step at all.',
  teach:'Ask before part (c) whether $\\Delta^{2}/12$ applies. The question exists to make the answer "no", and a student who reaches for it has not noticed that the outer regions are unbounded.' },

{ id:'D1-18', module:'M1', type:'full', src:'Final Q1',
  stem:'The signal $$x(t)=2\\cos(2000\\pi t)+\\cos(6000\\pi t)$$is sampled at the Nyquist rate and uniformly quantized with $128$ levels.',
  parts:['Calculate the bit rate of this system.',
         'Calculate the step size of the uniform quantizer.',
         'Calculate the SQNR of the quantization scheme in decibels.'],
  sol:'<b>Given.</b> Two sinusoids at $1$ kHz and $3$ kHz with amplitudes $2$ and $1$; $L=128$.<br>'
     +'<b>Find.</b> $R_b$, $\\Delta$ and the SQNR.<br>'
     +'<b>Method.</b> The rate comes from the highest frequency; the step size from the peak; the SQNR from the average power and the peak together.<br>'
     +'<b>Solution — (a).</b> The highest frequency is $3$ kHz, so $f_s=6$ kHz. With $R=\\log_2 128=7$ bits, $$R_b=7\\times 6000=42\\ \\text{kbit/s}.$$<br>'
     +'<b>Solution — (b).</b> Both terms reach their maxima at $t=0$, where $x(0)=2+1=3$, and no other instant exceeds it, so $m_{\\max}=3$ and $$\\Delta=\\frac{2(3)}{128}=0.0469\\ \\text{V}.$$<br>'
     +'<b>Solution — (c).</b> By Parseval the average power is $$P_M=\\frac{2^{2}}{2}+\\frac{1^{2}}{2}=2.5,$$so $\\alpha=10\\log_{10}\\dfrac{3(2.5)}{9}=-0.79$ dB and $$\\mathrm{SQNR}=-0.79+6.02(7)=41.35\\ \\text{dB}.$$<br>'
     +'<b>Check.</b> The intercept is negative, and it should be: the signal reaches $3$ but carries only the power of a single sinusoid of amplitude $\\sqrt{5}=2.24$, so it does not fill the range as efficiently as a pure sinusoid would. Independently, $E[Q^{2}]=\\Delta^{2}/12=1.831\\times10^{-4}$ and $10\\log_{10}(2.5/1.831\\times10^{-4})=41.35$ dB.',
  err:'Taking $m_{\\max}=2$, the larger of the two amplitudes. The peak of a sum is the sum of the amplitudes whenever the terms peak together, which they do here at $t=0$.',
  teach:'Ask whether $m_{\\max}=3$ needs proof. It does in general — two sinusoids at unrelated frequencies need not peak together — and here it follows because both are cosines with zero phase.' },

{ id:'D1-19', module:'M1', type:'full', src:'CH7 s.7–8, 13',
  stem:'A message $x(t)$ is bandlimited to $20$ kHz. The available converter runs at $f_s=30$ kHz.',
  parts:['Give the Nyquist rate, and say whether $30$ kHz is adequate.',
         'A component of the message at $18$ kHz is present. Where does it appear after sampling and reconstruction with an ideal lowpass filter of cut-off $15$ kHz?',
         'Give the cut-off of an anti-aliasing filter that makes $30$ kHz adequate, and say what is lost.',
         'With that anti-aliasing filter in place and a guard band of $4$ kHz, give the sampling rate that would be needed.'],
  sol:'<b>Given.</b> $W=20$ kHz, $f_s=30$ kHz.<br>'
     +'<b>Find.</b> Whether the rate works, where an $18$ kHz component lands, and what filtering fixes it.<br>'
     +'<b>Method.</b> Compare $f_s$ with $2W$; if the replicas overlap, find where the overlapping component lands from $|f_0-nf_s|$.<br>'
     +'<b>Solution — (a).</b> $f_s^{\\min}=2W=40$ kHz. The available $30$ kHz is below it, so the replicas overlap and the rate is <b>not</b> adequate.<br>'
     +'<b>Solution — (b).</b> The replicas of the $18$ kHz component sit at $18-30=-12$ kHz and at $18+30=48$ kHz, among others. The filter passes $|f|<15$ kHz, so it keeps the copy at $12$ kHz. An $18$ kHz component of the message emerges as a $12$ kHz component, on top of whatever the message genuinely had at $12$ kHz.<br>'
     +'<b>Solution — (c).</b> A rate of $30$ kHz is adequate for a message bandlimited to $f_s/2=15$ kHz, so the anti-aliasing filter must cut off at $15$ kHz. Everything the message carried between $15$ and $20$ kHz is lost — permanently, and deliberately.<br>'
     +'<b>Solution — (d).</b> With $W=15$ kHz and $f_g=4$ kHz, $f_s=2(15)+4=34$ kHz.<br>'
     +'<b>Check.</b> Part (b) and part (c) are the same statement seen twice: $18$ kHz is above $f_s/2=15$ kHz, which is exactly the condition for a component to alias, and the filter of part (c) is the one that removes every such component. Part (d) is above the $30$ kHz the converter offers, which is the honest conclusion: with a guard band this converter is not fast enough even for the filtered message.',
  err:'Answering part (b) with $18$ kHz on the grounds that the component "is still in the message". It is, but the sampler put a copy at $12$ kHz and the reconstruction filter keeps that one and rejects the original.',
  teach:'Part (c) is where students resist: the fix throws information away. Naming the trade — a wrong answer converted into a missing one — is what makes it acceptable.' },

{ id:'D1-20', module:'M1', type:'full', src:'CH7 s.36',
  stem:'The message $$m(t)=6\\,\\bigl|\\operatorname{sinc}(t-1)\\bigr|,\\qquad \\operatorname{sinc}(x)=\\frac{\\sin\\pi x}{\\pi x},$$is sampled every $T_s=0.4$ s and quantized by an eight-level uniform quantizer covering $[0,6]$ with each level at the midpoint of its tread. Natural binary encoding is used.',
  figure: () => {
    const m = t => 6*Math.abs(sinc(t-1));
    const a = P.Axes({w:700,h:250,xr:[-0.1,2.1],yr:[-0.4,7],
      xlabel:'t\\;(\\mathrm{s})',ylabel:'m(t)',pad:{l:52,r:26,t:26,b:44},xtarget:5,ytarget:4});
    for(let k=0;k<8;k++) a.hline(0.75*k+0.375,{color:C.rule,dash:'2 5'});
    a.curve(m,{color:C.in});
    for(let n=0;n<=5;n++) a.point(0.4*n, m(0.4*n), {color:C.in, r:4});
    return a.svg();
  },
  parts:['Give the step size and the eight levels.',
         'Give the six samples from $t=0$ to $t=2$ s, their levels and their code words.',
         'Give the bit rate and the duration of one bit.',
         'Sketch, in words, the polar NRZ waveform of the first two code words.'],
  sol:'<b>Given.</b> $m(t)=6|\\operatorname{sinc}(t-1)|$, $T_s=0.4$ s, $L=8$ over $[0,6]$.<br>'
     +'<b>Find.</b> $\\Delta$, the samples and their words, the rate, and the line-code waveform.<br>'
     +'<b>Method.</b> Evaluate the signal at each instant; find its tread; write the index in three bits; the rate follows from $R$ and $f_s$.<br>'
     +'<b>Solution — (a).</b> $\\Delta=(6-0)/8=0.75$ V, and the levels are $0.375,\\,1.125,\\,1.875,\\,2.625,\\,3.375,\\,4.125,\\,4.875,\\,5.625$.<br>'
     +'<b>Solution — (b).</b> The samples are<div class="eq plain sm">'
     +'$$\\begin{array}{c|cccccc} t\\;(\\mathrm{s}) & 0 & 0.4 & 0.8 & 1.2 & 1.6 & 2.0\\\\\\hline m(t) & 0 & 3.027 & 5.613 & 5.613 & 3.027 & 0\\\\ \\text{level} & 0.375 & 3.375 & 5.625 & 5.625 & 3.375 & 0.375\\\\ \\text{word} & 000 & 100 & 111 & 111 & 100 & 000\\end{array}$$</div>'
     +'<b>Solution — (c).</b> $R=\\log_2 8=3$ bits per sample and $f_s=1/0.4=2.5$ samples per second, so $R_b=3(2.5)=7.5$ bit/s and $T_b=T_s/3=0.1333$ s.<br>'
     +'<b>Solution — (d).</b> Polar NRZ sends $+A$ for a one and $-A$ for a zero, each held for a full $T_b$. The first six bits are $000\\,100$, so the waveform holds $-A$ for three bit intervals, rises to $+A$ for one, and returns to $-A$ for two — a total of $0.8$ s, which is two sampling intervals.<br>'
     +'<b>Check.</b> The signal is symmetric about $t=1$, and so are the samples and therefore the code words, read forwards or backwards. The sample at $t=0$ is $6|\\operatorname{sinc}(-1)|=0$ exactly, because $\\operatorname{sinc}$ vanishes at every non-zero integer — the same fact the interpolation formula rests on. Every quantization error is at most half a step. The smallest is $|5.613-5.625|=0.012$; the largest is at $t=0$ and $t=2$, where the sample is exactly zero and the level below it is $0.375$, so the error is $0.375=\\Delta/2$ exactly. A sample sitting on the bottom edge of the first tread is the worst case a mid-tread level list allows, and it is the reason the bound is stated as $\\le\\Delta/2$ rather than $<$.',
  err:'Placing the eight levels at $0,\\,0.75,\\,\\ldots,\\,5.25$ rather than at the tread midpoints. The sample at $t=0$ then encodes correctly by luck, and every other one is off by half a step.',
  teach:'The symmetry noted in the check is the quickest way to mark this question: the word list must read the same in both directions, and a student whose does not has made an arithmetic slip somewhere in the middle.' }

]);

/* ======================================================================
   The two scenes that carry them.
   ====================================================================== */
window.DRILLMAP_M1 = [

{ id:'m1-drill-map', module:'M1', nav:'Module 1 · question types',
  title:'Module 1 — what a question looks like',
  objective:'Name the six recurring question shapes before the module is read.',
  keywords:'question types module 1 sampling rate quantization sqnr reconstruction pcm taxonomy practice',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Question types'},
  {t:'title', text:'Six shapes, and the method each one wants'},
  {t:'lede', text:'Questions on sampling and quantization come in six shapes. Read them now, before the module: you are not expected to answer them yet, only to recognise them when they arrive.'},
  /* Six columns of this width overflow the stage and the whole scene is then
     scaled down to fit, which shrinks every formula on the page. Three columns
     over two rows use the height the scene has spare and leave the type at the
     size it was designed at. */
  {t:'drilltypes', module:'M1', style:'grid-template-columns:repeat(3,minmax(0,1fr));gap:26px 44px'}
]}

];

window.DRILL_M1 = [

{ id:'m1-drill', module:'M1', nav:'Module 1 · practice questions',
  title:'Module 1 — practice questions',
  objective:'Twenty open-ended questions with worked solutions, in the form they are asked in.',
  keywords:'practice questions module 1 sampling nyquist quantization sqnr step size bit rate pcm gray code aliasing',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Practice D1-01 … D1-20'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question on paper before opening its solution. Every solution ends with a <b>Check</b> step. In this module the cheap checks are: a bit rate must be the resolution times the sampling rate, an SQNR must move by $6.02$ dB when a bit is added and by nothing else, every quantization error must be under half a step, and a level count derived from an accuracy requirement must be rounded up.'},
  {t:'rule', short:true},
  {t:'drill', module:'M1'}
]}

];
})();
