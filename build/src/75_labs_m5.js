/* ==========================================================================
   Module 5 laboratories.

   X · The IQ modulator (section 5.1) — bits become a point, the point becomes
       two levels I and Q, and the two levels become a burst of carrier, one
       symbol a press. A point can also be dragged: its distance is the
       amplitude of the burst and its angle is the phase.
   Y · Bit errors in the noise cloud (section 5.2) — a PSK or QAM cloud grows
       batch by batch. Wrong decisions turn red, sized by the bits they cost,
       with Gray or with natural labels, and with a carrier phase error.
   H · Error probability against signal-to-noise ratio (section 5.3) — the
       closed form of every scheme against a seeded simulation, with the
       exact forms of square QAM and the scatter of the latest batch.
   Z · Orthogonal signals as M grows (section 5.4) — the tones of one symbol,
       the bank of correlator or envelope outputs, and the error curves
       moving left as M doubles, towards a limit of -1.6 dB.
   BW · The bandwidth-power plane (section 5.5) — every family on the plane
       of bits per hertz against energy per bit, and a link that picks its
       scheme from the channel as the signal-to-noise ratio changes.

   Formulas and measurements are computed by different routes: the formulas
   from distances and Q, the measurements from noise, a nearest-point
   decision and a count. Every Monte Carlo run keeps one generator per mark
   and continues it from batch to batch, so twenty-five batches of n draw
   exactly the sequence one run of 25n would (labwalk.js checks it).

   Every card a laboratory draws follows the slide card language: a computed
   equation takes a coral tab naming what it computes, a note keeps its
   kind's tab and icon. `core` on each laboratory exposes the numbers it
   shows, so verify/verify_labs_m5.py can compare them with SciPy.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F, GH = LABS.KIT.GH;
  const P = PLOT;
  const N = (v,d=3) => fmt(v,d);

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
  const dB = v => 10*Math.log10(v);
  const lin = d => Math.pow(10, d/10);

  /* ---- numbers ----------------------------------------------------------- */
  /* mulberry32 with its state in the open, so a batch can be replayed from
     the state it started in; a standard normal pair from Box-Muller with
     both outputs used. One generator drawn batch after batch is the same
     stream as one generator drawn in a single run. */
  const gen = seed => ({ a: seed >>> 0, spare: null });
  function uni(g){ g.a = (g.a + 0x6D2B79F5) >>> 0; let t = Math.imul(g.a ^ (g.a >>> 15), 1 | g.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function gauss(g){ if(g.spare !== null){ const s = g.spare; g.spare = null; return s; }
    const u = Math.max(1e-12, uni(g)), v = uni(g), m = Math.sqrt(-2*Math.log(u));
    g.spare = m*Math.sin(2*Math.PI*v); return m*Math.cos(2*Math.PI*v); }
  const snap = g => ({ a:g.a, spare:g.spare });
  /* erfc to a relative error below 1.2e-7 (a Chebyshev fit), as in Module 4 */
  function erfc(x){
    const z = Math.abs(x), t = 1/(1+0.5*z);
    const r = t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+
      t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
    return x >= 0 ? r : 2-r;
  }
  const Q = x => 0.5*erfc(x/Math.SQRT2);
  /* the x with Q(x) = p, by bisection, for 0 < p < 1/2 */
  function Qinv(p){ let lo = 0, hi = 40; for(let i=0;i<80;i++){ const m = (lo+hi)/2; if(Q(m) > p) lo = m; else hi = m; } return (lo+hi)/2; }
  function pTeX(v){
    if(!(v > 0)) return '0';
    if(v >= 0.01) return fmt(v,4);
    let e = Math.floor(Math.log10(v)), m = v/Math.pow(10,e);
    m = Math.round(m*100)/100; if(m >= 10){ m /= 10; e++; }
    return `${m.toFixed(2)}\\times10^{${e}}`;
  }
  const pH = v => (!(v > 0) || v >= 0.01) ? fmt(v, 4) : T(pTeX(v), false);
  const gray = i => i ^ (i >> 1);
  function igray(v){ let i = 0; for(let t = v; t; t >>= 1) i ^= t; return i; }
  const bin = (v,k) => v.toString(2).padStart(k,'0');
  const pop = v => { let c = 0; while(v){ c += v & 1; v >>= 1; } return c; };

  /* ---- constellations ------------------------------------------------------ */
  /* Every set is scaled to unit average symbol energy, so a change of set
     changes the geometry and never the power. `g` is the Gray label of each
     point and `n` its natural (counting) label. */
  function pskSet(Mn, off){
    const pts = [], g = [], n = [];
    for(let i=0;i<Mn;i++){ const a = off + 2*Math.PI*i/Mn; pts.push([Math.cos(a), Math.sin(a)]); g.push(gray(i)); n.push(i); }
    return { kind:'psk', M:Mn, k:Math.log2(Mn), off, dim:2, pts, g, n };
  }
  function pamSet(Mn){
    const c = 1/Math.sqrt((Mn*Mn-1)/3), pts = [], g = [], n = [];
    for(let i=0;i<Mn;i++){ pts.push([(2*i-(Mn-1))*c, 0]); g.push(gray(i)); n.push(i); }
    return { kind:'pam', M:Mn, k:Math.log2(Mn), c, dim:1, pts, g, n };
  }
  function qamSet(Mn){
    const s = Math.round(Math.sqrt(Mn)), h = Math.log2(s), c = 1/Math.sqrt(2*(Mn-1)/3);
    const pts = [], g = [], n = [];
    for(let i=0;i<s;i++) for(let j=0;j<s;j++){
      pts.push([(2*i-(s-1))*c, (2*j-(s-1))*c]); g.push((gray(i) << h) | gray(j)); n.push(j*s + i); }
    return { kind:'qam', M:Mn, k:Math.log2(Mn), s, c, dim:2, pts, g, n };
  }
  const orthSet = () => ({ kind:'orth', M:2, k:1, dim:2, pts:[[1,0],[0,1]], g:[0,1], n:[0,1] });
  const lvl = (u, Lv) => Math.max(0, Math.min(Lv-1, Math.round((u + Lv - 1)/2)));
  /* The nearest point, found from the shape of the set rather than by
     searching it: an angle for PSK, one rounding a coordinate for PAM and
     square QAM. The search is kept for anything else. */
  function detect(S, x, y){
    if(S.kind === 'psk'){ const w = 2*Math.PI/S.M; const k = Math.round((Math.atan2(y,x) - S.off)/w); return ((k % S.M) + S.M) % S.M; }
    if(S.kind === 'pam') return lvl(x/S.c, S.M);
    if(S.kind === 'qam') return lvl(x/S.c, S.s)*S.s + lvl(y/S.c, S.s);
    if(S.kind === 'orth') return x >= y ? 0 : 1;
    let best = 0, bd = Infinity;
    S.pts.forEach((p,k)=>{ const d = (x-p[0])**2 + (y-p[1])**2; if(d < bd){ bd = d; best = k; } });
    return best;
  }
  /* minimum distance and the average number of points at it (N_min) */
  function geometry(S){
    const pts = S.pts, Mn = pts.length;
    let dmin = Infinity;
    for(let i=0;i<Mn;i++) for(let j=i+1;j<Mn;j++) dmin = Math.min(dmin, Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]));
    let near = 0;
    for(let i=0;i<Mn;i++) for(let j=0;j<Mn;j++) if(i !== j && Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]) < dmin*(1+1e-9)) near++;
    const Eavg = pts.reduce((s,p)=>s+p[0]*p[0]+p[1]*p[1],0)/Mn;
    return { dmin, Nmin:near/Mn, Eavg };
  }

  /* ---- drawing helpers ------------------------------------------------------ */
  /* One unit is the same length on both axes (as Module 4): the first pass
     measures the data area, the second widens the longer range. */
  function eqAxes(o, lim){
    const pr = P.Axes(Object.assign({}, o, {xr:[-lim,lim], yr:[-lim,lim]}));
    const kx = (pr.x1-pr.x0)/(2*lim), ky = (pr.y0-pr.y1)/(2*lim), k = Math.min(kx,ky);
    const hx = (pr.x1-pr.x0)/k/2, hy = (pr.y0-pr.y1)/k/2;
    return P.Axes(Object.assign({}, o, {xr:[-hx,hx], yr:[-hy,hy]}));
  }
  /* The Voronoi cell of point i inside a box (Sutherland-Hodgman), and the
     points sharing a face with it, as in Module 4. */
  function cellOf(pts, i, box){
    let v = [[box[0],box[2]],[box[1],box[2]],[box[1],box[3]],[box[0],box[3]]], tag = [-1,-1,-1,-1];
    const [xi, yi] = pts[i];
    for(let j=0;j<pts.length;j++){
      if(j === i) continue;
      const [xj, yj] = pts[j];
      const ax = 2*(xj-xi), ay = 2*(yj-yi), b = xj*xj+yj*yj-xi*xi-yi*yi;
      if(Math.abs(ax)+Math.abs(ay) < 1e-12) continue;
      const f = p => ax*p[0] + ay*p[1] - b;
      const ov = [], ot = [];
      for(let k=0;k<v.length;k++){
        const A = v[k], B = v[(k+1)%v.length], fa = f(A), fb = f(B);
        const cut = () => { const s = fa/(fa-fb); return [A[0]+s*(B[0]-A[0]), A[1]+s*(B[1]-A[1])]; };
        if(fa <= 0){ ov.push(A); ot.push(tag[k]); if(fb > 0){ ov.push(cut()); ot.push(j); } }
        else if(fb <= 0){ ov.push(cut()); ot.push(tag[k]); }
      }
      v = ov; tag = ot;
      if(v.length < 3) break;
    }
    const nb = new Set();
    for(let k=0;k<v.length;k++){
      if(tag[k] < 0) continue;
      const A = v[k], B = v[(k+1)%v.length];
      if(Math.hypot(B[0]-A[0], B[1]-A[1]) > 1e-7) nb.add(tag[k]);
    }
    return { poly:v, nb };
  }
  /* Neighbouring regions never share a colour; red is kept for errors. */
  function colouring(pts){
    const R = 1000*(1+Math.max(...pts.map(p=>Math.hypot(p[0],p[1]))));
    const nbs = pts.map((_,i)=>cellOf(pts, i, [-R,R,-R,R]).nb), c = [];
    for(let i=0;i<pts.length;i++){
      const used = new Set([...nbs[i]].filter(j=>j<i).map(j=>c[j]));
      let k = 0; while(used.has(k)) k++;
      c.push(k % 4);
    }
    return c;
  }
  const SYM = () => [P.COL.in, P.COL.h, P.COL.mid, P.COL.out];
  const DEC = () => [P.COL.dec.in, P.COL.dec.h, P.COL.dec.mid, P.COL.dec.out];
  const pathOf = (a, poly) => 'M' + poly.map(p=>a.sx(p[0]).toFixed(2)+','+a.sy(p[1]).toFixed(2)).join('L') + 'Z';
  function regions(a, pts, cols){
    const box = [a.o.xr[0], a.o.xr[1], a.o.yr[0], a.o.yr[1]], dec = DEC();
    pts.forEach((_,i)=>{
      const c = cellOf(pts, i, box);
      if(c.poly.length < 3) return;
      a.under(`<path d="${pathOf(a, c.poly)}" fill="${dec[cols[i]]}" stroke="${P.COL.ruleStrong}" stroke-width="1"/>`);
    });
  }
  /* A received point in the cloud. Its ring is the noise tone as well, so
     the cloud reads as noise and never as a signal. */
  const cloudPt = (a, x, y, r) => a.raw(`<circle cx="${a.sx(x).toFixed(1)}" cy="${a.sy(y).toFixed(1)}" r="${r}" fill="${P.COL.noise}" stroke="${P.COL.noise}" stroke-width="0.6"/>`);
  const nest = (svg, W, yy, h) => svg.replace('<svg ', `<svg x="0" y="${yy}" width="${W}" height="${h}" `);
  /* Time ticks numbered at the foot of a panel whose trace crosses zero, so
     no number sits on the trace (as Laboratory U of Module 4). */
  /* `clear` keeps the numbers out of the strip at the right end of the axis
     where a name set on the tick row sits (compactX below). */
  function footTicks(ax, ticks, ylo, label, clear){
    const edge = ax.x1 - (clear || 0)*P.labelScale();
    ticks.forEach(v=>{
      if(clear && ax.sx(v) >= edge) return;      /* the axis name holds that end */
      ax.raw(`<line x1="${ax.sx(v).toFixed(2)}" y1="${ax.y0.toFixed(2)}" x2="${ax.sx(v).toFixed(2)}" y2="${(ax.y0+5).toFixed(2)}" stroke="${P.COL.axis}" stroke-width="1.2"/>`);
      if(label(v) !== '' && ax.sx(v) < edge) ax.note(v, ylo, label(v), {fs:13.5, color:P.COL.muted, anchor:'middle', dy:20});
    });
  }
  /* A small panel in a stack sets its axis name on the row of its tick
     numbers, at the right end, instead of a line below them: the line below
     costs a panel about a hundred units in lecture mode, which is most of a
     small panel's data area. The numbers leave that end free. */
  const compactX = () => ({ xnameDrop: 26*P.labelScale() });
  /* The play bar under the plots: the one slider a laboratory animates, and
     its transport. */
  const playbar = (label, key, max, val) => `
    <div class="ctrls one" style="padding:10px 20px"><div class="ctrl"><div class="ctrl-run">
      <label style="flex:0 0 auto"><span>${label}</span><span class="val" data-out="${key}">${val}</span></label>
      <input type="range" data-v="${key}" min="0" max="${max}" step="1" value="${val}">
      ${LABS.KIT.runbar()}</div></div></div>`;
  /* the three forms of the log axis of an error rate: the value plotted is
     log10(P) - 1, so that P = 1 never sits on the zero line and pulls the
     tick numbers of the other axis up to it */
  const lg1 = v => Math.log10(Math.max(1e-12, v)) - 1;
  const decTicks = (lo, hi) => { const t = []; for(let e = Math.ceil(lo+1); e <= Math.floor(hi+1); e++) t.push(e-1); return t; };

  /* =======================================================================
     X · THE IQ MODULATOR
     s(t) = I(t) cos(2 pi fc t) - Q(t) sin(2 pi fc t). Twelve bits are cut
     into symbols of k bits; each symbol is a point (I, Q) with a Gray label.
     BFSK is written as a phase that turns by a quarter circle each bit,
     which puts its two tones 1/(2T) apart.
     ======================================================================= */
  const X = (() => {
    const SCH = { bask:{label:'BASK',k:1}, bpsk:{label:'BPSK',k:1}, bfsk:{label:'BFSK',k:1},
                  qpsk:{label:'QPSK',k:2}, psk8:{label:'8-PSK',k:3}, qam16:{label:'16-QAM',k:4} };
    const ROW1 = ['bask','bpsk','bfsk'], ROW2 = ['qpsk','psk8','qam16'];
    const NB = 12, DEF = [0,0,0,1,1,1,1,0,1,0,0,1], TWMS = 900;
    let st = { sch:'qpsk', src:'bits', rate:'sym', fc:2, phase:6 };
    let bits = DEF.slice(), free = [-0.5, 0.75], tw = 1, raf = 0, drag = false, view = null, nNew = 0;

    /* the point of each label value v, at unit average energy */
    function table(key){
      const k = SCH[key].k, Mn = 1 << k, t = new Array(Mn);
      if(key === 'bfsk') return null;
      if(key === 'bask'){ t[0] = [0,0]; t[1] = [Math.SQRT2, 0]; return t; }
      if(key === 'qam16'){ const s = 1/Math.sqrt(10);
        for(let v=0; v<16; v++) t[v] = [(2*igray(v >> 2)-3)*s, (2*igray(v & 3)-3)*s];
        return t; }
      const off = key === 'qpsk' ? Math.PI/4 : 0;
      for(let i=0;i<Mn;i++){ const a = off + 2*Math.PI*i/Mn; t[gray(i)] = [Math.cos(a), Math.sin(a)]; }
      return t;
    }
    function symbols(key, b){
      const k = SCH[key].k, ns = NB/k, tb = table(key), out = [];
      let phi = 0;
      for(let j=0;j<ns;j++){
        let v = 0; for(let q=0;q<k;q++) v = (v << 1) | b[j*k+q];
        if(tb) out.push({ v, p:tb[v] });
        else { const dir = v ? 1 : -1; out.push({ v, dir, phi0:phi }); phi += dir*Math.PI/2; }
      }
      return out;
    }
    const nsym = () => NB/SCH[st.sch].k;
    /* the level pair at time t, in units of the axis */
    function iqAt(sy, Ts, t){
      if(st.src === 'free') return free;
      const j = Math.min(sy.length-1, Math.max(0, Math.floor(t/Ts)));
      const s = sy[j];
      if(s.p) return s.p;
      const phi = s.phi0 + s.dir*Math.PI/2*clamp((t - j*Ts)/Ts, 0, 1);
      return [Math.cos(phi), Math.sin(phi)];
    }

    function stopTween(){ if(raf) cancelAnimationFrame(raf); raf = 0; tw = 1; }
    function startTween(root){
      if(raf) cancelAnimationFrame(raf);
      raf = 0;
      if(REDUCED()){ tw = 1; return; }
      tw = 0; let t0 = 0;
      const tick = now => {
        if(!root.isConnected){ raf = 0; return; }
        if(!t0) t0 = now;
        tw = Math.min(1, (now - t0)/TWMS);
        draw(root);
        raf = tw < 1 ? requestAnimationFrame(tick) : 0;
      };
      raf = requestAnimationFrame(tick);
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const S = SCH[st.sch], k = S.k, ns = nsym(), tb = table(st.sch);
      const sy = symbols(st.sch, bits);
      const Ts = st.rate === 'bit' ? k : 1, len = ns*Ts, fcu = st.fc;
      const freeMode = st.src === 'free';
      st.phase = Math.min(st.phase, ns);
      const c = freeMode ? ns-1 : st.phase - 1;                   /* the symbol being built */
      const w = freeMode ? 1 : tw;
      const bf = st.sch === 'bfsk';
      const u1 = bf ? 1 : clamp(w/0.3, 0, 1);
      const u2 = bf ? clamp((w-0.3)/0.7, 0, 1) : clamp((w-0.3)/0.3, 0, 1);
      const u3 = bf ? u2 : clamp((w-0.6)/0.4, 0, 1);
      const tIQ = freeMode ? len : c < 0 ? 0 : (c + u2)*Ts;
      const tS  = freeMode ? len : c < 0 ? 0 : (c + u3)*Ts;

      /* the point now, and where it came from */
      let pos = null;
      if(freeMode) pos = free;
      else if(c >= 0){
        if(bf){ const s = sy[c], a = s.phi0 + s.dir*Math.PI/2*u2; pos = [Math.cos(a), Math.sin(a)]; }
        else { const prev = c > 0 ? sy[c-1].p : [0,0], cur = sy[c].p; pos = [prev[0]+(cur[0]-prev[0])*u1, prev[1]+(cur[1]-prev[1])*u1]; }
      }

      /* ---- the two time panels ---- */
      const W1 = ph ? 300 : 560, hA = ph ? 170 : gh(165), hB = ph ? 190 : gh(205);
      const PAD = { l:ph?40:50, r:ph?12:18 };
      const ticks = Array.from({length:ns+1}, (_,j)=>j*Ts);
      const a1 = P.Axes({w:W1,h:hA,xr:[0,len],yr:[-1.75,1.75],ylabel:'I(t),\\;Q(t)',
        pad:{l:PAD.l,r:PAD.r,t:24,b:12},ytarget:3,xticksOverride:ticks,xtickfmt:()=>''});
      const a2 = P.Axes({w:W1,h:hB,xr:[0,len],yr:[-1.75,1.75],xlabel:st.rate === 'bit' ? 't/T_b' : 't/T',ylabel:'s(t)',
        pad:{l:PAD.l,r:PAD.r,t:24,b:40},ytarget:3,xticksOverride:ticks,xtickfmt:()=>''});
      const step = Math.max(1, Math.round(ns/6));
      footTicks(a2, ticks, -1.75, v => (Math.round(v/Ts) % step === 0) ? fmt(v,2) : '');
      for(let j=1;j<ns;j++){ a1.vline(j*Ts,{color:P.COL.rule,dash:'2 4',opacity:1}); a2.vline(j*Ts,{color:P.COL.rule,dash:'2 4',opacity:1}); }
      /* I and Q, drawn up to tIQ */
      const nIQ = Math.max(2, Math.ceil(tIQ/len*600));
      const I = [], Qv = [];
      if(tIQ > 0) for(let i=0;i<=nIQ;i++){ const t = Math.min(tIQ, len-1e-9)*i/nIQ; const q = iqAt(sy, Ts, t); I.push([t, q[0]]); Qv.push([t, q[1]]); }
      if(I.length > 1){
        /* a staircase is drawn with its steps upright, not as slopes */
        const stairs = arr => bf || freeMode ? arr : arr.reduce((o,p,i)=>{ if(i && p[1] !== arr[i-1][1]) o.push([p[0], arr[i-1][1]]); o.push(p); return o; }, []);
        a1.poly(stairs(I),{color:P.COL.mid,width:2.4});
        a1.poly(stairs(Qv),{color:P.COL.mid,width:2.2,dash:'7 5'});
      }
      /* the burst, drawn up to tS, and its envelope */
      if(freeMode) a2.curve(t=>Math.cos(2*Math.PI*fcu*t),{color:P.COL.muted,width:1.2,dash:'4 4',n:Math.max(400, Math.ceil(fcu*len*24))});
      if(tS > 0){
        const n = Math.max(60, Math.ceil(fcu*tS*30)), sp = [], ep = [], em = [];
        for(let i=0;i<=n;i++){ const t = Math.min(tS, len-1e-9)*i/n, q = iqAt(sy, Ts, t);
          sp.push([t, q[0]*Math.cos(2*Math.PI*fcu*t) - q[1]*Math.sin(2*Math.PI*fcu*t)]);
          const A = Math.hypot(q[0], q[1]); ep.push([t, A]); em.push([t, -A]); }
        const flat = arr => arr.reduce((o,p,i)=>{ if(i && Math.abs(p[1]-arr[i-1][1]) > 1e-9 && !bf) o.push([p[0], arr[i-1][1]]); o.push(p); return o; }, []);
        a2.poly(flat(ep),{color:P.COL.in,width:1.2,dash:'5 4'});
        a2.poly(flat(em),{color:P.COL.in,width:1.2,dash:'5 4'});
        a2.poly(sp,{color:P.COL.in,width:1.8});
      }
      if(!freeMode && c >= 0 && w < 1){ a1.vline(tIQ,{color:P.COL.muted,dash:'2 3',opacity:0.9}); a2.vline(tS,{color:P.COL.muted,dash:'2 3',opacity:0.9}); }

      /* ---- the plane ---- */
      const Wc = ph ? 300 : 380, hC = ph ? 300 : hA + hB;
      /* 16-QAM puts its labels where the unit ticks would be read, so it drops them */
      const noT = st.sch === 'qam16' ? {xtickfmt:()=>'', ytickfmt:()=>''} : {};
      const ac = eqAxes(Object.assign({w:Wc,h:hC,xlabel:'I',ylabel:'Q',pad:{l:ph?38:46,r:ph?12:16,t:26,b:42},xtarget:4,ytarget:4}, noT), 1.62);
      ac.raw(`<circle cx="${ac.sx(0).toFixed(2)}" cy="${ac.sy(0).toFixed(2)}" r="${(ac.sx(1)-ac.sx(0)).toFixed(2)}" fill="none" stroke="${P.COL.rule}" stroke-width="1.2" stroke-dasharray="3 4"/>`);
      if(tb){
        tb.forEach((p,v)=>{
          ac.point(p[0], p[1], {color:P.COL.ink, r:4.2, ring:P.COL.plate, ringw:1.4});
          const r = Math.hypot(p[0],p[1]);
          const lx = st.sch === 'qam16' ? p[0] : r > 0.05 ? p[0]*(1+0.3/r) : -0.24;
          const ly = st.sch === 'qam16' ? p[1]-0.2 : r > 0.05 ? p[1]*(1+0.3/r) : -0.26;
          ac.note(lx, ly, `\\mathtt{${bin(v,k)}}`, {tex:true, fs:13.5, color:P.COL.muted, anchor:'middle', dy:5});
        });
      }
      /* the trail of points already sent */
      if(!freeMode && c >= 0){
        if(bf){
          const tr = [];
          for(let j=0;j<=c;j++){ const s = sy[j], to = j < c ? 1 : u2;
            for(let q=0;q<=12;q++){ const a = s.phi0 + s.dir*Math.PI/2*to*q/12; tr.push([Math.cos(a), Math.sin(a)]); } }
          if(tr.length > 1) ac.poly(tr,{color:P.COL.mid,width:2,dash:'3 3'});
        } else {
          const tr = [[0,0]]; for(let j=0;j<c;j++) tr.push(sy[j].p); tr.push(pos);
          ac.poly(tr,{color:P.COL.mid,width:1.4,dash:'3 4'});
        }
      }
      if(pos){
        const A = Math.hypot(pos[0], pos[1]), th = Math.atan2(pos[1], pos[0]);
        if(A > 0.02){
          ac.poly([[0,0], pos],{color:P.COL.in,width:2.6});
          const arc = []; const n = 24;
          for(let q=0;q<=n;q++){ const a = th*q/n; arc.push([0.24*Math.cos(a), 0.24*Math.sin(a)]); }
          if(Math.abs(th) > 0.05) ac.poly(arc,{color:P.COL.coral,width:1.8});
        }
        ac.point(pos[0], pos[1], {color:P.COL.in, r:freeMode ? 9 : 7.5, ring:P.COL.coral, ringw:2.2});
      }
      view = { xr:ac.o.xr, yr:ac.o.yr, x0:ac.x0, x1:ac.x1, y0:ac.y0, y1:ac.y1 };

      /* ---- the bits, one chip each, over the time axis they drive ---- */
      const chips = bits.map((b,i)=>{
        const j = Math.floor(i/k), on = !freeMode && j === c, done = freeMode || j <= c;
        const bg = j % 2 ? 'var(--paper-3)' : 'var(--paper-2)';
        return `<button data-bit="${i}" aria-label="bit ${i+1}" style="flex:1 1 0;min-width:0;margin:0 1px;padding:calc(3px * var(--ts)) 0;`
          + `font:600 calc(17px * var(--ts))/1.25 var(--mono);border:1px solid ${on ? 'var(--coral)' : 'var(--rule-strong)'};`
          + `border-radius:var(--radius);background:${bg};color:${on ? 'var(--coral)' : 'var(--ink)'};opacity:${done ? 1 : 0.45};cursor:pointer">${b}</button>`;
      }).join('');
      const frac = W1/(W1+Wc);
      const chipRow = `<div style="display:flex;gap:14px;visibility:${freeMode ? 'hidden' : 'visible'}"><div style="flex:0 0 ${ph ? '100%' : `calc((100% - 14px)*${frac.toFixed(4)})`};min-width:0">`
        + `<div style="display:flex;margin-left:${(100*PAD.l/W1).toFixed(2)}%;width:${(100*(W1-PAD.l-PAD.r)/W1).toFixed(2)}%">${chips}</div></div></div>`;
      const lgA = `${L('mid','I(t)')}${L('mid','Q(t)',true)}`;
      const lgB = freeMode ? `${L('in','s(t)')}${L('slate','\\cos 2\\pi f_c t',true)}` : `${L('in','s(t)')}${L('in','\\text{envelope}',true)}`;
      if(ph){
        root.querySelector('.plots').innerHTML = chipRow
          + `<div class="plot-wrap">${a1.svg()}</div>${legendRow(lgA)}<div class="plot-wrap">${a2.svg()}</div>${legendRow(lgB)}`
          + `<div class="plot-wrap" data-plane style="touch-action:pan-y">${ac.svg()}</div>`;
      } else {
        const both = `<svg viewBox="0 0 ${W1} ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${nest(a1.svg(),W1,0,hA)}${nest(a2.svg(),W1,hA,hB)}</svg>`;
        root.querySelector('.plots').innerHTML = chipRow
          + `<div style="display:flex;gap:14px;align-items:flex-start">`
          + `<div class="plot-wrap" style="flex:0 0 calc((100% - 14px)*${frac.toFixed(4)});min-width:0">${both}`
          + `<div class="legend in-plot" style="top:2px">${lgA}</div>`
          + `<div class="legend in-plot" style="top:calc(100% * ${(hA/(hA+hB)).toFixed(4)} + 2px)">${lgB}</div></div>`
          + `<div class="plot-wrap" data-plane style="flex:1 1 0;min-width:0;cursor:grab;touch-action:none">${ac.svg()}</div></div>`;
      }

      /* ---- readouts and cards ---- */
      const A = pos ? Math.hypot(pos[0], pos[1]) : NaN;
      const th = pos ? Math.atan2(pos[1], pos[0])*180/Math.PI : NaN;
      const has = !!pos;
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Bits a symbol</dt><dd>${k}</dd></div>
        <div><dt>${st.rate === 'bit' ? 'Symbol time' : 'Bit time'}</dt><dd>${st.rate === 'bit' ? `$${k === 1 ? '' : k}T_b$` : (k === 1 ? '$T$' : `$T/${k}$`)}</dd></div>
        <div><dt>Symbols</dt><dd>${ns}</dd></div>
        <div><dt>Amplitude $A$</dt><dd>${has ? N(A,3) : '…'}</dd></div>
        <div><dt>Phase $\\theta$</dt><dd>${has ? (A > 0.02 ? N(th,1) + '°' : 'none') : '…'}</dd></div>
        <div><dt>Energy $A^2/E_s$</dt><dd>${has ? N(A*A,3) : '…'}</dd></div>`);
      const sg = v => v < 0 ? '-' : '+';
      root.querySelector('.derive:not(.verdict)').innerHTML = M(!has
        ? `<div class="eq"><span class="eq-label">The burst</span>${T('s(t)=I\\cos(2\\pi f_c t)-Q\\sin(2\\pi f_c t)', true)}</div>`
        : bf && !freeMode
        ? `<div class="eq"><span class="eq-label">The burst now</span>${T(`\\begin{aligned}s(t)&=\\cos\\big(2\\pi f_c t+\\phi(t)\\big)\\\\ \\phi&=${N(th,1)}^{\\circ}\\end{aligned}`, true)}</div>`
        : `<div class="eq"><span class="eq-label">The burst now</span>${T(`\\begin{aligned}s(t)&=${N(pos[0],3)}\\cos(2\\pi f_c t)${sg(-pos[1])}${N(Math.abs(pos[1]),3)}\\sin(2\\pi f_c t)\\\\ &=${Math.abs(A-1) < 5e-4 ? '' : N(A,3)}\\cos(2\\pi f_c t${A > 0.02 ? `${sg(th)}${N(Math.abs(th),1)}^{\\circ}` : ''})\\end{aligned}`, true)}</div>`);

      const NOTE = {
        bask:['On-off keying','A 0 puts the point at the origin and switches the carrier off. Only the amplitude carries the bit.'],
        bpsk:['Two opposite points','A new bit moves the point to the other side of the origin. The carrier flips: its phase jumps by $180^\\circ$.'],
        bfsk:['A turning point','The point never rests. It turns a quarter circle each bit, one way for a 1 and the other way for a 0, so the frequency changes.'],
        qpsk:['Phase keying','Every point lies on the unit circle, so the envelope stays flat. Only the angle of the point, the phase of the burst, carries the bits.'],
        psk8:['Phase keying','Every point lies on the unit circle, so the envelope stays flat. Only the angle of the point, the phase of the burst, carries the bits.'],
        qam16:['Amplitude and phase','The points lie at three distances from the origin. The envelope steps up and down, so QAM changes the amplitude and the phase.']
      };
      const [hd, tx] = freeMode ? ['Distance and angle','Drag the point. Its distance from the origin is the amplitude of the burst, and its angle is the shift from the dashed carrier.'] : NOTE[st.sch];
      const rate = st.rate === 'bit' && !freeMode && k > 1 ? ` At a fixed bit rate, ${k} bits a symbol make each symbol ${k} times longer.` : '';
      root.querySelector('.verdict').innerHTML = M(`<div class="note warn"><span class="note-h">${hd}</span>${tx}${rate}</div>`);

      root.querySelector('[data-out=fc]').textContent = String(st.fc);
      root.querySelector('[data-fc-name]').innerHTML = M(st.rate === 'bit' ? 'Carrier cycles a bit, $f_cT_b$' : 'Carrier cycles a symbol, $f_cT$');
      const sl = root.querySelector('[data-v=phase]'); sl.max = String(ns); sl.value = String(st.phase);
      root.querySelector('[data-out=phase]').textContent = String(st.phase);
      root.querySelectorAll('[data-seg]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val === st[b.dataset.seg])));
    }

    /* pointer position in data coordinates of the plane drawn last */
    function toData(root, e){
      const svg = root.querySelector('.plots [data-plane] > svg');
      if(!svg || !view) return null;
      const m = svg.getScreenCTM(); if(!m) return null;
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(m.inverse());
      if(q.x < view.x0 - 6 || q.x > view.x1 + 6 || q.y < view.y1 - 6 || q.y > view.y0 + 6) return null;
      return [view.xr[0] + (q.x-view.x0)/(view.x1-view.x0)*(view.xr[1]-view.xr[0]),
              view.yr[0] + (view.y0-q.y)/(view.y0-view.y1)*(view.yr[1]-view.yr[0])];
    }

    const core = { table, symbols, NB, DEF,
      burst:(I,Qq,fc,t)=>I*Math.cos(2*Math.PI*fc*t) - Qq*Math.sin(2*Math.PI*fc*t) };

    return { core, mount(root){
      const seg = keys => keys.map(kk=>`<button data-seg="sch" data-val="${kk}">${SCH[kk].label}</button>`).join('');
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            ${playbar('Symbols sent','phase',6,6)}
            <div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Scheme</span><span class="seg">${seg(ROW1)}</span></label>
                <label><span></span><span class="seg">${seg(ROW2)}</span></label></div>
              <div class="ctrl"><label><span>Drive</span></label><span class="seg" style="align-self:flex-start">
                <button data-seg="src" data-val="bits">bits</button><button data-seg="src" data-val="free">drag</button></span></div>
              <div class="ctrl"><label><span>Fixed rate</span></label><span class="seg" style="align-self:flex-start">
                <button data-seg="rate" data-val="sym">symbols</button><button data-seg="rate" data-val="bit">bits</button></span></div>
              <div class="ctrl"><label><span data-fc-name></span><span class="val" data-out="fc">2</span></label>
                <input type="range" data-v="fc" min="1" max="6" step="1" value="2"></div>
              <div class="ctrl"><label><span>Bits</span></label><span class="seg" style="align-self:flex-start">
                <button data-do="new">new bits</button><button data-do="reset-bits">first bits</button></span></div>
            </div>
            <dl class="readout ro" ${RO(3)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const kk = e.target.dataset.v; if(!kk) return;
        const v = parseInt(e.target.value,10);
        if(kk === 'phase'){ stopTween(); st.phase = v; } else st[kk] = v;
        draw(root); });
      root.addEventListener('click', e=>{
        const b = e.target.closest('[data-seg]');
        if(b){ stopTween(); st[b.dataset.seg] = b.dataset.val; if(b.dataset.seg === 'sch') st.phase = nsym();
               draw(root); return; }
        const c = e.target.closest('[data-bit]');
        if(c){ stopTween(); const i = +c.dataset.bit; bits[i] ^= 1; st.src = 'bits';
               st.phase = Math.max(st.phase, Math.floor(i/SCH[st.sch].k)+1); draw(root); return; }
        const d = e.target.closest('[data-do]');
        if(d){ stopTween(); st.src = 'bits';
               if(d.dataset.do === 'new'){ const g = gen(4101 + 7*(++nNew)); bits = bits.map(()=> uni(g) < 0.5 ? 0 : 1); }
               else bits = DEF.slice();
               st.phase = nsym(); draw(root); }
      });
      const plots = root.querySelector('.plots');
      const planeHit = e => !!e.target.closest('[data-plane]');
      let pending = 0;
      plots.addEventListener('pointerdown', e=>{
        if(!planeHit(e)) return;
        const d = toData(root, e); if(!d) return;
        stopTween(); st.src = 'free'; drag = true;
        free = [clamp(d[0], -1.5, 1.5), clamp(d[1], -1.5, 1.5)];
        try{ plots.setPointerCapture(e.pointerId); }catch(_){}
        e.preventDefault(); draw(root);
      });
      plots.addEventListener('pointermove', e=>{
        if(!drag) return;
        const d = toData(root, e); if(!d) return;
        free = [clamp(d[0], -1.5, 1.5), clamp(d[1], -1.5, 1.5)];
        if(!pending) pending = requestAnimationFrame(()=>{ pending = 0; if(root.isConnected) draw(root); });
      });
      const end = e=>{ if(!drag) return; drag = false; try{ plots.releasePointerCapture(e.pointerId); }catch(_){} draw(root); };
      plots.addEventListener('pointerup', end);
      plots.addEventListener('pointercancel', end);
      stopTween();
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', ms:1100, get max(){ return nsym(); },
        get:()=>st.phase, set:v=>{ const up = v === st.phase + 1; st.phase = v; st.src = 'bits'; if(up) startTween(root); else stopTween(); },
        redraw:()=>draw(root) });
    }};
  })();

  /* =======================================================================
     Y · BIT ERRORS IN THE NOISE CLOUD
     A symbol is chosen, turned by the carrier phase error, and received in
     noise of variance N0/2 per axis. The nearest point is decided and the
     bits it costs are counted under both labellings at once, so switching
     the labels changes the count and never the cloud.
     ======================================================================= */
  const Y = (() => {
    const YS = { qpsk:{label:'QPSK', mk:()=>pskSet(4, Math.PI/4)}, psk8:{label:'8-PSK', mk:()=>pskSet(8, 0)},
                 psk16:{label:'16-PSK', mk:()=>pskSet(16, 0)}, qam16:{label:'16-QAM', mk:()=>qamSet(16)} };
    const PER = 400, BATCHES = 25;
    let st = { set:'qpsk', lab:'gray', ebn0:4, phi:0, phase:25 };
    const sets = {}, cache = new Map();
    const setOf = key => sets[key] || (sets[key] = YS[key].mk());

    /* the nearest-neighbour closed form: N_min Q(d_min / sqrt(2 N0)) */
    function formula(key, ebn0dB){
      const S = setOf(key), g = geometry(S), N0 = 1/(S.k*lin(ebn0dB));
      return g.Nmin*Q(g.dmin/Math.sqrt(2*N0));
    }
    /* the phase error at which a point with no noise reaches a boundary */
    function margin(key){
      const S = setOf(key);
      if(S.kind === 'psk') return 180/S.M;
      /* the outer corner of square QAM: (s-1)c sqrt2 cos(45deg + phi) = (s-2)c */
      return Math.acos((S.s-2)/((S.s-1)*Math.SQRT2))*180/Math.PI - 45;
    }
    function run(key, ebn0, phi){
      const id = key+'|'+ebn0+'|'+phi;
      let c = cache.get(id);
      if(!c){
        if(cache.size > 48) cache.delete(cache.keys().next().value);
        c = { g:gen(5150 + 1009*Object.keys(YS).indexOf(key) + 101*ebn0 + 7*phi), pts:[],
              cum:[{ sym:0, bg:0, bn:0, hg:[0,0,0,0,0], hn:[0,0,0,0,0] }] };
        cache.set(id, c);
      }
      return c;
    }
    function counts(key, ebn0, phi, b){
      const c = run(key, ebn0, phi), S = setOf(key);
      const sig = Math.sqrt(1/(S.k*lin(ebn0))/2), cs = Math.cos(phi*Math.PI/180), sn = Math.sin(phi*Math.PI/180);
      while(c.cum.length <= b){
        const prev = c.cum[c.cum.length-1];
        const nx = { sym:prev.sym, bg:prev.bg, bn:prev.bn, hg:prev.hg.slice(), hn:prev.hn.slice() };
        for(let t=0;t<PER;t++){
          const i = Math.min(S.M-1, Math.floor(uni(c.g)*S.M));
          const p = S.pts[i];
          const x = p[0]*cs - p[1]*sn + sig*gauss(c.g), y = p[0]*sn + p[1]*cs + sig*gauss(c.g);
          const d = detect(S, x, y);
          const eg = pop(S.g[i] ^ S.g[d]), en = pop(S.n[i] ^ S.n[d]);
          if(d !== i){ nx.sym++; nx.bg += eg; nx.bn += en; nx.hg[Math.min(4,eg)]++; nx.hn[Math.min(4,en)]++; }
          c.pts.push([x, y, i, d]);
        }
        c.cum.push(nx);
      }
      return c;
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const S = setOf(st.set), g = geometry(S), k = S.k;
      const c = counts(st.set, st.ebn0, st.phi, st.phase);
      const cum = c.cum[st.phase], n = st.phase*PER;
      const Pe = formula(st.set, st.ebn0), Pb = Pe/k;
      const nat = st.lab === 'natural';
      const lab = nat ? S.n : S.g;

      /* ---- the cloud over the decision regions ---- */
      const Wc = ph ? 300 : 470, hC = ph ? 300 : gh(420);
      const lim = 1.62;
      const a = eqAxes(Object.assign({w:Wc,h:hC,xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:ph?38:46,r:ph?12:16,t:26,b:42},xtarget:4,ytarget:4},
        S.kind === 'qam' ? {xtickfmt:()=>'', ytickfmt:()=>''} : {}), lim);
      const cols = colouring(S.pts), SC = SYM();
      regions(a, S.pts, cols);
      const xr = a.o.xr, yr = a.o.yr;
      const inBox = (x,y) => x > xr[0] && x < xr[1] && y > yr[0] && y < yr[1];
      const shown = c.pts.slice(0, n);
      const ok = [], bad = [];
      for(let i = shown.length-1; i >= 0 && (ok.length < 900 || bad.length < 260); i--){
        const q = shown[i];
        if(q[2] === q[3]){ if(ok.length < 900) ok.push(q); } else if(bad.length < 260) bad.push(q);
      }
      ok.forEach(q=>{ if(inBox(q[0],q[1])) cloudPt(a, q[0], q[1], 1.9); });
      /* the rotated positions the points are sent to */
      if(st.phi){ const cs = Math.cos(st.phi*Math.PI/180), sn = Math.sin(st.phi*Math.PI/180);
        S.pts.forEach(p=>a.raw(`<circle cx="${a.sx(p[0]*cs-p[1]*sn).toFixed(2)}" cy="${a.sy(p[0]*sn+p[1]*cs).toFixed(2)}" r="9" fill="none" stroke="${P.COL.ink}" stroke-width="1.4" stroke-dasharray="2 3"/>`)); }
      bad.forEach(q=>{ if(!inBox(q[0],q[1])) return;
        const b = pop(lab[q[2]] ^ lab[q[3]]);
        a.point(q[0], q[1], b > 1 ? {color:'none', r:5.2, ring:P.COL.err, ringw:2} : {color:P.COL.err, r:2.8, ring:'none'}); });
      S.pts.forEach((p,i)=>{
        a.point(p[0], p[1], {color:SC[cols[i]], r:6, ring:P.COL.plate, ringw:1.8});
        const r = Math.hypot(p[0],p[1]);
        const lx = S.kind === 'qam' ? p[0] : p[0]*(1+0.36/r), ly = S.kind === 'qam' ? p[1]-0.17 : p[1]*(1+0.36/r);
        a.note(lx, ly, `\\mathtt{${bin(lab[i],k)}}`, {tex:true, fs:S.M > 8 ? 12.5 : 14, color:P.COL.ink, anchor:'middle', dy:5});
      });

      /* ---- the running rates against the formulas ---- */
      const Wr = ph ? 300 : 400, hR = hC;
      const lo = Math.max(-6, Math.floor(Math.log10(Math.max(1e-7, Math.min(Pb, cum.bg ? 1 : Pb))) - 0.6));
      const HI = -0.9, hiLines = (HI - lg1(Pe)) / (HI - lo + 1) < 0.45;
      /* when both lines sit high the legend goes to the foot, with room made below them */
      const LO = hiLines ? Math.min(lo - 1, Math.floor(2*lg1(Pb) - HI)) : lo - 1;
      const ar = P.Axes({w:Wr,h:hR,xr:[0,BATCHES*PER],yr:[LO,HI],xlabel:'\\text{symbols sent}',ylabel:'\\text{error rate}',
        ytickfmt:v=>P.decade(v+1),yticksOverride:decTicks(LO,HI),zeroAxes:false,xtickfmt:v=>v ? fmt(v/1000,1)+'k' : '0',
        pad:{l:ph?46:58,r:ph?12:18,t:26,b:46},xtarget:3});
      ar.hline(lg1(Pe),{color:P.COL.slate,dash:'none',width:1.8,opacity:1});
      ar.hline(lg1(Pb),{color:P.COL.slate,dash:'6 4',width:1.8,opacity:1});
      const ser = [], ber = [];
      for(let b=1;b<=st.phase;b++){ const q = c.cum[b], m = b*PER;
        if(q.sym) ser.push([m, lg1(q.sym/m)]);
        const e = nat ? q.bn : q.bg; if(e) ber.push([m, lg1(e/(m*k))]); }
      if(ser.length > 1) ar.poly(ser,{color:P.COL.out,width:2.2});
      if(ber.length > 1) ar.poly(ber,{color:P.COL.out,width:2.2,dash:'7 5'});
      if(ser.length) ar.point(ser[ser.length-1][0], ser[ser.length-1][1], {color:P.COL.out, r:4.5, ring:P.COL.plate});
      if(ber.length) ar.point(ber[ber.length-1][0], ber[ber.length-1][1], {color:P.COL.out, r:4.5, ring:P.COL.plate});

      const lgR = `${L('slate','P_e')}${L('slate','P_e/\\log_2 M',true)}${L('out','\\text{SER}')}${L('out','\\text{BER}',true)}`;
      const dot = ring => `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;box-sizing:border-box;${ring ? 'border:2px solid var(--sig-err)' : 'background:var(--sig-err);transform:scale(.7)'}"></span>`;
      const lgC = `<span style="display:inline-flex;align-items:center;gap:8px">${dot(false)}1 bit</span><span style="display:inline-flex;align-items:center;gap:8px">${dot(true)}2 bits or more</span>`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lgC)}<div class="plot-wrap">${ar.svg()}</div>${legendRow(lgR)}`
        : `<div style="display:flex;gap:14px;align-items:flex-start">`
        + `<div class="plot-wrap" style="flex:0 0 calc((100% - 14px)*${(Wc/(Wc+Wr)).toFixed(4)});min-width:0">${a.svg()}</div>`
        + `<div class="plot-wrap" style="flex:1 1 0;min-width:0">${ar.svg()}<div class="legend in-plot" style="${hiLines ? `top:auto;bottom:calc(${(100*(ar.H-ar.y0)/ar.H).toFixed(2)}% + 8px)` : `top:calc(${(100*ar.y1/ar.H).toFixed(2)}% + 8px)`};right:calc(${(100*(ar.W-ar.x1)/ar.W).toFixed(2)}% + 8px);flex-direction:column;gap:3px">${lgR}</div></div></div>`;

      /* ---- readouts ---- */
      const bits = nat ? cum.bn : cum.bg;
      const per = cum.sym ? bits/cum.sym : 0;
      const mg = margin(st.set);
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Measured</dt><dd class="okv">${cum.sym} of ${n}${n ? ' = ' + N(cum.sym/n,4) : ''}</dd></div>
        <div><dt>Formula $P_e$</dt><dd>${pH(Pe)}</dd></div>
        <div><dt>Phase margin</dt><dd class="${st.phi >= mg ? 'warnv' : ''}">${N(mg,1)}°</dd></div>
        <div><dt>Bit errors</dt><dd class="okv">${bits} of ${n*k}${n ? ' = ' + N(bits/(n*k),4) : ''}</dd></div>
        <div><dt>$P_e/\\log_2 M$</dt><dd>${pH(Pb)}</dd></div>
        <div><dt>Bits a wrong symbol</dt><dd class="${per > 1.15 ? 'warnv' : ''}">${cum.sym ? N(per,2) : '…'}</dd></div>`);
      const meas = n ? cum.sym/n : 0;
      const v = st.phi >= mg
        ? `<div class="note err"><span class="note-h">Past the boundary</span>The phase error is larger than the margin of ${N(mg,1)}°. Even with no noise, some points land in a wrong region.</div>`
        : st.phi > 0 && meas > 2*Pe
        ? `<div class="note warn"><span class="note-h">Phase error</span>A turn of ${st.phi}° moves every point toward a boundary. The measured rate climbs far above the formula, which assumes a known phase.</div>`
        : nat
        ? `<div class="note warn"><span class="note-h">Natural labels</span>Neighbours can differ in two or more bits, so one wrong symbol costs more bits. The bit error rate sits above $P_e/\\log_2 M$.</div>`
        : `<div class="note ok"><span class="note-h">Gray labels</span>A wrong symbol is almost always a neighbour, and neighbours differ in one bit. So the bit error rate is close to $P_e/\\log_2 M$.</div>`;
      root.querySelector('.verdict').innerHTML = M(v);
      root.querySelector('.leg-c').innerHTML = `<span>Wrong decisions:</span>${lgC}`;

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelector('[data-v=phase]').value = String(st.phase);
      root.querySelectorAll('[data-seg]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val === st[b.dataset.seg])));
    }

    const core = { formula, margin, counts, setOf, PER, BATCHES };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="legend leg-c" style="gap:4px 22px;align-items:center"></div>
            ${playbar('Batches of ' + PER + ' symbols','phase',BATCHES,25)}</div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Set</span><span class="seg">
                ${Object.keys(YS).map(kk=>`<button data-seg="set" data-val="${kk}">${YS[kk].label}</button>`).join('')}</span></label></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>Labels</span><span class="seg">
                <button data-seg="lab" data-val="gray">Gray</button><button data-seg="lab" data-val="natural">natural</button></span></label></div>
              <div class="ctrl"><label><span>$E_b/N_0$, dB</span><span class="val" data-out="ebn0">4</span></label>
                <input type="range" data-v="ebn0" min="0" max="16" step="1" value="4"></div>
              <div class="ctrl"><label><span>Phase error, °</span><span class="val" data-out="phi">0</span></label>
                <input type="range" data-v="phi" min="0" max="45" step="5" value="0"></div>
            </div>
            <dl class="readout ro" ${RO(3)}></dl>
            <div class="verdict derive"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const kk = e.target.dataset.v; if(!kk) return;
        st[kk] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        st[b.dataset.seg] = b.dataset.val; draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', max:BATCHES, ms:130,
        get:()=>st.phase, set:v=>{ st.phase = v; }, redraw:()=>draw(root) });
    }};
  })();

  /* =======================================================================
     H · ERROR PROBABILITY AGAINST SIGNAL-TO-NOISE RATIO
     The closed form from d_min and N_min, the exact forms where the module
     has them, and a simulation whose points fill in batch by batch. A
     one-dimensional scheme collects the noise of one axis only.
     ======================================================================= */
  const H = (() => {
    const HS = { bpsk:{label:'BPSK', mk:()=>pamSet(2)}, bfsk:{label:'BFSK', mk:orthSet},
                 qpsk:{label:'QPSK', mk:()=>pskSet(4, Math.PI/4)}, psk8:{label:'8-PSK', mk:()=>pskSet(8, 0)},
                 pam4:{label:'4-PAM', mk:()=>pamSet(4)}, pam8:{label:'8-PAM', mk:()=>pamSet(8)},
                 qam16:{label:'16-QAM', mk:()=>qamSet(16)}, qam64:{label:'64-QAM', mk:()=>qamSet(64)} };
    const ROWA = ['bpsk','bfsk','qpsk','psk8'], ROWB = ['pam4','pam8','qam16','qam64'];
    const MARKS = [0,2,4,6,8,10,12,14,16,18,20], BATCHES = 25, PERS = [16,60,200,800];
    let st = { set:'qpsk', esn0:10, trials:3, phase:25, curve:'nn' };
    const sets = {}, geo = {}, cache = {};
    const setOf = key => sets[key] || (sets[key] = HS[key].mk());
    const geoOf = key => geo[key] || (geo[key] = geometry(setOf(key)));

    function closed(key, esn0dB){ const g = geoOf(key), N0 = 1/lin(esn0dB); return g.Nmin*Q(g.dmin/Math.sqrt(2*N0)); }
    /* the exact symbol error rate where the module has one: a PAM set and a
       binary set are already exact in the nearest-neighbour form; square
       QAM is decided axis by axis, so P = 1 - (1 - P_sqrtM)^2 */
    function exact(key, esn0dB){
      const S = setOf(key), g = lin(esn0dB);
      if(S.kind === 'pam' || S.kind === 'orth') return closed(key, esn0dB);
      if(S.kind === 'psk' && S.M === 4){ const q = Q(Math.sqrt(g)); return 1-(1-q)*(1-q); }
      if(S.kind === 'qam'){ const p = 2*(1-1/S.s)*Q(Math.sqrt(3*g/(S.M-1))); return 1-(1-p)*(1-p); }
      return null;
    }
    /* The count at every mark after b batches, extended lazily. The state
       each mark's generator had at the start of every batch is kept, so the
       scatter of any batch is replayed rather than stored. */
    function counts(key, trials, b){
      const id = key+'|'+trials;
      let c = cache[id];
      if(!c) c = cache[id] = { gens: MARKS.map((_,i)=>gen(20260802 + 977*i)), cum:[MARKS.map(()=>0)], snaps:[] };
      const S = setOf(key), per = PERS[trials-1];
      while(c.cum.length <= b){
        const prev = c.cum[c.cum.length-1];
        c.snaps.push(c.gens.map(snap));
        c.cum.push(MARKS.map((d,i)=>prev[i] + batch(S, d, c.gens[i], per, null)));
      }
      return c;
    }
    function batch(S, d, G, per, keep){
      const sig = Math.sqrt(1/lin(d)/2);
      let w = 0;
      for(let t=0;t<per;t++){
        const i = Math.min(S.M-1, Math.floor(uni(G)*S.M));
        const x = S.pts[i][0] + sig*gauss(G);
        const y = S.dim === 2 ? S.pts[i][1] + sig*gauss(G) : S.pts[i][1];
        const bad = detect(S, x, y) !== i;
        if(bad) w++;
        if(keep) keep.push([x, y, bad]);
      }
      return w;
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const S = setOf(st.set), g = geoOf(st.set), per = PERS[st.trials-1];
      const c = counts(st.set, st.trials, st.phase), cum = c.cum[st.phase], n = per*st.phase;
      const iM = MARKS.indexOf(st.esn0);
      const ex = exact(st.set, 0) !== null;
      const showEx = st.curve === 'exact' && ex;

      const cl = v => Math.log10(Math.max(1e-12, v));
      const Wp = ph ? 300 : 560, hP = ph ? 300 : gh(390);
      const a = P.Axes({w:Wp,h:hP,xr:[0,20],yr:[-5.4,-0.02],
        xlabel:'E_s/N_0\\;(\\mathrm{dB})', ylabel:'P_s', ytickfmt:P.decade, yticksOverride:P.decades(-5,-1), zeroAxes:false,
        pad:{l:ph?48:60,r:ph?12:22,t:26,b:46}, xtarget:5, ytarget:6});
      a.curve(d=>cl(closed(st.set, d)), {color:P.COL.in, width:2.3, dash:showEx ? '8 5' : null});
      if(showEx) a.curve(d=>cl(exact(st.set, d)), {color:P.COL.in, width:2.3});
      if(n) MARKS.forEach((d,i)=>{ if(cum[i] > 0) a.point(d, Math.max(-5.2, cl(cum[i]/n)), {color:P.COL.out, r:5, ring:P.COL.plate, ringw:1.6}); });
      a.vline(st.esn0,{color:P.COL.ink,dash:'5 4',width:1.4,opacity:0.9});

      /* the latest batch at the mark, replayed from the state it started in */
      const keep = [];
      if(st.phase > 0 && iM >= 0){ const s0 = c.snaps[st.phase-1][iM]; batch(S, st.esn0, { a:s0.a, spare:s0.spare }, per, keep); }
      const Ws = ph ? 300 : 330, hS = hP;
      const as = eqAxes({w:Ws,h:hS,xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:ph?38:44,r:ph?12:14,t:26,b:46},xtarget:4,ytarget:4}, 1.55);
      const xr = as.o.xr, yr = as.o.yr;
      const inBox = (x,y) => x > xr[0] && x < xr[1] && y > yr[0] && y < yr[1];
      keep.slice(0, 800).forEach(q=>{ if(!inBox(q[0],q[1])) return; if(!q[2]) cloudPt(as, q[0], q[1], 1.7); });
      keep.forEach(q=>{ if(q[2] && inBox(q[0],q[1])) as.point(q[0], q[1], {color:P.COL.err, r:2.6, ring:'none'}); });
      S.pts.forEach(p=>as.point(p[0], p[1], {color:P.COL.ink, r:S.M > 16 ? 3.2 : 4.5, ring:P.COL.plate, ringw:1.4}));

      const lg = [L('in','\\text{nearest neighbours}', showEx)].concat(showEx ? [L('in','\\text{exact}')] : [], [LD('out','\\text{simulated}')]).join('');
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lg)}<div class="plot-wrap">${as.svg()}</div>`
        : `<div style="display:flex;gap:14px;align-items:flex-start">`
        + `<div class="plot-wrap" style="flex:0 0 calc((100% - 14px)*${(Wp/(Wp+Ws)).toFixed(4)});min-width:0">${a.svg()}`
        + `<div class="legend in-plot" style="top:calc(${(100*a.y1/a.H).toFixed(2)}% + 8px);right:calc(${(100*(a.W-a.x1)/a.W).toFixed(2)}% + 8px);flex-direction:column;gap:3px">${lg}</div></div>`
        + `<div class="plot-wrap" style="flex:1 1 0;min-width:0">${as.svg()}</div></div>`;

      const here = closed(st.set, st.esn0), hx = exact(st.set, st.esn0);
      const w = iM >= 0 ? cum[iM] : 0;
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Points $M$</dt><dd>${S.M}, ${S.k} bits</dd></div>
        <div><dt>$d_{\\min}$</dt><dd>${N(g.dmin,4)}</dd></div>
        <div><dt>$N_{\\min}$</dt><dd>${N(g.Nmin,3)}</dd></div>
        <div><dt>Measured</dt><dd class="okv">${w} of ${n}${n ? ' = ' + N(w/n,5) : ''}</dd></div>
        <div><dt>Closed form</dt><dd>${pH(here)}</dd></div>
        <div><dt>${hx !== null ? 'Exact' : '$E_b/N_0$ at the mark'}</dt><dd>${hx !== null ? pH(hx) : N(st.esn0 - dB(S.k),3) + ' dB'}</dd></div>`);
      const arg = g.dmin/Math.sqrt(2/lin(st.esn0));
      root.querySelector('.derive:not(.verdict)').innerHTML = M(st.curve === 'exact' && S.kind === 'qam'
        ? `<div class="eq"><span class="eq-label">Exact, axis by axis</span>${T(`\\begin{aligned}P_{\\sqrt M}&=2\\Big(1-\\tfrac{1}{\\sqrt M}\\Big)Q\\Big(\\sqrt{\\tfrac{3E_s}{(M-1)N_0}}\\Big)\\\\ P_s&=1-\\big(1-P_{\\sqrt M}\\big)^{2}=${pTeX(hx)}\\end{aligned}`, true)}</div>`
        : `<div class="eq"><span class="eq-label">Closed form at the mark</span>${T(`P_s\\approx N_{\\min}\\,Q\\Big(\\frac{d_{\\min}}{\\sqrt{2N_0}}\\Big)=${N(g.Nmin,3)}\\,Q(${N(arg,3)})=${pTeX(here)}`, true)}</div>`);

      const sd = Math.sqrt(Math.max(here,1e-9)*(1-here)*Math.max(n,1));
      const off = (w - here*n)/Math.max(sd, 1e-9);
      const noEx = st.curve === 'exact' && !ex;
      root.querySelector('.verdict').innerHTML = M(
        noEx
        ? `<div class="note def"><span class="note-h">No simple exact form</span>8-PSK has no short exact formula. Below about $8$ dB the dots, the simulation, show how far the approximation is off.</div>`
        : n && w === 0
        ? `<div class="note warn"><span class="note-h">No errors at this mark</span>The formula expects ${T(fmt(here*n,3),false)} errors in ${n} symbols. Seeing none is normal. Rates below about $10^{-5}$ come from the formula, not from a count.</div>`
        : !n
        ? `<div class="note def"><span class="note-h">Nothing sent yet</span>Press Play or Step. Each batch adds ${per} symbols at every mark.</div>`
        : Math.abs(off) < 3
        ? `<div class="note ok"><span class="note-h">The two routes agree</span>The formula predicts ${T(fmt(here*n,2),false)} errors and the count is ${w}, which is ${T(fmt(Math.abs(off),2),false)} standard deviations away.</div>`
        : `<div class="note def"><span class="note-h">A real gap</span>The count is ${w}, the formula predicts ${T(fmt(here*n,2),false)}. The closed form counts only the nearest neighbours, so it is too high at low $E_s/N_0$.</div>`);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelector('[data-trials]').textContent = String(25*PERS[st.trials-1]);
      root.querySelector('[data-v=phase]').value = String(st.phase);
      root.querySelectorAll('[data-seg]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val === st[b.dataset.seg])));
    }

    const core = { closed, exact, counts, geoOf, setOf, MARKS, PERS, BATCHES };

    return { core, mount(root){
      const seg = keys => keys.map(kk=>`<button data-seg="set" data-val="${kk}">${HS[kk].label}</button>`).join('');
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            ${playbar('Batches run','phase',BATCHES,25)}
            <div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Scheme</span><span class="seg">${seg(ROWA)}</span></label>
                <label><span></span><span class="seg">${seg(ROWB)}</span></label></div>
              <div class="ctrl"><label><span>Mark at $E_s/N_0$, dB</span><span class="val" data-out="esn0">10</span></label>
                <input type="range" data-v="esn0" min="0" max="20" step="2" value="10"></div>
              <div class="ctrl"><label><span>Symbols a mark</span><span class="val" data-trials>5000</span></label>
                <input type="range" data-v="trials" min="1" max="4" step="1" value="3"></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>Curve</span><span class="seg">
                <button data-seg="curve" data-val="nn">nearest</button><button data-seg="curve" data-val="exact">exact too</button></span></label></div>
            </div>
            <dl class="readout ro" ${RO(3)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const kk = e.target.dataset.v; if(!kk) return;
        st[kk] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        st[b.dataset.seg] = b.dataset.val; draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', max:BATCHES, ms:130,
        get:()=>st.phase, set:v=>{ st.phase = v; }, redraw:()=>draw(root) });
    }};
  })();

  /* =======================================================================
     Z · ORTHOGONAL SIGNALS AS M GROWS
     M tones, one a symbol. The coherent receiver correlates with each tone
     and picks the largest output; the noncoherent one takes the envelope of
     each tone, which does not depend on the carrier phase. Outputs are in
     units of sqrt(Es); the noise on each is N0/2 per component.
     ======================================================================= */
  const Z = (() => {
    const MS = [2,4,8,16,32], MARKS = [-4,-2,0,2,4,6,8,10,12];
    const PER = 200, BATCHES = 25;
    const XS = []; for(let d=-6; d<=16.0001; d+=0.1) XS.push(+d.toFixed(2));
    let st = { M:8, mode:'coh', ebn0:4, phase:25 };
    const cache = {}, curves = {};
    const kOf = Mn => Math.log2(Mn);

    /* coherent: P_e = int phi(z) (1 - (1 - Q(z + a))^(M-1)) dz, a = sqrt(2 Es/N0),
       integrated by Simpson's rule; written as 1 - (...)^(M-1) through
       log1p and expm1 so that a small P_e keeps its digits */
    function peCoh(Mn, ebn0dB){
      const a = Math.sqrt(2*kOf(Mn)*lin(ebn0dB)), n = 400, lo = -9, hi = 9, h = (hi-lo)/n;
      let s = 0;
      for(let i=0;i<=n;i++){
        const z = lo + i*h, q = Q(z + a);
        const f = Math.exp(-z*z/2)/Math.sqrt(2*Math.PI) * -Math.expm1((Mn-1)*Math.log1p(-Math.min(q, 1-1e-16)));
        s += f*(i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
      }
      return s*h/3;
    }
    /* noncoherent: P_e = sum_{n=1}^{M-1} (-1)^(n+1) C(M-1,n)/(n+1) exp(-n Es / ((n+1) N0)) */
    function peNc(Mn, ebn0dB){
      const g = kOf(Mn)*lin(ebn0dB);
      let s = 0, C = 1;
      for(let n=1;n<Mn;n++){ C = C*(Mn-n)/n; s += (n % 2 ? 1 : -1)*C/(n+1)*Math.exp(-n*g/(n+1)); }
      return Math.max(0, s);
    }
    const pe = (mode, Mn, d) => mode === 'nc' ? peNc(Mn, d) : peCoh(Mn, d);
    const union = (mode, Mn, d) => mode === 'nc' ? (Mn-1)/2*Math.exp(-kOf(Mn)*lin(d)/2) : (Mn-1)*Q(Math.sqrt(kOf(Mn)*lin(d)));
    /* E_b/N0 in dB at which P_e = target, by bisection on the exact curve */
    function need(mode, Mn, target){ let lo = -1.6, hi = 25;
      for(let i=0;i<60;i++){ const m = (lo+hi)/2; if(pe(mode, Mn, m) > target) lo = m; else hi = m; } return (lo+hi)/2; }
    const band = (mode, Mn) => (mode === 'nc' ? 1 : 0.5)*Mn/kOf(Mn);   /* W/R_b */
    const LIMIT = dB(Math.LN2);
    function curve(mode, Mn){ const id = mode+Mn; return curves[id] || (curves[id] = XS.map(d=>[d, pe(mode, Mn, d)])); }

    function counts(mode, Mn, b){
      const id = mode+'|'+Mn;
      let c = cache[id];
      if(!c) c = cache[id] = { gens:MARKS.map((_,i)=>gen(7000 + 131*Mn + (mode === 'nc' ? 17 : 0) + 977*i)), cum:[MARKS.map(()=>0)], last:[MARKS.map(()=>null)] };
      while(c.cum.length <= b){
        const prev = c.cum[c.cum.length-1], lastB = [];
        c.cum.push(MARKS.map((d,i)=>{
          const G = c.gens[i], sig = Math.sqrt(1/(kOf(Mn)*lin(d))/2);
          let w = 0, out = null, sent = 0, pick = 0;
          for(let t=0;t<PER;t++){
            const m = Math.min(Mn-1, Math.floor(uni(G)*Mn));
            const th = mode === 'nc' ? 2*Math.PI*uni(G) : 0;
            const r = new Array(Mn);
            for(let j=0;j<Mn;j++){
              if(mode === 'nc'){ const xc = (j === m ? Math.cos(th) : 0) + sig*gauss(G), xs = (j === m ? Math.sin(th) : 0) + sig*gauss(G); r[j] = Math.hypot(xc, xs); }
              else r[j] = (j === m ? 1 : 0) + sig*gauss(G);
            }
            let best = 0; for(let j=1;j<Mn;j++) if(r[j] > r[best]) best = j;
            if(best !== m) w++;
            if(t === PER-1){ out = r; sent = m; pick = best; }
          }
          lastB.push({ r:out, sent, pick });
          return prev[i] + w;
        }));
        c.last.push(lastB);
      }
      return c;
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const Mn = st.M, k = kOf(Mn), nc = st.mode === 'nc';
      const c = counts(st.mode, Mn, st.phase), cum = c.cum[st.phase], n = PER*st.phase;
      const iM = MARKS.indexOf(st.ebn0);
      const last = st.phase > 0 && iM >= 0 ? c.last[st.phase][iM] : null;

      /* ---- the tones of one symbol ---- */
      /* Both small panels and the curve panel keep zero off their axes by
         an offset, so no tick row is pulled into the data area. */
      const FO = 1, EO = 10;
      const Wt = ph ? 300 : 430, hT = ph ? 190 : gh(215);
      const df = (nc ? 1 : 0.5)/k;                                    /* tone spacing over R_b */
      const at = P.Axes(Object.assign(compactX(), {w:Wt,h:hT,xr:[-0.3+FO,7.2+FO],yr:[0,1.4],xlabel:'(f-f_1)/R_b',ylabel:'\\text{tones}',
        ytickfmt:()=>'',yticksOverride:[],zeroAxes:false,xtickfmt:()=>'',xticksOverride:[0,1,2,3,4,5,6,7].map(v=>v+FO),
        pad:{l:ph?30:34,r:ph?12:16,t:24,b:34}}));
      footTicks(at, [0,1,2,3,4,5,6,7].map(v=>v+FO), 0, v=>fmt(v-FO,2), 104);
      const sent = last ? last.sent : 0;
      for(let j=0;j<Mn;j++) if(j !== sent) at.impulse(j*df+FO, 1, {color:P.COL.muted, opacity:0.5, label:false, width:1.4});
      at.impulse(sent*df+FO, 1, {color:P.COL.in, label:false, width:2.6});
      at.span(-df/2+FO, (Mn-0.5)*df+FO, 1.2, 'W', {tex:true, color:P.COL.coral});

      /* ---- the bank of outputs ---- */
      const Wb = ph ? 300 : 430, hBk = hT;
      const ylo = nc ? 0 : -1.3, yhi = 2.5;
      const tk = Mn <= 8 ? Array.from({length:Mn},(_,j)=>j+1) : [1, Mn/4, Mn/2, 3*Mn/4, Mn];
      const ab = P.Axes(Object.assign(compactX(), {w:Wb,h:hBk,xr:[0.3, Mn+0.7],yr:[ylo, yhi],xlabel:'\\text{tone } j',ylabel:nc ? '|r_j|' : 'r_j',
        pad:{l:ph?34:40,r:ph?12:16,t:24,b:34},ytarget:3,arrows:false,xtickfmt:()=>'',xticksOverride:tk}));
      footTicks(ab, tk, ylo, v=>String(v), 66);
      if(last){
        const wd = Mn > 16 ? 0.4 : 0.34;
        last.r.forEach((v,j)=>{
          const y = clamp(v, ylo, yhi);
          ab.rect(j+1-wd, 0, j+1+wd, y, {fill: j === last.sent ? P.COL.in : P.COL.mid, stroke:'none'});
        });
        const y = clamp(last.r[last.pick], ylo, yhi);
        ab.rect(last.pick+1-0.5, 0, last.pick+1+0.5, y, {stroke: last.pick === last.sent ? P.COL.out : P.COL.err, width:2.6});
      }

      /* ---- P_e against E_b/N0, every M faint, this M strong ---- */
      const Wp = ph ? 300 : 874, hPe = ph ? 300 : gh(300);
      const LO = -7, HI = -0.95;
      const ap = P.Axes(Object.assign(compactX(), {w:Wp,h:hPe,xr:[-6+EO,19+EO],yr:[LO,HI],xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_e',
        xtickfmt:v=>fmt(v-EO,2),xticksOverride:[-4,0,4,8,12].map(v=>v+EO),ytickfmt:v=>P.decade(v+1),yticksOverride:decTicks(LO,HI),zeroAxes:false,
        pad:{l:ph?46:60,r:ph?12:22,t:26,b:34}}));
      const sh = arr => arr.filter(p=>p[1] > 1e-9).map(p=>[p[0]+EO, lg1(p[1])]);
      /* the limit of Module 6, faint, with its name */
      ap.vline(LIMIT+EO,{color:P.COL.muted,dash:'3 5',width:1.3,opacity:0.8});
      ap.note(LIMIT+EO, -5.4, '\\text{limit }-1.6\\ \\text{dB}', {tex:true, fs:14, color:P.COL.muted, anchor:'end', dx:-8});
      ap.note(LIMIT+EO, -6.1, '\\text{(Module 6)}', {tex:true, fs:14, color:P.COL.muted, anchor:'end', dx:-8});
      MS.forEach(m=>{ if(m !== Mn) ap.poly(sh(curve(st.mode, m)),{color:P.COL.noise,width:1.6}); });
      ap.curve(x=>lg1(union(st.mode, Mn, x-EO)),{color:P.COL.in,width:1.8,dash:'7 5'});
      ap.poly(sh(curve(st.mode, Mn)),{color:P.COL.in,width:2.6});
      if(n) MARKS.forEach((d,i)=>{ if(cum[i] > 0) ap.point(d+EO, Math.max(LO+0.05, lg1(cum[i]/n)), {color:P.COL.out, r:5, ring:P.COL.plate, ringw:1.6}); });
      { const v = Math.min(pe(st.mode, Mn, st.ebn0), iM >= 0 && n && cum[iM] ? cum[iM]/n : 1);
        ap.poly([[st.ebn0+EO, HI], [st.ebn0+EO, Math.max(LO, lg1(v) - 0.4)]],{color:P.COL.ink,width:1.4,dash:'5 4'}); }

      const lgT = `${L('in','\\text{sent}')}`;
      const lgB = `${L('in','\\text{sent}')}${L('mid','\\text{others}')}`;
      const lgP = `${L('in',nc ? '\\text{noncoherent}' : '\\text{coherent}')}${L('in','\\text{bound}',true)}`
        + `<i style="--lg-c:var(--rule-strong)">${T('\\text{other }M',false)}</i>${LD('out','\\text{simulated}')}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${at.svg()}</div><div class="plot-wrap">${ab.svg()}</div>${legendRow(lgB)}<div class="plot-wrap">${ap.svg()}</div>${legendRow(lgP)}`
        : `<div style="display:flex;gap:14px;align-items:flex-start">`
        + `<div class="plot-wrap" style="flex:1 1 0;min-width:0">${at.svg()}<div class="legend in-plot">${lgT}</div></div>`
        + `<div class="plot-wrap" style="flex:1 1 0;min-width:0">${ab.svg()}<div class="legend in-plot">${lgB}</div></div></div>`
        + `<div class="plot-wrap">${ap.svg()}<div class="legend in-plot">${lgP}</div></div>`;

      const w = iM >= 0 ? cum[iM] : 0;
      const nd = need(st.mode, Mn, 1e-5), cost = need('nc', Mn, 1e-5) - need('coh', Mn, 1e-5);
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Bits a symbol</dt><dd>${k}</dd></div>
        <div><dt>Band $W/R_b$</dt><dd>${N(band(st.mode, Mn),3)}</dd></div>
        <div><dt>$E_b/N_0$ for $10^{-5}$</dt><dd>${N(nd,2)} dB</dd></div>
        <div><dt>Measured</dt><dd class="okv">${w} of ${n}</dd></div>
        <div><dt>Rate, measured</dt><dd class="okv">${n ? N(w/n,4) : '…'}</dd></div>
        <div><dt>Rate, formula</dt><dd>${pH(pe(st.mode, Mn, st.ebn0))}</dd></div>`);
      root.querySelector('.verdict').innerHTML = M(st.ebn0 < LIMIT
        ? `<div class="note err"><span class="note-h">Below the limit</span>At $E_b/N_0<-1.6$ dB no orthogonal set gives a small error rate, however large $M$ is. Module 6 shows why.</div>`
        : nc
        ? `<div class="note warn"><span class="note-h">Without the phase</span>The envelope ignores the carrier phase. It needs tones $1/T$ apart, twice the band, and costs ${N(cost,2)} dB at $10^{-5}$.</div>`
        : `<div class="note ok"><span class="note-h">More tones</span>Each doubling of $M$ adds a bit a symbol and lowers the $E_b/N_0$ needed. It also doubles the number of tones and widens the band.</div>`);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelector('[data-v=phase]').value = String(st.phase);
      root.querySelectorAll('[data-seg]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val === String(st[b.dataset.seg]))));
    }

    const core = { peCoh, peNc, union, need, band, counts, LIMIT, MARKS, PER, BATCHES };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            ${playbar('Batches of ' + PER + ' symbols','phase',BATCHES,25)}</div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Tones $M$</span><span class="seg">
                ${MS.map(m=>`<button data-seg="M" data-val="${m}">${m}</button>`).join('')}</span></label></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>Detection</span><span class="seg">
                <button data-seg="mode" data-val="coh">coherent</button><button data-seg="mode" data-val="nc">noncoherent</button></span></label></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>Mark at $E_b/N_0$, dB</span><span class="val" data-out="ebn0">4</span></label>
                <input type="range" data-v="ebn0" min="-4" max="12" step="2" value="4"></div>
            </div>
            <dl class="readout ro" ${RO(3)}></dl>
            <div class="verdict derive"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const kk = e.target.dataset.v; if(!kk) return;
        st[kk] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg]'); if(!b) return;
        st[b.dataset.seg] = b.dataset.seg === 'M' ? +b.dataset.val : b.dataset.val; draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', max:BATCHES, ms:130,
        get:()=>st.phase, set:v=>{ st.phase = v; }, redraw:()=>draw(root) });
    }};
  })();

  /* =======================================================================
     BW · THE BANDWIDTH-POWER PLANE
     Plane: R/W against the E_b/N0 each scheme needs for a target symbol
     error rate, from the nearest-neighbour form N_min Q(x) = P_e. PAM is
     counted with one sideband (R/W = 2 log2 M), PSK and QAM R/W = log2 M,
     orthogonal FSK R/W = 2 log2 M / M.
     Adaptive: the densest of BPSK, QPSK, 16-, 64- and 256-QAM whose bit
     error rate meets the target at the signal-to-noise ratio of the slot.
     ======================================================================= */
  const BW = (() => {
    /* Every family is a set of transmitted signals, so all four take the
       transmitted-signal colour and are told apart by their dash, the same
       four dashes as the slide m5-plane. */
    const FAM = { pam:{label:'PAM', dash:'2 4', lg:'dots', Ms:[2,4,8,16]}, psk:{label:'PSK', dash:null, lg:false, Ms:[2,4,8,16,32]},
                  qam:{label:'QAM', dash:'7 5', lg:true, Ms:[4,16,64,256]}, fsk:{label:'FSK', dash:'12 5 3 5', lg:'dashdot', Ms:[2,4,8,16,32,64]} };
    const TG = [-3,-3.5,-4,-4.5,-5,-5.5,-6,-6.5,-7];
    const AD = [{name:'BPSK',k:1,M:2},{name:'QPSK',k:2,M:4},{name:'16-QAM',k:4,M:16},{name:'64-QAM',k:6,M:64},{name:'256-QAM',k:8,M:256}];
    const SLOTS = 48;
    let st = { view:'plane', hk:4, tgt:4, snr:20, slot:SLOTS, fam:{pam:true, psk:true, qam:true, fsk:true} };
    let shown = TG[4], raf = 0;

    const kOf = Mn => Math.log2(Mn);
    function nmin(f, Mn){ return f === 'pam' ? 2*(Mn-1)/Mn : f === 'psk' ? (Mn === 2 ? 1 : 2) : f === 'qam' ? 4*(1-1/Math.sqrt(Mn)) : Mn-1; }
    /* E_b/N0 (linear) at which N_min Q(x) = pe */
    function need(f, Mn, pe){
      const x = Qinv(pe/nmin(f, Mn)), k = kOf(Mn);
      if(f === 'pam') return x*x*(Mn*Mn-1)/(6*k);
      if(f === 'psk') return Mn === 2 ? x*x/2 : x*x/(2*k*Math.pow(Math.sin(Math.PI/Mn),2));
      if(f === 'qam') return x*x*(Mn-1)/(3*k);
      return x*x/k;
    }
    const rw = (f, Mn) => f === 'pam' ? 2*kOf(Mn) : f === 'fsk' ? 2*kOf(Mn)/Mn : kOf(Mn);
    const shannon = r => (Math.pow(2, r) - 1)/r;
    /* the bit error rate of each adaptive scheme at Es/N0 = g, with Gray labels */
    function pb(s, g){
      if(s.M === 2) return Q(Math.sqrt(2*g));
      if(s.M === 4) return Q(Math.sqrt(g));
      return 4/s.k*(1-1/Math.sqrt(s.M))*Q(Math.sqrt(3*g/(s.M-1)));
    }
    function thresh(s, target){
      if(s.M === 2){ const x = Qinv(target); return dB(x*x/2); }
      if(s.M === 4){ const x = Qinv(target); return dB(x*x); }
      const x = Qinv(target*s.k/(4*(1-1/Math.sqrt(s.M)))); return dB(x*x*(s.M-1)/3);
    }
    function choose(snr, target){ let best = -1; AD.forEach((s,i)=>{ if(thresh(s, target) <= snr) best = i; }); return best; }
    /* a slow deterministic fade around the mean, in dB */
    const trace = (t, mean) => mean + 7*Math.sin(2*Math.PI*1.3*t/SLOTS) + 3.5*Math.sin(2*Math.PI*3.1*t/SLOTS + 1.1);

    function tween(root, to){
      if(raf) cancelAnimationFrame(raf); raf = 0;
      if(REDUCED()){ shown = to; draw(root); return; }
      const from = shown; let t0 = 0;
      const tick = now => { if(!root.isConnected){ raf = 0; return; }
        if(!t0) t0 = now; const u = Math.min(1, (now-t0)/260);
        shown = from + (to-from)*(1-(1-u)*(1-u)); draw(root);
        raf = u < 1 ? requestAnimationFrame(tick) : 0; };
      raf = requestAnimationFrame(tick);
    }

    const XOFF = 10;                                 /* keeps x = 0 off the tick row */
    function drawPlane(root, ph, gh){
      const pe = Math.pow(10, shown), Mh = 1 << st.hk;
      const a = P.Axes({w:ph?300:874,h:ph?300:gh(480),xr:[-3+XOFF, 27+XOFF],yr:[-3.25,-0.88],
        xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'R/W\\;(\\text{bits/s/Hz})',
        xtickfmt:v=>fmt(v-XOFF,2), yticksOverride:[-3,-2,-1], ytickfmt:v=>['0.1','1','10'][v+3], zeroAxes:false,
        pad:{l:ph?44:56,r:ph?12:22,t:30,b:46}, xtarget:ph?4:7});
      const ly = r => Math.log10(r) - 2;
      a.under(`<rect x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${(a.sy(-2)-a.y1).toFixed(2)}" fill="${tint(P.COL.slate,0.05)}"/>`);
      a.under(`<rect x="${a.x0}" y="${a.sy(-2).toFixed(2)}" width="${a.x1-a.x0}" height="${(a.y0-a.sy(-2)).toFixed(2)}" fill="${tint(P.COL.muted,0.06)}"/>`);
      a.hline(-2,{color:P.COL.muted,dash:'2 4',opacity:0.9});
      a.note(26.6+XOFF, ly(1.45), 'bandwidth-limited', {fs:14.5, color:P.COL.slate, anchor:'end'});
      a.note(26.6+XOFF, ly(0.62), 'power-limited', {fs:14.5, color:P.COL.slate, anchor:'end', dy:8});
      /* the Shannon limit, faint: a result of Module 6 */
      const sh = []; for(let i=0;i<=80;i++){ const r = Math.pow(10, -1.2 + 2.3*i/80); sh.push([dB(shannon(r))+XOFF, ly(r)]); }
      a.poly(sh.filter(p=>p[0] >= -3+XOFF && p[0] <= 27+XOFF),{color:P.COL.muted,width:1.5,dash:'4 5'});
      /* named low down, right of the curve, where no family reaches and the frame
         is far away at any label scale */
      a.note(dB(shannon(0.3))+XOFF, ly(0.3), '\\text{limit (Module 6)}', {tex:true, fs:14, color:P.COL.muted, anchor:'start', dx:12});
      Object.keys(FAM).forEach(f=>{
        if(!st.fam[f]) return;
        const F = FAM[f], col = P.COL.in;
        const pts = F.Ms.map(Mn=>[dB(need(f, Mn, pe))+XOFF, ly(rw(f, Mn)), Mn]);
        a.poly(pts,{color:col,width:2,dash:F.dash});
        pts.forEach(p=>a.point(p[0], p[1], p[2] === Mh ? {color:col, r:8.5, ring:P.COL.coral, ringw:2.4} : {color:col, r:5, ring:P.COL.plate, ringw:1.4}));
      });
      const lg = Object.keys(FAM).filter(f=>st.fam[f]).map(f=>L('in', `\\text{${FAM[f].label}}`, FAM[f].lg)).join('') + L('slate','\\text{limit}',true);
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lg)}`
        : `<div class="plot-wrap">${a.svg()}<div class="legend in-plot">${lg}</div></div>`;

      /* One row a family at the ringed M: the energy it needs and the band it
         takes at a fixed bit rate, the band also as a bar on one scale. */
      const row = 'display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1fr) minmax(0,1.7fr);gap:14px;align-items:center;padding:7px 16px';
      const ro = root.querySelector('.ro');
      ro.style.gridTemplateColumns = '1fr';
      ro.innerHTML = M(`<div style="${row}"><dt style="margin:0">$M=${Mh}$</dt><dt style="margin:0">$E_b/N_0$</dt><dt style="margin:0">Band $W/R_b$</dt></div>`
        + Object.keys(FAM).map(f=>{
          const ok = FAM[f].Ms.includes(Mh), on = st.fam[f], wv = ok ? 1/rw(f, Mh) : 0;
          return `<div style="${row};opacity:${on ? 1 : 0.4}"><dt style="margin:0">${FAM[f].label}</dt>`
            + `<dd>${ok ? N(dB(need(f, Mh, pe)),1) + ' dB' : 'none'}</dd>`
            + `<dd style="display:flex;align-items:center;gap:10px"><span style="flex:0 0 3.3em">${ok ? N(wv,3) : '…'}</span>`
            + `<i style="display:block;height:calc(11px * var(--ts));border-radius:2px;background:var(--sig-in);width:calc((100% - 3.3em) * ${Math.min(1, wv/6).toFixed(4)})"></i></dd></div>`;
        }).join(''));
      const d5 = dB(need('qam', 16, 1e-5)), dT = dB(need('qam', 16, pe));
      root.querySelector('.derive').innerHTML = M(Math.abs(shown + 5) > 0.01
        ? `<div class="note warn"><span class="note-h">Target $10^{${fmt(shown,2)}}$</span>Every point moves sideways by about the same amount, ${N(dT - d5,2)} dB for 16-QAM from $10^{-5}$. The bands do not change.</div>`
        : `<div class="note ok"><span class="note-h">Two directions</span>PAM, PSK and QAM climb to the right: more bits a hertz cost more energy a bit. Orthogonal FSK moves down and left: it saves energy and spends band.</div>`);
    }

    function drawAdaptive(root, ph, gh){
      const target = Math.pow(10, TG[st.tgt]);
      const th = AD.map(s=>thresh(s, target));
      const YOFF = 10, ylo = -8+YOFF, yhi = 45+YOFF;
      const Wt = ph ? 300 : 560, hT = ph ? 260 : gh(470), Ws = ph ? 300 : 300;
      const at = P.Axes({w:Wt,h:hT,xr:[0,SLOTS],yr:[ylo,yhi],xlabel:'\\text{time slot}',ylabel:'E_s/N_0\\;(\\mathrm{dB})',
        ytickfmt:v=>fmt(v-YOFF,2), zeroAxes:false, pad:{l:ph?44:56,r:ph?8:10,t:26,b:46}, xtarget:6, ytarget:6});
      const as = P.Axes({w:Ws,h:hT,xr:[0,9],yr:[ylo,yhi],xlabel:'\\text{bits a symbol}',ylabel:'',
        ytickfmt:()=>'', zeroAxes:false, pad:{l:ph?44:14,r:ph?12:18,t:26,b:46}, xticksOverride:[0,2,4,6,8], xtickfmt:v=>String(v)});
      th.forEach(v=>{ at.hline(v+YOFF,{color:P.COL.muted,dash:'2 4',opacity:0.8}); as.hline(v+YOFF,{color:P.COL.muted,dash:'2 4',opacity:0.8}); });
      const tr = []; for(let i=0;i<=SLOTS*6;i++){ const t = i/6; tr.push([t, trace(t, st.snr)+YOFF]); }
      const upto = tr.filter(p=>p[0] <= st.slot + 1e-9);
      at.poly(tr,{color:P.COL.rule,width:1.6});
      if(upto.length > 1) at.poly(upto,{color:P.COL.h,width:2.4});
      /* the scheme each slot used, as a step at the foot */
      const snrNow = trace(st.slot, st.snr), iNow = choose(snrNow, target);
      /* the staircase on its side: bits a symbol against the SNR */
      const stair = [[0, ylo]];
      AD.forEach((s,i)=>{ const prevK = i ? AD[i-1].k : 0; stair.push([prevK, th[i]+YOFF]); stair.push([s.k, th[i]+YOFF]); });
      stair.push([8, yhi]);
      as.poly(stair,{color:P.COL.out,width:2.4});
      AD.forEach((s,i)=>{ const top = i < AD.length-1 ? th[i+1] : Math.min(th[i]+6, 45);
        as.note(s.k, (th[i]+top)/2+YOFF, s.name, {fs:13.5, color:P.COL.out, anchor:i ? 'end' : 'start', dx:i ? -8 : 8, dy:5}); });
      at.hline(snrNow+YOFF,{color:P.COL.ink,dash:'5 4',width:1.4,opacity:0.9});
      as.hline(snrNow+YOFF,{color:P.COL.ink,dash:'5 4',width:1.4,opacity:0.9});
      at.point(st.slot, snrNow+YOFF, {color:P.COL.h, r:6.5, ring:P.COL.plate, ringw:1.8});
      as.point(iNow >= 0 ? AD[iNow].k : 0, snrNow+YOFF, {color:iNow >= 0 ? P.COL.out : P.COL.err, r:7, ring:P.COL.coral, ringw:2.2});
      const lg = `${L('h','\\text{channel}')}${L('slate','\\text{thresholds}',true)}`;
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${at.svg()}</div>${legendRow(lg)}<div class="plot-wrap">${as.svg()}</div>`
        : `<div style="display:flex;gap:0;align-items:flex-start">`
        + `<div class="plot-wrap" style="flex:0 0 ${(100*Wt/(Wt+Ws)).toFixed(3)}%;min-width:0">${at.svg()}<div class="legend in-plot">${lg}</div></div>`
        + `<div class="plot-wrap" style="flex:1 1 0;min-width:0">${as.svg()}</div></div>`;

      let bitsSum = 0, outage = 0;
      for(let t=0;t<=st.slot;t++){ const i = choose(trace(t, st.snr), target); if(i < 0) outage++; else bitsSum += AD[i].k; }
      const s = iNow >= 0 ? AD[iNow] : null;
      root.querySelector('.ro').style.gridTemplateColumns = ph ? '' : 'repeat(2,minmax(0,1fr))';
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>$E_s/N_0$ now</dt><dd>${N(snrNow,1)} dB</dd></div>
        <div><dt>Scheme</dt><dd class="${s ? 'okv' : 'warnv'}">${s ? s.name : 'none'}</dd></div>
        <div><dt>$P_b$ now</dt><dd>${s ? pH(pb(s, lin(snrNow))) : '…'}</dd></div>
        <div><dt>Average bits a symbol</dt><dd>${N(bitsSum/(st.slot+1),2)}</dd></div>`);
      root.querySelector('.derive').innerHTML = M(s
        ? `<div class="note ok"><span class="note-h">Adaptive modulation</span>The link sends the densest scheme whose $P_b$ stays under $10^{${TG[st.tgt]}}$. When the channel fades, it steps down and the link stays up.</div>`
        : `<div class="note err"><span class="note-h">Outage</span>The ratio is under the BPSK threshold of ${N(th[0],1)} dB. No scheme meets the target, so this slot carries nothing.</div>`);
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const plane = st.view === 'plane';
      if(plane) drawPlane(root, ph, gh); else drawAdaptive(root, ph, gh);
      root.querySelectorAll('[data-for]').forEach(e=>{ e.style.display = e.dataset.for !== st.view ? 'none' : ''; });
      root.querySelector('[data-out=hk]').textContent = String(1 << st.hk);
      root.querySelector('[data-out=snr]').textContent = String(st.snr);
      root.querySelector('[data-out=tgt]').innerHTML = T(`10^{${fmt(TG[st.tgt],2)}}`, false);
      const sl = root.querySelector('[data-v=phase]');
      sl.max = String(plane ? TG.length-1 : SLOTS); sl.value = String(plane ? st.tgt : st.slot);
      root.querySelector('[data-out=phase]').innerHTML = plane ? T(`10^{${fmt(TG[st.tgt],2)}}`, false) : String(st.slot);
      root.querySelector('[data-phase-name]').innerHTML = M(plane ? 'Target $P_e$' : 'Time slot');
      root.querySelectorAll('[data-seg]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val === st[b.dataset.seg])));
      root.querySelectorAll('[data-fam]').forEach(b=>b.setAttribute('aria-pressed', String(!!st.fam[b.dataset.fam])));
    }

    const core = { need, rw, nmin, shannon, pb, thresh, choose, trace, AD, FAM, TG };

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="ctrls one" style="padding:10px 20px"><div class="ctrl"><div class="ctrl-run">
              <label style="flex:0 0 auto"><span data-phase-name>Target</span><span class="val" data-out="phase">4</span></label>
              <input type="range" data-v="phase" min="0" max="8" step="1" value="4">
              ${LABS.KIT.runbar()}</div></div></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl"><label><span>View</span></label><span class="seg" style="align-self:flex-start">
                <button data-seg="view" data-val="plane">plane</button><button data-seg="view" data-val="adaptive">adaptive</button></span></div>
              <div class="ctrl" data-for="plane"><label><span>Ring on $M$</span><span class="val" data-out="hk">16</span></label>
                <input type="range" data-v="hk" min="1" max="6" step="1" value="4"></div>
              <div class="ctrl" data-for="adaptive"><label><span>Mean $E_s/N_0$, dB</span><span class="val" data-out="snr">20</span></label>
                <input type="range" data-v="snr" min="4" max="32" step="1" value="20"></div>
              <div class="ctrl" style="grid-column:1/-1" data-for="plane"><label><span>Families</span><span class="seg">
                ${Object.keys(FAM).map(f=>`<button data-fam="${f}" aria-pressed="true">${FAM[f].label}</button>`).join('')}</span></label></div>
              <div class="ctrl" style="grid-column:1/-1" data-for="adaptive"><label><span>Target $P_b$</span><span class="val" data-out="tgt">1e-5</span></label>
                <input type="range" data-v="tgt" min="0" max="8" step="1" value="4"></div>
            </div>
            <dl class="readout ro" ${RO(2)}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const kk = e.target.dataset.v; if(!kk) return;
        const v = parseInt(e.target.value,10);
        if(kk === 'phase'){ if(st.view === 'plane'){ st.tgt = v; tween(root, TG[v]); return; } st.slot = v; }
        else if(kk === 'tgt'){ st.tgt = v; shown = TG[v]; }
        else st[kk] = v;
        draw(root); });
      root.addEventListener('click', e=>{
        const b = e.target.closest('[data-seg]');
        if(b){ st[b.dataset.seg] = b.dataset.val; shown = TG[st.tgt]; draw(root); return; }
        const f = e.target.closest('[data-fam]');
        if(f){ const on = Object.keys(st.fam).filter(x=>st.fam[x]);
               if(!(on.length === 1 && st.fam[f.dataset.fam])) st.fam[f.dataset.fam] = !st.fam[f.dataset.fam];
               draw(root); }
      });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', ms:320, get max(){ return st.view === 'plane' ? TG.length-1 : SLOTS; },
        get:()=>st.view === 'plane' ? st.tgt : st.slot,
        set:v=>{ if(st.view === 'plane'){ st.tgt = v; shown = TG[v]; } else st.slot = v; },
        redraw:()=>draw(root) });
    }};
  })();

  return { H, X, Y, Z, BW };
})());
