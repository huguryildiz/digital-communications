/* ==========================================================================
   Interactive laboratories — the kit they are all built from.

   Every control changes the mathematics, not the decoration. All displayed
   values are computed from the definitions at interaction time.

   A module's laboratories live in their own file, `build/src/7N_labs_mM.js`,
   and register themselves against this object rather than being written in
   here, so that two modules never edit the same file:

     Object.assign(LABS, (function(){
       const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F,
             el = LABS.KIT.el, gcd = LABS.KIT.gcd;
       return { A: { mount(root){ } }, B: { mount(root){ } } };
     })());

   Note the alias: the number formatter is `F` here, and `F` is also going to be
   the id of a laboratory. In a module file it is `fmt`, so the laboratory keeps
   the letter.
   ========================================================================== */
const LABS = (() => {
  /* A label that fails to parse still renders, in KaTeX's own red, but it also
     reaches the console so that qa.js turns red with it. Silent failure here is
     how a broken label survives a full pass of the gates. */
  const T = (s,d)=>{ try{ return katex.renderToString(s,{displayMode:!!d,throwOnError:true,strict:false}); }
                     catch(e){ console.error('LAB: label is not valid TeX: ' + s + ' — ' + e.message);
                               try{ return katex.renderToString(s,{displayMode:!!d,throwOnError:false,strict:false}); }
                               catch(e2){ return s; } } };
  /* Typeset the $...$ spans of a fragment before it reaches the DOM. Reading a
     fragment back out of innerHTML to typeset it in place cannot work: the
     serialiser escapes < and > inside the mathematics, KaTeX is then handed
     &lt; and fails, and a bare < in a formula is read as a tag on the way in. */
  const M = h => String(h).replace(/\$([^$]+)\$/g,(m,a)=>T(a,false));
  const F = (v,d=3)=>{ if(!isFinite(v)) return '∞';
                       if(v!==0 && Math.abs(v)<0.5*Math.pow(10,-d)) return v.toExponential(2);
                       const r=Math.round(v*10**d)/10**d;
                       return Object.is(r,-0)?'0':String(r); };
  const el = (h)=>{ const d=document.createElement('div'); d.innerHTML=h.trim(); return d.firstElementChild; };
  const gcd=(a,b)=>{ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; };

  /* The three buttons a laboratory with a time axis carries. They are marked
     `data-run` rather than `data-seg`: a segmented control selects one state
     out of a set and `labwalk.js` walks every one of them, which is right for
     a state and wrong for a clock. What `labwalk.js` does with these is
     written down in that file. */
  const runbar = () => `<div class="ctrl runbar">
        <button data-run="play" aria-pressed="false">&#9654; Play</button>
        <button data-run="step">&#9197; Step</button>
        <button data-run="reset">&#8634; Reset</button></div>`;

  /* Drives one control — the `phase` slider — and nothing else, so a
     laboratory that animates has exactly as many drawing paths as one that
     does not, and `labwalk.js` covers the axis because a slider is a thing it
     already walks.

     It never starts on its own. Every gate reads the DOM a fixed number of
     milliseconds after navigating, and a page that moved by itself would give
     a different answer on every run.

     The loop is a fixed-step accumulator over requestAnimationFrame: whole
     steps at a fixed tempo, so a 60 Hz display and a 120 Hz one show the same
     frame at the same moment. The time comes from the frame timestamp and
     never from the clock, which would make the artifact's behaviour depend on
     when it was opened. */
  function transport(root, o){
    const slider = root.querySelector(`[data-v="${o.key}"]`);
    const bPlay  = root.querySelector('[data-run="play"]');
    const bStep  = root.querySelector('[data-run="step"]');
    const bReset = root.querySelector('[data-run="reset"]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, acc = 0, last = 0;

    const chrome = () => {
      if(bPlay){ bPlay.innerHTML = raf ? '&#10074;&#10074; Pause' : '&#9654; Play';
                 bPlay.setAttribute('aria-pressed', String(!!raf)); }
      if(bStep){ bStep.disabled = (o.get() >= o.max) && !raf; }
    };
    const put = v => { o.set(v); if(slider) slider.value = String(v); o.redraw(); chrome(); };
    const stop = () => { if(raf) cancelAnimationFrame(raf); raf = 0; acc = 0; last = 0; chrome(); };

    function frame(now){
      /* The scene changed under us: the host's innerHTML was replaced and this
         tree is detached. Drawing into it would burn a core for nobody, and a
         second loop would join it on the next visit. The engine offers no
         teardown hook, so the loop takes responsibility for its own death. */
      if(!root.isConnected){ raf = 0; return; }
      if(!last) last = now;
      acc += now - last; last = now;
      let v = o.get();
      while(acc >= o.ms && v < o.max){ acc -= o.ms; v++; }
      if(v !== o.get()) put(v);
      if(v >= o.max){ stop(); return; }
      raf = requestAnimationFrame(frame);
    }

    if(bPlay) bPlay.addEventListener('click', ()=>{
      if(raf){ stop(); return; }
      /* Reduced motion gets the result without the journey. */
      if(reduced){ put(o.max); return; }
      if(o.get() >= o.max) put(0);
      last = 0; acc = 0; raf = requestAnimationFrame(frame); chrome();
    });
    if(bStep)  bStep.addEventListener('click', ()=>{ stop(); if(o.get() < o.max) put(o.get()+1); });
    if(bReset) bReset.addEventListener('click', ()=>{ stop(); put(0); });
    chrome();
  }

  return { KIT:{ T, M, F, el, gcd, transport, runbar } };
})();
