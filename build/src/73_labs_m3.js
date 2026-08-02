/* ==========================================================================
   Module 3 laboratory.

   F · From waveform to basis — Gram-Schmidt run on a signal set the reader
       chooses, with the basis it produces, the constellation and the number of
       dimensions reported as they change.

   The numerical core is written here rather than ported. The equation
   reference the ported version carries is wrong for this edition: it cites
   7.1, which is the sampling theorem, where the procedure is 8.1.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F;
  const P = PLOT;

  const F = (() => {
    const N = 600, TMAX = 3;                      /* the interval, sampled */
    let st = { set:'ramp', order:0 };

    /* Each set is three waveforms on [0,3], given as functions of t. They are
       chosen so that the answer differs: one set needs three dimensions, one
       needs two because a signal repeats a combination, one needs one because
       all three are multiples of each other. */
    const SETS = {
      /* the worked example of the module: s3 = s1 + s2, so two dimensions */
      steps: { name:'steps', fs:[
        t => (t>=0 && t<2) ? 1 : 0,
        t => (t>=2 && t<3) ? 1 : 0,
        t => (t>=0 && t<3) ? 1 : 0 ] },
      /* three disjoint pulses: nothing overlaps, so three dimensions */
      disjoint: { name:'disjoint pulses', fs:[
        t => (t>=0 && t<1) ? 1 : 0,
        t => (t>=1 && t<2) ? 1 : 0,
        t => (t>=2 && t<3) ? 1 : 0 ] },
      /* all three are multiples of one shape, so one dimension */
      scaled: { name:'scaled copies', fs:[
        t => (t>=0 && t<3) ? 1 : 0,
        t => (t>=0 && t<3) ? -0.5 : 0,
        t => (t>=0 && t<3) ? 1.5 : 0 ] },
      /* a ramp, a step and their difference: two dimensions */
      ramp: { name:'ramp and step', fs:[
        t => (t>=0 && t<3) ? t/3 : 0,
        t => (t>=0 && t<3) ? 1 : 0,
        t => (t>=0 && t<3) ? 1 - t/3 : 0 ] }
    };

    const dt = TMAX/N;
    const sample = f => Array.from({length:N}, (_,i)=>f((i+0.5)*dt));
    const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0)*dt;

    /* Gram-Schmidt, written from the three steps of the scene. A remainder
       whose energy is below the tolerance adds no basis function; the
       tolerance is relative to the largest signal energy in the set, so a set
       of tiny signals is not silently declared one-dimensional. */
    function gramSchmidt(sigs){
      const scale = Math.max(...sigs.map(s=>dot(s,s)), 1e-12);
      const basis = [], coords = [];
      sigs.forEach(s=>{
        const c = basis.map(b=>dot(s,b));
        const g = s.map((v,i)=>v - c.reduce((acc,ci,k)=>acc+ci*basis[k][i], 0));
        const eg = dot(g,g);
        if(eg > 1e-9*scale){
          const psi = g.map(v=>v/Math.sqrt(eg));
          basis.push(psi);
          c.push(Math.sqrt(eg));
        }
        coords.push(c.slice());
      });
      const dim = basis.length;
      coords.forEach(c=>{ while(c.length < dim) c.push(0); });
      return { basis, coords };
    }

    function draw(root){
      const set = SETS[st.set];
      const idx = [[0,1,2],[1,2,0],[2,0,1]][st.order % 3];
      const sigs = idx.map(i=>sample(set.fs[i]));
      const { basis, coords } = gramSchmidt(sigs);

      const wave = (arr, name, colour) => {
        const a = P.Axes({w:250,h:150,xr:[0,TMAX],yr:[-1.8,1.8],
          xlabel:'t',ylabel:name,pad:{l:44,r:16,t:22,b:34},xtarget:3,ytarget:3});
        a.poly(arr.map((v,i)=>[(i+0.5)*dt, v]),{color:colour,width:2});
        return a.svg();
      };

      const cols = [P.COL.in, P.COL.out, P.COL.mid];

      /* The constellation is drawn on the first two axes. In one dimension the
         second coordinate is zero for every signal, which is the honest
         picture; in three the third is named in the readout instead. */
      const xs = coords.map(c=>c[0]||0), ys = coords.map(c=>c[1]||0);
      const lim = Math.max(1, ...xs.map(Math.abs), ...ys.map(Math.abs))*1.35;
      const cx = P.Axes({w:420,h:300,xr:[-lim,lim],yr:[-lim,lim],
        xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:52,r:24,t:26,b:42},xtarget:4,ytarget:4});
      /* The points are not labelled in the figure. Each takes the colour of the
         waveform it came from, and the coordinates are listed in order in the
         readout, so a label beside every point would repeat both. */
      coords.forEach((c,k)=>{ cx.point(c[0]||0, c[1]||0, {color:cols[k], r:6}); });

      /* The row style is inline rather than in the shared sheet: one laboratory
         needing three figures side by side is not a reason to change the
         stylesheet every scene in the course reads. */
      /* An svg with a viewBox and no width fills whatever box it is put in, so
         each one is given a box of its own. Without this the three signals are
         drawn a column wide each and the laboratory is three screens tall. */
      const row = 'display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start';
      const cell = h => `<div style="flex:0 0 240px;max-width:240px">${h}</div>`;
      root.querySelector('.plots').innerHTML =
        `<div style="${row}">${sigs.map((s,k)=>cell(wave(s,'s_'+(k+1)+'(t)',cols[k]))).join('')}</div>` +
        `<div style="${row}">${basis.map((b,k)=>cell(wave(b,'\\psi_'+(k+1)+'(t)',P.COL.h))).join('')}</div>` +
        `<div style="max-width:420px;margin-top:6px">${cx.svg()}</div>`;

      const energies = coords.map(c=>c.reduce((s,v)=>s+v*v,0));
      const dists = [];
      for(let i=0;i<coords.length;i++) for(let j=i+1;j<coords.length;j++)
        dists.push(Math.sqrt(coords[i].reduce((s,v,k)=>s+(v-coords[j][k])**2,0)));

      root.querySelector('.ro').innerHTML = `
        <div><dt>Signals M</dt><dd>3</dd></div>
        <div><dt>Dimensions N</dt><dd class="okv">${basis.length}</dd></div>
        <div><dt>Energies</dt><dd>${energies.map(e=>fmt(e,3)).join(', ')}</dd></div>
        <div><dt>Coordinates</dt><dd>${coords.map((c,k)=>
          `<span style="color:${cols[k]}">(${c.map(v=>fmt(v,2)).join(', ')})</span>`).join(' ')}</dd></div>
        <div><dt>Pairwise distances</dt><dd>${dists.map(d=>fmt(d,3)).join(', ')}</dd></div>
        <div><dt>Smallest distance</dt><dd class="${Math.min(...dists)<1e-6?'warnv':'okv'}">${fmt(Math.min(...dists),3)}</dd></div>`;

      root.querySelector('.verdict').innerHTML =
        basis.length < 3
        ? `<div class="note ok"><span class="note-h">Fewer axes than signals</span>
             Three waveforms needed only ${T(String(basis.length),false)}
             ${basis.length===1?'axis':'axes'}, because ${basis.length===1
               ? 'all three are multiples of one shape'
               : 'one of them is already a combination of the others'} — its remainder
             ${T('g_k',false)} came out zero and added nothing. The receiver needs
             ${T(String(basis.length),false)} matched ${basis.length===1?'filter':'filters'},
             not three.</div>`
        : `<div class="note warn"><span class="note-h">As many axes as signals</span>
             Nothing in this set is a combination of the others, so every signal contributed a
             new axis. Three matched filters are needed, and the constellation above shows only
             two of the three coordinates.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=set]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.set)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div></div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Signal set <span class="seg">
                <button data-seg="set" data-val="steps">steps</button>
                <button data-seg="set" data-val="disjoint">disjoint</button>
                <button data-seg="set" data-val="scaled">scaled</button>
                <button data-seg="set" data-val="ramp">ramp</button></span></label></div>
              <div class="ctrl"><label>Order the signals are taken in <span class="val" data-out="order">0</span></label>
                <input type="range" data-v="order" min="0" max="2" step="1" value="0"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
            <div class="note def"><span class="note-h">What to try</span>
              Change the order and watch the basis functions change while the energies and the
              distances do not. The constellation is the same picture seen from a different angle,
              and every result of the next module depends only on those distances.</div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=set]'); if(!b) return;
        st.set=b.dataset.val; draw(root); });
      draw(root);
    }};
  })();

  return { F };
})());
