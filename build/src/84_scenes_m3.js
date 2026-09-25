/* ==========================================================================
   Module 3 — Geometric representation of signal waveforms.

   A set of waveforms is written as a set of points. The module builds the
   translation in three steps: an orthonormal basis turns a waveform into a
   list of numbers (3.1), the points of a whole signal set form its
   constellation (3.2), and the Gram–Schmidt procedure finds the basis for any
   set (3.3).

   Every teaching scene is a slide in the reference design (DESIGN.md), as in
   Modules 1 and 2: one figure on the left, two to four cards on the right, a
   prediction card on each slide, and each section closing on a gallery, a
   laboratory and a code page.

   Colour, as everywhere in this course: cyan is a transmitted waveform or its
   signal point, amber a basis function (the axis a correlator is matched to),
   violet an intermediate quantity (a coordinate, a projection, the remainder
   Gram–Schmidt leaves, a product being integrated), green a received
   waveform or point, red an error. Noise takes no colour of its own.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* The canvas of a slide figure and of a gallery figure, as in Modules 1 and 2. */
const SZ  = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const EXO = o => Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3}, o);
const clamp01 = x => Math.max(0, Math.min(1, x));
const frameOf = (v, last) => v && v.frame!=null ? v.frame : last;
const f2 = v => v.toFixed(2);
/* a coordinate for a figure label: two decimals, and never "-0.00" */
const num = (v, d=2) => { const s = v.toFixed(d); return /^-0\.0*$/.test(s) ? s.slice(1) : s; };

/* One panel placed inside a larger figure, for the stacked figures; each
   nested panel keeps its own axes, and textclash.js measures it on its own. */
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };
const row = (h, parts) => { let x = 0, s = '';
  parts.forEach(([svg, w]) => { s += place(svg, x, 0, w, h); x += w; });
  return `<svg viewBox="0 0 ${x} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };

/* A piecewise-constant waveform, given as [start, end, value] pieces. */
const pwc = segs => t => { for(const s of segs) if(t>=s[0] && t<s[1]) return s[2]; return 0; };
/* Its outline with the vertical edges drawn, for poly(). */
function outline(segs, lo, hi){
  const pts = [[lo,0]]; let x = lo, y = 0;
  segs.forEach(([a,b,v])=>{
    if(a > x + 1e-12){ if(y!==0) pts.push([x,0]); pts.push([a,0]); }
    pts.push([a,v],[b,v]); x = b; y = v; });
  pts.push([x,0],[hi,0]);
  return pts;
}

/* Drawing helpers in data coordinates. PLOT's own poly() and point() take no
   opacity, and a figure played in frames fades its parts in, so these write
   the markup themselves. */
function arrow(a, x0,y0,x1,y1, o={}){
  const X0=a.sx(x0), Y0=a.sy(y0), X1=a.sx(x1), Y1=a.sy(y1), L=Math.hypot(X1-X0,Y1-Y0);
  if(L < 3) return;
  const ux=(X1-X0)/L, uy=(Y1-Y0)/L, hd=12*(o.head||1), col=o.color||C.in;
  const op = o.opacity!=null ? ` opacity="${o.opacity.toFixed(3)}"` : '';
  a.raw(`<line x1="${f2(X0)}" y1="${f2(Y0)}" x2="${f2(X1-hd*0.8*ux)}" y2="${f2(Y1-hd*0.8*uy)}" stroke="${col}" stroke-width="${o.width||2.6}" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}${op}/>`
    + `<path d="M${f2(X1)},${f2(Y1)} L${f2(X1-hd*ux-hd*0.42*uy)},${f2(Y1-hd*uy+hd*0.42*ux)} L${f2(X1-hd*ux+hd*0.42*uy)},${f2(Y1-hd*uy-hd*0.42*ux)} Z" fill="${col}"${op}/>`);
}
function seg(a, pts, o={}){
  if(pts.length < 2) return;
  const d = 'M'+pts.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L');
  a.raw(`<path d="${d}" fill="none" stroke="${o.color||C.muted}" stroke-width="${o.width||1.4}" stroke-linejoin="round" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function dot(a, x, y, o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||6}" fill="${o.color||C.in}" stroke="${o.ring||'#FCF9F3'}" stroke-width="${o.ringw||1.4}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
const circle = (a, r, o={}) => { const pts=[]; for(let i=0;i<=160;i++){ const u=2*Math.PI*i/160; pts.push([r*Math.cos(u), r*Math.sin(u)]); }
  seg(a, pts, Object.assign({color:C.muted, width:1.2, dash:'4 5'}, o)); };
/* A signed area under a trace, as a translucent fill of the trace's colour. */
function shade(a, f, lo, hi, col, op){
  const n = 240, pts = [];
  for(let i=0;i<=n;i++){ const t=lo+(hi-lo)*i/n; pts.push(f2(a.sx(t))+','+f2(a.sy(f(t)))); }
  a.raw(`<path d="M${f2(a.sx(lo))},${f2(a.sy(0))}L${pts.join('L')}L${f2(a.sx(hi))},${f2(a.sy(0))}Z" fill="${col}" fill-opacity="${op==null?0.22:op}" stroke="none"/>`);
}
/* Tick numbers of the time axis drawn under the lower edge of the data area.
   PLOT writes them beside the zero line, and every waveform of this module
   runs below zero or steps up exactly at a tick, so there they would be
   crossed by the trace. An axes that takes these passes xticksOverride:[]. */
function bottomTicks(a, vals, fmt){
  const L = P.labelScale(), f = fmt || (v => String(v));
  vals.forEach(v=>{ const X = f2(a.sx(v));
    a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${a.y0+5}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${X}" y="${f2(a.y0+19*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="middle">${f(v)}</text>`); });
  return a;
}
/* An Axes whose time ticks sit at the lower edge: `xt` names them. */
const TAx = o => { const xt = o.xt; const a = P.Axes(Object.assign({}, o, {xticksOverride:[]})); return xt ? bottomTicks(a, xt, o.xfmt) : a; };
/* A blank drawing canvas in data coordinates: no ticks, no grid, no axes. */
const bare = o => Object.assign({xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}, o);

/* A signal-space plane drawn to one scale on both axes, so a circle is round
   at whatever height the figure is grown to. `need` is the smallest range
   each axis must show; the other range is widened to fill the box. */
function plane(o){
  const h = P.hOverride || o.h || 380; P.hOverride = null;
  const base = Object.assign({w:560, pad:{l:56,r:26,t:24,b:42}, xlabel:'\\psi_1', ylabel:'\\psi_2'}, o, {h});
  delete base.need;
  const [nx, ny] = o.need;
  const pr = P.Axes(Object.assign({}, base, {xr:nx, yr:ny}));
  const k = Math.min((pr.x1-pr.x0)/(nx[1]-nx[0]), (pr.y0-pr.y1)/(ny[1]-ny[0]));
  const cx = (nx[0]+nx[1])/2, cy = (ny[0]+ny[1])/2;
  const hx = (pr.x1-pr.x0)/k/2, hy = (pr.y0-pr.y1)/k/2;
  return P.Axes(Object.assign({}, base, {xr:[cx-hx,cx+hx], yr:[cy-hy,cy+hy]}));
}

/* ---- the signal sets of the module ----------------------------------------
   Each is drawn from its definition, so a figure and the arithmetic beside it
   cannot drift apart. */

/* The two waveforms of the opening: neither is a multiple of the other. With
   A = 1 and T = 1 each has unit energy and they are orthogonal. */
const S0 = [[0,0.5,1],[0.5,1,-1]];
const S1 = [[0,0.25,1],[0.25,0.75,-1],[0.75,1,1]];
const s0f = pwc(S0), s1f = pwc(S1);

/* The basis of two unit pulses on [0,2] and the four signals of 3.1.7, which
   it writes as the corners of a square. */
const HALF1 = [[0,1,1]], HALF2 = [[1,2,1]];
const SQ = [ {v:[1,1],   l:'\\mathbf{s}_1'}, {v:[1,-1],  l:'\\mathbf{s}_2'},
             {v:[-1,1],  l:'\\mathbf{s}_3'}, {v:[-1,-1], l:'\\mathbf{s}_4'} ];
const halves = ([a,b]) => [[0,1,a],[1,2,b]];

/* The three pulses of the Gram–Schmidt example, 3.3.2. */
const GS3 = [ [[0,2,1]], [[2,3,1]], [[0,3,1]] ];
/* The four signals of the second example, 3.3.3: M = 4, N = 3. */
const GS4 = [ [[0,2,1]], [[0,1,1],[1,2,-1]], [[0,1,-1],[1,3,1]], [[0,3,1]] ];
const GS4V = [[Math.SQRT2,0,0],[0,Math.SQRT2,0],[0,-Math.SQRT2,1],[Math.SQRT2,0,1]];

/* A carrier with f_c T = 3 whole cycles, and the unit-energy cosine and sine
   on [0, T] with T = 1. */
const FC = 3;
const cosB = t => (t>=0 && t<=1) ? Math.SQRT2*Math.cos(2*Math.PI*FC*t) : 0;
const sinB = t => (t>=0 && t<=1) ? Math.SQRT2*Math.sin(2*Math.PI*FC*t) : 0;
/* The four waveforms of the carrier example, 3.2.4, as (psi1, psi2) coordinates. */
const QP = [ {v:[-1,1], l:'\\mathbf{s}_1'}, {v:[1,1], l:'\\mathbf{s}_2'},
             {v:[-1,-1],l:'\\mathbf{s}_3'}, {v:[1,-1],l:'\\mathbf{s}_4'} ];

/* A waveform on a small panel, for the rows and grids of stacked figures. */
function wavePanel(f, o){
  const a = P.Axes(Object.assign({w:560,h:120,xr:[-0.1,2.2],yr:[-1.6,1.6],xlabel:'t',ylabel:'s(t)',
    pad:{l:56,r:26,t:18,b:36},xtarget:5,ytarget:3}, o.ax||{}));
  (o.draw||(()=>{}))(a);
  return a.svg();
}

/* ---- the navy opening ----------------------------------------------------
   The page under these figures is navy, so the axis, the tick numbers and the
   axis names take that page's ink, and the signals the dark-page tints. */
const NAVY = {axis:'rgba(239,231,216,.34)', tick:'#9EACB9', name:'#E6E2D9'};
const T_CY = '#4FBECE', T_AM = '#E5B255', T_VI = '#AC99DC';
function figOpenWave(segs, name, dash, delay){
  const a = P.Axes({w:520,h:112,xr:[-0.05,1.1],yr:[-1.5,1.5],grid:false,
    xlabel:'t/T', ylabel:name, chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xticksOverride:[0,0.5,1], ytarget:3});
  a.curve(pwc(segs), {color:T_CY, width:2.4, n:1400, dash, anim:{delay, sweep:'#D9F3F7'}});
  return a.svg();
}
function figOpenPlane(){
  const a = P.Axes({w:520,h:196,xr:[-1.9,1.9],yr:[-0.35,1.45],grid:false,
    xlabel:'\\psi_1', ylabel:'\\psi_2', chrome:NAVY, pad:{l:46,r:30,t:22,b:34}, xticksOverride:[-1,0,1], yticksOverride:[0,1]});
  a.raw(`<line x1="${f2(a.sx(0))}" y1="${f2(a.sy(0))}" x2="${f2(a.sx(1))}" y2="${f2(a.sy(0))}" stroke="${T_AM}" stroke-width="2.4" class="mtf-trace" pathLength="1" style="--len:1;animation-delay:1.1s"/>`);
  a.raw(`<line x1="${f2(a.sx(0))}" y1="${f2(a.sy(0))}" x2="${f2(a.sx(0))}" y2="${f2(a.sy(1))}" stroke="${T_AM}" stroke-width="2.4" class="mtf-trace" pathLength="1" style="--len:1;animation-delay:1.4s"/>`);
  a.point(1, 0, {color:T_CY, r:7, ring:'#12314E'});
  a.point(0, 1, {color:T_CY, r:7, ring:'#12314E'});
  a.note(1.12, 0.14, '\\mathbf{s}_0=(1,0)', {tex:true, fs:15, color:T_CY});
  a.note(0.12, 1.08, '\\mathbf{s}_1=(0,1)', {tex:true, fs:15, color:T_CY});
  return a.svg();
}

/* ---- 3.1 signals as vectors --------------------------------------------- */

/* The two waveforms of the opening and their product. The product is +1 on
   the first and third quarters and -1 on the other two, so it integrates to
   zero: the two are orthogonal. */
function figTwoAxes(){
  P.hOverride = null;
  const pan = (segs, name, col, h, last) => { const a = TAx({w:560,h,xr:[-0.05,1.1],yr:[-1.6,1.6], ynameAtAxis:true,
      xlabel:last?'t/T':'', ylabel:name, pad:{l:56,r:26,t:24,b:last?36:12},
      xt:last?[0,0.25,0.5,0.75,1]:null, yticksOverride:[-1,0,1]});
    if(col===C.mid) shade(a, pwc(segs), 0, 1, C.mid, 0.2);
    a.poly(outline(segs,-0.05,1.1), {color:col, width:2.4});
    return a.svg(); };
  const prod = [[0,0.25,1],[0.25,0.5,-1],[0.5,0.75,1],[0.75,1,-1]];
  return stack(560, [[pan(S0,'s_0(t)',C.in,120),120],[pan(S1,'s_1(t)',C.in,120),120],
    [pan(prod,'s_0(t)\\,s_1(t)',C.mid,160,true),160]]);
}

/* A vector written against two unit axes. */
function figOrtho(){
  const a = plane({need:[[-0.35,2.0],[-0.35,1.35]], xlabel:'\\mathbf{e}_1', ylabel:'\\mathbf{e}_2',
    xticksOverride:[], yticksOverride:[]});
  seg(a, [[1.6,0],[1.6,0.9]], {dash:'4 5'}); seg(a, [[0,0.9],[1.6,0.9]], {dash:'4 5'});
  arrow(a, 0,0,1,0, {color:C.h, width:3.2}); arrow(a, 0,0,0,1, {color:C.h, width:3.2});
  arrow(a, 0,0,1.6,0.9, {color:C.in});
  a.note(1.66, 1.02, '\\mathbf{a}=(a_1,a_2)', {tex:true, fs:15, color:C.in, anchor:'middle'});
  a.note(1.6, -0.2, 'a_1', {tex:true, fs:15, color:C.muted, anchor:'middle'});
  a.note(-0.1, 0.9, 'a_2', {tex:true, fs:15, color:C.muted, anchor:'end'});
  return a.svg();
}

/* Synthesis on the basis of two unit pulses: the waveform s1*psi1 + s2*psi2
   and its point, driven by the two sliders. */
function figProject(v){
  P.hOverride = null;
  const s1 = v ? v.a : 1.5, s2 = v ? v.b : -1;
  const a = TAx({w:560,h:180,xr:[-0.1,2.25],yr:[-2.4,2.4],xlabel:'t',ylabel:'s(t)',
    pad:{l:56,r:26,t:18,b:36},xt:[0,1,2],yticksOverride:[-2,-1,0,1,2]});
  a.poly(outline(HALF1,-0.1,2.25), {color:C.h, width:1.6, dash:'6 5'});
  a.poly(outline(HALF2,-0.1,2.25), {color:C.h, width:1.6, dash:'6 5'});
  a.poly(outline(halves([s1,s2]),-0.1,2.25), {color:C.in, width:2.6});
  const b = plane({h:250, need:[[-2.3,2.3],[-2.3,2.3]], xticksOverride:[-2,-1,1,2], yticksOverride:[-2,-1,1,2]});
  seg(b, [[s1,0],[s1,s2]], {dash:'4 5'}); seg(b, [[0,s2],[s1,s2]], {dash:'4 5'});
  b.point(s1, s2, {color:C.in, r:6.5});
  b.note(b.o.xr[1]-0.15, b.o.yr[1]-0.45, '\\mathbf{s}=('+num(s1,1)+',\\,'+num(s2,1)+')', {tex:true, fs:15, color:C.in, anchor:'end'});
  return stack(560, [[a.svg(),180],[b.svg(),250]]);
}

/* The analyzer: one correlator per basis function. */
function figAnalyzer(){
  const ys = [50, 140, 262], lab = ['1','2','N'];
  const it = [
    {t:'arrow',x1:8,y1:140,x2:60,y2:140}, {t:'line',d:'M60,50 V262'},
    {t:'text',x:10,y:118,label:'s_i(t)',tex:true,fs:16,anchor:'start'},
    {t:'text',x:215,y:212,label:'\\smash{\\vdots}',tex:true,fs:16}
  ];
  ys.forEach((y,k)=>{ it.push({t:'arrow',x1:60,y1:y,x2:100,y2:y},
    {t:'box',x:100,y:y-30,w:230,h:60,label:'\\int_0^T(\\cdot)\\,\\psi_'+(k===2?'N':lab[k])+'(t)\\,dt',tex:true,fs:15},
    {t:'arrow',x1:330,y1:y,x2:410,y2:y},
    {t:'text',x:448,y:y+6,label:'s_{i'+lab[k]+'}',tex:true,fs:16}); });
  it.push({t:'line',d:'M488,50 H505 V262 H488'}, {t:'arrow',x1:505,y1:156,x2:540,y2:156},
    {t:'text',x:572,y:163,label:'\\mathbf{s}_i',tex:true,fs:17});
  return P.blocks({w:600, h:300, items:it});
}

/* x = 2 psi1 + psi2 and y = psi1 - psi2 on the unit pulses, their product and
   its area, played in three frames. */
function figInner(v){
  P.hOverride = null;
  const f = frameOf(v, 2), op = k => clamp01(f-k+1);
  const X = [[0,1,2],[1,2,1]], Y = [[0,1,1],[1,2,-1]], XY = [[0,1,2],[1,2,-1]];
  const pan = (segs, name, h, yr, last, fn) => { const a = TAx({w:560,h,xr:[-0.1,2.25],yr,
      xlabel:last?'t':'', ylabel:name, pad:{l:56,r:26,t:24,b:last?36:12},
      xt:last?[0,1,2]:null, yticksOverride:[-1,0,1,2]});
    (fn||(()=>a.poly(outline(segs,-0.1,2.25), {color:C.in, width:2.4})))(a);
    return a.svg(); };
  const p3 = pan(XY, 'x(t)\\,y(t)', 170, [-2.2,3.0], true, a=>{
    if(op(2) > 0.02) shade(a, pwc(XY), 0, 2, C.mid, 0.24*op(2));
    if(op(1) > 0.02) seg(a, outline(XY,-0.1,2.25), {color:C.mid, width:2.4, opacity:op(1)});
    if(op(2) > 0.5){ a.note(0.5, 2.35, '+2', {tex:true, fs:15, color:C.mid, anchor:'middle'});
      a.note(1.5, -1.75, '-1', {tex:true, fs:15, color:C.mid, anchor:'middle'}); } });
  return stack(560, [[pan(X,'x(t)',115,[-1.5,2.6]),115],[pan(Y,'y(t)',115,[-1.5,2.6]),115],[p3,170]]);
}

/* Two points of energy 2: s1 fixed at (1,1), s2 turned by the slider. */
function figEnergy(v){
  const th = (v ? v.th : 90)*Math.PI/180, r = Math.SQRT2;
  const p1 = [1,1], p2 = [r*Math.cos(Math.PI/4+th), r*Math.sin(Math.PI/4+th)];
  const a = plane({need:[[-1.9,1.9],[-1.9,1.9]], xticksOverride:[], yticksOverride:[]});
  circle(a, r);
  arrow(a, 0,0,p1[0],p1[1], {color:C.in, width:2.2}); arrow(a, 0,0,p2[0],p2[1], {color:C.in, width:2.2});
  seg(a, [p1,p2], {color:C.mid, width:2.6});
  a.point(p1[0],p1[1],{color:C.in,r:6.5}); a.point(p2[0],p2[1],{color:C.in,r:6.5});
  const out = (p,k) => [p[0]*(1+k/r), p[1]*(1+k/r)];
  const l1 = out(p1,0.3), l2 = out(p2,0.3);
  a.note(l1[0], l1[1]-0.08, '\\mathbf{s}_1', {tex:true, fs:15, color:C.in, anchor:'middle'});
  a.note(l2[0], l2[1]-0.08, '\\mathbf{s}_2', {tex:true, fs:15, color:C.in, anchor:'middle'});
  const m = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2], mm = Math.hypot(m[0],m[1]);
  const dd = Math.hypot(p1[0]-p2[0], p1[1]-p2[1]);
  /* the distance label sits outside the circle, beyond the middle of the chord */
  const dir = mm > 0.25 ? [m[0]/mm, m[1]/mm] : [-(p2[1]-p1[1])/dd, (p2[0]-p1[0])/dd];
  const k = mm > 0.25 ? r - mm + 0.22 : 0.3, lx = m[0]+k*dir[0], left = dir[0] < -0.3;
  if(dd > 0.35) a.note(lx+(left?-0.08:0.08), m[1]+k*dir[1]-0.06, 'd='+num(dd), {tex:true, fs:15, color:C.mid, anchor:left?'end':'start'});
  return a.svg();
}

/* The four signals of the worked example and their points, one frame each. */
function figInspect(v){
  P.hOverride = null;
  const f = frameOf(v, 4), op = k => clamp01(f-k+1);
  /* the upper row shares the time axis of the lower one, so it carries no tick row */
  const small = (k) => { const s = SQ[k].v, lo = k > 1, a = TAx({w:280,h:lo?140:110,xr:[-0.1,2.3],yr:[-1.6,1.6],
      xlabel:lo?'t':'', xnameDrop:30, ylabel:'s_'+(k+1)+'(t)', pad:{l:50,r:18,t:14,b:lo?34:10}, xt:lo?[0,1,2]:null, yticksOverride:[-1,1]});
    a.poly(outline(halves(s),-0.1,2.3), {color:C.in, width: f>=k+0.5 && f<k+1.5 ? 3.0 : 2.0});
    return a.svg(); };
  const b = plane({h:190, need:[[-1.9,1.9],[-1.6,1.6]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  SQ.forEach((p,k)=>{ const o = op(k+1); if(o < 0.02) return;
    seg(b, [[p.v[0],0],[p.v[0],p.v[1]],[0,p.v[1]]], {dash:'4 5', opacity:o});
    dot(b, p.v[0], p.v[1], {r:6.5, opacity:o});
    if(o > 0.5) b.note(p.v[0]+(p.v[0]>0?0.14:-0.14), p.v[1]+(p.v[1]>0?0.16:-0.36), p.l,
      {tex:true, fs:15, color:C.in, anchor:p.v[0]>0?'start':'end'}); });
  return stack(560, [[row(110, [[small(0),280],[small(1),280]]),110],
                     [row(140, [[small(2),280],[small(3),280]]),140],[b.svg(),190]]);
}

/* ---- 3.2 constellations -------------------------------------------------- */

/* The square of 3.1.7 as a constellation: the points, then the energy read as
   a radius, then the distance read between two points. */
function figConst(v){
  const f = frameOf(v, 2), op = k => clamp01(f-k+1);
  const a = plane({need:[[-2,2],[-1.9,1.9]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  if(op(1) > 0.02){ circle(a, Math.SQRT2, {opacity:op(1)});
    seg(a, [[0,0],[-1,1]], {color:C.mid, width:2.4, opacity:op(1)});
    if(op(1) > 0.5) a.note(-0.34, 0.1, '\\sqrt{E}=\\sqrt2', {tex:true, fs:15, color:C.mid, anchor:'end'}); }
  if(op(2) > 0.02){ seg(a, [[1,1],[1,-1]], {color:C.mid, width:2.4, opacity:op(2)});
    if(op(2) > 0.5) a.note(0.86, 0.45, 'd=2', {tex:true, fs:15, color:C.mid, anchor:'end'}); }
  SQ.forEach(p=>{ a.point(p.v[0], p.v[1], {color:C.in, r:7});
    a.note(p.v[0]+(p.v[0]>0?0.14:-0.14), p.v[1]+(p.v[1]>0?0.18:-0.38), p.l,
      {tex:true, fs:15, color:C.in, anchor:p.v[0]>0?'start':'end'}); });
  return a.svg();
}

/* Three binary sets at the same average energy E_b = 1: antipodal,
   orthogonal and on-off, the points moving from one set to the next. */
const BIN = [ [[1,0],[-1,0]], [[1,0],[0,1]], [[Math.SQRT2,0],[0,0]] ];
const BIN_D = ['d=2\\sqrt{E_b}', 'd=\\sqrt{2E_b}', 'd=\\sqrt{2E_b}'];
const BIN_L = [ [-0.5,0.12,'middle'], [0.78,0.76,'start'], [0.52,0.2,'middle'] ];
function figBinary(v){
  const f = frameOf(v, 0), i = Math.min(1, Math.floor(f)), u = clamp01(f-i);
  const lerp = (p,q) => [p[0]+(q[0]-p[0])*u, p[1]+(q[1]-p[1])*u];
  const A = lerp(BIN[i][0], BIN[i+1][0]), B = lerp(BIN[i][1], BIN[i+1][1]);
  const a = plane({need:[[-1.8,1.9],[-0.7,1.5]], xticksOverride:[], yticksOverride:[]});
  circle(a, 1);
  seg(a, [A,B], {color:C.mid, width:2.6});
  a.point(A[0],A[1],{color:C.in,r:7}); a.point(B[0],B[1],{color:C.in,r:7});
  const k = Math.round(f), near = clamp01(1 - 4*Math.abs(f-k));
  if(near > 0.5){ const [x,y,an] = BIN_L[k];
    a.note(x, y, BIN_D[k], {tex:true, fs:15, color:C.mid, anchor:an}); }
  return a.svg();
}

/* A carrier with phase theta and its point on the circle. */
function figPassband(v){
  P.hOverride = null;
  const th = (v ? v.th : 45)*Math.PI/180;
  const a = TAx({w:560,h:160,xr:[-0.03,1.08],yr:[-1.8,1.8],xlabel:'t/T',ylabel:'s(t)',
    pad:{l:56,r:26,t:18,b:36},xt:[0,0.5,1],yticksOverride:[-1,0,1]});
  a.curve(t=> t>=0 && t<=1 ? Math.SQRT2*Math.cos(2*Math.PI*FC*t - th) : 0, {color:C.in, width:2.4, n:900});
  const b = plane({h:260, need:[[-1.6,1.6],[-1.45,1.45]], xticksOverride:[], yticksOverride:[]});
  circle(b, 1);
  const x = Math.cos(th), y = Math.sin(th);
  seg(b, [[x,0],[x,y],[0,y]], {dash:'4 5'});
  arrow(b, 0,0,x,y, {color:C.in, width:2.2});
  b.point(x, y, {color:C.in, r:6.5});
  const lx = x*1.28, ly = y*1.28 - 0.08;
  b.note(lx, ly, '('+num(x)+',\\,'+num(y)+')', {tex:true, fs:15, color:C.in, anchor: x > 0.35 ? 'start' : x < -0.35 ? 'end' : 'middle'});
  return stack(560, [[a.svg(),160],[b.svg(),260]]);
}

/* The four carrier waveforms of the worked example, drawn by the reader. */
function figExQpsk(){
  const a = plane({need:[[-2,2],[-1.9,1.9]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  a.raw(`<rect class="sk-area" x="${a.x0}" y="${a.y1}" width="${a.x1-a.x0}" height="${a.y0-a.y1}" fill="none"/>`);
  a.raw('<g class="sk-key">');
  QP.forEach(p=>{ a.point(p.v[0], p.v[1], {color:C.in, r:7});
    a.note(p.v[0]+(p.v[0]>0?0.14:-0.14), p.v[1]+(p.v[1]>0?0.18:-0.38), p.l,
      {tex:true, fs:15, color:C.in, anchor:p.v[0]>0?'start':'end'}); });
  a.raw('</g>');
  return a.svg();
}

/* Two signal sets with one constellation: four pulse pairs and four carrier
   waveforms, crossfaded, over the four points they share. */
function figRemarks(v){
  P.hOverride = null;
  const f = clamp01(frameOf(v, 0));
  const pulse = ([x,y]) => pwc([[0,0.5,Math.SQRT2*x],[0.5,1,Math.SQRT2*y]]);
  const carr = ([x,y]) => t => x*cosB(t) + y*sinB(t);
  const small = (p, lo) => { const a = TAx({w:280,h:lo?140:110,xr:[-0.04,1.3],yr:[-2.4,2.4],
      xlabel:lo?'t/T':'', xnameDrop:30, ylabel:'('+p.v[0]+','+p.v[1]+')', pad:{l:50,r:18,t:14,b:lo?34:10}, xt:lo?[0,0.5,1]:null, yticksOverride:[-2,0,2]});
    if(f < 0.98) a.curve(pulse(p.v), {color:C.in, width:2.2, n:600, opacity:1-f});
    if(f > 0.02) a.curve(carr(p.v), {color:C.in, width:2.0, n:600, opacity:f});
    return a.svg(); };
  const b = plane({h:190, need:[[-1.9,1.9],[-1.6,1.6]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  SQ.forEach(p=>b.point(p.v[0], p.v[1], {color:C.in, r:7}));
  return stack(560, [[row(110, [[small(SQ[0]),280],[small(SQ[1]),280]]),110],
                     [row(140, [[small(SQ[2],true),280],[small(SQ[3],true),280]]),140],[b.svg(),190]]);
}

/* M points on the circle of radius sqrt(E), E = 1, and the nearest pair. */
function figPsk(v){
  const M = Math.pow(2, v ? v.k : 3), a = plane({need:[[-1.55,1.55],[-1.5,1.5]], xticksOverride:[], yticksOverride:[]});
  circle(a, 1);
  const d = 2*Math.sin(Math.PI/M);
  seg(a, [[1,0],[Math.cos(2*Math.PI/M), Math.sin(2*Math.PI/M)]], {color:C.mid, width:2.6});
  for(let i=0;i<M;i++) a.point(Math.cos(2*Math.PI*i/M), Math.sin(2*Math.PI*i/M), {color:C.in, r:M>8?5:6.5});
  const u = Math.PI/M, R = M===2 ? 0.26 : 1.24;
  a.note(R*Math.cos(u) + (M===2 ? 0 : 0.02), R*Math.sin(u) - (M===2 ? 0.02 : 0.04), 'd_{\\min}='+num(d, 3), {tex:true, fs:15, color:C.mid, anchor: M===2 ? 'middle' : 'start'});
  return a.svg();
}

/* ---- 3.3 the Gram–Schmidt procedure --------------------------------------- */

/* The procedure on two vectors, one move a frame. */
function figGs(v){
  const f = frameOf(v, 4), op = k => clamp01(f-k+1);
  const a = plane(bare({need:[[-0.55,2.95],[-0.45,2.2]], xlabel:'', ylabel:''}));
  arrow(a, 0,0,2.4,0, {color:C.in}); arrow(a, 0,0,1.5,1.8, {color:C.in});
  a.note(2.5, -0.04, 's_1', {tex:true, fs:16, color:C.in});
  a.note(1.58, 1.9, 's_2', {tex:true, fs:16, color:C.in});
  if(op(1) > 0.02){ arrow(a, 0,0,1,0, {color:C.h, width:4, opacity:op(1)});
    if(op(1) > 0.5) a.note(0.5, 0.16, '\\psi_1', {tex:true, fs:16, color:C.h, anchor:'middle'}); }
  if(op(2) > 0.02){ seg(a, [[1.5,1.8],[1.5,0]], {dash:'4 5', opacity:op(2)});
    seg(a, [[0,-0.1],[0,-0.16],[1.5,-0.16],[1.5,-0.1]], {color:C.mid, width:1.8, opacity:op(2)});
    if(op(2) > 0.5) a.note(0.75, -0.36, 's_{21}\\psi_1', {tex:true, fs:15, color:C.mid, anchor:'middle'}); }
  if(op(3) > 0.02){ arrow(a, 1.5,0,1.5,1.8, {color:C.mid, opacity:op(3)});
    seg(a, [[1.5,0.14],[1.64,0.14],[1.64,0]], {color:C.mid, width:1.4, opacity:op(3)});
    if(op(3) > 0.5) a.note(1.62, 0.95, 'g_2', {tex:true, fs:16, color:C.mid}); }
  if(op(4) > 0.02){ arrow(a, 0,0,0,1, {color:C.h, width:4, opacity:op(4)});
    if(op(4) > 0.5) a.note(-0.1, 0.5, '\\psi_2', {tex:true, fs:16, color:C.h, anchor:'end'}); }
  return a.svg();
}

/* The worked example of 3.3.2, one basis function a frame. */
function figExGs(v){
  P.hOverride = null;
  const f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const pan = (k, h, last) => { const a = TAx({w:560,h,xr:[-0.1,3.3],yr:[-0.3,1.45],
      xlabel:last?'t':'', ylabel:['s_1,\\;\\psi_1','s_2,\\;\\psi_2','s_3,\\;g_3'][k], pad:{l:56,r:26,t:24,b:last?36:12},
      xt:last?[0,1,2,3]:null, yticksOverride:[0,1]});
    a.poly(outline(GS3[k],-0.1,3.3), {color:C.in, width:1.8, dash:'6 5'});
    const o = op(k+1);
    if(o > 0.02){
      if(k===0) seg(a, outline([[0,2,1/Math.SQRT2]],-0.1,3.3), {color:C.h, width:2.8, opacity:o});
      if(k===1) seg(a, outline([[2,3,1]],-0.1,3.3), {color:C.h, width:2.8, opacity:o});
      if(k===2){ seg(a, [[0,0],[3,0]], {color:C.mid, width:4, opacity:o});
        if(o > 0.5) a.note(1.5, 0.42, 'g_3=0', {tex:true, fs:15, color:C.mid, anchor:'middle'}); }
    }
    return a.svg(); };
  return stack(560, [[pan(0,122),122],[pan(1,122),122],[pan(2,160,true),160]]);
}

/* Four signals in three dimensions, seen from an angle the reader turns. */
function figExGsB(v){
  const az = (v ? v.az : 30)*Math.PI/180, el = 22*Math.PI/180;
  const pr = (x,y,z) => [x*Math.cos(az) - y*Math.sin(az), z*Math.cos(el) + (x*Math.sin(az) + y*Math.cos(az))*Math.sin(el)];
  const a = plane(bare({need:[[-2.2,2.3],[-1.2,2.0]], xlabel:'', ylabel:''}));
  const ax = (p, q, name, lp) => { const P0 = pr(...p), P1 = pr(...q);
    arrow(a, P0[0],P0[1],P1[0],P1[1], {color:C.muted, width:1.6, head:0.8});
    const L = pr(...lp); a.note(L[0], L[1]-0.06, name, {tex:true, fs:16, color:C.ink, anchor:'middle'}); };
  ax([0,0,0],[2.0,0,0],'\\psi_1',[2.22,0,0]);
  ax([0,-1.9,0],[0,1.9,0],'\\psi_2',[0,2.15,0]);
  ax([0,0,0],[0,0,1.55],'\\psi_3',[0,0,1.78]);
  GS4V.forEach((s,k)=>{ const Q = pr(...s), F = pr(s[0],s[1],0);
    if(s[2]) seg(a, [F,Q], {dash:'4 5'});
    a.point(Q[0], Q[1], {color:C.in, r:6.5});
    a.note(Q[0]+0.13, Q[1]+0.2, '\\mathbf{s}_'+(k+1), {tex:true, fs:15, color:C.in}); });
  return a.svg();
}

/* The square seen against a basis turned by phi. */
function figBasisChange(v){
  const ph = (v ? v.ph : 30)*Math.PI/180, u1 = [Math.cos(ph), Math.sin(ph)], u2 = [-Math.sin(ph), Math.cos(ph)];
  const a = plane({need:[[-2.1,2.1],[-2.0,2.0]], xticksOverride:[], yticksOverride:[]});
  const L = 1.85;
  arrow(a, -L*u1[0],-L*u1[1], L*u1[0],L*u1[1], {color:C.h, width:2.2});
  arrow(a, -L*u2[0],-L*u2[1], L*u2[0],L*u2[1], {color:C.h, width:2.2});
  a.note(1.02*L*u1[0]+0.08, 1.02*L*u1[1]+0.08, "\\psi_1'", {tex:true, fs:16, color:C.h});
  a.note(1.02*L*u2[0]-0.08, 1.02*L*u2[1]+0.06, "\\psi_2'", {tex:true, fs:16, color:C.h, anchor:'end'});
  const c1 = u1[0]+u1[1], c2 = u2[0]+u2[1];
  seg(a, [[1,1],[c1*u1[0],c1*u1[1]]], {color:C.mid, dash:'4 5', width:1.6});
  seg(a, [[1,1],[c2*u2[0],c2*u2[1]]], {color:C.mid, dash:'4 5', width:1.6});
  SQ.forEach(p=>a.point(p.v[0], p.v[1], {color:C.in, r:7}));
  return a.svg();
}

/* ---- 3.4 summary ------------------------------------------------------------ */

/* One waveform through the whole translation: the waveform, the basis, the
   two correlators and the point. s(t) = 1.5 psi1(t) - 0.8 psi2(t). */
const CH_S = [[0,1,1.5],[1,2,-0.8]];
function figChain(v){
  P.hOverride = null;
  const f = frameOf(v, 3), op = k => clamp01(f-k+1);
  const ax = (h, yr, yl, last, yt) => TAx({w:560,h,xr:[-0.1,2.3],yr,ynameAtAxis:true,xlabel:last?'t':'',ylabel:yl,
    pad:{l:56,r:26,t:24,b:last?36:12},xt:last?[0,1,2]:null,yticksOverride:yt});
  /* the basis is drawn over the waveform it will take apart */
  const a = ax(130, [-1.2,1.9], 's(t),\\;\\psi_1,\\;\\psi_2', false, [-1,0,1]);
  if(op(1) > 0.02){ seg(a, outline(HALF1,-0.1,2.3), {color:C.h, width:2.0, opacity:op(1)});
    seg(a, outline(HALF2,-0.1,2.3), {color:C.h, width:2.0, dash:'7 5', opacity:op(1)}); }
  a.poly(outline(CH_S,-0.1,2.3), {color:C.in, width:2.4});
  const c = ax(158, [-1.2,1.9], 'c_1(t),\\;c_2(t)', true, [-1,0,1]);
  if(op(2) > 0.02){
    const c1 = t => t<0 ? 0 : 1.5*Math.min(t,1), c2 = t => t<1 ? 0 : -0.8*Math.min(t-1,1);
    seg(c, Array.from({length:121},(_,i)=>{ const t=-0.1+2.4*i/120; return [t, c1(t)]; }), {color:C.mid, width:2.4, opacity:op(2)});
    seg(c, Array.from({length:121},(_,i)=>{ const t=-0.1+2.4*i/120; return [t, c2(t)]; }), {color:C.mid, width:2.4, dash:'7 5', opacity:op(2)});
    if(op(2) > 0.5){ dot(c, 2, 1.5, {color:C.mid, r:5}); dot(c, 2, -0.8, {color:C.mid, r:5}); } }
  const d = plane({h:160, need:[[-2,2],[-1.25,1.25]], xticksOverride:[-1,1], yticksOverride:[-1,1]});
  if(op(3) > 0.02){ seg(d, [[1.5,0],[1.5,-0.8],[0,-0.8]], {dash:'4 5', opacity:op(3)});
    dot(d, 1.5, -0.8, {r:6.5, opacity:op(3)});
    if(op(3) > 0.5) d.note(1.8, -0.58, '\\mathbf{s}=(1.5,\\,-0.8)', {tex:true, fs:15, color:C.in}); }
  return stack(560, [[a.svg(),130],[c.svg(),158],[d.svg(),160]]);
}

/* Small sketches for the summary cards, in the dark-page signal tints. */
const G = (()=>{
  const sv = b => `<svg viewBox="0 0 92 44">${b}</svg>`;
  const ln = (d,c,w,da) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round"${da?` stroke-dasharray="${da}"`:''}/>`;
  const dt = (x,y,c,r) => `<circle cx="${x}" cy="${y}" r="${r||4}" fill="${c}"/>`;
  const AX='rgba(239,231,216,.30)', CY='#4FBECE', VI='#AC99DC', AM='#E5B255';
  const axes = ln('M6 40 H88 M10 42 V4',AX,1);
  return {
    ortho:  sv(axes+ln('M10 40 H40',AM,2.4)+ln('M10 40 V12',AM,2.4)),
    coord:  sv(axes+ln('M52 14 V40 M52 14 H10',AX,1.2,'3 3')+dt(52,14,CY)),
    inner:  sv(axes+ln('M10 40 L70 18',CY)+ln('M10 40 L40 8',CY)),
    energy: sv(axes+ln('M10 40 L58 12',VI)+dt(58,12,CY)),
    dist:   sv(axes+ln('M30 12 L74 30',VI,2.2)+dt(30,12,CY)+dt(74,30,CY)),
    square: sv(dt(30,10,CY)+dt(62,10,CY)+dt(30,34,CY)+dt(62,34,CY)+ln('M8 22 H84 M46 2 V42',AX,1)),
    binary: sv(ln('M6 22 H86',AX,1)+dt(20,22,CY)+dt(72,22,CY)+ln('M20 30 V34 H72 V30',VI,1.4)),
    carrier:sv(ln('M4 22 '+Array.from({length:43},(_,i)=>{ const x=4+2*i; return 'L'+x+','+(22-14*Math.cos(i/42*6*Math.PI)).toFixed(1); }).join(' '),CY,1.8)),
    psk:    sv(ln('M66 22 A20 20 0 1 1 65.9 21.9',AX,1)+Array.from({length:8},(_,i)=>dt((46+20*Math.cos(i*Math.PI/4)).toFixed(1),(22-20*Math.sin(i*Math.PI/4)).toFixed(1),CY,3.2)).join('')),
    gs:     sv(ln('M10 40 H80',CY)+ln('M10 40 L52 8',CY)+ln('M52 40 V10',VI,2.2)+ln('M10 40 H34',AM,3)),
    dim:    sv(ln('M30 32 H84 M30 32 V4 M30 32 L8 42',AX,1.2)+dt(62,14,CY)+dt(44,24,CY)+dt(70,30,CY)),
    rot:    sv(ln('M12 36 L80 10 M28 4 L60 42',AM,1.6)+dt(58,18,CY)+dt(34,26,CY))
  };
})();

/* A gallery of four everyday cases closing a section: the figures in a 2×2
   grid, and the cards beside them revealed one at a time. */
function realGallery(cfg){
  return { id:cfg.id, module:'M3', nav:cfg.nav, title:cfg.title, src:cfg.src,
    objective:cfg.objective, keywords:cfg.keywords,
    budget:cfg.budget||'a gallery of four everyday cases. Each figure is one example',
    slide:true, steps:cfg.notes.length-1, blocks:[
    {t:'eyebrow', text:cfg.eyebrow},
    {t:'title', text:cfg.title},
    {t:'cols', ratio:'c-8-4', fill:true, left:[
      {t:'grid', cols:2, gap:'18px 22px', items:cfg.figs.map(([svg,cap])=>[{t:'fig', frame:true, svg, caption:cap}])}
    ], right:cfg.notes.map((n,i)=>i ? {t:'reveal', at:i, items:[n]} : n)}
  ]};
}
const galPlane = need => plane({w:520, h:250, pad:{l:60,r:26,t:24,b:40}, need, xticksOverride:[], yticksOverride:[]});

/* 3.1. Two Walsh codes of IS-95 (8 of their 64 chips, 1.2288 Mchip/s), two
   Wi-Fi subcarriers over one 3.2 us symbol, the k = 2 vector of the 8-point
   DCT, and the two tones of the Kansas City cassette standard. */
const W2 = [1,1,-1,-1,1,1,-1,-1], W5 = [1,-1,1,-1,-1,1,-1,1], TC = 1/1.2288;
const REAL_VECTORS = realGallery({ id:'m3-real-vectors', nav:'Orthogonal signals around us',
  title:'Orthogonal signals around us', eyebrow:'Module 3 · Signals as vectors', src:'CH9 s.4–8',
  objective:'Recognise orthogonal signal sets in mobile phones, Wi-Fi, image coding and data tapes.',
  keywords:'examples walsh codes cdma is-95 ofdm subcarriers wifi 312.5 khz dct jpeg basis kansas city standard fsk tones orthogonal',
  figs:[
    [()=>{ const a=TAx(EXO({xt:[0,2,4,6],xr:[-0.2,7.0],yr:[-1.6,1.6],xlabel:'t\\;(\\mu\\text{s})',ylabel:'w_2(t)\\,w_5(t)',
        xticksOverride:[],yticksOverride:[-1,0,1]}));
      const segs = W2.map((c,n)=>[n*TC,(n+1)*TC,c*W5[n]]);
      shade(a, pwc(segs), 0, 8*TC, C.mid, 0.2);
      a.poly(outline(segs,-0.2,7.0), {color:C.mid, width:2.2});
      return a.svg(); }, 'IS-95 phones share one band, each call with its own Walsh code at $1.2288$ Mchip/s. Two codes multiply to $+1$ on four chips and $-1$ on four, so $\\sum_n w_2[n]\\,w_5[n]=0$.'],
    [()=>{ const T = 3.2, df = 1/T, a=TAx(EXO({xt:[0,1,2,3],xr:[-0.1,3.4],yr:[-1.4,1.4],xlabel:'t\\;(\\mu\\text{s})',ylabel:'x_k(t)',
        xticksOverride:[0,1,2,3],yticksOverride:[-1,0,1]}));
      a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*3*df*t):0, {color:C.in, width:2.2, n:700});
      a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*4*df*t):0, {color:C.in, width:1.8, n:700, dash:'6 4'});
      return a.svg(); }, 'Wi-Fi spaces its subcarriers $\\Delta f=312.5$ kHz apart. Over one symbol of $T=1/\\Delta f=3.2\\ \\mu$s, $\\cos(2\\pi k\\Delta f t)$ for $k=3$ and $k=4$ are orthogonal.'],
    [()=>{ const a=TAx(EXO({xt:[0,1,2,3,4,5,6,7],xr:[-0.6,8.8],yr:[-0.62,0.62],xlabel:'n\\;(\\text{pixel})',ylabel:'c_2[n]',
        xticksOverride:[0,1,2,3,4,5,6,7],yticksOverride:[-0.5,0,0.5]}));
      a.stem(Array.from({length:8},(_,n)=>[n, 0.5*Math.cos(Math.PI*(2*n+1)*2/16)]), {color:C.h});
      return a.svg(); }, 'JPEG writes each row of $8$ pixels against the DCT basis $c_k[n]=\\tfrac12\\cos\\bigl(\\pi(2n+1)k/16\\bigr)$, $k\\ge1$. Here $k=2$. The basis is orthonormal, so a row\'s energy is the sum of its squared coefficients.'],
    [()=>{ const T = 1000/300, a=TAx(EXO({xt:[0,1,2,3],xr:[-0.1,3.6],yr:[-1.4,1.4],xlabel:'t\\;(\\text{ms})',ylabel:'s_0(t),\\;s_1(t)',
        xticksOverride:[0,1,2,3],yticksOverride:[-1,0,1]}));
      a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*1.2*t):0, {color:C.in, width:2.2, n:900});
      a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*2.4*t):0, {color:C.in, width:1.6, n:900, dash:'6 4'});
      return a.svg(); }, 'The Kansas City standard stored bits on cassette tape at $300$ baud: $4$ cycles of $1200$ Hz for a $0$, $8$ cycles of $2400$ Hz for a $1$. Whole cycles in $T=3.33$ ms make the tones orthogonal.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Orthogonal by design', html:'Each system picks signals whose inner product is zero. A correlator matched to one of them gives zero for all the others.'},
    {t:'note', kind:'def', head:'Whole cycles', html:'Two sinusoids are orthogonal over $T$ when each fits a whole number of cycles in $T$ and the numbers differ.'},
    {t:'note', kind:'warn', head:'The interval', html:'Orthogonality holds over the exact interval. A receiver that integrates over a shifted window lets the signals leak into each other.'}
  ]});

/* 3.2. BPSK of GPS, 8PSK of DVB-S2, 16-QAM and 64-QAM of Wi-Fi, each at
   average energy 1. */
const qamPts = L => { const o = [], s = Math.sqrt(2*(L*L-1)/3);
  for(let i=0;i<L;i++) for(let k=0;k<L;k++) o.push([(2*i-L+1)/s, (2*k-L+1)/s]); return o; };
const REAL_CONST = realGallery({ id:'m3-real-constellation', nav:'Constellations around us',
  title:'Constellations around us', eyebrow:'Module 3 · Constellations', src:'CH9 s.11–15',
  objective:'Read the number of points, the energy and the smallest distance off the constellations of real systems.',
  keywords:'examples constellation gps bpsk dvb-s2 8psk wifi 16-qam 64-qam average energy minimum distance bits per symbol',
  figs:[
    [()=>{ const a = galPlane([[-1.35,1.35],[-1.2,1.2]]);
      a.point(1,0,{color:C.in,r:6}); a.point(-1,0,{color:C.in,r:6}); return a.svg(); },
      'GPS satellites send their C/A code with BPSK on $1575.42$ MHz. Two points, $1$ bit a symbol, $d=2\\sqrt{E}$.'],
    [()=>{ const a = galPlane([[-1.35,1.35],[-1.2,1.2]]); circle(a,1);
      for(let i=0;i<8;i++) a.point(Math.cos(i*Math.PI/4), Math.sin(i*Math.PI/4), {color:C.in,r:5.5});
      return a.svg(); },
      'Satellite television (DVB-S2) can use 8PSK: $3$ bits a symbol on one circle, with $d_{\\min}=2\\sqrt{E}\\sin(\\pi/8)=0.765\\sqrt{E}$.'],
    [()=>{ const a = galPlane([[-1.35,1.35],[-1.2,1.2]]);
      qamPts(4).forEach(p=>a.point(p[0],p[1],{color:C.in,r:5})); return a.svg(); },
      'Wi-Fi at $36$ Mb/s uses 16-QAM, $4$ bits a symbol. Scaled to $E_{\\mathrm{avg}}=1$, the grid step is $d_{\\min}=2/\\sqrt{10}=0.632$.'],
    [()=>{ const a = galPlane([[-1.35,1.35],[-1.2,1.2]]);
      qamPts(8).forEach(p=>a.point(p[0],p[1],{color:C.in,r:3.6})); return a.svg(); },
      'At $54$ Mb/s Wi-Fi uses 64-QAM, $6$ bits a symbol. With $E_{\\mathrm{avg}}=1$, $d_{\\min}=2/\\sqrt{42}=0.309$.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Bits a symbol', html:'$M$ points carry $\\log_2M$ bits a symbol. Each doubling of $M$ adds one bit.'},
    {t:'note', kind:'def', head:'Equal average energy', html:'All four are drawn with $E_{\\mathrm{avg}}=1$. More points in the same energy must sit closer together.'},
    {t:'note', kind:'warn', head:'Smaller distance', html:'$d_{\\min}$ falls from $2$ for BPSK to $0.309$ for 64-QAM. Closer points need a cleaner channel.'}
  ]});

/* 3.3. A receiver whose sine branch is 10 degrees off, the two channel
   columns of a two-antenna receiver, hum removed by a projection, and the
   Legendre polynomials of a calibration fit. */
const EPS = 10*Math.PI/180, H1 = [1,0.3], H2 = [0.8,0.9];
const REAL_GS = realGallery({ id:'m3-real-gs', nav:'Gram–Schmidt around us',
  title:'Gram–Schmidt around us', eyebrow:'Module 3 · The Gram–Schmidt procedure', src:'CH9 s.16–18',
  objective:'Recognise the Gram–Schmidt step in radio receivers, antenna arrays, hum filters and curve fitting.',
  keywords:'examples iq imbalance quadrature error mimo qr factorization channel columns hum removal projection legendre polynomials calibration',
  figs:[
    [()=>{ const a = plane({w:520, h:250, pad:{l:60,r:26,t:24,b:40}, need:[[-1.7,1.7],[-1.55,1.55]],
        xlabel:'y_I', ylabel:'y_Q', xticksOverride:[], yticksOverride:[]});
      const sq = [[1,1],[1,-1],[-1,-1],[-1,1],[1,1]], rx = sq.map(([x,y])=>[x, y*Math.cos(EPS)+x*Math.sin(EPS)]);
      seg(a, sq, {color:C.in, dash:'5 4', width:1.4}); seg(a, rx, {color:C.out, width:1.6});
      rx.slice(0,4).forEach(p=>a.point(p[0],p[1],{color:C.out,r:5.5}));
      return a.svg(); },
      'A receiver whose sine branch is $10^{\\circ}$ off reads QPSK as a sheared square, $y_Q=y\\cos10^{\\circ}+x\\sin10^{\\circ}$. Gram–Schmidt removes the $\\sin10^{\\circ}=0.174$ leak and restores the dashed square.'],
    [()=>{ const n1 = Math.hypot(...H1), q1 = [H1[0]/n1, H1[1]/n1], r = H2[0]*q1[0]+H2[1]*q1[1];
      const g = [H2[0]-r*q1[0], H2[1]-r*q1[1]], ng = Math.hypot(...g), q2 = [g[0]/ng, g[1]/ng];
      const a = plane({w:520, h:250, pad:{l:60,r:26,t:24,b:40}, need:[[-0.45,1.4],[-0.15,1.15]],
        xlabel:'\\text{antenna }1', ylabel:'\\text{antenna }2', xticksOverride:[1], yticksOverride:[1]});
      arrow(a,0,0,...H1,{color:C.h,width:2.4}); arrow(a,0,0,...H2,{color:C.h,width:2.4});
      arrow(a,0,0,...q1,{color:C.mid,width:1.8,dash:'5 4'}); arrow(a,0,0,...q2,{color:C.mid,width:1.8,dash:'5 4'});
      a.note(1.06,0.28,'\\mathbf{h}_1',{tex:true,fs:14,color:C.h}); a.note(0.86,0.96,'\\mathbf{h}_2',{tex:true,fs:14,color:C.h});
      a.note(-0.33,0.92,'\\mathbf{q}_2',{tex:true,fs:14,color:C.mid,anchor:'end'});
      return a.svg(); },
      'A two-antenna Wi-Fi receiver orthogonalizes the channel columns $\\mathbf{h}_1=(1,0.3)$ and $\\mathbf{h}_2=(0.8,0.9)$ before detection. The result $\\mathbf{q}_1,\\mathbf{q}_2$ is the QR factorization.'],
    [()=>{ const a=TAx(EXO({xt:[0,5,10,15],xr:[-0.3,21],yr:[-1.6,1.6],xlabel:'t\\;(\\text{ms})',ylabel:'m(t)',yticksOverride:[-1,0,1]}));
      a.curve(t=>t>=0&&t<=20?0.5*Math.sin(2*Math.PI*0.45*t)+0.8*Math.sin(2*Math.PI*0.05*t):NaN, {color:C.out, width:1.4, n:1200});
      a.curve(t=>t>=0&&t<=20?0.5*Math.sin(2*Math.PI*0.45*t):NaN, {color:C.mid, width:2.2, n:1200});
      return a.svg(); },
      'A hum filter projects the microphone signal $m(t)$ on a $50$ Hz reference $r(t)$ over $20$ ms. The coefficient $\\langle m,r\\rangle/\\|r\\|^{2}=0.8$, and $m-0.8\\,r$ leaves the $450$ Hz tone.'],
    [()=>{ const a=TAx(EXO({xt:[0,25,50,75],xr:[-3,104],yr:[-1.25,1.25],xlabel:'T\\;(^{\\circ}\\text{C})',ylabel:'p_k(u)',yticksOverride:[-1,0,1]}));
      const u = T => (T-50)/50;
      a.curve(T=>T>=0&&T<=100?1:NaN, {color:C.h, width:2.2});
      a.curve(T=>T>=0&&T<=100?u(T):NaN, {color:C.h, width:2.0, dash:'7 5'});
      a.curve(T=>T>=0&&T<=100?u(T)*u(T)-1/3:NaN, {color:C.h, width:2.0, dash:'2 4'});
      return a.svg(); },
      'A sensor fit over $0$ to $100\\ ^{\\circ}$C uses $u=(T-50)/50$. Gram–Schmidt on $1$, $u$, $u^{2}$ over $[-1,1]$ gives the orthogonal set $1$, $u$, $u^{2}-\\tfrac13$.']
  ],
  notes:[
    {t:'note', kind:'def', head:'Remove what is known', html:'Each case subtracts the projection on a known signal. That is step $k$ of Gram–Schmidt, $g_k=s_k-\\sum_i s_{ki}\\psi_i$.'},
    {t:'note', kind:'def', head:'An orthogonal remainder', html:'What is left is orthogonal to everything removed. It holds only what is new in the signal.'},
    {t:'note', kind:'warn', head:'The order', html:'Starting from $\\mathbf{h}_2$ instead of $\\mathbf{h}_1$ gives other axes. They span the same plane.'}
  ]});

/* ======================================================================== */
const SC = [

/* ---------------------------------------------------------------- 3.0 ---- */
{ id:'m3-open', module:'M3', nav:'Module 3 opening', title:'Geometric Representation of Signals',
  objective:'Show that a set of waveforms can be written as a set of points, and what that buys the receiver.',
  keywords:'module 3 overview geometric representation signal space basis coordinates constellation gram schmidt',
  src:'CH9 s.2–3', dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Geometric representation of signals'},
  {t:'title', level:1, text:'Geometric Representation of Signals'},
  {t:'lede', text:'Each waveform of a signal set becomes a point. Energies, distances and the receiver are then read off a picture.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'stack', style:'--ts:1.6;gap:34px', items:[
      {t:'note', kind:'warn', head:'Result 1', html:'<span style="color:var(--graphite)">An orthonormal basis turns each waveform into $N$ numbers. Energy is squared length, and the energy of a difference is squared distance.</span>'},
      {t:'note', kind:'warn', head:'Result 2', html:'<span style="color:var(--graphite)">Gram–Schmidt finds a basis for any set, with $N\\le M$. Sets with the same constellation need the same receiver.</span>'}
    ]}
  ], right:[
    {t:'grid', cols:1, gap:'10px', items:[
      [{t:'fig', svg:()=>figOpenWave(S0,'s_0(t)',null,0)}],
      [{t:'fig', svg:()=>figOpenWave(S1,'s_1(t)',null,0.5)}],
      [{t:'fig', svg:figOpenPlane}]
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 3.1 ---- */
{ id:'m3-twoaxes', module:'M3', nav:'Two waveforms, two axes', title:'Two waveforms, two axes',
  objective:'Show why two waveforms that are not multiples of each other need two axes and two correlators.',
  keywords:'two waveforms not multiples one basis not enough two matched filters two numbers point plane orthogonal product',
  src:'CH9 s.2–3', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'Two waveforms, two axes'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figTwoAxes,
      caption:'$s_0(t)$ and $s_1(t)$ take the values $\\pm1$ on $[0,T]$. Their product is $+1$ on two quarters and $-1$ on the other two.'}
  ], right:[
    {t:'note', kind:'def', head:'One axis is not enough', html:'Neither waveform is a multiple of the other. No single $\\psi(t)$ writes both as $s_m\\psi(t)$, so the one-number receiver of Module 2 does not apply.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Two correlators', tex:'y_0=\\int_0^{T}x(t)\\,s_0(t)\\,dt,\\qquad y_1=\\int_0^{T}x(t)\\,s_1(t)\\,dt',
        note:'The receiver computes one number for each waveform. The pair $(y_0,y_1)$ is a point in a plane.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$s_0$ and $s_1$ are drawn on the left, with $T=1$.<div class="nsep"></div>What is $\\int_0^{1}s_0(t)\\,s_1(t)\\,dt$?',
        ask:{key:'m3-twoaxes', choices:['$0$','$0.5$','$1$'], answer:0,
          why:'The product is $+1$ on two quarters and $-1$ on two, so the integral is $0.5-0.5=0$.'}}]}
  ]}
]},

{ id:'m3-ortho', module:'M3', nav:'An orthonormal basis', title:'An orthonormal basis',
  objective:'Define the inner product and an orthonormal set of signals by analogy with vectors.',
  keywords:'orthonormal basis inner product norm orthogonal unit energy functions vectors analogy',
  src:'CH9 s.4–5', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'An orthonormal basis'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figOrtho,
      caption:'A vector written against the unit axes $\\mathbf{e}_1$ and $\\mathbf{e}_2$ is the list $(a_1,a_2)$. Its length and its angle to another vector come from that list.'}
  ], right:[
    {t:'eq', label:'Vectors', tex:'\\langle\\mathbf{a},\\mathbf{b}\\rangle=\\sum_{k=1}^{N}a_kb_k,\\qquad \\|\\mathbf{a}\\|=\\sqrt{\\langle\\mathbf{a},\\mathbf{a}\\rangle}',
      note:'The inner product multiplies matching entries and adds them. The length is the root of the inner product with itself.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Signals', tex:'\\langle x,y\\rangle=\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt,\\qquad \\|x\\|^{2}=\\int_{-\\infty}^{\\infty}x^{2}(t)\\,dt=E_x',
        note:'The sum becomes an integral. The squared length of a signal is its energy.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Orthonormal set', html:'$\\{\\psi_1,\\ldots,\\psi_N\\}$ is orthonormal when $\\int\\psi_j(t)\\psi_k(t)\\,dt$ is $1$ for $j=k$ and $0$ for $j\\ne k$. Each has unit energy, and each pair is orthogonal.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\psi(t)=c$ on $[0,2]$ and zero elsewhere.<div class="nsep"></div>Which $c>0$ gives $\\psi$ unit energy?',
        ask:{key:'m3-ortho', choices:['$1/2$','$1/\\sqrt2$','$1$'], answer:1,
          why:'$\\int_0^{2}c^{2}\\,dt=2c^{2}=1$, so $c=1/\\sqrt2=0.707$.'}}]}
  ]}
]},

{ id:'m3-project', module:'M3', nav:'Coordinates', title:'The coordinates of a waveform',
  objective:'Give the analysis and synthesis formulas that turn a waveform into its coordinates and back.',
  keywords:'projection coordinates synthesis analysis signal vector inner product basis slider',
  src:'CH9 s.6–8', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'The coordinates of a waveform'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'a', label:'$s_1$', min:-2, max:2, step:0.1, v:1.5, show:v=>'$'+num(v,1)+'$'},
                      {k:'b', label:'$s_2$', min:-2, max:2, step:0.1, v:-1, show:v=>'$'+num(v,1)+'$'}]},
      svg:figProject,
      caption:'Drag $s_1$ and $s_2$. The waveform $s_1\\psi_1(t)+s_2\\psi_2(t)$ and the point $(s_1,s_2)$ change together. The dashed pulses are $\\psi_1$ and $\\psi_2$.'}
  ], right:[
    {t:'eq', key:true, label:'Analysis', tex:'s_{ij}=\\int_0^{T}s_i(t)\\,\\psi_j(t)\\,dt,\\qquad j=1,\\ldots,N',
      note:'One integral for each axis takes the waveform apart into $N$ numbers.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Synthesis', tex:'s_i(t)=\\sum_{j=1}^{N}s_{ij}\\,\\psi_j(t),\\qquad \\mathbf{s}_i=(s_{i1},\\ldots,s_{iN})',
        note:'The $N$ numbers build the waveform back. The list $\\mathbf{s}_i$ is the <b>signal vector</b>.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\psi_1=1$ on $[0,1)$ and $\\psi_2=1$ on $[1,2)$. $s(t)=3$ on $[0,1)$ and $-1$ on $[1,2)$.<div class="nsep"></div>What is $\\mathbf{s}$?',
        ask:{key:'m3-project', choices:['$(3,-1)$','$(-1,3)$','$(3,1)$'], answer:0,
          why:'$s_1=\\int_0^{1}3\\cdot1\\,dt=3$ and $s_2=\\int_1^{2}(-1)\\cdot1\\,dt=-1$.'}}]}
  ]}
]},

{ id:'m3-analyzer', module:'M3', nav:'The analyzer', title:'The analyzer and the synthesizer',
  objective:'Show the bank of correlators that computes the coordinates, and why it is computed once.',
  keywords:'analyzer synthesizer bank of correlators coordinates computed once receiver structure N correlators',
  src:'CH9 s.8', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'The analyzer and the synthesizer'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figAnalyzer,
      caption:'The analyzer: one correlator for each basis function. Its $N$ outputs are the coordinates, and together they form the signal vector $\\mathbf{s}_i$.'}
  ], right:[
    {t:'note', kind:'def', head:'Analyzer', html:'Multiply the waveform by each $\\psi_j(t)$ and integrate over $[0,T]$. The receiver of Module 4 is this bank of correlators.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Synthesizer', html:'Scale each $\\psi_j(t)$ by $s_{ij}$ and add. The transmitter can build every waveform of the set from $N$ basis functions.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A set of $M=8$ waveforms spans $N=2$ dimensions.<div class="nsep"></div>How many correlators does the analyzer need?',
        ask:{key:'m3-analyzer', choices:['$2$','$3$','$8$'], answer:0,
          why:'One correlator for each basis function, so $N=2$, however many waveforms share the two axes.'}}]}
  ]}
]},

{ id:'m3-inner', module:'M3', nav:'Inner products preserved', title:'Inner products are preserved',
  objective:'Show that the integral of a product of two signals equals the dot product of their vectors.',
  keywords:'key property inner product preserved integral equals dot product proof orthonormality frames area',
  src:'CH9 s.6–7', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'Inner products are preserved'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$x(t)$, $y(t)$','$x(t)\\,y(t)$','area']}, svg:figInner,
      caption:'$x=2\\psi_1+\\psi_2$ and $y=\\psi_1-\\psi_2$ on the two unit pulses. Step to the product and its signed area.'}
  ], right:[
    {t:'eq', result:true, label:'Key result · inner products', tex:'\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt=\\sum_{k=1}^{N}x_ky_k=\\langle\\mathbf{x},\\mathbf{y}\\rangle',
      note:'An integral over two waveforms equals a sum over $N$ pairs of coordinates.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Proof in three moves', html:'<ol class="steps"><li>Write $x=\\sum_jx_j\\psi_j$ and $y=\\sum_ky_k\\psi_k$.</li><li>Move the integral inside both sums.</li><li>Use $\\int\\psi_j\\psi_k\\,dt=1$ for $j=k$ and $0$ otherwise.</li></ol>'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\mathbf{x}=(2,1)$ and $\\mathbf{y}=(1,-1)$ on an orthonormal basis.<div class="nsep"></div>What is $\\int x(t)\\,y(t)\\,dt$?',
        ask:{key:'m3-inner', choices:['$-1$','$1$','$3$'], answer:1,
          why:'$x_1y_1+x_2y_2=2(1)+1(-1)=1$, the signed area $2-1$ in the figure.'}}]}
  ]}
]},

{ id:'m3-energy', module:'M3', nav:'Energy and distance', title:'Energy and distance',
  objective:'Identify energy with squared length and the energy of a difference with squared distance.',
  keywords:'energy squared norm euclidean distance difference signal slider angle constellation',
  src:'CH9 s.11–12', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'Energy and distance'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'th', label:'angle', min:0, max:180, step:5, v:90, show:v=>'$'+v+'^{\\circ}$'}]},
      svg:figEnergy,
      caption:'Drag the angle between $\\mathbf{s}_1$ and $\\mathbf{s}_2$. Both stay on the circle of radius $\\sqrt2$, so both energies stay $2$. Only their distance $d$ changes.'}
  ], right:[
    {t:'eq', label:'Energy', tex:'E_i=\\int_0^{T}s_i^{2}(t)\\,dt=\\sum_{j=1}^{N}s_{ij}^{2}=\\|\\mathbf{s}_i\\|^{2}',
      note:'Put $y=x$ in the key result. Energy is the squared distance from the point to the origin.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Distance', tex:'d_{ik}^{2}=\\|\\mathbf{s}_i-\\mathbf{s}_k\\|^{2}=\\int_0^{T}\\bigl(s_i(t)-s_k(t)\\bigr)^{2}dt',
        note:'Apply the key result to the difference $s_i-s_k$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Distance, not energy', html:'Noise moves the received point. Two points far apart are hard to confuse, so $d$ decides the error rate. Module 4 derives the rule.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$\\mathbf{s}_1=(1,1)$ and $\\mathbf{s}_2=(1,-1)$.<div class="nsep"></div>What is $d_{12}$?',
        ask:{key:'m3-energy', choices:['$\\sqrt2$','$2$','$4$'], answer:1,
          why:'$\\mathbf{s}_1-\\mathbf{s}_2=(0,2)$, so $d_{12}=\\sqrt{0^{2}+2^{2}}=2$. Its square, $4$, is the energy of $s_1-s_2$.'}}]}
  ]}
]},

{ id:'m3-ex-inspect', module:'M3', nav:'Worked example · a basis by inspection', title:'Worked example: a basis by inspection',
  objective:'Find an orthonormal basis for four waveforms by reading their pieces, and draw the constellation.',
  keywords:'worked example basis by inspection four signals two unit pulses square constellation frames',
  src:'CH9 s.9–10', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Worked example'},
  {t:'title', text:'Worked example: a basis by inspection'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['signals','$\\mathbf{s}_1$','$\\mathbf{s}_2$','$\\mathbf{s}_3$','$\\mathbf{s}_4$']}, svg:figInspect,
      caption:'Each signal is constant on $[0,1)$ and on $[1,2)$. Step through the four points.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'The four signals on the left, each $\\pm1$ on $[0,1)$ and on $[1,2)$.<div class="nsep"></div>Find a basis and the four vectors. How many basis functions?',
      ask:{key:'m3-ex-inspect', choices:['$1$','$2$','$4$'], answer:1,
        why:'Every signal is built from a pulse on $[0,1)$ and a pulse on $[1,2)$, so two basis functions are enough.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\begin{aligned}\\psi_1(t)&=1,\\ 0\\le t<1,\\qquad \\psi_2(t)=1,\\ 1\\le t<2\\\\\\int\\psi_1^{2}\\,dt&=\\int\\psi_2^{2}\\,dt=1,\\qquad \\int\\psi_1\\psi_2\\,dt=0\\end{aligned}',
        note:'Read off the pieces, then check unit energy and orthogonality. The pulses never overlap.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\mathbf{s}_1=(1,1),\\quad \\mathbf{s}_2=(1,-1),\\quad \\mathbf{s}_3=(-1,1),\\quad \\mathbf{s}_4=(-1,-1)',
        note:'Each coordinate is the height on that half times its width $1$. The four points form a square, and each energy is $2$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use $\\psi_1=s_1/\\sqrt{E_1}$ as an axis, not $s_1$ itself. Here $E_1=2$, so an unscaled axis puts every coordinate a factor $\\sqrt2$ off.'}]}
  ]}
]},

REAL_VECTORS,

{ id:'m3-lab-r', module:'M3', nav:'Laboratory {lab} · From waveform to point', title:'Laboratory {lab} · From waveform to point',
  objective:'Project a waveform on a chosen basis and see the coordinates, the rebuilt waveform and what is left over.',
  keywords:'laboratory projection coordinates basis halves quarters walsh reconstruction residual energy captured span interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors'},
  {t:'title', text:'Laboratory {lab} · From waveform to point'},
  {t:'lede', text:'Choose a waveform and a basis. See its coordinates, the waveform they rebuild and the part the basis cannot hold.'},
  {t:'lab', id:'R'}
]},

{ id:'m3-code-vectors', module:'M3', nav:'Code · Signals as vectors', title:'Signals as vectors in code',
  objective:'Compute coordinates, inner products, energies and distances from sampled waveforms.',
  keywords:'code matlab python program run coordinates projection inner product energy distance',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 3 · Signals as vectors in code'},
  {t:'title', text:'Signals as vectors in code'},
  {t:'raw', html:()=>CODEBANK.page('m3-code-vectors')}
]},

/* ---------------------------------------------------------------- 3.2 ---- */
{ id:'m3-constellation', module:'M3', nav:'The constellation', title:'The constellation diagram',
  objective:'Define the constellation and read energy, distance and the number of correlators from it.',
  keywords:'constellation diagram signal space points energy radius distance number of axes frames',
  src:'CH9 s.11', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations'},
  {t:'title', text:'The constellation diagram'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['points','energy','distance']}, svg:figConst,
      caption:'The four signals of the worked example as a constellation. Step to read an energy as a radius and a distance between two points.'}
  ], right:[
    {t:'note', kind:'def', head:'Constellation diagram', html:'The signal vectors drawn in the space of their basis: one point for each waveform, one axis for each basis function.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Three readings', html:'<ol class="steps"><li>Distance to the origin: $\\sqrt{E_i}$.</li><li>Distance between two points: the root of the energy of their difference.</li><li>Number of axes: the correlators the receiver needs.</li></ol>'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Four points at $(\\pm1,\\pm1)$.<div class="nsep"></div>What is the smallest distance $d_{\\min}$ between two of them?',
        ask:{key:'m3-constellation', choices:['$\\sqrt2$','$2$','$2\\sqrt2$'], answer:1,
          why:'Neighbours such as $(1,1)$ and $(1,-1)$ differ by $2$ in one coordinate. The diagonal pairs are $2\\sqrt2=2.83$ apart.'}}]}
  ]}
]},

{ id:'m3-binary', module:'M3', nav:'Binary sets as points', title:'Three binary signal sets as points',
  objective:'Compare antipodal, orthogonal and on-off signalling by the distance between their two points.',
  keywords:'binary antipodal orthogonal on-off keying distance 2 sqrt Eb sqrt 2Eb 3 dB energy comparison frames',
  src:'CH9 s.11–15', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations'},
  {t:'title', text:'Three binary signal sets as points'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['antipodal','orthogonal','on-off'], ms:700}, svg:figBinary,
      caption:'Three binary sets, each with average energy $E_b$, in units of $\\sqrt{E_b}$. Step from one set to the next and watch the distance.'}
  ], right:[
    {t:'note', kind:'def', head:'Two classic sets', html:'<div class="cmp"><div><b>Antipodal</b>: $s_2=-s_1$. One axis, $d=2\\sqrt{E_b}$. Polar NRZ and BPSK.</div><div><b>Orthogonal</b>: $\\langle s_1,s_2\\rangle=0$. Two axes, $d=\\sqrt{2E_b}$. PPM and FSK.</div></div>'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Energy for equal distance', tex:'4E_b^{\\text{anti}}=d^{2}=2E_b^{\\text{orth}}\\quad\\Rightarrow\\quad \\frac{E_b^{\\text{orth}}}{E_b^{\\text{anti}}}=2=3.01\\ \\text{dB}',
        note:'Orthogonal signalling needs twice the energy for the same distance.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'On-off keying sends $0$ or $s(t)$ with equal priors and average energy $E_b$.<div class="nsep"></div>What is $d$?',
        ask:{key:'m3-binary', choices:['$\\sqrt{E_b}$','$\\sqrt{2E_b}$','$2\\sqrt{E_b}$'], answer:1,
          why:'The average is $E_b$, so $s(t)$ has energy $2E_b$. The points are $0$ and $\\sqrt{2E_b}$.'}}]}
  ]}
]},

{ id:'m3-passband', module:'M3', nav:'A cosine and a sine as axes', title:'A cosine and a sine as axes',
  objective:'Show that a cosine and a sine of the same carrier form an orthonormal pair, and place a carrier waveform in their plane.',
  keywords:'passband carrier cosine sine basis orthogonal whole cycles fc T integer phase point on circle slider',
  src:'CH9 s.13–14', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations'},
  {t:'title', text:'A cosine and a sine as axes'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'th', label:'$\\theta$', min:0, max:355, step:5, v:45, show:v=>'$'+v+'^{\\circ}$'}]},
      svg:figPassband,
      caption:'Drag the phase $\\theta$. The waveform $\\sqrt{2E/T}\\cos(2\\pi f_ct-\\theta)$ sits at $(\\sqrt{E}\\cos\\theta,\\sqrt{E}\\sin\\theta)$. Drawn with $E=1$ and $f_cT=3$.'}
  ], right:[
    {t:'eq', label:'The two axes', tex:'\\psi_1(t)=\\sqrt{\\tfrac{2}{T}}\\cos(2\\pi f_ct),\\qquad \\psi_2(t)=\\sqrt{\\tfrac{2}{T}}\\sin(2\\pi f_ct),\\qquad 0\\le t\\le T',
      note:'$f_cT$ is a whole number, so each function holds whole cycles in $[0,T]$.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Orthogonal', tex:'\\begin{aligned}\\int_0^{T}\\psi_1\\psi_2\\,dt&=\\frac{2}{T}\\int_0^{T}\\cos(2\\pi f_ct)\\sin(2\\pi f_ct)\\,dt\\\\&=\\frac{1}{T}\\int_0^{T}\\sin(4\\pi f_ct)\\,dt=\\frac{1-\\cos(4\\pi f_cT)}{4\\pi f_cT}=0\\end{aligned}',
        note:'Use $2\\cos a\\sin a=\\sin2a$. The product holds $2f_cT$ whole cycles, and $\\cos(4\\pi f_cT)=1$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'$s(t)=\\sqrt{2E/T}\\cos(2\\pi f_ct-\\theta)$ with $\\theta=90^{\\circ}$.<div class="nsep"></div>Where is its point?',
        ask:{key:'m3-passband', choices:['$(\\sqrt{E},0)$','$(0,\\sqrt{E})$','$(0,-\\sqrt{E})$'], answer:1,
          why:'$\\cos(x-90^{\\circ})=\\sin x$, so $s(t)=\\sqrt{E}\\,\\psi_2(t)$.'}}]}
  ]}
]},

{ id:'m3-ex-qpsk', module:'M3', nav:'Worked example · four carrier waveforms', title:'Worked example: four carrier waveforms',
  objective:'Find the basis and the constellation of four carrier waveforms, and compare it with the pulse set of 3.1.',
  keywords:'worked example qpsk four carrier waveforms cosine sine inspection constellation square sketch',
  src:'CH9 s.13–14', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Worked example'},
  {t:'title', text:'Worked example: four carrier waveforms'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, sketch:{label:'Mark the four points, then check them.'}, svg:figExQpsk,
      caption:'The axes are $\\psi_1$ and $\\psi_2$ of the last slide. Mark where the four waveforms sit, then show the answer.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'For $0\\le t\\le T$ and whole $f_cT$: $s_{1,2}=\\mp\\sqrt{\\tfrac2T}\\cos(2\\pi f_ct)+\\sqrt{\\tfrac2T}\\sin(2\\pi f_ct)$ and $s_{3,4}=\\mp\\sqrt{\\tfrac2T}\\cos(2\\pi f_ct)-\\sqrt{\\tfrac2T}\\sin(2\\pi f_ct)$.<div class="nsep"></div>What is the energy of each?',
      ask:{key:'m3-ex-qpsk', choices:['$1$','$2$','$4$'], answer:1,
        why:'Each is $\\pm\\psi_1\\pm\\psi_2$, so its vector has two entries $\\pm1$ and energy $1+1=2$.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'s_i(t)=s_{i1}\\,\\psi_1(t)+s_{i2}\\,\\psi_2(t),\\qquad s_{ij}=\\pm1',
        note:'By inspection, every waveform is already written in the cosine and sine basis. The coefficients are the coordinates.'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\mathbf{s}_1=(-1,1),\\quad \\mathbf{s}_2=(1,1),\\quad \\mathbf{s}_3=(-1,-1),\\quad \\mathbf{s}_4=(1,-1)',
        note:'A square: every energy is $2$, and $d_{\\min}=2$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Check', html:'This is the square of the four pulse signals in 3.1. The waveforms differ, and the picture is the same.'}]}
  ]}
]},

{ id:'m3-remarks', module:'M3', nav:'Geometric equivalence', title:'Geometric equivalence of signal sets',
  objective:'State what the constellation determines and what it leaves open.',
  keywords:'geometric equivalence same constellation different waveforms receiver error probability bandwidth frames',
  src:'CH9 s.15', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations'},
  {t:'title', text:'Geometric equivalence of signal sets'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['four pulse pairs','four carrier waveforms'], ms:900}, svg:figRemarks,
      caption:'Step between the pulse set and the carrier set. Each panel keeps its vector, and the constellation below does not change.'}
  ], right:[
    {t:'note', kind:'def', head:'Geometric equivalence', html:'Different waveform sets can have the same constellation. They then need the same receiver and have the same error probability in white Gaussian noise.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Bandwidth', html:'The constellation does not fix the bandwidth. The pulse set occupies frequencies near $f=0$, and the carrier set occupies frequencies near $f_c$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'Two waveform sets have the same constellation.<div class="nsep"></div>Which of these can differ between them?',
        ask:{key:'m3-remarks', choices:['Error probability','Number of correlators','Bandwidth'], answer:2,
          why:'Error probability and receiver follow from the points. Bandwidth follows from the waveform shapes.'}}]}
  ]}
]},

{ id:'m3-psk', module:'M3', nav:'Points on a circle', title:'Points on a circle',
  objective:'Place M equal-energy carrier waveforms on a circle and find the distance between neighbours.',
  keywords:'M-ary phase shift keying psk points on circle equal energy minimum distance 2 sqrt E sin pi over M slider 8psk',
  src:'CH9 s.22', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations'},
  {t:'title', text:'Points on a circle'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'k', label:'$M$', min:1, max:4, step:1, v:3, show:v=>'$'+Math.pow(2,v)+'$'}]},
      svg:figPsk,
      caption:'Drag $M$. All $M$ points share the circle of radius $\\sqrt{E}$, here $E=1$. Each doubling of $M$ brings neighbours closer.'}
  ], right:[
    {t:'eq', label:'The signal set', tex:'\\begin{aligned}s_i(t)&=A\\cos\\!\\left(2\\pi f_ct-\\tfrac{2\\pi i}{M}\\right),\\quad i=0,\\ldots,M-1\\\\\\mathbf{s}_i&=\\sqrt{E}\\left(\\cos\\tfrac{2\\pi i}{M},\\ \\sin\\tfrac{2\\pi i}{M}\\right),\\quad E=\\tfrac{A^{2}T}{2}\\end{aligned}',
      note:'Every waveform has the same energy, so every point lies on one circle.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Nearest neighbours', tex:'d_{\\min}=2\\sqrt{E}\\,\\sin\\frac{\\pi}{M}',
        note:'Two neighbours are $2\\pi/M$ apart in angle. The chord of that angle on a circle of radius $\\sqrt{E}$ is $d_{\\min}$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'8-PSK with $E=1$.<div class="nsep"></div>What is $d_{\\min}$?',
        ask:{key:'m3-psk', choices:['$0.390$','$0.765$','$1.414$'], answer:1,
          why:'$d_{\\min}=2\\sin(\\pi/8)=2(0.383)=0.765$.'}}]}
  ]}
]},

REAL_CONST,

{ id:'m3-lab-s', module:'M3', nav:'Laboratory {lab} · Constellation explorer', title:'Laboratory {lab} · Constellation explorer',
  objective:'Compare signal sets at equal average energy, turn their basis, and see the waveform of each point.',
  keywords:'laboratory constellation explorer on-off antipodal orthogonal qpsk 8psk 4-pam 16-qam minimum distance average energy rotation waveform interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations'},
  {t:'title', text:'Laboratory {lab} · Constellation explorer'},
  {t:'lede', text:'Choose a signal set at average energy $1$. Turn the basis and pick a point to see its waveform.'},
  {t:'lab', id:'S'}
]},

{ id:'m3-code-constellation', module:'M3', nav:'Code · Constellations', title:'Constellations in code',
  objective:'Build PSK and QAM constellations, measure their energy and smallest distance, and recover carrier coordinates.',
  keywords:'code matlab python program run constellation psk qam average energy minimum distance carrier correlation',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 3 · Constellations in code'},
  {t:'title', text:'Constellations in code'},
  {t:'raw', html:()=>CODEBANK.page('m3-code-constellation')}
]},

/* ---------------------------------------------------------------- 3.3 ---- */
{ id:'m3-gs', module:'M3', nav:'Gram–Schmidt', title:'The Gram–Schmidt procedure',
  objective:'State the Gram–Schmidt procedure as normalize, remove projections, normalize the remainder.',
  keywords:'gram schmidt orthogonalization procedure basis normalize subtract projection remainder stop rule frames',
  src:'CH9 s.16–18', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · The Gram–Schmidt procedure'},
  {t:'title', text:'The Gram–Schmidt procedure'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$s_1,\\;s_2$','$\\psi_1$','$s_{21}\\psi_1$','$g_2$','$\\psi_2$']}, svg:figGs,
      caption:'Step through the procedure on two signals. The part of $s_2$ along $\\psi_1$ is removed. The remainder $g_2$, scaled to unit length, is $\\psi_2$.'}
  ], right:[
    {t:'eq', label:'Step 1', tex:'E_1=\\int s_1^{2}(t)\\,dt,\\qquad \\psi_1(t)=\\frac{s_1(t)}{\\sqrt{E_1}}',
      note:'The first axis is the first signal scaled to unit energy.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Step k', tex:'\\begin{aligned}s_{ki}&=\\int s_k(t)\\,\\psi_i(t)\\,dt,\\qquad g_k(t)=s_k(t)-\\sum_{i=1}^{k-1}s_{ki}\\,\\psi_i(t)\\\\\\psi_k(t)&=\\frac{g_k(t)}{\\sqrt{E_{g_k}}},\\qquad E_{g_k}=\\int g_k^{2}(t)\\,dt\\end{aligned}',
        note:'Remove what the earlier axes already hold. Scale the remainder to unit energy.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Stop rule', html:'If $g_k(t)=0$, then $s_k$ is a combination of earlier signals and adds no axis. So $N\\le M$, with $N=M$ only when no signal is a combination of the others.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Given', html:'$s_2$ has energy $25$ and $s_{21}=3$.<div class="nsep"></div>What is the energy of $g_2$?',
        ask:{key:'m3-gs', choices:['$4$','$16$','$22$'], answer:1,
          why:'$g_2$ is perpendicular to $\\psi_1$, so $E_{g_2}=25-3^{2}=16$.'}}]}
  ]}
]},

{ id:'m3-ex-gs', module:'M3', nav:'Worked example · three pulses', title:'Worked example: Gram–Schmidt for three pulses',
  objective:'Run the procedure on three pulses, find that two axes suffice, and write the vectors.',
  keywords:'worked example gram schmidt three pulses two basis functions remainder zero constellation frames',
  src:'CH9 s.19–21', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Worked example'},
  {t:'title', text:'Worked example: Gram–Schmidt for three pulses'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$s_1,s_2,s_3$','$\\psi_1$','$\\psi_2$','$g_3=0$']}, svg:figExGs,
      caption:'Each row holds one signal, dashed. Step to the basis function it produces. The third leaves nothing.'},
    {t:'legend', items:[['in','$s_k(t)$',true],['h','$\\psi_k(t)$',false,1],['mid','$g_3(t)$',false,3]], at:'tr'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$s_1=1$ on $[0,2)$, $s_2=1$ on $[2,3)$, $s_3=1$ on $[0,3)$, each zero elsewhere.<div class="nsep"></div>Find the basis and the vectors. How many axes?',
      ask:{key:'m3-ex-gs', choices:['$1$','$2$','$3$'], answer:1,
        why:'$s_3=s_1+s_2$, so its remainder is zero and it adds no axis.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Steps 1 and 2', tex:'\\begin{aligned}E_1&=\\int_0^{2}1^{2}\\,dt=2,\\qquad \\psi_1=\\tfrac{1}{\\sqrt2}\\ \\text{on }[0,2)\\\\s_{21}&=\\int s_2\\psi_1\\,dt=0,\\qquad g_2=s_2,\\qquad \\psi_2=1\\ \\text{on }[2,3)\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Step 3', tex:'\\begin{aligned}s_{31}&=\\int_0^{2}1\\cdot\\tfrac{1}{\\sqrt2}\\,dt=\\sqrt2,\\qquad s_{32}=\\int_2^{3}1\\cdot1\\,dt=1\\\\g_3&=s_3-\\sqrt2\\,\\psi_1-\\psi_2=0\\end{aligned}'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Solution', html:'$\\mathbf{s}_1=(\\sqrt2,0)$, $\\mathbf{s}_2=(0,1)$, $\\mathbf{s}_3=(\\sqrt2,1)$. Check: energies $2$, $1$, $3$, the same as $\\int s_i^{2}\\,dt$.'}]}
  ]}
]},

{ id:'m3-ex-gs-b', module:'M3', nav:'Worked example · four signals, three axes', title:'Worked example: four signals, three axes',
  objective:'Run the procedure on four signals that span three dimensions and view the constellation in three dimensions.',
  keywords:'worked example gram schmidt four signals three dimensions linear combination 3d constellation view slider',
  src:'CH9 s.19–21', slide:true, steps:3, blocks:[
  {t:'eyebrow', text:'Module 3 · Worked example'},
  {t:'title', text:'Worked example: four signals, three axes'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'az', label:'view', min:0, max:90, step:5, v:30, show:v=>'$'+v+'^{\\circ}$'}]},
      svg:figExGsB,
      caption:'Turn the view. Four signals need three axes. $\\mathbf{s}_4$ sits one unit above $\\mathbf{s}_1$, along $\\psi_3$.'}
  ], right:[
    {t:'note', kind:'def', head:'Given', html:'$s_1=1$ on $[0,2)$. $s_2=1$ on $[0,1)$ and $-1$ on $[1,2)$. $s_3=-1$ on $[0,1)$ and $1$ on $[1,3)$. $s_4=1$ on $[0,3)$.<div class="nsep"></div>How many dimensions does the set span?',
      ask:{key:'m3-ex-gs-b', choices:['$2$','$3$','$4$'], answer:1,
        why:'$s_4=s_1+s_2+s_3$, so $g_4=0$. The other three each add an axis.'}},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Method', tex:'\\begin{aligned}\\psi_1&=\\tfrac{s_1}{\\sqrt2},\\quad \\psi_2=\\tfrac{s_2}{\\sqrt2}\\quad(s_{21}=0)\\\\s_{31}&=0,\\quad s_{32}=-\\sqrt2,\\quad g_3=s_3+\\sqrt2\\,\\psi_2=1\\ \\text{on }[2,3)=\\psi_3\\end{aligned}'}]},
    {t:'reveal', at:2, items:[
      {t:'eq', label:'Solution', tex:'\\begin{aligned}\\mathbf{s}_1&=(\\sqrt2,0,0),&\\mathbf{s}_2&=(0,\\sqrt2,0)\\\\\\mathbf{s}_3&=(0,-\\sqrt2,1),&\\mathbf{s}_4&=(\\sqrt2,0,1)\\end{aligned}',
        note:'Check: energies $2$, $2$, $3$, $3$, equal to $\\int s_i^{2}\\,dt$.'}]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'err', head:'Common error', html:'Use one axis for each independent signal, not one for each signal, so $N\\le M$. Here $g_4=0$, so $N=3$, not $M=4$.'}]}
  ]}
]},

{ id:'m3-basis-change', module:'M3', nav:'The basis is not unique', title:'The basis is not unique',
  objective:'Show that another orthonormal basis changes the coordinates but not the dimension, the energies or the distances.',
  keywords:'change of basis rotation reflection not unique coordinates change energies distances unchanged slider',
  src:'CH9 s.18', slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · The Gram–Schmidt procedure'},
  {t:'title', text:'The basis is not unique'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true,
      live:{controls:[{k:'ph', label:'turn', min:0, max:90, step:5, v:30,
        show:v=>{ const r=v*Math.PI/180; return '$'+v+'^{\\circ}$, $\\mathbf{s}_1=('+num(Math.cos(r)+Math.sin(r))+',\\,'+num(Math.cos(r)-Math.sin(r))+')$'; }}]},
      svg:figBasisChange,
      caption:'Turn the axes $\\psi_1\'$ and $\\psi_2\'$. The coordinates of $\\mathbf{s}_1$ change. The four points and their distances do not.'}
  ], right:[
    {t:'note', kind:'def', head:'A change of basis', html:'Another orthonormal basis of the same space turns or reflects the axes. Taking the signals in another order in Gram–Schmidt gives such a basis.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'Unchanged', tex:'N,\\qquad \\|\\mathbf{s}_i\\|^{2}=E_i,\\qquad \\langle\\mathbf{s}_i,\\mathbf{s}_k\\rangle,\\qquad \\|\\mathbf{s}_i-\\mathbf{s}_k\\|',
        note:'Each is an integral of the waveforms, and the waveforms did not change.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'The axes turn by $45^{\\circ}$.<div class="nsep"></div>What are the new coordinates of $\\mathbf{s}_1=(1,1)$?',
        ask:{key:'m3-basis-change', choices:['$(1,1)$','$(\\sqrt2,0)$','$(0,\\sqrt2)$'], answer:1,
          why:'$\\psi_1\'$ points along $(1,1)$, so all the length $\\sqrt2$ of $\\mathbf{s}_1$ lies on it.'}}]}
  ]}
]},

REAL_GS,

{ id:'m3-lab-f', module:'M3', nav:'Laboratory {lab} · The Gram–Schmidt basis', title:'Laboratory {lab} · The Gram–Schmidt basis',
  objective:'Let the reader change the waveform set and its order and watch the basis and the constellation follow.',
  keywords:'laboratory gram schmidt basis constellation waveform set dimension order interactive',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · The Gram–Schmidt procedure'},
  {t:'title', text:'Laboratory {lab} · The Gram–Schmidt basis'},
  {t:'lede', text:'Choose a signal set and the order it is taken in. The basis changes, and the energies and distances do not.'},
  {t:'lab', id:'F'}
]},

{ id:'m3-code-gs', module:'M3', nav:'Code · Gram–Schmidt', title:'Gram–Schmidt in code',
  objective:'Run Gram–Schmidt on sampled waveforms, count the dimensions and compare two orders.',
  keywords:'code matlab python program run gram schmidt sampled waveforms dimension order distances',
  slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
  {t:'eyebrow', text:'Module 3 · Gram–Schmidt in code'},
  {t:'title', text:'Gram–Schmidt in code'},
  {t:'raw', html:()=>CODEBANK.page('m3-code-gs')}
]},

/* ---------------------------------------------------------------- 3.4 ---- */
{ id:'m3-chain', module:'M3', nav:'From waveforms to points', title:'From waveforms to points',
  objective:'Follow one waveform through the whole translation: basis, correlators and point.',
  keywords:'chain waveform basis correlators coordinates point review frames summary',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 3 · Summary'},
  {t:'title', text:'From waveforms to points'},
  {t:'cols', ratio:'c-5-7', fill:true, left:[
    {t:'fig', frame:true, grow:true, frames:{labels:['$s(t)$','$\\psi_1,\\;\\psi_2$','correlate','$\\mathbf{s}$']}, svg:figChain,
      caption:'Step through the translation. Each correlator integrates $s(t)\\,\\psi_j(t)$. Its value at $t=2$ is one coordinate of the point.'},
    {t:'legend', items:[['in','$s(t)$'],['h','$\\psi_1,\\ \\psi_2$',false,1],['mid','$c_1(t),\\ c_2(t)$',false,2]], at:'tr'}
  ], right:[
    {t:'note', kind:'def', head:'Four moves', html:'<ol class="steps"><li>Find a basis, by inspection or by Gram–Schmidt.</li><li>Correlate each waveform with each $\\psi_j$.</li><li>Draw the vectors as points.</li><li>Read energies and distances off the picture.</li></ol>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Module 4', html:'The receiver correlates, as the analyzer does, and then picks a point. Its error probability depends only on the distances between the points.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Given', html:'A set of $M=16$ waveforms spans $N=2$ dimensions.<div class="nsep"></div>How many correlators does the receiver need?',
        ask:{key:'m3-chain', choices:['$2$','$4$','$16$'], answer:0,
          why:'One correlator for each basis function, so $N=2$.'}}]}
  ]}
]},

{ id:'m3-quick', module:'M3', nav:'Quick check', title:'Quick check',
  objective:'Check the module ideas with six short predictions.',
  keywords:'quick check predict orthogonal unit energy coordinates distance dimension psk',
  budget:'a set of six prediction cards. The questions carry no figure',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Quick check'},
  {t:'title', text:'Quick check'},
  {t:'grid', cols:3, gap:'22px 20px', style:'flex:1;grid-auto-rows:1fr;padding-bottom:8px', items:[
    [{t:'note', kind:'def', head:'Orthogonality', html:'Two pulses never overlap in time. Their inner product is',
      ask:{key:'m3-qc0', choices:['$0$','$1$','their energy'], answer:0,
        why:'Where one is non-zero the other is zero, so the product is zero everywhere.'}}],
    [{t:'note', kind:'def', head:'Unit energy', html:'$\\psi(t)=c$ on $[0,4]$ has unit energy when $c$ is',
      ask:{key:'m3-qc1', choices:['$1/4$','$1/2$','$1$'], answer:1,
        why:'$4c^{2}=1$, so $c=1/2$.'}}],
    [{t:'note', kind:'def', head:'Energy', html:'$s(t)=2\\psi_1(t)-3\\psi_2(t)$ on an orthonormal basis. Its energy is',
      ask:{key:'m3-qc2', choices:['$-1$','$5$','$13$'], answer:2,
        why:'$\\|\\mathbf{s}\\|^{2}=2^{2}+(-3)^{2}=13$.'}}],
    [{t:'note', kind:'def', head:'Distance', html:'$\\mathbf{s}_1=(1,2)$ and $\\mathbf{s}_2=(4,6)$. Their distance is',
      ask:{key:'m3-qc3', choices:['$5$','$7$','$25$'], answer:0,
        why:'$\\sqrt{3^{2}+4^{2}}=\\sqrt{25}=5$.'}}],
    [{t:'note', kind:'def', head:'Dimension', html:'Five waveforms are all multiples of one pulse. Gram–Schmidt gives $N=$',
      ask:{key:'m3-qc4', choices:['$1$','$2$','$5$'], answer:0,
        why:'After the first axis every remainder is zero.'}}],
    [{t:'note', kind:'def', head:'Points on a circle', html:'QPSK has $E=2$. Its $d_{\\min}=2\\sqrt{E}\\sin(\\pi/4)$ is',
      ask:{key:'m3-qc5', choices:['$1$','$2$','$2\\sqrt2$'], answer:1,
        why:'$2\\sqrt2\\,(0.707)=2$.'}}]
  ]}
]},

{ id:'m3-synth', module:'M3', nav:'Summary', title:'Module 3 summary',
  objective:'Collect the results this module contributes to the rest of the course.',
  keywords:'summary basis coordinates inner product energy distance constellation gram schmidt dimension psk recall',
  dark:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 3 · Summary'},
  {t:'title', text:'Module 3 summary'},
  /* Twelve results as prompts, in the order of the module: the student answers
     each one aloud, then opens the card. */
  {t:'raw', html:()=>RECALL.deck('m3', [
    {q:'What is an orthonormal set?', glyph:G.ortho,
     a:'Functions with $\\int\\psi_j\\psi_k\\,dt=1$ for $j=k$ and $0$ for $j\\ne k$: unit energy, and every pair orthogonal.'},
    {q:'How is a coordinate computed?', glyph:G.coord,
     a:'$s_{ij}=\\int_0^{T}s_i(t)\\,\\psi_j(t)\\,dt$, one correlator for each basis function.'},
    {q:'How is the waveform rebuilt?', glyph:G.coord,
     a:'$s_i(t)=\\sum_{j=1}^{N}s_{ij}\\,\\psi_j(t)$. The vector $\\mathbf{s}_i$ holds the whole waveform.'},
    {q:'What does the translation preserve?', glyph:G.inner,
     a:'Inner products: $\\int x(t)\\,y(t)\\,dt=\\sum_kx_ky_k$.'},
    {q:'What is the energy of a signal?', glyph:G.energy,
     a:'$E_i=\\|\\mathbf{s}_i\\|^{2}$, the squared distance from its point to the origin.'},
    {q:'What is the distance between two signals?', glyph:G.dist,
     a:'$d_{ik}=\\|\\mathbf{s}_i-\\mathbf{s}_k\\|$, the root of $\\int(s_i-s_k)^{2}\\,dt$.'},
    {q:'Antipodal or orthogonal: which is further apart?', glyph:G.binary,
     a:'<b>Antipodal</b>, $d=2\\sqrt{E_b}$ against $\\sqrt{2E_b}$. Orthogonal needs twice the energy, $3$ dB, for the same distance.'},
    {q:'When are a cosine and a sine orthogonal?', glyph:G.carrier,
     a:'Over $[0,T]$ when $f_cT$ is a whole number. Scaled by $\\sqrt{2/T}$ they are an orthonormal pair.'},
    {q:'How far apart are the points of M-PSK?', glyph:G.psk,
     a:'$d_{\\min}=2\\sqrt{E}\\sin(\\pi/M)$. All $M$ points lie on the circle of radius $\\sqrt{E}$.'},
    {q:'What is one Gram–Schmidt step?', glyph:G.gs,
     a:'$g_k=s_k-\\sum_{i<k}s_{ki}\\psi_i$, then $\\psi_k=g_k/\\sqrt{E_{g_k}}$. A zero $g_k$ adds no axis.'},
    {q:'How many axes does a set of $M$ signals need?', glyph:G.dim,
     a:'$N\\le M$, with $N=M$ only when no signal is a combination of the others.'},
    {q:'What does another basis change?', glyph:G.rot,
     a:'Only the coordinates. $N$, the energies and the distances stay, and so do the receiver and its error probability.'}
  ], {cols:2})},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Method', html:'<span style="color:var(--graphite)">Find a basis, correlate to get the coordinates, and draw the constellation. Module 4 detects a received point by its distances to these points.</span>'}]}
]},

/* Four optional projects for students who want to try the module on their own
   computer. They carry no grade and no code: each card gives an aim, what it
   practises, a few steps and what to look for. The briefs state no numerical
   answer, so they need no line in verify/. */
{ id:'m3-projects', module:'M3', nav:'Projects to try', title:'Projects to try',
  objective:'Offer four optional projects that use the module on simulated signals.',
  keywords:'projects matlab python gram schmidt sampled waveforms walsh codes cdma ofdm fft constellation zoo minimum distance',
  dark:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Projects'},
  {t:'title', text:'Projects to try'},
  {t:'raw', html:()=>PROJECTS.deck('m3', [
    {title:'Gram–Schmidt on noisy waveforms', glyph:G.gs,
     aim:'Run Gram–Schmidt on sampled waveforms and see how noise changes the count of dimensions.',
     learn:['Gram–Schmidt on samples instead of formulas.',
            'Why a tolerance is needed to call a remainder zero.',
            'Counting the dimensions of a signal set.'],
     steps:['Sample the three pulses of 3.3.2 at $1000$ points.',
            'Run Gram–Schmidt and print the energy of each remainder.',
            'Add a little Gaussian noise to each signal and run it again.',
            'Raise the tolerance until the count returns to $2$.'],
     look:'Without noise the third remainder is zero. With noise it is small but not zero, so a strict test finds three axes.'},
    {title:'Share a channel with Walsh codes', glyph:G.ortho,
     aim:'Send two users\' bits at the same time and separate them with orthogonal codes.',
     learn:['Walsh codes as an orthogonal set.',
            'Correlation as the analyzer.',
            'What breaks when the codes lose their alignment.'],
     steps:['Build the $8\\times8$ Hadamard matrix and take two of its rows as codes.',
            'Map each user\'s bits to $\\pm1$ and multiply by that user\'s code.',
            'Add the two signals and correlate the sum with each code.',
            'Delay one user by one chip and repeat.'],
     look:'Aligned, each correlator returns only its own user\'s bit. With a one-chip delay the other user leaks in.'},
    {title:'Orthogonal carriers with the FFT', glyph:G.carrier,
     aim:'Place symbols on orthogonal subcarriers and recover them, as OFDM does.',
     learn:['Sinusoids with whole cycles as an orthogonal basis.',
            'The inverse FFT as the synthesizer and the FFT as the analyzer.',
            'Why a frequency offset breaks orthogonality.'],
     steps:['Choose $16$ QPSK symbols, one for each subcarrier.',
            'Build the time signal with an inverse FFT of length $64$.',
            'Recover the symbols with an FFT and plot them.',
            'Shift the frequency by a tenth of the spacing and plot again.'],
     look:'The points come back exactly. With the offset each point spreads into a small cloud, because the carriers leak into each other.'},
    {title:'A constellation zoo', glyph:G.psk,
     aim:'Compare the smallest distance of many signal sets at the same average energy.',
     learn:['Normalizing a constellation to average energy $1$.',
            'Computing $d_{\\min}$ from all pairs of points.',
            'The trade between bits a symbol and distance.'],
     steps:['Build BPSK, QPSK, 8-PSK, 16-PSK, 16-QAM and 64-QAM.',
            'Scale each to average energy $1$.',
            'Compute $d_{\\min}$ for each and plot it against $\\log_2M$.',
            'Compare 16-PSK with 16-QAM.'],
     look:'$d_{\\min}$ falls as bits are added. At $16$ points, QAM keeps its points further apart than PSK.'}
  ])}
]}

];

window.SCENES_M3 = SC;
})();
