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

  return { KIT:{ T, M, F, el, gcd } };
})();
