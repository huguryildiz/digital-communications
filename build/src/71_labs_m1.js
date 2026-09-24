/* ==========================================================================
   Module 1 laboratories.

   L · Sampling and aliasing — a tone and a sampling rate; the samples fit two
       sinusoids and the lower one is what a receiver sees.
   M · Reconstruction from samples — sinc interpolation against a zero-order
       hold, below and above the Nyquist rate.
   N · The quantizer — one input against the staircase transfer function, its
       region, its level and its error.
   O · Companding — the SQNR of a uniform and a mu-law quantizer as the input
       level falls.
   A · Quantization and SQNR — the level count, the amplitude and the shape of
       the input against the measured error and against what the formula
       predicts. The two part company for a reason the reader can drive.
   B · PCM, DPCM and delta modulation — the same source through three coders.

   Every card a laboratory draws follows the slide card language: a computed
   equation takes a coral tab naming what it computes, a note keeps its kind's
   tab and icon. The numerical cores of B follow the recursions of the course
   textbook: `PS CH7.4.2` for the differential coder and `PS CH7.4.3` for the
   delta modulator, both looked up rather than carried over. Nothing here is
   imported; the artifact is one file.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F, el = LABS.KIT.el;
  const P = PLOT;
  const N = (v,d=3) => fmt(v,d);

  /* On the phone layout a lab is one column, so a two-panel figure drawn at
     the desktop width (680-820) renders far narrower and, at the same
     intrinsic height, far flatter: the aspect ratio that fills a wide column
     leaves a strip on a phone. PHONE() is read at the top of each labs
     draw(), after APP.state.layout is current for the render in progress,
     and the figure geometry branches on it rather than depending on a CSS
     rule the panels drawing code alone can supply. */
  const PHONE = () => APP.state.layout === 'phone';
  /* A legend badge is absolutely positioned inside its plot on the wide
     stage, where the panel is tall enough to spare the corner. On a phone
     the panel is too short for that: the badge would sit over the data
     instead of beside it. legendRow renders the same entries as ordinary
     flow content under the figure instead. */
  const legendRow = (...items) => `<div class="legend">${items.join('')}</div>`;

  /* A seeded generator, so that a figure drawn from random samples is the same
     figure on every machine and in every render. mulberry32. */
  function rng(seed){
    let a = seed >>> 0;
    return function(){
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(seed, n, sigma){
    const r = rng(seed), out = new Array(n);
    for(let i=0;i<n;i++){
      const u = Math.max(1e-12, r()), v = r();
      out[i] = sigma*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
    }
    return out;
  }
  function laplacian(seed, n, b){
    const r = rng(seed), out = new Array(n);
    for(let i=0;i<n;i++){
      const u = r() - 0.5;
      out[i] = -b*Math.sign(u)*Math.log(1 - 2*Math.abs(u));
    }
    return out;
  }

  /* Uniform mid-rise quantizer over [-mmax, mmax] with L levels. An input past
     the range is clipped to the outermost level, which is where the overload
     the laboratory is built to show comes from. */
  function quantize(x, mmax, L){
    const d = 2*mmax/L;
    const k = Math.floor(x/d) + 0.5;
    return Math.max(-L/2+0.5, Math.min(L/2-0.5, k))*d;
  }
  const meanSq = a => a.reduce((s,v)=>s+v*v,0)/a.length;
  const sinc = x => Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
  const L = (c,l,dash)=>`<i class="lg-${c}${dash?' lg-dash':''}">${T(l,false)}</i>`;

  /* =======================================================================
     L · SAMPLING AND ALIASING
     A tone g(t) = cos(2*pi*f0*t) sampled at fs. The samples fit any sinusoid
     whose frequency differs from f0 by a multiple of fs; the lowest such
     frequency, the apparent frequency, is what a receiver reads back.
     ======================================================================= */
  const Lab = (() => {
    let st = { f0:3, fs:8 };

    function draw(root){
      const f0 = st.f0, fs = st.fs;
      const nyq = 2*f0, fold = fs/2;
      const alias = fs <= 2*f0;
      /* the apparent frequency: fold f0 into [0, fs/2] by subtracting the
         nearest multiple of fs, then folding about fs/2 as many times as the
         result still exceeds it */
      const kNear = Math.round(f0/fs);
      let fa = Math.abs(f0 - kNear*fs);
      while(fa > fs/2 + 1e-9) fa = fs - fa;
      const g = t => Math.cos(2*Math.PI*f0*t);
      const ga = t => Math.cos(2*Math.PI*fa*t);
      const Ts = 1/fs;
      const tmax = Math.min(4, Math.max(1.2, 6/f0));

      const ph = PHONE();
      /* panel 1: time domain */
      const a1 = P.Axes({w:ph?300:680,h:ph?230:185,xr:[0,tmax],yr:[-1.35,1.35],
        xlabel:'t\\;(\\text{ms})',ylabel:'g(t)',pad:{l:ph?42:54,r:ph?16:24,t:24,b:40},
        xtarget:ph?4:6,ytarget:3});
      a1.curve(g,{color:P.COL.in});
      const samp = []; for(let t=0; t<=tmax+1e-9; t+=Ts) samp.push([t, g(t)]);
      a1.stem(samp,{color:P.COL.mid,r:4});
      a1.curve(ga,{color:P.COL.out,width:2.2,dash: alias ? null : '7 5', opacity: alias?1:0.9});

      /* panel 2: spectrum lines, replicas at f0 + k*fs, band |f| < fs/2 marked */
      const span = Math.max(fs*1.9, f0*1.3, 4);
      const a2 = P.Axes({w:ph?300:680,h:ph?230:155,xr:[-span,span],yr:[-0.15,1.25],
        xlabel:'f\\;(\\text{kHz})',ylabel:'\\text{amplitude}',pad:{l:ph?42:54,r:ph?16:24,t:22,b:40},
        xtarget:ph?4:7,ytarget:2,ytickfmt:()=>''});
      a2.rect(-fold, -0.15, fold, 1.25, {fill: P.COL.dec.out, stroke:'none'});
      a2.vline(-fold,{color:P.COL.muted,dash:'2 4',opacity:0.7});
      a2.vline(fold,{color:P.COL.muted,dash:'2 4',opacity:0.7});
      for(let k=-3;k<=3;k++){
        const fr = f0 + k*fs;
        if(Math.abs(fr) <= span+0.3 && k!==0) a2.impulse(fr, 0.85, {color:P.COL.mid,label:false});
        const frn = -f0 + k*fs;
        if(Math.abs(frn) <= span+0.3 && k!==0) a2.impulse(frn, 0.85, {color:P.COL.mid,label:false});
      }
      a2.impulse(f0, 1, {color:P.COL.in,label:false});
      a2.impulse(-f0, 1, {color:P.COL.in,label:false});

      const lg1 = `${L('in','g(t)')}${L('mid','\\text{samples}')}${L('out',alias?'\\text{apparent tone}':'\\text{lowest fit}',!alias)}`;
      const lg2 = `${L('in','\\pm f_0')}${L('mid','\\text{replicas}')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a1.svg()}</div>${legendRow(lg1)}`
        + `<div class="plot-wrap">${a2.svg()}</div>${legendRow(lg2)}`
        : `<div class="plot-wrap">${a1.svg()}<div class="legend in-plot lg-at-tr">${lg1}</div></div>`
        + `<div class="plot-wrap">${a2.svg()}<div class="legend in-plot lg-at-tr">${lg2}</div></div>`;

      root.querySelector('.lab-eq').innerHTML = ph
        ? T(`g(t)=\\cos(2\\pi f_0 t)`, true)
        : T(`g(t)=\\cos(2\\pi f_0 t),\\quad f_0=${N(f0,2)}\\ \\text{kHz},\\ f_s=${N(fs,2)}\\ \\text{kHz}`, true);

      root.querySelector('.ro').innerHTML = `
        <div><dt>Nyquist rate 2f0</dt><dd>${N(nyq,2)} kHz</dd></div>
        <div><dt>Folding frequency fs/2</dt><dd>${N(fold,2)} kHz</dd></div>
        <div><dt>Apparent frequency fa</dt><dd class="${alias?'warnv':'okv'}">${N(fa,3)} kHz</dd></div>
        <div><dt>Nearest replica index k</dt><dd>${kNear}</dd></div>`;

      root.querySelector('.derive').innerHTML = M(`
        <div class="eq"><span class="eq-label">Apparent frequency</span>${
          T(`f_a=|f_0-kf_s|,\\quad k=\\operatorname{round}(f_0/f_s)=${kNear}\\ \\Rightarrow\\ f_a=${N(fa,3)}\\ \\text{kHz}`,true)}</div>
        <div class="note ${alias?'err':'ok'}"><span class="note-h">${alias?'Aliasing':'No aliasing'}</span>${
          alias
          ? `$f_s<2f_0$. The samples fit a tone at $f_a=${N(fa,3)}$ kHz, not at $f_0$.`
          : `$f_s>2f_0$. The tone at $f_0$ is the lowest frequency the samples fit.`}</div>`);

      const sf0=root.querySelector('[data-v=f0]'), sfs=root.querySelector('[data-v=fs]');
      sf0.value = st.f0; sfs.value = st.fs;
      root.querySelector('[data-out=f0]').textContent = fmt(st.f0,1);
      root.querySelector('[data-out=fs]').textContent = fmt(st.fs,1);
    }
    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="lab-eq eq key" style="padding:14px 20px"></div>
            <div class="ctrls one">
              <div class="ctrl"><label>Tone frequency $f_0$ (kHz) <span class="val" data-out="f0">3</span></label>
                <input type="range" data-v="f0" min="0.5" max="10" step="0.1" value="3"></div>
              <div class="ctrl"><label>Sampling rate $f_s$ (kHz) <span class="val" data-out="fs">8</span></label>
                <input type="range" data-v="fs" min="1" max="20" step="0.1" value="8"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseFloat(e.target.value); draw(root); });
      draw(root);
    }};
  })();

  /* =======================================================================
     M · RECONSTRUCTION FROM SAMPLES
     A bandlimited message, its samples at a controlled multiple of 2W, and
     its reconstruction by a sum of sinc pulses or a zero-order hold.
     ======================================================================= */
  const Lab2 = (() => {
    const W = 1; /* kHz, the message's highest frequency */
    const g = t => 0.6*Math.cos(2*Math.PI*0.6*t) + 0.4*Math.cos(2*Math.PI*1.0*t + 0.7);
    let st = { rate:1.2, method:'sinc', terms:9 };

    function draw(root){
      const fs = st.rate*2*W, Ts = 1/fs;
      const tmax = 4;
      const nMax = Math.ceil(tmax/Ts) + 2, nMin = -2;
      const samp = t => g(t);
      const gr = (t) => {
        if(st.method==='hold'){
          const n = Math.floor(t/Ts);
          return samp(n*Ts);
        }
        const half = Math.min(st.terms, nMax);
        const n0 = Math.max(nMin, Math.round(t/Ts) - half);
        const n1 = Math.min(nMax, Math.round(t/Ts) + half);
        let s = 0;
        for(let n=n0;n<=n1;n++) s += samp(n*Ts)*sinc((t-n*Ts)/Ts);
        return s;
      };
      const err = t => g(t) - gr(t);

      const pts = []; for(let n=nMin;n<=nMax;n++){ const t=n*Ts; if(t>=-0.2 && t<=tmax+0.2) pts.push([t,samp(t)]); }

      const ph = PHONE();
      const a1 = P.Axes({w:ph?300:680,h:ph?230:185,xr:[0,tmax],yr:[-1.25,1.25],
        xlabel:'t\\;(\\text{ms})',ylabel:'g(t),\\;g_r(t)',pad:{l:ph?42:54,r:ph?16:24,t:24,b:40},xtarget:ph?4:6,ytarget:3});
      a1.curve(g,{color:P.COL.in});
      a1.stem(pts,{color:P.COL.mid,r:4});
      a1.curve(gr,{color:P.COL.out,width:2.2});

      const a2 = P.Axes({w:ph?300:680,h:ph?200:160,xr:[0,tmax],yr:[-0.55,0.55],
        xlabel:'t\\;(\\text{ms})',ylabel:'g(t)-g_r(t)',pad:{l:ph?42:54,r:ph?16:24,t:22,b:40},xtarget:ph?4:6,ytarget:3});
      a2.curve(err,{color:P.COL.err,width:1.8});

      const lg1 = `${L('in','g(t)')}${L('mid','\\text{samples}')}${L('out','g_r(t)')}`;
      const lg2 = `${L('err','\\text{error}')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a1.svg()}</div>${legendRow(lg1)}`
        + `<div class="plot-wrap">${a2.svg()}</div>${legendRow(lg2)}`
        : `<div class="plot-wrap">${a1.svg()}<div class="legend in-plot lg-at-tr">${lg1}</div></div>`
        + `<div class="plot-wrap">${a2.svg()}<div class="legend in-plot lg-at-tr">${lg2}</div></div>`;

      root.querySelector('.lab-eq').innerHTML = ph
        ? T(`\\begin{gathered}g(t)=0.6\\cos(2\\pi(0.6)t)\\\\{}+0.4\\cos(2\\pi(1.0)t+0.7)\\end{gathered}`, true)
        : T(`g(t)=0.6\\cos(2\\pi(0.6)t)+0.4\\cos(2\\pi(1.0)t+0.7),\\quad W=${N(W,2)}\\ \\text{kHz}`, true);

      const n = 800; let se=0, me=0;
      for(let i=0;i<=n;i++){ const t=tmax*i/n; const e=Math.abs(err(t)); se+=e*e; me=Math.max(me,e); }
      const rms = Math.sqrt(se/(n+1));

      root.querySelector('.ro').innerHTML = `
        <div><dt>fs / W</dt><dd class="${st.rate<1?'warnv':'okv'}">${N(fs/W,3)}</dd></div>
        <div><dt>Sampling rate fs</dt><dd>${N(fs,3)} kHz</dd></div>
        <div><dt>RMS error</dt><dd>${N(rms,4)}</dd></div>
        <div><dt>Maximum error</dt><dd>${N(me,4)}</dd></div>`;

      const why = st.rate < 1
        ? `$f_s=${N(fs,2)}$ kHz is below the Nyquist rate $2W=${N(2*W,2)}$ kHz. The spectrum replicas overlap, so no filter and no sum of sinc pulses recovers $g(t)$ exactly.`
        : st.method==='hold'
        ? `$g_r(t)=g(nT_s)$ held flat for $nT_s\\le t<(n+1)T_s$. A zero-order hold is not the ideal lowpass filter, so the reconstruction has a staircase error even above the Nyquist rate.`
        : `$g_r(t)=\\sum_n g(nT_s)\\operatorname{sinc}\\!\\big((t-nT_s)/T_s\\big)$, summed to ${st.terms} terms each side. Above the Nyquist rate the infinite sum is exact; the error left here comes from that truncation.`;
      root.querySelector('.derive').innerHTML = M(`
        <div class="note warn"><span class="note-h">Why the error appears</span>${why}</div>`);

      root.querySelector('[data-v=rate]').value = st.rate;
      root.querySelector('[data-out=rate]').textContent = fmt(st.rate,2);
      const ts = root.querySelector('[data-v=terms]'); ts.value = st.terms; ts.disabled = st.method==='hold';
      root.querySelector('[data-out=terms]').textContent = String(st.terms);
      root.querySelectorAll('[data-seg=method]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.method)));
    }
    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="lab-eq eq key" style="padding:14px 20px"></div>
            <div class="ctrls one">
              <div class="ctrl"><label>Sampling rate, $f_s/2W$ <span class="val" data-out="rate">1.20</span></label>
                <input type="range" data-v="rate" min="0.6" max="2.0" step="0.05" value="1.2"></div>
              <div class="ctrl"><label>Reconstruction <span class="seg">
                <button data-seg="method" data-val="sinc">sinc</button>
                <button data-seg="method" data-val="hold">zero-order hold</button></span></label></div>
              <div class="ctrl"><label>Sinc terms, each side <span class="val" data-out="terms">9</span></label>
                <input type="range" data-v="terms" min="1" max="20" step="1" value="9"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k] = k==='terms' ? parseInt(e.target.value,10) : parseFloat(e.target.value); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=method]'); if(!b) return;
        st.method = b.dataset.val; draw(root); });
      draw(root);
    }};
  })();

  /* =======================================================================
     N · THE QUANTIZER
     The staircase transfer v = Q(m). The reader moves the input and reads
     its region, its level, its boundaries and its error against the bound
     |q| <= Delta/2, until the input leaves the range and the bound fails.
     ======================================================================= */
  const Lab3 = (() => {
    const MMAX = 4;
    let st = { levels:8, kind:'midrise', m:1.3 };

    /* Region index k runs 0..L-1 across the range, from the lower boundary
       -mmax up. Mid-rise puts a boundary at 0 (k = floor((m+mmax)/d)),
       mid-tread puts a level at 0 (k = round((m+mmax)/d - 1/2)); both are
       clamped to the outermost region, which is where overload shows up as
       a region that no longer moves with m. */
    function region(m, Lv, kind, mmax){
      const d = 2*mmax/Lv;
      let k = kind==='midrise' ? Math.floor((m+mmax)/d) : Math.round((m+mmax)/d - 0.5);
      k = Math.max(0, Math.min(Lv-1, k));
      const lo = -mmax + k*d, hi = lo + d, v = lo + d/2;
      return { lo, hi, v, k: k+1 };
    }
    function draw(root){
      const Lv = st.levels, kind = st.kind, mmax = MMAX, d = 2*mmax/Lv;
      const mClamped = Math.max(-mmax*1.3, Math.min(mmax*1.3, st.m));
      const q = m => region(m, Lv, kind, mmax).v;
      const reg = region(mClamped, Lv, kind, mmax);
      const v = q(mClamped);
      const overload = Math.abs(mClamped) > mmax;
      const err = mClamped - v;

      const ph = PHONE();
      const a = P.Axes({w:ph?300:680,h:ph?330:290,xr:[-mmax*1.3,mmax*1.3],yr:[-mmax*1.15,mmax*1.15],
        xlabel:'m',ylabel:'v=\\mathbb{Q}(m)',pad:{l:ph?40:56,r:ph?16:26,t:24,b:40},xtarget:ph?4:6,ytarget:5});
      a.poly([[-mmax*1.3,-mmax*1.3],[mmax*1.3,mmax*1.3]],{color:P.COL.muted,dash:'4 5'});
      if(!overload) a.rect(reg.lo, -mmax*1.15, reg.hi, mmax*1.15, {fill:P.COL.dec.mid, stroke:'none'});
      const pts=[]; for(let i=0;i<=900;i++){ const m=-mmax*1.3+2*mmax*1.3*i/900; pts.push([m,q(m)]); }
      a.poly(pts,{color:P.COL.mid,width:2.2});
      a.point(mClamped, v, {color:P.COL.coral});
      a.vline(mClamped, {color:P.COL.coral,dash:'3 4',opacity:0.8});

      root.querySelector('.plots').innerHTML = `<div class="plot-wrap">${a.svg()}</div>`;

      root.querySelector('.lab-eq').innerHTML = T(`L=${Lv}${(Lv&(Lv-1))===0?`,\\ R=\\log_2 L=${Math.round(Math.log2(Lv))}`:''},\\quad m_{\\max}=${N(mmax,1)}`, true);

      root.querySelector('.ro').innerHTML = `
        <div><dt>Step Δ</dt><dd>${N(d,4)}</dd></div>
        <div><dt>Region index k</dt><dd>${overload?'—':reg.k}</dd></div>
        <div><dt>Boundaries</dt><dd>${overload?'—':`[${N(reg.lo,3)}, ${N(reg.hi,3)}]`}</dd></div>
        <div><dt>Level v_k</dt><dd>${N(v,4)}</dd></div>
        <div><dt>Error q = m − v_k</dt><dd class="${overload?'warnv':''}">${N(err,4)}</dd></div>`;

      root.querySelector('.derive').innerHTML = overload
        ? M(`<div class="note err"><span class="note-h">Overload</span>
             $|m|=${N(Math.abs(mClamped),3)}$ exceeds $m_{\\max}=${N(mmax,1)}$. The input clips to the outermost level, and the error is no longer bounded by $\\Delta/2=${N(d/2,4)}$: here it is ${T(N(Math.abs(err),4),false)}.</div>`)
        : M(`<div class="note ok"><span class="note-h">Error bound holds</span>
              $|q|=|m-v_k|=${N(Math.abs(err),4)}\\le\\Delta/2=${N(d/2,4)}$. Every input inside the range is sent to the nearer level, so the error never exceeds half a step.</div>`);

      root.querySelector('[data-v=levels]').value = st.levels;
      root.querySelector('[data-out=levels]').textContent = String(st.levels);
      root.querySelector('[data-v=m]').value = st.m;
      root.querySelector('[data-out=m]').textContent = fmt(st.m,2);
      root.querySelectorAll('[data-seg=kind]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.kind)));
    }
    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="lab-eq eq key" style="padding:14px 20px"></div>
            <div class="ctrls one">
              <div class="ctrl"><label>Levels $L$ <span class="val" data-out="levels">8</span></label>
                <input type="range" data-v="levels" min="2" max="16" step="1" value="8"></div>
              <div class="ctrl"><label>Type <span class="seg">
                <button data-seg="kind" data-val="midrise">mid-rise</button>
                <button data-seg="kind" data-val="midtread">mid-tread</button></span></label></div>
              <div class="ctrl"><label>Input $m$ <span class="val" data-out="m">1.30</span></label>
                <input type="range" data-v="m" min="-5.2" max="5.2" step="0.05" value="1.3"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k] = k==='levels' ? parseInt(e.target.value,10) : parseFloat(e.target.value); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=kind]'); if(!b) return;
        st.kind = b.dataset.val; draw(root); });
      draw(root);
    }};
  })();

  /* =======================================================================
     O · COMPANDING
     The mu-law compressor curve, and the SQNR of a uniform quantizer against
     a mu-law quantizer as the input level falls, both measured on a fixed
     seeded Laplacian source rather than quoted from a formula.
     ======================================================================= */
  const Lab4 = (() => {
    const NS = 8192, A0 = 87.6;
    const src = laplacian(20260923, NS, 0.2);
    const peak = Math.max(...src.map(Math.abs));
    const srcN = src.map(s => Math.max(-1, Math.min(1, s/peak)));

    const mulaw = (x, mu) => mu<=0 ? x : Math.sign(x)*Math.log(1+mu*Math.abs(x))/Math.log(1+mu);
    const mulawInv = (y, mu) => mu<=0 ? y : Math.sign(y)*(Math.pow(1+mu,Math.abs(y))-1)/mu;

    function sqnrAt(levelDb, bits, mu){
      const scale = Math.pow(10, levelDb/20);
      const x = srcN.map(s => Math.max(-1,Math.min(1, s*scale)));
      const Lv = 1<<bits;
      let rec;
      if(mu<=0){
        rec = x.map(v => quantize(v, 1, Lv));
      } else {
        rec = x.map(v => mulawInv(quantize(mulaw(v,mu), 1, Lv), mu));
      }
      const e = x.map((v,i)=>v-rec[i]);
      const pm = meanSq(x), pq = meanSq(e);
      return pq>0 ? 10*Math.log10(pm/pq) : 120;
    }

    let st = { mu:255, level:-10, bits:8 };

    function draw(root){
      const mu = st.mu, bits = st.bits, level = st.level;

      const ph = PHONE();
      const a1 = P.Axes({w:ph?300:680,h:ph?260:175,xr:[-1,1],yr:[-1,1],
        xlabel:'x',ylabel:'y',pad:{l:ph?40:52,r:ph?16:24,t:22,b:40},xtarget:ph?4:4,ytarget:4});
      a1.poly([[-1,-1],[1,1]],{color:P.COL.muted,dash:'4 5'});
      const pts=[]; for(let i=0;i<=400;i++){ const x=-1+2*i/400; pts.push([x, mu>0?mulaw(x,mu):x]); }
      a1.poly(pts,{color:P.COL.in,width:2.4});

      const levels=[]; for(let i=0;i<=60;i++) levels.push(-50 + 50*i/60);
      const sqU = levels.map(lv => sqnrAt(lv, bits, 0));
      const sqM = levels.map(lv => sqnrAt(lv, bits, mu));
      const lo = Math.min(...sqU, ...sqM), hi = Math.max(...sqU, ...sqM);
      const a2 = P.Axes({w:ph?300:680,h:ph?230:185,xr:[-50,0],yr:[Math.max(-5,lo-4),hi+4],
        xlabel: ph ? '\\text{level (dB)}' : '\\text{input level (dB below full scale)}',
        ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',
        pad:{l:ph?44:56,r:ph?16:26,t:22,b:44},xtarget:ph?4:6,ytarget:4});
      a2.poly(levels.map((lv,i)=>[lv,sqU[i]]),{color:P.COL.mid,width:2.2});
      a2.poly(levels.map((lv,i)=>[lv,sqM[i]]),{color:P.COL.in,width:2.2});
      a2.vline(level,{color:P.COL.coral,dash:'3 4',opacity:0.8});
      const curU = sqnrAt(level,bits,0), curM = sqnrAt(level,bits,mu);
      a2.point(level, curU, {color:P.COL.mid});
      a2.point(level, curM, {color:P.COL.in});

      const lg2 = `${L('mid','\\text{uniform}')}${L('in','\\mu\\text{-law}')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a1.svg()}</div>`
        + `<div class="plot-wrap">${a2.svg()}</div>${legendRow(lg2)}`
        : `<div class="plot-wrap">${a1.svg()}</div>`
        + `<div class="plot-wrap">${a2.svg()}<div class="legend in-plot lg-at-tl">${lg2}</div></div>`;

      root.querySelector('.lab-eq').innerHTML = ph
        ? T(`y=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}\\operatorname{sgn}(x)`, true)
        : T(`y=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}\\operatorname{sgn}(x),\\quad \\mu=${N(mu,0)}`, true);

      root.querySelector('.ro').innerHTML = `
        <div><dt>SQNR, uniform</dt><dd>${N(curU,3)} dB</dd></div>
        <div><dt>SQNR, μ-law</dt><dd class="okv">${N(curM,3)} dB</dd></div>
        <div><dt>Difference</dt><dd>${N(curM-curU,3)} dB</dd></div>`;

      root.querySelector('.derive').innerHTML = M(`
        <div class="note ok"><span class="note-h">The trade</span>
          $\\mu$-law keeps the SQNR nearly flat as the level falls, because the compressor gives small amplitudes more gain before the quantizer sees them. It gives up a few dB at full scale in exchange.</div>`);

      root.querySelector('[data-v=mu]').value = st.mu;
      root.querySelector('[data-out=mu]').textContent = String(st.mu);
      root.querySelector('[data-v=level]').value = st.level;
      root.querySelector('[data-out=level]').textContent = fmt(st.level,0);
      root.querySelector('[data-v=bits]').value = st.bits;
      root.querySelector('[data-out=bits]').textContent = String(st.bits);
    }
    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div></div>
          <div class="col stack">
            <div class="lab-eq eq key" style="padding:14px 20px"></div>
            <div class="ctrls">
              <div class="ctrl"><label>$\\mu$ (0 = uniform) <span class="val" data-out="mu">255</span></label>
                <input type="range" data-v="mu" min="0" max="255" step="1" value="255"></div>
              <div class="ctrl"><label>Bits $R$ <span class="val" data-out="bits">8</span></label>
                <input type="range" data-v="bits" min="6" max="8" step="1" value="8"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Input level (dB below full scale) <span class="val" data-out="level">-10</span></label>
                <input type="range" data-v="level" min="-50" max="0" step="1" value="-10"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k] = parseFloat(e.target.value); draw(root); });
      draw(root);
    }};
  })();

  /* =======================================================================
     A · QUANTIZATION AND SQNR
     ======================================================================= */
  const A = (() => {
    const NA = 4096, MMAX = 1;
    let st = { bits:3, amp:100, wave:'sine' };

    /* Three inputs with three different amplitude densities, which is the
       variable the uniform error model is actually sensitive to. A ramp is
       uniform over its range, a sinusoid piles up at its peaks, and a Gaussian
       runs off the end of the quantizer. */
    function source(){
      const A0 = MMAX*st.amp/100;
      if(st.wave==='ramp')
        return Array.from({length:NA}, (_,i)=> A0*(2*(i/NA) - 1));
      if(st.wave==='gauss')
        return gaussian(20260802, NA, A0/3);
      return Array.from({length:NA}, (_,i)=> A0*Math.cos(2*Math.PI*i/NA));
    }

    function draw(root){
      const Lv = 1<<st.bits, d = 2*MMAX/Lv;
      const x = source();
      const v = x.map(s=>quantize(s, MMAX, Lv));
      const e = x.map((s,i)=>s-v[i]);
      const pm = meanSq(x), pq = meanSq(e);
      const sqnrMeas = 10*Math.log10(pm/pq);
      const alpha = 10*Math.log10(3*pm/(MMAX*MMAX));
      const sqnrForm = alpha + 6.0206*st.bits;
      const overload = e.filter(q=>Math.abs(q) > d/2 + 1e-12).length;

      const ph = PHONE();
      const win = Math.min(NA, st.wave==='gauss' ? 220 : NA);
      const ax = P.Axes({w:ph?300:820,h:ph?230:300,xr:[0,win],yr:[-1.35*MMAX,1.35*MMAX],
        xlabel:'n',ylabel:'m[n],\\;\\mathbb{Q}(m[n])',pad:{l:ph?42:56,r:ph?16:26,t:24,b:38},
        xtarget:ph?4:6,ytarget:4});
      for(let k=0;k<Lv;k++) ax.hline(-MMAX+(k+0.5)*d,{color:P.COL.rule,dash:'2 5'});
      ax.poly(x.slice(0,win).map((s,i)=>[i,s]),{color:P.COL.in});
      ax.poly(v.slice(0,win).map((s,i)=>[i,s]),{color:P.COL.mid,width:1.8});

      const bx = P.Axes({w:ph?300:820,h:ph?200:240,xr:[0,win],yr:[-1.9*d,1.9*d],
        xlabel:'n',ylabel:'q[n]',pad:{l:ph?42:56,r:ph?16:26,t:22,b:38},xtarget:ph?4:6,ytarget:3});
      bx.hline(d/2,{color:P.COL.err,dash:'4 4'}); bx.hline(-d/2,{color:P.COL.err,dash:'4 4'});
      bx.poly(e.slice(0,win).map((s,i)=>[i,s]),{color:P.COL.err,width:1.5});

      const lgA1 = `${L('in','m[n]')}${L('mid','\\mathbb{Q}(m[n])')}`;
      const lgA2 = `${L('err','q[n]')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${ax.svg()}</div>${legendRow(lgA1)}`
        + `<div class="plot-wrap">${bx.svg()}</div>${legendRow(lgA2)}`
        : `<div class="plot-wrap">${ax.svg()}<div class="legend in-plot lg-at-tr">${lgA1}</div></div>`
        + `<div class="plot-wrap">${bx.svg()}<div class="legend in-plot lg-at-tr">${lgA2}</div></div>`;

      root.querySelector('.ro').innerHTML = `
        <div><dt>Step size Δ</dt><dd>${fmt(d,4)}</dd></div>
        <div><dt>Error power, meas.</dt><dd>${fmt(pq,6)}</dd></div>
        <div><dt>SQNR, measured</dt><dd class="okv">${fmt(sqnrMeas,4)} dB</dd></div>
        <div><dt>SQNR, α + 6.02R</dt><dd>${fmt(sqnrForm,4)} dB</dd></div>`;

      const verdict = overload
        ? `<div class="note err"><span class="note-h">Overload</span>
            ${overload} of ${NA} samples fall outside the quantizer range and are clipped to the
            outermost level. Their error is not bounded by half a step, so ${T('\\Delta^{2}/12',false)}
            is not an upper bound on it either and the formula is optimistic by
            ${T(fmt(sqnrForm-sqnrMeas,2),false)} dB.</div>`
        : st.wave==='ramp' ? `<div class="note ok"><span class="note-h">The model is exact here</span>
            A ramp visits every amplitude equally often, so the error really is uniform on
            ${T('(-\\Delta/2,\\Delta/2)',false)} and the measurement agrees with
            ${T('\\Delta^{2}/12',false)} to the resolution of the sampling.</div>`
        : `<div class="note warn"><span class="note-h">Why the two differ</span>
            A sinusoid spends most of its time near its peaks, where the quantizer error is
            largest, so the error is not uniformly distributed and its power exceeds
            ${T('\\Delta^{2}/12',false)}. Raise the resolution and watch the gap halve with every
            bit — that is what "${T('\\Delta',false)} small enough" means.</div>`;
      root.querySelector('.derive').innerHTML = M(verdict);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=wave]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.wave)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack">
            <div class="plots" style="display:flex;flex-direction:column;gap:6px"></div>
          </div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label>Input <span class="seg">
                <button data-seg="wave" data-val="sine">sinusoid</button>
                <button data-seg="wave" data-val="ramp">ramp</button>
                <button data-seg="wave" data-val="gauss">Gaussian</button></span></label></div>
              <div class="ctrl"><label>Bits per sample R <span class="val" data-out="bits">3</span></label>
                <input type="range" data-v="bits" min="1" max="10" step="1" value="3"></div>
              <div class="ctrl"><label>Amplitude, % full scale <span class="val" data-out="amp">100</span></label>
                <input type="range" data-v="amp" min="10" max="160" step="10" value="100"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=wave]'); if(!b) return;
        st.wave = b.dataset.val; draw(root); });
      draw(root);
    }};
  })();

  /* =======================================================================
     B · PCM, DPCM AND DELTA MODULATION
     ======================================================================= */
  const B = (() => {
    const NB = 256, MMAX = 1;
    let st = { method:'pcm', bits:3, step:8, phase:64 };

    /* One source for all three coders, so that what changes between them is the
       coder and nothing else. It is smooth enough that a predictor has
       something to predict, which is the whole point of the comparison. */
    const src = Array.from({length:NB}, (_,n)=>{
      const t = n/NB;
      return 0.78*Math.sin(2*Math.PI*t) + 0.26*Math.sin(6*Math.PI*t + 0.9);
    });

    /* Differential PCM with a first-order predictor, in the closed-loop form:
       the encoder predicts from what the decoder will have, so the two stay in
       lock-step and the errors do not accumulate. */
    function dpcm(a1, Lv, eMax){
      const rec = [], raw = [];
      for(let n=0;n<NB;n++){
        const pred = a1*(rec[n-1] ?? 0);
        const e = src[n] - pred;
        const eq = quantize(e, eMax, Lv);
        raw.push(e);
        rec.push(pred + eq);
      }
      return { rec, raw };
    }

    /* Linear delta modulation: one bit a sample, the staircase chasing the
       source by one step at a time. */
    function delta(step){
      const rec = []; let xhat = 0;
      for(let n=0;n<NB;n++){
        xhat += (src[n] >= xhat) ? step : -step;
        rec.push(xhat);
      }
      return rec;
    }

    function draw(root){
      const Lv = 1<<st.bits, step = MMAX*st.step/100;
      let rec, bitsPerSample, note, gain = null;

      if(st.method==='dpcm'){
        const a1 = 0.95;
        /* The prediction error is far smaller than the signal, so the quantizer
           is given the range the error actually occupies rather than the range
           of the source. That reallocation is where the gain comes from. */
        const probe = dpcm(a1, Lv, MMAX).raw;
        const eMax = Math.max(...probe.map(Math.abs))*1.05 || MMAX;
        const out = dpcm(a1, Lv, eMax);
        rec = out.rec; bitsPerSample = st.bits;
        gain = 10*Math.log10(meanSq(src)/meanSq(out.raw));
        note = `<div class="note ok"><span class="note-h">Prediction gain</span>
          The predictor removes ${T(fmt(gain,2),false)} dB of the signal before the quantizer
          sees it. The same number of bits therefore covers a much smaller range, and the step
          size falls in proportion. Raise the resolution and the gain does not change: it is a
          property of the source and the predictor, not of the quantizer.</div>`;
      } else if(st.method==='dm'){
        rec = delta(step);
        bitsPerSample = 1;
        const maxSlope = Math.max(...src.slice(1).map((v,i)=>Math.abs(v-src[i])));
        const overload = maxSlope > step;
        note = overload
          ? `<div class="note err"><span class="note-h">Slope overload</span>
             The source changes by up to ${T(fmt(maxSlope,4),false)} between samples and the
             staircase can move only ${T(fmt(step,4),false)}. It falls behind wherever the signal
             is steep, and no amount of time fixes it. Raise the step size.</div>`
          : `<div class="note warn"><span class="note-h">Granular noise</span>
             The staircase keeps up everywhere, and the price is that it now hunts by a whole
             step either side of a flat signal. The step size trades one error against the
             other, and the best value sits between the two failures.</div>`;
      } else {
        rec = src.map(s=>quantize(s, MMAX, Lv));
        bitsPerSample = st.bits;
        note = `<div class="note warn"><span class="note-h">Each sample on its own</span>
          PCM spends the same number of bits on every sample and uses nothing it already knows.
          The source above is smooth, so consecutive samples are strongly related and most of
          those bits are re-sending what the decoder could have predicted.</div>`;
      }

      const err = src.map((s,i)=>s-rec[i]);
      const snr = 10*Math.log10(meanSq(src)/meanSq(err));

      /* The readouts describe the whole run and not the part drawn so far. An
         SQNR that changed as the trace grew would be measuring the length of
         the prefix, which is a fact about the animation and not about the
         coder. */
      const shown = rec.slice(0, 4*st.phase);

      const ph = PHONE();
      const ax = P.Axes({w:ph?300:820,h:ph?230:300,xr:[0,NB],yr:[-1.35,1.35],
        xlabel:'n',ylabel:'m[n],\\;\\hat{m}[n]',pad:{l:ph?42:56,r:ph?16:26,t:24,b:38},xtarget:ph?4:6,ytarget:4});
      ax.poly(src.map((s,i)=>[i,s]),{color:P.COL.in});
      ax.poly(shown.map((s,i)=>[i,s]),{color:P.COL.out,width:1.8});

      const bx = P.Axes({w:ph?300:820,h:ph?190:240,xr:[0,NB],yr:[-0.42,0.42],
        xlabel:'n',ylabel:'m[n]-\\hat{m}[n]',pad:{l:ph?42:56,r:ph?16:26,t:22,b:38},xtarget:ph?4:6,ytarget:3});
      bx.poly(err.slice(0, 4*st.phase).map((s,i)=>[i,s]),{color:P.COL.err,width:1.5});

      const lgB1 = `${L('in','m[n]')}${L('out','\\hat{m}[n]')}`;
      const lgB2 = `${L('err','\\text{error}')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${ax.svg()}</div>${legendRow(lgB1)}`
        + `<div class="plot-wrap">${bx.svg()}</div>${legendRow(lgB2)}`
        : `<div class="plot-wrap">${ax.svg()}<div class="legend in-plot lg-at-tr">${lgB1}</div></div>`
        + `<div class="plot-wrap">${bx.svg()}<div class="legend in-plot lg-at-tr">${lgB2}</div></div>`;

      root.querySelector('.ro').innerHTML = `
        <div><dt>Bits per sample</dt><dd>${bitsPerSample}</dd></div>
        <div><dt>Signal power</dt><dd>${fmt(meanSq(src),5)}</dd></div>
        <div><dt>Error power</dt><dd>${fmt(meanSq(err),6)}</dd></div>
        <div><dt>Signal-to-noise ratio</dt><dd class="okv">${fmt(snr,4)} dB</dd></div>
        ${gain!==null?`<div><dt>Prediction gain</dt><dd>${fmt(gain,3)} dB</dd></div>`:''}`;
      root.querySelector('.derive').innerHTML = M(note);
      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=method]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.method)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack">
            <div class="plots" style="display:flex;flex-direction:column;gap:6px"></div>
          </div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label>Coder <span class="seg">
                <button data-seg="method" data-val="pcm">PCM</button>
                <button data-seg="method" data-val="dpcm">DPCM</button>
                <button data-seg="method" data-val="dm">delta</button></span></label></div>
              <div class="ctrl"><label>Bits/sample, PCM and DPCM <span class="val" data-out="bits">3</span></label>
                <input type="range" data-v="bits" min="1" max="8" step="1" value="3"></div>
              <div class="ctrl"><label>Delta step, % full scale <span class="val" data-out="step">8</span></label>
                <input type="range" data-v="step" min="1" max="30" step="1" value="8"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Samples coded <span class="val" data-out="phase">64</span></label>
                <div class="ctrl-run"><input type="range" data-v="phase" min="0" max="64" step="1" value="64">${LABS.KIT.runbar()}</div></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=method]'); if(!b) return;
        st.method = b.dataset.val; draw(root); });
      draw(root);
      LABS.KIT.transport(root, { key:'phase', max:64, ms:55,
        get:()=>st.phase, set:v=>{ st.phase=v; }, redraw:()=>draw(root) });
    }};
  })();

  return { L: Lab, M: Lab2, N: Lab3, O: Lab4, A, B };
})());
