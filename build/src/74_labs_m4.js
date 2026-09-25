/* ==========================================================================
   Module 4 laboratories.

   U · The correlator bank (section 4.1) — one symbol of a two-dimensional
       set is sent through white Gaussian noise. The noisy r(t) is drawn, the
       two correlators integrate it over 0 < t < T, and at t = T the point
       (r1, r2) lands in the signal space beside the point that was sent.
       Sending again builds up the cloud the detector has to divide.
   V · The MAP detector (section 4.2) — binary antipodal signalling with
       unequal priors. The two weighted likelihoods, the threshold, the two
       error areas and a live stream of simulated symbols, with the threshold
       set by the ML rule, by the MAP rule or by hand.
   G · Constellations and decision regions (section 4.3) — the reader chooses
       a constellation, drags its points and sets the noise; the regions are
       drawn from the minimum-distance rule, the observations are scattered and
       counted, and the count is set beside the union bound.
   W · Error bounds against simulation (section 4.4) — the general union
       bound, the intelligent union bound, the nearest-neighbour form, the
       minimum-distance bound and the exponential bound against Es/N0, with a
       Monte Carlo run that fills in the measured points batch by batch.

   The measured rates and the formulas are computed by different routes on
   purpose: the formulas from distances and Q, the measurements from noise,
   a nearest-point search and a count. A simulation that agreed with a bound
   by construction would prove nothing.

   Every card a laboratory draws follows the slide card language: a computed
   equation takes a coral tab naming what it computes, a note keeps its
   kind's tab and icon. `core` on each laboratory exposes the formulas it
   computes, so verify/verify_labs_m4.py can compare them with scipy.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F, GH = LABS.KIT.GH;
  const P = PLOT;
  const N = (v,d=3) => fmt(v,d);

  /* Same phone/legend pattern as the laboratories of Modules 1 to 3. */
  const PHONE = () => APP.state.layout === 'phone';
  const REDUCED = () => APP.state.motion === 'reduced';
  const legendRow = (...items) => `<div class="legend">${items.join('')}</div>`;
  const L = (c,l,dash)=>`<i class="lg-${c}${dash?' lg-dash':''}">${T(l,false)}</i>`;
  const LD = (c,l)=>`<i class="lg-${c} lg-dot">${T(l,false)}</i>`;

  /* ---- numbers ----------------------------------------------------------- */
  /* mulberry32, as in the other modules: every random figure is the same
     figure on every machine and in every render. */
  function rng(seed){ let a=seed>>>0; return function(){
    a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  /* A standard normal stream from one generator, both Box-Muller outputs
     used, so a stream continued across batches is the same stream as one
     drawn in a single run. */
  function normalStream(r){ let spare = null;
    return () => { if(spare !== null){ const s = spare; spare = null; return s; }
      const u = Math.max(1e-12, r()), v = r(), m = Math.sqrt(-2*Math.log(u));
      spare = m*Math.sin(2*Math.PI*v); return m*Math.cos(2*Math.PI*v); }; }
  /* erfc to a relative error below 1.2e-7 everywhere (a Chebyshev fit), so a
     bound near 1e-6 is read to its third digit. The polynomial form used by
     some older laboratories is good to 7.5e-8 absolute, which is a third of
     the value itself down there. */
  function erfc(x){
    const z = Math.abs(x), t = 1/(1+0.5*z);
    const r = t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+
      t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
    return x >= 0 ? r : 2-r;
  }
  const Q = x => 0.5*erfc(x/Math.SQRT2);

  /* A probability as TeX: four decimals down to 0.01, then three figures
     times a power of ten. */
  function pTeX(v){
    if(!(v > 0)) return '0';
    if(v >= 0.01) return fmt(v,4);
    let e = Math.floor(Math.log10(v)), m = v/Math.pow(10,e);
    m = Math.round(m*100)/100; if(m >= 10){ m /= 10; e++; }
    return `${m.toFixed(2)}\\times10^{${e}}`;
  }
  /* The same in a readout: plain digits where they suffice, so a column of
     values reads in one type, and typeset only for a power of ten. */
  const pH = v => (!(v > 0) || v >= 0.01) ? fmt(v, 4) : T(pTeX(v), false);
  const RO3 = 'style="grid-template-columns:repeat(3,minmax(0,1fr))"';
  /* On a phone a row of segmented buttons wraps instead of running off the
     screen, and a readout keeps the stylesheet's own two columns. */
  function phoneTidy(root){
    if(!PHONE()) return;
    root.querySelectorAll('.seg').forEach(s=>{ s.style.flexWrap = 'wrap'; });
    root.querySelectorAll('.readout').forEach(d=>{ d.style.gridTemplateColumns = ''; });
  }
  /* A signal colour at a chosen opacity, read from the palette in force, so
     a shaded error area follows the theme like everything else. */
  function tint(hex, a){
    const h = String(hex).replace('#','');
    if(h.length !== 6) return hex;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }

  /* ---- constellations ------------------------------------------------------ */
  const PSK = (n, off) => Array.from({length:n}, (_,k)=>{ const a = off + 2*Math.PI*k/n; return [Math.cos(a), Math.sin(a)]; });
  const SETS = {
    binary: { label:'binary', dim:1, raw:[[-1,0],[1,0]] },
    pam4:   { label:'4-PAM',  dim:1, raw:[[-3,0],[-1,0],[1,0],[3,0]] },
    qpsk:   { label:'QPSK',   dim:2, raw:PSK(4, Math.PI/4) },
    psk8:   { label:'8-PSK',  dim:2, raw:PSK(8, 0) },
    five:   { label:'5-point', dim:2, raw:[[0,0],[1,0],[0,1],[-1,0],[0,-1]] },
    qam16:  { label:'16-QAM', dim:2, raw:[].concat(...[-3,-1,1,3].map(y=>[-3,-1,1,3].map(x=>[x,y]))) }
  };

  /* The Voronoi cell of point i inside a box, by clipping the box with the
     half-plane of every perpendicular bisector (Sutherland-Hodgman). Each
     edge carries the index of the point whose bisector made it, so the same
     pass says which points share a face with i: the neighbours the
     intelligent union bound keeps. A face of zero length (two squares that
     touch at a corner) is not a face. */
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

  /* Everything a bound needs, from the points alone. `nbs[i]` is the set of
     points sharing a face with i, found in a box far outside the
     constellation so that the unbounded faces of the outer points count. */
  function geometry(pts){
    const Mn = pts.length;
    const d = pts.map(p=>pts.map(q=>Math.hypot(p[0]-q[0], p[1]-q[1])));
    let dmin = Infinity;
    for(let i=0;i<Mn;i++) for(let j=0;j<Mn;j++) if(i!==j && d[i][j] < dmin) dmin = d[i][j];
    let near = 0;
    for(let i=0;i<Mn;i++) for(let j=0;j<Mn;j++) if(i!==j && d[i][j] < dmin*(1+1e-9)) near++;
    const R = 1000*(1+Math.max(...pts.map(p=>Math.hypot(p[0],p[1]))));
    const nbs = pts.map((_,i)=>cellOf(pts, i, [-R,R,-R,R]).nb);
    const Eavg = pts.reduce((s,p)=>s+p[0]*p[0]+p[1]*p[1],0)/Mn;
    return { pts, M:Mn, d, dmin, Nmin:near/Mn, nbs, Eavg };
  }
  function unitSet(key){
    const S = SETS[key];
    const e = S.raw.reduce((s,p)=>s+p[0]*p[0]+p[1]*p[1],0)/S.raw.length;
    const k = 1/Math.sqrt(e);
    return Object.assign(geometry(S.raw.map(p=>[p[0]*k, p[1]*k])), { dim:S.dim, label:S.label, key });
  }

  /* The five forms of section 4.4 at one noise level. Average energy is not
     assumed to be one: N0 is passed in, the distances carry the scale. */
  function bounds(g, N0){
    const q = dd => Q(dd/Math.sqrt(2*N0));
    let gen = 0, intel = 0;
    for(let i=0;i<g.M;i++) for(let j=0;j<g.M;j++){
      if(i===j) continue;
      const t = q(g.d[i][j]);
      gen += t; if(g.nbs[i].has(j)) intel += t;
    }
    return { general:gen/g.M, intelligent:intel/g.M, nearest:g.Nmin*q(g.dmin),
             dmin:(g.M-1)*q(g.dmin), expo:(g.M-1)/2*Math.exp(-g.dmin*g.dmin/(4*N0)) };
  }

  /* Region colours. Neighbouring regions never share a colour: a greedy
     colouring of the face graph over the four symbol colours. Red is kept
     for errors and never colours a symbol. */
  function colouring(g){
    const c = [];
    for(let i=0;i<g.M;i++){
      const used = new Set([...g.nbs[i]].filter(j=>j<i).map(j=>c[j]));
      let k = 0; while(used.has(k)) k++;
      c.push(k % 4);
    }
    return c;
  }
  const SYM = () => [P.COL.in, P.COL.h, P.COL.mid, P.COL.out];
  const DEC = () => [P.COL.dec.in, P.COL.dec.h, P.COL.dec.mid, P.COL.dec.out];

  /* One unit is the same length on both axes, so a circle stays a circle and
     a bisector stays perpendicular: the first pass measures the data area,
     the second widens the longer range (as Laboratory S of Module 3). */
  function eqAxes(o, lim){
    const pr = P.Axes(Object.assign({}, o, {xr:[-lim,lim], yr:[-lim,lim]}));
    const kx = (pr.x1-pr.x0)/(2*lim), ky = (pr.y0-pr.y1)/(2*lim), k = Math.min(kx,ky);
    const hx = (pr.x1-pr.x0)/k/2, hy = (pr.y0-pr.y1)/k/2;
    return P.Axes(Object.assign({}, o, {xr:[-hx,hx], yr:[-hy,hy]}));
  }
  const pathOf = (a, poly) => 'M' + poly.map(p=>a.sx(p[0]).toFixed(2)+','+a.sy(p[1]).toFixed(2)).join('L') + 'Z';
  /* Regions under the axes: a low-opacity fill of each symbol's colour, with
     a hairline boundary in the rule tone. */
  function regions(a, pts, cols){
    const box = [a.o.xr[0], a.o.xr[1], a.o.yr[0], a.o.yr[1]], dec = DEC();
    pts.forEach((_,i)=>{
      const c = cellOf(pts, i, box);
      if(c.poly.length < 3) return;
      a.under(`<path d="${pathOf(a, c.poly)}" fill="${dec[cols[i]]}" stroke="${P.COL.ruleStrong}" stroke-width="1"/>`);
    });
  }
  const nearest = (pts, x, y) => { let best = 0, bd = Infinity;
    for(let k=0;k<pts.length;k++){ const dd = (x-pts[k][0])**2 + (y-pts[k][1])**2; if(dd < bd){ bd = dd; best = k; } }
    return best; };

  /* =======================================================================
     U · FROM WAVEFORM TO POINT
     One symbol, one noise waveform, two correlators. The noise is drawn as a
     staircase of NC independent levels; its level is set so that each
     correlator output has variance exactly N0/2, which is what white noise
     of two-sided density N0/2 gives an orthonormal basis.
     ======================================================================= */
  const U = (() => {
    const NC = 24, SUB = 25, NF = NC*SUB, dt = 1/NF, DC = 1/NC, FC = 2;
    const tAt = i => (i+0.5)*dt;
    const R2 = Math.SQRT2;
    const BASES = {
      carrier: [t => R2*Math.cos(2*Math.PI*FC*t), t => R2*Math.sin(2*Math.PI*FC*t)],
      halves:  [t => t < 0.5 ? R2 : 0,            t => t >= 0.5 ? R2 : 0]
    };
    const USETS = {
      qpsk:   { label:'QPSK',       basis:'carrier', pts:PSK(4, Math.PI/4) },
      psk8:   { label:'8-PSK',      basis:'carrier', pts:PSK(8, 0) },
      pulses: { label:'pulses',     basis:'halves',  pts:[[1,1],[-1,1],[-1,-1],[1,-1]].map(p=>[p[0]/R2, p[1]/R2]) },
      orth:   { label:'orthogonal', basis:'halves',  pts:[[1,0],[0,1]] }
    };
    /* Each basis sampled on the fine grid, and its integral over every
       noise cell: the numbers a noise staircase is projected with. */
    const PRE = {};
    Object.keys(BASES).forEach(k=>{
      const psi = BASES[k].map(f=>Float64Array.from({length:NF}, (_,i)=>f(tAt(i))));
      const c = psi.map(p=>Array.from({length:NC}, (_,m)=>{ let s = 0; for(let i=m*SUB;i<(m+1)*SUB;i++) s += p[i]*dt; return s; }));
      /* Σ c² is DC for a basis that is flat on every cell and a little less
         for the carrier; kappa restores the variance N0/2 exactly. */
      const ss = c.map(cc=>cc.reduce((s,v)=>s+v*v,0));
      PRE[k] = { psi, c, kappa: Math.sqrt(DC/((ss[0]+ss[1])/2)) };
    });

    let st = { set:'qpsk', esn0:6, m:1 };
    let hist = [], last = null, sends = 0, phase = 1.4, raf = 0, runLeft = 0;
    const SEED = 20260924;

    function set(){ return USETS[st.set]; }
    function N0(){ return Math.pow(10, -st.esn0/10); }

    /* Send symbol m once with noise realisation k. Everything the figure and
       the count need comes out of this one function, so the point that lands
       at t = T is the point the detector decides on. */
    function send(k, m){
      const S = set(), pre = PRE[S.basis], s = S.pts[m];
      const nz = normalStream(rng(SEED + 7919*k));
      const lev = pre.kappa*Math.sqrt(N0()/(2*DC));
      const w = Array.from({length:NC}, ()=>lev*nz());
      const r = [0,1].map(j=>s[j] + w.reduce((a,v,c)=>a+v*pre.c[j][c], 0));
      const dec = nearest(S.pts, r[0], r[1]);
      return { m, w, r, dec, ok: dec === m };
    }
    function record(o){ hist.push({ m:o.m, r:o.r, ok:o.ok }); if(hist.length > 1500) hist.shift(); }
    let total = 0, wrong = 0;
    function clear(){ hist = []; total = 0; wrong = 0; }
    function commit(o){ record(o); total++; if(!o.ok) wrong++; }

    function stop(){ if(raf) cancelAnimationFrame(raf); raf = 0; runLeft = 0; }
    function sendNow(root, animate){
      stop();
      last = send(sends++, st.m - 1);
      commit(last);
      if(!animate || REDUCED()){ phase = 1.4; draw(root); return; }
      phase = 0; let t0 = 0;
      const tick = now => {
        if(!root.isConnected){ raf = 0; return; }
        if(!t0) t0 = now;
        phase = Math.min(1.4, (now - t0)/1500*1.4);
        draw(root);
        raf = phase < 1.4 ? requestAnimationFrame(tick) : 0;
      };
      raf = requestAnimationFrame(tick);
    }
    /* Two hundred symbols of the chosen kind, ten a frame, so the cloud grows
       in view in about a third of a second. */
    function run(root, n){
      stop();
      const batch = k => { for(let i=0;i<k;i++){ last = send(sends++, st.m - 1); commit(last); } };
      phase = 1.4;
      if(REDUCED()){ batch(n); draw(root); return; }
      runLeft = n;
      const tick = () => {
        if(!root.isConnected){ raf = 0; runLeft = 0; return; }
        const k = Math.min(10, runLeft); batch(k); runLeft -= k;
        draw(root);
        raf = runLeft > 0 ? requestAnimationFrame(tick) : 0;
      };
      raf = requestAnimationFrame(tick);
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const S = set(), pre = PRE[S.basis], pts = S.pts, Mn = pts.length;
      const g = geometry(pts), cols = colouring(g), SC = SYM();
      if(!last) { last = send(sends++, st.m - 1); commit(last); }
      const tc = Math.min(1, phase);                     /* the time cursor, t/T */
      const iC = Math.round(tc*NF);                      /* fine samples integrated */
      const s = pts[last.m];
      const sF = i => s[0]*pre.psi[0][i] + s[1]*pre.psi[1][i];
      const rF = i => sF(i) + last.w[Math.min(NC-1, Math.floor(i/SUB))];

      /* running correlator outputs, sampled every 5 fine steps */
      const y = [[[0,0]],[[0,0]]], acc = [0,0];
      for(let i=0;i<iC;i++){
        const r = rF(i);
        acc[0] += r*pre.psi[0][i]*dt; acc[1] += r*pre.psi[1][i]*dt;
        if((i+1) % 5 === 0 || i === iC-1){ y[0].push([(i+1)*dt, acc[0]]); y[1].push([(i+1)*dt, acc[1]]); }
      }
      const landed = phase >= 1;
      const rr = landed ? last.r : acc;

      /* ---- the time panels: r(t) over the correlator outputs ---- */
      /* The two time panels share one time axis, one above the other. The
         signal space beside them is as tall as the pair and keeps one unit the
         same length on both axes, because a stretched plane would bend the
         bisectors it is about; the taller range simply shows more of it. */
      const W1 = ph ? 300 : 500;
      const hA = ph ? 190 : gh(185), hB = ph ? 190 : gh(195);
      const peak = Math.max(1.6, ...Array.from({length:NF}, (_,i)=>Math.abs(rF(i))))*1.12;
      /* The traces cross zero, so the time ticks are numbered at the foot of
         each panel rather than on the zero line, clear of the noise. */
      const TT = [0.25,0.5,0.75,1];
      const footTicks = (ax, ylo) => TT.forEach(v=>{
        ax.raw(`<line x1="${ax.sx(v).toFixed(2)}" y1="${ax.y0.toFixed(2)}" x2="${ax.sx(v).toFixed(2)}" y2="${(ax.y0+5).toFixed(2)}" stroke="${P.COL.axis}" stroke-width="1.2"/>`);
        /* the last tick is left unnumbered: t/T sits at the end of the axis */
        if(v < 1) ax.note(v, ylo, fmt(v,2), {fs:13.5, color:P.COL.muted, anchor:'middle', dy:20}); });
      const a1 = P.Axes({w:W1,h:hA,xr:[0,1],yr:[-peak,peak],xlabel:'t/T',ylabel:'r(t),\\;s_m(t)',
        pad:{l:ph?42:52,r:ph?14:18,t:24,b:40},xtarget:4,ytarget:3,xticksOverride:TT,xtickfmt:()=>''});
      footTicks(a1, -peak);
      a1.curve(t=>sF(Math.min(NF-1, Math.floor(t*NF))),{color:P.COL.in,width:1.8,dash:'6 4',n:400});
      const rp = []; for(let i=0;i<iC;i++) rp.push([tAt(i), rF(i)]);
      if(iC > 1) a1.poly(rp,{color:P.COL.out,width:1.7});
      if(!landed) a1.vline(tc,{color:P.COL.muted,dash:'2 3',opacity:0.9});

      const ylim = Math.max(1.3, ...pts.map(p=>Math.max(Math.abs(p[0]),Math.abs(p[1]))), Math.abs(last.r[0]), Math.abs(last.r[1]))*1.25;
      const a2 = P.Axes({w:W1,h:hB,xr:[0,1],yr:[-ylim,ylim],xlabel:'t/T',ylabel:'\\text{correlator outputs}',
        pad:{l:ph?42:52,r:ph?44:50,t:24,b:40},xtarget:4,ytarget:4,xticksOverride:TT,xtickfmt:()=>''});
      footTicks(a2, -ylim);
      [0,1].forEach(j=>a2.poly([[0,s[j]],[1,s[j]]],{color:P.COL.in,width:1.1,dash:'2 4'}));
      a2.poly(y[0],{color:P.COL.mid,width:2.2});
      a2.poly(y[1],{color:P.COL.mid,width:2.2,dash:'7 5'});
      if(landed){
        /* the two end labels are pushed apart when the values are close */
        const need = 20*P.labelScale(), y1p = a2.sy(last.r[0]), y2p = a2.sy(last.r[1]);
        const mid = (y1p+y2p)/2, sep = Math.max(need, Math.abs(y1p-y2p));
        const at = [y1p <= y2p ? mid-sep/2 : mid+sep/2, y1p <= y2p ? mid+sep/2 : mid-sep/2];
        [0,1].forEach(j=>{ a2.point(1, last.r[j], {color:P.COL.mid, r:4.5});
          a2.note(1, last.r[j], `r_${j+1}`, {tex:true, fs:15, color:P.COL.mid, dx:10, dy:at[j]-(j?y2p:y1p)}); });
      } else a2.vline(tc,{color:P.COL.muted,dash:'2 3',opacity:0.9});

      /* ---- the signal space ---- */
      const Wc = ph ? 300 : 460, hC = ph ? 300 : hA + hB;
      const lim = 1.75;
      const ac = eqAxes({w:Wc,h:hC,xlabel:'\\psi_1',ylabel:'\\psi_2',
        pad:{l:ph?40:48,r:ph?14:18,t:26,b:42},xtarget:4,ytarget:4}, lim);
      regions(ac, pts, cols);
      const xr = ac.o.xr, yr = ac.o.yr;
      const inBox = (x,y) => x > xr[0] && x < xr[1] && y > yr[0] && y < yr[1];
      hist.slice(-900, landed ? undefined : -1).forEach(h=>{
        if(!inBox(h.r[0],h.r[1])) return;
        ac.point(h.r[0], h.r[1], {color: h.ok ? P.COL.noise : P.COL.err, r: h.ok ? 2.2 : 3, ring:'none'});
      });
      pts.forEach((p,k)=>{
        ac.point(p[0],p[1],{color:SC[cols[k]], r:7, ring:P.COL.plate, ringw:2});
        const rad = Math.hypot(p[0],p[1]) || 1, ux = p[0]/rad, uy = p[1]/rad;
        const lx = p[0] + ux*0.34, ly = p[1] + uy*0.34;
        ac.note(lx, ly, `\\mathbf{s}_{${k+1}}`, {tex:true, fs:18, color:SC[cols[k]], anchor:'middle', dy:6});
      });
      /* the point being built: from the origin along the running integrals */
      const trace = y[0].map((p,i)=>[p[1], y[1][i][1]]);
      ac.poly(trace,{color:P.COL.mid,width:1.4,dash:'3 3'});
      ac.point(s[0], s[1], {color:'none', r:12, ring:P.COL.coral, ringw:2});
      if(landed){
        const grow = Math.min(1, (phase-1)/0.25);
        const c = cellOf(pts, last.dec, [xr[0],xr[1],yr[0],yr[1]]);
        ac.raw(`<path d="${pathOf(ac, c.poly)}" fill="none" stroke="${last.ok ? P.COL.out : P.COL.err}" stroke-width="${2.6}" opacity="${grow.toFixed(2)}"/>`);
        ac.point(rr[0], rr[1], {color:P.COL.out, r:4+3*grow, ring:P.COL.plate, ringw:1.6});
      } else {
        ac.point(rr[0], rr[1], {color:P.COL.mid, r:5, ring:P.COL.plate, ringw:1.4});
      }

      const nest = (svg, yy, h) => svg.replace('<svg ', `<svg x="0" y="${yy}" width="${W1}" height="${h}" `);
      const lgA = `${L('in','s_m(t)',true)}${L('out','r(t)')}`;
      const lgB = `${L('mid','r_1(t)')}${L('mid','r_2(t)',true)}`;
      if(ph){
        root.querySelector('.plots').innerHTML =
          `<div class="plot-wrap">${a1.svg()}</div>${legendRow(lgA)}`
          + `<div class="plot-wrap">${a2.svg()}</div>${legendRow(lgB)}`
          + `<div class="plot-wrap">${ac.svg()}</div>`;
      } else {
        const both = `<svg viewBox="0 0 ${W1} ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${nest(a1.svg(),0,hA)}${nest(a2.svg(),hA,hB)}</svg>`;
        const tot = W1 + Wc;
        root.querySelector('.plots').innerHTML =
          `<div style="display:flex;gap:14px;align-items:flex-start">`
          + `<div class="plot-wrap" style="flex:0 0 calc((100% - 14px)*${(W1/tot).toFixed(4)});min-width:0">${both}`
          + `<div class="legend in-plot" style="top:2px">${lgA}</div>`
          + `<div class="legend in-plot" style="top:calc(100% * ${(hA/(hA+hB)).toFixed(4)} + 2px)">${lgB}</div></div>`
          + `<div class="plot-wrap" style="flex:1 1 0;min-width:0">${ac.svg()}</div></div>`;
      }

      const dec = last.dec, ok = last.ok;
      const sym = k => `$\\mathbf{s}_{${k+1}}$`;
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Sent</dt><dd>${sym(last.m)}</dd></div>
        <div><dt>$r_1$</dt><dd>${landed ? N(rr[0],3) : '…'}</dd></div>
        <div><dt>$r_2$</dt><dd>${landed ? N(rr[1],3) : '…'}</dd></div>
        <div><dt>Nearest point</dt><dd class="${landed ? (ok?'okv':'warnv') : ''}">${landed ? sym(dec) : '…'}</dd></div>
        <div><dt>Symbols sent</dt><dd>${total}</dd></div>
        <div><dt>Wrong decisions</dt><dd class="${wrong?'warnv':''}">${wrong} of ${total}</dd></div>`);

      root.querySelector('.derive:not(.verdict)').innerHTML = M(`
        <div class="eq"><span class="eq-label">Correlator outputs</span>${T(landed
          ? `\\mathbf{r}=\\mathbf{s}_{${last.m+1}}+\\mathbf{n}=(${N(rr[0],3)},\\,${N(rr[1],3)})`
          : `r_j(t)=\\int_0^{t} r(\\tau)\\,\\psi_j(\\tau)\\,d\\tau`, true)}</div>
        ${!landed
          ? `<div class="note def"><span class="note-h">Integrating</span>Each correlator multiplies $r(t)$ by its basis function and adds up the product until $t=T$.</div>`
          : ok
          ? `<div class="note ok"><span class="note-h">Correct decision</span>$\\mathbf{r}$ fell in the region of ${sym(last.m)}, so the nearest point is the one sent.</div>`
          : `<div class="note err"><span class="note-h">Wrong decision</span>The noise carried $\\mathbf{r}$ across a boundary into the region of ${sym(dec)}.</div>`}`);

      root.querySelector('[data-v=m]').max = String(Mn);
      root.querySelector('[data-v=m]').value = String(st.m);
      root.querySelector('[data-out=m]').textContent = String(st.m);
      root.querySelector('[data-out=esn0]').textContent = String(st.esn0);
      root.querySelectorAll('[data-seg=set]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.set)));
    }

    return { core:{ send:(k,m,setKey,esn0)=>{ const o = st; st = {set:setKey, esn0, m:m+1}; const r = send(k,m); st = o; return r; },
                    kappa:k=>PRE[k].kappa, cells:k=>PRE[k].c, NC, DC },
      mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Signal set</span><span class="seg">
                ${Object.keys(USETS).map(k=>`<button data-seg="set" data-val="${k}">${USETS[k].label}</button>`).join('')}</span></label></div>
              <div class="ctrl"><label><span>$E_s/N_0$, dB</span><span class="val" data-out="esn0">6</span></label>
                <input type="range" data-v="esn0" min="0" max="14" step="1" value="6"></div>
              <div class="ctrl"><label><span>Symbol $m$</span><span class="val" data-out="m">1</span></label>
                <input type="range" data-v="m" min="1" max="4" step="1" value="1"></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>Transmit</span><span class="seg">
                <button data-do="send">Send</button><button data-do="run">Run 200</button><button data-do="clear">Clear</button></span></label></div>
            </div>
            <dl class="readout ro" ${RO3}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        st[k] = parseInt(e.target.value,10);
        if(k === 'esn0'){ stop(); clear(); last = null; phase = 1.4; draw(root); }
        else sendNow(root, false); });
      root.addEventListener('click', e=>{
        const b = e.target.closest('[data-seg=set]');
        if(b){ stop(); st.set = b.dataset.val; st.m = Math.min(st.m, USETS[st.set].pts.length);
               clear(); last = null; phase = 1.4; draw(root); return; }
        const d = e.target.closest('[data-do]'); if(!d) return;
        if(d.dataset.do === 'send') sendNow(root, true);
        else if(d.dataset.do === 'run') run(root, 200);
        else { stop(); clear(); last = null; phase = 1.4; draw(root); }
      });
      stop(); phase = 1.4;
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     V · THE MAP DETECTOR
     Binary antipodal signalling, s1 = +sqrt(Eb) and s2 = -sqrt(Eb), in
     noise of variance N0/2. Decide s1 when r > tau. The MAP threshold is
     tau = N0/(4 sqrt(Eb)) ln(P(s2)/P(s1)); ML puts it at 0.
     ======================================================================= */
  const V = (() => {
    const A = 1;                                   /* sqrt(Eb): the unit */
    let st = { prior:80, ebn0:1, mode:'map', tau:0 };
    let run = null, raf = 0;

    const core = {
      tauMAP: (p1, N0) => N0/(4*A)*Math.log((1-p1)/p1),
      pe: (tau, p1, N0) => { const s = Math.sqrt(N0/2); return p1*Q((A-tau)/s) + (1-p1)*Q((tau+A)/s); }
    };
    const par = () => { const p1 = st.prior/100, N0 = Math.pow(10,-st.ebn0/10);
      const tMap = core.tauMAP(p1, N0);
      const tau = st.mode==='ml' ? 0 : st.mode==='map' ? tMap : st.tau/100;
      return { p1, p2:1-p1, N0, sig:Math.sqrt(N0/2), tMap, tau }; };

    /* The stream: one generator for the symbols and the noise, restarted
       whenever the prior, the noise or the threshold change, because the
       count it keeps is a measurement of one setting. */
    function fresh(){ const r = rng(4747); return { r, nz:normalStream(r), n:0, k:0, recent:[] }; }
    function step(q, n){
      for(let i=0;i<n;i++){
        const one = run.r() < q.p1;
        const r = (one ? A : -A) + q.sig*run.nz();
        const ok = (r > q.tau) === one;
        run.n++; if(!ok) run.k++;
        run.recent.push({ r, ok }); if(run.recent.length > 48) run.recent.shift();
      }
    }
    function stopRun(){ if(raf) cancelAnimationFrame(raf); raf = 0; }
    function play(root){
      if(raf){ stopRun(); draw(root); return; }
      if(!run) run = fresh();
      if(REDUCED()){ step(par(), 2000); draw(root); return; }
      const tick = () => {
        if(!root.isConnected){ raf = 0; return; }
        const q = par();
        /* slow at first, so single symbols can be followed, then faster */
        step(q, run.n < 40 ? 1 : run.n < 400 ? 4 : 12);
        draw(root);
        raf = run.n < 20000 ? requestAnimationFrame(tick) : 0;
        if(!raf) draw(root);
      };
      raf = requestAnimationFrame(tick);
      draw(root);
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const q = par();
      const f = (r, m) => Math.exp(-(r-m)*(r-m)/(2*q.sig*q.sig))/(q.sig*Math.sqrt(2*Math.PI));
      const w1 = r => q.p1*f(r, A), w2 = r => q.p2*f(r, -A);
      const top = Math.max(q.p1, q.p2)/(q.sig*Math.sqrt(2*Math.PI));
      const X = 3.2;
      const pe = core.pe(q.tau, q.p1, q.N0), peMap = core.pe(q.tMap, q.p1, q.N0), peMl = core.pe(0, q.p1, q.N0);

      /* Two panels on one horizontal axis, r and tau both in units of
         sqrt(Eb): the threshold line in the upper panel stands directly over
         the point it gives on the P_e(tau) curve below. */
      const WV = ph ? 300 : 820, hA = ph ? 230 : gh(205), hB = ph ? 220 : gh(235);
      const a = P.Axes({w:WV,h:hA,xr:[-X,X],yr:[-0.04*top,1.22*top],
        xlabel:ph?'r/\\sqrt{E_b}':'',ylabel:'P(\\mathbf{s}_i)\\,f(r\\mid \\mathbf{s}_i)',
        pad:{l:ph?46:66,r:ph?16:24,t:24,b:ph?40:10},xtarget:ph?4:7,ytarget:3,ytickfmt:()=>'',
        xtickfmt:ph?(v=>fmt(v,2)):(()=>'')});
      const tc = Math.max(-X, Math.min(X, q.tau));
      a.under(`<rect x="${a.sx(tc).toFixed(2)}" y="${a.y1}" width="${(a.x1-a.sx(tc)).toFixed(2)}" height="${(a.y0-a.y1).toFixed(2)}" fill="${P.COL.dec.in}"/>`);
      a.under(`<rect x="${a.x0}" y="${a.y1}" width="${(a.sx(tc)-a.x0).toFixed(2)}" height="${(a.y0-a.y1).toFixed(2)}" fill="${P.COL.dec.mid}"/>`);
      const red = tint(P.COL.err, 0.30);
      a.area(w1, -X, tc, {color:red});
      a.area(w2, tc, X, {color:red});
      a.curve(w1,{color:P.COL.in,width:2.3});
      a.curve(w2,{color:P.COL.mid,width:2.3});
      if(run) run.recent.forEach((o,i)=>{ const age = (i+1)/run.recent.length;
        if(Math.abs(o.r) < X) a.point(o.r, 0.035*top, {color: o.ok ? P.COL.out : P.COL.err, r: 2.2+1.6*age, ring:'none'}); });
      a.vline(tc,{color:P.COL.ink,dash:'6 4',width:2,opacity:1});
      /* the label goes on the side away from r = 0, where the vertical axis is */
      a.note(tc, 1.13*top, '\\tau', {tex:true, fs:16, color:P.COL.ink, dx:tc > 0 ? 10 : -10, anchor:tc > 0 ? 'start' : 'end'});

      /* P_e against the threshold: the MAP threshold sits at the minimum. The
         axis is drawn over tau + OFF, so zero is outside its range and the
         decades are numbered at the left edge, not on the line tau = 0. */
      const OFF = 4;
      const lo = Math.min(Math.log10(Math.max(1e-9, peMap)) - 0.25, Math.floor(Math.log10(Math.max(1e-9, peMap))) - 0.05);
      /* kept below P_e = 1, so zero stays outside the range here too */
      const hi = Math.min(-0.01, Math.max(lo + 1.2, Math.log10(Math.max(q.p1, q.p2)) + 0.12));
      const b = P.Axes({w:WV,h:hB,xr:[-X+OFF,X+OFF],yr:[lo,hi],
        xlabel:ph?'\\tau/\\sqrt{E_b}':'r/\\sqrt{E_b},\\ \\tau/\\sqrt{E_b}',ylabel:'P_e(\\tau)',ytickfmt:P.decade,yticksOverride:P.decades(lo,hi),zeroAxes:false,
        xticksOverride:[-3,-2,-1,0,1,2,3].map(v=>v+OFF), xtickfmt:v=>fmt(v-OFF,2),
        pad:{l:ph?46:66,r:ph?16:24,t:22,b:40},ytarget:3});
      b.curve(u=>Math.log10(Math.max(1e-12, core.pe(u-OFF, q.p1, q.N0))),{color:P.COL.err,width:2.3});
      b.vline(OFF,{color:P.COL.slate,dash:'2 4',width:1.4});
      b.vline(q.tMap+OFF,{color:P.COL.coral,dash:'2 3',width:1.8,opacity:1});
      b.vline(tc+OFF,{color:P.COL.ink,dash:'6 4',width:2,opacity:1});
      b.point(tc+OFF, Math.log10(Math.max(1e-12,pe)), {color:P.COL.ink, r:5.5, ring:P.COL.plate, ringw:1.6});

      const lgA = `${L('in','P(\\mathbf{s}_1)f(r\\mid\\mathbf{s}_1)')}${L('mid','P(\\mathbf{s}_2)f(r\\mid\\mathbf{s}_2)')}`;
      const lgB = `${L('slate','\\text{ML}',true)}<i class="lg-dash" style="--lg-c:var(--coral);color:var(--coral)">${T('\\text{MAP}',false)}</i>`;
      const nest = (svg, yy, h) => svg.replace('<svg ', `<svg x="0" y="${yy}" width="${WV}" height="${h}" `);
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lgA)}<div class="plot-wrap">${b.svg()}</div>${legendRow(lgB)}`
        : `<div class="plot-wrap"><svg viewBox="0 0 ${WV} ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${nest(a.svg(),0,hA)}${nest(b.svg(),hA,hB)}</svg>`
        + `<div class="legend in-plot" style="top:2px">${lgA}</div>`
        + `<div class="legend in-plot" style="top:calc(100% * ${(hA/(hA+hB)).toFixed(4)} + 2px)">${lgB}</div></div>`;

      const rn = run && run.n ? run : null;
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Threshold $\\tau$</dt><dd>${N(q.tau,3)}</dd></div>
        <div><dt>$P_e$, formula</dt><dd class="${pe > peMap*1.001 ? 'warnv' : 'okv'}">${pH(pe)}</dd></div>
        <div><dt>$P_e$ at MAP</dt><dd>${pH(peMap)}</dd></div>
        <div><dt>Stream</dt><dd>${rn ? `${rn.k} of ${rn.n} = ${N(rn.k/rn.n,4)}` : '0 of 0'}</dd></div>`);
      const dots = (rn ? rn.recent : []).map(o=>`<i style="display:block;width:9px;height:9px;border-radius:50%;background:var(${o.ok?'--sig-out':'--sig-err'})"></i>`).join('');
      root.querySelector('.strip').innerHTML = dots || '';

      const ratio = pe/peMap;
      const verdict = st.mode === 'map'
        ? `<div class="note ok"><span class="note-h">Smallest error</span>The two weighted curves cross at $\\tau$. Any other threshold adds red area.</div>`
        : st.mode === 'ml' && Math.abs(q.p1-0.5) > 1e-9
        ? `<div class="note warn"><span class="note-h">ML threshold</span>The midpoint ignores the priors. It gives $P_e$ ${T(fmt(ratio,3),false)} times the MAP value.</div>`
        : st.mode === 'ml'
        ? `<div class="note ok"><span class="note-h">Equal priors</span>With $P(\\mathbf{s}_1)=P(\\mathbf{s}_2)$ the ML and MAP thresholds are the same point.</div>`
        : `<div class="note ${ratio > 1.001 ? 'err' : 'ok'}"><span class="note-h">Threshold by hand</span>This $\\tau$ gives $P_e$ ${T(fmt(ratio,3),false)} times the MAP value.</div>`;
      root.querySelector('.derive:not(.verdict)').innerHTML = M(`
        <div class="eq"><span class="eq-label">MAP threshold</span>${T(
          `\\tau_{\\mathrm{MAP}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(\\mathbf{s}_2)}{P(\\mathbf{s}_1)}=${N(q.tMap,3)}\\sqrt{E_b}`, true)}</div>`);
      root.querySelector('.verdict').innerHTML = M(verdict);

      root.querySelector('[data-out=prior]').textContent = fmt(st.prior/100,2);
      root.querySelector('[data-out=ebn0]').textContent = String(st.ebn0);
      root.querySelector('[data-out=tau]').textContent = fmt(q.tau,2);
      root.querySelector('[data-v=tau]').value = String(Math.round(Math.max(-100,Math.min(100,q.tau*100))));
      root.querySelectorAll('[data-seg=mode]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.mode)));
      const pb = root.querySelector('[data-do=play]');
      if(pb){ pb.textContent = raf ? 'Pause' : 'Play'; pb.setAttribute('aria-pressed', String(!!raf)); }
    }

    return { core, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div>
            <div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Threshold</span><span class="seg">
                <button data-seg="mode" data-val="ml">ML</button>
                <button data-seg="mode" data-val="map">MAP</button>
                <button data-seg="mode" data-val="hand">by hand</button></span></label></div>
              <div class="ctrl"><label><span>Prior $P(\\mathbf{s}_1)$</span><span class="val" data-out="prior">0.8</span></label>
                <input type="range" data-v="prior" min="5" max="95" step="5" value="80"></div>
              <div class="ctrl"><label><span>$E_b/N_0$, dB</span><span class="val" data-out="ebn0">1</span></label>
                <input type="range" data-v="ebn0" min="0" max="10" step="1" value="1"></div>
              <div class="ctrl"><label><span>$\\tau/\\sqrt{E_b}$ by hand</span><span class="val" data-out="tau">0</span></label>
                <input type="range" data-v="tau" min="-100" max="100" step="2" value="0"></div>
              <div class="ctrl"><label><span>Stream</span><span class="seg">
                <button data-do="play">Play</button><button data-do="reset">Reset</button></span></label>
                <div class="strip" aria-hidden="true" style="display:flex;flex-wrap:wrap;gap:3px;min-height:9px"></div></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        st[k] = parseInt(e.target.value,10);
        if(k === 'tau') st.mode = 'hand';
        if(run) run = fresh();
        draw(root); });
      root.addEventListener('click', e=>{
        const b = e.target.closest('[data-seg=mode]');
        if(b){ if(st.mode !== 'hand' && b.dataset.val === 'hand') st.tau = Math.round(par().tau*100);
               st.mode = b.dataset.val; if(run) run = fresh(); draw(root); return; }
        const d = e.target.closest('[data-do]'); if(!d) return;
        if(d.dataset.do === 'play') play(root);
        else { stopRun(); run = null; draw(root); }
      });
      stopRun(); run = null;
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     G · CONSTELLATIONS AND DECISION REGIONS
     Every constellation starts at unit average energy, so choosing a set
     changes the geometry and not the power. The noise is fixed by Es/N0 of
     that unit-energy reference: dragging a point outward spends energy and
     buys distance, and the count and the bound both answer.
     ======================================================================= */
  const G = (() => {
    const GSETS = ['binary','pam4','qpsk','psk8','qam16'];
    let st = { set:'qpsk', esn0:10 };
    const NTRIAL = 4000;
    let custom = null, drag = -1, view = null;

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const base = unitSet(st.set), cols = colouring(base), SC = SYM();
      const pts = custom || base.pts;
      const g = geometry(pts);
      const N0 = Math.pow(10, -st.esn0/10), sig = Math.sqrt(N0/2);
      const nTrial = NTRIAL;
      const B = bounds(g, N0);

      /* The measurement: pick a symbol, add noise, take the nearest point.
         One seed for the whole run, so the count moves smoothly as a point
         is dragged. */
      const r = rng(4242), nz = normalStream(rng(20260802));
      let wrong = 0; const scatter = [];
      for(let t=0;t<nTrial;t++){
        const i = Math.min(g.M-1, Math.floor(r()*g.M));
        const x = pts[i][0] + sig*nz(), y = pts[i][1] + sig*nz();
        const bad = nearest(pts, x, y) !== i;
        if(bad) wrong++;
        if(scatter.length < 1200) scatter.push([x, y, bad]);
      }
      const meas = wrong/nTrial;

      const lim = Math.max(...base.pts.map(p=>Math.max(Math.abs(p[0]),Math.abs(p[1]))))*1.55 + 0.45;
      const a = eqAxes({w:ph?300:620,h:ph?300:gh(300),xlabel:'\\psi_1',ylabel:'\\psi_2',
        pad:{l:ph?40:52,r:ph?14:22,t:28,b:44},xtarget:ph?4:6,ytarget:ph?4:6}, lim);
      regions(a, pts, cols);
      scatter.forEach(([x,y,bad])=>a.point(x,y,{color:bad?P.COL.err:P.COL.noise, r:bad?2.6:1.7, ring:'none'}));
      pts.forEach((p,k)=>a.point(p[0],p[1],{color:SC[cols[k]], r:drag===k?9:7.5, ring:P.COL.plate, ringw:2}));
      view = { xr:a.o.xr, yr:a.o.yr, x0:a.x0, x1:a.x1, y0:a.y0, y1:a.y1, W:a.W, H:a.H };

      root.querySelector('.plots').innerHTML = `<div class="plot-wrap" style="cursor:grab;touch-action:${ph?'pan-y':'none'}">${a.svg()}</div>`;

      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Average energy</dt><dd>${N(g.Eavg,3)}</dd></div>
        <div><dt>$d_{\\min}$</dt><dd>${N(g.dmin,3)}</dd></div>
        <div><dt>$N_{\\min}$</dt><dd>${N(g.Nmin,3)}</dd></div>
        <div><dt>Measured</dt><dd class="okv">${wrong} of ${nTrial} = ${N(meas,4)}</dd></div>
        <div><dt>Union bound</dt><dd>${pH(B.general)}</dd></div>
        <div><dt>$N_{\\min}Q$ form</dt><dd>${pH(B.nearest)}</dd></div>`);

      const sd = Math.sqrt(Math.max(B.general,1e-9)*nTrial);
      root.querySelector('.derive:not(.verdict)').innerHTML = M(`
        <div class="eq"><span class="eq-label">Union bound</span>${T(
          `P_e\\le\\tfrac{1}{M}\\textstyle\\sum_{m}\\sum_{j\\ne m}Q\\big(d_{mj}/\\sqrt{2N_0}\\big)`, true)}</div>`);
      root.querySelector('.verdict').innerHTML = M(`
        ${ B.general > 0.5
          ? `<div class="note warn"><span class="note-h">Bound above one half</span>The terms overlap so much that their sum says almost nothing. Raise $E_s/N_0$.</div>`
          : wrong > B.general*nTrial + 3*sd
          ? `<div class="note err"><span class="note-h">Count above the bound</span>A bound holds for the true rate. A count of a few errors scatters, so a small excess is chance.</div>`
          : `<div class="note ok"><span class="note-h">Bound above, count below</span>The sum counts twice a point that is nearer to two wrong symbols.</div>`}`);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelectorAll('[data-seg=set]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.set)));
    }

    /* Pointer position in data coordinates, read through the figure drawn
       last: the svg is replaced on every redraw, so it is looked up each time. */
    function toData(root, e){
      const svg = root.querySelector('.plots svg'); if(!svg || !view) return null;
      const m = svg.getScreenCTM(); if(!m) return null;
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(m.inverse());
      return [view.xr[0] + (q.x-view.x0)/(view.x1-view.x0)*(view.xr[1]-view.xr[0]),
              view.yr[0] + (view.y0-q.y)/(view.y0-view.y1)*(view.yr[1]-view.yr[0]), m.a];
    }

    return { core:{ unitSet, geometry, bounds, Q }, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div><div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Set</span><span class="seg">
                ${GSETS.map(k=>`<button data-seg="set" data-val="${k}">${SETS[k].label}</button>`).join('')}</span></label></div>
              <div class="ctrl"><label><span>$E_s/N_0$, dB</span><span class="val" data-out="esn0">10</span></label>
                <input type="range" data-v="esn0" min="0" max="20" step="1" value="10"></div>
              <div class="ctrl"><label><span>Points</span><span class="seg">
                <button data-do="reset">Put back</button></span></label></div>
            </div>
            <dl class="readout ro" ${RO3}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        st[k] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{
        const b = e.target.closest('[data-seg=set]');
        if(b){ st.set = b.dataset.val; custom = null; draw(root); return; }
        if(e.target.closest('[data-do=reset]')){ custom = null; draw(root); }
      });
      const plots = root.querySelector('.plots');
      let pending = 0;
      plots.addEventListener('pointerdown', e=>{
        const d = toData(root, e); if(!d) return;
        const pts = custom || unitSet(st.set).pts;
        const px = (view.x1-view.x0)/(view.xr[1]-view.xr[0]) * d[2];   /* screen px per unit */
        let best = -1, bd = 22;
        pts.forEach((p,k)=>{ const dd = Math.hypot(p[0]-d[0], p[1]-d[1])*px; if(dd < bd){ bd = dd; best = k; } });
        if(best < 0) return;
        custom = pts.map(p=>p.slice()); drag = best;
        plots.setPointerCapture(e.pointerId); e.preventDefault(); draw(root);
      });
      plots.addEventListener('pointermove', e=>{
        if(drag < 0) return;
        const d = toData(root, e); if(!d) return;
        const cx = Math.max(view.xr[0]*0.95, Math.min(view.xr[1]*0.95, d[0]));
        const cy = Math.max(view.yr[0]*0.95, Math.min(view.yr[1]*0.95, d[1]));
        custom[drag] = [cx, cy];
        if(!pending) pending = requestAnimationFrame(()=>{ pending = 0; if(root.isConnected) draw(root); });
      });
      const end = e=>{ if(drag < 0) return; drag = -1; try{ plots.releasePointerCapture(e.pointerId); }catch(_){} draw(root); };
      plots.addEventListener('pointerup', end);
      plots.addEventListener('pointercancel', end);
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     W · ERROR BOUNDS AGAINST SIMULATION
     The five forms of section 4.4 as curves against Es/N0, and a Monte Carlo
     run whose points fill in batch by batch. Each mark keeps its own
     generator, continued from batch to batch, so twenty-five batches of n
     are exactly one run of 25n: labwalk.js checks that on the page.
     ======================================================================= */
  const W = (() => {
    const WSETS = ['qpsk','psk8','pam4','five','qam16'];
    const MARKS = [0,2,4,6,8,10,12,14,16,18,20];
    const PER = 1600, BATCHES = 25;
    let st = { set:'five', esn0:6, phase:25 };
    const cache = {};

    /* The cumulative count at every mark after b batches, extended lazily
       and kept, so a frame of the run costs one batch (under 2 ms) and a
       scrub backwards costs nothing. */
    function counts(key, b){
      let c = cache[key];
      if(!c){ c = cache[key] = { gen: MARKS.map((_,i)=>{ const r = rng(90210 + 977*i); return { r, nz:normalStream(r) }; }),
                                 cum: [MARKS.map(()=>0)] }; }
      const g = unitSet(key);
      while(c.cum.length <= b){
        const prev = c.cum[c.cum.length-1];
        c.cum.push(MARKS.map((d,i)=>{
          const s = Math.sqrt(Math.pow(10,-d/10)/2), G_ = c.gen[i];
          let w = 0;
          for(let t=0;t<PER;t++){
            const k = Math.min(g.M-1, Math.floor(G_.r()*g.M));
            const x = g.pts[k][0] + s*G_.nz();
            const y = g.dim === 2 ? g.pts[k][1] + s*G_.nz() : g.pts[k][1];
            if(nearest(g.pts, x, y) !== k) w++;
          }
          return prev[i] + w;
        }));
      }
      return c.cum[b];
    }

    function draw(root){
      const ph = PHONE(), gh = GH(root);
      const g = unitSet(st.set);
      /* The vertical axis is log10(P_e) - 1, so that P_e = 1 is not the zero
         line: a zero inside the range would pull the tick numbers of the
         horizontal axis up to it. The decades are labelled back. */
      const cl = v => Math.log10(Math.max(1e-12, v)) - 1;
      const N0 = d => Math.pow(10, -d/10);
      const YLO = -7, YHI = -0.4;

      const a = P.Axes({w:ph?300:720,h:ph?340:gh(340),xr:[0,20],yr:[YLO,YHI],
        xlabel:'E_s/N_0\\;(\\mathrm{dB})', ylabel:'P_e', ytickfmt:v=>P.decade(v+1), yticksOverride:P.decades(YLO,YHI), zeroAxes:false,
        pad:{l:ph?48:64,r:ph?16:26,t:26,b:46}, xtarget:ph?4:5, ytarget:6});
      a.hline(-1,{color:P.COL.muted,dash:'2 4',opacity:0.9});
      const FORMS = [
        ['general',     P.COL.h,     null,   2.2],
        ['intelligent', P.COL.mid,   null,   2.4],
        ['nearest',     P.COL.in,    '8 5',  2.2],
        ['dmin',        P.COL.err,   '3 4',  2.0],
        ['expo',        P.COL.slate, '1 4',  2.2]
      ];
      FORMS.forEach(([k,c,dash,w])=>a.curve(d=>cl(bounds(g, N0(d))[k]), {color:c, width:w, dash, n:200}));
      const cum = counts(st.set, st.phase), n = PER*st.phase;
      if(n) MARKS.forEach((d,i)=>{ if(cum[i] > 0) a.point(d, Math.max(YLO+0.05, cl(cum[i]/n)), {color:P.COL.out, r:5.5, ring:P.COL.plate, ringw:1.6}); });
      /* The mark runs from the top of the plot down to the lowest value it
         reads, so it never runs under the legend in the lower corner. */
      { const B0 = bounds(g, N0(st.esn0)), iM0 = MARKS.indexOf(st.esn0);
        const vals = Object.values(B0).concat(n && iM0 >= 0 && cum[iM0] > 0 ? [cum[iM0]/n] : []);
        const yEnd = Math.max(YLO, Math.min(...vals.map(cl)) - 0.35);
        a.poly([[st.esn0, YHI], [st.esn0, yEnd]], {color:P.COL.ink, width:1.6, dash:'5 4'}); }

      const lg = [L('h','\\text{union}'), L('mid','\\text{intelligent}'),
                  L('in','\\text{nearest}',true), L('err','d_{\\min}\\ \\text{bound}',true),
                  L('slate','\\text{exponential}',true), LD('out','\\text{simulated}')].join('');
      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a.svg()}</div>${legendRow(lg)}`
        : `<div class="plot-wrap">${a.svg()}<div class="legend in-plot" style="top:auto;right:auto;bottom:calc(${(100*(a.H-a.y0)/a.H).toFixed(2)}% + 14px);left:calc(${(100*a.x0/a.W).toFixed(2)}% + 14px);flex-direction:column;gap:4px">${lg}</div></div>`;

      const B = bounds(g, N0(st.esn0));
      const iM = MARKS.indexOf(st.esn0);
      const w = iM >= 0 ? cum[iM] : 0, sim = n ? w/n : 0;
      const ratio = v => sim > 0 ? `<span style="font-weight:400;color:var(--muted)"> ×${N(v/sim,2)}</span>` : '';
      const row = (k,label,cls) => `<div><dt>${label}</dt><dd${cls?` class="${cls}"`:''}>${pH(B[k])}${ratio(B[k])}</dd></div>`;
      root.querySelector('.ro').innerHTML = M(`
        <div><dt>Measured</dt><dd class="okv">${w} of ${n} = ${N(sim,5)}</dd></div>
        ${row('general','Union bound')}
        ${row('intelligent','Intelligent bound')}
        ${row('nearest','Nearest neighbours')}
        ${row('dmin','$d_{\\min}$ bound')}
        ${row('expo','Exponential bound')}`);

      const faces = g.nbs.reduce((s,nb)=>s+nb.size,0)/g.M;
      const note = B.general >= 1
        ? `<div class="note warn"><span class="note-h">Union bound above one</span>At ${st.esn0} dB the union bound counts overlapping events many times. It says nothing here.</div>`
        : Math.abs(B.intelligent - B.nearest) > 0.02*B.intelligent
        ? `<div class="note def"><span class="note-h">Faces beyond $d_{\\min}$</span>Some faces belong to points further than $d_{\\min}$. The intelligent bound keeps them and the nearest-neighbour form drops them.</div>`
        : `<div class="note ok"><span class="note-h">Only faces at $d_{\\min}$</span>Every face of every region lies at $d_{\\min}$, so the intelligent bound and $N_{\\min}Q$ are the same curve.</div>`;
      root.querySelector('.derive:not(.verdict)').innerHTML = M(`
        <div class="eq"><span class="eq-label">Intelligent union bound</span>${T(
          `P_e\\le\\tfrac{1}{M}\\textstyle\\sum_{m}\\sum_{j\\in\\mathcal{N}_m}Q\\big(d_{mj}/\\sqrt{2N_0}\\big)`, true)}
          <div class="small" style="margin-top:4px">${M(`$\\mathcal{N}_m$: the points sharing a face with $\\mathbf{s}_m$, ${N(faces,2)} on average.`)}</div></div>`);
      root.querySelector('.verdict').innerHTML = M(note);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelector('[data-v=phase]').value = String(st.phase);
      root.querySelectorAll('[data-seg=set]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.set)));
    }

    return { core:{ bounds, unitSet, counts, MARKS, PER }, mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div><div class="verdict derive"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label><span>Set</span><span class="seg">
                ${WSETS.map(k=>`<button data-seg="set" data-val="${k}">${SETS[k].label}</button>`).join('')}</span></label></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>Mark at $E_s/N_0$, dB</span><span class="val" data-out="esn0">6</span></label>
                <input type="range" data-v="esn0" min="0" max="20" step="2" value="6"></div>
              <div class="ctrl" style="grid-column:1/-1"><label><span>Batches of ${PER} symbols</span><span class="val" data-out="phase">25</span></label>
                <div class="ctrl-run"><input type="range" data-v="phase" min="0" max="${BATCHES}" step="1" value="25">${LABS.KIT.runbar()}</div></div>
            </div>
            <dl class="readout ro" ${RO3}></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k = e.target.dataset.v; if(!k) return;
        st[k] = parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b = e.target.closest('[data-seg=set]'); if(!b) return;
        st.set = b.dataset.val; draw(root); });
      phoneTidy(root);
      draw(root);
      root.redraw = () => draw(root);
      LABS.KIT.transport(root, { key:'phase', max:BATCHES, ms:120,
        get:()=>st.phase, set:v=>{ st.phase=v; }, redraw:()=>draw(root) });
    }};
  })();

  return { U, V, G, W };
})());
