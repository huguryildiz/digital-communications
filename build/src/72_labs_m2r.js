/* ==========================================================================
   Module 2 laboratories — section 2.1, random signals.

   T · A random signal through a filter — white noise, a random-phase
       sinusoid or a random binary wave through an RC or an ideal lowpass;
       the measured output power, autocorrelation and spectrum settle on the
       theory as records are averaged.

   Units: time in ms, frequency in kHz, amplitude in V. The simulation runs
   at f_s = 32 kHz (dt = 1/32 ms) in records of N = 2048 samples, 64 ms each,
   so the record spacing in frequency is 1/64 kHz and both f_0 = 1 kHz and
   T_b = 0.5 ms (16 samples) fit a record a whole number of times. White
   noise has the course's two-sided density N_0/2 = 1 V^2/kHz.

   The simulation reproduces the continuous-time statistics, not a sampled
   approximation of them, so a measured value converges on the formula the
   card states:
   - RC and white noise: the output is the Ornstein-Uhlenbeck process, whose
     samples obey y[n+1] = a y[n] + sqrt(P(1-a^2)) z[n] exactly, with
     a = exp(-dt/RC) and P = (N_0/2) pi f_3dB. A discrete filter run on the
     sampled input would lose the 1/f^2 tail beyond f_s/2, up to 20% of P.
   - RC and the binary wave: the input is constant between samples, so the
     zero-order-hold recursion y[n+1] = a y[n] + (1-a) x[n] is exact.
   - Ideal lowpass: a circular filter on the record's DFT. A bin exactly at
     |f| = B takes half power, so the passed noise power is N_0 B exactly.
   - The sinusoid through either filter is written down in closed form.

   Every card follows the slide card language: the equation of the input at
   the top is untabbed, the computed output power takes a coral tab, and one
   note says what to notice. Everything random is seeded (mulberry32).
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F, GH = LABS.KIT.GH;
  const P = PLOT;

  const PHONE = () => APP.state.layout === 'phone';
  const legendRow = (...items) => `<div class="legend">${items.join('')}</div>`;
  const L = (c,l,dash,dot)=>`<i class="lg-${c}${dash?' lg-dash':''}${dot?' lg-dot':''}">${T(l,false)}</i>`;

  function rng(seed){ let a=seed>>>0; return function(){
    a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  const sinc = x => Math.abs(x)<1e-12 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);

  /* In-place radix-2 FFT; sign -1 forward, +1 inverse (unscaled). */
  function fft(re, im, sign){
    const n = re.length;
    for(let i=1,j=0;i<n;i++){ let bit=n>>1; for(;j&bit;bit>>=1) j^=bit; j^=bit;
      if(i<j){ let t=re[i]; re[i]=re[j]; re[j]=t; t=im[i]; im[i]=im[j]; im[j]=t; } }
    for(let len=2;len<=n;len<<=1){
      const ang = sign*2*Math.PI/len, wr=Math.cos(ang), wi=Math.sin(ang);
      for(let i=0;i<n;i+=len){ let cr=1, ci=0;
        for(let k=0;k<len/2;k++){
          const a=i+k, b=a+len/2;
          const xr=re[b]*cr-im[b]*ci, xi=re[b]*ci+im[b]*cr;
          re[b]=re[a]-xr; im[b]=im[a]-xi; re[a]+=xr; im[a]+=xi;
          const t=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=t; } } }
  }

  /* =======================================================================
     T · A RANDOM SIGNAL THROUGH A FILTER
     ======================================================================= */
  const T_ = (() => {
    const FS = 32, DT = 1/FS, N = 2048, DF = FS/N;       /* kHz, ms, samples */
    const A = 1, F0 = 1, TB = 0.5, SPB = 16, HALF_N0 = 1; /* V, kHz, ms */
    const NREC = 32, KL = 64;                             /* records, lags (2 ms) */
    const WL = 256, NSEG = N/WL, WDF = FS/WL, KS = 48;    /* Welch: 0.125 kHz bins to 6 kHz */
    const WARM = 256;                                     /* RC warm-up samples, 8 ms */
    const TSHOW = 5, NSHOW = TSHOW*FS;                    /* sample functions on 0..5 ms */
    const FMAX = 6, TAUMAX = 2;
    let st = { inp:'white', filt:'rc', bw:4, phase:NREC };

    /* The randomness of record r belongs to the record, not to the settings,
       so moving the bandwidth refilters the same input sample functions. */
    const pool = [];
    function src(r){
      if(pool[r]) return pool[r];
      const g = rng(20260924 + 7919*r), z = new Float64Array(N+1);
      for(let i=0;i<=N;i++){ const u=Math.max(1e-12,g()), v=g();
        z[i] = Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
      const theta = 2*Math.PI*g();
      const off = Math.floor(g()*SPB);
      const nb = Math.ceil((N+WARM)/SPB)+2, bits = new Int8Array(nb);
      for(let i=0;i<nb;i++) bits[i] = g()<0.5 ? -1 : 1;
      return (pool[r] = { z, theta, off, bits });
    }

    const f3 = () => st.bw/4;                    /* kHz: f_3dB or B */
    const H2 = (f, B) => st.filt==='rc' ? 1/(1+(f/B)*(f/B)) : (Math.abs(f)<=B ? 1 : 0);
    const SX = f => st.inp==='binary' ? A*A*TB*sinc(f*TB)*sinc(f*TB) : st.inp==='white' ? HALF_N0 : 0;

    function idealFilter(x, B){
      const re = Float64Array.from(x), im = new Float64Array(N);
      fft(re, im, -1);
      for(let k=0;k<N;k++){
        const f = Math.abs((k<=N/2 ? k : k-N)*DF);
        const g = f < B-1e-9 ? 1 : (f < B+1e-9 ? Math.SQRT1_2 : 0);
        re[k]*=g; im[k]*=g;
      }
      fft(re, im, 1);
      for(let k=0;k<N;k++) re[k]/=N;
      return re;
    }

    /* One record: its input and output sample functions and the three
       estimates taken from it by time averaging. */
    function record(r){
      const s = src(r), B = f3(), x = new Float64Array(N), y = new Float64Array(N);
      const RC = 1/(2*Math.PI*B), a = Math.exp(-DT/RC);
      if(st.inp==='white'){
        const sx = Math.sqrt(HALF_N0*FS);
        for(let n=0;n<N;n++) x[n] = sx*s.z[n+1];
        if(st.filt==='rc'){
          const Pw = HALF_N0*Math.PI*B, c = Math.sqrt(Pw*(1-a*a));
          let v = Math.sqrt(Pw)*s.z[0];
          for(let n=0;n<N;n++){ y[n] = v; v = a*v + c*s.z[n+1]; }
        } else y.set(idealFilter(x, B));
      } else if(st.inp==='sine'){
        const w = 2*Math.PI*F0;
        const g = st.filt==='rc' ? 1/Math.sqrt(1+(F0/B)*(F0/B)) : (F0<=B ? 1 : 0);
        const ph = st.filt==='rc' ? -Math.atan(F0/B) : 0;
        for(let n=0;n<N;n++){ const t=n*DT;
          x[n] = A*Math.cos(w*t+s.theta); y[n] = A*g*Math.cos(w*t+s.theta+ph); }
      } else {
        const bit = n => A*s.bits[Math.floor((n+WARM+s.off)/SPB)];
        for(let n=0;n<N;n++) x[n] = bit(n);
        if(st.filt==='rc'){
          let v = 0;
          for(let n=-WARM;n<0;n++) v = a*v + (1-a)*bit(n);
          for(let n=0;n<N;n++){ y[n] = v; v = a*v + (1-a)*x[n]; }
        } else y.set(idealFilter(x, B));
      }
      let mean=0, pow=0;
      for(let n=0;n<N;n++){ mean+=y[n]; pow+=y[n]*y[n]; }
      const R = new Float64Array(KL+1);
      for(let k=0;k<=KL;k++){ let acc=0; for(let n=0;n+k<N;n++) acc+=y[n]*y[n+k]; R[k]=acc/(N-k); }
      const S = new Float64Array(KS+1);
      for(let sgi=0;sgi<NSEG;sgi++){ const o=sgi*WL;
        for(let k=0;k<=KS;k++){ let cr=0, ci=0;
          for(let n=0;n<WL;n++){ const v=HANN[n]*y[o+n], j=(k*n)%WL; cr+=v*COS[j]; ci-=v*SIN[j]; }
          S[k] += (cr*cr+ci*ci)*DT/UW/NSEG; } }
      return { x, y, mean:mean/N, pow:pow/N, R, S };
    }
    const HANN = new Float64Array(WL), COS = new Float64Array(WL), SIN = new Float64Array(WL);
    let UW = 0;
    for(let n=0;n<WL;n++){ HANN[n]=0.5-0.5*Math.cos(2*Math.PI*n/WL); UW+=HANN[n]*HANN[n];
      COS[n]=Math.cos(2*Math.PI*n/WL); SIN[n]=Math.sin(2*Math.PI*n/WL); }

    let cache = { key:null, recs:[], theory:null };
    function recs(n){
      const key = st.inp+'|'+st.filt+'|'+st.bw;
      if(cache.key !== key) cache = { key, recs:[], theory:null };
      while(cache.recs.length < n) cache.recs.push(record(cache.recs.length));
      return cache.recs.slice(0, n);
    }

    function simpson(f, a, b, n){
      const h=(b-a)/n; let s=f(a)+f(b);
      for(let i=1;i<n;i++) s += (i%2?4:2)*f(a+i*h);
      return s*h/3;
    }

    /* The theory: R_Y on a grid of lags, and P_Y = R_Y(0). */
    const TAUS = 161;
    function theory(){
      if(cache.theory) return cache.theory;
      const B = f3(), RC = 1/(2*Math.PI*B);
      let Rf, Py;
      if(st.inp==='white'){
        if(st.filt==='rc'){ Py = HALF_N0*Math.PI*B; Rf = t => Py*Math.exp(-Math.abs(t)/RC); }
        else { Py = 2*HALF_N0*B; Rf = t => Py*sinc(2*B*t); }
      } else if(st.inp==='sine'){
        Py = A*A/2*H2(F0,B); Rf = t => Py*Math.cos(2*Math.PI*F0*t);
      } else if(st.filt==='rc'){
        Py = A*A*(1 - RC/TB*(1-Math.exp(-TB/RC)));
        Rf = t => simpson(u => A*A*(1-Math.abs(u)/TB)*Math.exp(-Math.abs(t-u)/RC)/(2*RC), -TB, TB, 400);
      } else {
        Py = 2*simpson(f => SX(f), 0, B, 400);
        Rf = t => 2*simpson(f => SX(f)*Math.cos(2*Math.PI*f*t), 0, B, 400);
      }
      const grid = [];
      for(let i=0;i<TAUS;i++){ const t=-TAUMAX+2*TAUMAX*i/(TAUS-1); grid.push([t, Rf(t)]); }
      return (cache.theory = { Py, grid });
    }

    function draw(root){
      const nrec = Math.max(1, Math.min(NREC, st.phase));
      const R = recs(nrec), th = theory(), B = f3(), RC = 1/(2*Math.PI*B);
      const avg = sel => R.reduce((a,r)=>a+sel(r),0)/R.length;
      const Pm = avg(r=>r.pow), mu = avg(r=>r.mean);
      const Rm = [], Sm = [];
      for(let k=0;k<=KL;k++) Rm.push(avg(r=>r.R[k]));
      for(let k=0;k<=KS;k++) Sm.push(avg(r=>r.S[k]));
      const PX = st.inp==='sine' ? A*A/2 : A*A;

      /* Two rows: the sample functions and R_Y share the first, the spectrum
         takes the whole second. A third stacked row does not fit the lecture
         mode, where every plot carries its axis names at 1.36 times the size. */
      const ph = PHONE(), gh = GH(root);
      const W = ph?300:680, WH = ph?300:340;

      /* 1 · sample functions, the latest three records */
      const yspan = st.inp==='white' ? Math.max(3.5*Math.sqrt(th.Py), 1.5) : 1.4*A;
      const a1 = P.Axes({w:WH,h:ph?220:gh(150),xr:[0,TSHOW],yr:[-yspan,yspan],
        xlabel:'t\\ (\\text{ms})',ylabel:'x,\\;y\\ (\\text{V})',pad:{l:ph?44:50,r:ph?16:18,t:22,b:40},
        xtarget:ph?4:5,ytarget:3});
      const shown = R.slice(-3);
      /* A white-noise input runs far past the range. It is drawn only where it
         is inside, one piece per excursion, so no trace reaches the axis name. */
      const lines = (arr, o) => { let cur=[];
        const out = () => { if(cur.length>1) a1.poly(cur, o); cur=[]; };
        for(let n=0;n<=NSHOW;n++){ if(Math.abs(arr[n])<=yspan) cur.push([n*DT, arr[n]]); else out(); }
        out(); };
      /* poly() takes no opacity, so the faint traces sit in a group that has one */
      a1.raw(`<g opacity="${st.inp==='white'?0.22:0.35}">`);
      shown.forEach(r => lines(r.x,{color:P.COL.in,width:st.inp==='white'?0.7:1.2}));
      a1.raw('</g><g opacity="0.4">');
      shown.slice(0,-1).forEach(r => lines(r.y,{color:P.COL.out,width:1.2}));
      a1.raw('</g>');
      lines(shown[shown.length-1].y,{color:P.COL.out,width:2.2});

      /* 2 · autocorrelation, theory against the time-average estimate */
      const rs = Math.max(th.Py, 0.1*PX);
      const a2 = P.Axes({w:WH,h:ph?200:gh(150),xr:[-TAUMAX,TAUMAX],
        yr: st.inp==='sine' ? [-1.3*rs, 1.3*rs] : [-0.3*rs, 1.3*rs],
        xlabel:'\\tau\\ (\\text{ms})',ylabel:'R_Y\\ (\\text{V}^2)',pad:{l:ph?44:50,r:ph?16:18,t:22,b:40},
        xtarget:4,ytarget:ph?3:2});
      a2.poly(th.grid,{color:P.COL.out,width:2.4});
      const rpts = [];
      for(let k=-KL;k<=KL;k++) rpts.push([k*DT, Rm[Math.abs(k)]]);
      a2.poly(rpts,{color:P.COL.mid,width:1.8,dash:'6 4'});

      /* 3 · spectrum: S_X, the scaled |H|^2, S_Y and the averaged periodogram */
      const ref = st.inp==='white' ? HALF_N0 : st.inp==='sine' ? A*A/4 : A*A*TB;
      /* The zero line is the lower edge here, so Axes would set the name of f
         a full tick row lower than it needs; 50 label units still clears the
         tick numbers (1.36 is the label scale of the lecture mode and phone). */
      const LB = (ph || APP.state.display==='projector') ? 1.36 : 1;
      const a3 = P.Axes({w:W,h:ph?220:gh(150),xr:[-FMAX,FMAX],yr:[0,1.2*ref],xnameDrop:50*LB,
        xlabel:'f\\ (\\text{kHz})',ylabel:'S(f)\\ (\\text{V}^2/\\text{kHz})',pad:{l:ph?48:64,r:ph?16:24,t:22,b:40},
        xtarget:ph?4:12,ytarget:ph?3:2});
      const hs = f => ref*H2(f,B);
      if(st.inp==='sine'){
        [-F0,F0].forEach(f=>a3.impulse(f, ref, {color:P.COL.in,opacity:0.45,label:false}));
        const wY = ref*H2(F0,B);
        if(wY > 1e-3) [-F0,F0].forEach(f=>a3.impulse(f, wY, {color:P.COL.out,label:false}));
        a3.curve(hs,{color:P.COL.h,width:1.8,dash:'7 5',n:600});
        /* the measured weight: the periodogram summed over the bins of the peak */
        const k0 = Math.round(F0/WDF);
        let wm = 0; for(let k=k0-3;k<=k0+3;k++) wm += Sm[k]*WDF;
        [-F0,F0].forEach(f=>a3.point(f, wm, {color:P.COL.mid, r:5, ring:P.COL.plate}));
      } else {
        a3.curve(SX,{color:P.COL.in,width:1.8,dash:'3 4',n:600});
        a3.curve(f=>SX(f)*H2(f,B),{color:P.COL.out,width:2.6,n:900});
        const spts = [];
        for(let k=-KS;k<=KS;k++) spts.push([k*WDF, Sm[Math.abs(k)]]);
        a3.poly(spts,{color:P.COL.mid,width:1.7});
        a3.curve(hs,{color:P.COL.h,width:1.6,dash:'7 5',n:900});
      }

      const hLab = st.inp==='white' ? '\\tfrac{N_0}{2}|H(f)|^2' : st.inp==='sine' ? '\\tfrac{A^2}{4}|H(f)|^2' : 'A^2T_b|H(f)|^2';
      const lg1 = `${L('in','x(t)')}${L('out','y(t)')}`;
      const lg2 = `${L('out','R_Y(\\tau)')}${L('mid','\\hat{R}_Y(\\tau)',true)}`;
      const lg3 = `${L('in','S_X(f)',st.inp!=='sine')}${L('h',hLab,true)}${L('out','S_Y(f)')}${L('mid','\\hat{S}_Y(f)',false,st.inp==='sine')}`;
      const wrap = (ax, lg) => ph ? `<div class="plot-wrap">${ax.svg()}</div>${legendRow(lg)}`
        : `<div class="plot-wrap">${ax.svg()}<div class="legend in-plot lg-at-tr">${lg}</div></div>`;
      const cell = h => `<div style="flex:1 1 0;min-width:0">${h}</div>`;
      root.querySelector('.plots').innerHTML = ph ? wrap(a1,lg1) + wrap(a2,lg2) + wrap(a3,lg3)
        : `<div style="display:flex;gap:14px;align-items:flex-start">${cell(wrap(a1,lg1))}${cell(wrap(a2,lg2))}</div>` + wrap(a3,lg3);

      /* the input at the top of the column */
      const eqIn = st.inp==='white'
        ? `\\begin{aligned}R_X(\\tau)&=\\tfrac{N_0}{2}\\,\\delta(\\tau)\\\\ S_X(f)&=\\tfrac{N_0}{2}=1\\ \\text{V}^2/\\text{kHz}\\end{aligned}`
        : st.inp==='sine'
        ? `\\begin{aligned}R_X(\\tau)&=\\tfrac{A^2}{2}\\cos(2\\pi f_0\\tau),\\quad A=1\\ \\text{V},\\ f_0=1\\ \\text{kHz}\\\\ S_X(f)&=\\tfrac{A^2}{4}\\big[\\delta(f-f_0)+\\delta(f+f_0)\\big]\\end{aligned}`
        : `\\begin{aligned}R_X(\\tau)&=A^2\\big(1-|\\tau|/T_b\\big),\\quad |\\tau|<T_b\\\\ S_X(f)&=A^2T_b\\operatorname{sinc}^2(fT_b),\\quad \\operatorname{sinc}x=\\tfrac{\\sin\\pi x}{\\pi x}\\end{aligned}`;
      root.querySelector('.lab-eq').innerHTML = T(eqIn, true);

      const u = s => T(s,false);
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Theory $P_Y$</dt><dd>${fmt(th.Py,3)} ${u('\\text{V}^2')}</dd></div>
        <div><dt>Measured $P_Y$</dt><dd class="${Math.abs(Pm-th.Py)<=0.05*Math.max(th.Py,0.01)?'okv':''}">${fmt(Pm,3)} ${u('\\text{V}^2')}</dd></div>
        <div><dt>Mean $\\mu_Y$</dt><dd>${fmt(Math.abs(mu)<5e-4?0:mu,3)} ${u('\\text{V}')}</dd></div>`);

      /* the computed output power, with the current numbers in it */
      const b2 = B.toFixed(2);
      let eqP;
      if(st.inp==='white') eqP = st.filt==='rc'
        ? `P_Y=N_0B_{\\mathrm{neq}}=\\tfrac{N_0}{2}\\,\\pi f_{3\\mathrm{dB}}=\\pi\\times${b2}=${fmt(th.Py,3)}\\ \\text{V}^2`
        : `P_Y=N_0B=2\\times${b2}=${fmt(th.Py,3)}\\ \\text{V}^2`;
      else if(st.inp==='sine') eqP = st.filt==='rc'
        ? `P_Y=\\tfrac{A^2}{2}|H(f_0)|^2=\\dfrac{0.5}{1+(1/${b2})^2}=${fmt(th.Py,3)}\\ \\text{V}^2`
        : `P_Y=\\tfrac{A^2}{2}|H(f_0)|^2=0.5\\times${F0<=B?1:0}=${fmt(th.Py,3)}\\ \\text{V}^2`;
      else eqP = `P_Y=\\int_{-\\infty}^{\\infty}A^2T_b\\operatorname{sinc}^2(fT_b)\\,|H(f)|^2\\,df=${fmt(th.Py,3)}\\ \\text{V}^2`;

      let kind, head, text;
      if(st.inp==='white' && st.filt==='rc'){
        kind='warn'; head='Wider than the 3 dB width';
        text=`The RC filter passes more noise than its 3 dB width suggests: $B_{\\mathrm{neq}}=\\tfrac{\\pi}{2}f_{3\\mathrm{dB}}$.`;
      } else if(st.inp==='white'){
        kind='ok'; head='Ideal filter';
        text=`Here $B_{\\mathrm{neq}}=B$, so the output power grows in proportion to $B$. The output samples stay Gaussian.`;
      } else if(st.inp==='sine' && st.filt==='ideal'){
        kind = F0<=B ? 'ok' : 'warn';
        head = F0<=B ? 'Sinusoid passed' : 'Sinusoid removed';
        text = F0<=B ? `With $f_0\\le B$ the ideal filter passes the sinusoid unchanged, so $P_Y=P_X=0.5\\ \\text{V}^2$.`
                     : `The ideal filter cuts the sinusoid completely when $f_0>B$. Both impulses of $S_Y$ vanish.`;
      } else if(st.inp==='sine'){
        kind='warn'; head='One frequency';
        text=`Only $|H(f_0)|$ matters: the filter scales the sinusoid and shifts its phase. $R_Y$ stays a cosine at $f_0$.`;
      } else if(B < 1/TB){
        kind='warn'; head='Smoothed bits';
        text=`With $T_b=0.5\\ \\text{ms}$ the main lobe of $S_X$ ends at $1/T_b=2\\ \\text{kHz}$. The filter is narrower, so the bit edges are rounded.`;
      } else {
        kind='ok'; head='Main lobe passed';
        text=`With $T_b=0.5\\ \\text{ms}$ the main lobe of $S_X$ ends at $1/T_b=2\\ \\text{kHz}$. The filter passes it, so $P_Y$ is close to $P_X=A^2=1\\ \\text{V}^2$.`;
      }
      root.querySelector('.derive').innerHTML = M(`
        <div class="eq"><span class="eq-label">Output power</span>${T(eqP,true)}</div>`);
      root.querySelector('.verdict').innerHTML = M(`
        <div class="note ${kind}"><span class="note-h">${head}</span>${text}</div>`);

      root.querySelector('[data-v=bw]').value = st.bw;
      root.querySelector('[data-out=bw]').textContent = b2;
      root.querySelector('[data-out=phase]').textContent = String(nrec);
      root.querySelectorAll('[data-seg=inp]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.val===st.inp)));
      root.querySelectorAll('[data-seg=filt]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.val===st.filt)));
    }

    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:44px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div>
            <div class="verdict"></div></div>
          <div class="col stack">
            <div class="lab-eq eq key" style="padding:14px 20px;margin:0"></div>
            <div class="ctrls" style="margin:0">
              <div class="ctrl" style="grid-column:1/-1"><label>Input $X(t)$ <span class="seg">
                <button data-seg="inp" data-val="white">white noise</button>
                <button data-seg="inp" data-val="sine">sinusoid</button>
                <button data-seg="inp" data-val="binary">binary wave</button></span></label></div>
              <div class="ctrl"><label>Filter <span class="seg">
                <button data-seg="filt" data-val="rc">RC</button>
                <button data-seg="filt" data-val="ideal">ideal</button></span></label></div>
              <div class="ctrl"><label>$f_{3\\mathrm{dB}}$ or $B$ in kHz <span class="val" data-out="bw">1.00</span></label>
                <input type="range" data-v="bw" min="1" max="20" step="1" value="4"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Records averaged, 64 ms each <span class="val" data-out="phase">${NREC}</span></label>
                <div class="ctrl-run"><input type="range" data-v="phase" min="1" max="${NREC}" step="1" value="${NREC}">${LABS.KIT.runbar()}</div></div>
            </div>
            <dl class="readout ro" style="margin:0"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{
        const b=e.target.closest('[data-seg]'); if(!b) return;
        st[b.dataset.seg]=b.dataset.val; draw(root); });
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', max:NREC, ms:140,
        get:()=>st.phase, set:v=>{ st.phase=v; }, redraw:()=>draw(root) });
    }};
  })();

  return { T: T_ };
})());
