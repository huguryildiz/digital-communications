/* ==========================================================================
   Module 1 laboratories.

   A · Quantization and SQNR — the level count, the amplitude and the shape of
       the input against the measured error and against what the formula
       predicts. The two part company for a reason the reader can drive.
   B · PCM, DPCM and delta modulation — the same source through three coders.

   The numerical cores of B follow the recursions of the course textbook:
   `PS CH7.4.2` for the differential coder and `PS CH7.4.3` for the delta
   modulator, both looked up rather than carried over. Nothing here is imported;
   the artifact is one file.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F, el = LABS.KIT.el;
  const P = PLOT;

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

  /* Uniform mid-rise quantizer over [-mmax, mmax] with L levels. An input past
     the range is clipped to the outermost level, which is where the overload
     the laboratory is built to show comes from. */
  function quantize(x, mmax, L){
    const d = 2*mmax/L;
    const k = Math.floor(x/d) + 0.5;
    return Math.max(-L/2+0.5, Math.min(L/2-0.5, k))*d;
  }
  const meanSq = a => a.reduce((s,v)=>s+v*v,0)/a.length;

  /* =======================================================================
     A · QUANTIZATION AND SQNR
     ======================================================================= */
  const A = (() => {
    const N = 4096, MMAX = 1;
    let st = { bits:3, amp:100, wave:'sine' };

    /* Three inputs with three different amplitude densities, which is the
       variable the uniform error model is actually sensitive to. A ramp is
       uniform over its range, a sinusoid piles up at its peaks, and a Gaussian
       runs off the end of the quantizer. */
    function source(){
      const A0 = MMAX*st.amp/100;
      if(st.wave==='ramp')
        return Array.from({length:N}, (_,i)=> A0*(2*(i/N) - 1));
      if(st.wave==='gauss')
        return gaussian(20260802, N, A0/3);
      return Array.from({length:N}, (_,i)=> A0*Math.cos(2*Math.PI*i/N));
    }

    function draw(root){
      const L = 1<<st.bits, d = 2*MMAX/L;
      const x = source();
      const v = x.map(s=>quantize(s, MMAX, L));
      const e = x.map((s,i)=>s-v[i]);
      const pm = meanSq(x), pq = meanSq(e);
      const sqnrMeas = 10*Math.log10(pm/pq);
      const alpha = 10*Math.log10(3*pm/(MMAX*MMAX));
      const sqnrForm = alpha + 6.0206*st.bits;
      const overload = e.filter(q=>Math.abs(q) > d/2 + 1e-12).length;

      const win = Math.min(N, st.wave==='gauss' ? 220 : N);
      const ax = P.Axes({w:820,h:250,xr:[0,win],yr:[-1.35*MMAX,1.35*MMAX],
        xlabel:'n',ylabel:'m[n],\\;\\mathbb{Q}(m[n])',pad:{l:56,r:26,t:26,b:40},
        xtarget:6,ytarget:4});
      for(let k=0;k<L;k++) ax.hline(-MMAX+(k+0.5)*d,{color:P.COL.rule,dash:'2 5'});
      ax.poly(x.slice(0,win).map((s,i)=>[i,s]),{color:P.COL.in});
      ax.poly(v.slice(0,win).map((s,i)=>[i,s]),{color:P.COL.mid,width:1.8});

      const bx = P.Axes({w:820,h:170,xr:[0,win],yr:[-1.9*d,1.9*d],
        xlabel:'n',ylabel:'q[n]',pad:{l:56,r:26,t:26,b:40},xtarget:6,ytarget:3});
      bx.hline(d/2,{color:P.COL.err,dash:'4 4'}); bx.hline(-d/2,{color:P.COL.err,dash:'4 4'});
      bx.poly(e.slice(0,win).map((s,i)=>[i,s]),{color:P.COL.err,width:1.5});

      root.querySelector('.plots').innerHTML = ax.svg() + bx.svg();
      root.querySelector('.ro').innerHTML = `
        <div><dt>Levels L</dt><dd>${L}</dd></div>
        <div><dt>Step size Δ</dt><dd>${fmt(d,4)}</dd></div>
        <div><dt>Signal power</dt><dd>${fmt(pm,5)}</dd></div>
        <div><dt>Error power, measured</dt><dd>${fmt(pq,6)}</dd></div>
        <div><dt>Error power, Δ²/12</dt><dd>${fmt(d*d/12,6)}</dd></div>
        <div><dt>SQNR, measured</dt><dd class="okv">${fmt(sqnrMeas,4)} dB</dd></div>
        <div><dt>SQNR, α + 6.02R</dt><dd>${fmt(sqnrForm,4)} dB</dd></div>
        <div><dt>Formula minus measured</dt><dd class="${Math.abs(sqnrForm-sqnrMeas)>1?'warnv':''}">${fmt(sqnrForm-sqnrMeas,3)} dB</dd></div>
        <div><dt>Samples past half a step</dt><dd class="${overload?'warnv':'okv'}">${overload} of ${N}</dd></div>`;

      const verdict =
        overload ? `<div class="note err"><span class="note-h">Overload</span>
            ${overload} of ${N} samples fall outside the quantizer range and are clipped to the
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
            bit — that is what “${T('\\Delta',false)} small enough” means.</div>`;
      root.querySelector('.verdict').innerHTML = verdict;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=wave]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.wave)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack">
            <div class="plots"></div>
          </div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Input <span class="seg">
                <button data-seg="wave" data-val="sine">sinusoid</button>
                <button data-seg="wave" data-val="ramp">ramp</button>
                <button data-seg="wave" data-val="gauss">Gaussian</button></span></label></div>
              <div class="ctrl"><label>Bits per sample R <span class="val" data-out="bits">3</span></label>
                <input type="range" data-v="bits" min="1" max="10" step="1" value="3"></div>
              <div class="ctrl"><label>Amplitude, % of full scale <span class="val" data-out="amp">100</span></label>
                <input type="range" data-v="amp" min="10" max="160" step="10" value="100"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
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
    const N = 256, MMAX = 1;
    let st = { method:'pcm', bits:3, step:8, phase:64 };

    /* One source for all three coders, so that what changes between them is the
       coder and nothing else. It is smooth enough that a predictor has
       something to predict, which is the whole point of the comparison. */
    const src = Array.from({length:N}, (_,n)=>{
      const t = n/N;
      return 0.78*Math.sin(2*Math.PI*t) + 0.26*Math.sin(6*Math.PI*t + 0.9);
    });

    /* Differential PCM with a first-order predictor, in the closed-loop form:
       the encoder predicts from what the decoder will have, so the two stay in
       lock-step and the errors do not accumulate. */
    function dpcm(a1, L, eMax){
      const rec = [], raw = [];
      for(let n=0;n<N;n++){
        const pred = a1*(rec[n-1] ?? 0);
        const e = src[n] - pred;
        const eq = quantize(e, eMax, L);
        raw.push(e);
        rec.push(pred + eq);
      }
      return { rec, raw };
    }

    /* Linear delta modulation: one bit a sample, the staircase chasing the
       source by one step at a time. */
    function delta(step){
      const rec = []; let xhat = 0;
      for(let n=0;n<N;n++){
        xhat += (src[n] >= xhat) ? step : -step;
        rec.push(xhat);
      }
      return rec;
    }

    function draw(root){
      const L = 1<<st.bits, step = MMAX*st.step/100;
      let rec, bitsPerSample, note, gain = null;

      if(st.method==='dpcm'){
        const a1 = 0.95;
        /* The prediction error is far smaller than the signal, so the quantizer
           is given the range the error actually occupies rather than the range
           of the source. That reallocation is where the gain comes from. */
        const probe = dpcm(a1, L, MMAX).raw;
        const eMax = Math.max(...probe.map(Math.abs))*1.05 || MMAX;
        const out = dpcm(a1, L, eMax);
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
        rec = src.map(s=>quantize(s, MMAX, L));
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

      const ax = P.Axes({w:820,h:250,xr:[0,N],yr:[-1.35,1.35],
        xlabel:'n',ylabel:'m[n],\\;\\hat{m}[n]',pad:{l:56,r:26,t:26,b:40},xtarget:6,ytarget:4});
      ax.poly(src.map((s,i)=>[i,s]),{color:P.COL.in});
      ax.poly(shown.map((s,i)=>[i,s]),{color:P.COL.out,width:1.8});

      const bx = P.Axes({w:820,h:160,xr:[0,N],yr:[-0.42,0.42],
        xlabel:'n',ylabel:'m[n]-\\hat{m}[n]',pad:{l:56,r:26,t:26,b:40},xtarget:6,ytarget:3});
      bx.poly(err.slice(0, 4*st.phase).map((s,i)=>[i,s]),{color:P.COL.err,width:1.5});

      root.querySelector('.plots').innerHTML = ax.svg() + bx.svg();
      root.querySelector('.ro').innerHTML = `
        <div><dt>Bits per sample</dt><dd>${bitsPerSample}</dd></div>
        <div><dt>Bit rate, relative to DM</dt><dd>${bitsPerSample}×</dd></div>
        <div><dt>Signal power</dt><dd>${fmt(meanSq(src),5)}</dd></div>
        <div><dt>Error power</dt><dd>${fmt(meanSq(err),6)}</dd></div>
        <div><dt>Signal-to-noise ratio</dt><dd class="okv">${fmt(snr,4)} dB</dd></div>
        ${gain!==null?`<div><dt>Prediction gain</dt><dd>${fmt(gain,3)} dB</dd></div>`:''}
        <div><dt>SNR per bit per sample</dt><dd>${fmt(snr/bitsPerSample,4)} dB</dd></div>`;
      root.querySelector('.verdict').innerHTML = note;
      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=method]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.method)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack">
            <div class="plots"></div>
          </div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Coder <span class="seg">
                <button data-seg="method" data-val="pcm">PCM</button>
                <button data-seg="method" data-val="dpcm">DPCM</button>
                <button data-seg="method" data-val="dm">delta</button></span></label></div>
              <div class="ctrl"><label>Bits per sample, PCM and DPCM <span class="val" data-out="bits">3</span></label>
                <input type="range" data-v="bits" min="1" max="8" step="1" value="3"></div>
              <div class="ctrl"><label>Delta step, % of full scale <span class="val" data-out="step">8</span></label>
                <input type="range" data-v="step" min="1" max="30" step="1" value="8"></div>
              <div class="ctrl"><label>Samples coded <span class="val" data-out="phase">64</span></label>
                <input type="range" data-v="phase" min="0" max="64" step="1" value="64"></div>
              ${LABS.KIT.runbar()}
            </div>
            <dl class="readout ro"></dl>
            <div class="verdict"></div>
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

  return { A, B };
})());
