/* ==========================================================================
   Practice questions — Module 3.

   This module's taxonomy does NOT come from the question tables. Neither the
   midterm nor the final has a question on the geometric representation: the
   twenty-four questions in the tables cover sampling and quantization, the
   matched filter and the threshold, the M-ary constellation and the union
   bound, and information theory, and none of them asks for a basis. The six
   shapes below are taken from the worked examples in the lecture material and
   from the home exercise that follows them.

   That is stated here rather than discovered later. It is the one module of
   the six whose questions rest on a weaker source than the rest, and a reader
   preparing for a paper should know that this material appears there as the
   first step of a longer question rather than on its own.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

CONTENT.DRILLTYPES.M3 = [
  { k:'ortho', name:'Testing a set for orthonormality',
    asks:'A set of waveforms is given. Decide whether it is orthogonal, orthonormal, or neither.',
    method:['Two signals are orthogonal when $\\int\\psi_j\\psi_k\\,dt=0$. Two pulses that never overlap always are — their product is zero everywhere, so no integration is needed.',
            'A signal has unit energy when $\\int\\psi^{2}\\,dt=1$. Orthogonal plus unit energy is orthonormal.',
            'Check every pair, not just the neighbouring ones. A set can fail on one pair and pass on all the others.'],
    go:'m3-ortho' },

  { k:'coords', name:'Coordinates, energy and distance',
    asks:'A signal set and a basis are given. Find the signal vectors, their energies and the distances between them.',
    method:['Each coordinate is one integral: $s_{ij}=\\int s_i\\psi_j\\,dt$. Where the two do not overlap the integral is zero and can be written down.',
            'Energy is the squared length of the vector, $E_i=\\sum_j s_{ij}^{2}$. Check it against the waveform: for a rectangle it is height squared times width.',
            'The distance between two signals is the ordinary distance between their points, $\\|\\mathbf{s}_i-\\mathbf{s}_k\\|$, and it is the square root of the energy of their difference.'],
    go:'m3-energy' },

  { k:'gs', name:'Running Gram–Schmidt',
    asks:'A set of waveforms is given with no basis. Produce one, and the signal vectors against it.',
    method:['Normalise the first signal: $\\psi_1=s_1/\\sqrt{E_1}$, and $s_{11}=\\sqrt{E_1}$.',
            'For each later signal, compute its projections on the axes found so far, subtract them off, and normalise what is left. A zero remainder adds no axis.',
            'Stop when every signal has been used. The number of axes is at most the number of signals and is often fewer.'],
    go:'m3-gs' },

  { k:'dim', name:'How many dimensions a set needs',
    asks:'Given a signal set, say how many basis functions it needs and therefore how many matched filters the receiver has.',
    method:['The dimension is the number of signals that are <em>not</em> combinations of the others. Look for that relationship before integrating anything.',
            'Disjoint pulses are always independent, so a set of $M$ non-overlapping pulses needs $M$ dimensions.',
            'Scaled copies of one shape need one dimension however many of them there are.'],
    go:'m3-gs' },

  { k:'const', name:'Reading a constellation',
    asks:'A constellation is given. Read off energies, average energy, and the distance that matters.',
    method:['The distance from the origin to a point is $\\sqrt{E_i}$, so the energy is the squared distance.',
            'The average energy is $\\frac{1}{M}\\sum_i E_i$ when the symbols are equally likely.',
            'The number that decides performance is the <b>smallest</b> distance between any two points, not the average one.'],
    go:'m3-constellation' },

  { k:'full', name:'A full-length question combining several of the shapes above',
    asks:'One statement and three or four lettered parts, usually: find a basis, find the vectors, draw the constellation, and read something off it.',
    method:['Sketch the waveforms before starting. Whether one is the sum of the others is usually visible, and it decides how many axes there will be.',
            'Carry exact values — $\\sqrt{2}$ rather than $1.414$ — through to the end. Distances are compared, and a rounded coordinate makes two equal distances look different.',
            'Check the energies both ways at the end: from the vectors and from the waveforms. They must agree, and it is the fastest check there is.'] }
];

CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- single-skill ---------------------------------------------------- */

{ id:'D3-01', module:'M3', type:'ortho', src:'CH9 s.5',
  stem:'Two waveforms are defined on $[0,2]$: $\\;p_1(t)=1$ on $[0,1]$ and zero after; $\\;p_2(t)=1$ on $[1,2]$ and zero before.',
  parts:['Are they orthogonal?',
         'Are they orthonormal?'],
  sol:'<b>Given.</b> Two unit-height pulses on adjacent intervals.<br>'
     +'<b>Find.</b> Whether the set is orthogonal, and whether it is orthonormal.<br>'
     +'<b>Method.</b> Orthogonal means the integral of the product is zero; orthonormal adds unit energy.<br>'
     +'<b>Solution — (a).</b> Wherever $p_1$ is non-zero $p_2$ is zero and the other way round, so $p_1(t)p_2(t)=0$ for every $t$ and $\\int p_1p_2\\,dt=0$. <b>Yes.</b><br>'
     +'<b>Solution — (b).</b> $\\int_0^{1}1^{2}dt=1$ and $\\int_1^{2}1^{2}dt=1$, so both have unit energy. <b>Yes.</b><br>'
     +'<b>Check.</b> No integration was needed for part (a) at all — non-overlapping supports make the product identically zero. That is worth recognising, because most of the orthogonality in this course comes from exactly that.',
  err:'Computing $\\int p_1p_2$ as $1\\times1\\times$ (some width) because both are "equal to one". They are equal to one on <em>different</em> intervals, and the product is zero on both.',
  teach:'A good place to ask for a pair that is orthogonal but not orthonormal: the same two pulses at height $2$ are orthogonal with energy $4$ each.' },

{ id:'D3-02', module:'M3', type:'ortho', src:'CH9 s.5',
  stem:'On $[0,T]$, take $\\psi_1(t)=\\sqrt{2/T}\\cos(2\\pi t/T)$ and $\\psi_2(t)=\\sqrt{2/T}\\sin(2\\pi t/T)$.',
  parts:['Show that each has unit energy.',
         'Show that the two are orthogonal.'],
  sol:'<b>Given.</b> A scaled cosine and sine over one full period.<br>'
     +'<b>Find.</b> That the pair is orthonormal.<br>'
     +'<b>Method.</b> Use $\\cos^{2}\\theta=\\tfrac12(1+\\cos2\\theta)$ and $\\sin\\theta\\cos\\theta=\\tfrac12\\sin2\\theta$; the oscillating parts integrate to zero over a whole number of periods.<br>'
     +'<b>Solution — (a).</b> $\\displaystyle\\int_0^{T}\\frac{2}{T}\\cos^{2}\\frac{2\\pi t}{T}dt=\\frac{2}{T}\\int_0^{T}\\frac{1+\\cos(4\\pi t/T)}{2}dt=\\frac{2}{T}\\cdot\\frac{T}{2}=1$, and the same for $\\psi_2$.<br>'
     +'<b>Solution — (b).</b> $\\displaystyle\\int_0^{T}\\frac{2}{T}\\cos\\frac{2\\pi t}{T}\\sin\\frac{2\\pi t}{T}dt=\\frac{1}{T}\\int_0^{T}\\sin\\frac{4\\pi t}{T}dt=0$, because the interval holds two whole periods of that sine.<br>'
     +'<b>Check.</b> The factor $\\sqrt{2/T}$ is exactly what unit energy requires: a cosine of amplitude $A$ over $T$ carries $A^{2}T/2$, so $A=\\sqrt{2/T}$ gives $1$. This pair is the basis every carrier-modulated scheme in Module 5 is written against.',
  err:'Concluding orthogonality from "sine and cosine are different functions". They are orthogonal <em>over a whole number of periods</em>; over $[0,T/4]$ they are not.',
  teach:'Worth stating that this is the most important orthonormal pair in the course, and that the whole of QAM is two numbers against these two axes.' },

{ id:'D3-03', module:'M3', type:'coords', src:'CH9 s.6–8',
  stem:'With the basis $\\psi_1=1/\\sqrt{2}$ on $[0,2]$ and $\\psi_2=1$ on $[2,3]$, a signal is $s(t)=3$ on $[0,2]$ and $s(t)=-2$ on $[2,3]$.',
  parts:['Give the coordinates of $s$.',
         'Give its energy, twice: from the vector and from the waveform.'],
  sol:'<b>Given.</b> A two-piece signal and a two-function basis on the same intervals.<br>'
     +'<b>Find.</b> $\\mathbf{s}$ and $E_s$.<br>'
     +'<b>Method.</b> One integral per axis; then the squared length, checked against the waveform.<br>'
     +'<b>Solution — (a).</b> $s_1=\\displaystyle\\int_0^{2}3\\cdot\\frac{1}{\\sqrt{2}}dt=\\frac{6}{\\sqrt{2}}=3\\sqrt{2}$ and $s_2=\\displaystyle\\int_2^{3}(-2)(1)\\,dt=-2$. So $\\mathbf{s}=(3\\sqrt{2},\\,-2)$.<br>'
     +'<b>Solution — (b).</b> From the vector: $\\|\\mathbf{s}\\|^{2}=18+4=22$. From the waveform: $3^{2}(2)+(-2)^{2}(1)=18+4=22$.<br>'
     +'<b>Check.</b> They agree, which is the statement that energy is squared length. Note that the first coordinate is not $3$: the basis function has height $1/\\sqrt{2}$, not $1$, and the coordinate is the amount of $\\psi_1$ in $s$, not the height of $s$.',
  err:'Reporting $\\mathbf{s}=(3,-2)$ by reading the heights off the waveform. That only works when the basis functions have height one, which $\\psi_1$ does not.',
  teach:'The two routes to the energy in part (b) are the cheapest check in the module and worth insisting on every time.' },

{ id:'D3-04', module:'M3', type:'coords', src:'CH9 s.11',
  stem:'Two signals have coordinates $\\mathbf{s}_1=(3,\\,4)$ and $\\mathbf{s}_2=(-3,\\,4)$ against an orthonormal basis.',
  parts:['Give the energy of each.',
         'Give the distance between them and the energy of their difference.'],
  sol:'<b>Given.</b> Two points in a two-dimensional signal space.<br>'
     +'<b>Find.</b> Energies, distance, and the energy of the difference signal.<br>'
     +'<b>Method.</b> Energy is squared length; distance is ordinary Euclidean distance; the energy of the difference is the squared distance.<br>'
     +'<b>Solution — (a).</b> $E_1=3^{2}+4^{2}=25$ and $E_2=(-3)^{2}+4^{2}=25$. Equal energies.<br>'
     +'<b>Solution — (b).</b> $d=\\sqrt{(3-(-3))^{2}+(4-4)^{2}}=6$, so the energy of $s_1-s_2$ is $d^{2}=36$.<br>'
     +'<b>Check.</b> The two points differ only in the first coordinate, so the difference signal is $6\\psi_1$, whose energy is $36$ — the same number reached without any geometry. Note also that equal energy does not mean the points coincide, and unequal energy does not stop them being close.',
  err:'Computing the energy of the difference as $E_1-E_2=0$. Energy is not linear; the difference of two equal-energy signals is generally not zero.',
  teach:'Ask what changes if $\\mathbf{s}_2$ becomes $(-3,-4)$: the energies stay at $25$ and the distance grows to $10$, which is antipodal signalling and the best a pair of points of that energy can do.' },

{ id:'D3-05', module:'M3', type:'dim', src:'CH9 s.17–18',
  stem:'Four waveforms are defined on $[0,4]$: $\\;s_1=1$ on $[0,1]$; $\\;s_2=1$ on $[1,2]$; $\\;s_3=1$ on $[2,3]$; $\\;s_4=s_1+s_2+s_3$.',
  parts:['How many dimensions does this set need?',
         'How many matched filters does a receiver for it need?'],
  sol:'<b>Given.</b> Three disjoint pulses and their sum.<br>'
     +'<b>Find.</b> The dimension of the set.<br>'
     +'<b>Method.</b> Count the signals that are not combinations of the others.<br>'
     +'<b>Solution — (a).</b> The first three never overlap, so none is a combination of the others and each contributes an axis. The fourth is stated as their sum, so its remainder after subtracting the three is zero and it adds nothing. <b>Three dimensions.</b><br>'
     +'<b>Solution — (b).</b> Three. The receiver computes three coordinates and works with the triple, whichever of the four signals was sent.<br>'
     +'<b>Check.</b> $N\\le M$ always, and here $N=3<M=4$. Running Gram–Schmidt would give $\\psi_k=s_k$ for $k=1,2,3$, because each already has unit energy and they are already orthogonal, and then $g_4=0$.',
  err:'Answering four because there are four signals. The number of dimensions is at most the number of signals and is smaller whenever one is a combination of the others.',
  teach:'Ask what the four signal vectors are: $(1,0,0)$, $(0,1,0)$, $(0,0,1)$ and $(1,1,1)$. Written down, the fourth being the sum of the first three is obvious.' },

{ id:'D3-06', module:'M3', type:'dim', src:'CH9 s.17–18',
  stem:'Three waveforms on $[0,T]$ are $s_1(t)=A$, $\\;s_2(t)=-2A$ and $\\;s_3(t)=3A$, each constant over the whole interval.',
  parts:['How many dimensions does this set need?',
         'Give the basis and the three signal vectors.'],
  sol:'<b>Given.</b> Three constants over the same interval.<br>'
     +'<b>Find.</b> The dimension, a basis, and the vectors.<br>'
     +'<b>Method.</b> All three are multiples of one shape, so one axis carries all of them.<br>'
     +'<b>Solution — (a).</b> One.<br>'
     +'<b>Solution — (b).</b> $E_1=A^{2}T$, so $\\psi_1(t)=1/\\sqrt{T}$ on $[0,T]$, and $$\\mathbf{s}_1=A\\sqrt{T},\\quad \\mathbf{s}_2=-2A\\sqrt{T},\\quad \\mathbf{s}_3=3A\\sqrt{T}.$$<br>'
     +'<b>Check.</b> Energies from the vectors: $A^{2}T$, $4A^{2}T$, $9A^{2}T$. From the waveforms: height squared times $T$, giving the same three. The constellation is three points on a line — which is exactly what pulse amplitude modulation is, and Module 5 returns to it.',
  err:'Producing three basis functions by normalising each signal separately. Those three are all the same function, so the set has one member, not three.',
  teach:'Worth naming: a one-dimensional constellation of equally spaced points is $M$-ary PAM, and this question is its geometry with $M=3$.' },

{ id:'D3-07', module:'M3', type:'const', src:'CH9 s.11',
  stem:'A constellation has four points at $(\\pm a,\\,\\pm a)$ against an orthonormal basis.',
  parts:['Give the energy of each signal and the average energy.',
         'Give the smallest distance between any two points.',
         'Express that distance in terms of the average energy.'],
  sol:'<b>Given.</b> Four points on a square of half-side $a$.<br>'
     +'<b>Find.</b> Energies, the smallest distance, and the relation between them.<br>'
     +'<b>Method.</b> Squared length for the energy; compare all the pairwise distances and take the smallest.<br>'
     +'<b>Solution — (a).</b> Every point has $E=a^{2}+a^{2}=2a^{2}$, so the average energy is also $E_{\\text{avg}}=2a^{2}$.<br>'
     +'<b>Solution — (b).</b> Neighbouring points differ in one coordinate by $2a$, giving $d=2a$; the diagonal pairs are $2a\\sqrt{2}$ apart. The smallest is $d_{\\min}=2a$.<br>'
     +'<b>Solution — (c).</b> $a=\\sqrt{E_{\\text{avg}}/2}$, so $d_{\\min}=2\\sqrt{E_{\\text{avg}}/2}=\\sqrt{2E_{\\text{avg}}}$.<br>'
     +'<b>Check.</b> With $M=4$ and two bits a symbol, $E_{\\text{avg}}=2E_b$, so $d_{\\min}=\\sqrt{4E_b}=2\\sqrt{E_b}$ — the same separation antipodal binary signalling has at the same energy per bit. That is not a coincidence and Module 5 explains it: this constellation is two independent antipodal signals, one on each axis.',
  err:'Taking the smallest distance to be the diagonal because it is drawn as one line. The smallest distance is the one that matters and it is always to a nearest neighbour.',
  teach:'The observation in the check is the whole reason this constellation is used. It carries two bits per symbol at no cost in error rate over one bit.' },

{ id:'D3-08', module:'M3', type:'const', src:'CH9 s.11',
  stem:'A constellation has three points at $(0,\\,1)$, $(\\sqrt{3}/2,\\,-1/2)$ and $(-\\sqrt{3}/2,\\,-1/2)$.',
  parts:['Give the energy of each point.',
         'Give the distance between any two of them.'],
  sol:'<b>Given.</b> Three points, evenly spaced on a circle.<br>'
     +'<b>Find.</b> Energies and distances.<br>'
     +'<b>Method.</b> Squared length; then one distance, since symmetry makes them all equal.<br>'
     +'<b>Solution — (a).</b> $0^{2}+1^{2}=1$; $\\;3/4+1/4=1$; $\\;3/4+1/4=1$. All three have energy $1$.<br>'
     +'<b>Solution — (b).</b> Between the second and the third: $\\sqrt{(\\sqrt{3})^{2}+0^{2}}=\\sqrt{3}=1.732$. By symmetry every pair is that far apart.<br>'
     +'<b>Check.</b> Three points on a unit circle at $120^{\\circ}$ have chord length $2\\sin(60^{\\circ})=\\sqrt{3}$, which agrees. Compare with two points of the same energy placed antipodally: they are $2$ apart. Carrying a third symbol on the same energy has cost some separation, and that is the trade every $M$-ary scheme makes.',
  err:'Computing the distance as the arc rather than the chord. Distance in signal space is the straight line between the points.',
  teach:'This is three-phase PSK. Asking for the bits per symbol — $\\log_2 3=1.58$ — and comparing with the separation lost makes the trade concrete.' },

{ id:'D3-09', module:'M3', type:'gs', src:'CH9 s.16',
  stem:'A signal set begins with $s_1(t)=2$ on $[0,4]$ and zero elsewhere.',
  parts:['Give the first basis function.',
         'Give the first coordinate of $s_1$.'],
  sol:'<b>Given.</b> The first signal of a set.<br>'
     +'<b>Find.</b> $\\psi_1$ and $s_{11}$.<br>'
     +'<b>Method.</b> The first axis is the first signal normalised to unit energy.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^{4}2^{2}dt=16$, so $\\psi_1(t)=s_1(t)/4=0.5$ on $[0,4]$.<br>'
     +'<b>Solution — (b).</b> $s_{11}=\\sqrt{E_1}=4$. Equivalently $\\int_0^{4}2(0.5)\\,dt=4$.<br>'
     +'<b>Check.</b> $\\psi_1$ must have unit energy: $\\int_0^{4}0.5^{2}dt=0.25(4)=1$. And $s_{11}\\psi_1=4(0.5)=2$ on $[0,4]$, which is $s_1$ — so the coordinate does rebuild the signal.',
  err:'Taking $\\psi_1=s_1/E_1=s_1/16$. The normalisation divides by $\\sqrt{E_1}$, not by $E_1$; dividing by the energy makes the basis function\'s energy $1/E_1$ rather than one.',
  teach:'Both checks in the solution are one line each and catch the two mistakes students actually make. Worth requiring them.' },

{ id:'D3-10', module:'M3', type:'gs', src:'CH9 s.17',
  stem:'With $\\psi_1(t)=0.5$ on $[0,4]$ already found, the next signal is $s_2(t)=3$ on $[0,4]$ and zero elsewhere.',
  parts:['Give the projection $s_{21}$.',
         'Give the remainder $g_2$ and say whether a second axis is added.'],
  sol:'<b>Given.</b> The first axis and a second signal proportional to the first.<br>'
     +'<b>Find.</b> $s_{21}$, $g_2$, and whether the dimension grows.<br>'
     +'<b>Method.</b> Project, subtract, and look at what is left.<br>'
     +'<b>Solution — (a).</b> $s_{21}=\\int_0^{4}3(0.5)\\,dt=6$.<br>'
     +'<b>Solution — (b).</b> $g_2(t)=s_2(t)-6\\psi_1(t)=3-6(0.5)=0$ on $[0,4]$, and zero elsewhere too. The remainder is identically zero, so <b>no second axis is added</b> and $\\mathbf{s}_2=(6)$.<br>'
     +'<b>Check.</b> $E_2=\\int_0^{4}3^{2}dt=36$ and $\\|\\mathbf{s}_2\\|^{2}=6^{2}=36$. The signal was already a multiple of the first, which the picture shows before any integral: both are constants on the same interval.',
  err:'Adding a second axis because there is a second signal. The procedure adds an axis only when the remainder is non-zero, and that is what keeps $N$ below $M$.',
  teach:'Ask for the answer before the arithmetic. A student who sees that $s_2=1.5\\,s_1$ knows the answer immediately, and the integrals only confirm it.' },

{ id:'D3-11', module:'M3', type:'ortho', src:'CH9 s.5',
  stem:'On $[0,2]$, take $\\phi_1(t)=1$ throughout, and $\\phi_2(t)=1$ on $[0,1]$ with $\\phi_2(t)=-1$ on $[1,2]$.',
  parts:['Are $\\phi_1$ and $\\phi_2$ orthogonal?',
         'Are they orthonormal? If not, give the orthonormal pair.'],
  sol:'<b>Given.</b> A constant and a square wave of one period on the same interval.<br>'
     +'<b>Find.</b> Whether the pair is orthogonal and whether it is orthonormal.<br>'
     +'<b>Method.</b> Integrate the product; then check each energy.<br>'
     +'<b>Solution — (a).</b> $\\int_0^{2}\\phi_1\\phi_2\\,dt=\\int_0^{1}1\\,dt+\\int_1^{2}(-1)\\,dt=1-1=0$. <b>Orthogonal.</b> They overlap everywhere and are still orthogonal — the positive and negative parts cancel.<br>'
     +'<b>Solution — (b).</b> $\\int_0^{2}\\phi_1^{2}dt=2$ and $\\int_0^{2}\\phi_2^{2}dt=2$, so neither has unit energy. Dividing each by $\\sqrt{2}$ gives the orthonormal pair $\\psi_1=1/\\sqrt{2}$ and $\\psi_2=\\pm1/\\sqrt{2}$.<br>'
     +'<b>Check.</b> Scaling does not change orthogonality — the integral of the product is scaled but stays zero — so the normalised pair is still orthogonal, and now each has energy $\\tfrac12(2)=1$.',
  err:'Assuming that overlapping signals cannot be orthogonal. Non-overlap is sufficient and not necessary; cancellation does the same job here.',
  teach:'This pair is the two-point Hadamard basis, and it is the cleanest example of orthogonality without disjoint support.' },

{ id:'D3-12', module:'M3', type:'coords', src:'CH9 s.6',
  stem:'Two signals have coordinates $\\mathbf{x}=(1,\\,2,\\,-1)$ and $\\mathbf{y}=(3,\\,0,\\,1)$ against the same orthonormal basis.',
  parts:['Give $\\int x(t)y(t)\\,dt$.',
         'Are the two signals orthogonal?'],
  sol:'<b>Given.</b> Two signals by their coordinates.<br>'
     +'<b>Find.</b> Their inner product, and whether it vanishes.<br>'
     +'<b>Method.</b> The inner product of the signals equals the inner product of the coordinate vectors — that is the property the whole module rests on.<br>'
     +'<b>Solution — (a).</b> $\\int xy\\,dt=(1)(3)+(2)(0)+(-1)(1)=3+0-1=2$.<br>'
     +'<b>Solution — (b).</b> It is $2$ and not $0$, so <b>no</b>.<br>'
     +'<b>Check.</b> No waveform was needed and no integral was computed. That is the point of the translation: once the coordinates are known the waveforms can be put away.',
  err:'Trying to reconstruct the waveforms and integrate. The whole content of the key property is that this is unnecessary.',
  teach:'Ask what the third coordinate of $\\mathbf{y}$ would have to be for the two to be orthogonal. Solving $3+0-y_3\\cdot 1=0$ gives $y_3=3$, and the arithmetic is a line.' },

/* ---- full-length ----------------------------------------------------- */

{ id:'D3-13', module:'M3', type:'full', src:'CH9 s.19–21',
  stem:'Three waveforms are defined on $[0,3]$: $\\;s_1(t)=2$ on $[0,1]$; $\\;s_2(t)=2$ on $[1,3]$; $\\;s_3(t)=2$ on $[0,3]$. Each is zero outside the interval named.',
  parts:['Use Gram–Schmidt to find an orthonormal basis.',
         'Give the three signal vectors.',
         'Draw the constellation and give the energy of each signal.',
         'Give the distance between the two closest signals.'],
  sol:'<b>Given.</b> Two disjoint pulses and their sum, all of height $2$.<br>'
     +'<b>Find.</b> A basis, the vectors, the constellation and the smallest distance.<br>'
     +'<b>Method.</b> Normalise the first, project and subtract for the second, and check whether the third adds anything.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^{1}4\\,dt=4$, so $\\psi_1(t)=s_1(t)/2=1$ on $[0,1]$. Next, $s_{21}=\\int s_2\\psi_1\\,dt=0$ because the two do not overlap, so $g_2=s_2$, $E_{g_2}=\\int_1^{3}4\\,dt=8$, and $\\psi_2(t)=s_2(t)/\\sqrt{8}=1/\\sqrt{2}$ on $[1,3]$.<br>'
     +'<b>Solution — (b).</b> $s_{31}=\\int_0^{1}2(1)dt=2$ and $s_{32}=\\int_1^{3}2\\left(1/\\sqrt{2}\\right)dt=4/\\sqrt{2}=2\\sqrt{2}$, and $g_3=s_3-2\\psi_1-2\\sqrt{2}\\,\\psi_2=0$, so there is no third axis. $$\\mathbf{s}_1=(2,\\,0),\\qquad \\mathbf{s}_2=(0,\\,2\\sqrt{2}),\\qquad \\mathbf{s}_3=(2,\\,2\\sqrt{2}).$$<br>'
     +'<b>Solution — (c).</b> The three points sit at the corners of a rectangle missing one corner. Energies: $4$, $8$ and $12$.<br>'
     +'<b>Solution — (d).</b> $\\|\\mathbf{s}_1-\\mathbf{s}_3\\|=2\\sqrt{2}=2.83$, $\\;\\|\\mathbf{s}_2-\\mathbf{s}_3\\|=2$, and $\\|\\mathbf{s}_1-\\mathbf{s}_2\\|=\\sqrt{4+8}=3.46$. The smallest is $2$.<br>'
     +'<b>Check.</b> Energies from the waveforms: $2^{2}(1)=4$, $2^{2}(2)=8$, $2^{2}(3)=12$. They match the squared lengths. And $s_3=s_1+s_2$ is visible in the pictures, which is why two axes carry three signals.',
  err:'Taking $\\psi_2=s_2$ without normalising, because $\\psi_1$ came out equal to $s_1/2$ and the pattern looks like "divide by the height". $s_2$ has energy $8$, not $1$.',
  teach:'Part (d) is the one worth marking. Students compute one distance and stop; the question asks for the smallest, which requires all three.' },

{ id:'D3-14', module:'M3', type:'full', src:'CH9 s.19–21',
  stem:'Three waveforms on $[0,2]$: $\\;s_1(t)=1$ throughout; $\\;s_2(t)=1$ on $[0,1]$ and $-1$ on $[1,2]$; $\\;s_3(t)=2$ on $[0,1]$ and $0$ after.',
  parts:['Find an orthonormal basis by Gram–Schmidt.',
         'Give the three signal vectors.',
         'Give the energy of each signal from its vector, and check one of them against the waveform.',
         'Say how many matched filters a receiver for this set needs.'],
  sol:'<b>Given.</b> A constant, a square wave and a single pulse, all on $[0,2]$.<br>'
     +'<b>Find.</b> A basis, the vectors, the energies and the number of filters.<br>'
     +'<b>Method.</b> The three steps in order, checking each remainder.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^{2}1\\,dt=2$, so $\\psi_1=1/\\sqrt{2}$ on $[0,2]$. Then $s_{21}=\\int_0^{2}s_2\\psi_1\\,dt=\\tfrac{1}{\\sqrt{2}}(1-1)=0$, so $g_2=s_2$, $E_{g_2}=2$, and $\\psi_2=s_2/\\sqrt{2}$: that is $1/\\sqrt{2}$ on $[0,1]$ and $-1/\\sqrt{2}$ on $[1,2]$.<br>'
     +'<b>Solution — (b).</b> $s_{31}=\\int_0^{1}2\\left(\\tfrac{1}{\\sqrt{2}}\\right)dt=\\sqrt{2}$ and $s_{32}=\\int_0^{1}2\\left(\\tfrac{1}{\\sqrt{2}}\\right)dt=\\sqrt{2}$, and $$g_3=s_3-\\sqrt{2}\\psi_1-\\sqrt{2}\\psi_2=0,$$ so no third axis. $$\\mathbf{s}_1=(\\sqrt{2},\\,0),\\quad \\mathbf{s}_2=(0,\\,\\sqrt{2}),\\quad \\mathbf{s}_3=(\\sqrt{2},\\,\\sqrt{2}).$$<br>'
     +'<b>Solution — (c).</b> $E_1=2$, $E_2=2$, $E_3=4$. Checking the third against the waveform: $2^{2}(1)+0^{2}(1)=4$. ✓<br>'
     +'<b>Solution — (d).</b> Two.<br>'
     +'<b>Check.</b> $s_3=s_1+s_2$: on $[0,1]$ that is $1+1=2$ and on $[1,2]$ it is $1-1=0$, which is $s_3$. The two axes are the constant and the square wave, and every signal in the set is a combination of them.',
  err:'Missing that $s_1$ and $s_2$ are already orthogonal and going through a subtraction that is identically zero. Not an error in the answer, but it hides the structure, and the structure is what part (d) asks about.',
  teach:'This set is the two-point Hadamard basis with one combination added. Asking what the fourth Hadamard signal would be — $s_1-s_2$, the pulse on $[1,2]$ — extends it naturally.' },

{ id:'D3-15', module:'M3', type:'full', src:'CH9 s.11',
  stem:'A four-point constellation has $\\mathbf{s}_1=(a,\\,0)$, $\\mathbf{s}_2=(0,\\,a)$, $\\mathbf{s}_3=(-a,\\,0)$ and $\\mathbf{s}_4=(0,\\,-a)$, with the four symbols equally likely.',
  parts:['Give the energy of each signal and the average energy per symbol.',
         'Give the average energy per bit.',
         'Give the smallest distance between two points.',
         'Compare that distance with the one a square constellation of the same average energy gives.'],
  sol:'<b>Given.</b> Four points on the axes at distance $a$ from the origin.<br>'
     +'<b>Find.</b> Energies, the smallest distance, and a comparison.<br>'
     +'<b>Method.</b> Squared lengths; then all six pairwise distances, of which only two values occur.<br>'
     +'<b>Solution — (a).</b> Every point has $E=a^{2}$, so $E_{\\text{avg}}=a^{2}$.<br>'
     +'<b>Solution — (b).</b> Four symbols carry $\\log_2 4=2$ bits, so $E_b=E_{\\text{avg}}/2=a^{2}/2$.<br>'
     +'<b>Solution — (c).</b> Neighbouring points, such as $(a,0)$ and $(0,a)$, are $\\sqrt{2a^{2}}=a\\sqrt{2}$ apart; opposite points are $2a$ apart. The smallest is $a\\sqrt{2}=1.414a$.<br>'
     +'<b>Solution — (d).</b> A square constellation at $(\\pm b,\\pm b)$ has $E_{\\text{avg}}=2b^{2}$; matching $2b^{2}=a^{2}$ gives $b=a/\\sqrt{2}$, and its smallest distance is $2b=a\\sqrt{2}$ — <b>the same</b>.<br>'
     +'<b>Check.</b> The two constellations are the same four points rotated by $45^{\\circ}$. A rotation changes no length and no distance, so the energies and the separations had to agree, and part (d) is a check on the arithmetic rather than a discovery.',
  err:'Taking the smallest distance to be $2a$, the distance between the opposite pair, because those two are the most conspicuous. The nearest neighbours are the ones that matter.',
  teach:'The rotation observation in the check is worth drawing on the board. It is also the first instance of a rule Module 4 states in general: performance depends on distances, and distances are unchanged by rotating the whole constellation.' },

{ id:'D3-16', module:'M3', type:'full', src:'CH9 s.19–21',
  stem:'Two waveforms on $[0,T]$ are $s_1(t)=A\\cos(2\\pi t/T)$ and $s_2(t)=A\\sin(2\\pi t/T)$.',
  parts:['Show that the two are orthogonal.',
         'Give an orthonormal basis for the set.',
         'Give the two signal vectors and their energies.',
         'Give the distance between them, and compare it with the distance an antipodal pair of the same energy would have.'],
  sol:'<b>Given.</b> A cosine and a sine over one full period, both of amplitude $A$.<br>'
     +'<b>Find.</b> Orthogonality, a basis, the vectors, and a comparison.<br>'
     +'<b>Method.</b> Integrate the product over the whole period; normalise each; then compute the distance.<br>'
     +'<b>Solution — (a).</b> $\\int_0^{T}A^{2}\\cos\\frac{2\\pi t}{T}\\sin\\frac{2\\pi t}{T}dt=\\frac{A^{2}}{2}\\int_0^{T}\\sin\\frac{4\\pi t}{T}dt=0$, over two whole periods of that sine. <b>Orthogonal.</b><br>'
     +'<b>Solution — (b).</b> Each has energy $A^{2}T/2$, so $$\\psi_1(t)=\\sqrt{\\tfrac{2}{T}}\\cos\\tfrac{2\\pi t}{T},\\qquad \\psi_2(t)=\\sqrt{\\tfrac{2}{T}}\\sin\\tfrac{2\\pi t}{T}.$$<br>'
     +'<b>Solution — (c).</b> $\\mathbf{s}_1=(A\\sqrt{T/2},\\,0)$ and $\\mathbf{s}_2=(0,\\,A\\sqrt{T/2})$. Writing $E=A^{2}T/2$, that is $(\\sqrt{E},0)$ and $(0,\\sqrt{E})$, both of energy $E$.<br>'
     +'<b>Solution — (d).</b> $d=\\sqrt{E+E}=\\sqrt{2E}$. An antipodal pair of the same energy sits at $\\pm\\sqrt{E}$ and is $2\\sqrt{E}$ apart, larger by $\\sqrt{2}$.<br>'
     +'<b>Check.</b> The ratio $\\sqrt{2}$ in distance is the $3$ dB that Module 2 found between antipodal and orthogonal signalling, met here as a picture rather than as an integral. Orthogonal signals are at right angles; antipodal ones point opposite ways, and opposite is further than perpendicular.',
  err:'Concluding that the two are antipodal because one is the other shifted. A quarter-period shift turns a cosine into a sine and gives a right angle in signal space, not a reversal.',
  teach:'This question ties Modules 2 and 3 together in one line, and the picture makes the $3$ dB obvious in a way the integrals never do.' },

{ id:'D3-17', module:'M3', type:'full', src:'CH9 s.6–12',
  stem:'Against an orthonormal basis $\\{\\psi_1,\\psi_2\\}$, a signal set is $\\mathbf{s}_1=(2,\\,1)$, $\\mathbf{s}_2=(-1,\\,2)$ and $\\mathbf{s}_3=(1,\\,-2)$, with the three symbols equally likely.',
  parts:['Give the energy of each signal and the average.',
         'Give all three pairwise distances.',
         'Which pair is a receiver most likely to confuse, and why?',
         'Give the waveform $s_2(t)$ explicitly if $\\psi_1(t)=1/\\sqrt{2}$ on $[0,2]$ and $\\psi_2(t)=1$ on $[2,3]$.'],
  sol:'<b>Given.</b> Three points and, in part (d), a basis to turn one of them back into a waveform.<br>'
     +'<b>Find.</b> Energies, distances, the vulnerable pair, and one waveform.<br>'
     +'<b>Method.</b> Squared lengths; ordinary distances; then the synthesis formula.<br>'
     +'<b>Solution — (a).</b> $E_1=4+1=5$, $E_2=1+4=5$, $E_3=1+4=5$. All equal, so $E_{\\text{avg}}=5$.<br>'
     +'<b>Solution — (b).</b> $$d_{12}=\\sqrt{9+1}=\\sqrt{10}=3.16,\\quad d_{13}=\\sqrt{1+9}=\\sqrt{10}=3.16,\\quad d_{23}=\\sqrt{4+16}=\\sqrt{20}=4.47.$$<br>'
     +'<b>Solution — (c).</b> The pairs $(\\mathbf{s}_1,\\mathbf{s}_2)$ and $(\\mathbf{s}_1,\\mathbf{s}_3)$, equally: they are the closest, at $3.16$. Noise has to push the observation further to cross the boundary between $\\mathbf{s}_2$ and $\\mathbf{s}_3$, so that confusion is rarer.<br>'
     +'<b>Solution — (d).</b> $s_2(t)=-1\\cdot\\psi_1(t)+2\\cdot\\psi_2(t)$, which is $-1/\\sqrt{2}=-0.707$ on $[0,2]$ and $+2$ on $[2,3]$.<br>'
     +'<b>Check.</b> The energy of that waveform is $0.5(2)+4(1)=5$, matching $E_2$ from the vector. Note that all three signals have the same energy and are still not equally distinguishable — energy and separation are different quantities, and it is separation the receiver cares about.',
  err:'Answering (c) with "the pair with the largest distance", reading the question as asking which pair is most easily told apart. The closest pair is the vulnerable one.',
  teach:'Part (d) is the module run backwards, and it is worth asking for: students are quick at analysis and slow at synthesis, and the two are the same formula.' },

{ id:'D3-18', module:'M3', type:'full', src:'CH9 s.17–18',
  stem:'A signal set consists of $M$ waveforms $s_i(t)=A_i\\,p(t)$, all multiples of the same finite-energy pulse $p(t)$ of energy $E_p$.',
  parts:['How many dimensions does the set need, whatever $M$ is?',
         'Give the basis function and the general signal vector.',
         'Give the energy of $s_i$.',
         'Give the distance between $s_i$ and $s_k$.'],
  sol:'<b>Given.</b> $M$ scaled copies of one pulse.<br>'
     +'<b>Find.</b> The dimension, the basis, the vectors, energies and distances, in general.<br>'
     +'<b>Method.</b> Normalise the pulse once; every signal is then a number times that one axis.<br>'
     +'<b>Solution — (a).</b> One, however large $M$ is. Every signal is a multiple of the first, so every remainder after the first step is zero.<br>'
     +'<b>Solution — (b).</b> $\\psi_1(t)=p(t)/\\sqrt{E_p}$, and $s_i=A_i\\sqrt{E_p}$ — a single number.<br>'
     +'<b>Solution — (c).</b> $E_i=s_i^{2}=A_i^{2}E_p$, which is also $\\int A_i^{2}p^{2}dt$ read directly.<br>'
     +'<b>Solution — (d).</b> $d_{ik}=|s_i-s_k|=|A_i-A_k|\\sqrt{E_p}$.<br>'
     +'<b>Check.</b> The whole constellation is $M$ points on a line, and the receiver needs one matched filter regardless of $M$. This is $M$-ary pulse amplitude modulation, and part (d) says its performance is set by the closest amplitude spacing — which is why the amplitudes are chosen equally spaced.',
  err:'Answering (a) with $M$. The number of dimensions counts independent shapes, not signals, and here there is one shape.',
  teach:'A good question to set immediately before Module 5, which opens with exactly this constellation and then asks what happens on two axes instead of one.' },

{ id:'D3-19', module:'M3', type:'full', src:'CH9 s.22',
  stem:'Four waveforms on $[0,4]$ are built from the unit pulses $p_k(t)=1$ on $[k-1,k]$, $k=1,2,3,4$: $$s_1=p_1+p_2,\\quad s_2=p_3+p_4,\\quad s_3=p_1+p_3,\\quad s_4=p_2+p_4.$$',
  parts:['Are the four pulses $p_k$ an orthonormal set? Give a reason.',
         'Give the four signal vectors against that basis.',
         'Give the energy of each signal and all the distinct pairwise distances.',
         'How many dimensions does the set $\\{s_1,\\ldots,s_4\\}$ actually need?'],
  sol:'<b>Given.</b> Four signals, each the sum of two of four disjoint unit pulses.<br>'
     +'<b>Find.</b> The basis, the vectors, energies, distances and the true dimension.<br>'
     +'<b>Method.</b> The $p_k$ are a ready-made basis; then read the vectors off the definitions.<br>'
     +'<b>Solution — (a).</b> Yes. Any two of them have disjoint supports, so every cross integral is zero, and each has energy $\\int 1^{2}dt=1$ over its own unit interval.<br>'
     +'<b>Solution — (b).</b> $$\\mathbf{s}_1=(1,1,0,0),\\;\\mathbf{s}_2=(0,0,1,1),\\;\\mathbf{s}_3=(1,0,1,0),\\;\\mathbf{s}_4=(0,1,0,1).$$<br>'
     +'<b>Solution — (c).</b> Every energy is $1+1=2$. The distances come in two values. The two <em>complementary</em> pairs share no pulse at all: $\\mathbf{s}_1-\\mathbf{s}_2=(1,1,-1,-1)$ has length $2$, and so does $\\mathbf{s}_3-\\mathbf{s}_4$. The four <em>mixed</em> pairs share one pulse: $\\mathbf{s}_1-\\mathbf{s}_3=(0,1,-1,0)$ has length $\\sqrt{2}=1.414$, and so do the other three. The smallest distance is therefore $\\sqrt{2}$.<br>'
     +'<b>Solution — (d).</b> Three. The four vectors satisfy $\\mathbf{s}_1+\\mathbf{s}_2=\\mathbf{s}_3+\\mathbf{s}_4=(1,1,1,1)$, so the fourth is determined by the other three and adds no axis.<br>'
     +'<b>Check.</b> The two values have a reason: two signals that share a pulse differ in only two of the four coordinates, and two that share none differ in all four. Counting the shared pulses predicts the distance without any arithmetic. The pairs at $\\sqrt{2}$ are the vulnerable ones, so the receiver confuses $\\mathbf{s}_1$ with $\\mathbf{s}_3$ far more often than with $\\mathbf{s}_2$ — and a set whose distances are all equal would be better, which is what the next module\'s union bound makes precise.',
  err:'Reporting one distance and assuming the rest match it. Four points give six pairs, and here they take two different values; the one that matters is the smallest.',
  teach:'The relation $\\mathbf{s}_1+\\mathbf{s}_2=\\mathbf{s}_3+\\mathbf{s}_4$ is easy to miss and easy to check. Asking students to test it before answering (d) is the whole lesson of that part.' },

{ id:'D3-20', module:'M3', type:'full', src:'CH9 s.15',
  stem:'Two engineers design different waveform sets. The first uses rectangular pulses on $[0,T]$; the second uses half-sine pulses on the same interval. Both sets turn out to have the constellation $\\{(\\sqrt{E},0),\\,(0,\\sqrt{E}),\\,(-\\sqrt{E},0),\\,(0,-\\sqrt{E})\\}$.',
  parts:['What is the same about the two systems?',
         'What is not?',
         'Give the average energy per symbol and the smallest distance.',
         'Which of the two would you choose, and on what grounds?'],
  sol:'<b>Given.</b> Two waveform sets with the same constellation.<br>'
     +'<b>Find.</b> What the geometry fixes and what it leaves open.<br>'
     +'<b>Method.</b> Everything that depends only on the points is the same; everything else is not.<br>'
     +'<b>Solution — (a).</b> The number of matched filters, the structure of the receiver, the energies, the distances, and therefore the error probability in white Gaussian noise. Every one of those is read off the constellation.<br>'
     +'<b>Solution — (b).</b> The waveforms themselves, and everything that depends on their shape rather than their geometry: the bandwidth they occupy, how fast their spectra decay, how sensitive they are to a timing error, and how hard the filters are to build.<br>'
     +'<b>Solution — (c).</b> Every point has energy $E$, so $E_{\\text{avg}}=E$; the nearest pairs are $\\sqrt{2E}$ apart.<br>'
     +'<b>Solution — (d).</b> Not on error performance, since that is identical. The half-sine has a smoother spectrum and lower sidelobes, so it fits a bandlimited channel better and interferes less with its neighbours; the rectangular pulse is easier to generate and to time. The choice is made on the criteria of Module 2, not on those of this module.<br>'
     +'<b>Check.</b> If the answer to (d) had depended on the error probability, one of the earlier parts would be wrong: the constellations are identical and so are all the distances, so there is nothing left for the noise to distinguish.',
  err:'Answering (d) with "the one with lower error probability" and choosing arbitrarily. The two have the same error probability, and saying so is the answer.',
  teach:'This question exists to be answered in words. It is the clearest test of whether the reader has understood what the geometric representation captures and what it deliberately throws away.' }

]);

window.DRILL_M3 = [

{ id:'m3-drill', module:'M3', nav:'Module 3 · practice questions',
  title:'Module 3 — practice questions',
  objective:'Twenty open-ended questions with worked solutions.',
  keywords:'practice questions module 3 orthonormal gram schmidt basis constellation energy distance dimension',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Practice D3-01 … D3-20'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question on paper before opening its solution. Every solution ends with a <b>Check</b> step. In this module the cheap checks are: a basis function must have unit energy, the energy from the vector must equal the energy from the waveform, the number of axes must be at most the number of signals, and the distance that matters is the smallest one.'},
  {t:'rule', short:true},
  {t:'drill', module:'M3'}
]}

];
})();
