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
  { n:'0', module:'M0', title:'The frame of the course', flat:true },
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
    { n:'0', ids:['m0-open','m0-why','m0-map','m0-how'] }
  ],

  M1: [
    { n:'1.0', title:'Opening',                        ids:['m1-open'] },
    { n:'1.1', title:'The sampling theorem',           ids:[
        'm1-sampler','m1-spectrum','m1-cases','m1-theorem'] },
    { n:'1.2', title:'Reconstruction',                 ids:[
        'm1-lpf','m1-interp','m1-ex-nyquist'] },
    { n:'1.3', title:'Quantization',                   ids:[
        'm1-quant','m1-lloydmax','m1-lab-a'] },
    { n:'1.4', title:'Quantization noise and SQNR',    ids:[
        'm1-qnoise','m1-sqnr','m1-ex-cos','m1-ex-unif','m1-ex-gauss'] },
    { n:'1.5', title:'Non-uniform quantization',       ids:[
        'm1-nonuniform','m1-companding'] },
    { n:'1.6', title:'Pulse code modulation',          ids:[
        'm1-encode','m1-linecodes','m1-ex-pcm','m1-lab-b'] },
    { n:'1.7', title:'Summary',                        ids:['m1-synth'] }
  ],

  M2: [
    { n:'2.0', title:'Opening',                        ids:['m2-open'] },
    { n:'2.1', title:'The matched filter',             ids:[
        'm2-model','m2-schwarz','m2-matched','m2-props','m2-lab-c'] },
    { n:'2.2', title:'The demodulator',                ids:['m2-basis','m2-correlator'] },
    { n:'2.3', title:'The decision and its error',     ids:[
        'm2-stat','m2-threshold','m2-pe','m2-ex-pe','m2-lab-d'] },
    { n:'2.4', title:'Intersymbol interference',       ids:['m2-isi','m2-eye','m2-lab-e'] },
    { n:'2.5', title:'Nyquist and the raised cosine',  ids:['m2-nyquist','m2-rcos'] },
    { n:'2.6', title:'Summary',                        ids:['m2-synth'] }
  ],

  M3: [
    { n:'3.0', title:'Opening',                        ids:['m3-open'] },
    { n:'3.1', title:'Signals as vectors',             ids:[
        'm3-ortho','m3-project','m3-energy'] },
    { n:'3.2', title:'Constellations',                 ids:['m3-constellation','m3-remarks'] },
    { n:'3.3', title:'The Gram–Schmidt procedure',     ids:['m3-gs','m3-ex-gs','m3-lab-f'] },
    { n:'3.4', title:'Summary',                        ids:['m3-synth'] }
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
    { n:'5.1', title:'The binary schemes',             ids:['m5-bpsk','m5-bfsk','m5-bask'] },
    { n:'5.2', title:'Phase-shift keying',             ids:['m5-mpsk','m5-mpsk-pe'] },
    { n:'5.3', title:'Amplitude and quadrature',       ids:['m5-mask','m5-qam','m5-lab-h'] },
    { n:'5.4', title:'Frequency-shift keying',         ids:['m5-mfsk','m5-compare'] },
    { n:'5.5', title:'Summary',                        ids:['m5-synth'] }
  ],

  M6: [
    { n:'6.0', title:'Opening',                        ids:['m6-open'] },
    { n:'6.1', title:'Information and entropy',        ids:[
        'm6-selfinfo','m6-entropy','m6-extension','m6-lab-i'] },
    { n:'6.2', title:'What a code costs',              ids:['m6-coding'] },
    { n:'6.3', title:'Prefix codes and the Kraft inequality', ids:[
        'm6-prefix','m6-kraft','m6-bound'] },
    { n:'6.4', title:'Huffman coding',                 ids:['m6-huffman','m6-huffman-var','m6-lab-j'] },
    { n:'6.5', title:'Universal coding',               ids:[
        'm6-drill-types-b','m6-lz'] },
    { n:'6.6', title:'The discrete memoryless channel', ids:[
        'm6-dmc','m6-inputdist','m6-bsc'] },
    { n:'6.7', title:'Mutual information',             ids:[
        'm6-condent','m6-mutual','m6-mutual-props'] },
    { n:'6.8', title:'Channel capacity',               ids:[
        'm6-capacity','m6-bsc-cap','m6-lab-k','m6-ex-zchannel','m6-coding-thm'] },
    { n:'6.9', title:'The bandlimited channel',        ids:['m6-shannon','m6-limit'] },
    { n:'6.10', title:'Summary',                       ids:['m6-synth'] }
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
     marker cannot catch. */
  'm1-open':'7.1',
  'm1-sampler':'7.1.1', 'm1-spectrum':'7.1.1', 'm1-cases':'7.1.1', 'm1-theorem':'7.1.1',
  'm1-lpf':'7.1.1', 'm1-interp':'7.1.1', 'm1-ex-nyquist':'7.1.1',
  'm1-quant':'7.2.1', 'm1-lloydmax':'7.2.1', 'm1-lab-a':'7.2.1',
  'm1-qnoise':'7.2.1', 'm1-sqnr':'7.2.1',
  'm1-ex-cos':'7.2.1', 'm1-ex-unif':'7.2.1', 'm1-ex-gauss':'7.2.1',
  'm1-nonuniform':'7.2.1', 'm1-companding':'7.2.1',
  'm1-encode':'7.3', 'm1-ex-pcm':'7.4.1', 'm1-lab-b':'7.4',
  'm1-synth':'7.4.1',

  /* Module 2 spans two chapters of the book, and that is not an accident of
     this course's numbering: the matched filter, the demodulators and the error
     probability are chapter 8, while intersymbol interference, the Nyquist
     criterion and the raised cosine are developed in chapter 10. Each was read
     in the book before it was written here.

     The eye-pattern scene carries no anchor. The book does describe the eye
     pattern, but not under a heading this module can point at without guessing,
     and a well-formed wrong anchor is the one failure the marker cannot catch. */
  'm2-open':'8.3',
  'm2-model':'8.3.2', 'm2-schwarz':'8.3.2', 'm2-matched':'8.3.2', 'm2-props':'8.3.2',
  'm2-lab-c':'8.3.2',
  'm2-basis':'8.2.1', 'm2-correlator':'8.3.1',
  'm2-stat':'8.3.3', 'm2-threshold':'8.3.3', 'm2-pe':'8.3.3', 'm2-ex-pe':'8.3.3',
  'm2-lab-d':'8.3.3',
  'm2-isi':'10.1.1', 'm2-lab-e':'10.1.1',
  'm2-nyquist':'10.3.1', 'm2-rcos':'10.3.1',
  'm2-synth':'8.3, 10.3.1',

  /* All of Module 3 is section 8.1 of the book, "Geometric Representation of
     Signal Waveforms", p. 348 — read there rather than inferred. This is also
     the anchor the ported Gram-Schmidt code got wrong: its comments cite 7.1,
     which in this edition is the sampling theorem. */
  'm3-open':'8.1', 'm3-ortho':'8.1', 'm3-project':'8.1', 'm3-energy':'8.1',
  'm3-constellation':'8.1', 'm3-remarks':'8.1',
  'm3-gs':'8.1', 'm3-ex-gs':'8.1', 'm3-lab-f':'8.1', 'm3-synth':'8.1',

  /* Module 4 is section 8.4 of the book, "M-ary Digital Modulation": 8.4.1 is
     the optimum receiver for M-ary signals in AWGN and 8.4.2 is the union
     bound. Both were read there. */
  'm4-open':'8.4', 'm4-observe':'8.4.1', 'm4-noise':'8.4.1',
  'm4-map':'8.4.1', 'm4-mindist':'8.4.1', 'm4-metric':'8.4.1',
  'm4-regions':'8.4.1', 'm4-binary':'8.3.3', 'm4-lab-g':'8.4.1',
  'm4-pe':'8.4.1', 'm4-union':'8.4.2', 'm4-dmin':'8.4.2', 'm4-intel':'8.4.2',
  'm4-ex-union':'8.4.2', 'm4-ex-union-b':'8.4.2',
  'm4-synth':'8.4',

  /* Module 5 spans four sections of the book, each read there: 8.5 for M-ary
     PAM, 8.6 for phase-shift keying, 8.7 for quadrature amplitude modulation,
     and 9.5 for frequency-shift keying. The last is in a different chapter
     because the book groups FSK with the other multidimensional signal sets. */
  'm5-open':'8.5', 'm5-bpsk':'8.6.1', 'm5-bfsk':'9.5', 'm5-bask':'8.5.1',
  'm5-mpsk':'8.6.1', 'm5-mpsk-pe':'8.6.3',
  'm5-mask':'8.5.3', 'm5-qam':'8.7.1', 'm5-lab-h':'8.6.3, 8.7.1',
  'm5-mfsk':'9.5', 'm5-compare':'9.7', 'm5-synth':'8.5, 8.6, 8.7',

  'm6-open':'12.1', 'm6-selfinfo':'12.1.1', 'm6-entropy':'12.1.1',
  'm6-extension':'12.1.1', 'm6-lab-i':'12.1.1',
  'm6-coding':'12.2', 'm6-prefix':'12.3', 'm6-kraft':'12.3',
  'm6-bound':'12.2', 'm6-huffman':'12.3.1', 'm6-huffman-var':'12.3.1',
  'm6-lab-j':'12.3.1',

  /* The channel half of the module. Each of these was read in the book before
     it was written down: 12.1.2 carries joint and conditional entropy, 12.1.3
     mutual information, 12.3.2 the Lempel-Ziv algorithm, 12.4 the modelling of
     communication channels, 12.5 channel capacity and 12.5.1 the Gaussian
     channel — which is where the bandwidth-and-power law lives. */
  'm6-lz':'12.3.2',
  'm6-dmc':'12.4', 'm6-inputdist':'12.4', 'm6-bsc':'12.4',
  'm6-condent':'12.1.2', 'm6-mutual':'12.1.3', 'm6-mutual-props':'12.1.3',
  'm6-capacity':'12.5', 'm6-bsc-cap':'12.5', 'm6-lab-k':'12.5',
  'm6-ex-zchannel':'12.5', 'm6-coding-thm':'12.5',
  'm6-shannon':'12.5.1', 'm6-limit':'12.5.1',

  'm6-synth':'12.1, 12.2, 12.3, 12.5'
};

/* ---- derivation --------------------------------------------------------
   Hangs `sec` and `book` on every scene object, and returns the chapter view
   the contents surfaces render from. Addresses are computed rather than
   written down twice, so a section that gains a scene renumbers by itself and
   cannot drift out of step with the declaration.

   Three id shapes take a space of their own rather than an ordinal, because
   they are not teaching scenes: a laboratory (`*-lab-*`) takes `L`, and the
   two question scenes of a module take `Q1` and `Q2`. Each counts from 1
   within its chapter. */
window.applyNumbering = function(scenes){
  const byId = {};
  scenes.forEach(s=>{ byId[s.id] = s; });

  return CONTENT.CHAPTERS.map(ch=>{
    const secs = CONTENT.SECTIONS[ch.module] || [];
    let labN = 0;
    const out = { n:ch.n, title:ch.title, module:ch.module, flat:!!ch.flat, sections:[] };

    /* The question scenes bracket the chapter: the taxonomy is read before the
       teaching scenes and the questions are worked after them. They are listed
       where they occur, so they are collected from the scene array rather than
       from the declaration. */
    const q = { map:byId[ch.module.toLowerCase()+'-drill-map'],
                drill:byId[ch.module.toLowerCase()+'-drill'] };
    if(q.map)   q.map.sec   = ch.n+'.Q1';
    if(q.drill) q.drill.sec = ch.n+'.Q2';

    secs.forEach(sec=>{
      const entries = [];
      let ord = 0;
      sec.ids.forEach(id=>{
        const s = byId[id];
        if(!s){ console.error('numbering: no scene with id '+id); return; }
        s.sec  = /-lab-/.test(id) ? ch.n+'.L'+(++labN)
               : ch.flat          ? ch.n+'.'+(++ord)
               :                    sec.n+'.'+(++ord);
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
