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
  { n:'1', module:'M1', title:'The transition from analog to digital' }
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
    { n:'0', ids:['m0-open'] }
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
  'm1-synth':'7.4.1'
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
