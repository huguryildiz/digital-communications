/* ==========================================================================
   Module 4 laboratory.

   G · Constellations and decision regions — the reader chooses a constellation
       and a noise level; the laboratory draws the regions from the rule the
       module derives, scatters the observations a receiver would actually see,
       counts the ones that land in the wrong region, and puts that count beside
       the union bound.

   The count and the bound are computed by different routes on purpose. A
   simulation that agreed with the bound by construction would prove nothing.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, fmt = LABS.KIT.F;
  const P = PLOT;

  function rng(seed){ let a=seed>>>0; return function(){
    a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
    const u=Math.max(1e-12,r()), v=r();
    o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }
  function Q(x){
    const t=1/(1+0.2316419*Math.abs(x));
    const d=0.3989422804014327*Math.exp(-x*x/2);
    const p=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
    return x>=0?p:1-p;
  }

  const G = (() => {
    let st = { set:'qpsk', esn0:10, trials:3 };

    /* Every constellation is normalised to unit average energy, so that
       changing the set changes the geometry and not the power. That is what
       makes the comparison between them a fair one. */
    function points(){
      const raw = {
        binary: [[-1,0],[1,0]],
        qpsk:   [[1,1],[-1,1],[-1,-1],[1,-1]],
        psk8:   Array.from({length:8},(_,k)=>[Math.cos(k*Math.PI/4), Math.sin(k*Math.PI/4)]),
        pam4:   [[-3,0],[-1,0],[1,0],[3,0]],
        qam16:  [].concat(...[-3,-1,1,3].map(x=>[-3,-1,1,3].map(y=>[x,y])))
      }[st.set];
      const e = raw.reduce((s,p)=>s+p[0]*p[0]+p[1]*p[1],0)/raw.length;
      const k = 1/Math.sqrt(e);
      return raw.map(p=>[p[0]*k, p[1]*k]);
    }

    function draw(root){
      const pts = points();
      const M = pts.length;
      const esn0 = Math.pow(10, st.esn0/10);
      /* Average energy is one by construction, so N0 follows from Es/N0. */
      const N0 = 1/esn0, sigma = Math.sqrt(N0/2);
      const nTrial = [200, 600, 2000, 6000][st.trials - 1] || 2000;

      /* Distances, the minimum, and the average number of points at it. */
      let dmin = Infinity;
      const d2 = [];
      for(let i=0;i<M;i++) for(let j=0;j<M;j++) if(i!==j){
        const dd = Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]);
        d2.push(dd); if(dd < dmin) dmin = dd;
      }
      const near = d2.filter(d=>d < dmin*1.0001).length / M;
      const bound = d2.reduce((s,d)=>s+Q(Math.sqrt(d*d/(2*N0))),0)/M;
      const approx = near*Q(Math.sqrt(dmin*dmin/(2*N0)));

      /* The measured error rate. Every trial picks a symbol, adds noise, and
         asks which point is nearest — the rule itself, applied to a sample. */
      const nz = gauss(20260802, 2*nTrial, sigma);
      const rs = rng(4242);
      let wrong = 0;
      const scatter = [];
      for(let t=0;t<nTrial;t++){
        const i = Math.min(M-1, Math.floor(rs()*M));
        const x = pts[i][0] + nz[2*t], y = pts[i][1] + nz[2*t+1];
        let best = 0, bd = Infinity;
        for(let k=0;k<M;k++){
          const dd = (x-pts[k][0])**2 + (y-pts[k][1])**2;
          if(dd < bd){ bd = dd; best = k; }
        }
        if(best !== i) wrong++;
        if(scatter.length < 900) scatter.push([x, y, best !== i]);
      }
      const measured = wrong/nTrial;

      const lim = Math.max(...pts.map(p=>Math.max(Math.abs(p[0]),Math.abs(p[1]))))*1.9 + 0.4;
      const a = P.Axes({w:600,h:420,xr:[-lim,lim],yr:[-lim,lim],
        xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:56,r:26,t:28,b:44},xtarget:4,ytarget:4});
      const REG = [P.COL.dec.in,P.COL.dec.out,P.COL.dec.mid,P.COL.dec.h,P.COL.dec.err];
      const n = 92, step = 2*lim/n;
      for(let i=0;i<n;i++) for(let j=0;j<n;j++){
        const x=-lim+(i+0.5)*step, y=-lim+(j+0.5)*step;
        let best=0, bd=Infinity;
        pts.forEach((p,k)=>{ const dd=(x-p[0])**2+(y-p[1])**2; if(dd<bd){bd=dd;best=k;} });
        a.rect(x-step/2,y-step/2,x+step/2,y+step/2,{fill:REG[best%REG.length]});
      }
      scatter.forEach(([x,y,bad])=>a.point(x,y,{color:bad?P.COL.err:P.COL.noise,
        r:bad?2.4:1.6, ring:'none'}));
      pts.forEach(p=>a.point(p[0],p[1],{color:P.COL.ink,r:5}));

      root.querySelector('.plots').innerHTML = a.svg();
      root.querySelector('.ro').innerHTML = `
        <div><dt>Points M</dt><dd>${M}</dd></div>
        <div><dt>Bits per symbol</dt><dd>${fmt(Math.log2(M),3)}</dd></div>
        <div><dt>E_s/N₀</dt><dd>${st.esn0} dB</dd></div>
        <div><dt>Minimum distance</dt><dd class="okv">${fmt(dmin,4)}</dd></div>
        <div><dt>Nearest neighbours</dt><dd>${fmt(near,3)}</dd></div>
        <div><dt>Trials</dt><dd>${nTrial}</dd></div>
        <div><dt>Measured symbol errors</dt><dd class="okv">${wrong} of ${nTrial} = ${fmt(measured,5)}</dd></div>
        <div><dt>Union bound</dt><dd>${fmt(bound,5)}</dd></div>
        <div><dt>Nearest-neighbour form</dt><dd>${fmt(approx,5)}</dd></div>`;

      root.querySelector('.verdict').innerHTML =
        measured > bound*1.05 && wrong > 20
        ? `<div class="note err"><span class="note-h">The measurement is above the bound</span>
             That should not happen — the union bound is an upper bound. With this many trials the
             count still varies by a few per cent from run to run, so raise the trial count before
             concluding anything.</div>`
        : bound > 0.5
        ? `<div class="note warn"><span class="note-h">The bound has stopped meaning anything</span>
             At this noise level the terms of the sum are large and they overlap heavily, so adding
             them over-counts badly — the bound is near or above one. Raise
             ${T('E_s/N_0',false)} and watch it become useful.</div>`
        : `<div class="note ok"><span class="note-h">Bound above, measurement below</span>
             The measured rate is ${T(fmt(measured,5),false)} and the bound is
             ${T(fmt(bound,5),false)}. The bound is above it, as an upper bound must be, and the
             gap is the double counting: an observation closer to two other points than to its own
             is counted twice in the sum and once in the experiment.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=set]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.set)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-6-6" style="gap:40px">
          <div class="col stack"><div class="plots"></div></div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Constellation <span class="seg">
                <button data-seg="set" data-val="binary">binary</button>
                <button data-seg="set" data-val="pam4">4-PAM</button>
                <button data-seg="set" data-val="qpsk">QPSK</button>
                <button data-seg="set" data-val="psk8">8-PSK</button>
                <button data-seg="set" data-val="qam16">16-QAM</button></span></label></div>
              <div class="ctrl"><label>E_s/N₀ in dB <span class="val" data-out="esn0">10</span></label>
                <input type="range" data-v="esn0" min="0" max="20" step="1" value="10"></div>
              <div class="ctrl"><label>Trials, 1 to 4 <span class="val" data-out="trials">3</span></label>
                <input type="range" data-v="trials" min="1" max="4" step="1" value="3"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
            <div class="note def"><span class="note-h">What to try</span>
              Every constellation here carries the same average energy, so switching between them
              changes the geometry and nothing else. Watch the minimum distance fall as the number
              of points rises, and watch the error rate follow it.</div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=set]'); if(!b) return;
        st.set=b.dataset.val; draw(root); });
      draw(root);
    }};
  })();

  return { G };
})());
