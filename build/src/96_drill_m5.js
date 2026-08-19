/* ==========================================================================
   Practice questions — Module 5.

   Final Q3 supplies the shape of the last three: a modulation scheme is named,
   the constellation has to be drawn, and the symbol error probability follows
   from its geometry. That question is shared with Module 4, which supplies the
   receiver; the schemes are this module's part of it.

   The rest come from the worked examples in the lecture material and from the
   comparisons the module makes between the families.
   ========================================================================== */
(function(){

CONTENT.DRILLTYPES.M5 = [
  { k:'binary', name:'A binary scheme',
    asks:'BPSK, BFSK or BASK is named with an energy and a noise level. Find the distance and the bit error probability.',
    method:['Write the two points down first. Antipodal gives $\\pm\\sqrt{E_b}$ on one axis; orthogonal gives $(\\sqrt{E_b},0)$ and $(0,\\sqrt{E_b})$; on-off gives $0$ and $\\sqrt{2E_b}$ once the average is taken.',
            'Antipodal has $d^{2}=4E_b$ and $P_b=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$. Orthogonal and on-off both have $d^{2}=2E_b$ and $P_b=Q\\!\\left(\\sqrt{E_b/N_0}\\right)$.',
            'The gap between them is a factor of two inside the square root, which is $3.01$ dB, and it never changes with the noise level.'],
    go:'m5-bpsk' },

  { k:'mpsk', name:'M-ary phase-shift keying',
    asks:'An $M$-PSK constellation is given with $E_s$ or $E_b$. Find $d_{\\min}$, $N_{\\min}$ and the symbol error probability.',
    method:['All $M$ points sit on a circle of radius $\\sqrt{E_s}$ at spacing $2\\pi/M$, so $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/M)$.',
            'Every point has exactly two neighbours at that distance, so $N_{\\min}=2$ for every $M$ above two.',
            '$P_e\\approx 2Q\\!\\left(\\sqrt{2E_s/N_0}\\,\\sin(\\pi/M)\\right)$. Convert with $E_s=(\\log_2 M)E_b$ if the question gives energy per bit.'],
    go:'m5-mpsk' },

  { k:'mpam', name:'M-ary amplitude-shift keying',
    asks:'An $M$-PAM constellation is given. Find the average energy, the distance and the error probability.',
    method:['The points are $\\pm A,\\pm3A,\\ldots,\\pm(M-1)A$ on one axis, so $d_{\\min}=2A$ and $E_{s,\\text{avg}}=A^{2}(M^{2}-1)/3$.',
            'Eliminating $A$ gives $d_{\\min}^{2}=12E_{s,\\text{avg}}/(M^{2}-1)$, which is the form to use when the energy is what the question fixes.',
            'The two end points have one neighbour and the rest have two, so $N_{\\min}=2(M-1)/M$ — an average, and not a whole number.'],
    go:'m5-mask' },

  { k:'qam', name:'Quadrature amplitude modulation',
    asks:'An $M$-QAM constellation is given. Find $d_{\\min}$, $N_{\\min}$ and the error probability.',
    method:['Square QAM is two independent $\\sqrt{M}$-level amplitude constellations at right angles. With spacing $d$, $E_{s,\\text{avg}}=(M-1)d^{2}/6$.',
            'So $d_{\\min}^{2}=6E_{s,\\text{avg}}/(M-1)$ — the same shape as PAM but with $M-1$ where PAM has $M^{2}-1$.',
            'Count $N_{\\min}$ by position: corners have two neighbours, edges three, the interior four. Average over all $M$ points.'],
    go:'m5-qam' },

  { k:'compare', name:'Comparing two schemes',
    asks:'Two schemes are named. Compare the energy each needs, the bits each carries, and the bandwidth each occupies.',
    method:['Fix what is being held equal before comparing anything: the same $E_s$, the same $E_b$, or the same error probability. The answer changes with the choice.',
            'At a fixed error probability, take the ratio of the two $Q$ arguments and turn it into decibels with $10\\log_{10}$ of the ratio of the squares.',
            'PSK and QAM keep their bandwidth as $M$ grows and pay in energy; FSK keeps its energy and pays in bandwidth. That is the whole trade.'],
    go:'m5-compare' },

  { k:'full', name:'A full-length question on one scheme',
    asks:'One scheme, three or four parts: draw the constellation, find the distance, apply the error formula, and compare with an alternative.',
    method:['Draw the constellation to scale first and mark $d_{\\min}$ on the drawing. Everything else is read off it.',
            'State once whether the given energy is per symbol or per bit, convert with $E_s=(\\log_2 M)E_b$, and do not convert again.',
            'Check the answer against a case you already know: at $M=4$, QAM and PSK are the same constellation, and QPSK needs the same $E_b/N_0$ as BPSK.'] }
];

CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- single-skill ---------------------------------------------------- */

{ id:'D5-01', module:'M5', type:'binary', src:'CH9 s.68',
  stem:'A binary phase-shift keying system runs at $E_b/N_0=9$ dB.',
  parts:['Give the two constellation points and the distance between them.',
         'Give the bit error probability.'],
  sol:'<b>Given.</b> BPSK at $9$ dB.<br>'
     +'<b>Find.</b> $d_{\\min}$ and $P_b$.<br>'
     +'<b>Method.</b> Place the points, measure the distance, put it through one $Q$.<br>'
     +'<b>Solution — (a).</b> The two waveforms are $\\pm\\sqrt{2E_b/T_b}\\cos(2\\pi f_c t)$, which is one basis function carrying $+\\sqrt{E_b}$ and $-\\sqrt{E_b}$. So $d_{\\min}=2\\sqrt{E_b}$ and $d_{\\min}^{2}=4E_b$.<br>'
     +'<b>Solution — (b).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{4E_b}{2N_0}=\\dfrac{2E_b}{N_0}$. At $9$ dB, $E_b/N_0=7.943$, so the argument is $\\sqrt{15.887}=3.986$ and $P_b=Q(3.986)=3.36\\times10^{-5}$.<br>'
     +'<b>Check.</b> The two points are the furthest apart that two points of energy $E_b$ can be, so no binary scheme at this energy does better. Any other answer to part (b) that is smaller than this one is wrong for that reason alone.',
  err:'Writing $P_b=Q\\!\\left(\\sqrt{E_b/N_0}\\right)$, which is the orthogonal answer. The factor of two comes from the points being antipodal rather than at right angles.',
  teach:'Ask for the answer at $12$ dB before computing it. The argument grows as $\\sqrt{\\cdot}$, so three more decibels doubles $2E_b/N_0$ and multiplies the argument by $1.41$ — and $Q$ falls by nearly two orders of magnitude. That steepness is the reason a few decibels matter so much.' },

{ id:'D5-02', module:'M5', type:'binary', src:'CH9 s.72',
  stem:'A binary frequency-shift keying system uses two orthogonal waveforms at the same $E_b/N_0=9$ dB.',
  parts:['Give the two constellation points and the distance between them.',
         'Give the bit error probability.',
         'Give the penalty in decibels against BPSK.'],
  sol:'<b>Given.</b> BFSK at $9$ dB, orthogonal waveforms.<br>'
     +'<b>Find.</b> $d_{\\min}$, $P_b$, and the gap.<br>'
     +'<b>Method.</b> Orthogonal waveforms need two basis functions, one for each. The points are on the two axes.<br>'
     +'<b>Solution — (a).</b> The points are $(\\sqrt{E_b},0)$ and $(0,\\sqrt{E_b})$, a right angle apart. By Pythagoras $d_{\\min}=\\sqrt{2E_b}$ and $d_{\\min}^{2}=2E_b$.<br>'
     +'<b>Solution — (b).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{E_b}{N_0}=7.943$, so $P_b=Q(2.818)=2.41\\times10^{-3}$.<br>'
     +'<b>Solution — (c).</b> BPSK reaches the same $P_b$ with half the energy, and $10\\log_{10}2=3.01$ dB.<br>'
     +'<b>Check.</b> The two error probabilities are $3.36\\times10^{-5}$ and $2.41\\times10^{-3}$ — a factor of seventy for the same energy. The $3$ dB is not a small correction.',
  err:'Drawing both points on one axis. Orthogonal waveforms are at a right angle by definition, and putting them on a line turns the answer into the antipodal one.',
  teach:'Ask where the $\\sqrt{2}$ went. The distance fell from $2\\sqrt{E_b}$ to $\\sqrt{2E_b}$, a factor of $\\sqrt{2}$; squaring it gives the factor of two in the $Q$ argument, which is the $3$ dB. Every appearance of $3$ dB in this module traces back to one $\\sqrt{2}$ in a picture.' },

{ id:'D5-03', module:'M5', type:'binary', src:'CH9 s.70',
  stem:'A binary amplitude-shift keying system sends nothing for a $0$ and $\\sqrt{2E/T_b}\\cos(2\\pi f_c t)$ for a $1$, with the two bits equally likely. The system runs at $E_b/N_0=10$ dB, where $E_b$ is the <em>average</em> energy per bit.',
  parts:['Give the average energy per bit in terms of $E$.',
         'Give the distance between the two points in terms of $E_b$.',
         'Give the bit error probability.'],
  sol:'<b>Given.</b> On-off keying, equally likely bits, $E_b/N_0=10$ dB.<br>'
     +'<b>Find.</b> $E_b$, $d_{\\min}$, $P_b$.<br>'
     +'<b>Method.</b> One basis function carries both signals, so the constellation is two points on a line: $0$ and $\\sqrt{E}$.<br>'
     +'<b>Solution — (a).</b> Half the bits cost $E$ and half cost nothing, so $E_b=E/2$ and $E=2E_b$.<br>'
     +'<b>Solution — (b).</b> The distance is $\\sqrt{E}=\\sqrt{2E_b}$, so $d_{\\min}^{2}=2E_b$ — the same as BFSK.<br>'
     +'<b>Solution — (c).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{E_b}{N_0}=10$, so $P_b=Q(3.162)=7.83\\times10^{-4}$.<br>'
     +'<b>Check.</b> On-off and orthogonal give the same answer by two different routes: one halves the energy and keeps the points on a line, the other keeps the energy and separates the points by a right angle. Both end at $d^{2}=2E_b$.',
  err:'Using $E$ where $E_b$ is asked for. The transmitted symbol carries $E$, but half the symbols carry nothing, so the average is $E/2$ — and every comparison in this course is at equal average energy.',
  teach:'Ask which scheme a designer would pick between on-off and BFSK, given that they have the same error probability. On-off needs one basis function and half the bandwidth, but its transmitter switches between zero and full power. The mathematics does not choose; the hardware does.' },

{ id:'D5-04', module:'M5', type:'binary', src:'CH9 s.74',
  stem:'A link must achieve $P_b=10^{-5}$.',
  parts:['Give the $E_b/N_0$ in decibels that BPSK needs.',
         'Give the $E_b/N_0$ in decibels that BFSK needs.'],
  sol:'<b>Given.</b> A target error probability.<br>'
     +'<b>Find.</b> The energy each scheme needs to reach it.<br>'
     +'<b>Method.</b> Invert the $Q$ once, then read each scheme off its own $d^{2}$.<br>'
     +'<b>Solution — (a).</b> $Q(x)=10^{-5}$ at $x=4.265$. For BPSK the argument is $\\sqrt{2E_b/N_0}$, so $2E_b/N_0=18.19$, $E_b/N_0=9.095$, and in decibels $9.59$ dB.<br>'
     +'<b>Solution — (b).</b> For BFSK the argument is $\\sqrt{E_b/N_0}$, so $E_b/N_0=18.19$ and in decibels $12.60$ dB.<br>'
     +'<b>Check.</b> The two answers differ by $12.60-9.59=3.01$ dB, which is the gap the geometry predicted before any number was computed.',
  err:'Inverting $Q$ and then forgetting to square. The $x$ that comes out of the inversion is the whole argument, and the energy sits underneath a square root.',
  teach:'Only one inversion of $Q$ was needed for both parts. Getting used to solving for $x$ first and then handling each scheme separately saves the work of doing it twice, and it makes the $3$ dB fall out on its own.' },

{ id:'D5-05', module:'M5', type:'mpsk', src:'CH9 s.79',
  stem:'An $8$-PSK system operates at $E_s/N_0=13$ dB.',
  parts:['Give $d_{\\min}$ in terms of $E_s$.',
         'Give $N_{\\min}$.',
         'Give the symbol error probability.'],
  sol:'<b>Given.</b> $M=8$ on a circle of radius $\\sqrt{E_s}$, at $13$ dB.<br>'
     +'<b>Find.</b> $d_{\\min}$, $N_{\\min}$, $P_e$.<br>'
     +'<b>Method.</b> Two neighbouring points are separated by an angle $2\\pi/M$ on a circle of radius $\\sqrt{E_s}$. The chord across that angle is $2\\sqrt{E_s}\\sin(\\pi/M)$.<br>'
     +'<b>Solution — (a).</b> $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/8)=0.765\\sqrt{E_s}$.<br>'
     +'<b>Solution — (b).</b> Every point on a circle has one neighbour clockwise and one anticlockwise, so $N_{\\min}=2$.<br>'
     +'<b>Solution — (c).</b> $P_e\\approx 2Q\\!\\left(\\sqrt{2E_s/N_0}\\,\\sin(\\pi/8)\\right)$. At $13$ dB, $E_s/N_0=19.95$, so the argument is $\\sqrt{39.91}\\times0.3827=2.417$ and $P_e\\approx 2Q(2.417)=1.56\\times10^{-2}$.<br>'
     +'<b>Check.</b> One symbol in sixty-four is wrong. For eight-point PSK at only $13$ dB that is the right order of magnitude — the points are crowded on one circle, and it shows.',
  err:'Using $\\sin(2\\pi/M)$ instead of $\\sin(\\pi/M)$. The half-angle comes from dropping a perpendicular from the centre onto the chord, which cuts the angle in two.',
  teach:'Ask for $d_{\\min}$ at $M=2$ from the same formula: $2\\sqrt{E_s}\\sin(\\pi/2)=2\\sqrt{E_s}$, which is BPSK. A general formula that reproduces the case you already know is a formula you can trust.' },

{ id:'D5-06', module:'M5', type:'mpsk', src:'CH9 s.78',
  stem:'A QPSK system operates at $E_s/N_0=12$ dB.',
  parts:['Give the symbol error probability.',
         'Give the corresponding $E_b/N_0$ in decibels.',
         'Give the bit error probability of BPSK at that same $E_b/N_0$, and comment.'],
  sol:'<b>Given.</b> $M=4$ at $12$ dB per symbol.<br>'
     +'<b>Find.</b> $P_e$, $E_b/N_0$, and the BPSK comparison.<br>'
     +'<b>Method.</b> The same formula with $M=4$, then convert the energy.<br>'
     +'<b>Solution — (a).</b> $\\sin(\\pi/4)=0.7071$ and $E_s/N_0=15.85$, so the argument is $\\sqrt{31.70}\\times0.7071=3.981$ and $P_e\\approx 2Q(3.981)=6.86\\times10^{-5}$.<br>'
     +'<b>Solution — (b).</b> QPSK carries two bits a symbol, so $E_b=E_s/2$ and $E_b/N_0=12-3.01=8.99$ dB.<br>'
     +'<b>Solution — (c).</b> BPSK at $8.99$ dB gives $P_b=Q\\!\\left(\\sqrt{2\\times7.925}\\right)=Q(3.981)=3.43\\times10^{-5}$ — exactly half the QPSK symbol error.<br>'
     +'<b>Check.</b> The two $Q$ arguments came out identical, which is the whole reason QPSK is used. It is two BPSK systems sharing one carrier, one on the cosine and one on the sine, so it carries twice the bits at the same energy per bit and the same bit error rate.',
  err:'Comparing QPSK and BPSK at the same $E_s/N_0$. That is not the comparison anyone wants: the schemes carry different numbers of bits per symbol, so the fair axis is energy per bit.',
  teach:'The factor of two between $P_e$ and $P_b$ here is not a coincidence and it is not general either. It holds because a QPSK symbol error is almost always to a neighbour, which differs in exactly one of the two bits — that is Gray coding, and it is why constellations are labelled that way.' },

{ id:'D5-07', module:'M5', type:'mpsk', src:'CH9 s.81',
  stem:'A design moves from QPSK to $8$-PSK, holding the symbol error probability fixed.',
  parts:['Give the ratio of the $E_s/N_0$ the two schemes need.',
         'Give the cost in decibels, per symbol and per bit.'],
  sol:'<b>Given.</b> Two PSK sizes at a fixed error probability.<br>'
     +'<b>Find.</b> The extra energy $8$-PSK needs.<br>'
     +'<b>Method.</b> A fixed error probability means a fixed $Q$ argument. Set the two arguments equal and solve for the ratio of the energies.<br>'
     +'<b>Solution — (a).</b> The argument is $\\sqrt{2E_s/N_0}\\,\\sin(\\pi/M)$, so holding it fixed needs $(E_s/N_0)\\sin^{2}(\\pi/M)$ fixed. The ratio is $\\dfrac{\\sin^{2}(\\pi/4)}{\\sin^{2}(\\pi/8)}=\\dfrac{0.5}{0.1464}=3.414$.<br>'
     +'<b>Solution — (b).</b> $10\\log_{10}3.414=5.33$ dB per symbol. Per bit the extra bit helps: $8$-PSK carries three bits where QPSK carries two, so the ratio is $3.414\\times\\frac{2}{3}=2.276$, or $3.57$ dB.<br>'
     +'<b>Check.</b> Both numbers are positive, so the larger alphabet costs energy either way it is measured — which it must, because the points are closer together at the same radius.',
  err:'Quoting the per-symbol figure when the question is about a link budget. Link budgets are written in energy per bit, and the two answers differ by nearly two decibels here.',
  teach:'Ask what the same calculation gives from $8$-PSK to $16$-PSK. The ratio of $\\sin^{2}$ is larger again, and each doubling costs more than the last. That is why PSK is rarely seen above eight points and QAM takes over.' },

{ id:'D5-08', module:'M5', type:'mpsk', src:'CH9 s.80',
  stem:'Compare $8$-PSK and $16$-PSK at the same $E_s$.',
  parts:['Give $d_{\\min}$ for each in terms of $\\sqrt{E_s}$.',
         'Give the ratio of their squared distances in decibels.'],
  sol:'<b>Given.</b> Two PSK sizes at the same symbol energy.<br>'
     +'<b>Find.</b> The two distances and the gap.<br>'
     +'<b>Method.</b> One formula twice.<br>'
     +'<b>Solution — (a).</b> $8$-PSK: $2\\sin(\\pi/8)=0.765$. $16$-PSK: $2\\sin(\\pi/16)=0.390$.<br>'
     +'<b>Solution — (b).</b> The ratio of the squares is $(0.390/0.765)^{2}=0.260$, and $10\\log_{10}0.260=-5.85$ dB.<br>'
     +'<b>Check.</b> Doubling the number of points on a fixed circle roughly halves the spacing, so the squared distance falls by roughly a factor of four, or $6$ dB. The exact figure of $5.85$ dB is a little better than that, because $\\sin(\\pi/16)$ is more than half of $\\sin(\\pi/8)$: the sine falls below its own angle, and it falls further for the larger angle.',
  err:'Comparing the distances rather than their squares when converting to decibels. The $Q$ argument contains $d^{2}$, so the decibel figure is $20\\log_{10}$ of a distance ratio or $10\\log_{10}$ of a squared one — the same number, written two ways.',
  teach:'The picture says it all: sixteen points on the same circle as eight are packed twice as tightly. Once that is seen, the direction of every answer here is known before the arithmetic starts, and the arithmetic only supplies the size.' },

{ id:'D5-09', module:'M5', type:'mpam', src:'CH9 s.85',
  stem:'A $4$-PAM system has points at $\\pm A$ and $\\pm 3A$, and runs at $E_{s}/N_0=12$ dB.',
  parts:['Give the average symbol energy in terms of $A$.',
         'Give $N_{\\min}$.',
         'Give the symbol error probability.'],
  sol:'<b>Given.</b> Four equally spaced points on a line at $12$ dB.<br>'
     +'<b>Find.</b> $E_{s,\\text{avg}}$, $N_{\\min}$, $P_e$.<br>'
     +'<b>Method.</b> Average the squared coordinates, count the neighbours, then one $Q$.<br>'
     +'<b>Solution — (a).</b> $E_{s,\\text{avg}}=\\frac{1}{4}(A^{2}+9A^{2}+A^{2}+9A^{2})=5A^{2}$, which is the general result $A^{2}(M^{2}-1)/3$ at $M=4$.<br>'
     +'<b>Solution — (b).</b> The two outer points have one neighbour each and the two inner points have two, so $N_{\\min}=\\frac{1+2+2+1}{4}=1.5$, which is $2(M-1)/M$.<br>'
     +'<b>Solution — (c).</b> $d_{\\min}=2A$, so $d_{\\min}^{2}=4A^{2}=\\frac{4}{5}E_{s}$ and $\\dfrac{d_{\\min}^{2}}{2N_0}=0.4\\,\\dfrac{E_s}{N_0}$. At $12$ dB that is $0.4\\times15.85=6.34$, so $P_e\\approx1.5\\,Q(2.518)=1.5\\times5.90\\times10^{-3}=8.9\\times10^{-3}$.<br>'
     +'<b>Check.</b> $N_{\\min}=1.5$ is not a whole number, and it should not be — it is an average over points that differ in how exposed they are. Getting a whole number here means the end points were counted as though they had neighbours on both sides.',
  err:'Using $N_{\\min}=2$ because each point has two neighbours. The end points have only one, and forgetting that overstates the error probability by a third.',
  teach:'Ask which of the four symbols is the safest to send. The outer two: they can only be mistaken in one direction, so they are wrong half as often as the inner two. The average is what $N_{\\min}$ records.' },

{ id:'D5-10', module:'M5', type:'mpam', src:'CH9 s.86',
  stem:'Compare $4$-PAM and $8$-PAM at the same average symbol energy.',
  parts:['Give the ratio of their squared minimum distances.',
         'Give the cost of the move in decibels.'],
  sol:'<b>Given.</b> Two PAM sizes at equal energy.<br>'
     +'<b>Find.</b> How much the distance falls.<br>'
     +'<b>Method.</b> $d_{\\min}^{2}=12E_{s}/(M^{2}-1)$, so only $M^{2}-1$ changes.<br>'
     +'<b>Solution — (a).</b> $\\dfrac{d_{8}^{2}}{d_{4}^{2}}=\\dfrac{M_4^{2}-1}{M_8^{2}-1}=\\dfrac{15}{63}=0.238$.<br>'
     +'<b>Solution — (b).</b> $10\\log_{10}(63/15)=6.23$ dB. Doubling the number of levels costs about six decibels, and that figure holds for every doubling once $M$ is not small.<br>'
     +'<b>Check.</b> For large $M$ the ratio approaches $M_4^{2}/M_8^{2}=1/4$ exactly, which is $6.02$ dB. The extra $0.2$ dB here is the $-1$ in $M^{2}-1$ still mattering at these small sizes.',
  err:'Using $M$ rather than $M^{2}-1$. That gives $3$ dB instead of $6$, and it is the difference between a design that closes and one that does not.',
  teach:'Six decibels for one extra bit a symbol is the price of packing points onto a line. Question D5-13 asks the same thing of QAM, where two dimensions are available, and the answer is very different — that comparison is the point of both questions.' },

{ id:'D5-11', module:'M5', type:'mpam', src:'CH9 s.85',
  stem:'An $8$-PAM constellation is used.',
  parts:['Give $N_{\\min}$.',
         'Say which symbols contribute least to the error probability, and why.'],
  sol:'<b>Given.</b> Eight equally spaced points on a line.<br>'
     +'<b>Find.</b> The average neighbour count.<br>'
     +'<b>Method.</b> Count the neighbours of each point at the minimum distance and average.<br>'
     +'<b>Solution — (a).</b> Six interior points have two neighbours each and the two end points have one, so $N_{\\min}=\\dfrac{6\\times2+2\\times1}{8}=\\dfrac{14}{8}=1.75$, which agrees with $2(M-1)/M$.<br>'
     +'<b>Solution — (b).</b> The two end points. Their decision regions run off to infinity on the outside, so noise pushing them outward never causes an error — only noise pushing them inward can.<br>'
     +'<b>Check.</b> As $M$ grows, $2(M-1)/M$ approaches $2$: the two end points become a smaller and smaller fraction of the constellation, and their advantage stops mattering.',
  err:'Counting the neighbours of one interior point and using that for all of them. The whole reason $N_{\\min}$ is defined as an average is that the points are not alike.',
  teach:'This is the same idea as the corner points of a QAM square being the safest, and for the same reason: a point on the outside of a constellation has fewer directions in which it can be mistaken.' },

{ id:'D5-12', module:'M5', type:'qam', src:'CH9 s.92',
  stem:'A $16$-QAM system operates at $E_{s}/N_0=15$ dB.',
  parts:['Give $d_{\\min}$ in terms of $E_{s,\\text{avg}}$.',
         'Give $N_{\\min}$.',
         'Give the symbol error probability.'],
  sol:'<b>Given.</b> A four-by-four square grid at $15$ dB.<br>'
     +'<b>Find.</b> $d_{\\min}$, $N_{\\min}$, $P_e$.<br>'
     +'<b>Method.</b> Use $E_{s,\\text{avg}}=(M-1)d^{2}/6$ for square QAM, then count neighbours by position.<br>'
     +'<b>Solution — (a).</b> $d_{\\min}^{2}=\\dfrac{6E_{s,\\text{avg}}}{M-1}=\\dfrac{6E_{s}}{15}=0.4E_{s}$.<br>'
     +'<b>Solution — (b).</b> Four corner points have two neighbours, eight edge points have three, and four interior points have four: $N_{\\min}=\\dfrac{4(2)+8(3)+4(4)}{16}=\\dfrac{48}{16}=3$.<br>'
     +'<b>Solution — (c).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=0.2\\,\\dfrac{E_s}{N_0}=0.2\\times31.62=6.32$, so $P_e\\approx 3\\,Q(2.515)=3\\times5.95\\times10^{-3}=1.79\\times10^{-2}$.<br>'
     +'<b>Check.</b> Count the neighbour total another way: the grid has $2\\times4\\times3=24$ neighbouring pairs, each counted twice, so $48$ ordered pairs over $16$ points gives $3$. The two counts agree.',
  err:'Using $N_{\\min}=4$ from the interior points. Twelve of the sixteen points are on the boundary of the square, so the average is well below four.',
  teach:'Ask for $N_{\\min}$ of $64$-QAM before computing it. The interior grows relative to the edge, so the answer must be between $3$ and $4$ — it is $3.5$. Predicting the range before doing the arithmetic is a habit worth having.' },

{ id:'D5-13', module:'M5', type:'qam', src:'CH9 s.93',
  stem:'Compare $16$-QAM with $16$-PAM at the same average symbol energy. Both carry four bits a symbol.',
  parts:['Give the squared minimum distance of each in terms of $E_{s}$.',
         'Give the advantage of QAM in decibels.'],
  sol:'<b>Given.</b> Sixteen points arranged on a square grid and on a line, at equal energy.<br>'
     +'<b>Find.</b> The two distances and the gap.<br>'
     +'<b>Method.</b> One formula each: $6E_s/(M-1)$ for square QAM, $12E_s/(M^{2}-1)$ for PAM.<br>'
     +'<b>Solution — (a).</b> QAM: $6E_s/15=0.400E_s$. PAM: $12E_s/255=0.0471E_s$.<br>'
     +'<b>Solution — (b).</b> The ratio is $0.400/0.0471=8.5$, and $10\\log_{10}8.5=9.29$ dB.<br>'
     +'<b>Check.</b> Both carry four bits a symbol and both use the same average power, so the entire difference is the arrangement of the points. Nine decibels is an enormous return for using the second dimension that was there all along.',
  err:'Comparing at the same $d_{\\min}$ instead of the same energy. At the same spacing the two constellations do have the same error probability — but PAM then needs eight and a half times the power, which is the same fact stated backwards.',
  teach:'This one number is the reason QAM exists. Ask what would happen with three dimensions: the same argument would favour a cubic lattice again, and that is exactly what coded modulation does over several symbol periods.' },

{ id:'D5-14', module:'M5', type:'qam', src:'CH9 s.92',
  stem:'A $64$-QAM constellation is an eight-by-eight square grid.',
  parts:['Give the number of corner, edge and interior points.',
         'Give $N_{\\min}$.'],
  sol:'<b>Given.</b> An eight-by-eight grid.<br>'
     +'<b>Find.</b> The neighbour count by position and its average.<br>'
     +'<b>Method.</b> Count the three kinds of position, then average their neighbour counts.<br>'
     +'<b>Solution — (a).</b> Four corners; the edges have $6$ points on each of the four sides, so $24$ edge points; the interior is a six-by-six block, so $36$ points. Total $4+24+36=64$.<br>'
     +'<b>Solution — (b).</b> $N_{\\min}=\\dfrac{4(2)+24(3)+36(4)}{64}=\\dfrac{8+72+144}{64}=\\dfrac{224}{64}=3.5$.<br>'
     +'<b>Check.</b> Count the neighbouring pairs instead: $2\\times8\\times7=112$ pairs, each giving two ordered pairs, so $224/64=3.5$. The two routes agree, and the second is quicker for any grid.',
  err:'Counting eight points along each side and getting $32$ edge points, which double-counts the corners. Each side contributes $8-2=6$ points that are not corners.',
  teach:'The $3.5$ against the $3$ of $16$-QAM says the constellation is becoming more like an infinite lattice, where every point has four neighbours. The interior always wins in the end.' },

{ id:'D5-15', module:'M5', type:'compare', src:'CH9 s.97',
  stem:'An $8$-FSK system uses eight orthogonal waveforms at $E_s/N_0=10$ dB.',
  parts:['Give the distance between any two constellation points.',
         'Give $N_{\\min}$.',
         'Give an estimate of the symbol error probability.'],
  sol:'<b>Given.</b> Eight orthogonal waveforms at $10$ dB.<br>'
     +'<b>Find.</b> $d$, $N_{\\min}$, $P_e$.<br>'
     +'<b>Method.</b> Orthogonal signals need one basis function each, so the constellation is eight points on eight axes, each at distance $\\sqrt{E_s}$ from the origin.<br>'
     +'<b>Solution — (a).</b> Any two points are at a right angle, so $d=\\sqrt{2E_s}$ — for <em>every</em> pair, not just the closest.<br>'
     +'<b>Solution — (b).</b> Every point is at the minimum distance from all the others, so $N_{\\min}=M-1=7$.<br>'
     +'<b>Solution — (c).</b> $\\dfrac{d^{2}}{2N_0}=\\dfrac{E_s}{N_0}=10$, so $P_e\\approx 7\\,Q(3.162)=7\\times7.83\\times10^{-4}=5.48\\times10^{-3}$.<br>'
     +'<b>Check.</b> Here the union bound is a genuine bound and not just the nearest neighbours, because there are no distant points to leave out — every pair is at the same distance.',
  err:'Using $N_{\\min}=2$ out of habit from PSK. In $M$-FSK all $M-1$ other points are equally close, and that is what the extra dimensions buy.',
  teach:'The distance $\\sqrt{2E_s}$ does not depend on $M$ at all, which is the striking part. Adding waveforms costs nothing in distance — but each new waveform needs its own frequency slot, so the price is paid in bandwidth instead.' },

{ id:'D5-16', module:'M5', type:'compare', src:'CH9 s.99',
  stem:'Compare $16$-QAM and $16$-FSK on how many bits per second each carries in one hertz of bandwidth. Take the bandwidth of a QAM signal as $1/T_s$ and that of $M$-FSK as $M/(2T_s)$.',
  parts:['Give the bits per second per hertz of $16$-QAM.',
         'Give the same for $16$-FSK.',
         'Say what each scheme pays for what it gets.'],
  sol:'<b>Given.</b> Two schemes at $M=16$, with the stated bandwidths.<br>'
     +'<b>Find.</b> The spectral efficiency of each.<br>'
     +'<b>Method.</b> Bits per symbol divided by the bandwidth a symbol occupies.<br>'
     +'<b>Solution — (a).</b> Four bits every $T_s$ into $1/T_s$ hertz: $4$ bits per second per hertz.<br>'
     +'<b>Solution — (b).</b> Four bits every $T_s$ into $16/(2T_s)=8/T_s$ hertz: $4/8=0.5$ bits per second per hertz — eight times worse.<br>'
     +'<b>Solution — (c).</b> QAM keeps the bandwidth fixed as $M$ grows and pays in energy, because the points crowd together. FSK keeps the distance between points fixed and pays in bandwidth, because each waveform needs its own frequency.<br>'
     +'<b>Check.</b> QAM efficiency is $\\log_2 M$ and grows with $M$; FSK efficiency is $2\\log_2 M/M$ and falls with it. At $M=2$ the two are $1$ and $1$ — the schemes only part company once $M$ grows.',
  err:'Treating bandwidth as a property of the scheme alone. It is set by the symbol rate as well, and the comparison only means anything with the symbol rate held fixed.',
  teach:'Ask which one a deep-space link would use and which one a mobile phone would use. Deep space has bandwidth to spare and no energy; a phone has the opposite. The right answer depends entirely on which resource is scarce.' },

{ id:'D5-17', module:'M5', type:'compare', src:'CH9 s.94',
  stem:'A link must achieve a symbol error probability of $10^{-4}$.',
  parts:['Give the $E_b/N_0$ in decibels that QPSK needs.',
         'Give the $E_b/N_0$ in decibels that $16$-QAM needs.',
         'Say what the extra energy buys.'],
  sol:'<b>Given.</b> A target symbol error probability for two schemes.<br>'
     +'<b>Find.</b> The energy per bit each needs.<br>'
     +'<b>Method.</b> Divide out $N_{\\min}$, invert the $Q$, then convert from symbol energy to bit energy.<br>'
     +'<b>Solution — (a).</b> QPSK has $N_{\\min}=2$, so $Q(x)=5\\times10^{-5}$ and $x=3.891$. The argument is $\\sqrt{E_s/N_0}$, so $E_s/N_0=15.14$, which is $11.80$ dB. Two bits a symbol, so $E_b/N_0=11.80-3.01=8.79$ dB.<br>'
     +'<b>Solution — (b).</b> $16$-QAM has $N_{\\min}=3$, so $Q(x)=3.33\\times10^{-5}$ and $x=3.988$. The argument is $\\sqrt{0.2E_s/N_0}$, so $E_s/N_0=79.6$, which is $19.01$ dB. Four bits a symbol, so $E_b/N_0=19.01-6.02=12.98$ dB.<br>'
     +'<b>Solution — (c).</b> About $4.2$ dB more energy per bit, in exchange for twice as many bits in the same bandwidth.<br>'
     +'<b>Check.</b> The per-symbol figures differ by $7.2$ dB and the per-bit figures by $4.2$ dB. The $3$ dB between them is the extra bit a symbol paying part of its own way.',
  err:'Inverting $Q$ on the target directly instead of on the target divided by $N_{\\min}$. It looks like a small change but it moves the answer by several tenths of a decibel, and in the wrong direction.',
  teach:'This is the calculation behind every adaptive modulation scheme. When the signal is strong the link uses $16$-QAM and carries twice the data; when it weakens it drops to QPSK and keeps the errors down. Both settings hit the same error target.' },

/* ---- full-length ----------------------------------------------------- */

{ id:'D5-18', module:'M5', type:'full', src:'Final Q3',
  stem:'A system uses $16$-QAM at a symbol rate of $10^{6}$ symbols per second with $E_s/N_0=18$ dB.',
  parts:['Give the bit rate.',
         'Give $d_{\\min}^{2}$ in terms of $E_s$, and $N_{\\min}$.',
         'Give the symbol error probability.',
         'Give the approximate bit error probability, assuming Gray coding.'],
  sol:'<b>Given.</b> $16$-QAM, $10^{6}$ symbols a second, $18$ dB.<br>'
     +'<b>Find.</b> Rate, geometry, $P_e$, $P_b$.<br>'
     +'<b>Method.</b> Rate first, then the constellation, then one $Q$, then divide by the bits a symbol.<br>'
     +'<b>Solution — (a).</b> Four bits a symbol at $10^{6}$ symbols a second is $4\\times10^{6}$ bits a second.<br>'
     +'<b>Solution — (b).</b> $d_{\\min}^{2}=6E_s/15=0.4E_s$ and $N_{\\min}=3$, as in D5-12.<br>'
     +'<b>Solution — (c).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=0.2\\times63.1=12.62$, so $P_e\\approx3Q(3.553)=3\\times1.91\\times10^{-4}=5.72\\times10^{-4}$.<br>'
     +'<b>Solution — (d).</b> With Gray coding a symbol error almost always changes one bit out of four, so $P_b\\approx P_e/4=1.43\\times10^{-4}$.<br>'
     +'<b>Check.</b> Three decibels more than D5-12 took the symbol error from $1.8\\times10^{-2}$ to $5.7\\times10^{-4}$ — a factor of thirty for a factor of two in power. The curve is steep here, which is exactly where a system is designed to sit.',
  err:'Dividing $P_e$ by $16$ rather than by $4$. The divisor is the number of bits a symbol carries, not the number of symbols.',
  teach:'Part (d) is an approximation twice over: it assumes the error goes to a neighbour, and it assumes the neighbours are Gray-labelled. Both are good at this error rate and both fail at low signal-to-noise ratio, which is worth saying out loud when the answer is written down.' },

{ id:'D5-19', module:'M5', type:'full', src:'Final Q3',
  stem:'A designer must send three bits a symbol and is choosing between $8$-PSK and $8$-PAM at the same average symbol energy.',
  parts:['Give $d_{\\min}^{2}$ for each in terms of $E_s$.',
         'Give $N_{\\min}$ for each.',
         'Give the symbol error probability of each at $E_s/N_0=15$ dB.',
         'Say which to choose and why.'],
  sol:'<b>Given.</b> Two eight-point constellations at equal energy.<br>'
     +'<b>Find.</b> The geometry and the error probability of each.<br>'
     +'<b>Method.</b> One formula each, then the same $Q$ twice.<br>'
     +'<b>Solution — (a).</b> $8$-PSK: $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/8)$, so $d_{\\min}^{2}=0.586E_s$. $8$-PAM: $d_{\\min}^{2}=12E_s/63=0.190E_s$.<br>'
     +'<b>Solution — (b).</b> $8$-PSK has $N_{\\min}=2$; $8$-PAM has $N_{\\min}=2(7)/8=1.75$.<br>'
     +'<b>Solution — (c).</b> At $15$ dB, $E_s/N_0=31.62$. PSK: $\\sqrt{0.586\\times31.62/2}=\\sqrt{9.27}=3.044$, so $P_e\\approx2Q(3.044)=2.33\\times10^{-3}$. PAM: $\\sqrt{0.190\\times31.62/2}=\\sqrt{3.01}=1.735$, so $P_e\\approx1.75\\,Q(1.735)=1.75\\times0.0414=7.24\\times10^{-2}$.<br>'
     +'<b>Solution — (d).</b> $8$-PSK, by a factor of thirty. Its points are spread over a circle in two dimensions; PAM crowds all eight onto one line, and the smaller $N_{\\min}$ nowhere near makes up for it.<br>'
     +'<b>Check.</b> The distance ratio is $0.586/0.190=3.08$, or $4.9$ dB in favour of PSK. That is the same kind of advantage QAM has over PAM in D5-13, and for the same reason: a second dimension.',
  err:'Deciding on $N_{\\min}$ alone. It sits outside the $Q$ and scales the answer by less than a factor of two; the distance sits inside and moves it by orders of magnitude.',
  teach:'Both parts of the comparison are worth writing on one line: PSK wins on distance and loses on neighbour count, and distance wins. That ordering — geometry first, counting second — decides nearly every question in this module.' },

{ id:'D5-20', module:'M5', type:'full', src:'Final Q3',
  stem:'A channel allows $E_b/N_0=10$ dB and the link must reach a symbol error probability of $10^{-3}$.',
  parts:['Say whether QPSK meets the requirement.',
         'Say whether $8$-PSK meets it.',
         'Say whether $16$-QAM meets it.',
         'Choose the scheme that carries the most bits and still meets it.'],
  sol:'<b>Given.</b> $E_b/N_0=10$ dB, target $P_e=10^{-3}$.<br>'
     +'<b>Find.</b> Which schemes clear the target at this energy.<br>'
     +'<b>Method.</b> Convert to $E_s/N_0$ for each scheme with $E_s=(\\log_2 M)E_b$, then apply that scheme\'s formula. $E_b/N_0=10$ means $E_b/N_0=10$ as a ratio.<br>'
     +'<b>Solution — (a).</b> QPSK: $E_s/N_0=2\\times10=20$. The argument is $\\sqrt{2\\times20}\\sin(\\pi/4)=\\sqrt{40}\\times0.7071=4.472$, so $P_e\\approx2Q(4.472)=7.75\\times10^{-6}$. It meets the target with room to spare.<br>'
     +'<b>Solution — (b).</b> $8$-PSK: $E_s/N_0=3\\times10=30$. The argument is $\\sqrt{60}\\times0.3827=2.965$, so $P_e\\approx2Q(2.965)=3.03\\times10^{-3}$. It fails, by a factor of three.<br>'
     +'<b>Solution — (c).</b> $16$-QAM: $E_s/N_0=4\\times10=40$. The argument is $\\sqrt{0.2\\times40}=2.828$, so $P_e\\approx3Q(2.828)=7.03\\times10^{-3}$. It fails, by a factor of seven.<br>'
     +'<b>Solution — (d).</b> QPSK, at two bits a symbol. Nothing larger clears the target at this energy.<br>'
     +'<b>Check.</b> The three answers rise steadily with $M$ — $7.8\\times10^{-6}$, $3.0\\times10^{-3}$, $7.0\\times10^{-3}$ — which is what a fixed energy per bit must give: more bits a symbol always means points closer together.',
  err:'Working the whole question at a fixed $E_s/N_0$. The channel fixes the energy per bit, so every scheme gets a different symbol energy, and that conversion is where the comparison is decided.',
  teach:'The gap between QPSK and $8$-PSK is the interesting one: QPSK beats the target by more than two orders of magnitude and $8$-PSK misses it. Ask how much extra energy would rescue $8$-PSK — about $0.9$ dB — and the question turns into a design decision instead of an arithmetic one.' }

]);

window.DRILL_M5 = [

{ id:'m5-drill', module:'M5', nav:'Module 5 · practice questions',
  title:'Module 5 — practice questions',
  objective:'Twenty open-ended questions with worked solutions.',
  keywords:'practice questions module 5 bpsk bfsk bask psk pam qam fsk error probability comparison',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 5 · Practice D5-01 … D5-20'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question on paper before opening its solution. Every solution ends with a <b>Check</b> step. In this module the cheap checks are: state once whether the energy is per symbol or per bit and convert only once, $N_{\\min}$ is an average and need not be a whole number, a general formula must reproduce the binary case at $M=2$, and any scheme carrying more bits a symbol at the same energy per bit must come out worse.'},
  {t:'rule', short:true},
  {t:'drill', module:'M5'}
]}

];
})();
