/* ==========================================================================
   Module 2 laboratories.

   C · The matched filter — the pulse, the noise and the sampling instant
       against the bound 2E/N0.
   P · Correlator and matched filter — one bit through both demodulators,
       compared over the interval and at t = T_b.
   D · Threshold and error probability — the threshold placed by hand against
       the one the derivation gives.
   Q · Intersymbol interference — a bandlimited channel closes the eye as the
       reader narrows it and moves the sampling instant.
   E · The raised-cosine eye — the roll-off, the timing and the noise, closing
       an eye three different ways.

   Every card a laboratory draws follows the slide card language: a computed
   equation takes a coral tab naming what it computes, a note keeps its kind's
   tab and icon. Nothing here is imported; the artifact is one file.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F, GH = LABS.KIT.GH;
  const P = PLOT;
  const N = (v,d=3) => fmt(v,d);

  /* Same phone/legend pattern as Module 1's laboratories (build/src/71_labs_m1.js). */
  const PHONE = () => APP.state.layout === 'phone';
  const legendRow = (...items) => `<div class="legend">${items.join('')}</div>`;
  const L = (c,l,dash)=>`<i class="lg-${c}${dash?' lg-dash':''}">${T(l,false)}</i>`;

  /* A seeded generator, so every noise figure is the same figure on every
     machine and in every render. mulberry32, as in Module 1. */
  function rng(seed){ let a=seed>>>0; return function(){
    a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
    const u=Math.max(1e-12,r()), v=r();
    o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }

  /* The Gaussian tail, by a rational approximation good to about 1e-7 — enough
     for a figure and a readout; the closed forms it draws are checked against
     a simulation in the numerical gate rather than against this. */
  function Qf(x){
    const t = 1/(1+0.2316419*Math.abs(x));
    const d = 0.3989422804014327*Math.exp(-x*x/2);
    const p = d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
    return x>=0 ? p : 1-p;
  }
  const sinc = x => Math.abs(x)<1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);

  /* =======================================================================
     C · THE MATCHED FILTER
     The pulse and the filter matched to it, swept and scanned; the output
     signal-to-noise ratio against the bound 2E/N0.
     ======================================================================= */
  const C = (() => {
    const NS = 512, TB = 1;
    let st = { shape:'rect', noise:30, samp:100, phase:40 };

    /* Three pulses, each normalised to unit energy over [0,1], so that what
       changes between them is the shape and not the energy the bound depends
       on. The triangular pulse peaks at t = T/2: unit height there gives
       energy T/3, so it is scaled by sqrt(3/T) = sqrt(3) at T = 1. */
    function pulse(t){
      if(t<0 || t>TB) return 0;
      if(st.shape==='sine') return Math.SQRT2*Math.sin(Math.PI*t/TB);
      if(st.shape==='tri'){ const u = 2*t/TB; return Math.sqrt(3)*(u<1?u:2-u); }
      return 1;
    }

    /* The matched filter output is the correlation of the pulse with itself,
       which peaks at t = T and nowhere else. It is a property of the pulse
       alone, so it is computed once per shape and reused across all phases. */
    let cache = { shape:null };
    function correlation(){
      if(cache.shape === st.shape) return cache;
      const dt = TB/NS, sig = [];
      for(let i=0;i<NS;i++) sig.push(pulse(i*dt));
      const E = sig.reduce((s,v)=>s+v*v,0)*dt;
      const out = [];
      for(let k=0;k<=NS;k++){
        let s=0;
        for(let i=0;i<NS;i++){ const j=i-(NS-k); if(j>=0&&j<NS) s += sig[i]*sig[j]; }
        out.push(s*dt);
      }
      cache = { shape:st.shape, out, E };
      return cache;
    }

    /* Act two of the animation drives the sampling instant. The slider is a
       real control and stays draggable, so the phase writes it only when the
       phase itself moves. */
    function scan(root){
      if(st.phase <= 20) return;
      st.samp = 20 + Math.round((st.phase-21)/19*80/5)*5;
      const sl = root.querySelector('[data-v="samp"]');
      if(sl) sl.value = String(st.samp);
    }

    function draw(root){
      const { out, E } = correlation();
      const N0 = Math.pow(10, -st.noise/10);
      const sweeping = st.phase <= 20;
      const swept    = Math.min(1, st.phase/20);

      const idx = Math.round(st.samp/100*NS);
      const peak = out[Math.min(NS,idx)];
      const snrMax = 2*E/N0;
      const snrHere = snrMax*Math.pow(peak/out[NS], 2);
      const lossDb = 10*Math.log10(Math.max(1e-12, snrHere/snrMax));

      const ph = PHONE(), gh = GH(root);
      const ax = P.Axes({w:ph?300:680,h:ph?220:gh(165),xr:[-0.15,1.15],yr:[-0.4,2.1],
        xlabel:'t/T',ylabel:'s(t),\\;h_{\\mathrm{opt}}(t)',pad:{l:ph?42:58,r:ph?16:26,t:24,b:40},
        xtarget:ph?4:5,ytarget:4});
      ax.curve(t=>pulse(t*TB),{color:P.COL.in,width:2.2,n:600});
      ax.curve(t=>pulse(TB-t*TB),{color:P.COL.h,width:1.9,dash:'6 4',n:600});
      if(sweeping){
        const tau = swept;
        ax.curve(t=>pulse((tau-t)*TB),{color:P.COL.h,width:1.9,n:600});
        ax.area(t=>Math.min(pulse(t*TB), pulse((tau-t)*TB)), 0, 1, {color:P.COL.dec.h});
      }

      const bx = P.Axes({w:ph?300:680,h:ph?200:gh(155),xr:[0,1],yr:[-0.15*out[NS],1.25*out[NS]],
        xlabel:'\\text{sampling instant},\\;t/T',ylabel:'\\text{filter output}',
        pad:{l:ph?42:60,r:ph?16:26,t:22,b:44},xtarget:ph?4:5,ytarget:4});
      const kmax = sweeping ? Math.round(swept*NS) : NS;
      bx.poly(out.slice(0,kmax+1).map((v,k)=>[k/NS,v]),{color:P.COL.out,width:2.3});
      if(!sweeping){
        bx.vline(st.samp/100,{color:P.COL.err,width:1.6,dash:'5 4'});
        bx.point(st.samp/100, peak, {color:P.COL.err, r:4.5});
      }

      const lg1 = `${L('in','s(t)')}${L('h','h_{\\mathrm{opt}}(t)')}`;
      const lg2 = `${L('out','\\text{filter output}')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${ax.svg()}</div>${legendRow(lg1)}`
        + `<div class="plot-wrap">${bx.svg()}</div>${legendRow(lg2)}`
        : `<div class="plot-wrap">${ax.svg()}<div class="legend in-plot lg-at-tr">${lg1}</div></div>`
        + `<div class="plot-wrap">${bx.svg()}<div class="legend in-plot lg-at-tr">${lg2}</div></div>`;

      root.querySelector('.lab-eq').innerHTML = ph
        ? T(`h_{\\mathrm{opt}}(t)=s(T-t)`, true)
        : T(`h_{\\mathrm{opt}}(t)=s(T-t),\\quad E=${N(E,3)}`, true);

      root.querySelector('.ro').innerHTML = `
        <div><dt>Noise density N₀</dt><dd>${N(N0,5)}</dd></div>
        <div><dt>Bound 2E/N₀</dt><dd>${N(10*Math.log10(snrMax),3)} dB</dd></div>
        <div><dt>SNR at that instant</dt><dd class="${lossDb<-0.5?'warnv':'okv'}">${N(10*Math.log10(Math.max(1e-12,snrHere)),4)} dB</dd></div>`;

      root.querySelector('.derive').innerHTML = M(`
        <div class="note ${st.samp===100?'ok':'err'}"><span class="note-h">${st.samp===100?'At the peak':'Off the peak'}</span>${
          st.samp===100
          ? `The bound $2E/N_0$ is reached exactly, for all three shapes, since all three carry the same energy.`
          : `Losing ${T(fmt(-lossDb,2),false)} dB here is losing it for nothing.`}</div>`);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=shape]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.shape)));
    }

    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="lab-eq eq key" style="padding:14px 20px"></div>
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label>Pulse <span class="seg">
                <button data-seg="shape" data-val="rect">rectangular</button>
                <button data-seg="shape" data-val="sine">half sine</button>
                <button data-seg="shape" data-val="tri">triangular</button></span></label></div>
              <div class="ctrl"><label>Noise level, dB <span class="val" data-out="noise">30</span></label>
                <input type="range" data-v="noise" min="0" max="40" step="2" value="30"></div>
              <div class="ctrl"><label>Sampling instant, % of T <span class="val" data-out="samp">100</span></label>
                <input type="range" data-v="samp" min="20" max="100" step="5" value="100"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Sweep and scan <span class="val" data-out="phase">40</span></label>
                <div class="ctrl-run"><input type="range" data-v="phase" min="0" max="40" step="1" value="40">${LABS.KIT.runbar()}</div></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); if(k==='phase') scan(root); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=shape]'); if(!b) return;
        st.shape=b.dataset.val; draw(root); });
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', max:40, ms:90,
        get:()=>st.phase, set:v=>{ st.phase=v; scan(root); }, redraw:()=>draw(root) });
    }};
  })();

  /* =======================================================================
     P · CORRELATOR AND MATCHED FILTER
     One isolated bit on [0, T_b], gated: x(t) = s_m*psi(t) + w(t) for
     0 <= t <= T_b, zero outside. The correlator output c(t) is drawn only on
     [0, T_b] — it is not defined, and would ordinarily be dumped to zero,
     beyond the interval, so there is nothing to plot there. The matched
     filter output y(t) = integral of x(tau)*psi(T_b - t + tau) dtau is drawn
     on [0, 2T_b]. Both always agree at t = T_b; for the rectangular psi they
     also coincide along the whole bit, for the half sine they do not. Both
     outputs are intermediate quantities, so both are violet: the filter
     solid and wide, the correlator dashed. The input x(t) is the received
     green trace with the clean cyan signal over it.
     ======================================================================= */
  const P_ = (() => {
    const TB = 1, EB = 1, NS = 400;
    let st = { basis:'rect', bit:1, ebn0:10, seed:1, t0:100 };

    function psi(t){
      if(t<0 || t>TB) return 0;
      return st.basis==='half' ? Math.sqrt(2/TB)*Math.sin(Math.PI*t/TB) : 1/Math.sqrt(TB);
    }
    /* Per-sample noise of variance N0/(2*dt), so that the Riemann sum
       int w*psi dt has variance N0/2 — the two-sided convention this course
       fixes throughout. */
    function noiseTrace(N0, dt){
      const sigma = Math.sqrt(N0/(2*dt));
      return gauss(20260900 + st.seed, NS+1, sigma);
    }

    function draw(root){
      const sm = st.bit ? Math.sqrt(EB) : -Math.sqrt(EB);
      const ebn0 = Math.pow(10, st.ebn0/10);
      const N0 = EB/ebn0;
      const dt = TB/NS;
      const w = noiseTrace(N0, dt);
      const x = i => (i<0||i>NS) ? 0 : sm*psi(i*dt) + w[i];

      /* The correlator c(t) is a running sum on [0,T_b]. The filter output is
         y(t) = sum of x(tau) psi(T_b - t + tau) dt, on [0,2T_b]. */
      const cVals = [0]; let acc = 0;
      for(let i=1;i<=NS;i++){ acc += x(i)*psi(i*dt)*dt; cVals.push(acc); }
      const yVals = [];
      for(let j=0;j<=2*NS;j++){ let a = 0;
        for(let i=Math.max(1,j-NS);i<=Math.min(NS,j);i++) a += x(i)*psi(TB-(j-i)*dt)*dt;
        yVals.push(a); }
      const n = w.reduce((s,v,i)=> (i<=NS ? s + v*psi(i*dt)*dt : s), 0);

      const t0 = st.t0/100*TB;
      const i0 = Math.round(t0/dt);
      const cAtT0 = t0<=TB ? cVals[Math.min(NS,i0)] : null;
      const yAtT0 = yVals[Math.min(2*NS,Math.max(0,i0))];
      const yAtTB = cVals[NS];

      const ph = PHONE(), gh = GH(root);
      const a1 = P.Axes({w:ph?300:680,h:ph?220:gh(185),xr:[0,2*TB],yr:[-3,3],
        xlabel:'t/T_b',ylabel:'x(t),\\;s_m\\psi(t)',pad:{l:ph?42:56,r:ph?16:24,t:24,b:40},
        xtarget:ph?4:6,ytarget:3});
      a1.curve(t=>t<=TB ? sm*psi(t) : 0,{color:P.COL.in,width:2.0});
      a1.curve(t=>x(Math.round(t/dt)),{color:P.COL.out,width:1.0,opacity:0.45,n:NS});
      a1.vline(t0,{color:P.COL.muted,dash:'4 4'});

      const a2 = P.Axes({w:ph?300:680,h:ph?200:gh(155),xr:[0,2*TB],yr:[-2.4,2.4],
        xlabel:'t/T_b',ylabel:'c(t),\\;y(t)',pad:{l:ph?42:56,r:ph?16:24,t:22,b:40},
        xtarget:ph?4:6,ytarget:3});
      a2.curve(t=> yVals[Math.min(2*NS,Math.max(0,Math.round(t/dt)))],
        {color:P.COL.mid,width:4.2,opacity:0.45,n:2*NS});
      a2.curve(t=> t<=TB ? cVals[Math.min(NS,Math.max(0,Math.round(t/dt)))] : NaN,
        {color:P.COL.mid,width:2.0,dash:'7 5',n:NS});
      a2.point(TB, yAtTB, {color:P.COL.coral, r:4.5});
      a2.vline(t0,{color:P.COL.muted,dash:'4 4'});

      const lg1 = `${L('in','s_m\\psi(t)')}${L('out','x(t)')}`;
      const lg2 = `${L('mid','y(t)')}${L('mid','c(t),\\;0\\le t\\le T_b',true)}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a1.svg()}</div>${legendRow(lg1)}`
        + `<div class="plot-wrap">${a2.svg()}</div>${legendRow(lg2)}`
        : `<div class="plot-wrap">${a1.svg()}<div class="legend in-plot lg-at-tr">${lg1}</div></div>`
        + `<div class="plot-wrap">${a2.svg()}<div class="legend in-plot lg-at-tr">${lg2}</div></div>`;

      root.querySelector('.ro').innerHTML = `
        <div><dt>Noise term n</dt><dd>${N(n,4)}</dd></div>
        <div><dt>Correlator at t₀</dt><dd>${t0<=TB ? N(cAtT0,4) : '\u2014'}</dd></div>
        <div><dt>Filter output at t₀</dt><dd>${N(yAtT0,4)}</dd></div>
        <div><dt>Both at t = T_b</dt><dd class="okv">${N(yAtTB,4)}</dd></div>`;

      const agree = Math.abs(t0-TB) < 1e-9;
      let verdictHtml;
      if(agree){
        verdictHtml = `<div class="note ok"><span class="note-h">At $t=T_b$</span>
          Both read $y=s_m+n=${N(yAtTB,3)}$.</div>`;
      } else if(t0 < TB){
        verdictHtml = st.basis==='rect'
          ? `<div class="note warn"><span class="note-h">Rectangular basis, before $T_b$</span>
             They already agree: a rectangular $\\psi$ is constant, so $c(t)$ needs no correction.</div>`
          : `<div class="note err"><span class="note-h">Half-sine basis, before $T_b$</span>
             They differ. The filter output equals the correlator only at $t=T_b$.</div>`;
      } else {
        verdictHtml = `<div class="note err"><span class="note-h">Beyond $T_b$</span>
          The correlator is reset at $T_b$. The filter output keeps changing and moves away from $s_m+n$.</div>`;
      }
      root.querySelector('.derive').innerHTML = M(`
        <div class="eq"><span class="eq-label">At $t=T_b$</span>${T(`y(T_b)=s_m+n=${N(yAtTB,4)}`,true)}</div>
        ${verdictHtml}`);

      root.querySelector('[data-v=ebn0]').value = st.ebn0;
      root.querySelector('[data-out=ebn0]').textContent = String(st.ebn0);
      root.querySelector('[data-v=seed]').value = st.seed;
      root.querySelector('[data-out=seed]').textContent = String(st.seed);
      root.querySelector('[data-v=t0]').value = st.t0;
      root.querySelector('[data-out=t0]').textContent = fmt(st.t0/100,2);
      root.querySelectorAll('[data-seg=basis]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.basis)));
      root.querySelectorAll('[data-seg=bit]').forEach(b=>
        b.setAttribute('aria-pressed', String(Number(b.dataset.val)===st.bit)));
    }

    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label>Basis $\\psi(t)$ <span class="seg">
                <button data-seg="basis" data-val="rect">rectangular</button>
                <button data-seg="basis" data-val="half">half sine</button></span>
                Bit <span class="seg">
                <button data-seg="bit" data-val="0">0</button>
                <button data-seg="bit" data-val="1">1</button></span></label></div>
              <div class="ctrl"><label>$E_b/N_0$ in dB <span class="val" data-out="ebn0">10</span></label>
                <input type="range" data-v="ebn0" min="0" max="20" step="1" value="10"></div>
              <div class="ctrl"><label>Noise realisation <span class="val" data-out="seed">1</span></label>
                <input type="range" data-v="seed" min="1" max="12" step="1" value="1"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Sampling instant $t_0/T_b$ <span class="val" data-out="t0">1.00</span></label>
                <input type="range" data-v="t0" min="10" max="200" step="5" value="100"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{
        const b1=e.target.closest('[data-seg=basis]'); if(b1){ st.basis=b1.dataset.val; draw(root); return; }
        const b2=e.target.closest('[data-seg=bit]'); if(b2){ st.bit=Number(b2.dataset.val); draw(root); return; }
      });
      draw(root);
      root.redraw = () => draw(root);
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
      const lam = st.lam/100*2*A;
      const lamOpt = (N0/(4*A))*Math.log(p0/p1);

      const e0 = Qf((lam+A)/sig), e1 = Qf((A-lam)/sig);
      const pe = p0*e0 + p1*e1;
      const eo0 = Qf((lamOpt+A)/sig), eo1 = Qf((A-lamOpt)/sig);
      const peOpt = p0*eo0 + p1*eo1;

      const g=(y,m)=>Math.exp(-(y-m)*(y-m)/(2*sig*sig))/(sig*Math.sqrt(2*Math.PI));
      const top = Math.max(p0,p1)/(sig*Math.sqrt(2*Math.PI));

      const ph = PHONE(), gh = GH(root);
      const ax = P.Axes({w:ph?300:680,h:ph?230:gh(190),xr:[-3*A,3*A],yr:[-0.05*top,1.25*top],
        xlabel:'y',ylabel:'P(s_m)\\,f_Y(y\\mid s_m)',pad:{l:ph?42:58,r:ph?16:24,t:24,b:40},
        xtarget:ph?4:6,ytarget:3});
      ax.area(y=>p0*g(y,-A), lam, 3*A, {color:P.COL.dec.err});
      ax.area(y=>p1*g(y, A), -3*A, lam, {color:P.COL.dec.err});
      ax.curve(y=>p0*g(y,-A),{color:P.COL.mid,width:2.2,dash:'8 5'});
      ax.curve(y=>p1*g(y, A),{color:P.COL.mid,width:2.2});
      ax.vline(lam,{color:P.COL.ink,dash:'5 4',width:1.8});
      ax.vline(lamOpt,{color:P.COL.h,dash:'2 4',width:1.6});

      const bLo = Math.log10(Math.max(1e-12,peOpt)) - 0.2, bHi = bLo + 2.6;
      const bx = P.Axes({w:ph?300:680,h:ph?220:gh(220),xr:[-0.85,0.85],yr:[bLo,bHi],
        xlabel:'\\lambda/(2\\sqrt{E_b})',ylabel:'P_e',
        ytickfmt:P.decade, yticksOverride:P.decades(bLo,bHi), zeroAxes:false,
        pad:{l:ph?44:60,r:ph?16:24,t:22,b:44}, xtarget:ph?4:5, ytarget:3});
      bx.curve(u=>{ const Lam=u*2*A;
        return Math.log10(Math.max(1e-12, p0*Qf((Lam+A)/sig)+p1*Qf((A-Lam)/sig))); },
        {color:P.COL.in,width:2.3});
      bx.vline(st.lam/100,{color:P.COL.ink,dash:'5 4',width:1.6});
      bx.vline(lamOpt/(2*A),{color:P.COL.h,dash:'2 4',width:1.6});

      const lg1 = `${L('mid','P(s_0)f_Y(y\\mid s_0)',true)}${L('mid','P(s_1)f_Y(y\\mid s_1)')}${L('err','\\text{error}')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${ax.svg()}</div>${legendRow(lg1)}`
        + `<div class="plot-wrap">${bx.svg()}</div>`
        : `<div class="plot-wrap">${ax.svg()}<div class="legend in-plot lg-at-tr">${lg1}</div></div>`
        + `<div class="plot-wrap">${bx.svg()}</div>`;

      root.querySelector('.ro').innerHTML = `
        <div><dt>Threshold set</dt><dd>${N(lam,4)}</dd></div>
        <div><dt>P(error | s₀)</dt><dd>${N(e0,5)}</dd></div>
        <div><dt>P(error | s₁)</dt><dd>${N(e1,5)}</dd></div>
        <div><dt>Average P_e</dt><dd class="${pe>peOpt*1.02?'warnv':'okv'}">${N(pe,5)}</dd></div>`;

      const near = Math.abs(lam-lamOpt) < 0.02*A;
      root.querySelector('.derive').innerHTML = M(`
        <div class="eq"><span class="eq-label">Optimal threshold</span>${
          T(`\\lambda_{\\mathrm{opt}}=${N(lamOpt,4)},\\quad P_e(\\lambda_{\\mathrm{opt}})=${N(peOpt,5)}`,true)}</div>
        <div class="note ${near?'ok':'warn'}"><span class="note-h">${near?'At the optimum':'Off the optimum'}</span>${
          near
          ? `The two weighted densities cross exactly at the threshold, as the derivation requires.`
          : `The error probability is ${T(fmt(pe/peOpt,3),false)} times its smallest value; the curve is flat near its minimum, so a rough threshold costs little.`}</div>`);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
    }

    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl"><label>Threshold, % of $2\\sqrt{E_b}$ <span class="val" data-out="lam">0</span></label>
                <input type="range" data-v="lam" min="-60" max="60" step="2" value="0"></div>
              <div class="ctrl"><label>Prior $P(s_0)$, % <span class="val" data-out="prior">50</span></label>
                <input type="range" data-v="prior" min="10" max="90" step="5" value="50"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>$E_b/N_0$ in dB <span class="val" data-out="ebn0">6</span></label>
                <input type="range" data-v="ebn0" min="0" max="12" step="1" value="6"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     Q · INTERSYMBOL INTERFERENCE
     Polar NRZ through a first-order RC lowpass of 3-dB bandwidth B. The
     channel is causal, so only earlier bits interfere with the sample of the
     current one.
     ======================================================================= */
  const Q = (() => {
    const TB = 1;
    const PATTERN = [1,0,0,1,1,1,0,1,0,0,0,1].map(b=>b?1:-1);
    let st = { bt:25, ts:100, sigma:3 };

    /* The single-pulse response of a first-order RC lowpass to one NRZ pulse
       of width T_b, time constant tau = 1/(2*pi*B). */
    function respFactory(B){
      const tau = 1/(2*Math.PI*B);
      const rTB = 1 - Math.exp(-TB/tau);
      return t => {
        if(t < 0) return 0;
        if(t <= TB) return 1 - Math.exp(-t/tau);
        return rTB*Math.exp(-(t-TB)/tau);
      };
    }

    function received(r, t){
      let s = 0;
      const kMax = Math.floor(t/TB) + 1;
      for(let k=0; k<PATTERN.length && k<=kMax; k++) s += PATTERN[k]*r(t-k*TB);
      return s;
    }

    function draw(root){
      const B = st.bt/100/TB, tau = 1/(2*Math.PI*B);
      const r = respFactory(B);
      const ts = st.ts/100*TB;
      const noise = gauss(20260901, 4096, st.sigma/100);
      let ni = 0;

      const wanted = r(ts);
      let interference = 0;
      for(let m=1; m<=10; m++) interference += r(ts+m*TB);
      const opening = wanted - interference;          /* the half-opening */
      const margin = opening/Math.max(1e-6, st.sigma/100);

      const ph = PHONE(), gh = GH(root);
      const NB = PATTERN.length;
      const a1 = P.Axes({w:ph?300:680,h:ph?220:gh(185),xr:[0,NB],yr:[-1.6,1.6],
        xlabel:'t/T_b',ylabel:'\\text{NRZ},\\;y(t)',pad:{l:ph?42:56,r:ph?16:24,t:24,b:40},
        xtarget:ph?4:6,ytarget:3});
      a1.curve(t=>PATTERN[Math.min(NB-1,Math.max(0,Math.floor(t)))],{color:P.COL.in,width:1.1,opacity:0.55});
      a1.curve(t=>received(r,t)+noise[Math.min(4095,Math.round(t/TB*40))],{color:P.COL.out,width:1.9,n:NB*30});
      const stems=[]; for(let i=1;i<NB;i++) stems.push([i-1+ts, received(r,i-1+ts)+noise[(i*37)%4096]]);
      a1.stem(stems,{color:P.COL.mid,r:3.4});

      /* The eye: two bit intervals, the current bit on [0,T_b] and the next on
         [T_b,2T_b], so the sampling instant t_s sits inside the window. */
      const a2 = P.Axes({w:ph?300:680,h:ph?200:gh(155),xr:[0,2*TB],yr:[-2.2,2.2],
        xlabel:'t/T_b',ylabel:'y(t)',pad:{l:ph?42:56,r:ph?16:24,t:22,b:40},xtarget:ph?4:4,ytarget:3});
      a2.raw('<g opacity="0.45">');
      for(let pat=0; pat<64; pat++){
        const b=[]; for(let k=0;k<6;k++) b.push(((pat>>k)&1)?1:-1);
        const pts=[];
        for(let i=0;i<=120;i++){
          const t=i/60*TB;
          let s=0; for(let k=0;k<6;k++) s += b[k]*r(t-(k-3)*TB);
          pts.push([t, s+noise[(ni++)%4096]]);
        }
        a2.poly(pts,{color:P.COL.out,width:0.8});
      }
      a2.raw('</g>');
      a2.vline(ts,{color:P.COL.muted,width:1.6,dash:'5 4'});

      const lg1 = `${L('in','\\text{NRZ}\\;a_k')}${L('out','y(t)')}${L('mid','\\text{samples}')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a1.svg()}</div>${legendRow(lg1)}`
        + `<div class="plot-wrap">${a2.svg()}</div>`
        : `<div class="plot-wrap">${a1.svg()}<div class="legend in-plot lg-at-tr">${lg1}</div></div>`
        + `<div class="plot-wrap">${a2.svg()}</div>`;

      root.querySelector('.ro').innerHTML = `
        <div><dt>τ/T_b</dt><dd>${N(tau,4)}</dd></div>
        <div><dt>Wanted, r(t_s)</dt><dd>${N(wanted,4)}</dd></div>
        <div><dt>Eye half-opening</dt><dd class="${opening<0.2?'warnv':'okv'}">${N(opening,4)}</dd></div>
        <div><dt>Margin</dt><dd class="${margin<3?'warnv':'okv'}">${N(margin,3)} σ</dd></div>`;

      const atTB = Math.abs(st.ts-100)<1e-9;
      const q = Math.exp(-2*Math.PI*st.bt/100);
      const tbNote = atTB ? ` At $t_s=T_b$, $q=e^{-2\\pi BT_b}=${N(q,3)}$ and the half-opening is $1-2q$. It closes at $BT_b\\approx0.110$.` : '';
      const verdict = margin < 1
        ? `<div class="note err"><span class="note-h">The eye is closed</span>
             The half-opening is ${T(fmt(margin,2),false)}σ. A decision at $t_s$ is unreliable for many patterns.</div>`
        : margin < 3
        ? `<div class="note warn"><span class="note-h">Narrow eye</span>
             The half-opening is only ${T(fmt(margin,2),false)}σ. Widen $BT_b$ or move $t_s$ later.</div>`
        : `<div class="note ok"><span class="note-h">Eye open</span>
             The half-opening is ${T(fmt(margin,2),false)}σ, above the noise.${tbNote}</div>`;
      root.querySelector('.derive').innerHTML = M(`
        <div class="eq"><span class="eq-label">Interference</span>${
          T(`\\sum_{m\\ge1}r(t_s+mT_b)=${N(interference,4)}`,true)}</div>
        ${verdict}`);

      root.querySelector('[data-v=bt]').value = st.bt;
      root.querySelector('[data-out=bt]').textContent = fmt(st.bt/100,2);
      root.querySelector('[data-v=ts]').value = st.ts;
      root.querySelector('[data-out=ts]').textContent = fmt(st.ts/100,2);
      root.querySelector('[data-v=sigma]').value = st.sigma;
      root.querySelector('[data-out=sigma]').textContent = fmt(st.sigma/100,3);
    }

    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl"><label>$BT_b$ <span class="val" data-out="bt">0.25</span></label>
                <input type="range" data-v="bt" min="10" max="200" step="5" value="25"></div>
              <div class="ctrl"><label>Noise $\\sigma$ <span class="val" data-out="sigma">0.03</span></label>
                <input type="range" data-v="sigma" min="0" max="30" step="1" value="3"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Sampling instant $t_s/T_b$ <span class="val" data-out="ts">1.00</span></label>
                <input type="range" data-v="ts" min="10" max="100" step="5" value="100"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     E · THE RAISED-COSINE EYE
     Fix (2026-09-24), two bugs in the same computation.

     (1) The six-bit window (k = 0..5, pulses centred at k - 2.5) has an EVEN
     bit count, so no bit is centred at t = 0: the window's centre falls
     exactly on the crossing between bits k=2 and k=3. `opening` and `wanted`
     were read at that crossing, not at a symbol centre, and for several bit
     patterns the six pulse contributions there cancel almost exactly, so both
     readouts collapsed to about 1e-17 at the default offset — a wrong number
     silently disguised as "the eye is closing". Five bits (k = 0..4, centred
     at k - 2, so k = MID = 2 sits at t = 0) give the window a real centre
     bit, the same convention already used by the eye figure in
     build/src/83_scenes_m2.js (figEye).

     (2) The previous readouts also mixed two conventions for the split
     between the wanted sample and the interference: `wanted` took
     `b[2] || b[3]` (a boolean-ish pick with no numeric meaning) and the
     worst-case interference used one fixed neighbour, `b[2]*p(off+0.5)`,
     rather than a sum over every pulse that is not the wanted one. Both are
     now consistent: `wanted` is the centre bit's own pulse value at the
     offset, `p(off)`; the worst-case interference is the maximum, over all
     32 patterns, of the sum of every OTHER bit's contribution at the same
     offset; `opening` is unchanged in form (twice the smallest |total
     sample| over all patterns) but is now measured at a true symbol centre.
     ======================================================================= */
  const E = (() => {
    let st = { alpha:50, offset:0, noise:5 };

    function draw(root){
      const al = st.alpha/100, off = st.offset/100, nz = st.noise/100;
      const p = t => { const den = 1-4*al*al*t*t;
        if(Math.abs(den) < 1e-6) return sinc(t)*Math.PI/4;
        return sinc(t)*Math.cos(Math.PI*al*t)/den; };

      /* Fix (2026-09-24): the previous six-bit window (k = 0..5, pulses
         centred at k - 2.5) has no bit centred at t = 0 — the window is even,
         so t = 0 sits exactly on the crossing between the two middle bits.
         Reading "wanted" and "opening" there measured a crossing, not a
         symbol centre, and for some bit patterns the six contributions cancel
         there almost exactly, so both readouts collapsed to ~1e-17. Five bits
         (k = 0..4, centred at k - 2, so k = 2 sits at t = 0) give the window a
         real centre bit, matching the convention already used by the eye
         figure in build/src/83_scenes_m2.js (figEye). */
      const NBIT = 5, MID = 2;
      const noise = gauss(20260802, 4096, nz);
      const ph = PHONE(), gh = GH(root);
      const ax = P.Axes({w:ph?300:640,h:ph?300:gh(255),xr:[-1,1],yr:[-2.1,2.1],
        xlabel:'t/T_b',ylabel:'y(t)',pad:{l:ph?42:54,r:ph?16:26,t:24,b:44},xtarget:ph?4:4,ytarget:4});
      let ni = 0;
      for(let pat=0;pat<32;pat++){
        const b=[]; for(let k=0;k<NBIT;k++) b.push(((pat>>k)&1)?1:-1);
        const pts=[];
        for(let i=0;i<=100;i++){
          const t=-1+2*i/100;
          let s=0; for(let k=0;k<NBIT;k++) s += b[k]*p(t-(k-MID));
          pts.push([t, s + noise[(ni++)%4096]]);
        }
        ax.poly(pts,{color:P.COL.in,width:0.85,opacity:0.45});
      }
      ax.vline(off,{color:P.COL.h,width:1.8,dash:'5 4'});

      /* The wanted term is the centre bit's own pulse at the sampling offset
         (k = MID, centred at t = 0, so its value at t = off is p(off)). The
         interference for a pattern is the sum of every OTHER bit's
         contribution at the same offset; the worst case is the maximum of
         |interference| over all 32 patterns. The eye opening is twice the
         smallest |total sample| over all patterns, at the chosen offset. */
      const wanted = p(off);
      let best = Infinity, worstIsi = 0;
      for(let pat=0;pat<32;pat++){
        const b=[]; for(let k=0;k<NBIT;k++) b.push(((pat>>k)&1)?1:-1);
        let s=0; for(let k=0;k<NBIT;k++) s += b[k]*p(off-(k-MID));
        const isiSum = s - b[MID]*p(off);
        if(Math.abs(s) < best) best = Math.abs(s);
        worstIsi = Math.max(worstIsi, Math.abs(isiSum));
      }
      const opening = 2*best;

      root.querySelector('.plots').innerHTML = `<div class="plot-wrap">${ax.svg()}</div>`;

      root.querySelector('.lab-eq').innerHTML =
        T(`p(t)=\\operatorname{sinc}(t)\\,\\cos(\\pi\\alpha t)/(1-4\\alpha^2t^2),\\ \\alpha=${N(al,2)}`, false);

      root.querySelector('.ro').innerHTML = `
        <div><dt>Transmission bandwidth</dt><dd>${N(1+al,3)} × W</dd></div>
        <div><dt>Worst-case interference</dt><dd>${N(worstIsi,4)}</dd></div>
        <div><dt>Eye opening, no noise</dt><dd class="${opening<0.6?'warnv':'okv'}">${N(opening,4)}</dd></div>
        <div><dt>Margin over noise</dt><dd class="${opening/2<3*nz?'warnv':'okv'}">${N(opening/2/Math.max(1e-6,nz),3)} σ</dd></div>`;

      root.querySelector('.derive').innerHTML = M(`
        <div class="note ${opening/2<3*nz?'err':'ok'}"><span class="note-h">${opening/2<3*nz?'The eye is closing':'Open'}</span>${
          opening/2<3*nz
          ? `The half-opening is ${T(fmt(opening/2/Math.max(1e-6,nz),2),false)}σ. Reduce the offset or raise the roll-off.`
          : `Every pattern passes close to ${T('\\pm1',false)}.`}</div>`);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
    }

    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="lab-eq eq key" style="padding:14px 20px"></div>
            <div class="ctrls">
              <div class="ctrl"><label>Roll-off $\\alpha$, % <span class="val" data-out="alpha">50</span></label>
                <input type="range" data-v="alpha" min="0" max="100" step="5" value="50"></div>
              <div class="ctrl"><label>Noise $\\sigma$, % <span class="val" data-out="noise">5</span></label>
                <input type="range" data-v="noise" min="0" max="30" step="1" value="5"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Sampling offset, % of $T_b$ <span class="val" data-out="offset">0</span></label>
                <input type="range" data-v="offset" min="-40" max="40" step="5" value="0"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  return { C, D, E, P: P_, Q };
})());
