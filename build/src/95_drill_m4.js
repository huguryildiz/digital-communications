/* ==========================================================================
   Practice questions — Module 4.

   One of the six shapes comes from the question tables: Final Q3 gives an
   M-ary constellation, asks for the decision regions, and then asks for the
   symbol error probability by the nearest-neighbour approximation. That
   question is shared with Module 5, which supplies the modulation schemes; the
   geometry and the bound are this module's part of it.

   The other five come from the worked examples in the lecture material.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

CONTENT.DRILLTYPES.M4 = [
  { k:'rule', name:'Applying the decision rule',
    asks:'An observation and a signal set are given. Say which signal the receiver decides, with equal or with unequal priors.',
    method:['With equal priors, compute the distance from the observation to every signal point and take the smallest. Squared distances are enough — the square root changes nothing.',
            'With unequal priors, subtract the handicap $N_0\\ln P(\\mathbf{s}_i)$ from each squared distance first. The term is positive and larger for the more likely symbol, so that symbol wins from further away.',
            'If the signals have equal energy and equal priors, the largest correlation $\\mathbf{r}\\cdot\\mathbf{s}_i$ gives the same answer with less arithmetic.'],
    go:'m4-mindist' },

  { k:'regions', name:'Drawing the decision regions',
    asks:'A constellation is given. Describe or draw the region belonging to each point.',
    method:['Every boundary is the perpendicular bisector of the line joining two points. Draw them for the neighbouring pairs; distant pairs contribute no boundary.',
            'With equal priors the bisector crosses at the midpoint. With unequal priors it moves away from the more likely point, and its region grows.',
            'Points on the outside of a constellation have regions that run off to infinity; points in the middle have bounded ones and make more errors.'],
    go:'m4-regions' },

  { k:'pairwise', name:'A pairwise error probability',
    asks:'Two signal points are given. Find the probability that one is mistaken for the other.',
    method:['Find the distance $d$ between the two points, or the energy of their difference, which is $d^{2}$.',
            'The answer is $Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$, and nothing else about the points enters it.',
            'For antipodal binary, $d^{2}=4E_b$ and this is $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$; for on-off or orthogonal, $d^{2}=2E_b$ and it is $Q\\!\\left(\\sqrt{E_b/N_0}\\right)$.'],
    go:'m4-binary' },

  { k:'union', name:'The union bound in its four forms',
    asks:'A constellation and a noise level are given. Bound or estimate the symbol error probability.',
    method:['General form: one $Q$ for every other point, averaged over the transmitted point. Use it when the constellation is small enough to list.',
            'Intelligent form: keep only the neighbours whose bisectors give the decision region a face. Still an upper bound, and tighter than the general one.',
            'Nearest-neighbour form: $P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$, where $N_{\\min}$ is the <em>average</em> number of points at the minimum distance. This is the one used in practice.',
            'Minimum-distance form: $P_e\\le(M-1)Q(\\cdot)$. It is loose by design and needs only $M$ and $d_{\\min}$.'],
    go:'m4-dmin' },

  { k:'design', name:'Comparing constellations at equal energy',
    asks:'Two constellations are given. Compare their minimum distance, their bits per symbol, and their error probability.',
    method:['Normalise both to the same average energy first, or the comparison is about power rather than geometry.',
            'Average energy is $\\frac{1}{M}\\sum_i\\|\\mathbf{s}_i\\|^{2}$ with equal priors, and $E_b=E_{\\text{avg}}/\\log_2 M$.',
            'The constellation with the larger $d_{\\min}$ at the same $E_{\\text{avg}}$ wins, and $N_{\\min}$ only scales the answer.'],
    go:'m4-dmin' },

  { k:'full', name:'A full-length question combining several of the shapes above',
    asks:'One constellation, three or four parts: draw the regions, find the distances, apply the bound, and compare with something.',
    method:['Draw the constellation to scale before anything else. Both the regions and the distances are read off that drawing.',
            'Keep the energy normalisation straight throughout: state whether the quantity given is $E_s$ or $E_b$, and convert once.',
            'Check the final number against a simpler case you know: QPSK should come out at the binary answer, and a constellation with more points at the same energy should always be worse.'] }
];

CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- single-skill ---------------------------------------------------- */

{ id:'D4-01', module:'M4', type:'rule', src:'CH9 s.34',
  stem:'A receiver with equally likely signals observes $\\mathbf{r}=(0.8,\\,-0.3)$. The signal points are $\\mathbf{s}_1=(1,1)$, $\\mathbf{s}_2=(-1,1)$, $\\mathbf{s}_3=(-1,-1)$ and $\\mathbf{s}_4=(1,-1)$.',
  parts:['Give the squared distance to each point.',
         'Say which signal the receiver decides.'],
  sol:'<b>Given.</b> One observation and four equally likely points.<br>'
     +'<b>Find.</b> The four squared distances and the decision.<br>'
     +'<b>Method.</b> Equal priors, so the rule is minimum distance. Squared distances are enough — the square root is increasing and cannot change which is smallest.<br>'
     +'<b>Solution — (a).</b> $\\|\\mathbf{r}-\\mathbf{s}_1\\|^{2}=(0.8-1)^{2}+(-0.3-1)^{2}=0.04+1.69=1.73$. Similarly $\\|\\mathbf{r}-\\mathbf{s}_2\\|^{2}=3.24+1.69=4.93$, $\\|\\mathbf{r}-\\mathbf{s}_3\\|^{2}=3.24+0.49=3.73$, and $\\|\\mathbf{r}-\\mathbf{s}_4\\|^{2}=0.04+0.49=0.53$.<br>'
     +'<b>Solution — (b).</b> The smallest is $0.53$, so the receiver decides $\\mathbf{s}_4$.<br>'
     +'<b>Check.</b> The observation has a positive first coordinate and a negative second, so it lies in the fourth quadrant — and for this constellation the four regions <em>are</em> the four quadrants. The arithmetic and the picture agree, and for this constellation the picture is faster.',
  err:'Taking square roots before comparing. It is extra work and changes nothing, because the square root is increasing.',
  teach:'Worth asking for the answer from the picture first and then confirming with the arithmetic. For a symmetric constellation the picture is always quicker, and knowing that is part of using the rule.' },

{ id:'D4-02', module:'M4', type:'rule', src:'CH9 s.33',
  stem:'A binary receiver has $\\mathbf{s}_0=-1$ and $\\mathbf{s}_1=+1$ on one axis, with $N_0=0.5$. The priors are $P(\\mathbf{s}_0)=0.8$ and $P(\\mathbf{s}_1)=0.2$. The observation is $r=0.15$.',
  parts:['Give the MAP metric for each signal.',
         'Say which signal the receiver decides, and what an equal-prior receiver would have decided.'],
  sol:'<b>Given.</b> Two points, unequal priors, one observation.<br>'
     +'<b>Find.</b> The two metrics and the decision.<br>'
     +'<b>Method.</b> The MAP rule minimises $\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)$.<br>'
     +'<b>Solution — (a).</b> For $\\mathbf{s}_0$: $(0.15+1)^{2}-0.5\\ln 0.8=1.3225+0.1116=1.434$. For $\\mathbf{s}_1$: $(0.15-1)^{2}-0.5\\ln 0.2=0.7225+0.8047=1.527$.<br>'
     +'<b>Solution — (b).</b> The smaller metric wins, so the receiver decides $\\mathbf{s}_0$. An equal-prior receiver compares $1.3225$ against $0.7225$ and decides $\\mathbf{s}_1$ — the opposite answer.<br>'
     +'<b>Check.</b> The boundary sits where the two metrics are equal, at $r=\\frac{N_0}{4}\\ln\\frac{P(\\mathbf{s}_0)}{P(\\mathbf{s}_1)}=\\frac{0.5}{4}\\ln 4=0.173$. The observation $0.15$ is below it, so $\\mathbf{s}_0$ wins — which is what the metrics said.',
  err:'Adding the prior term instead of subtracting it. That gives $\\mathbf{s}_1$, and shrinks the region of the more likely symbol, which is the wrong way round.',
  teach:'The two answers differing is the whole point. Ask what would happen at $N_0=0.05$: the boundary moves to $0.017$, the observation is above it, and both receivers agree again — the priors matter less as the noise falls.' },

{ id:'D4-03', module:'M4', type:'pairwise', src:'CH9 s.58',
  stem:'Two signal points are $2.4$ apart and the noise has two-sided density $N_0/2$ with $N_0=0.2$.',
  parts:['Give the argument of $Q$ for the pairwise error probability.',
         'Give the probability.'],
  sol:'<b>Given.</b> $d=2.4$, $N_0=0.2$.<br>'
     +'<b>Find.</b> $P(\\mathbf{s}_k\\to\\mathbf{s}_j)$.<br>'
     +'<b>Method.</b> The pairwise error is $Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$ and nothing else about the two points matters.<br>'
     +'<b>Solution — (a).</b> $\\dfrac{d^{2}}{2N_0}=\\dfrac{5.76}{0.4}=14.4$, so the argument is $\\sqrt{14.4}=3.795$.<br>'
     +'<b>Solution — (b).</b> $Q(3.795)=7.4\\times10^{-5}$.<br>'
     +'<b>Check.</b> Reading it the other way: the boundary is $d/2=1.2$ from either point, the noise standard deviation along that line is $\\sqrt{N_0/2}=0.316$, and $1.2/0.316=3.795$. The two routes are the same calculation written differently, and the second is the one to use when the geometry is in front of you.',
  err:'Using $\\sqrt{d^{2}/N_0}$ and losing the two. The factor comes from the noise variance being $N_0/2$ per axis, and dropping it makes every answer optimistic.',
  teach:'Ask what $d$ would have to be to reach $10^{-6}$. Solving $Q(x)=10^{-6}$ gives $x=4.753$, so $d^{2}=2N_0x^{2}=9.04$ and $d=3.0$ — a $25\\%$ increase in distance for two orders of magnitude in error rate.' },

{ id:'D4-04', module:'M4', type:'pairwise', src:'CH9 s.54',
  stem:'A binary antipodal system operates at $E_b/N_0=8$ dB.',
  parts:['Give the distance between the two signal points in terms of $E_b$.',
         'Give the bit error probability.',
         'Give the answer if the same two waveforms were made orthogonal instead of antipodal, at the same $E_b$.'],
  sol:'<b>Given.</b> Antipodal binary at $8$ dB.<br>'
     +'<b>Find.</b> $d$, $P_b$, and the orthogonal comparison.<br>'
     +'<b>Method.</b> Distance first, then one $Q$.<br>'
     +'<b>Solution — (a).</b> The points are at $\\pm\\sqrt{E_b}$, so $d=2\\sqrt{E_b}$ and $d^{2}=4E_b$.<br>'
     +'<b>Solution — (b).</b> $\\dfrac{d^{2}}{2N_0}=\\dfrac{4E_b}{2N_0}=\\dfrac{2E_b}{N_0}$. At $8$ dB, $E_b/N_0=6.31$, so $P_b=Q(\\sqrt{12.62})=Q(3.553)=1.91\\times10^{-4}$.<br>'
     +'<b>Solution — (c).</b> Orthogonal points are at right angles, so $d^{2}=E_b+E_b=2E_b$, half as much. Then $P_b=Q(\\sqrt{E_b/N_0})=Q(2.512)=6.00\\times10^{-3}$, thirty times worse.<br>'
     +'<b>Check.</b> The squared distance halved, so the argument fell by $\\sqrt{2}$ — the $3$ dB of Module 2, arrived at here by measuring the two constellations instead of integrating two densities.',
  err:'Taking the orthogonal distance to be $\\sqrt{E_b}$, the length of one signal, rather than the distance between two perpendicular points of that length. Pythagoras gives $\\sqrt{2E_b}$.',
  teach:'Ask for the extra energy orthogonal signalling needs to match antipodal: exactly a factor of two, $3$ dB, and it is visible in the squared distances without any $Q$.' },

{ id:'D4-05', module:'M4', type:'union', src:'CH9 s.60',
  stem:'A constellation has $M=8$ points with $d_{\\min}=1.2$ and an average of $N_{\\min}=2$ points at that distance. The noise has $N_0=0.1$.',
  parts:['Give the nearest-neighbour estimate of the symbol error probability.',
         'Give the minimum-distance bound.',
         'Say which to quote and why.'],
  sol:'<b>Given.</b> $M=8$, $d_{\\min}=1.2$, $N_{\\min}=2$, $N_0=0.1$.<br>'
     +'<b>Find.</b> The two numbers and a judgement.<br>'
     +'<b>Method.</b> Both are the same $Q$ with a different count in front; compute the $Q$ once.<br>'
     +'<b>Solution.</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{1.44}{0.2}=7.2$, so $Q(\\sqrt{7.2})=Q(2.683)=3.65\\times10^{-3}$. Then (a) $P_e\\approx2(3.65\\times10^{-3})=7.30\\times10^{-3}$ and (b) $P_e\\le7(3.65\\times10^{-3})=2.55\\times10^{-2}$.<br>'
     +'<b>Solution — (c).</b> Quote the nearest-neighbour estimate. The minimum-distance bound pretends all seven other points sit at $d_{\\min}$, and in an eight-point constellation most of them are much further away and contribute almost nothing. The bound is safe but is three and a half times too large.<br>'
     +'<b>Check.</b> The two differ by exactly $7/2$, the ratio of the two counts, at every noise level — because the $Q$ is the same in both. Neither moves the curve sideways, so the signal-to-noise ratio needed for a target error rate is nearly the same whichever is used.',
  err:'Using $M=8$ rather than $M-1=7$ in the minimum-distance bound. There are seven other points, not eight.',
  teach:'The observation that the two forms differ by a constant factor, never by a shift, is worth stating explicitly. It is why the choice between them matters much less than getting $d_{\\min}$ right.' },

{ id:'D4-06', module:'M4', type:'union', src:'CH9 s.59',
  stem:'Three equally likely signal points sit at $\\mathbf{s}_1=(0,\\,1)$, $\\mathbf{s}_2=(1,\\,0)$ and $\\mathbf{s}_3=(-1,\\,0)$, with $N_0=0.08$.',
  parts:['Give the three pairwise distances.',
         'Give the general union bound on the symbol error probability.'],
  sol:'<b>Given.</b> Three points and a noise density.<br>'
     +'<b>Find.</b> The distances and the bound.<br>'
     +'<b>Method.</b> One $Q$ per ordered pair, averaged over the transmitted point. With three points that is six terms, and symmetry reduces the work.<br>'
     +'<b>Solution — (a).</b> $d_{12}=\\sqrt{1+1}=\\sqrt{2}=1.414$, $d_{13}=\\sqrt{2}=1.414$, and $d_{23}=2$.<br>'
     +'<b>Solution — (b).</b> From $\\mathbf{s}_1$ the two terms use $d=\\sqrt{2}$; from $\\mathbf{s}_2$ one uses $\\sqrt{2}$ and one uses $2$; from $\\mathbf{s}_3$ the same. Averaging, $$P_e\\le\\frac{1}{3}\\Bigl[4\\,Q\\!\\left(\\sqrt{\\tfrac{2}{0.16}}\\right)+2\\,Q\\!\\left(\\sqrt{\\tfrac{4}{0.16}}\\right)\\Bigr].$$ With $Q(3.536)=2.03\\times10^{-4}$ and $Q(5)=2.87\\times10^{-7}$, this is $\\frac{1}{3}[8.12\\times10^{-4}+5.7\\times10^{-7}]=2.71\\times10^{-4}$.<br>'
     +'<b>Check.</b> The nearest-neighbour form uses $d_{\\min}=\\sqrt{2}$ and $N_{\\min}=4/3$, giving $\\frac{4}{3}(2.03\\times10^{-4})=2.71\\times10^{-4}$ — the same to three digits, because the far pair contributes a thousandth of the total.',
  err:'Counting each pair once rather than twice. The sum is over ordered pairs: $\\mathbf{s}_2$ mistaken for $\\mathbf{s}_3$ and $\\mathbf{s}_3$ mistaken for $\\mathbf{s}_2$ are different events.',
  teach:'Computing both forms and finding them equal to three digits is the fastest way to make the nearest-neighbour approximation believable.' },

{ id:'D4-07', module:'M4', type:'design', src:'Final Q3',
  stem:'Two constellations carry the same average symbol energy $E_s$: four points on a square at $(\\pm a,\\pm a)$, and four points on a circle of radius $\\rho$ at $90^{\\circ}$ intervals.',
  parts:['Give $a$ and $\\rho$ in terms of $E_s$.',
         'Give $d_{\\min}$ for each.',
         'Which performs better?'],
  sol:'<b>Given.</b> Two four-point constellations at the same average energy.<br>'
     +'<b>Find.</b> Their minimum distances and a comparison.<br>'
     +'<b>Method.</b> Fix the energies first, then measure.<br>'
     +'<b>Solution — (a).</b> Square: every point has $\\|\\mathbf{s}\\|^{2}=2a^{2}=E_s$, so $a=\\sqrt{E_s/2}$. Circle: $\\rho^{2}=E_s$, so $\\rho=\\sqrt{E_s}$.<br>'
     +'<b>Solution — (b).</b> Square: neighbours differ by $2a$ in one coordinate, so $d_{\\min}=2a=\\sqrt{2E_s}$. Circle: neighbours are $90^{\\circ}$ apart, so $d_{\\min}=\\rho\\sqrt{2}=\\sqrt{2E_s}$.<br>'
     +'<b>Solution — (c).</b> Identically. The two are the same four points rotated by $45^{\\circ}$, and a rotation changes no distance.<br>'
     +'<b>Check.</b> Both have $N_{\\min}=2$ as well, so even the multiplier agrees and the two error probabilities are equal term by term. Any question that seems to distinguish them is really asking about something outside this module — bandwidth, or how the points are mapped to bits.',
  err:'Comparing them at equal <em>peak</em> energy instead of equal average energy. The four points of each constellation all have the same energy here, so the two happen to agree, but in general the two normalisations give different answers.',
  teach:'Rotation invariance is worth stating as a rule: performance depends on distances, and distances survive rotation and translation of the whole constellation.' },

{ id:'D4-08', module:'M4', type:'design', src:'Final Q3',
  stem:'Square 16-QAM places its points at $(\\pm d/2,\\pm 3d/2)$ and the other sign combinations, so the spacing between neighbours is $d$. Its average symbol energy works out to $E_s=2.5\\,d^{2}$.',
  parts:['Give $d_{\\min}$ in terms of $E_s$.',
         'Give the average number of nearest neighbours.',
         'Give the nearest-neighbour estimate of $P_e$ at $E_s/N_0=15$ dB.'],
  sol:'<b>Given.</b> Sixteen points on a square grid of spacing $d$, with $E_s=2.5d^{2}$.<br>'
     +'<b>Find.</b> $d_{\\min}$, $N_{\\min}$ and $P_e$.<br>'
     +'<b>Method.</b> Convert the spacing to energy, count the neighbours by position, then one $Q$.<br>'
     +'<b>Solution — (a).</b> $d_{\\min}=d=\\sqrt{E_s/2.5}$.<br>'
     +'<b>Solution — (b).</b> Four corner points have $2$ neighbours, eight edge points have $3$, and four inner points have $4$: $$N_{\\min}=\\frac{4(2)+8(3)+4(4)}{16}=\\frac{48}{16}=3.$$<br>'
     +'<b>Solution — (c).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{E_s}{5N_0}$. At $15$ dB, $E_s/N_0=31.62$, so the ratio is $6.32$ and $Q(\\sqrt{6.32})=Q(2.515)=5.95\\times10^{-3}$. Then $P_e\\approx3(5.95\\times10^{-3})=1.79\\times10^{-2}$.<br>'
     +'<b>Check.</b> The minimum-distance bound would give $15(5.95\\times10^{-3})=8.9\\times10^{-2}$, five times larger and clearly too loose — in a sixteen-point grid most pairs are nowhere near the minimum distance. That gap is why the nearest-neighbour form exists.',
  err:'Taking $N_{\\min}=4$ because a grid point has four neighbours. Only the four interior points do; the twelve on the boundary have fewer, and the average is what the formula needs.',
  teach:'Counting the neighbours by position — corners, edges, interior — is the part students skip. Drawing the grid and marking the counts takes a minute and is the difference between $3$ and $4$.' },

{ id:'D4-09', module:'M4', type:'regions', src:'CH9 s.50',
  stem:'Three equally likely signal points lie on a line at $-2$, $0$ and $+2$.',
  parts:['Give the decision regions.',
         'Say which symbol is most often mistaken, and why.'],
  sol:'<b>Given.</b> Three points on a line, equally likely.<br>'
     +'<b>Find.</b> The regions and the weakest symbol.<br>'
     +'<b>Method.</b> Boundaries at the midpoints between neighbouring points.<br>'
     +'<b>Solution — (a).</b> The midpoints are $-1$ and $+1$, so $R_1=(-\\infty,-1)$, $R_2=(-1,1)$ and $R_3=(1,\\infty)$.<br>'
     +'<b>Solution — (b).</b> The middle one. It has a boundary on each side, so noise in either direction can carry it out of its region, while each outer point can only be lost in one direction. Its error probability is $2Q(1/\\sigma)$ against $Q(1/\\sigma)$ for the others.<br>'
     +'<b>Check.</b> Averaging: $P_e=\\frac{1}{3}\\bigl[Q+2Q+Q\\bigr]=\\frac{4}{3}Q(1/\\sigma)$, which is exactly $N_{\\min}Q$ with $N_{\\min}=4/3$ — the average number of neighbours over the three points, $\\frac{1+2+1}{3}$.',
  err:'Giving all three symbols the same error probability because the spacing is uniform. The spacing is uniform; the number of neighbours is not.',
  teach:'This is $3$-ary PAM and it is the smallest example where $N_{\\min}$ is not an integer. It makes the definition — the <em>average</em> number of nearest neighbours — concrete.' },

{ id:'D4-10', module:'M4', type:'regions', src:'CH9 s.49',
  stem:'Two signal points sit at $\\pm1$ on a line with $N_0=0.4$. The priors are $P(\\mathbf{s}_0)=0.7$ for the point at $-1$ and $P(\\mathbf{s}_1)=0.3$.',
  parts:['Give the position of the boundary.',
         'Say which region has grown, and by what fraction of the separation.'],
  sol:'<b>Given.</b> Two points $d=2$ apart, unequal priors, $N_0=0.4$.<br>'
     +'<b>Find.</b> The boundary and how far it has moved.<br>'
     +'<b>Method.</b> Measuring from the point at $-1$ along the line, the boundary sits at $\\mu=\\dfrac{d}{2}+\\dfrac{N_0}{2d}\\ln\\dfrac{P(\\mathbf{s}_1)}{P(\\mathbf{s}_0)}$.<br>'
     +'<b>Solution — (a).</b> $\\mu=1+\\dfrac{0.4}{4}\\ln\\dfrac{0.3}{0.7}=1+0.1(-0.847)=0.915$, measured from $-1$, so the boundary is at $-1+0.915=-0.085$.<br>'
     +'<b>Solution — (b).</b> The boundary has moved $0.085$ towards the less likely point, so the region of $\\mathbf{s}_0$ has grown by $0.085/2=4.3\\%$ of the separation.<br>'
     +'<b>Check.</b> The sign is right: $\\mathbf{s}_0$ is more likely and its region grew. The shift is small because the noise is small compared with the separation — at $N_0=4$ it would be $0.85$, nearly half the separation, and the priors would be doing most of the deciding.',
  err:'Writing $\\ln\\frac{P(\\mathbf{s}_0)}{P(\\mathbf{s}_1)}$ and moving the boundary the wrong way, shrinking the region of the more likely symbol.',
  teach:'Have the student predict the direction before computing. Getting the direction from the idea — the more likely symbol should be given more room — makes the sign self-checking.' },

{ id:'D4-11', module:'M4', type:'rule', src:'CH9 s.36',
  stem:'Three signals have energies $E_1=4$, $E_2=9$ and $E_3=1$, and the correlations with the observation are $\\mathbf{r}\\cdot\\mathbf{s}_1=3.0$, $\\mathbf{r}\\cdot\\mathbf{s}_2=5.0$ and $\\mathbf{r}\\cdot\\mathbf{s}_3=2.0$. The signals are equally likely.',
  parts:['Give the correlation metric for each.',
         'Say which signal the receiver decides, and which it would have chosen on correlation alone.'],
  sol:'<b>Given.</b> Three correlations and three energies, equal priors.<br>'
     +'<b>Find.</b> The metrics and the decision.<br>'
     +'<b>Method.</b> With equal priors the metric is $\\mathbf{r}\\cdot\\mathbf{s}_i-E_i/2$. The prior term is the same for all three and drops out; the energy term does not.<br>'
     +'<b>Solution — (a).</b> $3.0-2=1.0$; $\\;5.0-4.5=0.5$; $\\;2.0-0.5=1.5$.<br>'
     +'<b>Solution — (b).</b> The largest metric is $1.5$, so the receiver decides $\\mathbf{s}_3$. On correlation alone the largest is $5.0$ and it would have chosen $\\mathbf{s}_2$ — the wrong answer.<br>'
     +'<b>Check.</b> $\\mathbf{s}_2$ has the largest energy, so it produces the largest correlation with almost anything; the $-E_i/2$ term is exactly what removes that advantage. Had all three energies been equal, the term would have been common and correlation alone would have been right.',
  err:'Dropping the energy term because "the signals are equally likely". Equal priors remove the prior term. Equal <em>energies</em> would remove the energy term, and here they are not equal.',
  teach:'This question exists to separate the two conditions that are usually satisfied together. Asking which term each assumption removes is the whole lesson.' },

{ id:'D4-12', module:'M4', type:'design', src:'Final Q3',
  stem:'$M$-ary phase-shift keying places $M$ points evenly on a circle of radius $\\sqrt{E_s}$.',
  parts:['Give $d_{\\min}$ in terms of $M$ and $E_s$.',
         'Give the nearest-neighbour estimate of $P_e$.',
         'By how many decibels does the required $E_s/N_0$ grow when $M$ goes from $4$ to $8$ at a fixed error rate?'],
  sol:'<b>Given.</b> $M$ points on a circle of radius $\\sqrt{E_s}$.<br>'
     +'<b>Find.</b> $d_{\\min}$, $P_e$, and the cost of doubling $M$.<br>'
     +'<b>Method.</b> The chord between neighbouring points subtends $2\\pi/M$, so $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/M)$. Every point has two neighbours, so $N_{\\min}=2$.<br>'
     +'<b>Solution — (a).</b> $d_{\\min}=2\\sqrt{E_s}\\,\\sin(\\pi/M)$.<br>'
     +'<b>Solution — (b).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{4E_s\\sin^{2}(\\pi/M)}{2N_0}=\\dfrac{2E_s}{N_0}\\sin^{2}\\dfrac{\\pi}{M}$, so $$P_e\\approx2\\,Q\\!\\left(\\sqrt{\\frac{2E_s}{N_0}}\\,\\sin\\frac{\\pi}{M}\\right).$$<br>'
     +'<b>Solution — (c).</b> Holding the $Q$ argument fixed, $E_s/N_0$ must grow by $\\left(\\frac{\\sin(\\pi/4)}{\\sin(\\pi/8)}\\right)^{2}=\\left(\\frac{0.7071}{0.3827}\\right)^{2}=3.414$, which is $5.33$ dB.<br>'
     +'<b>Check.</b> At $M=4$ the formula gives $d_{\\min}=2\\sqrt{E_s}\\sin45^{\\circ}=\\sqrt{2E_s}$, matching the square constellation of the earlier question — as it must, since four points on a circle at $90^{\\circ}$ <em>are</em> that square.',
  err:'Using the arc length between neighbouring points instead of the chord. Distance in signal space is the straight line.',
  teach:'Part (c) is the number worth remembering: one extra bit per symbol in PSK costs more than $5$ dB, and it gets worse as $M$ grows. That is why QAM replaces PSK above eight points.' },

/* ---- full-length ----------------------------------------------------- */

{ id:'D4-13', module:'M4', type:'full', src:'Final Q3',
  stem:'Four equally likely signals are transmitted over an additive white Gaussian noise channel with $S_n(f)=N_0/2$. Their signal vectors are $\\mathbf{s}_1=(2,\\,0)$, $\\mathbf{s}_2=(0,\\,2)$, $\\mathbf{s}_3=(-2,\\,0)$ and $\\mathbf{s}_4=(0,\\,-2)$.',
  parts:['Draw the constellation and the optimal decision regions.',
         'Give the average symbol energy and the energy per bit.',
         'Give the minimum distance and the average number of nearest neighbours.',
         'Give the nearest-neighbour approximation to the symbol error probability as a function of $E_b/N_0$.'],
  sol:'<b>Given.</b> Four points on the axes at distance $2$ from the origin.<br>'
     +'<b>Find.</b> The regions, the energies, the geometry and the error estimate.<br>'
     +'<b>Method.</b> Draw first; every later part is read off the drawing.<br>'
     +'<b>Solution — (a).</b> The boundaries are the perpendicular bisectors of neighbouring pairs. Between $(2,0)$ and $(0,2)$ that is the line $\\psi_2=\\psi_1$; between $(0,2)$ and $(-2,0)$ it is $\\psi_2=-\\psi_1$. The two diagonals therefore cut the plane into four wedges, each containing one point.<br>'
     +'<b>Solution — (b).</b> Every point has $\\|\\mathbf{s}_i\\|^{2}=4$, so $E_s=4$. Four symbols carry $\\log_2 4=2$ bits, so $E_b=E_s/2=2$.<br>'
     +'<b>Solution — (c).</b> Neighbouring points, such as $(2,0)$ and $(0,2)$, are $\\sqrt{4+4}=2\\sqrt{2}=2.83$ apart; opposite points are $4$ apart. So $d_{\\min}=2\\sqrt{2}$, and every point has two neighbours at that distance, giving $N_{\\min}=2$.<br>'
     +'<b>Solution — (d).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{8}{2N_0}=\\dfrac{4}{N_0}$. Writing $E_s=4$ and $E_b=2$, that is $\\dfrac{2E_b}{N_0}$, so $$P_e\\approx2\\,Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right).$$<br>'
     +'<b>Check.</b> The argument is exactly the binary antipodal one. That is not a coincidence: this constellation is two independent antipodal signals, one on each axis, and each carries one bit. Two bits a symbol at no cost in bit error rate is the reason QPSK is used everywhere.',
  err:'Using the distance to the opposite point, $4$, as $d_{\\min}$. The nearest neighbours are the diagonal ones at $2\\sqrt{2}$, and they are the pairs that get confused.',
  teach:'Part (d) coming out at the binary answer is the moment to stop and ask why. A student who can say "it is two antipodal systems side by side" has understood the constellation rather than computed with it.' },

{ id:'D4-14', module:'M4', type:'full', src:'Final Q3',
  stem:'An M-ary scheme uses the four equally likely signal vectors $\\mathbf{s}_1=(1,\\,1)$, $\\mathbf{s}_2=(1,\\,-1)$, $\\mathbf{s}_3=(-1,\\,1)$ and $\\mathbf{s}_4=(-3,\\,-3)$, with $N_0=0.25$.',
  parts:['Give the average symbol energy.',
         'Give all six pairwise distances and identify $d_{\\min}$.',
         'Give the general union bound on the symbol error probability.',
         'Say which symbol is best protected and why.'],
  sol:'<b>Given.</b> Four points, one of them far from the rest.<br>'
     +'<b>Find.</b> The energy, the distances, the bound, and the safest symbol.<br>'
     +'<b>Method.</b> Energies from squared lengths; distances from coordinates; then one $Q$ per ordered pair.<br>'
     +'<b>Solution — (a).</b> $\\|\\mathbf{s}_1\\|^{2}=\\|\\mathbf{s}_2\\|^{2}=\\|\\mathbf{s}_3\\|^{2}=2$ and $\\|\\mathbf{s}_4\\|^{2}=18$, so $E_s=\\frac{2+2+2+18}{4}=6$.<br>'
     +'<b>Solution — (b).</b> $d_{12}=2$, $d_{13}=2$, $d_{23}=2\\sqrt{2}=2.83$, $d_{14}=\\sqrt{16+16}=5.66$, $d_{24}=\\sqrt{16+4}=4.47$, $d_{34}=\\sqrt{4+16}=4.47$. So $d_{\\min}=2$.<br>'
     +'<b>Solution — (c).</b> $\\dfrac{d^{2}}{2N_0}=\\dfrac{d^{2}}{0.5}=2d^{2}$. The six distances give arguments $\\sqrt{8}=2.828$ twice, $\\sqrt{16}=4$ once, $\\sqrt{64}=8$ once and $\\sqrt{40}=6.32$ twice. Counting ordered pairs and averaging over the four transmitted points, $$P_e\\le\\tfrac14\\bigl[4Q(2.828)+2Q(4)+2Q(8)+4Q(6.32)\\bigr].$$ With $Q(2.828)=2.34\\times10^{-3}$ and the rest below $3.2\\times10^{-5}$, this is $2.36\\times10^{-3}$.<br>'
     +'<b>Solution — (d).</b> $\\mathbf{s}_4$. Its nearest neighbour is $4.47$ away, more than twice $d_{\\min}$, so its $Q$ is smaller by four orders of magnitude. It also carries nine times the energy of the others, which is what bought the distance.<br>'
     +'<b>Check.</b> The nearest-neighbour form uses $d_{\\min}=2$ and $N_{\\min}=\\frac{2+1+1+0}{4}=1$, giving $2.34\\times10^{-3}$ — within one per cent of the full sum, because every other term is a hundred times smaller.',
  err:'Averaging the distances to get an "average distance" and putting that into one $Q$. The bound sums the $Q$ functions, and $Q$ is so steep that the smallest distance dominates the sum entirely.',
  teach:'This constellation is deliberately badly designed: one symbol carries nine times the energy of the others and buys almost nothing, because the error rate is set by the three that are crowded together. It is the clearest argument for spending energy on $d_{\\min}$ rather than on any one point.' },

{ id:'D4-15', module:'M4', type:'full', src:'CH9 s.33, 49',
  stem:'A binary system has $\\mathbf{s}_0=-\\sqrt{E_b}$ and $\\mathbf{s}_1=+\\sqrt{E_b}$ with $E_b=1$ and $N_0=0.25$. The symbol $\\mathbf{s}_0$ is sent with probability $0.75$.',
  parts:['Give the optimal decision boundary.',
         'Give the two conditional error probabilities.',
         'Give the average error probability.',
         'Compare it with the equal-prior receiver applied to the same source.'],
  sol:'<b>Given.</b> Antipodal binary, $E_b=1$, $N_0=0.25$, $P(\\mathbf{s}_0)=0.75$.<br>'
     +'<b>Find.</b> The boundary, both errors, the average, and a comparison.<br>'
     +'<b>Method.</b> The boundary from the log-ratio; each error as a Gaussian tail; the average weighted by the priors.<br>'
     +'<b>Solution — (a).</b> $\\lambda=\\dfrac{N_0}{4\\sqrt{E_b}}\\ln\\dfrac{P(\\mathbf{s}_0)}{P(\\mathbf{s}_1)}=\\dfrac{0.25}{4}\\ln3=0.0625(1.0986)=0.0687$.<br>'
     +'<b>Solution — (b).</b> $\\sigma=\\sqrt{N_0/2}=0.3536$. Then $P(\\text{err}\\mid\\mathbf{s}_0)=Q\\!\\left(\\frac{0.0687+1}{0.3536}\\right)=Q(3.023)=1.25\\times10^{-3}$ and $P(\\text{err}\\mid\\mathbf{s}_1)=Q\\!\\left(\\frac{1-0.0687}{0.3536}\\right)=Q(2.634)=4.22\\times10^{-3}$.<br>'
     +'<b>Solution — (c).</b> $P_e=0.75(1.25\\times10^{-3})+0.25(4.22\\times10^{-3})=2.00\\times10^{-3}$.<br>'
     +'<b>Solution — (d).</b> With the boundary at zero both conditional errors are $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)=Q(\\sqrt{8})=Q(2.828)=2.34\\times10^{-3}$, so the average is that number. The optimal boundary is worth a $15\\%$ reduction.<br>'
     +'<b>Check.</b> The optimal receiver makes the likely symbol safer and the unlikely one more exposed — $1.25$ against $4.22$ in units of $10^{-3}$ — and the weighted total still falls, which is the only test that matters. The gain is modest because the boundary moved only $3.4\\%$ of the separation.',
  err:'Reporting the smaller of the two conditional errors as the answer to (c). The average error probability weights both by their priors.',
  teach:'The pattern of part (d) recurs: the optimal threshold buys ten to twenty per cent when the priors are two or three to one, and much more when they are extreme. It is worth doing and rarely decisive.' },

{ id:'D4-16', module:'M4', type:'full', src:'Final Q3',
  stem:'Eight-point phase-shift keying places its symbols on a circle of radius $\\sqrt{E_s}$ at $45^{\\circ}$ intervals, and each symbol carries three bits.',
  parts:['Give the minimum distance in terms of $E_s$.',
         'Give the nearest-neighbour estimate of the symbol error probability.',
         'Evaluate it at $E_s/N_0=13$ dB.',
         'Give the bit error probability if Gray coding is used, and say what that assumes.'],
  sol:'<b>Given.</b> Eight points on a circle, three bits a symbol.<br>'
     +'<b>Find.</b> $d_{\\min}$, $P_e$, a number, and the bit error rate.<br>'
     +'<b>Method.</b> Chord between neighbours; two neighbours each; one $Q$; then the bit mapping.<br>'
     +'<b>Solution — (a).</b> $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/8)=2\\sqrt{E_s}(0.3827)=0.7654\\sqrt{E_s}$.<br>'
     +'<b>Solution — (b).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{4E_s(0.1464)}{2N_0}=\\dfrac{2E_s}{N_0}(0.1464)$, so $$P_e\\approx2\\,Q\\!\\left(\\sqrt{\\frac{2E_s}{N_0}}\\,\\sin\\frac{\\pi}{8}\\right).$$<br>'
     +'<b>Solution — (c).</b> At $13$ dB, $E_s/N_0=19.95$, so the argument is $\\sqrt{39.9}(0.3827)=2.417$ and $P_e\\approx2\\,Q(2.417)=1.56\\times10^{-2}$.<br>'
     +'<b>Solution — (d).</b> With Gray coding, adjacent symbols differ in one bit of the three, so a symbol error usually costs one bit error out of three: $P_b\\approx P_e/3=5.2\\times10^{-3}$. This assumes the errors that occur are to <em>adjacent</em> symbols, which is what the nearest-neighbour picture already assumes.<br>'
     +'<b>Check.</b> $E_b=E_s/3$, so $E_b/N_0=6.65$, which is $8.2$ dB — and binary antipodal at $8.2$ dB gives $Q(\\sqrt{13.3})=1.4\\times10^{-4}$. Eight-PSK is far worse per bit, and that is the price of three bits a symbol on one circle.',
  err:'Dividing the symbol error by eight rather than by three. There are three bits in a symbol, not eight, and the eight is the number of symbols.',
  teach:'Part (d) rests on the same assumption as the whole nearest-neighbour picture, and saying so is the answer. A student who states the assumption has understood why Gray coding and the union bound belong together.' },

{ id:'D4-17', module:'M4', type:'full', src:'CH9 s.51, 56',
  stem:'A receiver observes $\\mathbf{r}$ and must decide among $M$ equally likely signals in additive white Gaussian noise.',
  parts:['Write the exact expression for the average probability of a correct decision.',
         'Say why it cannot usually be evaluated.',
         'Give the union bound and say why it is an upper bound rather than an equality.',
         'Say when the bound stops being useful.'],
  sol:'<b>Given.</b> The general $M$-ary detection problem.<br>'
     +'<b>Find.</b> The exact expression, its difficulty, the bound, and its limits.<br>'
     +'<b>Method.</b> Correct decisions are observations landing in the right region.<br>'
     +'<b>Solution — (a).</b> $$P(C)=\\frac{1}{M}\\sum_{i=1}^{M}\\int_{R_i}f_{\\mathbf{r}}(\\mathbf{r}\\mid\\mathbf{s}_i)\\,d\\mathbf{r},\\qquad P_e=1-P(C).$$<br>'
     +'<b>Solution — (b).</b> The integral is over $N$ dimensions and its region is a polygon with as many faces as the point has neighbours. For two points it is a Gaussian tail; for anything larger there is no closed form and numerical work becomes expensive as $N$ grows.<br>'
     +'<b>Solution — (c).</b> $$P_e\\le\\frac{1}{M}\\sum_{k}\\sum_{j\\ne k}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right).$$ It is an inequality because the events overlap: an observation can be closer to two other points at once, and the sum counts it twice, while the true error counts it once.<br>'
     +'<b>Solution — (d).</b> When the terms are large. At low signal-to-noise ratio the overlaps are large, the sum over-counts badly, and the bound can exceed one — which is true and useless. At the ratios systems are actually operated at, every term is small, the overlaps are smaller still, and the bound is close enough to be used as the answer.<br>'
     +'<b>Check.</b> Both statements are visible in a two-point case, where the bound is exact: with only one other point there is nothing to double count, and the inequality becomes an equality.',
  err:'Describing the union bound as an approximation with no direction. It is an upper bound, always at least the truth, and that is what makes a system designed to it safe.',
  teach:'A question answered entirely in words, and a good one to set before any of the numerical ones. A student who can say why the bound over-counts will never be surprised by it exceeding one.' },

{ id:'D4-18', module:'M4', type:'full', src:'Final Q3',
  stem:'Four-level pulse amplitude modulation places its symbols at $\\pm d/2$ and $\\pm 3d/2$ on one axis, and its average symbol energy is $E_s=1.25\\,d^{2}$.',
  parts:['Give the decision regions.',
         'Give the average number of nearest neighbours.',
         'Give the nearest-neighbour estimate of the symbol error probability in terms of $E_s/N_0$.',
         'Evaluate it at $E_s/N_0=12$ dB, and compare with QPSK at the same $E_s/N_0$.'],
  sol:'<b>Given.</b> Four points equally spaced on a line, $E_s=1.25d^{2}$.<br>'
     +'<b>Find.</b> The regions, $N_{\\min}$, $P_e$, and a comparison.<br>'
     +'<b>Method.</b> Midpoints for the boundaries; count neighbours by position; one $Q$.<br>'
     +'<b>Solution — (a).</b> Boundaries at the midpoints $-d$, $0$ and $+d$. The two outer regions are half lines and the two inner ones are intervals of width $d$.<br>'
     +'<b>Solution — (b).</b> The two outer points have one neighbour each and the two inner points have two: $N_{\\min}=\\frac{1+2+2+1}{4}=\\frac{3}{2}$.<br>'
     +'<b>Solution — (c).</b> $d_{\\min}=d=\\sqrt{E_s/1.25}$, so $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{E_s}{2.5N_0}$ and $$P_e\\approx\\frac{3}{2}\\,Q\\!\\left(\\sqrt{\\frac{E_s}{2.5N_0}}\\right).$$<br>'
     +'<b>Solution — (d).</b> At $12$ dB, $E_s/N_0=15.85$, so the ratio is $6.34$ and $Q(\\sqrt{6.34})=Q(2.518)=5.90\\times10^{-3}$, giving $P_e\\approx8.9\\times10^{-3}$. QPSK at the same $E_s/N_0$ has $d_{\\min}^{2}/2N_0=E_s/N_0=15.85$, so $P_e\\approx2Q(3.981)=6.9\\times10^{-5}$ — better by more than two orders of magnitude, at the same energy and the same two bits a symbol.<br>'
     +'<b>Check.</b> Both carry two bits a symbol, so the comparison is fair. QPSK wins because it spreads four points over two dimensions while 4-PAM crowds them onto one, and $d_{\\min}$ is $\\sqrt{2.5}$ times larger as a result. Dimensions are worth having.',
  err:'Taking $N_{\\min}=2$ because the points are equally spaced. Only the two inner points have two neighbours; the outer ones have one, and the average is $3/2$.',
  teach:'Part (d) is the argument for two-dimensional constellations, made with numbers. It is worth setting immediately before Module 5, which is a survey of what those two dimensions can be used for.' },

{ id:'D4-19', module:'M4', type:'full', src:'CH9 s.62–65',
  stem:'A constellation has six equally likely points at the corners of a regular hexagon of circumradius $\\rho$, with $N_0$ given.',
  parts:['Give the average symbol energy and the minimum distance.',
         'Give the average number of nearest neighbours.',
         'Give the nearest-neighbour estimate and the minimum-distance bound.',
         'By what factor do the two differ, and why?'],
  sol:'<b>Given.</b> Six points on a circle of radius $\\rho$ at $60^{\\circ}$ intervals.<br>'
     +'<b>Find.</b> The geometry and the two bounds.<br>'
     +'<b>Method.</b> A regular hexagon has side equal to its circumradius; then count neighbours.<br>'
     +'<b>Solution — (a).</b> Every point is $\\rho$ from the origin, so $E_s=\\rho^{2}$. Neighbouring points subtend $60^{\\circ}$, so $d_{\\min}=2\\rho\\sin30^{\\circ}=\\rho=\\sqrt{E_s}$.<br>'
     +'<b>Solution — (b).</b> Every point has exactly two neighbours at that distance, so $N_{\\min}=2$.<br>'
     +'<b>Solution — (c).</b> $\\dfrac{d_{\\min}^{2}}{2N_0}=\\dfrac{E_s}{2N_0}$, so $$P_e\\approx2\\,Q\\!\\left(\\sqrt{\\frac{E_s}{2N_0}}\\right),\\qquad P_e\\le5\\,Q\\!\\left(\\sqrt{\\frac{E_s}{2N_0}}\\right).$$<br>'
     +'<b>Solution — (d).</b> By $5/2=2.5$, at every noise level. The loose form pretends all five other points are at $d_{\\min}$, when in fact two are at $\\rho\\sqrt{3}$ and one is at $2\\rho$ — far enough that their $Q$ values are negligible.<br>'
     +'<b>Check.</b> The exact union bound would be $\\frac{1}{6}\\bigl[12Q(a)+12Q(a\\sqrt{3})+6Q(2a)\\bigr]$ with $a=\\sqrt{E_s/2N_0}$, which is $2Q(a)$ plus two terms that are smaller by orders of magnitude at any useful noise level. The nearest-neighbour form is the first term of that sum and the rest is what it discards.',
  err:'Taking the side of a regular hexagon to be $\\rho\\sqrt{3}$ or $\\rho/2$. It equals the circumradius exactly, which is worth remembering because the hexagon is the densest packing in two dimensions.',
  teach:'The hexagon is the best six-point constellation there is at a fixed average energy, and asking why — it is the densest way to pack points in a plane — connects this module to the design questions of Module 5.' },

{ id:'D4-20', module:'M4', type:'full', src:'Final Q3',
  stem:'Two designers must carry two bits per symbol at an average symbol energy $E_s$. One proposes QPSK: four points on a circle of radius $\\sqrt{E_s}$. The other proposes four points on a line, at $\\pm a$ and $\\pm3a$.',
  parts:['Give $a$ in terms of $E_s$.',
         'Give $d_{\\min}$ for each scheme.',
         'Give the ratio of their error probabilities at high signal-to-noise ratio.',
         'Say what the one-dimensional scheme gets in exchange.'],
  sol:'<b>Given.</b> Two four-point constellations at the same average energy.<br>'
     +'<b>Find.</b> The geometry, the comparison, and the trade.<br>'
     +'<b>Method.</b> Normalise the energies, measure the distances, then compare the $Q$ arguments.<br>'
     +'<b>Solution — (a).</b> The four amplitudes are $\\pm a,\\pm3a$, so $E_s=\\frac{2a^{2}+2(9a^{2})}{4}=5a^{2}$ and $a=\\sqrt{E_s/5}$.<br>'
     +'<b>Solution — (b).</b> QPSK: neighbouring points are $90^{\\circ}$ apart on the circle, so $d_{\\min}=\\sqrt{2E_s}=1.414\\sqrt{E_s}$. The line: the spacing is $2a=2\\sqrt{E_s/5}=0.894\\sqrt{E_s}$.<br>'
     +'<b>Solution — (c).</b> The squared distances are $2E_s$ and $0.8E_s$, so the $Q$ arguments differ by $\\sqrt{2/0.8}=1.58$. At high signal-to-noise ratio $Q$ falls faster than any power, so the ratio of the error probabilities grows without bound: at $E_s/N_0=12$ dB it is about $130$, and at $16$ dB about $4000$.<br>'
     +'<b>Solution — (d).</b> Bandwidth, and simplicity. A one-dimensional constellation needs one basis function, so one carrier and one matched filter, and it occupies half the bandwidth of a two-dimensional scheme at the same symbol rate. QPSK buys its distance by using a second dimension, and that dimension is not free.<br>'
     +'<b>Check.</b> Both schemes carry two bits a symbol at energy $E_s$, so the comparison is between geometries and nothing else. The two-dimensional one wins on error rate by a factor that grows without limit — which is why every modern system that can afford two dimensions uses them.',
  err:'Comparing the two at equal <em>spacing</em> rather than equal energy. At equal spacing the one-dimensional scheme needs far more energy, and the comparison says nothing.',
  teach:'Part (d) is the part students leave out. Every gain in this course is bought with something, and naming the price is what turns a calculation into a design argument.' },

{ id:'D4-21', module:'M4', type:'union', src:'CH9 s.60',
  stem:'Three equally likely signals sit on one basis function at $0$, $d$ and $2.2d$. The noise is white and Gaussian with two-sided density $N_0/2$, and $d^{2}/2N_0=9$.',
  parts:['Give the decision regions, and name the neighbours that give each region a face.',
         'Write the intelligent union bound on the symbol error probability.',
         'Evaluate it, and evaluate the nearest-neighbour approximation beside it.',
         'Say which of the two a designer should quote, and why.'],
  sol:'<b>Given.</b> Three points on a line at $0$, $d$ and $2.2d$, equally likely, with $d^{2}/2N_0=9$.<br>'
     +'<b>Find.</b> The regions, the intelligent bound, its value, and the nearest-neighbour value.<br>'
     +'<b>Method.</b> The boundaries are the midpoints between adjacent points. A face is a boundary the region actually has, so the neighbours that give a face are the adjacent points and nothing else.<br>'
     +'<b>Solution — (a).</b> The midpoints are $0.5d$ and $1.6d$, so the regions are $r<0.5d$, $0.5d<r<1.6d$ and $r>1.6d$. The left region has one face, shared with the middle point at distance $d$. The middle region has two, at $d$ and at $1.2d$. The right region has one, at $1.2d$. The outer pair, $2.2d$ apart, share no boundary — the middle point stands between them.<br>'
     +'<b>Solution — (b).</b> Averaging one term per face over the three points:<br>'
     +'$P_e\\le\\frac{1}{3}\\Bigl[2Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)+2Q\\!\\left(\\sqrt{(1.2d)^{2}/2N_0}\\right)\\Bigr]=\\frac{2}{3}\\Bigl[Q(3)+Q(3.6)\\Bigr].$<br>'
     +'<b>Solution — (c).</b> $Q(3)=1.3499\\times10^{-3}$ and $Q(3.6)=1.5911\\times10^{-4}$, so the bound is $\\frac{2}{3}(1.5090\\times10^{-3})=1.006\\times10^{-3}$. The nearest-neighbour form counts only the points at $d_{\\min}=d$: the left and middle points have one each, the right point has none, so $N_{\\min}=2/3$ and $P_e\\approx\\frac{2}{3}Q(3)=8.999\\times10^{-4}$.<br>'
     +'<b>Solution — (d).</b> The bound. The approximation is $12\\%$ <em>below</em> it, and it is below it because it threw away the two faces at $1.2d$ — which are real boundaries that the observation really can cross. An approximation that sits under the truth is the wrong side to be on when a system is being designed to meet a target.<br>'
     +'<b>Check.</b> The minimum-distance bound gives $(M-1)Q(3)=2.700\\times10^{-3}$, comfortably above both, as a loose bound must be. And the general union bound adds the outer pair at $2.2d$: $Q(6.6)=2.1\\times10^{-11}$, which changes nothing at four figures. So the intelligent bound has kept everything that mattered and dropped only what did not.',
  err:'Reading $N_{\\min}$ off the picture as $1$ because "each point has a neighbour". It is an average over the transmitted point, and the right-hand point has no neighbour at $d_{\\min}$ at all, so the average is $2/3$.',
  teach:'This is the constellation where the two forms separate, and it separates them in the direction that matters. Equal spacing hides the difference — every face then sits at $d_{\\min}$ and the two expressions are identical, which is why the square constellation of scene 4.4.4 shows nothing. Unequal spacing is what exposes that one of them is a bound and the other is not.' }

]);

window.DRILL_M4 = [

{ id:'m4-drill', module:'M4', nav:'Module 4 · practice questions',
  title:'Module 4 — practice questions',
  objective:'Twenty-one open-ended questions with worked solutions.',
  keywords:'practice questions module 4 minimum distance decision regions union bound constellations psk qam pam',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 4 · Practice D4-01 … D4-21'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question on paper before opening its solution. Every solution ends with a <b>Check</b> step. In this module the cheap checks are: the minimum distance is to a <em>nearest</em> neighbour and never to the furthest point, $N_{\\min}$ is an average and need not be an integer, a boundary always lies between the two points it separates, and a constellation with more points at the same energy is always worse.'},
  {t:'rule', short:true},
  {t:'drill', module:'M4'}
]}

];
})();
