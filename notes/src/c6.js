/* Course notes — Chapter 6. */
(function(){
const P=PLOT, C=P.COL;

/* The figures of this chapter are the figures of the Module 6 slides, drawn by
   the same code with the same data, labels and colours. A slide figure that
   moves is drawn here at one state, which its caption names: a frame of a
   sequence, or one value of a slider. The drawing helpers below are copied from
   build/src/87_scenes_m6.js so that this file stands on its own.

   Colour, as in the slides: cyan a source symbol or the entropy it carries,
   amber the channel, violet a codeword or a quantity being built, green what
   gets through (mutual information, capacity), red what is lost or
   impossible. */

/* ---- drawing helpers (as the Module 6 scenes) ------------------------------ */
const SZ  = o => Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}}, o);
const clamp01 = x => Math.max(0, Math.min(1, x));
const frameOf = (v, last) => v && v.frame!=null ? v.frame : last;
const f2 = v => v.toFixed(2);
const num = (v, d=2) => { const s = v.toFixed(d); return /^-0\.0*$/.test(s) ? s.slice(1) : s; };
const sci = (v, d=2) => { if(!(v > 0)) return '0'; const e = Math.floor(Math.log10(v)), m = v/Math.pow(10, e);
  return e >= -1 ? num(v, 3) : m.toFixed(d)+'\\times10^{'+e+'}'; };
const rgba = (hex, al) => { const h = hex.replace('#','');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${al})`; };
function erfc(x){ const z = Math.abs(x), t = 1/(1+0.5*z);
  const r = t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+
    t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x >= 0 ? r : 2-r; }
const Qf = x => 0.5*erfc(x/Math.SQRT2);
const dB = db => Math.pow(10, db/10);
const todB = x => 10*Math.log10(x);
function reach(g, target, lo=-10, hi=60){
  for(let i=0;i<90;i++){ const m = (lo+hi)/2; if(g(m) > target) lo = m; else hi = m; }
  return (lo+hi)/2;
}
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }

const takeH = h0 => { const h = P.hOverride || h0; P.hOverride = null; return h; };
const place = (svg, x, y, w, h) => svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack = (w, parts) => { let y = 0, s = '';
  parts.forEach(([svg, h]) => { s += place(svg, 0, y, w, h); y += h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };

function arrow(a, x0,y0,x1,y1, o={}){
  const X0=a.sx(x0), Y0=a.sy(y0), X1=a.sx(x1), Y1=a.sy(y1), L=Math.hypot(X1-X0,Y1-Y0);
  if(L < 3) return;
  const ux=(X1-X0)/L, uy=(Y1-Y0)/L, hd=12*(o.head||1), col=o.color||C.in;
  a.raw(`<line x1="${f2(X0)}" y1="${f2(Y0)}" x2="${f2(X1-hd*0.8*ux)}" y2="${f2(Y1-hd*0.8*uy)}" stroke="${col}" stroke-width="${o.width||2.6}" stroke-linecap="round"/>`
    + `<path d="M${f2(X1)},${f2(Y1)} L${f2(X1-hd*ux-hd*0.42*uy)},${f2(Y1-hd*uy+hd*0.42*ux)} L${f2(X1-hd*ux+hd*0.42*uy)},${f2(Y1-hd*uy-hd*0.42*ux)} Z" fill="${col}"/>`);
}
function seg(a, pts, o={}){
  if(pts.length < 2) return;
  const d = 'M'+pts.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L');
  a.raw(`<path d="${d}" fill="none" stroke="${o.color||C.muted}" stroke-width="${o.width||1.4}" stroke-linejoin="round" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function trace(a, f, lo, hi, o={}){
  const n = o.n || 600, pts = [];
  lo = Math.max(lo, a.o.xr[0]); hi = Math.min(hi, a.o.xr[1]);
  if(hi <= lo) return;
  for(let i=0;i<=n;i++){ const t = lo+(hi-lo)*i/n; pts.push([t, f(t)]); }
  seg(a, pts, o);
}
function dot(a, x, y, o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||6}" fill="${o.color||C.in}" stroke="${o.ring||'#FCF9F3'}" stroke-width="${o.ringw||1.4}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function ring(a, x, y, o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||13}" fill="none" stroke="${o.color||C.out}" stroke-width="${o.width||2.6}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function box(a, x0, y0, x1, y1, fill, o={}){
  a.raw(`<rect x="${f2(Math.min(a.sx(x0),a.sx(x1)))}" y="${f2(Math.min(a.sy(y0),a.sy(y1)))}" width="${f2(Math.abs(a.sx(x1)-a.sx(x0)))}" height="${f2(Math.abs(a.sy(y1)-a.sy(y0)))}" fill="${fill}" stroke="${o.stroke||'none'}" stroke-width="${o.width||1.4}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function disc(a, cx, cy, r, fill, o={}){
  a.raw(`<ellipse cx="${f2(a.sx(cx))}" cy="${f2(a.sy(cy))}" rx="${f2(Math.abs(a.sx(cx+r)-a.sx(cx)))}" ry="${f2(Math.abs(a.sy(cy+r)-a.sy(cy)))}" fill="${fill}" stroke="${o.stroke||'none'}" stroke-width="${o.width||1.3}"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function cloudPts(a, pts, o={}){
  let s = ''; const r = o.r || 2.1;
  pts.forEach(([x,y])=>{ const col = o.color || C.noise;
    s += `<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${r}" fill="${col}" stroke="${col}" stroke-width="0.6"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`; });
  a.raw(s);
}
function wash(a, f, lo, hi, col, al, base){
  lo = Math.max(lo, a.o.xr[0]); hi = Math.min(hi, a.o.xr[1]);
  if(hi <= lo) return;
  const n = 200, pts = [], y0 = base!=null ? base : Math.max(0, a.o.yr[0]);
  for(let i=0;i<=n;i++){ const t=lo+(hi-lo)*i/n; pts.push(f2(a.sx(t))+','+f2(a.sy(Math.max(a.o.yr[0], Math.min(f(t), a.o.yr[1]))))); }
  a.raw(`<path d="M${f2(a.sx(lo))},${f2(a.sy(y0))}L${pts.join('L')}L${f2(a.sx(hi))},${f2(a.sy(y0))}Z" fill="${rgba(col, al==null?0.3:al)}" stroke="none"/>`);
}
const pmf = (a, pairs, o={}) => pairs.forEach(([x,v])=>{ seg(a, [[x,0],[x,v]], {color:o.color||C.in, width:o.width||1.8}); a.point(x, v, {color:o.color||C.in, r:o.r||4}); });
const lbl = (a, x, y, s, col, anchor, fs) => a.note(x, y, s, {tex:true, fs:fs||15, color:col||C.ink, anchor:anchor||'start'});
const txt = (a, x, y, s, col, anchor, fs, o={}) => a.note(x, y, s, Object.assign({fs:fs||14, color:col||C.muted, anchor:anchor||'middle'}, o));
function bottomTicks(a, vals, fmt){
  const L = P.labelScale(), f = fmt || (v => String(v));
  vals.forEach(v=>{ const X = f2(a.sx(v));
    a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${a.y0+5}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${X}" y="${f2(a.y0+19*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="middle">${f(v)}</text>`); });
  return a;
}
function leftTicks(a, vals, fmt){
  const L = P.labelScale(), f = fmt || (v => String(v));
  vals.forEach(v=>{ const Y = a.sy(v);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x1}" y2="${f2(Y)}" stroke="${C.grid}" stroke-width="1"/>`);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x0-5}" y2="${f2(Y)}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${f2(a.x0-10)}" y="${f2(Y+4.5*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="end">${f(v)}</text>`); });
  return a;
}
const TAx = o => { const xt = o.xt; const a = P.Axes(Object.assign({}, o, {xticksOverride:[]})); return xt ? bottomTicks(a, xt, o.xfmt) : a; };
const TAxL = o => { const a = leftTicks(TAx(Object.assign({}, o, {yticksOverride:[], zeroAxes:false})), o.yticksOverride, o.ytickfmt);
  a.raw(`<path d="M${f2(a.x0)},${f2(a.y1)}V${f2(a.y0)}H${f2(a.x1)}" fill="none" stroke="${C.axis}" stroke-width="1.5"/>`); return a; };
const bare = o => Object.assign({xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}, o);
let LGF = -99;
const lg10 = v => { const y = Math.log10(Math.max(1e-14, v)); return y < LGF-0.02 ? NaN : y; };
const logAx = o => { const a = TAx(Object.assign({ytickfmt:P.decade, zeroAxes:false}, o)); LGF = a.o.yr[0]; return a; };

/* A legend: a small card inside the plot, one row a series. The slides set it
   beside the figure as a block; a printed page has only the figure. */
function legend(a, items, o={}){
  const rowH = 24, w = o.w || 150, h = rowH*items.length + 10;
  const X = o.at === 'tl' || o.at === 'bl' ? a.x0+10 : a.x1-w-10;
  const Y = o.at === 'br' || o.at === 'bl' ? a.y0-h-10 : a.y1+10;
  const xd = px => a.o.xr[0] + (px-a.x0)*(a.o.xr[1]-a.o.xr[0])/(a.x1-a.x0);
  const yd = py => a.o.yr[0] + (a.y0-py)*(a.o.yr[1]-a.o.yr[0])/(a.y0-a.y1);
  a.raw(`<rect x="${f2(X)}" y="${f2(Y)}" width="${w}" height="${h}" rx="6" fill="${C.plate}" stroke="${C.rule}" stroke-width="1.2"/>`);
  items.forEach(([col, tex], i)=>{ const cy = Y + 5 + rowH*i + rowH/2;
    a.raw(`<rect x="${f2(X+10)}" y="${f2(cy-6)}" width="22" height="12" rx="2" fill="${rgba(col, 0.3)}" stroke="${col}" stroke-width="1.6"/>`);
    a.note(xd(X+40), yd(cy+2), tex, {tex:true, fs:14, color:C.ink, anchor:'start'}); });
  return a;
}

/* ---- the mathematics of the module ----------------------------------------- */
const lg = Math.log2;
const H = ps => -ps.reduce((s,p)=>p > 0 ? s + p*lg(p) : s, 0);
const hb = p => (p<=0||p>=1) ? 0 : -(p*lg(p)+(1-p)*lg(1-p));
function chan(Pyx, px){
  const py = new Array(Pyx[0].length).fill(0);
  Pyx.forEach((row,j)=>row.forEach((v,k)=>{ py[k] += px[j]*v; }));
  const HX = H(px), HY = H(py), HYX = Pyx.reduce((s,row,j)=>s + px[j]*H(row), 0);
  return { py, HX, HY, HYX, HXY:HX+HYX, HXgY:HX+HYX-HY, I:HY-HYX };
}
function capBinary(Pyx, n){
  n = n || 2000; let best = {q:0, I:0};
  for(let i=0;i<=n;i++){ const q = i/n, I = chan(Pyx, [q, 1-q]).I; if(I > best.I) best = {q, I}; }
  return best;
}
const BSC = p => [[1-p, p],[p, 1-p]];
const ZCH = [[1, 0],[0.5, 0.5]];
const DMC = [[0.8, 0.2],[0.3, 0.7]];
function huffAvg(ps){
  let a = ps.slice().sort((x,y)=>x-y), L = 0;
  while(a.length > 1){ const s = a[0] + a[1]; L += s; a = a.slice(2); let i = 0; while(i < a.length && a[i] < s) i++; a.splice(i, 0, s); }
  return L;
}
const prod = (ps, n) => { let out = [1]; for(let k=0;k<n;k++){ const nx = []; out.forEach(u=>ps.forEach(p=>nx.push(u*p))); out = nx; } return out; };
const LF = [0]; for(let i=1;i<=1200;i++) LF.push(LF[i-1] + Math.log(i));
const binom = (n, k, p) => Math.exp(LF[n]-LF[k]-LF[n-k] + k*Math.log(p) + (n-k)*Math.log(1-p));
const S3 = [0.7, 0.2, 0.1], FIVE = [0.4, 0.2, 0.2, 0.1, 0.1];
const HS3 = H(S3), HFIVE = H(FIVE);

function drawTree(a, codes, labels, o={}){
  const nodes = new Set(['']); codes.forEach(c=>{ for(let i=1;i<=c.length;i++) nodes.add(c.slice(0,i)); });
  const all = Array.from(nodes);
  const kids = n => all.filter(m => m.length === n.length+1 && m.slice(0,-1) === n);
  const order = all.slice().sort((x,y)=>y.length-x.length || (x<y?-1:1));
  const leaves = all.filter(n=>!kids(n).length).sort();
  const row = {}; leaves.forEach((n,i)=>{ row[n] = i; });
  order.forEach(n=>{ const k = kids(n); if(k.length) row[n] = k.reduce((s,m)=>s+row[m],0)/k.length; });
  const span = Math.max(1, leaves.length-1), ox = o.x0 || 0, dx = o.dx || 1, oy = o.y0 || 0, sy = o.fitH ? o.fitH/span : (o.sy || 1);
  const X = n => ox + n.length*dx, Y = n => oy + (span - row[n])*sy;
  const op = o.opacity;
  all.forEach(n=>{ if(n === '') return; const par = n.slice(0,-1);
    seg(a, [[X(par), Y(par)], [X(n), Y(n)]], {color:C.muted, width:1.6, opacity:op});
    if(o.bits !== false){
      const px = [a.sx(X(par)), a.sy(Y(par))], cx = [a.sx(X(n)), a.sy(Y(n))];
      const sl = Math.abs((cx[1]-px[1])/(cx[0]-px[0])), up = cx[1] < px[1] || (cx[1]===px[1] && n.slice(-1)==='0');
      const off = 5*sl + (up ? 7 : 16);
      txt(a, (X(par)+X(n))/2, (Y(par)+Y(n))/2, n.slice(-1), C.muted, 'middle', 13, {dy: up ? -off : off});
    }
  });
  all.forEach(n=>{ const i = codes.indexOf(n), hot = i >= 0 && o.hot === n;
    dot(a, X(n), Y(n), {color: i >= 0 ? (hot ? C.mid : (o.leaf || C.in)) : C.muted, r: i >= 0 ? (hot ? 7.5 : 6) : 3.4, opacity:op});
    if(i >= 0 && labels[i]) a.note(X(n), Y(n), labels[i], {tex:true, fs:o.fs||15, color: hot ? C.mid : C.ink, dx:12, dy: kids(n).length ? -16 : 0});
  });
  return {X, Y, span};
}
const CX0 = 0.1, CX1 = 0.9;
function chanDiag(a, ins, outs, edges, o={}){
  edges.forEach(([j,k,kind])=>{
    const y0 = ins[j][1], y1 = outs[k][1];
    seg(a, [[CX0, y0],[CX1, y1]], {color: kind==='flip' ? C.err : C.h, width: 2.4,
      dash: kind==='flip' ? '7 5' : kind==='erase' ? '3 4' : null});
  });
  ins.forEach(([s,y])=>{ dot(a, CX0, y, {color:C.in, r:7}); a.note(CX0, y, s, {tex:true, fs:17, color:C.in, anchor:'end', dx:-14}); });
  outs.forEach(([s,y])=>{ dot(a, CX1, y, {color:C.out, r:7}); a.note(CX1, y, s, {tex:true, fs:17, color:C.out, dx:14}); });
}
function tile(a, x, y, w, h, v, col, text, o={}){
  box(a, x, y, x+w, y+h, rgba(col, 0.05 + 0.27*clamp01(v/(o.max||1))), {stroke:C.rule, width:1.2, opacity:o.opacity});
  if(text!=null && (o.opacity==null || o.opacity > 0.4)) a.note(x+w/2, y+h/2, text, {tex:true, fs:o.fs||17, color:o.tcol||C.ink, anchor:'middle', dy:5});
}
function infoBar(a, r, o={}){
  const L = r.HXgY, M = r.I, R = r.HXY - r.HXgY - r.I, y0 = o.y || 0, h = o.h || 0.5;
  box(a, 0, y0, L, y0+h, rgba(C.err, 0.2), {stroke:C.err});
  box(a, L, y0, L+M, y0+h, rgba(C.out, 0.26), {stroke:C.out});
  box(a, L+M, y0, L+M+R, y0+h, rgba(C.h, 0.2), {stroke:C.h});
  seg(a, [[0, y0+h+0.28],[L+M, y0+h+0.28]], {color:C.in, width:2.6});
  seg(a, [[L, y0-0.28],[L+M+R, y0-0.28]], {color:C.out, width:2.6});
  return {L, M, R};
}
function planeAx(need, o){
  const h = P.hOverride || (o && o.h) || 380; P.hOverride = null;
  const base = Object.assign({w:560, pad:{l:20,r:20,t:14,b:14}}, bare(o||{}), {h});
  const pr = P.Axes(Object.assign({}, base, {xr:need[0], yr:need[1]}));
  const k = Math.min((pr.x1-pr.x0)/(need[0][1]-need[0][0]), (pr.y0-pr.y1)/(need[1][1]-need[1][0]));
  const cx = (need[0][0]+need[0][1])/2, cy = (need[1][0]+need[1][1])/2, hx = (pr.x1-pr.x0)/k/2, hy = (pr.y0-pr.y1)/k/2;
  return P.Axes(Object.assign({}, base, {xr:[cx-hx,cx+hx], yr:[cy-hy,cy+hy]}));
}

/* ---- 6.1 information and entropy ------------------------------------------- */
function figSelfInfo(v){
  const p = v ? v.p : 0.125, I = -lg(p);
  const a = TAx(SZ({xr:[0,1.02], yr:[0,7.6], xlabel:'p', ylabel:'I(p)\\;(\\text{bits})', xt:[0,0.25,0.5,0.75,1], yticksOverride:[0,1,2,3,4,5,6,7]}));
  trace(a, u=>-lg(u), 0.004, 1, {color:C.in, width:2.8, n:900});
  seg(a, [[p,0],[p,I],[0,I]], {color:C.ink, width:1.3, dash:'5 4'});
  dot(a, p, I, {color:C.in, r:7});
  lbl(a, 0.98, 6.9, 'p='+num(p,3), C.ink, 'end', 17);
  lbl(a, 0.98, 6.1, 'I(p)=-\\log_2p='+num(I,2)+'\\ \\text{bits}', C.in, 'end', 17);
  return a.svg();
}
const Q_TARGET = 5;
function figQuestions(v){
  const f = Math.min(5, frameOf(v, 5)), Ht = takeH(430), hA = Math.round(0.4*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.2,8.2], yr:[-0.9,2.6], pad:{l:16,r:16,t:12,b:10}}));
  const alive = i => { let o = 1;
    if(i < 4) o = Math.min(o, 1-clamp01(f)); if(i < 4 || i > 5) o = Math.min(o, 1-clamp01(f-1)); if(i !== Q_TARGET) o = Math.min(o, 1-clamp01(f-2));
    return 0.18 + 0.82*o; };
  for(let i=0;i<8;i++){ const o = alive(i), hit = i === Q_TARGET && f >= 2.5;
    box(a, i+0.08, 0, i+0.92, 1.3, rgba(hit ? C.out : C.in, 0.22), {stroke: hit ? C.out : C.in, width:1.8, opacity:o});
    txt(a, i+0.5, 0.52, String(i+1), hit ? C.out : C.in, 'middle', 19, {dy:6}); }
  const qs = ['\\text{8 equally likely cards: which one?}', '\\text{Q1: is it in 5 to 8?  yes}', '\\text{Q2: is it 5 or 6?  yes}',
    '3\\text{ questions}=\\log_2 8\\text{ bits}'];
  const qi = Math.min(3, Math.round(f));
  lbl(a, 4, 1.95, qs[qi], C.ink, 'middle', 16);
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-1.3,5.4], yr:[-0.6,3.6], pad:{l:16,r:16,t:10,b:12}}));
  const oT = clamp01(f-3);
  if(oT > 0.02){
    const t = drawTree(b, ['0','10','110','111'], ['A,\\ \\tfrac12','B,\\ \\tfrac14','C,\\ \\tfrac18','D,\\ \\tfrac18'], {dx:1.1, opacity:oT});
    b.note(0, t.Y(''), '\\text{is it A?}', {tex:true, fs:14, color:C.muted, anchor:'end', dx:-10, dy:5});
    if(f > 4.4) lbl(b, 5.3, 3.35, '\\bar{L}=\\tfrac12(1)+\\tfrac14(2)+\\tfrac18(3)+\\tfrac18(3)=1.75', C.mid, 'end', 15);
  }
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
function figEntropyBars(){
  const a = TAx(SZ({xr:[0.4,5.3], yr:[-0.55,3.9], ylabel:'\\text{bits}', yticksOverride:[0,1,2,3]}));
  S3.forEach((p,k)=>{
    box(a, k+0.62, 0, k+0.97, -lg(p), rgba(C.in, 0.22), {stroke:C.in, width:1.8});
    box(a, k+1.03, 0, k+1.38, -p*lg(p), rgba(C.mid, 0.3), {stroke:C.mid, width:1.8});
    lbl(a, k+1, -0.4, 's_'+(k+1)+'\\;('+p+')', C.ink, 'middle', 15);
  });
  a.hline(HS3, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.hline(lg(3), {color:C.muted, dash:'2 4', width:1.4, opacity:1});
  lbl(a, 3.55, HS3-0.32, 'H(S)=1.157', C.ink, 'start', 16);
  lbl(a, 3.55, lg(3)+0.14, '\\log_2 3=1.585', C.muted, 'start', 16);
  legend(a, [[C.in,'I(s_k)'],[C.mid,'p_kI(s_k)']], {w:136});
  return a.svg();
}
function figHb(v){
  const p = v ? v.p : 0.11, h = hb(p);
  const a = TAx(SZ({xr:[0,1], yr:[0,1.42], xlabel:'p', ylabel:'\\text{bits}', xt:[0,0.25,0.5,0.75,1], yticksOverride:[0,0.5,1]}));
  trace(a, u=>-u*lg(u), 0.001, 1, {color:C.muted, width:1.5, dash:'5 4'});
  trace(a, u=>-(1-u)*lg(1-u), 0, 0.999, {color:C.muted, width:1.5, dash:'5 4'});
  trace(a, hb, 0.0005, 0.9995, {color:C.in, width:2.8, n:900});
  seg(a, [[p,0],[p,h]], {color:C.ink, width:1.3, dash:'5 4'});
  dot(a, p, h, {color:C.in, r:7});
  lbl(a, 0.5, 1.23, 'H_b('+num(p,2)+')='+num(h,3)+'\\ \\text{bits}', C.in, 'middle', 17);
  return a.svg();
}
const RATE_P = [0.4, 0.3, 0.2, 0.1];
const rateWave = t => 0.55*Math.sin(2*Math.PI*1.1*t+0.3) + 0.35*Math.sin(2*Math.PI*2.6*t+1.2);
function figExRate(){
  const Ht = takeH(420), hA = Math.round(0.46*Ht);
  const a = TAx({w:560, h:hA, xr:[0.3,4.7], yr:[0,0.55], xlabel:'\\text{level}', ylabel:'p_k', pad:{l:56,r:26,t:24,b:40}, xt:[1,2,3,4], yticksOverride:[0.1,0.2,0.3,0.4]});
  pmf(a, RATE_P.map((p,k)=>[k+1,p]));
  RATE_P.forEach((p,k)=>lbl(a, k+1.12, p+0.03, String(p), C.in, 'start', 15));
  const b = TAx({w:560, h:Ht-hA, xr:[0,1.02], yr:[-1.2,1.35], xlabel:'t\\;(\\text{ms})', ylabel:'x(t)', pad:{l:56,r:26,t:24,b:42}, xt:[0,0.5], yticksOverride:[-1,0,1]});
  trace(b, rateWave, 0, 1.02, {color:C.in, width:2.4});
  b.stem(Array.from({length:7}, (_,k)=>[k/6, rateWave(k/6)]), {color:C.mid});
  b.span(0, 1/6, 1.1, 'T_s=\\tfrac16\\ \\text{ms}', {tex:true, color:C.mid, fs:15});
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const S3PAIRS = [], S3PL = [];
S3.forEach((p,i)=>S3.forEach((q,j)=>{ S3PAIRS.push(p*q); S3PL.push('s_'+(i+1)+'s_'+(j+1)); }));
function figExtension(v){
  const f = clamp01(frameOf(v, 1));
  const a = TAx(SZ({xr:[0,9.2], yr:[-0.9,7.6], ylabel:'I\\;(\\text{bits})', yticksOverride:[0,2,4,6]}));
  const o1 = f, o0 = 1-f;
  if(o0 > 0.02) S3.forEach((p,k)=>{ const c = 1.5+3.1*k;
    box(a, c-1.1, 0, c+1.1, -lg(p), rgba(C.in, 0.22), {stroke:C.in, width:1.8, opacity:o0});
    if(o0 > 0.5) lbl(a, c, -0.55, 's_'+(k+1), C.ink, 'middle', 15); });
  if(o1 > 0.02) S3PAIRS.forEach((p,k)=>{
    box(a, k+0.14, 0, k+0.86, -lg(p), rgba(C.in, 0.22), {stroke:C.in, width:1.6, opacity:o1});
    if(o1 > 0.5) lbl(a, k+0.5, -0.55, S3PL[k], C.ink, 'middle', 12); });
  const Hl = HS3*(1+f);
  a.hline(Hl, {color:C.ink, dash:'6 4', width:1.8, opacity:1});
  lbl(a, 0.2, 7.0, f < 0.5 ? 'H(S)=1.157' : 'H(S^2)=2\\times1.157=2.314', C.ink, 'start', 17);
  return a.svg();
}

/* ---- 6.2 the limits of compression ----------------------------------------- */
const DY = [0.5, 0.25, 0.125, 0.125], DYC = ['0','10','110','111'];
function figCodeLength(){
  const Ht = takeH(420), hA = Math.round(0.3*Ht);
  const blk = P.blocks({w:560, h:hA, items:[
    {t:'box', x:20, y:hA/2-30, w:112, h:60, label:'source'},
    {t:'arrow', x1:132, y1:hA/2, x2:206, y2:hA/2, label:'s_k', tex:true},
    {t:'box', x:206, y:hA/2-30, w:170, h:60, label:'source encoder'},
    {t:'arrow', x1:376, y1:hA/2, x2:450, y2:hA/2, label:'\\mathtt{110}', tex:true},
    {t:'text', x:500, y:hA/2+6, label:'bits'}]});
  const b = TAx({w:560, h:Ht-hA, xr:[0.4,5.9], yr:[-0.75,3.6], ylabel:'\\text{bits}', pad:{l:56,r:26,t:24,b:14}, yticksOverride:[0,1,2,3]});
  DY.forEach((p,k)=>{
    box(b, k+0.64, 0, k+0.98, -lg(p), rgba(C.in, 0.22), {stroke:C.in, width:1.8});
    box(b, k+1.02, 0, k+1.36, DYC[k].length, rgba(C.mid, 0.3), {stroke:C.mid, width:1.8});
    lbl(b, k+1, -0.5, '\\mathtt{'+DYC[k]+'}', C.mid, 'middle', 15);
  });
  b.hline(1.75, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  lbl(b, 4.55, 1.95, '\\bar{L}=H=1.75', C.ink, 'start', 15);
  return `<svg viewBox="0 0 560 ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img">${place(blk,0,0,560,hA)}${place(b.svg(),0,hA,560,Ht-hA)}</svg>`;
}
const TS_P = 0.2, TS_H = hb(TS_P), TS_EPS = 0.1, TS_N = [10,20,50,100,200,1000];
const tsStat = n => { let Pt = 0, cnt = 0; for(let k=0;k<=n;k++){ const s = -(k*lg(TS_P)+(n-k)*lg(1-TS_P))/n;
  if(Math.abs(s-TS_H) <= TS_EPS+1e-9){ Pt += binom(n,k,TS_P); cnt += Math.exp(LF[n]-LF[k]-LF[n-k]); } } return {Pt, lc:lg(cnt)}; };
function figTypical(v){
  const n = TS_N[v ? v.i : 3], st = tsStat(n);
  let mx = 0; for(let k=0;k<=n;k++) mx = Math.max(mx, binom(n,k,TS_P));
  const a = TAx(SZ({xr:[0.2,1.62], yr:[0,1.8*mx], xlabel:'-\\tfrac1n\\log_2P(\\mathbf{x})\\;(\\text{bits})', ylabel:'P', xt:[0.4,0.8,1.2], yticksOverride:[]}));
  box(a, TS_H-TS_EPS, 0, TS_H+TS_EPS, 1.8*mx, rgba(C.mid, 0.14));
  const pts = []; for(let k=0;k<=n;k++){ const s = -(k*lg(TS_P)+(n-k)*lg(1-TS_P))/n; if(s <= 1.62) pts.push([s, binom(n,k,TS_P)]); }
  pmf(a, pts, {r: n > 100 ? 2.4 : 3.6, width: n > 100 ? 1.2 : 1.8});
  a.vline(TS_H, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  lbl(a, 1.58, 1.5*mx, 'n='+n+',\\ \\ H=0.722', C.ink, 'end', 16);
  lbl(a, 1.58, 1.3*mx, 'P(\\text{typical})='+num(st.Pt,4), C.mid, 'end', 16);
  lbl(a, 1.58, 1.1*mx, '2^{nH}=2^{'+num(n*TS_H,1)+'}\\text{ of }2^{'+n+'}', C.in, 'end', 16);
  return a.svg();
}
const ST_N = 10, ST_TYP = [2];
const ST = (()=>{ const k = [], pr = []; for(let j=0;j<=ST_N;j++){ const c = Math.round(Math.exp(LF[ST_N]-LF[j]-LF[ST_N-j]));
  for(let i=0;i<c;i++){ k.push(j); pr.push(Math.pow(TS_P,j)*Math.pow(1-TS_P,ST_N-j)); } }
  const typ = k.map(j=>ST_TYP.includes(j)), nT = typ.filter(Boolean).length, pT = pr.reduce((s,p,i)=>s+(typ[i]?p:0), 0);
  return {k, pr, typ, nT, pT}; })();
function figSourceThm(v){
  const f = Math.min(3, frameOf(v, 3)), Ht = takeH(430), hA = Math.round(0.62*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.5,32.5], yr:[-0.5,32.5], pad:{l:40,r:40,t:14,b:10}}));
  const oT = clamp01(f);
  let dAll = '', dTyp = '';
  const cw = (a.x1-a.x0)/33, ch = (a.y0-a.y1)/33;
  ST.k.forEach((j,i)=>{ const X = a.sx(i%32)-cw*0.42, Y = a.sy(31-Math.floor(i/32))-ch*0.42, s = `M${f2(X)},${f2(Y)}h${f2(cw*0.84)}v${f2(ch*0.84)}h${f2(-cw*0.84)}Z`;
    if(ST.typ[i]) dTyp += s; else dAll += s; });
  a.raw(`<path d="${dAll}" fill="${rgba(C.in, 0.12)}" stroke="none"/>`);
  a.raw(`<path d="${dTyp}" fill="${rgba(oT > 0.5 ? C.mid : C.in, 0.12 + 0.2*oT)}" stroke="none"/>`);
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-0.05,1.12], yr:[-0.2,3.2], pad:{l:40,r:40,t:14,b:14}}));
  const o2 = clamp01(f-1), o3 = clamp01(f-2);
  if(f < 0.5) lbl(b, 0.5, 2.3, '2^{10}=1024\\text{ sequences of }n=10\\text{ bits}', C.ink, 'middle', 16);
  else if(f < 1.5) lbl(b, 0.5, 2.3, '\\text{typical: two ones, }'+ST.nT+'\\text{ sequences}', C.mid, 'middle', 16);
  if(o2 > 0.02){
    box(b, 0, 1.55, ST.nT/1024, 2.05, rgba(C.mid, 0.3), {stroke:C.mid, opacity:o2}); box(b, 0, 1.55, 1, 2.05, rgba(C.muted, 0.1));
    box(b, 0, 0.75, ST.pT, 1.25, rgba(C.mid, 0.3), {stroke:C.mid, opacity:o2}); box(b, 0, 0.75, 1, 1.25, rgba(C.muted, 0.1));
    if(o2 > 0.5){ lbl(b, ST.nT/1024+0.02, 1.62, num(100*ST.nT/1024,0)+'\\%\\text{ of the sequences}', C.mid, 'start', 15);
      lbl(b, ST.pT+0.02, 0.82, num(100*ST.pT,0)+'\\%\\text{ of the probability}', C.mid, 'start', 15); }
  }
  if(o3 > 0.5) lbl(b, 0.5, 2.6, '\\text{index: }\\lceil\\log_2'+ST.nT+'\\rceil='+Math.ceil(lg(ST.nT))+'\\text{ bits, not }10', C.ink, 'middle', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const CODES = { I:['0','1','00','11'], II:['0','10','110','111'], III:['0','01','011','0111'] };
const SLAB = ['s_1','s_2','s_3','s_4'];
const PSTREAM = '0101100111';
const parse = (code, s) => { const out = []; let i = 0; while(i < s.length){ let hit = -1;
  code.forEach((c,k)=>{ if(s.startsWith(c, i) && (hit < 0 || c.length > code[hit].length) && (code !== CODES.III || s[i+c.length] !== '1')) hit = k; });
  if(hit < 0) break; out.push([i, i+code[hit].length, hit]); i += code[hit].length; } return out; };
function figPrefix(v){
  const f = Math.min(3, frameOf(v, 3)), Ht = takeH(430), hA = Math.round(0.6*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.4,5.2], yr:[-0.6,3.6], pad:{l:18,r:18,t:14,b:10}}));
  const ops = [1-clamp01(f), clamp01(f)*(1-clamp01(f-1)), clamp01(f-1)*(1-clamp01(f-2)), clamp01(f-2)*0.35];
  ['I','II','III'].forEach((nm,k)=>{ const o = k===2 ? Math.max(ops[2], ops[3]) : ops[k]; if(o < 0.02) return;
    drawTree(a, CODES[nm], SLAB, {dx:1.15, opacity:o, bits: o > 0.5});
    if(o > 0.5) lbl(a, 5.1, 3.3, '\\text{Code '+nm+'}', C.ink, 'end', 17); });
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-2.2,10.4], yr:[-2.6,1.3], pad:{l:18,r:18,t:10,b:10}}));
  for(let i=0;i<10;i++){ box(b, i+0.06, 0.1, i+0.94, 1.1, rgba(C.mid, 0.16), {stroke:C.mid, width:1.4}); txt(b, i+0.5, 0.45, PSTREAM[i], C.mid, 'middle', 17, {dy:6}); }
  lbl(b, -0.2, 0.45, '\\text{bits}', C.ink, 'end', 15);
  const o = clamp01(f-2);
  if(o > 0.5){
    [['II', -0.8], ['III', -1.9]].forEach(([nm, y])=>{ lbl(b, -0.2, y, '\\text{'+nm+'}', C.ink, 'end', 15);
      parse(CODES[nm], PSTREAM).forEach(([u,w,k])=>{ b.span(u+0.1, w-0.1, y+0.55, '', {color:C.out}); lbl(b, (u+w)/2, y, SLAB[k], C.out, 'middle', 15); }); });
  }
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const KRAFT = [['I', CODES.I], ['II', CODES.II], ['III', CODES.III], ['1,2,3,4', ['0','10','110','1110']]];
const bval = c => c.split('').reduce((s,b,i)=>s + (+b)*Math.pow(2,-(i+1)), 0);
function figKraft(v){
  const f = Math.min(3, frameOf(v, 3));
  const a = TAx(SZ({xr:[-0.62,1.62], yr:[-1.5,4.3], xt:[0,0.5,1], yticksOverride:[], grid:false}));
  a.vline(1, {color:C.ink, dash:'5 4', width:1.3, opacity:1}); a.vline(0, {color:C.muted, dash:'2 4', width:1, opacity:1});
  KRAFT.forEach(([nm, code], k)=>{ const o = clamp01(1-Math.abs(f-k)); if(o < 0.02) return;
    code.forEach((c,i)=>{ const lo = bval(c), y = 3.3-0.95*i;
      box(a, lo, y-0.3, lo+Math.pow(2,-c.length), y+0.3, rgba(C.in, 0.24), {stroke:C.in, width:1.8, opacity:o});
      if(o > 0.5) lbl(a, -0.05, y-0.08, SLAB[i]+'\\;\\mathtt{'+c+'}', C.ink, 'end', 15); });
    const sum = code.reduce((s,c)=>s+Math.pow(2,-c.length), 0), y = -0.8;
    box(a, 0, y-0.3, Math.min(sum,1), y+0.3, rgba(C.mid, 0.3), {stroke:C.mid, width:1.8, opacity:o});
    if(sum > 1) box(a, 1, y-0.3, sum, y+0.3, rgba(C.err, 0.3), {stroke:C.err, width:1.8, opacity:o});
    if(o > 0.5) lbl(a, -0.05, y-0.08, '\\sum2^{-l_k}='+(sum===1 ? '1' : num(sum, sum===0.9375 ? 4 : 3)), sum > 1 ? C.err : C.mid, 'end', 15);
  });
  return a.svg();
}
function figBound(v){
  const n = v ? v.n : 10;
  const a = TAx(SZ({xr:[0.5,10.5], yr:[HS3-0.4,HS3+1.2], xlabel:'n\\;(\\text{symbols a block})', ylabel:'\\text{bits a symbol}', xt:[1,2,4,6,8,10], yticksOverride:[1,1.5,2]}));
  wash(a, u=>HS3+1/u, 0.5, 10.5, C.mid, 0.12, HS3);
  a.hline(HS3, {color:C.in, width:2.4, dash:'1 0', opacity:1});
  trace(a, u=>HS3+1/u, 0.9, 10.5, {color:C.mid, width:2.4});
  for(let k=1;k<=10;k++) dot(a, k, HS3+1/k, {color:C.mid, r: k===n ? 8 : 4.5});
  seg(a, [[n, HS3],[n, HS3+1/n]], {color:C.ink, width:1.3, dash:'5 4'});
  lbl(a, 10.3, HS3+1.06, 'n='+n+':\\ \\ H\\le L_n/n<H+'+num(1/n,3), C.ink, 'end', 16);
  lbl(a, 10.3, HS3-0.26, 'H(S)=1.157', C.in, 'end', 15);
  return a.svg();
}
const LM = [[1, 0.3634], [2, 0.1175], [3, 0.03455]];
function figRD(v){
  const R = v ? v.R : 1, D = Math.pow(2, -2*R);
  const a = TAx(SZ({xr:[0,4.2], yr:[-27,2], xlabel:'R\\;(\\text{bits a sample})', ylabel:'D/\\sigma^2\\;(\\text{dB})', xt:[0,1,2,3], yticksOverride:[0,-10,-20]}));
  a.curve(r=>todB(Math.pow(2,-2*r)), {color:C.in, width:2.6});
  LM.forEach(([r,d])=>{ dot(a, r, todB(d), {color:C.mid, r:6.5}); seg(a, [[r, todB(Math.pow(2,-2*r))],[r, todB(d)]], {color:C.mid, width:1.4, dash:'3 3'}); });
  lbl(a, 1.12, todB(0.3634)+0.6, '1.62\\text{ dB}', C.mid, 'start', 14);
  lbl(a, 2.12, todB(0.1175)+0.6, '2.74\\text{ dB}', C.mid, 'start', 14);
  lbl(a, 3.12, todB(0.03455)+0.6, '3.45\\text{ dB}', C.mid, 'start', 14);
  dot(a, R, todB(D), {color:C.in, r:7});
  lbl(a, 0.1, -19.5, 'R='+num(R,1)+':\\ D='+(D >= 0.01 ? num(D,4) : sci(D,2))+'\\,\\sigma^2', C.in, 'start', 16);
  lbl(a, 0.1, -23.6, '10\\log_{10}D/\\sigma^2='+num(todB(D),1)+'\\text{ dB}', C.in, 'start', 16);
  return a.svg();
}

/* ---- 6.3 Huffman and Lempel–Ziv coding -------------------------------------- */
const HUFF_HIGH = { cols:[
  [['s1',0.4],['s2',0.2],['s3',0.2],['s4',0.1],['s5',0.1]],
  [['s1',0.4],['A',0.2],['s2',0.2],['s3',0.2]],
  [['B',0.4],['s1',0.4],['A',0.2]],
  [['C',0.6],['B',0.4]] ], into:['A','B','C'],
  code:{s1:'00', s2:'10', s3:'11', s4:'010', s5:'011'} };
const HUFF_LOW = { cols:[
  [['s1',0.4],['s2',0.2],['s3',0.2],['s4',0.1],['s5',0.1]],
  [['s1',0.4],['s2',0.2],['s3',0.2],['A',0.2]],
  [['s1',0.4],['B',0.4],['s2',0.2]],
  [['C',0.6],['s1',0.4]] ], into:['A','B','C'],
  code:{s1:'1', s2:'01', s3:'000', s4:'0010', s5:'0011'} };
function huffTable(a, T, f, o={}){
  const op = o.opacity==null ? 1 : o.opacity, Y = r => 4 - r;
  T.cols.forEach((col, i)=>{ const oc = i === 0 ? 1 : clamp01(f-i+1); if(oc < 0.02) return;
    col.forEach(([nm,p], r)=>lbl(a, i*1.15, Y(r), num(p,1), nm.startsWith('s') && i === 0 ? C.in : C.mid, 'middle', 16));
    if(i < T.cols.length-1){ const on = clamp01(f-i); if(on < 0.02) return;
      const nx = T.cols[i+1], L = col.length;
      col.forEach(([nm], r)=>{ const merged = r >= L-2, tgt = merged ? T.into[i] : nm, r2 = nx.findIndex(e=>e[0]===tgt);
        seg(a, [[i*1.15+(merged ? 0.36 : 0.22), Y(r)+0.08],[(i+1)*1.15-0.24, Y(r2)+0.08]], {color: merged ? C.mid : C.muted, width: merged ? 2 : 1.3, opacity:on*op}); });
      if(on > 0.5){ txt(a, i*1.15+0.27, Y(L-2)+0.08, '0', C.mid, 'middle', 14, {dy:5}); txt(a, i*1.15+0.27, Y(L-1)+0.08, '1', C.mid, 'middle', 14, {dy:5}); }
    }
  });
  const last = T.cols.length-1;
  if(f > last+0.5){ txt(a, last*1.15+0.27, Y(0)+0.08, '0', C.mid, 'middle', 14, {dy:5}); txt(a, last*1.15+0.27, Y(1)+0.08, '1', C.mid, 'middle', 14, {dy:5});
    T.cols[0].forEach(([nm], r)=>lbl(a, -0.62, Y(r), '\\mathtt{'+T.code[nm]+'}', C.out, 'end', 16)); }
  T.cols[0].forEach(([nm], r)=>lbl(a, -0.3, Y(r), 's_'+nm[1], C.in, 'end', 16));
}
function figHuffman(v){
  const f = Math.min(4, frameOf(v, 4));
  const a = P.Axes(bare(SZ({xr:[-1.45,3.95], yr:[-0.6,4.6]})));
  huffTable(a, HUFF_HIGH, f);
  if(f > 3.5) lbl(a, 3.9, -0.35, '\\bar{L}=2.2,\\ \\ \\eta=0.9645', C.out, 'end', 16);
  return a.svg();
}
const LEN_HIGH = [2,2,2,3,3], LEN_LOW = [1,2,3,4,4];
function figHuffVar(v){
  const f = Math.min(2, frameOf(v, 2)), Ht = takeH(420), hA = Math.round(0.6*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-1.55,3.95], yr:[-0.5,4.5], pad:{l:14,r:14,t:10,b:6}}));
  const oL = clamp01(f);
  if(oL < 0.98) huffTable(a, HUFF_HIGH, 4, {opacity:1-oL});
  const g1 = P.Axes(bare({w:560, h:hA, xr:[-1.55,3.95], yr:[-0.5,4.5], pad:{l:14,r:14,t:10,b:6}}));
  if(oL > 0.02) huffTable(g1, HUFF_LOW, 4, {opacity:oL});
  const b = TAx({w:560, h:Ht-hA, xr:[0.4,5.6], yr:[0,5.7], ylabel:'l_k', pad:{l:56,r:26,t:24,b:40}, xt:[], yticksOverride:[1,2,3,4]});
  const o2 = clamp01(f-1);
  [1,2,3,4,5].forEach(k=>lbl(b, k, -1.2, 's_'+k, C.in, 'middle', 15));
  const hi = LEN_HIGH, lo = LEN_LOW;
  if(1-oL*(1-o2) > 0.02) b.stem(hi.map((l,k)=>[k+1-0.12*o2, l]), {color:C.mid});
  if(oL > 0.02) b.stem(lo.map((l,k)=>[k+1+0.12*o2, l]), {color:C.h});
  b.hline(2.2, {color:C.ink, dash:'6 4', width:1.5, opacity:1});
  if(o2 > 0.5){ lbl(b, 0.5, 4.55, '\\sigma^2_{\\text{high}}=0.16,\\ \\ \\sigma^2_{\\text{low}}=1.36', C.ink, 'start', 15); }
  else lbl(b, 0.5, 4.55, '\\sigma^2='+(oL < 0.5 ? '0.16' : '1.36'), C.ink, 'start', 15);
  return `<svg viewBox="0 0 560 ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img">${oL < 0.98 ? place(a.svg(),0,0,560,hA) : ''}${oL > 0.02 ? place(g1.svg(),0,0,560,hA) : ''}${place(b.svg(),0,hA,560,Ht-hA)}</svg>`;
}
const EXT_L = [1,2,3].map(n=>huffAvg(prod(S3, n))/n);
function figHuffExt(v){
  const f = Math.min(2, frameOf(v, 2)), Ht = takeH(430), hA = Math.round(0.52*Ht);
  const a = TAx({w:560, h:hA, xr:[0.5,3.5], yr:[0.8,2.35], ylabel:'\\text{bits a symbol}', pad:{l:56,r:26,t:24,b:14}, xt:[], yticksOverride:[1.2,1.6,2.0]});
  a.hline(HS3, {color:C.in, width:2, dash:'6 4', opacity:1});
  [1,2,3].forEach(n=>{ const o = clamp01(f-n+2); if(o < 0.02) return;
    ring(a, n, HS3+1/n, {color:C.ink, r:8, width:2, opacity:o});
    dot(a, n, EXT_L[n-1], {color:C.mid, r:7, opacity:o});
    if(o > 0.5) lbl(a, n+0.14, HS3+1/n+0.02, 'H+\\tfrac1'+n, C.ink, 'start', 14); });
  lbl(a, 3.45, HS3-0.24, 'H=1.157', C.in, 'end', 14);
  const b = TAx({w:560, h:Ht-hA, xr:[0.5,3.5], yr:[1.13,1.33], xlabel:'n\\;(\\text{symbols a block})', ylabel:'\\bar{L}_n/n', pad:{l:56,r:26,t:24,b:42}, xt:[1,2,3], yticksOverride:[1.15,1.2,1.25,1.3]});
  b.hline(HS3, {color:C.in, width:2, dash:'6 4', opacity:1});
  [1,2,3].forEach(n=>{ const o = clamp01(f-n+2); if(o < 0.02) return;
    dot(b, n, EXT_L[n-1], {color:C.mid, r:7, opacity:o});
    if(o > 0.5) lbl(b, n+0.12, EXT_L[n-1]+(n===1 ? -0.035 : 0.012), num(EXT_L[n-1], 4), C.mid, 'start', 15); });
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const AR_SEQ = [0, 0, 1];
const AR = (()=>{ const iv = [[0,1]]; AR_SEQ.forEach(s=>{ const [lo,hi] = iv[iv.length-1], w = hi-lo;
  const c = [0, 0.7, 0.9, 1]; iv.push([lo+w*c[s], lo+w*c[s+1]]); }); return iv; })();
function figArith(v){
  const f = Math.min(4, frameOf(v, 4));
  const a = P.Axes(bare(SZ({xr:[-0.3,1.3], yr:[-0.8,4.4]})));
  const cuts = [0, 0.7, 0.9, 1], cols = [0.3, 0.2, 0.12];
  for(let r=0;r<4;r++){ const o = r === 0 ? 1 : clamp01(f-r+1); if(o < 0.02) continue;
    const y = 3.7 - 1.25*r, [lo, hi] = AR[r];
    if(r < 3) for(let s=0;s<3;s++){ box(a, cuts[s], y-0.22, cuts[s+1], y+0.22, rgba(C.in, cols[s]), {stroke:C.in, width:1.4, opacity:o});
      if(o > 0.5) lbl(a, (cuts[s]+cuts[s+1])/2, y-0.06, 's_'+(s+1), C.in, 'middle', 15); }
    else { box(a, 0, y-0.22, 1, y+0.22, rgba(C.in, 0.22), {stroke:C.in, width:1.4, opacity:o}); }
    if(o > 0.5){ lbl(a, -0.03, y-0.06, num(lo, 3).replace(/\.?0+$/,'') || '0', C.ink, 'end', 15); lbl(a, 1.03, y-0.06, num(hi, 3).replace(/\.?0+$/,''), C.ink, 'start', 15); }
    if(r < 3){ const on = clamp01(f-r); if(on > 0.02){ const s = AR_SEQ[r];
      box(a, cuts[s], y-0.22, cuts[s+1], y+0.22, 'none', {stroke:C.mid, width:3, opacity:on});
      seg(a, [[cuts[s], y-0.26],[0, y-1.25+0.26]], {color:C.mid, width:1.3, dash:'4 4', opacity:on});
      seg(a, [[cuts[s+1], y-0.26],[1, y-1.25+0.26]], {color:C.mid, width:1.3, dash:'4 4', opacity:on}); } }
  }
  const o4 = clamp01(f-3);
  if(o4 > 0.02){ const [lo, hi] = AR[3], y = 3.7-3*1.25, t0 = (0.375-lo)/(hi-lo), t1 = (0.40625-lo)/(hi-lo);
    box(a, t0, y-0.22, t1, y+0.22, rgba(C.out, 0.3), {stroke:C.out, width:2.4, opacity:o4});
    if(o4 > 0.5){ lbl(a, 0.5, 4.12, 'w=0.7\\times0.7\\times0.2=0.098,\\quad -\\log_2w=3.35', C.ink, 'middle', 15);
      lbl(a, (t0+t1)/2, y-0.62, '0.\\mathtt{01100}_2=0.375', C.out, 'middle', 15); } }
  return a.svg();
}
const LZ_PH = ['0','00','1','01','11','001','010','0101'];
const LZ_PT = LZ_PH.map(ph=>[ph.length > 1 ? LZ_PH.indexOf(ph.slice(0,-1))+1 : 0, ph.slice(-1)]);
function figLZ(v){
  const f = Math.min(8, frameOf(v, 8)), k = Math.round(f), Ht = takeH(430), hA = Math.round(0.28*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.3,18.3], yr:[-0.9,1.4], pad:{l:14,r:14,t:10,b:6}}));
  let pos = 0;
  LZ_PH.forEach((ph,i)=>{ const done = i < k, cur = i === k-1;
    for(let j=0;j<ph.length;j++){ const x = pos+j;
      box(a, x+0.06, 0, x+0.94, 1.1, rgba(done ? (cur ? C.mid : C.in) : C.muted, done ? 0.22 : 0.08), {stroke: done ? (cur ? C.mid : C.in) : C.muted, width:1.3});
      txt(a, x+0.5, 0.42, ph[j], done ? (cur ? C.mid : C.in) : C.muted, 'middle', 16, {dy:6}); }
    if(done) seg(a, [[pos+ph.length, -0.25],[pos+ph.length, 1.3]], {color:C.ink, width:1.6});
    if(done) txt(a, pos+ph.length/2, -0.55, String(i+1), cur ? C.mid : C.muted, 'middle', 13, {dy:4});
    pos += ph.length; });
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-0.5,5.6], yr:[-0.7,5.7], pad:{l:14,r:14,t:14,b:10}}));
  if(k > 0){
    const t = drawTree(b, LZ_PH.slice(0,k), LZ_PH.slice(0,k).map((_,i)=>String(i+1)), {dx:1.1, fitH:4.2, hot:LZ_PH[k-1]});
    b.note(0, t.Y(''), '0', {tex:true, fs:14, color:C.muted, anchor:'end', dx:-10});
    const [pt, bit] = LZ_PT[k-1];
    lbl(b, 5.5, 5.35, '\\text{phrase }'+k+':\\ \\mathtt{'+LZ_PH[k-1]+'}\\to('+pt+',\\mathtt{'+bit+'})', C.mid, 'end', 16);
  } else lbl(b, 2.5, 2.5, '\\text{empty dictionary: entry }0', C.muted, 'middle', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const LZL = { seed:6301, p:0.1, E:[] };
function lzLong(){
  if(LZL.E.length) return LZL.E;
  const N = 1000000, r = rng(LZL.seed), nxt = new Map(); let node = 0, count = 0, cost = 0, e = 2;
  for(let i=1;i<=N;i++){ const b = r() < LZL.p ? 1 : 0, key = node*2+b;
    if(nxt.has(key)) node = nxt.get(key);
    else { count++; nxt.set(key, count); cost += (count > 1 ? Math.ceil(lg(count)) : 0) + 1; node = 0; }
    while(e <= 6.0001 && i === Math.round(Math.pow(10, e))){ LZL.E.push([e, cost/i]); e = Math.round((e+0.1)*10)/10; }
  }
  return LZL.E;
}
function figLZLong(v){
  const e = v ? v.e : 3, E = lzLong(), pt = E.reduce((b,q)=>Math.abs(q[0]-e) < Math.abs(b[0]-e) ? q : b, E[0]);
  const a = TAx(SZ({xr:[1.8,6.2], yr:[0,1.25], xlabel:'n\\;(\\text{source bits})', ylabel:'\\text{bits sent a source bit}', xt:[2,3,4,5,6], xfmt:P.decade, yticksOverride:[0,0.5,1]}));
  a.hline(1, {color:C.ink, dash:'2 4', width:1.4, opacity:1});
  a.hline(hb(LZL.p), {color:C.in, dash:'6 4', width:1.8, opacity:1});
  seg(a, E, {color:C.mid, width:2.6});
  dot(a, pt[0], pt[1], {color:C.mid, r:7});
  lbl(a, 6.1, 1.06, '\\text{one bit a symbol}', C.ink, 'end', 15);
  lbl(a, 6.1, hb(LZL.p)-(P.labelScale() > 1 ? 0.17 : 0.1), 'H_b(0.1)=0.469', C.in, 'end', 15);
  lbl(a, 1.9, P.labelScale() > 1 ? 0.08 : 0.18, 'n=10^{'+num(pt[0],1)+'}:\\ '+num(pt[1],3)+'\\text{ bits a source bit}', C.mid, 'start', 16);
  return a.svg();
}

/* ---- 6.4 channels and mutual information ------------------------------------ */
function figDMC(){
  const a = P.Axes(bare(SZ({xr:[-0.25,1.25], yr:[-0.45,1.45]})));
  chanDiag(a, [['x_0',1],['x_1',0]], [['y_0',1],['y_1',0]], [[0,0,'keep'],[0,1,'flip'],[1,1,'keep'],[1,0,'flip']]);
  lbl(a, 0.62, 1.1, '0.8', C.h, 'middle', 17); lbl(a, 0.62, -0.24, '0.7', C.h, 'middle', 17);
  lbl(a, 0.38, 0.83, '0.2', C.err, 'middle', 17); lbl(a, 0.38, 0.05, '0.3', C.err, 'middle', 17);
  return a.svg();
}
function figInputDist(v){
  const q = v ? v.q : 0.75, J = [[DMC[0][0]*q, DMC[0][1]*q],[DMC[1][0]*(1-q), DMC[1][1]*(1-q)]];
  const py0 = J[0][0]+J[1][0];
  const a = P.Axes(bare(SZ({xr:[-0.3,1.06], yr:[-0.3,3.3]})));
  let x = 0;
  [[0,0],[1,0],[0,1],[1,1]].forEach(([j,k])=>{ const w = J[j][k], col = j===k ? C.h : C.err;
    box(a, x, 2.0, x+w, 2.8, rgba(col, 0.26), {stroke:col, width:1.6});
    if(w > 0.08) lbl(a, x+w/2, 2.28, num(w,3), col, 'middle', 15);
    x += w; });
  lbl(a, -0.03, 2.28, 'p(x,y)', C.ink, 'end', 16);
  box(a, 0, 0.6, py0, 1.4, rgba(C.out, 0.3), {stroke:C.out, width:1.6});
  box(a, py0, 0.6, 1, 1.4, rgba(C.out, 0.14), {stroke:C.out, width:1.6});
  lbl(a, -0.03, 0.88, 'p(y)', C.ink, 'end', 16);
  if(py0 > 0.12) lbl(a, py0/2, 0.88, 'p(y_0)='+num(py0,3), C.out, 'middle', 16);
  if(1-py0 > 0.12) lbl(a, (1+py0)/2, 0.88, num(1-py0,3), C.out, 'middle', 16);
  seg(a, [[J[0][0]+J[1][0], 2.0],[py0, 1.4]], {color:C.muted, width:1.2, dash:'4 4'});
  return a.svg();
}
function figBSC(v){
  const g = v ? v.g : 4, p = Qf(Math.sqrt(2*dB(g))), Ht = takeH(430), hA = Math.round(0.46*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.25,1.25], yr:[-0.5,1.5], pad:{l:14,r:14,t:12,b:10}}));
  chanDiag(a, [['0',1],['1',0]], [['0',1],['1',0]], [[0,0,'keep'],[0,1,'flip'],[1,1,'keep'],[1,0,'flip']]);
  lbl(a, 0.62, 1.13, '1-p', C.h, 'middle', 17); lbl(a, 0.62, -0.3, '1-p', C.h, 'middle', 17);
  lbl(a, 0.38, 0.8, 'p', C.err, 'middle', 17); lbl(a, 0.38, 0.06, 'p', C.err, 'middle', 17);
  const b = logAx({w:560, h:Ht-hA, xr:[0,10.4], yr:[-6,-0.2], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'p', pad:{l:62,r:26,t:24,b:42}, xt:[0,2,4,6,8,10], yticksOverride:P.decades(-6,-1)});
  b.curve(d=>lg10(Qf(Math.sqrt(2*dB(d)))), {color:C.err, width:2.6});
  dot(b, g, Math.log10(p), {color:C.err, r:7});
  lbl(b, 0.3, -5.2, 'p=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)='+sci(p,2), C.err, 'start', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const JPMF = [[0.4,0.1],[0.1,0.4]];
function figJoint(v){
  const f = Math.min(2, frameOf(v, 2)), Ht = takeH(430), hA = Math.round(0.55*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-1.2,3.2], yr:[-0.3,2.6], pad:{l:14,r:14,t:10,b:6}}));
  for(let j=0;j<2;j++) for(let k=0;k<2;k++) tile(a, 0.2+k*0.95, 1.2-j*0.95, 0.9, 0.9, JPMF[j][k], C.in, String(JPMF[j][k]), {max:0.4, fs:19});
  ['x_0','x_1'].forEach((s,j)=>lbl(a, 0.1, 1.58-j*0.95, s, C.in, 'end', 17));
  ['y_0','y_1'].forEach((s,k)=>lbl(a, 0.65+k*0.95, 2.22, s, C.out, 'middle', 17));
  lbl(a, 2.25, 1.58, 'p(x_0)=0.5', C.in, 'start', 15); lbl(a, 2.25, 0.63, 'p(x_1)=0.5', C.in, 'start', 15);
  const HXY = H([0.4,0.1,0.1,0.4]);
  const b = P.Axes(bare({w:560, h:Ht-hA, xr:[-0.15,2.15], yr:[-1.3,1.6], pad:{l:14,r:14,t:10,b:10}}));
  box(b, 0, 0.1, HXY, 0.7, rgba(C.muted, 0.1), {stroke:C.muted, width:1.6});
  lbl(b, HXY/2, 1.0, 'H(X,Y)='+num(HXY,4), C.ink, 'middle', 16);
  const o1 = clamp01(f), o2 = clamp01(f-1);
  if(o1 > 0.02){ box(b, 0, 0.1, 1, 0.7, rgba(C.in, 0.28), {stroke:C.in, width:1.8, opacity:o1}); if(o1 > 0.5) lbl(b, 0.5, -0.5, 'H(X)=1', C.in, 'middle', 16); }
  if(o2 > 0.02){ box(b, 1, 0.1, HXY, 0.7, rgba(C.h, 0.28), {stroke:C.h, width:1.8, opacity:o2}); if(o2 > 0.5) lbl(b, 1+(HXY-1)/2, -0.5, 'H(Y\\mid X)='+num(HXY-1,4), C.h, 'middle', 16); }
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const CE = (()=>{ const q = 0.75, j = [[0.8*q, 0.2*q],[0.3*(1-q), 0.7*(1-q)]], py = [j[0][0]+j[1][0], j[0][1]+j[1][1]];
  const h0 = hb(j[0][0]/py[0]), h1 = hb(j[0][1]/py[1]);
  return { py, h0, h1, avg:py[0]*h0+py[1]*h1, HX:hb(q), HYX:q*hb(0.2)+(1-q)*hb(0.3) }; })();
function figCondEnt(v){
  const f = Math.min(3, frameOf(v, 3));
  const a = TAx(SZ({xr:[-0.72,1.22], yr:[-0.2,5.2], xlabel:'\\text{bits}', xt:[0,0.5,1], yticksOverride:[], grid:false}));
  a.vline(0, {color:C.muted, dash:'2 4', width:1, opacity:1});
  const rows = [
    ['H(X)', CE.HX, C.in, 0],
    ['H(X\\mid y_0)', CE.h0, C.err, 0],
    ['H(X\\mid y_1)', CE.h1, C.err, 1],
    ['H(X\\mid Y)', CE.avg, C.err, 2],
    ['H(Y\\mid X)', CE.HYX, C.h, 3]];
  rows.forEach(([nm, val, col, at], i)=>{ const o = at === 0 ? 1 : clamp01(f-at+1); if(o < 0.02) return; const y = 4.4 - 1.02*i;
    box(a, 0, y-0.3, val, y+0.3, rgba(col, 0.26), {stroke:col, width:1.8, opacity:o});
    if(o > 0.5){ lbl(a, -0.04, y-0.1, nm, col, 'end', 16); lbl(a, val+0.03, y-0.1, num(val,3), col, 'start', 16); } });
  return a.svg();
}
const MI_KEY = [[C.err,'H(X\\mid Y)'],[C.out,'I(X;Y)'],[C.h,'H(Y\\mid X)']];
function figMutual(v){
  const p = v ? v.p : 0.1, r = chan(BSC(p), [0.5,0.5]);
  const a = P.Axes(bare(SZ({xr:[-0.08,2.08], yr:[-1.6,2.0]})));
  infoBar(a, r);
  lbl(a, (r.HXgY+r.I)/2, 0.95, 'H(X)=1', C.in, 'middle', 16);
  lbl(a, (r.HXgY+r.HXY)/2, -0.72, 'H(Y)=1', C.out, 'middle', 16);
  lbl(a, 0, 1.6, 'p='+num(p,2)+':\\ \\ I='+num(r.I,3), C.out, 'start', 17);
  lbl(a, 0, -1.4, 'H(X,Y)='+num(r.HXY,3), C.ink, 'start', 16);
  legend(a, MI_KEY, {w:140});
  return a.svg();
}
function figMutualProps(){
  const r = chan(BSC(0.25), [0.5,0.5]);
  const a = P.Axes(bare(SZ({xr:[-0.08,2.08], yr:[-1.6,2.0]})));
  infoBar(a, r);
  lbl(a, (r.HXgY+r.I)/2, 0.95, 'H(X)=1', C.in, 'middle', 16);
  lbl(a, (r.HXgY+r.HXY)/2, -0.72, 'H(Y)=1', C.out, 'middle', 16);
  lbl(a, 0, 1.6, 'p=0.25:\\ \\ I='+num(r.I,3), C.out, 'start', 17);
  lbl(a, 0, -1.4, 'H(X,Y)=H(X)+H(Y)-I='+num(r.HXY,3), C.ink, 'start', 16);
  legend(a, MI_KEY, {w:140});
  return a.svg();
}

/* ---- 6.5 channel capacity -------------------------------------------------- */
const CZ = capBinary(ZCH, 4000);
function figCapacity(v){
  const q = v ? v.q : 0.5, rb = chan(BSC(0.1), [q,1-q]).I, rz = chan(ZCH, [q,1-q]).I;
  const a = TAx(SZ({xr:[0,1], yr:[0,0.72], xlabel:'q=p(x_0)', ylabel:'I(X;Y)\\;(\\text{bits})', xt:[0,0.25,0.5,0.75,1], yticksOverride:[0,0.2,0.4,0.6]}));
  a.curve(u=>chan(BSC(0.1), [u,1-u]).I, {color:C.out, width:2.6});
  a.curve(u=>chan(ZCH, [u,1-u]).I, {color:C.out, width:2.6, dash:'8 5'});
  ring(a, 0.5, 1-hb(0.1), {color:C.ink, r:10, width:1.6}); ring(a, CZ.q, CZ.I, {color:C.ink, r:10, width:1.6});
  seg(a, [[q,0],[q,0.6]], {color:C.ink, dash:'5 4', width:1.2});
  dot(a, q, rb, {color:C.out, r:6.5}); dot(a, q, rz, {color:C.out, r:6.5});
  lbl(a, 0.03, 0.66, 'q='+num(q,2)+':\\ \\ I_{\\text{BSC}}='+num(rb,3)+',\\ \\ I_{\\text{Z}}='+num(rz,3), C.ink, 'start', 16);
  return a.svg();
}
/* The slide asks the reader to draw C(p) first; the page shows the answer. */
function figBSCcap(){
  const a = TAx(SZ({xr:[0,1], yr:[0,1.18], xlabel:'p', ylabel:'\\text{bits per use}', xt:[0,0.25,0.5,0.75,1], yticksOverride:[0,0.5,1]}));
  trace(a, hb, 0.001, 0.999, {color:C.h, width:1.8, dash:'6 5', opacity:0.75});
  lbl(a, 0.5, 1.06, 'H_b(p)', C.h, 'middle', 16);
  trace(a, u=>1-hb(u), 0.0005, 0.9995, {color:C.out, width:2.8, n:900});
  lbl(a, 0.5, 0.3, 'C=1-H_b(p)', C.out, 'middle', 16);
  return a.svg();
}
function figBEC(v){
  const e = v ? v.e : 0.1, Ht = takeH(430), hA = Math.round(0.44*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.25,1.25], yr:[-0.35,1.35], pad:{l:14,r:14,t:12,b:10}}));
  chanDiag(a, [['0',1],['1',0]], [['0',1],['e',0.5],['1',0]], [[0,0,'keep'],[0,1,'erase'],[1,2,'keep'],[1,1,'erase']]);
  lbl(a, 0.55, 1.1, '1-\\epsilon', C.h, 'middle', 17); lbl(a, 0.55, -0.24, '1-\\epsilon', C.h, 'middle', 17);
  lbl(a, 0.3, 0.62, '\\epsilon', C.h, 'middle', 17); lbl(a, 0.3, 0.3, '\\epsilon', C.h, 'middle', 17);
  const b = TAx({w:560, h:Ht-hA, xr:[0,0.5], yr:[0,1.15], xlabel:'\\epsilon', ylabel:'C\\;(\\text{bits per use})', pad:{l:56,r:26,t:24,b:42}, xt:[0,0.1,0.2,0.3,0.4,0.5], yticksOverride:[0,0.5,1]});
  b.curve(u=>1-u, {color:C.out, width:2.6});
  b.curve(u=>1-hb(u), {color:C.out, width:2.6, dash:'8 5'});
  dot(b, e, 1-e, {color:C.out, r:6.5}); dot(b, e, 1-hb(e), {color:C.out, r:6.5});
  lbl(b, 0.49, 1.03, '\\epsilon='+num(e,2)+':\\ \\text{BEC }'+num(1-e,3)+',\\ \\text{BSC }'+num(1-hb(e),3), C.ink, 'end', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
function figZ(){
  const Ht = takeH(430), hA = Math.round(0.42*Ht);
  const a = P.Axes(bare({w:560, h:hA, xr:[-0.25,1.25], yr:[-0.4,1.4], pad:{l:14,r:14,t:12,b:10}}));
  chanDiag(a, [['0',1],['1',0]], [['0',1],['1',0]], [[0,0,'keep'],[1,0,'flip'],[1,1,'keep']]);
  lbl(a, 0.55, 1.12, '1', C.h, 'middle', 17); lbl(a, 0.55, -0.27, '\\tfrac12', C.h, 'middle', 17); lbl(a, 0.3, 0.46, '\\tfrac12', C.err, 'middle', 17);
  const b = TAx({w:560, h:Ht-hA, xr:[0,1], yr:[0,0.44], xlabel:'q=P(X=0)', ylabel:'I(X;Y)\\;(\\text{bits})', pad:{l:56,r:26,t:24,b:42}, xt:[0,0.25,0.5,0.75,1], yticksOverride:[0.1,0.2,0.3,0.4]});
  b.curve(u=>chan(ZCH,[u,1-u]).I, {color:C.out, width:2.6});
  b.vline(0.6, {color:C.ink, dash:'5 4', width:1.3, opacity:1});
  dot(b, 0.6, chan(ZCH,[0.6,0.4]).I, {color:C.out, r:7});
  dot(b, 0.5, chan(ZCH,[0.5,0.5]).I, {color:C.muted, r:5});
  lbl(b, 0.63, 0.395, 'q^{*}=0.6,\\ C=0.3219', C.out, 'start', 16);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const SYM = [[0.6,0.2,0.2],[0.2,0.6,0.2],[0.2,0.2,0.6]];
function figSym(){
  const a = P.Axes(bare(SZ({xr:[-1.1,4.3], yr:[-1.5,3.9]})));
  for(let j=0;j<3;j++) for(let k=0;k<3;k++) tile(a, k, 2-j, 0.95, 0.95, SYM[j][k], C.h, String(SYM[j][k]), {max:0.6, fs:19});
  ['x_0','x_1','x_2'].forEach((s,j)=>lbl(a, -0.12, 2.42-j, s, C.in, 'end', 17));
  ['y_0','y_1','y_2'].forEach((s,k)=>lbl(a, k+0.47, 3.2, s, C.out, 'middle', 17));
  [0,1,2].forEach(k=>tile(a, k, -1.2, 0.95, 0.6, 1/3, C.out, '\\tfrac13', {max:1, fs:17}));
  lbl(a, -0.12, -1.0, 'p(y)', C.out, 'end', 16);
  lbl(a, 3.1, 1.52, '\\text{each row: }', C.ink, 'start', 15);
  lbl(a, 3.1, 1.0, 'H=1.371', C.h, 'start', 16);
  return a.svg();
}
const WC = [[0.5,0.5,0,0],[0,0.5,0.5,0],[0,0,0.5,0.5],[0.5,0,0,0.5]];
const WC_BLOBS = [[-2.2,1.2],[0.1,1.6],[2.3,1.1],[-1.3,-1.0],[1.2,-1.1],[3.3,-0.6],[-3.3,-0.4]];
function figWhyCap(v){
  const f = Math.min(3, frameOf(v, 3)), oA = 1-clamp01(f-1.5), oB = clamp01(f-1.5), Ht = takeH(380);
  const a = P.Axes(bare(SZ({xr:[-1.4,4.6], yr:[-0.9,4.4], h:Ht})));
  if(oA > 0.02){ const keep = j => j % 2 === 0, dim = clamp01(f);
    for(let j=0;j<4;j++) for(let k=0;k<4;k++){ const o = oA*(keep(j) ? 1 : 1-0.75*dim);
      tile(a, k, 3-j, 0.92, 0.92, WC[j][k], C.h, WC[j][k] ? '\\tfrac12' : '', {max:0.5, fs:17, opacity:o}); }
    if(oA > 0.5){ [0,1,2,3].forEach(j=>lbl(a, -0.12, 3.4-j, 'x_'+j, C.in, 'end', 17)); [0,1,2,3].forEach(k=>lbl(a, k+0.46, 4.1, 'y_'+k, C.out, 'middle', 17));
      lbl(a, 1.95, -0.6, f < 0.5 ? '\\text{each output could come from two inputs}' : '\\text{use }x_0,\\,x_2\\text{ only: no confusion, 1 bit a use}', C.ink, 'middle', 15); } }
  if(oB > 0.02){ const b = planeAx([[-4.8,4.8],[-3.5,3.4]], {h:Ht});
    box(b, -4.5, -2.5, 4.5, 2.6, rgba(C.out, 0.06), {stroke:C.out, width:1.6, opacity:oB});
    WC_BLOBS.forEach(([x,y])=>{ disc(b, x, y, 0.95, rgba(C.in, 0.16), {stroke:C.in, width:1.4, opacity:oB}); dot(b, x, y, {color:C.in, r:5, opacity:oB}); });
    if(oB > 0.5){ lbl(b, 0, 2.85, '2^{n}\\text{ output words}', C.out, 'middle', 16);
      lbl(b, 0, -3.05, f < 2.5 ? '\\text{each codeword: about }2^{nH_b(p)}\\text{ likely outputs}' : '2^{n}/2^{nH_b(p)}=2^{n(1-H_b(p))}\\text{ codewords fit}', f < 2.5 ? C.in : C.out, 'middle', 16); }
    return `<svg viewBox="0 0 560 ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img">${oA > 0.02 ? place(a.svg(),0,0,560,Ht) : ''}${place(b.svg(),0,0,560,Ht)}</svg>`; }
  return a.svg();
}
const repPe = (n, p) => { let s = 0; for(let k=Math.floor(n/2)+1;k<=n;k++) s += Math.exp(LF[n]-LF[k]-LF[n-k])*Math.pow(p,k)*Math.pow(1-p,n-k); return s; };
function figRepetition(v){
  const n = v ? v.n : 3, C1 = 1-hb(0.1);
  const a = logAx(SZ({xr:[0,1.08], yr:[-5.5,0], xlabel:'R\\;(\\text{bits per use})', ylabel:'P_e', xt:[0,0.25,0.5,0.75], yticksOverride:P.decades(-5,-1)}));
  box(a, 0, -5.5, C1, 0, rgba(C.out, 0.1));
  a.vline(C1, {color:C.out, dash:'1 0', width:2.2, opacity:1});
  lbl(a, C1+0.02, -0.4, 'C=0.531', C.out, 'start', 16);
  const pts = []; for(let m=1;m<=15;m+=2) pts.push([1/m, Math.log10(repPe(m, 0.1))]);
  seg(a, pts, {color:C.mid, width:1.6, dash:'4 4'});
  pts.forEach(([x,y])=>dot(a, x, y, {color:C.mid, r:5.5}));
  ring(a, 1/n, Math.log10(repPe(n,0.1)), {color:C.mid, r:11, width:2.2});
  lbl(a, 1.05, -4.0, 'n='+n+',\\ R=1/'+n, C.mid, 'end', 16);
  lbl(a, 1.05, -4.7, 'P_e='+sci(repPe(n,0.1),2), C.mid, 'end', 16);
  return a.svg();
}
function figCodingThm(){
  const a = TAx(SZ({xr:[0,0.5], yr:[0,1.12], xlabel:'p', ylabel:'R\\;(\\text{bits per use})', xt:[0,0.1,0.2,0.3,0.4,0.5], yticksOverride:[0,0.5,1]}));
  wash(a, u=>1-hb(u), 0, 0.5, C.out, 0.16);
  a.area(()=>1.12, 0, 0.5, {color:rgba(C.err, 0.06)});
  a.curve(u=>1-hb(u), {color:C.out, width:2.6});
  a.hline(0.5, {color:C.ink, dash:'6 4', width:1.4, opacity:1});
  a.vline(0.11, {color:C.ink, dash:'3 4', width:1.2, opacity:1});
  [1,3,5,7].forEach(m=>dot(a, 0.1, 1/m, {color:C.mid, r:5.5}));
  lbl(a, 0.22, 0.035, '\\text{reliable: }R<C', C.out, 'middle', 15);
  lbl(a, 0.3, 0.9, '\\text{impossible: }R>C', C.err, 'middle', 17);
  lbl(a, 0.125, 0.57, 'p=0.11', C.ink, 'start', 15);
  return a.svg();
}
const HAM = (()=>{ const words = [];
  for(let m=0;m<16;m++){ const c = new Array(8).fill(0); [3,5,6,7].forEach((pos,i)=>{ c[pos] = (m >> (3-i)) & 1; });
    c[1] = c[3]^c[5]^c[7]; c[2] = c[3]^c[6]^c[7]; c[4] = c[5]^c[6]^c[7]; words.push(c.slice(1)); }
  return {words}; })();
const HAM_C = [0,1,1,0,0,1,1], HAM_ERR = 5;
const HAM_POS = {1:[-1.25,0.72], 2:[1.25,0.72], 3:[0,0.95], 4:[0,-1.45], 5:[-0.62,-0.35], 6:[0.62,-0.35], 7:[0,0.05]};
const HAM_CIRC = [[-0.62,0.3],[0.62,0.3],[0,-0.72]];
const syn = w => [1,2,4].map(b=>[1,2,3,4,5,6,7].filter(i=>i&b).reduce((s,i)=>s^w[i-1],0));
function figHamming(v){
  const f = Math.min(4, frameOf(v, 4)), o0 = 1-clamp01(f);
  if(o0 > 0.5){ const a = P.Axes(bare(SZ({xr:[0,4.2], yr:[-0.6,8.4]})));
    HAM.words.forEach((w,i)=>{ const col = Math.floor(i/8), row = i%8, x = 0.2+2.1*col, y = 7.6-row*1.0;
      lbl(a, x, y-0.18, '\\mathtt{'+w.join('')+'}', C.mid, 'start', 17);
      lbl(a, x+1.45, y-0.18, String(w.reduce((s,b)=>s+b,0)), C.muted, 'start', 15); });
    lbl(a, 2.1, -0.35, '16\\text{ codewords, weights at right: }d_{\\min}=3', C.ink, 'middle', 15);
    return a.svg(); }
  const a = planeAx([[-2.6,2.6],[-2.4,2.9]]);
  const w = HAM_C.slice(); if(f >= 1.5 && f < 3.5) w[HAM_ERR-1] ^= 1;
  const s = syn(w), bad = f >= 2.5 && f < 3.5 ? s : [0,0,0];
  HAM_CIRC.forEach(([cx,cy],i)=>disc(a, cx, cy, 1.25, bad[i] ? rgba(C.err, 0.12) : rgba(C.mid, 0.05), {stroke: bad[i] ? C.err : C.mid, width:2}));
  for(let i=1;i<=7;i++){ const [x,y] = HAM_POS[i], data = [3,5,6,7].includes(i), hit = i === HAM_ERR && f >= 1.5;
    const col = hit ? (f >= 3.5 ? C.out : C.err) : (data ? C.in : C.mid), o = data ? 1 : clamp01(f-0.2);
    if(o > 0.3){ txt(a, x, y, String(w[i-1]), col, 'middle', 22, {dy:7, weight:600}); txt(a, x + (x < 0 ? -0.28 : 0.3), y+0.28, String(i), C.muted, 'middle', 11); } }
  const row = w.join('');
  lbl(a, -2.5, 2.55, (f >= 1.5 && f < 3.5 ? 'r=' : 'c=')+'\\mathtt{'+row+'}', f >= 1.5 && f < 3.5 ? C.err : (f >= 3.5 ? C.out : C.mid), 'start', 18);
  if(f >= 2.5 && f < 3.5) lbl(a, 2.5, 2.55, 's=(s_4s_2s_1)=\\mathtt{'+s[2]+s[1]+s[0]+'}=5', C.err, 'end', 17);
  if(f >= 3.5) lbl(a, 2.5, 2.55, '\\text{flip bit }5', C.out, 'end', 17);
  return a.svg();
}
const TR_H = hb(0.1);
const TR_E = reach(e=>1-hb(e)-TR_H, 0, 1e-9, 0.5);
function figTransmission(v){
  const e = v ? v.e : 0.05, c = 1-hb(e), ok = c > TR_H;
  const a = TAx(SZ({xr:[0,1], yr:[0,1.18], xlabel:'\\epsilon', ylabel:'\\text{bits per use}', xt:[0,0.25,0.75,1], yticksOverride:[0,0.5,1]}));
  box(a, 0, 0, TR_E, 1.18, rgba(C.out, 0.1)); box(a, 1-TR_E, 0, 1, 1.18, rgba(C.out, 0.1));
  a.curve(u=>1-hb(u), {color:C.out, width:2.6});
  a.hline(TR_H, {color:C.in, dash:'6 4', width:1.8, opacity:1});
  lbl(a, 0.5, TR_H+0.05, 'H(U)=0.469', C.in, 'middle', 16);
  dot(a, e, c, {color: ok ? C.out : C.err, r:7});
  lbl(a, 0.5, 1.07, '\\epsilon='+num(e,2)+':\\ C='+num(c,3)+(ok ? '>H(U)' : '<H(U)'), ok ? C.out : C.err, 'middle', 17);
  return a.svg();
}

/* ---- 6.6 the Gaussian channel --------------------------------------------- */
const AW_R = 1, AW_BIG = 3, AW_PTS = [[0,0]].concat([0,1,2,3,4,5].map(k=>[2*Math.cos(Math.PI*k/3+Math.PI/6), 2*Math.sin(Math.PI*k/3+Math.PI/6)]));
const AW_Z = gauss(6601, 240, 0.42);
function figAWGN(v){
  const f = Math.min(3, frameOf(v, 3)), a = planeAx([[-4.4,4.4],[-4.3,4.0]]);
  const o1 = clamp01(f), o2 = clamp01(f-1), o3 = clamp01(f-2);
  if(o2 > 0.02){ disc(a, 0, 0, AW_BIG, rgba(C.out, 0.05*o2), {stroke:C.out, width:2, dash:'7 5', opacity:o2}); }
  AW_PTS.forEach(([x,y],i)=>{ const o = i === 0 ? 1 : o1; if(o < 0.02) return;
    disc(a, x, y, AW_R, rgba(C.in, 0.12), {stroke:C.in, width:1.4, dash:'4 4', opacity:o});
    dot(a, x, y, {color:C.in, r:5.5, opacity:o}); });
  cloudPts(a, AW_Z.slice(0,120).map((u,i)=>[u, AW_Z[120+i]]), {r:1.9, opacity:1-0.7*o1});
  if(f < 0.5) lbl(a, 1.25, 1.35, '\\text{radius }\\sqrt{nP_N}', C.in, 'start', 16);
  if(o2 > 0.5) lbl(a, 0, 3.35, '\\text{radius }\\sqrt{n(P+P_N)}', C.out, 'middle', 16);
  if(o3 > 0.5) lbl(a, 0, -3.75, 'M\\approx\\bigl(1+P/P_N\\bigr)^{n/2}', C.ink, 'middle', 16);
  return a.svg();
}
function figShannon(v){
  const s = v ? v.s : 11.76, snr = dB(s), c = lg(1+snr);
  const a = TAxL(SZ({xr:[-10,30], yr:[0,11.8], xlabel:'\\text{SNR}\\;(\\text{dB})', ylabel:'C/W\\;(\\text{b/s/Hz})', xt:[-10,0,10,20], yticksOverride:[0,2,4,6,8,10], zeroAxes:false}));
  a.curve(d=>lg(1+dB(d)), {color:C.out, width:2.6});
  seg(a, [[s,0],[s,c],[-10,c]], {color:C.ink, width:1.3, dash:'5 4'});
  dot(a, s, c, {color:C.out, r:7});
  lbl(a, -9, 10.95, '\\text{SNR}='+num(snr, snr < 10 ? 2 : 1)+':\\ \\ C/W='+num(c,2), C.out, 'start', 16);
  return a.svg();
}
function figPhone(){
  const a = TAx(SZ({xr:[0,40], yr:[0,44], xlabel:'\\text{SNR}\\;(\\text{dB})', ylabel:'C\\;(\\text{kb/s})', xt:[0,10,20,30,40], yticksOverride:[0,10,20,30,40]}));
  a.curve(d=>3.1*lg(1+dB(d)), {color:C.out, width:2.6});
  dot(a, 30, 3.1*lg(1001), {color:C.out, r:7});
  lbl(a, 29, 3.1*lg(1001)+3, '30\\text{ dB}:\\ 30.9\\text{ kb/s}', C.out, 'end', 16);
  ring(a, todB(30), 3.1*lg(31), {color:C.err, r:10, width:2.2});
  lbl(a, todB(30)+1.2, 3.1*lg(31)-4.2, '\\log_2(1+30):\\ 15.4\\text{ kb/s}', C.err, 'start', 16);
  return a.svg();
}
function figBandwidth(v){
  const u = v ? v.w : 0, x = Math.pow(10, u), c = x*lg(1+1/x), Ht = takeH(430), hA = Math.round(0.56*Ht);
  const a = TAxL({w:560, h:hA, xr:[-1.05,2.05], yr:[0,1.75], xlabel:'WN_0/P', ylabel:'C/(P/N_0)', pad:{l:62,r:26,t:24,b:42}, xt:[-1,0,1,2], xfmt:P.decade, yticksOverride:[0,0.5,1], zeroAxes:false});
  a.hline(1/Math.LN2, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  a.curve(t=>Math.pow(10,t)*lg(1+Math.pow(10,-t)), {color:C.out, width:2.6});
  dot(a, u, c, {color:C.out, r:7});
  lbl(a, -0.95, 1/Math.LN2+0.1, '1/\\ln2=1.443', C.ink, 'start', 15);
  lbl(a, 2.0, 0.2, 'WN_0/P='+num(x, x < 1 ? 2 : 1)+':\\ C='+num(c,3)+'\\,P/N_0', C.out, 'end', 16);
  const b = TAx({w:560, h:Ht-hA, xr:[0,100], yr:[0,7.6], xlabel:'P/(N_0W)', ylabel:'C/W', pad:{l:62,r:26,t:24,b:42}, xt:[0,25,50,75,100], yticksOverride:[0,2,4,6]});
  b.curve(t=>lg(1+t), {color:C.out, width:2.4, dash:'8 5'});
  lbl(b, 98, 2.3, '\\text{power alone: }\\log_2(1+P/N_0W)', C.out, 'end', 15);
  return stack(560, [[a.svg(),hA],[b.svg(),Ht-hA]]);
}
const PE5 = {
  psk: (M, g) => M===2 ? Qf(Math.sqrt(2*g)) : 2*Qf(Math.sqrt(2*lg(M)*g)*Math.sin(Math.PI/M)),
  qam: (M, g) => 4*(1-1/Math.sqrt(M))*Qf(Math.sqrt(3*lg(M)*g/(M-1))),
  orth:(M, g) => (M-1)*Qf(Math.sqrt(lg(M)*g)) };
const PL5 = [['psk',2,1],['psk',4,2],['psk',8,3],['qam',16,4],['qam',64,6],['orth',4,1],['orth',8,0.75],['orth',16,0.5],['orth',32,0.3125],['orth',64,0.1875]]
  .map(([fam,M,r])=>({fam, M, r, g:reach(d=>PE5[fam](M, dB(d)), 1e-5, -5, 40)}));
const limDB = r => todB((Math.pow(2,r)-1)/r);
function figPlane6(v){
  const u = v ? v.u : 1, r = Math.pow(2, u);
  const a = TAx(SZ({xr:[-3,22], yr:[-3,3], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'r=R_b/W', xt:[0,5,10,15], yticksOverride:[], grid:false, zeroAxes:false}));
  leftTicks(a, [-3,-2,-1,0,1,2,3], t=>t >= 0 ? String(Math.pow(2,t)) : '1/'+Math.pow(2,-t));
  const lim = []; for(let t=-3;t<=3.001;t+=0.05) lim.push([limDB(Math.pow(2,t)), t]);
  const fillPts = lim.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L');
  a.raw(`<path d="M${f2(a.sx(-3))},${f2(a.sy(-3))}L${fillPts}L${f2(a.sx(-3))},${f2(a.sy(3))}Z" fill="${rgba(C.err, 0.1)}" stroke="none"/>`);
  seg(a, lim, {color:C.out, width:2.6});
  a.hline(0, {color:C.muted, width:1, dash:'2 4'});
  PL5.forEach(q=>dot(a, q.g, lg(q.r), {color:C.in, r:5.5}));
  dot(a, limDB(r), u, {color:C.out, r:7});
  lbl(a, 21.5, -2.6, 'r='+num(r, r < 1 ? 3 : 2)+':\\ E_b/N_0\\ge'+num(limDB(r),2)+'\\text{ dB}', C.out, 'end', 16);
  lbl(a, 21.5, 0.25, '\\text{bandwidth-limited}', C.ink, 'end', 14);
  lbl(a, 21.5, -0.7, '\\text{power-limited}', C.ink, 'end', 14);
  lbl(a, -2.6, 2.55, '\\text{impossible}', C.err, 'start', 15);
  return a.svg();
}
const LIM_R = [4, 2, 1, 0.5, 0.1, 0.001];
function figLimit(v){
  const f = Math.min(5, frameOf(v, 5)), i = Math.min(4, Math.floor(f)), t = f-i;
  const u = lg(LIM_R[i]) + (i < 5 ? t*(lg(LIM_R[Math.min(5,i+1)])-lg(LIM_R[i])) : 0), r = Math.pow(2, u);
  const a = TAxL(SZ({xr:[-3,12], yr:[-10.5,2.6], xlabel:'E_b/N_0\\;(\\text{dB})', ylabel:'\\log_2 r', zeroAxes:false, xt:[-1.59,0,3,6,9], xfmt:x=>x.toFixed(x%1 ? 2 : 0), yticksOverride:[-10,-8,-6,-4,-2,0,2]}));
  const lim = []; for(let t=-10.5;t<=2.6;t+=0.05) lim.push([limDB(Math.pow(2,t)), t]);
  seg(a, lim, {color:C.out, width:2.6});
  a.vline(todB(Math.LN2), {color:C.err, dash:'1 0', width:2, opacity:1});
  dot(a, limDB(r), u, {color:C.mid, r:7});
  lbl(a, 11.8, -9.6, 'r='+(r < 0.01 ? '0.001' : num(r, r < 1 ? 2 : 0))+':\\ '+num(limDB(r),2)+'\\text{ dB}', C.mid, 'end', 16);
  if(f > 4.5){ const bp = reach(d=>Qf(Math.sqrt(2*dB(d))), 1e-5, 0, 20);
    dot(a, bp, 0, {color:C.in, r:6.5}); arrow(a, bp-0.3, -1.3, todB(Math.LN2)+0.15, -1.3, {color:C.ink, width:1.6, head:0.7});
    lbl(a, (bp+todB(Math.LN2))/2+1, -0.95, '11.18\\text{ dB}', C.ink, 'middle', 15); lbl(a, bp+0.3, 0.45, '\\text{BPSK}', C.in, 'start', 15); }
  return a.svg();
}
const WF_N = [0.1, 0.2, 0.4, 0.8, 1.6, 3.2];
function waterfill(N, Pt){
  let lo = Math.min(...N), hi = Math.max(...N)+Pt;
  for(let i=0;i<100;i++){ const mu = (lo+hi)/2, used = N.reduce((s,n)=>s+Math.max(0, mu-n), 0); if(used > Pt) hi = mu; else lo = mu; }
  const mu = (lo+hi)/2, pw = N.map(n=>Math.max(0, mu-n));
  return {mu, pw, C:N.reduce((s,n,i)=>s+0.5*lg(1+pw[i]/n), 0), Ceq:N.reduce((s,n)=>s+0.5*lg(1+Pt/N.length/n), 0), used:pw.filter(x=>x>0).length};
}
function figWater(v){
  const Pt = v ? v.P : 1, w = waterfill(WF_N, Pt);
  const a = TAxL(SZ({xr:[-0.4,6.4], yr:[0,4.6], ylabel:'\\text{power, noise}', xt:[], yticksOverride:[0,1,2,3,4]}));
  WF_N.forEach((n,i)=>{ box(a, i+0.1, 0, i+0.9, n, C.noiseSoft, {stroke:C.noise, width:1.4});
    if(w.pw[i] > 0) box(a, i+0.1, n, i+0.9, w.mu, rgba(C.in, 0.3), {stroke:C.in, width:1.6});
    lbl(a, i+0.5, -0.32, 'N_'+(i+1), C.muted, 'middle', 14); });
  a.hline(w.mu, {color:C.ink, dash:'6 4', width:1.6, opacity:1});
  lbl(a, -0.2, 4.25, 'P='+num(Pt,2)+':\\ \\ \\mu='+num(w.mu,3)+',\\ '+w.used+'\\text{ channels used}', C.in, 'start', 16);
  lbl(a, -0.2, 3.7, 'C='+num(w.C,3)+'\\text{ bits, equal shares }'+num(w.Ceq,3), C.out, 'start', 16);
  return a.svg();
}

/* ---- 6.7 summary: a source over a channel ---------------------------------- */
const LINK6 = { Rs:1000, Rc:3000, g:4 };
LINK6.p = Qf(Math.sqrt(2*dB(LINK6.g))); LINK6.C = 1-hb(LINK6.p);
function figChain6(v){
  const f = Math.min(5, frameOf(v, 5)), Ht = takeH(430), hA = Math.round(0.36*Ht), on = k => clamp01(f-k+1);
  const hot = k => Math.round(f) === k ? C.mid : C.ink;
  const blk = P.blocks({w:560, h:hA, items:[
    {t:'box', x:8, y:hA/2-30, w:92, h:60, label:'source', color:hot(0)},
    {t:'arrow', x1:100, y1:hA/2, x2:132, y2:hA/2},
    {t:'box', x:132, y:hA/2-30, w:104, h:60, label:'Huffman', color:hot(2)},
    {t:'arrow', x1:236, y1:hA/2, x2:268, y2:hA/2},
    {t:'box', x:268, y:hA/2-30, w:128, h:60, label:'BPSK + noise', color:hot(3), fs:14},
    {t:'arrow', x1:396, y1:hA/2, x2:428, y2:hA/2},
    {t:'box', x:428, y:hA/2-30, w:124, h:60, label:'BSC', color:hot(4)}]});
  const b = TAx({w:560, h:Ht-hA, xr:[-1250,3200], yr:[-0.5,3.9], xlabel:'\\text{b/s}', pad:{l:24,r:26,t:14,b:42}, xt:[0,1000,2000], yticksOverride:[], grid:false});
  const bars = [[1, 'H\\,R_s', HFIVE*LINK6.Rs, C.in], [2, '\\bar{L}\\,R_s', 2.2*LINK6.Rs, C.mid], [4, 'C\\,R_c', LINK6.C*LINK6.Rc, C.out]];
  bars.forEach(([k, nm, val, col], i)=>{ const o = on(k); if(o < 0.02) return; const y = 2.7-1.05*i;
    box(b, 0, y-0.32, val, y+0.32, rgba(col, 0.28), {stroke:col, width:1.8, opacity:o});
    if(o > 0.5) lbl(b, -60, y-0.1, nm+'='+Math.round(val), col, 'end', 16); });
  if(f > 4.5) lbl(b, 3150, 3.5, '2122<2709:\\ \\text{reliable is possible}', C.out, 'end', 16);
  return `<svg viewBox="0 0 560 ${Ht}" xmlns="http://www.w3.org/2000/svg" role="img">${place(blk,0,0,560,hA)}${place(b.svg(),0,hA,560,Ht-hA)}</svg>`;
}

/* ---- the numbers of the "… around us" galleries ------------------------------
   Each section's gallery is set as a list of its four cases. Every number is
   computed from the same data the slide draws, as the slide computes it. */
const SPEECH = [
  'four score and seven years ago our fathers brought forth on this',
  'continent a new nation conceived in liberty and dedicated to the proposition',
  'that all men are created equal now we are engaged in a',
  'great civil war testing whether that nation or any nation so conceived',
  'and so dedicated can long endure we are met on a great',
  'battle field of that war we have come to dedicate a portion',
  'of that field as a final resting place for those who here',
  'gave their lives that that nation might live it is altogether fitting',
  'and proper that we should do this but in a larger sense',
  'we can not dedicate we can not consecrate we can not hallow',
  'this ground the brave men living and dead who struggled here have',
  'consecrated it far above our poor power to add or detract the',
  'world will little note nor long remember what we say here but',
  'it can never forget what they did here it is for us',
  'the living rather to be dedicated here to the unfinished work which',
  'they who fought here have thus far so nobly advanced it is',
  'rather for us to be here dedicated to the great task remaining',
  'before us that from these honored dead we take increased devotion to',
  'that cause for which they gave the last full measure of devotion',
  'that we here highly resolve that these dead shall not have died',
  'in vain that this nation under god shall have a new birth',
  'of freedom and that government of the people by the people for',
  'the people shall not perish from the earth'
].join(' ');
const LETTERS = (()=>{ const c = {}; for(const ch of SPEECH) c[ch] = (c[ch]||0)+1;
  const n = SPEECH.length, list = Object.keys(c).map(k=>[k, c[k]/n]).sort((x,y)=>y[1]-x[1] || (x[0]<y[0]?-1:1));
  return { list, H:H(list.map(x=>x[1])), K:list.length }; })();
const LOADED = [0.1,0.1,0.1,0.1,0.1,0.5];
const GREY = (()=>{ const c = new Array(8).fill(0); for(let x=0;x<64;x++) for(let y=0;y<64;y++) c[Math.floor(8*((x+0.5)/64)*((y+0.5)/64))]++;
  const p = c.map(v=>v/4096); return { p, H:H(p) }; })();
const PNG_ROW = Array.from({length:32}, (_,n)=>Math.round(60 + 5*n + 3*Math.sin(n/2)));
const PNG_D = PNG_ROW.map((x,n)=>n ? x-PNG_ROW[n-1] : x);
const histH = xs => { const c = {}; xs.forEach(x=>{ c[x] = (c[x]||0)+1; }); return H(Object.values(c).map(v=>v/xs.length)); };
const JPG = (()=>{ const blk = [], cf = [];
  for(let y=0;y<8;y++) for(let x=0;x<8;x++) blk.push(Math.round(128 + 50*Math.cos(Math.PI*(x+0.5)/10) + 20*(y/7) - 10*Math.sin(Math.PI*(x+y)/9)) - 128);
  const cu = u => u ? 1 : Math.SQRT1_2;
  for(let v=0;v<8;v++) for(let u=0;u<8;u++){ let s = 0;
    for(let y=0;y<8;y++) for(let x=0;x<8;x++) s += blk[8*y+x]*Math.cos((2*x+1)*u*Math.PI/16)*Math.cos((2*y+1)*v*Math.PI/16);
    cf.push(Math.round(0.25*cu(u)*cu(v)*s/16)); }
  return {nz:cf.filter(c=>c!==0).length}; })();
const FAX = [180, 12, 260, 8, 90, 30, 400, 6, 150, 16, 576];
const RAIN = chan([[0.8,0.2],[0.1,0.9]], [0.3,0.7]);
const testI = pr => chan([[0.99,0.01],[0.05,0.95]], [pr, 1-pr]).I;
const QZ = (()=>{ const e = [-Infinity,-1.5,-1,-0.5,0,0.5,1,1.5,Infinity], Phi = x => x===Infinity ? 1 : x===-Infinity ? 0 : 1-Qf(x);
  const p = e.slice(1).map((b,i)=>Phi(b)-Phi(e[i])); return {p, H:H(p)}; })();
const cascP = (p, n) => (1-Math.pow(1-2*p, n))/2;
const ZLEAK = [[1,0],[0.1,0.9]], CZL = capBinary(ZLEAK, 4000);

/* A slide figure on the page: drawn at height h (the width stays 560) and set
   at a fraction of the text width, centred, so its labels print at about the
   size of a caption. */
const fig = (fn, v, h, pct) => () => {
  P.hOverride = h || null; const s = fn(v); P.hOverride = null;
  return `<div class="c6fig" style="max-width:${pct||58}%;margin:0 auto;line-height:normal">${s}</div>`;
};

window.C6 = [

{t:'h1', num:'CHAPTER 6', text:'An introduction to information theory'},
/* The slide figures are drawn for the artifact, whose labels set KaTeX at
   1.06em; the page sets them the same way so that no label moves. */
{t:'raw', html:'<style>.c6fig .katex{font-size:1.06em}</style>'},
{t:'p', lead:true, text:'Two numbers set what any code can do. A source has an entropy: the fewest bits a symbol that any lossless code can reach. A channel has a capacity: the most bits a use that any code can carry reliably.'},

/* ================= 6.1 ================= */
{t:'h2', num:'6.1', text:'Information and entropy'},
{t:'p', text:'A source emits one symbol at a time from an alphabet $s_1,\\ldots,s_K$. Symbol $s_k$ appears with probability $p_k$.'},

{t:'h3', text:'Self-information'},
{t:'p', text:'The <b>self-information</b> of a symbol measures the information it carries as minus the logarithm of its probability.'},
{t:'eqbox', cap:'Self-information', tex:'I(s_k)=\\log_2\\frac{1}{p_k}=-\\log_2p_k\\quad\\text{bits}',
 after:'A symbol of probability $p_k$ carries $I(s_k)$ bits when it arrives. Base $2$ gives bits, and base $e$ gives nats.'},
{t:'p', text:'A symbol of probability $1/8$ carries $-\\log_2\\tfrac18=\\log_28=3$ bits: three halvings from certainty. The figure plots $I(p)$ against $p$.'},
{t:'fig', svg:fig(figSelfInfo, {p:0.125}), cap:'Self-information against probability, shown at $p=1/8$, where $I=3$ bits. A rare symbol carries many bits, and a certain one carries none.'},
{t:'box', kind:'note', hd:'Three properties', html:'$I(s_k)\\ge0$, and $I(s_k)=0$ when $p_k=1$. A certain symbol tells nothing.<br>Rarer symbols carry more: $I(s_k)>I(s_j)$ when $p_k<p_j$.<br>Independent symbols add. Their probabilities multiply, and the logarithm turns the product into a sum: $I(s_js_k)=I(s_j)+I(s_k)$.'},
{t:'box', kind:'err', hd:'Common error', html:'Write $-\\log_2p_k$, not $\\log_2p_k$. The logarithm of a probability is negative, and information is not.'},

{t:'h3', text:'Information as yes/no questions'},
{t:'p', text:'A bit has a plain reading as one yes/no question. A question whose two answers are equally likely halves the candidates. One such answer gives one bit.'},
{t:'eqbox', cap:'Equally likely cases', tex:'K=2^{m}\\ \\text{cases}\\;\\Longrightarrow\\;m=\\log_2K\\ \\text{questions}',
 after:'Eight equally likely cards take $\\log_28=3$ questions: the answers cut $8$ to $4$, $4$ to $2$ and $2$ to $1$. Sixteen outcomes take $\\log_216=4$ questions, which halve $16$ to $8$, $4$, $2$ and $1$.'},
{t:'p', text:'A skewed source is searched faster on average by asking about the likely symbol first. Take four symbols with probabilities $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$. The first question asks for $s_1$. The second asks for $s_2$, and the third separates $s_3$ from $s_4$.'},
{t:'eqbox', cap:'Average number of questions', tex:'\\begin{aligned}\\bar{L}&=\\tfrac12(1)+\\tfrac14(2)+\\tfrac18(3)+\\tfrac18(3)\\\\&=0.5+0.5+0.375+0.375\\\\&=1.75=H\\end{aligned}',
 after:'Symbol $s_k$ is found after $-\\log_2p_k$ questions: $1$, $2$, $3$ and $3$ here. So the average number of questions is the average self-information of the source. That average is the entropy $H$, defined next.'},
{t:'fig', svg:fig(figQuestions, {frame:5}), cap:'Top: one of eight equally likely cards found with three yes/no questions. Bottom: the skewed source $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$ asked with a tree, likely symbol first. Shown at the last step, where the average is $\\bar{L}=1.75$.', short:'Information as yes/no questions.'},

{t:'h3', text:'Entropy'},
{t:'p', text:'The <b>entropy</b> of a source is the average self-information of its symbols. Each symbol\'s information is weighted by how often the symbol occurs.'},
{t:'eqbox', cap:'Entropy', tex:'H(S)=\\sum_{k=1}^{K}p_kI(s_k)=-\\sum_{k=1}^{K}p_k\\log_2p_k',
 after:'The average information of a symbol, in bits a symbol.'},
{t:'p', text:'For the source $0.7,0.2,0.1$, write out the three terms and add them.'},
{t:'eqbox', cap:'Entropy of a three-symbol source', tex:'\\begin{aligned}H(S)&=-0.7\\log_20.7-0.2\\log_20.2-0.1\\log_20.1\\\\&=0.360+0.464+0.332\\\\&=1.157\\ \\text{bits}\\end{aligned}',
},
{t:'p', text:'The figure draws both quantities for each symbol: the bits it carries, and that number weighted by its probability.'},
{t:'fig', svg:fig(figEntropyBars, null), cap:'For each symbol of $0.7,0.2,0.1$: the bits it carries (left bar) and its weighted share (right bar). The weighted bars add to $H(S)=1.157$, below $\\log_23=1.585$.'},
{t:'p', text:'The entropy lies between two bounds.'},
{t:'eqbox', cap:'Entropy bounds', tex:'0\\le H(S)\\le\\log_2K',
 after:'The lower bound holds when one symbol has probability $1$ and nothing is in doubt. The upper bound holds when all $K$ symbols are equally likely. With $p_k=1/K$ the sum is $\\sum_k\\tfrac1K\\log_2K=\\log_2K$. Three equal symbols give $\\log_23=1.585$ bits, more than the $1.157$ of the skewed source.'},

{t:'h3', text:'The binary entropy function'},
{t:'p', text:'A source of two symbols with probabilities $p$ and $1-p$ has the <b>binary entropy function</b>.'},
{t:'eqbox', cap:'Binary entropy', tex:'H_b(p)=-p\\log_2p-(1-p)\\log_2(1-p)',
 after:'It is symmetric about $p=\\tfrac12$, where $H_b=1$ bit. It is $0$ only at $p=0$ and $p=1$.'},
{t:'p', text:'The top of the curve is flat: at $p=\\tfrac12$, $H_b=1$ bit, and it falls slowly near the top. At $p=0.11$ the two terms are $-0.11\\log_20.11=0.350$ and $-0.89\\log_20.89=0.150$. So $H_b(0.11)=0.500$ bit.'},
{t:'fig', svg:fig(figHb, {p:0.11}), cap:'The binary entropy function (solid) and its two terms (dashed), shown at $p=0.11$. The top is flat near $p=\\tfrac12$.'},
{t:'p', text:'A <b>binary symmetric source</b> emits equally likely, independent bits. Each bit carries one bit of information, and no lossless code can shorten the stream.'},

{t:'p', text:'A sampled source produces symbols at a fixed rate. Its <b>information rate</b> is the entropy of a sample times the number of samples a second.'},
{t:'ex', hd:'Example 6.1 — the information rate of a source', rows:[
 ['Given','A source band-limited to $W=3$ kHz is sampled at the Nyquist rate. Each sample takes one of four levels with probabilities $0.4,0.3,0.2,0.1$.'],
 ['Find','The information rate $R$ in bits a second.'],
 ['Method','The rate is bits a sample times samples a second, $R=H(S)\\,f_s$. The Nyquist rate of Chapter 1 is $f_s=2W=6000$ samples a second.'],
 ['Solution','$H(S)=-\\sum_kp_k\\log_2p_k=0.529+0.521+0.464+0.332=1.846$ bits a sample. Then $R=1.846\\times6000=11\\,079$ b/s.'],
 ['Check','Four levels carry at most $\\log_24=2$ bits a sample, or $12\\,000$ b/s. The skewed levels carry less, as the entropy bound requires.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Multiply by the sample rate $2W$, not by the bandwidth $W$. Using $3000$ samples a second gives half the rate, $5539$ b/s.'},
{t:'fig', svg:fig(figExRate, null), cap:'Top: the four levels of Example 6.1 and their probabilities. Bottom: a source band-limited to $3$ kHz, sampled every $T_s=\\tfrac16$ ms, which is $6000$ samples a second.', short:'The source of Example 6.1.'},

{t:'h3', text:'Extended sources'},
{t:'p', text:'A coder can also take the symbols in blocks of $n$. Each block is one symbol of a new source, the <b>$n$-th extension</b> $S^n$, whose alphabet has $K^n$ symbols.'},
{t:'p', text:'The entropy of a block follows from the additive property. Write the entropy of a pair, split the logarithm of the product, and sum out the other symbol.'},
{t:'eqbox', cap:'Entropy of a pair', tex:'\\begin{aligned}H(S^2)&=-\\sum_{i,j}p_ip_j\\log_2(p_ip_j)\\\\&=-\\sum_{i,j}p_ip_j\\bigl(\\log_2p_i+\\log_2p_j\\bigr)\\\\&=-\\sum_ip_i\\log_2p_i\\sum_jp_j-\\sum_jp_j\\log_2p_j\\sum_ip_i\\\\&=H(S)+H(S)\\end{aligned}',
 after:'Each inner sum of probabilities is $1$. Repeating the step for $n$ symbols gives the general rule.'},
{t:'eqbox', cap:'Extension', tex:'H(S^{n})=n\\,H(S)',
 after:'The symbols of a memoryless source are independent, so their information adds. For $0.7,0.2,0.1$ the nine pair probabilities are $0.49,0.14,0.07,0.14,0.04,0.02,0.07,0.02,0.01$. Summed the long way they give $H(S^2)=2.3136=2\\times1.1568$ bits. Triples give $H(S^3)=3\\times1.1568=3.470$ bits.'},
{t:'fig', svg:fig(figExtension, {frame:1}), cap:'The bits each pair of $S^2$ carries, for the source $0.7,0.2,0.1$. A pair carries the sum of its two symbols\' bits, so the average (dashed) doubles to $2.314$.'},
{t:'box', kind:'warn', hd:'Memory', html:'The rule needs a memoryless source. With memory, as in English where $q$ is followed by $u$, a block carries less than $nH(S)$. Compressors live on that surplus.'},

{t:'h3', text:'Entropy around us'},
{t:'p', text:'To find the entropy of real data, count how often each symbol occurs, then apply $H=-\\sum_kp_k\\log_2p_k$. Four everyday sources:'},
{t:'ul', items:[
 'The $'+LETTERS.K+'$ symbols of a short speech, letters and space, by frequency. $H=-\\sum_kp_k\\log_2p_k='+num(LETTERS.H,2)+'$ bits a symbol, against $\\log_2'+LETTERS.K+'='+num(lg(LETTERS.K),2)+'$.',
 'A fair die carries $\\log_26=2.585$ bits a throw. A die loaded to show six half the time carries $H='+num(H(LOADED),3)+'$ bits.',
 'A scanned text line, $8$ pixels a millimetre, is $90\\%$ white. As independent pixels it carries $H_b(0.1)='+num(hb(0.1),3)+'$ bit a pixel, not $1$.',
 'A drawn $64\\times64$ grey image, $8$ levels. Its histogram gives $H='+num(GREY.H,2)+'$ bits a pixel, below $\\log_28=3$.'
]},
{t:'box', kind:'ok', hd:'Uneven is cheaper', html:'Each source here sits below $\\log_2K$. The gap is what a variable-length code can save.'},
{t:'box', kind:'warn', hd:'Memory', html:'Letters and pixels depend on their neighbours. The entropy with memory is lower still, about $1.3$ bits a letter for English.'},

/* ================= 6.2 ================= */
{t:'h2', num:'6.2', text:'The limits of compression'},

{t:'h3', text:'Code length'},
{t:'p', text:'A <b>source encoder</b> maps each symbol $s_k$ to a string of bits, its <b>codeword</b>, of length $l_k$. Common symbols should get short codewords and rare symbols long ones.'},
{t:'eqbox', cap:'Average length and efficiency', tex:'\\bar{L}=\\sum_{k=1}^{K}p_kl_k,\\qquad\\eta=\\frac{H(S)}{\\bar{L}}\\le1',
 after:'The code for $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$ with lengths $1,2,3,3$ has $\\bar{L}=\\tfrac12(1)+\\tfrac14(2)+\\tfrac18(3)+\\tfrac18(3)=1.75$. That equals $H$, so $\\eta=1$.'},
{t:'p', text:'In this code each length equals the information of its symbol. The figure sets the two side by side.'},
{t:'fig', svg:fig(figCodeLength, null), cap:'The source encoder maps each symbol to a codeword. For $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$ each code length (right bar) equals the information of its symbol (left bar).'},
{t:'box', kind:'note', hd:'Source coding theorem', html:'Every uniquely decodable code has $\\bar{L}\\ge H(S)$. The entropy is the fewest bits a symbol that a lossless code can reach.'},
{t:'p', text:'English shows how far a simple code can sit from this limit. With its memory, English carries about $1.3$ bits a letter. A letter-by-letter code needs $4.22$ bits, so $\\eta=1.3/4.22=0.31$.'},

{t:'h3', text:'Typical sequences'},
{t:'p', text:'Long sequences show where the limit comes from. Take $n$ bits from a binary source with $P(1)=p$. A long sequence has about $np$ ones and $n(1-p)$ zeros.'},
{t:'p', text:'The probability of such a sequence follows from these counts. Take its logarithm and divide by $-n$.'},
{t:'eqbox', cap:'Probability of a typical sequence', tex:'\\begin{aligned}P(\\mathbf{x})&=p^{np}(1-p)^{n(1-p)}\\\\-\\tfrac1n\\log_2P(\\mathbf{x})&=-p\\log_2p-(1-p)\\log_2(1-p)=H\\\\P(\\mathbf{x})&=2^{-nH}\\end{aligned}',
 after:'All such sequences have nearly the same probability, $2^{-nH}$. They are the <b>typical sequences</b>.'},
{t:'p', text:'A sequence counts as typical when its value of $-\\tfrac1n\\log_2P$ lies within $\\epsilon$ of $H$. For large $n$ the typical sequences hold almost all the probability. Their probabilities then add to about one, so there are about $2^{nH}$ of them.'},
{t:'eqbox', cap:'The typical set', tex:'P(\\mathbf{x})\\approx2^{-nH},\\qquad|A|\\approx2^{nH}\\ \\text{of}\\ 2^{n}\\ \\text{sequences}',
 after:'The rest are rare. With $p=0.2$, $H=0.722$. At $n=100$ there are about $2^{100\\times0.722}=2^{72.2}$ typical sequences, a tiny fraction of the $2^{100}$.'},
{t:'fig', svg:fig(figTypical, {i:3}), cap:'Every sequence of $n$ bits with $P(1)=0.2$, placed at its value of $-\\tfrac1n\\log_2P$ with its probability, shown at $n=100$. The probability gathers in the band $H\\pm0.1$ (shaded).'},
{t:'box', kind:'warn', hd:'Uniform source', html:'At $p=\\tfrac12$, $H=1$ and every one of the $2^{n}$ sequences is typical. There is nothing to compress.'},

{t:'h3', text:'The source coding theorem'},
{t:'p', text:'A code can give each typical sequence a number, its index, and give up on the rare rest. About $nH$ bits name a typical sequence, which is $H$ bits a symbol. The chance of meeting a rare sequence falls to zero as $n$ grows.'},
{t:'eqbox', cap:'Source coding theorem', tex:'R>H:\\ P_{\\text{error}}\\to0,\\qquad R<H:\\ P_{\\text{error}}\\not\\to0',
 after:'A code of $R$ bits a symbol can be made reliable when $R$ exceeds $H$, and never when $R$ falls below it. A source with $H=0.5$ bit a symbol, in blocks of $n=1000$, needs about $nH=500$ bits a block to name its $2^{500}$ typical blocks.'},
{t:'p', text:'Ten bits show the count in full. Take $p=0.2$ and $\\epsilon=0.1$, so the band runs from $0.622$ to $0.822$. A sequence on the edge of the band counts as typical.'},
{t:'eqbox', cap:'The typical sequences of ten bits', tex:['k=2:\\quad-\\tfrac{1}{10}\\log_2\\bigl(0.2^{2}\\,0.8^{8}\\bigr)=0.722', 'k=1:\\ 0.522,\\qquad k=3:\\ 0.922'],
 after:'Here $k$ is the number of ones. Only the sequences with two ones fall inside the band. There are $\\binom{10}{2}=45$ of them, each of probability $0.2^{2}\\,0.8^{8}=0.00671$. Together they hold $45\\times0.00671=0.3020$ of the probability. An index of $6$ bits names them, since $2^{6}=64\\ge45$.'},
{t:'fig', svg:fig(figSourceThm, {frame:3}), cap:'All $1024$ sequences of ten bits with $P(1)=0.2$, in order of their number of ones, shown at the last step. The $45$ typical ones are $4\\%$ of the sequences, hold $30\\%$ of the probability and take a $6$-bit index.', short:'The typical sequences of ten bits and their index.'},
{t:'p', text:'The share held by the typical set grows with $n$.'},
{t:'table', cap:'Probability held by the typical set, for $p=0.2$ and $\\epsilon=0.1$.', head:['$n$','$P(\\text{typical})$'], rows:[
 ['$10$','$30\\%$'],
 ['$100$','$83\\%$'],
 ['$1000$','$99.99\\%$']
]},

{t:'h3', text:'Prefix codes'},
{t:'p', text:'Short codewords help only if the receiver can split the bit stream back into codewords. A code is <b>uniquely decodable</b> when every bit string of the code comes from one symbol string only.'},
{t:'p', text:'A <b>prefix code</b> is one in which no codeword starts another. The decoder names a symbol as soon as its last bit arrives, so a prefix code is also called <b>instantaneous</b>.'},
{t:'table', cap:'Three codes for the same four symbols.', head:['Symbol','Code I','Code II','Code III'], rows:[
 ['$s_1$','$\\mathtt{0}$','$\\mathtt{0}$','$\\mathtt{0}$'],
 ['$s_2$','$\\mathtt{1}$','$\\mathtt{10}$','$\\mathtt{01}$'],
 ['$s_3$','$\\mathtt{00}$','$\\mathtt{110}$','$\\mathtt{011}$'],
 ['$s_4$','$\\mathtt{11}$','$\\mathtt{111}$','$\\mathtt{0111}$']
]},
{t:'p', text:'Code I is not uniquely decodable: $\\mathtt{00}$ is $s_3$ or $s_1s_1$. Code II is a prefix code. It splits the bits $\\mathtt{0101100111}$ as $\\mathtt{0\\,10\\,110\\,0\\,111}$, which is $s_1s_2s_3s_1s_4$.'},
{t:'p', text:'Code III is uniquely decodable, because every codeword starts with $\\mathtt{0}$. It is not instantaneous. After $\\mathtt{01}$ the decoder must wait: a $\\mathtt{1}$ next means a longer word, and a $\\mathtt{0}$ means $s_2$. The same bits read as $\\mathtt{01\\,011\\,0\\,0111}$, which is $s_2s_3s_1s_4$.'},
{t:'fig', svg:fig(figPrefix, {frame:3}), cap:'The three codes drawn as trees, shown at the last step. The tree of Code III is faint, and the bits $\\mathtt{0101100111}$ are read with Codes II and III. In Code III each codeword lies on the path to the next.', short:'Prefix codes as trees, and one bit stream read by two codes.'},

{t:'h3', text:'The Kraft inequality'},
{t:'p', text:'Codeword lengths can be tested before the codewords are chosen. A codeword of length $l$ owns the fraction $2^{-l}$ of the unit interval: all long bit strings that start with it. In a prefix code these fractions do not overlap, so they add to at most one.'},
{t:'eqbox', cap:'Kraft inequality', tex:'\\sum_{k=1}^{K}2^{-l_k}\\le1',
 after:'A prefix code with lengths $l_k$ exists exactly when the sum is at most one.'},
{t:'eqbox', cap:'Kraft sums of the three codes', tex:'\\begin{aligned}\\text{I}:&\\ \\tfrac12+\\tfrac12+\\tfrac14+\\tfrac14=1.5\\\\\\text{II}:&\\ \\tfrac12+\\tfrac14+\\tfrac18+\\tfrac18=1\\\\\\text{III}:&\\ \\tfrac12+\\tfrac14+\\tfrac18+\\tfrac1{16}=0.9375\\end{aligned}',
 after:'Code I gives $1.5>1$, so no prefix code has its lengths. Code II gives exactly $1$. Lengths $1,2,2,3$ give $\\tfrac12+\\tfrac14+\\tfrac14+\\tfrac18=1.125>1$ and allow no prefix code either.'},
{t:'fig', svg:fig(figKraft, {frame:0}), cap:'Each codeword of length $l$ owns $2^{-l}$ of the unit interval, shown for Code I. Its stretches overlap, and the Kraft sum at the bottom is $1.5$, past $1$ (red).'},
{t:'box', kind:'warn', hd:'Lengths, not codewords', html:'Code III passes the test and is still not a prefix code. The inequality tests lengths only. The lengths $1,2,3,4$ of Code III allow the prefix code $\\mathtt{0},\\mathtt{10},\\mathtt{110},\\mathtt{1110}$.'},

{t:'h3', text:'The source-coding bound'},
{t:'p', text:'The ideal length of a codeword is $-\\log_2p_k$, the information of its symbol. It is rarely a whole number, so round it up.'},
{t:'eqbox', cap:'Rounded lengths', tex:['l_k=\\lceil-\\log_2p_k\\rceil\\;\\Longrightarrow\\;-\\log_2p_k\\le l_k<-\\log_2p_k+1', '2^{-l_k}\\le p_k\\;\\Longrightarrow\\;\\sum_k2^{-l_k}\\le\\sum_kp_k=1'],
 after:'The second line shows that the rounded lengths pass the Kraft test. So a prefix code with these lengths exists.'},
{t:'p', text:'Multiply the first line by $p_k$ and sum over $k$. The left side becomes $H(S)$, and the middle becomes $\\bar{L}$.'},
{t:'eqbox', cap:'Source-coding bound', tex:'H(S)\\le\\bar{L}<H(S)+1',
 after:'The rounding adds less than one bit a symbol. If every $p_k=2^{-l_k}$, the source is <b>dyadic</b>. Then no length is rounded, and $\\bar{L}=H(S)$.'},
{t:'p', text:'The rounding bit can be spread over a block. Apply the bound to the extension $S^n$, whose entropy is $nH(S)$, and divide by $n$.'},
{t:'eqbox', cap:'Blocks of $n$ symbols', tex:'nH(S)\\le L_n<nH(S)+1\\;\\Longrightarrow\\;H(S)\\le\\frac{L_n}{n}<H(S)+\\frac1n',
 after:'Blocks of $n=10$ symbols sit at most $1/10=0.1$ bit a symbol above $H$. The price is the codebook, which grows as $K^n$. For three symbols that is $3^{10}=59\\,049$ words.'},
{t:'fig', svg:fig(figBound, {n:10}), cap:'Bounds on the bits a symbol for blocks of $n$ symbols from $0.7,0.2,0.1$, shown at $n=10$. The gap of $1/n$ above $H(S)=1.157$ closes as $n$ grows.'},

{t:'h3', text:'Rate and distortion'},
{t:'p', text:'When some error is allowed, fewer bits suffice. The <b>rate–distortion function</b> gives the fewest bits a sample for a mean-square error $D$.'},
{t:'p', text:'For a Gaussian source of variance $\\sigma^2$ the function has a closed form.'},
{t:'eqbox', cap:'Gaussian source', tex:'D(R)=\\sigma^{2}\\,2^{-2R}\\quad\\Longleftrightarrow\\quad R(D)=\\tfrac12\\log_2\\frac{\\sigma^{2}}{D}',
 after:'One more bit multiplies $D$ by $2^{-2(R+1)}/2^{-2R}=\\tfrac14$. In decibels that is $10\\log_{10}4=6.02$ dB a bit, the same rule as the quantizers of Chapter 1.'},
{t:'fig', svg:fig(figRD, {R:1}), cap:'The least distortion of a Gaussian source at $R$ bits a sample (line), and the Lloyd–Max quantizers of Chapter 1 (dots). Shown at $R=1$, where $D=0.25\\,\\sigma^2$.'},
{t:'box', kind:'warn', hd:'Quantizers', html:'The Lloyd–Max quantizer of Chapter 1 codes one sample at a time. It sits $1.62$ dB above $D(R)$ at $1$ bit and $2.74$ dB above it at $2$ bits. Coding blocks of samples closes the gap.'},

{t:'h3', text:'Codes around us'},
{t:'p', text:'Morse code and UTF-8 give frequent symbols short codewords. That is the idea of every variable-length code. Four everyday codes:'},
{t:'ul', items:[
 'Morse code gives common letters short signals: $e$ is one dot. Each letter lasts $T=\\sum_it_i+(m-1)$ units, with a dot $1$ and a dash $3$.',
 'UTF-8 writes a character in $1$ to $4$ bytes: $1$ for $b\\le7$, else $\\lceil(b-1)/5\\rceil$. A lead byte never starts another, so it is a prefix code.',
 'Telephone country codes: $+1$, $+30$, $+351$, $+971$. No code is the start of another, so a switch knows where the code ends without a separator.',
 'Braille sets each letter in a cell of six dots, raised or flat: $2^6=64$ patterns, $6$ bits a letter whatever its frequency.'
]},
{t:'box', kind:'ok', hd:'Prefix codes', html:'UTF-8 and the country codes need no separators. A reader knows where each codeword ends.'},
{t:'box', kind:'warn', hd:'Fixed length', html:'Braille spends $6$ bits a letter. The letters of the speech in Section 6.1 carry $4.04$ bits each.'},

/* ================= 6.3 ================= */
{t:'h2', num:'6.3', text:'Huffman and Lempel–Ziv coding'},

{t:'h3', text:'Huffman coding'},
{t:'p', text:'<b>Huffman coding</b> builds a prefix code by repeated merges.'},
{t:'box', kind:'note', hd:'Huffman algorithm', html:'<b>1.</b> Sort the probabilities.<br><b>2.</b> Merge the two smallest into one entry whose probability is their sum. Label the pair $0$ and $1$, and sort again.<br><b>3.</b> At one entry, read each codeword from the last merge back to its symbol.'},
{t:'p', text:'Apply it to the source $0.4,0.2,0.2,0.1,0.1$ for $s_1,\\ldots,s_5$. A merged entry that ties with others is placed above them.'},
{t:'eqbox', cap:'The merges', tex:'0.1+0.1=0.2,\\qquad0.2+0.2=0.4,\\qquad0.4+0.2=0.6,\\qquad0.6+0.4=1'},
{t:'eqbox', cap:'Codewords', tex:'\\mathtt{00},\\ \\mathtt{10},\\ \\mathtt{11},\\ \\mathtt{010},\\ \\mathtt{011}',
 after:'Read back from the last merge, these are the codewords of $s_1$ to $s_5$. The two most likely symbols get two bits, the two least likely three.'},
{t:'p', text:'The lengths are $2,2,2,3,3$. Weight each by its probability to get $\\bar{L}$, then divide $H$ by it.'},
{t:'eqbox', cap:'Average length and efficiency', tex:['\\begin{aligned}\\bar{L}&=0.4(2)+0.2(2)+0.2(2)+0.1(3)+0.1(3)\\\\&=0.8+0.4+0.4+0.3+0.3=2.2\\ \\text{bits}\\end{aligned}', '\\eta=\\frac{H(S)}{\\bar{L}}=\\frac{2.1219}{2.2}=0.9645'],
 after:'The average $2.2$ lies above $H=2.1219$. No prefix code for single symbols has a smaller average length.'},
{t:'fig', svg:fig(figHuffman, {frame:4}), cap:'The Huffman merges for $0.4,0.2,0.2,0.1,0.1$. Each column merges the two smallest entries of the column before, labelled $0$ and $1$, and sorts again. Shown at the last step, with the codewords read back at the left.'},

{t:'h3', text:'Ties and variance'},
{t:'p', text:'A merged entry often ties with other entries of the same probability. It may be placed above them or below them. Both choices give a Huffman code with the same average length.'},
{t:'eqbox', cap:'Two Huffman codes for $0.4,0.2,0.2,0.1,0.1$', tex:['\\text{high: }l_k=2,2,2,3,3,\\qquad\\bar{L}=2.2', '\\text{low: }l_k=1,2,3,4,4,\\qquad\\bar{L}=0.4+0.4+0.6+0.4+0.4=2.2'],
 after:'Placed high, the codewords are $\\mathtt{00},\\mathtt{10},\\mathtt{11},\\mathtt{010},\\mathtt{011}$. Placed low, they are $\\mathtt{1},\\mathtt{01},\\mathtt{000},\\mathtt{0010},\\mathtt{0011}$.'},
{t:'p', text:'The two codes differ in how far the lengths spread around $\\bar{L}$. The <b>variance</b> of the codeword length measures that spread.'},
{t:'eqbox', cap:'Variance of the codeword length', tex:['\\sigma^{2}=\\sum_kp_k\\bigl(l_k-\\bar{L}\\bigr)^{2}', '\\begin{aligned}\\sigma^2_{\\text{high}}&=0.8(0.2)^{2}+0.2(0.8)^{2}=0.032+0.128=0.16\\\\\\sigma^2_{\\text{low}}&=0.4(1.2)^{2}+0.2(0.2)^{2}+0.2(0.8)^{2}+0.2(1.8)^{2}\\\\&=0.576+0.008+0.128+0.648=1.36\\end{aligned}'],
 after:'Placing the merged entry high gives the least variance. Lengths near $\\bar{L}$ keep the bit rate steady, so a transmitter with a small buffer fills and empties it less.'},
{t:'fig', svg:fig(figHuffVar, {frame:2}), cap:'Top: the merges with ties placed low. Bottom: the codeword lengths of the two codes, ties high (violet) and ties low (amber), against $\\bar{L}=2.2$ (dashed).', short:'Huffman codes with ties placed high and low.'},

{t:'h3', text:'Huffman codes for pairs of symbols'},
{t:'p', text:'Huffman coding of the single symbols $0.7,0.2,0.1$ gives the codewords $\\mathtt{0},\\mathtt{10},\\mathtt{11}$. Their average length is $0.7(1)+0.2(2)+0.1(2)=1.3$ bits, against $H=1.157$.'},
{t:'p', text:'Coding blocks spreads the rounding loss. Build a Huffman code for the $K^n$ blocks of $n$ symbols, and divide its average length by $n$.'},
{t:'table', cap:'Huffman codes for single symbols, pairs and triples of $0.7,0.2,0.1$, against $H=1.1568$.', head:['$n$','Blocks','$\\bar{L}_n/n$ (bits a symbol)','Bound $H+1/n$','Efficiency $\\eta$'], rows:[
 ['$1$','$3$','$1.3$','$2.1568$','$0.8898$'],
 ['$2$','$9$','$1.165$','$1.6568$','$0.9929$'],
 ['$3$','$27$','$1.1753$','$1.4901$','$0.9842$']
]},
{t:'p', text:'Pairs cost $\\bar{L}_2=2.33$ bits a pair, or $2.33/2=1.165$ bits a symbol. Triples cost $1.1753$ bits a symbol, a little more than pairs.'},
{t:'fig', svg:fig(figHuffExt, {frame:2}), cap:'Huffman codes for single symbols, pairs and triples of $0.7,0.2,0.1$. Top: the bound $H+1/n$ (rings) and the code (dots). Bottom: the code, enlarged.'},
{t:'box', kind:'err', hd:'Common error', html:'Expect the bound $H+1/n$ to fall with $n$, not the cost of every block code. Triples give $1.1753$ bits a symbol, worse than the $1.165$ of pairs.'},

{t:'h3', text:'Arithmetic coding'},
{t:'p', text:'<b>Arithmetic coding</b> codes a whole message at once. It starts with the interval $[0,1)$. Each symbol keeps the part of the current interval that its probability owns.'},
{t:'p', text:'Code the message $s_1s_1s_2$ from the source $0.7,0.2,0.1$. The symbols own the first $70\\%$, the next $20\\%$ and the last $10\\%$ of each interval.'},
{t:'eqbox', cap:'The interval after each symbol', tex:'\\begin{aligned}s_1&:\\ [0,0.7)\\\\s_1s_1&:\\ [0,0.49)\\\\s_1s_1s_2&:\\ [0.343,0.441)\\end{aligned}',
 after:'The last symbol keeps the part from $70\\%$ to $90\\%$ of $[0,0.49)$: $0.7\\times0.49=0.343$ and $0.9\\times0.49=0.441$.'},
{t:'p', text:'Each symbol scales the interval by its probability. So the width is the probability of the whole message.'},
{t:'eqbox', cap:'Width', tex:'w=\\prod_ip(s_i)=0.7\\times0.7\\times0.2=0.098'},
{t:'p', text:'A binary fraction of $l$ bits inside the interval names it. About $-\\log_2w$ bits are needed, plus one.'},
{t:'eqbox', cap:'Tag', tex:'l=\\lceil-\\log_2w\\rceil+1=\\lceil3.35\\rceil+1=5\\ \\text{bits}',
 after:'The tag is $0.\\mathtt{01100}_2=0.375$. Every binary fraction that starts with $0.\\mathtt{01100}$ lies in $[0.375,0.40625)$, inside $[0.343,0.441)$. The extra bit is paid once a message.'},
{t:'p', text:'The tag length follows the width. When the width halves, the tag needs one more bit, because $-\\log_2(w/2)=-\\log_2w+1$.'},
{t:'fig', svg:fig(figArith, {frame:4}), cap:'Arithmetic coding of $s_1s_1s_2$ with $0.7,0.2,0.1$. Each symbol keeps its share of the current interval. Shown at the last step, where the binary fraction $0.375$ names the final interval.'},

{t:'h3', text:'Lempel–Ziv coding'},
{t:'p', text:'<b>Lempel–Ziv coding</b> builds a dictionary of phrases from the stream itself.'},
{t:'box', kind:'note', hd:'Lempel–Ziv parsing', html:'Read the stream. Cut off the shortest string not yet in the dictionary, and add it as a new entry. Each new phrase is an earlier phrase plus one bit.'},
{t:'p', text:'Each phrase is sent as a pair. The pointer names the earlier phrase, and one more bit carries the new bit. The decoder builds the same dictionary from the pairs.'},
{t:'eqbox', cap:'Phrase code', tex:'(\\text{pointer},\\ \\text{new bit}):\\quad\\mathtt{010}\\to(4,\\mathtt{0})'},
{t:'p', text:'Parse the $18$-bit stream $\\mathtt{000101110010100101}$. The dictionary starts with the empty phrase as entry $0$. The table lists the eight phrases and the pair sent for each.'},
{t:'table', cap:'Lempel–Ziv parsing of the stream $\\mathtt{000101110010100101}$.', head:['Entry $i$','Phrase','Pair sent','Bits $\\lceil\\log_2i\\rceil+1$'], rows:[
 ['$1$','$\\mathtt{0}$','$(0,\\mathtt{0})$','$1$'],
 ['$2$','$\\mathtt{00}$','$(1,\\mathtt{0})$','$2$'],
 ['$3$','$\\mathtt{1}$','$(0,\\mathtt{1})$','$3$'],
 ['$4$','$\\mathtt{01}$','$(1,\\mathtt{1})$','$3$'],
 ['$5$','$\\mathtt{11}$','$(3,\\mathtt{1})$','$4$'],
 ['$6$','$\\mathtt{001}$','$(2,\\mathtt{1})$','$4$'],
 ['$7$','$\\mathtt{010}$','$(4,\\mathtt{0})$','$4$'],
 ['$8$','$\\mathtt{0101}$','$(7,\\mathtt{1})$','$4$']
]},
{t:'p', text:'Phrase $7$, $\\mathtt{010}$, is phrase $4$ plus a $\\mathtt{0}$, so it is sent as $(4,\\mathtt{0})$. The stream then goes on $\\mathtt{0101}$. That is entry $7$ plus a $\\mathtt{1}$, a new phrase, sent as $(7,\\mathtt{1})$.'},
{t:'fig', svg:fig(figLZ, {frame:8}), cap:'The $18$-bit stream parsed into phrases, shown after the eighth phrase. Each new phrase is an earlier phrase plus one bit, so the dictionary grows as a tree.'},
{t:'p', text:'Phrase $i$ can point to any of the $i$ entries $0$ to $i-1$, so its pointer needs $\\lceil\\log_2i\\rceil$ bits. The last column of the table adds to $1+2+3+3+4+4+4+4=25$ bits.'},
{t:'box', kind:'warn', hd:'Short streams', html:'With a $3$-bit pointer and one new bit, eight phrases take $32$ bits for $18$. A pointer of $\\lceil\\log_2i\\rceil$ bits for phrase $i$ takes $25$.'},

{t:'h3', text:'Lempel–Ziv on a long stream'},
{t:'p', text:'Lempel–Ziv is a <b>universal</b> code: it is told nothing about the source, and it learns the frequent strings from the stream itself. On a long stream the phrases grow long, and each pointer stands for many source bits.'},
{t:'p', text:'For $c$ phrases the cost is a sum over the phrases.'},
{t:'eqbox', cap:'Cost of $c$ phrases', tex:'L=\\sum_{i=1}^{c}\\bigl(\\lceil\\log_2i\\rceil+1\\bigr)\\ \\text{bits}',
 after:'Take a binary source with $P(1)=0.1$, so $H_b(0.1)=0.469$ bit a symbol. On one random stream the cost is $0.689$ bits a source bit after $10^{3}$ bits and $0.557$ after $10^{6}$.'},
{t:'fig', svg:fig(figLZLong, {e:6}), cap:'Lempel–Ziv on one random stream from a binary source with $P(1)=0.1$: the bits sent a source bit against the stream length, and $H_b(0.1)$ (dashed). Shown at $n=10^{6}$.'},
{t:'box', kind:'warn', hd:'Slow approach', html:'The cost falls toward $H$ only as the phrases grow long, and it never falls below $H$. Any code for single binary symbols costs $1$ bit a symbol here.'},

{t:'h3', text:'Compression around us'},
{t:'p', text:'Each format below first turns the data into something with low entropy: copies, differences, zeros or runs.'},
{t:'ul', items:[
 'ZIP and gzip use DEFLATE: LZ77 copies, then Huffman codes. $\\ell(i)$ is the longest earlier copy of the text from character $i$.',
 'PNG filters each row first: $d[n]=x[n]-x[n-1]$ takes $'+num(histH(PNG_D.slice(1)),2)+'$ bits a pixel against $'+num(histH(PNG_ROW),2)+'$. DEFLATE then codes $d[n]$.',
 'JPEG takes the DCT of each $8\\times8$ block and quantizes it. Here $'+JPG.nz+'$ of the $64$ values $c_k$ are nonzero. The runs of zeros are Huffman-coded.',
 'A fax line of $\\sum_i\\ell_i='+FAX.reduce((s,x)=>s+x,0)+'$ pixels is sent as run lengths $\\ell_i$, white and black in turn, each Huffman-coded.'
]},
{t:'box', kind:'ok', hd:'Then Huffman', html:'A Huffman code, or a close cousin, then spends bits by frequency.'},
{t:'box', kind:'warn', hd:'Lossy and lossless', html:'ZIP, PNG and fax lose nothing. JPEG throws information away in its quantizer before any coding.'},

/* ================= 6.4 ================= */
{t:'h2', num:'6.4', text:'Channels and mutual information'},

{t:'h3', text:'The discrete memoryless channel'},
{t:'p', text:'A <b>discrete memoryless channel</b> takes an input symbol $x_j$ and returns an output symbol $y_k$ with probability $p(y_k\\mid x_j)$. Memoryless means each use ignores the others.'},
{t:'p', text:'The transition probabilities form the <b>channel matrix</b>, with one row for each input.'},
{t:'eqbox', cap:'Channel matrix', tex:'\\mathbf{P}=\\begin{bmatrix}p(y_0\\mid x_0)&p(y_1\\mid x_0)\\\\p(y_0\\mid x_1)&p(y_1\\mid x_1)\\end{bmatrix}=\\begin{bmatrix}0.8&0.2\\\\0.3&0.7\\end{bmatrix}',
 after:'Row $j$ is the output distribution of input $x_j$, so it sums to one: $0.8+0.2=0.3+0.7=1$. The columns need not sum to one. Here they give $1.1$ and $0.9$.'},
{t:'fig', svg:fig(figDMC, null, null, 56), cap:'The channel above as a diagram. Each input has a line to each output it can reach, labelled with the probability of that move. Amber lines keep the symbol, and red lines change it.'},

{t:'h3', text:'Input and output distributions'},
{t:'p', text:'The channel fixes $p(y\\mid x)$. The transmitter chooses the <b>input distribution</b> $p(x)$. Together they give the joint and the output distributions.'},
{t:'eqbox', cap:'Joint and output distributions', tex:['p(x_j,y_k)=p(y_k\\mid x_j)\\,p(x_j)', 'p(y_k)=\\sum_jp(y_k\\mid x_j)\\,p(x_j)'],
 after:'The output probability adds the joint probabilities of every path that ends at $y_k$.'},
{t:'p', text:'With $p(x_0)=0.75$, the output $y_0$ comes from $x_0$ with probability $0.6$ and from $x_1$ with probability $0.075$. Add the two paths.'},
{t:'eqbox', cap:'Output distribution for $p(x_0)=0.75$', tex:'\\begin{aligned}p(y_0)&=0.8\\times0.75+0.3\\times0.25\\\\&=0.6+0.075=0.675\\\\p(y_1)&=1-0.675=0.325\\end{aligned}'},
{t:'fig', svg:fig(figInputDist, {q:0.75}), cap:'The four joint probabilities of the channel $0.8/0.2$, $0.3/0.7$, drawn to width: kept (amber) and moved (red). Below, the output distribution they add to (green), shown at $p(x_0)=0.75$.'},

{t:'h3', text:'The binary symmetric channel'},
{t:'p', text:'The <b>binary symmetric channel</b> (BSC) has two inputs and two outputs. Each bit arrives flipped with probability $p$, the <b>crossover probability</b>, and intact with probability $1-p$, whatever its value.'},
{t:'eqbox', cap:'Binary symmetric channel', tex:'\\mathbf{P}=\\begin{bmatrix}1-p&p\\\\p&1-p\\end{bmatrix}'},
{t:'p', text:'The matched-filter receiver of Chapter 4, deciding each BPSK bit of Chapter 5, hands on a BSC. Its crossover is the BPSK bit error. Here $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ is the Gaussian tail.'},
{t:'eqbox', cap:'BSC from hard-decision BPSK', tex:['p=Q\\Bigl(\\sqrt{2E_b/N_0}\\Bigr)', '\\begin{aligned}E_b/N_0&=4\\ \\text{dB}=10^{0.4}=2.512\\\\p&=Q\\bigl(\\sqrt{2\\times2.512}\\bigr)=Q(2.241)=0.0125\\end{aligned}']},
{t:'fig', svg:fig(figBSC, {g:4}), cap:'Top: the binary symmetric channel. Bottom: its crossover when BPSK is decided bit by bit, shown at $E_b/N_0=4$ dB, where $p=0.0125$.'},
{t:'box', kind:'warn', hd:'Hard decisions', html:'Deciding each bit throws away how sure the receiver was. Later sections count what that costs.'},

{t:'h3', text:'Joint entropy and the chain rule'},
{t:'p', text:'The <b>joint entropy</b> of two variables is the entropy of the pair, treated as one symbol.'},
{t:'eqbox', cap:'Joint entropy', tex:'H(X,Y)=-\\sum_{j,k}p(x_j,y_k)\\log_2p(x_j,y_k)'},
{t:'p', text:'The uncertainty about $Y$ left once $X$ is known is the conditional entropy $H(Y\\mid X)=-\\sum_{j,k}p(x_j,y_k)\\log_2p(y_k\\mid x_j)$. The joint probability splits as $p(x,y)=p(x)\\,p(y\\mid x)$. Its logarithm is a sum, and averaging each term gives the <b>chain rule</b>.'},
{t:'eqbox', cap:'Chain rule', tex:['\\begin{aligned}H(X,Y)&=-\\sum_{j,k}p(x_j,y_k)\\bigl[\\log_2p(x_j)+\\log_2p(y_k\\mid x_j)\\bigr]\\\\&=H(X)+H(Y\\mid X)\\end{aligned}', 'H(X,Y)=H(X)+H(Y\\mid X)=H(Y)+H(X\\mid Y)'],
 after:'Learn $X$ first, then what is left of $Y$. The second form follows the same way with the roles of $X$ and $Y$ swapped.'},
{t:'p', text:'Take the joint pmf $p(x_0,y_0)=p(x_1,y_1)=0.4$ and $p(x_0,y_1)=p(x_1,y_0)=0.1$.'},
{t:'eqbox', cap:'Chain rule for one pmf', tex:['H(X,Y)=-2(0.4)\\log_20.4-2(0.1)\\log_20.1=1.7219', 'H(X)=1,\\qquad H(Y\\mid X)=H_b(0.2)=0.7219'],
 after:'Each input has probability $0.5$, so $H(X)=1$. Given either input, $Y$ agrees with probability $0.4/0.5=0.8$, so $H(Y\\mid X)=H_b(0.2)$. The two parts add to $1.7219$, as the chain rule says.'},
{t:'fig', svg:fig(figJoint, {frame:2}), cap:'The joint pmf as tiles, and its joint entropy as a bar, shown at the last step: $H(X)$ fills part of the bar, and $H(Y\\mid X)$ fills the rest.'},

{t:'h3', text:'Conditional entropy'},
{t:'p', text:'The receiver sees $Y$ and wants $X$. The <b>conditional entropy</b> $H(X\\mid Y)$ is the uncertainty about the input left after the output is seen, averaged over the outputs.'},
{t:'eqbox', cap:'Conditional entropy', tex:'H(X\\mid Y)=\\sum_kp(y_k)\\,H(X\\mid Y=y_k)'},
{t:'p', text:'Return to the channel $0.8/0.2$, $0.3/0.7$ with $p(x_0)=0.75$. Bayes\' rule gives the input probabilities after each output.'},
{t:'eqbox', cap:'After each output', tex:['P(x_0\\mid y_0)=\\frac{0.8\\times0.75}{0.675}=0.889,\\qquad H_b(0.889)=0.503', 'P(x_0\\mid y_1)=\\frac{0.2\\times0.75}{0.325}=0.462,\\qquad H_b(0.462)=0.996', 'H(X\\mid Y)=0.675(0.503)+0.325(0.996)=0.663'],
 after:'Before the output, $H(X)=H_b(0.75)=0.811$ bit. Output $y_0$ removes much of the doubt. Output $y_1$ leaves the input almost a coin toss.'},
{t:'fig', svg:fig(figCondEnt, {frame:3}), cap:'The channel $0.8/0.2$, $0.3/0.7$ with $p(x_0)=0.75$: the uncertainty about $X$ before the output, after each output, their average, and the other conditional entropy $H(Y\\mid X)$.', short:'Conditional entropies of one channel.'},
{t:'box', kind:'err', hd:'Common error', html:'Keep $H(X\\mid Y)$ apart from $H(Y\\mid X)$. Here $H(Y\\mid X)=0.75H_b(0.2)+0.25H_b(0.3)=0.762$, but $H(X\\mid Y)=0.663$.'},
{t:'p', text:'In a BSC with equally likely inputs, either output leaves the input wrong with probability $p$. So $H(X\\mid Y)=H_b(p)$. At $p=0.1$ that is $H_b(0.1)=0.469$ bit.'},

{t:'h3', text:'Mutual information'},
{t:'p', text:'<b>Mutual information</b> is the uncertainty about the input that the output removes. It is the uncertainty before the output, less the uncertainty after it.'},
{t:'eqbox', cap:'Mutual information', tex:'I(X;Y)=H(X)-H(X\\mid Y)'},
{t:'p', text:'For a BSC with equal inputs, $H(X)=1$ and $H(X\\mid Y)=H_b(p)$. Substitute both.'},
{t:'eqbox', cap:'BSC with equal inputs', tex:'I(X;Y)=1-H_b(p)',
 after:'At $p=0$ the full bit gets through. At $p=\\tfrac12$ the output is a coin toss and $I=0$. At $p=0.1$, $I=1-0.469=0.531$ bit a use.'},
{t:'fig', svg:fig(figMutual, {p:0.1}), cap:'A BSC with equal inputs, shown at $p=0.1$. The bar is $H(X,Y)$, the line above it $H(X)$ and the line below it $H(Y)$. Their overlap is $I(X;Y)$.'},

{t:'h3', text:'Properties of mutual information'},
{t:'p', text:'Mutual information is symmetric. It follows from Bayes\' rule: $p(x,y)$ is the same read either way. The chain rule gives $H(X\\mid Y)=H(X,Y)-H(Y)$ and $H(Y\\mid X)=H(X,Y)-H(X)$. Substitute either one into the definition.'},
{t:'eqbox', cap:'Symmetry and the joint entropy', tex:['I(X;Y)=H(X)-H(X\\mid Y)=H(Y)-H(Y\\mid X)=I(Y;X)', 'I(X;Y)=H(X)+H(Y)-H(X,Y)\\ge0'],
 after:'Adding $H(X)$ and $H(Y)$ counts the shared part twice, so the joint entropy is subtracted once.'},
{t:'p', text:'A BSC with $p=0.25$ and equal inputs has $H(X)=H(Y)=1$ and $H(X,Y)=1.811$. So $I(X;Y)=1+1-1.811=0.189$ bit.'},
{t:'fig', svg:fig(figMutualProps, null), cap:'The bars for a BSC with $p=0.25$ and equal inputs. The shared middle is the same whether it is read from $X$ or from $Y$.'},
{t:'box', kind:'ok', hd:'Never negative', html:'Seeing $Y$ never adds to the uncertainty about $X$ on average: $H(X\\mid Y)\\le H(X)$. Equality holds when $X$ and $Y$ are independent. Then nothing is shared, and $I(X;Y)=0$.'},

{t:'h3', text:'Information around us'},
{t:'p', text:'In each case below, $I=H(X)-H(X\\mid Y)$ is how much the observation lowers the uncertainty.'},
{t:'ul', items:[
 'A forecast: rain $30\\%$ of days, forecast on $80\\%$ of rainy days and $10\\%$ of dry ones. $I(W;F)='+num(RAIN.I,3)+'$ of $H(W)='+num(RAIN.HX,3)+'$ bits.',
 'A test with $99\\%$ sensitivity and a $5\\%$ false-positive rate. For a condition in $1\\%$ of people, $I(D;T)='+num(testI(0.01),3)+'$ bit a test.',
 'A BPSK receiver that decides each bit. With equal bits $I=1-H_b(p)$ and $p=Q\\bigl(\\sqrt{2E/N_0}\\bigr)$: $'+num(1-hb(Qf(Math.sqrt(2*dB(4)))),3)+'$ bit at $4$ dB.',
 'An $8$-level quantizer of step $0.5\\sigma$ on a Gaussian sample. Its output is fixed by the input, so $I(X;Q)=H(Q)='+num(QZ.H,3)+'$ bits.'
]},
{t:'box', kind:'ok', hd:'Accurate is not informative', html:'A good test of a rare condition says little on average, because it almost always reads negative.'},
{t:'box', kind:'warn', hd:'Deterministic output', html:'When $Y$ is a function of $X$, $H(Y\\mid X)=0$ and $I(X;Y)=H(Y)$.'},

/* ================= 6.5 ================= */
{t:'h2', num:'6.5', text:'Channel capacity'},

{t:'h3', text:'Channel capacity'},
{t:'p', text:'Mutual information depends on the channel and on the input distribution. The channel fixes $p(y\\mid x)$, and the transmitter picks the input distribution. The choice that lets the most through gives the <b>capacity</b>.'},
{t:'eqbox', cap:'Channel capacity', tex:'C=\\max_{p(x)}I(X;Y)\\quad\\text{bits per use}',
 after:'$I(X;Y)$ depends on the input. $C$ does not: the maximum has removed it, so $C$ is a property of the channel alone.'},
{t:'p', text:'The BSC is symmetric in its two inputs. So $I(X;Y)$ is symmetric about $q=p(x_0)=\\tfrac12$, and its peak sits there, with $C=0.531$ at $p=0.1$. The Z-channel of Example 6.2 is not symmetric. Its peak sits at $q=0.6$, with $C=0.322$.'},
{t:'fig', svg:fig(figCapacity, {q:0.5}), cap:'Mutual information against the input distribution, for a BSC with $p=0.1$ (solid) and the Z-channel (dashed), shown at $q=\\tfrac12$. The ring on each peak is its capacity.'},

{t:'h3', text:'Capacity of the binary symmetric channel'},
{t:'p', text:'Write the mutual information from the output side and bound $H(Y)$.'},
{t:'eqbox', cap:'Capacity of the BSC', tex:['\\begin{aligned}I(X;Y)&=H(Y)-H(Y\\mid X)\\\\&=H(Y)-H_b(p)\\\\&\\le1-H_b(p)\\end{aligned}', 'C=1-H_b(p)'],
 after:'Whatever the input, each output is wrong with probability $p$, so $H(Y\\mid X)=H_b(p)$. A binary output has $H(Y)\\le1$. Equal inputs give equal outputs and make $H(Y)=1$.'},
{t:'fig', svg:fig(figBSCcap, null), cap:'The capacity $C=1-H_b(p)$ of the binary symmetric channel (solid) against its crossover $p$, over $H_b(p)$ (dashed). It is $0$ at $p=\\tfrac12$.'},
{t:'p', text:'The capacity is $0$ at $p=\\tfrac12$, where the output ignores the input. At $p=1$ every bit flips, the receiver flips it back, and $C=1$. At $p=0.11$, $H_b=0.500$ and $C=0.500$ bit a use.'},

{t:'h3', text:'The binary erasure channel'},
{t:'p', text:'The <b>binary erasure channel</b> (BEC) never flips a bit. Each bit arrives intact with probability $1-\\epsilon$, or as a flagged erasure $e$ with probability $\\epsilon$.'},
{t:'p', text:'An intact bit leaves no doubt about the input. An erasure leaves the input as uncertain as before. So $H(X\\mid Y)=\\epsilon H(X)$, and the mutual information follows.'},
{t:'eqbox', cap:'Capacity of the BEC', tex:['I(X;Y)=H(X)-\\epsilon H(X)=(1-\\epsilon)H(X)', 'C=1-\\epsilon'],
 after:'Equal inputs give $H(X)=1$ and reach the capacity. The bits that arrive are certain, and only the erased fraction is lost. At $\\epsilon=0.1$ the BEC carries $0.9$ bit a use, and a BSC with $p=0.1$ carries $0.531$.'},
{t:'fig', svg:fig(figBEC, {e:0.1}), cap:'Top: the binary erasure channel, where a lost bit arrives as $e$. Bottom: its capacity (solid) against the BSC with $p=\\epsilon$ (dashed), shown at $\\epsilon=0.1$.'},
{t:'box', kind:'warn', hd:'Flagged against hidden', html:'The BSC hides its errors among good bits, so it loses $H_b(\\epsilon)$ bits a use. That is more than $\\epsilon$ for $\\epsilon<\\tfrac12$.'},

{t:'ex', hd:'Example 6.2 — the Z-channel', rows:[
 ['Given','A $0$ is always received as $0$. A $1$ is received as $0$ or $1$ with probability $\\tfrac12$ each. Let $q=P(X=0)$.'],
 ['Find','The capacity $C$ and the input distribution that reaches it.'],
 ['Method','The channel is not symmetric, so equal inputs need not be best. Write $I(X;Y)=H(Y)-H(Y\\mid X)$ as a function of $q$, and set its derivative to zero.'],
 ['Solution','Only $X=1$ leaves the output uncertain, with $H_b(\\tfrac12)=1$ bit, so $H(Y\\mid X)=1-q$. The output is $1$ with probability $(1-q)/2$, so $I(q)=H_b\\bigl(\\tfrac{1-q}{2}\\bigr)-(1-q)$. The derivative of $H_b(x)$ is $\\log_2\\frac{1-x}{x}$, and $x=\\tfrac{1-q}{2}$ has $\\mathrm{d}x/\\mathrm{d}q=-\\tfrac12$. So $\\mathrm{d}I/\\mathrm{d}q=1-\\tfrac12\\log_2\\frac{1+q}{1-q}$. Setting it to zero gives $\\frac{1+q}{1-q}=4$, so $q^{*}=0.6$. Then $x=0.2$ and $C=H_b(0.2)-0.4=0.7219-0.4=0.3219$ bit a use.'],
 ['Check','Write $H_b(0.2)=0.2\\log_25+0.8\\log_2\\tfrac54=\\log_25-1.6$. Then $C=\\log_25-2=\\log_2\\tfrac54=0.3219$, the same value. The best input sends the reliable $0$ three times in five.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use the maximum over $q$, not equal inputs. At $q=\\tfrac12$, $I=H_b(0.25)-0.5=0.3113$, below $C$. On an asymmetric channel the best input is not uniform.'},
{t:'fig', svg:fig(figZ, null), cap:'Top: the Z-channel. A $0$ always arrives, and a $1$ turns into $0$ half the time. Bottom: $I(X;Y)$ against $q$, with its peak at $q^{*}=0.6$ and the value at $q=\\tfrac12$ (grey).', short:'The Z-channel and its mutual information.'},

{t:'ex', hd:'Example 6.3 — a symmetric three-output channel', rows:[
 ['Given','Three inputs and three outputs. Each row of the channel matrix is a shift of $0.6,0.2,0.2$, so each column is too.'],
 ['Find','The capacity, and the input distribution that reaches it.'],
 ['Method','Every row has the same entropy, so $H(Y\\mid X)=H(0.6,0.2,0.2)$ for any input. Inputs of $\\tfrac13$ each make the outputs equal, because every column holds $0.6,0.2,0.2$. Then $H(Y)=\\log_2K$, its largest value, and $C=\\log_2K-H(\\text{row})$.'],
 ['Solution','$H(0.6,0.2,0.2)=0.442+0.464+0.464=1.371$ bits. So $C=\\log_23-1.371=1.585-1.371=0.2140$ bit a use.'],
 ['Check','One bit needs at least $1/0.214=4.67$ uses of this channel. The uniform input reaches $C$, as the symmetry of the rows requires.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\log_23-H(\\text{row})$, not $\\log_23$, for the capacity. The value $\\log_23=1.585$ is the most any three-output channel carries.'},
{t:'fig', svg:fig(figSym, null), cap:'The channel matrix of Example 6.3 as tiles. Each row is a shift of $0.6,0.2,0.2$. Equal inputs give equal outputs, shown in the bottom row.'},

{t:'h3', text:'Reliable transmission over a noisy channel'},
{t:'p', text:'Capacity also counts the messages a channel keeps apart. Take a channel with four inputs, where each input reaches two of four outputs with probability $\\tfrac12$ each. Every output can then come from two inputs.'},
{t:'p', text:'Use only $x_0$ and $x_2$, whose outputs do not overlap. The receiver never confuses them, so the channel carries one bit a use with no errors.'},
{t:'fig', svg:fig(figWhyCap, {frame:1}), cap:'A four-input channel whose outputs overlap, as tiles. Using only $x_0$ and $x_2$ leaves no output that can come from both.'},
{t:'p', text:'Long blocks do the same for a BSC. A word of $n$ bits almost surely lands among about $2^{nH_b(p)}$ likely outputs, its cloud. Codewords whose clouds do not overlap can be told apart.'},
{t:'eqbox', cap:'Counting codewords', tex:'M\\approx\\frac{2^{n}}{2^{nH_b(p)}}=2^{n(1-H_b(p))}=2^{nC}',
 after:'There are $2^{n}$ output words in all. So about $2^{nC}$ codewords fit, which is $C$ bits a use. At $n=100$ and $p=0.11$, $C=0.5$ and about $2^{100\\times0.5}=2^{50}$ codewords fit.'},
{t:'fig', svg:fig(figWhyCap, {frame:3}), cap:'Long blocks of a BSC: each codeword owns a cloud of about $2^{nH_b(p)}$ likely outputs among the $2^{n}$ output words.'},

{t:'h3', text:'Repetition codes'},
{t:'p', text:'The simplest channel code sends each bit $n$ times, with $n$ odd, and decides by majority. It is a <b>repetition code</b> of rate $R=1/n$. The vote fails when more than half the copies flip.'},
{t:'eqbox', cap:'Error of a repetition code', tex:'P_e=\\sum_{k>n/2}\\binom{n}{k}p^{k}(1-p)^{n-k}'},
{t:'p', text:'On a BSC with $p=0.1$, one copy fails with $P_e=0.1$. Three and five copies need two and three flips to fail.'},
{t:'eqbox', cap:'Repetition on a BSC with $p=0.1$', tex:'\\begin{aligned}n=3:\\quad P_e&=3p^{2}(1-p)+p^{3}\\\\&=0.027+0.001=0.028\\\\n=5:\\quad P_e&=10p^{3}(1-p)^{2}+5p^{4}(1-p)+p^{5}\\\\&=0.0081+0.00045+0.00001\\approx0.0086\\end{aligned}',
 after:'At $n=15$, $P_e=3.36\\times10^{-5}$, but the rate has fallen to $1/15$.'},
{t:'fig', svg:fig(figRepetition, {n:3}), cap:'Repetition codes on a BSC with $p=0.1$: the error after a majority vote against the rate $1/n$, for $n=1,3,\\ldots,15$, with $n=3$ ringed. The green band marks the rates below $C$.'},
{t:'box', kind:'warn', hd:'Rate falls too', html:'Repetition drives the error to zero only as the rate $1/n$ goes to zero. The channel coding theorem promises far better: any rate below $C=0.531$.'},

{t:'h3', text:'The channel coding theorem'},
{t:'p', text:'The <b>channel coding theorem</b> states which rates can be made reliable. Here $R$ is in bits a channel use.'},
{t:'eqbox', cap:'Channel coding theorem', tex:'R<C:\\ P_e\\to0\\ \\text{is possible},\\qquad R>C:\\ \\text{it is not}',
 after:'For $R<C$, codes exist with rate close to $C$ and error as small as asked. They need long blocks, and the theorem does not build them. For $R>C$, no code of any length is reliable.'},
{t:'p', text:'A code of rate $R=0.5$ over a BSC needs $1-H_b(p)>0.5$. That holds for $p<0.11$, where $H_b=0.5$. The repetition codes sit far below the limit, because their rate falls with their error. The theorem says that is unnecessary.'},
{t:'fig', svg:fig(figCodingThm, null), cap:'Over a BSC: rates below $C(p)=1-H_b(p)$ can be made reliable, and rates above it cannot. The violet dots are the repetition codes at $p=0.1$.'},

{t:'h3', text:'A glimpse of codes: the Hamming code'},
{t:'p', text:'Real codes add structure. A single <b>parity bit</b> makes the number of ones in a word even. One error makes it odd, so the error is detected, but its position is not known.'},
{t:'p', text:'The <b>$(7,4)$ Hamming code</b> sends four data bits and three parity bits, a rate of $4/7$. Each parity bit keeps one group of bits even, drawn as one of three circles. Its $16$ codewords differ pairwise in at least $d_{\\min}=3$ places.'},
{t:'eqbox', cap:'Errors corrected', tex:'t=\\Bigl\\lfloor\\frac{d_{\\min}-1}{2}\\Bigr\\rfloor=\\Bigl\\lfloor\\frac{3-1}{2}\\Bigr\\rfloor=1',
 after:'A word with one error is still nearer its own codeword than any other. So one error can be corrected.'},
{t:'p', text:'The bits sit at positions $1$ to $7$. Check $s_1$ covers the positions with a $1$ in the units place of their binary index: $1,3,5,7$. Check $s_2$ covers $2,3,6,7$, and check $s_4$ covers $4,5,6,7$. The failing checks form the <b>syndrome</b> $s_4s_2s_1$, a binary number that names the flipped position.'},
{t:'p', text:'Take the codeword $\\mathtt{0110011}$. Bit $5$ flips, so $\\mathtt{0110111}$ is received. Recompute each check on the received bits $r_1,\\ldots,r_7$.'},
{t:'eqbox', cap:'Syndrome', tex:'\\begin{aligned}s_1&=r_1\\oplus r_3\\oplus r_5\\oplus r_7=0\\oplus1\\oplus1\\oplus1=1\\\\s_2&=r_2\\oplus r_3\\oplus r_6\\oplus r_7=1\\oplus1\\oplus1\\oplus1=0\\\\s_4&=r_4\\oplus r_5\\oplus r_6\\oplus r_7=0\\oplus1\\oplus1\\oplus1=1\\end{aligned}',
 after:'The circles for $s_1$ and $s_4$ fail, and $s_2$ holds. So $s_4s_2s_1=101$, which is $5$ in binary. Flipping bit $5$ back gives $\\mathtt{0110011}$.'},
{t:'fig', svg:fig(figHamming, {frame:3}), cap:'The received word in the three parity circles, at the syndrome step. The circles of $s_1$ and $s_4$ fail (red), and $s_4s_2s_1=101$ names bit $5$.', short:'The Hamming code: a syndrome names the flipped bit.'},

{t:'h3', text:'Sending a source over a channel'},
{t:'p', text:'A source and a channel can now be joined. Compress the source to $H(U)$ bits a symbol, then code those bits for the channel. Both steps can be made reliable when a channel use carries more than the entropy of the symbol it sends.'},
{t:'eqbox', cap:'Source over a channel', tex:'H(U)<C\\quad\\text{bits per channel use}',
 after:'With $R_s$ symbols a second and $R_c$ channel uses a second, compare $H(U)R_s$ with $CR_c$.'},
{t:'p', text:'Take a binary source that emits a $1$ with probability $0.1$, sent over a BSC once a symbol.'},
{t:'eqbox', cap:'A binary source over a BSC', tex:'H_b(0.1)=0.469<1-H_b(\\epsilon)\\iff\\epsilon<0.1206\\ \\text{or}\\ \\epsilon>0.8794',
 after:'At $\\epsilon=0.2$, $C=1-H_b(0.2)=0.278<0.469$, so the link cannot be made reliable.'},
{t:'fig', svg:fig(figTransmission, {e:0.2}), cap:'A binary source with $P(1)=0.1$ sent over a BSC, one use a symbol, shown at $\\epsilon=0.2$. The green bands mark where $C(\\epsilon)$ exceeds $H(U)$.'},

{t:'h3', text:'Capacity around us'},
{t:'p', text:'Each device below is read as a binary channel with stated numbers. The capacity follows from its matrix.'},
{t:'ul', items:[
 'A BPSK receiver that decides each bit is a BSC with $p=Q\\bigl(\\sqrt{2E/N_0}\\bigr)$, so $C=1-H_b(p)$. At $0$ dB, $C='+num(1-hb(Qf(Math.SQRT2)),3)+'$.',
 'A network that loses a fraction $\\epsilon$ of packets, and says which, is an erasure channel: $C=1-\\epsilon$. At $5\\%$ loss, $0.95$ of the rate survives.',
 'A chain of $n$ repeaters, each deciding bits with $p=0.01$, is one BSC with $p_n=\\tfrac12\\bigl(1-(1-2p)^n\\bigr)$. $C$ falls from $0.919$ to $'+num(1-hb(cascP(0.01,10)),3)+'$ in $10$ hops.',
 'A memory cell whose charge leaks, so a stored $1$ reads as $0$ with probability $0.1$, is a Z-channel. $C='+num(CZL.I,3)+'$ at $q='+num(CZL.q,2)+'$.'
]},
{t:'box', kind:'ok', hd:'Erasures are cheap', html:'A lost packet that is flagged costs $\\epsilon$. A flipped bit that is hidden costs $H_b(\\epsilon)$, which is more.'},
{t:'box', kind:'warn', hd:'Hops add up', html:'Each decision adds errors, and capacity only falls along a chain.'},

/* ================= 6.6 ================= */
{t:'h2', num:'6.6', text:'The Gaussian channel'},

{t:'h3', text:'The Gaussian channel'},
{t:'p', text:'The Gaussian channel adds noise to a real-valued input. The input power is limited to $P$, and the noise $Z$ is Gaussian with power $P_N$.'},
{t:'eqbox', cap:'Gaussian channel', tex:'Y=X+Z,\\qquad Z\\sim\\mathcal{N}(0,P_N),\\qquad\\mathrm{E}[X^{2}]\\le P'},
{t:'p', text:'Count the codewords that fit, as for the BSC. Over $n$ uses, a received word lies near its codeword, inside a ball of radius $\\sqrt{nP_N}$. All received words lie inside a ball of radius $\\sqrt{n(P+P_N)}$. Divide the two volumes.'},
{t:'eqbox', cap:'Sphere count', tex:['M\\approx\\frac{\\bigl(\\sqrt{n(P+P_N)}\\bigr)^{n}}{\\bigl(\\sqrt{nP_N}\\bigr)^{n}}=\\Bigl(1+\\frac{P}{P_N}\\Bigr)^{n/2}', 'C=\\frac1n\\log_2M=\\tfrac12\\log_2\\Bigl(1+\\frac{P}{P_N}\\Bigr)\\quad\\text{bits per use}'],
 after:'The volume of a ball in $n$ dimensions grows as its radius to the power $n$, and the constant cancels. At $P/P_N=15$, $C=\\tfrac12\\log_216=2$ bits a use.'},
{t:'fig', svg:fig(figAWGN, {frame:3}, null, 56), cap:'A received word lands near its codeword, inside a noise disc. All received words lie in a larger disc. The count of noise discs that fit inside is $M$.'},

{t:'h3', text:'The capacity of the bandlimited channel'},
{t:'p', text:'A channel of band $W$ carries $2W$ independent samples a second, as in Chapter 1. Each sample is one use of the Gaussian channel. The noise has two-sided density $N_0/2$, so its power in the band is $2W\\cdot N_0/2=N_0W$.'},
{t:'eqbox', cap:'Capacity of the bandlimited channel', tex:'\\begin{aligned}C&=2W\\cdot\\tfrac12\\log_2\\Bigl(1+\\frac{P}{N_0W}\\Bigr)\\\\&=W\\log_2(1+\\text{SNR})\\quad\\text{b/s}\\end{aligned}',
 after:'Here $\\text{SNR}=P/N_0W$ is a ratio, not a value in decibels: $30$ dB is $1000$. A band of $W=1$ MHz at $\\text{SNR}=15$ gives $C=10^{6}\\log_216=4$ Mb/s.'},
{t:'p', text:'At high SNR, $\\log_2(1+\\text{SNR})\\approx\\log_2\\text{SNR}$. So each doubling of the SNR, or $3$ dB, adds one bit a second per hertz.'},
{t:'fig', svg:fig(figShannon, {s:11.76}), cap:'Capacity per hertz against the SNR in dB, shown at $\\text{SNR}=15$, where $C/W=4$ b/s/Hz. At high SNR each $3$ dB adds one bit a second per hertz.'},

{t:'ex', hd:'Example 6.4 — a telephone line', rows:[
 ['Given','A telephone line passes $300$ Hz to $3.4$ kHz at an SNR of $30$ dB.'],
 ['Find','The capacity $C$.'],
 ['Method','The band is $W=3400-300=3100$ Hz. The formula $C=W\\log_2(1+\\text{SNR})$ takes the SNR as a ratio, so convert it first: $\\text{SNR}=10^{30/10}=1000$.'],
 ['Solution','$C=3100\\log_2(1001)=3100\\times9.967=30.9$ kb/s.'],
 ['Check','At $30$ dB, $\\log_21001$ is close to $10$, so each hertz carries about $10$ bits a second. Then $3.1$ kHz carries about $31$ kb/s.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\text{SNR}=1000$, not $30$, inside the logarithm. With $30$ the answer comes out as $3100\\log_2(1+30)=15.4$ kb/s.'},
{t:'fig', svg:fig(figPhone, null), cap:'Capacity of a $3.1$ kHz line against its SNR in dB. The dot is the right answer at $30$ dB, and the ring is the answer with $30$ inside the logarithm.'},

{t:'h3', text:'Capacity against bandwidth'},
{t:'p', text:'A wider band lets more samples through, but it spreads the same power thinner. The SNR $P/N_0W$ falls as $W$ grows, and the two effects nearly cancel.'},
{t:'p', text:'For small $x$, $\\ln(1+x)\\approx x$, so $\\log_2(1+x)\\approx x/\\ln2$. Put $x=P/N_0W$ and let $W$ grow.'},
{t:'eqbox', cap:'Infinite band', tex:'\\begin{aligned}\\lim_{W\\to\\infty}W\\log_2\\Bigl(1+\\frac{P}{N_0W}\\Bigr)&=\\lim_{W\\to\\infty}W\\cdot\\frac{P}{N_0W\\ln2}\\\\&=\\frac{P}{N_0\\ln2}=1.4427\\,\\frac{P}{N_0}\\end{aligned}',
 after:'At a fixed power, capacity levels off however wide the band. At a fixed band it keeps growing with power, but only as the logarithm of the power.'},
{t:'fig', svg:fig(figBandwidth, {w:0}), cap:'Top: capacity against bandwidth at a fixed power, levelling off at the dashed line $1.443\\,P/N_0$, shown at $WN_0/P=1$. Bottom: capacity per hertz against power at a fixed band, which keeps rising.', short:'Capacity against bandwidth and against power.'},

{t:'h3', text:'The bandwidth-efficiency plane'},
{t:'p', text:'The <b>spectral efficiency</b> $r=R_b/W$ is the bit rate carried by each hertz of band. The power is energy a bit times bits a second, $P=E_bR_b$. Put both into $R_b<C$.'},
{t:'eqbox', cap:'Least $E_b/N_0$ for a spectral efficiency', tex:'\\begin{aligned}R_b&<W\\log_2\\Bigl(1+\\frac{E_bR_b}{N_0W}\\Bigr)\\\\r&<\\log_2\\Bigl(1+r\\,\\frac{E_b}{N_0}\\Bigr)\\\\\\frac{E_b}{N_0}&>\\frac{2^{r}-1}{r}\\end{aligned}',
 after:'Divide the first line by $W$ to get the second. Raise $2$ to the power of each side and solve for $E_b/N_0$ to get the third. At $r=2$, $E_b/N_0>(2^{2}-1)/2=1.5$, which is $10\\log_{10}1.5=1.76$ dB.'},
{t:'p', text:'The curve splits the plane into two regions. Above $r=1$ the band is scarce, and a link is <b>bandwidth-limited</b>. Below it power is scarce, and a link is <b>power-limited</b>. No link works to the left of the curve.'},
{t:'fig', svg:fig(figPlane6, {u:1}), cap:'The least $E_b/N_0$ for each spectral efficiency $r$ (line), shown at $r=2$. The cyan dots are the uncoded schemes of Chapter 5 at a symbol error of $10^{-5}$.'},
{t:'box', kind:'warn', hd:'The gap', html:'Each uncoded scheme of Chapter 5 sits several decibels right of the curve. Channel coding exists to close that gap.'},

{t:'h3', text:'The Shannon limit'},
{t:'p', text:'Let the spectral efficiency fall to zero, which spends band freely. The bound then falls toward a floor. For small $r$, $2^{r}=e^{r\\ln2}\\approx1+r\\ln2$.'},
{t:'eqbox', cap:'Shannon limit', tex:'\\begin{aligned}\\frac{E_b}{N_0}&>\\lim_{r\\to0}\\frac{2^{r}-1}{r}=\\lim_{r\\to0}\\frac{r\\ln2}{r}\\\\&=\\ln2=0.693=-1.59\\ \\text{dB}\\end{aligned}',
 after:'No code works below $-1.59$ dB, at any bandwidth. Chapter 5 met the same floor for orthogonal signals as $M$ grows.'},
{t:'p', text:'Uncoded BPSK needs $9.59$ dB for $P_b=10^{-5}$. Its gap to the limit is $9.59-(-1.59)=11.18$ dB. Modern codes come within a fraction of a decibel of the limit.'},
{t:'fig', svg:fig(figLimit, {frame:5}), cap:'The bound $(2^{r}-1)/r$ as $r$ falls: the point walks down to $\\ln2=-1.59$ dB. Shown at the last step, with uncoded BPSK at $P_b=10^{-5}$ placed $11.18$ dB to the right.'},

{t:'h3', text:'Water-filling'},
{t:'p', text:'A total power $P$ must be shared over parallel Gaussian channels with different noise $N_i$.'},
{t:'eqbox', cap:'Parallel channels', tex:'C=\\sum_i\\tfrac12\\log_2\\Bigl(1+\\frac{P_i}{N_i}\\Bigr),\\qquad\\sum_iP_i=P'},
{t:'p', text:'The best share fills every channel up to the same level $\\mu$. Channels whose noise lies above it get nothing.'},
{t:'eqbox', cap:'Water-filling', tex:'P_i=\\max(0,\\ \\mu-N_i)',
 after:'With very little total power, the water first covers the lowest floor. So the quietest channel gets it.'},
{t:'p', text:'Take six channels with noise $0.1,0.2,0.4,0.8,1.6,3.2$ and $P=1$. Guess that three are used, and solve $\\sum_i(\\mu-N_i)=P$ for $\\mu$.'},
{t:'eqbox', cap:'Water level at $P=1$', tex:['3\\mu-(0.1+0.2+0.4)=1\\;\\Longrightarrow\\;\\mu=\\frac{1.7}{3}=0.567', 'P_i=\\mu-N_i=0.467,\\ 0.367,\\ 0.167'],
 after:'The level lies below $0.8$, the noise of the fourth channel, so three channels are used.'},
{t:'p', text:'Each used channel has $1+P_i/N_i=\\mu/N_i$. Add the three capacities.'},
{t:'eqbox', cap:'Capacity at $P=1$', tex:'\\begin{aligned}C&=\\tfrac12\\log_2\\frac{0.567}{0.1}+\\tfrac12\\log_2\\frac{0.567}{0.2}+\\tfrac12\\log_2\\frac{0.567}{0.4}\\\\&=1.251+0.751+0.251=2.254\\ \\text{bits}\\end{aligned}',
 after:'Equal shares give $1.641$ bits.'},
{t:'fig', svg:fig(figWater, {P:1}), cap:'Six channels with noise $0.1$ to $3.2$ (grey). Power (cyan) is poured in up to one level $\\mu$, shown at $P=1$.'},

{t:'h3', text:'Shannon\'s formula around us'},
{t:'p', text:'$C=W\\log_2(1+P/N_0W)$ takes a width in hertz and a ratio, never a ratio in dB. Four uses of it:'},
{t:'ul', items:[
 'A telephone line passes $300$ Hz to $3.4$ kHz. At an SNR of $30$ dB, $C=W\\log_2(1+\\text{SNR})=30.9$ kb/s.',
 'A radio channel $20$ MHz wide at an assumed SNR of $20$ dB: $C=20\\log_2101='+num(20*lg(101),0)+'$ Mb/s.',
 'A deep-space link with an assumed $P/N_0=10^{4}$ Hz. More band helps less and less: $C\\to P/(N_0\\ln2)='+num(10/Math.LN2,1)+'$ kb/s.',
 'DSL splits its band into tones $4.3125$ kHz apart. With noise rising in frequency, water-filling gives tone $k$ the bits $b_k=\\log_2(1+P_k/N_k)$.'
]},
{t:'box', kind:'ok', hd:'Two regimes', html:'A wide band at low SNR is power-limited. A narrow band at high SNR is bandwidth-limited.'},
{t:'box', kind:'warn', hd:'Assumed numbers', html:'The SNR and $P/N_0$ here are assumptions for the example, not a claim about any standard.'},

/* ================= 6.7 ================= */
{t:'h2', num:'6.7', text:'Summary'},
{t:'h3', text:'From a source to a channel'},
{t:'p', text:'Follow one source through a Huffman code and a BPSK link, and check that it fits the capacity.'},
{t:'p', text:'The source $0.4,0.2,0.2,0.1,0.1$ emits $R_s=1000$ symbols a second. It has $H=2.122$ bits a symbol. The Huffman code of Section 6.3 spends $\\bar{L}=2.2$, so $2200$ b/s leave the encoder.'},
{t:'p', text:'The bits go by BPSK at $R_c=3000$ bits a second and $4$ dB, decided bit by bit. That is a BSC with $p=0.0125$ and $C=1-H_b(0.0125)=0.903$ bit a use.'},
{t:'eqbox', cap:'The check', tex:'H\\,R_s=2.122\\times1000=2122\\ \\text{b/s}\\;<\\;C\\,R_c=0.903\\times3000=2709\\ \\text{b/s}',
 after:'A channel code of rate $2200/3000=0.733<C$ exists that makes the link reliable. At $R_c=2000$ uses a second, $CR_c=0.903\\times2000=1806<2122$ b/s, and the link cannot be made reliable.'},
{t:'fig', svg:fig(figChain6, {frame:5}), cap:'The source of $0.4,0.2,0.2,0.1,0.1$ at $1000$ symbols a second, a Huffman code, and BPSK at $3000$ bits a second and $4$ dB. The bars compare the rates.', short:'A source sent over a BPSK link.'},

{t:'h3', text:'Quick check'},
{t:'q', n:'1', text:'Eight equally likely symbols have an entropy of $1$ bit, $3$ bits or $8$ bits?', ans:'$3$ bits, since $\\log_28=3$.'},
{t:'q', n:'2', text:'Codeword lengths $1,2,3,3$ give a Kraft sum of $0.875$, $1$ or $1.25$?', ans:'$1$, since $\\tfrac12+\\tfrac14+\\tfrac18+\\tfrac18=1$.'},
{t:'q', n:'3', text:'A Huffman code for a source of entropy $H$ has $\\bar{L}$ below $H$, in $[H,H+1)$, or above $H+1$?', ans:'In $[H,H+1)$. It meets the source-coding bound.'},
{t:'q', n:'4', text:'For independent $X$ and $Y$, is $I(X;Y)$ equal to $0$, $H(X)$ or $H(X,Y)$?', ans:'$0$, since $H(X\\mid Y)=H(X)$.'},
{t:'q', n:'5', text:'A binary erasure channel with $\\epsilon=0.2$ has capacity $0.2$, $0.278$ or $0.8$?', ans:'$0.8$, since $C=1-\\epsilon$.'},
{t:'q', n:'6', text:'Below which $E_b/N_0$ can no code be reliable: $-1.59$ dB, $0$ dB or $9.59$ dB?', ans:'$-1.59$ dB, since $\\ln2=0.693$, which is $-1.59$ dB.'},

{t:'h3', text:'Results of the chapter'},
{t:'table', cap:'Summary of Chapter 6: an introduction to information theory.', head:['Question','Result','Anchor'], rows:[
 ['How much information does a symbol carry?','$I(s_k)=-\\log_2p_k$ bits: rare symbols carry more.','PS CH12.1.1'],
 ['What is entropy, and what bounds it?','$H(S)=-\\sum_kp_k\\log_2p_k$, with $0\\le H\\le\\log_2K$.','PS CH12.1.1'],
 ['What does an extended source carry?','$H(S^{n})=nH(S)$ for a memoryless source.','PS CH12.1.2'],
 ['What are typical sequences?','About $2^{nH}$ sequences, each of probability near $2^{-nH}$, that hold almost all the probability.','PS CH12.2'],
 ['When do codeword lengths allow a prefix code?','Exactly when $\\sum_k2^{-l_k}\\le1$.','&mdash;'],
 ['How close can a code get to the entropy?','$H\\le\\bar{L}<H+1$, and $H+1/n$ for blocks of $n$.','PS CH12.3.1'],
 ['How is a Huffman code built?','Merge the two least likely entries until one is left, then read each codeword back.','PS CH12.3.1'],
 ['What does Lempel–Ziv need to know about the source?','Nothing. It parses the stream into new phrases, and its cost falls toward $H$ as the stream grows.','PS CH12.3.2'],
 ['What is a binary symmetric channel?','Each bit flips with probability $p$. Hard-decision BPSK gives $p=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.','PS CH12.4'],
 ['What is mutual information?','$I(X;Y)=H(X)-H(X\\mid Y)$, symmetric and never negative.','PS CH12.1.3'],
 ['What is the capacity of a channel?','$C=\\max_{p(x)}I(X;Y)$: $1-H_b(p)$ for the BSC, $1-\\epsilon$ for the erasure channel.','PS CH12.5'],
 ['What does the channel coding theorem say?','Rates below $C$ can be made reliable. Rates above it cannot.','PS CH12.5'],
 ['What is the capacity of a bandlimited channel?','$C=W\\log_2(1+P/N_0W)$ b/s, which levels off at $1.44\\,P/N_0$ as $W$ grows.','PS CH12.5.1'],
 ['What is the Shannon limit?','$E_b/N_0>\\ln2=-1.59$ dB. Uncoded BPSK sits $11.2$ dB above it.','PS CH12.6']
]},
{t:'p', text:'Compress the source to its entropy, then code it for the channel below capacity. Chapter 7 builds those channel codes.'},

{t:'h3', text:'Projects to try'},
{t:'p', text:'Four optional projects use the chapter on real text and simulated channels. Each gives an aim, what it practises, a few steps and what to look for.'},
{t:'box', kind:'def', hd:'An entropy meter and a Huffman coder', html:'Measure the entropy of a text and code it with a Huffman code built from its own counts.<br><b>Practises:</b> Letter frequencies as probabilities. Building a Huffman code by repeated merges. Average length against entropy.<ol><li>Count the letters and spaces of a long text.</li><li>Compute the entropy of one letter.</li><li>Build a Huffman code and encode the text.</li><li>Decode it and check that nothing changed.</li></ol><b>Look for:</b> the bits a letter sit just above the entropy, and far above the $1.3$ bits of English with its memory.'},
{t:'box', kind:'def', hd:'An LZ78 compressor', html:'Compress binary streams with LZ78 and compare the cost with the entropy.<br><b>Practises:</b> Parsing a stream into new phrases. A pointer and one new bit a phrase. Why a universal code needs long streams.<ol><li>Draw bits with $P(1)=p$ for several $p$.</li><li>Parse each stream and count the phrases.</li><li>Compute the bits sent a source bit.</li><li>Plot the cost against the stream length and $H_b(p)$.</li></ol><b>Look for:</b> the cost falls slowly toward $H_b(p)$ and never below it.'},
{t:'box', kind:'def', hd:'A BSC simulator', html:'Send bits over a simulated BSC with repetition codes and a Hamming code.<br><b>Practises:</b> Majority voting over copies. Syndrome decoding of one error. Rate against error, next to capacity.<ol><li>Flip random bits with probability $p$.</li><li>Code with repetition $n=1,3,5$ and with the $(7,4)$ Hamming code.</li><li>Decode and count the bit errors.</li><li>Plot error against rate with $C=1-H_b(p)$.</li></ol><b>Look for:</b> the Hamming code gives more rate than repetition at a similar error, and all points sit left of $C$.'},
{t:'box', kind:'def', hd:'Water-filling on a line', html:'Share power over the tones of a line whose noise rises with frequency.<br><b>Practises:</b> Parallel Gaussian channels. The water level found by bisection. Why the noisiest tones get nothing.<ol><li>Choose a noise floor that grows with frequency over $64$ tones.</li><li>Find the water level for a total power by bisection.</li><li>Compute the bits each tone carries.</li><li>Compare the total with equal shares as the power changes.</li></ol><b>Look for:</b> at low power a few quiet tones carry everything. At high power the shares become nearly equal.'}

];
})();
