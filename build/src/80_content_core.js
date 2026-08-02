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
    course:'EE 413',
    title:'Digital Communications',
    version:'0.1',
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
  GLOSS: {
    N0:{ s:'N_0', d:'Noise power spectral density parameter. The two-sided density is N₀/2 watts per hertz.' },
    Q:{ s:'Q(x)', d:'The Gaussian tail: the probability that a standard normal variable exceeds x.' },
    Eb:{ s:'E_b,\\;E_s', d:'Energy per information bit and energy per transmitted symbol.' },
    Pb:{ s:'P_b,\\;P_e', d:'Bit error probability and symbol error probability.' }
  },

  /* ---- practice questions: open-ended, in the form they are asked in ----
     DRILL holds the questions themselves, one flat array populated by the
     module drill files. DRILLTYPES holds, per module, the recurring question
     types those questions are drawn from: what each type asks for, the method
     that answers it, and the scene where that method is taught. */
  DRILL: [],
  DRILLTYPES: {}
};
