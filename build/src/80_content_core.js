/* ==========================================================================
   COURSE CONTENT — the shared constants every other content file reads.

   This file holds what is true of the course as a whole: its identity, the
   module list the contents rail filters on, the notation glossary, the two
   conventions fixed for the whole artifact, and the mark that tells this
   course's chapter numbers apart from the textbook's.

   Addresses and textbook anchors are not here. They are declared once in
   `89_sections.js` and derived onto the scenes at load time.
   ========================================================================== */
const CONTENT = {

  META: {
    course:'Digital Communications',
    title:'Digital Communications',
    version:'1.0',
    language:'Academic English',
    /* Both are stated once on the page, in the scene where they are first
       needed, and repeated here so the conventions panel can show them without
       the reader having to find that scene again.

       The first is where the factor-of-two errors in this material come from.
       A one-sided density N_0 and a two-sided density N_0/2 describe the same
       noise, and an expression written for one convention and read in the
       other is wrong by exactly √2 inside the Q. */
    conventions:{
      noise:'\\text{White Gaussian noise, two-sided PSD }\\;S_n(f)=\\tfrac{N_0}{2}',
      q:'Q(x)=\\frac{1}{\\sqrt{2\\pi}}\\int_{x}^{\\infty}e^{-t^{2}/2}\\,\\mathrm{d}t=\\tfrac12\\operatorname{erfc}\\!\\left(\\tfrac{x}{\\sqrt2}\\right)',
      energy:'Normalised (R = 1 Ω) energy and power throughout. Signal energy is written $E$, energy per bit $E_b$, energy per symbol $E_s$.',
      log:'Logarithms in information theory are base two, so entropy is in bits. Where a natural logarithm is meant it is written explicitly.'
    }
  },

  MODULES: [
    { id:'M0', title:'The Frame of the Course' },
    { id:'M1', title:'Sampling, Quantization and PCM' },
    { id:'M2', title:'Baseband Transmission' },
    { id:'M3', title:'Geometric Representation of Signals' },
    { id:'M4', title:'The Optimal Receiver in AWGN' },
    { id:'M5', title:'Digital Modulation Methods' },
    { id:'M6', title:'An Introduction to Information Theory' }
  ],

  /* ---- the textbook mark ----
     The short form that prefixes every rendered anchor, and the full statement
     of what it points into. The full form is printed once, in the scene that
     introduces the convention, and nowhere else.

     The mark is not decorative. This course's chapter numbers and the
     textbook's do not agree — the course reaches information theory in its
     chapter 10 and the textbook develops it in chapter 12 — so an anchor is
     never rendered as a bare chapter number. */
  BOOKMARK:'PS',
  BOOKREF:'Proakis and Salehi, <i>Fundamentals of Communication Systems</i>, 2nd edition',

  /* On screen the mark is an open book rather than the letters. It is drawn
     here, once, as inline SVG in `currentColor`: the artifact is one offline
     file, so an icon cannot be fetched, and a glyph from a font cannot be
     relied on to exist. In the printed notes the letters stay, because a rule
     in a contents column at eight point is read, not looked at. */
  BOOKICON:
    '<svg class="ebicon" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" focusable="false">'
  + '<path d="M8 4.4C7.2 3.5 6 3 4.6 3H2v9.1h2.6c1.4 0 2.6.5 3.4 1.4" '
  + 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>'
  + '<path d="M8 4.4C8.8 3.5 10 3 11.4 3H14v9.1h-2.6c-1.4 0-2.6.5-3.4 1.4" '
  + 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>'
  + '<path d="M8 4.4v9.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  + '</svg>',

  /* ---- notation glossary; every symbol defined once, linked from prose ----
     `go` names the scene where the symbol is introduced. An entry with no `go`
     is one whose scene is not written yet. */
  /* Every symbol the course defines, in the order the course defines them. A
     symbol is never reused for a second meaning, and where two courses would
     disagree — sinc, the noise density, the base of a logarithm — the entry
     says which convention is in force. */
  GLOSS: {
    /* Chapter 1 */
    fs:{ s:'f_s,\\;T_s', d:'Sampling rate in hertz and the interval between samples, $T_s=1/f_s$.' },
    W:{ s:'W', d:'The highest frequency present in a message. The sampling theorem asks for $f_s>2W$.' },
    sinc:{ s:'\\operatorname{sinc}(x)', d:'Normalised: $\\sin(\\pi x)/(\\pi x)$, with zeros at every non-zero integer.' },
    Delta:{ s:'\\Delta,\\;L,\\;n', d:'Quantizer step, number of levels and bits a sample, with $L=2^{n}$ and $\\Delta=2V/L$ over a range $\\pm V$.' },
    sq:{ s:'\\sigma_q^{2}', d:'Quantization noise power, $\\Delta^{2}/12$ for a uniform quantizer.' },

    /* Chapter 2 */
    T:{ s:'T,\\;R', d:'Symbol interval and the rate that follows from it. A bit interval is written $T_b$ and a bit rate $R_b$.' },
    p:{ s:'p(t),\\;h(t)', d:'The transmitted pulse and the impulse response of the receive filter. The matched filter is $h(t)=p(T-t)$.' },
    alpha:{ s:'\\alpha', d:'Roll-off of a raised-cosine pulse, from $0$ to $1$. Bandwidth is $(1+\\alpha)/2T$.' },

    /* Chapter 3 */
    psi:{ s:'\\psi_k(t)', d:'The $k$-th orthonormal basis function, from the Gram–Schmidt procedure applied to the signal set.' },
    si:{ s:'s_i(t),\\;\\mathbf{s}_i', d:'The $i$-th transmitted waveform, and the point in signal space whose coordinates are its projections onto the basis.' },
    E:{ s:'E,\\;E_i', d:'Signal energy, normalised so that no resistance appears: $E_i=\\|\\mathbf{s}_i\\|^{2}$.' },
    d:{ s:'d_{ij},\\;d_{\\min}', d:'Distance between two signal points, and the smallest such distance in a constellation.' },

    /* Chapter 4 */
    r:{ s:'r(t),\\;\\mathbf{r}', d:'The received waveform and the observation vector it produces, $\\mathbf{r}=\\mathbf{s}_i+\\mathbf{n}$.' },
    N0:{ s:'N_0', d:'Noise power spectral density parameter. The two-sided density is $N_0/2$ watts per hertz, and each noise component is $\\mathcal{N}(0,N_0/2)$.' },
    Q:{ s:'Q(x)', d:'The Gaussian tail: the probability that a standard normal variable exceeds $x$. Equal to $\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$.' },
    M:{ s:'M,\\;N', d:'The number of signals in the set, and the number of basis functions they need. $M$ signals carry $\\log_2 M$ bits a symbol.' },
    Nmin:{ s:'N_{\\min}', d:'The average number of signal points at the minimum distance. An average, so not usually a whole number.' },
    Pb:{ s:'P_b,\\;P_e,\\;P_s', d:'Bit error probability, error probability in general, and symbol error probability.' },

    /* Chapter 5 */
    Eb:{ s:'E_b,\\;E_s', d:'Energy per information bit and energy per transmitted symbol, with $E_s=(\\log_2 M)E_b$.' },
    fc:{ s:'f_c', d:'Carrier frequency. Every scheme in Chapter 5 changes the amplitude, the phase or the frequency of $\\cos(2\\pi f_ct)$.' },

    /* Chapter 6 */
    S:{ s:'S,\\;K,\\;p_k', d:'The source alphabet, how many symbols it has, and the probability of the $k$-th.' },
    I:{ s:'I(s_k)', d:'Self-information of one symbol, $-\\log_2 p_k$ bits.' },
    H:{ s:'H(S)', d:'Entropy: the average information a symbol carries, in bits a symbol. Bounded by $0$ and $\\log_2 K$.' },
    Lbar:{ s:'\\bar{L},\\;l_k', d:'Average codeword length and the length of the codeword for symbol $k$.' },
    eta:{ s:'\\eta', d:'Coding efficiency, $H(S)/\\bar{L}$. Never above one.' },
    sig2:{ s:'\\sigma^{2}', d:'Variance of the codeword length about $\\bar{L}$. Separates two Huffman codes that share an average.' }
  },

  /* ---- practice questions: open-ended, in the form they are asked in ----
     DRILL holds the questions themselves, one flat array populated by the
     module drill files. DRILLTYPES holds, per module, the recurring question
     types those questions are drawn from: what each type asks for, the method
     that answers it, and the scene where that method is taught. */
  DRILL: [],
  DRILLTYPES: {}
};
