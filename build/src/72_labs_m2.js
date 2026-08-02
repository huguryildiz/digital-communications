/* ==========================================================================
   Module 2 laboratories.

   C · The matched filter — the pulse, the noise and the sampling instant
       against the bound 2E/N0.
   D · Threshold and error probability — the threshold placed by hand against
       the one the derivation gives.
   E · The eye diagram — the roll-off, the timing and the noise, closing an eye
       three different ways.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F;
  const P = PLOT;

  function rng(seed){ let a=seed>>>0; return function(){
    a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
    const u=Math.max(1e-12,r()), v=r();
    o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }

  /* The Gaussian tail. A figure and a readout need about seven digits, and the
     closed forms they draw are checked against a simulation in the numerical
     gate rather than against this approximation. */
  function Q(x){
    const t = 1/(1+0.2316419*Math.abs(x));
    const d = 0.3989422804014327*Math.exp(-x*x/2);
    const p = d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
    return x>=0 ? p : 1-p;
  }
  const sinc = x => Math.abs(x)<1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);

  /* =======================================================================
     C · THE MATCHED FILTER
     ======================================================================= */
  const C = (() => {
    const N = 512, TB = 1;
    let st = { shape:'rect', noise:30, samp:100 };

    /* Three pulses, each normalised to unit energy over [0,1], so that what
       changes between them is the shape and not the energy the bound depends
       on. That is the point the laboratory exists to make. */
    const SHAPES = {
      rect: t => (t>=0 && t<=TB) ? 1 : 0,
      sine: t => (t>=0 && t<=TB) ? Math.SQRT2*Math.sin(Math.PI*t/TB) : 0,
      tri:  t => (t>=0 && t<=TB) ? Math.sqrt(3)*(1-Math.abs(2*t/TB-1))*2/Math.sqrt(3)*Math.sqrt(3)/2 : 0
    };
    function pulse(t){
      if(st.shape==='tri'){ const u=2*t/TB;
        return (t>=0&&t<=TB) ? Math.sqrt(3)*(u<1?u:2-u) : 0; }
      return SHAPES[st.shape](t);
    }

    function draw(root){
      const dt = TB/N;
      const sig = [], mf = [];
      for(let i=0;i<N;i++) sig.push(pulse(i*dt));
      const E = sig.reduce((s,v)=>s+v*v,0)*dt;
      const N0 = Math.pow(10, -st.noise/10);

      /* The matched filter output is the correlation of the pulse with itself,
         which peaks at t = T and nowhere else. */
      const out = [];
      for(let k=0;k<=N;k++){
        let s=0;
        for(let i=0;i<N;i++){ const j=i-(N-k); if(j>=0&&j<N) s += sig[i]*sig[j]; }
        out.push(s*dt);
      }
      const idx = Math.round(st.samp/100*N);
      const peak = out[Math.min(N,idx)];
      const snrMax = 2*E/N0;
      /* Sampling away from the peak keeps the same noise power and loses signal,
         so the ratio falls as the square of what is left. */
      const snrHere = snrMax*Math.pow(peak/out[N], 2);
      const lossDb = 10*Math.log10(Math.max(1e-12, snrHere/snrMax));

      const ax = P.Axes({w:780,h:220,xr:[-0.15,1.15],yr:[-0.4,2.1],
        xlabel:'t/T',ylabel:'s(t),\\;h_{\\mathrm{opt}}(t)',pad:{l:58,r:26,t:26,b:40},
        xtarget:5,ytarget:4});
      ax.curve(t=>pulse(t*TB),{color:P.COL.in,width:2.2,n:600});
      ax.curve(t=>pulse(TB-t*TB),{color:P.COL.h,width:1.9,dash:'6 4',n:600});

      const bx = P.Axes({w:780,h:220,xr:[0,1],yr:[-0.15*out[N],1.25*out[N]],
        xlabel:'\\text{sampling instant},\\;t/T',ylabel:'\\text{filter output}',
        pad:{l:60,r:26,t:26,b:44},xtarget:5,ytarget:4});
      bx.poly(out.map((v,k)=>[k/N,v]),{color:P.COL.out,width:2.3});
      bx.vline(st.samp/100,{color:P.COL.err,width:1.6,dash:'5 4'});
      bx.point(st.samp/100, peak, {color:P.COL.err, r:4.5});

      root.querySelector('.plots').innerHTML = ax.svg() + bx.svg();
      root.querySelector('.ro').innerHTML = `
        <div><dt>Pulse energy E</dt><dd>${fmt(E,4)}</dd></div>
        <div><dt>Noise density N₀</dt><dd>${fmt(N0,5)}</dd></div>
        <div><dt>Bound 2E/N₀</dt><dd>${fmt(10*Math.log10(snrMax),4)} dB</dd></div>
        <div><dt>Sampled at</dt><dd>${st.samp}% of T</dd></div>
        <div><dt>SNR at that instant</dt><dd class="${lossDb<-0.5?'warnv':'okv'}">${fmt(10*Math.log10(Math.max(1e-12,snrHere)),4)} dB</dd></div>
        <div><dt>Loss against the bound</dt><dd class="${lossDb<-0.5?'warnv':'okv'}">${fmt(lossDb,3)} dB</dd></div>`;

      root.querySelector('.verdict').innerHTML = st.samp===100
        ? `<div class="note ok"><span class="note-h">At the peak</span>
             The output signal-to-noise ratio is ${T('2E/N_0',false)} exactly, and it is the same
             for all three pulses because all three carry the same energy. Change the shape and
             watch the number stay where it is.</div>`
        : `<div class="note err"><span class="note-h">Sampling early or late</span>
             The noise power at the output does not depend on when the sample is taken, but the
             signal does. Losing ${T(fmt(-lossDb,2),false)} dB here is losing it for nothing —
             no amount of transmit power buys back a mistimed sample.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=shape]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.shape)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div></div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Pulse <span class="seg">
                <button data-seg="shape" data-val="rect">rectangular</button>
                <button data-seg="shape" data-val="sine">half sine</button>
                <button data-seg="shape" data-val="tri">triangular</button></span></label></div>
              <div class="ctrl"><label>Noise, 10log₁₀(1/N₀) in dB <span class="val" data-out="noise">30</span></label>
                <input type="range" data-v="noise" min="0" max="40" step="2" value="30"></div>
              <div class="ctrl"><label>Sampling instant, % of T <span class="val" data-out="samp">100</span></label>
                <input type="range" data-v="samp" min="20" max="100" step="5" value="100"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=shape]'); if(!b) return;
        st.shape=b.dataset.val; draw(root); });
      draw(root);
    }};
  })();

  /* =======================================================================
     D · THRESHOLD AND ERROR PROBABILITY
     ======================================================================= */
  const D = (() => {
    let st = { lam:0, prior:50, ebn0:6 };

    function draw(root){
      const p0 = st.prior/100, p1 = 1-p0;
      const ebn0 = Math.pow(10, st.ebn0/10);
      const Eb = 1, N0 = Eb/ebn0, sig = Math.sqrt(N0/2), A = Math.sqrt(Eb);
      const lam = st.lam/100*2*A;                       /* the slider spans ±2A */
      const lamOpt = (N0/(4*A))*Math.log(p0/p1);

      const e0 = Q((lam+A)/sig), e1 = Q((A-lam)/sig);
      const pe = p0*e0 + p1*e1;
      const eo0 = Q((lamOpt+A)/sig), eo1 = Q((A-lamOpt)/sig);
      const peOpt = p0*eo0 + p1*eo1;

      const g=(y,m)=>Math.exp(-(y-m)*(y-m)/(2*sig*sig))/(sig*Math.sqrt(2*Math.PI));
      const top = Math.max(p0,p1)/(sig*Math.sqrt(2*Math.PI));
      const ax = P.Axes({w:800,h:300,xr:[-3*A,3*A],yr:[-0.05*top,1.25*top],
        xlabel:'y',ylabel:'P(s_m)\\,f_Y(y\\mid s_m)',pad:{l:60,r:26,t:26,b:44},
        xtarget:6,ytarget:4});
      ax.rect(-3*A,0,lam,1.2*top,{fill:P.COL.dec.err});
      ax.rect(lam,0,3*A,1.2*top,{fill:P.COL.dec.out});
      ax.curve(y=>p0*g(y,-A),{color:P.COL.err,width:2.2});
      ax.curve(y=>p1*g(y, A),{color:P.COL.out,width:2.2});
      ax.vline(lam,{color:P.COL.ink,dash:'5 4',width:1.8});
      ax.vline(lamOpt,{color:P.COL.h,dash:'2 4',width:1.6});

      const bx = P.Axes({w:800,h:200,xr:[-1,1],yr:[Math.log10(Math.max(1e-12,peOpt))-0.6,
                                                  Math.log10(Math.max(1e-12,peOpt))+1.6],
        xlabel:'\\lambda/(2\\sqrt{E_b})',ylabel:'\\log_{10}P_e',pad:{l:60,r:26,t:26,b:44},
        xtarget:5,ytarget:4});
      bx.curve(u=>{ const L=u*2*A;
        return Math.log10(Math.max(1e-12, p0*Q((L+A)/sig)+p1*Q((A-L)/sig))); },
        {color:P.COL.in,width:2.3});
      bx.vline(st.lam/100,{color:P.COL.ink,dash:'5 4',width:1.6});
      bx.vline(lamOpt/(2*A),{color:P.COL.h,dash:'2 4',width:1.6});

      root.querySelector('.plots').innerHTML = ax.svg() + bx.svg();
      root.querySelector('.ro').innerHTML = `
        <div><dt>P(s₀)</dt><dd>${fmt(p0,3)}</dd></div>
        <div><dt>E_b/N₀</dt><dd>${st.ebn0} dB</dd></div>
        <div><dt>Threshold set</dt><dd>${fmt(lam,4)}</dd></div>
        <div><dt>Optimal threshold</dt><dd class="okv">${fmt(lamOpt,4)}</dd></div>
        <div><dt>P(error | s₀)</dt><dd>${fmt(e0,5)}</dd></div>
        <div><dt>P(error | s₁)</dt><dd>${fmt(e1,5)}</dd></div>
        <div><dt>Average P_e</dt><dd class="${pe>peOpt*1.02?'warnv':'okv'}">${fmt(pe,5)}</dd></div>
        <div><dt>P_e at the optimum</dt><dd>${fmt(peOpt,5)}</dd></div>`;

      const near = Math.abs(lam-lamOpt) < 0.02*A;
      root.querySelector('.verdict').innerHTML = near
        ? `<div class="note ok"><span class="note-h">At the optimum</span>
             The two weighted densities cross exactly at the threshold. That is the condition
             ${T('P(s_1)f_Y(\\lambda\\mid s_1)=P(s_0)f_Y(\\lambda\\mid s_0)',false)} the derivation
             produces, read off the picture rather than solved.</div>`
        : `<div class="note warn"><span class="note-h">Off the optimum</span>
             The threshold is ${T(fmt(lam-lamOpt,3),false)} away from where it belongs, and the
             error probability is ${T(fmt(pe/peOpt,3),false)} times its smallest value. Notice how
             flat the curve is near its minimum: a threshold in roughly the right place costs
             almost nothing, which is why an equal-prior receiver is usable on unequal priors.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div></div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Threshold, % of 2√E_b <span class="val" data-out="lam">0</span></label>
                <input type="range" data-v="lam" min="-60" max="60" step="2" value="0"></div>
              <div class="ctrl"><label>Prior P(s₀), % <span class="val" data-out="prior">50</span></label>
                <input type="range" data-v="prior" min="10" max="90" step="5" value="50"></div>
              <div class="ctrl"><label>E_b/N₀ in dB <span class="val" data-out="ebn0">6</span></label>
                <input type="range" data-v="ebn0" min="0" max="12" step="1" value="6"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      draw(root);
    }};
  })();

  /* =======================================================================
     E · THE EYE DIAGRAM
     ======================================================================= */
  const E = (() => {
    let st = { alpha:50, offset:0, noise:5 };

    function draw(root){
      const al = st.alpha/100, off = st.offset/100, nz = st.noise/100;
      const p = t => { const den = 1-4*al*al*t*t;
        if(Math.abs(den) < 1e-6) return sinc(t)*Math.PI/4;
        return sinc(t)*Math.cos(Math.PI*al*t)/den; };

      const noise = gauss(20260802, 4096, nz);
      const ax = P.Axes({w:640,h:320,xr:[-1,1],yr:[-2.1,2.1],
        xlabel:'t/T_b',ylabel:'y(t)',pad:{l:54,r:26,t:26,b:44},xtarget:4,ytarget:4});
      let ni = 0;
      for(let pat=0;pat<64;pat++){
        const b=[]; for(let k=0;k<6;k++) b.push(((pat>>k)&1)?1:-1);
        const pts=[];
        for(let i=0;i<=100;i++){
          const t=-1+2*i/100;
          let s=0; for(let k=0;k<6;k++) s += b[k]*p(t-(k-2.5));
          pts.push([t, s + noise[(ni++)%4096]]);
        }
        ax.poly(pts,{color:P.COL.in,width:0.85,opacity:0.45});
      }
      ax.vline(off,{color:P.COL.h,width:1.8,dash:'5 4'});

      /* The opening is the worst case over every pattern at the chosen instant,
         computed without the noise so that the two effects stay separable. */
      let best = Infinity, worstIsi = 0;
      for(let pat=0;pat<64;pat++){
        const b=[]; for(let k=0;k<6;k++) b.push(((pat>>k)&1)?1:-1);
        let s=0; for(let k=0;k<6;k++) s += b[k]*p(off-(k-2.5));
        const wanted = b[2] || b[3];
        const isi = Math.abs(s) - Math.abs(b[2]*p(off+0.5));
        if(Math.abs(s) < best) best = Math.abs(s);
        worstIsi = Math.max(worstIsi, Math.abs(isi));
      }
      const opening = 2*best;

      root.querySelector('.plots').innerHTML = ax.svg();
      root.querySelector('.ro').innerHTML = `
        <div><dt>Roll-off α</dt><dd>${fmt(al,2)}</dd></div>
        <div><dt>Transmission bandwidth</dt><dd>${fmt(1+al,3)} × W</dd></div>
        <div><dt>Sampling offset</dt><dd>${fmt(off,3)} T_b</dd></div>
        <div><dt>Noise, standard deviation</dt><dd>${fmt(nz,3)}</dd></div>
        <div><dt>Eye opening, no noise</dt><dd class="${opening<0.6?'warnv':'okv'}">${fmt(opening,4)}</dd></div>
        <div><dt>Worst-case interference</dt><dd class="${worstIsi>0.3?'warnv':''}">${fmt(worstIsi,4)}</dd></div>
        <div><dt>Margin over noise</dt><dd class="${opening/2<3*nz?'warnv':'okv'}">${fmt(opening/2/Math.max(1e-6,nz),3)} σ</dd></div>`;

      root.querySelector('.verdict').innerHTML = opening/2 < 3*nz
        ? `<div class="note err"><span class="note-h">The eye is closing</span>
             The half-opening is ${T(fmt(opening/2/Math.max(1e-6,nz),2),false)} standard deviations
             of the noise. Errors are no longer rare events at the tail of a Gaussian; they are
             ordinary. Reduce the timing offset or raise the roll-off before adding power.</div>`
        : off !== 0
        ? `<div class="note warn"><span class="note-h">Off the centre</span>
             Moving the sampling instant closes the eye even with the noise unchanged, because the
             neighbouring pulses are no longer at their zero crossings. This is the interference
             the Nyquist criterion removes only at the exact instants.</div>`
        : `<div class="note ok"><span class="note-h">Open</span>
             Sampling at the centre and with this roll-off, every pattern passes close to
             ${T('\\pm1',false)}. Lower the roll-off and the tails of the neighbours reach further,
             which is the bandwidth-for-decay trade made visible.</div>`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-6-6" style="gap:40px">
          <div class="col stack"><div class="plots"></div></div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Roll-off α, % <span class="val" data-out="alpha">50</span></label>
                <input type="range" data-v="alpha" min="0" max="100" step="5" value="50"></div>
              <div class="ctrl"><label>Sampling offset, % of T_b <span class="val" data-out="offset">0</span></label>
                <input type="range" data-v="offset" min="-40" max="40" step="5" value="0"></div>
              <div class="ctrl"><label>Noise σ, % <span class="val" data-out="noise">5</span></label>
                <input type="range" data-v="noise" min="0" max="30" step="1" value="5"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      draw(root);
    }};
  })();

  return { C, D, E };
})());
