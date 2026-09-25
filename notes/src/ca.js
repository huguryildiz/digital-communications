/* Course notes — Appendix A.

   The results each chapter carries forward, and nothing else: one table a
   chapter, one row for each card of that module's summary slide (m<N>-synth),
   in the module's order, with the card's question and its result in the
   notation of the slide and of the chapter. Each row names its chapter and the
   PS anchor the chapter's own summary table gives it. No derivations.
   Module 4 still has its older four-card summary, so A.4 holds those four
   results until the converted module replaces them.

   `editions.js` slices this file at the APPENDIX heading and makes it Part 2
   of the Formula and Notation Reference, so the appendix and that part are one
   source rather than two copies to keep in step. */
(function(){

window.CA = [

{t:'h1', num:'APPENDIX A', text:'Summary of formulas'},
{t:'p', lead:true, text:'The results each chapter carries forward, in course order and without derivations.'},

/* ---------------------------------------------------------------- 1 ------ */
{t:'h2', num:'A.1', text:'The transition from analog to digital — Chapter 1'},
{t:'table', cap:'The results of Chapter 1, with $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$.', short:'The results of Chapter 1.', head:['Question','Result','Source'], rows:[
 ['What does sampling do to the spectrum?','$G_\\delta(f)=f_s\\sum_n G(f-nf_s)$: a copy at every multiple of $f_s$, scaled by $f_s$.','Ch. 1 &middot; PS CH7.1.1'],
 ['What is the lowest safe sampling rate?','The Nyquist rate $2W$. Below it the copies overlap and alias.','Ch. 1 &middot; PS CH7.1.1'],
 ['What filter turns the samples back into the signal?','An ideal lowpass filter with gain $T_s$. At $f_s=2W$ its impulse response is $\\operatorname{sinc}(2Wt)$.','Ch. 1 &middot; PS CH7.1.1'],
 ['How is $g(t)$ written in terms of its samples?','$g(t)=\\sum_n g(nT_s)\\operatorname{sinc}\\bigl(2W(t-nT_s)\\bigr)$, exact at every $t$.','Ch. 1 &middot; PS CH7.1.1'],
 ['Mid-rise or mid-tread: which has a level at zero?','Mid-tread. Mid-rise has a boundary at zero and outputs $\\pm\\Delta/2$ there.','Ch. 1 &middot; PS CH7.2.1'],
 ['What is the power of the quantization noise?','$E[Q^{2}]=\\Delta^{2}/12$, with $\\Delta=2m_{\\max}/L$, for a fine quantizer.','Ch. 1 &middot; PS CH7.2.1'],
 ['What does one more bit buy?','$6.02$ dB: $\\mathrm{SQNR}=\\alpha+6.02R$, and $\\alpha=1.76$ dB for a full-scale sinusoid.','Ch. 1 &middot; PS CH7.2.1'],
 ['Why compand?','Small amplitudes are common. Finer steps near zero keep the SQNR steady as the level falls.','Ch. 1 &middot; PS CH7.2.1'],
 ['What bit rate does PCM need?','$R_b=R\\,f_s$. Telephone speech: $8(8000)=64$ kb/s.','Ch. 1 &middot; PS CH7.3'],
 ['Why use a Gray code?','Adjacent levels differ in one bit, so a small decision error costs one bit error.','Ch. 1 &middot; PS CH7.3'],
 ['What bandwidth does PCM need?','$B_T\\ge R_b/2$, which is $RW$ at $f_s=2W$. Each extra bit adds $6.02$ dB and $W$ hertz.','Ch. 1 &middot; PS CH7.4.1'],
 ['What do DPCM and delta modulation send?','The difference from a prediction. Delta modulation sends one bit a sample and needs $\\Delta f_s$ above the largest slope.','Ch. 1 &middot; PS CH7.4.2&ndash;7.4.3']
]},

/* ---------------------------------------------------------------- 2 ------ */
{t:'h2', num:'A.2', text:'Baseband transmission of digital signals — Chapter 2'},
{t:'table', cap:'The results of Chapter 2.', head:['Question','Result','Source'], rows:[
 ['Which filter gives the largest peak SNR?','The matched filter $h(t)=k\\,g(T-t)$, or $H(f)=k\\,G^{*}(f)\\,e^{-j2\\pi fT}$, sampled at $t=T$.','Ch. 2 &middot; PS CH8.3.2'],
 ['What is that largest peak SNR?','$\\eta_{\\max}=2E/N_0$. It depends on the pulse energy $E$, not on its shape.','Ch. 2 &middot; PS CH8.3.2'],
 ['Where do the two symbols of polar signalling sit?','At $\\pm\\sqrt{E_b}$ on the axis of the unit-energy $\\psi(t)$, a distance $2\\sqrt{E_b}$ apart.','Ch. 2 &middot; PS CH8.2.1'],
 ['When do the correlator and the matched filter agree?','At $t=T_b$, where both give $\\int_0^{T_b}x(t)\\,\\psi(t)\\,dt$, for any shape of $\\psi$.','Ch. 2 &middot; PS CH8.3.1'],
 ['What noise is left in the demodulator output?','$y=s_m+n$, with $n$ Gaussian of mean $0$ and variance $N_0/2$.','Ch. 2 &middot; PS CH8.3.1'],
 ['Where does the optimal threshold go?','$\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}$, at $0$ for equal priors and toward the less likely symbol otherwise.','Ch. 2 &middot; PS CH8.3.3'],
 ['What is $Q(x)$?','The Gaussian tail $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$, the chance that a unit Gaussian exceeds $x$.','Ch. 2 &middot; PS CH8.3.3'],
 ['What is $P_b$ for polar signalling?','$P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ with equal priors and a matched filter.','Ch. 2 &middot; PS CH8.3.3'],
 ['How much interference does an RC channel add?','A bit $m$ bits back adds $(1-q)q^{m}$, with $q=e^{-2\\pi BT_b}$. The worst case totals $q$.','Ch. 2 &middot; PS CH10.1.1'],
 ['When does the eye close?','The opening is $2(1-2q)$. It closes at $BT_b=\\ln2/(2\\pi)=0.110$, and errors then occur without noise.','Ch. 2'],
 ['What is Nyquist\'s criterion?','$p(kT_b)=\\delta[k]$ exactly when $\\sum_nP(f-nR_b)=T_b$. It needs $B_T\\ge R_b/2$.','Ch. 2 &middot; PS CH10.3.1'],
 ['What bandwidth does a raised cosine need?','$B_T=\\tfrac{R_b}{2}(1+\\alpha)$. The tails fall as $1/|t|^{3}$ for $\\alpha>0$.','Ch. 2 &middot; PS CH10.3.1']
]},

/* ---------------------------------------------------------------- 3 ------ */
{t:'h2', num:'A.3', text:'Geometric representation of signal waveforms — Chapter 3'},
{t:'table', cap:'The results of Chapter 3.', head:['Question','Result','Source'], rows:[
 ['What is an orthonormal set?','Functions with $\\int\\psi_j\\psi_k\\,dt=1$ for $j=k$ and $0$ for $j\\ne k$: unit energy, and every pair orthogonal.','Ch. 3 &middot; PS CH8.1'],
 ['How is a coordinate computed?','$s_{ij}=\\int_0^{T}s_i(t)\\,\\psi_j(t)\\,dt$, one correlator for each basis function.','Ch. 3 &middot; PS CH8.1'],
 ['How is the waveform rebuilt?','$s_i(t)=\\sum_{j=1}^{N}s_{ij}\\,\\psi_j(t)$. The vector $\\mathbf{s}_i$ holds the whole waveform.','Ch. 3 &middot; PS CH8.1'],
 ['What does the translation preserve?','Inner products: $\\int x(t)\\,y(t)\\,dt=\\sum_kx_ky_k$.','Ch. 3 &middot; PS CH8.1'],
 ['What is the energy of a signal?','$E_i=\\|\\mathbf{s}_i\\|^{2}$, the squared distance from its point to the origin.','Ch. 3 &middot; PS CH8.1'],
 ['What is the distance between two signals?','$d_{ik}=\\|\\mathbf{s}_i-\\mathbf{s}_k\\|$, the root of $\\int(s_i-s_k)^{2}\\,dt$.','Ch. 3 &middot; PS CH8.1'],
 ['Antipodal or orthogonal: which is further apart?','Antipodal, $d=2\\sqrt{E_b}$ against $\\sqrt{2E_b}$. Orthogonal needs twice the energy, $3$ dB, for the same distance.','Ch. 3 &middot; PS CH8.2'],
 ['When are a cosine and a sine orthogonal?','Over $[0,T]$ when $f_cT$ is a whole number. Scaled by $\\sqrt{2/T}$ they are an orthonormal pair.','Ch. 3 &middot; PS CH8.6.1'],
 ['How far apart are the points of M-PSK?','$d_{\\min}=2\\sqrt{E}\\sin(\\pi/M)$. All $M$ points lie on the circle of radius $\\sqrt{E}$.','Ch. 3 &middot; PS CH8.6.1'],
 ['What is one Gram–Schmidt step?','$g_k=s_k-\\sum_{i<k}s_{ki}\\psi_i$, then $\\psi_k=g_k/\\sqrt{E_{g_k}}$. A zero $g_k$ adds no axis.','Ch. 3 &middot; PS CH8.1'],
 ['How many axes does a set of $M$ signals need?','$N\\le M$, with $N=M$ only when no signal is a combination of the others.','Ch. 3 &middot; PS CH8.1'],
 ['What does another basis change?','Only the coordinates. $N$, the energies and the distances stay, and so do the receiver and its error probability.','Ch. 3 &middot; PS CH8.1']
]},

/* ---------------------------------------------------------------- 4 ------ */
{t:'h2', num:'A.4', text:'The optimal receiver in additive white Gaussian noise — Chapter 4'},
{t:'table', cap:'The results of Chapter 4.', head:['Result','Statement','Source'], rows:[
 ['The receiver','$\\hat{s}=\\arg\\max_i\\Bigl\\{\\mathbf{r}\\!\\cdot\\!\\mathbf{s}_i-\\tfrac{E_i}{2}+\\tfrac{N_0}{2}\\ln P(\\mathbf{s}_i)\\Bigr\\}$. Correlate with each signal. Correct for energy and prior. Select the largest metric.','Ch. 4 &middot; PS CH8.4.1'],
 ['The picture','$\\hat{s}=\\arg\\min_i\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}$. Nearest-point boundaries are perpendicular bisectors. Unequal priors change the region sizes.','Ch. 4 &middot; PS CH8.4.1'],
 ['Binary','$P_e=Q\\!\\left(\\sqrt{d^{2}/2N_0}\\right)$. For two points, the distance gives the exact error probability.','Ch. 4 &middot; PS CH8.3.3'],
 ['M-ary','$P_e\\approx N_{\\min}Q\\!\\left(\\sqrt{d_{\\min}^{2}/2N_0}\\right)$. For larger constellations, nearest neighbours give the dominant error terms.','Ch. 4 &middot; PS CH8.4.2']
]},

/* ---------------------------------------------------------------- 5 ------ */
{t:'h2', num:'A.5', text:'Digital modulation methods — Chapter 5'},
{t:'table', cap:'The results of Chapter 5.', head:['Question','Result','Source'], rows:[
 ['What does a carrier do to the spectrum?','$U(f)=\\tfrac12S(f-f_c)+\\tfrac12S(f+f_c)$. The band doubles to $2W$ and the energy halves.','Ch. 5 &middot; PS CH8.5.1'],
 ['What does the IQ modulator send?','$s(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct)$: one point of the plane a symbol.','Ch. 5 &middot; PS CH8.6, 8.7'],
 ['How do the binary schemes compare?','BPSK: $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. BFSK and BASK: $Q\\bigl(\\sqrt{E_b/N_0}\\bigr)$, $3$ dB worse.','Ch. 5 &middot; PS CH8.3.3, 8.6.1, 9.5'],
 ['What is the M-PSK neighbour distance?','$d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/M)$, and $P_e\\approx2Q\\bigl(\\sqrt{2E_s/N_0}\\sin(\\pi/M)\\bigr)$.','Ch. 5 &middot; PS CH8.6.1, 8.6.3'],
 ['What do Gray labels buy?','Neighbours differ in one bit, so $P_b\\approx P_e/\\log_2M$.','Ch. 5 &middot; PS CH8.6.1, 8.6.3'],
 ['What does DPSK save, and what does it cost?','No carrier phase. $P_b=\\tfrac12e^{-E_b/N_0}$, under $1$ dB behind BPSK.','Ch. 5 &middot; PS CH8.6.4, 8.6.5'],
 ['What is the M-ASK error?','$\\frac{2(M-1)}{M}Q\\bigl(\\sqrt{6E_s/((M^{2}-1)N_0)}\\bigr)$, about $6$ dB a doubling.','Ch. 5 &middot; PS CH8.5.3'],
 ['What is the square-QAM error?','$4(1-1/\\sqrt M)\\,Q\\bigl(\\sqrt{3E_s/((M-1)N_0)}\\bigr)$, with $E_s=(M-1)d^{2}/6$.','Ch. 5 &middot; PS CH8.7.3'],
 ['How much does QAM save over PSK?','$4.20$ dB at $M=16$ and $9.95$ dB at $M=64$.','Ch. 5 &middot; PS CH8.7.3'],
 ['What do M orthogonal signals give?','$M-1$ neighbours at $\\sqrt{2E_s}$. The $E_b/N_0$ needed falls as $M$ grows, toward $-1.6$ dB.','Ch. 5 &middot; PS CH9.1.1, 9.1.2'],
 ['What does noncoherent BFSK need?','Tones $1/T$ apart and an envelope detector. $P_b=\\tfrac12e^{-E_b/2N_0}$.','Ch. 5 &middot; PS CH9.5.2, 9.5.3'],
 ['What is MSK?','BFSK at $\\Delta f=1/(2T_b)$ with a continuous phase. Its envelope is constant.','Ch. 5 &middot; PS CH9.6.1, 9.6.2'],
 ['How wide is each family?','PSK and QAM: $R_b/\\log_2M$. Orthogonal: $MR_b/(2\\log_2M)$.','Ch. 5 &middot; PS CH10.2, 9.7'],
 ['Where does each family sit on the plane?','PAM, PSK and QAM: bandwidth-limited, $r>1$. Orthogonal: power-limited, $r<1$.','Ch. 5 &middot; PS CH9.7']
]},

/* ---------------------------------------------------------------- 6 ------ */
{t:'h2', num:'A.6', text:'An introduction to information theory — Chapter 6'},
{t:'table', cap:'The results of Chapter 6.', head:['Question','Result','Source'], rows:[
 ['How much information does a symbol carry?','$I(s_k)=-\\log_2p_k$ bits: rare symbols carry more.','Ch. 6 &middot; PS CH12.1.1'],
 ['What is entropy, and what bounds it?','$H(S)=-\\sum_kp_k\\log_2p_k$, with $0\\le H\\le\\log_2K$.','Ch. 6 &middot; PS CH12.1.1'],
 ['What does an extended source carry?','$H(S^{n})=nH(S)$ for a memoryless source.','Ch. 6 &middot; PS CH12.1.2'],
 ['What are typical sequences?','About $2^{nH}$ sequences, each of probability near $2^{-nH}$, that hold almost all the probability.','Ch. 6 &middot; PS CH12.2'],
 ['When do codeword lengths allow a prefix code?','Exactly when $\\sum_k2^{-l_k}\\le1$.','Ch. 6'],
 ['How close can a code get to the entropy?','$H\\le\\bar{L}<H+1$, and $H+1/n$ for blocks of $n$.','Ch. 6 &middot; PS CH12.3.1'],
 ['How is a Huffman code built?','Merge the two least likely entries until one is left, then read each codeword back.','Ch. 6 &middot; PS CH12.3.1'],
 ['What does Lempel–Ziv need to know about the source?','Nothing. It parses the stream into new phrases, and its cost falls toward $H$ as the stream grows.','Ch. 6 &middot; PS CH12.3.2'],
 ['What is a binary symmetric channel?','Each bit flips with probability $p$. Hard-decision BPSK gives $p=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.','Ch. 6 &middot; PS CH12.4'],
 ['What is mutual information?','$I(X;Y)=H(X)-H(X\\mid Y)$, symmetric and never negative.','Ch. 6 &middot; PS CH12.1.3'],
 ['What is the capacity of a channel?','$C=\\max_{p(x)}I(X;Y)$: $1-H_b(p)$ for the BSC, $1-\\epsilon$ for the erasure channel.','Ch. 6 &middot; PS CH12.5'],
 ['What does the channel coding theorem say?','Rates below $C$ can be made reliable. Rates above it cannot.','Ch. 6 &middot; PS CH12.5'],
 ['What is the capacity of a bandlimited channel?','$C=W\\log_2(1+P/N_0W)$ b/s, which levels off at $1.44\\,P/N_0$ as $W$ grows.','Ch. 6 &middot; PS CH12.5.1'],
 ['What is the Shannon limit?','$E_b/N_0>\\ln2=-1.59$ dB. Uncoded BPSK sits $11.2$ dB above it.','Ch. 6 &middot; PS CH12.6']
]}

];
})();
