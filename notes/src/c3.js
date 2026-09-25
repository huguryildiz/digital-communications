/* Course notes — Chapter 3. Every slide scene of Module 3 except the laboratories and
   the code pages appears here, in slide order (build/src/84_scenes_m3.js). */
(function(){
const P=PLOT, C=P.COL;
const f2=v=>v.toFixed(2);

/* ---- drawing helpers, the same as the slides use ---------------------------- */
/* A piecewise-constant waveform, given as [start, end, value] pieces, and its
   outline with the vertical edges drawn. */
const pwc=segs=>t=>{ for(const s of segs) if(t>=s[0]&&t<s[1]) return s[2]; return 0; };
function outline(segs,lo,hi){
  const pts=[[lo,0]]; let x=lo, y=0;
  segs.forEach(([a,b,v])=>{ if(a>x+1e-12){ if(y!==0) pts.push([x,0]); pts.push([a,0]); }
    pts.push([a,v],[b,v]); x=b; y=v; });
  pts.push([x,0],[hi,0]);
  return pts;
}
function arrow(a,x0,y0,x1,y1,o={}){
  const X0=a.sx(x0), Y0=a.sy(y0), X1=a.sx(x1), Y1=a.sy(y1), L=Math.hypot(X1-X0,Y1-Y0);
  if(L<3) return;
  const ux=(X1-X0)/L, uy=(Y1-Y0)/L, hd=12*(o.head||1), col=o.color||C.in;
  a.raw(`<line x1="${f2(X0)}" y1="${f2(Y0)}" x2="${f2(X1-hd*0.8*ux)}" y2="${f2(Y1-hd*0.8*uy)}" stroke="${col}" stroke-width="${o.width||2.6}" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}/>`
    +`<path d="M${f2(X1)},${f2(Y1)} L${f2(X1-hd*ux-hd*0.42*uy)},${f2(Y1-hd*uy+hd*0.42*ux)} L${f2(X1-hd*ux+hd*0.42*uy)},${f2(Y1-hd*uy-hd*0.42*ux)} Z" fill="${col}"/>`);
}
function seg(a,pts,o={}){
  if(pts.length<2) return;
  const d='M'+pts.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L');
  a.raw(`<path d="${d}" fill="none" stroke="${o.color||C.muted}" stroke-width="${o.width||1.4}" stroke-linejoin="round" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}/>`);
}
const circle=(a,r,o={})=>{ const pts=[]; for(let i=0;i<=160;i++){ const u=2*Math.PI*i/160; pts.push([r*Math.cos(u),r*Math.sin(u)]); }
  seg(a,pts,Object.assign({color:C.muted,width:1.2,dash:'4 5'},o)); };
/* A signed area under a trace, as a translucent fill of the trace's colour. */
function shade(a,f,lo,hi,col,op){
  const n=240, pts=[];
  for(let i=0;i<=n;i++){ const t=lo+(hi-lo)*i/n; pts.push(f2(a.sx(t))+','+f2(a.sy(f(t)))); }
  a.raw(`<path d="M${f2(a.sx(lo))},${f2(a.sy(0))}L${pts.join('L')}L${f2(a.sx(hi))},${f2(a.sy(0))}Z" fill="${col}" fill-opacity="${op==null?0.22:op}" stroke="none"/>`);
}
/* Time ticks drawn under the lower edge of the data area, where no step of a
   waveform can cross them. An axes that takes these passes xticksOverride:[]. */
function bottomTicks(a,vals){
  const L=P.labelScale();
  vals.forEach(v=>{ const X=f2(a.sx(v));
    a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${a.y0+5}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${X}" y="${f2(a.y0+19*L)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="middle">${v}</text>`); });
  return a;
}
const TAx=o=>{ const xt=o.xt; const a=P.Axes(Object.assign({},o,{xticksOverride:[]})); return xt?bottomTicks(a,xt):a; };
const bare=o=>Object.assign({xticksOverride:[],yticksOverride:[],grid:false,zeroAxes:false,arrows:false},o);
/* A signal-space plane drawn to one scale on both axes, so a circle is round.
   `need` is the smallest range each axis must show. */
function plane(o){
  const h=o.h||380;
  const base=Object.assign({w:560,pad:{l:56,r:26,t:24,b:42},xlabel:'\\psi_1',ylabel:'\\psi_2'},o,{h});
  delete base.need;
  const [nx,ny]=o.need;
  const pr=P.Axes(Object.assign({},base,{xr:nx,yr:ny}));
  const k=Math.min((pr.x1-pr.x0)/(nx[1]-nx[0]),(pr.y0-pr.y1)/(ny[1]-ny[0]));
  const cx=(nx[0]+nx[1])/2, cy=(ny[0]+ny[1])/2, hx=(pr.x1-pr.x0)/k/2, hy=(pr.y0-pr.y1)/k/2;
  return P.Axes(Object.assign({},base,{xr:[cx-hx,cx+hx],yr:[cy-hy,cy+hy]}));
}
const lab=(a,x,y,s,col,anchor)=>a.note(x,y,s,{tex:true,fs:15,color:col,anchor:anchor||'start'});
/* Labelled points, each label outside the square its point sits on. */
function points(a,pts,r){ pts.forEach(([x,y,l])=>{ a.point(x,y,{color:C.in,r:r||7});
  if(l) lab(a,x+(x>0?0.14:-0.14),y+(y>0?0.18:-0.38),l,C.in,x>0?'start':'end'); }); }

/* Panels joined into one figure. The notes stylesheet gives every svg inside a
   figure the full width, so the panels are placed as translated groups rather
   than as nested svg elements. `narrow` sets how much of the column the figure
   takes, so a plane is not drawn at the full width of the page. */
const inner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const FONT=`font-family="Inter,-apple-system,'Segoe UI',sans-serif"`;
const stack=(w,parts)=>{ let y=0, s='';
  parts.forEach(([svg,h])=>{ s+=`<g transform="translate(0,${y})">${inner(svg)}</g>`; y+=h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img" ${FONT}>${s}</svg>`; };
const row=(h,parts)=>{ let x=0, s='';
  parts.forEach(([svg,w])=>{ s+=`<g transform="translate(${x},0)">${inner(svg)}</g>`; x+=w; });
  return `<svg viewBox="0 0 ${x} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" ${FONT}>${s}</svg>`; };
const narrow=(svg,pct)=>svg.replace(/^<svg /,`<svg style="max-width:${pct}%;margin:0 auto" `);

/* ---- the signal sets of the chapter, as on the slides ----------------------- */
const S0=[[0,0.5,1],[0.5,1,-1]], S1=[[0,0.25,1],[0.25,0.75,-1],[0.75,1,1]];
const HALF1=[[0,1,1]], HALF2=[[1,2,1]];
const halves=([a,b])=>[[0,1,a],[1,2,b]];
const SQ=[[1,1,'\\mathbf{s}_1'],[1,-1,'\\mathbf{s}_2'],[-1,1,'\\mathbf{s}_3'],[-1,-1,'\\mathbf{s}_4']];
const QP=[[-1,1,'\\mathbf{s}_1'],[1,1,'\\mathbf{s}_2'],[-1,-1,'\\mathbf{s}_3'],[1,-1,'\\mathbf{s}_4']];
const GS3=[[[0,2,1]],[[2,3,1]],[[0,3,1]]];
const GS4V=[[Math.SQRT2,0,0],[0,Math.SQRT2,0],[0,-Math.SQRT2,1],[Math.SQRT2,0,1]];
/* The carrier axes with T = 1 and f_c T = 3. */
const FC=3;
const cosB=t=>(t>=0&&t<=1)?Math.SQRT2*Math.cos(2*Math.PI*FC*t):0;
const sinB=t=>(t>=0&&t<=1)?Math.SQRT2*Math.sin(2*Math.PI*FC*t):0;

/* ---- the figures ------------------------------------------------------------- */
function figTwoAxes(){
  const pan=(segs,name,col,h,last)=>{ const a=TAx({w:560,h,xr:[-0.05,1.1],yr:[-1.6,1.6],ynameAtAxis:true,
      xlabel:last?'t/T':'',ylabel:name,pad:{l:56,r:26,t:24,b:last?36:12},
      xt:last?[0,0.25,0.5,0.75,1]:null,yticksOverride:[-1,0,1]});
    if(col===C.mid) shade(a,pwc(segs),0,1,C.mid,0.2);
    a.poly(outline(segs,-0.05,1.1),{color:col,width:2.4});
    return a.svg(); };
  const prod=[[0,0.25,1],[0.25,0.5,-1],[0.5,0.75,1],[0.75,1,-1]];
  return narrow(stack(560,[[pan(S0,'s_0(t)',C.in,120),120],[pan(S1,'s_1(t)',C.in,120),120],
    [pan(prod,'s_0(t)\\,s_1(t)',C.mid,160,true),160]]),64);
}
function figOrtho(){
  const a=plane({need:[[-0.35,2.0],[-0.35,1.35]],xlabel:'\\mathbf{e}_1',ylabel:'\\mathbf{e}_2',xticksOverride:[],yticksOverride:[]});
  seg(a,[[1.6,0],[1.6,0.9]],{dash:'4 5'}); seg(a,[[0,0.9],[1.6,0.9]],{dash:'4 5'});
  arrow(a,0,0,1,0,{color:C.h,width:3.2}); arrow(a,0,0,0,1,{color:C.h,width:3.2});
  arrow(a,0,0,1.6,0.9,{color:C.in});
  a.note(1.66,1.02,'\\mathbf{a}=(a_1,a_2)',{tex:true,fs:15,color:C.in,anchor:'middle'});
  a.note(1.6,-0.2,'a_1',{tex:true,fs:15,color:C.muted,anchor:'middle'});
  a.note(-0.1,0.9,'a_2',{tex:true,fs:15,color:C.muted,anchor:'end'});
  return narrow(a.svg(),56);
}
function figProject(){
  const s1=1.5, s2=-1;
  const a=TAx({w:560,h:180,xr:[-0.1,2.25],yr:[-2.4,2.4],xlabel:'t',ylabel:'s(t)',
    pad:{l:56,r:26,t:18,b:36},xt:[0,1,2],yticksOverride:[-2,-1,0,1,2]});
  a.poly(outline(HALF1,-0.1,2.25),{color:C.h,width:1.6,dash:'6 5'});
  a.poly(outline(HALF2,-0.1,2.25),{color:C.h,width:1.6,dash:'6 5'});
  a.poly(outline(halves([s1,s2]),-0.1,2.25),{color:C.in,width:2.6});
  const b=plane({h:250,need:[[-2.3,2.3],[-2.3,2.3]],xticksOverride:[-2,-1,1,2],yticksOverride:[-2,-1,1,2]});
  seg(b,[[s1,0],[s1,s2]],{dash:'4 5'}); seg(b,[[0,s2],[s1,s2]],{dash:'4 5'});
  b.point(s1,s2,{color:C.in,r:6.5});
  b.note(b.o.xr[1]-0.15,b.o.yr[1]-0.45,'\\mathbf{s}=(1.5,\\,-1)',{tex:true,fs:15,color:C.in,anchor:'end'});
  return narrow(stack(560,[[a.svg(),180],[b.svg(),250]]),62);
}
function figAnalyzer(){
  const ys=[50,140,262], nm=['1','2','N'];
  const it=[
    {t:'arrow',x1:8,y1:140,x2:60,y2:140}, {t:'line',d:'M60,50 V262'},
    {t:'text',x:10,y:118,label:'s_i(t)',tex:true,fs:16,anchor:'start'},
    {t:'text',x:215,y:212,label:'\\smash{\\vdots}',tex:true,fs:16}
  ];
  ys.forEach((y,k)=>{ it.push({t:'arrow',x1:60,y1:y,x2:100,y2:y},
    {t:'box',x:100,y:y-30,w:230,h:60,label:'\\int_0^T(\\cdot)\\,\\psi_'+nm[k]+'(t)\\,dt',tex:true,fs:15},
    {t:'arrow',x1:330,y1:y,x2:410,y2:y},
    {t:'text',x:448,y:y+6,label:'s_{i'+nm[k]+'}',tex:true,fs:16}); });
  it.push({t:'line',d:'M488,50 H505 V262 H488'}, {t:'arrow',x1:505,y1:156,x2:540,y2:156},
    {t:'text',x:572,y:163,label:'\\mathbf{s}_i',tex:true,fs:17});
  return narrow(P.blocks({w:600,h:300,items:it}),62);
}
function figInner(){
  const X=[[0,1,2],[1,2,1]], Y=[[0,1,1],[1,2,-1]], XY=[[0,1,2],[1,2,-1]];
  const pan=(segs,name,h,yr,last,fn)=>{ const a=TAx({w:560,h,xr:[-0.1,2.25],yr,
      xlabel:last?'t':'',ylabel:name,pad:{l:56,r:26,t:24,b:last?36:12},
      xt:last?[0,1,2]:null,yticksOverride:[-1,0,1,2]});
    (fn||(()=>a.poly(outline(segs,-0.1,2.25),{color:C.in,width:2.4})))(a);
    return a.svg(); };
  const p3=pan(XY,'x(t)\\,y(t)',170,[-2.2,3.0],true,a=>{
    shade(a,pwc(XY),0,2,C.mid,0.24);
    seg(a,outline(XY,-0.1,2.25),{color:C.mid,width:2.4});
    a.note(0.5,2.35,'+2',{tex:true,fs:15,color:C.mid,anchor:'middle'});
    a.note(1.5,-2.0,'-1',{tex:true,fs:15,color:C.mid,anchor:'middle'}); });
  return narrow(stack(560,[[pan(X,'x(t)',115,[-1.5,2.6]),115],[pan(Y,'y(t)',115,[-1.5,2.6]),115],[p3,170]]),64);
}
/* s1 at (1,1) and s2 turned by 90 degrees, to (-1,1). */
function figEnergy(){
  const r=Math.SQRT2, p1=[1,1], p2=[-1,1];
  const a=plane({need:[[-1.9,1.9],[-1.9,1.9]],xticksOverride:[],yticksOverride:[]});
  circle(a,r);
  arrow(a,0,0,p1[0],p1[1],{color:C.in,width:2.2}); arrow(a,0,0,p2[0],p2[1],{color:C.in,width:2.2});
  seg(a,[p1,p2],{color:C.mid,width:2.6});
  a.point(p1[0],p1[1],{color:C.in,r:6.5}); a.point(p2[0],p2[1],{color:C.in,r:6.5});
  const out=p=>[p[0]*(1+0.3/r),p[1]*(1+0.3/r)], l1=out(p1), l2=out(p2);
  a.note(l1[0],l1[1]-0.08,'\\mathbf{s}_1',{tex:true,fs:15,color:C.in,anchor:'middle'});
  a.note(l2[0],l2[1]-0.08,'\\mathbf{s}_2',{tex:true,fs:15,color:C.in,anchor:'middle'});
  a.note(0.08,1.5,'d=2',{tex:true,fs:15,color:C.mid});
  return narrow(a.svg(),50);
}
function figInspect(){
  const small=k=>{ const [x,y]=SQ[k], lo=k>1, a=TAx({w:280,h:lo?140:110,xr:[-0.1,2.3],yr:[-1.6,1.6],
      xlabel:lo?'t':'',xnameDrop:30,ylabel:'s_'+(k+1)+'(t)',pad:{l:50,r:18,t:14,b:lo?34:10},xt:lo?[0,1,2]:null,yticksOverride:[-1,1]});
    a.poly(outline(halves([x,y]),-0.1,2.3),{color:C.in,width:2.2});
    return a.svg(); };
  const b=plane({h:260,need:[[-1.9,1.9],[-1.75,1.75]],xticksOverride:[-1,1],yticksOverride:[-1,1]});
  SQ.forEach(([x,y])=>seg(b,[[x,0],[x,y],[0,y]],{dash:'4 5'}));
  points(b,SQ,6.5);
  return narrow(stack(560,[[row(110,[[small(0),280],[small(1),280]]),110],
                           [row(140,[[small(2),280],[small(3),280]]),140],[b.svg(),260]]),64);
}
function figConst(){
  const a=plane({need:[[-2,2],[-1.9,1.9]],xticksOverride:[-1,1],yticksOverride:[-1,1]});
  circle(a,Math.SQRT2);
  seg(a,[[0,0],[-1,1]],{color:C.mid,width:2.4});
  a.note(-0.34,0.1,'\\sqrt{E}=\\sqrt2',{tex:true,fs:15,color:C.mid,anchor:'end'});
  seg(a,[[1,1],[1,-1]],{color:C.mid,width:2.4});
  a.note(0.86,0.45,'d=2',{tex:true,fs:15,color:C.mid,anchor:'end'});
  points(a,SQ);
  return narrow(a.svg(),50);
}
/* Antipodal, orthogonal and on-off at the same average energy E_b = 1. */
function figBinary(){
  const SETS=[[[1,0],[-1,0]],[[1,0],[0,1]],[[Math.SQRT2,0],[0,0]]];
  const D=['d=2\\sqrt{E_b}','d=\\sqrt{2E_b}','d=\\sqrt{2E_b}'];
  /* A panel is narrower than the slide's figure, so no label fits inside its
     circle clear of an axis: each one is set above the circle. */
  const L=[[0.18,1.1,'start'],[0.18,1.1,'start'],[0.18,1.1,'start']];
  const pan=k=>{ const [A,B]=SETS[k], a=plane({w:360,h:260,pad:{l:46,r:22,t:24,b:40},
      need:[[-1.8,1.9],[-0.7,1.5]],xticksOverride:[],yticksOverride:[]});
    circle(a,1);
    seg(a,[A,B],{color:C.mid,width:2.6});
    a.point(A[0],A[1],{color:C.in,r:7}); a.point(B[0],B[1],{color:C.in,r:7});
    const [x,y,an]=L[k]; a.note(x,y,D[k],{tex:true,fs:15,color:C.mid,anchor:an});
    return a.svg(); };
  return row(260,[[pan(0),360],[pan(1),360],[pan(2),360]]);
}
/* The carrier with phase 45 degrees, E = 1 and f_c T = 3, and its point. */
function figPassband(){
  const th=Math.PI/4;
  const a=TAx({w:560,h:160,xr:[-0.03,1.08],yr:[-1.8,1.8],xlabel:'t/T',ylabel:'s(t)',
    pad:{l:56,r:26,t:18,b:36},xt:[0,0.5,1],yticksOverride:[-1,0,1]});
  a.curve(t=>t>=0&&t<=1?Math.SQRT2*Math.cos(2*Math.PI*FC*t-th):0,{color:C.in,width:2.4,n:900});
  const b=plane({h:260,need:[[-1.6,1.6],[-1.45,1.45]],xticksOverride:[],yticksOverride:[]});
  circle(b,1);
  const x=Math.cos(th), y=Math.sin(th);
  seg(b,[[x,0],[x,y],[0,y]],{dash:'4 5'});
  arrow(b,0,0,x,y,{color:C.in,width:2.2});
  b.point(x,y,{color:C.in,r:6.5});
  b.note(x*1.28,y*1.28-0.08,'(0.71,\\,0.71)',{tex:true,fs:15,color:C.in,anchor:'start'});
  return narrow(stack(560,[[a.svg(),160],[b.svg(),260]]),62);
}
function figExQpsk(){
  const a=plane({need:[[-2,2],[-1.9,1.9]],xticksOverride:[-1,1],yticksOverride:[-1,1]});
  points(a,QP);
  return narrow(a.svg(),50);
}
/* Each panel carries one point's pulse pair (dashed) and its carrier waveform
   (solid). The constellation below is the one both sets share. */
function figRemarks(){
  const pulse=([x,y])=>pwc([[0,0.5,Math.SQRT2*x],[0.5,1,Math.SQRT2*y]]);
  const carr=([x,y])=>t=>x*cosB(t)+y*sinB(t);
  const small=(p,lo)=>{ const a=TAx({w:280,h:lo?140:110,xr:[-0.04,1.3],yr:[-2.4,2.4],
      xlabel:lo?'t/T':'',xnameDrop:30,ylabel:'('+p[0]+','+p[1]+')',pad:{l:50,r:18,t:14,b:lo?34:10},xt:lo?[0,0.5,1]:null,yticksOverride:[-2,0,2]});
    a.curve(pulse(p),{color:C.in,width:2.0,n:600,dash:'6 4'});
    a.curve(carr(p),{color:C.in,width:1.6,n:600});
    return a.svg(); };
  const b=plane({h:190,need:[[-1.9,1.9],[-1.6,1.6]],xticksOverride:[-1,1],yticksOverride:[-1,1]});
  SQ.forEach(p=>b.point(p[0],p[1],{color:C.in,r:7}));
  return narrow(stack(560,[[row(110,[[small(SQ[0]),280],[small(SQ[1]),280]]),110],
                           [row(140,[[small(SQ[2],true),280],[small(SQ[3],true),280]]),140],[b.svg(),190]]),64);
}
/* 8-PSK at E = 1 and the nearest pair. */
function figPsk(){
  const M=8, a=plane({need:[[-1.55,1.55],[-1.5,1.5]],xticksOverride:[],yticksOverride:[]});
  circle(a,1);
  seg(a,[[1,0],[Math.cos(2*Math.PI/M),Math.sin(2*Math.PI/M)]],{color:C.mid,width:2.6});
  for(let i=0;i<M;i++) a.point(Math.cos(2*Math.PI*i/M),Math.sin(2*Math.PI*i/M),{color:C.in,r:6.5});
  const u=Math.PI/M;
  a.note(1.24*Math.cos(u)+0.02,1.24*Math.sin(u)-0.04,'d_{\\min}=0.765',{tex:true,fs:15,color:C.mid});
  return narrow(a.svg(),50);
}
/* The procedure on two vectors: s_1 along the first axis, s_2 split into its
   part along psi_1 and the remainder g_2. */
function figGs(){
  const a=plane(bare({need:[[-0.55,2.95],[-0.45,2.2]],xlabel:'',ylabel:''}));
  arrow(a,0,0,2.4,0,{color:C.in}); arrow(a,0,0,1.5,1.8,{color:C.in});
  a.note(2.5,-0.04,'s_1',{tex:true,fs:16,color:C.in});
  a.note(1.58,1.9,'s_2',{tex:true,fs:16,color:C.in});
  arrow(a,0,0,1,0,{color:C.h,width:4});
  a.note(0.5,0.16,'\\psi_1',{tex:true,fs:16,color:C.h,anchor:'middle'});
  seg(a,[[1.5,1.8],[1.5,0]],{dash:'4 5'});
  seg(a,[[0,-0.1],[0,-0.16],[1.5,-0.16],[1.5,-0.1]],{color:C.mid,width:1.8});
  a.note(0.75,-0.36,'s_{21}\\psi_1',{tex:true,fs:15,color:C.mid,anchor:'middle'});
  arrow(a,1.5,0,1.5,1.8,{color:C.mid});
  seg(a,[[1.5,0.14],[1.64,0.14],[1.64,0]],{color:C.mid,width:1.4});
  a.note(1.62,0.95,'g_2',{tex:true,fs:16,color:C.mid});
  arrow(a,0,0,0,1,{color:C.h,width:4});
  a.note(-0.1,0.5,'\\psi_2',{tex:true,fs:16,color:C.h,anchor:'end'});
  return narrow(a.svg(),54);
}
function figExGs(){
  const pan=(k,h,last)=>{ const a=TAx({w:560,h,xr:[-0.1,3.3],yr:[-0.3,1.45],
      xlabel:last?'t':'',ylabel:['s_1,\\;\\psi_1','s_2,\\;\\psi_2','s_3,\\;g_3'][k],pad:{l:56,r:26,t:24,b:last?36:12},
      xt:last?[0,1,2,3]:null,yticksOverride:[0,1]});
    a.poly(outline(GS3[k],-0.1,3.3),{color:C.in,width:1.8,dash:'6 5'});
    if(k===0) seg(a,outline([[0,2,1/Math.SQRT2]],-0.1,3.3),{color:C.h,width:2.8});
    if(k===1) seg(a,outline([[2,3,1]],-0.1,3.3),{color:C.h,width:2.8});
    if(k===2){ seg(a,[[0,0],[3,0]],{color:C.mid,width:4});
      a.note(1.5,0.42,'g_3=0',{tex:true,fs:15,color:C.mid,anchor:'middle'}); }
    return a.svg(); };
  return narrow(stack(560,[[pan(0,122),122],[pan(1,122),122],[pan(2,160,true),160]]),64);
}
/* Four signals in three dimensions, seen from 30 degrees. */
function figExGsB(){
  const az=Math.PI/6, el=22*Math.PI/180;
  const pr=(x,y,z)=>[x*Math.cos(az)-y*Math.sin(az), z*Math.cos(el)+(x*Math.sin(az)+y*Math.cos(az))*Math.sin(el)];
  const a=plane(bare({need:[[-2.2,2.3],[-1.2,2.0]],xlabel:'',ylabel:''}));
  const ax=(p,q,name,lp)=>{ const P0=pr(...p), P1=pr(...q);
    arrow(a,P0[0],P0[1],P1[0],P1[1],{color:C.muted,width:1.6,head:0.8});
    const L=pr(...lp); a.note(L[0],L[1]-0.06,name,{tex:true,fs:16,color:C.ink,anchor:'middle'}); };
  ax([0,0,0],[2.0,0,0],'\\psi_1',[2.22,0,0]);
  ax([0,-1.9,0],[0,1.9,0],'\\psi_2',[0,2.15,0]);
  ax([0,0,0],[0,0,1.55],'\\psi_3',[0,0,1.78]);
  GS4V.forEach((s,k)=>{ const Q=pr(...s), F=pr(s[0],s[1],0);
    if(s[2]) seg(a,[F,Q],{dash:'4 5'});
    a.point(Q[0],Q[1],{color:C.in,r:6.5});
    a.note(Q[0]+0.13,Q[1]+0.2,'\\mathbf{s}_'+(k+1),{tex:true,fs:15,color:C.in}); });
  return narrow(a.svg(),56);
}
/* The square against a basis turned by 30 degrees. */
function figBasisChange(){
  const ph=Math.PI/6, u1=[Math.cos(ph),Math.sin(ph)], u2=[-Math.sin(ph),Math.cos(ph)];
  const a=plane({need:[[-2.1,2.1],[-2.0,2.0]],xticksOverride:[],yticksOverride:[]});
  const L=1.85;
  arrow(a,-L*u1[0],-L*u1[1],L*u1[0],L*u1[1],{color:C.h,width:2.2});
  arrow(a,-L*u2[0],-L*u2[1],L*u2[0],L*u2[1],{color:C.h,width:2.2});
  a.note(1.02*L*u1[0]+0.08,1.02*L*u1[1]+0.08,"\\psi_1'",{tex:true,fs:16,color:C.h});
  a.note(1.02*L*u2[0]-0.08,1.02*L*u2[1]+0.06,"\\psi_2'",{tex:true,fs:16,color:C.h,anchor:'end'});
  const c1=u1[0]+u1[1], c2=u2[0]+u2[1];
  seg(a,[[1,1],[c1*u1[0],c1*u1[1]]],{color:C.mid,dash:'4 5',width:1.6});
  seg(a,[[1,1],[c2*u2[0],c2*u2[1]]],{color:C.mid,dash:'4 5',width:1.6});
  SQ.forEach(p=>a.point(p[0],p[1],{color:C.in,r:7}));
  return narrow(a.svg(),50);
}
/* One waveform through the whole translation: s(t) = 1.5 psi1(t) - 0.8 psi2(t),
   the basis over it, the two correlator outputs and the point. */
function figChain(){
  const CH=[[0,1,1.5],[1,2,-0.8]];
  const ax=(h,yr,yl,last,yt)=>TAx({w:560,h,xr:[-0.1,2.3],yr,ynameAtAxis:true,xlabel:last?'t':'',ylabel:yl,
    pad:{l:56,r:26,t:24,b:last?36:12},xt:last?[0,1,2]:null,yticksOverride:yt});
  const a=ax(130,[-1.2,1.9],'s(t),\\;\\psi_1,\\;\\psi_2',false,[-1,0,1]);
  seg(a,outline(HALF1,-0.1,2.3),{color:C.h,width:2.0});
  seg(a,outline(HALF2,-0.1,2.3),{color:C.h,width:2.0,dash:'7 5'});
  a.poly(outline(CH,-0.1,2.3),{color:C.in,width:2.4});
  const c=ax(158,[-1.2,1.9],'c_1(t),\\;c_2(t)',true,[-1,0,1]);
  const c1=t=>t<0?0:1.5*Math.min(t,1), c2=t=>t<1?0:-0.8*Math.min(t-1,1);
  seg(c,Array.from({length:121},(_,i)=>{ const t=-0.1+2.4*i/120; return [t,c1(t)]; }),{color:C.mid,width:2.4});
  seg(c,Array.from({length:121},(_,i)=>{ const t=-0.1+2.4*i/120; return [t,c2(t)]; }),{color:C.mid,width:2.4,dash:'7 5'});
  c.point(2,1.5,{color:C.mid,r:5}); c.point(2,-0.8,{color:C.mid,r:5});
  const d=plane({h:160,need:[[-2,2],[-1.25,1.25]],xticksOverride:[-1,1],yticksOverride:[-1,1]});
  seg(d,[[1.5,0],[1.5,-0.8],[0,-0.8]],{dash:'4 5'});
  d.point(1.5,-0.8,{color:C.in,r:6.5});
  d.note(1.8,-0.58,'\\mathbf{s}=(1.5,\\,-0.8)',{tex:true,fs:15,color:C.in,anchor:'start'});
  return narrow(stack(560,[[a.svg(),130],[c.svg(),158],[d.svg(),160]]),54);
}

/* ---- the gallery figures of the three sections, as on the slides ------------ */
const EXO=o=>Object.assign({w:520,h:250,pad:{l:60,r:26,t:24,b:40},ytarget:3},o);
const galPlane=need=>plane({w:520,h:250,pad:{l:60,r:26,t:24,b:40},need,xticksOverride:[],yticksOverride:[]});
const W2=[1,1,-1,-1,1,1,-1,-1], W5=[1,-1,1,-1,-1,1,-1,1], TC=1/1.2288;
const galWalsh=()=>{ const a=TAx(EXO({xt:[0,2,4,6],xr:[-0.2,7.0],yr:[-1.6,1.6],xlabel:'t\\;(\\mu\\text{s})',ylabel:'w_2(t)\\,w_5(t)',yticksOverride:[-1,0,1]}));
  const segs=W2.map((c,n)=>[n*TC,(n+1)*TC,c*W5[n]]);
  shade(a,pwc(segs),0,8*TC,C.mid,0.2);
  a.poly(outline(segs,-0.2,7.0),{color:C.mid,width:2.2});
  return a.svg(); };
const galWifi=()=>{ const T=3.2, df=1/T, a=TAx(EXO({xt:[0,1,2,3],xr:[-0.1,3.4],yr:[-1.4,1.4],xlabel:'t\\;(\\mu\\text{s})',ylabel:'x_k(t)',yticksOverride:[-1,0,1]}));
  a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*3*df*t):0,{color:C.in,width:2.2,n:700});
  a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*4*df*t):0,{color:C.in,width:1.8,n:700,dash:'6 4'});
  return a.svg(); };
const galDct=()=>{ const a=TAx(EXO({xt:[0,1,2,3,4,5,6,7],xr:[-0.6,8.8],yr:[-0.62,0.62],xlabel:'n\\;(\\text{pixel})',ylabel:'c_2[n]',yticksOverride:[-0.5,0,0.5]}));
  a.stem(Array.from({length:8},(_,n)=>[n,0.5*Math.cos(Math.PI*(2*n+1)*2/16)]),{color:C.h});
  return a.svg(); };
const galKansas=()=>{ const T=1000/300, a=TAx(EXO({xt:[0,1,2,3],xr:[-0.1,3.6],yr:[-1.4,1.4],xlabel:'t\\;(\\text{ms})',ylabel:'s_0(t),\\;s_1(t)',yticksOverride:[-1,0,1]}));
  a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*1.2*t):0,{color:C.in,width:2.2,n:900});
  a.curve(t=>t>=0&&t<=T?Math.cos(2*Math.PI*2.4*t):0,{color:C.in,width:1.6,n:900,dash:'6 4'});
  return a.svg(); };
const qamPts=L=>{ const o=[], s=Math.sqrt(2*(L*L-1)/3);
  for(let i=0;i<L;i++) for(let k=0;k<L;k++) o.push([(2*i-L+1)/s,(2*k-L+1)/s]); return o; };
const galBpsk=()=>{ const a=galPlane([[-1.35,1.35],[-1.2,1.2]]);
  a.point(1,0,{color:C.in,r:6}); a.point(-1,0,{color:C.in,r:6}); return a.svg(); };
const gal8psk=()=>{ const a=galPlane([[-1.35,1.35],[-1.2,1.2]]); circle(a,1);
  for(let i=0;i<8;i++) a.point(Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4),{color:C.in,r:5.5});
  return a.svg(); };
const galQam=(L,r)=>()=>{ const a=galPlane([[-1.35,1.35],[-1.2,1.2]]);
  qamPts(L).forEach(p=>a.point(p[0],p[1],{color:C.in,r})); return a.svg(); };
const EPS=10*Math.PI/180, H1=[1,0.3], H2=[0.8,0.9];
const galIq=()=>{ const a=plane({w:520,h:250,pad:{l:60,r:26,t:24,b:40},need:[[-1.7,1.7],[-1.55,1.55]],
    xlabel:'y_I',ylabel:'y_Q',xticksOverride:[],yticksOverride:[]});
  const sq=[[1,1],[1,-1],[-1,-1],[-1,1],[1,1]], rx=sq.map(([x,y])=>[x,y*Math.cos(EPS)+x*Math.sin(EPS)]);
  seg(a,sq,{color:C.in,dash:'5 4',width:1.4}); seg(a,rx,{color:C.out,width:1.6});
  rx.slice(0,4).forEach(p=>a.point(p[0],p[1],{color:C.out,r:5.5}));
  return a.svg(); };
const galMimo=()=>{ const n1=Math.hypot(...H1), q1=[H1[0]/n1,H1[1]/n1], r=H2[0]*q1[0]+H2[1]*q1[1];
  const g=[H2[0]-r*q1[0],H2[1]-r*q1[1]], ng=Math.hypot(...g), q2=[g[0]/ng,g[1]/ng];
  const a=plane({w:520,h:250,pad:{l:60,r:26,t:24,b:40},need:[[-0.45,1.4],[-0.15,1.15]],
    xlabel:'\\text{antenna }1',ylabel:'\\text{antenna }2',xticksOverride:[1],yticksOverride:[1]});
  arrow(a,0,0,...H1,{color:C.h,width:2.4}); arrow(a,0,0,...H2,{color:C.h,width:2.4});
  arrow(a,0,0,...q1,{color:C.mid,width:1.8,dash:'5 4'}); arrow(a,0,0,...q2,{color:C.mid,width:1.8,dash:'5 4'});
  a.note(1.06,0.28,'\\mathbf{h}_1',{tex:true,fs:14,color:C.h}); a.note(0.86,0.96,'\\mathbf{h}_2',{tex:true,fs:14,color:C.h});
  a.note(-0.33,0.92,'\\mathbf{q}_2',{tex:true,fs:14,color:C.mid,anchor:'end'});
  return a.svg(); };
const galHum=()=>{ const a=TAx(EXO({xt:[0,5,10,15],xr:[-0.3,21],yr:[-1.6,1.6],xlabel:'t\\;(\\text{ms})',ylabel:'m(t)',yticksOverride:[-1,0,1]}));
  a.curve(t=>t>=0&&t<=20?0.5*Math.sin(2*Math.PI*0.45*t)+0.8*Math.sin(2*Math.PI*0.05*t):NaN,{color:C.out,width:1.4,n:1200});
  a.curve(t=>t>=0&&t<=20?0.5*Math.sin(2*Math.PI*0.45*t):NaN,{color:C.mid,width:2.2,n:1200});
  return a.svg(); };
const galLegendre=()=>{ const a=TAx(EXO({xt:[0,25,50,75],xr:[-3,104],yr:[-1.25,1.25],xlabel:'T\\;(^{\\circ}\\text{C})',ylabel:'p_k(u)',yticksOverride:[-1,0,1]}));
  const u=T=>(T-50)/50;
  a.curve(T=>T>=0&&T<=100?1:NaN,{color:C.h,width:2.2});
  a.curve(T=>T>=0&&T<=100?u(T):NaN,{color:C.h,width:2.0,dash:'7 5'});
  a.curve(T=>T>=0&&T<=100?u(T)*u(T)-1/3:NaN,{color:C.h,width:2.0,dash:'2 4'});
  return a.svg(); };

window.C3 = [

/* ---- 3.0 opening (m3-open) --------------------------------------------------- */
{t:'h1', num:'CHAPTER 3', text:'Geometric representation of signal waveforms'},
{t:'p', lead:true, text:'Each waveform of a signal set becomes a point. Energies, distances and the receiver are then read off a picture.'},
{t:'p', text:'The chapter has two results. First, an orthonormal basis turns each waveform into $N$ numbers. Energy is squared length, and the energy of a difference is squared distance.'},
{t:'p', text:'Second, Gram–Schmidt finds a basis for any set, with $N\\le M$. Sets with the same constellation need the same receiver.'},

/* ================================================================ 3.1 ==== */
{t:'h2', num:'3.1', text:'Signals as vectors'},

/* m3-twoaxes */
{t:'h3', text:'Two waveforms, two axes'},
{t:'p', text:'Take two waveforms $s_0(t)$ and $s_1(t)$ that take the values $\\pm1$ on $[0,T]$. The figure draws both and their product.'},
{t:'fig', svg:figTwoAxes, cap:'$s_0(t)$ and $s_1(t)$ take the values $\\pm1$ on $[0,T]$. Their product is $+1$ on two quarters and $-1$ on the other two.'},
{t:'p', text:'Neither waveform is a multiple of the other. No single $\\psi(t)$ writes both as $s_m\\psi(t)$, so the one-number receiver of Chapter 2 does not apply.'},
{t:'p', text:'The receiver computes one number for each waveform, with two correlators.'},
{t:'eqbox', cap:'Two correlators', tex:'y_0=\\int_0^{T}x(t)\\,s_0(t)\\,dt,\\qquad y_1=\\int_0^{T}x(t)\\,s_1(t)\\,dt',
 after:'The pair $(y_0,y_1)$ is a point in a plane.'},
{t:'p', text:'Take $T=1$ and integrate the product $s_0(t)\\,s_1(t)$. It is $+1$ on two quarters and $-1$ on the other two. So the two areas are $0.5$ each, and they cancel.'},
{t:'eqbox', cap:'The product integrates to zero', tex:'\\int_0^{1}s_0(t)\\,s_1(t)\\,dt=0.5-0.5=0'},

/* m3-ortho */
{t:'h3', text:'An orthonormal basis'},
{t:'p', text:'A vector written against the unit axes $\\mathbf{e}_1$ and $\\mathbf{e}_2$ is the list $(a_1,a_2)$. Its length and its angle to another vector come from that list.'},
{t:'fig', svg:figOrtho, cap:'A vector written against the unit axes $\\mathbf{e}_1$ and $\\mathbf{e}_2$ is the list $(a_1,a_2)$. Its length and its angle to another vector come from that list.',
 short:'A vector written against two unit axes.'},
{t:'p', text:'The inner product multiplies matching entries and adds them. The length is the root of the inner product with itself.'},
{t:'eqbox', cap:'Vectors', tex:'\\langle\\mathbf{a},\\mathbf{b}\\rangle=\\sum_{k=1}^{N}a_kb_k,\\qquad \\|\\mathbf{a}\\|=\\sqrt{\\langle\\mathbf{a},\\mathbf{a}\\rangle}'},
{t:'p', text:'For signals the sum becomes an integral.'},
{t:'eqbox', cap:'Signals', tex:'\\langle x,y\\rangle=\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt,\\qquad \\|x\\|^{2}=\\int_{-\\infty}^{\\infty}x^{2}(t)\\,dt=E_x',
 after:'The squared length of a signal is its energy.'},
{t:'p', text:'The set $\\{\\psi_1,\\ldots,\\psi_N\\}$ is <b>orthonormal</b> when the integral of $\\psi_j(t)\\psi_k(t)$ is $1$ for $j=k$ and $0$ for $j\\ne k$.'},
{t:'eqbox', cap:'Orthonormal set', tex:'\\int\\psi_j(t)\\,\\psi_k(t)\\,dt=\\begin{cases}1,&j=k\\\\0,&j\\ne k\\end{cases}',
 after:'Each function has unit energy, and each pair is orthogonal.'},
{t:'p', text:'For example, take $\\psi(t)=c$ on $[0,2]$ and zero elsewhere. Its energy is $\\int_0^{2}c^{2}\\,dt=2c^{2}$. Unit energy needs $2c^{2}=1$, so $c=1/\\sqrt2=0.707$.'},

/* m3-project */
{t:'h3', text:'The coordinates of a waveform'},
{t:'p', text:'One integral for each axis takes the waveform apart into $N$ numbers. This step is called <b>analysis</b>.'},
{t:'eqbox', cap:'Analysis', tex:'s_{ij}=\\int_0^{T}s_i(t)\\,\\psi_j(t)\\,dt,\\qquad j=1,\\ldots,N'},
{t:'p', text:'The $N$ numbers build the waveform back. This step is called <b>synthesis</b>.'},
{t:'eqbox', cap:'Synthesis', tex:'s_i(t)=\\sum_{j=1}^{N}s_{ij}\\,\\psi_j(t),\\qquad \\mathbf{s}_i=(s_{i1},\\ldots,s_{iN})',
 after:'The list $\\mathbf{s}_i$ is the <b>signal vector</b>.'},
{t:'p', text:'The figure shows synthesis on two unit pulses. The waveform $s_1\\psi_1(t)+s_2\\psi_2(t)$ and the point $(s_1,s_2)$ change together.'},
{t:'fig', svg:figProject, cap:'The waveform $s_1\\psi_1(t)+s_2\\psi_2(t)$ and the point $(s_1,s_2)$, drawn for $s_1=1.5$ and $s_2=-1$. The dashed pulses are $\\psi_1$ and $\\psi_2$.',
 short:'The waveform $s_1\\psi_1(t)+s_2\\psi_2(t)$ and its point.'},
{t:'p', text:'For example, take $\\psi_1=1$ on $[0,1)$ and $\\psi_2=1$ on $[1,2)$. Let $s(t)=3$ on $[0,1)$ and $-1$ on $[1,2)$. Each coordinate is one analysis integral.'},
{t:'eqbox', cap:'The coordinates of one waveform', tex:
  '\\begin{aligned}s_1&=\\int_0^{1}3\\cdot1\\,dt=3\\\\s_2&=\\int_1^{2}(-1)\\cdot1\\,dt=-1\\end{aligned}',
 after:'So $\\mathbf{s}=(3,-1)$.'},

/* m3-analyzer */
{t:'h3', text:'The analyzer and the synthesizer'},
{t:'p', text:'The <b>analyzer</b> multiplies the waveform by each $\\psi_j(t)$ and integrates over $[0,T]$. It is a bank of correlators, one for each basis function.'},
{t:'fig', svg:figAnalyzer, cap:'The analyzer: one correlator for each basis function. Its $N$ outputs are the coordinates, and together they form the signal vector $\\mathbf{s}_i$.'},
{t:'p', text:'The receiver of Chapter 4 is this bank of correlators.'},
{t:'p', text:'The <b>synthesizer</b> scales each $\\psi_j(t)$ by $s_{ij}$ and adds. The transmitter can build every waveform of the set from $N$ basis functions.'},
{t:'p', text:'For example, a set of $M=8$ waveforms spans $N=2$ dimensions. The analyzer needs one correlator for each basis function, so it needs $N=2$ correlators. The number of waveforms that share the two axes does not matter.'},

/* m3-inner */
{t:'h3', text:'Inner products are preserved'},
{t:'p', text:'An integral over two waveforms equals a sum over $N$ pairs of coordinates.'},
{t:'eqbox', cap:'Key result: inner products', tex:'\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt=\\sum_{k=1}^{N}x_ky_k=\\langle\\mathbf{x},\\mathbf{y}\\rangle'},
{t:'p', text:'The proof takes three moves. Write $x=\\sum_jx_j\\psi_j$ and $y=\\sum_ky_k\\psi_k$. Move the integral inside both sums. Then use $\\int\\psi_j\\psi_k\\,dt=1$ for $j=k$ and $0$ otherwise.'},
{t:'eqbox', cap:'Proof in three moves', tex:
  '\\begin{aligned}\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt&=\\int_{-\\infty}^{\\infty}\\Bigl(\\sum_{j=1}^{N}x_j\\psi_j(t)\\Bigr)\\Bigl(\\sum_{k=1}^{N}y_k\\psi_k(t)\\Bigr)dt\\\\&=\\sum_{j=1}^{N}\\sum_{k=1}^{N}x_jy_k\\int_{-\\infty}^{\\infty}\\psi_j(t)\\,\\psi_k(t)\\,dt\\\\&=\\sum_{k=1}^{N}x_ky_k=\\langle\\mathbf{x},\\mathbf{y}\\rangle\\end{aligned}',
 after:'In the double sum, each term with $j\\ne k$ is $0$ and each term with $j=k$ keeps $x_ky_k$.'},
{t:'p', text:'For example, take $x=2\\psi_1+\\psi_2$ and $y=\\psi_1-\\psi_2$ on the two unit pulses. So $\\mathbf{x}=(2,1)$ and $\\mathbf{y}=(1,-1)$. The product $x(t)\\,y(t)$ is $2$ on $[0,1)$ and $-1$ on $[1,2)$.'},
{t:'fig', svg:figInner, cap:'$x=2\\psi_1+\\psi_2$ and $y=\\psi_1-\\psi_2$ on the two unit pulses, with their product and its signed area.',
 short:'Two waveforms, their product and its signed area.'},
{t:'eqbox', cap:'The signed area and the coordinates agree', tex:
  '\\int_0^{2}x(t)\\,y(t)\\,dt=2-1=1,\\qquad x_1y_1+x_2y_2=2(1)+1(-1)=1'},

/* m3-energy */
{t:'h3', text:'Energy and distance'},
{t:'p', text:'Put $y=x$ in the key result. Energy is the squared distance from the point to the origin.'},
{t:'eqbox', cap:'Energy', tex:'E_i=\\int_0^{T}s_i^{2}(t)\\,dt=\\sum_{j=1}^{N}s_{ij}^{2}=\\|\\mathbf{s}_i\\|^{2}'},
{t:'p', text:'Apply the key result to the difference $s_i-s_k$, whose vector is $\\mathbf{s}_i-\\mathbf{s}_k$.'},
{t:'eqbox', cap:'Distance', tex:'d_{ik}^{2}=\\|\\mathbf{s}_i-\\mathbf{s}_k\\|^{2}=\\int_0^{T}\\bigl(s_i(t)-s_k(t)\\bigr)^{2}dt'},
{t:'p', text:'In the figure, $\\mathbf{s}_1$ and $\\mathbf{s}_2$ stay on the circle of radius $\\sqrt2$. So both energies stay $2$, and only their distance $d$ changes with the angle between them.'},
{t:'fig', svg:figEnergy, cap:'$\\mathbf{s}_1$ and $\\mathbf{s}_2$ on the circle of radius $\\sqrt2$, drawn with the angle between them at $90^{\\circ}$. Both energies are $2$. Only their distance $d$ changes with the angle.',
 short:'Two points of energy $2$ and their distance.'},
{t:'box', kind:'warn', hd:'Distance, not energy', html:'Noise moves the received point. Two points far apart are hard to confuse, so $d$ decides the error rate. Chapter 4 derives the rule.'},
{t:'p', text:'For example, $\\mathbf{s}_1=(1,1)$ and $\\mathbf{s}_2=(1,-1)$ give $\\mathbf{s}_1-\\mathbf{s}_2=(0,2)$. So $d_{12}=\\sqrt{0^{2}+2^{2}}=2$. Its square, $4$, is the energy of $s_1-s_2$.'},

/* m3-ex-inspect */
{t:'p', text:'Example 3.1 finds a basis for four signals by reading their pieces. The figure shows the four signals and their points.'},
{t:'fig', svg:figInspect, cap:'The four signals of Example 3.1, each constant on $[0,1)$ and on $[1,2)$, and their four points.'},
{t:'ex', hd:'Example 3.1 — a basis by inspection', rows:[
 ['Given','Four signals, each $\\pm1$ on $[0,1)$ and on $[1,2)$, giving all four sign pairs.'],
 ['Find','A basis and the four vectors. How many basis functions?'],
 ['Method','Every signal is built from a pulse on $[0,1)$ and a pulse on $[1,2)$, so two basis functions are enough. Read off the pieces, then check unit energy and orthogonality.'],
 ['Solution','Take $\\psi_1(t)=1$ for $0\\le t<1$ and $\\psi_2(t)=1$ for $1\\le t<2$. Then $\\int\\psi_1^{2}\\,dt=\\int\\psi_2^{2}\\,dt=1$. Also $\\int\\psi_1\\psi_2\\,dt=0$, because the pulses never overlap. Each coordinate is the height on that half times its width $1$. So $\\mathbf{s}_1=(1,1)$, $\\mathbf{s}_2=(1,-1)$, $\\mathbf{s}_3=(-1,1)$ and $\\mathbf{s}_4=(-1,-1)$, with $N=2$.'],
 ['Check','The four points form a square. Each energy is $1^{2}+1^{2}=2$ from the vectors, and $\\int_0^{2}(\\pm1)^{2}\\,dt=2$ from the waveforms.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\psi_1=s_1/\\sqrt{E_1}$ as an axis, not $s_1$ itself. Here $E_1=2$, so an unscaled axis puts every coordinate a factor $\\sqrt2$ off.'},

/* m3-real-vectors */
{t:'h3', text:'Orthogonal signals around us'},
{t:'p', text:'Four everyday systems use orthogonal signal sets.'},
{t:'figrow', n:2, items:[
 {svg:galWalsh, cap:'IS-95 phones share one band, each call with its own Walsh code at $1.2288$ Mchip/s. Two codes multiply to $+1$ on four chips and $-1$ on four, so $\\sum_n w_2[n]\\,w_5[n]=0$.'},
 {svg:galWifi, cap:'Wi-Fi spaces its subcarriers $\\Delta f=312.5$ kHz apart. Over one symbol of $T=1/\\Delta f=3.2\\ \\mu$s, $\\cos(2\\pi k\\Delta f t)$ for $k=3$ and $k=4$ are orthogonal.'}
]},
{t:'figrow', n:2, items:[
 {svg:galDct, cap:'JPEG writes each row of $8$ pixels against the DCT basis $c_k[n]=\\tfrac12\\cos\\bigl(\\pi(2n+1)k/16\\bigr)$, $k\\ge1$. Here $k=2$. The basis is orthonormal, so a row\'s energy is the sum of its squared coefficients.'},
 {svg:galKansas, cap:'The Kansas City standard stored bits on cassette tape at $300$ baud: $4$ cycles of $1200$ Hz for a $0$, $8$ cycles of $2400$ Hz for a $1$. Whole cycles in $T=3.33$ ms make the tones orthogonal.'}
]},
{t:'p', text:'Each system picks signals whose inner product is zero. A correlator matched to one of them gives zero for all the others.'},
{t:'p', text:'Two sinusoids are orthogonal over $T$ when each fits a whole number of cycles in $T$ and the numbers differ.'},
{t:'box', kind:'warn', hd:'The interval', html:'Orthogonality holds over the exact interval. A receiver that integrates over a shifted window lets the signals leak into each other.'},

/* ================================================================ 3.2 ==== */
{t:'h2', num:'3.2', text:'Constellations'},

/* m3-constellation */
{t:'h3', text:'The constellation diagram'},
{t:'p', text:'The <b>constellation diagram</b> is the signal vectors drawn in the space of their basis. It has one point for each waveform and one axis for each basis function.'},
{t:'fig', svg:figConst, cap:'The four signals of Example 3.1 as a constellation, with an energy read as a radius and a distance between two points.',
 short:'The four signals of Example 3.1 as a constellation.'},
{t:'p', text:'Three things are read off the constellation.'},
{t:'ol', items:['Distance to the origin: $\\sqrt{E_i}$.','Distance between two points: the root of the energy of their difference.','Number of axes: the correlators the receiver needs.']},
{t:'p', text:'For example, take the four points at $(\\pm1,\\pm1)$. Neighbours such as $(1,1)$ and $(1,-1)$ differ by $2$ in one coordinate, so $d_{\\min}=2$. The diagonal pairs are $2\\sqrt2=2.83$ apart.'},

/* m3-binary */
{t:'h3', text:'Three binary signal sets as points'},
{t:'p', text:'Two classic binary sets are compared by the distance between their two points. Each has average energy per bit $E_b$.'},
{t:'p', text:'<b>Antipodal</b> signals satisfy $s_2=-s_1$. They need one axis, and $d=2\\sqrt{E_b}$. Polar NRZ and BPSK are antipodal.'},
{t:'p', text:'<b>Orthogonal</b> signals satisfy $\\langle s_1,s_2\\rangle=0$. They need two axes, and $d=\\sqrt{2E_b}$. PPM and FSK are orthogonal.'},
{t:'fig', svg:figBinary, cap:'Three binary sets, each with average energy $E_b$, in units of $\\sqrt{E_b}$: antipodal on the left, orthogonal in the middle and on-off on the right.',
 short:'Three binary signal sets as points.'},
{t:'p', text:'Find the energy each set needs for the same distance $d$. Square the two distance formulas and set them equal.'},
{t:'eqbox', cap:'Energy for equal distance', tex:[
  '4E_b^{\\text{anti}}=d^{2}=2E_b^{\\text{orth}}',
  '\\frac{E_b^{\\text{orth}}}{E_b^{\\text{anti}}}=2=3.01\\ \\text{dB}'],
 after:'Orthogonal signalling needs twice the energy for the same distance.'},
{t:'p', text:'<b>On-off</b> keying sends $0$ or $s(t)$ with equal priors and average energy $E_b$. The average is $E_b$, so $s(t)$ has energy $2E_b$. The points are $0$ and $\\sqrt{2E_b}$, so $d=\\sqrt{2E_b}$.'},

/* m3-passband */
{t:'h3', text:'A cosine and a sine as axes'},
{t:'p', text:'A cosine and a sine of the same carrier form an orthonormal pair.'},
{t:'eqbox', cap:'The two axes', tex:'\\psi_1(t)=\\sqrt{\\tfrac{2}{T}}\\cos(2\\pi f_ct),\\qquad \\psi_2(t)=\\sqrt{\\tfrac{2}{T}}\\sin(2\\pi f_ct),\\qquad 0\\le t\\le T',
 after:'$f_cT$ is a whole number, so each function holds whole cycles in $[0,T]$.'},
{t:'p', text:'The factor $\\sqrt{2/T}$ gives each axis unit energy. Use $2\\cos^{2}a=1+\\cos2a$, then integrate term by term.'},
{t:'eqbox', cap:'Unit energy', tex:
  '\\begin{aligned}\\int_0^{T}\\psi_1^{2}\\,dt&=\\frac{2}{T}\\int_0^{T}\\cos^{2}(2\\pi f_ct)\\,dt\\\\&=\\frac{1}{T}\\int_0^{T}\\bigl[1+\\cos(4\\pi f_ct)\\bigr]\\,dt\\\\&=1+\\frac{\\sin(4\\pi f_cT)}{4\\pi f_cT}=1\\end{aligned}',
 after:'The sine is zero because $4\\pi f_cT$ is a whole multiple of $2\\pi$. The same steps with $2\\sin^{2}a=1-\\cos2a$ give unit energy for $\\psi_2$.'},
{t:'p', text:'The two axes are orthogonal. Use $2\\cos a\\sin a=\\sin2a$.'},
{t:'eqbox', cap:'Orthogonal', tex:
  '\\begin{aligned}\\int_0^{T}\\psi_1\\psi_2\\,dt&=\\frac{2}{T}\\int_0^{T}\\cos(2\\pi f_ct)\\sin(2\\pi f_ct)\\,dt\\\\&=\\frac{1}{T}\\int_0^{T}\\sin(4\\pi f_ct)\\,dt\\\\&=\\frac{1-\\cos(4\\pi f_cT)}{4\\pi f_cT}=0\\end{aligned}',
 after:'The product holds $2f_cT$ whole cycles, and $\\cos(4\\pi f_cT)=1$.'},
{t:'p', text:'The waveform $\\sqrt{2E/T}\\cos(2\\pi f_ct-\\theta)$ sits at $(\\sqrt{E}\\cos\\theta,\\sqrt{E}\\sin\\theta)$. Expand the cosine of a difference to see it.'},
{t:'eqbox', cap:'A carrier with phase $\\theta$', tex:
  '\\begin{aligned}s(t)&=\\sqrt{\\tfrac{2E}{T}}\\cos(2\\pi f_ct-\\theta)\\\\&=\\sqrt{\\tfrac{2E}{T}}\\bigl[\\cos\\theta\\cos(2\\pi f_ct)+\\sin\\theta\\sin(2\\pi f_ct)\\bigr]\\\\&=\\sqrt{E}\\cos\\theta\\,\\psi_1(t)+\\sqrt{E}\\sin\\theta\\,\\psi_2(t)\\end{aligned}'},
{t:'fig', svg:figPassband, cap:'The waveform $\\sqrt{2E/T}\\cos(2\\pi f_ct-\\theta)$ and its point $(\\sqrt{E}\\cos\\theta,\\sqrt{E}\\sin\\theta)$, drawn for $\\theta=45^{\\circ}$, $E=1$ and $f_cT=3$.',
 short:'A carrier with phase $\\theta$ and its point.'},
{t:'p', text:'For example, take $\\theta=90^{\\circ}$. Since $\\cos(x-90^{\\circ})=\\sin x$, $s(t)=\\sqrt{E}\\,\\psi_2(t)$. Its point is $(0,\\sqrt{E})$.'},

/* m3-ex-qpsk */
{t:'p', text:'Example 3.2 finds the basis and the constellation of four carrier waveforms, and compares it with the pulse set of Example 3.1.'},
{t:'ex', hd:'Example 3.2 — four carrier waveforms', rows:[
 ['Given','For $0\\le t\\le T$ and whole $f_cT$: $s_{1,2}(t)=\\mp\\sqrt{2/T}\\cos(2\\pi f_ct)+\\sqrt{2/T}\\sin(2\\pi f_ct)$ and $s_{3,4}(t)=\\mp\\sqrt{2/T}\\cos(2\\pi f_ct)-\\sqrt{2/T}\\sin(2\\pi f_ct)$.'],
 ['Find','The four points, and the energy of each.'],
 ['Method','By inspection, every waveform is already written in the cosine and sine basis. The coefficients are the coordinates: $s_i(t)=s_{i1}\\psi_1(t)+s_{i2}\\psi_2(t)$ with $s_{ij}=\\pm1$.'],
 ['Solution','$\\mathbf{s}_1=(-1,1)$, $\\mathbf{s}_2=(1,1)$, $\\mathbf{s}_3=(-1,-1)$ and $\\mathbf{s}_4=(1,-1)$. Each vector has two entries $\\pm1$, so each energy is $1+1=2$. The points form a square with $d_{\\min}=2$.'],
 ['Check','This is the square of the four pulse signals of Example 3.1. The waveforms differ, and the picture is the same.']
]},
{t:'fig', svg:figExQpsk, cap:'The four waveforms of Example 3.2 as points on the axes $\\psi_1$ and $\\psi_2$.'},

/* m3-remarks */
{t:'h3', text:'Geometric equivalence of signal sets'},
{t:'p', text:'Different waveform sets can have the same constellation. They are called <b>geometrically equivalent</b>. They then need the same receiver and have the same error probability in white Gaussian noise.'},
{t:'fig', svg:figRemarks, cap:'The pulse set and the carrier set. Each panel keeps its vector: its pair of pulses is dashed and its carrier waveform is solid. The constellation below is the same for both.',
 short:'The pulse set and the carrier set share one constellation.'},
{t:'box', kind:'warn', hd:'Bandwidth', html:'The constellation does not fix the bandwidth. The pulse set occupies frequencies near $f=0$, and the carrier set occupies frequencies near $f_c$.'},
{t:'p', text:'So two sets with the same constellation can differ in bandwidth. Error probability and receiver follow from the points. Bandwidth follows from the waveform shapes.'},

/* m3-psk */
{t:'h3', text:'Points on a circle'},
{t:'p', text:'$M$ equal-energy carrier waveforms at equally spaced phases form the signal set below.'},
{t:'eqbox', cap:'The signal set', tex:
  '\\begin{aligned}s_i(t)&=A\\cos\\!\\left(2\\pi f_ct-\\tfrac{2\\pi i}{M}\\right),\\quad i=0,\\ldots,M-1\\\\\\mathbf{s}_i&=\\sqrt{E}\\left(\\cos\\tfrac{2\\pi i}{M},\\ \\sin\\tfrac{2\\pi i}{M}\\right),\\quad E=\\tfrac{A^{2}T}{2}\\end{aligned}',
 after:'Every waveform has the same energy, so every point lies on one circle. The second line is the carrier result above with $\\theta=2\\pi i/M$ and $A=\\sqrt{2E/T}$.'},
{t:'p', text:'Two neighbours are $2\\pi/M$ apart in angle. The chord of that angle on a circle of radius $\\sqrt{E}$ is $d_{\\min}$. To find it, square the length of $\\mathbf{s}_0-\\mathbf{s}_1$ and use $1-\\cos2a=2\\sin^{2}a$.'},
{t:'eqbox', cap:'Nearest neighbours', tex:[
  '\\begin{aligned}d_{\\min}^{2}&=E\\Bigl[\\bigl(1-\\cos\\tfrac{2\\pi}{M}\\bigr)^{2}+\\sin^{2}\\tfrac{2\\pi}{M}\\Bigr]\\\\&=E\\Bigl[2-2\\cos\\tfrac{2\\pi}{M}\\Bigr]\\\\&=4E\\sin^{2}\\tfrac{\\pi}{M}\\end{aligned}',
  'd_{\\min}=2\\sqrt{E}\\,\\sin\\frac{\\pi}{M}'],
 after:'The middle step uses $\\cos^{2}a+\\sin^{2}a=1$.'},
{t:'p', text:'All $M$ points share the circle of radius $\\sqrt{E}$. Each doubling of $M$ brings neighbours closer.'},
{t:'fig', svg:figPsk, cap:'$M=8$ points on the circle of radius $\\sqrt{E}$, here $E=1$, and the nearest pair.'},
{t:'p', text:'For example, 8-PSK with $E=1$ gives $d_{\\min}=2\\sin(\\pi/8)=2(0.383)=0.765$.'},

/* m3-real-constellation */
{t:'h3', text:'Constellations around us'},
{t:'p', text:'Four real systems, each drawn at average energy $1$.'},
{t:'figrow', n:2, items:[
 {svg:galBpsk, cap:'GPS satellites send their C/A code with BPSK on $1575.42$ MHz. Two points, $1$ bit a symbol, $d=2\\sqrt{E}$.'},
 {svg:gal8psk, cap:'Satellite television (DVB-S2) can use 8PSK: $3$ bits a symbol on one circle, with $d_{\\min}=2\\sqrt{E}\\sin(\\pi/8)=0.765\\sqrt{E}$.'}
]},
{t:'figrow', n:2, items:[
 {svg:galQam(4,5), cap:'Wi-Fi at $36$ Mb/s uses 16-QAM, $4$ bits a symbol. Scaled to $E_{\\mathrm{avg}}=1$, the grid step is $d_{\\min}=2/\\sqrt{10}=0.632$.'},
 {svg:galQam(8,3.6), cap:'At $54$ Mb/s Wi-Fi uses 64-QAM, $6$ bits a symbol. With $E_{\\mathrm{avg}}=1$, $d_{\\min}=2/\\sqrt{42}=0.309$.'}
]},
{t:'p', text:'$M$ points carry $\\log_2M$ bits a symbol. Each doubling of $M$ adds one bit.'},
{t:'p', text:'All four are drawn with $E_{\\mathrm{avg}}=1$. More points in the same energy must sit closer together.'},
{t:'box', kind:'warn', hd:'Smaller distance', html:'$d_{\\min}$ falls from $2$ for BPSK to $0.309$ for 64-QAM. Closer points need a cleaner channel.'},

/* ================================================================ 3.3 ==== */
{t:'h2', num:'3.3', text:'The Gram–Schmidt procedure'},

/* m3-gs */
{t:'h3', text:'The Gram–Schmidt steps'},
{t:'p', text:'The <b>Gram–Schmidt procedure</b> finds an orthonormal basis for any set of signals. The first axis is the first signal scaled to unit energy.'},
{t:'eqbox', cap:'Step 1', tex:'E_1=\\int s_1^{2}(t)\\,dt,\\qquad \\psi_1(t)=\\frac{s_1(t)}{\\sqrt{E_1}}'},
{t:'p', text:'For each later signal, remove what the earlier axes already hold. Then scale the remainder to unit energy.'},
{t:'eqbox', cap:'Step $k$', tex:[
  's_{ki}=\\int s_k(t)\\,\\psi_i(t)\\,dt,\\qquad g_k(t)=s_k(t)-\\sum_{i=1}^{k-1}s_{ki}\\,\\psi_i(t)',
  '\\psi_k(t)=\\frac{g_k(t)}{\\sqrt{E_{g_k}}},\\qquad E_{g_k}=\\int g_k^{2}(t)\\,dt']},
{t:'p', text:'The figure runs the procedure on two signals.'},
{t:'fig', svg:figGs, cap:'The procedure on two signals. The part of $s_2$ along $\\psi_1$ is removed. The remainder $g_2$, scaled to unit length, is $\\psi_2$.'},
{t:'box', kind:'warn', hd:'Stop rule', html:'If $g_k(t)=0$, then $s_k$ is a combination of earlier signals and adds no axis. So $N\\le M$, with $N=M$ only when no signal is a combination of the others.'},
{t:'p', text:'For example, let $s_2$ have energy $25$ and $s_{21}=3$. The remainder $g_2$ is perpendicular to $\\psi_1$, so the squared lengths add: $E_2=s_{21}^{2}+E_{g_2}$.'},
{t:'eqbox', cap:'The energy of the remainder', tex:'E_{g_2}=E_2-s_{21}^{2}=25-3^{2}=16'},

/* m3-ex-gs */
{t:'p', text:'Example 3.3 runs the procedure on three pulses. It finds that two axes are enough.'},
{t:'ex', hd:'Example 3.3 — Gram–Schmidt for three pulses', rows:[
 ['Given','$s_1=1$ on $[0,2)$, $s_2=1$ on $[2,3)$ and $s_3=1$ on $[0,3)$, each zero elsewhere.'],
 ['Find','The basis and the vectors. How many axes?'],
 ['Method','Run Gram–Schmidt in the order $s_1,s_2,s_3$.'],
 ['Steps 1 and 2','$E_1=\\int_0^{2}1^{2}\\,dt=2$, so $\\psi_1=\\tfrac{1}{\\sqrt2}$ on $[0,2)$. Then $s_{21}=\\int s_2\\psi_1\\,dt=0$, because the two never overlap. So $g_2=s_2$ and $\\psi_2=1$ on $[2,3)$.'],
 ['Step 3','$\\psi_1$ is zero on $[2,3)$, so $s_{31}=\\int_0^{2}1\\cdot\\tfrac{1}{\\sqrt2}\\,dt=\\sqrt2$. Also $s_{32}=\\int_2^{3}1\\cdot1\\,dt=1$. Then $g_3=s_3-\\sqrt2\\,\\psi_1-\\psi_2=0$.'],
 ['Solution','$\\mathbf{s}_1=(\\sqrt2,0)$, $\\mathbf{s}_2=(0,1)$ and $\\mathbf{s}_3=(\\sqrt2,1)$. Two axes are enough: $s_3=s_1+s_2$, so its remainder is zero and it adds no axis.'],
 ['Check','Energies from the vectors are $2$, $1$ and $3$. They are the same as $\\int s_i^{2}\\,dt$: height $1$ over lengths $2$, $1$ and $3$.']
]},
{t:'fig', svg:figExGs, cap:'Each row holds one signal of Example 3.3, dashed, with the basis function it produces. The third leaves nothing: $g_3=0$.',
 short:'Gram–Schmidt for three pulses.'},

/* m3-ex-gs-b */
{t:'p', text:'Example 3.4 runs the procedure on four signals that span three dimensions.'},
{t:'ex', hd:'Example 3.4 — four signals, three axes', rows:[
 ['Given','$s_1=1$ on $[0,2)$. $s_2=1$ on $[0,1)$ and $-1$ on $[1,2)$. $s_3=-1$ on $[0,1)$ and $1$ on $[1,3)$. $s_4=1$ on $[0,3)$. Each is zero elsewhere.'],
 ['Find','How many dimensions does the set span?'],
 ['Method','Run Gram–Schmidt in the order $s_1,s_2,s_3,s_4$. Each coordinate is a sum of piece heights times piece widths.'],
 ['Steps 1 and 2','$E_1=\\int_0^{2}1^{2}\\,dt=2$, so $\\psi_1=s_1/\\sqrt2$. Then $s_{21}=\\tfrac{1}{\\sqrt2}(1-1)=0$, so $g_2=s_2$, with energy $2$, and $\\psi_2=s_2/\\sqrt2$.'],
 ['Step 3','$s_{31}=\\tfrac{1}{\\sqrt2}(-1+1)=0$ and $s_{32}=\\tfrac{1}{\\sqrt2}(-1-1)=-\\sqrt2$. Then $g_3=s_3+\\sqrt2\\,\\psi_2=s_3+s_2$. It is $1$ on $[2,3)$ and zero elsewhere, with energy $1$, so $\\psi_3=g_3$.'],
 ['Step 4','$s_4=s_1+s_2+s_3$, so $g_4=0$ and $s_4$ adds no axis. Its coordinates are $s_{41}=\\tfrac{1}{\\sqrt2}(1+1)=\\sqrt2$, $s_{42}=\\tfrac{1}{\\sqrt2}(1-1)=0$ and $s_{43}=\\int_2^{3}1\\,dt=1$.'],
 ['Solution','$\\mathbf{s}_1=(\\sqrt2,0,0)$, $\\mathbf{s}_2=(0,\\sqrt2,0)$, $\\mathbf{s}_3=(0,-\\sqrt2,1)$ and $\\mathbf{s}_4=(\\sqrt2,0,1)$. The set spans $N=3$ dimensions.'],
 ['Check','Energies from the vectors are $2$, $2$, $3$ and $3$, equal to $\\int s_i^{2}\\,dt$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use one axis for each independent signal, not one for each signal, so $N\\le M$. Here $g_4=0$, so $N=3$, not $M=4$.'},
{t:'p', text:'The figure draws the four vectors in three dimensions.'},
{t:'fig', svg:figExGsB, cap:'Four signals need three axes, seen here from an angle of $30^{\\circ}$. $\\mathbf{s}_4$ sits one unit above $\\mathbf{s}_1$, along $\\psi_3$.',
 short:'Four signals need three axes.'},

/* m3-basis-change */
{t:'h3', text:'The basis is not unique'},
{t:'p', text:'Another orthonormal basis of the same space turns or reflects the axes. Taking the signals in another order in Gram–Schmidt gives such a basis.'},
{t:'p', text:'The coordinates change. The quantities below do not.'},
{t:'eqbox', cap:'Unchanged', tex:'N,\\qquad \\|\\mathbf{s}_i\\|^{2}=E_i,\\qquad \\langle\\mathbf{s}_i,\\mathbf{s}_k\\rangle,\\qquad \\|\\mathbf{s}_i-\\mathbf{s}_k\\|',
 after:'Each is an integral of the waveforms, and the waveforms did not change.'},
{t:'p', text:'The figure turns the axes by $30^{\\circ}$. The coordinates of $\\mathbf{s}_1=(1,1)$ become $(1.37,0.37)$. The four points and their distances stay.'},
{t:'fig', svg:figBasisChange, cap:'The axes $\\psi_1\'$ and $\\psi_2\'$ turned by $30^{\\circ}$, where $\\mathbf{s}_1=(1.37,0.37)$. The coordinates of $\\mathbf{s}_1$ change. The four points and their distances do not.',
 short:'The square against a turned basis.'},
{t:'p', text:'For example, turn the axes by $45^{\\circ}$. Then $\\psi_1\'=(\\psi_1+\\psi_2)/\\sqrt2$ and $\\psi_2\'=(\\psi_2-\\psi_1)/\\sqrt2$.'},
{t:'eqbox', cap:'The new coordinates of $\\mathbf{s}_1=(1,1)$', tex:[
  '\\langle\\mathbf{s}_1,\\psi_1\'\\rangle=\\frac{1+1}{\\sqrt2}=\\sqrt2',
  '\\langle\\mathbf{s}_1,\\psi_2\'\\rangle=\\frac{-1+1}{\\sqrt2}=0'],
 after:'$\\psi_1\'$ points along $(1,1)$, so all the length $\\sqrt2$ of $\\mathbf{s}_1$ lies on it. The new coordinates are $(\\sqrt2,0)$.'},

/* m3-real-gs */
{t:'h3', text:'Gram–Schmidt around us'},
{t:'p', text:'Four real systems use the Gram–Schmidt step.'},
{t:'figrow', n:2, items:[
 {svg:galIq, cap:'A receiver whose sine branch is $10^{\\circ}$ off reads QPSK as a sheared square, $y_Q=y\\cos10^{\\circ}+x\\sin10^{\\circ}$. Gram–Schmidt removes the $\\sin10^{\\circ}=0.174$ leak and restores the dashed square.'},
 {svg:galMimo, cap:'A two-antenna Wi-Fi receiver orthogonalizes the channel columns $\\mathbf{h}_1=(1,0.3)$ and $\\mathbf{h}_2=(0.8,0.9)$ before detection. The result $\\mathbf{q}_1,\\mathbf{q}_2$ is the QR factorization.'}
]},
{t:'figrow', n:2, items:[
 {svg:galHum, cap:'A hum filter projects the microphone signal $m(t)$ on a $50$ Hz reference $r(t)$ over $20$ ms. The coefficient $\\langle m,r\\rangle/\\|r\\|^{2}=0.8$, and $m-0.8\\,r$ leaves the $450$ Hz tone.'},
 {svg:galLegendre, cap:'A sensor fit over $0$ to $100\\ ^{\\circ}$C uses $u=(T-50)/50$. Gram–Schmidt on $1$, $u$, $u^{2}$ over $[-1,1]$ gives the orthogonal set $1$, $u$, $u^{2}-\\tfrac13$.'}
]},
{t:'p', text:'Each case subtracts the projection on a known signal. That is step $k$ of Gram–Schmidt, $g_k=s_k-\\sum_i s_{ki}\\psi_i$.'},
{t:'p', text:'What is left is orthogonal to everything removed. It holds only what is new in the signal.'},
{t:'box', kind:'warn', hd:'The order', html:'Starting from $\\mathbf{h}_2$ instead of $\\mathbf{h}_1$ gives other axes. They span the same plane.'},

/* ================================================================ 3.4 ==== */
{t:'h2', num:'3.4', text:'Summary'},

/* m3-chain */
{t:'h3', text:'From waveforms to points'},
{t:'p', text:'One waveform goes through the whole translation: basis, correlators and point. The figure uses $s(t)=1.5\\psi_1(t)-0.8\\psi_2(t)$ on the two unit pulses.'},
{t:'fig', svg:figChain, cap:'The waveform $s(t)$ over the basis $\\psi_1$ and $\\psi_2$ (dashed), the correlator outputs $c_1(t)$ and $c_2(t)$ (dashed), and the point. Each correlator integrates $s(t)\\,\\psi_j(t)$. Its value at $t=2$ is one coordinate of the point.',
 short:'From a waveform to its point.'},
{t:'p', text:'The translation takes four moves.'},
{t:'ol', items:['Find a basis, by inspection or by Gram–Schmidt.','Correlate each waveform with each $\\psi_j$.','Draw the vectors as points.','Read energies and distances off the picture.']},
{t:'p', text:'The receiver of Chapter 4 correlates, as the analyzer does, and then picks a point. Its error probability depends only on the distances between the points.'},
{t:'p', text:'For example, a set of $M=16$ waveforms spans $N=2$ dimensions. The receiver needs one correlator for each basis function, so $N=2$ correlators.'},

/* m3-quick */
{t:'h3', text:'Quick check'},
{t:'p', text:'Six short predictions. Each answer follows with its reason.'},
{t:'q', n:'1.', text:'Two pulses never overlap in time. What is their inner product?', ans:'$0$. Where one is nonzero the other is zero, so the product is zero everywhere.'},
{t:'q', n:'2.', text:'$\\psi(t)=c$ on $[0,4]$ has unit energy when $c$ is what?', ans:'$1/2$. $4c^{2}=1$, so $c=1/2$.'},
{t:'q', n:'3.', text:'$s(t)=2\\psi_1(t)-3\\psi_2(t)$ on an orthonormal basis. What is its energy?', ans:'$13$. $\\|\\mathbf{s}\\|^{2}=2^{2}+(-3)^{2}=13$.'},
{t:'q', n:'4.', text:'$\\mathbf{s}_1=(1,2)$ and $\\mathbf{s}_2=(4,6)$. What is their distance?', ans:'$5$. $\\sqrt{3^{2}+4^{2}}=\\sqrt{25}=5$.'},
{t:'q', n:'5.', text:'Five waveforms are all multiples of one pulse. What $N$ does Gram–Schmidt give?', ans:'$N=1$. After the first axis every remainder is zero.'},
{t:'q', n:'6.', text:'QPSK has $E=2$. What is its $d_{\\min}=2\\sqrt{E}\\sin(\\pi/4)$?', ans:'$2$. $2\\sqrt2\\,(0.707)=2$.'},

/* m3-synth */
{t:'h3', text:'Summary of results'},
{t:'table', cap:'Summary of Chapter 3: the geometric representation of signal waveforms.', head:['Result','Statement','Anchor'], rows:[
 ['Orthonormal set','functions with $\\int\\psi_j\\psi_k\\,dt=1$ for $j=k$ and $0$ for $j\\ne k$: unit energy, and every pair orthogonal','PS CH8.1'],
 ['Coordinate','$s_{ij}=\\int_0^{T}s_i(t)\\,\\psi_j(t)\\,dt$, one correlator for each basis function','PS CH8.1'],
 ['Synthesis','$s_i(t)=\\sum_{j=1}^{N}s_{ij}\\,\\psi_j(t)$. The vector $\\mathbf{s}_i$ holds the whole waveform','PS CH8.1'],
 ['Inner products','preserved: $\\int x(t)\\,y(t)\\,dt=\\sum_kx_ky_k$','PS CH8.1'],
 ['Energy','$E_i=\\|\\mathbf{s}_i\\|^{2}$, the squared distance from its point to the origin','PS CH8.1'],
 ['Distance','$d_{ik}=\\|\\mathbf{s}_i-\\mathbf{s}_k\\|$, the root of $\\int(s_i-s_k)^{2}\\,dt$','PS CH8.1'],
 ['Binary sets','antipodal is further apart, $d=2\\sqrt{E_b}$ against $\\sqrt{2E_b}$. Orthogonal needs twice the energy, $3$ dB, for the same distance','PS CH8.2'],
 ['Carrier axes','a cosine and a sine are orthogonal over $[0,T]$ when $f_cT$ is a whole number. Scaled by $\\sqrt{2/T}$ they are an orthonormal pair','PS CH8.6.1'],
 ['M-PSK','$d_{\\min}=2\\sqrt{E}\\sin(\\pi/M)$. All $M$ points lie on the circle of radius $\\sqrt{E}$','PS CH8.6.1'],
 ['Gram–Schmidt step','$g_k=s_k-\\sum_{i<k}s_{ki}\\psi_i$, then $\\psi_k=g_k/\\sqrt{E_{g_k}}$. A zero $g_k$ adds no axis','PS CH8.1'],
 ['Dimension','$N\\le M$, with $N=M$ only when no signal is a combination of the others','PS CH8.1'],
 ['Change of basis','only the coordinates change. $N$, the energies and the distances stay, and so do the receiver and its error probability','PS CH8.1']
]},
{t:'p', text:'The method: find a basis, correlate to get the coordinates, and draw the constellation. Chapter 4 detects a received point by its distances to these points.'},

/* m3-projects */
{t:'h3', text:'Projects to try'},
{t:'p', text:'Four optional projects use the chapter on simulated signals. Each gives an aim, what it practises, steps and what to look for.'},
{t:'box', kind:'note', hd:'Gram–Schmidt on noisy waveforms', html:'Run Gram–Schmidt on sampled waveforms and see how noise changes the count of dimensions. It practises Gram–Schmidt on samples instead of formulas. It shows why a tolerance is needed to call a remainder zero, and how to count the dimensions of a signal set.<br>Steps: Sample the three pulses of Example 3.3 at $1000$ points. Run Gram–Schmidt and print the energy of each remainder. Add a little Gaussian noise to each signal and run it again. Raise the tolerance until the count returns to $2$.<br>Look for: without noise the third remainder is zero. With noise it is small but not zero, so a strict test finds three axes.'},
{t:'box', kind:'note', hd:'Share a channel with Walsh codes', html:'Send two users\' bits at the same time and separate them with orthogonal codes. It practises Walsh codes as an orthogonal set, correlation as the analyzer, and what breaks when the codes lose their alignment.<br>Steps: Build the $8\\times8$ Hadamard matrix and take two of its rows as codes. Map each user\'s bits to $\\pm1$ and multiply by that user\'s code. Add the two signals and correlate the sum with each code. Delay one user by one chip and repeat.<br>Look for: aligned, each correlator returns only its own user\'s bit. With a one-chip delay the other user leaks in.'},
{t:'box', kind:'note', hd:'Orthogonal carriers with the FFT', html:'Place symbols on orthogonal subcarriers and recover them, as OFDM does. It practises sinusoids with whole cycles as an orthogonal basis, with the inverse FFT as the synthesizer and the FFT as the analyzer. It shows why a frequency offset breaks orthogonality.<br>Steps: Choose $16$ QPSK symbols, one for each subcarrier. Build the time signal with an inverse FFT of length $64$. Recover the symbols with an FFT and plot them. Shift the frequency by a tenth of the spacing and plot again.<br>Look for: the points come back exactly. With the offset each point spreads into a small cloud, because the carriers leak into each other.'},
{t:'box', kind:'note', hd:'A constellation zoo', html:'Compare the smallest distance of many signal sets at the same average energy. It practises normalizing a constellation to average energy $1$, computing $d_{\\min}$ from all pairs of points, and the trade between bits a symbol and distance.<br>Steps: Build BPSK, QPSK, 8-PSK, 16-PSK, 16-QAM and 64-QAM. Scale each to average energy $1$. Compute $d_{\\min}$ for each and plot it against $\\log_2M$. Compare 16-PSK with 16-QAM.<br>Look for: $d_{\\min}$ falls as bits are added. At $16$ points, QAM keeps its points further apart than PSK.'}

];
})();
