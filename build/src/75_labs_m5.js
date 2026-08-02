/* ==========================================================================
   Module 5 laboratory.

   H · Error probability against signal-to-noise ratio — the reader picks a
       modulation scheme; the laboratory draws the closed form the module
       derives and, over it, the error rate measured by simulating the channel
       and the detector at a series of signal-to-noise ratios.

   The curve and the dots are computed by different routes. The curve comes
   from the geometry: minimum distance, average neighbour count, one Q. The
   dots come from generating noise, adding it to a symbol and asking which
   point is nearest. Nothing is shared between them but the constellation.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, fmt = LABS.KIT.F;
  const P = PLOT;

  function rng(seed){ let a=seed>>>0; return function(){
    a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  function Q(x){
    const t=1/(1+0.2316419*Math.abs(x));
    const d=0.3989422804014327*Math.exp(-x*x/2);
    const p=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
    return x>=0?p:1-p;
  }

  const H = (() => {
    /* Every constellation is written down in whole numbers and then scaled to
       unit average symbol energy, so that changing the scheme changes the
       geometry and never the power. `dim` is how many basis functions the
       scheme uses, and therefore how many independent noise components reach
       the detector — a one-dimensional scheme collects half the noise. */
    const PSK = M => Array.from({length:M},(_,k)=>[Math.cos(2*Math.PI*k/M), Math.sin(2*Math.PI*k/M)]);
    const SETS = {
      bpsk:  {label:'BPSK',   dim:1, raw:[[-1,0],[1,0]]},
      bfsk:  {label:'BFSK',   dim:2, raw:[[1,0],[0,1]]},
      qpsk:  {label:'QPSK',   dim:2, raw:PSK(4)},
      psk8:  {label:'8-PSK',  dim:2, raw:PSK(8)},
      pam4:  {label:'4-PAM',  dim:1, raw:[[-3,0],[-1,0],[1,0],[3,0]]},
      qam16: {label:'16-QAM', dim:2, raw:[].concat(...[-3,-1,1,3].map(x=>[-3,-1,1,3].map(y=>[x,y])))}
    };
    const ORDER = ['bpsk','bfsk','qpsk','psk8','pam4','qam16'];

    let st = { set:'qpsk', esn0:10, trials:3 };

    function geometry(key){
      const S = SETS[key];
      const e = S.raw.reduce((s,p)=>s+p[0]*p[0]+p[1]*p[1],0)/S.raw.length;
      const k = 1/Math.sqrt(e);
      const pts = S.raw.map(p=>[p[0]*k, p[1]*k]);
      const M = pts.length;
      let dmin = Infinity;
      for(let i=0;i<M;i++) for(let j=i+1;j<M;j++)
        dmin = Math.min(dmin, Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]));
      /* The average number of points at the minimum distance — the N_min of
         the module, counted rather than quoted. */
      let near = 0;
      for(let i=0;i<M;i++) for(let j=0;j<M;j++) if(i!==j &&
        Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]) < dmin*1.0001) near++;
      return { pts, M, dmin, near:near/M, dim:S.dim, label:S.label, bits:Math.log2(M) };
    }

    /* The closed form of the module: one Q of the minimum distance, weighted by
       how many neighbours sit at it. */
    function closed(g, esn0dB){
      const N0 = 1/Math.pow(10, esn0dB/10);
      return g.near * Q(Math.sqrt(g.dmin*g.dmin/(2*N0)));
    }

    /* The measurement. Draw a symbol, add Gaussian noise of variance N0/2 to
       each dimension the scheme uses, and decide by nearest point. */
    function measure(g, esn0dB, n, seed){
      const N0 = 1/Math.pow(10, esn0dB/10), sig = Math.sqrt(N0/2);
      const r = rng(seed);
      let wrong = 0;
      for(let t=0;t<n;t++){
        const i = Math.min(g.M-1, Math.floor(r()*g.M));
        const u = Math.max(1e-12, r()), v = r();
        const m = sig*Math.sqrt(-2*Math.log(u));
        const x = g.pts[i][0] + m*Math.cos(2*Math.PI*v);
        const y = g.dim === 2 ? g.pts[i][1] + m*Math.sin(2*Math.PI*v) : g.pts[i][1];
        let best = 0, bd = Infinity;
        for(let k=0;k<g.M;k++){
          const d = (x-g.pts[k][0])**2 + (y-g.pts[k][1])**2;
          if(d < bd){ bd = d; best = k; }
        }
        if(best !== i) wrong++;
      }
      return { wrong, n, rate: wrong/n };
    }

    const MARKS = [0,2,4,6,8,10,12,14,16,18,20];

    function draw(root){
      const g = geometry(st.set);
      const nTrial = [400, 1500, 5000, 20000][st.trials - 1] || 5000;
      const cl = v => Math.log10(Math.max(1e-12, v));

      const a = P.Axes({w:600,h:420,xr:[0,20],yr:[-5.4,0.3],
        xlabel:'E_s/N_0\\;(\\mathrm{dB})', ylabel:'\\log_{10}P_s',
        pad:{l:60,r:26,t:26,b:46}, xtarget:5, ytarget:6});
      a.curve(d=>cl(closed(g, d)), {color:P.COL.in, width:2.2});

      /* One measurement for each mark, each with its own seed so that the
         points are independent of one another and identical between runs. */
      const dots = MARKS.map((d,i)=>({ d, r: measure(g, d, nTrial, 20260802 + 977*i) }));
      dots.forEach(({d,r})=>{
        if(r.wrong === 0) return;
        a.point(d, Math.max(-5.2, cl(r.rate)), {color:P.COL.out, r:4});
      });
      const here = closed(g, st.esn0);
      const meas = measure(g, st.esn0, nTrial, 20260802 + 977*MARKS.indexOf(st.esn0));
      const ebn0 = st.esn0 - 10*Math.log10(g.bits);

      root.querySelector('.plots').innerHTML = a.svg();
      root.querySelector('.ro').innerHTML = `
        <div><dt>Points M</dt><dd>${g.M}</dd></div>
        <div><dt>Bits per symbol</dt><dd>${fmt(g.bits,3)}</dd></div>
        <div><dt>Dimensions used</dt><dd>${g.dim}</dd></div>
        <div><dt>Minimum distance</dt><dd class="okv">${fmt(g.dmin,4)}</dd></div>
        <div><dt>Nearest neighbours</dt><dd>${fmt(g.near,3)}</dd></div>
        <div><dt>E_s/N₀ at the mark</dt><dd>${st.esn0} dB</dd></div>
        <div><dt>E_b/N₀ at the mark</dt><dd>${fmt(ebn0,3)} dB</dd></div>
        <div><dt>Closed form</dt><dd class="okv">${fmt(here,6)}</dd></div>
        <div><dt>Measured</dt><dd class="okv">${meas.wrong} of ${nTrial} = ${fmt(meas.rate,6)}</dd></div>
        <div><dt>Trials a point</dt><dd>${nTrial}</dd></div>`;

      /* An error count is a binomial draw. Its own standard deviation is the
         yardstick for whether a gap between the two routes means anything. */
      const sd = Math.sqrt(Math.max(here,1e-9)*(1-here)*nTrial);
      const off = (meas.wrong - here*nTrial) / Math.max(sd, 1e-9);
      root.querySelector('.verdict').innerHTML =
        meas.wrong === 0
        ? `<div class="note warn"><span class="note-h">No errors at this mark</span>
             The closed form gives ${T(fmt(here,7),false)}, so in ${nTrial} trials the expected
             number of errors is ${T(fmt(here*nTrial,3),false)} — under one. Seeing none is what
             should happen. Raise the trial count or lower ${T('E_s/N_0',false)} to measure
             anything here. This is the reason error rates below about
             ${T('10^{-5}',false)} are quoted from the formula and not from a simulation.</div>`
        : Math.abs(off) < 3
        ? `<div class="note ok"><span class="note-h">The two routes agree</span>
             The formula predicts ${T(fmt(here*nTrial,2),false)} errors and the simulation counted
             ${meas.wrong}, which is ${T(fmt(Math.abs(off),2),false)} standard deviations away.
             The geometry of the constellation was enough: no waveform was ever generated to get
             the curve, only a distance and a neighbour count.</div>`
        : `<div class="note def"><span class="note-h">A real gap, not noise</span>
             The formula predicts ${T(fmt(here*nTrial,2),false)} errors and the simulation counted
             ${meas.wrong} — ${T(fmt(Math.abs(off),2),false)} standard deviations
             ${off>0?'above':'below'}. The closed form counts only the nearest neighbours, so it
             is an approximation, and at low ${T('E_s/N_0',false)} the points further away still
             contribute. Push the mark to the right and watch the gap close.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=set]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.set)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-6-6" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="note def"><span class="note-h">Reading the figure</span>
              The line is the closed form and the dots are measurements. Every dot needed a few
              thousand simulated symbols; the line needed one evaluation of ${T('Q',false)}.
              That is the whole argument for doing the geometry.</div>
          </div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Scheme <span class="seg">
                ${ORDER.map(k=>`<button data-seg="set" data-val="${k}">${SETS[k].label}</button>`).join('')}
                </span></label></div>
              <div class="ctrl"><label>Mark at E_s/N₀ in dB <span class="val" data-out="esn0">10</span></label>
                <input type="range" data-v="esn0" min="0" max="20" step="2" value="10"></div>
              <div class="ctrl"><label>Trials a point, 1 to 4 <span class="val" data-out="trials">3</span></label>
                <input type="range" data-v="trials" min="1" max="4" step="1" value="3"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
            <div class="note def"><span class="note-h">What to try</span>
              Put BPSK and QPSK side by side in energy per bit: they need the same
              ${T('E_b/N_0',false)}, and QPSK carries twice the bits. Then step through 8-PSK,
              16-QAM and 4-PAM and watch the curve slide to the right — that shift is the price of
              every extra bit a symbol.</div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=set]'); if(!b) return;
        st.set=b.dataset.val; draw(root); });
      draw(root);
    }};
  })();

  return { H };
})());
