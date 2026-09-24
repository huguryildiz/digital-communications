/* ==========================================================================
   Module 3 laboratories.

   R · From waveform to point — a waveform on [0,2], a basis, and the
       coordinates the analysis integral produces: the geometric translation
       of section 3.1, run on a signal the reader chooses.
   S · Constellation explorer — a family of constellations, all held to
       average energy 1, so the reader sees that the points fix the smallest
       distance and the average and peak energy, and a change of basis does
       not.
   F · From waveform to basis — Gram-Schmidt run on a signal set the reader
       chooses, with the basis it produces, the constellation and the number
       of dimensions reported as they change.

   Every card a laboratory draws follows the slide card language: a computed
   equation takes a coral tab naming what it computes, a note keeps its
   kind's tab and icon. Nothing here is imported; the artifact is one file.
   ========================================================================== */
Object.assign(LABS, (function(){
  const T = LABS.KIT.T, M = LABS.KIT.M, fmt = LABS.KIT.F, GH = LABS.KIT.GH;
  const P = PLOT;
  const N = (v,d=3) => fmt(v,d);

  /* Same phone/legend pattern as Module 1 and Module 2's laboratories. */
  const PHONE = () => APP.state.layout === 'phone';
  const legendRow = (...items) => `<div class="legend">${items.join('')}</div>`;
  const L = (c,l,dash)=>`<i class="lg-${c}${dash?' lg-dash':''}">${T(l,false)}</i>`;

  /* =======================================================================
     R · FROM WAVEFORM TO POINT
     One waveform on [0,2], one orthonormal basis, and the coordinates the
     analysis integral produces. Section 3.1's translation, run in reverse:
     the reader picks the waveform and the basis and watches how much of it
     the basis can carry.
     ======================================================================= */
  const R = (() => {
    const TMAX = 2, NS = 800, dt = TMAX/NS;
    let st = { basis:'halves', wave:'steps', a1:1, a2:2, a3:-1, a4:0.5 };

    /* Every basis is given as N functions on [0,2], each of unit energy, so
       the coordinates that follow are true inner products and not a scaled
       copy of them. */
    const BASES = {
      halves: { N:2, name:'halves', psi:[
        t => (t>=0 && t<1) ? 1 : 0,
        t => (t>=1 && t<2) ? 1 : 0 ] },
      quarters: { N:4, name:'quarters', psi:[
        t => (t>=0   && t<0.5) ? Math.SQRT2 : 0,
        t => (t>=0.5 && t<1)   ? Math.SQRT2 : 0,
        t => (t>=1   && t<1.5) ? Math.SQRT2 : 0,
        t => (t>=1.5 && t<2)   ? Math.SQRT2 : 0 ] },
      walsh: { N:4, name:'Walsh', psi:[
        t => quad(t,[ 1, 1, 1, 1]),
        t => quad(t,[ 1, 1,-1,-1]),
        t => quad(t,[ 1,-1,-1, 1]),
        t => quad(t,[ 1,-1, 1,-1]) ] }
    };
    /* A four-quarter sign pattern, each quarter at height 1/sqrt2 so every
       Walsh function has unit energy on [0,2]. */
    function quad(t, signs){
      if(t<0 || t>=2) return 0;
      const k = Math.min(3, Math.floor(t/0.5));
      return signs[k]/Math.SQRT2;
    }

    /* The waveform choices. `custom` reads the four quarter-values from the
       sliders, so it shares its shape with `quarters` while letting the
       reader set any values. */
    function waveformFn(){
      if(st.wave==='ramp')  return t => t;
      if(st.wave==='sine')  return t => Math.sin(Math.PI*t);
      const vals = st.wave==='custom' ? [st.a1,st.a2,st.a3,st.a4] : [1,2,-1,0.5];
      return t => { if(t<0||t>=2) return 0; const k=Math.min(3,Math.floor(t/0.5)); return vals[k]; };
    }

    function draw(root){
      const gh = GH(root), ph = PHONE();
      const basis = BASES[st.basis];
      const s = waveformFn();

      /* Midpoint-rule numerical integration for every inner product this
         laboratory needs: the coordinates, the source energy and the
         residual energy. */
      const grid = Array.from({length:NS}, (_,i)=>(i+0.5)*dt);
      const sVals = grid.map(s);
      const coords = basis.psi.map(psi => grid.reduce((acc,t,i)=>acc+sVals[i]*psi(t)*dt, 0));
      const Es = sVals.reduce((acc,v)=>acc+v*v*dt, 0);
      const captured = coords.reduce((acc,c)=>acc+c*c, 0);
      const sHat = t => basis.psi.reduce((acc,psi,j)=>acc+coords[j]*psi(t), 0);
      const shVals = grid.map(sHat);
      const eVals = sVals.map((v,i)=>v-shVals[i]);
      const Ee = eVals.reduce((acc,v)=>acc+v*v*dt, 0);
      const fracPct = Es>1e-12 ? 100*captured/Es : 100;

      /* The traces cross zero, so the default x tick row — anchored to the
         data's own y=0 — sits in the middle of the plot and a flat segment
         near zero runs straight through the tick numbers. The row is drawn
         at the foot of the data area instead: xtickfmt silences the default
         row and the same tick values are set again with note(), anchored at
         y0 like the frame figures. */
      const R_XTICKS = [0,0.5,1,1.5,2];
      const a1 = P.Axes({w:ph?300:640,h:ph?230:gh(190),xr:[0,TMAX],yr:[-2.4,2.4],
        xlabel:'t',ylabel:'s(t),\\;\\hat s(t),\\;e(t)',pad:{l:ph?42:56,r:ph?16:24,t:24,b:40},
        xtarget:ph?4:5,ytarget:4,xticksOverride:R_XTICKS,xtickfmt:()=>''});
      a1.poly(grid.map((t,i)=>[t,sVals[i]]),{color:P.COL.in,width:2.2});
      a1.poly(grid.map((t,i)=>[t,shVals[i]]),{color:P.COL.mid,width:2.0,dash:'7 5'});
      a1.poly(grid.map((t,i)=>[t,eVals[i]]),{color:P.COL.err,width:1.3});
      R_XTICKS.forEach(v=>{ if(v===0) return;
        a1.raw(`<line x1="${a1.sx(v).toFixed(2)}" y1="${a1.y0.toFixed(2)}" x2="${a1.sx(v).toFixed(2)}" y2="${(a1.y0+5).toFixed(2)}" stroke="${P.COL.axis}" stroke-width="1.2"/>`);
        /* The last tick sits at the right edge of the data area, exactly
           where the xlabel begins; anchor it to end there instead of
           straddling the edge, so the two never run together. */
        const atEdge = v===TMAX;
        a1.note(v, -2.4, fmt(v,2), {fs:13.5, color:P.COL.muted, anchor:atEdge?'end':'middle', dy:20, dx:atEdge?-4:0}); });

      const lg1 = `${L('in','s(t)')}${L('mid','\\hat s(t)',true)}${L('err','e(t)')}`;

      let a2;
      if(basis.N===2){
        const lim = Math.max(1.2, Math.abs(coords[0]), Math.abs(coords[1]))*1.35;
        a2 = P.Axes({w:ph?300:640,h:ph?220:gh(160),xr:[-lim,lim],yr:[-lim,lim],
          xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:ph?42:56,r:ph?16:24,t:22,b:38},
          xtarget:ph?4:4,ytarget:4});
        a2.poly([[coords[0],0],[coords[0],coords[1]]],{color:P.COL.rule,width:1,dash:'3 4'});
        a2.poly([[0,coords[1]],[coords[0],coords[1]]],{color:P.COL.rule,width:1,dash:'3 4'});
        a2.point(coords[0],coords[1],{color:P.COL.in,r:6});
      } else {
        const lim = Math.max(1, ...coords.map(Math.abs))*1.3;
        a2 = P.Axes({w:ph?300:640,h:ph?220:gh(160),xr:[0.4,basis.N+0.6],yr:[-lim,lim],
          xlabel:'j',ylabel:'s_j',pad:{l:ph?42:56,r:ph?16:24,t:22,b:38},
          xtarget:basis.N,ytarget:4,xticksOverride:coords.map((_,j)=>j+1)});
        a2.stem(coords.map((c,j)=>[j+1,c]),{color:P.COL.mid});
      }

      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${a1.svg()}</div>${legendRow(lg1)}`
        + `<div class="plot-wrap">${a2.svg()}</div>`
        : `<div class="plot-wrap">${a1.svg()}<div class="legend in-plot lg-at-tr">${lg1}</div></div>`
        + `<div class="plot-wrap">${a2.svg()}</div>`;

      root.querySelector('.ro').innerHTML = `
        <div><dt>Axes N</dt><dd>${basis.N}</dd></div>
        <div><dt>E_s</dt><dd>${N(Es,3)}</dd></div>
        <div><dt>&Sigma; s_j&sup2;</dt><dd>${N(captured,3)}</dd></div>
        <div><dt>Residual</dt><dd class="${Ee>1e-6*Es+1e-9?'warnv':'okv'}">${N(Ee,4)}</dd></div>
        <div><dt>Captured</dt><dd class="${fracPct>99.9?'okv':'warnv'}">${N(fracPct,1)}%</dd></div>`;

      const inSpan = Ee < 1e-6*Math.max(Es,1e-9);
      const vec = 's=('+coords.map(c=>N(c,3)).join(',\\,')+')';
      root.querySelector('.derive').innerHTML = M(`
        <div class="eq"><span class="eq-label">Coordinates</span>${T(`\\mathbf{${vec}}`,true)}</div>
        <div class="note ${inSpan?'ok':'warn'}"><span class="note-h">${inSpan?'In the span':'Outside the span'}</span>${
          inSpan
          ? `The ${basis.N} numbers are the whole waveform: $E_s=\\sum s_j^2=${N(Es,3)}$.`
          : `$\\hat s(t)$ is the closest waveform this basis can build. The residual is orthogonal to every $\\psi_j$ and holds $${N(Ee,3)}$ of the energy.`}</div>`);
      root.querySelector('.try').innerHTML = M(`
        <div class="note def"><span class="note-h">What to try</span>
          Choose steps with halves, then with quarters: halves loses energy, quarters keeps it all.
          The ramp is never captured exactly, in any of these bases.</div>`);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = fmt(st[o.dataset.out],1); });
      root.querySelectorAll('[data-seg=basis]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.basis)));
      root.querySelectorAll('[data-seg=wave]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.wave)));
      root.querySelectorAll('.custom-a').forEach(c=>{ c.style.display = st.wave!=='custom' ? 'none' : ''; });
    }

    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:6px"></div>
            <div class="try"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label>Basis <span class="seg">
                <button data-seg="basis" data-val="halves">halves</button>
                <button data-seg="basis" data-val="quarters">quarters</button>
                <button data-seg="basis" data-val="walsh">Walsh</button></span></label></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Waveform <span class="seg">
                <button data-seg="wave" data-val="steps">steps</button>
                <button data-seg="wave" data-val="ramp">ramp</button>
                <button data-seg="wave" data-val="sine">sine</button>
                <button data-seg="wave" data-val="custom">custom</button></span></label></div>
              <div class="ctrl custom-a"><label>$a_1$ <span class="val" data-out="a1">1.0</span></label>
                <input type="range" data-v="a1" min="-2" max="2" step="0.1" value="1"></div>
              <div class="ctrl custom-a"><label>$a_2$ <span class="val" data-out="a2">2.0</span></label>
                <input type="range" data-v="a2" min="-2" max="2" step="0.1" value="2"></div>
              <div class="ctrl custom-a"><label>$a_3$ <span class="val" data-out="a3">-1.0</span></label>
                <input type="range" data-v="a3" min="-2" max="2" step="0.1" value="-1"></div>
              <div class="ctrl custom-a"><label>$a_4$ <span class="val" data-out="a4">0.5</span></label>
                <input type="range" data-v="a4" min="-2" max="2" step="0.1" value="0.5"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseFloat(e.target.value); draw(root); });
      root.addEventListener('click', e=>{
        const b1=e.target.closest('[data-seg=basis]'); if(b1){ st.basis=b1.dataset.val; draw(root); return; }
        const b2=e.target.closest('[data-seg=wave]');  if(b2){ st.wave=b2.dataset.val; draw(root); return; }
      });
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     S · CONSTELLATION EXPLORER
     A family of constellations, every one held to average energy 1, so the
     reader compares them on equal footing. A rotation changes the
     coordinates against a fixed basis and nothing the constellation itself
     determines: not the smallest distance, not the average or peak energy.
     ======================================================================= */
  const S = (() => {
    let st = { set:'QPSK', rot:0, m:1, wbasis:'carrier' };

    /* Every set below already carries average energy 1: the sets are built
       from an equal-energy or a scaled integer grid and the scale factor is
       chosen so E_avg = 1 exactly. */
    const SETS = {
      'on-off':   () => [[0,0],[Math.SQRT2,0]],
      antipodal:  () => [[-1,0],[1,0]],
      orthogonal: () => [[1,0],[0,1]],
      QPSK:       () => [0,1,2,3].map(k=>{ const a=Math.PI/4+k*Math.PI/2; return [Math.cos(a),Math.sin(a)]; }),
      '8-PSK':    () => Array.from({length:8},(_,k)=>{ const a=k*Math.PI/4; return [Math.cos(a),Math.sin(a)]; }),
      '4-PAM':    () => [-3,-1,1,3].map(v=>[v/Math.sqrt(5),0]),
      '16-QAM':   () => { const l=[-3,-1,1,3]; const pts=[]; l.forEach(x=>l.forEach(y=>pts.push([x/Math.sqrt(10),y/Math.sqrt(10)]))); return pts; }
    };

    function rotate(pts, deg){
      const c = Math.cos(deg*Math.PI/180), s = Math.sin(deg*Math.PI/180);
      return pts.map(([x,y])=>[x*c-y*s, x*s+y*c]);
    }

    function draw(root){
      const gh = GH(root), ph = PHONE();
      const base = SETS[st.set]();
      const pts = rotate(base, st.rot);
      const M_ = pts.length;
      st.m = Math.max(1, Math.min(M_, st.m));

      const energies = pts.map(([x,y])=>x*x+y*y);
      const Eavg = energies.reduce((a,b)=>a+b,0)/M_;
      const Epeak = Math.max(...energies);
      let dmin = Infinity, pairAt = [pts[0],pts[0]];
      for(let i=0;i<M_;i++) for(let j=i+1;j<M_;j++){
        const d = Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]);
        if(d<dmin){ dmin=d; pairAt=[pts[i],pts[j]]; }
      }
      const mi = st.m-1;
      const [mx,my] = pts[mi];
      const Em = energies[mi];

      const lim = Math.max(1.8, ...pts.map(p=>Math.max(Math.abs(p[0]),Math.abs(p[1]))*1.15));
      const cxW = ph ? 300 : 560;
      /* One unit is the same length on both axes, so the ring stays a circle:
         a first pass measures the data area, the second widens the longer range. */
      const cxO = {w:cxW,h:ph?230:gh(340),xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:ph?42:56,r:ph?16:26,t:26,b:44},xticksOverride:[],yticksOverride:[]};
      const pr = P.Axes(Object.assign({}, cxO, {xr:[-lim,lim],yr:[-lim,lim]}));
      const kx = (pr.x1-pr.x0)/(2*lim), ky = (pr.y0-pr.y1)/(2*lim), k = Math.min(kx,ky);
      const hx = (pr.x1-pr.x0)/k/2, hy = (pr.y0-pr.y1)/k/2;
      const cx = P.Axes(Object.assign({}, cxO, {xr:[-hx,hx],yr:[-hy,hy]}));
      /* Axes has no circle primitive, so the average-energy ring is a poly. */
      { const ring=[]; for(let i=0;i<=64;i++){ const a=2*Math.PI*i/64; ring.push([Math.cos(a),Math.sin(a)]); }
        cx.poly(ring,{color:P.COL.muted,width:1,dash:'3 4'}); }
      cx.poly([pairAt[0],pairAt[1]],{color:P.COL.muted,width:1.4,dash:'2 3'});
      const midx=(pairAt[0][0]+pairAt[1][0])/2, midy=(pairAt[0][1]+pairAt[1][1])/2;
      /* Offset the label perpendicular to the segment, so it clears the
         dashed line and the points at either end whatever the pair's
         orientation happens to be. */
      const segdx = pairAt[1][0]-pairAt[0][0], segdy = pairAt[1][1]-pairAt[0][1];
      const seglen = Math.hypot(segdx,segdy) || 1;
      const perpx = -segdy/seglen, perpy = segdx/seglen;
      cx.note(midx+perpx*0.22, midy+perpy*0.22, 'd_{\\min}',{tex:true,fs:15,color:P.COL.muted,anchor:'middle'});
      pts.forEach((p,k)=>{ cx.point(p[0],p[1],{color:P.COL.in,r: k===mi?8:5.5}); });
      cx.point(mx,my,{color:P.COL.coral,r:11,ring:P.COL.coral,ringw:2});
      cx.point(mx,my,{color:P.COL.in,r:5.5});

      const T_ = 1, fc = 3/T_;
      const psiFn = st.wbasis==='carrier'
        ? [t=>Math.sqrt(2/T_)*Math.cos(2*Math.PI*fc*t), t=>Math.sqrt(2/T_)*Math.sin(2*Math.PI*fc*t)]
        : [t=>(t>=0&&t<0.5)?Math.SQRT2:0, t=>(t>=0.5&&t<1)?Math.SQRT2:0];
      const sm = t => (t<0||t>=T_) ? 0 : mx*psiFn[0](t)+my*psiFn[1](t);
      const wx = P.Axes({w:ph?300:640,h:ph?170:gh(150),xr:[0,1],yr:[-2.6,2.6],
        xlabel:'t/T',ylabel:'s_m(t)',pad:{l:ph?42:56,r:ph?16:24,t:20,b:36},xtarget:4,ytarget:3,
        xticksOverride:[0,0.25,0.5,0.75,1],xtickfmt:()=>''});
      wx.curve(t=>sm(t),{color:P.COL.in,width:2.1,n:600});
      /* tick numbers at the foot of the plot, clear of the carrier */
      [0.25,0.5,0.75].forEach(v=>{ const atEdge = false;
        wx.raw(`<line x1="${wx.sx(v).toFixed(2)}" y1="${wx.y0.toFixed(2)}" x2="${wx.sx(v).toFixed(2)}" y2="${(wx.y0+5).toFixed(2)}" stroke="${P.COL.axis}" stroke-width="1.2"/>`);
        wx.note(v, -2.6, String(v), {fs:13.5, color:P.COL.muted, anchor:atEdge?'end':'middle', dy:20, dx:atEdge?-4:0}); });

      root.querySelector('.plots').innerHTML = ph
        ? `<div class="plot-wrap">${cx.svg()}</div>`
        + `<div class="plot-wrap">${wx.svg()}</div>`
        : `<div class="plot-wrap" style="max-width:${cxW}px">${cx.svg()}</div>`
        + `<div class="plot-wrap">${wx.svg()}</div>`;

      root.querySelector('.ro').innerHTML = `
        <div><dt>M, N</dt><dd>${M_}, 2</dd></div>
        <div><dt>Bits/symbol</dt><dd>${N(Math.log2(M_),2)}</dd></div>
        <div><dt>E_avg, E_peak</dt><dd>${N(Eavg,3)}, ${N(Epeak,3)}</dd></div>
        <div><dt>d_min</dt><dd>${N(dmin,3)}</dd></div>
        <div><dt>Point m</dt><dd>(${N(mx,3)}, ${N(my,3)}), E=${N(Em,3)}</dd></div>`;

      root.querySelector('.derive').innerHTML = M(`
        <div class="eq"><span class="eq-label">Smallest distance</span>${T(`d_{\\min}=${N(dmin,3)}`,true)}</div>
        <div class="note ok"><span class="note-h">The constellation sets it</span>
          The points fix $E_{\\mathrm{avg}}$ and $d_{\\min}$, not the basis used to draw the waveform.</div>`);
      root.querySelector('.try').innerHTML = st.rot!==0 ? M(`
        <div class="note warn"><span class="note-h">Rotated basis</span>
          The coordinates changed. $E_{\\mathrm{avg}}$, $E_{\\mathrm{peak}}$ and $d_{\\min}$ did not.</div>`) : '';

      root.querySelector('[data-v=rot]').value = st.rot;
      root.querySelector('[data-out=rot]').textContent = String(st.rot);
      root.querySelector('[data-v=m]').max = String(M_);
      root.querySelector('[data-v=m]').value = String(st.m);
      root.querySelector('[data-out=m]').textContent = String(st.m);
      root.querySelectorAll('[data-seg=set]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.set)));
      root.querySelectorAll('[data-seg=wbasis]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.wbasis)));
    }

    return { mount(root){
      root.innerHTML = M(`
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots" style="display:flex;flex-direction:column;gap:14px"></div>
            <div class="try"></div></div>
          <div class="col stack">
            <div class="ctrls">
              <div class="ctrl" style="grid-column:1/-1"><label>Set <span class="seg">
                <button data-seg="set" data-val="on-off">on-off</button>
                <button data-seg="set" data-val="antipodal">antipodal</button>
                <button data-seg="set" data-val="orthogonal">orthogonal</button>
                <button data-seg="set" data-val="QPSK">QPSK</button>
                <button data-seg="set" data-val="8-PSK">8-PSK</button>
                <button data-seg="set" data-val="4-PAM">4-PAM</button>
                <button data-seg="set" data-val="16-QAM">16-QAM</button></span></label></div>
              <div class="ctrl"><label>Rotation $\\varphi$, deg <span class="val" data-out="rot">0</span></label>
                <input type="range" data-v="rot" min="0" max="90" step="5" value="0"></div>
              <div class="ctrl"><label>Point $m$ <span class="val" data-out="m">1</span></label>
                <input type="range" data-v="m" min="1" max="4" step="1" value="1"></div>
              <div class="ctrl" style="grid-column:1/-1"><label>Waveform basis <span class="seg">
                <button data-seg="wbasis" data-val="carrier">carrier</button>
                <button data-seg="wbasis" data-val="pulses">pulses</button></span></label></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`);
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseFloat(e.target.value); draw(root); });
      root.addEventListener('click', e=>{
        const b1=e.target.closest('[data-seg=set]'); if(b1){ st.set=b1.dataset.val; st.m=1; draw(root); return; }
        const b2=e.target.closest('[data-seg=wbasis]'); if(b2){ st.wbasis=b2.dataset.val; draw(root); return; }
      });
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  /* =======================================================================
     F · FROM WAVEFORM TO BASIS
     Gram-Schmidt run on a signal set the reader chooses. The numerical core
     is written here rather than ported. The equation reference the ported
     version carries is wrong for this edition: it cites 7.1, which is the
     sampling theorem, where the procedure is 8.1.
     ======================================================================= */
  const F = (() => {
    const NG = 600, TMAX = 3;                      /* the interval, sampled */
    let st = { set:'ramp', order:0 };

    /* Each set is on [0,3]. Three of the four sets have three waveforms and
       are chosen so the answer differs: one needs three dimensions, one
       needs two because a signal repeats a combination, one needs one
       because all three are multiples of each other. `book` has four
       waveforms and needs three dimensions, the worked example of section
       3.3 with a fourth signal added. */
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
        t => (t>=0 && t<3) ? 1 - t/3 : 0 ] },
      /* four signals, three dimensions: s4 = s1 + a combination that leaves a
         remainder along a third axis. Gram-Schmidt on this set gives
         (sqrt2,0,0), (0,sqrt2,0), (0,-sqrt2,1), (sqrt2,0,1) and energies
         2, 2, 3, 3. */
      book: { name:'book set (M=4)', fs:[
        t => (t>=0 && t<2) ? 1 : 0,
        t => (t>=0 && t<1) ? 1 : (t>=1 && t<2) ? -1 : 0,
        t => (t>=0 && t<1) ? -1 : (t>=1 && t<3) ? 1 : 0,
        t => (t>=0 && t<3) ? 1 : 0 ] }
    };

    const dt = TMAX/NG;
    const sample = f => Array.from({length:NG}, (_,i)=>f((i+0.5)*dt));
    const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0)*dt;

    /* Gram-Schmidt, written from the three steps of the scene. A remainder
       whose energy is below the tolerance adds no basis function; the
       tolerance is relative to the largest signal energy in the set, so a
       set of tiny signals is not silently declared one-dimensional. */
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
      const gh = GH(root);
      const set = SETS[st.set];
      const Msig = set.fs.length;
      const idxBase = Array.from({length:Msig},(_,i)=>i);
      const idx = idxBase.map((_,k)=>idxBase[(k+st.order)%Msig]);
      const sigs = idx.map(i=>sample(set.fs[i]));
      const { basis, coords } = gramSchmidt(sigs);

      const cols = [P.COL.in, P.COL.out, P.COL.mid, P.COL.h];

      /* An svg with a viewBox and no width fills whatever box it is put in
         (#scene-host svg{width:100%}), so a preview whose viewBox is much
         narrower than its cell is stretched wide and its height inflates
         with it. `w` is set to the cell's own width — the figure column is
         about 970px wide, gap 12px between cells — so the row spans the
         full column at the aspect ratio it was drawn at, and the height
         stays the one gh() sets rather than one the stretch invented. */
      const COLW = 970, GAP = 12;
      const cellW = n => Math.floor((COLW-(n-1)*GAP)/Math.max(1,n));
      const wave = (arr, name, colour, w) => {
        const a = P.Axes({w, h:gh(150),xr:[0,TMAX],yr:[-1.8,1.8],
          xlabel:'t',ylabel:name,pad:{l:44,r:16,t:20,b:34},xtarget:3,ytarget:3});
        a.poly(arr.map((v,i)=>[(i+0.5)*dt, v]),{color:colour,width:2});
        return a.svg();
      };

      /* The constellation is drawn on the first two axes. In one dimension
         the second coordinate is zero for every signal, which is the honest
         picture; when N = 3 the third coordinate is named in the readout
         instead. It is drawn at half the column width, tall enough to read
         at a glance, below the two preview rows. */
      const xs = coords.map(c=>c[0]||0), ys = coords.map(c=>c[1]||0);
      const lim = Math.max(1, ...xs.map(Math.abs), ...ys.map(Math.abs))*1.35;
      const cxW = Math.round(COLW*0.52);
      const cx = P.Axes({w:cxW,h:gh(230),xr:[-lim,lim],yr:[-lim,lim],
        xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:48,r:20,t:22,b:38},xtarget:4,ytarget:4});
      /* The points are not labelled in the figure. Each takes the colour of
         the waveform it came from, and the coordinates are listed in order
         in the readout, so a label beside every point would repeat both. */
      coords.forEach((c,k)=>{ cx.point(c[0]||0, c[1]||0, {color:cols[k], r:6}); });

      /* The row style is inline rather than in the shared sheet: one
         laboratory needing several figures side by side is not a reason to
         change the stylesheet every scene in the course reads. */
      const row = () => `display:flex;gap:${GAP}px;flex-wrap:wrap;align-items:flex-start`;
      const cell = n => `flex:0 0 calc((100% - ${(n-1)*GAP}px)/${n});min-width:0`;
      const wSig = cellW(Msig), wBas = cellW(Math.max(basis.length,1));
      root.querySelector('.plots').innerHTML =
        `<div style="${row()}">${sigs.map((s,k)=>`<div style="${cell(Msig)}">${wave(s,'s_'+(k+1)+'(t)',cols[k],wSig)}</div>`).join('')}</div>` +
        `<div style="${row()}">${basis.map((b,k)=>`<div style="${cell(Math.max(basis.length,1))}">${wave(b,'\\psi_'+(k+1)+'(t)',P.COL.h,wBas)}</div>`).join('')}</div>` +
        `<div style="max-width:${cxW}px;margin-top:6px">${cx.svg()}</div>`;

      const energies = coords.map(c=>c.reduce((s,v)=>s+v*v,0));
      const dists = [];
      for(let i=0;i<coords.length;i++) for(let j=i+1;j<coords.length;j++)
        dists.push(Math.sqrt(coords[i].reduce((s,v,k)=>s+(v-coords[j][k])**2,0)));
      const nShow = basis.length>=3 ? 3 : 2;
      /* A residual below the tolerance is exact zero, not a tiny float: shown
         to two places it must read 0, not 8.44e-17. */
      const clean = v => Math.abs(v) < 1e-9 ? 0 : v;
      root.querySelector('.ro').innerHTML = `
        <div><dt>M, N</dt><dd>${Msig}, <span class="okv">${basis.length}</span></dd></div>
        <div><dt>Energies</dt><dd>${energies.map(e=>N(e,3)).join(', ')}</dd></div>
        <div><dt>Smallest distance</dt><dd class="${Math.min(...dists)<1e-6?'warnv':'okv'}">${N(Math.min(...dists),3)}</dd></div>
        <div class="ro-wide" style="grid-column:1/-1"><dt>Coordinates</dt><dd>${coords.map((c,k)=>
          `<span style="color:${cols[k]}">(${c.slice(0,nShow).map(v=>N(clean(v),2)).join(', ')})</span>`).join(' ')}</dd></div>`;

      const dimNote = basis.length < Msig
        ? `<div class="note ok"><span class="note-h">M signals needed N axes</span>
             ${Msig} waveforms needed only ${T(String(basis.length),false)}
             ${basis.length===1?'axis':'axes'}: a remainder ${T('g_k',false)} came out zero.</div>`
        : `<div class="note warn"><span class="note-h">M signals needed N axes</span>
             Nothing here is a combination of the others: every signal contributed a new axis.</div>`;
      root.querySelector('.derive').innerHTML = M(`
        <div class="eq"><span class="eq-label">Dimensions</span>${T(`N=${basis.length}`,true)}</div>
        ${dimNote}`);
      root.querySelector('.try').innerHTML = M(`
        <div class="note def"><span class="note-h">What to try</span>
          Change the order: the basis functions change, but the energies and the distances do not.</div>`);

      root.querySelectorAll('[data-out]').forEach(o=>{ o.textContent = String(st[o.dataset.out]); });
      root.querySelector('[data-v=order]').max = String(Msig-1);
      root.querySelector('[data-v=order]').value = String(st.order);
      root.querySelectorAll('[data-seg=set]').forEach(b=>
        b.setAttribute('aria-pressed', String(b.dataset.val===st.set)));
    }

    return { mount(root){
      root.innerHTML = `
        <div class="cols c-7-5" style="gap:40px">
          <div class="col stack"><div class="plots"></div>
            <div class="try"></div></div>
          <div class="col stack">
            <div class="ctrls one">
              <div class="ctrl"><label>Signal set <span class="seg">
                <button data-seg="set" data-val="steps">steps</button>
                <button data-seg="set" data-val="disjoint">disjoint</button>
                <button data-seg="set" data-val="scaled">scaled</button>
                <button data-seg="set" data-val="ramp">ramp</button>
                <button data-seg="set" data-val="book">book set</button></span></label></div>
              <div class="ctrl"><label>Order the signals are taken in <span class="val" data-out="order">0</span></label>
                <input type="range" data-v="order" min="0" max="2" step="1" value="0"></div>
            </div>
            <dl class="readout ro"></dl>
            <div class="derive stack"></div>
          </div></div>`;
      root.addEventListener('input', e=>{ const k=e.target.dataset.v; if(!k) return;
        st[k]=parseInt(e.target.value,10); draw(root); });
      root.addEventListener('click', e=>{ const b=e.target.closest('[data-seg=set]'); if(!b) return;
        st.set=b.dataset.val; st.order=0; draw(root); });
      draw(root);
      root.redraw = () => draw(root);
    }};
  })();

  return { R, S, F };
})());
