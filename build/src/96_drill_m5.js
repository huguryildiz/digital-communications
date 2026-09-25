/* ==========================================================================
   Practice questions — Module 5.

   Thirty questions. Twenty-four are in the shape of the final examination's
   modulation question: a set of equally likely carrier waveforms is given,
   the student draws the constellation with its optimal decision regions, and
   then writes the nearest-neighbour approximation of the symbol error
   probability as a function of E_s,avg/N0. Sixteen keep that shape with new
   sets (offset and odd-M PSK, PAM with a zero or asymmetric point, QAM,
   rings, a zero signal, a point off the circle, two-frequency sets). Eight
   turn it round: the regions are given and the waveforms are asked for, the
   error expression is given and the set is asked for, or two sets are
   compared at equal energy.

   Six take their shape from a textbook problem (src 'Madhow P...') and keep
   the id of the question they replaced, the closest duplicate of one that
   stays. D5-09 (band) puts 16-QAM, QPSK and 64-QAM in one band or at one bit
   rate and prices each in power; it replaced a 16-QAM grid that D5-26 and
   D5-29 still cover. D5-14 (spacing) finds the least tone spacing for
   coherent and noncoherent FSK; it replaced an offset odd-M PSK set, a shape
   D5-01 and D5-02 keep. D5-16 (gray) asks which of three 8-point sets take
   a Gray labelling and gives their bit errors; it replaced two aligned
   rings, the set D5-28 optimises. D5-17 (phase) is BPSK with a carrier phase
   error; it replaced a two-point set with a 120 degree phase difference.
   D5-15 (link) takes a designed free-space link through a change of carrier
   and of bit rate; it replaced a hexagon with a centre point, the shape of
   D5-30. D5-20 (sens) goes from a band to the sensitivity of three schemes;
   it replaced a 3 x 2 grid, the rectangular set D5-08 keeps.

   Every constellation figure is drawn by cfig(): exact minimum-distance regions
   (half-plane clipping, not a raster), each filled at low opacity in the
   colour of its symbol, the points labelled, the nearest-neighbour pairs in
   coral and d_min written beside one of them. Labels are placed by a small
   search that keeps them off every line, point and other label.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;
const SYM = ['in','out','mid','h','err'];
const R2 = Math.SQRT2, R3 = Math.sqrt(3);

/* ---- exact minimum-distance regions inside a box ---------------------- */
function regionsOf(pts, box){
  return pts.map((p,i)=>{
    let poly = [[box[0],box[2]],[box[1],box[2]],[box[1],box[3]],[box[0],box[3]]];
    pts.forEach((q,j)=>{
      if(j===i) return;
      const ax = 2*(q[0]-p[0]), ay = 2*(q[1]-p[1]);
      const b = q[0]*q[0]+q[1]*q[1]-p[0]*p[0]-p[1]*p[1];
      const f = v => ax*v[0]+ay*v[1]-b;
      const out = [];
      for(let k=0;k<poly.length;k++){
        const A = poly[k], B = poly[(k+1)%poly.length], fa = f(A), fb = f(B);
        if(fa<=0) out.push(A);
        if((fa<0&&fb>0)||(fa>0&&fb<0)){ const t = fa/(fa-fb); out.push([A[0]+t*(B[0]-A[0]), A[1]+t*(B[1]-A[1])]); }
      }
      poly = out;
    });
    return poly;
  });
}

/* the boundary shared by regions i and j, if it has length */
function sharedEdge(polys, pts, i, j, eps){
  const p = pts[i], q = pts[j];
  const on = polys[i].filter(v => Math.abs(((v[0]-p[0])**2+(v[1]-p[1])**2)-((v[0]-q[0])**2+(v[1]-q[1])**2)) < eps);
  if(on.length<2) return null;
  let best = null, bl = 0;
  for(let a=0;a<on.length;a++) for(let b=a+1;b<on.length;b++){
    const L = Math.hypot(on[a][0]-on[b][0], on[a][1]-on[b][1]);
    if(L>bl){ bl=L; best=[on[a],on[b]]; }
  }
  return bl>1e-6 ? best : null;
}

/* ---- label placement: a rectangle that touches nothing ----------------- */
function segHitsRect(s, r){
  let t0 = 0, t1 = 1;
  const dx = s[1][0]-s[0][0], dy = s[1][1]-s[0][1];
  const pq = [[-dx, s[0][0]-r[0]], [dx, r[2]-s[0][0]], [-dy, s[0][1]-r[1]], [dy, r[3]-s[0][1]]];
  for(const [pp,qq] of pq){
    if(Math.abs(pp)<1e-12){ if(qq<0) return false; continue; }
    const t = qq/pp;
    if(pp<0){ if(t>t1) return false; if(t>t0) t0=t; }
    else { if(t<t0) return false; if(t<t1) t1=t; }
  }
  return true;
}
function rectCost(r0, ob){
  let c = 0;
  const r = [r0[0]-3, r0[1]-3, r0[2]+3, r0[3]+3];
  if(r[0]<ob.box[0] || r[2]>ob.box[2] || r[1]<ob.box[1] || r[3]>ob.box[3]) c += 50;
  ob.segs.forEach(s=>{ if(segHitsRect(s, r)) c += s[2]||10; });
  ob.circ.forEach(q=>{
    const cx = Math.max(r[0], Math.min(q[0], r[2])), cy = Math.max(r[1], Math.min(q[1], r[3]));
    if(Math.hypot(cx-q[0], cy-q[1]) < q[2]) c += 30;
  });
  ob.rects.forEach(o=>{ if(r[0]<o[2] && r[2]>o[0] && r[1]<o[3] && r[3]>o[1]) c += 40; });
  return c;
}
function place(cands, w, h, ob, extra){
  let best = null, bc = Infinity;
  for(const c of cands){
    const r = [c[0]-w/2, c[1]-h/2, c[0]+w/2, c[1]+h/2];
    const cost = rectCost(r, ob) + (extra ? extra(c) : 0);
    if(cost < bc){ bc = cost; best = r; if(cost===0) break; }
  }
  ob.rects.push([best[0]-3, best[1]-3, best[2]+3, best[3]+3]);
  return best;
}

/* width of a short TeX label, estimated from what it draws, in ems:
   subscripts are small, a relation carries a thick space on each side */
function texW(s, fs){
  let t = s.replace(/\\(?:left|right|!|,|;|big|Big)/g,'').replace(/\\text\{([^}]*)\}/g,'$1');
  let em = 0;
  t = t.replace(/[_^](\{(?:[^{}]|\{[^{}]*\})*\}|\\[a-zA-Z]+|.)/g, m => {
    const inner = m.slice(1).replace(/^\{|\}$/g,'').replace(/\\(?:min|max)/g,'mmm').replace(/\\[a-zA-Z]+/g,'x').replace(/[{}]/g,'');
    em += 0.4*inner.length; return ''; });
  t = t.replace(/\\sqrt/g, () => { em += 0.95; return ''; })
       .replace(/\\[a-zA-Z]+/g, () => { em += 0.62; return ''; })
       .replace(/=/g, () => { em += 1.35; return ''; })
       .replace(/[.,]/g, () => { em += 0.3; return ''; })
       .replace(/[{}]/g,'');
  em += 0.6*t.length;
  return em*fs + 5;
}

/* ---- the constellation figure ------------------------------------------
   pts   coordinates on (psi1, psi2)
   o.names       TeX name of each point (default s_1 ... s_M)
   o.dTex        value written after d_min
   o.oneD        a one-dimensional set: no psi2 axis
   o.hide        draw the regions and boundaries only (a given, not an answer)
   o.regionNames names written inside the regions instead of at the points
   o.nn=false    no nearest-neighbour marking
   o.title       a short TeX title at the top right of the data area
   o.pairStyle   {color, width, dash} of a nearest-neighbour pair (i,j),
                 a solid coral line by default                               */
function cfig(pts, o){
  o = o || {};
  const M = pts.length, LS = P.labelScale();
  const names = o.names || pts.map((_,i)=>'s_{'+(i+1)+'}');
  const oneD = !!o.oneD;
  const xs = pts.map(p=>p[0]), ys = pts.map(p=>p[1]);
  let dmin = Infinity;
  for(let i=0;i<M;i++) for(let j=i+1;j<M;j++) dmin = Math.min(dmin, Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]));
  const span = Math.max(Math.max(...xs)-Math.min(...xs), Math.max(...ys)-Math.min(...ys), dmin);
  const m = o.margin || Math.max(0.36*span, 0.6*dmin);
  let xr = [Math.min(0,...xs)-m, Math.max(0,...xs)+m];
  let yr = oneD ? [-1,1] : [Math.min(0,...ys)-m, Math.max(0,...ys)+m];
  if(o.xr) xr = o.xr; if(o.yr) yr = o.yr;
  /* equal scales on the two axes, so a perpendicular bisector looks perpendicular */
  const kpx = o.k || Math.min(560/(xr[1]-xr[0]), oneD ? 1e9 : 440/(yr[1]-yr[0]));
  if(oneD){ const hh = 62/kpx; yr = [-hh, hh]; }
  /* the regions first, in data units, so the ticks can keep clear of them */
  const box = [xr[0], xr[1], yr[0], yr[1]];
  const polys = regionsOf(pts, box);
  const eps = 1e-7*(span*span+1);
  const edges = [];
  const adj = pts.map(()=>[]);
  for(let i=0;i<M;i++) for(let j=i+1;j<M;j++){
    const e = sharedEdge(polys, pts, i, j, eps);
    if(e){ edges.push(e); adj[i].push(j); adj[j].push(i); }
  }
  /* A tick number crossed by a boundary or sitting on a point is dropped. In
     one dimension the ticks are the points themselves, unless given. */
  const step = o.tick || P.niceStep(Math.max(xr[1]-xr[0], oneD?0:(yr[1]-yr[0])), 6);
  const tk = r => { const t=[]; for(let v=Math.ceil(r[0]/step-1e-9)*step; v<=r[1]+1e-9; v+=step) if(Math.abs(v)>1e-9) t.push(+v.toFixed(6)); return t; };
  const LS0 = P.labelScale();
  const nnSegs = [];
  if(o.nn !== false && !o.hide) for(let i=0;i<M;i++) for(let j=i+1;j<M;j++)
    if(Math.abs(Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]) - dmin) < 1e-6*(1+dmin)) nnSegs.push([pts[i],pts[j]]);
  const clear = rr => !edges.concat(nnSegs).some(e=>segHitsRect(e, rr)) &&
    (o.hide || !pts.some(p=>p[0]>rr[0]-7/kpx && p[0]<rr[2]+7/kpx && p[1]>rr[1]-7/kpx && p[1]<rr[3]+7/kpx));
  const xLab = v => { const tw = 7.6*P.fmt(v,3).length*LS0/kpx; return [v-tw/2-2/kpx, -(20*LS0+6)/kpx, v+tw/2+2/kpx, -5/kpx]; };
  const yLab = v => { const tw = 7.6*P.fmt(v,3).length*LS0/kpx; return [-(12+tw)/kpx, v-7*LS0/kpx, -5/kpx, v+9*LS0/kpx]; };
  /* in one dimension a tick that sits on a threshold is written beside the line, not under it */
  const onEdge = v => oneD && edges.some(e=>Math.abs(e[0][0]-v)<1e-6 && Math.abs(e[1][0]-v)<1e-6);
  const xtAll = o.xticks || (oneD ? pts.map(p=>+p[0].toFixed(6)).concat(edges.map(e=>+e[0][0].toFixed(6))).filter(v=>Math.abs(v)>1e-9) : tk(xr).filter(v=>clear(xLab(v))));
  const yt = oneD ? [] : (o.yticks || tk(yr).filter(v=>clear(yLab(v))));
  const xt = xtAll.filter(v=>!onEdge(v)), xtSide = xtAll.filter(onEdge);
  /* a one-dimensional set has no psi2 name above it, so a title needs its own room */
  const pad = {l:46, r:28, t:(oneD && o.title) ? 36 : 22, b:40};
  let w = Math.round(kpx*(xr[1]-xr[0]))+pad.l+pad.r, h = Math.round(kpx*(yr[1]-yr[0]))+pad.t+pad.b, a;
  for(let it=0; it<4; it++){
    a = P.Axes({w, h, xr, yr, pad, xlabel:'\\psi_1', ylabel: oneD ? '' : '\\psi_2',
      xticksOverride:xt, yticksOverride:yt, zeroAxes:!oneD, grid:!oneD});
    const ex = kpx*(xr[1]-xr[0]) - (a.x1-a.x0), ey = kpx*(yr[1]-yr[0]) - (a.y0-a.y1);
    if(Math.abs(ex)<0.6 && Math.abs(ey)<0.6) break;
    w = Math.round(w+ex); h = Math.round(h+ey);
  }
  const X = v => a.sx(v), Y = v => a.sy(v);
  xtSide.forEach(v=>a.raw(`<text x="${(X(v)+5*LS0).toFixed(2)}" y="${(Y(0)+20*LS0).toFixed(2)}" paint-order="stroke" stroke="var(--fig-halo,#FCF9F3)" stroke-width="3.4" stroke-linejoin="round" font-size="${13*LS0}" fill="${C.muted}" text-anchor="start">${P.fmt(v,3)}</text>`));
  /* a one-dimensional axis still names its origin */
  const zeroLab = oneD && xr[0]<0 && xr[1]>0 && !xt.includes(0) && (o.zeroTick || pts.some(p=>Math.abs(p[0])<1e-9));
  if(zeroLab)
    a.raw(`<text x="${X(0).toFixed(2)}" y="${(Y(0)+20*LS0).toFixed(2)}" paint-order="stroke" stroke="var(--fig-halo,#FCF9F3)" stroke-width="3.4" stroke-linejoin="round" font-size="${13*LS0}" fill="${C.muted}" text-anchor="middle">0</text>`);
  /* a colouring in which neighbouring regions differ */
  const col = o.colors || (()=>{
    const c = [], used = [0,0,0,0,0];
    for(let i=0;i<M;i++){
      const ban = new Set(adj[i].filter(j=>j<i).map(j=>c[j]));
      let best = -1;
      for(let k=0;k<4;k++) if(!ban.has(k) && (best<0 || used[k]<used[best])) best = k;
      if(best<0) best = 4;
      c.push(best); used[best]++;
    }
    return c;
  })();
  /* fills */
  polys.forEach((pg,i)=>{
    if(pg.length<3) return;
    const d = 'M'+pg.map(v=>X(v[0]).toFixed(2)+','+Y(v[1]).toFixed(2)).join('L')+'Z';
    a.under(`<path d="${d}" fill="${C.dec[SYM[col[i]]]}" stroke="none"/>`);
  });
  const segs = [];
  /* region boundaries */
  edges.forEach(e=>{
    a.poly(e, {color:C.muted, width:1.3, dash:'6 4'});
    segs.push([[X(e[0][0]),Y(e[0][1])],[X(e[1][0]),Y(e[1][1])],12]);
  });
  if(oneD){
    const yz = Y(0);
    a.raw(`<line x1="${a.x0}" y1="${yz.toFixed(2)}" x2="${a.x1+10}" y2="${yz.toFixed(2)}" stroke="${C.axis}" stroke-width="1.5"/>`
        + `<path d="M${a.x1+10},${yz.toFixed(2)} l-8,-4 v8 Z" fill="${C.axis}"/>`);
    segs.push([[a.x0,yz],[a.x1+10,yz],8]);
  } else {
    if(yr[0]<0 && yr[1]>0) segs.push([[a.x0,Y(0)],[a.x1+10,Y(0)],8]);
    if(xr[0]<0 && xr[1]>0) segs.push([[X(0),a.y0],[X(0),a.y1-8],8]);
  }
  /* nearest-neighbour pairs */
  const pairs = [];
  for(let i=0;i<M;i++) for(let j=i+1;j<M;j++)
    if(Math.abs(Math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1]) - dmin) < 1e-6*(1+dmin)) pairs.push([i,j]);
  const showNN = o.nn !== false && !o.hide;
  if(showNN) pairs.forEach(([i,j])=>{
    const ps = o.pairStyle ? o.pairStyle(i,j) : {};
    a.poly([pts[i],pts[j]], {color:ps.color||C.coral, width:ps.width||2.4, dash:ps.dash});
    segs.push([[X(pts[i][0]),Y(pts[i][1])],[X(pts[j][0]),Y(pts[j][1])],12]);
  });
  /* points */
  const rp = 6.2;
  if(!o.hide) pts.forEach((p,i)=>a.point(p[0],p[1],{color:C[SYM[col[i]]], r:rp, ring:C.plate, ringw:1.6}));
  /* obstacles for the labels */
  const ob = { box:[a.x0+2, a.y1+2, a.x1-2, a.y0-2], segs, rects:[],
    circ: o.hide ? [] : pts.map(p=>[X(p[0]), Y(p[1]), rp*1.25+3]) };
  const TS = 13*LS;
  xt.forEach(v=>{ const s=P.fmt(v,3), tw=7.6*String(s).length*LS; const yb=(oneD?Y(0):(yr[0]<=0&&yr[1]>=0?Y(0):a.y0));
    ob.rects.push([X(v)-tw/2-2, yb+6, X(v)+tw/2+2, yb+20*LS+5]); });
  if(zeroLab) ob.rects.push([X(0)-6, Y(0)+6, X(0)+6, Y(0)+20*LS+5]);
  xtSide.forEach(v=>{ const tw=7.6*P.fmt(v,3).length*LS; ob.rects.push([X(v)+3, Y(0)+6, X(v)+7+tw, Y(0)+20*LS+5]); });
  yt.forEach(v=>{ const s=P.fmt(v,3), tw=7.6*String(s).length*LS; const xb=(xr[0]<=0&&xr[1]>=0?X(0):a.x0);
    ob.rects.push([xb-10-tw-2, Y(v)-TS*0.75, xb-6, Y(v)+TS*0.5]); });
  const FS = 15;
  const labels = [];
  /* texName sets the foot of the formula's box on `baseline`; the box is about
     nineteen units tall, so its middle sits half of that above the foot */
  const texAt = (txt, r, color) => labels.push(P.texName(txt, { xMid:(r[0]+r[2])/2, baseline:(r[1]+r[3])/2+9.5*LS,
    size:FS, color, figW:w }));
  /* point names: outward from the centre of the set first */
  const cx = xs.reduce((s,v)=>s+v,0)/M, cy = ys.reduce((s,v)=>s+v,0)/M;
  if(!o.hide) pts.forEach((p,i)=>{
    const lw = texW(names[i], FS)*LS, lh = 21*LS;
    let th0 = Math.atan2(p[1]-cy, p[0]-cx);
    if(Math.hypot(p[0]-cx, p[1]-cy) < 1e-9) th0 = Math.PI/4;
    if(oneD) th0 = Math.PI/2;
    /* rings of growing radius, and on each ring the outward direction first */
    const cands = [];
    for(let g=2; g<=70; g+=3){
      [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6,7,-7,8,-8,9,-9,10,-10,11,-11,12,-12,13,-13,14,-14,15,-15,16].forEach(k=>{
        const th = th0 + k*Math.PI/16, ux = Math.cos(th), uy = -Math.sin(th);
        const dist = Math.abs(ux)*lw/2 + Math.abs(uy)*lh/2 + rp + g;
        cands.push([X(p[0]) + ux*dist, Y(p[1]) + uy*dist]);
      });
    }
    /* a name belongs inside its own region, so it cannot be read as a neighbour's */
    const pg = polys[i];
    const own = c => { const xd = xr[0]+(c[0]-a.x0)/kpx, yd = yr[0]+(a.y0-c[1])/kpx;
      for(let q=0;q<pg.length;q++){ const A=pg[q], B=pg[(q+1)%pg.length];
        if((B[0]-A[0])*(yd-A[1])-(B[1]-A[1])*(xd-A[0]) < -1e-9) return 25; }
      return 0; };
    texAt(names[i], place(cands, lw, lh, ob, own), C[SYM[col[i]]]);
  });
  /* region names for a figure that gives the regions */
  if(o.regionNames) polys.forEach((pg,i)=>{
    const lw = texW(o.regionNames[i], FS)*LS, lh = 21*LS;
    const gx = pg.reduce((s,v)=>s+v[0],0)/pg.length, gy = pg.reduce((s,v)=>s+v[1],0)/pg.length;
    const tx = o.regionAt ? o.regionAt[i][0] : gx, ty = o.regionAt ? o.regionAt[i][1] : gy;
    const cands = [[X(tx),Y(ty)]];
    for(let rr=10; rr<=60; rr+=10) for(let k=0;k<8;k++) cands.push([X(tx)+rr*Math.cos(k*Math.PI/4), Y(ty)-rr*Math.sin(k*Math.PI/4)]);
    texAt(o.regionNames[i], place(cands, lw, lh, ob), C[SYM[col[i]]]);
  });
  /* d_min beside one nearest-neighbour pair */
  if(showNN && o.dTex !== false){
    const txt = 'd_{\\min}' + (o.dTex ? '='+o.dTex : '');
    const lw = texW(txt, FS)*LS, lh = 23*LS;
    const order = o.dPair!=null ? [pairs[o.dPair]].concat(pairs) : pairs;
    const cands = [];
    order.forEach(([i,j])=>{
      const A = [X(pts[i][0]),Y(pts[i][1])], B = [X(pts[j][0]),Y(pts[j][1])];
      const L = Math.hypot(B[0]-A[0], B[1]-A[1]), nx = -(B[1]-A[1])/L, ny = (B[0]-A[0])/L;
      const off = Math.abs(nx)*lw/2 + Math.abs(ny)*lh/2 + 7;
      [0.5,0.32,0.68,0.2,0.8,0.1,0.9,0,1,-0.15,1.15,-0.3,1.3,-0.45,1.45].forEach(t=>[1,-1].forEach(sg=>[0,10,22,36].forEach(g=>
        cands.push([A[0]+t*(B[0]-A[0])+sg*nx*(off+g), A[1]+t*(B[1]-A[1])+sg*ny*(off+g)]))));
    });
    texAt(txt, place(cands, lw, lh, ob), C.coral);
  }
  /* a panel title sits above the data area, right-aligned, clear of the psi2 name */
  if(o.title) labels.push(P.texName(o.title, { xRight:a.x1, baseline:a.y1-5*LS, size:FS, color:C.ink, figW:w }));
  a.raw(labels.join(''));
  return a.svg().replace('<svg ', `<svg style="max-width:${o.maxw||Math.round(w*1.45)}px;margin:0 auto" `);
}

/* two figures side by side, wrapping on a narrow screen */
const pair = (s1, s2) => `<div style="display:flex;flex-wrap:wrap;gap:12px 20px;justify-content:center;align-items:flex-end">`
  + [s1,s2].map(s=>`<div style="flex:1 1 300px;min-width:0">${s}</div>`).join('') + `</div>`;

/* several figures in a row, wrapping on a narrow screen */
const row = (...ss) => `<div style="display:flex;flex-wrap:wrap;gap:12px 20px;justify-content:center;align-items:flex-end">`
  + ss.map(s=>`<div style="flex:1 1 260px;min-width:0">${s}</div>`).join('') + `</div>`;

/* ---- figures for the four textbook-shaped questions ------------------- */

/* D5-09: raised-cosine spectra about the carrier, at unit height. The solid
   band is 16-QAM and QPSK, which share a symbol rate; the dashed one is
   64-QAM. Each band is marked by a bracket with its width. */
function rcSpec(f, Rs, al){
  const x = Math.abs(f), f1 = (1-al)*Rs/2, f2 = (1+al)*Rs/2;
  if(x<=f1) return 1;
  if(x>=f2) return 0;
  return 0.5*(1+Math.cos(Math.PI*(x-f1)/(al*Rs)));
}
function figBands(){
  const a = P.Axes({w:460, h:290, xr:[-10,10], yr:[0,1.62], xlabel:'f-f_c\\;(\\mathrm{MHz})', ylabel:'|S(f)|',
    pad:{l:34,r:22,t:22,b:44}, xticksOverride:[-7.5,-5,0,5,7.5], yticksOverride:[], grid:false});
  a.curve(f=>rcSpec(f,12,0.25), {color:C.in, width:2.4});
  a.curve(f=>rcSpec(f,8,0.25), {color:C.in, width:2.2, dash:'7 5'});
  /* the band names start right of the vertical axis, so the axis never crosses them */
  a.span(-7.5, 7.5, 1.40, '', {color:C.in});
  a.span(-5, 5, 1.12, '', {color:C.in});
  a.note(0.45, 1.47, '\\text{16-QAM, QPSK: }15\\ \\mathrm{MHz}', {tex:true, fs:13, color:C.in});
  a.note(0.45, 1.19, '\\text{64-QAM: }10\\ \\mathrm{MHz}', {tex:true, fs:13, color:C.in});
  return a.svg();
}

/* D5-09: the three schemes on the bandwidth-efficiency plane of m5-plane:
   R_b/B against the extra E_b/N_0 each needs over QPSK for the same error,
   with the transmit power of each written beside it. */
function figRate(){
  const a = P.Axes({w:460, h:290, xr:[-1,10.5], yr:[0,6], xlabel:'\\Delta(E_b/N_0)\\;(\\mathrm{dB})',
    ylabel:'R_b/B\\;(\\mathrm{b/s/Hz})', pad:{l:44,r:22,t:22,b:44}, xstep:2, ystep:1});
  const S = [[0,1.6,'\\text{QPSK, }50\\ \\mathrm{mW}',0.35,0.55,'start'],
             [3.98,3.2,'\\text{16-QAM, }250\\ \\mathrm{mW}',4.35,2.25,'start'],
             [8.45,4.8,'\\text{64-QAM, }700\\ \\mathrm{mW}',8.1,5.25,'end']];
  a.poly(S.map(s=>[s[0],s[1]]), {color:C.muted, width:1.2, dash:'4 4'});
  S.forEach(s=>{ a.point(s[0], s[1], {color:C.in, r:5.2, ring:C.plate});
    a.note(s[3], s[4], s[2], {tex:true, fs:13, color:C.in, anchor:s[5]}); });
  return a.svg();
}

/* D5-17: BPSK seen by a receiver whose carrier is off by phi. The plane is
   drawn in units of sqrt(E_b). The fixed boundary psi1 = 0 splits the
   plane into the two decision regions; the hollow rings are the points
   without the phase error and the filled ones the turned points. The
   horizontal bar from the boundary to s_1 is its distance, coral while
   the point is on its own side and red once it has crossed. */
function figPhase(deg, o){
  const ph = deg*Math.PI/180, c = Math.cos(ph), s = Math.sin(ph);
  const a = P.Axes({w:330, h:330, xr:[-1.55,1.55], yr:[-1.55,1.55], xlabel:'\\psi_1', ylabel:'\\psi_2',
    pad:{l:30,r:26,t:22,b:40}, xticksOverride:[-1,1], yticksOverride:[-1,1], grid:false});
  const X = a.sx, Y = a.sy;
  a.under(`<rect x="${X(0).toFixed(2)}" y="${a.y1}" width="${(a.x1-X(0)).toFixed(2)}" height="${(a.y0-a.y1).toFixed(2)}" fill="${C.dec.in}"/>`
        + `<rect x="${a.x0}" y="${a.y1}" width="${(X(0)-a.x0).toFixed(2)}" height="${(a.y0-a.y1).toFixed(2)}" fill="${C.dec.out}"/>`);
  a.poly([[0,-1.55],[0,1.55]], {color:C.muted, width:1.3, dash:'6 4'});
  [1,-1].forEach(v=>a.raw(`<circle cx="${X(v).toFixed(2)}" cy="${Y(0).toFixed(2)}" r="6.2" fill="none" stroke="${C.muted}" stroke-width="1.4" stroke-dasharray="3 2"/>`));
  /* the turn: an arc of radius 0.22 from 0 to phi */
  const R = 0.22, n = 40, arc = [];
  for(let i=0;i<=n;i++){ const t = ph*i/n; arc.push(X(R*Math.cos(t)).toFixed(2)+','+Y(R*Math.sin(t)).toFixed(2)); }
  a.raw(`<path d="M${arc.join('L')}" fill="none" stroke="${C.mid}" stroke-width="1.6"/>`);
  a.poly([[c,s],[c,0]], {color:C.muted, width:1.1, dash:'3 3'});
  a.poly([[0,s],[c,s]], {color: c>0 ? C.coral : C.err, width:2.4});
  a.point(c, s, {color:C.in, r:6.2, ring:C.plate, ringw:1.6});
  a.point(-c, -s, {color:C.out, r:6.2, ring:C.plate, ringw:1.6});
  a.note(1.34*c, 1.34*s-0.07, 's_1', {tex:true, fs:15, color:C.in, anchor:'middle'});
  a.note(-1.34*c, -1.34*s-0.07, 's_2', {tex:true, fs:15, color:C.out, anchor:'middle'});
  a.note(o.dAt[0], o.dAt[1], o.dTex, {tex:true, fs:14, color: c>0 ? C.coral : C.err, anchor:o.dAt[2]});
  a.raw(P.texName('\\varphi='+deg+'^{\\circ}', { xRight:a.x1, baseline:a.y1-5, size:15, color:C.mid, figW:330 }));
  return a.svg();
}

/* D5-14: the correlation coefficient of two tones against their spacing.
   Solid: equal phases, rho = sin(2 pi df T)/(2 pi df T), zero at every
   multiple of 1/(2T). Dashed: the largest |rho| over all phase differences,
   |sin(pi df T)/(pi df T)|, zero only at multiples of 1/T. The two least
   spacings are marked. */
function figCorr(){
  const T = 0.002;
  const coh = f => { const x = 2*Math.PI*f*T; return f<1e-9 ? 1 : Math.sin(x)/x; };
  const env = f => { const x = Math.PI*f*T; return f<1e-9 ? 1 : Math.abs(Math.sin(x)/x); };
  const a = P.Axes({w:720, h:310, xr:[0,1650], yr:[-0.32,1.12], xlabel:'\\Delta f\\;(\\mathrm{Hz})', ylabel:'\\rho',
    pad:{l:52,r:30,t:22,b:44}, xticksOverride:[250,500,750,1000,1250,1500], yticksOverride:[-0.2,0.5,1]});
  [[250,'\\tfrac{1}{2T}'],[500,'\\tfrac{1}{T}']].forEach(([f,t])=>{
    a.poly([[f,-0.32],[f,0.9]], {color:C.muted, width:1.1, dash:'3 4'});
    a.note(f, 0.97, t, {tex:true, fs:14, color:C.ink, anchor:'middle'}); });
  a.curve(env, {color:C.mid, width:2.2, dash:'7 5'});
  a.curve(coh, {color:C.in, width:2.4});
  for(let k=1;k<=6;k++) a.point(250*k, 0, {color:C.in, r:3.6, ring:C.plate});
  [500,1000,1500].forEach(f=>a.raw(`<circle cx="${a.sx(f).toFixed(2)}" cy="${a.sy(0).toFixed(2)}" r="8" fill="none" stroke="${C.mid}" stroke-width="1.8"/>`));
  /* a legend card in the upper right, where both traces are low */
  const lx = a.sx(1040), ly = a.sy(1.02), lw = a.x1 - 8 - lx, lh = 62;
  a.raw(`<rect x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" width="${lw.toFixed(2)}" height="${lh}" rx="6" fill="${C.plate}" stroke="${C.rule}" stroke-width="1"/>`
      + `<line x1="${(lx+12).toFixed(2)}" y1="${(ly+19).toFixed(2)}" x2="${(lx+42).toFixed(2)}" y2="${(ly+19).toFixed(2)}" stroke="${C.in}" stroke-width="2.4"/>`
      + `<line x1="${(lx+12).toFixed(2)}" y1="${(ly+45).toFixed(2)}" x2="${(lx+42).toFixed(2)}" y2="${(ly+45).toFixed(2)}" stroke="${C.mid}" stroke-width="2.2" stroke-dasharray="7 5"/>`);
  a.raw(P.texName('\\Delta\\varphi=0', { xLeft:lx+50, baseline:ly+26, size:14, color:C.ink, figW:720 }));
  a.raw(P.texName('\\max_{\\Delta\\varphi}|\\rho|', { xLeft:lx+50, baseline:ly+53, size:14, color:C.ink, figW:720 }));
  return a.svg();
}

/* ---- figures for the two link-budget questions (D5-15, D5-20) --------- */

const tx = (a, x, y, s, col, anchor) => a.note(x, y, s, {tex:true, fs:13, color:col||C.ink, anchor:anchor||'start'});
const lg = v => Math.log10(Math.max(v, 1e-14));
/* a vertical arrow in data coordinates, for a gain or a loss in dB */
function varrow(a, x, y0, y1, col){
  const X = a.sx(x), Y0 = a.sy(y0), Y1 = a.sy(y1), s = Y1 < Y0 ? 1 : -1, h = 8;
  a.raw(`<line x1="${X.toFixed(2)}" y1="${Y0.toFixed(2)}" x2="${X.toFixed(2)}" y2="${(Y1+s*h*0.8).toFixed(2)}" stroke="${col}" stroke-width="2.2"/>`
      + `<path d="M${X.toFixed(2)},${Y1.toFixed(2)} l-4.4,${(s*h).toFixed(2)} h8.8 Z" fill="${col}"/>`);
}
const Qd = x => { const z = Math.abs(x)/Math.SQRT2, t = 1/(1+0.5*z);
  const r = t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+
    t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x >= 0 ? r/2 : 1-r/2; };

/* D5-20: the nearest-neighbour bit error of the three schemes against
   E_b/N_0, the target 1e-6, and where each curve meets it. */
function figPb35(){
  const S = [['\\text{QPSK}', g=>Qd(Math.sqrt(2*g)), 10.53, null],
             ['8\\text{-PSK}', g=>2/3*Qd(Math.sqrt(0.8787*g)), 13.95, '7 5'],
             ['16\\text{-QAM}', g=>0.75*Qd(Math.sqrt(0.8*g)), 14.40, '2 4']];
  const a = P.Axes({w:460, h:290, xr:[4,18], yr:[-8,-1], xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'P_b',
    pad:{l:52,r:22,t:22,b:44}, xticksOverride:[4,8,12,16], yticksOverride:[-8,-6,-4,-2], ytickfmt:P.decade, zeroAxes:false});
  a.hline(-6, {color:C.ink, dash:'6 4', width:1.2});
  S.forEach(([n, f, x, dash])=>a.curve(d=>lg(f(Math.pow(10, d/10))), {color:C.err, width:2.2, dash}));
  S.forEach(([n, f, x])=>a.point(x, -6, {color:C.err, r:4.6, ring:C.plate}));
  ['\\text{solid: QPSK, }10.53\\text{ dB}', '\\text{dashed: 8-PSK, }13.95\\text{ dB}', '\\text{dotted: 16-QAM, }14.40\\text{ dB}']
    .forEach((s,i)=>tx(a, 17.7, -1.55-0.55*i, s, C.err, 'end'));
  return a.svg();
}

/* D5-20: the three sensitivities against the bit rate, above the noise in
   the 6 MHz band. The bracket is the SNR at the QPSK sensitivity. */
function figSens35(){
  const a = P.Axes({w:460, h:290, xr:[7,23], yr:[-104,-76], xlabel:'R_b\\;(\\mathrm{Mb/s})', ylabel:'P_{\\min}\\;(\\mathrm{dBm})',
    pad:{l:52,r:22,t:22,b:44}, xticksOverride:[10,15,20], yticksOverride:[-100,-90,-80], zeroAxes:false});
  a.hline(-100.22, {color:C.muted, dash:'6 4', width:1.3});
  tx(a, 22.7, -102.6, 'N=-100.22\\text{ dBm in }6\\text{ MHz}', C.muted, 'end');
  a.poly([[10,-100.22],[10,-87.47]], {color:C.mid, width:2});
  tx(a, 9.6, -94.5, '12.75\\text{ dB}', C.mid, 'end');
  [[10,-87.47,'\\text{QPSK: }{-}87.47',10.5,-88.4,'start'],[15,-82.29,'8\\text{-PSK: }{-}82.29',15.5,-83.2,'start'],
   [20,-80.59,'16\\text{-QAM: }{-}80.59',20.3,-78.4,'end']].forEach(([x,y,s,lx,ly,an])=>{
    a.point(x, y, {color:C.out, r:5, ring:C.plate}); tx(a, lx, ly, s, C.out, an); });
  return a.svg();
}

/* D5-15: the designed link as a waterfall in decibels, from the transmit
   power through the two gains and the path loss to the received power,
   against the sensitivity and the noise in the band. */
function figWater38(){
  const lv = [20, 30, 30-109.94, 40-109.94], pr = lv[3], pm = -91.37, cx = [0.6, 1.8, 3.0, 4.2, 5.5];
  const a = P.Axes({w:460, h:320, xr:[0.2,7.4], yr:[-128,36], xlabel:'', ylabel:'\\text{power}\\;(\\mathrm{dBm})',
    pad:{l:52,r:22,t:22,b:30}, xticksOverride:[], yticksOverride:[-100,-80,-60,-40,-20,0,20], grid:false, zeroAxes:false});
  a.hline(pm, {color:C.ink, dash:'6 4', width:1.3});
  a.hline(-103.01, {color:C.muted, dash:'2 4', width:1.2});
  tx(a, 0.3, pm+5.5, 'P_{\\min}=-91.37', C.ink);
  tx(a, 7.25, -112, 'N=-103.01', C.muted, 'end');
  a.poly([[cx[0]-0.3,lv[0]],[cx[0]+0.3,lv[0]]], {color:C.in, width:4});
  tx(a, 0.35, lv[0]+5, '20', C.in);
  varrow(a, cx[1], lv[0], lv[1], C.h); tx(a, cx[1]+0.12, 23, '+10', C.h);
  varrow(a, cx[2], lv[1], lv[2], C.h); tx(a, cx[2]+0.12, -30, '-109.94', C.h);
  varrow(a, cx[3], lv[2], lv[3], C.h); tx(a, cx[3]-0.12, (lv[2]+lv[3])/2-2, '+10', C.h, 'end');
  a.poly([[cx[4]-0.3,pr],[cx[4]+0.3,pr]], {color:C.out, width:4});
  tx(a, cx[4], pr+6, '-69.94', C.out, 'middle');
  a.poly([[cx[4],pm],[cx[4],pr]], {color:C.mid, width:2});
  tx(a, cx[4]+0.15, (pm+pr)/2-2, '21.43\\text{ dB}', C.mid);
  ['P_t','G_t','L_p','G_r','P_r'].forEach((n,i)=>tx(a, cx[i], -123, n, C.ink, 'middle'));
  return a.svg();
}

/* D5-15: received power against distance for the designed link (solid),
   at 6 GHz with the same gains (dashed) and with antennas of the same size
   (dotted), against the power the designed margin needs at 8 and 32 Mb/s. */
function figRange38(){
  const Lp = (x, f) => 20*Math.log10(4*Math.PI*Math.pow(10, x)*f/3e8);
  const T = [[x=>40-Lp(x,1.5e9), null], [x=>40-Lp(x,6e9), '7 5'], [x=>40+24.08-Lp(x,6e9), '2 4']];
  const km = [0.5,1.25,2.5,5,10,20,50];
  const a = P.Axes({w:460, h:320, xr:[2.6,4.8], yr:[-106,-32], xlabel:'d\\;(\\mathrm{km})', ylabel:'P_r\\;(\\mathrm{dBm})',
    pad:{l:52,r:22,t:22,b:44}, xticksOverride:km.map(k=>3+Math.log10(k)), xtickfmt:x=>String(+Math.pow(10,x-3).toFixed(2)),
    yticksOverride:[-100,-80,-60,-40], zeroAxes:false});
  a.hline(-69.94, {color:C.ink, dash:'6 4', width:1.2});
  a.hline(-63.92, {color:C.ink, dash:'10 3 2 3', width:1.2});
  tx(a, 2.63, -77, '8\\text{ Mb/s}', C.ink, 'start');
  tx(a, 4.78, -61.0, '32\\text{ Mb/s}', C.ink, 'end');
  T.forEach(([f, dash])=>a.curve(f, {color:C.out, width:2.2, dash}));
  [[1.25,-69.94],[5,-69.94],[20,-69.94],[2.5,-63.92]].forEach(([d,y])=>{ const x = 3+Math.log10(d);
    a.poly([[x,-106],[x,y]], {color:C.muted, width:1, dash:'3 4'}); a.point(x, y, {color:C.out, r:4.6, ring:C.plate}); });
  ['\\text{solid: }1.5\\text{ GHz}', '\\text{dashed: }6\\text{ GHz, same gains}', '\\text{dotted: }6\\text{ GHz, same size}']
    .forEach((s,i)=>tx(a, 4.78, -38-6.5*i, s, C.out, 'end'));
  return a.svg();
}

/* the examination wording, shared by the questions that keep it */
const OPEN = 'Consider an $M$-ary modulation scheme where the equally probable symbols have the following waveforms: ';
const AWGN = ' These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$.';
const PDRAW = n => '['+n+' pts] Draw the signal constellation and the optimal decision regions for this signal constellation.';
const PNN = n => '['+n+' pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$, where $E_{s,\\text{avg}}$ is the average symbol energy.';

/* sets used by more than one question */
const onCircle = (r, angles) => angles.map(t=>[r*Math.cos(t), r*Math.sin(t)]);
const range = (a,b) => Array.from({length:b-a+1},(_,i)=>a+i);
const grid = (xs, ys) => [].concat(...ys.map(y=>xs.map(x=>[x,y])));
const gridNames = (nx, ny) => [].concat(...range(1,ny).reverse().map(n=>range(1,nx).map(mm=>'s_{'+mm+n+'}')));

/* ======================================================================
   The taxonomy: the shapes the modulation question takes.
   ====================================================================== */
CONTENT.DRILLTYPES.M5 = [
  { k:'psk', name:'Equal-energy phase sets',
    asks:'Waveforms $A\\cos(2\\pi f_ct+\\theta_k)$ with one amplitude and $M$ phases, often with an offset or an odd $M$. Draw the constellation and regions, then give $P_e$.',
    method:['Expand each waveform on $\\psi_1=\\sqrt{2/T}\\cos(2\\pi f_ct)$ and $\\psi_2=-\\sqrt{2/T}\\sin(2\\pi f_ct)$. A phase $\\theta_k$ becomes the angle $\\theta_k$ on a circle of radius $A\\sqrt{T/2}$.',
            'The regions are wedges centred on the points. Their boundaries bisect the angles between neighbouring points, so an offset only rotates the picture.',
            '$d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/M)$ and $N_{\\min}=2$ for $M\\ge3$. Write $d_{\\min}^{2}$ as a multiple of $E_{s,\\text{avg}}$ before substituting into $N_{\\min}Q\\big(\\sqrt{d_{\\min}^{2}/2N_0}\\big)$.'],
    go:'m5-mpsk-pe' },

  { k:'pam', name:'Amplitude sets on one carrier',
    asks:'Waveforms $c_k\\cos(2\\pi f_ct)$ with one phase and several amplitudes, possibly with a zero or an asymmetric level. Draw the line constellation and thresholds, then give $P_e$.',
    method:['One basis function carries every waveform. The coordinate of $c_k\\cos(2\\pi f_ct)$ on $\\psi_1$ is $c_k\\sqrt{T/2}$, and a negative amplitude is a negative coordinate.',
            'The thresholds are the midpoints between neighbouring points. The two end regions run to infinity.',
            'Count neighbours at $d_{\\min}$ point by point. An end point has one, an inner point has two, and a point further than $d_{\\min}$ from everything has none. Average over the $M$ points.'],
    go:'m5-mask' },

  { k:'qam', name:'Amplitude-and-phase sets',
    asks:'A square or rectangular grid, two rings, a set with a zero signal, or a set with one point off the circle. Draw it with its regions and give $P_e$ with the neighbour count averaged.',
    method:['Write each waveform as $a_k\\sqrt{2/T}\\cos-b_k\\sqrt{2/T}\\sin$ and read $(a_k,b_k)$ off it, or convert amplitude and phase with $\\cos(x+\\theta)=\\cos\\theta\\cos x-\\sin\\theta\\sin x$.',
            'Draw the perpendicular bisector of every close pair. Each region is the part of the plane nearer its own point than any other.',
            'Find $d_{\\min}$ from the distance table, then count for each point how many others sit at exactly $d_{\\min}$. $N_{\\min}$ is the average, and it need not be a whole number.'],
    go:'m5-qam' },

  { k:'fsk', name:'Sets built from two frequencies',
    asks:'Waveforms on two carrier frequencies, possibly with the zero signal or with both signs. Check orthogonality, choose the two axes, draw the set and give $P_e$.',
    method:['Two cosines on $0\\le t\\le T$ are orthogonal when their frequencies differ by a multiple of $1/(2T)$. Then each frequency is its own axis.',
            'If they are not orthogonal, compute $\\rho=\\langle s_1,s_2\\rangle/E$ and use Gram–Schmidt. The distance is $d^{2}=2E(1-\\rho)$.',
            'Orthogonal points of energy $E$ are $\\sqrt{2E}$ apart, antipodal ones $2\\sqrt{E}$. Everything else follows from the distance table.'],
    go:'m5-bfsk' },

  { k:'design', name:'Reversed questions and comparisons',
    asks:'The regions or the error expression are given and the waveforms are asked for, or two sets are compared at equal $E_{s,\\text{avg}}$.',
    method:['A boundary is the perpendicular bisector of two points. So each point is the mirror image of its neighbour in the boundary they share.',
            'An error expression gives $d_{\\min}^{2}/E_{s,\\text{avg}}$ and $N_{\\min}$. Match both against the formulas of each family.',
            'Compare two sets at the same $E_{s,\\text{avg}}$ through $10\\log_{10}$ of the ratio of their $d_{\\min}^{2}/E_{s,\\text{avg}}$ values. Mention $N_{\\min}$ as the second-order difference.'],
    go:'m5-compare' },

  { k:'band', name:'Rate, band and power of several schemes',
    asks:'A scheme with a given bit rate, carrier and roll-off is compared with others in the same band or at the same bit rate. Find symbol rates, bands, bit rates and the power each needs for the same error.',
    method:['A symbol carries $\\log_2M$ bits, so $R_s=R_b/\\log_2M$. On a carrier the band is $(1+\\alpha)R_s$, centred on $f_c$.',
            'The band fixes the symbol rate. In the same band a smaller constellation carries fewer bits a second.',
            'The same error at high SNR means the same $d_{\\min}$. Compare $E_s$ through $d_{\\min}^{2}=6E_s/(M-1)$, then the power through $P=E_sR_s$.'],
    go:'m5-spectrum' },

  { k:'gray', name:'Bit error and Gray labels',
    asks:'Several sets of $M$ points at the same $E_b$. Find $d_{\\min}$, decide whether a Gray labelling exists, and give the nearest-neighbour bit error.',
    method:['Scale each set to the given $E_b$ through $E_s=E_b\\log_2M$. Then read $d_{\\min}$ and $N_{\\min}$ from the distance table.',
            'A $k$-bit label has only $k$ labels one bit away. A point with more than $k$ neighbours at $d_{\\min}$ rules out a Gray labelling.',
            'Sum the differing bits over the $d_{\\min}$ pairs of each point and average to get $w$. Then $P_b\\approx(w/k)\\,Q\\big(\\sqrt{d_{\\min}^{2}/2N_0}\\big)$, and Gray labels give $w=N_{\\min}$.'],
    go:'m5-gray' },

  { k:'phase', name:'A carrier phase error',
    asks:'A coherent receiver whose carrier phase is off by $\\varphi$. Sketch the turned points against the fixed boundary, then find the error as a function of $\\varphi$ and the loss in decibels.',
    method:['Expand $\\cos(2\\pi f_ct+\\varphi)$ on $\\psi_1$ and $\\psi_2$. Every point turns by $\\varphi$, and the boundaries stay.',
            'For BPSK the distance to the boundary is $\\sqrt{E_b}\\cos\\varphi$, so $P_b=Q\\big(\\sqrt{2E_b/N_0}\\cos\\varphi\\big)$.',
            'The loss is $-20\\log_{10}\\cos\\varphi$ dB. Past $90^{\\circ}$ the decisions invert, and differential encoding removes a constant $\\varphi$.'],
    go:'m5-phase-offset' },

  { k:'spacing', name:'Tone spacing for FSK',
    asks:'Two tones on $0\\le t\\le T$. Find their inner product, the least spacing for orthogonality with equal phases and with any phases, and the band of $M$-FSK.',
    method:['Write the product of two cosines as half a difference-frequency cosine plus half a sum-frequency cosine. Drop the sum-frequency term and integrate.',
            'With equal phases $\\rho=\\sin(2\\pi\\Delta fT)/(2\\pi\\Delta fT)$, which is zero first at $\\Delta f=1/(2T)$.',
            'For every phase the difference term must run whole periods, so $\\Delta f=1/T$. $M$ tones take a band of about $M\\Delta f$.'],
    go:'m5-noncoh' },

  { k:'sens', name:'Sensitivity of several schemes',
    asks:'A band, a roll-off, a target bit error and a noise figure are given for several schemes. Find each bit rate, the $E_b/N_0$ each needs and the least received power in dBm.',
    method:['The band fixes $R_s=B/(1+\\alpha)$, and each scheme carries $R_b=R_s\\log_2M$.',
            'Write $d_{\\min}^{2}$ as a multiple of $E_b$ and set $P_b\\approx(\\bar N_{\\min}/\\log_2M)\\,Q\\big(\\sqrt{d_{\\min}^{2}/2N_0}\\big)$ equal to the target. Read the argument of $Q$ from the table.',
            'The sensitivity is $-174+\\text{NF}+10\\log_{10}R_b+(E_b/N_0)_{\\text{dB}}$ dBm. The band does not enter it.'],
    go:'m5-budget' },

  { k:'link', name:'Link budget what-ifs',
    asks:'A designed link with its power, antennas, range and receiver. Find the noise, the sensitivity and the margin, then the new range when the carrier or the bit rate changes.',
    method:['Work in decibels: powers in dBm, gains in dBi, losses in dB. The margin is $P_t+G_t+G_r-L_p-P_{\\min}$.',
            'The free-space loss is $20\\log_{10}(4\\pi d/\\lambda)$. A factor $a$ in $d$ or in $f_c$ adds $20\\log_{10}a$ dB.',
            'A change that costs $x$ dB at the same margin divides the range by $10^{x/20}$.'],
    go:'m5-ex-link' }
];

/* ======================================================================
   The questions.
   ====================================================================== */
CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- close variants of the examination shape ------------------------- */

{ id:'D5-01', module:'M5', type:'psk', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the following waveforms: $$s_k(t)=\\sqrt{18}\\cos\\!\\Big(3000\\pi t+\\frac{\\pi(2k+1)}{6}\\Big),\\quad k\\in\\{1,\\ldots,6\\},\\quad0\\le t\\le1.$$ These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$.',
  parts:['[10 pts] Draw the signal constellation and the optimal decision regions for this signal constellation.',
         '[10 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$, where $E_{s,\\text{avg}}$ is the average symbol energy.',
         '[5 pts] Evaluate the approximation of part (b) at $E_{s,\\text{avg}}/N_0=18$.'],
  sol:'<b>Given.</b> Six equally likely waveforms of amplitude $\\sqrt{18}$ at $f_c=1500$ Hz on $0\\le t\\le1$. The phases are $\\theta_k=\\pi(2k+1)/6$.<br>'
     +'<b>Find.</b> The constellation with its regions, $P_e$ as a function of $E_{s,\\text{avg}}/N_0$, and its value at $E_{s,\\text{avg}}/N_0=18$.<br>'
     +'<b>Method.</b> Use the orthonormal pair $\\psi_1(t)=\\sqrt2\\cos(3000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(3000\\pi t)$ on $0\\le t\\le1$. Equally likely signals in AWGN are detected best by the minimum-distance rule. Then $P_e\\approx N_{\\min}Q\\big(\\sqrt{d_{\\min}^{2}/2N_0}\\big)$.<br>'
     +'<b>Solution — (a).</b> Expand the cosine of a sum:'
     +'$$\\begin{aligned}s_k(t)&=\\sqrt{18}\\big[\\cos\\theta_k\\cos(3000\\pi t)-\\sin\\theta_k\\sin(3000\\pi t)\\big]\\\\&=\\frac{\\sqrt{18}}{\\sqrt2}\\cos\\theta_k\\,\\psi_1(t)+\\frac{\\sqrt{18}}{\\sqrt2}\\sin\\theta_k\\,\\psi_2(t)\\\\&=3\\cos\\theta_k\\,\\psi_1(t)+3\\sin\\theta_k\\,\\psi_2(t).\\end{aligned}$$'
     +'So $\\mathbf{s}_k=(3\\cos\\theta_k,\\,3\\sin\\theta_k)$ lies on a circle of radius $3$. The six angles are $\\theta_1=90^{\\circ}$, $\\theta_2=150^{\\circ}$, $\\theta_3=210^{\\circ}$, $\\theta_4=270^{\\circ}$, $\\theta_5=330^{\\circ}$ and $\\theta_6=390^{\\circ}\\equiv30^{\\circ}$. '
     +'Neighbouring points are $60^{\\circ}$ apart. The optimal region of each point is the $60^{\\circ}$ wedge centred on it. The wedge boundaries are the rays at $0^{\\circ},60^{\\circ},120^{\\circ},180^{\\circ},240^{\\circ}$ and $300^{\\circ}$.<br>'
     +'<b>Solution — (b).</b> Every waveform has the same energy, so the average is that energy:'
     +'$$\\begin{aligned}E_{s,\\text{avg}}&=\\int_0^1 18\\cos^2(3000\\pi t+\\theta_k)\\,dt\\\\&=9\\int_0^1\\big[1+\\cos(6000\\pi t+2\\theta_k)\\big]dt\\\\&=9\\Big[t+\\frac{\\sin(6000\\pi t+2\\theta_k)}{6000\\pi}\\Big]_0^1\\\\&=9.\\end{aligned}$$'
     +'The sine term is equal at both limits, because $6000\\pi$ is a whole number of periods. The chord between neighbours is'
     +'$$d_{\\min}=2\\cdot3\\sin\\frac{\\pi}{6}=3,\\qquad d_{\\min}^{2}=9=E_{s,\\text{avg}}.$$'
     +'Each point has two neighbours at $d_{\\min}$, one on each side. So $N_{\\min}=2$ and'
     +'$$\\begin{aligned}P_e&\\approx2Q\\Big(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\Big)\\\\&=2Q\\Big(\\sqrt{\\frac{E_{s,\\text{avg}}}{2N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The argument is $\\sqrt{18/2}=\\sqrt9=3.00$. The table gives $Q(3.00)=0.001350$. So $P_e\\approx2(0.001350)=2.70\\times10^{-3}$.<br>'
     +'<b>Check.</b> The general formula $d_{\\min}^{2}=4E_s\\sin^{2}(\\pi/M)$ gives $4\\cdot9\\cdot(0.5)^{2}=9$. The cosine rule gives $9+9-2\\cdot9\\cos60^{\\circ}=9$. Both agree with the coordinates.',
  err:'Drawing the first point at $0^{\\circ}$. The phase formula starts at $k=1$, so $\\theta_1=\\pi/2$, and the whole hexagon is rotated by $30^{\\circ}$ from the plain one.',
  teach:'This is the examination shape with a six-point set. The offset rotates the picture but changes neither $d_{\\min}$ nor $N_{\\min}$. Ask the class why.',
  figSol:()=>cfig(onCircle(3, range(1,6).map(k=>Math.PI*(2*k+1)/6)), {dTex:'3', tick:1}) },

{ id:'D5-02', module:'M5', type:'psk', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the following waveforms: $$s_k(t)=\\sqrt{24}\\cos\\!\\Big(2000\\pi t+\\frac{\\pi(4k-3)}{6}\\Big),\\quad k\\in\\{1,2,3\\},\\quad0\\le t\\le1.$$ These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$.',
  parts:['[10 pts] Draw the signal constellation and the optimal decision regions for this signal constellation.',
         '[10 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$.',
         '[5 pts] How many bits does one symbol carry? Rewrite the result of part (b) as a function of $E_b/N_0$.'],
  sol:'<b>Given.</b> Three equally likely waveforms of amplitude $\\sqrt{24}$ at $f_c=1000$ Hz on $0\\le t\\le1$, with phases $\\theta_k=\\pi(4k-3)/6$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and the same against $E_b/N_0$.<br>'
     +'<b>Method.</b> Use $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$. Then $A\\cos(2000\\pi t+\\theta)$ has coordinates $\\frac{A}{\\sqrt2}(\\cos\\theta,\\sin\\theta)$.<br>'
     +'<b>Solution — (a).</b> The radius is $\\sqrt{24}/\\sqrt2=\\sqrt{12}=2\\sqrt3$. The angles are'
     +'$$\\theta_1=\\frac{\\pi}{6}=30^{\\circ},\\quad\\theta_2=\\frac{5\\pi}{6}=150^{\\circ},\\quad\\theta_3=\\frac{9\\pi}{6}=270^{\\circ}.$$'
     +'So $\\mathbf{s}_1=(3,\\sqrt3)$, $\\mathbf{s}_2=(-3,\\sqrt3)$ and $\\mathbf{s}_3=(0,-2\\sqrt3)$. Each region is a $120^{\\circ}$ wedge centred on its point. The boundaries are the rays at $90^{\\circ}$, $210^{\\circ}$ and $330^{\\circ}$.<br>'
     +'<b>Solution — (b).</b> All three energies equal the squared radius, so $E_{s,\\text{avg}}=12$. From the coordinates of $\\mathbf{s}_1$ and $\\mathbf{s}_2$,'
     +'$$\\begin{aligned}d_{12}^{2}&=(3-(-3))^{2}+(\\sqrt3-\\sqrt3)^{2}\\\\&=36.\\end{aligned}$$'
     +'By symmetry every pair is $6$ apart. So $d_{\\min}=6$, $d_{\\min}^{2}=36=3E_{s,\\text{avg}}$, and each point has two neighbours: $N_{\\min}=2$. Substitute:'
     +'$$\\begin{aligned}P_e&\\approx2Q\\Big(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\Big)\\\\&=2Q\\Big(\\sqrt{\\frac{3E_{s,\\text{avg}}}{2N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> One symbol carries $\\log_2 3=1.585$ bits. So $E_{s,\\text{avg}}=1.585E_b$, and'
     +'$$P_e\\approx2Q\\Big(\\sqrt{\\frac{3(1.585)E_b}{2N_0}}\\Big)=2Q\\Big(\\sqrt{2.377\\frac{E_b}{N_0}}\\Big).$$<br>'
     +'<b>Check.</b> The chord formula gives $d_{\\min}=2(2\\sqrt3)\\sin60^{\\circ}=2(2\\sqrt3)(\\sqrt3/2)=6$. The squared radius times three is $36$, the same value.',
  err:'Writing $N_{\\min}=1$ because there are "only three points". Each point still has two neighbours at $d_{\\min}$, and each counts as a separate way to be wrong.',
  teach:'Three points on a circle are the smallest odd PSK set. The regions are three wedges, and the answer carries a non-integer bit count.',
  figSol:()=>cfig(onCircle(Math.sqrt(12), [Math.PI/6, 5*Math.PI/6, 3*Math.PI/2]), {dTex:'6', tick:2}) },

{ id:'D5-03', module:'M5', type:'psk', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the equally probable symbols have the following waveforms: $$s_k(t)=2\\cos\\!\\Big(4000\\pi t+\\frac{(2k-1)\\pi}{8}\\Big),\\quad k\\in\\{1,\\ldots,8\\},\\quad0\\le t\\le2.$$ These signals are planned to be transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$.',
  parts:['[8 pts] Find $E_{s,\\text{avg}}$, the number of bits per symbol and the average energy per bit $E_b$.',
         '[8 pts] Draw the signal constellation and the optimal decision regions for this signal constellation.',
         '[9 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$, and then as a function of $E_b/N_0$.'],
  sol:'<b>Given.</b> Eight equally likely waveforms of amplitude $2$ at $f_c=2000$ Hz, now on $0\\le t\\le2$. The phases are $\\theta_k=(2k-1)\\pi/8$.<br>'
     +'<b>Find.</b> $E_{s,\\text{avg}}$, bits per symbol, $E_b$, the constellation, and $P_e$ against both energies.<br>'
     +'<b>Method.</b> With $T=2$ the orthonormal pair is $\\psi_1(t)=\\sqrt{2/2}\\cos(4000\\pi t)=\\cos(4000\\pi t)$ and $\\psi_2(t)=-\\sin(4000\\pi t)$. A symbol of amplitude $A$ then has radius $A\\sqrt{T/2}=A$.<br>'
     +'<b>Solution — (a).</b> Integrate the squared waveform over the longer interval:'
     +'$$\\begin{aligned}E_k&=\\int_0^2 4\\cos^2(4000\\pi t+\\theta_k)\\,dt\\\\&=2\\int_0^2\\big[1+\\cos(8000\\pi t+2\\theta_k)\\big]dt\\\\&=2\\Big[t+\\frac{\\sin(8000\\pi t+2\\theta_k)}{8000\\pi}\\Big]_0^2\\\\&=2(2-0)=4.\\end{aligned}$$'
     +'The sine term is equal at $t=0$ and $t=2$, since $16000\\pi$ is a whole number of periods. So $E_{s,\\text{avg}}=4$. One symbol carries $\\log_2 8=3$ bits, so $E_b=4/3=1.333$.<br>'
     +'<b>Solution — (b).</b> The points are $\\mathbf{s}_k=(2\\cos\\theta_k,\\,2\\sin\\theta_k)$ at $22.5^{\\circ},67.5^{\\circ},\\ldots,337.5^{\\circ}$ on a circle of radius $2$. Each region is a $45^{\\circ}$ wedge centred on its point. The boundaries are the rays at $0^{\\circ},45^{\\circ},90^{\\circ},\\ldots,315^{\\circ}$, which include both axes.<br>'
     +'<b>Solution — (c).</b> The chord between neighbours is'
     +'$$\\begin{aligned}d_{\\min}^{2}&=4E_{s,\\text{avg}}\\sin^{2}\\frac{\\pi}{8}\\\\&=4E_{s,\\text{avg}}(0.1464)\\\\&=0.5858\\,E_{s,\\text{avg}}.\\end{aligned}$$'
     +'With $E_{s,\\text{avg}}=4$, $d_{\\min}=\\sqrt{2.343}=1.531$. Each point has two neighbours, so $N_{\\min}=2$:'
     +'$$\\begin{aligned}P_e&\\approx2Q\\Big(\\sqrt{\\frac{0.5858E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=2Q\\Big(\\sqrt{0.2929\\frac{E_{s,\\text{avg}}}{N_0}}\\Big)\\\\&=2Q\\Big(\\sqrt{0.8787\\frac{E_b}{N_0}}\\Big),\\end{aligned}$$'
     +'where the last line uses $E_{s,\\text{avg}}=3E_b$.<br>'
     +'<b>Check.</b> The cosine rule gives $d_{\\min}^{2}=4+4-2(4)\\cos45^{\\circ}=8-5.657=2.343$. This equals $0.5858\\times4=2.343$.',
  err:'Using $A^{2}/2=2$ as the energy. That is the energy over one second, and this symbol lasts two seconds. The radius is $A\\sqrt{T/2}$, not $A/\\sqrt2$.',
  teach:'The interval length is the twist. The energy doubles with $T$, and the orthonormal functions change with it, but the ratio $d_{\\min}^{2}/E_{s,\\text{avg}}$ does not.',
  figSol:()=>cfig(onCircle(2, range(1,8).map(k=>(2*k-1)*Math.PI/8)), {dTex:'1.531', tick:1}) },

{ id:'D5-04', module:'M5', type:'pam', src:'Final Q3',
  stem:OPEN+'$$s_k(t)=2(2k-5)\\cos(5000\\pi t),\\quad k\\in\\{1,2,3,4\\},\\quad0\\le t\\le1.$$'+AWGN,
  parts:[PDRAW(10), PNN(10), '[5 pts] Evaluate the approximation of part (b) at $E_{s,\\text{avg}}/N_0=22.5$.'],
  sol:'<b>Given.</b> Four equally likely waveforms with amplitudes $2(2k-5)\\in\\{-6,-2,2,6\\}$ on one carrier at $2500$ Hz, $0\\le t\\le1$.<br>'
     +'<b>Find.</b> The line constellation and its thresholds, $P_e$ against $E_{s,\\text{avg}}/N_0$, and its value at $22.5$.<br>'
     +'<b>Method.</b> One function $\\psi_1(t)=\\sqrt2\\cos(5000\\pi t)$ carries all four waveforms. A waveform $c\\cos(5000\\pi t)$ has the coordinate $c/\\sqrt2$ on it. Then use $P_e\\approx N_{\\min}Q\\big(\\sqrt{d_{\\min}^{2}/2N_0}\\big)$.<br>'
     +'<b>Solution — (a).</b> Write each waveform as a multiple of $\\psi_1$:'
     +'$$s_k(t)=\\frac{2(2k-5)}{\\sqrt2}\\,\\sqrt2\\cos(5000\\pi t)=\\sqrt2(2k-5)\\,\\psi_1(t).$$'
     +'The points are $-3\\sqrt2,-\\sqrt2,\\sqrt2,3\\sqrt2$, that is $-4.243,-1.414,1.414,4.243$. The optimal thresholds are the midpoints $-2\\sqrt2$, $0$ and $2\\sqrt2$. The two end regions run to $\\pm\\infty$.<br>'
     +'<b>Solution — (b).</b> The energy of a point is its squared coordinate:'
     +'$$\\begin{aligned}E_{s,\\text{avg}}&=\\frac{18+2+2+18}{4}\\\\&=10.\\end{aligned}$$'
     +'Neighbouring points are $d_{\\min}=2\\sqrt2$ apart, so $d_{\\min}^{2}=8=0.8E_{s,\\text{avg}}$. The end points have one neighbour and the inner points two:'
     +'$$N_{\\min}=\\frac{1+2+2+1}{4}=1.5.$$'
     +'Substitute both:'
     +'$$\\begin{aligned}P_e&\\approx1.5\\,Q\\Big(\\sqrt{\\frac{0.8E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=1.5\\,Q\\Big(\\sqrt{0.4\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The argument is $\\sqrt{0.4\\times22.5}=\\sqrt9=3.00$. With $Q(3.00)=0.001350$, $P_e\\approx1.5(0.001350)=2.03\\times10^{-3}$.<br>'
     +'<b>Check.</b> Integrate one waveform directly: $\\int_0^1 36\\cos^2(5000\\pi t)\\,dt=18\\big[t+\\frac{\\sin(10000\\pi t)}{10000\\pi}\\big]_0^1=18$. This equals $(3\\sqrt2)^{2}$. The family formula $d_{\\min}^{2}=12E_{s,\\text{avg}}/(M^{2}-1)=120/15=8$ also agrees.',
  err:'Placing the points at $\\pm2,\\pm6$. Those are amplitudes. The coordinate is the amplitude times $\\sqrt{T/2}$, and with $T=1$ that divides by $\\sqrt2$.',
  teach:'The examination shape on four amplitude levels. The fractional $N_{\\min}=1.5$ is the point to press.',
  figSol:()=>cfig([-3,-1,1,3].map(c=>[c*R2,0]), {oneD:true, dTex:'2\\sqrt{2}', margin:2.4, xticks:[-3,-1,1,3].map(c=>+(c*R2).toFixed(3))}) },

{ id:'D5-05', module:'M5', type:'pam', src:'Final Q3',
  stem:OPEN+'$$s_k(t)=3\\sqrt2\\,(k-1)\\cos(3000\\pi t),\\quad k\\in\\{1,2,3\\},\\quad0\\le t\\le1.$$'+AWGN,
  parts:[PDRAW(10), PNN(10), '[5 pts] The set is shifted so that its points are symmetric about the origin, with the same $d_{\\min}$. Find the saving in $E_{s,\\text{avg}}$ in decibels.'],
  sol:'<b>Given.</b> Three equally likely waveforms $0$, $3\\sqrt2\\cos(3000\\pi t)$ and $6\\sqrt2\\cos(3000\\pi t)$ on $0\\le t\\le1$.<br>'
     +'<b>Find.</b> The constellation and thresholds, $P_e$ against $E_{s,\\text{avg}}/N_0$, and the energy a symmetric set would save.<br>'
     +'<b>Method.</b> Use $\\psi_1(t)=\\sqrt2\\cos(3000\\pi t)$. The waveform $3\\sqrt2(k-1)\\cos(3000\\pi t)$ equals $3(k-1)\\psi_1(t)$. The set is one-dimensional and not centred on the origin.<br>'
     +'<b>Solution — (a).</b> The points are $0$, $3$ and $6$ on the $\\psi_1$ axis. The thresholds are the midpoints $1.5$ and $4.5$. Region $D_1$ is $\\psi_1<1.5$, $D_2$ is $1.5<\\psi_1<4.5$ and $D_3$ is $\\psi_1>4.5$.<br>'
     +'<b>Solution — (b).</b> Average the squared coordinates:'
     +'$$\\begin{aligned}E_{s,\\text{avg}}&=\\frac{0^{2}+3^{2}+6^{2}}{3}\\\\&=\\frac{45}{3}=15.\\end{aligned}$$'
     +'Neighbours are $d_{\\min}=3$ apart, so $d_{\\min}^{2}=9=0.6E_{s,\\text{avg}}$. The end points have one neighbour and the middle point two, so $N_{\\min}=4/3$. Then'
     +'$$\\begin{aligned}P_e&\\approx\\frac43\\,Q\\Big(\\sqrt{\\frac{0.6E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=\\frac43\\,Q\\Big(\\sqrt{0.3\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The symmetric set with the same spacing is $\\{-3,0,3\\}$. Its average energy is $(9+0+9)/3=6$. The saving is'
     +'$$10\\log_{10}\\frac{15}{6}=3.98\\ \\text{dB}.$$'
     +'Its approximation becomes $\\frac43Q\\big(\\sqrt{0.75E_{s,\\text{avg}}/N_0}\\big)$, with the same $N_{\\min}$.<br>'
     +'<b>Check.</b> An average energy is the spread about the mean plus the squared mean. The mean point is $3$ and the spread is $(9+0+9)/3=6$, so $6+3^{2}=15$. This agrees with part (b).',
  err:'Saying the shift changes the error probability at fixed $N_0$. It does not: the distances stay the same. What changes is the energy spent to get them.',
  teach:'This is the examination shape with an asymmetric set. Part (c) asks the question the asymmetry raises.',
  figSol:()=>cfig([[0,0],[3,0],[6,0]], {oneD:true, dTex:'3', margin:3, tick:1.5}) },

{ id:'D5-06', module:'M5', type:'pam', src:'Final Q3',
  stem:OPEN+'$$s_k(t)=2(k-3)\\cos(4000\\pi t),\\quad k\\in\\{1,\\ldots,5\\},\\quad0\\le t\\le0.5.$$'+AWGN,
  parts:['[8 pts] Find $E_{s,\\text{avg}}$ and the number of bits carried by one symbol.',
         PDRAW(8),
         '[9 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$. Evaluate it at $E_{s,\\text{avg}}/N_0=36$.'],
  sol:'<b>Given.</b> Five equally likely amplitudes $2(k-3)\\in\\{-4,-2,0,2,4\\}$ on a $2000$ Hz carrier. The symbol lasts $T=0.5$.<br>'
     +'<b>Find.</b> $E_{s,\\text{avg}}$, bits per symbol, the constellation, and $P_e$ with its value at $36$.<br>'
     +'<b>Method.</b> With $T=0.5$ the unit-energy carrier is $\\psi_1(t)=\\sqrt{2/T}\\cos(4000\\pi t)=2\\cos(4000\\pi t)$. So $2(k-3)\\cos(4000\\pi t)=(k-3)\\psi_1(t)$.<br>'
     +'<b>Solution — (a).</b> Integrate one squared waveform over $0\\le t\\le0.5$:'
     +'$$\\begin{aligned}E_k&=\\int_0^{0.5}4(k-3)^{2}\\cos^{2}(4000\\pi t)\\,dt\\\\&=2(k-3)^{2}\\Big[t+\\frac{\\sin(8000\\pi t)}{8000\\pi}\\Big]_0^{0.5}\\\\&=2(k-3)^{2}(0.5)=(k-3)^{2}.\\end{aligned}$$'
     +'The sine is zero at both limits. Averaging $4,1,0,1,4$ gives $E_{s,\\text{avg}}=10/5=2$. One symbol carries $\\log_2 5=2.322$ bits.<br>'
     +'<b>Solution — (b).</b> The points are $-2,-1,0,1,2$ on the $\\psi_1$ axis. The thresholds are $-1.5,-0.5,0.5,1.5$. The outer regions run to $\\pm\\infty$.<br>'
     +'<b>Solution — (c).</b> The spacing is $d_{\\min}=1$, so $d_{\\min}^{2}=1=0.5E_{s,\\text{avg}}$. Two end points have one neighbour and three inner points have two:'
     +'$$N_{\\min}=\\frac{1+2+2+2+1}{5}=1.6.$$'
     +'Substitute:'
     +'$$\\begin{aligned}P_e&\\approx1.6\\,Q\\Big(\\sqrt{\\frac{0.5E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=1.6\\,Q\\Big(\\sqrt{\\frac{E_{s,\\text{avg}}}{4N_0}}\\Big).\\end{aligned}$$'
     +'At $36$ the argument is $\\sqrt{9}=3.00$, so $P_e\\approx1.6(0.001350)=2.16\\times10^{-3}$.<br>'
     +'<b>Check.</b> The family formula gives $d_{\\min}^{2}=12E_{s,\\text{avg}}/(M^{2}-1)=24/24=1$. The neighbour count is also $2(M-1)/M=8/5=1.6$.',
  err:'Using $A^{2}/2$ for the energy. That rule holds for a one-second symbol. Here $T=0.5$, so the energy is $A^{2}T/2=A^{2}/4$.',
  teach:'The half-second interval changes the unit-energy carrier to $2\\cos(\\cdot)$. Students who keep $\\sqrt2\\cos(\\cdot)$ get every coordinate wrong by $\\sqrt2$.',
  figSol:()=>cfig([-2,-1,0,1,2].map(c=>[c,0]), {oneD:true, dTex:'1', margin:1.3, tick:0.5}) },

{ id:'D5-07', module:'M5', type:'qam', src:'Final Q3',
  stem:OPEN+'$$\\begin{aligned}s_1(t)&=0,\\\\s_k(t)&=2\\sqrt2\\cos\\!\\Big(2000\\pi t+\\frac{\\pi}{2}+\\frac{2\\pi(k-2)}{3}\\Big),\\quad k\\in\\{2,3,4\\},\\end{aligned}$$ all on $0\\le t\\le1$.'+AWGN,
  parts:[PDRAW(10), PNN(10), '[5 pts] Evaluate the approximation of part (b) at $E_{s,\\text{avg}}/N_0=6$.'],
  sol:'<b>Given.</b> A zero signal and three waveforms of amplitude $2\\sqrt2$ at $1000$ Hz with phases $90^{\\circ},210^{\\circ},330^{\\circ}$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and its value at $6$.<br>'
     +'<b>Method.</b> Use $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$. The waveform $A\\cos(2000\\pi t+\\theta)$ has coordinates $\\frac{A}{\\sqrt2}(\\cos\\theta,\\sin\\theta)$.<br>'
     +'<b>Solution — (a).</b> The radius is $2\\sqrt2/\\sqrt2=2$. So $\\mathbf{s}_1=(0,0)$, $\\mathbf{s}_2=(0,2)$, $\\mathbf{s}_3=(-\\sqrt3,-1)$ and $\\mathbf{s}_4=(\\sqrt3,-1)$. '
     +'The bisector between $\\mathbf{s}_1$ and an outer point is the line at distance $1$ from the origin, perpendicular to that point. The three such lines form a triangle around the origin, which is $D_1$. '
     +'The outer regions are separated by the bisectors of the outer pairs, the rays at $30^{\\circ}$, $150^{\\circ}$ and $270^{\\circ}$ from the triangle corners.<br>'
     +'<b>Solution — (b).</b> Average the energies $0,4,4,4$:'
     +'$$E_{s,\\text{avg}}=\\frac{0+4+4+4}{4}=3.$$'
     +'The distances are $2$ from the centre to each outer point and $2\\sqrt3=3.464$ between outer points. So $d_{\\min}=2$ and $d_{\\min}^{2}=4=\\frac43E_{s,\\text{avg}}$. '
     +'The centre has three neighbours at $d_{\\min}$ and each outer point has one:'
     +'$$N_{\\min}=\\frac{3+1+1+1}{4}=1.5.$$'
     +'Then'
     +'$$\\begin{aligned}P_e&\\approx1.5\\,Q\\Big(\\sqrt{\\frac{4E_{s,\\text{avg}}/3}{2N_0}}\\Big)\\\\&=1.5\\,Q\\Big(\\sqrt{\\frac{2E_{s,\\text{avg}}}{3N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The argument is $\\sqrt{2(6)/3}=\\sqrt4=2.00$. With $Q(2.00)=0.02275$, $P_e\\approx1.5(0.02275)=3.41\\times10^{-2}$.<br>'
     +'<b>Check.</b> Count pairs instead of points. Three pairs sit at $d_{\\min}$, and each pair gives two neighbour relations, so $N_{\\min}=2\\times3/4=1.5$.',
  err:'Taking $E_{s,\\text{avg}}=4$, the energy of the outer points. The zero signal costs nothing, and it is one of four equally likely symbols.',
  teach:'The examination shape with a zero signal, as in the original, but with a three-point outer ring. The centre region is a triangle, not a square.',
  figSol:()=>cfig([[0,0]].concat(onCircle(2,[Math.PI/2, 7*Math.PI/6, 11*Math.PI/6])), {dTex:'2', tick:1}) },

{ id:'D5-08', module:'M5', type:'qam', src:'Final Q3',
  stem:OPEN+'$$s_{mn}(t)=\\sqrt2\\big[(2m-5)\\cos(3000\\pi t)-(2n-3)\\sin(3000\\pi t)\\big],$$ with $m\\in\\{1,2,3,4\\}$, $n\\in\\{1,2\\}$ and $0\\le t\\le1$.'+AWGN,
  parts:[PDRAW(10), PNN(10), '[5 pts] Evaluate the approximation of part (b) at $E_{s,\\text{avg}}/N_0=27$.'],
  sol:'<b>Given.</b> Eight equally likely waveforms. The cosine carries $2m-5\\in\\{-3,-1,1,3\\}$ and the sine carries $2n-3\\in\\{-1,1\\}$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and its value at $27$.<br>'
     +'<b>Method.</b> With $\\psi_1(t)=\\sqrt2\\cos(3000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(3000\\pi t)$ the waveform reads $(2m-5)\\psi_1+(2n-3)\\psi_2$. So $\\mathbf{s}_{mn}=(2m-5,\\,2n-3)$.<br>'
     +'<b>Solution — (a).</b> The points form a $4\\times2$ grid with $\\psi_1\\in\\{-3,-1,1,3\\}$ and $\\psi_2\\in\\{-1,1\\}$. The boundaries are the vertical lines $\\psi_1=-2,0,2$ and the horizontal line $\\psi_2=0$. Every region is a rectangle or a strip that runs to infinity.<br>'
     +'<b>Solution — (b).</b> The average energy adds the averages on each axis:'
     +'$$\\begin{aligned}E_{s,\\text{avg}}&=\\frac{9+1+1+9}{4}+\\frac{1+1}{2}\\\\&=5+1=6.\\end{aligned}$$'
     +'Neighbours along either axis are $2$ apart, so $d_{\\min}=2$ and $d_{\\min}^{2}=4=\\frac23E_{s,\\text{avg}}$. '
     +'The four inner points have three neighbours and the four outer points two, so $N_{\\min}=(4\\cdot3+4\\cdot2)/8=2.5$. Then'
     +'$$\\begin{aligned}P_e&\\approx2.5\\,Q\\Big(\\sqrt{\\frac{2E_{s,\\text{avg}}/3}{2N_0}}\\Big)\\\\&=2.5\\,Q\\Big(\\sqrt{\\frac{E_{s,\\text{avg}}}{3N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The argument is $\\sqrt{27/3}=3.00$. So $P_e\\approx2.5(0.001350)=3.38\\times10^{-3}$.<br>'
     +'<b>Check.</b> List the energies point by point: four points have $1+1=2$ and four have $9+1=10$. The average is $(8+40)/8=6$, as in part (b).',
  err:'Reading the sine coefficient with the wrong sign. With $\\psi_2=-\\sqrt2\\sin$, the term $-(2n-3)\\sqrt2\\sin$ is $+(2n-3)\\psi_2$. The grid is symmetric here, so the error hides, but it moves points in an asymmetric set.',
  teach:'A rectangular eight-point set in the examination shape. Students must count three and two neighbours, not the four of an interior QAM point.',
  figSol:()=>cfig(grid([-3,-1,1,3],[1,-1]), {names:gridNames(4,2), dTex:'2', tick:1}) },

{ id:'D5-09', module:'M5', type:'band', src:'Madhow P4.16 and P4.21',
  stem:'A wireless link sends 16-QAM at $R_b=48$ Mb/s on a carrier at $f_c=2.4$ GHz. The pulses are raised cosines with roll-off $\\alpha=0.25$. On a carrier the occupied band is $B=(1+\\alpha)R_s$, where $R_s$ is the symbol rate. The transmit power is $250$ mW. The noise level $N_0$ and the path to the receiver are the same for every scheme below.',
  parts:['[6 pts] Find the symbol rate $R_s$, the occupied band $B$ and the frequency interval that the signal occupies.',
         '[5 pts] QPSK is sent in the same band with the same roll-off. Find its symbol rate and its bit rate.',
         '[8 pts] The QPSK link must give the same symbol error probability at high signal-to-noise ratio. Use the nearest-neighbour approximation and ignore the difference in $N_{\\min}$. Find the QPSK transmit power and the saving in decibels.',
         '[6 pts] 64-QAM is to carry the same $48$ Mb/s with the same roll-off. Find its band and the transmit power it needs for the same error. Give $R_b/B$ for all three schemes.'],
  sol:'<b>Given.</b> 16-QAM at $R_b=48$ Mb/s on $f_c=2.4$ GHz, roll-off $\\alpha=0.25$, transmit power $250$ mW. On a carrier the band is $B=(1+\\alpha)R_s$. The noise and the path are the same for every scheme.<br>'
     +'<b>Find.</b> $R_s$, $B$ and the band edges. The QPSK rates in the same band and its power for the same error. The band, power and $R_b/B$ of 64-QAM.<br>'
     +'<b>Method.</b> A symbol carries $\\log_2M$ bits, so $R_s=R_b/\\log_2M$. The band depends on $R_s$ alone. At high signal-to-noise ratio the error is set by $d_{\\min}^{2}/2N_0$, so the same error means the same $d_{\\min}$. '
     +'For square QAM, QPSK included, $d_{\\min}^{2}=6E_s/(M-1)$ with $E_s$ the average symbol energy. The transmit power is energy a symbol times symbols a second, $P=E_sR_s$.<br>'
     +'<b>Solution — (a).</b> One 16-QAM symbol carries $\\log_216=4$ bits. So'
     +'$$R_s=\\frac{R_b}{\\log_2M}=\\frac{48}{4}=12\\ \\text{Msymbol/s}.$$'
     +'The occupied band is'
     +'$$B=(1+\\alpha)R_s=1.25(12)=15\\ \\text{MHz}.$$'
     +'It is centred on the carrier, $7.5$ MHz on each side. So the signal occupies'
     +'$$2400-7.5=2392.5\\ \\text{MHz}\\quad\\text{to}\\quad2400+7.5=2407.5\\ \\text{MHz}.$$<br>'
     +'<b>Solution — (b).</b> The same band and roll-off give the same symbol rate:'
     +'$$R_s=\\frac{B}{1+\\alpha}=\\frac{15}{1.25}=12\\ \\text{Msymbol/s}.$$'
     +'A QPSK symbol carries $\\log_24=2$ bits, so $R_b=2(12)=24$ Mb/s. The band fixes the symbol rate. The constellation fixes the bits on each symbol.<br>'
     +'<b>Solution — (c).</b> Write each $d_{\\min}^{2}$ as a multiple of its own $E_s$:'
     +'$$\\begin{aligned}\\text{16-QAM:}\\quad d_{\\min}^{2}&=\\frac{6E_s}{16-1}=0.4\\,E_s,\\\\\\text{QPSK:}\\quad d_{\\min}^{2}&=\\frac{6E_s}{4-1}=2\\,E_s.\\end{aligned}$$'
     +'The same error needs the same $d_{\\min}$. Set the two distances equal and solve for the QPSK energy:'
     +'$$\\begin{aligned}2\\,E_{s,\\text{QPSK}}&=0.4\\,E_{s,16}\\\\E_{s,\\text{QPSK}}&=0.2\\,E_{s,16}.\\end{aligned}$$'
     +'Both links send $12$ Msymbol/s, and $P=E_sR_s$. So the power scales with $E_s$:'
     +'$$\\begin{aligned}P_{\\text{QPSK}}&=0.2\\,P_{16}\\\\&=0.2(250)=50\\ \\text{mW}.\\end{aligned}$$'
     +'The saving is $10\\log_{10}(250/50)=10\\log_{10}5=6.99$ dB. QPSK pays for it with half the bit rate.<br>'
     +'<b>Solution — (d).</b> One 64-QAM symbol carries $\\log_264=6$ bits:'
     +'$$R_s=\\frac{48}{6}=8\\ \\text{Msymbol/s},\\qquad B=1.25(8)=10\\ \\text{MHz}.$$'
     +'The band runs from $2395$ to $2405$ MHz. For the same $d_{\\min}$ as 16-QAM,'
     +'$$\\begin{aligned}\\frac{6E_{s,64}}{64-1}&=0.4\\,E_{s,16}\\\\E_{s,64}&=\\frac{0.4(63)}{6}\\,E_{s,16}=4.2\\,E_{s,16}.\\end{aligned}$$'
     +'64-QAM sends $8$ Msymbol/s against $12$ Msymbol/s, so'
     +'$$\\begin{aligned}P_{64}&=4.2\\cdot\\frac{8}{12}\\cdot P_{16}\\\\&=2.8(250)=700\\ \\text{mW}.\\end{aligned}$$'
     +'That is $10\\log_{10}2.8=4.47$ dB more than 16-QAM. The bandwidth efficiencies are'
     +'$$\\begin{aligned}\\text{QPSK:}\\quad&\\frac{24}{15}=1.6\\ \\text{b/s/Hz},\\\\\\text{16-QAM:}\\quad&\\frac{48}{15}=3.2\\ \\text{b/s/Hz},\\\\\\text{64-QAM:}\\quad&\\frac{48}{10}=4.8\\ \\text{b/s/Hz}.\\end{aligned}$$'
     +'Each two extra bits a symbol add $1.6$ b/s/Hz and cost energy. The figure shows the bands and the three schemes on the bandwidth-efficiency plane.<br>'
     +'<b>Check.</b> Compare the energy a bit instead. With $E_s=E_b\\log_2M$, $d_{\\min}^{2}/E_b$ is $2(2)=4$ for QPSK and $0.4(4)=1.6$ for 16-QAM. '
     +'So QPSK needs $10\\log_{10}(4/1.6)=3.98$ dB less energy a bit. It also sends half the bits a second, another $10\\log_{10}2=3.01$ dB. The sum is $3.98+3.01=6.99$ dB, as in part (c).',
  err:'Keeping the bit rate when the scheme changes. The band fixes the symbol rate $B/(1+\\alpha)$, so QPSK in the same band carries $24$ Mb/s, not $48$ Mb/s.',
  teach:'One band shared by two constellations, with the power bill of each. Work part (c) two ways: by $E_s$ at equal symbol rate, and by $E_b$ plus the bit rate. The neighbour counts, $2$ for QPSK and $3$ for 16-QAM, move the answer by a fraction of a decibel.',
  figSol:()=>pair(figBands(), figRate()) },

{ id:'D5-10', module:'M5', type:'qam', src:'Final Q3',
  stem:OPEN+'$$s_k(t)=A_k\\cos\\!\\Big(2000\\pi t+\\frac{(k-1)\\pi}{4}\\Big),\\quad k\\in\\{1,\\ldots,8\\},\\quad0\\le t\\le1,$$ where $A_k=\\sqrt2$ for odd $k$ and $A_k=4$ for even $k$.'+AWGN,
  parts:[PDRAW(10), PNN(10), '[5 pts] Which symbols have no neighbour at $d_{\\min}$? Evaluate the approximation at $E_{s,\\text{avg}}/N_0=40.5$.'],
  sol:'<b>Given.</b> Eight waveforms at $1000$ Hz with phases $0,45^{\\circ},\\ldots,315^{\\circ}$. The odd ones have amplitude $\\sqrt2$ and the even ones amplitude $4$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and the points without a nearest neighbour.<br>'
     +'<b>Method.</b> Use $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$. The radius of a point is $A_k/\\sqrt2$ and its angle is its phase.<br>'
     +'<b>Solution — (a).</b> The odd points lie on a circle of radius $1$ at $0^{\\circ},90^{\\circ},180^{\\circ},270^{\\circ}$: $\\mathbf{s}_1=(1,0)$, $\\mathbf{s}_3=(0,1)$, $\\mathbf{s}_5=(-1,0)$, $\\mathbf{s}_7=(0,-1)$. '
     +'The even points lie on a circle of radius $4/\\sqrt2=2\\sqrt2$ at $45^{\\circ},135^{\\circ},\\ldots$: $\\mathbf{s}_2=(2,2)$, $\\mathbf{s}_4=(-2,2)$, $\\mathbf{s}_6=(-2,-2)$, $\\mathbf{s}_8=(2,-2)$. '
     +'Each inner region is bounded by the diagonals $\\psi_2=\\pm\\psi_1$ and by the bisectors with its two outer neighbours. The bisector of $\\mathbf{s}_1$ and $\\mathbf{s}_2$ is $2\\psi_1+4\\psi_2=7$.<br>'
     +'<b>Solution — (b).</b> Average the energies:'
     +'$$E_{s,\\text{avg}}=\\frac{4(1)+4(8)}{8}=4.5.$$'
     +'The three kinds of distance are'
     +'$$\\begin{aligned}d_{13}&=\\sqrt{1^{2}+1^{2}}=\\sqrt2=1.414,\\\\d_{12}&=\\sqrt{1^{2}+2^{2}}=\\sqrt5=2.236,\\\\d_{24}&=4.\\end{aligned}$$'
     +'So $d_{\\min}=\\sqrt2$ and $d_{\\min}^{2}=2=\\frac49E_{s,\\text{avg}}$. Each inner point has two neighbours at $d_{\\min}$ and each outer point none: $N_{\\min}=(4\\cdot2+4\\cdot0)/8=1$. Then'
     +'$$\\begin{aligned}P_e&\\approx Q\\Big(\\sqrt{\\frac{4E_{s,\\text{avg}}/9}{2N_0}}\\Big)\\\\&=Q\\Big(\\sqrt{\\frac{2E_{s,\\text{avg}}}{9N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The outer points $\\mathbf{s}_2,\\mathbf{s}_4,\\mathbf{s}_6,\\mathbf{s}_8$ have no neighbour at $d_{\\min}$. At $40.5$ the argument is $\\sqrt{2(40.5)/9}=\\sqrt9=3.00$, so $P_e\\approx Q(3.00)=1.35\\times10^{-3}$.<br>'
     +'<b>Check.</b> Evaluate the bisector at the midpoint of $\\mathbf{s}_1$ and $\\mathbf{s}_2$, which is $(1.5,1)$: $2(1.5)+4(1)=7$. The line passes through it, as a bisector must.',
  err:'Counting the outer points as having neighbours at $\\sqrt5$. Only points at exactly $d_{\\min}$ enter $N_{\\min}$. The outer points contribute zero, and the average is $1$.',
  teach:'Two rings rotated by $45^{\\circ}$. Half the points have no nearest neighbour, which is the lesson of the count.',
  figSol:()=>cfig(range(1,8).map(k=>{ const r = k%2 ? 1 : 2*R2, t=(k-1)*Math.PI/4; return [r*Math.cos(t), r*Math.sin(t)]; }), {dTex:'\\sqrt{2}', tick:1, margin:1.4}) },

{ id:'D5-11', module:'M5', type:'qam', src:'Final Q3',
  stem:'Consider an $M$-ary modulation scheme where the four equally probable symbols have the waveforms drawn below, each on $0\\le t\\le1$. Each waveform is zero or a sinusoid at $2$ Hz. The peak value is $\\sqrt2$ for $s_2$ and $s_3$ and $2$ for $s_4$.'+AWGN,
  figure:()=>{
    const W = [t=>0, t=>R2*Math.cos(4*Math.PI*t), t=>-R2*Math.sin(4*Math.PI*t), t=>2*Math.cos(4*Math.PI*t+Math.PI/4)];
    return `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 22px;max-width:900px;margin:0 auto;width:100%">`
      + W.map((f,i)=>{
        const a = P.Axes({w:420,h:190,xr:[0,1],yr:[-2.5,2.5],xlabel:'t',ylabel:'s_{'+(i+1)+'}(t)',
          pad:{l:46,r:26,t:20,b:36}, xticksOverride:[0.25,0.5,0.75,1], yticksOverride:[-2,-1,1,2]});
        a.curve(f,{color:C.in, width:2.2});
        return a.svg();
      }).join('') + `</div>`;
  },
  parts:['[7 pts] Write each waveform in the form $A\\cos(4\\pi t+\\theta)$ and find its signal-space coordinates.',
         PDRAW(8),
         '[6 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$.',
         '[4 pts] The four points are moved together so that their centre is at the origin. Find the saving in $E_{s,\\text{avg}}$ in decibels.'],
  sol:'<b>Given.</b> $s_1=0$, and three $2$ Hz sinusoids on $0\\le t\\le1$ with peaks $\\sqrt2$, $\\sqrt2$ and $2$, read from the drawing.<br>'
     +'<b>Find.</b> Amplitudes, phases and coordinates, the constellation, $P_e$, and the saving of a centred set.<br>'
     +'<b>Method.</b> For $A\\cos(4\\pi t+\\theta)$ the value at $t=0$ is $A\\cos\\theta$ and the slope is $-4\\pi A\\sin\\theta$. A curve that falls first has $\\sin\\theta>0$. Then use $\\psi_1(t)=\\sqrt2\\cos(4\\pi t)$, $\\psi_2(t)=-\\sqrt2\\sin(4\\pi t)$.<br>'
     +'<b>Solution — (a).</b> $s_2$ starts at its peak $\\sqrt2$, so $s_2(t)=\\sqrt2\\cos(4\\pi t)$. $s_3$ starts at $0$ and falls, so $\\theta=\\pi/2$ and $s_3(t)=\\sqrt2\\cos(4\\pi t+\\pi/2)=-\\sqrt2\\sin(4\\pi t)$. '
     +'$s_4$ starts at $2\\cos\\theta=\\sqrt2$ and falls, so $\\theta=\\pi/4$. Expand $s_4$:'
     +'$$\\begin{aligned}s_4(t)&=2\\cos\\frac{\\pi}{4}\\cos(4\\pi t)-2\\sin\\frac{\\pi}{4}\\sin(4\\pi t)\\\\&=\\sqrt2\\cos(4\\pi t)-\\sqrt2\\sin(4\\pi t)\\\\&=\\psi_1(t)+\\psi_2(t).\\end{aligned}$$'
     +'So $\\mathbf{s}_1=(0,0)$, $\\mathbf{s}_2=(1,0)$, $\\mathbf{s}_3=(0,1)$ and $\\mathbf{s}_4=(1,1)$.<br>'
     +'<b>Solution — (b).</b> The points are the corners of a unit square with one corner at the origin. The boundaries are the lines $\\psi_1=0.5$ and $\\psi_2=0.5$. So the four regions are the quadrants around the point $(0.5,0.5)$.<br>'
     +'<b>Solution — (c).</b> Average the squared distances from the origin:'
     +'$$E_{s,\\text{avg}}=\\frac{0+1+1+2}{4}=1.$$'
     +'The sides are $d_{\\min}=1$, so $d_{\\min}^{2}=1=E_{s,\\text{avg}}$. Each corner has two neighbours, so $N_{\\min}=2$ and'
     +'$$P_e\\approx2\\,Q\\Big(\\sqrt{\\frac{E_{s,\\text{avg}}}{2N_0}}\\Big).$$<br>'
     +'<b>Solution — (d).</b> Centred, the corners are $(\\pm0.5,\\pm0.5)$ with energy $0.5$ each. The saving is $10\\log_{10}(1/0.5)=3.01$ dB.<br>'
     +'<b>Check.</b> Integrate $s_4$ directly: $\\int_0^1 4\\cos^{2}(4\\pi t+\\pi/4)\\,dt=2\\big[t+\\frac{\\sin(8\\pi t+\\pi/2)}{8\\pi}\\big]_0^1=2$. This equals $1^{2}+1^{2}$.',
  err:'Reading $s_3$ as $+\\sqrt2\\sin(4\\pi t)$. The drawing falls first, so it is $-\\sqrt2\\sin$, which is $+\\psi_2$. The opposite sign puts $\\mathbf{s}_3$ at $(0,-1)$.',
  teach:'The examination shape with the waveforms given as a drawing. Reading the phase from the starting value and the first slope is the new skill.',
  figSol:()=>cfig([[0,0],[1,0],[0,1],[1,1]], {dTex:'1', tick:0.5, margin:1.2}) },

{ id:'D5-12', module:'M5', type:'psk', src:'Final Q3',
  stem:OPEN+'$$s_k(t)=2\\sqrt3\\cos\\!\\Big(2000\\pi t+\\frac{\\pi}{6}+\\frac{(k-1)\\pi}{2}\\Big),\\quad k\\in\\{1,2,3,4\\},\\quad0\\le t\\le1.$$'+AWGN,
  parts:[PDRAW(10), PNN(8),
         '[7 pts] With Gray labelling, one symbol error costs about one bit error. Find $E_b$, then compare the bit error probability with binary PSK at $E_b/N_0=4.5$.'],
  sol:'<b>Given.</b> Four waveforms of amplitude $2\\sqrt3$ at $1000$ Hz with phases $30^{\\circ},120^{\\circ},210^{\\circ},300^{\\circ}$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and the per-bit comparison with binary PSK.<br>'
     +'<b>Method.</b> Use $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$. The radius is $2\\sqrt3/\\sqrt2=\\sqrt6$.<br>'
     +'<b>Solution — (a).</b> The points are $\\sqrt6(\\cos\\theta_k,\\sin\\theta_k)$: $\\mathbf{s}_1=(2.121,1.225)$, $\\mathbf{s}_2=(-1.225,2.121)$, $\\mathbf{s}_3=(-2.121,-1.225)$, $\\mathbf{s}_4=(1.225,-2.121)$. '
     +'Each region is a $90^{\\circ}$ wedge centred on its point. The boundaries are the rays at $75^{\\circ},165^{\\circ},255^{\\circ},345^{\\circ}$, so the regions are the quadrants turned by $30^{\\circ}$.<br>'
     +'<b>Solution — (b).</b> All energies are $E_{s,\\text{avg}}=6$. Neighbours are $90^{\\circ}$ apart:'
     +'$$\\begin{aligned}d_{\\min}^{2}&=6+6-2(6)\\cos90^{\\circ}\\\\&=12=2E_{s,\\text{avg}}.\\end{aligned}$$'
     +'Each point has two neighbours, so'
     +'$$\\begin{aligned}P_e&\\approx2\\,Q\\Big(\\sqrt{\\frac{2E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=2\\,Q\\Big(\\sqrt{\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> Each symbol carries $2$ bits, so $E_b=6/2=3$ and $E_{s,\\text{avg}}=2E_b$. Then $P_e\\approx2Q\\big(\\sqrt{2E_b/N_0}\\big)$. '
     +'At $E_b/N_0=4.5$ the argument is $\\sqrt9=3.00$, so $P_e\\approx2.70\\times10^{-3}$ and $P_b\\approx P_e/2=1.35\\times10^{-3}$. '
     +'Binary PSK gives $P_b=Q\\big(\\sqrt{2E_b/N_0}\\big)=Q(3.00)=1.35\\times10^{-3}$. The two agree.<br>'
     +'<b>Check.</b> Subtract coordinates: $\\mathbf{s}_1-\\mathbf{s}_2=(3.346,-0.896)$, and $3.346^{2}+0.896^{2}=11.20+0.80=12.0$. This matches $d_{\\min}^{2}=12$.',
  err:'Comparing the symbol error probability of the four-point set with the bit error probability of binary PSK. The symbol error is twice as large, but each symbol carries two bits.',
  teach:'A four-point PSK set with a $30^{\\circ}$ offset, followed by the classic per-bit comparison. The offset changes nothing but the drawing.',
  figSol:()=>cfig(onCircle(Math.sqrt(6), range(1,4).map(k=>Math.PI/6+(k-1)*Math.PI/2)), {dTex:'2\\sqrt{3}', tick:1}) },

{ id:'D5-13', module:'M5', type:'pam', src:'Final Q3',
  stem:OPEN+'$$s_k(t)=\\sqrt2\\,(2k-9)\\cos(2000\\pi t),\\quad k\\in\\{1,\\ldots,8\\},\\quad0\\le t\\le1.$$'+AWGN,
  parts:['[8 pts] Find $E_{s,\\text{avg}}$, the number of bits per symbol and the average energy per bit $E_b$.',
         PDRAW(8),
         '[9 pts] Determine the nearest-neighbour approximation as a function of $E_{s,\\text{avg}}/N_0$ and of $E_b/N_0$. Find the $E_b/N_0$ in decibels that makes the $Q$ argument $3.00$, and the resulting $P_e$.'],
  sol:'<b>Given.</b> Eight equally likely amplitudes $\\sqrt2(2k-9)$ on one $1000$ Hz carrier, $0\\le t\\le1$.<br>'
     +'<b>Find.</b> $E_{s,\\text{avg}}$, bits, $E_b$, the line constellation, $P_e$ in both energies, and the $E_b/N_0$ for a $Q$ argument of $3.00$.<br>'
     +'<b>Method.</b> With $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ each waveform is $(2k-9)\\psi_1(t)$. The points are $\\pm1,\\pm3,\\pm5,\\pm7$.<br>'
     +'<b>Solution — (a).</b> Average the squared coordinates. By symmetry, average the four positive ones:'
     +'$$\\begin{aligned}E_{s,\\text{avg}}&=\\frac{1+9+25+49}{4}\\\\&=\\frac{84}{4}=21.\\end{aligned}$$'
     +'One symbol carries $\\log_2 8=3$ bits, so $E_b=21/3=7$.<br>'
     +'<b>Solution — (b).</b> The eight points sit on the $\\psi_1$ axis at odd integers. The thresholds are $0,\\pm2,\\pm4,\\pm6$. The two end regions run to $\\pm\\infty$.<br>'
     +'<b>Solution — (c).</b> The spacing is $d_{\\min}=2$, so $d_{\\min}^{2}=4=\\frac{4}{21}E_{s,\\text{avg}}$. Two end points have one neighbour and six inner points two, so $N_{\\min}=14/8=1.75$. Substitute, then use $E_{s,\\text{avg}}=3E_b$:'
     +'$$\\begin{aligned}P_e&\\approx1.75\\,Q\\Big(\\sqrt{\\frac{4E_{s,\\text{avg}}/21}{2N_0}}\\Big)\\\\&=1.75\\,Q\\Big(\\sqrt{\\frac{2E_{s,\\text{avg}}}{21N_0}}\\Big)\\\\&=1.75\\,Q\\Big(\\sqrt{\\frac{2E_b}{7N_0}}\\Big).\\end{aligned}$$'
     +'For an argument of $3.00$, solve $2E_b/(7N_0)=9$. This gives $E_b/N_0=31.5$, or $10\\log_{10}31.5=14.98$ dB. Then $P_e\\approx1.75(0.001350)=2.36\\times10^{-3}$.<br>'
     +'<b>Check.</b> The family formula gives $E_{s,\\text{avg}}=A^{2}(M^{2}-1)/3=1\\cdot63/3=21$ with half-spacing $A=1$. The neighbour count $2(M-1)/M=14/8$ also agrees.',
  err:'Converting $31.5$ to decibels with $20\\log_{10}$. An energy ratio takes $10\\log_{10}$. The factor $20$ belongs to amplitude ratios.',
  teach:'Eight amplitude levels in the examination shape. The required $15$ dB per bit shows why amplitude-only sets stop at small $M$.',
  figSol:()=>cfig([-7,-5,-3,-1,1,3,5,7].map(c=>[c,0]), {oneD:true, dTex:'2', margin:2.4, tick:2}) },

{ id:'D5-14', module:'M5', type:'spacing', src:'Madhow P4.18',
  stem:'Two tones are sent on $0\\le t\\le T$ with $T=2$ ms: $$s_0(t)=A\\cos(2\\pi f_0t+\\varphi_0),\\qquad s_1(t)=A\\cos(2\\pi f_1t+\\varphi_1),$$ with $f_0=20$ kHz and $f_1=f_0+\\Delta f$, $\\Delta f>0$. Both tones have energy $E=A^{2}T/2$. Neglect every term at the sum frequency $f_0+f_1$. The correlation coefficient is $\\rho=\\langle s_0,s_1\\rangle/E$.',
  parts:['[8 pts] Find $\\langle s_0,s_1\\rangle$ as a function of $\\Delta f$ and $\\Delta\\varphi=\\varphi_1-\\varphi_0$. Evaluate $\\rho$ for $\\Delta f=125$ Hz and equal phases.',
         '[5 pts] With equal phases, find the smallest $\\Delta f$ that makes the two tones orthogonal.',
         '[7 pts] Find the smallest $\\Delta f$ that makes the tones orthogonal for every $\\Delta\\varphi$. Show that the spacing of part (b) fails for $\\Delta\\varphi=90^{\\circ}$.',
         '[5 pts] An 8-FSK set uses tones of this kind with the same $T$. Find its bit rate, and its band with the spacing of part (b) and with that of part (c).'],
  sol:'<b>Given.</b> Two tones of amplitude $A$ on $0\\le t\\le2$ ms, at $f_0=20$ kHz and $f_0+\\Delta f$, with phases $\\varphi_0$ and $\\varphi_1$. Terms at the sum frequency are neglected.<br>'
     +'<b>Find.</b> $\\langle s_0,s_1\\rangle$ and $\\rho$ at $125$ Hz, the least orthogonal spacing with equal phases and with any phases, and the band of 8-FSK with each.<br>'
     +'<b>Method.</b> Turn the product of two cosines into a sum with $\\cos a\\cos b=\\tfrac12[\\cos(a-b)+\\cos(a+b)]$. Drop the sum-frequency term and integrate the difference term. Two tones are orthogonal when $\\rho=0$.<br>'
     +'<b>Solution — (a).</b> Apply the identity with $a=2\\pi f_1t+\\varphi_1$ and $b=2\\pi f_0t+\\varphi_0$. Then $a-b=2\\pi\\Delta f\\,t+\\Delta\\varphi$, and'
     +'$$\\begin{aligned}\\langle s_0,s_1\\rangle&=\\frac{A^{2}}{2}\\int_0^T\\cos(2\\pi\\Delta f\\,t+\\Delta\\varphi)\\,dt\\\\&=\\frac{A^{2}}{2}\\Big[\\frac{\\sin(2\\pi\\Delta f\\,t+\\Delta\\varphi)}{2\\pi\\Delta f}\\Big]_0^T\\\\&=\\frac{A^{2}\\big[\\sin(2\\pi\\Delta fT+\\Delta\\varphi)-\\sin\\Delta\\varphi\\big]}{4\\pi\\Delta f}.\\end{aligned}$$'
     +'Divide by $E=A^{2}T/2$:'
     +'$$\\rho=\\frac{\\sin(2\\pi\\Delta fT+\\Delta\\varphi)-\\sin\\Delta\\varphi}{2\\pi\\Delta fT}.$$'
     +'For $\\Delta f=125$ Hz, $2\\pi\\Delta fT=2\\pi(125)(0.002)=\\pi/2$. With $\\Delta\\varphi=0$,'
     +'$$\\rho=\\frac{\\sin(\\pi/2)-0}{\\pi/2}=\\frac{2}{\\pi}=0.637.$$<br>'
     +'<b>Solution — (b).</b> With $\\Delta\\varphi=0$ the result of part (a) becomes'
     +'$$\\rho=\\frac{\\sin(2\\pi\\Delta fT)}{2\\pi\\Delta fT}.$$'
     +'It is zero when $2\\pi\\Delta fT=n\\pi$ for a whole number $n\\ge1$. The smallest spacing takes $n=1$:'
     +'$$\\Delta f=\\frac{1}{2T}=\\frac{1}{2(0.002)}=250\\ \\text{Hz}.$$<br>'
     +'<b>Solution — (c).</b> For every $\\Delta\\varphi$ we need $\\sin(2\\pi\\Delta fT+\\Delta\\varphi)=\\sin\\Delta\\varphi$. Take $\\Delta\\varphi=0$: this asks $\\sin(2\\pi\\Delta fT)=0$. Take $\\Delta\\varphi=90^{\\circ}$: this asks $\\cos(2\\pi\\Delta fT)=1$. '
     +'Both hold only when $2\\pi\\Delta fT$ is a whole multiple of $2\\pi$. Then the sine has run whole periods, and every phase works. The smallest spacing is'
     +'$$\\Delta f=\\frac{1}{T}=\\frac{1}{0.002}=500\\ \\text{Hz}.$$'
     +'At $250$ Hz with $\\Delta\\varphi=90^{\\circ}$, $2\\pi\\Delta fT=\\pi$ and'
     +'$$\\rho=\\frac{\\sin(\\pi+\\pi/2)-\\sin(\\pi/2)}{\\pi}=\\frac{-1-1}{\\pi}=-0.637.$$'
     +'The tones are far from orthogonal. A noncoherent receiver does not know the phases, so it needs the spacing $1/T$.<br>'
     +'<b>Solution — (d).</b> Eight tones carry $\\log_28=3$ bits a symbol:'
     +'$$R_b=\\frac{3}{T}=\\frac{3}{0.002}=1500\\ \\text{b/s}.$$'
     +'$M$ tones spaced $\\Delta f$ apart take a band of about $M\\Delta f$:'
     +'$$\\begin{aligned}\\text{coherent:}\\quad W&=8(250)=2000\\ \\text{Hz},\\\\\\text{noncoherent:}\\quad W&=8(500)=4000\\ \\text{Hz}.\\end{aligned}$$'
     +'The coherent value is the band of orthogonal signals, $MR_b/(2\\log_2M)=8(1500)/6=2000$ Hz. Not knowing the phase doubles the band.<br>'
     +'<b>Check.</b> Put $\\Delta f=500$ Hz and $\\Delta\\varphi=90^{\\circ}$ into $\\rho$. Then $2\\pi\\Delta fT=2\\pi$ and $\\rho=[\\sin(5\\pi/2)-\\sin(\\pi/2)]/(2\\pi)=(1-1)/(2\\pi)=0$. '
     +'For the largest $|\\rho|$ over all phases, write the difference of sines as a product, with $x=2\\pi\\Delta fT$:'
     +'$$\\sin(x+\\Delta\\varphi)-\\sin\\Delta\\varphi=2\\cos\\Big(\\Delta\\varphi+\\frac x2\\Big)\\sin\\frac x2.$$'
     +'The cosine reaches $\\pm1$, so the largest $|\\rho|$ is $2|\\sin(x/2)|/x$. At $250$ Hz, $x=\\pi$ and this is $2/\\pi=0.637$, the value found in part (c). The figure shows it against $\\Delta f$.',
  err:'Taking $1/T$ as the coherent spacing. With known, equal phases the tones are already orthogonal at $1/(2T)$. The spacing $1/T$ is the price of an unknown phase.',
  teach:'Tone spacing from one integral. The equal-phase zeros sit at every multiple of $1/(2T)$, but only every second one survives an arbitrary phase. That is why noncoherent FSK needs twice the band.',
  figSol:()=>figCorr() },

{ id:'D5-15', module:'M5', type:'link', src:'Madhow P6.38',
  stem:'A line-of-sight radio link is designed for a range $d_0=5$ km at a carrier frequency $f_c=1.5$ GHz. It sends QPSK with Gray labels at $R_b=8$ Mb/s. The pulses are raised cosines with roll-off $\\alpha=0.25$, so the occupied band is $B=(1+\\alpha)R_s$, where $R_s$ is the symbol rate. The target $P_b=10^{-5}$ needs $E_b/N_0=9.6$ dB. The transmit power is $P_t=20$ dBm, each antenna has a gain of $10$ dBi, and the receiver noise figure is $\\text{NF}=4$ dB. Take $kT_0=-174$ dBm/Hz, $c=3\\times10^{8}$ m/s and the free-space loss $L_p=20\\log_{10}(4\\pi d/\\lambda)$ dB. Give powers in dBm and decibel values to two decimals.',
  parts:['[7 pts] Find the occupied band, the noise power in that band and the receiver sensitivity $P_{\\min}$.',
         '[5 pts] Find the path loss at $d_0$, the received power and the link margin.',
         '[7 pts] The carrier moves to $6$ GHz and the antenna gains stay at $10$ dBi. Find the range that keeps the margin of part (b). Then find that range if instead the antennas keep their size, so that each gain grows in proportion to $f_c^{2}$.',
         '[6 pts] Back at $1.5$ GHz, the bit rate rises to $32$ Mb/s with the same scheme and roll-off. Find the new band, the new sensitivity and the range that keeps the same margin.'],
  sol:'<b>Given.</b> QPSK at $R_b=8$ Mb/s, roll-off $0.25$, $f_c=1.5$ GHz, $d_0=5$ km, $P_t=20$ dBm, $G_t=G_r=10$ dBi, $\\text{NF}=4$ dB, $(E_b/N_0)_{\\text{req}}=9.6$ dB, $kT_0=-174$ dBm/Hz.<br>'
     +'<b>Find.</b> The band, the noise power and $P_{\\min}$. The path loss, $P_r$ and the margin at $d_0$. The range at $6$ GHz with fixed gains and with fixed antenna size. The band, $P_{\\min}$ and the range at $32$ Mb/s.<br>'
     +'<b>Method.</b> Work in decibels: powers in dBm, gains in dBi, losses and ratios in dB. The noise in a band is $N=-174+\\text{NF}+10\\log_{10}B$. The sensitivity comes from $E_b=P_r/R_b$, so it takes the bit rate: $P_{\\min}=-174+\\text{NF}+10\\log_{10}R_b+(E_b/N_0)_{\\text{dB}}$. '
     +'The received power is $P_r=P_t+G_t+G_r-L_p$ and the margin is $M=P_r-P_{\\min}$. A range that keeps $M$ is found from the largest allowed loss, $L_p=P_t+G_t+G_r-P_{\\min}-M$.<br>'
     +'<b>Solution — (a).</b> A QPSK symbol carries $2$ bits, so'
     +'$$R_s=\\frac{R_b}{2}=\\frac{8}{2}=4\\ \\text{Msym/s},\\qquad B=(1+\\alpha)R_s=1.25(4)=5\\ \\text{MHz}.$$'
     +'The noise in this band is'
     +'$$\\begin{aligned}N&=-174+\\text{NF}+10\\log_{10}B\\\\&=-174+4+10\\log_{10}(5\\times10^{6})\\\\&=-174+4+66.99=-103.01\\ \\text{dBm}.\\end{aligned}$$'
     +'The sensitivity takes the bit rate, not the band:'
     +'$$\\begin{aligned}P_{\\min}&=-174+\\text{NF}+10\\log_{10}R_b+9.6\\\\&=-174+4+10\\log_{10}(8\\times10^{6})+9.6\\\\&=-174+4+69.03+9.6=-91.37\\ \\text{dBm}.\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> The wavelength is $\\lambda=c/f_c=3\\times10^{8}/1.5\\times10^{9}=0.2$ m. So'
     +'$$\\begin{aligned}L_p&=20\\log_{10}\\frac{4\\pi(5000)}{0.2}\\\\&=20\\log_{10}(3.142\\times10^{5})=109.94\\ \\text{dB}.\\end{aligned}$$'
     +'Add the budget and subtract the sensitivity:'
     +'$$\\begin{aligned}P_r&=20+10+10-109.94=-69.94\\ \\text{dBm},\\\\M&=P_r-P_{\\min}=-69.94-(-91.37)=21.43\\ \\text{dB}.\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> At $6$ GHz the wavelength is $\\lambda\'=3\\times10^{8}/6\\times10^{9}=0.05$ m. With the same gains and the same $P_{\\min}$, the same margin needs the same loss, $109.94$ dB:'
     +'$$\\begin{aligned}20\\log_{10}\\frac{4\\pi d}{0.05}&=20\\log_{10}\\frac{4\\pi(5000)}{0.2}\\\\d&=5000\\cdot\\frac{0.05}{0.2}=1250\\ \\text{m}=1.25\\ \\text{km}.\\end{aligned}$$'
     +'At a fixed $d$ the loss is $20\\log_{10}(0.2/0.05)=20\\log_{10}4=12.04$ dB higher, so the range falls by $4$. '
     +'With antennas of the same size, each gain grows by $10\\log_{10}(4^{2})=12.04$ dB, to $22.04$ dBi. The allowed loss is'
     +'$$\\begin{aligned}L_p&=P_t+G_t+G_r-P_{\\min}-M\\\\&=20+22.04+22.04+91.37-21.43=134.02\\ \\text{dB}.\\end{aligned}$$'
     +'Invert the loss with $\\lambda\'=0.05$ m:'
     +'$$\\begin{aligned}d&=\\frac{\\lambda\'}{4\\pi}\\,10^{L_p/20}=\\frac{0.05}{4\\pi}\\,10^{6.701}\\\\&=(3.979\\times10^{-3})(5.023\\times10^{6})=2.00\\times10^{4}\\ \\text{m}=20.0\\ \\text{km}.\\end{aligned}$$'
     +'The two gains add $24.08$ dB and the path takes back $12.04$ dB, so the range grows by $10^{12.04/20}=4$.<br>'
     +'<b>Solution — (d).</b> The symbol rate and the band grow with the bit rate:'
     +'$$R_s=\\frac{32}{2}=16\\ \\text{Msym/s},\\qquad B=1.25(16)=20\\ \\text{MHz}.$$'
     +'The sensitivity rises by $10\\log_{10}4=6.02$ dB:'
     +'$$\\begin{aligned}P_{\\min}&=-174+4+10\\log_{10}(3.2\\times10^{7})+9.6\\\\&=-174+4+75.05+9.6=-85.35\\ \\text{dBm}.\\end{aligned}$$'
     +'The allowed loss and the range, with $\\lambda=0.2$ m, are'
     +'$$\\begin{aligned}L_p&=20+10+10+85.35-21.43=103.92\\ \\text{dB},\\\\d&=\\frac{0.2}{4\\pi}\\,10^{103.92/20}=(1.592\\times10^{-2})(1.570\\times10^{5})=2.50\\ \\text{km}.\\end{aligned}$$'
     +'Four times the bit rate costs $6.02$ dB, which halves the range. The figure shows the budget of the designed link and the four ranges.<br>'
     +'<b>Check.</b> The signal-to-noise ratio in the band at the sensitivity is $-91.37-(-103.01)=11.64$ dB at $8$ Mb/s. At $32$ Mb/s the noise in $20$ MHz is $-174+4+73.01=-96.99$ dBm, and $-85.35-(-96.99)=11.64$ dB again. '
     +'It is unchanged because $R_b/B=1.6$ in both cases. The ranges scale as $5/4=1.25$, $5\\times4=20$ and $5/2=2.5$ km, which match parts (c) and (d).',
  err:'Scaling the range with $10\\log_{10}$. The free-space loss grows as $d^{2}$, so $12.04$ dB is a factor $4$ in range, not $16$.',
  teach:'Link what-ifs on one designed link. Part (c) shows the two readings of the free-space formula: with fixed gains a higher carrier loses range, with fixed antenna size it gains range.',
  figSol:()=>pair(figWater38(), figRange38()) },

{ id:'D5-16', module:'M5', type:'gray', src:'Madhow P6.19',
  stem:'Three sets of eight equally likely points on the signal plane $(\\psi_1,\\psi_2)$ are compared. Each point carries $3$ bits, and the channel is AWGN with $\\mathcal{N}(0,N_0/2)$. '
      +'Set A is a square ring: $(\\pm c,\\pm c)$, $(\\pm c,0)$ and $(0,\\pm c)$. '
      +'Set B is three rows of a triangular grid: $(\\pm b,\\pm h)$, $(0,\\pm h)$ and $(\\pm\\tfrac b2,0)$, with $h=\\tfrac{\\sqrt3}{2}b$. '
      +'Set C is eight levels on one axis: $\\psi_1=(2k-9)\\,g/2$ for $k=1,\\ldots,8$. '
      +'Set B comes with labels, read from left to right. The top row carries $\\mathtt{000},\\mathtt{001},\\mathtt{011}$, the middle row $\\mathtt{100},\\mathtt{101}$ and the bottom row $\\mathtt{010},\\mathtt{110},\\mathtt{111}$.',
  parts:['[7 pts] Scale each set so that $E_b=3$. Find $c$, $b$ and $g$, and the $d_{\\min}$ of each set.',
         '[6 pts] A Gray labelling gives every pair at $d_{\\min}$ labels that differ in one bit. For each set, give a Gray labelling or show that none exists.',
         '[8 pts] Write the nearest-neighbour approximation of the bit error probability $P_b$ of each set as a function of $E_b/N_0$. Use your labels from part (b), or the given labels for a set without a Gray labelling. Evaluate each at $E_b/N_0=9$.',
         '[4 pts] Rank the three sets by $P_b$ at high signal-to-noise ratio. Give the gap between neighbours in the ranking in decibels.'],
  sol:'<b>Given.</b> Three sets of eight points, each point $3$ bits. Set A is a square ring with spacing $c$. Set B is three rows of a triangular grid with spacing $b$. Set C is eight levels $g$ apart. Labels for set B, and AWGN with $\\mathcal{N}(0,N_0/2)$.<br>'
     +'<b>Find.</b> The scale of each set at $E_b=3$ and its $d_{\\min}$. Which sets take a Gray labelling. The bit error of each at $E_b/N_0=9$, and the ranking.<br>'
     +'<b>Method.</b> With $3$ bits a symbol, $E_s=3E_b=9$ for every set. A symbol error to a neighbour at $d_{\\min}$ costs as many bits as the two labels differ in. So the nearest-neighbour approximation of the bit error is'
     +'$$P_b\\approx\\frac{w}{3}\\,Q\\Big(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\Big).$$'
     +'Here $w$ is the number of differing bits, summed over the $d_{\\min}$ pairs of one point and averaged over the eight points. With Gray labels every pair costs one bit, so $w=N_{\\min}$ and $P_b\\approx P_e/3$.<br>'
     +'<b>Solution — (a).</b> Set $E_s=9$ in each set. Set A has four corners of energy $2c^{2}$ and four edge points of energy $c^{2}$:'
     +'$$\\begin{aligned}E_s&=\\frac{4(2c^{2})+4c^{2}}{8}=1.5\\,c^{2}=9\\\\c^{2}&=6,\\qquad c=\\sqrt6=2.449.\\end{aligned}$$'
     +'A corner and the edge point beside it are $c$ apart. Two edge points are $c\\sqrt2$ apart. So $d_{\\min}=c=2.449$. '
     +'Set B has four corners of energy $b^{2}+h^{2}=1.75\\,b^{2}$, two row centres of energy $h^{2}=0.75\\,b^{2}$ and two middle points of energy $0.25\\,b^{2}$:'
     +'$$\\begin{aligned}E_s&=\\frac{4(1.75\\,b^{2})+2(0.75\\,b^{2})+2(0.25\\,b^{2})}{8}\\\\&=\\frac{9b^{2}}{8}=9\\\\b^{2}&=8,\\qquad b=2\\sqrt2=2.828.\\end{aligned}$$'
     +'Points side by side in a row are $b$ apart. A middle point and the nearest points of the row above are also $b$ apart:'
     +'$$\\sqrt{\\Big(\\frac b2\\Big)^{2}+h^{2}}=\\sqrt{0.25\\,b^{2}+0.75\\,b^{2}}=b.$$'
     +'So $d_{\\min}=b=2.828$. Set C has the levels $\\pm\\tfrac g2,\\pm\\tfrac{3g}2,\\pm\\tfrac{5g}2,\\pm\\tfrac{7g}2$:'
     +'$$\\begin{aligned}E_s&=\\frac{2\\,(1+9+25+49)\\,g^{2}}{4\\cdot8}=5.25\\,g^{2}=9\\\\g^{2}&=\\frac{12}{7}=1.714,\\qquad g=1.309.\\end{aligned}$$'
     +'Neighbouring levels are $g$ apart, so $d_{\\min}=g=1.309$.<br>'
     +'<b>Solution — (b).</b> A $3$-bit label has exactly $3$ labels that differ from it in one bit. So a point with more than $3$ neighbours at $d_{\\min}$ cannot have all of them one bit away. '
     +'In set A every point has two neighbours at $d_{\\min}$, and the eight points form one closed ring. The $3$-bit Gray code $\\mathtt{000},\\mathtt{001},\\mathtt{011},\\mathtt{010},\\mathtt{110},\\mathtt{111},\\mathtt{101},\\mathtt{100}$ also closes, since its last and first words differ in one bit. '
     +'Put it round the ring, starting at $(c,0)$ and turning anticlockwise. So set A has a Gray labelling. '
     +'In set B each middle point has $5$ neighbours at $d_{\\min}$: the other middle point and two points in each outer row. Five is more than $3$, so set B has no Gray labelling. '
     +'In set C each level has at most two neighbours. The same Gray code, read from left to right, is a Gray labelling.<br>'
     +'<b>Solution — (c).</b> First count the bits of the given labels of set B over its $13$ pairs at $d_{\\min}$. Nine pairs differ in one bit. Four differ in two bits: $\\mathtt{001}$ and $\\mathtt{100}$, $\\mathtt{011}$ and $\\mathtt{101}$, $\\mathtt{100}$ and $\\mathtt{010}$, $\\mathtt{101}$ and $\\mathtt{110}$. '
     +'Each pair is counted once from each of its two points:'
     +'$$w_B=\\frac{2(9\\cdot1+4\\cdot2)}{8}=\\frac{34}{8}=4.25.$$'
     +'Sets A and C have Gray labels, so $w=N_{\\min}$. Set A has $N_{\\min}=2$. Set C has two end levels with one neighbour and six with two, so $N_{\\min}=(2+12)/8=1.75$. '
     +'Next write $d_{\\min}^{2}/2N_0$ through $E_b/N_0$, with $E_b=3$:'
     +'$$\\begin{aligned}\\text{A:}\\quad\\frac{d_{\\min}^{2}}{2N_0}&=\\frac{6}{2N_0}=\\frac{E_b}{N_0},\\\\\\text{B:}\\quad\\frac{d_{\\min}^{2}}{2N_0}&=\\frac{8}{2N_0}=\\frac43\\,\\frac{E_b}{N_0},\\\\\\text{C:}\\quad\\frac{d_{\\min}^{2}}{2N_0}&=\\frac{12/7}{2N_0}=\\frac27\\,\\frac{E_b}{N_0}.\\end{aligned}$$'
     +'So'
     +'$$\\begin{aligned}P_{b,\\text{A}}&\\approx\\frac23\\,Q\\Big(\\sqrt{\\frac{E_b}{N_0}}\\Big),\\\\P_{b,\\text{B}}&\\approx\\frac{4.25}{3}\\,Q\\Big(\\sqrt{\\frac{4E_b}{3N_0}}\\Big),\\\\P_{b,\\text{C}}&\\approx\\frac{1.75}{3}\\,Q\\Big(\\sqrt{\\frac{2E_b}{7N_0}}\\Big).\\end{aligned}$$'
     +'At $E_b/N_0=9$ the arguments are $\\sqrt9=3.00$, $\\sqrt{12}=3.46$ and $\\sqrt{18/7}=1.60$. The table gives $Q(3.00)=1.350\\times10^{-3}$, $Q(3.46)=2.70\\times10^{-4}$ and $Q(1.60)=5.48\\times10^{-2}$:'
     +'$$\\begin{aligned}P_{b,\\text{A}}&\\approx0.667(1.350\\times10^{-3})=9.00\\times10^{-4},\\\\P_{b,\\text{B}}&\\approx1.417(2.70\\times10^{-4})=3.83\\times10^{-4},\\\\P_{b,\\text{C}}&\\approx0.583(5.48\\times10^{-2})=3.20\\times10^{-2}.\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> At high signal-to-noise ratio the $Q$ argument decides. So rank by $d_{\\min}^{2}/E_b$: $8/3=2.667$ for B, $2$ for A and $4/7=0.571$ for C. B is best, then A, then C. The gaps are'
     +'$$10\\log_{10}\\frac{8/3}{2}=1.25\\ \\text{dB},\\qquad10\\log_{10}\\frac{2}{4/7}=5.44\\ \\text{dB}.$$'
     +'Set B wins without a Gray labelling. Its extra bits a symbol error multiply $P_b$ by $4.25/2$, about $2$. Its larger distance divides $Q$ by $1.350\\times10^{-3}/2.70\\times10^{-4}=5$. The figure draws the three sets with their labels, and the dashed red pairs of set B are the four that differ in two bits.<br>'
     +'<b>Check.</b> List the energies of set A with $c^{2}=6$: four corners at $12$ and four edge points at $6$. The average is $(48+24)/8=9=3E_b$. '
     +'For set B with $b^{2}=8$ the energies are $14$, $6$ and $2$, and $(4\\cdot14+2\\cdot6+2\\cdot2)/8=72/8=9$.',
  err:'Using $P_b\\approx P_e/3$ for set B. That rule needs Gray labels. Four of the thirteen closest pairs of set B differ in two bits, so an error there costs two bits.',
  teach:'Symbol error against bit error. The counting argument of part (b) is one line: a $3$-bit label has only three one-bit neighbours. Set B shows that the best set need not have a Gray labelling.',
  figSol:()=>{
    const G = ['000','001','011','010','110','111','101','100'].map(s=>'\\mathtt{'+s+'}');
    const c = Math.sqrt(6), b = 2*R2, h = b*R3/2, g = Math.sqrt(12/7);
    const A = [[c,0],[c,c],[0,c],[-c,c],[-c,0],[-c,-c],[0,-c],[c,-c]];
    const B = [[-b,h],[0,h],[b,h],[-b/2,0],[b/2,0],[-b,-h],[0,-h],[b,-h]];
    const BL = ['000','001','011','100','101','010','110','111'];
    const hd = (i,j) => { let x = parseInt(BL[i],2)^parseInt(BL[j],2), n = 0; while(x){ n += x&1; x >>= 1; } return n; };
    const Cp = range(1,8).map(k=>[(2*k-9)*g/2, 0]);
    return pair(cfig(A, {names:G, dTex:'\\sqrt{6}', tick:2, margin:1.9, title:'\\text{A}'}),
                cfig(B, {names:BL.map(s=>'\\mathtt{'+s+'}'), dTex:'2\\sqrt{2}', tick:2, margin:1.9, title:'\\text{B}',
                  pairStyle:(i,j)=>hd(i,j)>1 ? {color:C.err, width:2.8, dash:'8 5'} : {}}))
         + cfig(Cp, {oneD:true, names:G, dTex:'1.309', margin:1.9, xticks:[-4.582, 4.582], title:'\\text{C}'}); } },

{ id:'D5-17', module:'M5', type:'phase', src:'Madhow P6.29',
  stem:'A BPSK link sends $s_{1,2}(t)=\\pm\\sqrt{2E_b/T}\\cos(2\\pi f_ct)$ on $0\\le t\\le T$ over an AWGN channel with $\\mathcal{N}(0,N_0/2)$. The carrier reaches the receiver with an extra phase $\\varphi$ that the receiver does not know. '
      +'The receiver correlates with $\\psi_1(t)=\\sqrt{2/T}\\cos(2\\pi f_ct)$ and $\\psi_2(t)=-\\sqrt{2/T}\\sin(2\\pi f_ct)$. It decides from the sign of the $\\psi_1$ output alone. Take $E_b/N_0=8$.',
  parts:['[7 pts] For $\\varphi=25^{\\circ}$, find the noiseless outputs on $\\psi_1$ and $\\psi_2$ in units of $\\sqrt{E_b}$. Sketch the two points against the decision boundary.',
         '[8 pts] Find the bit error probability as a function of $\\varphi$ and $E_b/N_0$ for $0\\le\\varphi<90^{\\circ}$. Evaluate it at $\\varphi=0$, $25^{\\circ}$ and $60^{\\circ}$.',
         '[5 pts] Find the loss in decibels at $\\varphi=25^{\\circ}$ and at $\\varphi=60^{\\circ}$.',
         '[5 pts] The phase error grows to $\\varphi=155^{\\circ}$. Find the bit error probability, and say how differential encoding removes the problem.'],
  sol:'<b>Given.</b> BPSK with energy $E_b$ a bit, a carrier phase error $\\varphi$, a decision from the sign of the $\\psi_1$ output, and $E_b/N_0=8$.<br>'
     +'<b>Find.</b> The noiseless outputs at $25^{\\circ}$, and $P_b$ as a function of $\\varphi$ at three angles. The loss in decibels, and the result at $155^{\\circ}$.<br>'
     +'<b>Method.</b> Project the received waveform on each basis function. A phase error turns the constellation by $\\varphi$, while the boundary stays where the receiver put it. The distance from a point to the boundary sets $P_b$. The noise on the $\\psi_1$ output has variance $N_0/2$.<br>'
     +'<b>Solution — (a).</b> The noiseless received waveform is $\\pm\\sqrt{2E_b/T}\\cos(2\\pi f_ct+\\varphi)$. Expand the cosine of a sum:'
     +'$$\\begin{aligned}\\sqrt{\\tfrac{2E_b}{T}}\\cos(2\\pi f_ct+\\varphi)&=\\sqrt{\\tfrac{2E_b}{T}}\\big[\\cos\\varphi\\cos(2\\pi f_ct)-\\sin\\varphi\\sin(2\\pi f_ct)\\big]\\\\&=\\sqrt{E_b}\\cos\\varphi\\,\\psi_1(t)+\\sqrt{E_b}\\sin\\varphi\\,\\psi_2(t).\\end{aligned}$$'
     +'So the two points sit at $\\pm\\sqrt{E_b}\\,(\\cos\\varphi,\\sin\\varphi)$. With $\\varphi=25^{\\circ}$ they are'
     +'$$\\pm\\sqrt{E_b}\\,(\\cos25^{\\circ},\\sin25^{\\circ})=\\pm\\sqrt{E_b}\\,(0.906,\\;0.423).$$'
     +'The boundary is still the $\\psi_2$ axis, $\\psi_1=0$, because the receiver uses only the sign of the $\\psi_1$ output. The points have turned by $25^{\\circ}$ about the origin. '
     +'Their distance to the boundary has shrunk from $\\sqrt{E_b}$ to $\\sqrt{E_b}\\cos25^{\\circ}=0.906\\sqrt{E_b}$.<br>'
     +'<b>Solution — (b).</b> Given $s_1$, the $\\psi_1$ output is $Y=\\sqrt{E_b}\\cos\\varphi+N$ with $N\\sim\\mathcal{N}(0,N_0/2)$. An error is $Y<0$:'
     +'$$\\begin{aligned}P_b&=P\\big(N<-\\sqrt{E_b}\\cos\\varphi\\big)\\\\&=Q\\Big(\\frac{\\sqrt{E_b}\\cos\\varphi}{\\sqrt{N_0/2}}\\Big)\\\\&=Q\\Big(\\sqrt{\\frac{2E_b}{N_0}}\\cos\\varphi\\Big).\\end{aligned}$$'
     +'By symmetry $s_2$ gives the same value. At $E_b/N_0=8$, $\\sqrt{2E_b/N_0}=\\sqrt{16}=4$:'
     +'$$\\begin{aligned}\\varphi=0:&\\quad P_b=Q(4.00)=3.17\\times10^{-5},\\\\\\varphi=25^{\\circ}:&\\quad P_b=Q(4\\cos25^{\\circ})=Q(3.63)=1.42\\times10^{-4},\\\\\\varphi=60^{\\circ}:&\\quad P_b=Q(4\\cos60^{\\circ})=Q(2.00)=2.28\\times10^{-2}.\\end{aligned}$$'
     +'The $\\psi_2$ output does not enter the decision, so its noise does not matter.<br>'
     +'<b>Solution — (c).</b> The factor $\\cos\\varphi$ scales the distance to the boundary. To win that distance back, the energy must grow by $1/\\cos^{2}\\varphi$. So the loss is'
     +'$$L=10\\log_{10}\\frac{1}{\\cos^{2}\\varphi}=-20\\log_{10}\\cos\\varphi.$$'
     +'At the two angles,'
     +'$$\\begin{aligned}\\varphi=25^{\\circ}:&\\quad L=-20\\log_{10}0.9063=0.85\\ \\text{dB},\\\\\\varphi=60^{\\circ}:&\\quad L=-20\\log_{10}0.5=6.02\\ \\text{dB}.\\end{aligned}$$'
     +'A small phase error costs little. The cost grows fast as $\\varphi$ nears $90^{\\circ}$.<br>'
     +'<b>Solution — (d).</b> At $\\varphi=155^{\\circ}$, $\\cos\\varphi=-0.906$. The point sent as $s_1$ has crossed the boundary:'
     +'$$\\begin{aligned}P_b&=Q\\big(4(-0.906)\\big)=Q(-3.63)\\\\&=1-Q(3.63)=0.99986.\\end{aligned}$$'
     +'Almost every bit is inverted. With differential encoding the bit is carried by the change of phase from one symbol to the next. '
     +'A constant $\\varphi$ turns both symbols by the same angle, so the change survives. At $155^{\\circ}$ the receiver inverts both decisions, and their comparison is still right. '
     +'The distance is then $0.906\\sqrt{E_b}$, as at $25^{\\circ}$. One wrong decision spoils two comparisons, so $P_b\\approx2(1.42\\times10^{-4})=2.84\\times10^{-4}$. The figure draws the three angles in units of $\\sqrt{E_b}$, with the distance of $s_1$ to the boundary marked.<br>'
     +'<b>Check.</b> Put $\\varphi=90^{\\circ}$ in the formula of part (b). Then $\\cos\\varphi=0$ and $P_b=Q(0)=\\tfrac12$. Both points sit on the boundary, and the decision is a coin toss. '
     +'The energy of each point is $E_b(\\cos^{2}\\varphi+\\sin^{2}\\varphi)=E_b$, so the phase error moves the points without changing their energy.',
  err:'Writing $\\cos^{2}\\varphi$ inside the argument of $Q$. The argument is a distance over $\\sqrt{N_0/2}$, and the distance shrinks by $\\cos\\varphi$. The energy, and so the loss in decibels, carries $\\cos^{2}\\varphi$.',
  teach:'A receiver that is slightly wrong in phase. The sketch of part (a) is the whole argument: the points turn and the boundary stays. Part (d) links to differential PSK, where a constant phase error cancels.',
  figSol:()=>row(figPhase(25, {dTex:'0.906', dAt:[0.55, 0.13, 'middle']}),
                 figPhase(60, {dTex:'0.5', dAt:[0.25, 1.02, 'middle']}),
                 figPhase(155, {dTex:'-0.906', dAt:[-0.55, 0.13, 'middle']})) },

{ id:'D5-18', module:'M5', type:'fsk', src:'Final Q3',
  stem:OPEN+'$$s_{1,2}(t)=\\pm2\\cos(2000\\pi t),\\qquad s_{3,4}(t)=\\pm2\\cos(3000\\pi t),\\qquad0\\le t\\le1.$$'+AWGN,
  parts:['[8 pts] Show that the two carriers are orthogonal on $0\\le t\\le1$, and choose an orthonormal basis.',
         PDRAW(8),
         '[9 pts] Determine the nearest-neighbour approximation as a function of $E_{s,\\text{avg}}/N_0$. Evaluate it at $9$ and compare with a four-point PSK set of the same energy.'],
  sol:'<b>Given.</b> Four waveforms: $\\pm2\\cos$ at $1000$ Hz and $\\pm2\\cos$ at $1500$ Hz, $0\\le t\\le1$.<br>'
     +'<b>Find.</b> The orthogonality, the constellation and regions, $P_e$, and the comparison with four-point PSK.<br>'
     +'<b>Method.</b> Two cosines are orthogonal when their product integrates to zero. Then each frequency is one axis of the constellation.<br>'
     +'<b>Solution — (a).</b> Use the product-to-sum identity and integrate:'
     +'$$\\begin{aligned}\\int_0^1\\cos(2000\\pi t)\\cos(3000\\pi t)\\,dt&=\\frac12\\int_0^1\\big[\\cos(1000\\pi t)+\\cos(5000\\pi t)\\big]dt\\\\&=\\frac12\\Big[\\frac{\\sin(1000\\pi t)}{1000\\pi}+\\frac{\\sin(5000\\pi t)}{5000\\pi}\\Big]_0^1\\\\&=0.\\end{aligned}$$'
     +'Both sines are zero at $t=1$ and $t=0$. So take $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=\\sqrt2\\cos(3000\\pi t)$.<br>'
     +'<b>Solution — (b).</b> Since $2\\cos(\\cdot)=\\sqrt2\\,\\psi(\\cdot)$, the points are $(\\pm\\sqrt2,0)$ and $(0,\\pm\\sqrt2)$. This is a square turned by $45^{\\circ}$. The regions are bounded by the diagonals $\\psi_2=\\pm\\psi_1$.<br>'
     +'<b>Solution — (c).</b> Every energy is $2$, so $E_{s,\\text{avg}}=2$. Neighbours at right angles are $\\sqrt{2+2}=2$ apart, and opposite points $2\\sqrt2$. So $d_{\\min}^{2}=4=2E_{s,\\text{avg}}$ and $N_{\\min}=2$:'
     +'$$\\begin{aligned}P_e&\\approx2\\,Q\\Big(\\sqrt{\\frac{2E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=2\\,Q\\Big(\\sqrt{\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$'
     +'At $9$ this is $2Q(3.00)=2.70\\times10^{-3}$. Four-point PSK of the same energy has the same square and the same answer. It uses one carrier frequency instead of two.<br>'
     +'<b>Check.</b> Compute the distance from the waveforms: $\\int_0^1\\big[2\\cos(2000\\pi t)-2\\cos(3000\\pi t)\\big]^{2}dt=2+2-0=4$. The cross term vanishes by part (a).',
  err:'Treating $\\pm$ on one frequency as orthogonal. $2\\cos$ and $-2\\cos$ at the same frequency are antipodal, on one axis, not orthogonal.',
  teach:'A biorthogonal set from two frequencies. It has the geometry of four-point PSK, so the comparison is a tie in energy and a loss in bandwidth.',
  figSol:()=>cfig([[R2,0],[-R2,0],[0,R2],[0,-R2]], {dTex:'2', tick:1, margin:1.5}) },

{ id:'D5-19', module:'M5', type:'fsk', src:'Final Q3',
  stem:OPEN+'$$s_1(t)=0,\\qquad s_2(t)=3\\cos(4000\\pi t),\\qquad s_3(t)=3\\cos(5000\\pi t),\\qquad0\\le t\\le2.$$'+AWGN,
  parts:[PDRAW(10), PNN(10), '[5 pts] Evaluate the approximation of part (b) at $E_{s,\\text{avg}}/N_0=12$.'],
  sol:'<b>Given.</b> The zero signal and two cosines of amplitude $3$ at $2000$ Hz and $2500$ Hz, $0\\le t\\le2$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and its value at $12$.<br>'
     +'<b>Method.</b> The two cosines differ by $500$ Hz, a multiple of $1/(2T)=0.25$ Hz, so they are orthogonal on $0\\le t\\le2$. With $T=2$ the unit-energy functions are $\\psi_1(t)=\\cos(4000\\pi t)$ and $\\psi_2(t)=\\cos(5000\\pi t)$.<br>'
     +'<b>Solution — (a).</b> Check the unit energy of $\\psi_1$:'
     +'$$\\int_0^2\\cos^{2}(4000\\pi t)\\,dt=\\frac12\\Big[t+\\frac{\\sin(8000\\pi t)}{8000\\pi}\\Big]_0^2=1.$$'
     +'So $\\mathbf{s}_1=(0,0)$, $\\mathbf{s}_2=(3,0)$ and $\\mathbf{s}_3=(0,3)$. $D_1$ is the square corner $\\psi_1<1.5$, $\\psi_2<1.5$. $D_2$ lies right of $\\psi_1=1.5$ and below the diagonal $\\psi_2=\\psi_1$. $D_3$ lies above $\\psi_2=1.5$ and above the diagonal.<br>'
     +'<b>Solution — (b).</b> Average the energies:'
     +'$$E_{s,\\text{avg}}=\\frac{0+9+9}{3}=6.$$'
     +'The distances are $3$ from $\\mathbf{s}_1$ to each other point and $3\\sqrt2$ between $\\mathbf{s}_2$ and $\\mathbf{s}_3$. So $d_{\\min}=3$ and $d_{\\min}^{2}=9=1.5E_{s,\\text{avg}}$. '
     +'$\\mathbf{s}_1$ has two neighbours and the others one each: $N_{\\min}=4/3$. Then'
     +'$$\\begin{aligned}P_e&\\approx\\frac43\\,Q\\Big(\\sqrt{\\frac{1.5E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=\\frac43\\,Q\\Big(\\sqrt{0.75\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The argument is $\\sqrt{0.75\\times12}=3.00$, so $P_e\\approx\\frac43(0.001350)=1.80\\times10^{-3}$.<br>'
     +'<b>Check.</b> Compute $d_{23}^{2}$ from the waveforms: $\\int_0^2 9\\big[\\cos(4000\\pi t)-\\cos(5000\\pi t)\\big]^{2}dt=9+9-0=18$. So $d_{23}=3\\sqrt2$, larger than $d_{\\min}$.',
  err:'Using $\\sqrt2\\cos$ as the basis. That has unit energy only on a one-second interval. On $0\\le t\\le2$ the unit-energy carrier is $\\cos$ itself.',
  teach:'On-off keying and frequency keying in one set. The zero signal has two neighbours, so its region is the corner square.',
  figSol:()=>cfig([[0,0],[3,0],[0,3]], {dTex:'3', tick:1, margin:1.6}) },

{ id:'D5-20', module:'M5', type:'sens', src:'Madhow P6.35',
  stem:'A receiver is given a carrier channel of bandwidth $B=6$ MHz. The pulses are raised cosines with roll-off $\\alpha=0.2$, so $B=(1+\\alpha)R_s$, where $R_s$ is the symbol rate. The receiver noise figure is $\\text{NF}=6$ dB, and thermal noise at room temperature is $kT_0=-174$ dBm/Hz. The target bit error probability is $P_b=10^{-6}$. Three schemes with Gray labels are compared: QPSK, 8-PSK and 16-QAM. Use the nearest-neighbour form $$P_b\\approx\\frac{\\bar N_{\\min}}{\\log_2M}\\,Q\\Big(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\Big)$$ and the values $Q(4.753)=1.00\\times10^{-6}$, $Q(4.695)=1.33\\times10^{-6}$ and $Q(4.671)=1.50\\times10^{-6}$.',
  parts:['[5 pts] Find the symbol rate and the bit rate of each scheme.',
         '[10 pts] Write $d_{\\min}^{2}$ of each scheme in terms of $E_b$, and its $P_b$ as a function of $E_b/N_0$. Find the $E_b/N_0$ in dB that each needs for $P_b=10^{-6}$.',
         '[6 pts] Find the sensitivity of each scheme in dBm.',
         '[4 pts] Find the noise power in the $6$ MHz band. Find the signal-to-noise ratio $P_{\\min}/N$ at the QPSK sensitivity, and explain why it differs from the $E_b/N_0$ of part (b).'],
  sol:'<b>Given.</b> A band $B=6$ MHz with roll-off $0.2$, $\\text{NF}=6$ dB, $kT_0=-174$ dBm/Hz and the target $P_b=10^{-6}$. QPSK, 8-PSK and 16-QAM with Gray labels, and three values of $Q$.<br>'
     +'<b>Find.</b> $R_s$ and each $R_b$. Each $d_{\\min}^{2}$, $P_b$ and required $E_b/N_0$. Each sensitivity. The noise in the band and the SNR at the QPSK sensitivity.<br>'
     +'<b>Method.</b> The band fixes the symbol rate $R_s=B/(1+\\alpha)$, and $R_b=R_s\\log_2M$. Write $E_s=E_b\\log_2M$ so each $d_{\\min}^{2}$ is a multiple of $E_b$. Then set $P_b$ equal to the target and read the argument of $Q$ from the table. '
     +'The sensitivity comes from $E_b=P_r/R_b$, so $P_{\\min}=-174+\\text{NF}+10\\log_{10}R_b+(E_b/N_0)_{\\text{dB}}$.<br>'
     +'<b>Solution — (a).</b> The symbol rate is the same for all three:'
     +'$$R_s=\\frac{B}{1+\\alpha}=\\frac{6}{1.2}=5\\ \\text{Msym/s}.$$'
     +'QPSK carries $2$ bits a symbol, $R_b=10$ Mb/s. 8-PSK carries $3$, $R_b=15$ Mb/s. 16-QAM carries $4$, $R_b=20$ Mb/s.<br>'
     +'<b>Solution — (b).</b> QPSK has four points at radius $\\sqrt{E_s}$, $90^{\\circ}$ apart, so $d_{\\min}^{2}=2E_s=4E_b$. Each point has $\\bar N_{\\min}=2$ neighbours and carries $2$ bits:'
     +'$$P_b\\approx\\frac22\\,Q\\Big(\\sqrt{\\frac{4E_b}{2N_0}}\\Big)=Q\\Big(\\sqrt{\\frac{2E_b}{N_0}}\\Big).$$'
     +'Set the argument to $4.753$:'
     +'$$\\begin{aligned}\\frac{E_b}{N_0}&=\\frac{4.753^{2}}{2}=\\frac{22.59}{2}=11.30,\\\\10\\log_{10}11.30&=10.53\\ \\text{dB}.\\end{aligned}$$'
     +'8-PSK has neighbours $45^{\\circ}$ apart, so $d_{\\min}^{2}=4E_s\\sin^{2}(\\pi/8)=4(3E_b)(0.1464)=1.757E_b$. With $\\bar N_{\\min}=2$ and $3$ bits a symbol,'
     +'$$P_b\\approx\\frac23\\,Q\\Big(\\sqrt{\\frac{1.757E_b}{2N_0}}\\Big)=\\frac23\\,Q\\Big(\\sqrt{\\frac{0.8787E_b}{N_0}}\\Big).$$'
     +'The target needs $Q(\\cdot)=\\tfrac32\\times10^{-6}=1.50\\times10^{-6}$, an argument of $4.671$:'
     +'$$\\begin{aligned}\\frac{E_b}{N_0}&=\\frac{4.671^{2}}{0.8787}=\\frac{21.82}{0.8787}=24.83,\\\\10\\log_{10}24.83&=13.95\\ \\text{dB}.\\end{aligned}$$'
     +'16-QAM has $d_{\\min}^{2}=6E_s/(M-1)=0.4E_s=1.6E_b$ and $\\bar N_{\\min}=3$, with $4$ bits a symbol:'
     +'$$P_b\\approx\\frac34\\,Q\\Big(\\sqrt{\\frac{1.6E_b}{2N_0}}\\Big)=\\frac34\\,Q\\Big(\\sqrt{\\frac{0.8E_b}{N_0}}\\Big).$$'
     +'The target needs $Q(\\cdot)=\\tfrac43\\times10^{-6}=1.33\\times10^{-6}$, an argument of $4.695$:'
     +'$$\\begin{aligned}\\frac{E_b}{N_0}&=\\frac{4.695^{2}}{0.8}=\\frac{22.04}{0.8}=27.55,\\\\10\\log_{10}27.55&=14.40\\ \\text{dB}.\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> Add the noise density, the noise figure, the bit rate in decibels and the required ratio:'
     +'$$\\begin{aligned}\\text{QPSK:}\\quad P_{\\min}&=-174+6+10\\log_{10}(10^{7})+10.53\\\\&=-174+6+70.00+10.53=-87.47\\ \\text{dBm},\\\\\\text{8-PSK:}\\quad P_{\\min}&=-174+6+71.76+13.95=-82.29\\ \\text{dBm},\\\\\\text{16-QAM:}\\quad P_{\\min}&=-174+6+73.01+14.40=-80.59\\ \\text{dBm}.\\end{aligned}$$'
     +'16-QAM carries a third more bits than 8-PSK for only $1.70$ dB more power.<br>'
     +'<b>Solution — (d).</b> The noise in the band is'
     +'$$\\begin{aligned}N&=-174+6+10\\log_{10}(6\\times10^{6})\\\\&=-174+6+67.78=-100.22\\ \\text{dBm}.\\end{aligned}$$'
     +'At the QPSK sensitivity the ratio is $-87.47-(-100.22)=12.75$ dB. It is not $10.53$ dB because $P=E_bR_b$ and $N=N_0B$, so'
     +'$$\\frac{P}{N}=\\frac{E_b}{N_0}\\cdot\\frac{R_b}{B},\\qquad10.53+10\\log_{10}\\frac{10}{6}=10.53+2.22=12.75\\ \\text{dB}.$$'
     +'QPSK here sends $10/6=1.67$ bits a second per hertz, so the band holds $2.22$ dB less noise than a band of $R_b$ hertz. The figure shows the three curves at the target and the three sensitivities above the noise.<br>'
     +'<b>Check.</b> Rebuild the 8-PSK sensitivity from the band. Its SNR is $13.95+10\\log_{10}(15/6)=13.95+3.98=17.93$ dB, and $-100.22+17.93=-82.29$ dBm, as in part (c).',
  err:'Putting the band $B$ in place of $R_b$ in the sensitivity. $E_b/N_0$ is energy a bit, so the sum takes $10\\log_{10}R_b$. With $10\\log_{10}B$ the QPSK answer comes out $2.22$ dB too low.',
  teach:'From a band to a sensitivity for three schemes. Part (d) separates $E_b/N_0$ from the signal-to-noise ratio in the band.',
  figSol:()=>pair(figPb35(), figSens35()) },

{ id:'D5-21', module:'M5', type:'qam', src:'Final Q3',
  stem:OPEN+'$$\\begin{aligned}s_k(t)&=2\\cos\\!\\Big(2000\\pi t+\\frac{(k-1)\\pi}{2}\\Big),\\quad k\\in\\{1,2,3\\},\\\\s_4(t)&=4\\cos\\!\\Big(2000\\pi t+\\frac{3\\pi}{2}\\Big),\\end{aligned}$$ all on $0\\le t\\le1$.'+AWGN,
  parts:[PDRAW(10), PNN(10), '[5 pts] Compare with a regular four-point PSK set of the same $E_{s,\\text{avg}}$, in decibels.'],
  sol:'<b>Given.</b> Three waveforms of amplitude $2$ at phases $0,90^{\\circ},180^{\\circ}$, and a fourth of amplitude $4$ at $270^{\\circ}$. The carrier is $1000$ Hz, $0\\le t\\le1$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and the loss against regular four-point PSK.<br>'
     +'<b>Method.</b> Use $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$. The radii are $2/\\sqrt2=\\sqrt2$ and $4/\\sqrt2=2\\sqrt2$.<br>'
     +'<b>Solution — (a).</b> The points are $\\mathbf{s}_1=(\\sqrt2,0)$, $\\mathbf{s}_2=(0,\\sqrt2)$, $\\mathbf{s}_3=(-\\sqrt2,0)$ and $\\mathbf{s}_4=(0,-2\\sqrt2)$. '
     +'The diagonals separate $\\mathbf{s}_2$ from $\\mathbf{s}_1$ and $\\mathbf{s}_3$. The bisector of $\\mathbf{s}_1$ and $\\mathbf{s}_4$ is $\\psi_1+2\\psi_2=-3/\\sqrt2$, and its mirror image separates $\\mathbf{s}_3$ from $\\mathbf{s}_4$. The region of $\\mathbf{s}_4$ is pushed down with its point.<br>'
     +'<b>Solution — (b).</b> Average the energies:'
     +'$$E_{s,\\text{avg}}=\\frac{2+2+2+8}{4}=3.5.$$'
     +'The distances are $d_{12}=d_{23}=2$, $d_{13}=2\\sqrt2$, $d_{14}=d_{34}=\\sqrt{2+8}=\\sqrt{10}$ and $d_{24}=3\\sqrt2$. So $d_{\\min}=2$ and $d_{\\min}^{2}=4=\\frac87E_{s,\\text{avg}}$. '
     +'$\\mathbf{s}_2$ has two neighbours, $\\mathbf{s}_1$ and $\\mathbf{s}_3$ one, and $\\mathbf{s}_4$ none: $N_{\\min}=4/4=1$. Then'
     +'$$\\begin{aligned}P_e&\\approx Q\\Big(\\sqrt{\\frac{8E_{s,\\text{avg}}/7}{2N_0}}\\Big)\\\\&=Q\\Big(\\sqrt{\\frac{4E_{s,\\text{avg}}}{7N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> Regular four-point PSK has $d_{\\min}^{2}=2E_{s,\\text{avg}}$. The loss is'
     +'$$10\\log_{10}\\frac{2}{8/7}=10\\log_{10}1.75=2.43\\ \\text{dB}.$$'
     +'Moving $\\mathbf{s}_4$ out cost energy and gave no distance, because $d_{\\min}$ is set by the three near points.<br>'
     +'<b>Check.</b> The midpoint of $\\mathbf{s}_1$ and $\\mathbf{s}_4$ is $(0.707,-1.414)$. Then $0.707+2(-1.414)=-2.121=-3/\\sqrt2$, so the bisector passes through it.',
  err:'Keeping the PSK answer $N_{\\min}=2$. The point off the circle has no neighbour at $d_{\\min}$, and $\\mathbf{s}_1$, $\\mathbf{s}_3$ lose one each.',
  teach:'One point off the circle breaks the symmetry. The neighbour count must be done point by point.',
  figSol:()=>cfig([[R2,0],[0,R2],[-R2,0],[0,-2*R2]], {dTex:'2', tick:1, margin:1.5}) },

{ id:'D5-22', module:'M5', type:'qam', src:'Final Q3',
  stem:OPEN+'$$s_{1,2}(t)=\\pm\\sqrt2\\cos(3000\\pi t),\\qquad s_{3,4}(t)=2\\sqrt2\\cos\\!\\Big(3000\\pi t\\pm\\frac{\\pi}{2}\\Big),\\qquad0\\le t\\le1.$$'+AWGN,
  parts:[PDRAW(10), PNN(10),
         '[5 pts] The next distance is only slightly larger than $d_{\\min}$. Add its terms to the approximation and evaluate both at $E_{s,\\text{avg}}/N_0=11.25$.'],
  sol:'<b>Given.</b> $\\pm\\sqrt2\\cos(3000\\pi t)$, and two waveforms of amplitude $2\\sqrt2$ at phases $\\pm90^{\\circ}$, on $0\\le t\\le1$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and the effect of the second distance.<br>'
     +'<b>Method.</b> Use $\\psi_1(t)=\\sqrt2\\cos(3000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(3000\\pi t)$. Note $\\cos(x+\\pi/2)=-\\sin x$, so $s_3=2\\psi_2$ and $s_4=-2\\psi_2$.<br>'
     +'<b>Solution — (a).</b> The points are $\\mathbf{s}_1=(1,0)$, $\\mathbf{s}_2=(-1,0)$, $\\mathbf{s}_3=(0,2)$ and $\\mathbf{s}_4=(0,-2)$, a rhombus. '
     +'The $\\psi_2$ axis separates $\\mathbf{s}_1$ from $\\mathbf{s}_2$ near the origin. The bisector of $\\mathbf{s}_1$ and $\\mathbf{s}_3$ is $-2\\psi_1+4\\psi_2=3$, and its mirror images bound the other pairs.<br>'
     +'<b>Solution — (b).</b> Average the energies:'
     +'$$E_{s,\\text{avg}}=\\frac{1+1+4+4}{4}=2.5.$$'
     +'The distances are $d_{12}=2$, $d_{34}=4$ and $\\sqrt{1+4}=\\sqrt5=2.236$ for the four mixed pairs. So $d_{\\min}=2$ and $d_{\\min}^{2}=4=1.6E_{s,\\text{avg}}$. Only $\\mathbf{s}_1$ and $\\mathbf{s}_2$ have a neighbour at $d_{\\min}$: $N_{\\min}=2/4=0.5$. Then'
     +'$$\\begin{aligned}P_e&\\approx0.5\\,Q\\Big(\\sqrt{\\frac{1.6E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=0.5\\,Q\\Big(\\sqrt{0.8\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The four mixed pairs have $d^{2}=5=2E_{s,\\text{avg}}$. Each point is in two of them, so they add $2Q\\big(\\sqrt{E_{s,\\text{avg}}/N_0}\\big)$. At $11.25$,'
     +'$$\\begin{aligned}0.5\\,Q(\\sqrt{9})&=0.5(0.001350)=6.75\\times10^{-4},\\\\2\\,Q(\\sqrt{11.25})&=2\\,Q(3.35)=2(0.0004041)=8.08\\times10^{-4}.\\end{aligned}$$'
     +'The second term is larger than the first. The estimate with both is $1.48\\times10^{-3}$, more than twice the nearest-neighbour value.<br>'
     +'<b>Check.</b> The midpoint of $\\mathbf{s}_1$ and $\\mathbf{s}_3$ is $(0.5,1)$. Then $-2(0.5)+4(1)=3$, so the bisector passes through it.',
  err:'Trusting the nearest-neighbour form when the second distance is close to $d_{\\min}$. With $N_{\\min}=0.5$ and four pairs at $1.12d_{\\min}$, the dropped terms dominate.',
  teach:'The examination shape where the approximation misleads. Part (c) makes the student test the approximation instead of trusting it.',
  figSol:()=>cfig([[1,0],[-1,0],[0,2],[0,-2]], {dTex:'2', tick:1, margin:1.4}) },

/* ---- creative questions in the same format ---------------------------- */

{ id:'D5-23', module:'M5', type:'design', src:'Final Q3 (variant)',
  stem:'Five equally probable waveforms are transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. The figure shows their optimal decision regions $D_1,\\ldots,D_5$ on the basis $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$, $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$, $0\\le t\\le1$. '
      +'The central region is the square $|\\psi_1|<1$, $|\\psi_2|<1$, and the diagonals split the rest. One waveform is the zero signal. The other four have equal energy, and $E_{s,\\text{avg}}=3.2$.',
  figure:()=>cfig([[0,0],[2,0],[0,2],[-2,0],[0,-2]], {hide:true, tick:1, margin:1.6,
    regionNames:['D_1','D_2','D_3','D_4','D_5'], regionAt:[[0,0],[2.6,0.5],[-0.5,2.6],[-2.6,-0.5],[0.5,-2.6]]}),
  parts:['[8 pts] Locate the five signal points from the regions, and confirm the value of $E_{s,\\text{avg}}$.',
         '[7 pts] Write the five waveforms $s_1(t),\\ldots,s_5(t)$, with $s_k$ the symbol decided in $D_k$.',
         '[10 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$. Evaluate it at $E_{s,\\text{avg}}/N_0=14.4$.'],
  sol:'<b>Given.</b> The five regions: a square $|\\psi_1|<1$, $|\\psi_2|<1$ in the centre, and four outer regions split by the diagonals. The zero signal is one of the points, and $E_{s,\\text{avg}}=3.2$.<br>'
     +'<b>Find.</b> The points, the waveforms, and $P_e$ with its value at $14.4$.<br>'
     +'<b>Method.</b> A boundary between two regions is the perpendicular bisector of their two points. So each point is the mirror image of its neighbour in the shared boundary.<br>'
     +'<b>Solution — (a).</b> The zero signal is in the square $D_1$, so $\\mathbf{s}_1=(0,0)$. The boundary between $D_1$ and $D_2$ is the line $\\psi_1=1$. The mirror image of the origin in it is $\\mathbf{s}_2=(2,0)$. '
     +'The same step gives $\\mathbf{s}_3=(0,2)$, $\\mathbf{s}_4=(-2,0)$ and $\\mathbf{s}_5=(0,-2)$. The bisector of $\\mathbf{s}_2$ and $\\mathbf{s}_3$ is $\\psi_2=\\psi_1$, which is the diagonal drawn. The energy is'
     +'$$E_{s,\\text{avg}}=\\frac{0+4(2^{2})}{5}=\\frac{16}{5}=3.2.$$<br>'
     +'<b>Solution — (b).</b> Invert $c_1\\psi_1+c_2\\psi_2=\\sqrt2\\,[c_1\\cos(2000\\pi t)-c_2\\sin(2000\\pi t)]$ for each point:'
     +'$$\\begin{aligned}s_1(t)&=0,\\\\s_2(t)&=2\\sqrt2\\cos(2000\\pi t),\\\\s_3(t)&=-2\\sqrt2\\sin(2000\\pi t)=2\\sqrt2\\cos(2000\\pi t+\\tfrac{\\pi}{2}),\\\\s_4(t)&=-2\\sqrt2\\cos(2000\\pi t)=2\\sqrt2\\cos(2000\\pi t+\\pi),\\\\s_5(t)&=2\\sqrt2\\sin(2000\\pi t)=2\\sqrt2\\cos(2000\\pi t+\\tfrac{3\\pi}{2}).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> The centre is $2$ from each outer point. Neighbouring outer points are $2\\sqrt2$ apart. So $d_{\\min}=2$ and $d_{\\min}^{2}=4=1.25E_{s,\\text{avg}}$. '
     +'The centre has four neighbours and each outer point one: $N_{\\min}=(4+4)/5=1.6$. Then'
     +'$$\\begin{aligned}P_e&\\approx1.6\\,Q\\Big(\\sqrt{\\frac{1.25E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=1.6\\,Q\\Big(\\sqrt{0.625\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$'
     +'At $14.4$ the argument is $\\sqrt{9}=3.00$, so $P_e\\approx1.6(0.001350)=2.16\\times10^{-3}$.<br>'
     +'<b>Check.</b> Integrate $s_2$ directly: $\\int_0^1 8\\cos^{2}(2000\\pi t)\\,dt=4\\big[t+\\frac{\\sin(4000\\pi t)}{4000\\pi}\\big]_0^1=4$. This equals $2^{2}$, the squared distance of $\\mathbf{s}_2$ from the origin.',
  err:'Placing the outer points on the square\'s edge at $\\psi_1=1$. The edge is halfway between two points, not at a point. The point lies twice as far out.',
  teach:'A reversed question: the regions are given and the signals are asked for. The mirror-image rule is the whole method.',
  figSol:()=>cfig([[0,0],[2,0],[0,2],[-2,0],[0,-2]], {dTex:'2', tick:1, margin:1.6}) },

{ id:'D5-24', module:'M5', type:'design', src:'Final Q3 (variant)',
  stem:'Four equally probable waveforms $s_k(t)=c_k\\sqrt2\\cos(2000\\pi t)$, $0\\le t\\le1$, with $c_1<c_2<c_3<c_4$, are detected optimally after a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. '
      +'The figure shows the decision thresholds on the axis $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$. The smallest coefficient is $c_1=-2$.',
  figure:()=>cfig([[-2,0],[0,0],[2,0],[6,0]], {oneD:true, hide:true, xticks:[-1,1,4], margin:2.2,
    regionNames:['D_1','D_2','D_3','D_4'], regionAt:[[-2.2,0],[0,0],[2.5,0],[6,0]]}),
  parts:['[8 pts] Find $c_2$, $c_3$ and $c_4$ from the thresholds.',
         '[7 pts] Find $E_{s,\\text{avg}}$ and write the four waveforms.',
         '[6 pts] Determine the nearest-neighbour approximation of the average symbol error probability as a function of $E_{s,\\text{avg}}/N_0$.',
         '[4 pts] Give the four-point set with the same $d_{\\min}$ and the least $E_{s,\\text{avg}}$. Find its saving in decibels.'],
  sol:'<b>Given.</b> Thresholds at $-1$, $1$ and $4$ on the $\\psi_1$ axis, and $c_1=-2$.<br>'
     +'<b>Find.</b> $c_2,c_3,c_4$, the waveforms and $E_{s,\\text{avg}}$, $P_e$, and the best set with the same $d_{\\min}$.<br>'
     +'<b>Method.</b> The coordinate of $s_k$ on $\\psi_1$ is $c_k$. An optimal threshold between equally likely neighbours is their midpoint, so $c_{k+1}=2\\lambda_k-c_k$.<br>'
     +'<b>Solution — (a).</b> Apply the midpoint rule one threshold at a time:'
     +'$$\\begin{aligned}c_2&=2(-1)-(-2)=0,\\\\c_3&=2(1)-0=2,\\\\c_4&=2(4)-2=6.\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> The waveforms are $s_1(t)=-2\\sqrt2\\cos(2000\\pi t)$, $s_2(t)=0$, $s_3(t)=2\\sqrt2\\cos(2000\\pi t)$ and $s_4(t)=6\\sqrt2\\cos(2000\\pi t)$. The energy of $s_k$ is $c_k^{2}$:'
     +'$$E_{s,\\text{avg}}=\\frac{4+0+4+36}{4}=11.$$<br>'
     +'<b>Solution — (c).</b> The gaps are $2$, $2$ and $4$. So $d_{\\min}=2$ and $d_{\\min}^{2}=4=\\frac{4}{11}E_{s,\\text{avg}}$. The neighbour counts are $1,2,1,0$, so $N_{\\min}=1$:'
     +'$$\\begin{aligned}P_e&\\approx Q\\Big(\\sqrt{\\frac{4E_{s,\\text{avg}}/11}{2N_0}}\\Big)\\\\&=Q\\Big(\\sqrt{\\frac{2E_{s,\\text{avg}}}{11N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> The least energy for spacing $2$ is the centred set $\\{-3,-1,1,3\\}$, with $E_{s,\\text{avg}}=(9+1+1+9)/4=5$. The saving is $10\\log_{10}(11/5)=3.42$ dB. Its $N_{\\min}$ rises to $1.5$, a much smaller effect.<br>'
     +'<b>Check.</b> The midpoints of $-2,0,2,6$ are $-1$, $1$ and $4$. These are the thresholds in the figure.',
  err:'Putting each point in the middle of its region. The end regions are unbounded, and the inner regions need not be centred on their points when the gaps differ.',
  teach:'A reversed one-dimensional question. The widened last gap costs energy and buys nothing.',
  figSol:()=>cfig([[-2,0],[0,0],[2,0],[6,0]], {oneD:true, dTex:'2', xticks:[-2,-1,1,2,4,6], margin:2.2}) },

{ id:'D5-25', module:'M5', type:'pam', src:'Final Q3 (variant)',
  stem:OPEN+'$$s_k(t)=c_k\\sqrt2\\cos(2000\\pi t),\\quad c_k\\in\\{-2,\\,0,\\,1,\\,3\\},\\quad0\\le t\\le1.$$'+AWGN,
  parts:[PDRAW(8), PNN(7),
         '[5 pts] Evaluate the approximation of part (b) at $E_{s,\\text{avg}}/N_0=28$.',
         '[5 pts] Find the exact symbol error probability at the same value from the thresholds, and compare.'],
  sol:'<b>Given.</b> Four equally likely coefficients $-2,0,1,3$ on the unit-energy carrier $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$.<br>'
     +'<b>Find.</b> The constellation and thresholds, $P_e$ against $E_{s,\\text{avg}}/N_0$, its value at $28$, and the exact value.<br>'
     +'<b>Method.</b> The points are the coefficients themselves. The noise on $\\psi_1$ is Gaussian with variance $\\sigma^{2}=N_0/2$, so each conditional error is a sum of $Q$ terms.<br>'
     +'<b>Solution — (a).</b> The points are $-2,0,1,3$ on the $\\psi_1$ axis. The thresholds are the midpoints $-1$, $0.5$ and $2$.<br>'
     +'<b>Solution — (b).</b> The energy is $E_{s,\\text{avg}}=(4+0+1+9)/4=3.5$. The gaps are $2$, $1$ and $2$, so $d_{\\min}=1$ and $d_{\\min}^{2}=1=\\frac27E_{s,\\text{avg}}$. '
     +'Only $s_2$ and $s_3$ have a neighbour at $d_{\\min}$: $N_{\\min}=(0+1+1+0)/4=0.5$. Then'
     +'$$\\begin{aligned}P_e&\\approx0.5\\,Q\\Big(\\sqrt{\\frac{2E_{s,\\text{avg}}/7}{2N_0}}\\Big)\\\\&=0.5\\,Q\\Big(\\sqrt{\\frac{E_{s,\\text{avg}}}{7N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> At $28$ the argument is $\\sqrt4=2.00$. So $P_e\\approx0.5(0.02275)=1.14\\times10^{-2}$.<br>'
     +'<b>Solution — (d).</b> Here $N_0=3.5/28=0.125$, so $\\sigma=\\sqrt{0.0625}=0.25$. Each symbol errs when the noise crosses a threshold on either side:'
     +'$$\\begin{aligned}P(e|s_1)&=Q(1/\\sigma)=Q(4),\\\\P(e|s_2)&=Q(1/\\sigma)+Q(0.5/\\sigma)=Q(4)+Q(2),\\\\P(e|s_3)&=Q(0.5/\\sigma)+Q(1/\\sigma)=Q(2)+Q(4),\\\\P(e|s_4)&=Q(1/\\sigma)=Q(4).\\end{aligned}$$'
     +'Average the four:'
     +'$$\\begin{aligned}P_e&=\\tfrac14\\big[2Q(2)+4Q(4)\\big]\\\\&=0.5(0.02275)+3.167\\times10^{-5}\\\\&=1.141\\times10^{-2}.\\end{aligned}$$'
     +'The approximation is low by only $0.3\\%$. The pairs at distance $2$ add the $Q(4)$ term, which is tiny.<br>'
     +'<b>Check.</b> The exact result equals the nearest-neighbour term plus one second-distance term, $1\\cdot Q\\big(\\sqrt{4E_{s,\\text{avg}}/(7N_0)}\\big)=Q(4)$. Adding $0.011375$ and $0.0000317$ gives $0.011407$.',
  err:'Giving every inner point two neighbours out of habit. Here $s_2$ is $2$ from $s_1$ but only $1$ from $s_3$, so it has one neighbour at $d_{\\min}$.',
  teach:'Neighbour counts that differ point by point, and a one-dimensional set where the exact answer is easy. Compare with D5-22, where the approximation fails.',
  figSol:()=>cfig([[-2,0],[0,0],[1,0],[3,0]], {oneD:true, dTex:'1', xticks:[-2,-1,0.5,1,2,3], margin:1.6}) },

{ id:'D5-26', module:'M5', type:'design', src:'Final Q3 (variant)',
  stem:'Two sets of sixteen equally probable waveforms are proposed, both on $0\\le t\\le1$: $$\\text{A:}\\ s_k(t)=2\\sqrt5\\cos\\!\\Big(2000\\pi t+\\frac{k\\pi}{8}\\Big),\\ k\\in\\{1,\\ldots,16\\},$$ $$\\text{B:}\\ s_{mn}(t)=\\sqrt2\\big[(2m-5)\\cos(2000\\pi t)-(2n-5)\\sin(2000\\pi t)\\big],\\ m,n\\in\\{1,2,3,4\\}.$$'+AWGN,
  parts:['[8 pts] Show that the two sets have the same $E_{s,\\text{avg}}$, and draw both constellations with their optimal decision regions.',
         '[9 pts] Determine the nearest-neighbour approximation of the average symbol error probability of each set as a function of $E_{s,\\text{avg}}/N_0$.',
         '[8 pts] Which set is better at equal $E_{s,\\text{avg}}$, and by how many decibels? Evaluate both approximations at $E_{s,\\text{avg}}/N_0=45$.'],
  sol:'<b>Given.</b> Set A: sixteen phases of one amplitude $2\\sqrt5$. Set B: a $4\\times4$ grid with coefficients in $\\{-3,-1,1,3\\}$.<br>'
     +'<b>Find.</b> Both energies and constellations, both approximations, and the difference in decibels.<br>'
     +'<b>Method.</b> Use $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$ for both. Then compare $d_{\\min}^{2}/E_{s,\\text{avg}}$.<br>'
     +'<b>Solution — (a).</b> Set A lies on a circle of radius $2\\sqrt5/\\sqrt2=\\sqrt{10}$, so $E_{s,\\text{avg}}=10$. Its regions are sixteen wedges of $22.5^{\\circ}$. '
     +'Set B has $\\mathbf{s}_{mn}=(2m-5,\\,2n-5)$ with average $5$ per axis, so $E_{s,\\text{avg}}=10$ as well. Its regions are the squares and strips of the grid lines $0,\\pm2$.<br>'
     +'<b>Solution — (b).</b> For set A the chord is'
     +'$$\\begin{aligned}d_{\\min}^{2}&=4E_{s,\\text{avg}}\\sin^{2}\\frac{\\pi}{16}\\\\&=4(0.03806)E_{s,\\text{avg}}\\\\&=0.1522\\,E_{s,\\text{avg}},\\end{aligned}$$'
     +'with $N_{\\min}=2$. For set B, $d_{\\min}=2$, so $d_{\\min}^{2}=4=0.4E_{s,\\text{avg}}$, with $N_{\\min}=3$. So'
     +'$$\\begin{aligned}P_e^{A}&\\approx2\\,Q\\Big(\\sqrt{0.07612\\frac{E_{s,\\text{avg}}}{N_0}}\\Big),\\\\P_e^{B}&\\approx3\\,Q\\Big(\\sqrt{0.2\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> Set B is better by'
     +'$$10\\log_{10}\\frac{0.4}{0.1522}=4.20\\ \\text{dB}.$$'
     +'At $45$, set A has the argument $\\sqrt{0.07612\\times45}=\\sqrt{3.425}=1.851$, so $P_e^{A}\\approx2Q(1.85)=2(0.03216)=6.43\\times10^{-2}$. '
     +'Set B has $\\sqrt{0.2\\times45}=3.00$, so $P_e^{B}\\approx3(0.001350)=4.05\\times10^{-3}$.<br>'
     +'<b>Check.</b> For set A, $d_{\\min}=2\\sqrt{10}\\sin11.25^{\\circ}=6.325(0.1951)=1.234$, and $1.234^{2}=1.522$. This is $0.1522\\times10$.',
  err:'Comparing the $Q$ arguments in decibels with $10\\log_{10}$ of their ratio. The arguments are square roots, so the energy ratio is the ratio of $d_{\\min}^{2}$ values.',
  teach:'The comparison the module makes between PSK and QAM, worked with two examination-style sets. The ring wastes the inside of the circle.',
  figSol:()=>pair(cfig(onCircle(Math.sqrt(10), range(1,16).map(k=>k*Math.PI/8)), {dTex:false, tick:1, margin:2.3, title:'\\text{A:}\\ d_{\\min}=1.234'}),
                  cfig(grid([-3,-1,1,3],[3,1,-1,-3]), {names:gridNames(4,4), dTex:'2', tick:1, margin:1.5, title:'\\text{B}'})) },

{ id:'D5-27', module:'M5', type:'fsk', src:'Final Q3 (variant)',
  stem:'Consider a binary modulation scheme where the equally probable symbols have the following waveforms: $$s_1(t)=2\\cos(2000\\pi t),\\qquad s_2(t)=2\\cos\\big(2\\pi(1000.75)t\\big),\\qquad0\\le t\\le1.$$'+AWGN,
  parts:['[8 pts] Find the energies and the correlation coefficient $\\rho=\\langle s_1,s_2\\rangle/E$. Neglect terms at the double frequency.',
         '[8 pts] Use Gram–Schmidt to find the signal points, and draw the constellation with its optimal decision boundary.',
         '[9 pts] Find the error probability as a function of $E_{s,\\text{avg}}/N_0$. Compare it with the orthogonal choice $f_2=1000.5$ Hz at $E_{s,\\text{avg}}/N_0=7.5$.'],
  sol:'<b>Given.</b> Two cosines of amplitude $2$ on $0\\le t\\le1$, at $1000$ Hz and $1000.75$ Hz.<br>'
     +'<b>Find.</b> $E$, $\\rho$, the two points, the boundary, and $P_e$ against the orthogonal choice.<br>'
     +'<b>Method.</b> A frequency gap of $0.75$ Hz is not a multiple of $1/(2T)=0.5$ Hz, so the two waveforms are not orthogonal. The distance is $d^{2}=2E(1-\\rho)$.<br>'
     +'<b>Solution — (a).</b> The energy of $s_1$ is $\\int_0^1 4\\cos^{2}(2000\\pi t)\\,dt=2\\big[t+\\frac{\\sin(4000\\pi t)}{4000\\pi}\\big]_0^1=2$. The same step gives $2$ for $s_2$, since $\\sin(4003\\pi)=0$. Now the inner product:'
     +'$$\\begin{aligned}\\langle s_1,s_2\\rangle&=\\int_0^1 4\\cos(2000\\pi t)\\cos(2001.5\\pi t)\\,dt\\\\&\\approx2\\int_0^1\\cos(1.5\\pi t)\\,dt\\\\&=2\\Big[\\frac{\\sin(1.5\\pi t)}{1.5\\pi}\\Big]_0^1\\\\&=2\\cdot\\frac{-1}{1.5\\pi}=-0.4244.\\end{aligned}$$'
     +'So $\\rho=-0.4244/2=-0.2122$.<br>'
     +'<b>Solution — (b).</b> Take $\\psi_1=s_1/\\sqrt2$, so $\\mathbf{s}_1=(\\sqrt2,0)=(1.414,0)$. The projection of $s_2$ on $\\psi_1$ is $\\rho\\sqrt E=-0.3001$. The rest lies on $\\psi_2$:'
     +'$$\\sqrt E\\sqrt{1-\\rho^{2}}=1.414\\sqrt{1-0.04503}=1.382.$$'
     +'So $\\mathbf{s}_2=(-0.300,\\,1.382)$. The angle between the points is $\\arccos(-0.2122)=102.3^{\\circ}$. The boundary is their perpendicular bisector, a line through the origin.<br>'
     +'<b>Solution — (c).</b> The distance is'
     +'$$\\begin{aligned}d^{2}&=2E(1-\\rho)\\\\&=2(2)(1.2122)=4.849,\\end{aligned}$$'
     +'so $d=2.202$. With two points, $P_e=Q\\big(\\sqrt{d^{2}/2N_0}\\big)=Q\\big(\\sqrt{1.2122E_{s,\\text{avg}}/N_0}\\big)$. '
     +'At $7.5$ the argument is $\\sqrt{9.092}=3.015$, and $Q(3.02)=1.26\\times10^{-3}$. The orthogonal choice has $\\rho=0$ and $Q(\\sqrt{7.5})=Q(2.74)=3.07\\times10^{-3}$. '
     +'The negative correlation gains $10\\log_{10}1.2122=0.84$ dB.<br>'
     +'<b>Check.</b> The coordinates give $d^{2}=(1.414+0.300)^{2}+1.382^{2}=2.938+1.910=4.848$. This agrees with $2E(1-\\rho)$.',
  err:'Assuming any two frequencies give orthogonal waveforms. The correlation is zero only when the gap is a multiple of $1/(2T)$. Here it is negative, which helps.',
  teach:'A frequency pair that is not orthogonal, worked through Gram–Schmidt. The negative correlation beats the orthogonal spacing, which surprises most students.',
  figSol:()=>cfig([[R2,0],[R2*(-2/(3*Math.PI)), R2*Math.sqrt(1-(2/(3*Math.PI))**2)]], {dTex:'2.202', tick:0.5, margin:1.1}) },

{ id:'D5-28', module:'M5', type:'design', src:'Final Q3 (variant)',
  stem:'Eight equally probable waveforms are formed from two rings on $0\\le t\\le1$: $$s_k(t)=\\begin{cases}\\sqrt2\\cos\\!\\big(2000\\pi t+(k-1)\\frac{\\pi}{2}\\big),&k\\in\\{1,2,3,4\\},\\\\R\\sqrt2\\cos\\!\\big(2000\\pi t+(k-5)\\frac{\\pi}{2}\\big),&k\\in\\{5,6,7,8\\},\\end{cases}$$ with $R>1$.'+AWGN,
  parts:['[7 pts] Find $d_{\\min}$ as a function of $R$.',
         '[8 pts] Find the $R$ that maximises $d_{\\min}^{2}/E_{s,\\text{avg}}$, and that maximum.',
         '[6 pts] For this $R$, draw the constellation and regions, and determine the nearest-neighbour approximation as a function of $E_{s,\\text{avg}}/N_0$.',
         '[4 pts] Compare the result with $8$-PSK.'],
  sol:'<b>Given.</b> An inner ring of radius $1$ and an outer ring of radius $R$, at the same four phases.<br>'
     +'<b>Find.</b> $d_{\\min}(R)$, the best $R$, the approximation at that $R$, and the comparison with $8$-PSK.<br>'
     +'<b>Method.</b> With $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$, the rings have radii $1$ and $R$. List every kind of distance, then maximise the ratio.<br>'
     +'<b>Solution — (a).</b> There are four kinds of pair:'
     +'$$\\begin{aligned}\\text{inner, }90^{\\circ}:&\\ \\sqrt2,\\\\\\text{same ray}:&\\ R-1,\\\\\\text{inner-outer, }90^{\\circ}:&\\ \\sqrt{1+R^{2}},\\\\\\text{outer, }90^{\\circ}:&\\ R\\sqrt2.\\end{aligned}$$'
     +'For $R>1$, $\\sqrt{1+R^{2}}>R-1$ and $R\\sqrt2>\\sqrt2$. So $d_{\\min}=\\min(R-1,\\sqrt2)$.<br>'
     +'<b>Solution — (b).</b> The energy is $E_{s,\\text{avg}}=(4+4R^{2})/8=(1+R^{2})/2$. For $R\\le1+\\sqrt2$ the ratio is $g(R)=2(R-1)^{2}/(1+R^{2})$. Differentiate:'
     +'$$\\begin{aligned}g\'(R)&=\\frac{4(R-1)(1+R^{2})-4R(R-1)^{2}}{(1+R^{2})^{2}}\\\\&=\\frac{4(R-1)(1+R)}{(1+R^{2})^{2}}>0.\\end{aligned}$$'
     +'So $g$ rises up to $R=1+\\sqrt2$. Beyond it $d_{\\min}=\\sqrt2$ is fixed while the energy grows, so the ratio falls. The best ring ratio is $R=1+\\sqrt2=2.414$. There $E_{s,\\text{avg}}=2+\\sqrt2=3.414$ and'
     +'$$\\frac{d_{\\min}^{2}}{E_{s,\\text{avg}}}=\\frac{2}{2+\\sqrt2}=2-\\sqrt2=0.5858.$$<br>'
     +'<b>Solution — (c).</b> At this $R$ an inner point has two inner neighbours and one outer neighbour at $\\sqrt2$. An outer point has one. So $N_{\\min}=(4\\cdot3+4\\cdot1)/8=2$, and'
     +'$$P_e\\approx2\\,Q\\Big(\\sqrt{0.2929\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).$$'
     +'The diagonals split the plane into four wedges, and the bisector at radius $(1+R)/2=1.707$ separates inner from outer in each.<br>'
     +'<b>Solution — (d).</b> $8$-PSK has $d_{\\min}^{2}=4\\sin^{2}(\\pi/8)E_{s,\\text{avg}}=(2-\\sqrt2)E_{s,\\text{avg}}$ and $N_{\\min}=2$. The two approximations are identical.<br>'
     +'<b>Check.</b> Evaluate $g$ on both sides: $g(2)=2(1)/5=0.40$ and $g(2.414)=0.5858$. For $R=3$, $d_{\\min}=\\sqrt2$ and $g=2/5=0.40$. The value at $1+\\sqrt2$ is the largest.',
  err:'Maximising $d_{\\min}$ alone. Pushing the outer ring out always helps $d_{\\min}$ up to $\\sqrt2$, but the energy grows too. The ratio is what matters.',
  teach:'A design question with a derivative. The optimum ties exactly with $8$-PSK, a result worth checking on the board.',
  figSol:()=>{ const R = 1+R2; return cfig(onCircle(1,[0,Math.PI/2,Math.PI,3*Math.PI/2]).concat(onCircle(R,[0,Math.PI/2,Math.PI,3*Math.PI/2])), {dTex:'\\sqrt{2}', tick:1, margin:1.3}); } },

{ id:'D5-29', module:'M5', type:'design', src:'Final Q3 (variant)',
  stem:'A set of $M$ equally probable waveforms $s(t)=a\\sqrt2\\cos(2000\\pi t)-b\\sqrt2\\sin(2000\\pi t)$, $0\\le t\\le1$, is transmitted over a standard AWGN channel with $\\mathcal{N}(0,N_0/2)$. '
      +'The points $(a,b)$ form a square grid centred on the origin. The nearest-neighbour approximation of the set is $$P_e\\approx3\\,Q\\Big(\\sqrt{\\frac{E_{s,\\text{avg}}}{5N_0}}\\Big),$$ and $E_{s,\\text{avg}}=2.5$.',
  parts:['[8 pts] Find $M$ and $d_{\\min}$.',
         '[7 pts] Give the values that $a$ and $b$ take, and confirm $N_{\\min}=3$.',
         PDRAW(6),
         '[4 pts] Find the bits per symbol and $E_b$, and write the approximation as a function of $E_b/N_0$.'],
  sol:'<b>Given.</b> A centred square grid, $P_e\\approx3Q\\big(\\sqrt{E_{s,\\text{avg}}/5N_0}\\big)$, and $E_{s,\\text{avg}}=2.5$.<br>'
     +'<b>Find.</b> $M$, $d_{\\min}$, the coefficient values, the constellation, and the per-bit form.<br>'
     +'<b>Method.</b> For an $M$-point square grid, $d_{\\min}^{2}=6E_{s,\\text{avg}}/(M-1)$. Match the $Q$ argument to $\\sqrt{d_{\\min}^{2}/2N_0}$.<br>'
     +'<b>Solution — (a).</b> Set the two arguments equal:'
     +'$$\\begin{aligned}\\frac{6E_{s,\\text{avg}}}{2(M-1)N_0}&=\\frac{E_{s,\\text{avg}}}{5N_0},\\\\\\frac{3}{M-1}&=\\frac15,\\\\M&=16.\\end{aligned}$$'
     +'Then $d_{\\min}^{2}=6(2.5)/15=1$, so $d_{\\min}=1$.<br>'
     +'<b>Solution — (b).</b> Sixteen points make four levels per axis, spaced $1$ apart and centred: $a,b\\in\\{-1.5,-0.5,0.5,1.5\\}$. '
     +'Four corners have two neighbours, eight edge points three and four inner points four. So $N_{\\min}=(8+24+16)/16=3$, as given.<br>'
     +'<b>Solution — (c).</b> The boundaries are the lines $\\psi_1=0,\\pm1$ and $\\psi_2=0,\\pm1$ with $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$. The inner regions are unit squares.<br>'
     +'<b>Solution — (d).</b> One symbol carries $\\log_2 16=4$ bits, so $E_b=2.5/4=0.625$. With $E_{s,\\text{avg}}=4E_b$, $P_e\\approx3Q\\big(\\sqrt{4E_b/5N_0}\\big)$.<br>'
     +'<b>Check.</b> Average the squared levels on one axis: $(2.25+0.25+0.25+2.25)/4=1.25$. Two axes give $2.5$, the stated $E_{s,\\text{avg}}$.',
  err:'Matching only the factor $3$ and guessing QAM from it. The ratio $d_{\\min}^{2}/E_{s,\\text{avg}}=0.4$ fixes $M$. The factor $3$ then confirms it.',
  teach:'A reversed question from the error expression back to the set. It forces the student to read a formula as geometry.',
  figSol:()=>cfig(grid([-1.5,-0.5,0.5,1.5],[1.5,0.5,-0.5,-1.5]), {names:gridNames(4,4), dTex:'1', tick:0.5, margin:0.8}) },

{ id:'D5-30', module:'M5', type:'qam', src:'Final Q3 (variant)',
  stem:OPEN+'$$\\begin{aligned}s_0(t)&=0,\\\\s_k(t)&=3\\cos\\!\\Big(3000\\pi t+\\frac{k\\pi}{4}\\Big),\\quad k\\in\\{1,\\ldots,8\\},\\end{aligned}$$ all on $0\\le t\\le2$.'+AWGN,
  parts:[PDRAW(8), PNN(9),
         '[8 pts] Compare this set with $8$-PSK at the same $E_{s,\\text{avg}}$, both in decibels and in bits per symbol.'],
  sol:'<b>Given.</b> The zero signal and eight waveforms of amplitude $3$ at $1500$ Hz, $45^{\\circ}$ apart, on $0\\le t\\le2$.<br>'
     +'<b>Find.</b> The constellation and regions, $P_e$ against $E_{s,\\text{avg}}/N_0$, and the comparison with $8$-PSK.<br>'
     +'<b>Method.</b> With $T=2$ the orthonormal pair is $\\psi_1(t)=\\cos(3000\\pi t)$ and $\\psi_2(t)=-\\sin(3000\\pi t)$. The radius is $3\\sqrt{T/2}=3$.<br>'
     +'<b>Solution — (a).</b> $\\mathbf{s}_0$ is the origin and $\\mathbf{s}_1,\\ldots,\\mathbf{s}_8$ lie on a circle of radius $3$ at $45^{\\circ},90^{\\circ},\\ldots,360^{\\circ}$. '
     +'The bisectors between the centre and the ring form a regular octagon at distance $1.5$ from the origin, which is $D_0$. The ring regions are wedges outside it, split by the rays at $22.5^{\\circ},67.5^{\\circ},\\ldots$.<br>'
     +'<b>Solution — (b).</b> Average the energies:'
     +'$$E_{s,\\text{avg}}=\\frac{0+8(9)}{9}=8.$$'
     +'Ring neighbours are $2(3)\\sin(\\pi/8)=2.296$ apart, and the centre is $3$ from each. So $d_{\\min}=2.296$ and'
     +'$$\\begin{aligned}d_{\\min}^{2}&=36\\sin^{2}\\frac{\\pi}{8}=5.272\\\\&=0.6590\\,E_{s,\\text{avg}}.\\end{aligned}$$'
     +'Each ring point has two neighbours and the centre none: $N_{\\min}=16/9=1.778$. Then'
     +'$$\\begin{aligned}P_e&\\approx\\frac{16}{9}\\,Q\\Big(\\sqrt{\\frac{0.6590E_{s,\\text{avg}}}{2N_0}}\\Big)\\\\&=\\frac{16}{9}\\,Q\\Big(\\sqrt{0.3295\\frac{E_{s,\\text{avg}}}{N_0}}\\Big).\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> $8$-PSK of the same energy has $d_{\\min}^{2}=0.5858E_{s,\\text{avg}}$. The ratio is $0.6590/0.5858=9/8$, so the nine-point set is better by'
     +'$$10\\log_{10}\\frac98=0.51\\ \\text{dB}.$$'
     +'It also carries $\\log_2 9=3.170$ bits instead of $3$. The zero signal lowers the average energy without reducing $d_{\\min}$.<br>'
     +'<b>Check.</b> The cosine rule gives $d_{\\min}^{2}=9+9-18\\cos45^{\\circ}=18-12.73=5.272$. This matches the chord value.',
  err:'Counting the centre as a nearest neighbour of every ring point. It is $3$ away, more than $d_{\\min}=2.296$, so it enters only the second-order terms.',
  teach:'Adding a zero signal to $8$-PSK helps at equal average energy. It is a counter-intuitive result that follows from the definitions.',
  figSol:()=>cfig([[0,0]].concat(onCircle(3, range(1,8).map(k=>k*Math.PI/4))), {names:range(0,8).map(k=>'s_{'+k+'}'), dTex:'2.296', tick:1, margin:1.5}) }

]);

/* ======================================================================
   The scene that carries them.
   ====================================================================== */
window.DRILL_M5 = [

{ id:'m5-drill', module:'M5', nav:'Module 5 · practice questions',
  title:'Module 5 — practice questions',
  objective:'Thirty examination questions on signal sets, decision regions, the nearest-neighbour approximation, bit error, bandwidth and carrier phase, with worked solutions.',
  keywords:'practice questions module 5 constellation decision regions nearest neighbour approximation psk pam qam fsk average symbol energy gray labels bit error bandwidth roll-off tone spacing noncoherent phase error',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 5 · Practice D5-01 … D5-30'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question before opening its solution. Expand every waveform on the two carrier functions first. Draw the perpendicular bisectors of close pairs. Count neighbours point by point, so $N_{\\min}$ may be a fraction. Write $d_{\\min}^{2}$ as a multiple of $E_{s,\\text{avg}}$ before using $Q$.'},
  {t:'rule', short:true},
  {t:'drill', module:'M5'}
]}

];
})();
