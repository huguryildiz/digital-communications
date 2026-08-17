/* ==========================================================================
   Module 6 laboratories.

   I · Entropy of a source — the reader moves the probabilities of a
       four-symbol source and watches what each symbol carries, what the
       source averages, and how far that sits below its own ceiling.

   J · Building a Huffman code — the algorithm run one merge at a time, with
       the tree filling in from the leaves upward. The tie-breaking rule can
       be switched, which produces the two codes of scene 6.4.2: the same
       average length and very different variances.

   Nothing here is looked up. Every entropy, length and variance is computed
   from the probabilities on screen at the moment they are asked for.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, fmt = LABS.KIT.F;
  const P = PLOT, C = PLOT.COL;

  const lg = x => Math.log(x)/Math.LN2;
  const ent = ps => -ps.filter(p=>p>0).reduce((s,p)=>s+p*lg(p), 0);
  const norm = ws => { const t = ws.reduce((a,b)=>a+b,0) || 1; return ws.map(w=>w/t); };

  /* ---- I · Entropy of a source ------------------------------------------ */
  const I = (() => {
    let st = { w1:40, w2:30, w3:20, w4:10 };

    function draw(root){
      const ps = norm([st.w1, st.w2, st.w3, st.w4]);
      const K = ps.length;
      const H = ent(ps), ceil = lg(K);

      const top = Math.max(...ps.map(p => p>0 ? -lg(p) : 0), ceil) * 1.18;
      const a = P.Axes({w:600,h:380,xr:[0,K+0.8],yr:[-top*0.16,top],
        ylabel:'\\text{bits}', pad:{l:62,r:26,t:26,b:40},
        xticksOverride:[], zeroAxes:false,
        yticksOverride:[0,1,2,3,4,5,6,7,8].filter(v=>v<=top && (top<=5 || v%2===0))});
      ps.forEach((p,i)=>{
        if(p > 0){
          a.rect(i+0.12, 0, i+0.48, -lg(p), {fill:C.dec.in,  stroke:C.in});
          a.rect(i+0.52, 0, i+0.88, p*-lg(p), {fill:C.dec.out, stroke:C.out});
        }
        a.note(i+0.5, -top*0.09, 's_'+(i+1), {tex:true, fs:12, color:C.dim, anchor:'middle'});
      });
      a.hline(H,    {color:C.err, dash:'5 3'});
      a.hline(ceil, {color:C.h,   dash:'2 4'});
      a.note(K+0.76, H + top*0.05, 'H(S)', {tex:true, fs:13, color:C.err, anchor:'end'});
      a.note(0.06, ceil + top*0.05, '\\log_2 K', {tex:true, fs:13, color:C.h});

      root.querySelector('.plots').innerHTML = a.svg();
      root.querySelector('.ro').innerHTML = ps.map((p,i)=>
        `<div><dt>p<sub>${i+1}</sub> and its bits</dt><dd>${fmt(p,4)} · ${
          p>0 ? fmt(-lg(p),3) : '∞'}</dd></div>`).join('')
        + `<div><dt>Entropy H(S)</dt><dd class="okv">${fmt(H,4)} bits</dd></div>
           <div><dt>Ceiling log₂K</dt><dd>${fmt(ceil,4)} bits</dd></div>
           <div><dt>H(S) as a fraction of it</dt><dd class="okv">${fmt(H/ceil,4)}</dd></div>
           <div><dt>Wasted by numbering</dt><dd>${fmt(ceil-H,4)} bits a symbol</dd></div>`;

      const even = Math.max(...ps) - Math.min(...ps);
      root.querySelector('.verdict').innerHTML =
        even < 1e-6
        ? `<div class="note ok"><span class="note-h">At the ceiling</span>
             All four symbols are equally likely, so nothing about the source is predictable and
             the entropy reaches its maximum of ${T('\\log_2 4 = 2',false)} bits. No code can do
             better than two bits a symbol here, and simply numbering the symbols already does.</div>`
        : Math.max(...ps) > 0.97
        ? `<div class="note warn"><span class="note-h">Almost no information at all</span>
             One symbol takes nearly all the probability, so almost every symbol is the one that
             was expected. The entropy is ${T(fmt(H,4),false)} bits — a good coder would spend
             almost nothing on this source, and numbering the symbols would waste
             ${T(fmt(ceil-H,3),false)} bits every time.</div>`
        : `<div class="note def"><span class="note-h">Below the ceiling, and that is the opportunity</span>
             The entropy is ${T(fmt(H,4),false)} bits against a ceiling of ${T(fmt(ceil,3),false)}.
             The gap of ${T(fmt(ceil-H,3),false)} bits a symbol is exactly what a variable-length
             code is trying to recover — and the more uneven the probabilities, the larger it
             gets.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-6-6" style="gap:40px">
          <div class="col stack"><div class="plots"></div></div>
          <div class="col stack">
            <div class="ctrls one">
              ${[1,2,3,4].map(i=>`
              <div class="ctrl"><label>Weight of s${i} <span class="val" data-out="w${i}">${
                [40,30,20,10][i-1]}</span></label>
                <input type="range" data-v="w${i}" min="0" max="100" step="1" value="${
                  [40,30,20,10][i-1]}"></div>`).join('')}
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
            <div class="note def"><span class="note-h">What to try</span>
              Set all four weights equal and watch the entropy sit exactly on ${T('\\log_2 4=2',false)}.
              Then take one weight to zero: the alphabet is really three symbols, and the ceiling
              the entropy is measured against should be ${T('\\log_2 3',false)} — the dotted line
              stops being the right comparison, which is worth noticing.</div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      draw(root);
    }};
  })();

  /* ---- J · Building a Huffman code -------------------------------------- */
  const J = (() => {
    let st = { w1:40, w2:20, w3:20, w4:10, w5:10, phase:4, high:1 };

    /* The algorithm itself. Each merge takes the two least likely entries,
       labels them 0 and 1, and puts the combination back into the list. Where
       it goes back among equal probabilities is the whole of the tie rule. */
    function build(ps, high){
      const nodes = ps.map((p,i)=>({p, leaf:i, kids:null, merge:-1}));
      let list = nodes.slice().sort((a,b)=>b.p-a.p);
      const steps = [];
      let m = 0;
      while(list.length > 1){
        const b = list.pop(), a = list.pop();          /* the two least likely */
        const node = {p:a.p+b.p, leaf:-1, kids:[a,b], merge:m};
        /* `high` puts the new node above entries it ties with, `low` below. */
        let at = list.length;
        for(let i=0;i<list.length;i++){
          if(high ? list[i].p <= node.p : list[i].p < node.p){ at = i; break; }
        }
        list.splice(at, 0, node);
        steps.push({m, a:a.p, b:b.p, sum:node.p, left:list.length});
        m++;
      }
      const root = list[0];
      const code = new Array(ps.length).fill('');
      (function walk(n, bits){
        if(n.leaf >= 0){ code[n.leaf] = bits || '0'; return; }
        walk(n.kids[0], bits+'0');
        walk(n.kids[1], bits+'1');
      })(root, '');
      return { root, code, steps };
    }

    /* Leaves evenly spaced, parents at the mean of their children. */
    function layout(root){
      const pos = new Map();
      let next = 0;
      (function walk(n, d){
        n.d = d;
        if(n.leaf >= 0){ pos.set(n, next++); return; }
        n.kids.forEach(k=>walk(k, d+1));
        pos.set(n, (pos.get(n.kids[0]) + pos.get(n.kids[1]))/2);
      })(root, 0);
      return { pos, leaves: next };
    }

    function draw(root){
      const ps = norm([st.w1, st.w2, st.w3, st.w4, st.w5]);
      const K = ps.length;
      const B = build(ps, st.high === 1);
      const { pos, leaves } = layout(B.root);
      const done = st.phase;                       /* merges revealed so far */

      const depth = Math.max(...B.code.map(c=>c.length));
      const span = Math.max(1, leaves-1);
      const a = P.Axes({w:620,h:250,xr:[-0.4,depth+1.1],yr:[-0.6,span+0.6],
        pad:{l:16,r:16,t:16,b:16}, xticksOverride:[], yticksOverride:[],
        grid:false, zeroAxes:false, arrows:false});
      const Y = n => span - pos.get(n);

      (function drawNode(n){
        if(n.leaf >= 0) return;
        const live = n.merge < done;
        n.kids.forEach((k,i)=>{
          a.poly([[n.d, Y(n)],[k.d, Y(k)]],
            {color: live ? C.grid : C.dec.mid, width: live ? 1.5 : 1});
          if(live) a.note((n.d+k.d)/2, (Y(n)+Y(k))/2 + span*0.05, String(i),
            {fs:11, color:C.dim, anchor:'middle'});
          drawNode(k);
        });
        a.point(n.d, Y(n), {color: live ? C.grid : C.dec.mid, r:2.6});
      })(B.root);
      ps.forEach((p,i)=>{
        const leaf = (function find(n){
          if(n.leaf === i) return n;
          if(n.leaf >= 0) return null;
          return find(n.kids[0]) || find(n.kids[1]);
        })(B.root);
        a.point(leaf.d, Y(leaf), {color:C.ink, r:5});
        a.note(leaf.d + 0.14, Y(leaf), 's_'+(i+1), {tex:true, fs:12, color:C.ink});
      });

      const H = ent(ps);
      const complete = done >= K-1;
      const L = complete ? ps.reduce((s,p,i)=>s+p*B.code[i].length, 0) : null;
      const V = complete ? ps.reduce((s,p,i)=>s+p*(B.code[i].length-L)**2, 0) : null;

      root.querySelector('.plots').innerHTML = a.svg();
      root.querySelector('.ro').innerHTML =
        (complete
          ? ps.map((p,i)=>`<div><dt>s<sub>${i+1}</sub> at p=${fmt(p,3)}</dt>
              <dd class="okv">${B.code[i]}</dd></div>`).join('')
          : B.steps.slice(0, done).map(s=>
              `<div><dt>Merge ${s.m+1}</dt><dd>${fmt(s.a,3)} + ${fmt(s.b,3)} = ${
                fmt(s.sum,3)}</dd></div>`).join('')
            || '<div><dt>Merges done</dt><dd>none yet</dd></div>')
        + `<div><dt>Entropy H(S)</dt><dd>${fmt(H,4)} bits</dd></div>`
        + (complete
          ? `<div><dt>Average length</dt><dd class="okv">${fmt(L,4)} bits</dd></div>
             <div><dt>Efficiency</dt><dd class="okv">${fmt(H/L,4)}</dd></div>
             <div><dt>Variance of the lengths</dt><dd class="okv">${fmt(V,4)}</dd></div>
             <div><dt>Lengths</dt><dd>${B.code.map(c=>c.length).join(', ')}</dd></div>`
          : `<div><dt>Merges remaining</dt><dd>${K-1-done}</dd></div>`);

      root.querySelector('.verdict').innerHTML =
        !complete
        ? `<div class="note def"><span class="note-h">Still building</span>
             ${done} of ${K-1} merges done. Each one takes the two least likely entries in the
             list, labels them ${T('0',false)} and ${T('1',false)}, and puts their combination
             back. The branches drawn faintly are the ones later merges will create.</div>`
        : V < 0.5
        ? `<div class="note ok"><span class="note-h">A balanced code</span>
             Average length ${T(fmt(L,4),false)} bits against an entropy of
             ${T(fmt(H,4),false)}, so ${T('\\eta='+fmt(H/L,4),false)}. The variance is
             ${T(fmt(V,3),false)}: the codewords are close to the same length, which is what a
             fixed-rate channel wants to be fed.</div>`
        : `<div class="note warn"><span class="note-h">Optimal, and awkward</span>
             The average length is ${T(fmt(L,4),false)} bits — the same as the balanced code
             would give, because every Huffman code is optimal. But the variance is
             ${T(fmt(V,3),false)}, so the lengths are spread far apart and the buffer between
             encoder and channel has to absorb that. Switch the tie rule and compare.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=high]').forEach(b=>
        b.setAttribute('aria-pressed', String(parseInt(b.dataset.val,10)===st.high)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-6-6" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="note def"><span class="note-h">Reading the tree</span>
              A codeword is the labels along the path from the root to a symbol. Every symbol is
              at a leaf, so no codeword begins another — the prefix property is not checked
              afterwards, it is built in.</div>
          </div>
          <div class="col stack">
            <div class="ctrls">
              ${[1,2,3,4,5].map(i=>`
              <div class="ctrl"><label>Weight of s${i} <span class="val" data-out="w${i}">${
                [40,20,20,10,10][i-1]}</span></label>
                <input type="range" data-v="w${i}" min="1" max="100" step="1" value="${
                  [40,20,20,10,10][i-1]}"></div>`).join('')}
              <div class="ctrl"><label>Merges shown <span class="val" data-out="phase">4</span></label>
                <input type="range" data-v="phase" min="0" max="4" step="1" value="4"></div>
              ${LABS.KIT.runbar()}
              <div class="ctrl"><label>On a tie, put the merged symbol <span class="seg">
                <button data-seg="high" data-val="1">high</button>
                <button data-seg="high" data-val="0">low</button></span></label></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
            <div class="note def"><span class="note-h">What to try</span>
              Leave the weights at 40, 20, 20, 10, 10 and switch the tie rule: both codes average
              ${T('2.2',false)} bits and their variances are ${T('0.16',false)} and
              ${T('1.36',false)}.</div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=high]'); if(!b) return;
        st.high=parseInt(b.dataset.val,10); draw(root); });
      draw(root);
      LABS.KIT.transport(root, { key:'phase', max:4, ms:700,
        get:()=>st.phase, set:v=>{ st.phase=v; }, redraw:()=>draw(root) });
    }};
  })();

  /* ---- K · Channel capacity --------------------------------------------- */
  const K = (() => {
    let st = { p:15, q:50, ch:0 };            /* ch: 0 symmetric, 1 Z-channel */

    /* Row j of the matrix is the output distribution when input j is sent, so
       every row sums to one by construction and the readout cannot show a
       matrix that is not a channel. */
    const matrix = (kind, p) => kind === 0 ? [[1-p, p],[p, 1-p]] : [[1, 0],[p, 1-p]];

    const use = (Pyx, q) => {
      const px = [q, 1-q];
      const py = [Pyx[0][0]*q + Pyx[1][0]*(1-q), Pyx[0][1]*q + Pyx[1][1]*(1-q)];
      const HYX = px[0]*ent(Pyx[0]) + px[1]*ent(Pyx[1]);
      return { px, py, HX:ent(px), HY:ent(py), HYX, I:ent(py)-HYX };
    };

    /* The capacity is searched rather than quoted, so the peak the figure draws
       and the number in the readout are the same computation. */
    const cap = Pyx => {
      let best = {q:0, I:0};
      for(let i=0;i<=2000;i++){
        const q = i/2000, I = use(Pyx, q).I;
        if(I > best.I) best = {q, I};
      }
      return best;
    };

    function draw(root){
      const p = st.p/100, q = st.q/100;
      const Pyx = matrix(st.ch, p);
      const now = use(Pyx, q), C = cap(Pyx);

      const top = Math.max(0.2, C.I*1.28);
      const a = P.Axes({w:600,h:340,xr:[0,1],yr:[0,top],
        xlabel:'P(X=x_0)', ylabel:'I(X;Y)\\;\\text{bits}',
        pad:{l:64,r:26,t:26,b:46}, xtarget:5, ytarget:5});
      a.curve(t => use(Pyx, t).I, {color:C.I > 0 ? PLOT.COL.in : PLOT.COL.noise, width:2.3});
      a.vline(q, {color:PLOT.COL.h, dash:'4 3'});
      a.point(q, now.I, {color:PLOT.COL.h, r:5});
      if(C.I > 1e-9){
        a.point(C.q, C.I, {color:PLOT.COL.err, r:4.5});
        a.note(C.q, C.I + top*0.06, 'C', {tex:true, fs:13, color:PLOT.COL.err, anchor:'middle'});
      }

      const m = v => fmt(v,3);
      /* entropies keep four decimals whatever the value, so a channel that
         happens to carry exactly one bit does not read "1 bits" */
      const b4 = v => v.toFixed(4);
      root.querySelector('.plots').innerHTML = a.svg();
      root.querySelector('.ro').innerHTML =
        `<div><dt>Row for x<sub>0</sub></dt><dd>${m(Pyx[0][0])}, ${m(Pyx[0][1])}</dd></div>
         <div><dt>Row for x<sub>1</sub></dt><dd>${m(Pyx[1][0])}, ${m(Pyx[1][1])}</dd></div>
         <div><dt>Output P(y<sub>0</sub>), P(y<sub>1</sub>)</dt><dd>${m(now.py[0])}, ${m(now.py[1])}</dd></div>
         <div><dt>H(X)</dt><dd>${b4(now.HX)} bits</dd></div>
         <div><dt>H(Y)</dt><dd>${b4(now.HY)} bits</dd></div>
         <div><dt>H(Y|X)</dt><dd>${b4(now.HYX)} bits</dd></div>
         <div><dt>I(X;Y) here</dt><dd class="okv">${b4(now.I)} bits</dd></div>
         <div><dt>Capacity C</dt><dd class="okv">${b4(C.I)} bits</dd></div>
         <div><dt>reached at P(x<sub>0</sub>)</dt><dd class="okv">${fmt(C.q,3)}</dd></div>`;

      const gap = C.I - now.I;
      root.querySelector('.verdict').innerHTML =
        C.I < 1e-4
        ? `<div class="note warn"><span class="note-h">A useless channel</span>
             The capacity is zero: the output distribution is the same whatever goes in, so
             observing it resolves nothing. No input distribution helps and no code helps —
             ${T('C=0',false)} is a statement about every scheme that will ever exist.</div>`
        : gap < 1e-4
        ? `<div class="note ok"><span class="note-h">At capacity</span>
             The input distribution is the best one for this channel, and
             ${T('I(X;Y)='+fmt(now.I,4),false)} bits per use is all it will carry. Move the
             input away and the number can only fall — that is what a maximum means.</div>`
        : `<div class="note def"><span class="note-h">Below capacity, and by choice</span>
             This transmitter gets ${T(fmt(now.I,4),false)} bits per use where the channel would
             give ${T(fmt(C.I,4),false)}. The ${T(fmt(gap,4),false)} bits missing are the
             transmitter's doing, not the channel's — the channel matrix has not moved.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=ch]').forEach(b=>
        b.setAttribute('aria-pressed', String(parseInt(b.dataset.val,10)===st.ch)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-6-6" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="note def"><span class="note-h">Reading the curve</span>
              The curve is the mutual information as the input distribution is swept from all
              ${T('x_1',false)} to all ${T('x_0',false)}. Its peak is the capacity. The dashed
              line is where the sliders currently sit.</div>
          </div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Channel <span class="seg">
                <button data-seg="ch" data-val="0">symmetric</button>
                <button data-seg="ch" data-val="1">Z-channel</button></span></label></div>
              <div class="ctrl"><label>Crossover probability, per cent
                <span class="val" data-out="p">15</span></label>
                <input type="range" data-v="p" min="0" max="100" step="1" value="15"></div>
              <div class="ctrl"><label>Input P(x₀), per cent
                <span class="val" data-out="q">50</span></label>
                <input type="range" data-v="q" min="0" max="100" step="1" value="50"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
            <div class="note def"><span class="note-h">What to try</span>
              On the symmetric channel take the crossover to ${T('50\\%',false)} and watch the
              capacity fall to zero, then past it to ${T('100\\%',false)} and watch it return to
              one bit. Then switch to the Z-channel at a crossover of ${T('50\\%',false)}: the
              peak moves off the middle to ${T('0.6',false)}, and the capacity is
              ${T('\\log_2\\tfrac54=0.3219',false)}.</div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=ch]'); if(!b) return;
        st.ch=parseInt(b.dataset.val,10); draw(root); });
      draw(root);
    }};
  })();

  return { I, J, K };
})());
