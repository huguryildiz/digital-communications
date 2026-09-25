/* ==========================================================================
   Module 6 laboratories.

   I  · Entropy of a source (section 6.1) — the probabilities of up to six
        symbols, the information each carries, their weighted sum and the gap
        to a fixed-length code.
   TS · Typical sequences (section 6.2) — the exact distribution of the
        surprise a symbol, -(1/n) log2 P(x), piling up on H as n grows, the
        band of the typical set, and sequences drawn one row at a time.
   J  · Huffman code construction (section 6.3) — the list and the tree one
        merge at a time, with the tie rule switched, and a mode that codes
        pairs of symbols of a three-symbol source.
   MI · Mutual information of a channel (section 6.4) — the transition
        diagram drawn to the joint probabilities, symbols sent across it in
        batches, and the information bar exact and counted.
   K  · Channel capacity (section 6.5) — the mutual information swept over the
        input distribution for the BSC, the Z-channel, the erasure channel and
        a cascade of BSCs, with a rate marker against the capacity.
   WF · Sharing power over parallel channels (section 6.6) — water poured over
        noise floors, the level found by bisection, against equal shares.

   Nothing is looked up. Every entropy, length, count and capacity is computed
   from the settings on screen when it is drawn. Every Monte Carlo run keeps
   one generator per setting and continues it from batch to batch, so a run in
   batches draws exactly the sequence one run would. Every card follows the
   slide card language: a computed equation takes a coral tab naming what it
   computes, a note keeps its kind's tab and icon. `core` on each laboratory
   exposes the numbers it shows, so verify/verify_labs_m6.py can check them.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F, GH = LABS.KIT.GH;
  const P = PLOT;
  const N = (v,d=3) => fmt(v,d);
  /* four decimals whatever the value, so one bit reads 1.0000 and not "1" */
  const F4 = v => (Math.abs(v) < 5e-5 ? 0 : v).toFixed(4);

  const PHONE = () => APP.state.layout === 'phone';
  const REDUCED = () => APP.state.motion === 'reduced';
  const legendRow = (...items) => `<div class="legend">${items.join('')}</div>`;
  const L = (c,l,dash)=>`<i class="lg-${c}${dash?' lg-'+(dash===true?'dash':dash):''}">${T(l,false)}</i>`;
  const LD = (c,l)=>`<i class="lg-${c} lg-dot">${T(l,false)}</i>`;
  const RO = n => `style="grid-template-columns:repeat(${n},minmax(0,1fr))"`;
  function phoneTidy(root){
    if(!PHONE()) return;
    root.querySelectorAll('.seg').forEach(s=>{ s.style.flexWrap = 'wrap'; });
    root.querySelectorAll('.readout').forEach(d=>{ d.style.gridTemplateColumns = ''; });
  }
  function tint(hex, a){
    const h = String(hex).replace('#','');
    if(h.length !== 6) return hex;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const ease = u => u < 0.5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2)/2;
  const nest = (svg, W, yy, h) => svg.replace('<svg ', `<svg x="0" y="${yy}" width="${W}" height="${h}" `);
  const inPlot = (a, where) => {
    const t = `top:calc(${(100*a.y1/a.H).toFixed(2)}% + 6px)`;
    return where === 'tl'
      ? `${t};right:auto;left:calc(${(100*a.x0/a.W).toFixed(2)}% + 8px)`
      : `${t};right:calc(${(100*(a.W-a.x1)/a.W).toFixed(2)}% + 8px)`;
  };

  /* ---- information --------------------------------------------------------- */
  const lg = x => Math.log(x)/Math.LN2;
  const ent = ps => ps.reduce((s,p)=> p > 0 ? s - p*lg(p) : s, 0);
  const h2 = p => ent([p, 1-p]);
  const norm = ws => { const t = ws.reduce((a,b)=>a+b,0);
    return t > 0 ? ws.map(w=>w/t) : ws.map(()=>1/ws.length); };

  /* ---- numbers -------------------------------------------------------------- */
  /* mulberry32 with its state in the open, as in Module 5: one generator drawn
     batch after batch is the same stream as one generator drawn in one run. */
  const gen = seed => ({ a: seed >>> 0 });
  function uni(g){ g.a = (g.a + 0x6D2B79F5) >>> 0; let t = Math.imul(g.a ^ (g.a >>> 15), 1 | g.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

  /* One animation at a time for a laboratory: `u` runs from 0 to 1 over `ms`
     and the draw reads it. Reduced motion leaves u at 1, the resting frame. */
  function tweener(ms){
    const t = { u:1, raf:0 };
    t.stop = () => { if(t.raf) cancelAnimationFrame(t.raf); t.raf = 0; t.u = 1; };
    t.start = (root, draw) => {
      t.stop();
      if(REDUCED()) return;
      t.u = 0; let t0 = 0;
      const tick = now => {
        if(!root.isConnected){ t.raf = 0; t.u = 1; return; }
        if(!t0) t0 = now;
        t.u = Math.min(1, (now - t0)/ms);
        draw(root);
        t.raf = t.u < 1 ? requestAnimationFrame(tick) : 0;
      };
      t.raf = requestAnimationFrame(tick);
    };
    return t;
  }

  /* The play bar under the plots: the one slider a laboratory animates, and
     its transport (as Module 5). */
  const playbar = (label, key, max, val) => `
    <div class="ctrls one" style="padding:10px 20px"><div class="ctrl"><div class="ctrl-run">
      <label style="flex:0 0 auto"><span>${label}</span><span class="val" data-out="${key}">${val}</span></label>
      <input type="range" data-v="${key}" min="0" max="${max}" step="1" value="${val}">
      ${LABS.KIT.runbar()}</div></div></div>`;
  const slider = (key, label, min, max, val, extra) => `
    <div class="ctrl"${extra||''}><label><span>${label}</span><span class="val" data-out="${key}">${val}</span></label>
      <input type="range" data-v="${key}" min="${min}" max="${max}" step="1" value="${val}"></div>`;
  const segs = (key, items) => items.map(([v,l])=>`<button data-seg="${key}" data-val="${v}">${l}</button>`).join('');
  const pressSegs = (root, st) => root.querySelectorAll('[data-seg]').forEach(b=>
    b.setAttribute('aria-pressed', String(b.dataset.val === String(st[b.dataset.seg]))));
  /* a small TeX label set a fixed number of label heights from a point */
  const LS = () => P.labelScale();

  /* =======================================================================
     I · ENTROPY OF A SOURCE
     K symbols with weights; p_i = w_i / sum w. I(s_i) = log2(1/p_i) and the
     entropy H = sum p_i I(s_i). A fixed-length code spends ceil(log2 K)
     bits a symbol; the gap to H is what a variable-length code can save.
     ======================================================================= */
  const I = (() => {
    const KS = [2,3,4,5,6];
    const PRE = { uni:'uniform', one:'one certain', dya:'dyadic', src:'0.7, 0.2, 0.1' };
    let st = { K:3, w:[70,20,10,20,20,20], pre:'src' };

    function apply(pre){
      if(pre === 'uni'){ for(let i=0;i<st.K;i++) st.w[i] = 50; }
      else if(pre === 'one'){ for(let i=0;i<st.K;i++) st.w[i] = i ? 0 : 100; }
      else if(pre === 'dya'){ st.K = 4; [80,40,20,20].forEach((v,i)=>{ st.w[i] = v; }); }
      else if(pre === 'src'){ st.K = 3; [70,20,10].forEach((v,i)=>{ st.w[i] = v; }); }
    }
    /* which preset, if any, the weights now are */
    function which(){
      const ps = norm(st.w.slice(0, st.K)), eq = (a,b) => a.length === b.length && a.every((v,i)=>Math.abs(v-b[i]) < 1e-9);
      if(ps.every(p=>Math.abs(p-ps[0]) < 1e-9)) return 'uni';
      if(Math.max(...ps) > 1 - 1e-9) return 'one';
      if(eq(ps, [0.5,0.25,0.125,0.125])) return 'dya';
      if(eq(ps, [0.7,0.2,0.1])) return 'src';
      return '';
    }
    const dyadic = ps => ps.every(p => p === 0 || Math.abs(lg(p) - Math.round(lg(p))) < 1e-9);

    function draw(root){
      const ph = PHONE(), gh = GH(root), ls = LS();
      const K = st.K, ps = norm(st.w.slice(0, K));
      const H = ent(ps), cap = lg(K), fixed = Math.ceil(cap - 1e-9);
      const Is = ps.map(p => p > 0 ? -lg(p) : Infinity);
      const fin = Is.filter(isFinite);
      /* the legend sits in the top-left corner, so the tallest bar or line
         stops a legend's height (in pixels) under the top of the plot */
      const hA = ph ? 250 : gh(170), inner = hA - 26 - 62*ls;
      const room = ph ? 1.36 : Math.max(1.36, inner / Math.max(20, inner - 34*ls - 10));
      const vmax = Math.min(7, Math.max(1.4, cap, ...fin)), top = vmax * room;

      /* ---- the information of each symbol and its share of H ---- */
      const W = ph ? 300 : 880;
      const a = P.Axes({w:W,h:hA,xr:[0,K+1.15],yr:[0,top],ylabel:'\\text{bits}',
        pad:{l:ph?40:54,r:ph?10:18,t:26,b:62*ls}, xticksOverride:[], arrows:false, ytarget:5});
      const b1 = 0.12, b2 = 0.52, bw = 0.36;
      ps.forEach((p,i)=>{
        if(p > 0){
          a.rect(i+b1, 0, i+b1+bw, Math.min(vmax, Is[i]), {fill:tint(P.COL.in,0.16), stroke:P.COL.in, width:1.8});
          a.rect(i+b2, 0, i+b2+bw, p*Is[i], {fill:P.COL.mid, stroke:P.COL.mid, width:1.2});
        }
        a.note(i+0.5, 0, `s_{${i+1}}`, {tex:true, fs:14, color:P.COL.ink, anchor:'middle', dy:21*ls});
        a.note(i+0.5, 0, fmt(p,3), {tex:true, fs:13, color:P.COL.muted, anchor:'middle', dy:44*ls});
      });
      a.hline(cap, {color:P.COL.slate, dash:'2 4', width:1.6, opacity:1});
      a.hline(H,   {color:P.COL.coral, dash:'7 4', width:1.8, opacity:1});
      /* both names in the empty strip right of the last symbol: H(S) under its
         line, the ceiling over its own, so the two never meet */
      a.note(K+1.1, H, 'H(S)', {tex:true, fs:14, color:P.COL.coral, anchor:'end', dy:18*ls});
      a.note(K+1.1, cap, '\\log_2 K', {tex:true, fs:14, color:P.COL.slate, anchor:'end', dy:-9*ls});

      /* ---- the bits a symbol: H built from its pieces, against a fixed code ---- */
      const xmax = 4;
      const b = P.Axes({w:W,h:ph?140:gh(100),xr:[0,xmax],yr:[0,1],xlabel:'\\text{bits a symbol}',
        pad:{l:ph?40:54,r:ph?10:18,t:34*ls,b:30}, yticksOverride:[], ytickfmt:()=>'', zeroAxes:false,
        xticksOverride:[0,0.5,1,1.5,2,2.5,3], xnameDrop:26*ls});
      b.rect(H, 0.18, fixed, 0.82, {fill:tint(P.COL.coral,0.13), stroke:'none'});
      let x = 0;
      ps.forEach((p,i)=>{
        const w = p*(isFinite(Is[i]) ? Is[i] : 0);
        if(w <= 0) return;
        b.raw(`<rect x="${b.sx(x).toFixed(2)}" y="${b.sy(0.82).toFixed(2)}" width="${(b.sx(x+w)-b.sx(x)).toFixed(2)}" height="${(b.sy(0.18)-b.sy(0.82)).toFixed(2)}" fill="${P.COL.mid}" fill-opacity="${i % 2 ? 0.5 : 0.85}" stroke="${P.COL.plate}" stroke-width="1.5"/>`);
        x += w;
      });
      b.vline(fixed, {color:P.COL.ink, dash:'none', width:2, opacity:1});
      b.note(fixed, 1, `\\lceil\\log_2 K\\rceil=${fixed}`, {tex:true, fs:13.5, color:P.COL.ink, anchor:'start', dx:6, dy:-8*ls});
      b.vline(H, {color:P.COL.coral, dash:'none', width:2, opacity:1});
      /* H is named on the side of its line away from the fixed code's name */
      const hl = H >= 0.2;
      b.note(H, 1, `H=${H.toFixed(3)}`, {tex:true, fs:13.5, color:P.COL.coral, anchor:hl ? 'end' : 'start', dx:hl ? -6 : 6, dy:-8*ls});

      const lgA = `${L('in','I(s_i)')}${L('mid','p_i\\,I(s_i)')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lgA)}<div class="plot-wrap">${b.svg()}</div>`
        : `<div class="plot-wrap">${a.svg()}<div class="legend in-plot" style="${inPlot(a,'tl')}">${lgA}</div></div>`
        + `<div class="plot-wrap">${b.svg()}</div>`;

      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Entropy $H(S)$</dt><dd class="okv">${F4(H)} bits</dd></div>
        <div><dt>Ceiling $\\log_2 K$</dt><dd>${F4(cap)} bits</dd></div>
        <div><dt>Redundancy $1-H/\\log_2 K$</dt><dd>${F4(1 - H/cap)}</dd></div>
        <div><dt>Fixed-length code</dt><dd>${fixed} ${fixed === 1 ? 'bit' : 'bits'}</dd></div>`);

      const pmax = Math.max(...ps);
      const v = pmax > 1 - 1e-9
        ? `<div class="note warn"><span class="note-h">No information</span>One symbol is certain. It carries $\\log_2 1=0$ bits, so $H(S)=0$ and nothing needs to be sent.</div>`
        : ps.every(p=>Math.abs(p-ps[0]) < 1e-9)
        ? `<div class="note ok"><span class="note-h">At the ceiling</span>All ${K} symbols are equally likely, so $H(S)=\\log_2 ${K}=${N(cap,4)}$ bits. No ${K}-symbol source has a larger entropy.</div>`
        : dyadic(ps)
        ? `<div class="note ok"><span class="note-h">Whole bits</span>Every probability is a power of $\\tfrac12$, so every $I(s_i)$ is a whole number of bits. Codewords of those lengths average exactly $H(S)$.</div>`
        : `<div class="note def"><span class="note-h">The gap</span>A fixed-length code spends ${fixed} ${fixed === 1 ? 'bit' : 'bits'} a symbol and $H(S)=${N(H,3)}$. A variable-length code can save up to ${N(fixed-H,3)} bits a symbol.</div>`;
      root.querySelector('.derive:not(.verdict)').innerHTML = M(
        `<div class="eq"><span class="eq-label">Entropy</span>${T(`H(S)=\\sum\\nolimits_{i=1}^{${K}}p_i\\log_2\\frac{1}{p_i}=${F4(H)}\\ \\text{bits}`, true)}</div>`);
      root.querySelector('.verdict').innerHTML = M(v);

      for(let i=0;i<6;i++){
        const c = root.querySelector(`[data-slot="${i}"]`); if(c) c.style.visibility = i < K ? 'visible' : 'hidden';
        const s = root.querySelector(`[data-v="w${i+1}"]`); if(s) s.value = String(st.w[i]);
        const o = root.querySelector(`[data-out="w${i+1}"]`); if(o) o.textContent = String(st.w[i]);
      }
      st.pre = which();
      pressSegs(root, st);
    }

    const core = { norm, ent, apply:(pre)=>{ apply(pre); return { K:st.K, w:st.w.slice(0, st.K) }; }, dyadic };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="ctrls" style="grid-template-columns:repeat(6,minmax(0,1fr));padding:16px 22px;gap:12px 20px">
              ${[1,2,3,4,5,6].map(i=>slider('w'+i, `$s_{${i}}$`, 0, 100, st.w[i-1], ` data-slot="${i-1}"`)).join('')}
            </div>
            <div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label><span>Symbols $K$</span><span class="seg">${segs('K', KS.map(k=>[k,String(k)]))}</span></label></div>
              <div class="ctrl"><label><span>Source</span></label><span class="seg" style="align-self:flex-start">${segs('pre', Object.keys(PRE).map(k=>[k,PRE[k]]))}</span></div>
            </div>
            <dl class="readout ro" ${RO(2)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        st.w[+k.slice(1)-1] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        if(b.dataset.seg === 'K'){
          const was = st.K; st.K = +b.dataset.val;
          for(let i=was;i<st.K;i++) if(st.w[i] === 0) st.w[i] = 20;
        } else apply(b.dataset.val);
        draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     TS · TYPICAL SEQUENCES
     A binary source with P(1) = p. A sequence of n bits with k ones has
     probability p^k (1-p)^(n-k), so its surprise a symbol is
     v_k = -(1/n) log2 P(x), and C(n,k) sequences share it. The typical set
     keeps the sequences with |v_k - H| <= eps. Everything on the first plot
     is exact; the rows of the second are drawn by a seeded generator.
     ======================================================================= */
  const TS = (() => {
    const NS = [10,20,50,100,200,1000], ROWS = 12, XMAX = 2.25;
    let st = { n:100, p:20, eps:10, phase:ROWS };
    const tw = tweener(520);
    const LF = [0]; for(let i=1;i<=1000;i++) LF.push(LF[i-1] + Math.log(i));
    const lC = (n,k) => LF[n] - LF[k] - LF[n-k];

    function dist(n, p, eps){
      const H = h2(p), lp = Math.log(p), lq = Math.log(1-p);
      const pts = [], la = [];
      let Pt = 0;
      for(let k=0;k<=n;k++){
        const v = (-k*lp - (n-k)*lq)/(n*Math.LN2);
        const m = Math.exp(lC(n,k) + k*lp + (n-k)*lq);
        const typ = Math.abs(v - H) <= eps + 1e-12;
        pts.push({ k, v, m, typ });
        if(typ){ Pt += m; la.push(lC(n,k)); }
      }
      let lA = -Infinity;
      if(la.length){ const mx = Math.max(...la); lA = (mx + Math.log(la.reduce((s,x)=>s+Math.exp(x-mx),0)))/Math.LN2; }
      /* sequences that share a surprise are one stem: at p = 1/2 all of them do */
      const agg = [];
      pts.forEach(q=>{ const o = agg.find(r=>Math.abs(r.v-q.v) < 1e-9);
        if(o) o.m += q.m; else agg.push({ v:q.v, m:q.m, typ:q.typ }); });
      return { H, pts, agg, Pt, lA, rate: la.length ? lA/n : 0, size: la.length };
    }

    const cache = new Map();
    function rows(n, p, b){
      const id = n + '|' + p;
      let c = cache.get(id);
      if(!c){ if(cache.size > 40) cache.delete(cache.keys().next().value);
        c = { g:gen(3100 + 7*p + 1009*NS.indexOf(n)), rows:[] }; cache.set(id, c); }
      while(c.rows.length < b){
        const bits = new Uint8Array(n);
        for(let i=0;i<n;i++) bits[i] = uni(c.g) < p/100 ? 1 : 0;
        c.rows.push(bits);
      }
      return c.rows.slice(0, b);
    }
    const surprise = (bits, p) => { let k = 0; for(const x of bits) k += x;
      const n = bits.length; return (-k*Math.log(p) - (n-k)*Math.log(1-p))/(n*Math.LN2); };

    function draw(root){
      const ph = PHONE(), gh = GH(root), ls = LS();
      const n = st.n, p = st.p/100, eps = st.eps/100;
      const D = dist(n, p, eps), H = D.H;
      const R = rows(n, st.p, st.phase), u = tw.u;
      const vs = R.map(r=>surprise(r, p)), typ = vs.map(v=>Math.abs(v-H) <= eps + 1e-12);

      /* ---- the exact distribution of the surprise a symbol ---- */
      const W = ph ? 300 : 880;
      const shown = D.agg.filter(q=>q.v <= XMAX);
      const mmax = Math.max(...shown.map(q=>q.m), 1e-6);
      const ytop = mmax*1.4;
      const a = P.Axes({w:W,h:ph?250:gh(200),xr:[0,XMAX],yr:[0,ytop],
        xlabel:'-\\tfrac{1}{n}\\log_2 P(x)\\;(\\text{bits})', ylabel:'\\text{probability}',
        pad:{l:ph?46:62,r:ph?10:18,t:26,b:46}, xtarget:5, ytarget:4, arrows:false});
      a.under(`<rect x="${a.sx(Math.max(0,H-eps)).toFixed(2)}" y="${a.y1}" width="${(a.sx(Math.min(XMAX,H+eps))-a.sx(Math.max(0,H-eps))).toFixed(2)}" height="${(a.y0-a.y1).toFixed(2)}" fill="${tint(P.COL.slate,0.12)}"/>`);
      const r = (n <= 20 ? 4.2 : n <= 50 ? 3.4 : n <= 100 ? 2.6 : n <= 200 ? 1.8 : 1.3)*(1 + (ls-1)*0.5);
      shown.forEach(q=>{
        if(q.m < mmax*0.004) return;
        const c = q.typ ? P.COL.in : P.COL.noise, X = a.sx(q.v).toFixed(2);
        a.raw(`<line x1="${X}" y1="${a.sy(0).toFixed(2)}" x2="${X}" y2="${a.sy(q.m).toFixed(2)}" stroke="${c}" stroke-width="${n > 100 ? 1.4 : 1.9}"/>`
          + `<circle cx="${X}" cy="${a.sy(q.m).toFixed(2)}" r="${r.toFixed(2)}" fill="${c}"/>`);
      });
      a.vline(H, {color:P.COL.coral, dash:'7 4', width:1.8, opacity:1});
      a.note(H, ytop*0.93, 'H', {tex:true, fs:15, color:P.COL.coral, dx:8});
      /* each drawn row rings the stem it falls on; the newest also carries a line */
      const massAt = v => { const q = D.agg.find(t=>Math.abs(t.v-v) < 1e-9); return q ? q.m : 0; };
      vs.forEach((v,j)=>{
        const last = j === vs.length-1;
        if(last && u < 1) return;
        if(v > XMAX) return;
        a.raw(`<circle cx="${a.sx(v).toFixed(2)}" cy="${a.sy(massAt(v)).toFixed(2)}" r="${((last ? 9 : 6.5)*(1+(ls-1)*0.5)).toFixed(2)}" fill="none" stroke="${P.COL.coral}" stroke-width="${last ? 2.4 : 1.4}"/>`);
      });

      /* ---- the drawn sequences, one row each ---- */
      const b = P.Axes({w:W,h:ph?190:gh(150),xr:[0,n],yr:[0,ROWS],xlabel:'\\text{bit position}',
        pad:{l:ph?46:62,r:ph?10:18,t:10,b:30}, yticksOverride:[], ytickfmt:()=>'', xticksOverride:[0,n/2], grid:false, zeroAxes:false, xnameDrop:26*ls});
      R.forEach((bits,j)=>{
        const y0 = ROWS - j - 0.88, y1 = ROWS - j - 0.12;
        const last = j === R.length-1, upto = last ? Math.floor(u*n) : n;
        if(!(last && u < 1) && typ[j])
          b.under(`<rect x="${b.x0}" y="${b.sy(y1).toFixed(2)}" width="${(b.x1-b.x0).toFixed(2)}" height="${(b.sy(y0)-b.sy(y1)).toFixed(2)}" fill="${tint(P.COL.slate,0.12)}"/>`);
        const c = (last && u < 1) ? P.COL.in : typ[j] ? P.COL.in : P.COL.noise;
        let i = 0, out = '';
        while(i < upto){
          if(!bits[i]){ i++; continue; }
          let e = i; while(e < upto && bits[e]) e++;
          out += `<rect x="${b.sx(i).toFixed(2)}" y="${b.sy(y1).toFixed(2)}" width="${Math.max(0.8, b.sx(e)-b.sx(i)).toFixed(2)}" height="${(b.sy(y0)-b.sy(y1)).toFixed(2)}" fill="${c}"/>`;
          i = e;
        }
        if(last && u < 1) out += `<line x1="${b.sx(upto).toFixed(2)}" y1="${b.sy(y1).toFixed(2)}" x2="${b.sx(upto).toFixed(2)}" y2="${b.sy(y0).toFixed(2)}" stroke="${P.COL.coral}" stroke-width="2"/>`;
        b.raw(out);
      });

      const lgA = `${LD('in','\\text{typical}')}<i class="lg-dot" style="--lg-c:var(--rule-strong)">${T('\\text{not typical}',false)}</i>`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lgA)}<div class="plot-wrap">${b.svg()}</div>`
        : `<div class="plot-wrap">${a.svg()}<div class="legend in-plot" style="${inPlot(a,'tr')}">${lgA}</div></div>`
        + `<div class="plot-wrap">${b.svg()}</div>`;

      const nt = typ.filter((t,j)=>!(j === typ.length-1 && u < 1) && t).length, nd = R.length - (u < 1 && R.length ? 1 : 0);
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Entropy $H$</dt><dd>${F4(H)} bits</dd></div>
        <div><dt>$P(A_\\epsilon)$</dt><dd class="okv">${F4(D.Pt)}</dd></div>
        <div><dt>$\\tfrac1n\\log_2|A_\\epsilon|$</dt><dd>${D.size ? F4(D.rate) : '…'}</dd></div>
        <div><dt>Size $|A_\\epsilon|$</dt><dd>${D.size ? T(`2^{${D.lA.toFixed(1)}}`,false) : '0'}</dd></div>
        <div><dt>Share of all $2^n$</dt><dd>${D.size ? T(`2^{${(D.lA - n).toFixed(1)}}`,false) : '0'}</dd></div>
        <div><dt>Typical rows</dt><dd>${nt} of ${nd}</dd></div>`);

      root.querySelector('.derive:not(.verdict)').innerHTML = M(
        `<div class="eq"><span class="eq-label">The typical set</span>${T(`A_\\epsilon=\\Big\\{x:\\ \\Big|-\\tfrac1n\\log_2P(x)-H\\Big|\\le\\epsilon\\Big\\}`, true)}</div>`
        + `<div class="eq"><span class="eq-label">Bits to index it</span>${T(D.size
            ? `\\log_2|A_\\epsilon|=${D.lA.toFixed(1)},\\qquad nH=${(n*H).toFixed(1)}`
            : `|A_\\epsilon|=0,\\qquad nH=${(n*H).toFixed(1)}`, true)}</div>`);
      const v = st.p === 50
        ? `<div class="note warn"><span class="note-h">No gain</span>At $p=\\tfrac12$ every sequence has $P(x)=2^{-n}$. All are typical, and indexing them takes $n$ bits: this source cannot be compressed.</div>`
        : D.Pt > 0.9
        ? `<div class="note ok"><span class="note-h">Almost all the probability</span>The typical set holds ${N(100*D.Pt,1)}% of the probability but only ${T(`2^{${(D.lA-n).toFixed(1)}}`,false)} of the sequences. About $nH$ bits index it.</div>`
        : `<div class="note def"><span class="note-h">Not yet concentrated</span>At $n=${n}$ the band holds ${N(100*D.Pt,1)}% of the probability. Raise $n$: the stems pile up on $H$.</div>`;
      root.querySelector('.verdict').innerHTML = M(v);

      root.querySelector('[data-out=p]').textContent = p.toFixed(2);
      root.querySelector('[data-out=eps]').textContent = eps.toFixed(2);
      root.querySelector('[data-out=phase]').textContent = String(st.phase);
      root.querySelector('[data-v=phase]').value = String(st.phase);
      pressSegs(root, st);
    }

    const core = { dist, rows, surprise, NS, ROWS };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            ${playbar('Sequences drawn','phase',ROWS,ROWS)}
            <div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Length $n$</span><span class="seg">${segs('n', NS.map(v=>[v,String(v)]))}</span></label></div>
              ${slider('p', 'Chance of a 1, $p$', 5, 50, st.p)}
              ${slider('eps', 'Band $\\epsilon$', 2, 20, st.eps)}
            </div>
            <dl class="readout ro" ${RO(3)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        tw.stop(); st[k] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        tw.stop(); st.n = +b.dataset.val; draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', max:ROWS, ms:700,
        get:()=>st.phase, set:v=>{ const up = v === st.phase + 1; st.phase = v; if(up) tw.start(root, draw); else tw.stop(); },
        redraw:()=>draw(root) });
    }};
  })();

  /* =======================================================================
     J · HUFFMAN CODE CONSTRUCTION
     Each merge takes the two least likely entries of the list, labels them
     0 and 1 and puts their sum back. Where the sum goes among equal entries
     is the tie rule. In the pairs mode the list is the nine products p_i p_j
     of a three-symbol source.
     ======================================================================= */
  const J = (() => {
    const D1 = [40,20,20,10,10], D2 = [70,20,10];
    let st = { mode:'single', w:D1.slice(), q:D2.slice(), phase:4, high:'1' };
    const tw = tweener(650);

    function source(mode, w, q){
      if(mode === 'single'){ const ps = norm(w); return { ps, names:ps.map((_,i)=>`s_{${i+1}}`) }; }
      const b = norm(q), ps = [], names = [];
      for(let i=0;i<3;i++) for(let j=0;j<3;j++){ ps.push(b[i]*b[j]); names.push(`s_{${i+1}}s_{${j+1}}`); }
      return { ps, names, base:b };
    }
    function build(ps, high){
      const nodes = ps.map((p,i)=>({ p, leaf:i, kids:null, merge:-1 }));
      let list = nodes.slice().sort((a,b)=>Math.abs(b.p-a.p) < 1e-12 ? a.leaf-b.leaf : b.p-a.p);
      const snaps = [list.slice()], steps = [];
      let m = 0;
      while(list.length > 1){
        const b = list.pop(), a = list.pop();                  /* the two least likely */
        const node = { p:a.p+b.p, leaf:-1, kids:[a,b], merge:m };
        let at = list.length;
        for(let i=0;i<list.length;i++){
          if(high ? list[i].p <= node.p + 1e-12 : list[i].p < node.p - 1e-12){ at = i; break; }
        }
        list.splice(at, 0, node);
        steps.push({ m, a, b, node });
        snaps.push(list.slice());
        m++;
      }
      const root = list[0], code = new Array(ps.length).fill('');
      (function walk(nd, bits){
        if(nd.leaf >= 0){ code[nd.leaf] = bits || '0'; return; }
        walk(nd.kids[0], bits+'0'); walk(nd.kids[1], bits+'1');
      })(root, '');
      const Lbar = ps.reduce((s,p,i)=>s+p*code[i].length, 0);
      const V = ps.reduce((s,p,i)=>s+p*(code[i].length-Lbar)**2, 0);
      return { root, code, steps, snaps, Lbar, V };
    }
    function layout(root){
      const pos = new Map(); let next = 0;
      (function walk(nd, d){ nd.d = d;
        if(nd.leaf >= 0){ pos.set(nd, next++); return; }
        nd.kids.forEach(k=>walk(k, d+1));
        pos.set(nd, (pos.get(nd.kids[0]) + pos.get(nd.kids[1]))/2);
      })(root, 0);
      return { pos, leaves:next };
    }
    /* the same code for the single symbols, for the pairs mode to compare with */
    const single = (q, high) => { const ps = norm(q); const B = build(ps, high); return { ps, L:B.Lbar }; };

    function bar(a, x, h, w, fill, stroke, op, sw){
      return `<rect x="${a.sx(x-w/2).toFixed(2)}" y="${a.sy(h).toFixed(2)}" width="${(a.sx(x+w/2)-a.sx(x-w/2)).toFixed(2)}" height="${Math.max(0, a.sy(0)-a.sy(h)).toFixed(2)}" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-opacity="${op}" stroke-width="${sw||1.4}"/>`;
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root), ls = LS();
      const S = source(st.mode, st.w, st.q), ps = S.ps, K = ps.length;
      const B = build(ps, st.high === '1');
      st.phase = Math.min(st.phase, K-1);
      const done = st.phase, u = ease(tw.u), moving = tw.u < 1 && done > 0;
      const name = nd => nd.leaf >= 0 ? S.names[nd.leaf] : '';

      /* ---- the list after `done` merges ---- */
      const W = ph ? 300 : 880;
      const S1 = B.snaps[done], S0 = moving ? B.snaps[done-1] : S1;
      const top = (moving ? Math.max(...S0.map(x=>x.p))*(1-u) + Math.max(...S1.map(x=>x.p))*u : Math.max(...S1.map(x=>x.p)))*1.32;
      const hL = ph ? 170 : gh(120);
      const al = P.Axes({w:W,h:hL,xr:[-0.6,K-0.4],yr:[0,top],ylabel:'\\text{the list}',
        pad:{l:ph?40:54,r:ph?10:18,t:26,b:34*ls}, xticksOverride:[], yticksOverride:[], ytickfmt:()=>'', grid:false, zeroAxes:false, arrows:false});
      al.hline(0, {color:P.COL.axis, dash:'none', width:1.4, opacity:1});
      let out = '';
      const idx = (S, nd) => S.indexOf(nd);
      const col = nd => nd.leaf >= 0 ? P.COL.in : P.COL.mid;
      const lab = (x, h, nd, op) => {
        if(op < 0.5) return;
        al.note(x, h, fmt(nd.p,3), {tex:true, fs:12.5, color:P.COL.ink, anchor:'middle', dy:-8*ls});
        if(nd.leaf >= 0) al.note(x, 0, name(nd), {tex:true, fs:12.5, color:P.COL.muted, anchor:'middle', dy:20*ls});
      };
      if(moving){
        const st1 = B.steps[done-1];
        S1.forEach(nd=>{
          if(nd === st1.node){ out += bar(al, idx(S1,nd), nd.p*u, 0.62, P.COL.mid, P.COL.mid, u); lab(idx(S1,nd), nd.p*u, nd, u); return; }
          const x = idx(S0,nd)*(1-u) + idx(S1,nd)*u;
          out += bar(al, x, nd.p, 0.62, col(nd), col(nd), 0.85); lab(x, nd.p, nd, 1);
        });
        [st1.a, st1.b].forEach(nd=>{
          const x = idx(S0,nd)*(1-u) + idx(S1,st1.node)*u;
          out += bar(al, x, nd.p, 0.62, col(nd), P.COL.coral, 1-u, 2.2);
        });
      } else {
        S1.forEach((nd,i)=>{ out += bar(al, i, nd.p, 0.62, col(nd), col(nd), 0.85); lab(i, nd.p, nd, 1); });
        /* the next two to merge, ringed */
        if(S1.length > 1) [S1.length-2, S1.length-1].forEach(i=>{ out += bar(al, i, S1[i].p, 0.62, 'none', P.COL.coral, 1, 2.6); });
      }
      al.raw(out);

      /* ---- the tree, root at the left ---- */
      const { pos, leaves } = layout(B.root);
      const depth = Math.max(...B.code.map(c=>c.length));
      const span = Math.max(1, leaves-1), complete = done >= K-1;
      const lab2 = st.mode === 'pairs' ? 2.3 : 1.55;
      const at = P.Axes({w:W,h:ph?260:gh(200),xr:[-0.35,depth+lab2],yr:[-0.5,span+0.5],
        pad:{l:16,r:12,t:12,b:12}, xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false});
      const Y = nd => span - pos.get(nd);
      const grow = nd => nd.merge === done-1 && moving ? u : 1;
      (function edge(nd){
        if(nd.leaf >= 0) return;
        const live = nd.merge < done;
        nd.kids.forEach((k,i)=>{
          const g = live ? grow(nd) : 1;
          const x2 = k.d + (nd.d - k.d)*g, y2 = Y(k) + (Y(nd) - Y(k))*g;
          if(live) at.poly([[k.d, Y(k)],[x2, y2]], {color:P.COL.mid, width:2.2});
          else at.poly([[nd.d, Y(nd)],[k.d, Y(k)]], {color:P.COL.ruleStrong, width:1.2, dash:'3 4'});
          if(live && g > 0.95) at.note(nd.d + (k.d-nd.d)*0.7, Y(nd) + (Y(k)-Y(nd))*0.7, String(i), {tex:true, fs:12, color:P.COL.muted, anchor:'middle', dy:4.5*ls});
          edge(k);
        });
        const on = live && grow(nd) > 0.95;
        at.point(nd.d, Y(nd), on
          ? (nd.merge === done-1 ? {color:P.COL.mid, r:6, ring:P.COL.coral, ringw:2.4} : {color:P.COL.mid, r:4.2, ring:P.COL.plate})
          : {color:P.COL.ruleStrong, r:3, ring:P.COL.plate});
      })(B.root);
      ps.forEach((p,i)=>{
        const leaf = (function find(nd){ if(nd.leaf === i) return nd; if(nd.leaf >= 0) return null; return find(nd.kids[0]) || find(nd.kids[1]); })(B.root);
        at.point(leaf.d, Y(leaf), {color:P.COL.in, r:5.2, ring:P.COL.plate, ringw:1.6});
        at.note(leaf.d + 0.16, Y(leaf), complete ? `${S.names[i]}\\;\\;\\mathtt{${B.code[i]}}` : S.names[i],
          {tex:true, fs:13.5, color:P.COL.ink, dy:5*ls});
      });

      const lgT = `${LD('in','\\text{symbol}')}${LD('mid','\\text{merged}')}`;
      if(ph) root.querySelector('.plots').innerHTML = `<div class="plot-wrap">${al.svg()}</div><div class="plot-wrap">${at.svg()}</div>${legendRow(lgT)}`;
      else root.querySelector('.plots').innerHTML =
        `<div class="plot-wrap"><svg viewBox="0 0 ${W} ${al.H + at.H}" xmlns="http://www.w3.org/2000/svg" role="img">${nest(al.svg(),W,0,al.H)}${nest(at.svg(),W,al.H,at.H)}</svg>`
        + `<div class="legend in-plot" style="top:calc(100% * ${(al.H/(al.H+at.H)).toFixed(4)} + 4px);flex-direction:column;gap:2px">${lgT}</div></div>`;

      const H = ent(ps);
      const f = v => complete ? v : '…';
      if(st.mode === 'single'){
        root.querySelector('.ro').innerHTML = M(`
          <div><dt>Entropy $H(S)$</dt><dd>${F4(H)} bits</dd></div>
          <div><dt>Average $\\bar L$</dt><dd class="okv">${f(F4(B.Lbar))}</dd></div>
          <div><dt>Efficiency $\\eta$</dt><dd class="okv">${f(F4(H/B.Lbar))}</dd></div>
          <div><dt>Lengths</dt><dd>${f(B.code.map(c=>c.length).join(', '))}</dd></div>
          <div><dt>Variance</dt><dd>${f(F4(B.V))}</dd></div>
          <div><dt>Merges done</dt><dd>${done} of ${K-1}</dd></div>`);
      } else {
        const one = single(st.q, st.high === '1'), H1 = ent(one.ps);
        root.querySelector('.ro').innerHTML = M(`
          <div><dt>Entropy $H(S)$</dt><dd>${F4(H1)} bits</dd></div>
          <div><dt>One symbol $\\bar L$</dt><dd>${F4(one.L)}</dd></div>
          <div><dt>Pairs $\\bar L_2/2$</dt><dd class="okv">${f(F4(B.Lbar/2))}</dd></div>
          <div><dt>One symbol $\\eta$</dt><dd>${F4(H1/one.L)}</dd></div>
          <div><dt>Pairs $\\eta$</dt><dd class="okv">${f(F4(2*H1/B.Lbar))}</dd></div>
          <div><dt>Merges done</dt><dd>${done} of ${K-1}</dd></div>`);
      }

      let eq, v;
      if(!complete){
        const s = B.steps[done];
        eq = `<div class="eq"><span class="eq-label">Merge ${done+1}</span>${T(`${fmt(s.a.p,4)}+${fmt(s.b.p,4)}=${fmt(s.node.p,4)}`, true)}</div>`;
        v = `<div class="note def"><span class="note-h">Next merge</span>The two least likely entries, ${T(fmt(s.a.p,4),false)} and ${T(fmt(s.b.p,4),false)}, join and go back into the list. ${K-1-done} merges are left.</div>`;
      } else if(st.mode === 'single'){
        eq = `<div class="eq"><span class="eq-label">Average length</span>${T(`\\bar L=\\sum\\nolimits_i p_i\\,l_i=${F4(B.Lbar)},\\qquad \\eta=\\frac{H}{\\bar L}=${F4(H/B.Lbar)}`, true)}</div>`;
        v = B.V < 0.5
          ? `<div class="note ok"><span class="note-h">Small variance</span>The lengths stay close to $\\bar L$: the variance is ${F4(B.V)}. A small buffer between coder and channel is enough.</div>`
          : `<div class="note warn"><span class="note-h">Same average, larger variance</span>The variance is ${F4(B.V)}, yet $\\bar L$ is unchanged. Every Huffman code is optimal, and the tie rule moves only the spread.</div>`;
      } else {
        const one = single(st.q, st.high === '1'), H1 = ent(one.ps);
        eq = `<div class="eq"><span class="eq-label">Pairs</span>${T(`\\frac{\\bar L_2}{2}=\\frac{${F4(B.Lbar)}}{2}=${F4(B.Lbar/2)},\\qquad H=${F4(H1)}`, true)}</div>`;
        v = `<div class="note ok"><span class="note-h">Closer to the entropy</span>Coding pairs spends ${F4(B.Lbar/2)} bits a symbol against ${F4(one.L)} for single symbols. The bound falls from $H+1$ to $H+\\tfrac12$.</div>`;
      }
      root.querySelector('.derive:not(.verdict)').innerHTML = M(eq + v);

      root.querySelectorAll('[data-for]').forEach(e=>{ const on = e.dataset.for === st.mode;
        if(e.dataset.keep) e.style.visibility = on ? 'visible' : 'hidden'; else e.style.display = on ? '' : 'none'; });
      [1,2,3,4,5].forEach(i=>{ root.querySelector(`[data-out=w${i}]`).textContent = String(st.w[i-1]); });
      [1,2,3].forEach(i=>{ root.querySelector(`[data-out=q${i}]`).textContent = String(st.q[i-1]); });
      const sl = root.querySelector('[data-v=phase]'); sl.max = String(K-1); sl.value = String(done);
      root.querySelector('[data-out=phase]').textContent = String(done);
      pressSegs(root, st);
    }

    const core = { source, build, single };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="ctrls" style="grid-template-columns:repeat(3,minmax(0,1fr));padding:16px 22px;gap:12px 24px">
              ${D1.slice(0,3).map((v,i)=>slider('w'+(i+1), `Weight $s_{${i+1}}$`, 1, 100, v, ' data-for="single"')).join('')}
              ${D2.map((v,i)=>slider('q'+(i+1), `Weight $s_{${i+1}}$`, 1, 100, v, ' data-for="pairs"')).join('')}
              ${D1.slice(3).map((v,i)=>slider('w'+(i+4), `Weight $s_{${i+4}}$`, 1, 100, v, ' data-for="single" data-keep="1"')).join('')}
            </div>
            ${playbar('Merges done','phase',4,4)}</div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Code</span><span class="seg">${segs('mode', [['single','single symbols'],['pairs','pairs']])}</span></label></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>A tie puts the sum</span><span class="seg">${segs('high', [['1','high'],['0','low']])}</span></label></div>
            </div>
            <dl class="readout ro" ${RO(3)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        const v = parseInt(e.target.value,10);
        tw.stop();
        if(k === 'phase') st.phase = v;
        else if(k[0] === 'w') st.w[+k.slice(1)-1] = v;
        else st.q[+k.slice(1)-1] = v;
        draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        tw.stop();
        st[b.dataset.seg] = b.dataset.val;
        if(b.dataset.seg === 'mode') st.phase = st.mode === 'single' ? 4 : 8;
        draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', ms:900, get max(){ return st.mode === 'single' ? 4 : 8; },
        get:()=>st.phase, set:v=>{ const up = v === st.phase + 1; st.phase = v; if(up) tw.start(root, draw); else tw.stop(); },
        redraw:()=>draw(root) });
    }};
  })();

  /* =======================================================================
     MI · MUTUAL INFORMATION OF A CHANNEL
     Two inputs, two outputs. Row x0 of the channel is (1-e0, e0) and row x1
     is (e1, 1-e1). The joint pmf p(x,y) = p(x) P(y|x) gives every entropy;
     the counts of a seeded run give the same entropies estimated.
     ======================================================================= */
  const MI = (() => {
    const PER = 200, BATCHES = 25, TOK = 14;
    let st = { ch:'bsc', pc:10, z1:50, a0:20, a1:30, q:50, phase:BATCHES };
    const tw = tweener(1100);
    const eps = () => st.ch === 'bsc' ? [st.pc/100, st.pc/100] : st.ch === 'z' ? [0, st.z1/100] : [st.a0/100, st.a1/100];

    function info(J){
      const px = [J[0][0]+J[0][1], J[1][0]+J[1][1]], py = [J[0][0]+J[1][0], J[0][1]+J[1][1]];
      const HX = ent(px), HY = ent(py), HXY = ent([J[0][0], J[0][1], J[1][0], J[1][1]]);
      return { J, px, py, HX, HY, HXY, HYgX:HXY-HX, HXgY:HXY-HY, I:Math.max(0, HX+HY-HXY) };
    }
    const exact = (e0, e1, q) => info([[q*(1-e0), q*e0], [(1-q)*e1, (1-q)*(1-e1)]]);

    const cache = new Map();
    function counts(e0, e1, q, b){
      const id = [e0, e1, q].join('|');
      let c = cache.get(id);
      if(!c){ if(cache.size > 40) cache.delete(cache.keys().next().value);
        c = { g:gen(6100 + 7*Math.round(100*e0) + 131*Math.round(100*e1) + 977*Math.round(100*q)), cum:[[0,0,0,0]], last:[[]] };
        cache.set(id, c); }
      while(c.cum.length <= b){
        const nx = c.cum[c.cum.length-1].slice(), tok = [];
        for(let t=0;t<PER;t++){
          const x = uni(c.g) < q ? 0 : 1;
          const flip = uni(c.g) < (x === 0 ? e0 : e1);
          const y = flip ? 1-x : x;
          nx[2*x+y]++;
          if(t < TOK) tok.push([x, y]);
        }
        c.cum.push(nx); c.last.push(tok);
      }
      return c;
    }
    const counted = cum => { const n = cum.reduce((a,b)=>a+b,0);
      return n ? info([[cum[0]/n, cum[1]/n], [cum[2]/n, cum[3]/n]]) : null; };

    function draw(root){
      const ph = PHONE(), gh = GH(root), ls = LS();
      const [e0, e1] = eps(), q = st.q/100;
      const E = exact(e0, e1, q);
      const c = counts(e0, e1, q, st.phase), cum = c.cum[st.phase], n = st.phase*PER;
      const Cn = counted(cum);

      /* ---- the transition diagram, edges drawn to p(x,y) ---- */
      const W = ph ? 300 : 880;
      const a = P.Axes({w:W,h:ph?230:gh(180),xr:[0,10],yr:[0,6],pad:{l:8,r:8,t:10,b:10},
        xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false});
      const X = [[2.7,4.85],[2.7,1.15]], Yn = [[7.3,4.85],[7.3,1.15]];
      const rN = p => (9 + 13*Math.sqrt(p))*(1 + (ls-1)*0.4);
      const Pyx = [[1-e0, e0],[e1, 1-e1]];
      for(let x=0;x<2;x++) for(let y=0;y<2;y++){
        const w = E.J[x][y];
        if(Pyx[x][y] <= 0) continue;
        const A = X[x], B = Yn[y];
        const sw = (1.2 + 16*w).toFixed(2);
        a.raw(`<line x1="${a.sx(A[0]).toFixed(2)}" y1="${a.sy(A[1]).toFixed(2)}" x2="${a.sx(B[0]).toFixed(2)}" y2="${a.sy(B[1]).toFixed(2)}" stroke="${P.COL.h}" stroke-opacity="0.8" stroke-width="${sw}" stroke-linecap="round"/>`);
      }
      /* the probabilities P(y|x): straight edges above and below, crossing
         edges near their start where the two do not yet meet */
      const plab = (x, y) => {
        if(Pyx[x][y] <= 0) return;
        const t = `${fmt(Pyx[x][y],2)}`;
        if(x === y) a.note(5, X[x][1], t, {tex:true, fs:14, color:P.COL.h, anchor:'middle', dy:(x ? 26 : -14)*ls});
        /* a crossing edge is named inside the angle it makes with the
           straight edge from the same input, halfway between the two */
        else { const tt = 0.45, px = X[x][0] + (Yn[y][0]-X[x][0])*tt, py = X[x][1] + (Yn[y][1]-X[x][1])*tt;
          a.note(px, (py + X[x][1])/2, t, {tex:true, fs:14, color:P.COL.h, anchor:'middle', dy:5*ls}); }
      };
      for(let x=0;x<2;x++) for(let y=0;y<2;y++) plab(x, y);
      /* tokens of the newest batch crossing, while the step plays */
      if(tw.u < 1 && st.phase > 0){
        c.last[st.phase].forEach(([x,y],k)=>{
          const s = (k/TOK)*0.55, f = clamp((tw.u - s)/0.4, 0, 1);
          if(f <= 0) return;
          const A = X[x], B = Yn[y], e = ease(f);
          const px = A[0] + (B[0]-A[0])*e, py = A[1] + (B[1]-A[1])*e;
          const col = f < 1 ? P.COL.in : (x === y ? P.COL.out : P.COL.err);
          const op = f < 1 ? 1 : Math.max(0, 1 - (tw.u - s - 0.4)/0.25);
          if(op > 0) a.raw(`<circle cx="${a.sx(px).toFixed(2)}" cy="${a.sy(py).toFixed(2)}" r="${(6*(1+(ls-1)*0.4)).toFixed(2)}" fill="${col}" fill-opacity="${op.toFixed(2)}" stroke="${P.COL.plate}" stroke-opacity="${op.toFixed(2)}" stroke-width="1.4"/>`);
        });
      }
      [0,1].forEach(i=>{
        a.raw(`<circle cx="${a.sx(X[i][0]).toFixed(2)}" cy="${a.sy(X[i][1]).toFixed(2)}" r="${rN(E.px[i]).toFixed(2)}" fill="${P.COL.in}" stroke="${P.COL.plate}" stroke-width="2"/>`);
        a.raw(`<circle cx="${a.sx(Yn[i][0]).toFixed(2)}" cy="${a.sy(Yn[i][1]).toFixed(2)}" r="${rN(E.py[i]).toFixed(2)}" fill="${P.COL.out}" stroke="${P.COL.plate}" stroke-width="2"/>`);
        a.note(X[i][0], X[i][1], `x_${i}\\ \\ ${fmt(E.px[i],3)}`, {tex:true, fs:14.5, color:P.COL.ink, anchor:'end', dx:-(rN(E.px[i])+10), dy:5*ls});
        a.note(Yn[i][0], Yn[i][1], `y_${i}\\ \\ ${fmt(E.py[i],3)}`, {tex:true, fs:14.5, color:P.COL.ink, anchor:'start', dx:rN(E.py[i])+10, dy:5*ls});
      });

      /* ---- the information bar, exact and counted ---- */
      const XM = 2.8;
      const b = P.Axes({w:W,h:ph?190:gh(170),xr:[0,XM],yr:[0,1],xlabel:'\\text{bits}',
        pad:{l:(ph?70:84)*ls,r:ph?10:18,t:14,b:30}, yticksOverride:[], ytickfmt:()=>'', zeroAxes:false,
        xticksOverride:[0,0.5,1,1.5,2], xnameDrop:26*ls});
      const seg3 = (G, y0, y1, op) => {
        const cuts = [0, G.HXgY, G.HXgY + G.I, G.HXY];
        const fills = [tint(P.COL.in,0.32), tint(P.COL.out,0.3), P.COL.noiseSoft];
        const strokes = [P.COL.in, P.COL.out, P.COL.noise];
        let s = '';
        for(let k=0;k<3;k++){ const w = cuts[k+1]-cuts[k]; if(w <= 1e-6) continue;
          s += `<rect x="${b.sx(cuts[k]).toFixed(2)}" y="${b.sy(y1).toFixed(2)}" width="${(b.sx(cuts[k+1])-b.sx(cuts[k])).toFixed(2)}" height="${(b.sy(y0)-b.sy(y1)).toFixed(2)}" fill="${fills[k]}" fill-opacity="${op}" stroke="${strokes[k]}" stroke-opacity="${op}" stroke-width="1.5"/>`; }
        return s;
      };
      b.raw(seg3(E, 0.5, 0.74, 1));
      if(Cn) b.raw(seg3(Cn, 0.4, 0.47, 0.55));
      const names = [['H(X|Y)', E.HXgY, 0], ['I(X;Y)', E.I, E.HXgY], ['H(Y|X)', E.HYgX, E.HXgY + E.I]];
      names.forEach(([t, w, x0])=>{
        const px = b.sx(x0 + w) - b.sx(x0);
        if(px > 74*ls) b.note(x0 + w/2, 0.62, t, {tex:true, fs:13, color:P.COL.ink, anchor:'middle', dy:5*ls});
        else if(t === 'I(X;Y)' && px > 22*ls) b.note(x0 + w/2, 0.62, 'I', {tex:true, fs:13, color:P.COL.ink, anchor:'middle', dy:5*ls});
      });
      if(E.HX > 0.02) b.span(0, E.HX, 0.84, 'H(X)', {tex:true, color:P.COL.in, fs:13.5});
      if(E.HY > 0.02){
        const yb = b.sy(0.32), xa = b.sx(E.HXgY), xb = b.sx(E.HXY);
        b.raw(`<path d="M${xa.toFixed(2)},${(yb-5).toFixed(2)} v5 H${xb.toFixed(2)} v-5" fill="none" stroke="${P.COL.out}" stroke-width="${(1.4*(1+(ls-1)*0.75)).toFixed(2)}"/>`);
        b.note((E.HXgY + E.HXY)/2, 0.32, 'H(Y)', {tex:true, fs:13.5, color:P.COL.out, anchor:'middle', dy:19*ls});
      }
      b.note(0, 0.62, '\\text{exact}', {tex:true, fs:13, color:P.COL.muted, anchor:'end', dx:-8, dy:5*ls});
      if(Cn) b.note(0, 0.435, '\\text{counted}', {tex:true, fs:13, color:P.COL.muted, anchor:'end', dx:-8, dy:5*ls});

      const lgB = `${L('in','H(X|Y)')}${L('out','I(X;Y)')}<i style="--lg-c:var(--rule-strong)">${T('H(Y|X)',false)}</i>`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div><div class="plot-wrap">${b.svg()}</div>${legendRow(lgB)}`
        : `<div class="plot-wrap">${a.svg()}</div>`
        + `<div class="plot-wrap">${b.svg()}<div class="legend in-plot" style="top:auto;bottom:calc(${(100*(b.H-b.y0)/b.H).toFixed(2)}% + 4px);right:calc(${(100*(b.W-b.x1)/b.W).toFixed(2)}% + 4px);flex-direction:column;gap:0">${lgB}</div></div>`;

      /* the count table: sent row by received column, then the entropies */
      root.querySelector('.ro').innerHTML = M([[0,0],[0,1],[1,0],[1,1]].map(([x,y])=>
        `<div><dt>$x_${x}\\to y_${y}$</dt><dd>${cum[2*x+y]}</dd></div>`).join('') + `
        <div><dt>$H(X)$</dt><dd>${F4(E.HX)}</dd></div>
        <div><dt>$H(Y)$</dt><dd>${F4(E.HY)}</dd></div>
        <div><dt>$I(X;Y)$</dt><dd class="okv">${F4(E.I)}</dd></div>
        <div><dt>$I$ counted</dt><dd class="okv">${Cn ? F4(Cn.I) : '…'}</dd></div>`);
      const f3 = v => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);
      root.querySelector('.derive:not(.verdict)').innerHTML = M(
        `<div class="eq"><span class="eq-label">Two routes to $I(X;Y)$</span>${T(`\\begin{aligned}H(X)-H(X|Y)&=${f3(E.HX)}-${f3(E.HXgY)}=${f3(E.I)}\\\\ H(Y)-H(Y|X)&=${f3(E.HY)}-${f3(E.HYgX)}=${f3(E.I)}\\end{aligned}`, true)}</div>`);
      const same = Math.abs(Pyx[0][0] - Pyx[1][0]) < 1e-9;
      const v = same
        ? `<div class="note warn"><span class="note-h">Equal rows</span>Both inputs give the same output distribution. The output says nothing about the input, so $I(X;Y)=0$.</div>`
        : q === 0 || q === 1
        ? `<div class="note warn"><span class="note-h">A fixed input</span>The input never changes, so $H(X)=0$. Nothing uncertain is sent, and $I(X;Y)=0$.</div>`
        : !Cn
        ? `<div class="note def"><span class="note-h">Nothing sent yet</span>Press Play or Step. Each batch sends ${PER} symbols and fills the count table.</div>`
        : `<div class="note ok"><span class="note-h">The count and the formula</span>After ${n} symbols the count gives $I=${F4(Cn.I)}$ against ${F4(E.I)} exact. More batches bring the two closer.</div>`;
      root.querySelector('.verdict').innerHTML = M(v);

      root.querySelectorAll('[data-for]').forEach(e=>{
        const on = e.dataset.for.split(' ').includes(st.ch);
        if(e.dataset.keep) e.style.visibility = on ? 'visible' : 'hidden'; else e.style.display = on ? '' : 'none'; });
      ['pc','z1','a0','a1','q'].forEach(k=>{ root.querySelector(`[data-out=${k}]`).textContent = (st[k]/100).toFixed(2); });
      root.querySelector('[data-out=phase]').textContent = String(st.phase);
      root.querySelector('[data-v=phase]').value = String(st.phase);
      pressSegs(root, st);
    }

    const core = { exact, info, counts, counted, PER, BATCHES };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            ${playbar('Batches of ' + PER + ' symbols','phase',BATCHES,BATCHES)}
            <div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Channel</span><span class="seg">${segs('ch', [['bsc','BSC'],['z','Z-channel'],['any','any two by two']])}</span></label></div>
              <div>
                ${slider('pc', 'Crossover $p$', 0, 50, '0.10', ' data-for="bsc"')}
                ${slider('z1', '$P(y_0|x_1)$', 0, 100, '0.50', ' data-for="z"')}
                ${slider('a0', '$P(y_1|x_0)$', 0, 100, '0.20', ' data-for="any"')}
              </div>
              ${slider('a1', '$P(y_0|x_1)$', 0, 100, '0.30', ' data-for="any" data-keep="1"')}
              <div class="ctrl" style="grid-column:1/-1"><label><span>Input $P(x_0)$</span><span class="val" data-out="q">0.50</span></label>
                <input type="range" data-v="q" min="0" max="100" step="1" value="50"></div>
            </div>
            <dl class="readout ro" ${RO(4)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.querySelectorAll('[data-v]').forEach(s=>{ if(st[s.dataset.v] !== undefined) s.value = String(st[s.dataset.v]); });
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        tw.stop(); st[k] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        tw.stop(); st.ch = b.dataset.val; draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', max:BATCHES, ms:1200,
        get:()=>st.phase, set:v=>{ const up = v === st.phase + 1; st.phase = v; if(up) tw.start(root, draw); else tw.stop(); },
        redraw:()=>draw(root) });
    }};
  })();

  /* =======================================================================
     K · CHANNEL CAPACITY
     Row j of the matrix is the output distribution when input j is sent.
     BSC (1-p, p; p, 1-p), Z-channel (1, 0; p, 1-p), erasure channel
     (1-e, e, 0; 0, e, 1-e) and n BSC hops in a row, which is one BSC with
     p_n = (1 - (1-2p)^n)/2. The capacity is searched over P(x0) rather than
     quoted, so the peak drawn and the number shown are one computation.
     ======================================================================= */
  const K = (() => {
    let st = { ch:'bsc', p:10, q:50, R:40, hops:10 };
    const pHops = (p, n) => (1 - Math.pow(1 - 2*p, n))/2;
    function matrix(ch, p, n){
      if(ch === 'bsc') return [[1-p, p],[p, 1-p]];
      if(ch === 'z') return [[1, 0],[p, 1-p]];
      if(ch === 'bec') return [[1-p, p, 0],[0, p, 1-p]];
      const pn = pHops(p, n); return [[1-pn, pn],[pn, 1-pn]];
    }
    function use(Pyx, q){
      const px = [q, 1-q], py = Pyx[0].map((v,j)=>v*q + Pyx[1][j]*(1-q));
      const HYX = q*ent(Pyx[0]) + (1-q)*ent(Pyx[1]);
      return { px, py, HX:ent(px), HY:ent(py), HYX, I:Math.max(0, ent(py)-HYX) };
    }
    function cap(Pyx, steps){
      const S = steps || 2000;
      let best = { q:0.5, I:-1 };
      for(let i=0;i<=S;i++){ const q = i/S, v = use(Pyx, q).I; if(v > best.I + 1e-13) best = { q, I:v }; }
      return best;
    }
    /* the capacity curves of the three families, searched on a coarser grid */
    const fam = {};
    function family(ch){
      if(fam[ch]) return fam[ch];
      const pts = [];
      for(let i=0;i<=100;i++){ const p = i/100; pts.push([p, cap(matrix(ch, p, 1), 400).I]); }
      return (fam[ch] = pts);
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root), ls = LS();
      const p = st.p/100, q = st.q/100, R = st.R/100, n = st.hops;
      const Pyx = matrix(st.ch, p, n), now = use(Pyx, q), C = cap(Pyx);
      const W = ph ? 300 : 880;

      /* ---- I(X;Y) against the input distribution, with the rate ---- */
      const top = 1.2;
      const a = P.Axes({w:W,h:ph?250:gh(220),xr:[0,1],yr:[0,top],
        xlabel:'P(x_0)', ylabel:'\\text{bits a use}', pad:{l:ph?46:60,r:ph?10:18,t:26,b:30}, xticksOverride:[0,0.2,0.4,0.6,0.8], ytarget:5, arrows:false, xnameDrop:26*ls});
      a.under(`<rect x="${a.x0}" y="${a.sy(C.I).toFixed(2)}" width="${(a.x1-a.x0).toFixed(2)}" height="${(a.y0-a.sy(C.I)).toFixed(2)}" fill="${P.COL.dec.out}"/>`);
      a.under(`<rect x="${a.x0}" y="${a.y1}" width="${(a.x1-a.x0).toFixed(2)}" height="${(a.sy(C.I)-a.y1).toFixed(2)}" fill="${P.COL.dec.err}"/>`);
      /* the two regions are named at the left, where every curve starts at
         zero; a name the rate line would cross is left out */
      const yRel = C.I/2, yImp = (C.I + top)/2;
      if(C.I > 0.2 && Math.abs(R - yRel) > 0.09) a.note(0.02, yRel, 'reliable', {fs:14.5, color:P.COL.out, dy:5*ls});
      if(top - C.I > 0.24 && Math.abs(R - yImp) > 0.09) a.note(0.02, yImp, 'impossible', {fs:14.5, color:P.COL.err, dy:5*ls});
      a.curve(t=>use(Pyx, t).I, {color:P.COL.out, width:2.6});
      a.hline(R, {color:P.COL.slate, dash:'7 4', width:1.8, opacity:1});
      a.vline(q, {color:P.COL.in, dash:'4 4', width:1.4, opacity:0.9});
      a.point(q, now.I, {color:P.COL.in, r:5.5, ring:P.COL.plate});
      if(C.I > 1e-6){
        a.point(C.q, C.I, {color:P.COL.out, r:6.5, ring:P.COL.coral, ringw:2.4});
        a.note(C.q, C.I, 'C', {tex:true, fs:15, color:P.COL.coral, anchor:'middle', dy:-14*ls});
      }

      /* ---- the capacity against the channel parameter, or against the hops ---- */
      const casc = st.ch === 'casc';
      let b;
      if(!casc){
        b = P.Axes({w:W,h:ph?200:gh(150),xr:[0,1],yr:[0,1.12],xlabel:st.ch === 'bec' ? '\\epsilon' : 'p',
          ylabel:'C', pad:{l:ph?46:60,r:ph?10:18,t:26,b:30}, xticksOverride:[0,0.2,0.4,0.6,0.8], ytarget:3, arrows:false, xnameDrop:26*ls});
        [['bsc',null],['z','2 5'],['bec','8 5']].forEach(([ch, dash])=>{
          b.poly(family(ch), {color:P.COL.h, width:ch === st.ch ? 2.6 : 1.3, dash});
        });
        b.point(p, C.I, {color:P.COL.h, r:6.5, ring:P.COL.coral, ringw:2.4});
      } else {
        b = P.Axes({w:W,h:ph?200:gh(150),xr:[0,21],yr:[0,1.12],xlabel:'\\text{hops } n',
          ylabel:'C', pad:{l:ph?46:60,r:ph?10:18,t:26,b:30}, xticksOverride:[1,5,10,15], ytarget:3, arrows:false, xnameDrop:26*ls});
        const pts = []; for(let k=1;k<=20;k++) pts.push([k, 1 - h2(pHops(p, k))]);
        b.stem(pts.filter(t=>t[0] !== n), {color:P.COL.h, r:3.4});
        b.stem([[n, 1 - h2(pHops(p, n))]], {color:P.COL.coral, r:5.5});
      }
      const lgA = `${L('out','I(X;Y)')}${L('slate','R',true)}`;
      const lgB = casc ? `${LD('h','C\\ \\text{after } n\\ \\text{hops}')}`
        : `${L('h','\\text{BSC}')}${L('h','\\text{Z}','dots')}${L('h','\\text{erasure}',true)}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lgA)}<div class="plot-wrap">${b.svg()}</div>${legendRow(lgB)}`
        : `<div class="plot-wrap">${a.svg()}<div class="legend in-plot" style="${inPlot(a,'tr')}">${lgA}</div></div>`
        + `<div class="plot-wrap">${b.svg()}<div class="legend in-plot" style="${inPlot(b,'tr')}">${lgB}</div></div>`;

      const row = r => r.map(v=>fmt(v,3)).join(', ');
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Row for $x_0$</dt><dd>${row(Pyx[0])}</dd></div>
        <div><dt>Row for $x_1$</dt><dd>${row(Pyx[1])}</dd></div>
        <div><dt>$I(X;Y)$ here</dt><dd>${F4(now.I)}</dd></div>
        <div><dt>Capacity $C$</dt><dd class="okv">${F4(C.I)}</dd></div>
        <div><dt>Reached at $P(x_0)$</dt><dd class="okv">${fmt(C.q,3)}</dd></div>
        <div><dt>Rate $R$</dt><dd class="${R < C.I ? 'okv' : 'warnv'}">${R.toFixed(2)}</dd></div>`);

      const pn = pHops(p, n);
      const eq = st.ch === 'bsc' ? `C=1-H(p)=1-H(${fmt(p,2)})=${F4(C.I)}`
        : st.ch === 'bec' ? `C=1-\\epsilon=1-${fmt(p,2)}=${F4(C.I)}`
        : st.ch === 'z' ? `C=\\max_{P(x_0)} I(X;Y)=${F4(C.I)}\\ \\text{at}\\ P(x_0)=${fmt(C.q,3)}`
        : `\\begin{aligned}p_n&=\\tfrac12\\big(1-(1-2p)^{n}\\big)=${F4(pn)}\\\\ C&=1-H(p_n)=${F4(C.I)}\\end{aligned}`;
      const why = st.ch === 'bec'
        ? ` An erasure is flagged, so it costs less than a flip: $1-\\epsilon=${F4(1-p)}$ against $1-H(\\epsilon)=${F4(1-h2(p))}$.`
        : st.ch === 'z'
        ? ` The Z-channel is not symmetric, so its peak sits at $P(x_0)=${fmt(C.q,3)}$, not at $\\tfrac12$.`
        : st.ch === 'casc'
        ? ` Each hop adds its own flips, so $C$ falls with every hop: ${F4(1-h2(p))} after one, ${F4(C.I)} after ${n}.`
        : ` The BSC is symmetric, so its peak sits at $P(x_0)=\\tfrac12$.`;
      root.querySelector('.derive:not(.verdict)').innerHTML = M(
        `<div class="eq"><span class="eq-label">Capacity</span>${T(eq, true)}</div>`);
      root.querySelector('.verdict').innerHTML = M((R < C.I
          ? `<div class="note ok"><span class="note-h">Reliable</span>At $R=${R.toFixed(2)}<C$ a long enough code makes the error as small as wanted.${why}</div>`
          : `<div class="note err"><span class="note-h">Impossible</span>At $R=${R.toFixed(2)}\\ge C$ no code is reliable.${why}</div>`));

      const nm = { bsc:'Crossover $p$', z:'$P(y_0|x_1)$, $p$', bec:'Erasure $\\epsilon$', casc:'Crossover a hop $p$' };
      root.querySelector('[data-pname]').innerHTML = M(nm[st.ch]);
      root.querySelector('[data-hops]').style.visibility = casc ? 'visible' : 'hidden';
      root.querySelector('[data-out=p]').textContent = p.toFixed(2);
      root.querySelector('[data-out=q]').textContent = q.toFixed(2);
      root.querySelector('[data-out=R]').textContent = R.toFixed(2);
      root.querySelector('[data-out=hops]').textContent = String(n);
      pressSegs(root, st);
    }

    const core = { matrix, use, cap, pHops, family };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Channel</span><span class="seg">${segs('ch', [['bsc','BSC'],['z','Z-channel'],['bec','erasure'],['casc','cascade']])}</span></label></div>
              <div class="ctrl"><label><span data-pname>Crossover $p$</span><span class="val" data-out="p">0.10</span></label>
                <input type="range" data-v="p" min="0" max="100" step="1" value="${st.p}"></div>
              ${slider('hops', 'Hops $n$', 1, 20, st.hops, ' data-hops="1"')}
              ${slider('q', 'Input $P(x_0)$', 0, 100, '0.50')}
              ${slider('R', 'Rate $R$', 0, 100, '0.40')}
            </div>
            <dl class="readout ro" ${RO(3)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.querySelectorAll('[data-v]').forEach(s=>{ s.value = String(st[s.dataset.v]); });
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        st[k] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        st.ch = b.dataset.val; draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     WF · SHARING POWER OVER PARALLEL CHANNELS
     N parallel Gaussian channels with noise powers N_i. Channel i carries
     (1/2) log2(1 + P_i/N_i) bits a use. Water-filling gives
     P_i = max(0, mu - N_i) with sum P_i = P, the level mu found by
     bisection; equal shares give P_i = P/N.
     ======================================================================= */
  const WF = (() => {
    const PROF = [['flat','flat'],['rise','rising'],['notch','one notch'],['rand','random']];
    const STEPS = 20, PMAX = 8;
    let st = { prof:'rise', N:6, P:10, how:'water', phase:STEPS };
    const tw = tweener(420);
    let shownPh = STEPS;

    function noise(prof, n){
      if(prof === 'flat') return Array.from({length:n}, ()=>0.8);
      if(prof === 'rise') return Array.from({length:n}, (_,i)=>0.1*Math.pow(2, 5*i/(n-1)));
      if(prof === 'notch'){ const c = (n-1)/2; return Array.from({length:n}, (_,i)=> Math.abs(i-c) < n/8 + 0.01 ? 2.4 : 0.3); }
      const g = gen(8800 + n); return Array.from({length:n}, ()=>0.1*Math.pow(2, 5*uni(g)));
    }
    function fill(Ns, Pw){
      if(Pw <= 0) return { mu:Math.min(...Ns), Ps:Ns.map(()=>0) };
      let lo = Math.min(...Ns), hi = Math.max(...Ns) + Pw;
      for(let i=0;i<200;i++){ const m = (lo+hi)/2, s = Ns.reduce((acc,v)=>acc+Math.max(0, m-v), 0); if(s > Pw) hi = m; else lo = m; }
      const mu = (lo+hi)/2; return { mu, Ps:Ns.map(v=>Math.max(0, mu-v)) };
    }
    const bitsOf = (Ns, Ps) => Ns.map((v,i)=>0.5*lg(1 + Ps[i]/v));
    const cap = (Ns, Ps) => bitsOf(Ns, Ps).reduce((a,b)=>a+b, 0);
    const equal = (Ns, Pw) => Ns.map(()=>Pw/Ns.length);

    function draw(root){
      const ph = PHONE(), gh = GH(root), ls = LS();
      const n = st.N, Ns = noise(st.prof, n), Pfull = st.P/10;
      const Pw = Pfull*shownPh/STEPS;
      const WFs = fill(Ns, Pw), EQ = equal(Ns, Pw);
      const Ps = st.how === 'water' ? WFs.Ps : EQ;
      const bits = bitsOf(Ns, Ps);
      const Cw = cap(Ns, WFs.Ps), Ce = cap(Ns, EQ);
      /* the frame is set by the full power, so the water rises inside it */
      const full = fill(Ns, Pfull), eqf = equal(Ns, Pfull);
      const ytop = Math.max(...Ns, full.mu, ...Ns.map((v,i)=>v+eqf[i]))/0.64;
      const W = ph ? 300 : 880;

      /* ---- the vessel ---- */
      const a = P.Axes({w:W,h:ph?250:gh(190),xr:[0.4,n+0.6],yr:[0,ytop],xlabel:'\\text{subchannel } i',ylabel:'\\text{power}',
        pad:{l:ph?46:60,r:(ph?30:44)*ls,t:26,b:30}, xticksOverride:Array.from({length:n},(_,i)=>i+1).filter(i=>(n <= 10 || i % 2 === 1) && i <= n-2),
        ytarget:4, arrows:false, zeroAxes:false, xnameDrop:26*ls});
      Ns.forEach((v,i)=>{
        const x = i+1;
        a.rect(x-0.42, 0, x+0.42, v, {fill:P.COL.noiseSoft, stroke:P.COL.noise, width:1.2});
        if(Ps[i] > 1e-9){
          a.rect(x-0.42, v, x+0.42, v+Ps[i], {fill:tint(P.COL.in,0.34), stroke:'none'});
          a.poly([[x-0.42, v+Ps[i]],[x+0.42, v+Ps[i]]], {color:P.COL.in, width:2.4});
        }
        if(n <= 8 && Pw > 0) a.note(x, ytop*0.72, bits[i].toFixed(2), {tex:true, fs:13, color:P.COL.out, anchor:'middle', dy:5*ls});
      });
      if(st.how === 'water' && Pw > 0){
        a.hline(WFs.mu, {color:P.COL.in, dash:'6 4', width:1.4, opacity:0.9});
        a.note(n+0.6, WFs.mu, '\\mu', {tex:true, fs:15, color:P.COL.in, dx:8, dy:5*ls});
      }

      /* ---- capacity against total power, both ways ---- */
      const cw = [], ce = [];
      for(let i=0;i<=160;i++){ const x = PMAX*i/160; cw.push([x, cap(Ns, fill(Ns, x).Ps)]); ce.push([x, cap(Ns, equal(Ns, x))]); }
      const cmax = Math.max(1, cw[cw.length-1][1])*1.12;
      const b = P.Axes({w:W,h:ph?200:gh(140),xr:[0,PMAX],yr:[0,cmax],xlabel:'P',ylabel:'C\\;(\\text{bits a use})',
        pad:{l:ph?46:60,r:(ph?30:44)*ls,t:26,b:30}, xticksOverride:[0,2,4,6], ytarget:4, arrows:false, xnameDrop:26*ls});
      b.poly(cw, {color:P.COL.in, width:2.6});
      b.poly(ce, {color:P.COL.in, width:2, dash:'7 5'});
      b.vline(Pw, {color:P.COL.ink, dash:'4 4', width:1.4, opacity:0.8});
      const water = st.how === 'water';
      b.point(Pw, Ce, water ? {color:P.COL.in, r:4.5, ring:P.COL.plate} : {color:P.COL.in, r:6.5, ring:P.COL.coral, ringw:2.4});
      b.point(Pw, Cw, water ? {color:P.COL.in, r:6.5, ring:P.COL.coral, ringw:2.4} : {color:P.COL.in, r:4.5, ring:P.COL.plate});

      const lgA = `<i style="--lg-c:var(--rule-strong)">${T('\\text{noise } N_i',false)}</i>${L('in','\\text{power } P_i')}` + (n <= 8 ? `${L('out','\\text{bits } c_i')}` : '');
      const lgB = `${L('in','\\text{water-filling}')}${L('in','\\text{equal shares}',true)}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lgA)}<div class="plot-wrap">${b.svg()}</div>${legendRow(lgB)}`
        : `<div class="plot-wrap">${a.svg()}<div class="legend in-plot" style="${inPlot(a,'tr')}">${lgA}</div></div>`
        + `<div class="plot-wrap">${b.svg()}<div class="legend in-plot" style="${inPlot(b,'tl')}">${lgB}</div></div>`;

      const used = WFs.Ps.filter(v=>v > 1e-9).length;
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>${water ? 'Level $\\mu$' : 'Share $P/N$'}</dt><dd>${water ? (Pw > 0 ? F4(WFs.mu) : '…') : F4(Pw/n)}</dd></div>
        <div><dt>Channels used</dt><dd>${water ? used : (Pw > 0 ? n : 0)} of ${n}</dd></div>
        <div><dt>Power poured $P$</dt><dd>${Pw.toFixed(2)}</dd></div>
        <div><dt>$C$ water-filling</dt><dd class="${water ? 'okv' : ''}">${F4(Cw)}</dd></div>
        <div><dt>$C$ equal shares</dt><dd class="${water ? '' : 'okv'}">${F4(Ce)}</dd></div>
        <div><dt>Gain</dt><dd>${F4(Cw - Ce)} bits</dd></div>`);
      root.querySelector('.derive:not(.verdict)').innerHTML = M(water
        ? `<div class="eq"><span class="eq-label">Water level and capacity</span>${T(`\\begin{aligned}\\textstyle\\sum_i\\max(0,\\,\\mu-N_i)&=P=${Pw.toFixed(2)}\\ \\Rightarrow\\ \\mu=${Pw > 0 ? F4(WFs.mu) : '\\min_i N_i'}\\\\ C=\\textstyle\\sum_i\\tfrac12\\log_2\\big(1+P_i/N_i\\big)&=${F4(Cw)}\\ \\text{bits}\\end{aligned}`, true)}</div>`
        : `<div class="eq"><span class="eq-label">Equal shares and capacity</span>${T(`\\begin{aligned}P_i=P/N&=${Pw.toFixed(2)}/${n}=${F4(Pw/n)}\\\\ C=\\textstyle\\sum_i\\tfrac12\\log_2\\big(1+P_i/N_i\\big)&=${F4(Ce)}\\ \\text{bits}\\end{aligned}`, true)}</div>`);
      const gain = Cw - Ce;
      const v = Pw <= 0
        ? `<div class="note def"><span class="note-h">Empty</span>No power is poured yet. Press Play and watch the quietest channels fill first.</div>`
        : !water
        ? `<div class="note warn"><span class="note-h">Equal shares</span>Each channel gets $P/N$. The noisy ones waste power that the quiet ones use better: water-filling gains ${F4(gain)} bits.</div>`
        : used < n
        ? `<div class="note ok"><span class="note-h">The quietest first</span>Only the ${used} channels with $N_i<\\mu$ get power. The others stay dry, and the gain over equal shares is ${F4(gain)} bits.</div>`
        : `<div class="note ok"><span class="note-h">All under water</span>Every channel gets power, and the shares differ only by the floors. The gain over equal shares shrinks to ${F4(gain)} bits.</div>`;
      root.querySelector('.verdict').innerHTML = M(v);

      root.querySelector('[data-out=N]').textContent = String(n);
      root.querySelector('[data-out=P]').textContent = Pfull.toFixed(1);
      root.querySelector('[data-out=phase]').textContent = (Pfull*st.phase/STEPS).toFixed(2);
      root.querySelector('[data-v=phase]').value = String(st.phase);
      pressSegs(root, st);
    }

    const core = { noise, fill, cap, bitsOf, equal, STEPS, PMAX };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            ${playbar('Power poured','phase',STEPS,'1.00')}
            <div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Noise</span><span class="seg">${segs('prof', PROF)}</span></label></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>Sharing</span><span class="seg">${segs('how', [['water','water-filling'],['equal','equal shares']])}</span></label></div>
              ${slider('N', 'Subchannels $N$', 4, 16, st.N)}
              ${slider('P', 'Total power $P$', 1, 10*PMAX, '1.0')}
            </div>
            <dl class="readout ro" ${RO(3)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.querySelectorAll('[data-v]').forEach(s=>{ s.value = String(st[s.dataset.v]); });
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        tw.stop(); st[k] = parseInt(e.target.value,10); shownPh = st.phase; draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        tw.stop(); st[b.dataset.seg] = b.dataset.val; shownPh = st.phase; draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      /* a step pours one twentieth of the power; the level rises smoothly
         from where it was, so the draw reads a fractional step */
      const pour = (root) => { shownPh = st.phase - 1 + tw.u; draw(root); };
      LABS.KIT.transport(root, { key:'phase', max:STEPS, ms:480,
        get:()=>st.phase, set:v=>{ const up = v === st.phase + 1; st.phase = v;
          if(up && !REDUCED()){ shownPh = v - 1; tw.start(root, pour); } else { tw.stop(); shownPh = v; } },
        redraw:()=>{ if(tw.u >= 1) shownPh = st.phase; draw(root); } });
    }};
  })();

  return { I, TS, J, MI, K, WF };
})());
