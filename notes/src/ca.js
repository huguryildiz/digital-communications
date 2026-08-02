/* Course notes — Appendix A.

   Every formula the course establishes, in the order it establishes them, with
   no derivations. `editions.js` slices this file at the APPENDIX heading and
   makes it Part 2 of the Formula and Notation Reference, so the appendix and
   that part are one source rather than two copies to keep in step. */
(function(){

window.CA = [

{t:'h1', num:'APPENDIX A', text:'Summary of formulas'},
{t:'p', lead:true, text:'Everything the course establishes, in the order it establishes it. Nothing here is derived — where a result needs an argument, the argument is in the chapter named beside it.'},

/* ---------------------------------------------------------------- 1 ------ */
{t:'h2', num:'A.1', text:'From an analog signal to bits — Chapter 1'},
{t:'eqbox', cap:'Sampling and reconstruction', tex:[
 'f_s>2W\\quad\\text{(the sampling theorem, }W\\text{ the highest frequency present)}',
 'x(t)=\\sum_{n=-\\infty}^{\\infty}x(nT_s)\\,\\operatorname{sinc}\\!\\left(\\frac{t-nT_s}{T_s}\\right)'],
 after:'Below the Nyquist rate the replicas of the spectrum overlap and the overlap cannot be undone. $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$ throughout this course.'},
{t:'eqbox', cap:'Uniform quantization', tex:[
 '\\Delta=\\frac{2V}{L}=\\frac{2V}{2^{n}},\\qquad |e|\\le\\frac{\\Delta}{2}',
 '\\sigma_q^{2}=\\frac{\\Delta^{2}}{12},\\qquad \\mathrm{SQNR}\\big|_{\\mathrm{dB}}=6.02n+1.76'],
 after:'The $1.76$ assumes a full-scale sinusoid. The formula is an approximation at small $n$: at three bits it gives $19.82$ dB where the measured value is $19.09$ dB, and the gap halves with each extra bit.'},
{t:'table', head:['Result','Statement','Chapter'], rows:[
 ['Companding','$\\mu$-law and A-law compress before quantizing so that the signal-to-noise ratio is flat across the range','1'],
 ['PCM rate','$R=nf_s$ bits a second for $n$ bits a sample','1']
]},

/* ---------------------------------------------------------------- 2 ------ */
{t:'h2', num:'A.2', text:'Baseband transmission — Chapter 2'},
{t:'eqbox', cap:'The matched filter', tex:[
 'h(t)=s(T-t),\\qquad \\left(\\frac{S}{N}\\right)_{\\max}=\\frac{2E}{N_0}'],
 after:'The filter matched to the pulse maximises the signal-to-noise ratio at the sampling instant, and the maximum depends on the energy of the pulse and not on its shape.'},
{t:'eqbox', cap:'Binary error probability at baseband', tex:[
 'P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)\\ \\text{(antipodal)},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)\\ \\text{(on-off, orthogonal)}']},
{t:'eqbox', cap:'Nyquist criterion for zero intersymbol interference', tex:[
 '\\sum_{k}P\\!\\left(f+\\frac{k}{T}\\right)=T\\quad\\text{for all }f',
 'B=\\frac{1+\\alpha}{2T},\\qquad 0\\le\\alpha\\le 1'],
 after:'The raised cosine meets the criterion for every roll-off $\\alpha$. At $\\alpha=0$ the bandwidth is the Nyquist minimum $1/2T$ and the pulse decays slowly; at $\\alpha=1$ it is twice that and the pulse decays quickly.'},

/* ---------------------------------------------------------------- 3 ------ */
{t:'h2', num:'A.3', text:'Signal space — Chapter 3'},
{t:'eqbox', cap:'A signal as a point', tex:[
 's_i(t)=\\sum_{k=1}^{N}s_{ik}\\psi_k(t),\\qquad s_{ik}=\\int_0^{T}s_i(t)\\psi_k(t)\\,dt',
 'E_i=\\|\\mathbf{s}_i\\|^{2}=\\sum_{k=1}^{N}s_{ik}^{2},\\qquad d_{ij}=\\|\\mathbf{s}_i-\\mathbf{s}_j\\|'],
 after:'The basis $\\{\\psi_k\\}$ is orthonormal and comes from the Gram–Schmidt procedure applied to the signal set. Energy becomes a squared length and difference becomes a distance, which is the move the rest of the course rests on.'},

/* ---------------------------------------------------------------- 4 ------ */
{t:'h2', num:'A.4', text:'The optimal receiver — Chapter 4'},
{t:'eqbox', cap:'The decision rule', tex:[
 '\\hat{s}=\\arg\\min_i\\Bigl\\{\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}-N_0\\ln P(\\mathbf{s}_i)\\Bigr\\}\\quad\\text{(MAP)}',
 '\\hat{s}=\\arg\\min_i\\|\\mathbf{r}-\\mathbf{s}_i\\|^{2}\\quad\\text{(ML, equal priors)}'],
 after:'With equal priors the rule is minimum distance. The equivalent correlation form is to maximise $\\mathbf{r}\\cdot\\mathbf{s}_i-E_i/2$.'},
{t:'eqbox', cap:'Error probability', tex:[
 'P(\\mathbf{s}_k\\to\\mathbf{s}_j)=Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right)',
 'P_e\\le\\frac{1}{M}\\sum_{k}\\sum_{j\\ne k}Q\\!\\left(\\sqrt{\\frac{d_{kj}^{2}}{2N_0}}\\right),\\qquad P_e\\approx N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'],
 after:'The first is exact for two points. The second is the union bound, and the third its nearest-neighbour form, where $N_{\\min}$ is the <em>average</em> number of points at the minimum distance and need not be a whole number. The loose form $P_e\\le(M-1)Q(\\cdot)$ needs only $M$ and $d_{\\min}$.'},

/* ---------------------------------------------------------------- 5 ------ */
{t:'h2', num:'A.5', text:'Digital modulation — Chapter 5'},
{t:'table', head:['Scheme','$d_{\\min}^{2}$','$N_{\\min}$'], rows:[
 ['BPSK','$4E_b$','$1$'],
 ['BFSK, BASK','$2E_b$','$1$'],
 ['$M$-PSK','$4E_s\\sin^{2}(\\pi/M)$','$2$'],
 ['$M$-PAM','$12E_s/(M^{2}-1)$','$2(M-1)/M$'],
 ['$M$-QAM (square)','$6E_s/(M-1)$','$3$ at $M=16$, $3.5$ at $M=64$'],
 ['$M$-FSK','$2E_s$ for every pair','$M-1$']
]},
{t:'eqbox', cap:'Reading the table', tex:[
 'P_e\\approx N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right),\\qquad E_s=(\\log_2 M)E_b'],
 after:'Convert once between symbol and bit energy and never twice. BFSK and BASK need $3.01$ dB more than BPSK for the same error probability; doubling $M$ costs about $6$ dB in PAM and about $5.33$ dB going from $4$-PSK to $8$-PSK; and $16$-QAM beats $16$-PAM by $9.29$ dB at the same energy.'},

/* ---------------------------------------------------------------- 6 ------ */
{t:'h2', num:'A.6', text:'Information theory — Chapter 6'},
{t:'eqbox', cap:'Information and entropy', tex:[
 'I(s_k)=-\\log_2 p_k,\\qquad H(S)=-\\sum_{k=1}^{K}p_k\\log_2 p_k',
 '0\\le H(S)\\le\\log_2 K,\\qquad H(S^{n})=n\\,H(S)'],
 after:'The upper bound is reached when all $K$ symbols are equally likely. The extension result holds because the source is memoryless.'},
{t:'eqbox', cap:'Source coding', tex:[
 '\\bar{L}=\\sum_{k=1}^{K}p_k l_k,\\qquad \\eta=\\frac{H(S)}{\\bar{L}}\\le 1',
 '\\sum_{k=1}^{K}2^{-l_k}\\le 1,\\qquad H(S)\\le\\bar{L}< H(S)+1'],
 after:'The Kraft inequality is necessary but not sufficient for a prefix code. Over the $n$-th extension the upper bound becomes $H(S)+1/n$, so $L_n/n\\to H(S)$.'},
{t:'eqbox', cap:'Huffman codes', tex:[
 '\\sigma^{2}=\\sum_{k=1}^{K}p_k\\bigl(l_k-\\bar{L}\\bigr)^{2}'],
 after:'Huffman is optimal in average length and is not unique. Placing a merged symbol as high as possible on a tie gives the minimum-variance code among the optimal ones.'}

];
})();
