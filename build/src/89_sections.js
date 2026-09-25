/* ==========================================================================
   NUMBERING — the contents address of every scene, and its textbook anchor.

   Two independent things live here, and they answer different questions.

   The address (`sec`) says where a scene sits in this course: chapter, section,
   scene. The chapters are the ones the lecture notes already carry, so the
   artifact and the notes name the same material the same way.

   The anchor (`book`) says where the same material is developed at length in
   the course textbook. It is a reference and nothing more: no title, no
   sentence and no figure is taken from there.

   Both are declared once, here, and derived onto the scene objects at load
   time by `applyNumbering`. No scene file carries either field, so a
   renumbering is an edit to this file alone.

   The two numbering systems do not agree, and in one place they disagree
   dangerously: this course's chapter 10 is information theory, and the
   textbook's chapter 10 is transmission through bandlimited channels. A reader
   who follows a bare "CH10" into the book lands somewhere unrelated. The mark
   in `CONTENT.BOOKMARK` is what keeps the two apart on the page, and it is not
   optional in any surface.
   ========================================================================== */
(function(){

/* ---- chapters ----------------------------------------------------------
   `flat:true` marks a chapter with no section level: its scenes are numbered
   two-part. Chapter 0 is the course opening, short enough that a section level
   would be an empty frame. */
CONTENT.CHAPTERS = [
  { n:'0', module:'M0', title:'Why digital communications?', flat:true },
  { n:'1', module:'M1', title:'The transition from analog to digital' },
  { n:'2', module:'M2', title:'Baseband transmission of digital signals' },
  { n:'3', module:'M3', title:'Geometric representation of signal waveforms' },
  { n:'4', module:'M4', title:'The optimal receiver in AWGN' },
  { n:'5', module:'M5', title:'Digital modulation methods' },
  { n:'6', module:'M6', title:'An introduction to information theory' }
];

/* ---- sections ----------------------------------------------------------
   Per module, in scene order: the section number, its title, and the scene ids
   it holds. A laboratory is listed inside the section whose material it
   exercises but takes a laboratory number rather than an ordinal, so the
   ordinals of the teaching scenes around it stay unbroken.

   A flat chapter lists its scenes under a single entry with no title. The
   artifact cover is deliberately absent: it takes no address. */
CONTENT.SECTIONS = {

  M0: [
    { n:'0', ids:['m0-system','m0-digital','m0-open','m0-why','m0-examples','m0-apps','m0-books','m0-map','m0-howto'] }
  ],

  M1: [
    { n:'1.0', title:'Opening',                        ids:['m1-open'] },
    { n:'1.1', title:'The sampling theorem',           ids:[
        'm1-ft-review','m1-sampler','m1-spectrum','m1-spectrum-b','m1-cases','m1-theorem','m1-moire','m1-real-sampling','m1-lab-l','m1-code-sampling'] },
    { n:'1.2', title:'Reconstruction',                 ids:[
        'm1-lpf','m1-lpf-b','m1-interp','m1-interp-b','m1-ex-nyquist','m1-ex-nyquist-b','m1-real-reconstruct','m1-lab-m','m1-code-reconstruct'] },
    { n:'1.3', title:'Quantization',                   ids:[
        'm1-quant','m1-quant-b','m1-quant-walk','m1-lloydmax','m1-overload','m1-real-quant','m1-lab-n','m1-code-quant'] },
    { n:'1.4', title:'Quantization noise and SQNR',    ids:[
        'm1-qnoise','m1-qnoise-b','m1-qnoise-c','m1-sqnr','m1-sqnr-def','m1-ex-cos','m1-ex-unif','m1-ex-gauss','m1-sqnr-sources','m1-hear-bits','m1-dither','m1-real-sqnr','m1-lab-a','m1-code-sqnr'] },
    { n:'1.5', title:'Non-uniform quantization',       ids:[
        'm1-nonuniform','m1-compander','m1-companding','m1-hear-mu','m1-real-companding','m1-lab-o','m1-code-companding'] },
    { n:'1.6', title:'PCM, DPCM and delta modulation', ids:[
        'm1-encode','m1-linecodes','m1-ex-pcm','m1-ex-pcm-s','m1-ex-pcm-b','m1-pcm-bw','m1-biterror','m1-dpcm','m1-dm','m1-real-pcm','m1-lab-b','m1-code-pcm'] },
    { n:'1.7', title:'Vector quantization',            ids:['m1-vq','m1-vq-image'] },
    { n:'1.8', title:'Speech, audio and image coding', ids:['m1-lpc','m1-t1','m1-sigmadelta','m1-jpeg'] },
    { n:'1.9', title:'Summary',                        ids:['m1-chain','m1-quick','m1-synth','m1-projects'] }
  ],

  M2: [
    { n:'2.0', title:'Opening',                        ids:['m2-open'] },
    { n:'2.1', title:'The matched filter',             ids:[
        'm2-receiver','m2-model','m2-schwarz','m2-matched','m2-conv','m2-props','m2-ex-mf','m2-real-matched','m2-lab-c','m2-code-matched'] },
    { n:'2.2', title:'The demodulator',                ids:[
        'm2-basis','m2-space','m2-demod','m2-correlator','m2-real-demod','m2-lab-p','m2-code-demod'] },
    { n:'2.3', title:'The decision and its error',     ids:[
        'm2-stat','m2-errors','m2-threshold','m2-threshold-b','m2-q','m2-pe','m2-ex-pe','m2-ex-pe-b','m2-real-decision','m2-lab-d','m2-code-decision'] },
    { n:'2.4', title:'Intersymbol interference',       ids:[
        'm2-isi','m2-isi-term','m2-ex-isi','m2-eye','m2-eye-close','m2-eye-noise','m2-real-isi','m2-lab-q','m2-code-isi'] },
    { n:'2.5', title:'Nyquist and the raised cosine',  ids:[
        'm2-nyq-sinc','m2-nyquist','m2-nyq-channel','m2-sinc-timing','m2-rcos','m2-rcos-pulse','m2-ex-rc','m2-srrc','m2-real-nyquist','m2-lab-e','m2-code-nyquist'] },
    { n:'2.6', title:'The link in practice',           ids:['m2-equalizer','m2-timing','m2-psd','m2-repeater'] },
    { n:'2.7', title:'Summary',                        ids:['m2-chain','m2-quick','m2-synth','m2-projects'] }
  ],

  M3: [
    { n:'3.0', title:'Opening',                        ids:['m3-open'] },
    { n:'3.1', title:'Signals as vectors',             ids:[
        'm3-twoaxes','m3-ortho','m3-project','m3-analyzer','m3-inner','m3-energy','m3-ex-inspect',
        'm3-real-vectors','m3-lab-r','m3-code-vectors'] },
    { n:'3.2', title:'Constellations',                 ids:[
        'm3-constellation','m3-binary','m3-passband','m3-ex-qpsk','m3-remarks','m3-psk',
        'm3-real-constellation','m3-lab-s','m3-code-constellation'] },
    { n:'3.3', title:'The Gram–Schmidt procedure',     ids:[
        'm3-gs','m3-ex-gs','m3-ex-gs-b','m3-basis-change','m3-real-gs','m3-lab-f','m3-code-gs'] },
    { n:'3.4', title:'Summary',                        ids:['m3-chain','m3-quick','m3-synth','m3-projects'] }
  ],

  M4: [
    { n:'4.0', title:'Opening',                        ids:['m4-open'] },
    { n:'4.1', title:'The observation',                ids:['m4-observe','m4-noise'] },
    { n:'4.2', title:'The decision rule',              ids:['m4-map','m4-mindist','m4-metric'] },
    { n:'4.3', title:'Decision regions',               ids:['m4-regions','m4-binary','m4-lab-g'] },
    { n:'4.4', title:'The union bound',                ids:[
        'm4-pe','m4-union','m4-dmin','m4-intel','m4-ex-union','m4-ex-union-b'] },
    { n:'4.5', title:'Summary',                        ids:['m4-synth'] }
  ],

  M5: [
    { n:'5.0', title:'Opening',                        ids:['m5-open'] },
    { n:'5.1', title:'Putting bits on a carrier',      ids:[
        'm5-carrier','m5-iq','m5-bpsk','m5-bfsk','m5-bask','m5-binary-pe','m5-ex-binary',
        'm5-real-binary','m5-lab-iq','m5-code-binary'] },
    { n:'5.2', title:'Phase-shift keying',             ids:[
        'm5-mpsk','m5-qpsk','m5-psk-detect','m5-mpsk-pe','m5-gray','m5-ex-psk','m5-phase-offset',
        'm5-dpsk','m5-dpsk-pe','m5-real-psk','m5-lab-gray','m5-code-psk'] },
    { n:'5.3', title:'Amplitude and quadrature',       ids:[
        'm5-mask','m5-ex-ask4','m5-qam','m5-qam-pe','m5-qam-shapes','m5-ex-qam16','m5-qam-vs-psk',
        'm5-real-qam','m5-lab-h','m5-code-qam'] },
    { n:'5.4', title:'Frequency-shift keying and orthogonal signals', ids:[
        'm5-mfsk','m5-orth-m','m5-noncoh','m5-real-fsk','m5-lab-fsk','m5-code-fsk'] },
    { n:'5.5', title:'Bandwidth and the choice of scheme', ids:[
        'm5-spectrum','m5-msk','m5-plane','m5-compare','m5-adaptive','m5-noise-floor','m5-budget',
        'm5-ex-link','m5-real-choice','m5-lab-plane','m5-code-compare'] },
    { n:'5.6', title:'Summary',                        ids:['m5-chain','m5-quick','m5-synth','m5-projects'] }
  ],

  M6: [
    { n:'6.0', title:'Opening',                        ids:['m6-open'] },
    { n:'6.1', title:'Information and entropy',        ids:[
        'm6-selfinfo','m6-questions','m6-entropy','m6-hb','m6-ex-rate','m6-extension',
        'm6-real-entropy','m6-lab-i','m6-code-entropy'] },
    { n:'6.2', title:'The limits of compression',      ids:[
        'm6-coding','m6-typical','m6-source-thm','m6-prefix','m6-kraft','m6-bound','m6-rd',
        'm6-real-codes','m6-lab-typical','m6-code-bound'] },
    { n:'6.3', title:'Huffman and Lempel–Ziv coding', ids:[
        'm6-huffman','m6-huffman-var','m6-huffman-ext','m6-arith','m6-lz','m6-lz-long',
        'm6-real-compress','m6-lab-j','m6-code-huffman'] },
    { n:'6.4', title:'Channels and mutual information', ids:[
        'm6-dmc','m6-inputdist','m6-bsc','m6-joint','m6-condent','m6-mutual','m6-mutual-props',
        'm6-real-info','m6-lab-mi','m6-code-channel'] },
    { n:'6.5', title:'Channel capacity',               ids:[
        'm6-capacity','m6-bsc-cap','m6-bec','m6-ex-zchannel','m6-ex-symmetric','m6-why-capacity',
        'm6-repetition','m6-coding-thm','m6-codes-glimpse','m6-transmission','m6-real-capacity',
        'm6-lab-k','m6-code-capacity'] },
    { n:'6.6', title:'The Gaussian channel',           ids:[
        'm6-awgn','m6-shannon','m6-ex-phone','m6-bandwidth','m6-plane','m6-limit','m6-waterfill',
        'm6-real-shannon','m6-lab-wf','m6-code-gauss'] },
    { n:'6.7', title:'Summary',                        ids:['m6-chain','m6-quick','m6-synth','m6-projects'] }
  ]

};

/* ---- textbook anchors --------------------------------------------------
   Scene id to the textbook section that develops the same material. A scene
   resting on two places names both. A scene with no counterpart — the course
   opening, the concept map, the closing material — is simply absent from this
   table and renders no anchor. */
CONTENT.BOOK = {
  /* Chapter 7 of the book and CH7 of this course cover the same ground, so the
     numbers happen to agree here. Every one of these was read in the book
     before it was written down; none was inferred from the chapter number, and
     the agreement in this chapter is not a licence to infer the next one.

     The line-code scene carries no anchor. This book does not develop line
     codes, and an anchor pointing at the nearest-looking section would be worse
     than none: it would be well formed and wrong, which is the one failure the
     marker cannot catch.

     The Fourier transform review carries none either. It restates material
     from the preceding course, which the book assumes rather than develops. */
  'm1-open':'7.1',
  'm1-sampler':'7.1.1', 'm1-spectrum':'7.1.1', 'm1-spectrum-b':'7.1.1', 'm1-real-sampling':'7.1.1', 'm1-cases':'7.1.1', 'm1-theorem':'7.1.1',
  'm1-lpf':'7.1.1', 'm1-lpf-b':'7.1.1', 'm1-interp':'7.1.1', 'm1-interp-b':'7.1.1',
  'm1-ex-nyquist':'7.1.1', 'm1-ex-nyquist-b':'7.1.1', 'm1-real-reconstruct':'7.1.1',
  'm1-quant':'7.2.1', 'm1-quant-b':'7.2.1', 'm1-quant-walk':'7.2.1', 'm1-lloydmax':'7.2.1', 'm1-real-quant':'7.2.1', 'm1-lab-a':'7.2.1',
  'm1-lab-l':'7.1.1', 'm1-lab-m':'7.1.1', 'm1-lab-n':'7.2.1', 'm1-lab-o':'7.2.1',
  'm1-qnoise':'7.2.1', 'm1-qnoise-b':'7.2.1', 'm1-qnoise-c':'7.2.1', 'm1-sqnr':'7.2.1', 'm1-sqnr-def':'7.2.1', 'm1-real-sqnr':'7.2.1',
  'm1-ex-cos':'7.2.1', 'm1-ex-unif':'7.2.1', 'm1-ex-gauss':'7.2.1', 'm1-sqnr-sources':'7.2.1',
  'm1-nonuniform':'7.2.1', 'm1-compander':'7.2.1', 'm1-companding':'7.2.1', 'm1-real-companding':'7.2.1',
  'm1-overload':'7.2.1', 'm1-hear-mu':'7.4.1',
  /* Waveform coding beyond plain PCM, each read in the book: 7.4.1 closes on
     the bandwidth a PCM system needs, 7.3 defines natural binary and Gray
     coding, 7.4.2 is DPCM and 7.4.3 delta modulation. Section 1.8 follows the
     book's 7.5 (LPC), 7.6.1 (telephone TDM and the T1 hierarchy), 7.6.2 (the
     CD player's oversampling and sigma-delta converter) and 7.7 (JPEG). The
     chain that closes the module is the PCM block diagram of 7.4.1. The
     aliasing-in-an-image, hearing and dither scenes carry no anchor: the book
     does not develop them. */
  'm1-pcm-bw':'7.4.1', 'm1-biterror':'7.3', 'm1-dpcm':'7.4.2', 'm1-dm':'7.4.3',
  'm1-lpc':'7.5', 'm1-t1':'7.6.1', 'm1-sigmadelta':'7.6.2', 'm1-jpeg':'7.7', 'm1-chain':'7.4.1',
  'm1-encode':'7.3', 'm1-ex-pcm':'7.4.1', 'm1-ex-pcm-s':'7.4.1', 'm1-ex-pcm-b':'7.4.1', 'm1-real-pcm':'7.4', 'm1-lab-b':'7.4',
  /* Vector quantization is section 7.2.2 of the book, "Vector Quantization",
     p. 309 — read there, not inferred from the neighbouring section number. */
  'm1-vq':'7.2.2', 'm1-vq-image':'7.2.2',
  'm1-quick':'7.4.1', 'm1-synth':'7.4.1', 'm1-projects':'7.4.1',

  /* Module 2 spans two chapters of the book, and that is not an accident of
     this course's numbering: the matched filter, the demodulators and the error
     probability are chapter 8, while intersymbol interference, the Nyquist
     criterion and the raised cosine are developed in chapter 10. Each was read
     in the book before it was written here.

     The two eye-pattern scenes carry no anchor. The book does describe the eye
     pattern, but not under a heading this module can point at without guessing,
     and a well-formed wrong anchor is the one failure the marker cannot catch.
     The code pages carry none, as in Module 1. */
  'm2-open':'8.3',
  'm2-receiver':'8.3.2', 'm2-model':'8.3.2', 'm2-schwarz':'8.3.2', 'm2-matched':'8.3.2', 'm2-conv':'8.3.2', 'm2-props':'8.3.2',
  'm2-ex-mf':'8.3.2', 'm2-real-matched':'8.3.2', 'm2-lab-c':'8.3.2',
  'm2-basis':'8.2.1', 'm2-space':'8.2.1', 'm2-demod':'8.3.1', 'm2-correlator':'8.3.1', 'm2-real-demod':'8.3.1', 'm2-lab-p':'8.3.1',
  'm2-stat':'8.3.3', 'm2-errors':'8.3.3', 'm2-threshold':'8.3.3', 'm2-threshold-b':'8.3.3', 'm2-q':'8.3.3', 'm2-pe':'8.3.3',
  'm2-ex-pe':'8.3.3', 'm2-ex-pe-b':'8.3.3', 'm2-real-decision':'8.3.3', 'm2-lab-d':'8.3.3',
  'm2-isi':'10.1.1', 'm2-isi-term':'10.1.1', 'm2-ex-isi':'10.1.1', 'm2-real-isi':'10.1.1', 'm2-lab-q':'10.1.1',
  'm2-nyq-sinc':'10.3.1', 'm2-nyquist':'10.3.1', 'm2-nyq-channel':'10.3.1', 'm2-sinc-timing':'10.3.1',
  'm2-rcos':'10.3.1', 'm2-rcos-pulse':'10.3.1', 'm2-ex-rc':'10.3.1', 'm2-real-nyquist':'10.3.1', 'm2-lab-e':'10.3.1',
  /* Splitting the raised cosine between the two ends is 10.5.1, "Design of
     Transmitting and Receiving Filters for a Known Channel", read there. */
  'm2-srrc':'10.5.1',
  /* Section 2.6 is a survey of what a real link adds, read in the book at
     10.5.2 (channel equalization), 8.9.1 (early-late gate synchronizers), 10.2
     (the power spectrum of digitally modulated signals) and 8.10 (regenerative
     repeaters). The noisy eye in 2.4 carries no anchor, like the other eye
     scenes. */
  'm2-equalizer':'10.5.2', 'm2-timing':'8.9.1', 'm2-psd':'10.2', 'm2-repeater':'8.10',
  'm2-chain':'8.3', 'm2-quick':'8.3, 10.3.1', 'm2-synth':'8.3, 10.3.1', 'm2-projects':'8.3, 10.3.1',

  /* Module 3 is section 8.1 of the book, "Geometric Representation of Signal
     Waveforms", p. 348, with two excursions, each read there: the binary
     sets as points are 8.2 (8.2.1 antipodal, 8.2.2 orthogonal signalling),
     and the cosine and sine basis and the points on a circle are 8.6.1,
     "Geometric Representation of PSK Signals". The worked example with four
     signals and three axes is the book's own Example 8.1.1, and the change of
     basis its closing remark on Figure 8.3. The galleries of real systems and
     the code pages carry no anchor beyond their section's, as in Module 2. */
  'm3-open':'8.1', 'm3-twoaxes':'8.1', 'm3-ortho':'8.1', 'm3-project':'8.1', 'm3-analyzer':'8.1',
  'm3-inner':'8.1', 'm3-energy':'8.1', 'm3-ex-inspect':'8.1', 'm3-real-vectors':'8.1', 'm3-lab-r':'8.1',
  'm3-constellation':'8.1', 'm3-binary':'8.2', 'm3-passband':'8.6.1', 'm3-ex-qpsk':'8.6.1',
  'm3-remarks':'8.1', 'm3-psk':'8.6.1', 'm3-real-constellation':'8.6.1, 8.7.1', 'm3-lab-s':'8.1, 8.6.1',
  'm3-gs':'8.1', 'm3-ex-gs':'8.1', 'm3-ex-gs-b':'8.1', 'm3-basis-change':'8.1', 'm3-real-gs':'8.1', 'm3-lab-f':'8.1',
  'm3-chain':'8.1', 'm3-quick':'8.1', 'm3-synth':'8.1', 'm3-projects':'8.1',

  /* Module 4 is section 8.4 of the book, "M-ary Digital Modulation": 8.4.1 is
     the optimum receiver for M-ary signals in AWGN and 8.4.2 is the union
     bound. Both were read there. */
  'm4-open':'8.4', 'm4-observe':'8.4.1', 'm4-noise':'8.4.1',
  'm4-map':'8.4.1', 'm4-mindist':'8.4.1', 'm4-metric':'8.4.1',
  'm4-regions':'8.4.1', 'm4-binary':'8.3.3', 'm4-lab-g':'8.4.1',
  'm4-pe':'8.4.1', 'm4-union':'8.4.2', 'm4-dmin':'8.4.2', 'm4-intel':'8.4.2',
  'm4-ex-union':'8.4.2', 'm4-ex-union-b':'8.4.2',
  'm4-synth':'8.4',

  /* Module 5 spans three chapters of the book: 8.5 for M-ary PAM, 8.6 for
     phase-shift keying, 8.7 for quadrature amplitude modulation, 8.3.3 for the
     binary comparison, 9.1 and 9.5 to 9.7 for orthogonal signals, FSK, MSK and
     the bandwidth-efficiency plane, and 10.2 for the spectrum of a carrier
     modulated signal. The link budget was read in three places: 6.4.1 and 6.4.2
     (thermal noise, effective noise temperature and noise figure, p. 279-280),
     6.4.3 (transmission losses and the free-space path loss, p. 283) and 14.5
     (link budget analysis for radio channels, p. 810). Adaptive modulation and
     the code pages carry no anchor. */
  'm5-open':'8.5', 'm5-carrier':'8.5.1', 'm5-iq':'8.6, 8.7', 'm5-bpsk':'8.6.1',
  'm5-bfsk':'9.5', 'm5-bask':'8.5.1', 'm5-binary-pe':'8.3.3', 'm5-ex-binary':'8.3.3',
  'm5-real-binary':'8.5.1, 8.6.1', 'm5-lab-iq':'8.6, 8.7',
  'm5-mpsk':'8.6.1', 'm5-qpsk':'8.6.3', 'm5-psk-detect':'8.6.2', 'm5-mpsk-pe':'8.6.3',
  'm5-gray':'8.6.1, 8.6.3', 'm5-ex-psk':'8.6.3', 'm5-phase-offset':'8.6.4',
  'm5-dpsk':'8.6.4', 'm5-dpsk-pe':'8.6.5', 'm5-real-psk':'8.6.1, 8.6.4',
  'm5-lab-gray':'8.6.1, 8.6.3',
  'm5-mask':'8.5.3', 'm5-ex-ask4':'8.5.3', 'm5-qam':'8.7.1', 'm5-qam-pe':'8.7.3',
  'm5-qam-shapes':'8.7.1, 8.7.3', 'm5-ex-qam16':'8.7.3', 'm5-qam-vs-psk':'8.7.3',
  'm5-real-qam':'8.7.1', 'm5-lab-h':'8.5.3, 8.6.3, 8.7.3',
  'm5-mfsk':'9.5, 9.1.2', 'm5-orth-m':'9.1.1, 9.1.2', 'm5-noncoh':'9.5.2, 9.5.3',
  'm5-real-fsk':'9.5, 9.6.1', 'm5-lab-fsk':'9.1, 9.5',
  'm5-spectrum':'10.2, 9.7', 'm5-msk':'9.6.1, 9.6.2', 'm5-plane':'9.7', 'm5-compare':'9.7',
  'm5-noise-floor':'6.4.1, 6.4.2', 'm5-budget':'14.5, 6.4.3', 'm5-ex-link':'14.5',
  'm5-real-choice':'9.7', 'm5-lab-plane':'9.7',
  'm5-chain':'8.6, 8.7', 'm5-quick':'8.5, 8.6, 8.7, 9.7',
  'm5-synth':'8.5, 8.6, 8.7, 9.1, 9.5, 9.7', 'm5-projects':'8.6, 9.7',

  /* Module 6 is Chapter 12 of the book, "An Introduction to Information
     Theory". Each anchor was read there: 12.1.1 self-information and entropy,
     12.1.2 joint and conditional entropy and H(S^n) = nH(S), 12.1.3 mutual
     information, 12.2 the source-coding theorem and typical sequences, 12.3.1
     prefix codes, the source-coding bound and Huffman coding, 12.3.2
     Lempel-Ziv, 12.4 channel models, 12.5 capacity and the coding theorem,
     12.5.1 the bandlimited Gaussian channel, and 12.6 the bandwidth-efficiency
     plane, the Shannon limit and a source sent over a channel. The book has no
     Kraft inequality, so m6-kraft carries no anchor. The yes/no questions,
     rate and distortion, arithmetic coding, repetition codes, the Hamming code
     glimpse, water-filling and the code pages are additions and carry none;
     the water-filling laboratory keeps 12.5.1 for its per-channel formula. */
  'm6-open':'12.1',
  'm6-selfinfo':'12.1.1', 'm6-entropy':'12.1.1', 'm6-hb':'12.1.1', 'm6-ex-rate':'12.1.1',
  'm6-extension':'12.1.2', 'm6-real-entropy':'12.1.1, 12.2', 'm6-lab-i':'12.1.1',
  'm6-coding':'12.2, 12.3.1', 'm6-typical':'12.2', 'm6-source-thm':'12.2',
  'm6-prefix':'12.3.1', 'm6-bound':'12.3.1', 'm6-real-codes':'12.3.1', 'm6-lab-typical':'12.2',
  'm6-huffman':'12.3.1', 'm6-huffman-var':'12.3.1', 'm6-huffman-ext':'12.3.1',
  'm6-lz':'12.3.2', 'm6-lz-long':'12.3.2', 'm6-real-compress':'12.3.1, 12.3.2',
  'm6-lab-j':'12.3.1',
  'm6-dmc':'12.4', 'm6-inputdist':'12.4', 'm6-bsc':'12.4', 'm6-joint':'12.1.2',
  'm6-condent':'12.1.2', 'm6-mutual':'12.1.3', 'm6-mutual-props':'12.1.3',
  'm6-real-info':'12.1.3', 'm6-lab-mi':'12.1.3, 12.4',
  'm6-capacity':'12.5', 'm6-bsc-cap':'12.5', 'm6-bec':'12.5', 'm6-ex-zchannel':'12.5',
  'm6-ex-symmetric':'12.5', 'm6-why-capacity':'12.5', 'm6-coding-thm':'12.5',
  'm6-transmission':'12.6', 'm6-real-capacity':'12.5', 'm6-lab-k':'12.5',
  'm6-awgn':'12.4, 12.5.1', 'm6-shannon':'12.5.1', 'm6-ex-phone':'12.5.1',
  'm6-bandwidth':'12.6', 'm6-plane':'12.6', 'm6-limit':'12.6',
  'm6-real-shannon':'12.5.1, 12.6', 'm6-lab-wf':'12.5.1',
  'm6-chain':'12.6', 'm6-quick':'12.1, 12.2, 12.5, 12.6',
  'm6-synth':'12.1, 12.2, 12.3, 12.5, 12.6', 'm6-projects':'12.3, 12.5'
};

/* ---- derivation --------------------------------------------------------
   Hangs `sec` and `book` on every scene object, and returns the chapter view
   the contents surfaces render from. Addresses are computed rather than
   written down twice, so a section that gains a scene renumbers by itself and
   cannot drift out of step with the declaration.

   Three id shapes take a space of their own rather than an ordinal, because
   they are not teaching scenes: a laboratory (`*-lab-*`) takes `L`, a code
   page (`*-code-*`) takes `C` after its section, and the question scene of a
   module takes `Q1`.

   A converted module names a laboratory after the section it closes: the one
   in section 1.4 is Laboratory 1.4 and has the address 1.4.L, and two in one
   section take a and b in declared order. Its scene file writes `{lab}` where
   the number goes, in `nav`, `title`, `keywords` and the text of its blocks,
   and it is filled in here. A module not yet converted keeps its letters and
   numbers its laboratories through the chapter (2.L1, 2.L2). The single
   letters in code (`{t:'lab', id:'B'}`) are internal keys either way. */
function nameLab(s){
  const fill = t => typeof t === 'string' ? t.split('{lab}').join(s.lab) : t;
  s.nav = fill(s.nav); s.title = fill(s.title); s.keywords = fill(s.keywords);
  (s.blocks||[]).forEach(b=>{ if(b.text) b.text = fill(b.text); if(b.html) b.html = fill(b.html); });
}
window.applyNumbering = function(scenes){
  const byId = {};
  scenes.forEach(s=>{ byId[s.id] = s; });

  return CONTENT.CHAPTERS.map(ch=>{
    const secs = CONTENT.SECTIONS[ch.module] || [];
    let labN = 0;
    const out = { n:ch.n, title:ch.title, module:ch.module, flat:!!ch.flat, sections:[] };

    /* The questions close the chapter: they are worked after the teaching
       scenes. The scene is listed where it occurs, so it is collected from the
       scene array rather than from the declaration. */
    const q = { drill:byId[ch.module.toLowerCase()+'-drill'] };
    if(q.drill) q.drill.sec = ch.n+'.Q1';

    secs.forEach(sec=>{
      const entries = [];
      let ord = 0, labK = 0;
      const named = sec.ids.filter(id=>/-lab-/.test(id) && byId[id] && /\{lab\}/.test(byId[id].title||''));
      sec.ids.forEach(id=>{
        const s = byId[id];
        if(!s){ console.error('numbering: no scene with id '+id); return; }
        if(named.includes(id)){
          const suf = named.length > 1 ? 'abcdefgh'[labK++] : '';
          s.lab = sec.n+suf;
          s.sec = sec.n+'.L'+suf;
          nameLab(s);
        }
        else s.sec = /-lab-/.test(id)  ? ch.n+'.L'+(++labN)
                   : /-code-/.test(id) ? sec.n+'.C'
                   : ch.flat           ? ch.n+'.'+(++ord)
                   :                     sec.n+'.'+(++ord);
        s.book = CONTENT.BOOK[id];
        entries.push(s);
      });
      out.sections.push({ n:sec.n, title:sec.title, scenes:entries });
    });

    out.q = q;
    return out;
  });
};

})();
